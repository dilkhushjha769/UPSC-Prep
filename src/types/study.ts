export type UPSCSubject =
  | 'Polity'
  | 'History'
  | 'Modern History'
  | 'Ancient & Medieval'
  | 'Geography'
  | 'Economy'
  | 'Environment'
  | 'Environment & Ecology'
  | 'Science & Technology'
  | 'Current Affairs'
  | 'CSAT'
  | 'Ethics (GS 4)'
  | 'Essay'
  | 'Mains Answer Writing'
  | 'Optional Subject'
  | 'Custom Subject';

export interface StudySession {
  id: string;
  userId: string;
  subject: UPSCSubject;
  customSubjectName?: string;
  topic: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  elapsedSeconds?: number;
  pausedSeconds?: number;
  distractionCount?: number;
  status?: 'completed' | 'interrupted';
  date: string; // YYYY-MM-DD
  notes?: string;
  completed: boolean;
}

export interface StudyTask {
  id: string;
  subject: UPSCSubject;
  topic: string;
  estimatedMinutes: number;
  priority: 'High' | 'Medium' | 'Normal';
  completed: boolean;
  notes?: string;
  date: string; // YYYY-MM-DD
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  weeklyConsistencyPercent: number;
  lastQualifyingDate: string | null;
  qualifyingMinutesThreshold: number; // e.g., 60 mins
}

export type PreparationStage =
  | 'Foundation'
  | 'Prelims Intensive'
  | 'Mains Focus'
  | 'Interview / Personality Test';

export type ExamMedium = 'English' | 'Hindi';

export type SocialCategory = 'General' | 'EWS' | 'OBC' | 'SC' | 'ST';

export interface UserStudyConfig {
  aspirantName: string;
  targetExamYear: number;
  targetExamDate: string; // YYYY-MM-DD
  examPhase: string; // e.g. "UPSC CSE 2027 • Prelims & Mains"
  dailyGoalMinutes: number; // e.g. 360 (6 hours)
  qualifyingStreakMinutes: number; // e.g. 60 mins
  gsTargetMinutes: number; // e.g. 210 (3.5 hours)
  caTargetMinutes: number; // e.g. 90 (1.5 hours)
  answerTargetMinutes: number; // e.g. 60 (1 hour)

  // Aspirant Profile & Personal Details
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  gender?: string;
  avatarUri?: string;
  avatarScale?: number;
  avatarOffsetX?: number;
  avatarOffsetY?: number;
  residentialStatus?: string;
  profession?: string;
  organisationName?: string;
  fatherName?: string;
  place?: string;
  optionalSubject?: string;
  medium?: ExamMedium;
  dateOfBirth?: string; // YYYY-MM-DD
  category?: SocialCategory;
  preparationStage?: PreparationStage;
  syllabusCompletionPercent?: number; // 0 - 100
  mockTestsAttempted?: number;
  mockAverageScore?: number;
}

export interface DayStudySummary {
  dayName: string; // e.g. "Mon"
  fullDayName: string; // e.g. "Monday"
  dateStr: string; // YYYY-MM-DD
  dayNumber: number; // 1-31
  monthName: string; // "Oct"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean; // met qualifying study threshold
  totalMinutes: number;
  targetMinutes: number;
  progressPercent: number;
}

export interface UPSCPreparationMetrics {
  gsCompletedMinutes: number;
  gsTargetMinutes: number;
  gsTopicsCount: number;

  caCompletedMinutes: number;
  caTargetMinutes: number;
  caArticlesReviewed: number;

  mcqsAttempted: number;
  mcqsCorrect: number;
  mainsAnswersWritten: number;
}
