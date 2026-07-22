(function (root) {
  "use strict";

  function shuffle(items, random) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function integer(random, minimum, maximum) {
    return minimum + Math.floor(random() * (maximum - minimum + 1));
  }

  function tableQuestion(type, first, second) {
    const product = first * second;
    if (type === "direct") return {type, kind: "Produit", prompt: `${first} × ${second} = ?`, answer: product};
    if (type === "right") return {type, kind: "Facteur manquant", prompt: `${first} × ? = ${product}`, answer: second};
    if (type === "left") return {type, kind: "Facteur manquant", prompt: `? × ${second} = ${product}`, answer: first};
    return {type, kind: "Égalité à compléter", prompt: `${product} = ${first} × ?`, answer: second};
  }

  function generateTables(random = Math.random) {
    const pairs = [];
    for (let first = 1; first <= 10; first += 1) {
      for (let second = 1; second <= 10; second += 1) pairs.push([first, second]);
    }
    const plan = shuffle([
      ...Array(13).fill("direct"),
      ...Array(4).fill("right"),
      ...Array(4).fill("left"),
      ...Array(4).fill("reverse")
    ], random);
    const selectedPairs = shuffle(pairs, random).slice(0, plan.length);
    return plan.map((type, index) => tableQuestion(type, selectedPairs[index][0], selectedPairs[index][1]));
  }

  function calculationQuestion(type, random) {
    if (type === "add") {
      const first = integer(random, 18, 89);
      const second = integer(random, 11, 68);
      return {type, kind: "Addition", prompt: `${first} + ${second} = ?`, answer: first + second};
    }
    if (type === "add-near") {
      const second = [9, 19, 29, 39][integer(random, 0, 3)];
      const first = integer(random, 23, 780);
      return {type, kind: "Ajouter rapidement", prompt: `${first} + ${second} = ?`, answer: first + second};
    }
    if (type === "add-place") {
      const second = [10, 20, 30, 100, 200, 300][integer(random, 0, 5)];
      const first = integer(random, 12, 89) * 10 + integer(random, 0, 9);
      return {type, kind: "Numération", prompt: `${first} + ${second} = ?`, answer: first + second};
    }
    if (type === "subtract") {
      const first = integer(random, 35, 130);
      const second = integer(random, 3, Math.min(48, first - 1));
      return {type, kind: "Soustraction", prompt: `${first} − ${second} = ?`, answer: first - second};
    }
    if (type === "subtract-near") {
      const second = [9, 19, 29][integer(random, 0, 2)];
      const first = integer(random, second + 25, 850);
      return {type, kind: "Retrancher rapidement", prompt: `${first} − ${second} = ?`, answer: first - second};
    }
    if (type === "subtract-place") {
      const second = [10, 20, 50, 100, 200, 300][integer(random, 0, 5)];
      const first = integer(random, Math.ceil((second + 100) / 10), 900) * 10;
      return {type, kind: "Numération", prompt: `${first} − ${second} = ?`, answer: first - second};
    }
    if (type === "complement") {
      const target = [100, 300, 1000][integer(random, 0, 2)];
      const step = target === 100 ? 5 : target === 300 ? 10 : 50;
      const known = integer(random, 2, Math.floor(target / step) - 2) * step;
      return {type, kind: "Complément", prompt: `${known} + ? = ${target}`, answer: target - known};
    }
    const factor = random() < 0.62 ? 10 : 100;
    const first = integer(random, 2, factor === 10 ? 99 : 27);
    return {type, kind: "Multiplier", prompt: `${first} × ${factor} = ?`, answer: first * factor};
  }

  function generateCalculations(random = Math.random) {
    const plan = shuffle([
      ...Array(6).fill("add"),
      ...Array(4).fill("add-near"),
      ...Array(3).fill("add-place"),
      ...Array(5).fill("subtract"),
      ...Array(3).fill("subtract-near"),
      ...Array(3).fill("subtract-place"),
      ...Array(4).fill("complement"),
      ...Array(2).fill("multiply")
    ], random);
    const prompts = new Set();
    return plan.map(type => {
      let question = calculationQuestion(type, random);
      for (let attempt = 0; prompts.has(question.prompt) && attempt < 12; attempt += 1) question = calculationQuestion(type, random);
      prompts.add(question.prompt);
      return question;
    });
  }

  const api = {generateTables, generateCalculations};
  root.AXELLE_CHALLENGE_LOGIC = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
