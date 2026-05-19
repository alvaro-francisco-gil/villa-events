const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo so changes in packages/ trigger reloads
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve modules from the app's node_modules AND the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Disable hierarchical lookup (pnpm's flat node_modules layout breaks it)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
