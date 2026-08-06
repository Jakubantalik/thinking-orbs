// Web entry for `thinking-orbs/native`: on react-native-web (or any web
// bundler) the subpath serves the existing DOM canvas renderer — no Skia,
// no WASM — and this wrapper maps the native prop surface onto it.
// Deliberately imports nothing from react-native at runtime so it also
// works in plain web bundlers.

import type { CSSProperties } from 'react';
import { ThinkingOrb as DomThinkingOrb } from '../ThinkingOrb';
import type { ThinkingOrbNativeProps } from './types';

// Flattens RN-style nested arrays into one plain object. react-native-web's
// StyleSheet.create returns plain objects, so no registry lookup is needed.
// RN-only style semantics beyond CSS-compatible camelCase properties are
// not translated — a fixed-size spinner needs none.
function flattenStyle(style: ThinkingOrbNativeProps['style'], out: Record<string, unknown> = {}): CSSProperties {
  if (Array.isArray(style)) {
    for (const s of style) flattenStyle(s as ThinkingOrbNativeProps['style'], out);
  } else if (style && typeof style === 'object') {
    Object.assign(out, style);
  }
  return out as CSSProperties;
}

export function ThinkingOrb({
  state,
  size,
  theme,
  speed,
  paused,
  style,
  accessibilityLabel,
  testID
}: ThinkingOrbNativeProps) {
  // Other rest props are RN view props with no DOM meaning; they are
  // intentionally dropped rather than spread onto the <canvas>.
  return (
    <DomThinkingOrb
      state={state}
      size={size}
      theme={theme}
      speed={speed}
      paused={paused}
      style={flattenStyle(style)}
      aria-label={accessibilityLabel}
      data-testid={testID}
    />
  );
}

export type { ThinkingOrbNativeProps } from './types';
export type { OrbState, OrbSize, OrbTheme } from '../types';

// Power-user surface, mirroring the root entry.
export { resolvePreset, STATE_TO_MODE, type ModeKey, type Resolved } from '../presets';
export { MODE_DRAWS } from '../engine/registry';
export type { OrbCanvas2D } from '../engine/core';
