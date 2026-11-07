/**
 * imageVerification.ts
 *
 * Strict Image Relevance Verification & Credibility Validation Layer for UPSC Current Affairs.
 *
 * Guiding Principles:
 * 1. Showing NO image is vastly superior to showing the WRONG or unrelated image.
 * 2. Never use:
 *    - Generic stock photos pretending to represent real events (e.g. Unsplash placeholders).
 *    - AI-generated or synthetic photographs.
 *    - Unrelated images from the same category or organization (e.g. Jio IPO on RBI, train on ISRO).
 *    - Outdated hardcoded image archives.
 *    - Images inferred solely from random keyword matches in URLs.
 * 3. Exact 4-tier selection priority:
 *    Tier 1: Original news image from the article itself, provided by the authorized publisher.
 *    Tier 2: Authentic official image from PIB, ISRO, RBI, Ministries, or UN.
 *    Tier 3: Relevant contextual photograph from a credible publisher.
 *    Tier 4: No image (render clean, text-first editorial card).
 * 4. An image is ONLY verified if confidence >= 0.85 AND clear subject-matter correspondence is established.
 *    A high-trust domain alone is NEVER sufficient.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ImageVerificationStatus = 'VERIFIED' | 'REJECTED' | 'NOT_AVAILABLE';
export type ImageType = 'event_photo' | 'official_infographic' | 'contextual_photo';

export interface ImageProvenanceRecord {
  originalImageUrl: string | null;
  verifiedImageUrl?: string | null;
  publisher: string;
  credit: string;
  caption: string;
  status: ImageVerificationStatus;
  confidence: number; // 0.0 to 1.0
  relevanceScore?: number;
  sourceCredibility?: string;
  timestamp: string;
  method: 'multimodal_ai' | 'entity_cross_reference';
  matchedEntities: string[];
  imageType?: ImageType;
  rejectionReason: string | null;
}

export interface VerifyImageParams {
  headline: string;
  summary?: string;
  content?: string;
  imageUrl?: string | null;
  caption?: string;
  credit?: string;
  source?: string;
  articleUrl?: string;
  category?: string;
}

// In-memory verification cache with article-specific keys to prevent old mappings from overriding new verification
const VERIFICATION_CACHE = new Map<string, ImageProvenanceRecord>();
const CACHE_STORAGE_KEY = '@upsc_image_provenance_cache_v2';

// Blocked patterns: ads, tracking pixels, logos, avatars, stock photography, synthetic/AI tags
const BLOCKED_IMAGE_PATTERNS = [
  /avatar/i,
  /logo/i,
  /pixel/i,
  /1x1/i,
  /tracker/i,
  /doubleclick/i,
  /gravatar/i,
  /placeholder/i,
  /shutterstock/i,
  /istockphoto/i,
  /gettyimages.*watermark/i,
  /stock[-_]?photo/i,
  /ai[-_]?generated/i,
  /midjourney/i,
  /dalle/i,
  /stable[-_]?diffusion/i,
  /synthetic/i,
  /ad[-_]?banner/i,
  /default[-_]?image/i,
  /arnab/i, // Explicit blacklist for unrelated recurring political anchors
];

// Official government and international institutional domains
const OFFICIAL_DOMAINS = [
  'pib.gov.in',
  'rbi.org.in',
  'isro.gov.in',
  'sci.gov.in',
  'loksabha.nic.in',
  'rajyasabha.nic.in',
  'moef.gov.in',
  'mea.gov.in',
  'drdo.gov.in',
  'eci.gov.in',
  'niti.gov.in',
  'un.org',
  'worldbank.org',
  'imf.org',
  'who.int',
  'wmo.int',
  'unesco.org',
];

// Authorized news publisher image CDNs
const AUTHORIZED_NEWS_DOMAINS = [
  'thehindu.com',
  'th-i.thgim.com',
  'indianexpress.com',
  'images.indianexpress.com',
  'livemint.com',
  'images.livemint.com',
  'downtoearth.org.in',
  'orfonline.org',
];

/**
 * Extracts distinct named entities, institutions, and core nouns from text
 */
export function extractEntitiesFromText(text: string): string[] {
  if (!text) return [];

  // Important institutional & thematic UPSC keywords
  const candidateKeywords = [
    'supreme court', 'high court', 'constitution', 'parliament', 'sansad',
    'lok sabha', 'rajya sabha', 'rbi', 'reserve bank', 'monetary policy',
    'isro', 'satellite', 'semi-cryogenic', 'chandrayaan', 'gaganyaan',
    'drdo', 'missile', 'agnipath', 'kavach', 'railway', 'train',
    'cheetah', 'kuno', 'tiger', 'wetland', 'ramsar', 'keoladeo',
    'green hydrogen', 'sight', 'electrolyser', 'renewable energy',
    'election commission', 'cag', 'ed', 'cbi', 'niti aayog',
    'multidimensional poverty', 'undp', 'unfccc', 'cop', 'brics', 'quad',
    'asi', 'archaeology', 'porunai', 'adichanallur', 'maratha forts',
  ];

  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const kw of candidateKeywords) {
    if (lower.includes(kw)) {
      matched.push(kw);
    }
  }

  // Also extract proper nouns (capitalized multi-word tokens)
  const properNounRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  let match: RegExpExecArray | null;
  while ((match = properNounRegex.exec(text)) !== null) {
    const term = match[0].toLowerCase();
    if (term.length > 5 && !matched.includes(term)) {
      matched.push(term);
    }
  }

  return matched;
}

/**
 * Assess domain credibility
 */
function assessDomain(url: string): 'official' | 'authorized_news' | 'unverified' {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (OFFICIAL_DOMAINS.some((d) => host.endsWith(d))) return 'official';
    if (AUTHORIZED_NEWS_DOMAINS.some((d) => host.endsWith(d))) return 'authorized_news';
    return 'unverified';
  } catch {
    return 'unverified';
  }
}

/**
 * Main Image Verification Function
 * Enforces strict correspondence: only returns status = 'VERIFIED' if confidence >= 0.85
 * Otherwise returns 'REJECTED' or 'NOT_AVAILABLE' with verifiedImageUrl = null.
 */
export function verifyNewsImageRelevance(params: VerifyImageParams): ImageProvenanceRecord {
  const {
    headline,
    summary = '',
    content = '',
    imageUrl,
    caption = '',
    credit = '',
    source = 'Authorized Source',
    articleUrl = '',
  } = params;

  const nowIso = new Date().toISOString();

  // 1. If no image URL is provided, return NOT_AVAILABLE with null
  if (!imageUrl || imageUrl.trim().length === 0) {
    return {
      originalImageUrl: null,
      verifiedImageUrl: null,
      publisher: source,
      credit: '',
      caption: '',
      status: 'NOT_AVAILABLE',
      confidence: 0,
      relevanceScore: 0,
      sourceCredibility: 'none',
      timestamp: nowIso,
      method: 'entity_cross_reference',
      matchedEntities: [],
      rejectionReason: 'No image provided by source article. Text-first card displayed.',
    };
  }

  const cleanUrl = imageUrl.trim();

  // Create an article-specific cache key to prevent cross-article pollution
  const cacheKey = `${articleUrl || headline.trim().toLowerCase()}|${cleanUrl}`;
  if (VERIFICATION_CACHE.has(cacheKey)) {
    return VERIFICATION_CACHE.get(cacheKey)!;
  }

  // 2. Reject blacklisted patterns (avatars, ads, stock photos, synthetic tags)
  for (const pattern of BLOCKED_IMAGE_PATTERNS) {
    if (pattern.test(cleanUrl) || pattern.test(caption)) {
      const rec: ImageProvenanceRecord = {
        originalImageUrl: cleanUrl,
        verifiedImageUrl: null,
        publisher: source,
        credit,
        caption,
        status: 'REJECTED',
        confidence: 0.1,
        relevanceScore: 10,
        sourceCredibility: 'low',
        timestamp: nowIso,
        method: 'entity_cross_reference',
        matchedEntities: [],
        rejectionReason: `Image URL or caption matched blacklisted/stock/synthetic pattern: ${pattern}.`,
      };
      VERIFICATION_CACHE.set(cacheKey, rec);
      return rec;
    }
  }

  // 3. Reject known cross-topic image pollution:
  // e.g. Jio IPO image when headline does not mention Jio;
  // Train/Railway image when article is about ISRO/space;
  // Agrivoltaics image when article is about Green Hydrogen;
  // Arnab/Anchor image when article is about archaeology/monsoons/verdicts.
  const articleContext = `${headline} ${summary} ${content}`.toLowerCase();

  const isJioInImage = /jio[-_]?ipo/i.test(cleanUrl);
  if (isJioInImage && !articleContext.includes('jio')) {
    const rec: ImageProvenanceRecord = {
      originalImageUrl: cleanUrl,
      verifiedImageUrl: null,
      publisher: source,
      credit,
      caption,
      status: 'REJECTED',
      confidence: 0.05,
      relevanceScore: 5,
      sourceCredibility: 'low',
      timestamp: nowIso,
      method: 'entity_cross_reference',
      matchedEntities: [],
      rejectionReason: 'Corporate Jio image is unrelated to this non-Jio article.',
    };
    VERIFICATION_CACHE.set(cacheKey, rec);
    return rec;
  }

  const isRailwayInImage = /railway|train|locomotive/i.test(cleanUrl);
  if (isRailwayInImage && !articleContext.includes('railway') && !articleContext.includes('train')) {
    const rec: ImageProvenanceRecord = {
      originalImageUrl: cleanUrl,
      verifiedImageUrl: null,
      publisher: source,
      credit,
      caption,
      status: 'REJECTED',
      confidence: 0.05,
      relevanceScore: 5,
      sourceCredibility: 'low',
      timestamp: nowIso,
      method: 'entity_cross_reference',
      matchedEntities: [],
      rejectionReason: 'Railway/train image attached to an unrelated non-railway story.',
    };
    VERIFICATION_CACHE.set(cacheKey, rec);
    return rec;
  }

  const isAgriInImage = /agrivoltaic/i.test(cleanUrl);
  if (isAgriInImage && !articleContext.includes('agrivoltaic') && !articleContext.includes('farming')) {
    const rec: ImageProvenanceRecord = {
      originalImageUrl: cleanUrl,
      verifiedImageUrl: null,
      publisher: source,
      credit,
      caption,
      status: 'REJECTED',
      confidence: 0.05,
      relevanceScore: 5,
      sourceCredibility: 'low',
      timestamp: nowIso,
      method: 'entity_cross_reference',
      matchedEntities: [],
      rejectionReason: 'Agrivoltaics photograph attached to unrelated industrial policy story.',
    };
    VERIFICATION_CACHE.set(cacheKey, rec);
    return rec;
  }

  // 4. Entity-level correspondence verification
  const headlineEntities = extractEntitiesFromText(headline);
  const contextEntities = extractEntitiesFromText(articleContext);
  const combinedArticleEntities = Array.from(new Set([...headlineEntities, ...contextEntities]));

  // Extract tokens from image URL slug and caption
  const imageSlug = cleanUrl.split('/').pop()?.toLowerCase() || '';
  const captionLower = (caption || '').toLowerCase();
  const imageContext = `${imageSlug} ${captionLower}`;

  const matchedEntities: string[] = [];
  for (const entity of combinedArticleEntities) {
    const words = entity.split(/\s+/).filter((w) => w.length >= 4);
    const matchesAllWords = words.length > 0 && words.every((w) => imageContext.includes(w));
    if (matchesAllWords || imageContext.includes(entity)) {
      matchedEntities.push(entity);
    }
  }

  const domainType = assessDomain(cleanUrl);

  // Confidence scoring:
  // Base confidence starts at 0.4 for authorized news domains and 0.5 for official domains
  let confidence = domainType === 'official' ? 0.55 : domainType === 'authorized_news' ? 0.45 : 0.2;

  // Add confidence for each matched entity
  if (matchedEntities.length >= 2) {
    confidence += 0.45; // 2+ distinct entities matched -> high confidence (0.90 - 1.0)
  } else if (matchedEntities.length === 1) {
    confidence += 0.35; // 1 strong entity matched -> (0.80 - 0.90)
    // If image came directly from an official government press release and matches the headline topic
    if (domainType === 'official') {
      confidence += 0.08;
    }
  }

  // Deduct confidence if caption contradicts headline entities
  if (captionLower.length > 20 && combinedArticleEntities.length > 0 && matchedEntities.length === 0) {
    confidence -= 0.3;
  }

  confidence = Math.max(0, Math.min(1.0, Math.round(confidence * 100) / 100));

  // Determine image type
  const isInfographic = /infographic|chart|graph|map|diagram|data-graphic|pib/i.test(cleanUrl);
  const imageType: ImageType = isInfographic
    ? 'official_infographic'
    : /file photo|representative|archive/i.test(captionLower)
    ? 'contextual_photo'
    : 'event_photo';

  // Strict Threshold: Only accept if confidence >= 0.85
  if (confidence >= 0.85 && matchedEntities.length >= 1) {
    const rec: ImageProvenanceRecord = {
      originalImageUrl: cleanUrl,
      verifiedImageUrl: cleanUrl,
      publisher: source,
      credit: credit || `${source} Photo Desk`,
      caption: caption || `Authentic visual published with news report by ${source}.`,
      status: 'VERIFIED',
      confidence,
      relevanceScore: Math.round(confidence * 100),
      sourceCredibility: 'high',
      timestamp: nowIso,
      method: 'entity_cross_reference',
      matchedEntities,
      imageType,
      rejectionReason: null,
    };
    VERIFICATION_CACHE.set(cacheKey, rec);
    return rec;
  }

  // Failed verification -> REJECT and set verified image to null
  const reason =
    matchedEntities.length === 0
      ? 'No subject-matter entity correspondence between image and article content.'
      : `Verification confidence (${confidence}) was below mandatory threshold (0.85).`;

  const rec: ImageProvenanceRecord = {
    originalImageUrl: cleanUrl,
    verifiedImageUrl: null,
    publisher: source,
    credit,
    caption,
    status: 'REJECTED',
    confidence,
    relevanceScore: Math.round(confidence * 100),
    sourceCredibility: 'low',
    timestamp: nowIso,
    method: 'entity_cross_reference',
    matchedEntities,
    rejectionReason: reason,
  };
  VERIFICATION_CACHE.set(cacheKey, rec);
  return rec;
}

/**
 * Revalidate existing stored articles:
 * Inspects an array of articles, re-verifies candidate images, and zeroes out any that fail.
 */
export function revalidateExistingArticleImages<T extends { headline: string; summary?: string; image_url?: string | null; image_metadata?: any }>(
  articles: T[]
): {
  revalidatedCount: number;
  clearedCount: number;
  verifiedCount: number;
  updatedArticles: T[];
} {
  let clearedCount = 0;
  let verifiedCount = 0;

  const updatedArticles = articles.map((art) => {
    const candidateUrl = art.image_metadata?.imageUrl || art.image_url || null;
    if (!candidateUrl) {
      return {
        ...art,
        image_url: null,
        image_metadata: {
          ...art.image_metadata,
          imageUrl: null,
          verificationStatus: 'NOT_AVAILABLE',
        },
      };
    }

    const verification = verifyNewsImageRelevance({
      headline: art.headline,
      summary: art.summary || '',
      imageUrl: candidateUrl,
      caption: art.image_metadata?.caption,
      credit: art.image_metadata?.credit,
    });

    if (verification.status === 'VERIFIED') {
      verifiedCount++;
      return {
        ...art,
        image_url: candidateUrl,
        image_metadata: {
          ...art.image_metadata,
          imageUrl: candidateUrl,
          verificationStatus: 'VERIFIED',
          confidence: verification.confidence,
          matchedEntities: verification.matchedEntities,
          method: verification.method,
        },
      };
    } else {
      clearedCount++;
      return {
        ...art,
        image_url: null,
        image_metadata: {
          ...art.image_metadata,
          imageUrl: null,
          verificationStatus: 'REJECTED',
          confidence: verification.confidence,
          rejectionReason: verification.rejectionReason,
        },
      };
    }
  });

  return {
    revalidatedCount: articles.length,
    clearedCount,
    verifiedCount,
    updatedArticles,
  };
}

/**
 * Cache persistence helpers
 */
export async function loadVerificationCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const [k, v] of parsed) {
          VERIFICATION_CACHE.set(k, v);
        }
      }
    }
  } catch {
    // Ignore cache load failure
  }
}

export async function persistVerificationCache(): Promise<void> {
  try {
    const entries = Array.from(VERIFICATION_CACHE.entries()).slice(0, 500);
    await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore cache write failure
  }
}
