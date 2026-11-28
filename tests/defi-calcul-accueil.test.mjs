// Défi calcul, lot « accueil » (07/11/2026, choix de Gwenaël par questions à
// choix) : l'accueil de l'élève en une colonne, comme Défi tables.
// Lot K1 « la carte » (25/11/2026) : Mon module, la pastille des soirs et
// Mon parcours sont partis ; l'accueil dit la ceinture de l'étage, le but du
// jour et « Commencer » ; « La carte » ouvre l'écran de la carte. Ce qui ne
// valait que pour l'ancien accueil est retiré (liste dans la notice du lot
// K1) ; la carte est testée dans defi-calcul-lot-K1-page.test.mjs.
//   - Mon module et Ma séance du jour ; la pastille « N soirs cette semaine »
//     dans la tête de Mon module (rien sans soir, rien en mode professeur) ;
//   - la porte « Mon parcours » (le compte et « +N cette semaine ») ouvre un
//     écran à part : les paliers, la liste du palier (deux colonnes),
//     « ↑ cette semaine » sous un module qui a avancé ;
//   - l'étape du test dit « Tu connais déjà ce module ? » ;
//   - le professeur voit la même page, avec ses liens ;
//   - « Comment ça marche ? » (et, pour le visiteur sans code, « Effacer mon
//     historique » et « Mode professeur ») sur une ligne ;
//     la question s'ouvre à la place de la porte et de la ligne.
// Lot « l'accueil, c'est la carte » (28/11/2026, demande de Gwenaël,
// choix A aux quatre questions, puis sa retouche du même jour) : il n'y a
// plus d'écran d'accueil — on arrive sur la carte ; en bas, le but du jour
// et « Commencer · 10 minutes » ; « Comment ça marche ? » est le « ? » de la
// ligne de la ceinture ; « Effacer mon historique » et « Mode professeur »
// (visiteur sans code) sous le bouton ; le retour d'une étape dit « La carte ».
// Au navigateur : tests/defi-calcul-lot-accueil-carte-ecrans.cjs (hors CI).

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const PAGE = await lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = await lire("../outils/calcul_mental/defi_calcul.css");

function corps(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `function ${nom}`);
  let profondeur = 0;
  for (let i = source.indexOf("{", debut); i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}" && --profondeur === 0) return source.slice(debut, i + 1);
  }
  throw new Error(nom);
}

test("plus d'écran d'accueil : on arrive sur la carte, et on y revient", () => {
  assert.ok(!PAGE.includes('id="intro"'), "l'ancien accueil est parti");
  ["acc-ceinture", "acc-compte", "acc-commencer", "acc-porte", "acc-tout", "acc-encore", "acc-titre", "acc-minutes", "acc-but-avant", "carte-back"]
    .forEach(id => assert.ok(!PAGE.includes(`id="${id}"`), `${id} est parti`));
  ["renderAccueil", "etageCourant", "acc-tout-carte"].forEach(mot => assert.ok(!PAGE.includes(mot), `${mot} est parti`));
  assert.match(PAGE, /<div id="ecran-carte" class="ck-ecran">/, "la carte est visible au chargement");
  assert.match(PAGE, /const ACCUEIL = "ecran-carte";/);
  assert.match(PAGE, /const ECRANS = Object\.freeze\(\["ecran-carte", "play", "result", "notice"\]\);/);
  // Revenir à l'accueil, c'est revenir à la carte, sur l'étage de « Continuer ».
  assert.match(corps(PAGE, "versAccueil"), /state\.origine = "intro";\s*ouvrirCarte\(\);/);
  assert.match(corps(PAGE, "quitterSerie"), /state\.origine = "intro";\s*ouvrirCarte\(\);/);
  assert.match(corps(PAGE, "ouvrirCarte"), /state\.etage = etage;\s*\n\s*show\("ecran-carte"\);/);
  // Le lien du site (« ← Calcul mental », « ← Mon espace ») reste sur la carte.
  assert.match(corps(PAGE, "show"), /document\.body\.classList\.toggle\("ecran-interne", name !== ACCUEIL\);/);
  // L'historique du navigateur : l'entrée de base est la carte.
  assert.match(PAGE, /let ecranCourant = ACCUEIL;/);
  assert.match(corps(PAGE, "retourNavigateur"), /if \(surEntreeInterne\(\) \|\| ecranCourant === ACCUEIL\) return;/);
  // Plus de bouton « Accueil » à côté de « La carte » : un seul chemin.
  assert.ok(!/\["Accueil", "secondary", versAccueil\]/.test(PAGE), "le bilan n'a plus « Accueil » à côté de « La carte »");
  assert.ok(!/lienDiscret\("Accueil", versAccueil\)/.test(PAGE));
  assert.ok(!/<span class="(?:game-menu|settings-back)-label">Accueil<\/span>/.test(PAGE), "le retour dit « La carte »");
  assert.match(corps(PAGE, "majBoutonRetour"), /textContent = "La carte";/);
});

test("la carte s'ouvre sur l'étage de « Continuer » tant que l'élève n'a pas touché un onglet (même pendant l'attente du serveur)", () => {
  const rc = corps(PAGE, "renderCarte");
  assert.ok(rc.includes("const choisi = state.etage !== null && carte.etages.some(e => e.etage === state.etage) ? state.etage : (carte.courant || 1);"));
  assert.ok(!/state\.etage = carte\.courant/.test(rc), "l'étage n'est pas retenu par le dessin");
});

test("le cadre : à la hauteur de l'écran sur l'ordinateur ; caché tant que le serveur n'a pas répondu", () => {
  assert.match(CSS, /body:not\(\.ecran-interne\):not\(\.challenge-playing\) \.panel > #ecran-carte \{ width: 100%; \}/);
  assert.ok(!/#intro\b/.test(CSS), "plus de règle de l'ancien accueil");
  assert.match(CSS, /body:not\(\.ecran-interne\):not\(\.challenge-playing\):not\(\.fullscreen-active\) \.shell,\n  body\.sur-notice:not\(\.fullscreen-active\) \.shell \{ box-sizing: border-box; min-height: calc\(100svh \/ var\(--echelle, 1\)\); \}/);
  assert.ok(!/sur-parcours/.test(CSS), "plus aucune règle de Mon parcours");
  assert.match(CSS, /body\.accueil-en-attente \.shell \{ visibility: hidden; \}/);
  assert.match(CSS, /\.ck-ecran\.en-attente > \* \{ visibility: hidden; \}/);
  const rc = corps(PAGE, "renderCarte");
  assert.match(rc, /ecran\.classList\.toggle\("en-attente", suiviAttendu\);\s*document\.body\.classList\.toggle\("accueil-en-attente", suiviAttendu && !ecran\.hidden\);/);
  assert.match(PAGE, /defi_calcul\.css\?v=20261128-1/);
});

test("en bas : le but du jour, Mes calculs du jour, « Commencer · 10 minutes » ; « Comment ça marche ? » est le « ? » de la ceinture", () => {
  const bas = PAGE.slice(PAGE.indexOf('<div class="ck-bas">'), PAGE.indexOf('<div id="acc-pied"'));
  const i = id => bas.indexOf(`id="${id}"`);
  const ordre = ["acc-but", "carte-jour", "carte-tout", "carte-continuer"].map(i);
  assert.ok(ordre.every(x => x > 0), "les quatre morceaux sont dans le bas");
  assert.deepEqual(ordre, ordre.slice().sort((a, b) => a - b));
  assert.match(bas, /<p id="acc-but" class="ck-but-jour" hidden><span class="ck-coche" aria-hidden="true"><\/span><span id="acc-but-texte"><\/span><\/p>/);
  const rc = corps(PAGE, "renderCarte");
  assert.ok(rc.includes('const mot = s.ouverte ? "Continuer" : `${s.finies ? "Encore une séance" : "Commencer"} · ${s.minutes}\\u00a0minutes`;'), "le mot de l'ancien accueil, et la durée dans le bouton");
  assert.ok(rc.includes('$("acc-but").hidden = toutGagne || !texteBut(s.but);'));
  // « ? » : dans la ligne de la ceinture, remis à sa place à chaque dessin.
  assert.match(PAGE, /<div id="carte-porteur" class="ck-porteur"><button id="acc-notice-bouton" class="ck-aide" type="button" aria-label="Comment ça marche \?" title="Comment ça marche \?">\?<\/button><\/div>/);
  assert.ok(rc.includes('porteur.replaceChildren(ceintureDeLEtage(etage, 76), texte, $("acc-notice-bouton"));'));
  assert.match(CSS, /\.ck-aide \{[^}]*margin-left: auto;/);
  // À l'ordinateur, le nom de la ceinture ne passe pas à la ligne (le « ? » ne le pousse pas).
  assert.match(CSS, /@media \(min-width: 621px\) \{ \.ck-porteur:not\(\.prof\) \.txt b \{ white-space: nowrap; \} \}/);
});

test("la question « Effacer » s'ouvre dans la même case que les liens ; la ligne, pour le visiteur sans code seulement", () => {
  assert.match(PAGE, /<div id="acc-pied" class="acc-pied ck-pied" hidden>\s*<div class="acc-pied-normal">/);
  assert.match(CSS, /\.acc-pied > \* \{ grid-area: 1 \/ 1; min-width: 0; \}/);
  assert.match(CSS, /\.acc-pied\.avec-effacer > \.acc-confirm\[hidden\] \{ display: block !important; visibility: hidden; \}/);
  assert.match(CSS, /\.ck-pied\[hidden\] \{ display: none; \}/);
  assert.match(corps(PAGE, "renderCarte"), /\$\("acc-pied"\)\.hidden = !peutEffacer\(\);/);
});

test("« Mode professeur » : pour le visiteur sans code seulement, sur la ligne du bas", () => {
  assert.match(PAGE, /<a id="acc-prof" class="lien-prof" href="\?prof=1" hidden>Mode professeur<\/a>/);
  const bas = PAGE.slice(PAGE.indexOf('<div id="acc-bas"'), PAGE.indexOf('id="acc-confirm"'));
  assert.ok(bas.includes('id="acc-prof"'), "sur la ligne des liens");
  assert.match(corps(PAGE, "renderCarte"), /\$\("acc-prof"\)\.hidden = !peutEffacer\(\);/);
  // L'élève à code n'entre jamais en mode professeur, même par l'adresse.
  assert.match(PAGE, /const MODE_PROF = !eleveDansOnglet && \(REQUETE\.get\("prof"\) === "1" \|\| cleProfDansOnglet\(\)\);/);
  // La pilule du professeur : sur la carte.
  assert.match(corps(PAGE, "majPilule"), /\$\("prof-pilule"\)\.hidden = !\(MODE_PROF && name === ACCUEIL\);/);
});
