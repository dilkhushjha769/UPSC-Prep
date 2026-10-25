import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface BlueTextureBackgroundProps {
  isDark?: boolean;
}

export function BlueTextureBackground({ isDark = false }: BlueTextureBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Subtle vertical blue gradient */}
          <LinearGradient id="globalBlueTextureBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={isDark ? '#111524' : '#EAF1FD'} stopOpacity="1" />
            <Stop offset="25%" stopColor={isDark ? '#0F131F' : '#F1F5FD'} stopOpacity="1" />
            <Stop offset="65%" stopColor={isDark ? '#0E111B' : '#F7FAFF'} stopOpacity="1" />
            <Stop offset="100%" stopColor={isDark ? '#0D0F17' : '#F8FAFC'} stopOpacity="1" />
          </LinearGradient>
          {/* Subtle ambient blue/periwinkle highlight glow from top right */}
          <LinearGradient id="globalBlueTextureGlow" x1="100%" y1="0%" x2="0%" y2="60%">
            <Stop offset="0%" stopColor={isDark ? '#3B82F6' : '#93C5FD'} stopOpacity={isDark ? 0.12 : 0.28} />
            <Stop offset="55%" stopColor={isDark ? '#6366F1' : '#C7D2FE'} stopOpacity={isDark ? 0.05 : 0.14} />
            <Stop offset="100%" stopColor={isDark ? '#3B82F6' : '#93C5FD'} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#globalBlueTextureBase)" />
        <Rect width="100%" height="100%" fill="url(#globalBlueTextureGlow)" />
      </Svg>
    </View>
  );
}
