const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Clear metro cache more aggressively
config.resetCache = true;

// Avoid issues with native modules
config.resolver.platforms = ['ios', 'android', 'web'];

// Exclude problematic packages
config.resolver.blockList = [
  /react-native-svg/,
  /lucide-react-native/,
  /react-native-gesture-handler/,
];

// Alias problematic packages to shims
config.resolver.alias = {
  'react-native-safe-area-context': path.resolve(__dirname, 'react-native-safe-area-context-shim.js'),
};

module.exports = config;