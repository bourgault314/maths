import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { COULEURS, contraste } from "../packages/charte/src/charte.js";

const [menuCss, interfaceCss] = await Promise.all([
  readFile(new URL("./menu.css", import.meta.url), "utf8"),
  readFile(new URL("./interface.css", import.meta.url), "utf8"),
]);

function melangerHex(premiere, seconde, proportionPremiere) {
  const canaux = (hex) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const a = canaux(premiere);
  const b = canaux(seconde);
  return `#${a.map((canal, index) =>
    Math.round(canal * proportionPremiere + b[index] * (1 - proportionPremiere))
      .toString(16)
      .padStart(2, "0")).join("")}`;
}

describe("contrastes locaux du lecteur V2", () => {
  it("garde le bouton orange lisible au repos et au survol", () => {
    assert.match(menuCss, /--menu-text:\s*#10294a/);
    assert.match(menuCss, /--menu-orange:\s*#f58220/);
    assert.match(
      menuCss,
      /\.menu-v10 \.generate-action\s*\{[^}]*color:\s*var\(--menu-text\)[^}]*background:\s*var\(--menu-orange\)/s,
    );
    assert.ok(contraste(COULEURS.encre, COULEURS.orange) >= 4.5);
    assert.ok(contraste(COULEURS.encre, "#ee7819") >= 4.5);
  });

  it("fonce le vert du score sans modifier le fond de réussite", () => {
    assert.match(
      interfaceCss,
      /\.score\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--mg-reussite\) 60%, var\(--mg-encre\)\)/s,
    );
    const texte = melangerHex(COULEURS.reussite, COULEURS.encre, 0.6);
    const fond = melangerHex(COULEURS.reussite, COULEURS.papier, 0.07);
    assert.ok(contraste(texte, fond) >= 4.5);
  });
});
