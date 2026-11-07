// Défi calcul, lot F1 « rythme » (07/11/2026) : ce que les deux PAGES font du
// réglage « nouveautés par séance ». Le moteur est testé dans
// defi-calcul-seance.test.mjs, le serveur dans _serveur/tests/lancer.php.
//  - la page de l'élève passe le réglage au moteur PARTOUT où elle lit la
//    séance, le prend dans les deux réponses du serveur (identité, billet),
//    l'oublie avec le code, et l'écrit dans « Comment ça marche ? » ;
//  - la page du professeur le règle dans « Régler Défi calcul » et l'envoie
//    comme les autres réglages de classe.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

test("page élève : chaque lecture de la séance passe le réglage au moteur", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const appels = [...page.matchAll(/PARCOURS\.(fileSeance|ouvrirSeance)\(([^)]*\))?/g)].map(m => m[0]);
  assert.ok(appels.length >= 7, `${appels.length} appels`);
  appels.forEach(appel => assert.match(appel, /optionsSeance\(/, `sans le réglage : ${appel}`));
  assert.match(page, /function nouveautesReglees\(\) \{\s*return MODE_PROF \|\| !codeSuivi \? PARCOURS\.SEUILS\.nouveautes\.defaut : nouveautesDeLaClasse;/,
    "1 en mode professeur et sans code");
  // Les deux réponses du serveur qui portent les réglages.
  assert.equal((page.match(/noterReglages\(code, (?:reponse\.donnees|donnees)\.reglages\)/g) || []).length, 2, "identité et billet");
  assert.match(page, /codeSuivi = code;[\s\S]{0,200}nouveautesDeLaClasse = PARCOURS\.chargerReglagesOnglet\(stockageSession\(\), code\);/, "un autre code : son réglage");
  // Relecture de Codex (07/11/2026) : le réglage reçu vaut même si l'onglet
  // ne peut pas le ranger ; une séance NEUVE relit le réglage (2 s au plus).
  assert.match(page, /nouveautesDeLaClasse = PARCOURS\.nouveautesDeReglages\(reglages\);\s*PARCOURS\.sauverReglagesOnglet\(stockageSession\(\), code, reglages\);/,
    "en mémoire d'abord, rangé ensuite");
  assert.match(page, /async function lancerSeance\(\) \{\s*if \(ouvertureEnCours\) return;\s*\/\/[^\n]*\n\s*if \(!PARCOURS\.fileSeance\(parcours, CARTE, optionsSeance\(\)\)\.ouverte && suiviActif\(\) && !suiviHorsLigne\) \{/);
  assert.match(page, /await Promise\.race\(\[rafraichirReglages\(\), new Promise\(fini => window\.setTimeout\(fini, 2000\)\)\]\);/);
  assert.match(page, /if \(sync\.detache\) \{ finAttente\(\); return; \}\s*rafraichirReglages\(\);/, "la lecture du démarrage est celle qu'on attend");
  // « Comment ça marche ? »
  assert.match(page, /puis <span id="notice-nouveautes">une chose nouvelle<\/span>\./);
  assert.match(page, /\$\("notice-nouveautes"\)\.textContent = n > 1 \? `\$\{n\}\\u00a0choses nouvelles` : "une chose nouvelle";/);
  // La carte : « Une 2e chose nouvelle · si l'entraînement est réussi ».
  assert.match(page, /etape\.rang \? `Une \$\{etape\.rang\}e chose nouvelle` : "Une chose nouvelle"/);
  assert.match(page, /const DETAIL_NOUVEAU_RANG = "si l’entraînement est réussi";/);
  // Lot G1 : 20261107-2 ; son correctif (relecture de Codex) : 20261107-3.
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261107-3/, "le moteur change d'adresse");
});

test("page prof : « Nouveautés par séance » dans Régler Défi calcul, envoyé comme réglage de classe", async () => {
  const page = await lire("../_serveur/public/prof/index.php");
  assert.match(page, /if \(cle === "defi-calcul"\) corps\.append\(\.\.\.choixNouveautes\(\)\);/);
  assert.match(page, /rond\.type = "radio";/);
  assert.match(page, /\[1, 2, 3\]\.forEach\(nombre => \{/);
  assert.match(page, /nouveautes: cle === "defi-calcul" \? nouveautesPourLaClasse\(\) : null,/, "l'état de départ");
  assert.match(page, /nouveautes: etat\.nouveautes,/, "copié dans le brouillon");
  assert.match(page, /if \(b\.cle === "defi-calcul" && b\.nouveautes !== depart\.nouveautes\) pourLAppli\.nouveautes = b\.nouveautes;/, "seulement s'il change");
  assert.match(page, /if \("nouveautes" in voulu && neuf\.nouveautes !== b\.nouveautes\) return false;/, "relu après une réponse perdue");
  assert.match(page, /if \(cle === "defi-calcul"\) details\.push\(texteNouveautes\(nouveautesPourLaClasse\(\)\)\);/, "la ligne du haut");
  assert.match(page, /return n === 2 \|\| n === 3 \? n : 1;/, "rien ou n'importe quoi : 1");
  // La copie du moteur dans prof/ est identique (suivi-moteur-copie le vérifie aussi).
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
});

test("serveur : une page d'avant F1 (version 3) ne réécrit pas la progression de Défi calcul", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const api = await lire("../_serveur/public/api/parcours.php");
  const moteur = await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  // Lot G1 « journal + accueil » : 5, et le serveur suit (une page de
  // version 4 effacerait le journal et les dates des compétences).
  assert.match(moteur, /const VERSION = 5;/);
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'version_min' => 5,/);
  assert.equal((applis.match(/'version_min' =>/g) || []).length, 1, "Défi calcul seul");
  assert.match(api, /\$versionMin = CATALOGUE_APPLIS\[\$appli\]\['version_min'\] \?\? null;[\s\S]{0,200}if \(!is_int\(\$version\) \|\| \$version < \$versionMin\) \{\s*erreur\("Page ancienne : recharge la page\.", 400\);/);
  // Avant l'écriture, pas avant la lecture.
  assert.ok(api.indexOf("$versionMin") > api.indexOf("if (!empty($corps['lire']))"));
  assert.ok(api.indexOf("$versionMin") < api.indexOf("$resultat = ecrire_progression("));
});
