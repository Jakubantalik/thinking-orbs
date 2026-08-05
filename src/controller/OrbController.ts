import type { OrbSize, OrbStateName } from '../types';
import { attachOrbDom } from './dom';
import { resolveEasing } from './easing';
import { OrbTransitionEvents, type TransitionEventName, type TransitionListener } from './events';
import {
  createInteractionState,
  normalizeInteraction,
  setInteractionTarget,
  updateInteraction,
  type InteractionState
} from './interaction';
import { OrbRenderLoop } from './loop';
import { expandFrame, interpolateFrames, sampleState } from './particles';
import { applyInteraction, makeSnapshot, paintFrame, resizeCanvas } from './renderer';
import { createDefaultScheduler } from './scheduler';
import { DEFAULT_TRANSITION, selectTransition, type ActiveTransition } from './transition';
import type {
  CapturedFrame,
  OrbControllerOptions,
  OrbInteractionConfig,
  OrbSnapshot,
  OrbScheduler,
  OrbStateProfile,
  SetStateOptions,
  TransitionDefinition,
  TransitionHandle,
  TransitionInput
} from './types';

export class OrbController {
  readonly canvas: HTMLCanvasElement;
  state: OrbStateName;
  private size: OrbSize;
  private dark: boolean;
  private speed: number;
  private paused: boolean;
  private reducedMotion: boolean;
  private readonly seed: number;
  private readonly scheduler: OrbScheduler;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private capacity = 0;
  private transitionId = 0;
  private destroyed = false;
  private visible = true;
  private lastBase?: CapturedFrame;
  private lastVisual?: CapturedFrame;
  private active?: ActiveTransition;
  private defaultTransition: TransitionInput;
  private transitions = new Map<string, TransitionInput>();
  private presets = new Map<string, TransitionDefinition>();
  private profiles: Record<string, OrbStateProfile>;
  private interactionConfig: Required<OrbInteractionConfig>;
  private interaction: InteractionState;
  private readonly events: OrbTransitionEvents;
  private cleanups: Array<() => void> = [];
  private readonly loop: OrbRenderLoop;

  constructor(canvas: HTMLCanvasElement, options: OrbControllerOptions = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('thinking-orbs: a 2D canvas context is required');
    this.canvas = canvas;
    this.events = new OrbTransitionEvents(canvas);
    this.ctx = ctx;
    this.state = options.state ?? 'working';
    this.size = options.size ?? 64;
    this.dark = options.dark ?? true;
    this.speed = options.speed ?? 1;
    this.paused = options.paused ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.seed = options.seed ?? 1;
    this.scheduler = options.scheduler ?? createDefaultScheduler();
    this.loop = new OrbRenderLoop(this.scheduler, (now) => this.renderAt(now));
    this.defaultTransition = options.transitions?.default ?? options.transition ?? DEFAULT_TRANSITION;
    for (const [pair, transition] of Object.entries(options.transitions?.pairs ?? {})) this.transitions.set(pair, transition);
    for (const [name, transition] of Object.entries(options.transitionPresets ?? {})) this.presets.set(name, transition);
    this.profiles = { ...options.stateProfiles };
    this.interactionConfig = normalizeInteraction(options.interaction);
    this.interaction = createInteractionState(this.scheduler.now());
    this.dpr = resizeCanvas(this.canvas, this.size);
    this.cleanups.push(attachOrbDom(canvas, {
      config: () => this.interactionConfig,
      hover: (active) => {
        this.interaction.hovered = active;
        this.updateInteractionTarget(this.scheduler.now());
      },
      focus: (active) => {
        this.interaction.focused = active;
        this.updateInteractionTarget(this.scheduler.now());
      },
      pointer: (x, y) => {
        this.interaction.pointerX = x;
        this.interaction.pointerY = y;
        if (this.reducedMotion) this.renderAt(this.scheduler.now());
      },
      visibility: (visible) => {
        this.visible = visible;
        this.syncLoop();
      }
    }));
    this.renderAt(this.scheduler.now());
    if (options.autoStart !== false) this.syncLoop();
    else this.loop.setEnabled(false);
  }

  setState(to: OrbStateName, options: SetStateOptions = {}): TransitionHandle {
    const now = this.scheduler.now();
    this.renderAt(now);
    const previous = this.state;
    const source = options.from && !this.active ? this.sample(options.from, now) : this.lastBase ?? this.sample(previous, now);
    if (this.active) this.cancelActive(true);
    const definition = selectTransition(
      options.transition,
      options.from ?? previous,
      to,
      this.transitions,
      this.presets,
      this.defaultTransition
    );
    this.state = to;
    const target = this.sample(to, now);
    this.capacity = Math.max(this.capacity, source.particles.length, target.particles.length);
    const id = ++this.transitionId;
    let finish!: (result: 'finished' | 'cancelled') => void;
    const finished = new Promise<'finished' | 'cancelled'>((resolve) => {
      finish = resolve;
    });
    const event = { id, from: options.from ?? previous, to, progress: 0, easedProgress: 0, interrupted: false };
    if (!definition || this.reducedMotion || definition.duration <= 0) {
      this.lastBase = expandFrame(target, this.capacity, this.seed);
      this.events.emit('transitionstart', event, options.onStart);
      const end = { ...event, progress: 1, easedProgress: 1 };
      this.events.emit('transitionprogress', end, options.onProgress);
      this.events.emit('transitionend', end, options.onEnd);
      finish('finished');
      this.renderAt(now);
    } else {
      this.active = {
        event,
        start: now,
        duration: definition.duration,
        ease: resolveEasing(definition.easing),
        source: expandFrame(source, this.capacity, this.seed),
        callbacks: options,
        resolve: finish
      };
      this.events.emit('transitionstart', event, options.onStart);
      this.events.emit('transitionprogress', event, options.onProgress);
      this.syncLoop();
    }
    return { id, cancel: () => this.cancelTransition(id), finished };
  }

  cancelTransition(id?: number): void {
    if (!this.active || (id != null && this.active.event.id !== id)) return;
    this.cancelActive(false);
  }

  renderAt(now: number): void {
    if (this.destroyed) return;
    let base: CapturedFrame;
    if (this.active) {
      const progress = Math.max(0, Math.min(1, (now - this.active.start) / this.active.duration));
      const eased = this.active.ease(progress);
      const target = expandFrame(this.sample(this.state, now), this.capacity, this.seed);
      base = interpolateFrames(this.active.source, target, eased, this.seed);
      this.active.event = { ...this.active.event, progress, easedProgress: eased };
      this.events.emit('transitionprogress', this.active.event, this.active.callbacks.onProgress);
      if (progress >= 1) this.finishActive();
    } else {
      const sampled = this.sample(this.state, now);
      this.capacity = Math.max(this.capacity, sampled.particles.length);
      base = expandFrame(sampled, this.capacity, this.seed);
    }
    this.lastBase = base;
    updateInteraction(this.interaction, this.interactionConfig, now, this.reducedMotion);
    const visual = applyInteraction(base, this.size, this.interactionConfig, this.interaction);
    this.lastVisual = visual;
    paintFrame(this.ctx, visual, this.size, this.dpr, this.dark);
  }

  on(type: TransitionEventName, listener: TransitionListener): () => void {
    return this.events.on(type, listener);
  }

  getSnapshot(): OrbSnapshot {
    return makeSnapshot(this.state, Boolean(this.active), this.interaction.amount, this.lastVisual ?? this.lastBase);
  }

  setInteraction(config: OrbInteractionConfig): void {
    this.interactionConfig = normalizeInteraction(config);
    this.updateInteractionTarget(this.scheduler.now());
  }

  registerTransitionPreset(name: string, definition: TransitionDefinition): void {
    this.presets.set(name, definition);
  }

  registerStateProfile(name: string, profile: OrbStateProfile): void {
    this.profiles[name] = profile;
  }

  setAppearance(options: { dark?: boolean; speed?: number; paused?: boolean; reducedMotion?: boolean }): void {
    if (options.dark != null) this.dark = options.dark;
    if (options.speed != null) this.speed = options.speed;
    if (options.paused != null) this.paused = options.paused;
    if (options.reducedMotion != null) {
      this.reducedMotion = options.reducedMotion;
      if (this.reducedMotion && this.active) this.finishActive();
    }
    this.renderAt(this.scheduler.now());
    this.syncLoop();
  }

  setSize(size: OrbSize): void {
    if (size === this.size) return;
    this.size = size;
    this.capacity = 0;
    this.dpr = resizeCanvas(this.canvas, this.size);
    this.renderAt(this.scheduler.now());
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancelActive(false);
    this.destroyed = true;
    this.loop.stop();
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.events.clear();
  }

  private sample(state: OrbStateName, now: number): CapturedFrame {
    return sampleState(state, this.size, (now / 1000) * this.speed, this.seed, this.profiles);
  }

  private finishActive(): void {
    const active = this.active;
    if (!active) return;
    this.active = undefined;
    const event = { ...active.event, progress: 1, easedProgress: 1 };
    this.events.emit('transitionend', event, active.callbacks.onEnd);
    active.resolve('finished');
  }

  private cancelActive(interrupted: boolean): void {
    const active = this.active;
    if (!active) return;
    this.active = undefined;
    const event = { ...active.event, interrupted };
    this.events.emit('transitioncancel', event, active.callbacks.onCancel);
    active.resolve('cancelled');
  }

  private syncLoop(): void {
    this.loop.setEnabled(!this.paused && !this.reducedMotion && this.visible && !this.destroyed);
  }

  private updateInteractionTarget(now: number): void {
    const hover = Boolean(this.interactionConfig.hover.enabled && this.interaction.hovered);
    const focus = Boolean(this.interactionConfig.focus.enabled && this.interactionConfig.focus.useHoverStyle && this.interaction.focused);
    setInteractionTarget(this.interaction, hover || focus ? 1 : 0, now);
    if (this.reducedMotion) this.renderAt(now);
    else this.syncLoop();
  }

}
