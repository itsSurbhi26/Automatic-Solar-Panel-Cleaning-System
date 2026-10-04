/**
 * useTheme hook – returns the current theme based on dark mode setting.
 */

import { darkTheme, lightTheme, Theme } from './index';
import { useSolarStore } from '../store/useSolarStore';

export function useTheme(): Theme {
  const darkMode = useSolarStore((s) => s.settings.darkMode);
  return darkMode ? darkTheme : lightTheme;
}
