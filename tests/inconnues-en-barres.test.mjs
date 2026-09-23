// Inconnues en barres — contrôle automatique de TOUS les cas générés (lots 1 et 1b).
import test from "node:test";
import assert from "node:assert/strict";
import * as M from "../outils/inconnues-en-barres/moteur.mjs";

const SEEDS = 400; // par combinaison de réglages
const combos = [];
for (const context of Object.keys(M.CONTEXTS)) {
  for (const k of ["2", "3", "4", "mix"]) for (const variety of ["guided", "simple", "rich"]) combos.push({ family: "fois", k, variety, context });
  for (const variety of ["guided", "simple", "rich"]) combos.push({ family: "ecart", variety, context });
  combos.push({ family: "partielle", context });
}

function* allCases() {
  for (const settings of combos) for (let seed = 1; seed <= SEEDS; seed++) {
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
      assert.ok([p.aValue, p.total, p.known].includes(last), l.c);
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
