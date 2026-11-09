/* Parcours SPLAT! (02/10/2026) : l'élève qui quitte en fin de série ne repart plus de la carte 1.

   Avant : la sauvegarde « en cours » était effacée à l'écran « Encore N cartes ! », rien n'était
   sauvé pendant le rejeu des cartes rouges, ni après la dernière carte tant que l'élève n'avait
   pas cliqué « Carte suivante ». Maintenant la fin de série s'enregistre dès que la dernière
   carte (ou une carte rouge rejouée) est jouée : tout vert, l'étoile ; des rouges, une
   sauvegarde idx = nombre de cartes, qui ramène l'élève sur « Encore N cartes ! ».
   Ces tests exécutent le code des pages tel quel (fonctions extraites des fichiers). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PARCOURS, fauxStockage, fauxOnglet } from "./splat-suivi-monde.mjs";

const lire = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const CLE = "mathsgo-splat-parcours";

function source(page, nom, retrait = "") {
  const debut = page.indexOf(`\n${retrait}function ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  const fin = page.indexOf(`\n${retrait}}\n`, debut + 1);
  return page.slice(debut + 1, fin + retrait.length + 3);
}
// La clé sans code, pré-remplie de son contenu d'avant le lot 2 du suivi (à plat, lu tel quel
// par le moteur) ; lire() rend les étapes telles que le moteur les range depuis le lot 2.
function stockage(contenu = {}) {
  const local = fauxStockage({ [CLE]: JSON.stringify(contenu) });
  local.lire = () => PARCOURS.charger(local, "").etapes;
  return local;
}
// Les fonctions du parcours qui lisent et écrivent par le moteur (lot 2 du suivi).
const moteurPage = (page) => ["eleveSuivi", "eleveEtapeLue", "eleveVuesReprise"].map((n) => source(page, n)).join("\n");

/* ---------- splat.html et splat_tache_barre.html : même logique ---------- */
for (const [nom, fichier] of [["splat.html", "outils/splat.html"], ["splat_tache_barre.html", "outils/splat_tache_barre.html"]]) {
  const page = lire(fichier);
  // joue eleveSauverEnCours() dans l'état donné, renvoie l'entrée enregistrée
  function sauver({ idx, resultats, rejeu = null, avant = {} }) {
    const store = stockage({ p: avant });
    new Function("window", "resultats", "rejeu", "idx", `
      const parcoursId = "p";
      let eleveSerie = new Array(4).fill({}), eleveResultats = resultats, eleveRejeu = rejeu, eleveIdx = idx, eleveEtoiles = 0;
      let eleveSuiviObjet, eleveVues = 0, eleveSerieNotee = false;
      const eleveSignatureSerie = () => "SIG";
      ${moteurPage(page)}
      ${source(page, "eleveEnregistrerReussite")}
      ${source(page, "eleveSauverFinDeSerie")}
      ${source(page, "eleveSauverEnCours")}
      eleveSauverEnCours();`)(fauxOnglet({ local: store }).fenetre, resultats, rejeu, idx);
    return store.lire().p;
  }

  test(`${nom} : au milieu de la série, la sauvegarde ne change pas (prochaine carte)`, () => {
    assert.deepEqual(sauver({ idx: 1, resultats: [true, "ko"] }).enCours, { sig: "SIG", idx: 2, etoiles: 0, res: [true, "ko"] });
  });

  test(`${nom} : dernière carte jouée, tout vert → l'étoile, sans attendre « Carte suivante »`, () => {
    const e = sauver({ idx: 3, resultats: [true, true, true, true] });
    assert.equal(e.fait, true); assert.equal(e.etoiles, 4); assert.equal(e.cartes, 4); assert.equal(e.enCours, undefined);
  });

  test(`${nom} : dernière carte jouée avec des rouges → retour prévu sur « Encore N cartes ! »`, () => {
    assert.deepEqual(sauver({ idx: 3, resultats: [true, "ko", true, "ko"] }).enCours, { sig: "SIG", idx: 4, etoiles: 2, res: [true, "ko", true, "ko"] });
  });

  test(`${nom} : pendant le rejeu, une rouge réussie est gardée ; l'étoile déjà gagnée reste`, () => {
    const e = sauver({ idx: 1, rejeu: [3], resultats: [true, false, true, "ko"], avant: { fait: true, etoiles: 4, cartes: 4 } });
    assert.equal(e.fait, true);
    assert.deepEqual(e.enCours, { sig: "SIG", idx: 4, etoiles: 2, res: [true, false, true, "ko"] });
  });

  test(`${nom} : la dernière rouge rejouée → l'étoile`, () => {
    const e = sauver({ idx: 3, rejeu: [], resultats: [true, false, true, false] });
    assert.equal(e.fait, true); assert.equal(e.etoiles, 2); assert.equal(e.enCours, undefined);
  });

  test(`${nom} : l'écran « Encore N cartes ! » n'efface plus la sauvegarde`, () => {
    const fin = source(page, nom === "splat.html" ? "renderEleveFinSplat" : "renderEleveFin");
    assert.ok(fin.includes("eleveSauverFinDeSerie();"));
    assert.ok(!/delete tout\[parcoursId\]\.enCours/.test(fin));
  });
}

/* ---------- la reprise lit la sauvegarde de fin (bloc de Petit Splat, exécuté tel quel) ---------- */
const petit = lire("outils/splat_tache_barre.html");
function ouvrir(enCours) {
  const debut = petit.indexOf("if (eleveSerie.length && !eleveRepriseFaite && parcoursId) {");
  const finTexte = "} catch (e) { /* stockage indisponible */ }";
  const fin = petit.indexOf(finTexte, debut);
  assert.ok(debut > 0 && fin > debut, "bloc de reprise introuvable");
  return new Function("window", `
    const parcoursId = "p", eleveSignatureSerie = () => "SIG";
    let eleveSerie = new Array(4).fill({}), eleveRepriseFaite = false, eleveIdx = 0, eleveEtoiles = 0, eleveResultats = [];
    let eleveSuiviObjet, eleveVues = 0;
    ${moteurPage(petit)}
    ${petit.slice(debut, fin + finTexte.length)}
    }
    return { eleveIdx, eleveResultats };`)(fauxOnglet({ local: stockage({ p: { enCours } }) }).fenetre);
}
test("reprise : idx = nombre de cartes avec des rouges → l'élève arrive sur l'écran de fin, pastilles comprises", () => {
  assert.deepEqual(ouvrir({ sig: "SIG", idx: 4, etoiles: 2, res: [true, false, true, "ko"] }), { eleveIdx: 4, eleveResultats: [true, false, true, "ko"] });
});
test("reprise : idx = nombre de cartes sans rouge (cas impossible) → carte 1", () => {
  assert.equal(ouvrir({ sig: "SIG", idx: 4, etoiles: 4, res: [true, true, true, true] }).eleveIdx, 0);
});
test("splat.html : même condition de reprise que Petit Splat", () => {
  const s = lire("outils/splat.html");
  assert.ok(s.includes(`(entree.enCours.idx === eleveSerie.length && Array.isArray(entree.enCours.res) && entree.enCours.res.includes("ko"))`));
});

/* ---------- equasplat.html (mondes 5 et 6) ---------- */
const equa = lire("outils/equasplat.html");
function sauverEqua({ idx, res, rejeu = null }) {
  const ecrit = [];
  new Function("ecrit", "res", "rejeu", "idx", `
    let eleveEqs = new Array(4).fill({}), eleveRes = res, eleveRejeu = rejeu, eleveIdx = idx, eleveResolues = 0;
    const eleveSignatureSerie = () => "SIG", eleveEcrireEntree = (e) => ecrit.push(e);
    ${source(equa, "eleveSauverFinDeSerie", "  ")}
    ${source(equa, "eleveSauverEnCours", "  ")}
    eleveSauverEnCours();`)(ecrit, res, rejeu, idx);
  return ecrit[ecrit.length - 1];
}
test("equasplat.html : dernière équation passée → retour prévu sur « Encore N équations ! »", () => {
  assert.deepEqual(sauverEqua({ idx: 3, res: [true, "ko", true, "ko"] }).enCours, { sig: "SIG", idx: 4, resolues: 0, res: [true, "ko", true, "ko"] });
});
test("equasplat.html : la dernière rouge résolue au rejeu → l'étoile", () => {
  assert.equal(sauverEqua({ idx: 1, rejeu: [], res: [true, true, true, true] }).fait, true);
});
test("equasplat.html : au milieu de la série, rien ne change", () => {
  assert.deepEqual(sauverEqua({ idx: 0, res: [true] }).enCours, { sig: "SIG", idx: 1, resolues: 0, res: [true] });
});

/* ---------- « Rejouer toute la série » : retour sur la carte 1 partout (03/10/2026) ---------- */
for (const [nom, fichier, fin] of [["splat.html", "outils/splat.html", "renderEleveFinSplat"], ["splat_tache_barre.html", "outils/splat_tache_barre.html", "renderEleveFin"]]) {
  const page = lire(fichier);
  test(`${nom} : « Rejouer toute la série » efface la sauvegarde « en cours », l'étoile reste`, () => {
    const store = stockage({ p: { fait: true, etoiles: 4, cartes: 4, enCours: { sig: "SIG", idx: 4, etoiles: 2, res: [true, "ko", true, "ko"] } } });
    new Function("window", `
      const parcoursId = "p";
      let eleveSuiviObjet;
      ${moteurPage(page)}
      ${source(page, "eleveEffacerEnCours")}
      eleveEffacerEnCours();`)(fauxOnglet({ local: store }).fenetre);
    const p = store.lire().p;
    assert.equal(p.enCours, undefined, "la reprise s'efface");
    assert.deepEqual([p.fait, p.etoiles, p.cartes], [true, 4, 4], "l'étoile reste");
    // (08/10/2026) splat.html : le bouton peut être « Nouvelles cartes ▶ » à la place (série du dos)
    assert.match(source(page, fin), /getElementById\(["']eleveRejouer["']\)(\.onclick|;\s*if ?\(rejouer\) rejouer\.onclick) = \(\) => \{ eleveEffacerEnCours\(\);/);
  });
}
test("equasplat.html : « Rejouer toute la série » efface déjà la sauvegarde (référence des deux autres)", () => {
  const f = source(equa, "eleveFinDeSerie", "  ");
  assert.match(f, /#eleveRejouer"\)\.addEventListener\("click", \(\) => \{[\s\S]*?eleveEcrireEntree\(\{\}\);/);
});
