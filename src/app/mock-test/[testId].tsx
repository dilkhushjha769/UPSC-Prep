import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ActiveMockTestScreen } from '@/components/mockTest/ActiveMockTestScreen';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { BW_THEME } from '@/constants/bwTheme';
import { useAppTheme } from '@/context/ThemeContext';

export default function ActiveMockTestRoute() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { isDark } = useAppTheme();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;

  if (!testId) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <BlueTextureBackground isDark={isDark} />
      <ActiveMockTestScreen
        testId={testId}
        onClose={() => router.back()}
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
