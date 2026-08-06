import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
const css = await readFile(new URL("./interface.css", import.meta.url), "utf8");

function blocCss(selecteur) {
  const motif = new RegExp(`${selecteur.replaceAll(".", "\\.")}\\s*\\{([^}]+)\\}`);
  const resultat = css.match(motif)?.[1];
  assert.ok(resultat, `bloc CSS absent : ${selecteur}`);
  return resultat;
}

describe("moule responsive commun", () => {
  it("impose une seule coque aux rendus de questions", () => {
    assert.equal((app.match(/<footer class="dock-question/g) ?? []).length, 1);
    assert.equal((app.match(/return rendreCoqueLecteur\(question, carteQuestion\);/g) ?? []).length, 3);
    assert.equal((app.match(/<aside class="panneau/g) ?? []).length, 1);
    assert.match(app, /function rendreCadrePanneau\(/);
  });

  it("réserve toujours une zone centrale défilable entre l'en-tête et le dock", () => {
    const lecteur = blocCss(".lecteur");
    assert.match(lecteur, /height:\s*100dvh/);
    assert.match(lecteur, /grid-template-rows:\s*auto 4px minmax\(0, 1fr\) auto/);
    assert.match(lecteur, /overflow:\s*hidden/);

    const zone = blocCss(".zone-question-scroll");
    assert.match(zone, /min-height:\s*0/);
    assert.match(zone, /overflow-y:\s*auto/);

    const dock = blocCss(".dock-question");
    assert.match(dock, /border-top:/);
    assert.match(dock, /background:\s*var\(--mg-papier\)/);
  });

  it("garde l'en-tête et le pied des panneaux hors de leur contenu défilable", () => {
    const panneau = blocCss(".panneau");
    assert.match(panneau, /position:\s*fixed/);
    assert.match(panneau, /height:\s*100dvh/);
    assert.match(panneau, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
    assert.match(panneau, /overflow:\s*hidden/);

    const corps = blocCss(".corps-panneau");
    assert.match(corps, /min-height:\s*0/);
    assert.match(corps, /overflow-y:\s*auto/);
  });

  it("conserve des touches tactiles compactes mais suffisamment grandes", () => {
    const clavier = blocCss(".pave-mathsgo-dock .clavier-mathsgo");
    assert.match(clavier, /width:\s*min\(100%, 318px\)/);

    const touche = blocCss(".clavier-mathsgo button");
    assert.match(touche, /min-height:\s*44px/);
    assert.match(css, /@media \(any-pointer: coarse\)/);
    assert.doesNotMatch(css, /@media \(max-width:\s*679px\)[^{]*\{[^}]*avec-pave/s);
  });
});
