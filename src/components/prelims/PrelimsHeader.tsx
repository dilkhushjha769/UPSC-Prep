import { ArrowLeft } from '@/components/common/LucideIcons';
import { PrelimsThemeType, usePrelimsTheme } from '@/constants/prelimsTheme';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PrelimsHeader({ onBack }: { onBack?: () => void } = {}) {
  const theme = usePrelimsTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {Boolean(onBack) && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}
          accessibilityLabel="Back to Dashboard"
        >
          <ArrowLeft size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
      <Text style={styles.mainTitle}>Prelims Preparation</Text>
      <Text style={styles.subtitle}>
        Previous Years Questions (2014–2024)
      </Text>
    </View>
  );
}

const getStyles = (theme: PrelimsThemeType) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    backButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 8,
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.bgSurfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
      marginBottom: 12,
    },
    mainTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      lineHeight: 20,
    },
  });
