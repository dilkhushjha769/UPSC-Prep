import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { PrelimsTheme } from '@/constants/prelimsTheme';

export function PrelimsHeader({ onBack }: { onBack?: () => void } = {}) {
  return (
    <View style={styles.container}>
      {Boolean(onBack) && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}>
          <ArrowLeft size={15} color={PrelimsTheme.colors.textSecondary} />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      )}
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#F4F4F5',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrelimsTheme.colors.textSecondary,
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
