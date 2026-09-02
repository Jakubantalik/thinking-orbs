// Thin compile-check entry per generated target. Each re-exports the Mitosis
// output for that framework so a real toolchain compile can resolve the full
// module graph (component + shared controller + types + thinking-orbs/engine).
export { default } from '../output/react/src/ThinkingOrb';
