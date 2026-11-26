// Défi calcul, lot K1 « la carte chez l'élève » — passe 1 : le FORMAT de la
// version 12 et ce qui tient autour (25/11/2026). Ce fichier reprend, dans le
// format d'aujourd'hui, ce que vérifiaient les tests des formats d'avant
// (defi-calcul-mon-parcours, journal-g1, lot-4-ceintures, lot-F4…) et qui
// reste vrai : la forme exacte de ce qui est enregistré, la référence et ce
// que le serveur déclare, les bornes au pire cas, le rangement par code, le
// journal des séances et sa fusion, la semaine de l'élève, ce que J'apprends
// enregistre avec les règles de l'écran. Les règles de la carte ont leur
// fichier : defi-calcul-lot-K1-carte.test.mjs.

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

import {CLES_DECLAREES, parcoursComplet} from "../scripts/generer-parcours-reference-defi-calcul.mjs";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// Mercredi 11 novembre 2026 ; le lundi de sa semaine est le 9.
const MERCREDI = "2026-11-11";
const LUNDI = "2026-11-09";
const plus = (jour, n) => P.ajouterJours(jour, n);
const o = (jour, seance = true) => ({aujourdhui: jour, carte: CARTE, seance});
const justes = () => Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const lecon = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const tenter = (p, module, niveau, jour, seance = true) => P.appliquerTentative(p, {module, niveau, reponses: justes()}, o(jour, seance)).parcours;

function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    cles: () => [...m.keys()],
    brut: k => m.get(k)
  };
}

// Une séance jouée et finie le jour `jour` : ses calculs du jour, puis une
// étoile gagnée par « Je tente » si `etoile` est donnée.
function seance(p, jour, {alea = .5, secondes = 120, juste = () => true, etoile = null} = {}) {
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, alea});
  P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour, maximum: 999}).forEach(c => {
    let r = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: juste(c), ms: 1500, type: "P"}, {aujourdhui: jour});
    if (r.mouvement.secondAVenir) r = P.appliquerRetour(r.parcours, {module: c.module, niveau: c.niveau, juste: juste(c), ms: 1500, type: "P"}, {aujourdhui: jour});
    p = r.parcours;
  });
  p = P.noterTemps(p, secondes);
  p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
  if (etoile) p = tenter(p, etoile[0], etoile[1], jour);
  return P.seanceOuverte(p, jour) ? P.fermerSeance(p, CARTE, {aujourdhui: jour, force: true}).parcours : p;
}

// ------------------------------------------------------------ le format

test("le format : version 12, rien d'autre que ce que le moteur décrit", () => {
  assert.deepEqual(P.creerParcours(), {
    version: 12, epoque: 0, prenom: "", modules: {},
    // (Correctif K1 : `parts`, ce que chaque onglet a fait dans la séance ouverte ; `j` en est la somme.)
    seance: {jour: null, etape: 0, n: 0, i: 0, g: 0, p: [0, 0, 0, 0, 0], j: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], parts: []},
    seances: [],
    journal: {calculs: [], justes: [], nouveautes: [], prouvees: [], rouges: [], minutes: [], numero: [], seuls: [], seulsJustes: [], tests: [], testsRates: []},
    jours: [], ceintures: [null, null, null, null], paliers: [null, null, null, null], quarts: [0, 0, 0, 0]
  });
  assert.deepEqual(P.PLAN, {ouverte: 0, minutes: 1, obligatoire: 2, paquet: 3, commences: 4});
  assert.deepEqual(P.JOURNAL, ["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes", "numero", "seuls", "seulsJustes", "tests", "testsRates"]);
  const p = tenter(P.creerParcours(), "A1", 1, MERCREDI, false);
  assert.deepEqual(Object.keys(p.modules), ["A1"]);
  assert.deepEqual(p.modules.A1, {vu: MERCREDI, b: [2, 0, 0], e: [plus(MERCREDI, 1), null, null], a: [0, 0, 0], x: [0, 0, 0], r: [0, 0, 0], q: [null, null, null],
    pe: [0, 0, 0], d: [MERCREDI, null, null], s: [null, null, null], ar: [0, 0, 0], g: [1, 0, 0], c: {}});
  // Un module qui entre prend sa place dans l'ordre des codes : le même parcours s'écrit toujours avec le même JSON.
  const q = tenter(tenter(P.creerParcours(), "M1", 1, MERCREDI, false), "A1", 1, MERCREDI, false);
  assert.deepEqual(Object.keys(q.modules), ["A1", "M1"]);
  // Les 74 codes et leurs niveaux sont ceux du noyau.
  assert.deepEqual(P.CODES, CORE.MODULES.map(fiche => fiche.id));
  CORE.MODULES.forEach(fiche => assert.equal(P.NIVEAUX[fiche.id], fiche.niveaux.length, fiche.id));
});

test("normaliserParcours : idempotente, et sourde à ce qu'elle ne connaît pas", () => {
  const complet = parcoursComplet();
  assert.equal(complet.version, 12);
  assert.deepEqual(P.normaliserParcours(complet, {aujourdhui: "2026-11-25"}), complet);
  const bruit = JSON.parse(JSON.stringify(complet));
  Object.assign(bruit, {inconnu: 1, texte: "trop dur", reponses: [73]});
  Object.assign(bruit.modules.A1, {ok: "2026-10-01", f: [1, 1, 1], t: [1, 1, 1], l: [1, 1, 1], note: "x"});
  bruit.modules.ZZ9 = bruit.modules.A1;
  bruit.seance.commentaire = "x";
  assert.deepEqual(P.normaliserParcours(bruit, {aujourdhui: "2026-11-25"}), complet, "les champs d'avant (`ok`, `f`, `t`, `l`) et tout le reste sont ignorés");
  // Une étoile tenue n'a ni arrêt ni « Je tente » raté ; une étoile pas tenue n'a pas de retour en cours.
  const brut = {version: 12, modules: {A1: {b: [3, 0, 0], e: ["2026-11-20", "2026-11-21", null], ar: [5, 4, 9], r: [2, 1, 0], q: ["2026-11-01", "2026-11-02", "2026-11-03"], x: [2, 3, 1], s: [null, "2026-11-01", null]}}};
  const lu = P.normaliserParcours(brut, {aujourdhui: "2026-11-25"}).modules.A1;
  // (Correctif K1 : une étoile tenue dont le 2e calcul attend garde `q`, le jour de son premier calcul faux.)
  assert.deepEqual([lu.ar, lu.r, lu.q, lu.x], [[0, 4, 9], [0, 1, 0], ["2026-11-01", "2026-11-02", null], [2, 0, 0]]);
  const sans2e = JSON.parse(JSON.stringify(brut));
  sans2e.modules.A1.x[0] = 1;
  assert.equal(P.normaliserParcours(sans2e, {aujourdhui: "2026-11-25"}).modules.A1.q[0], null, "tenue, sans 2e calcul qui attend : pas de jour");
  assert.deepEqual(lu.e, ["2026-11-20", null, null], "pas tenue : une échéance seulement au 3e arrêt (« à voir en classe »)");
  assert.deepEqual(lu.s, [null, null, null], "solide un jour : seulement une étoile gagnée un jour");
  // Le jour de retour d'une étoile « à voir en classe » : au plus dans 7 jours.
  const loin = {version: 12, modules: {A1: {b: [0, 0, 0], ar: [9, 0, 0], e: ["2027-06-01", null, null]}}};
  assert.equal(P.normaliserParcours(loin, {aujourdhui: "2026-11-25"}).modules.A1.e[0], "2026-12-02");
});

test("la référence tient dans ce que le serveur accepte, et ne porte que des clés déclarées ; le pire cas aussi", async () => {
  const complet = parcoursComplet();
  const cles = new Set();
  const voir = valeur => {
    if (Array.isArray(valeur)) valeur.forEach(voir);
    else if (valeur && typeof valeur === "object") Object.keys(valeur).forEach(cle => { cles.add(cle); voir(valeur[cle]); });
  };
  voir(complet);
  const inconnues = [...cles].filter(cle => !CLES_DECLAREES.includes(cle) && !P.CODES.includes(cle) && !/^\d{1,2}$/.test(cle));
  // (Correctif K1 : `prenom` est la seule clé du format que le serveur ne connaît pas — le prénom d'un visiteur
  // sans code reste sur l'appareil.)
  assert.deepEqual(inconnues, ["prenom"], "toute clé de la référence est déclarée, sauf le prénom, qui ne part pas");
  assert.ok(!CLES_DECLAREES.includes("prenom"));
  assert.deepEqual(CLES_DECLAREES.filter(cle => !cles.has(cle)), [], "toute clé déclarée est dans la référence");
  assert.equal(JSON.stringify(complet, null, 2) + "\n", await lire("../_serveur/tests/parcours-reference-defi-calcul.json"), "le fichier de référence est à jour : node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire");
  // Les bornes du serveur : 2 000 clés, 40 000 octets. Le pire cas pour les
  // clés (les 74 modules, 12 causes chacun) et pour la taille (aucune étoile
  // tenue, quatre dates par étoile, les plus grands nombres partout), à la
  // clé et à l'octet près : si le format grossit, ce test le dit.
  const mesure = options => P.mesurer(Object.assign({}, parcoursComplet(options), {prenom: ""}));
  // (Correctif K1 : une clé de plus, `parts`, et ses 88 nombres au pire — il reste 46 clés et 4 698 octets de marge.)
  assert.deepEqual(mesure({entier: true, causes: 12}), {cles: 1954, octets: 33033});
  assert.deepEqual(mesure({pire: true, causes: 12}), {cles: 1954, octets: 35302});
  // Les listes ne comptent pas comme des clés : une case par étoile ne coûte rien.
  assert.equal(P.mesurer({b: [1, 2, 3, 4, 5], e: [null, null]}).cles, 2);
});

test("le serveur : les clés du moteur, version_min 12, la lecture protégée, toutes les listes où la place compte déclarées", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  const declarees = [...bloc.match(/'cles' => \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.deepEqual([...declarees].sort(), [...CLES_DECLAREES].sort(), "lib/applis.php et le moteur déclarent les mêmes clés");
  assert.match(bloc, /'version_min' => 12,/);
  assert.match(bloc, /'version_max' => 999,/);
  assert.match(bloc, /'version_sans_declaration' => 11,/, "une page qui ne dit pas sa version en lisant vaut au plus la version 11 (B1)");
  const listes = bloc.slice(bloc.indexOf("'listes' => ["));
  // Toute liste du format où la place compte : par étoile, le plan, ce que la séance a fait, les dates par étage, les séances et leur journal.
  const positionnelles = ["b", "e", "a", "x", "r", "q", "pe", "d", "s", "ar", "g", "p", "j", "parts", "ceintures", "paliers", "quarts", "seances", ...P.JOURNAL];
  positionnelles.forEach(cle => assert.match(listes, new RegExp(`'${cle}' => \\[`), `« ${cle} » : sa forme est déclarée (une valeur refusée est remplacée à sa place)`));
  const api = await lire("../_serveur/public/api/parcours.php");
  assert.match(api, /version_sans_declaration/);
  assert.match(api, /\$enregistree > \$lecteur/);
  // Les deux moteurs servis à la page du professeur sont les copies exactes de ceux de l'appli.
  for (const fichier of ["defi_calcul_mon_parcours.js", "defi_calcul_core.js"]) {
    assert.equal(await lire(`../_serveur/public/prof/${fichier}`), await lire(`../outils/calcul_mental/${fichier}`), fichier);
  }
});

// ------------------------------------------------------------ le rangement par code

test("le rangement par code : une case par code, sous une empreinte, sans prénom", () => {
  const stockage = fauxStockage();
  const avecPrenom = P.definirPrenom(tenter(P.creerParcours(), "A1", 1, MERCREDI, false), "Léa");
  assert.equal(P.sauver(stockage, avecPrenom, "7K3M9P"), true);
  assert.equal(P.sauver(stockage, avecPrenom, ""), true);
  const cle = P.cleStockage("7K3M9P", stockage);
  assert.match(cle, /^mathsgo-defi-calcul-parcours:[0-9a-f]{16}$/);
  assert.equal(P.cleStockage("", stockage), "mathsgo-defi-calcul-parcours");
  assert.equal(P.clesRevelentUnCode(stockage), false, "aucune clé ne laisse lire un code");
  assert.ok(stockage.cles().every(k => k.startsWith("mathsgo-defi-calcul-")), "rien n'est écrit dans les cases de Défi tables");
  assert.equal(JSON.parse(stockage.brut(cle)).prenom, "", "sous un code, jamais de prénom dans la case");
  assert.equal(JSON.parse(stockage.brut(cle)).version, 12);
  assert.equal(P.charger(stockage, "").prenom, "Léa");
  assert.deepEqual(P.charger(stockage, "7K3M9P").modules.A1.b, [2, 0, 0]);
  assert.deepEqual(P.charger(stockage, "ABCDEF"), P.creerParcours(), "un autre code a sa propre case, vide");
  assert.equal(P.empreinteCode("7K3M9P", "sel"), P.empreinteCode("7K3M9P", "sel"));
  assert.notEqual(P.empreinteCode("7K3M9P", "sel"), P.empreinteCode("7K3M9P", "autre"));
  assert.equal(P.sha256Hex("Défi calcul"), createHash("sha256").update("Défi calcul").digest("hex"));
  // L'état de synchronisation, à côté de la case.
  assert.deepEqual(P.chargerSync(stockage, "7K3M9P"), {revision: 0, dirty: false, detache: false, maj: 0});
  P.sauverSync(stockage, "7K3M9P", {revision: 4, dirty: true, maj: 1000});
  assert.deepEqual(P.chargerSync(stockage, "7K3M9P"), {revision: 4, dirty: true, detache: false, maj: 1000});
  // La purge : une case à code sans ouverture depuis 90 jours quitte l'appareil.
  const jours = n => n * 24 * 60 * 60 * 1000;
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(89)}), 0);
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(91), garder: "7K3M9P"}), 0, "la case active n'est jamais purgée");
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(91)}), 1);
  assert.equal(stockage.brut(cle), undefined);
  assert.equal(P.charger(stockage, "").prenom, "Léa", "la case sans code reste");
  // Une case illisible : un parcours vide, jamais une erreur.
  const abime = fauxStockage({"mathsgo-defi-calcul-parcours": "{pas du json"});
  assert.deepEqual(P.charger(abime, ""), P.creerParcours());
  assert.equal(P.versionEnAvance(abime, ""), false);
  // « Recommencer à zéro » : tout s'efface, l'époque monte.
  const zero = P.remettreAZero(avecPrenom);
  assert.deepEqual([zero.epoque, zero.modules, P.estVide(zero)], [1, {}, true]);
  assert.deepEqual(P.fusionner(zero, avecPrenom, {aujourdhui: MERCREDI}).modules, {}, "l'ancien travail ne revient pas");
});

// ------------------------------------------------------------ le journal

test("le journal d'une séance : onze nombres, le numéro porte son rang et son identité ; -1 pour ce qui n'est pas connu", () => {
  let p = tenter(tenter(P.creerParcours(), "A1", 1, plus(LUNDI, -1), false), "A10", 1, plus(LUNDI, -1), false);
  p = seance(p, LUNDI, {alea: .4242, secondes: 185, juste: c => c.module === "A1", etoile: ["M1", 1]});
  assert.deepEqual(P.JOURNAL.map(champ => p.journal[champ][0]), [3, 1, 0, 1, 1, 3, 10000 + 4242, 0, 0, 0, 0]);
  assert.deepEqual([p.seances, p.seance.n, p.seance.i, p.seance.p], [[LUNDI], 1, 0, [0, 0, 0, 0, 0]]);
  // Une 2e séance le même jour : le rang 2.
  p = seance(p, LUNDI, {alea: .0007, etoile: ["A2", 1]});
  assert.deepEqual([p.seances, p.journal.numero], [[LUNDI, LUNDI], [14242, 20007]]);
  // Hors séance ouverte, rien ne se compte ; le temps actif ne s'ajoute qu'à une séance ouverte, 90 minutes au plus.
  assert.deepEqual(P.noterTemps(p, 300).seance.j, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  let q = P.noterTemps(P.ouvrirSeance(p, CARTE, {aujourdhui: plus(LUNDI, 1), alea: .5}), 20);
  assert.equal(q.seance.j[4], 20);
  q = P.noterTemps(q, 99999);
  assert.equal(q.seance.j[4], 20, "une durée absurde est refusée");
  q = P.noterTemps(P.noterTemps(q, 5000), 5000);
  assert.equal(q.seance.j[4], 5400);
  const finie = P.fermerSeance(P.noterTemps(P.ouvrirSeance(p, CARTE, {aujourdhui: plus(LUNDI, 1), alea: .5}), 20), CARTE, {aujourdhui: plus(LUNDI, 1), force: true}).parcours;
  assert.equal(finie.journal.minutes[2], 1, "une séance de 20 s compte 1 minute");
  // Une entrée abîmée : -1, jamais plus de justes que de calculs ; une séance dont la date n'en est pas une part avec sa ligne.
  const abime = JSON.parse(JSON.stringify(p));
  abime.seances = [LUNDI, "2026-02-30"];
  abime.journal.calculs = [2, 9];
  abime.journal.justes = [5, "x"];
  abime.journal.minutes = [1000, 3];
  const lu = P.normaliserParcours(abime, {aujourdhui: MERCREDI});
  assert.deepEqual([lu.seances, lu.journal.calculs, lu.journal.justes, lu.journal.minutes, lu.journal.numero], [[LUNDI], [2], [2], [-1], [14242]]);
});

test("le journal : 60 séances gardées, les plus récentes ; une vieille copie qui revient ne remplace rien et rien n'oscille", () => {
  let p = P.creerParcours();
  for (let n = 0; n < 65; n += 1) p = seance(p, plus("2026-06-01", n), {alea: (n + 1) / 100});
  assert.equal(p.seances.length, 60);
  assert.deepEqual([p.seances[0], p.seances[59], p.seance.n], [plus("2026-06-01", 5), plus("2026-06-01", 64), 65]);
  P.JOURNAL.forEach(champ => assert.equal(p.journal[champ].length, 60, champ));
  // La copie d'il y a 15 séances revient.
  let vieille = P.creerParcours();
  for (let n = 0; n < 50; n += 1) vieille = seance(vieille, plus("2026-06-01", n), {alea: (n + 1) / 100});
  for (const f of [P.fusionner(p, vieille, {aujourdhui: "2026-09-01"}), P.fusionner(vieille, p, {aujourdhui: "2026-09-01"})]) {
    assert.deepEqual([f.seances, f.journal, f.seance.n], [p.seances, p.journal, 65]);
    assert.deepEqual(P.fusionner(f, vieille, {aujourdhui: "2026-09-01"}), f);
  }
  // Une séance sans numéro d'un côté (pas connue) peut être la séance numérotée de l'autre : on ne la double pas.
  const blanche = JSON.parse(JSON.stringify(vieille));
  P.JOURNAL.forEach(champ => { blanche.journal[champ][49] = -1; });
  const f = P.fusionner(vieille, blanche, {aujourdhui: "2026-09-01"});
  assert.deepEqual([f.seances.length, f.journal.calculs[49], f.journal.numero[49]], [50, 0, vieille.journal.numero[49]]);
});

test("la semaine de l'élève : les jours travaillés cochés (séance finie ou non), jamais un jour pas encore venu ; les séances par semaine", () => {
  let p = seance(P.creerParcours(), LUNDI, {etoile: ["A1", 1]});
  // Mardi : un calcul, la séance pas finie.
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: plus(LUNDI, 1), alea: .3});
  p = P.appliquerRetour(p, {module: "A1", niveau: 1, juste: true, ms: 1500, type: "P"}, {aujourdhui: plus(LUNDI, 1)}).parcours;
  const s = P.semaineEleve(p, CARTE, MERCREDI);
  assert.deepEqual(s.jours.map(j => [j.fait, j.aujourdhui, j.apres]), [[true, false, false], [true, false, false], [false, true, false], [false, false, true], [false, false, true], [false, false, true], [false, false, true]]);
  assert.deepEqual([s.montrer, s.soirs, s.avancees], [true, 2, [{module: "A1", niveau: 1}]]);
  assert.deepEqual(P.bilanSeances(p, MERCREDI), {semaine: 1, aujourdhui: 0});
  assert.deepEqual(P.seancesParSemaine(p, MERCREDI).map(P.texteSemaine), ["0", "0", "0", "1"]);
  // Une séance datée de demain (l'horloge d'un autre appareil) ne coche pas demain.
  const demain = seance(P.creerParcours(), plus(MERCREDI, 1));
  assert.equal(P.semaineEleve(demain, CARTE, MERCREDI).jours[3].fait, false);
  assert.equal(P.semaineEleve(P.creerParcours(), CARTE, MERCREDI).montrer, false, "rien à montrer sans rien de fait");
});

test("resumeSuivi : un jour de travail par séance, ses cinq comptes, la séance ouverte dès le premier geste ; pas de minutes", () => {
  let p = tenter(P.creerParcours(), "A1", 1, plus(LUNDI, -1), false);
  p = seance(p, LUNDI, {etoile: ["A10", 1]});
  let s = P.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(s.jours, [{jour: LUNDI, lignes: [{calculs: 1, justes: 1, nouveautes: 0, prouvees: 1, rouges: 0, modules: ["A10"]}]}]);
  assert.deepEqual([s.appli, s.dernier, s.aider, s.feliciter], ["defi-calcul", LUNDI, [], []]);
  assert.ok(!JSON.stringify(s).includes("minutes"), "aucun temps passé n'est rendu");
  // Mercredi, une séance ouverte, un calcul fait : le jour compte déjà.
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: MERCREDI, alea: .3});
  p = P.appliquerRetour(p, {module: "A10", niveau: 1, juste: true, ms: 1500, type: "P"}, {aujourdhui: MERCREDI}).parcours;
  s = P.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(s.jours.map(j => j.jour), [LUNDI, MERCREDI]);
  assert.deepEqual(s.jours[1].lignes[0], {calculs: 1, justes: 1, nouveautes: 0, prouvees: 0, rouges: 0, modules: []});
  // Une étoile perdue : « rouges » ; une ceinture gagnée cette semaine : à féliciter.
  const perdu = seance(tenter(P.creerParcours(), "A1", 1, plus(LUNDI, -1), false), LUNDI, {juste: () => false});
  assert.deepEqual(P.resumeSuivi(perdu, {aujourdhui: MERCREDI}).aider, [{type: "rouges", competences: 1}]);
  const ceinture = Object.assign(P.creerParcours(), {ceintures: [LUNDI, null, null, null]});
  assert.deepEqual(P.resumeSuivi(ceinture, {aujourdhui: MERCREDI}).feliciter, [{type: "ceinture", ceinture: 1}]);
});

// ------------------------------------------------------------ J'apprends

test("J'apprends : le moteur enregistre avec les règles de l'écran (pas d'outil à manipuler, formes à voir, temps passé)", () => {
  const apprendre = (reponses, plusSerie = {}) => P.appliquerSerie(P.creerParcours(), Object.assign({module: "A1", niveau: 1, genre: "apprends", reponses}, plusSerie), o(MERCREDI, false));
  // Toutes les formes pas encore vues : pas gagnée, même avec 5 justes sans aide.
  let r = apprendre(lecon(), {toutesFormesVues: false});
  assert.deepEqual([r.verdict.reussi, r.parcours.modules.A1.b[0], P.arretsDe(r.parcours.modules.A1, 0)], [false, 0, 1]);
  // Le temps passé, 4 calculs faits : il s'arrête, « On continue demain » ; il reprendra au dessin.
  r = apprendre([{juste: true, outil: "manip"}, {juste: true, outil: "manip"}, {juste: true, outil: "image"}, {juste: false, outil: "image"}], {tempsFini: true});
  assert.deepEqual(r.evenements, [{type: "arrete", module: "A1", niveau: 1, reprise: P.REPRISE.dessin, arrets: 1, aVoir: false, retour: null}]);
  assert.equal(P.etatEtoile(r.parcours, CARTE, "A1", 1, {aujourdhui: MERCREDI}).enCours, true);
  // Sans outil à manipuler, il commence au dessin ; la reprise suit le moteur, pas la page.
  assert.equal(P.suivreEntrainement([], {genre: "apprends", manip: false}).outil, "image");
  const repris = P.appliquerSerie(r.parcours, {module: "A1", niveau: 1, genre: "apprends", reponses: lecon()}, o(plus(MERCREDI, 1), false));
  assert.deepEqual([repris.verdict.reussi, repris.parcours.modules.A1.b[0], repris.parcours.modules.A1.ar[0], repris.parcours.modules.A1.a[0]], [true, 2, 0, 1]);
  // Les calculs faits sans aide comptent au journal de la séance (pas le rappel au dessin d'une écriture nouvelle).
  const s = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: MERCREDI, alea: .5});
  const avecRappel = [...lecon(), {juste: true, outil: "aucun", rappel: true}, {juste: false, outil: "aucun"}, {juste: true, outil: "image"}, {juste: true, outil: "aucun"}];
  const j = P.appliquerSerie(s, {module: "A1", niveau: 1, genre: "apprends", reponses: avecRappel}, o(MERCREDI)).parcours.seance.j;
  assert.deepEqual([j[6], j[7]], [7, 6]);
});
