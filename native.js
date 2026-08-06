// Escape hatch for Metro configs with package-exports resolution
// disabled: they resolve `thinking-orbs/native` as a literal file path.
// Metro's platform-extension substitution prefers native.native.js on
// iOS/Android; web and node land here.
export { ThinkingOrb, resolvePreset, STATE_TO_MODE, MODE_DRAWS } from './dist/native/index.js';
