import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Chantier « liens piégés » (15/10/2026) : une page qui lit une donnée dans son
// adresse et l'écrit dans la page ne doit jamais l'écrire comme du HTML. Deux
// pages le faisaient : ÉquaBarre (la lettre de l'inconnue, dans #data=) et
// Petit Splat (le titre imprimé, dans ?title=). Ces tests épinglent les lignes
// corrigées ; la preuve au navigateur est _sources/liens-pieges/preuve.py (à
// jouer sur une copie du site servie en local).

const equabarre = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");
const petitSplat = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");
const diaporama = await readFile(new URL("../_sources/splat-comment-on-joue/diaporama.html", import.meta.url), "utf8");

test("ÉquaBarre : la lettre du lien est une seule lettre, sinon 𝑥", () => {
  assert.match(
    equabarre,
    /const rawWantedVar = typeof payload\.variable === "string" \? payload\.variable\.trim\(\) : "";\s*const normalizedWantedVar = normalizeMathLetters\(rawWantedVar\);\s*const wantedVar = \/\^\[a-zA-Z\]\$\/\.test\(normalizedWantedVar\) \? toMathItalicLetter\(normalizedWantedVar\) : "𝑥";/,
  );
  assert.doesNotMatch(equabarre, /: rawWantedVar;/, "l'ancien repli « n'importe quel texte » ne doit pas revenir");
});

test("ÉquaBarre : normalizeMathLetters lit les lettres mathématiques en entier (drapeau u)", () => {
  // Sans « u », 𝑛 (deux unités de code) n'était jamais reconnu : la lettre du lien
  // ne passait le filtre « une seule lettre » que par le repli sans contrôle.
  assert.match(equabarre, /𝑌𝑍\]\/gu, ch => map\[ch\] \|\| ch\);/);
});

test("ÉquaBarre : l'inconnue est échappée là où elle entre dans le HTML", () => {
  assert.match(equabarre, /const value = escapeHtml\(piece\.type === "x" \? displayedUnknown\(\) : String\(piece\.value\)\);/);
  assert.match(equabarre, /<strong>\$\{escapeHtml\(displayedUnknown\(\)\)\}<\/strong>&nbsp;est trouvé\./);
});

test("Petit Splat : le titre imprimé est échappé avant d'entrer dans l'en-tête", () => {
  assert.match(petitSplat, /function echapperHtml\(texte\) \{\s*return String\(texte == null \? '' : texte\)\s*\.replace\(\/&\/g, '&amp;'\)\s*\.replace\(\/<\/g, '&lt;'\)\s*\.replace\(\/>\/g, '&gt;'\)\s*\.replace\(\/"\/g, '&quot;'\);/);
  assert.match(petitSplat, /<div class="activity-subtitle">\$\{echapperHtml\(printedActivityLabel\)\}<\/div>/);
  assert.doesNotMatch(petitSplat, /<div class="activity-subtitle">\$\{printedActivityLabel\}<\/div>/);
});

test("diaporama (source) : ?suite= refuse « /\\ » comme « // »", () => {
  assert.match(diaporama, /const suite = \/\^\\\/\[\^\\\/\\\\\]\/\.test\(demande\)/);
});
