// Défi calcul, lot 7-0 « Retouches du moule » (14/11/2026, trois choix de
// Gwenaël en jouant, options recommandées) :
//  1. le dessin à étapes — avec la droite à plusieurs sauts, l'élève écrit
//     d'abord où il arrive après le premier saut, puis le résultat ;
//  2. jamais bloqué à l'outil — après 3 gestes refusés, l'outil montre le
//     geste et l'élève le refait (ici : la règle du compte ; les outils
//     eux-mêmes sont joués au navigateur, tests/defi-calcul-lot-7-0-ecrans.cjs) ;
//  3. le test « Tu connais déjà ? » s'arrête au palier en cours ; les marches
//     d'un palier plus haut d'un module commencé ont leur test.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

const CARTE = CORE.carte();
const J = "2026-11-16";
const NIVEAUX = CORE.ORDRE.filter(cle => {
  const trouve = CORE.niveauDe(cle);
  return trouve && trouve.niveau.apprends;
});
const blanc = texte => String(texte).replace(/[  ]/g, " ");
const valeur = texte => Number(blanc(texte).replace(/ /g, "").replace(",", "."));
const multiSauts = image => Boolean(image && image.outil === "droite-sauts" && image.sauts.length >= 2);

// --------------------------------------------------------- 1. le dessin à étapes

// « 59 + 1 = □ » → [59, "+", 1] ; « 436 + □ = 440 » → [436, "+", "□", 440].
function premiereEtapeVraie(etape) {
  const t = blanc(etape.texte);
  let m = /^([\d ]+) ([+−]) ([\d ]+) = □$/.exec(t);
  if (m) return Math.abs((m[2] === "+" ? valeur(m[1]) + valeur(m[3]) : valeur(m[1]) - valeur(m[3])) - etape.reponse) < 1e-9;
  m = /^([\d ]+) \+ □ = ([\d ]+)$/.exec(t);
  if (m) return Math.abs(valeur(m[2]) - valeur(m[1]) - etape.reponse) < 1e-9;
  return false;
}

test("le dessin à étapes : chaque droite à plusieurs sauts, sur des milliers de calculs tirés", () => {
  let vus = 0;
  const niveaux = new Set();
  NIVEAUX.forEach(cle => {
    for (let graine = 1; graine <= 12; graine += 1) {
      CORE.genererSerie(cle, {graine, genre: "entraine", total: 25, exclure: []}).forEach(calcul => {
        const aide = CORE.aideDe(calcul);
        const d = CORE.dessinAEtapesDe(calcul);
        if (!multiSauts(aide)) { assert.equal(d, null, `${cle} ${calcul.texte} : pas de droite à sauts, pas d'étapes`); return; }
        vus += 1;
        niveaux.add(cle);
        assert.ok(d, `${cle} ${calcul.texte}`);
        assert.equal(d.etapes.length, 2, `${cle} ${calcul.texte} : la première case, puis le résultat`);
        assert.equal(d.etapes[1].texte, calcul.texte, "le résultat : le calcul lui-même");
        assert.equal(d.etapes[1].reponse, calcul.reponse);
        assert.ok(premiereEtapeVraie(d.etapes[0]), `${cle} ${d.etapes[0].texte} = ${d.etapes[0].reponse}`);
        assert.notEqual(d.etapes[0].reponse, calcul.reponse, "la première case n'est pas la réponse");
        // Les dessins : rien, la première case, tout ; même départ, mêmes sauts.
        assert.equal(d.dessins.length, 3);
        assert.deepEqual(d.dessins[0], aide, "au début, l'aide telle qu'avant");
        d.dessins.forEach(dessin => {
          assert.equal(dessin.depart, aide.depart);
          assert.deepEqual(dessin.sauts.map(s => s.val), aide.sauts.map(s => s.val));
        });
        const trou = aide.sauts.some(s => s.masque);
        if (trou) {
          assert.ok(d.dessins[0].sauts[0].masque, "le premier saut est « + ? » au début");
          assert.ok(!d.dessins[1].sauts[0].masque, "il s'écrit après la première case");
          assert.ok(d.dessins[1].sauts.slice(1).every(s => s.masque), "les autres restent « + ? »");
          assert.ok(d.dessins[2].sauts.every(s => !s.masque));
        } else {
          assert.ok(d.dessins[0].inconnues.includes(1), "l'arrivée du premier saut est « ? » au début");
          assert.ok(!d.dessins[1].inconnues.includes(1) && d.dessins[1].acquis.includes(1), "elle s'écrit en vert après la première case");
          assert.ok(d.dessins[1].inconnues.includes(aide.sauts.length), "le résultat reste « ? »");
          assert.deepEqual(d.dessins[2].inconnues, []);
          assert.ok(!d.premier.acquis.length, "donnée après deux faux : sans vert");
        }
        // Le dessin, une fois dessiné, ne change pas de taille d'une étape à l'autre.
        const tailles = d.dessins.map(dessin => /viewBox="([^"]+)"/.exec(AIDES.dessinerImage(dessin))[1]);
        assert.equal(new Set(tailles).size, 1, `${cle} ${calcul.texte} : même taille`);
      });
    }
  });
  assert.ok(vus > 5000, `${vus} calculs`);
  // L'inventaire de la notice : 29 niveaux ont un dessin à plusieurs sauts.
  assert.equal(niveaux.size, 29, [...niveaux].join(" "));
});

test("« On te montre » sur la droite à plusieurs sauts (sans outil à manipuler) : à étapes, comme les doubles", () => {
  const avec = NIVEAUX.filter(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    return !a.manipule && multiSauts(a.represente.image);
  });
  assert.deepEqual(avec, ["A3-2", "A10-3", "A11-3", "A4-3", "A2-4", "A3-3", "A7-3", "A2-5", "A4-4", "A8-2", "A5-4", "A6-4"]);
  avec.forEach(cle => {
    const r = CORE.niveauDe(cle).niveau.apprends.represente;
    assert.equal(r.etapes.length, 2, cle);
    assert.equal(r.etapes[1].reponse, r.reponse, cle);
    assert.equal(r.dessins.length, 3, cle);
    assert.ok(r.consigne, `${cle} : la consigne reste au-dessus du dessin`);
  });
  const a = CORE.niveauDe("A2-5").niveau.apprends.represente;
  assert.deepEqual(a.etapes.map(e => [blanc(e.texte), e.reponse]), [["368 + □ = 370", 2], ["368 + □ = 1 000", 632]]);
  const b = CORE.niveauDe("A10-3").niveau.apprends.represente;
  assert.deepEqual(b.etapes.map(e => [blanc(e.texte), e.reponse]), [["196 + 4 = □", 200], ["196 + 7 = □", 203]]);
});

// --------------------------------------------------------- 2. jamais bloqué

test("jamais bloqué : au 3e geste refusé de suite, l'outil montre le geste ; le geste réussi l'éteint", () => {
  assert.equal(AIDES.MONTRER_APRES, 3);
  const suivi = AIDES.suiviRefus();
  assert.equal(suivi.refuse(), false);
  assert.equal(suivi.refuse(), false);
  assert.equal(suivi.montre, false);
  assert.equal(suivi.refuse(), true, "le 3e refus allume le geste");
  assert.equal(suivi.montre, true);
  assert.equal(suivi.refuse(), false, "déjà montré : il reste allumé");
  assert.equal(suivi.montre, true);
  suivi.accepte();
  assert.equal(suivi.montre, false);
  assert.equal(suivi.refus, 0, "le compte repart à zéro pour le geste suivant");
});

test("jamais bloqué : la page fait compter « Suivant » avant le geste, dans On te montre comme avec l'outil", async () => {
  const {readFile} = await import("node:fs/promises");
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /else if \(state\.manip && typeof state\.manip\.refuserSansGeste === "function"\) state\.manip\.refuserSansGeste\(\);/);
  assert.match(page, /if \(state\.manip && typeof state\.manip\.refuserSansGeste === "function"\) state\.manip\.refuserSansGeste\(\);\n          return;/);
  const aides = await readFile(new URL("../outils/calcul_mental/defi_calcul_aides.js", import.meta.url), "utf8");
  ["perles", "glisse", "carre", "jetons", "bandes", "billes"].forEach(outil => {
    assert.match(aides, new RegExp(`outil: "${outil}",[\\s\\S]{0,120}refuserSansGeste\\(\\)`), outil);
  });
  assert.match(aides, /return \{\n      refuserSansGeste\(\) \{ if \(!etat\.fini\) refuser\(\); \},\n      get montre\(\) \{ return suivi\.montre; \},\n      outil: "toucher"/);
});

// --------------------------------------------------------- 3. le test au palier en cours

// Le moteur de la séance, réduit à l'avancée : test (module intact, ou
// marches d'un palier plus haut d'un module commencé) ou J'apprends.
function prochaine(p, palier) {
  const courante = P.competenceCourante(p, CARTE, palier);
  if (!courante) return null;
  const ligne = p.modules[courante.module] || {b: [], f: [], a: []};
  const intact = !p.modules[courante.module] || P.estIntact(ligne);
  return Object.assign({type: intact || P.testDeReprise(p, CARTE, courante) ? "test" : "apprends"}, courante);
}
// Joue un test : `rate(niveau)` dit si la marche est ratée.
function jouerTest(p, id, palier, rate = () => false) {
  const bornes = P.marchesDuTest(p, CARTE, id, palier);
  assert.ok(bornes, `${id} : des marches à jouer`);
  const niveaux = [];
  let marche = 0;
  for (let n = bornes.de; n <= bornes.jusqua; n += 1) {
    if (rate(n)) { niveaux.push({niveau: n, justes: 1, total: 3}); break; }
    niveaux.push({niveau: n, justes: 3, total: 3});
    marche = n;
  }
  const suivi = P.appliquerTest(p, {module: id, marche, niveaux}, {aujourdhui: J, carte: CARTE, palier});
  return {p: suivi.parcours, bornes, suivi};
}
function apprendre(p, id, n, palier) {
  const reponses = Array.from({length: 6}, () => ({juste: true, outil: "aucun"}));
  return P.appliquerSerie(p, {module: id, niveau: n, genre: "apprends", reponses}, {aujourdhui: J, carte: CARTE, palier}).parcours;
}
const palierDe = (id, n) => P.palierDe(CARTE, id, n);
const construits = () => P.parcoursConstruit(CARTE);
const entre = (p, id, n) => Boolean(p.modules[id] && p.modules[id].b[n - 1]);

// Joue tout le parcours ; `rate(id, n)` : la marche ratée au test. Vérifie à
// chaque pas qu'aucune compétence d'un palier plus haut n'entre ni ne
// commence avant que le palier en cours soit fini. Rend le journal.
function jouerTout({palier = 4, rate = () => false, p = P.creerParcours(), pas = 400} = {}) {
  const journal = [];
  for (let i = 0; i < pas; i += 1) {
    const etape = prochaine(p, palier);
    if (!etape) break;
    const enCours = palierDe(etape.module, etape.niveau);
    if (etape.type === "test") {
      const joue = jouerTest(p, etape.module, palier, n => rate(etape.module, n));
      for (let n = joue.bornes.de; n <= joue.bornes.jusqua; n += 1) assert.equal(palierDe(etape.module, n), enCours, `${etape.module}-${n} : le test reste au palier ${enCours}`);
      p = joue.p;
      journal.push({type: "test", module: etape.module, de: joue.bornes.de, jusqua: joue.bornes.jusqua, palier: enCours});
    } else {
      p = apprendre(p, etape.module, etape.niveau, palier);
      journal.push({type: "apprends", module: etape.module, niveau: etape.niveau, palier: enCours});
    }
    // Rien d'un palier plus haut n'est entré ni commencé tant que le palier en cours n'est pas fini.
    const resteBas = construits().some(c => palierDe(c.module, c.niveau) < enCours && !entre(p, c.module, c.niveau));
    assert.ok(!resteBas, `pas ${i} : un palier plus bas n'est pas fini`);
    construits().filter(c => palierDe(c.module, c.niveau) > enCours).forEach(c => {
      const ligne = p.modules[c.module];
      if (!ligne) return;
      assert.ok(!ligne.b[c.niveau - 1] && !ligne.f[c.niveau - 1] && !ligne.a[c.niveau - 1], `${c.module}-${c.niveau} : rien au-delà du palier ${enCours}`);
    });
  }
  return {p, journal};
}

test("élève neuf : le premier test ne monte que jusqu'aux bases (avant : jusqu'au bout du module)", () => {
  const p = P.creerParcours();
  assert.deepEqual(P.marchesDuTest(p, CARTE, "A1", 4), {de: 1, jusqua: 3});
  // A2 : niveaux 1 à 3 aux bases, 4 et 5 au CM1.
  assert.deepEqual(P.marchesDuTest(p, CARTE, "A2", 4), {de: 1, jusqua: 3});
  assert.deepEqual(P.marchesDuTest(p, CARTE, "A3", 4), {de: 1, jusqua: 2});
  // Une marche de CM1 ne peut donc plus être ratée au test et passer devant les bases.
});

test("bon élève qui saute tout : que des tests, palier par palier, et tout est entré", () => {
  const {p, journal} = jouerTout();
  assert.ok(journal.every(pas => pas.type === "test"), "il n'apprend rien");
  assert.ok(construits().every(c => entre(p, c.module, c.niveau)), "toutes les compétences construites sont entrées");
  // Les paliers se suivent dans le journal.
  const paliers = journal.map(pas => pas.palier);
  assert.deepEqual(paliers, paliers.slice().sort((a, b) => a - b));
  // Les marches d'un palier plus haut d'un module commencé ont eu leur test (A2-4 et A2-5).
  assert.ok(journal.some(pas => pas.module === "A2" && pas.de === 4 && pas.jusqua === 5), "A2 : le test de reprise, niveaux 4 et 5");
  assert.ok(journal.some(pas => pas.module === "D2" && pas.de === 2 && pas.jusqua === 3), "D2 : niveaux 2 et 3 au CM2");
  assert.ok(journal.some(pas => pas.module === "D2" && pas.de === 4 && pas.jusqua === 4), "D2 : niveau 4 vers la 6e");
});

// Lot 7e-2 (choix de Gwenaël du 15/11, « retester au lieu d'imposer
// J'apprends ») : après une marche ratée, la suite du palier a son test
// quand le parcours y arrive (avant : elle s'apprenait sans test).
test("élève qui rate au milieu : il apprend la marche ratée, puis la suite du palier a son test, et le palier d'après aussi", () => {
  // A2-2 raté au test (palier 1), et A3-3 raté à son test de reprise (palier 2).
  const rate = (id, n) => (id === "A2" && n === 2) || (id === "A3" && n === 3);
  const {p, journal} = jouerTout({rate});
  const a2 = journal.filter(pas => pas.module === "A2");
  assert.deepEqual(a2.map(pas => (pas.type === "test" ? `test ${pas.de}-${pas.jusqua}` : `apprends ${pas.niveau}`)),
    ["test 1-3", "apprends 2", "test 3-3", "test 4-5"]);
  const a3 = journal.filter(pas => pas.module === "A3");
  assert.deepEqual(a3.map(pas => (pas.type === "test" ? `test ${pas.de}-${pas.jusqua}` : `apprends ${pas.niveau}`)),
    ["test 1-2", "test 3-3", "apprends 3", "test 4-4"]);
  assert.ok(construits().every(c => entre(p, c.module, c.niveau)));
});

test("le test de reprise commence à la marche suivante : les niveaux d'en dessous ne bougent pas", () => {
  let p = P.creerParcours();
  ({p} = jouerTest(p, "A2", 4));
  assert.deepEqual(p.modules.A2.b.slice(0, 3).map(Boolean), [true, true, true]);
  const avant = JSON.stringify(p.modules.A2.b.slice(0, 3));
  // Tout le palier 1 entré : la compétence courante passe au palier 2.
  construits().filter(c => palierDe(c.module, c.niveau) === 1 && !entre(p, c.module, c.niveau)).forEach(c => { p = apprendre(p, c.module, c.niveau, 4); });
  assert.deepEqual(P.competenceCourante(p, CARTE, 4), {module: "A2", niveau: 4});
  assert.equal(P.testDeReprise(p, CARTE, {module: "A2", niveau: 4}), true);
  assert.deepEqual(P.marchesDuTest(p, CARTE, "A2", 4), {de: 4, jusqua: 5});
  // Raté à la marche 4 : A2-4 commence (à apprendre), rien n'entre.
  const rate = P.appliquerTest(p, {module: "A2", marche: 0, niveaux: [{niveau: 4, justes: 1, total: 3}]}, {aujourdhui: J, carte: CARTE});
  assert.equal(rate.marche, 0);
  assert.equal(rate.de, 4);
  assert.equal(rate.parcours.modules.A2.f[3], 1);
  assert.equal(JSON.stringify(rate.parcours.modules.A2.b.slice(0, 3)), avant);
  assert.deepEqual(P.competenceCourante(rate.parcours, CARTE, 4), {module: "A2", niveau: 4});
  assert.equal(P.testDeReprise(rate.parcours, CARTE, {module: "A2", niveau: 4}), false, "commencée : elle s'apprend");
  // Réussi aux deux marches : 4 (boîte 4, dessous) et 5 (boîte 3).
  const reussi = P.appliquerTest(p, {module: "A2", marche: 5, niveaux: [{niveau: 4, justes: 3, total: 3}, {niveau: 5, justes: 3, total: 3}]}, {aujourdhui: J, carte: CARTE});
  assert.equal(reussi.marche, 5);
  assert.equal(reussi.tout, true);
  assert.deepEqual(reussi.parcours.modules.A2.b.slice(3), [P.SEUILS.revision.dessous, P.SEUILS.revision.test]);
  assert.equal(JSON.stringify(reussi.parcours.modules.A2.b.slice(0, 3)), avant);
  // Un test qui saute une marche pas entrée ne prouve rien.
  const trou = P.appliquerTest(P.creerParcours(), {module: "A2", marche: 5, niveaux: [{niveau: 4, justes: 3, total: 3}, {niveau: 5, justes: 3, total: 3}]}, {aujourdhui: J, carte: CARTE});
  assert.equal(trou.marche, 0);
});

test("changement du réglage du professeur : jamais au-delà ; quand il monte, les marches d'au-dessus ont leur test", () => {
  // Réglé « les bases » : tout le palier 1, rien au-delà.
  const bases = jouerTout({palier: 1});
  assert.ok(bases.journal.every(pas => pas.palier === 1));
  assert.equal(P.competenceCourante(bases.p, CARTE, 1), null);
  assert.equal(P.marchesDuTest(bases.p, CARTE, "A2", 1), null, "rien à tester au-delà du réglage");
  // Le professeur ouvre le CM1 : des tests (reprise ou module neuf), au palier 2 seulement.
  const cm1 = jouerTout({palier: 2, p: bases.p});
  assert.ok(cm1.journal.length && cm1.journal.every(pas => pas.palier === 2));
  assert.equal(cm1.journal[0].type, "test", "la première marche du CM1 a son test");
  assert.ok(cm1.journal.every(pas => pas.type === "test"));
  // Redescendu aux bases au milieu : la file ne propose plus rien de nouveau.
  assert.equal(P.competenceCourante(cm1.p, CARTE, 1), null);
  // Un module intact dont le premier niveau est au palier 2 (D1) : testé jusqu'au palier en cours seulement.
  assert.deepEqual(P.marchesDuTest(bases.p, CARTE, "D1", 4), {de: 1, jusqua: 2});
  assert.deepEqual(P.marchesDuTest(bases.p, CARTE, "D1", 2), {de: 1, jusqua: 2});
});

test("la page : le test d'entrée borné par le moteur ; le bilan dit « plus tard » pour ce qui n'est pas testé", async () => {
  const {readFile} = await import("node:fs/promises");
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /PARCOURS\.marchesDuTest\(parcours, CARTE, id, palierRegle\(\)\)/);
  assert.match(page, /`Le niveau \$\{connus \+ 1\} viendra plus tard · \$\{fiche\.nom\}`/);
  assert.match(page, /`On commence au niveau \$\{de\} · \$\{fiche\.nom\}`/);
  assert.match(page, /suivi\.bilan\.filter\(niveau => niveau\.niveau >= de\)/);
});
