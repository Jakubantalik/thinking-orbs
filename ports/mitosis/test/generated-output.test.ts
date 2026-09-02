// Generated-output verification: runs the real Mitosis CLI for the whole
// target matrix (React, Vue, Svelte, Solid) and asserts every generated
// component is a genuine native integration — canvas ref, engine import,
// reduced-motion static frame, offscreen/tab pause, role/label — not a prose
// stub. Missing any one marker (a sabotage/regression) fails the build.
//
// Also validates the Mitosis config resolves to the intended targets.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'output');

const TARGETS = ['react', 'vue', 'svelte', 'solid'] as const;

function read(rel: string): string {
  return readFileSync(path.join(OUTPUT, rel), 'utf8');
}

describe('mitosis config', () => {
  it('targets react, vue, svelte, solid', () => {
    const cfg = readFileSync(path.join(ROOT, 'mitosis.config.ts'), 'utf8');
    for (const t of TARGETS) {
      expect(cfg).toContain(`'${t}'`);
    }
  });
});

describe('generated framework outputs (real mitosis build)', () => {
  let buildLog: string;

  beforeAll(() => {
    buildLog = execSync('npm run build', {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).toString();
  });

  afterAll(() => {
    // Leave the committed, post-processed generated output in place for inspection.
  });

  it('generates a component and the shared controller for every target', () => {
    const expected = {
      react: 'src/ThinkingOrb.tsx',
      vue: 'src/ThinkingOrb.vue',
      svelte: 'src/ThinkingOrb.svelte',
      solid: 'src/ThinkingOrb.tsx',
    };
    for (const t of TARGETS) {
      expect(existsSync(path.join(OUTPUT, t, expected[t])), `${t} component`).toBe(true);
      expect(existsSync(path.join(OUTPUT, t, 'src/orb-controller.ts')), `${t} controller`).toBe(
        true,
      );
      expect(existsSync(path.join(OUTPUT, t, 'src/types.ts')), `${t} types`).toBe(true);
    }
  });

  for (const t of TARGETS) {
    const componentRel = {
      react: 'src/ThinkingOrb.tsx',
      vue: 'src/ThinkingOrb.vue',
      svelte: 'src/ThinkingOrb.svelte',
      solid: 'src/ThinkingOrb.tsx',
    }[t];

    it(`${t}: component drives the shared engine geometry`, () => {
      const component = read(`${t}/${componentRel}`);
      const controller = read(`${t}/src/orb-controller.ts`);

      // native integration, not a stub
      expect(controller).toContain("from 'thinking-orbs/engine'");
      expect(controller).toContain('MODE_DRAWS');
      expect(controller).toContain('resolvePreset');

      // shared framework-neutral controller is what the component mounts
      expect(component).toContain('./orb-controller');
      expect(component).toContain('createOrbController');
      expect(component).toContain('attachController');
      expect(component).toContain('getController');
    });

    it(`${t}: preserves reduced-motion static-frame behaviour`, () => {
      const component = read(`${t}/${componentRel}`);
      const controller = read(`${t}/src/orb-controller.ts`);
      expect(controller).toContain('prefers-reduced-motion');
      expect(controller).toContain('REDUCED_MOTION_T');
      expect(controller).toContain('renderStatic');
    });

    it(`${t}: preserves offscreen + tab-hidden pause`, () => {
      const controller = read(`${t}/src/orb-controller.ts`);
      expect(controller).toContain('IntersectionObserver');
      expect(controller).toContain('visibilitychange');
    });

    it(`${t}: preserves DPR cap and shared clock`, () => {
      const controller = read(`${t}/src/orb-controller.ts`);
      expect(controller).toContain('devicePixelRatioCapped');
      expect(controller).toContain('performance.now');
      expect(controller).toContain('Math.min');
    });

    it(`${t}: renders an accessible image with per-state label`, () => {
      const component = read(`${t}/${componentRel}`);
      expect(component).toContain('role="img"');
      expect(component).toContain('aria-label');
      expect(component).toContain('LABELS');
    });

    it(`${t}: wires a canvas ref to lifecycle hooks`, () => {
      const component = read(`${t}/${componentRel}`);
      if (t === 'react') expect(component).toContain('useRef');
      if (t === 'vue') expect(component).toContain('$refs.canvas');
      if (t === 'svelte') expect(component).toContain('bind:this={canvas}');
      if (t === 'solid') expect(component).toContain('ref={canvas!}');
    });

    it(`${t}: generated output is real executable code, not swallowed by a leading // comment`, () => {
      const component = read(`${t}/${componentRel}`);
      // regression guard: the Mitosis React generator folds the whole component
      // onto a leading `//` comment line, commenting the program out. The real
      // toolchain compile (`compile:check`) is the authoritative catch; this
      // cheap read makes the plain test suite fail too.
      for (const line of component.split('\n')) {
        if (/\bexport default\b/.test(line)) {
          expect(line.trimStart().startsWith('//'), 'export default must not sit inside a comment line').toBe(
            false,
          );
        }
      }
    });
  }

  it('build log reports all four targets generated', () => {
    for (const t of TARGETS) {
      expect(buildLog).toContain(`${t}: generated`);
    }
  });
});
