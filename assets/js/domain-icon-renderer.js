(function (global) {
  "use strict";

  function renderIcon(name, options) {
    const settings = options || {};
    const library = settings.library || global.MATHSGO_ICON_LIBRARY || {};
    const markup = library[name];
    if (typeof markup !== "string") return "";

    if (name === "factor-tree" && global.MATHSGO_DAILY_FACTOR_TREE) {
      return global.MATHSGO_DAILY_FACTOR_TREE.render(markup, settings.date);
    }
    if (name === "splat") {
      const dailySplat = global.MATHSGO_DAILY_SPLAT_LETTER;
      const rendered = dailySplat ? dailySplat.render(markup, settings.date) : markup;
      return rendered.replace(
        'fill="#8b5cf6" stroke="#5b21b6"',
        'fill="#0b67b2" stroke="#063f86"'
      );
    }
    if (name === "koch" && global.MATHSGO_DAILY_KOCH) {
      return global.MATHSGO_DAILY_KOCH.render(markup, settings.date);
    }
    if (name === "strategy" && global.MATHSGO_DAILY_STRATEGY_FRACTAL) {
      return global.MATHSGO_DAILY_STRATEGY_FRACTAL.render(markup, settings.date);
    }
    if ((name === "equal-volume-vase" || name === "function") && global.MATHSGO_DAILY_VASES) {
      return global.MATHSGO_DAILY_VASES.render(markup, settings.date);
    }
    if (name === "seigaiha" && global.MATHSGO_DAILY_ROSETTES) {
      return global.MATHSGO_DAILY_ROSETTES.render(markup, settings.date);
    }
    return markup;
  }

  const api = Object.freeze({ renderIcon: renderIcon });
  global.MATHSGO_DOMAIN_ICON_RENDERER = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
