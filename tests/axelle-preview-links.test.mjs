import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [j2Page, j2App, j3Page, j3App, catalogue] = await Promise.all([
  readFile(new URL("../axelle/j2/index.html", import.meta.url), "utf8"),
  readFile(new URL("../axelle/assets/suite-app-v3.js", import.meta.url), "utf8"),
  readFile(new URL("../axelle/j3/index.html", import.meta.url), "utf8"),
  readFile(new URL("../axelle/j3/app.js", import.meta.url), "utf8"),
  readFile(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8")
]);

test("Splat possède un accès d’essai direct qui reste non indexé", () => {
  assert.match(j2Page, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(j2App, /const previewSplat = pageParams\.get\("apercu"\) === "splat"/);
  assert.match(j2App, /findIndex\(question => question\.type === "splat-table"\)/);
  assert.match(j2App, /if \(!previewSplat\) localStorage\.setItem/);
});

test("le Chemin du dodo possède un accès d’essai direct aux deux niveaux", () => {
  assert.match(j3Page, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(j3App, /pageParams\.get\("apercu"\) === "dodo"/);
  assert.match(j3App, /pageParams\.get\("niveau"\)==="2"\?1:0/);
  assert.match(j3App, /if \(!previewDodo && !isVersionComplete\(index\)\) return;/);
});

test("les quatre ressources à revoir restent absentes du catalogue public", () => {
  for (const path of [
    "axelle/jeux/traversee/",
    "axelle/jeux/pavage/",
    "axelle/j3/",
    "axelle/j2/"
  ]) {
    assert.doesNotMatch(catalogue, new RegExp(`\\"path\\": \\"${path.replaceAll("/", "\\/")}\\"`), path);
  }
});
