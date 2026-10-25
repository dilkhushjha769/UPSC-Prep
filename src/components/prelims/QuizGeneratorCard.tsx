import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface QuizGeneratorCardProps {
  selectedPaperTab: 'gs1' | 'gs2' | 'all';
  onSelectPaperTab: (tab: 'gs1' | 'gs2') => void;
  onOpenGenerator: () => void;
}

export function QuizGeneratorCard({
  selectedPaperTab,
  onSelectPaperTab,
  onOpenGenerator,
}: QuizGeneratorCardProps) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const isGS1 = selectedPaperTab === 'gs1';
  const isGS2 = selectedPaperTab === 'gs2';

  return (
    <View style={styles.toolbarContainer}>
      {/* Left side: Open buttons for Paper 1 and Paper 2 */}
      <View style={styles.tabsScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {/* Paper 1 - GS-1 */}
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              isGS1 && styles.tabBtnActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelectPaperTab('gs1')}
            accessibilityRole="tab"
            accessibilityState={{ selected: isGS1 }}
          >
            <Text
              style={[
                styles.tabBtnText,
                isGS1 && styles.tabBtnTextActive,
              ]}
            >
              Paper 1 - GS-1
            </Text>
          </Pressable>

          {/* Paper 2 - GS-2 */}
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              isGS2 && styles.tabBtnActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelectPaperTab('gs2')}
            accessibilityRole="tab"
            accessibilityState={{ selected: isGS2 }}
          >
            <Text
              style={[
                styles.tabBtnText,
                isGS2 && styles.tabBtnTextActive,
              ]}
            >
              Paper 2 - GS-2
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Right side: Fixed "Generate Quiz" button in the same line */}
      <Pressable
        style={({ pressed }) => [styles.generateButton, pressed && styles.pressed]}
        onPress={onOpenGenerator}
      >
        <Text style={styles.generateButtonText}>Quiz</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
    toolbarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 16,
      width: '100%',
    },
    tabsScrollWrapper: {
      flex: 1,
      marginRight: 10,
    },
    tabsScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tabBtn: {
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBtnActive: {
      backgroundColor: theme.colors.darkButton,
      borderColor: theme.colors.darkButton,
    },
    tabBtnText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      letterSpacing: -0.2,
    },
    tabBtnTextActive: {
      color: theme.colors.darkButtonText,
      fontWeight: '700',
    },
    generateButton: {
      flexShrink: 0,
      backgroundColor: theme.colors.darkButton,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.darkButton,
    },
    generateButtonText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.darkButtonText,
      letterSpacing: -0.2,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
  });
