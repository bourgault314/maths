import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racineDepot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const racinesV2 = [
  "packages/contrats/src",
  "packages/moteur-exercices/src",
  "packages/automatismes/src",
];
const extensionsLues = new Set([".js", ".mjs", ".cjs", ".json"]);

const interdits = [
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
];

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

const fichiers = racinesV2
  .map((racine) => resolve(racineDepot, racine))
  .filter((racine) => existsSync(racine) && statSync(racine).isDirectory())
  .flatMap(listerFichiers)
  .filter((chemin) => extensionsLues.has(extension(chemin)));

const erreurs = [];
for (const chemin of fichiers) {
  const cheminRelatif = relative(racineDepot, chemin).replaceAll("\\", "/");
  for (const interdit of interdits) {
    if (interdit.motif.test(cheminRelatif)) {
      erreurs.push(`${cheminRelatif} : ${interdit.nom} dans le chemin`);
    }
  }

  const lignes = readFileSync(chemin, "utf8").split(/\r?\n/);
  lignes.forEach((ligne, index) => {
    for (const interdit of interdits) {
      if (interdit.motif.test(ligne)) {
        erreurs.push(
          `${cheminRelatif}:${index + 1} : ${interdit.nom} interdit dans V2`,
        );
      }
    }
  });
}

assert.deepEqual(erreurs, [], erreurs.join("\n"));
console.log(`Automatismes V2 : garde-fous validés sur ${fichiers.length} fichiers.`);
