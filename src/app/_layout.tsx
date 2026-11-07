import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { StudyProvider } from '@/context/StudyContext';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAF9F6',
    card: '#FFFFFF',
    text: '#1E293B',
    border: '#EAE5DC',
    primary: '#FF9500',
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B1018',
    card: '#141C28',
    text: '#F1F5F9',
    border: '#253244',
    primary: '#FF9500',
  },
};

function RootContent() {
  const { isDark } = useAppTheme();
  const theme = isDark ? customDarkTheme : customLightTheme;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StudyProvider>
        <AnimatedSplashOverlay />
        <Slot />
      </StudyProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootContent />
    </AppThemeProvider>
  );
}
