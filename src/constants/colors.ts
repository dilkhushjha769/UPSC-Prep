import { Platform } from 'react-native';

/**
 * Design System Color Palette & Typography
 * Extracted from the Design System Style Guide.
 */

// ============================================================================
// 1. RAW COLOR PALETTE
// ============================================================================

export const PALETTE = {
  // Highlight / Primary Blues
  highlight: {
    primary: '#006FFD',
    tint80: '#2897FF',
    tint60: '#6FBAFF',
    tint40: '#B4DBFF',
    tint20: '#EAF2FF',
  },

  // Neutral Scales (Light & Dark)
  neutral: {
    light: {
      lightest: '#FFFFFF',
      surface: '#F8F9FE',
      borderSubtle: '#E8E9F1',
      border: '#D4D6DD',
      muted: '#C5C6CC',
    },
    dark: {
      darkest: '#1F2024',
      surface: '#2F3036',
      textMuted: '#494A50',
      textSecondary: '#71727A',
      muted: '#8F9098',
    },
  },

  // Support / Status Colors
  support: {
    success: {
      dark: '#298267',
      medium: '#3AC0A0',
      light: '#E7F4E8',
    },
    warning: {
      dark: '#E86339',
      medium: '#FFB37C',
      light: '#FFF4E4',
    },
    error: {
      dark: '#ED3241',
      medium: '#FF616D',
      light: '#FFE2E5',
    },
  },
} as const;

export const GLOBAL_PRIMARY_BLUE = '#006FFD';
export const TOGGLE_ACTIVE_COLOR = '#006FFD';

// ============================================================================
// 2. FLAT COLOR TOKENS
// ============================================================================

export const ColorTokens = {
  // Highlight
  highlight_006FFD: '#006FFD',
  highlight_2897FF: '#2897FF',
  highlight_6FBAFF: '#6FBAFF',
  highlight_B4DBFF: '#B4DBFF',
  highlight_EAF2FF: '#EAF2FF',

  // Neutral Light
  neutral_C5C6CC: '#C5C6CC',
  neutral_D4D6DD: '#D4D6DD',
  neutral_E8E9F1: '#E8E9F1',
  neutral_F8F9FE: '#F8F9FE',
  neutral_FFFFFF: '#FFFFFF',

  // Neutral Dark
  neutral_1F2024: '#1F2024',
  neutral_2F3036: '#2F3036',
  neutral_494A50: '#494A50',
  neutral_71727A: '#71727A',
  neutral_8F9098: '#8F9098',

  // Support - Success
  success_298267: '#298267',
  success_3AC0A0: '#3AC0A0',
  success_E7F4E8: '#E7F4E8',

  // Support - Warning
  warning_E86339: '#E86339',
  warning_FFB37C: '#FFB37C',
  warning_FFF4E4: '#FFF4E4',

  // Support - Error
  error_ED3241: '#ED3241',
  error_FF616D: '#FF616D',
  error_FFE2E5: '#FFE2E5',
} as const;

// ============================================================================
// 3. SEMANTIC THEME (LIGHT & DARK MODES)
// ============================================================================

export const SemanticColors = {
  light: {
    // Backgrounds & Surfaces
    background: PALETTE.neutral.light.surface, // #F8F9FE
    surface: PALETTE.neutral.light.lightest, // #FFFFFF
    surfaceMuted: PALETTE.neutral.light.borderSubtle, // #E8E9F1
    surfaceHighlight: PALETTE.highlight.tint20, // #EAF2FF

    // Borders & Dividers
    border: PALETTE.neutral.light.borderSubtle, // #E8E9F1
    borderMedium: PALETTE.neutral.light.border, // #D4D6DD
    borderFocus: PALETTE.highlight.primary, // #006FFD

    // Typography
    textPrimary: PALETTE.neutral.dark.darkest, // #1F2024
    textSecondary: PALETTE.neutral.dark.textSecondary, // #71727A
    textMuted: PALETTE.neutral.dark.muted, // #8F9098
    textInverse: PALETTE.neutral.light.lightest, // #FFFFFF

    // Primary Brand & Actions
    primary: PALETTE.highlight.primary, // #006FFD
    primaryHover: PALETTE.highlight.tint80, // #2897FF
    primarySoft: PALETTE.highlight.tint20, // #EAF2FF
    primaryText: PALETTE.neutral.light.lightest, // #FFFFFF

    // Feedback & Badges
    success: PALETTE.support.success.dark, // #298267
    successSoft: PALETTE.support.success.light, // #E7F4E8
    successAccent: PALETTE.support.success.medium, // #3AC0A0

    warning: PALETTE.support.warning.dark, // #E86339
    warningSoft: PALETTE.support.warning.light, // #FFF4E4
    warningAccent: PALETTE.support.warning.medium, // #FFB37C

    error: PALETTE.support.error.dark, // #ED3241
    errorSoft: PALETTE.support.error.light, // #FFE2E5
    errorAccent: PALETTE.support.error.medium, // #FF616D
  },
  dark: {
    // Backgrounds & Surfaces
    background: PALETTE.neutral.dark.darkest, // #1F2024
    surface: PALETTE.neutral.dark.surface, // #2F3036
    surfaceMuted: PALETTE.neutral.dark.textMuted, // #494A50
    surfaceHighlight: '#102A4C',

    // Borders & Dividers
    border: PALETTE.neutral.dark.textMuted, // #494A50
    borderMedium: PALETTE.neutral.dark.textSecondary, // #71727A
    borderFocus: PALETTE.highlight.tint80, // #2897FF

    // Typography
    textPrimary: PALETTE.neutral.light.lightest, // #FFFFFF
    textSecondary: PALETTE.neutral.light.muted, // #C5C6CC
    textMuted: PALETTE.neutral.dark.muted, // #8F9098
    textInverse: PALETTE.neutral.dark.darkest, // #1F2024

    // Primary Brand & Actions
    primary: PALETTE.highlight.tint80, // #2897FF
    primaryHover: PALETTE.highlight.primary, // #006FFD
    primarySoft: '#183661',
    primaryText: PALETTE.neutral.light.lightest, // #FFFFFF

    // Feedback & Badges
    success: PALETTE.support.success.medium, // #3AC0A0
    successSoft: '#13352A',
    successAccent: PALETTE.support.success.dark, // #298267

    warning: PALETTE.support.warning.medium, // #FFB37C
    warningSoft: '#422415',
    warningAccent: PALETTE.support.warning.dark, // #E86339

    error: PALETTE.support.error.medium, // #FF616D
    errorSoft: '#42161A',
    errorAccent: PALETTE.support.error.dark, // #ED3241
  },
} as const;

export const Typography = {
  fontFamily: Platform.select({
    web: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,

  // Heading
  h1: { fontSize: 24, fontWeight: '800' as const, lineHeight: 32 },
  h2: { fontSize: 18, fontWeight: '800' as const, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '800' as const, lineHeight: 24 },
  h4: { fontSize: 14, fontWeight: '700' as const, lineHeight: 20 },
  h5: { fontSize: 12, fontWeight: '700' as const, lineHeight: 18 },

  // Body
  bodyXL: { fontSize: 18, fontWeight: '400' as const, lineHeight: 26 },
  bodyL: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyM: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyS: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  bodyXS: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14 },

  // Action (Buttons, Interactive Links)
  actionL: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  actionM: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  actionS: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14 },

  // Caption
  captionM: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export default PALETTE;
