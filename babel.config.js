module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // If you previously used 'react-native-reanimated/plugin', replace it:
      'react-native-worklets/plugin',
    ],
  };
};
