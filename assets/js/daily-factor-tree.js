(function (global) {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const COLORS = Object.freeze({
    branch: "#15803d",
    rootFill: "#0b67b2",
    rootStroke: "#063f86",
    compositeFill: "#f97316",
    compositeStroke: "#9a3412",
    primeFill: "#be3e68",
    primeStroke: "#9d174d"
  });
  const POSITIONS = Object.freeze({
    root: Object.freeze({ x: 37, y: 9, r: 7.7 }),
    branches: Object.freeze([
      Object.freeze({ x: 18.5, y: 25, r: 7.1 }),
      Object.freeze({ x: 55.5, y: 25, r: 7.1 })
    ]),
    leaves: Object.freeze([
      Object.freeze([
        Object.freeze({ x: 8.5, y: 43, r: 6.2 }),
        Object.freeze({ x: 28.5, y: 43, r: 6.2 })
      ]),
      Object.freeze([
        Object.freeze({ x: 45.5, y: 43, r: 6.2 }),
        Object.freeze({ x: 65.5, y: 43, r: 6.2 })
      ])
    ])
  });

  function composite(value, first, second) {
    return { value: value, factors: [first, second] };
  }

  function prime(value) {
    return { value: value, factors: null };
  }

  const RAW_TREES = [
    { root: 16, branches: [composite(4, 2, 2), composite(4, 2, 2)] },
    { root: 12, branches: [composite(6, 2, 3), prime(2)] },
    { root: 24, branches: [composite(4, 2, 2), composite(6, 2, 3)] },
    { root: 18, branches: [prime(2), composite(9, 3, 3)] },
    { root: 36, branches: [composite(4, 2, 2), composite(9, 3, 3)] },
    { root: 20, branches: [composite(10, 2, 5), prime(2)] },
    { root: 40, branches: [composite(4, 2, 2), composite(10, 2, 5)] },
    { root: 28, branches: [prime(2), composite(14, 2, 7)] },
    { root: 54, branches: [composite(6, 2, 3), composite(9, 3, 3)] },
    { root: 30, branches: [composite(6, 2, 3), prime(5)] },
    { root: 56, branches: [composite(4, 2, 2), composite(14, 2, 7)] },
    { root: 42, branches: [prime(7), composite(6, 2, 3)] },
    { root: 60, branches: [composite(6, 2, 3), composite(10, 2, 5)] },
    { root: 45, branches: [composite(9, 3, 3), prime(5)] },
    { root: 81, branches: [composite(9, 3, 3), composite(9, 3, 3)] },
    { root: 50, branches: [prime(5), composite(10, 2, 5)] },
    { root: 84, branches: [composite(6, 2, 3), composite(14, 2, 7)] },
    { root: 63, branches: [composite(9, 3, 3), prime(7)] },
    { root: 90, branches: [composite(9, 3, 3), composite(10, 2, 5)] },
    { root: 70, branches: [prime(7), composite(10, 2, 5)] },
    { root: 100, branches: [composite(10, 2, 5), composite(10, 2, 5)] },
    { root: 75, branches: [composite(15, 3, 5), prime(5)] },
    { root: 126, branches: [composite(9, 3, 3), composite(14, 2, 7)] },
    { root: 105, branches: [prime(7), composite(15, 3, 5)] }
  ];

  const TREES = Object.freeze(RAW_TREES.map(function (tree) {
    const branches = tree.branches.map(function (branch) {
      return Object.freeze({
        value: branch.value,
        factors: branch.factors ? Object.freeze(branch.factors.slice()) : null
      });
    });
    return Object.freeze({ root: tree.root, branches: Object.freeze(branches) });
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

  function terminalCount(tree) {
    return tree.branches.reduce(function (count, branch) {
      return count + (branch.factors ? branch.factors.length : 1);
    }, 0);
  }

  function treeType(tree) {
    return terminalCount(tree) === 3 ? "three" : "four";
  }

  function fontSize(value, role) {
    const length = String(value).length;
    if (role === "root") return length >= 3 ? 6.6 : 8.4;
    if (role === "composite") return length >= 2 ? 7.7 : 8.5;
    return 8.4;
  }

  function lineMarkup(from, to, family) {
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" data-edge-family="${family}"/>`;
  }

  function nodeMarkup(node) {
    let fill = COLORS.primeFill;
    let stroke = COLORS.primeStroke;
    if (node.role === "root") {
      fill = COLORS.rootFill;
      stroke = COLORS.rootStroke;
    } else if (node.role === "composite") {
      fill = COLORS.compositeFill;
      stroke = COLORS.compositeStroke;
    }
    return `<circle cx="${node.position.x}" cy="${node.position.y}" r="${node.position.r}" fill="${fill}" stroke="${stroke}" data-node-role="${node.role}" data-node-value="${node.value}"/>`;
  }

  function labelMarkup(node) {
    return `<text x="${node.position.x}" y="${node.position.y + 3}" font-size="${fontSize(node.value, node.role)}">${node.value}</text>`;
  }

  function renderTree(tree, index) {
    const nodes = [{ value: tree.root, role: "root", position: POSITIONS.root }];
    const edges = [];

    tree.branches.forEach(function (branch, side) {
      const branchPosition = POSITIONS.branches[side];
      const branchRole = branch.factors ? "composite" : "prime";
      edges.push(lineMarkup(POSITIONS.root, branchPosition, "top"));
      nodes.push({ value: branch.value, role: branchRole, position: branchPosition });

      if (branch.factors) {
        branch.factors.forEach(function (factor, factorIndex) {
          const leafPosition = POSITIONS.leaves[side][factorIndex];
          edges.push(lineMarkup(branchPosition, leafPosition, "bottom"));
          nodes.push({ value: factor, role: "prime", position: leafPosition });
        });
      }
    });

    const type = treeType(tree);
    const terminalTotal = terminalCount(tree);
    return `<svg viewBox="0 0 74 52" aria-hidden="true" data-mathsgo-factor-tree="${index}" data-mathsgo-factor-tree-root="${tree.root}" data-mathsgo-factor-tree-type="${type}" data-mathsgo-factor-tree-terminals="${terminalTotal}">`
      + `<g fill="none" stroke="${COLORS.branch}" stroke-width="2.45" stroke-linecap="round">${edges.join("")}</g>`
      + `<g stroke-width="1.15">${nodes.map(nodeMarkup).join("")}</g>`
      + `<g fill="#fff" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle">${nodes.map(labelMarkup).join("")}</g>`
      + "</svg>";
  }

  function render(markup, value) {
    if (typeof markup !== "string") return markup;
    const selection = selectionForDate(value);
    return renderTree(selection.tree, selection.index);
  }

  const api = Object.freeze({
    trees: TREES,
    positions: POSITIONS,
    localDayNumber: localDayNumber,
    selectionForDate: selectionForDate,
    terminalCount: terminalCount,
    treeType: treeType,
    renderTree: renderTree,
    render: render
  });

  global.MATHSGO_DAILY_FACTOR_TREE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
