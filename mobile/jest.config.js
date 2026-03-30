module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/__mocks__/patchExpoGlobal.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^expo/src/winter/ImportMetaRegistry$': '<rootDir>/__mocks__/ImportMetaRegistry.js',
    '^expo/src/winter/runtime\\.native$': '<rootDir>/__mocks__/runtime.native.js',
    '^expo/src/winter$': '<rootDir>/__mocks__/winter.js',
  },
};
