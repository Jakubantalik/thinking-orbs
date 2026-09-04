import assert from 'node:assert/strict';
import test from 'node:test';

import { renderTuiOrb } from '../src/tui/index';
import type { OrbState } from '../src/types';

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

test('every state renders to the requested terminal-cell bounds', () => {
  for (const state of STATES) {
    const frame = renderTuiOrb(state, { columns: 14, rows: 7, time: 0.75 });
    assert.equal(frame.lines.length, 7, state);
    assert.equal(frame.intensities.length, 7, state);
    assert.ok(frame.lines.some((line) => line.trim().length > 0), state);
    for (const line of frame.lines) assert.equal(Array.from(line).length, 14, state);
    for (const row of frame.intensities) {
      assert.equal(row.length, 14, state);
      assert.ok(row.every((value) => value >= 0 && value <= 1), state);
    }
  }
});

test('the same state and time produce an identical frame', () => {
  const options = { columns: 16, rows: 8, time: 1.25 } as const;
  assert.deepEqual(renderTuiOrb('connecting', options), renderTuiOrb('connecting', options));
});

test('animated geometry changes without moving the terminal frame', () => {
  const first = renderTuiOrb('listening', { columns: 16, rows: 8, time: 0.25 });
  const later = renderTuiOrb('listening', { columns: 16, rows: 8, time: 1.25 });
  assert.notDeepEqual(later.lines, first.lines);
  assert.equal(later.lines.length, first.lines.length);
  assert.ok(later.lines.every((line) => Array.from(line).length === 16));
});

test('listening golden frame preserves the dotted spherical projection', () => {
  assert.deepEqual(renderTuiOrb('listening', { columns: 12, rows: 6, time: 0.75 }).lines, [
    '    ⣀⣄⣄⣀    ',
    '  ⣴⣿⣟⣻⣛⣟⣿⣤  ',
    ' ⢰⣿⡿⢭⢭⢵⡽⢿⣿⡆ ',
    ' ⠸⣿⣟⢺⣲⣗⣗⣿⣿⠇ ',
    '  ⠙⢿⣽⣽⣭⣽⡿⠛  ',
    '    ⠉⠉⠉⠁    '
  ]);
});

test('paint hook receives bounded intensity for every terminal cell', () => {
  const calls: number[] = [];
  const frame = renderTuiOrb('working', {
    columns: 10,
    rows: 4,
    time: 0.5,
    paint: (glyph, intensity) => {
      calls.push(intensity);
      return glyph;
    }
  });
  assert.equal(calls.length, 40);
  assert.ok(calls.every((value) => value >= 0 && value <= 1));
  assert.ok(frame.lines.some((line) => line.trim().length > 0));
});
