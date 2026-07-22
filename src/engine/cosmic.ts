// Cosmic modes: fluid glass orbs with nebula cores, starfields, and
// prismatic rims. Canvas 2D only — radial gradients, clipped paths,
// and z-sorted star dots. No WebGL, no ctx.filter, no SVG filters.
// Tuned for 64px and 20px presets; dark/light substrates adapt alpha
// and gradient stops so the same palette stays readable either way.

import type { ModeDraw } from './types';
import { fibDir, hashD, makeProj, radiusScale } from './core';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Palette {
  core: Rgba;
  mid: Rgba;
  outer: Rgba;
  rim: Rgba;
  star: Rgba;
  specular: Rgba;
  prism: ReadonlyArray<Rgba>;
}

function rgba(r: number, g: number, b: number, a: number): Rgba {
  return { r, g, b, a };
}

function css(c: Rgba, aMul = 1): string {
  const a = Math.max(0, Math.min(1, c.a * aMul));
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;
}

/** Theme-aware alpha scale: brighter on dark, denser on light. */
function themeMul(dark: boolean): { glow: number; star: number; rim: number } {
  return dark
    ? { glow: 1, star: 1, rim: 1 }
    : { glow: 0.72, star: 0.85, rim: 0.9 };
}

const PALETTES: Record<'cosmic' | 'nebula' | 'liquid' | 'nova', Palette> = {
  cosmic: {
    core: rgba(255, 230, 255, 0.95),
    mid: rgba(160, 60, 220, 0.7),
    outer: rgba(40, 10, 80, 0.55),
    rim: rgba(220, 200, 255, 0.55),
    star: rgba(255, 255, 255, 0.95),
    specular: rgba(255, 255, 255, 0.55),
    prism: [rgba(255, 80, 120, 0.35), rgba(80, 220, 160, 0.3), rgba(100, 140, 255, 0.35)]
  },
  nebula: {
    core: rgba(255, 180, 240, 0.9),
    mid: rgba(140, 40, 200, 0.65),
    outer: rgba(30, 8, 60, 0.5),
    rim: rgba(200, 160, 255, 0.5),
    star: rgba(240, 230, 255, 0.9),
    specular: rgba(255, 255, 255, 0.45),
    prism: [rgba(255, 100, 180, 0.3), rgba(120, 80, 255, 0.28), rgba(80, 200, 255, 0.28)]
  },
  liquid: {
    core: rgba(255, 220, 170, 0.55),
    mid: rgba(120, 90, 50, 0.4),
    outer: rgba(20, 18, 12, 0.55),
    rim: rgba(220, 200, 180, 0.45),
    star: rgba(255, 250, 240, 0.9),
    specular: rgba(255, 255, 255, 0.5),
    prism: [rgba(255, 90, 70, 0.4), rgba(255, 200, 60, 0.35), rgba(80, 200, 120, 0.3), rgba(70, 140, 255, 0.35)]
  },
  nova: {
    core: rgba(255, 245, 200, 0.95),
    mid: rgba(220, 140, 40, 0.7),
    outer: rgba(60, 25, 8, 0.55),
    rim: rgba(255, 220, 160, 0.55),
    star: rgba(255, 250, 230, 0.95),
    specular: rgba(255, 255, 255, 0.55),
    prism: [rgba(255, 80, 40, 0.4), rgba(255, 200, 40, 0.35), rgba(80, 220, 120, 0.28), rgba(80, 140, 255, 0.32)]
  }
};

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  a: number;
  hueShift: number;
}

function buildStars(
  n: number,
  t: number,
  cx: number,
  cy: number,
  scale: number,
  yaw: number,
  tilt: number,
  twinkle: number
): Star[] {
  const pt = makeProj(yaw, tilt, cx, cy, scale);
  const stars: Star[] = [];
  for (let i = 0; i < n; i++) {
    const d = fibDir(i, n);
    // keep stars inside ~0.92 of the shell so they read as interior
    const rad = 0.35 + 0.55 * hashD(i, 3.1);
    const [px, py, z] = pt(d[0] * rad, d[1] * rad, d[2] * rad);
    const depth = (z + 1) / 2;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + hashD(i, 9.2) * 2.4) + i);
    stars.push({
      x: px,
      y: py,
      z,
      r: (0.35 + 1.1 * depth) * (0.7 + 0.5 * hashD(i, 1.4)),
      a: (0.25 + 0.75 * depth) * (1 - twinkle + twinkle * tw),
      hueShift: hashD(i, 7.7)
    });
  }
  stars.sort((a, b) => a.z - b.z);
  return stars;
}

function paintStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  pal: Palette,
  starMul: number,
  rs: number,
  chromatic = false
): void {
  for (const s of stars) {
    const a = s.a * starMul;
    if (a < 0.03) continue;
    if (chromatic && s.hueShift > 0.82) {
      const pr = pal.prism[Math.floor(s.hueShift * pal.prism.length) % pal.prism.length];
      ctx.fillStyle = css(pr, a * 1.1);
    } else {
      ctx.fillStyle = css(pal.star, a);
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, Math.max(0.25, s.r * rs), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Soft radial nebula blob at (ox, oy). */
function paintGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  ox: number,
  oy: number,
  radius: number,
  pal: Palette,
  glowMul: number
): void {
  const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, radius);
  g.addColorStop(0, css(pal.core, glowMul));
  g.addColorStop(0.35, css(pal.mid, glowMul * 0.85));
  g.addColorStop(0.75, css(pal.outer, glowMul * 0.55));
  g.addColorStop(1, css(pal.outer, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
}

/** Glass rim + soft specular + optional prism fringe along the edge. */
function paintShell(
  ctx: CanvasRenderingContext2D,
  path: Path2D | null,
  cx: number,
  cy: number,
  R: number,
  t: number,
  pal: Palette,
  rimMul: number,
  prism: boolean
): void {
  ctx.save();
  if (path) {
    ctx.clip(path);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
  }

  // inner falloff so the rim reads as a glass volume
  const edge = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(0.7, 'rgba(0,0,0,0)');
  edge.addColorStop(1, css(pal.rim, 0.35 * rimMul));
  ctx.fillStyle = edge;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // specular highlight (upper-right, slowly drifting)
  const hx = cx + R * (0.28 + 0.06 * Math.sin(t * 0.4));
  const hy = cy - R * (0.32 + 0.05 * Math.cos(t * 0.35));
  const sg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.45);
  sg.addColorStop(0, css(pal.specular, rimMul));
  sg.addColorStop(0.4, css(pal.specular, 0.25 * rimMul));
  sg.addColorStop(1, css(pal.specular, 0));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(hx, hy, R * 0.38, R * 0.22, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // outer stroke rim
  ctx.strokeStyle = css(pal.rim, 0.55 * rimMul);
  ctx.lineWidth = Math.max(0.6, R * 0.035);
  if (path) {
    ctx.stroke(path);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (!prism) return;

  // chromatic fringe arcs — cheap substitute for refraction
  const n = pal.prism.length;
  for (let i = 0; i < n; i++) {
    const a0 = t * 0.15 + (i / n) * Math.PI * 2;
    const a1 = a0 + 0.55;
    ctx.strokeStyle = css(pal.prism[i], 0.7 * rimMul);
    ctx.lineWidth = Math.max(0.5, R * 0.028);
    ctx.beginPath();
    ctx.arc(cx, cy, R * (0.98 - i * 0.008), a0, a1);
    ctx.stroke();
  }
}

/** Polar harmonic blob path for the liquid mode. */
function liquidPath(cx: number, cy: number, R: number, t: number, amp: number): Path2D {
  const path = new Path2D();
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const wob =
      amp *
      (0.55 * Math.sin(2 * theta + t * 1.1) +
        0.3 * Math.cos(3 * theta - t * 0.85) +
        0.15 * Math.sin(5 * theta + t * 0.4));
    const rr = R * (1 + wob);
    const x = cx + Math.cos(theta) * rr;
    const y = cy + Math.sin(theta) * rr;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function clipCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
}

function drawCosmicFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  dark: boolean,
  mode: 'cosmic' | 'nebula' | 'liquid' | 'nova',
  o: Record<string, number | undefined>
): void {
  const cx = size / 2;
  const cy = size / 2;
  const baseR = (size / 2) * (o.shell ?? 0.88);
  const pal = PALETTES[mode];
  const tm = themeMul(dark);
  const rs = radiusScale(size, o.rsPow ?? 0.55);
  const starN = Math.max(8, Math.round(o.starN ?? 48));
  const twinkle = o.twinkle ?? 0.45;
  const glowMul = (o.glowMul ?? 1) * tm.glow;
  const starMul = (o.starMul ?? 1) * tm.star;
  const rimMul = (o.rimMul ?? 1) * tm.rim;

  const isLiquid = mode === 'liquid';
  const amp = (o.wobAmp ?? 0.08) * (isLiquid ? 1 : 0);
  const path = isLiquid ? liquidPath(cx, cy, baseR, t, amp) : null;
  // Cover the full wobble extent. liquidPath peaks at baseR*(1+amp)
  // (harmonics sum ≤1); a smaller fill left transparent bulges.
  const R = isLiquid ? baseR * (1 + amp) : baseR;

  // dark substrate wash inside the shell (reads as void depth)
  ctx.save();
  if (path) ctx.clip(path);
  else clipCircle(ctx, cx, cy, R);

  const voidA = dark ? 0.55 : 0.18;
  const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  vg.addColorStop(0, dark ? `rgba(8,4,18,${voidA})` : `rgba(30,20,40,${voidA * 0.6})`);
  vg.addColorStop(1, dark ? `rgba(0,0,0,${voidA * 1.1})` : `rgba(20,15,30,${voidA})`);
  ctx.fillStyle = vg;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // orbiting nebula lobes
  const lobes = Math.max(1, Math.round(o.lobes ?? (mode === 'nebula' ? 3 : 2)));
  for (let i = 0; i < lobes; i++) {
    const phase = t * (0.35 + i * 0.12) + (i / lobes) * Math.PI * 2;
    const ox = Math.cos(phase) * R * (0.18 + 0.08 * i);
    const oy = Math.sin(phase * 0.9 + i) * R * (0.14 + 0.06 * i);
    const rad = R * (0.55 + 0.2 * Math.sin(t * 0.5 + i) + (mode === 'nova' ? 0.12 : 0));
    paintGlow(ctx, cx, cy, R, ox, oy, rad, pal, glowMul * (1 - i * 0.12));
  }

  // central pulse (stronger for nova / nebula)
  const pulse = 1 + (o.pulse ?? 0.08) * Math.sin(t * (mode === 'nova' ? 2.2 : 1.1));
  paintGlow(ctx, cx, cy, R, 0, 0, R * 0.42 * pulse, pal, glowMul * 1.15);

  // starfield
  const yaw = t * (o.spin ?? 0.22);
  const tilt = 0.35 + 0.08 * Math.sin(t * 0.3);
  const stars = buildStars(starN, t, cx, cy, R, yaw, tilt, twinkle);
  paintStars(ctx, stars, pal, starMul, rs, mode === 'liquid' || mode === 'nova');

  ctx.restore();

  // Use the same R so rim gradients cover liquid bulges; stroke still
  // follows `path` when present.
  paintShell(ctx, path, cx, cy, R, t, pal, rimMul, mode !== 'nebula');
}

export const drawCosmic: ModeDraw = (ctx, size, t, dark, o) => {
  drawCosmicFrame(ctx, size, t, dark, 'cosmic', o);
};

export const drawNebula: ModeDraw = (ctx, size, t, dark, o) => {
  drawCosmicFrame(ctx, size, t, dark, 'nebula', o);
};

export const drawLiquid: ModeDraw = (ctx, size, t, dark, o) => {
  drawCosmicFrame(ctx, size, t, dark, 'liquid', o);
};

export const drawNova: ModeDraw = (ctx, size, t, dark, o) => {
  drawCosmicFrame(ctx, size, t, dark, 'nova', o);
};
