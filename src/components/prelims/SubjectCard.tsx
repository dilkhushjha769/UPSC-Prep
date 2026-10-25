import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from '@/components/common/LucideIcons';
import { Subject } from '@/types/prelims';
import { usePrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';

interface SubjectCardProps {
  subject: Subject;
  serialNumber: number;
  onPress: (subject: Subject) => void;
}

export function SubjectCard({ subject, serialNumber, onPress }: SubjectCardProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const formattedSerial = String(serialNumber).padStart(2, '0');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
    card: {
      backgroundColor: theme.colors.bgSurface,
      borderRadius: 14,
      marginHorizontal: 20,
      marginBottom: 10,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderCard,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...theme.shadows.card,
    },
    cardPressed: {
      backgroundColor: theme.colors.bgSurfaceMuted,
      borderColor: theme.colors.textPrimary,
      transform: [{ scale: 0.995 }],
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
