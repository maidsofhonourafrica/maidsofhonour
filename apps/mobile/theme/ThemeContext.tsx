import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';

const fonts = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
};

const lightTheme = {
  text: '#000',
  background: '#fff',
  tint: '#CF2680',
  tabIconDefault: '#ccc',
  tabIconSelected: '#CF2680',
  primary: '#CF2680',
  secondary: '#FFE4DD',
  dark: '#15192e',
  muted: '#94a3b8',
  border: '#e2e8f0',
  card: '#ffffff',
  destructive: '#ef4444',
  fonts,
};

const darkTheme = {
  text: '#fff',
  background: '#0f172a',
  tint: '#fff',
  tabIconDefault: '#ccc',
  tabIconSelected: '#fff',
  primary: '#CF2680',
  secondary: '#1e293b',
  dark: '#fff',
  muted: '#94a3b8',
  border: '#1e293b',
  card: '#1e293b',
  destructive: '#ef4444',
  fonts,
};

type Theme = typeof lightTheme;

const ThemeContext = createContext<Theme>(lightTheme);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const scheme = useColorScheme() ?? Appearance.getColorScheme() ?? 'light';

  const theme = useMemo(() => (scheme === 'dark' ? darkTheme : lightTheme), [scheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
