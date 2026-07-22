// Theme + reduced-motion resolution for React Native — the native
// counterpart of the web `theme.ts`. `auto` follows the OS color scheme;
// reduced-motion users get a single static frame (resolved by the
// component), matching the web behavior.

import { useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import type { OrbTheme } from '../types';

/** Resolve the effective dark/light substrate. Defaults to dark when the
 *  OS scheme is unknown — the same pre-mount fallback as the web. */
export function useResolvedDark(theme: OrbTheme): boolean {
  const scheme = useColorScheme();
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return scheme !== 'light';
}

/** Live `prefers-reduced-motion` equivalent via AccessibilityInfo. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
