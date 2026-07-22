// A live UI-thread FPS readout. `useFrameCallback` runs a worklet on every
// UI-thread frame, so it measures the REAL display cadence (≈120 on a
// ProMotion iPhone, ≈60 on the simulator / non-Pro devices). The measured
// value is reported to React only ~5×/second (throttled runOnJS), so the
// meter costs effectively nothing and never re-renders the animated orb.

import { memo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { runOnJS, useFrameCallback, useSharedValue } from 'react-native-reanimated';

export const FpsMeter = memo(function FpsMeter({ color }: { color: string }) {
  const [fps, setFps] = useState(0);
  const smoothed = useSharedValue(0);
  const lastReport = useSharedValue(0);

  useFrameCallback((frame) => {
    'worklet';
    const dt = frame.timeSincePreviousFrame ?? 0;
    if (dt > 0) {
      const instant = 1000 / dt;
      const prev = smoothed.get();
      smoothed.set(prev === 0 ? instant : prev * 0.9 + instant * 0.1);
    }
    if (frame.timeSinceFirstFrame - lastReport.get() > 200) {
      lastReport.set(frame.timeSinceFirstFrame);
      runOnJS(setFps)(Math.round(smoothed.get()));
    }
  });

  return <Text style={[styles.text, { color }]}>{`${fps} FPS`}</Text>;
});

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
