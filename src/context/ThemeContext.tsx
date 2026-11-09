import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTokens, LIGHT_TOKENS, SemanticTokens } from '@/constants/designTokens';
import { BW_THEME, BWTheme } from '@/constants/bwTheme';
import { SemanticColors } from '@/constants/colors';
import { getPrelimsTheme, PrelimsThemeType } from '@/constants/prelimsTheme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  tokens: SemanticTokens;
  bwTheme: BWTheme;
  colors: typeof SemanticColors.light;
  prelimsTheme: PrelimsThemeType;
}

const THEME_STORAGE_KEY = '@upsc_theme_mode';

const defaultContextValue: ThemeContextValue = {
  themeMode: 'light',
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
  tokens: LIGHT_TOKENS,
  bwTheme: BW_THEME.light,
  colors: SemanticColors.light,
  prelimsTheme: getPrelimsTheme(false),
};

const ThemeContext = createContext<ThemeContextValue>(defaultContextValue);

/**
 * Synchronously determine the initial theme mode on web to prevent flashing.
 */
function getInitialTheme(): ThemeMode {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // Ignore
    }
  }
  return 'light';
}

function syncWebDOM(mode: ThemeMode) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (document.body) {
        document.body.style.backgroundColor = '#0B1018';
        document.body.style.color = '#F0F4F8';
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (document.body) {
        document.body.style.backgroundColor = '#FAF9F6';
        document.body.style.color = '#1E293B';
      }
    }
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialTheme);

  // Load persisted theme on mount (for Native & Web)
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        const mode = stored === 'dark' || stored === 'light' ? stored : getInitialTheme();
        setThemeModeState(mode);
        syncWebDOM(mode);
      })
      .catch(() => {
        syncWebDOM(getInitialTheme());
      });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {}
    }
    syncWebDOM(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {}
      }
      syncWebDOM(next);
      return next;
    });
  }, []);

  const isDark = themeMode === 'dark';
  const tokens = useMemo(() => getTokens(isDark), [isDark]);
  const bwTheme = useMemo(() => (isDark ? BW_THEME.dark : BW_THEME.light), [isDark]);
  const colors = useMemo(() => (isDark ? SemanticColors.dark : SemanticColors.light), [isDark]);
  const prelimsTheme = useMemo(() => getPrelimsTheme(isDark), [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      isDark,
      toggleTheme,
      setThemeMode,
      tokens,
      bwTheme,
      colors,
      prelimsTheme,
    }),
    [themeMode, isDark, toggleTheme, setThemeMode, tokens, bwTheme, colors, prelimsTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? defaultContextValue;
}

