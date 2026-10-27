import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  X,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CircleHelp,
} from 'lucide-react-native';
import { CA_QUIZ_QUESTIONS, CAQuizQuestion } from '@/data/currentAffairsData';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface CAQuizModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function CAQuizModal({ visible, onClose, isDark }: CAQuizModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <CAQuizContent onClose={onClose} isDark={isDark} />
    </Modal>
  );
}

function CAQuizContent({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const { recordMCQSession } = useStudy();

  const questions: CAQuizQuestion[] = CA_QUIZ_QUESTIONS;
  const durationSeconds = 300; // 5 minutes

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);
    let correct = 0;
    const currentSelected = selectedAnswersRef.current;
    questions.forEach((q, idx) => {
      if (currentSelected[idx] === q.correctAnswer) correct++;
    });
    void recordMCQSession(questions.length, correct);
  }, [questions, recordMCQSession]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, handleSubmit]);

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  // Score computation
  const correctCount = useMemo(() => {
    return questions.filter((q, idx) => selectedAnswers[idx] === q.correctAnswer).length;
  }, [questions, selectedAnswers]);

  const incorrectCount = useMemo(() => {
    return questions.filter((q, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== q.correctAnswer).length;
  }, [questions, selectedAnswers]);

  const score = useMemo(() => {
    const raw = correctCount * 2.0 - incorrectCount * 0.66;
    return Math.max(0, Number(raw.toFixed(2)));
  }, [correctCount, incorrectCount]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Top Header */}
      <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Daily Current Affairs Quiz</Text>
            <Text style={styles.headerSub}>5 High-Yield UPSC Prelims Questions</Text>
          </View>

          {!isSubmitted ? (
            <View style={styles.timerPill}>
              <Timer size={13} color={timeLeft < 60 ? '#EF4444' : theme.textPrimary} strokeWidth={2} />
              <Text style={[styles.timerText, timeLeft < 60 && { color: '#EF4444' }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {!isSubmitted ? (
          /* ACTIVE QUIZ VIEW */
          <View style={styles.quizBody}>
            {/* Progress Bar & Question Tracker */}
            <View style={styles.progressRow}>
              <Text style={styles.qCounter}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
              <Text style={styles.answeredStatus}>
                {answeredCount}/{questions.length} Answered
              </Text>
            </View>

            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
              <View style={styles.questionCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.paperBadge}>{currentQ.paper}</Text>
                  <Text style={styles.sourceTag}>{currentQ.source}</Text>
                </View>

                <Text style={styles.questionText}>{currentQ.question}</Text>

                {/* Options List */}
                <View style={styles.optionsList}>
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedAnswers[currentIndex] === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        style={({ pressed }) => [
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => {
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [currentIndex]: opt.key,
                          }));
                        }}
                      >
                        <View style={[styles.optionKeyBadge, isSelected && styles.optionKeyBadgeSelected]}>
                          <Text style={[styles.optionKeyText, isSelected && styles.optionKeyTextSelected]}>
                            {opt.key}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {opt.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Nav Bar */}
            <View style={styles.bottomBar}>
              <Pressable
                style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                disabled={currentIndex === 0}
                onPress={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
              >
                <ArrowLeft size={15} color={currentIndex === 0 ? theme.textMuted : theme.textPrimary} strokeWidth={2} />
                <Text style={[styles.navBtnText, currentIndex === 0 && { color: theme.textMuted }]}>
                  Previous
                </Text>
              </Pressable>

              {currentIndex < questions.length - 1 ? (
                <Pressable
                  style={styles.nextBtn}
                  onPress={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                  <ArrowRight size={15} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2} />
                </Pressable>
              ) : (
                <Pressable style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitBtnText}>Submit Test</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          /* RESULT & EXPLANATION REVIEW VIEW */
          <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent}>
            {/* Scorecard */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreIconCircle}>
                <Award size={32} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2} />
              </View>
              <Text style={styles.scoreTitle}>Quiz Completed</Text>
              <Text style={styles.scoreValue}>
                {score} <Text style={{ fontSize: 16, color: theme.textMuted }}>/ {questions.length * 2}.0</Text>
              </Text>
              <Text style={styles.scoreMeta}>
                UPSC Marking: +2.0 Correct · -0.66 Incorrect
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{correctCount}</Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#EF4444' }]}>{incorrectCount}</Text>
                  <Text style={styles.statLabel}>Incorrect</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{questions.length - answeredCount}</Text>
                  <Text style={styles.statLabel}>Skipped</Text>
                </View>
              </View>
            </View>

            {/* Answer Explanations */}
            <Text style={styles.reviewHeader}>Detailed Answers & Explanations</Text>

            {questions.map((q, idx) => {
              const userPick = selectedAnswers[idx];
              const isCorrect = userPick === q.correctAnswer;
              const isSkipped = userPick === undefined;

              return (
                <View key={q.id} style={styles.reviewCard}>
                  <View style={styles.reviewTopRow}>
                    <Text style={styles.reviewQIndex}>Q{idx + 1}</Text>
                    <View style={styles.reviewStatusBadge}>
                      {isCorrect ? (
                        <View style={styles.correctBadge}>
                          <CheckCircle2 size={13} color="#10B981" strokeWidth={2.2} />
                          <Text style={styles.correctText}>Correct (+2.0)</Text>
                        </View>
                      ) : isSkipped ? (
                        <View style={styles.skippedBadge}>
                          <CircleHelp size={13} color={theme.textMuted} strokeWidth={2} />
                          <Text style={styles.skippedText}>Unattempted (0)</Text>
                        </View>
                      ) : (
                        <View style={styles.incorrectBadge}>
                          <XCircle size={13} color="#EF4444" strokeWidth={2.2} />
                          <Text style={styles.incorrectText}>Incorrect (-0.66)</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.reviewQText}>{q.question}</Text>

                  {/* Options with Highlights */}
                  <View style={styles.reviewOptionsList}>
                    {q.options.map((opt) => {
                      const isCorrectAnswer = opt.key === q.correctAnswer;
                      const isUserPicked = opt.key === userPick;

                      return (
                        <View
                          key={opt.key}
                          style={[
                            styles.reviewOptionRow,
                            isCorrectAnswer && styles.reviewOptionCorrect,
                            isUserPicked && !isCorrectAnswer && styles.reviewOptionWrong,
                          ]}
                        >
                          <Text
                            style={[
                              styles.reviewOptionKey,
                              isCorrectAnswer && { color: '#10B981' },
                              isUserPicked && !isCorrectAnswer && { color: '#EF4444' },
                            ]}
                          >
                            {opt.key}.
                          </Text>
                          <Text
                            style={[
                              styles.reviewOptionText,
                              isCorrectAnswer && { color: theme.textPrimary, fontWeight: '700' },
                            ]}
                          >
                            {opt.text}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Explanation Box */}
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationTitle}>Explanation & UPSC Context:</Text>
                    <Text style={styles.explanationBody}>{q.explanation}</Text>
                    <Text style={styles.explanationSource}>Source: {q.source}</Text>
                  </View>
                </View>
              );
            })}

            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 14.5,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.2,
    },
    headerSub: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    timerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    timerText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    quizBody: {
      flex: 1,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    qCounter: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    answeredStatus: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    questionCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 16,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    paperBadge: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textPrimary,
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    sourceTag: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '500',
    },
    questionText: {
      fontSize: 15,
      lineHeight: 23,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    optionsList: {
      gap: 10,
      marginTop: 6,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceMuted,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1.5,
      borderColor: theme.borderSubtle,
      gap: 12,
    },
    optionCardSelected: {
      borderColor: theme.textPrimary,
      backgroundColor: isDark ? '#1C202B' : '#F1F5F9',
    },
    optionKeyBadge: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionKeyBadgeSelected: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      borderColor: isDark ? '#FFFFFF' : '#0F172A',
    },
    optionKeyText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    optionKeyTextSelected: {
      color: isDark ? '#000000' : '#FFFFFF',
    },
    optionText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
    },
    optionTextSelected: {
      color: theme.textPrimary,
      fontWeight: '600',
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      backgroundColor: theme.bg,
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    navBtnDisabled: {
      opacity: 0.4,
    },
    navBtnText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    nextBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#000000' : '#FFFFFF',
    },
    submitBtn: {
      backgroundColor: '#10B981',
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 8,
    },
    submitBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // RESULT STYLES
    resultScroll: {
      flex: 1,
    },
    resultContent: {
      padding: 20,
      gap: 16,
    },
    scoreCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    scoreIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    scoreTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    scoreValue: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    scoreMeta: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
      marginBottom: 18,
    },
    statsRow: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      paddingTop: 16,
    },
    statBox: {
      alignItems: 'center',
    },
    statNum: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    reviewHeader: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.textPrimary,
      marginTop: 8,
      letterSpacing: -0.3,
    },
    reviewCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 12,
    },
    reviewTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewQIndex: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    reviewStatusBadge: {},
    correctBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    correctText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#10B981',
    },
    skippedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.surfaceMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    skippedText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textMuted,
    },
    incorrectBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
    },
    incorrectText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: '#EF4444',
    },
    reviewQText: {
      fontSize: 13.5,
      fontWeight: '600',
      lineHeight: 20,
      color: theme.textPrimary,
    },
    reviewOptionsList: {
      gap: 6,
    },
    reviewOptionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 8,
      borderRadius: 6,
      gap: 8,
    },
    reviewOptionCorrect: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
      borderWidth: 1,
      borderColor: '#10B981',
    },
    reviewOptionWrong: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    reviewOptionKey: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textSecondary,
    },
    reviewOptionText: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
      flex: 1,
    },
    explanationBox: {
      backgroundColor: theme.surfaceMuted,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: isDark ? '#FFFFFF' : '#0F172A',
      gap: 6,
      marginTop: 4,
    },
    explanationTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    explanationBody: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.textSecondary,
    },
    explanationSource: {
      fontSize: 10.5,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    doneBtn: {
      backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
      paddingVertical: 12,
      borderRadius: 9,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 30,
    },
    doneBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#000000' : '#FFFFFF',
    },
    pressed: {
      opacity: 0.85,
    },
  });
