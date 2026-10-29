import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import {
  DayStudySummary,
  StreakData,
  StudySession,
  StudyTask,
  UPSCPreparationMetrics,
  UPSCSubject,
  UserStudyConfig,
} from '@/types/study';
import {
  calculateStreakStats,
  getLocalDateString,
  getWeekDaysSummary,
} from '@/services/streakCalculator';
import {
  DEFAULT_CONFIG,
  DEFAULT_METRICS,
  generateSeedSessions,
  generateSeedTasks,
  StudyStorageService,
} from '@/services/studyStorage';
import {
  ActiveFocusSession,
  ambientSoundManager,
  calculateFocusDurations,
  FocusSessionStatus,
  FocusSessionSummaryData,
  formatTimeOfDay,
  getMotivationalQuote,
} from '@/services/focusTimerService';

export interface ActiveFocusTimer {
  isRunning: boolean;
  isPaused: boolean;
  subject: UPSCSubject;
  customSubjectName?: string;
  topic: string;
  elapsedSeconds: number;
  pausedSeconds: number;
  focusedSeconds: number;
  focusedMinutes: number;
  startTime: string | null;
  targetMinutes: number;
  distractionCount: number;
  status: FocusSessionStatus;
}

interface StudyContextType {
  sessions: StudySession[];
  tasks: StudyTask[];
  config: UserStudyConfig;
  metrics: UPSCPreparationMetrics;
  streak: StreakData;
  weekDays: DayStudySummary[];
  todayTotalMinutes: number;
  todayGoalMinutes: number;
  todayProgressPercent: number;
  todayRemainingMinutes: number;
  isLoading: boolean;
  activeTimer: ActiveFocusTimer;
  activeSession: ActiveFocusSession | null;
  lastSessionSummary: FocusSessionSummaryData | null;
  setLastSessionSummary: (summary: FocusSessionSummaryData | null) => void;
  distractionAlertMessage: string | null;
  clearDistractionAlert: () => void;

  // Timer actions
  startFocusTimer: (
    subject: UPSCSubject,
    topic: string,
    targetMinutes?: number,
    customSubjectName?: string
  ) => void;
  pauseFocusTimer: () => void;
  resumeFocusTimer: () => void;
  stopAndSaveFocusTimer: (
    notes?: string,
    statusOverride?: 'completed' | 'interrupted'
  ) => Promise<FocusSessionSummaryData | null>;
  discardFocusTimer: () => void;
  recordDistractionEvent: () => void;

  // Manual actions
  logManualSession: (
    subject: UPSCSubject,
    topic: string,
    durationMinutes: number,
    date?: string,
    notes?: string
  ) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Task actions
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, partial: Partial<StudyTask>) => Promise<void>;
  addTask: (
    subjectOrTask: UPSCSubject | Omit<StudyTask, 'id' | 'completed'>,
    topic?: string,
    estimatedMinutes?: number,
    priority?: 'High' | 'Medium' | 'Normal',
    notes?: string
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Practice actions
  recordMCQSession: (attempted: number, correct: number) => Promise<void>;
  recordMainsAnswer: (subject: UPSCSubject, topic: string, durationMinutes: number) => Promise<void>;
  recordArticleRead: () => Promise<void>;

  // Daily Questions Goal & Tracking (4-Step Milestones)
  dailyQuestionsGoal: number;
  todayQuestionsSolved: number;
  updateDailyQuestionsGoal: (goal: number) => Promise<void>;
  logDailyQuestionsSolved: (count: number) => Promise<void>;
  setTodayQuestionsSolvedDirect: (count: number) => Promise<void>;

  // Config actions
  updateConfig: (partial: Partial<UserStudyConfig>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Modals state
  isFocusModalOpen: boolean;
  setIsFocusModalOpen: (open: boolean) => void;
  isFocusSummaryModalOpen: boolean;
  setIsFocusSummaryModalOpen: (open: boolean) => void;
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
  isAddTaskModalOpen: boolean;
  setIsAddTaskModalOpen: (open: boolean) => void;
  isStreakInfoModalOpen: boolean;
  setIsStreakInfoModalOpen: (open: boolean) => void;
  isMCQModalOpen: boolean;
  setIsMCQModalOpen: (open: boolean) => void;
  isMainsModalOpen: boolean;
  setIsMainsModalOpen: (open: boolean) => void;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isNotificationsModalOpen: boolean;
  setIsNotificationsModalOpen: (open: boolean) => void;
  isConfigModalOpen: boolean;
  setIsConfigModalOpen: (open: boolean) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>(() => generateSeedSessions());
  const [tasks, setTasks] = useState<StudyTask[]>(() => generateSeedTasks());
  const [config, setConfig] = useState<UserStudyConfig>(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState<UPSCPreparationMetrics>(DEFAULT_METRICS);
  const [todayQuestionsSolved, setTodayQuestionsSolved] = useState<number>(6);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Active Focus Session State (Timestamp-backed)
  const [activeSession, setActiveSession] = useState<ActiveFocusSession | null>(null);
  const activeSessionRef = useRef<ActiveFocusSession | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Live timer tick timestamp
  const [currentTickTime, setCurrentTickTime] = useState<number>(0);

  // Focus Summary Modal State
  const [lastSessionSummary, setLastSessionSummary] = useState<FocusSessionSummaryData | null>(null);
  const [isFocusSummaryModalOpen, setIsFocusSummaryModalOpen] = useState(false);

  // Distraction alert message
  const [distractionAlertMessage, setDistractionAlertMessage] = useState<string | null>(null);

  // Modals
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isStreakInfoModalOpen, setIsStreakInfoModalOpen] = useState(false);
  const [isMCQModalOpen, setIsMCQModalOpen] = useState(false);
  const [isMainsModalOpen, setIsMainsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const todayStr = getLocalDateString();

  // Load all initial data and restore active session if available
  const refreshAllData = useCallback(async () => {
    try {
      const [s, t, c, m, storedFocus, q] = await Promise.all([
        StudyStorageService.getSessions(),
        StudyStorageService.getTasks(),
        StudyStorageService.getConfig(),
        StudyStorageService.getMetrics(),
        StudyStorageService.getActiveFocusSession(),
        StudyStorageService.getTodayQuestionsSolved(),
      ]);
      setSessions(s);
      setTasks(t);
      setConfig(c);
      setMetrics(m);
      setTodayQuestionsSolved(q);
      if (storedFocus && (storedFocus.status === 'running' || storedFocus.status === 'paused')) {
        setActiveSession(storedFocus);
      }
    } catch (e) {
      console.error('Error refreshing study data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      StudyStorageService.getSessions(),
      StudyStorageService.getTasks(),
      StudyStorageService.getConfig(),
      StudyStorageService.getMetrics(),
      StudyStorageService.getActiveFocusSession(),
      StudyStorageService.getTodayQuestionsSolved(),
    ])
      .then(([s, t, c, m, storedFocus, q]) => {
        if (active) {
          setSessions(s);
          setTasks(t);
          setConfig(c);
          setMetrics(m);
          if (storedFocus && (storedFocus.status === 'running' || storedFocus.status === 'paused')) {
            setActiveSession(storedFocus);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Initial study data load failed:', err);
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Timer ticker: updates every second based on real timestamps
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTickTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Derived durations for active timer
  const currentDurations = activeSession
    ? calculateFocusDurations(
        activeSession,
        currentTickTime > 0 ? currentTickTime : activeSession.updatedAt
      )
    : { elapsedSeconds: 0, pausedSeconds: 0, focusedSeconds: 0, focusedMinutes: 0 };

  const activeTimer: ActiveFocusTimer = {
    isRunning: activeSession !== null && activeSession.status === 'running',
    isPaused: activeSession !== null && activeSession.status === 'paused',
    subject: activeSession?.subject || 'Polity',
    customSubjectName: activeSession?.customSubjectName,
    topic: activeSession?.topic || '',
    elapsedSeconds: currentDurations.focusedSeconds, // Primary timer shows focused seconds
    pausedSeconds: currentDurations.pausedSeconds,
    focusedSeconds: currentDurations.focusedSeconds,
    focusedMinutes: currentDurations.focusedMinutes,
    startTime: activeSession ? new Date(activeSession.startTimestamp).toISOString() : null,
    targetMinutes: activeSession?.targetMinutes || 60,
    distractionCount: activeSession?.distractionCount || 0,
    status: activeSession?.status || 'idle',
  };

  // Distraction tracking: Page Visibility API & Window Blur on Web, AppState on Native
  const recordDistractionEvent = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev || prev.status !== 'running') return prev;
      const updated: ActiveFocusSession = {
        ...prev,
        distractionCount: prev.distractionCount + 1,
        lastDistractionTimestamp: Date.now(),
        updatedAt: Date.now(),
      };
      StudyStorageService.saveActiveFocusSession(updated);
      return updated;
    });
  }, []);

  const clearDistractionAlert = useCallback(() => {
    setDistractionAlertMessage(null);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        const sess = activeSessionRef.current;
        if (document.visibilityState === 'hidden') {
          if (sess && sess.status === 'running') {
            recordDistractionEvent();
          }
        } else if (document.visibilityState === 'visible') {
          if (sess && sess.status === 'running' && sess.distractionCount > 0) {
            setDistractionAlertMessage(
              `Distraction detected (${sess.distractionCount} tab switches). Maintain deep focus for UPSC!`
            );
          }
        }
      };

      const handleWindowBlur = () => {
        const sess = activeSessionRef.current;
        if (sess && sess.status === 'running') {
          recordDistractionEvent();
        }
      };

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const sess = activeSessionRef.current;
        if (sess && (sess.status === 'running' || sess.status === 'paused')) {
          e.preventDefault();
          e.returnValue = 'You have an active UPSC focus session. Are you sure you want to leave?';
          return e.returnValue;
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      // Native AppState monitoring
      const sub = AppState.addEventListener('change', (nextAppState) => {
        const sess = activeSessionRef.current;
        if (nextAppState.match(/inactive|background/)) {
          if (sess && sess.status === 'running') {
            recordDistractionEvent();
          }
        } else if (nextAppState === 'active') {
          if (sess && sess.status === 'running' && sess.distractionCount > 0) {
            setDistractionAlertMessage(
              `Welcome back to your UPSC study session! App switch logged.`
            );
          }
        }
      });

      return () => sub.remove();
    }
  }, [recordDistractionEvent]);

  // Streak calculation
  const streak = calculateStreakStats(
    sessions,
    config.qualifyingStreakMinutes,
    todayStr
  );

  // Week days summary
  const weekDays = getWeekDaysSummary(
    sessions,
    config.dailyGoalMinutes,
    config.qualifyingStreakMinutes,
    todayStr
  );

  // Today totals
  const todaySessions = sessions.filter(
    (s) => s.date === todayStr && s.completed
  );
  const todayTotalMinutes = todaySessions.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0
  );
  const todayGoalMinutes = config.dailyGoalMinutes;
  const todayProgressPercent = Math.min(
    100,
    Math.round((todayTotalMinutes / todayGoalMinutes) * 100)
  );
  const todayRemainingMinutes = Math.max(0, todayGoalMinutes - todayTotalMinutes);

  // Timer Handlers
  const startFocusTimer = useCallback(
    (
      subject: UPSCSubject,
      topic: string,
      targetMinutes: number = 60,
      customSubjectName?: string
    ) => {
      // Guard against concurrent sessions
      if (activeSessionRef.current && activeSessionRef.current.status === 'running') {
        setIsFocusModalOpen(true);
        return;
      }

      const now = Date.now();
      const newSession: ActiveFocusSession = {
        id: `focus_${now}_${Math.random().toString(36).substring(2, 8)}`,
        userId: 'user_primary',
        subject,
        customSubjectName: subject === 'Custom Subject' ? customSubjectName : undefined,
        topic: topic.trim() || `${subject} Revision`,
        targetMinutes,
        startTimestamp: now,
        pauseIntervals: [],
        distractionCount: 0,
        status: 'running',
        createdAt: now,
        updatedAt: now,
      };

      setActiveSession(newSession);
      StudyStorageService.saveActiveFocusSession(newSession);
      setIsFocusModalOpen(true);
    },
    []
  );

  const pauseFocusTimer = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev || prev.status !== 'running') return prev;
      const now = Date.now();
      const updated: ActiveFocusSession = {
        ...prev,
        status: 'paused',
        pauseIntervals: [...prev.pauseIntervals, { startTimestamp: now, endTimestamp: null }],
        updatedAt: now,
      };
      StudyStorageService.saveActiveFocusSession(updated);
      ambientSoundManager.stop();
      return updated;
    });
  }, []);

  const resumeFocusTimer = useCallback(() => {
    setActiveSession((prev) => {
      if (!prev || prev.status !== 'paused') return prev;
      const now = Date.now();
      const intervals = [...prev.pauseIntervals];
      if (intervals.length > 0 && intervals[intervals.length - 1].endTimestamp === null) {
        intervals[intervals.length - 1] = {
          ...intervals[intervals.length - 1],
          endTimestamp: now,
        };
      }
      const updated: ActiveFocusSession = {
        ...prev,
        status: 'running',
        pauseIntervals: intervals,
        updatedAt: now,
      };
      StudyStorageService.saveActiveFocusSession(updated);
      return updated;
    });
  }, []);

  const stopAndSaveFocusTimer = useCallback(
    async (
      notes?: string,
      statusOverride: 'completed' | 'interrupted' = 'completed'
    ): Promise<FocusSessionSummaryData | null> => {
      const current = activeSessionRef.current;
      if (!current) return null;

      const now = Date.now();
      ambientSoundManager.stop();

      // Close open pause interval if paused
      const intervals = [...current.pauseIntervals];
      if (intervals.length > 0 && intervals[intervals.length - 1].endTimestamp === null) {
        intervals[intervals.length - 1] = {
          ...intervals[intervals.length - 1],
          endTimestamp: now,
        };
      }

      const closedSession: ActiveFocusSession = {
        ...current,
        endTimestamp: now,
        pauseIntervals: intervals,
        status: statusOverride,
      };

      const durations = calculateFocusDurations(closedSession, now);
      // Validated duration in minutes (minimum 1 minute when user chooses to save session)
      const durationMins = Math.max(1, Math.round(durations.focusedSeconds / 60));

      const effectiveDate = todayStr;
      const newStudySession: Omit<StudySession, 'id'> = {
        userId: 'user_primary',
        subject: current.subject,
        customSubjectName: current.customSubjectName,
        topic: current.topic || `${current.subject} Revision`,
        startTime: new Date(current.startTimestamp).toISOString(),
        endTime: new Date(now).toISOString(),
        durationMinutes: durationMins,
        elapsedSeconds: durations.elapsedSeconds,
        pausedSeconds: durations.pausedSeconds,
        distractionCount: current.distractionCount,
        status: statusOverride,
        date: effectiveDate,
        notes: notes || (current.distractionCount > 0 ? `Completed with ${current.distractionCount} distraction checks.` : 'Deep focus study session completed.'),
        completed: statusOverride === 'completed',
      };

      // Save to persistent storage
      const updatedSessions = await StudyStorageService.saveSession(newStudySession);
      setSessions(updatedSessions);

      // Reconcile metrics
      if (
        current.subject === 'Polity' ||
        current.subject === 'History' ||
        current.subject === 'Modern History' ||
        current.subject === 'Ancient & Medieval' ||
        current.subject === 'Geography' ||
        current.subject === 'Economy' ||
        current.subject === 'Environment' ||
        current.subject === 'Environment & Ecology' ||
        current.subject === 'Science & Technology' ||
        current.subject === 'Ethics (GS 4)'
      ) {
        const updatedMetrics = await StudyStorageService.updateMetrics({
          gsCompletedMinutes: metrics.gsCompletedMinutes + durationMins,
          gsTopicsCount: metrics.gsTopicsCount + 1,
        });
        setMetrics(updatedMetrics);
      } else if (current.subject === 'Current Affairs') {
        const updatedMetrics = await StudyStorageService.updateMetrics({
          caCompletedMinutes: metrics.caCompletedMinutes + durationMins,
        });
        setMetrics(updatedMetrics);
      } else if (current.subject === 'Mains Answer Writing') {
        const updatedMetrics = await StudyStorageService.updateMetrics({
          mainsAnswersWritten: metrics.mainsAnswersWritten + 1,
        });
        setMetrics(updatedMetrics);
      }

      // Compute summary metrics for polished summary modal
      const todayMinsBefore = todayTotalMinutes;
      const todayMinsAfter = todayMinsBefore + durationMins;
      const goalPct = Math.min(100, Math.round((todayMinsAfter / config.dailyGoalMinutes) * 100));
      const newStreak = calculateStreakStats(updatedSessions, config.qualifyingStreakMinutes, todayStr);

      const summaryData: FocusSessionSummaryData = {
        sessionId: current.id,
        subject: current.subject,
        customSubjectName: current.customSubjectName,
        topic: current.topic,
        startTimeIso: new Date(current.startTimestamp).toISOString(),
        endTimeIso: new Date(now).toISOString(),
        startTimeFormatted: formatTimeOfDay(current.startTimestamp),
        endTimeFormatted: formatTimeOfDay(now),
        totalElapsedSeconds: durations.elapsedSeconds,
        totalPausedSeconds: durations.pausedSeconds,
        focusedSeconds: durations.focusedSeconds,
        focusedMinutes: durationMins,
        targetMinutes: current.targetMinutes,
        targetCompleted: current.targetMinutes > 0 ? durationMins >= current.targetMinutes : true,
        distractionCount: current.distractionCount,
        todayTotalMinutesBefore: todayMinsBefore,
        todayTotalMinutesAfter: todayMinsAfter,
        dailyGoalMinutes: config.dailyGoalMinutes,
        goalCompletionPercent: goalPct,
        currentStreak: newStreak.currentStreak,
        isStreakQualified: durationMins >= config.qualifyingStreakMinutes || todayMinsAfter >= config.qualifyingStreakMinutes,
        motivationalQuote: getMotivationalQuote(),
      };

      // Clear active focus session
      await StudyStorageService.clearActiveFocusSession();
      setActiveSession(null);
      setIsFocusModalOpen(false);

      // Open summary modal
      setLastSessionSummary(summaryData);
      setIsFocusSummaryModalOpen(true);

      return summaryData;
    },
    [config.dailyGoalMinutes, config.qualifyingStreakMinutes, metrics, todayStr, todayTotalMinutes]
  );

  const discardFocusTimer = useCallback(() => {
    ambientSoundManager.stop();
    StudyStorageService.clearActiveFocusSession();
    setActiveSession(null);
    setIsFocusModalOpen(false);
  }, []);

  // Manual Session Logging
  const logManualSession = useCallback(
    async (
      subject: UPSCSubject,
      topic: string,
      durationMinutes: number,
      date: string = todayStr,
      notes?: string
    ) => {
      const newSession: Omit<StudySession, 'id'> = {
        userId: 'user_primary',
        subject,
        topic: topic || `${subject} Study Session`,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes,
        date,
        notes: notes || 'Manual study log entry.',
        completed: true,
      };

      const updated = await StudyStorageService.saveSession(newSession);
      setSessions(updated);

      if (subject === 'Current Affairs') {
        const updatedMetrics = await StudyStorageService.updateMetrics({
          caCompletedMinutes: metrics.caCompletedMinutes + durationMinutes,
          caArticlesReviewed: metrics.caArticlesReviewed + 1,
        });
        setMetrics(updatedMetrics);
      } else {
        const updatedMetrics = await StudyStorageService.updateMetrics({
          gsCompletedMinutes: metrics.gsCompletedMinutes + durationMinutes,
        });
        setMetrics(updatedMetrics);
      }
    },
    [metrics, todayStr]
  );

  const deleteSession = useCallback(async (id: string) => {
    const updated = await StudyStorageService.deleteSession(id);
    setSessions(updated);
  }, []);

  // Tasks
  const toggleTask = useCallback(async (id: string) => {
    const updated = await StudyStorageService.toggleTask(id);
    setTasks(updated);
  }, []);

  const updateTask = useCallback(async (id: string, partial: Partial<StudyTask>) => {
    const updated = await StudyStorageService.updateTask(id, partial);
    setTasks(updated);
  }, []);

  const addTask = useCallback(
    async (
      subjectOrTask: UPSCSubject | Omit<StudyTask, 'id' | 'completed'>,
      topic?: string,
      estimatedMinutes?: number,
      priority?: 'High' | 'Medium' | 'Normal',
      notes?: string
    ) => {
      let taskToSave: Omit<StudyTask, 'id' | 'completed'>;
      if (typeof subjectOrTask === 'object') {
        taskToSave = subjectOrTask;
      } else {
        taskToSave = {
          subject: subjectOrTask,
          topic: topic || `${subjectOrTask} Study Task`,
          estimatedMinutes: estimatedMinutes || 60,
          priority: priority || 'Medium',
          notes,
          date: todayStr,
          colorTag: 'default',
          status: 'todo',
        };
      }
      const updated = await StudyStorageService.addTask(taskToSave);
      setTasks(updated);
    },
    [todayStr]
  );

  const deleteTask = useCallback(async (id: string) => {
    const updated = await StudyStorageService.deleteTask(id);
    setTasks(updated);
  }, []);

  // Practice
  const recordMCQSession = useCallback(
    async (attempted: number, correct: number) => {
      const updated = await StudyStorageService.updateMetrics({
        mcqsAttempted: metrics.mcqsAttempted + attempted,
        mcqsCorrect: metrics.mcqsCorrect + correct,
      });
      setMetrics(updated);

      // Track in daily questions
      const updatedTodaySolved = await StudyStorageService.recordQuestionsSolved(attempted, todayStr);
      setTodayQuestionsSolved(updatedTodaySolved);

      // Log session
      await logManualSession(
        'Polity',
        `Prelims MCQ Test (${attempted} questions, ${correct} correct)`,
        25,
        todayStr,
        `Attempted ${attempted} MCQs with ${Math.round((correct / attempted) * 100)}% accuracy.`
      );
    },
    [logManualSession, metrics, todayStr]
  );

  const recordMainsAnswer = useCallback(
    async (subject: UPSCSubject, topic: string, durationMinutes: number) => {
      const updated = await StudyStorageService.updateMetrics({
        mainsAnswersWritten: metrics.mainsAnswersWritten + 1,
      });
      setMetrics(updated);

      await logManualSession(
        subject,
        `Mains Answer Practice: ${topic}`,
        durationMinutes,
        todayStr,
        'Full 150/250-word answer drafted with introduction, body arguments, and conclusion.'
      );
    },
    [logManualSession, metrics, todayStr]
  );

  const recordArticleRead = useCallback(async () => {
    const updated = await StudyStorageService.updateMetrics({
      caArticlesReviewed: metrics.caArticlesReviewed + 1,
      caCompletedMinutes: metrics.caCompletedMinutes + 30,
    });
    setMetrics(updated);

    await logManualSession(
      'Current Affairs',
      'The Hindu & Express Editorial Analysis',
      30,
      todayStr,
      'Extracted GS-2 & GS-3 points for governance, economy, and foreign policy.'
    );
  }, [logManualSession, metrics, todayStr]);

  // Config
  const updateConfig = useCallback(async (partial: Partial<UserStudyConfig>) => {
    const updated = await StudyStorageService.updateConfig(partial);
    setConfig(updated);
  }, []);

  // Daily Questions Goal & Tracking (4 Steps)
  const dailyQuestionsGoal = config.dailyQuestionsGoal || 20;

  const updateDailyQuestionsGoal = useCallback(
    async (goal: number) => {
      const safeGoal = Math.max(4, Math.round(goal));
      await updateConfig({ dailyQuestionsGoal: safeGoal });
    },
    [updateConfig]
  );

  const logDailyQuestionsSolved = useCallback(
    async (count: number) => {
      const updated = await StudyStorageService.recordQuestionsSolved(count, todayStr);
      setTodayQuestionsSolved(updated);
      const updatedMetrics = await StudyStorageService.updateMetrics({
        mcqsAttempted: metrics.mcqsAttempted + count,
      });
      setMetrics(updatedMetrics);
    },
    [metrics.mcqsAttempted, todayStr]
  );

  const setTodayQuestionsSolvedDirect = useCallback(
    async (count: number) => {
      const updated = await StudyStorageService.setTodayQuestionsSolved(count, todayStr);
      setTodayQuestionsSolved(updated);
    },
    [todayStr]
  );

  const resetToDefaults = useCallback(async () => {
    await StudyStorageService.resetAllData();
    ambientSoundManager.stop();
    setActiveSession(null);
    await refreshAllData();
  }, [refreshAllData]);

  const value: StudyContextType = {
    sessions,
    tasks,
    config,
    metrics,
    streak,
    weekDays,
    todayTotalMinutes,
    todayGoalMinutes,
    todayProgressPercent,
    todayRemainingMinutes,
    isLoading,
    activeTimer,
    activeSession,
    lastSessionSummary,
    setLastSessionSummary,
    distractionAlertMessage,
    clearDistractionAlert,

    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopAndSaveFocusTimer,
    discardFocusTimer,
    recordDistractionEvent,

    logManualSession,
    deleteSession,

    toggleTask,
    updateTask,
    addTask,
    deleteTask,

    recordMCQSession,
    recordMainsAnswer,
    recordArticleRead,

    dailyQuestionsGoal,
    todayQuestionsSolved,
    updateDailyQuestionsGoal,
    logDailyQuestionsSolved,
    setTodayQuestionsSolvedDirect,

    updateConfig,
    resetToDefaults,
    refreshAllData,

    isFocusModalOpen,
    setIsFocusModalOpen,
    isFocusSummaryModalOpen,
    setIsFocusSummaryModalOpen,
    isLogModalOpen,
    setIsLogModalOpen,
    isAddTaskModalOpen,
    setIsAddTaskModalOpen,
    isStreakInfoModalOpen,
    setIsStreakInfoModalOpen,
    isMCQModalOpen,
    setIsMCQModalOpen,
    isMainsModalOpen,
    setIsMainsModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextType {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
