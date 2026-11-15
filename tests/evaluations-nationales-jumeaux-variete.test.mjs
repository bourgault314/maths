// Contrôle du lot EN-J « corriger les jumeaux » (revue de Codex du 15/11/2026, décidé avec Gwenaël) : un jumeau strict
// change les nombres, le dessin et l'écriture dans la même difficulté — et jamais la question.
// - la bonne réponse change de place dans TOUS les jumeaux (le sujet officiel garde l'ordre du PDF, décision EN-C1) ;
// - une bonne réponse qui est une catégorie change (nature du triangle, premier ou pas, égaux ou pas, OUI ou NON) ;
// - les écritures de même difficulté reviennent (« N est divisible par… », « 14 + (−9) », « 130 : 2 »…), celles qui
//   changent la question restent dehors (« −7 + (−12) », « quel nombre a pour double… ») ;
// - les figures et les lettres changent (rectangle, bande coloriée, bande hachurée, lettre de l'expression) ;
// - les sujets officiels ne bougent pas d'un octet (énoncés, figures, réponses, ordre, explications).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const m of readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8").matchAll(/<script src="\.\/((?:sujets\/)?[\w]+\.js)\?v=[^"]+"><\/script>/g))
  if (m[1] !== "evaluation.js") require(`../outils/evaluations_nationales/${m[1]}`);
const EN = globalThis.EN, S = globalThis.EN_SUJETS;
const { hasard, construire } = EN;

const texte = (h) => String(h ?? "")
  .replace(/<svg[\s\S]*?aria-label="([^"]*)"[\s\S]*?<\/svg>/g, "[$1]")
  .replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, "$1/$2")
  .replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const JUMEAUX = ["6e-automatismes", "5e-automatismes", "4e-automatismes", "3e-automatismes", "6e-problemes", "4e-problemes"];
const N = 400;
const modeleDe = (s, graine) => (s.officiels && s.officiels.length > 1 && graine % 2 ? s.officiels[1] : undefined);
// Les jumeaux d'une question, tirés comme dans la page (sujet entier, une graine par passage).
function jumeaux(id, num, n = N) {
  const s = S[id], l = [];
  for (let graine = 2; graine < 2 + n; graine++) l.push(construire(s, hasard(graine), null, null, modeleDe(s, graine)).find((it) => it.q.num === num));
  return l;
}
const juste = (it) => texte(it.choix.find((x) => x.juste).html);

test(`la bonne réponse change de place dans tous les jumeaux : les 4 places, chacune au moins 1 fois sur 10 (${N} tirages)`, () => {
  for (const id of JUMEAUX) {
    const s = S[id], places = {};
    for (let graine = 2; graine < 2 + N; graine++)
      for (const it of construire(s, hasard(graine), null, null, modeleDe(s, graine))) {
        if (it.g.grille) continue; // une question en grille (Vrai / Faux…) n'a pas de liste de réponses
        const p = (places[it.q.num] = places[it.q.num] || [0, 0, 0, 0]);
        p[it.choix.findIndex((x) => x.juste)]++;
      }
    for (const [num, p] of Object.entries(places))
      assert.ok(p.every((k) => k >= N / 10), `${id} Q${num} : bonne réponse aux places 1 à 4 → ${p.join(" / ")} sur ${N}`);
  }
});

test("seuls deux tirages gardent leurs réponses dans l'ordre (étiquettes Figure 1 à 4, point A à D) : la bonne y est tirée", () => {
  const fixes = [];
  for (const id of JUMEAUX)
    for (const it of construire(S[id], hasard(5), null, null)) if (it.g.melange === false) fixes.push(`${id} Q${it.q.num}`);
  assert.deepEqual(fixes.sort(), ["3e-automatismes Q20", "4e-automatismes Q20"]);
  assert.deepEqual(jumeaux("3e-automatismes", 20).at(0).choix.map((x) => texte(x.html)), ["Figure 1", "Figure 2", "Figure 3", "Figure 4"]);
  assert.deepEqual(jumeaux("4e-automatismes", 20).at(0).choix.map((x) => texte(x.html)), ["le point A", "le point B", "le point C", "le point D"]);
});

test("une réponse qui est une catégorie change : nature du triangle, premier ou pas, égaux ou pas, OUI ou NON", () => {
  const vues = (id, num, f = juste) => new Set(jumeaux(id, num).map(f));
  assert.deepEqual([...vues("3e-automatismes", 21)].sort(), ["isocèle mais pas équilatéral.", "ni rectangle, ni isocèle, ni équilatéral.", "rectangle.", "équilatéral."]);
  assert.deepEqual([...vues("3e-automatismes", 29, (it) => juste(it).split(" ")[0])].sort(), ["Non", "Oui"]);
  assert.deepEqual([...vues("6e-automatismes", 22, (it) => juste(it).replace(/ [BE]\b/g, ""))].sort(),
    ["Les angles et sont égaux.", "L’angle est plus grand que l’angle.", "L’angle est plus petit que l’angle."]);
  assert.deepEqual([...vues("4e-problemes", 15, (it) => juste(it).split(".")[0])].sort(), ["NON", "OUI"]);
  assert.deepEqual([...vues("6e-problemes", 15, (it) => juste(it).replace(/ que celle.*/, ""))].sort(), ["L’aire de la figure A est plus grande", "L’aire de la figure A est plus petite"]);
  // 4e Problèmes Q18 (choix de Gwenaël) : plus seulement 80 %.
  assert.ok(vues("4e-problemes", 18).size >= 8, [...vues("4e-problemes", 18)].join(" / "));
});

test("les écritures de même difficulté reviennent dans le jumeau ; celles qui changent la question restent dehors", () => {
  const formes = (id, num) => new Set(jumeaux(id, num).map((it) => it.g.forme.replace(/-\d$/, "")));
  const revenues = { "3e-automatismes": { 4: "divisible", 6: "b-plus-moins-a" }, "4e-automatismes": { 1: "revient", 2: "division", 5: "positif-dabord-negatif", 17: "moins" }, "6e-automatismes": { 5: "en-nombre", 9: "decroissant" } };
  for (const [id, l] of Object.entries(revenues)) for (const [num, f] of Object.entries(l)) assert.ok(formes(id, Number(num)).has(f), `${id} Q${num} : « ${f} » absent`);
  // Gwenaël, 15/11 : « −7 + (−12) » n'est plus une soustraction ; « quel nombre a pour double 130 ? » est la question à l'envers.
  assert.ok(!formes("3e-automatismes", 11).has("moins-a-plus-moins-b"));
  assert.ok(!formes("4e-automatismes", 2).has("double"));
  assert.deepEqual(EN.horsStrict(S["3e-automatismes"], { num: 11 }), ["moins-a-plus-moins-b"]);
  assert.deepEqual(EN.horsStrict(S["4e-automatismes"], { num: 2 }), ["double"]);
});

test("les figures et les lettres changent : rectangle de 3e Q7, lettre de 3e Q10, bande de 6e Q11, bande hachurée de 4e Problèmes Q13", () => {
  // 3e Q7 : couché ou debout, mesures d'un côté ou de l'autre (8 poses) ; la figure dit toujours la longueur et la largeur.
  const poses = new Set(jumeaux("3e-automatismes", 7).map((it) => {
    const f = it.g.figure, vb = f.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), [W, H] = [Number(vb[1]), Number(vb[2])];
    const t = [...f.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*text-anchor="(\w+)"/g)].map((m) => m.slice(1, 4).join(","));
    return `${W > H ? "couché" : "debout"} ${t.join(" ")}`.replace(/[\d.]+,/g, (x) => (Number(x.slice(0, -1)) < 60 ? "bord," : "loin,"));
  }));
  assert.ok(poses.size >= 8, [...poses].join("\n"));
  // 3e Q10 : la lettre change (𝑥, a, n, t, y), en italique.
  const lettres = new Set(jumeaux("3e-automatismes", 10).map((it) => it.g.enonce.match(/Pour <i class="lettre">(\w)<\/i> =/)[1]));
  assert.deepEqual([...lettres].sort(), ["a", "n", "t", "x", "y"]);
  // 6e Q11 : bande coloriée par un bout ou l'autre, couchée ou dressée — toujours d'un seul tenant, au bord.
  const bandes = new Map();
  for (const it of jumeaux("6e-automatismes", 11)) {
    bandes.set(it.g.forme, (bandes.get(it.g.forme) || 0) + 1);
    const rect = [...it.g.figure.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="([^"]+)"/g)];
    const col = rect.map((m) => m[5] !== "#fff"), k = col.filter(Boolean).length;
    assert.ok(k > 0 && (col.slice(0, k).every(Boolean) || col.slice(-k).every(Boolean)), `${it.g.forme} : parts coloriées d'un seul tenant au bord`);
    assert.equal(/debout/.test(it.g.forme), Number(rect[0][3]) > Number(rect[0][4]), it.g.forme);
  }
  assert.deepEqual([...bandes.keys()].sort(), ["bande-coloriee-a-droite", "bande-coloriee-a-gauche", "bande-debout-coloriee-en-bas", "bande-debout-coloriee-en-haut"]);
  // 4e Problèmes Q13 : la bande hachurée dans les quatre coins ; la bonne réponse reste k(b − a).
  const coins = new Set();
  for (const it of jumeaux("4e-problemes", 13)) {
    const { k, a, b, coin } = it.g.bande;
    coins.add(coin);
    assert.equal(juste(it), `${k}(${b} − ${a})`);
    assert.match(texte(it.g.figure), new RegExp(`${coin.replace("-", " à ").replace("bas", "en bas").replace("haut", "en haut")}, une bande hachurée de largeur ${k}`));
  }
  assert.deepEqual([...coins].sort(), ["bas-droite", "bas-gauche", "haut-droite", "haut-gauche"]);
});

test("4e Problèmes Q16 (choix de Gwenaël) : 10 % ou 20 % par jour, jamais plus que le livre", () => {
  const p = new Set();
  for (const it of jumeaux("4e-problemes", 16)) {
    const m = texte(it.g.enonce).match(/livre de (\d+) pages\. Chaque jour \S+ en lit (\d+) %\. Combien lit-\S+ de pages en (\d+) jours/);
    p.add(m[2]);
    assert.ok(Number(m[2]) * Number(m[3]) <= 100, texte(it.g.enonce));
  }
  assert.deepEqual([...p].sort(), ["10", "20"]);
});

// Empreintes des sujets officiels (énoncé, texte après, figure, réponses dans l'ordre du PDF, explications), relevées sur
// main 0bcc549 avant le lot EN-J. Un changement ici est un changement du sujet officiel : il ne doit jamais arriver par un
// lot sur les jumeaux.
const EMPREINTES = {
  "3e-automatismes/outil": "e445c2d77ce2a75e", "6e-automatismes/2026": "2157e6bedba7e96f", "5e-automatismes/2026": "09bc9c69110eb604",
  "4e-automatismes/2026": "91a0ac8ca0bfbf3b", "4e-automatismes/2024-2025": "32fb18e6a577055a", "6e-problemes/2026": "21f751878599aa83",
  "4e-problemes/2026": "665a5da2c4d5cb02", "6e-pos-automatismes/outil": "225d480e737c1d56", "6e-pos-geometrie/outil": "ebe9d26f110961a1",
  "6e-pos-nombres/outil": "fb43dbe6092d5f86", "6e-pos-grandeurs/outil": "6756c7c244e3c8d3", "3e-exemples-nombres/eduscol": "572e454ba7af09c4",
  "4e-exemples-geometrie/7a": "9c5cec5990360600", "4e-exemples-geometrie/7b": "b1d58ee03a8b402f", "4e-exemples-geometrie/7c": "0ca1fd4e387b425a",
  "4e-exemples-nombres/eduscol": "36ae73ae0a7cabb6", "4e-exemples-expressions/eduscol": "b2d8375aa253509e",
};
test("les sujets officiels n'ont pas bougé d'un octet (énoncés, figures, réponses et leur ordre, explications)", () => {
  const vues = {};
  for (const [id, s] of Object.entries(S))
    for (const o of s.officiels || [{ cle: String(s.annee), annee: s.annee }]) {
      const txt = JSON.stringify(construire(s, hasard(1), o, null).map((it) => [it.q.num, it.g.enonce, it.g.apres || "", it.g.figure || "", it.choix.map((x) => [x.html, x.juste, x.erreur])]));
      vues[`${id}/${o.cle}`] = createHash("sha256").update(txt).digest("hex").slice(0, 16);
      // Le hasard ne compte pas pour un sujet officiel.
      assert.deepEqual(construire(s, hasard(777), o, null).map((it) => it.choix.map((x) => x.html)), construire(s, hasard(1), o, null).map((it) => it.choix.map((x) => x.html)), `${id}/${o.cle}`);
    }
  assert.deepEqual(vues, EMPREINTES);
});
