import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot « six mondes » (24/09/2026) — SPLAT! Système entre dans la carte des mondes, la carte
   se replie en accordéon, et un bouton « Continuer » mène à la prochaine étoile. Lot M4-4
   (04/10/2026) : le monde 4 devient un livret pour tous (fiches 25 à 28, quatre étoiles) et un
   deuxième tour en bonus (25d à 28d, taches dorées), comme le monde 3 — le livret cycle 4 depuis
   le lot M4-7 (14/10/2026). Comme pour l'Enquête,
   on EXÉCUTE les données de outils/splat_univers.html plutôt que d'y chercher du texte. */

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
  ";globalThis.X={MONDES,NOTES_MONDE,NOTES_PROF,SYS_FICHES,SYS_TOUR2,BONUS_MONDES:BONUS_MONDES.map(b=>({...b,monde:b.monde.nom}))};",
  ctx, { filename: "splat_univers.html" }
);
const { MONDES, NOTES_MONDE, NOTES_PROF, SYS_FICHES, SYS_TOUR2, BONUS_MONDES } = JSON.parse(JSON.stringify(ctx.X));
const SYSTEME = MONDES[3];

/* Les adresses des fiches (livret 1 : lot M4-6 ; livret cycle 4 : lot M4-7, 14/10/2026) : réglages et
   graines TRIÉES (chaque carte a son type, dans l'ordre de la fiche), les mêmes que
   _sources/livret-splat-systeme/render.py et que la
   page courte des QR. Une graine ou un réglage qui bouge ici, ce sont les fiches, les PDF et les
   livrets du Système à refaire. */
const BASE = "/splat/classique/?";
const FIN = "&cards=4&unknown=question";
const T = "&totalMin=20&totalMax=60", T2 = "&totalMin=50&totalMax=100", V0 = "&visibleMin=0&visibleMax=0";
const FICHES = [
  [25, "Je retire", "mode=D&geste=MIX&gestes=PARTIELLE,COEF,DOUBLE" + V0 + T + "&seed=1196"],
  [26, "Je remplace", "mode=D&geste=MIX&gestes=EMBOITE1,ESCALIER,DOUBLE&sens=INDICE" + V0 + T + "&seed=29"],
  [27, "J'additionne", "mode=D&geste=MIX&gestes=MIROIR,TROIS&forme=MIX" + V0 + T + "&seed=723"],
  [28, "À toi de choisir", "mode=D&geste=MIX&gestes=COEF,MIROIR,DOUBLE&forme=MIX&sens=INDICE" + V0 + T + "&seed=117944"]
];
const TOUR2 = [
  ["25d", "Je recopie, puis je retire", "mode=D&geste=RECOPIE&fois=2&ordre=MELANGE" + V0 + T2 + "&seed=70569"],
  ["26d", "Deux fois ou trois fois\u00a0?", "mode=D&geste=RECOPIE&fois=MIX&ordre=MELANGE" + V0 + T2 + "&seed=341052"],
  ["27d", "Deux gestes à la suite", "mode=D&geste=ETAGES&fois=2&indice=12&sens=INDICE" + V0 + T2 + "&seed=394968"],
  ["28d", "À toi de choisir", "mode=D&geste=MIX&gestes=EMBOITE1,TROIS,RECOPIE,ETAGES&fois=3&sous=MIROIR&ordre=MELANGE&visibleMin=1&visibleMax=3" + T2 + "&seed=33590"]
];
const titre = (n, t) => encodeURIComponent(`Fiche ${n} — ${t}`);

test("Système : quatre étapes (fiches 25 à 28), les réglages et les graines du lot M4-6, rien d'autre", () => {
  assert.equal(SYSTEME.nom, "SPLAT! Système");
  assert.deepEqual(SYS_FICHES.map((f) => f.q), FICHES.map((f) => f[2]));
  assert.deepEqual(SYSTEME.etapes.map((e) => [e.n, e.t]), FICHES.map((f) => [f[0], f[1]]));
  assert.equal(SYSTEME.volets, undefined, "une seule partie : plus d'intertitres");
  SYSTEME.etapes.forEach((e, i) => {
    const [n, t, q] = FICHES[i];
    assert.equal(e.j, BASE + q + FIN + "&eleve=1&parcours=sys" + n, `jeu de la fiche ${n}`);
    assert.equal(e.jp, BASE + q + FIN, `projection de la fiche ${n}`);
    /* la fiche et le corrigé en 2 par page : la page du livret tablette (lot M4-4) */
    assert.equal(e.f, BASE + q + FIN + "&layout=2&title=" + titre(n, t) + "&print=statement", `fiche ${n}`);
    assert.equal(e.c, BASE + q + FIN + "&layout=2&title=" + titre(n, t) + "&print=correction", `correction ${n}`);
    assert.equal(e.c2, undefined);
    /* et le corrigé « en lettres », comme les livrets (vue prof : Corrigé · taches | lettres) */
    assert.equal(e.cl, BASE + q + "&cards=4&unknown=letter&layout=2&title=" + titre(n, t) + "&print=correction", `correction en lettres ${n}`);
    assert.equal(e.p, "sys" + n);
    assert.equal(e.id, "sys-" + i);
    assert.ok(e.o.length > 20, `phrase de la fiche ${n}`);
    assert.equal(e.note, undefined, "aucune consigne en gras au Système");
  });
  /* aucun nombre à sous-entendu dans ce que l'élève lit */
  const lu = [SYSTEME.desc, ...SYSTEME.etapes.map((e) => e.t + " " + e.o), ...SYS_TOUR2.map((f) => f.t)].join(" ");
  assert.doesNotMatch(lu, /\b69\b/);
});

test("Système : le livret cycle 4 (25d à 28d) est le Bonus du monde 4, comme au monde 3", () => {
  assert.deepEqual(SYS_TOUR2.map((f) => [f.code, f.t, f.q]), TOUR2);
  SYS_TOUR2.forEach((f) => {
    assert.equal(f.j, BASE + f.q + FIN + "&eleve=1&parcours=sys" + f.code, `jeu de la fiche ${f.code}`);
    assert.equal(f.jp, BASE + f.q + FIN);
    // la fiche s'imprime comme dans le livret : « Le système » sous chaque carte (lot M4-7)
    assert.equal(f.f, BASE + f.q + FIN + "&layout=2&title=" + titre(f.code, f.t) + "&print=statement&systeme=1");
    assert.equal(f.c, BASE + f.q + FIN + "&layout=2&title=" + titre(f.code, f.t) + "&print=correction");
    assert.equal(f.cl, BASE + f.q + "&cards=4&unknown=letter&layout=2&title=" + titre(f.code, f.t) + "&print=correction");
    assert.ok(f.n.length > 10 && f.n.length <= 90, `note du prof de la fiche ${f.code}`);
  });
  /* les deux Bonus : le monde 3 garde ses identifiants, le monde 4 a les siens */
  assert.deepEqual(BONUS_MONDES.map((b) => [b.monde, b.idp, b.volet, b.li, b.stars, b.cle, b.fiches.length]),
    [["SPLAT! Enquête", "enq", "enq-bonus", "enq-t2-", "starsBonus", "", 10], ["SPLAT! Système", "sys", "sys-bonus", "sys-t2-", "starsBonusSys", "-sys", 4]]);
  assert.deepEqual(BONUS_MONDES[1].livrets, [["Le livret · Cycle 4", 0, 4]]);
  /* son nom (lot M4-7) : « Cycle 4 » au monde 4 ; le monde 3 garde « Deuxième tour » */
  assert.deepEqual(BONUS_MONDES.map((b) => b.nom), ["Deuxième tour", "Cycle 4"]);
  assert.deepEqual(BONUS_MONDES[1].prof, [["", "SPLAT! Système · cycle 4", "25d", "28d", 0, 4]]);
  assert.match(univers, /return voletHtml\(b\.volet,'bonus',b\.nom,b\.fichesTxt,b\.phrase,' bonus'\)\+/);
  assert.match(univers, /\(b\?partieBtnHtml\('bonus','Bonus',b\.stars,' bonus'\):''\)/);
  /* la remarque « deux chemins » de la fiche 26d (choix de Gwenaël du 14/10) */
  assert.match(SYS_TOUR2[1].n, /deux chemins/);
  /* le Bonus s'écrit pour chaque monde qui en a un (vue élève et vue prof) */
  assert.match(univers, /\}\)\.join\(""\)\+bonusHtml\(m\)\+'<\/ol>';/);
  assert.match(univers, /\}\)\.join\(''\)\+tour2ProfHtml\(m\)\+'<\/ol>';/);
  /* une clé de mémoire par Bonus ; celle du monde 3 ne change pas */
  assert.match(univers, /const CLE_BONUS_OUVERT="mathsgo-splat-bonus-ouvert";/);
  // (lot 6) sous un code, la clé de l'élève : cleMemoire(…) (tests/splat-suivi-memoire.test.mjs)
  assert.match(univers, /const cle=cleMemoire\(CLE_BONUS_OUVERT\+\(\(b&&b\.cle\)\|\|""\)\); if\(!cle\) return;/);
  /* ?apres= : la fiche bonus suivante du même monde */
  assert.match(univers, /for\(const b of BONUS_MONDES\)\{\s*const kb=b\.fiches\.findIndex\(f=>b\.idp\+f\.code===apres\);/);
  /* le cannelle du monde 4 pour son Bonus */
  assert.match(univers, /\.msys \.volet\.bonus\{background:#fff;border:1\.5px dashed #e3b994\}/);
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
  /* lot M4-6 : les lignes du Système suivent les 4 cas (je retire, j'additionne, je recopie ; recopier
     les deux plateaux reste dehors) ; lot M4-7 : ce qui vise le Bonus (je recopie, deux gestes) */
  assert.equal((note.match(/<tr>/g) || []).length, 11, "l'en-tête et les dix lignes du tableau");
  assert.match(note, /<td>Système, défi du livret 1 ; Bonus 25d à 28d<\/td>/);
  assert.match(note, /<tr><td>deux gestes à la suite \(trois couleurs\)<\/td><td>Système, Bonus 27d et 28d<\/td><td>cycle 4<\/td><\/tr>/);
  assert.match(note, /puis un livret cycle 4, en bonus \(25d à 28d\)/);
  assert.match(note, /volontairement hors SPLAT!/);
  for (const geste of ["je retire", "j'additionne", "je recopie l'un, puis je retire"]) assert.ok(note.includes("<b>" + geste + "</b>"), geste);
  assert.match(note, /<td>recopier les deux plateaux \(2N \+ 3V ; 3N \+ 5V\)<\/td><td><b>volontairement hors SPLAT!<\/b><\/td><td>lycée<\/td>/);
  /* lot « vue prof » (27/09/2026) : le tableau passe dans un « Repère » replié (<details>), hors
     du <p> de l'intention (un <table> ferme un <p> et sortirait du texte) */
  assert.match(univers, /return '<p class="txt">'\+avant\+'<\/p><details><summary>Repère : tous les systèmes du collège, et où ils sont dans SPLAT!<\/summary>'\+t\.slice\(k\)\+'<\/details>';/);
  assert.match(univers, /\.pIntro details table\{border-collapse:collapse;/);
  assert.equal(NOTES_PROF[3].length, 4);
  assert.equal(NOTES_PROF[2].length, 15);
  assert.match(NOTES_MONDE[2], /Un monde en trois parties/);
});

test("Système : la page courte des QR vise exactement les liens de la carte des mondes", () => {
  assert.match(courte, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/splat_univers\.html">/);
  assert.match(courte, /<meta name="robots" content="noindex, follow">/);
  assert.match(courte, /var SYS_DEPART = 25;/);
  const ctxCourte = vm.createContext({});
  vm.runInContext(courte.slice(courte.indexOf("var SYS = ["), courte.indexOf("var f =")) + ";globalThis.SYS=SYS;globalThis.SYS_TOUR2=SYS_TOUR2;",
    ctxCourte, { filename: "systeme/livret/index.html" });
  assert.deepEqual(JSON.parse(JSON.stringify(ctxCourte.SYS)), SYS_FICHES.map((f) => f.q));
  assert.deepEqual(JSON.parse(JSON.stringify(ctxCourte.SYS_TOUR2)), SYS_TOUR2.map((f) => f.q));
  SYS_TOUR2.forEach((f) => assert.ok(courte.includes(f.j.replace(/&/g, "&amp;")), `lien de repli de la fiche ${f.code}`));
  SYSTEME.etapes.forEach((e, i) => {
    const cible = "/splat/classique/?" + ctxCourte.SYS[i] + "&cards=4&unknown=question&eleve=1&parcours=sys" + (25 + i);
    assert.equal(cible, e.j, `?f=${25 + i}`);
    assert.ok(courte.includes(e.j.replace(/&/g, "&amp;")), `lien de repli de la fiche ${25 + i}`);
  });
  /* hors des fiches, la page courte renvoie sur le monde 4 de la carte */
  assert.match(courte, /: "\/outils\/splat_univers\.html#monde-4";/);
});

test("un monde à la fois (la carte des mondes, lot 2 du 08/11/2026) : le monde en cours à l'arrivée, l'adresse peut en désigner un", () => {
  assert.match(univers, /sec\.id="monde-"\+\(mi\+1\);/);
  /* la grande bande du monde reste (choix de Gwenaël du 08/11), sans la petite flèche : ce n'est plus un bouton */
  assert.match(univers, /   '<div class="head">'\+\n     '<svg class="blob"/);
  assert.doesNotMatch(univers, /class="chev"|\.head \.chev|role="button" tabindex="0" aria-expanded="true"/);
  assert.match(univers, /\.monde\.replie>\.desc,\.monde\.replie>\.intro,\.monde\.replie>\.etapes,\.monde\.replie>\.parties\{display:none\}/);
  assert.match(univers, /main>\.monde:not\(\.choisi\)\{display:none\}/);
  /* ouvrirMonde : le monde choisi à l'écran (même fermé à la classe : sa bande grisée), les autres cachés ;
     (lot « splat-suivi-5 ») un monde fermé à la classe reste replié ; la carte et le sommaire suivent */
  assert.match(univers, /function ouvrirMonde\(mi\)\{\s*document\.querySelectorAll\("main>\.monde"\)\.forEach\(\(sec,i\)=>\{\s*const ouvert=i===mi&&!sec\.classList\.contains\("verrouille"\);\s*sec\.classList\.toggle\("replie",!ouvert\);[^\n]*\n[^\n]*\n\s*sec\.classList\.toggle\("choisi",i===mi\);/);
  assert.match(univers, /document\.querySelectorAll\("#carteMondes \.tm"\)\.forEach\(b=>\{/);
  assert.match(univers, /document\.querySelectorAll\("\.sommaire a\[data-mi\]"\)\.forEach\(a=>\{/);
  /* une tache de la carte : son monde, retenu s'il est jouable ; plus de « tout fermé » */
  assert.match(univers, /const b=ev\.target\.closest\("#carteMondes \.tm"\);\s*if\(!b\) return;\s*const mi=\+b\.dataset\.mi;\s*ouvrirMonde\(mi\);\s*if\(!MONDES\[mi\]\.cache&&!MONDES\[mi\]\.verrouille\) retenirMonde\(mi\);/);
  assert.doesNotMatch(univers, /retenirToutFerme|if\(retenu===TOUT_FERME\) return -1;/);
  /* relecture du monde 1 (25/09/2026) : le monde ouvert ou lancé est retenu sur l'appareil
     (une clé élève, une clé prof) et rouvert au retour, avant le monde en cours */
  assert.match(univers, /const CLE_MONDE_OUVERT="mathsgo-splat-monde-ouvert"\+\(PROF\?"-prof":""\);/);
  /* (lot 6) sous un code, la clé de l'élève (cleMemoire → SUIVI.cleEleve), pas celle de l'appareil ;
     le comportement est exécuté dans tests/splat-suivi-memoire.test.mjs */
  assert.match(univers, /const cle=cleMemoire\(CLE_MONDE_OUVERT\); if\(!cle\) return;\s*try\{ localStorage\.setItem\(cle,String\(mi\)\); \}catch\(e\)\{\}/);
  /* (26/09/2026) un monde passé « en préparation » ne se rouvre pas tout seul */
  /* (08/10/2026, lot « splat-suivi-5 ») ni un monde fermé à la classe */
  assert.match(univers, /const retenu=mondeRetenu\(\);\s*(?:\/\*[^*]*\*\/\s*)?(?:\/\*[^\n]*\*\/\s*)?if\(retenu>=0&&!MONDES\[retenu\]\.cache&&!MONDES\[retenu\]\.verrouille\) return retenu;[^\n]*\s*if\(PROF\) return 0;/);
  assert.match(univers, /const sec=a\.closest\("main>\.monde"\);\s*if\(sec\) retenirMonde\(/);
  /* le monde en cours : celui de l'adresse (#monde-N ou un identifiant d'étape), sinon celui
     de la prochaine étoile, sinon le dernier monde jouable (26/09/2026 : pas un monde en
     préparation) ; en vue prof, le monde 1 */
  assert.match(univers, /const el=document\.getElementById\(cible\), sec=el&&el\.closest\("main>\.monde"\);/);
  assert.match(univers, /if\(PROF\) return 0;/);
  assert.match(univers, /if\(prochaine\) return prochaine\.mi;\s*const jouables=MONDES\.map\(\(m,mi\)=>jouable\(m\)\?mi:-1\)\.filter\(mi=>mi>=0\);\s*return jouables\.length\?jouables\[jouables\.length-1\]:MONDES\.length-1;/);
  assert.match(univers, /ouvrirMonde\(mondeEnCours\(majAffichage\(\)\)\);/);
  /* clavier : les taches de la carte sont des <button> (Entrée, Espace) ; le bandeau n'écoute plus rien */
  assert.match(univers, /'<button type="button" class="tm '\+m\.cls\+'" data-mi="'\+mi\+'" aria-pressed="false"/);
  assert.doesNotMatch(univers, /ev\.target\.matches\("main>\.monde>\.head"\)/);
  /* sans JavaScript, rien n'est replié : la classe « replie » n'est jamais écrite dans le HTML */
  assert.doesNotMatch(univers, /class="monde [^"]*replie/);
  /* la page courte du Système renvoie sur une ancre qui existe : #monde-4 */
  assert.equal((MONDES.map((_, i) => "monde-" + (i + 1))).indexOf("monde-4"), 3);
});

test("Continuer : la première étoile à gagner, dans l'ordre de l'univers, absent en vue prof", () => {
  assert.match(univers, /<div class="continuer" id="continuer" hidden><a id="continuerLien" href="#"><\/a><\/div>/);
  /* (lot « splat-suivi-5 ») jamais dans un monde fermé à la classe */
  assert.match(univers, /else if\(!prochaine&&e\.j&&!m\.verrouille\) prochaine=\{m,mi,e,n:li\.querySelector\("\.n"\)\.textContent\};/);
  /* lot 2 du suivi (08/10/2026) : caché aussi tant que le billet de l'élève n'est pas échangé */
  assert.match(univers, /if\(cont&&!PROF\)\{\s*cont\.hidden=!prochaine\|\|!!\(SUIVI&&SUIVI\.attente\(\)\);/);
  assert.match(univers, /a\.href=versEtape\(prochaine\.e\); a\.dataset\.monde=prochaine\.mi; a\.innerHTML="\\u25b6 Continuer <small>\\u00b7 \\u00e9tape "\+prochaine\.n\+", "\+prochaine\.e\.t\+"<\/small>";/);
  /* toutes les étapes actives ont un lien de jeu : « Continuer » ne saute jamais une étape */
  MONDES.filter((m) => m.actif).forEach((m) => m.etapes.forEach((e) => assert.ok(e.j, `${m.nom} : ${e.t}`)));
});

test("?apres=<parcours> : la carte renvoie au jeu de l'étape suivante, sans rien afficher", () => {
  /* le lien que les outils mettront sur leur écran de fin (« Étape suivante ▶ ») */
  assert.match(univers, /const apres=new URLSearchParams\(window\.location\.search\)\.get\("apres"\);\s*if\(!apres\|\|PROF\) return;/);
  /* (26/09/2026) sans la clé, les mondes en préparation sont sautés ; venu d'un QR dans l'un
     d'eux, on continue dans ce monde (tests/splat-mondes-en-preparation.test.mjs) */
  assert.match(univers, /const suite=ici&&ici\.cache\?ici\.etapes:MONDES\.flatMap\(m=>jouable\(m\)\?m\.etapes:\[\]\);\s*const k=suite\.findIndex\(e=>e\.p===apres\);\s*if\(k>=0&&k\+1<suite\.length&&suite\[k\+1\]\.j\)\{[\s\S]{0,160}retenirMonde\(MONDES\.findIndex\(m=>m\.actif&&m\.etapes\.includes\(suite\[k\+1\]\)\)\);\s*APRES_REDIRIGE=true;\s*window\.location\.replace\(versEtape\(suite\[k\+1\]\)\);/);
  /* on refait le calcul (avec la clé : tous les mondes) : après la dernière fiche de l'Enquête
     vient la première du Système */
  const suite = MONDES.flatMap((m) => (m.actif ? m.etapes : []));
  const k = suite.findIndex((e) => e.p === "enq24");
  assert.equal(suite[k + 1].p, "sys25");
  assert.equal(suite[suite.findIndex((e) => e.p === "m1e6") + 1].p, "m2e1");
  assert.equal(suite.findIndex((e) => e.p === "m4e6"), suite.length - 1, "la dernière étape n'a pas de suivante");
});
