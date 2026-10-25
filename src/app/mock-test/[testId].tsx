import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ActiveMockTestScreen } from '@/components/mockTest/ActiveMockTestScreen';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { BW_THEME } from '@/constants/bwTheme';

export default function ActiveMockTestRoute() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
