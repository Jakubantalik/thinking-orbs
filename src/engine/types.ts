// Engine-level contracts shared by every mode implementation.

import type { OrbCanvas2D } from './core';
import type { ModeOpts } from './profiles';

export type { Dot, Line, OrbCanvas2D } from './core';

/** One frame painter: draws a mode into a 2D context at CSS-px `size`. */
export type ModeDraw = (
  ctx: OrbCanvas2D,
  size: number,
  t: number,
  dark: boolean,
  opts: ModeOpts
) => void;
