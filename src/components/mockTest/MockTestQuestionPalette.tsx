import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { X } from '@/components/common/LucideIcons';
import { BW_THEME } from '@/constants/bwTheme';
import { MockTestQuestionRecord, MockTestResponseRecord } from '@/types/mockTest';

interface MockTestQuestionPaletteProps {
  questions: MockTestQuestionRecord[];
  responses: Record<string, MockTestResponseRecord>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  onClose?: () => void;
  isDark?: boolean;
}

export function MockTestQuestionPalette({
  questions,
  responses,
  currentIndex,
  onSelectQuestion,
  onClose,
  isDark = true,
}: MockTestQuestionPaletteProps) {
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [filter, setFilter] = useState<'all' | 'answered' | 'marked' | 'unattempted'>('all');

  const stats = useMemo(() => {
    let answered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let unattempted = 0;

    questions.forEach((q) => {
      const resp = responses[q.question_id];
      const hasAnswer = resp?.selected_answer && resp.selected_answer.trim().length > 0;
      const isMarked = Boolean(resp?.is_marked_for_review);

      if (hasAnswer && isMarked) {
        answeredAndMarked++;
      } else if (hasAnswer) {
        answered++;
      } else if (isMarked) {
        marked++;
      } else {
        unattempted++;
      }
    });

    return { answered, marked, answeredAndMarked, unattempted, total: questions.length };
  }, [questions, responses]);

  const filteredQuestions = useMemo(() => {
    return questions.map((q, index) => {
      const resp = responses[q.question_id];
      const hasAnswer = resp?.selected_answer && resp.selected_answer.trim().length > 0;
      const isMarked = Boolean(resp?.is_marked_for_review);

      let status: 'answered' | 'marked' | 'answered_marked' | 'unattempted' = 'unattempted';
      if (hasAnswer && isMarked) status = 'answered_marked';
      else if (hasAnswer) status = 'answered';
      else if (isMarked) status = 'marked';

      return { q, index, status };
    }).filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'answered') return item.status === 'answered' || item.status === 'answered_marked';
      if (filter === 'marked') return item.status === 'marked' || item.status === 'answered_marked';
      if (filter === 'unattempted') return item.status === 'unattempted';
      return true;
    });
  }, [questions, responses, filter]);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Question Palette</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {stats.answered + stats.answeredAndMarked} of {stats.total} Answered
          </Text>
        </View>
        {onClose && (
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.activeBg }]}>
            <X size={18} color={theme.textPrimary} />
          </Pressable>
        )}
      </View>

      {/* Legend & Stats Summary */}
      <View style={[styles.legendContainer, { backgroundColor: isDark ? '#111524' : '#F1F5FD' }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Answered ({stats.answered})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Marked ({stats.marked})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Both ({stats.answeredAndMarked})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.textMuted }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Left ({stats.unattempted})</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'answered', 'marked', 'unattempted'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            style={[
              styles.filterTab,
              filter === tab && {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.buttonPrimaryBg,
              },
            ]}>
            <Text
              style={[
                styles.filterTabText,
                { color: filter === tab ? theme.buttonPrimaryText : theme.textSecondary },
              ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Questions Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredQuestions.map(({ q, index, status }) => {
            const isCurrent = index === currentIndex;

            let bgColor = isDark ? '#1C2438' : '#E2E8F0';
            let textColor = isDark ? '#94A3B8' : '#475569';
            let borderColor = 'transparent';

            if (status === 'answered') {
              bgColor = '#065F46';
              textColor = '#A7F3D0';
            } else if (status === 'marked') {
              bgColor = '#78350F';
              textColor = '#FDE68A';
            } else if (status === 'answered_marked') {
              bgColor = '#4C1D95';
              textColor = '#DDD6FE';
            }

            if (isCurrent) {
              borderColor = theme.buttonPrimaryBg;
            }

            return (
              <Pressable
                key={q.question_id}
                onPress={() => {
                  onSelectQuestion(index);
                  if (onClose && isMobile) onClose();
                }}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: isCurrent ? 2 : 1,
                  },
                ]}>
                <Text style={[styles.bubbleText, { color: textColor, fontWeight: isCurrent ? '800' : '600' }]}>
                  {index + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gridContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 13,
  },
});
