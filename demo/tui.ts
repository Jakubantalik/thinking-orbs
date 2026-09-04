import { renderTuiOrb } from '../src/tui/index';
import type { OrbState } from '../src/types';

const states: OrbState[] = [
  'connecting',
  'searching',
  'listening',
  'working',
  'solving',
  'weaving',
  'composing',
  'breathing',
  'shaping'
];
const startedAt = performance.now();
const stateDuration = 3.6;

function tint(glyph: string, intensity: number): string {
  if (glyph === ' ') return glyph;
  const energy = Math.round(125 + intensity * 130);
  const blue = Math.min(255, energy + 16);
  return `\x1b[38;2;${energy};${energy};${blue}m${glyph}\x1b[0m`;
}

function render(): void {
  const elapsed = (performance.now() - startedAt) / 1000;
  const state = states[Math.floor(elapsed / stateDuration) % states.length];
  const frame = renderTuiOrb(state, {
    columns: 20,
    rows: 9,
    time: elapsed,
    speed: 0.72,
    threshold: 0.2,
    paint: tint
  });
  const label = state[0].toUpperCase() + state.slice(1);
  const output = [
    ...frame.lines,
    '',
    `\x1b[1m${label}\x1b[0m`,
    '\x1b[2mthinking-orbs/tui · Ctrl+C to close\x1b[0m'
  ];
  process.stdout.write(`\x1b[H${output.join('\n')}\x1b[J`);
}

function restore(): void {
  process.stdout.write('\x1b[?25h\x1b[0m\n');
  process.exit(0);
}

process.on('SIGINT', restore);
process.on('SIGTERM', restore);
process.stdout.write('\x1b[2J\x1b[H\x1b[?25l');
render();
setInterval(render, 100);
