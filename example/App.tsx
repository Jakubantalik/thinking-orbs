import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ThinkingOrb, type OrbState } from '../src/native';
import { FpsMeter } from './FpsMeter';

const STATES: OrbState[] = ['working', 'searching', 'solving', 'listening', 'composing', 'shaping'];

export default function App() {
  const { width } = useWindowDimensions();
  const [state, setState] = useState<OrbState>('working');
  const [dark, setDark] = useState(true);
  const [paused, setPaused] = useState(false);

  const orbSize = Math.round(width * 0.8);
  const bg = dark ? '#0b0b0f' : '#f5f5f7';
  const fg = dark ? '#f5f5f7' : '#0b0b0f';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      <View style={styles.meter}>
        <FpsMeter color={fg} />
      </View>

      <View style={styles.orbWrap}>
        <ThinkingOrb
          state={state}
          size={64}
          theme={dark ? 'dark' : 'light'}
          paused={paused}
          style={{ width: orbSize, height: orbSize }}
        />
      </View>

      <Text style={[styles.caption, { color: fg }]}>{state}</Text>

      <View style={styles.row}>
        {STATES.map((s) => {
          const active = s === state;
          return (
            <Pressable
              key={s}
              onPress={() => setState(s)}
              style={[styles.chip, { borderColor: fg }, active && { backgroundColor: fg }]}
            >
              <Text style={[styles.chipText, { color: active ? bg : fg }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <Pressable onPress={() => setPaused((p) => !p)} style={[styles.chip, { borderColor: fg }]}>
          <Text style={[styles.chipText, { color: fg }]}>{paused ? 'play' : 'pause'}</Text>
        </Pressable>
        <Pressable onPress={() => setDark((d) => !d)} style={[styles.chip, { borderColor: fg }]}>
          <Text style={[styles.chipText, { color: fg }]}>{dark ? 'light bg' : 'dark bg'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 32 },
  meter: { position: 'absolute', top: 64, right: 20 },
  orbWrap: { alignItems: 'center', justifyContent: 'center' },
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
