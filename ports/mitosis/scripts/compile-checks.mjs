// Real-compile check for every generated framework target.
//
// Runs the official current toolchain for each framework and bundles a thin
// entry that imports the Mitosis-generated component (plus the shared
// controller, types, and `thinking-orbs/engine`). A non-zero exit or any
// emitted error means a generated target does not actually compile — not a
// substring match, a real build through the framework's own compiler/plugin.
//
// Targets and the plugin that drives their real JSX/SFC compilation:
//   react  -> @vitejs/plugin-react
//   vue    -> @vitejs/plugin-vue
//   svelte -> @sveltejs/vite-plugin-svelte
//   solid  -> vite-plugin-solid
//
// Output is discarded (--outDir into the OS temp dir); only the success of
// the build is asserted. Whether the compiler *warned* is treated as a
// failure too: a clean generated target must emit no warnings through its
// official toolchain, so stray a11y/type/self-closing warnings are caught
// here instead of printing a misleading "ok".

import { build } from 'vite';
import { createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import solid from 'vite-plugin-solid';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const targets = {
  react: {
    entry: path.join(root, 'compile/react.ts'),
    plugin: react(),
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  vue: {
    entry: path.join(root, 'compile/vue.ts'),
    plugin: vue(),
    external: ['vue'],
  },
  svelte: {
    entry: path.join(root, 'compile/svelte.ts'),
    plugin: svelte(),
    external: ['svelte', 'svelte/internal'],
  },
  solid: {
    entry: path.join(root, 'compile/solid.ts'),
    plugin: solid(),
    external: ['solid-js', 'solid-js/web', 'solid-js/store'],
  },
};

async function main() {
  let failed = false;
  for (const [name, cfg] of Object.entries(targets)) {
    const outDir = path.join(os.tmpdir(), `thinking-orbs-mitosis-compile-${name}`);
    // Collect every warn/error the framework toolchain emits; any is a failure.
    const warnings = [];
    const logger = createLogger('warn');
    const baseWarn = logger.warn.bind(logger);
    const baseError = logger.error.bind(logger);
    logger.warn = (msg, opts) => {
      warnings.push(msg);
      baseWarn(msg, opts);
    };
    logger.error = (msg, opts) => {
      warnings.push(msg);
      baseError(msg, opts);
    };
    try {
      await build({
        root,
        logLevel: 'warn',
        customLogger: logger,
        configFile: false,
        build: {
          emptyOutDir: true,
          outDir,
          lib: {
            entry: cfg.entry,
            formats: ['es'],
            fileName: 'index',
          },
          rollupOptions: {
            external: [...cfg.external, 'thinking-orbs/engine'],
            onwarn(warning) {
              // Ignore benign infrastructure warnings (e.g. a circular
              // dependency inside `svelte`'s own node_modules) so we don't
              // fail on the framework itself. Any other rollup warning — such
              // as a runtime import of a type-only export ("X is not exported
              // by .../types.ts") — is a real defect in a generated target.
              if (warning.code === 'CIRCULAR_DEPENDENCY') return;
              warnings.push(warning.message);
              throw new Error(`rollup warning (${warning.code || 'unknown'}): ${warning.message}`);
            },
          },
        },
        plugins: [cfg.plugin],
      });
      if (warnings.length > 0) {
        failed = true;
        console.error(`\x1b[31mFAIL\x1b[0m ${name}: generated target emitted warnings`);
        for (const w of warnings.slice(0, 8)) console.error(`  ${String(w).split('\n')[0]}`);
      } else {
        console.log(`\x1b[32mok\x1b[0m ${name}: compiled generated target through real toolchain`);
      }
    } catch (err) {
      failed = true;
      console.error(`\x1b[31mFAIL\x1b[0m ${name}: generated target failed to compile`);
      if (err instanceof Error) console.error(`  ${err.message.split('\n').slice(0, 8).join('\n  ')}`);
    }
  }
  if (failed) {
    console.error('\ncompile:check failed');
    process.exit(1);
  }
  console.log('\ncompile:check passed for all four targets');
}

main();
