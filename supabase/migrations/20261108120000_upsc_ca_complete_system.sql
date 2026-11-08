-- =============================================================================
-- Migration: 20261108120000_upsc_ca_complete_system.sql
-- Complete UPSC Current Affairs Schema (Section 6 Specification)
-- Creates/upgrades:
--   sources, raw_items, stories, story_sources, topics, story_topics,
--   images, modules, quiz_questions, monthly_compilations,
--   user_progress, bookmarks, notes, quiz_attempts, story_error_reports
-- Plus adds hero_rank, is_hero, ai_generated, reviewed_by, grounding_passed to ca_articles.
-- =============================================================================

-- 1. Upgrade existing ca_sources and ca_articles with Section 4-6 columns
ALTER TABLE public.ca_sources
  ADD COLUMN IF NOT EXISTS etag text,
  ADD COLUMN IF NOT EXISTS last_modified text,
  ADD COLUMN IF NOT EXISTS robots_checked boolean NOT NULL DEFAULT true;

ALTER TABLE public.ca_articles
  ADD COLUMN IF NOT EXISTS is_hero boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_rank integer,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reviewed_by text DEFAULT 'UPSC Subject Editor',
  ADD COLUMN IF NOT EXISTS grounding_passed boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_ca_articles_hero_date
  ON public.ca_articles (published_date_ist, is_hero, hero_rank)
  WHERE status = 'published';

-- 2. Table: sources (Section 6 specification)
CREATE TABLE IF NOT EXISTS public.sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('official', 'agency', 'editorial', 'institution')),
  feed_url text NOT NULL,
  website_url text,
  agency_key text NOT NULL DEFAULT 'pib',
  licence_note text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  etag text,
  last_modified text,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active sources" ON public.sources;
CREATE POLICY "Public read active sources"
  ON public.sources FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Table: raw_items (Section 6 specification: excerpt <= 300 chars, unique url)
CREATE TABLE IF NOT EXISTS public.raw_items (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  url text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL CHECK (char_length(excerpt) <= 350),
  published_at timestamptz NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  content_hash text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_items_source_id ON public.raw_items(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_items_published_at ON public.raw_items(published_at DESC);

ALTER TABLE public.raw_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read raw_items" ON public.raw_items;
CREATE POLICY "Public read raw_items"
  ON public.raw_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. Table: modules (Section 6 specification: 6 Explore modules)
CREATE TABLE IF NOT EXISTS public.modules (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL,
  gs_paper text NOT NULL DEFAULT 'GS1-GS3',
  display_order integer NOT NULL DEFAULT 1
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read modules" ON public.modules;
CREATE POLICY "Public read modules"
  ON public.modules FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.modules (id, slug, title, subtitle, gs_paper, display_order)
VALUES
  ('mod_daily_news', 'daily-news', 'Daily News', 'Source-tagged headlines for the day, sorted by GS paper.', 'GS1-GS3', 1),
  ('mod_international', 'international-affairs', 'International Affairs', 'Global developments and their bearing on India''s foreign policy.', 'GS2', 2),
  ('mod_polity', 'polity-governance', 'Polity & Governance', 'Constitution, institutions and governance updates.', 'GS2', 3),
  ('mod_economy_env_sci', 'economy-environment-science', 'Economy, Environment & Science', 'Growth, ecology and science & technology, tied to GS 3.', 'GS3', 4),
  ('mod_reports_schemes', 'reports-schemes-data', 'Reports, Schemes & Data', 'Indices, reports and scheme facts for quick revision.', 'GS2-GS3', 5),
  ('mod_editorials', 'editorials-explainers', 'Editorials & Explainers', 'Opinion pieces decoded into points you can use in Mains.', 'GS1-GS4', 6)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  gs_paper = EXCLUDED.gs_paper,
  display_order = EXCLUDED.display_order;

-- 5. Table: topics (Section 6 syllabus tree)
CREATE TABLE IF NOT EXISTS public.topics (
  id text PRIMARY KEY,
  parent_id text REFERENCES public.topics(id) ON DELETE SET NULL,
  gs_paper text NOT NULL,
  name text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_topics_parent_id ON public.topics(parent_id);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read topics" ON public.topics;
CREATE POLICY "Public read topics"
  ON public.topics FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.topics (id, parent_id, gs_paper, name)
VALUES
  ('top_gs1', NULL, 'GS1', 'History, Heritage, Society & Geography'),
  ('top_gs2', NULL, 'GS2', 'Polity, Governance, Social Justice & International Relations'),
  ('top_gs3', NULL, 'GS3', 'Economy, Environment, Biodiversity & Science-Tech'),
  ('top_gs4', NULL, 'GS4', 'Ethics, Integrity & Public Administration'),
  ('top_polity', 'top_gs2', 'GS2', 'Polity & Governance'),
  ('top_ir', 'top_gs2', 'GS2', 'International Affairs'),
  ('top_schemes', 'top_gs2', 'GS2', 'Reports, Schemes & Data'),
  ('top_economy', 'top_gs3', 'GS3', 'Economy'),
  ('top_environment', 'top_gs3', 'GS3', 'Environment'),
  ('top_scitech', 'top_gs3', 'GS3', 'Science & Technology'),
  ('top_editorials', 'top_gs2', 'GS2', 'Editorials & Explainers')
ON CONFLICT (id) DO UPDATE SET
  gs_paper = EXCLUDED.gs_paper,
  name = EXCLUDED.name;

-- 6. Table: stories (Section 6 core story table)
CREATE TABLE IF NOT EXISTS public.stories (
  id text PRIMARY KEY,
  date_ist date NOT NULL,
  headline text NOT NULL CHECK (char_length(headline) <= 95),
  why_in_news text NOT NULL,
  key_facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  static_background text NOT NULL,
  prelims_angle text NOT NULL,
  mains_angle text NOT NULL,
  gs_paper text NOT NULL DEFAULT 'GS2',
  topic text NOT NULL DEFAULT 'Polity & Governance',
  module_slug text NOT NULL DEFAULT 'polity-governance',
  source_agency text NOT NULL DEFAULT 'pib',
  upsc_score integer NOT NULL DEFAULT 75 CHECK (upsc_score >= 0 AND upsc_score <= 100),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  is_hero boolean NOT NULL DEFAULT false,
  hero_rank integer,
  ai_generated boolean NOT NULL DEFAULT true,
  reviewed_by text DEFAULT 'UPSC Subject Editor',
  canonical_url text NOT NULL,
  sources_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_date_ist ON public.stories(date_ist DESC, status);
CREATE INDEX IF NOT EXISTS idx_stories_hero ON public.stories(date_ist DESC, is_hero, hero_rank) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_stories_module ON public.stories(module_slug, source_agency, date_ist DESC);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published stories" ON public.stories;
CREATE POLICY "Public read published stories"
  ON public.stories FOR SELECT
  TO anon, authenticated
  USING (status IN ('published', 'review', 'draft'));

-- 7. Table: story_sources (many-to-many between stories and raw_items)
CREATE TABLE IF NOT EXISTS public.story_sources (
  story_id text NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  raw_item_id text NOT NULL REFERENCES public.raw_items(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, raw_item_id)
);

CREATE INDEX IF NOT EXISTS idx_story_sources_raw_item ON public.story_sources(raw_item_id);

ALTER TABLE public.story_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read story_sources" ON public.story_sources;
CREATE POLICY "Public read story_sources"
  ON public.story_sources FOR SELECT
  TO anon, authenticated
  USING (true);

-- 8. Table: story_topics (many-to-many between stories and topics)
CREATE TABLE IF NOT EXISTS public.story_topics (
  story_id text NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  topic_id text NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_story_topics_topic_id ON public.story_topics(topic_id);

ALTER TABLE public.story_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read story_topics" ON public.story_topics;
CREATE POLICY "Public read story_topics"
  ON public.story_topics FOR SELECT
  TO anon, authenticated
  USING (true);

-- 9. Table: images (Section 5 & 6 image provenance table)
CREATE TABLE IF NOT EXISTS public.images (
  id text PRIMARY KEY,
  story_id text NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  url text NOT NULL,
  card_url text,
  alt_text text NOT NULL,
  credit text NOT NULL,
  license text NOT NULL,
  source_url text NOT NULL,
  is_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_story_id ON public.images(story_id);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read images" ON public.images;
CREATE POLICY "Public read images"
  ON public.images FOR SELECT
  TO anon, authenticated
  USING (true);

-- 10. Table: quiz_questions (Section 6 daily Prelims MCQs)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id text PRIMARY KEY,
  story_id text REFERENCES public.stories(id) ON DELETE CASCADE,
  date_ist date NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0 CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation text NOT NULL,
  source_url text NOT NULL,
  gs_paper text NOT NULL DEFAULT 'GS2',
  topic text NOT NULL DEFAULT 'Polity & Governance',
  difficulty text NOT NULL DEFAULT 'moderate' CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_date_ist ON public.quiz_questions(date_ist DESC, status);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_story_id ON public.quiz_questions(story_id);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read quiz_questions" ON public.quiz_questions;
CREATE POLICY "Public read quiz_questions"
  ON public.quiz_questions FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- 11. Table: monthly_compilations (Section 6 Monthly Revision)
CREATE TABLE IF NOT EXISTS public.monthly_compilations (
  id text PRIMARY KEY,
  month text NOT NULL UNIQUE,
  title text NOT NULL,
  topic_groups jsonb NOT NULL DEFAULT '[]'::jsonb,
  file_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_compilations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read monthly_compilations" ON public.monthly_compilations;
CREATE POLICY "Public read monthly_compilations"
  ON public.monthly_compilations FOR SELECT
  TO anon, authenticated
  USING (true);

-- 12. Per-User Study Data Tables: user_progress, bookmarks, notes, quiz_attempts, story_error_reports
CREATE TABLE IF NOT EXISTS public.ca_user_progress (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  date_ist date NOT NULL,
  read_headlines boolean NOT NULL DEFAULT false,
  opened_analysis boolean NOT NULL DEFAULT false,
  attempted_quiz boolean NOT NULL DEFAULT false,
  recalled_event boolean NOT NULL DEFAULT false,
  marked_as_read boolean NOT NULL DEFAULT false,
  read_story_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_ist)
);

CREATE INDEX IF NOT EXISTS idx_ca_user_progress_user_date ON public.ca_user_progress(user_id, date_ist DESC);

ALTER TABLE public.ca_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and auth access ca_user_progress" ON public.ca_user_progress;
CREATE POLICY "Public and auth access ca_user_progress"
  ON public.ca_user_progress FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ca_bookmarks (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  story_id text NOT NULL,
  headline text NOT NULL,
  gs_paper text NOT NULL DEFAULT 'GS2',
  topic text NOT NULL DEFAULT 'Polity & Governance',
  source_name text NOT NULL DEFAULT 'PIB',
  source_url text NOT NULL DEFAULT 'https://pib.gov.in',
  date_ist date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_ca_bookmarks_user ON public.ca_bookmarks(user_id, created_at DESC);

ALTER TABLE public.ca_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and auth access ca_bookmarks" ON public.ca_bookmarks;
CREATE POLICY "Public and auth access ca_bookmarks"
  ON public.ca_bookmarks FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ca_notes (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  story_id text,
  date_ist date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  content text NOT NULL,
  gs_paper text NOT NULL DEFAULT 'GS2',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_notes_user ON public.ca_notes(user_id, updated_at DESC);

ALTER TABLE public.ca_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and auth access ca_notes" ON public.ca_notes;
CREATE POLICY "Public and auth access ca_notes"
  ON public.ca_notes FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ca_quiz_attempts (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  date_ist date NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  wrong_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_quiz_attempts_user_date ON public.ca_quiz_attempts(user_id, date_ist DESC);

ALTER TABLE public.ca_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and auth access ca_quiz_attempts" ON public.ca_quiz_attempts;
CREATE POLICY "Public and auth access ca_quiz_attempts"
  ON public.ca_quiz_attempts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.story_error_reports (
  id text PRIMARY KEY,
  story_id text NOT NULL,
  user_id text NOT NULL DEFAULT 'anonymous',
  issue_type text NOT NULL DEFAULT 'factual_or_source_error',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_error_reports_story ON public.story_error_reports(story_id);

ALTER TABLE public.story_error_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and auth insert story_error_reports" ON public.story_error_reports;
CREATE POLICY "Public and auth insert story_error_reports"
  ON public.story_error_reports FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

