// « Suivre ses élèves », lot S2 : le correctif après la relecture de Codex
// (08/11/2026, neuf défauts, un seul correctif). Chaque test rejoue un
// défaut avec les fonctions de la page telles qu'elles y sont écrites — et,
// pour l'historique, avec les VRAIS moteurs servis par le serveur.
//   1. plus aucun prénom dans une zone cachée (élève supprimé, autre classe) ;
//   2. une réponse ancienne n'est jamais posée (A → B → A, suppression,
//      reconnexion) ;
//   3. une panne : une seule lecture, jamais relancée toute seule ;
//   4. une appli fermée garde le travail fait dans le bilan ;
//   5. une erreur retardée ne s'écrit ni chez un autre élève, ni dans un
//      autre onglet ;
//   6. l'historique va jusqu'au bout (plus de plafond d'un an) ;
//   7. une période coupée n'est pas un zéro (« ? », « ≥ ») ;
//   8. au téléphone, le prénom de la fiche ne passe pas sous ‹ › ✕ ;
//   9. à 320 px, le prénom et les 7 jours tiennent (contrôlé à l'écran par
//      outils/s2-ecrans.cjs ; ici, les règles).

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {createRequire} from "node:module";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
const exiger = createRequire(import.meta.url);
const prof = nom => exiger(join(racine, "_serveur/public/prof", nom));
const T = prof("defi_tables_mon_parcours.js");
const D = prof("defi_calcul_mon_parcours.js");
const DCORE = prof("defi_calcul_core.js");
const S = prof("splat-parcours.js");
const C = prof("coffres-parcours.js");
const A = prof("flash_anzan_parcours.js");

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") { profondeur -= 1; if (profondeur === 0) return source.slice(position, i + 1); }
  }
  throw new Error("bloc non fermé");
}
function fonction(nom, source = script) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(source);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}
function constante(nom) {
  const position = script.indexOf(`const ${nom} = `);
  assert.ok(position >= 0, `la page doit définir ${nom}`);
  let i = position + `const ${nom} = `.length, profondeur = 0, dansTexte = "";
  for (; i < script.length; i += 1) {
    const c = script[i];
    if (dansTexte) { if (c === dansTexte && script[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return script.slice(position, i + 1);
}
const attendre = () => new Promise(r => setTimeout(r, 0));

// ------------------------------------------------------------ les lectures (points 2, 3, 5)

// Un document de poche : chaque zone garde son texte et ses enfants.
function zone() {
  const z = {enfants: [], hidden: false, dataset: {}, _texte: ""};
  Object.defineProperty(z, "textContent", {get: () => z._texte + z.enfants.map(e => e.textContent).join(""), set: v => { z._texte = String(v); z.enfants = []; }});
  z.append = (...n) => n.forEach(x => z.enfants.push(typeof x === "string" ? {textContent: x} : x));
  return z;
}

const LECTURES = ["applisDuBilan", "applisDeLaVue", "elevesDeLaVue", "listesManquantes", "sansSupprimes", "chargerApplis",
  "lectureAJour", "chargerLaClasse", "lectureDeLaClasse", "textePanne", "reporterEleve", "moteurSuivi",
  "fermerPopOuEnEst", "viderZonesIds", "viderZonesClasse", "viderZonesCalcul"].map(n => fonction(n)).join("\n");
const CONSTANTES = ["APPLIS", "ZONES_LA_CLASSE", "ZONES_CALCUL_CLASSE"].map(constante).join("\n");

// La page, rejouée : `api(action, corps)` est le serveur (une promesse que le
// test libère quand il veut) ; le reste est minimal.
function pageLectures(api) {
  const zones = new Map();
  const $ = id => { if (!zones.has(id)) zones.set(id, zone()); return zones.get(id); };
  const journal = [];
  const p = new Function("$", "api", "journal", `
    let tableaux = {}, eleves = [], appliAffichee = "defi-tables";
    let classe = {id: 1, applis: ["defi-tables"]}, jeton = "j", generation = 0, lectureClasse = null;
    const moteur = {resumeSuivi() { return {jours: []}; }};
    let PARCOURS = moteur, CALCUL = moteur, SPLAT = moteur, COFFRES = moteur, ANZAN = moteur;
    ${CONSTANTES}
    function chargerMoteurDe() { return Promise.resolve(null); }
    function elevesLus(cle, liste) { return liste.map(e => Object.assign({}, e, {lu: {lisible: true}})); }
    function reporterAccesDeLaListe() {}
    function messager(id, texte) { journal.push(["messager", id, texte]); }
    function surErreur(e, z) { journal.push(["surErreur", z, e.statut]); }
    function raisonDe(e) { return e.message; }
    const redessin = {demander() { journal.push(["redessin"]); }};
    function nomDeLAppli(cle) { return ({"defi-tables": "Défi tables", "coffres": "Coffres magiques", "splat": "SPLAT!", "defi-calcul": "Défi calcul", "flash-anzan": "Anzan"})[cle]; }
    function applisAMontrer() { return classe.applis; }
    function aDuTravail(e) { return Boolean(e.maj_le); }
    ${LECTURES}
    return {run: code => eval(code)};`)($, api, journal);
  return {p, $, journal};
}

// Le serveur de poche : chaque « tableau » attend qu'on le libère.
function serveurEnAttente() {
  const demandes = [];
  const api = (action, corps) => new Promise((ok, non) => demandes.push({action, corps, ok, non}));
  return {api, demandes, de: cle => demandes.filter(d => d.corps.appli === cle)};
}
const ALICE = {id: 11, prenom: "Alice"}, BOB = {id: 12, prenom: "Bob"};

test("point 2 — A → B → A : la réponse demandée pour la première ouverture de A n'est pas posée dans la seconde", async () => {
  const s = serveurEnAttente();
  const {p} = pageLectures(s.api);
  p.run(`tableaux = {"defi-tables": [{id: 11, prenom: "Alice"}]}`);
  const lecture = p.run("chargerApplis(['coffres'])").catch(() => {});
  await attendre();
  // B, puis A rouverte : ouvrirClasse refait `tableaux` (un autre objet).
  p.run(`classe = {id: 2, applis: []}; tableaux = {"defi-tables": []};`);
  p.run(`classe = {id: 1, applis: ["defi-tables"]}; tableaux = {"defi-tables": [{id: 11, prenom: "Alice"}]};`);
  s.de("coffres")[0].ok({eleves: [{id: 11, prenom: "VieilleAlice"}]});
  await lecture;
  assert.equal(p.run("tableaux.coffres"), undefined, "l'ancienne réponse n'est pas posée : la classe a été relue entre-temps");
  // La nouvelle lecture de A, elle, se pose.
  const neuve = p.run("chargerApplis(['coffres'])");
  await attendre();
  s.de("coffres")[1].ok({eleves: [{id: 11, prenom: "Alice"}]});
  await neuve;
  assert.deepEqual(p.run("tableaux.coffres.map(e => e.prenom)"), ["Alice"]);
});

test("point 2 — un élève supprimé pendant l'attente ne revient pas ; une reconnexion rend l'ancienne réponse périmée", async () => {
  const s = serveurEnAttente();
  const {p} = pageLectures(s.api);
  p.run(`tableaux = {"defi-tables": [{id: 11, prenom: "Alice"}, {id: 12, prenom: "Bob"}]}; eleves = tableaux["defi-tables"];`);
  const lecture = p.run("chargerApplis(['coffres', 'splat'])");
  await attendre();
  // Comme supprimerEleve : la liste regardée, puis toutes les listes déjà lues.
  p.run("eleves = eleves.filter(e => e.id !== 11); reporterEleve({id: 11, prenom: 'Alice'}, true)");
  s.de("coffres")[0].ok({eleves: [ALICE, BOB]});
  s.de("splat")[0].ok({eleves: [ALICE, BOB]});
  await lecture;
  assert.deepEqual(p.run("tableaux.coffres.map(e => e.id)"), [12], "Alice, supprimée pendant l'attente, ne revient pas dans Coffres");
  assert.deepEqual(p.run("tableaux.splat.map(e => e.id)"), [12]);
  // Se déconnecter, se reconnecter sur la même classe : generation avance.
  const vieille = p.run("chargerApplis(['flash-anzan'])").catch(() => {});
  await attendre();
  p.run("generation += 1; jeton = 'nouveau';");
  s.de("flash-anzan")[0].ok({eleves: [ALICE]});
  await vieille;
  assert.equal(p.run("tableaux['flash-anzan']"), undefined, "une réponse d'avant la reconnexion n'est pas posée");
});

test("point 3 — une panne : UNE lecture, jamais relancée toute seule ; la raison reste ; les autres applis vont au bout", async () => {
  const s = serveurEnAttente();
  const {p, journal} = pageLectures(s.api);
  p.run(`tableaux = {"defi-tables": [{id: 11, prenom: "Alice"}]};`);
  p.run("lectureDeLaClasse()");
  await attendre();
  assert.equal(s.demandes.length, 4, "les quatre listes qui manquent, une fois chacune");
  s.de("coffres")[0].non(Object.assign(new Error("Le serveur ne répond pas."), {statut: 500}));
  for (let i = 0; i < 5; i += 1) await attendre();
  assert.equal(p.run("lectureClasse.fini"), false, "Coffres a échoué, les autres sont encore en route : la lecture n'est pas finie");
  assert.equal(journal.filter(([quoi]) => quoi === "redessin").length, 0, "rien de redessiné avant la fin");
  for (const cle of ["splat", "defi-calcul", "flash-anzan"]) s.de(cle)[0].ok({eleves: [ALICE]});
  for (let i = 0; i < 5; i += 1) await attendre();
  assert.equal(p.run("lectureClasse.fini"), true);
  assert.equal(p.run("lectureClasse.raison"), "Le serveur ne répond pas.");
  assert.deepEqual(p.run("Object.keys(tableaux).sort()"), ["defi-calcul", "defi-tables", "flash-anzan", "splat"], "une panne n'arrête pas les autres");
  assert.deepEqual(p.run("listesManquantes()"), ["coffres"]);
  // Chaque dessin redemande la lecture : rien n'est relancé.
  for (let i = 0; i < 10; i += 1) { p.run("lectureDeLaClasse()"); await attendre(); }
  assert.equal(s.demandes.length, 4, "après la panne, plus aucun appel tout seul");
  assert.equal(journal.filter(([quoi]) => quoi === "redessin").length, 1, "un seul redessin, à la fin de la lecture");
  assert.equal(p.run("textePanne(listesManquantes(), lectureClasse)"), "Coffres magiques n’a pas pu être lu (Le serveur ne répond pas)");
  // Rouvrir la classe (ouvrirClasse : lectureClasse = null, `tableaux` refait) : une nouvelle lecture.
  p.run(`lectureClasse = null; tableaux = Object.assign({}, tableaux);`);
  p.run("lectureDeLaClasse()");
  await attendre();
  assert.equal(s.demandes.length, 5);
});

test("point 3 — un moteur qui ne se charge pas : une lecture finie, sans boucle", async () => {
  const s = serveurEnAttente();
  const {p} = pageLectures(s.api);
  p.run(`tableaux = {"defi-tables": [], "splat": [], "defi-calcul": [], "flash-anzan": []}; COFFRES = null;`);
  p.run("lectureDeLaClasse()");
  await attendre();
  s.de("coffres")[0].ok({eleves: []});
  for (let i = 0; i < 4; i += 1) await attendre();
  assert.deepEqual(p.run("listesManquantes()"), ["coffres"], "la liste est là, son moteur non");
  for (let i = 0; i < 5; i += 1) { p.run("lectureDeLaClasse()"); await attendre(); }
  assert.equal(s.demandes.length, 1, "aucune relance");
});

test("point 3 — une session terminée pendant la lecture passe par surErreur (la reconnexion), pas par un message", async () => {
  const s = serveurEnAttente();
  const {p, journal} = pageLectures(s.api);
  p.run(`tableaux = {"defi-tables": []};`);
  p.run("chargerLaClasse()");
  await attendre();
  s.de("coffres")[0].non(Object.assign(new Error("Session terminée"), {statut: 401}));
  ["splat", "defi-calcul", "flash-anzan"].forEach(cle => s.de(cle)[0].ok({eleves: []}));
  for (let i = 0; i < 5; i += 1) await attendre();
  assert.deepEqual(journal.filter(([quoi]) => quoi === "surErreur"), [["surErreur", "lc-message", 401]]);
});

test("point 5 — l'erreur d'une lecture abandonnée (autre classe, déconnexion) ne s'écrit nulle part", async () => {
  const s = serveurEnAttente();
  const {p, journal} = pageLectures(s.api);
  p.run(`tableaux = {"defi-tables": []};`);
  p.run("chargerLaClasse()");
  await attendre();
  const marque = p.run("lectureClasse");
  p.run(`classe = {id: 2, applis: []}; tableaux = {"defi-tables": []}; lectureClasse = null;`);
  s.demandes.forEach(d => d.non(Object.assign(new Error("Refusé"), {statut: 401})));
  for (let i = 0; i < 5; i += 1) await attendre();
  assert.equal(journal.filter(([quoi]) => quoi === "surErreur" || quoi === "redessin").length, 0, "rien d'écrit, rien de redessiné");
  assert.equal(marque.raison, "", "la panne n'est pas retenue pour la classe d'après");
});

test("point 5 — la fiche ne pose plus aucun message d'une attente : elle dessine l'état de la lecture ; un onglet changé invalide le billet de Défi tables", () => {
  const ensemble = fonction("contenuEnsemble");
  const fenetre = fonction("dessinerFenetreEleve");
  for (const [nom, code] of [["contenuEnsemble", ensemble], ["dessinerFenetreEleve", fenetre]]) {
    assert.doesNotMatch(code, /chargerApplis\(/, `${nom} ne lance plus sa propre lecture`);
    assert.doesNotMatch(code, /\.catch\(|\.finally\(/, `${nom} n'attend plus rien`);
    assert.match(code, /lectureDeLaClasse\(\)/, `${nom} partage la lecture de la classe`);
  }
  assert.match(fonction("changerOngletFiche"), /demandeParcours \+= 1;/);
  const parcours = fonction("montrerParcours");
  assert.match(parcours, /const encore = \(\) => demande === demandeParcours && fenetreEleveId === eleve\.id\s*&& ongletFiche === "defi-tables" && session === generation && Boolean\(jeton\);/);
  // Le catch vérifie la même garde AVANT d'écrire quoi que ce soit.
  assert.match(parcours, /\} catch \(erreur\) \{\s*if \(!encore\(\)\) return;/);
});

// ------------------------------------------------------------ les zones cachées (point 1)

test("point 1 — hors de La classe, ses zones sont vidées ; la liste d'une barre fermée n'a plus de prénom ; une autre classe vide tout", () => {
  const {p, $} = pageLectures(() => new Promise(() => {}));
  const ids = p.run("ZONES_LA_CLASSE.concat(ZONES_CALCUL_CLASSE)");
  ids.forEach(id => $(id).append("Alice"));
  $("dc-ouest-pop").hidden = false;
  p.run("fermerPopOuEnEst()");
  assert.equal($("dc-ouest-pop").hidden, true);
  assert.equal($("dc-ouest-pop").textContent, "", "fermée, la liste n'a plus de prénom");
  p.run("viderZonesClasse(); viderZonesCalcul();");
  ids.forEach(id => assert.equal($(id).textContent, "", `${id} vidée`));
  assert.equal($("dc-ouest").hidden, true);
  assert.equal($("dc-qui").hidden, true);
  // Où c'est appelé : chaque redessin du tableau (la suppression d'un élève
  // en redessine un, quel que soit l'onglet), et l'ouverture d'une autre classe.
  const tableau = fonction("dessinerTableau");
  assert.match(tableau, /if \(vue === "classe"\) dessinerLaClasse\(\);\s*else viderZonesClasse\(\);\s*if \(appliAffichee !== "defi-calcul"\) viderZonesCalcul\(\);/);
  assert.match(fonction("ouvrirClasse"), /if \(!memeClasse\) \{ viderZonesClasse\(\); viderZonesCalcul\(\); \}/);
  assert.match(fonction("supprimerEleve"), /reporterEleve\(eleve, true\);\s*redessin\.demander\(\);/);
  // Les cartes de Défi calcul sans élève commencé se vident aussi.
  assert.match(fonction("dessinerOuEnEst"), /bloc\.hidden = true;\s*viderZonesIds\(\["dc-ouest-sous", "dc-ouest-paliers", "dc-ouest-liste"\]\);/);
  assert.match(fonction("dessinerQuiSentraine"), /bloc\.hidden = true;\s*viderZonesIds\(\["dc-qui-barres", "dc-qui-texte"\]\);/);
  // Et à la déconnexion, comme avant : toutes dans ZONES_TEXTE.
  const zonesTexte = constante("ZONES_TEXTE");
  ids.forEach(id => assert.ok(zonesTexte.includes(`"${id}"`), `${id} part aussi à la déconnexion`));
});

// ------------------------------------------------------------ le bilan, l'historique (points 4, 6, 7)

const SOURCES = ["jourPlus", "lundiDuJour", "joursEntre", "pluriel", "moteurSuivi", "suiviApp", "eleveDe", "elevesDeLaVue",
  "applisDuBilan", "listesManquantes", "bilanEleve", "coupureDe", "compteSemaine", "enJoursSemaine", "jourCourtChiffres",
  "aiderDe", "feliciterDe", "joursDeLaFiche", "seancesDeLAppli", "nomDeLAppli", "nomCompetenceCalcul", "nomModuleCalcul"].map(n => fonction(n)).join("\n");
const CONSTANTES_BILAN = ["APPLIS", "RANGS_AIDER", "JOURS_ABSENT", "memoSuivi"].map(constante).join("\n");
function pageRejouee(listes, aujourdhui, applisDeLaClasse = ["defi-tables"]) {
  return new Function("PARCOURS", "CALCUL", "CALCUL_CORE", "SPLAT", "COFFRES", "ANZAN", "tableaux", "AUJ", "classe",
    `let eleves = [];\n${CONSTANTES_BILAN}\n${SOURCES}\nfunction aujourdhuiSuivi() { return AUJ; }\n`
    + "return {bilanEleve, joursDeLaFiche, seancesDeLAppli, coupureDe, compteSemaine, applisDuBilan, listesManquantes};")(
    T, D, DCORE, S, C, A, listes, aujourdhui, {id: 1, applis: applisDeLaClasse});
}
const carte = DCORE.carte();
function lu(cle, id, parcours, aujourdhui) {
  const eleve = {id, prenom: `É${id}`, initiale: "", maj_le: parcours ? `${aujourdhui}T10:00:00Z` : null, parcours: parcours || null, acces: {applis: []}};
  if (cle === "defi-calcul") eleve.lu = parcours ? D.resumeProf(parcours, carte, aujourdhui) : {lisible: true, commence: false};
  else eleve.lu = {lisible: true, commence: Boolean(parcours)};
  return eleve;
}
function seancesT(paires) {
  const p = T.creerParcours();
  p.seances = paires.map(([jour]) => jour);
  T.JOURNAL.forEach((champ, index) => { p.journal[champ] = paires.map(([, e]) => (index < e.length ? e[index] : -1)); });
  return T.normaliserParcours(p);
}
const CARTE_CALCUL = {modules: carte.modules.map(f => Object.assign({}, f, {construit: f.paliers.some(Boolean)})), ordre: carte.ordre};
function seanceD(p, jour) {
  p = D.ouvrirSeance(p, CARTE_CALCUL, {aujourdhui: jour, nouveautes: 1});
  const avant = p.seance.n;
  for (let tour = 0; tour < 30 && p.seance.n === avant; tour += 1) {
    const etape = D.fileSeance(p, CARTE_CALCUL, {aujourdhui: jour}).etapes[0];
    if (!etape) break;
    p = D.noterTemps(p, 300);
    if (etape.type === "jour") {
      D.tirerCalculsDuJour(p, CARTE_CALCUL, {aujourdhui: jour}).forEach(c => {
        p = D.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: true, ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
      });
      p = D.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE_CALCUL}).parcours;
    } else if (etape.type === "test") {
      p = D.appliquerTest(p, {module: etape.module, marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    } else if (etape.type === "apprends") {
      p = D.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: "apprends"}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    } else {
      const reponses = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
      p = D.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    }
  }
  return p;
}
const JEUDI = "2026-11-12";

test("point 4 — une appli fermée depuis : son travail compte toujours, « toutes applis confondues » ; sa liste est lue", () => {
  // Défi calcul fermé à la classe : seul Défi tables est ouvert.
  const listes = {
    "defi-tables": [lu("defi-tables", 1, null, JEUDI)],
    "defi-calcul": [lu("defi-calcul", 1, seanceD(D.creerParcours(), "2026-11-11"), JEUDI)]
  };
  const p = pageRejouee(listes, JEUDI);
  const alice = p.bilanEleve(1, JEUDI);
  assert.equal(alice.absent, null, "elle a travaillé hier dans Défi calcul : ni « jamais venu », ni absente");
  assert.equal(alice.dernier, "2026-11-11");
  assert.ok(alice.jours.has("2026-11-11"));
  assert.deepEqual(p.applisDuBilan().slice().sort(), ["coffres", "defi-calcul", "defi-tables", "flash-anzan", "splat"], "les cinq applis du catalogue, ouvertes ou non");
  assert.deepEqual(p.listesManquantes().sort(), ["coffres", "flash-anzan", "splat"], "les listes des applis fermées sont lues aussi (le même appel « tableau »)");
  for (const nom of ["bilanEleve", "joursDeLaFiche"]) assert.match(fonction(nom), /applisDuBilan\(\)/, `${nom} compte toutes les applis`);
});

test("point 6 — l'historique va jusqu'au bout : une séance de janvier 2025 se voit, sans plafond ; un long trou sans séance est sauté", () => {
  const p = pageRejouee({"defi-tables": [lu("defi-tables", 1, seancesT([["2025-01-01", [4, 4, 6, 6, 0]], [JEUDI, [5, 4, 6, 6, 0]]]), JEUDI)]}, JEUDI);
  const tout = p.joursDeLaFiche(1, JEUDI, 100);
  assert.deepEqual(tout.jours.map(j => j.jour), [JEUDI, "2025-01-01"]);
  assert.equal(tout.encore, false);
  const un = p.joursDeLaFiche(1, JEUDI, 1);
  assert.deepEqual(un.jours.map(j => j.jour), [JEUDI]);
  assert.equal(un.encore, true, "il en reste une, plus ancienne : le bouton est là");
  // Une seule séance, très ancienne : « Ce qu'il a fait » la montre.
  const seule = pageRejouee({"defi-tables": [lu("defi-tables", 1, seancesT([["2024-09-03", [2, 4, 6, 6, 0]]]), JEUDI)]}, JEUDI);
  assert.deepEqual(seule.joursDeLaFiche(1, JEUDI, 6).jours.map(j => j.jour), ["2024-09-03"]);
  // Défi calcul, ses séances : la même chose.
  const calcul = lu("defi-calcul", 1, [ "2025-01-06", "2026-11-10"].reduce(seanceD, D.creerParcours()), JEUDI);
  const pc = pageRejouee({"defi-calcul": [calcul]}, JEUDI);
  const s = pc.seancesDeLAppli("defi-calcul", calcul, 10);
  assert.deepEqual(s.seances.map(x => x.jour), ["2026-11-10", "2025-01-06"]);
  assert.equal(s.encore, false);
  for (const nom of ["joursDeLaFiche", "seancesDeLAppli"]) assert.doesNotMatch(fonction(nom), /< 13|periode/, `${nom} n'a plus de plafond en périodes`);
});

test("point 7 — 60 séances de Défi tables le même jour : les semaines d'avant ne sont pas des zéros (« ? », « ≥ »), la fiche le dit", () => {
  const plein = seancesT(Array.from({length: 60}, () => [JEUDI, [4, 4, 6, 6, 0]]));
  assert.equal(T.resumeSuivi(plein, {aujourdhui: JEUDI}).connuDepuis, JEUDI, "le moteur dit que la borne coupe");
  const p = pageRejouee({"defi-tables": [lu("defi-tables", 1, plein, JEUDI)]}, JEUDI);
  const b = p.bilanEleve(1, JEUDI);
  assert.equal(b.coupure, JEUDI);
  assert.deepEqual(b.semaines.map(p.compteSemaine), ["?", "?", "?", "≥ 1"], "trois semaines pas connues, et celle-ci : au moins 1 jour");
  assert.deepEqual(p.joursDeLaFiche(1, JEUDI, 6).notes, ["Défi tables : les jours d’avant le 12/11 ne sont pas connus."]);
  // Rien de coupé : les nombres tels quels.
  const court = pageRejouee({"defi-tables": [lu("defi-tables", 1, seancesT([["2026-11-03", [4, 4, 6, 6, 0]], [JEUDI, [4, 4, 6, 6, 0]]]), JEUDI)]}, JEUDI);
  const bc = court.bilanEleve(1, JEUDI);
  assert.equal(bc.coupure, null);
  assert.deepEqual(bc.semaines.map(court.compteSemaine), ["0", "0", "1", "1"]);
});

test("point 7 — SPLAT! et Coffres : la borne des 60 jours et un journal d'avant le lot S1 coupent ; un journal commencé au premier jour joué, non", () => {
  const etape = date => ({m1e1: {fait: true, etoiles: 3, cartes: 4, vues: 0, essais: 1, date}});
  const jourPlus = (jour, n) => { const d = new Date(`${jour}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  // Nouveau : son journal commence le jour où il a joué pour la première fois.
  const nouveau = {version: 2, epoque: 0, etapes: etape("2026-11-10"), jours: ["2026-11-10"], journal: {series: [2], reussies: [1], vues: [0]}, depuis: "2026-11-10"};
  // A joué avant le lot S1 (pas de journal) : rien de connu.
  const ancien = {version: 1, epoque: 0, etapes: etape("2026-10-01")};
  // La borne : 60 jours gardés, le journal tenu depuis plus longtemps.
  const borne = S.fusionner(
    {version: 2, epoque: 0, etapes: etape("2026-11-01"), jours: Array.from({length: 60}, (_, i) => jourPlus("2026-09-01", i)), journal: {series: Array(60).fill(1), reussies: Array(60).fill(1), vues: Array(60).fill(0)}, depuis: "2026-09-01"},
    {version: 2, epoque: 0, etapes: etape("2026-11-01"), jours: ["2026-08-20"], journal: {series: [9], reussies: [9], vues: [9]}, depuis: "2026-08-20"});
  const listes = {"splat": [lu("splat", 1, nouveau, JEUDI), lu("splat", 2, ancien, JEUDI), lu("splat", 3, borne, JEUDI)]};
  const p = pageRejouee(listes, JEUDI);
  assert.equal(p.coupureDe("splat", listes.splat[0], JEUDI), null, "rien n'est coupé pour un élève qui a commencé avec le journal");
  assert.deepEqual(p.bilanEleve(1, JEUDI).semaines.map(p.compteSemaine), ["0", "0", "0", "1"]);
  assert.equal(p.coupureDe("splat", listes.splat[1], JEUDI), "2026-11-13", "joué avant le lot S1 : rien de connu jusqu'à aujourd'hui");
  assert.deepEqual(p.bilanEleve(2, JEUDI).semaines.map(p.compteSemaine), ["?", "?", "?", "?"]);
  assert.match(p.joursDeLaFiche(2, JEUDI, 6).notes[0], /^SPLAT! : ses jours de travail d’avant ne sont pas connus/);
  assert.equal(p.coupureDe("splat", listes.splat[2], JEUDI), "2026-09-01", "la borne des 60 jours coupe");
  assert.deepEqual(p.joursDeLaFiche(3, JEUDI, 6).notes, ["SPLAT! : les jours d’avant le 01/09 ne sont pas connus."]);
  // Coffres : un trésor le 10/11, journal commencé ce jour-là — rien de coupé.
  const coffre = C.normaliser({jours: ["2026-11-10"], journal: {tresors: [2], parfaits: [1], aides: [0], solutions: [0]}, depuis: "2026-11-10"});
  const pc = pageRejouee({"coffres": [lu("coffres", 4, coffre, JEUDI)]}, JEUDI);
  assert.equal(pc.coupureDe("coffres", lu("coffres", 4, coffre, JEUDI), JEUDI), null);
});

test("point 7 — à l'écran : « ? » dans la case d'un jour pas connu, dans le tableau et dans le calendrier de la fiche ; l'infobulle le dit", () => {
  assert.match(fonction("caseSemaine"), /const inconnu = !fait && Boolean\(bilan && bilan\.coupure && jour < bilan\.coupure\);/);
  assert.match(fonction("celluleQuatreSemaines"), /compteSemaine\(semaine\)/);
  assert.match(fonction("celluleQuatreSemaines"), /ne sont pas tous connus/);
  assert.match(fonction("contenuEnsemble"), /" inconnu"/);
  assert.match(style, /\.lc-jour\.inconnu \{/);
  assert.match(style, /\.fe-case\.inconnu \{/);
  // La note de la coupure : pour les cinq applis, plus d'exception SPLAT!/Coffres.
  assert.doesNotMatch(fonction("joursDeLaFiche"), /cle !== "splat"/);
});

// ------------------------------------------------------------ le téléphone (points 8, 9)

test("points 8 et 9 — au téléphone : la place de ‹ › ✕ reste réservée à droite du prénom ; le tableau de La classe tient en largeur", () => {
  const telephone = style.slice(style.indexOf("@media (max-width: 700px) {\n    .barre-onglets > .onglets-vue .mot"));
  const bloc = telephone.slice(0, telephone.indexOf("\n  }\n"));
  // ‹ › ✕ : 3 × 44 px + 2 × 6 px, à 12 px du bord ; la fenêtre a 14 px de
  // marge : 146 px réservés à droite du prénom et de la classe — pas des
  // onglets, qui gardent toute la largeur.
  assert.match(bloc, /\.fenetre-eleve \.naviguer \{ top: 12px; right: 12px; \}/);
  assert.match(bloc, /\.fenetre-eleve #fe-titre, \.fenetre-eleve #fe-sous \{ padding-right: 146px; \}/);
  assert.ok(3 * 44 + 2 * 6 + 12 - 14 <= 146);
  assert.match(bloc, /#lc-tableau \{ width: 100%; table-layout: fixed; \}/);
  assert.match(bloc, /#lc-tableau th:nth-child\(2\) \{ width: 148px; \}/, "7 cases de 19 px, 6 écarts de 1 px, 2 × 4 px de marge : 147");
  assert.match(bloc, /\.lc-jour \{ width: 19px; height: 19px; \}/);
  assert.match(bloc, /#lc-tableau td\.nom \.lien-eleve \{ max-width: 100%; \}/);
  assert.doesNotMatch(bloc, /max-width: 40vw/);
});
