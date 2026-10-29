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
import { Typography } from '@/constants/colors';
import { getTokens } from '@/constants/designTokens';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button title or label text */
  title?: string;
  /** primary (navy), accent (burnt orange, use sparingly), secondary (neutral bordered), tertiary (text-only) */
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
  const t = getTokens(isDark);

  // Heights: sm 36, md 44, lg 48. Radius 10-12.
  const sizeStyles = {
    sm: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, fontSize: 13, gap: 6 },
    md: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, fontSize: 14, gap: 8 },
    lg: { minHeight: 48, paddingHorizontal: 24, borderRadius: 12, fontSize: 15, gap: 10 },
  }[size];

  const inactive = disabled || loading;
  let containerStyle: ViewStyle = {};
  let textColor = t.primaryForeground;

  if (variant === 'primary' || variant === 'accent') {
    const solid = variant === 'primary' ? t.primary : t.accent;
    const fg = variant === 'primary' ? t.primaryForeground : t.accentForeground;
    containerStyle = {
      backgroundColor: disabled ? t.disabledBackground : solid,
      borderWidth: 0,
    };
    textColor = disabled ? t.disabledForeground : fg;
  } else if (variant === 'secondary') {
    containerStyle = {
      backgroundColor: disabled ? t.disabledBackground : t.surface,
      borderWidth: 1,
      borderColor: t.border,
    };
    textColor = disabled ? t.disabledForeground : t.foreground;
  } else {
    containerStyle = { backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 8 };
    textColor = disabled ? t.disabledForeground : t.foreground;
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: sizeStyles.minHeight,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          gap: sizeStyles.gap,
          width: fullWidth ? '100%' : 'auto',
          opacity: pressed ? 0.85 : 1,
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
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
