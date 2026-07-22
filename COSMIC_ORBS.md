# Cosmic Orbs

Fluid, colorful cosmic thinking-orb states for `thinking-orbs`. Same programmatic API as the dotted monochrome modes: Canvas 2D only, no WebGL, no `ctx.filter`, offscreen pause, reduced-motion static frame, auto theme.

Related docs:

- [README](./README.md) – install, quick start, all states
- [Docs index](./docs/INDEX.md) – documentation map
- [Security audit](./SECURITY_AUDIT.md) – threat model notes

## States

| State    | Mode key | Look |
| -------- | -------- | ---- |
| `cosmic` | `cosmic` | Swirling violet galaxy core, star dust, glass rim |
| `nebula` | `nebula` | Soft purple/magenta atmospheric pulse |
| `liquid` | `liquid` | Organic blob shell with gold void and prism fringe |
| `nova`   | `nova`   | Amber/golden flare with energetic core |

```tsx
import { ThinkingOrb } from 'thinking-orbs';

<ThinkingOrb state="cosmic" size={64} />
<ThinkingOrb state="nebula" size={20} />
<ThinkingOrb state="liquid" />
<ThinkingOrb state="nova" theme="dark" />
```

## Rendering pipeline

Each frame paints four cheap layers inside a clipped shell:

1. **Void wash** – radial dark fill for depth
2. **Orbiting glows** – 2–3 `createRadialGradient` lobes that drift over time
3. **Starfield** – Fibonacci lattice projected with `makeProj`, z-sorted, twinkling alpha
4. **Glass shell** – rim stroke, specular ellipse, optional prism arc fringes

`liquid` replaces the circular clip with a polar harmonic path:

`R(θ) = R₀ (1 + A₁ sin(2θ + ω₁t) + A₂ cos(3θ − ω₂t) + …)`

so the silhouette wobbles without vertex buffers or shaders.

## Theme adaptation

Palettes stay vivid. Alpha multipliers shift by substrate:

- **Dark**: full glow / star / rim multipliers
- **Light**: glow ×0.72, star ×0.85, rim ×0.9 so colors stay readable on light UI chrome

Detection is unchanged (`theme="auto" | "dark" | "light"` via [`src/theme.ts`](./src/theme.ts)).

## Performance budget

| Size | Stars (base) | Typical draw cost |
| ---- | ------------ | ----------------- |
| 64   | ~48–60       | few gradient fills + ~60 arcs |
| 20   | ~20–28 (count-scaled) | same path, fewer stars |

No textures, no WebGL context, no filters. Instances still share the clock and pause when offscreen or when the tab is hidden ([`ThinkingOrb.tsx`](./src/ThinkingOrb.tsx)).

## Source map

| File | Role |
| ---- | ---- |
| [`src/engine/cosmic.ts`](./src/engine/cosmic.ts) | Frame painters + palettes |
| [`src/engine/profiles.ts`](./src/engine/profiles.ts) | Base `starN` / glow / wobble opts |
| [`src/presets.ts`](./src/presets.ts) | State → mode map, 64/20 tunings |
| [`src/engine/registry.ts`](./src/engine/registry.ts) | `MODE_DRAWS` registration |
| [`src/types.ts`](./src/types.ts) | `OrbState` union |

## Technical debt / follow-ups

- Cosmic modes bypass the grayscale `paint()` path and draw color directly. A shared colored-dot helper would reduce duplication if more color modes land.
- Prism rims are stroked arcs, not true refraction. Good enough at 20–64px; a full Fresnel/chromatic look would need WebGL and would break the "no WebGL" contract.
- Light-theme cosmic contrast may need per-host background tuning; consider an optional `palette` prop later if consumers need brand colors.

## Fixes

- **Liquid transparent bulges** (2026-07-22): interior fill radius now uses `baseR * (1 + wobAmp)` to match `liquidPath` max extent, and the shell gradient uses the same `R`, so wobble lobes stay opaque.
