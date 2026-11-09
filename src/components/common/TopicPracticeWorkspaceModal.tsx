/**
 * Dedicated Topic Search Results & Practice Engine Modal
 * ----------------------------------------------------------------------------
 * Implements:
 * 1. Topic Search Results & Overview Page (Metrics, Related Topics, Multi-Filters, Sorting)
 * 2. Mode A: Untimed Practice Mode (Prelims MCQ + Explanation + Elimination + Retry Incorrect;
 *    Mains Answer Writing + Word Count + Save Draft + Model Approach + AI Evaluation)
 * 3. Mode B: Timed Mode (Configurable Timer & Negative Marking, Question Palette,
 *    Auto-Save to AsyncStorage, Auto-Submit on Timeout, Confirmation Modal, Final Scorecard)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Award,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Flag,
  Grid,
  HelpCircle,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  X,
  XCircle,
} from 'lucide-react-native';
import {
  DEFAULT_TOPIC_SEARCH_FILTERS,
  TopicSearchFilters,
  TopicSearchService,
  TopicSearchSummaryResult,
  TopicSortOption,
} from '@/services/topicSearchService';
import {
  MatchedPYQItem,
  PYQExamType,
  PYQMatchTier,
} from '@/services/pyqMatchingService';
import {
  PrelimsPracticeSubmission,
  TopicPracticeService,
} from '@/services/topicPracticeService';
import {
  ActiveTimedTestSession,
  TimedTestConfig,
  TimedTestFinalResult,
  TimedTestService,
} from '@/services/timedTestService';
import { BookmarkStorageService } from '@/services/bookmarkStorage';
import { DifficultyLevel } from '@/types/prelims';
import { MainsEvaluationRecord } from '@/types/mains';

export interface TopicPracticeWorkspaceModalProps {
  visible: boolean;
  initialTopicQuery: string;
  initialExamScope?: 'ALL' | PYQExamType;
  isDark?: boolean;
  onClose: () => void;
}

type WorkspaceStage =
  | 'overview'
  | 'practice'
  | 'timed_config'
  | 'timed_active'
  | 'timed_result';

export function TopicPracticeWorkspaceModal({
  visible,
  initialTopicQuery,
  initialExamScope = 'ALL',
  isDark = false,
  onClose,
}: TopicPracticeWorkspaceModalProps) {
  const [activeTopicQuery, setActiveTopicQuery] = useState(initialTopicQuery || 'Judicial Review');
  const [stage, setStage] = useState<WorkspaceStage>('overview');
  const [filters, setFilters] = useState<TopicSearchFilters>({
    ...DEFAULT_TOPIC_SEARCH_FILTERS,
    examType: initialExamScope,
  });
  const [visibleFeedCount, setVisibleFeedCount] = useState(15);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // ==========================================================================
  // PRACTICE MODE STATE (MODE A)
  // ==========================================================================
  const [practiceQueue, setPracticeQueue] = useState<MatchedPYQItem[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedPrelimsOption, setSelectedPrelimsOption] = useState<'A' | 'B' | 'C' | 'D' | null>(
    null
  );
  const [prelimsSubmissions, setPrelimsSubmissions] = useState<
    Record<string, PrelimsPracticeSubmission>
  >({});
  const [mainsDraftsText, setMainsDraftsText] = useState<Record<string, string>>({});
  const [mainsSavedTimestamp, setMainsSavedTimestamp] = useState<Record<string, string>>({});
  const [mainsShowApproach, setMainsShowApproach] = useState<Record<string, boolean>>({});
  const [mainsEvaluations, setMainsEvaluations] = useState<Record<string, MainsEvaluationRecord>>(
    {}
  );
  const [isEvaluatingMains, setIsEvaluatingMains] = useState(false);
  const questionStartTimeRef = useRef<number>(0);

  // ==========================================================================
  // TIMED MODE STATE (MODE B)
  // ==========================================================================
  const [savedTimedSession, setSavedTimedSession] = useState<ActiveTimedTestSession | null>(null);
  const [timedConfig, setTimedConfig] = useState<TimedTestConfig>(() =>
    TimedTestService.getDefaultConfig(initialTopicQuery || 'Judicial Review', 'PRELIMS', 20)
  );
  const [activeTimedSession, setActiveTimedSession] = useState<ActiveTimedTestSession | null>(null);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [timedResult, setTimedResult] = useState<TimedTestFinalResult | null>(null);

  const loadInitialBookmarksAndSavedSession = useCallback(async (topicTitle: string) => {
    try {
      const [bIds, savedSess] = await Promise.all([
        BookmarkStorageService.getBookmarkedIds(),
        TimedTestService.loadSavedSession(topicTitle),
      ]);
      setBookmarkedIds(new Set(bIds));
      setSavedTimedSession(savedSess);
    } catch {}
  }, []);

  // Sync when modal opens with a new topic query
  const [prevPropsKey, setPrevPropsKey] = useState('');
  const currentPropsKey = `${visible}_${initialTopicQuery}_${initialExamScope}`;
  if (visible && initialTopicQuery && prevPropsKey !== currentPropsKey) {
    setPrevPropsKey(currentPropsKey);
    if (activeTopicQuery !== initialTopicQuery) {
      setActiveTopicQuery(initialTopicQuery);
    }
    setFilters({
      ...DEFAULT_TOPIC_SEARCH_FILTERS,
      examType: initialExamScope,
    });
    setStage('overview');
    setVisibleFeedCount(15);
  }

  useEffect(() => {
    if (!visible || !initialTopicQuery) return;
    let active = true;
    Promise.all([
      BookmarkStorageService.getBookmarkedIds(),
      TimedTestService.loadSavedSession(initialTopicQuery),
    ])
      .then(([bIds, savedSess]) => {
        if (active) {
          setBookmarkedIds(new Set(bIds));
          setSavedTimedSession(savedSess);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [visible, initialTopicQuery]);

  // Run Topic Search Engine
  const searchResult: TopicSearchSummaryResult = useMemo(() => {
    if (!activeTopicQuery) {
      return TopicSearchService.searchTopic('Judicial Review', filters, false);
    }
    return TopicSearchService.searchTopic(activeTopicQuery, filters, visible);
  }, [activeTopicQuery, filters, visible]);

  // Switch to a Related Topic pill
  const handleSwitchTopic = (newTopic: string) => {
    setActiveTopicQuery(newTopic);
    setFilters((prev) => ({
      ...DEFAULT_TOPIC_SEARCH_FILTERS,
      examType: prev.examType,
      sortBy: prev.sortBy,
    }));
    setVisibleFeedCount(15);
    setStage('overview');
    void loadInitialBookmarksAndSavedSession(newTopic);
  };

  // Toggle Bookmark for a Prelims Question
  const handleToggleBookmark = async (item: MatchedPYQItem) => {
    if (!item.prelimsQuestion) return;
    const isNowBookmarked = await TopicPracticeService.toggleBookmark(item.prelimsQuestion);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isNowBookmarked) next.add(item.id);
      else next.delete(item.id);
      return next;
    });
  };

  // ==========================================================================
  // LAUNCH PRACTICE MODE (MODE A)
  // ==========================================================================
  const handleStartPracticeMode = async (startAtIndex = 0, customQueue?: MatchedPYQItem[]) => {
    const queue =
      customQueue && customQueue.length > 0 ? customQueue : searchResult.filteredItems;
    if (queue.length === 0) return;

    setPracticeQueue(queue);
    const safeIdx = Math.max(0, Math.min(startAtIndex, queue.length - 1));
    setPracticeIndex(safeIdx);

    const currentItem = queue[safeIdx];
    const existingSub = prelimsSubmissions[currentItem.id];
    setSelectedPrelimsOption(existingSub ? existingSub.selectedOption : null);
    questionStartTimeRef.current = Date.now();

    if (currentItem.examType === 'MAINS' && currentItem.mainsQuestion) {
      const draft = await TopicPracticeService.loadMainsDraft(currentItem.mainsQuestion.id);
      if (draft && draft.answer_text) {
        setMainsDraftsText((prev) => ({
          ...prev,
          [currentItem.id]: draft.answer_text,
        }));
      }
    }

    setStage('practice');
  };

  const currentPracticeItem: MatchedPYQItem | undefined = practiceQueue[practiceIndex];

  const handleNavigatePracticeQuestion = async (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= practiceQueue.length) return;
    setPracticeIndex(nextIdx);
    const target = practiceQueue[nextIdx];
    const existingSub = prelimsSubmissions[target.id];
    setSelectedPrelimsOption(existingSub ? existingSub.selectedOption : null);
    questionStartTimeRef.current = Date.now();

    if (target.examType === 'MAINS' && target.mainsQuestion && !mainsDraftsText[target.id]) {
      const draft = await TopicPracticeService.loadMainsDraft(target.mainsQuestion.id);
      if (draft?.answer_text) {
        setMainsDraftsText((prev) => ({
          ...prev,
          [target.id]: draft.answer_text,
        }));
      }
    }
  };

  const handleSubmitPrelimsPractice = async () => {
    if (!currentPracticeItem || !selectedPrelimsOption) return;
    const elapsedSecs = Math.max(
      1,
      Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    );
    const submission = await TopicPracticeService.submitPrelimsPracticeAnswer({
      topicQuery: searchResult.displayTitle,
      item: currentPracticeItem,
      selectedOption: selectedPrelimsOption,
      timeSpentSeconds: elapsedSecs,
    });
    setPrelimsSubmissions((prev) => ({
      ...prev,
      [currentPracticeItem.id]: submission,
    }));
  };

  const handleSaveMainsDraft = async () => {
    if (!currentPracticeItem || currentPracticeItem.examType !== 'MAINS') return;
    const text = mainsDraftsText[currentPracticeItem.id] || '';
    const elapsedSecs = Math.max(
      1,
      Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    );
    const draft = await TopicPracticeService.saveMainsPracticeDraft({
      topicQuery: searchResult.displayTitle,
      item: currentPracticeItem,
      answerText: text,
      timeSpentSeconds: elapsedSecs,
    });
    setMainsSavedTimestamp((prev) => ({
      ...prev,
      [currentPracticeItem.id]: new Date(draft.last_saved_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  };

  const handleEvaluateMainsAnswer = async () => {
    if (!currentPracticeItem || currentPracticeItem.examType !== 'MAINS') return;
    const text = (mainsDraftsText[currentPracticeItem.id] || '').trim();
    if (text.length < 15) return;

    setIsEvaluatingMains(true);
    try {
      const elapsedSecs = Math.max(
        1,
        Math.round((Date.now() - questionStartTimeRef.current) / 1000)
      );
      const evaluation = await TopicPracticeService.submitMainsForEvaluation({
        topicQuery: searchResult.displayTitle,
        item: currentPracticeItem,
        answerText: text,
        timeSpentSeconds: elapsedSecs,
      });
      setMainsEvaluations((prev) => ({
        ...prev,
        [currentPracticeItem.id]: evaluation,
      }));
    } finally {
      setIsEvaluatingMains(false);
    }
  };

  // Practice Session summary metrics
  const practiceMetrics = useMemo(() => {
    const subs = Object.values(prelimsSubmissions);
    const attemptedCount = subs.length;
    const correctCount = subs.filter((s) => s.isCorrect).length;
    const incorrectCount = subs.filter((s) => !s.isCorrect).length;
    const accuracyPct =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    return {
      attemptedCount,
      correctCount,
      incorrectCount,
      accuracyPct,
    };
  }, [prelimsSubmissions]);

  const handleRetryIncorrectQuestions = () => {
    const incorrectItems = TopicPracticeService.buildRetryIncorrectQueue(
      practiceQueue,
      prelimsSubmissions
    );
    if (incorrectItems.length === 0) return;

    // Clear previous submissions for those incorrect items so user can re-attempt fresh
    setPrelimsSubmissions((prev) => {
      const copy = { ...prev };
      incorrectItems.forEach((it) => delete copy[it.id]);
      return copy;
    });

    void handleStartPracticeMode(0, incorrectItems);
  };

  // ==========================================================================
  // TIMED MODE HANDLERS & LIVE COUNTDOWN TIMER (MODE B)
  // ==========================================================================
  const handleOpenTimedConfig = () => {
    const prelimsPoolCount = searchResult.filteredItems.filter(
      (i) => i.examType === 'PRELIMS'
    ).length;
    const mainsPoolCount = searchResult.filteredItems.filter(
      (i) => i.examType === 'MAINS'
    ).length;

    const preferredMode: PYQExamType =
      filters.examType === 'MAINS' || (prelimsPoolCount === 0 && mainsPoolCount > 0)
        ? 'MAINS'
        : 'PRELIMS';

    const avail = preferredMode === 'PRELIMS' ? prelimsPoolCount : mainsPoolCount;
    setTimedConfig(
      TimedTestService.getDefaultConfig(searchResult.displayTitle, preferredMode, avail)
    );
    setStage('timed_config');
  };

  const handleBeginTimedTest = async () => {
    const session = await TimedTestService.startSession(
      timedConfig,
      searchResult.allMatchedItems
    );
    setActiveTimedSession(session);
    setShowPaletteDrawer(false);
    setShowSubmitConfirmModal(false);
    setStage('timed_active');
  };

  const handleResumeSavedTimedTest = () => {
    if (!savedTimedSession) return;
    setActiveTimedSession(savedTimedSession);
    setShowPaletteDrawer(false);
    setShowSubmitConfirmModal(false);
    setStage('timed_active');
  };

  const handleFinalizeTimedTest = useCallback(async (sessionToSubmit: ActiveTimedTestSession) => {
    setShowSubmitConfirmModal(false);
    const finalRes = await TimedTestService.submitTimedTest(sessionToSubmit);
    setTimedResult(finalRes);
    setActiveTimedSession(null);
    setSavedTimedSession(null);
    setStage('timed_result');
  }, []);

  // 1-second countdown interval during Timed Mode
  const hasActiveTimedSession = Boolean(activeTimedSession);
  useEffect(() => {
    if (stage !== 'timed_active' || !hasActiveTimedSession) return;

    const interval = setInterval(() => {
      setActiveTimedSession((prev) => {
        if (!prev) return null;
        const currentQ = prev.questions[prev.currentIndex];
        const nextRemaining = prev.remainingSeconds - 1;

        const updatedResponses = { ...prev.responses };
        if (currentQ && updatedResponses[currentQ.id]) {
          updatedResponses[currentQ.id] = {
            ...updatedResponses[currentQ.id],
            timeSpentSeconds: (updatedResponses[currentQ.id].timeSpentSeconds || 0) + 1,
          };
        }

        const updatedSession: ActiveTimedTestSession = {
          ...prev,
          remainingSeconds: Math.max(0, nextRemaining),
          responses: updatedResponses,
        };

        // Auto-save every 5 seconds
        if (nextRemaining % 5 === 0) {
          void TimedTestService.saveActiveSession(updatedSession);
        }

        // Auto-submit when time expires
        if (nextRemaining <= 0) {
          clearInterval(interval);
          void handleFinalizeTimedTest(updatedSession);
        }

        return updatedSession;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, hasActiveTimedSession, handleFinalizeTimedTest]);

  const updateTimedResponse = (
    questionId: string,
    updater: (prev: ActiveTimedTestSession['responses'][string]) => ActiveTimedTestSession['responses'][string]
  ) => {
    setActiveTimedSession((prev) => {
      if (!prev) return null;
      const existing = prev.responses[questionId] || {
        questionId,
        selectedOption: null,
        mainsAnswerText: '',
        markedForReview: false,
        visited: true,
        timeSpentSeconds: 0,
      };
      const nextResp = updater(existing);
      const nextSession: ActiveTimedTestSession = {
        ...prev,
        responses: {
          ...prev.responses,
          [questionId]: nextResp,
        },
      };
      void TimedTestService.saveActiveSession(nextSession);
      return nextSession;
    });
  };

  const navigateTimedQuestion = (targetIdx: number) => {
    setActiveTimedSession((prev) => {
      if (!prev || targetIdx < 0 || targetIdx >= prev.questions.length) return prev;
      const targetQ = prev.questions[targetIdx];
      const existingResp = prev.responses[targetQ.id];
      const nextSession: ActiveTimedTestSession = {
        ...prev,
        currentIndex: targetIdx,
        responses: {
          ...prev.responses,
          [targetQ.id]: {
            ...existingResp,
            visited: true,
          },
        },
      };
      void TimedTestService.saveActiveSession(nextSession);
      return nextSession;
    });
  };

  // Palette summary counts for Timed Mode
  const timedPaletteCounts = useMemo(() => {
    if (!activeTimedSession) {
      return { attempted: 0, unanswered: 0, marked: 0, unvisited: 0 };
    }
    let attempted = 0;
    let unanswered = 0;
    let marked = 0;
    let unvisited = 0;

    for (const q of activeTimedSession.questions) {
      const st = TimedTestService.getPaletteStatus(
        activeTimedSession.responses[q.id],
        activeTimedSession.config.examMode
      );
      if (st === 'attempted') attempted++;
      else if (st === 'attempted_and_marked') {
        attempted++;
        marked++;
      } else if (st === 'marked_for_review') marked++;
      else if (st === 'unanswered') unanswered++;
      else unvisited++;
    }
    return { attempted, unanswered, marked, unvisited };
  }, [activeTimedSession]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Theme colors
  const colors = {
    bg: isDark ? '#0B1018' : '#FAF9F6',
    surface: isDark ? '#141C28' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1B2536' : '#F3F0EA',
    border: isDark ? '#253244' : '#E6E1D6',
    textPrimary: isDark ? '#F0F4F8' : '#1C2433',
    textSecondary: isDark ? '#9DA8B9' : '#5A6578',
    textMuted: isDark ? '#6E7A8E' : '#8892A6',
    accent: '#FF9500',
    accentSoft: isDark ? 'rgba(255, 149, 0, 0.16)' : '#FFF4E5',
    success: '#10B981',
    successSoft: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
    danger: '#EF4444',
    dangerSoft: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
    purple: '#8B5CF6',
    purpleSoft: isDark ? 'rgba(139, 92, 246, 0.18)' : '#F3E8FF',
    blue: '#3B82F6',
    blueSoft: isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF',
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* ================================================================= */}
        {/* TOP NAVIGATION BAR                                                */}
        {/* ================================================================= */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              onPress={() => {
                if (stage === 'overview') {
                  onClose();
                } else {
                  setStage('overview');
                }
              }}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <ArrowLeft size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={[styles.topBarTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {searchResult.displayTitle}
              </Text>
              <Text style={[styles.topBarSub, { color: colors.textSecondary }]}>
                {stage === 'overview'
                  ? `${searchResult.totalAvailable} Official UPSC PYQs (${searchResult.yearRange.label})`
                  : stage === 'practice'
                  ? `Practice Mode • Question ${practiceIndex + 1} of ${practiceQueue.length}`
                  : stage === 'timed_active'
                  ? `Timed Mode • ${activeTimedSession?.config.examMode}`
                  : stage === 'timed_result'
                  ? 'Timed Test Scorecard & Review'
                  : 'Configure Timed Test'}
              </Text>
            </View>
          </View>

          {stage === 'timed_active' && activeTimedSession ? (
            <View style={styles.timedHeaderRight}>
              <View
                style={[
                  styles.timerPill,
                  {
                    backgroundColor:
                      activeTimedSession.remainingSeconds < 120
                        ? colors.dangerSoft
                        : colors.accentSoft,
                  },
                ]}
              >
                <Clock
                  size={15}
                  color={
                    activeTimedSession.remainingSeconds < 120
                      ? colors.danger
                      : colors.accent
                  }
                />
                <Text
                  style={[
                    styles.timerText,
                    {
                      color:
                        activeTimedSession.remainingSeconds < 120
                          ? colors.danger
                          : colors.accent,
                    },
                  ]}
                >
                  {formatTimer(activeTimedSession.remainingSeconds)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowPaletteDrawer((p) => !p)}
                style={[
                  styles.paletteToggleBtn,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Grid size={16} color={colors.textPrimary} />
                <Text style={[styles.paletteToggleText, { color: colors.textPrimary }]}>
                  Palette
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ================================================================= */}
        {/* STAGE 1: TOPIC SEARCH RESULTS & OVERVIEW PAGE                     */}
        {/* ================================================================= */}
        {stage === 'overview' && (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Topic Summary & Modes Header Card */}
            <View
              style={[
                styles.heroCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.topicHeaderTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroHeading, { color: colors.textPrimary }]}>
                    {searchResult.displayTitle}
                  </Text>
                  <View style={styles.topicMetaLine}>
                    <Text style={[styles.metaText, { color: colors.accent, fontWeight: '700' }]}>
                      {searchResult.totalAvailable} PYQs
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {searchResult.prelimsAvailable} Prelims
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {searchResult.mainsAvailable} Mains
                    </Text>
                    <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {searchResult.yearRange.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Related Concepts Chips */}
              {searchResult.relatedTopics.length > 0 && (
                <View style={styles.relatedRow}>
                  <Text style={[styles.relatedLabel, { color: colors.textMuted }]}>Related:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relatedScroll}
                  >
                    {searchResult.relatedTopics.slice(0, 8).map((rel) => (
                      <TouchableOpacity
                        key={rel.title}
                        onPress={() => handleSwitchTopic(rel.title)}
                        style={[
                          styles.relatedChip,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.relatedChipText, { color: colors.textPrimary }]}>
                          {rel.title}
                        </Text>
                        <Text style={[styles.relatedChipCount, { color: colors.accent }]}>
                          ({rel.totalCount})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Clean Practice Mode & Timed Mode Action Cards */}
              <View style={styles.launchModesRow}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={searchResult.filteredItems.length === 0}
                  onPress={() => void handleStartPracticeMode(0)}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: colors.accent,
                      opacity: searchResult.filteredItems.length === 0 ? 0.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.modeIconCirclePrimary}>
                    <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.modeCardHeader}>
                      <Text style={styles.modeCardTitleLight}>Practice Mode</Text>
                      <View style={styles.modeBadgeLight}>
                        <Text style={styles.modeBadgeLightText}>
                          {searchResult.filteredItems.length} Qs
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.modeCardSubLight}>
                      Untimed • Instant Explanations & Notes
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={searchResult.allMatchedItems.length === 0}
                  onPress={handleOpenTimedConfig}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View
                    style={[styles.modeIconCircleSecondary, { backgroundColor: colors.accentSoft }]}
                  >
                    <Timer size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.modeCardHeader}>
                      <Text style={[styles.modeCardTitle, { color: colors.textPrimary }]}>
                        Timed Mode
                      </Text>
                      <View
                        style={[styles.modeBadgeDark, { backgroundColor: colors.surface }]}
                      >
                        <Text style={[styles.modeBadgeDarkText, { color: colors.textSecondary }]}>
                          Exam Test
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.modeCardSub, { color: colors.textSecondary }]}>
                      Timer & Negative Marking (-0.66)
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Saved In-Progress Timed Session Recovery Banner */}
              {savedTimedSession && (
                <View
                  style={[
                    styles.resumeBanner,
                    { backgroundColor: colors.blueSoft, borderColor: colors.blue },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resumeBannerTitle, { color: colors.textPrimary }]}>
                      Unfinished Timed Test Found ({savedTimedSession.config.topicTitle})
                    </Text>
                    <Text style={[styles.resumeBannerSub, { color: colors.textSecondary }]}>
                      {formatTimer(savedTimedSession.remainingSeconds)} remaining •{' '}
                      {savedTimedSession.questions.length} questions
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleResumeSavedTimedTest}
                    style={[styles.resumeBtn, { backgroundColor: colors.blue }]}
                  >
                    <Text style={styles.resumeBtnText}>Resume</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Filter & Sort Controls Strip */}
            <View
              style={[
                styles.filterBarCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Exam Type Segmented Pills: All / Prelims / Mains */}
              <View style={styles.examSegmentRow}>
                <View style={styles.examSegmentGroup}>
                  {(['ALL', 'PRELIMS', 'MAINS'] as const).map((typeKey) => {
                    const active = filters.examType === typeKey;
                    const count =
                      typeKey === 'ALL'
                        ? searchResult.totalAvailable
                        : typeKey === 'PRELIMS'
                        ? searchResult.prelimsAvailable
                        : searchResult.mainsAvailable;
                    return (
                      <TouchableOpacity
                        key={typeKey}
                        onPress={() => setFilters((f) => ({ ...f, examType: typeKey }))}
                        style={[
                          styles.examTypePill,
                          {
                            backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                            borderColor: active ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.examTypePillText,
                            { color: active ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {typeKey === 'ALL'
                            ? `All (${count})`
                            : typeKey === 'PRELIMS'
                            ? `Prelims (${count})`
                            : `Mains (${count})`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={() => setShowFiltersPanel((p) => !p)}
                  style={[
                    styles.toggleFilterBtn,
                    {
                      backgroundColor: showFiltersPanel ? colors.accentSoft : colors.surfaceSubtle,
                      borderColor: showFiltersPanel ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Filter size={14} color={showFiltersPanel ? colors.accent : colors.textPrimary} />
                  <Text
                    style={[
                      styles.toggleFilterBtnText,
                      { color: showFiltersPanel ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    Filters & Sort
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Expandable Multi-Dimensional Filter Panel */}
              {showFiltersPanel && (
                <View style={[styles.expandedFiltersBox, { borderTopColor: colors.border }]}>
                  {/* Sort By */}
                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
                      SORT BY:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.filterChipsRow}>
                        {(
                          [
                            { id: 'relevance', label: 'Relevance' },
                            { id: 'latest', label: 'Latest First' },
                            { id: 'oldest', label: 'Oldest First' },
                            { id: 'difficulty', label: 'Difficulty' },
                          ] as { id: TopicSortOption; label: string }[]
                        ).map((s) => {
                          const active = filters.sortBy === s.id;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              onPress={() => setFilters((f) => ({ ...f, sortBy: s.id }))}
                              style={[
                                styles.smallFilterChip,
                                {
                                  backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                                  borderColor: active ? colors.accent : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallFilterChipText,
                                  { color: active ? '#FFFFFF' : colors.textPrimary },
                                ]}
                              >
                                {s.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* GS Paper Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
                      GS PAPER:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.filterChipsRow}>
                        <TouchableOpacity
                          onPress={() => setFilters((f) => ({ ...f, gsPaper: 'ALL' }))}
                          style={[
                            styles.smallFilterChip,
                            {
                              backgroundColor:
                                filters.gsPaper === 'ALL' ? colors.accent : colors.surfaceSubtle,
                              borderColor:
                                filters.gsPaper === 'ALL' ? colors.accent : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallFilterChipText,
                              {
                                color:
                                  filters.gsPaper === 'ALL' ? '#FFFFFF' : colors.textPrimary,
                              },
                            ]}
                          >
                            All Papers
                          </Text>
                        </TouchableOpacity>
                        {searchResult.availableFacets.gsPapers.map((paper) => {
                          const active = filters.gsPaper === paper;
                          return (
                            <TouchableOpacity
                              key={paper}
                              onPress={() => setFilters((f) => ({ ...f, gsPaper: paper }))}
                              style={[
                                styles.smallFilterChip,
                                {
                                  backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                                  borderColor: active ? colors.accent : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallFilterChipText,
                                  { color: active ? '#FFFFFF' : colors.textPrimary },
                                ]}
                              >
                                {paper}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Year Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
                      YEAR:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.filterChipsRow}>
                        <TouchableOpacity
                          onPress={() => setFilters((f) => ({ ...f, year: 'ALL' }))}
                          style={[
                            styles.smallFilterChip,
                            {
                              backgroundColor:
                                filters.year === 'ALL' ? colors.accent : colors.surfaceSubtle,
                              borderColor:
                                filters.year === 'ALL' ? colors.accent : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallFilterChipText,
                              { color: filters.year === 'ALL' ? '#FFFFFF' : colors.textPrimary },
                            ]}
                          >
                            All Years
                          </Text>
                        </TouchableOpacity>
                        {searchResult.availableFacets.years.map((yr) => {
                          const active = filters.year === yr;
                          return (
                            <TouchableOpacity
                              key={yr}
                              onPress={() => setFilters((f) => ({ ...f, year: yr }))}
                              style={[
                                styles.smallFilterChip,
                                {
                                  backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                                  borderColor: active ? colors.accent : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallFilterChipText,
                                  { color: active ? '#FFFFFF' : colors.textPrimary },
                                ]}
                              >
                                {yr}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Difficulty & Match Tier Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
                      DIFFICULTY & MATCH LEVEL:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.filterChipsRow}>
                        {(['ALL', 'Easy', 'Medium', 'Hard'] as ('ALL' | DifficultyLevel)[]).map(
                          (diff) => {
                            const active = filters.difficulty === diff;
                            return (
                              <TouchableOpacity
                                key={diff}
                                onPress={() => setFilters((f) => ({ ...f, difficulty: diff }))}
                                style={[
                                  styles.smallFilterChip,
                                  {
                                    backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                                    borderColor: active ? colors.accent : colors.border,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.smallFilterChipText,
                                    { color: active ? '#FFFFFF' : colors.textPrimary },
                                  ]}
                                >
                                  {diff === 'ALL' ? 'All Difficulties' : diff}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}

                        {(['ALL', 'exact', 'conceptual'] as ('ALL' | PYQMatchTier)[]).map(
                          (tier) => {
                            const active = filters.matchTier === tier;
                            return (
                              <TouchableOpacity
                                key={tier}
                                onPress={() => setFilters((f) => ({ ...f, matchTier: tier }))}
                                style={[
                                  styles.smallFilterChip,
                                  {
                                    backgroundColor: active ? colors.blue : colors.surfaceSubtle,
                                    borderColor: active ? colors.blue : colors.border,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.smallFilterChipText,
                                    { color: active ? '#FFFFFF' : colors.textPrimary },
                                  ]}
                                >
                                  {tier === 'ALL'
                                    ? 'All Match Levels'
                                    : tier === 'exact'
                                    ? 'Exact Match Only'
                                    : 'Conceptual Match'}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Question Type Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupLabel, { color: colors.textMuted }]}>
                      QUESTION FORMAT:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.filterChipsRow}>
                        <TouchableOpacity
                          onPress={() => setFilters((f) => ({ ...f, questionType: 'ALL' }))}
                          style={[
                            styles.smallFilterChip,
                            {
                              backgroundColor:
                                filters.questionType === 'ALL'
                                  ? colors.accent
                                  : colors.surfaceSubtle,
                              borderColor:
                                filters.questionType === 'ALL' ? colors.accent : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallFilterChipText,
                              {
                                color:
                                  filters.questionType === 'ALL'
                                    ? '#FFFFFF'
                                    : colors.textPrimary,
                              },
                            ]}
                          >
                            All Formats
                          </Text>
                        </TouchableOpacity>
                        {searchResult.availableFacets.questionTypes.map((qt) => {
                          const active = filters.questionType === qt;
                          return (
                            <TouchableOpacity
                              key={qt}
                              onPress={() => setFilters((f) => ({ ...f, questionType: qt }))}
                              style={[
                                styles.smallFilterChip,
                                {
                                  backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                                  borderColor: active ? colors.accent : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallFilterChipText,
                                  { color: active ? '#FFFFFF' : colors.textPrimary },
                                ]}
                              >
                                {qt.replace(/_/g, ' ')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    onPress={() => setFilters(DEFAULT_TOPIC_SEARCH_FILTERS)}
                    style={styles.resetFiltersLink}
                  >
                    <RotateCcw size={12} color={colors.accent} />
                    <Text style={[styles.resetFiltersText, { color: colors.accent }]}>
                      Reset All Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Questions List Feed */}
            {searchResult.filteredItems.length === 0 ? (
              <View
                style={[
                  styles.emptyStateBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <HelpCircle size={32} color={colors.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                  No PYQs match the selected filter combination
                </Text>
                <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                  Try switching from Prelims/Mains filter to &ldquo;All&rdquo; or resetting the year filter.
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters(DEFAULT_TOPIC_SEARCH_FILTERS)}
                  style={[styles.resetBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.resetBtnText}>Show All Matching Questions</Text>
                </TouchableOpacity>
              </View>
            ) : (
              searchResult.filteredItems.slice(0, visibleFeedCount).map((item, idx) => {
                const isPrelims = item.examType === 'PRELIMS';
                const pq = item.prelimsQuestion;
                const mq = item.mainsQuestion;
                const isBookmarked = bookmarkedIds.has(item.id);
                const submitted = prelimsSubmissions[item.id];

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => void handleStartPracticeMode(idx)}
                    style={[
                      styles.questionCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    {/* Top Badges Row */}
                    <View style={styles.qCardTopRow}>
                      <View style={styles.qCardBadgesWrap}>
                        <View
                          style={[
                            styles.examBadge,
                            {
                              backgroundColor: isPrelims ? colors.accentSoft : colors.blueSoft,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.examBadgeText,
                              { color: isPrelims ? colors.accent : colors.blue },
                            ]}
                          >
                            {item.examType} • {item.gsPaper} • {item.year}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.matchTierBadge,
                            {
                              backgroundColor:
                                item.matchTier === 'exact'
                                  ? colors.successSoft
                                  : item.matchTier === 'conceptual'
                                  ? colors.purpleSoft
                                  : colors.surfaceSubtle,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.matchTierText,
                              {
                                color:
                                  item.matchTier === 'exact'
                                    ? colors.success
                                    : item.matchTier === 'conceptual'
                                    ? colors.purple
                                    : colors.textSecondary,
                              },
                            ]}
                          >
                            {item.matchTier === 'exact'
                              ? 'Exact Match'
                              : item.matchTier === 'conceptual'
                              ? 'Conceptual Match'
                              : 'Syllabus Linked'}{' '}
                            ({item.relevanceScore}%)
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.diffBadge,
                            { backgroundColor: colors.surfaceSubtle },
                          ]}
                        >
                          <Text style={[styles.diffBadgeText, { color: colors.textSecondary }]}>
                            {item.difficulty}
                          </Text>
                        </View>

                        {!isPrelims && mq && (
                          <View
                            style={[
                              styles.diffBadge,
                              { backgroundColor: colors.surfaceSubtle },
                            ]}
                          >
                            <Text style={[styles.diffBadgeText, { color: colors.textPrimary }]}>
                              {mq.marks} Marks • {mq.word_limit} Words
                            </Text>
                          </View>
                        )}
                      </View>

                      {isPrelims && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            void handleToggleBookmark(item);
                          }}
                          style={styles.bookmarkBtn}
                        >
                          <Bookmark
                            size={17}
                            color={isBookmarked ? colors.accent : colors.textMuted}
                            fill={isBookmarked ? colors.accent : 'none'}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Subject & Topic Breadcrumb */}
                    <Text style={[styles.qBreadcrumb, { color: colors.textMuted }]}>
                      {item.subject} › {item.topic}
                      {item.subtopic && item.subtopic !== item.topic ? ` › ${item.subtopic}` : ''}
                    </Text>

                    {/* Question Text ONLY — Options are deliberately not shown here per clean layout */}
                    <Text style={[styles.qMainText, { color: colors.textPrimary }]}>
                      Q{idx + 1}.{' '}
                      {isPrelims && pq
                        ? pq.questionText
                        : mq
                        ? mq.text_english
                        : ''}
                    </Text>

                    {/* Match Reason & Action Footer */}
                    <View style={[styles.qCardFooter, { borderTopColor: colors.border }]}>
                      <Text
                        style={[styles.matchReasonText, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.matchReason}
                      </Text>

                      <View
                        style={[styles.practiceSingleBtn, { backgroundColor: colors.accentSoft }]}
                      >
                        <Text style={[styles.practiceSingleBtnText, { color: colors.accent }]}>
                          {submitted
                            ? submitted.isCorrect
                              ? 'Solved (Correct) • Review'
                              : 'Solved (Incorrect) • Retry'
                            : isPrelims
                            ? 'Practice Question →'
                            : 'Write Answer →'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Load More Button */}
            {visibleFeedCount < searchResult.filteredItems.length && (
              <TouchableOpacity
                onPress={() => setVisibleFeedCount((c) => c + 20)}
                style={[
                  styles.loadMoreBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.loadMoreBtnText, { color: colors.accent }]}>
                  Load More Questions ({searchResult.filteredItems.length - visibleFeedCount}{' '}
                  remaining)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* ================================================================= */}
        {/* STAGE 2: MODE A — UNTIMED PRACTICE MODE (PRELIMS & MAINS)         */}
        {/* ================================================================= */}
        {stage === 'practice' && currentPracticeItem && (
          <View style={styles.flexOne}>
            {/* Session Progress Strip */}
            <View
              style={[
                styles.practiceStatsStrip,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.practiceStatsLeft}>
                <Text style={[styles.practiceStatItem, { color: colors.textPrimary }]}>
                  Attempted: <Text style={{ fontWeight: '800' }}>{practiceMetrics.attemptedCount}</Text>
                </Text>
                <Text style={[styles.practiceStatItem, { color: colors.success }]}>
                  Correct: <Text style={{ fontWeight: '800' }}>{practiceMetrics.correctCount}</Text>
                </Text>
                <Text style={[styles.practiceStatItem, { color: colors.danger }]}>
                  Incorrect: <Text style={{ fontWeight: '800' }}>{practiceMetrics.incorrectCount}</Text>
                </Text>
                <Text style={[styles.practiceStatItem, { color: colors.accent }]}>
                  Accuracy: <Text style={{ fontWeight: '800' }}>{practiceMetrics.accuracyPct}%</Text>
                </Text>
              </View>

              {practiceMetrics.incorrectCount > 0 && (
                <TouchableOpacity
                  onPress={handleRetryIncorrectQuestions}
                  style={[styles.retryIncorrectBtn, { backgroundColor: colors.dangerSoft }]}
                >
                  <RotateCcw size={12} color={colors.danger} />
                  <Text style={[styles.retryIncorrectText, { color: colors.danger }]}>
                    Retry Incorrect ({practiceMetrics.incorrectCount})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Question Card */}
              <View
                style={[
                  styles.practiceWorkspaceCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {/* Header Badges */}
                <View style={styles.qCardTopRow}>
                  <View style={styles.qCardBadgesWrap}>
                    <View
                      style={[
                        styles.examBadge,
                        {
                          backgroundColor:
                            currentPracticeItem.examType === 'PRELIMS'
                              ? colors.accentSoft
                              : colors.blueSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.examBadgeText,
                          {
                            color:
                              currentPracticeItem.examType === 'PRELIMS'
                                ? colors.accent
                                : colors.blue,
                          },
                        ]}
                      >
                        UPSC {currentPracticeItem.examType} {currentPracticeItem.year} •{' '}
                        {currentPracticeItem.gsPaper}
                      </Text>
                    </View>

                    <View
                      style={[styles.diffBadge, { backgroundColor: colors.surfaceSubtle }]}
                    >
                      <Text style={[styles.diffBadgeText, { color: colors.textSecondary }]}>
                        {currentPracticeItem.subject} › {currentPracticeItem.subtopic}
                      </Text>
                    </View>
                  </View>

                  {currentPracticeItem.examType === 'PRELIMS' && (
                    <TouchableOpacity
                      onPress={() => void handleToggleBookmark(currentPracticeItem)}
                      style={styles.bookmarkBtn}
                    >
                      <Bookmark
                        size={19}
                        color={
                          bookmarkedIds.has(currentPracticeItem.id)
                            ? colors.accent
                            : colors.textMuted
                        }
                        fill={
                          bookmarkedIds.has(currentPracticeItem.id) ? colors.accent : 'none'
                        }
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ========================================================= */}
                {/* PRELIMS PRACTICE VIEW                                     */}
                {/* ========================================================= */}
                {currentPracticeItem.examType === 'PRELIMS' &&
                  currentPracticeItem.prelimsQuestion && (
                    <>
                      {Boolean(currentPracticeItem.prelimsQuestion.passageText) && (
                        <View
                          style={[
                            styles.passageBox,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.passageLabel, { color: colors.accent }]}>
                            READING PASSAGE:
                          </Text>
                          <Text style={[styles.passageBody, { color: colors.textPrimary }]}>
                            {currentPracticeItem.prelimsQuestion.passageText}
                          </Text>
                        </View>
                      )}

                      <Text style={[styles.practiceQuestionText, { color: colors.textPrimary }]}>
                        {currentPracticeItem.prelimsQuestion.questionText}
                      </Text>

                      {/* Options List */}
                      <View style={styles.practiceOptionsWrap}>
                        {currentPracticeItem.prelimsQuestion.options.map((opt) => {
                          const sub = prelimsSubmissions[currentPracticeItem.id];
                          const isSelected = selectedPrelimsOption === opt.key;
                          const isCorrectOpt = sub && sub.correctOption === opt.key;
                          const isWrongSelected =
                            sub && sub.selectedOption === opt.key && !sub.isCorrect;

                          let bg = colors.surfaceSubtle;
                          let borderCol = colors.border;
                          if (sub) {
                            if (isCorrectOpt) {
                              bg = colors.successSoft;
                              borderCol = colors.success;
                            } else if (isWrongSelected) {
                              bg = colors.dangerSoft;
                              borderCol = colors.danger;
                            }
                          } else if (isSelected) {
                            bg = colors.accentSoft;
                            borderCol = colors.accent;
                          }

                          return (
                            <TouchableOpacity
                              key={opt.key}
                              activeOpacity={0.8}
                              disabled={Boolean(sub)}
                              onPress={() => setSelectedPrelimsOption(opt.key)}
                              style={[
                                styles.practiceOptionRow,
                                { backgroundColor: bg, borderColor: borderCol },
                              ]}
                            >
                              <View
                                style={[
                                  styles.optionLetterCircle,
                                  {
                                    backgroundColor: isCorrectOpt
                                      ? colors.success
                                      : isWrongSelected
                                      ? colors.danger
                                      : isSelected
                                      ? colors.accent
                                      : colors.surface,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.optionLetterText,
                                    {
                                      color:
                                        isCorrectOpt || isWrongSelected || isSelected
                                          ? '#FFFFFF'
                                          : colors.textPrimary,
                                    },
                                  ]}
                                >
                                  {opt.key}
                                </Text>
                              </View>
                              <Text
                                style={[styles.practiceOptionText, { color: colors.textPrimary }]}
                              >
                                {opt.text}
                              </Text>
                              {isCorrectOpt && <CheckCircle2 size={18} color={colors.success} />}
                              {isWrongSelected && <XCircle size={18} color={colors.danger} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Submit Answer Button */}
                      {!prelimsSubmissions[currentPracticeItem.id] && (
                        <TouchableOpacity
                          disabled={!selectedPrelimsOption}
                          onPress={() => void handleSubmitPrelimsPractice()}
                          style={[
                            styles.submitAnswerBtn,
                            {
                              backgroundColor: colors.accent,
                              opacity: selectedPrelimsOption ? 1 : 0.45,
                            },
                          ]}
                        >
                          <Text style={styles.submitAnswerBtnText}>Submit Answer</Text>
                        </TouchableOpacity>
                      )}

                      {/* Detailed Official Explanation & Concept Breakdown */}
                      {prelimsSubmissions[currentPracticeItem.id] && (
                        <View
                          style={[
                            styles.explanationCard,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View style={styles.expHeaderRow}>
                            {prelimsSubmissions[currentPracticeItem.id].isCorrect ? (
                              <CheckCircle2 size={18} color={colors.success} />
                            ) : (
                              <XCircle size={18} color={colors.danger} />
                            )}
                            <Text
                              style={[
                                styles.expVerdictText,
                                {
                                  color: prelimsSubmissions[currentPracticeItem.id].isCorrect
                                    ? colors.success
                                    : colors.danger,
                                },
                              ]}
                            >
                              {prelimsSubmissions[currentPracticeItem.id].isCorrect
                                ? `Correct! Official Answer is Option (${prelimsSubmissions[currentPracticeItem.id].correctOption})`
                                : `Incorrect. Official Answer is Option (${prelimsSubmissions[currentPracticeItem.id].correctOption})`}
                            </Text>
                          </View>

                          <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                            CORE CONCEPT & OFFICIAL EXPLANATION
                          </Text>
                          <Text style={[styles.expCoreConcept, { color: colors.textPrimary }]}>
                            {prelimsSubmissions[currentPracticeItem.id].coreConcept}
                          </Text>
                          <Text style={[styles.expBodyText, { color: colors.textPrimary }]}>
                            {prelimsSubmissions[currentPracticeItem.id].officialExplanation}
                          </Text>

                          <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                            WHY OTHER OPTIONS ARE INCORRECT (ELIMINATION LOGIC)
                          </Text>
                          <Text style={[styles.expBodyText, { color: colors.textSecondary }]}>
                            {prelimsSubmissions[currentPracticeItem.id].whyOthersIncorrect}
                          </Text>

                          <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                            RELATED ARTICLES, CONCEPTS & SOURCE
                          </Text>
                          <View style={styles.hooksWrap}>
                            {prelimsSubmissions[
                              currentPracticeItem.id
                            ].syllabusAndArticleHooks.map((hook, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.hookChip,
                                  {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                  },
                                ]}
                              >
                                <Text style={[styles.hookChipText, { color: colors.textPrimary }]}>
                                  {hook}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text style={[styles.trendNoteText, { color: colors.textMuted }]}>
                            {prelimsSubmissions[currentPracticeItem.id].upscTrendNote}
                          </Text>
                        </View>
                      )}
                    </>
                  )}

                {/* ========================================================= */}
                {/* MAINS PRACTICE VIEW                                       */}
                {/* ========================================================= */}
                {currentPracticeItem.examType === 'MAINS' &&
                  currentPracticeItem.mainsQuestion && (
                    <>
                      <View
                        style={[
                          styles.mainsMetaBanner,
                          {
                            backgroundColor: colors.blueSoft,
                            borderColor: colors.blue,
                          },
                        ]}
                      >
                        <Text style={[styles.mainsMetaText, { color: colors.blue }]}>
                          Paper: {currentPracticeItem.mainsQuestion.paper_id} (
                          {currentPracticeItem.mainsQuestion.paper_title}) • Q.
                          {currentPracticeItem.mainsQuestion.question_number} •{' '}
                          {currentPracticeItem.mainsQuestion.marks} Marks • Word Limit:{' '}
                          {currentPracticeItem.mainsQuestion.word_limit} Words
                        </Text>
                      </View>

                      {Boolean(currentPracticeItem.mainsQuestion.scenario_english) && (
                        <View
                          style={[
                            styles.passageBox,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.passageLabel, { color: colors.purple }]}>
                            CASE STUDY SCENARIO:
                          </Text>
                          <Text style={[styles.passageBody, { color: colors.textPrimary }]}>
                            {currentPracticeItem.mainsQuestion.scenario_english}
                          </Text>
                        </View>
                      )}

                      <Text style={[styles.practiceQuestionText, { color: colors.textPrimary }]}>
                        {currentPracticeItem.mainsQuestion.text_english}
                      </Text>

                      {/* Answer Writing Editor */}
                      <View style={styles.mainsEditorHeader}>
                        <Text style={[styles.mainsEditorLabel, { color: colors.textSecondary }]}>
                          YOUR MAINS ANSWER DRAFT
                        </Text>
                        <Text
                          style={[
                            styles.wordCounterText,
                            {
                              color:
                                TopicPracticeService.countWords(
                                  mainsDraftsText[currentPracticeItem.id] || ''
                                ) > currentPracticeItem.mainsQuestion.word_limit
                                  ? colors.danger
                                  : colors.accent,
                            },
                          ]}
                        >
                          {TopicPracticeService.countWords(
                            mainsDraftsText[currentPracticeItem.id] || ''
                          )}{' '}
                          / {currentPracticeItem.mainsQuestion.word_limit} words
                          {mainsSavedTimestamp[currentPracticeItem.id]
                            ? ` • Saved at ${mainsSavedTimestamp[currentPracticeItem.id]}`
                            : ''}
                        </Text>
                      </View>

                      <TextInput
                        multiline
                        value={mainsDraftsText[currentPracticeItem.id] || ''}
                        onChangeText={(txt) =>
                          setMainsDraftsText((prev) => ({
                            ...prev,
                            [currentPracticeItem.id]: txt,
                          }))
                        }
                        placeholder="Structure your answer with Introduction, Body (numbered points & constitutional/factual substantiation), and Way Forward Conclusion..."
                        placeholderTextColor={colors.textMuted}
                        style={[
                          styles.mainsTextArea,
                          {
                            backgroundColor: colors.surfaceSubtle,
                            borderColor: colors.border,
                            color: colors.textPrimary,
                          },
                        ]}
                      />

                      <View style={styles.mainsActionRow}>
                        <TouchableOpacity
                          onPress={() => void handleSaveMainsDraft()}
                          style={[
                            styles.mainsSecondaryBtn,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Save size={15} color={colors.textPrimary} />
                          <Text
                            style={[styles.mainsSecondaryBtnText, { color: colors.textPrimary }]}
                          >
                            Save Draft
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            setMainsShowApproach((prev) => ({
                              ...prev,
                              [currentPracticeItem.id]: !prev[currentPracticeItem.id],
                            }))
                          }
                          style={[
                            styles.mainsSecondaryBtn,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.accent,
                            },
                          ]}
                        >
                          <BookOpen size={15} color={colors.accent} />
                          <Text style={[styles.mainsSecondaryBtnText, { color: colors.accent }]}>
                            {mainsShowApproach[currentPracticeItem.id]
                              ? 'Hide Model Approach'
                              : 'Model Answer Points'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          disabled={isEvaluatingMains}
                          onPress={() => void handleEvaluateMainsAnswer()}
                          style={[styles.mainsPrimaryBtn, { backgroundColor: colors.accent }]}
                        >
                          {isEvaluatingMains ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Sparkles size={15} color="#FFFFFF" />
                          )}
                          <Text style={styles.mainsPrimaryBtnText}>Evaluate Answer</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Structured Model Approach Panel */}
                      {mainsShowApproach[currentPracticeItem.id] && (
                        <View
                          style={[
                            styles.explanationCard,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          {(() => {
                            const framework = TopicPracticeService.getMainsStructuredApproach(
                              currentPracticeItem.mainsQuestion!,
                              searchResult.displayTitle
                            );
                            return (
                              <>
                                <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                                  1. INTRODUCTION HOOK
                                </Text>
                                <Text style={[styles.expBodyText, { color: colors.textPrimary }]}>
                                  {framework.introductionHook}
                                </Text>

                                <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                                  2. CORE BODY DIMENSIONS & KEY POINTS
                                </Text>
                                {framework.coreDimensions.map((dim, idx) => (
                                  <Text
                                    key={idx}
                                    style={[styles.expBodyText, { color: colors.textPrimary }]}
                                  >
                                    {dim}
                                  </Text>
                                ))}

                                <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                                  3. CONSTITUTIONAL / STATUTORY ANCHORS TO CITE
                                </Text>
                                <View style={styles.hooksWrap}>
                                  {framework.constitutionalOrStatutoryAnchors.map((anc, idx) => (
                                    <View
                                      key={idx}
                                      style={[
                                        styles.hookChip,
                                        {
                                          backgroundColor: colors.surface,
                                          borderColor: colors.border,
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[styles.hookChipText, { color: colors.textPrimary }]}
                                      >
                                        {anc}
                                      </Text>
                                    </View>
                                  ))}
                                </View>

                                <Text style={[styles.expSectionTitle, { color: colors.accent }]}>
                                  4. WAY FORWARD & CONCLUSION
                                </Text>
                                <Text style={[styles.expBodyText, { color: colors.textPrimary }]}>
                                  {framework.wayForwardConclusion}
                                </Text>
                              </>
                            );
                          })()}
                        </View>
                      )}

                      {/* AI / Self Evaluation Card */}
                      {mainsEvaluations[currentPracticeItem.id] && (
                        <View
                          style={[
                            styles.explanationCard,
                            {
                              backgroundColor: colors.successSoft,
                              borderColor: colors.success,
                            },
                          ]}
                        >
                          <Text style={[styles.expVerdictText, { color: colors.success }]}>
                            Evaluation Score:{' '}
                            {mainsEvaluations[currentPracticeItem.id].total_score} /{' '}
                            {mainsEvaluations[currentPracticeItem.id].max_score} Marks
                          </Text>
                          <Text style={[styles.expSectionTitle, { color: colors.textPrimary }]}>
                            STRENGTHS:
                          </Text>
                          {mainsEvaluations[currentPracticeItem.id].strengths.map(
                            (s: string, i: number) => (
                              <Text
                                key={i}
                                style={[styles.expBodyText, { color: colors.textPrimary }]}
                              >
                                • {s}
                              </Text>
                            )
                          )}
                          <Text style={[styles.expSectionTitle, { color: colors.textPrimary }]}>
                            IMPROVEMENTS NEEDED:
                          </Text>
                          {mainsEvaluations[
                            currentPracticeItem.id
                          ].improvement_suggestions.map((imp: string, i: number) => (
                            <Text
                              key={i}
                              style={[styles.expBodyText, { color: colors.textPrimary }]}
                            >
                              • {imp}
                            </Text>
                          ))}
                        </View>
                      )}
                    </>
                  )}
              </View>
            </ScrollView>

            {/* Bottom Step-by-Step Navigation Bar */}
            <View
              style={[
                styles.bottomNavFooter,
                { backgroundColor: colors.surface, borderTopColor: colors.border },
              ]}
            >
              <TouchableOpacity
                disabled={practiceIndex === 0}
                onPress={() => void handleNavigatePracticeQuestion(practiceIndex - 1)}
                style={[
                  styles.navStepBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    opacity: practiceIndex === 0 ? 0.4 : 1,
                  },
                ]}
              >
                <ChevronLeft size={16} color={colors.textPrimary} />
                <Text style={[styles.navStepBtnText, { color: colors.textPrimary }]}>Previous</Text>
              </TouchableOpacity>

              <Text style={[styles.navStepCounter, { color: colors.textSecondary }]}>
                {practiceIndex + 1} / {practiceQueue.length}
              </Text>

              <TouchableOpacity
                disabled={practiceIndex >= practiceQueue.length - 1}
                onPress={() => void handleNavigatePracticeQuestion(practiceIndex + 1)}
                style={[
                  styles.navStepBtn,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                    opacity: practiceIndex >= practiceQueue.length - 1 ? 0.4 : 1,
                  },
                ]}
              >
                <Text style={[styles.navStepBtnText, { color: '#FFFFFF' }]}>Next</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* STAGE 3A: TIMED MODE CONFIGURATION                                */}
        {/* ================================================================= */}
        {stage === 'timed_config' && (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.configCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.configHeading, { color: colors.textPrimary }]}>
                Configure Timed Mode — {searchResult.displayTitle}
              </Text>
              <Text style={[styles.configSub, { color: colors.textSecondary }]}>
                Simulate real UPSC examination pressure with a live countdown timer, Question
                Palette, and auto-saved responses.
              </Text>

              {/* 1. Exam Type */}
              <Text style={[styles.configLabel, { color: colors.textMuted }]}>
                1. SELECT EXAM FORMAT
              </Text>
              <View style={styles.configOptionsRow}>
                {(['PRELIMS', 'MAINS'] as PYQExamType[]).map((mode) => {
                  const count =
                    mode === 'PRELIMS'
                      ? searchResult.prelimsAvailable
                      : searchResult.mainsAvailable;
                  const active = timedConfig.examMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      disabled={count === 0}
                      onPress={() =>
                        setTimedConfig(
                          TimedTestService.getDefaultConfig(
                            searchResult.displayTitle,
                            mode,
                            count
                          )
                        )
                      }
                      style={[
                        styles.configOptionBtn,
                        {
                          backgroundColor: active ? colors.accentSoft : colors.surfaceSubtle,
                          borderColor: active ? colors.accent : colors.border,
                          opacity: count === 0 ? 0.4 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.configOptionTitle,
                          { color: active ? colors.accent : colors.textPrimary },
                        ]}
                      >
                        {mode === 'PRELIMS' ? 'Prelims MCQ Test' : 'Mains Answer Writing'}
                      </Text>
                      <Text style={[styles.configOptionSub, { color: colors.textSecondary }]}>
                        {count} Official Questions Available
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Question Count */}
              <Text style={[styles.configLabel, { color: colors.textMuted }]}>
                2. NUMBER OF QUESTIONS
              </Text>
              <View style={styles.configPillsRow}>
                {(timedConfig.examMode === 'PRELIMS' ? [5, 10, 15, 25, 40] : [2, 3, 5, 8]).map(
                  (cnt) => {
                    const maxAvail =
                      timedConfig.examMode === 'PRELIMS'
                        ? searchResult.prelimsAvailable
                        : searchResult.mainsAvailable;
                    const effectiveCnt = Math.min(cnt, maxAvail);
                    const active = timedConfig.questionCount === effectiveCnt;
                    return (
                      <TouchableOpacity
                        key={cnt}
                        onPress={() =>
                          setTimedConfig((prev) => ({
                            ...prev,
                            questionCount: effectiveCnt,
                            durationMinutes:
                              prev.examMode === 'PRELIMS'
                                ? Math.max(5, Math.ceil(effectiveCnt * 1.2))
                                : effectiveCnt * 9,
                          }))
                        }
                        style={[
                          styles.configNumberPill,
                          {
                            backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                            borderColor: active ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.configNumberPillText,
                            { color: active ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {cnt >= maxAvail ? `All (${maxAvail})` : `${cnt} Qs`}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              {/* 3. Time Limit (Minutes) */}
              <Text style={[styles.configLabel, { color: colors.textMuted }]}>
                3. TIME LIMIT (MINUTES)
              </Text>
              <View style={styles.configPillsRow}>
                {[10, 15, 20, 30, 45, 60].map((mins) => {
                  const active = timedConfig.durationMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() =>
                        setTimedConfig((prev) => ({ ...prev, durationMinutes: mins }))
                      }
                      style={[
                        styles.configNumberPill,
                        {
                          backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                          borderColor: active ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.configNumberPillText,
                          { color: active ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {mins} mins
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. Negative Marking (Prelims) */}
              {timedConfig.examMode === 'PRELIMS' && (
                <>
                  <Text style={[styles.configLabel, { color: colors.textMuted }]}>
                    4. NEGATIVE MARKING SCHEME
                  </Text>
                  <View style={styles.configOptionsRow}>
                    <TouchableOpacity
                      onPress={() =>
                        setTimedConfig((prev) => ({ ...prev, negativeMarking: true }))
                      }
                      style={[
                        styles.configOptionBtn,
                        {
                          backgroundColor: timedConfig.negativeMarking
                            ? colors.accentSoft
                            : colors.surfaceSubtle,
                          borderColor: timedConfig.negativeMarking
                            ? colors.accent
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.configOptionTitle,
                          {
                            color: timedConfig.negativeMarking
                              ? colors.accent
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        UPSC Official (+2.0 / -0.67)
                      </Text>
                      <Text style={[styles.configOptionSub, { color: colors.textSecondary }]}>
                        1/3rd penalty for wrong answers
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setTimedConfig((prev) => ({ ...prev, negativeMarking: false }))
                      }
                      style={[
                        styles.configOptionBtn,
                        {
                          backgroundColor: !timedConfig.negativeMarking
                            ? colors.accentSoft
                            : colors.surfaceSubtle,
                          borderColor: !timedConfig.negativeMarking
                            ? colors.accent
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.configOptionTitle,
                          {
                            color: !timedConfig.negativeMarking
                              ? colors.accent
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        No Negative Marking (+2.0 / 0)
                      </Text>
                      <Text style={[styles.configOptionSub, { color: colors.textSecondary }]}>
                        Practice without penalty
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity
                onPress={() => void handleBeginTimedTest()}
                style={[styles.startTimedExamBtn, { backgroundColor: colors.accent }]}
              >
                <Timer size={18} color="#FFFFFF" />
                <Text style={styles.startTimedExamBtnText}>
                  Launch Timed Test ({timedConfig.questionCount} Questions •{' '}
                  {timedConfig.durationMinutes} Mins)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ================================================================= */}
        {/* STAGE 3B: ACTIVE TIMED TEST (TIMER + PALETTE + AUTO-SAVE)         */}
        {/* ================================================================= */}
        {stage === 'timed_active' && activeTimedSession && (
          <View style={styles.flexOne}>
            {/* Collapsible Question Palette Bar */}
            {showPaletteDrawer && (
              <View
                style={[
                  styles.paletteContainer,
                  { backgroundColor: colors.surface, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.paletteLegendRow}>
                  <Text style={[styles.paletteLegendItem, { color: colors.success }]}>
                    ● Attempted ({timedPaletteCounts.attempted})
                  </Text>
                  <Text style={[styles.paletteLegendItem, { color: colors.danger }]}>
                    ● Unanswered ({timedPaletteCounts.unanswered})
                  </Text>
                  <Text style={[styles.paletteLegendItem, { color: colors.purple }]}>
                    ● Review ({timedPaletteCounts.marked})
                  </Text>
                  <Text style={[styles.paletteLegendItem, { color: colors.textMuted }]}>
                    ● Unvisited ({timedPaletteCounts.unvisited})
                  </Text>
                </View>

                <View style={styles.paletteGrid}>
                  {activeTimedSession.questions.map((q, idx) => {
                    const st = TimedTestService.getPaletteStatus(
                      activeTimedSession.responses[q.id],
                      activeTimedSession.config.examMode
                    );
                    const isCurrent = idx === activeTimedSession.currentIndex;

                    let bg = colors.surfaceSubtle;
                    let textCol = colors.textPrimary;
                    if (st === 'attempted') {
                      bg = colors.success;
                      textCol = '#FFFFFF';
                    } else if (st === 'marked_for_review' || st === 'attempted_and_marked') {
                      bg = colors.purple;
                      textCol = '#FFFFFF';
                    } else if (st === 'unanswered') {
                      bg = colors.dangerSoft;
                      textCol = colors.danger;
                    }

                    return (
                      <TouchableOpacity
                        key={q.id}
                        onPress={() => navigateTimedQuestion(idx)}
                        style={[
                          styles.paletteCell,
                          {
                            backgroundColor: bg,
                            borderColor: isCurrent ? colors.accent : colors.border,
                            borderWidth: isCurrent ? 2 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.paletteCellText, { color: textCol }]}>
                          {idx + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Active Timed Question Content */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                const currentQ =
                  activeTimedSession.questions[activeTimedSession.currentIndex];
                if (!currentQ) return null;
                const resp = activeTimedSession.responses[currentQ.id] || {
                  questionId: currentQ.id,
                  selectedOption: null,
                  mainsAnswerText: '',
                  markedForReview: false,
                  visited: true,
                  timeSpentSeconds: 0,
                };

                return (
                  <View
                    style={[
                      styles.practiceWorkspaceCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.qCardTopRow}>
                      <Text style={[styles.timedQHeader, { color: colors.accent }]}>
                        QUESTION {activeTimedSession.currentIndex + 1} OF{' '}
                        {activeTimedSession.questions.length} ({currentQ.year} •{' '}
                        {currentQ.gsPaper})
                      </Text>
                      <Text style={[styles.autoSaveBadge, { color: colors.success }]}>
                        ● Auto-saved
                      </Text>
                    </View>

                    {currentQ.examType === 'PRELIMS' && currentQ.prelimsQuestion && (
                      <>
                        {Boolean(currentQ.prelimsQuestion.passageText) && (
                          <View
                            style={[
                              styles.passageBox,
                              {
                                backgroundColor: colors.surfaceSubtle,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.passageBody, { color: colors.textPrimary }]}>
                              {currentQ.prelimsQuestion.passageText}
                            </Text>
                          </View>
                        )}

                        <Text
                          style={[styles.practiceQuestionText, { color: colors.textPrimary }]}
                        >
                          {currentQ.prelimsQuestion.questionText}
                        </Text>

                        <View style={styles.practiceOptionsWrap}>
                          {currentQ.prelimsQuestion.options.map((opt) => {
                            const isSelected = resp.selectedOption === opt.key;
                            return (
                              <TouchableOpacity
                                key={opt.key}
                                onPress={() =>
                                  updateTimedResponse(currentQ.id, (r) => ({
                                    ...r,
                                    selectedOption:
                                      r.selectedOption === opt.key ? null : opt.key,
                                    visited: true,
                                  }))
                                }
                                style={[
                                  styles.practiceOptionRow,
                                  {
                                    backgroundColor: isSelected
                                      ? colors.accentSoft
                                      : colors.surfaceSubtle,
                                    borderColor: isSelected ? colors.accent : colors.border,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.optionLetterCircle,
                                    {
                                      backgroundColor: isSelected
                                        ? colors.accent
                                        : colors.surface,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.optionLetterText,
                                      {
                                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                                      },
                                    ]}
                                  >
                                    {opt.key}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.practiceOptionText,
                                    { color: colors.textPrimary },
                                  ]}
                                >
                                  {opt.text}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {currentQ.examType === 'MAINS' && currentQ.mainsQuestion && (
                      <>
                        <Text style={[styles.mainsMetaText, { color: colors.blue }]}>
                          {currentQ.mainsQuestion.marks} Marks • Word Limit:{' '}
                          {currentQ.mainsQuestion.word_limit} Words
                        </Text>
                        <Text
                          style={[styles.practiceQuestionText, { color: colors.textPrimary }]}
                        >
                          {currentQ.mainsQuestion.text_english}
                        </Text>

                        <View style={styles.mainsEditorHeader}>
                          <Text style={[styles.mainsEditorLabel, { color: colors.textSecondary }]}>
                            TIMED ANSWER RESPONSE
                          </Text>
                          <Text style={[styles.wordCounterText, { color: colors.accent }]}>
                            {TopicPracticeService.countWords(resp.mainsAnswerText)} /{' '}
                            {currentQ.mainsQuestion.word_limit} words
                          </Text>
                        </View>

                        <TextInput
                          multiline
                          value={resp.mainsAnswerText}
                          onChangeText={(txt) =>
                            updateTimedResponse(currentQ.id, (r) => ({
                              ...r,
                              mainsAnswerText: txt,
                              visited: true,
                            }))
                          }
                          placeholder="Write your timed UPSC Mains answer here..."
                          placeholderTextColor={colors.textMuted}
                          style={[
                            styles.mainsTextArea,
                            {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                              color: colors.textPrimary,
                            },
                          ]}
                        />
                      </>
                    )}
                  </View>
                );
              })()}
            </ScrollView>

            {/* Timed Mode Bottom Controls */}
            <View
              style={[
                styles.bottomNavFooter,
                { backgroundColor: colors.surface, borderTopColor: colors.border },
              ]}
            >
              <TouchableOpacity
                disabled={activeTimedSession.currentIndex === 0}
                onPress={() => navigateTimedQuestion(activeTimedSession.currentIndex - 1)}
                style={[
                  styles.navStepBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    opacity: activeTimedSession.currentIndex === 0 ? 0.4 : 1,
                  },
                ]}
              >
                <ChevronLeft size={16} color={colors.textPrimary} />
                <Text style={[styles.navStepBtnText, { color: colors.textPrimary }]}>Prev</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const q = activeTimedSession.questions[activeTimedSession.currentIndex];
                  if (!q) return;
                  updateTimedResponse(q.id, (r) => ({
                    ...r,
                    markedForReview: !r.markedForReview,
                    visited: true,
                  }));
                }}
                style={[
                  styles.markReviewBtn,
                  {
                    backgroundColor: colors.purpleSoft,
                    borderColor: colors.purple,
                  },
                ]}
              >
                <Flag size={14} color={colors.purple} />
                <Text style={[styles.markReviewBtnText, { color: colors.purple }]}>
                  {activeTimedSession.responses[
                    activeTimedSession.questions[activeTimedSession.currentIndex]?.id
                  ]?.markedForReview
                    ? 'Marked'
                    : 'Mark Review'}
                </Text>
              </TouchableOpacity>

              {activeTimedSession.currentIndex < activeTimedSession.questions.length - 1 ? (
                <TouchableOpacity
                  onPress={() => navigateTimedQuestion(activeTimedSession.currentIndex + 1)}
                  style={[
                    styles.navStepBtn,
                    { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.navStepBtnText, { color: '#FFFFFF' }]}>Next</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowSubmitConfirmModal(true)}
                  style={[
                    styles.navStepBtn,
                    { backgroundColor: colors.success, borderColor: colors.success },
                  ]}
                >
                  <Text style={[styles.navStepBtnText, { color: '#FFFFFF' }]}>Submit Test</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowSubmitConfirmModal(true)}
                style={[
                  styles.submitTopShortcut,
                  { backgroundColor: colors.successSoft, borderColor: colors.success },
                ]}
              >
                <Text style={[styles.submitTopShortcutText, { color: colors.success }]}>
                  Finish
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* STAGE 3C: TIMED TEST FINAL SCORECARD & QUESTION REVIEW            */}
        {/* ================================================================= */}
        {stage === 'timed_result' && timedResult && (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.heroCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.topicBadgeRow}>
                <View style={[styles.topicTagBadge, { backgroundColor: colors.successSoft }]}>
                  <Award size={14} color={colors.success} />
                  <Text style={[styles.topicTagText, { color: colors.success }]}>
                    TIMED TEST COMPLETED
                  </Text>
                </View>
              </View>

              <Text style={[styles.heroHeading, { color: colors.textPrimary }]}>
                Score: {timedResult.summary.score} / {timedResult.summary.maxScore}
              </Text>
              <Text style={[styles.subjectsLine, { color: colors.textSecondary }]}>
                Accuracy: {timedResult.summary.accuracyPct}% • Positive: +
                {timedResult.positiveMarks} • Negative Penalty: -{timedResult.negativeMarksDeducted}
              </Text>

              <View
                style={[
                  styles.metricsGrid,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <View style={styles.metricCell}>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                    {timedResult.summary.attemptedCount}/{timedResult.summary.totalQuestions}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Attempted
                  </Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                <View style={styles.metricCell}>
                  <Text style={[styles.metricValue, { color: colors.success }]}>
                    {timedResult.summary.correctCount}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Correct
                  </Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                <View style={styles.metricCell}>
                  <Text style={[styles.metricValue, { color: colors.danger }]}>
                    {timedResult.summary.incorrectCount}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Incorrect
                  </Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                <View style={styles.metricCell}>
                  <Text style={[styles.metricValue, { color: colors.accent }]}>
                    {formatTimer(timedResult.summary.durationSeconds)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Time Spent
                  </Text>
                </View>
              </View>

              <View style={styles.launchModesRow}>
                {timedResult.summary.incorrectCount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      const wrongQueue = timedResult.reviewItems
                        .filter((r) => r.status === 'incorrect' || r.status === 'unanswered')
                        .map((r) => r.item);
                      void handleStartPracticeMode(0, wrongQueue);
                    }}
                    style={[styles.primaryLaunchBtn, { backgroundColor: colors.accent }]}
                  >
                    <RotateCcw size={16} color="#FFFFFF" />
                    <Text style={styles.primaryLaunchBtnTitle}>
                      Practice Incorrect & Unanswered Questions
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setStage('overview')}
                  style={[
                    styles.secondaryLaunchBtn,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.secondaryLaunchBtnTitle, { color: colors.textPrimary }]}>
                    Back to Topic Overview
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Detailed Question-by-Question Review */}
            {timedResult.reviewItems.map((rev, idx) => {
              const pq = rev.item.prelimsQuestion;
              const mq = rev.item.mainsQuestion;
              return (
                <View
                  key={rev.item.id}
                  style={[
                    styles.questionCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.qCardTopRow}>
                    <Text
                      style={[
                        styles.examBadgeText,
                        {
                          color:
                            rev.status === 'correct' || rev.status === 'mains_written'
                              ? colors.success
                              : rev.status === 'incorrect'
                              ? colors.danger
                              : colors.textMuted,
                        },
                      ]}
                    >
                      Q{idx + 1} • {rev.status.toUpperCase()} ({rev.marksAwarded >= 0 ? `+${rev.marksAwarded}` : rev.marksAwarded} Marks)
                    </Text>
                    <Text style={[styles.diffBadgeText, { color: colors.textSecondary }]}>
                      {rev.item.year} • {rev.item.gsPaper}
                    </Text>
                  </View>

                  <Text style={[styles.qMainText, { color: colors.textPrimary }]}>
                    {pq ? pq.questionText : mq ? mq.text_english : ''}
                  </Text>

                  {pq && (
                    <View
                      style={[
                        styles.explanationCard,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.expCoreConcept, { color: colors.textPrimary }]}>
                        Your Choice: {rev.response.selectedOption || 'Unanswered'} • Correct Key:{' '}
                        Option ({pq.correctAnswer})
                      </Text>
                      <Text style={[styles.expBodyText, { color: colors.textSecondary }]}>
                        {pq.explanation?.detailedAnalysis || pq.explanation?.coreConcept}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ================================================================= */}
        {/* TIMED TEST SUBMIT CONFIRMATION MODAL                              */}
        {/* ================================================================= */}
        <Modal
          visible={showSubmitConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSubmitConfirmModal(false)}
        >
          <View style={styles.confirmOverlay}>
            <View
              style={[
                styles.confirmDialog,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                Submit Timed Test?
              </Text>
              <Text style={[styles.confirmSubtitle, { color: colors.textSecondary }]}>
                Please review your question palette summary before final submission:
              </Text>

              <View
                style={[
                  styles.confirmSummaryBox,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.confirmStatLine, { color: colors.success }]}>
                  • Attempted: {timedPaletteCounts.attempted}
                </Text>
                <Text style={[styles.confirmStatLine, { color: colors.danger }]}>
                  • Unanswered: {timedPaletteCounts.unanswered + timedPaletteCounts.unvisited}
                </Text>
                <Text style={[styles.confirmStatLine, { color: colors.purple }]}>
                  • Marked for Review: {timedPaletteCounts.marked}
                </Text>
              </View>

              <View style={styles.confirmActionsRow}>
                <TouchableOpacity
                  onPress={() => setShowSubmitConfirmModal(false)}
                  style={[
                    styles.confirmCancelBtn,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.confirmCancelText, { color: colors.textPrimary }]}>
                    Continue Test
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (activeTimedSession) {
                      void handleFinalizeTimedTest(activeTimedSession);
                    }
                  }}
                  style={[styles.confirmSubmitBtn, { backgroundColor: colors.success }]}
                >
                  <Text style={styles.confirmSubmitText}>Confirm & Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topBarSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  timedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  paletteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  paletteToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 48,
    maxWidth: 980,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topicBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  topicTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topicTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  yearRangeBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  topicHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topicMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 13,
    fontWeight: '700',
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  relatedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  relatedScroll: {
    gap: 6,
    alignItems: 'center',
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  relatedChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  relatedChipCount: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subjectsLine: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 14,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  relatedBlock: {
    marginBottom: 16,
  },
  relatedHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  relatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  relatedPillTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  relatedPillCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  launchModesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  modeCard: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 13,
  },
  modeIconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconCircleSecondary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  modeCardTitleLight: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modeBadgeLight: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  modeBadgeLightText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modeCardSubLight: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  modeCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modeBadgeDark: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modeBadgeDarkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modeCardSub: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  primaryLaunchBtn: {
    flex: 1,
    minWidth: 230,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 11,
  },
  primaryLaunchBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryLaunchBtnSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  secondaryLaunchBtn: {
    flex: 1,
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  secondaryLaunchBtnTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryLaunchBtnSub: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  resumeBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  resumeBannerSub: {
    fontSize: 11.5,
  },
  resumeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterBarCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  examSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  examSegmentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  examTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  examTypePillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  toggleFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleFilterBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  expandedFiltersBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  filterGroup: {
    gap: 6,
  },
  filterGroupLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  smallFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  smallFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetFiltersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  qCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  qCardBadgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  examBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  examBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  matchTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchTierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookmarkBtn: {
    padding: 4,
  },
  qBreadcrumb: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  qMainText: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsPreviewList: {
    gap: 6,
    marginBottom: 12,
  },
  optionPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  optKeyText: {
    fontSize: 12,
    fontWeight: '800',
  },
  optValText: {
    fontSize: 13,
    flex: 1,
  },
  qCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  matchReasonText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    flex: 1,
  },
  practiceSingleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  practiceSingleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadMoreBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 6,
  },
  loadMoreBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyStateBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  practiceStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  practiceStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  practiceStatItem: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  retryIncorrectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  retryIncorrectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  practiceWorkspaceCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  passageBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  passageLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  passageBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  practiceQuestionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    marginVertical: 12,
  },
  practiceOptionsWrap: {
    gap: 10,
    marginTop: 6,
  },
  practiceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  optionLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '800',
  },
  practiceOptionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  submitAnswerBtn: {
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitAnswerBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  explanationCard: {
    marginTop: 18,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  expHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  expVerdictText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  expSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  expCoreConcept: {
    fontSize: 14,
    fontWeight: '700',
  },
  expBodyText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  hooksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  hookChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  hookChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  trendNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  mainsMetaBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  mainsMetaText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  mainsEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  mainsEditorLabel: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  wordCounterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainsTextArea: {
    minHeight: 190,
    borderRadius: 11,
    borderWidth: 1,
    padding: 13,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  mainsActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  mainsSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
  },
  mainsSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainsPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 9,
  },
  mainsPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomNavFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  navStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  navStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navStepCounter: {
    fontSize: 13,
    fontWeight: '700',
  },
  configCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  configHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  configSub: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  configLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  configOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  configOptionBtn: {
    flex: 1,
    minWidth: 200,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  configOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  configOptionSub: {
    fontSize: 12,
  },
  configPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  configNumberPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  configNumberPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  startTimedExamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 11,
  },
  startTimedExamBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  paletteContainer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  paletteLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 10,
  },
  paletteLegendItem: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  paletteCell: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteCellText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  timedQHeader: {
    fontSize: 12,
    fontWeight: '800',
  },
  autoSaveBadge: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  markReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  markReviewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  submitTopShortcut: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
  },
  submitTopShortcutText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  confirmSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  confirmSummaryBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  confirmStatLine: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmSubmitBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  confirmSubmitText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
