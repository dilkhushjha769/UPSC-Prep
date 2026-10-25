import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { X, CheckCircle2, Circle, CheckSquare, Square } from '@/components/common/LucideIcons';
import { Subject, QuizConfig } from '@/types/prelims';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';

interface QuizGeneratorModalProps {
  visible: boolean;
  subjects: Subject[];
  onClose: () => void;
  onGenerateQuiz: (config: QuizConfig) => void;
}

export function QuizGeneratorModal({
  visible,
  subjects,
  onClose,
  onGenerateQuiz,
}: QuizGeneratorModalProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [yearRange, setYearRange] = useState<'all' | 'recent5'>('recent5');
  const [difficulty, setDifficulty] = useState<'all' | 'medium-hard'>('all');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);

  if (!visible) return null;

  const handleLaunch = () => {
    const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
    const subTitle = selectedSubjectId === 'all' ? 'Full Prelims Mock' : `${selectedSub?.shortTitle} Focus Quiz`;

    const config: QuizConfig = {
      title: `${subTitle} (${questionCount} Qs)`,
      subjectId: selectedSubjectId === 'all' ? undefined : selectedSubjectId,
      questionCount,
      durationMinutes,
      yearRange,
      difficulty,
      negativeMarking,
    };

    onClose();
    onGenerateQuiz(config);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <BlueTextureBackground isDark={theme.isDark} />
          {/* Header */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.headerTitle}>Generate Quiz</Text>
              <Text style={styles.headerSubtitle}>Configure Custom Mock Test</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Subject Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Target Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                <Pressable
                  style={[
                    styles.chip,
                    selectedSubjectId === 'all' && styles.chipActive,
                  ]}
                  onPress={() => setSelectedSubjectId('all')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedSubjectId === 'all' && styles.chipTextActive,
                    ]}
                  >
                    All Subjects (GS-1 & CSAT)
                  </Text>
                </Pressable>

                {subjects.map((sub) => (
                  <Pressable
                    key={sub.id}
                    style={[
                      styles.chip,
                      selectedSubjectId === sub.id && styles.chipActive,
                    ]}
                    onPress={() => setSelectedSubjectId(sub.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedSubjectId === sub.id && styles.chipTextActive,
                      ]}
                    >
                      {sub.shortTitle}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* 2. Number of Questions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Number of Questions</Text>
              <View style={styles.segmentedRow}>
                {[10, 15, 20, 30].map((num) => (
                  <Pressable
                    key={num}
                    style={[
                      styles.segmentPill,
                      questionCount === num && styles.segmentPillActive,
                    ]}
                    onPress={() => {
                      setQuestionCount(num);
                      setDurationMinutes(Math.round(num * 1.5));
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        questionCount === num && styles.segmentTextActive,
                      ]}
                    >
                      {num} Qs
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 3. Duration */}
            <View style={styles.section}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>3. Time Duration</Text>
                <Text style={styles.timeTag}>{durationMinutes} Minutes</Text>
              </View>
              <View style={styles.segmentedRow}>
                {[10, 15, 20, 30, 45].map((mins) => (
                  <Pressable
                    key={mins}
                    style={[
                      styles.segmentPill,
                      durationMinutes === mins && styles.segmentPillActive,
                    ]}
                    onPress={() => setDurationMinutes(mins)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        durationMinutes === mins && styles.segmentTextActive,
                      ]}
                    >
                      {mins}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 4. PYQ Decade Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. PYQ Question Pool</Text>
              <View style={styles.optionCardsRow}>
                <Pressable
                  style={[
                    styles.optionCard,
                    yearRange === 'recent5' && styles.optionCardActive,
                  ]}
                  onPress={() => setYearRange('recent5')}
                >
                  <View style={styles.optionCardHeader}>
                    {yearRange === 'recent5' ? (
                      <CheckCircle2 size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
                    ) : (
                      <Circle size={16} color={theme.colors.textMuted} strokeWidth={1.8} />
                    )}
                    <Text style={styles.optionCardTitle}>2020 - 2024</Text>
                  </View>
                  <Text style={styles.optionCardDesc}>
                    Latest trend with pair matching & multi-statement questions
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.optionCard,
                    yearRange === 'all' && styles.optionCardActive,
                  ]}
                  onPress={() => setYearRange('all')}
                >
                  <View style={styles.optionCardHeader}>
                    {yearRange === 'all' ? (
                      <CheckCircle2 size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
                    ) : (
                      <Circle size={16} color={theme.colors.textMuted} strokeWidth={1.8} />
                    )}
                    <Text style={styles.optionCardTitle}>2014 - 2024</Text>
                  </View>
                  <Text style={styles.optionCardDesc}>
                    Complete 10-year question repository covering all dimensions
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 5. Difficulty Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Difficulty Calibration</Text>
              <View style={styles.optionCardsRow}>
                <Pressable
                  style={[
                    styles.optionCard,
                    difficulty === 'all' && styles.optionCardActive,
                  ]}
                  onPress={() => setDifficulty('all')}
                >
                  <View style={styles.optionCardHeader}>
                    {difficulty === 'all' ? (
                      <CheckCircle2 size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
                    ) : (
                      <Circle size={16} color={theme.colors.textMuted} strokeWidth={1.8} />
                    )}
                    <Text style={styles.optionCardTitle}>Standard UPSC</Text>
                  </View>
                  <Text style={styles.optionCardDesc}>
                    Realistic mix of Foundation, Moderate, and Analytical questions
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.optionCard,
                    difficulty === 'medium-hard' && styles.optionCardActive,
                  ]}
                  onPress={() => setDifficulty('medium-hard')}
                >
                  <View style={styles.optionCardHeader}>
                    {difficulty === 'medium-hard' ? (
                      <CheckCircle2 size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
                    ) : (
                      <Circle size={16} color={theme.colors.textMuted} strokeWidth={1.8} />
                    )}
                    <Text style={styles.optionCardTitle}>Hard / Elimination</Text>
                  </View>
                  <Text style={styles.optionCardDesc}>
                    Focus on tricky, elimination-proof & multi-statement questions
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 6. Negative Marking Scheme Toggle */}
            <Pressable
              style={styles.schemeCard}
              onPress={() => setNegativeMarking(!negativeMarking)}
            >
              <View style={styles.schemeIconBox}>
                {negativeMarking ? (
                  <CheckSquare size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
                ) : (
                  <Square size={18} color={theme.colors.textMuted} strokeWidth={1.8} />
                )}
              </View>
              <View style={styles.schemeTextBox}>
                <Text style={styles.schemeTitle}>
                  {negativeMarking ? 'Negative Marking Enabled (-0.66 Marks)' : 'No Negative Marking (Practice)'}
                </Text>
                <Text style={styles.schemeDesc}>
                  {negativeMarking
                    ? 'UPSC Prelims scheme: +2.0 marks for correct, 1/3rd penalty (-0.66) for wrong answers.'
                    : 'Untimed scoring without penalties for wrong answers.'}
                </Text>
              </View>
            </Pressable>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.bottomDock}>
            <Pressable
              style={({ pressed }) => [styles.generateBtn, pressed && styles.pressed]}
              onPress={handleLaunch}
            >
              <Text style={styles.generateBtnText}>Start Quiz</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: PrelimsThemeType) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.bgSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderCard,
    height: '85%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderCard,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  chipActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.darkButtonText,
    fontWeight: '700',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  segmentPillActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: theme.colors.darkButtonText,
  },
  optionCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  optionCardActive: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: '#1E293B',
  },
  optionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  optionCardDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
  },
  schemeCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  schemeIconBox: {
    marginTop: 1,
  },
  schemeTextBox: {
    flex: 1,
    gap: 2,
  },
  schemeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  schemeDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  bottomDock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderCard,
    backgroundColor: theme.colors.bgSurface,
  },
  generateBtn: {
    backgroundColor: theme.colors.darkButton,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.darkButtonText,
  },
  pressed: {
    opacity: 0.75,
  },
});
