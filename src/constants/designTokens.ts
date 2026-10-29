/**
 * Premium UPSC Editorial design system — single source of truth for colour,
 * type, spacing and radius. Every other theme module (bwTheme, prelimsTheme,
 * colors, themeColors, theme) is derived from these tokens.
 *
 * Light = warm editorial default. Dark = a coherent navy-charcoal counterpart.
 */

export type SemanticTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  foreground: string;
  mutedForeground: string;
  subtleForeground: string;
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  muted: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  destructive: string;
  destructiveSoft: string;
  infoSoft: string;
  infoForeground: string;
  disabledBackground: string;
  disabledForeground: string;
  overlay: string;
};

export const LIGHT_TOKENS: SemanticTokens = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  foreground: '#1C2433',
  mutedForeground: '#5F6B80',
  subtleForeground: '#7A8499',
  primary: '#1C2433',
  primaryHover: '#2B3547',
  primaryForeground: '#FFFFFF',
  accent: '#B9570A',
  accentHover: '#974606',
  accentForeground: '#FFFFFF',
  accentSoft: '#FCEBDD',
  border: '#EAE5DC',
  borderStrong: '#DDD6CA',
  muted: '#F0EDE6',
  success: '#26734D',
  successSoft: '#E3F1E8',
  warning: '#A65A0A',
  warningSoft: '#FCEBDD',
  destructive: '#B42318',
  destructiveSoft: '#FBE4E1',
  infoSoft: '#E9EDF9',
  infoForeground: '#3D4A66',
  disabledBackground: '#EAE7E1',
  disabledForeground: '#858585',
  overlay: 'rgba(28, 36, 51, 0.45)',
};

export const DARK_TOKENS: SemanticTokens = {
  background: '#151A25',
  surface: '#1E2535',
  surfaceRaised: '#262E40',
  foreground: '#F2EFE8',
  mutedForeground: '#A4ADBF',
  subtleForeground: '#8892A6',
  primary: '#B9570A',
  primaryHover: '#D06A1A',
  primaryForeground: '#FFFFFF',
  accent: '#D9822B',
  accentHover: '#E8963F',
  accentForeground: '#151A25',
  accentSoft: '#3A2614',
  border: '#333D52',
  borderStrong: '#46526B',
  muted: '#262E40',
  success: '#3FA573',
  successSoft: '#16382A',
  warning: '#D9822B',
  warningSoft: '#3A2614',
  destructive: '#E0675B',
  destructiveSoft: '#3D1B18',
  infoSoft: '#232D44',
  infoForeground: '#B8C4E6',
  disabledBackground: '#262E40',
  disabledForeground: '#6B7487',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const getTokens = (isDark: boolean): SemanticTokens => (isDark ? DARK_TOKENS : LIGHT_TOKENS);

/** Data-visualisation series: navy first, burnt orange for emphasis. */
export const CHART_COLORS = {
  light: { primary: '#1C2433', secondary: '#B9570A', tertiary: '#5F6B80', grid: '#EAE5DC', label: '#5F6B80' },
  dark: { primary: '#F2EFE8', secondary: '#D9822B', tertiary: '#A4ADBF', grid: '#333D52', label: '#A4ADBF' },
};

export const FONT_FAMILY = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export const TYPE_SCALE = {
  pageTitle: { fontSize: 32, lineHeight: 40 },
  pageTitleMobile: { fontSize: 28, lineHeight: 34 },
  articleTitle: { fontSize: 30, lineHeight: 38 },
  sectionTitle: { fontSize: 22, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 26 },
  bodySmall: { fontSize: 15, lineHeight: 24 },
  meta: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 14, lineHeight: 20 },
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const RADIUS = { control: 10, compact: 12, card: 16, pill: 9999 } as const;

export const CONTROL_HEIGHT = { sm: 36, md: 44, lg: 48 } as const;

