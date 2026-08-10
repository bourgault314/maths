import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { runInNewContext, Script } from "node:vm";

const sourceUrl = new URL("../_sources/chat-le-chat/projection_cases.json", import.meta.url);
const seriesUrl = new URL("../_sources/chat-le-chat/series20.json", import.meta.url);
const generatorUrl = new URL("../_sources/chat-le-chat/gen_projection.py", import.meta.url);
const htmlUrl = new URL("../outils/chat-cest-toi-le-chat-projection.html", import.meta.url);
const data = JSON.parse(readFileSync(sourceUrl, "utf8"));
const printedSeries = JSON.parse(readFileSync(seriesUrl, "utf8"));
const html = readFileSync(htmlUrl, "utf8");

const directions = {
  front: [-1, 0],
  back: [1, 0],
  left: [0, -1],
  right: [0, 1]
};
const transforms = [
  { front: "front", back: "back", left: "left", right: "right" },
  { front: "front", back: "back", left: "right", right: "left" },
  { front: "back", back: "front", left: "left", right: "right" },
  { front: "back", back: "front", left: "right", right: "left" }
];
const expectedPattern = [true, false, false, true, false, true, true, false, false, true, false, true];
const expectedMinActions = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 2, 0];

function positions(grid) {
  const result = new Map();
  grid.forEach((row, rowIndex) => row.forEach((player, columnIndex) => {
    if (player) result.set(player, [rowIndex, columnIndex]);
  }));
  return result;
}

function evaluate(cards, grid) {
  const playerPositions = positions(grid);
  const occupied = new Set([...playerPositions.values()].map(position => position.join(",")));
  const status = {};
  for (const [rawPlayer, constraints] of Object.entries(cards)) {
    const [row, column] = playerPositions.get(Number(rawPlayer));
    status[rawPlayer] = Object.entries(constraints).every(([direction, wanted]) => {
      const [deltaRow, deltaColumn] = directions[direction];
      const neighbor = `${row + deltaRow},${column + deltaColumn}`;
      const somebody = occupied.has(neighbor);
      return wanted === "P" ? somebody : !somebody;
    });
  }
  return status;
}

function isValid(status) {
  return Object.values(status).every(Boolean);
}

function countOneMoveCorrections(cards, grid) {
  const playerPositions = positions(grid);
  const emptyCells = [];
  grid.forEach((row, rowIndex) => row.forEach((player, columnIndex) => {
    if (!player) emptyCells.push([rowIndex, columnIndex]);
  }));
  let count = 0;
  for (const [player, [sourceRow, sourceColumn]] of playerPositions) {
    for (const [targetRow, targetColumn] of emptyCells) {
      const candidate = grid.map(row => [...row]);
      candidate[sourceRow][sourceColumn] = 0;
      candidate[targetRow][targetColumn] = player;
      if (isValid(evaluate(cards, candidate))) count += 1;
    }
  }
  return count;
}

function countExchangeCorrections(cards, grid) {
  const playerPositions = [...positions(grid)];
  let count = 0;
  for (let first = 0; first < playerPositions.length; first += 1) {
    for (let second = first + 1; second < playerPositions.length; second += 1) {
      const [firstPlayer, [firstRow, firstColumn]] = playerPositions[first];
      const [secondPlayer, [secondRow, secondColumn]] = playerPositions[second];
      const candidate = grid.map(row => [...row]);
      candidate[firstRow][firstColumn] = secondPlayer;
      candidate[secondRow][secondColumn] = firstPlayer;
      if (isValid(evaluate(cards, candidate))) count += 1;
    }
  }
  return count;
}

function gridKey(grid) {
  return grid.flat().join("");
}

function placementActions(grid) {
  const flat = grid.flat();
  const actions = [];
  for (let first = 0; first < flat.length; first += 1) {
    for (let second = first + 1; second < flat.length; second += 1) {
      const firstPlayer = flat[first];
      const secondPlayer = flat[second];
      if (!firstPlayer && !secondPlayer) continue;
      const candidate = [...flat];
      [candidate[first], candidate[second]] = [candidate[second], candidate[first]];
      const players = [firstPlayer, secondPlayer].filter(Boolean);
      actions.push({
        grid: [candidate.slice(0, 3), candidate.slice(3)],
        type: players.length === 2 ? "exchange" : "move",
        players
      });
    }
  }
  return actions;
}

function actionBetween(before, after) {
  return placementActions(before).find(action => gridKey(action.grid) === gridKey(after)) ?? null;
}

function shortestCorrections(cards, grid) {
  if (isValid(evaluate(cards, grid))) return { depth: 0, grids: [grid] };
  const seen = new Set([gridKey(grid)]);
  let frontier = new Map([[gridKey(grid), grid]]);
  for (let depth = 1; depth <= 6; depth += 1) {
    const next = new Map();
    const valid = new Map();
    for (const current of frontier.values()) {
      for (const action of placementActions(current)) {
        const key = gridKey(action.grid);
        if (seen.has(key)) continue;
        next.set(key, action.grid);
        if (isValid(evaluate(cards, action.grid))) valid.set(key, action.grid);
      }
    }
    if (valid.size) return { depth, grids: [...valid.values()] };
    for (const key of next.keys()) seen.add(key);
    frontier = next;
  }
  throw new Error("Aucune correction accessible.");
}

function extractGeneratedFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `La fonction ${name} doit être présente dans le HTML généré.`);
  const bodyStart = html.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`La fonction ${name} est incomplète.`);
}

function assertGrid(grid, label) {
  assert.equal(grid.length, 2, `${label} doit avoir deux rangées.`);
  assert.ok(grid.every(row => row.length === 3), `${label} doit avoir trois colonnes.`);
  assert.deepEqual(grid.flat().filter(Boolean).sort(), [1, 2, 3, 4], `${label} doit placer 1 à 4 une fois.`);
}

function canonical(cards) {
  return transforms.map(transform => Object.values(cards)
    .map(card => JSON.stringify(Object.entries(card)
      .map(([direction, wanted]) => [transform[direction], wanted])
      .sort(([a], [b]) => a.localeCompare(b))))
    .sort()
    .join("|")
  ).sort()[0];
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map(index => Number.parseInt(normalized.slice(index, index + 2), 16));
}

function relativeLuminance(hex) {
  const channels = hexToRgb(hex).map(value => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

test("l’exemple guidé isole la carte 2 puis déplace uniquement l’enfant 2", () => {
  assert.ok(data.guided, "L’exemple guidé doit rester dans le JSON source.");
  assertGrid(data.guided.proposed, "Exemple proposé");
  assertGrid(data.guided.correction, "Exemple corrigé");
  assert.deepEqual(evaluate(data.guided.cards, data.guided.proposed), {
    1: true,
    2: false,
    3: true,
    4: true
  });
  assert.equal(isValid(evaluate(data.guided.cards, data.guided.correction)), true);
  const before = positions(data.guided.proposed);
  const after = positions(data.guided.correction);
  assert.deepEqual([1, 2, 3, 4].filter(player => before.get(player).join() !== after.get(player).join()), [2]);
});

test("les douze défis progressent du déplacement simple à la correction en deux actions", () => {
  assert.equal(data.version, 1);
  assert.equal(data.cases.length, 12);
  const verdicts = data.cases.map((item, index) => {
    assert.equal(item.id, `defi-${String(index + 1).padStart(2, "0")}`);
    assert.equal(item.difficulty, Math.floor(index / 4) + 1);
    assert.deepEqual(Object.keys(item.cards).sort(), ["1", "2", "3", "4"]);
    assertGrid(item.proposed, `${item.id}, placement proposé`);
    const valid = isValid(evaluate(item.cards, item.proposed));
    if (valid) {
      assert.equal(item.correction, null, `${item.id} est déjà juste.`);
      assert.equal(item.correctionIntermediate, undefined, `${item.id} ne doit pas avoir d'étape de correction.`);
    } else {
      assertGrid(item.correction, `${item.id}, correction`);
      assert.equal(isValid(evaluate(item.cards, item.correction)), true, `${item.id} doit avoir une correction juste.`);
      const shortest = shortestCorrections(item.cards, item.proposed);
      assert.equal(shortest.depth, expectedMinActions[index], `${item.id} doit avoir la profondeur prévue.`);
      assert.ok(shortest.grids.some(grid => gridKey(grid) === gridKey(item.correction)),
        `${item.id} doit afficher une correction minimale.`);
      const path = [item.proposed];
      if (item.correctionIntermediate) {
        assertGrid(item.correctionIntermediate, `${item.id}, correction intermédiaire`);
        assert.equal(isValid(evaluate(item.cards, item.correctionIntermediate)), false,
          `${item.id}, l'étape intermédiaire doit encore demander une correction.`);
        path.push(item.correctionIntermediate);
      }
      path.push(item.correction);
      assert.equal(path.length - 1, shortest.depth, `${item.id} doit montrer le bon nombre d'actions.`);
      for (let step = 1; step < path.length; step += 1) {
        assert.ok(actionBetween(path[step - 1], path[step]),
          `${item.id}, l'étape ${step} doit être un déplacement ou un échange autorisé.`);
      }
    }
    return valid;
  });
  assert.deepEqual(verdicts, expectedPattern);
  assert.equal(verdicts.filter(Boolean).length, 6);
  assert.equal(
    createHash("sha256").update(JSON.stringify(data.cases.map(item => item.cards))).digest("hex"),
    "6dab5c9b29968aef38ff10de61454653b54575616b7f71dc425c7714acfa058a",
    "Les douze jeux de cartes validés doivent rester strictement inchangés."
  );
  assert.deepEqual(evaluate(data.cases[7].cards, data.cases[7].proposed), {
    1: true, 2: true, 3: true, 4: false
  }, "Le défi 8 doit masquer la nécessité d'échanger derrière une seule carte fausse.");
  assert.deepEqual(evaluate(data.cases[10].cards, data.cases[10].proposed), {
    1: true, 2: false, 3: true, 4: false
  }, "Le défi 11 doit commencer avec exactement deux cartes fausses.");
  assert.deepEqual(evaluate(data.cases[10].cards, data.cases[10].correctionIntermediate), {
    1: true, 2: false, 3: true, 4: true
  }, "Après le premier bon déplacement du défi 11, une seule carte doit rester fausse.");
});

test("les corrections par déplacement ou échange sont toutes comptées", () => {
  const expectedMoveCounts = [0, 2, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0];
  const expectedExchangeCounts = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
  const expectedCounts = [0, 3, 1, 0, 3, 0, 0, 1, 1, 0, 1, 0];
  assert.deepEqual(
    data.cases.map(item => item.correction ? countOneMoveCorrections(item.cards, item.proposed) : 0),
    expectedMoveCounts
  );
  assert.deepEqual(
    data.cases.map(item => item.correction ? countExchangeCorrections(item.cards, item.proposed) : 0),
    expectedExchangeCounts
  );
  const payloadMatch = html.match(/<script id="projection-data" type="application\/json">(.*?)<\/script>/s);
  assert.ok(payloadMatch);
  const payload = JSON.parse(payloadMatch[1]);
  assert.deepEqual(payload.cases.map(item => item.correctionCount), expectedCounts);
  assert.deepEqual(payload.cases.map(item => item.moveCorrectionCount), expectedMoveCounts);
  assert.deepEqual(payload.cases.map(item => item.exchangeCorrectionCount), expectedExchangeCounts);
  assert.deepEqual(payload.cases.map(item => item.correctionActionCount), expectedMinActions);
  assert.deepEqual(payload.cases[7].solutionActions, [{ type: "exchange", players: [4, 2] }]);
  assert.deepEqual(payload.cases[10].solutionActions, [
    { type: "move", players: [3] },
    { type: "move", players: [1] }
  ]);
});

test("une action manipulée déplace vers un vide ou échange deux chats", () => {
  const applyPlacementAction = runInNewContext(`(${extractGeneratedFunction("applyPlacementAction")})`);
  const plain = value => JSON.parse(JSON.stringify(value));
  const challenge2 = data.cases[1];
  const moved = applyPlacementAction(challenge2.proposed, 0, 2);
  assert.deepEqual(plain(moved.grid), [[0,4,1],[2,3,0]]);
  assert.equal(moved.sourcePlayer, 1);
  assert.equal(moved.targetPlayer, 0);
  assert.equal(isValid(evaluate(challenge2.cards, moved.grid)), true);

  const exchanged = applyPlacementAction(challenge2.proposed, 0, 1);
  assert.deepEqual(plain(exchanged.grid), [[4,1,0],[2,3,0]]);
  assert.equal(exchanged.sourcePlayer, 1);
  assert.equal(exchanged.targetPlayer, 4);
  assert.equal(isValid(evaluate(challenge2.cards, exchanged.grid)), true);
  assert.equal(applyPlacementAction(challenge2.proposed, 0, 0), null);
  assert.equal(applyPlacementAction(challenge2.proposed, 2, 0), null);

  const challenge8 = data.cases[7];
  const secondExchange = applyPlacementAction(challenge8.proposed, 1, 4);
  assert.deepEqual(plain(secondExchange.grid), [[1,2,0],[3,4,0]]);
  assert.equal(isValid(evaluate(challenge8.cards, secondExchange.grid)), true);
  assert.equal(countOneMoveCorrections(challenge8.cards, challenge8.proposed), 0,
    "Le défi 8 ne doit accepter aucun simple déplacement vers un vide.");

  const challenge11 = data.cases[10];
  const firstMove = applyPlacementAction(challenge11.proposed, 0, 3);
  assert.deepEqual(plain(firstMove.grid), challenge11.correctionIntermediate);
  assert.equal(isValid(evaluate(challenge11.cards, firstMove.grid)), false);
  const secondMove = applyPlacementAction(firstMove.grid, 5, 2);
  assert.deepEqual(plain(secondMove.grid), challenge11.correction);
  assert.equal(isValid(evaluate(challenge11.cards, secondMove.grid)), true);
  const reverseFirstMove = applyPlacementAction(challenge11.proposed, 5, 2);
  assert.equal(isValid(evaluate(challenge11.cards, reverseFirstMove.grid)), false);
  const reverseSecondMove = applyPlacementAction(reverseFirstMove.grid, 0, 3);
  assert.deepEqual(plain(reverseSecondMove.grid), challenge11.correction,
    "Les deux déplacements du défi 11 doivent pouvoir être effectués dans l'ordre inverse.");
  const minimalPaths = placementActions(challenge11.proposed).flatMap(first =>
    placementActions(first.grid)
      .filter(second => isValid(evaluate(challenge11.cards, second.grid)))
      .map(second => second.grid)
  );
  assert.equal(minimalPaths.length, 2, "Le défi 11 doit avoir exactement deux chemins minimaux.");
  assert.ok(minimalPaths.every(grid => gridKey(grid) === gridKey(challenge11.correction)),
    "Les deux ordres minimaux du défi 11 doivent mener à la même correction.");
  assert.equal(countOneMoveCorrections(challenge11.cards, challenge11.proposed), 0);
  assert.equal(countExchangeCorrections(challenge11.cards, challenge11.proposed), 0);

  const challenge3 = data.cases[2];
  const temptingButWrong = applyPlacementAction(challenge3.proposed, 1, 0);
  assert.deepEqual(plain(temptingButWrong.grid), [[4,0,3],[1,2,0]]);
  assert.deepEqual(evaluate(challenge3.cards, temptingButWrong.grid), {
    1: true,
    2: false,
    3: false,
    4: true
  });
});

test("les défis projetés ne dupliquent ni les séries imprimées ni un autre défi par symétrie", () => {
  const printed = new Set(printedSeries.map(item => canonical(item.cards)));
  const projected = data.cases.map(item => canonical(item.cards));
  const guided = canonical(data.guided.cards);
  assert.equal(new Set(projected).size, projected.length);
  assert.deepEqual(projected.filter(signature => printed.has(signature)), []);
  assert.equal(printed.has(guided), false, "L’exemple guidé ne doit révéler aucune série imprimée.");
  assert.equal(projected.includes(guided), false, "L’exemple guidé doit être distinct des défis.");
});

test("le HTML publié est autonome, synchronisé et adapté à une réflexion collective", () => {
  const payloadMatch = html.match(/<script id="projection-data" type="application\/json">(.*?)<\/script>/s);
  assert.ok(payloadMatch, "Les données validées doivent être embarquées dans la page.");
  const payload = JSON.parse(payloadMatch[1]);
  assert.equal(payload.cases.length, 12);
  assert.deepEqual(payload.cases.map(item => item.cards), data.cases.map(item => item.cards));
  assert.deepEqual(payload.guided.cards, data.guided.cards);
  const appScript = [...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .find(source => source.includes("const state ="));
  assert.ok(appScript, "Le script de l’outil doit être présent.");
  assert.doesNotThrow(() => new Script(appScript), "Le script de l’outil doit avoir une syntaxe JavaScript valide.");

  for (const id of [
    "home-screen", "challenge-screen", "placement-grid", "cards-grid",
    "catalog-button", "home-button", "reveal-button", "fullscreen-button",
    "previous-button", "next-button", "placement-question", "placement-hint"
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.equal(
    (html.match(/revealButton\.addEventListener\('click', revealNextCard\)/g) || []).length,
    1,
    "Un clic ne doit révéler qu’une seule carte."
  );
  assert.match(
    html,
    /document\.querySelector\(`#cards-grid \.logic-card\[data-player="\$\{player\}"\]`\)/,
    "Le halo de progression doit cibler la carte visible du défi."
  );

  assert.match(html, /observe le placement projeté depuis sa place/i);
  assert.doesNotMatch(html, /Variante au sol/i);
  assert.doesNotMatch(html, /Chacun cherche d'abord depuis sa place/i);
  assert.match(html, /12 défis inédits · École et collège/i);
  assert.match(html, /de la maternelle au collège/i);
  assert.doesNotMatch(html, /12 défis inédits · GS-CP/i);
  assert.match(html, /vérifiez les cartes à voix haute/i);
  assert.match(html, /un chat barré signifie « personne dans ce cercle, ou aucun cercle dans cette direction »/i);
  assert.match(html, /alt="maths&amp;go"/, "La barre doit employer le logo horizontal maths&go.");
  assert.match(html, /class="brand" href="index\.html"/, "Le logo doit revenir au catalogue des outils.");
  assert.match(html, /id="catalog-button" href="index\.html"/, "L’accueil du module doit proposer un retour visible au catalogue.");
  assert.match(html, /id="home-button"[^>]+aria-label="Retourner au menu des défis"[\s\S]*?<span class="button-label">Menu<\/span>/,
    "Un défi doit proposer un retour explicite au menu du module, distinct du catalogue.");
  assert.match(html, /\.hero-copy \{[^}]*align-self:stretch/s,
    "Les deux panneaux de l’accueil doivent avoir la même hauteur.");
  assert.match(html, /\.picker-grid \{[^}]*grid-template-columns:repeat\(6,minmax\(58px,1fr\)\)/s,
    "Les douze défis doivent tenir sur deux rangées de six.");
  assert.match(html, /@media \(min-width:950px\) and \(max-height:900px\) \{[\s\S]*?\.home \{ padding:10px 18px; \}[\s\S]*?\.picker-button \{ min-height:38px; padding:4px; \}/,
    "L’accueil et la projection doivent se compacter dès que la fenêtre est moins haute qu’un plein écran courant.");
  assert.match(html, /\.cards-panel \{[^}]*--feedback-height:108px; --decision-height:76px/s,
    "Le panneau doit réserver dès le départ la place maximale des explications et du verdict.");
  assert.match(html, /\.feedback \{[^}]*flex:0 0 var\(--feedback-height\);[^}]*height:var\(--feedback-height\)[^}]*max-height:var\(--feedback-height\)/s,
    "Les explications ne doivent plus redimensionner les cartes pendant la vérification.");
  assert.match(html, /\.feedback \{[^}]*overflow:hidden/s,
    "Une explication ne doit pas dépendre d'une barre de défilement interne.");
  assert.match(html, /\.feedback ul\.three-clauses \{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/s,
    "Les cartes à trois indications doivent présenter leurs explications sur trois colonnes.");
  assert.match(html, /@media \(min-width:950px\) and \(max-height:720px\) \{[\s\S]*?\.card-map \{ width:min\(100%,120px\); \}/,
    "Une fenêtre basse doit réduire les cartes sans les redimensionner pendant la vérification.");
  assert.match(html, /<div class="decision-slot">[\s\S]*?<div class="reveal-row" id="reveal-row">[\s\S]*?<div class="verdict" id="verdict"/,
    "Le bouton et le verdict doivent partager une zone réservée de hauteur stable.");
  assert.match(html, /M78 88 C 96 82, 98 60, 88 52/, "La projection doit reprendre le chat du PDF.");
  assert.doesNotMatch(html, /M26 32 19 8l23 13/, "L’ancienne silhouette de face ne doit plus être utilisée.");
  assert.match(
    html,
    /button:focus-visible, a:focus-visible\s*\{[^}]*outline:3px solid white;[^}]*box-shadow:0 0 0 6px var\(--navy\)/s,
    "Le focus doit garder un double contour visible sur fonds clairs et foncés."
  );
  assert.doesNotMatch(html, /Compétences|Sac à maths|chronomètre|score|draggable/i);
  assert.doesNotMatch(html, /Tous ses indices correspondent au placement/i);
  assert.match(html, /function constraintFeedback\(item, player, grid\)/,
    "La correction doit expliciter chaque direction de la carte.");
  assert.match(html, /function cardIsTrue\(item, player, grid\)[\s\S]*?constraintChecks\(item, player, grid\)\.every/,
    "Chaque proposition doit être évaluée à partir de sa grille réelle.");
  assert.match(html, /const result = revealed \? cardIsTrue\(item, player, displayGrid\) : null/,
    "Les cartes ne doivent devenir vraies ou fausses qu'après leur vérification.");
  assert.match(html, /state\.mode = 'attempt';[\s\S]*?state\.revealed = 0;/,
    "Un déplacement ou un échange doit remettre les quatre cartes en attente.");
  assert.match(html, /state\.mode === 'editing' \|\| state\.mode === 'attempt'[\s\S]*?state\.grid/,
    "L'édition d'une seconde action doit repartir de la grille déjà modifiée.");
  assert.match(html, /const workingGrid = activeGrid\(\)[\s\S]*?applyPlacementAction\(workingGrid, sourceCell, cell\)/,
    "La deuxième action ne doit jamais repartir silencieusement du placement proposé.");
  assert.match(html, /state\.actionHistory\.push\(\{[\s\S]*?type: action\.targetPlayer \? 'exchange' : 'move'/,
    "Chaque déplacement ou échange doit être conservé dans l'historique de la correction.");
  assert.match(html, /key === 'c'[\s\S]*?if \(state\.mode === 'editing'\) return;/,
    "Le raccourci C ne doit jamais effacer une correction pendant sa construction.");
  assert.match(html, /<button class="zone[\s\S]*?data-cell="\$\{cell\}"[\s\S]*?aria-pressed="\$\{selected \? 'true' : 'false'\}"/,
    "Les six zones manipulables doivent être de vrais boutons accessibles.");
  assert.match(html, /\$\('#placement-grid'\)\.addEventListener\('click', handlePlacementClick\)/,
    "Un seul gestionnaire doit traiter la sélection, le déplacement ou l'échange.");
  assert.match(html, /type: action\.targetPlayer \? 'exchange' : 'move'/,
    "Une destination occupée doit échanger les deux chats.");
  assert.match(html, /Proposer une correction/,
    "Le verdict faux doit inviter la classe à construire sa correction.");
  assert.match(html, /Cette correction ne suffit pas[\s\S]*?Réessayer[\s\S]*?Voir la solution/,
    "Une tentative fausse doit pouvoir être recommencée ou remplacée par la solution préparée.");
  assert.match(html, /Cette première modification ne suffit pas[\s\S]*?id="continue-correction"[^>]*>Continuer<\/button>/,
    "Le défi à deux actions doit conserver la première modification avec un verdict compact.");
  assert.match(html, /Deux modifications sont nécessaires\. Choisissez le premier chat/,
    "Le défi avancé doit annoncer clairement sa règle sans ajouter de nouvelle zone.");
  assert.match(html, /correctionActionSentence\(item\.solutionActions\)/,
    "La solution préparée doit nommer correctement un échange ou deux déplacements.");
  assert.match(html, /const remainingFalseMessage = falseCards\.length === 1[\s\S]*?cartes restent fausses/,
    "Le verdict d’une tentative doit rester naturel au singulier comme au pluriel.");
  assert.match(html, /const cardWord = falseCards\.length === 1[\s\S]*?Non : \$\{falseCards\.length\} \$\{cardWord\}/,
    "Le verdict du placement proposé doit conserver son accord au singulier et au pluriel.");
  assert.doesNotMatch(html, /cartes sont fausses encore/,
    "Le verdict ne doit pas conserver la formulation maladroite repérée en production.");
  assert.match(html, /Quel chat faut-il déplacer ou échanger\\u00a0\?/,
    "Le point d’interrogation de la grande question ne doit pas rester seul sur une ligne.");
  assert.match(html, /\.zone\.selected \{[^}]*border-color:var\(--orange-art\)/s,
    "Le chat sélectionné doit être signalé autrement que par le texte seul.");
  assert.match(html, /\.zone\.target \{[^}]*outline:4px dashed/s,
    "Les destinations doivent rester repérables au vidéoprojecteur.");
  assert.match(html, /Une autre correction existe : la classe peut la chercher/,
    "Les défis qui admettent plusieurs corrections doivent le signaler.");
  assert.match(html, /Deux autres corrections existent : la classe peut les chercher/,
    "Le message doit aussi accorder plusieurs corrections alternatives.");
  assert.match(html, /\.card-self-cat, \.cat-mark svg \{[^}]*width:66%; height:auto/s,
    "Le chat central et les chats voisins doivent utiliser exactement la même échelle SVG.");
  assert.match(html, /\.cat-mark \{[^}]*width:100%; height:100%; display:grid; place-items:center/s,
    "Le conteneur d’un chat voisin doit occuper sa case sans agrandir sa silhouette.");
  assert.doesNotMatch(html, /\.guided-cards \.card-self-cat, \.guided-cards \.cat-mark \{/,
    "L’exemple guidé doit hériter exactement de la même réduction que les défis.");
  assert.match(html, /\.card-cell\.self::before \{[^}]*inset:-8%/s,
    "Le cadre central doit rester agrandi autour du chat.");
  assert.doesNotMatch(html, /<(?:script|img)[^>]+src="https?:/i, "Aucune dépendance externe ne doit être chargée.");
});

test("les couleurs principales gardent un contraste lisible sur fond blanc", () => {
  const variables = Object.fromEntries(
    [...html.matchAll(/--(teal|orange|muted):\s*(#[0-9a-f]{6})/gi)]
      .map(([, name, value]) => [name, value])
  );
  assert.equal(Object.keys(variables).length, 3);
  for (const [name, value] of Object.entries(variables)) {
    assert.ok(
      contrastRatio(value, "#ffffff") >= 4.5,
      `${name} ${value} doit atteindre 4,5:1 sur blanc.`
    );
  }
});

test("le générateur confirme que la page publique est à jour", () => {
  const result = spawnSync("python3", ["-B", generatorUrl.pathname, "--check"], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /12 défis inédits, 6 vrais \/ 6 faux/);
});
