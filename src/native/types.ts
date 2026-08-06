// Prop surface shared by both `thinking-orbs/native` entries — the Skia
// component on iOS/Android and the DOM-canvas fallback on web. The
// react-native import is type-only, so it erases from the web bundle.

import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { OrbSize, OrbState, OrbTheme } from '../types';

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
