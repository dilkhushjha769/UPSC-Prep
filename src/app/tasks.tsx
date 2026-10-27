import React from 'react';
import { useColorScheme, View } from 'react-native';
import { router } from 'expo-router';
import { TasksScreen } from '@/components/tasks';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { SemanticColors } from '@/constants/colors';

export default function TasksRoute() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shellBg = SemanticColors[isDark ? 'dark' : 'light'].background;

  return (
    <View style={{ flex: 1, backgroundColor: shellBg }}>
      <BlueTextureBackground isDark={isDark} />
      <TasksScreen
        isDark={isDark}
        onBackToHome={() => router.push('/')}
      />
    </View>
  );
}
