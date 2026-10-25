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
      bgSurfaceMuted: isDark ? '#1C2337' : '#EEF3FD',
      borderSubtle: isDark ? '#232D44' : 'rgba(215, 226, 248, 0.9)',
      borderCard: isDark ? '#232D44' : 'rgba(215, 226, 248, 0.9)',

      // Primary Accents (High Contrast Monochromatic)
      primary: bw.textPrimary,
      primaryLight: isDark ? '#E2E8F0' : '#334155',
      primarySoft: isDark ? '#1C2337' : '#EEF3FD',
      primarySoftBorder: isDark ? '#2C3854' : '#CFDCF5',

      // Buttons (Inverted: Bright white CTA on dark background; Slate/Black on light background)
      darkButton: bw.buttonPrimaryBg,
      darkButtonText: bw.buttonPrimaryText,

      // Neutral Monochromatic Pills
      badgeBg: isDark ? '#1C2337' : '#EEF3FD',
      badgeText: bw.textPrimary,
      badgeBorder: isDark ? '#2C3854' : '#CFDCF5',

      // Text
      textPrimary: bw.textPrimary,
      textSecondary: bw.textSecondary,
      textMuted: bw.textMuted,
      textWhite: '#FFFFFF',

      // Status
      correct: isDark ? '#34D399' : '#059669',
      incorrect: isDark ? '#F87171' : '#DC2626',
      warning: '#F59E0B',
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
