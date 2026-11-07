/**
 * UPSC Mains Answer Writing & Evaluation System - Type Definitions
 */

export type MainsPaperId = 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'ESSAY' | 'OPTIONAL';

export type MainsPracticeMode = 'topic' | 'paper' | 'section' | 'year' | 'random';

export interface MainsRawQuestion {
  question_number: number | string;
  id: string;
  text_english?: string;
  text_hindi?: string;
  marks: number;
  word_limit?: number | string;
  subject_area?: string;
  topic?: string;
  title?: string;
  scenario_english?: string;
  scenario_hindi?: string;
  sub_questions?: string[];
  sub_questions_hindi?: string[];
}

export interface MainsRawSection {
  section_name: string;
  section_code: string;
  marks_per_question?: number;
  required_count?: number;
  word_limit?: number | string;
  questions: MainsRawQuestion[];
}

export interface MainsRawPaperFile {
  exam: string;
  year: number;
  paper: string;
  paper_code: string;
  subject: string;
  total_marks: number;
  time_allowed_hours: number;
  instructions?: string[];
  sections?: MainsRawSection[];
  questions?: MainsRawQuestion[];
}

export interface MainsQuestionRecord {
  id: string;
  paper_id: MainsPaperId;
  paper_title: string;
  paper_code: string;
  year: number;
  exam: string;
  section_name: string;
  section_code: string;
  question_number: string;
  text_english: string;
  text_hindi?: string;
  marks: number;
  word_limit: number;
  subject_area: string;
  topic: string;
  is_case_study: boolean;
  title?: string;
  scenario_english?: string;
  scenario_hindi?: string;
  sub_questions?: string[];
  sub_questions_hindi?: string[];
}

export interface MainsPaperSummary {
  paper_id: MainsPaperId;
  title: string;
  subject: string;
  year: number;
  paper_code: string;
  total_questions: number;
  total_marks: number;
  available: boolean;
  sections: { name: string; code: string; count: number }[];
  subject_areas: string[];
  topics: string[];
}

export type MainsSubmissionMode = 'typed' | 'handwritten';
export type MainsEvaluationStatus = 'draft' | 'submitted' | 'evaluating' | 'evaluated' | 'failed';

export interface MainsAttachmentRecord {
  id: string;
  submission_id?: string;
  page_number: number;
  file_uri: string;
  file_type: 'image/jpeg' | 'image/png' | 'application/pdf' | string;
  file_name: string;
  file_size?: number;
}

export interface EvaluationParameterScore {
  parameter: string;
  max_score: number;
  score: number;
  feedback: string;
}

export interface CaseStudyEvaluationDetail {
  stakeholders_identified: string[];
  ethical_issues_and_dilemmas: string[];
  values_involved: string[];
  options_analyzed: {
    option: string;
    pros: string;
    cons: string;
  }[];
  ethical_principles_applied: string[];
  practicality_and_administrative_feasibility: string;
  short_term_and_long_term_consequences: string;
  final_decision_and_justification: string;
  sub_question_scores?: {
    sub_question: string;
    marks_awarded: number;
    max_marks: number;
    comment: string;
  }[];
}

export interface MainsEvaluationRecord {
  id: string;
  submission_id: string;
  question_id: string;
  user_id: string;
  total_score: number;
  max_score: number;
  score_percentage: number;
  is_case_study: boolean;
  marks_explanation: string;
  parameters: EvaluationParameterScore[];
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  model_answer: string;
  model_answer_word_count: number;
  missing_points: string[];
  examiners_remarks: string;
  case_study_details?: CaseStudyEvaluationDetail;
  evaluated_at: string;
  disclaimer: string;
}

export interface MainsSubmissionRecord {
  id: string;
  user_id: string;
  guest_id: string;
  question_id: string;
  paper_id: MainsPaperId;
  question_number: string;
  question_title: string;
  attempt_number: number;
  submission_mode: MainsSubmissionMode;
  answer_text: string;
  ocr_extracted_text?: string;
  word_count: number;
  evaluation_status: MainsEvaluationStatus;
  marks_awarded?: number;
  max_marks: number;
  evaluation_id?: string;
  evaluation?: MainsEvaluationRecord;
  attachments: MainsAttachmentRecord[];
  submitted_at: string;
  updated_at: string;
}

export interface MainsDraftRecord {
  question_id: string;
  submission_mode: MainsSubmissionMode;
  answer_text: string;
  attachments: MainsAttachmentRecord[];
  word_count: number;
  last_saved_at: string;
}

export interface MainsUserStats {
  total_questions_available: number;
  total_attempted: number;
  total_pending: number;
  average_evaluated_marks_pct: number;
  paper_wise_stats: Record<
    string,
    {
      total_questions: number;
      attempted: number;
      avg_marks: number;
      avg_pct: number;
    }
  >;
  topic_wise_stats: Record<
    string,
    {
      topic: string;
      attempted: number;
      avg_score: number;
      max_score: number;
      avg_pct: number;
    }
  >;
  strongest_topics: { topic: string; score_pct: number }[];
  weakest_topics: { topic: string; score_pct: number }[];
  writing_frequency: number; // answers written in last 7 days
  word_limit_compliance_pct: number;
  recent_submissions: MainsSubmissionRecord[];
}

