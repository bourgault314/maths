// Défi calcul, lot « les fractions de 6e » (28/11/2026, remarques de
// Gwenaël du matin ; choix du même jour par questions, options
// recommandées, planches planche-fr6-1 à 5). Ce fichier vérifie :
//  - « Cinquièmes : en décimal » passe par les dixièmes : 3/5 = 6/10 = 0,6,
//    les flèches « × 2 en haut et en bas » (÷ 2 à l'envers) — la leçon (les
//    bandes sur une droite en dixièmes, J'écris en deux lignes, À retenir),
//    l'aide de l'entraînement, J'écris sur un calcul tiré, les phrases, la
//    carte ; « Dixième, centième » et « Demis, quarts, millième » ne
//    changent pas ;
//  - « Fraction et quotient » : un seul dessin, le tout partagé en parts
//    égales (12 au plus), plus de calculs (numérateurs jusqu'à 40, les
//    quotients des tables, « 3 ÷ 7 = □/□ »), toujours trois sortes ;
//  - la page : les fractions écrites à la française dans une part, les
//    flèches avec « = 0,6 », la place de la touche « , » gardée dans
//    J'écris ; les adresses de cache, la copie pour la page prof.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const espaces = texte => String(texte).replace(/[\u00a0\u202f]/g, " ");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
function tous(cle) {
  const {niveau} = CORE.niveauDe(cle);
  const vus = new Map();
  for (let g = 1; g <= 60; g += 1) niveau.composer(CORE.mulberry32(g * 104729), 60, []).forEach(c => vus.set(c.cle, c));
  (niveau.imposes || []).forEach(c => vus.set(c.cle, c));
  return [...vus.values()];
}
const dans = (cle, texte) => tous(cle).find(c => espaces(c.texte) === texte);

// ------------------------------------------------ Cinquièmes : en décimal

test("Cinquièmes : la leçon passe par les dixièmes — bandes sur une droite en dixièmes, J'écris 7/5 = ?/10 puis 7/5 = ?, À retenir", () => {
  const lecon = CORE.niveauDe("F1-3").niveau.apprends;
  // On te montre : les bandes de 1/5 sur une droite graduée en dixièmes.
  assert.equal(lecon.manipule.outil, "bandes");
  assert.equal(lecon.manipule.grad, 10);
  assert.equal(lecon.manipule.arrivee, 4, "2/5 arrive à la 4e graduation (4 dixièmes)");
  assert.equal(espaces(lecon.manipule.traces[0].texte), "2/5 = 4/10 = 0,4");
  // J'écris : deux lignes.
  assert.deepEqual(lecon.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["7/5 = □/10", 14], ["7/5 = □", 1.4]]);
  const [d0, d1, d2] = lecon.ecris.dessins;
  [d0, d1, d2].forEach(d => assert.equal(d.outil, "fois-fraction"));
  assert.deepEqual([d0.gauche, d0.droite, d0.op, d0.k], [[7, 5], [14, 10], "×", 2]);
  assert.equal(d0.montre, false, "au début, le numérateur des dixièmes est caché");
  assert.equal(d0.apres.cache, true, "et le décimal aussi");
  assert.equal(d1.montre && d1.trouve, true, "la 1re ligne faite : 14 en vert");
  assert.equal(d1.apres.cache, true, "le décimal reste caché");
  assert.equal(d2.apres.cache, false);
  assert.equal(d2.apres.trouve, true);
  assert.equal(d2.apres.texte, "1,4");
  // À retenir.
  assert.equal(espaces(lecon.bilan), "1/5 = 2/10 = 0,2. 2/5 = 4/10 = 0,4.");
  assert.equal(lecon.image.outil, "fois-fraction");
  assert.deepEqual([lecon.image.gauche, lecon.image.droite, lecon.image.apres.texte, lecon.image.apres.cache], [[2, 5], [4, 10], "0,4", false], "le calcul de On te montre");
  // Plus de « 3 × 1/5 » ni de « 0,2 et … × 0,2 ».
  const tout = JSON.stringify(lecon);
  assert.ok(!/3 × 1\/5|× 0,2/.test(tout), "plus de 3 × 0,2 dans la leçon");
});

test("Cinquièmes : l'aide de l'entraînement, ce sont les flèches — jamais la réponse ; la correction l'écrit", () => {
  const calculs = tous("F1-3");
  assert.ok(calculs.length >= 25);
  for (const c of calculs) {
    const aide = CORE.aideDe(c);
    const image = CORE.imageDe(c);
    assert.equal(aide.outil, "fois-fraction", c.texte);
    assert.equal(aide.montre, false, `${c.texte} : la case cherchée est cachée`);
    if (aide.apres) assert.equal(aide.apres.cache, true, `${c.texte} : le décimal est caché`);
    assert.equal(image.montre, true, c.texte);
    if (c.forme === "decimal") {
      assert.deepEqual([aide.op, aide.k, aide.gauche, aide.droite], ["×", 2, [c.f1.a, 5], [2 * c.f1.a, 10]], c.texte);
      assert.ok(CORE.memeNombre(Number(image.apres.texte.replace(",", ".")), c.reponse), c.texte);
    } else if (c.forme === "centiemes") {
      assert.equal(aide.k, c.f1.D / 5, c.texte);
      assert.equal(aide.droite[0], c.reponse, c.texte);
    } else {
      // 1,4 = □/5, 0,6 = 3/□ : en dixièmes, puis ÷ 2.
      assert.deepEqual([aide.op, aide.k, aide.gauche], ["÷", 2, [Math.round(c.f1.v * 10), 10]], c.texte);
      assert.equal(espaces(aide.avant), `${CORE.formaterNombre(c.f1.v)} =`, c.texte);
      assert.equal(aide.cache, c.forme === "numerateur" ? "dn" : "dd", c.texte);
    }
    // La phrase de la correction : « en haut et en bas ».
    assert.match(CORE.phraseDe(c), /en haut et en bas/, c.texte);
  }
});

test("Cinquièmes : J'écris sur un calcul tiré, les exemples résolus, les erreurs, la carte — tout en dixièmes", () => {
  const c = dans("F1-3", "4/5 = □");
  const ecris = CORE.ecrisDuCalcul("F1-3", c);
  assert.deepEqual(ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["4/5 = □/10", 8], ["4/5 = □", 0.8]]);
  assert.equal(ecris.dessins[0].outil, "fois-fraction");
  assert.equal(espaces(CORE.methodeExemple(dans("F1-3", "1,4 = □/5"))), "1,4 = 14/10 = 7/5 (÷ 2 en haut et en bas) : 1,4 = 7/5.");
  assert.equal(espaces(CORE.methodeExemple(dans("F1-3", "3/□ = 0,6"))), "0,6 = 6/10 = 3/5 (÷ 2 en haut et en bas) : 3/5 = 0,6.");
  assert.equal(espaces(CORE.methodeExemple(dans("F1-3", "3/5 = □/100"))), "× 20 en haut et en bas : 3/5 = 60/100.");
  // 3/5 → 3,5 : la barre n'est pas une virgule ; la suite dit les dixièmes.
  const d = CORE.diagnostiquer(dans("F1-3", "2/5 = □"), 2.5);
  assert.ok(d, "la cause « barre = virgule » est reconnue");
  assert.match(espaces(d.texte), /2\/5 : je l’écris en dixièmes, × 2 en haut et en bas/);
  assert.ok(!espaces(d.texte).includes("0,4"), "sans la réponse");
  // La carte : le chemin sans « 6 × 1/5 ».
  const carte = JSON.stringify(CORE.carteParCoeur("F1-3"));
  assert.ok(carte.includes("6/5 = 12/10 = 1,2") && !carte.includes("6 × 1/5"));
  // Toujours quatre sortes (les données enregistrées ne changent pas).
  assert.equal(CORE.sortesDe("F1-3").length, 4);
});

test("Dixième, centième et Demis, quarts, millième ne changent pas", () => {
  // (Les bandes de « Demis, quarts » gardent leur droite en quarts.)
  assert.equal(CORE.niveauDe("F1-2").niveau.apprends.manipule.grad, 4);
  for (const cle of ["F1-1", "F1-2"]) {
    for (const c of tous(cle)) assert.notEqual(CORE.aideDe(c).outil, "fois-fraction", `${cle} : ${c.texte}`);
  }
});

// ------------------------------------------------ Fraction et quotient

test("Fraction et quotient : plus de calculs — numérateurs jusqu'à 40, quotients des tables, « 3 ÷ 7 = □/□ » ; 12 parts au plus", () => {
  const calculs = tous("F11-2");
  assert.ok(calculs.length >= 400, `${calculs.length} calculs`);
  const formes = new Set(calculs.map(c => c.forme));
  ["produit", "produit-gauche", "quotient", "division", "fraction", "fraction-gauche"].forEach(f => assert.ok(formes.has(f), f));
  for (const c of calculs) {
    const {a, d} = c.f11;
    assert.ok(d >= 2 && d <= 12, `${c.texte} : ${d} parts`);
    assert.ok(a <= 90, c.texte);
    if (c.forme === "quotient") assert.ok(Number.isInteger(c.reponse) && c.reponse >= 2 && c.reponse <= 10, c.texte);
    if (c.forme === "division" || c.forme.startsWith("fraction")) {
      assert.ok(![2, 4, 5, 8, 10].includes(d), `${c.texte} : jamais un quotient décimal`);
      assert.equal(c.ecrite, `${a}/${d}`);
    }
  }
  assert.ok(calculs.some(c => c.forme === "produit" && c.f11.a > 30), "des numérateurs au-delà de 30");
  assert.ok(dans("F11-2", "56/8 = □"), "un quotient des tables");
  // « 3 ÷ 7 = □/□ » : la fraction à deux cases, 3/7 juste (6/14 aussi), 7/3 à l'envers.
  const div = calculs.find(c => c.forme === "division" && c.f11.a === 3 && c.f11.d === 7);
  assert.ok(div && CORE.aFractionACases(div.texte));
  assert.ok(CORE.estJuste(div, CORE.lireReponse("3/7"), "3/7"));
  assert.ok(CORE.estJuste(div, CORE.lireReponse("6/14"), "6/14"));
  const envers = CORE.diagnostiquer(div, CORE.lireReponse("7/3"), "7/3");
  assert.ok(envers && /à l’envers/.test(envers.texte));
  assert.match(espaces(CORE.annonceDe(div)), /quotient de 3 par 7/);
  // Toujours trois sortes : la division va avec « la fraction, c'est une division ».
  const sortes = CORE.sortesDe("F11-2");
  assert.equal(sortes.length, 3);
  assert.equal(CORE.sorteDe(div), CORE.sorteDe(dans("F11-2", "56/8 = □")));
});

test("Fraction et quotient : un seul dessin, le tout partagé — jamais la réponse dans l'aide ; Entier × fraction garde sa barre", () => {
  for (const c of tous("F11-2")) {
    const aide = CORE.aideDe(c);
    const image = CORE.imageDe(c);
    assert.equal(aide.outil, "tout-parts", c.texte);
    assert.equal(aide.grand, true, c.texte);
    assert.equal(aide.d, c.f11.d, c.texte);
    assert.equal(aide.trouve, null, `${c.texte} : l'aide ne dit pas la réponse`);
    if (c.forme.startsWith("produit")) {
      assert.equal(aide.toutCherche, true, c.texte);
      assert.equal(aide.part.texte, `${c.f11.a}/${c.f11.d}`, c.texte);
    } else assert.equal(aide.tout, CORE.formaterNombre(c.f11.a), c.texte);
    assert.equal(image.trouve.texte, c.ecrite || CORE.formaterNombre(c.reponse), c.texte);
  }
  for (const c of tous("F11-1")) assert.equal(CORE.aideDe(c).outil, "barre-droite", c.texte);
  const lecon = CORE.niveauDe("F11-2").niveau.apprends;
  assert.equal(lecon.represente.image.outil, "tout-parts");
  assert.equal(lecon.represente.image.toutCherche, true);
  assert.equal(lecon.ecris.dessins[0].outil, "tout-parts");
  assert.equal(lecon.ecris.dessins[1].trouve.vert, true, "la 1re ligne faite : la part en vert");
  assert.equal(espaces(lecon.bilan), "3/7, c’est 3 ÷ 7, le nombre qui, multiplié par 7, donne 3 : 7 × 3/7 = 3.");
  assert.match(espaces(CORE.phraseDe(dans("F11-2", "56/8 = □"))), /56\/8 = 56 ÷ 8 = 7/);
});

// ------------------------------------------------ la page

test("Le dessin : une fraction dans une part s'écrit à la française ; « = 0,6 » au bout des flèches", () => {
  const svg = AIDES.dessinerImage({outil: "tout-parts", grand: true, tout: "3", d: 7, toutCherche: true, part: {texte: "3/7", vert: false}, trouve: null});
  assert.ok(!/>\s*3\/7\s*</.test(svg), "jamais « 3/7 » avec la barre oblique");
  assert.match(svg, /<line[^>]*stroke-width="2"/, "la barre de fraction");
  assert.match(svg, /le tout, à trouver : \?/);
  const fleches = AIDES.foisFraction({op: "×", k: 2, gauche: [3, 5], droite: [6, 10], cache: "dn", montre: false, haut: true, bas: true, apres: {texte: "0,6", cache: true}});
  assert.ok(!fleches.includes(">0,6<"), "le décimal caché");
  assert.match(fleches, /égale \?/);
  const fini = AIDES.foisFraction({op: "×", k: 2, gauche: [3, 5], droite: [6, 10], cache: "dn", montre: true, haut: true, bas: true, apres: {texte: "0,6", cache: false}});
  assert.ok(fini.includes(">0,6<"));
  const avant = AIDES.foisFraction({op: "÷", k: 2, avant: "1,4 =", gauche: [14, 10], droite: [7, 5], cache: "dn", montre: false, haut: true, bas: true});
  assert.match(avant, /text-anchor="end"[^>]*>1,4 =</);
});

test("La page : la place de la touche « , » gardée dans J'écris ; les adresses de cache ; la copie pour la page prof", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /etapes\.slice\(serie\.etape\)\.some\(e => CORE\.virguleDuTexte\(module, e\.texte, niveau\)\)/);
  assert.match(page, /\$\("touches"\)\.style\.visibility = "hidden";/);
  assert.match(page, /defi_calcul_core\.js\?v=20261128-1/);
  assert.match(page, /defi_calcul_aides\.js\?v=20261128-1/);
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_core.js"), await lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie pour la page prof, octet pour octet");
});
