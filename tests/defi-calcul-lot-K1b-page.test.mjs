// Défi calcul, lot K1b « les bases en trois classes », passe 3 (26/11/2026) :
// la page de l'élève, la page du professeur et la feuille de style, lues
// telles qu'elles sont (sans navigateur). Les écrans eux-mêmes sont joués
// au navigateur par tests/defi-calcul-lot-K1b-ecrans.cjs ; le moteur et le
// noyau par defi-calcul-lot-K1b-donnees et defi-calcul-lot-K1b-carte.
//
//  1. six onglets sur une rangée (planche K1b-2) : six colonnes, les mots
//     jamais coupés, la place de l'ordinateur (432 px) ;
//  2. les textes choisis par Gwenaël le 26/11 : « Comment ça marche ? » (six
//     ceintures), l'exemple d'« Ajouter 9 » au CP (40 + 9, plus de 69) ;
//  3. la page charge le noyau, le moteur et la feuille du lot (numéros de
//     cache neufs) ;
//  4. la page du professeur : « ceinture blanche-jaune (CP) gagnée » ; les
//     six onglets de « Où en est la classe » tiennent sur une rangée au
//     téléphone ;
//  5. le ménage : les règles de Mon parcours, de la pastille des soirs et de
//     l'ancien bilan sont parties, et rien d'autre.
// Ces tests ont été sabotés un par un (K1b\_travail\passe-3\sabotages-page) :
// chaque sabotage en rougit au moins un.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = lire("../outils/calcul_mental/defi_calcul.css");
const PROF = lire("../_serveur/public/prof/index.php");
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const plat = t => t.replace(/&nbsp;/g, " ").replace(/[  ]/g, " ");

// Une règle de premier niveau de la feuille (hors @media), par son sélecteur exact.
const regle = (css, selecteur) => {
  const sansMedia = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
  const m = sansMedia.match(new RegExp(`(?:^|\\n)${selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`));
  return m ? m[1] : null;
};
// Les règles d'un @media donné (le premier qui contient le sélecteur).
const regleMedia = (css, media, selecteur) => {
  for (const m of css.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)) {
    if (m[1].trim() !== media) continue;
    const r = m[2].match(new RegExp(`(?:^|\\n)\\s*${selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`));
    if (r) return r[1];
  }
  return null;
};

test("1. six onglets sur une rangée : six colonnes, les mots jamais coupés ; à l'ordinateur 432 px", () => {
  assert.equal(CORE.PALIERS.length, 6, "le noyau a six étages");
  assert.match(regle(CSS, ".ck-etages"), /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\); gap: 4px;/);
  const onglet = regle(CSS, ".ck-onglet");
  assert.match(onglet, /padding: 5px 1px 3px;/);
  assert.match(onglet, /font-size: \.66rem;/);
  assert.match(onglet, /white-space: nowrap;/);
  assert.match(regleMedia(CSS, "(min-width: 1024px)", ".ck-haut"), /grid-template-columns: 432px minmax\(0, 1fr\);/);
  assert.match(regleMedia(CSS, "(min-width: 1024px)", ".ck-onglet"), /font-size: \.74rem;/);
  assert.match(regleMedia(CSS, "(min-width: 1024px)", ".ck-etages"), /gap: 6px;/);
  // (320 px : « en cours » sortait de son onglet de 2 px.)
  assert.match(CSS, /@media \(max-width: 340px\) \{ \.ck-etages \{ gap: 3px; \} \.ck-onglet \{ font-size: \.6rem; \} \}/);
});

test("2. les textes du 26/11 : six ceintures dans « Comment ça marche ? » ; plus de 69 dans « Ajouter 9 »", () => {
  // (Lot P1, planche P1-9 A : tout est ouvert ; toujours six ceintures.)
  assert.ok(plat(PAGE).includes("Une ceinture est à moi quand j’ai toutes ses étoiles. Six ceintures, de la blanche-jaune à la bleue, à gagner dans l’ordre que je veux."));
  assert.ok(!/jaune, orange, verte, puis bleue/.test(PAGE), "l'ancienne liste de quatre ceintures est partie");
  const autre = CORE.niveauDe("A5-1").niveau.apprends.autre;
  assert.equal(plat(autre.calcul), "40 + 9 = 49 ; 41 + 9 = 50");
  assert.ok(!/69/.test(autre.calcul), "aucun 69 sur l'exemple mis en avant (règle du 21/09)");
  // La copie du professeur suit, octet pour octet.
  assert.equal(lire("../_serveur/public/prof/defi_calcul_core.js"), lire("../outils/calcul_mental/defi_calcul_core.js"));
});

test("3. la page charge le noyau, le moteur et la feuille du lot (numéros de cache neufs)", () => {
  assert.match(PAGE, /<link rel="stylesheet" href="\.\/defi_calcul\.css\?v=20261127-2">/);
  assert.match(PAGE, /<script src="\.\/defi_calcul_core\.js\?v=20261127-2"><\/script>/);
  assert.match(PAGE, /<script src="\.\/defi_calcul_mon_parcours\.js\?v=20261127-2"><\/script>/);
  for (const vieux of ["defi_calcul_core.js?v=20261125-7", "defi_calcul_mon_parcours.js?v=20261126-1", "defi_calcul.css?v=20261125-7"]) {
    assert.ok(!PAGE.includes(vieux), `${vieux} : l'ancienne adresse est partie`);
  }
});

test("4. la page du professeur : la classe de la ceinture dans « À féliciter » ; six onglets d'une rangée au téléphone", () => {
  assert.match(PROF, /const CLASSES_CEINTURES = \["CP", "CE1", "CE2", "CM1", "CM2", "6e"\];/);
  assert.match(PROF, /texte: `\$\{NOMS_CEINTURES\[x\.ceinture - 1\]\} \(\$\{CLASSES_CEINTURES\[x\.ceinture - 1\]\}\) gagnée`/);
  // (Même compte et même ordre que le noyau.)
  const noms = PROF.match(/const NOMS_CEINTURES = (\[[^\]]*\]);/);
  assert.deepEqual(JSON.parse(noms[1]), CORE.CEINTURES.slice(1).map(c => `ceinture ${c.nom.replace(/^Ceinture /i, "").toLowerCase()}`));
  // Au téléphone : six colonnes, la classe en un mot, le nombre de modules dessous ;
  // la règle ne vise que « Où en est la classe » (la période de Coffres garde ses boutons).
  assert.match(PROF, /@media \(max-width: 700px\) \{\n    #dc-ouest-paliers \{ display: grid; grid-template-columns: repeat\(6, minmax\(0, 1fr\)\); gap: 4px; \}/);
  assert.match(PROF, /#dc-ouest-paliers \.dc-long \{ display: none; \}/);
  assert.match(PROF, /\.dc-paliers-choix \.dc-court \{ display: none; \}/);
  assert.match(PROF, /el\("span", "dc-court", \(\{1: "CP", 2: "CE1", 3: "CE2", 4: "CM1", 5: "CM2", 6: "6e"\}\)\[n\]/);
  assert.match(PROF, /bouton\.setAttribute\("aria-label", `\$\{nomPalierCalcul\(n\)\}, \$\{modulesDu\(n\)\.length\} modules`\);/);
});

test("5. le ménage : Mon parcours, la pastille des soirs, l'ancien bilan — partis, et rien d'autre", () => {
  for (const sel of [/\.parcours-screen\b/, /\.dc-mods?\b(?!-)/, /\.dc-bientot\b/, /body\.sur-parcours\b/, /#parcours-modules\b/, /#acc-parcours\b/, /\.acc-soirs\b/, /\.acc-tete\b/, /\.mouv\b/]) {
    assert.ok(!sel.test(CSS), `${sel} : la règle est partie`);
  }
  // Ce qui reste et sert encore (même bloc, mêmes lignes) : la notice, la carte, les pastilles.
  assert.match(CSS, /\n  body\.sur-notice \.shell \{ display: flex; flex-direction: column; \}/);
  assert.match(CSS, /\n  body\.en-tete-cadre:not\(\.ecran-interne\):not\(\.challenge-playing\) \.shell > \.panel \{ padding-bottom: 22px; \}/);
  for (const garde of [".dc-comp {", ".dc-legende {", ".dc-ptitre {", ".dc-compte {", ".dc-gains {", ".matable-titre {", ".acc-pied {"]) {
    assert.ok(CSS.includes(garde), `${garde} reste`);
  }
  // L'élève ne voit aucun de ces écrans : la page ne les écrit plus.
  for (const mot of ["parcours-screen", "dc-mod", "dc-bientot", "sur-parcours", "parcours-modules", "acc-parcours", "acc-soirs", "acc-tete"]) {
    assert.ok(!PAGE.includes(mot), `la page n'écrit pas « ${mot} »`);
  }
});
