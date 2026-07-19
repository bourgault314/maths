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

function lineLengths(markup, family) {
  const pattern = /<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" data-edge-family="(top|bottom)"\/>/g;
  return [...markup.matchAll(pattern)]
    .filter((match) => match[5] === family)
    .map((match) => Math.hypot(Number(match[3]) - Number(match[1]), Number(match[4]) - Number(match[2])));
}

test("les 24 arbres comprennent 12 cas à trois facteurs et 12 à quatre", () => {
  assert.equal(dailyFactorTree.trees.length, 24);
  const counts = dailyFactorTree.trees.map(dailyFactorTree.terminalCount);
  assert.equal(counts.filter((count) => count === 3).length, 12);
  assert.equal(counts.filter((count) => count === 4).length, 12);
  assert.equal(counts.some((count) => count < 3), false);
  assert.equal(new Set(dailyFactorTree.trees.map((tree) => tree.root)).size, 24);
});

test("chaque arbre est une décomposition exacte en facteurs premiers", () => {
  dailyFactorTree.trees.forEach((tree) => {
    assert.equal(tree.branches[0].value * tree.branches[1].value, tree.root);
    tree.branches.forEach((branch) => {
      if (branch.factors) {
        assert.equal(branch.factors.length, 2);
        assert.equal(branch.factors[0] * branch.factors[1], branch.value);
        branch.factors.forEach((factor) => assert.equal(isPrime(factor), true));
      } else {
        assert.equal(isPrime(branch.value), true);
      }
    });
  });
});

test("les deux côtés courts alternent dans les arbres à trois facteurs", () => {
  const shortSides = dailyFactorTree.trees
    .filter((tree) => dailyFactorTree.terminalCount(tree) === 3)
    .map((tree) => tree.branches[0].factors ? "right" : "left");
  assert.equal(shortSides.filter((side) => side === "left").length, 6);
  assert.equal(shortSides.filter((side) => side === "right").length, 6);
});

test("les branches sœurs ont rigoureusement la même longueur", () => {
  [dailyFactorTree.trees[0], dailyFactorTree.trees[1]].forEach((tree, index) => {
    const markup = dailyFactorTree.renderTree(tree, index);
    ["top", "bottom"].forEach((family) => {
      const lengths = lineLengths(markup, family);
      assert.ok(lengths.length >= 2);
      assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-10);
    });
  });
});

test("les billes centrales du dernier niveau gardent un espace visible", () => {
  const positions = dailyFactorTree.positions.leaves;
  const leftInner = positions[0][1];
  const rightInner = positions[1][0];
  const visibleGap = rightInner.x - leftInner.x - leftInner.r - rightInner.r - 1.15;
  assert.ok(visibleGap >= 3);
});

test("le rendu contient le bon nombre de nœuds selon le type", () => {
  const four = dailyFactorTree.renderTree(dailyFactorTree.trees[0], 0);
  const three = dailyFactorTree.renderTree(dailyFactorTree.trees[1], 1);
  assert.equal((four.match(/<circle /g) || []).length, 7);
  assert.equal((four.match(/<line /g) || []).length, 6);
  assert.match(four, /data-mathsgo-factor-tree-type="four"/);
  assert.equal((three.match(/<circle /g) || []).length, 5);
  assert.equal((three.match(/<line /g) || []).length, 4);
  assert.match(three, /data-mathsgo-factor-tree-type="three"/);
  assert.equal((three.match(/data-node-role="prime"/g) || []).length, 3);
});

test("l’arbre change chaque jour pendant 24 jours puis le cycle recommence", () => {
  const selections = Array.from({ length: 25 }, (_, offset) => {
    return dailyFactorTree.selectionForDate(new Date(2026, 0, 1 + offset, 12));
  });
  assert.equal(new Set(selections.slice(0, 24).map(({ index }) => index)).size, 24);
  assert.equal(selections[24].index, selections[0].index);
});

test("une date invalide est refusée explicitement", () => {
  assert.throws(() => dailyFactorTree.selectionForDate("pas une date"), /Date quotidienne invalide/);
});
