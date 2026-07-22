// The React Native renderer: the same z-sorted grayscale dot field the
// web `paint()` draws to a 2D canvas, drawn instead onto a Skia canvas.
// Both share `sortByDepth` + `dotShade` from the engine core, so the two
// platforms render the identical depth language and can never drift.
//
// `paintDots` is a worklet — it runs on the UI thread inside the Reanimated
// `useDerivedValue` that records the frame's Picture (see ThinkingOrb).

import type { SkCanvas, SkPaint } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';
import { type Dot, dotShade, sortByDepth } from '../engine/core';

/**
 * Paint a dot field onto a Skia canvas. Geometry arrives in base-preset
 * space (64 or 20); `scale` blows it up to the on-screen size while
 * preserving the tuned dot/orb proportions — the design is scaled, not
 * re-tuned. Mirrors `paint()` in `engine/core` line for line. Runs on the
 * UI thread, so the `paint` object is reused across dots (caller owns it).
 */
export function paintDots(
  canvas: SkCanvas,
  dots: Dot[],
  dark: boolean,
  paint: SkPaint,
  rMin: number,
  scale: number
): void {
  'worklet';
  sortByDepth(dots);
  canvas.save();
  canvas.scale(scale, scale);
  for (const d of dots) {
    const { g, alpha } = dotShade(d, dark);
    if (alpha < 0.02) continue;
    paint.setColor(Skia.Color(`rgb(${g},${g},${g})`));
    paint.setAlphaf(alpha);
    canvas.drawCircle(d.x, d.y, Math.max(rMin, d.r), paint);
  }
  canvas.restore();
}
