import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface CircularGaugeProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0 to 1
  trackColor?: string;
  fillColor?: string;
  gradientColors?: [string, string];
  gradientId?: string;
  children?: React.ReactNode;
}

/**
 * Full 360-degree smooth circular progress ring
 */
export function CircularGauge({
  size = 120,
  strokeWidth = 10,
  progress = 0,
  trackColor = '#EDE9FE',
  fillColor = '#7C3AED',
  gradientColors,
  gradientId = 'gaugeGradient',
  children,
}: CircularGaugeProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gradientColors && (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        )}

        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Fill */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradientColors ? `url(#${gradientId})` : fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {children && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {children}
        </View>
      )}
    </View>
  );
}

interface ArcGaugeProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0 to 1
  trackColor?: string;
  fillColor?: string;
  startAngle?: number; // degrees
  endAngle?: number; // degrees
  gradientColors?: [string, string];
  gradientId?: string;
  children?: React.ReactNode;
}

/**
 * Elegant Open Arc Gauge (inspired directly by the reference image's Calories & Nutrient gauges)
 * Arc spans ~240 degrees (from 150 deg to 390 deg), leaving the bottom open
 */
export function ArcGauge({
  size = 110,
  strokeWidth = 9,
  progress = 0,
  trackColor = '#EDE9FE',
  fillColor = '#7C3AED',
  gradientColors,
  gradientId = 'arcGrad',
  children,
}: ArcGaugeProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Arc angles: 240 degrees total, starting at 150 deg (bottom left) to 390 deg (bottom right)
  const arcDegrees = 240;
  const startAngle = 150;
  const totalLength = (arcDegrees / 360) * (2 * Math.PI * radius);
  const strokeDashoffset = totalLength * (1 - clampedProgress);

  // Helper to convert polar to cartesian
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const arcPath = describeArc(center, center, radius, startAngle, startAngle + arcDegrees);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gradientColors && (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        )}

        {/* Track */}
        <Path
          d={arcPath}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Progress Arc */}
        <Path
          d={arcPath}
          stroke={gradientColors ? `url(#${gradientId})` : fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${totalLength} ${totalLength}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {children && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {children}
        </View>
      )}
    </View>
  );
}
