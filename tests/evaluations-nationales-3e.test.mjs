// Outil de positionnement 3e « Automatismes » (bibliothèque d'outils de positionnement Eduscol) :
// le test officiel reprend exactement les 32 questions et leurs réponses ; sur 2 000 graines, chaque jumeau a 4 réponses
// distinctes, une seule juste, RECALCULÉE ici depuis l'énoncé ou la figure ; chaque question a plusieurs formes ;
// la vue prof n'a aucun mot genré ; la page charge le sujet et l'affiche comme « Outil de positionnement ».
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/3e_automatismes.js");
const S3 = globalThis.EN_SUJETS["3e-automatismes"];
const { hasard } = globalThis.EN;

const texte = (h) => h
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<table[\s\S]*?<\/table>/g, "[tableau]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<sup>([^<]*)<\/sup>/g, "^$1")
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const juste = (g) => texte(g.choix.find((x) => x.juste).html);

// Calcule une expression écrite comme à l'écran : « 6/4 + 5/8 », « (−3)² », « 10^−2 », « 2,5x × 2x » (avec L = valeur)…
function calc(e, lettres = {}) {
  let s = e.replace(/−/g, "-").replace(/×/g, "*").replace(/:/g, "/").replace(/(\d)\s(?=\d{3}(?!\d))/g, "$1").replace(/(\d),(\d)/g, "$1.$2");
  s = s.replace(/(\d+(?:\.\d+)?)\/(\d+)/g, "($1/$2)");
  for (const [L, v] of Object.entries(lettres)) s = s.replace(new RegExp(`(\\d|\\))?${L}`, "g"), (m, avant) => (avant ? `${avant}*(${v})` : `(${v})`));
  s = s.replace(/(\d|\))\(/g, "$1*(").replace(/\)(\d)/g, ")*$1");
  s = s.replace(/(\([^()]*\)|\d+(?:\.\d+)?)²/g, "($1**2)").replace(/(\d+)\^(-?\d+)/g, "($1**$2)");
  return Function(`"use strict";return (${s})`)();
}
const num = (t) => calc(t.replace(/ (cm²|m²|cm|personnes|élèves|°)$/, "").replace(/°$/, ""));
const proche = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
const equivalent = (a, b, L) => [1.7, -2.3, 3.1].every((v) => proche(calc(a, { [L]: v }), calc(b, { [L]: v })));
const premier = (n) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d);

// Réponses du test officiel (corrigé Eduscol), la bonne marquée d'une étoile.
const OFFICIEL = {
  1: ["*9/10", "6/15", "3/10", "90/10"], 2: ["5", "8", "*16", "17"], 3: ["4 + 4 + 4 + 4 + 4", "*4 × 4 × 4 × 4 × 4", "5 + 5 + 5 + 5", "45"],
  4: ["35", "15", "*25", "45"], 5: ["40 personnes", "5 personnes", "20 personnes", "*80 personnes"], 6: ["2", "−12", "12", "*−2"],
  7: ["7 cm", "12 cm", "*14 cm", "24 cm"], 8: ["x × 2 − 3", "(3 − x) × 2", "x − 3 × 2", "*(x − 3) × 2"], 9: ["*55°", "145°", "90°", "125°"],
  10: ["10", "*15", "16", "27"], 11: ["*−5", "−1", "1", "5"], 12: ["60", "100 000", "*1 000 000", "6 000 000"],
  13: ["r × r = 6", "*r − 3 = 0", "7 × r = 18", "r + 3 = 0"], 14: ["AC = AB + BC", "*AC^2 = AB^2 + BC^2", "AB^2 = AC^2 + BC^2", "BC^2 = BA^2 + AC^2"],
  15: ["100 cm²", "300 cm²", "*600 cm²", "1 200 cm²"], 16: ["*5n² + 4n + 5", "28n", "14n²", "9n² + 5"], 17: ["5", "7,2", "16", "*20"],
  18: ["n²", "*−n", "0", "−1"], 19: ["−10^2", "−20", "*0,01", "0,02"], 20: ["Figure 1", "Figure 2", "*Figure 3", "Figure 4"],
  21: ["rectangle.", "*équilatéral.", "isocèle mais pas équilatéral.", "ni rectangle, ni isocèle, ni équilatéral."],
  22: ["11/12", "*17/8", "48/20", "11/8"], 23: ["*2x + 10", "x + 10", "2x + 5", "x + 7"], 24: ["3/5", "*11/5", "3/7", "3/6"],
  25: ["4,5x", "4,5x²", "5x", "*5x²"], 26: ["1/5", "2/5", "2/6", "*5/6"], 27: ["*9", "6", "−9", "−6"], 28: ["8/9", "4/6", "*4/3", "4/9"],
  29: ["Non car il est divisible par 7.", "*Non car il est divisible par 3.", "Oui car il n’admet que deux diviseurs : 1 et 57.", "Oui car il est impair."],
  30: ["10^3", "10^4", "*10^5", "10^6"], 31: ["6x²", "6x + 2", "3x² + 2x", "*3x² + 6x"], 32: ["21x", "9x", "7 × x + 7 × 2", "*7(x + 2)"],
};

// Figure Q20 : polygones (F d'abord, puis les quatre figures numérotées) et centre O, en carreaux.
function figuresQ20(svgTxt) {
  const pts = (s) => s.split(" ").map((p) => p.split(",").map(Number));
  const polys = [...svgTxt.matchAll(/<polygon points="([^"]+)"[^>]*\/><text[^>]*>(Figure (?:F|\d))<\/text>/g)].map((m) => ({ nom: m[2], pts: pts(m[1]) }));
  const croix = [...svgTxt.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="#1d2733" stroke-width="2"\/>/g)][0];
  const O = [(Number(croix[1]) + Number(croix[3])) / 2, (Number(croix[2]) + Number(croix[4])) / 2];
  return { polys, O };
}
const memePolygone = (A, B) => A.length === B.length && A.every((p) => B.some((q) => Math.abs(p[0] - q[0]) < 0.6 && Math.abs(p[1] - q[1]) < 0.6));

function attendu(n, g, choix) {
  const e = texte(g.enonce + (g.apres ? " " + g.apres : ""));
  let m;
  switch (n) {
    case 1: case 22: case 24: case 26: case 28: m = e.match(/^(?:Le produit de |La somme de )?(.+?)(?: = …| est égale? à…)$/); return calc(m[1].replace(/ par /, " × ").replace(/ et de /, " + "));
    case 2: { const notes = e.match(/trimestre : ([\d – ]+) Quelle/)[1].split(" – ").map(Number); return notes.reduce((a, b) => a + b, 0) / notes.length; }
    case 3: m = e.match(/^(\d)\^(\d) est une autre écriture de :$/); if (m) return Array(Number(m[2])).fill(m[1]).join(" × "); m = e.match(/^((?:\d × )+\d) s’écrit aussi…$/); return `${m[1][0]}^${m[1].split(" × ").length}`;
    case 4: { m = e.match(/(\d+)/); const N = Number(m[1]); const j = choix.filter((x) => N % num(x) === 0); assert.equal(j.length, 1, e + " " + choix); return num(j[0]); }
    case 5: m = e.match(/de (\d+) (?:personnes|élèves), (\d+) %/); return (m[1] * m[2]) / 100;
    case 6: case 11: case 27: return calc(e.replace(/ = …$/, ""));
    case 7: m = g.figure.match(/Rectangle codé de longueur (\d) et de largeur (\d)/) || g.figure.match(/Carré codé de côté (\d)()/); return 2 * (Number(m[1]) + Number(m[2] || m[1]));
    case 8: { const L = e.match(/désigne par (\w) le nombre/)[1], k = e.match(/Lui (soustraire|ajouter) (\d)/), mm = e.match(/Multiplier le résultat par (\d)/)[1]; return `(${L} ${k[1] === "soustraire" ? "−" : "+"} ${k[2]}) × ${mm}`; }
    case 9: return 90 - Number(g.figure.match(/angle de sommet \w : (\d+)°/)[1]);
    case 10: { const ex = e.match(/A = (.+?)\. Pour/)[1], [, L, v] = e.match(/Pour (\w) = (\d)/); return calc(ex, { [L]: Number(v) }); }
    case 12: m = e.match(/^10\^(\d) = …$/); if (m) return 10 ** Number(m[1]); return calc(e.replace(/ = …$/, ""));
    case 13: { const [, L, v] = e.match(/Pour (\w) = (−?\d)/); const vraies = choix.filter((x) => { const [a, b] = x.split(" = "); return proche(calc(a, { [L]: calc(v) }), calc(b)); }); assert.equal(vraies.length, 1, e + " → " + choix.join(" | ")); return vraies[0]; }
    case 14: { const [, noms, S] = g.figure.match(/Triangle (\w{3}) rectangle en (\w)/); const [P, Q] = noms.split("").filter((x) => x !== S); return `${P}${Q}^2 = ${P}${S}^2 + ${S}${Q}^2`; }
    case 15: m = e.match(/longueur (\d+) (\w+) et de largeur (\d+)/) || e.match(/côté (\d+) (\w+)()/); return Number(m[1]) * Number(m[3] || m[1]);
    case 16: case 18: case 23: case 25: case 31: case 32: {
      const ex = n === 23 ? e.match(/développement de (.+) \?$/)[1] : n === 25 ? e.replace(/^Le produit de (.+) par (.+) est égal à :$/, "$1 × $2").replace(/ = …$/, "") : e.match(/(?:l’expression|réduite de|la somme) (.+?) \?$/)[1];
      const L = (ex.match(/[a-z]/) || ["x"])[0];
      const eq = choix.filter((x) => equivalent(x, ex, L));
      const forme = n === 32 ? eq.filter((x) => /^\d\(\w \+ \d\)$/.test(x)) : eq;
      assert.equal(forme.length, 1, `${e} → ${choix.join(" | ")}`);
      if (n === 32) assert.equal(eq.length, 2, "seul le piège « 7 × x + 7 × 2 » est égal sans être factorisé");
      return forme[0];
    }
    case 17: {
      const v = [...g.figure.matchAll(/<td>(\d*)<\/td>/g)].map((x) => x[1]); const k = v.indexOf(""); assert.equal(v.filter((x) => x === "").length, 1);
      const [hg, hd, bg, bd] = v.map(Number);
      return [hd * bg / bd, hg * bd / bg, hg * bd / hd, hd * bg / hg][k];
    }
    case 19: return calc(e.replace(/ = …$/, ""));
    case 20: {
      const { polys, O } = figuresQ20(g.figure); assert.equal(polys.length, 5); assert.equal(polys[0].nom, "Figure F");
      const image = polys[0].pts.map(([x, y]) => [2 * O[0] - x, 2 * O[1] - y]);
      const bons = polys.slice(1).filter((p) => memePolygone(p.pts, image)); assert.equal(bons.length, 1); return bons[0].nom;
    }
    case 21: { const [, a, b] = g.figure.match(/deux angles mesurent (\d+)° et (\d+)°/).map(Number); const c = 180 - a - b; const A = [a, b, c];
      if (A.includes(90)) return "rectangle."; if (A.every((x) => x === 60)) return "équilatéral."; if (new Set(A).size < 3) return "isocèle mais pas équilatéral."; return "ni rectangle, ni isocèle, ni équilatéral."; }
    case 29: { const N = Number(e.match(/^(\d+)/)[1]); if (premier(N)) return `Oui car il n’admet que deux diviseurs : 1 et ${N}.`; const p = [2, 3, 5, 7, 11, 13].find((d) => N % d === 0); const j = choix.find((x) => new RegExp(`divisible par ${p}\\.`).test(x)); assert.ok(j); return j; }
    case 30: { const N = num(e.match(/nombre ([\d ]+) est/)[1]); return 10 ** Math.floor(Math.log10(N)); }
  }
  throw new Error("question inconnue " + n);
}
const valeur = (n, x) => { try { return [3, 8, 13, 14, 16, 18, 20, 21, 23, 25, 29, 31, 32].includes(n) ? NaN : num(x); } catch { return NaN; } };

test("3e : 32 questions (4 domaines), repères de la notice Eduscol 9 / 17", () => {
  assert.equal(S3.questions.length, 32);
  assert.deepEqual(S3.questions.map((q) => q.num), Array.from({ length: 32 }, (_, i) => i + 1));
  assert.deepEqual(S3.seuils.map((s) => s.max), [9, 17, 32]);
  assert.equal(S3.famille, "Outil de positionnement");
  for (const q of S3.questions) assert.ok(S3.domaines[q.domaine] && q.entrainement.url.startsWith("/automatismes/?notions="), `q${q.num}`);
});

test("3e : le test officiel reprend exactement les questions et les quatre réponses de l’outil Eduscol", () => {
  for (const q of S3.questions) {
    const g = q.generer(hasard(1), true), att = OFFICIEL[q.num];
    assert.equal(juste(g), att.find((x) => x.startsWith("*")).slice(1), `bonne réponse q${q.num}`);
    assert.deepEqual(new Set(g.choix.map((x) => texte(x.html))), new Set(att.map((x) => x.replace(/^\*/, ""))), `choix q${q.num}`);
  }
});

test("3e : 2 000 sujets jumeaux — 4 réponses distinctes, une seule juste, bonne réponse recalculée, pièges vraiment faux", () => {
  for (let graine = 1; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S3.questions) {
      const g = q.generer(r, graine === 1), choix = g.choix.map((x) => texte(x.html)), j = texte(g.choix.find((x) => x.juste).html);
      const ou = `q${q.num} graine ${graine} (${g.forme}) : ${texte(g.enonce)} → ${choix.join(" | ")}`;
      assert.equal(choix.length, 4, ou);
      assert.equal(new Set(choix).size, 4, ou);
      assert.equal(g.choix.filter((x) => x.juste).length, 1, ou);
      assert.ok(typeof g.forme === "string" && g.forme, ou);
      assert.ok(!/NaN|undefined|Infinity|null/.test(choix.join() + g.enonce + (g.figure || "") + (g.apres || "")), ou);
      for (const x of g.choix) if (!x.juste) assert.ok(x.erreur && !/undefined|NaN/.test(x.erreur), `${ou} : piège sans explication`);
      let a; try { a = attendu(q.num, g, choix); } catch (err) { throw new Error(`${ou} : ${err.message}`); }
      if (typeof a === "number") {
        let vj; try { vj = num(j); } catch (err) { throw new Error(`${ou} : ${err.message}`); }
        assert.ok(proche(vj, a), `${ou} : attendu ${a}`);
        for (const x of choix) if (x !== j && !Number.isNaN(valeur(q.num, x))) assert.ok(!proche(valeur(q.num, x), a), `${ou} : piège juste ${x}`);
      } else assert.equal(j, a, ou);
    }
  }
});

test("3e : chaque question produit plusieurs formes (pas seulement d'autres nombres)", () => {
  const formes = new Map();
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S3.questions) {
      if (!formes.has(q.num)) formes.set(q.num, new Map());
      const f = q.generer(r, false).forme;
      formes.get(q.num).set(f, (formes.get(q.num).get(f) || 0) + 1);
    }
  }
  for (const [n, f] of formes) {
    assert.ok(f.size >= 2, `q${n} : une seule forme (${[...f.keys()]})`);
    assert.ok(Math.min(...f.values()) >= 2000 / f.size / 25, `q${n} : ${JSON.stringify(Object.fromEntries(f))}`);
  }
});

test("3e : la vue prof n'a aucun mot genré, et une figure ne donne jamais la réponse dans sa description", () => {
  for (let graine = 1; graine <= 400; graine++) {
    const r = hasard(graine);
    for (const q of S3.questions) {
      const g = q.generer(r, graine === 1);
      for (const x of g.choix) if (!x.juste) assert.ok(!/(^|[\s’'(])(il|elle|ils|elles|lui)(?=[\s,.])/i.test(x.erreur), `q${q.num} : ${x.erreur}`);
      if (g.figure) assert.ok(!/la symétrique|est la figure|réponse/i.test(g.figure.match(/aria-label="([^"]*)"/)?.[1] || ""), `q${q.num}`);
    }
  }
});

test("la page charge le sujet 3e et l'accueil dit « Outil de positionnement · 3e »", () => {
  const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  assert.match(html, /<script src="\.\/sujets\/3e_automatismes\.js\?v=\d{8}-\d+"><\/script>/);
  assert.match(js, /\$\("#niveau"\)\.textContent = `\$\{sujet\.famille \|\| "Évaluation nationale"\} · \$\{sujet\.niveau\}`;/);
});
