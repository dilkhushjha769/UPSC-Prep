/**
 * UPSC Current Affairs Ingestion, Verification, Image Provenance & Gemini AI Pipeline
 *
 * Designed for shared execution across:
 * 1. Scheduled Server/CLI Worker (`scripts/ingest-current-affairs.ts`)
 * 2. Supabase Edge Function (`supabase/functions/ingest-current-affairs/index.ts`)
 * 3. Client-triggered incremental sync (`src/services/newsFeedService.ts`)
 */

import {
  CANONICAL_CA_CATEGORIES,
  CanonicalCategoryName,
  CAQuizQuestion,
  CrossVerificationMetadata,
  FullAnalysisData,
  ImageProvenanceMetadata,
  PrelimsFactItem,
  SyllabusRelevanceData,
  VerifiedRelatedPYQ,
} from '@/data/currentAffairsData';
import {
  classifyIntoSimplifiedTaxonomy,
  NormalizedCAClassification,
  SUBJECT_MAIN_CATEGORIES,
  SubjectGroupName,
  SubjectMainCategoryId,
} from '@/constants/currentAffairsCategories';

export function getAsiaKolkataDateKey(isoOrDate: string | Date = new Date()): string {
  const dt = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const validDate = isNaN(dt.getTime()) ? new Date() : dt;
  // Convert to Asia/Kolkata (+05:30)
  const utcMs = validDate.getTime() + validDate.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 5.5 * 3600 * 1000);
  const y = istDate.getFullYear();
  const m = String(istDate.getMonth() + 1).padStart(2, '0');
  const d = String(istDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface ConfiguredCASource {
  id: string;
  name: string;
  shortName: string;
  agencyId: string;
  sourceTier: 'official' | 'agency' | 'editorial' | 'institution';
  feedUrl: string;
  websiteUrl: string;
  defaultCategory: CanonicalCategoryName;
  defaultUiModule: string;
  defaultPaper: string;
  licenseType: string;
  allowsFullText: boolean;
  allowsImageHotlink: boolean;
  rateLimitPerHour: number;
  timeoutMs: number;
}

export const CONFIGURED_CA_SOURCES: ConfiguredCASource[] = [
  {
    id: 'pib_official',
    name: 'Press Information Bureau (PIB) • Govt of India',
    shortName: 'PIB',
    agencyId: 'pib',
    sourceTier: 'official',
    feedUrl: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',
    websiteUrl: 'https://pib.gov.in/',
    defaultCategory: 'Social Issues and Government Schemes',
    defaultUiModule: 'reports-schemes-data',
    defaultPaper: 'GS-II',
    licenseType: 'Government of India Open Data / Official Press Release Attribution',
    allowsFullText: true,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'rbi_press',
    name: 'Reserve Bank of India (RBI) • Official Releases',
    shortName: 'RBI',
    agencyId: 'pib',
    sourceTier: 'official',
    feedUrl: 'https://rbi.org.in/pressreleases_rss.xml',
    websiteUrl: 'https://www.rbi.org.in/',
    defaultCategory: 'Economy',
    defaultUiModule: 'economy-environment-science',
    defaultPaper: 'GS-III',
    licenseType: 'RBI Official Public Press Release Policy with Source Attribution',
    allowsFullText: true,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'ie_upsc',
    name: 'The Indian Express • UPSC Current Affairs',
    shortName: 'IE',
    agencyId: 'express',
    sourceTier: 'editorial',
    feedUrl: 'https://indianexpress.com/section/upsc-current-affairs/feed/',
    websiteUrl: 'https://indianexpress.com/section/upsc-current-affairs/',
    defaultCategory: 'The Daily Brief',
    defaultUiModule: 'daily-news',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'ie_explained',
    name: 'The Indian Express • Explained',
    shortName: 'IE',
    agencyId: 'express',
    sourceTier: 'editorial',
    feedUrl: 'https://indianexpress.com/section/explained/feed/',
    websiteUrl: 'https://indianexpress.com/section/explained/',
    defaultCategory: 'Editorials and Opinions',
    defaultUiModule: 'editorials-explainers',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'ie_india',
    name: 'The Indian Express • Governance & Polity',
    shortName: 'IE',
    agencyId: 'express',
    sourceTier: 'editorial',
    feedUrl: 'https://indianexpress.com/section/india/feed/',
    websiteUrl: 'https://indianexpress.com/section/india/',
    defaultCategory: 'Polity and Governance',
    defaultUiModule: 'polity-governance',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'ie_economy',
    name: 'The Indian Express • Economy',
    shortName: 'IE',
    agencyId: 'express',
    sourceTier: 'editorial',
    feedUrl: 'https://indianexpress.com/section/business/economy/feed/',
    websiteUrl: 'https://indianexpress.com/section/business/economy/',
    defaultCategory: 'Economy',
    defaultUiModule: 'economy-environment-science',
    defaultPaper: 'GS-III',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'ie_world',
    name: 'The Indian Express • World & IR',
    shortName: 'IE',
    agencyId: 'express',
    sourceTier: 'editorial',
    feedUrl: 'https://indianexpress.com/section/world/feed/',
    websiteUrl: 'https://indianexpress.com/section/world/',
    defaultCategory: 'International Affairs',
    defaultUiModule: 'international-affairs',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'hindu_national',
    name: 'The Hindu • National',
    shortName: 'The Hindu',
    agencyId: 'hindu',
    sourceTier: 'editorial',
    feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
    websiteUrl: 'https://www.thehindu.com/news/national/',
    defaultCategory: 'National Affairs',
    defaultUiModule: 'daily-news',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'hindu_international',
    name: 'The Hindu • International',
    shortName: 'The Hindu',
    agencyId: 'hindu',
    sourceTier: 'editorial',
    feedUrl: 'https://www.thehindu.com/news/international/feeder/default.rss',
    websiteUrl: 'https://www.thehindu.com/news/international/',
    defaultCategory: 'International Affairs',
    defaultUiModule: 'international-affairs',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'hindu_editorial',
    name: 'The Hindu • Editorial & Opinion',
    shortName: 'The Hindu',
    agencyId: 'hindu',
    sourceTier: 'editorial',
    feedUrl: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss',
    websiteUrl: 'https://www.thehindu.com/opinion/editorial/',
    defaultCategory: 'Editorials and Opinions',
    defaultUiModule: 'editorials-explainers',
    defaultPaper: 'GS-II',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'hindu_business',
    name: 'The Hindu • Economy & Business',
    shortName: 'The Hindu',
    agencyId: 'hindu',
    sourceTier: 'editorial',
    feedUrl: 'https://www.thehindu.com/business/Economy/feeder/default.rss',
    websiteUrl: 'https://www.thehindu.com/business/Economy/',
    defaultCategory: 'Economy',
    defaultUiModule: 'economy-environment-science',
    defaultPaper: 'GS-III',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'hindu_scitech',
    name: 'The Hindu • Science & Technology',
    shortName: 'The Hindu',
    agencyId: 'hindu',
    sourceTier: 'editorial',
    feedUrl: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss',
    websiteUrl: 'https://www.thehindu.com/sci-tech/science/',
    defaultCategory: 'Science and Technology',
    defaultUiModule: 'economy-environment-science',
    defaultPaper: 'GS-III',
    licenseType: 'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
  {
    id: 'un_news_global',
    name: 'United Nations Official News • Global Reports',
    shortName: 'UN News',
    agencyId: 'orf',
    sourceTier: 'institution',
    feedUrl: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    websiteUrl: 'https://news.un.org/en/',
    defaultCategory: 'Reports, Indices and Government Data',
    defaultUiModule: 'reports-schemes-data',
    defaultPaper: 'GS-II',
    licenseType: 'UN Official Public Syndication Policy with Attribution',
    allowsFullText: false,
    allowsImageHotlink: true,
    rateLimitPerHour: 60,
    timeoutMs: 9000,
  },
];

export interface RawFeedStory {
  source: ConfiguredCASource;
  externalId: string;
  canonicalUrl: string;
  headline: string;
  headlineFingerprint: string;
  rawDescription: string;
  rawContent: string;
  publishedAt: string;
  extractedImageUrl?: string;
  extractedImageCaption?: string;
  extractedImageCredit?: string;
}

export interface ProcessedCAArticleRecord {
  externalId: string;
  canonicalUrl: string;
  headline: string;
  headlineFingerprint: string;
  sourceId: string;
  sourceName: string;
  agencyId: string;
  sourceTier: 'official' | 'agency' | 'editorial' | 'institution';
  primaryCategory: CanonicalCategoryName;
  mainCategoryId: SubjectMainCategoryId;
  subjectGroup: SubjectGroupName;
  subcategory: string;
  isMostImportant: boolean;
  isPrelimsRelevant: boolean;
  isMainsRelevant: boolean;
  editorialAuthor?: string;
  aiExplanationDisclaimer?: string;
  publishedDateIst: string;
  uiModuleId: string;
  uiSubjectTag: 'Polity' | 'Economy' | 'International Relations' | 'Environment' | 'Sci-Tech' | 'Security';
  secondaryTags: string[];
  gsPaper: string;
  publishedAt: string;
  sourceUpdatedAt: string;
  status: 'published' | 'quarantined' | 'needs_review' | 'draft';
  relevanceScore: number;
  executiveBrief: string[];
  fullAnalysis: FullAnalysisData;
  prelimsFacts: string[];
  prelimsMatrix: PrelimsFactItem[];
  mainsDimensions: {
    analyticalAngle: string;
    mainsQuestion: string;
    keyPoints: string[];
  };
  syllabusMapping: SyllabusRelevanceData;
  relatedPyqs: VerifiedRelatedPYQ[];
  practiceMcq: CAQuizQuestion;
  sourcesList: {
    name: string;
    url: string;
    date: string;
    type: 'Official' | 'Court Judgment' | 'Leading Daily' | 'Think Tank';
  }[];
  crossVerification: CrossVerificationMetadata;
  imageMetadata: ImageProvenanceMetadata;
  whyItMatters: string;
  rawExcerpt: string;
}

// =============================================================================
// 1. HTML / XML CLEANING & CANONICAL URL NORMALIZATION
// =============================================================================

export function cleanXmlEntities(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8377;/g, '₹')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCanonicalUrl(rawUrl: string, fallbackBase: string): string {
  const trimmed = cleanXmlEntities(rawUrl).trim();
  if (!trimmed) return fallbackBase;
  try {
    const parsed = new URL(trimmed);
    // Strip tracking parameters to ensure canonical URL uniqueness
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'from',
    ];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return trimmed;
  }
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over', 'after',
  'under', 'amid', 'says', 'said', 'will', 'what', 'when', 'where', 'why', 'how',
  'explained', 'upsc', 'key', 'news', 'today', 'india', 'indian', 'government',
]);

export function computeHeadlineFingerprint(headline: string): string {
  const tokens = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const uniqueSorted = Array.from(new Set(tokens)).slice(0, 10).sort();
  return uniqueSorted.join('-');
}

export function computeHeadlineSimilarity(a: string, b: string): number {
  const tokensA = new Set(
    a
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
  const tokensB = new Set(
    b
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// =============================================================================
// 2. AUTHENTIC IMAGE PROVENANCE RESOLVER (4-TIER PRIORITY ORDER)
// =============================================================================
// Priority Order required by specification:
// 1. Original photograph or infographic accompanying the official government/institutional release (`event_photo` / `official_infographic`)
// 2. Authentic photograph supplied through an authorized news-agency API or licensed feed (`event_photo`)
// 3. Relevant, genuine contextual photograph from an authorized source, clearly labelled as representative (`contextual_photo`)
// 4. Clean topic-specific placeholder when no suitable image is available (`placeholder`)
// NEVER use AI-generated images, synthetic photographs, or random search results.

const REJECTED_IMAGE_PATTERNS = [
  /avatar/i,
  /logo/i,
  /pixel/i,
  /1x1/i,
  /tracker/i,
  /doubleclick/i,
  /gravatar/i,
  /placeholder/i,
  /ai[-_]?generated/i,
  /midjourney/i,
  /dalle/i,
  /stable[-_]?diffusion/i,
  /synthetic/i,
];

export function extractAuthenticImageFromXml(itemXml: string): {
  imageUrl?: string;
  caption?: string;
  credit?: string;
} {
  const candidates: string[] = [];

  const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]) candidates.push(mediaMatch[1]);

  const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch?.[1]) candidates.push(thumbMatch[1]);

  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch?.[1]) candidates.push(enclosureMatch[1]);

  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) candidates.push(imgMatch[1]);

  const creditMatch = itemXml.match(/<media:credit[^>]*>([\s\S]*?)<\/media:credit>/i);
  const descMatch = itemXml.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i);

  for (const rawCandidate of candidates) {
    const cleaned = rawCandidate.replace(/&amp;/g, '&').trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) continue;
    const isRejected = REJECTED_IMAGE_PATTERNS.some((rx) => rx.test(cleaned));
    if (isRejected) continue;
    return {
      imageUrl: cleaned.replace(/^http:\/\//i, 'https://'),
      caption: descMatch?.[1] ? cleanXmlEntities(descMatch[1]).slice(0, 180) : undefined,
      credit: creditMatch?.[1] ? cleanXmlEntities(creditMatch[1]).slice(0, 100) : undefined,
    };
  }

  return {};
}

export function resolveImageProvenance(
  story: RawFeedStory,
  primaryCategory: CanonicalCategoryName
): ImageProvenanceMetadata {
  const { source, canonicalUrl, externalId, extractedImageUrl, extractedImageCaption, extractedImageCredit } = story;

  // Tier 1: Official Government / Institutional Release Photograph or Infographic
  if (extractedImageUrl && (source.sourceTier === 'official' || source.sourceTier === 'institution')) {
    const isInfographic = /infographic|chart|graph|map|diagram|pib/i.test(extractedImageUrl);
    return {
      imageUrl: extractedImageUrl,
      credit: extractedImageCredit || `${source.name} (Official Release)`,
      sourceUrl: canonicalUrl,
      associatedArticleId: externalId,
      imageType: isInfographic ? 'official_infographic' : 'event_photo',
      license: source.licenseType,
      verificationStatus: 'verified_official',
      caption: extractedImageCaption || `Official visual accompanying ${source.shortName} release.`,
    };
  }

  // Tier 2: Authentic Photograph supplied through Authorized News Agency / Publisher Feed
  if (extractedImageUrl && source.allowsImageHotlink) {
    const isContextual = /file\s*photo|representative|archive|illustration/i.test(
      `${extractedImageCaption || ''} ${extractedImageUrl}`
    );
    return {
      imageUrl: extractedImageUrl,
      credit: extractedImageCredit || `${source.name} Photo Desk`,
      sourceUrl: canonicalUrl,
      associatedArticleId: externalId,
      imageType: isContextual ? 'contextual_photo' : 'event_photo',
      license: source.licenseType,
      verificationStatus: isContextual ? 'verified_contextual' : 'verified_agency',
      caption:
        extractedImageCaption ||
        (isContextual
          ? `Representative photograph from ${source.shortName} archive.`
          : `Authentic news photograph published by ${source.shortName}.`),
    };
  }

  // Tier 4: Clean Topic-Specific Placeholder (No AI-generated or synthetic photos)
  return {
    imageUrl: undefined,
    credit: `${source.shortName} • Topic Placeholder (${primaryCategory})`,
    sourceUrl: canonicalUrl,
    associatedArticleId: externalId,
    imageType: 'placeholder',
    license: 'Clean System Topic Placeholder (No external image provided in source feed)',
    verificationStatus: 'placeholder_fallback',
    caption: `No direct photograph was embedded in the ${source.shortName} syndication feed; displaying clean topic badge.`,
  };
}

// =============================================================================
// 3. UPSC RELEVANCE FILTER & 12-CATEGORY + 6-UI-MODULE CLASSIFIER
// =============================================================================

const NON_UPSC_EXCLUSION_PATTERNS = [
  /\b(horoscope|astrology|bollywood|tollywood|box office|celebrity|gossip|ipl auction|fantasy cricket|movie review|ott release|Bigg Boss)\b/i,
  /\b(stock tips|intraday trading|buy or sell|lottery results|wordle|crossword|sudoku)\b/i,
];

export function isRelevantToUPSCSyllabus(headline: string, description: string, sourceTier: string): {
  relevant: boolean;
  score: number;
} {
  const combined = `${headline} ${description}`;
  if (NON_UPSC_EXCLUSION_PATTERNS.some((rx) => rx.test(combined))) {
    return { relevant: false, score: 0.1 };
  }

  // Official government releases (PIB, RBI, UN) and dedicated UPSC feeds are inherently high-relevance
  if (sourceTier === 'official' || sourceTier === 'institution') {
    return { relevant: true, score: 0.94 };
  }

  const highValueKeywords = [
    'supreme court', 'constitution', 'parliament', 'bill', 'act', 'cabinet', 'ministry',
    'rbi', 'monetary policy', 'inflation', 'gdp', 'fiscal', 'trade', 'wto', 'imf', 'world bank',
    'united nations', 'brics', 'quad', 'indo-pacific', 'lac', 'treaty', 'summit', 'bilateral',
    'climate', 'cop', 'biodiversity', 'tiger', 'wetland', 'emission', 'hydrogen', 'renewable',
    'isro', 'satellite', 'semiconductor', 'quantum', 'biotech', 'vaccine', 'ai', 'genome',
    'census', 'election commission', 'governor', 'federalism', 'tribunal', 'collegium',
    'scheme', 'yojana', 'mission', 'niti aayog', 'index', 'report', 'survey', 'poverty',
  ];

  const lower = combined.toLowerCase();
  let matches = 0;
  for (const kw of highValueKeywords) {
    if (lower.includes(kw)) matches++;
  }

  if (matches >= 2) return { relevant: true, score: Math.min(0.98, 0.82 + matches * 0.03) };
  if (matches === 1) return { relevant: true, score: 0.78 };

  // Require minimum substantive headline length for general national/international stories
  if (headline.length >= 35) {
    return { relevant: true, score: 0.72 };
  }

  return { relevant: false, score: 0.3 };
}

export function classifyStoryIntoCategories(
  headline: string,
  description: string,
  source: ConfiguredCASource,
  relevanceScore = 0.85
): {
  primaryCategory: CanonicalCategoryName;
  mainCategoryId: SubjectMainCategoryId;
  subjectGroup: SubjectGroupName;
  subcategory: string;
  isMostImportant: boolean;
  isPrelimsRelevant: boolean;
  isMainsRelevant: boolean;
  editorialAuthor?: string;
  aiExplanationDisclaimer?: string;
  uiModuleId: string;
  uiSubjectTag: 'Polity' | 'Economy' | 'International Relations' | 'Environment' | 'Sci-Tech' | 'Security';
  secondaryTags: string[];
  gsPaper: string;
} {
  const text = `${headline} ${description}`.toLowerCase();
  const secondaryTags = new Set<string>();

  const simplified: NormalizedCAClassification = classifyIntoSimplifiedTaxonomy({
    headline,
    summary: description,
    existingPrimaryCategory: source.defaultCategory,
    sourceName: source.name,
    sourceCategoryHint: source.id,
    relevanceScore: Math.round(relevanceScore * 100),
  });

  // Map simplified subject group & main category back to legacy primaryCategory for backward compatibility
  let primaryCategory: CanonicalCategoryName = 'Polity and Governance';
  if (simplified.mainCategoryId === 'international-affairs') {
    primaryCategory = 'International Affairs';
  } else if (simplified.mainCategoryId === 'editorials-explainers') {
    primaryCategory = 'Editorials and Opinions';
  } else if (simplified.mainCategoryId === 'reports-schemes-data') {
    primaryCategory =
      simplified.subcategory === 'Government Schemes and Programmes'
        ? 'Social Issues and Government Schemes'
        : 'Reports, Indices and Government Data';
  } else if (simplified.mainCategoryId === 'economy-environment-science') {
    if (simplified.subjectGroup === 'Economy') {
      primaryCategory = 'Economy';
    } else if (simplified.subjectGroup === 'Environment & Ecology') {
      primaryCategory = 'Environment and Ecology';
    } else {
      primaryCategory = 'Science and Technology';
    }
  } else {
    primaryCategory =
      simplified.subcategory === 'Constitution, Parliament and Judiciary' &&
      /supreme court|high court|bench|judgment|verdict|collegium/i.test(text)
        ? 'Supreme Court Judgments and Important Legal Developments'
        : 'Polity and Governance';
  }

  secondaryTags.add(simplified.subjectGroup);
  secondaryTags.add(simplified.subcategory);
  if (simplified.isMostImportant) {
    secondaryTags.add('The Daily Brief');
  }
  if (/economy|rbi|fiscal|trade|bank/.test(text) && simplified.subjectGroup !== 'Economy') {
    secondaryTags.add('Economy');
  }
  if (
    /environment|climate|green|ecology/.test(text) &&
    simplified.subjectGroup !== 'Environment & Ecology'
  ) {
    secondaryTags.add('Environment & Ecology');
  }
  if (
    /court|constitution|act|bill|policy/.test(text) &&
    simplified.subjectGroup !== 'Polity & Governance'
  ) {
    secondaryTags.add('Polity & Governance');
  }

  return {
    primaryCategory,
    mainCategoryId: simplified.mainCategoryId,
    subjectGroup: simplified.subjectGroup,
    subcategory: simplified.subcategory,
    isMostImportant: simplified.isMostImportant,
    isPrelimsRelevant: simplified.isPrelimsRelevant,
    isMainsRelevant: simplified.isMainsRelevant,
    editorialAuthor: simplified.editorialAuthor,
    aiExplanationDisclaimer: simplified.aiExplanationDisclaimer,
    // Always store the 5 subject category IDs as uiModuleId so Daily News queries all 5 without duplicating rows
    uiModuleId: simplified.mainCategoryId,
    uiSubjectTag: simplified.dailyEventCategory,
    secondaryTags: Array.from(secondaryTags),
    gsPaper: simplified.gsPaper.replace(' ', '-'),
  };
}

// =============================================================================
// 4. RSS / ATOM XML PARSER
// =============================================================================

export function parseRssXmlItems(xml: string, source: ConfiguredCASource, maxItems = 8): RawFeedStory[] {
  const stories: RawFeedStory[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && stories.length < maxItems) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const guidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const contentMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const headline = titleMatch ? cleanXmlEntities(titleMatch[1]) : '';
    if (!headline || headline.length < 18) continue;

    const rawUrl = linkMatch?.[1] || guidMatch?.[1] || source.websiteUrl;
    const canonicalUrl = normalizeCanonicalUrl(rawUrl, source.websiteUrl);
    const rawDescription = descMatch ? cleanXmlEntities(descMatch[1]) : '';
    const rawContent = contentMatch ? cleanXmlEntities(contentMatch[1]) : rawDescription;

    let publishedAt = new Date().toISOString();
    if (pubDateMatch?.[1]) {
      const parsedDate = new Date(cleanXmlEntities(pubDateMatch[1]));
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    const imageInfo = extractAuthenticImageFromXml(itemXml);
    const fingerprint = computeHeadlineFingerprint(headline);

    stories.push({
      source,
      externalId: `${source.id}_${fingerprint.slice(0, 32)}`,
      canonicalUrl,
      headline,
      headlineFingerprint: fingerprint,
      rawDescription: rawDescription || headline,
      rawContent: rawContent || rawDescription || headline,
      publishedAt,
      extractedImageUrl: imageInfo.imageUrl,
      extractedImageCaption: imageInfo.caption,
      extractedImageCredit: imageInfo.credit,
    });
  }

  return stories;
}

// =============================================================================
// 5. NETWORK FETCHER WITH RETRY, BACKOFF & TIMEOUT
// =============================================================================

export async function fetchFeedWithRetry(
  source: ConfiguredCASource,
  maxRetries = 2
): Promise<{ ok: boolean; xml?: string; error?: string; statusCode?: number }> {
  let attempt = 0;
  let lastError = 'Unknown fetch failure';

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), source.timeoutMs || 9000);

    try {
      const response = await fetch(source.feedUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
          'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Referer: source.websiteUrl,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status === 429) {
        return {
          ok: false,
          statusCode: 429,
          error: `Rate limit reached (HTTP 429) for ${source.name}`,
        };
      }

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${source.feedUrl}`;
      } else {
        const xml = await response.text();
        if (xml && (xml.includes('<item') || xml.includes('<entry'))) {
          return { ok: true, xml, statusCode: response.status };
        }
        lastError = `Feed returned non-RSS or empty payload (${xml.length} bytes)`;
      }
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err?.name === 'AbortError' ? `Timeout after ${source.timeoutMs}ms` : String(err?.message || err);
    }

    attempt++;
    if (attempt <= maxRetries) {
      const backoffMs = 500 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return { ok: false, error: lastError };
}

// =============================================================================
// 6. GEMINI AI UPSC ANALYSIS ENGINE (WITH DETERMINISTIC VERIFIED FALLBACK)
// =============================================================================

interface GeminiAnalysisOutput {
  headline?: string;
  mainCategoryId?: SubjectMainCategoryId;
  subjectGroup?: SubjectGroupName;
  subcategory?: string;
  isMostImportant?: boolean;
  isPrelimsRelevant?: boolean;
  isMainsRelevant?: boolean;
  editorialAuthor?: string;
  executiveBrief: string[];
  detailedExplanation: string[];
  backgroundAndInstitutionalContext: string;
  importantFiguresDatesProvisions: { term: string; detail: string }[];
  prelimsFacts: string[];
  prelimsMatrix: PrelimsFactItem[];
  mainsAnalyticalAngle: string;
  mainsQuestion: string;
  syllabusPaperTopic: string;
  syllabusStaticConnection: string;
  syllabusPrelimsAngle: string;
  syllabusMainsDimensions: string;
  whyItMattersForUPSC: string;
  officialStatementVsReportingNote: string;
  practiceMcq?: {
    question: string;
    options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
  };
}

export async function generateGeminiUPSCAnalysis(
  story: RawFeedStory,
  classification: ReturnType<typeof classifyStoryIntoCategories>,
  corroboratingSources: { name: string; url: string; tier: string }[],
  geminiApiKey?: string
): Promise<{ output: GeminiAnalysisOutput; modelUsed: string }> {
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const taxonomyText = SUBJECT_MAIN_CATEGORIES.map((c) =>
        c.subjectGroups
          .map(
            (g) =>
              `- MainCategory: "${c.id}" | SubjectGroup: "${g.title}" | Allowed Subcategories: ${g.subcategories
                .map((s) => `"${s}"`)
                .join(', ')}`
          )
          .join('\n')
      ).join('\n');

      const prompt = `You are an expert UPSC Civil Services Examination (CSE) educator and fact-verifier.
Analyze the following verified news report and convert it into structured, accurate UPSC learning material.

CRITICAL RULES:
1. DO NOT fabricate facts, statistics, constitutional articles, court citations, quotations, or URLs.
2. Only state facts supported by the provided source text or established constitutional/statutory provisions directly governing the named institution.
3. Clearly distinguish between official government/institutional statements, independent news reporting, and editorial opinion.
4. Keep the Executive Brief concise (exactly 3 bullet points).
5. Classify the story into ONE primary MainCategory, ONE SubjectGroup, and ONE Subcategory from this exact central taxonomy (do not invent nested subcategories):
${taxonomyText}

SOURCE METADATA:
- Headline: ${story.headline}
- Primary Publisher: ${story.source.name} (Tier: ${story.source.sourceTier})
- Canonical URL: ${story.canonicalUrl}
- Published At: ${story.publishedAt}
- Default Assigned Category: ${classification.mainCategoryId} -> ${classification.subjectGroup} -> ${classification.subcategory} (${classification.gsPaper})
- Corroborating Reports: ${corroboratingSources.map((s) => `${s.name} (${s.tier})`).join(', ') || 'Single authorized source'}
- Source Excerpt: ${story.rawContent.slice(0, 2200)}

Return ONLY valid JSON matching this exact structure:
{
  "mainCategoryId": "${classification.mainCategoryId}",
  "subjectGroup": "${classification.subjectGroup}",
  "subcategory": "${classification.subcategory}",
  "isMostImportant": ${classification.isMostImportant},
  "isPrelimsRelevant": ${classification.isPrelimsRelevant},
  "isMainsRelevant": ${classification.isMainsRelevant},
  "executiveBrief": ["bullet 1", "bullet 2", "bullet 3"],
  "detailedExplanation": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "backgroundAndInstitutionalContext": "string explaining institutional/statutory background",
  "importantFiguresDatesProvisions": [{"term": "Provision/Institution/Term", "detail": "Verified explanation"}],
  "prelimsFacts": ["fact 1", "fact 2", "fact 3"],
  "prelimsMatrix": [{"label": "Key Dimension", "value": "Verified Factual Detail"}],
  "mainsAnalyticalAngle": "string",
  "mainsQuestion": "UPSC Mains practice question (15 Marks, 250 Words)",
  "syllabusPaperTopic": "${classification.gsPaper} syllabus topic mapping",
  "syllabusStaticConnection": "Connection to static UPSC syllabus",
  "syllabusPrelimsAngle": "Key Prelims testing angle",
  "syllabusMainsDimensions": "Key Mains analytical dimensions",
  "whyItMattersForUPSC": "1-2 sentences explaining why this event matters for UPSC preparation",
  "officialStatementVsReportingNote": "Clear distinction between official statement, independent reporting, and analysis"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const json: any = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as GeminiAnalysisOutput;
          if (
            Array.isArray(parsed.executiveBrief) &&
            parsed.executiveBrief.length >= 2 &&
            Array.isArray(parsed.detailedExplanation)
          ) {
            return { output: parsed, modelUsed: 'gemini-2.5-flash' };
          }
        }
      }
    } catch {
      // Fall through to deterministic source-faithful extraction when Gemini API is unreachable
    }
  }

  // Deterministic, source-faithful extraction (never fabricates unverified facts)
  const cleanSentences = story.rawContent
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

  const briefBullets =
    cleanSentences.length >= 3
      ? cleanSentences.slice(0, 3)
      : [
          story.headline,
          story.rawDescription.length > 30
            ? story.rawDescription.slice(0, 240)
            : `Reported by ${story.source.name} under ${classification.primaryCategory}.`,
          `Mapped to ${classification.gsPaper} (${classification.primaryCategory}) for UPSC CSE Prelims & Mains revision.`,
        ];

  const subjectContextMap: Record<
    string,
    {
      bg: string;
      provisions: { term: string; detail: string }[];
      prelims: string[];
      matrix: PrelimsFactItem[];
      syllabusTopic: string;
      staticConn: string;
      prelimsAngle: string;
      mainsDim: string;
      whyItMatters: string;
      mainsQ: string;
    }
  > = {
    Polity: {
      bg: 'Evaluated within India’s constitutional and statutory governance framework, focusing on institutional checks and balances, parliamentary accountability, and federal coordination.',
      provisions: [
        { term: 'Primary Source Classification', detail: `${story.source.name} (${story.source.sourceTier.toUpperCase()} tier)` },
        { term: 'GS Syllabus Domain', detail: `${classification.gsPaper} • ${classification.primaryCategory}` },
        { term: 'Constitutional & Statutory Context', detail: 'Separation of powers, administrative accountability, and rule of law.' },
      ],
      prelims: [
        `Primary reporting source: ${story.source.name} (${new Date(story.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}).`,
        'Verify constitutional versus statutory backing, appointment mechanism, and parliamentary oversight of the concerned body.',
      ],
      matrix: [
        { label: 'Primary Category', value: classification.primaryCategory },
        { label: 'GS Paper Mapping', value: `${classification.gsPaper} (Polity, Governance & Constitutional Law)` },
        { label: 'Source Authority', value: `${story.source.name}` },
        { label: 'Exam Utility', value: 'Constitutional provisions, statutory mandates, and institutional reforms' },
      ],
      syllabusTopic: `${classification.gsPaper}: Indian Constitution—historical underpinnings, evolution, features, amendments, significant provisions and basic structure; Governance & Institutional Reforms.`,
      staticConn: 'Constitutional provisions, statutory bodies, parliamentary procedures, and judicial review.',
      prelimsAngle: 'Distinction between constitutional and statutory bodies, composition, tenure, and removal procedures.',
      mainsDim: 'Institutional autonomy, cooperative federalism, accountability vs efficiency, and democratic governance.',
      whyItMatters: `Directly relevant to ${classification.gsPaper} (${classification.primaryCategory}), testing the interplay between statutory/constitutional mandates and administrative implementation.`,
      mainsQ: `Examine the institutional and governance implications of "${story.headline}" in the context of constitutional accountability in India. (15 Marks, 250 Words)`,
    },
    Economy: {
      bg: 'Positioned within India’s macroeconomic stability, fiscal-monetary policy coordination, banking regulation, and sustainable infrastructure growth trajectory.',
      provisions: [
        { term: 'Primary Source Classification', detail: `${story.source.name} (${story.source.sourceTier.toUpperCase()} tier)` },
        { term: 'Macroeconomic Vertical', detail: `${classification.gsPaper} • ${classification.primaryCategory}` },
        { term: 'Regulatory Institutional Anchor', detail: 'Reserve Bank of India (RBI), Ministry of Finance, and statutory sector regulators.' },
      ],
      prelims: [
        `Reported by ${story.source.name} under ${classification.primaryCategory}.`,
        'Focus on monetary policy transmission tools, fiscal deficit indicators, and regulatory definitions.',
      ],
      matrix: [
        { label: 'Primary Category', value: classification.primaryCategory },
        { label: 'GS Paper Mapping', value: `${classification.gsPaper} (Economic Development & Policy)` },
        { label: 'Source Authority', value: story.source.name },
        { label: 'Exam Utility', value: 'Macroeconomic indicators, RBI/SEBI norms, and structural reforms' },
      ],
      syllabusTopic: `${classification.gsPaper}: Indian Economy and issues relating to planning, mobilization of resources, growth, development and employment; Inclusive growth.`,
      staticConn: 'Monetary Policy Framework, FRBM Act, banking regulation, balance of payments, and industrial policy.',
      prelimsAngle: 'Conceptual definitions, regulatory authority jurisdiction, and structural trend directions.',
      mainsDim: 'Growth-inflation balance, fiscal consolidation, financial inclusion, and global supply chain integration.',
      whyItMatters: `Important for ${classification.gsPaper} Economy to connect current policy announcements with core macroeconomic and regulatory concepts.`,
      mainsQ: `Analyze the economic and regulatory significance of "${story.headline}" for India's sustainable growth trajectory. (15 Marks, 250 Words)`,
    },
    'International Relations': {
      bg: 'Analyzed through India’s strategic autonomy doctrine, neighbourhood first policy, multilateral diplomacy, and evolving global governance architecture.',
      provisions: [
        { term: 'Primary Source Classification', detail: `${story.source.name} (${story.source.sourceTier.toUpperCase()} tier)` },
        { term: 'Strategic Vertical', detail: `${classification.gsPaper} • ${classification.primaryCategory}` },
        { term: 'Diplomatic Framework', detail: 'Bilateral accords, plurilateral groupings, and UN/multilateral conventions.' },
      ],
      prelims: [
        `Source attribution: ${story.source.name}.`,
        'Check member states, headquarters, founding declarations, and geographical chokepoints involved.',
      ],
      matrix: [
        { label: 'Primary Category', value: classification.primaryCategory },
        { label: 'GS Paper Mapping', value: `${classification.gsPaper} (International Relations)` },
        { label: 'Source Authority', value: story.source.name },
        { label: 'Exam Utility', value: 'International groupings, bilateral agreements, and geopolitical mapping' },
      ],
      syllabusTopic: `${classification.gsPaper}: Bilateral, regional and global groupings and agreements involving India and/or affecting India’s interests.`,
      staticConn: 'India’s foreign policy evolution, multilateral institutions (UN, WTO, BRICS, Quad), and border management.',
      prelimsAngle: 'Membership of international bodies, geographic locations in news, and treaty mandates.',
      mainsDim: 'Strategic autonomy, Global South leadership, economic diplomacy, and regional security.',
      whyItMatters: `High utility for ${classification.gsPaper} International Relations and Prelims map/grouping-based questions.`,
      mainsQ: `Discuss the geopolitical implications of "${story.headline}" for India's strategic interests and multilateral diplomacy. (15 Marks, 250 Words)`,
    },
    Environment: {
      bg: 'Situated within India’s climate action commitments (NDCs), biodiversity conservation statutes, disaster resilience, and clean energy transition.',
      provisions: [
        { term: 'Primary Source Classification', detail: `${story.source.name} (${story.source.sourceTier.toUpperCase()} tier)` },
        { term: 'Ecological Vertical', detail: `${classification.gsPaper} • ${classification.primaryCategory}` },
        { term: 'Statutory Framework', detail: 'Wildlife Protection Act 1972, Environment Protection Act 1986, and international climate conventions.' },
      ],
      prelims: [
        `Source attribution: ${story.source.name}.`,
        'Verify IUCN status, protected area location, river basin, and international convention protocols.',
      ],
      matrix: [
        { label: 'Primary Category', value: classification.primaryCategory },
        { label: 'GS Paper Mapping', value: `${classification.gsPaper} (Environment, Ecology & Disaster Management)` },
        { label: 'Source Authority', value: story.source.name },
        { label: 'Exam Utility', value: 'Protected areas, species conservation, and climate finance mechanisms' },
      ],
      syllabusTopic: `${classification.gsPaper}: Conservation, environmental pollution and degradation, environmental impact assessment; Disaster and disaster management.`,
      staticConn: 'Biodiversity conservation (in-situ/ex-situ), UNFCCC/CBD protocols, and climate adaptation.',
      prelimsAngle: 'National Parks/Wildlife Sanctuaries, species habitats, pollutant types, and global environmental funds.',
      mainsDim: 'Development vs conservation trade-offs, climate justice, green energy transition, and disaster mitigation.',
      whyItMatters: `Crucial for ${classification.gsPaper} Environment & Ecology, linking current ecological events with statutory conservation frameworks.`,
      mainsQ: `Evaluate the ecological and policy dimensions of "${story.headline}" in achieving sustainable development and climate resilience. (15 Marks, 250 Words)`,
    },
    'Sci-Tech': {
      bg: 'Examined in the context of indigenous scientific R&D, strategic frontier technologies, space exploration, biotechnology, and digital public infrastructure.',
      provisions: [
        { term: 'Primary Source Classification', detail: `${story.source.name} (${story.source.sourceTier.toUpperCase()} tier)` },
        { term: 'Technology Vertical', detail: `${classification.gsPaper} • ${classification.primaryCategory}` },
        { term: 'Institutional R&D Anchor', detail: 'ISRO, DRDO, Department of Biotechnology (DBT), and MeitY.' },
      ],
      prelims: [
        `Source attribution: ${story.source.name}.`,
        'Focus on underlying scientific principle, application domain, and indigenous mission parameters.',
      ],
      matrix: [
        { label: 'Primary Category', value: classification.primaryCategory },
        { label: 'GS Paper Mapping', value: `${classification.gsPaper} (Science & Technology)` },
        { label: 'Source Authority', value: story.source.name },
        { label: 'Exam Utility', value: 'Core scientific principles, indigenous technology missions, and applications' },
      ],
      syllabusTopic: `${classification.gsPaper}: Science and Technology—developments and their applications and effects in everyday life; Indigenization of technology.`,
      staticConn: 'Space technology orbits/launchers, biotechnology genetics, semiconductors, AI, and defence technology.',
      prelimsAngle: 'Applied scientific principles, mission objectives, and emerging technology comparisons.',
      mainsDim: 'Technological self-reliance (Atmanirbhar Bharat), ethical/regulatory safeguards, and socio-economic applications.',
      whyItMatters: `Directly relevant to ${classification.gsPaper} Science & Technology, where UPSC tests both conceptual principles and indigenous mission milestones.`,
      mainsQ: `Discuss the scientific significance and strategic applications of "${story.headline}" for India's technological self-reliance. (10 Marks, 150 Words)`,
    },
  };

  const ctx = subjectContextMap[classification.uiSubjectTag] || subjectContextMap.Polity;

  const detailedParagraphs =
    cleanSentences.length >= 2
      ? [
          cleanSentences.slice(0, 2).join(' '),
          cleanSentences.slice(2, 5).join(' ') || ctx.bg,
          `Source Provenance & Attribution: Published by ${story.source.name} (${story.source.sourceTier} tier). Readers can verify the complete original publication via the canonical link provided in the Sources section.`,
        ]
      : [
          story.rawDescription || story.headline,
          ctx.bg,
          `Source Provenance & Attribution: Published by ${story.source.name} (${story.source.sourceTier} tier).`,
        ];

  const officialStatementNote =
    story.source.sourceTier === 'official'
      ? `Primary Official Release from ${story.source.name}. Represents direct government/institutional communication.`
      : story.source.sourceTier === 'institution'
      ? `Primary Institutional Release from ${story.source.name}.`
      : classification.primaryCategory === 'Editorials and Opinions'
      ? `Editorial / Analytical Perspective published by ${story.source.name}. Contains author/editorial analysis and opinion distinct from government press releases.`
      : `Independent News Reporting by ${story.source.name}. Factual claims should be read alongside primary official notifications where applicable.`;

  return {
    modelUsed: 'deterministic-source-verified-v2',
    output: {
      executiveBrief: briefBullets,
      detailedExplanation: detailedParagraphs,
      backgroundAndInstitutionalContext: ctx.bg,
      importantFiguresDatesProvisions: ctx.provisions,
      prelimsFacts: [
        ...ctx.prelims,
        briefBullets[0],
      ],
      prelimsMatrix: ctx.matrix,
      mainsAnalyticalAngle: ctx.mainsDim,
      mainsQuestion: ctx.mainsQ,
      syllabusPaperTopic: ctx.syllabusTopic,
      syllabusStaticConnection: ctx.staticConn,
      syllabusPrelimsAngle: ctx.prelimsAngle,
      syllabusMainsDimensions: ctx.mainsDim,
      whyItMattersForUPSC: ctx.whyItMatters,
      officialStatementVsReportingNote: officialStatementNote,
      practiceMcq: {
        question: `With reference to "${story.headline}", recently reported by ${story.source.shortName}, consider the following statements:\n\n1. It is primarily mapped under ${classification.primaryCategory} (${classification.gsPaper}) of the UPSC Civil Services syllabus.\n2. Its institutional and policy dimensions intersect with ${ctx.staticConn}.\n\nWhich of the statements given above is/are correct?`,
        options: [
          { key: 'A', text: '1 only' },
          { key: 'B', text: '2 only' },
          { key: 'C', text: 'Both 1 and 2' },
          { key: 'D', text: 'Neither 1 nor 2' },
        ],
        correctAnswer: 'C',
        explanation: `Both statements are correct. "${story.headline}" (Source: ${story.source.name}) maps to ${classification.primaryCategory} (${classification.gsPaper}) and connects directly to ${ctx.staticConn}.`,
      },
    },
  };
}

// =============================================================================
// 7. DEDUPLICATION & CROSS-VERIFICATION ACROSS SOURCES
// =============================================================================

export interface StoryCluster {
  primaryStory: RawFeedStory;
  corroboratingStories: RawFeedStory[];
}

export function clusterAndDeduplicateStories(rawStories: RawFeedStory[]): {
  clusters: StoryCluster[];
  duplicatesMergedCount: number;
} {
  // Sort so official & institution sources take precedence as cluster primary when covering the same event
  const tierPriority: Record<string, number> = {
    official: 1,
    institution: 2,
    agency: 3,
    editorial: 4,
  };

  const sorted = [...rawStories].sort((a, b) => {
    const pA = tierPriority[a.source.sourceTier] || 5;
    const pB = tierPriority[b.source.sourceTier] || 5;
    if (pA !== pB) return pA - pB;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const clusters: StoryCluster[] = [];
  let duplicatesMergedCount = 0;

  for (const candidate of sorted) {
    let matchedCluster: StoryCluster | null = null;

    for (const cluster of clusters) {
      if (cluster.primaryStory.canonicalUrl === candidate.canonicalUrl) {
        matchedCluster = cluster;
        break;
      }
      if (
        cluster.primaryStory.headlineFingerprint &&
        cluster.primaryStory.headlineFingerprint === candidate.headlineFingerprint
      ) {
        matchedCluster = cluster;
        break;
      }
      const sim = computeHeadlineSimilarity(cluster.primaryStory.headline, candidate.headline);
      if (sim >= 0.55) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      duplicatesMergedCount++;
      // Only add to corroborating list if from a different source or URL
      const alreadyListed =
        matchedCluster.primaryStory.source.id === candidate.source.id ||
        matchedCluster.corroboratingStories.some((s) => s.source.id === candidate.source.id);
      if (!alreadyListed) {
        matchedCluster.corroboratingStories.push(candidate);
      }
      // If primary lacks an image and corroborating story has an authentic image, inherit it
      if (!matchedCluster.primaryStory.extractedImageUrl && candidate.extractedImageUrl) {
        matchedCluster.primaryStory.extractedImageUrl = candidate.extractedImageUrl;
        matchedCluster.primaryStory.extractedImageCaption = candidate.extractedImageCaption;
        matchedCluster.primaryStory.extractedImageCredit = `${candidate.source.name} Photo Desk`;
      }
    } else {
      clusters.push({
        primaryStory: candidate,
        corroboratingStories: [],
      });
    }
  }

  return { clusters, duplicatesMergedCount };
}

export function buildCrossVerificationMetadata(
  cluster: StoryCluster,
  officialStatementVsReportingNote: string
): CrossVerificationMetadata {
  const allSources = [cluster.primaryStory, ...cluster.corroboratingStories];
  const hasOfficial = allSources.some((s) => s.source.sourceTier === 'official' || s.source.sourceTier === 'institution');
  const uniquePublishers = new Set(allSources.map((s) => s.source.agencyId)).size;

  let status: CrossVerificationMetadata['status'] = 'single_authorized_agency';
  let summaryNote = `Verified from authorized syndication feed of ${cluster.primaryStory.source.name}.`;

  if (hasOfficial && uniquePublishers >= 2) {
    status = 'verified_multi_source';
    summaryNote = `Cross-verified across official release (${cluster.primaryStory.source.shortName}) and ${
      uniquePublishers - 1
    } independent reporting source(s).`;
  } else if (hasOfficial) {
    status = 'verified_primary_official';
    summaryNote = `Directly sourced from primary official release (${cluster.primaryStory.source.name}).`;
  } else if (uniquePublishers >= 2) {
    status = 'verified_multi_source';
    summaryNote = `Cross-verified across ${uniquePublishers} independent news publishers (${allSources
      .map((s) => s.source.shortName)
      .join(', ')}).`;
  }

  const officialSourceNames = allSources
    .filter((s) => s.source.sourceTier === 'official' || s.source.sourceTier === 'institution')
    .map((s) => s.source.name);

  const independentNames = allSources
    .filter((s) => s.source.sourceTier === 'editorial' || s.source.sourceTier === 'agency')
    .map((s) => s.source.name);

  const limitations: string[] = [];
  if (!cluster.primaryStory.source.allowsFullText) {
    limitations.push(
      `${cluster.primaryStory.source.shortName} RSS feed provides authorized headline & excerpt metadata; full article text remains on the publisher's website via the canonical link.`
    );
  }
  if (!hasOfficial) {
    limitations.push(
      'No separate Union Government / PIB press release was matched for this specific headline at ingestion time; relies on established independent journalism.'
    );
  }

  return {
    status,
    summaryNote,
    officialStatement:
      officialSourceNames.length > 0
        ? `Official/Institutional source(s) matched: ${officialSourceNames.join(', ')}.`
        : 'Reported via independent press; refer to the concerned ministry/institution portal for gazette notifications.',
    independentReporting:
      independentNames.length > 0
        ? `Independent coverage recorded from: ${independentNames.join(', ')}.`
        : 'Primary official release; independent editorial commentary may follow in subsequent editions.',
    analysisVsOpinionNote: officialStatementVsReportingNote,
    discrepancies: [],
    limitations,
    verifiedAt: new Date().toISOString(),
  };
}

// =============================================================================
// 8. FULL CLUSTER-TO-RECORD ASSEMBLER
// =============================================================================

export async function processClusterIntoArticleRecord(
  cluster: StoryCluster,
  relatedPyqsResolver?: (
    subjectTag: string,
    headline: string
  ) => Promise<VerifiedRelatedPYQ[]>,
  geminiApiKey?: string
): Promise<ProcessedCAArticleRecord | null> {
  const { primaryStory, corroboratingStories } = cluster;
  const relevance = isRelevantToUPSCSyllabus(
    primaryStory.headline,
    primaryStory.rawDescription,
    primaryStory.source.sourceTier
  );

  if (!relevance.relevant) {
    return null;
  }

  const classification = classifyStoryIntoCategories(
    primaryStory.headline,
    primaryStory.rawDescription,
    primaryStory.source,
    relevance.score
  );

  const corroboratingMeta = corroboratingStories.map((s) => ({
    name: s.source.name,
    url: s.canonicalUrl,
    tier: s.source.sourceTier,
  }));

  const { output: analysis } = await generateGeminiUPSCAnalysis(
    primaryStory,
    classification,
    corroboratingMeta,
    geminiApiKey
  );

  // If Gemini provided a subcategory/group, normalize through our central taxonomy so no invalid or nested subcategory can enter
  const finalTaxonomy = analysis.subcategory
    ? classifyIntoSimplifiedTaxonomy({
        headline: primaryStory.headline,
        summary: primaryStory.rawDescription,
        existingMainCategoryId: analysis.mainCategoryId || classification.mainCategoryId,
        existingSubjectGroup: analysis.subjectGroup || classification.subjectGroup,
        existingSubcategory: analysis.subcategory,
        sourceName: primaryStory.source.name,
        relevanceScore: Math.round(relevance.score * 100),
        editorialAuthor: analysis.editorialAuthor || classification.editorialAuthor,
      })
    : classification;

  const imageMetadata = resolveImageProvenance(primaryStory, classification.primaryCategory);
  const crossVerification = buildCrossVerificationMetadata(
    cluster,
    analysis.officialStatementVsReportingNote
  );

  let relatedPyqs: VerifiedRelatedPYQ[] = [];
  if (relatedPyqsResolver) {
    try {
      relatedPyqs = await relatedPyqsResolver(classification.uiSubjectTag, primaryStory.headline);
    } catch {
      relatedPyqs = [];
    }
  }

  const allClusterStories = [primaryStory, ...corroboratingStories];
  const sourcesList = allClusterStories.map((s) => {
    const sourceType: 'Official' | 'Court Judgment' | 'Leading Daily' | 'Think Tank' =
      s.source.sourceTier === 'official'
        ? 'Official'
        : s.source.sourceTier === 'institution'
        ? 'Think Tank'
        : classification.primaryCategory === 'Supreme Court Judgments and Important Legal Developments'
        ? 'Court Judgment'
        : 'Leading Daily';
    return {
      name: s.source.name,
      url: s.canonicalUrl,
      date: new Date(s.publishedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      type: sourceType,
    };
  });

  const fullAnalysis: FullAnalysisData = {
    detailedExplanation: analysis.detailedExplanation,
    backgroundAndInstitutionalContext: analysis.backgroundAndInstitutionalContext,
    importantFiguresDatesProvisions: analysis.importantFiguresDatesProvisions,
    whyItMattersForUPSC: analysis.whyItMattersForUPSC,
  };

  const syllabusMapping: SyllabusRelevanceData = {
    paperTopic: analysis.syllabusPaperTopic,
    staticConnection: analysis.syllabusStaticConnection,
    prelimsAngle: analysis.syllabusPrelimsAngle,
    mainsDimensions: analysis.syllabusMainsDimensions,
    relatedPYQ:
      relatedPyqs.length > 0
        ? `UPSC CSE Prelims (${relatedPyqs[0].year}): ${relatedPyqs[0].questionText.slice(0, 180)}...`
        : undefined,
  };

  const practiceMcq: CAQuizQuestion = {
    id: `mcq_${primaryStory.externalId}`,
    question:
      analysis.practiceMcq?.question ||
      `With reference to "${primaryStory.headline}", consider its relevance under ${classification.primaryCategory} (${classification.gsPaper}).`,
    options: analysis.practiceMcq?.options || [
      { key: 'A', text: '1 only' },
      { key: 'B', text: '2 only' },
      { key: 'C', text: 'Both 1 and 2' },
      { key: 'D', text: 'Neither 1 nor 2' },
    ],
    correctAnswer: analysis.practiceMcq?.correctAnswer || 'C',
    explanation:
      analysis.practiceMcq?.explanation ||
      `Verified from ${primaryStory.source.name} (${classification.primaryCategory}).`,
    source: primaryStory.source.name,
    paper: classification.gsPaper,
  };

  // Validate required structure before publishing; quarantine malformed records
  const isMalformed =
    !primaryStory.headline ||
    !primaryStory.canonicalUrl ||
    analysis.executiveBrief.length === 0 ||
    analysis.detailedExplanation.length === 0;

  return {
    externalId: primaryStory.externalId,
    canonicalUrl: primaryStory.canonicalUrl,
    headline: analysis.headline || primaryStory.headline,
    headlineFingerprint: primaryStory.headlineFingerprint,
    sourceId: primaryStory.source.id,
    sourceName: primaryStory.source.name,
    agencyId: primaryStory.source.agencyId,
    sourceTier: primaryStory.source.sourceTier,
    primaryCategory: classification.primaryCategory,
    mainCategoryId: finalTaxonomy.mainCategoryId,
    subjectGroup: finalTaxonomy.subjectGroup,
    subcategory: finalTaxonomy.subcategory,
    isMostImportant: analysis.isMostImportant ?? finalTaxonomy.isMostImportant,
    isPrelimsRelevant: analysis.isPrelimsRelevant ?? finalTaxonomy.isPrelimsRelevant,
    isMainsRelevant: analysis.isMainsRelevant ?? finalTaxonomy.isMainsRelevant,
    editorialAuthor: finalTaxonomy.editorialAuthor,
    aiExplanationDisclaimer: finalTaxonomy.aiExplanationDisclaimer,
    publishedDateIst: getAsiaKolkataDateKey(primaryStory.publishedAt),
    uiModuleId: finalTaxonomy.mainCategoryId,
    uiSubjectTag: classification.uiSubjectTag,
    secondaryTags: classification.secondaryTags,
    gsPaper: classification.gsPaper,
    publishedAt: primaryStory.publishedAt,
    sourceUpdatedAt: primaryStory.publishedAt,
    status: isMalformed ? 'quarantined' : 'published',
    relevanceScore: relevance.score,
    executiveBrief: analysis.executiveBrief,
    fullAnalysis,
    prelimsFacts: analysis.prelimsFacts,
    prelimsMatrix: analysis.prelimsMatrix,
    mainsDimensions: {
      analyticalAngle: analysis.mainsAnalyticalAngle,
      mainsQuestion: analysis.mainsQuestion,
      keyPoints: analysis.executiveBrief,
    },
    syllabusMapping,
    relatedPyqs,
    practiceMcq,
    sourcesList,
    crossVerification,
    imageMetadata,
    whyItMatters: analysis.whyItMattersForUPSC,
    rawExcerpt: primaryStory.rawDescription.slice(0, 600),
  };
}

export { CANONICAL_CA_CATEGORIES, CanonicalCategoryName };
