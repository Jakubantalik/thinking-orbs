# thinking-orbs

Dotted thought-orb loading indicators for AI & agent UIs. Nine hand-tuned animated states, each shipped at two purpose-tuned sizes, rendered on a plain 2D canvas — no WebGL, no filters, works identically in Chrome, Safari and Firefox.

[Live demo](https://orbs.jakubantalik.com) · [Repository](https://github.com/Jakubantalik/thinking-orbs) · [Report an issue](https://github.com/Jakubantalik/thinking-orbs/issues)

## Install

```bash
npm install thinking-orbs
```

## Quick start

```tsx
import { ThinkingOrb } from 'thinking-orbs';

function Status() {
  return <ThinkingOrb state="searching" size={64} />;
}
```

## States

Nine verbs an agent can be doing, each a distinct animation:

```tsx
<ThinkingOrb state="working" />     {/* particles on tilted orbits */}
<ThinkingOrb state="searching" />   {/* a scan meridian sweeps a dotted globe */}
<ThinkingOrb state="solving" />     {/* bands scramble, then click back solved */}
<ThinkingOrb state="listening" />   {/* a waveform rolls through the rings */}
<ThinkingOrb state="connecting" />  {/* a constellation wires itself */}
<ThinkingOrb state="weaving" />     {/* three strands plait around the sphere */}
<ThinkingOrb state="composing" />   {/* an undulating multi-band sash */}
<ThinkingOrb state="breathing" />   {/* a ring slowly morphing */}
<ThinkingOrb state="shaping" />     {/* dotted outline: circle → triangle → square */}
```

## Sizes

Two tuned presets — separate designs, not a scale factor. `64` for chat-avatar scale, `20` for inline-text scale. Each carries its own dot count, dot size and speed tuning:

```tsx
<ThinkingOrb state="working" size={64} />
<ThinkingOrb state="working" size={20} />
```

## Theme

Strictly monochrome — light ink for dark backgrounds, dark ink for light backgrounds — with the mode picked automatically from the host project:

```tsx
<ThinkingOrb theme="auto" />   {/* default — detects from the project */}
<ThinkingOrb theme="dark" />   {/* pin: light dots for dark backgrounds */}
<ThinkingOrb theme="light" />  {/* pin: dark dots for light backgrounds */}
```

`auto` resolves in three layers and updates live when any of them change:

1. an ancestor `data-theme="dark|light"` attribute or `dark`/`light` class (the Tailwind / shadcn convention), watched via `MutationObserver`;
2. otherwise `prefers-color-scheme`, subscribed for live OS theme switches;
3. SSR-safe — the canvas paints only on the client, after the theme has resolved.

## Other props

```tsx
<ThinkingOrb
  state="solving"
  size={20}
  speed={1.5}          // multiplier on the preset's baked speed
  paused={false}       // freeze on the current frame
  aria-label="Analysing repository…"  // overrides the per-state default
/>
```

All other `<canvas>` props (`className`, `style`, `data-*`, …) pass through.

## Accessibility & performance

- `role="img"` with a sensible per-state `aria-label` out of the box.
- `prefers-reduced-motion: reduce` renders a static representative frame — no animation — and still follows the live theme.
- Every instance pauses automatically when scrolled offscreen (`IntersectionObserver`) or when the tab is hidden, and resumes in phase — all instances share one clock.
- Plain 2D canvas arcs only: no `ctx.filter`, no SVG filters, no WebGL — the same pixels everywhere, cheap on low-end devices. Device-pixel-ratio capped at 2.

## State transitions

State changes morph individual particles rather than replacing the canvas. Existing dots keep a stable pool index while position, radius, ink, opacity and optional RGB colour interpolate. The pool only grows when a target needs more particles and never shrinks for the lifetime of an orb. Newly required slots start hidden at deterministic, seed-selected source positions.

React state changes transition automatically with a 350 ms `ease-in-out` fallback:

```tsx
const presets = {
  gentle: { duration: 650, easing: 'ease-in-out' },
  snappy: { duration: 180, easing: 'ease-out' }
};

<ThinkingOrb
  state={state}
  transition="gentle"
  transitionPresets={presets}
  onOrbTransitionEnd={({ to }) => console.log(`${to} is visible`)}
/>
```

Pass `transition={false}` for the pre-transition instant-switch behaviour. A missing pair or named preset falls back to the default. A new state change cancels the active handle and starts from the exact currently rendered particle snapshot.

State-pair overrides use `transitions={{ default, pairs: { 'thinking->error': { duration: 160, easing: 'ease-out' } } }}`. Per-call `setState(..., { transition })` wins over a pair, which wins over the default.

The framework-independent controller exposes explicit `from`, interruption and cancellation:

```ts
import { createOrb } from 'thinking-orbs';

const orb = createOrb(document.querySelector('canvas'), {
  state: 'thinking',
  transitionPresets: { deliberate: { duration: 350, easing: 'ease-in-out' } }
});

orb.on('transitionprogress', ({ progress }) => console.log(progress));
const handle = orb.setState('searching', {
  from: 'thinking',
  transition: 'deliberate'
});

handle.cancel();
orb.destroy();
```

`transitionstart`, `transitionprogress`, `transitionend` and `transitioncancel` are available through `orb.on(...)`. Namespaced `orbtransitionstart`, `orbtransitionprogress`, `orbtransitionend` and `orbtransitioncancel` `CustomEvent`s are dispatched on the canvas. Per-call callbacks are released when a transition finishes or is cancelled. `renderAt(timestamp)` plus an optional scheduler make progress deterministic in tests.

## Pointer and keyboard interaction

Interaction is a temporary visual layer after the base state and transition. It never calls `setState`, reseeds particles or creates another renderer:

```tsx
<ThinkingOrb
  state="searching"
  interaction={{
    hover: { enabled: true, scale: 1.04, intensity: 0.18, parallax: 0.12, transitionDuration: 220 },
    focus: { enabled: true, useHoverStyle: true }
  }}
/>
```

The canvas receives normal `pointerenter`, `pointerleave`, `pointermove`, optional `pointerdown`, `focus` and `blur` DOM events. Enabled pointer interactions stop propagation at the canvas boundary by default; set `stopPropagation: false` to opt out. Focus-enabled React orbs receive `tabIndex={0}` unless the host supplies one. Touch pointers never activate hover, and touch scrolling remains available.

## Reduced motion

The React component follows `prefers-reduced-motion` by default. Use `reducedMotion={true|false}` to simulate or override it. Under reduced motion, state targets are applied immediately while start â†’ progress(1) â†’ end still fires. Particle identity and the single canvas remain intact.

## Custom state profiles and particle identity

Hosts can reuse an engine mode or supply deterministic target positions. Keep `id` or array order stable between calls. Coordinates are CSS pixels in the orb canvas; do not shuffle or randomly reseed the array:

```ts
const states = {
  waitingForTool: {
    particles: ({ size, seed }) => fixedTargets.map((target, index) => ({
      id: target.id ?? index,
      x: target.x * size,
      y: target.y * size,
      z: target.z,
      radius: target.radius,
      brightness: target.brightness,
      opacity: target.opacity
    }))
  },
  calm: { mode: 'ring', speed: 0.7, opts: { wobMul: 0.2 } }
};

const orb = createOrb(canvas, { state: 'calm', stateProfiles: states, seed: 42 });
orb.setState('waitingForTool');
```

The sampler callback must be pure for the same `{ size, time, seed }`. A fixed seed makes new pool slots reproducible. Different shapes may return different visible counts; the controller keeps the larger stable pool and parks surplus identities invisibly at deterministic target positions.

## Status accessibility

The orb is an image, not a live region. Give it an `aria-label` for the visible UI status, and let the host announce meaningful status text separately:

```tsx
<ThinkingOrb state="searching" aria-label="Searching sources" />
<span role="status" aria-live="polite" className="sr-only">Searching sources</span>
```

These labels describe UI state only. They do not expose or claim access to model reasoning or hidden chain-of-thought.

## Backwards compatibility

All original states, sizes, props, raw painters and package entry points remain available. The additions are new states, controller exports and optional props. There is still one transparent 2D canvas per `ThinkingOrb`; no framework dependency was added to the engine. Use `transition={false}` when an existing product requires immediate prop changes.

## License

MIT © Jakub Antalik
