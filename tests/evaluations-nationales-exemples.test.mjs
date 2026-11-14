// Lot EN8a — « exemples de questions et de tâches » Eduscol : 3e Nombres et calculs, 4e Géométrie (fiches à l'identique),
// réponses tapées sur le pavé de l'appli, réponses sur la feuille. Les bonnes réponses sont recalculées ici depuis les
// énoncés et les données des figures.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/saisie.js");
require("../outils/evaluations_nationales/exemples_commun.js");
require("../outils/evaluations_nationales/sujets/3e_exemples_nombres.js");
require("../outils/evaluations_nationales/sujets/4e_exemples_geometrie.js");
const { hasard, construire, typo } = globalThis.EN;
const SA = globalThis.ENSaisie;
const N3 = globalThis.EN_SUJETS["3e-exemples-nombres"], G4 = globalThis.EN_SUJETS["4e-exemples-geometrie"];
const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
const saisieJs = readFileSync(new URL("../outils/evaluations_nationales/saisie.js", import.meta.url), "utf8");

const texte = (h) => h.replace(/<span class="mot-ordi">[^<]*<\/span>/g, "").replace(/<sup>(\d+)<\/sup>/g, "^$1")
  .replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2").replace(/<svg[\s\S]*?<\/svg>/g, "[figure]")
  .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const passage = (S, k = 0) => construire(S, hasard(1), S.officiels[k], null);
const items = (S) => S.officiels.flatMap((o, k) => passage(S, k));
const juste = (it) => texte(it.choix.find((c) => c.juste).html);
const attendus = (it) => SA.cases(it.g.saisie).map((c) => c.attendu);

test("les deux tests : structure, sans jumeau, sans repères, sans calculatrice", () => {
  assert.equal(N3.questions.length, 10);
  assert.equal(G4.questions.length, 7);
  for (const S of [N3, G4]) {
    assert.equal(S.jumeaux, false);
    assert.equal(S.seuils, null);
    assert.ok(!S.calculatrice);
    assert.match(S.source, /Etalab 2\.0/);
    assert.equal(S.lienSource, "https://eduscol.education.gouv.fr/6858/accompagner-les-eleves-en-mathematiques-4e-3e-et-2de");
    for (const it of items(S)) assert.equal(it.g.melange, false, `${S.id} q${it.q.num} : réponses jamais mélangées`);
  }
  // L'exercice 7 de 4e : une carte par version, une version par carte.
  assert.deepEqual(G4.officiels.map((o) => o.cle), ["7a", "7b", "7c"]);
  const sept = G4.officiels.map((o, k) => passage(G4, k)[6]);
  assert.deepEqual(sept.map((it) => texte(it.g.enonce)), [
    "La figure codée comprend quatre segments de même longueur, et les points A, B, C sont alignés.",
    "Allan a posé une étagère sur un mur vertical. On sait que RS = 42 cm, TR = 40 cm et ST = 58 cm. L’étagère est-elle horizontale ?",
    "Déterminer la longueur OS.",
  ]);
  for (const k of [0, 1, 2]) assert.deepEqual(passage(G4, k).slice(0, 6).map((it) => it.q.num), [1, 2, 3, 4, 5, 6]);
});

test("3e : les réponses dans l'ordre de la fiche élève et la bonne réponse de la fiche professeur", () => {
  const CHOIX = {
    1: ["3/8", "1/5", "7/15", "3/2"], 2: ["10^15", "100^8", "100^15", "10^8"], 3: ["20", "100", "120", "220"],
    4: ["6 °C", "10 °C", "14 °C", "16 °C"], 5: ["3 L", "6 L", "3,75 L", "5 L"], 8: ["542 mm", "54,2 mm", "90 mm", "900 mm"],
  };
  const JUSTE = { 1: "7/15", 2: "10^8", 3: "100", 4: "14 °C", 5: "3,75 L", 8: "542 mm" };
  for (const it of passage(N3)) {
    if (!CHOIX[it.q.num]) continue;
    assert.deepEqual(it.choix.map((c) => texte(c.html)), CHOIX[it.q.num], `q${it.q.num}`);
    assert.equal(juste(it), JUSTE[it.q.num], `q${it.q.num}`);
  }
  const p = passage(N3);
  assert.deepEqual([6, 7, 10].map((n) => attendus(p[n - 1])[0]), [420, 30, -20]);
  assert.ok(p[8].g.feuille && p[8].q.attendu, "Q9 sur la feuille, avec la réponse attendue pour le professeur");
  assert.ok(p[9].g.preuve && p[9].q.indicateurs.length >= 3, "Q10 : réponse ici, argumentation sur la feuille");
});

test("3e : chaque bonne réponse recalculée depuis l'énoncé", () => {
  const p = passage(N3);
  const nb = (s) => Number(String(s).replace(/\s/g, "").replace(",", ".").replace("−", "-"));
  // Q1 : 4/5 − 1/3 = 12/15 − 5/15 = 7/15.
  assert.equal(4 * 3 - 1 * 5, 7); assert.equal(5 * 3, 15);
  // Q2 : 10^5 × 10^3 = 10^8.
  assert.equal(10 ** 5 * 10 ** 3, 10 ** 8);
  // Q3 : 240 en 2018 est le double de 2009 ; 20 de plus qu'en 1999.
  assert.equal(nb(juste(p[2])), 240 / 2 - 20);
  // Q4 : de −4 °C à 10 °C.
  assert.equal(nb(juste(p[3]).replace(" °C", "")), 10 - -4);
  // Q5 : ratio 3 : 2 : 3, 10 L.
  assert.equal(nb(juste(p[4]).replace(" L", "")), (10 * 3) / (3 + 2 + 3));
  // Q6 : entre 400 et 450, multiple de 3, de 5 et de 7 : une seule solution.
  const sol = []; for (let n = 400; n <= 450; n++) if (n % 3 === 0 && n % 5 === 0 && n % 7 === 0) sol.push(n);
  assert.deepEqual(sol, attendus(p[5]));
  // Q7 : chien = 9 chats, souris = chat ÷ 20, navet = 6 souris.
  assert.equal(attendus(p[6])[0], Math.round(9 / (6 / 20)));
  // Q8 : (T + B) ÷ 2,4 en cm, au millimètre près ; les pièges : sans conversion, avec la jambe en cm, puis en mm.
  const { J, T, B, diviseur } = N3.donnees.VELO;
  assert.equal(nb(juste(p[7]).replace(" mm", "")), Math.round(((T + B) / diviseur) * 10));
  assert.equal(nb(texte(p[7].choix[1].html).replace(" mm", "")), Math.round(((T + B) / diviseur) * 10) / 10);
  assert.equal(nb(texte(p[7].choix[2].html).replace(" mm", "")), (J + T + B) / diviseur);
  assert.equal(nb(texte(p[7].choix[3].html).replace(" mm", "")), ((J + T + B) / diviseur) * 10);
  // Q10 : le programme, exécuté sur −7.
  const { ajout, facteur } = N3.donnees.PROGRAMME;
  assert.equal(attendus(p[9])[0], (-7 + ajout) * facteur);
  assert.match(p[9].g.figure, /Nombre de départ/);
});

test("4e : les réponses dans l'ordre de la fiche élève et la bonne réponse de la fiche professeur", () => {
  const p = passage(G4);
  assert.deepEqual(p[1].choix.map((c) => texte(c.html)), ["2,3 cm", "3,6 cm", "4,2 cm", "6 cm"]);
  assert.equal(juste(p[1]), "4,2 cm");
  assert.deepEqual(p[2].choix.map((c) => texte(c.html)), ["un losange", "un rectangle", "un parallélogramme", "un carré"]);
  assert.equal(juste(p[2]), "un parallélogramme");
  assert.deepEqual(p[3].choix.map((c) => texte(c.html)), ["un losange", "un rectangle", "un carré", "un triangle rectangle", "un segment"]);
  assert.equal(juste(p[3]), "un carré");
  assert.equal(p[0].choix.findIndex((c) => c.juste), 2, "Q1 : le troisième solide");
  assert.equal(juste(passage(G4, 0)[6]), "Vrai");
  assert.equal(juste(passage(G4, 1)[6]), "Oui");
});

test("4e : chaque bonne réponse recalculée depuis les figures", () => {
  const d = G4.donnees, p = passage(G4);
  // Q1 : les vues de chaque solide, comparées aux vues dessinées (celles du solide 3).
  const { vues } = globalThis.ENX;
  const V = d.VUES, cle = (s) => [...s].sort().join(" ");
  const v = d.SOLIDES.map(vues);
  assert.deepEqual(cle(V.gauche), "0,0 0,1 1,0"); // deux en bas, un au-dessus à gauche (le fond)
  assert.deepEqual(cle(V.face), "0,0 1,0 1,1 2,0");
  assert.deepEqual(cle(V.dessus), "0,0 0,1 1,0 1,1 2,0 2,1");
  assert.ok(v[2].face.size && cle(v[2].face) === cle(V.face) && cle(v[2].gauche) === cle(V.gauche) && cle(v[2].dessus) === cle(V.dessus), "solide 3 : les trois vues");
  assert.ok(cle(v[0].face) === cle(V.face) && cle(v[0].gauche) === cle(V.gauche) && cle(v[0].dessus) !== cle(V.dessus), "solide 1 : seule la vue de dessus change");
  assert.ok(cle(v[1].face) === cle(V.face) && cle(v[1].dessus) === cle(V.dessus) && cle(v[1].gauche) !== cle(V.gauche), "solide 2 : seule la vue de gauche change");
  // Q2 : EFCD aux mesures de la fiche ; ABGH est son image ; AB est l'image de FC.
  const L = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const { E, F, C, D, A, B, G, H } = d.QUAD;
  for (const [x, y] of [[L(E, F), 6], [L(E, D), 3.6], [L(D, C), 2.3], [L(F, C), 4.2]]) assert.ok(Math.abs(x - y) < 1e-9);
  for (const [x, y] of [[L(A, B), L(C, F)], [L(B, G), L(F, E)], [L(G, H), L(E, D)], [L(H, A), L(D, C)]]) assert.ok(Math.abs(x - y) < 1e-9);
  assert.equal(String(Math.round(L(A, B) * 10) / 10).replace(".", ",") + " cm", juste(p[1]));
  // Q4 : le lutin, pas à pas : il revient à son point de départ après 4 côtés égaux et 4 angles droits.
  const { repetitions, angle, pas } = d.LUTIN;
  let x = 0, y = 0, dir = 0; const pts = [[0, 0]];
  for (let i = 0; i < repetitions; i++) { dir += angle; x += pas * Math.cos((dir * Math.PI) / 180); y += pas * Math.sin((dir * Math.PI) / 180); pts.push([x, y]); }
  assert.ok(Math.hypot(x, y) < 1e-9 && angle === 90 && repetitions === 4);
  // Q5 : C, le symétrique de A par l'axe des abscisses, celui de B par l'origine.
  assert.deepEqual(attendus(p[4]), [d.POINTS.C[0], d.POINTS.C[1], d.POINTS.A[0], -d.POINTS.A[1], -d.POINTS.B[0], -d.POINTS.B[1]]);
  assert.deepEqual(attendus(p[4]), [1, -4, -4, -3, -5, 2]);
  // Q6 : l'angle plat moins deux fois 30°.
  assert.deepEqual(attendus(p[5]), [180 - 2 * d.PLI.angle]);
  assert.equal(attendus(p[5])[0], 120);
  // Q7b : réciproque du théorème de Pythagore.
  const { RS, TR, ST } = d.ETAGERE;
  assert.equal(RS * RS + TR * TR, ST * ST);
  // Q7c : OS ÷ BC = AO ÷ AB.
  const { AB, BO, BC } = d.THALES;
  assert.deepEqual(attendus(passage(G4, 2)[6]), [(BC * (AB + BO)) / AB]);
  assert.equal(attendus(passage(G4, 2)[6])[0], 2.5);
});

test("pavé : écriture d'un nombre, correction, pièges reconnus", () => {
  const t = (...touches) => touches.reduce(SA.taper, "");
  assert.equal(t("4", "2", "0"), "420");
  assert.equal(t("2", "0", "−"), "−20"); // le moins change le signe, à tout moment
  assert.equal(t("−", "4"), "−4");
  assert.equal(t(",", "5"), "0,5");
  assert.equal(t("2", ",", ",", "5"), "2,5"); // une seule virgule
  assert.equal(t("0", "0", "7"), "7"); // pas de zéro inutile devant
  assert.equal(t("1", "2", "←"), "1");
  assert.equal(t(..."1234567890".split("")), "123456789"); // 9 signes au plus
  assert.equal(SA.lireNombre("−4"), -4);
  assert.equal(SA.lireNombre("2,50"), 2.5);
  for (const x of ["", "−", "3,", ","]) assert.equal(SA.lireNombre(x), null, x);
  // Coordonnées (4e Q5) : 1 point si tout est juste ; abscisse et ordonnée échangées : piège de la fiche.
  const q5 = passage(G4)[4].g.saisie;
  assert.equal(SA.corriger(q5, ["1", "−4", "−4", "−3", "−5", "2"]).juste, true);
  const r = SA.corriger(q5, ["−4", "1", "4", "3", "−5", "2"]);
  assert.equal(r.juste, false);
  assert.equal(r.erreurs.length, 2);
  assert.match(r.erreurs[0], /Échange l’abscisse et l’ordonnée/);
  assert.match(r.erreurs[1], /axe des ordonnées/);
  assert.equal(r.html, "C(−4 ; 1) · A′(4 ; 3) · B′(−5 ; 2)");
  assert.equal(r.bonne, "C(1 ; −4) · A′(−4 ; −3) · B′(−5 ; 2)");
  // Une écriture égale est juste (2,50 m pour 2,5 m) ; une réponse sans piège connu n'en invente pas.
  const os = passage(G4, 2)[6].g.saisie;
  assert.equal(SA.corriger(os, ["2,50"]).juste, true);
  assert.deepEqual(SA.corriger(os, ["7"]).erreurs, []);
  assert.equal(SA.corriger(os, []).html, "OS = … m");
});

test("pièges : une explication par mauvaise réponse, sans mot genré ; ceux de maths&go marqués nonPublie", () => {
  const GENRE = /\b(il|elle|ils|elles|lui|lui-même|elle-même|venu|venue)\b(?! s’agit| faut| y a)/i;
  const phrases = [];
  for (const S of [N3, G4]) for (const it of items(S)) {
    for (const c of it.choix) {
      if (c.juste) { assert.equal(c.erreur, ""); continue; }
      phrases.push([`${S.id} q${it.q.num}`, c.erreur]);
    }
    if (it.g.saisie) for (const l of it.g.saisie.lignes) for (const pg of l.pieges || []) {
      assert.notDeepEqual(pg.valeurs, l.attendus, `${S.id} q${it.q.num} : un piège n'est jamais la bonne réponse`);
      phrases.push([`${S.id} q${it.q.num}`, pg.erreur]);
    }
    for (const x of it.t.indicateurs || it.q.indicateurs || []) phrases.push([`${S.id} q${it.q.num} indicateur`, x]);
  }
  for (const [ou, p] of phrases) {
    assert.ok(p.length > 12, ou);
    assert.match(p, /^[A-ZÀ-ÝÉ«(].*[.)]$/u, `${ou} : ${p}`);
    assert.doesNotMatch(p, GENRE, `${ou} : ${p}`);
    assert.doesNotMatch(p, /⚠/, `${ou} : le ⚠ est dans la notice, pas dans l'appli`);
  }
  // Les pièges non publiés par la fiche (liste de la notice du lot).
  const maison = [];
  for (const S of [N3, G4]) for (const it of items(S)) {
    for (const c of it.choix) if (c.nonPublie) maison.push(`${it.q.num}:${texte(c.html)}`);
    if (it.g.saisie) for (const l of it.g.saisie.lignes) for (const pg of l.pieges || []) if (pg.nonPublie) maison.push(`${it.q.num}:${pg.valeurs.join(";")}`);
  }
  assert.deepEqual([...new Set(maison)], ["6:105", "6:405", "6:435", "7:1080", "7:35", "10:-4", "10:20", "6:150", "6:60", "6:30", "7:Faux", "7:Non", "7:1.5"]);
});

test("typographie : unités jamais séparées de leur nombre, x rond", () => {
  const RESTE = /(\d) (km\/h|km²|m²|cm²|mm|cm|dm|km|m|mL|cL|dL|L|kg|g|min|h|%|€|°C)(?![\p{L}\d²³])/u;
  for (const S of [N3, G4]) for (const it of items(S)) {
    for (const morceau of [it.g.enonce, it.g.apres || "", ...it.choix.map((c) => c.html)]) {
      const sansFigure = typo(morceau).replace(/<svg[\s\S]*?<\/svg>/g, "");
      assert.doesNotMatch(sansFigure.replace(/<[^>]+>/g, ""), RESTE, `${S.id} q${it.q.num}`);
    }
  }
  assert.match(passage(G4)[5].g.enonce, /<i class="lettre">x<\/i>/);
});

test("la page : scripts, réponses tapées branchées, rien de dangereux", () => {
  for (const f of ["saisie.js", "exemples_commun.js", "sujets/3e_exemples_nombres.js", "sujets/4e_exemples_geometrie.js"])
    assert.match(html, new RegExp(`<script src="\\./${f.replace(".", "\\.")}\\?v=\\d+-\\d+"></script>`), f);
  assert.ok(html.indexOf("saisie.js") < html.indexOf('src="./evaluation.js'));
  assert.match(js, /window\.ENSaisie\.monter\(zone, it\.g\.saisie, typo/);
  assert.match(js, /window\.ENSaisie\.corriger\(it\.g\.saisie, saisieEnCours\.valeurs\(\)\)/);
  assert.match(js, /const resultats = tous\.filter\(\(x\) => !x\.it\.g\.feuille\)/);
  assert.match(html, /<div id="bloc-feuille" class="a-revoir" hidden>/);
  // Pas de champ du navigateur, pas d'eval : les cases sont des boutons, le pavé est celui de l'appli.
  assert.doesNotMatch(saisieJs, /<input|contenteditable|\beval\(|new Function/);
  // EN8a-bis : avec Entrée, le focus d'une case cliquée suit la case active (pas deux cases qui ont l'air choisies).
  assert.match(saisieJs, /boutons\[active\]\.focus\(\{ preventScroll: true \}\)/);
  // Les tests Automatismes et Problèmes ne changent pas : aucune de leurs questions n'a de saisie ni de feuille.
  require("../outils/evaluations_nationales/sujets/6e_automatismes.js");
  require("../outils/evaluations_nationales/sujets/4e_problemes.js");
  for (const id of ["6e-automatismes", "4e-problemes"]) for (const it of passage(globalThis.EN_SUJETS[id])) assert.ok(!it.g.saisie && !it.g.feuille && !it.g.preuve, id);
});
