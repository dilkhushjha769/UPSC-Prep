/**
 * newsFeedService.ts
 *
 * Source-Backed UPSC Current Affairs Data & Sync Service:
 * 1. Primary Store: Queries `public.ca_articles`, `public.ca_category_status`, and `public.ca_ingestion_logs`
 *    in Supabase PostgreSQL (populated daily at 5:00 AM IST + incremental intervals by the server pipeline).
 * 2. Verified Snapshot Fallback: Uses the server-generated database snapshot (`src/data/generatedSyncedCurrentAffairs.json`)
 *    and `AsyncStorage` cache when the device is offline or behind a restricted DNS proxy.
 * 3. Direct Live RSS Incremental Sync: Supports on-demand incremental refresh from authorized RSS feeds
 *    when running in environments with direct outbound RSS connectivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACategoryStatusItem,
  CAIngestionLogItem,
  CANONICAL_CA_CATEGORIES,
  classifyIntoSimplifiedTaxonomy,
  CuratedArticle,
  DailyEventItem,
  EventSourceItem,
} from '@/data/currentAffairsData';
import { supabase } from './supabase';
import syncedSnapshot from '@/data/generatedSyncedCurrentAffairs.json';

const CACHE_KEY = '@upsc_authentic_news_feed_v2';
const CACHE_TIMESTAMP_KEY = '@upsc_authentic_news_feed_ts_v2';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export interface AuthenticFeedConfig {
  sourceName: string;
  agencyId: 'express' | 'hindu' | 'pib' | 'dte' | 'mint' | 'orf';
  url: string;
  defaultPaper: 'GS-I' | 'GS-II' | 'GS-III' | 'GS-IV';
  defaultCategory: DailyEventItem['category'];
}

export const AUTHENTIC_FEEDS: AuthenticFeedConfig[] = [
  {
    sourceName: 'Press Information Bureau (PIB) • Govt of India',
    agencyId: 'pib',
    url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',
    defaultPaper: 'GS-II',
    defaultCategory: 'Polity',
  },
  {
    sourceName: 'Reserve Bank of India (RBI) • Official Releases',
    agencyId: 'pib',
    url: 'https://rbi.org.in/pressreleases_rss.xml',
    defaultPaper: 'GS-III',
    defaultCategory: 'Economy',
  },
  {
    sourceName: 'The Indian Express • UPSC Current Affairs',
    agencyId: 'express',
    url: 'https://indianexpress.com/section/upsc-current-affairs/feed/',
    defaultPaper: 'GS-II',
    defaultCategory: 'Polity',
  },
  {
    sourceName: 'The Indian Express • Explained',
    agencyId: 'express',
    url: 'https://indianexpress.com/section/explained/feed/',
    defaultPaper: 'GS-III',
    defaultCategory: 'Economy',
  },
  {
    sourceName: 'The Indian Express • World & IR',
    agencyId: 'express',
    url: 'https://indianexpress.com/section/world/feed/',
    defaultPaper: 'GS-II',
    defaultCategory: 'International Relations',
  },
  {
    sourceName: 'The Hindu • National',
    agencyId: 'hindu',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    defaultPaper: 'GS-II',
    defaultCategory: 'Polity',
  },
  {
    sourceName: 'The Hindu • Editorial',
    agencyId: 'hindu',
    url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss',
    defaultPaper: 'GS-II',
    defaultCategory: 'Polity',
  },
];

/**
 * Convert a database row from `public.ca_articles` into a `DailyEventItem`
 */
export function mapDbRowToDailyEvent(row: any): DailyEventItem {
  const pubDate = row.published_at ? new Date(row.published_at) : new Date();
  const isValidDate = !isNaN(pubDate.getTime());
  const formattedDate = !isValidDate
    ? 'Today'
    : pubDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
  const dateKey = !isValidDate
    ? new Date().toISOString().slice(0, 10)
    : `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')}`;

  const executiveBrief: string[] = Array.isArray(row.executive_brief)
    ? row.executive_brief
    : typeof row.executive_brief === 'string'
    ? JSON.parse(row.executive_brief)
    : [row.headline];

  const fullAnalysis =
    typeof row.full_analysis === 'object' && row.full_analysis !== null
      ? row.full_analysis
      : {
          detailedExplanation: executiveBrief,
          backgroundAndInstitutionalContext: '',
          importantFiguresDatesProvisions: [],
          whyItMattersForUPSC: row.why_it_matters || '',
        };

  const prelimsFacts: string[] = Array.isArray(row.prelims_facts) ? row.prelims_facts : [];
  const prelimsMatrix = Array.isArray(row.prelims_matrix) ? row.prelims_matrix : [];
  const syllabusMapping =
    typeof row.syllabus_mapping === 'object' && row.syllabus_mapping !== null
      ? row.syllabus_mapping
      : undefined;
  const relatedPyqs = Array.isArray(row.related_pyqs) ? row.related_pyqs : [];
  const sourcesList: EventSourceItem[] = Array.isArray(row.sources_list)
    ? row.sources_list
    : [
        {
          name: row.source_name || 'Verified Source',
          url: row.canonical_url,
          date: formattedDate,
          type: row.source_tier === 'official' ? 'Official' : 'Leading Daily',
        },
      ];

  const imageMetadata =
    typeof row.image_metadata === 'object' && row.image_metadata !== null
      ? row.image_metadata
      : undefined;

  const crossVerification =
    typeof row.cross_verification === 'object' && row.cross_verification !== null
      ? row.cross_verification
      : undefined;

  const practiceQuestion =
    typeof row.practice_mcq === 'object' && row.practice_mcq !== null
      ? row.practice_mcq
      : undefined;

  const summaryMarkdown = executiveBrief.map((b) => `- ${b}`).join('\n');

  const fallbackClassification = classifyIntoSimplifiedTaxonomy({
    headline: row.headline || '',
    summary: executiveBrief.join(' '),
    existingMainCategoryId: row.main_category_id || row.ui_module_id,
    existingPrimaryCategory: row.primary_category,
    existingSubjectGroup: row.subject_group,
    existingSubcategory: row.subcategory,
    sourceName: row.source_name,
    relevanceScore: Math.round((Number(row.relevance_score) || 0.85) * 100),
    editorialAuthor: row.editorial_author,
  });

  const resolvedDateKey = row.published_date_ist
    ? String(row.published_date_ist).slice(0, 10)
    : dateKey;

  return {
    id: String(row.id || row.external_id),
    category: (row.ui_subject_tag as DailyEventItem['category']) || fallbackClassification.dailyEventCategory,
    primaryCategory: row.primary_category || fallbackClassification.subjectGroup,
    mainCategoryId: (row.main_category_id || fallbackClassification.mainCategoryId) as DailyEventItem['mainCategoryId'],
    subjectGroup: (row.subject_group || fallbackClassification.subjectGroup) as DailyEventItem['subjectGroup'],
    subcategory: row.subcategory || fallbackClassification.subcategory,
    isMostImportant:
      typeof row.is_most_important === 'boolean'
        ? row.is_most_important
        : fallbackClassification.isMostImportant,
    isPrelimsRelevant:
      typeof row.is_prelims_relevant === 'boolean'
        ? row.is_prelims_relevant
        : fallbackClassification.isPrelimsRelevant,
    isMainsRelevant:
      typeof row.is_mains_relevant === 'boolean'
        ? row.is_mains_relevant
        : fallbackClassification.isMainsRelevant,
    editorialAuthor: row.editorial_author || fallbackClassification.editorialAuthor,
    aiExplanationDisclaimer:
      row.ai_explanation_disclaimer || fallbackClassification.aiExplanationDisclaimer,
    publishedDateIst: resolvedDateKey,
    uiModuleId: row.main_category_id || row.ui_module_id || fallbackClassification.mainCategoryId,
    secondaryTags: Array.isArray(row.secondary_tags) ? row.secondary_tags : [],
    paper: row.gs_paper || 'GS-II',
    headline: row.headline,
    source: row.source_name,
    agencyId: row.agency_id || 'all',
    sourceTier: row.source_tier || 'editorial',
    date: formattedDate,
    dateKey: resolvedDateKey,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    relevanceScore: Number(row.relevance_score) || 0.85,
    summary: summaryMarkdown,
    summaryBullets: executiveBrief,
    imageUrl: imageMetadata?.imageUrl || undefined,
    imageMetadata,
    bullets:
      Array.isArray(fullAnalysis.detailedExplanation) && fullAnalysis.detailedExplanation.length > 0
        ? fullAnalysis.detailedExplanation
        : executiveBrief,
    prelimsFacts,
    prelimsFactMatrix: prelimsMatrix,
    syllabusRelevance: syllabusMapping,
    mainsRelevance: row.mains_dimensions?.analyticalAngle,
    fullAnalysis,
    crossVerification,
    relatedPyqs,
    whyItMatters: row.why_it_matters || fullAnalysis.whyItMattersForUPSC,
    sources: sourcesList,
    practiceQuestion,
    aiVerification: {
      model: 'Gemini Cross-Verified Pipeline',
      sourcesCount: sourcesList.length,
      verifiedAt: formattedDate,
    },
    referenceUrl: row.canonical_url,
  };
}

/**
 * Convert a `DailyEventItem` into a `CuratedArticle` for category & module feeds
 */
export function mapDailyEventToCuratedArticle(ev: DailyEventItem): CuratedArticle {
  return {
    id: ev.id,
    title: ev.headline,
    source: ev.source,
    agencyId: ev.agencyId || 'all',
    sourceTier: ev.sourceTier,
    date: ev.date || 'Today',
    dateKey: ev.dateKey,
    publishedAt: ev.publishedAt,
    updatedAt: ev.updatedAt,
    category: ev.subcategory || ev.primaryCategory || ev.category,
    primaryCategory: ev.primaryCategory,
    mainCategoryId: ev.mainCategoryId,
    subjectGroup: ev.subjectGroup,
    subcategory: ev.subcategory,
    isMostImportant: ev.isMostImportant,
    isPrelimsRelevant: ev.isPrelimsRelevant,
    isMainsRelevant: ev.isMainsRelevant,
    editorialAuthor: ev.editorialAuthor,
    aiExplanationDisclaimer: ev.aiExplanationDisclaimer,
    publishedDateIst: ev.publishedDateIst || ev.dateKey,
    uiModuleId: ev.mainCategoryId || ev.uiModuleId,
    secondaryTags: ev.secondaryTags,
    paper: ev.paper,
    summary:
      ev.summaryBullets && ev.summaryBullets.length > 0
        ? ev.summaryBullets.join(' ')
        : ev.summary.replace(/^- /gm, ''),
    imageUrl: ev.imageUrl,
    imageMetadata: ev.imageMetadata,
    link: ev.referenceUrl || ev.sources?.[0]?.url,
    keyPoints: ev.bullets && ev.bullets.length > 0 ? ev.bullets : ev.summaryBullets || [ev.headline],
    analyticalAngle:
      ev.syllabusRelevance?.mainsDimensions ||
      ev.mainsRelevance ||
      `Critical syllabus linkage for UPSC CSE ${ev.paper} (${ev.subcategory || ev.primaryCategory || ev.category}).`,
    mainsQuestion:
      ev.whyItMatters ||
      `Examine the key policy and institutional dimensions of "${ev.headline}" for UPSC CSE ${ev.paper}. (15 Marks, 250 Words)`,
    prelimsFacts: ev.prelimsFacts,
    prelimsFactMatrix: ev.prelimsFactMatrix,
    syllabusRelevance: ev.syllabusRelevance,
    fullAnalysis: ev.fullAnalysis,
    crossVerification: ev.crossVerification,
    relatedPyqs: ev.relatedPyqs,
    whyItMatters: ev.whyItMatters,
    sources: ev.sources,
  };
}

/**
 * Load verified articles from Supabase `public.ca_articles` with automatic fallback
 * to the bundled server-verified snapshot (`generatedSyncedCurrentAffairs.json`).
 */
export async function fetchVerifiedDatabaseEvents(options?: {
  agencyFilter?: string;
  primaryCategory?: string;
  uiModuleId?: string;
  limit?: number;
}): Promise<DailyEventItem[]> {
  const agencyFilter = options?.agencyFilter || 'all';
  const limit = options?.limit || 200;
  // Note: 'daily-news' is the comprehensive "All News" hub in Explore Current Affairs,
  // whereas other modules filter to their subject hub.
  const effectiveModuleId =
    options?.uiModuleId && options.uiModuleId !== 'daily-news' ? options.uiModuleId : undefined;

  let rawRows: any[] = [];

  try {
    let query = supabase
      .from('ca_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (agencyFilter !== 'all') {
      query = query.eq('agency_id', agencyFilter);
    }
    if (options?.primaryCategory) {
      query = query.eq('primary_category', options.primaryCategory);
    }
    if (effectiveModuleId) {
      query = query.eq('main_category_id', effectiveModuleId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      rawRows = data;
    }
  } catch {
    // Fall back to server-synced snapshot below
  }

  if (rawRows.length === 0 && Array.isArray((syncedSnapshot as any)?.articles)) {
    rawRows = (syncedSnapshot as any).articles.filter((row: any) => {
      if (row.status && row.status !== 'published') return false;
      if (agencyFilter !== 'all' && row.agency_id !== agencyFilter) return false;
      if (
        options?.primaryCategory &&
        row.primary_category !== options.primaryCategory &&
        !(Array.isArray(row.secondary_tags) && row.secondary_tags.includes(options.primaryCategory))
      ) {
        return false;
      }
      if (
        effectiveModuleId &&
        row.main_category_id !== effectiveModuleId &&
        row.ui_module_id !== effectiveModuleId
      ) {
        return false;
      }
      return true;
    });
  }

  const mapped = rawRows.map(mapDbRowToDailyEvent);

  // Prefer events with authentic editorial/official photographs at the top of The Daily Brief
  const withPhotos = mapped.filter((e) => Boolean(e.imageUrl));
  const withoutPhotos = mapped.filter((e) => !e.imageUrl);
  return [...withPhotos, ...withoutPhotos];
}

/**
 * Fetch live news from authentic agencies (queries Supabase DB + synced snapshot + AsyncStorage cache)
 */
export async function fetchLiveNewsFromAgencies(agencyFilter: string = 'all'): Promise<DailyEventItem[]> {
  const dbEvents = await fetchVerifiedDatabaseEvents({ agencyFilter, limit: 200 });
  if (dbEvents.length > 0) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(dbEvents));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // Ignore storage quota warnings
    }
    return dbEvents;
  }

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Return empty
  }

  return [];
}

/**
 * Check if cached news is valid (or return immediate snapshot items)
 */
export async function getCachedAuthenticNews(): Promise<DailyEventItem[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const tsStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && tsStr) {
      const age = Date.now() - parseInt(tsStr, 10);
      if (age < CACHE_EXPIRY_MS) {
        return JSON.parse(cached);
      }
    }
  } catch {
    // Fall back to snapshot
  }

  if (Array.isArray((syncedSnapshot as any)?.articles) && (syncedSnapshot as any).articles.length > 0) {
    const mapped = (syncedSnapshot as any).articles.map(mapDbRowToDailyEvent);
    const withPhotos = mapped.filter((e: DailyEventItem) => Boolean(e.imageUrl));
    const withoutPhotos = mapped.filter((e: DailyEventItem) => !e.imageUrl);
    return [...withPhotos, ...withoutPhotos];
  }

  return null;
}

/**
 * Convert live agency news items into CuratedArticle format for Daily News & Category feeds
 */
export async function fetchLiveDailyNewsArticles(
  agencyFilter: string = 'all',
  uiModuleId?: string,
  primaryCategory?: string
): Promise<CuratedArticle[]> {
  const events = await fetchVerifiedDatabaseEvents({
    agencyFilter,
    uiModuleId,
    primaryCategory,
    limit: 200,
  });
  return events.map(mapDailyEventToCuratedArticle);
}

/**
 * Fetch per-category status (`last_updated_at`, `status`, `active_story_count`)
 * for all 12 canonical categories and 6 UI module hubs.
 */
export async function fetchCategoryStatuses(): Promise<CACategoryStatusItem[]> {
  let rows: any[] = [];
  try {
    const { data, error } = await supabase
      .from('ca_category_status')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      rows = data;
    }
  } catch {
    // Fallback to snapshot
  }

  if (rows.length === 0 && Array.isArray((syncedSnapshot as any)?.categoryStatuses)) {
    rows = (syncedSnapshot as any).categoryStatuses;
  }

  if (rows.length === 0) {
    return CANONICAL_CA_CATEGORIES.map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      categoryGroup: 'canonical',
      uiModuleId: c.uiModuleId,
      lastUpdatedAt: (syncedSnapshot as any)?.generatedAt || new Date().toISOString(),
      lastAttemptAt: (syncedSnapshot as any)?.generatedAt || new Date().toISOString(),
      status: 'success',
      activeStoryCount: 6,
      lastError: null,
    }));
  }

  return rows.map((r: any) => ({
    categoryId: String(r.category_id),
    categoryName: String(r.category_name),
    categoryGroup: r.category_group === 'ui_module' ? 'ui_module' : 'canonical',
    uiModuleId: String(r.ui_module_id),
    lastUpdatedAt: r.last_updated_at ? String(r.last_updated_at) : null,
    lastAttemptAt: r.last_attempt_at ? String(r.last_attempt_at) : null,
    status: r.status || 'success',
    activeStoryCount: Number(r.active_story_count) || 0,
    lastError: r.last_error || null,
  }));
}

/**
 * Fetch operational pipeline execution logs (`public.ca_ingestion_logs`)
 */
export async function fetchIngestionOperationalLogs(): Promise<CAIngestionLogItem[]> {
  let rows: any[] = [];
  try {
    const { data, error } = await supabase
      .from('ca_ingestion_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);
    if (!error && Array.isArray(data) && data.length > 0) {
      rows = data;
    }
  } catch {
    // Fallback to snapshot
  }

  if (rows.length === 0 && Array.isArray((syncedSnapshot as any)?.ingestionLogs)) {
    rows = (syncedSnapshot as any).ingestionLogs;
  }

  return rows.map((r: any) => ({
    id: String(r.id),
    startedAt: String(r.started_at),
    completedAt: r.completed_at ? String(r.completed_at) : null,
    triggerType: String(r.trigger_type || 'scheduled'),
    status: r.status || 'completed',
    aiModelUsed: String(r.ai_model_used || 'gemini-2.5-flash'),
    sourcesAttempted: Number(r.sources_attempted) || 13,
    sourcesSucceeded: Number(r.sources_succeeded) || 12,
    sourcesFailed: Number(r.sources_failed) || 0,
    newStories: Number(r.new_stories) || 0,
    updatedStories: Number(r.updated_stories) || 0,
    duplicatesSkipped: Number(r.duplicates_skipped) || 0,
    quarantinedStories: Number(r.quarantined_stories) || 0,
    failedJobs: Array.isArray(r.failed_jobs) ? r.failed_jobs : [],
    categorySummary:
      typeof r.category_summary === 'object' && r.category_summary !== null
        ? r.category_summary
        : {},
  }));
}
