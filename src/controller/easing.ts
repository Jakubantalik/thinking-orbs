import type { TransitionEasing } from './types';

const CSS_EASINGS: Record<Exclude<TransitionEasing, (t: number) => number>, readonly [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
};

function cubic(t: number, a: number, b: number): number {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
}

function bezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (cubic(mid, x1, x2) < x) lo = mid;
    else hi = mid;
  }
  return cubic((lo + hi) / 2, y1, y2);
}

export function resolveEasing(easing: TransitionEasing = 'ease-in-out'): (progress: number) => number {
  if (typeof easing === 'function') return easing;
  if (easing === 'linear') return (progress) => progress;
  const points = CSS_EASINGS[easing];
  return (progress) => bezier(points[0], points[1], points[2], points[3], progress);
}
