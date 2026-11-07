-- Migration: Production-Ready UPSC Mains Answer Writing & Evaluation System
-- Creates tables for papers, questions, submissions, attachments, evaluations, parameters, and drafts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. MAINS EXAM PAPERS TABLE
CREATE TABLE IF NOT EXISTS public.mains_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id TEXT NOT NULL, -- 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'ESSAY' | 'OPTIONAL'
  exam TEXT NOT NULL DEFAULT 'Civil Services (Main) Examination',
  year INTEGER NOT NULL,
  paper_title TEXT NOT NULL,
  paper_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 250,
  time_allowed_hours NUMERIC NOT NULL DEFAULT 3,
  instructions JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_mains_paper_code UNIQUE (paper_code)
);

CREATE INDEX IF NOT EXISTS idx_mains_papers_paper_id ON public.mains_papers(paper_id);
CREATE INDEX IF NOT EXISTS idx_mains_papers_year ON public.mains_papers(year);

-- 2. MAINS QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.mains_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_db_id UUID REFERENCES public.mains_papers(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE NOT NULL, -- e.g. '2026_GS4_Q1A'
  paper_id TEXT NOT NULL, -- 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'ESSAY'
  year INTEGER NOT NULL,
  section_name TEXT NOT NULL DEFAULT 'Section A',
  section_code TEXT NOT NULL DEFAULT 'SECTION A',
  question_number TEXT NOT NULL,
  text_english TEXT NOT NULL,
  text_hindi TEXT,
  marks INTEGER NOT NULL DEFAULT 10,
  word_limit INTEGER NOT NULL DEFAULT 150,
  subject_area TEXT NOT NULL,
  topic TEXT NOT NULL,
  is_case_study BOOLEAN NOT NULL DEFAULT FALSE,
  title TEXT,
  scenario_english TEXT,
  scenario_hindi TEXT,
  sub_questions JSONB DEFAULT '[]'::jsonb,
  sub_questions_hindi JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mains_questions_paper_id ON public.mains_questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_mains_questions_topic ON public.mains_questions(topic);
CREATE INDEX IF NOT EXISTS idx_mains_questions_subject_area ON public.mains_questions(subject_area);
CREATE INDEX IF NOT EXISTS idx_mains_questions_is_case_study ON public.mains_questions(is_case_study);
CREATE INDEX IF NOT EXISTS idx_mains_questions_year ON public.mains_questions(year);

-- 3. MAINS SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.mains_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  guest_id TEXT,
  question_id TEXT NOT NULL, -- references external_id
  paper_id TEXT NOT NULL,
  question_number TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  submission_mode TEXT NOT NULL CHECK (submission_mode IN ('typed', 'handwritten')),
  answer_text TEXT NOT NULL DEFAULT '',
  ocr_extracted_text TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  evaluation_status TEXT NOT NULL DEFAULT 'submitted' CHECK (evaluation_status IN ('draft', 'submitted', 'evaluating', 'evaluated', 'failed')),
  marks_awarded NUMERIC(5,2),
  max_marks INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mains_submissions_user_id ON public.mains_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_mains_submissions_guest_id ON public.mains_submissions(guest_id);
CREATE INDEX IF NOT EXISTS idx_mains_submissions_question_id ON public.mains_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_mains_submissions_paper_id ON public.mains_submissions(paper_id);
CREATE INDEX IF NOT EXISTS idx_mains_submissions_status ON public.mains_submissions(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_mains_submissions_created_at ON public.mains_submissions(created_at DESC);

-- 4. MAINS ATTACHMENTS TABLE (Uploaded Answer Sheets)
CREATE TABLE IF NOT EXISTS public.mains_submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.mains_submissions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  file_uri TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image/jpeg',
  file_name TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mains_attachments_submission_id ON public.mains_submission_attachments(submission_id);

-- 5. MAINS EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.mains_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES public.mains_submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  user_id UUID,
  guest_id TEXT,
  total_score NUMERIC(5,2) NOT NULL,
  max_score INTEGER NOT NULL,
  score_percentage NUMERIC(5,2) NOT NULL,
  is_case_study BOOLEAN NOT NULL DEFAULT FALSE,
  marks_explanation TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvement_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_answer TEXT NOT NULL,
  model_answer_word_count INTEGER NOT NULL DEFAULT 0,
  missing_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  examiners_remarks TEXT NOT NULL,
  case_study_details JSONB,
  disclaimer TEXT NOT NULL DEFAULT 'Evaluation is simulated based on rigorous UPSC Mains standards for coaching purposes and does not represent official UPSC results.',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mains_evaluations_sub_id ON public.mains_evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_mains_evaluations_q_id ON public.mains_evaluations(question_id);

-- 6. MAINS DRAFTS TABLE (Auto-saved in-progress answers)
CREATE TABLE IF NOT EXISTS public.mains_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  guest_id TEXT,
  question_id TEXT NOT NULL,
  submission_mode TEXT NOT NULL DEFAULT 'typed',
  answer_text TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  word_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_mains_draft_user_q UNIQUE (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), guest_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mains_drafts_user_guest ON public.mains_drafts(user_id, guest_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.mains_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_submission_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_drafts ENABLE ROW LEVEL SECURITY;

-- Read policies for papers and questions (publicly readable)
DROP POLICY IF EXISTS "Public can view mains papers" ON public.mains_papers;
CREATE POLICY "Public can view mains papers" ON public.mains_papers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view mains questions" ON public.mains_questions;
CREATE POLICY "Public can view mains questions" ON public.mains_questions FOR SELECT USING (true);

-- User-scoped policies for submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.mains_submissions;
CREATE POLICY "Users can view own submissions" ON public.mains_submissions
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.mains_submissions;
CREATE POLICY "Users can insert own submissions" ON public.mains_submissions
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can update own submissions" ON public.mains_submissions;
CREATE POLICY "Users can update own submissions" ON public.mains_submissions
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

-- Attachments policy
DROP POLICY IF EXISTS "Users can access submission attachments" ON public.mains_submission_attachments;
CREATE POLICY "Users can access submission attachments" ON public.mains_submission_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mains_submissions s
      WHERE s.id = mains_submission_attachments.submission_id
        AND ((auth.uid() IS NOT NULL AND s.user_id = auth.uid()) OR (auth.uid() IS NULL AND s.guest_id IS NOT NULL))
    )
  );

-- Evaluations policy
DROP POLICY IF EXISTS "Users can view own evaluations" ON public.mains_evaluations;
CREATE POLICY "Users can view own evaluations" ON public.mains_evaluations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can insert own evaluations" ON public.mains_evaluations;
CREATE POLICY "Users can insert own evaluations" ON public.mains_evaluations
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

-- Drafts policy
DROP POLICY IF EXISTS "Users can manage own drafts" ON public.mains_drafts;
CREATE POLICY "Users can manage own drafts" ON public.mains_drafts
  FOR ALL USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND guest_id IS NOT NULL)
  );

