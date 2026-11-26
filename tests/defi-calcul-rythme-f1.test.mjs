// Défi calcul : ce que les deux PAGES font des réglages de la séance. Lot F1
// « rythme » (07/11/2026) : « nouveautés par séance » ; remplacé au lot 1 « la
// séance » (12/11/2026, planches validées) par la DURÉE (10 ou 15 minutes) et
// JUSQU'OÙ va l'appli (le palier), pour la classe et pour quelques élèves.
// Le moteur est testé dans defi-calcul-lot-1-seance.test.mjs, le serveur
// dans _serveur/tests/lancer.php.
//  - la page de l'élève passe les réglages au moteur PARTOUT où elle lit la
//    séance, les prend dans les deux réponses du serveur (identité, billet),
//    les oublie avec le code, et écrit la durée dans « Comment ça marche ? » ;
//  - la page du professeur les règle dans « Régler Défi calcul » (pour la
//    classe, puis « Autrement pour quelques élèves ») et les envoie : la
//    classe par classes.modifier, chaque élève par eleves.reglages.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

test("page élève : chaque lecture de la séance passe les réglages au moteur", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  // (Lot K1 : `etatSeance` remplace `fileSeance` ; la carte et une étoile
  // lisent le palier par optionsCarte.)
  const appels = [...page.matchAll(/PARCOURS\.(etatSeance|ouvrirSeance|fermerSeance)\(([^)]*\))?/g)].map(m => m[0]);
  assert.ok(appels.length >= 4, `${appels.length} appels`);
  appels.forEach(appel => assert.match(appel, /optionsSeance\(/, `sans les réglages : ${appel}`));
  [...page.matchAll(/PARCOURS\.(carteEleve|etatEtoile)\(([^)]*\))?/g)].map(m => m[0])
    .forEach(appel => assert.match(appel, /optionsCarte\(\)/, `sans le palier : ${appel}`));
  assert.match(page, /const optionsCarte = \(\) => \(\{aujourdhui: jourCourant\(\), palier: palierRegle\(\), prof: MODE_PROF\}\);/);
  [...page.matchAll(/PARCOURS\.(commencerPaquet|tirerCalculsDuJour|terminerCalculsDuJour)\(parcours, [^\n]*/g)].map(m => m[0])
    .forEach(appel => assert.match(appel, /palier: palierRegle\(\)|\(parcours, options\)/, `sans le palier : ${appel}`)); // (`options` : celles de finish, palier compris)
  assert.match(page, /function reglagesSeance\(\) \{\s*return MODE_PROF \|\| !codeSuivi \? PARCOURS\.reglagesParDefaut\(\) : reglagesDeLEleve;/,
    "10 minutes et tout, en mode professeur et sans code");
  assert.match(page, /function optionsSeance\(aujourdhui = jourCourant\(\)\) \{\s*return Object\.assign\(\{aujourdhui\}, reglagesSeance\(\)\);/);
  // Le palier aussi là où la séance avance (les étapes jouées). (Lot K1 :
  // « Mon module » et `competenceCourante` sont partis.)
  // (Correctif K1, 26/11 : avec la source de l'onglet, pour le temps réuni de deux appareils.)
  assert.match(page, /const options = \{aujourdhui: jourCourant\(\), carte: CARTE, seance: enSeance\(\) && !MODE_PROF, palier: palierRegle\(\), source: SOURCE\};/);
  assert.doesNotMatch(page, /PARCOURS\.(moduleCourant|competenceCourante|fileSeance)\(/, "plus d'ancien moteur");
  // Les deux réponses du serveur qui portent les réglages.
  assert.equal((page.match(/noterReglages\(code, (?:reponse\.donnees|donnees)\.reglages\)/g) || []).length, 2, "identité et billet");
  assert.match(page, /codeSuivi = code;[\s\S]{0,200}reglagesDeLEleve = PARCOURS\.chargerReglagesOnglet\(stockageSession\(\), code\);/, "un autre code : ses réglages");
  // Relecture de Codex (lot F1) : le réglage reçu vaut même si l'onglet ne
  // peut pas le ranger ; une séance NEUVE relit le réglage (2 s au plus).
  assert.match(page, /reglagesDeLEleve = PARCOURS\.reglagesDeSeance\(reglages\);\s*PARCOURS\.sauverReglagesOnglet\(stockageSession\(\), code, reglages\);/,
    "en mémoire d'abord, rangé ensuite");
  assert.match(page, /async function lancerSeance\(\) \{\s*if \(ouvertureEnCours\) return;\s*if \(!PARCOURS\.seanceOuverte\(parcours, jourCourant\(\)\) && suiviActif\(\) && !suiviHorsLigne\) \{/);
  assert.match(page, /await Promise\.race\(\[rafraichirReglages\(\), new Promise\(fini => window\.setTimeout\(fini, 2000\)\)\]\);/);
  assert.match(page, /if \(sync\.detache\) \{ finAttente\(\); return; \}(?:\s*\/\/[^\n]*)*\s*if \(envoisRetenus\(\)\) \{ demarrageEnAttente = true; finAttente\(\); return; \}\s*demarrageEnAttente = false;\s*rafraichirReglages\(\);/, "la lecture du démarrage est celle qu'on attend");
  // « Comment ça marche ? » : la durée réglée.
  assert.match(page, /<span id="notice-minutes">10&nbsp;minutes<\/span>/);
  assert.match(page, /\$\("notice-minutes"\)\.textContent = `\$\{reglagesSeance\(\)\.minutes\}\\u00a0minutes`;/);
  // Plus rien du lot F1.
  ["nouveautesReglees", "nouveautesDeLaClasse", "notice-nouveautes", "DETAIL_NOUVEAU_RANG", "chose nouvelle"].forEach(mot => assert.ok(!page.includes(mot), mot));
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261126-2/, "le moteur change d'adresse");
});

test("page élève : la carte n'a d'étage ouvert que jusqu'au réglage du professeur (lot K1)", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  // Le moteur ferme les étages au-delà du palier réglé (carteEleve, palier) ;
  // le mode professeur les ouvre tous (prof: MODE_PROF).
  assert.match(page, /const carteDuJour = \(\) => PARCOURS\.carteEleve\(parcours, CARTE, optionsCarte\(\)\);/);
  // Plus de test de module ni d'escalier borné par palier.
  ["marchesDuTest", "renderParcoursPaliers", "Jusqu’au palier"].forEach(mot => assert.ok(!page.includes(mot), mot));
});
test("page prof : « Régler Défi calcul » — la durée et le palier pour la classe, autrement pour quelques élèves", async () => {
  const page = await lire("../_serveur/public/prof/index.php");
  assert.match(page, /if \(cle === "defi-calcul"\) corps\.append\(\.\.\.choixCalcul\(\)\);/);
  assert.match(page, /if \(cle === "defi-calcul"\) \{ corps\.append\(\.\.\.autrementPourQuelquesEleves\(\)\); return; \}/);
  // Relecture Codex du lot 1 : fusion à trois (seul ce que la fenêtre a changé
  // part, posé sur l'état actuel de l'élève) ; les réglages aussi quand l'appli
  // n'est ouverte qu'à quelques élèves ; le bilan nomme les élèves non envoyés.
  assert.match(page, /if \(voulu === valeurPropre\(d, nom, eleve\.id\)\) return;/);
  assert.match(page, /reglages: reglagesVoulus\(eleve, b\.calcul, depart\.calcul\)/);
  assert.doesNotMatch(page, /b\.cle === "defi-calcul" && b\.classeOuverte/);
  assert.match(page, /aChanger\.concat\(aRegler\)\.forEach/);
  assert.match(page, /`Les autres : \$\{c\.minutes\} minutes, /);
  assert.match(page, /"Durée d’une séance"/);
  assert.match(page, /"Jusqu’où va l’appli"/);
  assert.match(page, /"15 minutes : plus de temps pour apprendre, pour une classe qui en a besoin\."/);
  assert.match(page, /"Au-delà, ni test ni leçon\. Ce qui est déjà appris continue de revenir\."/);
  assert.match(page, /el\("h3", "", "Autrement pour quelques élèves"\), el\("p", "aide", "Le choix de l’élève l’emporte sur celui de la classe\."\)/);
  // (Lot K1b : six étages, un par classe ; le réglage part sous le nom « etage ».)
  assert.match(page, /const PALIERS_CALCUL = \[\[1, "CP", "Jusqu’au CP"\], \[2, "CE1", "Jusqu’au CE1"\], \[3, "CE2", "Jusqu’au CE2"\], \[4, "CM1", "Jusqu’au CM1"\], \[5, "CM2", "Jusqu’au CM2"\],\s+\[6, "Vers la 6e \(tout\)", "Jusqu’à la 6e"\]\];/);
  assert.match(page, /const palier = palierValable\(r\.etage\);/);
  assert.doesNotMatch(page, /r\.palier\b|propre\.palier\b|pourLAppli\.palier\b/, "plus rien ne part ni ne se lit sous l'ancien nom");
  // Une ligne par valeur différente de celle de la classe.
  assert.match(page, /MINUTES_CALCUL\.filter\(n => n !== c\.minutes\)\.forEach/);
  assert.match(page, /PALIERS_CALCUL\.filter\(\(\[n\]\) => n !== c\.palier\)\.forEach/);
  // L'état de départ, le brouillon, ce qui part.
  assert.match(page, /calcul: cle === "defi-calcul" \? calculDeLaClasse\(\) : null,/);
  assert.match(page, /calcul: etat\.calcul \? copierCalcul\(etat\.calcul\) : null,/);
  assert.match(page, /if \(b\.cle === "defi-calcul" && b\.calcul\.minutes !== depart\.calcul\.minutes\) pourLAppli\.minutes = b\.calcul\.minutes;/);
  assert.match(page, /if \(b\.cle === "defi-calcul" && b\.calcul\.palier !== depart\.calcul\.palier\) pourLAppli\.etage = b\.calcul\.palier;/);
  assert.match(page, /if \("minutes" in voulu && neuf\.calcul\.minutes !== b\.calcul\.minutes\) return false;/, "relu après une réponse perdue");
  assert.match(page, /await appelBorne\("eleves\.reglages", \{eleve_id: eleve\.id, avant: eleve\.reglages \|\| \{\}, reglages\}\);/, "un élève : avec « avant »");
  assert.match(page, /if \(cle === "defi-calcul"\) details\.push\(\.\.\.texteCalcul\(calculDeLaClasse\(\)\)\);/, "la ligne du haut");
  assert.match(page, /if \(autrement\) morceaux\.push\(`autrement pour \$\{autrement\} élève\$\{autrement > 1 \? "s" : ""\}`\);/);
  // Plus rien du lot F1.
  ["choixNouveautes", "nouveautesPourLaClasse", "texteNouveautes", "Nouveautés par séance\""].forEach(mot => assert.ok(!page.includes(mot), mot));
  // La copie du moteur dans prof/ est identique (suivi-moteur-copie le vérifie aussi).
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
});

test("serveur : une page d'avant le lot 1 (version 6) ne réécrit pas la progression de Défi calcul", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const api = await lire("../_serveur/public/api/parcours.php");
  const moteur = await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  // Lot G1 : 5 ; correctif S1 : 6 ; lot 1 « la séance » : 7 (`l` et le plan à
  // 11 nombres, qu'une page de version 6 effacerait).
  // Lot 4 « les ceintures » : 8 (`ceintures`, qu'une page de version 7 effacerait).
  // Lot 6 « programmes 2 » : 9 (F6 et F9 ont un niveau de plus).
  // Lot F4 « personne ne reste bloqué » : 10 (`ar` et `paliers`).
  // Lot C2 : 11 (M1 et D8 en deux niveaux, doubles puis moitiés).
  // Lot K1 « la carte chez l'élève » : 12 (des étoiles, leur compteur ; plus
  // de `ok`, `f`, `t`, `l`).
  // Lot K1b « les bases en trois classes » : 13 (six étages, neuf étoiles de plus).
  assert.match(moteur, /const VERSION = 13;/);
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'version_min' => 13,/);
  assert.equal((applis.match(/'version_min' =>/g) || []).length, 4, "Défi calcul, Défi tables, Coffres, SPLAT!");
  assert.match(api, /\$versionMin = CATALOGUE_APPLIS\[\$appli\]\['version_min'\] \?\? null;[\s\S]{0,200}if \(!is_int\(\$version\) \|\| \$version < \$versionMin\) \{\s*erreur\("Page ancienne : recharge la page\.", 400\);/);
  assert.ok(api.indexOf("$versionMin") > api.indexOf("if (!empty($corps['lire']))"));
  assert.ok(api.indexOf("$versionMin") < api.indexOf("$resultat = ecrire_progression("));
  // Le réglage par élève est rangé à part : jamais dans les ajouts.
  assert.match(applis, /function reglages_eleve_recus\(mixed \$recus\): array/);
  assert.match(applis, /foreach \(\$propres\[\$cle\] \?\? \[\] as \$nom => \$valeur\) \$reglage\[\$nom\] = \$valeur;/);
  assert.match(applis, /if \(is_int\(\$defaut\)\) \$listes\[\$nom\] = \$defaut;/, "listes_declarees ne voit que les listes : un choix ne se donne pas « en plus »");
});
