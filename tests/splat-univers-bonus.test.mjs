import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* La carte des mondes, vue élève (04/10/2026, maquettes « bonus » 1 à 6 validées par Gwenaël) :
   - chaque partie d'un monde (Enquête, Système, Relatifs) est un menu déroulant ; fermée, elle ne
     montre que « Partie N · titre · ⭐ x/y » et son chevron ; à l'arrivée, seule la partie EN COURS
     est ouverte (celle de la première étoile à gagner) ;
   - le monde 3 a un menu de plus, « Bonus · Deuxième tour », fermé par défaut, sous la partie 3 :
     les deux livrets dans l'ordre (11d → 17d, puis 18d → 24d), un « Je joue » par fiche, sans
     phrase ; des taches blanches cerclées de framboise, dorées ✨ une fois réussies ; un compteur
     « ✨ x / 10 » à part, hors des étoiles du haut ; pas de verrou ;
   - chaque fiche bonus a SON parcours (enq11d…), et n'allume plus l'étoile de sa fiche de base.
   Lot M4-4 (04/10/2026) : le monde 4 a le même Bonus (« Deuxième tour », 25d → 28d, un livret ;
   « Cycle 4 » depuis le lot M4-7),
   aux couleurs du cannelle ; le code est commun (BONUS_MONDES), le monde 3 ne change pas (mêmes
   identifiants, mêmes textes, même clé de mémoire).
   On EXÉCUTE les fonctions de rendu de la page (voletHtml, bonusHtml) ; l'ouverture et la fermeture
   des menus ont été jouées au navigateur (captures de la notice du lot). */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("/* ============ vue élève : les parties en menus déroulants", "const main=document.getElementById(\"univers\");") +
  ";globalThis.X={MONDES,ENQ_TOUR2,SYS_TOUR2,MONDE_ENQUETE,MONDE_SYSTEME,voletHtml,bonusHtml,BONUS_MONDES};", ctx);
const { MONDES, ENQ_TOUR2, SYS_TOUR2, MONDE_ENQUETE, MONDE_SYSTEME, voletHtml, bonusHtml } = ctx.X;

test("un menu de partie naît fermé : bouton au clavier, pastille, titre, fiches, phrase, compteur, chevron", () => {
  const h = voletHtml("enq-partie-2", 1, "Partie 2", "La grande enquête", "fiches 15 à 19", "Une phrase.", "stars2-1", "");
  assert.equal(h,
    '<li class="volet ferme" id="enq-partie-2" data-volet="1" role="button" tabindex="0" aria-expanded="false">' +
    '<span class="rang">Partie 2</span><div class="t"><h4>La grande enquête<span class="fiches">fiches 15 à 19</span></h4>' +
    '<p>Une phrase.</p></div><span class="stars" id="stars2-1"></span>' +
    '<span class="chevP" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></li>');
  // fermé : seuls la pastille, le titre, le compteur et le chevron se voient
  assert.match(univers, /\.volet\.ferme \.fiches,\.volet\.ferme p\{display:none\}/);
  assert.match(univers, /\.volet\.ferme \.chevP\{transform:rotate\(-90deg\)\}/);
  assert.match(univers, /\.etapes>li\.replieP\{display:none\}/);
  // téléphone : une partie fermée tient sur une ligne
  assert.match(univers, /\.volet\.ferme \.t\{order:1;flex:1 1 0\}/);
});

test("les mondes à parties : chaque étape porte sa partie (data-partie), les autres mondes ne changent pas", () => {
  // lot M4-4 : le monde 4 n'a plus de parties (un livret, quatre fiches)
  // lot 3 de l'échauffement (14/10/2026) : le monde 6 a trois parties, l'échauffement puis les parties 1 et 2
  assert.deepEqual(JSON.parse(JSON.stringify(MONDES.map((m) => (m.volets || []).length))), [0, 0, 3, 0, 0, 3]);
  assert.match(univers, /const partie=\(m\.volets\|\|\[\]\)\.findIndex\(x=>ei>=x\.de&&ei<x\.a\);/);
  // le Bonus vient aux mondes 3 et 4, après leurs étapes ; ailleurs, rien
  assert.match(univers, /\}\)\.join\(""\)\+bonusHtml\(m\)\+'<\/ol>';/);
  MONDES.forEach((m) => assert.equal(bonusHtml(m) === "", m !== MONDE_ENQUETE && m !== MONDE_SYSTEME, m.nom));
});

test("le Bonus : un menu fermé, puis les deux livrets dans l'ordre, une tache et un « Je joue » par fiche", () => {
  const h = bonusHtml(MONDE_ENQUETE);
  assert.ok(h.startsWith('<li class="volet ferme bonus" id="enq-bonus" data-volet="bonus" role="button" tabindex="0" aria-expanded="false">' +
    '<span class="rang">Bonus</span><div class="t"><h4>Deuxième tour<span class="fiches">fiches 11d à 24d</span></h4>' +
    '<p>Pour aller plus loin : tous les types de problèmes, mélangés.</p></div><span class="stars" id="starsBonus"></span>'));
  // les deux livrets, dans l'ordre, avec leur titre
  const titres = [...h.matchAll(/<li class="livretBonus" data-partie="bonus">([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(titres, ["Livret 1 · Les trois dessins", "Livret 2 · Vers le Système"]);
  assert.ok(h.indexOf(titres[1]) > h.indexOf('id="enq-t2-17d"') && h.indexOf(titres[1]) < h.indexOf('id="enq-t2-18d"'));
  // les dix fiches : leur code dans la tache, leur titre, leur jeu (SON parcours), rien d'autre
  const fiches = [...h.matchAll(/<li class="etape bonus" id="enq-t2-(\w+)" data-partie="bonus">([\s\S]*?)<\/li>/g)];
  assert.deepEqual(fiches.map((m) => m[1]), ["11d", "12d", "13d", "16d", "17d", "18d", "20d", "22d", "19d", "24d"]);
  fiches.forEach((m, k) => {
    const f = ENQ_TOUR2[k], li = m[2];
    assert.match(li, new RegExp(`<span class="n">${f.code}</span><span class="eclat" aria-hidden="true">✨</span>`));
    assert.ok(li.includes(`<h3>${f.t}</h3>`), f.code);
    assert.ok(li.includes(`<a class="jouer" href="${f.j}">🎮 Je joue</a>`), f.code);
    assert.equal(new URLSearchParams(f.j.split("?")[1]).get("parcours"), "enq" + f.code);
    assert.doesNotMatch(li, /class="obj"|faitBtn|data-id=/, `${f.code} : pas de phrase, pas de coche à la main`);
    assert.match(li, /<button class="badge" type="button" disabled>/);
  });
});

test("le Bonus : taches blanches cerclées de la couleur du monde, dorées ✨ une fois réussies ; « Je joue » en contour", () => {
  // la couleur du monde (--c) : framboise au monde 3, cannelle au monde 4 (lot M4-4)
  assert.match(univers, /\.menq\{--c:var\(--framboise\)\}\.msys\{--c:var\(--cannelle\)\}/);
  assert.match(univers, /\.menq \.etape\.bonus \.badge use\.fond,\.msys \.etape\.bonus \.badge use\.fond\{fill:#fff;stroke:var\(--c\);stroke-width:5\}/);
  assert.match(univers, /\.menq \.etape\.bonus\.done \.badge use\.fond,\.msys \.etape\.bonus\.done \.badge use\.fond\{fill:var\(--gold\);stroke:#b8860b;stroke-width:3\}/);
  assert.match(univers, /\.etape\.bonus\.done \.badge \.eclat\{display:block\}/);
  assert.match(univers, /\.menq \.etape\.bonus \.actions a\.jouer,\.msys \.etape\.bonus \.actions a\.jouer\{background:#fff;color:var\(--c\);border:2px solid var\(--c\)\}/);
  assert.match(univers, /\.menq \.volet\.bonus\{background:#fff;border:1\.5px dashed #e8a3c3\}/);
  assert.match(univers, /\.msys \.volet\.bonus\{background:#fff;border:1\.5px dashed #e3b994\}/);
});

test("lot M4-4 : le Bonus du monde 4 — un menu « Cycle 4 » (lot M4-7), un livret, 25d → 28d, chaque fiche son parcours", () => {
  const h = bonusHtml(MONDE_SYSTEME);
  assert.ok(h.startsWith('<li class="volet ferme bonus" id="sys-bonus" data-volet="bonus" role="button" tabindex="0" aria-expanded="false">' +
    '<span class="rang">Bonus</span><div class="t"><h4>Cycle 4<span class="fiches">fiches 25d à 28d</span></h4>'));
  assert.ok(h.includes('<span class="stars" id="starsBonusSys"></span>'));
  assert.deepEqual([...h.matchAll(/<li class="livretBonus" data-partie="bonus">([^<]+)<\/li>/g)].map((m) => m[1]), ["Le livret · Cycle 4"]);
  const fiches = [...h.matchAll(/<li class="etape bonus" id="sys-t2-(\w+)" data-partie="bonus">([\s\S]*?)<\/li>/g)];
  assert.deepEqual(fiches.map((m) => m[1]), ["25d", "26d", "27d", "28d"]);
  fiches.forEach((m, k) => {
    const f = SYS_TOUR2[k];
    assert.ok(m[2].includes(`<a class="jouer" href="${f.j}">🎮 Je joue</a>`), f.code);
    assert.equal(new URLSearchParams(f.j.split("?")[1]).get("parcours"), "sys" + f.code);
  });
  // aucun nombre à sous-entendu dans ce que l'élève lit
  assert.doesNotMatch(h.replace(/href="[^"]*"/g, ""), /\b69\b/);
  // sa propre clé de mémoire (le monde 3 garde la sienne)
  // (lot 6) celle de l'élève sous un code (cleMemoire), exécutée dans tests/splat-suivi-memoire.test.mjs
  assert.match(univers, /function bonusRetenu\(b\)\{\s*const cle=cleMemoire\(CLE_BONUS_OUVERT\+\(\(b&&b\.cle\)\|\|""\)\); if\(!cle\) return false;\s*try\{ return localStorage\.getItem\(cle\)==="1"; \}catch\(e\)\{ return false; \}\s*\}/);
});

test("le compteur du Bonus est à part : « ✨ x / 10 », hors du total et de « Continuer »", () => {
  const maj = bloc("function majAffichage(){", "/* ============ accordéon");
  const k = maj.indexOf("/* les Bonus (mondes 3 et 4)");
  assert.ok(k > 0);
  const partBonus = maj.slice(k, maj.indexOf('document.getElementById("totalTxt")'));
  assert.match(partBonus, /const ok=!!\(parcours\[p\]&&parcours\[p\]\.fait\);/);
  assert.match(partBonus, /sb\.textContent="\\u2728 "\+fb\+" \/ "\+b\.fiches\.length;/);
  const code = partBonus.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(code, /total|[^.]\bfait\b|prochaine/, "le Bonus ne touche ni au total ni à « Continuer »");
  // les étoiles du monde 3 restent ses 15 étapes, celles du monde 4 ses 4
  assert.equal(MONDE_ENQUETE.etapes.length, 15);
  assert.equal(MONDE_SYSTEME.etapes.length, 4);
});

test("à l'arrivée, UNE partie ouverte par monde (05/10/2026) : celle que vise l'adresse, sinon le Bonus si l'élève y était, sinon la partie en cours", () => {
  const f = bloc("function ouvrirParties(){", "document.addEventListener(\"click\",ev=>{\n  const v=");
  assert.match(f, /let premiere=sec\.querySelector\("\.etapes>li\.etape\[data-partie\]:not\(\.done\):not\(\.bonus\)"\);/);
  assert.match(f, /const vise=\[\.\.\.volets\]\.find\(v=>elCible&&\(elCible===v\|\|\(sec\.contains\(elCible\)&&elCible\.dataset\.partie===v\.dataset\.volet\)\)\);/);
  assert.match(f, /const ouverte=vise\|\|\(bonus&&bonusRetenu\(bonusDeSection\(sec\)\)\?bonus:null\)\|\|\[\.\.\.volets\]\.find\(v=>v\.dataset\.volet===enCours\)\|\|null;/);
  assert.match(f, /volets\.forEach\(v=>ouvrirPartie\(v,v===ouverte\)\);/, "une seule ouverte");
  assert.match(univers, /ouvrirMonde\(mondeEnCours\(majAffichage\(\)\)\);\nif\(!PROF\) ouvrirParties\(\);/);
  // ouvrir ou fermer le Bonus, ou y lancer une fiche, se retient sur l'appareil
  assert.match(univers, /if\(v\.dataset\.volet==="bonus"\) retenirBonus\(o,bonusDeSection\(sec\)\);/);
  assert.match(univers, /if\(a\.closest\("li\.etape\.bonus"\)\) retenirBonus\(true,bonusDeSection\(sec\)\);/);
  assert.match(univers, /const CLE_BONUS_OUVERT="mathsgo-splat-bonus-ouvert";/);
});

test("une partie à la fois (05/10/2026) : en ouvrir une referme les autres du même monde, Bonus compris, et ramène son en-tête à l'écran", () => {
  const f = bloc("document.addEventListener(\"click\",ev=>{\n  const v=", "document.addEventListener(\"keydown\"");
  assert.match(f, /if\(o\) v\.parentElement\.querySelectorAll\(':scope>\.volet\[data-volet\]'\)\.forEach\(w=>\{\n    if\(w===v\|\|w\.classList\.contains\("ferme"\)\) return;\n    ouvrirPartie\(w,false\);\n    if\(w\.dataset\.volet==="bonus"\) retenirBonus\(false,bonusDeSection\(sec\)\);/);
  assert.ok(f.indexOf("ouvrirPartie(w,false)") < f.indexOf("ouvrirPartie(v,o)"), "les autres d'abord, puis la partie ouverte");
  assert.match(f, /if\(o\)\{ const r=v\.getBoundingClientRect\(\); if\(r\.top<0\|\|r\.top>innerHeight\*0\.6\) window\.scrollTo\(\{top:scrollY\+r\.top-8,behavior:"smooth"\}\); \}/);
  // la vue prof n'a pas de menus : ses parties restent des intertitres (voletProfHtml, sans data-volet)
  assert.doesNotMatch(bloc("function voletProfHtml(", "\n}"), /data-volet/);
});

test("?apres=enq11d (ou sys25d) : la fiche bonus suivante du même monde ; jamais une étape", () => {
  const f = bloc("const apres=new URLSearchParams(window.location.search).get(\"apres\");", "ouvrirMonde(mondeEnCours(");
  assert.match(f, /for\(const b of BONUS_MONDES\)\{\s*const kb=b\.fiches\.findIndex\(f=>b\.idp\+f\.code===apres\);/);
  /* APRES_REDIRIGE (lot 2 du suivi, 08/10/2026) : la carte repart, le suivi n'y démarre pas */
  assert.match(f, /if\(kb\+1<b\.fiches\.length\)\{ APRES_REDIRIGE=true; window\.location\.replace\(b\.fiches\[kb\+1\]\.j\); \}\n    return;/);
  assert.ok(f.indexOf("const kb=") < f.indexOf("const ici="), "le Bonus est traité avant les étapes");
});

test("les textes qui parlaient des « mêmes étoiles » : la vue prof et la page des livrets", () => {
  assert.doesNotMatch(univers, /allume l\\u2019étoile de sa fiche de base|deux livrets, mêmes étoiles/);
  assert.match(univers, /'<p>Plus dur, en bonus\\u00a0: ses étoiles sont à part\.<\/p><\/li>'/);
  const livrets = lire("outils/livrets_splat.html");
  assert.match(livrets, /<h3 class="partie">Deuxième tour <span>plus dur, en bonus<\/span><\/h3>/);
  assert.doesNotMatch(livrets, /les mêmes étoiles/);
});
