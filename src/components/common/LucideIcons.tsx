import React from 'react';
import Svg, { Path, Circle as SvgCircle, Rect, Line, Polyline, SvgProps } from 'react-native-svg';

export interface LucideIconProps extends SvgProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

const defaultProps = {
  size: 24,
  color: '#000000',
  strokeWidth: 2,
};

export function ArrowLeft({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m12 19-7-7 7-7" />
      <Path d="M19 12H5" />
    </Svg>
  );
}

export function ArrowRight({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function ChevronRight({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function ChevronDown({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function ChevronUp({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m18 15-6-6-6 6" />
    </Svg>
  );
}

export function BookOpen({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </Svg>
  );
}

export function Timer({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Line x1="10" x2="14" y1="2" y2="2" />
      <Line x1="12" x2="15" y1="14" y2="11" />
      <SvgCircle cx="12" cy="14" r="8" />
    </Svg>
  );
}

export function FileText({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <Path d="M10 9H8" />
      <Path d="M16 13H8" />
      <Path d="M16 17H8" />
    </Svg>
  );
}

export function TrendingUp({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <Polyline points="16 7 22 7 22 13" />
    </Svg>
  );
}

export function Sparkles({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <Path d="M5 3v4" />
      <Path d="M19 17v4" />
      <Path d="M3 5h4" />
      <Path d="M17 19h4" />
    </Svg>
  );
}

export function X({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </Svg>
  );
}

export function CheckCircle2({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SvgCircle cx="12" cy="12" r="10" />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function Circle({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SvgCircle cx="12" cy="12" r="10" />
    </Svg>
  );
}

export function CheckSquare({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Polyline points="9 11 12 14 22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

export function Square({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Rect width="18" height="18" x="3" y="3" rx="2" />
    </Svg>
  );
}

export function Bookmark({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </Svg>
  );
}

export function Calendar({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M8 2v4" />
      <Path d="M16 2v4" />
      <Rect width="18" height="18" x="3" y="4" rx="2" />
      <Path d="M3 10h18" />
    </Svg>
  );
}

export function XCircle({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SvgCircle cx="12" cy="12" r="10" />
      <Path d="m15 9-6 6" />
      <Path d="m9 9 6 6" />
    </Svg>
  );
}

export function ShieldCheck({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function Lightbulb({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <Path d="M9 18h6" />
      <Path d="M10 22h4" />
    </Svg>
  );
}

export function Flag({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <Line x1="4" x2="4" y1="22" y2="15" />
    </Svg>
  );
}

export function CheckCheck({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M18 6 7 17l-5-5" />
      <Path d="m22 10-7.5 7.5L13 16" />
    </Svg>
  );
}

export function Award({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SvgCircle cx="12" cy="8" r="6" />
      <Path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </Svg>
  );
}

export function ListFilter({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M3 6h18" />
      <Path d="M7 12h10" />
      <Path d="M10 18h4" />
    </Svg>
  );
}

export function Eye({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <SvgCircle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function HelpCircle({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SvgCircle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

export function Filter({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </Svg>
  );
}

export function TrendingDown({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <Polyline points="16 17 22 17 22 11" />
    </Svg>
  );
}

export function BarChart2({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Line x1="18" y1="20" x2="18" y2="10" />
      <Line x1="12" y1="20" x2="12" y2="4" />
      <Line x1="6" y1="20" x2="6" y2="14" />
    </Svg>
  );
}

export function Info({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <SvgCircle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  );
}

export function RotateCcw({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <Path d="M3 3v5h5" />
    </Svg>
  );
}

export function Check({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function LayoutGrid({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Rect width="7" height="7" x="3" y="3" rx="1" />
      <Rect width="7" height="7" x="14" y="3" rx="1" />
      <Rect width="7" height="7" x="14" y="14" rx="1" />
      <Rect width="7" height="7" x="3" y="14" rx="1" />
    </Svg>
  );
}

export function AlertTriangle({ size = defaultProps.size, color = defaultProps.color, strokeWidth = defaultProps.strokeWidth, ...props }: LucideIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
}



