// The React Native ThinkingOrb. Same public API as the web component
// (state / size / theme / speed / paused / style). Everything runs on the
// UI thread: a Reanimated `useClock` drives a `useDerivedValue` worklet
// that runs the engine geometry (the same pure math the web build uses —
// it carries the `'worklet'` directive) and records the frame into a Skia
// Picture. There is NO per-frame React render and NO JS-thread work — the
// picture flows straight to <Picture> as a shared value. Pause and
// reduced-motion simply stop the worklet from reading the clock.

import { Canvas, Picture, Skia, useClock } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { MODE_GEOMETRY } from '../engine/registry';
import { resolvePreset } from '../presets';
import { paintDots } from './renderer';
import { useReducedMotion, useResolvedDark } from './theme';
import type { ThinkingOrbProps } from './types';

// One recorder + paint, reused for every frame of every orb. Frames are
// recorded synchronously on the UI thread, so sharing is safe and there is
// no per-frame allocation of these objects.
const recorder = Skia.PictureRecorder();
const paint = Skia.Paint();
paint.setAntiAlias(true);

export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  style
}: ThinkingOrbProps) {
  const dark = useResolvedDark(theme);
  const reduced = useReducedMotion();

  const { mode, speed: baseSpeed, opts } = resolvePreset(state, size);
  const effSpeed = baseSpeed * speed;
  const geometry = MODE_GEOMETRY[mode];
  const rMin = opts.rMin ?? 0.3;

  // `size` picks the tuned design (64 / 20); a width in `style` scales that
  // design up crisply to any on-screen size (Skia draws vectors). Defaults
  // to the preset px, exactly like the web component.
  const flat = StyleSheet.flatten(style);
  const box = typeof flat?.width === 'number' ? flat.width : size;
  const scale = box / size;

  const clock = useClock();
  // Total time spent paused, so unpausing never jumps the animation.
  const pauseOffset = useSharedValue(0);
  const pauseStart = useSharedValue(0);

  useEffect(() => {
    if (paused) pauseStart.set(clock.get());
    else pauseOffset.set(pauseOffset.get() + (clock.get() - pauseStart.get()));
  }, [paused, clock, pauseOffset, pauseStart]);

  const picture = useDerivedValue(() => {
    'worklet';
    // Reading the clock only while running makes the worklet re-run each
    // frame; when paused/reduced it reads a frozen base and never depends
    // on the clock — so it renders exactly one static frame.
    const base = paused ? pauseStart.get() : clock.get();
    const t = reduced ? 0.6 * effSpeed : ((base - pauseOffset.get()) / 1000) * effSpeed;
    const dots = geometry(size, t, opts);
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, box, box));
    paintDots(canvas, dots, dark, paint, rMin, scale);
    return recorder.finishRecordingAsPicture();
  }, [paused, reduced, effSpeed, geometry, size, opts, dark, box, scale, rMin]);

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      <Picture picture={picture} />
    </Canvas>
  );
}
