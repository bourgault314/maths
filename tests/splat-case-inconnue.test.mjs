/* Petit Splat, mode élève (18/09/2026) : les cases à remplir sont VIDES, comme
   sur les fiches imprimées — plus aucun « ? » d'attente, ni dans le schéma en
   barres (haut, visibles, taches) ni dans le badge du total de la carte.

   Deuxième point du même lot : la mini-tache dessinée dans une case tache
   chevauchait le nombre quand la case était étroite (2 jetons cachés sur 15).
   Elle est maintenant plus petite et serrée dans le coin haut-gauche ; les
   chiffres, eux, restent centrés exactement comme avant.

   Le pavé de chiffres et la correction ne changent pas (ils ne lisaient jamais
   le placeholder). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const petit = readFileSync(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");

// La fabrique de case, exécutée telle quelle avec une mini-tache factice.
function fabrique() {
  const debut = petit.indexOf("function eleveCaseInput(");
  const fin = petit.indexOf("\n}\n", debut) + 3;
  assert.ok(debut > 0 && fin > debut, "eleveCaseInput introuvable");
  const code = petit.slice(debut, fin);
  return new Function("ELEVE_MINI_TACHE", `${code}\nreturn eleveCaseInput;`)("<svg class=\"miniTache\"></svg>");
}

test("une case à remplir n'a AUCUN placeholder : haut, visibles, tache", () => {
  const eleveCaseInput = fabrique();
  for (const html of [
    eleveCaseInput(14, 1, "40px", "20px", "white", true),          // haut (total)
    eleveCaseInput(10, 1, "40px", "20px", "white", false),         // visibles
    eleveCaseInput(4, 1, "40px", "20px", "#d4deea", false, true),  // tache
  ]) {
    assert.doesNotMatch(html, /placeholder/);
    assert.match(html, /<input class="eleve-input" type="text" inputmode="numeric" maxlength="3" autocomplete="off">/, "la case reste une case à remplir, au clavier comme au pavé");
  }
  assert.match(eleveCaseInput(4, 1, "40px", "20px", "#d4deea", false, true), /miniTache/, "la case tache garde sa mini-tache");
});

test("le badge du total (mode Dessine) est à remplir, sans placeholder", () => {
  const badge = petit.slice(petit.indexOf("const badge = estConstruct"), petit.indexOf("const splatPart = `<div class=\"part-splat\">`"));
  assert.match(badge, /total-badge eleve-case/);
  assert.match(badge, /<input class="eleve-input"/);
  assert.doesNotMatch(badge, /placeholder/);
});

test("plus aucun « ? » d'attente dans la page élève (ni attribut, ni style orphelin)", () => {
  assert.doesNotMatch(petit, /placeholder="\?"/);
  assert.doesNotMatch(petit, /\.eleve-input::placeholder/);
});

test("la mini-tache se serre dans le coin haut-gauche, au-dessus de la ligne des chiffres", () => {
  // Avant : 22×15 px à (5,4) — dans une case étroite (2 jetons cachés sur 15), elle mordait sur le
  // nombre. Les chiffres restent centrés comme avant : c'est la tache qui recule dans le coin.
  assert.match(petit, /\.eleve-case \.miniTache, \.part-box\.avec-tache \.miniTache \{ position: absolute; left: 2px; top: 2px; width: 14px; height: 10px; opacity: \.8; pointer-events: none; \}/);
  assert.match(petit, /\.eleve-case \.miniTache, \.part-box\.avec-tache \.miniTache \{ width: 24px; height: 16px; left: 4px; top: 4px; \}/, "grand écran : 24×16 au lieu de 34×22");
  assert.doesNotMatch(petit, /\.row-bottom \.part-box \{ [^}]*padding-top/, "pas de bande qui décalerait les chiffres vers le bas");
});
