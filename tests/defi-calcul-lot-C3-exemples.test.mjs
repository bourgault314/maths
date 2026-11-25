// Défi calcul, lot C3 « les exemples résolus, les leçons qui montent »
// (22/11/2026, choix de Gwenaël du 20/11 après l'audit de cohérence, planche
// validée le 22/11) :
//  - une écriture que la leçon n'a jamais montrée arrive avec un exemple
//    résolu à sa première apparition (le calcul fait, son dessin, une phrase
//    de méthode), puis « À toi » et un calcul pareil ; il ne compte pas ;
//    jamais au test ; dans Mes calculs du jour, au premier retour d'une
//    compétence entrée par un test (sans J'apprends) ;
//  - les leçons dont l'exemple était parmi les plus durs prennent un calcul
//    moyen, J'écris au moins aussi dur ; « Fraction et quotient » dit que la
//    fraction est une division ;
//  - « Moitiés : centièmes » : le piège 8,10 dans les 9 premiers calculs de
//    chaque série (constat G4 de Codex sur le lot C2).

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const espaces = t => String(t).replace(/[  ]/g, " ");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");

// Les calculs d'un niveau : de grands tirages, la série rangée et sa réserve.
const vivier = (cle, graines = 8) => {
  const vus = new Map();
  const t = CORE.niveauDe(cle);
  for (let g = 1; g <= graines; g += 1) {
    t.niveau.composer(CORE.mulberry32(g * 101), 120, []).forEach(c => vus.set(c.texte, c));
    const s = CORE.genererSerie(cle, {graine: g * 13, total: 25});
    [...s, ...(s.reserve || [])].forEach(c => vus.set(c.texte, c));
    CORE.genererSerie(cle, {graine: g * 17, total: 25, ordonne: false}).forEach(c => vus.set(c.texte, c));
  }
  return [...vus.values()];
};
const lecon = cle => CORE.niveauDe(cle).niveau.apprends.calculs;

test("chaque écriture jamais montrée a son exemple résolu, avec une phrase faite sur ses nombres", () => {
  let ecritures = 0;
  CORE.ORDRE.forEach(cle => {
    const montrees = new Set([lecon(cle).montre.forme, lecon(cle).ecris.forme]);
    const parForme = new Map();
    vivier(cle, 4).forEach(c => { if (!parForme.has(c.forme)) parForme.set(c.forme, []); parForme.get(c.forme).push(c); });
    parForme.forEach((calculs, forme) => {
      const demande = !montrees.has(forme) && !CORE.ECRITURES_MIROIR.has(forme) && !(cle === "A1-1" && forme === "somme");
      calculs.forEach(c => assert.equal(CORE.demandeExemple(c, cle), demande, `${cle} ${c.texte}`));
      if (!demande) {
        calculs.forEach(c => assert.equal(CORE.methodeExemple(c, cle), null, `${cle} ${c.texte} : pas d'exemple`));
        return;
      }
      ecritures += 1;
      calculs.forEach(c => {
        const phrase = CORE.methodeExemple(c, cle);
        assert.ok(phrase, `${cle} ${c.texte} : une phrase`);
        assert.doesNotMatch(phrase, /undefined|NaN|null|\$\{|dernier chiffre/, `${cle} ${c.texte} : ${phrase}`);
        // La phrase est faite sur le calcul : elle dit sa réponse.
        assert.ok(espaces(phrase).includes(espaces(CORE.formaterNombre(c.reponse))), `${cle} ${c.texte} : ${phrase}`);
        assert.match(phrase, /\.$/, `${cle} : une phrase finie`);
        // Aucun mot genré, rien d'un autre calcul.
        assert.doesNotMatch(espaces(phrase), /\b(il|elle|lui|celui|celle|venu|venue)\b(?! (manque|reste|faut|y a))/, `${cle} : ${phrase}`);
      });
    });
  });
  // Les 65 compétences de l'audit (nonens) : 103 écritures.
  assert.ok(ecritures >= 100, `${ecritures} écritures`);
});

test("les phrases de la planche validée, mot pour mot", () => {
  const trouver = (cle, texte) => vivier(cle).find(c => espaces(c.texte) === texte);
  assert.equal(espaces(CORE.methodeExemple(trouver("M1-1", "double de □ = 12"), "M1-1")),
    "12, c’est 10 et 2. Je coupe chaque morceau en deux : 5 et 1. 5 + 1 = 6 : le double de 6, c’est 12.");
  assert.equal(espaces(CORE.methodeExemple(trouver("F8-1", "7/12 − 5/12 = □/12"), "F8-1")),
    "Je retire des douzièmes : 7 douzièmes − 5 douzièmes = 2 douzièmes.");
  const egalite = vivier("C3-1").find(c => c.forme === "retire" && /^\d \d{2}6 − □ = \d \d{2}2?6$/.test(espaces(c.texte)) && c.reponse === 10);
  assert.match(espaces(CORE.methodeExemple(egalite, "C3-1")), /^De .+, seul le chiffre des dizaines change : \d dizaines − \d dizaines? = 1 dizaine\. On a retiré 10\.$/);
  // Compter en dizaines, en centaines (choix 3 de Gwenaël, tri C4-0).
  const dizaines = vivier("A3-1").find(c => c.forme === "difference" && espaces(c.texte) === "92 − 40 = □");
  if (dizaines) assert.equal(espaces(CORE.methodeExemple(dizaines, "A3-1")), "92, c’est 9 dizaines et 2 unités. 9 dizaines − 4 dizaines = 5 dizaines : 92 − 40 = 52.");
  // F11-2 : la fraction, c'est une division.
  assert.equal(espaces(CORE.methodeExemple(trouver("F11-2", "6/3 = □"), "F11-2")), "La fraction, c’est une division : 6/3 = 6 ÷ 3 = 2.");
});

test("le calcul de l'exemple : la même écriture, un cran plus facile que « À toi », jamais le même", () => {
  let essais = 0, plusFacile = 0, memeMotif = 0;
  CORE.ORDRE.forEach(cle => {
    for (let g = 1; g <= 6; g += 1) {
      const s = CORE.genererSerie(cle, {graine: g * 7919, total: 25});
      const vus = new Set();
      s.forEach((c, i) => {
        if (!CORE.methodeExemple(c, cle) || vus.has(c.forme)) return;
        vus.add(c.forme);
        const exclure = s.slice(0, i + 1).map(x => x.texte);
        const ex = CORE.exempleAvant(c, {candidats: [...(s.reserve || []), ...s.slice(i + 1)], exclure, graine: CORE.graineDe(c.cle)});
        assert.ok(ex, `${cle} ${c.texte} : un exemple`);
        assert.equal(ex.forme, c.forme, `${cle} : la même écriture`);
        assert.notEqual(ex.texte, c.texte, `${cle} : jamais le même`);
        assert.ok(!exclure.includes(ex.texte), `${cle} : jamais un calcul déjà joué`);
        assert.ok(CORE.methodeExemple(ex, cle), `${cle} ${ex.texte} : sa phrase`);
        essais += 1;
        // Un cran plus facile dès qu'il en existe un (la réserve, la suite,
        // le tirage de secours) ; sinon le plus facile qui n'est pas lui (le
        // premier calcul d'une écriture est souvent son plus facile : lot C1).
        // Les mêmes signes aux mêmes places dès qu'un calcul les a (« 3/4 +
        // □/4 = 1 » n'a pas pour exemple « 3/4 − □/4 = 1/2 ») ; parmi eux,
        // un plus facile dès qu'il en existe un.
        const tirage = CORE.niveauDe(cle).niveau.composer(CORE.mulberry32(CORE.graineDe(c.cle) >>> 0), 120, []);
        const squelette = x => espaces(x.texte).replace(/\d(?:[\d, ]*\d)?/g, "n");
        const offerts = [...(s.reserve || []), ...s.slice(i + 1), ...tirage].filter(x => x.forme === c.forme && x.texte !== c.texte && !exclure.includes(x.texte) && CORE.methodeExemple(x, cle));
        const pareils = offerts.filter(x => squelette(x) === squelette(c));
        if (pareils.length) assert.equal(squelette(ex), squelette(c), `${cle} : ${ex.texte} pour ${c.texte}`);
        const existe = (pareils.length ? pareils : offerts).some(x => CORE.difficulte(x) < CORE.difficulte(c));
        if (existe) assert.ok(CORE.difficulte(ex) < CORE.difficulte(c), `${cle} : ${ex.texte} avant ${c.texte}`);
        if (CORE.difficulte(ex) < CORE.difficulte(c)) plusFacile += 1;
        if (ex.texte.replace(/[1-9]/g, "x") === c.texte.replace(/[1-9]/g, "x")) memeMotif += 1;
        // Toujours le même pour le même calcul (la graine).
        assert.equal(CORE.exempleAvant(c, {candidats: [...(s.reserve || []), ...s.slice(i + 1)], exclure, graine: CORE.graineDe(c.cle)}).texte, ex.texte);
      });
    }
  });
  // Jamais lui-même, même offert parmi les candidats et rien d'exclu (le
  // plus facile de son écriture : l'exemple est un autre calcul).
  ["M1-1", "A3-1", "F8-1", "C3-1", "D8-5", "C4-1"].forEach(cle => {
    const v = vivier(cle, 4);
    const formes = [...new Set(v.filter(c => CORE.demandeExemple(c, cle)).map(c => c.forme))];
    formes.forEach(forme => {
      const memes = v.filter(c => c.forme === forme).sort((x, y) => CORE.difficulte(x) - CORE.difficulte(y));
      [memes[0], memes[memes.length - 1]].forEach(c => {
        const ex = CORE.exempleAvant(c, {candidats: [c, Object.assign({}, c), ...memes], exclure: [], graine: 3});
        assert.ok(ex && ex.texte !== c.texte, `${cle} ${c.texte} : jamais lui-même`);
      });
    });
  });
  // Plus facile dès qu'il y en a un ; le même dessin le plus souvent.
  assert.ok(plusFacile > 0, `plus facile : ${plusFacile} sur ${essais}`);
  assert.ok(memeMotif / essais > 0.25, `le même dessin : ${memeMotif} sur ${essais}`);
});

test("Mes calculs du jour : l'exemple au premier retour d'une compétence entrée par un test, jamais après J'apprends", () => {
  const aujourdhui = "2026-11-23";
  const avant = n => P.ajouterJours(aujourdhui, -n);
  const retour = (p, juste, jour) => P.appliquerRetour(p, {module: "C3", niveau: 1, juste, ms: 3000, type: "P", cause: 0}, {aujourdhui: jour}).parcours;
  // Le test : la marche la plus haute (boîte 3), revient 3 jours après.
  let p = P.appliquerTest(P.creerParcours(), {module: "C3", marche: 1, niveaux: [{niveau: 1, justes: 3, total: 3}]}, {aujourdhui: avant(3)}).parcours;
  assert.equal(P.premierRetourSansLecon(p, "C3", 1), true);
  // Revenu une fois (juste ou faux) : plus d'exemple.
  assert.equal(P.premierRetourSansLecon(retour(p, true, aujourdhui), "C3", 1), false);
  assert.equal(P.premierRetourSansLecon(retour(p, false, aujourdhui), "C3", 1), false);
  // Les marches en dessous (boîte 4, sues le jour même) : 7 jours après.
  p = P.appliquerTest(P.creerParcours(), {module: "C3", marche: 2, niveaux: [{niveau: 1, justes: 3, total: 3}, {niveau: 2, justes: 3, total: 3}]}, {aujourdhui: avant(7)}).parcours;
  // (La marche la plus haute, revenue en retard, n'est pas encore revenue non plus.)
  assert.deepEqual([P.premierRetourSansLecon(p, "C3", 1), P.premierRetourSansLecon(p, "C3", 2)], [true, true]);
  // J'apprends : boîte 2 ; puis boîte 3 après un retour — jamais.
  const reponses = Array.from({length: 9}, () => ({juste: true, outil: "aucun"}));
  let q = P.appliquerSerie(P.creerParcours(), {module: "C3", niveau: 1, genre: "apprends", reponses, causes: {}}, {aujourdhui: avant(4)}).parcours;
  assert.equal(P.premierRetourSansLecon(q, "C3", 1), false);
  q = retour(q, true, avant(3));
  assert.deepEqual([q.modules.C3.b[0], P.premierRetourSansLecon(q, "C3", 1)], [3, false]);
  // Rien d'entré, une progression vide ou abîmée : non.
  assert.equal(P.premierRetourSansLecon(P.creerParcours(), "C3", 1), false);
  assert.equal(P.premierRetourSansLecon(null, "C3", 1), false);
  assert.equal(P.premierRetourSansLecon(p, "ZZ", 1), false);
  // Le test de palier : sues le jour même, revenues 7 à 13 jours après.
  const carte = CORE.carte();
  const palier = P.appliquerTestPalier(P.creerParcours(), {palier: 1, total: 12, justes: 12}, {aujourdhui: avant(10), carte, palier: 4});
  const entrees = Object.entries(palier.parcours.modules).flatMap(([id, l]) => l.b.map((b, i) => ({id, n: i + 1, b, e: l.e[i]})).filter(x => x.b));
  if (entrees.length) {
    const dues = entrees.filter(x => x.e === aujourdhui);
    dues.forEach(x => assert.equal(P.premierRetourSansLecon(palier.parcours, x.id, x.n), true, `${x.id}-${x.n}`));
  }
  // Aucune donnée nouvelle : la progression garde sa version et ses clés.
  assert.equal(P.VERSION, 11);
});

test("la page : l'exemple résolu passe avant « À toi », ne compte pas, jamais au test ; « À toi » garde sa taille", () => {
  const debut = PAGE.indexOf("function poserExemple(serie)");
  const fin = PAGE.indexOf("function renderExemple(serie, question)");
  const pose = PAGE.slice(debut, fin);
  assert.ok(debut > 0 && fin > debut);
  // À l'entraînement (J'apprends, Je m'entraîne, Je m'entraîne encore) et
  // dans Mes calculs du jour seulement : jamais au test, jamais au test de palier.
  assert.match(pose, /if \(!jour && !estEntrainement\(serie\)\) return false;/);
  assert.match(PAGE, /const estEntrainement = serie => serie\.genre === "entraine" \|\| serie\.genre === "rattrape" \|\| \(serie\.genre === "apprends" && !serie\.temps\);/);
  // Une fois par écriture et par série, jamais deux de suite, jamais le
  // 2e calcul d'un faux de Mes calculs du jour.
  assert.match(pose, /serie\.exemplesVus\.includes\(ecriture\)/);
  assert.match(pose, /if \(precedente && precedente\.exemple\) return false;/);
  assert.match(pose, /question\.deuxieme/);
  assert.match(pose, /PARCOURS\.premierRetourSansLecon\(parcours, calcul\.module, calcul\.niveau\)/);
  // L'exemple ne note rien : « À toi » passe à la suite sans réponse.
  const avancer = PAGE.slice(PAGE.indexOf("      function avancerSerie() {"), PAGE.indexOf("      function allongerSerie(serie) {"));
  assert.match(avancer, /serie\.questions\[serie\.index\]\.exemple\) \{\s+serie\.index \+= 1;\s+renderQuestion\(\);\s+return;/);
  const rendu = PAGE.slice(fin, PAGE.indexOf("// Lot 3b : le texte de la sorte nouvelle"));
  assert.doesNotMatch(rendu, /reponses\.push|noterRetour|appliquerRetour/);
  assert.match(rendu, /"Un exemple"/);
  assert.match(rendu, /"À toi\\u00a0→"/);
  assert.match(rendu, /dc-methode/);
  // La feuille : le pavé et « Je ne sais pas » gardent leur place.
  const css = lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /\.question\.dc-exemple \.keypad, \.question\.dc-exemple #skip, \.question\.dc-exemple #touches \{ visibility: hidden; \}/);
  assert.match(css, /\.dc-bulle\.dc-methode \{ color: var\(--ink\); background: #eef5fb; font-weight: 750;/);
  // « À toi » : l'échelle de son exemple.
  assert.match(PAGE, /const exemple = echelleDeLExemple\(\);/);
  // Le dessin et le bouton ne bougent pas : « À toi » garde la place de la
  // phrase et l'échelle de l'exemple au pixel près ; le pavé ne laisse sa
  // place que si c'est la phrase qui déborde, et le bouton reste en bas.
  assert.match(rendu, /if \(deborde\(\) > sansPhrase \+ 1\) carte\.classList\.add\("sans-pave"\);/);
  assert.match(rendu, /question\.echelle\.bulle = parseFloat\(getComputedStyle\(bulle\.parentElement\)\.height\)/);
  assert.match(PAGE, /zoneBulle\.style\.minHeight = `\$\{exemple\.echelle\.bulle\}px`;/);
  assert.match(PAGE, /if \(exemple !== null && \(exemple < z \|\| memeCadre\)\) \{/);
  assert.match(css, /\.question\.dc-exemple\.sans-pave > \.actions \{ margin-top: auto; margin-bottom: 0; \}/);
  // Correctif : à la plus petite échelle, le dessin rapetisse (56 px au
  // moins), jamais le calcul ni le pavé ; « À toi » garde la hauteur du
  // cadre de son exemple, et la place du dessin quand il n'en a pas.
  assert.match(PAGE, /const plancher = Math\.min\(1, ECHELLE\.imageTelephone \/ haut\);/);
  assert.match(PAGE, /for \(let k = 0\.98; k >= plancher - 1e-9 && deborde\(\); k -= 0\.02\) \{/);
  assert.match(PAGE, /\$\("question-card"\)\.classList\.add\("a-toi-garde"\);/);
  assert.match(PAGE, /if \(garde\) \$\("question-card"\)\.classList\.add\("aide-image"\);/);
  assert.match(PAGE, /grandirDessin\(\);\n        alignerPaveAToi\(\);/);
  // L'annonce : « Nouveau : … » sur l'exemple, « À toi : … » ensuite.
  assert.match(pose, /question\.annonceAToi = String\(annonce\)\.replace\(\/\^Nouveau\/, "À toi"\);/);
  // Les adresses de cache, les copies pour la page prof, le manifeste.
  assert.match(PAGE, /defi_calcul_core\.js\?v=20261125-2/);
  assert.match(PAGE, /defi_calcul_mon_parcours\.js\?v=20261122-1/);
  assert.match(PAGE, /defi_calcul\.css\?v=20261122-1/);
  assert.equal(lire("../outils/calcul_mental/defi_calcul_core.js"), lire("../_serveur/public/prof/defi_calcul_core.js"));
  assert.equal(lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"), lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"));
  assert.match(lire("../_serveur/public/VERSION"), /^lot defi-calcul-lot-C3-exemples$|^lot anzan-bareme-lot-1$|^lot defi-calcul-lot-C4a$|^lot defi-calcul-lot-C4b$|^lot defi-calcul-lot-C4c$/m);
});

test("les leçons : un exemple moyen, J'écris au moins aussi dur ; « Fraction et quotient » dit la division", () => {
  // Les leçons changées (l'exemple était dans le tiers du haut, ou J'écris
  // retombait sous lui) : l'exemple est un calcul moyen.
  const changees = {"M1-1": "double de 12 = □", "M1-3": "double de 38 = □", "M8-2": "28 × 7 = □", "F6-1": "1/2 = □/8", "C4-2": "6 + (2 × □) = 19"};
  Object.entries(changees).forEach(([cle, texte]) => {
    const m = lecon(cle).montre;
    assert.equal(espaces(m.texte), texte, cle);
    const r = CORE.rangDansEcriture(m, cle);
    assert.ok(r >= 0.3 && r < 2 / 3, `${cle} : ${texte} au rang ${r}`);
  });
  // Partout, dans la même écriture : J'écris jamais plus facile que
  // l'exemple (25 tirages par niveau ; d'une écriture à l'autre, c'est la
  // mesure du lot C1 qui compare).
  CORE.ORDRE.forEach(cle => {
    const m = lecon(cle).montre;
    for (let g = 1; g <= 25; g += 1) {
      const e = CORE.ecrisTire(cle, {graine: g * 31337});
      if (!e || e.calcul.forme !== m.forme) continue;
      assert.ok(CORE.difficulte(e.calcul) >= CORE.difficulte(m), `${cle} : J'écris ${e.calcul.texte} sous l'exemple ${m.texte}`);
    }
  });
  // À retenir reprend le calcul de « On te montre ».
  assert.match(espaces(CORE.niveauDe("M1-1").niveau.apprends.bilan), /double de 12 = 12 \+ 12 = 24\.$/);
  assert.match(espaces(CORE.niveauDe("M1-3").niveau.apprends.bilan), /double de 38 = 2 × 30 \+ 2 × 8 = 76\.$/);
  assert.match(espaces(CORE.niveauDe("M8-2").niveau.apprends.bilan), /28 × 7 = 20 × 7 \+ 8 × 7 = 140 \+ 56 = 196\.$/);
  assert.match(espaces(CORE.niveauDe("F6-1").niveau.apprends.bilan), /1\/2 = 4\/8/);
  assert.match(espaces(CORE.niveauDe("C4-2").niveau.apprends.bilan), /19 − 6 = 13\. 13 ÷ 2 = 6,5\. 6 \+ \(2 × 6,5\) = 19\.$/);
  // C4-2 : un calcul de leçon se range avec ceux du niveau 2 (avant, avec
  // ceux du niveau 1 : il passait pour le plus dur).
  const c42 = lecon("C4-2").montre;
  assert.equal(CORE.difficulte(c42), CORE.difficulte(Object.assign({}, c42, {niveau: 2})));
  const c41 = lecon("C4-1").montre;
  assert.equal(CORE.difficulte(c41), CORE.difficulte(Object.assign({}, c41, {niveau: 1})));
  // « Fraction et quotient » : la fraction, c'est une division.
  const autre = CORE.niveauDe("F11-2").niveau.apprends.autre;
  assert.deepEqual([espaces(autre.phrase), autre.calcul], ["La fraction, c’est une division :", "6/3 = 6 ÷ 3 = 2"]);
});

test("« Moitiés : centièmes » : le piège 8,10 dans les 9 premiers calculs, sur 100 graines (constat G4)", () => {
  const D8 = CORE.moduleDe("D8");
  const exclure = CORE.niveauDe("D8-5").niveau.apprends.textes;
  for (let graine = 1; graine <= 100; graine += 1) {
    [null, 2, 0].forEach(aides => {
      const s = CORE.genererSerie("D8-5", {graine, genre: "entraine", total: 25, exclure, aides});
      const i = s.findIndex(c => D8.dansLaFenetre(c));
      assert.ok(i >= 0 && i < 9, `graine ${graine}, aides ${aides} : ${s.slice(0, 9).map(c => c.texte).join(" | ")}`);
      // Rien ne redescend dans son écriture parmi les 9 premiers.
      const plusDur = new Map();
      s.slice(0, s.fenetre).forEach(c => {
        assert.ok(CORE.difficulte(c) >= (plusDur.get(c.forme) ?? -Infinity), `graine ${graine} : ${c.texte} redescend`);
        plusDur.set(c.forme, CORE.difficulte(c));
      });
    });
  }
  // Ailleurs, rien ne change : aucune autre fiche ne le demande.
  CORE.MODULES.filter(m => m.id !== "D8").forEach(m => assert.equal(m.dansLaFenetre, undefined, m.id));
});

test("le dessin révélé de chaque exemple se dessine : aucune case de largeur négative (« 41 − 34 = □ ÷ 9 »)", () => {
  const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
  CORE.ORDRE.forEach(cle => vivier(cle, 3).filter(c => CORE.demandeExemple(c, cle)).forEach(c => {
    const image = CORE.imageDe(c);
    if (!image) return;
    assert.doesNotMatch(AIDES.dessinerImage(image), /(width|height)="-/, `${cle} ${c.texte}`);
  }));
  const neuf = vivier("C3-1").find(c => c.forme === "difference-quotient" && c.donnees.k === 9);
  assert.ok(neuf);
  assert.doesNotMatch(AIDES.dessinerImage(CORE.imageDe(neuf)), /width="-/);
  assert.match(lire("../outils/calcul_mental/defi_calcul_modules.html"), /defi_calcul_aides\.js\?v=20261125-1/);
});
