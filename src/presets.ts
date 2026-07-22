// The shipped tunings: six states × two sizes, baked from the inkform
// mini-page tuning session. `count`/`size` are multipliers over the base
// fine profiles; `speed` multiplies the shared clock. Resolved once per
// (state, size) pair and cached — the render loop sees plain numbers.

import type { ModeOpts } from './engine/profiles';
import { BASE_PROFILES, scaleCounts, scaleRadii } from './engine/profiles';
import type { OrbSize, OrbState } from './types';

export type ModeKey =
  | 'orbits'
  | 'globe'
  | 'rubik'
  | 'wave'
  | 'ribbon'
  | 'morph'
  | 'cosmic'
  | 'nebula'
  | 'liquid'
  | 'nova';

export const STATE_TO_MODE: Record<OrbState, ModeKey> = {
  working: 'orbits',
  searching: 'globe',
  solving: 'rubik',
  listening: 'wave',
  composing: 'ribbon',
  shaping: 'morph',
  cosmic: 'cosmic',
  nebula: 'nebula',
  liquid: 'liquid',
  nova: 'nova'
};

interface Preset {
  speed: number;
  count: number;
  size: number;
  /** Extra mode opts merged verbatim after scaling. */
  extra?: ModeOpts;
}

const PRESETS: Record<ModeKey, Record<OrbSize, Preset>> = {
  orbits: {
    64: { speed: 1.885, count: 1, size: 1 },
    20: { speed: 3.9, count: 0.238, size: 2.4 }
  },
  globe: {
    64: { speed: 2.015, count: 0.42, size: 1.15, extra: { scanMul: 4.08, dimBase: 0.45 } },
    20: { speed: 2.665, count: 0.105, size: 1.75, extra: { scanMul: 4.335, dimBase: 0.45 } }
  },
  rubik: {
    64: { speed: 1.82, count: 0.35, size: 1.05 },
    20: { speed: 1.95, count: 0.088, size: 1.9 }
  },
  wave: {
    64: { speed: 4.388, count: 0.341, size: 1 },
    20: { speed: 3.998, count: 0.105, size: 1.6 }
  },
  ribbon: {
    64: { speed: 2.34, count: 0.25, size: 0.85, extra: { spin: 0, bandMul: 3.9, wobMul: 1 } },
    20: { speed: 3.12, count: 0.051, size: 1.073, extra: { spin: 0, bandMul: 4.94, wobMul: 1 } }
  },
  morph: {
    64: { speed: 2.405, count: 0.54, size: 0.395, extra: { spread: 1.45 } },
    20: { speed: 2.08, count: 0.53, size: 1.011, extra: { spread: 1.45 } }
  },
  // Cosmic modes: count scales starN via COUNT_KEYS; size is unused for
  // radii (gradients dominate), so keep size=1 and push star density /
  // glow via extras per size.
  cosmic: {
    64: { speed: 1.4, count: 1, size: 1, extra: { lobes: 2, glowMul: 1, spin: 0.2 } },
    20: { speed: 1.65, count: 0.45, size: 1, extra: { lobes: 2, glowMul: 0.95, spin: 0.25, shell: 0.9 } }
  },
  nebula: {
    64: { speed: 1.15, count: 1, size: 1, extra: { lobes: 3, pulse: 0.1, glowMul: 1.05 } },
    20: { speed: 1.35, count: 0.4, size: 1, extra: { lobes: 2, pulse: 0.08, glowMul: 1, shell: 0.9 } }
  },
  liquid: {
    64: {
      speed: 1.25,
      count: 1,
      size: 1,
      extra: { lobes: 2, wobAmp: 0.09, twinkle: 0.5, spin: 0.18 }
    },
    20: {
      speed: 1.5,
      count: 0.42,
      size: 1,
      extra: { lobes: 2, wobAmp: 0.07, twinkle: 0.4, spin: 0.22, shell: 0.9 }
    }
  },
  nova: {
    64: { speed: 1.55, count: 1, size: 1, extra: { lobes: 2, pulse: 0.14, glowMul: 1.15, spin: 0.28 } },
    20: {
      speed: 1.8,
      count: 0.42,
      size: 1,
      extra: { lobes: 2, pulse: 0.12, glowMul: 1.05, spin: 0.32, shell: 0.9 }
    }
  }
};

export interface Resolved {
  mode: ModeKey;
  speed: number;
  opts: ModeOpts;
}

const cache = new Map<string, Resolved>();

/** Resolve a (state, size) pair to its mode + fully-scaled draw options. */
export function resolvePreset(state: OrbState, size: OrbSize): Resolved {
  const key = `${state}-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const mode = STATE_TO_MODE[state];
  const preset = PRESETS[mode][size];
  let opts: ModeOpts = { ...BASE_PROFILES[mode] };
  if (preset.count !== 1) opts = scaleCounts(opts, preset.count);
  if (preset.size !== 1) opts = scaleRadii(opts, preset.size);
  if (preset.extra) opts = { ...opts, ...preset.extra };

  const resolved: Resolved = { mode, speed: preset.speed, opts };
  cache.set(key, resolved);
  return resolved;
}
