const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Get the project root (monorepo root)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro recognize all packages in the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to resolve these packages from the root to avoid duplicates
config.resolver.disableHierarchicalLookup = true;

module.exports = config;