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
    lightBg: '#B9F8BA', // Exact pastel green from reference image
    darkBg: '#133522',
    lightBorder: '#9CECA4',
    darkBorder: '#235938',
    lightText: '#0F3819',
    darkText: '#D1FAE5',
    lightSubtext: '#225E33',
    darkSubtext: '#A7F3D0',
    chipDot: '#22C55E',
  },
  blue: {
    id: 'blue',
    label: 'Sky Blue',
    lightBg: '#BAE6FD',
    darkBg: '#0C2A4D',
    lightBorder: '#93C5FD',
    darkBorder: '#1E4976',
    lightText: '#0A335C',
    darkText: '#E0F2FE',
    lightSubtext: '#174A7C',
    darkSubtext: '#BAE6FD',
    chipDot: '#006FFD',
  },
  purple: {
    id: 'purple',
    label: 'Lavender',
    lightBg: '#DDD6FE',
    darkBg: '#2E1065',
    lightBorder: '#C4B5FD',
    darkBorder: '#4C1D95',
    lightText: '#3B0764',
    darkText: '#EDE9FE',
    lightSubtext: '#581C87',
    darkSubtext: '#DDD6FE',
    chipDot: '#8B5CF6',
  },
  yellow: {
    id: 'yellow',
    label: 'Amber Sun',
    lightBg: '#FEF08A',
    darkBg: '#422006',
    lightBorder: '#FDE047',
    darkBorder: '#713F12',
    lightText: '#5A3203',
    darkText: '#FEF9C3',
    lightSubtext: '#78350F',
    darkSubtext: '#FEF08A',
    chipDot: '#EAB308',
  },
  pink: {
    id: 'pink',
    label: 'Soft Rose',
    lightBg: '#FBCFE8',
    darkBg: '#500724',
    lightBorder: '#F472B6',
    darkBorder: '#831843',
    lightText: '#4A0420',
    darkText: '#FCE7F3',
    lightSubtext: '#700938',
    darkSubtext: '#FBCFE8',
    chipDot: '#EC4899',
  },
  orange: {
    id: 'orange',
    label: 'Warm Peach',
    lightBg: '#FED7AA',
    darkBg: '#431407',
    lightBorder: '#FB923C',
    darkBorder: '#7C2D12',
    lightText: '#4D1705',
    darkText: '#FFEDD5',
    lightSubtext: '#7C2D12',
    darkSubtext: '#FED7AA',
    chipDot: '#F97316',
  },
  default: {
    id: 'default',
    label: 'Neutral',
    lightBg: '#FFFFFF',
    darkBg: '#2F3036',
    lightBorder: '#E8E9F1',
    darkBorder: '#3F414A',
    lightText: '#1F2024',
    darkText: '#FFFFFF',
    lightSubtext: '#71727A',
    darkSubtext: '#8F9098',
    chipDot: '#8F9098',
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
    bg: isDark ? '#26272D' : '#FFFFFF',
    border: isDark ? '#383A42' : '#E8E9F1',
    text: isDark ? '#FFFFFF' : '#1F2024',
    subtext: isDark ? '#9EA0AA' : '#71727A',
    chipDot: '#8F9098',
    isColored: false,
  };
}
