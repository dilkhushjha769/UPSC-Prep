import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { TasksScreen } from '@/components/tasks';
import { BlueTextureBackground } from '@/components/common/BlueTextureBackground';
import { SemanticColors } from '@/constants/colors';
import { useAppTheme } from '@/context/ThemeContext';

export default function TasksRoute() {
  const { isDark, toggleTheme } = useAppTheme();
  const shellBg = SemanticColors[isDark ? 'dark' : 'light'].background;

  return (
    <View style={{ flex: 1, backgroundColor: shellBg }}>
      <BlueTextureBackground isDark={isDark} />
      <TasksScreen
        isDark={isDark}
        onBackToHome={() => router.push('/')}
        onToggleTheme={toggleTheme}
      />
    </View>
  );
}
