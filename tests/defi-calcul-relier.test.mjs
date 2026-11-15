// Défi calcul, lot « relier » (31/10/2026, décision de Gwenaël) : dans
// J'apprends, ce que l'élève fait se voit dans le dessin.
//  - « J'écris » : chaque égalité juste fait apparaître SON morceau dans le
//    dessin au-dessus (la droite, le schéma en barres, le tableau) ; la
//    réponse n'y est jamais écrite avant que l'élève l'ait trouvée.
//  - « Je manipule » : chaque geste sur le boulier se reporte sur une droite,
//    un saut par geste, avec son point d'arrivée.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const NIVEAUX = CORE.MODULES.filter(fiche => fiche.construit)
  .flatMap(fiche => fiche.niveaux.map(niveau => ({fiche, niveau, cle: `${fiche.id}-${niveau.n}`})));
const VERT = "#147447";

// Les nombres écrits dans un dessin (les textes du SVG) : « + 4 » → 4,
// « × 100 » → 100, « 1 000 » → 1000, « ? » et les noms de colonnes ne
// comptent pas.
function nombresDu(svg) {
  const nombres = new Set();
  for (const [, texte] of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
    const net = texte.replace(/[   ]/g, "").replace(/^[+−×÷-]/, "");
    if (/^\d+(,\d+)?$/.test(net)) nombres.add(Number(net.replace(",", ".")));
    // Modules lot 4 : un calcul écrit dans le dessin (« 46 × 10 = 460 »,
    // « 80 ÷ 8 = 10 ») : son résultat compte aussi.
    const resultat = texte.replace(/[\u202f\u00a0 ]/g, "").match(/=(\d+(,\d+)?)$/);
    if (resultat) nombres.add(Number(resultat[1].replace(",", ".")));
  }
  return nombres;
}
const vertsDe = svg => (svg.match(new RegExp(`(fill|stroke)="${VERT}"`, "g")) || []).length;
const viewBox = svg => svg.match(/viewBox="([^"]+)"/)[1];

test("J'écris : un dessin par étape, de la même taille, vide de vert au début", () => {
  assert.equal(NIVEAUX.length, 103, "les 35 modules construits (103 niveaux depuis le lot 7a) : A1, A10, A11, A2, A5, M1, M2, D2, A3, A4, A6, A7, A8 (modules lot 2), M3, M4, M5, M6, M8 (modules lot 3), M7, M10, M12, C1, C3 (modules lot 4), D1, D3, D4 (modules lot 5), F2, F5, F6, F8 (modules lot 6), puis F1, F3 (modules lot 6b), D5, D6, D7 (lot 7a)");
  NIVEAUX.forEach(({niveau, cle}) => {
    const ecris = niveau.apprends.ecris;
    assert.equal(ecris.dessins.length, ecris.etapes.length + 1, `${cle} : un dessin avant la première étape, puis un par étape`);
    const svgs = ecris.dessins.map(AIDES.dessinerImage);
    const taille = viewBox(svgs[0]);
    svgs.forEach((svg, k) => assert.equal(viewBox(svg), taille, `${cle} : le dessin ${k} a la taille du premier (rien ne bouge)`));
    assert.equal(viewBox(AIDES.dessinerImage(ecris.solution.image)), taille, `${cle} : la réponse donnée au 2e essai faux est le même dessin`);
    assert.equal(vertsDe(svgs[0]), 0, `${cle} : rien n'est trouvé avant la première étape`);
    assert.equal(vertsDe(AIDES.dessinerImage(ecris.solution.image)) <= 2, true, `${cle} : la réponse donnée n'est pas peinte comme trouvée`);
    assert.notEqual(svgs[svgs.length - 1], svgs[0], `${cle} : le dessin se remplit`);
  });
});

// Modules lot 6 (les fractions) : « 1/2 » s'écrit en deux nombres, et la
// graduation « 1 » de la droite n'est pas la réponse « 1 quart » — leur
// contrôle, sur les morceaux du dessin, est dans defi-calcul-core.test.mjs
// (« le « ? » reste jusqu'à son étape »).
// Modules lot 6b : F1 et F3 aussi (« 0,03 = 3/□ » : 0,03 est écrit dans le
// tableau dès le début, c'est le calcul ; « 1/2 de 6 L » : 3 L n'est pas
// la réponse 3,5 L) — leur contrôle est dans « modules lot 6b » du même fichier.
const FRACTIONS = ["F2", "F5", "F6", "F8", "F1", "F3"];
test("J'écris : chaque égalité juste fait apparaître son morceau, jamais un nombre pas encore écrit", () => {
  NIVEAUX.filter(({fiche}) => !FRACTIONS.includes(fiche.id)).forEach(({niveau, cle}) => {
    const ecris = niveau.apprends.ecris;
    const svgs = ecris.dessins.map(AIDES.dessinerImage);
    const reponses = ecris.etapes.map(etape => Number(etape.reponse));
    svgs.forEach((svg, k) => {
      // Les réponses des étapes pas encore faites (236 + 4 = 240 : le 240
      // avant la 1re étape), sauf celles qu'une étape faite a déjà écrites.
      const trouvees = new Set(reponses.slice(0, k));
      const interdites = reponses.slice(k).filter(r => !trouvees.has(r));
      for (const n of nombresDu(svg)) assert.ok(!interdites.includes(n), `${cle} : ${n} est écrit dans le dessin ${k}, avant que l'élève l'ait trouvé`);
      // Le vert ne fait que grandir : ce qui est trouvé reste trouvé.
      if (k > 0) assert.ok(vertsDe(svg) >= vertsDe(svgs[k - 1]), `${cle} : le dessin ${k} perd un morceau trouvé`);
    });
  });
});

test("J'écris : les morceaux attendus, module par module", () => {
  const ecris = cle => CORE.niveauDe(cle).niveau.apprends.ecris;
  const lus = cle => ecris(cle).dessins.map(d => AIDES.dessinerImage(d).match(/aria-label="([^"]*)"/)[1]);
  // A10-2 : 236 + 4 = 240 (le saut + 4 et le point 240), 240 + 3 = 243, puis
  // 236 + 7 = 243 : le saut direct, dessous.
  const a10 = ecris("A10-2").dessins;
  assert.deepEqual(lus("A10-2").slice(0, 3), [
    "Droite : on part de 236.",
    "Droite : on part de 236. plus 4 : 240.",
    "Droite : on part de 236. plus 4 : 240. Puis plus 3 : 243."]);
  assert.deepEqual(a10.map(d => Boolean(d.directCache)), [true, true, true, false], "le saut direct vient avec la dernière égalité");
  assert.deepEqual(a10.map(d => d.inconnues), [[1, 2], [2], [], []]);
  // A10-1 : 4 + 3 = 7 (le saut), puis 254 + 3 = 257 (son point).
  assert.deepEqual(lus("A10-1"), ["Droite : on part de 254.", "Droite : on part de 254. plus 3 : un nombre à trouver.", "Droite : on part de 254. plus 3 : 257."]);
  // A2-3, un trou : les points sont là, chaque étape écrit son saut, puis le
  // complément entier (+ 76) dessous.
  const a2 = ecris("A2-3").dessins;
  assert.deepEqual(a2.map(d => d.sauts.map(s => (s.masque ? "?" : s.val))), [["?", "?"], [6, "?"], [6, 70], [6, 70]]);
  assert.deepEqual(a2.map(d => Boolean(d.directCache)), [true, true, true, false]);
  assert.equal(a2[3].direct, 76);
  assert.match(AIDES.dessinerImage(a2[2]), /^(?![\s\S]*\+ 76)/, "+ 76 n'est pas écrit avant la dernière égalité");
  assert.match(AIDES.dessinerImage(a2[3]), /\+ 76/);
  // M1-3, double de 36 (lot 3a, décision 5 : J'écris sur le double) :
  // 60 sous les deux 30, puis 12 sous les deux 6, puis l'accolade (72).
  const m1 = ecris("M1-3").dessins;
  assert.deepEqual(m1.map(d => [d.trouves, d.fini]), [[[], false], [[0], false], [[0, 1], false], [[0, 1], true]]);
  const m1svg = m1.map(AIDES.dessinerImage);
  assert.ok(vertsDe(m1svg[1]) > vertsDe(m1svg[0]) && vertsDe(m1svg[2]) > vertsDe(m1svg[1]), "ce que l'élève trouve s'écrit en vert");
  const compte = (svg, n) => (svg.match(new RegExp(`>${n}<`, "g")) || []).length;
  assert.deepEqual(m1svg.map(svg => compte(svg, 60)), [0, 1, 1, 1], "2 × 30 = 60 sous les deux 30");
  assert.deepEqual(m1svg.map(svg => compte(svg, 12)), [0, 0, 1, 1], "2 × 6 = 12 sous les deux 6");
  assert.deepEqual(m1svg.map(svg => compte(svg, 72)), [0, 0, 0, 1], "la dernière égalité remplit l'accolade");
  // M1-2, double de 75 : 140, puis 10, puis l'accolade (150).
  // (Lot 3a : M1-2 écrit double de 250 — 400, 100, puis 500.)
  const m12 = ecris("M1-2").dessins.map(AIDES.dessinerImage);
  assert.deepEqual(m12.map(s => [/>400</.test(s), />100</.test(s), />500</.test(s)]), [[false, false, false], [true, false, false], [true, true, false], [true, true, true]]);
  // D2-1, 72,41 × 10 : une seule étape (décision du 04/11, modules lot 5) —
  // tous les chiffres glissent ensemble, le tableau se remplit d'un coup.
  const d2 = ecris("D2-1").dessins;
  assert.deepEqual(d2.map(d => d.trouves.filter(r => r >= -1 && r <= 2)), [[], [2, 1, 0, -1]]);
  assert.equal((AIDES.dessinerImage(d2[0]).match(/>\?</g) || []).length, 4);
  assert.equal((AIDES.dessinerImage(d2[1]).match(/>\?</g) || []).length, 0);
  // D2-3 (lot 3b : × 100, comme la leçon) : 4,5 × 100 = 450, le zéro avec le reste.
  assert.deepEqual(ecris("D2-3").dessins[1].trouves.filter(r => r >= 0 && r <= 2), [2, 1, 0]);
  // D3-1, 52,7 ÷ 10 : de même, d'un coup.
  assert.deepEqual(ecris("D3-1").dessins.map(d => d.trouves.filter(r => r >= -2 && r <= 1)), [[], [1, 0, -1, -2]]);
  // Modules lot 5 : le tableau de numération. D1-1, 4 + 6/10 : « 6/10 = 0,6 »
  // écrit les dixièmes, « 4 + 6/10 = 4,6 » les unités.
  assert.deepEqual(ecris("D1-1").dessins.map(d => d.trouves), [[], [-1], [0, -1]]);
  assert.deepEqual(ecris("D1-3").dessins.map(d => d.trouves), [[], [-1, -2, -3], [0, -1, -2, -3]]);
  // D4-2 (lot 3b : on ajoute un décimal, comme la leçon), 1,624 + 0,005 :
  // « 0,004 + 0,005 = 0,009 » les millièmes, puis tout.
  const d4 = ecris("D4-2").dessins;
  assert.deepEqual(d4.map(d => d.trouves), [[], [-3], [0, -1, -2, -3]]);
  assert.deepEqual(d4[0].garder.sort(), [-1, -2, 0], "les chiffres qui ne changent pas, en gris dès le début");
  // M2-2 (lot 3a : J'écris 3 500 ÷ 100, comme la leçon sur ÷ 10) : les
  // chiffres glissent vers la droite, « ? » puis le résultat.
  const m2 = ecris("M2-2").dessins.map(AIDES.dessinerImage);
  assert.match(m2[0], /÷ 100/);
  assert.match(m2[0], />\?</);
  assert.doesNotMatch(m2[1], />\?</);
});

test("J'écris des modules lot 2 (A3, A4, A6, A7, A8) : les morceaux attendus", () => {
  const dessins = cle => CORE.niveauDe(cle).niveau.apprends.ecris.dessins;
  const vus = d => d.sauts.map(s => (s.cache ? "·" : s.masque ? "?" : s.val));
  // A3-2, 768 + 50 (lot 3a : une addition) : + 40 (808), puis + 10 (818), puis + 50 dessous.
  assert.deepEqual(dessins("A3-2").map(vus), [["·", "·"], [40, "·"], [40, 10], [40, 10]]);
  assert.deepEqual(dessins("A3-2").map(d => Boolean(d.directCache)), [true, true, true, false]);
  // A3-1, 234 + 60 : « 3 + 6 = 9 » dessine le saut, « 234 + 60 = 294 » son point.
  assert.deepEqual(dessins("A3-1").map(d => [vus(d), d.inconnues]), [[["·"], [1]], [[60], [1]], [[60], []]]);
  // A4-2, 58 + 34 : « 58 + 30 = 88 », puis « 88 + 4 = 92 » fait les deux
  // petits sauts (+ 2 jusqu'à 90, + 2) d'un coup, puis + 34 dessous.
  assert.deepEqual(dessins("A4-2").map(vus), [["·", "·", "·"], [30, "·", "·"], [30, 2, 2], [30, 2, 2]]);
  assert.deepEqual(dessins("A4-2").map(d => d.inconnues), [[1, 2, 3], [2, 3], [], []]);
  // A7-3, 615 − 38 : − 30, puis − 5 et − 3 (par 580).
  assert.deepEqual(dessins("A7-3").map(vus), [["·", "·", "·"], [-30, "·", "·"], [-30, -5, -3], [-30, -5, -3]]);
  // A6-1, 142 − 9 : − 10 (132), puis + 1 (133), puis − 9 dessous.
  assert.deepEqual(dessins("A6-1").map(vus), [["·", "·"], [-10, "·"], [-10, 1], [-10, 1]]);
  assert.equal(dessins("A6-1")[3].direct, -9);
  // A8-1, 81 − 76 : les points sont là ; « 76 + □ = 80 » écrit + 4,
  // « 80 + □ = 81 » + 1, puis 81 − 76 = 5 : le saut direct + 5 dessous.
  assert.deepEqual(dessins("A8-1").map(vus), [["?", "?"], [4, "?"], [4, 1], [4, 1]]);
  assert.deepEqual(dessins("A8-1").map(d => Boolean(d.directCache)), [true, true, true, false]);
  // A2-5 (lot « couverture »), 748 + □ = 1 200 : les points sont là, chaque
  // étape écrit son saut (+ 2, + 50, + 400), la dernière le saut direct.
  assert.deepEqual(dessins("A2-5").map(vus), [["?", "?", "?"], [2, "?", "?"], [2, 50, "?"], [2, 50, 400], [2, 50, 400]]);
  assert.deepEqual(dessins("A2-5").map(d => Boolean(d.directCache)), [true, true, true, true, false]);
});

test("la droite du boulier : un saut par geste, son point d'arrivée, rien avant", () => {
  const gestes = [3, 10, 10, 10, 10, 10, 10];
  const droite = faits => AIDES.droiteSauts({
    depart: 37, boulier: true,
    sauts: gestes.map((val, i) => (i < faits ? {val} : {val, cache: true})),
    caches: gestes.map((_, i) => i + 1).filter(i => i > faits),
    acquis: faits ? [faits] : []
  });
  const avant = droite(0);
  assert.equal((avant.match(/marker-end/g) || []).length, 0, "aucun saut avant le premier geste");
  assert.deepEqual([...nombresDu(avant)], [37], "seul le départ est écrit");
  const un = droite(1);
  assert.equal((un.match(/marker-end/g) || []).length, 1);
  assert.deepEqual([...nombresDu(un)].sort((a, b) => a - b), [3, 37, 40]);
  const tout = droite(7);
  assert.equal((tout.match(/marker-end/g) || []).length, 7);
  assert.ok(nombresDu(tout).has(100));
  assert.equal(viewBox(avant), viewBox(tout), "la droite garde sa taille");
  // Les places sont celles de tous les gestes : le 40 ne bouge pas.
  const x40 = svg => svg.match(/<rect x="([\d.]+)"[^>]*\/><text[^>]*>40</)[1];
  assert.equal(x40(un), x40(tout));
  // La droite ordinaire (Je représente, l'entraînement) ne change pas.
  assert.equal(AIDES.droiteSauts({depart: 37, sauts: [{val: 3}, {val: 60}]}).match(/viewBox="([^"]+)"/)[1], "0 0 560 158");
});

test("la droite du boulier, modules lot 2 : le petit saut d'un détour (A6 : − 10 puis + 1) a son étiquette au-dessus de son arc, sans chevaucher", () => {
  // Les pilules des étiquettes de sauts : [gauche, haut, droite, bas] et le texte.
  const pilules = svg => [...svg.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="[\d.]+" fill="#(?:fff3e0|eaf2ff)"[^>]*\/><text[^>]*>([^<]*)<\/text>/g)]
    .map(([, x, y, w, h, texte]) => ({texte: texte.replace(/[\u00a0\u202f]/g, " "), g: +x, h: +y, d: +x + +w, b: +y + +h}));
  const touche = (a, b) => a.g < b.d && b.g < a.d && a.h < b.b && b.h < a.b;
  for (const [depart, gestes] of [[63, [-10, 1]], [72, [-10, -10, -10, 1]], [73, [-10, -10, 2]], [41, [-10, 1]]]) {
    const svg = AIDES.droiteSauts({depart, boulier: true, sauts: gestes.map(val => ({val})), acquis: [gestes.length]});
    const liste = pilules(svg);
    assert.equal(liste.length, gestes.length, `${depart} : une étiquette par geste`);
    const petit = liste[liste.length - 1];
    assert.match(petit.texte, /^\+ \d$/);
    liste.slice(0, -1).forEach(autre => assert.ok(!touche(petit, autre), `${depart} : « ${petit.texte} » chevauche « ${autre.texte} »`));
    const [, , largeur] = svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
    assert.ok(petit.h >= 0 && petit.g >= 0 && petit.d <= largeur, `${depart} : « ${petit.texte} » sort du dessin`);
    // Son arc est court : l'étiquette posée dessus le cacherait. Elle est
    // au-dessus du sommet de l'arc (la courbe va de y0 à y0, contrôle yc :
    // sommet (y0 + yc) / 2).
    const arcs = [...svg.matchAll(/<path d="M[-\d.]+ ([-\d.]+) Q[-\d.]+ ([-\d.]+) /g)].map(([, y0, yc]) => (+y0 + +yc) / 2);
    assert.equal(arcs.length, gestes.length);
    assert.ok(petit.b <= arcs[arcs.length - 1], `${depart} : « ${petit.texte} » cache son arc`);
  }
});

test("J'apprends : le boulier de « Je manipule » a sa droite, celui de l'entraînement non", async () => {
  const {readFile} = await import("node:fs/promises");
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  const manipule = page.slice(page.indexOf("if (nom === \"manipule\") {"), page.indexOf("} else if (nom === \"represente\") {"));
  assert.match(manipule, /droite: !glisse/, "Je manipule : le boulier reporte ses gestes sur une droite");
  assert.equal((page.match(/droite: !glisse/g) || []).length, 1, "seulement dans Je manipule");
  // J'écris montre son dessin, et le remplit à chaque étape juste.
  assert.match(page, /montrerImage\(dessinEcris\(0\), apprends\.ecris\.consigne \|\| ""\)/);
  assert.match(page, /renderEtapes\(\);\n\s*majDessinEcris\(serie\.etape\);/);
});
