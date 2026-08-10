import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/club_maths/coffres_magiques.html", import.meta.url), "utf8");

test("Coffres à deux donne exactement 20 secondes à chaque tour", () => {
  assert.match(html, /const TURN_DURATION_MS = 20_000;/);
  assert.match(html, /id="turn-timer"[^>]*role="timer"[^>]*Temps restant : 20 secondes/);
  assert.match(html, /function beginTurnClock\(\)[\s\S]*turnClockRemainingMs = TURN_DURATION_MS/);
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
  assert.match(html, /document\.activeElement\.matches\(":focus-visible"\)/);
  assert.match(html, /data-index="\$\{focusedRune\}"[\s\S]*focus\(\{ preventScroll: true \}\)/);
});

test("les quatre opérations sont servies équitablement aux deux joueurs", () => {
  assert.match(html, /const OPERATION_MODES = \["sum", "difference", "product", "quotient"\];/);
  assert.match(html, /const positionInBlock = \(challengeNumber - 1\) % \(OPERATION_MODES\.length \* 2\);/);
  assert.match(html, /if \(positionInBlock === 0\) operationCycle = shuffle\(OPERATION_MODES\);/);
  assert.match(html, /return operationCycle\[Math\.floor\(positionInBlock \/ 2\)\];/);
  assert.match(html, /mode = nextBalancedMode\(\);/);
});

test("la différence et le quotient suivent les mêmes conventions que le solo", () => {
  assert.match(html, /if \(nextMode === "difference"\) return high - low;/);
  assert.match(html, /if \(mode === "quotient" && high % low !== 0\) return Number\.NaN;/);
  assert.match(html, /const divisor = randomInteger\(2, 6\);[\s\S]*const quotient = randomInteger\(2, 6\);[\s\S]*return \[divisor \* quotient, divisor\];/);
  assert.match(html, /mode === "difference" \|\| mode === "quotient" \? high : first/);
  assert.match(html, /n’est pas divisible par/);
});
