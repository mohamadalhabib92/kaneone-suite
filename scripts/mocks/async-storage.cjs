const mem = new Map();
const AsyncStorage = {
  getItem: async (key) => (mem.has(key) ? mem.get(key) : null),
  setItem: async (key, value) => {
    mem.set(key, String(value));
  },
  removeItem: async (key) => {
    mem.delete(key);
  },
  clear: async () => {
    mem.clear();
  },
  getAllKeys: async () => [...mem.keys()],
};
module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
