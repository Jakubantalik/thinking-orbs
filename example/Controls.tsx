// The state/pause/theme buttons, memoized. None of these depend on `speed`,
// so while the speed slider is being dragged this whole subtree is skipped
// by React — only the orb and the slider re-render per tick.

import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { OrbState } from 'thinking-orbs/native';

const STATES: OrbState[] = ['working', 'searching', 'solving', 'listening', 'composing', 'shaping'];

interface Props {
  state: OrbState;
  paused: boolean;
  dark: boolean;
  fg: string;
  bg: string;
  onSelectState: (s: OrbState) => void;
  onTogglePause: () => void;
  onToggleTheme: () => void;
}

export const Controls = memo(function Controls({
  state,
  paused,
  dark,
  fg,
  bg,
  onSelectState,
  onTogglePause,
  onToggleTheme
}: Props) {
  return (
    <>
      <Text style={[styles.caption, { color: fg }]}>{state}</Text>

      <View style={styles.row}>
        {STATES.map((s) => {
          const active = s === state;
          return (
            <Pressable
              key={s}
              onPress={() => onSelectState(s)}
              style={[styles.chip, { borderColor: fg }, active && { backgroundColor: fg }]}
            >
              <Text style={[styles.chipText, { color: active ? bg : fg }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <Pressable onPress={onTogglePause} style={[styles.chip, { borderColor: fg }]}>
          <Text style={[styles.chipText, { color: fg }]}>{paused ? 'play' : 'pause'}</Text>
        </Pressable>
        <Pressable onPress={onToggleTheme} style={[styles.chip, { borderColor: fg }]}>
          <Text style={[styles.chipText, { color: fg }]}>{dark ? 'light bg' : 'dark bg'}</Text>
        </Pressable>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  caption: { marginTop: 8, fontSize: 15, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' }
});
