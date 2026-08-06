// Example-app Metro setup for consuming the library one directory up via
// the file: symlink. Watch the workspace so library rebuilds hot-reload,
// and pin module resolution to this app's node_modules first so react /
// react-native never resolve to the library's devDependencies.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

module.exports = config;
