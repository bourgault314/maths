(function (global) {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const TREES = Object.freeze([
    { root: 16, left: 4, right: 4, leaves: [2, 2, 2, 2] },
    { root: 36, left: 4, right: 9, leaves: [2, 2, 3, 3] },
    { root: 60, left: 4, right: 15, leaves: [2, 2, 3, 5] },
    { root: 84, left: 4, right: 21, leaves: [2, 2, 3, 7] },
    { root: 90, left: 6, right: 15, leaves: [2, 3, 3, 5] },
    { root: 100, left: 4, right: 25, leaves: [2, 2, 5, 5] },
    { root: 126, left: 6, right: 21, leaves: [2, 3, 3, 7] },
    { root: 140, left: 4, right: 35, leaves: [2, 2, 5, 7] },
    { root: 150, left: 6, right: 25, leaves: [2, 3, 5, 5] },
    { root: 24, left: 4, right: 6, leaves: [2, 2, 2, 3] },
    { root: 40, left: 4, right: 10, leaves: [2, 2, 2, 5] },
    { root: 54, left: 6, right: 9, leaves: [2, 3, 3, 3] },
    { root: 56, left: 4, right: 14, leaves: [2, 2, 2, 7] },
    { root: 81, left: 9, right: 9, leaves: [3, 3, 3, 3] },
    { root: 135, left: 9, right: 15, leaves: [3, 3, 3, 5] },
    { root: 189, left: 9, right: 21, leaves: [3, 3, 3, 7] },
    { root: 36, left: 6, right: 6, leaves: [2, 3, 2, 3] },
    { root: 60, left: 6, right: 10, leaves: [2, 3, 2, 5] },
    { root: 84, left: 6, right: 14, leaves: [2, 3, 2, 7] },
    { root: 90, left: 9, right: 10, leaves: [3, 3, 2, 5] },
    { root: 100, left: 10, right: 10, leaves: [2, 5, 2, 5] },
    { root: 126, left: 9, right: 14, leaves: [3, 3, 2, 7] },
    { root: 140, left: 10, right: 14, leaves: [2, 5, 2, 7] },
    { root: 150, left: 10, right: 15, leaves: [2, 5, 3, 5] }
  ].map(function (tree) {
    return Object.freeze(Object.assign({}, tree, { leaves: Object.freeze(tree.leaves.slice()) }));
  }));

  function localDayNumber(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date quotidienne invalide");
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function selectionForDate(value) {
    const day = localDayNumber(value);
    const index = ((day % TREES.length) + TREES.length) % TREES.length;
    return Object.freeze({ index: index, tree: TREES[index] });
  }

  function fontSize(value, regular, compact) {
    return String(value).length >= 3 ? compact : regular;
  }

  function render(markup, value) {
    if (typeof markup !== "string") return markup;
    const selection = selectionForDate(value);
    const tree = selection.tree;
    const leafX = [9, 28, 47, 66];
    const leaves = tree.leaves.map(function (leaf, index) {
      return `<text x="${leafX[index]}" y="46" font-size="8.4">${leaf}</text>`;
    }).join("");
    const labels = `<g fill="#fff" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" data-mathsgo-factor-tree="${selection.index}" data-mathsgo-factor-tree-root="${tree.root}">`
      + `<text x="37" y="12" font-size="${fontSize(tree.root, 8.4, 6.6)}">${tree.root}</text>`
      + `<text x="21" y="28" font-size="${fontSize(tree.left, 8.5, 7.7)}">${tree.left}</text>`
      + `<text x="53" y="27.9" font-size="${fontSize(tree.right, 8.5, 7.7)}">${tree.right}</text>`
      + leaves
      + "</g>";
    return markup.replace(
      /<g fill="#fff" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" data-mathsgo-factor-tree="">.*?<\/g>/,
      labels
    );
  }

  const api = Object.freeze({
    trees: TREES,
    localDayNumber: localDayNumber,
    selectionForDate: selectionForDate,
    render: render
  });

  global.MATHSGO_DAILY_FACTOR_TREE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
