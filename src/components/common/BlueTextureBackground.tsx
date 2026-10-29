import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PALETTE } from '@/constants/colors';

interface BlueTextureBackgroundProps {
  isDark?: boolean;
}

/**
 * Constant, clean base background matching the Figma design system:
 * - Dark mode: Flat navy-charcoal surface (see designTokens.ts) with no shading or gradients
 * - Light mode: Constant #FAF9F6 (Neutral Light Surface)
 */
export function BlueTextureBackground({ isDark = false }: BlueTextureBackgroundProps) {
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
