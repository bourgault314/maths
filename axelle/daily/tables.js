(function (root) {
  function shuffle(items, random) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function makeQuestion(type, first, second) {
    const product = first * second;
    if (type === "direct") return {type, kind: "Produit", prompt: `${first} × ${second} = ?`, answer: product, first, second};
    if (type === "right") return {type, kind: "Facteur manquant", prompt: `${first} × ? = ${product}`, answer: second, first, second};
    if (type === "left") return {type, kind: "Facteur manquant", prompt: `? × ${second} = ${product}`, answer: first, first, second};
    return {type, kind: "Autrement dit", prompt: `${product}, c’est ${first} fois combien ?`, answer: second, first, second};
  }

  function generateQuestions(random = Math.random) {
    const pairs = [];
    for (let first = 2; first <= 9; first += 1) {
      for (let second = 2; second <= 10; second += 1) pairs.push([first, second]);
    }
    const plan = [["direct", 12], ["right", 5], ["left", 4], ["word", 4]];
    const selected = plan.flatMap(([type, count]) => shuffle(pairs, random).slice(0, count).map(([first, second]) => makeQuestion(type, first, second)));
    return shuffle(selected, random);
  }

  const api = {generateQuestions};
  root.AXELLE_TABLES_LOGIC = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
