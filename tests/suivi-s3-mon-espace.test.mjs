// « Suivre ses élèves », lot S3 « Mon espace côté élève » (08/11/2026).
//
// Choix de Gwenaël (07/11, planches 4 et 5 du chantier ; 08/11, les trois
// questions du lot) :
//  - « Ma semaine » en haut de Mon espace : 7 cases, ✓ un jour de travail,
//    TOUTES APPLIS ENSEMBLE ; « 3 jours cette semaine » — des jours, jamais
//    des « soirs », jamais un temps passé ; une semaine sans travail (le
//    lundi matin) : 7 cases vides, ni chiffre ni phrase ; rien du tout tant
//    que l'élève n'a jamais travaillé ;
//  - sous une tuile, en vert, ce qu'il a GAGNÉ cette semaine (une table
//    passée, un monde fini, un grade, des compétences sues dès la première),
//    seulement quand il y en a ; le lundi, les tuiles repartent à neuf ;
//  - les tuiles épurées : la phrase sous le nom de l'appli seulement tant que
//    l'élève ne l'a jamais ouverte (le serveur n'a aucun parcours pour elle).
// RIEN DE NOUVEAU N'EST DEMANDÉ AU SERVEUR : la page relit les parcours
// qu'elle lisait déjà pour les jauges, et les moteurs (resumeSuivi, lot S1)
// disent les jours et les gains.
//
// Ces tests EXÉCUTENT le bloc des jauges de la page tel qu'il y est écrit,
// avec les VRAIS moteurs servis par le serveur (prof/*.js), un faux serveur
// et une horloge fixée.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {createRequire} from "node:module";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/index.php");
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
function fonction(nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(page);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(page, m.index);
}

// Le bloc des jauges, des moteurs (JAUGES) jusqu'à leur pose
// (poserLesJauges) : c'est là que vivent la lecture et le lot S3.
const debut = page.indexOf("  const JAUGES = {");
const fin = page.indexOf("\n  }", page.indexOf("for (let i = aLire.length - 1", debut)) + "\n  }".length;
const BLOC = page.slice(debut, fin).replace(/<\?=[\s\S]*?\?>/g, "0123456789");

const MOTEURS = [
  ["defi_tables_mon_parcours.js", "MATHSGO_DEFI_TABLES_MON_PARCOURS", T],
  ["splat-parcours.js", "MathsGoSplatParcours", S],
  ["coffres-parcours.js", "MathsGoCoffresParcours", C],
  ["flash_anzan_parcours.js", "MathsGoFlashAnzanParcours", A],
  ["defi_calcul_core.js", "MATHSGO_DEFI_CALCUL_CORE", DCORE],
  ["defi_calcul_mon_parcours.js", "MATHSGO_DEFI_CALCUL_MON_PARCOURS", D]
];

// Une horloge d'appareil fixée : `new Date()` sans argument rend `maintenant`.
function horloge(maintenant) {
  const Vraie = Date;
  return class extends Vraie {
    constructor(...args) { if (args.length) super(...args); else super(maintenant); }
    static now() { return new Vraie(maintenant).getTime(); }
  };
}

// La lecture de la page, jouée : `parActivite` {cle: parcours | null | "panne"}.
async function lireLaSemaine(parActivite, maintenant, applis = Object.keys(parActivite), sansMoteur = []) {
  const appels = [];
  const fetch = (adresse, options) => {
    appels.push(adresse);
    const {appli} = JSON.parse(options.body);
    const parcours = parActivite[appli];
    if (parcours === "panne") return Promise.reject(new Error("réseau"));
    return Promise.resolve({ok: true, json: () => Promise.resolve(parcours
      ? {ok: true, existe: true, parcours: JSON.parse(JSON.stringify(parcours))}
      : {ok: true, existe: false, parcours: null})});
  };
  const fenetre = {};
  const noeud = () => ({ecouteurs: {}, addEventListener(t, f) { this.ecouteurs[t] = f; }, setAttribute() {}, append() {}});
  const doc = {createElement: noeud, createElementNS: noeud, createTextNode: t => t,
    head: {appendChild(script) {
      setTimeout(() => {
        const trouve = MOTEURS.find(([fichier]) => script.src.includes(`/${fichier}?`) && !sansMoteur.includes(fichier));
        if (trouve) fenetre[trouve[1]] = trouve[2];
        script.ecouteurs[trouve ? "load" : "error"]?.();
      }, 0);
    }}};
  const lecture = new Function("$", "window", "document", "fetch", "CSS", "Date",
    `${BLOC}\n  return {lireJauges, CLE_ESPACE};`)(() => null, fenetre, doc, fetch, {escape: x => x}, horloge(maintenant));
  const donnees = {applis: applis.map(cle => ({cle, disponible: true, url: "https://mathsgo.re/x.html", ancre: null}))};
  const jauges = await lecture.lireJauges(donnees, "ABC234");
  return {jauges, espace: jauges[lecture.CLE_ESPACE], appels};
}

// ------------------------------------------------------- des parcours joués

const JEUDI = new Date(2026, 10, 12, 16, 30);          // jeudi 12/11, 16 h 30 (son lundi : le 9)
const LUNDI_SUIVANT = new Date(2026, 10, 16, 7, 30);   // lundi 16/11, 7 h 30

// Défi tables : des séances [jour, [table, etapes, calculs, justes, test]].
function seancesT(paires, reglage = () => {}) {
  const p = T.creerParcours();
  p.seances = paires.map(([jour]) => jour);
  T.JOURNAL.forEach((champ, index) => { p.journal[champ] = paires.map(([, e]) => (index < e.length ? e[index] : -1)); });
  reglage(p);
  return T.normaliserParcours(p);
}
// SPLAT! : les étapes du monde 1 réussies, aux jours donnés.
function splatMonde1(jours) {
  let p = S.creer();
  S.CARTE.ETAPES.filter(e => e[4] === 1).forEach((e, i) => {
    p = S.enregistrerSerie(p, e[0], {fait: true, etoiles: 6, cartes: 6, vues: 0}, jours[Math.min(i, jours.length - 1)]);
  });
  return S.pourServeur(p);
}
// Coffres : un trésor ouvert ce jour-là.
function coffresTresor(jour) {
  const quatre = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
  let p = C.commencerPartie(C.creer(), {niveau: 1, ops: [1, 2, 3, 4], serie: quatre, familles: quatre.map(() => false)}, jour);
  quatre.forEach(o => { p = C.noterCle(p, o, jour); });
  p = C.noterTresor(p, jour);
  return C.pourServeur(p);
}
// Défi calcul : une séance jouée jusqu'au bout, tout juste (comme le test S2).
const CARTE_CALCUL = (() => { const c = DCORE.carte(); return {modules: c.modules.map(f => Object.assign({}, f, {construit: f.paliers.some(Boolean)})), ordre: c.ordre}; })();
function seanceD(p, jour) {
  p = D.ouvrirSeance(p, CARTE_CALCUL, {aujourdhui: jour, nouveautes: 1});
  const avant = p.seance.n;
  for (let tour = 0; tour < 30 && p.seance.n === avant; tour += 1) {
    const etape = D.fileSeance(p, CARTE_CALCUL, {aujourdhui: jour}).etapes[0];
    if (!etape) break;
    if (etape.type === "jour") {
      D.tirerCalculsDuJour(p, CARTE_CALCUL, {aujourdhui: jour}).forEach(c => {
        p = D.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: true, ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
      });
      p = D.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE_CALCUL}).parcours;
    } else if (etape.type === "test") {
      p = D.appliquerTest(p, {module: etape.module, marche: 2, niveaux: [{niveau: 1, justes: 2, total: 2}, {niveau: 2, justes: 2, total: 2}]}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    } else if (etape.type === "apprends") {
      p = D.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: "apprends"}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    } else {
      const reponses = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
      p = D.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    }
  }
  return p;
}

// ------------------------------------------------------------ Ma semaine

test("Ma semaine : les jours de travail de TOUTES les applis, chaque jour une fois, depuis lundi seulement", async () => {
  const dt = seancesT([["2026-11-06", [3, 4, 10, 9, 0]], ["2026-11-10", [3, 4, 10, 9, 0]], ["2026-11-12", [3, 4, 10, 10, 1]]]);
  const splat = splatMonde1(["2026-11-09", "2026-11-12"]);
  const coffres = coffresTresor("2026-11-11");
  const {espace} = await lireLaSemaine({"defi-tables": dt, "splat": splat, "coffres": coffres}, JEUDI);
  assert.deepEqual(espace.jours, ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12"],
    "lundi (SPLAT!), mardi (Défi tables), mercredi (Coffres), jeudi (deux applis, compté une fois) ; vendredi 6 n'est pas de cette semaine");
  assert.equal(espace.travail, true);
  assert.deepEqual(espace.ouvertes.sort(), ["coffres", "defi-tables", "splat"]);
});

test("Ma semaine : un jour à venir (horloge d'un autre appareil en avance) ne compte pas", async () => {
  const dt = seancesT([["2026-11-10", [3, 4, 10, 9, 0]], ["2026-11-14", [3, 4, 10, 9, 0]]]);
  const {espace} = await lireLaSemaine({"defi-tables": dt}, JEUDI);
  assert.deepEqual(espace.jours, ["2026-11-10"]);
});

test("le lundi matin : la semaine commence — aucun jour, mais l'élève a déjà travaillé (les 7 cases vides se montrent)", async () => {
  const dt = seancesT([["2026-11-10", [3, 4, 10, 9, 0]], ["2026-11-12", [4, 4, 10, 10, 1]]],
    p => { p.tables[4].acquise = "2026-11-12"; });
  const {espace, jauges} = await lireLaSemaine({"defi-tables": dt}, LUNDI_SUIVANT);
  assert.deepEqual(espace.jours, []);
  assert.equal(espace.travail, true, "la carte reste, vide (choix de Gwenaël, question 2)");
  assert.equal(jauges["defi-tables"].gain, undefined, "le gain de la semaine d'avant est parti (choix de Gwenaël, question 3)");
});

test("jamais rien fait : pas de « Ma semaine », aucune appli ouverte (les phrases restent)", async () => {
  const {espace, jauges} = await lireLaSemaine({"defi-tables": null, "splat": null}, JEUDI);
  assert.equal(espace, undefined, "aucun parcours : la lecture s'arrête avant les moteurs, rien n'est rangé");
  assert.deepEqual(jauges, {});
});

test("une appli ouverte sans rien finir : elle perd sa phrase, mais aucun jour de travail (une connexion seule ne compte pas)", async () => {
  const {espace} = await lireLaSemaine({"defi-tables": T.creerParcours(), "splat": null}, JEUDI);
  assert.deepEqual(espace.ouvertes, ["defi-tables"]);
  assert.deepEqual(espace.jours, []);
  assert.equal(espace.travail, false, "jamais travaillé : pas de carte");
});

test("une appli en panne au serveur : le reste se lit, rien ne casse", async () => {
  const dt = seancesT([["2026-11-10", [3, 4, 10, 9, 0]]]);
  const {espace} = await lireLaSemaine({"defi-tables": dt, "splat": "panne"}, JEUDI);
  assert.deepEqual(espace.jours, ["2026-11-10"]);
  assert.deepEqual(espace.ouvertes, ["defi-tables"]);
});

test("un moteur qui ne se charge pas : l'appli reste « ouverte » (sa phrase ne revient pas), le reste se lit", async () => {
  const dt = seancesT([["2026-11-10", [3, 4, 10, 9, 0]]]);
  const {espace, jauges} = await lireLaSemaine({"defi-tables": dt, "splat": splatMonde1(["2026-11-11"])}, JEUDI, undefined, ["splat-parcours.js"]);
  assert.deepEqual(espace.ouvertes.sort(), ["defi-tables", "splat"], "le serveur a son parcours : il l'a ouverte");
  assert.deepEqual(espace.jours, ["2026-11-10"], "sans moteur, SPLAT! ne dit pas ses jours");
  assert.equal(jauges.splat, undefined);
});

// ------------------------------------------------------------ les gains

test("gains : une table passée, deux tables, un monde fini — les mots de « À féliciter », en vert sous la tuile", async () => {
  const une = seancesT([["2026-11-10", [4, 4, 10, 10, 1]]], p => { p.tables[4].acquise = "2026-11-10"; });
  const deux = seancesT([["2026-11-10", [4, 4, 10, 10, 1]]], p => { p.tables[6].acquise = "2026-11-11"; p.tables[4].acquise = "2026-11-10"; p.tables[2].acquise = "2026-11-02"; });
  let r = await lireLaSemaine({"defi-tables": une, "splat": splatMonde1(["2026-11-03", "2026-11-11"])}, JEUDI);
  assert.equal(r.jauges["defi-tables"].gain, "↑ table de 4 passée cette semaine");
  assert.equal(r.jauges["splat"].gain, "↑ monde 1 fini cette semaine");
  r = await lireLaSemaine({"defi-tables": deux}, JEUDI);
  assert.equal(r.jauges["defi-tables"].gain, "↑ tables de 4 et de 6 passées cette semaine", "la table de 2, passée avant lundi, n'y est pas");
  r = await lireLaSemaine({"splat": splatMonde1(["2026-11-03"])}, JEUDI);
  assert.equal(r.jauges["splat"].gain, undefined, "un monde fini la semaine d'avant n'est plus un gain");
});

test("gains : Défi calcul dès la PREMIÈRE compétence sue cette semaine (choix de Gwenaël, question 1)", async () => {
  const p = seanceD(D.creerParcours(), "2026-11-10");
  const sues = D.resumeProf(p, DCORE.carte(), "2026-11-12").modules
    .reduce((n, m) => n + m.sues.filter(j => j && j >= "2026-11-09" && j <= "2026-11-12").length, 0);
  assert.ok(sues >= 1 && sues < 5, `la séance jouée fait ${sues} compétence(s) sue(s) : sous le seuil de « À féliciter »`);
  const {jauges} = await lireLaSemaine({"defi-calcul": p}, JEUDI);
  assert.equal(jauges["defi-calcul"].gain, `↑ +${sues} cette semaine`);
  const lundi = await lireLaSemaine({"defi-calcul": p}, LUNDI_SUIVANT);
  assert.equal(lundi.jauges["defi-calcul"].gain, undefined);
});

test("gains : Coffres n'a rien à féliciter ; Anzan, le grade réussi par son nom", () => {
  const gainDe = new Function("window", `${fonction("lundiDeJour")}\n${fonction("jourDecale")}\n${fonction("jourDeLAppareil")}\n${fonction("enListe")}\n${fonction("gainDe")}\nreturn gainDe;`)({});
  assert.equal(gainDe("coffres", C, {}, {feliciter: [{type: "tresor"}]}, "2026-11-12"), "");
  assert.equal(gainDe("flash-anzan", A, {}, {feliciter: [{type: "grade", grade: 5}]}, "2026-11-12"), `↑ ${A.nomGrade(5)} réussi cette semaine`);
  assert.equal(gainDe("splat", S, {}, {feliciter: [{type: "monde", monde: 3}, {type: "monde", monde: 1}, {type: "monde", monde: 2}]}, "2026-11-12"),
    "↑ mondes 1, 2 et 3 finis cette semaine");
  assert.equal(gainDe("splat", S, {}, null, "2026-11-12"), "");
});

// ------------------------------------------------------------ la page

test("rien de nouveau n'est demandé au serveur : les mêmes trois adresses qu'avant le lot", () => {
  const adresses = [...page.matchAll(/fetch\("([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual([...new Set(adresses)].sort(), ["api/direct.php", "api/eleve.php", "api/parcours.php"]);
  assert.equal(adresses.filter(a => a === "api/parcours.php").length, 1, "une seule lecture de parcours, celle des jauges");
});

test("Ma semaine et les gains : construits par textContent, jamais en HTML ; aucun temps passé ; des jours, pas des soirs", () => {
  for (const nom of ["poserSemaine", "poserGain", "espaceLu"]) {
    assert.doesNotMatch(fonction(nom), /innerHTML|insertAdjacentHTML/, `${nom} ne fabrique pas de HTML`);
  }
  assert.match(fonction("poserGain"), /gain\.textContent = jauge\.gain;/);
  assert.match(fonction("poserSemaine"), /`\$\{compte\} jour\$\{compte > 1 \? "s" : ""\}`/);
  const s3 = page.slice(page.indexOf("// ------------------------------------------- lot S3"), page.indexOf("  async function lireJauges"));
  assert.doesNotMatch(s3 + fonction("poserSemaine"), /minute|soir|\bmin\b/i, "ni minutes ni soirs");
});

// Les fonctions de la page sur les jours, avec une horloge fixée.
function lesJours(maintenant, autres = []) {
  const noms = ["jourDeLAppareil", "jourDecale", "lundiDeJour", "jourValide", ...autres];
  return new Function("Date", "JAUGES", `const CLE_ESPACE = "@espace";\nconst JOUR_VALIDE = /^\\d{4}-\\d{2}-\\d{2}$/;\n`
    + `${noms.map(fonction).join("\n")}\nreturn {${noms.join(", ")}};`)(horloge(maintenant),
    {"defi-tables": {}, "splat": {}, "coffres": {}, "flash-anzan": {}, "defi-calcul": {}});
}

test("la copie de l'onglet : une semaine abîmée ou trafiquée ne passe pas (des dates et des clés seulement)", () => {
  const {espaceLu} = lesJours(JEUDI, ["espaceLu"]);
  assert.equal(espaceLu({}), null);
  assert.equal(espaceLu({"@espace": "texte"}), null);
  assert.deepEqual(espaceLu({"@espace": {jours: ["2026-11-10", "<img src=x>", 3], travail: "oui", ouvertes: ["splat", {}]}}),
    {aujourdhui: "", jours: ["2026-11-10"], travail: false, ouvertes: ["splat"]});
  // Correctif S3 (Codex, nº 5) : la copie trafiquée du relecteur.
  assert.deepEqual(espaceLu({"@espace": {
    aujourdhui: "2026-02-30", travail: true,
    jours: ["2026-02-31", "2026-99-99", "<img src=x>", "2026-11-10"],
    ouvertes: ["splat", "<img src=x>", "inconnue", "__proto__", "constructor", "toString", {}]
  }}), {aujourdhui: "", jours: ["2026-11-10"], travail: true, ouvertes: ["splat"]},
  "des dates du calendrier et les applis que la page connaît, rien d'autre");
  assert.equal(espaceLu({"@espace": {aujourdhui: "2026-11-12"}}).aujourdhui, "2026-11-12", "le jour de la lecture est gardé");
});

// Correctif S3 (Codex, nº 2) : une copie relue une autre semaine ne remet
// pas les gains de la semaine d'avant, même hors ligne.
test("la copie du dimanche relue le lundi : plus aucun gain, dès le premier dessin (une jauge qui n'était qu'un gain disparaît)", () => {
  const jauges = {
    "defi-tables": {compte: "4 tables passées sur 9", gain: "↑ table de 4 passée cette semaine"},
    "splat": {gain: "↑ monde 2 fini cette semaine"},
    "coffres": {lignes: [{texte: "Niveau 1 : 1 trésor"}]}
  };
  const avecEspace = jour => Object.assign({}, jauges, {"@espace": {aujourdhui: jour, jours: [], travail: true, ouvertes: []}});
  const lundi = lesJours(LUNDI_SUIVANT, ["espaceLu", "sansGainsPerimes"]);
  const dimanche = avecEspace("2026-11-15");
  const propres = lundi.sansGainsPerimes(dimanche, lundi.espaceLu(dimanche));
  assert.deepEqual(propres["defi-tables"], {compte: "4 tables passées sur 9"}, "la jauge reste, le gain part");
  assert.equal("splat" in propres, false, "la jauge qui n'était qu'un gain part (la tuile ne remonte pas pour rien)");
  assert.deepEqual(propres["coffres"], jauges.coffres);
  assert.equal(dimanche["defi-tables"].gain, "↑ table de 4 passée cette semaine", "la copie elle-même n'est pas modifiée");
  // Sans date (copie abîmée, ou d'avant le correctif) : pas de gain non plus.
  const sansDate = lundi.sansGainsPerimes(jauges, lundi.espaceLu(jauges));
  assert.equal(sansDate["defi-tables"].gain, undefined);
  // Une date à venir (l'horloge de l'appareil a reculé) : pas de gain.
  const avenir = avecEspace("2026-11-17");
  assert.equal(lundi.sansGainsPerimes(avenir, lundi.espaceLu(avenir))["defi-tables"].gain, undefined);
  // La même semaine (lue mardi, relue jeudi) : les gains restent.
  const jeudi = lesJours(JEUDI, ["espaceLu", "sansGainsPerimes"]);
  const mardi = avecEspace("2026-11-10");
  assert.equal(jeudi.sansGainsPerimes(mardi, jeudi.espaceLu(mardi)), mardi, "rien à retirer : les mêmes jauges");
});

test("le lundi, la copie se redessine sans les gains AVANT de poser les jauges ; la lecture fraîche garde son jour", () => {
  const espace = fonction("afficherEspace");
  assert.ok(espace.indexOf("jauges = sansGainsPerimes(jauges, espace);") > 0
    && espace.indexOf("jauges = sansGainsPerimes(jauges, espace);") < espace.indexOf("poserLesJauges(jauges || {}"));
  assert.match(fonction("lireJauges"), /const espace = \{aujourdhui, jours: \[\]/);
});

// Correctif S3 (Codex, nº 3) : la page restée ouverte la nuit.
test("la page restée ouverte jusqu'au lendemain se rouvre pour le nouveau jour ; le même jour, rien ne se relit", () => {
  const source = `${["jourDeLAppareil", "revoirSiNouveauJour"].map(fonction).join("\n")}\nreturn revoirSiNouveauJour;`;
  const essayer = ({maintenant, jourAffiche, codeAffiche = "ABC234", code = "ABC234", cache = false}) => {
    const ouvertures = [];
    const revoir = new Function("Date", "$", "lireCode", "ouvrir", "codeAffiche", "jourAffiche", source)(
      horloge(maintenant), () => ({hidden: cache}), () => code, (c, s) => ouvertures.push([c, s]), codeAffiche, jourAffiche);
    revoir();
    return ouvertures;
  };
  assert.deepEqual(essayer({maintenant: LUNDI_SUIVANT, jourAffiche: "2026-11-15"}), [["ABC234", true]], "dimanche → lundi : l'espace se rouvre");
  assert.deepEqual(essayer({maintenant: JEUDI, jourAffiche: "2026-11-12"}), [], "le même jour : rien");
  assert.deepEqual(essayer({maintenant: LUNDI_SUIVANT, jourAffiche: "2026-11-15", code: ""}), [], "déconnecté entre-temps : rien");
  assert.deepEqual(essayer({maintenant: LUNDI_SUIVANT, jourAffiche: "2026-11-15", codeAffiche: ""}), [], "sur l'écran du code : rien");
  assert.deepEqual(essayer({maintenant: LUNDI_SUIVANT, jourAffiche: "2026-11-15", code: "BOB234"}), [], "un autre code : c'est le retour de cache qui décide");
  assert.match(page, /if \(document\.visibilityState === "visible"\) revoirSiNouveauJour\(\);/, "au retour visible de l'onglet");
});

// Correctif S3 (Codex, nº 4) : un code que le serveur ne connaît plus.
test("api/direct.php répond « code inconnu » (404) : tout part tout de suite ; une panne (503) ne fait rien oublier", async () => {
  const essayer = async statut => {
    const menages = [];
    const demander = new Function("fetch", "$", "poserTuileEvaluation", "resumeEvaluation", "noterHaut", "lireCode", "revenirAuCode",
      `let directCode = "ABC234"; let hautCourant = null;\n${fonction("demanderDirect")}\nreturn demanderDirect;`)(
      () => Promise.resolve({ok: statut === 200, status: statut, json: () => Promise.resolve(statut === 200 ? {ok: true, direct: false} : {ok: false})}),
      () => ({}), () => {}, () => null, () => {}, () => "ABC234", () => menages.push(1));
    const attente = await demander("ABC234");
    return {attente, menages: menages.length};
  };
  assert.deepEqual(await essayer(404), {attente: 0, menages: 1}, "404 : le ménage, la surveillance s'arrête");
  assert.deepEqual(await essayer(503), {attente: 6000, menages: 0}, "503 : le code reste, on redemandera");
});

test("un clic d'activité quand le serveur ne connaît plus le code : pas de départ avec l'ancien billet, le ménage", async () => {
  const source = `${fonction("billetFrais")}\n${fonction("adresseAppli")}\n${fonction("ouvrirAppli")}\nreturn ouvrirAppli;`;
  const essayer = async statut => {
    const departs = [];
    const menages = [];
    const ouvrirAppli = new Function("fetch", "window", "lireCode", "revenirAuCode", source)(
      () => Promise.resolve({ok: statut === 200, status: statut, json: () => Promise.resolve(statut === 200 ? {ok: true, billet: "neuf"} : {ok: false})}),
      {location: {assign: a => departs.push(a)}, setTimeout: () => 0}, () => "ABC234", () => menages.push(1));
    const lien = {dataset: {}};
    await ouvrirAppli({button: 0, preventDefault() {}}, lien, {url: "https://mathsgo.re/x.html", ancre: null}, "ABC234", "ancien");
    return {departs, menages: menages.length, enCours: "enCours" in lien.dataset};
  };
  assert.deepEqual(await essayer(404), {departs: [], menages: 1, enCours: false});
  assert.deepEqual(await essayer(200), {departs: ["https://mathsgo.re/x.html#b=neuf"], menages: 0, enCours: true});
  assert.deepEqual((await essayer(503)).departs, ["https://mathsgo.re/x.html#b=ancien"], "une panne : le billet de l'entrée sert de secours, comme avant");
});

test("la tuile épurée : la phrase se cache seulement pour une appli que le serveur connaît ; « Se déconnecter » efface la semaine", () => {
  const espace = fonction("afficherEspace");
  assert.match(espace, /lien\.querySelector\("span"\)\.hidden = ouvertes\.includes\(appli\.cle\);/);
  assert.match(espace, /const espace = espaceLu\(jauges\);/);
  assert.match(fonction("revenirAuCode"), /poserSemaine\(null\);/);
  assert.match(fonction("poserSemaine"), /if \(!espace \|\| !espace\.travail\) \{ carte\.hidden = true; return; \}/);
});

test("la carte « Ma semaine » est entre les tuiles du haut et les activités, cachée au départ", () => {
  const html = page.slice(page.indexOf('<section id="ecran-espace"'), page.indexOf("</main>"));
  const ordre = ["id=\"direct-lien\"", "id=\"evaluation-lien\"", "id=\"semaine\"", "id=\"applis\""].map(x => html.indexOf(x));
  assert.ok(ordre.every((x, i) => x > 0 && (i === 0 || x > ordre[i - 1])), "séance en direct, évaluation, Ma semaine, activités");
  assert.match(html, /<section class="semaine" id="semaine" aria-labelledby="semaine-titre" hidden>/);
});
