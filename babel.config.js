module.exports = function (api) {
  api.cache.never();
  const presets = [
    ['@babel/preset-env'],
  ];
  const plugins = [
    ['@babel/plugin-transform-runtime', {
      'regenerator': true
    }]
  ];
  return { presets ,plugins };
};
