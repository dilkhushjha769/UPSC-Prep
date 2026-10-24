import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrelimsTheme } from '@/constants/prelimsTheme';

export function PrelimsHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Prelims Preparation</Text>
      <Text style={styles.subtitle}>
        GS-1 & GS-2 (CSAT) · Previous Years Questions (2014–2024)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: PrelimsTheme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: PrelimsTheme.colors.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
  },
});
