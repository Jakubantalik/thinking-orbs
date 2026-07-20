import { useEffect, useState } from 'react';
import type { OrbState } from 'thinking-orbs';
import { ThinkingOrb } from 'thinking-orbs';

const STATES: Array<{ state: OrbState; blurb: string }> = [
  { state: 'working', blurb: 'particles on tilted orbits' },
  { state: 'searching', blurb: 'a scan meridian sweeps the field' },
  { state: 'solving', blurb: 'bands scramble, then click back' },
  { state: 'listening', blurb: 'a waveform rolls through the rings' },
  { state: 'composing', blurb: 'an undulating sash of bands' },
  { state: 'shaping', blurb: 'circle → triangle → square' }
];

export function App() {
  const [dark, setDark] = useState(true);

  // drive the ancestor `data-theme` attribute — the same signal the
  // library's auto detection reads in a host project
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="page">
      <header>
        <span className="mono">THINKING-ORBS · SIX STATES · TWO SIZES · AUTO THEME</span>
        <button className="mono theme-btn" type="button" onClick={() => setDark((d) => !d)}>
          {dark ? 'LIGHT' : 'DARK'}
        </button>
      </header>

      <section className="grid">
        {STATES.map(({ state, blurb }) => (
          <div key={state} className="card">
            <div className="pair">
              <ThinkingOrb state={state} size={64} />
              <ThinkingOrb state={state} size={20} />
            </div>
            <div className="text">
              <span className="title">{state}</span>
              <span className="sub">{blurb}</span>
            </div>
          </div>
        ))}
      </section>

      <footer className="mono faint">
        SIZE 64 / 20 · THEME AUTO (data-theme · .dark · prefers-color-scheme) · REDUCED-MOTION SAFE
      </footer>
    </div>
  );
}
