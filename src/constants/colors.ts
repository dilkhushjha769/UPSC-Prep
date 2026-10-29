import { Platform } from 'react-native';
import { DARK_TOKENS, LIGHT_TOKENS, SemanticTokens } from './designTokens';

/**
 * Design System Color Palette & Typography
 * Extracted from the Design System Style Guide.
 */

// ============================================================================
// 1. RAW COLOR PALETTE
// ============================================================================

export const PALETTE = {
  // Legacy key name kept for import compatibility: this is the burnt-orange accent scale.
  highlight: {
    primary: LIGHT_TOKENS.accent,
    tint80: DARK_TOKENS.accent,
    tint60: '#E8A25E',
    tint40: '#F2C9A3',
    tint20: LIGHT_TOKENS.accentSoft,
  },

  neutral: {
    light: {
      lightest: LIGHT_TOKENS.surface,
      surface: LIGHT_TOKENS.background,
      borderSubtle: LIGHT_TOKENS.border,
      border: LIGHT_TOKENS.borderStrong,
      muted: LIGHT_TOKENS.muted,
    },
    dark: {
      darkest: DARK_TOKENS.background,
      surface: DARK_TOKENS.surface,
      textMuted: DARK_TOKENS.border,
      textSecondary: LIGHT_TOKENS.mutedForeground,
      muted: LIGHT_TOKENS.subtleForeground,
    },
  },

  support: {
    success: { dark: LIGHT_TOKENS.success, medium: DARK_TOKENS.success, light: LIGHT_TOKENS.successSoft },
    warning: { dark: LIGHT_TOKENS.warning, medium: DARK_TOKENS.warning, light: LIGHT_TOKENS.warningSoft },
    error: { dark: LIGHT_TOKENS.destructive, medium: DARK_TOKENS.destructive, light: LIGHT_TOKENS.destructiveSoft },
  },
} as const;

export const GLOBAL_PRIMARY_BLUE = LIGHT_TOKENS.accent; // legacy name: now the accent colour
export const TOGGLE_ACTIVE_COLOR = LIGHT_TOKENS.accent;

// ============================================================================
// 2. SEMANTIC THEME (LIGHT & DARK MODES) — derived from designTokens.ts
// ============================================================================

const semantic = (t: SemanticTokens) => ({
  background: t.background,
  surface: t.surface,
  surfaceMuted: t.muted,
  surfaceHighlight: t.accentSoft,

  border: t.border,
  borderMedium: t.borderStrong,
  borderFocus: t.accent,

  textPrimary: t.foreground,
  textSecondary: t.mutedForeground,
  textMuted: t.subtleForeground,
  textInverse: t.primaryForeground,

  primary: t.primary,
  primaryHover: t.primaryHover,
  primarySoft: t.accentSoft,
  primaryText: t.primaryForeground,

  accent: t.accent,
  accentHover: t.accentHover,

  success: t.success,
  successSoft: t.successSoft,
  successAccent: t.success,

  warning: t.warning,
  warningSoft: t.warningSoft,
  warningAccent: t.warning,

  error: t.destructive,
  errorSoft: t.destructiveSoft,
  errorAccent: t.destructive,
});

export const SemanticColors = {
  light: semantic(LIGHT_TOKENS),
  dark: semantic(DARK_TOKENS),
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
