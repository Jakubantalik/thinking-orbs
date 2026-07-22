// Engine-level contracts shared by every mode implementation.

import type { Dot } from './core';
import type { ModeOpts } from './profiles';

export type { Dot } from './core';

/**
 * One frame of geometry: the pure, platform-agnostic heart of a mode.
 * Given a logical frame `size`, a time `t` (seconds) and resolved draw
 * `opts`, it returns the depth-carrying dot field for that instant. No
 * rendering context, no theme — depth shading and z-sorting happen in the
 * renderer (`paint` for 2D canvas, the Skia renderer for React Native).
 */
export type ModeGeometry = (size: number, t: number, opts: ModeOpts) => Dot[];

/**
 * One frame painter: draws a mode into a 2D context at CSS-px `size`.
 * Retained as the public power-user surface; internally these are thin
 * wrappers over {@link ModeGeometry} + `paint`.
 */
export type ModeDraw = (
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  dark: boolean,
  opts: ModeOpts
) => void;
