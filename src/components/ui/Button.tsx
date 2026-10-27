import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { PALETTE, Typography } from '@/constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button title or label text */
  title?: string;
  /** Visual variant from Figma style guide: primary (solid), secondary (outline), tertiary (text-only) */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** On press handler */
  onPress?: () => void;
  /** Optional icon to render on the left */
  leftIcon?: React.ReactNode;
  /** Optional icon to render on the right */
  rightIcon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Loading indicator state */
  loading?: boolean;
  /** Stretch to full width of parent container */
  fullWidth?: boolean;
  /** Whether dark mode is active */
  isDark?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom text style */
  textStyle?: StyleProp<TextStyle>;
  /** Children as alternative to title */
  children?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  onPress,
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
  fullWidth = false,
  isDark = false,
  style,
  textStyle,
  children,
}: ButtonProps) {
  // Size-specific paddings & font sizes matching Figma specs
  const sizeStyles = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      fontSize: 12,
      gap: 6,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      fontSize: 14,
      gap: 8,
    },
    lg: {
      paddingVertical: 15,
      paddingHorizontal: 24,
      borderRadius: 14,
      fontSize: 16,
      gap: 10,
    },
  }[size];

  // Variant styling matching the Figma "CONTROL Button" style sheet
  let containerStyle: ViewStyle = {};
  let textColor = '#FFFFFF';

  if (variant === 'primary') {
    // Primary: Solid blue #006FFD with white text
    containerStyle = {
      backgroundColor: disabled ? (isDark ? '#3A3D46' : '#C5C6CC') : PALETTE.highlight.primary,
      borderWidth: 0,
    };
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    // Secondary: Outline with #006FFD border, transparent background, blue text
    containerStyle = {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: disabled
        ? (isDark ? '#494A50' : '#D4D6DD')
        : (isDark ? '#2897FF' : PALETTE.highlight.primary),
    };
    textColor = disabled
      ? (isDark ? '#71727A' : '#8F9098')
      : (isDark ? '#6FBAFF' : PALETTE.highlight.primary);
  } else if (variant === 'tertiary') {
    // Tertiary: Text-only, no border, transparent background, blue text
    containerStyle = {
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingHorizontal: 8,
    };
    textColor = disabled
      ? (isDark ? '#71727A' : '#8F9098')
      : (isDark ? '#6FBAFF' : PALETTE.highlight.primary);
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          gap: sizeStyles.gap,
          width: fullWidth ? '100%' : 'auto',
          opacity: pressed ? 0.78 : disabled ? 0.6 : 1,
        },
        containerStyle,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
        />
      ) : (
        <>
          {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}

          {children ? (
            children
          ) : title ? (
            <Text
              style={[
                styles.text,
                {
                  fontSize: sizeStyles.fontSize,
                  color: textColor,
                },
                textStyle,
              ]}>
              {title}
            </Text>
          ) : null}

          {rightIcon && <View style={styles.iconWrapper}>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Typography.fontFamily,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
