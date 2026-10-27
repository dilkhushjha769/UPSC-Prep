import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PALETTE, Typography } from '@/constants/colors';


// ============================================================================
// 1. LINEAR PROGRESS BAR
// ============================================================================

export interface ProgressBarProps {
  /** Progress value from 0 to 1 (or 0 to 100). Defaults to 0. */
  progress?: number;
  /** Height of the progress bar in pixels. Defaults to 8. */
  height?: number;
  /** Active bar fill color. Defaults to #006FFD (Highlight Primary). */
  fillColor?: string;
  /** Inactive track background color. Defaults to #E8E9F1 (Neutral Light Border Subtle). */
  trackColor?: string;
  /** If true, animates progress changes smoothly. Defaults to true. */
  animated?: boolean;
  /** If true, displays a continuous sweeping loading animation. Defaults to false. */
  indeterminate?: boolean;
  /** Fully rounded pill caps. Defaults to 9999. */
  borderRadius?: number;
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress = 0,
  height = 8,
  fillColor = PALETTE.highlight.primary,
  trackColor = PALETTE.neutral.light.borderSubtle,
  animated = true,
  indeterminate = false,
  borderRadius = 9999,
  style,
}: ProgressBarProps) {
  // Normalize progress (support 0..1 or 0..100)
  const normalizedProgress = Math.max(0, Math.min(1, progress > 1 ? progress / 100 : progress));

  const animatedValue = useRef(new Animated.Value(normalizedProgress)).current;
  const indeterminateAnim = useRef(new Animated.Value(0)).current;

  // Handle determinate progress animation
  useEffect(() => {
    if (!indeterminate) {
      if (animated) {
        Animated.timing(animatedValue, {
          toValue: normalizedProgress,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      } else {
        animatedValue.setValue(normalizedProgress);
      }
    }
  }, [normalizedProgress, animated, indeterminate, animatedValue]);

  // Handle indeterminate sweeping loader animation
  useEffect(() => {
    if (indeterminate) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(indeterminateAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      indeterminateAnim.setValue(0);
    }
  }, [indeterminate, indeterminateAnim]);

  const widthInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const indeterminateLeft = indeterminateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '70%'],
  });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(normalizedProgress * 100),
      }}>
      {indeterminate ? (
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: fillColor,
              borderRadius,
              width: '35%',
              left: indeterminateLeft,
            },
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              backgroundColor: fillColor,
              borderRadius,
              width: widthInterpolation,
            },
          ]}
        />
      )}
    </View>
  );
}

// ============================================================================
// 2. SEGMENTED PROGRESS / STEP PILLS (Image 1)
// ============================================================================

export interface SegmentedProgressProps {
  /** Total number of pill segments. Defaults to 4. */
  totalSegments?: number;
  /** Active segments count (1 to totalSegments). If not provided, computed from progress. */
  currentStep?: number;
  /** Fractional progress (0 to 1 or 0 to 100) to auto-compute active steps. */
  progress?: number;
  /** Segment height in pixels. Defaults to 8. */
  height?: number;
  /** Gap between pill segments. Defaults to 6. */
  gap?: number;
  /** Active pill color. Defaults to #006FFD. */
  fillColor?: string;
  /** Inactive pill color. Defaults to #E8E9F1. */
  trackColor?: string;
  /** If true, runs a sequential wave loading animation across pills. */
  indeterminate?: boolean;
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
}

export function SegmentedProgress({
  totalSegments = 4,
  currentStep,
  progress,
  height = 8,
  gap = 6,
  fillColor = PALETTE.highlight.primary,
  trackColor = PALETTE.neutral.light.borderSubtle,
  indeterminate = false,
  style,
}: SegmentedProgressProps) {
  // Determine active count
  let activeCount = 0;
  if (currentStep !== undefined) {
    activeCount = Math.max(0, Math.min(totalSegments, currentStep));
  } else if (progress !== undefined) {
    const norm = Math.max(0, Math.min(1, progress > 1 ? progress / 100 : progress));
    activeCount = Math.round(norm * totalSegments);
  }

  // Wave animation for indeterminate mode
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (indeterminate) {
      const loop = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: totalSegments,
          duration: totalSegments * 300,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [indeterminate, totalSegments, pulseAnim]);

  return (
    <View style={[styles.segmentedContainer, style]}>
      {Array.from({ length: totalSegments }).map((_, index) => {
        const isActive = index < activeCount;

        if (indeterminate) {
          const opacity = pulseAnim.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.segment,
                {
                  height,
                  backgroundColor: fillColor,
                  marginRight: index === totalSegments - 1 ? 0 : gap,
                  opacity,
                },
              ]}
            />
          );
        }

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                height,
                backgroundColor: isActive ? fillColor : trackColor,
                marginRight: index === totalSegments - 1 ? 0 : gap,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ============================================================================
// 3. CIRCULAR PROGRESS & LOADING SPINNER (Image 3)
// ============================================================================

export interface CircularProgressProps {
  /** Outer diameter size in pixels. Defaults to 40. */
  size?: number;
  /** Stroke thickness in pixels. Defaults to 4. */
  strokeWidth?: number;
  /** Progress from 0 to 1 (or 0 to 100). */
  progress?: number;
  /** Active arc color. Defaults to #006FFD. */
  fillColor?: string;
  /** Background track color. Defaults to #E8E9F1. */
  trackColor?: string;
  /** Continuous rotation spinner mode. Defaults to false. */
  indeterminate?: boolean;
  /** Spinner rotation cycle speed in ms. Defaults to 900ms. */
  duration?: number;
  /** Optional content centered inside the circle. */
  children?: React.ReactNode;
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
}

export function CircularProgress({
  size = 40,
  strokeWidth = 4,
  progress = 0,
  fillColor = PALETTE.highlight.primary,
  trackColor = PALETTE.neutral.light.borderSubtle,
  indeterminate = false,
  duration = 900,
  children,
  style,
}: CircularProgressProps) {
  const norm = Math.max(0, Math.min(1, progress > 1 ? progress / 100 : progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(norm)).current;

  // Spinner rotation loop
  useEffect(() => {
    if (indeterminate) {
      const loop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [indeterminate, duration, rotateAnim]);

  // Determinate progress animation
  useEffect(() => {
    if (!indeterminate) {
      Animated.timing(progressAnim, {
        toValue: norm,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [norm, indeterminate, progressAnim]);

  const spinInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // In indeterminate spinner mode, show an elegant 30% arc spinning
  const activeProgress = indeterminate ? 0.3 : norm;
  const strokeDashoffset = circumference * (1 - activeProgress);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={
        indeterminate
          ? undefined
          : { min: 0, max: 100, now: Math.round(norm * 100) }
      }>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: indeterminate ? [{ rotate: spinInterpolation }] : undefined,
        }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Active Progress Arc */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      </Animated.View>

      {children && (
        <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
          {children}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// 4. CONVENIENCE LOADING SPINNER ALIAS
// ============================================================================

export interface LoadingSpinnerProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingSpinner({
  size = 32,
  strokeWidth = 3.5,
  color = PALETTE.highlight.primary,
  style,
}: LoadingSpinnerProps) {
  return (
    <CircularProgress
      size={size}
      strokeWidth={strokeWidth}
      fillColor={color}
      trackColor={PALETTE.neutral.light.borderSubtle}
      indeterminate
      style={style}
    />
  );
}

// ============================================================================
// 5. FULL VIEW LOADING INDICATOR
// ============================================================================

export interface LoadingViewProps {
  message?: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingView({
  message = 'Loading...',
  size = 40,
  color = PALETTE.highlight.primary,
  style,
}: LoadingViewProps) {
  return (
    <View style={[styles.loadingView, style]}>
      <LoadingSpinner size={size} color={color} />
      {message ? (
        <Text
          style={[
            Typography.bodyM,
            styles.loadingMessage,
            { color: PALETTE.neutral.dark.textSecondary },
          ]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 9999,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingMessage: {
    marginTop: 8,
  },
});
