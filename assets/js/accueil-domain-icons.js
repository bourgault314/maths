(function (global) {
  "use strict";

  const DATA_DIE_FACES = Object.freeze({
    1: [[17, 30]],
    2: [[10, 23], [24, 37]],
    3: [[10, 23], [17, 30], [24, 37]],
    4: [[10, 23], [24, 23], [10, 37], [24, 37]],
    5: [[10, 23], [24, 23], [17, 30], [10, 37], [24, 37]],
    6: [[10, 23], [24, 23], [10, 30], [24, 30], [10, 37], [24, 37]]
  });

  function simulateDieThrows(throwCount = 60, random = Math.random) {
    if (!Number.isInteger(throwCount) || throwCount <= 0) {
      throw new RangeError("Le nombre de lancers doit être un entier strictement positif.");
    }
    if (typeof random !== "function") {
      throw new TypeError("La source de hasard doit être une fonction.");
    }

    const counts = [0, 0, 0, 0, 0, 0];
    let lastValue = 1;
    for (let index = 0; index < throwCount; index += 1) {
      const draw = random();
      if (!Number.isFinite(draw) || draw < 0 || draw >= 1) {
        throw new RangeError("La source de hasard doit produire un nombre dans [0, 1[.");
      }
      lastValue = 1 + Math.floor(draw * 6);
      counts[lastValue - 1] += 1;
    }

    return Object.freeze({
      throwCount: throwCount,
      counts: Object.freeze(counts),
      lastValue: lastValue
    });
  }

  function renderDieChart(experiment) {
    const baselineY = 43;
    const chartHeight = 31;
    const chartMaximum = Math.max(20, ...experiment.counts);
    const expectedCount = experiment.throwCount / 6;
    const expectedY = baselineY - chartHeight * expectedCount / chartMaximum;
    const sticks = experiment.counts.map(function (count, index) {
      const x = 44 + index * 6.3;
      const y = baselineY - chartHeight * count / chartMaximum;
      return `<line x1="${x.toFixed(1)}" y1="${baselineY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" fill="none" stroke="#be3e68" stroke-width="3" stroke-linecap="butt"/>`;
    }).join("");
    return `<g data-mathsgo-die-chart="${experiment.counts.join("-")}"><path d="M42 ${expectedY.toFixed(1)}H77" fill="none" stroke="#08aaa5" stroke-width="1.1" stroke-dasharray="2.4 1.8"/>${sticks}</g>`;
  }

  function renderProbabilityIcon(markup, experiment) {
    const value = experiment.lastValue;
    const pips = DATA_DIE_FACES[value]
      .map(function (point) { return `<circle cx="${point[0]}" cy="${point[1]}" r="2.2"/>`; })
      .join("");
    return markup
      .replace(
        /<g fill="#9d174d" data-mathsgo-die-face="">.*?<\/g>/,
        `<g fill="#9d174d" data-mathsgo-die-face="${value}">${pips}</g>`
      )
      .replace(/<g data-mathsgo-die-chart="">.*?<\/g>/, renderDieChart(experiment));
  }

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
    if (name === "probability-statistics") {
      return renderProbabilityIcon(markup, settings.experiment || simulateDieThrows(60, settings.random));
    }
    return markup;
  }

  function mount(root) {
    const scope = root || global.document;
    if (!scope || typeof scope.querySelectorAll !== "function") return 0;
    const experiment = simulateDieThrows(60);
    const slots = scope.querySelectorAll("[data-home-icon]");
    slots.forEach(function (slot) {
      slot.innerHTML = renderIcon(slot.dataset.homeIcon, { experiment: experiment });
    });
    return slots.length;
  }

  const api = Object.freeze({
    simulateDieThrows: simulateDieThrows,
    renderDieChart: renderDieChart,
    renderProbabilityIcon: renderProbabilityIcon,
    renderIcon: renderIcon,
    mount: mount
  });

  global.MATHSGO_HOME_DOMAIN_ICONS = api;
  if (typeof document === "object") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mount(); }, { once: true });
    else mount();
  }
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
