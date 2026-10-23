// Défi tables — lot « retouches après Mon parcours » (04/10/2026, décisions de
// Gwenaël sur planches, dossier audit-defi-tables\retouches-apres-mon-parcours\) :
//   1. Mon parcours s'ouvre EN HAUT au téléphone (il avait choisi « centré sur
//      Mes calculs » à midi, il a changé d'avis en essayant) ;
//   2. « Demain » à côté d'« Aujourd'hui », côte à côte : les calculs dont le
//      jour de retour est demain (ratés aujourd'hui, ou échéance demain) ;
//   3. la flèche des perles part de la perle À ATTRAPER et glisse avec elle ;
//   4. la bande (construire et bande à trous) : 1re erreur, « essaie encore »
//      sans rien montrer ; 2e, la réponse en ambre ; en fin de bande, toutes
//      les réponses en ambre s'effacent ensemble ; un calcul trouvé au 2e
//      essai compte comme une erreur dans le score de l'étape ;
//   5. « 10 × 10 = 100 » reste sur une ligne au téléphone ;
//   6. le cadre blanc entier sur les petits écrans d'ordinateur ;
//   7. l'accueil une fois la séance du jour faite : « ✓ Séance du jour faite »,
//      « À retenir » (la liste de la JOURNÉE, seulement les calculs répondus de
//      mémoire), « Encore une séance » (qui MONTRE la séance suivante depuis le
//      lot « Encore une séance » du 08/10, voir defi-tables-encore-une-seance) ;
//   8. « 3 fois cette semaine » à la place des ronds, rien à zéro.
//
// Le moteur est chargé tel quel ; les fonctions de la page sont EXTRAITES et
// EXÉCUTÉES avec un faux DOM.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const applis = await readFile(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// ------------------------------------------------------------------ faux DOM
function element(tag = "div") {
  const classes = new Set();
  const el = {
    tag, id: "", type: "", hidden: false, children: [], attrs: {}, ecouteurs: {}, style: {}, _texte: "",
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    get textContent() { return el.children.length ? el.children.map(n => (typeof n === "string" ? n : n.textContent)).join("") : el._texte; },
    set textContent(v) { el.children = []; el._texte = String(v); },
    classList: {
      toggle(c, on) { (on === undefined ? !classes.has(c) : on) ? classes.add(c) : classes.delete(c); },
      add(...c) { c.forEach(x => classes.add(x)); }, remove(...c) { c.forEach(x => classes.delete(x)); }, contains(c) { return classes.has(c); }
    },
    append(...n) { el.children.push(...n); }, appendChild(n) { el.children.push(n); return n; },
    replaceChildren(...n) { el.children = [...n]; el._texte = ""; },
    setAttribute(k, v) { el.attrs[k] = String(v); }, removeAttribute(k) { delete el.attrs[k]; },
    addEventListener(t, f) { el.ecouteurs[t] = f; }, click() { el.ecouteurs.click?.(); },
    remove() { el.retire = true; }, focus() {}, getBoundingClientRect: () => ({top: 100, bottom: 200, height: 100})
  };
  return el;
}
const tous = (el, test) => (el.children || []).flatMap(n => (typeof n === "string" ? [] : [...(test(n) ? [n] : []), ...tous(n, test)]));
const parClasse = (el, c) => tous(el, n => n.classList.contains(c));
const parTag = (el, t) => tous(el, n => n.tag === t);
function fauxDocument() {
  const ids = {};
  const $ = id => (ids[id] ||= Object.assign(element(), {id}));
  const document = {createElement: tag => element(tag), createTextNode: t => t, querySelector: () => null};
  return {document, $};
}

const AUJ = "2026-10-06";
const DEMAIN = "2026-10-07";
const pluriel = (n, m) => `${n} ${m}${n > 1 ? "s" : ""}`;

// ------------------------------------------------- 7. « À retenir », le moteur

test("7. « À retenir » est gardé dans le parcours : un jour, chaque calcul une fois, rien d’autre", () => {
  assert.equal(P.creerParcours().retenir, null);
  const p = P.normaliserParcours({...P.creerParcours(), retenir: {jour: AUJ, erreurs: [407, 704, 310, 103, "x", 1111, 407]}});
  assert.deepEqual(p.retenir, {jour: AUJ, erreurs: [407, 310, 103]}, "7 × 4 est le même calcul que 4 × 7 ; texte et hors tables écartés");
  assert.deepEqual(P.aRetenir(p, AUJ), [[4, 7], [3, 10], [1, 3]]);
  assert.deepEqual(P.aRetenir(p, DEMAIN), [], "le lendemain, la liste repart de zéro");
  assert.equal(P.normaliserParcours({...P.creerParcours(), retenir: {jour: AUJ, erreurs: []}}).retenir, null);
  assert.equal(P.normaliserParcours({...P.creerParcours(), retenir: {erreurs: [407]}}).retenir, null, "sans jour, rien");
  assert.equal(P.normaliserParcours({...P.creerParcours(), retenir: [407]}).retenir, null);
});

// Une élève de la table de 4 (départ 4), dont les calculs reviennent aujourd'hui.
// Lot « un seul système » (05/10/2026) : Mes calculs du jour ne prend que les
// calculs des tables PASSÉES — elle a donc passé la table de 2 (le 2 octobre),
// dont les calculs reviennent aujourd'hui : sa séance commence par eux.
function eleve({tablePassee = true} = {}) {
  let p = P.creerParcours();
  p.tables[4].seance = {depart: 4, n: 3, dernier: "2026-10-05"};
  for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `4-${m}`, {correcte: true, date: "2026-10-05"}).parcours;
  if (tablePassee) {
    p.tables[2].acquise = "2026-10-02";
    for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `2-${m}`, {correcte: true, date: "2026-10-05"}).parcours;
  }
  return P.normaliserParcours(p);
}
// Joue une séance entière ; erreurs(etape) = les ratés de l'étape.
function jouerSeance(p, erreurs = () => []) {
  let seance = P.ouvrirSeance(p, {aujourdhui: AUJ});
  const types = [];
  for (let garde = 0; garde < 8 && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, AUJ);
    if (!etape) break;
    types.push(etape.type);
    const rates = erreurs(etape);
    ({parcours: p, seance} = P.noterEtape(p, seance, etape, {juste: 10 - Math.min(2, rates.length), total: 10, erreurs: rates}, AUJ));
  }
  return {parcours: p, seance, types};
}

test("7. la liste de la JOURNÉE : elle grandit au fil des séances, sans les erreurs de J’apprends", () => {
  const une = jouerSeance(eleve(), etape => (etape.type === "revision" ? [[2, 7]] : etape.type === "apprends" ? [[4, 6]] : [[4, 9], [4, 10]]));
  assert.equal(une.types[0], "revision", "une table passée : la séance commence par Mes calculs du jour");
  assert.ok(une.types.includes("apprends") && une.types.includes("entraine"), `une séance complète (${une.types})`);
  assert.equal(une.seance.finie, true);
  assert.equal(une.parcours.enCours, null, "finie : la séance n’est plus en cours…");
  assert.equal(une.parcours.calculsDuJour, AUJ, "Mes calculs du jour est noté joué : la porte est ouverte");
  assert.deepEqual(P.aRetenir(une.parcours, AUJ), [[2, 7], [4, 9], [4, 10]], "… mais sa liste reste ; « Dans l’ordre » (J’apprends) n’y met rien, × 10 oui");
  assert.deepEqual(une.seance.erreurs, [[2, 7], [4, 9], [4, 10]], "le bilan et la séance disent la même chose");
  const deux = jouerSeance(une.parcours, etape => (etape.type === "entraine" ? [[9, 4], [8, 4]] : []));
  assert.equal(deux.seance.finie, true);
  assert.deepEqual(P.aRetenir(deux.parcours, AUJ), [[2, 7], [4, 9], [4, 10], [8, 4]], "la 2e séance ajoute ses ratés ; 9 × 4 est déjà là (4 × 9)");
  assert.deepEqual(deux.seance.erreurs, [[9, 4], [8, 4]], "la séance, elle, ne garde que les siens");
  // Sans table passée, jamais d'étape « Mes calculs du jour » : les calculs
  // dus de la table en cours n'y vont pas, la séance a ses 4 marches.
  const sansTablePassee = jouerSeance(eleve({tablePassee: false}));
  assert.equal(sansTablePassee.types.includes("revision"), false, `pas de Mes calculs du jour sans table passée (${sansTablePassee.types})`);
  assert.equal(sansTablePassee.types.filter(type => type !== "validation").length, 4, "ses 4 marches (le test peut suivre la marche 7 : lot « retours de classe »)");
  assert.deepEqual(P.aRetenir(deux.parcours, DEMAIN), []);
  // Le lendemain, une séance repart d'une liste vide.
  let p = deux.parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: DEMAIN});
  const etape = P.etapeDeSeance(p, seance, DEMAIN);
  ({parcours: p} = P.noterEtape(p, seance, etape, {juste: 9, total: 10, erreurs: [[4, 3]]}, DEMAIN));
  assert.deepEqual(p.retenir, {jour: DEMAIN, erreurs: [403]});
});

test("7. la fusion : le même jour, les deux listes réunies ; sinon, la plus récente", () => {
  const a = {...P.creerParcours(), retenir: {jour: AUJ, erreurs: [407, 309]}};
  const b = {...P.creerParcours(), retenir: {jour: AUJ, erreurs: [904, 704, 610]}};
  assert.deepEqual(P.fusionner(a, b).retenir, {jour: AUJ, erreurs: [407, 309, 904, 610]});
  const vieux = {...P.creerParcours(), retenir: {jour: "2026-10-05", erreurs: [205]}};
  assert.deepEqual(P.fusionner(vieux, b).retenir, b.retenir);
  assert.deepEqual(P.fusionner(b, vieux).retenir, b.retenir);
  assert.equal(P.fusionner(P.creerParcours(), P.creerParcours()).retenir, null);
});

test("7. le serveur accepte « retenir » (ses sous-clés jour et erreurs sont déjà déclarées)", () => {
  const cles = applis.slice(applis.indexOf("'cles' => ["), applis.indexOf("],", applis.indexOf("'cles' => [")));
  for (const cle of ["retenir", "jour", "erreurs"]) assert.match(cles, new RegExp(`'${cle}'`));
});

// --------------------------------------------- 7. l'accueil et le bilan (page)

const cadreARetenir = document => new Function("document", `${source("cadreARetenir")}; return cadreARetenir;`)(document);

test("7. l’accueil, séance du jour faite : « ✓ Séance du jour faite », la liste du jour, « Encore une séance »", () => {
  const {document} = fauxDocument();
  let lancee = null;
  let rendus = 0;
  const state = {encoreOuverte: false};
  // Lot E3b : la carte lit la liste telle qu'elle s'affiche (aRetenirAffiche,
  // sans les erreurs d'une évaluation encore ouverte) — ici, pas d'évaluation.
  const fabrique = parcours => new Function("document", "PARCOURS", "parcours", "commencerSeance", "cadreARetenir", "state", "renderAccueil", "$", "aRetenirAffiche",
    `${source("carteSeanceFaite")}; return carteSeanceFaite;`)(document, {...P, aRetenir: q => P.aRetenir(q, AUJ)}, parcours, table => { lancee = table; }, cadreARetenir(document),
    state, () => { rendus += 1; }, () => null, () => P.aRetenir(parcours, AUJ));
  const avec = fabrique(P.normaliserParcours({...P.creerParcours(), retenir: {jour: AUJ, erreurs: [308, 309, 310, 703]}}))(3);
  assert.equal(avec.tag, "div", "la carte n’est plus un bouton (le bouton est dedans)");
  assert.equal(parClasse(avec, "fait")[0].textContent, "✓Séance du jour faite");
  const retenir = parClasse(avec, "retenir")[0];
  assert.equal(parTag(retenir, "h2")[0].textContent, "À retenir pour la prochaine séance");
  assert.deepEqual(parTag(retenir, "li").map(li => li.textContent), ["3\u00a0×\u00a08\u00a0=24", "3\u00a0×\u00a09\u00a0=27", "3\u00a0×\u00a010\u00a0=30", "7\u00a0×\u00a03\u00a0=21"]);
  const encore = parTag(avec, "button")[0];
  assert.equal(encore.textContent, "Encore une séance");
  assert.equal(encore.id, "acc-seance", "le même identifiant : le retour du menu y remet le focus");
  encore.click();
  assert.equal(lancee, null, "« Encore une séance » ne lance plus la séance d'un coup (lot « Encore une séance »)…");
  assert.equal(state.encoreOuverte, true, "… il la fait montrer par l'accueil");
  assert.equal(rendus, 1, "l'accueil est redessiné une fois");
  assert.deepEqual(parTag(avec, "li").length, 4, "pas la liste des étapes cochées (refusée : plus chargé)");
  const sans = fabrique(P.creerParcours())(3);
  assert.equal(parClasse(sans, "retenir").length, 0, "rien à retenir : pas de pastilles");
  assert.equal(parTag(sans, "button")[0].textContent, "Encore une séance");
  const hier = fabrique(P.normaliserParcours({...P.creerParcours(), retenir: {jour: "2026-10-05", erreurs: [308]}}))(3);
  assert.equal(parClasse(hier, "retenir").length, 0, "la liste d’hier ne s’affiche pas");
  // La carte « faite » seulement quand une séance est finie aujourd'hui et qu'aucune n'est en cours.
  assert.match(source("carteDeSeance"), /const faite = PARCOURS\.bilanSeances\(parcours\)\.aujourdhui > 0;\s*(\/\/[^\n]*\s*)*if \(faite && !reprise && !state\.encoreOuverte\) return carteSeanceFaite\(table\);/);
});

test("7. le bilan de chaque séance montre la liste du jour", () => {
  // Lot E3b : la liste telle qu'elle s'affiche (sans les erreurs d'une évaluation encore ouverte).
  assert.match(source("renderBilanSeance"), /const retenir = cadreARetenir\(aRetenirAffiche\(\)\);/);
  assert.doesNotMatch(source("renderBilanSeance"), /seance\.erreurs/);
});

// ---------------------------------------------------------- 2. « Demain »

function mesCalculs(parcours) {
  const {document, $} = fauxDocument();
  const avant = `
    const document = ARG.document; const $ = ARG.$; const parcours = ARG.parcours;
    const PARCOURS = {...ARG.P, jourLocal: () => ARG.AUJ,
      grilleCalculs: p => ARG.P.grilleCalculs(p, ARG.AUJ), agendaCalculs: p => ARG.P.agendaCalculs(p, ARG.AUJ),
      etatAffichage: p => ARG.P.etatAffichage(p, ARG.AUJ), calculsDus: (p, o) => ARG.P.calculsDus(p, {...o, aujourdhui: ARG.AUJ})};
    const tableEnCours = () => 3; let calculsSelection = null;
    const MARGE_DETAIL = 8; const window = {innerHeight: 740, scrollBy: () => {}};
    const LIBELLES_ETATS_CALCULS = {"jamais-vu": "pas encore vu", "a-travailler": "à revoir", "en-cours": "en route", "su": "su"};
    const pluriel = ARG.pluriel;`;
  const fonctions = ["soude", "jourDuJour", "majuscule", "ligneDetail", "libelleDans", "montrerDetail", "sansAnimation",
    "jourDeRetour", "calculsDeDemain", "sortesDeCalculs", "renderCalculsDetail", "renderBoites", "renderCalculs", "renderJour"].map(source);
  const code = [avant, ...fonctions, "renderCalculs();", "return {selection: () => calculsSelection, demain: () => calculsDeDemain()};"].join("\n");
  const etat = new Function("ARG", code)({document, $, P, parcours, AUJ, pluriel});
  return {$, etat, jour: () => $("calculs-jour"), detail: () => $("calculs-detail"),
    allumees: () => $("calculs-grille").children.filter(n => n.classList.contains("is-dans-boite")).map(c => c.textContent.replace(/\D/g, ""))};
}
// Léa, mardi : 3 × 7 et 3 × 8 reviennent aujourd'hui ; 3 × 3, 3 × 4 et 3 × 6
// demain ; 3 × 9 dans deux jours ; 3 × 5 raté AUJOURD'HUI (il revient demain).
// Lot « un seul système » (05/10/2026) : « Aujourd'hui » et « Demain » ne
// comptent que les calculs des tables PASSÉES — Léa a passé la table de 3 le
// 1er octobre (passee: false : la même, sans table passée).
function lea({passee = true} = {}) {
  let p = P.creerParcours();
  if (passee) p.tables[3].acquise = "2026-10-01";
  const rep = (cle, ok, date) => { p = P.appliquerReponse(p, cle, {correcte: ok, date}).parcours; };
  for (const c of ["3-3", "3-4", "3-6", "3-7", "3-8", "3-9", "3-5"]) rep(c, true, "2026-10-02");
  for (const c of ["3-3", "3-4", "3-6"]) rep(c, true, "2026-10-04");
  rep("3-9", true, "2026-10-05");
  rep("3-7", false, "2026-10-05"); rep("3-8", false, "2026-10-05");
  rep("3-5", false, AUJ);
  return P.normaliserParcours(p);
}

test("2. « Demain » : les ratés d’aujourd’hui et ce qui revient demain, parmi les tables passées — pas les calculs dus aujourd’hui", () => {
  const t = mesCalculs(lea());
  assert.deepEqual(t.etat.demain().sort(), ["3-3", "3-4", "3-5", "3-6"]);
  assert.ok(!t.etat.demain().includes("3-7") && !t.etat.demain().includes("3-8"), "les deux calculs dus aujourd’hui ne sont pas dans « Demain »");
  const [aujourdhui, demain] = t.jour().children;
  assert.equal(t.jour().classList.contains("avec-demain"), true, "côte à côte");
  // « Aujourd'hui » : la série de Mes calculs du jour telle qu'elle sera jouée
  // — les 2 calculs dus, et 1 de complément (3 × 9, de la table passée, vu
  // avant aujourd'hui). 3 × 5, raté aujourd'hui, n'y est pas ; 3 × 3, 3 × 4 et
  // 3 × 6, attendus DEMAIN, non plus : ils seront posés demain, le jour où
  // ils peuvent monter — le même calcul n'est pas annoncé deux fois.
  assert.deepEqual(P.serieDuJour(lea(), {aujourdhui: AUJ}).cles, ["3-7", "3-8", "3-9"]);
  assert.equal(aujourdhui.textContent, "Aujourd’hui\u00a0: 3\u00a0calculs", "chaque bouton plus court");
  assert.equal(demain.textContent, "Demain\u00a0: 4\u00a0calculs");
  assert.deepEqual(parClasse(demain, "jour-nom").map(n => n.textContent), ["Demain"], "au téléphone, deux lignes (« Demain » / « 4 calculs »)");
  demain.click();
  assert.deepEqual(t.etat.selection(), {demain: true});
  assert.deepEqual(t.allumees().sort((a, b) => a - b), ["9", "12", "15", "18"], "ses calculs s’allument (pas leur miroir)");
  assert.deepEqual(t.detail().children.filter(n => n.tag !== "button").map(n => n.textContent),
    ["Demain · 4 calculs", "1\u00a0à\u00a0revoir · 3\u00a0à\u00a0faire\u00a0monter", "Ils seront dans ta séance de\u00a0demain."]);
  assert.equal(t.$("parcours-matable").classList.contains("is-eteinte"), true, "un seul allumé : la carte de ma table s’éteint");
  // Un seul allumé à la fois : « Aujourd'hui » prend la place.
  t.jour().children[0].click();
  assert.deepEqual(t.etat.selection(), {jour: true});
  assert.equal(t.jour().children[1].attrs["aria-pressed"], "false");
  assert.deepEqual(t.allumees().sort((a, b) => a - b), ["21", "24", "27"], "la série du jour : 3 × 7 et 3 × 8 (dus), puis le complément (3 × 9) — ni 3 × 5, ni les calculs de demain");
  t.jour().children[0].click();
  assert.equal(t.etat.selection(), null);
  // Sans table passée : rien ne revient, ni aujourd'hui ni demain — Mes
  // calculs du jour ne prend pas les calculs de la table en cours.
  const sans = mesCalculs(lea({passee: false}));
  assert.deepEqual(sans.etat.demain(), []);
  assert.equal(sans.jour().classList.contains("avec-demain"), false);
  assert.deepEqual(sans.jour().children.map(n => [n.tag, n.textContent]), [["p", "Rien ne revient aujourd’hui."]]);
});

test("2. rien demain : pas de bouton ; rien aujourd’hui : « Aujourd’hui · rien » à côté de « Demain »", () => {
  // (La table de 3 est passée : sans table passée, rien ne revient.)
  let p = P.creerParcours();
  p.tables[3].acquise = "2026-09-30";
  p = P.appliquerReponse(p, "3-4", {correcte: true, date: "2026-10-01"}).parcours;
  p = P.appliquerReponse(p, "3-4", {correcte: true, date: "2026-10-02"}).parcours; // boîte 3, revient le 5
  const seul = mesCalculs(P.normaliserParcours(p));
  assert.equal(seul.jour().children.length, 1);
  assert.equal(seul.jour().classList.contains("avec-demain"), false);
  assert.equal(seul.jour().children[0].textContent, "Aujourd’hui\u00a0: 1\u00a0calcul dans Mes\u00a0calculs du\u00a0jour", "seul, la phrase entière (au singulier)");
  const passee = P.creerParcours();
  passee.tables[3].acquise = "2026-09-30";
  const rienAujourdhui = P.normaliserParcours(P.appliquerReponse(passee, "3-4", {correcte: false, date: AUJ}).parcours);
  const r = mesCalculs(rienAujourdhui);
  const [rien, demain] = r.jour().children;
  assert.equal(rien.tag, "p", "rien de dû : pas un bouton");
  assert.equal(rien.children.length, 1, "un seul enfant : centré dans son cadre");
  assert.equal(rien.textContent, "Aujourd’hui\u00a0: rien");
  assert.equal(demain.textContent, "Demain\u00a0: 1\u00a0calcul");
  assert.match(html, /\.calculs-jour\.avec-demain \{ display: grid; grid-template-columns: 1fr 1fr; gap: 6px; \}/);
  assert.match(html, /@media \(min-width: 1024px\) \{\s*\.calculs-jour\.avec-demain \.jour-nom \{ display: inline; \}/, "sur ordinateur, une ligne");
});

// ------------------------------------------------------ 4. la bande (page)

test("4. 1re erreur : « Pas tout à fait, essaie encore. », la réponse effacée, rien de montré, la même question", () => {
  const {$} = fauxDocument();
  const state = {answer: "22"};
  const appels = [];
  const essaieEncore = new Function("state", "$", "renderLearnSequence", "renderInlineAnswer", `${source("essaieEncore")}; return essaieEncore;`)(
    state, $, () => appels.push("bande"), () => appels.push("case"));
  essaieEncore();
  assert.equal(state.answer, "");
  assert.deepEqual(appels, ["bande", "case"], "la case de la bande redevient vide");
  assert.equal($("answer-feedback").textContent, "Pas tout à fait, essaie encore.");
  assert.equal($("answer-feedback").className, "answer-feedback is-wrong");
  const deuxiemeChance = new Function(`${source("deuxiemeChance")}; return deuxiemeChance;`)();
  const erreurs = new Map();
  assert.equal(deuxiemeChance(erreurs, "4-7"), true, "1re erreur");
  assert.equal(deuxiemeChance(erreurs, "4-7"), false, "2e : la suite habituelle (ambre, puis donnée à la 3e)");
  assert.equal(erreurs.get("4-7"), 1);
  // Le traitement : avant toute correction, sans retour en fin de bande, sans waitingForContinue.
  assert.match(html, /if \(stickActivity && !correct && !skip && deuxiemeChance\(state\.erreursBande, question\.factKey\)\) \{\s*state\.ratesAuPremierEssai\.add\(question\.multiplier\);\s*essaieEncore\(\);\s*return;\s*\}\s*const donnee = stickActivity && !correct && reponseDonnee\(/);
});

test("4. un calcul trouvé au 2e essai compte comme une erreur dans le score de l’étape (choix de Gwenaël)", () => {
  const casesRatees = new Function("state", `${source("casesRatees")}; return casesRatees;`);
  const state = {questions: [{multiplier: 3}, {multiplier: 4}, {multiplier: 5}], responses: [{correct: true}, {correct: true}, {correct: false}], ratesAuPremierEssai: new Set([4])};
  assert.equal(casesRatees(state)(), 2, "4 × 7 trouvé au 2e essai + 5 × 7 raté");
  assert.equal(casesRatees({...state, ratesAuPremierEssai: new Set()})(), 1);
  assert.equal((html.match(/state\.correctionBande = null;\s*state\.ratesAuPremierEssai = new Set\(\);/g) || []).length, 2, "remis à zéro au lancement d’une série et au retour à l’accueil");
});

test("4. en fin de bande, toutes les réponses en ambre s’effacent ensemble ; les autres nombres restent", () => {
  const avance = new Function("state", "CASES_BANDE", "TOTAL", "finish", "renderQuestion", "clearAutoAdvance", `${source("advanceAfterResponse")}; return advanceAfterResponse;`);
  const questions = [{multiplier: 9}, {multiplier: 10}, {multiplier: 3, retry: true}, {multiplier: 6, retry: true}];
  const state = {index: 0, questions, configuration: {mode: "learn", learnActivity: "construct"}, revealedLearnResults: new Set([0, 1, 2, 4, 5, 7, 8, 9]), casesMontrees: new Set([3, 6]), mastered: new Set()};
  let rendus = 0;
  const suivant = avance(state, 11, 11, () => {}, () => { rendus += 1; }, () => {});
  suivant();
  assert.deepEqual([...state.casesMontrees], [3, 6], "pendant la bande, les réponses en ambre restent (on construit à partir d’elles)");
  suivant();
  assert.equal(state.questions[state.index].retry, true);
  assert.deepEqual([...state.casesMontrees], [], "le premier calcul raté revient : 21 ET 42 s’effacent");
  assert.deepEqual([...state.revealedLearnResults].sort((a, b) => a - b), [0, 1, 2, 4, 5, 7, 8, 9], "les autres nombres de la bande restent");
  assert.equal(rendus, 2);
});

// ------------------------------------------------------- 3. la flèche des perles

test("3. la flèche part de la perle à attraper et glisse avec elle", () => {
  const minuteurs = [];
  const perles = Array.from({length: 10}, () => ({style: {}}));
  const rangee = {element: element(), perles};
  const boulier = {dom: {rangees: [rangee]}, finie: false, drag: null, taille: 20, ecart: 10, etats: [0], etape: 0, table: 7};
  const fabrique = mouvementReduit => new Function("boulier", "state", "document", "window", "setTimeout", "gesteAttendu", "arreterDemo", "positionPerle", `
    let demo = null;
    ${source("montrerGeste")}; return montrerGeste;`)(
    boulier, {running: true}, {createElement: tag => element(tag)},
    {matchMedia: () => ({matches: mouvementReduit})}, (f, d) => { minuteurs.push([d, f]); return minuteurs.length; },
    () => ({rangee: 0, nombre: 7}), () => {}, (i, poussee) => (poussee ? i : boulier.ecart + i) * boulier.taille);
  fabrique(false)();
  const fleche = rangee.element.children[0];
  assert.equal(fleche.className, "perles-fleche");
  assert.equal(fleche.style.left, `${(10 + 6) * 20}px`, "posée sur la 7e perle (indice 6), au repos");
  assert.equal(fleche.style.width, "20px");
  assert.equal(fleche.children[0].textContent, "←");
  minuteurs.find(([d]) => d === 300)[1]();
  assert.equal(fleche.style.left, `${6 * 20}px`, "elle glisse avec la perle");
  assert.equal(perles[6].style.left, `${6 * 20}px`);
  assert.equal(fleche.style.transition, perles[6].style.transition, "au même pas");
  minuteurs.find(([d]) => d === 1500)[1]();
  assert.equal(fleche.style.left, `${16 * 20}px`, "et revient avec elle");
  // Table de 3 arrivée à 9 : une perle à pousser, la 10e de la rangée.
  minuteurs.length = 0;
  rangee.element.children = [];
  boulier.etats = [9];
  new Function("boulier", "state", "document", "window", "setTimeout", "gesteAttendu", "arreterDemo", "positionPerle", `
    let demo = null; ${source("montrerGeste")}; return montrerGeste;`)(
    boulier, {running: true}, {createElement: tag => element(tag)}, {matchMedia: () => ({matches: true})}, (f, d) => { minuteurs.push([d, f]); return 1; },
    () => ({rangee: 0, nombre: 1}), () => {}, (i, poussee) => (poussee ? i : boulier.ecart + i) * boulier.taille)();
  assert.equal(rangee.element.children[0].style.left, `${(10 + 9) * 20}px`);
  assert.deepEqual(minuteurs.map(([d]) => d), [5100], "mouvement réduit : la flèche immobile sur la perle");
  // Le dessin : un anneau DANS la perle (jamais rogné au bord du cadre), la flèche à sa gauche.
  assert.match(html, /\.perles-fleche \{ position: absolute; top: 50%; z-index: 3; transform: translateY\(-50%\); border-radius: 50%; box-shadow: inset 0 0 0 3px var\(--blue\)/);
  assert.match(html, /\.perles-fleche b \{ position: absolute; top: 50%; right: calc\(100% \+ 4px\);/);
});

// ------------------------------------------------------- 5. 10 × 10 = 100

test("5. le calcul tient sur une ligne : sa taille se règle pour trois chiffres, une fois par question", () => {
  // Un faux calcul : 30 px par caractère à 50 px de police, la case = 2 bords de 4 px.
  let police = 50;
  const slot = {textContent: "", getBoundingClientRect: () => ({width: (Math.max(1.45, slot.textContent.length * 0.6) * police) + 8})};
  const texte = t => ({nodeType: 3, t});
  const zone = {
    classList: {contains: c => c === "un-seul-trait"},
    style: {removeProperty: () => { police = 50; }, set fontSize(v) { police = parseFloat(v); }},
    clientWidth: 360, offsetWidth: 360, getBoundingClientRect: () => ({width: 360}),
    childNodes: [texte("10 × 10 = "), Object.assign(slot, {nodeType: 1})]
  };
  const document = {createRange: () => { let n; return {selectNodeContents: x => { n = x; }, getBoundingClientRect: () => ({width: n.t.length * 0.6 * police})}; }};
  const getComputedStyle = el => (el === zone ? {paddingLeft: "7px", paddingRight: "7px", fontSize: `${police}px`} : {marginLeft: "0px", marginRight: "0px"});
  const ajuster = new Function("$", "document", "getComputedStyle", `${source("zoomDe")}; ${source("ajusterExpression")}; return ajusterExpression;`)(
    id => (id === "expression" ? zone : slot), document, getComputedStyle);
  slot.textContent = "1";
  ajuster();
  const largeur = () => 10 * 0.6 * police + 3 * 0.6 * police + 8;
  assert.ok(police < 50, `réduit (${police} px)`);
  assert.ok(largeur() <= 360 - 14, "« 10 × 10 = 100 » tient dans la place, avant même la frappe");
  assert.equal(slot.textContent, "1", "ce que l’élève a tapé est rendu");
  // Un calcul court ne change pas.
  zone.childNodes[0] = texte("2 × 3 = ");
  ajuster();
  assert.equal(police, 50);
  assert.match(html, /\.expression\.un-seul-trait \{ flex-wrap: nowrap; white-space: nowrap; \}/);
  assert.match(html, /renderInlineAnswer\(\);\s*ajusterExpression\(\);\s*\}/, "réglée à chaque question");
  assert.match(html, /window\.addEventListener\("resize", ajusterExpression\);/);
});

// ------------------------------------------------- 6. le cadre blanc entier

test("6. les petits écrans d’ordinateur : moins de blanc (trophées plus petits), l’escalier sur une ligne, × 0,75 au plus petit", () => {
  assert.match(html, /const ECHELLE = Object\.freeze\(\{largeurMin: 1024, min: 0\.75, max: 1\.6,/);
  assert.match(html, /@media \(min-width: 1024px\) and \(max-height: 700px\) \{\s*\.panel \{ padding-top: 20px; padding-bottom: 20px; \}\s*\.intro \{ margin-top: 4px; margin-bottom: 6px; \}[\s\S]*?\.parcours-suite #parcours-melange \{ padding-top: 8px; padding-bottom: 8px; \}\s*\.parcours-suite \.mp-trophees b \{ width: 22px; height: 22px; \}\s*\}/, "lot « trophées » : sur un écran bas, les coupes passent de 26 à 22 px");
  assert.match(html, /#parcours-expert \.parcours-extra-cells \{ display: grid; grid-template-columns: repeat\(5, minmax\(0, 1fr\)\); gap: 6px; \}/);
  assert.match(html, /\.parcours-suite \.mp-melange-droite > span:first-child \{ flex-basis: 6em; \}/);
});

// ------------------------------------------------- 1. Mon parcours en haut

test("1. Mon parcours s’ouvre en haut", () => {
  assert.match(source("openParcours"), /show\("parcours"\);\s*ouvrirEnHaut\(\);/);
  assert.match(source("ouvrirEnHaut"), /window\.scrollTo\(\{top: 0, behavior: "auto"\}\);/);
});

// ------------------------------------------------- le moteur a changé

test("le moteur a changé : numéro de cache, copie du serveur, « fois » dans bilanSeances", async () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261023-2/);
  const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie));
  const p = {...P.creerParcours(), seances: ["2026-10-02", "2026-10-05", "2026-10-06", "2026-10-06"]};
  assert.deepEqual(P.bilanSeances(p, AUJ), {semaine: 2, fois: 3, objectif: 5, aujourdhui: 2}, "lundi 5 et mardi 6 (deux fois) ; vendredi 2 est la semaine d’avant");
});
