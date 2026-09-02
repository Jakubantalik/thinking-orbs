// Unit tests for the framework-neutral `orb-controller`: canvas sizing and
// DPR cap, initial paint, the rAF loop (start/stop on prop and visibility
// changes), theme resolution, reduced-motion static frame, and clean teardown.
// Runs headlessly with a recording fake canvas and stubbed browser globals.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrbController, REDUCED_MOTION_T } from '../src/orb-controller';

interface FakeCtx extends CanvasRenderingContext2D {
  calls: string[];
  fills: number;
  setTransforms: { a: number; d: number }[];
}

function makeCtx(): FakeCtx {
  const ctx = {
    calls: [],
    fills: 0,
    setTransforms: [],
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as FakeCtx;
  (['arc', 'beginPath', 'lineTo', 'moveTo', 'stroke', 'fill', 'clearRect'] as const).forEach((m) => {
    (ctx as unknown as Record<string, unknown>)[m] = () => {
      if (m === 'fill') ctx.fills++;
      ctx.calls.push(m);
    };
  });
  (ctx as unknown as Record<string, unknown>).setTransform = (
    a: number,
    _b: number,
    _c: number,
    d: number,
  ) => {
    ctx.setTransforms.push({ a, d });
  };
  return ctx;
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: FakeCtx } {
  const ctx = makeCtx();
  const canvas = {
    width: 0,
    height: 0,
    getContext: (id: string) => (id === '2d' ? ctx : null),
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}

interface HarnessOpts {
  reduced?: boolean;
  dark?: boolean;
  io?: boolean;
  dpr?: number;
}

interface Harness {
  raf: ReturnType<typeof vi.fn>;
  caf: ReturnType<typeof vi.fn>;
  fireIntersection: (isIntersecting: boolean) => void;
  visibilityListeners: (() => void)[];
  setVisibility: (v: string) => void;
  setReduced: (reduced: boolean) => void;
  cleanup: () => void;
}

// callbacks for the IntersectionObserver instances constructed during a test
const ioCallbacks: IntersectionObserverCallback[] = [];

function stubBrowser(opts: HarnessOpts = {}): Harness {
  const { reduced: initiallyReduced = false, dark = true, io = true, dpr = 1 } = opts;

  const raf = vi.fn((_cb: FrameRequestCallback) => 1);
  const caf = vi.fn();

  // track every media-query listener so a live reduced-motion change can fire
  let reducedFlag = initiallyReduced;
  const mqlReduced: { type: string; fn: unknown }[] = [];
  const matchMedia = vi.fn((q: string) => {
    const matches = /reduced-motion/.test(q) ? reducedFlag : /dark/.test(q) ? dark : false;
    const listeners = /reduced-motion/.test(q) ? mqlReduced : [];
    return {
      matches,
      addEventListener: (type: string, fn: unknown) => listeners.push({ type, fn }),
      removeEventListener: (type: string, fn: unknown) => {
        const i = listeners.findIndex((l) => l.type === type && l.fn === fn);
        if (i >= 0) listeners.splice(i, 1);
      },
    };
  });

  let visibilityState = 'visible';
  const visibilityListeners: (() => void)[] = [];
  const doc = {
    get documentElement() {
      return {};
    },
    get visibilityState() {
      return visibilityState;
    },
    addEventListener: (type: string, fn: () => void) => {
      if (type === 'visibilitychange') visibilityListeners.push(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      const i = visibilityListeners.indexOf(fn);
      if (i >= 0) visibilityListeners.splice(i, 1);
    },
  };

  class MutationObserverStub {
    disconnected = 0;
    observe() {}
    disconnect() {
      this.disconnected++;
    }
  }

  if (io) {
    const IO = function (cb: IntersectionObserverCallback) {
      ioCallbacks.push(cb);
    } as unknown as typeof IntersectionObserver;
    IO.prototype.observe = () => {};
    IO.prototype.unobserve = () => {};
    IO.prototype.disconnect = () => {};
    vi.stubGlobal('IntersectionObserver', IO);
  } else {
    vi.stubGlobal('IntersectionObserver', undefined);
  }

  vi.stubGlobal('requestAnimationFrame', raf);
  vi.stubGlobal('cancelAnimationFrame', caf);
  vi.stubGlobal('matchMedia', matchMedia);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('MutationObserver', MutationObserverStub);
  vi.stubGlobal('devicePixelRatio', dpr);

  return {
    raf,
    caf,
    fireIntersection: (isIntersecting: boolean) => {
      const cb = ioCallbacks[ioCallbacks.length - 1];
      if (cb) cb([{ isIntersecting } as IntersectionObserverEntry], null as unknown as IntersectionObserver);
    },
    visibilityListeners,
    setVisibility: (v: string) => {
      visibilityState = v;
      visibilityListeners.forEach((fn) => fn());
    },
    setReduced: (next: boolean) => {
      reducedFlag = next;
      for (const l of mqlReduced) {
        if (l.type === 'change') (l.fn as (e: { matches: boolean }) => void)({ matches: next });
      }
    },
    cleanup: () => vi.unstubAllGlobals(),
  };
}

describe('createOrbController', () => {
  let h: Harness;
  let canvas: HTMLCanvasElement;
  let ctx: FakeCtx;

  beforeEach(() => {
    ioCallbacks.length = 0;
    h = stubBrowser({ io: false });
    const made = makeCanvas();
    canvas = made.canvas;
    ctx = made.ctx;
  });

  afterEach(() => {
    h.cleanup();
    vi.restoreAllMocks();
  });

  function make(
    overrides: Partial<{
      state: 'working' | 'searching';
      size: 64 | 20;
      theme: 'auto' | 'dark' | 'light';
      speed: number;
      paused: boolean;
    }> = {},
  ) {
    return createOrbController(canvas, {
      state: overrides.state ?? 'working',
      size: overrides.size ?? 64,
      theme: overrides.theme ?? 'dark',
      speed: overrides.speed ?? 1,
      paused: overrides.paused ?? false,
    });
  }

  it('sizes the backing store to size * DPR and applies the transform', () => {
    h = stubBrowser({ io: false, dpr: 2 });
    const ctl = make();
    expect(canvas.width).toBe(128);
    expect(canvas.height).toBe(128);
    expect(ctx.setTransforms[0]).toEqual({ a: 2, d: 2 });
    ctl.dispose();
  });

  it('caps DPR at 2', () => {
    h = stubBrowser({ io: false, dpr: 4 });
    const ctl = make({ size: 20 });
    expect(canvas.width).toBe(40);
    expect(ctx.setTransforms[0]).toEqual({ a: 2, d: 2 });
    ctl.dispose();
  });

  it('paints an initial frame and starts the rAF loop when not paused', () => {
    const ctl = make();
    expect(ctx.fills).toBeGreaterThan(0);
    expect(h.raf).toHaveBeenCalled();
    ctl.dispose();
  });

  it('does not start the loop when paused, but still paints one frame', () => {
    const ctl = make({ paused: true });
    expect(ctx.fills).toBeGreaterThan(0);
    expect(h.raf).not.toHaveBeenCalled();
    ctl.dispose();
  });

  it('stops the loop when paused is applied, and resumes when unpaused', () => {
    const ctl = make();
    expect(h.raf).toHaveBeenCalled();
    const rafBefore = h.raf.mock.calls.length;
    ctl.applyProps({ state: 'working', size: 64, theme: 'dark', speed: 1, paused: true });
    expect(h.caf).toHaveBeenCalled();
    ctl.applyProps({ state: 'working', size: 64, theme: 'dark', speed: 1, paused: false });
    expect(h.raf.mock.calls.length).toBeGreaterThan(rafBefore);
    ctl.dispose();
  });

  it('re-resolves geometry and resizes when size changes', () => {
    const ctl = make({ state: 'searching', size: 64 });
    expect(canvas.width).toBe(64);
    ctl.applyProps({ state: 'searching', size: 20, theme: 'dark', speed: 1, paused: false });
    expect(canvas.width).toBe(20);
    expect(canvas.height).toBe(20);
    ctl.dispose();
  });

  it('pins dark substrate for theme=dark and light for theme=light', () => {
    const darkCtl = make({ theme: 'dark' });
    const darkFill = ctx.fillStyle;
    darkCtl.dispose();

    const lightMade = makeCanvas();
    const lightCtl = createOrbController(lightMade.canvas, {
      state: 'working',
      size: 64,
      theme: 'light',
      speed: 1,
      paused: false,
    });
    expect(lightMade.ctx.fillStyle).not.toBe(darkFill);
    lightCtl.dispose();
  });

  describe('reduced motion', () => {
    it('draws a static frame and does not start a loop when reduced is active', () => {
      h = stubBrowser({ io: false, reduced: true });
      const ctl = make();
      expect(ctx.fills).toBeGreaterThan(0);
      expect(h.raf).not.toHaveBeenCalled();
      ctl.dispose();
    });

    it('exposes the engine reduced-motion frame time', () => {
      expect(REDUCED_MOTION_T).toBe(0.6);
    });

    it('reacts live to a prefers-reduced-motion change: stops the loop and draws a static frame, then resumes', () => {
      const ctl = make();
      // running before the change
      expect(h.raf).toHaveBeenCalled();
      expect(h.caf).not.toHaveBeenCalled();

      const fillsBeforeToggle = ctx.fills;
      h.setReduced(true);
      // animate loop stopped, static frame drawn (a fresh fill, no new rAF)
      expect(h.caf).toHaveBeenCalled();
      const rafCallsWhileReduced = h.raf.mock.calls.length;
      expect(ctx.fills).toBeGreaterThan(fillsBeforeToggle);

      h.setReduced(false);
      // the animate loop restarts
      expect(h.raf.mock.calls.length).toBeGreaterThan(rafCallsWhileReduced);
      ctl.dispose();
    });
  });

  describe('intersection-observer visibility', () => {
    it('does not start until the first visible intersection, then starts', () => {
      h = stubBrowser({ io: true });
      const ctl = make();
      expect(h.raf).not.toHaveBeenCalled();
      h.fireIntersection(true);
      expect(h.raf).toHaveBeenCalled();
      ctl.dispose();
    });
  });

  it('cancels outstanding work and disconnects observers on dispose', () => {
    const ctl = make();
    ctl.dispose();
    expect(h.caf).toHaveBeenCalled();
  });
});
