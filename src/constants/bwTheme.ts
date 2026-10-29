/**
 * BW_THEME — component-level theme, derived from the editorial design tokens
 * (see designTokens.ts). Do not add raw hex values here.
 */
import { DARK_TOKENS, LIGHT_TOKENS, SemanticTokens } from './designTokens';

export type BWTheme = {
  bg: string;
  sidebarBg: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  cardBorderActive: string;
  surfaceMuted: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  activeBg: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryBorder: string;
  buttonSecondaryText: string;
  accentDot: string;
  divider: string;
  flameGlow: string;
  flameBorder: string;
};

const build = (t: SemanticTokens): BWTheme => ({
  bg: t.background,
  sidebarBg: t.surface,
  cardBg: t.surface,
  cardBorder: t.border,
  cardBorderHover: t.borderStrong,
  cardBorderActive: t.accent,
  surfaceMuted: t.muted,
  borderSubtle: t.border,
  textPrimary: t.foreground,
  textSecondary: t.mutedForeground,
  textMuted: t.subtleForeground,
  activeBg: t.accentSoft,
  buttonPrimaryBg: t.primary,
  buttonPrimaryText: t.primaryForeground,
  buttonSecondaryBg: t.surface,
  buttonSecondaryBorder: t.border,
  buttonSecondaryText: t.foreground,
  accentDot: t.accent,
  divider: t.border,
  // Kept for API compatibility; flat tints, never glows.
  flameGlow: t.accentSoft,
  flameBorder: t.border,
});

export const BW_THEME: { dark: BWTheme; light: BWTheme } = {
  dark: build(DARK_TOKENS),
  light: build(LIGHT_TOKENS),
};

export default BW_THEME;
