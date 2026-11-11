import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EXCLUSIONS, REQUIS, estExclu, fichiersDe, verifierListe, verifierSite,
} from "../scripts/verifier-publication.mjs";

// Lot « petits correctifs de sécurité » (11/11/2026), constat F09 de l'audit
// GPT du 09/11 : tests/, scripts/ et docs/ étaient publiés avec le site (un
// test du dépôt privé se lisait sur https://mathsgo.re/tests/…). Ces tests
// tiennent l'assemblage de .github/workflows/publier.yml et son contrôle,
// scripts/verifier-publication.mjs — sans rsync, que Windows n'a pas.

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = fs.readFileSync(path.join(racine, ".github/workflows/publier.yml"), "utf8");

function etapeAssembler() {
  const debut = workflow.indexOf("- name: Assembler le site");
  assert.ok(debut > 0, "publier.yml doit garder son étape « Assembler le site »");
  return workflow.slice(debut, workflow.indexOf("\n      - name:", debut + 1));
}

test("publier.yml exclut exactement ce que le contrôle connaît, et contrôle l'archive avant de l'empaqueter", () => {
  const etape = etapeAssembler();
  const motifs = [...etape.matchAll(/--exclude '([^']+)'/g)].map(([, motif]) => motif);
  assert.deepEqual(motifs, EXCLUSIONS,
    "les --exclude de publier.yml et EXCLUSIONS de scripts/verifier-publication.mjs doivent rester identiques");
  for (const ancre of ["/tests/", "/scripts/", "/docs/"]) {
    assert.ok(motifs.includes(ancre), `${ancre} doit rester ANCRÉ (sans « / » devant, auto/scripts/ partirait aussi)`);
  }
  const rsync = etape.indexOf("rsync -a");
  const controle = etape.indexOf("node scripts/verifier-publication.mjs _site");
  assert.ok(rsync > 0 && controle > rsync, "le contrôle tourne après l'assemblage");
  assert.doesNotMatch(etape, /continue-on-error/, "et il bloque la publication");
  const empaqueter = workflow.indexOf("- name: Empaqueter pour publication");
  assert.ok(workflow.indexOf("- name: Assembler le site") < empaqueter, "avant l'empaquetage");
});

test("estExclu juge comme rsync : dossiers de la racine seulement, fichiers de test à toute profondeur", () => {
  const exclus = [
    "tests/suivi-version-manifeste.test.mjs", "tests/fixtures/a.json", "scripts/generate-seo.mjs",
    "scripts/lib/seo-publication.mjs", "docs/langage-barres.md", "AGENTS.md", "_serveur/public/index.php",
    "_sources/x.tex", ".github/workflows/publier.yml", "outils/x/.cache", "packages/objets/src/solides.test.js",
    "405/assets/content.test.js", "outils/a/b.test.mjs", "outils/a/b.test.cjs", "package.json",
    "packages/charte/package.json", "node_modules/x/index.js", "axelle/daily/template-index.html",
  ];
  const publies = [
    "index.html", "auto/scripts/00-setup-icons.js", "auto/scripts/shared/visuals/00-registry.js",
    "studio/docs/01-VISION-ET-PRINCIPES.md", "outils/tests.html", "outils/calcul_mental/defi_tables.html",
    "packages/objets/src/solides.js", "outils/docs/a.pdf", "SOLEY.md", "outils/AGENTS.md",
  ];
  for (const chemin of exclus) assert.ok(estExclu(chemin), `${chemin} devrait être exclu`);
  for (const chemin of publies) assert.ok(!estExclu(chemin), `${chemin} devrait être publié`);
  assert.ok(estExclu("tests", true) && estExclu("scripts", true) && estExclu("docs", true));
  assert.ok(!estExclu("auto/scripts", true) && !estExclu("studio/docs", true));
});

test("le dépôt d'aujourd'hui, assemblé : aucune page ne désigne un fichier retiré, les pages indispensables sont là", () => {
  const fichiers = fichiersDe(racine, { elaguer: (relatif, dossier) => estExclu(relatif, dossier) });
  assert.ok(fichiers.length > 1000, `seulement ${fichiers.length} fichiers publiés`);
  assert.ok(!fichiers.some((f) => f.startsWith("tests/") || f.startsWith("scripts/") || f.startsWith("docs/")));
  assert.ok(fichiers.includes("auto/scripts/00-setup-icons.js"), "auto/scripts/ reste publié");
  const erreurs = verifierListe(fichiers, (relatif) => fs.readFileSync(path.join(racine, relatif), "utf8"));
  assert.deepEqual(erreurs, []);
});

// Une fausse archive, dans un dossier jetable : ce que le contrôle doit refuser.
function archive(fichiers) {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "publication-"));
  for (const requis of REQUIS) fichiers[requis] ??= "<!doctype html><title>x</title>";
  for (const [relatif, contenu] of Object.entries(fichiers)) {
    const chemin = path.join(dossier, ...relatif.split("/"));
    fs.mkdirSync(path.dirname(chemin), { recursive: true });
    fs.writeFileSync(chemin, contenu);
  }
  return dossier;
}

test("une archive propre passe ; auto/scripts/ et un dossier « tests » d'une appli ne sont pas des fautes", () => {
  const dossier = archive({ "auto/scripts/a.js": "", "outils/jeu/tests/donnees.json": "{}" });
  try {
    assert.deepEqual(verifierSite(dossier), []);
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }
});

test("une archive qui contient un fichier technique, ou une page qui en dépend, est refusée — et chaque faute est nommée", () => {
  const dossier = archive({
    "tests/leurre.test.mjs": "",
    "scripts/leurre.js": "",
    "docs/note.md": "",
    "AGENTS.md": "",
    "_serveur/leurre.php": "",
    "outils/jeu/leurre.test.mjs": "",
    "outils/page.html": '<script src="../scripts/outil.js"></script><a href="/docs/guide.md">guide</a><a href="https://exemple.org/tests/x">ailleurs</a>',
  });
  try {
    const erreurs = verifierSite(dossier);
    for (const attendu of [
      "tests/leurre.test.mjs", "scripts/leurre.js", "docs/note.md", "AGENTS.md", "_serveur/leurre.php",
      "outils/jeu/leurre.test.mjs", "outils/page.html → scripts/outil.js", "outils/page.html → docs/guide.md",
    ]) {
      assert.ok(erreurs.some((e) => e.endsWith(attendu)), `faute non vue : ${attendu}\n${erreurs.join("\n")}`);
    }
    assert.ok(!erreurs.some((e) => e.includes("exemple.org")), "un autre site n'est pas notre affaire");
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }
});

test("une exclusion trop large se voit : une page indispensable manquante est refusée", () => {
  const dossier = archive({});
  try {
    fs.rmSync(path.join(dossier, "auto/scripts/00-setup-icons.js"));
    assert.deepEqual(verifierSite(dossier), ["Fichier indispensable absent de la publication : auto/scripts/00-setup-icons.js"]);
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }
});
