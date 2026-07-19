import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const RACINE_DEPOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

/*
 * Le périmètre V2 : la fondation qu'Automatismes V2 appelle directement.
 * Il est décrit en français dans docs/automatismes-v2/pilotage.md ; cette
 * liste en est la mise en application, et les deux doivent rester d'accord.
 *
 * packages/automatismes/src n'existe pas encore : il est déclaré d'avance
 * pour que le premier paquet de notions naisse déjà surveillé.
 */
export const RACINES_V2 = [
  "packages/contrats/src",
  "packages/moteur-exercices/src",
  "packages/automatismes/src",
  "packages/objets/src",
  "packages/charte/src",
];

const extensionsLues = new Set([".js", ".mjs", ".cjs", ".json"]);

export const INTERDITS = [
  {
    nom: "identifiant historique",
    motif: new RegExp("\\bdnb_[a-z0-9_]*\\b", "i"),
  },
  {
    nom: "programme textuel hérité",
    motif: new RegExp(["formula", "code"].join("_"), "i"),
  },
  {
    nom: "hasard non seedé",
    motif: /\bMath\s*\.\s*random\s*\(/,
  },
  {
    nom: "évaluation dynamique",
    motif: /\beval\s*\(/,
  },
  {
    nom: "construction dynamique de fonction",
    motif: /\bnew\s+Function\s*\(/,
  },
  {
    // Le sens des dépendances est à sens unique : auto/ et studio/ peuvent
    // consommer la fondation, la fondation ne remonte jamais vers eux.
    nom: "dépendance hors du périmètre V2",
    motif: /["'][^"']*\.\.\/(auto|studio)\//,
  },
];

/*
 * Deux fichiers ont pour métier de NOMMER la dette héritée : le registre de
 * provenance et son test citent les identifiants historiques et le mini-langage
 * d'origine. Les leur interdire reviendrait à interdire de documenter ce qu'il
 * reste à remplacer. Toutes les autres règles continuent de s'y appliquer.
 */
export const EXEMPTIONS = {
  "packages/objets/src/provenance.js": ["identifiant historique", "programme textuel hérité"],
  "packages/objets/src/provenance.test.js": ["identifiant historique", "programme textuel hérité"],
};

function extension(chemin) {
  const index = chemin.lastIndexOf(".");
  return index === -1 ? "" : chemin.slice(index);
}

function listerFichiers(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = resolve(dossier, entree.name);
    return entree.isDirectory() ? listerFichiers(chemin) : [chemin];
  });
}

/**
 * Analyse le périmètre et rend la liste des fichiers lus et les manquements.
 * Paramétrable pour que le test puisse l'exécuter sur un dossier d'essai.
 */
export function analyserPerimetre({
  base = RACINE_DEPOT,
  racines = RACINES_V2,
  exemptions = EXEMPTIONS,
} = {}) {
  const fichiers = racines
    .map((racine) => resolve(base, racine))
    .filter((racine) => existsSync(racine) && statSync(racine).isDirectory())
    .flatMap(listerFichiers)
    .filter((chemin) => extensionsLues.has(extension(chemin)));

  const erreurs = [];
  for (const chemin of fichiers) {
    const cheminRelatif = relative(base, chemin).replaceAll("\\", "/");
    const dispenses = new Set(exemptions[cheminRelatif] ?? []);
    const applicables = INTERDITS.filter((interdit) => !dispenses.has(interdit.nom));

    for (const interdit of applicables) {
      if (interdit.motif.test(cheminRelatif)) {
        erreurs.push(`${cheminRelatif} : ${interdit.nom} dans le chemin`);
      }
    }

    const lignes = readFileSync(chemin, "utf8").split(/\r?\n/);
    lignes.forEach((ligne, index) => {
      for (const interdit of applicables) {
        if (interdit.motif.test(ligne)) {
          erreurs.push(
            `${cheminRelatif}:${index + 1} : ${interdit.nom} interdit dans V2`,
          );
        }
      }
    });
  }

  return { fichiers: fichiers.map((chemin) => relative(base, chemin).replaceAll("\\", "/")), erreurs };
}

const lanceEnLigneDeCommande =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (lanceEnLigneDeCommande) {
  const { fichiers, erreurs } = analyserPerimetre();
  assert.deepEqual(erreurs, [], erreurs.join("\n"));
  console.log(`Automatismes V2 : garde-fous validés sur ${fichiers.length} fichiers.`);
}
