import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  if (!visible || questions.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
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

  const handleSubmitQuiz = React.useCallback(() => {
    const res = calculateResult();
    setResult(res);
    setIsSubmitted(true);
  }, [calculateResult]);

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
              <X size={18} color="#000000" strokeWidth={2} />
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
                  color={timeLeftSeconds < 120 ? '#FFFFFF' : '#000000'}
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

                    let bg = '#F4F4F5';
                    let borderColor = '#E4E4E7';
                    let textColor = '#71717A';

                    if (isCur) {
                      bg = '#000000';
                      borderColor = '#000000';
                      textColor = '#FFFFFF';
                    } else if (isMarked) {
                      bg = '#F4F4F5';
                      borderColor = '#000000';
                      textColor = '#000000';
                    } else if (isAnswered) {
                      bg = '#27272A';
                      borderColor = '#27272A';
                      textColor = '#FFFFFF';
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
                      color={markedForReview[currentIndex] ? '#000000' : '#71717A'}
                      fill={markedForReview[currentIndex] ? '#000000' : 'none'}
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
                  <ArrowLeft size={16} color="#000000" strokeWidth={2} />
                  <Text style={styles.navPrevText}>Prev</Text>
                </Pressable>

                {currentIndex < questions.length - 1 ? (
                  <Pressable
                    style={({ pressed }) => [styles.navNextBtn, pressed && styles.pressed]}
                    onPress={() => setCurrentIndex(currentIndex + 1)}
                  >
                    <Text style={styles.navNextText}>Next Question</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
                    onPress={handleConfirmSubmit}
                  >
                    <CheckCheck size={16} color="#FFFFFF" strokeWidth={2} />
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
                  <Award size={26} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text style={styles.resultTitle}>Quiz Completed</Text>
                <Text style={styles.resultScoreBig}>
                  {result.score} <Text style={styles.resultMaxScore}>/ {result.maxScore}</Text>
                </Text>
                <Text style={styles.resultScoreSub}>Estimated UPSC Prelims Score</Text>

                <View style={styles.statPillsRow}>
                  <View style={[styles.statPill, styles.statPillBorder]}>
                    <Text style={[styles.statPillNum, { color: '#000000' }]}>
                      {result.correct}
                    </Text>
                    <Text style={styles.statPillLabel}>Correct (+{result.correct * 2})</Text>
                  </View>

                  <View style={[styles.statPill, styles.statPillBorder]}>
                    <Text style={[styles.statPillNum, { color: '#52525B' }]}>
                      {result.incorrect}
                    </Text>
                    <Text style={styles.statPillLabel}>Wrong (-{(result.incorrect * 0.66).toFixed(2)})</Text>
                  </View>

                  <View style={[styles.statPill, styles.statPillBorder]}>
                    <Text style={[styles.statPillNum, { color: '#71717A' }]}>
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
                <ListFilter size={16} color="#000000" strokeWidth={2} />
                <Text style={styles.reviewToggleText}>
                  {showReviewList ? 'Hide Detailed Solutions' : 'Review Questions & Official Solutions'}
                </Text>
                {showReviewList ? (
                  <ChevronUp size={16} color="#000000" strokeWidth={2} style={{ marginLeft: 'auto' }} />
                ) : (
                  <ChevronDown size={16} color="#000000" strokeWidth={2} style={{ marginLeft: 'auto' }} />
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
                              isRight ? { color: '#059669' } : { color: '#DC2626' },
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

const styles = StyleSheet.create({
  fullScreenSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  titleCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  markingPill: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  markingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  timerDanger: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  timerTextDanger: {
    color: '#FFFFFF',
  },
  paletteStrip: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
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
    color: '#000000',
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  markBtnText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
  },
  markBtnTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
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
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  optionItemSelected: {
    backgroundColor: '#F4F4F5',
    borderColor: '#000000',
  },
  keyCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCircleSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  keyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  keyTextSelected: {
    color: '#FFFFFF',
  },
  optionContentText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
  },
  navPrevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingVertical: 13,
    borderRadius: 8,
    gap: 6,
  },
  navPrevText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  navNextBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 13,
    borderRadius: 8,
    gap: 6,
  },
  navNextText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 13,
    borderRadius: 8,
    gap: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  // Results view styles
  resultHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 16,
  },
  trophyCircle: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  resultScoreBig: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000000',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  resultMaxScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#71717A',
  },
  resultScoreSub: {
    fontSize: 12,
    color: '#52525B',
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
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  statPillNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 2,
  },
  accuracyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 16,
  },
  accuracyItem: {
    flex: 1,
    alignItems: 'center',
  },
  accuracyNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  accuracyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 2,
  },
  accuracyDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
  },
  reviewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  reviewToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  reviewList: {
    gap: 14,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
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
    color: '#000000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  statusBadgeCorrect: {
    backgroundColor: '#F4F4F5',
  },
  statusBadgeWrong: {
    backgroundColor: '#FAFAFA',
  },
  statusBadgeSkipped: {
    backgroundColor: '#F4F4F5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextCorrect: {
    color: '#000000',
  },
  statusTextWrong: {
    color: '#52525B',
  },
  statusTextSkipped: {
    color: '#71717A',
  },
  reviewQuestionText: {
    fontSize: 13,
    color: '#000000',
    lineHeight: 19,
    marginBottom: 10,
  },
  reviewAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  reviewLabel: {
    fontSize: 11,
    color: '#71717A',
  },
  reviewUserPick: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewOfficialKey: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  solutionBox: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  solutionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  solutionText: {
    fontSize: 12,
    color: '#52525B',
    lineHeight: 17,
  },
  solutionTrick: {
    fontSize: 11,
    color: '#3F3F46',
    fontWeight: '600',
    marginTop: 2,
  },
  exitBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  exitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
