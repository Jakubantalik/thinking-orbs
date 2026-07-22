// Engine-level contracts shared by every mode implementation.

import type { ModeOpts } from './profiles';

export type { Dot } from './core';

/** One frame painter: draws a mode into a 2D context at CSS-px `size`. */
export type ModeDraw = (
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  dark: boolean,
  opts: ModeOpts,
  /** Optional CSS tint. Existing five-argument calls keep the monochrome palette. */
  color?: string
) => void;
