// Défi calcul, lot « la 6e complète » (passe 3, 28/11/2026) : la page de
// l'élève lue telle qu'elle est (sans navigateur), plus le noyau joué. Les
// écrans eux-mêmes sont joués au navigateur par
// tests/defi-calcul-lot-6e-complete-ecrans.cjs (hors CI) ; les données par
// defi-calcul-lot-6e-complete-donnees.
//
//  1. la réponse à choisir : trois cases « radio » à la place du pavé, la
//     case touchée dite au lecteur d'écran (aria-checked), « Touche une
//     réponse », les flèches choisissent, les chiffres ne tapent rien ;
//  2. le moteur : une réponse à choisir n'est juste que si elle est l'une
//     des trois valeurs ; les trois valeurs de « Où va la virgule ? » sont
//     différentes, la bonne en fait partie et n'est pas toujours au milieu ;
//  3. « Nouveau : je choisis la bonne réponse. » au premier calcul à choisir
//     d'une série ;
//  4. les fractions jamais avec une barre oblique : les noms des étoiles et
//     la carte par cœur de « 0,1 et 1/10 » (titre et lignes) ;
//  5. J'écris de « Où va la virgule ? » : les arrondis s'écrivent un à un
//     dans le dessin (aucun d'avance) ;
//  6. les adresses de cache neuves ;
//  7. les erreurs de « Une fraction d'un nombre » ont leurs causes à elles,
//     celles de « Entier × fraction » et « Fraction et quotient » les leurs ;
//  8. (correctif, relecture de Codex du 28/11) « est proche de » : la bonne
//     case est aussi la plus proche par l'écart, du produit comme de
//     l'estimation ; les exemples du professeur ne montrent qu'une des
//     trois cases.
// Ces tests ont été sabotés un par un (lot-6e-complete\_travail\outils\
// sabotages-6e.py) : chaque sabotage en rougit au moins un.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
// (Les espaces fines et insécables de la page, lues comme des espaces.)
const plat = t => t.replace(/&nbsp;/g, " ").replace(/[\u00a0\u202f]/g, " ");
const PLAT = plat(PAGE);
const contient = (texte, message) => assert.ok(PLAT.includes(texte), message || texte.slice(0, 80));

// Le corps d'une fonction de la page (de « function nom( » à la suivante).
const corps = nom => {
  const debut = PAGE.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `la page a ${nom}`);
  const suite = PAGE.slice(debut + 10).search(/\n {6}(?:async )?function |\n {6}const [A-Za-z_]+ = /);
  return PAGE.slice(debut, suite < 0 ? undefined : debut + 10 + suite);
};

test("1. la réponse à choisir : trois cases « radio », la case touchée dite au lecteur d'écran, le clavier", () => {
  assert.match(PAGE, /<div id="choix" class="dc-choix" role="radiogroup" aria-label="Choisis la bonne réponse" hidden><\/div>/);
  const maj = corps("majChoix");
  assert.match(maj, /bouton\.setAttribute\("role", "radio"\)/, "chaque case est un « radio »");
  assert.match(maj, /bouton\.setAttribute\("aria-checked", estChoisie \? "true" : "false"\)/, "la case touchée est dite au lecteur d'écran");
  assert.match(maj, /", juste" : etat === "est-faux" \? ", pas juste"/, "la correction est dite au lecteur d'écran");
  assert.match(maj, /bouton\.disabled = fini \|\| state\.waitingForContinue/, "plus de choix pendant la correction");
  // (La valeur choisie passe par state.answer, comme une réponse tapée.)
  assert.match(corps("choisirValeur"), /state\.answer = CORE\.formaterNombre\(valeur\)/);
  contient('? "Touche une réponse." : "Touche une réponse, ou « Je ne sais pas »."');
  // Le clavier : les flèches choisissent, les chiffres ne tapent rien.
  contient('if (!manip && choixDuMoment()) {\n          if (event.key === "ArrowLeft" || event.key === "ArrowRight") { choisirVoisine(');
  contient('if (/^\\d$/.test(event.key) || [",", ".", "Backspace", "Delete", "Escape"].includes(event.key)) { event.preventDefault(); return; }\n        }');
  // Partout : Je tente, Je m'entraîne, J'apprends (Je représente, J'écris), Mes calculs du jour.
  const moment = corps("choixDuMoment");
  assert.match(moment, /serie\.apprends\.ecris\.etapes\[serie\.etape\]/);
  assert.match(moment, /serie\.apprends\.represente/);
  assert.match(moment, /question && !question\.exemple \? avec\(question\.calcul\) : null/);
});

test("2. le moteur : une réponse à choisir n'est juste que si elle est l'une des trois ; les trois valeurs de « Où va la virgule ? »", () => {
  // Une réponse égale à la bonne mais absente des trois (un générateur faux,
  // une page trafiquée) n'est jamais comptée juste.
  assert.equal(CORE.estJuste({reponse: 10, choix: [1, 100, 1000]}, 10), false);
  assert.equal(CORE.estJuste({reponse: 10, choix: [1, 10, 100]}, 10), true);
  assert.equal(CORE.estJuste({reponse: 10, choix: [1, 10, 100]}, 100), false);
  const rangs = new Set();
  for (let graine = 1; graine <= 40; graine += 1) {
    const calcul = CORE.genererUn("D16-1", graine);
    assert.ok(calcul && Array.isArray(calcul.choix), `graine ${graine} : un calcul à choisir`);
    assert.equal(calcul.choix.length, 3);
    assert.equal(new Set(calcul.choix.map(String)).size, 3, `graine ${graine} : trois valeurs différentes`);
    const rang = calcul.choix.findIndex(v => CORE.memeNombre(v, calcul.reponse));
    assert.ok(rang >= 0, `graine ${graine} : la bonne est dans les trois`);
    rangs.add(rang);
    calcul.choix.forEach(v => assert.equal(CORE.estJuste(calcul, v), CORE.memeNombre(v, calcul.reponse)));
  }
  assert.ok(rangs.size >= 2, "la bonne n'est pas toujours à la même place");
});

test("3. « Nouveau : je choisis la bonne réponse. » au premier calcul à choisir d'une série, pas aux suivants", () => {
  contient('if (Array.isArray(question.calcul.choix) && $("annonce").hidden && !serie.questions.slice(0, serie.index).some(q => q.calcul && Array.isArray(q.calcul.choix))) {\n          $("annonce").textContent = "Nouveau : je choisis la bonne réponse.";');
});

test("4. les fractions jamais avec une barre oblique : noms des étoiles, carte par cœur de « 0,1 et 1/10 »", () => {
  const ecrire = corps("ecrireAvecFractions");
  assert.match(ecrire, /if \(!\/\\d\\\/\\d\/\.test\(t\)\) \{ element\.textContent = t; return element; \}/);
  assert.match(ecrire, /AIDES\.noeudsCalcul\(morceau, \{insecable\}\)/, "la fraction est écrite à la française");
  // Le titre de la carte par cœur passe par l'écriture des calculs quand il a une fraction.
  const coeur = corps("carteParCoeur");
  assert.match(coeur, /if \(\/\\d\\\/\\d\/\.test\(coeur\.titre\)\) AIDES\.ecrireTexte\(titre, coeur\.titre, \{insecable\}\);/);
  assert.match(coeur, /AIDES\.ecrireTexte\(ligne, calcul, \{insecable\}\)/, "les lignes aussi");
  const carte = CORE.carteParCoeur("D10-2");
  assert.equal(carte.titre, "0,1 et 1/10");
  assert.ok(carte.blocs.flatMap(b => b.liste || []).some(l => /1\/10/.test(l)), "la carte a des fractions (écrites par AIDES.ecrireTexte)");
  // Les noms des étoiles passent par ecrireAvecFractions (carte, panneau, bilan).
  assert.ok((PAGE.match(/ecrireAvecFractions\([^)]*nomCompetence\(/g) || []).length >= 3);
});

test("5. J'écris de « Où va la virgule ? » : les arrondis s'écrivent un à un dans le dessin", () => {
  for (let graine = 1; graine <= 6; graine += 1) {
    const calcul = CORE.genererUn("D16-1", graine);
    const ecris = CORE.ecrisDuCalcul("D16-1", calcul);
    assert.ok(ecris && Array.isArray(ecris.etapes), `graine ${graine} : J'écris`);
    const dessins = ecris.dessins;
    assert.ok(Array.isArray(dessins) && dessins.length === ecris.etapes.length + 1, `graine ${graine} : un dessin par étape, plus la fin`);
    assert.deepEqual(dessins.map(d => d.montre), [0, 1, 2, 3, 3], `graine ${graine} : rien d'avance`);
    // La dernière ligne est à choisir, avec les trois valeurs du calcul.
    const derniere = ecris.etapes[ecris.etapes.length - 1];
    assert.deepEqual(derniere.choix, calcul.choix);
  }
});

test("6. les adresses de cache neuves (moteur, progression, aides, feuille)", () => {
  assert.match(PAGE, /defi_calcul\.css\?v=20261127-2/);
  assert.match(PAGE, /defi_calcul_core\.js\?v=20261128-1/);
  assert.match(PAGE, /defi_calcul_mon_parcours\.js\?v=20261127-2/);
  assert.match(PAGE, /defi_calcul_aides\.js\?v=20261128-1/);
});

test("7. les causes d'erreur : « Une fraction d'un nombre » a les siennes, les deux autres étoiles de la ligne gardent les leurs", () => {
  let vus = 0;
  for (let graine = 1; graine <= 60; graine += 1) {
    const c = CORE.genererUn("F11-3", graine);
    const d = c.donnees;
    // 40 × 5/8 : 200 (multiplié sans partager), 5 (une seule part), 8 (partagé par le numérateur).
    if (d.fois > 0 && !CORE.memeNombre(d.fois, c.reponse)) { assert.equal(CORE.diagnostiquer(c, d.fois).c, 8, `${c.texte} → ${d.fois}`); vus += 1; }
    if (d.une > 0 && !CORE.memeNombre(d.une, c.reponse)) assert.equal(CORE.diagnostiquer(c, d.une).c, 7, `${c.texte} → ${d.une}`);
    if (d.parA > 0 && !CORE.memeNombre(d.parA, c.reponse) && !CORE.memeNombre(d.parA, d.une) && !CORE.memeNombre(d.parA, d.fois)) assert.equal(CORE.diagnostiquer(c, d.parA).c, 9, `${c.texte} → ${d.parA}`);
  }
  assert.ok(vus >= 20, "assez de calculs de « Une fraction d'un nombre » regardés");
  for (const cle of ["F11-1", "F11-2"]) for (let graine = 1; graine <= 30; graine += 1) {
    const c = CORE.genererUn(cle, graine);
    for (const v of Object.values(c.donnees)) {
      if (!(typeof v === "number" && v > 0) || CORE.memeNombre(v, c.reponse)) continue;
      const cause = CORE.diagnostiquer(c, v);
      if (cause) assert.ok(cause.c >= 1 && cause.c <= 6, `${c.texte} → ${v} : cause ${cause.c}`);
    }
  }
});

test("8. correctif : « est proche de » — la bonne case est la plus proche par l'écart ; l'exemple du professeur est une des trois cases", async () => {
  const plusProche = (choix, x) => choix.reduce((m, v) => (Math.abs(v - x) < Math.abs(m - x) ? v : m));
  let vus = 0;
  for (let graine = 1; graine <= 300; graine += 1) for (const c of CORE.genererTentative("D16-1", {graine})) {
    if (c.forme !== "proche") continue;
    vus += 1;
    const {a, b, e} = c.donnees;
    assert.ok(CORE.memeNombre(plusProche(c.choix, a * b), c.reponse), `${c.texte} : le produit ${a * b}`);
    assert.ok(CORE.memeNombre(plusProche(c.choix, e), c.reponse), `${c.texte} : l'estimation ${e}`);
  }
  assert.ok(vus > 500);
  // Les deux calculs trouvés par Codex (graine 77) ne sont plus tirés.
  const textes = new Set();
  for (let graine = 1; graine <= 3000; graine += 1) for (const c of CORE.genererTentative("D16-1", {graine})) textes.add(c.texte);
  ["9,9 × 4,7 est proche de □", "0,52 × 98 est proche de □"].forEach(t => assert.ok(![...textes].some(x => x.replace(/[\u00a0\u202f]/g, " ") === t), t));
  // Une réponse qui n'est pas une des trois cases n'a pas de cause.
  const c = CORE.genererUn("D16-1", 1);
  assert.equal(CORE.diagnostiquer(c, c.reponse * 1000), null);
  // La page du professeur : l'exemple d'une erreur est une des deux autres cases.
  const php = (await import("node:fs")).readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
  const debut = php.indexOf("  const exemplesCalcul =");
  const fin = php.indexOf("  // « ouvrir en classe »", debut);
  const exempleErreur = Function("CALCUL_CORE", php.slice(debut, fin) + "\nreturn exempleErreur;")(CORE);
  for (const cause of [1, 2]) {
    const ex = exempleErreur("D16", 1, cause);
    assert.ok(ex, `cause ${cause}`);
    const calcul = [...Array(6)].flatMap((_, g) => [...Array(6)].map((__, tour) => CORE.genererUn("D16-1", g + 1, {tour}))).find(x => x && x.texte === ex.texte);
    assert.ok(calcul, ex.texte);
    assert.ok(calcul.choix.some(v => CORE.formaterNombre(v) === ex.reponse), `${ex.texte} → ${ex.reponse} : une des trois cases`);
  }
});
