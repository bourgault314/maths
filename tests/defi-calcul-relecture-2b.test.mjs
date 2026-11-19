// Défi calcul, relecture 2b (11/11/2026) : le lot « affichage et fautes
// évidentes » (remarques de Gwenaël et de Claude, n° 43 à 69). Rien de
// pédagogique :
//  - la case de la réponse a dès le début la largeur de la plus longue
//    réponse DU NIVEAU (remarque 56) ;
//  - la bulle « Bravo ! » / « Ta réponse… » n'entoure que son texte, la
//    place reste réservée ; « Suivant » sur toute la ligne (55) ;
//  - l'espace des milliers est une espace insécable qu'on voit (43) ;
//  - le « = » à la taille des fractions (62) ;
//  - le premier calcul d'une écriture nouvelle a son image ; au téléphone,
//    la bulle « Nouveau » est collée au calcul (48, 49) ;
//  - au tableau : le plein écran remplit l'écran à toute hauteur, le dessin
//    grandit dans la place libre (24, 51) ;
//  - les douzièmes se voient (63), le petit saut d'un détour a son
//    étiquette au-dessus de lui (45), la bande de la table sur deux lignes
//    au téléphone et le dessin de J'écris qui ne double plus (50) ;
//  - M3-3 sans produit d'un million ni glissement impossible (46), M4-2
//    avec × 10 rare et tard (47), A8-1 à 5 d'écart au plus (54), les titres
//    (53), M8-2 sans « Je coupe » (68), M10-3 sans étiquette orpheline (69),
//    un pixel de trop en J'écris de D1 (66).
// Ce qui se voit au navigateur : tests/defi-calcul-relecture-2b-ecrans.cjs.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const PARCOURS = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const PAGE = await lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = await lire("../outils/calcul_mental/defi_calcul.css");
const SOURCES = {
  core: await lire("../outils/calcul_mental/defi_calcul_core.js"),
  aides: await lire("../outils/calcul_mental/defi_calcul_aides.js")
};
const NIVEAUX = CORE.MODULES.filter(fiche => fiche.construit).flatMap(fiche => fiche.niveaux.map(niveau => `${fiche.id}-${niveau.n}`));
const serie = (cle, graines = 30) => Array.from({length: graines}, (_, g) => CORE.genererSerie(cle, {graine: g + 1})).flat();

test("la case : les formes des réponses du niveau, toutes, et pas la réponse cherchée (remarque 56)", () => {
  assert.equal(NIVEAUX.length, 125, "lot 7a : D5, D6, D7 en plus ; lot 7b : D8, D9, M13 ; lot 7c : F4, F9, F11 ; lot 7d : M11, A9, C4, M9");
  NIVEAUX.forEach(cle => {
    const formes = CORE.modelesReponse(cle);
    assert.ok(formes.length >= 1, cle);
    formes.forEach(forme => assert.match(forme, /^−?0{1,3}(\u00a00{3})*(,0+)?$/, `${cle} : ${forme}`));
    assert.equal(CORE.modeleReponse(cle), formes[0]);
    // (Lot 6 : une réponse en fraction à deux cases a ses cases à elle,
    // chacune aussi large que le plus long morceau du niveau.)
    serie(cle, 15).filter(c => CORE.aFractionACases(c.texte)).forEach(c => CORE.morceauxFraction(c.ecrite).forEach(m => assert.ok(m.length <= CORE.chiffresFraction(cle), `${cle} : ${c.texte}`)));
    serie(cle, 15).filter(c => !CORE.aFractionACases(c.texte)).forEach(c => {
      const forme = CORE.formaterNombre(c.reponse).replace(/\d/g, "0");
      assert.ok(formes.includes(forme), `${cle} : ${c.texte} → ${forme} est une forme connue`);
    });
  });
  // J'apprends : les réponses de la leçon comptent aussi.
  assert.deepEqual(CORE.modelesReponse("A2-1"), ["0"]);
  assert.deepEqual(CORE.modelesReponse("A2-1", [100]), ["000", "0"]);
  // La page : la case prend sa largeur avant la frappe, la plus large des formes, en « em ».
  assert.match(PAGE, /function fixerLargeurCases\(\) \{/);
  assert.match(PAGE, /largeur = Math\.max\(largeur, laCase\.getBoundingClientRect\(\)\.width \/ zoom\);/);
  assert.match(PAGE, /laCase\.style\.minWidth = `\$\{\(\(largeur \+ 1\) \/ taille\)\.toFixed\(3\)\}em`;/);
  assert.match(PAGE, /function renderInlineAnswer\(status = ""\) \{\n\s+const slot = \$\("inline-answer"\);\n\s+fixerLargeurCases\(\);/);
  assert.match(CSS, /\.inline-answer \{\n\s+font-variant-numeric: tabular-nums;/, "des chiffres de même largeur");
  // Le calcul se remesure une fois l'écran posé (sinon il rapetissait à la première touche).
  assert.match(PAGE, /serie\.virgule = virgule;\n(\s+\/\/.*\n)+\s+ajusterCalcul\(\);/);
});

test("la bulle : la place reste, la couleur n'entoure que le texte ; « Suivant » sur toute la ligne (remarque 55)", () => {
  assert.match(PAGE, /<div class="answer-feedback"><p id="answer-feedback" class="dc-bulle" role="status" aria-live="polite"><\/p><\/div>/);
  assert.doesNotMatch(PAGE, /className = "answer-feedback/, "la couleur va à la bulle");
  assert.match(CSS, /\.answer-feedback \{\n\s+min-height: 42px;\n\s+display: flex;\n\s+align-items: center;/);
  assert.match(CSS, /\.dc-bulle\.is-correct \{ color: var\(--green\); background: var\(--green-soft\); \}/);
  assert.doesNotMatch(CSS, /\.answer-feedback\.is-(correct|wrong)/);
  assert.match(PAGE, /\$\("question-card"\)\.classList\.toggle\("suivant-seul", !enabled\);/);
  assert.match(CSS, /\.question\.suivant-seul \.actions \{ grid-template-columns: 1fr; \}\n\.question\.suivant-seul #skip \{ display: none; \}/);
});

test("l'espace des milliers : une espace insécable qu'on voit, partout (remarque 43)", () => {
  assert.equal(CORE.ESPACE_FINE, " ");
  assert.equal(CORE.formaterNombre(2700), "2 700");
  assert.equal(CORE.formaterNombre(1234567.5), "1 234 567,5");
  for (const [nom, source] of Object.entries(SOURCES)) {
    assert.doesNotMatch(source, /\d \d/, `${nom} : pas d'espace fine entre deux chiffres`);
    assert.doesNotMatch(source, /\d\\u202f\d/, `${nom} : pas d'espace fine écrite \\u202f entre deux chiffres`);
  }
  // Les textes que l'élève lit.
  NIVEAUX.forEach(cle => serie(cle, 3).forEach(c => assert.doesNotMatch(c.texte, / /, `${cle} : ${c.texte}`)));
  assert.equal(AIDES.droiteSauts({depart: 1200, sauts: [{val: 400}]}).includes("1\u00a0200"), true, "la droite");
  // Dans le jeu, les espaces sont un peu plus larges (pas dans « À retenir »).
  assert.match(CSS, /\n\.question \{ word-spacing: \.12em; \}/);
});

test("le « = » à la taille des fractions (remarque 62)", () => {
  // Un document minuscule : assez pour noeudsCalcul.
  const noeud = (genre, attrs = {}) => Object.assign({genre, enfants: [], append(...e) { this.enfants.push(...e); }, setAttribute(k, v) { this[k] = v; }}, attrs);
  globalThis.document = {createElement: t => noeud(t), createTextNode: t => ({texte: t})};
  try {
    const morceaux = AIDES.noeudsCalcul("3/4 = □/12", {signes: true, caseReponse: () => noeud("case")});
    const signes = morceaux.filter(m => m.className === "dc-signe").map(m => m.textContent);
    assert.deepEqual(signes, ["="]);
    // Sans fraction, ou sans l'option, rien ne change.
    assert.ok(!AIDES.noeudsCalcul("12 = □", {signes: true, caseReponse: () => noeud("case")}).some(m => m.className === "dc-signe"));
    assert.ok(!AIDES.noeudsCalcul("3/4 = □/12", {caseReponse: () => noeud("case")}).some(m => m.className === "dc-signe"));
  } finally {
    delete globalThis.document;
  }
  assert.match(PAGE, /return AIDES\.noeudsCalcul\(texte, \{caseReponse, insecable, signes: true\}\);/);
  assert.match(CSS, /\.dc-signe \{ font-size: \.72em;/);
  assert.match(PAGE, /if \(\/\[\\d□\?\]\\\/\[\\d□\?\]\/\.test\(etape\.texte\)\) ligne\.classList\.add\("avec-frac"\);/);
  assert.match(CSS, /\.expression\.dc-lignes \.lg > span\.avec-frac \.cel\.dc-op \{ font-size: \.78em; \}/);
});

test("« Nouveau » : l'image revient pour la première écriture nouvelle, sans faire repartir la série (remarque 48) ; collée au calcul (49)", () => {
  const regles = {genre: "entraine", manip: true, toutesFormesVues: true};
  const sans = [{juste: true, outil: "manip"}, {juste: true, outil: "manip"}, {juste: true, outil: "image"}, {juste: true, outil: "image"}, {juste: true, outil: "aucun"}, {juste: true, outil: "aucun"}];
  const avant = PARCOURS.suivreEntrainement(sans, regles);
  assert.equal(avant.outil, "aucun");
  assert.equal(avant.justesDeSuite, 2);
  // Un rappel juste ne compte ni avec ni sans outil.
  const apres = PARCOURS.suivreEntrainement([...sans, {juste: true, outil: "image", rappel: true}], regles);
  assert.equal(apres.outil, "aucun");
  assert.equal(apres.justesDeSuite, 2);
  assert.equal(apres.justes, 7);
  // Faux, c'est une erreur comme une autre.
  assert.equal(PARCOURS.suivreEntrainement([...sans, {juste: false, outil: "image", rappel: true}], regles).justesDeSuite, 0);
  assert.match(PAGE, /if \(outil === "aucun" && nouveau && CORE\.aideDe\(question\.calcul\)\) \{\n\s+outil = "image";\n\s+question\.rappel = true;/);
  assert.match(PAGE, /montrerOutil\(question, \{nouveau\}\);/);
  assert.match(PAGE, /question\.rappel \? \{rappel: true\} : \{\}/);
  assert.match(PAGE, /reponse\.rappel \? \{rappel: true\} : \{\}/, "le rappel va jusqu'au parcours");
  assert.match(CSS, /\.challenge-playing \.question > \.dc-annonce-forme:not\(\[hidden\]\) \+ \.expression \{ margin-top: 0; \}/);
});

test("au tableau : le plein écran remplit l'écran à toute hauteur ; le dessin grandit dans la place libre (remarques 24, 51)", () => {
  assert.match(CSS, /@media \(min-width: 621px\) and \(min-height: 901px\) \{\n\s+:where\(body\.fullscreen-active\)\.challenge-playing \{ height: 100dvh; overflow: hidden; \}/);
  assert.match(CSS, /:where\(body\.fullscreen-active\)\.challenge-playing \.shell \{ height: calc\(\(100dvh - var\(--bas-cadre, 0px\)\) \/ var\(--echelle, 1\)\);/);
  assert.match(CSS, /body:not\(\.fullscreen-active\)\.challenge-playing \.question\.aide-perles \{ height: min\(76dvh, 860px\); \}/);
  assert.match(PAGE, /\|\| \(pleinEcran && window\.innerWidth > ECHELLE\.telephone\)\);/);
  assert.match(PAGE, /function grandirDessin\(\) \{/);
  assert.match(PAGE, /if \(state\.manip\) state\.manip\.mesurer\(\);\n\s+ajusterCalcul\(\);\n\s+grandirDessin\(\);/);
  assert.match(PAGE, /if \(window\.innerWidth < ECHELLE\.largeurMin\) return;/, "au téléphone, grandirDessin ne touche à rien");
  // Remarque 66 : plus de pixel de tolérance.
  assert.match(PAGE, /return !\(enJeu && carte && carte\.scrollHeight > carte\.clientHeight\);/);
});

test("les dessins : douzièmes, petit saut d'un détour, bande de la table au téléphone, J'écris qui ne double plus (remarques 63, 45, 50)", () => {
  // Les traits entre deux parts bleues sont blancs.
  const svg = AIDES.barreDroite({outil: "barre-droite", a: 1, d: 12, gros: 3, pris: 9, retire: 0});
  assert.equal([...svg.matchAll(/stroke="#fff" stroke-width="2\.4"/g)].length, 6, "9 parts bleues : 8 traits, dont 2 épais (les quarts)");
  // A5, A6 : l'étiquette du petit saut au-dessus de son arc.
  [["A5-1", {depart: 65, sauts: [{val: 10}, {val: -1}]}], ["A6-1", {depart: 85, sauts: [{val: -10}, {val: 1}]}]].forEach(([nom, o]) => {
    const plan = AIDES.planDroite(o);
    const dessin = AIDES.droiteSauts(o);
    const pilules = [...dessin.matchAll(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="26"/g)].map(m => ({x: +m[1], y: +m[2], w: +m[3]}));
    const petit = pilules[1];
    const centre = petit.x + petit.w / 2;
    assert.ok(centre > Math.min(plan.x[1], plan.x[2]) && centre < Math.max(plan.x[1], plan.x[2]), `${nom} : au-dessus de son arc`);
    assert.ok(petit.y + 26 < AIDES.DROITE.y - 8 - 28 + 1, `${nom} : au-dessus du sommet de l'arc`);
  });
  // La bande sur deux lignes.
  const deux = AIDES.dessinerImage({outil: "bande", table: 7, cherche: 8, masque: true, deuxLignes: true});
  assert.match(deux, /viewBox="0 0 560 284"/);
  assert.equal([...deux.matchAll(/<rect /g)].length, 11);
  // Chaque saut « + 7 » a sa pointe, vers la droite (demande du 12/11) :
  // 10 sauts sur la bande, 9 sur deux lignes (de × 5 à × 6, la ligne change).
  [[AIDES.dessinerImage({outil: "bande", table: 7, cherche: 8, masque: true}), 10], [deux, 9]].forEach(([svg, sauts]) => {
    const id = (svg.match(/<marker id="([^"]+)"/) || [])[1];
    assert.ok(id, "une pointe définie");
    assert.equal([...svg.matchAll(new RegExp(`marker-end="url\\(#${id}\\)"`, "g"))].length, sauts);
  });
  assert.notEqual(AIDES.dessinerImage({outil: "bande", table: 7, cherche: 8}).match(/<marker id="([^"]+)"/)[1], AIDES.dessinerImage({outil: "bande", table: 7, cherche: 8}).match(/<marker id="([^"]+)"/)[1], "un nom de pointe par dessin");
  assert.match(PAGE, /image && image\.outil === "bande" && window\.innerWidth <= ECHELLE\.telephone \? Object\.assign\(\{\}, image, \{deuxLignes: true\}\) : image/);
  assert.match(PAGE, /if \(aEtapes\(nom\)\) \{ figerDessin\(\); carte\.classList\.add\("ecrit-fini"\); \}/);
  assert.match(CSS, /\.challenge-playing \.question\.aide-image\.ecrit-fini > \.dc-aide > svg\[viewBox\] \{ max-height: var\(--dessin-h, none\); \}/);
});

test("M3-3 : ni produit d'un million, ni glissement impossible ; aucun glisse-nombres de plus de 3 colonnes (remarque 46)", () => {
  const m33 = serie("M3-3", 60);
  assert.ok(m33.every(c => c.reponse < 1000000), "pas de produit d'un million ou plus");
  assert.ok(m33.some(c => c.donnees.p >= 10000), "les grands produits restent (sans geste)");
  m33.filter(c => c.donnees.p >= 10000).forEach(c => assert.equal(CORE.manipulationDe(c), null, `${c.texte} : pas de geste`));
  NIVEAUX.forEach(cle => serie(cle, 10).forEach(c => {
    const m = CORE.manipulationDe(c);
    if (m && m.outil === "glisse") assert.ok(Math.abs(m.decalage) <= 3, `${c.texte} : ${m.decalage} colonnes`);
  }));
});

test("M4-2 : × 10 rare et après les tables de 6 à 9 (remarque 47) ; A8-1 : 5 d'écart au plus (54)", () => {
  let total = 0;
  for (let graine = 1; graine <= 40; graine += 1) {
    const s = CORE.genererSerie("M4-2", {graine});
    const dix = s.filter(c => c.donnees.a === 10 || c.donnees.b === 10);
    assert.ok(dix.length <= 4, `graine ${graine} : ${dix.length} × 10`);
    total += dix.length;
    assert.ok(s.slice(0, 7).every(c => c.donnees.a !== 10 && c.donnees.b !== 10), `graine ${graine} : pas de × 10 dans les 7 premiers`);
  }
  assert.ok(total / 40 < 2, `en moyenne moins de 2 × 10 sur 20 calculs (${total / 40})`);
  serie("A8-1", 40).forEach(c => {
    const [a, b] = c.texte.match(/\d+/g).map(Number);
    assert.ok(Math.abs(a - b) <= 5, c.texte);
  });
  assert.ok(CORE.niveauDe("A8-1").niveau.imposes.every(c => { const [a, b] = c.texte.match(/\d+/g).map(Number); return Math.abs(a - b) <= 5; }));
});

test("les mots : titres sans « retenue » (53), M8-2 sans « Je coupe » (68), M10-3 sans étiquette orpheline (69)", () => {
  const titre = cle => CORE.niveauDe(cle).niveau.titre;
  assert.equal(titre("A4-1"), "deux chiffres, sans passer la dizaine");
  assert.equal(titre("A4-2"), "deux chiffres, en passant la dizaine");
  assert.equal(titre("A7-1"), "sans passer la dizaine");
  const m82 = CORE.niveauDe("M8-2").niveau.apprends;
  assert.doesNotMatch(JSON.stringify(m82), /coupe/i);
  assert.equal(m82.represente.consigne.replace(/ /g, " "), "23 × 7 = 20 × 7 + 3 × 7");
  const m103 = CORE.niveauDe("M10-3").niveau.apprends;
  const dessin = AIDES.dessinerImage(m103.ecris.dessins[m103.ecris.dessins.length - 1]);
  const avant = [...dessin.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="end"[^>]*>([^<]*)<\/text>/g)];
  assert.equal(avant.length, 1);
  assert.equal(avant[0][3].replace(/ /g, " "), "28 × 25 =");
  assert.equal(Number(avant[0][2]), 74 + 33, "sur la ligne des facteurs");
});

test("les copies pour la page prof, les adresses de cache", async () => {
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_core.js"), SOURCES.core);
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
  assert.match(PAGE, /defi_calcul\.css\?v=20261118-1/);
  // Lot 2 « J'apprends en une étape » : le moteur change (20261113-1) ;
  // lot 3a « Une leçon, une méthode » (20261113-3), lot 3b « Chaque sorte
  // annoncée » : le cœur, les aides, la feuille (20261113-4) ; lot 3c
  // « J'écris sur des calculs qui changent » : le cœur, les aides (20261113-5).
  assert.match(PAGE, /defi_calcul_mon_parcours\.js\?v=20261115-3/);
  assert.match(PAGE, /defi_calcul_core\.js\?v=20261118-3/);
  assert.match(PAGE, /defi_calcul_aides\.js\?v=20261118-2/);
});

test("les tables : 8 × 7, c'est « 8 fois 7 » — on compte de 7 en 7 jusqu'à 8 × 7, comme Défi tables (demande du 12/11)", () => {
  ["M4-1", "M4-2"].forEach(cle => serie(cle, 60).filter(c => c.forme === "produit" && c.donnees.a > 1 && c.donnees.b > 1).forEach(c => {
    const image = CORE.imageDe(c);
    assert.deepEqual([image.outil, image.table, image.cherche], ["bande", c.donnees.b, c.donnees.a], c.texte);
  }));
  const CORE_SOURCE = SOURCES.core;
  assert.match(CORE_SOURCE, /consigne: "Je compte de 7 en 7 jusqu’à « 8 × 7 »\.",/);
  assert.match(CORE_SOURCE, /represente: faitCalcul\("M4", 0, "produit", 8, 7, 7\),/);
  assert.match(CORE_SOURCE, /consigne: "Je compte de 4 en 4 jusqu’à « 7 × 4 »\.",/);
  assert.match(CORE_SOURCE, /represente: faitCalcul\("M4", 0, "produit", 7, 4, 4\),/);
  const svg = AIDES.dessinerImage({outil: "bande", table: 7, cherche: 8, masque: true});
  ["0×7", "8×7", "10×7"].forEach(r => assert.ok(svg.includes(`>${r}<`), r));
  assert.ok(!/>× \d+</.test(svg), "plus de « × 8 » à l'envers");
  assert.ok(!/>× \d+</.test(AIDES.dessinerImage({outil: "bande", table: 7, cherche: 8, masque: true, deuxLignes: true})));
});
