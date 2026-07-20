import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const lire = (chemin) => readFile(new URL(chemin, import.meta.url), "utf8");

function blocCss(source, selecteur) {
  const echappe = selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const resultat = source.match(new RegExp(`${echappe}\\s*\\{([^}]+)\\}`));
  assert.ok(resultat, `règle CSS absente : ${selecteur}`);
  return resultat[1];
}

describe("garde-fous de stabilité visuelle P0-2", () => {
  it("conserve un retour accessible et des commandes séparées", async () => {
    const app = await lire("./app.js");
    const styles = await lire("./styles.css");
    assert.match(app, /class="zone-retour" aria-live="polite" aria-atomic="true"/);
    assert.match(app, /class="zone-commandes-eleve"/);
    assert.match(blocCss(styles, ".zone-retour"), /min-height:\s*var\(--hauteur-retour\)/);
    assert.match(blocCss(styles, ".zone-commandes-eleve"), /min-height:\s*var\(--hauteur-commandes\)/);
    assert.doesNotMatch(blocCss(styles, ".message"), /overflow:\s*hidden/);
  });

  it("réserve le remplacement de Valider par deux commandes sur téléphone", async () => {
    const dispositions = await lire("./dispositions.css");
    const telephone = blocCss(dispositions, ".disposition-telephone .zone-actions");
    assert.match(telephone, /--hauteur-retour:\s*calc\(3 \* 1\.35rem \+ 40px\)/);
    assert.match(telephone, /--hauteur-commandes:\s*calc\(2 \* 50px \+ 8px\)/);
  });

  it("garde la barre enseignant dans une ligne séparée et le panneau seul défilable", async () => {
    const dispositions = await lire("./dispositions.css");
    const lecteurTelephone = blocCss(dispositions, ".disposition-telephone.mode-diaporama.lecteur");
    const espaceTelephone = blocCss(dispositions, ".disposition-telephone.mode-diaporama .espace-lecteur");
    const barreTelephone = blocCss(dispositions, ".disposition-telephone .barre-enseignant");
    const lecteur = blocCss(dispositions, ".disposition-tni.lecteur");
    const espace = blocCss(dispositions, ".disposition-tni .espace-lecteur");
    const barre = blocCss(dispositions, ".disposition-tni .barre-enseignant");
    const panneau = blocCss(dispositions, ".disposition-tni .panneau");
    assert.match(lecteurTelephone, /grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto/);
    assert.match(espaceTelephone, /grid-row:\s*3/);
    assert.match(espaceTelephone, /overflow-y:\s*auto/);
    assert.match(barreTelephone, /grid-row:\s*4/);
    assert.match(barreTelephone, /position:\s*static/);
    assert.match(lecteur, /grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto/);
    assert.match(espace, /grid-row:\s*3/);
    assert.match(espace, /overflow:\s*hidden/);
    assert.match(barre, /grid-row:\s*4/);
    assert.match(barre, /position:\s*static/);
    assert.match(panneau, /overflow-y:\s*auto/);
  });

  it("réserve des scènes constantes sans déformer les SVG", async () => {
    const styles = await lire("./styles.css");
    const logementFixe = blocCss(styles, ".logement-solide-stable");
    const svgFixe = blocCss(styles, ".logement-solide-stable svg");
    assert.match(logementFixe, /aspect-ratio:\s*4 \/ 3/);
    assert.match(logementFixe, /position:\s*relative/);
    assert.match(svgFixe, /position:\s*absolute/);
    assert.match(svgFixe, /inset:\s*0/);
    assert.match(svgFixe, /width:\s*100%/);
    assert.match(svgFixe, /height:\s*100%/);
    assert.match(blocCss(styles, ".solide-manipulable"), /aspect-ratio:\s*1/);
    assert.match(styles, /\.solide-manipulable svg\s*\{[^}]*height:\s*100%[^}]*max-height:\s*none/s);
  });

  it("maintient les cibles de base et celles du TNI compact à 44 px", async () => {
    const styles = await lire("./styles.css");
    const dispositions = await lire("./dispositions.css");
    assert.match(blocCss(styles, "button"), /min-height:\s*44px/);
    assert.match(
      blocCss(dispositions, ".disposition-tni.tni-compacte .barre-enseignant button"),
      /min-height:\s*44px/,
    );
  });
});
