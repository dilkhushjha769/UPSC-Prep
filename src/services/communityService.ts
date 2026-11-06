/**
 * UPSC Mains Community and Peer Review Service
 * Supports social answer publishing, peer review exchanges, scoring rubrics, reputation, and notifications.
 * Uses transparent AsyncStorage offline cache with Supabase synchronization.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUserIdOrGuestId } from './supabase';
import {
  CommunityComment,
  CommunityNotification,
  CommunityPost,
  CriteriaScore,
  ExchangeStatus,
  ExchangeType,
  PeerEvaluationRecord,
  PeerReviewExchangeRequest,
  UserReputation,
} from '@/types/community';
import { MainsAttachmentRecord, MainsPaperId } from '@/types/mains';
import {
  INITIAL_COMMUNITY_COMMENTS,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_EXCHANGE_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USER_REPUTATION,
} from '@/data/seedCommunityData';

const inMemoryStore = new Map<string, string>();

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      const val = await AsyncStorage.getItem(key);
      return val ?? inMemoryStore.get(key) ?? null;
    } catch {
      return inMemoryStore.get(key) || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    inMemoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
};

const COMMUNITY_POSTS_KEY = '@upsc_community_posts_v1';
const COMMUNITY_COMMENTS_KEY = '@upsc_community_comments_v1';
const PEER_EXCHANGES_KEY = '@upsc_peer_exchanges_v1';
const USER_REPUTATION_KEY = '@upsc_user_reputation_v1';
const NOTIFICATIONS_KEY = '@upsc_community_notifications_v1';
const BOOKMARKS_KEY = '@upsc_community_bookmarks_v1';

export class CommunityService {
  /**
   * Initialize local stores with realistic UPSC seed data if empty
   */
  private static async ensureInitialized(): Promise<void> {
    const rawPosts = await safeStorage.getItem(COMMUNITY_POSTS_KEY);
    if (!rawPosts) {
      await safeStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(INITIAL_COMMUNITY_POSTS));
    }

    const rawComments = await safeStorage.getItem(COMMUNITY_COMMENTS_KEY);
    if (!rawComments) {
      await safeStorage.setItem(COMMUNITY_COMMENTS_KEY, JSON.stringify(INITIAL_COMMUNITY_COMMENTS));
    }

    const rawExchanges = await safeStorage.getItem(PEER_EXCHANGES_KEY);
    if (!rawExchanges) {
      await safeStorage.setItem(PEER_EXCHANGES_KEY, JSON.stringify(INITIAL_EXCHANGE_REQUESTS));
    }

    const rawRep = await safeStorage.getItem(USER_REPUTATION_KEY);
    if (!rawRep) {
      await safeStorage.setItem(USER_REPUTATION_KEY, JSON.stringify(INITIAL_USER_REPUTATION));
    }

    const rawNotifs = await safeStorage.getItem(NOTIFICATIONS_KEY);
    if (!rawNotifs) {
      await safeStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }

  // ==========================================
  // COMMUNITY FEED & POSTS
  // ==========================================

  static async getPosts(filters?: {
    paperId?: string;
    topic?: string;
    sort?: 'recent' | 'likes' | 'comments' | 'reviews';
    search?: string;
  }): Promise<CommunityPost[]> {
    await this.ensureInitialized();
    const raw = await safeStorage.getItem(COMMUNITY_POSTS_KEY);
    let posts: CommunityPost[] = raw ? JSON.parse(raw) : [...INITIAL_COMMUNITY_POSTS];

    // Read local bookmarks
    const rawBookmarks = await safeStorage.getItem(BOOKMARKS_KEY);
    const bookmarksMap: Record<string, boolean> = rawBookmarks ? JSON.parse(rawBookmarks) : {};

    posts = posts.map((p) => ({
      ...p,
      is_bookmarked_by_me: !!bookmarksMap[p.id],
    }));

    // Filter by paper
    if (filters?.paperId && filters.paperId !== 'ALL') {
      posts = posts.filter((p) => p.paper_id === filters.paperId);
    }

    // Filter by topic
    if (filters?.topic && filters.topic !== 'ALL') {
      posts = posts.filter(
        (p) =>
          p.topic?.toLowerCase().includes(filters.topic!.toLowerCase()) ||
          p.subject_area?.toLowerCase().includes(filters.topic!.toLowerCase())
      );
    }

    // Filter by search
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      posts = posts.filter(
        (p) =>
          p.question_title?.toLowerCase().includes(q) ||
          p.question_text.toLowerCase().includes(q) ||
          p.user_name.toLowerCase().includes(q) ||
          p.topic?.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortMode = filters?.sort || 'recent';
    posts.sort((a, b) => {
      if (sortMode === 'likes') return b.likes_count - a.likes_count;
      if (sortMode === 'comments') return b.comments_count - a.comments_count;
      if (sortMode === 'reviews') return b.peer_reviews_count - a.peer_reviews_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return posts;
  }

  static async getPostById(postId: string): Promise<CommunityPost | null> {
    const posts = await this.getPosts();
    return posts.find((p) => p.id === postId) || null;
  }

  /**
   * Fetch community answers exclusively for a specific question
   */
  static async getPostsForQuestion(
    questionId: string,
    paperId?: string,
    questionText?: string
  ): Promise<CommunityPost[]> {
    const allPosts = await this.getPosts();
    return allPosts.filter((p) => {
      if (p.question_id && p.question_id === questionId) return true;
      if (paperId && p.paper_id === paperId && questionText && p.question_text) {
        const cleanA = questionText.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
        const cleanB = p.question_text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
        if (cleanA.length > 8 && cleanB.length > 8 && (cleanA.includes(cleanB) || cleanB.includes(cleanA))) {
          return true;
        }
      }
      return false;
    });
  }

  static async createPost(params: {
    paper_id: MainsPaperId;
    subject_area?: string;
    topic?: string;
    question_id?: string;
    question_title?: string;
    question_text: string;
    year?: number | string;
    marks: number;
    word_limit: number;
    approach_note?: string;
    is_public: boolean;
    attachments: MainsAttachmentRecord[];
  }): Promise<CommunityPost> {
    await this.ensureInitialized();
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || guestId || 'user_local_aspirant';

    const newPost: CommunityPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: effectiveUserId,
      user_name: 'You (UPSC Aspirant)',
      user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      user_badge: 'Active Writer',
      paper_id: params.paper_id,
      subject_area: params.subject_area || 'General Studies',
      topic: params.topic || 'Mains Practice',
      question_id: params.question_id,
      question_title: params.question_title || params.question_text.slice(0, 60),
      question_text: params.question_text,
      year: params.year || 2026,
      marks: params.marks || 10,
      word_limit: params.word_limit || 150,
      approach_note: params.approach_note,
      is_public: params.is_public,
      attachments: params.attachments,
      likes_count: 0,
      comments_count: 0,
      bookmarks_count: 0,
      is_liked_by_me: false,
      is_bookmarked_by_me: false,
      peer_review_status: 'none',
      peer_reviews_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const raw = await safeStorage.getItem(COMMUNITY_POSTS_KEY);
    const posts: CommunityPost[] = raw ? JSON.parse(raw) : [];
    posts.unshift(newPost);
    await safeStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));

    // Award +10 reputation points for publishing an answer
    await this.incrementReputation(effectiveUserId, 10, 'answer');

    // Async sync to Supabase
    try {
      await supabase.from('community_posts').insert({
        id: newPost.id,
        user_id: newPost.user_id,
        user_name: newPost.user_name,
        user_avatar: newPost.user_avatar,
        user_badge: newPost.user_badge,
        paper_id: newPost.paper_id,
        subject_area: newPost.subject_area,
        topic: newPost.topic,
        question_id: newPost.question_id,
        question_title: newPost.question_title,
        question_text: newPost.question_text,
        year: typeof newPost.year === 'number' ? newPost.year : 2026,
        marks: newPost.marks,
        word_limit: newPost.word_limit,
        approach_note: newPost.approach_note,
        is_public: newPost.is_public,
        attachments: newPost.attachments,
      });
    } catch {}

    return newPost;
  }

  static async deletePost(postId: string): Promise<boolean> {
    const raw = await safeStorage.getItem(COMMUNITY_POSTS_KEY);
    if (!raw) return false;
    const posts: CommunityPost[] = JSON.parse(raw);
    const updated = posts.filter((p) => p.id !== postId);
    await safeStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(updated));

    try {
      await supabase.from('community_posts').delete().eq('id', postId);
    } catch {}
    return true;
  }

  static async toggleLikePost(postId: string): Promise<{ liked: boolean; count: number }> {
    const raw = await safeStorage.getItem(COMMUNITY_POSTS_KEY);
    if (!raw) return { liked: false, count: 0 };
    const posts: CommunityPost[] = JSON.parse(raw);
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return { liked: false, count: 0 };

    const post = posts[postIndex];
    const newLiked = !post.is_liked_by_me;
    const newCount = newLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);

    posts[postIndex] = {
      ...post,
      is_liked_by_me: newLiked,
      likes_count: newCount,
    };

    await safeStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));

    // Send in-app notification if liked
    if (newLiked && post.user_id !== 'user_local_aspirant') {
      await this.createNotification({
        user_id: post.user_id,
        actor_name: 'You (UPSC Aspirant)',
        type: 'like',
        title: 'New Like on your Answer Sheet',
        message: `Your answer to "${post.question_title || 'Question'}" was liked.`,
        entity_id: post.id,
      });
    }

    try {
      await supabase.from('community_posts').update({ likes_count: newCount }).eq('id', postId);
    } catch {}

    return { liked: newLiked, count: newCount };
  }

  static async toggleBookmarkPost(postId: string): Promise<boolean> {
    const raw = await safeStorage.getItem(BOOKMARKS_KEY);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    const newState = !map[postId];
    map[postId] = newState;
    await safeStorage.setItem(BOOKMARKS_KEY, JSON.stringify(map));
    return newState;
  }

  // ==========================================
  // COMMENTS & DISCUSSIONS
  // ==========================================

  static async getComments(postId: string): Promise<CommunityComment[]> {
    await this.ensureInitialized();
    const raw = await safeStorage.getItem(COMMUNITY_COMMENTS_KEY);
    const map: Record<string, CommunityComment[]> = raw ? JSON.parse(raw) : INITIAL_COMMUNITY_COMMENTS;
    return map[postId] || [];
  }

  static async addComment(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<CommunityComment> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || guestId || 'user_local_aspirant';

    const newComment: CommunityComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      post_id: postId,
      user_id: effectiveUserId,
      user_name: 'You (UPSC Aspirant)',
      user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      parent_comment_id: parentCommentId || null,
      content: content.trim(),
      likes_count: 0,
      is_liked_by_me: false,
      created_at: new Date().toISOString(),
    };

    const raw = await safeStorage.getItem(COMMUNITY_COMMENTS_KEY);
    const map: Record<string, CommunityComment[]> = raw ? JSON.parse(raw) : {};
    if (!map[postId]) map[postId] = [];
    map[postId].push(newComment);
    await safeStorage.setItem(COMMUNITY_COMMENTS_KEY, JSON.stringify(map));

    // Update post comments count
    const rawPosts = await safeStorage.getItem(COMMUNITY_POSTS_KEY);
    if (rawPosts) {
      const posts: CommunityPost[] = JSON.parse(rawPosts);
      const pIdx = posts.findIndex((p) => p.id === postId);
      if (pIdx >= 0) {
        posts[pIdx].comments_count += 1;
        await safeStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));

        // Send notification to author
        if (posts[pIdx].user_id !== effectiveUserId) {
          await this.createNotification({
            user_id: posts[pIdx].user_id,
            actor_name: 'You (UPSC Aspirant)',
            type: parentCommentId ? 'reply' : 'comment',
            title: parentCommentId ? 'Reply to your comment' : 'New feedback comment',
            message: `New comment on: "${posts[pIdx].question_title || 'Answer Sheet'}"`,
            entity_id: postId,
          });
        }
      }
    }

    try {
      await supabase.from('community_comments').insert({
        id: newComment.id,
        post_id: newComment.post_id,
        parent_comment_id: newComment.parent_comment_id,
        user_id: newComment.user_id,
        user_name: newComment.user_name,
        user_avatar: newComment.user_avatar,
        content: newComment.content,
      });
    } catch {}

    return newComment;
  }

  static async deleteComment(commentId: string, postId: string): Promise<boolean> {
    const raw = await safeStorage.getItem(COMMUNITY_COMMENTS_KEY);
    if (!raw) return false;
    const map: Record<string, CommunityComment[]> = JSON.parse(raw);
    if (!map[postId]) return false;
    map[postId] = map[postId].filter((c) => c.id !== commentId && c.parent_comment_id !== commentId);
    await safeStorage.setItem(COMMUNITY_COMMENTS_KEY, JSON.stringify(map));

    try {
      await supabase.from('community_comments').delete().eq('id', commentId);
    } catch {}
    return true;
  }

  static async reportContent(params: {
    postId?: string;
    commentId?: string;
    reason: string;
    details?: string;
  }): Promise<void> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    try {
      await supabase.from('community_reports').insert({
        reported_by_user_id: userId || guestId || 'guest',
        post_id: params.postId,
        comment_id: params.commentId,
        reason: params.reason,
        details: params.details,
      });
    } catch {}
  }

  // ==========================================
  // PEER REVIEW EXCHANGE
  // ==========================================

  static async getExchangeRequests(filters?: {
    paperId?: string;
    type?: ExchangeType;
    status?: ExchangeStatus;
    search?: string;
  }): Promise<PeerReviewExchangeRequest[]> {
    await this.ensureInitialized();
    const raw = await safeStorage.getItem(PEER_EXCHANGES_KEY);
    let requests: PeerReviewExchangeRequest[] = raw ? JSON.parse(raw) : [...INITIAL_EXCHANGE_REQUESTS];

    if (filters?.paperId && filters.paperId !== 'ALL') {
      requests = requests.filter((r) => r.paper_id === filters.paperId);
    }

    if (filters?.type) {
      requests = requests.filter((r) => r.exchange_type === filters.type);
    }

    if (filters?.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      requests = requests.filter(
        (r) =>
          r.question_title?.toLowerCase().includes(q) ||
          r.question_text.toLowerCase().includes(q) ||
          r.topic.toLowerCase().includes(q) ||
          r.creator_user_name.toLowerCase().includes(q)
      );
    }

    requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return requests;
  }

  static async getExchangeById(exchangeId: string): Promise<PeerReviewExchangeRequest | null> {
    const list = await this.getExchangeRequests();
    return list.find((e) => e.id === exchangeId) || null;
  }

  static async createExchangeRequest(params: {
    exchange_type: ExchangeType;
    paper_id: MainsPaperId;
    topic: string;
    question_id?: string;
    question_title?: string;
    question_text: string;
    question_marks: number;
    question_word_limit: number;
    deadline_hours: number;
    partner_requirements?: string;
    submission: {
      answer_text?: string;
      attachments: MainsAttachmentRecord[];
    };
  }): Promise<PeerReviewExchangeRequest> {
    await this.ensureInitialized();
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || guestId || 'user_local_aspirant';

    const newRequest: PeerReviewExchangeRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      creator_user_id: effectiveUserId,
      creator_user_name: 'You (UPSC Aspirant)',
      creator_user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      creator_reputation_score: 85,
      exchange_type: params.exchange_type,
      status: 'waiting_for_partner',
      paper_id: params.paper_id,
      topic: params.topic,
      question_id: params.question_id,
      question_title: params.question_title || params.question_text.slice(0, 50),
      question_text: params.question_text,
      question_marks: params.question_marks,
      question_word_limit: params.question_word_limit,
      deadline_hours: params.deadline_hours,
      partner_requirements: params.partner_requirements,
      creator_submission: {
        submission_id: `sub_${Date.now()}`,
        user_id: effectiveUserId,
        user_name: 'You (UPSC Aspirant)',
        answer_text: params.submission.answer_text,
        attachments: params.submission.attachments,
        submitted_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const raw = await safeStorage.getItem(PEER_EXCHANGES_KEY);
    const list: PeerReviewExchangeRequest[] = raw ? JSON.parse(raw) : [];
    list.unshift(newRequest);
    await safeStorage.setItem(PEER_EXCHANGES_KEY, JSON.stringify(list));

    // Sync to Supabase
    try {
      await supabase.from('peer_review_requests').insert({
        id: newRequest.id,
        creator_user_id: newRequest.creator_user_id,
        creator_user_name: newRequest.creator_user_name,
        creator_user_avatar: newRequest.creator_user_avatar,
        creator_reputation_score: newRequest.creator_reputation_score,
        exchange_type: newRequest.exchange_type,
        status: newRequest.status,
        paper_id: newRequest.paper_id,
        topic: newRequest.topic,
        question_id: newRequest.question_id,
        question_title: newRequest.question_title,
        question_text: newRequest.question_text,
        question_marks: newRequest.question_marks,
        question_word_limit: newRequest.question_word_limit,
        deadline_hours: newRequest.deadline_hours,
        partner_requirements: newRequest.partner_requirements,
        creator_submission: newRequest.creator_submission,
      });
    } catch {}

    return newRequest;
  }

  /**
   * Accept an available peer review exchange request
   */
  static async acceptExchangeRequest(exchangeId: string): Promise<PeerReviewExchangeRequest> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || guestId || 'user_local_aspirant';

    const raw = await safeStorage.getItem(PEER_EXCHANGES_KEY);
    const list: PeerReviewExchangeRequest[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((e) => e.id === exchangeId);
    if (idx === -1) throw new Error('Exchange request not found');

    const req = list[idx];

    // Prevent accepting own request
    if (req.creator_user_id === effectiveUserId) {
      throw new Error('You cannot accept your own exchange request.');
    }

    // Ensure it is still waiting for partner
    if (req.status !== 'waiting_for_partner') {
      throw new Error('This review request has already been accepted by another peer.');
    }

    const nextStatus: ExchangeStatus =
      req.exchange_type === 'mutual' ? 'waiting_for_second_answer' : 'review_pending';

    list[idx] = {
      ...req,
      partner_user_id: effectiveUserId,
      partner_user_name: 'You (UPSC Aspirant)',
      partner_user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    await safeStorage.setItem(PEER_EXCHANGES_KEY, JSON.stringify(list));

    // Notify creator
    await this.createNotification({
      user_id: req.creator_user_id,
      actor_name: 'A Peer Aspirant',
      type: 'exchange_accepted',
      title: 'Exchange Request Accepted!',
      message: `A peer accepted your ${req.paper_id} exchange on "${req.topic}".`,
      entity_id: req.id,
    });

    try {
      await supabase
        .from('peer_review_requests')
        .update({
          partner_user_id: effectiveUserId,
          partner_user_name: 'You (UPSC Aspirant)',
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exchangeId);
    } catch {}

    return list[idx];
  }

  /**
   * Submit partner answer for a mutual exchange
   */
  static async submitPartnerAnswer(
    exchangeId: string,
    params: {
      answer_text?: string;
      attachments: MainsAttachmentRecord[];
    }
  ): Promise<PeerReviewExchangeRequest> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || guestId || 'user_local_aspirant';

    const raw = await safeStorage.getItem(PEER_EXCHANGES_KEY);
    const list: PeerReviewExchangeRequest[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((e) => e.id === exchangeId);
    if (idx === -1) throw new Error('Exchange not found');

    const req = list[idx];

    list[idx] = {
      ...req,
      status: 'review_pending',
      partner_submission: {
        submission_id: `sub_partner_${Date.now()}`,
        user_id: effectiveUserId,
        user_name: 'You (UPSC Aspirant)',
        answer_text: params.answer_text,
        attachments: params.attachments,
        submitted_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    await safeStorage.setItem(PEER_EXCHANGES_KEY, JSON.stringify(list));

    // Notify creator that partner answer is in
    await this.createNotification({
      user_id: req.creator_user_id,
      actor_name: 'Your Partner',
      type: 'partner_uploaded',
      title: 'Partner Submitted Answer!',
      message: `Your partner uploaded their answer for "${req.topic}". Ready for review!`,
      entity_id: req.id,
    });

    try {
      await supabase
        .from('peer_review_requests')
        .update({
          status: 'review_pending',
          partner_submission: list[idx].partner_submission,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exchangeId);
    } catch {}

    return list[idx];
  }

  /**
   * Submit peer evaluation for an answer
   */
  static async submitPeerEvaluation(params: {
    exchangeId: string;
    targetSubmissionId: string;
    scores: CriteriaScore[];
    isCaseStudy: boolean;
    caseStudyCriteria?: any;
    strengths: string[];
    weaknesses: string[];
    missingPoints: string[];
    pageComments: { page_number: number; note: string }[];
    overallFeedback: string;
  }): Promise<PeerReviewExchangeRequest> {
    const { userId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || guestId || 'user_local_aspirant';

    const raw = await safeStorage.getItem(PEER_EXCHANGES_KEY);
    const list: PeerReviewExchangeRequest[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((e) => e.id === params.exchangeId);
    if (idx === -1) throw new Error('Exchange not found');

    const req = list[idx];
    const totalScore = params.scores.reduce((sum, s) => sum + s.marks_awarded, 0);

    const evaluation: PeerEvaluationRecord = {
      id: `peereval_${Date.now()}`,
      exchange_id: params.exchangeId,
      reviewer_user_id: effectiveUserId,
      reviewer_user_name: 'You (UPSC Aspirant)',
      reviewer_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      target_submission_id: params.targetSubmissionId,
      total_score: totalScore,
      max_score: req.question_marks,
      is_case_study: params.isCaseStudy,
      scores: params.scores,
      case_study_criteria: params.caseStudyCriteria,
      strengths: params.strengths,
      weaknesses: params.weaknesses,
      missing_points: params.missingPoints,
      page_comments: params.pageComments,
      overall_feedback: params.overallFeedback,
      submitted_at: new Date().toISOString(),
    };

    const isReviewingCreator = params.targetSubmissionId === req.creator_submission.submission_id;

    if (isReviewingCreator) {
      list[idx].partner_review_of_creator = evaluation;
    } else {
      list[idx].creator_review_of_partner = evaluation;
    }

    // Determine final status
    let nextStatus: ExchangeStatus = req.status;
    if (req.exchange_type === 'mutual') {
      if (list[idx].creator_review_of_partner && list[idx].partner_review_of_creator) {
        nextStatus = 'completed';
      } else {
        nextStatus = 'one_review_completed';
      }
    } else {
      nextStatus = 'completed';
    }

    list[idx].status = nextStatus;
    list[idx].updated_at = new Date().toISOString();

    await safeStorage.setItem(PEER_EXCHANGES_KEY, JSON.stringify(list));

    // Award +25 reputation points for completing a high-quality peer review
    await this.incrementReputation(effectiveUserId, 25, 'review');

    // Notify the recipient
    const recipientUserId = isReviewingCreator ? req.creator_user_id : req.partner_user_id;
    if (recipientUserId) {
      await this.createNotification({
        user_id: recipientUserId,
        actor_name: 'Your Peer Reviewer',
        type: nextStatus === 'completed' ? 'exchange_completed' : 'review_completed',
        title: nextStatus === 'completed' ? 'Exchange Fully Completed! 🎉' : 'Peer Review Received!',
        message: `Your answer for "${req.topic}" received evaluation (${totalScore}/${req.question_marks} marks).`,
        entity_id: req.id,
      });
    }

    return list[idx];
  }

  /**
   * AI-Assisted suggestions for peer reviewers (extract dimensions, suggest missing points)
   */
  static async getAISuggestionsForPeerReview(params: {
    questionText: string;
    answerText?: string;
    isCaseStudy?: boolean;
    marks: number;
  }): Promise<{
    suggestedStrengths: string[];
    suggestedWeaknesses: string[];
    suggestedMissingPoints: string[];
    suggestedRubricBreakdown: { criteria: string; hint: string }[];
  }> {
    // Fast deterministic fallback aligned with UPSC Mains standards
    if (params.isCaseStudy) {
      return {
        suggestedStrengths: [
          'Direct identification of primary and secondary stakeholders.',
          'Structured ethical matrix examining duty vs public consequence.',
          'Pragmatic administrative options with short-term and long-term implications.',
        ],
        suggestedWeaknesses: [
          'Verify if constitutional values (Preamble, Art 14/21) were cited.',
          'Check if decision relies solely on moral idealism without procedural feasibility.',
        ],
        suggestedMissingPoints: [
          'Second ARC 4th Report on Ethics in Governance recommendations.',
          'Nolan Committee Principles (Integrity, Objectivity, Accountability).',
          'Whistleblower Protection Act provisions where relevant.',
          'Preventive vigilance systems rather than punitive measures alone.',
        ],
        suggestedRubricBreakdown: [
          { criteria: 'Stakeholder Matrix', hint: 'Did they include vulnerable citizens and institutions?' },
          { criteria: 'Ethical Dilemmas', hint: 'Did they identify conflict between personal duty and law?' },
          { criteria: 'Administrative Feasibility', hint: 'Is the solution implementable within rules?' },
        ],
      };
    }

    return {
      suggestedStrengths: [
        'Clear introductory contextualization defining key core concepts.',
        'Use of structured subheadings that directly mirror the demand of the question.',
      ],
      suggestedWeaknesses: [
        'Check for multi-dimensional analysis (PESTLE framework: Political, Economic, Social, Tech, Legal, Environmental).',
        'Check whether both sides of the argument were critically evaluated.',
      ],
      suggestedMissingPoints: [
        'Relevant Constitutional Articles or Statutory Provisions.',
        'Official Government Committee / Law Commission / NITI Aayog reports.',
        'Forward-looking, balanced conclusion with visionary perspective.',
      ],
      suggestedRubricBreakdown: [
        { criteria: 'Introduction', hint: 'Clear definition or current context within 20-30 words.' },
        { criteria: 'Content & Dimensions', hint: 'Covered constitutional, socio-economic and global aspects.' },
        { criteria: 'Conclusion', hint: 'Constructive way forward or SDG alignment.' },
      ],
    };
  }

  // ==========================================
  // USER REPUTATION & ACTIVITY
  // ==========================================

  static async getUserReputation(userId?: string): Promise<UserReputation> {
    await this.ensureInitialized();
    const raw = await safeStorage.getItem(USER_REPUTATION_KEY);
    return raw ? JSON.parse(raw) : INITIAL_USER_REPUTATION;
  }

  private static async incrementReputation(
    userId: string,
    points: number,
    type: 'answer' | 'review' | 'helpful'
  ): Promise<void> {
    const raw = await safeStorage.getItem(USER_REPUTATION_KEY);
    const rep: UserReputation = raw ? JSON.parse(raw) : { ...INITIAL_USER_REPUTATION };

    rep.reputation_score += points;
    if (type === 'answer') rep.total_answers_published += 1;
    if (type === 'review') rep.total_reviews_completed += 1;
    if (type === 'helpful') rep.helpful_feedback_count += 1;

    // Badges calculation
    const badges = new Set(rep.badges);
    if (rep.total_answers_published >= 3) badges.add('Active Writer');
    if (rep.total_reviews_completed >= 3) badges.add('Helpful Reviewer');
    if (rep.reputation_score >= 100) badges.add('Consistent Contributor');
    if (rep.total_reviews_completed >= 8) badges.add('Top Evaluator');

    rep.badges = Array.from(badges);
    await safeStorage.setItem(USER_REPUTATION_KEY, JSON.stringify(rep));
  }

  static async getUserActivity(userId?: string): Promise<{
    myPosts: CommunityPost[];
    myReviews: PeerEvaluationRecord[];
    receivedFeedback: PeerEvaluationRecord[];
    activeExchanges: PeerReviewExchangeRequest[];
    savedPosts: CommunityPost[];
  }> {
    const { userId: currentUserId, guestId } = await getCurrentUserIdOrGuestId();
    const effectiveUserId = userId || currentUserId || guestId || 'user_local_aspirant';

    const allPosts = await this.getPosts();
    const myPosts = allPosts.filter((p) => p.user_id === effectiveUserId);
    const savedPosts = allPosts.filter((p) => p.is_bookmarked_by_me);

    const allExchanges = await this.getExchangeRequests();
    const activeExchanges = allExchanges.filter(
      (e) =>
        (e.creator_user_id === effectiveUserId || e.partner_user_id === effectiveUserId) &&
        e.status !== 'cancelled'
    );

    const myReviews: PeerEvaluationRecord[] = [];
    const receivedFeedback: PeerEvaluationRecord[] = [];

    allExchanges.forEach((e) => {
      if (e.creator_review_of_partner) {
        if (e.creator_user_id === effectiveUserId) myReviews.push(e.creator_review_of_partner);
        if (e.partner_user_id === effectiveUserId) receivedFeedback.push(e.creator_review_of_partner);
      }
      if (e.partner_review_of_creator) {
        if (e.partner_user_id === effectiveUserId) myReviews.push(e.partner_review_of_creator);
        if (e.creator_user_id === effectiveUserId) receivedFeedback.push(e.partner_review_of_creator);
      }
    });

    return {
      myPosts,
      myReviews,
      receivedFeedback,
      activeExchanges,
      savedPosts,
    };
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  static async getNotifications(): Promise<CommunityNotification[]> {
    await this.ensureInitialized();
    const raw = await safeStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  }

  static async markNotificationRead(id: string): Promise<void> {
    const raw = await safeStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return;
    const notifs: CommunityNotification[] = JSON.parse(raw);
    const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    await safeStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  }

  static async markAllNotificationsRead(): Promise<void> {
    const raw = await safeStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return;
    const notifs: CommunityNotification[] = JSON.parse(raw);
    const updated = notifs.map((n) => ({ ...n, is_read: true }));
    await safeStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  }

  static async createNotification(
    params: Omit<CommunityNotification, 'id' | 'created_at' | 'is_read'>
  ): Promise<void> {
    const raw = await safeStorage.getItem(NOTIFICATIONS_KEY);
    const notifs: CommunityNotification[] = raw ? JSON.parse(raw) : [];
    const newNotif: CommunityNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      ...params,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    await safeStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }
}

