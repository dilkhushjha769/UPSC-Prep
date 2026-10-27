import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StudySession,
  StudyTask,
  UPSCPreparationMetrics,
  UserStudyConfig,
} from '@/types/study';
import {
  addDays,
  getLocalDateString,
} from './streakCalculator';
import { ActiveFocusSession } from './focusTimerService';

const STORAGE_KEYS = {
  SESSIONS: '@upsc_study_sessions_v1',
  TASKS: '@upsc_study_tasks_v1',
  CONFIG: '@upsc_study_config_v1',
  METRICS: '@upsc_study_metrics_v1',
  ACTIVE_FOCUS_SESSION: '@upsc_active_focus_session_v1',
};

export const DEFAULT_CONFIG: UserStudyConfig = {
  aspirantName: 'Dipanker Biswas',
  firstName: 'Dipanker',
  lastName: 'Biswas',
  email: 'dipanker.biswas@gmail.com',
  mobile: '+91-9123456780',
  gender: 'Male',
  residentialStatus: 'Indian',
  profession: 'Self Employeed',
  organisationName: 'Zendot',
  fatherName: 'Dipanker',
  targetExamYear: 2027,
  targetExamDate: '2027-05-23', // Target UPSC Prelims 2027
  examPhase: 'UPSC CSE 2027 • Prelims & Mains',
  dailyGoalMinutes: 360, // 6 hours
  qualifyingStreakMinutes: 60, // 60 minutes minimum for qualifying streak day
  gsTargetMinutes: 210, // 3.5 hours
  caTargetMinutes: 90, // 1.5 hours
  answerTargetMinutes: 60, // 1 hour
  place: 'New Delhi, India',
  optionalSubject: 'Geography',
  medium: 'English',
  dateOfBirth: '1990-01-01',
  category: 'General',
  preparationStage: 'Prelims Intensive',
  syllabusCompletionPercent: 68,
  mockTestsAttempted: 18,
  mockAverageScore: 108.5,
  notificationPreferences: {
    studyReminders: true,
    streakAlerts: true,
    currentAffairsDigest: true,
    mockTestAnnouncements: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
  },
};

export const DEFAULT_METRICS: UPSCPreparationMetrics = {
  gsCompletedMinutes: 195,
  gsTargetMinutes: 210,
  gsTopicsCount: 4,

  caCompletedMinutes: 75,
  caTargetMinutes: 90,
  caArticlesReviewed: 3,

  mcqsAttempted: 35,
  mcqsCorrect: 29,
  mainsAnswersWritten: 2,
};

/**
 * Creates seed study sessions for the past 7 days to provide a rich, authentic first-run experience
 */
export function generateSeedSessions(todayStr: string = getLocalDateString()): StudySession[] {
  const sessions: StudySession[] = [];
  const subjects = [
    { subject: 'Polity' as const, topic: 'Fundamental Rights (Articles 14-21) Revision', duration: 120 },
    { subject: 'Current Affairs' as const, topic: 'The Hindu & Indian Express Editorial Analysis', duration: 75 },
    { subject: 'Modern History' as const, topic: 'Revolt of 1857 & Civil Rebellions', duration: 110 },
    { subject: 'Geography' as const, topic: 'Monsoon System & El Niño Phenomenon', duration: 90 },
    { subject: 'CSAT' as const, topic: 'Number System & Reading Comprehension', duration: 60 },
    { subject: 'Ethics (GS 4)' as const, topic: 'Probity in Governance Case Studies', duration: 80 },
    { subject: 'Economy' as const, topic: 'Monetary Policy Committee & Inflation Targeting', duration: 105 },
    { subject: 'Environment & Ecology' as const, topic: 'Biodiversity Hotspots & Ramsar Sites in India', duration: 95 },
  ];

  // Seed previous 6 days with qualifying study sessions
  for (let i = 6; i >= 1; i--) {
    const dStr = addDays(todayStr, -i);
    const item1 = subjects[(i * 2) % subjects.length];
    const item2 = subjects[(i * 2 + 1) % subjects.length];

    sessions.push({
      id: `seed-session-${dStr}-1`,
      userId: 'user_primary',
      subject: item1.subject,
      topic: item1.topic,
      startTime: `${dStr}T09:30:00.000Z`,
      endTime: `${dStr}T11:30:00.000Z`,
      durationMinutes: item1.duration,
      date: dStr,
      notes: 'Focused revision with active recall and pyq analysis.',
      completed: true,
    });

    sessions.push({
      id: `seed-session-${dStr}-2`,
      userId: 'user_primary',
      subject: item2.subject,
      topic: item2.topic,
      startTime: `${dStr}T15:00:00.000Z`,
      endTime: `${dStr}T16:30:00.000Z`,
      durationMinutes: item2.duration,
      date: dStr,
      notes: 'Reviewed previous year prelims questions & mains syllabus pointers.',
      completed: true,
    });
  }

  // Today: add initial morning sessions totaling 200 minutes (3h 20m out of 6h)
  sessions.push({
    id: `seed-session-${todayStr}-1`,
    userId: 'user_primary',
    subject: 'Polity',
    topic: 'Directive Principles of State Policy & Basic Structure Doctrine',
    startTime: `${todayStr}T08:00:00.000Z`,
    endTime: `${todayStr}T10:05:00.000Z`,
    durationMinutes: 125,
    date: todayStr,
    notes: 'Completed Laxmikanth chapters 8 & 9. Mapped with Kesavananda Bharati verdict.',
    completed: true,
  });

  sessions.push({
    id: `seed-session-${todayStr}-2`,
    userId: 'user_primary',
    subject: 'Current Affairs',
    topic: 'Daily Editorial Insights — G20 outcomes & RBI Financial Stability Report',
    startTime: `${todayStr}T11:00:00.000Z`,
    endTime: `${todayStr}T12:15:00.000Z`,
    durationMinutes: 75,
    date: todayStr,
    notes: 'Made 2 pages of crisp keyword notes for GS-3 economy.',
    completed: true,
  });

  return sessions;
}

/**
 * Creates seed study tasks for today's plan
 */
export function generateSeedTasks(todayStr: string = getLocalDateString()): StudyTask[] {
  return [
    {
      id: 'task-1',
      subject: 'Polity',
      topic: 'Social Studies & Constitutional Framework',
      estimatedMinutes: 90,
      priority: 'High',
      completed: true,
      status: 'completed',
      startTime: '08:30 AM',
      endTime: '10:00 AM',
      subtitle: 'B3, Room 124 • Fundamental Rights & Articles 14-32',
      mentor: 'Mrs. Goodman',
      colorTag: 'blue',
      notes: 'Revised Articles 14 to 32 and key constitutional benchmarks.',
      date: todayStr,
    },
    {
      id: 'task-2',
      subject: 'Current Affairs',
      topic: 'English Literature & Editorial Analysis',
      estimatedMinutes: 90,
      priority: 'High',
      completed: false,
      status: 'in_progress',
      startTime: '10:30 AM',
      endTime: '12:00 PM',
      subtitle: 'B2, Room 158 • The Hindu & Express Editorials',
      mentor: 'Mrs. Melton',
      colorTag: 'green', // Exact green card from reference image!
      notes: 'Covered national geopolitics & economic editorial review.',
      date: todayStr,
    },
    {
      id: 'task-3',
      subject: 'Science & Technology',
      topic: 'Computer Science & Emerging AI Technologies',
      estimatedMinutes: 90,
      priority: 'Medium',
      completed: false,
      status: 'todo',
      startTime: '12:15 PM',
      endTime: '01:45 PM',
      subtitle: 'B3, Room 310 • Quantum & Space Tech Module',
      mentor: 'Mr. Hodge',
      colorTag: 'yellow',
      notes: 'Spectrum notes on quantum computing & AI governance.',
      date: todayStr,
    },
    {
      id: 'task-4',
      subject: 'Ethics (GS 4)',
      topic: 'Case Studies & Administrative Ethics',
      estimatedMinutes: 60,
      priority: 'Normal',
      completed: false,
      status: 'todo',
      startTime: '03:00 PM',
      endTime: '04:30 PM',
      subtitle: 'Library Hall • 2 Case Studies on Conflict of Interest',
      mentor: 'Self-Study Masterclass',
      colorTag: 'purple',
      notes: 'Structure with stakeholders, ethical dilemmas, and options matrix.',
      date: todayStr,
    },
  ];
}

export class StudyStorageService {
  /**
   * Loads all study sessions, initializing with seed data on first run
   */
  static async getSessions(): Promise<StudySession[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!raw) {
        const initial = generateSeedSessions();
        await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as StudySession[];
    } catch (e) {
      console.warn('Failed to load study sessions from storage:', e);
      return generateSeedSessions();
    }
  }

  /**
   * Saves a new study session and returns the updated sessions list
   */
  static async saveSession(session: Omit<StudySession, 'id'>): Promise<StudySession[]> {
    const todayStr = getLocalDateString();
    // Validate and sanitize session duration (at least 1 minute)
    const validDurationMinutes = Math.max(1, Math.round(session.durationMinutes || 1));

    // Prevent future dates
    if (session.date > todayStr) {
      throw new Error('Cannot log study sessions for future dates.');
    }

    const currentSessions = await this.getSessions();
    const newSession: StudySession = {
      ...session,
      durationMinutes: validDurationMinutes,
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      completed: true,
    };

    const updated = [newSession, ...currentSessions];
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Deletes a study session
   */
  static async deleteSession(sessionId: string): Promise<StudySession[]> {
    const currentSessions = await this.getSessions();
    const updated = currentSessions.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Loads study tasks
   */
  static async getTasks(): Promise<StudyTask[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) {
        const initial = generateSeedTasks();
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) as StudyTask[];
    } catch (e) {
      console.warn('Failed to load tasks from storage:', e);
      return generateSeedTasks();
    }
  }

  /**
   * Toggles task completion state
   */
  static async toggleTask(taskId: string): Promise<StudyTask[]> {
    const tasks = await this.getTasks();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          status: (nextCompleted ? 'completed' : 'todo') as 'completed' | 'todo',
        };
      }
      return t;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Updates an existing study task
   */
  static async updateTask(taskId: string, partial: Partial<StudyTask>): Promise<StudyTask[]> {
    const tasks = await this.getTasks();
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, ...partial } : t
    );
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Adds a new study task
   */
  static async addTask(task: Omit<StudyTask, 'id' | 'completed'>): Promise<StudyTask[]> {
    const tasks = await this.getTasks();
    const newTask: StudyTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      completed: task.status === 'completed',
    };
    const updated = [newTask, ...tasks];
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Deletes a study task
   */
  static async deleteTask(taskId: string): Promise<StudyTask[]> {
    const tasks = await this.getTasks();
    const updated = tasks.filter((t) => t.id !== taskId);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Loads user configuration
   */
  static async getConfig(): Promise<UserStudyConfig> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      if (!raw) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CONFIG,
          JSON.stringify(DEFAULT_CONFIG)
        );
        return DEFAULT_CONFIG;
      }
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Updates user configuration
   */
  static async updateConfig(
    partial: Partial<UserStudyConfig>
  ): Promise<UserStudyConfig> {
    const current = await this.getConfig();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    return updated;
  }

  /**
   * Loads metrics
   */
  static async getMetrics(): Promise<UPSCPreparationMetrics> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.METRICS);
      if (!raw) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.METRICS,
          JSON.stringify(DEFAULT_METRICS)
        );
        return DEFAULT_METRICS;
      }
      return { ...DEFAULT_METRICS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_METRICS;
    }
  }

  /**
   * Updates metrics (e.g. after MCQ practice or answer writing)
   */
  static async updateMetrics(
    partial: Partial<UPSCPreparationMetrics>
  ): Promise<UPSCPreparationMetrics> {
    const current = await this.getMetrics();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Loads persisted active focus session if one exists
   */
  static async getActiveFocusSession(): Promise<ActiveFocusSession | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_FOCUS_SESSION);
      if (!raw) return null;
      return JSON.parse(raw) as ActiveFocusSession;
    } catch {
      return null;
    }
  }

  /**
   * Persists active focus session
   */
  static async saveActiveFocusSession(session: ActiveFocusSession): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_FOCUS_SESSION,
        JSON.stringify(session)
      );
    } catch (e) {
      console.warn('Could not persist active focus session:', e);
    }
  }

  /**
   * Clears persisted active focus session
   */
  static async clearActiveFocusSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_FOCUS_SESSION);
    } catch (e) {
      console.warn('Could not clear active focus session:', e);
    }
  }

  /**
   * Resets all data to initial defaults
   */
  static async resetAllData(): Promise<void> {
    const todayStr = getLocalDateString();
    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSIONS,
      JSON.stringify(generateSeedSessions(todayStr))
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.TASKS,
      JSON.stringify(generateSeedTasks(todayStr))
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.CONFIG,
      JSON.stringify(DEFAULT_CONFIG)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.METRICS,
      JSON.stringify(DEFAULT_METRICS)
    );
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_FOCUS_SESSION);
  }
}
