import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chapter } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';
import { YearWiseTrendGraph } from './YearWiseTrendGraph';

interface ChapterDetailModalProps {
  visible: boolean;
  chapter: Chapter | null;
  serialNumber?: number;
  onClose: () => void;
  onStartPractice: (chapter: Chapter, initialYearFilter?: number) => void;
  onStartQuiz: (chapter: Chapter) => void;
}

export function ChapterDetailModal({
  visible,
  chapter,
  serialNumber,
  onClose,
  onStartPractice,
  onStartQuiz,
}: ChapterDetailModalProps) {
  if (!chapter) return null;

  const serialLabel = serialNumber
    ? String(serialNumber).padStart(2, '0')
    : chapter.code;

  const avgQuestions = (chapter.totalQuestions10Yrs / 10).toFixed(1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.topBar}>
            <View style={styles.headerInfo}>
              <View style={styles.serialBox}>
                <Text style={styles.serialText}>{serialLabel}</Text>
              </View>
              <Text style={styles.headerTitle}>Chapter Details</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#000000" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Chapter Title */}
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            <Text style={styles.chapterSubtitle}>
              UPSC Civil Services Prelims · General Studies Paper I
            </Text>

            {/* Key Weightage Metrics Card */}
            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNum}>{chapter.weightagePercent}%</Text>
                <Text style={styles.metricLabel}>Overall Weightage</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNum}>{chapter.totalQuestions10Yrs}</Text>
                <Text style={styles.metricLabel}>10-Year PYQs</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNum}>~{avgQuestions}</Text>
                <Text style={styles.metricLabel}>Avg. Qs / Year</Text>
              </View>
            </View>

            {/* Solving Options: Practice & Quiz */}
            <Text style={styles.sectionHeading}>SOLVE 10-YEAR PYQs</Text>

            <View style={styles.actionsContainer}>
              {/* Practice Mode Card */}
              <Pressable
                style={({ pressed }) => [styles.actionCardPractice, pressed && styles.pressed]}
                onPress={() => {
                  onClose();
                  onStartPractice(chapter);
                }}
              >
                <View style={styles.actionIconBoxPractice}>
                  <Ionicons name="book-outline" size={18} color="#000000" />
                </View>
                <View style={styles.actionTextBox}>
                  <View style={styles.actionTitleRow}>
                    <Text style={styles.actionTitlePractice}>Practice (Study Mode)</Text>
                    <View style={styles.untimedTag}>
                      <Text style={styles.untimedTagText}>Untimed</Text>
                    </View>
                  </View>
                  <Text style={styles.actionDesc}>
                    Solve step-by-step with official UPSC answer keys, core concepts, and elimination notes.
                  </Text>
                </View>
              </Pressable>

              {/* Quiz Mode Card */}
              <Pressable
                style={({ pressed }) => [styles.actionCardQuiz, pressed && styles.pressed]}
                onPress={() => {
                  onClose();
                  onStartQuiz(chapter);
                }}
              >
                <View style={styles.actionIconBoxQuiz}>
                  <Ionicons name="timer-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.actionTextBox}>
                  <View style={styles.actionTitleRow}>
                    <Text style={styles.actionTitleQuiz}>Take Timed Quiz</Text>
                    <View style={styles.timedTag}>
                      <Text style={styles.timedTagText}>UPSC Marking</Text>
                    </View>
                  </View>
                  <Text style={styles.actionDescQuiz}>
                    Simulate real exam pressure with negative marking (+2.0 correct, -0.66 wrong) & scorecard.
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* 10-Year Trend Analysis (2015 - 2024) */}
            <Text style={styles.sectionHeading}>10-YEAR TREND ANALYSIS (2015–2024)</Text>

            {/* Interactive Year-Wise Trend Graph */}
            <YearWiseTrendGraph
              chapter={chapter}
              questions={chapter.pyqs}
              onPracticeQuestions={(year) => {
                onClose();
                onStartPractice(chapter, year);
              }}
            />

            {/* Pattern Insights */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb-outline" size={16} color="#000000" />
                <Text style={styles.insightTitle}>Examiner Trend & Focus</Text>
              </View>
              <Text style={styles.insightText}>{chapter.trendSummary}</Text>
            </View>

            {/* Core Recurring Themes */}
            {chapter.recurringTopics.length > 0 && (
              <View style={styles.themesCard}>
                <Text style={styles.themesTitle}>High-Yield Recurring Themes</Text>
                {chapter.recurringTopics.map((topic, index) => (
                  <View key={index} style={styles.themeRow}>
                    <View style={styles.themeIndexBox}>
                      <Text style={styles.themeIndexText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.themeText}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '92%',
    paddingBottom: 20,
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serialBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
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
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 26,
    marginBottom: 4,
  },
  chapterSubtitle: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
    marginBottom: 16,
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 20,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricBigNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 3,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E4E4E7',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 22,
  },
  actionCardPractice: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  actionIconBoxPractice: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionTitlePractice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  untimedTag: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  untimedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525B',
  },
  actionDesc: {
    fontSize: 12,
    color: '#52525B',
    lineHeight: 17,
  },
  actionCardQuiz: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  actionIconBoxQuiz: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionTitleQuiz: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timedTag: {
    backgroundColor: '#27272A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionDescQuiz: {
    fontSize: 12,
    color: '#D4D4D8',
    lineHeight: 17,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 14,
    ...PrelimsTheme.shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  chartBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    paddingBottom: 4,
  },
  colWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barCountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 3,
  },
  barCountLabelActive: {
    fontWeight: '800',
    color: '#000000',
  },
  chartBar: {
    width: 14,
    backgroundColor: '#F4F4F5',
    borderRadius: 4,
  },
  chartBarActive: {
    backgroundColor: '#71717A',
  },
  chartBarLatest: {
    backgroundColor: '#000000',
  },
  yearLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    marginTop: 5,
    fontWeight: '500',
  },
  yearLabelLatest: {
    color: '#000000',
    fontWeight: '700',
  },
  insightCard: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 14,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  insightText: {
    fontSize: 12,
    color: '#3F3F46',
    lineHeight: 18,
  },
  themesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 14,
    ...PrelimsTheme.shadows.card,
  },
  themesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  themeIndexBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  themeIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
  },
  themeText: {
    fontSize: 12,
    color: '#52525B',
    flex: 1,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.995 }],
  },
});
