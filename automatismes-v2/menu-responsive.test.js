import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const [css, html] = await Promise.all([
  readFile(new URL("./menu.css", import.meta.url), "utf8"),
  readFile(new URL("./index.html", import.meta.url), "utf8"),
]);

describe("menu Cycle 4 – DNB responsive", () => {
  it("conserve des cibles de 44 px dans les trois largeurs", () => {
    assert.match(
      css,
      /\.menu-v10 \.segment-btn\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s,
    );
    assert.match(
      css,
      /@media \(max-width: 650px\)[\s\S]*?\.menu-v10 \.segment-btn\s*\{[^}]*min-height:\s*44px;/s,
    );
    assert.match(
      css,
      /@media \(max-width: 360px\)[\s\S]*?\.menu-v10 \.segment-btn\s*\{[^}]*min-height:\s*44px;/s,
    );
  });

  it("ne rogne pas le contour de focus des boutons segmentés", () => {
    assert.match(css, /\.menu-v10 \.segment-btn:focus-visible\s*\{[^}]*outline:/s);
    assert.doesNotMatch(
      css,
      /\.menu-v10 \.segmented-control\s*\{[^}]*overflow:\s*hidden/s,
    );
  });

  it("garde les deux actions du pied de menu accessibles au toucher", () => {
    assert.match(
      css,
      /\.menu-v10 \.acknowledgements > summary,\s*\.menu-v10 \.cookie-manage-link\s*\{[^}]*min-height:\s*44px;/s,
    );
    assert.match(
      css,
      /\.menu-v10 \.cookie-manage-link:focus-visible,\s*\.menu-v10 \.acknowledgements > summary:focus-visible\s*\{[^}]*outline:/s,
    );
    assert.match(html, /href="\.\.\/assets\/css\/consentement\.css"/);
    assert.match(html, /src="\.\.\/assets\/js\/consentement\.js"/);
  });

  it("masque le second accès aux cookies injecté par le gestionnaire global", () => {
    assert.match(
      css,
      /\.mg-consent-manage-slot,\s*\.mg-consent-manage\s*\{[^}]*display:\s*none !important;/s,
    );
  });

  it("aligne les quatre réglages sur deux colonnes égales", () => {
    assert.match(css, /\.menu-v10 \.field\s*\{[^}]*flex:\s*1 1 0;/s);
    assert.doesNotMatch(css, /\.menu-v10 \.field-(?:level|help|mode|count)\s*\{[^}]*flex-grow:/s);
  });

  it("simplifie le bouton DNB seulement sur les très petits écrans", () => {
    assert.match(
      css,
      /@media \(max-width: 360px\)[\s\S]*?\.menu-v10 \.level-label small\s*\{[^}]*display:\s*none/s,
    );
  });
});
