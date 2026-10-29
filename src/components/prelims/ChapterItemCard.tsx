import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ChevronRight, CircleCheck } from 'lucide-react-native';
import { Chapter } from '@/types/prelims';

interface ChapterItemCardProps {
  chapter: Chapter;
  serialNumber?: number;
  isDark?: boolean;
  solvedCount?: number;
  subjectColor?: string;
  onPress: (chapter: Chapter) => void;
  isLast?: boolean;
}

export function ChapterItemCard({
  chapter,
  serialNumber,
  isDark = true,
  solvedCount = 0,
  subjectColor = '#2F80ED',
  onPress,
}: ChapterItemCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 5) {
      setContainerWidth(w);
    }
  };

  const isMobile = containerWidth > 0 ? containerWidth < 680 : windowWidth < 768;

  const serialLabel = serialNumber ? String(serialNumber).padStart(2, '0') : chapter.code;
  const totalQs = chapter.totalQuestions10Yrs > 0 ? chapter.totalQuestions10Yrs : (chapter.pyqs?.length || 0);
  const percentage = totalQs > 0 ? Math.min(100, Math.round((solvedCount / totalQs) * 100)) : 0;

  const colors = {
    cardBg: isDark ? '#25272D' : '#FFFFFF',
    cardBorder: isDark ? '#35373F' : '#E8E9F1',
    serialBg: isDark ? '#2A2C33' : '#F8F9FE',
    serialBorder: isDark ? '#35373F' : '#E8E9F1',
    serialText: isDark ? '#A7ABB5' : '#71727A',
    textPrimary: isDark ? '#F5F5F7' : '#1F2024',
    textSecondary: isDark ? '#A7ABB5' : '#71727A',
    progressTrack: isDark ? '#343740' : '#E8E9F1',
    divider: isDark ? '#30323A' : '#E8E9F1',
    weightageBg: isDark ? '#2A2C33' : '#F8F9FE',
    weightageBorder: isDark ? '#35373F' : '#E8E9F1',
    chevron: isDark ? '#71727A' : '#9CA3AF',
    pressedBg: isDark ? '#2B2D35' : '#F1F3F9',
  };

  if (isMobile) {
    return (
      <Pressable
        onLayout={handleLayout}
        style={({ pressed }) => [
          styles.cardRowMobile,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          pressed && { backgroundColor: colors.pressedBg, opacity: 0.9 },
          Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
        ]}
        onPress={() => onPress(chapter)}
        accessibilityRole="button"
        accessibilityLabel={`${chapter.title}, ${totalQs} questions, ${chapter.weightagePercent}% weightage`}
      >
        {/* Top Row: Serial + Title Block + Chevron */}
        <View style={styles.mobileTopRow}>
          <View style={[styles.serialBox, { backgroundColor: colors.serialBg, borderColor: colors.serialBorder }]}>
            <Text style={[styles.serialText, { color: colors.serialText }]}>{serialLabel}</Text>
          </View>

          <View style={styles.mobileTitleBlock}>
            <Text style={[styles.chapterTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {chapter.title}
            </Text>
            <Text style={[styles.chapterSubtitle, { color: colors.textSecondary }]}>
              {totalQs} Questions · 10-Yr PYQs
            </Text>
          </View>

          <View style={styles.chevronBox}>
            <ChevronRight size={17} color={colors.chevron} strokeWidth={2} />
          </View>
        </View>

        {/* Bottom Row: Solved Progress & Weightage Pill */}
        <View style={[styles.mobileBottomRow, { borderTopColor: colors.divider }]}>
          <View style={styles.mobileProgressGroup}>
            <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentage}%`, backgroundColor: subjectColor },
                ]}
              />
            </View>
            <Text style={[styles.percentText, { color: colors.textPrimary }]}>{percentage}%</Text>
            <Text style={[styles.solvedTextMini, { color: colors.textSecondary }]}>
              ({solvedCount}/{totalQs})
            </Text>
          </View>

          <View style={[styles.weightageBadge, { backgroundColor: colors.weightageBg, borderColor: colors.weightageBorder }]}>
            <Text style={[styles.weightageNumber, { color: colors.textPrimary }]}>
              {chapter.weightagePercent}%
            </Text>
            <Text style={[styles.weightageLabel, { color: colors.textSecondary }]}>
              WEIGHT
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Desktop / Tablet Row Layout
  return (
    <Pressable
      onLayout={handleLayout}
      style={({ pressed }) => [
        styles.cardRow,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        pressed && { backgroundColor: colors.pressedBg, opacity: 0.9 },
        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
      ]}
      onPress={() => onPress(chapter)}
      accessibilityRole="button"
      accessibilityLabel={`${chapter.title}, ${totalQs} questions, ${chapter.weightagePercent}% weightage`}
    >
      {/* 1. Monochromatic Serial Number Box */}
      <View style={[styles.serialBox, { backgroundColor: colors.serialBg, borderColor: colors.serialBorder }]}>
        <Text style={[styles.serialText, { color: colors.serialText }]}>{serialLabel}</Text>
      </View>

      {/* 2. Chapter Title & Questions Count */}
      <View style={styles.titleCol}>
        <Text style={[styles.chapterTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {chapter.title}
        </Text>
        <Text style={[styles.chapterSubtitle, { color: colors.textSecondary }]}>
          {totalQs} Questions · 10-Yr PYQs
        </Text>
      </View>

      {/* 3. Progress Bar & Solved Metric */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: subjectColor },
            ]}
          />
        </View>
        <Text style={[styles.percentText, { color: colors.textPrimary }]}>{percentage}%</Text>
      </View>

      {/* 4. Solved Count Badge */}
      <View style={styles.solvedBadge}>
        <CircleCheck size={16} color={subjectColor} strokeWidth={2.4} />
        <View style={styles.solvedTextStack}>
          <Text style={[styles.solvedRatio, { color: colors.textPrimary }]}>
            {solvedCount} / {totalQs}
          </Text>
          <Text style={[styles.solvedLabel, { color: colors.textSecondary }]}>Solved</Text>
        </View>
      </View>

      {/* 5. Weightage Pill */}
      <View style={[styles.weightageBadge, { backgroundColor: colors.weightageBg, borderColor: colors.weightageBorder }]}>
        <Text style={[styles.weightageNumber, { color: colors.textPrimary }]}>
          {chapter.weightagePercent}%
        </Text>
        <Text style={[styles.weightageLabel, { color: colors.textSecondary }]}>
          WEIGHTAGE
        </Text>
      </View>

      {/* 6. Navigation Chevron */}
      <View style={styles.chevronBox}>
        <ChevronRight size={17} color={colors.chevron} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 16,
  },
  cardRowMobile: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
    gap: 12,
  },
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileTitleBlock: {
    flex: 1,
  },
  mobileBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 12,
  },
  mobileProgressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serialBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleCol: {
    flex: 2,
    minWidth: 180,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  chapterSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1.2,
    minWidth: 130,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 12.5,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  solvedTextMini: {
    fontSize: 11,
    fontWeight: '500',
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
  },
  solvedTextStack: {},
  solvedRatio: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  solvedLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  weightageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  weightageNumber: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 14,
  },
  weightageLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  chevronBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
