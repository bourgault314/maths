// Lot « la flèche de retour » (14/10/2026, décisions de Gwenaël) : les
// flèches du haut restent où elles sont (« on laisse comme avant »). Les
// écrans où l'on continue ont deux boutons côte à côte — « ← Ma table » à
// gauche, la suite à droite : « C'est parti ! », entre deux étapes de la
// séance, et les deux écrans de « Je passe le test » qui n'avaient aucun
// retour. « Ma table » porte la flèche du site partout. Le choix du nom
// ouvert depuis Les records y ramène. Et « Mes erreurs » : la réponse donnée
// barrée d'un trait en biais.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function corps(nom) {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `fonction introuvable : ${nom}`);
  const fin = html.indexOf("\n      }\n\n", debut);
  return html.slice(debut, fin + 8);
}

function element(tag = "div") {
  const classes = new Set();
  const libelle = {textContent: "?"};
  const ecouteurs = {};
  return {
    tag, hidden: true, attributs: {}, libelle, classes, enfants: [], ecouteurs, textContent: "", className: "", id: "",
    classList: {add: c => classes.add(c), toggle: (c, oui) => (oui ? classes.add(c) : classes.delete(c))},
    setAttribute(n, v) { this.attributs[n] = v; },
    querySelector: s => (s === ".settings-back-label" ? libelle : null),
    replaceChildren(...n) { this.enfants = n; },
    append(...n) { this.enfants.push(...n); },
    addEventListener(type, f) { ecouteurs[type] = f; }
  };
}

test("après Mes calculs du jour et après Mon mélange : deux boutons, « ← Ma table » à gauche, la suite à droite", () => {
  const essai = (id, origine) => {
    const zone = element();
    const resultat = element();
    const appels = [];
    const state = {apresMesCalculs: {x: 1}, apresMelange: {x: 1}, origin: origine};
    const SORTIES = {parcours: {mot: "Mon parcours"}, menu: {mot: "Ma table"}};
    new Function("$", "document", "state", "effacerSuiteSeance", "quitterSerie", "launchFromParcours", "sortieDeSerie", "ID",
      `${corps("renderBoutonSuite")}\nrenderBoutonSuite({nom: "Mon mélange", config: {}, origin: "menu"}, ID);`)(
      i => ({"seance-suite": zone, result: resultat})[i], {createElement: element}, state,
      () => appels.push("effacerSuiteSeance"), () => appels.push("quitterSerie"), () => appels.push("launch"),
      () => SORTIES[origine] || SORTIES.menu, id);
    assert.equal(zone.enfants.length, 1, "une seule rangée");
    const ligne = zone.enfants[0];
    assert.equal(ligne.className, "suite-boutons");
    const [retour, bouton] = ligne.enfants;
    assert.equal(retour.className, "secondary retour-flechee", "le bouton blanc, avec la flèche");
    assert.equal(retour.id, `${id}-retour`);
    assert.equal(bouton.className, "primary");
    assert.equal(bouton.id, id);
    retour.ecouteurs.click();
    return [retour.textContent, appels, state.apresMesCalculs, state.apresMelange];
  };
  assert.deepEqual(essai("apres-mes-calculs", "menu"), ["Ma table", ["effacerSuiteSeance", "quitterSerie"], null, null]);
  assert.deepEqual(essai("apres-melange", "menu"), ["Ma table", ["effacerSuiteSeance", "quitterSerie"], null, null]);
  assert.deepEqual(essai("apres-mes-calculs", "parcours").slice(0, 2), ["Mon parcours", ["effacerSuiteSeance", "quitterSerie"]],
    "lancé de Mon parcours : il y ramène (quitterSerie)");
});

test("entre deux étapes de la séance : « ← Ma table » à gauche de l'étape suivante (plus de petit lien)", () => {
  assert.match(html, /arreter\.className = "secondary retour-flechee";\s*arreter\.id = "seance-arreter";\s*arreter\.textContent = "Ma table";\s*arreter\.addEventListener\("click", backToModes\);\s*const ligne = document\.createElement\("div"\);\s*ligne\.className = "suite-boutons";\s*ligne\.append\(arreter, suite\);/);
  assert.doesNotMatch(html, /"Arrêter la séance"/);
});

test("« C'est parti ! » : le retour à gauche, comme partout", () => {
  assert.match(html, /<div class="launch-actions">\s*<!--[^]*?-->\s*<button id="launch-back" class="secondary"[^]*?<\/button>\s*<button id="launch-start" class="primary" type="button">C’est parti&nbsp;!<\/button>\s*<\/div>/);
});

test("« Ma table » qui ramène à l'accueil porte la flèche du site, partout", () => {
  assert.match(html, /\.retour-flechee, #result-accueil \{ display: inline-flex; align-items: center; justify-content: center; gap: 7px; \}/);
  const regle = html.match(/\.retour-flechee::before, #result-accueil::before \{([^}]*)\}/);
  assert.ok(regle, "la flèche, en masque");
  assert.match(regle[1], /^ content: ""; flex: 0 0 auto; width: 20px; height: 20px;/, "elle se dessine, à sa taille");
  assert.match(regle[1], /background-color: currentColor;/, "la couleur du texte : blanche sur le bleu, bleue sur le blanc");
  assert.match(regle[1], /-webkit-mask: url\("data:image\/svg\+xml,[^"]*M19 12H5M11 6l-6 6 6 6[^"]*"\)/, "le dessin de la flèche du site");
  assert.match(regle[1], /\bmask: url\(/);
  assert.match(html, /<button id="result-accueil" class="primary" type="button">Ma table<\/button>/, "le bouton du résultat");
  assert.match(html, /maTable\.className = restants \? "secondary retour-flechee" : "primary retour-flechee";/, "la fin de Mes calculs du jour");
  assert.match(html, /maTable\.className = "primary retour-flechee";\s*maTable\.textContent = "Ma table";\s*maTable\.addEventListener\("click", backToModes\);/, "le bilan de la séance");
  assert.match(html, /\.seance-suite \.suite-boutons \{ display: grid; grid-template-columns: auto minmax\(0, 1fr\);/, "la suite prend la place qui reste");
});

test("le choix du nom, ouvert depuis Les records, y ramène ; ouvert ailleurs, Ma table comme avant", () => {
  const essai = precedent => {
    const appels = [];
    const bouton = element();
    const ramene = new Function("$", "backToModes", "show", "PRECEDENT", `let apresChoixDuNom = () => {};
      ${html.slice(html.indexOf("      let nomVientDeRecords = false;"), html.indexOf("      const MODE_COPY = Object.freeze({"))}
      majRetourNom(PRECEDENT); retourDuNom(); return apresChoixDuNom;`)(
      id => (id === "records-nom-back" ? bouton : null), () => appels.push("backToModes"), nom => appels.push(`show(${nom})`), precedent);
    return [bouton.libelle.textContent, bouton.attributs["aria-label"], appels, ramene];
  };
  assert.deepEqual(essai("records"), ["Les records", "Retour aux records", ["show(records)"], null], "et le nom n'est pas posé en partant");
  for (const precedent of ["intro", "result"]) {
    assert.deepEqual(essai(precedent).slice(0, 3), ["Ma table", "Retour à Ma table", ["backToModes"]], precedent);
  }
  assert.match(corps("show"), /if \(name === "records-nom"\) majRetourNom\(ecranCourant\);\s*\["intro", "launch"/, "avant le changement d'écran");
  assert.match(html, /\$\("records-nom-back"\)\.addEventListener\("click", retourDuNom\);/);
});

test("les flèches du haut restent où elles sont (« on laisse comme avant »)", () => {
  assert.match(html, /body\.ecran-interne #lien-retour \{ display: none; \}/, "le bandeau : « ← Mon espace » sur l'accueil seulement");
  assert.doesNotMatch(html, /retour-cadre|avec-retour-cadre|#launch-back \{ display: none/, "ni flèche ajoutée en haut du cadre, ni « ← Ma table » retiré");
  for (const id of ["launch-back", "game-menu", "parcours-back", "fiche-back", "lire-back", "records-back", "records-nom-back", "result-accueil"]) {
    assert.match(html, new RegExp(`<button id="${id}"`), id);
  }
});

test("« Mes erreurs » : la réponse donnée barrée en biais ; « Pas de réponse » ne l'est pas", () => {
  assert.match(html, /\.given-answer \{[^}]*background: linear-gradient\(to top right, transparent calc\(50% - 1\.4px\), currentColor calc\(50% - 1\.4px\), currentColor calc\(50% \+ 1\.4px\), transparent calc\(50% \+ 1\.4px\)\); \}/);
  assert.doesNotMatch(html, /\.given-answer \{[^}]*line-through/);
  assert.match(html, /\.given-answer\.is-passe \{ padding: 0; background: none; \}/);
});
