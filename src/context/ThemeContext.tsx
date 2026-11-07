import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_TOKENS, SemanticTokens, getTokens } from '@/constants/designTokens';
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
      // Ignore localStorage errors (e.g. private browsing)
    }
  }
  return 'light';
}

function syncWebDOM(mode: ThemeMode) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    if (document.body) {
      document.body.style.backgroundColor = mode === 'dark' ? '#0B1018' : '#FAF9F6';
      document.body.style.color = mode === 'dark' ? '#F1F5F9' : '#1E293B';
    }
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialTheme);

  // Sync DOM immediately on mount and when themeMode changes
  useEffect(() => {
    syncWebDOM(themeMode);
  }, [themeMode]);

  // Load persisted theme on native and web fallback
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && (stored === 'dark' || stored === 'light')) {
          setThemeModeState(stored);
        }
      } catch {
        // Fallback silently
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    syncWebDOM(mode);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
    } catch {
      // Ignore
    }
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      syncWebDOM(next);
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
        }
      } catch {
        // Ignore
      }
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
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

