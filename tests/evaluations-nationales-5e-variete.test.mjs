// Lot EN4b — revue de variété des sujets jumeaux de 5e (« dans la compétence ») :
// sur 2 000 graines, chaque question donne 4 réponses distinctes, une seule juste, la bonne réponse est RECALCULÉE ici
// depuis l'énoncé ou la figure (pas relue dans le générateur), les pièges sont vraiment faux, la vue prof n'a aucun mot
// genré ; et chaque question produit plusieurs formes différentes, pas seulement d'autres nombres.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/5e_automatismes.js");
const S5 = globalThis.EN_SUJETS["5e-automatismes"];
const { hasard, enLettres } = globalThis.EN;

const texte = (h) => h
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const num = (s) => Number(String(s).replace(/[\s ]|cm³|dm³|m³|\.$/g, "").replace(/−/g, "-").replace(",", "."));
// Valeur d'une réponse : nombre, fraction « a/b », ou NaN (texte).
const val = (t) => { const f = t.match(/^(−?[\d\s ]+)\/([\d\s ]+)$/); return f ? num(f[1]) / num(f[2]) : num(t); };
// Calcule une expression de l'énoncé ou d'une réponse : « 5 × 43 × 2 », « 780 : 1/10 », « ( 2 + 3,5 ) × 0,1 »…
const calc = (e) => Function(`"use strict";return (${e.replace(/−/g, "-").replace(/×/g, "*").replace(/:/g, "/").replace(/(\d)\s(\d{3})/g, "$1$2").replace(/(\d),(\d)/g, "$1.$2")})`)();
const proche = (a, b) => Math.abs(a - b) < 1e-9;
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const NOMBRE = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [enLettres(i), i]));
const PARTS = { tiers: 3, quarts: 4, cinquièmes: 5, sixièmes: 6, septièmes: 7, huitièmes: 8, neuvièmes: 9, dixièmes: 10 };
const RANG = { milliers: 3, centaines: 2, dizaines: 1, unités: 0, dixièmes: -1, centièmes: -2, millièmes: -3 };

// Recalcule la bonne réponse attendue (texte ou valeur) d'après ce que voit l'élève.
function attendu(n, g, choix) {
  const e = texte(g.enonce);
  let m;
  switch (n) {
    case 1: { const v = choix.map(val); const max = Math.max(...v); assert.equal(v.filter((x) => x === max).length, 1); return max; }
    case 2: m = e.match(/^(\d+) × 1 000 \+ (\d+) = …$/); if (m) return m[1] * 1000 + Number(m[2]); m = e.match(/^(\d+) \+ (\d+) × 1 000 = …$/); return m[2] * 1000 + Number(m[1]);
    case 3: m = e.match(/^Le nombre ([\d ]+) se lit :$/); if (m) return `${majuscule(enLettres(num(m[1]) / 1e6))}-millions`;
      m = e.match(/^« (.+)-millions » s’écrit en chiffres :$/); { const k = Array.from({ length: 999 }, (_, i) => i + 1).find((i) => majuscule(enLettres(i)) === m[1]); assert.ok(k, e); return k * 1e6; }
    case 4: m = e.match(/^(\d) × … = (\d+)$/) || e.match(/^… × (\d) = (\d+)$/); if (m) return m[2] / m[1]; m = e.match(/^(\d+) : (\d) = …$/); return m[1] / m[2];
    case 5: m = e.match(/(\d+) \+ … = 100|… \+ (\d+) = 100|100 − (\d+) = …/); return 100 - Number(m[1] || m[2] || m[3]);
    case 6: { m = g.figure.match(/aria-label="Figure partagée en (\d+) parts égales, (\d+) coloriées?"/); assert.equal((g.figure.match(/fill="#1f2cf0"/g) || []).length, Number(m[2]), "les parts coloriées dessinées"); return m[2] / m[1]; }
    case 7: case 8: case 10: case 11: case 16: case 19: case 23: return calc(e.replace(/ (= …|est égal à…)$/, ""));
    case 9: { const j = choix.filter((x) => num(x) % 50 === 0); assert.equal(j.length, 1); return num(j[0]); }
    case 12: case 21: case 27: return calc(e.replace(/ = …$/, ""));
    case 13: {
      const [, A, B] = g.figure.match(/aria-label="Portion de droite graduée de ([\d,]+) à ([\d,]+), flèche A"/);
      const xa = Number(g.figure.match(/<text x="(\d+)" y="24"/)[1]), k = (xa - 46) / 30;
      const d = A.split(",")[1].length + 1; return Math.round((num(A) + (k * (num(B) - num(A))) / 10) * 10 ** d) / 10 ** d;
    }
    case 14: { m = e.match(/([\d,]+) × ([\d,]+) ≈/); const p = num(m[1]) * num(m[2]); return choix.map(num).reduce((a, b) => (Math.abs(b - p) < Math.abs(a - p) ? b : a)); }
    case 15: m = e.match(/à (\d) (\S+) et (\d) (\S+)\.$/); return m[1] * 10 ** RANG[m[2]] + m[3] * 10 ** RANG[m[4]];
    case 17: { m = e.match(/(\d,\d{3})/); const E = Math.floor(num(m[1])); return /^Quel encadrement/.test(e) ? `${E} < ${m[1]} < ${E + 1}` : `Entre ${E} et ${E + 1}`; }
    case 18: {
      const nb = e.match(/nombre (\d) (\d{3}),(\d{3})/), tout = nb[1] + nb[2] + nb[3];
      const rangDe = (i) => 3 - i; // indice du chiffre → rang (3 = milliers … −3 = millièmes)
      m = e.match(/(\d) est le chiffre des…$/); if (m) { const i = tout.indexOf(m[1]); return { "-1": "dixièmes.", "-2": "centièmes.", "-3": "millièmes." }[rangDe(i)]; }
      m = e.match(/quel est le chiffre des (\S+) \?$/); return Number(tout[3 - RANG[m[1]]]);
    }
    case 20: m = e.match(/^(\d+) × 1\/(\d) permet/); return `${100 / m[2]} % de ${m[1]}.`;
    case 22: {
      m = e.match(/le nombre (\d+)\. • Je lui (ajoute|soustrais) ([\d,]+)\. • Je (multiplie|divise) le résultat par ([\d,]+)\./);
      const x = m[2] === "ajoute" ? Number(m[1]) + num(m[3]) : Number(m[1]) - num(m[3]);
      return m[4] === "multiplie" ? x * num(m[5]) : x / num(m[5]);
    }
    case 24: { const xf = Number(g.figure.match(/<path d="M([\d.]+) 80 L/)[1]); return Math.round((xf - 14) / 5.2) / 100; }
    case 25: { m = e.match(/([\d,]+) < … < ([\d,]+)/); const j = choix.filter((x) => num(m[1]) < num(x) && num(x) < num(m[2])); assert.equal(j.length, 1, e + " : " + choix.join(" | ")); return num(j[0]); }
    case 26: m = e.match(/(\d) (cm|dm|m), (?:pour largeur )?(\d) \2 et (?:pour hauteur )?(\d) \2/); return m[1] * m[3] * m[4];
    case 28: m = e.match(/^(\d+) × ([\d,]+) = …$/); return m[1] * num(m[2]);
    case 29: {
      m = e.match(/« (\S+) fois (\S+) (\S+) »/); if (m) { assert.equal(PARTS[m[3]], NOMBRE[m[1]]); return NOMBRE[m[2]]; }
      m = e.match(/« (\S+) (\S+) multipliés par (\S+) »/); assert.equal(PARTS[m[2]], NOMBRE[m[3]]); return NOMBRE[m[1]];
    }
    case 30: { const t = {}; for (const [, x, u] of e.matchAll(/(\d+) (dizaines de milliards|centaines de millions|dizaines)/g)) t[u] = Number(x); return t["dizaines de milliards"] * 1e10 + t["centaines de millions"] * 1e8 + t.dizaines * 10; }
  }
  throw new Error("question inconnue " + n);
}
// Valeur d'une réponse pour la comparer à l'attendu : les réponses « calcul » (Q22, Q28) sont évaluées.
const valeur = (n, x) => (n === 22 || n === 28 ? calc(x.replace(/(\d)\s(\d{3})/g, "$1$2").replace(/(\d+)\/(\d+)/g, "($1/$2)")) : val(x));

test("5e : 2 000 sujets jumeaux — 4 réponses distinctes, une seule juste, bonne réponse recalculée, pièges vraiment faux", () => {
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S5.questions) {
      const g = q.generer(r, false), choix = g.choix.map((x) => texte(x.html)), j = texte(g.choix.find((x) => x.juste).html);
      const ou = `q${q.num} graine ${graine} (${g.forme}) : ${texte(g.enonce)} → ${choix.join(" | ")}`;
      assert.equal(choix.length, 4, ou);
      assert.equal(new Set(choix).size, 4, ou);
      assert.equal(g.choix.filter((x) => x.juste).length, 1, ou);
      assert.ok(typeof g.forme === "string" && g.forme, ou);
      assert.ok(!/NaN|undefined|Infinity|null/.test(choix.join() + g.enonce + (g.figure || "")), ou);
      for (const x of g.choix) if (!x.juste) assert.ok(x.erreur && !/undefined|NaN/.test(x.erreur), `${ou} : piège sans explication`);
      const a = attendu(q.num, g, choix);
      if (typeof a === "number") {
        assert.ok(proche(valeur(q.num, j), a), `${ou} : attendu ${a}`);
        for (const x of choix) if (x !== j && !Number.isNaN(valeur(q.num, x))) assert.ok(!proche(valeur(q.num, x), a), `${ou} : piège juste ${x}`);
      } else assert.equal(j, a, ou);
    }
  }
});

test("5e : chaque question produit plusieurs formes (pas seulement d'autres nombres)", () => {
  const formes = new Map();
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S5.questions) {
      if (!formes.has(q.num)) formes.set(q.num, new Map());
      const f = q.generer(r, false).forme;
      formes.get(q.num).set(f, (formes.get(q.num).get(f) || 0) + 1);
    }
  }
  assert.equal(formes.size, 30);
  for (const [n, f] of formes) {
    assert.ok(f.size >= 2, `q${n} : une seule forme (${[...f.keys()]})`);
    assert.ok(Math.min(...f.values()) >= 2000 / f.size / 25, `q${n} : ${JSON.stringify(Object.fromEntries(f))}`);
  }
});

test("5e : la vue prof n'a aucun mot genré (il, elle, lui), sujet officiel et jumeaux", () => {
  for (let graine = 1; graine <= 400; graine++) {
    const r = hasard(graine);
    for (const q of S5.questions) for (const x of q.generer(r, graine === 1).choix)
      if (!x.juste) assert.ok(!/(^|[\s’'(])(il|elle|ils|elles|lui)(?=[\s,.])/i.test(x.erreur), `q${q.num} : ${x.erreur}`);
  }
});
