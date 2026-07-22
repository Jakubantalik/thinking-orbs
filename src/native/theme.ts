// Theme resolution for React Native — the native counterpart of the web
// `theme.ts`. `auto` follows the OS color scheme. (Reduced-motion is read
// directly from Reanimated's `useReducedMotion` in the component.)

import { useColorScheme } from 'react-native';
import type { OrbTheme } from '../types';

/** Resolve the effective dark/light substrate. Defaults to dark when the
 *  OS scheme is unknown — the same pre-mount fallback as the web. */
export function useResolvedDark(theme: OrbTheme): boolean {
  const scheme = useColorScheme();
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return scheme !== 'light';
}
