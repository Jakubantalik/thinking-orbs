// Mode key → frame painter. Kept separate from the presets so tree
// shaking can in principle drop unused modes in custom builds.

import type { ModeKey } from '../presets';
import type { ModeDraw } from './types';
import { drawBraid } from './braid';
import { drawGlobe, drawRubik, drawWave } from './lattice';
import { drawMorph } from './morph';
import { drawOrbits } from './orbits';
import { drawRibbon } from './ribbon';
import { drawTwist } from './twist';
import { drawWeb } from './web';

export const MODE_DRAWS: Record<ModeKey, ModeDraw> = {
  orbits: drawOrbits,
  globe: drawGlobe,
  rubik: drawRubik,
  wave: drawWave,
  twist: drawTwist,
  web: drawWeb,
  braid: drawBraid,
  ribbon: drawRibbon,
  // ring shares ribbon's painter — the `faceOn` profile flag switches it
  ring: drawRibbon,
  morph: drawMorph
};
