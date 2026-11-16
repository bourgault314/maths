// Défi calcul, relecture 2 (08/11/2026) : le lot « modules » (lot 2a),
// décisions de Gwenaël sur les planches des séries 1 à 3, et les fautes
// évidentes vues en rejouant tous les modules :
//  - A1-1 : une seule notion (les compléments à 10) ; Je représente et
//    J'écris sur le schéma en barres ; « À retenir » : les cinq paires, en
//    rangées du boulier (5 rouges, 5 blanches) coupées, leur calcul à côté ;
//  - M1 : « Je représente » se fait aussi par étapes (le double comme la
//    moitié), dans les trois niveaux ;
//  - A11-2 : J'écris garde la méthode de la leçon (532 − 7) ;
//  - A2 : chaque « À retenir » écrit son calcul ; A2-2 liste les paires de
//    dizaines (plus de « 40 et 60, 30 et 70… ») ;
//  - les titres des niveaux en mots d'élève ;
//  - « 2 jours cette semaine » sur l'accueil et à la fin de la séance ;
//  - « Je recopie cela dans mon cahier. » ;
//  - au téléphone : « À retenir » sans vide sous ses boutons, la phrase
//    rapetisse avant le dessin ; les dessins prennent la place que le pavé
//    leur laisse ; la bande « Mode professeur » sur deux lignes propres ;
//  - sur ordinateur : un écran qui ne tient pas descend jusqu'à ×0,7 (le
//    bouton « Valider » n'est plus coupé, A2-5).
// L'ordre de l'entraînement (chaque écriture dans les 7 premiers calculs) est
// gardé par tests/defi-calcul-core.test.mjs. Ce qui se voit (mesures sur les
// 95 niveaux) : tests/defi-calcul-relecture-2-ecrans.cjs.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const PAGE = await lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = await lire("../outils/calcul_mental/defi_calcul.css");
const espaces = texte => String(texte).replace(/[  ]/g, " ");
const textesSvg = svg => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
const apprends = cle => CORE.niveauDe(cle).niveau.apprends;
const NIVEAUX = CORE.MODULES.filter(fiche => fiche.construit)
  .flatMap(fiche => fiche.niveaux.map(niveau => ({fiche, niveau, cle: `${fiche.id}-${niveau.n}`})));

test("A1-1 : les compléments à 10, en barres ; l'aide de l'entraînement aussi", () => {
  const a = apprends("A1-1");
  assert.deepEqual(a.textes.map(espaces), ["3 + □ = 10", "4 + □ = 10", "10 = 8 + □"], "trois compléments, plus de somme");
  assert.equal(a.represente.outil, "deux-barres");
  assert.deepEqual(textesSvg(AIDES.dessinerImage(a.represente.image)), ["10", "4", "?"]);
  assert.deepEqual(textesSvg(AIDES.dessinerImage(a.represente.solution.image)), ["10", "4", "6"]);
  // J'écris : un dessin par étape ; la case se remplit dès la 1re égalité.
  assert.equal(a.ecris.dessins.length, a.ecris.etapes.length + 1);
  assert.ok(textesSvg(AIDES.dessinerImage(a.ecris.dessins[0])).includes("?"));
  assert.ok(textesSvg(AIDES.dessinerImage(a.ecris.dessins[1])).includes("2"));
  // L'entraînement : les compléments en barres, les sommes sur la droite.
  const serie = CORE.genererSerie("A1-1", {graine: 2, total: 20});
  serie.forEach(c => {
    const trou = c.forme !== "somme";
    assert.equal(CORE.aideDe(c).outil, trou ? "deux-barres" : "droite-sauts", c.texte);
    assert.equal(CORE.imageDe(c).outil, trou ? "deux-barres" : "droite-sauts", c.texte);
  });
  // A1-2 et A1-3 gardent la droite (passer par 10).
  CORE.genererSerie("A1-3", {graine: 2, total: 20}).forEach(c => assert.equal(CORE.aideDe(c).outil, "droite-sauts", c.texte));
});

test("A1-1, « À retenir » : les cinq paires en rangées du boulier, sans virgules", () => {
  const a = apprends("A1-1");
  // Lot 3a : avec le calcul montré (3 + ? = 10).
  assert.equal(espaces(a.bilan), "Pour faire 10, je connais ces paires par cœur : 3 + 7 = 10.");
  assert.deepEqual(a.image, {outil: "paires", total: 10, perles: true, paires: [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]});
  const svg = AIDES.dessinerImage(a.image);
  assert.deepEqual(textesSvg(svg), ["1 + 9 = 10", "2 + 8 = 10", "3 + 7 = 10", "4 + 6 = 10", "5 + 5 = 10"]);
  // Les couleurs du boulier (choix de Gwenaël) : 5 rouges puis 5 blanches
  // sur chaque rangée, quelle que soit la coupure.
  const perles = [...svg.matchAll(/<circle [^>]*fill="([^"]+)"/g)].map(m => m[1]);
  assert.equal(perles.length, 50);
  for (let r = 0; r < 5; r += 1) {
    const rangee = perles.slice(r * 10, r * 10 + 10);
    assert.deepEqual(rangee.map(c => c === "#d64545"), [true, true, true, true, true, false, false, false, false, false], `rangée ${r + 1}`);
  }
  // Une coupure par rangée.
  assert.equal([...svg.matchAll(/<line /g)].length, 5);
});

test("M1 : « Je représente » par étapes dans les trois niveaux (le double comme la moitié)", () => {
  const attendus = {
    "M1-1": ["double de 17 = 17 + 17", ["10 + 10", "7 + 7", "double de 17"], 34],
    // (Lot 3a, décision 5 : la leçon sur le double, double de 75.)
    "M1-2": ["double de 75 = 2 × 75", ["2 × 70", "2 × 5", "double de 75"], 150],
    "M1-3": ["double de 470 = 2 × 470", ["2 × 400", "2 × 70", "double de 470"], 940]
  };
  Object.entries(attendus).forEach(([cle, [consigne, etapes, reponse]]) => {
    const r = apprends(cle).represente;
    assert.equal(espaces(r.consigne), consigne, cle);
    assert.deepEqual(r.etapes.map(e => espaces(e.texte).replace(" = □", "")), etapes, cle);
    assert.equal(r.etapes[r.etapes.length - 1].reponse, reponse, cle);
    assert.equal(r.reponse, reponse, cle);
    // Un dessin par étape : chaque morceau, puis l'accolade.
    assert.equal(r.dessins.length, r.etapes.length + 1, cle);
    assert.ok(r.dessins[0].masque && r.dessins[0].trouves.length === 0, cle);
    assert.ok(r.dessins[r.etapes.length].fini, cle);
  });
  // La page joue ce temps avec le moteur de J'écris.
  assert.match(PAGE, /apprends\.represente\.etapes \? "represente-ecrit" : "represente"/);
  assert.match(PAGE, /const aEtapes = nom => nom === "ecris" \|\| nom === "represente-ecrit";/);
  assert.match(PAGE, /serie\.apprends = nom === "represente-ecrit" \? Object\.assign\(\{\}, serie\.base, \{ecris: serie\.base\.represente\}\) : serie\.base;/);
  assert.match(PAGE, /const ecris = aEtapes\(nom\);/);
  // Les autres modules n'ont pas d'étapes dans Je représente — sauf, depuis
  // le lot 7-0 (« le dessin à étapes », choix de Gwenaël), la droite à
  // plusieurs sauts quand « On te montre » est le dessin : où j'arrive après
  // le premier saut, puis le résultat.
  // (Lot 7b : D8, les doubles et moitiés de décimaux, comme M1 — testé ci-dessous.)
  NIVEAUX.filter(({fiche}) => fiche.id !== "M1" && fiche.id !== "D8").forEach(({niveau, cle}) => {
    const r = niveau.apprends.represente;
    const sauts = r.image && r.image.outil === "droite-sauts" ? r.image.sauts.length : 0;
    if (sauts >= 2 && !niveau.apprends.manipule) assert.equal(r.etapes.length, 2, cle);
    else assert.equal(r.etapes, undefined, cle);
  });
});

test("lot 7b : D8, « Je représente » par étapes comme M1 — les deux morceaux, puis le tout", () => {
  const attendus = {
    "D8-1": ["moitié de 9 = 8 ÷ 2 + 1 ÷ 2", ["8 ÷ 2", "1 ÷ 2", "moitié de 9"], 4.5],
    "D8-2": ["double de 13,6 = 2 × 13 + 2 × 0,6", ["2 × 13", "2 × 0,6", "double de 13,6"], 27.2],
    "D8-3": ["2 × 4,35 = 2 × 4 + 2 × 0,35", ["2 × 4", "2 × 0,35", "2 × 4,35"], 8.7]
  };
  Object.entries(attendus).forEach(([cle, [consigne, etapes, reponse]]) => {
    const r = apprends(cle).represente;
    assert.equal(espaces(r.consigne), consigne, cle);
    assert.deepEqual(r.etapes.map(e => espaces(e.texte).replace(" = □", "")), etapes, cle);
    assert.equal(r.reponse, reponse, cle);
    assert.equal(r.dessins.length, r.etapes.length + 1, cle);
    assert.ok(r.dessins[0].masque && r.dessins[0].trouves.length === 0 && r.dessins[r.etapes.length].fini, cle);
  });
});

test("A11-2 : J'écris garde la méthode de la leçon", () => {
  const e = apprends("A11-2").ecris;
  assert.equal(espaces(e.consigne), "532 − 7 = 532 − 2 − 5");
  assert.deepEqual(e.etapes.map(x => [espaces(x.texte), x.reponse]), [["532 − 2 = □", 530], ["530 − 5 = □", 525], ["532 − 7 = □", 525]]);
  assert.ok(!apprends("A11-2").textes.some(t => espaces(t).startsWith("50 − 6")), "50 − 6 reste dans l'entraînement");
  assert.ok(CORE.genererSerie("A11-2", {graine: 1, total: 20}).length > 0);
});

test("A2 : chaque « À retenir » écrit son calcul ; A2-2, les paires de dizaines", () => {
  // Lot 3a : le calcul montré (67 + ? = 70, 37 + ? = 100…).
  const calculs = {"A2-1": "67 + 3 = 70", "A2-2": "40 + 60 = 100", "A2-3": "37 + 63 = 37 + 3 + 60 = 100", "A2-4": "650 + 350 = 650 + 50 + 300 = 1 000", "A2-5": "368 + 632 = 368 + 2 + 30 + 600 = 1 000"};
  Object.entries(calculs).forEach(([cle, calcul]) => {
    const deux = AIDES.bilanEnDeux(apprends(cle).bilan);
    assert.ok(deux, cle);
    assert.equal(espaces(deux.calcul), calcul, cle);
  });
  const a = apprends("A2-2");
  // (Lot 7e-2 : les dizaines qui font 100 se retrouvent avec ce qui fait 10.)
  assert.equal(espaces(a.bilan), "Les dizaines qui font 100, je les retrouve avec ce qui fait 10 : 40 + 60 = 100.");
  // (Lot 7e-2 : une procédure ; le dessin, la seule paire montrée, en perles de 10.)
  assert.deepEqual(textesSvg(AIDES.dessinerImage(a.image)), ["40 + 60 = 100"]);
  assert.ok(!/\d et \d/.test(a.bilan));
  // « jusqu'au bout » : vague, remplacé par le nombre visé.
  NIVEAUX.forEach(({niveau, cle}) => {
    const ap = niveau.apprends;
    [ap.bilan, ap.represente.consigne].forEach(t => assert.ok(!String(t || "").includes("jusqu’au bout"), cle));
  });
  assert.equal(espaces(apprends("A2-5").represente.consigne), "Je vais à la dizaine, puis à la centaine, puis jusqu’à 1 000.");
});

test("les titres des niveaux se lisent : chacun a au moins un mot", () => {
  NIVEAUX.forEach(({niveau, cle}) => assert.match(niveau.titre, /[a-zà-ÿ]{2,}/i, `${cle} : « ${niveau.titre} »`));
  assert.equal(CORE.niveauDe("A5-1").niveau.titre, "ajouter 9");
  assert.equal(CORE.niveauDe("A6-4").niveau.titre, "retirer 48, 49… 98, 99");
  assert.equal(CORE.niveauDe("M1-3").niveau.titre, "n’importe quel nombre (46, 136, 470…)");
  // Plus de « trou » dans un titre : « nombre manquant ».
  NIVEAUX.forEach(({niveau, cle}) => assert.doesNotMatch(niveau.titre, /\btrous?\b/, cle));
});

test("« 2 jours cette semaine » sur l'accueil et à la fin de la séance ; « Je recopie cela »", () => {
  assert.match(PAGE, /return soirs \? `\$\{soirs\}\\u00a0jour\$\{soirs > 1 \? "s" : ""\} cette semaine` : "";/);
  assert.match(PAGE, /function texteSemaine\(\) \{\s*return texteSoirs\(semaine\(\)\.soirs\);\s*\}/);
  assert.doesNotMatch(PAGE, /fois cette semaine` : ""/);
  assert.doesNotMatch(PAGE, /soir\$\{/);
  // Lot 2 : la ligne a un nom (un niveau « par cœur » dit autre chose).
  assert.match(PAGE, /<p id="retenir-cahier" class="cahier">Je recopie cela dans mon cahier\.<\/p>/);
  assert.doesNotMatch(PAGE, /Je recopie cette phrase/);
});

test("téléphone : « À retenir » sans vide sous ses boutons, la phrase rapetisse d'abord", () => {
  assert.match(PAGE, /racine\.classList\.toggle\("retenir-ouvert", ouvert\);/);
  const corps = PAGE.slice(PAGE.indexOf("function ajusterRetenir()"), PAGE.indexOf("function ajusterCalculRetenir()"));
  const p = corps.indexOf('setProperty("--retenir-p"');
  const z = corps.indexOf('setProperty("--retenir-z"');
  assert.ok(p > 0 && z > p, "la phrase avant le dessin");
  // Lot 2 : avec une carte « par cœur », la phrase descend jusqu'à 75 %.
  assert.match(corps, /const plancherPhrase = \$\("retenir-image"\)\.classList\.contains\("dc-coeur-zone"\) \? \.75 : \.8;/);
  assert.match(corps, /for \(let p = \.95; p >= plancherPhrase - 1e-9 && deborde\(\); p -= \.05\)/);
  assert.match(CSS, /html\.retenir-ouvert \.shell \{ padding-bottom: max\(8px, env\(safe-area-inset-bottom\)\); \}/);
  assert.match(CSS, /html\.retenir-ouvert \.shell > \.panel \{ padding-bottom: 12px; \}/);
  assert.match(CSS, /html\.retenir-ouvert #result \{ margin-bottom: 0; \}/);
  assert.match(CSS, /font-size: calc\(var\(--retenir-p, 1\) \* var\(--retenir-z, 1\) \* clamp\(1\.5rem, 5\.4vw, 2\.1rem\)\);/);
});

test("téléphone : le dessin prend la place que le pavé laisse ; le vide va au-dessus du pavé", () => {
  const bloc = CSS.slice(CSS.indexOf("/* Relecture 2 (08/11/2026) : au téléphone, le dessin de Je représente"));
  assert.ok(bloc.length > 100);
  assert.match(bloc, /\.challenge-playing \.question\.aide-image > \.dc-aide \{ flex: 0 1 auto; margin-top: 0; \}/);
  assert.match(bloc, /svg\.dc-tableau \{ flex: 0 1 auto; width: 100%; max-height: none; min-height: 0; \}/);
  assert.match(bloc, /\.challenge-playing \.question\.aide-image:not\(\.ecrit-fini\) > \.keypad \{ margin-top: auto; \}/);
  assert.match(bloc, /> \.dc-touches:not\(\[hidden\]\) \+ \.keypad \{ margin-top: 0; \}/);
});

test("ordinateur : un écran qui ne tient pas descend jusqu'à ×0,7 plutôt que de couper un bouton", () => {
  assert.match(PAGE, /imageTelephone: 56, secours: 0\.7\}\);/);
  assert.match(PAGE, /if \(!telephone && z === bornes\.min && bornes\.max > bornes\.min && !tient\(z\)\) \{\s*for \(let k = z - \.02; k >= ECHELLE\.secours - 1e-9; k -= \.02\) \{\s*z = k;\s*if \(tient\(z\)\) break;/);
});

test("la bande « Mode professeur » : au téléphone, « Mode professeur · Quitter », puis la phrase seule", () => {
  assert.match(PAGE, /<p id="prof-pilule" class="prof-pilule" hidden><b>Mode professeur<\/b><span class="pp-point" aria-hidden="true">·<\/span><span class="pp-texte">tous les menus, rien n’est enregistré<\/span><span class="pp-point" aria-hidden="true">·<\/span><button id="prof-quitter" type="button">Quitter<\/button><\/p>/);
  const bloc = CSS.slice(CSS.indexOf("@media (max-width: 520px) {\n  .prof-pilule"));
  assert.match(bloc, /\.prof-pilule:not\(\.est-refus\) \.pp-point:first-of-type \{ display: none; \}/);
  assert.match(bloc, /\.prof-pilule:not\(\.est-refus\) \.pp-texte \{ order: 3; flex-basis: 100%;/);
});

test("les adresses des fichiers changés (cache) ; la copie du moteur pour la page prof", async () => {
  assert.match(PAGE, /defi_calcul\.css\?v=20261115-3/);
  // (Lot 3c « J'écris sur des calculs qui changent » : le cœur et les aides, 20261113-5.)
  assert.match(PAGE, /defi_calcul_core\.js\?v=20261116-1/);
  assert.match(PAGE, /defi_calcul_aides\.js\?v=20261116-1/);
  const copie = await lire("../_serveur/public/prof/defi_calcul_core.js");
  assert.equal(copie, await lire("../outils/calcul_mental/defi_calcul_core.js"), "copie octet pour octet");
});
