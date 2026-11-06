-- Migration: UPSC Mains Community & Peer Review Exchange System
-- Supports public answer publishing, peer review exchanges, scoring rubrics, reputation, notifications, and reports

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COMMUNITY POSTS TABLE
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_badge TEXT DEFAULT 'Active Writer',
  paper_id TEXT NOT NULL, -- 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'ESSAY' | 'OPTIONAL'
  subject_area TEXT,
  topic TEXT,
  question_id TEXT,
  question_title TEXT,
  question_text TEXT NOT NULL,
  year INTEGER DEFAULT 2026,
  marks INTEGER NOT NULL DEFAULT 10,
  word_limit INTEGER NOT NULL DEFAULT 150,
  approach_note TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  bookmarks_count INTEGER NOT NULL DEFAULT 0,
  peer_review_status TEXT NOT NULL DEFAULT 'none', -- 'none' | 'requested' | 'reviewed' | 'exchange_active'
  peer_reviews_count INTEGER NOT NULL DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_paper ON public.community_posts(paper_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes ON public.community_posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_public ON public.community_posts(is_public);

-- 2. COMMUNITY LIKES TABLE (Unique constraint prevents duplicate likes)
CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_post_like UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_likes_post ON public.community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user ON public.community_likes(user_id);

-- 3. COMMUNITY BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_community_post_bookmark UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user ON public.community_bookmarks(user_id);

-- 4. COMMUNITY COMMENTS TABLE (Supports nested replies)
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON public.community_comments(parent_comment_id);

-- 5. PEER REVIEW EXCHANGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.peer_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id TEXT NOT NULL,
  creator_user_name TEXT NOT NULL,
  creator_user_avatar TEXT,
  creator_reputation_score INTEGER NOT NULL DEFAULT 50,
  exchange_type TEXT NOT NULL DEFAULT 'mutual', -- 'mutual' | 'review_only' | 'open_review'
  status TEXT NOT NULL DEFAULT 'waiting_for_partner',
  paper_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  question_id TEXT,
  question_title TEXT,
  question_text TEXT NOT NULL,
  question_marks INTEGER NOT NULL DEFAULT 10,
  question_word_limit INTEGER NOT NULL DEFAULT 150,
  deadline_hours INTEGER NOT NULL DEFAULT 48,
  partner_requirements TEXT,
  creator_submission JSONB NOT NULL DEFAULT '{}'::jsonb,
  partner_user_id TEXT,
  partner_user_name TEXT,
  partner_user_avatar TEXT,
  partner_submission JSONB,
  creator_review_of_partner JSONB,
  partner_review_of_creator JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_review_creator ON public.peer_review_requests(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_review_partner ON public.peer_review_requests(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_review_status ON public.peer_review_requests(status);
CREATE INDEX IF NOT EXISTS idx_peer_review_paper ON public.peer_review_requests(paper_id);

-- 6. USER REPUTATION TABLE
CREATE TABLE IF NOT EXISTS public.user_reputation (
  user_id TEXT PRIMARY KEY,
  reputation_score INTEGER NOT NULL DEFAULT 50,
  total_reviews_completed INTEGER NOT NULL DEFAULT 0,
  total_answers_published INTEGER NOT NULL DEFAULT 0,
  helpful_feedback_count INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '["Active Writer"]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. COMMUNITY NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_notif_user ON public.community_notifications(user_id, is_read);

-- 8. COMMUNITY REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by_user_id TEXT NOT NULL,
  post_id TEXT,
  comment_id TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for public community posts" ON public.community_posts
  FOR SELECT USING (is_public = true OR auth.uid()::text = user_id);

CREATE POLICY "Allow authenticated insert for community posts" ON public.community_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow owner update/delete for community posts" ON public.community_posts
  FOR ALL USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%');

CREATE POLICY "Allow read likes" ON public.community_likes FOR SELECT USING (true);
CREATE POLICY "Allow insert/delete own likes" ON public.community_likes FOR ALL USING (true);

CREATE POLICY "Allow read bookmarks" ON public.community_bookmarks FOR SELECT USING (true);
CREATE POLICY "Allow insert/delete own bookmarks" ON public.community_bookmarks FOR ALL USING (true);

CREATE POLICY "Allow read comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Allow write own comments" ON public.community_comments FOR ALL USING (true);

CREATE POLICY "Allow read review requests" ON public.peer_review_requests FOR SELECT USING (true);
CREATE POLICY "Allow write review requests" ON public.peer_review_requests FOR ALL USING (true);

CREATE POLICY "Allow read user reputation" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Allow write user reputation" ON public.user_reputation FOR ALL USING (true);

CREATE POLICY "Allow read own notifications" ON public.community_notifications FOR SELECT USING (true);
CREATE POLICY "Allow write own notifications" ON public.community_notifications FOR ALL USING (true);

CREATE POLICY "Allow insert reports" ON public.community_reports FOR INSERT WITH CHECK (true);

