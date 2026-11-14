// Lot EN4c — revue de variété des sujets jumeaux de 6e (« dans la compétence ») :
// sur 2 000 graines, chaque question donne 4 réponses distinctes, une seule juste, la bonne réponse est RECALCULÉE ici
// depuis l'énoncé ou la figure (pas relue dans le générateur), les pièges sont vraiment faux, la vue prof n'a aucun mot
// genré ; et chaque question produit plusieurs formes différentes, pas seulement d'autres nombres.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_automatismes.js");
const S6 = globalThis.EN_SUJETS["6e-automatismes"];
const { hasard, enLettres } = globalThis.EN;

const texte = (h) => h
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
// Valeur d'un nombre écrit (espaces des classes, unité ou « fois » éventuels) ; NaN pour un texte.
const num = (s) => Number(String(s).replace(/\s|fois|cm²|cm³|cm|\.$/g, "").replace(",", "."));
// Valeur d'une réponse : nombre, fraction « a/b », ou NaN (texte).
const val = (t) => { const f = t.match(/^(\d+)\/(\d+)$/); return f ? f[1] / f[2] : num(t); };
// Calcule une expression : « 3 + 2/10 », « 1 000 × 754,82 »…
const calc = (e) => Function(`"use strict";return (${e.replace(/−/g, "-").replace(/×/g, "*").replace(/(\d)\s(\d{3})/g, "$1$2").replace(/(\d),(\d)/g, "$1.$2")})`)();
const proche = (a, b) => Math.abs(a - b) < 1e-9;
const sans = (s) => s.replace(/\s/g, "");

// Nombres en lettres → nombre (tables construites ici, indépendamment des générateurs).
const LETTRES = new Map();
for (let n = 0; n < 100000; n++) LETTRES.set(enLettres(n), n);
const RANG = { dizaines: 1, unités: 0, dixièmes: -1, centièmes: -2, millièmes: -3 };
// Unités rangées de la plus grande à la plus petite : le rapport de deux unités se lit sur l'écart de rang.
const ECHELLES = [["km", "hm", "dam", "m", "dm", "cm", "mm"], ["kg", "hg", "dag", "g", "dg", "cg", "mg"], ["hL", "daL", "L", "dL", "cL", "mL"]];
const rapport = (grande, petite) => {
  const e = ECHELLES.find((l) => l.includes(grande) && l.includes(petite));
  assert.ok(e, `${grande} et ${petite}`);
  return 10 ** (e.indexOf(petite) - e.indexOf(grande));
};
// Ordres de grandeur connus (objet → unité qui convient), écrits ici à la main.
const LONGUEUR = { coccinelle: "mm", fourmi: "mm", "grain de riz": "mm", stylo: "cm", gomme: "cm", téléphone: "cm", porte: "m", bus: "m", girafe: "m" };
const MASSE = { "balle de tennis de table": "g", "pièce de 1 euro": "g", "feuille de papier": "g", "paquet de sucre": "kg", chat: "kg", pastèque: "kg", pomme: "g" };
const MOT_UNITE = { g: "grammes (g)", kg: "kilogrammes (kg)" };
const objet = (e, table) => { const k = Object.keys(table).filter((o) => e.includes(o)); assert.equal(k.length, 1, e); return table[k[0]]; };

// Lecture des figures.
const textes = (fig) => [...fig.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]+)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), t: m[3] }));
const position = (fig, t) => { const l = textes(fig).filter((x) => x.t === t); assert.equal(l.length, 1, `étiquette ${t}`); return l[0]; };
const compte = (fig, couleur) => (fig.match(new RegExp(`fill="${couleur}"`, "g")) || []).length;
const cadre = (fig) => { const m = fig.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="(?:none|rgba[^"]*)"/); return { l: Number(m[3]) / 22, h: Number(m[4]) / 22 }; };

// Recalcule la bonne réponse attendue (texte ou valeur) d'après ce que voit l'élève.
function attendu(n, g, choix) {
  const e = texte(g.enonce), fig = g.figure || "";
  let m;
  switch (n) {
    case 1: m = e.match(/^Le nombre (\S+) s’écrit :$/); assert.ok(LETTRES.has(m[1]), m[1]); return LETTRES.get(m[1]);
    case 2: m = e.match(/^Quel nombre correspond à (\S+) (millièmes|centièmes) \?$/); return LETTRES.get(m[1]) * 10 ** RANG[m[2]];
    case 3: return calc(e.replace(/ = …$/, ""));
    case 4: m = e.match(/fraction (\d+)\/(\d+) \?$/); return m[1] / m[2];
    case 5: m = e.match(/^(\d) (\S+) est égal à…$/); return m[1] * 10 ** RANG[m[2]];
    case 6: {
      const [, A, B] = fig.match(/aria-label="Droite graduée de ([^"]+) à ([^"]+)"/).map(num);
      const bas = [...fig.matchAll(/<rect x="([\d.]+)" y="112"/g)].map((x) => Number(x[1]) + 88);
      const xf = Number(fig.match(/<rect x="([\d.]+)" y="2"/)[1]) + 88;
      return A + ((xf - bas[0]) / (bas[1] - bas[0])) * (B - A);
    }
    case 7: { const x0 = position(fig, "0").x, x1 = position(fig, "1").x, xb = position(fig, "B").x; return Math.round(((xb - x0) / (x1 - x0)) * 10) / 10; }
    case 8: {
      const x0 = position(fig, "0").x, x1 = position(fig, "1").x, xa = position(fig, "A").x;
      const traits = [...fig.matchAll(/<line x1="([\d.]+)" y1="50"/g)].map((x) => Number(x[1])).filter((x) => x >= x0 - 0.01 && x <= x1 + 0.01);
      const d = traits.length - 1, k = Math.round(((xa - x0) / (x1 - x0)) * d);
      assert.ok(choix.includes(`${k}/${d}`), `fraction ${k}/${d} absente`);
      return k / d;
    }
    case 9: {
      m = e.match(/([\d\s]+) (<|>) … \2 ([\d\s]+)$/); const [a, b] = [num(m[1]), num(m[3])];
      assert.ok(m[2] === "<" ? a < b : a > b, e);
      const j = choix.filter((x) => Math.min(a, b) < num(x) && num(x) < Math.max(a, b)); assert.equal(j.length, 1, e); return num(j[0]);
    }
    case 10: { const v = choix.map(num), min = Math.min(...v); assert.equal(v.filter((x) => x === min).length, 1); return min; }
    case 11: {
      const k = compte(fig, "#ffe100"), parts = (fig.match(/<(rect|path) /g) || []).length;
      assert.ok(choix.includes(`${k}/${parts}`), `fraction ${k}/${parts} absente`);
      return k / parts;
    }
    case 12: {
      const c = sans(e.split("? ")[1]);
      m = c.match(/^(\d+)\+…=(\d+)$/) || c.match(/^…\+(\d+)=(\d+)$/); if (m) return m[2] - m[1];
      m = c.match(/^(\d+)−(\d+)=…$/); return m[1] - m[2];
    }
    case 13: m = e.match(/^La moitié de ([\d,]+) est…$/); return num(m[1]) / 2;
    case 14: m = e.match(/suivante : (.+) = …$/); return calc(m[1]);
    case 15: m = e.match(/calcul : ([\d,]+ × [\d,]+) =/); return calc(m[1]);
    case 16: case 23: {
      const u = objet(e, n === 16 ? LONGUEUR : MASSE);
      if (/^Choisir la mesure/.test(e)) { const v = new Set(choix.map((x) => x.split(" ")[0])); assert.equal(v.size, 1); return `${[...v][0]} ${u}`; }
      return n === 16 ? u : MOT_UNITE[u];
    }
    case 17: { const { l, h } = cadre(fig); return 2 * (l + h); }
    case 18: {
      m = e.match(/« 1 (\S+) c’est combien de fois plus grand que 1 (\S+) \? »/); if (m) return rapport(m[1], m[2]);
      m = e.match(/« 1 (\S+) c’est combien de fois plus petit que 1 (\S+) \? »/); if (m) return rapport(m[2], m[1]);
      m = e.match(/« Combien faut-il de (\S+) pour faire 1 (\S+) \? »/); return rapport(m[2], m[1]);
    }
    case 19: { m = e.match(/: (\d+) (\S+) = … (\S+)$/); const [, v, de, vers] = m; return ECHELLES.flat().indexOf(de) < ECHELLES.flat().indexOf(vers) ? v * rapport(de, vers) : v / rapport(vers, de); }
    case 20: { const { l, h } = cadre(fig); assert.equal(l, h, "un carré"); return l * l; }
    case 21: {
      const r = compte(fig, "#ff6f78"), b = compte(fig, "#6f78ef"), v = compte(fig, "#73d17d"); // L×h, L×l, l×h
      const V = Math.sqrt(r * b * v); assert.ok(Number.isInteger(V), "pavé incohérent"); return V;
    }
    case 22: {
      const traits = [...fig.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="#111" stroke-width="1.6"\/>/g)].map((x) => x.slice(1).map(Number));
      const sommets = new Map();
      for (const [a, b, c2, d] of traits) { const k = `${a},${b}`; if (!sommets.has(k)) sommets.set(k, []); sommets.get(k).push([c2 - a, d - b]); }
      assert.equal(sommets.size, 2);
      const angle = (lettre) => {
        const p = position(fig, lettre);
        const [k, [u, w]] = [...sommets].sort((s1, s2) => Math.hypot(...s1[0].split(",").map((x, i) => x - [p.x, p.y][i])) - Math.hypot(...s2[0].split(",").map((x, i) => x - [p.x, p.y][i])))[0];
        void k;
        return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(...u) / Math.hypot(...w));
      };
      const aB = angle("B"), aE = angle("E");
      if (proche(aB, aE)) return "Les angles B et E sont égaux.";
      return aB > aE ? "L’angle B est plus grand que l’angle E." : "L’angle B est plus petit que l’angle E.";
    }
  }
  throw new Error("question inconnue " + n);
}
// Valeur d'une réponse pour la comparer à l'attendu (Q5 : « 10 fois 5 millièmes. » ou « 50 millièmes. »).
const valeur = (n, x) => {
  if (n === 5) { const m = x.match(/^(10 fois )?(\d+) (\S+)\.$/); return (m[1] ? 10 : 1) * m[2] * 10 ** RANG[m[3]]; }
  return val(x);
};

test("6e : 2 000 sujets jumeaux — 4 réponses distinctes, une seule juste, bonne réponse recalculée, pièges vraiment faux", () => {
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S6.questions) {
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
        for (const x of choix) if (x !== j) assert.ok(!proche(valeur(q.num, x), a), `${ou} : piège juste ${x}`);
      } else assert.equal(j, a, ou);
    }
  }
});

test("6e : le recalcul retrouve aussi les bonnes réponses du sujet officiel", () => {
  for (const q of S6.questions) {
    const g = q.generer(hasard(1), true), choix = g.choix.map((x) => texte(x.html)), j = texte(g.choix.find((x) => x.juste).html);
    const a = attendu(q.num, g, choix);
    if (typeof a === "number") assert.ok(proche(valeur(q.num, j), a), `q${q.num} : ${j} ≠ ${a}`);
    else assert.equal(j, a, `q${q.num}`);
  }
});

test("6e : chaque question produit plusieurs formes (pas seulement d'autres nombres)", () => {
  const formes = new Map();
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S6.questions) {
      if (!formes.has(q.num)) formes.set(q.num, new Map());
      const f = q.generer(r, false).forme;
      formes.get(q.num).set(f, (formes.get(q.num).get(f) || 0) + 1);
    }
  }
  assert.equal(formes.size, 23);
  for (const [n, f] of formes) {
    assert.ok(f.size >= 2, `q${n} : une seule forme (${[...f.keys()]})`);
    assert.ok(Math.min(...f.values()) >= 2000 / f.size / 25, `q${n} : ${JSON.stringify(Object.fromEntries(f))}`);
  }
});

test("6e : la vue prof n'a aucun mot genré (il, elle, lui), sujet officiel et jumeaux", () => {
  for (let graine = 1; graine <= 400; graine++) {
    const r = hasard(graine);
    for (const q of S6.questions) for (const x of q.generer(r, graine === 1).choix)
      if (!x.juste) assert.ok(!/(^|[\s’'(])(il|elle|ils|elles|lui)(?=[\s,.])/i.test(x.erreur), `q${q.num} : ${x.erreur}`);
  }
});

test("6e : aucune étiquette de figure ne se termine par un zéro inutile après la virgule", () => {
  for (let graine = 1; graine <= 400; graine++) {
    const r = hasard(graine);
    for (const q of S6.questions) {
      const fig = q.generer(r, graine === 1).figure || "";
      for (const { t } of textes(fig)) assert.ok(!/,\d*0$/.test(t), `q${q.num} graine ${graine} : ${t}`);
    }
  }
});
