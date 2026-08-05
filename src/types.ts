import type { CSSProperties, CanvasHTMLAttributes } from 'react';

/**
 * The nine shipped states — each a hand-tuned animation:
 * - `working`    — particles on tilted orbits
 * - `searching`  — a scan meridian sweeps a dotted globe
 * - `solving`    — bands scramble in quarter turns, then click back
 * - `listening`  — a waveform rolls through latitude rings
 * - `connecting` — a constellation wires itself, packets running the edges
 * - `weaving`    — three strands plait around the sphere
 * - `composing`  — an undulating multi-band sash
 * - `breathing`  — a face-on ring slowly morphing
 * - `shaping`    — a dotted outline morphs circle → triangle → square
 */
export type OrbState =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping'
  | 'success'
  | 'error';

/** A shipped state or an application-defined state profile name. */
export type OrbStateName = OrbState | (string & {});

/**
 * Rendered size in CSS pixels. Exactly two tuned presets ship:
 * 64 (chat-avatar scale) and 20 (inline-text scale). Each size carries
 * its own dot count, dot size and speed tuning — they are separate
 * designs, not a scale factor.
 */
export type OrbSize = 64 | 20;

/**
 * Theme mode.
 *
 * - `auto` (default) resolves in three layers, live-updating on change:
 *   1. a `data-theme="dark|light"` attribute or `dark`/`light` class on
 *      any ancestor (the Tailwind / shadcn convention), watched via
 *      `MutationObserver`;
 *   2. otherwise `matchMedia('(prefers-color-scheme: dark)')`,
 *      subscribed for live OS/browser theme switches;
 *   3. during SSR (no DOM) the first client render resolves the theme
 *      before anything is painted — the canvas is client-only.
 * - `dark` / `light` pin the palette regardless of context.
 *
 * Dark renders light ink on the transparent canvas (for dark
 * backgrounds); light renders dark ink (for light backgrounds).
 */
export type OrbTheme = 'auto' | 'dark' | 'light';

/** Props for the ThinkingOrb React component. */
export interface ThinkingOrbProps extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'style'> {
  /** Which animation to show. @default 'working' */
  state?: OrbStateName;

  /** Tuned size preset — 64 or 20 CSS px. @default 64 */
  size?: OrbSize;

  /** Theme mode; `auto` detects from the host project. @default 'auto' */
  theme?: OrbTheme;

  /**
   * Animation speed multiplier on top of the preset's baked speed.
   * @default 1
   */
  speed?: number;

  /** Freeze the animation on the current frame. @default false */
  paused?: boolean;

  /** Default state transition. Pass `false` to retain instant switching. */
  transition?: import('./controller/types').TransitionInput;

  /** Default and state-pair transition configuration for this orb. */
  transitions?: import('./controller/types').TransitionConfiguration;

  /** Named transition definitions available to this orb. */
  transitionPresets?: Record<string, import('./controller/types').TransitionDefinition>;

  /** Temporary pointer/focus visual treatment layered over every state. */
  interaction?: import('./controller/types').OrbInteractionConfig;

  /** Additional reusable state profiles. */
  stateProfiles?: Record<string, import('./controller/types').OrbStateProfile>;

  /** Stable seed used when a transition needs additional particle slots. */
  seed?: number;

  /** Simulate or override reduced motion. Omit to follow the OS preference. */
  reducedMotion?: boolean;

  /** Receives the persistent imperative controller after mount. */
  controllerRef?: import('react').Ref<import('./controller/OrbController').OrbController>;

  onOrbTransitionStart?: (event: import('./controller/types').OrbTransitionEvent) => void;
  onOrbTransitionProgress?: (event: import('./controller/types').OrbTransitionEvent) => void;
  onOrbTransitionEnd?: (event: import('./controller/types').OrbTransitionEvent) => void;
  onOrbTransitionCancel?: (event: import('./controller/types').OrbTransitionEvent) => void;

  style?: CSSProperties;
}
