import type { OrbScheduler } from './types';

export function createDefaultScheduler(): OrbScheduler {
  return {
    now: () => performance.now(),
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (id) => cancelAnimationFrame(id)
  };
}
