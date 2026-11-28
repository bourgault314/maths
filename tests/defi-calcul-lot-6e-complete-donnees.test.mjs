// Défi calcul, lot « la 6e complète » (27/11/2026) — les DONNÉES. La
// progression passe en version 15 : l'étage de 6e a 22 étoiles. Aucune clé
// neuve : « Entier × fraction » (F11) gagne un niveau au bout (F11-3) et
// « Où va la virgule ? » est un module neuf, D16, à la fin des modules ; les
// modules réservés D10, D11, D12, D14, F10, P1 et P2 étaient déjà dans le
// format, leurs lignes ne changent pas de taille. Une progression de
// version 14 se relit SANS RIEN PERDRE : la ligne de F11 reçoit une case vide
// au bout, D16 n'y est pas. Le serveur refuse l'écriture d'une page de
// version 14 (« version_min » 15) : elle couperait F11 et jetterait D16.
// Les témoins de version 14 (tests/defi-calcul-lot-6e-version-14.json) sont
// JOUÉS par le moteur du main 80a861ab (lot-6e-complete/_travail/outils/
// generer-version-14.cjs), à partir des témoins de version 13 du lot P1.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const V14 = JSON.parse(await lire("./defi-calcul-lot-6e-version-14.json"));
const PAR_ETOILE = ["b", "e", "a", "x", "r", "q", "pe", "d", "s", "ar", "g"];
const VIDE = {b: 0, e: null, a: 0, x: 0, r: 0, q: null, pe: 0, d: null, s: null, ar: 0, g: 0};
const copie = x => JSON.parse(JSON.stringify(x));
const etoilesDe = carte => carte.etages.flatMap(e => e.lignes.flatMap(l => l.etoiles));
const NEUVES = ["D10-1", "D10-2", "D11-1", "D14-1", "D12-1", "D16-1", "F11-3", "F10-1", "P1-1", "P2-1"];

test("le format : version 15 ; la 14 et la 13 se relisent, la 12 est reprise ; F11 a trois niveaux, D16 un, à la fin", () => {
  assert.equal(P.VERSION, 15);
  assert.deepEqual([P.VERSION_14, P.VERSION_13, P.VERSION_REPRISE], [14, 13, 12]);
  assert.equal(V14.version, 14, "les témoins viennent d'un moteur de version 14");
  assert.equal(P.NIVEAUX.F11, 3);
  assert.equal(P.NIVEAUX.D16, 1);
  assert.equal(P.CODES[P.CODES.length - 1], "D16", "le module neuf est le dernier : aucun rang ne bouge");
  // Les modules réservés gardent la taille de leur ligne : les niveaux pas encore construits sont réservés.
  assert.deepEqual(["D10", "D11", "D12", "D14", "F10", "P1", "P2"].map(id => P.NIVEAUX[id]), [3, 3, 2, 3, 3, 3, 3]);
  ["D10", "D11", "D12", "D14", "F10", "P1", "P2"].forEach(id => {
    const fiche = CORE.moduleDe(id);
    assert.equal(fiche.niveaux.length + fiche.enReserve, P.NIVEAUX[id], id);
  });
  // Les dix étoiles neuves sont dans la carte, à l'étage de 6e.
  NEUVES.forEach(cle => assert.equal(CORE.niveauDe(cle).niveau.palier, 6, cle));
  assert.deepEqual(Object.keys(P.creerParcours()), ["version", "epoque", "prenom", "modules", "seance", "seances", "journal", "jours", "ceintures", "paliers", "quarts"]);
});

for (const [nom, t] of Object.entries(V14.temoins)) {
  test(`version 14 « ${nom} » relue en version 15 sans rien perdre : chaque étoile, la séance, le journal, les ceintures (${t.quoi})`, () => {
    const jour = t.vu.jour;
    const avant = t.parcours;
    assert.equal(avant.version, 14);
    const apres = P.normaliserParcours(copie(avant), {aujourdhui: jour});
    assert.deepEqual(avant, t.parcours, "la copie relue n'est pas modifiée");
    assert.equal(apres.version, 15);
    assert.deepEqual(Object.keys(apres.modules), Object.keys(avant.modules), "les mêmes modules, dans le même ordre");
    Object.entries(avant.modules).forEach(([id, l]) => {
      assert.equal(apres.modules[id].vu, l.vu);
      assert.deepEqual(apres.modules[id].c, l.c, `${id}.c`);
      PAR_ETOILE.forEach(champ => {
        assert.equal(apres.modules[id][champ].length, P.NIVEAUX[id], `${id}.${champ}`);
        assert.deepEqual(apres.modules[id][champ].slice(0, l[champ].length), l[champ], `${id}.${champ} : rien ne bouge`);
        apres.modules[id][champ].slice(l[champ].length).forEach(v => assert.deepEqual(v, VIDE[champ], `${id}.${champ} : la case neuve est vide`));
      });
    });
    assert.ok(!("D16" in apres.modules), "D16 n'est pas joué");
    ["seance", "seances", "journal", "jours", "ceintures", "paliers", "quarts", "epoque", "prenom"].forEach(champ => assert.deepEqual(apres[champ], avant[champ], champ));
    // Ce que l'élève voit : les mêmes étoiles tenues, gagnées un jour, à regagner ; les dix
    // neuves ne sont ni tenues ni gagnées ; aucune étoile ouverte ne se ferme, sauf…
    const carte = P.carteEleve(apres, CARTE, {aujourdhui: jour});
    const etoiles = etoilesDe(carte);
    assert.deepEqual(etoiles.filter(e => e.etat === "gagnee").map(e => e.cle).sort(), [...t.vu.tenues].sort(), "les étoiles tenues");
    assert.deepEqual(etoiles.filter(e => e.dejaGagnee).map(e => e.cle).sort(), [...t.vu.unJour].sort(), "gagnées un jour");
    assert.deepEqual(etoiles.filter(e => e.aRegagner).map(e => e.cle).sort(), [...t.vu.aRegagner].sort(), "à regagner");
    const ouvertes = new Set(etoiles.filter(e => e.etat !== "fermee").map(e => e.cle));
    // (… les étoiles de la 6e qui changent de ligne : D2-4 ouvre « × 10 et × 0,1 », F1-3 ouvre
    // « Fractions » — F1-3 s'ouvre, rien ne se ferme.)
    t.vu.ouvertes.forEach(cle => assert.ok(ouvertes.has(cle), `${cle} reste ouverte`));
    assert.equal(P.etatCeintures(apres, CARTE).porte, t.vu.ceinture, "la ceinture portée");
    // Les mêmes calculs dus, aux mêmes échéances.
    const dus = P.tirerCalculsDuJour(apres, CARTE, {aujourdhui: jour, maximum: 999}).map(c => `${c.module}-${c.niveau}`).sort();
    assert.deepEqual(dus, t.vu.dus, "Mes calculs du jour");
    // Relue deux fois, par le JSON : la même.
    assert.deepEqual(P.normaliserParcours(copie(apres), {aujourdhui: jour}), apres);
  });
}

test("la ligne de F11 : la sorte ratée de F11-2 (dans `x`) et son 2e calcul attendu restent à leur place ; F11-3 se gagne dans la case neuve", () => {
  const t = V14.temoins["fractions-6e"];
  const apres = P.normaliserParcours(copie(t.parcours), {aujourdhui: t.vu.jour});
  assert.deepEqual(apres.modules.F11.x, [...t.parcours.modules.F11.x, 0]);
  assert.equal(apres.modules.F11.x[1] >> 2, 7, "la sorte 7");
  assert.deepEqual(apres.modules.F11.q, [...t.parcours.modules.F11.q, null]);
  const r = P.appliquerTentative(apres, {module: "F11", niveau: 3, reponses: Array.from({length: 6}, () => ({juste: true, ms: 1500}))}, {aujourdhui: t.vu.jour, carte: CARTE});
  assert.equal(r.refuse, undefined);
  assert.deepEqual(r.parcours.modules.F11.b.slice(0, 2), apres.modules.F11.b.slice(0, 2), "F11-1 et F11-2 ne bougent pas");
  assert.equal(r.parcours.modules.F11.b[2], 4, "F11-3 gagnée du premier coup : boîte 4");
});

test("la ceinture de la 6e d'avant, gagnée sur 12 étoiles, reste portée ; les dix neuves sont à gagner", () => {
  const t = V14.temoins["sixieme-tenue"];
  const apres = P.normaliserParcours(copie(t.parcours), {aujourdhui: t.vu.jour});
  assert.equal(t.vu.ceinture, 6);
  assert.equal(P.etatCeintures(apres, CARTE).porte, 6, "une ceinture gagnée ne se perd pas");
  const carte = P.carteEleve(apres, CARTE, {aujourdhui: t.vu.jour});
  const sixieme = carte.etages.find(e => e.etage === 6);
  assert.deepEqual([sixieme.total, sixieme.etoiles], [22, 12]);
  const par = new Map(etoilesDe(carte).map(e => [e.cle, e]));
  NEUVES.forEach(cle => assert.notEqual(par.get(cle).etat, "gagnee", cle));
});

test("une progression reçue en version 14 est récrite une fois en version 15 (apporte), même quand l'appareil n'apporte rien ; relue en 15, plus rien ne repart", () => {
  for (const [nom, t] of Object.entries(V14.temoins)) {
    const options = {aujourdhui: t.vu.jour, carte: CARTE};
    const neuf = P.recevoir(P.creerParcours(), copie(t.parcours), options);
    assert.deepEqual([neuf.lectureSeule, neuf.apporte, neuf.parcours.version], [false, true, 15], `${nom} : appareil neuf`);
    const meme = P.recevoir(P.normaliserParcours(copie(t.parcours), {aujourdhui: t.vu.jour}), copie(t.parcours), options);
    assert.deepEqual([meme.lectureSeule, meme.apporte], [false, true], `${nom} : la même progression dans l'appareil`);
    const ecrite = copie(Object.assign({}, neuf.parcours, {prenom: ""}));
    const ensuite = P.recevoir(neuf.parcours, ecrite, options);
    assert.deepEqual([ensuite.lectureSeule, ensuite.apporte], [false, false], `${nom} : une seule fois`);
  }
});

test("la fusion entre une version 14 et une version 15, dans les deux sens : rien ne se perd, le même résultat", () => {
  const paire = V14.paires["deux-appareils"];
  const options = {aujourdhui: paire.jour, carte: CARTE};
  const a15 = P.normaliserParcours(copie(paire.a), {aujourdhui: paire.jour});
  // A (la 6e jouée) relue en 15, B encore en 14 ; puis l'inverse.
  const ab = P.fusionner(a15, copie(paire.b), options);
  const ba = P.fusionner(copie(paire.b), a15, options);
  assert.deepEqual(ab, ba, "fusion(A, B) = fusion(B, A)");
  assert.equal(ab.version, 15);
  // Ce que fusionnait le moteur 14, à sa place ; la case neuve vide.
  Object.entries(paire.fusion.modules).forEach(([id, l]) => ["b", "e", "x", "pe", "g"].forEach(champ => {
    assert.deepEqual(ab.modules[id][champ].slice(0, l[champ].length), l[champ], `${id}.${champ}`);
  }));
  assert.deepEqual(ab.ceintures, paire.fusion.ceintures);
  // Une étoile neuve gagnée en 15 ne se perd pas contre une version 14.
  // (P1-1, « Pourcentage, fraction, décimal », ouvre sa ligne.)
  const gagne = P.appliquerTentative(a15, {module: "P1", niveau: 1, reponses: Array.from({length: 6}, () => ({juste: true, ms: 1500}))}, options);
  assert.equal(gagne.refuse, undefined);
  const f = P.fusionner(gagne.parcours, copie(paire.a), options);
  assert.equal(f.modules.P1.b[0], 4, "P1-1 reste gagnée");
  assert.deepEqual(P.fusionner(copie(paire.a), gagne.parcours, options), f);
});

test("une version plus récente (16) n'est jamais lue ; une version d'avant la 12 repart de zéro", () => {
  const t = V14.temoins.debut;
  const futur = Object.assign(copie(t.parcours), {version: 16});
  assert.equal(P.tropRecente(futur), true);
  assert.equal(P.recevoir(P.creerParcours(), futur, {aujourdhui: t.vu.jour, carte: CARTE}).lectureSeule, true);
  assert.equal(P.tropRecente({version: 15}), false);
  assert.equal(P.tropRecente({version: 14}), false);
  const vieille = P.normaliserParcours(Object.assign(copie(t.parcours), {version: 11, epoque: 4}));
  assert.deepEqual([vieille.modules, vieille.epoque], [{}, 4]);
});

test("le serveur : D16 dans le motif des modules, version_min 15 ; la copie du moteur pour la page du professeur", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'version_min' => 15,/);
  // Le motif des codes de modules accepte D16 (et refuse un code qui n'existe pas).
  const motif = bloc.match(/'motifs' => \['\/([^']+)\/'/);
  assert.ok(motif, "le motif des modules est déclaré");
  const re = new RegExp(motif[1]);
  assert.ok(re.test("D16"), "D16 passe");
  P.CODES.forEach(id => assert.ok(re.test(id), `${id} passe`));
  ["D17", "Z1"].forEach(id => assert.ok(!re.test(id), `${id} ne passe pas`));
  for (const fichier of ["defi_calcul_mon_parcours.js", "defi_calcul_core.js"]) {
    assert.equal(await lire(`../_serveur/public/prof/${fichier}`), await lire(`../outils/calcul_mental/${fichier}`), fichier);
  }
});

test("le témoin de version 14 des tests du serveur est le témoin « fractions-6e », sans prénom ; le moteur le relit comme lui", async () => {
  const serveur = JSON.parse(await lire("../_serveur/tests/parcours-version-14-defi-calcul.json"));
  const {prenom, ...temoin} = V14.temoins["fractions-6e"].parcours;
  assert.equal(prenom, "");
  assert.deepEqual(serveur, temoin);
  const jour = V14.temoins["fractions-6e"].vu.jour;
  assert.deepEqual(P.normaliserParcours(serveur, {aujourdhui: jour}).modules, P.normaliserParcours(V14.temoins["fractions-6e"].parcours, {aujourdhui: jour}).modules);
});

// Correctif du lot (relecture de Codex du 28/11, défaut 1) : une copie de
// version 14 (ou 13) qui porte quelque chose aux places des étoiles neuves
// — aucune page ancienne n'a pu l'écrire — ne donne pas d'étoile.
test("correctif : une version 14 abîmée ne donne aucune étoile neuve ; une version 15 garde les siennes", () => {
  const t = V14.temoins["fractions-6e"];
  const jour = t.vu.jour;
  const abimee = copie(t.parcours);
  const remplir = (ligne, i) => { ligne.b[i] = 3; ligne.d[i] = "2026-10-01"; ligne.e[i] = "2026-11-01"; ligne.g[i] = 4; ligne.s[i] = "2026-10-05"; };
  const k = id => P.NIVEAUX[id];
  // F11 : une 3e case au bout de chaque liste, et les causes de F11-3.
  const f11 = abimee.modules.F11;
  assert.ok(f11, "le témoin a une ligne F11");
  PAR_ETOILE.forEach(champ => { if (Array.isArray(f11[champ])) while (f11[champ].length < 3) f11[champ].push(VIDE[champ]); });
  remplir(f11, 2);
  f11.c = Object.assign({}, f11.c, {7: 2, 8: 1, 9: 3});
  // Les modules qui n'avaient rien de jouable, D16 compris, et un niveau encore réservé (D10, 3e case).
  ["D10", "D11", "D12", "D14", "F10", "P1", "P2", "D16"].forEach(id => {
    const ligne = {vu: "2026-10-01", c: {1: 2}};
    PAR_ETOILE.forEach(champ => { ligne[champ] = Array.from({length: k(id)}, () => VIDE[champ]); });
    for (let i = 0; i < k(id); i += 1) remplir(ligne, i);
    abimee.modules[id] = ligne;
  });
  const lue = P.normaliserParcours(copie(abimee), {aujourdhui: jour});
  // (Un module absent de la progression est vide.)
  ["D10", "D11", "D12", "D14", "F10", "P1", "P2", "D16"].forEach(id => assert.equal(lue.modules[id], undefined, id));
  PAR_ETOILE.forEach(champ => assert.equal(lue.modules.F11[champ][2], VIDE[champ], `F11.${champ}[2]`));
  ["7", "8", "9"].forEach(c => assert.equal(lue.modules.F11.c[c], undefined, `F11.c.${c}`));
  // Rien de ce que la page ancienne a vraiment joué n'est touché.
  const juste = P.normaliserParcours(copie(t.parcours), {aujourdhui: jour});
  [0, 1].forEach(i => PAR_ETOILE.forEach(champ => assert.deepEqual(lue.modules.F11[champ][i], juste.modules.F11[champ][i], `F11.${champ}[${i}]`)));
  // La même copie en version 15 garde tout : ce sont ses étoiles.
  const v15 = P.normaliserParcours(Object.assign(copie(abimee), {version: 15}), {aujourdhui: jour});
  assert.equal(v15.modules.D16.b[0], 3);
  assert.equal(v15.modules.F11.b[2], 3);
  assert.equal(v15.modules.P1.b[0], 3);
});
