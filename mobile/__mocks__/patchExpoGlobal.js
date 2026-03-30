// Patch the global __ExpoImportMetaRegistry before expo's lazy getter causes issues
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
  value: { url: null },
  configurable: true,
  writable: true,
});
