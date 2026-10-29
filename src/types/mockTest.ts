export type PaperType = 'GS1' | 'CSAT' | 'ALL';
export type TestMode = 'full' | 'practice';
export type QuestionOrderMode = 'random' | 'exam_order' | 'unattempted';
export type MockTestStatus = 'in_progress' | 'submitted' | 'abandoned';

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
}

export interface QuestionRecord {
  id: string;
  exam: string;
  year: number;
  paper: string;
  paper_type: PaperType;
  question_number: number;
  question_text_en: string;
  question_text_hi: string | null;
  statements: string[];
  table_data: any | null;
  passage_id: string | null;
  passage_text: string | null;
  options: QuestionOption[];
  correct_answer: string;
  explanation_en: string | null;
  explanation_hi: string | null;
  subject_id?: string;
  subject: string;
  topic_id?: string;
  topic: string;
  subtopic_id?: string;
  subtopic?: string;
  raw_topic?: string;
  secondary_tags?: string[];
  classification_confidence?: number;
  confidence_band?: 'High' | 'Medium' | 'Low';
  classification_rationale?: string;
  validation_status?: 'verified' | 'verified_cross_tagged' | 'needs_review';
  validation_notes?: string | null;
  question_image_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MockTestFilterConfig {
  paperType: PaperType;
  selectedYears: number[]; // empty = all years
  selectedSubjects: string[]; // empty = all subjects
  selectedTopics: string[]; // empty = all topics
  questionCount: number;
  testMode: TestMode;
  orderMode: QuestionOrderMode;
  marksPerCorrect: number;
  negativeMarks: number;
  timeLimitMinutes?: number;
  revealAnswersImmediately?: boolean; // for practice mode
}

export interface MockTestRecord {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  test_title: string;
  exam: string;
  paper_type: PaperType;
  selected_years: number[];
  selected_subjects: string[];
  selected_topics: string[];
  test_mode: TestMode;
  question_count: number;
  marks_per_correct: number;
  negative_marks: number;
  time_limit_minutes: number | null;
  start_time: string;
  submission_time: string | null;
  status: MockTestStatus;
  score: number;
  total_marks: number;
  accuracy: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  time_spent_seconds: number;
  subject_stats: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; marks: number }>;
  topic_stats: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; marks: number }>;
  created_at: string;
  updated_at: string;
}

export interface MockTestQuestionRecord {
  id: string;
  mock_test_id: string;
  question_id: string;
  position: number;
  snapshot: QuestionRecord;
}

export interface MockTestResponseRecord {
  id?: string;
  mock_test_id: string;
  question_id: string;
  selected_answer: string | null;
  is_marked_for_review: boolean;
  answer_status: 'unattempted' | 'answered' | 'marked_for_review' | 'answered_and_marked';
  is_correct?: boolean | null;
  time_spent_seconds: number;
  last_updated?: string;
}

export interface ActiveTestState {
  test: MockTestRecord;
  questions: MockTestQuestionRecord[];
  responses: Record<string, MockTestResponseRecord>; // keyed by question_id
}

export interface MockTestSummaryStats {
  availableQuestions: number;
  completedTests: number;
  averageScore: number;
  averageAccuracy: number;
}

export interface AvailableFiltersData {
  years: number[];
  subjects: { name: string; count: number; paperType: string }[];
  topicsBySubject: Record<string, string[]>;
}
