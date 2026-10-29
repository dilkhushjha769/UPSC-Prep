-- Migration: UPSC Prelims Canonical Taxonomy, Subtopic Hierarchy & Two-Stage Classification Audit Fields
-- Safely extends public.questions and creates canonical taxonomy reference tables without deleting any question records.

-- 1. CANONICAL SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.upsc_subjects (
  id TEXT PRIMARY KEY,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('GS1', 'CSAT')),
  paper_name TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CANONICAL TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.upsc_topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.upsc_subjects(id) ON DELETE CASCADE,
  paper_type TEXT NOT NULL CHECK (paper_type IN ('GS1', 'CSAT')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upsc_topics_subject_id ON public.upsc_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_upsc_topics_paper_type ON public.upsc_topics(paper_type);

-- 3. EXTEND QUESTIONS TABLE WITH NORMALIZED TAXONOMY & TWO-STAGE VERIFICATION METADATA
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS subject_id TEXT,
  ADD COLUMN IF NOT EXISTS topic_id TEXT,
  ADD COLUMN IF NOT EXISTS subtopic_id TEXT,
  ADD COLUMN IF NOT EXISTS subtopic TEXT,
  ADD COLUMN IF NOT EXISTS raw_topic TEXT,
  ADD COLUMN IF NOT EXISTS secondary_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(4,2) NOT NULL DEFAULT 0.95,
  ADD COLUMN IF NOT EXISTS confidence_band TEXT NOT NULL DEFAULT 'High' CHECK (confidence_band IN ('High', 'Medium', 'Low')),
  ADD COLUMN IF NOT EXISTS classification_rationale TEXT,
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'verified' CHECK (validation_status IN ('verified', 'verified_cross_tagged', 'needs_review')),
  ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- 4. COMPOSITE & FILTERING INDEXES FOR FAST TOPIC-WISE QUESTION BANK NAVIGATION
CREATE INDEX IF NOT EXISTS idx_questions_paper_subject_topic ON public.questions(paper_type, subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subtopic_id ON public.questions(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_questions_year_paper_subject ON public.questions(year DESC, paper_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_validation_status ON public.questions(validation_status);
CREATE INDEX IF NOT EXISTS idx_questions_confidence_band ON public.questions(confidence_band);

-- 5. RLS POLICIES FOR TAXONOMY REFERENCE TABLES
ALTER TABLE public.upsc_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsc_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read upsc_subjects" ON public.upsc_subjects;
CREATE POLICY "Public read upsc_subjects" ON public.upsc_subjects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read upsc_topics" ON public.upsc_topics;
CREATE POLICY "Public read upsc_topics" ON public.upsc_topics
  FOR SELECT USING (true);

