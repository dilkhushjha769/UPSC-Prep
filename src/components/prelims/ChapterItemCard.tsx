import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { ChevronRight } from '@/components/common/LucideIcons';
import { Chapter } from '@/types/prelims';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';

interface ChapterItemCardProps {
  chapter: Chapter;
  serialNumber?: number;
  onPress: (chapter: Chapter) => void;
  isLast?: boolean;
}

export function ChapterItemCard({
  chapter,
  serialNumber,
  onPress,
  isLast,
}: ChapterItemCardProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const serialLabel = serialNumber
    ? String(serialNumber).padStart(2, '0')
    : chapter.code;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && styles.rowPressed,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
      ]}
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
          <ChevronRight size={16} color={theme.colors.textMuted} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
    row: {
      backgroundColor: 'transparent',
      paddingVertical: 13,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 8,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.borderSubtle,
    },
    rowPressed: {
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.035)',
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
      backgroundColor: theme.colors.bgSurfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serialText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    titleCol: {
      flex: 1,
    },
    titleText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      lineHeight: 19,
      marginBottom: 2,
    },
    questionCountText: {
      fontSize: 11,
      color: theme.colors.textMuted,
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
      backgroundColor: theme.colors.bgSurfaceMuted,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      marginBottom: 2,
    },
    weightageNumber: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    weightageLabel: {
      fontSize: 8,
      fontWeight: '700',
      color: theme.colors.textMuted,
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

