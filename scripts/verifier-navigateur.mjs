#!/usr/bin/env node
/*
 * Les recettes au navigateur de maths&go — celles que « node --test » ne découvre pas.
 *
 * Avant le 11/11/2026, vingt-cinq recettes de tests/ (des .cjs sans « .test. » dans le nom,
 * plus les deux batteries Python de Solèy) ne tournaient que si quelqu'un pensait à les
 * lancer à la main : l'audit des tests en a trouvé de rouges depuis septembre sans que
 * personne le voie. Ce script les rassemble et les lance.
 *
 *   node scripts/verifier-navigateur.mjs              les recettes des applis touchées par la
 *                                                     branche (par rapport à origin/main),
 *                                                     plus les contrôles rapides du catalogue
 *   node scripts/verifier-navigateur.mjs --tout       toutes les recettes (≈ 30 min)
 *   node scripts/verifier-navigateur.mjs --appli coffres   les recettes d'une appli
 *   node scripts/verifier-navigateur.mjs --liste      ce qui existe, sans rien lancer
 *
 * « npm run verifier » l'appelle à la fin, en mode ciblé : un lot qui touche Coffres
 * magiques joue les recettes de Coffres, et rien de ce qui ne le concerne pas.
 *
 * Une dépendance absente (Playwright, jsdom, @napi-rs/canvas, Playwright pour Python) est
 * une ERREUR, jamais un vert par omission. Ces dépendances ne sont pas dans le dépôt (la CI
 * ne fait pas d'installation) : elles se cherchent dans l'installation de Node, dans
 * NODE_PATH, puis dans le dossier « outils-tests » posé À CÔTÉ du dépôt (le même pour le
 * dossier principal et pour chaque worktree), puis dans ~/Developer/MathsGo-Code/outils-tests
 * (pour un worktree rangé ailleurs), ou dans MATHSGO_OUTILS_TESTS. Version de
 * Playwright : 1.65.0 (celle de l'audit) — avec 1.63, l'horloge de page.clock ne fait pas
 * avancer la séance de defi-calcul-g1-ecrans.cjs, qui rougit sans défaut de l'appli.
 *
 * Gardé par tests/verifier-navigateur.test.mjs : toute recette de tests/ que node --test
 * ne découvre pas doit figurer ici (RECETTES) ou être écartée avec sa raison (ECARTEES).
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { delimiter, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const COFFRES = [
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/club_maths/coffres_magiques.html",
  "assets/js/coffres-",
  "assets/css/coffres-",
];
const DEFI_CALCUL = ["outils/calcul_mental/defi_calcul"];
const SPLAT = ["outils/splat.html", "assets/js/splat-", "assets/fonts/SplatLettres"];
const AXELLE = ["axelle/"];
const SOLEY = ["outils/club_maths/soley"];
const DEFI_CONVERSIONS = ["outils/conversions/defi_conversions", "outils/conversions/conversions_carte.js", "outils/conversions/conversions_generateurs.js"];

/*
 * appli   : le nom donné à --appli ;
 * garde   : préfixes de chemins ; la recette tourne si la branche touche l'un d'eux (ou la recette elle-même) ;
 * plafond : minutes avant de l'arrêter (15 par défaut) ;
 * toujours: rapide, joue à chaque « npm run verifier » ;
 * besoin  : modules Node exigés ; python : batterie Python (Playwright pour Python) ;
 * serveur : la recette attend le site servi à MATHSGO_URL (le script le sert lui-même) ;
 * nodeTest: fichier déjà ramassé par « node --test », dont les cas au navigateur sont SAUTÉS
 *           quand Playwright est introuvable : ici, ils deviennent obligatoires.
 */
export const RECETTES = [
  // Contrôles rapides (jsdom, quelques secondes) : à chaque vérification.
  { fichier: "tests/catalogue-navigation-css-dom.cjs", appli: "catalogue", toujours: true, besoin: ["jsdom"] },
  { fichier: "tests/jeux-courts-navigation-dom.cjs", appli: "jeux-courts", toujours: true, besoin: ["jsdom"] },
  { fichier: "tests/jeux-cadeaux-dom.cjs", appli: "jeux-courts", toujours: true, besoin: ["jsdom"] },

  { fichier: "tests/tec-tec-dom.cjs", appli: "tec-tec", besoin: ["jsdom"],
    garde: ["jeux-cadeaux/tec-tec/", "jeux-cadeaux/core.js", "jeux-cadeaux/app.js"] },
  { fichier: "tests/galets-riviere-dom.cjs", appli: "galets", besoin: ["jsdom", "@napi-rs/canvas"],
    garde: ["jeux-cadeaux/galets-riviere/", "jeux-cadeaux/core.js"] },

  { fichier: "tests/coffres-dialogs-regression.cjs", appli: "coffres", besoin: ["playwright"], garde: COFFRES },
  { fichier: "tests/coffres-solo-learning-regression.cjs", appli: "coffres", besoin: ["playwright"], garde: COFFRES },
  { fichier: "tests/carres-gloutons-layout-regression.cjs", appli: "carres-gloutons", besoin: ["playwright"],
    garde: ["outils/club_maths/carres_gloutons.html", "assets/js/carres-gloutons-embed.js", "assets/js/gloubi-ia.js"] },

  { fichier: "tests/defi-calcul-accueil-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-f1-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-g1-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-relecture-1-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-relecture-2-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-relecture-2b-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-modules-lot-2-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-lot-3c-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-lot-4-ceintures-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-lot-5-revue-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },
  { fichier: "tests/defi-calcul-lot-7-0-ecrans.cjs", appli: "defi-calcul", besoin: ["playwright"], garde: DEFI_CALCUL },

  // Évaluations nationales, lot EN-A1 : l'accueil de l'appli, l'écran du choix d'un test, le bandeau d'« Explorer les outils ».
  { fichier: "tests/evaluations-nationales-accueil-ecrans.cjs", appli: "evaluations", besoin: ["playwright"],
    garde: ["outils/evaluations_nationales/", "outils/index.html", "assets/css/catalogue-refonte.css"] },

  { fichier: "tests/defi-conversions-ecrans.cjs", appli: "defi-conversions", besoin: ["playwright"], garde: DEFI_CONVERSIONS },
  // Le robot du lot A2 : tous les écrans de chaque étape, à 4 tailles, dans Chromium ET WebKit
  // (WebKit s'installe une fois : PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install webkit).
  // lot A2 ter : le robot joue 9 tailles dans deux moteurs (environ 40 min) ; lot 3a : Je me souviens,
  // Avant de partir, Je ne sais pas, les ceintures en plus (Chromium seul : environ 60 min) : plafond 90 min
  { fichier: "tests/defi-conversions-robot.cjs", appli: "defi-conversions", besoin: ["playwright"], garde: DEFI_CONVERSIONS, plafond: 90 },

  { fichier: "tests/splat-enquete-eleve-boutons-regression.cjs", appli: "splat", besoin: ["playwright"], serveur: true, garde: SPLAT },
  { fichier: "tests/splat-enquete-eleve-pas-a-pas-regression.cjs", appli: "splat", besoin: ["playwright"], serveur: true, garde: SPLAT },
  { fichier: "tests/splat-enquete-projection-cadre-regression.cjs", appli: "splat", besoin: ["playwright"], serveur: true, garde: SPLAT },
  { fichier: "tests/splat-enquete-schema-vide-regression.cjs", appli: "splat", besoin: ["playwright"], serveur: true, garde: SPLAT },

  { fichier: "tests/axelle-games-regression.cjs", appli: "axelle", besoin: ["playwright"], garde: AXELLE },
  { fichier: "tests/axelle-j2-regression.cjs", appli: "axelle", besoin: ["playwright"], garde: AXELLE },
  { fichier: "tests/axelle-j3-regression.cjs", appli: "axelle", besoin: ["playwright"], garde: AXELLE },
  { fichier: "tests/axelle-j4-j7-regression.cjs", appli: "axelle", besoin: [], garde: AXELLE },

  { fichier: "tests/soley/test_soley.py", appli: "soley", python: true, garde: SOLEY },
  { fichier: "tests/soley/test_atelier.py", appli: "soley", python: true, garde: SOLEY },

  // Déjà dans « node --test », mais leurs cas au navigateur y sont sautés sans Playwright.
  { fichier: "tests/automatismes-interface.test.mjs", appli: "automatismes", nodeTest: true, besoin: ["playwright"], garde: ["automatismes/"] },
  { fichier: "tests/automatismes-accueil-menu.test.mjs", appli: "automatismes", nodeTest: true, besoin: ["playwright"], garde: ["automatismes/"] },
  { fichier: "tests/effacer-historique.test.mjs", appli: "suivi", nodeTest: true, besoin: ["playwright"],
    garde: ["outils/calcul_mental/defi_tables", "outils/calcul_mental/defi_calcul", "outils/calcul_mental/flash_anzan", "assets/js/effacer-historique"] },
  { fichier: "tests/pave-au-toucher.test.mjs", appli: "pave", nodeTest: true, besoin: ["playwright"],
    garde: ["outils/calcul_mental/defi_tables.html", "outils/calcul_mental/defi_calcul", "outils/calcul_mental/flash_anzan.html"] },
  { fichier: "tests/en-tete-commun.test.mjs", appli: "suivi", nodeTest: true, besoin: ["playwright"],
    garde: ["outils/calcul_mental/defi_tables", "outils/calcul_mental/defi_calcul", "outils/calcul_mental/flash_anzan",
      "outils/calcul_mental/coffres_magiques_solo.html", "outils/splat_univers.html", "assets/js/en-tete-commun", "assets/css/en-tete-commun"] },
];

/* Fichiers de tests/ qui ne sont pas des recettes à jouer, chacun avec sa raison. */
export const ECARTEES = [
  { fichier: "tests/automatismes-v2-reperage-regression.cjs",
    raison: "pilote Automatismes V2, gelé depuis le 21/10/2026 et hors catalogue : à 320 px le repère fait 264 px " +
      "pour 278 exigés, et derrière, un texte de l'aide déborde de l'écran (audit du 11/11/2026). " +
      "À réparer avec la page si la V2 repart, pas avant." },
  { fichier: "tests/automatismes-v2-reperage-planches.mjs", raison: "fabrique des planches de la V2, ne vérifie rien." },
  { fichier: "tests/automatismes-v2-reperage-statistiques.mjs", raison: "mesure statistique de la V2, sans assertion." },
  { fichier: "tests/helpers/moulin-harness.cjs", raison: "harnais importé par les tests du Moulin." },
  { fichier: "tests/coffres-suivi-monde.mjs", raison: "simulateur importé par les tests." },
  { fichier: "tests/defi-tables-faux-monde.mjs", raison: "simulateur importé par les tests." },
  { fichier: "tests/splat-faux-monde.mjs", raison: "simulateur importé par les tests." },
  { fichier: "tests/splat-suivi-monde.mjs", raison: "simulateur importé par les tests." },
  { fichier: "tests/suivi-regler-banc.mjs", raison: "banc d'essai importé par les tests du suivi." },
];

/* Ce qui, touché, fait tout rejouer. */
const TOUT_REJOUER = ["scripts/verifier-navigateur.mjs", "package.json"];

const MODULES = ["playwright", "jsdom", "@napi-rs/canvas"];

function dossiersOutils() {
  const dossiers = [];
  if (process.env.MATHSGO_OUTILS_TESTS) dossiers.push(resolve(process.env.MATHSGO_OUTILS_TESTS, "node_modules"));
  dossiers.push(resolve(RACINE, "..", "outils-tests", "node_modules"));
  // Les worktrees de Claude Code ne sont pas toujours à côté du dépôt (dossier temporaire) :
  // l'emplacement installé chez Gwenaël sert de repli (correctif du 11/11/2026, PR #1165).
  dossiers.push(resolve(homedir(), "Developer", "MathsGo-Code", "outils-tests", "node_modules"));
  return [...new Set(dossiers)].filter((d) => existsSync(d));
}

/* Le NODE_PATH donné aux recettes : celui de l'utilisateur, puis le dossier outils-tests. */
export function cheminModules() {
  const deja = (process.env.NODE_PATH || "").split(delimiter).filter(Boolean);
  return [...deja, ...dossiersOutils().filter((d) => !deja.includes(d))].join(delimiter);
}

/* Où le module se trouve-t-il ? null s'il est introuvable. `seulementNode` : sans le dossier outils-tests. */
export function trouverModule(nom, { seulementNode = false } = {}) {
  const depuis = createRequire(resolve(RACINE, "tests", "x.cjs"));
  try { return depuis.resolve(nom); } catch { /* suite */ }
  if (seulementNode) return null;
  for (const dossier of dossiersOutils()) {
    try { return createRequire(resolve(dossier, "x.cjs")).resolve(nom); } catch { /* suite */ }
  }
  return null;
}

function trouverPython() {
  const essais = process.platform === "win32" ? [["py", ["-3"]], ["python", []], ["python3", []]] : [["python3", []], ["python", []]];
  for (const [commande, avant] of essais) {
    const r = spawnSync(commande, [...avant, "-c", "import playwright"], { encoding: "utf8" });
    if (r.status === 0) return { commande, avant };
  }
  return null;
}

/* Les fichiers que la branche change par rapport à origin/main (commits ET fichiers non commités). */
export function fichiersTouches() {
  const git = (...args) => spawnSync("git", args, { cwd: RACINE, encoding: "utf8" });
  const base = git("merge-base", "HEAD", "origin/main");
  if (base.status !== 0) return null;
  const diff = git("diff", "--name-only", base.stdout.trim());
  const neufs = git("ls-files", "--others", "--exclude-standard");
  if (diff.status !== 0 || neufs.status !== 0) return null;
  return [...diff.stdout.split("\n"), ...neufs.stdout.split("\n")].map((l) => l.trim().replace(/\\/g, "/")).filter(Boolean);
}

export function concernee(recette, touches) {
  return touches.some((f) => f === recette.fichier || (recette.garde || []).some((g) => f.startsWith(g)));
}

function portLibre() {
  return new Promise((ok, ko) => {
    const s = createServer();
    s.once("error", ko);
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => ok(port)); });
  });
}

function lancer(commande, args, env, plafond) {
  return new Promise((fin) => {
    const enfant = spawn(commande, args, { cwd: RACINE, env, stdio: ["ignore", "pipe", "pipe"] });
    let sortie = "";
    const garder = (morceau) => { sortie = (sortie + morceau).slice(-20000); };
    enfant.stdout.on("data", garder);
    enfant.stderr.on("data", garder);
    const minuterie = setTimeout(() => { sortie += `\n(arrêtée au bout de ${plafond / 60000} min)`; enfant.kill(); }, plafond);
    enfant.on("close", (code) => { clearTimeout(minuterie); fin({ code, sortie }); });
    enfant.on("error", (erreur) => { clearTimeout(minuterie); fin({ code: 1, sortie: String(erreur) }); });
  });
}

async function principal() {
  const args = process.argv.slice(2);
  const tout = args.includes("--tout");
  const iAppli = args.indexOf("--appli");
  const appli = iAppli >= 0 ? args[iAppli + 1] : null;
  const depuisVerifier = args.includes("--depuis-verifier");

  if (args.includes("--liste")) {
    for (const r of RECETTES) console.log(`${r.appli.padEnd(16)} ${r.toujours ? "toujours " : "         "}${r.fichier}`);
    console.log("\nÉcartées :");
    for (const e of ECARTEES) console.log(`  ${e.fichier} — ${e.raison}`);
    return 0;
  }

  let choisies;
  let pourquoi;
  if (tout) { choisies = RECETTES; pourquoi = "toutes les recettes (--tout)"; }
  else if (appli) {
    choisies = RECETTES.filter((r) => r.appli === appli);
    if (!choisies.length) { console.error(`Aucune recette pour « ${appli} ». Voir --liste.`); return 1; }
    pourquoi = `l'appli « ${appli} »`;
  } else {
    const touches = fichiersTouches();
    if (touches === null) { choisies = RECETTES; pourquoi = "branche illisible (pas de git ou pas d'origin/main) : par prudence, tout"; }
    else if (touches.some((f) => TOUT_REJOUER.includes(f))) { choisies = RECETTES; pourquoi = "la suite elle-même a changé : tout"; }
    else {
      choisies = RECETTES.filter((r) => r.toujours || concernee(r, touches));
      pourquoi = `les applis touchées par la branche (${touches.length} fichier(s) changé(s) depuis origin/main)`;
    }
  }

  /* Dans « npm run verifier », node --test vient de jouer les fichiers nodeTest : si Playwright
     était trouvable sans le dossier outils-tests, leurs cas au navigateur ont déjà tourné.
     (Ne vaut que DANS « npm run verifier » : relancée seule avec un NODE_PATH ajouté, la suite
     se joue sans --depuis-verifier, sinon elle croirait ces quatre fichiers déjà joués.) */
  if (depuisVerifier && trouverModule("playwright", { seulementNode: true })) {
    choisies = choisies.filter((r) => !r.nodeTest);
  }

  const besoins = new Set(choisies.flatMap((r) => r.besoin || []));
  const manquants = MODULES.filter((m) => besoins.has(m) && !trouverModule(m));
  const python = choisies.some((r) => r.python) ? trouverPython() : true;
  if (manquants.length || !python) {
    console.error("\nRecettes au navigateur : il manque de quoi les jouer — ce n'est PAS un vert.");
    if (manquants.length) {
      console.error(`  Modules Node introuvables : ${manquants.join(", ")}.`);
      console.error(`  Installation hors du dépôt, une fois (dossier « outils-tests » à côté de ${RACINE}) :`);
      console.error("    cd .. && mkdir outils-tests && cd outils-tests && npm init -y");
      console.error("    PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install playwright@1.65.0 jsdom@26.1.0 @napi-rs/canvas@1.1.0");
      console.error("    PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium");
    }
    if (!python) console.error("  Playwright pour Python introuvable (batteries Solèy) : pip install playwright && python -m playwright install chromium");
    return 1;
  }

  console.log(`\nRecettes au navigateur — ${pourquoi} : ${choisies.length} recette(s).`);
  if (!choisies.length) return 0;

  const env = { ...process.env, NODE_PATH: cheminModules() };
  let serveur = null;
  if (choisies.some((r) => r.serveur)) {
    const port = await portLibre();
    serveur = spawn(process.execPath, ["scripts/serve-static.mjs", "--port", String(port)], { cwd: RACINE, stdio: "ignore" });
    env.MATHSGO_URL = `http://127.0.0.1:${port}`;
    await new Promise((ok) => setTimeout(ok, 500));
  }

  const echecs = [];
  const debut = Date.now();
  try {
    for (const r of choisies) {
      const t0 = Date.now();
      let res;
      if (r.python) {
        const py = trouverPython();
        res = await lancer(py.commande, [...py.avant, r.fichier, "--root", "."], env, 15 * 60000);
      } else if (r.nodeTest) {
        res = await lancer(process.execPath, ["--test", "--test-reporter=tap", r.fichier], env, 15 * 60000);
        const sautes = /^# skipped (\d+)/m.exec(res.sortie);
        if (res.code === 0 && sautes && Number(sautes[1]) > 0) {
          res = { code: 1, sortie: `${res.sortie}\n${sautes[1]} cas sautés alors que Playwright est là : ce n'est pas un vert.` };
        }
      } else {
        res = await lancer(process.execPath, [r.fichier], env, (r.plafond || 15) * 60000);
      }
      const duree = `${Math.round((Date.now() - t0) / 1000)} s`;
      if (res.code === 0) console.log(`  ✓ ${r.fichier} (${duree})`);
      else {
        console.log(`  ✗ ${r.fichier} (${duree})`);
        echecs.push({ r, sortie: res.sortie });
      }
    }
  } finally {
    if (serveur) serveur.kill();
  }

  for (const { r, sortie } of echecs) {
    console.log(`\n—— ${r.fichier} ——`);
    console.log(sortie.split("\n").slice(-40).join("\n"));
  }
  const minutes = Math.round((Date.now() - debut) / 6000) / 10;
  console.log(`\n${choisies.length - echecs.length} / ${choisies.length} recette(s) vertes en ${minutes} min.`);
  return echecs.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal().then((code) => { process.exitCode = code; }, (erreur) => { console.error(erreur); process.exitCode = 1; });
}
