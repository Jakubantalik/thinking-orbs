# thinking-orbs

Dotted thought-orb loading indicators for AI & agent UIs. Six hand-tuned animated states, each shipped at two purpose-tuned sizes, rendered on a plain 2D canvas — no WebGL, no filters, works identically in Chrome, Safari and Firefox.

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

## React Native (Expo)

The same six tuned states run natively via a Skia renderer, imported from the
`thinking-orbs/native` subpath. The pure engine geometry is shared with the web
build — the orbs are pixel-faithful — and the entire animation runs on the UI
thread (a Reanimated clock drives a Skia `Picture`), so there is **no per-frame
React render and no JS-thread work**.

```bash
npx expo install @shopify/react-native-skia react-native-reanimated react-native-worklets
```

Add the worklets Babel plugin (must be last) in `babel.config.js`:

```js
module.exports = (api) => {
  api.cache(true);
  return { presets: ['babel-preset-expo'], plugins: ['react-native-worklets/plugin'] };
};
```

The API is identical to the web component (`state` / `size` / `theme` / `speed`
/ `paused`); only `style` differs (a React Native `ViewStyle`). As on web, `size`
selects the tuned design (64 / 20); give `style` a width/height to scale the orb
up — the Skia renderer fills it crisply (vectors), so an 80%-of-screen orb stays
sharp.

```tsx
import { useWindowDimensions } from 'react-native';
import { ThinkingOrb } from 'thinking-orbs/native';

function Status() {
  const { width } = useWindowDimensions();
  const d = Math.round(width * 0.8);
  return <ThinkingOrb state="working" size={64} style={{ width: d, height: d }} />;
}
```

`react-native`, `@shopify/react-native-skia`, `react-native-reanimated` and
`react-native-worklets` are optional peer dependencies — web consumers never
pull them. A runnable Expo demo lives in [`example/`](./example). For a 120 Hz
device, set `CADisableMinimumFrameDurationOnPhone: true` in `app.json`
(`ios.infoPlist`).

## States

Six verbs an agent can be doing, each a distinct animation:

```tsx
<ThinkingOrb state="working" />    {/* particles on tilted orbits */}
<ThinkingOrb state="searching" />  {/* a scan meridian sweeps a dotted globe */}
<ThinkingOrb state="solving" />    {/* bands scramble, then click back solved */}
<ThinkingOrb state="listening" />  {/* a waveform rolls through the rings */}
<ThinkingOrb state="composing" />  {/* an undulating multi-band sash */}
<ThinkingOrb state="shaping" />    {/* dotted outline: circle → triangle → square */}
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

## License

MIT © Jakub Antalik
