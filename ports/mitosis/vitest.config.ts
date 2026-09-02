import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Match tsconfig `paths`: test the port against the checked-in engine
      // source so geometry parity is guaranteed against `spec/orbs-golden.json`.
      'thinking-orbs/engine': fileURLToPath(new URL('../../src/engine/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
