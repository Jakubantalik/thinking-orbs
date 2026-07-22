// The React Native ThinkingOrb. Same public API as the web component
// (state / size / theme / speed / paused / style). Everything runs on the
// UI thread and there are NO effects and NO per-frame React renders:
//
// - Live props (dark / paused / reduced) are mirrored into shared values
//   with `useDerivedValue(() => prop, [prop])`, so the render worklet reacts
//   to them WITHOUT being recreated — a theme toggle just recolors, it never
//   restarts or hitches the motion.
// - A `useFrameCallback` accumulates animation time only while playing, so
//   pausing freezes and resuming never jumps.
// - The picture `useDerivedValue` runs the engine geometry (shared, worklet)
//   and records a Skia Picture, which flows straight to <Picture>.

import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { MODE_GEOMETRY } from '../engine/registry';
import { resolvePreset } from '../presets';
import { paintDots } from './renderer';
import { useResolvedDark } from './theme';
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
  // design up crisply to any on-screen size. Defaults to the preset px.
  const flat = StyleSheet.flatten(style);
  const box = typeof flat?.width === 'number' ? flat.width : size;
  const scale = box / size;

  // Live props → shared values, effect-free, so the render worklet can read
  // them each frame without being recreated when they change.
  const darkValue = useDerivedValue(() => dark, [dark]);
  const pausedValue = useDerivedValue(() => paused || reduced, [paused, reduced]);
  const speedValue = useDerivedValue(() => effSpeed, [effSpeed]);

  // Accumulated animation time (ms), advanced only while playing and scaled
  // by the current speed AS it accrues. Changing `speed` therefore only
  // affects the rate going forward — it never rescales past time, so the
  // animation keeps flowing smoothly instead of jumping when speed changes.
  const animTime = useSharedValue(0);
  useFrameCallback((frame) => {
    'worklet';
    if (!pausedValue.get()) {
      animTime.set(animTime.get() + (frame.timeSincePreviousFrame ?? 0) * speedValue.get());
    }
  });

  const picture = useDerivedValue(() => {
    'worklet';
    const t = reduced ? 0.6 : animTime.get() / 1000;
    const dots = geometry(size, t, opts);
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, box, box));
    paintDots(canvas, dots, darkValue.get(), paint, rMin, scale);
    return recorder.finishRecordingAsPicture();
  }, [reduced, geometry, size, opts, box, scale, rMin]);

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      <Picture picture={picture} />
    </Canvas>
  );
}
