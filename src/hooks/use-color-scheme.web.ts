import { useAppTheme } from '@/context/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const { themeMode } = useAppTheme();
  return themeMode;
}
