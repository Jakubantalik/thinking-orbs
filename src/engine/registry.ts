// Mode key → geometry / frame painter. Kept separate from the presets so
// tree shaking can in principle drop unused modes in custom builds.
//
// `MODE_GEOMETRY` is the pure, platform-agnostic layer (returns a dot
// field); `MODE_DRAWS` is the 2D-canvas painter surface, reconstructed as
// thin wrappers over the geometry so the web renderer — and any existing
// power-user consumer of `MODE_DRAWS` — behaves exactly as before.

import type { ModeKey } from '../presets';
import { paint } from './core';
import type { ModeDraw, ModeGeometry } from './types';
import { drawGlobe, drawRubik, drawWave } from './lattice';
import { drawMorph } from './morph';
import { drawOrbits } from './orbits';
import { drawRibbon } from './ribbon';

export const MODE_GEOMETRY: Record<ModeKey, ModeGeometry> = {
  orbits: drawOrbits,
  globe: drawGlobe,
  rubik: drawRubik,
  wave: drawWave,
  ribbon: drawRibbon,
  morph: drawMorph
};

export const MODE_DRAWS: Record<ModeKey, ModeDraw> = Object.fromEntries(
  (Object.keys(MODE_GEOMETRY) as ModeKey[]).map((key) => [
    key,
    (ctx, size, t, dark, opts) => paint(ctx, MODE_GEOMETRY[key](size, t, opts), dark, opts.rMin)
  ])
) as Record<ModeKey, ModeDraw>;
