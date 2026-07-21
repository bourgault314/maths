(() => {
  "use strict";

  const SIZE = 5;
  const players = ["blue", "coral"];
  const labels = {blue: "bleu", coral: "corail"};
  const boardNode = document.querySelector("#board");
  const statusNode = document.querySelector("#status");
  const topPlayer = document.querySelector("#top-player");
  const bottomPlayer = document.querySelector("#bottom-player");
  const rules = document.querySelector("#rules");
  const result = document.querySelector("#result");
  let cells = [];
  let turn = 0;
  let finished = false;

  function index(row, column) { return row * SIZE + column; }

  function neighbors(row, column) {
    return [[row, column - 1], [row, column + 1], [row - 1, column], [row + 1, column], [row - 1, column + 1], [row + 1, column - 1]]
      .filter(([nextRow, nextColumn]) => nextRow >= 0 && nextRow < SIZE && nextColumn >= 0 && nextColumn < SIZE);
  }

  function winningPath(player) {
    const starts = [];
    for (let position = 0; position < SIZE; position += 1) {
      const row = player === "blue" ? position : 0;
      const column = player === "blue" ? 0 : position;
      if (cells[index(row, column)] === player) starts.push([row, column]);
    }
    const queue = [...starts];
    const seen = new Set(starts.map(([row, column]) => `${row},${column}`));
    const parents = new Map();
    while (queue.length) {
      const [row, column] = queue.shift();
      const reached = player === "blue" ? column === SIZE - 1 : row === SIZE - 1;
      if (reached) {
        const path = [];
        let key = `${row},${column}`;
        while (key) {
          path.push(key);
          key = parents.get(key);
        }
        return path;
      }
      for (const [nextRow, nextColumn] of neighbors(row, column)) {
        const key = `${nextRow},${nextColumn}`;
        if (!seen.has(key) && cells[index(nextRow, nextColumn)] === player) {
          seen.add(key);
          parents.set(key, `${row},${column}`);
          queue.push([nextRow, nextColumn]);
        }
      }
    }
    return null;
  }

  function updateTurn() {
    const player = players[turn];
    topPlayer.classList.toggle("active", player === "coral");
    bottomPlayer.classList.toggle("active", player === "blue");
    statusNode.className = "status-line";
    statusNode.textContent = `Au joueur ${labels[player]} : touche une case.`;
  }

  function finish(player, path) {
    finished = true;
    for (const key of path) boardNode.querySelector(`[data-key="${key}"]`).classList.add("path");
    statusNode.className = "status-line good";
    statusNode.textContent = `Le joueur ${labels[player]} a relié ses deux rives !`;
    document.querySelector("#result-title").textContent = `Victoire du joueur ${labels[player]} !`;
    document.querySelector("#result-text").textContent = "Son chemin doré traverse tout le plateau.";
    window.setTimeout(() => { result.hidden = false; }, 500);
  }

  function play(event) {
    const button = event.target.closest(".hex");
    if (!button || finished) return;
    const position = Number(button.dataset.index);
    if (cells[position]) return;
    const player = players[turn];
    cells[position] = player;
    button.classList.add(player);
    button.setAttribute("aria-label", `Case occupée par le joueur ${labels[player]}`);
    button.disabled = true;
    const path = winningPath(player);
    if (path) {
      finish(player, path);
      return;
    }
    turn = 1 - turn;
    updateTurn();
  }

  function start() {
    cells = Array(SIZE * SIZE).fill(null);
    turn = 0;
    finished = false;
    result.hidden = true;
    boardNode.querySelectorAll(".hex").forEach(node => node.remove());
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "hex";
        button.dataset.index = String(index(row, column));
        button.dataset.row = String(row);
        button.dataset.col = String(column);
        button.dataset.key = `${row},${column}`;
        button.style.left = `${column * 46 + row * 23 + 12}px`;
        button.style.top = `${row * 39 + 8}px`;
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `Case libre, ligne ${row + 1}, colonne ${column + 1}`);
        boardNode.append(button);
      }
    }
    updateTurn();
  }

  boardNode.addEventListener("click", play);
  document.querySelector("#rules-button").addEventListener("click", () => { rules.hidden = false; });
  document.querySelector(".close-rules").addEventListener("click", () => { rules.hidden = true; });
  document.querySelector("#reset-button").addEventListener("click", start);
  document.querySelector("#play-again").addEventListener("click", start);
  rules.addEventListener("click", event => { if (event.target === rules) rules.hidden = true; });

  window.AXELLE_TRAVERSEE = {winningPath: player => winningPath(player), start};
  start();
})();
