# thinking-orbs

Thought-orb loading indicators for AI and agent UIs. Six hand-tuned dotted monochrome states plus four fluid cosmic orbs, each shipped at two purpose-tuned sizes, rendered on a plain 2D canvas. No WebGL, no filters, works identically in Chrome, Safari and Firefox.

[Live demo](https://orbs.jakubantalik.com) · [Repository](https://github.com/Jakubantalik/thinking-orbs) · [Report an issue](https://github.com/Jakubantalik/thinking-orbs/issues) · [Docs index](./docs/INDEX.md) · [Cosmic orbs](./COSMIC_ORBS.md)

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

Six dotted verbs an agent can be doing, plus four fluid cosmic looks:

```tsx
<ThinkingOrb state="working" />    {/* particles on tilted orbits */}
<ThinkingOrb state="searching" />  {/* a scan meridian sweeps a dotted globe */}
<ThinkingOrb state="solving" />    {/* bands scramble, then click back solved */}
<ThinkingOrb state="listening" />  {/* a waveform rolls through the rings */}
<ThinkingOrb state="composing" />  {/* an undulating multi-band sash */}
<ThinkingOrb state="shaping" />    {/* dotted outline: circle → triangle → square */}
<ThinkingOrb state="cosmic" />     {/* swirling galaxy core with star dust */}
<ThinkingOrb state="nebula" />     {/* purple/magenta atmospheric pulse */}
<ThinkingOrb state="liquid" />     {/* fluid organic glass bubble */}
<ThinkingOrb state="nova" />       {/* amber flare with prismatic rim */}
```

Cosmic states use vibrant adaptive color (tuned for dark and light substrates). See [COSMIC_ORBS.md](./COSMIC_ORBS.md) for the paint pipeline and performance notes.

## Sizes

Two tuned presets: separate designs, not a scale factor. `64` for chat-avatar scale, `20` for inline-text scale. Each carries its own density, size and speed tuning:

```tsx
<ThinkingOrb state="working" size={64} />
<ThinkingOrb state="working" size={20} />
<ThinkingOrb state="cosmic" size={64} />
```

## Theme

Dotted states are strictly monochrome (light ink on dark backgrounds, dark ink on light). Cosmic states keep a vivid palette and scale glow/star/rim alpha for the substrate. Mode is picked automatically from the host project:

```tsx
<ThinkingOrb theme="auto" />   {/* default: detects from the project */}
<ThinkingOrb theme="dark" />   {/* pin: dark-substrate palette */}
<ThinkingOrb theme="light" />  {/* pin: light-substrate palette */}
```

`auto` resolves in three layers and updates live when any of them change:

1. an ancestor `data-theme="dark|light"` attribute or `dark`/`light` class (the Tailwind / shadcn convention), watched via `MutationObserver`;
2. otherwise `prefers-color-scheme`, subscribed for live OS theme switches;
3. SSR-safe: the canvas paints only on the client, after the theme has resolved.

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
- `prefers-reduced-motion: reduce` renders a static representative frame (no animation) and still follows the live theme.
- Every instance pauses automatically when scrolled offscreen (`IntersectionObserver`) or when the tab is hidden, and resumes in phase. All instances share one clock.
- Plain 2D canvas only: no `ctx.filter`, no SVG filters, no WebGL. The same pixels everywhere, cheap on low-end devices. Device-pixel-ratio capped at 2.

## License

MIT © Jakub Antalik
