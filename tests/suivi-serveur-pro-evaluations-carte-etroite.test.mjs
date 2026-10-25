import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, correctif 5c-bis (25/10/2026, capture de Gwenaël) : depuis le
// lot 5c, la carte « 📝 Évaluations » est le tiers de la page (≈ 350 px).
// Les deux boutons d'un modèle, gardés à droite du texte, ne lui laissaient
// que 13 px (un mot par ligne) ; et pendant une évaluation, la liste « Qui a
// commencé, qui a fini » exigeait 330 px par ligne dans une carte de 317 px.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");

test("un modèle : le texte prend la ligne, les boutons sont regroupés dessous", () => {
  assert.match(page, /\.eval-modeles li \{ display: flex; flex-wrap: wrap;/);
  assert.match(page, /\.eval-modeles li > \.texte \{ flex: 1 1 240px; min-width: 0;/);
  assert.match(page, /\.eval-modeles \.gestes \{ display: flex; flex-wrap: wrap; justify-content: flex-end;/);
  assert.doesNotMatch(page, /\.eval-modeles li \{ display: grid; grid-template-columns: minmax\(0, 1fr\) auto auto;/);
  assert.match(page, /const texte = el\("div", "texte"\);\s*texte\.append\(el\("b", "", modele\.nom\)/);
  assert.match(page, /const gestes = el\("div", "gestes"\);\s*gestes\.append\(modifier, ouvrir\);\s*ligne\.append\(texte, gestes\);/);
});

test("évaluation ouverte : une ligne d'élève ne dépasse jamais la carte", () => {
  assert.match(page, /\.eval-eleves \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(min\(330px, 100%\), 1fr\)\);/);
  assert.doesNotMatch(page, /minmax\(330px, 1fr\)/);
});
