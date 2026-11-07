import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

interface SavedItem {
  id: string;
  title: string;
  data?: any;
}

interface EditorialSidebarWidgetsProps {
  readCount: number;
  totalCount: number;
  savedItems: SavedItem[];
  onStartQuiz: () => void;
  onSelectSavedItem: (item: SavedItem) => void;
  isDark?: boolean;
}

export function EditorialSidebarWidgets({
  readCount,
  totalCount,
  savedItems,
  onStartQuiz,
  onSelectSavedItem,
  isDark: propIsDark,
}: EditorialSidebarWidgetsProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  // Ensure progress is bounded between 0 and 1
  const progressRatio = totalCount > 0 ? Math.min(1, Math.max(0, readCount / totalCount)) : 0;
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <View style={styles.container}>
      {/* ======================================================== */}
      {/* 1. Today's Progress Widget                               */}
      {/* ======================================================== */}
      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.widgetTitle, isDark && styles.widgetTitleDark]}>
          Today&apos;s progress
        </Text>

        <View style={[styles.progressTrack, isDark && styles.progressTrackDark]}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={[styles.progressSubtext, isDark && styles.progressSubtextDark]}>
          {`${readCount} of ${totalCount} articles read`}
        </Text>
      </View>

      {/* ======================================================== */}
      {/* 2. Daily Quiz Widget (Dark Navy Card)                    */}
      {/* ======================================================== */}
      <View style={[styles.quizCard, isDark && styles.quizCardDark]}>
        <Text style={styles.quizTitle}>Daily quiz</Text>
        <Text style={styles.quizSubtitle}>
          Test today&apos;s topics with 5 quick questions.
        </Text>

        <Pressable
          style={({ pressed }: any) => [
            styles.quizBtn,
            isDark && styles.quizBtnDark,
            pressed && styles.quizBtnPressed,
          ]}
          onPress={onStartQuiz}
          accessibilityRole="button"
          accessibilityLabel="Start Daily Quiz"
        >
          <Text style={styles.quizBtnText}>Start quiz</Text>
        </Pressable>
      </View>

      {/* ======================================================== */}
      {/* 3. Saved for Revision Widget                             */}
      {/* ======================================================== */}
      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.widgetTitle, isDark && styles.widgetTitleDark]}>
          Saved for revision
        </Text>

        {savedItems.length === 0 ? (
          <Text style={[styles.emptySavedText, isDark && styles.emptySavedTextDark]}>
            Bookmark articles using the save icon to review them quickly here.
          </Text>
        ) : (
          <View style={styles.savedList}>
            {savedItems.slice(0, 6).map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }: any) => [
                  styles.savedItemRow,
                  index > 0 && styles.savedItemDivider,
                  pressed && styles.savedItemPressed,
                ]}
                onPress={() => onSelectSavedItem(item)}
                accessibilityRole="button"
                accessibilityLabel={`Open saved note: ${item.title}`}
              >
                <Text
                  style={[styles.savedItemText, isDark && styles.savedItemTextDark]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  cardDark: {
    backgroundColor: '#141C28',
    borderColor: '#253244',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C2433',
    marginBottom: 14,
  },
  widgetTitleDark: {
    color: '#F0F4F8',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F0EDE6',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressTrackDark: {
    backgroundColor: '#1B2534',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 999,
  },
  progressSubtext: {
    fontSize: 13,
    color: '#5F6B80',
    fontWeight: '500',
  },
  progressSubtextDark: {
    color: '#9DA8B9',
  },
  quizCard: {
    backgroundColor: '#1C2433',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1C2433',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(28, 36, 51, 0.08)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  quizCardDark: {
    backgroundColor: '#182438',
    borderColor: '#243247',
  },
  quizTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  quizSubtitle: {
    fontSize: 13.5,
    color: '#9DA8B9',
    lineHeight: 19,
    marginBottom: 16,
  },
  quizBtnDark: {
    backgroundColor: '#F4F6FB',
  },
  quizBtn: {
    backgroundColor: '#FFFFFF',
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  quizBtnText: {
    color: '#1C2433',
    fontSize: 14,
    fontWeight: '600',
  },
  savedList: {
    marginTop: 2,
  },
  savedItemRow: {
    paddingVertical: 11,
  },
  savedItemDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F0EDE6',
  },
  savedItemPressed: {
    opacity: 0.7,
  },
  savedItemText: {
    fontSize: 14,
    color: '#1C2433',
    lineHeight: 20,
    fontWeight: '500',
  },
  savedItemTextDark: {
    color: '#F0F4F8',
  },
  emptySavedText: {
    fontSize: 13,
    color: '#8892A6',
    lineHeight: 19,
  },
  emptySavedTextDark: {
    color: '#6E7A8E',
  },
});
