// All nine states at both tuned sizes, with pause and speed controls.
// On iOS/Android this renders through Skia; `expo start --web` serves
// the DOM-canvas fallback through react-native-web instead.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { ThinkingOrb } from 'thinking-orbs/native';
import type { OrbState } from 'thinking-orbs/native';

const STATES: OrbState[] = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping'
];

const SPEEDS = [0.5, 1, 2];

export function App() {
  const dark = useColorScheme() !== 'light';
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const ink = dark ? '#ffffff' : '#111111';
  const faint = dark ? '#666666' : '#999999';

  return (
    <ScrollView
      style={{ backgroundColor: dark ? '#111111' : '#ffffff' }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: ink }]}>thinking-orbs</Text>

      <View style={styles.controls}>
        <Pressable style={[styles.button, { borderColor: faint }]} onPress={() => setPaused((p) => !p)}>
          <Text style={{ color: ink }}>{paused ? 'Play' : 'Pause'}</Text>
        </Pressable>
        {SPEEDS.map((s) => (
          <Pressable
            key={s}
            style={[styles.button, { borderColor: s === speed ? ink : faint }]}
            onPress={() => setSpeed(s)}
          >
            <Text style={{ color: s === speed ? ink : faint }}>{s}×</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {STATES.map((state) => (
          <View key={state} style={styles.cell}>
            <ThinkingOrb state={state} size={64} paused={paused} speed={speed} />
            <Text style={[styles.label, { color: faint }]}>{state}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.label, { color: faint, marginTop: 24 }]}>size 20</Text>
      <View style={styles.row}>
        {STATES.map((state) => (
          <ThinkingOrb key={state} state={state} size={20} paused={paused} speed={speed} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32
  },
  button: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 400
  },
  cell: {
    alignItems: 'center',
    gap: 8,
    width: 100
  },
  label: {
    fontSize: 12
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  }
});
