// Lot E3b « les évaluations en classe » (16/10/2026) — « À retenir » sur
// l'accueil de Défi tables, et le test passé hors séance.
//
// Décisions de Gwenaël (16/10, 8 h 50 puis 9 h 55, questions à choix) :
//  - « À retenir » (toutes les erreurs du jour, avec les réponses) sur
//    l'accueil DÈS qu'il y en a, jusqu'à minuit, séance finie ou non : sous la
//    carte de la séance, quelle qu'elle soit ; une seule fois (« ✓ Séance du
//    jour faite » l'a déjà dans sa carte) ;
//  - sous « Reprendre ma séance », son titre est « À retenir » tout court ;
//  - le test de la table passé hors séance (« Je passe le test ») met ses
//    erreurs dans « À retenir », comme celui de la séance — pas « Comme le
//    test, en 2 min », ni le test de bienvenue, ni Mon mélange, ni les
//    entraînements ;
//  - l'évaluation ouverte (ce qui est caché, et quand) : voir
//    defi-tables-evaluation-eleve.test.mjs.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) ne plus appeler renderARetenirAccueil (le cadre absent de l'accueil) ;
//  b) le cadre seulement sous « Ma séance du jour » (absent pendant une
//     séance commencée) ;
//  c) le cadre aussi quand « ✓ Séance du jour faite » l'a (deux fois) ;
//  d) l'ancien titre sous « Reprendre ma séance » ;
//  e) le test hors séance qui n'écrit plus dans « À retenir », ou « Comme le
//     test, en 2 min » qui y écrit.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// ------------------------------------------------- un petit DOM de test
// Assez pour ce que fait renderARetenirAccueil : querySelector(All) avec des
// sélecteurs simples (#id, .classe, :not([hidden]), descendant et « > »),
// after(), remove().

function noeud(tag, {id = "", classes = [], hidden = false} = {}) {
  const n = {
    tag, id, hidden, enfants: [], parent: null, liste: new Set(classes), _texte: "",
    classList: {
      add: (...c) => c.forEach(x => n.liste.add(x)), remove: (...c) => c.forEach(x => n.liste.delete(x)),
      contains: c => n.liste.has(c), toggle: (c, oui) => ((oui === undefined ? !n.liste.has(c) : oui) ? n.liste.add(c) : n.liste.delete(c))
    },
    get className() { return [...n.liste].join(" "); },
    set className(v) { n.liste = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get textContent() { return n.enfants.length ? n.enfants.map(e => (typeof e === "string" ? e : e.textContent)).join("") : n._texte; },
    set textContent(v) { n.enfants = []; n._texte = String(v); },
    append(...xs) { xs.forEach(x => { if (typeof x === "object") x.parent = n; n.enfants.push(x); }); },
    after(x) { const i = n.parent.enfants.indexOf(n); x.parent = n.parent; n.parent.enfants.splice(i + 1, 0, x); },
    remove() { if (!n.parent) return; n.parent.enfants.splice(n.parent.enfants.indexOf(n), 1); n.parent = null; },
    setAttribute() {},
    querySelectorAll(selecteur) { return descendants(n).filter(d => correspond(d, selecteur)); },
    querySelector(selecteur) { return n.querySelectorAll(selecteur)[0] || null; }
  };
  return n;
}
const descendants = n => n.enfants.filter(e => typeof e === "object").flatMap(e => [e, ...descendants(e)]);

function compose(morceau) {
  const m = morceau.match(/^([a-z0-9]+)?(#[\w-]+)?((?:\.[\w-]+)*)(:not\(\[hidden\]\))?$/);
  assert.ok(m, `sélecteur non prévu par le test : ${morceau}`);
  const [, tag, id, classes, visible] = m;
  return n => (!tag || n.tag === tag) && (!id || n.id === id.slice(1))
    && classes.split(".").filter(Boolean).every(c => n.liste.has(c)) && (!visible || !n.hidden);
}

function correspond(n, selecteur) {
  const jetons = selecteur.trim().split(/\s+/);
  const essai = (cible, i) => {
    if (!compose(jetons[i])(cible)) return false;
    if (i === 0) return true;
    if (jetons[i - 1] === ">") return Boolean(cible.parent) && essai(cible.parent, i - 2);
    for (let p = cible.parent; p; p = p.parent) if (essai(p, i - 1)) return true;
    return false;
  };
  return essai(n, jetons.length - 1);
}

function page(construire) {
  const corps = noeud("body");
  const acc = noeud("div", {classes: ["acc"]});
  corps.append(acc);
  const expert = noeud("section", {id: "acc-expert", classes: ["expert"], hidden: true});
  const action = noeud("div", {id: "acc-expert-action", classes: ["etapes"]});
  expert.append(action);
  const matable = noeud("section", {classes: ["matable"]});
  const etapes = noeud("div", {id: "acc-etapes", classes: ["etapes"]});
  matable.append(etapes);
  acc.append(expert, matable);
  construire({etapes, expert, action});
  const document = {createElement: tag => noeud(tag), createTextNode: t => t, querySelector: s => corps.querySelector(s)};
  return {acc, etapes, expert, action, document};
}

function poser(document, liste) {
  const cadreARetenir = new Function("document", `${source("cadreARetenir")}; return cadreARetenir;`)(document);
  return new Function("document", "cadreARetenir", "aRetenirAffiche", `${source("renderARetenirAccueil")}; return renderARetenirAccueil;`)(
    document, cadreARetenir, () => liste);
}

const LISTE = [[2, 7], [3, 5]];
const pastilles = cadre => cadre.querySelectorAll("li").map(li => li.textContent);
const titre = cadre => cadre.querySelector("h2").textContent;

// ------------------------------------------------- l'accueil

test("« Ma séance du jour » : « À retenir » juste sous la carte, avec les réponses ; redessiné, il n'est jamais en double", () => {
  const {acc, etapes, document} = page(({etapes}) => etapes.append(
    noeud("div", {classes: ["rangee"]}), noeud("button", {id: "acc-seance", classes: ["carte-seance"]}), noeud("div", {classes: ["seance-liens"]})));
  const poserLeCadre = poser(document, LISTE);
  poserLeCadre();
  const cadre = etapes.enfants[2];
  assert.ok(cadre.liste.has("retenir") && cadre.liste.has("acc-retenir"), "a) le cadre « À retenir » sous la carte, avant les liens");
  assert.equal(etapes.enfants[3].liste.has("seance-liens"), true);
  assert.equal(titre(cadre), "À retenir pour la prochaine séance");
  assert.deepEqual(pastilles(cadre), ["2\u00a0×\u00a07\u00a0=14", "3\u00a0×\u00a05\u00a0=15"], "écrits avec leur réponse");
  poserLeCadre();
  assert.equal(acc.querySelectorAll(".retenir").length, 1, "redessiné : toujours un seul cadre");
});

test("« Reprendre ma séance » (séance commencée, deux étapes faites) : le cadre aussi, titré « À retenir »", () => {
  const {etapes, document} = page(({etapes}) => etapes.append(noeud("button", {id: "acc-seance", classes: ["carte-seance", "est-reprise"]}), noeud("div", {classes: ["seance-liens"]})));
  poser(document, LISTE)();
  const cadre = etapes.enfants[1];
  assert.ok(cadre && cadre.liste.has("acc-retenir"), "b) pendant une séance commencée aussi");
  assert.equal(titre(cadre), "À retenir", "d) le titre court : la séance en cours n'est pas « la prochaine »");
});

test("« ✓ Séance du jour faite » l'a déjà dans sa carte : pas une deuxième fois ; « Encore une séance » touché : sous sa carte", () => {
  const dejaLa = noeud("section", {classes: ["retenir"]});
  const faite = noeud("div", {classes: ["carte-seance", "est-faite"]});
  faite.append(noeud("p", {classes: ["fait"]}), dejaLa, noeud("button", {id: "acc-seance", classes: ["primary", "encore"]}));
  const {acc, document} = page(({etapes}) => etapes.append(faite, noeud("div", {classes: ["seance-liens"]})));
  poser(document, LISTE)();
  assert.equal(acc.querySelectorAll(".retenir").length, 1, "c) une seule fois");
  assert.equal(acc.querySelectorAll(".acc-retenir").length, 0);
  // « Encore une séance » : la carte de la séance suivante, et le cadre dessous.
  const encore = page(({etapes}) => etapes.append(noeud("button", {id: "acc-seance", classes: ["carte-seance"]})));
  poser(encore.document, LISTE)();
  assert.equal(encore.etapes.enfants[1].liste.has("acc-retenir"), true);
});

test("pas de carte de séance (menu « Choisir une activité » ouvert) : rien ; liste vide : rien, et l'ancien cadre s'en va", () => {
  const menu = page(({etapes}) => etapes.append(noeud("button", {id: "acc-retour-seance", classes: ["retour-seance"]}), noeud("p", {classes: ["titre-menu"]})));
  poser(menu.document, LISTE)();
  assert.equal(menu.acc.querySelectorAll(".retenir").length, 0);
  const vide = page(({etapes}) => etapes.append(noeud("button", {id: "acc-seance", classes: ["carte-seance"]})));
  poser(vide.document, LISTE)();
  assert.equal(vide.acc.querySelectorAll(".acc-retenir").length, 1);
  poser(vide.document, [])();
  assert.equal(vide.acc.querySelectorAll(".acc-retenir").length, 0, "plus rien à retenir (ou caché) : le cadre s'en va");
});

test("les 9 tables : sous la carte de séance de l'escalier (une fois, même si une table choisie a la sienne) ; une Légende aux records, séance faite : sous « Je bats mon record »", () => {
  const deux = page(({action, expert, etapes}) => {
    expert.hidden = false;
    action.append(noeud("button", {id: "acc-seance", classes: ["carte-seance"]}));
    etapes.append(noeud("button", {id: "acc-seance", classes: ["carte-seance"]}));
  });
  poser(deux.document, LISTE)();
  assert.equal(deux.acc.querySelectorAll(".acc-retenir").length, 1, "une seule fois");
  assert.equal(deux.action.enfants[1].liste.has("acc-retenir"), true, "sous la première carte de la page");
  const records = page(({action, expert}) => {
    expert.hidden = false;
    expert.classList.add("is-records");
    action.append(noeud("button", {classes: ["etape", "expert-tenter"]}));
  });
  poser(records.document, LISTE)();
  assert.equal(records.action.enfants[1].liste.has("acc-retenir"), true, "sous « Je bats mon record »");
  const cache = page(({action, expert}) => {
    expert.classList.add("is-records");
    action.append(noeud("button", {classes: ["etape", "expert-tenter"]}));
  });
  poser(cache.document, LISTE)();
  assert.equal(cache.acc.querySelectorAll(".acc-retenir").length, 0, "bloc des records caché : rien");
});

test("la page : l'accueil pose le cadre, la carte d'une séance commencée se marque, le bilan et « Séance du jour faite » lisent la liste affichée, le même style", () => {
  assert.match(source("renderAccueil"), /renderARetenirAccueil\(\);\s*(\/\/[^\n]*\s*)*renderCarteEvaluation\(\);/, "a) l'accueil pose le cadre à chaque dessin");
  assert.match(source("carteDeSeance"), /carte\.className = "carte-seance";\s*(\/\/[^\n]*\s*)*if \(reprise\) carte\.classList\.add\("est-reprise"\);/);
  for (const nom of ["renderBilanSeance", "carteSeanceFaite"]) {
    assert.match(source(nom), /const retenir = cadreARetenir\(aRetenirAffiche\(\)\);/, `${nom} : la liste telle qu'elle s'affiche (sans les erreurs d'une évaluation ouverte)`);
    assert.doesNotMatch(source(nom), /PARCOURS\.aRetenir\(/, `${nom} ne lit plus la liste brute`);
  }
  assert.match(source("cadreARetenir"), /function cadreARetenir\(erreurs, titreDuCadre = "À retenir pour la prochaine séance"\)/);
  for (const suite of ["", " h2", " ul", " li", " li b", " ul:last-child"]) {
    assert.ok(html.includes(`.seance-suite .retenir${suite}, .carte-seance .retenir${suite}, .acc-retenir${suite} {`), `le même style sur l'accueil (${suite || "le cadre"})`);
  }
});

// ------------------------------------------------- le test hors séance

const SI_TEST = (() => {
  const corps = source("finish");
  // Le bloc tel qu'il est écrit ; c'est le test ci-dessous qui dit ce qu'il fait.
  const m = corps.match(/\n {8}if \(!enSeance\(\)[^\n]*\) \{\n {10}parcours = PARCOURS\.retenirErreurs\([^\n]*\n {8}\}/);
  assert.ok(m, "finish() : le test hors séance écrit dans « À retenir »");
  return m[0];
})();

test("e) le test de la table passé hors séance met ses erreurs dans « À retenir » ; pas « Comme le test, en 2 min », ni le test de bienvenue, ni pendant une séance (noterEtape s'en charge)", () => {
  const corps = source("finish");
  assert.ok(corps.indexOf("parcours = suivi.parcours;") < corps.indexOf(SI_TEST) && corps.indexOf(SI_TEST) < corps.indexOf("sauverParcours();", corps.indexOf(SI_TEST)) && corps.lastIndexOf("sauverParcours();", corps.indexOf(SI_TEST)) < corps.indexOf("parcours = suivi.parcours;"), "après appliquerSerie, avant l'enregistrement (celui de Mes calculs du jour, lot « le jour vert », vient plus haut)");
  const AUJ = P.jourLocal();
  const depart = P.normaliserParcours({});
  const jouer = ({config, origin = "menu", seance = false}) => {
    const suivi = P.appliquerSerie(depart, config, {correct: 18, total: 20});
    const apres = new Function("enSeance", "state", "suivi", "PARCOURS", "erreursDeLEtape", "parcours", `${SI_TEST}\nreturn parcours;`)(
      () => seance, {origin}, suivi, P, () => [[4, 7], [6, 8]], suivi.parcours);
    return P.aRetenir(apres, AUJ);
  };
  assert.deepEqual(jouer({config: P.configValidation(4)}), [[4, 7], [6, 8]], "« Je passe le test » depuis l'accueil");
  assert.deepEqual(jouer({config: P.configValidation(4), origin: "decouverte"}), [], "le test de bienvenue : non");
  assert.deepEqual(jouer({config: P.configValidation(4), origin: "seance", seance: true}), [], "dans la séance : noterEtape le fait déjà");
  assert.deepEqual(jouer({config: P.configValidation(4, 120)}), [], "« Comme le test, en 2 min » : une préparation, non");
  assert.deepEqual(jouer({config: P.configEntraine(4, "desordre")}), [], "un entraînement : non");
});
