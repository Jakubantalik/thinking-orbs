// Mode key → frame painter. Kept separate from the presets so tree
// shaking can in principle drop unused modes in custom builds.

import type { ModeKey } from '../presets';
import type { ModeDraw } from './types';
import { drawCosmic, drawLiquid, drawNebula, drawNova } from './cosmic';
import { drawGlobe, drawRubik, drawWave } from './lattice';
import { drawMorph } from './morph';
import { drawOrbits } from './orbits';
import { drawRibbon } from './ribbon';

export const MODE_DRAWS: Record<ModeKey, ModeDraw> = {
  orbits: drawOrbits,
  globe: drawGlobe,
  rubik: drawRubik,
  wave: drawWave,
  ribbon: drawRibbon,
  morph: drawMorph,
  cosmic: drawCosmic,
  nebula: drawNebula,
  liquid: drawLiquid,
  nova: drawNova
};
