import React from 'react';
import {
  ActivityIndicator,
  Platform,
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
import { useAppTheme } from '@/context/ThemeContext';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Button title or label text */
  title?: string;
  /** primary (solid navy #1C2433), accent (burnt orange #B9570A), secondary (neutral bordered), tertiary (text-only) */
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
  isDark: propIsDark,
  style,
  textStyle,
  children,
}: ButtonProps) {
  const { isDark: contextIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const t = getTokens(isDark);

  // Exact sizes matching editorial specs: radius 11-12px, semibold 600
  const sizeStyles = {
    sm: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, fontSize: 13, gap: 6 },
    md: { minHeight: 40, paddingHorizontal: 18, borderRadius: 11, fontSize: 14, gap: 8 },
    lg: { minHeight: 48, paddingHorizontal: 24, borderRadius: 12, fontSize: 15, gap: 10 },
  }[size];

  const inactive = disabled || loading;
  let containerStyle: ViewStyle = {};
  let textColor = t.primaryForeground;

  if (variant === 'primary') {
    // Primary action button: Vibrant warm orange (#F58235), white text
    containerStyle = {
      backgroundColor: disabled ? t.disabledBackground : '#F58235',
      borderWidth: 0,
      borderRadius: sizeStyles.borderRadius,
    };
    textColor = disabled ? t.disabledForeground : '#FFFFFF';
  } else if (variant === 'accent') {
    // Accent action button: Vibrant warm orange (#F58235), white text
    containerStyle = {
      backgroundColor: disabled ? t.disabledBackground : '#F58235',
      borderWidth: 0,
      borderRadius: sizeStyles.borderRadius,
    };
    textColor = disabled ? t.disabledForeground : '#FFFFFF';
  } else if (variant === 'secondary') {
    // Clean secondary: white/soft surface, thin warm border, text
    containerStyle = {
      backgroundColor: disabled ? t.disabledBackground : (isDark ? '#1B2534' : '#FFFFFF'),
      borderWidth: 1,
      borderColor: isDark ? '#253244' : '#EAE5DC',
      borderRadius: sizeStyles.borderRadius,
    };
    textColor = disabled ? t.disabledForeground : (isDark ? '#F1F5F9' : '#1E293B');
  } else {
    // Tertiary: Text-only, no border
    containerStyle = {
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingHorizontal: 8,
      borderRadius: sizeStyles.borderRadius,
    };
    textColor = disabled ? t.disabledForeground : (isDark ? '#F1F5F9' : '#1E293B');
  }

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed, hovered }: any) => [
        styles.base,
        {
          minHeight: sizeStyles.minHeight,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: sizeStyles.borderRadius,
          gap: sizeStyles.gap,
          width: fullWidth ? '100%' : 'auto',
          opacity: pressed ? 0.88 : 1,
        },
        containerStyle,
        // Hover effect for primary & accent
        (variant === 'primary' || variant === 'accent') && !inactive && hovered && {
          backgroundColor: '#E07328',
        },
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
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      },
    }),
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
