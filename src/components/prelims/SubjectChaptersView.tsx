import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft } from '@/components/common/LucideIcons';
import { Subject, Chapter } from '@/types/prelims';
import { ChapterItemCard } from './ChapterItemCard';
import { PrelimsTheme } from '@/constants/prelimsTheme';

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
  const formattedSerial = serialNumber ? String(serialNumber).padStart(2, '0') + '. ' : '';

  return (
    <View style={styles.container}>
      {/* Top Back Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={onBack}
        >
          <ArrowLeft size={16} color="#000000" strokeWidth={2.2} />
          <Text style={styles.backText}>All Subjects</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickQuizBtn, pressed && styles.pressed]}
          onPress={() => onGenerateSubjectQuiz(subject)}
        >
          <Text style={styles.quickQuizText}>Subject Quiz</Text>
        </Pressable>
      </View>

      {/* Subject Header */}
      <View style={styles.subjectBanner}>
        <Text style={styles.bannerTitle}>
          {formattedSerial}{subject.title}
        </Text>
        <Text style={styles.bannerSubtitle}>
          {subject.paper === 'GS2' ? 'GS-2 (CSAT)' : 'GS1'} · {subject.chapters.length} Chapters · {subject.totalQuestions10Yrs} Questions (2014–2024)
        </Text>
      </View>

      {/* Section Divider & Title */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>CHAPTERS</Text>
        <Text style={styles.chaptersCountTag}>{subject.chapters.length} Chapters · Tap to View Details</Text>
      </View>

      {/* Chapterwise Vertical List with Serial Numbers & Right Weightage */}
      <View style={styles.chaptersList}>
        {subject.chapters.map((chapter, idx) => (
          <ChapterItemCard
            key={chapter.id}
            chapter={chapter}
            serialNumber={idx + 1}
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    ...PrelimsTheme.shadows.card,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  quickQuizBtn: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  quickQuizText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subjectBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    ...PrelimsTheme.shadows.card,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#52525B',
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
    color: '#71717A',
    letterSpacing: 0.8,
  },
  chaptersCountTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  chaptersList: {
    gap: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
