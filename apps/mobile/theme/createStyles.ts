import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';

export const createStyles = <T extends StyleSheet.NamedStyles<T>>(
  fn: (theme: ReturnType<typeof useTheme>) => T
) => {
  return () => {
    const theme = useTheme();
    return StyleSheet.create(fn(theme));
  };
};
