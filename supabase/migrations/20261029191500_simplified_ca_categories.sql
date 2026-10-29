-- =================================================================================
-- MIGRATION: Simplified Current Affairs Category & Subcategory Structure
-- 1. Enforces 5 Subject Main Categories in public.ca_articles (Daily News queries all 5 without duplication)
-- 2. Keeps Economy, Environment & Ecology, and Science & Technology distinct via subject_group
-- 3. Adds subcategory, feed filter flags (is_most_important, is_prelims_relevant, is_mains_relevant),
--    editorial attribution fields, and Asia/Kolkata date index
-- =================================================================================

ALTER TABLE public.ca_articles
  ADD COLUMN IF NOT EXISTS main_category_id TEXT NOT NULL DEFAULT 'polity-governance',
  ADD COLUMN IF NOT EXISTS subject_group TEXT NOT NULL DEFAULT 'Polity & Governance',
  ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT 'Government Policies and Governance Reforms',
  ADD COLUMN IF NOT EXISTS is_most_important BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_prelims_relevant BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_mains_relevant BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS editorial_author TEXT,
  ADD COLUMN IF NOT EXISTS ai_explanation_disclaimer TEXT,
  ADD COLUMN IF NOT EXISTS published_date_ist DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date);

-- Drop existing check constraints if re-running migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ca_articles_main_category_id_check'
  ) THEN
    ALTER TABLE public.ca_articles DROP CONSTRAINT ca_articles_main_category_id_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ca_articles_subject_group_check'
  ) THEN
    ALTER TABLE public.ca_articles DROP CONSTRAINT ca_articles_subject_group_check;
  END IF;
END $$;

-- Migrate any legacy rows where main_category_id or ui_module_id was 'daily-news' into one of the 5 subject categories
UPDATE public.ca_articles
SET
  main_category_id = CASE
    WHEN ui_module_id IN ('international-affairs', 'polity-governance', 'economy-environment-science', 'reports-schemes-data', 'editorials-explainers')
      THEN ui_module_id
    WHEN primary_category ILIKE '%International%' THEN 'international-affairs'
    WHEN primary_category ILIKE '%Economy%' OR primary_category ILIKE '%Environment%' OR primary_category ILIKE '%Science%' THEN 'economy-environment-science'
    WHEN primary_category ILIKE '%Scheme%' OR primary_category ILIKE '%Report%' THEN 'reports-schemes-data'
    WHEN primary_category ILIKE '%Editorial%' THEN 'editorials-explainers'
    ELSE 'polity-governance'
  END,
  published_date_ist = (published_at AT TIME ZONE 'Asia/Kolkata')::date;

ALTER TABLE public.ca_articles
  ADD CONSTRAINT ca_articles_main_category_id_check CHECK (
    main_category_id IN (
      'international-affairs',
      'polity-governance',
      'economy-environment-science',
      'reports-schemes-data',
      'editorials-explainers'
    )
  );

ALTER TABLE public.ca_articles
  ADD CONSTRAINT ca_articles_subject_group_check CHECK (
    subject_group IN (
      'International Affairs',
      'Polity & Governance',
      'Economy',
      'Environment & Ecology',
      'Science & Technology',
      'Reports, Schemes & Data',
      'Editorials & Explainers'
    )
  );

-- Performance indexes for simplified categories, subcategories, Asia/Kolkata dates & Daily News feed filters
CREATE INDEX IF NOT EXISTS idx_ca_articles_main_cat_sub_pub
  ON public.ca_articles (main_category_id, subcategory, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_articles_subject_group_sub_pub
  ON public.ca_articles (subject_group, subcategory, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_ca_articles_date_ist_pub
  ON public.ca_articles (published_date_ist DESC, main_category_id, status);

CREATE INDEX IF NOT EXISTS idx_ca_articles_feed_filters
  ON public.ca_articles (status, is_most_important, is_prelims_relevant, is_mains_relevant, published_at DESC);

-- Update ca_category_status to reflect the 6 Main Categories + 3 Subject Groups under Economy, Environment & Science
DELETE FROM public.ca_category_status;

INSERT INTO public.ca_category_status (
  category_id, category_name, category_group, ui_module_id, display_order, status
) VALUES
  ('daily-news', 'Daily News (All 5 Subject Categories)', 'ui_module', 'daily-news', 1, 'success'),
  ('international-affairs', 'International Affairs', 'ui_module', 'international-affairs', 2, 'success'),
  ('polity-governance', 'Polity & Governance', 'ui_module', 'polity-governance', 3, 'success'),
  ('economy-environment-science', 'Economy, Environment & Science', 'ui_module', 'economy-environment-science', 4, 'success'),
  ('reports-schemes-data', 'Reports, Schemes & Data', 'ui_module', 'reports-schemes-data', 5, 'success'),
  ('editorials-explainers', 'Editorials & Explainers', 'ui_module', 'editorials-explainers', 6, 'success'),
  ('group-economy', 'Economy (Subject Group)', 'canonical', 'economy-environment-science', 7, 'success'),
  ('group-environment-ecology', 'Environment & Ecology (Subject Group)', 'canonical', 'economy-environment-science', 8, 'success'),
  ('group-science-technology', 'Science & Technology (Subject Group)', 'canonical', 'economy-environment-science', 9, 'success')
ON CONFLICT (category_id) DO UPDATE SET
  category_name = EXCLUDED.category_name,
  category_group = EXCLUDED.category_group,
  ui_module_id = EXCLUDED.ui_module_id,
  display_order = EXCLUDED.display_order;

