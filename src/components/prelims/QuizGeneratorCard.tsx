import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { PrelimsTheme } from '@/constants/prelimsTheme';

interface QuizGeneratorCardProps {
  onOpenGenerator: () => void;
}

export function QuizGeneratorCard({ onOpenGenerator }: QuizGeneratorCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.textCol}>
        <Text style={styles.title}>Generate Quiz</Text>
        <Text style={styles.description}>
          Create a customized mock test with 10-year PYQs and UPSC negative marking.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.generateButton, pressed && styles.pressed]}
        onPress={onOpenGenerator}
      >
        <Text style={styles.buttonText}>Generate Quiz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    ...PrelimsTheme.shadows.card,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12,
    color: PrelimsTheme.colors.textSecondary,
    lineHeight: 17,
  },
  generateButton: {
    backgroundColor: PrelimsTheme.colors.darkButton,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
