export { ThinkingOrb } from './ThinkingOrb';

export type { ThinkingOrbProps, OrbState, OrbStateName, OrbSize, OrbTheme } from './types';

export { OrbController } from './controller/OrbController';
export { createOrb } from './controller/createOrb';
export type {
  OrbControllerOptions,
  OrbInteractionConfig,
  OrbParticleTarget,
  OrbSnapshot,
  OrbStateProfile,
  OrbTransitionEvent,
  SetStateOptions,
  TransitionConfiguration,
  TransitionDefinition,
  TransitionHandle,
  TransitionInput
} from './controller/types';

// Power-user surface: the resolved presets + raw frame painters, for
// consumers driving their own canvas outside React.
export { resolvePreset, STATE_TO_MODE, type ModeKey, type Resolved } from './presets';
export { MODE_DRAWS } from './engine/registry';
