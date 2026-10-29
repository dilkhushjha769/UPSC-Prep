export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type ConfidenceBand = 'High' | 'Medium' | 'Low';
export type ValidationStatus = 'verified' | 'verified_cross_tagged' | 'needs_review';

export interface YearTrend {
  year: number;
  count: number;
}

export interface PYQQuestion {
  id: string;
  year: number;
  paper?: 'GS1' | 'GS2';
  questionNumber?: number;
  subjectId: string;
  subjectName?: string;
  chapterId: string;
  chapterName: string;
  subtopicId?: string;
  subtopicName?: string;
  rawTopic?: string;
  passageText?: string | null;
  questionText: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: {
    officialAnswer: string;
    coreConcept: string;
    detailedAnalysis: string[];
    eliminationTechnique?: string;
    upscTrendNote?: string;
  };
  difficulty: DifficultyLevel;
  tags: string[];
  secondaryTags?: string[];
  confidence?: number;
  confidenceBand?: ConfidenceBand;
  classificationRationale?: string;
  validationStatus?: ValidationStatus;
  validationNotes?: string | null;
  verificationNote?: string | null;
}

export interface ChapterShortNoteItem {
  heading: string;
  points: string[];
}

export interface SubtopicSummary {
  id: string;
  name: string;
  count: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  code: string;
  weightagePercent: number;
  totalQuestions10Yrs: number;
  isHighYield: boolean;
  yearTrends: YearTrend[];
  trendSummary: string;
  recurringTopics: string[];
  subtopics?: SubtopicSummary[];
  shortNotes?: ChapterShortNoteItem[];
  pyqs: PYQQuestion[];
}

export interface Subject {
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  accentColor: string;
  lightBg: string;
  weightageInGS1: number;
  totalQuestions10Yrs: number;
  masteredPercent: number;
  chapters: Chapter[];
  paper?: 'GS1' | 'GS2';
}

export interface QuizConfig {
  title: string;
  subjectId?: string;
  chapterId?: string;
  questionCount: number;
  durationMinutes: number;
  yearRange: 'all' | 'recent5';
  difficulty: 'all' | 'medium-hard';
  negativeMarking: boolean;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
}

export interface QuizResult {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  timeTakenSeconds: number;
  answers: Record<string, UserAnswer>;
}
