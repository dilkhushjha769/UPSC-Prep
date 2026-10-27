import React, { createContext, useContext, useMemo } from 'react';
import { BW_THEME } from './bwTheme';

export const getPrelimsTheme = (isDark: boolean = true) => {
  const bw = isDark ? BW_THEME.dark : BW_THEME.light;

  return {
    isDark,
    colors: {
      bgCanvas: bw.bg,
      bgGradientTop: bw.bg,
      bgSurface: bw.cardBg,
      bgSurfaceMuted: isDark ? '#26272C' : '#F8F9FE',
      borderSubtle: bw.borderSubtle,
      borderCard: bw.cardBorder,

      // Primary Accents (Figma Primary Blue)
      primary: '#006FFD',
      primaryLight: isDark ? '#6FBAFF' : '#2897FF',
      primarySoft: isDark ? '#183661' : '#EAF2FF',
      primarySoftBorder: isDark ? '#385885' : '#B4DBFF',

      // Buttons
      darkButton: '#006FFD',
      darkButtonText: '#FFFFFF',

      // Badges & Pills
      badgeBg: isDark ? '#183661' : '#EAF2FF',
      badgeText: isDark ? '#6FBAFF' : '#006FFD',
      badgeBorder: isDark ? '#385885' : '#B4DBFF',

      // Text
      textPrimary: bw.textPrimary,
      textSecondary: bw.textSecondary,
      textMuted: bw.textMuted,
      textWhite: '#FFFFFF',

      // Status
      correct: isDark ? '#3AC0A0' : '#298267',
      incorrect: isDark ? '#FF616D' : '#ED3241',
      warning: isDark ? '#FFB37C' : '#E86339',
    },
    shadows: {
      card: isDark ? {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 2,
      } : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
      },
      cardHover: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
      floating: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.45 : 0.12,
        shadowRadius: 16,
        elevation: 6,
      },
    },
    radius: {
      small: 6,
      medium: 10,
      large: 14,
      card: 14,
      sheet: 24,
      pill: 9999,
    },
  };
};

export type PrelimsThemeType = ReturnType<typeof getPrelimsTheme>;

// Default dark theme instance for backward compatibility
export const PrelimsTheme = getPrelimsTheme(true);

const PrelimsThemeContext = createContext<PrelimsThemeType>(PrelimsTheme);

export function PrelimsThemeProvider({
  isDark = true,
  children,
}: {
  isDark?: boolean;
  children: React.ReactNode;
}) {
  const theme = useMemo(() => getPrelimsTheme(isDark), [isDark]);
  return React.createElement(PrelimsThemeContext.Provider, { value: theme }, children);
}

export function usePrelimsTheme(): PrelimsThemeType {
  return useContext(PrelimsThemeContext);
}
