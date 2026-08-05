import { defineConfig } from '@playwright/test';

// biome-ignore lint/style/noDefaultExport: Playwright loads a default configuration export.
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:5177' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    port: 5177,
    reuseExistingServer: true
  }
});
