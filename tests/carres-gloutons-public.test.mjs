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
  assert.match(page, /const ROUNDS_PER_MATCH = 2/);
  assert.match(page, /Match aller-retour : tu commences une manche, Gloubi l’autre/);
  assert.match(page, /Le total des carrés des deux manches désigne le vainqueur ; 9 à 9 donne un match nul/);
  assert.match(page, /<span>Cette manche<\/span>/);
  assert.match(page, /<span>Total du match<\/span>/);
  assert.match(script, /current = starterForRound\(round\)/);
  assert.match(script, /matchOver = round >= ROUNDS_PER_MATCH/);
  assert.match(script, /playerMatchSquares \+= playerSquares;\s*aiMatchSquares \+= aiSquares;/);
  assert.match(script, /if \(matchOver\)[\s\S]*?playerMatchSquares = 0;[\s\S]*?aiMatchSquares = 0;[\s\S]*?else \{\s*round \+= 1;/);
  assert.match(script, /nextRound\.textContent = matchOver \? "Rejouer le match"/);
  assert.doesNotMatch(page, /WINS_TO_TAKE_MATCH|playerWins|aiWins|Premier à 2/);
  assert.match(page, /Tracer ce segment entre deux points voisins/);
  assert.doesNotMatch(page, /\btrait(?:s)?\b/i);
  assert.match(hub, /href="carres_gloutons\.html" class="card gloutons"/);
});

test("le match aller-retour donne exactement un départ à chacun et tranche au cumul", () => {
  const fairnessHelpers = script.match(/function starterForRound\([\s\S]*?(?=\n\s*function makeSvg)/)?.[0] || "";
  assert.ok(fairnessHelpers, "les règles de départ et de résultat doivent rester testables");

  const context = { result: null };
  vm.runInNewContext(`
    const PLAYER = "player";
    const AI = "ai";
    ${fairnessHelpers}
    result = {
      starters: [starterForRound(1), starterForRound(2)],
      playerWin: matchOutcome(10, 8),
      aiWin: matchOutcome(8, 10),
      tie: matchOutcome(9, 9)
    };
  `, context);

  assert.deepEqual(Array.from(context.result.starters), ["player", "ai"]);
  assert.equal(context.result.playerWin, "player");
  assert.equal(context.result.aiWin, "ai");
  assert.equal(context.result.tie, "tie");
});

test("Gloubi retrouve le vrai emoji tandis que l’étoile reste vectorielle", () => {
  assert.match(thumbnail, /<svg[^>]*width="720"[^>]*height="320"[^>]*viewBox="0 0 720 320"/);
  assert.match(script, /function markerFor\(color, cx, cy\)/);
  assert.match(page, /class: "player-marker-star"/);
  assert.match(page, /class="gloubi-emoji gloubi-rule-emoji"[^>]*>😋<\/text>/);
  assert.match(script, /emoji\.textContent = "😋"/);
  assert.match(page, /Apple Color Emoji/);
  assert.doesNotMatch(page, /ai-marker-(?:disc|eye|mouth|tongue)/);
  assert.match(thumbnail, /<polygon points="0,-19/);
  assert.equal((thumbnail.match(/>😋<\/text>/g) || []).length, 2);
  assert.match(thumbnail, /Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji/);
  assert.doesNotMatch(thumbnail, /gloubi-face|M6 7C13|M-13 4Q-1/);
});

test("le vrai emoji est recentré d’après les métriques de la police réellement chargée", () => {
  const markerHelper = script.match(/function markerFor\(color, cx, cy\)[\s\S]*?(?=\n\s*function render)/)?.[0] || "";
  assert.match(markerHelper, /class: "gloubi-emoji"/);
  assert.match(markerHelper, /"data-center-x": cx/);
  assert.match(markerHelper, /"data-center-y": cy/);
  assert.match(script, /function centerGloubiEmoji\(emoji\)/);
  assert.match(script, /const bounds = emoji\.getBBox\(\)/);
  assert.match(script, /centerX - \(bounds\.x \+ bounds\.width \/ 2\)/);
  assert.match(script, /centerY - \(bounds\.y \+ bounds\.height \/ 2\)/);
  assert.match(script, /document\.fonts\?\.ready\.then/);
  assert.match(page, /data-center-x="45" data-center-y="37\.5">😋<\/text>/);
  assert.match(thumbnail, /font-size="46"[^>]*text-anchor="middle" dominant-baseline="central"/);
  assert.match(thumbnail, /<text x="120" y="40">😋<\/text>/);
  assert.match(thumbnail, /<text x="200" y="120">😋<\/text>/);
});

test("le plein écran et le socle public restent disponibles", () => {
  assert.match(page, /id="fullscreen-button"/);
  assert.match(script, /game\.requestFullscreen \|\| game\.webkitRequestFullscreen/);
  assert.match(script, /document\.exitFullscreen \|\| document\.webkitExitFullscreen/);
  assert.match(page, /html\.fullscreen-fallback body\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?height:\s*100dvh;/);
  assert.match(script, /root\.classList\.add\("fullscreen-fallback"\)/);
  assert.match(script, /event\.key !== "Escape" \|\| !root\.classList\.contains\("fullscreen-fallback"\)/);
  assert.doesNotMatch(page, /consentement\.(css|js)/);
  assert.match(page, /src="\.\.\/\.\.\/assets\/js\/mention-confidentialite\.js"/);
  assert.match(page, /Gwenaël Bourgault/);
  assert.match(page, /<span data-mathsgo-confidentialite>Sans cookie ni traceur<\/span>/);
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

test("le plateau reste carré et le mode deux colonnes couvre les tablettes", () => {
  assert.match(page, /#board\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*auto;[\s\S]*?aspect-ratio:\s*1;/);
  assert.doesNotMatch(page, /#board\s*\{[^}]*max-height:\s*(?:[0-9.]|min\(|max\(|calc\()/);
  assert.match(page, /@media \(min-width:\s*561px\)\s*\{[\s\S]*?grid-template-columns:\s*minmax\(180px,[\s\S]*?"title board"/);
  assert.match(page, /\.board-wrap\s*\{[\s\S]*?width:\s*min\(100%, calc\(100dvh - 132px\), 520px\);/);
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
