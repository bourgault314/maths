// Contrôle des sujets « Évaluation nationale 4e et 5e — Automatismes » : officiel fidèle au PDF 2026, jumeaux sains,
// et branchement de la page (trois sujets chargés, boutons « Je m'entraîne » éteints par un seul interrupteur).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_automatismes.js");
require("../outils/evaluations_nationales/sujets/5e_automatismes.js");
require("../outils/evaluations_nationales/sujets/4e_automatismes.js");
const S4 = globalThis.EN_SUJETS["4e-automatismes"];
const S5 = globalThis.EN_SUJETS["5e-automatismes"];
const { hasard } = globalThis.EN;

// Texte lisible d'un morceau de HTML : fractions « a/b », figures remplacées par leur description.
const texte = (h) => h
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const num = (s) => Number(String(s).replace(/[\s ]|cm³|km|°/g, "").replace("−", "-").replace(",", "."));
const juste = (g) => texte(g.choix.find((x) => x.juste).html);

const OFFICIEL_4E = {
  1: ["*10 fois plus petit.", "100 fois plus petit.", "10 fois plus grand.", "100 fois plus grand."],
  2: ["45", "*35", "40", "30"], 3: ["3/5", "*5/8", "3/8", "5/3"], 4: ["190", "188", "176", "*186"], 5: ["*2", "−12", "12", "−2"],
  6: ["a² + 10a", "2a + a3 + 7", "*a² + 3a + 7", "11a"], 7: ["1 h 35 min", "1 h 15 min", "*2 h 15 min", "2 h 35 min"],
  8: ["*120", "240", "36", "84"], 9: ["20°", "50°", "70°", "*110°"], 10: ["1 462", "*14,602", "14,62", "140,62"],
  11: ["18 km", "36 km", "5,4 km", "*9 km"], 12: ["4,3", "*4 300", "43", "430"],
  13: ["[Figure : rectangle en 4 parts inégales, 3 coloriées]", "[Figure : rectangle en 4 bandes inégales, 3 coloriées]", "[Figure : disque en 4 parts inégales, 3 coloriées]", "*[Figure : disque en 8 parts égales, 6 coloriées]"],
  14: ["*12", "−12", "2", "−2"], 15: ["0,3", "*3/4", "4/3", "3"], 16: ["1/3", "*3/10", "3/100", "0/3"], 17: ["*25", "32", "39", "48"],
  18: ["0,75", "7,5", "*7 500", "750"], 19: ["*27", "17", "30", "3"], 20: ["le point A", "le point B", "le point C", "*le point D"],
  21: ["14 × 12", "*14 × 12/2", "15 × 12/2", "13 × 14 × 15"], 22: ["55 < 56/10 < 57", "4 < 56/10 < 5", "*5 < 56/10 < 6", "0 < 56/10 < 1"],
};
const OFFICIEL_5E = {
  1: ["4/5", "5/5", "1/5", "*6/5"], 2: ["3 564", "*35 064", "6 435", "64 035"], 3: ["Cent-dix-mille", "*Cent-dix-millions", "Onze milliards", "Onze millions"],
  4: ["4", "5", "*6", "7"], 5: ["*25", "30", "35", "40"], 6: ["*1/4", "1/2", "1/3", "3/4"], 7: ["*225", "227", "115", "226"], 8: ["215", "*430", "86", "205"],
  9: ["225", "*200", "210", "275"], 10: ["3,8", "*4,6", "3,16", "3,6"], 11: ["15", "*105", "150", "11"], 12: ["*7,12", "712,100", "71 200", "0,712"],
  13: ["*14,6188", "14,69", "14,68", "14,6180"], 14: ["10", "*100", "1 000", "10 000"], 15: ["*50,03", "50,300", "300,50", "350"], 16: ["13,1", "17,7", "*12,9", "13,9"],
  17: ["999 < 9,998 < 1 000", "99 < 9,998 < 100", "*9 < 9,998 < 10", "9 999 < 9,998 < 10 000"], 18: ["*millièmes.", "unités.", "milliers.", "centièmes."],
  19: ["3,600", "300,6", "3600", "*360"], 20: ["*50 % de 12.", "25 % de 12.", "1,2 % de 12.", "1,5 % de 12."], 21: ["0,84", "408", "480", "*0,48"],
  22: ["*( 2 + 3,5 ) × 0,1", "2 + 3,5 × 0,1", "2 × 0,1 + 3,5", "2 + ( 3,5 × 0,1 )"], 23: ["*14", "20", "12", "16"], 24: ["*11/10", "101/100", "1/10", "11/100"],
  25: ["*6,5224", "6,5220", "6,5201", "6,5230"], 26: ["13 cm³", "30 cm³", "*60 cm³", "3 600 cm³"], 27: ["3/7", "*6/7", "6/14", "9/49"],
  28: ["*780 : 10", "780 : 1/10", "780 × 0,01", "780 × 1/100"], 29: ["*3", "15", "5", "3/5"], 30: ["*40 800 000 400", "40 800 400", "484 000 000 000", "40 800 000 40"],
};
const ENONCES = {
  4: { 2: "Combien vaut la moitié de 70 ?", 4: "168 + 18 = …", 5: "−5 + 7 = …", 6: "a × a + a × 3 + 7 = …", 8: "12 × 7 + 12 × 3 = …", 10: "14 + 6/10 + 2/1000 = …", 14: "7 − (−5) = …", 16: "0,3 s’écrit aussi…", 22: "Quel encadrement de 56/10 par deux nombres entiers est correct ?" },
  5: { 2: "35 × 1 000 + 64 = …", 4: "8 × … = 48", 5: "75 + … = 100", 7: "126 + 99 = …", 8: "5 × 43 × 2 = …", 11: "525 : 5 = …", 12: "712/100 = …", 16: "15,3 − 2,4 = …", 23: "6 + 4 × 2 = …", 27: "3/7 + 3/7 = …", 28: "780 × 0,1 = …", 29: "À quel nombre est égal : « cinq fois trois cinquièmes » ?" },
};

test("4e : 22 questions (13 nombres, 5 grandeurs, 2 données-fonctions, 2 géométrie), seuils 6 / 12", () => {
  assert.equal(S4.questions.length, 22);
  const n = (d) => S4.questions.filter((q) => q.domaine === d).length;
  assert.deepEqual([n("NC"), n("GM"), n("OGD"), n("EG")], [13, 5, 2, 2]);
  assert.deepEqual(S4.seuils.map((s) => s.max), [6, 12, 22]);
});

test("5e : 30 questions (29 nombres, 1 grandeurs), seuils 9 / 17", () => {
  assert.equal(S5.questions.length, 30);
  assert.equal(S5.questions.filter((q) => q.domaine === "GM").length, 1);
  assert.deepEqual(S5.seuils.map((s) => s.max), [9, 17, 30]);
});

for (const [niv, S, OFF] of [[4, S4, OFFICIEL_4E], [5, S5, OFFICIEL_5E]]) {
  test(`${niv}e : le sujet officiel reprend exactement la bonne réponse et les quatre choix du PDF 2026`, () => {
    for (const q of S.questions) {
      const g = q.generer(hasard(1), true);
      const attendu = OFF[q.num];
      assert.ok(attendu, `question ${q.num} sans référence`);
      assert.equal(juste(g), attendu.find((x) => x.startsWith("*")).slice(1), `bonne réponse q${q.num}`);
      assert.deepEqual(new Set(g.choix.map((x) => texte(x.html))), new Set(attendu.map((x) => x.replace(/^\*/, ""))), `choix q${q.num}`);
      if (ENONCES[niv][q.num]) assert.equal(texte(g.enonce), ENONCES[niv][q.num], `énoncé q${q.num}`);
    }
  });

  test(`${niv}e : 2 000 sujets jumeaux — 4 choix distincts, une seule bonne réponse, chaque piège expliqué`, () => {
    for (let graine = 2; graine <= 2001; graine++) {
      const r = hasard(graine);
      for (const q of S.questions) {
        const g = q.generer(r, false);
        assert.equal(g.choix.length, 4, `q${q.num} graine ${graine}`);
        const t = g.choix.map((x) => x.html);
        assert.equal(new Set(t).size, 4, `q${q.num} graine ${graine} : ${t.map(texte).join(" | ")}`);
        assert.equal(new Set(t.map(texte)).size, 4, `q${q.num} graine ${graine} (texte) : ${t.map(texte).join(" | ")}`);
        assert.equal(g.choix.filter((x) => x.juste).length, 1, `q${q.num} graine ${graine}`);
        for (const x of g.choix) if (!x.juste) assert.ok(x.erreur && !/undefined|NaN/.test(x.erreur), `q${q.num} : piège sans explication`);
        assert.ok(!/NaN|undefined|Infinity|null/.test(t.join() + g.enonce + (g.figure || "") + (g.apres || "")), `q${q.num} graine ${graine}`);
        assert.ok(q.entrainement && q.entrainement.url.startsWith("/automatismes/?notions="), `q${q.num} : champ entrainement`);
      }
    }
  });
}

test("4e : les bonnes réponses des jumeaux sont mathématiquement justes", () => {
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S4.questions) {
      const g = q.generer(r, false), j = juste(g), e = texte(g.enonce), n = q.num;
      let m;
      if (n === 2) { m = e.match(/moitié de (\d+)/); assert.equal(num(j) * 2, Number(m[1])); }
      if (n === 4) { m = e.match(/(\d+) \+ (\d+)/); assert.equal(num(j), Number(m[1]) + Number(m[2])); }
      if (n === 5) { m = e.match(/−(\d) \+ (\d)/); assert.equal(num(j), -Number(m[1]) + Number(m[2])); }
      if (n === 7) { m = e.match(/(\d+) minutes/); const [, h, mn] = j.match(/(\d) h (\d+) min/); assert.equal(60 * h + Number(mn), Number(m[1])); }
      if (n === 8) { m = e.match(/(\d+) × (\d) \+ \d+ × (\d)/); assert.equal(num(j), m[1] * m[2] + m[1] * m[3]); }
      if (n === 9) { const angles = [...g.figure.matchAll(/>(\d+)°</g)].map((x) => Number(x[1])); assert.equal(num(j), 180 - angles[0] - angles[1]); }
      if (n === 10) { m = e.match(/(\d+) \+ (\d)\/10 \+ (\d)\/1000/); assert.ok(Math.abs(num(j) - (m[1] * 1 + m[2] / 10 + m[3] / 1000)) < 1e-9); }
      if (n === 11) { m = e.match(/(\d+) km\/h/); assert.equal(num(j), Number(m[1]) / 2); }
      if (n === 12) { m = e.match(/(\d+) (\S+) = … (\S+)/); const rang = { dixièmes: -1, centièmes: -2, unités: 0, dizaines: 1, centaines: 2, milliers: 3 }; assert.equal(num(j), m[1] * 10 ** (rang[m[2]] - rang[m[3]])); }
      if (n === 14) { m = e.match(/(\d) − \(−(\d)\)/); assert.equal(num(j), Number(m[1]) + Number(m[2])); }
      if (n === 15) { const ticks = (g.figure.match(/<line /g) || []).length - 1; const d = (ticks - 1) / 3; const xA = Number(g.figure.match(/<text x="([\d.]+)"[^>]*>A</)[1]); const [a, b] = j.split("/").map(Number); assert.equal(b, d); assert.ok(Math.abs(xA - (24 + (a * 150) / b)) < 0.2); }
      if (n === 16) { m = e.match(/0,(\d)/); assert.equal(j, `${m[1]}/10`); }
      if (n === 17) { m = e.match(/A = (\d) \+ (\d)x\. Quelle est la valeur de A pour x = (\d)/); assert.equal(num(j), m[1] * 1 + m[2] * m[3]); }
      if (n === 18) { m = e.match(/(\d+) (\S+) = … (\S+)/); assert.equal(num(j), m[1] * 100); }
      if (n === 19) { const v = [...g.figure.matchAll(/<td>(\d*)<\/td>/g)].map((x) => x[1]); assert.equal(v[2], ""); assert.equal(num(j) * Number(v[1]), Number(v[0]) * Number(v[3])); }
      if (n === 21) { const [, b, h] = j.match(/^(\d+) × (\d+)\/2$/); const etiquettes = [...g.figure.matchAll(/>(\d+)</g)].map((x) => Number(x[1])); assert.ok(etiquettes.includes(Number(b)) && etiquettes.includes(Number(h))); }
      if (n === 22) { m = e.match(/de (\d+)\/10/); const [, a, b] = j.match(/^(\d+) < \d+\/10 < (\d+)$/); assert.ok(a < m[1] / 10 && m[1] / 10 < b && b - a === 1); }
      if (n === 20) { // le bon point est bien dessiné aux coordonnées demandées
        m = e.match(/\((\d) ; (\d)\)/); const nom = j.slice(-1);
        const X = (v) => 40 + v * 34, Y = (v) => 214 - v * 34;
        assert.ok(g.figure.includes(`<text x="${X(Number(m[1])) + 7}" y="${Y(Number(m[2])) - 8}" font-size="15" fill="#2747b0">${nom}</text>`), `q20 graine ${graine}`);
      }
    }
  }
});

test("5e : les bonnes réponses des jumeaux sont mathématiquement justes (et les pièges sont faux)", () => {
  for (let graine = 2; graine <= 2001; graine++) {
    const r = hasard(graine);
    for (const q of S5.questions) {
      const g = q.generer(r, false), j = juste(g), e = texte(g.enonce), n = q.num;
      const autres = g.choix.filter((x) => !x.juste).map((x) => texte(x.html));
      const fr = (t) => { const [a, b] = t.split("/").map(Number); return a / b; };
      let m;
      if (n === 1) { const v = g.choix.map((x) => fr(texte(x.html))); assert.equal(fr(j), Math.max(...v)); assert.equal(v.filter((x) => x === fr(j)).length, 1); }
      if (n === 2) { m = e.match(/(\d+) × 1 000 \+ (\d+)/); assert.equal(num(j), m[1] * 1000 + Number(m[2])); }
      if (n === 4) { m = e.match(/(\d) × … = (\d+)/); assert.equal(num(j) * m[1], Number(m[2])); }
      if (n === 5) { m = e.match(/(\d+) \+ … = 100/); assert.equal(num(j) + Number(m[1]), 100); }
      if (n === 7) { m = e.match(/(\d+) \+ 99/); assert.equal(num(j), Number(m[1]) + 99); }
      if (n === 8) { m = e.match(/5 × (\d+) × 2/); assert.equal(num(j), 10 * m[1]); }
      if (n === 9) { assert.equal(num(j) % 50, 0); for (const a of autres) assert.notEqual(num(a) % 50, 0); }
      if (n === 10) { m = e.match(/([\d,]+) \+ ([\d,]+)/); assert.ok(Math.abs(num(j) - num(m[1]) - num(m[2])) < 1e-9); }
      if (n === 11) { m = e.match(/(\d+) : (\d)/); assert.equal(num(j) * m[2], Number(m[1])); }
      if (n === 12) { m = e.match(/^(\d+)\/([\d ]+) =/); assert.ok(Math.abs(num(j) - m[1] / num(m[2])) < 1e-9); }
      if (n === 13) { const [, a] = g.figure.match(/aria-label="Portion de droite graduée de ([\d,]+) à/); assert.ok(j.startsWith(a) && j.length === a.length + 1); }
      if (n === 14) { m = e.match(/([\d,]+) × ([\d,]+)/); const p = num(m[1]) * num(m[2]); for (const x of ["10", "1 000", "10 000"]) assert.ok(Math.abs(num(j) - p) < Math.abs(num(x) - p)); }
      if (n === 15) { m = e.match(/(\d) dizaines et (\d) centièmes/); assert.ok(Math.abs(num(j) - (m[1] * 10 + m[2] / 100)) < 1e-9); }
      if (n === 16) { m = e.match(/([\d,]+) − ([\d,]+)/); assert.ok(Math.abs(num(j) - (num(m[1]) - num(m[2]))) < 1e-9); }
      if (n === 17) { m = e.match(/de ([\d,]+) par/); const [, a, b] = j.match(/^([\d ]+) < [\d,]+ < ([\d ]+)$/); assert.ok(num(a) < num(m[1]) && num(m[1]) < num(b) && num(b) - num(a) === 1); }
      if (n === 18) { m = e.match(/nombre (\d) (\d{3}),(\d{3}) (\d) est/); const pos = m[3].indexOf(m[4]); assert.equal(j, ["dixièmes.", "centièmes.", "millièmes."][pos]); }
      if (n === 19) { m = e.match(/([\d,]+) × 100/); assert.ok(Math.abs(num(j) - num(m[1]) * 100) < 1e-9); }
      if (n === 21) { m = e.match(/(\d)\/10 \+ (\d)\/100/); assert.ok(Math.abs(num(j) - (m[1] / 10 + m[2] / 100)) < 1e-9); }
      if (n === 23) { m = e.match(/(\d) \+ (\d) × (\d)/); assert.equal(num(j), m[1] * 1 + m[2] * m[3]); }
      if (n === 24) { assert.ok(Math.abs(fr(j) - (1 + (fr(j) * 10 - 10) / 10)) < 1e-9 && fr(j) > 1 && fr(j) < 1.5); }
      if (n === 25) { m = e.match(/([\d,]+) < … < ([\d,]+)/); const dedans = (t) => num(m[1]) < num(t) && num(t) < num(m[2]); assert.ok(dedans(j)); for (const a of autres) assert.ok(!dedans(a), `q25 ${a}`); }
      if (n === 26) { m = e.match(/(\d) cm, (\d) cm et (\d) cm/); assert.equal(num(j), m[1] * m[2] * m[3]); }
      if (n === 27) { m = e.match(/(\d)\/(\d) \+ (\d)\/(\d)/); assert.ok(Math.abs(fr(j) - 2 * (m[1] / m[2])) < 1e-9); for (const a of autres) assert.ok(Math.abs(fr(a) - fr(j)) > 1e-9); }
      if (n === 28) { m = e.match(/(\d+) × ([\d,]+)/); const [, a, d] = j.match(/(\d+) : ([\d ]+)/); assert.ok(Math.abs(a / num(d) - m[1] * num(m[2])) < 1e-9); }
      if (n === 30) { m = e.match(/(\d) dizaines de milliards, (\d) centaines de millions et (\d+) dizaines/); assert.equal(num(j), m[1] * 1e10 + m[2] * 1e8 + m[3] * 10); }
    }
  }
});

test("la page charge les trois sujets et le bilan cache « Je m’entraîne » par un seul interrupteur éteint", () => {
  const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
  for (const f of ["6e_automatismes.js", "5e_automatismes.js", "4e_automatismes.js"]) assert.match(html, new RegExp(`<script src="\\./sujets/${f}\\?v=\\d{8}-\\d+"></script>`));
  assert.ok(html.indexOf("en_commun.js") < html.indexOf("sujets/") && html.lastIndexOf("sujets/") < html.indexOf("evaluation.js"));
  assert.match(html, /<div id="bloc-entrainement" hidden>\s*<h2>Je m’entraîne<\/h2>/);
  assert.equal((js.match(/ENTRAINEMENT_VISIBLE/g) || []).length, 2);
  assert.match(js, /const ENTRAINEMENT_VISIBLE = false;/);
  assert.match(js, /\$\("#bloc-entrainement"\)\.hidden = !ENTRAINEMENT_VISIBLE \|\| rates\.length === 0;/);
  for (const id of ["6e-automatismes", "5e-automatismes", "4e-automatismes"]) assert.ok(globalThis.EN_SUJETS[id], id);
});
