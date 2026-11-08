import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot E3 (22/09/2026) — SPLAT! Enquête entre dans la carte des mondes.
   On EXÉCUTE les données de outils/splat_univers.html : un test qui ne ferait
   que chercher du texte dans le fichier ne dirait rien des adresses réellement
   construites (leçon du lot L, 20/09). */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const courte = lire("splat/enquete/livret/index.html");

function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("const NOTES_MONDE", "const main=document") +
  ";globalThis.X={MONDES,NOTES_MONDE,NOTES_PROF,ENQ_FICHES,SYS_FICHES};",
  ctx, { filename: "splat_univers.html" }
);
/* Les objets nés dans le bac à sable de vm n'ont pas les mêmes prototypes que
   ceux d'ici : on les recopie pour que deepEqual compare les valeurs. */
const { MONDES, NOTES_MONDE, NOTES_PROF, ENQ_FICHES, SYS_FICHES } = JSON.parse(JSON.stringify(ctx.X));
/* Lot E5 (23/09/2026) : l'Enquête avait été coupée en deux mondes, un par livret.
   Lot « six mondes » (24/09/2026) : elle redevient UN monde 3 en trois parties (10-14,
   15-19, 20-24), le Système prend la place de monde 4. Les dix premières étapes sont
   celles des lots E0-E5 ; « LES_DEUX » garde son nom pour que les épingles d'avant se
   relisent telles quelles. */
const ENQUETE = MONDES[2], SYSTEME = MONDES[3];
const LES_DEUX = ENQUETE.etapes.slice(0, 10);
const LA_TROISIEME = ENQUETE.etapes.slice(10);

/* AVANT la coupe (lot E4) : l'identifiant de chaque étape, dans l'ordre de la carte, et
   son parcours. Relevé en exécutant la carte des mondes du lot E4. Une étoile cochée à la
   main est rangée sous l'identifiant, une étoile gagnée en ligne sous le parcours : si
   l'un ou l'autre bouge, des étoiles déjà gagnées disparaissent. */
const IDS_AVANT_E5 = ["e0-0", "e0-1", "e0-2", "e0-3", "e0-4", "e0-5", "e1-0", "e1-1", "e1-2",
  "enq-0", "enq-1", "enq-2", "enq-3", "enq-4", "enq-5", "enq-6", "enq-7", "enq-8", "enq-9",
  "e2-0", "e2-1", "e2-2", "e2-3", "e3-0", "e3-1", "e3-2", "e3-3", "e3-4", "e3-5", "e3-6"];
const PARCOURS_ENQ_AVANT_E5 = ["enq10", "enq11", "enq12", "enq13", "enq14", "enq15", "enq16", "enq17", "enq18", "enq19"];
/* Lot « six mondes » : les cinq étapes de la 3e partie et les dix du Système s'ajoutent
   APRÈS les identifiants d'avant, jamais entre — relevé en exécutant la carte du lot. */
const IDS_SIX_MONDES = ["e0-0", "e0-1", "e0-2", "e0-3", "e0-4", "e0-5", "e1-0", "e1-1", "e1-2",
  "enq-0", "enq-1", "enq-2", "enq-3", "enq-4", "enq-5", "enq-6", "enq-7", "enq-8", "enq-9", "enq-10", "enq-11", "enq-12", "enq-13", "enq-14",
  "sys-0", "sys-1", "sys-2", "sys-3",
  "e2-0", "e2-1", "e2-3", "e3-ech1", "e3-ech2", "e3-ech3", "e3-0", "e3-1", "e3-2", "e3-3", "e3-4", "e3-5"];
/* lot R2 (26/09/2026) : le monde 6 passe de 7 étapes à 6 fiches (38 à 43) — e3-6 et m4e7
   disparaissent ; ce monde n'avait aucun élève (caché au public depuis le 26/09).
   lot M4-4 (04/10/2026) : le monde 4 passe de 10 étapes à 4 fiches (25 à 28) — sys-4 … sys-9 et
   sys29 … sys34 disparaissent ; ce monde n'a jamais été ouvert aux élèves (en préparation).
   lot 3 de l'échauffement (14/10/2026) : trois étapes à code avant la 38 (e3-ech1 … e3-ech3,
   parcours ech1 … ech3) ; les étoiles e3-0 … e3-5 des fiches 38 à 43 ne bougent pas. */
const PARCOURS_SIX_MONDES = ["m1e1", "m1e2", "m1e3", "m1e4", "m1e5", "m1e6", "m2e1", "m2e4", "m2e5",
  "enq10", "enq11", "enq12", "enq13", "enq14", "enq15", "enq16", "enq17", "enq18", "enq19", "enq20", "enq21", "enq22", "enq23", "enq24",
  "sys25", "sys26", "sys27", "sys28",
  "m3e1", "m3e2", "m3e4", "ech1", "ech2", "ech3", "m4e1", "m4e2", "m4e3", "m4e4", "m4e5", "m4e6"];
/* le gabarit calcule l'identifiant ainsi (idEtape) : on refait le même calcul */
const idEtape = (m, e, ei) => e.id || (m.idp + "-" + ei);

/* Les 30 adresses (énoncé / correction) des fiches 10 à 24, figées au lot « fabrication des cinq
   livrets » (03/10/2026, la progression v3 : graines triées, « modele=1 » sur 12, 13, 17, 18, 22).
   Une graine ou un réglage qui bouge ici, ce sont les fiches et les livrets à refaire. */
const ADRESSES_LOT2 = [
  /* fiche 10 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=51&cards=4&unknown=question&layout=4&title=Fiche%2010%20%E2%80%94%20De%20plus%20que&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=51&cards=4&unknown=question&layout=4&title=Fiche%2010%20%E2%80%94%20De%20plus%20que&print=correction",
  /* fiche 11 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=0&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=74&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2011%20%E2%80%94%20De%20moins%20que&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=0&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=74&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2011%20%E2%80%94%20De%20moins%20que&print=correction",
  /* fiche 12 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=12287&cards=4&unknown=question&layout=4&title=Fiche%2012%20%E2%80%94%20Trois%20taches%2C%20une%20r%C3%A9f%C3%A9rence&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=12287&cards=4&unknown=question&layout=4&title=Fiche%2012%20%E2%80%94%20Trois%20taches%2C%20une%20r%C3%A9f%C3%A9rence&print=correction",
  /* fiche 13 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=30140&cards=4&unknown=question&layout=4&title=Fiche%2013%20%E2%80%94%20Trois%20taches%20en%20cha%C3%AEne&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=30140&cards=4&unknown=question&layout=4&title=Fiche%2013%20%E2%80%94%20Trois%20taches%20en%20cha%C3%AEne&print=correction",
  /* fiche 14 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=3&totalMin=20&totalMax=50&seed=6176290&cards=4&unknown=question&layout=4&title=Fiche%2014%20%E2%80%94%20R%C3%A9f%C3%A9rence%20ou%20cha%C3%AEne%20%3F&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=3&totalMin=20&totalMax=50&seed=6176290&cards=4&unknown=question&layout=4&title=Fiche%2014%20%E2%80%94%20R%C3%A9f%C3%A9rence%20ou%20cha%C3%AEne%20%3F&print=correction",
  /* fiche 15 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=1800&cards=4&unknown=question&layout=4&title=Fiche%2015%20%E2%80%94%20Fois%20plus&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=1800&cards=4&unknown=question&layout=4&title=Fiche%2015%20%E2%80%94%20Fois%20plus&print=correction",
  /* fiche 16 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=871&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2016%20%E2%80%94%20Fois%20moins&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=871&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2016%20%E2%80%94%20Fois%20moins&print=correction",
  /* fiche 17 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=3485&cards=4&unknown=question&layout=4&title=Fiche%2017%20%E2%80%94%20Une%20r%C3%A9f%C3%A9rence%2C%20deux%20rapports&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=3485&cards=4&unknown=question&layout=4&title=Fiche%2017%20%E2%80%94%20Une%20r%C3%A9f%C3%A9rence%2C%20deux%20rapports&print=correction",
  /* fiche 18 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=962412&cards=4&unknown=question&layout=4&title=Fiche%2018%20%E2%80%94%20Cha%C3%AEne%2C%20deux%20rapports&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=962412&cards=4&unknown=question&layout=4&title=Fiche%2018%20%E2%80%94%20Cha%C3%AEne%2C%20deux%20rapports&print=correction",
  /* fiche 19 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60&seed=8562429&cards=4&unknown=question&layout=4&title=Fiche%2019%20%E2%80%94%20Une%20r%C3%A9f%C3%A9rence%2C%20un%20%C3%A9cart%20et%20un%20rapport&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60&seed=8562429&cards=4&unknown=question&layout=4&title=Fiche%2019%20%E2%80%94%20Une%20r%C3%A9f%C3%A9rence%2C%20un%20%C3%A9cart%20et%20un%20rapport&print=correction",
  /* fiche 20 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&repeat=3&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=14&cards=4&unknown=question&layout=4&title=Fiche%2020%20%E2%80%94%20Des%20taches%20r%C3%A9p%C3%A9t%C3%A9es&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&repeat=3&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=14&cards=4&unknown=question&layout=4&title=Fiche%2020%20%E2%80%94%20Des%20taches%20r%C3%A9p%C3%A9t%C3%A9es&print=correction",
  /* fiche 21 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&repeat=3&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60&vocab=1&seed=21800&cards=4&unknown=question&layout=4&title=Fiche%2021%20%E2%80%94%20R%C3%A9p%C3%A9t%C3%A9es%2C%20fois%20plus%20ou%20moins&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&repeat=3&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60&vocab=1&seed=21800&cards=4&unknown=question&layout=4&title=Fiche%2021%20%E2%80%94%20R%C3%A9p%C3%A9t%C3%A9es%2C%20fois%20plus%20ou%20moins&print=correction",
  /* fiche 22 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&modele=1&seed=159&cards=4&unknown=question&layout=4&title=Fiche%2022%20%E2%80%94%20Sans%20total&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&modele=1&seed=159&cards=4&unknown=question&layout=4&title=Fiche%2022%20%E2%80%94%20Sans%20total&print=correction",
  /* fiche 23 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=9&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2023%20%E2%80%94%20Sans%20total%2C%20%C3%A0%20retourner&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=9&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2023%20%E2%80%94%20Sans%20total%2C%20%C3%A0%20retourner&print=correction",
  /* fiche 24 */ "/splat/classique/?mode=C&clues=SENTENCE&splats=2&repeat=3&noTotal=1&mul=1&div=1&add=1&sub=1&deltaMax=20&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=30091&cards=4&unknown=question&layout=4&title=Fiche%2024%20%E2%80%94%20Le%20d%C3%A9fi%20qui%20rebondit&print=statement",
                 "/splat/classique/?mode=C&clues=SENTENCE&splats=2&repeat=3&noTotal=1&mul=1&div=1&add=1&sub=1&deltaMax=20&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=30091&cards=4&unknown=question&layout=4&title=Fiche%2024%20%E2%80%94%20Le%20d%C3%A9fi%20qui%20rebondit&print=correction"
];

test("six mondes : l'Enquête est UN monde 3 en trois parties, le Système le monde 4 en un livret", () => {
  assert.equal(MONDES.length, 6);
  assert.deepEqual(MONDES.map((m) => m.nom), [
    "Petit SPLAT!", "SPLAT! Classique", "SPLAT! Enquête", "SPLAT! Système", "SPLAT! Équations", "SPLAT! Relatifs"
  ]);
  assert.equal(ENQUETE.etapes.length, 15);
  assert.equal(ENQUETE.cls, "menq");
  assert.deepEqual(ENQUETE.volets.map((v) => [v.de, v.a, v.nom]), [
    [0, 5, "L\u2019enquête"], [5, 10, "La grande enquête"], [10, 15, "L\u2019enquête rebondit"]
  ]);
  assert.deepEqual(ENQUETE.etapes.map((e) => e.t), ENQ_FICHES.map((f) => f.t));
  /* lot M4-4 (04/10/2026) : le Système n'a plus qu'un livret, quatre fiches (25 à 28), donc plus
     de parties ; son deuxième tour (25d à 28d) est le Bonus du monde, à part
     (tests/splat-systeme-carte-mondes.test.mjs) */
  assert.equal(SYSTEME.etapes.length, 4);
  assert.equal(SYSTEME.cls, "msys");
  assert.equal(SYSTEME.actif, true);
  assert.equal(SYSTEME.volets, undefined);
  assert.deepEqual(SYSTEME.etapes.map((e) => e.t), SYS_FICHES.map((f) => f.t));
  /* chaque partie couvre exactement ses étapes, sans trou ni chevauchement */
  for (const m of [ENQUETE]) {
    let d = 0;
    for (const v of m.volets) { assert.equal(v.de, d, `${m.nom} : partie sans trou`); assert.ok(v.o.length > 20, `${m.nom} : phrase de la partie`); d = v.a; }
    assert.equal(d, m.etapes.length, `${m.nom} : la dernière partie va jusqu'au bout`);
  }
  assert.doesNotMatch(univers, /MONDE_GRANDE_ENQUETE|MONDES_ENQUETE\b/);
  assert.match(univers, /const MONDES_A_FICHES=\[\[MONDE_ENQUETE,ENQ_FICHES,"enq"\],\[MONDE_SYSTEME,SYS_FICHES,"sys"\]\];/);
});

test("E5 : aucune étoile déjà gagnée ne bouge — mêmes identifiants, mêmes parcours qu'avant la coupe", () => {
  /* Les étoiles cochées à la main sont rangées sous l'identifiant de l'étape. S'il suivait
     le rang de l'étape DANS son monde, la fiche 15 deviendrait « …-0 » : les étapes de
     l'Enquête portent donc leur identifiant d'avant la coupe (enq-0 … enq-9), en toutes
     lettres. Et l'identifiant d'un monde ne suit pas son numéro affiché. */
  assert.deepEqual(MONDES.map((m) => m.idp), ["e0", "e1", "enq", "sys", "e2", "e3"]);
  assert.match(univers, /function idEtape\(m,e,ei\)\{return e\.id\|\|\(m\.idp\+"-"\+ei\);\}/);
  assert.match(univers, /const ids=m\.etapes\.map\(\(e,ei\)=>idEtape\(m,e,ei\)\);/);
  assert.match(univers, /const id=idEtape\(m,e,ei\), li=document\.getElementById\(id\);/);
  assert.doesNotMatch(univers, /const ids=m\.etapes\.map\(\(_,ei\)=>m\.idp/, "l'ancien calcul (rang dans le monde) est revenu");
  const tous = MONDES.flatMap((m) => m.etapes.map((e, ei) => idEtape(m, e, ei)));
  /* lot Q2 (24/09) : « Écris l'équation » (e2-2, parcours m3e3) est retirée du monde 5 ;
     les autres étapes gardent leur identifiant (tests/splat-equations-monde5-progression.test.mjs) */
  /* lot « six mondes » : les anciens identifiants sont tous là, dans le même ordre relatif,
     et les nouveaux (enq-10 … enq-14, sys-0 … sys-9) s'intercalent sans en déplacer aucun */
  assert.deepEqual(tous, IDS_SIX_MONDES);
  assert.deepEqual(tous.filter((id) => IDS_AVANT_E5.includes(id)), IDS_AVANT_E5.filter((id) => id !== "e2-2" && id !== "e3-6"));   // e3-6 : lot R2 (monde 6 à six fiches)
  assert.deepEqual(LES_DEUX.map((e) => e.p), PARCOURS_ENQ_AVANT_E5);
  const parcours = MONDES.flatMap((m) => m.etapes.map((e) => e.p).filter(Boolean));
  assert.deepEqual(parcours, PARCOURS_SIX_MONDES);
  assert.equal(new Set(parcours).size, parcours.length, "deux étapes partagent un parcours");
  /* les identifiants des deux mondes à fiches sont écrits en toutes lettres, jamais recalculés */
  ENQUETE.etapes.forEach((e, i) => assert.equal(e.id, "enq-" + i));
  SYSTEME.etapes.forEach((e, i) => assert.equal(e.id, "sys-" + i));
});

test("l'empreinte de reprise des séries de l'Enquête est celle des fiches du lot 2", () => {
  /* outils/splat.html reprend une série en cours seulement si l'empreinte de son adresse
     (les réglages qui fixent les cartes, clés triées — eleveSignatureSerie) est la même :
     elle doit être celle des fiches figées au lot « fabrication des cinq livrets » (03/10/2026 ;
     les graines ont été retriées). Le monde 3 est en ligne pour tous depuis la PR #888 (seul le
     monde 4 reste caché, MONDES_EN_PREPARATION) : une série commencée avant ce lot repart du début. */
  const outil = lire("outils/splat.html");
  const hors = JSON.parse(outil.match(/const ELEVE_HORS_EMPREINTE = (\[[^\]]+\]);/)[1]);
  const empreinte = (url) => [...new URLSearchParams(url.split("?")[1])]
    .filter(([k]) => !hors.includes(k)).map(([k, v]) => k + "=" + v).sort().join("|");
  ENQUETE.etapes.forEach((e, i) => {
    assert.equal(empreinte(e.j), empreinte(ADRESSES_LOT2[2 * i]), `fiche ${10 + i}`);
    assert.match(empreinte(e.j), new RegExp("seed=" + ENQ_FICHES[i].q.match(/seed=(\d+)/)[1] + "\\|"));
  });
});

test("les notes du professeur restent parallèles aux mondes et à leurs étapes", () => {
  /* Un monde ajouté sans ses notes casse la vue prof : NOTES_PROF[mi][ei] serait
     undefined et la page s'arrêterait là. */
  assert.equal(NOTES_MONDE.length, MONDES.length);
  assert.equal(NOTES_PROF.length, MONDES.length);
  MONDES.forEach((m, mi) => {
    assert.equal(NOTES_PROF[mi].length, m.etapes.length, `notes du monde ${mi + 1}`);
    assert.ok(NOTES_MONDE[mi].length > 30, `note du monde ${mi + 1} trop courte`);
    /* une phrase courte par fiche (27/09/2026, demande de Gwenaël : « efficace, pas de blabla ») */
    NOTES_PROF[mi].forEach((n, ei) => assert.ok(n.length >= 10 && n.length <= 90, `note ${mi + 1}.${ei + 1} : ${n.length} caractères`));
  });
});

test("le numéro affiché d'une étape est continu dans tout l'univers", () => {
  /* Dans SPLAT!, le numéro de fiche EST le numéro d'étape : « Fiche 7 » du livret
     classique, c'est l'étape 7 du monde 2. Les fiches de l'Enquête sont donc les
     fiches 10 à 19, et le badge de la carte doit afficher le même nombre — c'est
     le compteur global du gabarit, que l'on refait ici. */
  let compteur = 0;
  const rangs = new Map();
  /* lot Q2 : un monde peut réserver des numéros (« premier ») — le monde 5 commence à 35 */
  /* l'échauffement du monde 6 (lot 3, 14/10/2026) : une étape à code (« É1 ») n'avance pas le compteur */
  MONDES.forEach((m) => { if (m.premier) compteur = Math.max(compteur, m.premier - 1); m.etapes.forEach((e) => rangs.set(e, e.code || ++compteur)); });
  assert.match(univers, /const depart=MONDES\.slice\(0,MONDES\.indexOf\(m\)\)/);
  assert.deepEqual(ENQUETE.etapes.map((e) => rangs.get(e)), [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
  assert.deepEqual(SYSTEME.etapes.map((e) => rangs.get(e)), [25, 26, 27, 28]);
  /* lot M4-4 : 29 à 34 restent libres, « premier » du monde 5 resaute jusqu'à 35 (les fiches 35
     à 37 déjà imprimées ne bougent pas) */
  assert.equal(MONDES[4].premier, 35);
  assert.deepEqual(MONDES[4].etapes.map((e) => rangs.get(e)), [35, 36, 37]);
  [...ENQUETE.etapes, ...SYSTEME.etapes].forEach((e) => {
    const n = rangs.get(e);
    assert.equal(e.n, n, "le numéro écrit dans l'étape suit le compteur du gabarit");
    assert.equal(decodeURIComponent(new URLSearchParams(e.f.split("?")[1]).get("title")),
      `Fiche ${n} \u2014 ${e.t}`);
    assert.equal(decodeURIComponent(new URLSearchParams(e.c.split("?")[1]).get("title")),
      `Fiche ${n} \u2014 ${e.t}`);
  });
  assert.equal(compteur, 43);   // lot R2 : le monde 6 a six fiches (38 à 43)
});

test("les trente adresses des fiches sont exactement celles de la progression v3 (cinq livrets, 03/10/2026)", () => {
  const rendues = ENQUETE.etapes.flatMap((e) => [e.f, e.c]);
  assert.deepEqual(rendues, ADRESSES_LOT2);
  assert.deepEqual(ENQ_FICHES.map((f) => f.q.match(/seed=(\d+)/)[1]),
    ["51", "74", "12287", "30140", "6176290", "1800", "871", "3485", "962412", "8562429", "14", "21800", "159", "9", "30091"]);
  /* le schéma vide sous la carte 1 (lot 1) : les fiches qui apportent un dessin, 12, 13, 17, 18 et 22 */
  assert.deepEqual(ENQ_FICHES.map((f, i) => (/(^|&)modele=1(&|$)/.test(f.q) ? 10 + i : 0)).filter(Boolean), [12, 13, 17, 18, 22]);
  /* la consigne en gras ne concerne que les fiches 11, 16 et 23 (rangs 2, 7 et 14) */
  assert.deepEqual(ENQ_FICHES.map((f, i) => (f.note ? i + 1 : 0)).filter(Boolean), [2, 7, 14]);
});

test("le jeu de l'élève reprend les réglages de la fiche, sans rien d'impression", () => {
  ENQUETE.etapes.forEach((e, i) => {
    const jeu = new URLSearchParams(e.j.split("?")[1]);
    const fiche = new URLSearchParams(e.f.split("?")[1]);
    assert.equal(jeu.get("eleve"), "1");
    assert.equal(jeu.get("parcours"), "enq" + (10 + i));
    assert.equal(e.p, "enq" + (10 + i));
    for (const trop of ["print", "layout", "note", "title"]) {
      assert.equal(jeu.get(trop), null, `${trop} n'a rien à faire dans le lien du jeu (fiche ${i + 1})`);
    }
    for (const [cle, valeur] of fiche) {
      if (["print", "layout", "note", "title"].includes(cle)) continue;
      assert.equal(jeu.get(cle), valeur, `${cle} diffère entre la fiche et le jeu (fiche ${i + 1})`);
    }
    assert.equal(fiche.get("print"), "statement");
    assert.equal(new URLSearchParams(e.c.split("?")[1]).get("print"), "correction");
  });
});

test("la page courte des QR vise exactement les liens de la carte des mondes", () => {
  assert.match(courte, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/splat_univers\.html">/);
  assert.match(courte, /<meta name="robots" content="noindex, follow">/);
  const ctxCourte = vm.createContext({});
  assert.match(courte, /var ENQ_DEPART = 10;/);
  const debut = courte.indexOf("var ENQ = [");
  vm.runInContext(courte.slice(debut, courte.indexOf("var f =")) + ";globalThis.ENQ=ENQ;",
    ctxCourte, { filename: "livret/index.html" });
  assert.deepEqual(JSON.parse(JSON.stringify(ctxCourte.ENQ)), ENQ_FICHES.map((f) => f.q));
  ENQUETE.etapes.forEach((e, i) => {
    const cible = "/splat/classique/?" + ctxCourte.ENQ[i] + "&cards=4&unknown=question&eleve=1&parcours=enq" + (10 + i);
    assert.equal(cible, e.j, `?f=${10 + i}`);
    assert.ok(courte.includes(e.j.replace(/&/g, "&amp;")), `lien de repli de la fiche ${i + 1}`);
  });
});

test("le chiffre du badge tombe sur le centre visuel de la tache", () => {
  /* La tache a sa masse en haut (centre de gravité 2,6 unités au-dessus du
     centre de sa boîte de 110) et le chiffre, centré sur sa boîte de ligne,
     tombe encore plus bas : la boîte réserve la place des jambages. */
  assert.match(univers, /\.badge \.n\{color:var\(--ink\);transform:translateY\(-1\.3px\)\}/);
  assert.doesNotMatch(univers, /transform:translate\(-0\.5px,1\.5px\)/);
});

test("le monde porte le framboise, et cette couleur n'était prise par personne", () => {
  assert.match(univers, /--framboise:#be185d;/);
  assert.match(univers, /\.monde\.menq>\.head\{background:var\(--framboise\)\}/);
  assert.match(univers, /\.menq \.etape\.done \.badge use\.fond\{fill:var\(--framboise\)\}/);
  assert.match(univers, /\.menq \.actions a\.jouer\{background:var\(--framboise\)\}/);
  assert.deepEqual(MONDES.filter((m) => m.cls === "menq").map((m) => m.nom), ["SPLAT! Enquête"]);
  for (const deja of ["#08aaa5", "#0b67b2", "#f58220", "#7b42b4", "#92400e"]) {
    assert.notEqual(deja, "#be185d");
  }
});

test("six mondes : les parties sont des intertitres dans la liste, un par livret, avec leurs étoiles", () => {
  /* Les anciens intertitres (lot E3, e.g / groupeTitre) ne reviennent pas : les parties
     sont des « volets » du monde, rendus comme un <li class="volet"> devant leur première étape. */
  MONDES.forEach((m) => m.etapes.forEach((e) => assert.equal(e.g, undefined, `${m.nom} n'a pas d'intertitre d'étape`)));
  assert.doesNotMatch(univers, /groupeTitre|Les enquêtes additives|Les enquêtes multiplicatives/);
  assert.match(univers, /const v=\(m\.volets\|\|\[\]\)\.find\(x=>x\.de===ei\), vi=\(m\.volets\|\|\[\]\)\.indexOf\(v\);/);
  /* depuis le 04/10/2026, chaque partie est un menu déroulant (voletHtml, vue élève) : même id,
     même pastille, mêmes fiches, mêmes étoiles ; ses étapes portent data-partie. Depuis le lot 2
     « la carte des mondes » (08/11/2026) : la pastille et les étoiles sont sur le BOUTON de la
     partie (partieBtnHtml), le <li class="volet"> garde l'id, le titre, les fiches et la phrase */
  /* lot 3 de l'échauffement (14/10/2026) : l'id, la pastille et les fiches de la partie viennent de
     partieId / partieRang / partieFiches — « Partie N » ne compte pas l'échauffement (monde 6) */
  assert.match(univers, /const volet=!v\?'':voletHtml\(partieId\(m,v,vi\),partieCle\(v,vi\),v\.nom,\s*partieFiches\(m,v,compteur\),v\.o,v\.ech\?' ech':''\);/);
  assert.match(univers, /\(m\.volets\|\|\[\]\)\.map\(\(v,vi\)=>partieBtnHtml\(partieCle\(v,vi\),partieRang\(m,v,vi\),'stars'\+mi\+'-'\+vi,v\.ech\?' ech':''\)\)/);
  assert.match(univers, /function partieRang\(m,v,vi\)\{return v\.ech\?"Échauffement":"Partie "\+partieNum\(m,vi\);\}/);
  assert.match(univers, /function partieId\(m,v,vi\)\{return m\.idp\+\(v\.ech\?"-echauffement":"-partie-"\+partieNum\(m,vi\)\);\}/);
  /* lot 5b (08/11/2026) : au monde 4, « sansTitre » (la partie « Les étapes », sans titre) vient devant */
  assert.match(univers, /return sansTitre\+volet\+'<li class="etape'\+\(e\.code\?' code':''\)\+'" id="'\+ids\[ei\]\+'"'\+\(clePartie!==null\?' data-partie="'\+clePartie\+'"':''\)\+'>'/);
  /* les étoiles de la partie : comptées sur ses étapes (de ≤ ei < a), dans majAffichage */
  assert.match(univers, /'<span class="stars" id="'\+idStars\+'"><\/span><\/button>'/);
  assert.match(univers, /for\(let ei=v\.de;ei<v\.a;ei\+\+\)\{ if\(document\.getElementById\(idEtape\(m,m\.etapes\[ei\],ei\)\)\.classList\.contains\("done"\)\) fv\+\+; \}/);
  assert.match(univers, /sv\.textContent="\u2b50 "\+fv\+" \/ "\+\(v\.a-v\.de\);/);
  /* le monde ne compte que des parties de 5 fiches : un livret chacune */
  ENQUETE.volets.forEach((v) => assert.equal(v.a - v.de, 5, `${ENQUETE.nom} · ${v.nom}`));
  /* vue prof (décision du 27/09/2026, comme aux mondes 1, 2, 5 et 6) : plus de PDF sous les
     parties de l'Enquête et du Système — un seul lien, vers la page des livrets, dans le cadre
     « Pour la classe » ; ces livrets y sont, onglets 3 et 4 */
  ENQUETE.volets.forEach((v) => assert.equal(v.livrets, undefined, `${ENQUETE.nom} · ${v.nom}`));
  assert.doesNotMatch(univers, /LIVRETS_ENQ|LIVRETS_SYS|\.pdf"/);
  const page = readFileSync(new URL("../outils/livrets_splat.html", import.meta.url), "utf8");
  const onglet = (n) => page.slice(page.indexOf(`id="monde-${n}"`), page.indexOf(`id="monde-${n + 1}"`));
  // (03/10/2026) cinq livrets — les trois de base, puis les deux « Deuxième tour »
  for (const nom of ["enquete_additif", "enquete_multiplicatif", "enquete_rebondit", "enquete_tour2_dessins", "enquete_tour2_systeme"])
    for (const suf of ["", "_a_plier"]) assert.ok(onglet(3).includes(`href="/outils/livret_splat_${nom}${suf}.pdf"`), nom + suf);
  // lot M4-4 (04/10/2026) : le livret du monde 4 et son deuxième tour ; plus de « suite »
  for (const nom of ["systeme", "systeme_tour2"])
    for (const suf of ["", "_a_plier"]) assert.ok(onglet(4).includes(`href="/outils/livret_splat_${nom}${suf}.pdf"`), nom + suf);
  assert.doesNotMatch(univers, /m===MONDE_ENQUETE&&PROF|m===MONDE_GRANDE_ENQUETE&&PROF/);
  assert.ok(!onglet(4).includes("systeme_suite"), "les anciens livrets « suite » ont quitté la page");
});

test("la correction n'est offerte qu'en vue professeur", () => {
  /* Depuis le lot « vue prof » (27/09/2026), la vue prof a son propre rendu (actionsHtml) et la
     boucle de la vue élève n'a plus aucune branche prof : on isole cette boucle, on vérifie qu'on
     l'a bien trouvée (« Je joue », « J'ai réussi »), puis qu'elle n'offre ni correction ni fiche. */
  const eleve = univers.slice(univers.indexOf("else MONDES.forEach((m,mi)=>{"), univers.indexOf("  main.appendChild(sec);\n});"));
  assert.ok(eleve.includes(" Je joue</a>") && eleve.includes("faitBtn"), "la boucle de la vue élève n'a pas été isolée");
  assert.ok(!/e\.c\b|e\.c2/.test(eleve), "la correction ne doit pas être offerte à l'élève");
  const prof = univers.slice(univers.indexOf("function actionsHtml(e,m,cid){"), univers.indexOf("function plagesFiches("));
  assert.ok(prof.includes("if(e.c&&e.c2) a.push(btnSeg('corrige','Corrigé',[['4 par page',e.c],['2 par page',e.c2]]));"), "Corrigé 4 / 2 par page en vue prof");
  /* lot M4-4 : le Système a ses deux corrigés, comme ses livrets — « avec les taches », « en lettres » */
  assert.ok(prof.includes("if(e.c&&e.cl) a.push(btnSeg('corrige','Corrigé',[['taches',e.c],['lettres',e.cl]]));"), "Corrigé taches / lettres en vue prof");
  assert.ok(prof.includes("else if(e.c) a.push(btnTrait(e.c,'corrige','Corrigé'"), "Corrigé en vue prof");
  [...ENQUETE.etapes, ...SYSTEME.etapes].forEach((e) => assert.ok(e.c, `correction de la fiche ${e.n}`));
  SYSTEME.etapes.forEach((e) => {
    assert.equal(e.c2, undefined, `fiche ${e.n} : la fiche est déjà en 2 par page`);
    assert.match(e.c, /&layout=2&/);
    assert.equal(e.cl, e.c.replace("&unknown=question&", "&unknown=letter&"), `corrigé en lettres de la fiche ${e.n}`);
  });
});

test("les textes qui comptent les mondes suivent l'ajout", () => {
  const total = MONDES.reduce((n, m) => n + m.etapes.length, 0);
  assert.equal(total, 40); // l'échauffement du monde 6 (lot 3, 14/10/2026) : + 3, dans le total ; lot R2 : monde 6 à six fiches ; lot « six mondes » : + 5 (3e partie de l'Enquête) ; lot M4-4 : le Système à 4 fiches (le Bonus est hors du total)
  assert.match(univers, new RegExp(`id="totalTxt">0 / ${total} étoiles<`));
  assert.match(univers, /Traverse les six mondes/);
  /* le pied de la carte (relecture du monde 1, 25/09/2026) : les crédits de la page des
     livrets, plus la liste des mondes ni le lien « vue professeur » en double */
  assert.doesNotMatch(univers, /progression cycle 3 en quatre séquences/);
  assert.match(univers, /<span class="credits">Jeu <strong>SPLAT!<\/strong> créé par Steve Wyborney/);
  /* 07/10/2026 (Gwenaël) : plus aucune mention de la progression, ni dans le pied de la vue
     prof (« mondes 1, 2 et 3 d'après la progression… », lien Digipad), ni dans la description */
  assert.doesNotMatch(univers, /d\\u2019apr\\u00e8s la progression|prolongements maths&go|progression SPLAT!/);
  assert.doesNotMatch(univers, /quatre mondes|cinq mondes/i);
  assert.match(univers, /content="Six mondes à jouer en ligne/);
  // les notes du professeur qui citent un numéro de monde suivent aussi
  assert.ok(NOTES_MONDE[5].endsWith("Après le monde 5."));
  assert.equal(NOTES_PROF[5].length, 9);   // l'échauffement É1-É3 (lot 3, 14/10/2026), puis les fiches 38 à 43
  // le catalogue et la page de toutes les ressources (lot E5)
  const catalogue = lire("assets/js/catalogue-refonte-data.js");
  assert.equal((catalogue.match(/[Ss]ix mondes \\u00e0 jouer en ligne/g) || []).length, 2);
  assert.doesNotMatch(catalogue, /[Cc]inq mondes/);
  assert.match(lire("outils/toutes-les-ressources.html"), /Six mondes à jouer en ligne/);
});
