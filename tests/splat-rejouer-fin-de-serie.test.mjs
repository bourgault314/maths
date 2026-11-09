/* SPLAT! — à la fin d'une série RÉUSSIE, rejouer avec de nouvelles cartes (lot « fin de série »,
   décidé avec Gwenaël le 09/11/2026, libellé choisi par question à choix).

   Avant : sur « Série terminée, bravo ! », dans le parcours, le lien « Rejouer la série » rejouait
   les MÊMES cartes. Maintenant, mondes 1 à 4 : « Rejouer avec de nouvelles cartes » — le même chemin
   que le bouton de l'écran « Étape réussie ! » (lot précédent) : la même adresse, une graine neuve
   pour CHAQUE fiche de l'étape, nouvelles=1, la page se recharge ; rien n'est écrit au clic.
   « Étape suivante ▶ » reste le gros bouton vert, le lien reste discret à côté de « Retour à la
   carte des mondes ».
   Ne changent pas : « Encore N cartes ! » et son « Rejouer toute la série » (mêmes cartes, la
   sauvegarde s'efface) ; hors parcours ; ÉquaSplat (mondes 5-6 : les mêmes équations).
   Ces tests EXÉCUTENT les fonctions des pages telles qu'elles sont écrites (extraites des fichiers). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const petit = lire("outils/splat_tache_barre.html");
const splat = lire("outils/splat.html");
const equa = lire("outils/equasplat.html");
const univers = lire("outils/splat_univers.html");
const moduleEtapes = lire("assets/js/splat-etapes.js");
const URL_CARTE = "/outils/splat_univers.html";
const LIBELLE = "Rejouer avec de nouvelles cartes";

function source(page, nom, retrait = "") {
  const debut = page.indexOf(`\n${retrait}function ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  const fin = page.indexOf(`\n${retrait}}\n`, debut + 1);
  return page.slice(debut + 1, fin + retrait.length + 3);
}
function moduleEtapesCharge() { const w = {}; new Function("window", moduleEtapes)(w); return w.MathsGoSplatEtapes; }

/* un faux document juste assez grand pour les écrans de fin : un élément n'existe que s'il a été écrit */
function fauxDocument() {
  const html = [], elements = {};
  const element = (id) => {
    if (!html.some((h) => h.includes(`id="${id}"`))) return null;
    return elements[id] || (elements[id] = { id, onclick: null, style: {} });
  };
  const noeud = () => ({ style: {}, className: "", set innerHTML(v) { this._h = v; html.push(v); }, get innerHTML() { return this._h; },
    appendChild(n) { if (n && n._h) html.push(n._h); } });
  return { document: { getElementById: (id) => (id === "eleveTeteHaut" ? { style: {} } : element(id)), createElement: noeud },
    noeud, elements, dernier: () => html[html.length - 1] };
}

const PETIT = "?support=eleve&problem=classic&target=20&splats=mix&exercise=construct&seed=458563&parcours=m1e6";
const M2 = Object.fromEntries([...univers.matchAll(/const (M2[A-Z0-9]+)="(mode=[UN][^"]*)"/g)].map((m) => [m[1], m[2]]));
const ETAPE7 = "?" + M2.M2A1 + "&eleve=1&parcours=m2e1&suite=" + encodeURIComponent(M2.M2A2) + ";" + encodeURIComponent(M2.M2A3);
const graines = (search) => {
  const q = new URLSearchParams(search);
  return [q.get("seed"), ...String(q.get("suite") || "").split(";").filter(Boolean).map((p) => new URLSearchParams(p).get("seed"))];
};

/* L'écran de fin d'une page, exécuté tel quel. Renvoie le html, les éléments, et un journal :
   adresses ouvertes (location.replace / href), écritures (stockage, sauvegarde), rendus. */
function fin(page, { parcours, resultats, search }) {
  const estSplat = page === splat;
  const d = fauxDocument(), journal = { allees: [], ecrit: [], rendu: 0, accepte: 0 };
  const fenetre = { MathsGoSplatEtapes: moduleEtapesCharge(),
    location: { pathname: estSplat ? "/splat/classique/" : "/outils/splat_tache_barre.html", search, hash: "", href: "",
      replace: (u) => journal.allees.push(u) } };
  const stockage = { getItem: () => null, setItem: (k, v) => journal.ecrit.push(["localStorage", k]), removeItem: (k) => journal.ecrit.push(["retire", k]) };
  const commun = `
    const ELEVE_URL_MONDES = "${URL_CARTE}", ELEVE_STORE_KEY = "mathsgo-splat-parcours";
    let parcoursId = ${JSON.stringify(parcours)}, eleveSerie = resultats.map(() => ({})), eleveResultats = resultats.slice(),
        eleveEtoiles = 0, eleveRejeu = null, eleveIdx = resultats.length, eleveVues = 0;
    const elevePastillesHtml = () => "", eleveCarteSuivante = () => {}, eleveJumellePreparer = () => null,
          eleveEnregistrerReussite = () => journal.ecrit.push("reussite (fin de série, avant le clic)"),
          eleveSauverFinDeSerie = () => journal.ecrit.push("fin de série"),
          eleveEffacerEnCours = () => journal.ecrit.push("efface en cours"),
          eleveSuivi = () => ({ ecrire: () => journal.ecrit.push("suivi") });`;
  const code = estSplat ? `${commun}
    let eleveEnqueteDevoile = true, eleveSchemaEtape = 1, eleveIndicesTel = true, eleveSuite = [];
    const renderCard = () => {}, eleveCadrerScene = () => {}, eleveIndicesAfficher = () => {}, eleveNouvellesCartes = () => {},
          renderEleveSplat = () => { journal.rendu++; }, getSeedForCurrentMode = () => "974";
    const appliquerConfiguration = () => {}, generate = () => { journal.accepte++; }, cards = [], eleveInfosCarte = () => null;
    ${["eleveEtapeSuivante", "eleveLienMondesHtml", "eleveNouvellesCartesPossible", "eleveRejouePhrase", "eleveAdresseNouvellesCartes",
       "eleveGraineNeuve", "eleveGraineSansTacheVide", "eleveRouvrirNouvellesCartes", "renderEleveFinSplat"].map((n) => source(splat, n)).join("\n")}
    renderEleveFinSplat(cible);`
    : `${commun}
    const renderEleve = () => { journal.rendu++; };
    ${["eleveEtapeSuivante", "eleveLienMondesHtml", "eleveRejouePhrase", "hashSeed", "makeAutoSeed", "eleveAdresseNouvellesCartes",
       "eleveRouvrirNouvellesCartes", "renderEleveFin"].map((n) => source(petit, n)).join("\n")}
    renderEleveFin(cible);`;
  const cible = d.noeud();
  new Function("document", "window", "localStorage", "cible", "resultats", "journal", code)(d.document, fenetre, stockage, cible, resultats, journal);
  return { html: estSplat ? cible.innerHTML : d.dernier(), el: d.elements, journal, fenetre };
}

const VERT = Array(12).fill(true), ROUGES = [true, "ko", ...Array(9).fill(true), "ko"];
const PAGES = [["splat_tache_barre.html (monde 1)", petit, "fin-action", "fin-sorties", "fin-lien", [["m1e6", PETIT], ["m1e1", PETIT.replace("m1e6", "m1e1")]]],
               ["splat.html (mondes 2 à 4)", splat, "finAction", "finSorties", "finLien",
                [["m2e1", ETAPE7], ["enq11", "?mode=E&seed=12&eleve=1&parcours=enq11"], ["enq11d", "?mode=E&seed=12&eleve=1&parcours=enq11d"],
                 ["sys27", "?mode=D&seed=31&eleve=1&parcours=sys27"], ["m4e6", "?mode=D&seed=31&eleve=1&parcours=m4e6"]]]];

for (const [nom, page, action, sorties, lien, etapes] of PAGES) {
  test(`${nom} : série réussie dans le parcours → « ${LIBELLE} » en lien discret, après « Étape suivante ▶ », plus de « Rejouer la série »`, () => {
    for (const [parcours, search] of etapes) {
      const { html } = fin(page, { parcours, resultats: VERT, search });
      assert.match(html, /Série terminée, bravo !/, parcours);
      // le gros bouton vert reste en premier
      assert.match(html, new RegExp(`<div class="${action}"><button id="eleveEtapeSuivante" type="button">`), parcours);
      // le lien, à côté de « Retour à la carte des mondes », dans la même rangée de liens
      const rangee = `<div class="${sorties}"><button id="eleveFinNouvellesCartes" type="button">${LIBELLE}</button>`;
      assert.ok(html.includes(rangee), `${parcours} : le lien dans la rangée des liens`);
      assert.ok(html.indexOf("eleveEtapeSuivante") < html.indexOf("eleveFinNouvellesCartes"), `${parcours} : après le bouton vert`);
      if (parcours === "m4e6") assert.doesNotMatch(html, /Retour à la carte des mondes/, "dernière étape : le bouton vert mène déjà à la carte");
      else assert.match(html, new RegExp(`${LIBELLE}</button><a class="${lien}" href="${URL_CARTE}[^"]*"[^>]*>Retour à la carte des mondes</a></div>`), parcours);
      assert.doesNotMatch(html, /Rejouer la série|id="eleveRejouer"/, `${parcours} : plus de « Rejouer la série » (mêmes cartes)`);
    }
  });

  test(`${nom} : le clic rouvre la même adresse, une graine neuve, nouvelles=1 — rien n'est écrit`, () => {
    for (const [parcours, search] of etapes) {
      const { el, journal } = fin(page, { parcours, resultats: VERT, search });
      const ecritAvant = journal.ecrit.slice();
      assert.equal(typeof el.eleveFinNouvellesCartes.onclick, "function", `${parcours} : le lien est branché`);
      el.eleveFinNouvellesCartes.onclick();
      assert.equal(journal.allees.length, 1, `${parcours} : une seule adresse ouverte (location.replace)`);
      const [chemin, requete] = journal.allees[0].split("?");
      assert.equal(chemin, page === splat ? "/splat/classique/" : "/outils/splat_tache_barre.html");
      const q0 = new URLSearchParams(search), q1 = new URLSearchParams(requete);
      assert.equal(q1.get("nouvelles"), "1", parcours);
      assert.equal(q1.get("parcours"), parcours);
      for (const [k, v] of q0) if (k !== "seed" && k !== "suite") assert.equal(q1.get(k), v, `${parcours} : ${k} gardé`);
      const avant = graines(search), apres = graines(q1.toString());
      assert.equal(apres.length, avant.length, `${parcours} : autant de fiches`);
      avant.forEach((g, k) => assert.notEqual(apres[k], g, `${parcours} : fiche ${k + 1}, graine neuve`));
      assert.deepEqual(journal.ecrit, ecritAvant, `${parcours} : rien n'est écrit au clic`);
      assert.equal(journal.rendu, 0, `${parcours} : pas de rejeu sur place (les mêmes cartes)`);
    }
  });

  test(`${nom} : « Encore N cartes ! » ne change pas — « Rejouer toute la série » rejoue les mêmes cartes et efface la sauvegarde`, () => {
    for (const [parcours, search] of etapes) {
      const { html, el, journal } = fin(page, { parcours, resultats: ROUGES, search });
      assert.match(html, /Encore 2 cartes !/);
      assert.ok(html.includes(`<div class="${sorties}"><button id="eleveRejouer" type="button">Rejouer toute la série</button>`), parcours);
      assert.doesNotMatch(html, /eleveFinNouvellesCartes|nouvelles cartes/, `${parcours} : pas de lien « nouvelles cartes »`);
      el.eleveRejouer.onclick();
      assert.deepEqual([journal.allees.length, journal.rendu], [0, 1], `${parcours} : rejoué sur place, sans recharger`);
      assert.ok(journal.ecrit.includes("efface en cours"), `${parcours} : la sauvegarde « en cours » s'efface`);
    }
  });

  test(`${nom} : hors parcours, rien ne change (pas de lien « ${LIBELLE} »)`, () => {
    const { html } = fin(page, { parcours: "", resultats: VERT, search: "?seed=974" });
    assert.doesNotMatch(html, /eleveFinNouvellesCartes|eleveEtapeSuivante/);
    assert.match(html, /id="eleveRejouer"[^>]*>Rejouer la série</, "graine dans l'adresse : « Rejouer la série », comme avant");
  });
}

test("splat.html : au monde 2, le lien refuse les graines « tache vide », comme le bouton de « Étape réussie ! »", () => {
  const { el, journal } = fin(splat, { parcours: "m2e1", resultats: VERT, search: ETAPE7 });
  el.eleveFinNouvellesCartes.onclick();
  assert.ok(journal.accepte >= 3, "chaque fiche neuve est tirée pour vérifier qu'elle n'a pas de carte « tache vide »");
  const g0 = graines(ETAPE7), g1 = graines(journal.allees[0].split("?")[1]);
  g0.forEach((g, k) => assert.equal(g1[k].length, g.length, "autant de chiffres (l'empreinte garde sa longueur, la reprise marche)"));
});

test("le lien de fin et le bouton de « Étape réussie ! » prennent le MÊME chemin (une seule fonction par page)", () => {
  for (const [page, fonctionFin, fonctionEcran] of [[petit, "renderEleveFin", "renderEleveEtapeReussie"], [splat, "renderEleveFinSplat", "renderEleveEtapeReussieSplat"]]) {
    assert.match(source(page, fonctionFin), /getElementById\(['"]eleveFinNouvellesCartes['"]\);\s*if ?\((\w+)\) \1\.onclick = eleveRouvrirNouvellesCartes;/);
    assert.match(source(page, fonctionEcran), /getElementById\(['"]eleveNouvellesCartes['"]\)\.onclick = eleveRouvrirNouvellesCartes;/);
    assert.doesNotMatch(source(page, "eleveRouvrirNouvellesCartes"), /ecrire\(|eleveEffacerEnCours|eleveSauver|localStorage/, "rien n'est écrit");
  }
});

test("ÉquaSplat (mondes 5-6) ne change pas : « Rejouer la série » rejoue les mêmes équations", () => {
  const f = source(equa, "eleveFinDeSerie", "  ");
  // le texte de la page (écrit avec \u00e9), après une série réussie dans le parcours
  assert.ok(f.includes('`<div class="finSorties"><button type="button" id="eleveRejouer">Rejouer la s\\u00e9rie</button>`'));
  assert.doesNotMatch(equa, /eleveFinNouvellesCartes|Rejouer avec de nouvelles cartes/);
});
