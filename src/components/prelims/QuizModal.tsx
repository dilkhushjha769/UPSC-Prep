import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, Alert } from 'react-native';
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
} from '@/components/common/LucideIcons';
import { PYQQuestion, QuizResult } from '@/types/prelims';
import { useStudy } from '@/context/StudyContext';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';

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
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { recordMCQSession, updateConfig, config } = useStudy();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReviewList, setShowReviewList] = useState(false);

  const calculateResult = React.useCallback((): QuizResult => {
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

  const handleSubmitQuiz = React.useCallback(async () => {
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

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: key,
    }));
  };

  const handleToggleMarkReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleConfirmSubmit = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const unattemptedCount = questions.length - answeredCount;

    Alert.alert(
      'Submit UPSC Mock Quiz?',
      `You have answered ${answeredCount} of ${questions.length} questions. (${unattemptedCount} left unattempted).\n\nNegative marking of -0.66 per wrong answer will be applied.`,
      [
        { text: 'Continue Quiz', style: 'cancel' },
        {
          text: 'Submit Now',
          style: 'destructive',
          onPress: handleSubmitQuiz,
        },
      ]
    );
  };

  return (
    <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={theme.colors.textPrimary} strokeWidth={2} />
            </Pressable>

            <View style={styles.titleCol}>
              <Text style={styles.topTitle} numberOfLines={1}>
                {title}
              </Text>
              {!isSubmitted && (
                <View style={styles.markingPill}>
                  <Text style={styles.markingText}>+2.0 Correct / -0.66 Wrong</Text>
                </View>
              )}
            </View>

            {!isSubmitted && (
              <View style={[styles.timerBadge, timeLeftSeconds < 120 && styles.timerDanger]}>
                <Timer
                  size={14}
                  color={timeLeftSeconds < 120 ? '#EF4444' : theme.colors.textPrimary}
                  strokeWidth={2}
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
          </View>

          {/* ACTIVE QUIZ SCREEN */}
          {!isSubmitted && (
            <>
              {/* Question Navigation Palette Strip */}
              <View style={styles.paletteStrip}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
                  {questions.map((_, idx) => {
                    const isAnswered = selectedAnswers[idx] !== undefined;
                    const isMarked = markedForReview[idx];
                    const isCur = idx === currentIndex;

                    let bg = theme.colors.bgSurfaceMuted;
                    let borderColor = theme.colors.borderCard;
                    let textColor = theme.colors.textMuted;

                    if (isCur) {
                      bg = theme.colors.darkButton;
                      borderColor = theme.colors.darkButton;
                      textColor = theme.colors.darkButtonText;
                    } else if (isMarked) {
                      bg = theme.colors.bgSurfaceMuted;
                      borderColor = theme.colors.textPrimary;
                      textColor = theme.colors.textPrimary;
                    } else if (isAnswered) {
                      bg = '#334155';
                      borderColor = '#475569';
                      textColor = theme.colors.textPrimary;
                    }

                    return (
                      <Pressable
                        key={idx}
                        style={[
                          styles.paletteBubble,
                          { backgroundColor: bg, borderColor, borderWidth: 1 },
                        ]}
                        onPress={() => setCurrentIndex(idx)}
                      >
                        <Text style={[styles.paletteText, { color: textColor }]}>
                          {idx + 1}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Question Scroll Body */}
              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                <View style={styles.qHeaderRow}>
                  <Text style={styles.qIndexLabel}>
                    Question {currentIndex + 1} of {questions.length}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.markBtn, pressed && styles.pressed]}
                    onPress={handleToggleMarkReview}
                  >
                    <Flag
                      size={14}
                      color={markedForReview[currentIndex] ? theme.colors.textPrimary : theme.colors.textMuted}
                      fill={markedForReview[currentIndex] ? theme.colors.textPrimary : 'none'}
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

                {/* Question Text Box */}
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
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                        onPress={() => handleSelectOption(opt.key)}
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
                        <Text style={styles.optionContentText}>{opt.text}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>

              {/* Bottom Actions Bar */}
              <View style={styles.bottomBar}>
                <Pressable
                  style={({ pressed }) => [
                    styles.navPrevBtn,
                    currentIndex === 0 && styles.btnDisabled,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft size={16} color={theme.colors.textPrimary} strokeWidth={2} />
                  <Text style={styles.navPrevText}>Prev</Text>
                </Pressable>

                {currentIndex < questions.length - 1 ? (
                  <Pressable
                    style={({ pressed }) => [styles.navNextBtn, pressed && styles.pressed]}
                    onPress={() => setCurrentIndex(currentIndex + 1)}
                  >
                    <Text style={styles.navNextText}>Next Question</Text>
                    <ArrowRight size={16} color={theme.colors.darkButtonText} strokeWidth={2} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
                    onPress={handleConfirmSubmit}
                  >
                    <CheckCheck size={16} color={theme.colors.darkButtonText} strokeWidth={2} />
                    <Text style={styles.submitBtnText}>Submit Quiz</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {/* QUIZ SCORECARD RESULT VIEW */}
          {isSubmitted && result && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
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
                  <ChevronUp size={16} color={theme.colors.textPrimary} strokeWidth={2} style={{ marginLeft: 'auto' }} />
                ) : (
                  <ChevronDown size={16} color={theme.colors.textPrimary} strokeWidth={2} style={{ marginLeft: 'auto' }} />
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
                <Text style={styles.exitBtnText}>Return to Prelims Hub</Text>
              </Pressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
  );
}

const getStyles = (theme: PrelimsThemeType) => StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderCard,
  },
  titleCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  markingPill: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  markingText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  timerDanger: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  timerTextDanger: {
    color: '#FCA5A5',
  },
  paletteStrip: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderCard,
    paddingVertical: 8,
  },
  paletteScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  paletteBubble: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  qHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qIndexLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  markBtnText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  markBtnTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 23,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.borderCard,
    backgroundColor: theme.colors.bgSurface,
    gap: 12,
  },
  optionItemSelected: {
    backgroundColor: '#1E293B',
    borderColor: theme.colors.textPrimary,
  },
  keyCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCircleSelected: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  keyText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  keyTextSelected: {
    color: theme.colors.darkButtonText,
  },
  optionContentText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderCard,
    backgroundColor: theme.colors.bgCanvas,
  },
  navPrevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    paddingVertical: 13,
    borderRadius: 8,
    gap: 6,
  },
  navPrevText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  navNextBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkButton,
    paddingVertical: 13,
    borderRadius: 8,
    gap: 6,
  },
  navNextText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkButton,
    paddingVertical: 13,
    borderRadius: 8,
    gap: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  // Results view styles
  resultHeroCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    marginBottom: 16,
  },
  trophyCircle: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: theme.colors.darkButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  resultScoreBig: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  resultMaxScore: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  resultScoreSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  statPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statPillBorder: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
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
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    marginBottom: 16,
  },
  accuracyItem: {
    flex: 1,
    alignItems: 'center',
  },
  accuracyNum: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  accuracyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  accuracyDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.borderCard,
    alignSelf: 'center',
  },
  reviewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  reviewToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  reviewList: {
    gap: 14,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCardIndex: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  statusBadgeCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeSkipped: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderColor: theme.colors.borderCard,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
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
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 19,
    marginBottom: 10,
  },
  reviewAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurfaceMuted,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  reviewLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  reviewUserPick: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewOfficialKey: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  solutionBox: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  solutionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  solutionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  solutionTrick: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
    marginTop: 2,
  },
  exitBtn: {
    backgroundColor: theme.colors.darkButton,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  exitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
  },
  pressed: {
    opacity: 0.75,
  },
});
