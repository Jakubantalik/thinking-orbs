import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      // two entry points now, so types are emitted per-file rather than
      // rolled into one index.d.ts
      rollupTypes: false
    })
  ],
  build: {
    lib: {
      // `engine` exposes geometry; `tui` projects it onto Unicode Braille.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        engine: resolve(__dirname, 'src/engine/index.ts'),
        tui: resolve(__dirname, 'src/tui/index.ts')
      },
      name: 'ThinkingOrbs',
      // The package is type:module, so the CJS bundle needs a real `.cjs`
      // extension — a `.js` file would be parsed as ESM and its
      // `exports.*` assignments would silently produce an empty require().
      fileName: (format, entryName) => (format === 'es' ? `${entryName}.es.js` : `${entryName}.cjs`),
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    }
  }
});
