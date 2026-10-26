export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface YearTrend {
  year: number;
  count: number;
}

export interface PYQQuestion {
  id: string;
  year: number;
  subjectId: string;
  chapterId: string;
  chapterName: string;
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
}

export interface ChapterShortNoteItem {
  heading: string;
  points: string[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  code: string;
  weightagePercent: number; // e.g. 18.2%
  totalQuestions10Yrs: number; // e.g. 34 questions
  isHighYield: boolean;
  yearTrends: YearTrend[]; // 2015 - 2024
  trendSummary: string;
  recurringTopics: string[];
  shortNotes?: ChapterShortNoteItem[];
  pyqs: PYQQuestion[];
}

export interface Subject {
  id: string;
  title: string;
  shortTitle: string;
  iconName: string; // Ionicons name
  accentColor: string; // e.g. '#8C65F7'
  lightBg: string; // e.g. '#FFEDE0'
  weightageInGS1: number; // e.g. 15.5%
  totalQuestions10Yrs: number; // e.g. 152
  masteredPercent: number; // e.g. 74%
  chapters: Chapter[];
  paper?: 'GS1' | 'GS2';
}

export interface QuizConfig {
  title: string;
  subjectId?: string; // empty means all subjects
  chapterId?: string;
  questionCount: number;
  durationMinutes: number;
  yearRange: 'all' | 'recent5'; // all (2015-2024) or recent5 (2020-2024)
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
  score: number; // +2 for correct, -0.66 for incorrect
  maxScore: number;
  accuracy: number;
  timeTakenSeconds: number;
  answers: Record<string, UserAnswer>;
}
