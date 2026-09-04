import { MODE_FRAMES } from '../engine/registry';
import type { Dot, Line } from '../engine/types';
import { resolvePreset } from '../presets';
import type { OrbState } from '../types';

const SOURCE_SIZE = 64;
const BRAILLE_BASE = 0x2800;
const BRAILLE_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80]
] as const;
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
] as const;

export interface TuiRenderOptions {
  /** Terminal-cell width. @default 16 */
  columns?: number;
  /** Terminal-cell height. @default 8 */
  rows?: number;
  /** Elapsed animation time in seconds. @default 0 */
  time?: number;
  /** Multiplier on the state's tuned animation speed. @default 1 */
  speed?: number;
  /** Terminal substrate used to mirror the engine's ink values. @default 'dark' */
  theme?: 'dark' | 'light';
  /** Minimum subpixel energy before ordered dithering. @default 0.18 */
  threshold?: number;
  /** Optional terminal color/style hook. It must preserve the glyph's display width. */
  paint?: (glyph: string, intensity: number) => string;
}

/** A terminal frame plus per-cell intensity for renderers that manage color separately. */
export interface TuiOrbFrame {
  lines: string[];
  intensities: number[][];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function composite(buffer: Float32Array, index: number, intensity: number): void {
  const source = clamp01(intensity);
  buffer[index] = 1 - (1 - buffer[index]) * (1 - source);
}

function ink(white: number, alpha: number, dark: boolean): number {
  return (dark ? 1 - clamp01(white) : clamp01(white)) * clamp01(alpha);
}

function rasterDot(
  buffer: Float32Array,
  width: number,
  height: number,
  dot: Dot,
  scale: number,
  offsetX: number,
  offsetY: number,
  dark: boolean
): void {
  const cx = dot.x * scale + offsetX;
  const cy = dot.y * scale + offsetY;
  const radius = Math.max(0.55, dot.r * scale);
  const energy = ink(dot.white, dot.a ?? 1, dark);
  const left = Math.max(0, Math.floor(cx - radius - 0.5));
  const right = Math.min(width - 1, Math.ceil(cx + radius + 0.5));
  const top = Math.max(0, Math.floor(cy - radius - 0.5));
  const bottom = Math.min(height - 1, Math.ceil(cy + radius + 0.5));

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const coverage = clamp01(radius + 0.7 - distance);
      if (coverage > 0) composite(buffer, y * width + x, energy * coverage);
    }
  }
}

function rasterLine(
  buffer: Float32Array,
  width: number,
  height: number,
  line: Line,
  scale: number,
  offsetX: number,
  offsetY: number,
  dark: boolean
): void {
  const x1 = line.x1 * scale + offsetX;
  const y1 = line.y1 * scale + offsetY;
  const x2 = line.x2 * scale + offsetX;
  const y2 = line.y2 * scale + offsetY;
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.5));
  const energy = ink(line.white, line.a ?? 1, dark);

  for (let step = 0; step <= steps; step++) {
    const f = step / steps;
    const x = Math.round(x1 + (x2 - x1) * f);
    const y = Math.round(y1 + (y2 - y1) * f);
    if (x >= 0 && x < width && y >= 0 && y < height) composite(buffer, y * width + x, energy);
  }
}

/**
 * Project the package's exact particle geometry onto Unicode Braille cells.
 * No React, DOM, canvas, ANSI library, or terminal framework is required.
 */
export function renderTuiOrb(state: OrbState, options: TuiRenderOptions = {}): TuiOrbFrame {
  const columns = Math.max(4, Math.floor(options.columns ?? 16));
  const rows = Math.max(2, Math.floor(options.rows ?? 8));
  const pixelWidth = columns * 2;
  const pixelHeight = rows * 4;
  const scale = Math.min((pixelWidth - 1) / SOURCE_SIZE, (pixelHeight - 1) / SOURCE_SIZE);
  const offsetX = (pixelWidth - SOURCE_SIZE * scale) / 2;
  const offsetY = (pixelHeight - SOURCE_SIZE * scale) / 2;
  const dark = (options.theme ?? 'dark') === 'dark';
  const threshold = clamp01(options.threshold ?? 0.18);
  const paint = options.paint ?? ((glyph: string) => glyph);
  const preset = resolvePreset(state, SOURCE_SIZE);
  const time = Math.max(0, options.time ?? 0) * preset.speed * Math.max(0, options.speed ?? 1);
  const frame = MODE_FRAMES[preset.mode](SOURCE_SIZE, time, preset.opts);
  const buffer = new Float32Array(pixelWidth * pixelHeight);

  for (const line of frame.lines) rasterLine(buffer, pixelWidth, pixelHeight, line, scale, offsetX, offsetY, dark);
  for (const dot of frame.dots) rasterDot(buffer, pixelWidth, pixelHeight, dot, scale, offsetX, offsetY, dark);

  const lines: string[] = [];
  const intensities: number[][] = [];
  for (let cellY = 0; cellY < rows; cellY++) {
    let line = '';
    const rowIntensities: number[] = [];
    for (let cellX = 0; cellX < columns; cellX++) {
      let bits = 0;
      let peak = 0;
      let sum = 0;
      for (let subY = 0; subY < 4; subY++) {
        for (let subX = 0; subX < 2; subX++) {
          const x = cellX * 2 + subX;
          const y = cellY * 4 + subY;
          const value = buffer[y * pixelWidth + x];
          peak = Math.max(peak, value);
          sum += value;
          const dither = (BAYER_4[y % 4][x % 4] / 15 - 0.5) * 0.16;
          if (value >= threshold + dither) bits |= BRAILLE_BITS[subY][subX];
        }
      }
      const intensity = clamp01(peak * 0.72 + (sum / 8) * 0.28);
      rowIntensities.push(intensity);
      const glyph = bits === 0 ? ' ' : String.fromCodePoint(BRAILLE_BASE + bits);
      line += paint(glyph, intensity);
    }
    lines.push(line);
    intensities.push(rowIntensities);
  }

  return { lines, intensities };
}
