// Real npm-pack / import check for the Mitosis port.
//
// Verifies the package is actually consumable: `npm pack`s the port, installs
// the tarball into a throwaway consumer workspace inside this worktree, then
// builds a thin Vite app that imports every framework subpath
// (`thinking-orbs-mitosis/react|vue|svelte|solid`) resolved through the
// package's `exports` map. A non-zero exit or any build error means the
// package cannot be imported, not just that its source typechecks.
//
// The whole run lives under `test/consumer` (gitignored) so nothing escapes
// the worktree, and the packed tarball is removed when done.

import { build } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import solid from 'vite-plugin-solid';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const consumerDir = path.join(root, 'test', 'consumer');

// The package name from package.json so the import specifier stays accurate.
const name = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).name;

const targets = {
  react: { subpath: 'react', plugin: react(), external: ['react', 'react-dom', 'react/jsx-runtime'] },
  vue: { subpath: 'vue', plugin: vue(), external: ['vue'] },
  svelte: { subpath: 'svelte', plugin: svelte(), external: ['svelte', 'svelte/internal'] },
  solid: { subpath: 'solid', plugin: solid(), external: ['solid-js', 'solid-js/web', 'solid-js/store'] },
};

function fresh(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

async function main() {
  fresh(consumerDir);

  // 1. Pack the port into the consumer workspace.
  const tarballJson = execSync(`npm pack --pack-destination "${consumerDir}" --json`, {
    cwd: root,
    encoding: 'utf8',
  });
  const packResult = JSON.parse(tarballJson);
  const meta = Array.isArray(packResult) ? packResult[0] : Object.values(packResult)[0];
  const filename = meta?.filename;
  if (!filename) throw new Error(`npm pack produced no tarball: ${tarballJson}`);
  const tarballPath = path.join(consumerDir, filename);

  // 2. A minimal consumer app that installs the tarball and imports each subpath.
  const appDir = path.join(consumerDir, 'app');
  mkdirSync(appDir, { recursive: true });

  execSync(`npm install --no-save "${tarballPath}"`, { cwd: appDir, stdio: 'inherit' });

  const entryImports = Object.entries(targets)
    .map(
      ([t, c]) =>
        `import ${t} from "${name}/${c.subpath}"; export const ${t}Loaded = !!${t};`,
    )
    .join('\n');
  writeFileSync(path.join(appDir, 'entry.ts'), entryImports);

  writeFileSync(
    path.join(appDir, 'vite.config.ts'),
    `import { defineConfig } from 'vite';\nexport default defineConfig({});\n`,
  );

  await build({
    root: appDir,
    configFile: false,
    logLevel: 'warn',
    plugins: [...Object.values(targets).map((t) => t.plugin)],
    build: {
      emptyOutDir: true,
      outDir: path.join(appDir, 'dist'),
      lib: { entry: path.join(appDir, 'entry.ts'), formats: ['es'], fileName: 'index' },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'vue',
          'svelte',
          'svelte/internal',
          'solid-js',
          'solid-js/web',
          'solid-js/store',
          'thinking-orbs/engine',
        ],
      },
    },
  });

  console.log(`\x1b[32mok\x1b[0m consumer: packed '${name}' tarball, installed it, and imported/compiled all four framework subpaths`);

  // 3. Clear packed artifacts; keep the (gitignored) app dir for inspection.
  rmSync(path.join(consumerDir, 'app'), { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
  rmSync(consumerDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('\x1b[31mFAIL\x1b[0m consumer:check failed');
  if (err.stack) console.error(err.stack.split('\n').slice(0, 12).join('\n'));
  process.exit(1);
});
