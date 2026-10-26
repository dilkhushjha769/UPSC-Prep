import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft } from '@/components/common/LucideIcons';
import { Subject, Chapter } from '@/types/prelims';
import { ChapterItemCard } from './ChapterItemCard';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';

interface SubjectChaptersViewProps {
  subject: Subject;
  serialNumber?: number;
  onBack: () => void;
  onSelectChapter: (chapter: Chapter, serialNumber: number) => void;
  onGenerateSubjectQuiz: (subject: Subject) => void;
}

export function SubjectChaptersView({
  subject,
  serialNumber,
  onBack,
  onSelectChapter,
  onGenerateSubjectQuiz,
}: SubjectChaptersViewProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const formattedSerial = serialNumber ? String(serialNumber).padStart(2, '0') + '. ' : '';

  return (
    <View style={styles.container}>
      {/* Top Back Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onBack}
        >
          <ArrowLeft size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.backText}>All Subjects</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickQuizBtn, pressed && styles.pressed]}
          onPress={() => onGenerateSubjectQuiz(subject)}
        >
          <Text style={styles.quickQuizText}>Subject Quiz</Text>
        </Pressable>
      </View>

      {/* Subject Header (Open typography, no container box) */}
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectTitle}>
          {formattedSerial}{subject.title}
        </Text>
        <Text style={styles.subjectSubtitle}>
          {subject.paper === 'GS2' ? 'GS-2 (CSAT)' : 'GS1'} · {subject.chapters.length} Chapters · {subject.totalQuestions10Yrs} Questions (2014–2024)
        </Text>
      </View>

      {/* Section Divider & Title */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>CHAPTERS</Text>
        <Text style={styles.chaptersCountTag}>{subject.chapters.length} Chapters</Text>
      </View>

      {/* Chapterwise Vertical List with Serial Numbers & Right Weightage */}
      <View style={styles.chaptersList}>
        {subject.chapters.map((chapter, idx) => (
          <ChapterItemCard
            key={chapter.id}
            chapter={chapter}
            serialNumber={idx + 1}
            isLast={idx === subject.chapters.length - 1}
            onPress={(chap) => onSelectChapter(chap, idx + 1)}
          />
        ))}
      </View>
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgSurface,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      ...theme.shadows.card,
    },
    backText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    quickQuizBtn: {
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    quickQuizText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
    },
    subjectHeader: {
      marginBottom: 18,
      paddingHorizontal: 2,
    },
    subjectTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 5,
    },
    subjectSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    chaptersCountTag: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    chaptersList: {
      gap: 2,
    },
    pressed: {
      opacity: 0.75,
    },
  });
