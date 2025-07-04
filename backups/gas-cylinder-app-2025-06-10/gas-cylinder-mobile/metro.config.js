const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ws: require.resolve('./emptyShim.js'),
  stream: require.resolve('./emptyShim.js'),
  events: require.resolve('./emptyShim.js'),
  http: require.resolve('./emptyShim.js'),
  https: require.resolve('./emptyShim.js'),
  crypto: require.resolve('./emptyShim.js'),
  net: require.resolve('./emptyShim.js'),
  zlib: require.resolve('./emptyShim.js'),
  tls: require.resolve('./emptyShim.js'),
  url: require.resolve('./emptyShim.js'),
};

module.exports = config; 