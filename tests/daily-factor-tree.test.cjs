const test = require("node:test");
const assert = require("node:assert/strict");
const dailyFactorTree = require("../assets/js/daily-factor-tree.js");

function isPrime(value) {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

test("les 24 arbres sont des décompositions exactes en facteurs premiers", () => {
  assert.equal(dailyFactorTree.trees.length, 24);
  const signatures = new Set();
  dailyFactorTree.trees.forEach((tree) => {
    assert.equal(tree.left, tree.leaves[0] * tree.leaves[1]);
    assert.equal(tree.right, tree.leaves[2] * tree.leaves[3]);
    assert.equal(tree.root, tree.left * tree.right);
    tree.leaves.forEach((leaf) => assert.equal(isPrime(leaf), true));
    signatures.add(JSON.stringify(tree));
  });
  assert.equal(signatures.size, 24);
});

test("l’arbre change chaque jour pendant 24 jours puis le cycle recommence", () => {
  const selections = Array.from({ length: 25 }, (_, offset) => {
    const date = new Date(2026, 0, 1 + offset, 12);
    return dailyFactorTree.selectionForDate(date);
  });
  assert.equal(new Set(selections.slice(0, 24).map(({ index }) => index)).size, 24);
  assert.equal(selections[24].index, selections[0].index);
});

test("le rendu remplace uniquement les nombres de l’arbre", () => {
  const source = `<svg><path d="M0 0"/><g fill="#fff" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" data-mathsgo-factor-tree=""><text>ancien</text></g></svg>`;
  const rendered = dailyFactorTree.render(source, new Date(2026, 0, 1, 12));
  assert.match(rendered, /data-mathsgo-factor-tree="\d+"/);
  assert.match(rendered, /data-mathsgo-factor-tree-root="\d+"/);
  assert.match(rendered, /<path d="M0 0"\/>/);
  assert.equal(rendered.includes("ancien"), false);
  assert.equal((rendered.match(/<text /g) || []).length, 7);
});

test("une date invalide est refusée explicitement", () => {
  assert.throws(() => dailyFactorTree.selectionForDate("pas une date"), /Date quotidienne invalide/);
});
