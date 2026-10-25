import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  X,
  Timer,
  Flag,
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Award,
  ListFilter,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  RotateCcw,
  AlertTriangle,
} from '@/components/common/LucideIcons';
import { PYQQuestion, QuizResult } from '@/types/prelims';
import { useStudy } from '@/context/StudyContext';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';
import { QuizQuestionPalette } from './QuizQuestionPalette';
import { QuizSubmitModal } from './QuizSubmitModal';

interface QuizModalProps {
  visible: boolean;
  title: string;
  questions: PYQQuestion[];
  durationMinutes?: number;
  onClose: () => void;
}

export function QuizModal({
  visible,
  title,
  questions,
  durationMinutes = 15,
  onClose,
}: QuizModalProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  if (!visible || questions.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.fullScreenSafeArea}>
        <View style={styles.fullScreenContainer}>
          <QuizModalContent
            title={title}
            questions={questions}
            durationMinutes={durationMinutes}
            onClose={onClose}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function QuizModalContent({
  title,
  questions,
  durationMinutes,
  onClose,
}: {
  title: string;
  questions: PYQQuestion[];
  durationMinutes: number;
  onClose: () => void;
}) {
  const theme = usePrelimsTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const isMobile = windowWidth < 768;
  const styles = useMemo(() => getStyles(theme, isMobile), [theme, isMobile]);
  const { recordMCQSession, updateConfig, config } = useStudy();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [visitedIndices, setVisitedIndices] = useState<Record<number, boolean>>({ 0: true });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReviewList, setShowReviewList] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleSelectQuestion = useCallback((idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentIndex(idx);
    setVisitedIndices((prev) => ({
      ...prev,
      [idx]: true,
    }));
  }, [questions.length]);

  const calculateResult = useCallback((): QuizResult => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      if (!selected) {
        unattempted++;
      } else if (selected === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const attempted = correct + incorrect;
    // UPSC marking: +2.0 marks per correct, -0.66 marks per incorrect
    const rawScore = correct * 2.0 - incorrect * 0.66;
    const score = Math.max(0, Number(rawScore.toFixed(2)));
    const maxScore = questions.length * 2.0;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    return {
      totalQuestions: questions.length,
      attempted,
      correct,
      incorrect,
      unattempted,
      score,
      maxScore,
      accuracy,
      timeTakenSeconds: durationMinutes * 60 - timeLeftSeconds,
      answers: {},
    };
  }, [questions, selectedAnswers, durationMinutes, timeLeftSeconds]);

  const handleSubmitQuiz = useCallback(async () => {
    const res = calculateResult();
    setResult(res);
    setIsSubmitted(true);
    if (res.attempted > 0) {
      await recordMCQSession(res.attempted, res.correct);
      const scaledScore = Math.max(
        0,
        Math.min(200, Number(((res.score / res.maxScore) * 200).toFixed(1)))
      );
      await updateConfig({
        mockAverageScore: scaledScore,
        mockTestsAttempted: (config.mockTestsAttempted || 18) + 1,
      });
    }
  }, [calculateResult, recordMCQSession, updateConfig, config.mockTestsAttempted]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, handleSubmitQuiz]);

  const currentQ = questions[currentIndex] || questions[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = useCallback((key: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  }, [isSubmitted, currentIndex]);

  const handleClearResponse = useCallback(() => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  }, [isSubmitted, currentIndex]);

  const handleToggleMarkReview = useCallback(() => {
    if (isSubmitted) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  }, [isSubmitted, currentIndex]);

  const stats = useMemo(() => {
    let answered = 0;
    let unanswered = 0;
    let marked = 0;
    let notVisited = 0;

    questions.forEach((_, idx) => {
      const isAnswered = selectedAnswers[idx] !== undefined;
      const isMarked = !!markedForReview[idx];
      const isVisited = !!visitedIndices[idx] || idx === currentIndex;

      if (isAnswered) {
        answered++;
      } else if (isVisited) {
        unanswered++;
      } else {
        notVisited++;
      }

      if (isMarked) {
        marked++;
      }
    });

    return {
      total: questions.length,
      answered,
      unanswered,
      marked,
      notVisited,
    };
  }, [questions, selectedAnswers, markedForReview, visitedIndices, currentIndex]);

  const handleOpenSubmitDialog = () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitModal(false);
    handleSubmitQuiz();
  };

  const handleRequestClose = useCallback(() => {
    if (isSubmitted) {
      onClose();
      return;
    }
    setShowExitModal(true);
  }, [isSubmitted, onClose]);

  // Keyboard navigation on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || isSubmitted) return;

    const handleKeyDown = (e: any) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          handleSelectQuestion(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) {
          handleSelectQuestion(currentIndex + 1);
        }
      } else if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        handleSelectOption('A');
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        handleSelectOption('B');
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        handleSelectOption('C');
      } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
        handleSelectOption('D');
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R') {
        handleToggleMarkReview();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClearResponse();
      } else if (e.key === 'Escape') {
        if (showExitModal) {
          setShowExitModal(false);
        } else if (showSubmitModal) {
          setShowSubmitModal(false);
        } else if (showMobilePalette) {
          setShowMobilePalette(false);
        } else {
          handleRequestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentIndex,
    isSubmitted,
    questions.length,
    showExitModal,
    showSubmitModal,
    showMobilePalette,
    handleSelectQuestion,
    handleSelectOption,
    handleToggleMarkReview,
    handleClearResponse,
    handleRequestClose,
  ]);

  return (
    <View style={styles.sheetContainer}>
      {/* 1. Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.closeBtn}
          onPress={handleRequestClose}
          accessibilityRole="button"
          accessibilityLabel="Close quiz"
        >
          <X size={18} color={theme.colors.textPrimary} strokeWidth={2} />
        </Pressable>

        <View style={styles.titleCol}>
          <Text style={styles.topTitle}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          {!isMobile && Boolean(title) && (
            <Text style={styles.topSubtitle} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        <View style={styles.topBarRightCol}>
          {!isSubmitted && (
            <View style={[styles.timerBadge, timeLeftSeconds < 120 && styles.timerDanger]}>
              <Timer
                size={14}
                color={
                  timeLeftSeconds < 120
                    ? '#EF4444'
                    : theme.isDark
                    ? '#FBBF24'
                    : '#D97706'
                }
                strokeWidth={2.4}
              />
              <Text
                style={[
                  styles.timerText,
                  timeLeftSeconds < 120 && styles.timerTextDanger,
                ]}
              >
                {formatTime(timeLeftSeconds)}
              </Text>
            </View>
          )}

          {/* Mobile Palette Button */}
          {!isSubmitted && isMobile && (
            <Pressable
              style={styles.mobilePaletteBtn}
              onPress={() => setShowMobilePalette(true)}
              accessibilityRole="button"
              accessibilityLabel="Open question palette"
            >
              <LayoutGrid size={15} color={theme.colors.darkButtonText} strokeWidth={2.2} />
            </Pressable>
          )}
        </View>

        {/* Thin progress track along top bar bottom */}
        <View style={styles.topProgressBarTrack}>
          <View
            style={[
              styles.topProgressBarFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* 2. ACTIVE QUIZ SCREEN (Desktop Two-Column / Mobile Single Column) */}
      {!isSubmitted && (
        <View style={styles.examMainContainer}>
          <View style={styles.splitRow}>
            {/* LEFT PANEL: Main Question Area */}
            <View style={styles.questionPanel}>
              <ScrollView
                style={styles.questionScrollView}
                contentContainerStyle={styles.questionScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Clean Meta Row (Year, Marking Scheme & Review Flag) */}
                <View style={styles.qMetaRow}>
                  <View style={styles.qMetaLeft}>
                    {Boolean(currentQ.year) && (
                      <View style={styles.metaYearTag}>
                        <Text style={styles.metaYearText}>UPSC {currentQ.year}</Text>
                      </View>
                    )}
                    <View style={styles.metaMarkingTag}>
                      <Text style={styles.metaMarkingText}>+2.0 / -0.66</Text>
                    </View>
                  </View>

                  {/* Mark for review action button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.markBtn,
                      markedForReview[currentIndex] && styles.markBtnActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleToggleMarkReview}
                    accessibilityRole="button"
                    accessibilityLabel={
                      markedForReview[currentIndex] ? 'Marked for Review' : 'Mark for Review'
                    }
                  >
                    <Flag
                      size={12}
                      color={markedForReview[currentIndex] ? '#8B5CF6' : theme.colors.textMuted}
                      fill={markedForReview[currentIndex] ? '#8B5CF6' : 'none'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.markBtnText,
                        markedForReview[currentIndex] && styles.markBtnTextActive,
                      ]}
                    >
                      {markedForReview[currentIndex] ? 'Marked' : 'Mark for Review'}
                    </Text>
                  </Pressable>
                </View>

                {/* Question Card */}
                <View style={styles.questionCard}>
                  <Text style={styles.questionText}>{currentQ.questionText}</Text>
                </View>

                {/* Options List */}
                <View style={styles.optionsContainer}>
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedAnswers[currentIndex] === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        style={({ pressed }) => [
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => handleSelectOption(opt.key)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Option ${opt.key}: ${opt.text}`}
                      >
                        <View
                          style={[
                            styles.keyCircle,
                            isSelected && styles.keyCircleSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.keyText,
                              isSelected && styles.keyTextSelected,
                            ]}
                          >
                            {opt.key}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.optionContentText,
                            isSelected && styles.optionContentTextSelected,
                          ]}
                        >
                          {opt.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>

              {/* Fixed Bottom Action Bar */}
              <View style={styles.bottomBar}>
                {/* Prev Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.navPrevBtn,
                    currentIndex === 0 && styles.btnDisabled,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => currentIndex > 0 && handleSelectQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Previous Question"
                >
                  <ArrowLeft
                    size={15}
                    color={currentIndex === 0 ? theme.colors.textMuted : theme.colors.textPrimary}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.navPrevText,
                      currentIndex === 0 && styles.navPrevTextDisabled,
                    ]}
                  >
                    Prev
                  </Text>
                </Pressable>

                {/* Center Option Clear button */}
                <View style={styles.bottomCenterCol}>
                  {selectedAnswers[currentIndex] !== undefined && (
                    <Pressable
                      style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
                      onPress={handleClearResponse}
                      accessibilityRole="button"
                      accessibilityLabel="Clear Selected Response"
                    >
                      <RotateCcw size={12} color={theme.colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </Pressable>
                  )}
                </View>

                {/* Next Question / Submit Button */}
                <View style={styles.bottomRightCol}>
                  {currentIndex < questions.length - 1 ? (
                    <Pressable
                      style={({ pressed }) => [styles.navNextBtn, pressed && styles.pressed]}
                      onPress={() => handleSelectQuestion(currentIndex + 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Next Question"
                    >
                      <Text style={styles.navNextText}>Save & Next</Text>
                      <ArrowRight size={15} color={theme.colors.darkButtonText} strokeWidth={2.4} />
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
                      onPress={handleOpenSubmitDialog}
                      accessibilityRole="button"
                      accessibilityLabel="Submit Quiz"
                    >
                      <CheckCheck size={16} color={theme.colors.darkButtonText} strokeWidth={2.2} />
                      <Text style={styles.submitBtnText}>Submit Quiz</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* RIGHT PANEL: Question Navigator Sidebar (Desktop & Tablet) */}
            {!isMobile && (
              <View style={[styles.paletteSidebar, { width: isDesktop ? 320 : 280 }]}>
                <QuizQuestionPalette
                  questions={questions}
                  currentIndex={currentIndex}
                  selectedAnswers={selectedAnswers}
                  markedForReview={markedForReview}
                  visitedIndices={visitedIndices}
                  onSelectQuestion={handleSelectQuestion}
                  onSubmitQuiz={handleOpenSubmitDialog}
                />
              </View>
            )}
          </View>

          {/* Mobile Question Palette Bottom Sheet / Modal Drawer */}
          {isMobile && (
            <Modal
              visible={showMobilePalette}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowMobilePalette(false)}
            >
              <View style={styles.mobilePaletteModalOverlay}>
                <View style={styles.mobilePaletteSheet}>
                  <View style={styles.mobilePaletteSheetHeader}>
                    <Text style={styles.mobilePaletteSheetTitle}>Question Navigator</Text>
                    <Pressable
                      style={styles.mobilePaletteCloseBtn}
                      onPress={() => setShowMobilePalette(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Close Question Palette"
                    >
                      <X size={18} color={theme.colors.textPrimary} strokeWidth={2} />
                    </Pressable>
                  </View>

                  <View style={{ flex: 1 }}>
                    <QuizQuestionPalette
                      questions={questions}
                      currentIndex={currentIndex}
                      selectedAnswers={selectedAnswers}
                      markedForReview={markedForReview}
                      visitedIndices={visitedIndices}
                      onSelectQuestion={handleSelectQuestion}
                      onSubmitQuiz={() => {
                        setShowMobilePalette(false);
                        handleOpenSubmitDialog();
                      }}
                      onCloseMobileDrawer={() => setShowMobilePalette(false)}
                      isMobile={true}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Submit Confirmation Dialog */}
          <QuizSubmitModal
            visible={showSubmitModal}
            totalQuestions={questions.length}
            answeredCount={stats.answered}
            unansweredCount={stats.unanswered}
            markedCount={stats.marked}
            notVisitedCount={stats.notVisited}
            timeLeftFormatted={formatTime(timeLeftSeconds)}
            onCancel={() => setShowSubmitModal(false)}
            onConfirmSubmit={handleConfirmSubmit}
          />

          {/* Exit / Leave Quiz Confirmation Dialog */}
          <Modal
            visible={showExitModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowExitModal(false)}
          >
            <View style={styles.confirmModalOverlay}>
              <View style={styles.confirmModalCard}>
                <View style={styles.confirmIconCircle}>
                  <AlertTriangle size={26} color="#F59E0B" strokeWidth={2.2} />
                </View>

                <Text style={styles.confirmModalTitle}>Leave Quiz?</Text>
                <Text style={styles.confirmModalDesc}>
                  Are you sure you want to quit? Your current test progress and answers will not be saved.
                </Text>

                <View style={styles.confirmStatsRow}>
                  <View style={styles.confirmStatItem}>
                    <Text style={styles.confirmStatNum}>{stats.answered}</Text>
                    <Text style={styles.confirmStatLabel}>Answered</Text>
                  </View>
                  <View style={styles.confirmStatDivider} />
                  <View style={styles.confirmStatItem}>
                    <Text style={styles.confirmStatNum}>
                      {stats.unanswered + stats.notVisited}
                    </Text>
                    <Text style={styles.confirmStatLabel}>Remaining</Text>
                  </View>
                  <View style={styles.confirmStatDivider} />
                  <View style={styles.confirmStatItem}>
                    <Text style={[styles.confirmStatNum, { color: '#F59E0B' }]}>
                      {formatTime(timeLeftSeconds)}
                    </Text>
                    <Text style={styles.confirmStatLabel}>Time Left</Text>
                  </View>
                </View>

                <View style={styles.confirmBtnRow}>
                  <Pressable
                    style={({ pressed }) => [styles.confirmResumeBtn, pressed && styles.pressed]}
                    onPress={() => setShowExitModal(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Resume Quiz"
                  >
                    <Text style={styles.confirmResumeBtnText}>Resume Quiz</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.confirmExitBtn, pressed && styles.pressed]}
                    onPress={() => {
                      setShowExitModal(false);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Exit Quiz"
                  >
                    <Text style={styles.confirmExitBtnText}>Exit Quiz</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* 3. QUIZ SCORECARD RESULT VIEW (Post-submission) */}
      {isSubmitted && result && (
        <ScrollView style={styles.resultScrollBody} showsVerticalScrollIndicator={false}>
          <View style={styles.resultHeroCard}>
            <View style={styles.trophyCircle}>
              <Award size={26} color={theme.colors.darkButtonText} strokeWidth={2} />
            </View>
            <Text style={styles.resultTitle}>Quiz Completed</Text>
            <Text style={styles.resultScoreBig}>
              {result.score} <Text style={styles.resultMaxScore}>/ {result.maxScore}</Text>
            </Text>
            <Text style={styles.resultScoreSub}>Estimated UPSC Prelims Score</Text>

            <View style={styles.statPillsRow}>
              <View style={[styles.statPill, styles.statPillBorder]}>
                <Text style={[styles.statPillNum, { color: '#34D399' }]}>
                  {result.correct}
                </Text>
                <Text style={styles.statPillLabel}>Correct (+{result.correct * 2})</Text>
              </View>

              <View style={[styles.statPill, styles.statPillBorder]}>
                <Text style={[styles.statPillNum, { color: '#F87171' }]}>
                  {result.incorrect}
                </Text>
                <Text style={styles.statPillLabel}>Wrong (-{(result.incorrect * 0.66).toFixed(2)})</Text>
              </View>

              <View style={[styles.statPill, styles.statPillBorder]}>
                <Text style={[styles.statPillNum, { color: theme.colors.textMuted }]}>
                  {result.unattempted}
                </Text>
                <Text style={styles.statPillLabel}>Skipped</Text>
              </View>
            </View>
          </View>

          {/* Performance Metrics */}
          <View style={styles.accuracyCard}>
            <View style={styles.accuracyItem}>
              <Text style={styles.accuracyNum}>{result.accuracy}%</Text>
              <Text style={styles.accuracyLabel}>Accuracy Rate</Text>
            </View>
            <View style={styles.accuracyDivider} />
            <View style={styles.accuracyItem}>
              <Text style={styles.accuracyNum}>{formatTime(result.timeTakenSeconds)}</Text>
              <Text style={styles.accuracyLabel}>Time Taken</Text>
            </View>
          </View>

          {/* Review Question-by-Question Solution Toggle */}
          <Pressable
            style={({ pressed }) => [styles.reviewToggleBtn, pressed && styles.pressed]}
            onPress={() => setShowReviewList(!showReviewList)}
          >
            <ListFilter size={16} color={theme.colors.textPrimary} strokeWidth={2} />
            <Text style={styles.reviewToggleText}>
              {showReviewList ? 'Hide Detailed Solutions' : 'Review Questions & Official Solutions'}
            </Text>
            {showReviewList ? (
              <ChevronUp
                size={16}
                color={theme.colors.textPrimary}
                strokeWidth={2}
                style={{ marginLeft: 'auto' }}
              />
            ) : (
              <ChevronDown
                size={16}
                color={theme.colors.textPrimary}
                strokeWidth={2}
                style={{ marginLeft: 'auto' }}
              />
            )}
          </Pressable>

          {/* Detailed Question Review List */}
          {showReviewList && (
            <View style={styles.reviewList}>
              {questions.map((q, idx) => {
                const userPick = selectedAnswers[idx];
                const isRight = userPick === q.correctAnswer;
                const isSkipped = !userPick;

                return (
                  <View key={q.id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Text style={styles.reviewCardIndex}>Q{idx + 1}.</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isRight
                            ? styles.statusBadgeCorrect
                            : isSkipped
                            ? styles.statusBadgeSkipped
                            : styles.statusBadgeWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isRight
                              ? styles.statusTextCorrect
                              : isSkipped
                              ? styles.statusTextSkipped
                              : styles.statusTextWrong,
                          ]}
                        >
                          {isRight ? 'CORRECT (+2)' : isSkipped ? 'SKIPPED' : 'INCORRECT (-0.66)'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.reviewQuestionText}>{q.questionText}</Text>

                    <View style={styles.reviewAnswerRow}>
                      <Text style={styles.reviewLabel}>Your Pick: </Text>
                      <Text
                        style={[
                          styles.reviewUserPick,
                          isRight ? { color: '#34D399' } : { color: '#F87171' },
                        ]}
                      >
                        {userPick ? `Option (${userPick})` : 'Not Attempted'}
                      </Text>
                      <Text style={styles.reviewLabel}> | Official Key: </Text>
                      <Text style={styles.reviewOfficialKey}>Option ({q.correctAnswer})</Text>
                    </View>

                    <View style={styles.solutionBox}>
                      <Text style={styles.solutionTitle}>Explanation:</Text>
                      <Text style={styles.solutionText}>{q.explanation.coreConcept}</Text>
                      {q.explanation.eliminationTechnique && (
                        <Text style={styles.solutionTrick}>
                          Elimination Strategy: {q.explanation.eliminationTechnique}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 20 }} />

          {/* Exit Button */}
          <Pressable
            style={({ pressed }) => [styles.exitBtn, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.exitBtnText}>Back to Chapter / Prelims</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType, isMobile: boolean = false) => {
  const isDark = theme.isDark;

  return StyleSheet.create({
    fullScreenSafeArea: {
      flex: 1,
      backgroundColor: theme.colors.bgCanvas,
    },
    fullScreenContainer: {
      flex: 1,
      backgroundColor: theme.colors.bgCanvas,
    },
    sheetContainer: {
      flex: 1,
      backgroundColor: theme.colors.bgCanvas,
    },
    topBar: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isMobile ? 14 : 20,
      paddingVertical: isMobile ? 11 : 13,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderCard,
      backgroundColor: theme.colors.bgSurface,
    },
    titleCol: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginHorizontal: isMobile ? 12 : 16,
    },
    topTitle: {
      fontSize: isMobile ? 14.5 : 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    topSubtitle: {
      fontSize: 11.5,
      fontWeight: '500',
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    topProgressBarTrack: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2.5,
      backgroundColor: isDark ? '#1C202B' : '#E2E8F0',
    },
    topProgressBarFill: {
      height: '100%',
      backgroundColor: '#3B82F6',
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: isDark ? '#1C202B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBarRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2B1C04' : '#FEF3C7',
      borderWidth: 1.5,
      borderColor: isDark ? '#D97706' : '#F59E0B',
      paddingHorizontal: isMobile ? 10 : 12,
      paddingVertical: 5,
      borderRadius: 20,
      height: 34,
      gap: 6,
      shadowColor: isDark ? '#F59E0B' : '#D97706',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 3,
      elevation: 2,
    },
    timerDanger: {
      backgroundColor: isDark ? '#3E1013' : '#FEE2E2',
      borderColor: '#EF4444',
      shadowColor: '#EF4444',
      shadowOpacity: 0.35,
    },
    timerText: {
      fontSize: 13,
      fontWeight: '900',
      color: isDark ? '#FDE68A' : '#92400E',
      letterSpacing: 0.4,
    },
    timerTextDanger: {
      color: isDark ? '#FCA5A5' : '#DC2626',
    },
    mobilePaletteBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: theme.colors.darkButton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mobilePaletteBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    examMainContainer: {
      flex: 1,
    },
    splitRow: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: isMobile ? 0 : 16,
      paddingTop: isMobile ? 0 : 14,
      paddingBottom: isMobile ? 0 : 14,
      gap: 16,
    },
    questionPanel: {
      flex: 1,
      backgroundColor: theme.colors.bgSurface,
      borderRadius: isMobile ? 0 : 14,
      borderWidth: isMobile ? 0 : 1,
      borderColor: theme.colors.borderCard,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    paletteSidebar: {
      height: '100%',
    },
    questionScrollView: {
      flex: 1,
    },
    questionScrollContent: {
      paddingHorizontal: isMobile ? 16 : 20,
      paddingTop: isMobile ? 14 : 18,
      paddingBottom: 24,
    },
    qMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    qMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaYearTag: {
      backgroundColor: isDark ? '#222838' : '#EDE9FE',
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
    },
    metaYearText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#C4B5FD' : '#6D28D9',
    },
    metaMarkingTag: {
      backgroundColor: isDark ? '#191C25' : '#F1F5F9',
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    metaMarkingText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    markBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? '#1C202B' : '#F1F5F9',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    markBtnActive: {
      backgroundColor: isDark ? '#261C3D' : '#F3E8FF',
      borderColor: '#8B5CF6',
    },
    markBtnText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    markBtnTextActive: {
      color: isDark ? '#C4B5FD' : '#7C3AED',
      fontWeight: '800',
    },
    questionCard: {
      backgroundColor: isDark ? '#161922' : '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      marginBottom: 18,
    },
    questionText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.textPrimary,
      lineHeight: 23,
    },
    optionsContainer: {
      gap: 10,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.borderCard,
      backgroundColor: isDark ? '#161922' : '#FFFFFF',
      gap: 12,
    },
    optionItemSelected: {
      backgroundColor: isDark ? '#1E2536' : '#EFF6FF',
      borderColor: isDark ? '#60A5FA' : '#2563EB',
    },
    keyCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#232838' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyCircleSelected: {
      backgroundColor: isDark ? '#2563EB' : '#1D4ED8',
      borderColor: isDark ? '#60A5FA' : '#1D4ED8',
    },
    keyText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    keyTextSelected: {
      color: '#FFFFFF',
    },
    optionContentText: {
      fontSize: 14,
      color: theme.colors.textPrimary,
      lineHeight: 20,
      flex: 1,
      fontWeight: '500',
    },
    optionContentTextSelected: {
      fontWeight: '600',
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 10 : 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderCard,
      backgroundColor: isDark ? '#181B24' : '#F8FAFC',
      gap: isMobile ? 8 : 10,
    },
    navPrevBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#222838' : '#F1F5F9',
      paddingVertical: 8,
      paddingHorizontal: isMobile ? 10 : 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      gap: 5,
    },
    navPrevText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    navPrevTextDisabled: {
      color: theme.colors.textMuted,
    },
    bottomCenterCol: {
      flex: 1,
      alignItems: 'center',
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#222838' : '#F1F5F9',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      gap: 5,
    },
    clearBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    bottomRightCol: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navNextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 8,
      paddingHorizontal: isMobile ? 12 : 14,
      borderRadius: 8,
      gap: 5,
    },
    navNextText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#10B981',
      paddingVertical: 8,
      paddingHorizontal: isMobile ? 12 : 14,
      borderRadius: 8,
      gap: 5,
    },
    submitBtnText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    btnDisabled: {
      opacity: 0.45,
    },
    mobilePaletteModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    mobilePaletteSheet: {
      backgroundColor: theme.colors.bgSurface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      height: 520,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderCard,
      overflow: 'hidden',
    },
    mobilePaletteSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
    },
    mobilePaletteSheetTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    mobilePaletteCloseBtn: {
      padding: 4,
    },
    resultScrollBody: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    resultHeroCard: {
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      marginBottom: 16,
      ...theme.shadows.card,
    },
    trophyCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.darkButton,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    resultTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    resultScoreBig: {
      fontSize: 34,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      letterSpacing: -1,
    },
    resultMaxScore: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    resultScoreSub: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 2,
      marginBottom: 16,
    },
    statPillsRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    statPill: {
      flex: 1,
      backgroundColor: isDark ? '#1C202B' : '#F8FAFC',
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    statPillBorder: {
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    statPillNum: {
      fontSize: 16,
      fontWeight: '800',
    },
    statPillLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    accuracyCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      marginBottom: 16,
      alignItems: 'center',
    },
    accuracyItem: {
      flex: 1,
      alignItems: 'center',
    },
    accuracyNum: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    accuracyLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    accuracyDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.borderSubtle,
    },
    reviewToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      gap: 8,
      marginBottom: 14,
    },
    reviewToggleText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    reviewList: {
      gap: 12,
    },
    reviewCard: {
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      gap: 10,
    },
    reviewCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewCardIndex: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    statusBadgeCorrect: {
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
    },
    statusBadgeWrong: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
    },
    statusBadgeSkipped: {
      backgroundColor: isDark ? '#2D3342' : '#F1F5F9',
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    statusTextCorrect: {
      color: '#34D399',
    },
    statusTextWrong: {
      color: '#F87171',
    },
    statusTextSkipped: {
      color: theme.colors.textMuted,
    },
    reviewQuestionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textPrimary,
      lineHeight: 21,
    },
    reviewAnswerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      backgroundColor: isDark ? '#1A1E29' : '#F8FAFC',
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    reviewLabel: {
      fontSize: 12,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },
    reviewUserPick: {
      fontSize: 12,
      fontWeight: '700',
    },
    reviewOfficialKey: {
      fontSize: 12,
      fontWeight: '700',
      color: '#34D399',
    },
    solutionBox: {
      backgroundColor: isDark ? '#1C202B' : '#F1F5F9',
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.textPrimary,
      gap: 4,
    },
    solutionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    solutionText: {
      fontSize: 12.5,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    solutionTrick: {
      fontSize: 12,
      color: isDark ? '#C4B5FD' : '#6D28D9',
      fontWeight: '600',
      marginTop: 4,
      lineHeight: 17,
    },
    exitBtn: {
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exitBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
    confirmModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    confirmModalCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 16,
      padding: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      ...theme.shadows.card,
    },
    confirmIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? '#2E1E05' : '#FEF3C7',
      borderWidth: 1,
      borderColor: isDark ? '#78350F' : '#FDE68A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    confirmModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    confirmModalDesc: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 16,
    },
    confirmStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      backgroundColor: isDark ? '#1C202B' : '#F8FAFC',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      marginBottom: 18,
    },
    confirmStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    confirmStatNum: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    confirmStatLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    confirmStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.borderSubtle,
    },
    confirmBtnRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    confirmResumeBtn: {
      flex: 1,
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmResumeBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    confirmExitBtn: {
      flex: 1,
      backgroundColor: isDark ? '#2A1517' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmExitBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#EF4444',
    },
  });
};
