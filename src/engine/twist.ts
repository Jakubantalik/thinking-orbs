// Twist: the body is wrung about its axis — the "cleaning" state. Every
// dot swings around the vertical, but its phase lags the further down the
// sphere it sits: the crown sets off first, the waist follows, the base
// trails, and then the whole thing unwinds back along exactly the same
// path. That is the agitator stroke of a washing machine — a dwell at each
// reversal, a whip through the middle — and the lag is what turns a plain
// spin into visible torsion.

import type { Dot, ModeDraw } from './types';
import { frac, makeProj, paint, radiusScale } from './core';

/**
 * Phase warp: parks the phase at each extreme for `d` of a cycle, then
 * redistributes the travel over what is left. Flattening a sine only ever
 * eases the turn — the body is still moving — so the hold has to be an
 * explicit stop. `rate` is set against this so the travel keeps its speed
 * and the dwell is added to the cycle rather than stolen from the stroke.
 */
function dwellWarp(q: number, d: number): number {
  const a = 0.25 - d / 2; // run-up to the near extreme
  if (q < a) return (q / a) * 0.25;
  if (q < a + d) return 0.25;
  const b = a + 0.5; // the far extreme, after the long traverse
  if (q < b) return 0.25 + ((q - a - d) / (0.5 - d)) * 0.5;
  if (q < b + d) return 0.75;
  return 0.75 + ((q - b - d) / a) * 0.25;
}

/**
 * The agitator stroke, in [-1, 1]. A sine flattened at its peaks so the
 * body decelerates into each reversal, held dead still there, then whipped
 * back through the middle. Pure and unbounded in `p`, so lagged phases can
 * be sampled off the ends.
 */
function stroke(p: number, dwell: number): number {
  const s = Math.sin(dwellWarp(frac(p), dwell) * 2 * Math.PI);
  const m = Math.abs(s) ** 0.75;
  return s < 0 ? -m : m;
}

export const drawTwist: ModeDraw = (ctx, size, t, dark, o) => {
  const cx = size / 2;
  const cy = size / 2;
  const R = (size / 2) * 0.82;
  // only a crawl of yaw: a real spin would swallow the lag that IS the
  // mode, but a dead-still frame during the dwell reads as a stall
  const pt = makeProj(t * (o.drift ?? 0.07), o.tilt ?? 0.34, cx, cy, R);
  const rs = radiusScale(size, o.rsPow ?? 0.6);

  const amp = o.amp ?? 1.2;
  const rate = o.rate ?? 0.149;
  const lag = o.lag ?? 0.17;
  // clamped: at 0.5 the two holds would eat the whole cycle and there'd be
  // no travel left to warp into
  const dwell = Math.min(0.4, Math.max(0, o.dwell ?? 0.01937));
  // u runs 0 at the base to 1 at the crown; the crown leads the base by
  // `lag` of a stroke, every ring in between strung along the gradient
  const turnAt = (u: number) => amp * stroke(t * rate - lag * (1 - u), dwell);
  // reference shear for normalising: the twist across a 0.14 slice of the
  // body at mid-stroke, where the wring is hardest
  const shearRef = amp * (o.shearRef ?? 0.24);

  const dots: Dot[] = [];
  const latRings = o.latRings ?? 16;
  const lonDensity = o.lonDensity ?? 42;
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const u = (sinLat + 1) / 2;
    const turn = turnAt(u);
    // how hard this ring is wringing against the body below it — peaks as
    // the stroke whips through centre, falls to nothing at the reversals
    const shear = Math.min(1, Math.abs(turn - turnAt(u - 0.14)) / shearRef);
    const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * 2 * Math.PI + turn;
      const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon));
      const depth = (z + 1) / 2;
      // the rings under load ink a touch heavier — the scrub
      dots.push({
        x: px,
        y: py,
        z,
        r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (o.rShear ?? 0.32) * shear) * rs,
        white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth - (o.inkShear ?? 0.1) * shear
      });
    }
  }
  paint(ctx, dots, dark, o.rMin);
};
