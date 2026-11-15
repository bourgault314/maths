// Défi calcul, lot « accueil » (07/11/2026, choix de Gwenaël par questions à
// choix) : l'accueil de l'élève en une colonne, comme Défi tables.
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
// Au navigateur : tests/defi-calcul-accueil-ecrans.cjs (hors CI).

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

test("une seule colonne : plus de deux cartes côte à côte ni de liste sur l'accueil", () => {
  const intro = PAGE.slice(PAGE.indexOf('<div id="intro"'), PAGE.indexOf('<div id="ecran-parcours"'));
  assert.match(intro, /<div id="intro" class="intro">\s*<div class="acc">/);
  assert.ok(!/dc-a\b|dc-large|class="gauche"|acc-semaine|acc-effacer-zone/.test(PAGE), "les restes de l'accueil à deux colonnes sont partis");
  assert.ok(!/\.acc\.dc-a|\.dc-large|\.acc-effacer-zone/.test(CSS));
  assert.ok(!intro.includes('id="acc-parcours"'), "la liste n'est plus sur l'accueil");
  // L'ordre : Mon module, la porte, puis la ligne des liens.
  const i = id => intro.indexOf(`id="${id}"`);
  assert.ok(i("acc-module-titre") < i("acc-seance") && i("acc-seance") < i("acc-porte") && i("acc-porte") < i("acc-bas"));
});

test("la pastille des soirs : dans la tête de Mon module, sur une ligne de hauteur fixe ; rien sans soir ni en mode professeur", () => {
  assert.match(PAGE, /<div class="acc-tete"><p class="eyebrow">Mon module<\/p><span id="acc-soirs" class="acc-soirs" hidden>/);
  assert.match(CSS, /\.acc-tete \{ display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 26px;/);
  // Relecture 2 (08/11/2026) : « jours », pas « soirs » (les élèves ne
  // travaillent pas forcément le soir).
  assert.match(PAGE, /return soirs \? `\$\{soirs\}\\u00a0jour\$\{soirs > 1 \? "s" : ""\} cette semaine` : "";/);
  const rendu = corps(PAGE, "renderSemaine");
  assert.match(rendu, /const soirs = MODE_PROF \? "" : texteSoirs\(s\.soirs\);/);
  assert.match(rendu, /\$\("acc-soirs"\)\.hidden = !soirs;/);
  assert.match(PAGE, /const semaine = \(\) => PARCOURS\.semaineEleve\(parcours, CARTE, jourCourant\(\)\);/);
});

test("la porte de Mon parcours : le palier (lot 1) et les gains de la semaine en vert ; elle ouvre un écran à part", () => {
  const rendu = corps(PAGE, "renderSemaine");
  // Lot 1 « la séance » (planche 1) : plus de « N compétences sues sur 125 ».
  // Lot 4 « les ceintures » : la ceinture portée devant le palier, et son
  // dessin à la place de la petite carte.
  assert.match(rendu, /note\.replaceChildren\(document\.createTextNode\(soude\(`\$\{nomCeinture\(ceintures\.porte\)\} · `\) \+ textePalier\(\)\)\);/);
  assert.match(rendu, /\$\("acc-ceinture"\)\.replaceChildren\(CORE\.elementCeinture\(document, ceintures\.porte, \{barrettes: ceintures\.barrettes, taille: 46\}\)\);/);
  assert.doesNotMatch(PAGE, /sues? sur \$\{compte\.total\}/);
  assert.match(rendu, /const gains = texteGains\(s\.sues\);/);
  assert.match(PAGE, /const texteGains = sues => sues \? `\+\$\{sues\} cette semaine` : "";/);
  assert.match(CSS, /\.acc-porte small b \{ color: var\(--green\); font-weight: 950; white-space: nowrap; \}/);
  assert.match(PAGE, /\$\("acc-porte"\)\.addEventListener\("click", ouvrirParcours\);/);
  assert.match(corps(PAGE, "ouvrirParcours"), /state\.palier = null;\s*\n\s*show\("ecran-parcours"\);/);
  assert.match(PAGE, /const ECRANS = Object\.freeze\(\["intro", "ecran-parcours", "module", "play", "result", "notice"\]\);/);
  assert.match(PAGE, /\$\("parcours-back"\)\.addEventListener\("click", versAccueil\);/);
});

test("l'écran Mon parcours : gains, « ↑ cette semaine », deux colonnes, même taille de cadre d'un palier à l'autre", () => {
  const paliers = corps(PAGE, "renderParcoursPaliers");
  assert.match(paliers, /\$\("parcours-gains"\)\.textContent = texteGains\(s\.sues\);/);
  assert.match(paliers, /ligneModule\(fiche, palier\.n, s\.avancees\)/);
  const ligne = corps(PAGE, "ligneModule");
  assert.match(ligne, /avancees\.some\(a => a\.module === fiche\.id && niveaux\.some\(niveau => niveau\.n === a\.niveau\)\)/);
  assert.match(ligne, /monte\.textContent = "↑ cette semaine";/);
  assert.match(CSS, /\.parcours-screen \.dc-mods \{ grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\); column-gap: 8px; \}/);
  // La taille : la plus petite des échelles des quatre paliers.
  const ajuster = corps(PAGE, "ajusterEchelle");
  assert.match(ajuster, /CORE\.PALIERS\.forEach\(palier => \{/);
  assert.match(ajuster, /plus = Math\.min\(plus, echelleCourante\(\)\);/);
  // Le palier trop long pour l'écran : la liste défile dans sa carte, le cadre garde la hauteur de l'écran.
  assert.match(CSS, /body\.sur-parcours:not\(\.mesure-cadre\) #parcours-modules \{ flex: 1 1 auto; min-height: 0; overflow-y: auto; grid-auto-rows: max-content;/);
});

test("l'étape du test : « Tu connais déjà ce module ? » quand c'est le module affiché", () => {
  const carte = corps(PAGE, "carteDeSeance");
  assert.match(carte, /const affiche = \(competenceCourante\(\) \|\| \{\}\)\.module;/);
  assert.match(carte, /etape\.type === "test" && etape\.module === affiche \? "Tu connais déjà ce module\\u00a0\?" : soude\(nomEtape\(etape\)\)/);
});

test("le mode professeur : la même page, ses liens ; « Changer de module » ouvre Mon parcours, où chaque ligne ouvre son module", () => {
  assert.match(PAGE, /\$\("acc-changer"\)\.addEventListener\("click", ouvrirParcours\);/);
  assert.match(PAGE, /\$\("module-changer"\)\.addEventListener\("click", \(\) => show\("ecran-parcours"\)\);/);
  assert.match(corps(PAGE, "majPilule"), /name === "intro" \|\| name === "ecran-parcours" \|\| name === "module"/);
  assert.match(corps(PAGE, "ligneModule"), /const ouvrable = MODE_PROF && etat\.etat !== "bientot";/);
});

test("le cadre : centré et à la hauteur de l'écran sur l'ordinateur ; caché tant que le serveur n'a pas répondu", () => {
  assert.match(CSS, /body:not\(\.ecran-interne\):not\(\.challenge-playing\) \.panel > #intro \{ width: 100%; margin: auto; padding-top: 14px; \}/);
  assert.match(CSS, /body:not\(\.ecran-interne\):not\(\.challenge-playing\):not\(\.fullscreen-active\) \.shell,\n  body\.sur-parcours:not\(\.fullscreen-active\) \.shell, body\.sur-notice:not\(\.fullscreen-active\) \.shell \{ box-sizing: border-box; min-height: calc\(100svh \/ var\(--echelle, 1\)\); \}/);
  assert.match(CSS, /body\.accueil-en-attente \.shell \{ visibility: hidden; \}/);
  assert.match(corps(PAGE, "renderAccueil"), /document\.body\.classList\.toggle\("accueil-en-attente", suiviAttendu && !\$\("intro"\)\.hidden\);/);
  assert.match(PAGE, /defi_calcul\.css\?v=20261115-1/);
});

test("la question « Effacer » s'ouvre dans la même case que la porte et les liens", () => {
  assert.match(PAGE, /<div id="acc-pied" class="acc-pied">\s*<div class="acc-pied-normal">/);
  assert.match(CSS, /\.acc-pied > \* \{ grid-area: 1 \/ 1; min-width: 0; \}/);
  assert.match(CSS, /\.acc-pied\.avec-effacer > \.acc-confirm\[hidden\] \{ display: block !important; visibility: hidden; \}/);
  // Relecture 2 : la fin de séance dit le même nombre de jours que l'accueil.
  assert.match(corps(PAGE, "texteSemaine"), /return texteSoirs\(semaine\(\)\.soirs\);/);
});

test("« Mode professeur » : pour le visiteur sans code seulement, sur la ligne du bas", () => {
  assert.match(PAGE, /<a id="acc-prof" class="lien-prof" href="\?prof=1" hidden>Mode professeur<\/a>/);
  const bas = PAGE.slice(PAGE.indexOf('<div id="acc-bas"'), PAGE.indexOf('id="acc-confirm"'));
  assert.ok(bas.includes('id="acc-prof"'), "sur la ligne des liens");
  assert.match(corps(PAGE, "renderAccueil"), /\$\("acc-prof"\)\.hidden = !peutEffacer\(\);/);
  // L'élève à code n'entre jamais en mode professeur, même par l'adresse.
  assert.match(PAGE, /const MODE_PROF = !eleveDansOnglet && \(REQUETE\.get\("prof"\) === "1" \|\| cleProfDansOnglet\(\)\);/);
});
