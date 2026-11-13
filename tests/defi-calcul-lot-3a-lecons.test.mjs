// Défi calcul — lot 3a « Une leçon, une méthode » (13/11/2026).
//
// Décisions de Gwenaël (outils/calcul_mental, lot-3-lecons\defi-calcul-lot-3-DECISIONS.md) :
//  - À retenir reprend TOUJOURS le calcul de « On te montre » (décision 2) ;
//  - J'écris est de la même sorte que la leçon : la méthode ne change pas,
//    seuls les nombres grandissent (règle des leçons, plan directeur § 4) ;
//  - une égalité s'écrit en maths, une par ligne (« 100 = 4 × 25. 3 × 25 = 75. ») ;
//  - le double sur le rekenrek, les deux nombres déjà poussés (M1-1) ;
//  - les générateurs : « Nombres à 4 chiffres » passe le millier, « Milliers
//    dans les grands nombres » sans passage, « un calcul de l'autre côté »
//    dans « Égalités à trou simples », « Cinquièmes » sans « 1 = □ × 1/10 »,
//    « Repères » sans « × 1 » ;
//  - les cartes « par cœur » des doubles : tout ce que l'appli demande.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const NIVEAUX = CORE.ORDRE.map(cle => ({cle, trouve: CORE.niveauDe(cle)})).filter(({trouve}) => trouve && trouve.niveau.apprends);
const espaces = texte => String(texte).replace(/[  ]/g, " ");
// Les nombres d'un texte (« 1 000 » est un seul nombre).
const nombres = texte => (espaces(texte).replace(/ (?=\d{3}\b)/g, "").match(/\d+(,\d+)?/g) || []);
const tirages = (cle, n = 40) => {
  const {niveau} = CORE.niveauDe(cle);
  const vus = new Map();
  for (let g = 1; g <= n; g += 1) niveau.composer(CORE.mulberry32(g * 104729), 40, []).forEach(c => vus.set(c.cle, c));
  return [...vus.values()];
};

test("les 95 leçons : À retenir reprend le calcul de « On te montre », et sa réponse", () => {
  assert.equal(NIVEAUX.length, 95);
  NIVEAUX.forEach(({cle, trouve}) => {
    const a = trouve.niveau.apprends;
    const montre = a.calculs.montre;
    assert.equal(espaces(montre.texte).replace(/ = □.*$/, "").replace("□", "?").split(" = ")[0], espaces(a.exemple.texte).split(" = ")[0], `${cle} : le calcul montré est celui de l'exemple`);
    const dansBilan = nombres(a.bilan);
    const attendus = [...nombres(montre.texte.replace("□", "")), ...nombres(CORE.formaterNombre(montre.reponse))];
    attendus.forEach(x => assert.ok(dansBilan.includes(x), `${cle} : À retenir (« ${espaces(a.bilan)} ») cite ${x} de « ${espaces(montre.texte)} »`));
  });
});

// Les niveaux où J'écris est d'une autre sorte que la leçon, et pourquoi.
//  - « taille » : les nombres grandissent, la méthode ne change pas ;
//  - « décidé » : J'écris choisi par Gwenaël (cahier du lot 3a) ;
//  - « 3b » : à reprendre au lot 3b (chaque sorte annoncée, fractions).
const AUTRE_SORTE = Object.freeze({
  "A1-1": "taille : 10 = 8 + ?, la même paire écrite à l'envers",
  "A10-1": "taille", "A11-1": "taille", "A10-2": "taille", "A11-2": "taille", "A11-3": "taille",
  "A2-1": "taille", "A6-1": "taille", "M6-1": "taille", "M6-2": "taille", "M7-1": "taille", "M7-3": "taille",
  "D2-1": "taille", "M12-2": "taille", "C1-3": "taille", "F3-1": "taille : un partage", "F3-2": "taille : un partage", "F3-3": "taille : un partage",
  "D1-2": "taille : chaque morceau dans sa colonne", "D1-3": "taille : chaque morceau dans sa colonne",
  "M4-1": "décidé : J'écris sur la division (remarque 61)", "M4-2": "décidé : J'écris sur la division (remarque 61)",
  "F1-1": "décidé : 0,7 = 7/?", "F1-2": "décidé : 3/4 = ?/100",
  // Lot 3b : J'écris des demis et quarts, × 100, ÷ 10, millièmes, fractions
  // égales 2 et 3 sont de la sorte de la leçon ; reste F6-1, décidé.
  "F6-1": "décidé (lot 3b) : J'écris au-delà de 12 parts, sur le calcul « × 4 en haut et en bas »"
});

test("J'écris est de la même sorte que la leçon (ou l'écart est noté)", () => {
  const ecarts = [];
  NIVEAUX.forEach(({cle, trouve}) => {
    const {montre, ecris} = trouve.niveau.apprends.calculs;
    if (CORE.sorteDansNiveau(cle, montre) !== CORE.sorteDansNiveau(cle, ecris)) ecarts.push(cle);
  });
  ecarts.forEach(cle => assert.ok(AUTRE_SORTE[cle], `${cle} : J'écris change de sorte sans raison notée`));
  Object.keys(AUTRE_SORTE).forEach(cle => assert.ok(ecarts.includes(cle), `${cle} : noté à tort (même sorte maintenant)`));
});

test("les leçons du cahier 3a : la sorte du calcul montré et de J'écris", () => {
  const meme = ["A1-3", "M1-1", "M1-2", "M1-3", "A3-1", "A3-2", "A3-3", "A3-4", "M2-1", "M2-2", "M3-2", "M3-3", "M5-1", "M12-1", "F2-2", "F1-3", "C3-1", "C3-2", "C3-3"];
  meme.forEach(cle => {
    const {montre, ecris} = CORE.niveauDe(cle).niveau.apprends.calculs;
    assert.equal(CORE.sorteDansNiveau(cle, ecris), CORE.sorteDansNiveau(cle, montre), `${cle} : ${espaces(montre.texte)} / ${espaces(ecris.texte)}`);
  });
  // On ajoute avant de retirer (décision 3) : A3-1 montre 46 + 30.
  assert.equal(espaces(CORE.niveauDe("A3-1").niveau.apprends.exemple.texte), "46 + 30");
  // Le double avant la moitié (décision 5).
  ["M1-1", "M1-2", "M1-3"].forEach(cle => {
    const {montre, ecris} = CORE.niveauDe(cle).niveau.apprends.calculs;
    assert.equal(montre.forme, "double", cle);
    assert.equal(ecris.forme, "double", cle);
    assert.match(CORE.niveauDe(cle).niveau.apprends.autre.phrase, /La moitié, c’est le nombre qu’on double/, cle);
  });
  // × 10 et ÷ 10 (décision 6).
  assert.equal(espaces(CORE.niveauDe("M2-1").niveau.apprends.exemple.texte), "45 × 10");
  assert.equal(espaces(CORE.niveauDe("M2-2").niveau.apprends.exemple.texte), "480 ÷ 10");
  // L'exemple de « Garder l'égalité, grands nombres » : avec son « = ».
  assert.equal(espaces(CORE.niveauDe("C3-3").niveau.apprends.exemple.texte), "144 + 237 = ? + 239");
});

test("les égalités en maths : « 100 = 4 × 25 », puis « 3 × 25 = 75 », une par ligne", async () => {
  const lignes = cle => espaces(CORE.niveauDe(cle).niveau.apprends.bilan).split(/(?<=\.)\s+(?=[A-ZÀ-ÖØ-Þ\d])/).map(t => AIDES.bilanEnDeux(t));
  assert.deepEqual(lignes("M5-1").map(l => l.calcul), ["100 = 4 × 25", "3 × 25 = 75"]);
  assert.deepEqual(lignes("F8-2").map(l => l.calcul), ["1 = 3/3", "1 − 2/3 = 3/3 − 2/3 = 1/3"]);
  assert.deepEqual(lignes("F1-1").map(l => l.calcul), ["1/10 = 0,1", "3/10 = 0,3"]);
  assert.deepEqual(lignes("M4-1").map(l => [l.phrase, l.calcul]), [["", "7 × 4 = 4 × 7 = 28"], ["Dans 28, il y a 7 fois 4.", "28 ÷ 4 = 7"], ["Il y a aussi 4 fois 7.", "28 ÷ 7 = 4"]]);
  // La page écrit chaque calcul sur sa ligne dès qu'un bilan a plusieurs phrases qui finissent par un calcul.
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /if \(lignes\.length > 1 && lignes\.every\(Boolean\)\)/);
  assert.match(page, /\$\(id\)\.querySelectorAll\("\.dc-retenir-calcul"\)/, "chaque ligne de calcul rapetisse si elle ne tient pas");
});

test("le double sur le rekenrek (M1-1) : les deux nombres déjà poussés, rien à pousser", () => {
  const m = CORE.niveauDe("M1-1").niveau.apprends.manipule;
  assert.deepEqual([...m.rangees], [10, 7, 10, 7]);
  assert.deepEqual([...m.gestes], []);
  assert.deepEqual(m.traces.map(t => [t.apres, espaces(t.texte)]), [[0, "10 + 10 = 20"], [0, "7 + 7 = 14"], [0, "double de 17 = 20 + 14 = 34"]]);
  // À l'entraînement : les doubles jusqu'à 50 au niveau 1 ; ni la moitié, ni les autres niveaux.
  tirages("M1-1").forEach(c => {
    const outil = CORE.manipulationDe(c);
    if (c.forme === "double" && c.donnees.n <= 50) {
      assert.equal(outil.rangees.reduce((a, b) => a + b, 0), c.reponse, c.texte);
      assert.deepEqual(outil.rangees.slice(0, outil.rangees.length / 2), outil.rangees.slice(outil.rangees.length / 2), `${c.texte} : deux fois le même nombre`);
    } else assert.equal(outil, null, c.texte);
  });
  tirages("M1-2").forEach(c => assert.equal(CORE.manipulationDe(c), null, c.texte));
});

test("le rekenrek accepte des rangées données, sans geste : fini dès le départ", () => {
  // (Le moteur : `rangees` remplace le départ en rangées pleines.)
  const source = require("node:fs").readFileSync(new URL("../outils/calcul_mental/defi_calcul_aides.js", import.meta.url), "utf8");
  assert.match(source, /const etatsDepart = Array\.isArray\(options\.rangees\)/);
  assert.match(source, /etats: etatsDepart, etape: 0, finie: !gestes\.length,/);
  assert.match(source, /if \(boulier\.finie\) \{\n\s+bloc\.classList\.add\("est-finie"\);/);
});

test("les générateurs du cahier 3a", () => {
  const passe = (n, d, u) => Math.floor(n / u) !== Math.floor((n + d) / u);
  // « Nombres à 4 chiffres » : toujours le millier passé, quatre sortes.
  const a33 = tirages("A3-3");
  a33.forEach(c => assert.ok(passe(c.donnees.n, c.donnees.d, 1000) && c.donnees.n % 1000 !== 0, c.texte));
  assert.deepEqual([...new Set(a33.map(c => CORE.sorteDe(c)))].sort(), [0, 1, 2, 3]);
  // « Milliers dans les grands nombres » : jamais de passage.
  tirages("A3-4").forEach(c => {
    const u = Math.abs(c.donnees.d) >= 1000 ? 1000 : Math.abs(c.donnees.d) >= 100 ? 100 : 10;
    // (Arriver pile sur le rang du dessus, 75 300 + 700 = 76 000, n'est pas
    // le passer : la convention du moteur, comme 340 + 60 = 400.)
    const pile = c.donnees.d > 0 && (c.donnees.n + c.donnees.d) % (10 * u) === 0;
    assert.ok(!passe(c.donnees.n, c.donnees.d, 10 * u) || pile, c.texte);
  });
  // « Un calcul de l'autre côté » : dans « Égalités à trou simples » seulement.
  const formes = cle => new Set(tirages(cle).map(c => c.forme));
  assert.ok(formes("C3-1").has("retire-produit") && formes("C3-1").has("difference-quotient"));
  assert.ok(!formes("C3-2").has("retire-produit") && !formes("C3-2").has("difference-quotient"));
  assert.deepEqual(CORE.sortesDe("C3-1").map(s => s.nom), ["a = b + □", "□ − b = a", "a − □ = b", "un calcul de l’autre côté"]);
  // « Cinquièmes » sans « 1 = □ × 1/10 », « Repères » sans « × 1 ».
  tirages("F1-3").forEach(c => assert.doesNotMatch(espaces(c.texte), /× 1\/(10|100|1 000)/, c.texte));
  tirages("M5-1").forEach(c => assert.doesNotMatch(espaces(c.texte), /(^|[^\d])1 ×|= 1 ×/, c.texte));
  // Les sortes d'A3 lisent le saut sans son signe (− centaines existe).
  ["A3-1", "A3-3"].forEach(cle => assert.ok(tirages(cle).some(c => c.donnees.d <= -100 && CORE.sortesDe(cle)[CORE.sorteDe(c)].nom === "− centaines"), cle));
});

test("les cartes « par cœur » des doubles : tout ce que l'appli demande s'y lit", () => {
  ["M1-1", "M1-2"].forEach(cle => {
    const carte = CORE.carteParCoeur(cle);
    const paires = new Map();
    carte.blocs.forEach(b => b.table[0].forEach((n, j) => paires.set(n, b.table[1][j])));
    tirages(cle).forEach(c => {
      // Le nombre et son double : le plus petit des deux est le nombre.
      const n = Math.min(c.donnees.n, c.reponse);
      assert.equal(paires.get(n), 2 * n, `${cle} : ${espaces(c.texte)} (double de ${n})`);
    });
  });
  // « Sous chaque nombre, son double » : pas de case en petit gris au début.
  const page = require("node:fs").readFileSync(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /if \(bloc\.ligneTete\) table\.className = "sans-coin";/);
  const css = require("node:fs").readFileSync(new URL("../outils/calcul_mental/defi_calcul.css", import.meta.url), "utf8");
  assert.match(css, /\.dc-coeur table\.sans-coin th:first-child \{ font-size: inherit; \}/);
});
