import type { OrbTransitionEvent } from './types';

export type TransitionEventName = 'transitionstart' | 'transitionprogress' | 'transitionend' | 'transitioncancel';
export type TransitionListener = (event: OrbTransitionEvent) => void;

export class OrbTransitionEvents {
  private listeners = new Map<TransitionEventName, Set<TransitionListener>>();

  constructor(private readonly canvas: HTMLCanvasElement) {}

  on(type: TransitionEventName, listener: TransitionListener): () => void {
    const group = this.listeners.get(type) ?? new Set<TransitionListener>();
    group.add(listener);
    this.listeners.set(type, group);
    return () => group.delete(listener);
  }

  emit(type: TransitionEventName, event: OrbTransitionEvent, callback?: TransitionListener): void {
    callback?.(event);
    for (const listener of this.listeners.get(type) ?? []) listener(event);
    this.canvas.dispatchEvent(new CustomEvent(`orb${type}`, { detail: event }));
  }

  clear(): void {
    this.listeners.clear();
  }
}
