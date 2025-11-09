const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'node:crypto': path.resolve(projectRoot, 'src/polyfills/nodeCrypto.ts'),
  crypto: path.resolve(projectRoot, 'src/polyfills/nodeCrypto.ts'),
};

module.exports = config;
