import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const page = await readFile(new URL("../outils/club_maths/carres_gloutons.html", import.meta.url), "utf8");
const hub = await readFile(new URL("../outils/club_maths/index.html", import.meta.url), "utf8");
const thumbnail = await readFile(new URL("../assets/img/thumbnails/jeux/carres-gloutons.svg", import.meta.url), "utf8");
const script = page.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)?.[1] || "";

test("Les Carrés gloutons est une ressource publique autonome", () => {
  assert.match(page, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.match(page, /href="\.\.\/index\.html\?domain=jeux-recherches&amp;notion=strategie"/);
  assert.doesNotMatch(page, /Axelle|sessionStorage|axelle-game-pass/);
  assert.match(page, /const WINS_TO_TAKE_MATCH = 2/);
  assert.match(page, /Premier à 2 victoires/);
  assert.match(page, /current = round % 2 === 1 \? PLAYER : AI/);
  assert.match(page, /matchOver = playerWins >= WINS_TO_TAKE_MATCH \|\| aiWins >= WINS_TO_TAKE_MATCH/);
  assert.match(script, /if \(matchOver\)[\s\S]*?playerWins = 0;[\s\S]*?else \{\s*round \+= 1;/);
  assert.match(script, /nextRound\.textContent = matchOver \? "Rejouer le match"/);
  assert.match(page, /Tracer ce segment entre deux points voisins/);
  assert.doesNotMatch(page, /\btrait(?:s)?\b/i);
  assert.match(hub, /href="carres_gloutons\.html" class="card gloutons"/);
});

test("les marqueurs sont vectoriels, centrés et indépendants des polices emoji", () => {
  assert.match(thumbnail, /<svg[^>]*width="720"[^>]*height="320"[^>]*viewBox="0 0 720 320"/);
  assert.match(script, /function markerFor\(color, cx, cy\)/);
  assert.match(page, /class: "player-marker-star"/);
  assert.match(page, /class: "ai-marker-mouth"/);
  assert.doesNotMatch(page, /★|😋|box-face/);
  assert.match(thumbnail, /<polygon points="0,-19/);
  assert.match(thumbnail, /<path d="M-12 4Q0 16 12 4"/);
  assert.doesNotMatch(thumbnail, /★|😋|dominant-baseline|Apple Color Emoji|Segoe UI Emoji/);
});

test("le plein écran et le socle public restent disponibles", () => {
  assert.match(page, /id="fullscreen-button"/);
  assert.match(script, /game\.requestFullscreen \|\| game\.webkitRequestFullscreen/);
  assert.match(script, /document\.exitFullscreen \|\| document\.webkitExitFullscreen/);
  assert.match(page, /html\.fullscreen-fallback body\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?height:\s*100dvh;/);
  assert.match(script, /root\.classList\.add\("fullscreen-fallback"\)/);
  assert.match(script, /event\.key !== "Escape" \|\| !root\.classList\.contains\("fullscreen-fallback"\)/);
  assert.match(page, /href="\.\.\/\.\.\/assets\/css\/consentement\.css"/);
  assert.match(page, /src="\.\.\/\.\.\/assets\/js\/consentement\.js"/);
  assert.match(page, /Gwenaël Bourgault/);
  assert.match(page, />Gérer mes cookies<\/button>/);
  assert.match(page, /body\.game-fullscreen \.site-footer \{ display: none; \}/);
});

test("le moteur intégré reste syntaxiquement valide et protège la stabilité mobile", () => {
  assert.ok(script.length > 0, "le moteur du jeu doit être présent");
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(page, /\.status\s*\{[\s\S]*?height:\s*64px;/);
  assert.match(page, /\.game\s*\{[\s\S]*?overflow-anchor:\s*none;/);
  assert.match(script, /if \(completed\.length > 0\)[\s\S]*?if \(color === AI\) scheduleAi\(\)/);
  assert.match(script, /event\.detail > 0[\s\S]*?group\.blur\(\)/);
  assert.match(script, /if \(focusedEdge\?\.classList\.contains\("taken"\)\) restoreFocusAfterTakenEdge\(focusedEdge\.dataset\.edge\)/);
  assert.match(script, /const action = result\.hidden \? rulesButton : nextRound;[\s\S]*?action\.focus\(\{ preventScroll: true \}\)/);
});

test("un segment pris restitue le focus clavier sans réactiver le focus souris", () => {
  const clickHandler = script.match(/group\.addEventListener\("click", event => \{([\s\S]*?)\n\s*\}\);/)?.[1] || "";
  const blurIndex = clickHandler.indexOf("group.blur()");
  const moveIndex = clickHandler.indexOf("playerMove(key)");
  assert.notEqual(blurIndex, -1);
  assert.notEqual(moveIndex, -1);
  assert.ok(blurIndex < moveIndex);
  assert.match(script, /const next = available\.find[\s\S]*?next\.focus\(\{ preventScroll: true \}\)/);
  assert.match(script, /window\.queueMicrotask\(\(\) => \{/);
});
