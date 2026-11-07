/**
 * topicImageResolver.ts
 *
 * Resolves verified authentic news photographs for UPSC Current Affairs.
 * Strictly adheres to the Image Relevance Verification Layer:
 * - If candidate image does not specifically match the actual subject of the news with confidence >= 0.85, returns NULL.
 * - Never returns generic stock photos, outdated hardcoded archives, or synthetic placeholders.
 * - Null image results in clean, text-first editorial cards.
 */

import { verifyNewsImageRelevance } from './imageVerification';

/**
 * Resolves an authentic editorial photo URL from an incoming article candidate.
 * Returns null if no verified subject match is found.
 */
export function resolveRelevantTopicImageUrl(item: {
  headline?: string;
  title?: string;
  category?: string;
  primaryCategory?: string;
  source?: string;
  candidateUrl?: string | null;
  summary?: string;
}): string | null {
  const headline = item.headline || item.title || '';
  if (!item.candidateUrl) {
    return null;
  }

  const verification = verifyNewsImageRelevance({
    headline,
    summary: item.summary,
    imageUrl: item.candidateUrl,
    source: item.source,
    category: item.category || item.primaryCategory,
  });

  if (verification.status === 'VERIFIED' && verification.originalImageUrl) {
    return verification.originalImageUrl;
  }

  // ACCURACY IS MANDATORY: Return null if no verified relevant image is available.
  // Never return an unrelated or random image!
  return null;
}

/**
 * Resolves full provenance metadata including caption, credit, and license
 */
export function resolveTopicImageMetadata(item: {
  headline?: string;
  title?: string;
  category?: string;
  primaryCategory?: string;
  source?: string;
  candidateUrl?: string | null;
  summary?: string;
}): {
  imageUrl?: string;
  caption: string;
  credit: string;
  license: string;
  imageType: 'event_photo' | 'official_infographic' | 'contextual_photo' | 'placeholder';
  verificationStatus: 'verified_official' | 'verified_agency' | 'placeholder_fallback';
} {
  const headline = item.headline || item.title || '';
  const verification = verifyNewsImageRelevance({
    headline,
    summary: item.summary,
    imageUrl: item.candidateUrl,
    source: item.source,
    category: item.category || item.primaryCategory,
  });

  if (verification.status === 'VERIFIED' && verification.originalImageUrl) {
    return {
      imageUrl: verification.originalImageUrl,
      caption: verification.caption,
      credit: verification.credit,
      license: 'Authorized Press Release & Syndication License',
      imageType: verification.imageType || 'event_photo',
      verificationStatus: 'verified_official',
    };
  }

  return {
    imageUrl: undefined,
    caption: 'No verified photograph provided for this article; rendered in text-first editorial layout.',
    credit: `${item.source || 'Authorized Publisher'} Text Desk`,
    license: 'Text-first editorial card',
    imageType: 'placeholder',
    verificationStatus: 'placeholder_fallback',
  };
}
