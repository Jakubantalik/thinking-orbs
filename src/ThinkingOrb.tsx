import { useEffect, useRef } from 'react';
import { OrbController } from './controller/OrbController';
import type { OrbControllerOptions } from './controller/types';
import { useReducedMotion, useResolvedDark } from './theme';
import type { ThinkingOrbProps } from './types';

const LABELS: Record<string, string> = {
  idle: 'Idle',
  thinking: 'Thinking…',
  working: 'Working…',
  searching: 'Searching…',
  solving: 'Solving…',
  listening: 'Listening…',
  connecting: 'Connecting…',
  weaving: 'Weaving…',
  composing: 'Composing…',
  breathing: 'Thinking…',
  shaping: 'Shaping…',
  success: 'Complete',
  error: 'Error'
};

export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'auto',
  speed = 1,
  paused = false,
  transition,
  transitions,
  transitionPresets,
  interaction,
  stateProfiles,
  seed,
  reducedMotion,
  controllerRef,
  onOrbTransitionStart,
  onOrbTransitionProgress,
  onOrbTransitionEnd,
  onOrbTransitionCancel,
  style,
  'aria-label': ariaLabel,
  tabIndex,
  ...rest
}: ThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controller = useRef<OrbController | null>(null);
  const dark = useResolvedDark(theme, canvasRef);
  const systemReduced = useReducedMotion();
  const effectiveReduced = reducedMotion ?? systemReduced;
  const initialOptions = useRef<OrbControllerOptions | null>(null);
  if (!initialOptions.current) {
    initialOptions.current = {
      state,
      size,
      dark,
      speed,
      paused,
      reducedMotion: effectiveReduced,
      transition,
      transitions,
      transitionPresets,
      interaction,
      stateProfiles,
      seed
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const orb = new OrbController(canvas, initialOptions.current ?? {});
    controller.current = orb;
    return () => {
      controller.current = null;
      orb.destroy();
    };
  }, []);

  useEffect(() => {
    assignRef(controllerRef, controller.current);
    return () => assignRef(controllerRef, null);
  }, [controllerRef]);

  useEffect(() => {
    const orb = controller.current;
    if (!orb || orb.state === state) return;
    orb.setState(state, {
      transition,
      onStart: onOrbTransitionStart,
      onProgress: onOrbTransitionProgress,
      onEnd: onOrbTransitionEnd,
      onCancel: onOrbTransitionCancel
    });
  }, [state, transition, onOrbTransitionStart, onOrbTransitionProgress, onOrbTransitionEnd, onOrbTransitionCancel]);

  useEffect(() => controller.current?.setSize(size), [size]);
  useEffect(
    () => controller.current?.setAppearance({ dark, speed, paused, reducedMotion: effectiveReduced }),
    [dark, speed, paused, effectiveReduced]
  );
  useEffect(() => {
    controller.current?.setInteraction(interaction ?? {});
  }, [interaction]);
  useEffect(() => {
    const orb = controller.current;
    if (!orb) return;
    for (const [name, definition] of Object.entries(transitionPresets ?? {})) orb.registerTransitionPreset(name, definition);
  }, [transitionPresets]);
  useEffect(() => {
    const orb = controller.current;
    if (!orb) return;
    for (const [name, profile] of Object.entries(stateProfiles ?? {})) orb.registerStateProfile(name, profile);
  }, [stateProfiles]);

  const focusable = interaction?.focus?.enabled ? 0 : undefined;
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel ?? LABELS[state] ?? state}
      tabIndex={tabIndex ?? focusable}
      style={{ width: size, height: size, display: 'block', pointerEvents: 'auto', ...style }}
      {...rest}
    />
  );
}

function assignRef<T>(ref: import('react').Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as import('react').MutableRefObject<T | null>).current = value;
}
