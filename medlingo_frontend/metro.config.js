const { getDefaultConfig } = require('expo/metro-config');

/**
 * Use Expo's default Metro configuration without overrides.
 * This avoids missing default extensions and resolver issues flagged by expo-doctor.
 */
const config = getDefaultConfig(__dirname);

module.exports = config;