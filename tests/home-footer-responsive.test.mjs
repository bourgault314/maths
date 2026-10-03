import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const css = readFileSync(path.join(root, "assets/css/accueil.css"), "utf8");

test("le pied d’accueil conserve les actions et les liens légaux sans signature", () => {
  const footer = html.match(/<footer class="home-footer">([\s\S]*?)<\/footer>/)?.[1];
  assert.ok(footer, "le pied d’accueil doit être identifiable explicitement");

  assert.doesNotMatch(footer, /Gwenaël Bourgault|footer-row-identity/);
  assert.equal((footer.match(/class="footer-row /g) || []).length, 2);
  assert.equal((footer.match(/class="footer-section-separator"/g) || []).length, 1);

  const actionsRow = footer.match(
    /<span class="footer-row footer-row-actions">([\s\S]*?)<\/span>\s*<span class="footer-section-separator"/
  )?.[1];
  assert.ok(actionsRow);
  assert.match(actionsRow, /Me contacter/);
  assert.match(actionsRow, /aria-hidden="true">·/);
  assert.match(actionsRow, /href="outils\/toutes-les-ressources\.html">Toutes les ressources<\/a>/);
  assert.doesNotMatch(actionsRow, /Mentions légales|Confidentialité|Cookies/);

  assert.match(
    footer,
    /footer-row footer-row-legal[\s\S]*Mentions légales[\s\S]*Confidentialité[\s\S]*Licence/
  );
});

test("le pied reste sur une ligne continue sur ordinateur", () => {
  assert.match(
    css,
    /\.home-footer\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?align-items:\s*baseline;/
  );
  assert.match(
    css,
    /\.footer-row\s*\{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?white-space:\s*nowrap;/
  );
});

test("le pied compact affiche les deux groupes sans séparateur orphelin", () => {
  const compact = css.slice(
    css.indexOf("@media (max-width: 920px)"),
    css.indexOf(".footer-row {")
  );
  const mobile = css.slice(
    css.indexOf("@media (max-width: 600px)"),
    css.indexOf("@media (prefers-reduced-motion: reduce)")
  );

  assert.match(
    compact,
    /\.home-footer\s*\{[\s\S]*?flex-direction:\s*column;[\s\S]*?align-items:\s*center;/
  );
  assert.match(compact, /\.footer-section-separator\s*\{\s*display:\s*none;/);
  assert.match(mobile, /font-size:\s*clamp\(0\.73rem, 3\.45vw, 0\.84rem\)/);
});

test("les liens administratifs restent plus discrets que les accès utiles", () => {
  assert.match(
    css,
    /\.footer-row-legal \.footer-link\s*\{[\s\S]*?color:\s*#526d8d;[\s\S]*?font-weight:\s*500;/
  );
  assert.match(
    css,
    /\.contact-btn,\s*\.footer-link\s*\{[\s\S]*?color:\s*rgba\(6, 63, 134, 0\.72\);[\s\S]*?font-weight:\s*750;/
  );
});
