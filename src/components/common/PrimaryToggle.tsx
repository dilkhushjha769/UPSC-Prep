import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

interface PrimaryToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  isDark?: boolean;
  disabled?: boolean;
  activeTrackColor?: string;
}

export function PrimaryToggle({
  value,
  onValueChange,
  isDark: propIsDark,
  disabled = false,
  activeTrackColor = '#F58235',
}: PrimaryToggleProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[
        styles.track,
        {
          backgroundColor: value
            ? activeTrackColor
            : isDark
            ? '#253244'
            : '#DDD6CA',
          opacity: disabled ? 0.45 : 1,
        },
      ]}>
      <View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: value ? 18 : 2 }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
});
