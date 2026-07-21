(() => {
  "use strict";

  const SIZE = 4;
  const KEYS_TO_WIN = 5;
  const players = ["blue","coral"];
  const labels = {blue:"bleu",coral:"corail"};
  const boardNode = document.querySelector("#board");
  const gameCore = document.querySelector("#game-core");
  const statusNode = document.querySelector("#status");
  const challengeNode = document.querySelector("#challenge-text");
  const topPlayer = document.querySelector("#top-player");
  const bottomPlayer = document.querySelector("#bottom-player");
  const rules = document.querySelector("#rules");
  const result = document.querySelector("#result");
  let values = [];
  let mode = "sum";
  let target = 0;
  let turn = 0;
  let scores = [0,0];
  let firstSelection = null;
  let challengeNumber = 0;
  let locked = false;
  let finished = false;
  let pendingTimer = null;

  function randomInteger(min,max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function row(position) { return Math.floor(position / SIZE); }
  function column(position) { return position % SIZE; }
  function adjacent(first,second) { return Math.abs(row(first)-row(second)) + Math.abs(column(first)-column(second)) === 1; }
  function operation(first,second) { return mode === "sum" ? first + second : first * second; }
  function expression(first,second) { return `${first} ${mode === "sum" ? "+" : "×"} ${second} = ${operation(first,second)}`; }

  function neighborPairs() {
    const pairs = [];
    for (let position = 0; position < SIZE * SIZE; position += 1) {
      if (column(position) < SIZE - 1) pairs.push([position,position + 1]);
      if (row(position) < SIZE - 1) pairs.push([position,position + SIZE]);
    }
    return pairs;
  }

  function makeChallenge() {
    challengeNumber += 1;
    mode = challengeNumber % 2 ? "sum" : "product";
    values = Array.from({length:SIZE * SIZE},() => randomInteger(2,9));
    const pairs = neighborPairs();
    const [firstPosition,secondPosition] = pairs[randomInteger(0,pairs.length - 1)];
    let firstValue;
    let secondValue;
    if (mode === "sum") {
      firstValue = randomInteger(3,9);
      secondValue = randomInteger(2,9);
    } else {
      firstValue = randomInteger(2,9);
      secondValue = randomInteger(2,9);
    }
    values[firstPosition] = firstValue;
    values[secondPosition] = secondValue;
    target = operation(firstValue,secondValue);
    firstSelection = null;
    locked = false;
    challengeNode.textContent = mode === "sum" ? `une somme de ${target}` : `un produit de ${target}`;
    renderBoard();
  }

  function renderBoard() {
    boardNode.replaceChildren();
    values.forEach((value,position) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rune";
      button.dataset.index = String(position);
      button.dataset.value = String(value);
      button.setAttribute("role","gridcell");
      button.setAttribute("aria-label",`Rune ${value}, ligne ${row(position) + 1}, colonne ${column(position) + 1}`);
      const text = document.createElement("span");
      text.textContent = String(value);
      button.append(text);
      boardNode.append(button);
    });
  }

  function updateTurn(message) {
    const player = players[turn];
    topPlayer.classList.toggle("active",player === "coral");
    bottomPlayer.classList.toggle("active",player === "blue");
    gameCore.classList.toggle("facing-top",turn === 1);
    document.querySelector("#blue-score").textContent = `🔑 ${scores[0]} / ${KEYS_TO_WIN}`;
    document.querySelector("#coral-score").textContent = `🔑 ${scores[1]} / ${KEYS_TO_WIN}`;
    statusNode.className = "status-line";
    statusNode.textContent = message || `Au joueur ${labels[player]} : choisis deux runes voisines.`;
  }

  function finish() {
    finished = true;
    locked = true;
    const player = labels[players[turn]];
    statusNode.className = "status-line good";
    statusNode.textContent = `Le joueur ${player} a gagné les cinq clés !`;
    document.querySelector("#result-title").textContent = `Trésor du joueur ${player} !`;
    document.querySelector("#result-text").textContent = "Les cinq serrures sont ouvertes.";
    document.querySelector("#result-score").textContent = `${scores[0]} clé${scores[0] > 1 ? "s" : ""} à ${scores[1]}`;
    pendingTimer = window.setTimeout(() => { result.hidden = false; },450);
  }

  function nextTurn() {
    turn = 1 - turn;
    makeChallenge();
    updateTurn();
  }

  function resolve(secondPosition) {
    const firstButton = boardNode.querySelector(`[data-index="${firstSelection}"]`);
    const secondButton = boardNode.querySelector(`[data-index="${secondPosition}"]`);
    const firstValue = values[firstSelection];
    const secondValue = values[secondPosition];
    const correct = operation(firstValue,secondValue) === target;
    locked = true;
    firstButton.classList.add(correct ? "success" : "failure");
    secondButton.classList.add(correct ? "success" : "failure");
    if (correct) {
      scores[turn] += 1;
      updateTurn(`${expression(firstValue,secondValue)} : une clé gagnée !`);
      statusNode.className = "status-line good";
      if (scores[turn] === KEYS_TO_WIN) {
        finish();
        return;
      }
    } else {
      updateTurn(`${expression(firstValue,secondValue)} : le coffre reste fermé.`);
      statusNode.className = "status-line wrong";
    }
    pendingTimer = window.setTimeout(nextTurn,850);
  }

  function select(position) {
    if (locked || finished) return;
    if (firstSelection === position) {
      boardNode.querySelector(`[data-index="${position}"]`).classList.remove("selected");
      firstSelection = null;
      statusNode.className = "status-line";
      statusNode.textContent = "Choisis deux runes voisines.";
      return;
    }
    if (firstSelection === null) {
      firstSelection = position;
      boardNode.querySelector(`[data-index="${position}"]`).classList.add("selected");
      statusNode.className = "status-line";
      statusNode.textContent = "Maintenant, choisis une rune qui la touche par un côté.";
      return;
    }
    if (!adjacent(firstSelection,position)) {
      boardNode.querySelector(`[data-index="${firstSelection}"]`).classList.remove("selected");
      firstSelection = position;
      boardNode.querySelector(`[data-index="${position}"]`).classList.add("selected");
      statusNode.className = "status-line wrong";
      statusNode.textContent = "Ces runes ne sont pas voisines. Cette nouvelle rune devient la première.";
      return;
    }
    resolve(position);
  }

  function start() {
    if (pendingTimer) window.clearTimeout(pendingTimer);
    turn = 0;
    scores = [0,0];
    challengeNumber = 0;
    firstSelection = null;
    locked = false;
    finished = false;
    result.hidden = true;
    makeChallenge();
    updateTurn();
  }

  boardNode.addEventListener("click", event => {
    const button = event.target.closest(".rune");
    if (button) select(Number(button.dataset.index));
  });
  document.querySelector("#rules-button").addEventListener("click",() => { rules.hidden = false; });
  document.querySelector(".close-rules").addEventListener("click",() => { rules.hidden = true; });
  document.querySelector("#reset-button").addEventListener("click",start);
  document.querySelector("#play-again").addEventListener("click",start);
  rules.addEventListener("click",event => { if (event.target === rules) rules.hidden = true; });

  window.AXELLE_COFFRES = {adjacent,operation,start,getState:() => ({values:[...values],mode,target,turn,scores:[...scores]})};
  start();
})();
