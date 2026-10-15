import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Lot E1 « les évaluations en classe » de Défi tables (15/10/2026).
//
// Ce fichier garde ce qui se vérifie EN LISANT le code du serveur et de Ma
// classe, et il EXÉCUTE la fabrication du fichier telle qu'elle est écrite
// dans la page. Le comportement du serveur (qui reçoit quoi, ce qui reste en
// base) est éprouvé pour de vrai par `_serveur/tests/lancer.php`, section
// « évaluations — » ; le générateur par tests/defi-tables-evaluation-classe.test.mjs.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) une colonne « note », « prenom » ou « questions » dans modeles_evaluation
//  b) « modeles_evaluation » retirée de TABLES_SAUVEGARDEES (ou « directs » ajoutée)
//  c) écrire dans la carte par innerHTML
//  d) la graine de l'élève lue dans le corps de la requête (commencer)
//  e) retirer la neutralisation des formules dans celluleCsv()
//  f) une action evaluation.* de classe absente de la matrice des droits
//  g) les gestes de l'élève sans limiter()
//  h) la page prof qui chargerait le noyau depuis mathsgo.re

const lib = lire("_serveur/public/lib/evaluation.php");
const direct = lire("_serveur/public/lib/direct.php");
const bd = lire("_serveur/public/lib/bd.php");
const apiEleve = lire("_serveur/public/api/direct.php");
const apiProf = lire("_serveur/public/api/prof.php");
const page = lire("_serveur/public/prof/index.php");
const sauvegarde = lire("_serveur/public/sauvegarde.php");
const journal = lire("_serveur/public/lib/journal.php");
const C = require("../outils/calcul_mental/defi_tables_core.js");

function scriptDe(html) {
  const debut = html.indexOf("<script nonce=");
  return html.slice(html.indexOf("?>\">", debut) + 4, html.indexOf("</script>", debut));
}

test("la table des modèles ne porte que des réglages : ni nom d'élève, ni question, ni note", () => {
  const debut = bd.indexOf("CREATE TABLE IF NOT EXISTS modeles_evaluation (");
  assert.ok(debut > 0, "la table est au schéma");
  const corps = bd.slice(debut, bd.indexOf(')$fin"', debut));
  for (const interdit of ["prenom", "eleve", "code", "note", "question", "reponse", "graine"]) {
    assert.ok(!corps.includes(interdit), `modeles_evaluation n'a pas de colonne « ${interdit} »`);
  }
  assert.match(corps, /reglage VARCHAR\(600\) NOT NULL DEFAULT '\{\}'/, "un petit JSON de réglages");
  assert.match(corps, /nom VARCHAR\(40\)/, "un nom court");
  assert.match(bd, /ALTER TABLE directs ADD COLUMN reglage TEXT NULL/, "migrer.php ajoute la colonne « reglage » aux séances");
  assert.match(bd, /\$modelesAbsente = !table_existe\(\$pdo, 'modeles_evaluation'\);/, "et annonce la table créée");
});

test("les modèles sont sauvegardés, les séances (présences, réponses) jamais", () => {
  assert.match(sauvegarde, /const TABLES_SAUVEGARDEES = \[[^\]]*'modeles_evaluation'\]/, "les modèles vont dans la sauvegarde");
  assert.match(sauvegarde, /const TABLES_STRUCTURE_SEULE = \[[^\]]*'directs', 'directs_questions', 'directs_reponses'\]/, "les directs restent en structure seule");
  assert.ok(!/TABLES_SAUVEGARDEES = \[[^\]]*'directs/.test(sauvegarde), "aucune table directs* n'est sauvegardée");
});

test("le serveur ne connaît ni les questions ni la correction : il tire des graines, et c'est tout", () => {
  assert.match(lib, /'graine' => random_int\(0, 4294967295\),/, "la graine de l'évaluation est tirée par le serveur");
  assert.match(lib, /\$ligne = random_int\(0, 4294967295\) \. '\|' \. time\(\);/, "celle de l'élève aussi, avec son début");
  assert.ok(!/\$corps\['graine'\]/.test(apiEleve) && !/\$corps\['graine'\]/.test(lib), "jamais une graine reçue d'une page");
  for (const interdit of ["answer", "prompt", "bonne", "corrig", "note"]) {
    assert.ok(!new RegExp(`\\$[a-z]+\\['${interdit}'\\]`).test(lib), `lib/evaluation.php ne manipule pas « ${interdit} »`);
  }
  assert.match(lib, /const GARDE_APRES_FERMETURE_EVALUATION = 72000;/, "vingt heures de garde après la fermeture, puis la purge");
  assert.match(lib, /const DUREES_OUVERTURE_EVALUATION = \[1800, 3600, 7200\];/, "30 min, 1 h, 2 h");
  assert.match(lib, /ON CONFLICT\(direct_id, numero, eleve_id\) DO NOTHING/, "une réponse par numéro : la première arrivée reste");
  assert.ok(!/DO UPDATE SET reponse = excluded/.test(lib), "jamais remplacée");
  assert.match(lib, /if \(count\(\$deja\) \+ 1 !== \$numero\) return false;/, "la suivante seulement");
});

test("l'élève : ses gestes passent par le limiteur et par le type « entier » ; il ne reçoit aucun compteur", () => {
  const debut = apiEleve.indexOf("if ($direct['mode'] === 'evaluation') {");
  const fin = apiEleve.indexOf("// L'élève a rejoint la séance");
  const branche = apiEleve.slice(debut, fin);
  assert.match(branche, /if \(\$geste !== null\) \{\s*\/\/[^\n]*\n\s*limiter\('direct:' \. \$code, 120, 300\);/, "chaque geste est compté, pas l'interrogation");
  assert.match(branche, /reponse_direct\('entier', \['chiffres' => 3\], \$corps\['reponse'\]\)/, "la valeur passe par le type entier (trois chiffres)");
  assert.match(branche, /!fenetre_evaluation_close\(\$evaluation, \$presence\)/, "la fenêtre de l'élève est tenue par le serveur");
  assert.match(branche, /!evaluation_fermee\(\$evaluation\)/, "rien après la fermeture");
  const etatEleve = lib.slice(lib.indexOf("function etat_evaluation_pour_l_eleve"), lib.indexOf("function etat_evaluation_pour_la_classe"));
  for (const interdit of ["commences", "finis", "inscrits", "'graine' =>", "eleves"]) {
    assert.ok(!etatEleve.includes(interdit), `l'élève ne reçoit pas « ${interdit} »`);
  }
  assert.match(direct, /const TYPES_DIRECT = \['choix', 'entier'\];/);
  assert.match(direct, /case 'entier':\s*\/\/[^\n]*\n\s*\$texte = trim\(\$brute\);/, "un entier : des chiffres, rien d'autre");
});

test("la matrice des droits : les actions de classe en écriture, les modèles au compte, le journal", () => {
  for (const action of ["evaluation.etat", "evaluation.ouvrir", "evaluation.fermer", "evaluation.fichier", "evaluation.terminer"]) {
    assert.match(apiProf, new RegExp(`'${action.replace(".", "\\.")}' => 'ecriture',`), `${action} au droit écriture`);
    assert.match(apiProf, new RegExp(`case '${action.replace(".", "\\.")}':\\s*(//[^\\n]*\\n\\s*)*\\$classe = acces_classe\\(`), `${action} vérifie l'accès à la classe`);
  }
  for (const action of ["evaluation.modeles", "evaluation.enregistrer_modele", "evaluation.supprimer_modele"]) {
    assert.ok(!apiProf.includes(`'${action}' =>`), `${action} n'a pas de classe : hors matrice`);
    assert.match(apiProf, new RegExp(`case '${action.replace(".", "\\.")}':`));
  }
  assert.match(apiProf, /modele_du_prof\(\$pdo, \$profId, /, "le modèle ouvert est celui du professeur connecté");
  assert.match(journal, /'evaluation\.ouvrir', 'evaluation\.fermer', 'evaluation\.fichier', 'evaluation\.terminer',/, "quatre gestes au journal");
  assert.match(apiProf, /journaliser\(\$pdo, \$profId, 'evaluation\.fichier', 'classe', \(int\)\$classe\['id'\]\);/, "prendre le fichier est journalisé");
  // Une seule séance par classe, dans les deux sens.
  assert.match(apiProf, /if \(evaluation_de_la_classe\(\$pdo, \(int\)\$classe\['id'\]\) !== null\) \{\s*erreur\("Une évaluation est ouverte/, "pas de question éclair pendant une évaluation");
  assert.match(lib, /return \(\$existant\['mode'\] \?\? 'eclair'\) === 'evaluation' \? lire_evaluation\(\$existant\) : 'eclair';/, "pas d'évaluation pendant une question éclair");
});

test("Ma classe : la carte, ses boîtes, le noyau chargé d'ici, rien par innerHTML", () => {
  assert.match(page, /<script src="defi_tables_core\.js\?v=<\?= htmlspecialchars\(\$versionCore, ENT_QUOTES\) \?>"><\/script>/, "le noyau est relatif, version = empreinte");
  assert.match(page, /\$versionCore = is_file\(\$moteurCore\) \? substr\(md5_file\(\$moteurCore\), 0, 10\) : '0';/);
  assert.doesNotMatch(page, /<script[^>]+src="https?:\/\//, "aucun script d'un autre domaine");
  for (const id of ["bloc-evaluations", "evaluations-zone", "nouveau-modele", "evaluations-plein-ecran", "eval-modele", "eval-ouvrir", "em-grille", "eo-durees"]) {
    assert.ok(page.includes(`id="${id}"`), `la page porte #${id}`);
  }
  const script = scriptDe(page);
  const carte = script.slice(script.indexOf("Les évaluations (lot E1"), script.indexOf("Les records (lot du 09/10/2026)"));
  assert.ok(carte.length > 1000, "le script de la carte");
  assert.ok(!carte.includes("innerHTML"), "tout ce qui vient du serveur passe par textContent");
  assert.ok(carte.includes('api("evaluation.fichier"') && carte.includes("CORE.genererEvaluationDeClasse(contenu.modele, {seance: contenu.graine, eleve: eleve.graine})"),
    "la correction refait le tirage avec les graines reçues");
  assert.ok(carte.includes("CORE.corrigerEvaluationDeClasse(questions, eleve.reponses || {})"));
  assert.ok(carte.indexOf('await demander("Fermer l’évaluation') > 0 && carte.indexOf('await demander("Terminer ?') > 0, "fermer et terminer demandent confirmation");
  assert.ok(carte.includes('droitClasse !== "lecture"'), "la carte n'existe pas en lecture seule");
  // Le plein écran ne nomme personne.
  const plein = carte.slice(carte.indexOf("function ouvrirEvaluationPleinEcran"), carte.indexOf('$("evaluations-plein-ecran").addEventListener'));
  assert.ok(!/prenom|initiale/.test(plein), "le plein écran ne met aucun prénom dans le document");
});

// La fabrication du fichier, exécutée telle qu'elle est écrite dans la page.
function fabrique() {
  const script = scriptDe(page);
  const debut = script.indexOf("  function heureLisible(epoch) {");
  const finHeure = script.indexOf("  // « demain 6 h 03 »");
  const debutCsv = script.indexOf("  // Une cellule de tableur.");
  const fin = script.indexOf("  function telechargerTexte(");
  assert.ok(debut > 0 && finHeure > debut && debutCsv > finHeure && fin > debutCsv, "les fonctions du fichier sont dans la page");
  return new Function(script.slice(debut, finHeure) + script.slice(debutCsv, fin)
    + "\nreturn {celluleCsv, tempsLisible, fabriquerFichierEvaluation, nomDuFichierEvaluation};")();
}

const REGLAGE = {tables: [6, 7, 8], types: ["direct", "missing", "division"], n: 10, chrono: "question", secondes: 8, tirage: "memes", exclus: [], imposes: []};

function copies() {
  const graine = 4242;
  const faire = (prenom, initiale, eleveGraine, fausses, vides, atteintes = 10) => {
    const questions = C.genererEvaluationDeClasse(REGLAGE, {seance: graine, eleve: eleveGraine});
    const reponses = {};
    questions.slice(0, atteintes).forEach((q, i) => {
      reponses[String(q.numero)] = (vides.includes(i) ? "" : fausses.includes(i) ? String(q.answer + 1) : String(q.answer)) + "|" + (20 + i);
    });
    const eleve = {prenom, initiale, graine: eleveGraine, debut: Date.UTC(2026, 9, 15, 5, 12) / 1000, fini: atteintes === 10, reponses};
    return {eleve, copie: C.corrigerEvaluationDeClasse(questions, reponses), questions};
  };
  return [
    faire("Léa", "B", 1, [], []),
    faire("Noah", "", 2, [3], [7]),
    faire("=1+1", "X", 3, [], [], 4),
    {eleve: {prenom: "Zoé", initiale: "T", graine: null, debut: null, fini: false, reponses: {}}, copie: null},
    faire("Jean;\"Luc\"", "P", 5, [0, 1, 2, 3, 4, 5, 6, 7, 8], []),
  ];
}

test("le fichier : une ligne par élève — note sur 20, score, temps, début, le détail des ratés", () => {
  const f = fabrique();
  const liste = copies();
  const texte = f.fabriquerFichierEvaluation(liste);
  assert.ok(texte.startsWith("﻿"), "marque d'ordre des octets : Excel lit les accents");
  const lignes = texte.slice(1).split("\r\n");
  assert.equal(lignes[0], "Élève;Note sur 20;Score;Temps;Début;Calculs ratés");
  const heure = f.celluleCsv(new Date(liste[0].eleve.debut * 1000).getHours() + " h 12");
  assert.equal(lignes[1], `Léa B.;20;10 / 10;0 min 25 s;${heure};`, "tout juste : note 20, aucun raté");
  const noah = liste[1];
  const rate = noah.copie.rates;
  assert.equal(rate.length, 2);
  assert.equal(lignes[2], `Noah;16;8 / 10;0 min 25 s;${heure};${rate[0].prompt} → ${rate[0].donnee} · ${rate[1].prompt} → —`,
    "une réponse fausse montre ce qui a été tapé, une absence de réponse un tiret");
  assert.match(lignes[3], /^'=1\+1 X\.;8;4 \/ 10 \(4 répondues\);0 min 09 s;/, "un prénom qui ressemble à une formule est neutralisé ; une copie inachevée le dit");
  assert.equal(lignes[4], "Zoé T.;;n’a pas fait l’évaluation;;;", "sans graine : il n'a pas fait l'évaluation");
  assert.match(lignes[5], /^"Jean;""Luc"" P\.";2;1 \/ 10;/, "point-virgule et guillemets protégés ; 1/10 → 2");
  assert.equal(lignes[6], "", "le fichier finit par un retour à la ligne");
});

test("la note dans le fichier est au demi-point, avec la virgule française", () => {
  const f = fabrique();
  const questions = C.genererEvaluationDeClasse({...REGLAGE, n: 15}, {seance: 1, eleve: 1});
  const reponses = {};
  questions.forEach((q, i) => { reponses[String(q.numero)] = (i < 13 ? String(q.answer) : "0") + "|10"; });
  const copie = C.corrigerEvaluationDeClasse(questions, reponses);
  assert.equal(copie.note, 17.5);
  const texte = f.fabriquerFichierEvaluation([{eleve: {prenom: "Tom", initiale: "", graine: 1, debut: 0, fini: true, reponses}, copie}]);
  assert.match(texte.split("\r\n")[1], /^Tom;17,5;13 \/ 15;/);
});

test("le nom du fichier : la classe, le jour, le modèle, rien qui gêne Windows", () => {
  const {nomDuFichierEvaluation} = fabrique();
  assert.equal(nomDuFichierEvaluation({classe: {libelle: "4e B / élèves"}, jour: "2026-10-15", nom: "Tables 2 à 9 — rapide"}),
    "evaluation-tables-4e-B-eleves-2026-10-15-Tables-2-a-9-rapide.csv");
  assert.equal(nomDuFichierEvaluation({classe: {libelle: ""}, jour: "pas une date", nom: ""}), "evaluation-tables-classe.csv");
});

test("tempsLisible : minutes et secondes", () => {
  const {tempsLisible} = fabrique();
  assert.equal(tempsLisible(0), "0 min 00 s");
  assert.equal(tempsLisible(955), "1 min 36 s");
  assert.equal(tempsLisible(3600 * 10), "60 min 00 s");
});
