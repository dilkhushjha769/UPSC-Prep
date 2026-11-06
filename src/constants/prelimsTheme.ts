import React, { createContext, useContext, useMemo } from 'react';
import { BW_THEME } from './bwTheme';
import { getTokens } from './designTokens';
import { useAppTheme } from '@/context/ThemeContext';

export const getPrelimsTheme = (isDark: boolean = false) => {
  const bw = isDark ? BW_THEME.dark : BW_THEME.light;
  const t = getTokens(isDark);

  return {
    isDark,
    tokens: t,
    colors: {
      bgCanvas: bw.bg,
      bgGradientTop: bw.bg,
      bgSurface: bw.cardBg,
      bgSurfaceMuted: t.muted,
      borderSubtle: bw.borderSubtle,
      borderCard: bw.cardBorder,

      // Primary action buttons (warm orange #F58235)
      primary: t.accent,
      primaryLight: t.accentHover,
      primarySoft: t.accentSoft,
      primarySoftBorder: t.borderStrong,

      // Accent (burnt orange #F58235) - used selectively for highlights & active filters
      accent: t.accent,
      accentSoft: t.accentSoft,

      // Buttons
      darkButton: t.accent,
      darkButtonText: '#FFFFFF',

      // Badges & pills
      badgeBg: t.accentSoft,
      badgeText: t.accent,
      badgeBorder: t.borderStrong,

      // Text
      textPrimary: bw.textPrimary,
      textSecondary: bw.textSecondary,
      textMuted: bw.textMuted,
      textWhite: '#FFFFFF',

      // Status
      correct: t.success,
      incorrect: t.destructive,
      warning: t.warning,
    },
    shadows: {
      card: {
        shadowColor: '#1C2433',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.25 : 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
      cardHover: {
        shadowColor: '#1C2433',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
      floating: {
        shadowColor: '#1C2433',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 16,
        elevation: 6,
      },
    },
    radius: {
      small: 8,
      medium: 10,
      large: 12,
      card: 16,
      sheet: 20,
      pill: 9999,
    },
  };
};

export type PrelimsThemeType = ReturnType<typeof getPrelimsTheme>;

// Default (light editorial) theme instance for backward compatibility
export const PrelimsTheme = getPrelimsTheme(false);

const PrelimsThemeContext = createContext<PrelimsThemeType | null>(null);

export function PrelimsThemeProvider({
  isDark: propIsDark,
  children,
}: {
  isDark?: boolean;
  children: React.ReactNode;
}) {
  const { isDark: appIsDark } = useAppTheme();
  const isDark = propIsDark !== undefined ? propIsDark : appIsDark;
  const theme = useMemo(() => getPrelimsTheme(isDark), [isDark]);
  return React.createElement(PrelimsThemeContext.Provider, { value: theme }, children);
}

export function usePrelimsTheme(): PrelimsThemeType {
  const context = useContext(PrelimsThemeContext);
  const { isDark: appIsDark } = useAppTheme();
  const fallback = useMemo(() => getPrelimsTheme(appIsDark), [appIsDark]);
  return context ?? fallback;
}

