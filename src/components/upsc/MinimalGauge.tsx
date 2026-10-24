import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface MinimalGaugeProps {
  size?: number;
  strokeWidth?: number;
  progress?: number; // 0 to 1
  trackColor?: string;
  fillColor?: string;
  children?: React.ReactNode;
}

/**
 * Clean, modern monochrome arc gauge (spans 240 degrees)
 */
export function MinimalArcGauge({
  size = 130,
  strokeWidth = 8,
  progress = 0,
  trackColor = '#222222',
  fillColor = '#FFFFFF',
  children,
}: MinimalGaugeProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  const arcDegrees = 240;
  const startAngle = 150;
  const totalLength = (arcDegrees / 360) * (2 * Math.PI * radius);
  const strokeDashoffset = totalLength * (1 - clampedProgress);

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
        <Path
          d={arcPath}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={arcPath}
          stroke={fillColor}
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
