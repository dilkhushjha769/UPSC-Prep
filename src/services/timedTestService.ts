/**
 * Timed Test Service (Mode B: Real UPSC Exam Simulation)
 * ----------------------------------------------------------------------------
 * Manages Timed Mode sessions for both Prelims and Mains topic practice:
 * - Configurable duration, question count, and negative marking (+2.0 / -0.66)
 * - Question Palette states (Unvisited, Unanswered, Attempted, Marked for Review)
 * - Auto-saves in-progress session state to AsyncStorage to prevent data loss on refresh
 * - Computes final scorecard, negative marking deductions, and question-by-question review
 * - Syncs all attempts and test scores to `UserPracticeAnalyticsService` & `MainsService`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchedPYQItem, PYQExamType } from './pyqMatchingService';
import {
  UserPracticeAnalyticsService,
  TimedTopicTestSummary,
} from './userPracticeAnalyticsService';
import { MainsService } from './mainsService';

const ACTIVE_TIMED_TEST_STORAGE_KEY = '@upsc_active_topic_timed_test_v1';

export type PaletteQuestionStatus =
  | 'unvisited'
  | 'unanswered'
  | 'attempted'
  | 'marked_for_review'
  | 'attempted_and_marked';

export interface TimedTestConfig {
  topicTitle: string;
  examMode: PYQExamType;
  questionCount: number;
  durationMinutes: number;
  negativeMarking: boolean;
  marksPerCorrect: number; // default +2.0 for Prelims
  negativePerWrong: number; // default 0.6667 (1/3 of 2.0) for Prelims
}

export interface TimedQuestionResponse {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  mainsAnswerText: string;
  markedForReview: boolean;
  visited: boolean;
  timeSpentSeconds: number;
}

export interface ActiveTimedTestSession {
  sessionId: string;
  config: TimedTestConfig;
  questions: MatchedPYQItem[];
  responses: Record<string, TimedQuestionResponse>;
  currentIndex: number;
  startedAtMs: number;
  remainingSeconds: number;
  lastSavedAtIso: string;
}

export interface TimedQuestionReviewItem {
  item: MatchedPYQItem;
  response: TimedQuestionResponse;
  status: 'correct' | 'incorrect' | 'unanswered' | 'mains_written';
  marksAwarded: number;
  maxMarks: number;
}

export interface TimedTestFinalResult {
  summary: TimedTopicTestSummary;
  positiveMarks: number;
  negativeMarksDeducted: number;
  reviewItems: TimedQuestionReviewItem[];
}

let inMemoryActiveSession: ActiveTimedTestSession | null = null;

export class TimedTestService {
  /**
   * Default recommended duration and marking scheme for a topic test.
   */
  static getDefaultConfig(
    topicTitle: string,
    examMode: PYQExamType,
    availableCount: number
  ): TimedTestConfig {
    if (examMode === 'MAINS') {
      const qCount = Math.min(availableCount, 5);
      return {
        topicTitle,
        examMode: 'MAINS',
        questionCount: Math.max(1, qCount),
        durationMinutes: Math.max(1, qCount) * 9, // ~9 mins per Mains question
        negativeMarking: false,
        marksPerCorrect: 15,
        negativePerWrong: 0,
      };
    }

    const qCount = Math.min(availableCount, 20);
    return {
      topicTitle,
      examMode: 'PRELIMS',
      questionCount: Math.max(1, qCount),
      durationMinutes: Math.max(5, Math.ceil(qCount * 1.2)), // 1.2 min per MCQ (UPSC standard: 100 Qs in 120 mins)
      negativeMarking: true,
      marksPerCorrect: 2.0,
      negativePerWrong: 0.67,
    };
  }

  /**
   * Create and initialize a new Timed Mode session and persist it for crash recovery.
   */
  static async startSession(
    config: TimedTestConfig,
    sourceItems: MatchedPYQItem[]
  ): Promise<ActiveTimedTestSession> {
    const filteredPool = sourceItems.filter((item) => item.examType === config.examMode);
    const selectedQuestions = filteredPool.slice(0, Math.max(1, config.questionCount));

    const responses: Record<string, TimedQuestionResponse> = {};
    selectedQuestions.forEach((q, idx) => {
      responses[q.id] = {
        questionId: q.id,
        selectedOption: null,
        mainsAnswerText: '',
        markedForReview: false,
        visited: idx === 0,
        timeSpentSeconds: 0,
      };
    });

    const session: ActiveTimedTestSession = {
      sessionId: `timed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      config: {
        ...config,
        questionCount: selectedQuestions.length,
      },
      questions: selectedQuestions,
      responses,
      currentIndex: 0,
      startedAtMs: Date.now(),
      remainingSeconds: Math.max(60, config.durationMinutes * 60),
      lastSavedAtIso: new Date().toISOString(),
    };

    await this.saveActiveSession(session);
    return session;
  }

  /**
   * Compute the Question Palette status for a question.
   */
  static getPaletteStatus(
    resp: TimedQuestionResponse | undefined,
    examMode: PYQExamType
  ): PaletteQuestionStatus {
    if (!resp || !resp.visited) return 'unvisited';
    const hasAnswer =
      examMode === 'PRELIMS'
        ? Boolean(resp.selectedOption)
        : Boolean(resp.mainsAnswerText && resp.mainsAnswerText.trim().length > 0);

    if (hasAnswer && resp.markedForReview) return 'attempted_and_marked';
    if (hasAnswer) return 'attempted';
    if (resp.markedForReview) return 'marked_for_review';
    return 'unanswered';
  }

  /**
   * Persist active session state to AsyncStorage / localStorage so accidental refresh never loses work.
   */
  static async saveActiveSession(session: ActiveTimedTestSession): Promise<void> {
    session.lastSavedAtIso = new Date().toISOString();
    inMemoryActiveSession = session;
    const raw = JSON.stringify(session);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACTIVE_TIMED_TEST_STORAGE_KEY, raw);
        return;
      }
      await AsyncStorage.setItem(ACTIVE_TIMED_TEST_STORAGE_KEY, raw);
    } catch {}
  }

  /**
   * Load any saved in-progress Timed Test session for a topic.
   */
  static async loadSavedSession(topicTitle?: string): Promise<ActiveTimedTestSession | null> {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(ACTIVE_TIMED_TEST_STORAGE_KEY);
      } else {
        raw = await AsyncStorage.getItem(ACTIVE_TIMED_TEST_STORAGE_KEY);
      }
      const parsed: ActiveTimedTestSession | null = raw
        ? JSON.parse(raw)
        : inMemoryActiveSession;

      if (!parsed || !parsed.questions || parsed.questions.length === 0) return null;
      if (
        topicTitle &&
        parsed.config.topicTitle.toLowerCase() !== topicTitle.toLowerCase()
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Clear saved in-progress session upon submission or exit.
   */
  static async clearSavedSession(): Promise<void> {
    inMemoryActiveSession = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ACTIVE_TIMED_TEST_STORAGE_KEY);
        return;
      }
      await AsyncStorage.removeItem(ACTIVE_TIMED_TEST_STORAGE_KEY);
    } catch {}
  }

  /**
   * Finalize and grade a Timed Test session, recording all question attempts
   * and overall test metrics.
   */
  static async submitTimedTest(
    session: ActiveTimedTestSession
  ): Promise<TimedTestFinalResult> {
    const { config, questions, responses } = session;
    const timeLimitSeconds = config.durationMinutes * 60;
    const durationSeconds = Math.max(
      1,
      Math.min(timeLimitSeconds, timeLimitSeconds - session.remainingSeconds)
    );

    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let positiveMarks = 0;
    let negativeMarksDeducted = 0;
    let maxScore = 0;

    const reviewItems: TimedQuestionReviewItem[] = [];

    for (const item of questions) {
      const resp = responses[item.id] || {
        questionId: item.id,
        selectedOption: null,
        mainsAnswerText: '',
        markedForReview: false,
        visited: false,
        timeSpentSeconds: 0,
      };

      if (item.examType === 'PRELIMS' && item.prelimsQuestion) {
        const pq = item.prelimsQuestion;
        const qMax = config.marksPerCorrect;
        maxScore += qMax;

        if (!resp.selectedOption) {
          unansweredCount++;
          reviewItems.push({
            item,
            response: resp,
            status: 'unanswered',
            marksAwarded: 0,
            maxMarks: qMax,
          });
        } else {
          attemptedCount++;
          const isCorrect = resp.selectedOption === pq.correctAnswer;
          let marksAwarded = 0;

          if (isCorrect) {
            correctCount++;
            marksAwarded = config.marksPerCorrect;
            positiveMarks += marksAwarded;
          } else {
            incorrectCount++;
            if (config.negativeMarking) {
              marksAwarded = -Number((config.marksPerCorrect / 3).toFixed(2));
              negativeMarksDeducted += Math.abs(marksAwarded);
            }
          }

          reviewItems.push({
            item,
            response: resp,
            status: isCorrect ? 'correct' : 'incorrect',
            marksAwarded: Number(marksAwarded.toFixed(2)),
            maxMarks: qMax,
          });

          await UserPracticeAnalyticsService.recordTopicQuestionAttempt({
            topicQuery: config.topicTitle,
            examType: 'PRELIMS',
            questionId: pq.id,
            subject: item.subject,
            year: pq.year,
            isCorrect,
            selectedOption: resp.selectedOption,
            marksAwarded: Number(marksAwarded.toFixed(2)),
            maxMarks: qMax,
            timeSpentSeconds: resp.timeSpentSeconds || Math.round(durationSeconds / questions.length),
            prelimsQuestion: pq,
            sourceMode: 'mock',
          });
        }
      } else if (item.examType === 'MAINS' && item.mainsQuestion) {
        const mq = item.mainsQuestion;
        const qMax = mq.marks || 15;
        maxScore += qMax;

        const text = (resp.mainsAnswerText || '').trim();
        if (!text) {
          unansweredCount++;
          reviewItems.push({
            item,
            response: resp,
            status: 'unanswered',
            marksAwarded: 0,
            maxMarks: qMax,
          });
        } else {
          attemptedCount++;
          correctCount++;
          const wordCount = text.split(/\s+/).length;
          const targetWords = mq.word_limit || 150;
          const completionFactor = Math.min(1, wordCount / Math.max(50, targetWords * 0.75));
          const estimatedMarks = Number((qMax * 0.55 * completionFactor).toFixed(1));
          positiveMarks += estimatedMarks;

          await MainsService.saveDraft(mq.id, 'typed', text);

          reviewItems.push({
            item,
            response: resp,
            status: 'mains_written',
            marksAwarded: estimatedMarks,
            maxMarks: qMax,
          });

          await UserPracticeAnalyticsService.recordTopicQuestionAttempt({
            topicQuery: config.topicTitle,
            examType: 'MAINS',
            questionId: mq.id,
            subject: item.subject,
            year: mq.year,
            isCorrect: true,
            marksAwarded: estimatedMarks,
            maxMarks: qMax,
            timeSpentSeconds: resp.timeSpentSeconds || Math.round(durationSeconds / questions.length),
            sourceMode: 'mock',
          });
        }
      }
    }

    const rawNetScore = positiveMarks - negativeMarksDeducted;
    const finalScore = Number(rawNetScore.toFixed(2));
    const accuracyPct =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    const summary: TimedTopicTestSummary = {
      id: session.sessionId,
      topic: config.topicTitle,
      examType: config.examMode,
      totalQuestions: questions.length,
      attemptedCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      score: finalScore,
      maxScore: Number(maxScore.toFixed(2)),
      accuracyPct,
      durationSeconds,
      timeLimitSeconds,
      negativeMarking: config.negativeMarking,
      completedAt: new Date().toISOString(),
    };

    await UserPracticeAnalyticsService.recordTimedTestResult(summary);
    await this.clearSavedSession();

    return {
      summary,
      positiveMarks: Number(positiveMarks.toFixed(2)),
      negativeMarksDeducted: Number(negativeMarksDeducted.toFixed(2)),
      reviewItems,
    };
  }
}
