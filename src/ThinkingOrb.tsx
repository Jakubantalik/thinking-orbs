// The ThinkingOrb component. One shared clock (performance.now) keeps
// every mounted orb in phase; each instance runs its own rAF loop but
// pauses automatically while offscreen (IntersectionObserver) or when
// the tab is hidden (visibilitychange). Reduced-motion users get a
// static representative frame that still follows the live theme.

import { useEffect, useRef } from 'react';
import { MODE_DRAWS } from './engine/registry';
import { resolvePreset } from './presets';
import { useReducedMotion, useResolvedDark } from './theme';
import type { ThinkingOrbProps } from './types';

const LABELS: Record<string, string> = {
  working: 'Working…',
  searching: 'Searching…',
  solving: 'Solving…',
  listening: 'Listening…',
  connecting: 'Connecting…',
  weaving: 'Weaving…',
  composing: 'Composing…',
  breathing: 'Thinking…',
  shaping: 'Shaping…'
};

export function ThinkingOrb({
  state = 'working',
  size = 64,
  renderSize,
  theme = 'auto',
  speed = 1,
  paused = false,
  style,
  'aria-label': ariaLabel,
  ...rest
}: ThinkingOrbProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const dark = useResolvedDark(theme, ref);
  const reduced = useReducedMotion();
  // `size` selects the tuned profile; `renderSize` controls the actual canvas.
  const outputSize = renderSize != null && Number.isFinite(renderSize) && renderSize > 0 ? renderSize : size;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
    canvas.width = Math.round(outputSize * dpr);
    canvas.height = Math.round(outputSize * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { mode, speed: baseSpeed, opts } = resolvePreset(state, size);
    const draw = MODE_DRAWS[mode];
    const effSpeed = baseSpeed * speed;

    const frame = (tSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, outputSize, outputSize);
      draw(ctx, outputSize, tSec, dark, opts);
    };

    // reduced motion → one static, deterministic frame
    if (reduced) {
      frame(0.6);
      return;
    }

    let raf = 0;
    let running = false;
    const loop = () => {
      frame((performance.now() / 1000) * effSpeed);
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || paused) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // draw at least one frame even when paused/offscreen
    frame((performance.now() / 1000) * effSpeed);

    // pause offscreen + on hidden tabs — free when not visible
    let visible = true;
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && document.visibilityState !== 'hidden') start();
            else stop();
          })
        : null;
    io?.observe(canvas);
    const onVis = () => {
      if (document.visibilityState === 'hidden') stop();
      else if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);
    if (!io) start();

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state, size, outputSize, dark, speed, paused, reduced]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={ariaLabel ?? LABELS[state]}
      style={{ width: outputSize, height: outputSize, display: 'block', ...style }}
      {...rest}
    />
  );
}
