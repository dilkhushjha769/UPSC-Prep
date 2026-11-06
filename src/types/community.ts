import { MainsAttachmentRecord, MainsPaperId } from './mains';

export type ExchangeType = 'mutual' | 'review_only' | 'open_review';

export type ExchangeStatus =
  | 'waiting_for_partner'
  | 'partner_accepted'
  | 'waiting_for_second_answer'
  | 'review_pending'
  | 'one_review_completed'
  | 'completed'
  | 'cancelled';

export interface CommunityPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_badge?: string;
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
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  is_liked_by_me?: boolean;
  is_bookmarked_by_me?: boolean;
  peer_review_status?: 'none' | 'requested' | 'reviewed' | 'exchange_active';
  peer_reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  parent_comment_id?: string | null;
  content: string;
  likes_count: number;
  is_liked_by_me?: boolean;
  created_at: string;
}

export interface CriteriaScore {
  criteria_name: string;
  marks_awarded: number;
  max_marks: number;
  comment?: string;
}

export interface PeerEvaluationRecord {
  id: string;
  exchange_id: string;
  reviewer_user_id: string;
  reviewer_user_name: string;
  reviewer_avatar?: string;
  target_submission_id: string;
  total_score: number;
  max_score: number;
  is_case_study: boolean;
  scores: CriteriaScore[];
  case_study_criteria?: {
    stakeholders_identified: string;
    ethical_dilemmas: string;
    options_analyzed: string;
    ethical_principles: string;
    practical_solution: string;
    decision_justification: string;
  };
  strengths: string[];
  weaknesses: string[];
  missing_points: string[];
  page_comments: { page_number: number; note: string }[];
  overall_feedback: string;
  submitted_at: string;
}

export interface ExchangeSubmission {
  submission_id: string;
  user_id: string;
  user_name: string;
  answer_text?: string;
  attachments: MainsAttachmentRecord[];
  submitted_at: string;
}

export interface PeerReviewExchangeRequest {
  id: string;
  creator_user_id: string;
  creator_user_name: string;
  creator_user_avatar?: string;
  creator_reputation_score?: number;
  exchange_type: ExchangeType;
  status: ExchangeStatus;
  paper_id: MainsPaperId;
  topic: string;
  question_id?: string;
  question_title?: string;
  question_text: string;
  question_marks: number;
  question_word_limit: number;
  deadline_hours: number;
  partner_requirements?: string;
  creator_submission: ExchangeSubmission;
  partner_user_id?: string;
  partner_user_name?: string;
  partner_user_avatar?: string;
  partner_submission?: ExchangeSubmission;
  creator_review_of_partner?: PeerEvaluationRecord;
  partner_review_of_creator?: PeerEvaluationRecord;
  created_at: string;
  updated_at: string;
}

export type ReputationBadge =
  | 'Active Writer'
  | 'Helpful Reviewer'
  | 'Consistent Contributor'
  | 'Top Evaluator';

export interface UserReputation {
  user_id: string;
  reputation_score: number;
  total_reviews_completed: number;
  total_answers_published: number;
  helpful_feedback_count: number;
  badges: ReputationBadge[];
}

export type CommunityNotificationType =
  | 'like'
  | 'comment'
  | 'reply'
  | 'exchange_accepted'
  | 'partner_uploaded'
  | 'review_pending'
  | 'review_completed'
  | 'exchange_completed';

export interface CommunityNotification {
  id: string;
  user_id: string;
  actor_name: string;
  type: CommunityNotificationType;
  title: string;
  message: string;
  entity_id: string;
  is_read: boolean;
  created_at: string;
}

