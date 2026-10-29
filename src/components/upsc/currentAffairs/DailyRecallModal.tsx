import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Award,
  BookOpen,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { EditorialExplanationView } from '@/components/common/EditorialExplanationView';
import { DailyEventItem } from '@/data/currentAffairsData';
import {
  EventRecallQuestion,
  generateDayRecallQuestions,
  generateEventRecallQuestions,
} from '@/services/eventRecallService';

interface DailyRecallModalProps {
  visible: boolean;
  onClose: () => void;
  dateKey: string;
  events: DailyEventItem[];
  singleEvent?: DailyEventItem | null;
  isDark: boolean;
}

export function DailyRecallModal({
  visible,
  onClose,
  dateKey,
  events,
  singleEvent = null,
  isDark,
}: DailyRecallModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <DailyRecallContent
        onClose={onClose}
        dateKey={dateKey}
        events={events}
        singleEvent={singleEvent}
        isDark={isDark}
      />
    </Modal>
  );
}

function DailyRecallContent({
  onClose,
  dateKey,
  events,
  singleEvent,
  isDark,
}: {
  onClose: () => void;
  dateKey: string;
  events: DailyEventItem[];
  singleEvent?: DailyEventItem | null;
  isDark: boolean;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const styles = useMemo(() => getStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  // Generate the 5 active recall questions for a single event OR 10 questions for the selected day
  const questions: EventRecallQuestion[] = useMemo(
    () =>
      singleEvent
        ? generateEventRecallQuestions(singleEvent)
        : generateDayRecallQuestions(dateKey, events),
    [singleEvent, dateKey, events]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleSelectOption = useCallback(
    (key: 'A' | 'B' | 'C' | 'D') => {
      if (selectedAnswers[currentIndex]) return; // lock once answered for active recall integrity
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentIndex]: key,
      }));
    },
    [currentIndex, selectedAnswers]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleReset = useCallback(() => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
  }, []);

  // Compute score
  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct += 1;
      }
    });
    return correct;
  }, [questions, selectedAnswers]);

  const answeredCount = Object.keys(selectedAnswers).length;

  // Format date display (e.g. 25 Oct 2026)
  const formattedDate = useMemo(() => {
    const parts = dateKey.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[mIdx] || ''} ${parts[0]}`;
    }
    return dateKey;
  }, [dateKey]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ======================================================== */}
        {/* HEADER                                                   */}
        {/* ======================================================== */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Zap size={16} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2.4} fill={isDark ? '#6FBAFF' : '#006FFD'} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>
                  {singleEvent ? 'Event Recall Quiz' : 'Daily Active Recall'}
                </Text>
                <View style={styles.geminiBadge}>
                  <Text style={styles.geminiBadgeText}>
                    {questions.length} MCQs
                  </Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {singleEvent
                  ? singleEvent.headline
                  : `${formattedDate} · 10 High-Yield Retention Questions`}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
            onPress={onClose}
            hitSlop={10}
            accessibilityLabel="Close Active Recall"
          >
            <X size={19} color={theme.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* ======================================================== */}
        {/* PROGRESS & QUICK QUESTION SELECTOR ROW                   */}
        {/* ======================================================== */}
        <View style={styles.progressRow}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Question <Text style={styles.progressTextBold}>{currentIndex + 1}</Text> of {questions.length}
            </Text>
            <Text style={styles.scoreText}>
              Score: {score}/{answeredCount}
            </Text>
          </View>

          {/* Quick-jump question indicator pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScrollContent}
          >
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const ans = selectedAnswers[idx];
              const isCorrect = ans && ans === q.correctAnswer;
              const isWrong = ans && ans !== q.correctAnswer;

              return (
                <Pressable
                  key={q.id}
                  style={[
                    styles.qPill,
                    isCurrent && styles.qPillCurrent,
                    isCorrect && styles.qPillCorrect,
                    isWrong && styles.qPillWrong,
                  ]}
                  onPress={() => setCurrentIndex(idx)}
                  hitSlop={4}
                >
                  <Text
                    style={[
                      styles.qPillText,
                      isCurrent && styles.qPillTextCurrent,
                      (isCorrect || isWrong) && styles.qPillTextAnswered,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ======================================================== */}
        {/* MAIN QUESTION BODY                                       */}
        {/* ======================================================== */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isCompleted ? (
            /* COMPLETION CARD */
            <View style={styles.completedCard}>
              <View style={styles.trophyCircle}>
                <Award size={36} color="#FBBF24" strokeWidth={1.8} />
              </View>
              <Text style={styles.completedTitle}>
                {singleEvent ? 'Event Recall Quiz Complete!' : 'Daily Active Recall Complete!'}
              </Text>
              <Text style={styles.completedSubtitle}>
                {singleEvent
                  ? `You reviewed all ${questions.length} active recall questions for "${singleEvent.headline}".`
                  : `You reviewed all ${questions.length} UPSC current affairs questions for ${formattedDate}.`}
              </Text>

              <View style={styles.scoreSummaryBox}>
                <Text style={styles.scoreSummaryBig}>{score} / {questions.length}</Text>
                <Text style={styles.scoreSummaryLabel}>
                  {score >= Math.ceil(questions.length * 0.8)
                    ? 'Outstanding Retention! Prelims & Mains Ready 🔥'
                    : score >= Math.ceil(questions.length * 0.6)
                    ? 'Solid Recall! High Conceptual Grasp 🌟'
                    : 'Good Effort! Active Recall Strengthens Long-Term Memory 💡'}
                </Text>
              </View>

              <View style={styles.completedActions}>
                <Pressable
                  style={styles.reviewBtn}
                  onPress={() => {
                    setIsCompleted(false);
                    setCurrentIndex(0);
                  }}
                >
                  <BookOpen size={15} color={isDark ? '#6FBAFF' : '#006FFD'} strokeWidth={2} />
                  <Text style={styles.reviewBtnText}>Review Answers</Text>
                </Pressable>

                <Pressable style={styles.retakeBtn} onPress={handleReset}>
                  <RotateCcw size={15} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.retakeBtnText}>Retake Session</Text>
                </Pressable>
              </View>
            </View>
          ) : currentQuestion ? (
            /* ACTIVE QUESTION VIEW */
            <View style={styles.questionCard}>
              {/* Question Topic & Relevance Tag */}
              <View style={styles.topicRow}>
                <View style={styles.topicBadge}>
                  <Text style={styles.topicBadgeText}>{currentQuestion.topicTag}</Text>
                </View>
              </View>

              {/* Question Stem Prompt */}
              <Text style={styles.questionText}>{currentQuestion.question}</Text>

              {/* Options */}
              <View style={styles.optionsList}>
                {currentQuestion.options.map((opt) => {
                  const userAnswer = selectedAnswers[currentIndex];
                  const isSelected = userAnswer === opt.key;
                  const isAnswered = Boolean(userAnswer);
                  const isCorrect = opt.key === currentQuestion.correctAnswer;

                  const isUserCorrect = isAnswered && isCorrect;
                  const isUserWrong = isAnswered && isSelected && !isCorrect;
                  const isDimmed = isAnswered && !isCorrect && !isSelected;

                  return (
                    <Pressable
                      key={opt.key}
                      style={({ pressed }) => [
                        styles.optionItem,
                        !isAnswered && isSelected && styles.optionItemSelected,
                        isUserCorrect && styles.optionItemCorrect,
                        isUserWrong && styles.optionItemWrong,
                        isDimmed && styles.optionItemDimmed,
                        !isAnswered && pressed && styles.cardPressed,
                      ]}
                      onPress={() => handleSelectOption(opt.key)}
                      disabled={isAnswered}
                    >
                      <View
                        style={[
                          styles.optionKeyBox,
                          isUserCorrect && styles.optionKeyBoxCorrect,
                          isUserWrong && styles.optionKeyBoxWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionKeyText,
                            (isUserCorrect || isUserWrong) && styles.optionKeyTextVerdict,
                          ]}
                        >
                          {opt.key}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.optionItemText,
                          isUserCorrect && styles.optionItemTextCorrect,
                          isUserWrong && styles.optionItemTextWrong,
                        ]}
                      >
                        {opt.text}
                      </Text>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 size={18} color="#10B981" strokeWidth={2.2} style={styles.verdictIcon} />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle size={18} color="#EF4444" strokeWidth={2.2} style={styles.verdictIcon} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Active Recall Explanation (Revealed when answered) */}
              {selectedAnswers[currentIndex] && (
                <EditorialExplanationView
                  isDark={isDark}
                  correctAnswer={currentQuestion.correctAnswer}
                  explanationText={currentQuestion.explanation}
                  syllabusRelevance={currentQuestion.syllabusRelevance}
                  source={currentQuestion.topicTag}
                />
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No events available for this date to generate recall questions.</Text>
            </View>
          )}
        </ScrollView>

        {/* ======================================================== */}
        {/* BOTTOM NAV BAR                                           */}
        {/* ======================================================== */}
        {!isCompleted && questions.length > 0 && (
          <View style={styles.bottomNav}>
            <Pressable
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={handlePrev}
              disabled={currentIndex === 0}
              hitSlop={6}
            >
              <ChevronLeft
                size={16}
                color={currentIndex === 0 ? (isDark ? '#475569' : '#CBD5E1') : theme.textPrimary}
                strokeWidth={2}
              />
              <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>
                Prev
              </Text>
            </Pressable>

            <Pressable
              style={styles.resetBtn}
              onPress={handleReset}
              hitSlop={8}
              accessibilityLabel="Reset answers"
            >
              <RotateCcw size={14} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
              <Text style={styles.resetBtnText}>Restart</Text>
            </Pressable>

            <Pressable
              style={[
                styles.navBtnNext,
                !selectedAnswers[currentIndex] && styles.navBtnNextUnanswered,
              ]}
              onPress={handleNext}
              hitSlop={6}
            >
              <Text style={styles.navBtnNextText}>
                {currentIndex === questions.length - 1 ? 'Finish Session' : 'Next'}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof BW_THEME.dark, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#070C15' : '#F8FAFC',
    },
    container: {
      flex: 1,
      maxWidth: 780,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#162234' : '#E2E8F0',
      backgroundColor: isDark ? '#0B1320' : '#FFFFFF',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#0F172A',
      letterSpacing: -0.2,
    },
    geminiBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#DBEAFE',
    },
    geminiBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
    headerSubtitle: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#64748B',
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPressed: {
      opacity: 0.7,
    },

    /* Progress & Quick Selector Row */
    progressRow: {
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 10,
      backgroundColor: isDark ? '#080E18' : '#F1F5F9',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#162234' : '#E2E8F0',
      gap: 8,
    },
    progressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    progressTextBold: {
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#0F172A',
    },
    scoreText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
    pillsScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    qPill: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: isDark ? '#101B2B' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#1F2E45' : '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    qPillCurrent: {
      borderColor: isDark ? '#38BDF8' : '#1E3A8A',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#DBEAFE',
    },
    qPillCorrect: {
      backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
      borderColor: isDark ? '#10B981' : '#059669',
    },
    qPillWrong: {
      backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
      borderColor: isDark ? '#EF4444' : '#DC2626',
    },
    qPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    qPillTextCurrent: {
      color: isDark ? '#38BDF8' : '#1E3A8A',
      fontWeight: '700',
    },
    qPillTextAnswered: {
      color: isDark ? '#F1F5F9' : '#0F172A',
      fontWeight: '700',
    },

    /* Main Question Area */
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: isDesktop ? 24 : 16,
      paddingBottom: 40,
    },
    questionCard: {
      backgroundColor: isDark ? '#0A1220' : '#FFFFFF',
      borderRadius: 14,
      padding: isDesktop ? 22 : 16,
      borderWidth: 1,
      borderColor: isDark ? '#1A283C' : '#E2E8F0',
    },
    topicRow: {
      marginBottom: 12,
    },
    topicBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F0F9FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
    },
    topicBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0369A1',
      letterSpacing: 0.1,
    },
    questionText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F8FAFC' : '#0F172A',
      lineHeight: 23,
      marginBottom: 18,
    },

    /* Options */
    optionsList: {
      gap: 10,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: isDark ? '#0F1A2A' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? '#1C2B3F' : '#E2E8F0',
    },
    cardPressed: {
      opacity: 0.8,
    },
    optionItemSelected: {
      borderColor: isDark ? '#38BDF8' : '#1E3A8A',
      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#EFF6FF',
    },
    optionItemCorrect: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
      borderColor: isDark ? '#10B981' : '#059669',
    },
    optionItemWrong: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
      borderColor: isDark ? '#EF4444' : '#DC2626',
    },
    optionItemDimmed: {
      opacity: 0.45,
    },
    optionKeyBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: isDark ? '#18273A' : '#E2E8F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionKeyBoxCorrect: {
      backgroundColor: isDark ? '#059669' : '#10B981',
    },
    optionKeyBoxWrong: {
      backgroundColor: isDark ? '#DC2626' : '#EF4444',
    },
    optionKeyText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#E2E8F0' : '#1E293B',
    },
    optionKeyTextVerdict: {
      color: '#FFFFFF',
    },
    optionKeyTextCorrect: {
      color: '#FFFFFF',
    },
    optionKeyTextWrong: {
      color: '#FFFFFF',
    },
    optionItemText: {
      fontSize: 13.5,
      color: isDark ? '#E2E8F0' : '#1E293B',
      lineHeight: 20,
      flex: 1,
    },
    optionItemTextCorrect: {
      color: isDark ? '#34D399' : '#065F46',
      fontWeight: '600',
    },
    optionItemTextWrong: {
      color: isDark ? '#F87171' : '#991B1B',
    },
    verdictIcon: {
      marginLeft: 'auto',
    },

    /* Explanation */
    explanationBox: {
      marginTop: 20,
      padding: 14,
      borderRadius: 10,
      backgroundColor: isDark ? '#07101B' : '#F1F5F9',
      borderLeftWidth: 3,
      borderLeftColor: isDark ? '#38BDF8' : '#0284C7',
      borderWidth: 1,
      borderColor: isDark ? '#162438' : '#E2E8F0',
    },
    explanationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    feedbackSuccessBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
    },
    feedbackSuccessText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#34D399' : '#065F46',
    },
    feedbackMistakeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 5,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
    },
    feedbackMistakeText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#F87171' : '#991B1B',
    },
    correctKeyLabel: {
      fontSize: 11,
      color: isDark ? '#94A3B8' : '#64748B',
    },
    correctKeyBold: {
      fontWeight: '700',
      color: isDark ? '#38BDF8' : '#0284C7',
    },
    explanationBody: {
      fontSize: 13,
      color: isDark ? '#CBD5E1' : '#334155',
      lineHeight: 20,
      marginBottom: 10,
    },
    syllabusBox: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#17273C' : '#E2E8F0',
    },
    syllabusLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: isDark ? '#7DD3FC' : '#0369A1',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    syllabusText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#64748B',
      lineHeight: 18,
    },

    /* Completion View */
    completedCard: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0A1220' : '#FFFFFF',
      borderRadius: 16,
      padding: isDesktop ? 36 : 24,
      borderWidth: 1,
      borderColor: isDark ? '#1C2C42' : '#E2E8F0',
      marginTop: 20,
    },
    trophyCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? '#1E2A3A' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    completedTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#F8FAFC' : '#0F172A',
      textAlign: 'center',
      marginBottom: 6,
    },
    completedSubtitle: {
      fontSize: 13.5,
      color: isDark ? '#94A3B8' : '#64748B',
      textAlign: 'center',
      marginBottom: 24,
    },
    scoreSummaryBox: {
      alignItems: 'center',
      backgroundColor: isDark ? '#0F1B2C' : '#F1F5F9',
      paddingVertical: 18,
      paddingHorizontal: 28,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#1E324C' : '#E2E8F0',
      marginBottom: 24,
      width: '100%',
    },
    scoreSummaryBig: {
      fontSize: 34,
      fontWeight: '900',
      color: isDark ? '#38BDF8' : '#1E3A8A',
      marginBottom: 4,
    },
    scoreSummaryLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#CBD5E1' : '#334155',
      textAlign: 'center',
    },
    completedActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    reviewBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDark ? '#2897FF' : '#006FFD',
    },
    reviewBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#6FBAFF' : '#006FFD',
    },
    retakeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: '#006FFD',
    },
    retakeBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    emptyCard: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#64748B',
      textAlign: 'center',
    },

    /* Bottom Navigation Controls */
    bottomNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isDesktop ? 24 : 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#162234' : '#E2E8F0',
      backgroundColor: isDark ? '#0B1320' : '#FFFFFF',
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: isDark ? '#2F3036' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#383A42' : '#E8E9F1',
    },
    navBtnDisabled: {
      opacity: 0.35,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    navBtnText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1F2024',
    },
    navBtnTextDisabled: {
      color: isDark ? '#494A50' : '#C5C6CC',
    },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    resetBtnText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    navBtnNext: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: '#006FFD',
    },
    navBtnNextUnanswered: {
      opacity: 0.8,
    },
    navBtnNextText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
