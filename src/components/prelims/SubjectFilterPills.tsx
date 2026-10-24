import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { Subject } from '@/types/prelims';
import { PrelimsTheme } from '@/constants/prelimsTheme';

interface SubjectFilterPillsProps {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
}

export function SubjectFilterPills({
  subjects,
  selectedSubjectId,
  onSelectSubject,
}: SubjectFilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "All Subjects" pill */}
      <Pressable
        style={({ pressed }) => [
          styles.pill,
          selectedSubjectId === null && styles.pillActive,
          pressed && styles.pressed,
        ]}
        onPress={() => onSelectSubject(null)}
      >
        <Text
          style={[
            styles.pillText,
            selectedSubjectId === null && styles.pillTextActive,
          ]}
        >
          All Subjects ({subjects.length})
        </Text>
      </Pressable>

      {/* Individual subject pills */}
      {subjects.map((sub) => {
        const isSelected = selectedSubjectId === sub.id;
        return (
          <Pressable
            key={sub.id}
            style={({ pressed }) => [
              styles.pill,
              isSelected && styles.pillActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelectSubject(sub.id)}
          >
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextActive,
              ]}
            >
              {sub.shortTitle}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  pill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: PrelimsTheme.radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7FB',
    ...PrelimsTheme.shadows.card,
  },
  pillActive: {
    backgroundColor: PrelimsTheme.colors.darkButton,
    borderColor: PrelimsTheme.colors.darkButton,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrelimsTheme.colors.textPrimary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
