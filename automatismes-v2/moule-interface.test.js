import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
const css = await readFile(new URL("./interface.css", import.meta.url), "utf8");
const cssCommun = await readFile(new URL("./styles.css", import.meta.url), "utf8");

function blocCss(selecteur) {
  const motif = new RegExp(`${selecteur.replaceAll(".", "\\.")}\\s*\\{([^}]+)\\}`);
  const resultat = css.match(motif)?.[1];
  assert.ok(resultat, `bloc CSS absent : ${selecteur}`);
  return resultat;
}

describe("moule responsive commun", () => {
  it("impose une seule coque aux rendus de questions", () => {
    assert.equal((app.match(/<footer class="dock-question/g) ?? []).length, 1);
    assert.equal((app.match(/return rendreCoqueLecteur\(question, carteQuestion\);/g) ?? []).length, 5);
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
    assert.match(app, /class="zone-corps-panneau"[\s\S]*class="corps-panneau"/);
    assert.match(app, /data-indicateur-defilement[\s\S]*Fais défiler/);
    assert.match(app, /scrollHeight > clientHeight \+ 2/);
    assert.match(app, /scrollTop <= 8/);
    assert.doesNotMatch(app, /defilementCommence/);
    const indicateur = blocCss(".indicateur-defilement-panneau");
    assert.match(indicateur, /position:\s*absolute/);
    assert.match(indicateur, /pointer-events:\s*none/);
  });

  it("emploie une seule police mathématique et une grille commune pour les égalités", () => {
    assert.match(app, /--mg-mathematiques", TYPOGRAPHIE\.mathematiques/);
    const expression = blocCss(".mathsgo-expression");
    assert.match(expression, /font-family:\s*var\(--mg-mathematiques\)/);
    assert.match(expression, /font-variant-numeric:\s*lining-nums tabular-nums/);
    assert.match(expression, /font-feature-settings:\s*"lnum" 1, "tnum" 1/);
    assert.match(blocCss(".mathsgo-egalites-alignees"), /grid-template-columns:/);
    for (const selecteur of [
      ".chaine-carre",
      ".case-reponse-carres",
      ".grille-carres-multiples .choix",
      ".calcul-aligne",
      ".panneau-carres .rappel-question strong",
      ".panneau-carres .reponses-correction strong",
    ]) {
      assert.match(blocCss(selecteur), /font-variant-numeric:\s*lining-nums tabular-nums/);
      assert.match(blocCss(selecteur), /font-feature-settings:\s*"lnum" 1, "tnum" 1/);
    }
    assert.match(blocCss(".case-reponse-carres"), /font:\s*inherit/);
    assert.match(app, /function rendreEgaliteCarre\(/);
    assert.doesNotMatch(app, /<p class="chaine-carre">\$\{rendrePuissance/);
    assert.doesNotMatch(
      app,
      /<p>\$\{rendrePuissance\(base\)\} <span>=<\/span> <span>\$\{base\} ×/,
    );
    assert.doesNotMatch(css, /Cambria Math|STIX Two Math/);
  });

  it("colore aussi le contenu complet des réponses en fraction", () => {
    assert.match(css, /\.rappel-reponse-eleve > span\s*\{/);
    assert.doesNotMatch(css, /\.rappel-reponse-eleve span\s*\{/);
    assert.match(
      css,
      /\.rappel-reponse-eleve\.reponse-juste \.fraction-empilee\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--mg-reussite\) 60%, var\(--mg-encre\)\)/s,
    );
    assert.match(
      css,
      /\.rappel-reponse-eleve\.reponse-fausse \.fraction-empilee\s*\{[^}]*color:\s*color-mix\(in srgb, var\(--mg-erreur\) 60%, var\(--mg-encre\)\)/s,
    );
  });

  it("centre les retours et les réponses sans modifier leurs dimensions", () => {
    const message = blocCss(".zone-retour .message");
    assert.match(message, /min-height:\s*42px/);
    assert.match(message, /display:\s*grid/);
    assert.match(message, /place-items:\s*center/);
    assert.match(blocCss(".zone-retour .message > .contenu-message"), /display:\s*block/);

    const rappel = blocCss(".rappel-reponse-eleve");
    assert.match(rappel, /display:\s*flex/);
    assert.match(rappel, /align-items:\s*center/);

    assert.match(
      css,
      /(?:^|\n)\.reponses-correction strong\s*\{[^}]*min-height:\s*44px;[^}]*display:\s*inline-grid;[^}]*place-items:\s*center;[^}]*line-height:\s*1/s,
    );
    const reponseNumerique = blocCss(".reponses-correction-numerique strong");
    assert.match(reponseNumerique, /font-family:\s*var\(--mg-mathematiques\)/);
    assert.match(reponseNumerique, /font-variant-numeric:\s*lining-nums tabular-nums/);
    assert.match(reponseNumerique, /font-feature-settings:\s*"lnum" 1, "tnum" 1/);
  });

  it("conserve des touches tactiles compactes mais suffisamment grandes", () => {
    const clavier = blocCss(".pave-mathsgo-dock .clavier-mathsgo");
    assert.match(clavier, /width:\s*min\(100%, 318px\)/);

    const touche = blocCss(".clavier-mathsgo button");
    assert.match(touche, /min-height:\s*44px/);
    assert.match(css, /@media \(pointer: coarse\) and \(hover: none\)/);
    assert.doesNotMatch(css, /@media \(any-pointer: coarse\)/);
    assert.doesNotMatch(css, /@media \(max-width:\s*679px\)[^{]*\{[^}]*avec-pave/s);
  });

  it("déclare un état visuel d'appui sans changer le geste de sélection", () => {
    assert.match(
      cssCommun,
      /button\.choix:not\(:disabled\)\s*\{[^}]*touch-action:\s*manipulation;/s,
    );
    assert.match(
      cssCommun,
      /\.choix\.selectionne,\s*button\.choix:active:not\(:disabled\)\s*\{[^}]*border-color:\s*var\(--mg-bleu\)[^}]*color:\s*var\(--mg-bleu\)[^}]*background:[^}]*var\(--mg-turquoise\)[^}]*box-shadow:\s*inset 0 0 0 2px var\(--mg-bleu\)/s,
    );
  });

  it("conserve la compaction d'une question numérique quand le pavé disparaît", () => {
    assert.match(app, /miseEnPageNumerique \? "question-numerique"/);
    assert.match(app, /paveActif \? "avec-pave"/);
    assert.match(css, /@media \(pointer: coarse\) and \(hover: none\)[\s\S]*?\.mode-entrainement\.question-numerique \.carte-question-carres/);
    assert.match(css, /\.mode-entrainement\.avec-pave \.pave-mathsgo-dock/);
    assert.match(css, /max-height:\s*700px[\s\S]*?\.famille-carre-quadrille[\s\S]*?\.visuel-carre-quadrille/);
    assert.match(css, /\.carte-question-carres\.famille-carre-quadrille\s*\{[^}]*grid-template-columns:/s);
    assert.match(
      css,
      /@media \(pointer: coarse\) and \(hover: none\)[\s\S]*?\.mode-entrainement\.question-numerique \.zone-question-scroll\s*\{[^}]*align-items:\s*flex-start/s,
    );
    assert.match(
      css,
      /\.mode-entrainement\.question-numerique \.zone-question-scroll > \.carte-question\s*\{[^}]*margin-block:\s*0/s,
    );
    assert.doesNotMatch(css, /\.mode-entrainement\.question-numerique \.carte-question-divisibilite/);
  });

  it("utilise un seul contour persistant pour le champ actif", () => {
    const active = blocCss(".case-reponse-carres.active");
    assert.match(active, /border-color:\s*var\(--mg-orange\)/);
    assert.doesNotMatch(active, /outline|outline-offset/);
    assert.match(css, /\.mode-entrainement \.case-reponse-carres\s*\{[^}]*width:\s*98px/s);
    assert.match(cssCommun, /button:focus-visible/);
  });

  it("place l'exposant hors du contour du champ inverse", () => {
    const casePuissance = blocCss(".case-reponse-carres.case-puissance");
    assert.match(casePuissance, /border:\s*0/);
    assert.match(casePuissance, /background:\s*transparent/);
    assert.match(casePuissance, /box-shadow:\s*none/);

    const base = blocCss(".case-puissance .mathsgo-puissance-base");
    assert.match(base, /min-height:\s*58px/);
    assert.match(base, /border:\s*3px solid var\(--mg-turquoise\)/);

    const active = blocCss(".case-puissance.active .mathsgo-puissance-base");
    assert.match(active, /border-color:\s*var\(--mg-orange\)/);

    const exposant = blocCss(".case-puissance sup");
    assert.match(exposant, /color:\s*var\(--mg-bleu\)/);

    assert.match(
      css,
      /@media \(max-width: 620px\)[\s\S]*?\.case-puissance \.mathsgo-puissance-base\s*\{[^}]*min-width:\s*54px;[^}]*min-height:\s*54px;[^}]*padding-inline:\s*8px;/,
    );
  });
});
