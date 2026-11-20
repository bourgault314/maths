// Défi calcul — lot 3b « Chaque sorte annoncée » (13/11/2026).
// Les sortes qui changent la méthode sont annoncées ; les presque-doubles
// sont une sorte de « Sommes jusqu'à 20 », sur le rekenrek ; les fractions
// égales se dessinent jusqu'à 12 parts, puis « × 4 en haut et en bas » ;
// J'écris de la même sorte que la leçon ; les niveaux « par cœur » : À
// retenir avec son schéma, puis « Ma carte à apprendre » ; des cartes où
// tout ce que le niveau demande se lit.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const espaces = t => String(t).replace(/[  ]/g, " ");
const tirage = (cle, graines = 40) => {
  const {niveau} = CORE.niveauDe(cle);
  const vus = new Map();
  for (let g = 1; g <= graines; g += 1) niveau.composer(CORE.mulberry32(g * 7919), 40, []).forEach(c => vus.set(c.cle, c));
  return [...vus.values()];
};

test("chaque sorte annoncée a sa phrase, et la sorte de la leçon n'est jamais annoncée", () => {
  const attendues = {
    "A1-2": ["on ajoute 10", "les deux nombres se suivent"],
    "A2-2": ["un nombre en 5"],
    "A3-1": ["on ajoute des centaines", "on retire des dizaines", "on retire des centaines"],
    "A3-2": ["on retire des dizaines"],
    // (Lot 6 « programmes 2 », choix de Gwenaël : trois sortes.)
    "A3-3": ["on retire et on passe sous le millier"],
    "A3-4": ["on passe la dizaine de mille"],
    "D3-1": ["le résultat est plus petit que 1"],
    "M2-1": ["× 100, chaque chiffre glisse de 2 colonnes"], "M2-2": ["× 1 000, chaque chiffre glisse de 3 colonnes"],
    "D2-2": ["× 1 000"], "D2-3": ["× 1 000"], "D3-2": ["÷ 1 000"], "D3-3": ["÷ 100", "÷ 1 000"],
    "C3-1": ["un calcul de l’autre côté"],
    // (Lot 7e : F6-1 au programme du CE2, tout se dessine ; A10-1 arrive pile sur la dizaine.)
    "A10-1": ["j’arrive pile sur la dizaine"],
    "F6-3": ["trop de parts pour les dessiner : je multiplie", "trop de parts pour les dessiner : je divise"], "F6-4": ["trop de parts pour les dessiner"]
  };
  Object.entries(attendues).forEach(([cle, phrases]) => {
    const textes = new Set(tirage(cle).map(c => CORE.nouveauteDe(c, cle)).filter(Boolean).map(n => espaces(n.texte)));
    phrases.forEach(p => assert.ok([...textes].some(t => t.includes(p)), `${cle} : « ${p} » jamais annoncé (${[...textes].join(" | ")})`));
    [...textes].forEach(t => assert.match(t, /^Nouveau : .+\.$/, cle));
    const lecon = CORE.niveauDe(cle).niveau.apprends.calculs.montre;
    assert.equal(CORE.nouveauteDe(lecon, cle), null, `${cle} : la leçon montre une sorte annoncée`);
  });
  // Une sorte où seuls les nombres grandissent n'est pas annoncée.
  ["A5-2", "A10-2", "M7-1", "D2-1"].forEach(cle => tirage(cle, 5).forEach(c => assert.equal(CORE.nouveauteDe(c, cle), null, `${cle} ${c.texte}`)));
});

test("la page annonce une sorte nouvelle, même au premier calcul après la leçon, et fait revenir le dessin", async () => {
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /function nouveauteNouvelle\(serie, question\)/);
  assert.match(page, /const sorteNouvelle = nouveauteNouvelle\(serie, question\);\s*if \(sorteNouvelle\) \{\s*annonce\.textContent = sorteNouvelle;\s*annonce\.hidden = false;\s*nouveau = true;/);
  assert.match(page, /if \(lecon\) vues\.push\(lecon\);/);
});

test("presque-doubles : une sorte de « Sommes jusqu'à 20 », 8 en haut, 7 en dessous", () => {
  assert.deepEqual(CORE.sortesDe("A1-2").map(s => s.nom), ["un nombre est 10", "on passe 10", "les deux nombres se suivent"]);
  const calcul = tirage("A1-2").find(c => espaces(c.texte) === "8 + 7 = □");
  assert.ok(calcul);
  assert.equal(CORE.sorteDe(calcul), 2);
  const perles = CORE.manipulationDe(calcul);
  assert.deepEqual([...perles.rangees], [8, 7]);
  assert.deepEqual([...perles.gestes], []);
  assert.match(espaces(perles.traces[0].attente), /^7 \+ 7 \+ 1 = …$/);
  const aide = CORE.aideDe(calcul);
  assert.equal(aide.outil, "presque-double");
  assert.equal(aide.plus, 0, "la perle en plus sur la rangée du 8");
  assert.match(espaces(AIDES.dessinerImage(aide)), /7 \+ 7 \+ 1 = \?/);
  assert.match(espaces(AIDES.dessinerImage(CORE.imageDe(calcul))), /8 \+ 7 = 7 \+ 7 \+ 1 = 15/);
  // La leçon passe 10 sur 8 + 5 ; À retenir garde ses deux lignes.
  const a = CORE.niveauDe("A1-2").niveau.apprends;
  assert.equal(espaces(a.exemple.texte), "8 + 5");
  assert.match(espaces(a.bilan), /8 \+ 5 = 8 \+ 2 \+ 3 = 13\.$/);
  assert.equal(espaces(a.autre.calcul), "7 + 8 = 7 + 7 + 1 = 15");
  // Passer 10 : la rangée finie s'entoure (seulement dans A1).
  assert.equal(a.manipule.entourerDix, true);
  assert.equal(CORE.niveauDe("A10-2").niveau.apprends.manipule.entourerDix, false);
});

test("fractions égales : le dessin jusqu'à 12 parts, puis les deux flèches", () => {
  ["F6-1", "F6-3", "F6-4"].forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    const montre = a.calculs.montre;
    assert.ok(Math.ceil(montre.donnees.a / montre.donnees.d) * montre.donnees.k * montre.donnees.d <= 12, `${cle} : la leçon a plus de 12 parts`);
    assert.equal(a.image.outil, "barre-droite", cle);
    // Lot 7e : F6-1 (programme du CE2) n'a plus que 12 parts au plus — J'écris sur les bandes.
    assert.ok(a.ecris.dessins.every(d => d.outil === (cle === "F6-1" ? "barre-droite" : "fois-fraction")), `${cle} : J'écris sur le calcul`);
    tirage(cle, 10).forEach(c => {
      const parts = Math.max(1, Math.ceil(c.donnees.a / c.donnees.d - 1e-9)) * c.donnees.k * c.donnees.d;
      assert.equal(CORE.aideDe(c).outil, parts > 12 ? "fois-fraction" : "barre-droite", `${cle} ${c.texte}`);
      if (parts > 12) assert.equal(CORE.manipulationDe(c), null, `${cle} ${c.texte} : pas de bandes au-delà de 12 parts`);
    });
  });
  assert.equal(espaces(CORE.niveauDe("F6-3").niveau.apprends.ecris.consigne), "10/25 = (10 ÷ 5)/(25 ÷ 5)");
  // Le dessin : « × ? » avant, « × 4 » une fois trouvé, la case « ? ».
  const svg = espaces(AIDES.foisFraction({op: "×", k: 4, gauche: [3, 5], droite: [12, 20], cache: "dn", montre: false, haut: false, bas: true}));
  assert.match(svg, />× \?</);
  assert.match(svg, />× 4</);
  assert.doesNotMatch(svg, />12</);
});

test("une fraction écrite entre parenthèses s'écrit sans elles, sur la barre", async () => {
  const aides = await readFile(new URL("../outils/calcul_mental/defi_calcul_aides.js", import.meta.url), "utf8");
  const motif = /const MOTIF_FRACTION = (\/.+\/g);/.exec(aides);
  assert.ok(motif);
  const re = eval(motif[1]);
  const m = [..."3/5 = (3 × 4)/(5 × 4)".matchAll(re)].map(x => [x[1], x[2]]);
  assert.deepEqual(m, [["3", "5"], ["(3 × 4)", "(5 × 4)"]]);
  assert.match(aides, /num\.textContent = insecable\(sansParentheses\(m\[1\]\)\)/);
});

test("J'écris de la même sorte que la leçon : demis et quarts, × 100, ÷ 10, millièmes", () => {
  ["F2-1", "D2-3", "D3-3", "D4-2", "F6-3", "F6-4"].forEach(cle => {
    const {montre, ecris} = CORE.niveauDe(cle).niveau.apprends.calculs;
    assert.equal(CORE.sorteDansNiveau(cle, ecris), CORE.sorteDansNiveau(cle, montre), `${cle} : ${espaces(ecris.texte)}`);
  });
});

test("niveaux « par cœur » : À retenir avec son schéma, puis « Ma carte à apprendre »", async () => {
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /"Ma carte à apprendre →"/);
  assert.match(page, /"Je la note dans mon cahier et je l’apprends par cœur\."/);
  ["A1-1", "A1-2", "A1-3", "A2-1", "A2-2", "M1-1", "M1-2", "M4-1", "M4-2", "M5-1", "F2-1", "F2-2", "F1-1", "F1-2", "F1-3"].forEach(cle => {
    const schema = CORE.schemaParCoeur(CORE.niveauDe(cle).niveau.apprends);
    assert.ok(schema, cle);
    assert.ok(AIDES.dessinerImage(schema).startsWith("<svg"), cle);
  });
  assert.deepEqual([...CORE.schemaParCoeur(CORE.niveauDe("M1-1").niveau.apprends).rangees], [10, 7, 10, 7]);
  assert.deepEqual(CORE.schemaParCoeur(CORE.niveauDe("A2-2").niveau.apprends).paires.map(p => [...p]), [[40, 60]]);
});

test("les cartes « par cœur » : tout ce que le niveau demande s'y lit", () => {
  const cellules = cle => CORE.carteParCoeur(cle).blocs.flatMap(b => (b.table || []).flat().map(v => (v && typeof v === "object" ? v.texte : v)));
  const lignes = cle => CORE.carteParCoeur(cle).blocs.flatMap(b => b.liste || []).map(espaces);
  // Sommes jusqu'à 10 : la table de 0 à 10, les paires de 10 en couleur.
  const a11 = CORE.carteParCoeur("A1-1").blocs.find(b => b.table).table;
  assert.equal(a11[1][1], 0);
  assert.equal(a11[5][4], 7, "4 + 3");
  assert.equal(a11[8][5], "", "7 + 4 n'est pas jusqu'à 10");
  assert.deepEqual(a11[4][8], {texte: "10", fort: true});
  // + 10 et les différences de 1 : la table de 1 à 10.
  // (Lot 7e-2 : « Différences et trous jusqu'à 20 » est une procédure, sans carte.)
  assert.deepEqual(CORE.carteParCoeur("A1-2").blocs[0].table[0], ["+", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(CORE.carteParCoeur("A1-3"), null);
  assert.ok(lignes("M4-1").some(l => l.includes("7 × 1 = 7")));
  assert.ok(cellules("M4-2").includes(100), "10 × 10");
  assert.ok(lignes("F2-2").includes("3/4 + 3/4 = 6/4 = 3/2"));
  assert.ok(lignes("F1-2").some(l => l.includes("750/1 000")));
  assert.ok(lignes("F1-2").includes("4/2 = 2"));
  assert.ok(lignes("F1-3").includes("2/5 = 4/10 = 0,4"));
});
