// Morph: a dotted outline cycling circle → triangle → square → circle —
// the "shaping" state. Each shape is a continuous closed path
// parameterised by arc length (top-centre start, clockwise). Every
// frame the engine blends the two neighbouring paths, then lays the
// dots EVENLY along the blended outline — spacing stays uniform at
// every instant of the morph, holds and transitions alike. Plain
// circle fills only: no canvas/SVG filters, fully cross-browser.
//
// Shapes are expressed as plain vertex data + pure sampler functions
// (rather than closures) so the whole path math is worklet-serialisable
// and runs on the React Native UI thread. The `'worklet'` directives are
// inert string literals in the web build.

import type { Dot, ModeGeometry } from './types';

function smoothE(x: number): number {
  'worklet';
  return x * x * (3 - 2 * x);
}

// Shape vertices (plain data). The triangle is 3 verts; the square is a
// 5-vertex walk so its path STARTS at top-centre like the other shapes.
const TRIANGLE: ReadonlyArray<readonly [number, number]> = [
  [0.0, -0.26],
  [0.24, 0.16],
  [-0.24, 0.16]
];
const SQUARE: ReadonlyArray<readonly [number, number]> = [
  [0, -0.2],
  [0.2, -0.2],
  [0.2, 0.2],
  [-0.2, 0.2],
  [-0.2, -0.2]
];

/** Sample a closed polygon's perimeter at arc-length fraction `f`. */
function polySample(verts: ReadonlyArray<readonly [number, number]>, f: number): [number, number] {
  'worklet';
  const V = verts.length;
  const L: number[] = [];
  let total = 0;
  for (let i = 0; i < V; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % V];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    L.push(l);
    total += l;
  }
  let target = f * total;
  let i = 0;
  while (target > L[i] && i < V - 1) {
    target -= L[i];
    i++;
  }
  const a = verts[i];
  const b = verts[(i + 1) % V];
  const ff = L[i] ? Math.min(1, target / L[i]) : 0;
  return [a[0] + (b[0] - a[0]) * ff, a[1] + (b[1] - a[1]) * ff];
}

// The 3-shape cycle: 0 = circle, 1 = triangle, 2 = square.
const CYCLE_LEN = 3;

/** Point on shape `k` at arc-length fraction `f`. */
function shapePoint(k: number, f: number): [number, number] {
  'worklet';
  if (k === 0) {
    const a = -Math.PI / 2 + f * 2 * Math.PI;
    return [Math.cos(a) * 0.24, Math.sin(a) * 0.24];
  }
  return polySample(k === 1 ? TRIANGLE : SQUARE, f);
}

// low floor keeps sparse outlines possible while never degenerating
function morphN(d: number): number {
  'worklet';
  return Math.max(6, Math.round(34 * d));
}

const HOLD = 1.4;
const MORPH = 0.9;
const SEG = HOLD + MORPH;

export const drawMorph: ModeGeometry = (size, t, o) => {
  'worklet';
  const K = CYCLE_LEN;
  const tc = t % (SEG * K);
  const k = Math.floor(tc / SEG);
  const local = tc - k * SEG;
  const m = local > HOLD ? smoothE((local - HOLD) / MORPH) : 0;
  const sprd = o.spread ?? 1;

  // blend the two shape PATHS at m, then measure the blended outline
  const kA = k;
  const kB = (k + 1) % K;
  const M = 160;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < M; i++) {
    const f = i / M;
    const a = shapePoint(kA, f);
    const b = shapePoint(kB, f);
    pts.push([(a[0] + (b[0] - a[0]) * m) * sprd, (a[1] + (b[1] - a[1]) * m) * sprd]);
  }
  const L: number[] = [];
  let total = 0;
  for (let i = 0; i < M; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % M];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    L.push(l);
    total += l;
  }

  // dot radius depends ONLY on rDot (the size knob); the count sets the
  // gaps. Formed shapes breathe a little (uniform pulse).
  const n = morphN(o.iconD ?? 1);
  const re = (o.rDot ?? 0.021) * 1.35 * sprd;
  const pulse = 1 + 0.02 * Math.sin(local * 3.1);

  const dots: Dot[] = [];
  const c2 = size / 2;
  let seg = 0;
  let acc = 0;
  for (let k2 = 0; k2 < n; k2++) {
    const target = (k2 / n) * total;
    while (acc + L[seg] < target && seg < M - 1) {
      acc += L[seg];
      seg++;
    }
    const a = pts[seg];
    const b = pts[(seg + 1) % M];
    const f = L[seg] ? Math.min(1, (target - acc) / L[seg]) : 0;
    const x = (a[0] + (b[0] - a[0]) * f) * pulse;
    const y = (a[1] + (b[1] - a[1]) * f) * pulse;
    dots.push({
      x: c2 + x * size,
      y: c2 + y * size,
      z: 0,
      r: Math.max(0.35, re * size),
      white: 0.1
    });
  }
  return dots;
};
