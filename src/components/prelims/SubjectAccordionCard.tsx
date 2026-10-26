import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronDown, ChevronUp } from '@/components/common/LucideIcons';
import { Subject, Chapter } from '@/types/prelims';
import { ChapterItemCard } from './ChapterItemCard';
import { PrelimsTheme } from '@/constants/prelimsTheme';

interface SubjectAccordionCardProps {
  subject: Subject;
  initialExpanded?: boolean;
  onPracticeChapter: (chapter: Chapter) => void;
  onQuizChapter: (chapter: Chapter) => void;
}

export function SubjectAccordionCard({
  subject,
  initialExpanded = false,
  onPracticeChapter,
  onQuizChapter,
}: SubjectAccordionCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <View style={styles.card}>
      {/* Subject Header Row (Click to toggle chapters) */}
      <Pressable
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleInfo}>
            <Text style={styles.subjectTitle}>{subject.title}</Text>
            <Text style={styles.subjectSubtitle}>
              {subject.chapters.length} Chapters • {subject.totalQuestions10Yrs} Questions
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.weightageBadge}>
            <Text style={styles.weightageNumber}>{subject.weightageInGS1}%</Text>
            <Text style={styles.weightageSub}>{subject.paper === 'GS2' ? 'CSAT' : 'GS-1'}</Text>
          </View>
          {expanded ? (
            <ChevronUp size={18} color={PrelimsTheme.colors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={PrelimsTheme.colors.textSecondary} />
          )}
        </View>
      </Pressable>

      {/* Expanded Chapters List */}
      {expanded && (
        <View style={styles.chaptersContainer}>
          <View style={styles.divider} />
          {subject.chapters.map((chapter) => (
            <ChapterItemCard
              key={chapter.id}
              chapter={chapter}
              onPress={onPracticeChapter}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE7FB',
    ...PrelimsTheme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PrelimsTheme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  subjectSubtitle: {
    fontSize: 12,
    color: PrelimsTheme.colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightageBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
  },
  weightageNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5500',
  },
  weightageSub: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FF5500',
  },
  chaptersContainer: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EDFA',
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
