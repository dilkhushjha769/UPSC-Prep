import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { StudyProvider } from '@/context/StudyContext';

SplashScreen.preventAutoHideAsync();

const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: 'rgba(215, 226, 248, 0.9)',
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0A0D14',
    card: '#121622',
    border: '#1E2536',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customDarkTheme : customLightTheme;

  return (
    <ThemeProvider value={theme}>
      <StudyProvider>
        <AnimatedSplashOverlay />
        <Slot />
      </StudyProvider>
    </ThemeProvider>
  );
}

