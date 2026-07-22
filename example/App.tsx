import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { ThinkingOrb, type OrbState } from 'thinking-orbs/native';
import { Controls } from './Controls';
import { FpsMeter } from './FpsMeter';
import { SpeedSlider } from './SpeedSlider';

export default function App() {
  const { width } = useWindowDimensions();
  const [state, setState] = useState<OrbState>('working');
  const [dark, setDark] = useState(true);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const orbSize = Math.round(width * 0.8);
  const bg = dark ? '#0b0b0f' : '#f5f5f7';
  const fg = dark ? '#f5f5f7' : '#0b0b0f';

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const toggleTheme = useCallback(() => setDark((d) => !d), []);
  const orbStyle = useMemo(() => ({ width: orbSize, height: orbSize }), [orbSize]);

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
          speed={speed}
          paused={paused}
          style={orbStyle}
        />
      </View>

      <Controls
        state={state}
        paused={paused}
        dark={dark}
        fg={fg}
        bg={bg}
        onSelectState={setState}
        onTogglePause={togglePause}
        onToggleTheme={toggleTheme}
      />

      <SpeedSlider speed={speed} onChange={setSpeed} fg={fg} track={dark ? '#2a2a30' : '#d8d8dd'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 32 },
  meter: { position: 'absolute', top: 64, right: 20 },
  orbWrap: { alignItems: 'center', justifyContent: 'center' }
});
