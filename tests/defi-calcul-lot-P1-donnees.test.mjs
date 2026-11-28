// Défi calcul, lot P1 refait (27/11/2026) — les DONNÉES. La progression passe
// en version 14 : la sorte d'un calcul raté à un retour est rangée dans `x`
// (× 4 : 0 à 243), sans clé de plus ; pas de classe de l'élève. Une
// progression de version 13 (le compte de test de Gwenaël) se relit SANS RIEN
// PERDRE et sans rien transformer ; une version 12 passe toujours par la
// reprise du lot K1b.
// Les témoins de version 13 (tests/defi-calcul-lot-P1-version-13.json) sont
// JOUÉS par le moteur du main da8c3b1 (P1/_travail/outils/generer-version-13.cjs).
// (Lot « la 6e complète » : le moteur est en version 15 ; une version 13 se
// relit toujours sans rien perdre — F11 reçoit une case vide au bout. La
// relecture d'une version 14 : defi-calcul-lot-6e-complete-donnees.)

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const V13 = JSON.parse(await readFile(new URL("./defi-calcul-lot-P1-version-13.json", import.meta.url), "utf8"));
const V12 = JSON.parse(await readFile(new URL("./defi-calcul-lot-K1b-version-12.json", import.meta.url), "utf8"));
const PAR_ETOILE = ["b", "e", "a", "x", "r", "q", "pe", "d", "s", "ar", "g"];
const copie = x => JSON.parse(JSON.stringify(x));
const etoilesDe = carte => carte.etages.flatMap(e => e.lignes.flatMap(l => l.etoiles));

test("le format : version 14 (15 au lot « la 6e complète »), la version 13 se relit, la 12 est reprise ; rien d'autre que ce que le moteur décrit", () => {
  assert.equal(P.VERSION, 15);
  assert.equal(P.VERSION_13, 13);
  assert.equal(P.VERSION_REPRISE, 12);
  assert.equal(V13.version, 13, "les témoins viennent d'un moteur de version 13");
  assert.deepEqual(Object.keys(P.creerParcours()), ["version", "epoque", "prenom", "modules", "seance", "seances", "journal", "jours", "ceintures", "paliers", "quarts"]);
  const p = P.normaliserParcours(V13.temoins["trois-semaines"].parcours, {aujourdhui: V13.temoins["trois-semaines"].vu.jour});
  Object.values(p.modules).forEach(l => assert.deepEqual(Object.keys(l).sort(), ["a", "ar", "b", "c", "d", "e", "g", "pe", "q", "r", "s", "vu", "x"]));
});

for (const [nom, t] of Object.entries(V13.temoins)) {
  test(`version 13 « ${nom} » relue en version 15 sans rien perdre : chaque étoile, la séance, le journal, les ceintures (${t.quoi})`, () => {
    const jour = t.vu.jour;
    const avant = t.parcours;
    const apres = P.normaliserParcours(copie(avant), {aujourdhui: jour});
    assert.equal(apres.version, 15);
    // (Lot « la 6e complète » : une ligne plus longue en version 15 — F11 — garde ses cases, la neuve est vide.)
    const vide = {b: 0, e: null, a: 0, x: 0, r: 0, q: null, pe: 0, d: null, s: null, ar: 0, g: 0};
    Object.entries(avant.modules).forEach(([id, l]) => PAR_ETOILE.forEach(champ => {
      assert.deepEqual(apres.modules[id][champ].slice(0, l[champ].length), l[champ], `${id}.${champ}`);
      apres.modules[id][champ].slice(l[champ].length).forEach(v => assert.deepEqual(v, vide[champ], `${id}.${champ} : la case neuve est vide`));
    }));
    ["seance", "seances", "journal", "jours", "ceintures", "paliers", "quarts", "epoque", "prenom"].forEach(champ => assert.deepEqual(apres[champ], avant[champ], champ));
    // Ce que l'élève voit : les mêmes étoiles tenues, gagnées un jour, à regagner ; les ceintures. (Tout est ouvert
    // maintenant : des étoiles fermées en version 13 s'ouvrent, aucune ouverte ne se ferme.)
    const carte = P.carteEleve(apres, CARTE, {aujourdhui: jour});
    const etoiles = etoilesDe(carte);
    assert.deepEqual(etoiles.filter(e => e.etat === "gagnee").map(e => e.cle), t.vu.tenues, "les étoiles tenues");
    assert.deepEqual(etoiles.filter(e => e.dejaGagnee).map(e => e.cle), t.vu.unJour, "gagnées un jour");
    assert.deepEqual(etoiles.filter(e => e.aRegagner).map(e => e.cle), t.vu.aRegagner, "à regagner");
    const ouvertes = new Set(etoiles.filter(e => e.etat !== "fermee").map(e => e.cle));
    t.vu.ouvertes.forEach(cle => assert.ok(ouvertes.has(cle), `${cle} reste ouverte`));
    assert.deepEqual(carte.etages.filter(e => e.ouvert).map(e => e.etage), [1, 2, 3, 4, 5, 6], "tout est ouvert");
    // Les mêmes calculs dus, aux mêmes échéances.
    const dus = (p, moteur) => moteur.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour, maximum: 999}).map(c => `${c.module}-${c.niveau}`).sort();
    assert.deepEqual(dus(apres, P), dus(avant, P), "Mes calculs du jour");
    // Relue deux fois : la même.
    assert.deepEqual(P.normaliserParcours(copie(apres), {aujourdhui: jour}), apres);
  });
}

test("une progression reçue en version 13 est récrite une fois en version 15 (apporte), même quand l'appareil n'apporte rien ; relue en 14, plus rien ne repart", () => {
  const t = V13.temoins["trois-semaines"];
  const jour = t.vu.jour;
  const r = P.recevoir(P.creerParcours(), copie(t.parcours), {aujourdhui: jour, carte: CARTE});
  assert.equal(r.lectureSeule, false);
  assert.equal(r.apporte, true);
  assert.equal(r.parcours.version, 15);
  const r2 = P.recevoir(r.parcours, copie(r.parcours), {aujourdhui: jour, carte: CARTE});
  assert.equal(r2.apporte, false);
});

test("la version 12 passe toujours par la reprise du lot K1b : les étoiles tenues sont les mêmes", () => {
  for (const [nom, t] of Object.entries(V12.temoins)) {
    const apres = P.normaliserParcours(copie(t.parcours), {aujourdhui: t.vu.jour});
    assert.equal(apres.version, 15, nom);
    const tenues = etoilesDe(P.carteEleve(apres, CARTE, {aujourdhui: t.vu.jour})).filter(e => e.etat === "gagnee").length;
    assert.equal(tenues, t.vu.tenues.length + t.vu.tenues.filter(cle => ["A10-1", "A10-2", "A11-2", "A2-1", "A3-1", "A5-1", "M1-1", "M1-2", "M1-4"].includes(cle)).length, `${nom} : chaque étoile coupée donne ses deux moitiés`);
  }
});

test("une version plus récente n'est jamais lue ; une version d'avant la 12 repart de zéro", () => {
  const futur = Object.assign(copie(V13.temoins.debut.parcours), {version: 16});
  const r = P.recevoir(P.creerParcours(), futur, {aujourdhui: V13.temoins.debut.vu.jour, carte: CARTE});
  assert.equal(r.lectureSeule, true);
  const vieille = Object.assign(copie(V13.temoins.debut.parcours), {version: 11, epoque: 4});
  const relue = P.normaliserParcours(vieille);
  assert.deepEqual(relue.modules, {});
  assert.equal(relue.epoque, 4);
});

test("la fusion : la paire de version 13 fusionnée en 15 tient ce que fusionnait le moteur de la 13 ; une sorte ratée suit le bloc de son étoile", () => {
  const paire = V13.paires["deux-appareils"];
  const f = P.fusionner(copie(paire.a), copie(paire.b), {aujourdhui: paire.jour, carte: CARTE});
  Object.entries(paire.fusion.modules).forEach(([id, l]) => ["b", "e", "x", "pe", "g"].forEach(champ => assert.deepEqual(f.modules[id][champ].slice(0, l[champ].length), l[champ], `${id}.${champ}`)));
  assert.deepEqual(f.ceintures, paire.fusion.ceintures);
  // Deux appareils : sur l'un, A1-1 ratée à son retour (sorte 5) ; l'autre n'a rien fait.
  const J = "2026-06-01";
  let base = P.appliquerSerie(P.creerParcours(), {module: "A1", niveau: 1, genre: "apprends", reponses: [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))]}, {aujourdhui: J, carte: CARTE}).parcours;
  const jour = P.ajouterJours(J, 1);
  let a = P.appliquerRetour(base, {module: "A1", niveau: 1, juste: false, ms: 1500, type: "P", sorte: 5}, {aujourdhui: jour, carte: CARTE}).parcours;
  a = P.appliquerRetour(a, {module: "A1", niveau: 1, juste: false, ms: 1500, type: "P", sorte: 5, deuxieme: true}, {aujourdhui: jour, carte: CARTE}).parcours;
  const ab = P.fusionner(a, base, {aujourdhui: jour, carte: CARTE});
  const ba = P.fusionner(base, a, {aujourdhui: jour, carte: CARTE});
  assert.deepEqual(ab, ba, "fusion(A, B) = fusion(B, A)");
  assert.equal(ab.modules.A1.x[0], 1 + 4 * 5, "le retour raté et sa sorte");
  assert.equal(ab.modules.A1.b[0], 1, "la règle B : la boîte 2 descend en 1");
  assert.deepEqual(P.fusionner(ab, a, {aujourdhui: jour, carte: CARTE}), ab, "fusion(fusion(A, B), A) = fusion(A, B)");
});

// (Lot « la 6e complète » : D16, un module de plus — 1 679 clés et 31 127 octets ; 1 980 et 34 064 ; 1 980 et 36 323.)
test("la taille, mesurée : la référence (1 679 clés, 31 127 octets sans le prénom) ; toutes les étoiles tenues et 12 causes (1 980, 34 064) ; le pire cas (1 980, 36 323) — sous les bornes du serveur", async () => {
  const {parcoursComplet} = await import("../scripts/generer-parcours-reference-defi-calcul.mjs");
  const reference = JSON.parse(await readFile(new URL("../_serveur/tests/parcours-reference-defi-calcul.json", import.meta.url), "utf8"));
  const {prenom, ...envoyee} = reference;
  assert.equal(prenom, "");
  assert.deepEqual(P.mesurer(envoyee), {cles: 1679, octets: 31127});
  assert.deepEqual(P.mesurer(parcoursComplet()), {cles: 1680, octets: 31139}, "le fichier versionné est ce que rend le générateur");
  assert.ok(Math.max(...Object.values(reference.modules).flatMap(l => l.x)) > 3, "la référence porte des sortes ratées");
  assert.deepEqual(P.mesurer(parcoursComplet({entier: true, causes: P.SEUILS.causes})), {cles: 1980, octets: 34064});
  const pire = P.mesurer(parcoursComplet({pire: true, causes: P.SEUILS.causes}));
  assert.deepEqual(pire, {cles: 1980, octets: 36323});
  assert.ok(pire.cles < 2000 && pire.octets < 40000);
});
