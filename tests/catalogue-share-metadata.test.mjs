import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cataloguePath = new URL("../outils/index.html", import.meta.url);
const shareImagePath = new URL("../assets/img/partage-catalogue.png", import.meta.url);

function pngDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", "la carte de partage doit être un PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

test("le catalogue déclare une carte de partage complète et dédiée", async () => {
  const html = await readFile(cataloguePath, "utf8");

  assert.match(html, /<meta property="og:title" content="Explorer les outils pédagogiques">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/mathsgo\.re\/assets\/img\/partage-catalogue\.png">/);
  assert.match(html, /<meta property="og:image:width" content="1200">/);
  assert.match(html, /<meta property="og:image:height" content="630">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/mathsgo\.re\/assets\/img\/partage-catalogue\.png">/);
});

test("la carte de partage respecte le format social 1200 × 630", async () => {
  const image = await readFile(shareImagePath);
  assert.deepEqual(pngDimensions(image), { width: 1200, height: 630 });
});

test("aucune URL Open Graph fixe n’efface les filtres domain et notion", async () => {
  const html = await readFile(cataloguePath, "utf8");
  assert.doesNotMatch(html, /<meta property="og:url"/);
});
