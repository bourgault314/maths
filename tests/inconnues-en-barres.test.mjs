// Inconnues en barres — contrôle automatique de TOUS les cas générés (lots 1, 1b, 1c et 2).
import test from "node:test";
import assert from "node:assert/strict";
import * as M from "../outils/inconnues-en-barres/moteur.mjs";

const SEEDS = 400; // par combinaison de réglages
const combos = [];
for (const context of Object.keys(M.CONTEXTS)) {
  for (const relation of ["endroit", "envers"]) {
    for (const k of ["2", "3", "4", "mix"]) for (const variety of ["guided", "simple", "rich"]) combos.push({ family: "fois", k, variety, context, relation });
    for (const variety of ["guided", "simple", "rich"]) combos.push({ family: "ecart", variety, context, relation });
  }
  combos.push({ family: "partielle", context });
}

function* allCases(seeds = SEEDS) {
  for (const settings of combos) for (let seed = 1; seed <= seeds; seed++) {
    const p = M.generate(settings, seed);
    for (const sens of p.family === "fois" && p.canInverse ? ["AtoB", "BtoA"] : ["AtoB"]) yield { settings, seed, p, sens };
  }
}

// Tous les textes d'un déroulé (consignes, étiquettes, cases, écritures, vérifications).
function textsOf(steps) {
  const out = [];
  const walk = (x) => {
    if (typeof x === "string") out.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk(steps);
  return out;
}

test("chaque cas généré est juste, entier, réaliste et sans nombre interdit", () => {
  let n = 0;
  for (const { p, sens } of allCases()) {
    assert.deepEqual(M.checkProblem(p), [], JSON.stringify(p));
    const steps = M.plan(p, { sens });
    const texts = [M.statementText(p), ...textsOf(steps), ...M.teacherLines(p, sens)];
    for (const t of texts) {
      for (const num of t.replace(/[  ]/g, "").match(/\d+/g) || []) {
        assert.ok(!M.isForbiddenNumber(Number(num)), "nombre interdit « " + num + " » dans : " + t);
      }
      assert.ok(!/undefined|NaN|null/.test(t), "texte cassé : " + t);
    }
    n++;
  }
  assert.ok(n > 10000, "au moins 10 000 cas contrôlés (" + n + ")");
});

test("les énoncés sont écrits en bon français", () => {
  for (const { p } of allCases()) {
    const s = M.statementText(p);
    assert.match(s, /^[A-ZÉ0-9]/, "majuscule en début d'énoncé : " + s);
    assert.ok(!/\b1 (?!jeton\b)[a-zé]/.test(s), "« 1 objet » au lieu de « un objet » : " + s);
    assert.ok(!/ananass|jeton bleus|jetons bleu\b|d’ un|prix d’une? [^ ]+ points/.test(s), "faute d'accord : " + s);
    if (p.unit !== "€") assert.ok(!/prix/.test(s), "« prix » pour des " + p.unit + " : " + s);
    assert.ok(!/ciseaux/.test(s), "ciseaux retirés : " + s);
    assert.ok(!/ donne /.test(s), "pas de « donne » dans une mise en équation : " + s);
  }
});

test("le modèle en parts est respecté dans tous les schémas", () => {
  for (const { p, sens } of allCases()) {
    for (const step of M.plan(p, { sens })) for (const tps of step) for (const row of tps.rows) for (const b of row) {
      if (b.type !== "schema") continue;
      const s = b.schema;
      assert.ok(s.cols <= M.MAX_PARTS + 3 * M.D_RATIO + 1e-9, "trop large : " + s.cols);
      for (const c of s.cells) {
        assert.ok(c.x >= -1e-9 && c.x + c.w <= s.cols + 1e-9, "case hors du schéma");
        if (c.kind === "B") assert.equal(c.w, 1, "un petit objet = une part");
        if (c.kind === "A" && p.family === "fois" && c.row === 1) assert.equal(c.w, p.k, "un grand objet = k parts");
        if (c.kind === "A" && p.family === "ecart") assert.ok(Math.abs(c.w - (1 + M.D_RATIO)) < 1e-9, "un grand objet = une part + un écart");
        if (c.kind === "D") assert.ok(Math.abs(c.w - M.D_RATIO) < 1e-9, "écart de largeur fixe");
      }
      // chaque rangée est pavée sans trou ni chevauchement
      for (const r of [0, 1]) {
        const cells = s.cells.filter((c) => c.row === r).sort((a, b) => a.x - b.x);
        for (let i = 1; i < cells.length; i++) assert.ok(Math.abs(cells[i].x - (cells[i - 1].x + cells[i - 1].w)) < 1e-9, "trou ou chevauchement dans " + s.label);
      }
      // la rangée du haut couvre exactement la rangée du bas
      const span = (r) => { const c = s.cells.filter((c) => c.row === r); return [Math.min(...c.map((x) => x.x)), Math.max(...c.map((x) => x.x + x.w))]; };
      const [a0, a1] = span(0), [b0, b1] = span(1);
      assert.ok(Math.abs(a0 - b0) < 1e-9 && Math.abs(a1 - b1) < 1e-9, "rangées décalées dans " + s.label);
    }
  }
});

test("sens inverse : coefficients calculés, petits objets mis en évidence, A ÷ k", () => {
  let seen = 0;
  for (const { p, sens } of allCases()) {
    if (sens !== "BtoA") continue;
    seen++;
    const steps = M.plan(p, { sens });
    const big = p.m + p.n / p.k;
    const remplacer = steps[2][1];
    const sit = remplacer.rows[0][2].schema;
    assert.ok(!sit.cells.some((c) => c.hl && c.kind === "A"), "les grands objets ne sont pas surlignés");
    assert.equal(sit.hlGroups.length, p.n / p.k, "un groupe surligné par paquet de k petits objets");
    const result = remplacer.rows[1][0];
    assert.equal(result.schema.cells.filter((c) => c.kind === "A").length, big);
    assert.deepEqual(result.pic.at(-1)[1].replace(/\D/g, ""), String(p.total));
    const partager = steps[3][2];
    const last = partager.rows[1].at(-1);
    assert.equal(last.calc, M.q(p, p.aValue) + " ÷ " + p.k + " = " + M.q(p, p.bValue));
  }
  assert.ok(seen > 1000);
});

test("la vérification finale reprend toutes les données de l’énoncé", () => {
  for (const { p, sens } of allCases()) {
    const steps = M.plan(p, { sens });
    const verif = steps[4][1];
    const checks = verif.rows.at(-1)[0];
    assert.equal(checks.type, "checks");
    assert.equal(checks.lines.length, 2);
    for (const l of checks.lines) {
      const nums = l.c.replace(/[  ]/g, "").split("=").map((side) => side.trim());
      // la dernière égalité tombe sur la donnée de l'énoncé
      const last = Number(nums.at(-1).replace(/\D/g, ""));
      assert.ok([p.aValue, p.total, p.known].includes(last) || (p.envers && last === p.bValue), l.c);
    }
  }
});

test("contexte SPLAT! : plateaux, taches et phrases d'indice cohérents", () => {
  let n = 0;
  for (const { p, sens } of allCases()) {
    if (!p.splat) continue;
    n++;
    assert.ok(p.total <= 100, "total SPLAT! au plus 100");
    assert.notEqual(p.A.tache, p.B.tache, "deux couleurs différentes");
    const card = M.splatCard(p);
    const count = (pl, o) => pl.taches.filter((t) => t === o.emoji).length;
    if (p.family === "partielle") {
      assert.equal(card.plateaux.length, 2);
      assert.equal(card.plateaux[0].total, p.known);
      assert.equal(count(card.plateaux[0], p.A), p.r);
      assert.equal(card.plateaux[1].total, p.total);
    } else {
      assert.equal(card.plateaux.length, 1);
      assert.equal(card.plateaux[0].total, p.total);
      assert.match(card.indices[0], /^Sous une tache [a-z]+, il y a /);
    }
    const sit = card.plateaux.at(-1);
    assert.equal(count(sit, p.A), p.m);
    assert.equal(count(sit, p.B), p.n);
    // aucune unité collée aux nombres des cases (comme dans SPLAT!)
    for (const step of M.plan(p, { sens })) for (const tps of step) for (const row of tps.rows) for (const b of row)
      if (b.type === "schema") for (const c of b.schema.cells) if (c.text) assert.ok(!/jeton|points|€|g$/.test(c.text), c.text);
  }
  assert.ok(n > 1000, "contexte SPLAT! contrôlé (" + n + " cas)");
});

// ---------------------------------------------------------------- lot 1c
// Les contrôles du lot 1c balaient 100 graines par réglage (le premier test en balaie 400).
const LOT1C_SEEDS = 100;
const bare = (t) => t.replace(/[  ]/g, " ");
const firstSentence = (p) => bare(M.statementText(p)).replace(/^Plateau : .*?total \d+\. /, "").split(". ")[0] + ".";

test("la question et l’aide « Que cherche-t-on ? » demandent les deux objets, dans l’ordre où on les trouve", () => {
  for (const { p, sens } of allCases(LOT1C_SEEDS)) {
    const [X, Y] = p.family === "partielle" ? [p.A, p.B] : [p.B, p.A];
    const Q = M.questionText(p);
    const aide = M.plan(p, { sens })[0].at(-1).rows[0][0].cards[0];
    assert.equal(aide.q, "Que cherche-t-on ?");
    const a = bare(aide.a);
    if (p.splat) {
      assert.equal(Q, "Combien de jetons y a-t-il sous chaque tache ?");
      assert.equal(a, "Le nombre de jetons sous une " + X.sing + " " + X.emoji + " et sous une " + Y.sing + " " + Y.emoji);
      continue;
    }
    assert.equal((Q.match(/\?/g) || []).length, 2, "deux questions : " + Q);
    assert.match(Q, / \? Et /, Q);
    const iX = Q.indexOf(" " + X.sing + " ?"), iY = Q.indexOf(" " + Y.sing + " ?");
    assert.ok(iX > 0 && iY > iX, "les deux objets, dans l’ordre : " + Q);
    assert.ok(a.indexOf(X.emoji) > 0 && a.indexOf(Y.emoji) > a.indexOf(X.emoji), "l’aide cite les deux objets, dans l’ordre : " + a);
    assert.ok(!/ (celle|celui) d’(un|une) [^ ]+ \?.*(celle|celui)/.test(Q));
    if (p.unit === "€") assert.match(Q, /^Quel est le prix d’.+ \? Et celui d’/, Q);
    if (p.unit === "g") assert.match(Q, /^Quelle est la masse d’.+ \? Et celle d’/, Q);
    if (p.unit === "points") assert.match(Q, /^Combien de points vaut .+ \? Et (un|une) [^ ]+( bleu)? \?$/, Q);
  }
});

test("les cartes de réponse suivent le même ordre que la question", () => {
  for (const { p, sens } of allCases(LOT1C_SEEDS)) {
    const [X, Y] = p.family === "partielle" ? [p.A, p.B] : [p.B, p.A];
    const lines = M.plan(p, { sens })[4][0].rows[0][0].lines;
    assert.deepEqual(lines.map((l) => l.emoji), [X.emoji, Y.emoji]);
  }
});

test("relation à l’envers : même problème, phrase retournée, vérification sur la phrase d’origine", () => {
  let n = 0;
  for (const { settings, seed, p, sens } of allCases(LOT1C_SEEDS)) {
    if (settings.relation !== "envers") { assert.ok(!p.envers); continue; }
    n++;
    assert.ok(p.envers);
    // la même graine donne les mêmes nombres à l'endroit et à l'envers
    const q = M.generate({ ...settings, relation: "endroit" }, seed);
    for (const key of ["aValue", "bValue", "total", "m", "n", "k", "d"]) assert.equal(p[key], q[key], key);
    const rel = firstSentence(p);
    const Bmot = p.splat ? "Sous une " + p.B.sing + ", il y a " : (p.B.det === "une" ? "Une " : "Un ") + p.B.sing + " ";
    assert.ok(rel.startsWith(Bmot), "la relation part du petit objet : " + rel);
    if (p.family === "fois") assert.match(rel, new RegExp(" " + p.k + " fois moins (cher |de points |de jetons )?(qu’|que sous )"), rel);
    else assert.match(rel, / de moins (qu’|que sous )/, rel);
    if (p.unit === "€" && p.family === "fois") assert.match(rel, /fois moins cher qu’/);
    if (p.unit === "points" && p.family === "fois") assert.match(rel, /fois moins de points qu’/);
    // Comprendre : la carte « Comment retourner la phrase ? » en 2e position, puis le déroulé habituel
    const steps = M.plan(p, { sens });
    const cards = steps[0].at(-1).rows[0][0].cards;
    assert.equal(steps[0].length, 5, "un temps de plus pour la carte en plus");
    assert.deepEqual(cards.map((c) => c.q), ["Que cherche-t-on ?", M.CARTE_RETOURNER, "Que sait-on déjà ?", "Quelle idée utiliser ?"]);
    const ret = bare(cards[1].a);
    assert.equal(ret, bare(M.reformulation(p)));
    const Amot = p.splat ? "Sous une " + p.A.sing + ", il y a " : (p.A.det === "une" ? "Une " : "Un ") + p.A.sing + " ";
    assert.ok(ret.startsWith(Amot), "la phrase retournée part du grand objet : " + ret);
    assert.match(ret, p.family === "fois" ? new RegExp(" " + p.k + " fois plus ") : / de plus /, ret);
    // la suite du déroulé est la même qu'à l'endroit (à part l'énoncé relu dans la vérification)
    const stepsEndroit = M.plan(q, { sens });
    assert.deepEqual(steps.slice(1, 4), stepsEndroit.slice(1, 4));
    // vérification : la phrase d'ORIGINE, avec le calcul qui lui correspond
    const check = steps[4][1].rows.at(-1)[0].lines[0];
    assert.equal(bare(check.s), rel);
    const c = bare(check.c);
    if (p.family === "fois") assert.equal(c, bare(M.q(p, p.aValue) + " ÷ " + p.k + " = " + M.q(p, p.bValue)));
    else assert.equal(c, bare(M.q(p, p.aValue) + " − " + M.q(p, p.d) + " = " + M.q(p, p.bValue)));
  }
  assert.ok(n > 2500, "cas à l’envers contrôlés (" + n + ")");
});

test("la donnée partielle n’a pas de réglage « à l’envers »", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const p = M.generate({ family: "partielle", context: "fruits", relation: "envers" }, seed);
    assert.ok(!p.envers);
  }
});

test("la vérification ne répète jamais un calcul", () => {
  for (const { p, sens } of allCases(LOT1C_SEEDS)) {
    for (const l of M.plan(p, { sens })[4][1].rows.at(-1)[0].lines) {
      const sides = bare(l.c).split(" = ").map((x) => x.trim());
      for (let i = 1; i < sides.length; i++) assert.notEqual(sides[i], sides[i - 1], "calcul répété : " + l.c);
    }
  }
});

test("toutes les valeurs restent dans leurs plages réalistes", () => {
  for (const { p } of allCases(LOT1C_SEEDS)) {
    const r = M.CONTEXTS[p.context][p.family];
    const inRange = (v, [lo, hi, st]) => v >= lo && v <= hi && (st ? (v - lo) % st === 0 : true);
    assert.ok(inRange(p.bValue, r.B_range), "B hors plage : " + p.bValue);
    if (p.family === "fois") assert.ok(inRange(p.aValue, r.A_range), "A hors plage : " + p.aValue);
    if (p.family === "partielle") assert.ok(inRange(p.aValue, r.A_range), "A hors plage : " + p.aValue);
    if (p.family === "ecart") assert.ok(inRange(p.d, r.d_range) && p.d <= p.bValue, "écart hors plage : " + p.d);
  }
  // fournitures (lot 1c) : un crayon de 2 à 4 €, un écart de 1 à 3 €, donc un cahier de 3 à 7 €
  const e = M.CONTEXTS.fournitures.ecart;
  assert.deepEqual([e.B_range, e.d_range], [[2, 4, 1], [1, 3, 1]]);
  const vus = new Set();
  for (let seed = 1; seed <= 400; seed++) for (const variety of ["guided", "simple", "rich"]) {
    const p = M.generate({ family: "ecart", variety, context: "fournitures" }, seed);
    assert.ok(p.bValue >= 2 && p.bValue <= 4 && p.aValue >= 3 && p.aValue <= 7, "crayon " + p.bValue + " €, cahier " + p.aValue + " €");
    vus.add(p.bValue);
  }
  assert.deepEqual([...vus].sort(), [2, 3, 4], "les trois prix de crayon sortent");
  const d = M.CONTEXTS.fournitures.partielle;
  assert.deepEqual([d.B_range, d.A_range], [[1, 3, 1], [6, 15, 1]], "donnée partielle : crayon de 1 à 3 €, livre de 6 à 15 €");
});

test("donnée partielle : ni plateaux au même total, ni donnée contenue telle quelle dans la situation", () => {
  for (const { p } of allCases(LOT1C_SEEDS)) {
    if (p.family !== "partielle") continue;
    assert.notEqual(p.r, p.m, "autant d’objets dans les deux données");
    assert.notEqual(p.known, p.total, "deux plateaux au même total");
  }
});

test("aucun nombre à sous-entendu, à l’endroit comme à l’envers", () => {
  for (const { p, sens } of allCases(LOT1C_SEEDS)) {
    const all = [M.statementText(p), M.questionText(p), ...textsOf(M.plan(p, { sens }))].join(" ");
    for (const num of bare(all).replace(/ (?=\d{3}\b)/g, "").match(/\d+/g) || []) assert.ok(!M.isForbiddenNumber(Number(num)), num + " dans " + M.statementText(p));
  }
});

test("accord du pronom dans l’idée de la donnée partielle (le prix… le remplacer)", () => {
  for (const context of Object.keys(M.CONTEXTS)) {
    const p = M.generate({ family: "partielle", context }, 7);
    const idee = M.plan(p)[0].at(-1).rows[0][0].cards[2].a;
    const g = M.CONTEXTS[context].grandeur;
    assert.match(idee, g === "prix" || p.splat ? /, le remplacer/ : /, la remplacer/, idee);
  }
});

// ---------------------------------------------------------------- lot 2 : séries et graines
const seriesCombos = combos.map((c) => c); // mêmes réglages que les cas ci-dessus
const GRAINES = [1, 7, 1234, 4127, 9998];

test("séries : même graine + mêmes réglages = mêmes cartes, et la carte 1 est l’ancien problème de la graine", () => {
  for (const settings of seriesCombos) for (const g of GRAINES.slice(0, 3)) {
    const a = M.generateSeries(settings, g, 8), b = M.generateSeries(settings, g, 8);
    assert.deepEqual(a.map(M.problemKey), b.map(M.problemKey));
    assert.equal(M.problemKey(a[0]), M.problemKey(M.generate(settings, g)), "carte 1 = generate(graine)");
    a.forEach((p, i) => { assert.equal(p.carte, i + 1); assert.equal(p.graine, g); });
  }
});

test("séries : aucun doublon, tout est juste, et 4 ⊂ 8 ⊂ 12", () => {
  let n = 0;
  for (const settings of seriesCombos) for (const g of GRAINES) {
    const s12 = M.generateSeries(settings, g, 12);
    const keys = s12.map(M.problemKey);
    assert.equal(new Set(keys).size, keys.length, "doublon dans " + JSON.stringify(settings) + " graine " + g);
    for (const p of s12) assert.deepEqual(M.checkProblem(p), [], JSON.stringify(p));
    assert.deepEqual(M.generateSeries(settings, g, 8).map(M.problemKey), keys.slice(0, 8), "8 = début de 12");
    assert.deepEqual(M.generateSeries(settings, g, 4).map(M.problemKey), keys.slice(0, 4), "4 = début de 8");
    n += s12.length;
  }
  assert.ok(n > 5000, n + " cartes contrôlées");
});

test("séries : 8 cartes différentes pour TOUS les réglages ; 12 sauf les réglages très étroits (liste figée)", () => {
  const courtes = new Set();
  for (const settings of seriesCombos) for (const g of GRAINES) {
    assert.equal(M.generateSeries(settings, g, 8).length, 8, "série de 8 incomplète : " + JSON.stringify(settings));
    if (M.generateSeries(settings, g, 12).length < 12) courtes.add([settings.context, settings.family, settings.k || "", settings.variety || ""].join(" "));
  }
  // « Très guidé » avec une relation fixe : un seul objet de chaque sorte, peu de problèmes possibles.
  assert.deepEqual([...courtes].sort(), [
    "fournitures ecart  guided", "fournitures fois 2 guided", "fournitures fois 3 guided", "fournitures fois 4 guided",
    "fruits fois 2 guided", "fruits fois 3 guided", "fruits fois 4 guided",
  ]);
});

test("séries : les valeurs varient (pas deux fois le même couple de valeurs quand c’est possible)", () => {
  for (const settings of seriesCombos) {
    if (settings.variety === "guided" && settings.k !== "mix") continue;
    const s = M.generateSeries(settings, 4127, 8);
    const couples = new Set(s.map((p) => p.aValue + "|" + p.bValue));
    assert.ok(couples.size >= 6, couples.size + " couples de valeurs sur 8 cartes : " + JSON.stringify(settings));
  }
});

test("séries : même graine à l’endroit et à l’envers = mêmes nombres, carte par carte", () => {
  for (const settings of seriesCombos) {
    if (settings.relation !== "envers") continue;
    const a = M.generateSeries({ ...settings, relation: "endroit" }, 4127, 8), b = M.generateSeries(settings, 4127, 8);
    assert.deepEqual(a.map(M.problemKey), b.map(M.problemKey));
    assert.ok(b.every((p) => p.envers === (p.family !== "partielle")));
  }
});

test("graine tirée au hasard : 4 chiffres, jamais un nombre à sous-entendu", () => {
  for (let k = 0; k < 2000; k++) {
    const g = M.tirerGraine();
    assert.ok(g >= 1000 && g <= 9999 && !M.isForbiddenNumber(g), String(g));
  }
  for (const x of [0, 0.4, 0.9999]) { const g = M.tirerGraine(() => x); assert.ok(g >= 1000 && g <= 9999, String(g)); }
  // 1069 serait tiré par 0.0077 : il est refusé, la graine suivante est prise
  assert.notEqual(M.tirerGraine((() => { const s = [0.0077, 0.5]; let j = 0; return () => s[j++]; })()), 1069);
});

test("fournitures : cahier de 2 à 9 €, livre jusqu’à 36 € (lot 2, pour avoir 8 cartes différentes)", () => {
  const f = M.CONTEXTS.fournitures.fois;
  assert.deepEqual([f.B_range, f.A_range], [[2, 9, 1], [4, 36]]);
});

test("adresse : chaque réglage inconnu est signalé, jamais remplacé en silence", () => {
  const a = M.lireAdresse("?contexte=pomme&famile=ecart&graine=abc&cartes=7&k=5&utm_source=x");
  assert.deepEqual(a.alertes.map((x) => x.nom).sort(), ["cartes", "contexte", "famile", "graine", "k"]);
  assert.equal(a.context, "fruits"); assert.equal(a.graine, null); assert.equal(a.cartes, 8);
  const b = M.lireAdresse("?contexte=points&famille=ecart&variete=rich&relation=envers&graine=4127&cartes=12&carte=5&etape=3&temps=2");
  assert.deepEqual(b.alertes, [], "contexte=points est un autre nom du jeu, accepté");
  assert.equal(b.context, "jetons");
  assert.deepEqual([b.family, b.variety, b.relation, b.graine, b.cartes, b.carte, b.etape, b.temps], ["ecart", "rich", "envers", 4127, 12, 5, 3, 2]);
  const c = M.lireAdresse("?carte=9&cartes=8");
  assert.equal(c.carte, 1); assert.equal(c.alertes[0].nom, "carte");
  assert.deepEqual(M.lireAdresse("?graine=123456789").alertes, [], "les anciens liens à grande graine restent valables");
});

test("adresse : le lien d’une série se relit à l’identique", () => {
  for (const settings of seriesCombos) {
    const o = { ...M.DEFAUTS, ...settings, sens: "AtoB", ecritures: "tout", cartes: 12, graine: 4127, carte: 3 };
    const r = M.lireAdresse(M.adresseSerie(o));
    assert.deepEqual(r.alertes, []);
    for (const k of ["family", "context", "ecritures", "cartes", "graine", "carte"]) assert.equal(r[k], o[k], k);
    if (settings.family === "fois") assert.equal(r.k, settings.k);
    if (settings.family !== "partielle") { assert.equal(r.variety, settings.variety); assert.equal(r.relation, settings.relation); }
  }
  assert.ok(!M.adresseSerie({ ...M.DEFAUTS, graine: 5, carte: 1 }).includes("carte="), "le lien copié démarre à la carte 1");
});

test("énoncé SPLAT! en texte : pas de double espace", () => {
  for (const family of M.FAMILIES) {
    const p = M.generate({ family, context: "splat", variety: "rich", k: "mix" }, 11);
    assert.ok(!/  /.test(M.statementText(p)), M.statementText(p));
  }
});
