module.exports = function(api) {
    // api.cache(true);
    const babelEnv = api.env();
    const plugins = [];

    if (babelEnv !== 'development') {
        plugins.push(['transform-remove-console', {exclude: ['error', 'warn']}]);
    }

    plugins.push(['react-native-reanimated/plugin'])

    return {
        presets: ['babel-preset-expo'],
        plugins: plugins
    };
};
