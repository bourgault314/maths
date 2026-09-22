/* Splat classique (monde 2), parcours élève (18/09/2026) : la reprise ne vaut
   que pour la série qui l'a écrite — le port de la PR #773 de Petit Splat.

   ?parcours=m2eN sert à la fois d'étoile sur la carte des mondes et de clé à
   la sauvegarde « en cours ». Les livrets du monde 2 à venir partageront
   parcours=m2eN avec des cartes différentes, comme les trois livrets du monde 1 :
   sans empreinte, scanner l'un rouvrirait la pause de l'autre et l'élève
   atterrirait au milieu d'une série qu'il n'a jamais commencée.

   L'empreinte = les réglages de l'adresse qui déterminent les cartes : tous
   les noms de sharedNames SAUF eleve, parcours, print, duplex, layout, title,
   imprimer, note — graine et « suite » (étape composée) compris ; clés triées,
   valeurs telles quelles, jointes par « | ». Ces tests exécutent le code de la
   page tel quel : fonctions, liste et bloc de reprise sont extraits du fichier.
   La reprise a aussi été jouée au navigateur, pour de vrai (voir la notice). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../outils/splat.html", import.meta.url), "utf8");
const univers = readFileSync(new URL("../outils/splat_univers.html", import.meta.url), "utf8");
const CLE = "mathsgo-splat-parcours";

// Une fonction de premier niveau de la page, jusqu'à son accolade fermante en colonne 0.
function source(nom) {
  const debut = page.indexOf(`\nfunction ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  return page.slice(debut + 1, page.indexOf("\n}\n", debut) + 3);
}
function ligne(debutDeLigne) {
  const l = page.split("\n").find((x) => x.startsWith(debutDeLigne));
  assert.ok(l, `${debutDeLigne} introuvable`);
  return l;
}
const NOMS = ligne("const sharedNames = ");
const HORS = ligne("const ELEVE_HORS_EMPREINTE = ");

// L'empreinte que la page calcule pour une adresse (« ?… »).
function empreinte(recherche) {
  return new Function("window", `${NOMS}\n${HORS}\n${source("eleveSignatureSerie")}\nreturn eleveSignatureSerie();`)({ location: { search: recherche } });
}

// Les adresses réelles de la carte des mondes (splat_univers.html), recomposées comme elle le fait.
const constante = (nom) => univers.match(new RegExp(`const ${nom}="([^"]+)";`))[1];
const [M2A1, M2A2, M2A3] = ["M2A1", "M2A2", "M2A3"].map(constante);
const ETAPE7 = `?${M2A1}&eleve=1&parcours=m2e1&suite=${encodeURIComponent(M2A2)};${encodeURIComponent(M2A3)}`;
const ETAPE8 = "?mode=N&equation=X_PLUS_A_EQ_B&cards=12&seed=347&unknown=question&eleve=1&parcours=m2e4";

// Un faux localStorage, pré-rempli.
function stockage(contenu) {
  const m = new Map([[CLE, JSON.stringify(contenu)]]);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), lire: () => JSON.parse(m.get(CLE) || "{}") };
}

// Le bloc de reprise de renderEleveSplat, exécuté tel quel à l'ouverture d'une série de 12 cartes.
function ouvrir(store, serieAffichee, parcoursId = "m2e1") {
  const debut = page.indexOf("if(!eleveRepriseFaite && parcoursId){");
  assert.ok(debut > 0, "bloc de reprise introuvable");
  const finTexte = "}catch(_e){ /* stockage indisponible */ }";
  const fin = page.indexOf(finTexte, debut);
  assert.ok(fin > debut, "fin du bloc de reprise introuvable");
  const bloc = page.slice(debut, fin + finTexte.length) + "\n}";
  return new Function("localStorage", "ELEVE_STORE_KEY", "parcoursId", "eleveSignatureSerie", `
    let eleveSerie = new Array(12).fill({}), eleveRepriseFaite = false;
    let eleveIdx = 0, eleveEtoiles = 0, eleveResultats = [];
    ${bloc}
    return { eleveIdx, eleveEtoiles, eleveResultats };`)(store, CLE, parcoursId, () => serieAffichee);
}

test("l'empreinte de l'étape 7 : les réglages des cartes, graine et « suite » compris, clés triées", () => {
  assert.equal(empreinte(ETAPE7),
    "cards=4|equation=X_PLUS_A_EQ_B|hiddenMax=10|mode=U|seed=974|" +
    `suite=${M2A2};${M2A3}|` +
    "tasksMax=1|tasksMin=1|totalMax=25|totalMin=1|unknown=question|visibleMax=15");
  assert.equal(empreinte(ETAPE8), "cards=12|equation=X_PLUS_A_EQ_B|mode=N|seed=347|unknown=question");
});

test("ce qui ne change pas les cartes n'entre pas dans l'empreinte : élève, étape, impression, titre", () => {
  const ref = empreinte(ETAPE7);
  assert.equal(empreinte(ETAPE7.replace("parcours=m2e1", "parcours=m2e9")), ref, "même série, autre étape");
  assert.equal(empreinte(ETAPE7.replace("&eleve=1", "")), ref);
  assert.equal(empreinte(`${ETAPE7}&print=statement&layout=6&duplex=1&title=Livret%20monde%202&imprimer=1`), ref);
  assert.equal(empreinte(`${ETAPE7}&utm_source=qr&fbclid=abc`), ref, "un paramètre étranger au jeu ne compte pas");
  // et les valeurs sont lues décodées : la redirection /splat/classique/ ou un encodage différent ne la changent pas
  assert.equal(empreinte(ETAPE7.replace(";", "%3B")), ref);
});

test("chaque réglage qui détermine les cartes change l'empreinte — tous ceux de sharedNames, sauf huit", () => {
  const noms = JSON.parse(NOMS.slice(NOMS.indexOf("["), NOMS.lastIndexOf("]") + 1));
  const hors = JSON.parse(HORS.slice(HORS.indexOf("["), HORS.lastIndexOf("]") + 1));
  // « note » (lot E1, Enquête) : une consigne imprimée en plus, qui ne change pas les cartes.
  assert.deepEqual([...hors].sort(), ["duplex", "eleve", "imprimer", "layout", "note", "parcours", "print", "title"]);
  const ref = empreinte(ETAPE8);
  // l'adresse de l'étape 8, où le réglage « nom » prend une autre valeur (ou apparaît)
  const avec = (nom, valeur) => `?${ETAPE8.slice(1).split("&").filter((p) => !p.startsWith(`${nom}=`)).join("&")}&${nom}=${valeur}`;
  for (const nom of noms) {
    if (hors.includes(nom)) assert.equal(empreinte(avec(nom, "7")), ref, `${nom} ne change pas les cartes`);
    else assert.notEqual(empreinte(avec(nom, "7")), ref, `${nom} change les cartes, donc l'empreinte`);
  }
  // la graine et la suite, nommément
  assert.notEqual(empreinte(ETAPE7.replace("seed=974", "seed=975")), empreinte(ETAPE7));
  assert.notEqual(empreinte(ETAPE7.replace("seed%3D478", "seed%3D479")), empreinte(ETAPE7), "une autre graine dans la suite");
});

test("la sauvegarde « en cours » porte l'empreinte de la série qui l'écrit, sans toucher l'étoile", () => {
  const store = stockage({ m2e1: { fait: true, etoiles: 12, cartes: 12, date: "2026-09-17" } });
  new Function("localStorage", "ELEVE_STORE_KEY", "parcoursId", "eleveRejeu", "eleveIdx", "eleveSerie",
    "eleveEtoiles", "eleveResultats", "eleveSignatureSerie",
    `${source("eleveSauverEnCours")}\neleveSauverEnCours();`)(
    store, CLE, "m2e1", null, 2, new Array(12).fill({}), 3, [true, true, true], () => empreinte(ETAPE7));
  const entree = store.lire().m2e1;
  assert.deepEqual(entree.enCours, { sig: empreinte(ETAPE7), idx: 3, etoiles: 3, res: [true, true, true] });
  assert.equal(entree.fait, true, "l'étoile déjà gagnée reste allumée");
});

test("même ?parcours=, autre graine (un autre livret) : la pause de l'étape 7 ne s'y applique pas, carte 1", () => {
  const pause = () => stockage({ m2e1: { enCours: { sig: empreinte(ETAPE7), idx: 6, etoiles: 3, res: [true, true, true, true, true, true] } } });
  assert.equal(ouvrir(pause(), empreinte(ETAPE7.replace("seed=974", "seed=975"))).eleveIdx, 0);
  assert.equal(ouvrir(pause(), empreinte(ETAPE7.replace(/&suite=.*$/, ""))).eleveIdx, 0, "l'activité 1 seule n'est pas l'étape composée");
});

test("la même série reprend toujours là où l'élève s'était arrêté, pastilles comprises", () => {
  const store = stockage({ m2e1: { enCours: { sig: empreinte(ETAPE7), idx: 6, etoiles: 3, res: [true, false, "ko", true, true, false] } } });
  const r = ouvrir(store, empreinte(ETAPE7));
  assert.equal(r.eleveIdx, 6);
  assert.equal(r.eleveEtoiles, 3);
  assert.deepEqual(r.eleveResultats, [true, false, "ko", true, true, false]);
});

test("une sauvegarde écrite avant ce lot (sans empreinte) n'est pas reprise, et l'étoile reste", () => {
  const store = stockage({ m2e1: { fait: true, etoiles: 10, cartes: 12, date: "2026-09-17",
                                   enCours: { idx: 5, etoiles: 5, res: [true, true, true, true, true] } } });
  assert.equal(ouvrir(store, empreinte(ETAPE7)).eleveIdx, 0);
  assert.equal(store.lire().m2e1.fait, true);
  assert.equal(store.lire().m2e1.etoiles, 10);
});

test("la liste sharedNames est la même pour l'adresse partagée et pour l'empreinte", () => {
  // une seule déclaration, au premier niveau, lue par loadSharedConfiguration
  assert.equal(page.match(/const sharedNames = /g).length, 1);
  assert.match(source("loadSharedConfiguration"), /if\(!sharedNames\.some\(name => params\.has\(name\)\)\) return false;/);
  assert.match(source("eleveSignatureSerie"), /return sharedNames\.filter\(/);
});
