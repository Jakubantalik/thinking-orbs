// Framework-neutral ThinkingOrb controller: owns every imperative behaviour
// of the loading indicator so the Mitosis component can stay a thin canvas
// shim. Driving the shared `thinking-orbs/engine` geometry, it preserves the
// web component's semantics — shared `performance.now` clock, DPR cap 2,
// live theme auto-detect, reduced-motion static frame, offscreen/tab pause —
// in a single object that compiles unchanged into every framework target.
// No React; only the DOM types a browser canvas needs.

import { MODE_DRAWS, resolvePreset } from 'thinking-orbs/engine';
import type { OrbSize, OrbState, OrbTheme } from './types';
export const REDUCED_MOTION_T = 0.6;
const DPR_CAP = 2;
export interface OrbControllerProps {
  state: OrbState;
  size: OrbSize;
  theme: OrbTheme;
  speed: number;
  paused: boolean;
}
export interface OrbControllerOptions {
  state?: OrbState;
  size?: OrbSize;
  theme?: OrbTheme;
  speed?: number;
  paused?: boolean;
}
export function controllerProps(o: OrbControllerOptions): OrbControllerProps {
  return {
    state: o.state ?? 'working',
    size: o.size ?? 64,
    theme: o.theme ?? 'auto',
    speed: o.speed ?? 1,
    paused: o.paused ?? false
  };
}
function ancestorTheme(el: Element | null): boolean | null {
  let node: Element | null = el;
  while (node) {
    const attr = node.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    if (node.classList.contains('dark')) return true;
    if (node.classList.contains('light')) return false;
    node = node.parentElement;
  }
  return null;
}
function systemDark(): boolean {
  return typeof matchMedia === 'undefined' || matchMedia('(prefers-color-scheme: dark)').matches;
}
function devicePixelRatioCapped(): number {
  return Math.min(DPR_CAP, typeof devicePixelRatio !== 'undefined' && devicePixelRatio || 1);
}
export interface OrbController {
  applyProps(props: OrbControllerProps): void;
  dispose(): void;
}
const ORB_KEY = '__thinkingOrbController';
export function attachController(el: unknown, ctl: OrbController): void {
  (el as Record<string, unknown>)[ORB_KEY] = ctl;
}
export function getController(el: unknown): OrbController | null {
  if (!el) return null;
  return (el as Record<string, unknown>)[ORB_KEY] as OrbController | null;
}

/**
 * Boot the orb on a canvas. Returns a handle: call `applyProps` whenever the
 * host re-renders with new props, and `dispose` on unmount. All state is
 * internal so the same code runs identically under React, Vue, Svelte and
 * Solid.
 */
export function createOrbController(canvas: HTMLCanvasElement, initial: OrbControllerProps): OrbController {
  let state: OrbState = initial.state;
  let size: OrbSize = initial.size;
  let theme: OrbTheme = initial.theme;
  let speed: number = initial.speed;
  let paused: boolean = initial.paused;
  let resolved = resolvePreset(state, size);
  let dark: boolean = initial.theme === 'dark' ? true : initial.theme === 'light' ? false : systemDark();
  let reduced: boolean = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const maybeCtx = canvas.getContext('2d');
  if (!maybeCtx) throw new Error('ThinkingOrb: 2d canvas context unavailable');
  const ctx: CanvasRenderingContext2D = maybeCtx;
  const dpr = devicePixelRatioCapped();
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Shared clock semantics: the same `performance.now` base keeps every
  // instance in phase, as on the web.
  function effectiveT(): number {
    return performance.now() / 1000 * resolved.speed * speed;
  }
  function draw(t: number): void {
    MODE_DRAWS[resolved.mode](ctx, size, t, dark, resolved.opts);
  }
  function renderFrame(t: number): void {
    ctx.clearRect(0, 0, size, size);
    draw(t);
  }

  // reduced motion → one deterministic static frame, as the web draws at 0.6.
  function renderStatic(): void {
    ctx.clearRect(0, 0, size, size);
    draw(REDUCED_MOTION_T);
  }
  let visible = true;
  let raf = 0;
  let running = false;
  function loop(): void {
    renderFrame(effectiveT());
    if (running) raf = requestAnimationFrame(loop);
  }
  function start(): void {
    if (running || paused || reduced || !visible) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }
  function stop(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  // reduced-motion listener
  let reducedMq: MediaQueryList | null = null;
  const onReduced = (e: MediaQueryListEvent): void => {
    reduced = e.matches;
    if (reduced) {
      stop();
      renderStatic();
    } else {
      start();
    }
  };
  if (typeof matchMedia !== 'undefined') {
    reducedMq = matchMedia('(prefers-reduced-motion: reduce)');
    reducedMq.addEventListener('change', onReduced);
  }

  // theme listeners
  const resolveTheme = (): void => {
    if (theme === 'dark') {
      dark = true;
      return;
    }
    if (theme === 'light') {
      dark = false;
      return;
    }
    const fromTree = ancestorTheme(canvas);
    dark = fromTree ?? systemDark();
  };
  let mq: MediaQueryList | null = null;
  let mo: MutationObserver | null = null;
  resolveTheme();
  if (typeof matchMedia !== 'undefined') {
    mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', resolveTheme);
  }
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    mo = new MutationObserver(resolveTheme);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
      subtree: true
    });
  }

  // draw at least one frame even when paused/offscreen
  if (reduced) renderStatic();else renderFrame(effectiveT());

  // pause offscreen + on hidden tabs — free when not visible
  let io: IntersectionObserver | null = null;
  const onVis = (): void => {
    if (document.visibilityState === 'hidden') stop();else if (visible) start();
  };
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && document.visibilityState !== 'hidden') start();else stop();
    });
    io.observe(canvas);
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
  if (!io && !paused && !reduced) start();
  return {
    applyProps(next: OrbControllerProps): void {
      const stateChanged = next.state !== state;
      const sizeChanged = next.size !== size;
      state = next.state;
      size = next.size;
      theme = next.theme;
      speed = next.speed;
      paused = next.paused;
      if (stateChanged || sizeChanged) {
        resolved = resolvePreset(state, size);
        const dpr2 = devicePixelRatioCapped();
        canvas.width = Math.round(size * dpr2);
        canvas.height = Math.round(size * dpr2);
        ctx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
      }
      resolveTheme();
      if (reduced) {
        stop();
        renderStatic();
        return;
      }
      if (paused) {
        stop();
      } else {
        start();
      }
    },
    dispose(): void {
      stop();
      io?.disconnect();
      reducedMq?.removeEventListener('change', onReduced);
      mq?.removeEventListener('change', resolveTheme);
      mo?.disconnect();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    }
  };
}