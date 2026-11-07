import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MockTestDashboard } from '@/components/mockTest/MockTestDashboard';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { BW_THEME } from '@/constants/bwTheme';
import { useAppTheme } from '@/context/ThemeContext';

export default function MockTestIndexScreen() {
  const { isDark, toggleTheme } = useAppTheme();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  const handleStartTest = (testId: string) => {
    router.push({
      pathname: '/mock-test/[testId]',
      params: { testId },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <BlueTextureBackground isDark={isDark} />
      <MockTestDashboard
        onStartTest={handleStartTest}
        onBack={() => router.back()}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
