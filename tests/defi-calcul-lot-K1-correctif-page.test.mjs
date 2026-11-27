// Défi calcul, lot K1 — le correctif de la relecture de Codex du 26/11/2026 :
// la page et Mon espace, lus tels qu'ils sont (sans navigateur). Ce fichier
// ne prouve pas ce que le navigateur en fait — c'est la recette
// tests/defi-calcul-lot-K1-correctif-ecrans.cjs qui joue chaque scénario
// dans un vrai navigateur, Mon espace avec le vrai serveur PHP ; il garde
// ici, dans la suite que GitHub rejoue, que chaque correctif reste écrit.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");
const ESPACE = lire("../_serveur/public/index.php");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const SCRIPT = [...PAGE.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
function corps(nom, source = SCRIPT) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `function ${nom}`);
  let profondeur = 0;
  for (let i = source.indexOf("{", debut); i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}" && --profondeur === 0) return source.slice(debut, i + 1);
  }
  throw new Error(nom);
}
const avant = (texte, premier, second, quoi) => {
  const [a, b] = [texte.indexOf(premier), texte.indexOf(second)];
  assert.ok(a >= 0 && b >= 0 && a < b, quoi);
};

test("Codex 10 — la page dit au moteur à quel calcul l'élève répond, et repose un AUTRE calcul après un rechargement", () => {
  const noter = corps("noterRetour");
  assert.match(noter, /deuxieme: Boolean\(deuxieme\)/, "le calcul auquel l'élève répond part avec la réponse");
  assert.match(corps("repondreSerie"), /noterRetour\(serie, question\.calcul, juste, ms, cause, question\.deuxieme\)/);
  assert.match(corps("repondreSerie"), /if \(juste && question\.deuxieme && !mouvement\.perime\)/, "pas de « Tu le savais » sur une réponse périmée");
  const jour = corps("lancerCalculsDuJour");
  // (Lot P1 : de la même sorte que le premier, avec d'autres nombres.)
  assert.match(jour, /\{autreQue: premierCalcul\(tire, tire\.premierLe \|\| aujourdhui\), memeSorte: true\}/, "le 2e calcul reposé exclut le premier, retrouvé par son jour");
  assert.match(jour, /CORE\.graineDe\(`\$\{jour\}:\$\{codeSuivi\}`\) \+ rang \* 977/, "le premier calcul d'une étoile se retrouve : le jour, le code, le rang");
});

test("Codex 11 — la case est relue avant d'effacer, d'envoyer et d'écrire les repères", () => {
  const effacer = corps("effacerHistorique");
  avant(effacer, "if (verifierPageAncienne())", "PARCOURS.effacer(storage(), \"\")", "la version de la case est revérifiée AVANT la suppression");
  assert.match(corps("envoiPossible"), /if \(pagePlusAncienne\(\)\) return false;/);
  assert.match(corps("sauverSync"), /if \(pagePlusAncienne\(\)\) return;/);
  const relue = corps("pagePlusAncienne");
  assert.match(relue, /if \(!verifierPageAncienne\(\)\) return false;\s*renderRepere\(\);/, "la ligne du haut le dit dès que la page le découvre");
  // Tout envoi passe par envoiPossible (l'envoi groupé, l'envoi direct, la relance, la fermeture).
  ["envoyerParcours", "envoyerMaintenant", "envoyerAvantDeFermer", "reprendreLesEnvois"].forEach(nom => assert.match(corps(nom), /envoiPossible\(\)/, nom));
});

test("Codex 12 — le temps est versé avant chaque réponse de Mes calculs du jour, et avant le paquet vide", () => {
  avant(corps("noterRetour"), "verserTempsActif();", "PARCOURS.appliquerRetour(", "le temps d'abord, puis la réponse : rangés ensemble");
  const jour = corps("lancerCalculsDuJour");
  const vide = jour.slice(jour.indexOf("if (!questions.length)"));
  avant(vide, "verserTempsActif();", "PARCOURS.terminerCalculsDuJour(", "le paquet vide verse le temps avant de finir l'étape");
  // Le temps et tout ce que la séance compte portent la source de l'onglet.
  assert.match(SCRIPT, /const SOURCE = PARCOURS\.chargerSourceOnglet\(stockageSession\(\)\);/);
  assert.match(corps("verserTempsActif"), /PARCOURS\.noterTemps\(parcours, secondes, \{source: SOURCE\}\)/);
  assert.match(corps("noterRetour"), /\{aujourdhui: jourCourant\(\), carte: CARTE, source: SOURCE\}/);
  assert.match(corps("finish"), /seance: enSeance\(\) && !MODE_PROF, palier: palierRegle\(\), source: SOURCE\}/);
});

test("Codex 13 — la page ne renvoie que ce qu'elle apporte ; la fusion reçoit la carte (une ceinture complétée)", () => {
  const demarrage = corps("demarrerSuivi");
  assert.match(demarrage, /const apporte = recu\.apporte;/, "`dirty` seul ne force plus un renvoi");
  assert.ok(!/sync\.dirty \|\| recu\.apporte/.test(SCRIPT));
  const reponse = corps("traiterReponseEnvoi");
  assert.match(reponse, /sync\.dirty = recu\.apporte;/);
  assert.match(reponse, /if \(!recu\.apporte\) \{\s*annulerEnvoiGroupe\(\);\s*renvoiDemande = false;/, "après un 409 qui n'apporte rien, plus rien n'attend");
  assert.equal(SCRIPT.split("PARCOURS.recevoir(").length - 1, 2);
  assert.equal(SCRIPT.split(", optionsFusion())").length - 1, 2, "les deux réceptions passent la carte et le réglage au moteur");
  assert.match(corps("optionsFusion"), /\{aujourdhui: jourCourant\(\), carte: CARTE, palier: palierRegle\(\)\}/);
});

test("Codex 14 — l'étoile partie garde ses deux boutons quand le paquet finit la séance", () => {
  const bilan = corps("renderBilanDuJour");
  assert.match(bilan, /\.\.\.\(boutons\.length \? \[boutonsDeSuite\(\.\.\.boutons\)\] : \[\]\)/);
  assert.ok(!/boutons\.length && !fin/.test(bilan), "plus de condition sur la fin de la séance");
  assert.match(bilan, /\["Je tente", "secondary", \(\) => lancerTentative\(id, n\)\]/);
  // Ils ouvrent une séance s'il n'y en a plus : lancerTentative et lancerDepuisCarte s'en chargent.
  assert.match(corps("lancerTentative"), /assurerSeance\(\);/);
  assert.match(corps("lancerDepuisCarte"), /assurerSeance\(\);/);
});

test("Codex 7 — sur la carte, « Continuer » ne promet que ce que le moteur propose", () => {
  const carte = corps("renderCarte");
  assert.match(carte, /const fin = suite\.type === "rien" && !\(s\.ouverte && suite\.tempsFini\);/);
  assert.match(carte, /else if \(suite\.type === "etoile"\) petit\.textContent/);
});

test("Codex 8 — le paquet envoyé ne porte plus la clé « prenom »", () => {
  const paquet = corps("paquetParcours");
  assert.match(paquet, /delete sansPrenom\.prenom;/);
  assert.ok(!/prenom: ""/.test(paquet));
  // Et le moteur range toujours la case d'un code sans prénom.
  const stockage = new Map();
  const faux = {getItem: k => (stockage.has(k) ? stockage.get(k) : null), setItem: (k, v) => { stockage.set(k, String(v)); }, removeItem: k => { stockage.delete(k); }};
  P.sauver(faux, P.definirPrenom(P.creerParcours(), "Léa"), "7K3M9P");
  assert.ok([...stockage.values()].every(v => !v.includes("Léa")));
});

test("Codex 15, 16, 17 — Mon espace annonce le format de son moteur ; une ceinture acquise reste sur la tuile", () => {
  // Le format est lu dans le fichier du moteur que la page charge (la même ligne, ici et en PHP).
  assert.match(ESPACE, /preg_match\('\/\^\\s\*const VERSION = \(\\d\{1,3\}\);\/m', \$texte, \$trouve\)/);
  const moteur = lire("../_serveur/public/prof/defi_calcul_mon_parcours.js");
  const lue = /^\s*const VERSION = (\d{1,3});/m.exec(moteur);
  assert.ok(lue, "le moteur dit sa version sur une ligne « const VERSION = N; »");
  assert.equal(Number(lue[1]), P.VERSION);
  assert.match(ESPACE, /version: Number\("<\?= \$formatCalcul === null \? '' : \(int\)\$formatCalcul \?>"\) \|\| null,/);
  const lecture = corps("lireParcours", ESPACE);
  assert.match(lecture, /const format = JAUGES\[cle\] && Number\.isInteger\(JAUGES\[cle\]\.version\) \? \{version: JAUGES\[cle\]\.version\} : \{\};/);
  assert.match(lecture, /body: JSON\.stringify\(Object\.assign\(\{code, appli: cle, lire: true\}, format\)\)/);
  assert.ok(!/body: JSON\.stringify\(\{code, appli: cle, lire: true\}\)/.test(ESPACE), "plus de lecture sans format possible pour Défi calcul");
  // La ceinture acquise (détail 17).
  assert.match(ESPACE, /if \(!carte\.etoiles && !carte\.etages\.some\(e => e\.ceinture\)\) return null;/);
});

// ------------------------------------------------- Mon espace, joué (ses fonctions, extraites de la page)

const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const ESPACE_NU = ESPACE.replace(/^\s*\/\/.*$/gm, "");
function blocDepuis(source, position) {
  let i = source.indexOf("{", position), profondeur = 0, dansTexte = "";
  for (; i < source.length; i += 1) {
    const c = source[i];
    if (dansTexte) { if (c === dansTexte && source[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if (c === "{") profondeur += 1;
    else if (c === "}" && --profondeur === 0) return source.slice(position, i + 1);
  }
  throw new Error("bloc sans fin");
}
function fonctionEspace(nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(ESPACE_NU);
  assert.ok(m, `Mon espace doit définir ${nom}()`);
  return blocDepuis(ESPACE_NU, m.index);
}
function jaugesEspace() {
  const position = ESPACE_NU.indexOf("const JAUGES = ");
  assert.ok(position > 0);
  // Le format du moteur, tel que le serveur l'écrit ; les autres valeurs du serveur : « x ».
  return blocDepuis(ESPACE_NU, position).replace(/Number\("<\?= [^?]*\? '' : \(int\)\$formatCalcul \?>"\)/, `Number("${P.VERSION}")`).replace(/<\?= .*? \?>/g, "x") + ";";
}

test("Codex 15 — Mon espace, joué : la lecture de Défi calcul annonce la version du moteur, les autres activités ne disent rien", async () => {
  const envois = [];
  const fetchFaux = async (adresse, options) => {
    envois.push([adresse, JSON.parse(options.body)]);
    return {ok: true, json: async () => ({ok: true, existe: true, parcours: {version: P.VERSION}})};
  };
  const lireParcours = new Function("window", "fetch", `${jaugesEspace()}\n${fonctionEspace("lireParcours")}\nreturn lireParcours;`)({MATHSGO_DEFI_CALCUL_CORE: CORE}, fetchFaux);
  // (Lot K1b : le moteur est en version 13 — la page annonce toujours celle de SON moteur.
  // Lot P1 : en version 14.)
  assert.equal(P.VERSION, 14);
  assert.deepEqual(await lireParcours("7K3M9P", "defi-calcul"), {version: 14});
  await lireParcours("7K3M9P", "defi-tables");
  await lireParcours("7K3M9P", "splat");
  assert.deepEqual(envois, [
    ["api/parcours.php", {code: "7K3M9P", appli: "defi-calcul", lire: true, version: 14}],
    ["api/parcours.php", {code: "7K3M9P", appli: "defi-tables", lire: true}],
    ["api/parcours.php", {code: "7K3M9P", appli: "splat", lire: true}]
  ]);
});

test("Codex 16, 17 — Mon espace, joué : pas de « +1 étoile » sur un jour d'entrée sans étoile ; une ceinture acquise reste sur la tuile", () => {
  const JOUR = "2026-11-27"; // un vendredi
  const carte = CORE.carte();
  const JAUGES = new Function("window", `${jaugesEspace()}\nreturn JAUGES;`)({MATHSGO_DEFI_CALCUL_CORE: CORE});
  const gainDe = new Function("window", `${fonctionEspace("lundiDeJour")}\n${fonctionEspace("jourDecale")}\n${fonctionEspace("jourDeLAppareil")}\n${fonctionEspace("enListe")}\n${fonctionEspace("gainDe")}\nreturn gainDe;`)({MATHSGO_DEFI_CALCUL_CORE: CORE});
  // 16 : une progression abîmée — boîte 0, aucune perte, un jour d'entrée resté là (jeudi).
  const liste = v => Array.from({length: P.NIVEAUX.A1}, () => v);
  const abimee = {version: 12, modules: {A1: {vu: "2026-11-26", b: liste(0), e: liste(null), a: liste(0), x: liste(0), r: liste(0), q: liste(null), pe: liste(0),
    d: ["2026-11-26", null, null], s: liste(null), ar: liste(0), g: liste(0), c: {}}}};
  assert.equal(gainDe("defi-calcul", P, abimee, null, JOUR), "", "aucune étoile n'a été gagnée cette semaine");
  assert.equal(JAUGES["defi-calcul"].lecteur(P, abimee), null, "et la tuile ne montre rien");
  // Une étoile vraiment gagnée jeudi : « ↑ +1 étoile cette semaine » ; gagnée puis perdue, elle reste comptée dans la semaine.
  const SIX = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
  let p = P.appliquerTentative(P.creerParcours(), {module: "A1", niveau: 1, reponses: SIX}, {aujourdhui: "2026-11-26", carte}).parcours;
  assert.equal(gainDe("defi-calcul", P, p, null, JOUR), "↑ +1 étoile cette semaine");
  // (Lot P1 : une étoile gagnée du premier coup revient au bout de 7 jours, et
  // un retour raté ne la fait plus partir tout de suite — la règle B : ratée
  // deux jours de suite. Elle est donc gagnée lundi après un « Je tente » raté
  // dimanche, ratée mardi, puis mercredi.)
  p = P.appliquerTentative(P.creerParcours(), {module: "A1", niveau: 1, reponses: [{juste: false, ms: 1500}, {juste: false, ms: 1500}]}, {aujourdhui: "2026-11-22", carte}).parcours;
  p = P.appliquerTentative(p, {module: "A1", niveau: 1, reponses: SIX}, {aujourdhui: "2026-11-23", carte}).parcours;
  for (const jour of ["2026-11-24", "2026-11-25"]) for (let i = 0; i < 2; i += 1) p = P.appliquerRetour(p, {module: "A1", niveau: 1, juste: false, ms: 1500, type: "P"}, {aujourdhui: jour, carte}).parcours;
  assert.equal(p.modules.A1.b[0], 0);
  assert.equal(gainDe("defi-calcul", P, p, null, JOUR), "↑ +1 étoile cette semaine");
  // 17 : la ceinture jaune acquise, et plus aucune étoile tenue (toutes perdues) — la tuile garde la ceinture.
  const etage1 = P.carteEleve(P.creerParcours(), carte, {aujourdhui: JOUR}).etages[0].lignes.flatMap(l => l.etoiles.map(e => e.cle));
  let tout = P.creerParcours();
  carte.ordre.filter(k => etage1.includes(k)).forEach(k => { const [m, n] = k.split("-"); tout = P.appliquerTentative(tout, {module: m, niveau: Number(n), reponses: SIX}, {aujourdhui: "2026-11-02", carte}).parcours; });
  assert.equal(tout.ceintures[0], "2026-11-02");
  const perdues = JSON.parse(JSON.stringify(tout));
  Object.values(perdues.modules).forEach(ligne => ligne.b.forEach((boite, i) => { if (boite) { ligne.b[i] = 0; ligne.e[i] = null; ligne.pe[i] = 1; ligne.g[i] += 1; } }));
  assert.equal(P.carteEleve(perdues, carte, {aujourdhui: JOUR}).etoiles, 0);
  const tuile = JAUGES["defi-calcul"].lecteur(P, perdues);
  assert.ok(tuile, "la tuile ne disparaît pas : la ceinture est acquise");
  assert.deepEqual(tuile.ceinture, {n: 1, rempli: 1}, "la ceinture jaune, pleine");
  // Un parcours neuf, lui, ne montre toujours rien.
  assert.equal(JAUGES["defi-calcul"].lecteur(P, P.creerParcours()), null);
});
