// Défi calcul, lot 6 « fraction à deux cases » (18/11/2026, demande de
// Gwenaël) : la réponse d'un calcul peut être une fraction, écrite dans une
// fraction à deux cases (« 6 × □/□ = 5 », réponse 5/6). L'élève touche le
// numérateur, touche le dénominateur, et tape les deux. Ce fichier vérifie :
//  - la lecture d'une fraction tapée, le juste (10/12 est juste, choix de
//    Gwenaël), la fraction écrite pour la page du professeur ;
//  - « Fraction et quotient » : la sorte « la fraction cherchée » (6 × □ = 5,
//    □ × 6 = 5), jamais un quotient décimal, ses erreurs reconnues (6/5, 5,
//    30), son annonce, son dessin, J'écris de la leçon (choix de Gwenaël) ;
//  - la page : les deux cases, la case touchée, Valider qui descend dans la
//    case vide, le clavier ; les adresses de cache, la copie pour la page
//    prof, VERSION.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const espaces = texte => String(texte).replace(/[  ]/g, " ");
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
function tous(cle) {
  const {niveau} = CORE.niveauDe(cle);
  const vus = new Map();
  for (let g = 1; g <= 40; g += 1) niveau.composer(CORE.mulberry32(g * 104729), 60, []).forEach(c => vus.set(c.cle, c));
  (niveau.imposes || []).forEach(c => vus.set(c.cle, c));
  return [...vus.values()];
}
const cherchees = () => tous("F11-2").filter(c => c.forme.startsWith("fraction"));
const calcul = texte => cherchees().find(c => espaces(c.texte) === texte);

test("lire une fraction tapée : « 5/6 », « 10/12 » ; une case vide, un dénominateur nul : rien", () => {
  assert.ok(CORE.memeNombre(CORE.lireReponse("5/6"), 5 / 6));
  assert.ok(CORE.memeNombre(CORE.lireReponse("10/12"), 5 / 6));
  ["5/", "/6", "5/0", "/", "5//6", "5,2/6", "a/6"].forEach(t => assert.equal(CORE.lireReponse(t), null, t));
  // Les nombres tapés comme avant.
  assert.equal(CORE.lireReponse("3,5"), 3.5);
  assert.equal(CORE.lireReponse("360"), 360);
  assert.equal(CORE.lireReponse(""), null);
  assert.deepEqual(CORE.morceauxFraction("5/6"), ["5", "6"]);
  assert.deepEqual(CORE.morceauxFraction("5/"), ["5", ""]);
  assert.deepEqual(CORE.morceauxFraction(""), ["", ""]);
});

test("le juste : 5/6 et 10/12 (une fraction égale) ; la bulle le dit pour 10/12 ; « irreductible » pour plus tard", () => {
  const c = calcul("6 × □/□ = 5");
  assert.ok(c);
  assert.equal(c.ecrite, "5/6");
  assert.equal(CORE.reponseEcrite(c), "5/6");
  assert.ok(CORE.estJuste(c, CORE.lireReponse("5/6"), "5/6"));
  assert.ok(CORE.estJuste(c, CORE.lireReponse("10/12"), "10/12"));
  assert.ok(!CORE.estJuste(c, CORE.lireReponse("6/5"), "6/5"));
  assert.equal(CORE.fractionEgaleAutrement(c, "5/6"), false);
  assert.equal(CORE.fractionEgaleAutrement(c, "10/12"), true);
  assert.equal(CORE.fractionEgaleAutrement(c, "05/06"), false, "« 05/06 », c'est 5/6");
  assert.equal(CORE.fractionEgaleAutrement(c, "6/5"), false, "faux : rien à dire");
  // `irreductible` (Simplifier, plus tard) : 10/12 ne suffira plus.
  const simplifier = Object.assign({}, c, {irreductible: true});
  assert.ok(CORE.estJuste(simplifier, 5 / 6, "5/6"));
  assert.ok(!CORE.estJuste(simplifier, 5 / 6, "10/12"));
  // Un calcul ordinaire : comme avant.
  const autre = tous("F11-2").find(x => espaces(x.texte) === "15/3 = □");
  assert.equal(CORE.reponseEcrite(autre), "5");
  assert.ok(CORE.estJuste(autre, 5, "5"));
});

test("la page du professeur écrit une réponse fausse en fraction (« 6 × ?/? = 5 → 6/5 »)", () => {
  const c = calcul("6 × □/□ = 5");
  assert.equal(CORE.ecrireReponse(c, 6 / 5), "6/5");
  assert.equal(CORE.ecrireReponse(c, 7 / 3), "7/3");
  assert.equal(CORE.ecrireReponse(c, 30), "30");
  const autre = tous("F11-2").find(x => espaces(x.texte) === "15/3 = □");
  assert.equal(CORE.ecrireReponse(autre, 2.5), "2,5", "un calcul ordinaire garde ses nombres");
});

test("« Fraction et quotient » : trois sortes, la fraction cherchée jamais décimale, 4 calculs sur 10", () => {
  assert.deepEqual(CORE.sortesDe("F11-2").map(s => espaces(s.nom)), ["b × a/b", "la fraction, c’est une division", "la fraction cherchée"]);
  const liste = cherchees();
  assert.equal(liste.length, 16, "8 fractions, deux écritures");
  liste.forEach(c => {
    const t = espaces(c.texte);
    const {a, d} = c.f11;
    assert.match(t, c.forme === "fraction" ? new RegExp(`^${d} × □/□ = ${a}$`) : new RegExp(`^□/□ × ${d} = ${a}$`), t);
    assert.ok([3, 6, 7, 9].includes(d) && a >= 2 && a <= 6 && pgcd(a, d) === 1 && a * d <= 30, `${t} : jamais un quotient décimal`);
    assert.equal(c.ecrite, `${a}/${d}`);
    assert.ok(CORE.memeNombre(c.reponse, a / d));
    assert.equal(CORE.sorteDe(c), 2);
    assert.equal(CORE.virguleDe(c), false, `${t} : pas de virgule`);
    // La clé reste sans texte libre (les codes 3 et 4 de l'ancienne sorte).
    assert.match(c.cle, /^F11-2-[34]-\d+-\d+-\d+$/);
  });
  // Les exemples des textes : 6 × … = 5 (6e, p. 6), et 7 × □ = 3.
  ["6 × □/□ = 5", "□/□ × 6 = 5", "7 × □/□ = 3", "3 × □/□ = 4"].forEach(t => assert.ok(calcul(t), t));
  assert.ok(CORE.niveauDe("F11-2").niveau.imposes.some(c => espaces(c.texte) === "6 × □/□ = 5"), "un imposé de la validation");
  // L'entraînement et la validation ont la fraction cherchée (4 sur 10).
  for (let g = 1; g <= 50; g += 1) {
    ["entraine", "valide"].forEach(genre => {
      const serie = CORE.genererSerie("F11-2", {graine: g, genre});
      const n = serie.filter(c => c.forme.startsWith("fraction")).length;
      assert.ok(n >= .3 * serie.length && n <= .5 * serie.length, `${genre} ${g} : ${n} fractions cherchées sur ${serie.length}`);
    });
  }
  // Rangée après la division (du plus simple au plus dur).
  const rang = c => CORE.moduleDe("F11").difficulte(c);
  const division = tous("F11-2").filter(c => c.forme === "quotient");
  assert.ok(Math.min(...liste.map(rang)) > Math.max(...division.map(rang)));
});

test("les erreurs reconnues : la fraction à l'envers (6/5), le nombre recopié (5), multiplié (30)", () => {
  const c = calcul("6 × □/□ = 5");
  const cause = t => CORE.diagnostiquer(c, CORE.lireReponse(t), t);
  assert.equal(cause("6/5").c, 4);
  assert.equal(espaces(cause("6/5").texte), "6/5 : la fraction est à l’envers. 5 partagé en 6 : 5 ÷ 6 = 5/6.");
  assert.equal(cause("12/10").c, 4, "à l'envers, même écrite autrement");
  assert.equal(cause("5/1").c, 5);
  assert.equal(espaces(cause("5/1").texte), "6 × 5 = 30, pas 5. 5 partagé en 6 : 5 ÷ 6 = 5/6.");
  assert.equal(cause("30/1").c, 6);
  assert.equal(espaces(cause("30/1").texte), "30, c’est 6 × 5. 5 partagé en 6 : 5 ÷ 6 = 5/6.");
  ["1/6", "7/8"].forEach(t => assert.equal(cause(t), null, t));
  assert.equal(cause("10/12"), null, "juste : pas de cause");
  const fiche = CORE.moduleDe("F11");
  assert.deepEqual(fiche.erreurs.map(e => [e.c, espaces(e.nom)]).slice(3), [[4, "la fraction à l’envers"], [5, "le nombre de droite recopié"], [6, "multiplié au lieu de partager"]]);
  // « 15/3 = □ » ne change pas : 45 n'a pas de cause (rien de nouveau pour l'élève).
  const quotient = tous("F11-2").find(x => espaces(x.texte) === "15/3 = □");
  assert.equal(CORE.diagnostiquer(quotient, 45), null);
  assert.equal(CORE.diagnostiquer(quotient, 15).c, 2);
});

test("l'annonce et le dessin : les d parts de a, « ?/d », puis « a/d »", () => {
  const c = calcul("6 × □/□ = 5");
  assert.equal(espaces(CORE.annonceDe(c)), "Nouveau : la fraction cherchée, c’est le nombre qui, multiplié par 6, donne 5.");
  const aide = CORE.aideDe(c);
  assert.equal(aide.outil, "barre-droite");
  assert.equal(aide.haut.length, 6);
  assert.ok(aide.haut.every(h => h.texte === "?/6" && h.a - h.de === 5));
  assert.ok(CORE.imageDe(c).haut.every(h => h.texte === "5/6"));
  assert.ok(!/5\/6|5 sixièmes/.test(AIDES.dessinerImage(aide)), "l'aide ne donne pas la réponse");
});

test("J'écris de la leçon (choix de Gwenaël) : « 3 × □/3 = 2 », puis la fraction à deux cases", () => {
  const lecon = CORE.niveauDe("F11-2").niveau.apprends;
  assert.equal(espaces(lecon.represente.texte), "7 × 3/7 = □", "On te montre ne change pas");
  assert.equal(espaces(lecon.ecris.consigne), "3 × ? = 2");
  assert.deepEqual(lecon.ecris.etapes.map(e => [espaces(e.texte), e.reponse, e.ecrite || null]), [["3 × □/3 = 2", 2, null], ["3 × □/□ = 2", 2 / 3, "2/3"]]);
  assert.equal(lecon.ecris.ecrite, "2/3");
  // Le dessin : « ?/3 », puis « 2/3 » trouvé dès le numérateur.
  assert.ok(lecon.ecris.dessins[0].haut.every(h => h.texte === "?/3" && !h.trouve));
  assert.ok(lecon.ecris.dessins[1].haut.every(h => h.texte === "2/3" && h.trouve));
  assert.ok(lecon.ecris.solution.image.haut.every(h => h.texte === "2/3" && !h.trouve));
  assert.equal(espaces(lecon.ecris.solution.phrase), "Regarde : 3 × 2/3 = 2.");
  // J'écris tiré : toujours une fraction cherchée, jamais celle de la leçon.
  for (let g = 1; g <= 60; g += 1) {
    const {calcul: tire, ecris} = CORE.ecrisTire("F11-2", {graine: g * 977});
    assert.equal(tire.forme, "fraction");
    assert.notEqual(espaces(tire.texte), "3 × □/□ = 2");
    assert.equal(ecris.etapes[1].ecrite, tire.ecrite);
  }
  // Le bilan ne change pas.
  assert.equal(espaces(lecon.bilan), "3/7, c’est le nombre qui, multiplié par 7, donne 3 : 7 × 3/7 = 21/7 = 3.");
});

test("les cases : 2 chiffres chacune ; la case ordinaire du niveau ne compte pas les fractions", () => {
  assert.equal(CORE.chiffresFraction("F11-2"), 2);
  assert.equal(CORE.chiffresFraction("F11-2", ["123/4"]), 3);
  assert.deepEqual(CORE.modelesReponse("F11-2"), ["0"], "les réponses entières de « 15/3 = □ », « 3 × 5/3 = □ »");
});

test("le dessin d'un calcul : « □/□ » demande ses deux cases à part, « num » puis « den »", () => {
  // (Un document minimal : noeudsCalcul ne fait que créer des éléments.)
  const element = nom => ({nom, enfants: [], classes: new Set(), attributs: {}, textContent: "",
    classList: {add(c) { this.e.classes.add(c); }}, append(...e) { this.enfants.push(...e); }, setAttribute(k, v) { this.attributs[k] = v; }});
  const doc = {createElement: nom => { const e = element(nom); e.classList.e = e; return e; }, createTextNode: t => ({texte: t})};
  const avant = globalThis.document;
  globalThis.document = doc;
  try {
    const demandes = [];
    const noeuds = AIDES.noeudsCalcul("6 × □/□ = 5", {caseReponse: partie => { demandes.push(partie); return {case: partie}; }, signes: true});
    assert.deepEqual(demandes, ["num", "den"]);
    const fraction = noeuds.find(n => n.className === "dc-frac");
    assert.ok(fraction.classes.has("dc-frac-cases"));
    // Une case au numérateur (« 0,3 = □/10 ») : comme avant, sans partie.
    demandes.length = 0;
    AIDES.noeudsCalcul("0,3 = □/10", {caseReponse: partie => { demandes.push(partie); return {case: partie}; }});
    assert.deepEqual(demandes, [undefined]);
  } finally {
    globalThis.document = avant;
  }
});

test("la page : deux cases, la case touchée, Valider descend dans la case vide, le clavier ; cache, copie prof, VERSION", async () => {
  const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul_core\.js\?v=20261125-3/);
  assert.match(page, /defi_calcul_aides\.js\?v=20261125-2/);
  assert.match(page, /defi_calcul\.css\?v=20261122-1/);
  assert.match(page, /function caseReponse\(partie\)/);
  assert.match(page, /slot\.id = partie \? `inline-answer-\$\{partie\}` : "inline-answer"/);
  assert.match(page, /function completerFraction\(\)/);
  // Valider avec une case vide : la case vide devient la case où l'on tape, partout où une réponse passe.
  assert.equal((page.match(/completerFraction\(\)\) return/g) || []).length, 3, "J'apprends, le dessin à étapes, les séries");
  // Le juste passe par le moteur (10/12 est juste), partout.
  // (Lot C4a : le dessin à étapes accepte aussi le résultat tapé à la première case.)
  assert.equal((page.match(/CORE\.estJuste\(/g) || []).length, 4);
  assert.doesNotMatch(page, /CORE\.memeNombre\(valeur, (question\.calcul\.reponse|attendue|etapes\[)/);
  assert.match(page, /event\.key === "\/" \|\| event\.key === "Tab"/);
  assert.match(page, /Le dénominateur ne peut pas être 0\./);
  assert.match(page, /\$\{texte\} \$\{ecrit\} = \$\{attendu\.ecrite\}\./, "« Bravo ! 10/12 = 5/6. »");
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /\.dc-frac-cases \.inline-answer\.est-active \{ border-color: var\(--blue\)/);
  const coeur = await readFile(new URL("../outils/calcul_mental/defi_calcul_core.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_calcul_core.js", import.meta.url));
  assert.ok(coeur.equals(copie), "la copie de la page prof est identique, octet pour octet");
  const prof = await lire("../_serveur/public/prof/index.php");
  assert.match(prof, /CALCUL_CORE\.ecrireReponse \? CALCUL_CORE\.ecrireReponse\(calcul, reponse\)/);
  assert.match(prof, /CALCUL_CORE\.aFractionACases\(calcul\.texte\)/);
  const version = await lire("../_serveur/public/VERSION");
  assert.match(version, /^lot defi-calcul-lot-(?:6-fraction-deux-cases|6-programmes-2|6-programmes-2-correctif|F4-personne-bloque|F4-correctif|C1-ordre|C2-doubles-moities|C3-exemples|C4a|C4b|C4c|C4d)$|^lot plus-rapide-A$|^lot mon-espace-B1(?:-liens)?$|^lot ma-liste-B2$|^lot arriver-E$|^lot m-corrige$|^lot aujourdhui-B3$|^lot anzan-bareme-lot-1$/m); // (lot 6 « programmes 2 » : le cœur change encore ; lot F4 et son correctif : le moteur ; lot C1 : le cœur ; lot C2 : le cœur, la progression en version 11)
});
