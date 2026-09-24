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
  ";globalThis.X={MONDES,NOTES_MONDE,NOTES_PROF,ENQ_FICHES};",
  ctx, { filename: "splat_univers.html" }
);
/* Les objets nés dans le bac à sable de vm n'ont pas les mêmes prototypes que
   ceux d'ici : on les recopie pour que deepEqual compare les valeurs. */
const { MONDES, NOTES_MONDE, NOTES_PROF, ENQ_FICHES } = JSON.parse(JSON.stringify(ctx.X));
/* Lot E5 (23/09/2026) : l'Enquête est coupée en deux mondes, un par livret. */
const ENQUETE = MONDES[2], GRANDE = MONDES[3];
const LES_DEUX = [...ENQUETE.etapes, ...GRANDE.etapes];

/* AVANT la coupe (lot E4) : l'identifiant de chaque étape, dans l'ordre de la carte, et
   son parcours. Relevé en exécutant la carte des mondes du lot E4. Une étoile cochée à la
   main est rangée sous l'identifiant, une étoile gagnée en ligne sous le parcours : si
   l'un ou l'autre bouge, des étoiles déjà gagnées disparaissent. */
const IDS_AVANT_E5 = ["e0-0", "e0-1", "e0-2", "e0-3", "e0-4", "e0-5", "e1-0", "e1-1", "e1-2",
  "enq-0", "enq-1", "enq-2", "enq-3", "enq-4", "enq-5", "enq-6", "enq-7", "enq-8", "enq-9",
  "e2-0", "e2-1", "e2-2", "e2-3", "e3-0", "e3-1", "e3-2", "e3-3", "e3-4", "e3-5", "e3-6"];
const PARCOURS_ENQ_AVANT_E5 = ["enq10", "enq11", "enq12", "enq13", "enq14", "enq15", "enq16", "enq17", "enq18", "enq19"];
/* le gabarit calcule l'identifiant ainsi (idEtape) : on refait le même calcul */
const idEtape = (m, e, ei) => e.id || (m.idp + "-" + ei);

/* Les 20 adresses figées au lot E0. Une graine ou un réglage qui bouge ici,
   ce sont les fiches et les deux livrets à refaire. */
const ADRESSES_E0 = [
  /* fiche 10 */ "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30&seed=339&cards=4&unknown=question&layout=4&title=Fiche%2010%20%E2%80%94%20De%20plus%20que&print=statement",
                 "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30&seed=339&cards=4&unknown=question&layout=4&title=Fiche%2010%20%E2%80%94%20De%20plus%20que&print=correction",
  /* fiche 11 */ "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=0&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30&seed=1071&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2011%20%E2%80%94%20De%20moins%20que&print=statement",
                 "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=0&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30&seed=1071&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2011%20%E2%80%94%20De%20moins%20que&print=correction",
  /* fiche 12 */ "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50&seed=918&cards=4&unknown=question&layout=4&title=Fiche%2012%20%E2%80%94%20Plus%20ou%20moins&print=statement",
                 "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50&seed=918&cards=4&unknown=question&layout=4&title=Fiche%2012%20%E2%80%94%20Plus%20ou%20moins&print=correction",
  /* fiche 13 */ "/splat/classique/?mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=290&cards=4&unknown=question&layout=4&title=Fiche%2013%20%E2%80%94%20Trois%20taches%20en%20cha%C3%AEne&print=statement",
                 "/splat/classique/?mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=290&cards=4&unknown=question&layout=4&title=Fiche%2013%20%E2%80%94%20Trois%20taches%20en%20cha%C3%AEne&print=correction",
  /* fiche 14 */ "/splat/classique/?mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=950&cards=4&unknown=question&layout=4&title=Fiche%2014%20%E2%80%94%20Le%20d%C3%A9fi%20additif&print=statement",
                 "/splat/classique/?mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=950&cards=4&unknown=question&layout=4&title=Fiche%2014%20%E2%80%94%20Le%20d%C3%A9fi%20additif&print=correction",
  /* fiche 15 */ "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40&seed=1372&cards=4&unknown=question&layout=4&title=Fiche%2015%20%E2%80%94%20Fois%20plus&print=statement",
                 "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40&seed=1372&cards=4&unknown=question&layout=4&title=Fiche%2015%20%E2%80%94%20Fois%20plus&print=correction",
  /* fiche 16 */ "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40&seed=1343&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2016%20%E2%80%94%20Fois%20moins&print=statement",
                 "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40&seed=1343&cards=4&unknown=question&layout=4&note=Reformule%20l%E2%80%99indice%20avant%20de%20dessiner%20ton%20sch%C3%A9ma.&title=Fiche%2016%20%E2%80%94%20Fois%20moins&print=correction",
  /* fiche 17 */ "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50&seed=405&cards=4&unknown=question&layout=4&title=Fiche%2017%20%E2%80%94%20Les%20quatre%20op%C3%A9rations&print=statement",
                 "/splat/classique/?mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50&seed=405&cards=4&unknown=question&layout=4&title=Fiche%2017%20%E2%80%94%20Les%20quatre%20op%C3%A9rations&print=correction",
  /* fiche 18 */ "/splat/classique/?mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1313&cards=4&unknown=question&layout=4&title=Fiche%2018%20%E2%80%94%20Trois%20taches%2C%204%20op%C3%A9rations&print=statement",
                 "/splat/classique/?mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1313&cards=4&unknown=question&layout=4&title=Fiche%2018%20%E2%80%94%20Trois%20taches%2C%204%20op%C3%A9rations&print=correction",
  /* fiche 19 */ "/splat/classique/?mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=537&cards=4&unknown=question&layout=4&title=Fiche%2019%20%E2%80%94%20Le%20grand%20d%C3%A9fi&print=statement",
                 "/splat/classique/?mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=537&cards=4&unknown=question&layout=4&title=Fiche%2019%20%E2%80%94%20Le%20grand%20d%C3%A9fi&print=correction"
];

test("E5 : l'Enquête est coupée en deux mondes — 3 « SPLAT! Enquête », 4 « SPLAT! Grande enquête », cinq étapes chacun", () => {
  assert.equal(MONDES.length, 6);
  assert.deepEqual(MONDES.map((m) => m.nom), [
    "Petit SPLAT!", "SPLAT! classique", "SPLAT! Enquête", "SPLAT! Grande enquête", "SPLAT! Équations", "SPLAT! relatifs"
  ]);
  for (const m of [ENQUETE, GRANDE]) {
    assert.equal(m.etapes.length, 5, m.nom);
    assert.equal(m.actif, true, m.nom);
    assert.equal(m.cls, "menq", `${m.nom} : le même framboise, c'est la même enquête`);
  }
  assert.deepEqual(LES_DEUX.map((e) => e.t), ENQ_FICHES.map((f) => f.t));
  assert.match(GRANDE.desc, /^L\u2019enquête continue : cette fois, les indices multiplient et partagent/);
  assert.match(univers, /const MONDES_ENQUETE=\[MONDE_ENQUETE,MONDE_GRANDE_ENQUETE\];/);
});

test("E5 : aucune étoile déjà gagnée ne bouge — mêmes identifiants, mêmes parcours qu'avant la coupe", () => {
  /* Les étoiles cochées à la main sont rangées sous l'identifiant de l'étape. S'il suivait
     le rang de l'étape DANS son monde, la fiche 15 deviendrait « …-0 » : les étapes de
     l'Enquête portent donc leur identifiant d'avant la coupe (enq-0 … enq-9), en toutes
     lettres. Et l'identifiant d'un monde ne suit pas son numéro affiché. */
  assert.deepEqual(MONDES.map((m) => m.idp), ["e0", "e1", "enq", "enq", "e2", "e3"]);
  assert.match(univers, /function idEtape\(m,e,ei\)\{return e\.id\|\|\(m\.idp\+"-"\+ei\);\}/);
  assert.match(univers, /const ids=m\.etapes\.map\(\(e,ei\)=>idEtape\(m,e,ei\)\);/);
  assert.match(univers, /const id=idEtape\(m,e,ei\), li=document\.getElementById\(id\);/);
  assert.doesNotMatch(univers, /const ids=m\.etapes\.map\(\(_,ei\)=>m\.idp/, "l'ancien calcul (rang dans le monde) est revenu");
  const tous = MONDES.flatMap((m) => m.etapes.map((e, ei) => idEtape(m, e, ei)));
  /* lot Q2 (24/09) : « Écris l'équation » (e2-2, parcours m3e3) est retirée du monde 5 ;
     les autres étapes gardent leur identifiant (tests/splat-equations-monde5-progression.test.mjs) */
  assert.deepEqual(tous, IDS_AVANT_E5.filter((id) => id !== "e2-2"));
  assert.deepEqual(LES_DEUX.map((e) => e.p), PARCOURS_ENQ_AVANT_E5);
  const parcours = MONDES.flatMap((m) => m.etapes.map((e) => e.p).filter(Boolean));
  assert.equal(new Set(parcours).size, parcours.length, "deux étapes partagent un parcours");
});

test("E5 : l'empreinte de reprise des séries de l'Enquête ne bouge pas", () => {
  /* outils/splat.html reprend une série en cours seulement si l'empreinte de son adresse
     (les réglages qui fixent les cartes, clés triées — eleveSignatureSerie) est la même :
     elle doit rester celle des fiches figées au lot E0. */
  const outil = lire("outils/splat.html");
  const hors = JSON.parse(outil.match(/const ELEVE_HORS_EMPREINTE = (\[[^\]]+\]);/)[1]);
  const empreinte = (url) => [...new URLSearchParams(url.split("?")[1])]
    .filter(([k]) => !hors.includes(k)).map(([k, v]) => k + "=" + v).sort().join("|");
  LES_DEUX.forEach((e, i) => {
    assert.equal(empreinte(e.j), empreinte(ADRESSES_E0[2 * i]), `fiche ${10 + i}`);
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
    assert.ok(NOTES_MONDE[mi].length > 40, `note du monde ${mi + 1} trop courte`);
    NOTES_PROF[mi].forEach((n, ei) => assert.ok(n.length > 30, `note ${mi + 1}.${ei + 1}`));
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
  MONDES.forEach((m) => { if (m.premier) compteur = Math.max(compteur, m.premier - 1); m.etapes.forEach((e) => rangs.set(e, ++compteur)); });
  assert.match(univers, /const depart=MONDES\.slice\(0,MONDES\.indexOf\(m\)\)/);
  assert.deepEqual(ENQUETE.etapes.map((e) => rangs.get(e)), [10, 11, 12, 13, 14]);
  assert.deepEqual(GRANDE.etapes.map((e) => rangs.get(e)), [15, 16, 17, 18, 19]);
  LES_DEUX.forEach((e) => {
    const n = rangs.get(e);
    assert.equal(e.n, n, "le numéro écrit dans l'étape suit le compteur du gabarit");
    assert.equal(decodeURIComponent(new URLSearchParams(e.f.split("?")[1]).get("title")),
      `Fiche ${n} \u2014 ${e.t}`);
    assert.equal(decodeURIComponent(new URLSearchParams(e.c.split("?")[1]).get("title")),
      `Fiche ${n} \u2014 ${e.t}`);
  });
  assert.equal(compteur, 44);
});

test("les vingt adresses des fiches sont exactement celles du lot E0", () => {
  const rendues = LES_DEUX.flatMap((e) => [e.f, e.c]);
  assert.deepEqual(rendues, ADRESSES_E0);
  assert.deepEqual(ENQ_FICHES.map((f) => f.q.match(/seed=(\d+)/)[1]),
    ["339", "1071", "918", "290", "950", "1372", "1343", "405", "1313", "537"]);
  /* la consigne en gras ne concerne que les fiches 2 et 7 */
  assert.deepEqual(ENQ_FICHES.map((f, i) => (f.note ? i + 1 : 0)).filter(Boolean), [2, 7]);
});

test("le jeu de l'élève reprend les réglages de la fiche, sans rien d'impression", () => {
  LES_DEUX.forEach((e, i) => {
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
  LES_DEUX.forEach((e, i) => {
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
  // lot E5 : le monde 4 (Grande enquête) porte le même framboise, par la même classe
  assert.deepEqual(MONDES.filter((m) => m.cls === "menq").map((m) => m.nom), ["SPLAT! Enquête", "SPLAT! Grande enquête"]);
  for (const deja of ["#08aaa5", "#0b67b2", "#f58220", "#7b42b4"]) {
    assert.notEqual(deja, "#be185d");
  }
});

test("E5 : plus d'intertitre dans la liste des étapes — chaque monde de l'Enquête a son titre et sa phrase", () => {
  /* Les intertitres « Les enquêtes additives » / « … multiplicatives et mélangées » coupaient
     les dix étapes du monde unique ; un par monde, ils feraient doublon (décision du 23/09). */
  MONDES.forEach((m) => m.etapes.forEach((e) => assert.equal(e.g, undefined, `${m.nom} n'a pas d'intertitre`)));
  assert.doesNotMatch(univers, /groupeTitre/);
  assert.doesNotMatch(univers, /Les enquêtes additives|Les enquêtes multiplicatives/);
});

test("la correction n'est offerte qu'en vue professeur", () => {
  /* e.c n'apparaît que dans la branche PROF du gabarit : l'élève ne voit
     que « Je joue ». La branche élève commence au bloc d'actions qui porte
     « Je joue » ; on vérifie qu'on l'a trouvée avant de la lire (le gabarit
     écrit l'emoji en clair : le chercher sous sa forme échappée ne trouvait
     rien, et la vérification ne portait plus que sur le dernier caractère). */
  const gabarit = univers.slice(univers.indexOf("'<ol class=\"etapes\">'"), univers.indexOf("main.appendChild(sec)"));
  const jeJoue = gabarit.indexOf(" Je joue</a>");
  assert.ok(jeJoue > 0, "le lien « Je joue » de la vue élève est introuvable dans le gabarit");
  const eleve = gabarit.slice(gabarit.lastIndexOf("'<div class=\"actions\">'", jeJoue));
  assert.ok(eleve.includes("faitBtn"), "la branche élève du gabarit n'a pas été isolée");
  assert.ok(gabarit.includes("e.c?'<a class=\"fiche\""), "le lien Correction manque en vue prof");
  assert.ok(!eleve.includes("e.c"), "la correction ne doit pas être offerte à l'élève");
  LES_DEUX.forEach((e, i) => assert.ok(e.c, `correction de la fiche ${10 + i}`));
});

test("les textes qui comptent les mondes suivent l'ajout", () => {
  const total = MONDES.reduce((n, m) => n + m.etapes.length, 0);
  assert.equal(total, 29); // lot Q2 : le monde 5 passe de 4 à 3 étapes
  assert.match(univers, new RegExp(`id="totalTxt">0 / ${total} étoiles<`));
  assert.match(univers, /Traverse les six mondes/);
  assert.match(univers, /monde 6 : prolongement relatifs \(cycle 4\)/);
  assert.match(univers, /mondes 1 \\u00e0 5 d\\u2019apr\\u00e8s la progression/);
  assert.match(univers, /\(monde 6 : prolongement maths&go, cycle 4\)/);
  assert.doesNotMatch(univers, /quatre mondes|cinq mondes/i);
  assert.match(univers, /content="Six mondes à jouer en ligne/);
  // les notes du professeur qui citent un numéro de monde suivent aussi
  assert.ok(NOTES_MONDE[5].endsWith("À réserver aux élèves qui ont terminé le monde 5."));
  assert.ok(NOTES_PROF[5][3].includes("le geste du monde 5, transposé aux relatifs"));
  // le catalogue et la page de toutes les ressources (lot E5)
  const catalogue = lire("assets/js/catalogue-refonte-data.js");
  assert.equal((catalogue.match(/[Ss]ix mondes \\u00e0 jouer en ligne/g) || []).length, 2);
  assert.doesNotMatch(catalogue, /[Cc]inq mondes/);
  assert.match(lire("outils/toutes-les-ressources.html"), /Six mondes à jouer en ligne/);
});
