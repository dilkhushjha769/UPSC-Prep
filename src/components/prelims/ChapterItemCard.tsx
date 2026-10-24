import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from '@/components/common/LucideIcons';
import { Chapter } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';

interface ChapterItemCardProps {
  chapter: Chapter;
  serialNumber?: number;
  onPress: (chapter: Chapter) => void;
}

export function ChapterItemCard({
  chapter,
  serialNumber,
  onPress,
}: ChapterItemCardProps) {
  const serialLabel = serialNumber
    ? String(serialNumber).padStart(2, '0')
    : chapter.code;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(chapter)}
    >
      <View style={styles.leftRow}>
        {/* Serial Number Box */}
        <View style={styles.serialBox}>
          <Text style={styles.serialText}>{serialLabel}</Text>
        </View>

        {/* Chapter Title & Question Count */}
        <View style={styles.titleCol}>
          <Text style={styles.titleText}>{chapter.title}</Text>
          <Text style={styles.questionCountText}>
            {chapter.totalQuestions10Yrs} Questions · 10-Yr PYQs
          </Text>
        </View>
      </View>

      {/* Right Side: Overall Weightage & Tap Chevron */}
      <View style={styles.rightRow}>
        <View style={styles.weightageCol}>
          <View style={styles.weightagePill}>
            <Text style={styles.weightageNumber}>{chapter.weightagePercent}%</Text>
          </View>
          <Text style={styles.weightageLabel}>Weightage</Text>
        </View>

        <View style={styles.chevronBox}>
          <ChevronRight size={16} color="#71717A" strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...PrelimsTheme.shadows.card,
  },
  cardPressed: {
    backgroundColor: '#F4F4F5',
    borderColor: '#000000',
    transform: [{ scale: 0.995 }],
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  serialBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
  titleCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 19,
    marginBottom: 2,
  },
  questionCountText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '500',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightageCol: {
    alignItems: 'flex-end',
    minWidth: 54,
  },
  weightagePill: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 2,
  },
  weightageNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  weightageLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevronBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
