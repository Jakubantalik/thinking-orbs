// React Native entry (`thinking-orbs/native`). Renders the six tuned
// thought-orb states on a Skia canvas, reusing the exact engine geometry
// that drives the web build. Requires the `react-native` and
// `@shopify/react-native-skia` peer dependencies.

export { ThinkingOrb } from './ThinkingOrb';
export { paintDots } from './renderer';
export { useResolvedDark } from './theme';
export type { OrbSize, OrbState, OrbTheme, ThinkingOrbProps } from './types';
