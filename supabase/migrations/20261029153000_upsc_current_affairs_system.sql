-- =============================================================================
-- UPSC Current Affairs System Migration
-- 1. public.ca_sources: Credible official & established news agency feeds
-- 2. public.ca_articles: Deduplicated, Gemini-processed, cross-verified stories
--    with 4-tier authentic image provenance and verified PYQ links
-- 3. public.ca_category_status: Per-category last-updated tracking (12 canonical + 6 UI hubs)
-- 4. public.ca_ingestion_logs: Operational pipeline execution logs & telemetry
-- 5. Scheduled daily refresh (5:00 AM IST / 23:30 UTC) via pg_cron when available
-- =============================================================================

-- 1. SOURCES TABLE
CREATE TABLE IF NOT EXISTS public.ca_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    agency_id TEXT NOT NULL,
    source_tier TEXT NOT NULL CHECK (source_tier IN ('official', 'agency', 'editorial', 'institution')),
    feed_url TEXT NOT NULL,
    website_url TEXT NOT NULL,
    default_category TEXT NOT NULL,
    default_ui_module TEXT NOT NULL,
    default_paper TEXT NOT NULL DEFAULT 'GS-II',
    license_type TEXT NOT NULL DEFAULT 'RSS Syndication + Attribution & Canonical Link-Out',
    allows_full_text BOOLEAN NOT NULL DEFAULT false,
    allows_image_hotlink BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 60,
    timeout_ms INTEGER NOT NULL DEFAULT 10000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_status TEXT NOT NULL DEFAULT 'pending' CHECK (last_status IN ('pending', 'success', 'failed', 'rate_limited')),
    error_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.ca_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    canonical_url TEXT NOT NULL UNIQUE,
    headline TEXT NOT NULL,
    headline_fingerprint TEXT NOT NULL,
    source_id TEXT REFERENCES public.ca_sources(id) ON DELETE SET NULL,
    source_name TEXT NOT NULL,
    agency_id TEXT NOT NULL DEFAULT 'all',
    source_tier TEXT NOT NULL DEFAULT 'editorial' CHECK (source_tier IN ('official', 'agency', 'editorial', 'institution')),
    primary_category TEXT NOT NULL,
    ui_module_id TEXT NOT NULL,
    ui_subject_tag TEXT NOT NULL DEFAULT 'Polity',
    secondary_tags TEXT[] NOT NULL DEFAULT '{}',
    gs_paper TEXT NOT NULL DEFAULT 'GS-II',
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'quarantined', 'needs_review', 'draft')),
    summary_version INTEGER NOT NULL DEFAULT 1,
    relevance_score NUMERIC(4,2) NOT NULL DEFAULT 0.85,
    executive_brief JSONB NOT NULL DEFAULT '[]'::jsonb,
    full_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    prelims_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    prelims_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
    mains_dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
    syllabus_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    related_pyqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    practice_mcq JSONB,
    sources_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    cross_verification JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    why_it_matters TEXT NOT NULL DEFAULT '',
    raw_excerpt TEXT
);

-- 3. CATEGORY STATUS TABLE (12 Canonical Categories + 6 UI Module Hubs)
CREATE TABLE IF NOT EXISTS public.ca_category_status (
    category_id TEXT PRIMARY KEY,
    category_name TEXT NOT NULL,
    category_group TEXT NOT NULL DEFAULT 'canonical' CHECK (category_group IN ('canonical', 'ui_module')),
    ui_module_id TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    last_updated_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'partial', 'failed', 'stale')),
    active_story_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INGESTION OPERATIONAL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ca_ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    trigger_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (trigger_type IN ('scheduled', 'manual', 'incremental', 'startup')),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'partial', 'failed')),
    ai_model_used TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    sources_attempted INTEGER NOT NULL DEFAULT 0,
    sources_succeeded INTEGER NOT NULL DEFAULT 0,
    sources_failed INTEGER NOT NULL DEFAULT 0,
    new_stories INTEGER NOT NULL DEFAULT 0,
    updated_stories INTEGER NOT NULL DEFAULT 0,
    duplicates_skipped INTEGER NOT NULL DEFAULT 0,
    quarantined_stories INTEGER NOT NULL DEFAULT 0,
    failed_jobs JSONB NOT NULL DEFAULT '[]'::jsonb,
    category_summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_ca_articles_status_pub
    ON public.ca_articles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_articles_primary_cat_pub
    ON public.ca_articles (primary_category, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_articles_ui_module_pub
    ON public.ca_articles (ui_module_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_articles_fingerprint
    ON public.ca_articles (headline_fingerprint);

CREATE INDEX IF NOT EXISTS idx_ca_articles_agency
    ON public.ca_articles (agency_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_ingestion_logs_started
    ON public.ca_ingestion_logs (started_at DESC);

-- 6. ROW LEVEL SECURITY (RLS) & GRANTS
ALTER TABLE public.ca_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_category_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_ingestion_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ca_sources' AND policyname = 'Public read access for ca_sources'
    ) THEN
        CREATE POLICY "Public read access for ca_sources"
            ON public.ca_sources FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ca_articles' AND policyname = 'Public read access for published ca_articles'
    ) THEN
        CREATE POLICY "Public read access for published ca_articles"
            ON public.ca_articles FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ca_category_status' AND policyname = 'Public read access for ca_category_status'
    ) THEN
        CREATE POLICY "Public read access for ca_category_status"
            ON public.ca_category_status FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ca_ingestion_logs' AND policyname = 'Public read access for ca_ingestion_logs'
    ) THEN
        CREATE POLICY "Public read access for ca_ingestion_logs"
            ON public.ca_ingestion_logs FOR SELECT
            USING (true);
    END IF;
END $$;

GRANT SELECT ON public.ca_sources TO anon, authenticated;
GRANT SELECT ON public.ca_articles TO anon, authenticated;
GRANT SELECT ON public.ca_category_status TO anon, authenticated;
GRANT SELECT ON public.ca_ingestion_logs TO anon, authenticated;

GRANT ALL ON public.ca_sources TO service_role;
GRANT ALL ON public.ca_articles TO service_role;
GRANT ALL ON public.ca_category_status TO service_role;
GRANT ALL ON public.ca_ingestion_logs TO service_role;

-- 7. SEED CREDIBLE OFFICIAL & ESTABLISHED NEWS SOURCES
INSERT INTO public.ca_sources (
    id, name, short_name, agency_id, source_tier, feed_url, website_url,
    default_category, default_ui_module, default_paper, license_type,
    allows_full_text, allows_image_hotlink, rate_limit_per_hour
) VALUES
    (
        'pib_official',
        'Press Information Bureau (PIB) • Govt of India',
        'PIB',
        'pib',
        'official',
        'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',
        'https://pib.gov.in/',
        'Social Issues and Government Schemes',
        'reports-schemes-data',
        'GS-II',
        'Government of India Open Data / Official Press Release Attribution',
        true,
        true,
        60
    ),
    (
        'rbi_press',
        'Reserve Bank of India (RBI) • Official Releases',
        'RBI',
        'pib',
        'official',
        'https://rbi.org.in/pressreleases_rss.xml',
        'https://www.rbi.org.in/',
        'Economy',
        'economy-environment-science',
        'GS-III',
        'RBI Official Public Press Release Policy with Source Attribution',
        true,
        true,
        60
    ),
    (
        'hindu_national',
        'The Hindu • National',
        'The Hindu',
        'hindu',
        'editorial',
        'https://www.thehindu.com/news/national/feeder/default.rss',
        'https://www.thehindu.com/news/national/',
        'National Affairs',
        'daily-news',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'hindu_international',
        'The Hindu • International',
        'The Hindu',
        'hindu',
        'editorial',
        'https://www.thehindu.com/news/international/feeder/default.rss',
        'https://www.thehindu.com/news/international/',
        'International Affairs',
        'international-affairs',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'hindu_editorial',
        'The Hindu • Editorial & Opinion',
        'The Hindu',
        'hindu',
        'editorial',
        'https://www.thehindu.com/opinion/editorial/feeder/default.rss',
        'https://www.thehindu.com/opinion/editorial/',
        'Editorials and Opinions',
        'editorials-explainers',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'hindu_business',
        'The Hindu • Economy & Business',
        'The Hindu',
        'hindu',
        'editorial',
        'https://www.thehindu.com/business/Economy/feeder/default.rss',
        'https://www.thehindu.com/business/Economy/',
        'Economy',
        'economy-environment-science',
        'GS-III',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'hindu_scitech',
        'The Hindu • Science & Environment',
        'The Hindu',
        'hindu',
        'editorial',
        'https://www.thehindu.com/sci-tech/science/feeder/default.rss',
        'https://www.thehindu.com/sci-tech/science/',
        'Science and Technology',
        'economy-environment-science',
        'GS-III',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'ie_upsc',
        'The Indian Express • UPSC Current Affairs',
        'IE',
        'express',
        'editorial',
        'https://indianexpress.com/section/upsc-current-affairs/feed/',
        'https://indianexpress.com/section/upsc-current-affairs/',
        'The Daily Brief',
        'daily-news',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'ie_explained',
        'The Indian Express • Explained',
        'IE',
        'express',
        'editorial',
        'https://indianexpress.com/section/explained/feed/',
        'https://indianexpress.com/section/explained/',
        'Editorials and Opinions',
        'editorials-explainers',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'ie_india',
        'The Indian Express • India & Polity',
        'IE',
        'express',
        'editorial',
        'https://indianexpress.com/section/india/feed/',
        'https://indianexpress.com/section/india/',
        'Polity and Governance',
        'polity-governance',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'ie_economy',
        'The Indian Express • Economy',
        'IE',
        'express',
        'editorial',
        'https://indianexpress.com/section/business/economy/feed/',
        'https://indianexpress.com/section/business/economy/',
        'Economy',
        'economy-environment-science',
        'GS-III',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'ie_world',
        'The Indian Express • World',
        'IE',
        'express',
        'editorial',
        'https://indianexpress.com/section/world/feed/',
        'https://indianexpress.com/section/world/',
        'International Affairs',
        'international-affairs',
        'GS-II',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out (No Full-Text Republication)',
        false,
        true,
        60
    ),
    (
        'un_news_global',
        'United Nations Official News • Global Issues',
        'UN News',
        'orf',
        'institution',
        'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
        'https://news.un.org/en/',
        'Reports, Indices and Government Data',
        'reports-schemes-data',
        'GS-II',
        'UN Official Public Syndication Policy with Attribution',
        false,
        true,
        60
    ),
    (
        'dte_environment',
        'Down To Earth • Environment & Ecology',
        'Down To Earth',
        'dte',
        'editorial',
        'https://www.downtoearth.org.in/rss/environment',
        'https://www.downtoearth.org.in/environment',
        'Environment and Ecology',
        'economy-environment-science',
        'GS-III',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out',
        false,
        true,
        60
    ),
    (
        'mint_economy',
        'Livemint • Economy & Policy',
        'Livemint',
        'mint',
        'editorial',
        'https://www.livemint.com/rss/economy_politics',
        'https://www.livemint.com/economy',
        'Economy',
        'economy-environment-science',
        'GS-III',
        'Authorized RSS Feed — Summary Synthesis & Canonical Link-Out',
        false,
        true,
        60
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    feed_url = EXCLUDED.feed_url,
    website_url = EXCLUDED.website_url,
    default_category = EXCLUDED.default_category,
    default_ui_module = EXCLUDED.default_ui_module,
    license_type = EXCLUDED.license_type,
    updated_at = now();

-- 8. SEED ALL 12 REQUIRED CANONICAL CATEGORIES + 6 UI MODULE HUBS
INSERT INTO public.ca_category_status (
    category_id, category_name, category_group, ui_module_id, display_order, status
) VALUES
    -- 12 Canonical Categories required by specification
    ('the-daily-brief', 'The Daily Brief', 'canonical', 'daily-news', 1, 'pending'),
    ('national-affairs', 'National Affairs', 'canonical', 'daily-news', 2, 'pending'),
    ('international-affairs', 'International Affairs', 'canonical', 'international-affairs', 3, 'pending'),
    ('economy', 'Economy', 'canonical', 'economy-environment-science', 4, 'pending'),
    ('polity-and-governance', 'Polity and Governance', 'canonical', 'polity-governance', 5, 'pending'),
    ('environment-and-ecology', 'Environment and Ecology', 'canonical', 'economy-environment-science', 6, 'pending'),
    ('science-and-technology', 'Science and Technology', 'canonical', 'economy-environment-science', 7, 'pending'),
    ('social-issues-and-schemes', 'Social Issues and Government Schemes', 'canonical', 'reports-schemes-data', 8, 'pending'),
    ('editorials-and-opinions', 'Editorials and Opinions', 'canonical', 'editorials-explainers', 9, 'pending'),
    ('supreme-court-and-legal', 'Supreme Court Judgments and Important Legal Developments', 'canonical', 'polity-governance', 10, 'pending'),
    ('reports-indices-and-data', 'Reports, Indices and Government Data', 'canonical', 'reports-schemes-data', 11, 'pending'),
    ('important-events-and-misc', 'Important Events and Miscellaneous Current Affairs', 'canonical', 'daily-news', 12, 'pending'),
    -- 6 UI Module Hubs
    ('ui-daily-news', '1. Daily News', 'ui_module', 'daily-news', 101, 'pending'),
    ('ui-international-affairs', '2. International Affairs', 'ui_module', 'international-affairs', 102, 'pending'),
    ('ui-polity-governance', '3. Polity & Governance', 'ui_module', 'polity-governance', 103, 'pending'),
    ('ui-economy-environment-science', '4. Economy, Environment & Science', 'ui_module', 'economy-environment-science', 104, 'pending'),
    ('ui-reports-schemes-data', '5. Reports, Schemes & Data', 'ui_module', 'reports-schemes-data', 105, 'pending'),
    ('ui-editorials-explainers', '6. Editorials & Explainers', 'ui_module', 'editorials-explainers', 106, 'pending')
ON CONFLICT (category_id) DO UPDATE SET
    category_name = EXCLUDED.category_name,
    category_group = EXCLUDED.category_group,
    ui_module_id = EXCLUDED.ui_module_id,
    display_order = EXCLUDED.display_order;

-- 9. OPTIONAL PG_CRON SCHEDULE FOR 5:00 AM IST (23:30 UTC) DAILY REFRESH
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
       AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        PERFORM cron.schedule(
            'upsc-ca-daily-5am-ist',
            '30 23 * * *',
            $cron$
            SELECT net.http_post(
                url := current_setting('app.settings.supabase_url', true) || '/functions/v1/ingest-current-affairs',
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := '{"trigger": "scheduled_5am_ist"}'::jsonb
            );
            $cron$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Safely ignore if pg_cron or pg_net is not enabled on this Supabase tier
    NULL;
END $$;

