// Contrôle du lot EN3 « les années passées » : sujets officiels 2024 et 2025, banque de tâches, sujets générés.
// 6e et 5e : le même sujet en 2024, 2025 et 2026 (PDF Eduscol comparés). 4e : 2024 = 2025, questions 1 et 6 différentes de 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_automatismes.js");
require("../outils/evaluations_nationales/sujets/5e_automatismes.js");
require("../outils/evaluations_nationales/sujets/4e_automatismes.js");
const { hasard, construire, taches, tacheOfficielle } = globalThis.EN;
const S = globalThis.EN_SUJETS;

const texte = (h) => h
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const juste = (g) => texte(g.choix.find((x) => x.juste).html);
const choixTries = (g) => g.choix.map((x) => texte(x.html)).sort();

test("4e : deux sujets officiels jouables, 2026 et 2024-2025, chacun avec ses repères DEPP", () => {
  const o = S["4e-automatismes"].officiels;
  assert.deepEqual(o.map((x) => x.cle), ["2026", "2024-2025"]);
  assert.equal(o[0].seuils, undefined); // 2026 : les repères du sujet (6 / 12)
  assert.deepEqual(S["4e-automatismes"].seuils.map((s) => s.max), [6, 12, 22]);
  assert.deepEqual(o[1].seuils.map((s) => s.max), [7, 12, 22]);
  assert.equal(o[1].annee, 2025);
});

test("4e 2024-2025 : questions 1 et 6 du PDF, les 20 autres identiques à 2026", () => {
  const S4 = S["4e-automatismes"];
  const v25 = construire(S4, hasard(1), S4.officiels[1], null);
  const v26 = construire(S4, hasard(1), S4.officiels[0], null);
  assert.equal(v25.length, 22);
  const q1 = v25[0].g, q6 = v25[5].g;
  assert.equal(texte(q1.enonce), "14 − 6 = …");
  assert.deepEqual(choixTries(q1), ["6", "7", "8", "9"]);
  assert.equal(juste(q1), "8");
  assert.equal(texte(q6.enonce), "Si l’on réduit l’expression 2n + 3n alors on obtient :");
  assert.deepEqual(choixTries(q6), ["5n", "5n²", "6n", "6n²"]);
  assert.equal(juste(q6), "5n");
  for (let i = 0; i < 22; i++) {
    if (i === 0 || i === 5) { assert.notEqual(texte(v25[i].g.enonce), texte(v26[i].g.enonce)); continue; }
    assert.equal(texte(v25[i].g.enonce), texte(v26[i].g.enonce), `énoncé q${i + 1}`);
    assert.deepEqual(choixTries(v25[i].g), choixTries(v26[i].g), `choix q${i + 1}`);
    assert.equal(juste(v25[i].g), juste(v26[i].g), `bonne réponse q${i + 1}`);
  }
  // La tâche 2026 reste la tâche principale : les tests du lot EN2 (q.generer) continuent de valoir pour 2026.
  assert.equal(tacheOfficielle(S4.questions[0], 2026), S4.questions[0]);
  assert.equal(tacheOfficielle(S4.questions[0], 2024).id, "4e-soustraire");
  assert.equal(tacheOfficielle(S4.questions[5], 2025).id, "4e-reduire-somme");
});

test("6e et 5e : un seul sujet officiel (le même en 2024, 2025 et 2026), sans variante, rien ne bouge", () => {
  for (const id of ["6e-automatismes", "5e-automatismes"]) {
    const s = S[id];
    assert.equal(s.officiels.length, 1);
    assert.match(s.officiels[0].detail, /Le même sujet est tombé en 2024, 2025 et 2026\./);
    assert.ok(s.questions.every((q) => taches(q).length === 1), `${id} : pas de variante`);
    // Mêmes sujets qu'avant le lot : officiel et jumeaux (la banque ne tire au hasard que s'il y a le choix).
    for (let graine = 1; graine <= 300; graine++) {
      const avant = hasard(graine), apres = construire(s, hasard(graine), graine === 1 ? s.officiels[0] : null, null);
      s.questions.forEach((q, i) => {
        const g = q.generer(avant, graine === 1);
        const m = g.melange ?? q.melange ?? true;
        const ordre = m ? avant.melanger(g.choix) : g.choix.slice();
        assert.deepEqual(apres[i].choix.map((x) => x.html), ordre.map((x) => x.html), `${id} graine ${graine} q${q.num}`);
      });
    }
  }
});

test("4e : 2 000 sujets générés — chaque case tire une tâche connue ; 4 choix distincts, une seule bonne réponse juste", () => {
  const S4 = S["4e-automatismes"];
  const vus = { 1: new Set(), 6: new Set() };
  for (let graine = 2; graine <= 2001; graine++) {
    const items = construire(S4, hasard(graine), null, null);
    assert.equal(items.length, 22);
    items.forEach((it, i) => {
      assert.equal(it.q.num, i + 1, "même ordre que le sujet");
      const g = it.g, t = g.choix.map((x) => texte(x.html));
      assert.equal(new Set(t).size, 4, `q${it.q.num} graine ${graine} : ${t.join(" | ")}`);
      assert.equal(g.choix.filter((x) => x.juste).length, 1);
      for (const x of g.choix) if (!x.juste) assert.ok(x.erreur && !/undefined|NaN/.test(x.erreur), `q${it.q.num} : piège sans explication`);
      assert.ok(!/NaN|undefined|Infinity|null/.test(t.join() + g.enonce + (g.figure || "")), `q${it.q.num} graine ${graine}`);
      assert.ok((it.t.entrainement || it.q.entrainement).url.startsWith("/automatismes/?notions="));
      if (it.q.num === 1 || it.q.num === 6) vus[it.q.num].add(it.t.id || "2026");
      const e = texte(g.enonce), j = juste(g);
      let m;
      if (it.t.id === "4e-soustraire") {
        // Lot EN4 : la différence, ou le même calcul posé en complément (b + … = a).
        m = e.match(/^(\d+) − (\d) = …$/) || e.match(/^(\d) \+ … = (\d+)$/);
        const [a, b] = /^(\d+) − (\d)/.test(e) ? e.match(/^(\d+) − (\d)/).slice(1).map(Number) : [Number(e.match(/= (\d+)$/)[1]), Number(e.match(/^(\d)/)[1])];
        assert.ok(m, e);
        assert.equal(Number(j), a - b);
        assert.ok(b > a - 10, "on passe la dizaine");
        assert.notEqual(e, "14 − 6 = …", "un sujet généré ne redonne pas le calcul officiel");
      }
      if (it.t.id === "4e-reduire-somme") {
        // Lot EN4 : une somme ou une différence de deux termes en n.
        m = e.match(/l’expression (\d)(\w) ([+−]) (\d)(\w) alors/); assert.ok(m, e);
        assert.equal(m[2], m[5]);
        assert.equal(j, `${m[3] === "+" ? Number(m[1]) + Number(m[4]) : m[1] - m[4]}${m[2]}`);
        assert.ok(!(m[1] === "2" && m[4] === "3" && m[3] === "+"), "un sujet généré ne redonne pas 2n + 3n");
      }
    });
  }
  assert.deepEqual([...vus[1]].sort(), ["2026", "4e-soustraire"]);
  assert.deepEqual([...vus[6]].sort(), ["2026", "4e-reduire-somme"]);
});

test("la page : une carte par sujet officiel, repères du sujet joué, mention sur le bilan d'un sujet généré", () => {
  const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  assert.match(html, /<div id="officiels" class="cartes"><\/div>/);
  assert.ok(!html.includes("lancer-officiel") && !js.includes("lancer-officiel"));
  assert.match(html, /<p id="indication" class="seuils" hidden>Indication : les repères officiels valent pour le vrai sujet\.<\/p>/);
  assert.match(js, /\$\("#indication"\)\.hidden = passation\.reprise \|\| passation\.type === "officiel";/);
  assert.match(js, /groupe\(score, seuilsDe\(passation\.officiel\)\)/);
  // ?officiel= n'accepte qu'une clé de la liste ; aucun texte de l'adresse n'est écrit dans la page.
  assert.match(js, /officiels\.find\(\(o\) => o\.cle === params\.get\("officiel"\)\) \|\| officiels\[0\]/);
});
