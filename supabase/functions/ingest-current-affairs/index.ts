/**
 * Supabase Edge Function: `ingest-current-affairs`
 *
 * Scheduled via `pg_cron` (`30 23 * * *` UTC = 5:00 AM IST daily + incremental runs)
 * or triggered via HTTP POST from GitHub Actions / Admin Operational Console.
 *
 * Keeps all API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) strictly on the server.
 */

// @ts-expect-error Deno Edge Function runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const SOURCES = [
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
    defaultCategory: 'The Daily Brief',
    defaultUiModule: 'daily-news',
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
    defaultUiModule: 'daily-news',
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
    .replace(/\s+/g, ' ')
    .trim();
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
      ai_model_used: geminiKey ? 'gemini-2.5-flash' : 'deterministic-source-verified-v2',
      sources_attempted: SOURCES.length,
    })
    .select('id')
    .single();

  let sourcesSucceeded = 0;
  let sourcesFailed = 0;
  let newStories = 0;

  for (const src of SOURCES) {
    try {
      const resp = await fetch(src.feedUrl, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'UPSCPrep-Edge-Ingestion/2.0',
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

      while ((match = itemRegex.exec(xml)) !== null && count < 4) {
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
            gs_paper: src.defaultPaper,
            status: 'published',
            executive_brief: [title, desc.slice(0, 240)],
            why_it_matters: `Sourced from ${src.name} for UPSC CSE ${src.defaultPaper} (${src.defaultCategory}).`,
            raw_excerpt: desc.slice(0, 500),
          },
          { onConflict: 'canonical_url' }
        );
        if (!error) newStories++;
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
        new_stories: newStories,
      })
      .eq('id', logRow.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sourcesSucceeded,
      sourcesFailed,
      newStories,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

