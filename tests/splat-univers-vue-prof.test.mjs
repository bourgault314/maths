import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot « vue prof » de la carte des mondes SPLAT! (27/09/2026) — la vue professeur
   (outils/splat_univers.html?prof=1) refaite d'après la maquette validée par Gwenaël :
   sommaire des six mondes, « L'intention » et « Pour la classe », un seul bouton plein
   « Projeter », les mêmes mots partout (Projeter · Jeu de l'élève · Fiche · Corrigé),
   ni encadré ni émoticône, la phrase écrite pour l'élève retirée, les 12 cartes repliées
   en grille. AUCUN lien, aucune graine, aucun identifiant d'étoile ne change.
   On EXÉCUTE les fonctions de rendu de la page (des chaînes HTML, sans navigateur). */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const prepa = univers.match(/const PREPA_PHRASE=[^\n]*\n/)[0];
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(
  bloc("const PS=", "const PROF =") + prepa + bloc("const NOTES_MONDE", "const main=document") +
  ";globalThis.X={MONDES,NOTES_MONDE,NOTES_PROF,LIVRET_TEXTE,ENQ_TOUR2,SYS_TOUR2};" +
  "Object.assign(globalThis,{idEtape,eqSeuleLiens,eqBarreLiens,plagesFiches,mondeProfHtml,sommaireProfHtml,intentionHtml,ressourcesHtml,actionsHtml,cartesHtml,PREPA_PHRASE});",
  ctx, { filename: "splat_univers.html" }
);
const { MONDES, NOTES_MONDE, NOTES_PROF } = ctx.X;
const PLAGES = ctx.plagesFiches();
const html = (mi) => ctx.mondeProfHtml(MONDES[mi], mi, PLAGES[mi]);
const hrefs = (h) => [...h.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).filter((u) => u !== "#tacheEtoile");
const EMOJI = /\p{Extended_Pictographic}/u;
/* les tableaux fabriqués dans le bac à sable n'ont pas le même Array : on les recopie */
const J = (x) => JSON.parse(JSON.stringify(x));
/* le bloc d'une étape : de son <li class="etape" id="…"> au suivant (« etape code » : l'échauffement
   du monde 6, lot 3, 14/10/2026) */
function etapeHtml(h, id) {
  const a = Math.max(h.indexOf(`<li class="etape" id="${id}">`), h.indexOf(`<li class="etape code" id="${id}">`));
  assert.ok(a >= 0, `étape ${id} introuvable`);
  const b = h.indexOf('<li class="', a + 10);
  return h.slice(a, b < 0 ? undefined : b);
}

test("sommaire et bandeaux : les numéros de fiches des six mondes", () => {
  // lot M4-4 (04/10/2026) : le monde 4 a quatre fiches, 25 à 28 (29 à 34 libres)
  assert.deepEqual(JSON.parse(JSON.stringify(PLAGES)), [[1, 6], [7, 9], [10, 24], [25, 28], [35, 37], [38, 43]]);
  const som = ctx.sommaireProfHtml(PLAGES);
  assert.deepEqual(hrefs(som), [1, 2, 3, 4, 5, 6].map((n) => "#monde-" + n));
  assert.ok(som.includes("fiches 10 à 24") && som.includes("fiches 35 à 37") && som.includes("fiches 38 à 43"));
  MONDES.forEach((m, mi) => {
    const h = html(mi);
    assert.ok(h.includes(`<span class="fichesTete">fiches ${PLAGES[mi][0]}–${PLAGES[mi][1]}</span>`), `bandeau du monde ${mi + 1}`);
    assert.ok(!h.includes("jouable en classe"));
  });
});

test("chaque étape garde son identifiant d'étoile et son numéro (.n), dans l'ordre de l'univers", () => {
  MONDES.forEach((m, mi) => {
    const h = html(mi);
    /* l'échauffement du monde 6 (lot 3, 14/10/2026) : son code (« É1 ») dans la tache, il ne prend
       pas de numéro — la 38 reste la 38 */
    const vus = [...h.matchAll(/<li class="etape(?: code)?" id="([^"]+)">[\s\S]*?<span class="n">([^<]+)<\/span>/g)].map((x) => [x[1], /^\d+$/.test(x[2]) ? Number(x[2]) : x[2]]);
    let n = PLAGES[mi][0] - 1;
    const attendus = m.etapes.map((e, ei) => [ctx.idEtape(m, e, ei), e.code || ++n]);
    assert.deepEqual(vus, J(attendus), m.nom);
  });
});

test("aucun lien ne change : exactement les liens des données, plus la page des livrets et le diaporama", () => {
  let total = 0;
  MONDES.forEach((m, mi) => {
    const attendu = new Set();
    if (mi === 0) attendu.add("/outils/splat_intro.html?suite=" + encodeURIComponent("/outils/splat_univers.html?prof=1") + "&depuis=carte");
    attendu.add("/outils/livrets_splat.html#monde-" + (mi + 1)); /* chaque monde a sa page des livrets */
    m.etapes.forEach((e) => {
      for (const k of ["jp", "j", "f", "fe", "c", "c2", "cl"]) if (e[k]) attendu.add(e[k]);
      (e.parties || []).forEach((p) => { attendu.add(p.jp); attendu.add(p.f); });
      (ctx.eqSeuleLiens(e) || ctx.eqBarreLiens(m, e) || []).forEach((u) => attendu.add(u));
    });
    /* (03/10/2026) le deuxième tour du monde 3 : dix lignes sous la partie 3, mêmes boutons */
    if (m.idp === "enq") ctx.X.ENQ_TOUR2.forEach((f) => { for (const k of ["jp", "j", "f", "c"]) attendu.add(f[k]); });
    /* lot M4-4 : le Bonus du monde 4 (25d à 28d, le livret cycle 4 depuis le lot M4-7), avec ses
       corrigés — taches, lettres, et en équations depuis le lot M4-8 ; sa fiche s'imprime avec
       « Le système » (systeme=1) */
    if (m.idp === "sys") ctx.X.SYS_TOUR2.forEach((f) => { for (const k of ["jp", "j", "f", "c", "cl", "ce"]) attendu.add(f[k]); });
    const vus = new Set(hrefs(html(mi)));
    assert.deepEqual([...vus].sort(), [...attendu].sort(), m.nom);
    total += vus.size;
  });
  assert.ok(total > 360, `${total} liens`);
  /* les six mondes ont leurs livrets (le monde 6 depuis le lot R2) : pas de texte vide */
  assert.equal(ctx.X.LIVRET_TEXTE.length, 6);
  ctx.X.LIVRET_TEXTE.forEach((t, mi) => assert.ok(t.length > 20, `monde ${mi + 1}`));
});

test("les mêmes mots partout, un seul bouton plein par fiche, et ni émoticône ni encadré", () => {
  // (lot M4-4 : le Système a deux corrigés, comme ses livrets — « taches » et « lettres »)
  const MOTS = new Set(["Projeter", "Jeu de l’élève", "Jeu de l’élève (les 12 cartes)", "Fiche", "Corrigé", "tableau", "équation", "4 par page", "2 par page", "taches", "lettres"]);
  MONDES.forEach((m, mi) => {
    const h = html(mi);
    assert.doesNotMatch(h, EMOJI, `${m.nom} : une émoticône`);
    assert.doesNotMatch(h, /noteProf|eqListeProf|descProf|introLien|introNote|Projeter l’outil|Correction/, m.nom);
    m.etapes.forEach((e, ei) => {
      const b = etapeHtml(h, ctx.idEtape(m, e, ei));
      assert.equal((b.match(/class="plein"/g) || []).length, 1, `${m.nom}, ${e.t} : un seul bouton plein`);
      const pAct = b.slice(b.indexOf('<div class="pAct">'), b.indexOf('<div class="cartes"') > 0 ? b.indexOf('<div class="cartes"') : undefined);
      const libelles = [...pAct.matchAll(/<a [^>]*>(?:<svg[\s\S]*?<\/svg>)?([^<]+)<\/a>|<span class="seg"><span><svg[\s\S]*?<\/svg>([^<]+)<\/span>/g)].map((x) => (x[1] || x[2]).trim());
      assert.ok(libelles.length >= 1, `${e.t} : ${libelles}`);
      libelles.forEach((l) => assert.ok(MOTS.has(l), `${m.nom}, ${e.t} : libellé « ${l} »`));
      /* le principal est « Projeter » quand la fiche se projette, sinon le jeu de l'élève */
      const plein = b.match(/<a class="plein" href="([^"]*)">/)[1];
      assert.equal(plein, e.parties ? e.j : (e.jp || e.j), `${e.t} : le bouton plein`);
    });
  });
});

test("la phrase écrite pour l'élève est retirée ; l'intention et la note du prof restent", () => {
  MONDES.forEach((m, mi) => {
    const h = html(mi);
    assert.ok(!h.includes(m.desc), `${m.nom} : la phrase du monde pour l'élève`);
    m.etapes.forEach((e, ei) => {
      if (e.o) assert.ok(!h.includes(e.o), `${m.nom}, ${e.t} : la phrase de l'étape pour l'élève`);
      assert.ok(h.includes('<p class="pNote">' + NOTES_PROF[mi][ei] + "</p>"), `${m.nom}, ${e.t} : la note du prof`);
    });
    assert.ok(h.includes("L’intention"));
  });
  /* monde 4 : le tableau de tous les systèmes du collège passe dans un « Repère » replié */
  const i4 = ctx.intentionHtml(3);
  assert.match(i4, /^<p class="txt">[^<]*(?:<b>[^<]*<\/b>[^<]*)*<\/p><details><summary>Repère : tous les systèmes du collège, et où ils sont dans SPLAT!<\/summary><table>/);
  assert.equal((i4.match(/<tr>/g) || []).length, 11);   // lot M4-7 : dix lignes (le Bonus compris)
  assert.doesNotMatch(i4, /et où ils sont\s*:<\/p>/, "la phrase d'annonce du tableau est remplacée par le Repère");
  assert.ok(!ctx.intentionHtml(0).includes("<details>"));
});

test("« Pour la classe » : le diaporama au monde 1, la page des livrets aux mondes 1 à 6", () => {
  const r = MONDES.map((m, mi) => ctx.ressourcesHtml(m, mi));
  assert.ok(r[0].includes("Présenter le principe") && r[0].includes("/outils/splat_intro.html?suite="));
  r.slice(1).forEach((x) => assert.ok(!x.includes("splat_intro")));
  for (let mi = 0; mi < 6; mi++) {
    assert.equal((r[mi].match(/<a /g) || []).length, mi === 0 ? 2 : 1, `monde ${mi + 1}`);
    assert.ok(r[mi].includes(`<span class="rt">Les livrets du monde ${mi + 1}</span>`));
    assert.doesNotMatch(r[mi], /\.pdf"|bord court|recto-verso/, "ni PDF ni consigne d'impression : elles sont sur la page des livrets");
  }
  assert.ok(r[5].includes('href="/outils/livrets_splat.html#monde-6"'));
  assert.ok(r[5].includes("L'échauffement, un livret par partie avec son Le défi, et leurs corrigés."));
});

test("les parties des mondes 3 et 6 : un intertitre, sans ligne de PDF (comme aux autres mondes)", () => {
  /* Décision du 27/09/2026 (cohérence des six mondes) : sous une partie, son numéro, son titre, ses
     fiches et sa phrase — rien d'autre. Les livrets sont sur la page des livrets (« Pour la classe »). */
  for (const mi of [2, 5]) {   // (le monde 4 n'a plus de parties depuis le lot M4-4)
    const m = MONDES[mi], h = html(mi);
    /* lot 3 de l'échauffement (14/10/2026) : au monde 6, l'échauffement est une partie à part
       (« Échauffement », fiches É1 à É3), et la Partie 1 garde son nom, son ancre et ses fiches */
    const ech = m.volets.filter((v) => v.ech).length;
    m.volets.forEach((v, vi) => {
      const id = v.ech ? `${m.idp}-echauffement` : `${m.idp}-partie-${vi + 1 - ech}`;
      const a = h.indexOf(`<li class="volet${v.ech ? " ech" : ""}" id="${id}">`), b = h.indexOf("</li>", a);
      assert.ok(a > 0, `${m.nom}, partie ${id}`);
      const li = h.slice(a, b), n = PLAGES[mi][0] + v.de - ech * 3;
      assert.ok(li.includes(`<span class="rang">${v.ech ? "Échauffement" : "Partie " + (vi + 1 - ech)}</span>`), id);
      assert.ok(li.includes(v.ech ? `<h4>${v.nom}<span class="fiches">fiches É1 à É3</span></h4>`
        : `<h4>${v.nom}<span class="fiches">fiches ${n} à ${n + v.a - v.de - 1}</span></h4>`), id);
      assert.ok(li.includes(`<p>${v.o}</p>`));
      assert.equal(hrefs(li).length, 0, `${m.nom}, partie ${vi + 1} : aucun lien`);
      assert.equal(v.livrets, undefined);
      assert.equal(v.note, undefined, "plus de note de partie (la consigne d'impression vit sur la page des livrets)");
    });
  }
  assert.deepEqual(J(MONDES.map((m) => (m.volets || []).length)), [0, 0, 3, 0, 0, 3]);
  assert.doesNotMatch(univers, /livL|\.pdf"/, "aucun PDF en lien direct sur la carte des mondes");
});

test("« Pour la classe » dit ce que la page des livrets propose, monde par monde", () => {
  /* Garde-fou de cohérence (27/09/2026) : quand un lot ajoute un livret à la page des livrets
     (un « Le défi », une version en lettre, une série), la ligne du monde dans la vue prof doit
     suivre — sinon ce test rougit. */
  const page = lire("outils/livrets_splat.html");
  const onglet = (n) => page.slice(page.indexOf(`id="monde-${n}"`), n < 6 ? page.indexOf(`id="monde-${n + 1}"`) : page.indexOf("<footer"));
  const T = ctx.X.LIVRET_TEXTE;
  for (let n = 1; n <= 6; n++) {
    const o = onglet(n), t = T[n - 1];
    assert.ok(o.length > 500, `onglet ${n} trouvé`);
    // (14/10/2026) au monde 6, les cartes s'appellent « Le défi 1 » et « Le défi 2 »
    const defi = /<h3>Le défi(?: \d)?<\/h3>/.test(o);
    assert.equal(/Le défi/.test(t), defi, `monde ${n} : « Le défi » ${defi ? "est" : "n'est pas"} sur la page des livrets`);
    assert.ok(/corrigés/.test(t), `monde ${n} : les corrigés`);
  }
  assert.match(T[0], /séries de trois niveaux/i);
  assert.ok(onglet(1).includes("livret_petit_splat_dessin.pdf") && onglet(1).includes("livret_petit_splat_expert.pdf"));
  assert.match(T[1], /«\\u00a0\?\\u00a0» ou en lettre|« \? » ou en lettre|«\u00a0\?\u00a0» ou en lettre/);
  assert.ok(onglet(2).includes("livret_splat_classique_lettre.pdf"));
  assert.match(T[4], /Schéma ou équation, chacun avec son livret Le défi/);
  assert.equal((onglet(5).match(/<h3>Le défi<\/h3>/g) || []).length, 2);
  assert.match(T[5], /^L'échauffement, un livret par partie/);
  /* courts : une ligne chacun */
  T.forEach((t, i) => assert.ok(t.length <= 80, `monde ${i + 1} : ${t.length} caractères`));
});

test("les 12 cartes : repliées, en grille numérotée, chacune un lien, « dessin » pour les cartes à dessiner", () => {
  let vues = 0;
  MONDES.forEach((m, mi) => {
    const h = html(mi);
    m.etapes.forEach((e, ei) => {
      if (!e.eqs) return;
      const id = ctx.idEtape(m, e, ei), b = etapeHtml(h, id);
      assert.ok(b.includes(`<button class="cartesBtn" type="button" aria-expanded="false" aria-controls="cartes-${id}">Les ${e.eqs.length} cartes `));
      const grille = b.slice(b.indexOf(`<div class="cartes" id="cartes-${id}">`));
      const items = [...grille.matchAll(/<li>(<a href="([^"]*)"[^>]*>|<span>)<i>(\d+)<\/i>([^<]*)/g)];
      assert.deepEqual(items.map((x) => Number(x[3])), J(e.eqs.map((_, i) => i + 1)));
      assert.deepEqual(items.map((x) => x[4]), J(e.eqs.map((q) => q.replace(/\s*✏️?/, ""))));
      const liens = ctx.eqSeuleLiens(e) || ctx.eqBarreLiens(m, e);
      assert.ok(liens, `${m.nom}, ${e.t} : chaque carte ouvre ÉquaBarre ou ÉquaSplat`);
      assert.deepEqual(items.map((x) => x[2]), J(liens));
      const dessins = e.dessin ? e.eqs.length : e.eqs.filter((q) => q.includes("✏")).length;
      assert.equal((grille.match(/<span class="dess"/g) || []).length, dessins, `${e.t} : cartes à dessiner`);
      vues += e.eqs.length;
    });
  });
  assert.ok(vues >= 12 * 9 + 36 + 8 * 7, `${vues} cartes`);
  /* la grille est repliée à l'arrivée et le bouton la déplie */
  assert.match(univers, /\.cartes\{display:none;/);
  assert.match(univers, /\.cartes\.ouvert\{display:block\}/);
  assert.match(univers, /const b=ev\.target\.closest\("\.cartesBtn"\); if\(!b\) return;/);
});

test("un monde en préparation : le bandeau et la phrase, sans aucun lien ni émoticône", () => {
  MONDES.forEach((m, mi) => {
    const h = ctx.mondeProfHtml({ ...m, cache: true }, mi, PLAGES[mi]);
    assert.equal(hrefs(h).length, 0, m.nom);
    assert.ok(h.includes('<span class="fichesTete">en préparation</span>'));
    assert.ok(h.includes(ctx.PREPA_PHRASE));
    assert.doesNotMatch(h, /NOTES_|class="etape"|role="button"/);
    assert.doesNotMatch(h, EMOJI);
  });
  /* le sommaire le montre grisé, sans numéros de fiches */
  const cache = MONDES.map((m, mi) => ({ ...m, cache: mi === 2 }));
  const som = vm.runInContext("(function(M,P){const s=MONDES.slice();MONDES.splice(0,MONDES.length,...M);try{return sommaireProfHtml(P);}finally{MONDES.splice(0,MONDES.length,...s);}})", ctx)(cache, PLAGES);
  assert.ok(som.includes('class="menq cache"') && som.includes('<span class="sf">en préparation</span>'));
});

test("le rendu : la vue prof a le sien, la vue élève garde sa boucle sans aucune branche prof", () => {
  assert.match(univers, /if\(PROF\) renderProf\(main\);\nelse MONDES\.forEach\(\(m,mi\)=>\{/);
  const eleve = bloc("else MONDES.forEach((m,mi)=>{", "  main.appendChild(sec);\n});");
  assert.doesNotMatch(eleve, /PROF|NOTES_/, "plus rien de la vue prof dans la boucle élève");
  assert.match(eleve, /🎮 Je joue<\/a>/);
  assert.doesNotMatch(eleve, /e\.c\b|e\.c2|e\.f\b/, "ni fiche ni correction pour l'élève");
  /* en-tête de la vue prof */
  assert.match(univers, /'<small>Guide du professeur<\/small>L(?:’|\\u2019)univers <span class="splat">SPLAT!<\/span>'/);
  assert.match(univers, /som\.className="sommaire"/);
});

test("CSS : un monde replié ne montre que son bandeau ; les deux retouches téléphone de la vue élève", () => {
  /* .pIntro (display:grid) est plus précis que « .monde.replie>.intro » : sans cette règle,
     l'intention restait affichée sous le bandeau d'un monde replié */
  assert.match(univers, /body\.prof \.monde\.replie>\.pIntro\{display:none\}/);
  assert.ok(univers.indexOf("body.prof .monde.replie>.pIntro{display:none}") > univers.indexOf("body.prof .monde .pIntro{display:block;"));
  const tel = univers.slice(univers.indexOf("/* VUE ÉLÈVE — deux retouches téléphone"), univers.indexOf("</style>"));
  assert.match(tel, /@media\(max-width:520px\)\{/);
  assert.match(tel, /body:not\(\.prof\) \.heroBlob\.b1,body:not\(\.prof\) \.heroBlob\.b3,body:not\(\.prof\) \.heroBlob\.b4,body:not\(\.prof\) \.heroBlob\.b6\{display:none\}/);
  assert.match(tel, /body:not\(\.prof\) \.monde>\.head\{gap:10px;padding:14px 14px\}/);
  /* 27/09/2026 : un monde qu'on ouvre remontait en haut de l'écran (le monde du dessus se repliait).
     Depuis la carte des mondes (lot 2, 08/11/2026) rien ne se replie au-dessus : seulement, au
     téléphone, la bande du monde choisi est remontée si elle tombe sous l'écran */
  assert.match(univers, /if\(r\.top>innerHeight-170\) window\.scrollTo\(\{top:scrollY\+r\.top-\(innerHeight-260\),behavior:"smooth"\}\);/);
  /* vue prof (lot 2) : le sommaire choisit le monde à l'écran, comme la carte de l'élève ; le bandeau sans flèche */
  assert.match(univers, /\.sommaire a\.choisi\{border-color:var\(--c\);box-shadow:inset 0 0 0 1px var\(--c\);background:#fbfcfe\}/);
  assert.match(univers, /return teteProfHtml\(m,mi,plage,''\)\+/);
  /* les anciens encadrés de la vue prof sont partis du CSS */
  assert.doesNotMatch(univers, /\.noteProf\{|\.eqListeProf\{|\.descProf|\.introLien\.livret|\.introNote\{/);
});
