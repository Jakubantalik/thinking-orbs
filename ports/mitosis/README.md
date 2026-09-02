# thinking-orbs Mitosis port

A ThinkingOrb authored **once** in [Mitosis](https://github.com/BuilderIO/mitosis)
and compiled to **React, Vue, Svelte and Solid**. Every imperative behaviour
(the canvas controller: shared clock, DPR cap, live theme auto-detect,
reduced-motion static frame, offscreen/tab pause) lives in the framework-neutral
`src/orb-controller.ts`, so the generated components stay thin, identical in
behaviour, and drive the same `thinking-orbs/engine` geometry as the reference
web component.

## Layout

```
src/
  ThinkingOrb.lite.tsx   # the single Mitosis source (the component shell)
  orb-controller.ts      # framework-neutral behaviours (copied to all outputs)
  types.ts               # shared public types + labels (copied to all outputs)
mitosis.config.ts        # targets: react, vue, svelte, solid -> output/
output/<target>/src/     # committed generated components + shared controller/types
compile/<target>.ts      # thin entries that import each generated target
scripts/
  compile-checks.mjs     # real-toolchain compile of every generated target
  consumer-check.mjs     # npm pack -> install -> import every framework subpath
test/                    # unit + geometry parity + generated-output tests
```

## Commands

```bash
npm run build           # regenerate all four framework targets via `mitosis build`
npm test                # unit / geometry-parity / generated-output tests
npm run typecheck       # typecheck the port source
npm run compile:check   # real compile (vite + each framework plugin) of all targets
npm run consumer:check  # npm pack + install + import through the exports map
```

## Generated-output note (important)

The generated React target is verified by a **real toolchain compile**
(`compile:check`), not a source read. The Mitosis React generator folds the
whole component onto the same physical line as a leading comment, which would
comment the entire program out — a real React build fails loudly if that
regresses. Consequently the `.lite.tsx` source must not start with a leading
comment; design context lives here instead.

## Behaviour parity

The controller reproduces the web component's semantics exactly:

- one shared `performance.now` clock (all instances stay in phase)
- device-pixel-ratio capped at 2
- three-layer theme auto-detect (`data-theme`/class → `prefers-color-scheme`),
  watched live
- `prefers-reduced-motion: reduce` → a single deterministic static frame at
  `t = 0.6`, and it reacts **live** to a runtime change (stop loop, static
  frame, then resume when motion is re-enabled)
- offscreen (`IntersectionObserver`) + hidden-tab pause, resuming in phase
- `role="img"` with a per-state `aria-label`

`test/orb-geometry.test.ts` proves the reduced-motion frame reproduces the
frozen golden vectors from `spec/orbs-golden.json`, so the port cannot drift
from the shipping pixels.
