/**
 * User Practice Analytics Service
 * ----------------------------------------------------------------------------
 * Tracks and persists user search activity, topic-wise PYQ attempts, accuracy,
 * time spent per question, timed test scores, and weak-topic revision insights.
 * Synchronizes seamlessly with `QuestionHistoryService` and `BookmarkStorageService`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionHistoryService } from './questionHistoryService';
import { BookmarkStorageService } from './bookmarkStorage';
import { PYQMatchingService, PYQExamType } from './pyqMatchingService';
import { PYQQuestion } from '@/types/prelims';

const TOPIC_ANALYTICS_STORAGE_KEY = '@upsc_topic_pyq_analytics_v1';
const RECENT_TOPIC_SEARCHES_KEY = '@upsc_recent_topic_searches_v1';
const TIMED_TOPIC_TESTS_KEY = '@upsc_timed_topic_tests_v1';

export interface TopicAttemptRecord {
  questionId: string;
  examType: PYQExamType;
  topicQuery: string;
  subject: string;
  year: number;
  isCorrect: boolean;
  selectedOption?: string | null;
  marksAwarded?: number;
  maxMarks?: number;
  timeSpentSeconds: number;
  attemptedAt: string;
}

export interface TopicSearchActivityItem {
  topic: string;
  subject?: string;
  searchCount: number;
  lastSearchedAt: string;
  totalQuestionsFound: number;
}

export interface TimedTopicTestSummary {
  id: string;
  topic: string;
  examType: 'PRELIMS' | 'MAINS' | 'MIXED';
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  maxScore: number;
  accuracyPct: number;
  durationSeconds: number;
  timeLimitSeconds: number;
  negativeMarking: boolean;
  completedAt: string;
}

export interface TopicPerformanceStat {
  topic: string;
  subject: string;
  totalQuestions: number;
  prelimsTotal: number;
  mainsTotal: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  remainingCount: number;
  accuracyPct: number;
  avgTimeSeconds: number;
  lastPracticedAt: string | null;
  isCompleted: boolean;
  isWeakTopic: boolean;
}

interface StoredTopicAnalyticsState {
  attemptsByTopic: Record<string, Record<string, TopicAttemptRecord>>; // normalizedTopic -> questionId -> latest attempt
  practiceCountByTopic: Record<string, number>;
  topicDisplayNames: Record<string, string>;
  topicSubjects: Record<string, string>;
}

const memoryFallback = new Map<string, string>();

async function readStorageJson<T>(key: string, defaultVal: T): Promise<T> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    }
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    const mem = memoryFallback.get(key);
    if (mem) return JSON.parse(mem) as T;
  } catch {
    const mem = memoryFallback.get(key);
    if (mem) {
      try {
        return JSON.parse(mem) as T;
      } catch {}
    }
  }
  return defaultVal;
}

async function writeStorageJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  memoryFallback.set(key, serialized);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
      return;
    }
    await AsyncStorage.setItem(key, serialized);
  } catch {}
}

function normalizeTopicKey(topic: string): string {
  return (topic || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export class UserPracticeAnalyticsService {
  /**
   * Record a user topic search and update recent + popular search counters.
   */
  static async recordTopicSearch(
    topic: string,
    totalQuestionsFound: number,
    subject?: string
  ): Promise<void> {
    const trimmed = (topic || '').trim();
    if (trimmed.length < 2) return;

    const list = await readStorageJson<TopicSearchActivityItem[]>(RECENT_TOPIC_SEARCHES_KEY, []);
    const norm = normalizeTopicKey(trimmed);
    const nowIso = new Date().toISOString();

    const existingIdx = list.findIndex((item) => normalizeTopicKey(item.topic) === norm);
    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      list.splice(existingIdx, 1);
      list.unshift({
        ...existing,
        topic: trimmed,
        subject: subject || existing.subject,
        searchCount: (existing.searchCount || 1) + 1,
        lastSearchedAt: nowIso,
        totalQuestionsFound: totalQuestionsFound || existing.totalQuestionsFound,
      });
    } else {
      list.unshift({
        topic: trimmed,
        subject,
        searchCount: 1,
        lastSearchedAt: nowIso,
        totalQuestionsFound,
      });
    }

    if (list.length > 35) {
      list.length = 35;
    }

    await writeStorageJson(RECENT_TOPIC_SEARCHES_KEY, list);
  }

  /**
   * Get recently searched topics in reverse chronological order.
   */
  static async getRecentSearches(limit = 8): Promise<TopicSearchActivityItem[]> {
    const list = await readStorageJson<TopicSearchActivityItem[]>(RECENT_TOPIC_SEARCHES_KEY, []);
    return list.slice(0, limit);
  }

  /**
   * Clear recent search history.
   */
  static async clearRecentSearches(): Promise<void> {
    await writeStorageJson(RECENT_TOPIC_SEARCHES_KEY, []);
  }

  /**
   * Record a question attempt within a Topic Practice or Timed Test session.
   * Also forwards Prelims attempts to `QuestionHistoryService` for unified profile history.
   */
  static async recordTopicQuestionAttempt(params: {
    topicQuery: string;
    examType: PYQExamType;
    questionId: string;
    subject: string;
    year: number;
    isCorrect: boolean;
    selectedOption?: string | null;
    marksAwarded?: number;
    maxMarks?: number;
    timeSpentSeconds: number;
    prelimsQuestion?: PYQQuestion;
    sourceMode?: 'practice' | 'mock';
  }): Promise<void> {
    const normTopic = normalizeTopicKey(params.topicQuery || params.subject || 'General Studies');
    const state = await readStorageJson<StoredTopicAnalyticsState>(TOPIC_ANALYTICS_STORAGE_KEY, {
      attemptsByTopic: {},
      practiceCountByTopic: {},
      topicDisplayNames: {},
      topicSubjects: {},
    });

    if (!state.attemptsByTopic[normTopic]) {
      state.attemptsByTopic[normTopic] = {};
    }

    const now = new Date();
    state.attemptsByTopic[normTopic][params.questionId] = {
      questionId: params.questionId,
      examType: params.examType,
      topicQuery: params.topicQuery,
      subject: params.subject,
      year: params.year,
      isCorrect: params.isCorrect,
      selectedOption: params.selectedOption,
      marksAwarded: params.marksAwarded,
      maxMarks: params.maxMarks,
      timeSpentSeconds: Math.max(1, Math.round(params.timeSpentSeconds || 0)),
      attemptedAt: now.toISOString(),
    };

    state.practiceCountByTopic[normTopic] = (state.practiceCountByTopic[normTopic] || 0) + 1;
    state.topicDisplayNames[normTopic] = params.topicQuery || params.subject;
    state.topicSubjects[normTopic] = params.subject;

    await writeStorageJson(TOPIC_ANALYTICS_STORAGE_KEY, state);

    // Sync Prelims attempt with global QuestionHistoryService
    if (params.examType === 'PRELIMS' && params.prelimsQuestion) {
      const pq = params.prelimsQuestion;
      const rawDetailed = pq.explanation?.detailedAnalysis;
      const explanationStr = Array.isArray(rawDetailed)
        ? rawDetailed.join('\n')
        : rawDetailed || pq.explanation?.coreConcept;

      await QuestionHistoryService.recordPracticeAttempt({
        questionId: pq.id,
        source: params.sourceMode || 'practice',
        sourceTitle: `Topic Practice: ${params.topicQuery}`,
        questionNumber: pq.questionNumber,
        questionText: pq.questionText,
        options: (pq.options || []).map((o) => ({ id: o.key, text: o.text })),
        selectedAnswer: params.selectedOption || null,
        correctAnswer: pq.correctAnswer,
        isCorrect: params.isCorrect,
        status: params.selectedOption ? (params.isCorrect ? 'correct' : 'incorrect') : 'unanswered',
        timeSpentSeconds: Math.max(1, Math.round(params.timeSpentSeconds || 0)),
        subject: pq.subjectName || params.subject,
        topic: params.topicQuery || pq.subtopicName || pq.chapterName,
        explanation: explanationStr,
        dateStr: now.toISOString().slice(0, 10),
      });
    }
  }

  /**
   * Record a completed Timed Topic Test.
   */
  static async recordTimedTestResult(summary: TimedTopicTestSummary): Promise<void> {
    const list = await readStorageJson<TimedTopicTestSummary[]>(TIMED_TOPIC_TESTS_KEY, []);
    list.unshift(summary);
    if (list.length > 50) list.length = 50;
    await writeStorageJson(TIMED_TOPIC_TESTS_KEY, list);
  }

  /**
   * Retrieve recent Timed Topic Tests.
   */
  static async getTimedTestResults(limit = 15): Promise<TimedTopicTestSummary[]> {
    const list = await readStorageJson<TimedTopicTestSummary[]>(TIMED_TOPIC_TESTS_KEY, []);
    return list.slice(0, limit);
  }

  /**
   * Compute comprehensive per-topic performance stats across both explicit Topic Practice
   * sessions and global question attempts from `QuestionHistoryService`.
   */
  static async getTopicPerformanceStats(): Promise<{
    topics: TopicPerformanceStat[];
    weakTopics: TopicPerformanceStat[];
    frequentlyPracticedTopics: string[];
    bookmarkedCount: number;
    timedTestsCount: number;
  }> {
    const [state, rawGlobalAttempts, bookmarks, timedTests] = await Promise.all([
      readStorageJson<StoredTopicAnalyticsState>(TOPIC_ANALYTICS_STORAGE_KEY, {
        attemptsByTopic: {},
        practiceCountByTopic: {},
        topicDisplayNames: {},
        topicSubjects: {},
      }),
      QuestionHistoryService.fetchAllRawAttempts(),
      BookmarkStorageService.getBookmarkedQuestions(),
      this.getTimedTestResults(20),
    ]);

    // Merge global attempts into topic buckets so existing user history is reflected immediately
    const mergedMap = new Map<
      string,
      {
        displayName: string;
        subject: string;
        attempts: Map<string, { isCorrect: boolean; timeSpentSeconds: number; attemptedAt: string }>;
        practiceVolume: number;
      }
    >();

    // 1. Seed from explicit Topic Practice state
    for (const [normKey, qMap] of Object.entries(state.attemptsByTopic || {})) {
      const displayName = state.topicDisplayNames[normKey] || normKey;
      const subject = state.topicSubjects[normKey] || 'General Studies';
      const attempts = new Map<
        string,
        { isCorrect: boolean; timeSpentSeconds: number; attemptedAt: string }
      >();

      Object.values(qMap).forEach((att) => {
        attempts.set(att.questionId, {
          isCorrect: att.isCorrect,
          timeSpentSeconds: att.timeSpentSeconds,
          attemptedAt: att.attemptedAt,
        });
      });

      mergedMap.set(normKey, {
        displayName,
        subject,
        attempts,
        practiceVolume: state.practiceCountByTopic[normKey] || attempts.size,
      });
    }

    // 2. Also incorporate topic attempts from QuestionHistoryService
    for (const att of rawGlobalAttempts) {
      if (att.status === 'unanswered') continue;
      const rawTopicName = (att.topic || att.subject || '').replace(/^Topic Practice:\s*/i, '').trim();
      if (!rawTopicName) continue;
      const normKey = normalizeTopicKey(rawTopicName);

      let entry = mergedMap.get(normKey);
      if (!entry) {
        entry = {
          displayName: rawTopicName,
          subject: att.subject || 'General Studies',
          attempts: new Map(),
          practiceVolume: 0,
        };
        mergedMap.set(normKey, entry);
      }

      if (!entry.attempts.has(att.questionId)) {
        entry.attempts.set(att.questionId, {
          isCorrect: att.isCorrect,
          timeSpentSeconds: att.timeSpentSeconds || 30,
          attemptedAt: att.attemptedAtIso,
        });
        entry.practiceVolume += 1;
      }
    }

    // 3. Ensure core high-yield UPSC topics are represented so the user sees actionable progress
    const coreBenchmarkTopics = [
      { title: 'Judicial Review', subject: 'Polity & Governance' },
      { title: 'Fundamental Rights', subject: 'Polity & Governance' },
      { title: 'Monetary Policy & RBI', subject: 'Economy' },
      { title: 'Biodiversity & Protected Areas', subject: 'Environment & Ecology' },
      { title: 'Indian Monsoon & El Nino', subject: 'Geography' },
      { title: 'Buddhism & Jainism', subject: 'History & Art & Culture' },
      { title: 'Parliament & Legislative Procedures', subject: 'Polity & Governance' },
      { title: 'Climate Change & UNFCCC', subject: 'Environment & Ecology' },
    ];

    for (const bench of coreBenchmarkTopics) {
      const normKey = normalizeTopicKey(bench.title);
      if (!mergedMap.has(normKey)) {
        // Check if any global attempt belongs to this topic's matching PYQ set
        const matchingQs = PYQMatchingService.matchQuestionsForTopic(bench.title);
        const matchingIds = new Set(matchingQs.map((q) => q.id));
        const attempts = new Map<
          string,
          { isCorrect: boolean; timeSpentSeconds: number; attemptedAt: string }
        >();

        for (const att of rawGlobalAttempts) {
          if (att.status !== 'unanswered' && matchingIds.has(att.questionId)) {
            attempts.set(att.questionId, {
              isCorrect: att.isCorrect,
              timeSpentSeconds: att.timeSpentSeconds || 35,
              attemptedAt: att.attemptedAtIso,
            });
          }
        }

        mergedMap.set(normKey, {
          displayName: bench.title,
          subject: bench.subject,
          attempts,
          practiceVolume: attempts.size,
        });
      }
    }

    // 4. Build TopicPerformanceStat list with real PYQ counts
    const topics: TopicPerformanceStat[] = [];

    for (const [, entry] of mergedMap.entries()) {
      const matchedQs = PYQMatchingService.matchQuestionsForTopic(entry.displayName);
      const prelimsTotal = matchedQs.filter((q) => q.examType === 'PRELIMS').length;
      const mainsTotal = matchedQs.filter((q) => q.examType === 'MAINS').length;
      const totalQuestions = Math.max(matchedQs.length, entry.attempts.size, 1);

      const attemptValues = Array.from(entry.attempts.values());
      const attemptedCount = Math.min(totalQuestions, attemptValues.length);
      const correctCount = attemptValues.filter((a) => a.isCorrect).length;
      const incorrectCount = Math.max(0, attemptedCount - correctCount);
      const remainingCount = Math.max(0, totalQuestions - attemptedCount);
      const accuracyPct =
        attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

      const totalTime = attemptValues.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);
      const avgTimeSeconds =
        attemptedCount > 0 ? Math.round(totalTime / attemptedCount) : 0;

      const latestIso =
        attemptValues.length > 0
          ? attemptValues
              .map((a) => a.attemptedAt)
              .sort()
              .reverse()[0]
          : null;

      const isCompleted = totalQuestions > 0 && remainingCount === 0;
      const isWeakTopic =
        (attemptedCount >= 1 && accuracyPct < 65) ||
        (attemptedCount === 0 && totalQuestions >= 15);

      topics.push({
        topic: entry.displayName,
        subject: entry.subject,
        totalQuestions,
        prelimsTotal,
        mainsTotal,
        attemptedCount,
        correctCount,
        incorrectCount,
        remainingCount,
        accuracyPct,
        avgTimeSeconds,
        lastPracticedAt: latestIso,
        isCompleted,
        isWeakTopic,
      });
    }

    // Sort: topics with attempts first (by attemptedCount desc), then by totalQuestions desc
    topics.sort((a, b) => {
      if (a.attemptedCount > 0 && b.attemptedCount === 0) return -1;
      if (a.attemptedCount === 0 && b.attemptedCount > 0) return 1;
      if (b.attemptedCount !== a.attemptedCount) return b.attemptedCount - a.attemptedCount;
      return b.totalQuestions - a.totalQuestions;
    });

    // Weak topics: prioritize attempted topics with lowest accuracy, then unattempted high-weight topics
    const weakTopics = [...topics]
      .filter((t) => t.isWeakTopic)
      .sort((a, b) => {
        if (a.attemptedCount > 0 && b.attemptedCount > 0) {
          return a.accuracyPct - b.accuracyPct;
        }
        if (a.attemptedCount > 0) return -1;
        if (b.attemptedCount > 0) return 1;
        return b.totalQuestions - a.totalQuestions;
      })
      .slice(0, 6);

    const frequentlyPracticedTopics = [...topics]
      .filter((t) => t.attemptedCount > 0)
      .sort((a, b) => b.attemptedCount - a.attemptedCount)
      .map((t) => t.topic)
      .slice(0, 6);

    return {
      topics,
      weakTopics,
      frequentlyPracticedTopics,
      bookmarkedCount: bookmarks.length,
      timedTestsCount: timedTests.length,
    };
  }
}
