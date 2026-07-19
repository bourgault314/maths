import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { depasseSeuilGlissement, SEUIL_GLISSEMENT_PX } from "./equasplat-interactions.js";

const source = await readFile(new URL("./equasplat.html", import.meta.url), "utf8");

test("ÉquaSplat mesure le glissement en pixels d'écran avec un seuil de 7 px", () => {
  assert.equal(SEUIL_GLISSEMENT_PX, 7);
  assert.equal(depasseSeuilGlissement(100, 50, 104, 55), false);
  assert.equal(depasseSeuilGlissement(100, 50, 107, 50), false);
  assert.equal(depasseSeuilGlissement(100, 50, 107.01, 50), true);
  assert.match(source, /departClientX:\s*e\.clientX/);
  assert.match(source, /departClientY:\s*e\.clientY/);
  assert.match(source, /depasseSeuilGlissement\(/);
  assert.doesNotMatch(source, /Math\.hypot\(dx, dy\) > 3/);
});

test("ÉquaSplat ne déplace visuellement le jeton qu'après le franchissement du seuil", () => {
  assert.match(
    source,
    /if \(glisse\.bouge\) \{\s*groupe\.setAttribute\("transform", `translate\(\$\{dx\} \$\{dy\}\)`\);/,
  );
});

test("ÉquaSplat propose le plein écran et suit son état", () => {
  assert.match(source, /id="btnPleinEcran"/);
  assert.match(source, /document\.documentElement\.requestFullscreen\(\)/);
  assert.match(source, /document\.exitFullscreen\(\)/);
  assert.match(source, /addEventListener\("fullscreenchange", synchroniserPleinEcran\)/);
  assert.match(source, /html:fullscreen #secEquasplat/);
  assert.ok(source.indexOf('id="dialogueSplat"') > source.indexOf('id="secEquasplat"'));
});

test("l'import ÉquaSplat applique uniquement le format plein écran compact connu", () => {
  assert.match(source, /charge\.fullscreenSize === "compact"/);
  assert.match(source, /sectionEquasplat\.dataset\.fullscreenSize = "compact"/);
  assert.match(source, /data-fullscreen-size="compact"/);
  assert.match(source, /delete sectionEquasplat\.dataset\.fullscreenSize/);
});
