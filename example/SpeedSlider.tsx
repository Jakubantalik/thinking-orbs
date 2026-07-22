// A dependency-free speed slider (PanResponder — no native module, so it
// runs in any build without a rebuild). It tracks the finger with the
// ABSOLUTE gesture position minus the track's measured screen x, which is
// robust while dragging anywhere across the track (unlike locationX, which
// is relative to whatever sub-view happens to be under the finger).
//
// Refs are only ever read inside gesture / layout callbacks — never during
// render — so the component is React-Compiler safe.
//
// The 0.25×–3× range is mapped piecewise so 1× sits exactly at the centre:
// the left half spans 0.25×→1×, the right half 1×→3×.

import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

const MIN = 0.25;
const MID = 1;
const MAX = 3;
const THUMB = 24;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function posToSpeed(p: number): number {
  return p <= 0.5 ? MIN + (MID - MIN) * (p / 0.5) : MID + (MAX - MID) * ((p - 0.5) / 0.5);
}
function speedToPos(s: number): number {
  return s <= MID ? ((s - MIN) / (MID - MIN)) * 0.5 : 0.5 + ((s - MID) / (MAX - MID)) * 0.5;
}

interface Props {
  speed: number;
  onChange: (speed: number) => void;
  fg: string;
  track: string;
}

export function SpeedSlider({ speed, onChange, fg, track }: Props) {
  const trackRef = useRef<View>(null);
  // Track geometry (screen x + width) as state, captured by value in the
  // responder — so no data-ref is read during render (React-Compiler safe).
  const [geo, setGeo] = useState({ x: 0, w: 0 });

  const measure = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, w) => setGeo({ x, w }));
  }, []);

  const responder = useMemo(() => {
    const at = (absX: number) => {
      if (geo.w > 0) onChange(posToSpeed(clamp((absX - geo.x) / geo.w, 0, 1)));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, g) => at(g.x0),
      onPanResponderMove: (_e, g) => at(g.moveX)
    });
  }, [onChange, geo.x, geo.w]);

  const pos = clamp(speedToPos(speed), 0, 1);
  const thumbX = pos * geo.w - THUMB / 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: fg }]}>Speed</Text>
        <Text style={[styles.value, { color: fg }]}>{`${speed.toFixed(2)}×`}</Text>
      </View>
      <View ref={trackRef} onLayout={measure} style={styles.hit} {...responder.panHandlers}>
        <View style={[styles.track, { backgroundColor: track }]} />
        <View style={[styles.fill, { backgroundColor: fg, width: Math.max(0, pos * geo.w) }]} />
        <View style={[styles.thumb, { backgroundColor: fg, left: thumbX }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '82%', marginTop: 28 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 },
  value: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  hit: { height: 40, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2 },
  fill: { position: 'absolute', height: 4, borderRadius: 2, left: 0 },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2 }
});
