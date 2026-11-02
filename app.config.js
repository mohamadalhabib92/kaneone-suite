const app = require('./app.json');

/**
 * Le baseUrl « /kaneone-suite » sert au web (GitHub Pages).
 * Un build EAS ne doit pas le reprendre : il casserait les chemins natifs.
 * app.json reste la source du baseUrl web.
 */
module.exports = () => {
  const expo = JSON.parse(JSON.stringify(app.expo));
  if (process.env.EAS_BUILD) {
    if (expo.experiments) delete expo.experiments.baseUrl;
  }
  return { expo };
};
