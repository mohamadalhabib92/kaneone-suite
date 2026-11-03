function useOnline() {
  return true;
}
module.exports = { addEventListener: () => () => {}, fetch: async () => ({ isConnected: true, isInternetReachable: true }), useNetInfo: useOnline };
module.exports.default = module.exports;
