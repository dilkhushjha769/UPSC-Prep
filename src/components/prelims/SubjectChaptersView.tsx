import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  BookOpen,
  ChartNoAxesCombined,
  CircleCheck,
  FlaskConical,
  Globe,
  Landmark,
  Layers,
  Leaf,
  Moon,
  Newspaper,
  Play,
  Scale,
  Sun,
} from 'lucide-react-native';
import { Chapter, Subject } from '@/types/prelims';
import { PALETTE } from '@/constants/colors';
import { ChapterItemCard } from './ChapterItemCard';

interface SubjectChaptersViewProps {
  subject: Subject;
  serialNumber?: number;
  isDark?: boolean;
  onToggleTheme?: () => void;
  solvedCount?: number;
  solvedStatsByChapterId?: Record<string, number>;
  onBack: () => void;
  onSelectChapter: (chapter: Chapter, serialNumber: number) => void;
  onGenerateSubjectQuiz: (subject: Subject) => void;
}

export function SubjectChaptersView({
  subject,
  serialNumber,
  isDark = true,
  onToggleTheme,
  solvedCount = 0,
  solvedStatsByChapterId = {},
  onBack,
  onSelectChapter,
  onGenerateSubjectQuiz,
}: SubjectChaptersViewProps) {
  const formattedSerial = serialNumber ? String(serialNumber).padStart(2, '0') + '. ' : '';

  const totalSubjectQuestions = useMemo(() => {
    return subject.totalQuestions10Yrs > 0
      ? subject.totalQuestions10Yrs
      : subject.chapters.reduce((sum, ch) => sum + (ch.totalQuestions10Yrs || 0), 0);
  }, [subject]);

  const subjectPercentage = totalSubjectQuestions > 0
    ? Math.min(100, Math.round((solvedCount / totalSubjectQuestions) * 100))
    : 0;

  // Resolve Subject-Specific Icon and Accent Color
  const { icon: SubjectIconComponent, color: subjectAccentColor } = useMemo(() => {
    switch (subject.id) {
      case 'history_culture':
        return { icon: Landmark, color: '#E06A62' };
      case 'geography':
        return { icon: Globe, color: '#2F80ED' };
      case 'polity_governance':
        return { icon: Scale, color: '#9B51E0' };
      case 'economy':
        return { icon: ChartNoAxesCombined, color: '#F2994A' };
      case 'environment_ecology':
        return { icon: Leaf, color: '#35C98A' };
      case 'science_tech':
      case 'science_technology':
        return { icon: FlaskConical, color: '#2D9CDB' };
      case 'current_affairs_misc':
        return { icon: Newspaper, color: '#8257E6' };
      case 'csat_reading_comprehension':
      case 'csat_reading_comp':
        return { icon: BookOpen, color: '#2F80ED' };
      case 'csat_reasoning':
      case 'csat_logical_reasoning':
        return { icon: Scale, color: '#9B51E0' };
      case 'csat_quant_numeracy':
      case 'csat_quantitative_aptitude':
        return { icon: ChartNoAxesCombined, color: '#F2994A' };
      case 'csat_data_interpretation':
        return { icon: Layers, color: '#35C98A' };
      default:
        return { icon: BookOpen, color: '#2F80ED' };
    }
  }, [subject.id]);

  const colors = {
    controlBg: isDark ? '#26282E' : '#FFFFFF',
    controlBorder: isDark ? '#35373F' : '#E8E9F1',
    cardBg: isDark ? '#25272D' : '#FFFFFF',
    cardBorder: isDark ? '#35373F' : '#E8E9F1',
    textPrimary: isDark ? '#F5F5F7' : '#1F2024',
    textSecondary: isDark ? '#A7ABB5' : '#71727A',
    progressTrack: isDark ? '#343740' : '#E8E9F1',
    divider: isDark ? '#30323A' : '#E8E9F1',
    paperBadgeBg: isDark ? '#162338' : '#EAF2FF',
    paperBadgeText: isDark ? '#6FBAFF' : '#0D6EFD',
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Controls Navigation Bar */}
      <View style={styles.topControlRow}>
        {/* Back Button to All Subjects */}
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.controlBg, borderColor: colors.controlBorder },
            pressed && styles.pressed,
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to All Subjects"
        >
          <ArrowLeft size={16} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>All Subjects</Text>
        </Pressable>

        {/* Right side controls: Subject Quiz button + Circular Theme Toggle */}
        <View style={styles.topRightControls}>
          {/* Quick Subject Quiz Action */}
          <Pressable
            style={({ pressed }) => [
              styles.subjectQuizBtn,
              pressed && styles.pressed,
              Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
            ]}
            onPress={() => onGenerateSubjectQuiz(subject)}
            accessibilityRole="button"
            accessibilityLabel={`Start subject quiz for ${subject.title}`}
          >
            <Play size={13} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
            <Text style={styles.subjectQuizBtnText}>Subject Quiz</Text>
          </Pressable>

          {/* Theme Toggle Button (Exact To-Do List design) */}
          {Boolean(onToggleTheme) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onToggleTheme}
              accessibilityLabel="Toggle Theme"
              style={[
                styles.themeToggleBtn,
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
                {
                  backgroundColor: isDark ? PALETTE.neutral.dark.surface : '#FFFFFF',
                  borderColor: isDark ? '#383A42' : '#F0F1F5',
                },
              ]}
            >
              {isDark ? (
                <Sun size={17} color="#FBBF24" strokeWidth={2.2} />
              ) : (
                <Moon size={17} color={PALETTE.highlight.primary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Premium Subject Hero Overview Card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.heroTopRow}>
          {/* Colored Subject Icon Tile */}
          <View style={[styles.heroIconTile, { backgroundColor: subjectAccentColor }]}>
            <SubjectIconComponent size={24} color="#FFFFFF" strokeWidth={2.2} />
          </View>

          {/* Subject Hierarchy Title & Metadata */}
          <View style={styles.heroTitleBlock}>
            <View style={styles.paperBadgeRow}>
              <View
                style={[
                  styles.paperBadge,
                  { backgroundColor: colors.paperBadgeBg },
                ]}
              >
                <Text style={[styles.paperBadgeText, { color: colors.paperBadgeText }]}>
                  {subject.paper === 'GS2' ? 'GS PAPER 2 (CSAT)' : 'GS PAPER 1'}
                </Text>
              </View>
              <Text style={[styles.breadcrumbDot, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.breadcrumbText, { color: colors.textSecondary }]}>
                {subject.shortTitle}
              </Text>
            </View>

            <Text style={[styles.heroSubjectTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {formattedSerial}{subject.title}
            </Text>

            <Text style={[styles.heroMetaText, { color: colors.textSecondary }]}>
              {subject.chapters.length} Syllabus Topics · {totalSubjectQuestions.toLocaleString()} Verified Questions (2016–2026)
            </Text>
          </View>
        </View>

        {/* Hero Bottom Row: Solved Metrics & Progress Bar */}
        <View style={[styles.heroProgressRow, { borderTopColor: colors.divider }]}>
          <View style={styles.heroProgressLeft}>
            <CircleCheck size={16} color={subjectAccentColor} strokeWidth={2.4} />
            <Text style={[styles.heroProgressLabel, { color: colors.textSecondary }]}>
              Subject Solved:
            </Text>
            <Text style={[styles.heroProgressCount, { color: colors.textPrimary }]}>
              {solvedCount} / {totalSubjectQuestions}
            </Text>
          </View>

          <View style={styles.heroProgressRight}>
            <View style={[styles.heroProgressTrack, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.heroProgressFill,
                  { width: `${subjectPercentage}%`, backgroundColor: subjectAccentColor },
                ]}
              />
            </View>
            <Text style={[styles.heroProgressPercent, { color: colors.textPrimary }]}>
              {subjectPercentage}%
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Section Header: Syllabus Topics */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          SYLLABUS TOPICS
        </Text>
        <Text style={[styles.chaptersCountTag, { color: colors.textSecondary }]}>
          {subject.chapters.length} Topics · {totalSubjectQuestions.toLocaleString()} Qs
        </Text>
      </View>

      {/* 4. Syllabus Topics Cards List */}
      <View style={styles.chaptersList}>
        {subject.chapters.map((chapter, idx) => (
          <ChapterItemCard
            key={chapter.id}
            chapter={chapter}
            serialNumber={idx + 1}
            isDark={isDark}
            solvedCount={solvedStatsByChapterId[chapter.id] || 0}
            subjectColor={subjectAccentColor}
            isLast={idx === subject.chapters.length - 1}
            onPress={(chap) => onSelectChapter(chap, idx + 1)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#0D6EFD',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  subjectQuizBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  themeToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconTile: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleBlock: {
    flex: 1,
  },
  paperBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  paperBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  paperBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  breadcrumbDot: {
    fontSize: 11,
  },
  breadcrumbText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroSubjectTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  heroMetaText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 14,
    borderTopWidth: 1,
    gap: 16,
    flexWrap: 'wrap',
  },
  heroProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroProgressLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  heroProgressCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroProgressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 160,
    justifyContent: 'flex-end',
  },
  heroProgressTrack: {
    flex: 1,
    maxWidth: 200,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroProgressPercent: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 38,
    textAlign: 'right',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  chaptersCountTag: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  chaptersList: {
    gap: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});
