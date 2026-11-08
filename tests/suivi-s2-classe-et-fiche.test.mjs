// « Suivre ses élèves », lot S2 « la classe et la fiche » (07-08/11/2026).
//
// Choix de Gwenaël (planches 1 à 3 du chantier, puis les trois questions du
// lot) : un premier onglet « La classe » — « À aider » (absent : rien depuis
// 7 jours TOUTES APPLIS confondues ; bloqué ; aidé ; 6 lignes au plus, les
// absents d'abord) et « À féliciter » (le lundi : aussi la semaine d'avant),
// puis une ligne par élève, ses 7 jours et ses 4 dernières semaines ; une
// FICHE d'élève, la même depuis n'importe quel onglet (« Vue d'ensemble »,
// puis un onglet par appli) ; dans Défi calcul, « Où en est la classe »,
// « Qui s'entraîne », ses séances et ses compétences en petites cases ;
// « Ouvrir Défi calcul en mode professeur ». Une compétence ROUGE de Défi
// calcul n'est pas « à aider » dans la classe (elle reste dans la fiche).
// Le lundi, rien n'est rouge. AUCUN TEMPS PASSÉ n'est montré.
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, avec les VRAIS moteurs servis par le serveur (prof/*.js), sur de
// petites classes jouées par les moteurs eux-mêmes. Rien n'est demandé au
// serveur de plus qu'avant : la page relit les listes « tableau ».

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

// Le bloc du lot S2, d'un seul tenant dans le script.
const debutS2 = script.indexOf("// ------------------------------------------------ Suivre ses élèves, lot S2");
const finS2 = script.indexOf("// ------------------------------------------------ 📝 Les évaluations");
const blocS2 = script.slice(debutS2, finS2);

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
function constante(nom, source = script) {
  const position = source.indexOf(`const ${nom} = `);
  assert.ok(position >= 0, `la page doit définir ${nom}`);
  let i = position + `const ${nom} = `.length, profondeur = 0, dansTexte = "";
  for (; i < source.length; i += 1) {
    const c = source[i];
    if (dansTexte) { if (c === dansTexte && source[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return source.slice(position, i + 1);
}

// ------------------------------------------------------------ la page, rejouée

const SOURCES = ["jourPlus", "lundiDuJour", "joursEntre", "pluriel", "moteurSuivi", "suiviApp", "eleveDe", "elevesDeLaVue",
  "bilanEleve", "coupureDe", "jourCourtChiffres", "aiderDe", "feliciterDe", "texteLigne", "joursDeLaFiche", "seancesDeLAppli", "etatModulePalier",
  "nomDeLAppli", "nomCompetenceCalcul", "nomModuleCalcul"].map(n => fonction(n)).join("\n");
const CONSTANTES = ["APPLIS", "RANGS_AIDER", "JOURS_ABSENT", "memoSuivi"].map(n => constante(n)).join("\n");

// `listes` : {cle: [élèves lus]} — ce que la page a lu par « tableau ».
function pageRejouee(listes, aujourdhui) {
  return new Function("PARCOURS", "CALCUL", "CALCUL_CORE", "SPLAT", "COFFRES", "ANZAN", "tableaux", "AUJ",
    `let eleves = [];\n${CONSTANTES}\n${SOURCES}\nfunction applisDeLaVue() { return APPLIS.map(a => a.cle).filter(cle => tableaux[cle]); }\nfunction applisDuBilan() { return APPLIS.map(a => a.cle); }\nfunction aujourdhuiSuivi() { return AUJ; }\n`
    + "return {bilanEleve, texteLigne, joursDeLaFiche, seancesDeLAppli, etatModulePalier, suiviApp};")(
    T, D, DCORE, S, C, A, listes, aujourdhui);
}

// Un élève tel que la page le lit : sa ligne de « tableau » et son résumé.
const carte = DCORE.carte();
function lu(cle, id, prenom, parcours, aujourdhui) {
  const eleve = {id, prenom, initiale: "", maj_le: parcours ? `${aujourdhui}T10:00:00Z` : null, parcours: parcours || null, acces: {applis: []}};
  if (cle === "defi-calcul") eleve.lu = parcours ? D.resumeProf(parcours, carte, aujourdhui) : {lisible: true, commence: false};
  else eleve.lu = {lisible: true, commence: Boolean(parcours)};
  return eleve;
}

// Défi tables : des séances données [jour, [table, etapes, calculs, justes, test]].
function seancesT(paires, reglage = () => {}) {
  const p = T.creerParcours();
  p.seances = paires.map(([jour]) => jour);
  T.JOURNAL.forEach((champ, index) => { p.journal[champ] = paires.map(([, e]) => (index < e.length ? e[index] : -1)); });
  reglage(p);
  return T.normaliserParcours(p);
}
// Défi calcul : une séance jouée jusqu'au bout (comme tests/suivi-journaux-s1).
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
const seancesD = jours => jours.reduce((p, jour) => seanceD(p, jour), D.creerParcours());

const JEUDI = "2026-11-12";   // le lundi de sa semaine est le 9
const LUNDI_SUIVANT = "2026-11-16";

// ------------------------------------------------------------ l'absence, toutes applis

test("absent : rien depuis 7 jours TOUTES APPLIS confondues — une appli seule ne suffit pas à le dire ; jamais venu ; le lundi aussi", () => {
  const listes = {
    "defi-tables": [
      lu("defi-tables", 1, "Lina", seancesT([["2026-11-02", [4, 4, 6, 6, 0]], ["2026-11-03", [4, 4, 6, 6, 0]]]), JEUDI),
      lu("defi-tables", 2, "Louis", seancesT([["2026-11-03", [8, 4, 6, 6, 0]]]), JEUDI),
      lu("defi-tables", 3, "Rayan", null, JEUDI),
      lu("defi-tables", 4, "Inès", seancesT([["2026-11-05", [3, 4, 6, 6, 0]]]), JEUDI)
    ],
    "defi-calcul": [
      lu("defi-calcul", 1, "Lina", seancesD(["2026-11-10", "2026-11-11"]), JEUDI),
      lu("defi-calcul", 2, "Louis", seancesD(["2026-11-02"]), JEUDI),
      lu("defi-calcul", 3, "Rayan", null, JEUDI),
      lu("defi-calcul", 4, "Inès", null, JEUDI)
    ]
  };
  const p = pageRejouee(listes, JEUDI);
  const lina = p.bilanEleve(1, JEUDI);
  assert.equal(lina.absent, null, "Défi tables seul dirait « rien depuis 9 jours » : Défi calcul dit qu'elle travaille");
  assert.equal(lina.dernier, "2026-11-11");
  assert.deepEqual(lina.semaines.map(s => s.jours), [0, 0, 2, 2], "les jours de travail des 4 semaines, toutes applis");
  const louis = p.bilanEleve(2, JEUDI);
  assert.deepEqual(louis.absent, {jours: 9});
  assert.equal(louis.aider[0].genre, "absent");
  assert.equal(louis.aider[0].texte, "Rien depuis 9 jours, dans aucune appli");
  assert.ok(louis.aider[0].faire, "une phrase « que faire »");
  assert.deepEqual(p.bilanEleve(3, JEUDI).absent, {jamais: true});
  assert.equal(p.bilanEleve(3, JEUDI).aider[0].texte, "Jamais venu, dans aucune appli");
  assert.deepEqual(p.bilanEleve(4, JEUDI).absent, {jours: 7}, "7 jours pile : absent");
  // Le lundi : l'absence compte 7 jours, pas la semaine — elle reste (question 3).
  assert.equal(pageRejouee(listes, LUNDI_SUIVANT).bilanEleve(2, LUNDI_SUIVANT).aider[0].genre, "absent");
});

test("un même jour dans deux applis : un seul jour de travail ; ses séances, chacune une ligne", () => {
  const listes = {
    "defi-tables": [lu("defi-tables", 1, "Noah", seancesT([["2026-11-10", [4, 4, 10, 10, 0]], ["2026-11-10", [4, 3, 5, 4, 1]]]), JEUDI)],
    "defi-calcul": [lu("defi-calcul", 1, "Noah", seancesD(["2026-11-10"]), JEUDI)]
  };
  const p = pageRejouee(listes, JEUDI);
  const noah = p.bilanEleve(1, JEUDI);
  assert.deepEqual(noah.semaines.map(s => s.jours), [0, 0, 0, 1]);
  assert.deepEqual(noah.jours.get("2026-11-10"), ["defi-tables", "defi-calcul"], "les deux points du calendrier");
  const {jours} = p.joursDeLaFiche(1, JEUDI, 6);
  assert.deepEqual(jours.map(j => j.jour), ["2026-11-10"]);
  assert.deepEqual(jours[0].lignes.map(l => l.cle), ["defi-tables", "defi-tables", "defi-calcul"], "deux séances de Défi tables = deux lignes, dans l'ordre du catalogue");
});

// ------------------------------------------------------------ à aider, à féliciter

test("à aider : bloqué (Défi tables, 8 séances ou plus ; Défi calcul, mise de côté), aidé (SPLAT!, réponses vues) ; une rouge de Défi calcul reste « à revoir », dans la fiche seulement", () => {
  const kylian = seancesT([["2026-11-10", [2, 4, 6, 3, 2]]], p => { p.tables[2].seance = {depart: 3, n: 9, dernier: "2026-11-10"}; });
  let splat = S.creer();
  splat = S.enregistrerEnCours(splat, "m1e1", {sig: "a", idx: 2, etoiles: 1, res: [true, true], vues: 1, cartes: 4}, "2026-11-11");
  const listes = {
    "defi-tables": [lu("defi-tables", 1, "Kylian", kylian, JEUDI)],
    "splat": [lu("splat", 1, "Kylian", S.pourServeur(splat), JEUDI)]
  };
  const b = pageRejouee(listes, JEUDI).bilanEleve(1, JEUDI);
  assert.deepEqual(b.aider.map(a => [a.genre, a.appli, a.texte]), [
    ["bloque", "defi-tables", "table de 2 : 9 séances dessus"],
    ["aide", "splat", "1 réponse vue cette semaine"]]);
  assert.ok(b.aider.every(a => a.faire), "chacun sa phrase « que faire »");
  // La classe ne garde pas les rouges (question 1) ; la fiche, si.
  const cartes = fonction("dessinerCartesClasse");
  assert.match(cartes, /const raisons = b\.aider\.filter\(raison => raison\.genre !== "revoir"\);/);
  assert.doesNotMatch(fonction("contenuEnsemble"), /genre !== "revoir"/, "la fiche montre tout");
  assert.match(fonction("aiderDe"), /ajouter\("revoir", cle,/);
  assert.match(fonction("aiderDe"), /ajouter\("bloque", cle, `\$\{nom\}\$\{plus\} mise/, "une mise de côté : bloqué");
  // 6 lignes au plus, les absents d'abord.
  assert.match(constante("LIGNES_CARTE"), /= 6;/);
  assert.match(constante("RANGS_AIDER"), /\{absent: 0, bloque: 1, revoir: 2, aide: 3\}/);
  assert.match(cartes, /aider\.sort\(\(p, q\) => p\.raison\.rang - q\.raison\.rang\);/);
});

test("à féliciter : une table passée cette semaine ; le lundi, aussi celles de la semaine d'avant (question 2)", () => {
  const passee = jour => seancesT([["2026-11-10", [5, 4, 6, 6, 1]]], p => { p.tables[5].acquise = jour; });
  const jeudi = pageRejouee({"defi-tables": [lu("defi-tables", 1, "Sarah", passee("2026-11-10"), JEUDI)]}, JEUDI);
  assert.deepEqual(jeudi.bilanEleve(1, JEUDI).feliciter.map(f => f.texte), ["table de 5 passée"]);
  const lundi = pageRejouee({"defi-tables": [lu("defi-tables", 1, "Sarah", passee("2026-11-10"), LUNDI_SUIVANT)]}, LUNDI_SUIVANT);
  assert.deepEqual(lundi.bilanEleve(1, LUNDI_SUIVANT).feliciter.map(f => f.texte), ["table de 5 passée"], "le lundi : la semaine d'avant");
  const mardi = pageRejouee({"defi-tables": [lu("defi-tables", 1, "Sarah", passee("2026-11-10"), "2026-11-17")]}, "2026-11-17");
  assert.deepEqual(mardi.bilanEleve(1, "2026-11-17").feliciter, [], "le mardi : la semaine en cours seulement");
  assert.match(fonction("dessinerCartesClasse"), /lundi \? "Ce qui a été gagné la semaine dernière, et aujourd’hui\." : "Ce qui a été gagné cette semaine\."/);
});

// ------------------------------------------------------------ jamais un temps passé

test("aucun temps passé : resumeSuivi ne rend pas les minutes de Défi calcul, et rien dans le bloc S2 n'écrit une durée", () => {
  const p = seancesD(["2026-11-10", "2026-11-11"]);
  const listes = {"defi-calcul": [lu("defi-calcul", 1, "Tom", p, JEUDI)]};
  const page2 = pageRejouee(listes, JEUDI);
  const {seances} = page2.seancesDeLAppli("defi-calcul", listes["defi-calcul"][0], 10);
  assert.equal(seances.length, 2);
  seances.forEach(s => assert.equal("minutes" in s.ligne, false, "pas de minutes"));
  const tous = page2.joursDeLaFiche(1, JEUDI, 10).jours.flatMap(j => j.lignes);
  tous.forEach(({cle, ligne}) => page2.texteLigne(cle, ligne).slice(0, 2).forEach(t => assert.doesNotMatch(t, /\bmin\b|minute|durée|\bh\b/)));
  assert.doesNotMatch(blocS2, /minutes|\.journal\b|noterTemps|duree|durée\b(?! d)/, "le bloc S2 ne lit aucun temps");
  assert.doesNotMatch(fonction("contenuCalcul"), /minutes|Durée/);
});

test("« Ce qu'il a fait » : une phrase par appli, des nombres seulement (null : pas connu) ; « juste » au singulier", () => {
  const p = pageRejouee({}, JEUDI);
  assert.deepEqual(p.texteLigne("defi-tables", {table: 4, etapes: 4, calculs: 10, justes: 9, test: 1}), ["table de 4 · test réussi ✓", "calculs du jour 9/10", false]);
  assert.deepEqual(p.texteLigne("defi-tables", {table: 0, etapes: 1, calculs: 3, justes: 1, test: 0}), ["révisions", "calculs du jour 1/3", true]);
  assert.deepEqual(p.texteLigne("defi-tables", {table: null, etapes: null, calculs: null, justes: null, test: null}), ["une séance", "", false], "une séance d'avant le lot S1");
  assert.deepEqual(p.texteLigne("defi-calcul", {calculs: 6, justes: 5, nouveautes: 1, prouvees: 0, rouges: 1}), ["1 nouveauté réussie", "calculs du jour 5/6", false]);
  assert.deepEqual(p.texteLigne("defi-calcul", {calculs: 3, justes: 2, nouveautes: 0, prouvees: 0, rouges: 0}), ["révisions seulement", "calculs du jour 2/3", false]);
  assert.deepEqual(p.texteLigne("flash-anzan", {mode: "flash", calculs: 10, justes: 8, prevus: 10, grade: 0}), ["Flash", "8/10 justes", false]);
  assert.deepEqual(p.texteLigne("flash-anzan", {mode: "colonne", calculs: 2, justes: 1, prevus: 10, grade: 0}), ["Colonne", "1/2 juste", false]);
  assert.deepEqual(p.texteLigne("splat", {series: 2, reussies: 1, vues: 1}), ["2 séries · 1 étape réussie", "1 réponse vue", false]);
  assert.deepEqual(p.texteLigne("coffres", {tresors: 2, parfaits: 1, aides: 0, solutions: 0}), ["2 trésors · 1 parfait", "", false]);
});

test("« Voir les jours précédents » : 4 semaines par 4 semaines, du plus récent au plus ancien ; plus rien : plus de bouton", () => {
  const jours = Array.from({length: 20}, (_, i) => T.ajouterJours("2026-08-31", i * 4));  // un jour sur 4, depuis fin août
  const p = pageRejouee({"defi-tables": [lu("defi-tables", 1, "Léa", seancesT(jours.map(j => [j, [6, 4, 5, 5, 0]])), JEUDI)]}, JEUDI);
  const six = p.joursDeLaFiche(1, JEUDI, 6);
  assert.equal(six.jours.length, 6);
  assert.equal(six.encore, true);
  const tout = p.joursDeLaFiche(1, JEUDI, 100);
  assert.deepEqual(tout.jours.map(j => j.jour), jours.filter(j => j <= JEUDI).reverse(), "tous les jours, du plus récent au plus ancien");
  assert.equal(tout.encore, false);
  assert.equal(p.joursDeLaFiche(1, JEUDI, tout.jours.length).encore, false, "juste assez : pas de bouton");
});

test("Où en est la classe : l'état d'un module pour un palier — à revoir, su, en route, pas commencé", () => {
  const p = pageRejouee({}, JEUDI);
  const lu2 = etats => ({commence: true, modules: [{id: "M", paliers: [1, 1, 2], etats}]});
  assert.equal(p.etatModulePalier(lu2(["su", "su", "gris"]), "M", 1), "su");
  assert.equal(p.etatModulePalier(lu2(["su", "route", "gris"]), "M", 1), "route");
  assert.equal(p.etatModulePalier(lu2(["su", "classe", "gris"]), "M", 1), "revoir");
  assert.equal(p.etatModulePalier(lu2(["su", "su", "gris"]), "M", 2), "gris", "le palier 2 n'est pas commencé");
  assert.equal(p.etatModulePalier({commence: false}, "M", 1), "gris");
  assert.equal(p.etatModulePalier(lu2(["su", "su", "su"]), "AUTRE", 1), "gris");
});

// ------------------------------------------------------------ la page : ce qui se voit

test("« La classe » : le premier onglet, à gauche, toujours visible ; sa vue ; une classe s'ouvre dessus", () => {
  const barre = page.slice(page.indexOf('<div class="barre-onglets" id="onglets">'), page.indexOf('<div class="onglets" id="choix-appli"'));
  assert.match(barre, /<div class="onglets onglets-vue" role="group" aria-label="Toutes les applis">\s*<button type="button" id="onglet-classe" aria-pressed="false">/);
  assert.ok(barre.indexOf('id="onglet-classe"') < barre.indexOf('id="choix-appli-menu"'), "avant les applis et leur sélecteur");
  assert.match(page, /<div id="vue-classe" hidden>[\s\S]*id="lc-aider"[\s\S]*id="lc-feliciter"[\s\S]*<table id="lc-tableau">/);
  assert.ok(page.indexOf('id="vue-classe"') < page.indexOf('<div id="vue-appli">'));
  assert.match(fonction("poserVue"), /\$\("vue-classe"\)\.hidden = vue !== "classe";/);
  assert.match(fonction("ouvrirLaClasse"), /vue = "classe";\s*retenirChoixAppli\("classe"\);/);
  assert.match(fonction("ouvrirClasse"), /: \(\["", "classe"\]\.includes\(lireChoixAppli\(\)\) \? "classe" : "appli"\);/, "une classe s'ouvre sur « La classe » (ou l'appli regardée la dernière fois)");
  assert.match(script, /\$\("onglet-classe"\)\.addEventListener\("click", \(\) => \{ remonterALaBarre\(\); ouvrirLaClasse\(\); \}\);/);
  assert.match(style, /\.barre-onglets > \.onglets-vue \{ flex: none; overflow: visible;/, "il ne défile pas avec les applis");
});

test("la fiche : la même taille pour tous ses onglets ; ses onglets ; elle s'ouvre sur l'appli d'où l'on vient", () => {
  assert.match(style, /dialog\.fenetre-eleve \{ max-width: 1080px; height: calc\(100vh - 32px\); \}/);
  assert.match(page, /<div class="onglets fe-onglets" id="fe-onglets" role="tablist" aria-label="La fiche"><\/div>/);
  assert.match(fonction("ouvrirFenetreEleve"), /ongletFiche = onglet \|\| \(vue === "classe" \? "ensemble" : appliAffichee\);/);
  assert.match(fonction("dessinerOngletsFiche"), /bouton\.setAttribute\("role", "tab"\);\s*bouton\.setAttribute\("aria-selected", String\(cle === ongletFiche\)\);/);
  assert.match(fonction("ongletsDeLaFiche"), /return \["ensemble"\]\.concat/);
});

test("Défi calcul : le bouton « mode professeur », en haut de son onglet, à côté de « Régler » ; ses deux cartes ; le lundi sans rouge", () => {
  assert.match(page, /<a class="bouton secondaire" id="dc-mode-prof" href="https:\/\/mathsgo\.re\/outils\/calcul_mental\/defi_calcul_modules\.html\?prof=1" target="_blank" rel="noopener"[^>]*hidden>/);
  const qui = page.slice(page.indexOf('<div class="qui-voit" id="qui-voit" hidden>'), page.indexOf('id="regler-appli"'));
  assert.ok(qui.includes('id="dc-mode-prof"'), "sur la ligne « qui voit », avant « Régler »");
  assert.match(fonction("poserQuiVoit"), /\$\("dc-mode-prof"\)\.hidden = cle !== "defi-calcul";/);
  assert.match(style, /\.qui-voit a\.bouton \.mot \{ display: none; \}/, "au téléphone, le dessin seul, comme « Régler »");
  assert.match(page, /<details class="carte dc-ouest" id="dc-ouest" hidden>\s*<summary class="dc-tete">/, "repliable : repliée au téléphone au départ");
  assert.match(fonction("dessinerOuEnEst"), /bloc\.open = !\(window\.matchMedia && window\.matchMedia\("\(max-width: 700px\)"\)\.matches\);/);
  assert.match(page, /<div class="carte dc-qui" id="dc-qui" hidden>/);
  assert.match(fonction("dessinerTableauCalcul"), /dessinerOuEnEst\(\);\s*dessinerQuiSentraine\(\);/);
  assert.match(fonction("dessinerQuiSentraine"), /if \(aujourdhui !== lundi\) \{/, "le lundi, pas de « pas venus cette semaine »");
  assert.match(fonction("dessinerTableauCalcul"), /else if \(seances\.quatreSemaines && aujourdhuiSuivi\(\) !== lundiDuJour\(aujourdhuiSuivi\(\)\)\) \{/, "le lundi, pas de « rien cette semaine » en rouge");
  assert.match(style, /\.dc-ouest-pop \{ position: absolute;/, "la liste d'une barre s'ouvre PAR-DESSUS : rien ne descend");
  assert.doesNotMatch(fonction("contenuCalcul"), /Sa semaine|dc-comp \$\{etat\}/, "plus de 95 étiquettes ni de « Sa semaine » (la Vue d'ensemble l'a)");
});

// ------------------------------------------------------------ et un pirate ?

test("rien d'un élève ne devient du HTML : textContent partout ; le seul innerHTML pose les dessins des applis, des constantes", () => {
  const avecInner = [...blocS2.matchAll(/innerHTML/g)];
  assert.equal(avecInner.length, 1);
  assert.match(blocS2, /icone\.innerHTML = ICONES_APPLIS\[cle\] \|\| "";/);
  assert.doesNotMatch(blocS2, /insertAdjacentHTML|outerHTML|document\.write/);
  // Les dessins : ceux de Mon espace, recopiés tels quels.
  const espace = lire("_serveur/public/index.php");
  // Le bloc ICONES seul, jusqu'à son « }; » : les apostrophes des commentaires
  // (« l'inconnue ») tromperaient constante() sur la suite de la page.
  const debutIcones = espace.indexOf("const ICONES = {");
  const blocIcones = espace.slice(debutIcones, espace.indexOf("\n  };", debutIcones) + "\n  };".length);
  const ICONES = new Function(`${blocIcones}\nreturn ICONES;`)();
  const ICONES_APPLIS = new Function(`${constante("ICONES_APPLIS")}\nreturn ICONES_APPLIS;`)();
  const corps = svg => svg.replace(/^<svg[^>]*>/, "");
  for (const cle of Object.keys(ICONES_APPLIS)) assert.equal(corps(ICONES_APPLIS[cle]), corps(ICONES[cle]), cle);
  // Aucun code d'élève hors de l'onglet Élèves.
  assert.doesNotMatch(blocS2, /\.code\b|celluleCode/);
  // Les prénoms partent avec la classe et à la déconnexion.
  const zones = constante("ZONES_TEXTE");
  for (const id of ["lc-aider-liste", "lc-aider-plus", "lc-feliciter-liste", "lc-feliciter-plus", "lc-corps", "fe-onglets", "dc-ouest-pop", "dc-qui-texte"]) {
    assert.ok(zones.includes(`"${id}"`), id);
  }
  assert.match(constante("BLOCS_A_CACHER"), /"vue-classe", "dc-ouest", "dc-qui", "dc-ouest-pop"/);
  // Rien de nouveau demandé au serveur : seulement « tableau ».
  assert.deepEqual([...new Set([...blocS2.matchAll(/api\("([\w.]+)"/g)].map(m => m[1]))], ["tableau"]);
});

test("un nom de fonction n'est défini qu'une fois (le second masquerait le premier, en silence)", () => {
  const noms = [...script.matchAll(/^\s*(?:async )?function ([\wÀ-ÿ]+)\(/gm)].map(m => m[1]);
  const doubles = noms.filter((n, i) => noms.indexOf(n) !== i);
  assert.deepEqual(doubles, []);
});
