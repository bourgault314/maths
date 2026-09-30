/* Livrets Petit SPLAT! d'origine (« Je complète le schéma ») : nouvelles graines (30/09/2026).

   Les graines des trois livrets (Monde 1, Avancé, Expert) ont été retriées sur le livret
   entier avec les règles fixées par Gwenaël le 28/09 (1 à 8) et le 29/09 (9) — liste dans
   _sources/livret-petit-splat/render.py (CHOIX DES GRAINES). Les graines du Monde 1 sont
   aussi celles des étapes m1e1 à m1e6 de la carte des mondes : les deux changent ensemble,
   les étoiles restent (parcours=m1eN inchangé).

   Rejouer une série demande un navigateur (la place des jetons passe par le canvas) : la
   preuve complète, règle 8 comprise (une seule réponse d'après la fiche imprimée), c'est
   python3 _sources/livret-petit-splat/verifier_graines.py. Ici, sans navigateur : les
   graines aux deux endroits, et les règles recomptées sur la liste des 12 cartes de chaque
   étape du monde 1 (eqs), qui porte tout ce qu'il faut (taches, jetons posés, total). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const render = lire("_sources/livret-petit-splat/render.py");
const univers = lire("outils/splat_univers.html");

const GRAINES = {
  normal: ["201490", "203592", "211295", "347458", "305618", "458563"],
  avance: ["204001", "210929", "206748", "308189", "201637", "308504"],
  expert: ["892863", "205335", "205217", "201852", "830408", "204313"],   // fiches 1 et 5 gardées
};
const ANCIENNES = ["441132", "929356", "302672", "514457", "727304", "510115", "715819", "716087",
                   "109324", "868655", "849499", "662792", "520986", "948274", "354581"];

const dictGraines = (g) => "graines={" + g.map((x, i) => `${i + 1}:"${x}"`).join(", ") + "}";

test("render.py : les nouvelles graines des trois livrets, et plus aucune ancienne dans NIVEAUX", () => {
  for (const [niv, g] of Object.entries(GRAINES)) assert.ok(render.includes(dictGraines(g)), niv);
  const lignes = render.split("\n").filter((l) => /^\s*graines=\{/.test(l));
  assert.equal(lignes.length, 6, "trois livrets d'origine, trois livrets « Je fais le schéma »");
  for (const a of ANCIENNES) assert.ok(!lignes.some((l) => l.includes(`"${a}"`)), `ancienne graine ${a}`);
  // les anciennes restent écrites dans le commentaire : ce sont celles des livrets déjà imprimés
  assert.match(render, /Graines d'avant le 30\/09\/2026 \(celles des livrets déjà imprimés/);
  assert.match(render, /CHOIX DES GRAINES \(28-29\/09\/2026\)/);
  assert.doesNotMatch(render, /progression de Claire\. Celles des niveaux/);
});

// Les six étapes du monde 1 dans la carte des mondes : graines, parcours, liste des cartes.
function etape(n) {
  const i = univers.indexOf(`p:"m1e${n}"`);
  assert.ok(i > 0, `m1e${n} introuvable`);
  const b = univers.slice(i, univers.indexOf('"}', univers.indexOf("f:PS+", i)) + 2);
  return {
    dessin: univers.slice(univers.lastIndexOf("{t:", i), i).includes("dessin:true") || b.includes("dessin:true"),
    eqs: JSON.parse("[" + /eqs:\[([^\]]*)\]/.exec(b)[1] + "]"),
    j: /j:PS\+"([^"]*)"/.exec(b)[1],
    f: /f:PS\+"([^"]*)"/.exec(b)[1],
  };
}
const ETAPES = [1, 2, 3, 4, 5, 6].map(etape);

test("carte des mondes : les étapes m1e1 à m1e6 portent les graines du livret Monde 1, les étoiles restent", () => {
  ETAPES.forEach((e, k) => {
    const n = k + 1, jeu = new URLSearchParams(e.j), fiche = new URLSearchParams(e.f);
    assert.equal(jeu.get("seed"), GRAINES.normal[k], `m1e${n} : jeu`);
    assert.equal(fiche.get("seed"), GRAINES.normal[k], `m1e${n} : fiche`);
    assert.equal(jeu.get("parcours"), `m1e${n}`, "même identifiant d'étoile");
    assert.equal(jeu.get("target"), "20");
    assert.equal(jeu.get("support"), "eleve");
    assert.equal(fiche.get("support"), "print");
  });
  for (const a of ANCIENNES) assert.ok(!univers.includes(`seed=${a}`), `ancienne graine ${a} dans la carte des mondes`);
});

// « 3𝑥 + 2 = 11 » (✏️ : carte à dessiner, à l'étape Mélange) → une carte.
function carte(q, dessin) {
  const r = /^(\d*)𝑥(?: \+ (\d+))? = (\d+)( ✏️)?$/u.exec(q);
  assert.ok(r, `carte illisible : ${q}`);
  const n = Number(r[1] || 1), v = Number(r[2] || 0), T = Number(r[3]);
  assert.ok(Number.isInteger((T - v) / n) && T > v, q);
  return { n, v, T, h: (T - v) / n, dessine: dessin || Boolean(r[4]) };
}

test("les 12 cartes de chaque étape du monde 1 respectent les règles du 28-29/09", () => {
  const F = ETAPES.map((e) => e.eqs.map((q) => carte(q, e.dessin)));
  F.forEach((cs, k) => assert.equal(cs.length, 12, `fiche ${k + 1}`));
  // les étapes 2 et 6 font dessiner, 1, 4 et 5 compléter, 3 mélange les deux
  assert.deepEqual(F.map((cs) => cs.filter((c) => c.dessine).length), [0, 12, 6, 0, 0, 12]);
  // 1. aucune carte identique dans le livret, pas de carte « à l'envers » sur une fiche
  const cles = F.flat().map((c) => [c.dessine, c.T, c.n, c.v].join("|"));
  assert.equal(new Set(cles).size, 72, "une carte identique");
  F.forEach((cs, k) => cs.forEach((c) => {
    const envers = cs.some((d) => d !== c && d.T === c.T && (c.n === 1
      ? d.n === 1 && d.v === c.h && d.h === c.v
      : d.v === c.v && d.n === c.h && d.h === c.n));
    assert.ok(!envers, `fiche ${k + 1} : ${c.T} à l'envers`);
  }));
  // 2. une division jamais deux fois sur une fiche (fiche 4 : deux répétitions tolérées,
  //    12 cartes pour 10 divisions possibles), au plus 2 fois dans le livret
  const livret = new Map();
  F.forEach((cs, k) => {
    const d = cs.filter((c) => c.n >= 2).map((c) => `${c.n * c.h}÷${c.n}`);
    d.forEach((x) => livret.set(x, (livret.get(x) || 0) + 1));
    assert.ok(d.length - new Set(d).size <= (k === 3 ? 2 : 0), `fiche ${k + 1} : ${d}`);
  });
  for (const [x, v] of livret) assert.ok(v <= 2, `${x} : ${v} fois dans le livret`);
  // 3. et 4. « rien à dessiner » (fiches 2, 3, 6), « tout est caché » (fiches 1, 3, 4, 5)
  for (const k of [2, 3, 6]) {
    const z = F[k - 1].filter((c) => c.dessine && c.v === 0).length;
    assert.ok(z >= 1 && z <= 2, `fiche ${k} : ${z} « rien à dessiner »`);
  }
  for (const k of [1, 3, 4, 5]) {
    const z = F[k - 1].filter((c) => !c.dessine && c.v === 0);
    assert.ok(z.length >= 1 && z.length <= 2, `fiche ${k} : ${z.length} « tout est caché »`);
    if (k >= 4) assert.ok(z.some((c) => c.n >= 2), `fiche ${k} : une « tout est caché » à plusieurs taches`);
  }
  F.forEach((cs, k) => {
    const h = cs.map((c) => c.h);
    // 5. au plus une réponse 1 par fiche, jamais de total 1
    assert.ok(h.filter((x) => x === 1).length <= 1, `fiche ${k + 1} : réponses 1`);
    assert.ok(cs.every((c) => c.T > 1), `fiche ${k + 1} : total 1`);
    // 7. au plus 15 jetons à dessiner
    assert.ok(cs.every((c) => !c.dessine || c.v <= 15), `fiche ${k + 1} : plus de 15 jetons à dessiner`);
    // 9. une même réponse au plus 3 fois, jamais sur 3 cartes de suite
    for (const x of new Set(h)) assert.ok(h.filter((y) => y === x).length <= 3, `fiche ${k + 1} : réponse ${x}`);
    for (let i = 0; i + 2 < h.length; i++) assert.ok(!(h[i] === h[i + 1] && h[i] === h[i + 2]), `fiche ${k + 1} : cartes ${i + 1} à ${i + 3}`);
  });
});

test("le contrôle complet est dans le dépôt, et le README le cite", () => {
  assert.ok(existsSync(new URL("../_sources/livret-petit-splat/verifier_graines.py", import.meta.url)));
  const v = lire("_sources/livret-petit-splat/verifier_graines.py");
  assert.match(v, /REPETITIONS_TOLEREES = \{\("normal", 4\): 2\}/);
  assert.match(v, /channel="chromium"/, "le vrai Chromium, comme render.py");
  assert.match(render, /python3 verifier_graines\.py/);
  assert.match(lire("_sources/livret-petit-splat/README.md"), /verifier_graines\.py/);
});
