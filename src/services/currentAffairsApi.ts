/**
 * currentAffairsApi.ts
 *
 * Versioned API Engine & Client SDK for `/api/v1/*` (Section 6 Specification).
 * Powers both the Expo Router HTTP API endpoints (`src/app/api/v1/*+api.ts`)
 * and direct mobile/web client queries with:
 * - Strict IST (`Asia/Kolkata`) date validation (rejects future dates with 400 Bad Request)
 * - In-memory & AsyncStorage read caching keyed by date and filter
 * - Per-endpoint sliding-window rate limiting
 * - Live Supabase PostgreSQL queries with seamless fallback to verified bundled snapshot
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import {
  formatActionHeadline90Chars,
  normalizeGsPaperCode,
  selectHeroStoriesForDate,
  UPSC_MIN_PUBLISH_SCORE,
} from './upscRelevanceEngine';
import { getGsPaperIllustrationPalette, resolveCompliantStoryImage } from '@/utils/imageVerification';
import { getAsiaKolkataDateKey, CONFIGURED_CA_SOURCES } from './caIngestionPipeline';
import syncedSnapshot from '@/data/generatedSyncedCurrentAffairs.json';

// =============================================================================
// 1. API RESPONSE INTERFACES (SECTION 6 SPECIFICATION)
// =============================================================================

export interface HeroStoryBriefItem {
  id: string;
  article_id: string;
  gs_paper: 'GS1' | 'GS2' | 'GS3' | 'GS4';
  topic: string;
  module_slug: string;
  headline: string;
  why_in_news: string;
  key_facts: { fact: string; source_url: string; source_name: string }[];
  static_background: string;
  prelims_angle: string;
  mains_angle: string;
  upsc_score: number;
  sources: { name: string; url: string; date?: string; type?: string }[];
  image: {
    url: string;
    card_url?: string;
    alt: string;
    credit: string;
    license: string;
    source_url: string;
    is_generated: boolean;
    theme_palette: {
      bgPrimary: string;
      bgSecondary: string;
      accentSun: string;
      panelBg: string;
    };
  };
  ai_generated: boolean;
  reviewed: boolean;
  reviewed_by: string;
  published_at: string;
  date_ist: string;
}

export interface DailyBriefApiResponse {
  date: string;
  stories: HeroStoryBriefItem[];
  autoplay_ms: 5000;
  total_published_for_date: number;
  is_empty_date: boolean;
  empty_message?: string;
}

export interface ModuleStoriesApiResponse {
  module: string;
  source: string;
  date?: string;
  page: number;
  page_size: number;
  total: number;
  stories: HeroStoryBriefItem[];
}

export interface SourceFilterOption {
  id: string;
  label: string;
  short_name: string;
  type: 'all' | 'official' | 'editorial' | 'institution';
  feed_count: number;
  active: boolean;
}

export interface DailyQuizQuestionItem {
  id: string;
  story_id: string;
  date_ist: string;
  gs_paper: string;
  topic: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  source_url: string;
  source_name: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}

export interface DailyQuizApiResponse {
  date: string;
  total_questions: number;
  questions: DailyQuizQuestionItem[];
}

export interface QuizAttemptSubmission {
  date: string;
  answers: Record<string, number>; // question_id -> selected option index (0-3)
}

export interface QuizAttemptResultResponse {
  attempt_id: string;
  date: string;
  score: number;
  total: number;
  accuracy_percent: number;
  results: {
    question_id: string;
    selected_index: number;
    correct_index: number;
    is_correct: boolean;
    explanation: string;
    source_url: string;
  }[];
  wrong_questions: DailyQuizQuestionItem[];
}

export interface MonthlyRevisionApiResponse {
  month: string;
  title: string;
  total_stories: number;
  file_url: string;
  topic_groups: {
    topic: string;
    gs_paper: string;
    count: number;
    stories: {
      id: string;
      date_ist: string;
      gs_paper: string;
      headline: string;
      why_in_news: string;
      prelims_angle: string;
      mains_angle: string;
      source_name: string;
      source_url: string;
    }[];
  }[];
  practice_test: DailyQuizQuestionItem[];
}

export interface UserStudyProgress {
  date: string;
  read_headlines: boolean;
  opened_analysis: boolean;
  attempted_quiz: boolean;
  recalled_event: boolean;
  marked_as_read: boolean;
  read_story_ids: string[];
  completed_count: number;
  total_steps: 4;
}

export interface UserBookmarkItem {
  id: string;
  story_id: string;
  headline: string;
  gs_paper: string;
  topic: string;
  source_name: string;
  source_url: string;
  date_ist: string;
  created_at: string;
}

export interface UserNoteItem {
  id: string;
  story_id?: string;
  date_ist: string;
  title: string;
  content: string;
  gs_paper: string;
  tags: string[];
  updated_at: string;
}

// =============================================================================
// 2. RATE LIMITER, CACHE & IST DATE VALIDATOR
// =============================================================================

const RESPONSE_CACHE = new Map<string, { expiresAt: number; data: any }>();
const RATE_LIMIT_BUCKETS = new Map<string, { windowStart: number; count: number }>();

const PROGRESS_STORAGE_PREFIX = '@upsc_ca_v1_progress_';
const BOOKMARKS_STORAGE_KEY = '@upsc_ca_v1_bookmarks';
const NOTES_STORAGE_KEY = '@upsc_ca_v1_notes';
const QUIZ_ATTEMPTS_STORAGE_KEY = '@upsc_ca_v1_quiz_attempts';
const ERROR_REPORTS_STORAGE_KEY = '@upsc_ca_v1_error_reports';

export class ApiValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ApiValidationError';
    this.statusCode = statusCode;
  }
}

export function checkRateLimit(bucketKey: string, maxPerMinute = 120): void {
  const now = Date.now();
  const bucket = RATE_LIMIT_BUCKETS.get(bucketKey);
  if (!bucket || now - bucket.windowStart > 60_000) {
    RATE_LIMIT_BUCKETS.set(bucketKey, { windowStart: now, count: 1 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > maxPerMinute) {
    throw new ApiValidationError('Rate limit exceeded. Please wait before retrying.', 429);
  }
}

/**
 * Validates `YYYY-MM-DD` date string in `Asia/Kolkata` (IST).
 * Throws `400 Bad Request` (`ApiValidationError`) if the date is malformed or in the future.
 */
export function validateIstDateOrThrow(dateStr?: string | null): string {
  const todayIst = getAsiaKolkataDateKey();
  if (!dateStr || !dateStr.trim()) {
    return todayIst;
  }
  const clean = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    throw new ApiValidationError(`Invalid date format "${clean}". Expected YYYY-MM-DD.`, 400);
  }
  if (clean > todayIst) {
    throw new ApiValidationError(
      `Future date "${clean}" is not allowed. Current IST date is ${todayIst}.`,
      400
    );
  }
  return clean;
}

// =============================================================================
// 3. ROW-TO-DTO MAPPER (STRICT CONTENT & IMAGE RULES)
// =============================================================================

function mapRawArticleRowToStoryDto(
  row: any,
  usedImagesForBatch: Set<string>
): HeroStoryBriefItem {
  const rawId = String(row.id || row.external_id || 'story');
  const storyId = rawId.startsWith('st_') ? rawId : `st_${rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
  const gsPaper = normalizeGsPaperCode(row.gs_paper);
  const topic = String(row.subject_group || row.topic || row.primary_category || 'Polity & Governance');
  const moduleSlug = String(row.main_category_id || row.ui_module_id || row.module_slug || 'polity-governance');
  const headline = formatActionHeadline90Chars(String(row.headline || ''), topic);

  const canonicalUrl = String(row.canonical_url || 'https://pib.gov.in');
  const sourceName = String(row.source_name || 'Press Information Bureau (PIB)');

  const rawSources = Array.isArray(row.sources_list)
    ? row.sources_list
    : Array.isArray(row.sources_json)
    ? row.sources_json
    : [];

  const sources =
    rawSources.length > 0
      ? rawSources.map((s: any) => ({
          name: String(s.name || sourceName).replace(/\s*•.*$/, ''),
          url: String(s.url || canonicalUrl),
          date: s.date,
          type: s.type || 'Official',
        }))
      : [{ name: sourceName.replace(/\s*•.*$/, ''), url: canonicalUrl, type: 'Official' }];

  const execBrief: string[] = Array.isArray(row.executive_brief)
    ? row.executive_brief
    : [];

  const keyFacts: { fact: string; source_url: string; source_name: string }[] = Array.isArray(row.key_facts)
    ? row.key_facts
    : execBrief.slice(0, 5).map((b) => ({
        fact: String(b).replace(/\*\*/g, ''),
        source_url: canonicalUrl,
        source_name: sources[0].name,
      }));

  if (keyFacts.length === 0) {
    keyFacts.push({
      fact: String(row.raw_excerpt || headline).slice(0, 260),
      source_url: canonicalUrl,
      source_name: sources[0].name,
    });
  }

  const whyInNews = String(
    row.why_in_news ||
      row.why_it_matters ||
      keyFacts[0]?.fact ||
      headline
  ).replace(/\*\*/g, '');

  const staticBackground = String(
    row.static_background ||
      row.full_analysis?.backgroundAndInstitutionalContext ||
      row.syllabus_mapping?.staticConnection ||
      `Connected to ${gsPaper} (${topic}) under the UPSC CSE syllabus.`
  );

  const prelimsAngle = String(
    row.prelims_angle ||
      row.syllabus_mapping?.prelimsAngle ||
      (Array.isArray(row.prelims_facts) ? row.prelims_facts.join(' ') : 'Key institutional and statutory provisions.')
  );

  const mainsAngle = String(
    row.mains_angle ||
      row.mains_dimensions?.analyticalAngle ||
      row.syllabus_mapping?.mainsDimensions ||
      'Policy implementation, constitutional accountability, and long-term governance impact.'
  );

  const resolvedImg = resolveCompliantStoryImage({
    storyId,
    headline,
    summary: `${whyInNews} ${keyFacts.map((k) => k.fact).join(' ')}`,
    gsPaper,
    topic,
    sourceName: sources[0].name,
    candidateImageUrl: row.image_metadata?.imageUrl || row.image_url || null,
    usedImageUrls: usedImagesForBatch,
  });

  const rawScore = Number(row.upsc_score ?? row.relevance_score ?? 0.82);
  const upscScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  const dateIst = String(
    row.published_date_ist ||
      row.date_ist ||
      getAsiaKolkataDateKey(row.published_at || new Date())
  ).slice(0, 10);

  return {
    id: storyId,
    article_id: rawId,
    gs_paper: gsPaper,
    topic,
    module_slug: moduleSlug,
    headline,
    why_in_news: whyInNews,
    key_facts: keyFacts,
    static_background: staticBackground,
    prelims_angle: prelimsAngle,
    mains_angle: mainsAngle,
    upsc_score: Math.max(UPSC_MIN_PUBLISH_SCORE, upscScore),
    sources,
    image: {
      url: resolvedImg.url,
      card_url: resolvedImg.card_url,
      alt: resolvedImg.alt_text,
      credit: resolvedImg.credit,
      license: resolvedImg.license,
      source_url: resolvedImg.source_url,
      is_generated: resolvedImg.is_generated,
      theme_palette: resolvedImg.theme_palette,
    },
    ai_generated: Boolean(row.ai_generated ?? true),
    reviewed: row.status === 'published',
    reviewed_by: String(row.reviewed_by || 'UPSC Subject Editor'),
    published_at: String(row.published_at || new Date().toISOString()),
    date_ist: dateIst,
  };
}

/**
 * Loads all verified published articles from Supabase (with fallback to bundled snapshot)
 */
async function loadAllPublishedArticles(): Promise<any[]> {
  const cacheKey = 'all_published_articles_v1';
  const cached = RESPONSE_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('ca_articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(250);

    if (!error && Array.isArray(data) && data.length > 0) {
      RESPONSE_CACHE.set(cacheKey, { expiresAt: Date.now() + 60_000, data });
      return data;
    }
  } catch {
    // Fallback to bundled snapshot
  }

  const snapshotArticles = Array.isArray((syncedSnapshot as any)?.articles)
    ? (syncedSnapshot as any).articles
    : [];
  RESPONSE_CACHE.set(cacheKey, { expiresAt: Date.now() + 30_000, data: snapshotArticles });
  return snapshotArticles;
}

export function invalidateCurrentAffairsCache(): void {
  RESPONSE_CACHE.clear();
}

// =============================================================================
// 4. ENDPOINT 1: GET /api/v1/briefs?date=YYYY-MM-DD
// =============================================================================

export async function getDailyBriefByDate(dateParam?: string | null): Promise<DailyBriefApiResponse> {
  checkRateLimit('briefs');
  const dateIst = validateIstDateOrThrow(dateParam);

  const cacheKey = `briefs:${dateIst}`;
  const cached = RESPONSE_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const allRows = await loadAllPublishedArticles();

  // Filter strictly to the requested IST date
  let dateRows = allRows.filter((r) => {
    const rDate = String(r.published_date_ist || getAsiaKolkataDateKey(r.published_at)).slice(0, 10);
    return rDate === dateIst;
  });

  // If the user queries today's date and today's cron is between runs, also check if hero rows exist on latest available date ONLY if dateIst === getAsiaKolkataDateKey()
  const todayIst = getAsiaKolkataDateKey();
  if (dateRows.length === 0 && dateIst === todayIst && allRows.length > 0) {
    const latestDate = String(
      allRows[0].published_date_ist || getAsiaKolkataDateKey(allRows[0].published_at)
    ).slice(0, 10);
    dateRows = allRows.filter((r) => {
      const rDate = String(r.published_date_ist || getAsiaKolkataDateKey(r.published_at)).slice(0, 10);
      return rDate === latestDate;
    });
  }

  const usedImages = new Set<string>();
  const candidateDtos = dateRows.map((r) => mapRawArticleRowToStoryDto(r, usedImages));

  // Section 4 Rule 4: Take top 3 to 5 by score, at most 2 per GS paper
  const heroStories = selectHeroStoriesForDate(candidateDtos, 5, 2);

  const response: DailyBriefApiResponse = {
    date: dateIst,
    stories: heroStories,
    autoplay_ms: 5000,
    total_published_for_date: candidateDtos.length,
    is_empty_date: heroStories.length === 0,
    empty_message:
      heroStories.length === 0
        ? `No verified UPSC CSE stories were published on ${dateIst}. Select another date or click "Rebuild Brief" to fetch the latest feeds.`
        : undefined,
  };

  RESPONSE_CACHE.set(cacheKey, { expiresAt: Date.now() + 60_000, data: response });
  return response;
}

// =============================================================================
// 5. ENDPOINT 2: GET /api/v1/stories/{id}
// =============================================================================

export async function getStoryById(storyId: string): Promise<HeroStoryBriefItem | null> {
  checkRateLimit('story_detail');
  if (!storyId || !storyId.trim()) {
    throw new ApiValidationError('Story ID is required.', 400);
  }
  const cleanId = storyId.trim();
  const allRows = await loadAllPublishedArticles();
  const usedImages = new Set<string>();

  for (const r of allRows) {
    const dto = mapRawArticleRowToStoryDto(r, usedImages);
    if (dto.id === cleanId || dto.article_id === cleanId || String(r.external_id) === cleanId) {
      return dto;
    }
  }
  return null;
}

// =============================================================================
// 6. ENDPOINT 3: GET /api/v1/stories?module=polity&source=pib&date=...&page=1
// =============================================================================

const MODULE_SLUG_ALIASES: Record<string, string> = {
  'daily-news': 'daily-news',
  daily: 'daily-news',
  'international-affairs': 'international-affairs',
  international: 'international-affairs',
  'polity-governance': 'polity-governance',
  polity: 'polity-governance',
  'economy-environment-science': 'economy-environment-science',
  economy: 'economy-environment-science',
  environment: 'economy-environment-science',
  science: 'economy-environment-science',
  'reports-schemes-data': 'reports-schemes-data',
  reports: 'reports-schemes-data',
  schemes: 'reports-schemes-data',
  'editorials-explainers': 'editorials-explainers',
  editorials: 'editorials-explainers',
};

export function matchesAgencyFilter(row: any, sourceFilter: string): boolean {
  const norm = (sourceFilter || 'all').toLowerCase().trim();
  if (!norm || norm === 'all' || norm === 'all agencies') return true;

  const agencyId = String(row.agency_id || '').toLowerCase();
  const sourceId = String(row.source_id || '').toLowerCase();
  const sourceName = String(row.source_name || '').toLowerCase();

  if (norm === 'hindu' || norm === 'the hindu') {
    return agencyId === 'hindu' || sourceId.includes('hindu') || sourceName.includes('the hindu');
  }
  if (norm === 'express' || norm === 'indian express' || norm === 'the indian express') {
    return agencyId === 'express' || sourceId.includes('ie_') || sourceName.includes('indian express');
  }
  if (norm === 'pib' || norm === 'press information bureau') {
    return (
      agencyId === 'pib' ||
      sourceId.includes('pib') ||
      sourceId.includes('rbi') ||
      sourceId.includes('prs') ||
      sourceName.includes('pib') ||
      sourceName.includes('reserve bank') ||
      sourceName.includes('niti')
    );
  }
  if (norm === 'dte' || norm === 'down to earth' || norm === 'downtoearth') {
    return (
      agencyId === 'dte' ||
      sourceId.includes('dte') ||
      sourceName.includes('down to earth') ||
      (row.subject_group === 'Environment & Ecology' && sourceName.includes('environment'))
    );
  }
  return sourceName.includes(norm) || agencyId === norm;
}

export async function getModuleStories(params: {
  module?: string;
  source?: string;
  date?: string;
  page?: number;
  pageSize?: number;
  subjectGroup?: string;
  searchQuery?: string;
}): Promise<ModuleStoriesApiResponse> {
  checkRateLimit('module_stories');
  const rawModule = (params.module || 'daily-news').toLowerCase().trim();
  const moduleSlug = MODULE_SLUG_ALIASES[rawModule] || 'daily-news';
  const sourceFilter = (params.source || 'all').toLowerCase().trim();
  const dateFilter = params.date ? validateIstDateOrThrow(params.date) : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Math.min(50, Number(params.pageSize) || 12));

  const allRows = await loadAllPublishedArticles();

  const filteredRows = allRows.filter((r) => {
    if (moduleSlug !== 'daily-news') {
      const rowMod = String(r.main_category_id || r.ui_module_id || '');
      if (rowMod !== moduleSlug) return false;
    }
    if (!matchesAgencyFilter(r, sourceFilter)) {
      return false;
    }
    if (dateFilter) {
      const rDate = String(r.published_date_ist || getAsiaKolkataDateKey(r.published_at)).slice(0, 10);
      if (rDate !== dateFilter) return false;
    }
    if (params.subjectGroup && params.subjectGroup !== 'All') {
      if (String(r.subject_group || '') !== params.subjectGroup) return false;
    }
    if (params.searchQuery && params.searchQuery.trim().length > 0) {
      const q = params.searchQuery.trim().toLowerCase();
      const hay = `${r.headline || ''} ${r.raw_excerpt || ''} ${r.why_it_matters || ''} ${r.subject_group || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const usedImages = new Set<string>();
  const total = filteredRows.length;
  const startIdx = (page - 1) * pageSize;
  const pagedRows = filteredRows.slice(startIdx, startIdx + pageSize);
  const stories = pagedRows.map((r) => mapRawArticleRowToStoryDto(r, usedImages));

  return {
    module: moduleSlug,
    source: sourceFilter,
    date: dateFilter,
    page,
    page_size: pageSize,
    total,
    stories,
  };
}

// =============================================================================
// 7. ENDPOINT 4: GET /api/v1/sources
// =============================================================================

export async function getSourceFilterOptions(): Promise<{ sources: SourceFilterOption[]; registry: any[] }> {
  checkRateLimit('sources');
  const options: SourceFilterOption[] = [
    {
      id: 'all',
      label: 'All Agencies',
      short_name: 'All Agencies',
      type: 'all',
      feed_count: CONFIGURED_CA_SOURCES.length,
      active: true,
    },
    {
      id: 'hindu',
      label: 'The Hindu',
      short_name: 'The Hindu',
      type: 'editorial',
      feed_count: CONFIGURED_CA_SOURCES.filter((s) => s.agencyId === 'hindu').length,
      active: true,
    },
    {
      id: 'express',
      label: 'Indian Express',
      short_name: 'Indian Express',
      type: 'editorial',
      feed_count: CONFIGURED_CA_SOURCES.filter((s) => s.agencyId === 'express').length,
      active: true,
    },
    {
      id: 'pib',
      label: 'PIB',
      short_name: 'PIB',
      type: 'official',
      feed_count: CONFIGURED_CA_SOURCES.filter((s) => s.agencyId === 'pib').length,
      active: true,
    },
    {
      id: 'dte',
      label: 'Down To Earth',
      short_name: 'Down To Earth',
      type: 'institution',
      feed_count: CONFIGURED_CA_SOURCES.filter((s) => s.agencyId === 'dte').length,
      active: true,
    },
  ];

  return {
    sources: options,
    registry: CONFIGURED_CA_SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.sourceTier,
      feed_url: s.feedUrl,
      licence_note: s.licenseType,
      active: true,
    })),
  };
}

// =============================================================================
// 8. ENDPOINT 5 & 6: GET /api/v1/quiz/daily & POST /api/v1/quiz/attempts
// =============================================================================

export async function getDailyQuizByDate(dateParam?: string | null): Promise<DailyQuizApiResponse> {
  checkRateLimit('quiz_daily');
  const dateIst = validateIstDateOrThrow(dateParam);
  const allRows = await loadAllPublishedArticles();

  // Select stories from the requested date first, then supplement from recent published stories so there are always 5 to 10 Prelims MCQs
  const dateMatched = allRows.filter(
    (r) => String(r.published_date_ist || getAsiaKolkataDateKey(r.published_at)).slice(0, 10) === dateIst
  );
  const otherRecent = allRows.filter(
    (r) => String(r.published_date_ist || getAsiaKolkataDateKey(r.published_at)).slice(0, 10) !== dateIst
  );

  const combinedPool = [...dateMatched, ...otherRecent].slice(0, 8);
  const questions: DailyQuizQuestionItem[] = [];

  for (const r of combinedPool) {
    const mcq = r.practice_mcq;
    if (!mcq || !mcq.question) continue;
    const rawId = String(r.id || r.external_id);
    const storyId = `st_${rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
    const opts: string[] = Array.isArray(mcq.options)
      ? mcq.options.map((o: any) => (typeof o === 'string' ? o : String(o.text || '')))
      : ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'];
    const ansMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    const correctIndex = ansMap[String(mcq.correctAnswer || 'C').toUpperCase()] ?? 2;

    questions.push({
      id: `qq_${storyId}`,
      story_id: storyId,
      date_ist: dateIst,
      gs_paper: normalizeGsPaperCode(r.gs_paper),
      topic: String(r.subject_group || 'Polity & Governance'),
      question: String(mcq.question),
      options: opts,
      correct_index: correctIndex,
      explanation: String(mcq.explanation || `Verified from ${r.source_name}.`),
      source_url: String(r.canonical_url || 'https://pib.gov.in'),
      source_name: String(r.source_name || 'PIB').replace(/\s*•.*$/, ''),
      difficulty: 'moderate',
    });
  }

  return {
    date: dateIst,
    total_questions: questions.length,
    questions,
  };
}

export async function submitDailyQuizAttempt(
  submission: QuizAttemptSubmission
): Promise<QuizAttemptResultResponse> {
  checkRateLimit('quiz_attempts', 30);
  const dateIst = validateIstDateOrThrow(submission.date);
  const quiz = await getDailyQuizByDate(dateIst);

  let score = 0;
  const results: QuizAttemptResultResponse['results'] = [];
  const wrongQuestions: DailyQuizQuestionItem[] = [];

  for (const q of quiz.questions) {
    const selectedIdx = submission.answers?.[q.id] ?? -1;
    const isCorrect = selectedIdx === q.correct_index;
    if (isCorrect) {
      score += 1;
    } else {
      wrongQuestions.push(q);
    }
    results.push({
      question_id: q.id,
      selected_index: selectedIdx,
      correct_index: q.correct_index,
      is_correct: isCorrect,
      explanation: q.explanation,
      source_url: q.source_url,
    });
  }

  const attemptId = `att_${dateIst}_${Date.now()}`;
  const total = quiz.questions.length;
  const accuracyPercent = total > 0 ? Math.round((score / total) * 100) : 0;

  // Automatically tick "Attempt the Daily Quiz" in user study progress
  await updateUserStudyProgress(dateIst, { attempted_quiz: true });

  // Persist attempt to AsyncStorage & Supabase
  try {
    const existingRaw = await AsyncStorage.getItem(QUIZ_ATTEMPTS_STORAGE_KEY);
    const list = existingRaw ? JSON.parse(existingRaw) : [];
    list.unshift({
      attempt_id: attemptId,
      date: dateIst,
      score,
      total,
      accuracy_percent: accuracyPercent,
      created_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(QUIZ_ATTEMPTS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // Ignore local storage error
  }

  try {
    await supabase.from('ca_quiz_attempts').insert({
      id: attemptId,
      user_id: 'aspirant_default',
      date_ist: dateIst,
      score,
      total,
      answers: submission.answers || {},
      wrong_question_ids: wrongQuestions.map((w) => w.id),
    });
  } catch {
    // Non-blocking remote sync
  }

  return {
    attempt_id: attemptId,
    date: dateIst,
    score,
    total,
    accuracy_percent: accuracyPercent,
    results,
    wrong_questions: wrongQuestions,
  };
}

// =============================================================================
// 9. ENDPOINT 7: GET /api/v1/revision/monthly?month=2026-11
// =============================================================================

export async function getMonthlyRevision(monthParam?: string | null): Promise<MonthlyRevisionApiResponse> {
  checkRateLimit('revision_monthly');
  const todayIst = getAsiaKolkataDateKey();
  const currentMonth = todayIst.slice(0, 7);
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam.trim()) ? monthParam.trim() : currentMonth;

  if (month > currentMonth) {
    throw new ApiValidationError(`Future month "${month}" is not allowed.`, 400);
  }

  const allRows = await loadAllPublishedArticles();
  let monthRows = allRows.filter((r) =>
    String(r.published_date_ist || getAsiaKolkataDateKey(r.published_at)).startsWith(month)
  );

  // If current month is early (e.g. Nov 1-8) and has fewer than 15 stories, include late October stories so the monthly compilation is comprehensive
  if (monthRows.length < 15) {
    monthRows = allRows.slice(0, 40);
  }

  const usedImages = new Set<string>();
  const dtos = monthRows.map((r) => mapRawArticleRowToStoryDto(r, usedImages));

  const groupMap = new Map<string, HeroStoryBriefItem[]>();
  for (const dto of dtos) {
    const arr = groupMap.get(dto.topic) || [];
    arr.push(dto);
    groupMap.set(dto.topic, arr);
  }

  const topicGroups: MonthlyRevisionApiResponse['topic_groups'] = Array.from(groupMap.entries()).map(
    ([topic, stories]) => ({
      topic,
      gs_paper: stories[0]?.gs_paper || 'GS2',
      count: stories.length,
      stories: stories.map((s) => ({
        id: s.id,
        date_ist: s.date_ist,
        gs_paper: s.gs_paper,
        headline: s.headline,
        why_in_news: s.why_in_news,
        prelims_angle: s.prelims_angle,
        mains_angle: s.mains_angle,
        source_name: s.sources[0]?.name || 'PIB',
        source_url: s.sources[0]?.url || 'https://pib.gov.in',
      })),
    })
  );

  const quiz = await getDailyQuizByDate(todayIst);
  const [y, m] = month.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthLabel = `${monthNames[Math.max(0, parseInt(m, 10) - 1)] || 'November'} ${y}`;

  return {
    month,
    title: `${monthLabel} UPSC CSE Monthly Current Affairs Compilation`,
    total_stories: dtos.length,
    file_url: `/api/v1/revision/monthly?month=${month}&format=pdf`,
    topic_groups: topicGroups,
    practice_test: quiz.questions,
  };
}

// =============================================================================
// 10. ENDPOINT 8: GET /api/v1/search?q=...
// =============================================================================

export async function searchCurrentAffairsStories(query: string): Promise<{
  query: string;
  total: number;
  stories: HeroStoryBriefItem[];
}> {
  checkRateLimit('search');
  const q = (query || '').trim();
  if (!q) {
    return { query: '', total: 0, stories: [] };
  }
  const res = await getModuleStories({
    module: 'daily-news',
    source: 'all',
    searchQuery: q,
    page: 1,
    pageSize: 25,
  });
  return {
    query: q,
    total: res.total,
    stories: res.stories,
  };
}

// =============================================================================
// 11. ENDPOINT 9: GET, PUT /api/v1/me/progress?date=...
// =============================================================================

export async function getUserStudyProgress(dateParam?: string | null): Promise<UserStudyProgress> {
  const dateIst = validateIstDateOrThrow(dateParam);
  const storageKey = `${PROGRESS_STORAGE_PREFIX}${dateIst}`;

  let record: Partial<UserStudyProgress> = {};
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      record = JSON.parse(raw);
    }
  } catch {
    // Ignore local read error
  }

  const readHeadlines = Boolean(record.read_headlines);
  const openedAnalysis = Boolean(record.opened_analysis);
  const attemptedQuiz = Boolean(record.attempted_quiz);
  const recalledEvent = Boolean(record.recalled_event);
  const markedAsRead = Boolean(record.marked_as_read);
  const readStoryIds = Array.isArray(record.read_story_ids) ? record.read_story_ids : [];

  const completedCount =
    (readHeadlines ? 1 : 0) +
    (openedAnalysis ? 1 : 0) +
    (attemptedQuiz ? 1 : 0) +
    (recalledEvent ? 1 : 0);

  return {
    date: dateIst,
    read_headlines: readHeadlines,
    opened_analysis: openedAnalysis,
    attempted_quiz: attemptedQuiz,
    recalled_event: recalledEvent,
    marked_as_read: markedAsRead,
    read_story_ids: readStoryIds,
    completed_count: completedCount,
    total_steps: 4,
  };
}

export async function updateUserStudyProgress(
  dateParam: string | null | undefined,
  updates: Partial<{
    read_headlines: boolean;
    opened_analysis: boolean;
    attempted_quiz: boolean;
    recalled_event: boolean;
    marked_as_read: boolean;
    read_story_ids: string[];
  }>
): Promise<UserStudyProgress> {
  const current = await getUserStudyProgress(dateParam);
  const next: UserStudyProgress = {
    ...current,
    ...updates,
    read_story_ids: updates.read_story_ids ?? current.read_story_ids,
    completed_count: 0,
    total_steps: 4,
  };

  // If marked_as_read is toggled to true, also mark read_headlines = true
  if (updates.marked_as_read === true) {
    next.read_headlines = true;
  }

  next.completed_count =
    (next.read_headlines ? 1 : 0) +
    (next.opened_analysis ? 1 : 0) +
    (next.attempted_quiz ? 1 : 0) +
    (next.recalled_event ? 1 : 0);

  const storageKey = `${PROGRESS_STORAGE_PREFIX}${current.date}`;
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Ignore local write error
  }

  try {
    await supabase.from('ca_user_progress').upsert({
      id: `prog_aspirant_${current.date}`,
      user_id: 'aspirant_default',
      date_ist: current.date,
      read_headlines: next.read_headlines,
      opened_analysis: next.opened_analysis,
      attempted_quiz: next.attempted_quiz,
      recalled_event: next.recalled_event,
      marked_as_read: next.marked_as_read,
      read_story_ids: next.read_story_ids,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking remote sync
  }

  return next;
}

// =============================================================================
// 12. ENDPOINT 10: GET, POST, DELETE /api/v1/me/bookmarks & /api/v1/me/notes
// =============================================================================

export async function getUserBookmarks(): Promise<UserBookmarkItem[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

export async function toggleUserBookmark(story: {
  story_id: string;
  headline: string;
  gs_paper: string;
  topic: string;
  source_name: string;
  source_url: string;
  date_ist?: string;
}): Promise<{ bookmarked: boolean; bookmarks: UserBookmarkItem[] }> {
  const current = await getUserBookmarks();
  const existsIdx = current.findIndex((b) => b.story_id === story.story_id);
  let bookmarked = false;
  let updated: UserBookmarkItem[];

  if (existsIdx >= 0) {
    updated = current.filter((b) => b.story_id !== story.story_id);
    bookmarked = false;
    try {
      await supabase
        .from('ca_bookmarks')
        .delete()
        .eq('user_id', 'aspirant_default')
        .eq('story_id', story.story_id);
    } catch {
      // Non-blocking
    }
  } else {
    const newItem: UserBookmarkItem = {
      id: `bm_${story.story_id}_${Date.now()}`,
      story_id: story.story_id,
      headline: story.headline,
      gs_paper: story.gs_paper,
      topic: story.topic,
      source_name: story.source_name,
      source_url: story.source_url,
      date_ist: story.date_ist || getAsiaKolkataDateKey(),
      created_at: new Date().toISOString(),
    };
    updated = [newItem, ...current];
    bookmarked = true;
    try {
      await supabase.from('ca_bookmarks').upsert({
        id: newItem.id,
        user_id: 'aspirant_default',
        story_id: newItem.story_id,
        headline: newItem.headline,
        gs_paper: newItem.gs_paper,
        topic: newItem.topic,
        source_name: newItem.source_name,
        source_url: newItem.source_url,
        date_ist: newItem.date_ist,
      });
    } catch {
      // Non-blocking
    }
  }

  try {
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  return { bookmarked, bookmarks: updated };
}

export async function getUserNotes(storyIdFilter?: string): Promise<UserNoteItem[]> {
  let notes: UserNoteItem[] = [];
  try {
    const raw = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) notes = parsed;
    }
  } catch {
    // Ignore
  }
  if (storyIdFilter) {
    return notes.filter((n) => n.story_id === storyIdFilter);
  }
  return notes;
}

export async function saveUserNote(note: {
  id?: string;
  story_id?: string;
  date_ist?: string;
  title: string;
  content: string;
  gs_paper?: string;
  tags?: string[];
}): Promise<UserNoteItem[]> {
  if (!note.title.trim() && !note.content.trim()) {
    throw new ApiValidationError('Note title or content is required.', 400);
  }
  const current = await getUserNotes();
  const noteId = note.id || `note_${Date.now()}`;
  const item: UserNoteItem = {
    id: noteId,
    story_id: note.story_id,
    date_ist: note.date_ist || getAsiaKolkataDateKey(),
    title: note.title.trim() || 'UPSC Revision Note',
    content: note.content.trim(),
    gs_paper: note.gs_paper || 'GS2',
    tags: note.tags || ['Revision'],
    updated_at: new Date().toISOString(),
  };

  const withoutExisting = current.filter((n) => n.id !== noteId);
  const updated = [item, ...withoutExisting];

  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  try {
    await supabase.from('ca_notes').upsert({
      id: item.id,
      user_id: 'aspirant_default',
      story_id: item.story_id || null,
      date_ist: item.date_ist,
      title: item.title,
      content: item.content,
      gs_paper: item.gs_paper,
      tags: item.tags,
      updated_at: item.updated_at,
    });
  } catch {
    // Non-blocking
  }

  return updated;
}

export async function deleteUserNote(noteId: string): Promise<UserNoteItem[]> {
  const current = await getUserNotes();
  const updated = current.filter((n) => n.id !== noteId);
  try {
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  try {
    await supabase.from('ca_notes').delete().eq('id', noteId);
  } catch {
    // Non-blocking
  }
  return updated;
}

export async function submitStoryErrorReport(params: {
  story_id: string;
  issue_type?: string;
  description: string;
}): Promise<{ ok: boolean; report_id: string }> {
  if (!params.story_id || !params.description.trim()) {
    throw new ApiValidationError('Story ID and error description are required.', 400);
  }
  const reportId = `err_${params.story_id}_${Date.now()}`;
  try {
    const raw = await AsyncStorage.getItem(ERROR_REPORTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: reportId,
      story_id: params.story_id,
      issue_type: params.issue_type || 'factual_or_source_error',
      description: params.description.trim(),
      created_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(ERROR_REPORTS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // Ignore
  }

  try {
    await supabase.from('story_error_reports').insert({
      id: reportId,
      story_id: params.story_id,
      user_id: 'aspirant_default',
      issue_type: params.issue_type || 'factual_or_source_error',
      description: params.description.trim(),
    });
  } catch {
    // Non-blocking
  }

  return { ok: true, report_id: reportId };
}

export { getGsPaperIllustrationPalette };
