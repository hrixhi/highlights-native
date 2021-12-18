const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.assetExts.push('css');
defaultConfig.resolver.sourceExts.push('cjs');
module.exports = defaultConfig;
