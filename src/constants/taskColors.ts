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
    darkBg: '#17301F',
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
    darkBg: '#1B2534',
    lightBorder: '#F2C9A3',
    darkBorder: '#253244',
    lightText: '#1B2534',
    darkText: '#F0F4F8',
    lightSubtext: '#253244',
    darkSubtext: '#F2C9A3',
    chipDot: '#FF9500',
  },
  purple: {
    id: 'purple',
    label: 'Lavender',
    lightBg: '#CBD3EB',
    darkBg: '#1B2534',
    lightBorder: '#CBD3EB',
    darkBorder: '#3D5A99',
    lightText: '#1B2534',
    darkText: '#F0F4F8',
    lightSubtext: '#253244',
    darkSubtext: '#CBD3EB',
    chipDot: '#7C93D1',
  },
  yellow: {
    id: 'yellow',
    label: 'Amber Sun',
    lightBg: '#FF9500',
    darkBg: '#2A1D12',
    lightBorder: '#FF9500',
    darkBorder: '#78350F',
    lightText: '#2A1D12',
    darkText: '#F2C9A3',
    lightSubtext: '#9A3412',
    darkSubtext: '#E0963A',
    chipDot: '#FF9500',
  },
  pink: {
    id: 'pink',
    label: 'Soft Rose',
    lightBg: '#CBD3EB',
    darkBg: '#1B2534',
    lightBorder: '#7C93D1',
    darkBorder: '#253244',
    lightText: '#141C28',
    darkText: '#F0F4F8',
    lightSubtext: '#1B2534',
    darkSubtext: '#CBD3EB',
    chipDot: '#3D5A99',
  },
  orange: {
    id: 'orange',
    label: 'Warm Peach',
    lightBg: '#F2C9A3',
    darkBg: '#3B1A17',
    lightBorder: '#FF9500',
    darkBorder: '#78350F',
    lightText: '#2A1D12',
    darkText: '#F2C9A3',
    lightSubtext: '#9A3412',
    darkSubtext: '#F2C9A3',
    chipDot: '#FF9500',
  },
  default: {
    id: 'default',
    label: 'Neutral',
    lightBg: '#FFFFFF',
    darkBg: '#141C28',
    lightBorder: '#EAE5DC',
    darkBorder: '#253244',
    lightText: '#1C2433',
    darkText: '#FFFFFF',
    lightSubtext: '#7A8499',
    darkSubtext: '#6E7A8E',
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
    if (isDark) {
      return {
        bg: scheme.darkBg,
        border: scheme.darkBorder,
        text: scheme.darkText,
        subtext: scheme.darkSubtext,
        chipDot: scheme.chipDot,
        isColored: true,
      };
    }
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
    bg: isDark ? '#141C28' : '#FFFFFF',
    border: isDark ? '#253244' : '#EAE5DC',
    text: isDark ? '#F1F5F9' : '#1E293B',
    subtext: isDark ? '#94A3B8' : '#64748B',
    chipDot: '#8892A6',
    isColored: false,
  };
}
