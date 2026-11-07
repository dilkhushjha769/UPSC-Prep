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
  surfaceRaised: '#F5F3EE',
  foreground: '#1E293B',
  mutedForeground: '#64748B',
  subtleForeground: '#7A8499',
  primary: '#F58235', // Unified vibrant brand orange
  primaryHover: '#E07328',
  primaryForeground: '#FFFFFF',
  accent: '#F58235', // Refined burnt orange for accents
  accentHover: '#E07328',
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
  // Midnight Navy & Charcoal design system directly matched from editorial visual design mockup:
  // Deep dark blue-black background #0B1018, navy-slate card surfaces #141C28,
  // card border #253244, crisp white text #F1F5F9,
  // Primary action button: crisp white #F4F6FB with dark text #0D1520
  // Secondary button: dark navy-slate #1B2534 with border #253244 and light text #F1F5F9
  // Active pill / accent: vibrant warm orange #F58235
  background: '#0B1018',
  surface: '#141C28',
  surfaceRaised: '#1B2534',
  foreground: '#F1F5F9',
  mutedForeground: '#94A3B8',
  subtleForeground: '#6E7A8E',
  primary: '#F58235', // Unified vibrant brand orange matching light mode
  primaryHover: '#E07328',
  primaryForeground: '#FFFFFF',
  accent: '#F58235', // Vibrant warm editorial orange
  accentHover: '#E07328',
  accentForeground: '#FFFFFF',
  accentSoft: '#2B1E16',
  border: '#253244', // Refined deep navy-slate border
  borderStrong: '#334155',
  muted: '#182130',
  success: '#3FA573',
  successSoft: '#13281E',
  warning: '#F58235',
  warningSoft: '#2B1E16',
  destructive: '#E56D60',
  destructiveSoft: '#331715',
  infoSoft: '#162338',
  infoForeground: '#8EAEE0',
  disabledBackground: '#1B2534',
  disabledForeground: '#525E73',
  overlay: 'rgba(5, 8, 14, 0.75)',
};
export const getTokens = (isDark: boolean): SemanticTokens => (isDark ? DARK_TOKENS : LIGHT_TOKENS);

/**
 * Standard primary-button appearance: vibrant warm orange (#F58235), white text,
 * no border, 12px radius, semibold 600.
 */
export const primaryButtonStyle = (isDark: boolean = false) => ({
  backgroundColor: '#F58235',
  borderWidth: 0,
  borderRadius: 12,
});

export const primaryButtonTextStyle = (isDark: boolean = false) => ({
  color: '#FFFFFF',
  fontWeight: '600' as const,
});

/** Data-visualisation series: navy first, burnt orange for emphasis. */
export const CHART_COLORS = {
  light: { primary: '#1C2433', secondary: '#B9570A', tertiary: '#5F6B80', grid: '#EAE5DC', label: '#5F6B80' },
  dark: { primary: '#F4F6FB', secondary: '#EB853C', tertiary: '#9DA8B9', grid: '#253244', label: '#9DA8B9' },
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

export const CONTROL_HEIGHT = { sm: 36, md: 40, lg: 48 } as const;
