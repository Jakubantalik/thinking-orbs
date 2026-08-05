import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrbController } from '../../src/controller/OrbController';
import { installCanvasMock, ManualScheduler, pointer } from './helpers';

describe('OrbController transitions', () => {
  beforeEach(() => installCanvasMock());
  afterEach(() => vi.restoreAllMocks());

  function setup(state = 'idle', reducedMotion = false) {
    const scheduler = new ManualScheduler();
    const canvas = document.createElement('canvas');
    const orb = new OrbController(canvas, { state, scheduler, reducedMotion });
    return { scheduler, canvas, orb };
  }

  it.each([['idle', 'thinking'], ['thinking', 'searching']])('transitions %s to %s deterministically', (from, to) => {
    const { orb, scheduler } = setup(from);
    orb.setState(to, { transition: { duration: 100, easing: 'linear' } });
    scheduler.advance(50);
    expect(orb.getSnapshot()).toMatchObject({ state: to, transitioning: true });
    scheduler.advance(50);
    expect(orb.getSnapshot()).toMatchObject({ state: to, transitioning: false });
  });

  it('interrupts from the exact rendered particle snapshot without a jump', async () => {
    const { orb, scheduler } = setup('thinking');
    const first = orb.setState('searching', { transition: { duration: 200, easing: 'linear' } });
    scheduler.advance(80);
    const before = orb.getSnapshot().particles;
    orb.setState('composing', { transition: { duration: 200, easing: 'linear' } });
    orb.renderAt(scheduler.now());
    expect(orb.getSnapshot().particles.slice(0, before.length)).toEqual(before);
    await expect(first.finished).resolves.toBe('cancelled');
  });

  it('supports cancellation and callback cleanup', async () => {
    const { orb } = setup();
    const progress = vi.fn();
    const cancelled = vi.fn();
    const handle = orb.setState('thinking', { onProgress: progress, onCancel: cancelled });
    handle.cancel();
    orb.renderAt(200);
    expect(cancelled).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenCalledTimes(1);
    await expect(handle.finished).resolves.toBe('cancelled');
  });

  it('falls back cleanly for a missing transition preset', () => {
    const { orb } = setup();
    orb.setState('thinking', { transition: 'not-registered' });
    expect(orb.getSnapshot().transitioning).toBe(true);
  });

  it('emits start, progress and end in order', () => {
    const { orb, scheduler } = setup();
    const events: string[] = [];
    orb.on('transitionstart', () => events.push('start'));
    orb.on('transitionprogress', () => events.push('progress'));
    orb.on('transitionend', () => events.push('end'));
    orb.setState('thinking', { transition: { duration: 10 } });
    scheduler.advance(10);
    expect(events[0]).toBe('start');
    expect(events.at(-1)).toBe('end');
    expect(events.filter((event) => event === 'progress').length).toBeGreaterThan(0);
  });

  it('dispatches namespaced canvas events without colliding with CSS transition events', () => {
    const { orb, canvas, scheduler } = setup();
    const native = vi.fn();
    const namespaced = vi.fn();
    canvas.addEventListener('transitionend', native);
    canvas.addEventListener('orbtransitionend', namespaced);
    orb.setState('thinking', { transition: { duration: 10 } });
    scheduler.advance(10);
    expect(namespaced).toHaveBeenCalledOnce();
    expect(native).not.toHaveBeenCalled();
  });

  it('finishes synchronously under reduced motion', async () => {
    const { orb } = setup('idle', true);
    const handle = orb.setState('thinking');
    expect(orb.getSnapshot()).toMatchObject({ state: 'thinking', transitioning: false });
    await expect(handle.finished).resolves.toBe('finished');
  });

  it('keeps one canvas context and one pending render loop', () => {
    const { orb, scheduler } = setup();
    orb.setState('thinking');
    orb.setState('searching');
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(1);
    expect(scheduler.callbacks.size).toBe(1);
  });

  it('cancels safely when destroyed during a transition', async () => {
    const { orb, scheduler } = setup();
    const handle = orb.setState('thinking');
    orb.destroy();
    expect(scheduler.callbacks.size).toBe(0);
    await expect(handle.finished).resolves.toBe('cancelled');
  });
});

describe('interaction overlay and particle identity', () => {
  beforeEach(() => installCanvasMock());
  afterEach(() => vi.restoreAllMocks());

  function setup() {
    const scheduler = new ManualScheduler();
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 64, height: 64 }) as DOMRect;
    const orb = new OrbController(canvas, {
      state: 'working',
      scheduler,
      interaction: {
        hover: { enabled: true, transitionDuration: 100 },
        focus: { enabled: true, useHoverStyle: true }
      }
    });
    return { scheduler, canvas, orb };
  }

  it('layers pointerenter/pointerleave over the active state using the same particles', () => {
    const { orb, scheduler, canvas } = setup();
    const before = orb.getSnapshot();
    canvas.dispatchEvent(pointer('pointerenter'));
    scheduler.advance(100);
    const hovered = orb.getSnapshot();
    expect(hovered.state).toBe('working');
    expect(hovered.particles.map((particle) => particle.id)).toEqual(before.particles.map((particle) => particle.id));
    expect(hovered.particles[0].x).not.toBe(before.particles[0].x);
    canvas.dispatchEvent(pointer('pointerleave'));
    scheduler.advance(100);
    expect(orb.getSnapshot().state).toBe('working');
  });

  it('uses the hover treatment for focus and removes it on blur', () => {
    const { orb, scheduler, canvas } = setup();
    const x = orb.getSnapshot().particles[0].x;
    canvas.dispatchEvent(new FocusEvent('focus'));
    scheduler.advance(100);
    expect(orb.getSnapshot().particles[0].x).not.toBe(x);
    canvas.dispatchEvent(new FocusEvent('blur'));
    scheduler.advance(100);
    expect(orb.getSnapshot().state).toBe('working');
  });

  it('does not activate hover for touch pointers', () => {
    const { orb, scheduler, canvas } = setup();
    canvas.dispatchEvent(pointer('pointerenter', 'touch'));
    scheduler.advance(100);
    expect(orb.getSnapshot()).toMatchObject({ state: 'working', interactionAmount: 0 });
  });

  it('preserves pool count and ids through state changes', () => {
    const { orb, scheduler } = setup();
    const before = orb.getSnapshot();
    orb.setState('shaping', { transition: { duration: 100 } });
    scheduler.advance(50);
    const during = orb.getSnapshot();
    expect(during.particleCount).toBe(before.particleCount);
    expect(during.particles.map((particle) => particle.id)).toEqual(before.particles.map((particle) => particle.id));
  });

  it('uses the seed reproducibly for custom targets', () => {
    const profile = { particles: ({ seed }: { seed: number }) => [{ x: seed, y: seed * 2, radius: 1 }] };
    const scheduler = new ManualScheduler();
    const a = new OrbController(document.createElement('canvas'), {
      state: 'custom', stateProfiles: { custom: profile }, seed: 7, scheduler
    });
    const b = new OrbController(document.createElement('canvas'), {
      state: 'custom', stateProfiles: { custom: profile }, seed: 7, scheduler
    });
    expect(a.getSnapshot().particles).toEqual(b.getSnapshot().particles);
  });

  it('matches custom particles by stable ids even when input order differs', () => {
    const scheduler = new ManualScheduler();
    const orb = new OrbController(document.createElement('canvas'), {
      state: 'one',
      scheduler,
      stateProfiles: {
        one: { particles: [{ id: 'a', x: 1, y: 1, radius: 1 }, { id: 'b', x: 2, y: 2, radius: 1 }] },
        two: { particles: [{ id: 'b', x: 20, y: 20, radius: 1 }, { id: 'a', x: 10, y: 10, radius: 1 }] }
      }
    });
    orb.setState('two', { transition: { duration: 100, easing: 'linear' } });
    scheduler.advance(50);
    expect(orb.getSnapshot().particles.map((particle) => particle.x)).toEqual([5.5, 11]);
  });
});
