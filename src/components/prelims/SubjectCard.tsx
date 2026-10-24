import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from '@/components/common/LucideIcons';
import { Subject } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';

interface SubjectCardProps {
  subject: Subject;
  serialNumber: number;
  onPress: (subject: Subject) => void;
}

export function SubjectCard({ subject, serialNumber, onPress }: SubjectCardProps) {
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
        <ChevronRight size={16} color="#71717A" strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    color: '#52525B',
    fontWeight: '500',
  },
  chevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
