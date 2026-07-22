// The example consumes the library by its package name (`thinking-orbs/native`),
// which resolves through a symlink at node_modules/thinking-orbs -> the repo
// root (created by the `postinstall` script in package.json). Consuming by
// name via node_modules is the only thing the production / embed bundler
// resolves — a `../src` relative import out of the project root works in the
// dev server but fails a Release build.
//
// Metro must: (1) watch the repo root so the linked source is served,
// (2) resolve the library's `./native` package export (source .ts), and
// (3) resolve react / react-native / skia / reanimated / worklets to a SINGLE
// copy (the example's), even inside the library — duplicate copies are the
// classic "invalid hook call" / native Skia crash.

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [repoRoot];

// Resolve the library's "./native" export (which points at TS source).
config.resolver.unstable_enablePackageExports = true;

const singletons = [
  'react',
  'react-native',
  '@shopify/react-native-skia',
  'react-native-reanimated',
  'react-native-worklets'
];
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

config.resolver.extraNodeModules = singletons.reduce((acc, name) => {
  acc[name] = path.join(projectRoot, 'node_modules', name);
  return acc;
}, {});

// Block the library's own copies of the shared packages so metro can only
// ever resolve the example's single copy (avoids duplicate react / skia).
config.resolver.blockList = new RegExp(
  `(${singletons.map((name) => `^${escape(path.join(repoRoot, 'node_modules', name))}(/.*)?$`).join('|')})`
);

module.exports = config;
