// Geometry parity: the Mitosis port drives the same framework-neutral
// `thinking-orbs/engine` geometry as the reference web component. The
// controller's reduced-motion "static frame" draws at t = 0.6, so we assert
// that resolving every (state, size) and evaluating the frame at 0.6 exactly
// reproduces the frozen golden vectors — proving the port can't drift from
// the shipping pixels.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODE_FRAMES, resolvePreset } from 'thinking-orbs/engine';
import { REDUCED_MOTION_T } from '../src/orb-controller';

const EPS = 1e-4;
const goldenPath = path.resolve(__dirname, '../../../spec/orbs-golden.json');

const STATES = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
] as const;
const SIZES = [64, 20] as const;

describe('reduced-motion static frame geometry parity', () => {
  const golden = JSON.parse(readFileSync(goldenPath, 'utf8'));
  const byKey = new Map<string, unknown>();
  for (const c of golden.cases) byKey.set(c.key, c);

  it('exposes the reduced-motion frame time used by the controller', () => {
    expect(REDUCED_MOTION_T).toBe(0.6);
    expect(golden.times).toContain(0.6);
  });

  for (const state of STATES) {
    for (const size of SIZES) {
      it(`state=${state} size=${size} matches golden at t=0.6`, () => {
        const case_ = byKey.get(`${state}-${size}-0.6`) as {
          mode: string;
          t: number;
          dotCount: number;
          lineCount: number;
          dots: number[];
          lines: number[];
        };
        expect(case_, `golden case ${state}-${size}-0.6 present`).toBeTruthy();

        const resolved = resolvePreset(state, size);
        const mode = MODE_FRAMES[resolved.mode as keyof typeof MODE_FRAMES];
        const frame = mode(size, case_.t, resolved.opts);

        expect(frame.dots.length).toBe(case_.dotCount);
        expect(frame.lines.length).toBe(case_.lineCount);

        for (let i = 0; i < case_.dots.length / 6; i++) {
          const d = frame.dots[i];
          const o = i * 6;
          expect(Math.abs(d.x - case_.dots[o])).toBeLessThanOrEqual(EPS);
          expect(Math.abs(d.y - case_.dots[o + 1])).toBeLessThanOrEqual(EPS);
          expect(Math.abs(d.z - case_.dots[o + 2])).toBeLessThanOrEqual(EPS);
          expect(Math.abs(d.r - case_.dots[o + 3])).toBeLessThanOrEqual(EPS);
          expect(Math.abs((d.white as number) - case_.dots[o + 4])).toBeLessThanOrEqual(EPS);
          expect(Math.abs((d.a ?? 1) - case_.dots[o + 5])).toBeLessThanOrEqual(EPS);
        }
      });
    }
  }
});
