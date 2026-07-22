// Shared primitives for the dotted 3D thought-orbs. Ported from inkform
// (PlotterLab's HalftoneSphere lineage): honestly 3D — rotated,
// depth-shaded, z-sorted. Depth is carried by dot size and ink weight
// alone. Plain 2D canvas fills only: no ctx.filter, no SVG filters, so
// every mode renders identically in Chrome, Safari and Firefox.

export interface Dot {
  x: number;
  y: number;
  z: number;
  r: number;
  /** Ink value: 0 = darkest ink on paper. Mirrored on dark themes. */
  white: number;
  a?: number;
}

export type Projector = (x: number, y: number, z: number) => [number, number, number];

// Every geometry primitive carries the `'worklet'` directive so the same
// pure math runs both on the web main thread AND on the React Native UI
// thread (inside a Reanimated worklet driving a Skia Picture). The
// directive is an inert string literal in any non-Reanimated build (web),
// so it changes nothing there.

/** Deterministic hash in [0, 1). */
export function hashD(a: number, b: number): number {
  'worklet';
  const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

/** Stable directions on a unit sphere (Fibonacci lattice). */
export function fibDir(i: number, n: number): [number, number, number] {
  'worklet';
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (2 * (i + 0.5)) / n;
  const rad = Math.sqrt(1 - y * y);
  const a = i * golden;
  return [rad * Math.cos(a), y, rad * Math.sin(a)];
}

/** Shortest signed angular distance, wrapped to (-π, π]. */
export function angleDelta(a: number, b: number): number {
  'worklet';
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

/** Shared spin + tilt + orthographic projection. */
export function makeProj(yaw: number, tilt: number, cx: number, cy: number, scale: number): Projector {
  'worklet';
  const st = Math.sin(tilt);
  const ct = Math.cos(tilt);
  const sy = Math.sin(yaw);
  const cyw = Math.cos(yaw);
  return (x, y, z) => {
    'worklet';
    const x1 = x * cyw + z * sy;
    const z1 = -x * sy + z * cyw;
    const y1 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    return [cx + x1 * scale, cy - y1 * scale, z2];
  };
}

/** Far→near z-sort, in place. Returns the same array for chaining. */
export function sortByDepth(dots: Dot[]): Dot[] {
  'worklet';
  dots.sort((a, b) => a.z - b.z);
  return dots;
}

/**
 * Resolve a dot to its rendered grayscale + alpha on a given substrate.
 * On dark substrates the ink value is mirrored (1 - white) so near dots
 * read bright — the same depth language on an inverted substrate.
 * `g` is an 8-bit gray channel (0–255); `alpha` is the dot's opacity.
 * Shared by every renderer (2D canvas, Skia) so platforms cannot drift.
 */
export function dotShade(d: Dot, dark: boolean): { g: number; alpha: number } {
  'worklet';
  const alpha = d.a ?? 1;
  const w = Math.min(1, Math.max(0, d.white));
  const g = Math.round((dark ? 1 - w : w) * 255);
  return { g, alpha };
}

/**
 * Painter: z-sort far→near, matte grayscale dots. On dark substrates the
 * ink value is mirrored (1 - white) so near dots read bright — the same
 * depth language on an inverted substrate.
 */
export function paint(ctx: CanvasRenderingContext2D, dots: Dot[], dark: boolean, rMin = 0.3): void {
  sortByDepth(dots);
  for (const d of dots) {
    const { g, alpha } = dotShade(d, dark);
    if (alpha < 0.02) continue;
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, Math.max(rMin, d.r), 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Dot radii were tuned for a 300pt frame; sub-linear scaling keeps small
 * spinners legible. Lower pow = radii shrink less with size.
 */
export function radiusScale(size: number, pow: number): number {
  'worklet';
  return (size / 300) ** pow;
}
