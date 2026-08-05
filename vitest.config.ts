import { defineConfig } from 'vitest/config';

// biome-ignore lint/style/noDefaultExport: Vitest loads a default configuration export.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts']
  }
});
