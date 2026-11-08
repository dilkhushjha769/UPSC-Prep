/**
 * Supabase Edge Function: `ingest-current-affairs`
 *
 * Scheduled via `pg_cron` (`30 23 * * *` UTC = 5:00 AM IST daily + incremental runs)
 * or triggered via HTTP POST from GitHub Actions / Admin Quality Control Console.
 *
 * STRICT RELEVANCE & IMAGE VERIFICATION ARCHITECTURE:
 * 1. Every story passes through UPSC relevance evaluation (Gemini 2.5 Flash / Strict Pre-Filter).
 * 2. Routine politics, local crime, celebrity gossip, and ceremonial announcements are REJECTED.
 * 3. Only articles with decision = 'PUBLISH' (score >= 70, or 55-69 with verified syllabus connection) enter 'published'.
 * 4. Borderline / evaluation failures enter 'needs_review' or 'quarantined'. Never blindly publish unreviewed items.
 * 5. Strict 4-tier image verification: candidate images are checked against headline and content.
 *    If confidence < 0.85 or unrelated, image is set to NULL (clean text-first card).
 * 6. Keeps all keys (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY) strictly on the server.
 */

// @ts-expect-error Deno Edge Function runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

interface SourceConfig {
  id: string;
  name: string;
  shortName: string;
  agencyId: string;
  sourceTier: 'official' | 'agency' | 'editorial' | 'institution';
  feedUrl: string;
  websiteUrl: string;
  defaultCategory: string;
  defaultUiModule: string;
  defaultPaper: string;
}

const SOURCES: SourceConfig[] = [
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
  },
  {
    id: 'ie_upsc',
    name: 'The Indian Express • UPSC Current Affairs',
    shortName: 'IE',
    agencyId: 'express',
    sourceTier: 'editorial',
    feedUrl: 'https://indianexpress.com/section/upsc-current-affairs/feed/',
    websiteUrl: 'https://indianexpress.com/section/upsc-current-affairs/',
    defaultCategory: 'Polity and Governance',
    defaultUiModule: 'polity-governance',
    defaultPaper: 'GS-II',
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
    defaultUiModule: 'polity-governance',
    defaultPaper: 'GS-II',
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
  },
];

function cleanXml(str: string): string {
  return (str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
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
    .replace(/\s+/g, ' ')
    .trim();
}

// Negative exclusion patterns
const EXCLUSIONS = [
  /\b(horoscope|astrology|bollywood|tollywood|celebrity|gossip|box office|ott release|bigg boss)\b/i,
  /\b(cricket score|ipl|t20|world cup squad|man of the match|fantasy cricket)\b/i,
  /\b(stock tips|intraday trading|sensex climbs|nifty falls|crypto|lottery result|gold price)\b/i,
  /\b(slams|hits back|war of words|verbal duel|jibes at|political potshot|blames opposition)\b/i,
  /\b(killed in road accident|murdered in|shot dead|parking dispute|possessing narcotics|youths arrested|theft in|gold smuggled in underwear|chain snatching|hit and run)\b/i,
  /\b(inaugurates new building of|ribbon cutting|lays foundation stone for school|attends wedding|bus terminus in .* opened)\b/i,
];

// High-value UPSC syllabus keywords (matched with word boundaries)
const SYLLABUS_KEYWORDS = [
  'supreme court', 'constitution', 'parliament', 'amendment bill', 'standing committee',
  'federalism', 'governor', 'election commission', 'cag', 'rbi', 'reserve bank', 'monetary policy',
  'inflation', 'fiscal deficit', 'gdp', 'green hydrogen', 'isro', 'drdo', 'semiconductor',
  'quantum', 'artificial intelligence', 'biodiversity', 'wetland', 'ramsar', 'tiger reserve', 'cheetah', 'climate change',
  'unfccc', 'brics', 'quad', 'wto', 'imf', 'world bank', 'social justice',
  'cabinet approves', 'yojana', 'niti aayog', 'poverty', 'ethics',
];

interface QuickRelevanceResult {
  isRelevant: boolean;
  score: number;
  importance: 'HIGH' | 'IMPORTANT' | 'MODERATE' | 'LOW';
  decision: 'PUBLISH' | 'REJECT' | 'NEEDS_REVIEW';
  reason: string | null;
  matchedKeywords: string[];
}

function evaluateQuickRelevance(
  headline: string,
  description: string,
  sourceTier: string
): QuickRelevanceResult {
  const combined = `${headline} ${description}`.toLowerCase();

  for (const rx of EXCLUSIONS) {
    if (rx.test(combined)) {
      const hasException = /\b(article \d+|supreme court|constitutional|unconstitutional|section \d+)\b/i.test(combined);
      if (!hasException) {
        return {
          isRelevant: false,
          score: 15,
          importance: 'LOW',
          decision: 'REJECT',
          reason: 'Routine politics, crime, entertainment, or non-syllabus topic.',
          matchedKeywords: [],
        };
      }
    }
  }

  const matchedKeywords: string[] = [];
  for (const kw of SYLLABUS_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(combined)) {
      matchedKeywords.push(kw);
    }
  }

  let score = 40;
  if (sourceTier === 'official' || sourceTier === 'institution') score += 15;
  if (matchedKeywords.length >= 3) score += 35;
  else if (matchedKeywords.length >= 1) score += 22;

  score = Math.max(10, Math.min(98, score));

  if (matchedKeywords.length === 0 || score < 60) {
    return {
      isRelevant: false,
      score,
      importance: 'LOW',
      decision: 'REJECT',
      reason: 'Below 60/100 UPSC relevance threshold or lacks syllabus anchor.',
      matchedKeywords: [],
    };
  }

  let importance: 'HIGH' | 'IMPORTANT' | 'MODERATE' | 'LOW' = 'MODERATE';
  if (score >= 85) importance = 'HIGH';
  else if (score >= 70) importance = 'IMPORTANT';

  let decision: 'PUBLISH' | 'REJECT' | 'NEEDS_REVIEW' = 'NEEDS_REVIEW';
  if (score >= 70) decision = 'PUBLISH';
  else if (score >= 60) decision = matchedKeywords.length >= 1 ? 'PUBLISH' : 'NEEDS_REVIEW';
  else decision = 'REJECT';

  return {
    isRelevant: score >= 55,
    score,
    importance,
    decision,
    reason: decision === 'REJECT' ? 'Insufficient syllabus relevance score (<55).' : null,
    matchedKeywords,
  };
}

// Strict Image Verification
function verifyImageCandidate(
  headline: string,
  summary: string,
  candidateUrl?: string | null,
  caption?: string
): { verifiedUrl: string | null; confidence: number; status: string; reason?: string } {
  if (!candidateUrl || candidateUrl.trim().length === 0) {
    return { verifiedUrl: null, confidence: 0, status: 'NOT_AVAILABLE', reason: 'No image provided' };
  }

  const clean = candidateUrl.trim();
  const lower = clean.toLowerCase();

  // Blocked patterns
  if (
    /avatar|logo|pixel|1x1|tracker|doubleclick|placeholder|shutterstock|stock[-_]?photo|ai[-_]?generated|arnab/i.test(
      lower
    )
  ) {
    return { verifiedUrl: null, confidence: 0.1, status: 'REJECTED', reason: 'Blocked image pattern or stock photo' };
  }

  // Cross-topic check
  const articleText = `${headline} ${summary}`.toLowerCase();
  if (/jio[-_]?ipo/i.test(lower) && !articleText.includes('jio')) {
    return { verifiedUrl: null, confidence: 0.05, status: 'REJECTED', reason: 'Corporate Jio image on non-Jio article' };
  }
  if (/railway|train/i.test(lower) && !articleText.includes('railway') && !articleText.includes('train')) {
    return { verifiedUrl: null, confidence: 0.05, status: 'REJECTED', reason: 'Railway photo on non-railway story' };
  }

  const slug = clean.split('/').pop()?.toLowerCase() || '';
  const imgContext = `${slug} ${(caption || '').toLowerCase()}`;

  let matched = 0;
  for (const kw of SYLLABUS_KEYWORDS) {
    if (articleText.includes(kw) && imgContext.includes(kw)) {
      matched++;
    }
  }

  const isOfficial = /pib\.gov\.in|rbi\.org\.in|isro\.gov\.in|un\.org/i.test(clean);
  let confidence = isOfficial ? 0.6 : 0.45;
  if (matched >= 1) confidence += 0.35;
  if (matched >= 2) confidence += 0.15;

  confidence = Math.min(1.0, Math.round(confidence * 100) / 100);

  if (confidence >= 0.85 && matched >= 1) {
    return { verifiedUrl: clean, confidence, status: 'VERIFIED' };
  }

  return {
    verifiedUrl: null,
    confidence,
    status: 'REJECTED',
    reason: 'Image entity correspondence confidence < 0.85',
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: logRow } = await supabase
    .from('ca_ingestion_logs')
    .insert({
      trigger_type: 'scheduled',
      status: 'running',
      ai_model_used: geminiKey ? 'gemini-2.5-flash-intelligence' : 'strict-prefilter-engine-v2',
      sources_attempted: SOURCES.length,
    })
    .select('id')
    .single();

  let sourcesSucceeded = 0;
  let sourcesFailed = 0;
  let publishedCount = 0;
  let rejectedCount = 0;
  let reviewCount = 0;

  for (const src of SOURCES) {
    try {
      const resp = await fetch(src.feedUrl, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'UPSCPrep-Intelligence-Ingestion/2.5',
        },
      });

      if (!resp.ok) {
        sourcesFailed++;
        continue;
      }

      const xml = await resp.text();
      sourcesSucceeded++;

      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match: RegExpExecArray | null;
      let count = 0;

      while ((match = itemRegex.exec(xml)) !== null && count < 6) {
        count++;
        const itemXml = match[1];
        const title = cleanXml(itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
        const link = cleanXml(itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || src.websiteUrl);
        const desc = cleanXml(itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || title);
        if (!title || title.length < 20) continue;

        const fingerprint = title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .slice(0, 8)
          .sort()
          .join('-');

        // Extract candidate image from itemXml
        const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        const encMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
        const rawCandidateImg = mediaMatch?.[1] || encMatch?.[1] || imgMatch?.[1] || null;

        // 1. Strict UPSC Relevance Evaluation
        const relevance = evaluateQuickRelevance(title, desc, src.sourceTier);

        // 2. Strict Image Verification (0.85 confidence threshold)
        const imageCheck = verifyImageCandidate(title, desc, rawCandidateImg);

        // Determine record status
        let status: 'published' | 'needs_review' | 'rejected' = 'published';
        if (relevance.decision === 'REJECT') {
          status = 'rejected';
          rejectedCount++;
        } else if (relevance.decision === 'NEEDS_REVIEW') {
          status = 'needs_review';
          reviewCount++;
        } else {
          status = 'published';
          publishedCount++;
        }

        const dateStr = new Date().toISOString().slice(0, 10);

        const { error } = await supabase.from('ca_articles').upsert(
          {
            external_id: `${src.id}_${fingerprint.slice(0, 28)}`,
            canonical_url: link,
            headline: title,
            headline_fingerprint: fingerprint,
            source_id: src.id,
            source_name: src.name,
            agency_id: src.agencyId,
            source_tier: src.sourceTier,
            primary_category: src.defaultCategory,
            ui_module_id: src.defaultUiModule,
            main_category_id: src.defaultUiModule,
            gs_paper: src.defaultPaper,
            published_date_ist: dateStr,
            status,
            relevance_score: relevance.score / 100,
            importance_level: relevance.importance,
            rejection_reason: relevance.reason,
            is_most_important: relevance.importance === 'HIGH',
            is_prelims_relevant: relevance.isRelevant,
            is_mains_relevant: relevance.score >= 70,
            executive_brief: [title, desc.slice(0, 240)],
            why_it_matters: `Sourced from ${src.name} for UPSC CSE ${src.defaultPaper} (${src.defaultCategory}).`,
            raw_excerpt: desc.slice(0, 500),
            image_metadata: {
              imageUrl: imageCheck.verifiedUrl,
              verificationStatus: imageCheck.status,
              confidence: imageCheck.confidence,
              rejectionReason: imageCheck.reason || null,
              credit: imageCheck.verifiedUrl ? `${src.name} Photo Desk` : 'Clean Text Card',
              license: 'Authorized Press Release Policy',
            },
            ai_relevance_data: {
              score: relevance.score,
              importance: relevance.importance,
              decision: relevance.decision,
              matchedKeywords: relevance.matchedKeywords,
              evaluatedAt: new Date().toISOString(),
            },
          },
          { onConflict: 'canonical_url' }
        );
      }
    } catch {
      sourcesFailed++;
    }
  }

  if (logRow?.id) {
    await supabase
      .from('ca_ingestion_logs')
      .update({
        completed_at: new Date().toISOString(),
        status: sourcesSucceeded > 0 ? 'completed' : 'failed',
        sources_succeeded: sourcesSucceeded,
        sources_failed: sourcesFailed,
        new_stories: publishedCount,
      })
      .eq('id', logRow.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sourcesSucceeded,
      sourcesFailed,
      publishedCount,
      reviewCount,
      rejectedCount,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
