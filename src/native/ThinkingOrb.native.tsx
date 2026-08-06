// The React Native ThinkingOrb: the same painters as the DOM component,
// recorded into an SkPicture each frame. One shared clock
// (performance.now) keeps every mounted orb in phase; the loop pauses
// while the app is backgrounded (AppState). Reduced-motion users get a
// static representative frame that still follows the live theme.

import { Canvas, Picture, createPicture } from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, useColorScheme } from 'react-native';
import { MODE_DRAWS } from '../engine/registry';
import { LABELS } from '../labels';
import { resolvePreset } from '../presets';
import { SkiaOrbCanvas } from './skiaCanvas';
import type { ThinkingOrbNativeProps } from './types';

// Provided by Hermes / JSC at runtime; react-native's type globals don't
// declare it, and this module compiles without the DOM lib.
declare const performance: { now(): number };

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  style,
  accessibilityLabel,
  ...rest
}: ThinkingOrbNativeProps) {
  const scheme = useColorScheme();
  // Same default as the web resolver: dark unless the host says light.
  const dark = theme === 'auto' ? scheme !== 'light' : theme === 'dark';
  const reduced = useReducedMotion();
  const [picture, setPicture] = useState<SkPicture | null>(null);

  useEffect(() => {
    const { mode, speed: baseSpeed, opts } = resolvePreset(state, size);
    const draw = MODE_DRAWS[mode];
    const effSpeed = baseSpeed * speed;
    const surface = new SkiaOrbCanvas();
    const bounds = { x: 0, y: 0, width: size, height: size };

    // The Canvas is laid out in dp and Skia backs it at native density,
    // so drawing in dp here matches the web component's CSS-px space —
    // no DPR transform needed. Replaced pictures are left to the GC:
    // the on-screen <Picture> may still hold the previous frame when the
    // next one is recorded, so eager dispose() could free it mid-draw.
    const frame = (tSec: number) => {
      setPicture(
        createPicture((canvas) => {
          surface.begin(canvas);
          draw(surface, size, tSec, dark, opts);
        }, bounds)
      );
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

    // draw at least one frame even when paused/backgrounded
    frame((performance.now() / 1000) * effSpeed);

    // Pause while backgrounded — the AppState analogue of the DOM
    // component's visibilitychange handling. RN has no
    // IntersectionObserver, so offscreen orbs keep animating; pass
    // `paused` for orbs scrolled out of view.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') start();
      else stop();
    });
    if (AppState.currentState === 'active') start();

    return () => {
      stop();
      sub.remove();
    };
  }, [state, size, dark, speed, paused, reduced]);

  return (
    <Canvas
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? LABELS[state]}
      {...rest}
    >
      {picture ? <Picture picture={picture} /> : null}
    </Canvas>
  );
}

export type { ThinkingOrbNativeProps } from './types';
export type { OrbState, OrbSize, OrbTheme } from '../types';

// Power-user surface, mirroring the root entry.
export { resolvePreset, STATE_TO_MODE, type ModeKey, type Resolved } from '../presets';
export { MODE_DRAWS } from '../engine/registry';
export type { OrbCanvas2D } from '../engine/core';
