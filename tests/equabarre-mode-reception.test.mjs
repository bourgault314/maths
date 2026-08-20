import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");

// ÉquaBarre reçoit désormais les équations de Splat, Splat Équations et des
// Automatismes. Le tableau reçu appartient à celui qui l'a envoyé : « Menu » le
// vide et le dé le remplace par un tirage au hasard en effaçant l'adresse, donc
// plus rien ne le ramènerait. Ces deux boutons disparaissent à la réception.

test("le mode réception retire « Menu » et le dé", () => {
  assert.match(html, /main\.importMode \.menuQuickBtn,\s*main\.importMode \.randomQuickBtn\{\s*display:none;\s*\}/);
});

test("la règle du mode réception passe après celle du mode actif", () => {
  // Les deux sélecteurs ont la même spécificité : seule leur place dans la
  // feuille de style départage « display:inline-grid » et « display:none ».
  const modeActif = html.indexOf("main.activeMode .menuQuickBtn");
  const modeReception = html.indexOf("main.importMode .menuQuickBtn");
  assert.ok(modeActif !== -1 && modeReception !== -1, "les deux règles existent");
  assert.ok(modeReception > modeActif, "la règle de réception doit venir après celle du mode actif");
});

test("le mode réception s'allume à l'import et nulle part ailleurs", () => {
  assert.match(html, /function setReceptionMode\(on\)\{\s*if\(!appMain\) return;\s*appMain\.classList\.toggle\("importMode", !!on\);\s*\}/);

  // Un seul appel, dans la branche qui suit un import réussi.
  const appels = html.match(/setReceptionMode\(/g) || [];
  assert.equal(appels.length, 2, "une déclaration et un seul appel");
  assert.match(html, /if\(!tryImportFromUrl\(\)\)\{[\s\S]*?\}else\{\s*setBuilderLayout\("active"\);\s*setReceptionMode\(true\);\s*\}/);

  // Le constructeur local construit le même état, mais garde ses deux boutons :
  // l'équation est celle de l'utilisateur, il a le droit d'en changer.
  const constructeur = html.slice(
    html.indexOf("function buildPayloadInCurrentPage"),
    html.indexOf("function buildEquationFromInput")
  );
  assert.ok(constructeur.length > 0, "le constructeur local est bien là");
  assert.ok(!constructeur.includes("setReceptionMode"), "le constructeur local n'allume pas le mode réception");
});
