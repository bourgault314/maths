(() => {
  "use strict";

  const SIZE = 6;
  const TOTAL_PIECES = 6;
  const SHAPES = {
    domino: [[0,0],[0,1]],
    bar: [[0,0],[0,1],[0,2]],
    elbow: [[0,0],[1,0],[1,1]]
  };
  const shapeNames = {domino:"Domino",bar:"Barre",elbow:"Forme L"};
  const players = ["blue","coral"];
  const labels = {blue:"bleu",coral:"corail"};
  const boardNode = document.querySelector("#board");
  const statusNode = document.querySelector("#status");
  const pieceTools = document.querySelector("#piece-tools");
  const topPlayer = document.querySelector("#top-player");
  const bottomPlayer = document.querySelector("#bottom-player");
  const rules = document.querySelector("#rules");
  const result = document.querySelector("#result");
  let board = [];
  let turn = 0;
  let selected = "domino";
  let rotation = 0;
  let inventories = [];
  let placed = [];
  let finished = false;

  function normalize(points) {
    const minRow = Math.min(...points.map(([row]) => row));
    const minColumn = Math.min(...points.map(([,column]) => column));
    return points.map(([row,column]) => [row - minRow,column - minColumn]).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
  }

  function rotatedShape(name, turns = rotation) {
    let points = SHAPES[name].map(point => [...point]);
    for (let count = 0; count < turns % 4; count += 1) points = points.map(([row,column]) => [column,-row]);
    return normalize(points);
  }

  function allRotations(name) {
    const unique = new Map();
    for (let turns = 0; turns < 4; turns += 1) {
      const points = rotatedShape(name, turns);
      unique.set(JSON.stringify(points), points);
    }
    return [...unique.values()];
  }

  function coordinates(row, column, shape = rotatedShape(selected)) {
    return shape.map(([rowOffset,columnOffset]) => [row + rowOffset,column + columnOffset]);
  }

  function canPlace(row, column, shape = rotatedShape(selected)) {
    return coordinates(row,column,shape).every(([nextRow,nextColumn]) => nextRow >= 0 && nextRow < SIZE && nextColumn >= 0 && nextColumn < SIZE && !board[nextRow * SIZE + nextColumn]);
  }

  function hasMove(playerIndex) {
    for (const name of Object.keys(SHAPES)) {
      if (!inventories[playerIndex][name]) continue;
      for (const shape of allRotations(name)) {
        for (let row = 0; row < SIZE; row += 1) {
          for (let column = 0; column < SIZE; column += 1) if (canPlace(row,column,shape)) return true;
        }
      }
    }
    return false;
  }

  function miniPiece(name) {
    const mini = document.createElement("span");
    mini.className = "mini-piece";
    for (const [row,column] of SHAPES[name]) {
      const cell = document.createElement("i");
      cell.style.gridRow = String(row + 1);
      cell.style.gridColumn = String(column + 1);
      mini.append(cell);
    }
    return mini;
  }

  function renderChoices() {
    const inventory = inventories[turn];
    document.querySelectorAll(".piece-choice").forEach(button => {
      const name = button.dataset.shape;
      button.replaceChildren();
      button.append(miniPiece(name));
      const text = document.createElement("span");
      text.className = "piece-name";
      text.innerHTML = `${shapeNames[name]}<small class="piece-count">× ${inventory[name]}</small>`;
      button.append(text);
      button.disabled = inventory[name] === 0;
      button.classList.toggle("selected", name === selected);
    });
    pieceTools.classList.toggle("facing-top", turn === 1);
  }

  function renderBoard() {
    boardNode.replaceChildren();
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        const position = row * SIZE + column;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "paving-cell";
        button.dataset.row = String(row);
        button.dataset.col = String(column);
        button.setAttribute("role","gridcell");
        if (board[position]) {
          button.classList.add(board[position]);
          button.disabled = true;
          button.setAttribute("aria-label",`Case occupée par le joueur ${labels[board[position]]}`);
        } else button.setAttribute("aria-label",`Case libre, ligne ${row + 1}, colonne ${column + 1}`);
        boardNode.append(button);
      }
    }
  }

  function updateTurn(message) {
    const player = players[turn];
    topPlayer.classList.toggle("active", player === "coral");
    bottomPlayer.classList.toggle("active", player === "blue");
    document.querySelector("#blue-score").textContent = `${placed[0]} / ${TOTAL_PIECES}`;
    document.querySelector("#coral-score").textContent = `${placed[1]} / ${TOTAL_PIECES}`;
    statusNode.className = "status-line";
    statusNode.textContent = message || `Au joueur ${labels[player]} : choisis puis pose une pièce.`;
    renderChoices();
  }

  function chooseAvailable() {
    if (inventories[turn][selected]) return;
    selected = Object.keys(SHAPES).find(name => inventories[turn][name]) || "domino";
    rotation = 0;
  }

  function finish(winner, reason) {
    finished = true;
    statusNode.className = "status-line good";
    statusNode.textContent = `Le joueur ${labels[winner]} remporte le pavage !`;
    document.querySelector("#result-title").textContent = `Victoire du joueur ${labels[winner]} !`;
    document.querySelector("#result-text").textContent = reason;
    window.setTimeout(() => { result.hidden = false; }, 450);
  }

  function place(row,column) {
    if (finished || !inventories[turn][selected]) return;
    const shape = rotatedShape(selected);
    if (!canPlace(row,column,shape)) {
      statusNode.className = "status-line wrong";
      statusNode.textContent = "Cette pièce ne tient pas ici. Essaie une autre case ou tourne-la.";
      return;
    }
    const player = players[turn];
    for (const [nextRow,nextColumn] of coordinates(row,column,shape)) board[nextRow * SIZE + nextColumn] = player;
    inventories[turn][selected] -= 1;
    placed[turn] += 1;
    renderBoard();
    if (placed[turn] === TOTAL_PIECES) {
      finish(turn,"Il a réussi à poser ses six formes sur le quadrillage.");
      return;
    }
    turn = 1 - turn;
    chooseAvailable();
    if (!hasMove(turn)) {
      finish(1 - turn,`Le joueur ${labels[turn]} n’a plus aucun emplacement possible.`);
      return;
    }
    updateTurn();
  }

  function start() {
    board = Array(SIZE * SIZE).fill(null);
    turn = 0;
    selected = "domino";
    rotation = 0;
    inventories = [
      {domino:2,bar:2,elbow:2},
      {domino:2,bar:2,elbow:2}
    ];
    placed = [0,0];
    finished = false;
    result.hidden = true;
    renderBoard();
    updateTurn();
  }

  pieceTools.addEventListener("click", event => {
    const button = event.target.closest(".piece-choice");
    if (!button || button.disabled || finished) return;
    selected = button.dataset.shape;
    rotation = 0;
    renderChoices();
    statusNode.className = "status-line";
    statusNode.textContent = `Pièce choisie : ${shapeNames[selected].toLowerCase()}. Touche sa première case.`;
  });
  document.querySelector("#rotate-piece").addEventListener("click", () => {
    if (finished) return;
    rotation = (rotation + 1) % 4;
    statusNode.className = "status-line";
    statusNode.textContent = "Pièce tournée d’un quart de tour.";
  });
  boardNode.addEventListener("click", event => {
    const cell = event.target.closest(".paving-cell");
    if (cell) place(Number(cell.dataset.row),Number(cell.dataset.col));
  });
  document.querySelector("#rules-button").addEventListener("click", () => { rules.hidden = false; });
  document.querySelector(".close-rules").addEventListener("click", () => { rules.hidden = true; });
  document.querySelector("#reset-button").addEventListener("click", start);
  document.querySelector("#play-again").addEventListener("click", start);
  rules.addEventListener("click", event => { if (event.target === rules) rules.hidden = true; });

  window.AXELLE_PAVAGE = {canPlace,hasMove,start};
  start();
})();
