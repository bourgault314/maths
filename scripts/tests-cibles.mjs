#!/usr/bin/env node
/*
 * Les tests concernés par une pull request (lot « vérifications plus rapides », 21/11/2026).
 *
 * Sur une pull request, la CI ne joue plus les 507 fichiers de « node --test » : seulement
 * ceux qui parlent des fichiers changés. La batterie complète tourne UNE fois, sur main,
 * après la fusion — et la publication attend qu'elle soit verte. Ce qu'un ciblage raterait
 * se voit donc avant la mise en ligne, jamais après.
 *
 *   node scripts/tests-cibles.mjs <base> <tête>          la liste, un fichier par ligne
 *   node scripts/tests-cibles.mjs <base> <tête> --github écrit « tout » et « cibles » dans
 *                                                        $GITHUB_OUTPUT (job « changements »)
 *   node scripts/tests-cibles.mjs --fichiers a.js b.html la liste pour ces fichiers-là
 *   node scripts/tests-cibles.mjs --lancer [base]        sur l'ordinateur : la copie de travail
 *                                                        (non validé compris) contre origin/main,
 *                                                        puis « node --test » sur ces fichiers-là
 *
 * La règle, dans l'ordre :
 *   1. TOUT tourne si la branche touche l'outillage des tests lui-même (les workflows,
 *      package.json, ce script) ou un très grand nombre de fichiers, ou si le calcul échoue.
 *   2. Un fichier de test changé tourne.
 *   3. Un fichier de test tourne s'il NOMME un fichier changé : son chemin, ou son nom seul
 *      quand ce nom est unique dans le dépôt (sinon « dossier/nom »).
 *   4. La chaîne de chargement est suivie : un .js, .mjs, .cjs, .css ou .json changé
 *      concerne aussi chaque fichier qui le nomme (la page qui le charge, le module qui
 *      l'importe…), et les tests qui nomment CEUX-LÀ. Une page .html ne se propage pas :
 *      un lien vers elle (le catalogue en a des centaines) n'en fait pas une dépendance.
 *   5. Le socle tourne toujours : les tests qui parcourent tout le dépôt (catalogue,
 *      référencement, icônes, licence, publication…), parce qu'aucun nom ne les relie à
 *      un fichier précis.
 *   6. Si la sélection dépasse la moitié des fichiers, TOUT tourne (rien à gagner).
 *
 * Gardé par tests/tests-cibles.test.mjs.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* 1. Ce qui change la façon dont les tests tournent : tout. */
export const OUTILLAGE = [
  /^\.github\//,
  /^package(-lock)?\.json$/,
  /^scripts\/tests-cibles\.mjs$/,
  /^tests\/tests-cibles\.test\.mjs$/,
];
export const TROP_DE_FICHIERS = 200;

/* 4. Les fichiers qui se chargent : leurs voisins comptent aussi. */
const SE_PROPAGE = new Set([".js", ".mjs", ".cjs", ".css", ".json"]);
const PROFONDEUR = 4;
// Ce qui ne charge rien pour le site : une liste de chemins dans un script ou une note
// n'en fait pas une dépendance (verifier-navigateur.mjs nomme toutes les applis).
const OUTILS = /^(scripts|tests|docs|_sources)\/|^package(-lock)?\.json$|\.md$/;
// Une vraie façon de charger un fichier : import, require, <script src>, <link href>,
// @import, url(…), fetch(…), new URL(…), new Worker(…), importScripts(…).
const CHARGE = String.raw`(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|\bsrc\s*=\s*|\bhref\s*=\s*|@import\s+(?:url\(\s*)?|\burl\(\s*|\bfetch\(\s*|\bnew\s+URL\(\s*|\bnew\s+Worker\(\s*|\bimportScripts\(\s*)["'\x60]?[^"'\x60)\s]*`;
const echapper = (t) => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
export function charge(texte, jeton) {
  return texte.includes(jeton) && new RegExp(CHARGE + echapper(jeton)).test(texte);
}

/*
 * 5 bis. Des tests qui parcourent un dossier, mais seulement le dossier de LEUR appli :
 * ils tournent quand un fichier de ce dossier change (et quand ils nomment un fichier
 * changé, comme les autres), pas à chaque pull request.
 */
export const PAS_DU_SOCLE = {
  "tests/conversions-generateurs.test.mjs": "outils/conversions/conversions-reperes/",
  "tests/automatismes-moteur.test.mjs": "automatismes/",
};

/* Fichiers texte lus pour chercher les noms (le reste : images, PDF, polices, archives). */
const TEXTE = new Set([".js", ".mjs", ".cjs", ".html", ".htm", ".css", ".json", ".php", ".py", ".md", ".svg", ".txt", ".xml", ".yml", ".yaml", ".tex", ".webmanifest"]);
const IGNORES = new Set(["node_modules", ".git"]);
const TAILLE_MAX = 3 * 1024 * 1024;

/* La découverte de « node --test » (Node 22) : ces motifs, hors node_modules. */
export function estFichierDeTest(chemin) {
  const morceaux = chemin.split("/");
  const nom = morceaux[morceaux.length - 1];
  if (!/\.(c|m)?js$/.test(nom)) return false;
  if (morceaux.slice(0, -1).includes("test")) return true;
  return /\.test\.(c|m)?js$/.test(nom) || /[-_]test\.(c|m)?js$/.test(nom)
    || /^test-.*\.(c|m)?js$/.test(nom) || /^test\.(c|m)?js$/.test(nom);
}

/* 5. Le socle : un test qui parcourt des dossiers n'est relié à aucun nom précis. */
export function estDuSocle(source) {
  return /\breaddir(Sync)?\s*\(|\bglob(Sync)?\s*\(|\bopendir(Sync)?\s*\(|git\s+ls-files|["']ls-files["']/.test(source);
}

export function listerDepot(racine = RACINE) {
  const fichiers = [];
  (function parcourir(dossier) {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      if (IGNORES.has(entree.name) || entree.name.startsWith(".") && entree.name !== ".github") continue;
      const complet = join(dossier, entree.name);
      if (entree.isDirectory()) parcourir(complet);
      else if (entree.isFile()) fichiers.push(relative(racine, complet).split(sep).join("/"));
    }
  })(racine);
  return fichiers.sort();
}

function lire(racine, chemin) {
  if (!TEXTE.has(extname(chemin).toLowerCase())) return "";
  const complet = join(racine, chemin);
  try {
    if (statSync(complet).size > TAILLE_MAX) return "";
    return readFileSync(complet, "utf8");
  } catch {
    return "";
  }
}

/*
 * Les façons dont un fichier est nommé ailleurs : son chemin, puis son nom seul s'il est
 * unique ET reconnaissable (une extension, six caractères au moins : « VERSION » ou
 * « app.js » sont des mots que mille fichiers contiennent), sinon « dossier/nom ».
 */
export function jetons(chemin, compteNoms) {
  const nom = basename(chemin);
  const liste = [chemin];
  if ((compteNoms.get(nom) || 0) <= 1 && /\.[a-z0-9]+$/i.test(nom) && nom.length >= 7) liste.push(nom);
  else {
    const parent = basename(dirname(chemin));
    if (parent && parent !== ".") liste.push(`${parent}/${nom}`);
  }
  return liste;
}

/*
 * Le calcul lui-même, sans git : changes = chemins changés (supprimés compris).
 * Renvoie { tout: bool, raison, cibles: [...] }.
 */
export function calculer(changes, { racine = RACINE, depot = listerDepot(racine), lecture = (c) => lire(racine, c) } = {}) {
  const outillage = changes.filter((c) => OUTILLAGE.some((m) => m.test(c)));
  if (outillage.length) return { tout: true, raison: `l'outillage des tests change (${outillage.join(", ")})`, cibles: [] };
  if (changes.length > TROP_DE_FICHIERS) return { tout: true, raison: `${changes.length} fichiers changés`, cibles: [] };

  const compteNoms = new Map();
  for (const c of new Set([...depot, ...changes])) compteNoms.set(basename(c), (compteNoms.get(basename(c)) || 0) + 1);
  const sources = new Map();
  for (const c of depot) sources.set(c, lecture(c));
  const tests = depot.filter(estFichierDeTest);

  // 4. La chaîne de chargement, à partir des fichiers changés.
  const concernes = new Set(changes);
  let front = changes.filter((c) => SE_PROPAGE.has(extname(c).toLowerCase()));
  for (let niveau = 0; niveau < PROFONDEUR && front.length; niveau += 1) {
    const cherches = front.flatMap((c) => jetons(c, compteNoms));
    const suivant = [];
    for (const [chemin, texte] of sources) {
      if (concernes.has(chemin) || !texte || estFichierDeTest(chemin) || OUTILS.test(chemin)) continue;
      if (cherches.some((j) => charge(texte, j))) {
        concernes.add(chemin);
        if (SE_PROPAGE.has(extname(chemin).toLowerCase())) suivant.push(chemin);
      }
    }
    front = suivant;
  }

  // 2, 3, 5. Les tests.
  const cherches = [...concernes].flatMap((c) => jetons(c, compteNoms));
  const choisis = new Set(tests.filter((t) => {
    if (concernes.has(t)) return true;
    const texte = sources.get(t) || "";
    if (cherches.some((j) => texte.includes(j))) return true;
    if (t in PAS_DU_SOCLE) return changes.some((c) => c.startsWith(PAS_DU_SOCLE[t]));
    return estDuSocle(texte);
  }));
  // Un test qui en charge un autre (les parts du banc d'essai de Défi conversions)
  // tourne avec lui.
  const nomsChoisis = [...choisis].flatMap((t) => jetons(t, compteNoms));
  for (const t of tests) if (!choisis.has(t) && nomsChoisis.some((j) => charge(sources.get(t) || "", j))) choisis.add(t);
  const cibles = tests.filter((t) => choisis.has(t));

  if (cibles.length > tests.length / 2) return { tout: true, raison: `${cibles.length} fichiers de test sur ${tests.length} concernés`, cibles: [] };
  return { tout: false, raison: `${cibles.length} fichiers de test sur ${tests.length}`, cibles };
}

function git(...args) {
  return execFileSync("git", args, { cwd: RACINE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
}

function changesEntre(base, tete) {
  const souche = git("merge-base", base, tete);
  return git("diff", "--name-only", "--no-renames", souche, tete).split("\n").filter(Boolean);
}

// La copie de travail (fichiers non validés et nouveaux compris) comparée à une base.
function changesDeLaCopie(base) {
  const souche = git("merge-base", base, "HEAD");
  const suivis = git("diff", "--name-only", "--no-renames", souche).split("\n");
  const nouveaux = git("ls-files", "--others", "--exclude-standard").split("\n");
  return [...new Set([...suivis, ...nouveaux])].filter(Boolean).sort();
}

// --lancer : choisir PUIS jouer, sur l'ordinateur (Claude Code, Cowork) — les tests du lot
// en cours, sans deviner lesquels ni rejouer les 500 fichiers.
function lancer(base) {
  const changes = changesDeLaCopie(base);
  const r = calculer(changes);
  console.error(`${changes.length} fichier(s) changé(s) depuis ${base} -> ${r.tout ? "TOUT" : "ciblé"} : ${r.raison}`);
  const fichiers = r.tout ? [] : r.cibles;
  if (!r.tout && !fichiers.length) return 0;
  const sortie = spawnSync(process.execPath, ["--test", ...process.execArgv, ...fichiers], { cwd: RACINE, stdio: "inherit" });
  return sortie.status ?? 1;
}

function principal(argv) {
  if (argv[0] === "--lancer") process.exit(lancer(argv[1] || "origin/main"));
  const github = argv.includes("--github");
  const args = argv.filter((a) => a !== "--github");
  let resultat;
  try {
    const changes = args[0] === "--fichiers" ? args.slice(1) : changesEntre(args[0], args[1]);
    resultat = calculer(changes);
    console.error(`Fichiers changés (${changes.length}) :\n${changes.map((c) => `  ${c}`).join("\n")}`);
  } catch (erreur) {
    // En cas de doute, tout : mieux vaut une batterie de trop qu'un test sauté par erreur.
    resultat = { tout: true, raison: `calcul impossible (${erreur.message.split("\n")[0]})`, cibles: [] };
  }
  console.error(`-> ${resultat.tout ? "TOUT" : "ciblé"} : ${resultat.raison}`);
  if (github && process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `tout=${resultat.tout}\ncibles=${resultat.cibles.join(" ")}\n`);
  }
  if (!resultat.tout) for (const c of resultat.cibles) console.log(c);
  else console.log("TOUT");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal(process.argv.slice(2));
