-- Migration: Production-Ready UPSC PYQ Mock Test System
-- Creates questions, mock_tests, mock_test_questions, mock_test_responses, and user_question_attempts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam TEXT NOT NULL DEFAULT 'UPSC CSE',
  year INTEGER NOT NULL,
  paper TEXT NOT NULL,
  paper_type TEXT NOT NULL, -- 'GS1' | 'CSAT'
  question_number INTEGER NOT NULL,
  question_text_en TEXT NOT NULL,
  question_text_hi TEXT,
  statements JSONB DEFAULT '[]'::jsonb,
  table_data JSONB,
  passage_id TEXT,
  passage_text TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation_en TEXT,
  explanation_hi TEXT,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question_image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  content_fingerprint TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON public.questions(exam, year);
CREATE INDEX IF NOT EXISTS idx_questions_paper_type ON public.questions(paper_type);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_year_subject ON public.questions(year, subject);

-- 2. MOCK TESTS TABLE
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  guest_id TEXT,
  test_title TEXT NOT NULL,
  exam TEXT NOT NULL DEFAULT 'UPSC CSE',
  paper_type TEXT NOT NULL DEFAULT 'GS1',
  selected_years INTEGER[] NOT NULL DEFAULT '{}',
  selected_subjects TEXT[] NOT NULL DEFAULT '{}',
  selected_topics TEXT[] NOT NULL DEFAULT '{}',
  test_mode TEXT NOT NULL CHECK (test_mode IN ('full', 'practice')),
  question_count INTEGER NOT NULL,
  marks_per_correct NUMERIC NOT NULL DEFAULT 2.0,
  negative_marks NUMERIC NOT NULL DEFAULT 0.6667,
  time_limit_minutes INTEGER,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submission_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  score NUMERIC DEFAULT 0,
  total_marks NUMERIC DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unattempted_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  subject_stats JSONB DEFAULT '{}'::jsonb,
  topic_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_user_id ON public.mock_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_guest_id ON public.mock_tests(guest_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_status ON public.mock_tests(status);
CREATE INDEX IF NOT EXISTS idx_mock_tests_created_at ON public.mock_tests(created_at DESC);

-- 3. MOCK TEST QUESTIONS TABLE (Immutable snapshot of generated test order and content)
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_test_question UNIQUE (mock_test_id, question_id),
  CONSTRAINT uq_test_position UNIQUE (mock_test_id, position)
);

CREATE INDEX IF NOT EXISTS idx_mock_test_questions_test_pos ON public.mock_test_questions(mock_test_id, position);

-- 4. MOCK TEST RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.mock_test_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  answer_status TEXT NOT NULL DEFAULT 'unattempted' CHECK (answer_status IN ('unattempted', 'answered', 'marked_for_review', 'answered_and_marked')),
  is_correct BOOLEAN,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_test_response UNIQUE (mock_test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mock_test_responses_test_q ON public.mock_test_responses(mock_test_id, question_id);

-- 5. USER QUESTION ATTEMPTS TABLE (Historical tracking for unattempted filter)
CREATE TABLE IF NOT EXISTS public.user_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  guest_id TEXT,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  mock_test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_attempts_user_q ON public.user_question_attempts(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_user_attempts_guest_q ON public.user_question_attempts(guest_id, question_id);

-- 6. SERVER-SIDE SUBMISSION & SCORING FUNCTION
CREATE OR REPLACE FUNCTION public.submit_mock_test(p_test_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_test RECORD;
  v_q RECORD;
  v_resp RECORD;
  v_correct_count INT := 0;
  v_incorrect_count INT := 0;
  v_unattempted_count INT := 0;
  v_score NUMERIC := 0;
  v_total_marks NUMERIC := 0;
  v_accuracy NUMERIC := 0;
  v_subject_stats JSONB := '{}'::jsonb;
  v_topic_stats JSONB := '{}'::jsonb;
  v_subj TEXT;
  v_top TEXT;
  v_sub_stat JSONB;
  v_top_stat JSONB;
BEGIN
  -- Get test record
  SELECT * INTO v_test FROM public.mock_tests WHERE id = p_test_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mock test not found: %', p_test_id;
  END IF;

  -- Idempotency: if already submitted, return existing results
  IF v_test.status = 'submitted' THEN
    RETURN jsonb_build_object(
      'status', 'submitted',
      'score', v_test.score,
      'total_marks', v_test.total_marks,
      'accuracy', v_test.accuracy,
      'correct_count', v_test.correct_count,
      'incorrect_count', v_test.incorrect_count,
      'unattempted_count', v_test.unattempted_count,
      'subject_stats', v_test.subject_stats,
      'topic_stats', v_test.topic_stats
    );
  END IF;

  -- Loop through all questions in test
  FOR v_q IN (
    SELECT
      mtq.question_id,
      q.correct_answer,
      q.subject,
      q.topic,
      r.selected_answer
    FROM public.mock_test_questions mtq
    JOIN public.questions q ON mtq.question_id = q.id
    LEFT JOIN public.mock_test_responses r
      ON r.mock_test_id = mtq.mock_test_id AND r.question_id = mtq.question_id
    WHERE mtq.mock_test_id = p_test_id
    ORDER BY mtq.position ASC
  ) LOOP
    v_subj := v_q.subject;
    v_top := v_q.topic;

    -- Initialize subject stats if absent
    IF NOT (v_subject_stats ? v_subj) THEN
      v_subject_stats := jsonb_set(v_subject_stats, ARRAY[v_subj], '{"total":0,"correct":0,"incorrect":0,"unattempted":0,"marks":0}'::jsonb);
    END IF;
    -- Initialize topic stats if absent
    IF NOT (v_topic_stats ? v_top) THEN
      v_topic_stats := jsonb_set(v_topic_stats, ARRAY[v_top], '{"total":0,"correct":0,"incorrect":0,"unattempted":0,"marks":0}'::jsonb);
    END IF;

    v_sub_stat := v_subject_stats -> v_subj;
    v_top_stat := v_topic_stats -> v_top;

    -- Increment total
    v_sub_stat := jsonb_set(v_sub_stat, '{total}', to_jsonb((v_sub_stat->>'total')::int + 1));
    v_top_stat := jsonb_set(v_top_stat, '{total}', to_jsonb((v_top_stat->>'total')::int + 1));

    IF v_q.selected_answer IS NULL OR TRIM(v_q.selected_answer) = '' THEN
      v_unattempted_count := v_unattempted_count + 1;
      v_sub_stat := jsonb_set(v_sub_stat, '{unattempted}', to_jsonb((v_sub_stat->>'unattempted')::int + 1));
      v_top_stat := jsonb_set(v_top_stat, '{unattempted}', to_jsonb((v_top_stat->>'unattempted')::int + 1));

      -- Update response is_correct to null
      UPDATE public.mock_test_responses
      SET is_correct = FALSE, answer_status = 'unattempted'
      WHERE mock_test_id = p_test_id AND question_id = v_q.question_id;

    ELSIF UPPER(TRIM(v_q.selected_answer)) = UPPER(TRIM(v_q.correct_answer)) THEN
      v_correct_count := v_correct_count + 1;
      v_score := v_score + v_test.marks_per_correct;

      v_sub_stat := jsonb_set(v_sub_stat, '{correct}', to_jsonb((v_sub_stat->>'correct')::int + 1));
      v_sub_stat := jsonb_set(v_sub_stat, '{marks}', to_jsonb(ROUND((v_sub_stat->>'marks')::numeric + v_test.marks_per_correct, 2)));

      v_top_stat := jsonb_set(v_top_stat, '{correct}', to_jsonb((v_top_stat->>'correct')::int + 1));
      v_top_stat := jsonb_set(v_top_stat, '{marks}', to_jsonb(ROUND((v_top_stat->>'marks')::numeric + v_test.marks_per_correct, 2)));

      UPDATE public.mock_test_responses
      SET is_correct = TRUE
      WHERE mock_test_id = p_test_id AND question_id = v_q.question_id;

      -- Record user question attempt
      INSERT INTO public.user_question_attempts (user_id, guest_id, question_id, mock_test_id, selected_answer, is_correct)
      VALUES (v_test.user_id, v_test.guest_id, v_q.question_id, p_test_id, v_q.selected_answer, TRUE);

    ELSE
      v_incorrect_count := v_incorrect_count + 1;
      v_score := v_score - v_test.negative_marks;

      v_sub_stat := jsonb_set(v_sub_stat, '{incorrect}', to_jsonb((v_sub_stat->>'incorrect')::int + 1));
      v_sub_stat := jsonb_set(v_sub_stat, '{marks}', to_jsonb(ROUND((v_sub_stat->>'marks')::numeric - v_test.negative_marks, 2)));

      v_top_stat := jsonb_set(v_top_stat, '{incorrect}', to_jsonb((v_top_stat->>'incorrect')::int + 1));
      v_top_stat := jsonb_set(v_top_stat, '{marks}', to_jsonb(ROUND((v_top_stat->>'marks')::numeric - v_test.negative_marks, 2)));

      UPDATE public.mock_test_responses
      SET is_correct = FALSE
      WHERE mock_test_id = p_test_id AND question_id = v_q.question_id;

      INSERT INTO public.user_question_attempts (user_id, guest_id, question_id, mock_test_id, selected_answer, is_correct)
      VALUES (v_test.user_id, v_test.guest_id, v_q.question_id, p_test_id, v_q.selected_answer, FALSE);
    END IF;

    v_subject_stats := jsonb_set(v_subject_stats, ARRAY[v_subj], v_sub_stat);
    v_topic_stats := jsonb_set(v_topic_stats, ARRAY[v_top], v_top_stat);
  END LOOP;

  v_total_marks := v_test.question_count * v_test.marks_per_correct;
  IF (v_correct_count + v_incorrect_count) > 0 THEN
    v_accuracy := ROUND((v_correct_count::numeric / (v_correct_count + v_incorrect_count)::numeric) * 100, 2);
  ELSE
    v_accuracy := 0.00;
  END IF;

  v_score := ROUND(v_score, 2);

  UPDATE public.mock_tests
  SET
    status = 'submitted',
    submission_time = NOW(),
    score = v_score,
    total_marks = v_total_marks,
    accuracy = v_accuracy,
    correct_count = v_correct_count,
    incorrect_count = v_incorrect_count,
    unattempted_count = v_unattempted_count,
    subject_stats = v_subject_stats,
    topic_stats = v_topic_stats,
    updated_at = NOW()
  WHERE id = p_test_id;

  RETURN jsonb_build_object(
    'status', 'submitted',
    'score', v_score,
    'total_marks', v_total_marks,
    'accuracy', v_accuracy,
    'correct_count', v_correct_count,
    'incorrect_count', v_incorrect_count,
    'unattempted_count', v_unattempted_count,
    'subject_stats', v_subject_stats,
    'topic_stats', v_topic_stats
  );
END;
$$;

-- 7. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;

-- Questions are readable by all authenticated and anonymous users
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions
  FOR SELECT USING (true);

-- Mock tests policy: user owns test by user_id or guest_id
DROP POLICY IF EXISTS "Users can read own mock_tests" ON public.mock_tests;
CREATE POLICY "Users can read own mock_tests" ON public.mock_tests
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL)
  );

DROP POLICY IF EXISTS "Users can create mock_tests" ON public.mock_tests;
CREATE POLICY "Users can create mock_tests" ON public.mock_tests
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL)
  );

DROP POLICY IF EXISTS "Users can update own mock_tests" ON public.mock_tests;
CREATE POLICY "Users can update own mock_tests" ON public.mock_tests
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL)
  );

-- Mock test questions policy
DROP POLICY IF EXISTS "Users can read mock_test_questions" ON public.mock_test_questions;
CREATE POLICY "Users can read mock_test_questions" ON public.mock_test_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert mock_test_questions" ON public.mock_test_questions;
CREATE POLICY "Users can insert mock_test_questions" ON public.mock_test_questions
  FOR INSERT WITH CHECK (true);

-- Mock test responses policy
DROP POLICY IF EXISTS "Users can manage mock_test_responses" ON public.mock_test_responses;
CREATE POLICY "Users can manage mock_test_responses" ON public.mock_test_responses
  FOR ALL USING (true) WITH CHECK (true);

-- User question attempts policy
DROP POLICY IF EXISTS "Users can manage user_question_attempts" ON public.user_question_attempts;
CREATE POLICY "Users can manage user_question_attempts" ON public.user_question_attempts
  FOR ALL USING (true) WITH CHECK (true);
