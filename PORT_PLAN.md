# Port plan: thinking-orbs → iOS (SwiftUI) + React Native

Structure and process follow the border-beam port (`~/Dropbox/dev/border-beam`):
ports live in this repo under `ports/`, tunings are extracted into a versioned
`spec/`, and a parity harness under `demo/` freezes time and diffs renders.

Decisions (agreed 2026-08-11):

- **iOS:** SwiftUI, iOS 15+, `Canvas` + `TimelineView(.animation)`. No Metal —
  unlike border-beam there are no gradient stacks or filters to reproduce; every
  frame is plain z-sorted grayscale circle fills (plus line strokes for `web`).
- **React Native:** `@shopify/react-native-skia` + `react-native-reanimated`,
  iOS **and** Android, Expo-compatible.
- **Scope:** all 9 states (`working`, `searching`, `solving`, `listening`,
  `connecting`, `weaving`, `composing`, `breathing`, `shaping`) × 2 sizes
  (64, 20) × dark/light.
- **Fidelity:** geometry-exact parity. Border-beam had to settle for
  "pixel-close" because it reimplemented CSS gradients as shaders; here the
  renderer is trivial and the geometry is deterministic in `t`, so ports are
  verified by comparing **dot lists as numbers** (position/radius/ink/alpha per
  dot at fixed timestamps), with pixel diffing only as a final sanity layer.

## What is being ported

- **Engine** (`src/engine/`, ~940 lines, zero deps, pure math): 9 mode painters
  producing 24–600 dots per frame — shared spin/tilt/orthographic projection
  (`makeProj`), Fibonacci sphere lattice, deterministic hash/value noise,
  arc-length-resampled shape morphing, z-sort + depth-mapped radius/ink/alpha
  (`paint`). One mode (`web`) additionally strokes proximity edges.
- **Presets** (`src/presets.ts`, `src/engine/profiles.ts`): per (state × size)
  baked speed/count/size multipliers + mode extras, resolved through
  `scaleCounts` (√-paired lattice scaling) and `scaleRadii`.
- **Component behaviors** (`src/ThinkingOrb.tsx`, `src/theme.ts`): shared
  `performance.now` clock, DPR cap 2, 3-layer theme auto-detect, reduced-motion
  static frame, off-screen/hidden auto-pause, `role="img"` + per-state label.

Platform equivalents for the behaviors:

| Web | React Native | SwiftUI |
|---|---|---|
| `matchMedia` + ancestor `data-theme` observer | `useColorScheme()` (`theme` prop overrides) | `\.colorScheme` environment (`theme` param overrides) |
| `prefers-reduced-motion` → static frame | `AccessibilityInfo.isReduceMotionEnabled` → static frame | `\.accessibilityReduceMotion` → static frame |
| IntersectionObserver / `visibilitychange` pause | `AppState` background pause (+ `paused` prop) | `TimelineView` pauses off-screen by itself |
| `aria-label` | `accessibilityRole="image"` + label | `.accessibilityLabel` |

## Phase 0 — geometry-first refactor + spec extraction (web repo) ✅ DONE

**Result: complete, and byte-identical.** All 144 frozen-frame pixel hashes
(9 states × 2 sizes × 2 themes × 4 timestamps) are unchanged from before the
refactor, so the split carries zero visual risk. `thinking-orbs/engine` now
ships the React-free geometry surface, verified from a clean `npm pack`
install in both ESM and CJS, and its output matches `spec/orbs-golden.json`
to the digit. `MODE_DRAWS` is unchanged for existing consumers — the canvas
painters are now derived from the frame functions, so this is additive.

Shipped in this phase:

- `src/engine/index.ts` + `exports["./engine"]`, built as a second Vite entry
  (`dist/engine.es.js` / `dist/engine.cjs`; the main entry imports it, so
  nothing is duplicated).
- `finalizeFrame()` in `core.ts` — culls invisible marks, clamps radii to the
  mode floor, z-sorts into draw order. Runs in geometry, so a frame is a
  finished draw list and a port never re-derives anything.
- `demo/parity.html` + `demo/parity.ts` — the frozen-time capture harness,
  hash mode for regressions, PNG mode for Phase 3 cross-platform diffing.
- `scripts/extract-spec.ts` → `spec/orbs-spec.json` (presets, base profiles,
  scaling rules, paint contract, timing constants, a11y labels).
- `scripts/extract-golden.ts` → `spec/orbs-golden.json` (72 cases, 11,288
  dots, 341 lines, 6-decimal precision, 1e-4 tolerance).
- `npm run spec` regenerates both.

Remaining before the ports: cut web `0.3.0` (below).

The one structural change that makes everything else cheap:

1. **Split geometry from painting.** Each `ModeDraw` currently paints into a
   `CanvasRenderingContext2D`. Refactor to `ModeFrame(size, t, opts) →
   { dots: Dot[], lines: Line[] }` plus a thin canvas painter. All the math
   already lives in front of a single trailing `paint()` call, so this is
   mechanical. Constraint: keep frame functions closure-free and `Math`-only
   (they already are) so they are Reanimated-worklet-safe verbatim.
2. **Expose the engine**: add a `thinking-orbs/engine` subpath export (pure TS,
   no React, no DOM). The RN port then imports the **same compiled geometry
   code** — its parity is by construction, not by re-implementation.
3. **`scripts/extract-spec.ts` → `spec/orbs-spec.json`** (versioned, like
   `beam-spec.json`): enums, presets, base profiles, scaling rules
   (count-pair keys, radius keys, the 0-opt-out rule), timing constants
   (morph HOLD/MORPH, clock semantics), paint semantics (ink mirroring on
   dark, z-sort order, rMin clamp), and label strings.
4. **`scripts/extract-golden.ts` → `spec/orbs-golden.json`**: for every
   (state × size), the full resolved opts and the exact dot/line list at 4
   fixed timestamps (chosen per mode to hit hold + mid-transition phases, the
   lesson from border-beam's `line` freeze-window finding). This is the ground
   truth the Swift port tests against.
5. **Prove the refactor changed nothing**: capture per-state canvas pixels at
   frozen `t` before/after; require byte-identical output. Ship as web `0.3.0`.

## Phase 1 — React Native package (`ports/react-native/thinking-orbs-native`)

**Spike done. Two planned decisions were overturned by measurement — see
"Findings" below.** The package exists, typechecks against real
Skia/RN/Reanimated types, reproduces the golden vectors exactly (70,115
values), and its Skia draw sequence pixel-diffs against the web canvas at
worst mean 1.4/255. It has **not** run on a device or simulator yet; that
is the remaining gate before it can ship.

Layout mirrors `border-beam-native` (`package.json` peer-dep pattern, `src/`,
`tsc` build, plus an Expo `example/` app).

- **Deps:** peers on `@shopify/react-native-skia >=1.0`, `react-native-reanimated >=3`,
  `react`, `react-native`; hard dep (or bundled copy pinned by spec version) on
  `thinking-orbs` for the engine geometry.
- **Render loop:** a Reanimated `useFrameCallback` worklet runs the frame
  function and records an `SkPicture` (≤600 circle fills — trivial for Skia),
  displayed via `<Picture>`. Geometry + recording stay on the UI thread; the
  JS thread does zero per-frame work. Reuse one `SkPaint` per ink value bucket
  to avoid allocation churn on Android.
- **API:** identical to web — `state`, `size: 64 | 20`, `theme: 'auto'|'dark'|'light'`,
  `speed`, `paused`, `style`. Canvas sized `size`×`size` dp; Skia handles pixel
  density (cap the effective scale at 2 to match the web DPR cap).
- **Spike first:** `searching` (globe) at 64 — densest lattice mode — running
  60fps on the UI thread in the example app before porting the rest. Then the
  remaining 8 modes are free (same geometry import), leaving only `web`'s line
  pass and the morph's per-frame resampling to verify.
- **Example app:** Expo, mirroring the web demo chips (all 9 states × 2 sizes,
  theme toggle, speed slider).

## Phase 2 — iOS Swift package (`ports/ios/ThinkingOrbsKit`)

Layout mirrors `BorderBeamKit` (SPM `Package.swift`, `Sources`, `Tests`,
`snapshot.sh`) plus a `ThinkingOrbsDemo` XcodeGen app like `BorderBeamDemo`.

- **Hand-port the engine to Swift** (~940 lines of `Foundation`-free math; the
  only care point is exact formula transcription — `hashD`'s sin-based hash,
  fib lattice, value-noise smoothstep, morph arc-length walk). Presets are NOT
  hand-ported: `scripts/codegen-swift.ts` generates `OrbSpec.swift` from
  `orbs-spec.json`, so a retuning on web regenerates the Swift constants.
- **Renderer:** `TimelineView(.animation)` → `Canvas { context, _ in ... }`;
  z-sort, then `context.fill(Path(ellipseIn:), with: .color(...))` per dot and
  `context.stroke` for `web`'s edges. 600 fills is comfortable for Canvas at
  60fps on A12-class hardware (verify in spike).
- **API:** `ThinkingOrb(state: .searching, size: .px64, theme: .auto, speed: 1,
  paused: false)`; `.auto` reads `\.colorScheme`; static first frame under
  `\.accessibilityReduceMotion`.
- **Verification, two layers:**
  1. **Golden-vector XCTest** — evaluate the Swift engine at the spec'd
     timestamps and assert every dot matches `orbs-golden.json` within
     ε = 1e-4 (tolerance for libm ulp differences, far below a device pixel).
     This is the strong guarantee border-beam couldn't have.
  2. **`snapshot.sh`** — headless `ImageRenderer` captures of all 9 × 2 × 2
     combos at frozen `t` (frozen-time environment value, per border-beam's
     finding that `ImageRenderer` never fires `onAppear`), pixel-diffed against
     web captures with the existing border-beam diff script thresholds.
- **Spike first:** globe at 64 — validates projection transcription, ink
  mirroring, and Canvas throughput before the other 8 modes.

## Phase 3 — parity + performance verification

- **Parity:** golden-vector tests green on both platforms (RN's is a cheap
  Jest run of the shared engine — it mostly guards the worklet build); pixel
  harness (`demo/parity.html` pattern from border-beam: pin `t`, identical
  scene geometry, capture, `parity-diff.py`) across all 36 combos. Expected
  worst-case difference is antialiasing only — thresholds far tighter than
  border-beam's (mean < 0.5/255).
- **Performance budget:** ≤ 2 ms UI-thread frame time per instance on a
  mid-range Android (Pixel 6a class) and ≤ 1 ms Canvas time on A12; 4
  simultaneous instances at 60fps without drops. Profile the two worst modes
  (`composing` 590 dots, `searching` ~450).
- **Behavior matrix:** live theme switch, reduced-motion, background pause,
  many-instance clock alignment.
- **Known machine constraint** (from border-beam, still applies — this Mac is
  on macOS 15.3): Xcode 16.4 caps Expo at SDK 53. The example app targets SDK
  53 locally; RN runtime verification on newer SDKs goes to CI on a
  current-Xcode macOS runner. `ThinkingOrbsKit` (iOS 15 target) is unaffected;
  `BorderBeamDemo/run.sh`-style simulator runs work locally.

## Phase 4 — docs and release

- Per-platform READMEs mirroring the web one (install, states table, theme,
  a11y, perf notes).
- npm publish `thinking-orbs-native@0.1.0`; SPM release tag for
  `ThinkingOrbsKit`; both record the `specVersion` they were built against,
  and the release checklist starts with "regenerate spec + golden, rerun
  golden tests" whenever web tunings change (the mini-page → bake → ship loop
  now ends with two extra generated files, nothing more).

## Phase 5 — Mitosis meta-port (`ports/mitosis`) ✅ DONE

A single Mitosis `ThinkingOrb.lite.tsx` compiles to React, Vue, Svelte and
Solid. Rather than hand-transcribe the renderer per framework, the whole
imperative surface lives in a framework-neutral `orb-controller.ts` (copied
verbatim into every output), so all four generated components are thin
canvas shims over the same `thinking-orbs/engine` geometry.

- **Design:** component owns only the canvas + ref + prop→props wiring; the
  controller owns the shared clock, DPR cap, live theme auto-detect,
  reduced-motion static frame, and offscreen/tab pause. Behaviour parity is
  by construction — every target drives the same controller object.
- **Geometry parity:** `test/orb-geometry.test.ts` proves the reduced-motion
  static frame reproduces `spec/orbs-golden.json` to `1e-4` for all
  9 states × 2 sizes, so the port cannot drift from the shipping pixels.
- **Real compile checks, not string greps:** `npm run compile:check` builds
  every generated target through its official toolchain
  (`@vitejs/plugin-react`, `@vitejs/plugin-vue`, `@sveltejs/vite-plugin-svelte`,
  `vite-plugin-solid`). `npm run consumer:check` goes further: `npm pack`s the
  port, installs the tarball, and imports every framework subpath through the
  `exports` map.
- **Generated-output fix:** the Mitosis React generator folds the entire
  component onto the same physical line as a leading `//` comment, commenting
  the whole program out — the real React compile caught it (`"default" is not
  exported`). The `.lite.tsx` source therefore must not start with a leading
  comment; context lives in `ports/mitosis/README.md` instead.
- **Live reduced-motion test:** `test/orb-controller.test.ts` drives the
  `prefers-reduced-motion: reduce` MediaQueryList listener at runtime and
  asserts the loop stops, a static frame is drawn, and the loop resumes.

## Findings worth keeping

- **Worklets are unnecessary here, and the plan was wrong to want them.**
  Measured geometry cost per frame (desktop V8, post-JIT): `composing` 566
  dots = 0.116 ms, `working` 516 dots = 0.086 ms, `searching` 204 dots =
  0.044 ms. The heaviest mode is under 1% of a 60 fps budget. Meanwhile the
  Babel experiment was unambiguous: plain engine code through
  `react-native-worklets/plugin` produces **zero** worklets, so a UI-thread
  call would throw at runtime. Making it work needs `'worklet'` directives
  on every engine function *including the closure `makeProj` returns* (that
  form does workletize correctly — 5 worklets from 3 directives). Paying
  that cost — coupling the web library to Reanimated's toolchain, and
  risking a bundler stripping inert string directives — to reclaim 0.1 ms
  is a bad trade. Geometry runs on JS, rasterisation on the UI thread.
- **`react-dom` was a spurious peer dependency** and it hard-blocked React
  Native: npm refused to install `thinking-orbs` next to `react-native` at
  all. Nothing in the library ever imported it. Fixed in web `0.3.1` — the
  first real dividend of building a port.
- **Skia and Chrome canvas disagree on sub-pixel circles, and these
  animations are full of them.** Isolated-circle ink at radius 20 matches to
  0.14% (so colour space, gamma, alpha and premultiplication are all
  correct), but at r=1 Skia is *lighter*, at r=0.5 it is 1.5× heavier, and
  at r=0.35 Chrome draws **nothing at all** while Skia still renders. Net:
  the port shows the faintest far-depth dots slightly more than the web.
  Not worth compensating — the bias is not monotonic in radius, so any
  correction is a fitted curve chasing a sub-1%-mean difference, and Skia's
  behaviour is arguably the more faithful one.
- **Verify a rasteriser with a rasteriser, not with a simulator.** Replaying
  the port's exact draw sequence through CanvasKit (the WASM build of the
  same Skia) and pixel-diffing against the browser caught the sub-pixel
  issue above without any device involvement, and the centroid/ink/multi-
  scale-downsample diagnostic is what separated "antialiasing noise" from
  "systematic bias" — a raw pixel diff alone could not.

## Risks

1. ~~Worklet compatibility~~ — resolved by measurement; see Findings.
2. **Per-frame `SkPicture` allocation churn** on low-end Android — mitigated by
   paint reuse; escalation path is `drawAtlas` with a small sprite ramp, only
   if profiling demands it. Still unmeasured on real hardware.
3. **Transcription errors in the Swift math port** — exactly what the
   golden-vector tests catch, dot by dot, mode by mode.
4. **Blend/alpha semantics drift** — the CanvasKit diff confirms web canvas
   and Skia agree once geometry is above a pixel; SwiftUI `Canvas` still
   needs the same check (border-beam's opacity>1 clamp lesson: check the
   extremes, not the average case).

## Execution order

Phase 0 → RN globe spike (proves worklet + shared-engine design early) →
iOS globe spike (proves transcription + Canvas throughput) → parallel-track
remaining modes per platform → parity harness → docs/release.
