import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../outils/club_maths/yavalath.html", import.meta.url), "utf8");

test("Yavalath garde une barre d’actions stable pendant le tour automatique de l’IA", () => {
  const actions = page.match(/<div class="main-actions"[^>]*>([\s\S]*?)<\/div>/)?.[1] || "";

  assert.equal((actions.match(/<button\b/g) || []).length, 6, "les cinq actions permanentes et l’action de fin de partie restent présentes");
  assert.doesNotMatch(page, /aiNowBtn|Faire jouer l['’]IA/, "aucun bouton temporaire ne doit agrandir la grille pendant le tour de l’IA");
  assert.match(page, /@media \(max-width: 850px\)[\s\S]*?\.status-card \{[^}]*min-height:\s*56px;/, "le bandeau d’état doit réserver la même hauteur sur les petits écrans");
  assert.match(page, /aiTimer\s*=\s*setTimeout\(playAiTurn,\s*420\)/, "l’IA doit toujours jouer automatiquement");
  assert.match(page, /if \(shouldScheduleAi\) scheduleAiIfNeeded\(\)/, "un coup du joueur doit toujours programmer la réponse de l’IA");
});
