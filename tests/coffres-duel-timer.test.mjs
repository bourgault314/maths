import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/club_maths/coffres_magiques.html", import.meta.url), "utf8");
const engineSource = await readFile(new URL("../assets/js/coffres-moteur.js", import.meta.url), "utf8");

test("Coffres à deux donne 20, 30 ou 45 secondes par tour selon le niveau", () => {
  assert.doesNotMatch(html, /TURN_DURATION_MS/);
  assert.match(html, /<script src="\.\.\/\.\.\/assets\/js\/coffres-moteur\.js\?v=1"><\/script>/);
  assert.match(html, /id="turn-timer"[^>]*role="timer"[^>]*Temps restant : 20 secondes/);
  assert.match(html, /function beginTurnClock\(\)[\s\S]*turnClockRemainingMs = engine\.turnDuration\(selectedLevel\)/);
  assert.match(html, /Duo · <span id="duo-level-label">niveau 1<\/span> · <span id="duo-seconds-label">20 s<\/span>/);
  assert.match(html, /Tu as <strong id="turn-seconds-rule">20 secondes<\/strong>/);
  assert.match(html, /function syncTurnDurationLabels\(\)[\s\S]*#duo-seconds-label[\s\S]*`\$\{turnSeconds\(\)\} s`[\s\S]*#turn-seconds-rule[\s\S]*`\$\{turnSeconds\(\)\} secondes`/);
  assert.match(html, /20 à 45 s par tour selon le niveau/);
  assert.match(html, /function nextTurn\(\)[\s\S]*beginTurnClock\(\)/);
  assert.match(html, /performance\.now\(\)/);
});

test("le chrono avertit visuellement puis fait passer le tour sans clé", () => {
  assert.match(html, /const TIMER_WARNING_SECONDS = 5;/);
  assert.match(html, /\.turn-timer\.urgent[\s\S]*animation: timer-warning/);
  assert.match(html, /Temps écoulé : aucune clé\. Le tour passe au joueur/);
  assert.match(html, /function expireTurn\(\)[\s\S]*locked = true[\s\S]*setTimeout\(nextTurn, 850\)/);
  assert.doesNotMatch(html, /new Audio|\.play\(\)/);
});

test("la règle initiale bloque le départ puis les règles suivantes suspendent équitablement le chrono", () => {
  assert.match(html, /start\(\{ showRules: true \}\)/);
  assert.match(html, /initialFocus: mandatory \? "\.close-rules" : "#rules-title"/);
  assert.match(html, /if \(rulesMandatory && !force\) return/);
  assert.match(html, /if \(rulesMandatory\) document\.querySelector\("\.close-rules"\)[\s\S]*else closeRules\(\)/);
  assert.match(html, /pauseTurnClock\("rules"\)/);
  assert.match(html, /resumeTurnClock\("rules"\)/);
  assert.match(html, /visibilitychange[\s\S]*document\.hidden[\s\S]*pauseTurnClock\("visibility"\)[\s\S]*resumeTurnClock\("visibility"\)/);
});

test("bonne ou mauvaise réponse arrête le chrono et passe explicitement au joueur suivant", () => {
  assert.match(html, /function resolve\(secondPosition\)[\s\S]*endTurnClock\(\)/);
  assert.match(html, /une clé gagnée ! Le tour passe au joueur/);
  assert.match(html, /réponse fausse, aucune clé\. Le tour passe au joueur/);
});

test("l'orientation face-à-face reste limitée aux téléphones en portrait", () => {
  assert.match(html, /@media \(max-width: 600px\) and \(orientation: portrait\)[\s\S]*\.player-strip\.top[\s\S]*\.game-core\.facing-top \.rune span/);
  const beforePortraitRule = html.split("@media (max-width: 600px) and (orientation: portrait)")[0];
  assert.doesNotMatch(beforePortraitRule, /\.player-strip\.top\s*\{[^}]*rotate\(180deg\)/);
  assert.doesNotMatch(beforePortraitRule, /\.game-core\.facing-top[^\{]*\{[^}]*rotate\(180deg\)/);
});

test("le focus clavier est remappé après réponse ou expiration sans suivre la souris", () => {
  assert.match(html, /lastInteractionWasKeyboard && document\.activeElement\?\.classList\.contains\("rune"\)/);
  assert.match(html, /document\.activeElement\.matches\(":focus-visible"\)/);
  assert.match(html, /data-index="\$\{focusedRune\}"[\s\S]*focus\(\{ preventScroll: true \}\)/);
  assert.match(html, /document\.addEventListener\("keydown"[\s\S]*lastInteractionWasKeyboard = true/);
  assert.match(html, /document\.addEventListener\("pointerdown", \(\) => \{ lastInteractionWasKeyboard = false; \}, true\)/);
});

test("les quatre opérations sont servies équitablement aux deux joueurs", () => {
  assert.match(html, /const positionInBlock = \(challengeNumber - 1\) % \(selectedOperations\.length \* 2\);/);
  assert.match(html, /if \(positionInBlock === 0\) operationCycle = shuffle\(selectedOperations\);/);
  assert.match(html, /return operationCycle\[Math\.floor\(positionInBlock \/ 2\)\];/);
  assert.match(html, /mode = nextBalancedMode\(\);/);
});

test("la différence et le quotient suivent les mêmes conventions que le solo", () => {
  assert.match(engineSource, /if \(mode === "difference"\) return high - low;/);
  assert.match(html, /if \(mode === "quotient" && high % low !== 0\) return Number\.NaN;/);
  assert.match(html, /const generated = engine\.generateBoard\(mode, selectedLevel, randomInteger\(1, 3\) === 1\);/);
  assert.match(html, /mode === "difference" \|\| mode === "quotient" \? high : first/);
  assert.match(html, /n’est pas divisible par/);
});
