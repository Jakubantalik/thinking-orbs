import { vi } from 'vitest';
import type { OrbScheduler } from '../../src/controller/types';

export class ManualScheduler implements OrbScheduler {
  time = 0;
  nextId = 1;
  callbacks = new Map<number, FrameRequestCallback>();
  now = () => this.time;
  requestFrame = (callback: FrameRequestCallback) => {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  };
  cancelFrame = (id: number) => {
    this.callbacks.delete(id);
  };
  advance(milliseconds: number) {
    this.time += milliseconds;
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks) callback(this.time);
  }
}

export function installCanvasMock() {
  const context = {
    setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fillStyle: '', strokeStyle: '', lineWidth: 1
  } as unknown as CanvasRenderingContext2D;
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  return { context, getContext };
}

export function pointer(type: string, pointerType = 'mouse', x = 32, y = 32): Event {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: pointerType }, clientX: { value: x }, clientY: { value: y }
  });
  return event;
}
