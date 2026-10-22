import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contraste } from "../packages/charte/src/charte.js";

const lire = (chemin) => readFileSync(new URL(chemin, import.meta.url), "utf8");
const style = lire("../automatismes/style.css");
const charte = lire("../packages/charte/src/charte.js");
const defiTables = lire("../outils/calcul_mental/defi_tables.html");
const couleurs = (texte) =>
  [...texte.matchAll(/#[\da-f]{3,8}\b/gi)].map(([hex]) => normaliser(hex));

function normaliser(hex) {
  const valeur = hex.toLowerCase();
  return valeur.length === 4
    ? `#${[...valeur.slice(1)].map((chiffre) => chiffre.repeat(2)).join("")}`
    : valeur;
}

const palette = new Set([...couleurs(charte), ...couleurs(defiTables)]);
const variables = Object.fromEntries(
  [...style.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]{3,8})\s*;/gi)].map(([, nom, couleur]) => [
    nom,
    normaliser(couleur),
  ]),
);

// Tous les rôles de texte de la feuille ont une paire contrôlée ci-dessous.
const paires = [
  ["--encre", "--papier"],
  ["--encre", "--fond-doux"],
  ["--encre", "--fond-page"],
  ["--encre", "--orange"],
  ["--encre", "--vert-fond"],
  ["--encre", "--rouge-fond"],
  ["--attenue", "--papier"],
  ["--attenue", "--fond-doux"],
  ["--attenue", "--fond-page"],
  ["--bleu", "--papier"],
  ["--bleu", "--fond-doux"],
  ["--bleu-identite", "--papier"],
  ["--bleu-identite", "--fond-doux"],
  ["--turquoise-texte", "--fond-doux"],
  ["--orange-texte", "--papier"],
  ["--vert", "--vert-fond"],
  ["--rouge", "--rouge-fond"],
  ["--papier", "--bleu"],
];

test("chaque couleur de style.css provient de la charte ou de Défi tables", () => {
  const inconnues = [...new Set(couleurs(style))].filter((couleur) => !palette.has(couleur));
  assert.deepEqual(inconnues, []);
  assert.doesNotMatch(style, /\b(?:rgba?|hsla?|oklch|lab)\s*\(/i);
});

test("chaque paire de texte dépasse le contraste 4,5 de la charte", () => {
  for (const [texte, fond] of paires) {
    assert.ok(variables[texte], `Couleur absente : ${texte}`);
    assert.ok(variables[fond], `Couleur absente : ${fond}`);
    const rapport = contraste(variables[texte], variables[fond]);
    assert.ok(rapport >= 4.5, `${texte} sur ${fond} : ${rapport.toFixed(2)}`);
  }
});

test("aucun rôle de texte ne peut être ajouté sans son contrôle de contraste", () => {
  const controles = new Set(paires.map(([texte]) => texte));
  const blocs = [...style.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, selecteurs, declarations] of blocs) {
    for (const [, role] of declarations.matchAll(/(?:^|;)\s*color:\s*var\((--[\w-]+)\)/g)) {
      // La valeur de progress colore uniquement la jauge native, pas du texte.
      if (role === "--turquoise" && selecteurs.trim() === ".progression") continue;
      assert.ok(controles.has(role), `Rôle de texte non contrôlé : ${role}`);
    }
  }
});

test("les couleurs de texte sont des rôles, jamais un hexadécimal dispersé", () => {
  assert.doesNotMatch(style, /(?:^|;)\s*color:\s*#/m);
  assert.doesNotMatch(style, /(?:^|;)\s*color:\s*var\(--orange\)/m);
});
