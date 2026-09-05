import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Lot 11 du suivi (05/09/2026) — hygiène du serveur.
//
// Ce fichier garde ce qui se vérifie EN LISANT le code : la matrice des droits
// est complète et personne ne l'a contournée, les fichiers qui ne doivent pas
// sortir par HTTP sont refusés, les pages ne recopient plus de message
// technique, et la documentation dit ce que le code fait. Le comportement
// (qui obtient 200, 403 ou 404) est éprouvé pour de vrai par
// `_serveur/tests/lancer.php`, section « lot 11 — matrice ».
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) ajouter une action de classe sans l'inscrire dans DROIT_PAR_ACTION
//  b) réécrire acces_classe(…, 'ecriture') en dur dans un cas
//  c) remettre eleves.supprimer ou classes.modifier en « ecriture »
//  d) enlever header_remove('X-Powered-By')
//  e) rendre VERSION servable par HTTP
//  f) recopier $e->getMessage() dans installer.php
//  g) remettre « il voit le tableau et les codes » dans le README
//  h) remettre « seule ta sauvegarde » dans la confirmation de suppression

const prof = lire("_serveur/public/api/prof.php");

// La table telle qu'elle est écrite dans le code : { action: droit }.
function matriceDuCode() {
  const debut = prof.indexOf("const DROIT_PAR_ACTION = [");
  assert.ok(debut > 0, "api/prof.php doit définir DROIT_PAR_ACTION");
  const fin = prof.indexOf("];", debut);
  const bloc = prof.slice(debut, fin);
  const table = {};
  for (const [, action, droit] of bloc.matchAll(/'([a-z.]+)'\s*=>\s*'(lecture|ecriture|proprietaire)'/g)) {
    table[action] = droit;
  }
  return table;
}

function actionsAdminDuCode() {
  const debut = prof.indexOf("const ACTIONS_ADMIN = [");
  assert.ok(debut > 0, "api/prof.php doit définir ACTIONS_ADMIN");
  const bloc = prof.slice(debut, prof.indexOf("];", debut));
  return [...bloc.matchAll(/'([a-z.]+)'/g)].map((m) => m[1]);
}

// Les actions qui ne portent sur aucune classe : elles n'ont rien à faire dans
// la matrice. Toute NOUVELLE action devra être ajoutée ici en connaissance de
// cause, ou entrer dans la matrice.
const SANS_CLASSE = ["connexion", "deconnexion", "moi", "profs.motdepasse",
  "profs.annuaire", "classes.liste", "classes.creer"];

test("la matrice décrit exactement les droits décidés le 05/09/2026", () => {
  assert.deepEqual(matriceDuCode(), {
    "tableau": "lecture",
    "partages.liste": "lecture",
    "eleves.fiche": "lecture",
    "eleves.ajouter": "ecriture",
    "eleves.nommer": "ecriture",
    "eleves.regenerer": "ecriture",
    "eleves.restaurer": "ecriture",
    "classes.modifier": "proprietaire",
    "classes.supprimer": "proprietaire",
    "eleves.supprimer": "proprietaire",
    "partages.ajouter": "proprietaire",
    "partages.supprimer": "proprietaire",
  });
});

test("toute action de l'API est dans la matrice, dans les actions d'administration, ou déclarée sans classe", () => {
  const matrice = matriceDuCode();
  const admin = actionsAdminDuCode();
  const cas = [...prof.matchAll(/^\s*case '([a-z.]+)':/gm)].map((m) => m[1]);
  assert.ok(cas.length >= 20, `le switch devrait avoir une vingtaine de cas (trouvé ${cas.length})`);
  for (const action of cas) {
    assert.ok(
      action in matrice || admin.includes(action) || SANS_CLASSE.includes(action),
      `« ${action} » n'est nulle part : ajoute-la à DROIT_PAR_ACTION, à ACTIONS_ADMIN, ou à SANS_CLASSE de ce test`);
  }
});

test("aucun droit n'est écrit en dur : les contrôles passent par la matrice", () => {
  // acces_classe() reçoit soit droit_requis($action), soit — pour les fonctions
  // internes — un droit littéral dans leur propre définition. On n'accepte le
  // littéral que dans la signature de la fonction, pas dans un cas du switch.
  const casEnDur = [...prof.matchAll(/case '[a-z.]+':[\s\S]{0,400}?acces_classe\([^)]*'(lecture|ecriture|proprietaire)'\)/g)];
  assert.equal(casEnDur.length, 0,
    `un cas du switch choisit son droit lui-même au lieu de lire la matrice : ${casEnDur.map((m) => m[0].slice(0, 60))}`);
  assert.ok(/eleve_pour_action\(PDO \$pdo, int \$profId, mixed \$eleveIdBrut, string \$action\)/.test(prof),
    "les actions sur un élève passent par eleve_pour_action(), qui lit la matrice");
  assert.ok(!/function eleve_modifiable\(/.test(prof) && !/function eleve_lisible\(/.test(prof),
    "les deux anciennes fonctions, qui figeaient le droit, doivent avoir disparu");
});

test("les quotas existent et sont comptés dans la même transaction que les créations", () => {
  assert.ok(/const MAX_CLASSES_PAR_PROF = \d+;/.test(prof), "quota de classes par professeur");
  assert.ok(/const MAX_ELEVES_PAR_CLASSE = \d+;/.test(prof), "quota d'élèves par classe");
  const ajouter = prof.slice(prof.indexOf("case 'eleves.ajouter':"), prof.indexOf("case 'eleves.nommer':"));
  const posTransaction = ajouter.indexOf("transaction_ouvrir");
  const posCompte = ajouter.indexOf("MAX_ELEVES_PAR_CLASSE");
  assert.ok(posTransaction > 0 && posCompte > posTransaction,
    "le compte des élèves doit être fait APRÈS l'ouverture de la transaction, sinon deux demandes simultanées passent");
  assert.ok(/SELECT COUNT\(\*\) FROM eleves WHERE classe_id = \?' \. pour_mise_a_jour\(\$pdo\)/.test(ajouter),
    "et par une lecture verrouillée, sinon MySQL rend l'instantané du début de transaction");
});

test("le secret des compteurs n'est jamais le mot de passe d'installation lui-même", () => {
  const limite = lire("_serveur/public/lib/limite.php");
  const fonction = limite.slice(limite.indexOf("function secret_compteurs()"),
    limite.indexOf("function secret_compteurs_dedie()"));
  assert.ok(/hash_hmac\('sha256', '[^']+', \(string\)\(\$c\['jeton_installation'\] \?\? ''\)\)/.test(fonction),
    "sans « secret » dans config.php, il doit être DÉRIVÉ du jeton par HMAC");
  assert.ok(!/\$secret = \(string\)\(\$c\['jeton_installation'\]/.test(fonction),
    "le jeton d'installation ne doit plus servir tel quel de secret");
  assert.ok(/inet_pton/.test(limite) && /\/64/.test(limite),
    "adresse_limitee() doit regrouper les adresses IPv6 par bloc /64");
});

test("PHP n'annonce plus sa version", () => {
  assert.ok(/header_remove\('X-Powered-By'\);/.test(lire("_serveur/public/lib/entetes.php")),
    "lib/entetes.php doit retirer X-Powered-By sur chaque réponse");
});

test("verifier.php freine les essais de mot de passe, et ne compte que les échecs", () => {
  const page = lire("_serveur/public/verifier.php");
  assert.ok(/const ESSAIS_VERIFIER = 12;/.test(page), "douze essais");
  assert.ok(/const FENETRE_ESSAIS_VERIFIER = 600;/.test(page), "par dix minutes");
  const bloc = page.slice(page.indexOf("adresse_limitee()"), page.indexOf("$autorise = true;"));
  assert.ok(/incorrect/.test(bloc) && bloc.indexOf("compter('verifier:") < bloc.indexOf("incorrect"),
    "le compteur n'avance que sur un mot de passe faux");
});

test("les fichiers qui ne doivent pas sortir par HTTP sont refusés par .htaccess", () => {
  const htaccess = lire("_serveur/public/.htaccess");
  assert.ok(/<Files "config\.php">[\s\S]*?Require all denied/.test(htaccess), "config.php");
  assert.ok(/<Files "VERSION">[\s\S]*?Require all denied/.test(htaccess),
    "VERSION donne la liste de tous les fichiers du serveur : il se lit sur le disque, pas par HTTP");
  assert.ok(/\\\.user\\\.ini/.test(htaccess), "un .user.ini éventuel");
});

test("installer.php ne recopie plus le message brut d'une exception", () => {
  const page = lire("_serveur/public/installer.php");
  assert.ok(!/\$message = "Erreur : " \. \$e->getMessage\(\)/.test(page),
    "une exception PDO cite l'hôte, la base et l'utilisateur : elle ne va pas dans la page");
  assert.ok(/error_log\('installer: ' \. \$e->getMessage\(\)\);/.test(page),
    "le détail va au journal du serveur");
});

test("un prénom est nettoyé à l'entrée, et une date de progression doit être une vraie date", () => {
  assert.ok(/function texte_prenom\(/.test(prof), "api/prof.php doit filtrer le prénom à l'entrée");
  const nommer = prof.slice(prof.indexOf("case 'eleves.nommer':"), prof.indexOf("case 'eleves.regenerer':"));
  assert.ok(!/[^_]texte\(\$corps\['prenom'\]/.test(nommer), "« eleves.nommer » doit passer par texte_prenom()");
  const progression = lire("_serveur/public/lib/progression.php");
  assert.ok(/checkdate\(/.test(progression), "lib/progression.php doit vérifier une vraie date");
  assert.ok(!/preg_match\('\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/', \$valeur\)/.test(progression),
    "la seule vérification de forme ne suffit plus");
});

test("la réponse élève ne publie plus la description du filtre de progression", () => {
  const applis = lire("_serveur/public/lib/applis.php");
  assert.ok(/const CHAMPS_AFFICHES_APPLI = \['nom', 'description', 'url', 'ancre', 'disponible'\];/.test(applis),
    "seuls les champs d'affichage sortent");
  assert.ok(!/\['cle' => \$cle\] \+ CATALOGUE_APPLIS\[\$cle\]/.test(applis),
    "l'entrée entière du catalogue ne doit plus être recopiée dans la réponse");
});

test("le README dit ce que le code fait, pour la lecture comme pour l'écriture", () => {
  const readme = lire("_serveur/README.md");
  assert.ok(!/il voit le tableau et les codes/.test(readme),
    "en lecture seule, le serveur ne donne AUCUN code : le README ne doit plus le promettre");
  assert.ok(/\*\*sans les codes\*\*/.test(readme), "et doit le dire");
  assert.ok(/DROIT_PAR_ACTION/.test(readme), "le README renvoie à la table des droits");
});

test("la confirmation de suppression d'une classe ne promet pas la sauvegarde d'un autre, et compte les vrais prénoms", () => {
  const page = lire("_serveur/public/prof/index.php");
  assert.ok(!/seule ta sauvegarde/.test(page),
    "le propriétaire d'une classe partagée n'est pas forcément celui qui fait les sauvegardes");
  assert.ok(/seule la sauvegarde du mois/.test(page), "le texte corrigé");
  assert.ok(/function combienDePrenoms\(\)/.test(page),
    "la confirmation doit compter les prénoms saisis, pas les élèves");
  const bloc = page.slice(page.indexOf('$("supprimer-classe").addEventListener'));
  assert.ok(!/Les \$\{eleves\.length\} prénom/.test(bloc),
    "« Les 3 prénoms » dans une classe de 3 élèves dont 2 nommés était faux");
});
