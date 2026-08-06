// Hand-maintained declarations for the `thinking-orbs/native` subpath —
// vite-plugin-dts's rollupTypes can't add a second entry without
// clobbering the root declarations, and the surface here is tiny. The
// build copies this file to dist/native/. Because `../index` resolves to
// src/index.ts here and to dist/index.d.ts when published, the regular
// typecheck keeps this file honest against the source.

import type { ReactElement } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { OrbSize, OrbState, OrbTheme } from '../index';

/** Props for the React Native ThinkingOrb component. */
export interface ThinkingOrbNativeProps extends Omit<ViewProps, 'style' | 'children'> {
  /** Which animation to show. @default 'working' */
  state?: OrbState;

  /** Tuned size preset — 64 or 20 dp. @default 64 */
  size?: OrbSize;

  /** Theme mode; `auto` follows the OS via `useColorScheme()`. @default 'auto' */
  theme?: OrbTheme;

  /**
   * Animation speed multiplier on top of the preset's baked speed.
   * @default 1
   */
  speed?: number;

  /** Freeze the animation on the current frame. @default false */
  paused?: boolean;

  style?: StyleProp<ViewStyle>;
}

export declare function ThinkingOrb(props: ThinkingOrbNativeProps): ReactElement;

export type { OrbState, OrbSize, OrbTheme, OrbCanvas2D, ModeKey, Resolved } from '../index';
export { resolvePreset, STATE_TO_MODE, MODE_DRAWS } from '../index';
