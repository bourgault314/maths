import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

// Lot « Défi tables — fignolage du 22/10/2026 » (décisions de Gwenaël, sur
// planches). Ce fichier garde la tuile Défi tables de Mon espace :
//  - le badge : Bronze, Argent, Or, Platine sans étoile ; puis ★ à ★★★★ ;
//    puis 👑 Légende des tables — jamais « Diamant » ;
//  - la pastille « Aujourd'hui » : la PROCHAINE chose à faire, lue dans la
//    séance du jour par le moteur — jamais devinée par la page ;
//  - les douze élèves joués en captures, joués ici sur le vrai moteur.
// Les retours de fin de course et de fin de séance sont gardés dans
// defi-tables-records.test.mjs ; le compteur de Mes calculs dans
// defi-tables-mon-parcours-lot.test.mjs.
//
// Sabotages attendus (chacun rend un test de CE fichier rouge) :
//  a) badgeDefiTables rend etat.rang (Diamant revient à 4 étoiles)
//  b) la pastille compte les calculs de la série au lieu de l'étape
//     (« 26 calculs » au lieu de « 10 calculs »)
//  c) les records fermés par la classe ignorés (« puis ton record »)
//  d) « Séance du jour faite » sans regarder la séance en cours
//  e) l'étape suivante identique répétée (« la table de 5, puis la table de 5 »)
//  f) la pastille écrite avec innerHTML
//  g) le sélecteur de la pastille sans « .appli » (gris de `.appli span`)
//  h) la pastille seule fait remonter la tuile

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/index.php"), "utf8");
const MOTEUR = createRequire(import.meta.url)(join(racine, "_serveur/public/prof/defi_tables_mon_parcours.js"));

const AUJ = "2026-10-22";
// Le moteur tel que la page l'appelle, avec une date fixe : la page passe
// P.jourLocal() à tout ce qui dépend du jour.
const P = {...MOTEUR, jourLocal: () => AUJ};
const plus = n => MOTEUR.ajouterJours(AUJ, n);
const NB = " ";

function lecteur() {
  const debut = page.indexOf("  const JAUGES = {");
  const fin = page.indexOf("  // Un moteur est chargé UNE fois", debut);
  assert.ok(debut > 0 && fin > debut);
  return new Function(page.slice(debut, fin) + "\n  return JAUGES;")()["defi-tables"].lecteur;
}

// ---------------------------------------------------- les élèves des planches
const fait = (boite, echeance, vu = plus(-6)) => ({boite, cases: 0, vu, erreur: "", gagne: "", echeance});
const FAITS_DE_2 = ["2-2", "2-3", "2-4", "2-5", "2-6", "2-7", "2-8", "2-9"];
const TOUS = MOTEUR.FAITS.map(f => (typeof f === "string" ? f : f.cle));
function eleve({acquises = [], etoiles = 0, calculs = {}, reglage = null} = {}) {
  const p = MOTEUR.creerParcours();
  acquises.forEach(table => { p.tables[table].acquise = plus(-10); });
  p.expert.etoiles = etoiles;
  if (etoiles >= MOTEUR.ETOILES_MAX) p.expert.couronne = plus(-3);
  p.jours = [plus(-1)];
  Object.entries(calculs).forEach(([cle, valeur]) => { p.calculs[cle] = valeur; });
  if (reglage) reglage(p);
  const n = MOTEUR.normaliserParcours(JSON.parse(JSON.stringify(p)));
  n.rang = Math.max(n.rang, MOTEUR.rangDeLEtat(n));
  return n;
}
const dus = (cles, boite, echeance) => Object.fromEntries(cles.map(cle => [cle, fait(boite, echeance)]));
const neuf = (etoiles, nombreDus) => eleve({acquises: MOTEUR.TABLES, etoiles,
  calculs: {...dus(TOUS, etoiles >= 5 ? 5 : 4, plus(5)), ...dus(TOUS.slice(0, nombreDus), etoiles >= 5 ? 5 : 4, AUJ)}});

function seanceCommencee() {
  let p = eleve({acquises: [2, 10], calculs: dus(FAITS_DE_2, 3, AUJ), reglage: q => { q.tables[5].seance.dernier = plus(-1); }});
  const seance = MOTEUR.ouvrirSeance(p, {aujourdhui: AUJ});
  const etape = MOTEUR.etapeDeSeance(p, seance, AUJ);
  assert.equal(etape.type, "revision");
  p = JSON.parse(JSON.stringify(MOTEUR.noterEtape(p, seance, etape, {juste: 8, total: 8, erreurs: []}, AUJ).parcours));
  FAITS_DE_2.forEach(cle => { p.calculs[cle] = fait(4, plus(7), AUJ); });
  p.calculsDuJour = AUJ;
  return MOTEUR.normaliserParcours(p);
}

const CAS = [
  ["aucune table", eleve(), null, null, `🔔 Aujourd’hui${NB}: la table de${NB}2`],
  ["table en cours, 8 calculs dus", eleve({acquises: [2, 10], calculs: dus(FAITS_DE_2, 3, AUJ)}), "Bronze", "2 tables passées sur 9",
    `🔔 Aujourd’hui${NB}: 8${NB}calculs, puis la table de${NB}5`],
  ["table en cours, rien de dû", eleve({acquises: [2, 10], calculs: dus(FAITS_DE_2, 3, plus(1))}), "Bronze", "2 tables passées sur 9",
    `🔔 Aujourd’hui${NB}: la table de${NB}5`],
  ["palier du mélange", eleve({acquises: [2, 10, 5], calculs: dus(FAITS_DE_2, 3, AUJ)}), "Argent", "3 tables passées sur 9",
    `🔔 Aujourd’hui${NB}: 8${NB}calculs, puis Mon mélange`],
  ["9 tables, 0 étoile", neuf(0, 10), "Platine", "9 tables passées sur 9", `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ★`],
  ["2 étoiles", neuf(2, 10), "★★", "9 tables passées sur 9", `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ★★★`],
  ["Légende, records ouverts", neuf(5, 10), "Légende des tables", "9 tables passées sur 9", `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ton record`],
  ["séance commencée", seanceCommencee(), "Bronze", "2 tables passées sur 9", `🔔 Aujourd’hui${NB}: la table de${NB}5`],
  ["séance faite, rien de dû", eleve({acquises: [2, 10], calculs: Object.fromEntries(FAITS_DE_2.map(cle => [cle, fait(4, plus(7), AUJ)])),
    reglage: q => { q.calculsDuJour = AUJ; q.seances = [AUJ]; }}), "Bronze", "2 tables passées sur 9", "✓ Séance du jour faite"],
  ["séance faite, 26 encore dus", eleve({acquises: MOTEUR.TABLES, etoiles: 5,
    calculs: {...dus(TOUS, 5, AUJ), ...Object.fromEntries(TOUS.slice(0, 10).map(cle => [cle, fait(5, plus(30), AUJ)]))},
    reglage: q => { q.calculsDuJour = AUJ; q.seances = [AUJ]; }}), "Légende des tables", "9 tables passées sur 9", `✓ Séance faite · encore 26${NB}calculs`],
  ["36 calculs dus", neuf(5, 36), "Légende des tables", "9 tables passées sur 9", `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ton record`]
];

test("les élèves des planches : le compte, le badge et la pastille « Aujourd’hui », lus par le moteur", () => {
  const lire = lecteur();
  for (const [nom, parcours, badge, compte, aujourdhui] of CAS) {
    const jauge = lire(P, JSON.parse(JSON.stringify(parcours)), {});
    assert.ok(jauge, nom);
    assert.equal(jauge.compte, compte === null ? undefined : compte, `${nom} : le compte`);
    assert.equal(jauge.rang ? jauge.rang.nom : null, badge, `${nom} : le badge`);
    assert.equal(jauge.aujourdhui.texte, aujourdhui, `${nom} : la pastille`);
    assert.equal(jauge.aujourdhui.faite, aujourdhui.startsWith("✓"), `${nom} : verte seulement quand la séance est faite`);
  }
});

test("Légende, records fermés par la classe : la séance rejoue la couronne — « puis 👑 »", () => {
  const lire = lecteur();
  const legende = neuf(5, 10);
  assert.equal(lire(P, legende, {"defi-tables": {records: false}}).aujourdhui.texte, `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis 👑`);
  assert.equal(lire(P, legende, {"defi-tables": {records: true}}).aujourdhui.texte, `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ton record`);
  assert.equal(lire(P, legende, {}).aujourdhui.texte, `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ton record`, "ouverts par défaut");
  assert.equal(lire(P, legende, {"splat": {records: false}}).aujourdhui.texte, `🔔 Aujourd’hui${NB}: 10${NB}calculs, puis ton record`, "le réglage d'une autre activité ne compte pas");
});

test("le badge : les métaux sans étoile, puis les étoiles gagnées, puis la Légende — jamais « Diamant »", () => {
  const lire = lecteur();
  const metal = n => lire(P, eleve({acquises: MOTEUR.TABLES.slice(0, n)}), {}).rang.cle;
  assert.deepEqual([1, 3, 6, 9].map(metal), ["bronze", "argent", "or", "platine"], "les rangs de l'appli, inchangés");
  for (let etoiles = 1; etoiles <= 4; etoiles += 1) {
    const rang = lire(P, neuf(etoiles, 0), {}).rang;
    assert.deepEqual({cle: rang.cle, nom: rang.nom, lu: rang.lu}, {cle: "etoiles", nom: "★".repeat(etoiles), lu: `${etoiles} étoile${etoiles > 1 ? "s" : ""}`});
  }
  assert.equal(MOTEUR.rang(MOTEUR.rangDeLEtat(neuf(4, 0))).cle, "diamant", "l'appli dit encore « Diamant » à 4 étoiles (écart accepté par Gwenaël)");
  assert.equal(lire(P, neuf(5, 0), {}).rang.cle, "legende");
  assert.equal(lire(P, neuf(5, 0), {}).rang.nom, "Légende des tables");
  // Lot B1 : le badge est l'INSIGNE de la porte. Ni point de métal pour les
  // étoiles et la couronne, ni « Mon rang : ★★ » lu tel quel ; la couronne est
  // le dessin de l'appli, plus l'emoji.
  const debut = page.indexOf("  function insigneDe(");
  const bloc = page.slice(debut, page.indexOf("\n  }\n", debut));
  assert.match(bloc, /if \(r\.cle === "legende"\) insigne\.append\(dessinCouronne\(\), document\.createTextNode\("Légende"\)\);/);
  assert.match(bloc, /else if \(r\.cle === "etoiles"\) insigne\.append\(document\.createTextNode\(texteCourt\(r\.nom\)\)\);/);
  assert.match(bloc, /insigne\.setAttribute\("aria-label", `Mon rang : \$\{texteCourt\(r\.lu \|\| r\.nom\)\}`\);/);
  assert.match(page, /\.insigne\.legende, \.insigne\.etoiles, \.insigne\.or \{ background: linear-gradient\(135deg, #fff1c2, #ffe08a\); color: #6b4a00; border-color: #e6c25a; \}/, "l'or du badge Légende");
});

test("la pastille dit l'étape suivante QUI CHANGE : jamais « la table de 5, puis la table de 5 »", () => {
  const lire = lecteur();
  const texte = lire(P, eleve({acquises: [2, 10]}), {}).aujourdhui.texte;
  assert.equal(texte, `🔔 Aujourd’hui${NB}: la table de${NB}5`);
  assert.doesNotMatch(texte, /puis la table/);
  const source = page.slice(page.indexOf("  function aujourdhuiDefiTables("), page.indexOf("\n  }\n", page.indexOf("  function aujourdhuiDefiTables(")));
  assert.match(source, /P\.ouvrirSeance\(parcours, \{aujourdhui: jour\}\)/, "la séance du jour, par le moteur");
  assert.match(source, /P\.programmeDeSeance\(parcours, seance, jour, options\)\.etapes/, "la même source que la carte « Ma séance du jour »");
  assert.match(source, /if \(!seance\.faites\.length && P\.bilanSeances\(parcours, jour\)\.aujourdhui > 0\) \{/, "« faite » seulement si rien n'est en cours");
});

test("un parcours illisible n'affiche rien ; un parcours tout neuf, la pastille seule", () => {
  const lire = lecteur();
  assert.equal(lire(P, "pas un objet", {}), null);
  assert.equal(lire(P, [], {}), null);
  assert.deepEqual(Object.keys(lire(P, MOTEUR.creerParcours(), {})), ["aujourdhui"], "ni barre, ni compte, ni rang");
});

// Lot B1 « Mon espace redessiné » (21/11/2026) : la pastille « Aujourd'hui »
// de la tuile est devenue le bloc « Aujourd'hui » en tête de Mon espace. Ce
// que la séance du jour annonce (« 10 calculs, puis ton record ») en est le
// sous-titre, lu par le moteur ; « faite » = le jour vert de Défi tables.
test("le bloc « Aujourd'hui » : la séance du jour en sous-titre, par textContent ; faite, on passe à la suite", () => {
  const lire = lecteur();
  assert.equal(lire(P, neuf(5, 10), {}).aujourdhui.quoi, `10${NB}calculs, puis ton record`);
  assert.equal(lire(P, eleve({acquises: [2, 10]}), {}).aujourdhui.quoi, `la table de${NB}5`);
  const sous = page.slice(page.indexOf("  function sousTitre("), page.indexOf("\n  }\n", page.indexOf("  function sousTitre(")));
  assert.match(sous, /jauge\.aujourdhui && typeof jauge\.aujourdhui\.quoi === "string" && jauge\.aujourdhui\.quoi\) return jauge\.aujourdhui\.quoi;/);
  const jour = page.slice(page.indexOf("  function poserJour("), page.indexOf("\n  }\n", page.indexOf("  function poserJour(")));
  assert.match(jour, /\$\("jour-sous"\)\.textContent = sousTitre\(/, "le sous-titre en texte");
  assert.deepEqual(jour.match(/innerHTML[^;]*;/g), ['innerHTML = CHECK_BLANC;', 'innerHTML = icone(appli.cle);'],
    "en HTML, seulement les dessins écrits dans la page");
  assert.match(jour, /faits\.includes\(appli\.cle\)/, "faite = le jour vert d'aujourd'hui");
});

test("les portes ne remontent plus : leur ordre est celui de la classe, quoi que disent les jauges", () => {
  const espace = page.slice(page.indexOf("  function afficherEspace("), page.indexOf("\n  }\n", page.indexOf("  function afficherEspace(")));
  assert.match(espace, /const rang = a => \(a\.cle === "cours" \? 0 : a\.cle === "splat" \? 2 : 1\);/);
  assert.doesNotMatch(page, /function remonter|insertBefore/);
});
