// Défi calcul, relecture 1 : le lot « règles communes » (05/11/2026,
// décisions de Gwenaël sur les planches 1 à 5). Ce qui change dans tous les
// modules à la fois :
//  - J'écris annonce le but : au-dessus du dessin, le calcul cherché et son
//    découpage, en égalité, sans mot (« 236 + 7 = 236 + 4 + 3 ») ; jamais la
//    réponse (un trou : le calcul avec son « ? ») ;
//  - « À retenir » : la règle en phrase, puis le calcul seul sur sa ligne ;
//  - « d'un coup » seulement à partir de 2 perles ;
//  - Je m'entraîne : l'outil ne donne plus la réponse (sansReponse) ;
//  - J'écris fini reste à l'écran, avec « Suivant » ;
//  - la page mesure la hauteur visible de l'iPhone (100svh) ;
//  - les boutons choisis gardent un bord de 2 px ; les chiffres des
//    pastilles sont centrés.
// Ce qui se voit (écrans, mesures) : tests/defi-calcul-relecture-1-ecrans.cjs.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

const NIVEAUX = CORE.MODULES.filter(fiche => fiche.construit)
  .flatMap(fiche => fiche.niveaux.map(niveau => ({niveau, cle: `${fiche.id}-${niveau.n}`})));
const espaces = texte => String(texte).replace(/[  ]/g, " ");

// Les consignes de J'écris gardées telles quelles (elles disent autre chose
// d'utile et l'égalité n'aurait pas de sens), et les niveaux sans ligne
// (une seule étape, ou le calcul cherché est déjà la 1re ligne écrite).
// (Lot 7e-2 : la fraction d'une quantité en mots, sans signe =, choix de
// Gwenaël — « Je partage 500 g en 10 parts égales. », « Un quart, c'est la
// moitié de la moitié. »)
// (Lot C4a : la ligne dit ce que vaut le nombre — « 768, c’est 76 dizaines
// et 8 unités. », « 20, c’est 2 dizaines ; 100, c’est 10 dizaines. »,
// « 350, c’est 35 dizaines. ».)
const GARDEES = new Set(["A3-1", "A3-2", "A3-3", "A3-4", "A2-2", "M12-1", "M4-1", "M4-2", "D1-1", "D1-2", "D1-3", "C1-1", "C1-2", "C1-3", "F3-1", "F3-2", "F3-3", "F4-1", "F4-2"]);
const SANS_LIGNE = new Set(["A2-1", "M2-1", "M2-2", "D2-1", "D2-2", "D2-3", "D2-4", "D3-1", "D3-2", "D3-3"]);

// Un petit calcul exact : « 1 002 − 2 − 5 », « 6 × 10 + 6 × 4 », « 3/4 − 1/2 »,
// « moitié de 28 », « 1/2 de 6 L » (l'unité s'en va), « 58 × 10 ÷ 2 ».
function evaluer(texte) {
  const jetons = espaces(texte).replace(/\b(g|€|L|kg|m)\b/g, "").replace(/moitié de/g, "½").replace(/double de/g, "‼")
    .replace(/(\d+)\/(\d+) de/g, "($1/$2)*").replace(/(\d) (?=\d{3}\b)/g, "$1")
    .match(/\d+(,\d+)?|[()+−×÷/*½‼]/g);
  let i = 0;
  const voir = () => jetons[i];
  const prendre = () => jetons[i++];
  function facteur() {
    const j = prendre();
    if (j === "(") { const v = somme(); assert.equal(prendre(), ")"); return v; }
    if (j === "½") return facteur() / 2;
    if (j === "‼") return facteur() * 2;
    return Number(j.replace(",", "."));
  }
  function produit() {
    let v = facteur();
    while (["×", "÷", "/", "*"].includes(voir())) {
      const op = prendre();
      const w = facteur();
      v = op === "÷" || op === "/" ? v / w : v * w;
    }
    return v;
  }
  function somme() {
    let v = produit();
    while (["+", "−"].includes(voir())) {
      const op = prendre();
      const w = produit();
      v = op === "+" ? v + w : v - w;
    }
    return v;
  }
  const v = somme();
  assert.equal(i, jetons.length, `tout est lu : « ${texte} »`);
  return v;
}

// Le calcul cherché de J'écris : le texte de son exemple (sinon la dernière
// étape), sa case remplacée par « ? », sans « = ? » au bout.
function cherche(apprends) {
  const ecris = apprends.textes ? apprends.textes[apprends.textes.length - 1] : apprends.ecris.etapes[apprends.ecris.etapes.length - 1].texte;
  // (Lot 6 : la fraction à deux cases, « □/□ », se cherche en « ? ».)
  return espaces(ecris).replace("□/□", "?").replace(/ = □( \S+)?$/, "").replace(/□/g, "?");
}

test("J'écris annonce le but : une ligne pour chaque niveau construit, en égalité, sans mot", () => {
  assert.equal(NIVEAUX.length, 132, "132 niveaux construits (lot 6 « programmes 2 » : F9-1, F6-2 ; lot « couverture » : A2-5 en plus, A8-3 et F5-3 réunis ; lot 7a : D5, D6, D7 ; lot 7b : D8, D9, M13 ; lot 7c : F4, F9, F11 ; lot 7d : M11, A9, C4, M9)");
  NIVEAUX.forEach(({niveau, cle}) => {
    const apprends = niveau.apprends;
    const consigne = apprends.ecris.consigne ? espaces(apprends.ecris.consigne) : "";
    if (SANS_LIGNE.has(cle)) {
      assert.equal(consigne, "", `${cle} : pas de ligne`);
      const premiere = espaces(apprends.ecris.etapes[0].texte).replace(/□/g, "?");
      assert.ok(apprends.ecris.etapes.length === 1 || premiere === `${cherche(apprends)}`, `${cle} : une seule étape, ou le calcul cherché est la 1re ligne`);
      return;
    }
    assert.ok(consigne, `${cle} : J'écris annonce le but`);
    assert.doesNotMatch(consigne, /coup/i, `${cle} : « couper » n'est pas le mot officiel`);
    if (GARDEES.has(cle)) return;
    assert.match(consigne, /=/, `${cle} : une égalité`);
    assert.doesNotMatch(consigne.replace(/moitié de|double de|\bde\b|\b(g|€|L)\b/g, ""), /[A-Za-zÀ-ÖØ-öø-ÿ]/, `${cle} : sans mot (« ${consigne} »)`);
    // Lot 3b (fractions égales) : la ligne est le calcul « × 4 en haut et en
    // bas » — « 3/5 = (3 × 4)/(5 × 4) » —, vraie, sans la réponse.
    if (/^F6-/.test(cle)) {
      const [gauche, droite] = consigne.split(" = ");
      assert.match(droite, /^\(\d+ [×÷] \d+\)\/\(\d+ [×÷] \d+\)$/, `${cle} : « ${consigne} »`);
      assert.ok(Math.abs(evaluer(gauche) - evaluer(droite)) < 1e-9, `${cle} : « ${consigne} » est vraie`);
      assert.ok(cherche(apprends).startsWith(gauche) || cherche(apprends).endsWith(gauche), `${cle} : la fraction donnée`);
      return;
    }
    // (Lot 7c : « 3 × 7/4 = ?/4 » cherché, « 3 × 7/4 = 7/4 + 7/4 + 7/4 » écrit.)
    if (apprends.textes) assert.ok(consigne.startsWith(cherche(apprends).replace(/ = \?\/\d+$/, "")), `${cle} : la ligne commence par le calcul cherché (« ${consigne} »)`);
    if (consigne.includes("?")) {
      // Un trou, un complément, un écart : le calcul cherché seul, avec son « ? ».
      assert.equal(consigne, apprends.textes ? cherche(apprends) + (cherche(apprends).includes("?") ? "" : " = ?") : consigne, `${cle} : un trou, le calcul seul`);
      return;
    }
    // Une égalité vraie, qui ne donne jamais la réponse.
    const membres = consigne.split(" = ");
    assert.ok(membres.length >= 2, cle);
    const valeur = evaluer(membres[0]);
    membres.forEach(m => assert.ok(Math.abs(evaluer(m) - valeur) < 1e-9, `${cle} : « ${m} » vaut ${valeur}`));
    const reponse = espaces(CORE.formaterNombre(apprends.ecris.reponse));
    assert.ok(!membres.slice(1).some(m => m.trim() === reponse), `${cle} : la réponse n'est pas écrite (« ${consigne} »)`);
  });
});

test("J'écris : les égalités d'exemple de la décision du 05/11", () => {
  const ligne = cle => espaces(CORE.niveauDe(cle).niveau.apprends.ecris.consigne);
  assert.equal(ligne("A10-2"), "236 + 7 = 236 + 4 + 3");
  assert.equal(ligne("A1-2"), "7 + 5 = 7 + 3 + 2");
  assert.equal(ligne("M8-1"), "6 × 14 = 10 × 6 + 4 × 6", "dans l’ordre des étapes et du dessin (10 × 6, puis 4 × 6)");
  assert.equal(ligne("A5-1"), "28 + 9 = 28 + 10 − 1");
  assert.equal(ligne("A2-3"), "24 + ? = 100");
  assert.equal(ligne("A8-1"), "81 − 76 = ?");
  // Lot 3a (décision 5) : la leçon et J'écris sur le double.
  assert.equal(ligne("M1-1"), "double de 14 = 10 + 10 + 4 + 4");
});

test("« À retenir » : la règle en phrase, puis le calcul seul (le bilan ne change pas)", () => {
  let coupes = 0;
  NIVEAUX.forEach(({niveau, cle}) => {
    const bilan = niveau.apprends.bilan;
    const deux = AIDES.bilanEnDeux(bilan);
    if (!deux) return;
    coupes += 1;
    if (!deux.phrase) {
      // Un bilan qui n'est qu'un calcul (M12) : le calcul seul, sur sa ligne.
      assert.equal(espaces(`${deux.calcul}.`), espaces(bilan), cle);
      assert.doesNotMatch(deux.calcul, /[A-Za-zÀ-ÖØ-öø-ÿ:]/, cle);
      return;
    }
    assert.ok(deux.phrase.endsWith("."), `${cle} : la phrase se termine par un point`);
    assert.doesNotMatch(deux.phrase, /=/, `${cle} : la phrase n'a pas de calcul`);
    assert.match(deux.calcul, /=/, `${cle} : un calcul`);
    assert.doesNotMatch(deux.calcul.replace(/moitié de|double de/g, ""), /[A-Za-zÀ-ÖØ-öø-ÿ.:]/, `${cle} : le calcul seul (« ${deux.calcul} »)`);
    assert.equal(espaces(`${deux.phrase.slice(0, -1)} : ${deux.calcul}.`), espaces(bilan), `${cle} : rien ne se perd`);
  });
  // Relecture 2 (08/11/2026) : + 3, A2-1, A2-3 et A2-4 écrivent leur calcul.
  // Lot 3a : À retenir reprend toujours le calcul montré (76 bilans).
  // Lot 7e-2 : × 4, × 8, × 5, × 50 écrivent leurs étapes une par ligne
  // (« 2 × 23 = 46. », puis « 23 × 4 = 2 × 46 = 92. ») : 5 de moins ici, ils
  // passent par les lignes (lot 3a).
  // Lot 7b : D8-2 et D8-3 (« Je double chaque morceau : double de 13,6 = … »).
  // Lot 7c : F11-1 et F11-2 (« 3 fois 5 quarts, c’est 15 quarts : 3 × 5/4 = … »).
  // Lot 7d : M9-1 et M9-2 (« 9, c’est 10 − 1 : 45 × 9 = … »).
  // Lot C2 : les cinq niveaux de moitiés (M1-2, M1-4, M1-6, D8-3, D8-5).
  // Lot C4a : A3-2, A3-3 et M12-1 écrivent deux égalités, une par ligne
  // (« 74 + 8 = 82. », puis « 746 + 80 = 826. ») : 3 de moins ici.
  assert.equal(coupes, 79, "les bilans qui finissent par « : calcul. », et ceux qui ne sont qu'un calcul");
  ["A3-2", "A3-3", "M12-1"].forEach(cle => {
    const lignes = espaces(CORE.niveauDe(cle).niveau.apprends.bilan).split(/(?<=\.)\s+(?=[A-ZÀ-ÖØ-Þ\d])/).map(t => AIDES.bilanEnDeux(t));
    assert.equal(lignes.length, 2, cle);
    assert.ok(lignes.every(Boolean) && lignes[0].phrase && !lignes[1].phrase, `${cle} : la phrase et son calcul, puis le calcul seul`);
  });
  ["M6-1", "M6-2", "M7-1", "M7-2", "M7-3"].forEach(cle => {
    const lignes = espaces(CORE.niveauDe(cle).niveau.apprends.bilan).split(/(?<=\.)\s+(?=[A-ZÀ-ÖØ-Þ\d])/).map(t => AIDES.bilanEnDeux(t));
    assert.ok(lignes.length >= 2 && lignes.every(Boolean), `${cle} : une ligne par étape`);
  });
  const deux = AIDES.bilanEnDeux(CORE.niveauDe("A10-2").niveau.apprends.bilan);
  assert.deepEqual([espaces(deux.phrase), espaces(deux.calcul)],
    ["Pour passer la dizaine, je vais d’abord à la dizaine, puis j’ajoute le reste.", "47 + 8 = 47 + 3 + 5 = 55"]);
  // Inchangés : pas de calcul au bout, un calcul déjà dans la phrase, une
  // phrase après le calcul.
  // (Lot 3a : A1-1, A2-2 et M1-3 écrivent maintenant leur calcul au bout.)
  ["M4-1", "M10-1", "C3-1"].forEach(cle => assert.equal(AIDES.bilanEnDeux(CORE.niveauDe(cle).niveau.apprends.bilan), null, cle));
});

test("« À retenir » : un calcul resté dans la phrase ne se coupe pas", () => {
  const soude = texte => AIDES.souderCalculs(texte).replace(/\u00a0/g, "_");
  assert.equal(soude("1/2 de 18 billes, c’est 18 ÷ 2 = 9 billes."), "1/2 de 18 billes, c’est 18_÷_2_=_9 billes.");
  assert.equal(soude("Chaque parenthèse d’abord : (2 × 9) − (3 + 4) = 18 − 7 = 11."), "Chaque parenthèse d’abord : (2_×_9)_−_(3_+_4)_=_18_−_7_=_11.");
  assert.equal(soude("+ 9, c’est + 10 puis − 1."), "+ 9, c’est + 10 puis − 1.", "un signe sans nombre devant : rien ne change");
  const page = readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  return page.then(html => assert.match(html, /AIDES\.ecrireTexte\(\$\("retenir-phrase"\), AIDES\.souderCalculs\(serie\.apprends\.bilan\)\)/));
});

test("Les perles : « d'un coup » seulement à partir de 2 perles", () => {
  let vus = 0;
  NIVEAUX.forEach(({cle}) => {
    for (let graine = 1; graine <= 30; graine += 1) {
      CORE.genererSerie(cle, {graine}).forEach(calcul => {
        const m = CORE.manipulationDe(calcul);
        if (!m || m.outil !== "perles") return;
        const consigne = espaces(m.consigne);
        assert.doesNotMatch(consigne, /\b1 perle d’un coup/, `${cle} : « ${consigne} » (${calcul.texte})`);
        if (/^(Finis|Vide) la rangée d’un coup, puis (pousse|retire) le reste\.$/.test(consigne)) assert.ok(Math.abs(m.gestes[0]) > 1, `${cle} : « ${consigne} » pour ${calcul.texte}`);
        if (/^(Finis|Vide) la rangée, puis/.test(consigne)) { vus += 1; assert.equal(Math.abs(m.gestes[0]), 1, `${cle} : ${calcul.texte}`); }
      });
    }
  });
  assert.ok(vus > 0, "des rangées finies d'une seule perle ont été vues");
  // « 80 − 1 », « 69 + 1 » : une seule perle.
  const uns = new Set();
  ["A10-1", "A10-2", "A11-1", "A11-2"].forEach(cle => {
    for (let graine = 1; graine <= 60; graine += 1) {
      CORE.genererSerie(cle, {graine}).forEach(calcul => {
        const m = CORE.manipulationDe(calcul);
        if (m && m.outil === "perles" && m.gestes.length === 1 && Math.abs(m.gestes[0]) === 1) uns.add(espaces(m.consigne));
      });
    }
  });
  assert.deepEqual([...uns].sort(), ["Pousse 1 perle.", "Retire 1 perle."]);
});

test("Je m'entraîne : l'outil ne donne pas la réponse (tous les outils)", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const aides = await lire("../outils/calcul_mental/defi_calcul_aides.js");
  // L'entraînement (et le rattrapage) demande l'outil sans réponse ; J'apprends non.
  const entraine = page.slice(page.indexOf("function montrerOutil("), page.indexOf("function renderQuestion("));
  assert.match(entraine, /sansReponse: true,/);
  const apprends = page.slice(page.indexOf("function renderTemps("), page.indexOf("function renderEtapes("));
  assert.doesNotMatch(apprends, /sansReponse/);
  // Chaque outil qui écrit sous lui connaît l'option.
  ["perles100", "glisseNombres", "toucherCalcul", "carreManip", "jetonsManip", "bandesManip", "billesManip"].forEach(nom => {
    const debut = aides.indexOf(`function ${nom}(zone, options)`);
    assert.ok(debut > 0, nom);
    assert.match(aides.slice(debut, debut + 400), /sansReponse = false\} = options;/, `${nom} : l'option sansReponse`);
  });
});

test("J'écris fini reste à l'écran ; « À retenir » sur iPhone ; boutons et pastilles", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const css = await lire("../outils/calcul_mental/defi_calcul.css");
  const tables = await lire("../outils/calcul_mental/defi_tables.html");
  // J'écris juste jusqu'au bout : « Suivant », pas de passage tout seul.
  const repondre = page.slice(page.indexOf("function repondreTemps("), page.indexOf("function secouerConsigne("));
  assert.match(repondre, /if \(ecris\) \{\n[^}]*\$\("validate"\)\.focus\?\.\(\{preventScroll: true\}\);\n\s*ajusterEchelle\(\);\n\s*return;\n\s*\}\n\s*\$\("validate"\)\.style\.visibility = "hidden";\n\s*scheduleAutoAdvance\(avancerTemps\);/);
  // Au téléphone, le travail se colle en haut, « Suivant » en bas.
  assert.match(css, /\.challenge-playing \.question\.ecrit-fini\.aide-image > \.dc-aide \{ margin-top: 0; \}/);
  // La hauteur visible de l'iPhone : 100svh après 100vh, pour le corps et le cadre.
  assert.match(css, /min-height: 100vh;\n  min-height: 100svh;/);
  assert.match(css, /\.panel \{ min-height: calc\(100vh - 96px\); min-height: calc\(100svh - 96px\);/);
  // Le calcul du bilan sur sa ligne, d'un seul tenant.
  assert.match(css, /\.dc-retenir \.dc-retenir-calcul \{ display: block; margin-top: \.3em; white-space: nowrap; \}/);
  // Les boutons choisis : le même bord que les autres, la sélection par une ombre.
  assert.doesNotMatch(css, /\.dc-(niveaux|paliers) button\.ici \{ border: 3px/);
  // Les pastilles (Défi calcul et Défi tables) : le chiffre centré.
  assert.match(css, /\.seance-fil li \{ display: inline-block; align-content: center; text-align: center; text-box: trim-both cap alphabetic; \}/);
  assert.match(tables, /\.seance-fil li \{ display: inline-block; align-content: center; text-align: center; text-box: trim-both cap alphabetic; \}/);
  // Une seule progression pendant J'apprends (choix du 06/11) : le nom du
  // temps au-dessus de la barre, plus de 2e ligne de pastilles.
  const fil = page.slice(page.indexOf("function renderFilApprends("), page.indexOf("function creerManip("));
  assert.doesNotMatch(fil, /createElement\("(ol|li)"\)/);
  assert.match(fil, /fil\.replaceChildren\(titre, nom\);/);
  // J'apprends sur ordinateur : une taille de cadre pour toute la leçon.
  assert.match(page, /mesurerLecon\(\);\n\s*if \(!state\.lecon\) renderTemps\(\);/);
});
