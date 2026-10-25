import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Timer,
  X,
} from '@/components/common/LucideIcons';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';
import { getChapterShortNotes, getChapterQuestions } from '@/data/prelimsData';
import { Chapter, Subject } from '@/types/prelims';
import { YearWiseTrendGraph } from './YearWiseTrendGraph';
import React, { useState, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface ChapterDetailViewProps {
  chapter: Chapter;
  subject: Subject;
  serialNumber?: number;
  onBack: () => void;
  onStartPractice: (chapter: Chapter, initialYearFilter?: number) => void;
  onStartQuiz: (chapter: Chapter, questionCount?: number, durationMinutes?: number) => void;
}

export function ChapterDetailView({
  chapter,
  subject,
  serialNumber,
  onBack,
  onStartPractice,
  onStartQuiz,
}: ChapterDetailViewProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [isQuickRevisionOpen, setIsQuickRevisionOpen] = useState(false);
  const [isQuizConfigOpen, setIsQuizConfigOpen] = useState(false);

  const totalQs = chapter.totalQuestions10Yrs || 10;
  const initialQCount = Math.min(10, totalQs);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(initialQCount);
  const [quizDurationMinutes, setQuizDurationMinutes] = useState<number>(
    Math.max(5, Math.round(initialQCount * 1.5))
  );

  // Custom typed input states
  const [customQuestionText, setCustomQuestionText] = useState<string>('');
  const [customDurationText, setCustomDurationText] = useState<string>('');

  const serialLabel = serialNumber
    ? String(serialNumber).padStart(2, '0')
    : chapter.code;

  const avgPerYear = (chapter.totalQuestions10Yrs / 10).toFixed(1);
  const shortNotes = getChapterShortNotes(chapter);
  const chapterQuestions = useMemo(() => getChapterQuestions(chapter), [chapter]);

  // Compute question count pills dynamically based on total questions available
  const questionCountOptions: { label: string; count: number }[] = [];
  if (totalQs > 5) questionCountOptions.push({ label: '5 Qs', count: 5 });
  if (totalQs > 10) questionCountOptions.push({ label: '10 Qs', count: 10 });
  if (totalQs > 15) questionCountOptions.push({ label: '15 Qs', count: 15 });
  questionCountOptions.push({ label: `All (${totalQs})`, count: totalQs });

  // Duration options in minutes
  const durationOptions = [5, 10, 15, 20, 30];

  const handleCustomQuestionTextChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setCustomQuestionText(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(parsed, totalQs);
      setQuizQuestionCount(clamped);
      if (!customDurationText) {
        setQuizDurationMinutes(Math.max(5, Math.round(clamped * 1.5)));
      }
    }
  };

  const handleCustomDurationTextChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setCustomDurationText(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(parsed, 180);
      setQuizDurationMinutes(clamped);
    }
  };

  const handleSelectQuestionPill = (count: number) => {
    setQuizQuestionCount(count);
    setCustomQuestionText('');
    if (!customDurationText) {
      setQuizDurationMinutes(Math.max(5, Math.round(count * 1.5)));
    }
  };

  const handleSelectDurationPill = (mins: number) => {
    setQuizDurationMinutes(mins);
    setCustomDurationText('');
  };

  const handleLaunchQuiz = () => {
    let finalCount = quizQuestionCount;
    if (customQuestionText) {
      const parsed = parseInt(customQuestionText, 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalCount = Math.min(Math.max(1, parsed), totalQs);
      }
    }
    let finalDuration = quizDurationMinutes;
    if (customDurationText) {
      const parsed = parseInt(customDurationText, 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalDuration = Math.min(Math.max(1, parsed), 180);
      }
    }
    setIsQuizConfigOpen(false);
    onStartQuiz(chapter, finalCount, finalDuration);
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onBack}
        >
          <ArrowLeft size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.backButtonText}>{subject.shortTitle} Chapters</Text>
        </Pressable>

        <View style={styles.serialBadge}>
          <Text style={styles.serialBadgeText}>{serialLabel}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chapter Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.subjectContext}>
            {subject.title} · {chapter.totalQuestions10Yrs} Questions (2015–2024)
          </Text>
        </View>

        {/* Overall Weightage & Core Metrics Bar */}
        <View style={styles.metricsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricValue}>{chapter.weightagePercent}%</Text>
            <Text style={styles.metricLabel}>Weightage</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <Text style={styles.metricValue}>{chapter.totalQuestions10Yrs}</Text>
            <Text style={styles.metricLabel}>10-Yr PYQs</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <Text style={styles.metricValue}>~{avgPerYear}</Text>
            <Text style={styles.metricLabel}>Avg / Year</Text>
          </View>
        </View>

        {/* Practice & Quiz in Compact Button Format */}
        <View style={styles.buttonsRow}>
          <Pressable
            style={({ pressed }) => [styles.btnPractice, pressed && styles.btnPressed]}
            onPress={() => onStartPractice(chapter)}
          >
            <BookOpen size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
            <Text style={styles.btnPracticeText}>Practice Mode</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.btnQuiz, pressed && styles.btnPressed]}
            onPress={() => setIsQuizConfigOpen(true)}
          >
            <Timer size={16} color={theme.colors.darkButtonText} strokeWidth={2.2} />
            <Text style={styles.btnQuizText}>Take Quiz</Text>
          </Pressable>
        </View>

        {/* QUICK REVISION CARD (Placed Above Trends, Expandable on Click) */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.quickRevisionCard,
              isQuickRevisionOpen && styles.quickRevisionCardActive,
              pressed && styles.pressed,
            ]}
            onPress={() => setIsQuickRevisionOpen(!isQuickRevisionOpen)}
          >
            <View style={styles.quickRevisionLeft}>
              <View style={styles.quickRevisionIconBadge}>
                <FileText size={17} color={theme.colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View style={styles.quickRevisionTextCol}>
                <View style={styles.quickRevisionTitleRow}>
                  <Text style={styles.quickRevisionTitle}>Quick Revision</Text>
                </View>
                <Text style={styles.quickRevisionSubtitle}>
                  {shortNotes.length} Core Concept Summaries & Key Pointers
                </Text>
              </View>
            </View>

            <View style={styles.quickRevisionRight}>
              {isQuickRevisionOpen ? (
                <ChevronUp size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} color={theme.colors.textSecondary} strokeWidth={2.2} />
              )}
            </View>
          </Pressable>

          {/* Expanded Short Notes / Quick Revision Content */}
          {isQuickRevisionOpen && (
            <View style={styles.quickRevisionExpandedContainer}>
              {shortNotes.map((section, idx) => (
                <View key={idx} style={styles.noteCard}>
                  <Text style={styles.noteHeading}>{section.heading}</Text>
                  <View style={styles.notePointsList}>
                    {section.points.map((pt, pIdx) => (
                      <View key={pIdx} style={styles.notePointRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.notePointText}>{pt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 10-YEAR INTERACTIVE TREND GRAPH */}
        <YearWiseTrendGraph
          chapter={chapter}
          questions={chapterQuestions}
          onPracticeQuestions={(year) => {
            onStartPractice(chapter, year);
          }}
        />

        {/* KEY FOCUS & EXAM PATTERN */}
        {chapter.trendSummary ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Key Focus Areas</Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightText}>{chapter.trendSummary}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QUIZ CONFIGURATION DIALOG (2 QUESTIONS: COUNT & DURATION + CUSTOM INPUT) */}
      <Modal visible={isQuizConfigOpen} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.configModalOverlay}
        >
          <View style={styles.configDialog}>
            {/* Dialog Header */}
            <View style={styles.configDialogHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.configDialogTitle}>Configure Chapter Quiz</Text>
                <Text style={styles.configDialogSubtitle} numberOfLines={1}>
                  {chapter.title}
                </Text>
              </View>
              <Pressable
                style={styles.configCloseBtn}
                onPress={() => setIsQuizConfigOpen(false)}
              >
                <X size={18} color={theme.colors.textPrimary} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Question 1: Select or Type Number of Questions */}
            <View style={styles.configSection}>
              <View style={styles.configSectionHeaderRow}>
                <Text style={styles.configSectionLabel}>
                  1. Select Number of Questions
                </Text>
                <Text style={styles.configSectionSubLabel}>
                  {quizQuestionCount} Questions
                </Text>
              </View>

              {/* Preset Pills */}
              <View style={styles.pillsRow}>
                {questionCountOptions.map((opt) => {
                  const isSelected =
                    !customQuestionText && quizQuestionCount === opt.count;
                  return (
                    <Pressable
                      key={opt.count}
                      style={[
                        styles.configPill,
                        isSelected && styles.configPillActive,
                      ]}
                      onPress={() => handleSelectQuestionPill(opt.count)}
                    >
                      <Text
                        style={[
                          styles.configPillText,
                          isSelected && styles.configPillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom Typed Question Input */}
              <View style={styles.customInputRow}>
                <Text style={styles.customInputPrefix}>
                  Custom:
                </Text>
                <View
                  style={[
                    styles.customInputBox,
                    Boolean(customQuestionText) && styles.customInputBoxActive,
                  ]}
                >
                  <TextInput
                    style={styles.customInput}
                    keyboardType="number-pad"
                    placeholder={`1 - ${totalQs}`}
                    placeholderTextColor={theme.colors.textMuted}
                    value={customQuestionText}
                    onChangeText={handleCustomQuestionTextChange}
                    maxLength={3}
                  />
                  <Text style={styles.customInputUnit}>Qs</Text>
                </View>
              </View>
            </View>

            {/* Question 2: Select or Type Duration */}
            <View style={styles.configSection}>
              <View style={styles.configSectionHeaderRow}>
                <Text style={styles.configSectionLabel}>2. Select Duration</Text>
                <Text style={styles.configSectionSubLabel}>
                  {quizDurationMinutes} Minutes
                </Text>
              </View>

              {/* Preset Duration Pills */}
              <View style={styles.pillsRow}>
                {durationOptions.map((mins) => {
                  const isSelected =
                    !customDurationText && quizDurationMinutes === mins;
                  return (
                    <Pressable
                      key={mins}
                      style={[
                        styles.configPill,
                        isSelected && styles.configPillActive,
                      ]}
                      onPress={() => handleSelectDurationPill(mins)}
                    >
                      <Text
                        style={[
                          styles.configPillText,
                          isSelected && styles.configPillTextActive,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom Typed Duration Input */}
              <View style={styles.customInputRow}>
                <Text style={styles.customInputPrefix}>
                  Custom:
                </Text>
                <View
                  style={[
                    styles.customInputBox,
                    Boolean(customDurationText) && styles.customInputBoxActive,
                  ]}
                >
                  <TextInput
                    style={styles.customInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 25"
                    placeholderTextColor={theme.colors.textMuted}
                    value={customDurationText}
                    onChangeText={handleCustomDurationTextChange}
                    maxLength={3}
                  />
                  <Text style={styles.customInputUnit}>Mins</Text>
                </View>
              </View>
            </View>

            {/* UPSC Scheme Notice */}
            <View style={styles.configNoticeBox}>
              <Text style={styles.configNoticeText}>
                UPSC Scheme: +2.0 Marks for Correct · -0.66 Penalty for Wrong
              </Text>
            </View>

            {/* Start Quiz Action */}
            <Pressable
              style={({ pressed }) => [
                styles.configStartBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleLaunchQuiz}
            >
              <Timer size={16} color={theme.colors.darkButtonText} strokeWidth={2.2} />
              <Text style={styles.configStartBtnText}>
                Start Quiz ({quizQuestionCount} Qs · {quizDurationMinutes} Mins)
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgCanvas,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    gap: 6,
    ...theme.shadows.card,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  serialBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerBlock: {
    marginBottom: 16,
  },
  chapterTitle: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      default: 'System',
    }),
    fontSize: 23,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 30,
    marginBottom: 4,
  },
  subjectContext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    marginBottom: 14,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: theme.colors.borderSubtle,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  btnPractice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.borderCard,
    gap: 8,
    ...theme.shadows.card,
  },
  btnPracticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.1,
  },
  btnQuiz: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkButton,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.darkButton,
    gap: 8,
    ...theme.shadows.card,
  },
  btnQuizText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
    letterSpacing: -0.1,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      default: 'System',
    }),
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.15,
  },
  sectionSubtitleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  quickRevisionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    ...theme.shadows.card,
  },
  quickRevisionCardActive: {
    borderColor: theme.colors.textPrimary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  quickRevisionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quickRevisionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRevisionTextCol: {
    flex: 1,
  },
  quickRevisionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  quickRevisionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  highYieldTag: {
    backgroundColor: theme.colors.darkButton,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highYieldTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.darkButtonText,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  quickRevisionSubtitle: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  quickRevisionRight: {
    marginLeft: 10,
  },
  quickRevisionExpandedContainer: {
    backgroundColor: theme.colors.bgCanvas,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.colors.borderCard,
    padding: 14,
    gap: 10,
  },
  noteCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  noteHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  notePointsList: {
    gap: 7,
  },
  notePointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: theme.colors.primary,
    marginTop: 6.5,
  },
  notePointText: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    lineHeight: 18.5,
    flex: 1,
    fontWeight: '400',
  },
  insightCard: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
  },
  insightText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  // Quiz Configuration Modal Styles
  configModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  configDialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.borderCard,
    ...theme.shadows.card,
  },
  configDialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  configDialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  configDialogSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  configCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configSection: {
    marginBottom: 16,
  },
  configSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  configSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  configSectionSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  configPill: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.bgSurfaceMuted,
    borderWidth: 1.5,
    borderColor: theme.colors.borderSubtle,
  },
  configPillActive: {
    backgroundColor: theme.colors.darkButton,
    borderColor: theme.colors.darkButton,
  },
  configPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  configPillTextActive: {
    color: theme.colors.darkButtonText,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: theme.colors.bgSurfaceMuted,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  customInputPrefix: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  customInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 32,
    minWidth: 88,
  },
  customInputBoxActive: {
    borderColor: theme.colors.textPrimary,
    backgroundColor: theme.colors.bgSurface,
  },
  customInput: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 42,
    textAlign: 'center',
  },
  customInputUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  configNoticeBox: {
    backgroundColor: theme.colors.bgSurfaceMuted,
    padding: 10,
    borderRadius: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  configNoticeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  configStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkButton,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  configStartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.darkButtonText,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
});
