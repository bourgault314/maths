(function (root) {
  "use strict";

  const SIZE = 4;
  const GOAL = 10;
  const operationLabels = {sum:"somme",difference:"différence",product:"produit",quotient:"quotient"};
  const symbols = {sum:"+",difference:"−",product:"×",quotient:"÷"};

  function row(position) { return Math.floor(position / SIZE); }
  function column(position) { return position % SIZE; }
  function adjacent(first, second) { return Math.abs(row(first) - row(second)) + Math.abs(column(first) - column(second)) === 1; }
  function calculate(mode, first, second) {
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    if (mode === "sum") return first + second;
    if (mode === "difference") return high - low;
    if (mode === "product") return first * second;
    return high / low;
  }
  function expression(mode, first, second) {
    const high = Math.max(first, second);
    const low = Math.min(first, second);
    const left = mode === "difference" || mode === "quotient" ? high : first;
    const right = mode === "difference" || mode === "quotient" ? low : second;
    if (mode === "quotient" && high % low !== 0) return `${high} n’est pas divisible par ${low}`;
    return `${left} ${symbols[mode]} ${right} = ${calculate(mode, first, second)}`;
  }

  const api = {adjacent, calculate, expression};
  root.AXELLE_COFFRES_SOLO_LOGIC = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  const board = document.querySelector("#board");
  const status = document.querySelector("#status");
  const challenge = document.querySelector("#challenge-text");
  const counter = document.querySelector("#key-count");
  const lesson = document.querySelector("#lesson");
  const result = document.querySelector("#result");
  let values = [];
  let modes = [];
  let mode = "sum";
  let target = 0;
  let keys = 0;
  let firstSelection = null;
  let locked = false;
  let pendingTimer = null;

  function randomInteger(minimum, maximum) { return minimum + Math.floor(Math.random() * (maximum - minimum + 1)); }
  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = randomInteger(0, index);
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }
  function neighborPairs() {
    const pairs = [];
    for (let position = 0; position < SIZE * SIZE; position += 1) {
      if (column(position) < SIZE - 1) pairs.push([position, position + 1]);
      if (row(position) < SIZE - 1) pairs.push([position, position + SIZE]);
    }
    return pairs;
  }
  function pairFor(nextMode) {
    if (nextMode === "sum" || nextMode === "product") return [randomInteger(2, 9), randomInteger(2, 9)];
    if (nextMode === "difference") {
      const difference = randomInteger(2, 8);
      const low = randomInteger(1, 12 - difference);
      return [low + difference, low];
    }
    const divisor = randomInteger(2, 6);
    const quotient = randomInteger(2, 6);
    return [divisor * quotient, divisor];
  }
  function renderBoard() {
    board.replaceChildren();
    values.forEach((value, position) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rune";
      button.dataset.index = String(position);
      button.textContent = String(value);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Case ${value}, ligne ${row(position) + 1}, colonne ${column(position) + 1}`);
      board.append(button);
    });
  }
  function updateCounter() {
    counter.textContent = `🔑 ${keys} / ${GOAL}`;
  }
  function makeChallenge() {
    mode = modes[keys];
    values = Array.from({length: SIZE * SIZE}, () => randomInteger(1, 12));
    const pair = neighborPairs()[randomInteger(0, neighborPairs().length - 1)];
    const solution = pairFor(mode);
    values[pair[0]] = solution[0];
    values[pair[1]] = solution[1];
    target = calculate(mode, solution[0], solution[1]);
    firstSelection = null;
    locked = false;
    challenge.innerHTML = `une <b>${operationLabels[mode]}</b> de <strong>${target}</strong>`;
    status.className = "status-line";
    status.textContent = "Choisis deux cases qui se touchent par un côté.";
    renderBoard();
  }
  function clearSelection() {
    board.querySelectorAll(".selected,.success,.failure").forEach(node => node.classList.remove("selected", "success", "failure"));
    firstSelection = null;
  }
  function complete() {
    locked = true;
    document.querySelector("#result-score").textContent = `${GOAL} clés trouvées`;
    result.hidden = false;
  }
  function resolve(secondPosition) {
    const firstButton = board.querySelector(`[data-index="${firstSelection}"]`);
    const secondButton = board.querySelector(`[data-index="${secondPosition}"]`);
    const firstValue = values[firstSelection];
    const secondValue = values[secondPosition];
    const exactQuotient = mode !== "quotient" || Math.max(firstValue, secondValue) % Math.min(firstValue, secondValue) === 0;
    const correct = exactQuotient && calculate(mode, firstValue, secondValue) === target;
    locked = true;
    firstButton.classList.add(correct ? "success" : "failure");
    secondButton.classList.add(correct ? "success" : "failure");
    status.textContent = correct ? `${expression(mode, firstValue, secondValue)} : une clé gagnée !` : `${expression(mode, firstValue, secondValue)} : essaie une autre paire.`;
    status.className = `status-line ${correct ? "good" : "wrong"}`;
    if (correct) {
      keys += 1;
      updateCounter();
      pendingTimer = window.setTimeout(() => keys === GOAL ? complete() : makeChallenge(), 750);
    } else {
      pendingTimer = window.setTimeout(() => { clearSelection(); locked = false; status.className = "status-line"; status.textContent = "Cherche une autre paire de cases voisines."; }, 750);
    }
  }
  function select(position) {
    if (locked) return;
    if (firstSelection === position) { clearSelection(); return; }
    if (firstSelection === null) {
      firstSelection = position;
      board.querySelector(`[data-index="${position}"]`).classList.add("selected");
      status.textContent = "Choisis maintenant une case voisine.";
      return;
    }
    if (!adjacent(firstSelection, position)) {
      clearSelection();
      firstSelection = position;
      board.querySelector(`[data-index="${position}"]`).classList.add("selected");
      status.className = "status-line wrong";
      status.textContent = "Les cases doivent se toucher par un côté. Cette case devient la première.";
      return;
    }
    resolve(position);
  }
  function start() {
    if (pendingTimer) window.clearTimeout(pendingTimer);
    modes = shuffle(["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"]);
    keys = 0;
    locked = false;
    result.hidden = true;
    lesson.hidden = true;
    updateCounter();
    makeChallenge();
  }

  board.addEventListener("click", event => {
    const button = event.target.closest(".rune");
    if (button) select(Number(button.dataset.index));
  });
  document.querySelector("#start-game").addEventListener("click", start);
  document.querySelector("#show-lesson").addEventListener("click", () => { lesson.hidden = false; });
  document.querySelector("#close-lesson").addEventListener("click", () => {
    if (!values.length) start();
    else lesson.hidden = true;
  });
  document.querySelector("#reset-button").addEventListener("click", start);
  document.querySelector("#play-again").addEventListener("click", start);
  lesson.hidden = false;
  updateCounter();
})(typeof window !== "undefined" ? window : globalThis);
