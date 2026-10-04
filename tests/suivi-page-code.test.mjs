// Page « Mon espace » de suivi.mathsgo.re (04/10/2026, Gwenaël) : la phrase
// sous la case du code était fausse (« ce sont des zéros et des uns… si tu
// hésites, c'est un chiffre ») — un code n'a ni O, ni I, ni 0, ni 1. Et le
// bouton « Entrer » était collé à gauche sous une case centrée.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const page = await readFile(new URL("../_serveur/public/index.php", import.meta.url), "utf8");
const codes = await readFile(new URL("../_serveur/public/lib/codes.php", import.meta.url), "utf8");

test("la phrase sous la case dit vrai : 6 caractères, des lettres et des chiffres", () => {
  const alphabet = codes.match(/const ALPHABET_CODE = '([^']+)';/)[1];
  assert.ok(!/[O0I1]/.test(alphabet), "l'alphabet n'a ni O, ni 0, ni I, ni 1");
  assert.match(page, /<p class="aide">Ton code a 6 caractères&nbsp;: des lettres et des chiffres\.<\/p>/);
  assert.doesNotMatch(page, /zéros et des uns|c’est un chiffre/, "plus de conseil vers un 0 ou un 1 qui n'existent pas");
  assert.match(codes, /const LONGUEUR_CODE = 6;/, "la phrase dit 6 : le code en a 6");
});

test("« Entrer » : toute la largeur au téléphone, centré sur ordinateur", () => {
  assert.match(page, /#form-code \.actions button \{ flex: 1 1 100%; \}/);
  assert.match(page, /@media \(min-width: 600px\) \{\s*#form-code \.actions \{ justify-content: center; \}\s*#form-code \.actions button \{ flex: 0 0 auto; min-width: 240px; \}\s*\}/);
});
