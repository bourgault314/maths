/* Petit Splat (monde 1) et Splat classique (monde 2), mode élève (18/09/2026).
   Sur ordinateur, valider une carte JUSTE avec la touche Entrée faisait passer
   tout de suite à la carte suivante : l'élève ne voyait ni « Bravo… Regarde sous
   la tache… » ni la tache dévoilée. Un second appui validait alors la carte
   suivante, encore vide : rouge, et l'étoile « du premier coup » perdue.

   Cause : la validation d'une carte juste donne le focus au bouton « Carte
   suivante ▶ » PENDANT le keydown d'Entrée ; le keypress du même appui arrivait
   sur ce bouton et le cliquait. Remède : le gestionnaire consomme la touche
   (preventDefault), comme le pavé de chiffres le fait déjà — un navigateur
   n'envoie pas de keypress après un keydown empêché. Le second appui tombe sur
   le bouton qui a le focus et passe à la carte suivante.

   Ce fichier exécute le gestionnaire tel qu'il est écrit dans chaque page.
   L'enchaînement keydown → keypress → clic est celui du navigateur : il a été
   rejoué au navigateur (voir la pull request). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

const PAGES = [
  { nom: "Petit Splat", chemin: "outils/splat_tache_barre.html", debut: "inp.addEventListener('keydown'", valider: "eleveValider", fonction: "function eleveValider(main) {" },
  { nom: "Splat classique", chemin: "outils/splat.html", debut: 'inp.addEventListener("keydown"', valider: "eleveValiderSplat", fonction: "function eleveValiderSplat(){" }
];

// Le corps d'une fonction déclarée au premier niveau de la page (jusqu'à sa « } » en colonne 0).
function corpsFonction(source, entete) {
  const i = source.indexOf(entete);
  assert.ok(i >= 0, `${entete} introuvable`);
  const fin = source.indexOf("\n}\n", i);
  assert.ok(fin > i, `fin de ${entete} introuvable`);
  return source.slice(i, fin + 3);
}

// L'appel inp.addEventListener("keydown", …) tel qu'il est écrit, parenthèses équilibrées.
function extraireAppel(source, debut) {
  const i = source.indexOf(debut);
  assert.ok(i >= 0, `${debut} introuvable`);
  assert.equal(source.indexOf(debut, i + 1), -1, "un seul gestionnaire clavier sur les cases élève");
  let profondeur = 0;
  for (let j = source.indexOf("(", i); j < source.length; j++) {
    if (source[j] === "(") profondeur++;
    else if (source[j] === ")" && --profondeur === 0) return source.slice(i, j + 1) + ";";
  }
  throw new Error("parenthèses déséquilibrées");
}

// Branche le gestionnaire sur un faux champ ; la validation est remplacée par un espion.
function brancher(page) {
  const code = extraireAppel(lire(page.chemin), page.debut);
  const ecouteurs = [];
  const inp = { addEventListener: (type, fn) => ecouteurs.push({ type, fn }) };
  const validations = [];
  const main = { id: "mainArea" };
  new Function("inp", "main", page.valider, code)(inp, main, (...args) => validations.push(args));
  assert.equal(ecouteurs.length, 1);
  assert.equal(ecouteurs[0].type, "keydown");
  const touche = (key) => {
    const ev = { key, empeche: false, preventDefault() { ev.empeche = true; } };
    ecouteurs[0].fn(ev);
    return ev;
  };
  return { touche, validations, main };
}

for (const page of PAGES) {
  test(`${page.nom} : Entrée valide la carte et l'appui s'arrête là`, () => {
    const b = brancher(page);
    const ev = b.touche("Enter");
    assert.equal(b.validations.length, 1, "la carte est validée");
    if (page.valider === "eleveValider") assert.equal(b.validations[0][0], b.main);
    assert.equal(ev.empeche, true, "sans preventDefault, le même appui clique « Carte suivante ▶ », qui vient de prendre le focus");
  });

  test(`${page.nom} : les autres touches gardent leur effet et ne valident rien`, () => {
    const b = brancher(page);
    for (const key of ["7", "Backspace", "Tab"]) {
      assert.equal(b.touche(key).empeche, false, `${key} doit garder son effet normal`);
    }
    assert.equal(b.validations.length, 0);
  });

  test(`${page.nom} : le 2e appui passe à la suite, « Carte suivante » prend toujours le focus`, () => {
    // dans la validation même (« Voir la réponse » donne aussi le focus à ce bouton, ailleurs)
    const validation = corpsFonction(lire(page.chemin), page.fonction);
    assert.match(validation, /suivant\.onclick = [^;]*;\s*bouton\.parentNode\.appendChild\(suivant\);\s*suivant\.focus\(\);/);
  });
}
