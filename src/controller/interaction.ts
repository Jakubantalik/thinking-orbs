import type { OrbInteractionConfig } from './types';

const DEFAULT_CONFIG: Required<OrbInteractionConfig> = {
  hover: { enabled: false, scale: 1.04, intensity: 0.18, parallax: 0.12, transitionDuration: 220 },
  focus: { enabled: false, useHoverStyle: true },
  pointerdown: false,
  stopPropagation: true
};

export interface InteractionState {
  hovered: boolean;
  focused: boolean;
  amount: number;
  target: number;
  pointerX: number;
  pointerY: number;
  changedAt: number;
  amountAtChange: number;
}

export function normalizeInteraction(config?: OrbInteractionConfig): Required<OrbInteractionConfig> {
  return {
    hover: { ...DEFAULT_CONFIG.hover, ...config?.hover },
    focus: { ...DEFAULT_CONFIG.focus, ...config?.focus },
    pointerdown: config?.pointerdown ?? DEFAULT_CONFIG.pointerdown,
    stopPropagation: config?.stopPropagation ?? DEFAULT_CONFIG.stopPropagation
  };
}

export function createInteractionState(now: number): InteractionState {
  return { hovered: false, focused: false, amount: 0, target: 0, pointerX: 0, pointerY: 0, changedAt: now, amountAtChange: 0 };
}

export function setInteractionTarget(state: InteractionState, target: number, now: number): void {
  state.amountAtChange = state.amount;
  state.changedAt = now;
  state.target = target;
}

export function updateInteraction(
  state: InteractionState,
  config: Required<OrbInteractionConfig>,
  now: number,
  reducedMotion: boolean
): void {
  const duration = reducedMotion ? 0 : config.hover.transitionDuration ?? 220;
  if (duration <= 0) {
    state.amount = state.target;
    return;
  }
  const progress = Math.max(0, Math.min(1, (now - state.changedAt) / duration));
  const eased = progress * progress * (3 - 2 * progress);
  state.amount = state.amountAtChange + (state.target - state.amountAtChange) * eased;
}
