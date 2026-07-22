module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 ships its worklets transform in react-native-worklets;
    // the plugin must be listed last. Skia pulls reanimated in at runtime.
    plugins: ['react-native-worklets/plugin']
  };
};
