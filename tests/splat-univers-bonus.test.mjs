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
  ";globalThis.X={MONDES,ENQ_TOUR2,MONDE_ENQUETE,voletHtml,bonusHtml,BONUS_LIVRETS};", ctx);
const { MONDES, ENQ_TOUR2, MONDE_ENQUETE, voletHtml, bonusHtml } = ctx.X;

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
  assert.deepEqual(JSON.parse(JSON.stringify(MONDES.map((m) => (m.volets || []).length))), [0, 0, 3, 2, 0, 2]);
  assert.match(univers, /const partie=\(m\.volets\|\|\[\]\)\.findIndex\(x=>ei>=x\.de&&ei<x\.a\);/);
  // le Bonus ne vient qu'au monde 3, après ses quinze étapes
  assert.match(univers, /\}\)\.join\(""\)\+\(m===MONDE_ENQUETE\?bonusHtml\(\):''\)\+'<\/ol>';/);
});

test("le Bonus : un menu fermé, puis les deux livrets dans l'ordre, une tache et un « Je joue » par fiche", () => {
  const h = bonusHtml();
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

test("le Bonus : taches blanches cerclées de framboise, dorées ✨ une fois réussies ; « Je joue » en contour", () => {
  assert.match(univers, /\.menq \.etape\.bonus \.badge use\.fond\{fill:#fff;stroke:var\(--framboise\);stroke-width:5\}/);
  assert.match(univers, /\.menq \.etape\.bonus\.done \.badge use\.fond\{fill:var\(--gold\);stroke:#b8860b;stroke-width:3\}/);
  assert.match(univers, /\.etape\.bonus\.done \.badge \.eclat\{display:block\}/);
  assert.match(univers, /\.menq \.etape\.bonus \.actions a\.jouer\{background:#fff;color:var\(--framboise\);border:2px solid var\(--framboise\)\}/);
  assert.match(univers, /\.menq \.volet\.bonus\{background:#fff;border:1\.5px dashed #e8a3c3\}/);
});

test("le compteur du Bonus est à part : « ✨ x / 10 », hors du total et de « Continuer »", () => {
  const maj = bloc("function majAffichage(){", "/* ============ accordéon");
  const k = maj.indexOf("/* le Bonus du monde 3");
  assert.ok(k > 0);
  const partBonus = maj.slice(k, maj.indexOf('document.getElementById("totalTxt")'));
  assert.match(partBonus, /const ok=!!\(parcours\[p\]&&parcours\[p\]\.fait\);/);
  assert.match(partBonus, /sb\.textContent="\\u2728 "\+fb\+" \/ "\+ENQ_TOUR2\.length;/);
  const code = partBonus.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(code, /total|[^.]\bfait\b|prochaine/, "le Bonus ne touche ni au total ni à « Continuer »");
  // les étoiles du monde 3 restent ses 15 étapes
  assert.equal(MONDE_ENQUETE.etapes.length, 15);
});

test("à l'arrivée : la partie en cours ouverte, le Bonus seulement si l'élève y était ; une adresse peut viser une partie", () => {
  const f = bloc("function ouvrirParties(){", "document.addEventListener(\"click\",ev=>{\n  const v=");
  assert.match(f, /const premiere=sec\.querySelector\("\.etapes>li\.etape\[data-partie\]:not\(\.done\):not\(\.bonus\)"\);/);
  assert.match(f, /let o=cle==="bonus"\?bonusRetenu\(\):cle===enCours;/);
  assert.match(f, /if\(elCible&&\(elCible===v\|\|\(sec\.contains\(elCible\)&&elCible\.dataset\.partie===cle\)\)\) o=true;/);
  assert.match(univers, /ouvrirMonde\(mondeEnCours\(majAffichage\(\)\)\);\nif\(!PROF\) ouvrirParties\(\);/);
  // ouvrir ou fermer le Bonus, ou y lancer une fiche, se retient sur l'appareil
  assert.match(univers, /if\(v\.dataset\.volet==="bonus"\) retenirBonus\(o\);/);
  assert.match(univers, /if\(a\.closest\("li\.etape\.bonus"\)\) retenirBonus\(true\);/);
  assert.match(univers, /const CLE_BONUS_OUVERT="mathsgo-splat-bonus-ouvert";/);
});

test("?apres=enq11d : la fiche bonus suivante ; jamais une étape", () => {
  const f = bloc("const apres=new URLSearchParams(window.location.search).get(\"apres\");", "ouvrirMonde(mondeEnCours(");
  assert.match(f, /const kb=ENQ_TOUR2\.findIndex\(f=>"enq"\+f\.code===apres\);/);
  assert.match(f, /if\(kb\+1<ENQ_TOUR2\.length\) window\.location\.replace\(ENQ_TOUR2\[kb\+1\]\.j\);\n    return;/);
  assert.ok(f.indexOf("const kb=") < f.indexOf("const ici="), "le Bonus est traité avant les étapes");
});

test("les textes qui parlaient des « mêmes étoiles » : la vue prof et la page des livrets", () => {
  assert.doesNotMatch(univers, /allume l\\u2019étoile de sa fiche de base|deux livrets, mêmes étoiles/);
  assert.match(univers, /'<p>Plus dur, en bonus\\u00a0: ses étoiles sont à part\.<\/p><\/li>'/);
  const livrets = lire("outils/livrets_splat.html");
  assert.match(livrets, /<h3 class="partie">Deuxième tour <span>plus dur, en bonus<\/span><\/h3>/);
  assert.doesNotMatch(livrets, /les mêmes étoiles/);
});
