import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const page = await readFile(new URL("../outils/club_maths/carres_gloutons.html", import.meta.url), "utf8");
const hub = await readFile(new URL("../outils/club_maths/index.html", import.meta.url), "utf8");
const script = page.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)?.[1] || "";

test("Les Carrés gloutons est une ressource publique autonome", () => {
  assert.match(page, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.match(page, /href="\.\.\/index\.html\?domain=jeux-recherches&amp;notion=strategie"/);
  assert.doesNotMatch(page, /Axelle|sessionStorage|axelle-game-pass/);
  assert.match(page, /face\.textContent = color === PLAYER \? "★" : "😋"/);
  assert.match(page, /Deux manches/);
  assert.match(hub, /href="carres_gloutons\.html" class="card gloutons"/);
});

test("le moteur intégré reste syntaxiquement valide et protège la stabilité mobile", () => {
  assert.ok(script.length > 0, "le moteur du jeu doit être présent");
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(page, /\.status\s*\{[\s\S]*?height:\s*64px;/);
  assert.match(page, /\.game\s*\{[\s\S]*?overflow-anchor:\s*none;/);
  assert.match(script, /if \(completed\.length > 0\)[\s\S]*?if \(color === AI\) scheduleAi\(\)/);
});
