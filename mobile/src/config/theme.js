import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { COLORS } from './constants';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    error: COLORS.error,
  },
  roundness: 12,
};
