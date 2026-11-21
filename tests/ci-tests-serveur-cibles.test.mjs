import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
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
// tourne dans « node --test », donc sur chaque pull request (job
// « verifications », jamais sauté sur une pull request) et dans la publication.
//
// Depuis le 06/10/2026, le même tri s'applique à l'arrivée sur main : ce fichier
// le rejoue pour de vrai, sur un petit dépôt jetable, au lieu de se contenter
// d'en lire le texte. Depuis le lot « vérifications plus rapides » (21/11/2026),
// il garde aussi la nouvelle répartition : tests ciblés sur la pull request,
// batterie complète une fois sur main, publication qui attend son verdict.
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
    "un test Node ne doit pas les déclencher : il tourne dans « verifications » sur chaque pull request");
  assert.ok(!couvert("index.html"), "l'accueil non plus");
});

test("le job « changements » retombe sur « tout lancer » en cas de doute", () => {
  const workflow = lire(WORKFLOW);
  const debut = workflow.indexOf("Décider si les tests du serveur doivent tourner");
  assert.ok(debut > 0, "l'étape de tri doit exister dans le workflow");
  const etape = workflow.slice(debut, workflow.indexOf("\n  verifications:", debut));
  // Seules les pull requests et l'arrivée sur main (push) sont triées. Le
  // rendez-vous hebdomadaire et le lancement à la main : tout tourne.
  assert.match(etape, /case "\$EVENEMENT" in\s*\n\s*pull_request\|push\) ;;\s*\n\s*\*\) tout /,
    "hors pull request et arrivée sur main, les tests du serveur doivent tourner sans condition");
  // Sur main, on compare l'état d'avant la fusion à celui d'après.
  assert.match(etape, /BASE: \$\{\{ github\.event\.pull_request\.base\.sha \|\| github\.event\.before \}\}/,
    "à l'arrivée sur main, la base du tri est l'état de main avant la fusion");
  assert.match(etape, /TETE: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/,
    "et la tête, l'état de main après la fusion");
  // Une branche qui naît n'a pas d'état précédent (« before » fait de zéros).
  assert.match(etape, /""\|0{40}\) tout /,
    "sans état précédent, rien à comparer : les tests du serveur doivent tourner");
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
  // « verifications » (la coche exigée) n'est jamais sautée : un job sauté compte
  // comme réussi. Elle tourne même si le tri échoue, et rougit alors.
  const verifications = workflow.slice(workflow.indexOf("\n  verifications:"),
    workflow.indexOf("\n  serveur-sqlite:"));
  const conditions = [...verifications.matchAll(/^\s+if:\s*(.+)$/gm)].map(([, c]) => c.trim());
  assert.deepEqual(conditions, ["${{ !cancelled() }}"],
    "le job « verifications » tourne à chaque passage (sauf annulé) : sauté, il compterait comme réussi");
  assert.match(verifications, /needs: \[changements, controles, batterie\]/,
    "il fait le bilan du tri, des contrôles rapides et de la batterie");
  for (const garde of ['[ "$CHANGEMENTS" = "success" ]', '[ "$CONTROLES" = "success" ]', '[ "$BATTERIE" = "success" ]']) {
    const ligne = verifications.split("\n").find((l) => l.includes(garde));
    assert.ok(ligne && /exit 1/.test(ligne), `le bilan doit rougir si ${garde} est faux`);
  }
  // Les contrôles rapides ne sont jamais sautés non plus.
  const controles = workflow.slice(workflow.indexOf("\n  controles:"), workflow.indexOf("\n  batterie:"));
  assert.ok(controles.length > 100, "le job « controles » doit exister");
  assert.doesNotMatch(controles.split("\n    steps:")[0], /^\s+if:/m, "le job « controles » tourne à chaque passage");
});

// Une seule batterie complète par fusion (lot « vérifications plus rapides »,
// 21/11/2026) : elle tourne sur main, et la publication attend son verdict au
// lieu de la rejouer. Sabotages attendus (rendent ce test rouge) : remettre
// « node --test » dans publier.yml ; publier sans attendre « Vérifications » ;
// publier un passage rouge ; ne plus jouer la batterie complète hors pull request.
test("une batterie complète par fusion : sur main, et la publication attend son verdict sans la rejouer", () => {
  const workflow = lire(WORKFLOW);
  // Hors pull request, le choix des tests répond « tout ».
  const choix = workflow.slice(workflow.indexOf("- name: Choisir les tests de la pull request"), workflow.indexOf("\n  controles:"));
  assert.match(choix, /if \[ "\$EVENEMENT" != "pull_request" \]; then\s*\n\s*echo "tout=true" >> "\$GITHUB_OUTPUT"/,
    "hors pull request (arrivée sur main, dimanche, Run workflow), la batterie complète doit tourner");
  assert.match(choix, /node scripts\/tests-cibles\.mjs "\$BASE" "\$TETE" --github/,
    "sur une pull request, les tests sont choisis par scripts/tests-cibles.mjs");
  const batterie = workflow.slice(workflow.indexOf("\n  batterie:"), workflow.indexOf("\n  verifications:"));
  assert.match(batterie, /if: needs\.changements\.outputs\.tests_tout == 'true'/, "la batterie tourne quand le tri dit « tout »");

  const publier = lire(".github/workflows/publier.yml");
  assert.doesNotMatch(publier, /node --test/, "la publication ne rejoue plus les tests : la batterie vient de passer sur main");
  const declencheurs = publier.slice(publier.indexOf("\non:"), publier.indexOf("\npermissions:"));
  assert.match(declencheurs, /workflow_run:\s*\n\s*workflows: \["Vérifications"\]\s*\n\s*types: \[completed\]\s*\n\s*branches: \[main\]/,
    "la publication se lance quand « Vérifications » a fini sur main");
  assert.doesNotMatch(declencheurs, /\bpush:/, "et jamais directement à l'arrivée sur main, sans attendre le verdict");
  const construire = publier.slice(publier.indexOf("\n  construire:"), publier.indexOf("\n    steps:", publier.indexOf("\n  construire:")));
  assert.match(construire, /github\.event\.workflow_run\.conclusion == 'success'/, "elle ne publie qu'un passage VERT");
  assert.match(construire, /github\.event\.workflow_run\.event == 'push'/, "pour une arrivée sur main");
  assert.match(publier, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/, "et elle publie le commit vérifié, pas un autre");
  assert.match(publier, /git ls-remote origin refs\/heads\/main/, "un état dépassé ne doit pas écraser le plus récent");
  assert.match(publier, /cancel-in-progress: false/, "une publication en cours n'est pas coupée par la suivante");
});

// Le dépôt est public depuis le 21/11/2026 : la machine prêtée a quatre
// processeurs, et la batterie complète se partage entre quatre machines.
test("sur la machine de GitHub, quatre fichiers à la fois, et la batterie complète en quatre parts", () => {
  const workflow = lire(WORKFLOW);
  const lancements = [...workflow.matchAll(/^\s*(?:run: )?node --test\b.*$/gm)].map(([l]) => l.trim().replace(/^run: /, ""));
  assert.equal(lancements.length, 2, `deux lancements attendus (tests ciblés, batterie) : ${lancements.join(" | ")}`);
  for (const lancement of lancements) {
    assert.match(lancement, /^(?:run: )?node --test --test-concurrency=4\b/, `« ${lancement} » : quatre processeurs, quatre fichiers à la fois`);
  }
  assert.ok(lancements.includes("node --test --test-concurrency=4 --test-shard=${{ matrix.part }}/4"), "la batterie, une part sur quatre");
  assert.match(workflow, /part: \[1, 2, 3, 4\]/, "les quatre parts tournent toutes");
  assert.ok(lancements.includes("node --test --test-concurrency=4 $CIBLES"), "les tests choisis, sur une pull request");
  assert.match(workflow, /if \[ -z "\$CIBLES" \]; then echo "aucun fichier de test concerné"; exit 0; fi/,
    "une liste vide ne doit pas lancer « node --test » sans fichier, qui jouerait tout");
});

// ---------------------------------------------------------------------------
// Le tri, rejoué pour de vrai.
//
// Les tests ci-dessus lisent le TEXTE du workflow. Celui-ci exécute l'étape de
// tri telle quelle — même script, même « bash -e » que GitHub — dans un petit
// dépôt git jetable, pour chaque situation : pull request ou arrivée sur main,
// outil du site ou serveur, base qui a avancé, branche neuve, dimanche, « Run
// workflow », SHA inconnu. Sur Windows (ordinateur de Gwenaël), bash n'est pas
// garanti : le test s'y saute. Sur la machine de GitHub, il ne se saute jamais.

function scriptDuTri() {
  const lignes = lire(WORKFLOW).split("\n");
  const nom = lignes.findIndex((l) => l.includes("- name: Décider si les tests du serveur doivent tourner"));
  assert.ok(nom > 0, "l'étape de tri doit exister");
  const run = lignes.findIndex((l, i) => i > nom && /^ {8}run: \|$/.test(l));
  assert.ok(run > nom, "l'étape de tri doit avoir un « run: | »");
  const corps = [];
  for (const ligne of lignes.slice(run + 1)) {
    if (ligne.trim() !== "" && !ligne.startsWith(" ".repeat(10))) break;
    corps.push(ligne.slice(10));
  }
  return corps.join("\n");
}

const sansBash = process.env.GITHUB_ACTIONS !== "true"
  && (process.platform === "win32"
    || spawnSync("bash", ["-c", "true"]).status !== 0
    || spawnSync("git", ["--version"]).status !== 0);

test("le tri, rejoué dans un dépôt jetable : chaque situation donne la bonne réponse",
  { skip: sansBash && "bash et git nécessaires (toujours présents sur la machine de GitHub)" }, () => {
    const dossier = mkdtempSync(join(tmpdir(), "ci-tri-"));
    try {
      const depot = join(dossier, "depot");
      mkdirSync(depot);
      const git = (...args) => {
        const r = spawnSync("git", ["-c", "user.name=ci", "-c", "user.email=ci@exemple.invalid",
          "-c", "commit.gpgsign=false", "-c", "init.defaultBranch=main", ...args], { cwd: depot, encoding: "utf8" });
        assert.equal(r.status, 0, `git ${args.join(" ")} : ${r.stderr}`);
        return r.stdout.trim();
      };
      const ecrire = (chemin, texte) => {
        mkdirSync(join(depot, dirname(chemin)), { recursive: true });
        writeFileSync(join(depot, chemin), texte);
      };
      const commit = (fichiers, message) => {
        for (const [chemin, texte] of Object.entries(fichiers)) ecrire(chemin, texte);
        git("add", "-A");
        git("commit", "-q", "-m", message);
        return git("rev-parse", "HEAD");
      };
      git("init", "-q");
      const souche = commit({
        "outils/splat.html": "1", "_serveur/public/api/prof.php": "1", "favicon.svg": "1",
        "outils/calcul_mental/defi_tables_mon_parcours.js": "1", "index.html": "1",
      }, "souche");
      const branche = (depart, fichiers, message) => {
        git("checkout", "-q", "--detach", depart);
        return commit(fichiers, message);
      };
      const outil = branche(souche, { "outils/splat.html": "2" }, "un outil du site");
      const serveur = branche(souche, { "_serveur/public/api/prof.php": "2" }, "le serveur");
      const favicon = branche(souche, { "favicon.svg": "2" }, "une image recopiée dans le serveur");
      const moteur = branche(souche, { "outils/calcul_mental/defi_tables_mon_parcours.js": "2" }, "le moteur");
      const workflow = branche(souche, { ".github/workflows/x.yml": "2" }, "un workflow");
      // main a avancé (fusion d'une PR serveur) pendant qu'une PR d'outil attendait :
      // la PR d'outil, elle, ne touche toujours pas au serveur.
      const mainAvance = branche(serveur, { "index.html": "2" }, "main avance");
      const fusionOutil = branche(mainAvance, { "outils/splat.html": "3" }, "fusion d'un outil");

      const script = scriptDuTri();
      const trier = (EVENEMENT, BASE, TETE) => {
        const sortie = join(dossier, "sortie.txt");
        writeFileSync(sortie, "");
        const r = spawnSync("bash", ["-e", "-c", script], {
          cwd: depot, encoding: "utf8",
          env: { ...process.env, EVENEMENT, BASE, TETE, GITHUB_OUTPUT: sortie },
        });
        assert.equal(r.status, 0, `le tri a échoué (${EVENEMENT}) : ${r.stderr}`);
        const valeurs = [...readFileSync(sortie, "utf8").matchAll(/^serveur=(true|false)$/gm)].map(([, v]) => v);
        assert.equal(valeurs.length, 1, `une seule réponse attendue (${EVENEMENT}), reçu : ${valeurs.join(", ")}`);
        return valeurs[0] === "true";
      };

      const zeros = "0".repeat(40);
      const inconnu = "1234567890abcdef1234567890abcdef12345678";
      const cas = [
        ["pull request d'outil", "pull_request", souche, outil, false],
        ["pull request serveur", "pull_request", souche, serveur, true],
        ["pull request qui touche une image recopiée", "pull_request", souche, favicon, true],
        ["pull request qui touche le moteur de Défi tables", "pull_request", souche, moteur, true],
        ["pull request qui touche un workflow", "pull_request", souche, workflow, true],
        ["pull request d'outil, main a avancé avec du serveur", "pull_request", mainAvance, outil, false],
        ["arrivée sur main d'un outil", "push", mainAvance, fusionOutil, false],
        ["arrivée sur main du serveur", "push", souche, serveur, true],
        ["arrivée sur main d'une image recopiée", "push", souche, favicon, true],
        ["arrivée sur main de plusieurs commits, dont du serveur", "push", souche, fusionOutil, true],
        ["branche neuve (before fait de zéros)", "push", zeros, outil, true],
        ["arrivée sur main sans before", "push", "", outil, true],
        ["SHA de base inconnu", "push", inconnu, outil, true],
        ["SHA de tête inconnu", "pull_request", souche, inconnu, true],
        ["rendez-vous du dimanche", "schedule", "", souche, true],
        ["Run workflow", "workflow_dispatch", "", souche, true],
      ];
      const erreurs = cas
        .filter(([, evenement, base, tete, attendu]) => trier(evenement, base, tete) !== attendu)
        .map(([quoi, , , , attendu]) => `${quoi} : attendu ${attendu ? "tests serveur LANCÉS" : "tests serveur sautés"}`);
      assert.deepEqual(erreurs, [], "le tri se trompe");
    } finally {
      rmSync(dossier, { recursive: true, force: true });
    }
  });

test("le passage complet a son rendez-vous : chaque dimanche, et à la demande", () => {
  const workflow = lire(WORKFLOW);
  const declencheurs = workflow.slice(workflow.indexOf("\non:"), workflow.indexOf("\njobs:"));
  assert.match(declencheurs, /schedule:\s*\n\s*- cron: "0 18 \* \* 0"/,
    "un rendez-vous hebdomadaire (dimanche 18:00 UTC = 22 h à La Réunion) doit tout rejouer");
  assert.match(declencheurs, /workflow_dispatch:/,
    "et « Run workflow » doit permettre de le déclencher à la main");
  assert.match(declencheurs, /pull_request:/, "les pull requests restent vérifiées");
  assert.match(declencheurs, /push:\s*\n\s*branches: \[main\]/,
    "et chaque mise à jour de main (les tests du serveur y sont triés)");
});
