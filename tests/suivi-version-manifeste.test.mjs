import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(racine, "_serveur/public");
const MANIFESTE = join(PUBLIC, "VERSION");

// Lot 12 du suivi (05/09/2026) — le manifeste du serveur.
//
// La publication du serveur PHP est manuelle (WinSCP) : rien ne prouvait que
// ce qui tourne chez OVH est ce qui a été testé ici. Chaque lot dépose un
// fichier VERSION — la liste des fichiers avec leur empreinte SHA-256 — et
// verifier.php la recompte en ligne.
//
// Ce test-ci garde le manifeste HONNÊTE : il refait le calcul sur le dépôt.
// Sans lui, un lot pourrait modifier api/prof.php sans régénérer VERSION, et
// verifier.php déclarerait « différent du dépôt » un fichier pourtant juste.
//
// Régénérer après toute modification de _serveur/public/ :
//   php _serveur/outils/generer-version.php <nom-du-lot>
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) modifier un fichier de _serveur/public/ sans régénérer VERSION
//  b) retirer un fichier de la liste HORS_MANIFESTE de generer-version.php
//  c) faire figurer config.php ou secours.php au manifeste

// La même liste que _serveur/outils/generer-version.php. Ces fichiers-là ne
// sont jamais en ligne (config, installation, secours, sauvegarde) ou ne
// peuvent pas contenir leur propre empreinte (VERSION).
const HORS_MANIFESTE = new Set([
  "config.php", "config.exemple.php",
  "installer.php", "migrer.php", "secours.php", "sauvegarde.php",
  "VERSION",
]);

function fichiers(dossier) {
  const trouves = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) { trouves.push(...fichiers(chemin)); continue; }
    const relatif = relative(PUBLIC, chemin).split("\\").join("/");
    if (HORS_MANIFESTE.has(relatif)) continue;
    trouves.push(relatif);
  }
  return trouves;
}

const attendus = fichiers(PUBLIC).sort();
const lignesAttendues = attendus.map(
  relatif => createHash("sha256").update(readFileSync(join(PUBLIC, relatif))).digest("hex") + "  " + relatif);
const texte = readFileSync(MANIFESTE, "utf8");
const lignesLues = texte.split("\n").filter(ligne => /^[0-9a-f]{64} {2}/.test(ligne));

test("VERSION décrit exactement les fichiers du serveur, avec les bonnes empreintes", () => {
  assert.deepEqual(
    lignesLues, lignesAttendues,
    "VERSION n'est plus à jour : relance « php _serveur/outils/generer-version.php <nom-du-lot> »");
});

test("VERSION annonce le bon nombre de fichiers et sa propre empreinte", () => {
  const nombre = texte.match(/^fichiers (\d+)$/m);
  assert.ok(nombre, "la ligne « fichiers » doit être là");
  assert.equal(Number(nombre[1]), lignesLues.length);

  const empreinte = texte.match(/^manifeste ([0-9a-f]{64})$/m);
  assert.ok(empreinte, "la ligne « manifeste » doit être là");
  // C'est cette empreinte qui identifie une version : elle se compare entre la
  // notice du lot et la ligne affichée par verifier.php en ligne. (Le numéro
  // du commit ne peut pas y figurer — le fichier fait partie du commit.)
  assert.equal(
    createHash("sha256").update(lignesLues.join("\n") + "\n").digest("hex"), empreinte[1]);

  assert.ok(/^lot \S+$/m.test(texte), "le nom du lot doit être là");
  assert.ok(/^genere_le \d{4}-\d{2}-\d{2}$/m.test(texte), "la date de génération doit être là");
});

test("ni config.php, ni les pages qu'on dépose puis qu'on retire, ne figurent au manifeste", () => {
  for (const interdit of ["config.php", "config.exemple.php", "installer.php", "migrer.php",
                          "secours.php", "sauvegarde.php", "VERSION"]) {
    assert.ok(!lignesLues.some(ligne => ligne.endsWith("  " + interdit)),
      `${interdit} ne doit pas figurer au manifeste : il ne doit pas être en ligne`);
  }
  // menage.php, lui, se dépose : c'est la tâche planifiée de fin d'année.
  assert.ok(lignesLues.some(ligne => ligne.endsWith("  menage.php")), "menage.php doit y être");
  for (const attendu of ["api/prof.php", "lib/bd.php", "lib/archives.php", "verifier.php",
                         "prof/index.php", "prof/defi_tables_mon_parcours.js", ".htaccess"]) {
    assert.ok(lignesLues.some(ligne => ligne.endsWith("  " + attendu)), `${attendu} doit y être`);
  }
});
