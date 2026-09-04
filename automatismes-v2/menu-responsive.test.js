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
    assert.match(
      css,
      /\.menu-v10 \.bulk-actions button\s*\{[^}]*min-height:\s*44px;/s,
    );
    assert.match(
      css,
      /\.menu-v10 \.theme-select-all\s*\{[^}]*min-height:\s*44px;/s,
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
    assert.doesNotMatch(html, /consentement\.(css|js)/);
    assert.match(html, /src="\.\.\/assets\/js\/mention-confidentialite\.js"/);
  });

  it("masque la seconde mention de confidentialité que le script commun poserait", () => {
    assert.match(
      css,
      /\.mg-mention-slot\s*\{[^}]*display:\s*none !important;/s,
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

  it("reprend la palette stable des quatre domaines du menu publié", () => {
    const palettes = {
      numbers: ["#049e98", "#e8f8f6"],
      geometry: ["#ed7a0b", "#fff3e7"],
      data: ["#3478c8", "#eaf3ff"],
      algorithm: ["#7355b7", "#f1edfb"],
    };
    for (const [domaine, [accent, fond]] of Object.entries(palettes)) {
      assert.match(
        css,
        new RegExp(`\\.theme-group\\[data-theme="${domaine}"\\]\\s*\\{[^}]*--theme-accent:\\s*${accent};[^}]*--theme-soft:\\s*${fond};`, "s"),
      );
    }
    assert.match(
      css,
      /\.menu-v10 \.modrow\.is-selected\s*\{[^}]*border-color:\s*var\(--theme-accent\);[^}]*background:\s*var\(--theme-soft\);/s,
    );
  });

  it("réserve l'espace du bouton de lancement seulement après une sélection", () => {
    assert.match(
      css,
      /\.menu-v10\.has-launch-action\s*\{[^}]*padding-bottom:\s*max\(118px,/s,
    );
    assert.match(
      css,
      /@media \(max-width: 650px\)[\s\S]*?\.menu-v10\.has-launch-action\s*\{[^}]*padding-bottom:\s*max\(84px,/s,
    );
  });
});
