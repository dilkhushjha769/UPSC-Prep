-- =================================================================================
-- MIGRATION: UPSC Current Affairs AI-Curated Relevance & Image Intelligence
-- 1. Updates public.ca_articles status check constraint to include 'rejected'
-- 2. Adds columns for importance_level, rejection_reason, ai_relevance_data,
--    and image_verification_confidence
-- 3. Adds indexes for admin review queries and high-priority news filtering
-- =================================================================================

-- 1. Update status check constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ca_articles_status_check'
  ) THEN
    ALTER TABLE public.ca_articles DROP CONSTRAINT ca_articles_status_check;
  END IF;
END $$;

ALTER TABLE public.ca_articles
  ADD CONSTRAINT ca_articles_status_check CHECK (
    status IN ('published', 'quarantined', 'needs_review', 'draft', 'rejected')
  );

-- 2. Add intelligence and verification columns
ALTER TABLE public.ca_articles
  ADD COLUMN IF NOT EXISTS importance_level TEXT DEFAULT 'MODERATE',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_relevance_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS image_verification_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS image_verification_status TEXT DEFAULT 'NOT_AVAILABLE';

-- 3. Add constraint on importance_level
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ca_articles_importance_level_check'
  ) THEN
    ALTER TABLE public.ca_articles DROP CONSTRAINT ca_articles_importance_level_check;
  END IF;
END $$;

ALTER TABLE public.ca_articles
  ADD CONSTRAINT ca_articles_importance_level_check CHECK (
    importance_level IN ('HIGH', 'IMPORTANT', 'MODERATE', 'LOW')
  );

-- 4. Performance indexes for admin review and student-facing feed
CREATE INDEX IF NOT EXISTS idx_ca_articles_status_pub
  ON public.ca_articles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_articles_importance_pub
  ON public.ca_articles (status, importance_level, published_at DESC);

