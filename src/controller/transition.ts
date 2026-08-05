import type { OrbStateName } from '../types';
import type {
  CapturedFrame,
  OrbTransitionEvent,
  SetStateOptions,
  TransitionDefinition,
  TransitionInput
} from './types';

export interface ActiveTransition {
  event: OrbTransitionEvent;
  start: number;
  duration: number;
  ease: (progress: number) => number;
  source: CapturedFrame;
  callbacks: SetStateOptions;
  resolve: (result: 'finished' | 'cancelled') => void;
}

export const DEFAULT_TRANSITION: Required<TransitionDefinition> = { duration: 350, easing: 'ease-in-out' };

export function selectTransition(
  input: TransitionInput | undefined,
  from: OrbStateName,
  to: OrbStateName,
  pairs: Map<string, TransitionInput>,
  presets: Map<string, TransitionDefinition>,
  fallback: TransitionInput
): Required<TransitionDefinition> | null {
  const selected = input ?? pairs.get(`${from}->${to}`) ?? fallback;
  if (selected === false) return null;
  const definition = typeof selected === 'string' ? presets.get(selected) : selected;
  if (!definition) return DEFAULT_TRANSITION;
  return {
    duration: definition.duration ?? DEFAULT_TRANSITION.duration,
    easing: definition.easing ?? DEFAULT_TRANSITION.easing
  };
}
