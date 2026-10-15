import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Énumération des comptes : ce qui l'empêche est dans le CODE, pas dans un chronomètre
// ------------------------------------------------------------------------------------
// Sans précaution, une page de connexion raconte qui existe. Un identifiant
// inconnu est refusé tout de suite ; un identifiant connu au mauvais mot de
// passe attend le calcul du bcrypt — deux cents millisecondes de plus. Qui
// mesure apprend, un nom à la fois, la liste des professeurs du collège.
//
// ouvrir_session() ferme cette porte en calculant TOUJOURS un bcrypt : contre
// le hachage du compte quand il existe, contre un hachage de remplacement
// sinon — un vrai bcrypt, au coût des comptes, qu'aucun mot de passe ne
// satisfait. Le compte désactivé, lui, est refusé APRÈS ce calcul. Les trois
// refus prennent donc le même temps et disent la même phrase.
//
// Ce fichier ne mesure RIEN : il lit le code et vérifie que l'ordre y est.
// C'est un choix, et il a une raison. Les mesures de temps, elles, vivent dans
// _serveur/tests/lancer.php et ne tournent qu'au rendez-vous hebdomadaire
// (SUIVI_TESTS_TEMPS=1) : sur une machine partagée, un chronomètre rougit au
// hasard — dix-neuf fois en cinq jours, sur des pull requests qui ne
// touchaient pas au serveur. Une mesure constate un symptôme et se trompe
// souvent ; la lecture du code établit la cause et ne se trompe jamais. Les
// deux sont gardées : celle-ci à chaque pull request, l'autre le dimanche.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) sortir plus tôt quand l'identifiant est inconnu (un « return » avant le bcrypt)
//  b) regarder « actif » avant password_verify()
//  c) remplacer HASH_DE_REMPLACEMENT par un hachage mal formé, ou d'un autre coût
//  d) donner au compte désactivé un message ou un code de refus qui lui soit propre

const AUTH = lire("_serveur/public/lib/auth.php");
const API = lire("_serveur/public/api/prof.php");

// Les commentaires retirés. Sans cette précaution, ce fichier-ci mentirait :
// le commentaire de ouvrir_session() dit « pour que password_verify() prenne
// le même temps », et une recherche naïve de « password_verify( » tombait sur
// cette phrase — placée AVANT le code — au lieu de l'appel. Deux sabotages
// passaient alors au vert.
function sansCommentaires(php) {
  return php
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((ligne) => !ligne.trim().startsWith("//"))
    .join("\n");
}

// Le corps de ouvrir_session(), de sa signature à son accolade fermante en
// colonne 1 — la façon dont ce fichier écrit ses fonctions.
function corpsDeOuvrirSession() {
  const debut = AUTH.indexOf("function ouvrir_session(");
  assert.ok(debut >= 0, "ouvrir_session() doit exister dans lib/auth.php");
  const fin = AUTH.indexOf("\n}\n", debut);
  assert.ok(fin > debut, "la fin de ouvrir_session() doit être repérable");
  return sansCommentaires(AUTH.slice(debut, fin));
}

// La porte par laquelle ouvrir_session() refuse : la condition du « if » qui
// garde le « return null; », et ce qui les sépare. Les parenthèses sont
// comptées plutôt que devinées — « (int)$prof['actif'] » en contient.
function porteDuRefus(corps) {
  const iRetour = corps.indexOf("return null;");
  assert.ok(iRetour > 0, "ouvrir_session() doit refuser par « return null; »");
  const avant = corps.slice(0, iRetour);
  // Le mot « if », pas la suite de lettres : « actif » en contient un, et
  // « password_verify » aussi. C'est « if » suivi d'une parenthèse qu'on veut.
  const sis = [...avant.matchAll(/\bif\s*\(/g)];
  assert.ok(sis.length > 0, "le « return null; » doit être gardé par un « if »");
  const dernier = sis[sis.length - 1];
  const iOuvre = dernier.index + dernier[0].length - 1;
  let profondeur = 0;
  let i = iOuvre;
  for (; i < avant.length; i++) {
    if (avant[i] === "(") profondeur++;
    else if (avant[i] === ")" && --profondeur === 0) break;
  }
  assert.equal(profondeur, 0, "les parenthèses de la condition doivent être équilibrées");
  return { condition: avant.slice(iOuvre + 1, i), entreDeux: avant.slice(i + 1) };
}

test("le hachage de remplacement est un vrai bcrypt, au coût des comptes", () => {
  const cout = AUTH.match(/const COUT_BCRYPT = (\d+);/);
  assert.ok(cout, "COUT_BCRYPT doit être déclaré dans lib/auth.php");
  const remplacement = AUTH.match(/const HASH_DE_REMPLACEMENT = '([^']+)';/);
  assert.ok(remplacement, "HASH_DE_REMPLACEMENT doit être déclaré dans lib/auth.php");
  const hash = remplacement[1];
  assert.equal(hash.length, 60, `un bcrypt fait 60 caractères, celui-ci en fait ${hash.length}`);
  assert.match(hash, /^\$2y\$\d{2}\$[./A-Za-z0-9]{53}$/,
    "le hachage de remplacement doit être un bcrypt BIEN FORMÉ : mal formé, PHP le refuse "
      + "sans rien calculer, et le refus d'un identifiant inconnu redevient deux fois plus rapide");
  assert.equal(hash.slice(4, 6), String(cout[1]).padStart(2, "0"),
    `le hachage de remplacement doit porter le coût des comptes (${cout[1]}) : un coût plus `
      + "faible se calcule plus vite, et la différence se mesure");
});

test("un identifiant inconnu ne ressort jamais avant le calcul du bcrypt", () => {
  const corps = corpsDeOuvrirSession();
  const iCherche = corps.indexOf("->fetch()");
  const iVerifie = corps.indexOf("password_verify(");
  assert.ok(iCherche > 0, "ouvrir_session() doit lire le compte en base");
  assert.ok(iVerifie > iCherche, "password_verify() doit venir après la lecture du compte");
  const entreLesDeux = corps.slice(iCherche, iVerifie);
  assert.doesNotMatch(entreLesDeux, /\breturn\b/,
    "aucune sortie entre la lecture du compte et password_verify() : un « return » ici "
      + "renverrait un identifiant inconnu sans calcul, et le chronomètre dirait qu'il n'existe pas");
  assert.match(corps, /\$hash = \$prof\['mdp_hash'\] \?\? HASH_DE_REMPLACEMENT;/,
    "quand le compte n'existe pas, c'est le hachage de remplacement qui est vérifié");
});

test("« actif » n'est regardé qu'APRÈS le calcul du bcrypt", () => {
  const corps = corpsDeOuvrirSession();
  const iVerifie = corps.indexOf("password_verify(");
  const iActif = corps.indexOf("'actif'");
  assert.ok(iActif > 0, "ouvrir_session() doit vérifier que le compte est actif");
  assert.ok(iActif > iVerifie,
    "le test « actif » doit venir APRÈS password_verify() : avant, un compte désactivé serait "
      + "refusé sans calcul, et le chronomètre dirait qu'il existe encore");
  // Et le refus est le même pour les trois cas : mauvais mot de passe, compte
  // inconnu, compte désactivé — une seule porte de sortie, pas trois. Ce qui
  // compte est la STRUCTURE, pas la façon de l'écrire : les trois raisons
  // réunies par des « ou », un unique « return null », et rien d'autre entre
  // les deux. La mise en page, les espaces et l'ordre des termes sont libres.
  assert.equal(corps.split("return null;").length - 1, 1,
    "ouvrir_session() ne doit avoir QU'UNE seule sortie en refus : deux « return null » à des "
      + "endroits différents, ce sont deux chemins de durées différentes");
  const { condition, entreDeux } = porteDuRefus(corps);
  assert.equal(entreDeux.trim(), "{",
    "le « return null; » doit être le corps direct de ce « if » — rien ne doit s'intercaler");
  const serree = condition.replace(/\s+/g, "");
  for (const [terme, pourquoi] of [
    ["!$bon", "le mot de passe doit être faux"],
    ["$prof===false", "ou le compte ne doit pas exister"],
    ["(int)$prof['actif']!==1", "ou le compte doit être désactivé"],
  ]) {
    assert.ok(serree.includes(terme),
      `la porte du refus doit contenir « ${terme} » (${pourquoi}) — trouvé : « ${condition.trim()} »`);
  }
  assert.equal(serree.split("||").length - 1, 2,
    "les trois raisons doivent être réunies par des « ou » dans la MÊME condition : séparées, "
      + "elles redeviennent trois sorties de durées différentes");
});

test("l'API refuse les trois cas avec le même message et le même code", () => {
  const debut = API.indexOf("if ($action === 'connexion') {");
  assert.ok(debut > 0, "api/prof.php doit traiter l'action « connexion »");
  const fin = API.indexOf("\n    if ($profId === null) {", debut);
  assert.ok(fin > debut, "la fin du bloc « connexion » doit être repérable");
  const bloc = sansCommentaires(API.slice(debut, fin));
  assert.ok(bloc.includes("ouvrir_session("), "le bloc « connexion » doit appeler ouvrir_session()");
  const refus = [...bloc.matchAll(/erreur\(\s*("(?:[^"\\]|\\.)*")\s*,\s*(\d{3})\s*\)/g)];
  assert.equal(refus.length, 1,
    `un seul refus doit exister dans le bloc « connexion » (trouvé : ${refus.length}) — deux `
      + "messages, ce sont deux réponses à distinguer de dehors");
  assert.equal(refus[0][1], '"Identifiant ou mot de passe incorrect."',
    "le message ne doit rien dire du compte");
  assert.equal(refus[0][2], "401", "le code doit être 401 dans les trois cas");
});

test("les mesures de temps du serveur ne tournent que sur demande, et une seule façon de mesurer", () => {
  const lancer = sansCommentaires(lire("_serveur/tests/lancer.php"));
  assert.match(lancer, /function mediane_ms\(callable \$appel, int \$mesures = 5\): float/,
    "lancer.php doit offrir UNE façon de mesurer un temps : mediane_ms()");
  assert.match(lancer, /function mesures_de_temps_demandees\(\): bool/,
    "lancer.php doit dire quand les mesures sont demandées");
  assert.match(lancer, /getenv\('SUIVI_TESTS_TEMPS'\) === '1'/,
    "la demande passe par SUIVI_TESTS_TEMPS=1");
  // Plus aucun chronomètre en millisecondes hors de mediane_ms() : c'est ce qui
  // garantit qu'on ne rajoutera pas, demain, une mesure isolée qui rougira.
  const enMs = [...lancer.matchAll(/\(hrtime\(true\) - \$debut\) \/ 1e6/g)];
  assert.equal(enMs.length, 1,
    `une seule mesure en millisecondes doit exister, celle de mediane_ms() (trouvé : ${enMs.length})`);
  // Une borne HAUTE (« moins de… ») sur un chronomètre qui tourne à chaque pull
  // request doit passer par plus_court_de_trois() : une mesure isolée y rougit
  // au hasard (1,07 s pour le 61e échec de parcours.php, PR 967, 11/10/2026).
  // Une borne basse, elle, peut rester sur un seul essai : le bruit n'abrège
  // jamais un usleep().
  assert.match(lancer, /function plus_court_de_trois\(callable \$preparer, callable \$appel, &\$resultats\): float/,
    "lancer.php doit offrir plus_court_de_trois() pour les bornes hautes");
  assert.equal([...lancer.matchAll(/\/ 1e9 </g)].length, 0,
    "aucune borne haute directement sur hrtime() : passer par plus_court_de_trois()");
  const bornesHautes = [...lancer.matchAll(/vrai\(\$duree </g)];
  assert.ok(bornesHautes.length >= 4, `les bornes hautes doivent être repérées (trouvé : ${bornesHautes.length})`);
  for (const borne of bornesHautes) {
    const avant = lancer.slice(0, borne.index);
    const mesure = avant.slice(avant.lastIndexOf("$duree = "));
    assert.ok(mesure.startsWith("$duree = plus_court_de_trois("),
      `borne haute sur une mesure isolée : « ${mesure.split("\n")[0]} » — passer par plus_court_de_trois()`);
  }
  // Le workflow ne la pose que hors pull request.
  const workflow = lire(".github/workflows/verifications.yml");
  const poses = [...workflow.matchAll(/SUIVI_TESTS_TEMPS: (.+)/g)].map(([, v]) => v.trim());
  assert.equal(poses.length, 2, "les deux jobs serveur doivent poser SUIVI_TESTS_TEMPS");
  for (const pose of poses) {
    assert.match(pose, /github\.event_name == 'schedule'/,
      "SUIVI_TESTS_TEMPS ne vaut 1 qu'au rendez-vous hebdomadaire…");
    assert.match(pose, /github\.event_name == 'workflow_dispatch'/,
      "…et sur lancement à la main — jamais sur une pull request");
  }
});
