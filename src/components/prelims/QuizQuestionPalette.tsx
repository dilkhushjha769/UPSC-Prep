import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Check,
  Flag,
} from '@/components/common/LucideIcons';
import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';
import { PYQQuestion } from '@/types/prelims';

export type QuestionNavStatus =
  | 'not_visited'
  | 'unanswered'
  | 'answered'
  | 'marked'
  | 'answered_marked';

export interface QuizQuestionPaletteProps {
  questions: PYQQuestion[];
  currentIndex: number;
  selectedAnswers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  markedForReview: Record<number, boolean>;
  visitedIndices: Record<number, boolean>;
  onSelectQuestion: (index: number) => void;
  onSubmitQuiz: () => void;
  onCloseMobileDrawer?: () => void;
  isMobile?: boolean;
}

export function QuizQuestionPalette({
  questions,
  currentIndex,
  selectedAnswers,
  markedForReview,
  visitedIndices,
  onSelectQuestion,
  onSubmitQuiz,
  onCloseMobileDrawer,
  isMobile = false,
}: QuizQuestionPaletteProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme, isMobile), [theme, isMobile]);

  // Derived state function for question status
  const getQuestionStatus = (idx: number): QuestionNavStatus => {
    const isAnswered = selectedAnswers[idx] !== undefined;
    const isMarked = !!markedForReview[idx];
    const isVisited = !!visitedIndices[idx] || idx === currentIndex;

    if (isAnswered && isMarked) return 'answered_marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'unanswered';
    return 'not_visited';
  };

  // Summary statistics
  const stats = useMemo(() => {
    let answered = 0;
    let unanswered = 0;
    let marked = 0;
    let answeredMarked = 0;
    let notVisited = 0;

    questions.forEach((_, idx) => {
      const isAnswered = selectedAnswers[idx] !== undefined;
      const isMarked = !!markedForReview[idx];
      const isVisited = !!visitedIndices[idx] || idx === currentIndex;

      if (isAnswered && isMarked) {
        answeredMarked++;
      } else if (isMarked) {
        marked++;
      } else if (isAnswered) {
        answered++;
      } else if (isVisited) {
        unanswered++;
      } else {
        notVisited++;
      }
    });

    return {
      total: questions.length,
      answered,
      unanswered,
      marked,
      answeredMarked,
      totalAnswered: answered + answeredMarked,
      totalMarked: marked + answeredMarked,
      notVisited,
    };
  }, [questions, selectedAnswers, markedForReview, visitedIndices, currentIndex]);

  const handlePressQuestion = (index: number) => {
    onSelectQuestion(index);
    if (isMobile && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <View style={styles.paletteContainer}>
      {/* 1. Header & Summary Stats */}
      <View style={styles.paletteHeader}>
        <View style={styles.paletteTitleRow}>
          <Text style={styles.paletteTitle}>Question Palette</Text>
          <View style={styles.progressCounterBadge}>
            <Text style={styles.progressCounterText}>
              {stats.totalAnswered}/{questions.length} Attempted
            </Text>
          </View>
        </View>

        {/* Compact 4-Box Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, styles.statBoxAnswered]}>
            <Text style={[styles.statBoxNum, { color: '#10B981' }]}>
              {stats.totalAnswered}
            </Text>
            <Text style={styles.statBoxLabel}>Answered</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxUnanswered]}>
            <Text style={[styles.statBoxNum, { color: '#EF4444' }]}>
              {stats.unanswered}
            </Text>
            <Text style={styles.statBoxLabel}>Unanswered</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxMarked]}>
            <Text style={[styles.statBoxNum, { color: '#8B5CF6' }]}>
              {stats.totalMarked}
            </Text>
            <Text style={styles.statBoxLabel}>Review</Text>
          </View>

          <View style={[styles.statBox, styles.statBoxNotVisited]}>
            <Text style={[styles.statBoxNum, { color: theme.isDark ? '#E2E8F0' : '#475569' }]}>
              {stats.notVisited}
            </Text>
            <Text style={styles.statBoxLabel}>Not Visited</Text>
          </View>
        </View>
      </View>

      {/* 2. Visual Status Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendPill, styles.bubbleAnswered]}>
              <Check size={10} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.legendText}>Answered</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendPill, styles.bubbleUnanswered]} />
            <Text style={styles.legendText}>Not Answered</Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendPill, styles.bubbleMarked]}>
              <Flag size={9} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.legendText}>Marked for Review</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendPill, styles.bubbleAnsweredMarked]}>
              <View style={styles.greenDotIndicator} />
            </View>
            <Text style={styles.legendText}>Ans & Marked</Text>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendPill, styles.bubbleNotVisited]} />
            <Text style={styles.legendText}>Not Visited</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendPill, styles.bubbleCurrentLegend]} />
            <Text style={styles.legendText}>Current Q</Text>
          </View>
        </View>
      </View>

      {/* 3. Question Numbers Grid */}
      <View style={styles.gridSectionHeader}>
        <Text style={styles.gridSectionTitle}>SELECT QUESTION TO JUMP</Text>
      </View>

      <ScrollView
        style={styles.gridScrollArea}
        contentContainerStyle={styles.gridScrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.numbersGrid}>
          {questions.map((_, idx) => {
            const status = getQuestionStatus(idx);
            const isCurrent = idx === currentIndex;

            return (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  styles.questionBubble,
                  status === 'answered' && styles.bubbleAnswered,
                  status === 'unanswered' && styles.bubbleUnanswered,
                  status === 'marked' && styles.bubbleMarked,
                  status === 'answered_marked' && styles.bubbleAnsweredMarked,
                  status === 'not_visited' && styles.bubbleNotVisited,
                  isCurrent && styles.bubbleCurrent,
                  pressed && styles.bubblePressed,
                ]}
                onPress={() => handlePressQuestion(idx)}
                accessibilityRole="button"
                accessibilityLabel={`Question ${idx + 1}, ${status.replace('_', ' ')}`}
              >
                <Text
                  style={[
                    styles.questionNumberText,
                    status === 'not_visited' && styles.textNotVisited,
                    isCurrent && styles.textCurrent,
                  ]}
                >
                  {idx + 1}
                </Text>

                {/* Corner indicator badge for Answered & Marked */}
                {status === 'answered_marked' && (
                  <View style={styles.bubbleCornerDot} />
                )}

                {/* Flag indicator for Marked */}
                {status === 'marked' && (
                  <View style={styles.bubbleMiniFlag}>
                    <Flag size={7} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 4. Submit Exam CTA Dock */}
      <View style={styles.submitDock}>
        <Pressable
          style={({ pressed }) => [styles.submitExamBtn, pressed && styles.btnPressed]}
          onPress={onSubmitQuiz}
          accessibilityRole="button"
          accessibilityLabel="Submit UPSC Exam"
        >
          <Text style={styles.submitExamBtnText}>
            Submit Test ({stats.totalAnswered}/{questions.length})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType, isMobile: boolean) => {
  const isDark = theme.isDark;

  return StyleSheet.create({
    paletteContainer: {
      flex: 1,
      backgroundColor: theme.colors.bgSurface,
      borderColor: theme.colors.borderCard,
      borderWidth: isMobile ? 0 : 1,
      borderRadius: isMobile ? 0 : 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    paletteHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
      gap: 12,
    },
    paletteTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    paletteTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    progressCounterBadge: {
      backgroundColor: isDark ? '#262D3D' : '#EDE9FE',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    progressCounterText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#C4B5FD' : '#6D28D9',
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 6,
    },
    statBox: {
      flex: 1,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      backgroundColor: isDark ? '#1C202B' : '#F8FAFC',
      borderColor: theme.colors.borderSubtle,
    },
    statBoxAnswered: {
      borderColor: isDark ? '#065F46' : '#A7F3D0',
      backgroundColor: isDark ? '#06281E' : '#ECFDF5',
    },
    statBoxUnanswered: {
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
      backgroundColor: isDark ? '#2A1215' : '#FEF2F2',
    },
    statBoxMarked: {
      borderColor: isDark ? '#5B21B6' : '#DDD6FE',
      backgroundColor: isDark ? '#23153C' : '#F5F3FF',
    },
    statBoxNotVisited: {
      borderColor: isDark ? '#475569' : '#CBD5E1',
      backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
    },
    statBoxNum: {
      fontSize: 14,
      fontWeight: '800',
      lineHeight: 18,
    },
    statBoxLabel: {
      fontSize: 9,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    legendContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
      gap: 6,
      backgroundColor: isDark ? '#181B24' : '#F8FAFC',
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      flex: 1,
    },
    legendPill: {
      width: 18,
      height: 18,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    legendText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    gridSectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
    },
    gridSectionTitle: {
      fontSize: 9.5,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.6,
    },
    gridScrollArea: {
      flex: 1,
      maxHeight: isMobile ? 320 : undefined,
    },
    gridScrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    numbersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    questionBubble: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      position: 'relative',
    },
    bubbleAnswered: {
      backgroundColor: '#10B981',
      borderColor: '#059669',
    },
    bubbleUnanswered: {
      backgroundColor: '#EF4444',
      borderColor: '#DC2626',
    },
    bubbleMarked: {
      backgroundColor: '#8B5CF6',
      borderColor: '#7C3AED',
    },
    bubbleAnsweredMarked: {
      backgroundColor: '#8B5CF6',
      borderColor: '#7C3AED',
    },
    bubbleNotVisited: {
      backgroundColor: isDark ? '#334155' : '#FFFFFF',
      borderColor: isDark ? '#64748B' : '#94A3B8',
    },
    bubbleCurrent: {
      borderWidth: 2.5,
      borderColor: theme.colors.textPrimary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
    },
    bubbleCurrentLegend: {
      borderWidth: 2,
      borderColor: theme.colors.textPrimary,
      backgroundColor: isDark ? '#262D3D' : '#E2E8F0',
    },
    bubblePressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.85,
    },
    questionNumberText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    textNotVisited: {
      color: isDark ? '#F1F5F9' : '#334155',
    },
    textCurrent: {
      fontWeight: '900',
    },
    bubbleCornerDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
    greenDotIndicator: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#10B981',
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
    bubbleMiniFlag: {
      position: 'absolute',
      top: 1.5,
      right: 1.5,
    },
    submitDock: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderSubtle,
      backgroundColor: isDark ? '#1A1D27' : '#F8FAFC',
    },
    submitExamBtn: {
      backgroundColor: '#10B981',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    submitExamBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.1,
    },
    btnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
  });
};
