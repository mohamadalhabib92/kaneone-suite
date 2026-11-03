const Module = require('module');
const path = require('path');
const orig = Module._resolveFilename;
const map = {
  '@react-native-async-storage/async-storage': path.join(__dirname, 'mocks', 'async-storage.cjs'),
  'react-native': path.join(__dirname, 'mocks', 'react-native.cjs'),
  '@react-native-community/netinfo': path.join(__dirname, 'mocks', 'netinfo.cjs'),
};
Module._resolveFilename = function (request, parent, isMain, options) {
  if (map[request]) return map[request];
  return orig.call(this, request, parent, isMain, options);
};
