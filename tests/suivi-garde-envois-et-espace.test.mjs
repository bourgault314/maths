// Lot « code en cases » (novembre 2026), constat F01 de l'audit GPT du 09/11 :
//  1. pendant « C'est toujours toi ? », RIEN NE PART de l'appli (envoi groupé,
//     relance, sendBeacon de fermeture) — exécuté sur le client du suivi de
//     SPLAT! (le même code que Coffres et Anzan), dans son faux onglet ;
//  2. la même question sur Mon espace (_serveur/public/index.php) — le bloc de
//     la page EXÉCUTÉ avec une fausse horloge et une fausse mémoire d'onglet :
//     11 min → question ; bon code ; 3 erreurs → sortie ; « Non » → sortie ;
//     F5 garde le compteur ; retour d'une appli (« navigate » + page d'avant sur
//     le site + ?retour=1) → remis à zéro ; adresse tapée avec ?retour=1 → non.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PARCOURS, B, fauxServeur, fauxTemps, tic, demarrerClient} from "./splat-faux-monde.mjs";

const lire = f => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

// ------------------------------------------------------------ 1. les applis

test("SPLAT! : sous la question (ou dès qu'elle est due), le travail reste ici ; il part après le bon code", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur();
  const appli = demarrerClient({codeOnglet: B, reseau: serveur, minuteries: temps});
  await appli.client.demarrer();
  await tic();
  appli.document.declencher("pointerdown", {target: null});
  const avant = appli.envois().length;
  await temps.avancer(10 * 60 * 1000);
  // Dix minutes PILE sans geste : la question est due (>=, repris de l'audit GPT).
  assert.equal(appli.client.verifierGarde(), true, "dix minutes pile : la question");
  appli.client.noterSerie("m1e1", {fait: true, etoiles: 3, cartes: 4, vues: 4});
  await temps.avancer(70 * 1000);
  await tic();
  assert.equal(appli.envois().length, avant, "rien ne part pendant la question");
  appli.declencher("pagehide");
  assert.equal(appli.balises.length, 0, "pas de balise de fermeture non plus");
  assert.equal(PARCOURS.charger(appli.local, B).etapes.m1e1.fait, true, "le travail est rangé sur l'appareil");
  assert.equal(appli.client.repondreGarde(true, B), true, "le bon code");
  await temps.avancer(1000);
  await tic();
  assert.equal(appli.envois().length, avant + 1, "ce qui attendait part");
  assert.equal(serveur.etat(B).parcours.etapes.m1e1.fait, true);
});

test("SPLAT! : « Non, ce n'est pas moi » n'envoie pas ce qui attendait sous le code de l'élève absent", async () => {
  const temps = fauxTemps();
  const appli = demarrerClient({codeOnglet: B, reseau: fauxServeur(), minuteries: temps});
  await appli.client.demarrer();
  await tic();
  await temps.avancer(11 * 60 * 1000);
  appli.client.noterSerie("m1e2", {fait: true, etoiles: 1, cartes: 4, vues: 4});
  const avant = appli.envois().length;
  assert.equal(appli.client.verifierGarde(), true);
  appli.client.repondreGarde(false);
  await tic();
  assert.equal(appli.envois().length, avant);
  assert.equal(appli.balises.length, 0);
  assert.equal(appli.client.codeSuivi, "", "l'onglet est rendu");
});

test("les cinq applis : envoiPossible regarde la question, le clic et le clic du milieu sont écoutés", () => {
  for (const f of ["assets/js/splat-parcours.js", "assets/js/coffres-parcours.js", "outils/calcul_mental/flash_anzan_parcours.js",
    "outils/calcul_mental/defi_tables.html", "outils/calcul_mental/defi_calcul_modules.html"]) {
    const s = lire(f);
    assert.match(s, /return suiviActif\(\) && !sync\.detache && !erreurDefinitive && !envoisRetenus\(\);/, f);
    assert.match(s, /function envoisRetenus\(\) \{\s*try \{ return gardeVisible \|\| absenceTropLongue\(\); \} catch \(_\) \{ return false; \}/, f);
    assert.match(s, /- derniereActivite >= GARDE_INACTIVITE_MS/, `${f} : dix minutes pile suffisent`);
    assert.match(s, /\["pointerdown", "keydown", "touchstart", "click", "auxclick"\]\.forEach/, f);
    assert.match(s, /\/\/ Ce qui attendait pendant la question part maintenant\.\s*if \(sync\.dirty\) envoyerParcours\(\);/, f);
  }
  const tables = lire("outils/calcul_mental/defi_tables.html");
  assert.equal((tables.match(/if \(envoisRetenus\(\)\) return Promise\.resolve\(\{statut: 0, donnees: null\}\);/g) || []).length, 2,
    "Défi tables : ni record ni réponse d'évaluation sous la question");
});

test("les liens de retour vers Mon espace : ?retour=1 sous un code actif seulement", () => {
  for (const f of ["assets/js/splat-suivi.js", "assets/js/coffres-suivi.js", "outils/calcul_mental/flash_anzan_suivi.js"]) {
    const s = lire(f);
    assert.match(s, /const ADRESSE_RETOUR = ADRESSE_ESPACE \+ "\?retour=1";/, f);
    assert.match(s, /adresseEspace: \(\) => \(client\.suiviActif\(\) \? ADRESSE_RETOUR : ADRESSE_ESPACE\),/, f);
  }
  for (const f of ["outils/calcul_mental/defi_tables.html", "outils/calcul_mental/defi_calcul_modules.html"]) {
    assert.match(lire(f), /const vers = suiviActif\(\) \? RETOUR_ESPACE : entreeRefusee \? RETOUR_ESPACE_NU : RETOUR_CATALOGUE;/, f);
  }
  assert.doesNotMatch(lire("assets/js/eleve-retour-espace.js"), /retour=1/, "le bouton « Mon espace » du site n'en porte pas");
  for (const f of ["outils/splat_univers.html", "outils/calcul_mental/coffres_magiques_solo.html", "outils/calcul_mental/flash_anzan.html"]) {
    assert.doesNotMatch(lire(f), /SUIVI\.ADRESSE_ESPACE\b(?!\s*:)/, `${f} : plus d'adresse nue pour la flèche de l'élève`);
  }
});

// ------------------------------------------------------------ 2. Mon espace

const PAGE = lire("_serveur/public/index.php");

function bloc(debut, fin) {
  const i = PAGE.indexOf(debut);
  const j = PAGE.indexOf(fin, i);
  assert.ok(i > 0 && j > i, `bloc introuvable : ${debut}`);
  return PAGE.slice(i, j);
}

// Le bloc « C'est toujours toi ? » de la page, exécuté avec ses voisins remplacés
// par des témoins. `monde` règle l'horloge, la mémoire de l'onglet, l'adresse,
// la page d'avant et le type de navigation.
function monterEspace({memoire = {}, adresse = "/", referrer = "", navigation = "navigate"} = {}) {
  const source = bloc("  // ------------------------------------------------ « C'est toujours toi ? »",
    "  window.setInterval(verifierGarde, 60000);");
  const horloge = {t: 1_800_000_000_000};
  const stock = new Map(Object.entries(memoire));
  const stockage = () => ({getItem: k => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)),
    removeItem: k => stock.delete(k)});
  const elements = {};
  const $ = id => (elements[id] ||= {id, hidden: true, textContent: "", value: "", inert: false,
    focus() {}, addEventListener(type, fn) { this[`on${type}`] = fn; }});
  const blocs = [{inert: false}, {inert: false}, {inert: false}];
  const ecouteurs = {};
  const champGarde = {valeur: ""};
  const journal = [];
  let url = adresse;
  const fenetre = {
    location: {get search() { return url.includes("?") ? url.slice(url.indexOf("?")).split("#")[0] : ""; }, pathname: "/", hash: ""},
    history: {replaceState: (_, __, nouvelle) => { url = nouvelle; journal.push(["adresse", nouvelle]); }},
    MathsGoCodeEnCases: {monter: () => ({vider: () => { champGarde.valeur = ""; }, valeur: () => champGarde.valeur})},
    setInterval: () => 0, clearTimeout: () => {}
  };
  const doc = {
    referrer,
    querySelectorAll: () => blocs,
    addEventListener: (type, fn) => { ecouteurs[type] = fn; }
  };
  const perf = {getEntriesByType: () => (navigation ? [{type: navigation}] : [])};
  const DateFausse = {now: () => horloge.t};
  const etat = new Function("window", "document", "performance", "Date", "$", "stockage", "lireCode", "nettoyer",
    "lireCopie", "ouvrir", "seDeconnecter", "SORTIE_PAR_LE_SITE", "URL", "URLSearchParams",
    `let ouverture = 0, directTour = 0, directMinuteur = 0;\n${source}\n` +
    "return {retourDepuisAppli, absenceTropLongue, verifierGarde, repondreGarde, noterGeste, lireGeste, noterActivite: e => noterActivite(e), get visible() { return gardeVisible; }};")(
    fenetre, doc, perf, DateFausse, $, stockage, () => stock.get("mathsgo-suivi-code") || "",
    brut => String(brut || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
    () => ({prenom: "Léa"}), (code, silencieux) => journal.push(["ouvrir", code, silencieux]),
    () => { journal.push(["deconnexion"]); stock.delete("mathsgo-suivi-code"); },
    "https://mathsgo.re/?sortie=1", URL, URLSearchParams);
  const geste = (type, dansLaGarde = false) => {
    const e = {type, cancelable: true, defaultPrevented: false, arrete: false,
      target: {closest: s => (dansLaGarde && s === "#garde" ? {} : null)},
      preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.arrete = true; }};
    ecouteurs[type](e);
    return e;
  };
  return {etat, horloge, stock, $, blocs, journal, geste, champGarde, ecouteurs, avancer: ms => { horloge.t += ms; }};
}

const CODE = "K7M2PX";
const MINUTES = n => n * 60 * 1000;

test("Mon espace : 11 minutes sans geste → la question, l'écran dessous inerte ; le geste est retenu", () => {
  const m = monterEspace({memoire: {"mathsgo-suivi-code": CODE}});
  m.etat.noterGeste(m.horloge.t);
  m.avancer(MINUTES(9));
  assert.equal(m.geste("pointerdown").defaultPrevented, false, "neuf minutes : le geste passe");
  m.avancer(MINUTES(11));
  const clic = m.geste("click");
  assert.ok(clic.defaultPrevented && clic.arrete, "le clic sur une tuile est retenu avant d'arriver à la tuile");
  assert.equal(m.etat.visible, true);
  assert.equal(m.$("garde").hidden, false);
  assert.equal(m.$("garde-titre").textContent, "C’est toujours toi, Léa ?");
  assert.ok(m.blocs.every(b => b.inert), "en-tête, page et pied inertes");
  assert.ok(m.geste("auxclick").defaultPrevented, "le clic du milieu aussi");
  assert.equal(m.geste("keydown", true).defaultPrevented, false, "la carte, elle, répond");
});

test("Mon espace : dix minutes pile suffisent ; un code sans instant (ou venu du futur) vaut « trop vieux »", () => {
  const pile = monterEspace({memoire: {"mathsgo-suivi-code": CODE}});
  pile.etat.noterGeste(pile.horloge.t);
  pile.avancer(MINUTES(10));
  assert.equal(pile.etat.absenceTropLongue(), true);
  assert.equal(monterEspace({memoire: {"mathsgo-suivi-code": CODE}}).etat.absenceTropLongue(), true, "pas d'instant : la question");
  const futur = monterEspace({memoire: {"mathsgo-suivi-code": CODE, "mathsgo-suivi-dernier-geste": String(1_900_000_000_000)}});
  assert.equal(futur.etat.absenceTropLongue(), true, "un instant du futur ne rend pas la page muette");
  assert.equal(monterEspace({memoire: {"mathsgo-suivi-dernier-geste": "1"}}).etat.absenceTropLongue(), false, "sans code, jamais");
});

test("Mon espace : le bon code rend l'écran (relu au serveur) ; trois erreurs ou « Non » = « Se déconnecter »", () => {
  const m = monterEspace({memoire: {"mathsgo-suivi-code": CODE}});
  assert.equal(m.etat.verifierGarde(), true);
  m.champGarde.valeur = "ZZZZZZ";
  m.etat.repondreGarde(true);
  assert.equal(m.$("garde-erreur").textContent, "Ce n’est pas le bon code.");
  m.champGarde.valeur = CODE;
  m.etat.repondreGarde(true);
  assert.equal(m.etat.visible, false);
  assert.ok(m.blocs.every(b => !b.inert));
  assert.deepEqual(m.journal.at(-1), ["ouvrir", CODE, true]);
  assert.equal(m.etat.absenceTropLongue(), false, "le compteur repart");

  const t = monterEspace({memoire: {"mathsgo-suivi-code": CODE}});
  t.etat.verifierGarde();
  for (const faux of ["AAAAAA", "BBBBBB", "CCCCCC"]) { t.champGarde.valeur = faux; t.etat.repondreGarde(true); }
  assert.deepEqual(t.journal, [["deconnexion"]], "trois erreurs : la sortie, sans réouverture");

  const n = monterEspace({memoire: {"mathsgo-suivi-code": CODE}});
  n.etat.verifierGarde();
  n.etat.repondreGarde(false);
  assert.deepEqual(n.journal, [["deconnexion"]]);
});

test("Mon espace : F5 garde le compteur (l'instant est dans la mémoire de l'onglet)", () => {
  const avant = monterEspace({memoire: {"mathsgo-suivi-code": CODE}});
  avant.etat.noterGeste(avant.horloge.t);
  const memoire = Object.fromEntries(avant.stock);
  const apres = monterEspace({memoire, navigation: "reload"});
  apres.horloge.t = avant.horloge.t + MINUTES(11);
  assert.equal(apres.etat.retourDepuisAppli(), false);
  assert.equal(apres.etat.absenceTropLongue(), true, "un F5 ne remet pas à zéro");
});

test("Mon espace : le retour d'une appli remet le compteur à zéro SEULEMENT avec ?retour=1 + « navigate » + page d'avant sur le site", () => {
  const cas = [
    [{adresse: "/?retour=1", referrer: "https://mathsgo.re/", navigation: "navigate"}, true, "la flèche d'une appli"],
    [{adresse: "/?retour=1", referrer: "", navigation: "navigate"}, false, "adresse tapée à la main"],
    [{adresse: "/?retour=1", referrer: "https://mathsgo.re/", navigation: "reload"}, false, "F5"],
    [{adresse: "/?retour=1", referrer: "https://mathsgo.re/", navigation: "back_forward"}, false, "précédent / suivant"],
    [{adresse: "/?retour=1", referrer: "https://suivi.mathsgo.re/infos.php", navigation: "navigate"}, false, "une page du suivi"],
    [{adresse: "/?retour=1", referrer: "https://mathsgo.re.exemple.com/", navigation: "navigate"}, false, "un domaine qui lui ressemble"],
    [{adresse: "/", referrer: "https://mathsgo.re/", navigation: "navigate"}, false, "le bouton « Mon espace » du site"],
    [{adresse: "/?retour=1", referrer: "https://mathsgo.re/", navigation: ""}, false, "type de navigation inconnu : prudence"]
  ];
  for (const [monde, attendu, quoi] of cas) {
    const m = monterEspace(monde);
    assert.equal(m.etat.retourDepuisAppli(), attendu, quoi);
    if (monde.adresse.includes("retour")) {
      assert.ok(m.journal.some(([k, a]) => k === "adresse" && !a.includes("retour")), `${quoi} : l'adresse est nettoyée`);
    }
  }
});

test("Mon espace : au chargement, la question passe avant tout appel au serveur ; tuiles, fiches et direct se taisent dessous", () => {
  assert.match(PAGE, /async function ouvrir\(code, silencieux\) \{\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*if \(silencieux && verifierGarde\(\)\) return;/);
  assert.match(PAGE, /if \(memorise\.length === 6\) \{\s*if \(revenuDUneAppli\) noterGeste\(Date\.now\(\)\);/);
  assert.match(bloc("  async function ouvrirAppli(", "\n  }\n"), /if \(verifierGarde\(\)\) return;[\s\S]*await billetFrais\(code\);\s*[\s\S]*if \(gardeVisible \|\| lireCode\(\) !== code\) \{ delete lien\.dataset\.enCours; return; \}/);
  assert.match(bloc("  function noterOuverture(", "\n  }\n"), /if \(gardeVisible \|\| absenceTropLongue\(\)\) return;/);
  assert.match(PAGE, /if \(document\.visibilityState === "hidden" \|\| gardeVisible\) return;/, "la séance en direct n'est plus lue");
  assert.match(PAGE, /if \(!silencieux\) noterGeste\(Date\.now\(\)\);/, "le code tapé fait partir le compteur");
  assert.match(PAGE, /if \(!code\) \{ oublierCopie\(\); oublierGeste\(\); \}/, "l'instant part avec le code");
  assert.match(PAGE, /<div id="garde" class="garde" role="dialog" aria-modal="true" aria-labelledby="garde-titre" hidden>/);
  assert.ok(PAGE.indexOf('<div id="garde"') > PAGE.indexOf("</footer>"), "hors de <main>, de l'en-tête et du pied (qui deviennent inertes)");
});

test("direct.php : une adresse tapée après dix minutes renvoie à Mon espace, qui pose la question", () => {
  const direct = lire("_serveur/public/direct.php");
  assert.match(direct, /const CLE_GESTE = "mathsgo-suivi-dernier-geste";/);
  assert.match(direct, /if \(absenceTropLongue\(\)\) \{ window\.location\.replace\("\.\/"\); return; \}/);
  assert.match(direct, /event\.persisted && \(lireCode\(\)\.length !== 6 \|\| absenceTropLongue\(\)\)/);
});
