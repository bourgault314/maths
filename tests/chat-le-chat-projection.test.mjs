import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

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

test("les douze défis sont progressifs, équilibrés et corrigibles par un seul déplacement", () => {
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
    } else {
      assertGrid(item.correction, `${item.id}, correction`);
      assert.equal(isValid(evaluate(item.cards, item.correction)), true, `${item.id} doit avoir une correction juste.`);
      const before = positions(item.proposed);
      const after = positions(item.correction);
      const moved = [1, 2, 3, 4].filter(player => before.get(player).join() !== after.get(player).join());
      assert.equal(moved.length, 1, `${item.id} doit se corriger en déplaçant un seul enfant.`);
    }
    return valid;
  });
  assert.deepEqual(verdicts, expectedPattern);
  assert.equal(verdicts.filter(Boolean).length, 6);
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

  for (const id of [
    "home-screen", "challenge-screen", "placement-grid", "cards-grid",
    "catalog-button", "home-button", "reveal-button", "fullscreen-button",
    "previous-button", "next-button"
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
  assert.match(html, /\.picker-grid \{[^}]*grid-template-columns:repeat\(6,minmax\(58px,1fr\)\)/s,
    "Les douze défis doivent tenir sur deux rangées de six.");
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
  assert.match(html, /\.card-self-cat, \.cat-mark \{[^}]*width:86%; height:96%/s,
    "Le chat central et les chats voisins doivent garder exactement la même taille.");
  assert.match(html, /\.card-cell\.self::before \{[^}]*inset:-8%/s,
    "Le cadre central doit s’agrandir autour du chat, sans réduire le pictogramme.");
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
