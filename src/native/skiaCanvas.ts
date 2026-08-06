// Skia adapter for the engine's OrbCanvas2D surface. The painters follow
// a strict one-shape-per-path protocol (beginPath → arc → fill for dots,
// beginPath → moveTo → lineTo → stroke for edges — see engine/core.ts),
// so a single buffered circle and segment are enough.

import { PaintStyle, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, SkColor, SkPaint } from '@shopify/react-native-skia';
import type { OrbCanvas2D } from '../engine/types';

// The engine only ever writes `rgba(r,g,b,a)` (see paint / paintLines).
const RGBA_RE = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/;

export class SkiaOrbCanvas implements OrbCanvas2D {
  fillStyle: string | object = 'rgba(0,0,0,1)';
  strokeStyle: string | object = 'rgba(0,0,0,1)';
  lineWidth = 1;

  private canvas: SkCanvas | null = null;
  private readonly fillPaint: SkPaint;
  private readonly strokePaint: SkPaint;
  // Keyed on packed rgb — alpha is a continuous float, so caching on the
  // whole rgba string would grow without bound. Grayscale ink means at
  // most 256 entries in practice.
  private readonly colorCache = new Map<number, SkColor>();
  private circleX = 0;
  private circleY = 0;
  private circleR = 0;
  private lineX1 = 0;
  private lineY1 = 0;
  private lineX2 = 0;
  private lineY2 = 0;

  constructor() {
    this.fillPaint = Skia.Paint();
    this.fillPaint.setAntiAlias(true);
    this.fillPaint.setStyle(PaintStyle.Fill);
    this.strokePaint = Skia.Paint();
    this.strokePaint.setAntiAlias(true);
    this.strokePaint.setStyle(PaintStyle.Stroke);
  }

  /** Rebind to the canvas recording the current frame. */
  begin(canvas: SkCanvas): void {
    this.canvas = canvas;
  }

  beginPath(): void {
    // No-op: arc / moveTo overwrite the single-shape buffer.
  }

  arc(x: number, y: number, radius: number): void {
    this.circleX = x;
    this.circleY = y;
    this.circleR = radius;
  }

  fill(): void {
    this.applyColor(this.fillPaint, this.fillStyle);
    this.canvas?.drawCircle(this.circleX, this.circleY, this.circleR, this.fillPaint);
  }

  moveTo(x: number, y: number): void {
    this.lineX1 = x;
    this.lineY1 = y;
  }

  lineTo(x: number, y: number): void {
    this.lineX2 = x;
    this.lineY2 = y;
  }

  stroke(): void {
    this.strokePaint.setStrokeWidth(this.lineWidth);
    this.applyColor(this.strokePaint, this.strokeStyle);
    this.canvas?.drawLine(this.lineX1, this.lineY1, this.lineX2, this.lineY2, this.strokePaint);
  }

  private applyColor(paint: SkPaint, style: string | object): void {
    const m = typeof style === 'string' ? RGBA_RE.exec(style) : null;
    if (!m) {
      // Not the engine's rgba() form — hand it to Skia's parser directly.
      paint.setColor(Skia.Color(String(style)));
      return;
    }
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    const key = (r << 16) | (g << 8) | b;
    let color = this.colorCache.get(key);
    if (!color) {
      color = Skia.Color(`rgb(${r},${g},${b})`);
      this.colorCache.set(key, color);
    }
    paint.setColor(color);
    // setColor resets the paint's alpha to the color's (opaque) alpha;
    // setAlphaf then replaces it with the dot's own.
    paint.setAlphaf(Number(m[4]));
  }
}
