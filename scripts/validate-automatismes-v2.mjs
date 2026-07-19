import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  PROVENANCE_FONDATION_V2,
  STATUTS,
} from "../packages/objets/src/provenance.js";

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
  "automatismes-v2",
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

function fichiersDuPerimetre(base, racines) {
  return racines
    .map((racine) => resolve(base, racine))
    .filter((racine) => existsSync(racine) && statSync(racine).isDirectory())
    .flatMap(listerFichiers)
    .filter((chemin) => extensionsLues.has(extension(chemin)));
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
  const fichiers = fichiersDuPerimetre(base, racines);

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

/**
 * Vérifie que chaque fichier de production V2 déclare son origine et que le
 * registre ne conserve aucune entrée pour un fichier disparu.
 */
export function verifierProvenance({
  base = RACINE_DEPOT,
  racines = RACINES_V2,
  registre = PROVENANCE_FONDATION_V2,
} = {}) {
  const surDisque = new Set(
    fichiersDuPerimetre(base, racines)
      .map((chemin) => relative(base, chemin).replaceAll("\\", "/"))
      .filter((chemin) => !chemin.endsWith(".test.js")),
  );
  const declares = new Set(Object.keys(registre));
  const erreurs = [];

  for (const chemin of [...surDisque].sort()) {
    if (!declares.has(chemin)) erreurs.push(`${chemin} : provenance non déclarée`);
  }

  for (const chemin of [...declares].sort()) {
    if (!surDisque.has(chemin)) erreurs.push(`${chemin} : déclaration de provenance fantôme`);
  }

  for (const [chemin, origine] of Object.entries(registre)) {
    if (!STATUTS.includes(origine?.statut)) {
      erreurs.push(`${chemin} : statut de provenance inconnu`);
    }
    if (typeof origine?.source !== "string" || origine.source.trim().length === 0) {
      erreurs.push(`${chemin} : source de provenance manquante`);
    }
    if (
      origine?.statut === "herite_doctools" &&
      (!Array.isArray(origine.aRemplacer) || origine.aRemplacer.length === 0)
    ) {
      erreurs.push(`${chemin} : dette héritée sans remplacement décrit`);
    }
  }

  return { fichiers: [...surDisque].sort(), erreurs };
}

const lanceEnLigneDeCommande =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (lanceEnLigneDeCommande) {
  const analyse = analyserPerimetre();
  const provenance = verifierProvenance();
  const erreurs = [...analyse.erreurs, ...provenance.erreurs];
  assert.deepEqual(erreurs, [], erreurs.join("\n"));
  console.log(
    `Automatismes V2 : garde-fous validés sur ${analyse.fichiers.length} fichiers, ` +
      `${provenance.fichiers.length} fichiers de production avec provenance déclarée.`,
  );
}
