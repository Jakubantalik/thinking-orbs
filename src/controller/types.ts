import type { ModeOpts } from '../engine/profiles';
import type { Line } from '../engine/types';
import type { ModeKey } from '../presets';
import type { OrbSize, OrbStateName } from '../types';

export interface OrbParticleTarget {
  /** Keep this value or array position stable between samples and states. */
  id?: string | number;
  x: number;
  y: number;
  z?: number;
  radius: number;
  /** Monochrome ink value: 0 is darkest ink on paper. */
  brightness?: number;
  opacity?: number;
  color?: readonly [number, number, number];
}

export interface OrbStateSampleContext {
  size: OrbSize;
  time: number;
  seed: number;
}

export interface OrbStateProfile {
  /** Reuse one of the built-in animation painters. */
  mode?: ModeKey;
  speed?: number;
  opts?: ModeOpts;
  /** Or provide ordered targets. The callback must be deterministic. */
  particles?: readonly OrbParticleTarget[] | ((context: OrbStateSampleContext) => readonly OrbParticleTarget[]);
}

export type TransitionEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);

export interface TransitionDefinition {
  duration?: number;
  easing?: TransitionEasing;
}

export type TransitionInput = TransitionDefinition | string | false;

export interface OrbTransitionEvent {
  id: number;
  from: OrbStateName;
  to: OrbStateName;
  progress: number;
  easedProgress: number;
  interrupted: boolean;
}

export interface SetStateOptions {
  from?: OrbStateName;
  transition?: TransitionInput;
  onStart?: (event: OrbTransitionEvent) => void;
  onProgress?: (event: OrbTransitionEvent) => void;
  onEnd?: (event: OrbTransitionEvent) => void;
  onCancel?: (event: OrbTransitionEvent) => void;
}

export interface TransitionHandle {
  id: number;
  cancel: () => void;
  finished: Promise<'finished' | 'cancelled'>;
}

export interface HoverInteractionConfig {
  enabled?: boolean;
  scale?: number;
  intensity?: number;
  parallax?: number;
  transitionDuration?: number;
}

export interface FocusInteractionConfig {
  enabled?: boolean;
  useHoverStyle?: boolean;
}

export interface OrbInteractionConfig {
  hover?: HoverInteractionConfig;
  focus?: FocusInteractionConfig;
  pointerdown?: boolean;
  /** Stops enabled interaction events at the canvas boundary. @default true */
  stopPropagation?: boolean;
}

export interface TransitionConfiguration {
  default?: TransitionInput;
  pairs?: Record<string, TransitionInput>;
}

export interface OrbScheduler {
  now: () => number;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
}

export interface OrbControllerOptions {
  state?: OrbStateName;
  size?: OrbSize;
  dark?: boolean;
  speed?: number;
  paused?: boolean;
  reducedMotion?: boolean;
  seed?: number;
  transition?: TransitionInput;
  transitions?: TransitionConfiguration;
  transitionPresets?: Record<string, TransitionDefinition>;
  interaction?: OrbInteractionConfig;
  stateProfiles?: Record<string, OrbStateProfile>;
  autoStart?: boolean;
  scheduler?: OrbScheduler;
}

export interface CapturedFrame {
  particles: InternalParticle[];
  lines: Line[];
}

export interface InternalParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  r: number;
  white: number;
  a: number;
  rgb?: readonly [number, number, number];
}

export interface OrbSnapshot {
  state: OrbStateName;
  transitioning: boolean;
  particleCount: number;
  interactionAmount: number;
  particles: ReadonlyArray<Readonly<InternalParticle>>;
}
