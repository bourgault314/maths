// « Suivre ses élèves », lot « la semaine précédente » (choix de Gwenaël du
// 14/11/2026, qui revient sur celui du 08/11) : dans l'onglet « La classe »
// de Ma classe, la colonne des 7 jours a deux flèches ‹ › pour regarder les
// semaines passées.
//   1. ‹ recule d'une semaine, › avance ; jamais après la semaine en cours ;
//   2. ‹ s'arrête quand plus aucun élève de la classe n'a de travail connu
//      avant (ce que gardent les applis : 60 séances, 60 jours, 500 séances
//      d'Anzan), et jamais avant le 1er août de l'année scolaire ;
//   3. une semaine passée : « Semaine du 2 nov. », ni case du jour, ni jours
//      à venir ;
//   4. « À aider », « À féliciter », les 4 semaines, les applis, « Dernière
//      fois » et le tri restent ceux d'aujourd'hui ;
//   5. rien n'est gardé : recharger, rouvrir l'onglet, une autre classe,
//      se déconnecter → la semaine en cours ;
//   6. rien ne bouge : flèches toujours là (grisées au bout), titre sur deux
//      lignes sous 1000 px dans les deux cas (contrôlé à l'écran par
//      outils/largeurs.cjs et outils/doigt.cjs ; ici, les règles).
// Chaque test rejoue les fonctions de la page telles qu'elles y sont écrites,
// avec les VRAIS moteurs servis par le serveur.
//
// Sabotages attendus (chacun rend un test rouge) : voir
// lot-semaine-precedente/outils/sabotages-semaine.py.

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

// Un document de poche : assez pour les cases et le titre de la colonne.
function noeud(balise) {
  const n = {balise, className: "", enfants: [], attributs: {}, dataset: {}, ecouteurs: {}, disabled: false, _texte: ""};
  Object.defineProperty(n, "textContent", {get: () => n._texte + n.enfants.map(e => e.textContent).join(""), set: v => { n._texte = String(v); n.enfants = []; }});
  n.append = (...x) => x.forEach(e => n.enfants.push(typeof e === "string" ? {textContent: e} : e));
  n.setAttribute = (k, v) => { n.attributs[k] = String(v); };
  n.addEventListener = (k, f) => { n.ecouteurs[k] = f; };
  n.classList = {add: c => { n.className += ` ${c}`; }};
  return n;
}
const documentDePoche = {createElement: noeud, createElementNS: (_, b) => noeud(b), createTextNode: t => ({textContent: t})};

const SOURCES = ["jourPlus", "lundiDuJour", "joursEntre", "pluriel", "moteurSuivi", "suiviApp", "eleveDe", "elevesDeLaVue",
  "applisDuBilan", "listesManquantes", "bilanEleve", "coupureDe", "compteSemaine", "enJoursSemaine", "jourCourtChiffres",
  "aiderDe", "feliciterDe", "nomDeLAppli", "nomCompetenceCalcul", "nomModuleCalcul",
  "plancherDeLAnnee", "lundiEnClair", "travailAvant", "semaineDeLaVue", "changerSemaineClasse", "titreSemaineClasse",
  "caseSemaine", "celluleSemaineClasse", "el"].map(n => fonction(n)).join("\n");
const CONSTANTES = ["APPLIS", "RANGS_AIDER", "JOURS_ABSENT", "memoSuivi", "JOURS_SEMAINE"].map(constante).join("\n");

function pageRejouee(listes, aujourdhui) {
  const journal = [];
  const p = new Function("PARCOURS", "CALCUL", "CALCUL_CORE", "SPLAT", "COFFRES", "ANZAN", "tableaux", "AUJ", "classe", "document", "journal",
    `let eleves = [];\nlet semaineClasse = 0, focusSemaine = "";\nconst redessin = {demander() { journal.push("redessin"); }};\n${CONSTANTES}\n${SOURCES}\nfunction aujourdhuiSuivi() { return AUJ; }\n`
    + "return {bilanEleve, semaineDeLaVue, travailAvant, plancherDeLAnnee, lundiEnClair, changerSemaineClasse, titreSemaineClasse, celluleSemaineClasse,"
    + " semaine: () => semaineClasse, poser: n => { semaineClasse = n; }, focus: () => focusSemaine};")(
    T, D, DCORE, S, C, A, listes, aujourdhui, {id: 1, applis: ["defi-tables"]}, documentDePoche, journal);
  return Object.assign(p, {journal});
}
function lu(id, parcours, aujourdhui) {
  return {id, prenom: `É${id}`, initiale: "", maj_le: parcours ? `${aujourdhui}T10:00:00Z` : null, parcours: parcours || null, acces: {applis: []},
    lu: {lisible: true, commence: Boolean(parcours)}};
}
function seancesT(jours) {
  const p = T.creerParcours();
  p.seances = jours.slice();
  T.JOURNAL.forEach((champ, index) => { p.journal[champ] = jours.map(() => [4, 4, 6, 6, 0][index] ?? -1); });
  return T.normaliserParcours(p);
}
const cases = cellule => cellule.enfants.map(c => c.className.trim());
const texte = n => n.textContent.replace(/\s+/g, " ").trim();

// Jeudi 12 novembre 2026 : semaine du 9 ; la précédente, celle du 2.
const JEUDI = "2026-11-12";

test("‹ : la semaine du 2 nov., lue au dimanche 8 ; ✓ aux bons jours ; ni case du jour, ni jours à venir", () => {
  // Mardi 3 et jeudi 5 (semaine d'avant), et lundi 9 (cette semaine).
  const listes = {"defi-tables": [lu(1, seancesT(["2026-11-03", "2026-11-05", "2026-11-09"]), JEUDI), lu(2, null, JEUDI)]};
  const p = pageRejouee(listes, JEUDI);
  const liste = listes["defi-tables"];
  const bilans = new Map(liste.map(e => [e.id, p.bilanEleve(e.id, JEUDI)]));
  // La semaine en cours : les bilans d'aujourd'hui, tels quels.
  const maintenant = p.semaineDeLaVue(liste, bilans, JEUDI, false);
  assert.equal(maintenant.lundi, "2026-11-09");
  assert.equal(maintenant.bilans, bilans, "la semaine en cours lit les bilans d'aujourd'hui");
  assert.equal(maintenant.avant, true, "du travail la semaine d'avant : ‹ est allumée");
  const cetteSemaine = p.celluleSemaineClasse(bilans.get(1), JEUDI, maintenant.lundi);
  assert.deepEqual(cases(cetteSemaine), ["lc-jour ok", "lc-jour rien", "lc-jour rien", "lc-jour rien aujourdhui", "lc-jour futur", "lc-jour futur", "lc-jour futur"]);
  // ‹ : une semaine en arrière.
  p.changerSemaineClasse(1);
  assert.equal(p.semaine(), 1);
  assert.deepEqual(p.journal, ["redessin"], "le changement redessine la page");
  assert.equal(p.focus(), "avant", "le clavier reste sur ‹");
  const passee = p.semaineDeLaVue(liste, bilans, JEUDI, false);
  assert.equal(passee.lundi, "2026-11-02");
  assert.notEqual(passee.bilans, bilans);
  assert.equal(passee.bilans.get(1).aujourdhui, "2026-11-08", "chaque élève est vu au dimanche de cette semaine-là");
  const cellule = p.celluleSemaineClasse(passee.bilans.get(1), JEUDI, passee.lundi);
  assert.deepEqual(cases(cellule), ["lc-jour rien", "lc-jour ok", "lc-jour rien", "lc-jour ok", "lc-jour rien", "lc-jour rien", "lc-jour rien"],
    "mardi et jeudi cochés ; ni case du jour, ni pointillés");
  assert.equal(cellule.attributs["aria-label"], "Semaine du 2 nov. : mardi, jeudi");
  assert.equal(p.celluleSemaineClasse(passee.bilans.get(2), JEUDI, passee.lundi).attributs["aria-label"], "Semaine du 2 nov. : rien");
  // › : retour, jamais après la semaine en cours.
  p.changerSemaineClasse(-1);
  p.changerSemaineClasse(-1);
  assert.equal(p.semaine(), 0, "› ne va jamais après la semaine en cours");
  assert.equal(p.focus(), "apres");
});

test("le titre : ‹ « Cette semaine » › puis ‹ « Semaine du 2 nov. » › ; › grisée sur la semaine en cours, ‹ grisée au bout, les deux toujours là", () => {
  const p = pageRejouee({}, JEUDI);
  const titre = (semaine, enLecture = false) => {
    const th = p.titreSemaineClasse(semaine, enLecture);
    const [avant, mots, apres] = th.enfants[0].enfants;
    return {avant, apres, mots: texte(mots), lignes: mots.enfants.filter(e => e.balise === "span").map(e => e.textContent)};
  };
  const a = titre({lundi: "2026-11-09", decalage: 0, avant: true});
  assert.deepEqual(a.lignes, ["Cette", "semaine"]);
  assert.equal(a.avant.disabled, false);
  assert.equal(a.apres.disabled, true, "› grisée sur la semaine en cours");
  assert.equal(a.avant.attributs["aria-label"], "Semaine précédente");
  const b = titre({lundi: "2026-11-02", decalage: 1, avant: false});
  assert.deepEqual(b.lignes, ["Semaine du", "2 nov."]);
  assert.equal(b.avant.disabled, true, "‹ grisée au bout");
  assert.equal(b.apres.disabled, false);
  const c = titre({lundi: "2026-11-02", decalage: 1, avant: true}, true);
  assert.ok(c.avant.disabled && c.apres.disabled, "pendant la lecture des applis, rien ne se touche");
  // Les flèches se touchent : ‹ recule, › avance.
  b.apres.ecouteurs.click();
  assert.equal(p.semaine(), 0);
  // Les dates : « 9 nov. », « 1er févr. », insécables.
  assert.equal(p.lundiEnClair("2026-11-09"), "9 nov.");
  assert.equal(p.lundiEnClair("2027-02-01"), "1er févr.");
  assert.equal(p.lundiEnClair("2026-09-28"), "28 sept.");
});

test("‹ s'arrête au bout de ce qui est gardé : un travail de 5 semaines plus tôt se rejoint, au-delà plus rien ; jamais avant le 1er août", () => {
  // Seule séance : le 7 octobre (semaine du 5 oct., 5 semaines avant celle du 9 nov.).
  const listes = {"defi-tables": [lu(1, seancesT(["2026-10-07"]), JEUDI), lu(2, null, JEUDI)]};
  const p = pageRejouee(listes, JEUDI);
  const liste = listes["defi-tables"];
  const bilans = new Map(liste.map(e => [e.id, p.bilanEleve(e.id, JEUDI)]));
  assert.equal([...bilans.get(1).jours.keys()].length, 0, "les 4 semaines d'aujourd'hui ne le voient pas");
  for (let k = 0; k <= 4; k += 1) {
    p.poser(k);
    assert.equal(p.semaineDeLaVue(liste, bilans, JEUDI, false).avant, true, `${k} semaine(s) en arrière : on peut encore reculer`);
  }
  p.poser(5);
  const bout = p.semaineDeLaVue(liste, bilans, JEUDI, false);
  assert.equal(bout.lundi, "2026-10-05");
  assert.ok(bout.bilans.get(1).jours.has("2026-10-07"), "la semaine du 5 oct. montre la séance du 7");
  assert.equal(bout.avant, false, "plus rien avant : ‹ grisée");
  // Le 1er août : rien de l'année d'avant (le serveur efface les classes ce jour-là).
  assert.equal(p.plancherDeLAnnee(JEUDI), "2026-08-01");
  assert.equal(p.plancherDeLAnnee("2027-07-15"), "2026-08-01");
  assert.equal(p.plancherDeLAnnee("2027-08-01"), "2027-08-01");
  const vieux = {"defi-tables": [lu(1, seancesT(["2026-07-20", "2026-08-03"]), JEUDI)]};
  const pv = pageRejouee(vieux, JEUDI);
  const lv = vieux["defi-tables"];
  const bv = new Map(lv.map(e => [e.id, pv.bilanEleve(e.id, JEUDI)]));
  assert.equal(pv.semaineDeLaVue(lv, bv, JEUDI, false).avant, true, "du 9 nov., on remonte jusqu'au 3 août");
  pv.poser(13);
  const aout10 = pv.semaineDeLaVue(lv, bv, JEUDI, false);
  assert.equal(aout10.lundi, "2026-08-10");
  assert.equal(aout10.avant, true, "le 3 août compte");
  pv.poser(14);
  const aout3 = pv.semaineDeLaVue(lv, bv, JEUDI, false);
  assert.equal(aout3.lundi, "2026-08-03");
  assert.equal(aout3.avant, false, "le 20 juillet, de l'année d'avant, ne compte pas");
  assert.equal(pv.travailAvant("2026-08-03", lv, new Map([[1, pv.bilanEleve(1, "2026-08-09")]]), JEUDI), false);
  // Une classe sans aucun travail : ‹ grisée dès la semaine en cours.
  const vide = {"defi-tables": [lu(1, null, JEUDI)]};
  const pz = pageRejouee(vide, JEUDI);
  assert.equal(pz.semaineDeLaVue(vide["defi-tables"], new Map([[1, pz.bilanEleve(1, JEUDI)]]), JEUDI, false).avant, false);
  // Pendant la lecture des applis : rien ne se calcule, ‹ éteinte.
  assert.equal(p.semaineDeLaVue(liste, new Map(), JEUDI, true).avant, false);
});

test("les cartes, les 4 semaines, les applis, « Dernière fois » et le tri restent ceux d'aujourd'hui", () => {
  const dessin = fonction("dessinerLaClasse");
  assert.match(dessin, /dessinerCartesClasse\(liste, bilans, enLecture\);/, "les cartes lisent les bilans d'aujourd'hui");
  assert.match(dessin, /dessinerTableauClasse\(liste, bilans, applis, aujourdhui, enLecture, semaineDeLaVue\(liste, bilans, aujourdhui, enLecture\)\);/);
  assert.match(dessin, /b\.semaines\[3\]\.jours > 0/, "« N au travail cette semaine » : la semaine en cours");
  const tableau = fonction("dessinerTableauClasse");
  assert.match(tableau, /const b = bilans\.get\(eleve\.id\);/, "la ligne lit le bilan d'aujourd'hui");
  assert.match(tableau, /celluleSemaineClasse\(vue7\.bilans\.get\(eleve\.id\), aujourdhui, vue7\.lundi\)/, "seuls les 7 jours suivent la flèche");
  assert.match(tableau, /celluleQuatreSemaines\(b\)/);
  assert.match(tableau, /b && b\.dernier \? jourCourtCalcul\(b\.dernier\)/);
  assert.match(tableau, /const b = bilans\.get\(eleve\.id\);\s*if \(!b\) return -1;/, "le tri lit les bilans d'aujourd'hui");
  assert.match(fonction("dessinerCartesClasse"), /const lundi = aujourdhuiSuivi\(\) === lundiDuJour\(aujourdhuiSuivi\(\)\);/);
});

test("rien n'est gardé : recharger, rouvrir l'onglet, une autre classe, se déconnecter → la semaine en cours", () => {
  assert.match(script, /let semaineClasse = 0;/, "au chargement : la semaine en cours");
  assert.match(fonction("ouvrirLaClasse"), /semaineClasse = 0;/);
  assert.match(fonction("ouvrirClasse"), /if \(!memeClasse\) semaineClasse = 0;/);
  assert.match(fonction("oublierEtat"), /semaineClasse = 0;/);
  for (const nom of ["semaineDeLaVue", "changerSemaineClasse", "titreSemaineClasse", "travailAvant"]) {
    assert.doesNotMatch(fonction(nom), /localStorage|sessionStorage|location|history|retenir/, `${nom} ne garde rien`);
  }
  assert.doesNotMatch(fonction("titreSemaineClasse"), /innerHTML/, "le chevron est dessiné nœud par nœud");
});

test("rien ne bouge : flèches de taille fixe, grisées sans disparaître ; deux lignes sous 1000 px dans les deux cas ; une ligne au-dessus", () => {
  assert.match(style, /#lc-tableau th \.lc-fleche-semaine \{ flex: none; display: inline-grid; place-items: center; width: 24px; height: 24px;/);
  assert.match(style, /#lc-tableau th \.lc-fleche-semaine:disabled \{[^}]*opacity: \.55;/);
  assert.doesNotMatch(style, /\.lc-fleche-semaine:disabled \{[^}]*(display: none|visibility: hidden)/, "grisée, jamais cachée");
  assert.match(style, /\.lc-titre-semaine \{ flex: 1; min-width: 0; text-align: center; white-space: nowrap; \}/);
  assert.match(style, /@media \(max-width: 999px\) \{\s*\.lc-titre-semaine > span \{ display: block; \}\s*#lc-tableau th \.lc-fleche-semaine \{ width: 26px; height: 34px; \}/);
  assert.match(style, /@media \(min-width: 1000px\) \{[^}]*\.lc-nav-semaine \{ margin: -3px 0; \}/);
});
