import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Les mondes « en préparation » (26/09/2026, demande de Gwenaël pendant sa relecture
   monde par monde) : pour le public, les mondes 3 et 4 (Enquête, Système ; le 6, Relatifs,
   l'était aussi jusqu'à sa mise en ligne du 27/09/2026) s'affichent « 🚧 en préparation » sur la carte des mondes, sans aucun lien (vue
   élève et vue prof), leurs livrets disparaissent de la page des livrets, et le
   bouton « Étape suivante » des outils les saute. Le monde 5 reste public.
   La clé de Gwenaël (?essai=1, retenue par le navigateur ; ?essai=0 l'efface)
   montre tout comme avant.

   LA ligne à changer pour remettre un monde en public est en tête de
   assets/js/splat-etapes.js (MONDES_EN_PREPARATION). Ces tests vérifient qu'elle
   est unique, que retirer un numéro rebranche tout (sans rien d'autre à toucher),
   et que la page des livrets, sans JavaScript, suit la même liste. */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const moduleEtapes = lire("assets/js/splat-etapes.js");
const univers = lire("outils/splat_univers.html");
const livrets = lire("outils/livrets_splat.html");
const URL_CARTE = "/outils/splat_univers.html";
const VERSION = "20261108-6";   // les aides des fiches 38 et 40 et le film « Deux taches » (AIDES, lot 6b-6c-7 « aides et carte », 08/11/2026)

// ---------- le module, exécuté avec une fausse fenêtre ----------
function stockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
function charger({ search = "", store = stockage(), source = moduleEtapes } = {}) {
  const fenetre = { location: { search }, localStorage: store };
  new Function("window", "URLSearchParams", source)(fenetre, URLSearchParams);
  return fenetre.MathsGoSplatEtapes;
}
// le module avec une autre liste (ce que fera Code en remettant un monde en public)
const LIGNE = /const MONDES_EN_PREPARATION = \[[^\]]*\];/g;
function avecListe(liste) {
  return charger({ source: moduleEtapes.replace(LIGNE, `const MONDES_EN_PREPARATION = [${liste.join(", ")}];`) });
}
const E = charger();
const ETAPES = E.ETAPES;
const tousLesMondes = [...new Set(ETAPES.map((e) => e[4]))];
// l'enchaînement « comme avant » : l'univers entier, dans l'ordre
function chaineComplete(p) {
  const k = ETAPES.findIndex((e) => e[0] === p);
  return k + 1 < ETAPES.length ? ETAPES[k + 1][0] : "carte";
}
const suivant = (mod, p, cle) => { const s = mod.suivante(p, cle); return s.derniere ? "carte" : s.parcours; };

test("une seule ligne, en tête du fichier, vide depuis le 05/10/2026 (le 4 est public, le 3 depuis le 30/09, le 6 depuis le 27/09)", () => {
  const lignes = moduleEtapes.match(LIGNE) || [];
  assert.equal(lignes.length, 1, "MONDES_EN_PREPARATION doit être écrit une seule fois");
  assert.ok(moduleEtapes.indexOf(lignes[0]) < moduleEtapes.indexOf("const ETAPES"), "la ligne doit être en tête, avant la liste des étapes");
  assert.deepEqual([...E.MONDES_EN_PREPARATION], []);
  // chaque numéro est bien un monde de la carte
  for (const n of E.MONDES_EN_PREPARATION) assert.ok(tousLesMondes.includes(n), `monde ${n} inconnu de la carte`);
  // et c'est bien le numéro AFFICHÉ sur la carte : Enquête 3, Système 4, Équations 5, Relatifs 6
  const nomDe = (n) => ETAPES.find((e) => e[4] === n)[3];
  assert.deepEqual([3, 4, 5, 6].map(nomDe), ["SPLAT! Enquête", "SPLAT! Système", "SPLAT! Équations", "SPLAT! Relatifs"]);
});

test("la clé : ?essai=1 l'enregistre, elle survit au rechargement, ?essai=0 l'efface", () => {
  const store = stockage();
  assert.equal(charger({ store }).cle, false, "sans clé");
  assert.equal(charger({ store, search: "?essai=1" }).cle, true);
  assert.equal(store.m.get(E.CLE_ESSAI), "1");
  assert.equal(charger({ store, search: "" }).cle, true, "rechargement sans ?essai : la clé reste");
  assert.equal(charger({ store, search: "?apres=m2e5" }).cle, true);
  assert.equal(charger({ store, search: "?essai=0" }).cle, false);
  assert.equal(store.m.has(E.CLE_ESSAI), false, "?essai=0 efface la clé");
  assert.equal(charger({ store }).cle, false);
  // navigation privée : le stockage refuse tout — la clé vaut pour la page ouverte seulement
  const refuse = { getItem() { throw new Error("refusé"); }, setItem() { throw new Error("refusé"); }, removeItem() { throw new Error("refusé"); } };
  assert.equal(charger({ store: refuse, search: "?essai=1" }).cle, true);
  assert.equal(charger({ store: refuse }).cle, false);
  // aucune fenêtre (les autres tests) : pas de clé, et pas d'erreur
  const nue = {}; new Function("window", moduleEtapes)(nue);
  assert.equal(nue.MathsGoSplatEtapes.cle, false);
});

test("sans la clé (plus aucun monde en préparation depuis le 05/10/2026) : le monde 4 suit le monde 3 (24 → 25), le monde 5 suit le monde 4 (28 → 35)", () => {
  const b = (p) => E.bouton(p, URL_CARTE, false);
  assert.equal(E.sousTitre("m2e5", false), "🌍 Nouveau monde : SPLAT! Enquête");
  // le monde 4 (Système) est public depuis le 05/10/2026 : après l'Enquête, le Système
  assert.equal(E.sousTitre("enq24", false), "🌍 Nouveau monde : SPLAT! Système");
  assert.deepEqual(E.suivante("enq24", false), { derniere: false, parcours: "sys25", numero: 25, titre: "Je retire", monde: "SPLAT! Système", nouveauMonde: true });
  assert.equal(suivant(E, "sys27", false), "sys28");
  // après la fiche 28, les Équations (le Bonus 25d-28d est à part, comme au monde 3)
  assert.equal(E.sousTitre("sys28", false), "🌍 Nouveau monde : SPLAT! Équations");
  assert.deepEqual(E.suivante("sys28", false), { derniere: false, parcours: "m3e1", numero: 35, titre: "Premières équations", monde: "SPLAT! Équations", nouveauMonde: true });
  assert.equal(b("enq24").href, `${URL_CARTE}?apres=enq24`);
  // ses fiches bonus (un QR du livret « Deuxième tour ») : la suivante, puis la carte sur le Bonus
  assert.equal(suivant(E, "sys25d", false), "sys26d");
  assert.equal(E.bouton("sys28d", URL_CARTE, false).href, URL_CARTE + "#sys-bonus");
  assert.deepEqual(b("m4e6"), { html: "Voir la carte des mondes ▶", href: URL_CARTE, versCarte: true });
  // sans la clé, tout l'univers s'enchaîne comme avec elle
  for (const e of ETAPES) assert.equal(suivant(E, e[0], false), chaineComplete(e[0]), `après ${e[0]}`);
});

test("avec la clé, ou la liste vide : tout l'univers s'enchaîne comme avant (étapes 1 à 43)", () => {
  const vide = avecListe([]);
  for (const e of ETAPES) {
    assert.equal(suivant(E, e[0], true), chaineComplete(e[0]), `avec la clé, après ${e[0]}`);
    assert.equal(suivant(vide, e[0], false), chaineComplete(e[0]), `liste vide, après ${e[0]}`);
    assert.deepEqual(vide.bouton(e[0], URL_CARTE, false), E.bouton(e[0], URL_CARTE, true));
  }
});

test("remettre un monde en public = retirer son numéro : tout se rebranche seul", () => {
  for (const n of [3, 4, 6]) {
    const reste = [3, 4, 6].filter((x) => x !== n);
    const mod = avecListe(reste);
    const siens = ETAPES.filter((e) => e[4] === n).map((e) => e[0]);
    // ses étapes s'enchaînent entre elles, comme avant
    for (const p of siens.slice(0, -1)) assert.equal(suivant(mod, p, false), chaineComplete(p), `monde ${n}, après ${p}`);
    // on y arrive depuis le dernier monde public qui le précède
    const avant = ETAPES.filter((e) => e[4] < n && !reste.includes(e[4])).pop();
    assert.equal(suivant(mod, avant[0], false), siens[0], `monde ${n} : on y entre après ${avant[0]}`);
    // et il mène au monde public suivant (ou à la carte s'il n'y en a pas)
    const apres = ETAPES.find((e) => e[4] > n && !reste.includes(e[4]));
    assert.equal(suivant(mod, siens[siens.length - 1], false), apres ? apres[0] : "carte", `monde ${n} : sortie`);
  }
});

// ---------- la carte des mondes ----------
test("la carte des mondes charge splat-etapes.js (même version que les outils) et en tient compte partout", () => {
  const m = univers.match(/<script src="\.\.\/assets\/js\/splat-etapes\.js\?v=([\w-]+)"><\/script>/);
  assert.ok(m, "la carte doit charger assets/js/splat-etapes.js");
  assert.equal(m[1], VERSION);
  assert.ok(univers.indexOf(m[0]) < univers.indexOf("</head>"), "dans <head>");
  // chaque monde reçoit « cache » d'après son numéro affiché (rang + 1)
  assert.match(univers, /MONDES\.forEach\(\(m,mi\)=>\{ m\.cache=!!\(SPLAT_ETAPES&&SPLAT_ETAPES\.mondeCache\(mi\+1\)\); \}\);/);
  // un monde caché, vue élève : le bandeau et une phrase, et on sort avant de fabriquer étapes et liens
  // (la vue prof a son propre rendu depuis le lot « vue prof » du 27/09/2026 : mondeProfHtml, plus bas)
  const boucle = univers.indexOf("else MONDES.forEach((m,mi)=>{");
  const debut = univers.indexOf("\n  if(m.cache){", boucle), fin = univers.indexOf("    return;\n  }", debut);
  assert.ok(boucle > 0, "boucle de la vue élève introuvable");
  assert.ok(debut > 0 && fin > debut, "branche « monde caché » du rendu introuvable");
  const branche = univers.slice(debut, fin);
  assert.doesNotMatch(branche, /href="(?!#tacheEtoile)|<a |m\.etapes\.map|NOTES_/, "aucun lien, aucune étape, aucune note prof");
  assert.match(branche, /PREPA_BANDEAU/);
  assert.match(branche, /PREPA_PHRASE/);
  assert.match(branche, /compteur\+=m\.etapes\.length/, "les numéros des mondes suivants ne bougent pas");
  // cette branche passe AVANT le rendu des étapes et des liens
  assert.ok(debut < univers.indexOf("'<ol class=\"etapes\">'", boucle), "le monde caché doit sortir avant le rendu des étapes");
  // vue prof : même règle — le bandeau, qui ne s'ouvre pas, et la phrase ; ni note, ni lien
  const prof = univers.slice(univers.indexOf("function mondeProfHtml(m,mi,plage){"), univers.indexOf("function sommaireProfHtml("));
  assert.match(prof, /\n  if\(m\.cache\) return teteProfHtml\(m,mi,plage,''\)\+'<p class="prepa">'\+PREPA_PHRASE\+'<\/p>';\n/);
  assert.match(univers, /'<span class="fichesTete">'\+\(m\.cache\?'en préparation':/);
  assert.match(univers, /'<span class="sf">'\+\(m\.cache\?'en préparation':/);
  assert.match(univers, /const mi=\+a\.dataset\.mi; if\(MONDES\[mi\]\.cache\) return;/, "le sommaire n'ouvre pas un monde caché");
  // les étoiles, « Continuer » et ?apres= ne comptent que les mondes jouables (lot « splat-suivi-5 » :
  // un monde fermé à la classe garde ses étoiles sur son bandeau, hors du total et de « Continuer »)
  assert.match(univers, /if\(!m\.actif\|\|m\.cache\) return;\n    let f=0;/);
  assert.match(univers, /if\(!m\.verrouille\) total\+\+;/);
  assert.match(univers, /if\(ok\)\{f\+\+; if\(!m\.verrouille\) fait\+\+;\}/);
  assert.match(univers, /const suite=ici&&ici\.cache\?ici\.etapes:MONDES\.flatMap\(m=>jouable\(m\)\?m\.etapes:\[\]\);/);
  assert.doesNotMatch(univers, /flatMap\(m=>m\.actif\?m\.etapes:\[\]\)/, "plus d'enchaînement qui ignore les mondes cachés");
  // le monde retenu sur l'appareil ne rouvre pas un monde caché
  assert.match(univers, /if\(retenu>=0&&!MONDES\[retenu\]\.cache&&!MONDES\[retenu\]\.verrouille\) return retenu;/);
  // les textes choisis par Gwenaël (26/09)
  assert.match(univers, /const PREPA_BANDEAU="\\ud83d\\udea7 en pr\\u00e9paration";/);
  assert.match(univers, /const PREPA_PHRASE="Ce monde est en pr\\u00e9paration\\u00a0: il arrive bient\\u00f4t\\u00a0!";/);
});

// ---------- la page des livrets ----------
test("la page des livrets : sans JavaScript, les mondes de la liste restent cachés (data-prepa écrit dans la page)", () => {
  const m = livrets.match(/<script src="\.\.\/assets\/js\/splat-etapes\.js\?v=([\w-]+)"><\/script>/);
  assert.ok(m, "la page des livrets doit charger assets/js/splat-etapes.js");
  assert.equal(m[1], VERSION);
  assert.ok(livrets.indexOf(m[0]) < livrets.indexOf("<style>"), "avant le <style>");
  assert.ok(livrets.indexOf('className += " js"') < livrets.indexOf("<style>"), "la classe js reste posée avant le <style>");
  // les onglets et les panneaux qui existent
  const onglets = [...livrets.matchAll(/<a href="#monde-(\d)" data-m="\d" id="onglet-\d" role="tab" aria-controls="monde-\d" aria-selected="(?:true|false)"( data-prepa)?>/g)];
  const panneaux = [...livrets.matchAll(/<section class="panneau" data-m="(\d)" id="monde-\d"( data-prepa)? role="tabpanel"/g)];
  assert.ok(onglets.length >= 5 && panneaux.length === onglets.length);
  for (const [, n, prepa] of [...onglets, ...panneaux]) {
    assert.equal(!!prepa, E.MONDES_EN_PREPARATION.includes(Number(n)),
      `monde ${n} : « data-prepa » doit suivre la liste de assets/js/splat-etapes.js (${E.MONDES_EN_PREPARATION}) — ` +
      "il ne sert que sans JavaScript ; après avoir retiré un monde de la liste, retirer aussi ses deux data-prepa");
  }
  // le CSS : caché avec ou sans JS, et le masquage « hidden » des onglets reste comme avant
  assert.match(livrets, /\.panneau\[data-prepa\],#onglets a\[data-prepa\]\{display:none\}/);
  const regles = [".panneau[hidden]{display:block}", "html.js .panneau[hidden]{display:none}", ".panneau[data-prepa],#onglets a[data-prepa]{display:none}"];
  regles.reduce((pos, r) => { const i = livrets.indexOf(r); assert.ok(i > pos, `ordre des règles : ${r}`); return i; }, 0);
  // avec JavaScript, c'est la liste (et la clé) qui décident, pas ce qui est écrit
  assert.match(livrets, /if\(etapes\.mondeCache\(n\)\)\{\n\s*el\.setAttribute\("data-prepa", ""\);/);
  assert.match(livrets, /\} else el\.removeAttribute\("data-prepa"\);/);
  assert.match(livrets, /querySelectorAll\("#onglets a:not\(\[data-prepa\]\):not\(\[data-grise\]\)"\)/, "les flèches du clavier et #monde-N ignorent les mondes cachés");
});

test("la phrase de la page des livrets, exécutée", () => {
  const debut = livrets.indexOf("  var etapes = window.MathsGoSplatEtapes;");
  const fin = livrets.indexOf("  var onglets = Array.prototype.slice");
  const code = livrets.slice(debut, fin);
  function jouer(liste, cle) {
    const els = [3, 4, 5].flatMap((n) => [
      { dataset: { m: String(n) }, attrs: {}, classList: { contains: () => false } },
      { dataset: { m: String(n) }, attrs: {}, classList: { contains: (c) => c === "panneau" } }]);
    els.forEach((el) => { el.setAttribute = (k, v) => { el.attrs[k] = v; }; el.removeAttribute = (k) => { delete el.attrs[k]; }; });
    const phrase = { hidden: true, textContent: "" };
    const mod = avecListe(liste);
    const window = { MathsGoSplatEtapes: { ...mod, mondeCache: (n) => mod.mondeCache(n, cle) } };
    const document = { querySelectorAll: () => els, getElementById: () => phrase };
    vm.runInNewContext(code, { window, document, Array });
    return { phrase, caches: els.filter((e) => "data-prepa" in e.attrs).map((e) => e.dataset.m) };
  }
  let r = jouer([3, 4, 6], false);
  assert.equal(r.phrase.hidden, false);
  assert.equal(r.phrase.textContent, "🚧 Les livrets des mondes 3 et 4 sont en préparation.");
  assert.deepEqual([...new Set(r.caches)], ["3", "4"]);
  r = jouer([3, 6], false);
  assert.equal(r.phrase.textContent, "🚧 Les livrets du monde 3 sont en préparation.");
  r = jouer([6], false);
  assert.equal(r.phrase.hidden, true, "le monde 6 n'a pas de livret : pas de phrase");
  r = jouer([3, 4, 6], true);
  assert.equal(r.phrase.hidden, true, "avec la clé : pas de phrase, tout est là");
  assert.deepEqual(r.caches, []);
});
