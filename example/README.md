# thinking-orbs example (Expo)

All nine states rendered through `thinking-orbs/native` — Skia on iOS/Android, the DOM canvas renderer on web.

```sh
# from the repo root: build the library the example consumes
npm install
npm run build

# then here
cd example
npm install
npx expo run:ios       # or: npx expo run:android
npx expo start --web   # the react-native-web fallback (plain <canvas>, no Skia)
```

While iterating on the library, rebuild it with `npm run build` at the root (or `vite build --watch --config vite.config.native.ts` for the native entries) — Metro watches the workspace and hot-reloads.
