import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shellScript = await readFile(new URL("../assets/js/printer-shell.js", import.meta.url), "utf8");
const shellStyles = await readFile(new URL("../assets/css/printer-shell.css", import.meta.url), "utf8");
const prototypePaths = [
  "outils/fractions/disque_maker.html",
  "outils/fabrication_materiel/cartes_premiers_1_100.html",
  "outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html",
  "outils/automatismes/CM_Livret_A5.html",
];
const prototypePages = Object.fromEntries(await Promise.all(prototypePaths.map(async (path) => [
  path,
  await readFile(new URL(`../${path}`, import.meta.url), "utf8"),
])));

test("les quatre architectures du prototype chargent la même enveloppe", () => {
  for (const [path, html] of Object.entries(prototypePages)) {
    assert.match(html, /assets\/css\/printer-shell\.css\?v=1/, path);
    assert.match(html, /assets\/js\/printer-shell\.js\?v=1/, path);
  }

  for (const path of [
    "/outils/fractions/disque_maker.html",
    "/outils/fabrication_materiel/cartes_premiers_1_100.html",
    "/outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html",
    "/outils/automatismes/CM_Livret_A5.html",
  ]) {
    assert.match(shellScript, new RegExp(path.replaceAll("/", "\\/")));
  }
});

test("l'enveloppe apporte marque, retour, vues et actions sans emoji", () => {
  assert.match(shellScript, /mathsgo-logo-390\.png/);
  assert.match(shellScript, /data-printer-view="settings"/);
  assert.match(shellScript, /data-printer-view="preview"/);
  assert.match(shellScript, /createButton\("preview", "Aperçu", icon\.preview\)/);
  assert.match(shellScript, /createButton\("generate", "Générer", icon\.generate/);
  assert.match(shellScript, /createButton\("print", "Imprimer \/ PDF", icon\.print/);
  assert.match(shellScript, /<svg viewBox=/);
  assert.doesNotMatch(shellScript, /[🎲🖨️📐🟦🟨⚙️]/u);
});

test("ordinateur et téléphone ont deux compositions explicites", () => {
  assert.match(shellStyles, /grid-template-columns:\s*minmax\(300px, 350px\) minmax\(0, 1fr\)/);
  assert.match(shellStyles, /@media screen and \(max-width:\s*760px\)/);
  assert.match(shellStyles, /data-mathsgo-printer-view="settings"[^}]*\.mg-printer-preview-pane/s);
  assert.match(shellStyles, /data-mathsgo-printer-view="preview"[^}]*\.mg-printer-settings/s);
  assert.match(shellStyles, /\.mg-printer-actions\s*\{[^}]*position:\s*fixed/s);
  assert.match(shellStyles, /min-height:\s*48px/);
});

test("les aperçus sont ajustés à l'écran mais jamais redimensionnés pour l'impression", () => {
  assert.match(shellScript, /Math\.min\(1, availableWidth \/ naturalWidth\)/);
  assert.match(shellScript, /window\.matchMedia\("print"\)\.matches/);
  assert.match(shellScript, /beforeprint[\s\S]*removeProperty\("zoom"\)/);

  const printStyles = shellStyles.slice(shellStyles.lastIndexOf("@media print"));
  assert.match(printStyles, /\[data-mathsgo-printer-page\]\s*\{[^}]*zoom:\s*1\s*!important/s);
  assert.match(printStyles, /\.mathsgo-printer-shell \.no-print,[\s\S]*?\.mathsgo-printer-shell \.preview-controls,[\s\S]*?display:\s*none\s*!important/s);
  assert.doesNotMatch(printStyles, /(?:\.page|\.page-a4|\.sheet)\s*\{[^}]*(?:width|height|transform)\s*:/s);
});

test("les résumés restent contenus dans la largeur disponible", () => {
  assert.match(shellStyles, /\.mg-printer-summary\s*\{[^}]*box-sizing:\s*border-box;[^}]*max-width:\s*100%/s);
});

test("les boutons communs délèguent aux moteurs existants", () => {
  assert.match(shellScript, /originalGenerate\.click\(\)/);
  assert.match(shellScript, /originalPrint\.click\(\)/);
  assert.doesNotMatch(shellScript, /window\.print\s*\(/);
  assert.match(shellScript, /printAction\.disabled = pageCount === 0/);
});
