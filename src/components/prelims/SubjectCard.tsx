import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { ChevronRight } from '@/components/common/LucideIcons';
import { Subject } from '@/types/prelims';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';

interface SubjectCardProps {
  subject: Subject;
  serialNumber: number;
  onPress: (subject: Subject) => void;
  isLast?: boolean;
}

export function SubjectCard({ subject, serialNumber, onPress, isLast }: SubjectCardProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const formattedSerial = String(serialNumber).padStart(2, '0');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && styles.rowPressed,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
      ]}
      onPress={() => onPress(subject)}
    >
      <View style={styles.leftContent}>
        {/* Monochromatic Serial Number */}
        <View style={styles.serialBox}>
          <Text style={styles.serialText}>{formattedSerial}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{subject.title}</Text>
          <Text style={styles.subtitle}>
            {subject.chapters.length} Chapters · {subject.totalQuestions10Yrs} Questions
          </Text>
        </View>
      </View>

      <View style={styles.chevronBox}>
        <ChevronRight size={16} color={theme.colors.textMuted} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
    row: {
      backgroundColor: 'transparent',
      marginHorizontal: 20,
      paddingVertical: 14,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 10,
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
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      paddingRight: 8,
    },
    serialBox: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: theme.colors.bgSurfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serialText: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    chevronBox: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

