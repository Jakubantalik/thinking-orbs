import { MitosisConfig } from '@builder.io/mitosis';

// Single Mitosis source -> React, Vue, Svelte, Solid. TypeScript output for
// every target so the generated components typecheck against the same
// `thinking-orbs/engine` geometry and are reviewable as maintained output.
const config: MitosisConfig = {
  files: 'src/**',
  targets: ['react', 'vue', 'svelte', 'solid'],
  dest: 'output',
  commonOptions: {
    typescript: true,
  },
  options: {
    react: {},
    vue: {
      api: 'options',
    },
    svelte: {},
    solid: {},
  },
};

export default config;
