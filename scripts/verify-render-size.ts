import { MODE_FRAMES } from '../src/engine/registry';
import { resolvePreset } from '../src/presets';
import type { OrbState } from '../src/types';

const states: OrbState[] = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping'
];

for (const presetSize of [64, 20] as const) {
  const renderSize = presetSize === 64 ? 320 : 160;
  for (const state of states) {
    const { mode, speed, opts } = resolvePreset(state, presetSize);
    const frame = MODE_FRAMES[mode](renderSize, 0.6 * speed, opts);
    if (frame.dots.length === 0) throw new Error(`${state}-${presetSize} rendered no dots`);
  }
}

console.log('RENDER SIZE PASS');
console.log('- all 9 states render at custom sizes for both tuned presets');
