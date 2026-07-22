// Learn more: https://docs.expo.dev/guides/monorepos/
// This example consumes the library straight from ../src (no build step),
// so metro watches the repo root and — critically — resolves react,
// react-native and @shopify/react-native-skia to a SINGLE copy (the
// example's), even for files bundled from ../src. Duplicate copies are
// the classic cause of "invalid hook call" / native Skia crashes.

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [repoRoot];

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
