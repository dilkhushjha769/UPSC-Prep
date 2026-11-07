import { DARK_TOKENS, LIGHT_TOKENS, SemanticTokens } from './designTokens';

/** Legacy UPSC_THEME shape, now derived from the editorial design tokens. */
const build = (t: SemanticTokens, isDark: boolean) => ({
  bg: t.background,
  cardBg: t.surface,
  cardBorder: t.border,
  cardBorderSubtle: t.border,
  textPrimary: t.foreground,
  textSecondary: t.mutedForeground,
  textMuted: t.subtleForeground,
  primary: t.accent, // #FF9500 (Vibrant warm orange for primary actions)
  primaryLight: t.accentHover,
  primarySoft: t.accentSoft,
  primarySurface: t.accentSoft,
  accent: t.accent, // #FF9500 (Vibrant warm orange for accents)
  accentPink: t.destructive,
  accentAmber: t.warning,
  accentEmerald: t.success,
  accentSky: t.infoForeground,
  badgeBg: t.accentSoft,
  badgeText: t.accent,
  divider: t.border,
  shadow: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(28, 36, 51, 0.06)',
});

export const UPSC_THEME = {
  light: build(LIGHT_TOKENS, false),
  dark: build(DARK_TOKENS, true),
};

type SubjectTone = { bg: string; text: string; border: string };

const ORANGE: SubjectTone = { bg: '#FFF7ED', text: '#C25E00', border: '#FED7AA' };
const GREEN: SubjectTone = { bg: '#E3F1E8', text: '#1D5C3D', border: '#BFDECB' };
const BLUE: SubjectTone = { bg: '#E9EDF9', text: '#34508F', border: '#CBD3EB' };
const NEUTRAL: SubjectTone = { bg: '#F0EDE6', text: '#3F4A5E', border: '#EAE5DC' };

/** Subject badges use only the three soft semantic tones plus neutral. */
export const SUBJECT_COLORS: Record<string, SubjectTone> = {
  Polity: BLUE,
  'Modern History': ORANGE,
  'Ancient & Medieval': ORANGE,
  Geography: GREEN,
  Economy: GREEN,
  'Environment & Ecology': GREEN,
  'Science & Technology': BLUE,
  'Current Affairs': BLUE,
  CSAT: NEUTRAL,
  'Ethics (GS 4)': NEUTRAL,
  Essay: ORANGE,
  'Optional Subject': NEUTRAL,
};
