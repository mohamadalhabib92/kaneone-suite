const React = require('react');
function stub() {
  return null;
}
module.exports = {
  Platform: { OS: 'web', select: (o) => o.web ?? o.default },
  StyleSheet: { hairlineWidth: 1, create: (s) => s },
  Share: { share: async () => ({}) },
  View: stub,
  Text: stub,
  Pressable: stub,
  ScrollView: stub,
  TextInput: stub,
  Modal: stub,
  Switch: stub,
  ActivityIndicator: stub,
  Animated: { Value: class { setValue() {} }, loop: () => ({ start() {}, stop() {} }), sequence: () => ({}), timing: () => ({}) },
  AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: () => ({ remove() {} }) },
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
  createElement: React.createElement,
};
