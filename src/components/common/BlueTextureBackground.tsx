import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PALETTE } from '@/constants/colors';
import { useAppTheme } from '@/context/ThemeContext';

interface BlueTextureBackgroundProps {
  isDark?: boolean;
}

/**
 * Constant, clean base background matching the design system:
 * - Dark mode: Flat #0B1018 background
 * - Light mode: Constant #FAF9F6
 */
export function BlueTextureBackground({ isDark: propIsDark }: BlueTextureBackgroundProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const bgColor = isDark ? PALETTE.neutral.dark.darkest : PALETTE.neutral.light.surface;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: bgColor,
        },
      ]}
      pointerEvents="none"
    />
  );
}

export default BlueTextureBackground;
