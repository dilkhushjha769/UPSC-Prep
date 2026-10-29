import { TaskColorTag } from '@/types/study';

export interface TaskColorScheme {
  id: TaskColorTag;
  label: string;
  lightBg: string;
  darkBg: string;
  lightBorder: string;
  darkBorder: string;
  lightText: string;
  darkText: string;
  lightSubtext: string;
  darkSubtext: string;
  chipDot: string;
}

export const TASK_COLOR_PALETTES: Record<TaskColorTag, TaskColorScheme> = {
  green: {
    id: 'green',
    label: 'Sage Mint',
    lightBg: '#BFDECB', // Exact pastel green from reference image
    darkBg: '#16382A',
    lightBorder: '#3FA573',
    darkBorder: '#1D5C3D',
    lightText: '#16382A',
    darkText: '#E3F1E8',
    lightSubtext: '#1D5C3D',
    darkSubtext: '#BFDECB',
    chipDot: '#26734D',
  },
  blue: {
    id: 'blue',
    label: 'Sky Blue',
    lightBg: '#F2C9A3',
    darkBg: '#262E40',
    lightBorder: '#F2C9A3',
    darkBorder: '#333D52',
    lightText: '#262E40',
    darkText: '#E9EDF9',
    lightSubtext: '#333D52',
    darkSubtext: '#F2C9A3',
    chipDot: '#B9570A',
  },
  purple: {
    id: 'purple',
    label: 'Lavender',
    lightBg: '#CBD3EB',
    darkBg: '#262E40',
    lightBorder: '#CBD3EB',
    darkBorder: '#3D5A99',
    lightText: '#262E40',
    darkText: '#E9EDF9',
    lightSubtext: '#333D52',
    darkSubtext: '#CBD3EB',
    chipDot: '#7C93D1',
  },
  yellow: {
    id: 'yellow',
    label: 'Amber Sun',
    lightBg: '#D9822B',
    darkBg: '#2A1D12',
    lightBorder: '#D9822B',
    darkBorder: '#6B3A12',
    lightText: '#2A1D12',
    darkText: '#F2C9A3',
    lightSubtext: '#6B3A08',
    darkSubtext: '#D9822B',
    chipDot: '#B9570A',
  },
  pink: {
    id: 'pink',
    label: 'Soft Rose',
    lightBg: '#CBD3EB',
    darkBg: '#262E40',
    lightBorder: '#7C93D1',
    darkBorder: '#333D52',
    lightText: '#1E2535',
    darkText: '#E9EDF9',
    lightSubtext: '#262E40',
    darkSubtext: '#CBD3EB',
    chipDot: '#3D5A99',
  },
  orange: {
    id: 'orange',
    label: 'Warm Peach',
    lightBg: '#F2C9A3',
    darkBg: '#3D1B18',
    lightBorder: '#B9570A',
    darkBorder: '#6B3A12',
    lightText: '#2A1D12',
    darkText: '#F2C9A3',
    lightSubtext: '#6B3A12',
    darkSubtext: '#F2C9A3',
    chipDot: '#B9570A',
  },
  default: {
    id: 'default',
    label: 'Neutral',
    lightBg: '#FFFFFF',
    darkBg: '#1E2535',
    lightBorder: '#EAE5DC',
    darkBorder: '#333D52',
    lightText: '#1C2433',
    darkText: '#FFFFFF',
    lightSubtext: '#7A8499',
    darkSubtext: '#8892A6',
    chipDot: '#8892A6',
  },
};

export const COLOR_PATTERN: TaskColorTag[] = [
  'blue',
  'green',
  'purple',
  'yellow',
  'orange',
  'pink',
];

export function resolveTaskColorTag(colorTag?: TaskColorTag, fallbackIndex: number = 0): TaskColorTag {
  if (colorTag && colorTag !== 'default') {
    return colorTag;
  }
  return COLOR_PATTERN[Math.abs(fallbackIndex) % COLOR_PATTERN.length];
}

export function getTaskColors(colorTag?: TaskColorTag, isDark: boolean = false) {
  const tag = colorTag || 'default';
  const scheme = TASK_COLOR_PALETTES[tag] || TASK_COLOR_PALETTES.default;
  const isColored = tag !== 'default';

  if (isColored) {
    // Preserve the beautiful light mode colors in dark mode as requested (no muddy dark backgrounds)
    return {
      bg: scheme.lightBg,
      border: scheme.lightBorder,
      text: scheme.lightText,
      subtext: scheme.lightSubtext,
      chipDot: scheme.chipDot,
      isColored: true,
    };
  }

  // Default neutral card
  return {
    bg: isDark ? '#1E2535' : '#FFFFFF',
    border: isDark ? '#333D52' : '#EAE5DC',
    text: isDark ? '#FFFFFF' : '#1C2433',
    subtext: isDark ? '#A4ADBF' : '#7A8499',
    chipDot: '#8892A6',
    isColored: false,
  };
}
