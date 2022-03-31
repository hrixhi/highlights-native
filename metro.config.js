const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.assetExts.push('css');
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.transformer = {
    getTransformOptions: async () => ({
        transform: {
            experimentalImportSupport: false,
            inlineRequires: false,
        },
    })
}
module.exports = defaultConfig;
