import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot « six mondes » (24/09/2026) — SPLAT! Système entre dans la carte des mondes
   (monde 4, fiches 25 à 34, deux parties), la carte se replie en accordéon, et un
   bouton « Continuer » mène à la prochaine étoile. Comme pour l'Enquête, on EXÉCUTE
   les données de outils/splat_univers.html plutôt que d'y chercher du texte. */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const courte = lire("splat/systeme/livret/index.html");

function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("const NOTES_MONDE", "const main=document") +
  ";globalThis.X={MONDES,NOTES_MONDE,NOTES_PROF,SYS_FICHES};",
  ctx, { filename: "splat_univers.html" }
);
const { MONDES, NOTES_MONDE, NOTES_PROF, SYS_FICHES } = JSON.parse(JSON.stringify(ctx.X));
const SYSTEME = MONDES[3];

/* Les adresses des fiches 25 à 34, figées au lot « fiches 20-34 » (splat-systemes-fiches-25-34-adresses.md,
   24/09/2026). Une graine ou un réglage qui bouge ici, ce sont les fiches, les PDF et les
   livrets du Système à refaire — et les cartes des livrets déjà imprimés ne correspondraient plus. */
const BASE = "/splat/classique/?";
const FIN = "&cards=4&unknown=question";
const FICHES_25_34 = [
  [25, "Une partie du plateau", "mode=D&geste=EMBOITE1&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2105"],
  [26, "Avec des jetons visibles", "mode=D&geste=EMBOITE1&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=9244"],
  [27, "Une partie connue", "mode=D&geste=PARTIELLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2828"],
  [28, "Deux pesées", "mode=D&geste=COEF&coefMax=3&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1214"],
  [29, "Le défi des plateaux", "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=7984"],
  [30, "Trois paires", "mode=D&geste=TROIS&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=653"],
  [31, "Doubler, puis comparer", "mode=D&geste=DOUBLE&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=175"],
  [32, "En miroir", "mode=D&geste=MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=609"],
  [33, "Doubler ou miroir ?", "mode=D&geste=MIX&gestes=DOUBLE,MIROIR&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1287"],
  [34, "Le grand défi du Système", "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=11674"]
];
const titre = (n, t) => encodeURIComponent(`Fiche ${n} — ${t}`);

test("Système : dix étapes, les réglages et les graines des fiches 25 à 34, rien d'autre", () => {
  assert.equal(SYSTEME.nom, "SPLAT! Système");
  assert.deepEqual(SYS_FICHES.map((f) => f.q), FICHES_25_34.map((f) => f[2]));
  assert.deepEqual(SYSTEME.etapes.map((e) => [e.n, e.t]), FICHES_25_34.map((f) => [f[0], f[1]]));
  SYSTEME.etapes.forEach((e, i) => {
    const [n, t, q] = FICHES_25_34[i];
    assert.equal(e.j, BASE + q + FIN + "&eleve=1&parcours=sys" + n, `jeu de la fiche ${n}`);
    assert.equal(e.jp, BASE + q + FIN, `projection de la fiche ${n}`);
    assert.equal(e.f, BASE + q + FIN + "&layout=4&title=" + titre(n, t) + "&print=statement", `fiche ${n}`);
    assert.equal(e.c, BASE + q + FIN + "&layout=4&title=" + titre(n, t) + "&print=correction", `correction ${n}`);
    assert.equal(e.c2, BASE + q + FIN + "&layout=2&title=" + titre(n, t) + "&print=correction", `correction 2 par page ${n}`);
    assert.equal(e.p, "sys" + n);
    assert.equal(e.id, "sys-" + i);
    assert.ok(e.o.length > 20, `phrase de la fiche ${n}`);
    assert.equal(e.note, undefined, "aucune consigne en gras au Système");
  });
  /* aucun nombre à sous-entendu dans ce que l'élève lit */
  const lu = [SYSTEME.desc, ...SYSTEME.volets.map((v) => v.o), ...SYSTEME.etapes.map((e) => e.t + " " + e.o)].join(" ");
  assert.doesNotMatch(lu, /\b69\b/);
});

test("Système : le monde porte le cannelle des fiches, et cette couleur n'était prise par personne", () => {
  assert.match(univers, /--cannelle:#92400e;/);
  assert.match(univers, /\.monde\.msys>\.head\{background:var\(--cannelle\)\}/);
  assert.match(univers, /\.msys \.etape\.done \.badge use\.fond\{fill:var\(--cannelle\)\}/);
  assert.match(univers, /\.msys \.actions a\.jouer\{background:var\(--cannelle\)\}/);
  assert.match(univers, /\.msys \.badge use\.fond\{fill:#edcbb3\}/);
  assert.match(univers, /\.msys \.volet \.rang\{background:var\(--cannelle\)\}/);
  for (const deja of ["#08aaa5", "#0b67b2", "#f58220", "#7b42b4", "#be185d"]) assert.notEqual(deja, "#92400e");
  assert.deepEqual(MONDES.filter((m) => m.cls === "msys").map((m) => m.nom), ["SPLAT! Système"]);
});

test("Système : la note du professeur porte le tableau de tous les systèmes du collège (S0 § 0)", () => {
  const note = NOTES_MONDE[3];
  assert.match(note, /l'Enquête, c'est un indice qui compare deux taches/);
  assert.match(note, /le Système, c'est un indice qui donne un total partiel/);
  assert.match(note, /<table><tr><th>Ce que dit l'énoncé<\/th><th>Où dans SPLAT!<\/th><th>Programme<\/th><\/tr>/);
  assert.equal((note.match(/<tr>/g) || []).length, 11, "l'en-tête et les dix lignes du tableau");
  assert.match(note, /volontairement hors SPLAT!/);
  /* lot « vue prof » (27/09/2026) : le tableau passe dans un « Repère » replié (<details>), hors
     du <p> de l'intention (un <table> ferme un <p> et sortirait du texte) */
  assert.match(univers, /return '<p class="txt">'\+avant\+'<\/p><details><summary>Repère : tous les systèmes du collège, et où ils sont dans SPLAT!<\/summary>'\+t\.slice\(k\)\+'<\/details>';/);
  assert.match(univers, /\.pIntro details table\{border-collapse:collapse;/);
  assert.equal(NOTES_PROF[3].length, 10);
  assert.equal(NOTES_PROF[2].length, 15);
  assert.match(NOTES_MONDE[2], /Un monde en trois parties/);
});

test("Système : la page courte des QR vise exactement les liens de la carte des mondes", () => {
  assert.match(courte, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/splat_univers\.html">/);
  assert.match(courte, /<meta name="robots" content="noindex, follow">/);
  assert.match(courte, /var SYS_DEPART = 25;/);
  const ctxCourte = vm.createContext({});
  vm.runInContext(courte.slice(courte.indexOf("var SYS = ["), courte.indexOf("var f =")) + ";globalThis.SYS=SYS;",
    ctxCourte, { filename: "systeme/livret/index.html" });
  assert.deepEqual(JSON.parse(JSON.stringify(ctxCourte.SYS)), SYS_FICHES.map((f) => f.q));
  SYSTEME.etapes.forEach((e, i) => {
    const cible = "/splat/classique/?" + ctxCourte.SYS[i] + "&cards=4&unknown=question&eleve=1&parcours=sys" + (25 + i);
    assert.equal(cible, e.j, `?f=${25 + i}`);
    assert.ok(courte.includes(e.j.replace(/&/g, "&amp;")), `lien de repli de la fiche ${25 + i}`);
  });
  /* hors des fiches, la page courte renvoie sur le monde 4 de la carte */
  assert.match(courte, /: "\/outils\/splat_univers\.html#monde-4";/);
});

test("accordéon : un monde ouvert à la fois, le monde en cours à l'arrivée, l'adresse peut en désigner un", () => {
  assert.match(univers, /sec\.id="monde-"\+\(mi\+1\);/);
  assert.match(univers, /'<div class="head" role="button" tabindex="0" aria-expanded="true" aria-controls="corps'\+mi\+'">'/);
  assert.match(univers, /'<span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"\/><\/svg><\/span>'/);
  assert.match(univers, /\.monde\.replie>\.desc,\.monde\.replie>\.intro,\.monde\.replie>\.etapes\{display:none\}/);
  assert.match(univers, /\.monde\.replie>\.head \.chev\{transform:rotate\(-90deg\)\}/);
  /* ouvrirMonde replie tous les autres ; un clic sur le bandeau ouvert referme tout */
  assert.match(univers, /function ouvrirMonde\(mi\)\{\s*document\.querySelectorAll\("main>\.monde"\)\.forEach\(\(sec,i\)=>\{\s*const ouvert=i===mi;\s*sec\.classList\.toggle\("replie",!ouvert\);/);
  assert.match(univers, /const mi=sec\.classList\.contains\("replie"\)\?mondes\.indexOf\(sec\):-1;\s*ouvrirMonde\(mi\);\s*retenirMonde\(mi\);/);
  /* relecture du monde 1 (25/09/2026) : le monde ouvert ou lancé est retenu sur l'appareil
     (une clé élève, une clé prof) et rouvert au retour, avant le monde en cours */
  assert.match(univers, /const CLE_MONDE_OUVERT="mathsgo-splat-monde-ouvert"\+\(PROF\?"-prof":""\);/);
  assert.match(univers, /try\{ localStorage\.setItem\(CLE_MONDE_OUVERT,String\(mi\)\); \}catch\(e\)\{\}/);
  /* (26/09/2026) un monde passé « en préparation » ne se rouvre pas tout seul */
  assert.match(univers, /const retenu=mondeRetenu\(\);\s*if\(retenu>=0&&!MONDES\[retenu\]\.cache\) return retenu;[^\n]*\s*if\(PROF\) return 0;/);
  assert.match(univers, /const sec=a\.closest\("main>\.monde"\);\s*if\(sec\) retenirMonde\(/);
  /* le monde en cours : celui de l'adresse (#monde-N ou un identifiant d'étape), sinon celui
     de la prochaine étoile, sinon le dernier monde jouable (26/09/2026 : pas un monde en
     préparation) ; en vue prof, le monde 1 */
  assert.match(univers, /const el=document\.getElementById\(cible\), sec=el&&el\.closest\("main>\.monde"\);/);
  assert.match(univers, /if\(PROF\) return 0;/);
  assert.match(univers, /if\(prochaine\) return prochaine\.mi;\s*const jouables=MONDES\.map\(\(m,mi\)=>jouable\(m\)\?mi:-1\)\.filter\(mi=>mi>=0\);\s*return jouables\.length\?jouables\[jouables\.length-1\]:MONDES\.length-1;/);
  assert.match(univers, /ouvrirMonde\(mondeEnCours\(majAffichage\(\)\)\);/);
  /* clavier : Entrée ou Espace sur le bandeau */
  assert.match(univers, /if\(\(ev\.key==="Enter"\|\|ev\.key===" "\)&&ev\.target\.matches\("main>\.monde>\.head"\)\)/);
  /* sans JavaScript, rien n'est replié : la classe « replie » n'est jamais écrite dans le HTML */
  assert.doesNotMatch(univers, /class="monde [^"]*replie/);
  /* la page courte du Système renvoie sur une ancre qui existe : #monde-4 */
  assert.equal((MONDES.map((_, i) => "monde-" + (i + 1))).indexOf("monde-4"), 3);
});

test("Continuer : la première étoile à gagner, dans l'ordre de l'univers, absent en vue prof", () => {
  assert.match(univers, /<div class="continuer" id="continuer" hidden><a id="continuerLien" href="#"><\/a><\/div>/);
  assert.match(univers, /else if\(!prochaine&&e\.j\) prochaine=\{m,mi,e,n:li\.querySelector\("\.n"\)\.textContent\};/);
  assert.match(univers, /if\(cont&&!PROF\)\{\s*cont\.hidden=!prochaine;/);
  assert.match(univers, /a\.href=prochaine\.e\.j; a\.dataset\.monde=prochaine\.mi; a\.innerHTML="\\u25b6 Continuer <small>\\u00b7 \\u00e9tape "\+prochaine\.n\+", "\+prochaine\.e\.t\+"<\/small>";/);
  /* toutes les étapes actives ont un lien de jeu : « Continuer » ne saute jamais une étape */
  MONDES.filter((m) => m.actif).forEach((m) => m.etapes.forEach((e) => assert.ok(e.j, `${m.nom} : ${e.t}`)));
});

test("?apres=<parcours> : la carte renvoie au jeu de l'étape suivante, sans rien afficher", () => {
  /* le lien que les outils mettront sur leur écran de fin (« Étape suivante ▶ ») */
  assert.match(univers, /const apres=new URLSearchParams\(window\.location\.search\)\.get\("apres"\);\s*if\(!apres\|\|PROF\) return;/);
  /* (26/09/2026) sans la clé, les mondes en préparation sont sautés ; venu d'un QR dans l'un
     d'eux, on continue dans ce monde (tests/splat-mondes-en-preparation.test.mjs) */
  assert.match(univers, /const suite=ici&&ici\.cache\?ici\.etapes:MONDES\.flatMap\(m=>jouable\(m\)\?m\.etapes:\[\]\);\s*const k=suite\.findIndex\(e=>e\.p===apres\);\s*if\(k>=0&&k\+1<suite\.length&&suite\[k\+1\]\.j\)\{[\s\S]{0,160}retenirMonde\(MONDES\.findIndex\(m=>m\.actif&&m\.etapes\.includes\(suite\[k\+1\]\)\)\);\s*window\.location\.replace\(suite\[k\+1\]\.j\);/);
  /* on refait le calcul (avec la clé : tous les mondes) : après la dernière fiche de l'Enquête
     vient la première du Système */
  const suite = MONDES.flatMap((m) => (m.actif ? m.etapes : []));
  const k = suite.findIndex((e) => e.p === "enq24");
  assert.equal(suite[k + 1].p, "sys25");
  assert.equal(suite[suite.findIndex((e) => e.p === "m1e6") + 1].p, "m2e1");
  assert.equal(suite.findIndex((e) => e.p === "m4e6"), suite.length - 1, "la dernière étape n'a pas de suivante");
});
