export { ThinkingOrb } from './ThinkingOrb';

export type { ThinkingOrbProps, OrbState, OrbSize, OrbTheme } from './types';

// Power-user surface: the resolved presets + raw frame painters, for
// consumers driving their own canvas outside React.
export { resolvePreset, STATE_TO_MODE, type ModeKey, type Resolved } from './presets';
export { MODE_DRAWS, MODE_GEOMETRY } from './engine/registry';

// Platform-agnostic rendering primitives — the pure dot field plus the
// shared depth-sort and grayscale/alpha shading. These let a non-DOM
// renderer (e.g. React Native / Skia — see `thinking-orbs/native`)
// reproduce the exact look without a 2D canvas.
export { type Dot, dotShade, paint, sortByDepth } from './engine/core';
export type { ModeDraw, ModeGeometry } from './engine/types';
export type { ModeOpts } from './engine/profiles';
