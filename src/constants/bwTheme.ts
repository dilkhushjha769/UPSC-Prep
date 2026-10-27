/**
 * BW_THEME - Centralized Theme Tokens aligned with the Figma Design System:
 * - Primary Blue: #006FFD
 * - Secondary Blue: #2897FF, Light Blue: #6FBAFF, Soft Blue: #B4DBFF, Tint: #EAF2FF
 * - Neutrals (Light): #FFFFFF, #F8F9FE, #E8E9F1, #D4D6DD, #8F9098, #71727A, #494A50, #1F2024
 * - Neutrals (Dark): #1F2024, #2F3036, #494A50, #71727A, #8F9098, #C5C6CC, #FFFFFF
 */

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

export const BW_THEME: { dark: BWTheme; light: BWTheme } = {
  dark: {
    bg: '#1F2024',
    sidebarBg: 'rgba(31, 32, 36, 0.96)',
    cardBg: '#2F3036',
    cardBorder: '#494A50',
    cardBorderHover: '#71727A',
    cardBorderActive: '#006FFD',
    surfaceMuted: '#26272C',
    borderSubtle: '#494A50',
    textPrimary: '#FFFFFF',
    textSecondary: '#C5C6CC',
    textMuted: '#8F9098',
    activeBg: '#183661',
    buttonPrimaryBg: '#006FFD',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: '#243247',
    buttonSecondaryBorder: '#385885',
    buttonSecondaryText: '#6FBAFF',
    accentDot: '#006FFD',
    divider: '#494A50',
    flameGlow: 'rgba(0, 111, 253, 0.16)',
    flameBorder: 'rgba(0, 111, 253, 0.35)',
  },
  light: {
    bg: '#F8F9FE',
    sidebarBg: 'rgba(255, 255, 255, 0.96)',
    cardBg: '#FFFFFF',
    cardBorder: '#E8E9F1',
    cardBorderHover: '#D4D6DD',
    cardBorderActive: '#006FFD',
    surfaceMuted: '#F8F9FE',
    borderSubtle: '#E8E9F1',
    textPrimary: '#1F2024',
    textSecondary: '#494A50',
    textMuted: '#71727A',
    activeBg: '#EAF2FF',
    buttonPrimaryBg: '#006FFD',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondaryBg: '#EAF2FF',
    buttonSecondaryBorder: '#B4DBFF',
    buttonSecondaryText: '#006FFD',
    accentDot: '#006FFD',
    divider: '#E8E9F1',
    flameGlow: 'rgba(0, 111, 253, 0.1)',
    flameBorder: 'rgba(0, 111, 253, 0.25)',
  },
};

export default BW_THEME;
