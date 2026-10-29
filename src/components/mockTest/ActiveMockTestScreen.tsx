import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BackHandler,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  XCircle,
} from '@/components/common/LucideIcons';
import { BW_THEME } from '@/constants/bwTheme';
import { MockTestService } from '@/services/mockTestService';
import { MockTestQuestionRecord, MockTestRecord, MockTestResponseRecord } from '@/types/mockTest';
import { MockTestQuestionPalette } from './MockTestQuestionPalette';
import { MockTestResultsView } from './MockTestResultsView';
import { ProgressBar } from '@/components/ui';
import { EditorialExplanationView } from '@/components/common/EditorialExplanationView';
import { examFocusService } from '@/services/examFocusService';

interface ActiveMockTestScreenProps {
  testId: string;
  onClose: () => void;
  isDark?: boolean;
}

export function ActiveMockTestScreen({ testId, onClose, isDark = true }: ActiveMockTestScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<MockTestRecord | null>(null);
  const [questions, setQuestions] = useState<MockTestQuestionRecord[]>([]);
  const [responses, setResponses] = useState<Record<string, MockTestResponseRecord>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Language toggle: 'en' | 'hi'
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Palette drawer on mobile
  const [paletteVisible, setPaletteVisible] = useState(false);

  // Submit confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed results view
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleRequestClose = useCallback(() => {
    if (isCompleted) {
      onClose();
      return;
    }
    setShowExitConfirm(true);
  }, [isCompleted, onClose]);

  useEffect(() => {
    const onBackPress = () => {
      if (showExitConfirm) {
        setShowExitConfirm(false);
        return true;
      }
      handleRequestClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showExitConfirm, handleRequestClose]);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const questionStartTimeRef = useRef(0);

  // Autosave status indicator
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');


  // Exam Focus Mode - Activate during mock test, restore when submitted or completed
  useEffect(() => {
    if (!loading && !isCompleted && test) {
      const sessionId = `mock-test-${test.id}`;
      examFocusService.activateFocusMode(sessionId, test.test_title);
      return () => {
        examFocusService.deactivateFocusMode(sessionId);
      };
    }
  }, [loading, isCompleted, test]);

  // Initialize start time on mount
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, []);

  // 1. Submit Final Test handler
  const handleSubmitFinal = useCallback(async () => {
    setIsSubmitting(true);
    setShowSubmitModal(false);

    const res = await MockTestService.submitMockTest(testId);
    setIsSubmitting(false);

    if (res.success) {
      // Reload final test stats
      const freshData = await MockTestService.getMockTest(testId);
      if (freshData) {
        setTest(freshData.test);
        setResponses(freshData.responses);
      }
      setIsCompleted(true);
    } else {
      Alert.alert('Submission Error', res.error || 'Failed to submit test. Please retry.');
    }
  }, [testId]);

  // 2. Load test data
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const data = await MockTestService.getMockTest(testId);
      if (!mounted) return;

      if (!data) {
        Alert.alert('Error', 'Unable to load mock test.', [{ text: 'OK', onPress: onClose }]);
        setLoading(false);
        return;
      }

      setTest(data.test);
      setQuestions(data.questions);
      setResponses(data.responses);

      if (data.test.status === 'submitted') {
        setIsCompleted(true);
        setLoading(false);
        return;
      }

      // Initialize timer
      if (data.test.test_mode === 'full' && data.test.time_limit_minutes) {
        const totalSecs = data.test.time_limit_minutes * 60;
        const startTimestamp = new Date(data.test.start_time).getTime();
        const elapsedSinceStart = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
        const remaining = Math.max(0, totalSecs - elapsedSinceStart);
        setSecondsRemaining(remaining);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [testId, onClose]);

  // 3. Countdown timer loop
  useEffect(() => {
    if (isCompleted || !test) return;

    const interval = setInterval(() => {
      if (secondsRemaining !== null) {
        setSecondsRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            // Time up! Auto-submit
            handleSubmitFinal();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, secondsRemaining, test, handleSubmitFinal]);

  const currentQuestion = questions[currentIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.question_id] : null;

  // Format countdown string
  const formatCountdown = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 4. Answer selection handler (with autosave)
  const handleSelectOption = useCallback(
    async (optionId: string) => {
      if (!currentQuestion || isCompleted) return;
      const qId = currentQuestion.question_id;
      const prevResp = responses[qId];

      const newAnswer = prevResp?.selected_answer === optionId ? null : optionId;
      const isMarked = Boolean(prevResp?.is_marked_for_review);

      // Optimistic update
      const updatedResp: MockTestResponseRecord = {
        mock_test_id: testId,
        question_id: qId,
        selected_answer: newAnswer,
        is_marked_for_review: isMarked,
        answer_status: newAnswer && isMarked ? 'answered_and_marked' : newAnswer ? 'answered' : isMarked ? 'marked_for_review' : 'unattempted',
        time_spent_seconds: (prevResp?.time_spent_seconds || 0) + Math.round((Date.now() - (questionStartTimeRef.current || Date.now())) / 1000),
      };

      setResponses((prev) => ({ ...prev, [qId]: updatedResp }));
      setSaveStatus('saving');
      questionStartTimeRef.current = Date.now();

      const ok = await MockTestService.saveResponse(
        testId,
        qId,
        newAnswer,
        isMarked,
        updatedResp.time_spent_seconds
      );
      setSaveStatus(ok ? 'saved' : 'error');
    },
    [currentQuestion, responses, testId, isCompleted]
  );

  // 5. Toggle Mark for Review
  const handleToggleMarkForReview = useCallback(async () => {
    if (!currentQuestion || isCompleted) return;
    const qId = currentQuestion.question_id;
    const prevResp = responses[qId];

    const currentAnswer = prevResp?.selected_answer || null;
    const newMarked = !Boolean(prevResp?.is_marked_for_review);

    const updatedResp: MockTestResponseRecord = {
      mock_test_id: testId,
      question_id: qId,
      selected_answer: currentAnswer,
      is_marked_for_review: newMarked,
      answer_status: currentAnswer && newMarked ? 'answered_and_marked' : currentAnswer ? 'answered' : newMarked ? 'marked_for_review' : 'unattempted',
      time_spent_seconds: prevResp?.time_spent_seconds || 0,
    };

    setResponses((prev) => ({ ...prev, [qId]: updatedResp }));
    setSaveStatus('saving');

    const ok = await MockTestService.saveResponse(
      testId,
      qId,
      currentAnswer,
      newMarked,
      updatedResp.time_spent_seconds
    );
    setSaveStatus(ok ? 'saved' : 'error');
  }, [currentQuestion, responses, testId, isCompleted]);

  // 6. Clear Response
  const handleClearResponse = useCallback(async () => {
    if (!currentQuestion || isCompleted) return;
    const qId = currentQuestion.question_id;
    const prevResp = responses[qId];
    const isMarked = Boolean(prevResp?.is_marked_for_review);

    const updatedResp: MockTestResponseRecord = {
      mock_test_id: testId,
      question_id: qId,
      selected_answer: null,
      is_marked_for_review: isMarked,
      answer_status: isMarked ? 'marked_for_review' : 'unattempted',
      time_spent_seconds: prevResp?.time_spent_seconds || 0,
    };

    setResponses((prev) => ({ ...prev, [qId]: updatedResp }));
    setSaveStatus('saving');

    const ok = await MockTestService.saveResponse(testId, qId, null, isMarked, updatedResp.time_spent_seconds);
    setSaveStatus(ok ? 'saved' : 'error');
  }, [currentQuestion, responses, testId, isCompleted]);

  // 7. Navigation
  const handleNext = () => {
    questionStartTimeRef.current = Date.now();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    questionStartTimeRef.current = Date.now();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Count stats for submit modal
  const submitStats = useMemo(() => {
    let answered = 0;
    let marked = 0;
    let unattempted = 0;

    questions.forEach((q) => {
      const r = responses[q.question_id];
      const hasAnswer = r?.selected_answer && r.selected_answer.trim().length > 0;
      if (hasAnswer) answered++;
      else if (r?.is_marked_for_review) marked++;
      else unattempted++;
    });

    return { answered, marked, unattempted, total: questions.length };
  }, [questions, responses]);

  if (loading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.textPrimary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Mock Test...</Text>
      </View>
    );
  }

  if (isCompleted && test) {
    return (
      <MockTestResultsView
        test={test}
        questions={questions}
        responses={responses}
        onBackToDashboard={onClose}
        isDark={isDark}
      />
    );
  }

  if (!test || !currentQuestion) {
    return null;
  }

  const snap = currentQuestion.snapshot;
  const qText = language === 'hi' && snap.question_text_hi ? snap.question_text_hi : snap.question_text_en;
  const hasHindi = Boolean(snap.question_text_hi);
  const isPracticeMode = test.test_mode === 'practice';
  const isTimerCritical = secondsRemaining !== null && secondsRemaining < 300; // < 5 mins

  return (
    <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* 1. Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleRequestClose} style={[styles.exitBtn, { backgroundColor: theme.activeBg }]}>
            <ArrowLeft size={16} color={theme.textPrimary} />
          </Pressable>
          <View>
            <Text style={[styles.testTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
              {test.test_title}
            </Text>
            <Text style={[styles.testSubtitleText, { color: theme.textSecondary }]}>
              {test.exam} • Q{currentIndex + 1} of {questions.length}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Timer capsule */}
          {secondsRemaining !== null ? (
            <View
              style={[
                styles.timerCapsule,
                {
                  backgroundColor: isTimerCritical ? 'rgba(239, 68, 68, 0.15)' : isDark ? '#1C263D' : '#EEF4FD',
                  borderColor: isTimerCritical ? '#EF4444' : theme.cardBorder,
                },
              ]}>
              <Clock size={14} color={isTimerCritical ? '#EF4444' : theme.textPrimary} />
              <Text
                style={[
                  styles.timerText,
                  { color: isTimerCritical ? '#EF4444' : theme.textPrimary, fontWeight: '700' },
                ]}>
                {formatCountdown(secondsRemaining)}
              </Text>
            </View>
          ) : (
            <View style={[styles.timerCapsule, { backgroundColor: isDark ? '#1C263D' : '#EEF4FD' }]}>
              <Clock size={14} color={theme.textSecondary} />
              <Text style={[styles.timerText, { color: theme.textSecondary }]}>Practice</Text>
            </View>
          )}

          {/* Language toggle if Hindi exists */}
          {hasHindi && (
            <Pressable
              onPress={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
              style={[styles.langToggle, { backgroundColor: theme.activeBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.langToggleText, { color: theme.textPrimary }]}>
                {language === 'en' ? 'हिन्दी' : 'ENG'}
              </Text>
            </Pressable>
          )}

          {/* Palette toggle (mobile) */}
          {!isDesktop && (
            <Pressable
              onPress={() => setPaletteVisible(true)}
              style={[styles.paletteToggleBtn, { backgroundColor: theme.activeBg }]}>
              <LayoutGrid size={18} color={theme.textPrimary} />
            </Pressable>
          )}

          {/* Submit button */}
          <Pressable onPress={() => setShowSubmitModal(true)} style={[styles.submitHeaderBtn, { backgroundColor: '#10B981' }]}>
            <Text style={styles.submitHeaderBtnText}>Submit</Text>
          </Pressable>
        </View>
      </View>

      {/* Progress Bar: Answered Questions vs Total */}
      {questions.length > 0 && (
        <View
          style={[
            styles.testProgressBanner,
            {
              backgroundColor: isDark ? '#10141E' : '#F8FAFC',
              borderBottomColor: theme.cardBorder,
            },
          ]}>
          <View style={styles.testProgressInfoRow}>
            <Text style={[styles.testProgressLabel, { color: theme.textSecondary }]}>
              Progress: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{submitStats.answered}</Text> of {questions.length} answered
            </Text>
            <Text style={[styles.testProgressValue, { color: '#006FFD', fontWeight: '700' }]}>
              {Math.min(100, Math.round((submitStats.answered / questions.length) * 100))}%
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(100, (submitStats.answered / questions.length) * 100)}
            height={3}
            fillColor="#006FFD"
            trackColor={isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}
            borderRadius={2}
          />
        </View>
      )}

      {/* 2. Main Workspace Layout */}
      <View style={styles.mainWorkspace}>
        {/* Left / Center Question Scroll Area */}
        <ScrollView style={styles.questionScrollView} contentContainerStyle={styles.questionScrollContent}>
          {/* Question Banner Bar */}
          <View style={styles.questionBanner}>
            <View style={styles.questionNumberPill}>
              <Text style={[styles.questionNumberText, { color: theme.textPrimary }]}>
                Question {currentIndex + 1}
              </Text>
              <Text style={[styles.totalQuestionsText, { color: theme.textMuted }]}>/ {questions.length}</Text>
            </View>

            <View style={styles.markingSchemeBadges}>
              <View style={[styles.markingBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={[styles.markingBadgeText, { color: '#10B981' }]}>+{test.marks_per_correct}</Text>
              </View>
              <View style={[styles.markingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Text style={[styles.markingBadgeText, { color: '#EF4444' }]}>-{test.negative_marks}</Text>
              </View>
              {saveStatus === 'saving' && (
                <Text style={[styles.saveStatusText, { color: theme.textMuted }]}>Saving...</Text>
              )}
            </View>
          </View>

          {/* Reading Comprehension Passage (for CSAT or passage-linked questions) */}
          {snap.passage_text && (
            <View style={[styles.passageCard, { backgroundColor: isDark ? '#0C0F17' : '#F8FAFC', borderColor: theme.cardBorder }]}>
              <View style={styles.passageHeader}>
                <BookOpen size={16} color={theme.textPrimary} />
                <Text style={[styles.passageTitle, { color: theme.textPrimary }]}>
                  Reading Comprehension Passage {snap.passage_id ? `(${snap.passage_id})` : ''}
                </Text>
              </View>
              <Text style={[styles.passageText, { color: theme.textSecondary }]}>{snap.passage_text}</Text>
            </View>
          )}

          {/* Question Content Card */}
          <View style={[styles.questionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.questionText, { color: theme.textPrimary }]}>{qText}</Text>

            {/* Statements List if present */}
            {snap.statements && snap.statements.length > 0 && (
              <View style={[styles.statementsContainer, { backgroundColor: isDark ? '#0A0D14' : '#F8FAFC', borderColor: theme.divider }]}>
                {snap.statements.map((stmt, sIdx) => (
                  <Text key={sIdx} style={[styles.statementItemText, { color: theme.textSecondary }]}>
                    {stmt}
                  </Text>
                ))}
              </View>
            )}

            {/* Answer Options */}
            <View style={styles.optionsContainer}>
              {snap.options.map((opt) => {
                const isSelected = currentResponse?.selected_answer?.toUpperCase() === opt.id.toUpperCase();
                const isCorrect = snap.correct_answer?.toUpperCase() === opt.id.toUpperCase();
                const showFeedback = isPracticeMode && Boolean(currentResponse?.selected_answer);

                let rowBg = isDark ? '#0A0D14' : '#FFFFFF';
                let rowBorder = theme.divider;
                let circleBg = isDark ? '#1C2438' : '#F1F5F9';
                let circleTextColor = theme.textPrimary;
                let showCorrectBadge = false;
                let showIncorrectBadge = false;

                if (showFeedback) {
                  if (isCorrect) {
                    rowBg = isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4';
                    rowBorder = isDark ? 'rgba(16, 185, 129, 0.45)' : '#86EFAC';
                    circleBg = '#10B981';
                    circleTextColor = '#FFFFFF';
                    showCorrectBadge = true;
                  } else if (isSelected && !isCorrect) {
                    rowBg = isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2';
                    rowBorder = isDark ? 'rgba(239, 68, 68, 0.45)' : '#FECACA';
                    circleBg = '#EF4444';
                    circleTextColor = '#FFFFFF';
                    showIncorrectBadge = true;
                  }
                } else if (isSelected) {
                  rowBg = isDark ? '#111E38' : '#EEF4FF';
                  rowBorder = '#006FFD';
                  circleBg = '#006FFD';
                  circleTextColor = '#FFFFFF';
                }

                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleSelectOption(opt.id)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: rowBg,
                        borderColor: rowBorder,
                        borderWidth: isSelected || (showFeedback && isCorrect) ? 1.5 : 1,
                      },
                    ]}>
                    <View
                      style={[
                        styles.optionCircle,
                        {
                          backgroundColor: circleBg,
                          borderColor: circleBg,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.optionCircleText,
                          { color: circleTextColor },
                        ]}>
                        {opt.id}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.optionBodyText, { color: theme.textPrimary, fontWeight: isSelected ? '600' : '400' }]}>
                        {opt.text}
                      </Text>
                      {showCorrectBadge && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <CheckCircle2 size={13} color="#10B981" strokeWidth={2.4} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>Correct answer</Text>
                        </View>
                      )}
                      {showIncorrectBadge && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <XCircle size={13} color="#EF4444" strokeWidth={2.4} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Your answer</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Practice Mode immediate solution review */}
            {isPracticeMode && currentResponse?.selected_answer && snap.explanation_en && (
              <EditorialExplanationView
                isDark={isDark}
                correctAnswer={snap.correct_answer}
                explanationText={language === 'hi' && snap.explanation_hi ? snap.explanation_hi : snap.explanation_en}
              />
            )}
          </View>
        </ScrollView>

        {/* Right Desktop Palette Sidebar */}
        {isDesktop && (
          <View style={[styles.desktopPaletteWrapper, { borderLeftColor: theme.cardBorder }]}>
            <MockTestQuestionPalette
              questions={questions}
              responses={responses}
              currentIndex={currentIndex}
              onSelectQuestion={setCurrentIndex}
              isDark={isDark}
            />
          </View>
        )}
      </View>

      {/* 3. Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.cardBg, borderTopColor: theme.cardBorder }]}>
        <View style={styles.bottomBarLeft}>
          <Pressable
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            style={[
              styles.navBtn,
              currentIndex === 0 && styles.navBtnDisabled,
              { backgroundColor: theme.activeBg, borderColor: theme.cardBorder },
            ]}>
            <ArrowLeft size={16} color={currentIndex === 0 ? theme.textMuted : theme.textPrimary} />
            <Text style={[styles.navBtnText, { color: currentIndex === 0 ? theme.textMuted : theme.textPrimary }]}>
              Previous
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearResponse}
            style={[styles.clearBtn, { borderColor: theme.divider }]}>
            <RotateCcw size={14} color={theme.textMuted} />
            <Text style={[styles.clearBtnText, { color: theme.textMuted }]}>Clear</Text>
          </Pressable>
        </View>

        <View style={styles.bottomBarRight}>
          <Pressable
            onPress={handleToggleMarkForReview}
            style={[
              styles.reviewBtn,
              currentResponse?.is_marked_for_review && {
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderColor: '#F59E0B',
              },
              { borderColor: theme.cardBorder },
            ]}>
            <Bookmark
              size={15}
              color={currentResponse?.is_marked_for_review ? '#F59E0B' : theme.textSecondary}
            />
            <Text
              style={[
                styles.reviewBtnText,
                { color: currentResponse?.is_marked_for_review ? '#F59E0B' : theme.textSecondary },
              ]}>
              {currentResponse?.is_marked_for_review ? 'Marked' : 'Mark for Review'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={currentIndex === questions.length - 1}
            style={[
              styles.nextBtn,
              { backgroundColor: theme.buttonPrimaryBg },
            ]}>
            <Text style={[styles.nextBtnText, { color: theme.buttonPrimaryText }]}>Save & Next</Text>
            <ArrowRight size={16} color={theme.buttonPrimaryText} />
          </Pressable>
        </View>
      </View>

      {/* Mobile Palette Modal */}
      <Modal visible={paletteVisible} animationType="slide" transparent>
        <View style={styles.mobilePaletteModalOverlay}>
          <View style={[styles.mobilePaletteSheet, { backgroundColor: theme.cardBg }]}>
            <MockTestQuestionPalette
              questions={questions}
              responses={responses}
              currentIndex={currentIndex}
              onSelectQuestion={setCurrentIndex}
              onClose={() => setPaletteVisible(false)}
              isDark={isDark}
            />
          </View>
        </View>
      </Modal>

      {/* Leave Test Confirmation Dialog */}
      <Modal visible={showExitConfirm} animationType="fade" transparent onRequestClose={() => setShowExitConfirm(false)}>
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <AlertTriangle size={24} color="#EF4444" strokeWidth={2.2} />
            </View>
            <Text style={[styles.confirmModalTitle, { color: theme.textPrimary }]}>Leave Test Session?</Text>
            <Text style={[styles.confirmModalDesc, { color: theme.textSecondary }]}>
              Are you sure you want to exit? Your answered responses will not be finalized or scored until you submit.
            </Text>

            <View style={styles.confirmModalActions}>
              <Pressable
                onPress={() => setShowExitConfirm(false)}
                style={[styles.cancelBtn, { borderColor: theme.divider }]}>
                <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Resume Test</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                style={[styles.confirmSubmitBtn, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.confirmSubmitBtnText}>Quit & Exit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Final Submission Confirmation Dialog */}
      <Modal visible={showSubmitModal} animationType="fade" transparent>
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.confirmModalTitle, { color: theme.textPrimary }]}>Submit Mock Test?</Text>
            <Text style={[styles.confirmModalDesc, { color: theme.textSecondary }]}>
              Are you sure you want to finalize your mock test? Once submitted, your scores will be computed and solutions will be unlocked.
            </Text>

            {/* Quick Summary Pill Row */}
            <View style={styles.confirmStatsRow}>
              <View style={[styles.confirmStatPill, { backgroundColor: '#065F46' }]}>
                <Text style={styles.confirmStatNumber}>{submitStats.answered}</Text>
                <Text style={styles.confirmStatLabel}>Answered</Text>
              </View>
              <View style={[styles.confirmStatPill, { backgroundColor: '#78350F' }]}>
                <Text style={styles.confirmStatNumber}>{submitStats.marked}</Text>
                <Text style={styles.confirmStatLabel}>Marked</Text>
              </View>
              <View style={[styles.confirmStatPill, { backgroundColor: isDark ? '#181E2C' : '#CBD5E1' }]}>
                <Text style={[styles.confirmStatNumber, { color: theme.textPrimary }]}>{submitStats.unattempted}</Text>
                <Text style={[styles.confirmStatLabel, { color: theme.textSecondary }]}>Unattempted</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.confirmModalActions}>
              <Pressable
                onPress={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                style={[styles.cancelBtn, { borderColor: theme.divider }]}>
                <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Return to Test</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitFinal}
                disabled={isSubmitting}
                style={[styles.confirmSubmitBtn, { backgroundColor: '#10B981' }]}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmSubmitBtnText}>Yes, Submit Final</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  exitBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  testSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  langToggle: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  langToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paletteToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  submitHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  testProgressBanner: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    gap: 4,
  },
  testProgressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testProgressLabel: {
    fontSize: 11.5,
  },
  testProgressValue: {
    fontSize: 11.5,
  },
  mainWorkspace: {
    flex: 1,
    flexDirection: 'row',
  },
  questionScrollView: {
    flex: 1,
  },
  questionScrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
  },
  questionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  questionNumberPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalQuestionsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  markingSchemeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  markingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveStatusText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  passageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  passageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  passageTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  passageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 16,
  },
  statementsContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  statementItemText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionBodyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  practiceExplanationBox: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  practiceSolutionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  practiceExplanationBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  desktopPaletteWrapper: {
    width: 280,
    borderLeftWidth: 1,
    padding: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mobilePaletteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  mobilePaletteSheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmModalDesc: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 16,
  },
  confirmStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  confirmStatPill: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  confirmStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: 2,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
