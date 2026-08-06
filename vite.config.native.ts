import { copyFileSync } from 'fs';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Second lib build for the `thinking-orbs/native` subpath. Two entries:
// index.native.js (Skia, picked by Metro's `react-native` condition on
// iOS/Android) and index.js (the DOM-canvas fallback for web bundlers
// and SSR). Plain ESM — Metro babel-transforms node_modules, and web
// bundlers consume ESM directly. Runs after the root build, into the
// same dist/, hence emptyOutDir: false. Declarations are hand-maintained
// in src/native/index.d.ts (see the note there) and copied here rather
// than generated — vite-plugin-dts's rollupTypes would clobber the root
// build's dist/index.d.ts.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-native-dts',
      closeBundle() {
        for (const out of ['dist/native/index.d.ts', 'dist/native/index.native.d.ts']) {
          copyFileSync(resolve(__dirname, 'src/native/index.d.ts'), resolve(__dirname, out));
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: {
        'native/index': resolve(__dirname, 'src/native/ThinkingOrb.tsx'),
        'native/index.native': resolve(__dirname, 'src/native/ThinkingOrb.native.tsx')
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-native', '@shopify/react-native-skia'],
      output: {
        chunkFileNames: 'native/chunks/[name]-[hash].js'
      }
    }
  }
});
