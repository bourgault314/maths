// Lot EN4 — revue de variété des sujets jumeaux de 4e (« dans la compétence ») :
// sur 2 000 graines, chaque question donne 4 réponses distinctes, une seule juste, la bonne réponse est RECALCULÉE ici
// depuis l'énoncé ou la figure (pas relue dans le générateur), les pièges sont vraiment faux ; et chaque question
// (chaque tâche, 2024-2025 compris) produit plusieurs formes différentes, pas seulement d'autres nombres.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/4e_automatismes.js");
const S4 = globalThis.EN_SUJETS["4e-automatismes"];
const { hasard, taches } = globalThis.EN;

const texte = (h) => h
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const num = (s) => Number(String(s).replace(/[\s ]|cm³|km|min|°/g, "").replace(/−/g, "-").replace(",", "."));
// Valeur d'une réponse : nombre, fraction « a/b », ou NaN (texte).
const val = (t) => { const f = t.match(/^(−?[\d\s]+)\/([\d\s]+)$/); return f ? num(f[1]) / num(f[2]) : num(t); };
// Calcule une expression de l'énoncé : « 7 − (−5) », « 14 + 6/10 + 2/1000 », « 12 × 7 + 3 × 12 »…
const calc = (e) => Function(`"use strict";return (${e.replace(/−/g, "-").replace(/×/g, "*").replace(/:/g, "/").replace(/(\d) (\d{3})/g, "$1$2")})`)();
const proche = (a, b) => Math.abs(a - b) < 1e-9;
const RANGS = { millièmes: -3, centièmes: -2, dixièmes: -1, unités: 0, dizaines: 1, centaines: 2, milliers: 3 };
const PREFIXES = { k: 3, h: 2, da: 1, "": 0, d: -1, c: -2, m: -3 };
const puissance = (u) => PREFIXES[u.slice(0, -1)];
const BLEU = /fill="#5a64c8"/g;

// Recalcule la bonne réponse attendue (texte ou valeur) d'après ce que voit l'élève.
function attendu(t, g) {
  const e = texte(g.enonce), n = t.num, id = t.id;
  let m;
  if (id === "4e-soustraire") { m = e.match(/^(\d+) − (\d) = …$/); if (m) return m[1] - m[2]; m = e.match(/^(\d) \+ … = (\d+)$/); return m[2] - m[1]; }
  if (id === "4e-reduire-somme") { m = e.match(/l’expression (\d)(\w) ([+−]) (\d)(\w) alors/); assert.equal(m[2], m[5]); return `${m[3] === "+" ? +m[1] + +m[4] : m[1] - m[4]}${m[2]}`; }
  switch (n) {
    case 1: m = e.match(/par (0,0*1)/); return /plus petit|diviser/.test(texte(g.choix.find((x) => x.juste).html)) ? 1 / num(m[1]) : NaN;
    case 2: m = e.match(/(\d+)/); return num(m[1]) / 2;
    case 3: { m = g.figure.match(/aria-label="[^"]*partagé en (\d+) parts égales, (\d+) coloriées"/); const nb = (g.figure.match(BLEU) || []).length; assert.equal(nb, Number(m[2]), "les parts coloriées dessinées"); return m[2] / m[1]; }
    case 4: case 5: case 8: case 10: case 14: return calc(e.replace(/ = …$/, ""));
    case 6: { const termes = e.replace(/ = …$/, "").split(" + "); const l = termes.find((x) => /^[a-z] × [a-z]$/.test(x))[0]; const p = termes.find((x) => /\d/.test(x) && x.includes("×")).match(/\d/)[0]; const q = termes.find((x) => /^\d+$/.test(x)); return `${l}² + ${p}${l} + ${q}`; }
    case 7: m = e.match(/(\d+) minutes/); if (m) { const M = Number(m[1]); return `${Math.floor(M / 60)} h ${M % 60} min`; } m = e.match(/(\d) h (\d+) min\. Combien/); return 60 * m[1] + Number(m[2]);
    case 9: { const a = [...g.figure.matchAll(/>(\d+)°</g)].map((x) => Number(x[1])); assert.equal(a.length, 2); return 180 - a[0] - a[1]; }
    case 11: { m = e.match(/pendant (.+?) à la vitesse moyenne de (\d+) km\/h/); const d = { "30 min": 0.5, "15 min": 0.25, "1 h 30 min": 1.5 }[m[1]]; return d * m[2]; }
    case 12: m = e.match(/([\d ]+) (\S+) = … (\S+)$/); return num(m[1]) * 10 ** (RANGS[m[2]] - RANGS[m[3]]);
    case 13: { const j = g.choix.find((x) => x.juste).html; const [, tot, col] = j.match(/en (\d+) parts égales, (\d+) coloriées/); assert.equal((j.match(/fill="#(5a64c8|9b9bd6)"/g) || []).length, Number(col)); m = e.match(/colorié (\d)\/(\d)/); assert.ok(proche(col / tot, m[1] / m[2])); return "figure"; }
    case 15: { const [, d] = g.figure.match(/<text x="([\d.]+)"[^>]*>(?:A|B|M|P)</) || []; const ticks = (g.figure.match(/<line /g) || []).length - 1; const parts = (ticks - 1) / 3; return Math.round(((Number(d) - 24) / 150) * parts) / parts; }
    case 16: m = e.match(/^(0,\d+)/); return num(m[1]);
    case 17: { m = e.match(/= (\d+) ([+−]) (\d)([a-z])\. Quelle est la valeur de \w pour ([a-z]) = (\d)/); assert.equal(m[4], m[5]); return m[2] === "+" ? +m[1] + m[3] * m[6] : m[1] - m[3] * m[6]; }
    case 18: m = e.match(/(\d+) (\S+) = … (\S+)$/); return Number(m[1]) * 10 ** (puissance(m[2]) - puissance(m[3]));
    case 19: { const v = [...g.figure.matchAll(/<td>(\d*)<\/td>/g)].map((x) => x[1]); const k = v.indexOf(""); assert.equal(v.filter((x) => x === "").length, 1); const autre = [3, 2, 1, 0][k]; const diag = [0, 1, 2, 3].filter((i) => i !== k && i !== autre); return (v[diag[0]] * v[diag[1]]) / v[autre]; }
    case 20: { m = e.match(/\((\d) ; (\d)\)/); const X = 40 + m[1] * 34 + 7, Y = 214 - m[2] * 34 - 8; const nom = g.figure.match(new RegExp(`<text x="${X}" y="${Y}" font-size="15" fill="#2747b0">([A-D])</text>`)); assert.ok(nom, "le bon point est dessiné aux coordonnées demandées"); return `le point ${nom[1]}`; }
    case 21: { const etiquettes = [...g.figure.matchAll(/>(\d+)</g)].map((x) => Number(x[1])); const tri = [[5, 9, 12, 13, 15], [9, 16, 12, 15, 20], [5, 16, 12, 13, 20], [6, 15, 8, 10, 17], [10, 18, 24, 26, 30], [8, 20, 15, 17, 25], [9, 5, 12, 15, 13], [16, 9, 12, 20, 15]].find(([a, b, h, c1, c2]) => [a + b, h, c1, c2].every((x) => etiquettes.includes(x))); assert.ok(tri); return `${tri[0] + tri[1]} × ${tri[2]}/2`; }
    case 22: m = e.match(/de (\d+)\/(\d+)/); return Math.floor(m[1] / m[2]);
  }
  throw new Error("question inconnue " + n);
}

test("4e : 2 000 sujets jumeaux — 4 réponses distinctes, une seule juste, bonne réponse recalculée, pièges vraiment faux", () => {
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S4.questions) for (const t of taches(q)) {
      const g = t.generer(r, false), choix = g.choix.map((x) => texte(x.html)), j = texte(g.choix.find((x) => x.juste).html);
      const ou = `q${q.num}${t.id ? " " + t.id : ""} graine ${graine} (${g.forme}) : ${choix.join(" | ")}`;
      assert.equal(new Set(choix).size, 4, ou);
      assert.equal(g.choix.filter((x) => x.juste).length, 1, ou);
      assert.ok(typeof g.forme === "string" && g.forme, ou);
      assert.ok(!/NaN|undefined|Infinity|null/.test(choix.join() + g.enonce + (g.figure || "")), ou);
      for (const x of g.choix) if (!x.juste) assert.ok(x.erreur && !/undefined|NaN/.test(x.erreur), `${ou} : piège sans explication`);
      const a = attendu(t, g);
      if (typeof a === "number") {
        if (q.num === 22) { const [, b1, b2] = j.match(/^([\d ]+) < \S+ < ([\d ]+)$/); assert.equal(num(b1), a, ou); assert.equal(num(b2), a + 1, ou); }
        else if (q.num === 1 && !t.id) assert.equal(num(j.match(/\d[\d\s]*\d|\d/)[0]), a, ou);
        else { assert.ok(proche(val(j), a), `${ou} : attendu ${a}`); for (const x of choix) if (x !== j && !Number.isNaN(val(x))) assert.ok(!proche(val(x), a), `${ou} : piège juste ${x}`); }
      } else if (a !== "figure") assert.equal(j, a, ou);
    }
  }
});

test("4e : chaque question produit plusieurs formes (pas seulement d'autres nombres)", () => {
  const formes = new Map();
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S4.questions) for (const t of taches(q)) {
      const cle = `q${q.num}${t.id ? " " + t.id : ""}`;
      if (!formes.has(cle)) formes.set(cle, new Map());
      const f = t.generer(r, false).forme;
      formes.get(cle).set(f, (formes.get(cle).get(f) || 0) + 1);
    }
  }
  assert.equal(formes.size, 24, "22 questions + les 2 tâches 2024-2025");
  for (const [cle, f] of formes) {
    assert.ok(f.size >= 2, `${cle} : une seule forme (${[...f.keys()]})`);
    // aucune forme n'écrase les autres : la moins fréquente sort au moins une fois sur vingt-cinq sujets
    assert.ok(Math.min(...f.values()) >= 2000 / f.size / 25, `${cle} : ${JSON.stringify(Object.fromEntries(f))}`);
  }
});

test("4e : le triangle de la question 9 a vraiment l'angle cherché au milieu de son nom", () => {
  // Les deux angles marqués sont ceux des deux autres sommets : on retrouve les pièges « angle de sommet … ».
  for (let graine = 2; graine <= 500; graine++) {
    const g = S4.questions[8].generer(hasard(graine), false);
    const nom = texte(g.enonce).match(/l’angle (\w{3})/)[1];
    for (const x of g.choix.filter((c) => !c.juste && /sommet/.test(c.erreur))) assert.match(x.erreur, new RegExp(`de sommet [${nom[0]}${nom[2]}] et non à celui de sommet ${nom[1]}`));
  }
});

// Lot EN4d (14/11/2026) : en 4e Q13, la bonne figure n'est plus la seule en parts égales dans les jumeaux.
test("4e Q13 (jumeaux) : un piège « p pour q » en parts égales, d'une autre forme que la bonne figure ; l'officiel ne change pas", () => {
  const Q13 = S4.questions.find((q) => q.num === 13);
  const forme = (html) => (/<path /.test(html) ? "disque" : "rectangle");
  const vus = new Set();
  for (let graine = 2; graine <= 2001; graine++) {
    const g = Q13.generer(hasard(graine), false);
    const [, p, q] = texte(g.enonce).match(/colorié (\d)\/(\d)/).map(Number);
    const egales = g.choix.filter((x) => /parts égales/.test(x.html));
    assert.equal(egales.length, 2, `graine ${graine} : la bonne figure et le piège p pour q`);
    const piege = egales.find((x) => !x.juste), juste = egales.find((x) => x.juste);
    const [, tot, col] = piege.html.match(/en (\d+) parts égales, (\d+) coloriées/).map(Number);
    assert.equal(tot, p + q, `graine ${graine}`);
    assert.equal(col, p, `graine ${graine}`);
    assert.equal((piege.html.match(/fill="#(5a64c8|9b9bd6)"/g) || []).length, p, `graine ${graine} : parts coloriées comptées dans le dessin`);
    assert.ok(Math.abs(p / (p + q) - p / q) > 1e-9);
    assert.notEqual(forme(piege.html), forme(juste.html), `graine ${graine} : formes différentes`);
    assert.match(piege.erreur, new RegExp(`${p} parts coloriées pour ${q} parts blanches`));
    assert.ok(!/\b(il|elle)\b/.test(piege.erreur));
    vus.add(forme(piege.html));
  }
  assert.deepEqual([...vus].sort(), ["disque", "rectangle"]);
  // Sujet officiel : toujours les trois figures en parts inégales et le disque en 8 parts.
  const o = Q13.generer(hasard(1), true);
  assert.equal(o.choix.filter((x) => /parts égales/.test(x.html)).length, 1);
  assert.match(o.choix[1].html, /rectangle en 4 bandes inégales, 3 coloriées/);
});
