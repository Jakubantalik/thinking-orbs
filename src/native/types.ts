import type { ViewStyle } from 'react-native';
import type { OrbSize, OrbState, OrbTheme } from '../types';

export type { OrbSize, OrbState, OrbTheme } from '../types';

/**
 * Props for the React Native `ThinkingOrb`. Deliberately identical to the
 * web {@link import('../types').ThinkingOrbProps} — same prop names, same
 * types (`state`, `size`, `theme`, `speed`, `paused`), same defaults — so a
 * single component API spans both platforms. The only difference is `style`,
 * which is a React Native `ViewStyle` instead of the web's `CSSProperties`
 * (inherent to the platform).
 *
 * As on web, `size` selects one of the two tuned designs (64 / 20). To render
 * larger — e.g. an 80%-of-screen orb — give `style` a width/height; the Skia
 * renderer scales the tuned design up crisply to fill it.
 */
export interface ThinkingOrbProps {
  /** Which animation to show. @default 'working' */
  state?: OrbState;

  /** Tuned size preset — 64 (chat-avatar) or 20 (inline-text). @default 64 */
  size?: OrbSize;

  /** Theme mode; `auto` follows the OS color scheme. @default 'auto' */
  theme?: OrbTheme;

  /** Animation speed multiplier over the preset's baked speed. @default 1 */
  speed?: number;

  /** Freeze the animation on the current frame. @default false */
  paused?: boolean;

  /** Style for the Skia canvas. Give it a width/height to scale the orb up. */
  style?: ViewStyle;
}
