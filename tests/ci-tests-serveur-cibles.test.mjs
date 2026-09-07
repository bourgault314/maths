import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Les tests du serveur ne tournent plus sur toutes les pull requests
// -------------------------------------------------------------------
// Depuis le 07/09/2026, le job « changements » de .github/workflows/verifications.yml
// tient une liste : les tests du serveur de suivi ne sont lancés que si l'un de
// ces chemins bouge. Sur une pull request qui ne touche qu'un outil du site,
// les deux coches « serveur » sont sautées.
//
// Cette liste a un défaut de naissance : elle est écrite à la main, dans un
// autre fichier que celui qu'elle décrit. Le jour où quelqu'un ajoute dans
// _serveur/tests/lancer.php une lecture d'un fichier du dépôt — comme la
// comparaison du moteur de Défi tables, ou celle du logo — et oublie de
// l'ajouter à la liste, la CI cesse silencieusement de vérifier quelque chose.
// Rien ne rougirait : les tests seraient simplement… sautés.
//
// Ce fichier ferme ce trou. Il RELÈVE dans lancer.php chaque chemin qui sort de
// _serveur/, et exige que chacun soit couvert par la liste du workflow. Il
// tourne dans « node --test », donc dans le job « verifications », qui n'est
// jamais sauté.
//
// Sabotage attendu (rend ce test rouge) :
//  - ajouter dans lancer.php une lecture de dirname($racine) . '/outils/exemple.js'
//    sans ajouter outils/exemple.js à la liste du workflow.

const LANCER = "_serveur/tests/lancer.php";
const WORKFLOW = ".github/workflows/verifications.yml";

// Les entrées de premier niveau du dépôt : c'est ce qui permet de distinguer un
// chemin du dépôt d'une adresse servie par le serveur de test. « /assets/… »
// et « /favicon.svg » commencent par une entrée qui existe ici ; « /api/prof.php »
// et « /prof/ » non — le dépôt n'a ni dossier « api », ni dossier « prof ».
const PREMIER_NIVEAU = new Set(readdirSync(racine));

function sansCommentaires(php) {
  return php
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((ligne) => !ligne.trim().startsWith("//"))
    .join("\n");
}

// Les blocs « verifier("…", function … { … }); » qui se servent de la racine du
// dépôt. $racine vaut _serveur/ ; en sortir demande dirname($racine) ou la
// variable $depot que lancer.php en tire.
function blocsQuiSortentDeServeur() {
  const source = sansCommentaires(lire(LANCER));
  const blocs = [];
  let depart = 0;
  for (;;) {
    const debut = source.indexOf("\nverifier(", depart);
    if (debut < 0) break;
    const fin = source.indexOf("\n});\n", debut);
    if (fin < 0) break;
    const bloc = source.slice(debut, fin);
    if (bloc.includes("dirname($racine)") || bloc.includes("$depot")) blocs.push(bloc);
    depart = fin;
  }
  return blocs;
}

// Dans ces blocs, tout littéral de chaîne qui commence par « / » et dont le
// premier segment est une entrée du dépôt : c'est un fichier du dépôt que les
// tests du serveur vont lire.
function cheminsDuDepotLus() {
  const trouves = new Set();
  for (const bloc of blocsQuiSortentDeServeur()) {
    for (const [, litteral] of bloc.matchAll(/['"](\/[^'"\n]*)['"]/g)) {
      const chemin = litteral.replace(/^\/+/, "");
      const segment = chemin.split("/")[0];
      if (!segment || segment === "_serveur") continue;
      if (PREMIER_NIVEAU.has(segment)) trouves.add(chemin);
    }
  }
  return [...trouves].sort();
}

// La liste du job « changements », telle qu'elle est écrite dans le workflow :
//   motif='^_serveur/'
//   motif="$motif"'|^outils/calcul_mental/defi_tables_mon_parcours\.js$'
function listeDuWorkflow() {
  const workflow = lire(WORKFLOW);
  const alternatives = [...workflow.matchAll(/motif=(?:"\$motif")?'\|?(\^[^']+)'/g)].map(([, m]) => m);
  assert.ok(alternatives.length >= 3,
    `le job « changements » doit construire un motif (trouvé : ${alternatives.length} morceaux)`);
  return alternatives;
}

test("le job « changements » couvre chaque fichier du dépôt que les tests du serveur lisent", () => {
  const cibles = cheminsDuDepotLus();
  // Si le relevé ne trouve plus rien, ce n'est pas que tout va bien : c'est que
  // ce test ne garde plus rien. Le moteur de Défi tables et les cinq images du
  // lot 7 doivent en faire partie.
  assert.ok(cibles.length >= 6,
    `le relevé doit trouver au moins six fichiers du dépôt dans ${LANCER} `
      + `(trouvé : ${cibles.length} — ${cibles.join(", ") || "aucun"})`);
  assert.ok(cibles.includes("outils/calcul_mental/defi_tables_mon_parcours.js"),
    "le moteur de Défi tables doit être relevé : lancer.php le compare octet pour octet");

  const alternatives = listeDuWorkflow().map((motif) => new RegExp(motif));
  const oublies = cibles.filter((chemin) => !alternatives.some((regle) => regle.test(chemin)));
  assert.deepEqual(oublies, [],
    `${LANCER} lit ${oublies.join(", ")} — mais le job « changements » de ${WORKFLOW} ne le `
      + "déclenche pas. Sans cette ligne, une pull request qui touche ce fichier verrait les "
      + "tests du serveur SAUTÉS, et personne ne saurait qu'ils auraient rougi. Ajoute-le au "
      + "motif du job « changements ».");
});

test("la liste du workflow déclenche aussi sur _serveur/ et sur les workflows eux-mêmes", () => {
  const alternatives = listeDuWorkflow().map((motif) => new RegExp(motif));
  const couvert = (chemin) => alternatives.some((regle) => regle.test(chemin));
  assert.ok(couvert("_serveur/tests/lancer.php"), "tout _serveur/ doit déclencher les tests du serveur");
  assert.ok(couvert("_serveur/public/lib/auth.php"), "y compris le code du serveur");
  assert.ok(couvert(".github/workflows/verifications.yml"),
    "changer le workflow, c'est changer la façon dont ces tests sont lancés : il doit déclencher");
  assert.ok(couvert(".github/workflows/publier.yml"), "l'autre workflow aussi");
  // Et il ne déclenche pas sur ce qui ne le regarde pas — sinon le tri ne sert à rien.
  assert.ok(!couvert("outils/splat.html"), "un outil du site ne doit pas déclencher les tests du serveur");
  assert.ok(!couvert("tests/splat-investigate-flow.test.mjs"),
    "un test Node ne doit pas les déclencher : il tourne dans « verifications », qui n'est jamais sauté");
  assert.ok(!couvert("index.html"), "l'accueil non plus");
});

test("le job « changements » retombe sur « tout lancer » en cas de doute", () => {
  const workflow = lire(WORKFLOW);
  const debut = workflow.indexOf("Décider si les tests du serveur doivent tourner");
  assert.ok(debut > 0, "l'étape de tri doit exister dans le workflow");
  const etape = workflow.slice(debut, workflow.indexOf("\n  verifications:", debut));
  // Hors pull request — mise à jour de main, rendez-vous hebdomadaire, lancement
  // à la main — rien n'est trié : tout tourne.
  assert.match(etape, /\[ "\$EVENEMENT" = "pull_request" \] \|\| tout /,
    "hors pull request, les tests du serveur doivent tourner sans condition");
  // Et si le diff ne peut pas être calculé, on lance tout plutôt que de sauter.
  for (const garde of ["git cat-file -e \"$BASE", "git cat-file -e \"$TETE", "git merge-base", "git diff --name-only"]) {
    const ligne = etape.split("\n").find((l) => l.includes(garde));
    assert.ok(ligne, `l'étape de tri doit passer par « ${garde} »`);
    assert.match(ligne, /\|\| tout /,
      `« ${garde} » doit retomber sur « tout lancer » en cas d'échec : mieux vaut une minute `
        + "de trop qu'un contrôle sauté par erreur");
  }
});

test("les deux jobs serveur sont conditionnés, et leurs noms de coche ne bougent pas", () => {
  const workflow = lire(WORKFLOW);
  for (const [job, coche] of [["serveur-sqlite", "serveur (SQLite)"], ["serveur-mysql", "serveur (MySQL)"]]) {
    const debut = workflow.indexOf(`\n  ${job}:`);
    assert.ok(debut > 0, `le job ${job} doit exister`);
    const entete = workflow.slice(debut, debut + 400);
    assert.match(entete, new RegExp(`name: ${coche.replace(/[()]/g, "\\$&")}`),
      `la coche « ${coche} » est exigée par le ruleset de main : son nom ne doit pas changer`);
    assert.match(entete, /needs: changements/, `${job} doit attendre le tri`);
    assert.match(entete, /if: needs\.changements\.outputs\.serveur == 'true'/,
      `${job} ne doit tourner que si le tri le demande`);
  }
  // « verifications », lui, n'est jamais conditionné : les tests Node tournent
  // sur toutes les pull requests, y compris celles où le serveur est sauté.
  const verifications = workflow.slice(workflow.indexOf("\n  verifications:"),
    workflow.indexOf("\n  serveur-sqlite:"));
  assert.doesNotMatch(verifications, /^\s+if:/m,
    "le job « verifications » ne doit jamais être conditionné");
  assert.doesNotMatch(verifications, /^\s+needs:/m,
    "ni dépendre du tri : il doit tourner même si le job « changements » échoue");
});

test("le passage complet a son rendez-vous : chaque dimanche, et à la demande", () => {
  const workflow = lire(WORKFLOW);
  const declencheurs = workflow.slice(workflow.indexOf("\non:"), workflow.indexOf("\njobs:"));
  assert.match(declencheurs, /schedule:\s*\n\s*- cron: "0 18 \* \* 0"/,
    "un rendez-vous hebdomadaire (dimanche 18:00 UTC = 22 h à La Réunion) doit tout rejouer");
  assert.match(declencheurs, /workflow_dispatch:/,
    "et « Run workflow » doit permettre de le déclencher à la main");
  assert.match(declencheurs, /pull_request:/, "les pull requests restent vérifiées");
  assert.match(declencheurs, /push:\s*\n\s*branches: \[main\]/, "et chaque mise à jour de main");
});
