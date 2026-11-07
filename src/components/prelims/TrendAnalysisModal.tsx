import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chapter } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';
import { YearWiseTrendGraph } from './YearWiseTrendGraph';

interface TrendAnalysisModalProps {
  visible: boolean;
  chapter: Chapter | null;
  onClose: () => void;
  onStartPractice: (chapter: Chapter, initialYearFilter?: number) => void;
  onStartQuiz: (chapter: Chapter) => void;
}

export function TrendAnalysisModal({
  visible,
  chapter,
  onClose,
  onStartPractice,
  onStartQuiz,
}: TrendAnalysisModalProps) {
  if (!chapter) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{chapter.code}</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                10-Year PYQ Analysis
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={PrelimsTheme.colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Chapter Main Title */}
            <Text style={styles.chapterTitle}>{chapter.title}</Text>

            {/* Key Weightage Metrics Card (Screen 3 style) */}
            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNum}>{chapter.weightagePercent}%</Text>
                <Text style={styles.metricLabel}>Subject Weightage</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNum}>{chapter.totalQuestions10Yrs}</Text>
                <Text style={styles.metricLabel}>Total Questions (10Y)</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricBigNum, { color: '#26734D' }]}>
                  {chapter.isHighYield ? 'Very High' : 'Moderate'}
                </Text>
                <Text style={styles.metricLabel}>Yield Priority</Text>
              </View>
            </View>

            {/* Year-by-Year Interactive Frequency Graph */}
            <YearWiseTrendGraph
              chapter={chapter}
              questions={chapter.pyqs}
              onPracticeQuestions={(year) => {
                onClose();
                onStartPractice(chapter, year);
              }}
            />

            {/* Qualitative Trend Analysis Card */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Ionicons name="bulb-outline" size={18} color="#FF9500" />
                <Text style={styles.analysisCardTitle}>Key Focus Areas</Text>
              </View>
              <Text style={styles.trendSummaryText}>{chapter.trendSummary}</Text>
            </View>

            {/* Recurring High-Frequency Syllabus Sub-Topics */}
            <View style={styles.topicsCard}>
              <Text style={styles.topicsTitle}>Core Recurring Themes (High Yield)</Text>
              {chapter.recurringTopics.map((topic, index) => (
                <View key={index} style={styles.topicRow}>
                  <View style={styles.topicDot}>
                    <Text style={styles.topicIndex}>{index + 1}</Text>
                  </View>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Fixed Action Dock */}
          <View style={styles.bottomDock}>
            <Pressable
              style={({ pressed }) => [styles.dockPracticeBtn, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                onStartPractice(chapter);
              }}
            >
              <Ionicons name="book-outline" size={16} color="#FF9500" />
              <Text style={styles.dockPracticeText}>Practice (Study Mode)</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.dockQuizBtn, pressed && styles.pressed]}
              onPress={() => {
                onClose();
                onStartQuiz(chapter);
              }}
            >
              <Ionicons name="timer-outline" size={16} color="#FFFFFF" />
              <Text style={styles.dockQuizText}>Take Chapter Quiz</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: PrelimsTheme.radius.sheet,
    borderTopRightRadius: PrelimsTheme.radius.sheet,
    maxHeight: '90%',
    minHeight: '65%',
    paddingBottom: 24,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAE5DC',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDF9',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
    lineHeight: 26,
    marginBottom: 16,
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#E9EDF9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9EDF9',
    marginBottom: 16,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricBigNum: {
    fontSize: 18,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PrelimsTheme.colors.textMuted,
    marginTop: 3,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EAE5DC',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9EDF9',
    marginBottom: 16,
    ...PrelimsTheme.shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 11,
    color: PrelimsTheme.colors.textSecondary,
    marginTop: 2,
  },
  chartBadge: {
    backgroundColor: '#E3F1E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#26734D',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE6',
    paddingBottom: 4,
  },
  colWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 4,
  },
  chartBar: {
    width: 14,
    backgroundColor: '#CBD3EB',
    borderRadius: 6,
  },
  chartBarHighlight: {
    backgroundColor: '#FF9500',
  },
  yearLabel: {
    fontSize: 10,
    color: PrelimsTheme.colors.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  yearLabelHighlight: {
    color: '#FF9500',
    fontWeight: '700',
  },
  analysisCard: {
    backgroundColor: '#E9EDF9',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD3EB',
    marginBottom: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  analysisCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF9500',
  },
  trendSummaryText: {
    fontSize: 13,
    color: PrelimsTheme.colors.textPrimary,
    lineHeight: 19,
  },
  topicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9EDF9',
    marginBottom: 16,
    ...PrelimsTheme.shadows.card,
  },
  topicsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
    marginBottom: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  topicDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  topicIndex: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
  },
  topicText: {
    fontSize: 13,
    color: PrelimsTheme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  bottomDock: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9EDF9',
  },
  dockPracticeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF9500',
    paddingVertical: 13,
    borderRadius: PrelimsTheme.radius.pill,
    gap: 6,
  },
  dockPracticeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9500',
  },
  dockQuizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PrelimsTheme.colors.darkButton,
    paddingVertical: 13,
    borderRadius: PrelimsTheme.radius.pill,
    gap: 6,
  },
  dockQuizText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
