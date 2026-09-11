import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const parcours = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

const DATE = "2026-09-01";

function normaliser(config) {
  return core.normalizeConfiguration(config);
}

function repondre(etat, cle, correcte, date = DATE) {
  return parcours.appliquerReponse(etat, cle, {correcte, date}).parcours;
}

function acquerir(etat, table) {
  return parcours.appliquerSerie(etat, normaliser(parcours.configValidation(table)), {correct: 20, total: 20, date: DATE}).parcours;
}

test("la grille compte 36 faits, de 2×2 à 9×9, sens confondus", () => {
  assert.equal(parcours.FAITS.length, 36);
  assert.equal(parcours.FAITS[0], "2-2");
  assert.equal(parcours.FAITS.at(-1), "9-9");
  assert.equal(parcours.cleFait("8-7"), "7-8", "8×7 et 7×8 sont le même fait");
  assert.equal(parcours.cleFait("7-8"), "7-8");
  assert.equal(parcours.cleFait("1-7"), null, "la table de 1 est hors grille");
  assert.equal(parcours.cleFait("7-10"), null, "la table de 10 est hors grille");
  assert.equal(parcours.cleFait("n'importe quoi"), null);
  assert.equal(parcours.libelleFait("7-8"), "7 × 8");
  assert.deepEqual(parcours.faitsDeLaTable(9), ["2-9", "3-9", "4-9", "5-9", "6-9", "7-9", "8-9", "9-9"]);
  assert.equal(parcours.faitsDeLaTable(7).length, 8);
  assert.equal(parcours.creerParcours().calculs && Object.keys(parcours.creerParcours().calculs).length, 0);
});

test("trois cases par fait : +1 par réussite (une par jour), −1 par erreur, bornées à 0 et 3", () => {
  let etat = parcours.creerParcours();
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "jamais-vu");

  etat = repondre(etat, "6-7", true);
  assert.deepEqual(etat.calculs["6-7"], {cases: 1, vu: DATE, erreur: null, gagne: DATE});
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "en-cours");

  etat = repondre(etat, "6-7", true);
  etat = repondre(etat, "7-6", true);
  assert.equal(etat.calculs["6-7"].cases, 1, "une seule case par calcul et par jour, même dans l’autre sens");

  etat = repondre(etat, "7-6", true, "2026-09-02");
  assert.equal(etat.calculs["6-7"].cases, 2, "les deux sens alimentent les mêmes cases, un autre jour");
  etat = repondre(etat, "6-7", true, "2026-09-03");
  etat = repondre(etat, "6-7", true, "2026-09-04");
  assert.equal(etat.calculs["6-7"].cases, 3, "su = trois jours différents, jamais plus de 3 cases");
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "su");

  etat = repondre(etat, "6-7", false, "2026-09-05");
  assert.deepEqual(etat.calculs["6-7"], {cases: 2, vu: "2026-09-05", erreur: "2026-09-05", gagne: "2026-09-03"}, "un fait su qui reçoit une erreur repasse en cours (gagne date du 3e jour : à 3 cases, on ne gagne plus)");

  etat = repondre(etat, "6-7", false, "2026-09-05");
  etat = repondre(etat, "6-7", false, "2026-09-05");
  etat = repondre(etat, "6-7", false, "2026-09-05");
  assert.equal(etat.calculs["6-7"].cases, 0, "les erreurs comptent toujours, sans limite par jour, jamais moins de 0");
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "a-travailler");

  etat = repondre(etat, "6-7", true, "2026-09-05");
  assert.equal(etat.calculs["6-7"].cases, 0, "pas de gain le jour d’une erreur sur ce calcul : il « revient dans un nouveau défi », c’est-à-dire un autre jour");
  etat = repondre(etat, "6-7", true, "2026-09-06");
  assert.equal(etat.calculs["6-7"].cases, 1, "le lendemain, la première réussite regagne une case");
  assert.equal(repondre(etat, "6-7", true, "2026-09-06").calculs["6-7"].cases, 1, "mais une seule par jour");

  const premiereErreur = repondre(parcours.creerParcours(), "3-9", false);
  assert.equal(parcours.etatFait(premiereErreur.calculs["3-9"]), "a-travailler", "une erreur au premier essai suffit");

  const horsGrille = parcours.appliquerReponse(parcours.creerParcours(), "7-10", {correcte: true, date: DATE});
  assert.equal(horsGrille.fait, null);
  assert.deepEqual(horsGrille.parcours.calculs, {}, "un calcul hors grille ne laisse aucune trace");
});

test("la grille appartient au parcours : entraînements, validations, mélanges, Expert et révisions seulement", () => {
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "construct"))), false);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "gaps"))), false);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "ordered"))), false, "dans l’ordre = on ajoute, on ne se souvient pas");
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "random"))), false, "J’apprends n’alimente jamais la grille");
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configEntraine(7, "trous"))), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configValidation(7))), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configEtoile(3))), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser({mode: "validation", tables: [2, 10], total: 20, duration: 90})), true, "le mélange aussi");
  assert.equal(parcours.serieAlimenteGrille(normaliser({mode: "custom", tables: [7]})), false, "Réglages est à part du parcours");
  assert.equal(parcours.serieAlimenteGrille(normaliser({mode: "evaluation"})), false, "l’évaluation CM1 est à part du parcours");
  assert.equal(parcours.serieAlimenteGrille(parcours.configRevision()), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser({})), false);
});

test("le résumé et la grille 8×8 : moitié active, miroir grisé du même fait", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "6-7", false);
  etat = repondre(etat, "2-2", true);
  etat = repondre(etat, "2-3", true, "2026-09-01");
  etat = repondre(etat, "2-3", true, "2026-09-02");
  etat = repondre(etat, "2-3", true, "2026-09-03");

  const resume = parcours.resumeCalculs(etat);
  assert.deepEqual(resume, {sus: 1, enCours: 1, aTravailler: 1, jamaisVus: 33, total: 36});

  const grille = parcours.grilleCalculs(etat);
  assert.equal(grille.lignes.length, 8);
  assert.deepEqual(grille.resume, resume);
  const ligne6 = grille.lignes.find(ligne => ligne.ligne === 6);
  const cellule67 = ligne6.cellules.find(cellule => cellule.colonne === 7);
  assert.equal(cellule67.active, true);
  assert.equal(cellule67.etat, "a-travailler");
  const ligne7 = grille.lignes.find(ligne => ligne.ligne === 7);
  const miroir76 = ligne7.cellules.find(cellule => cellule.colonne === 6);
  assert.equal(miroir76.active, false, "7×6 est le miroir grisé");
  assert.equal(miroir76.cle, "6-7");
  assert.equal(miroir76.etat, "a-travailler", "le miroir montre l’état du même fait");
});

test("la révision priorise : 0 case ratés récemment, puis 1, puis 2, puis entretien — jamais un calcul jamais vu", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "6-7", false, "2026-09-01");
  etat = repondre(etat, "7-8", false, "2026-09-03");
  etat = repondre(etat, "3-9", false, "2026-09-02");
  etat = repondre(etat, "2-5", true, "2026-09-01");
  etat = repondre(etat, "4-4", true, "2026-09-02");
  etat = repondre(etat, "4-4", true, "2026-09-04");

  assert.deepEqual(parcours.calculsATravailler(etat), ["7-8", "3-9", "6-7"], "raté le plus récemment d’abord");
  assert.deepEqual(parcours.calculsATravailler(etat, 7), ["7-8", "6-7"]);

  const plan = parcours.planRevision(etat, {random: () => 0});
  assert.equal(plan.length, 5, "cinq calculs vus : cinq questions, pas une de plus (lot 3, décision du 08/09)");
  assert.deepEqual(plan.slice(0, 3).map(item => item.cle), ["7-8", "3-9", "6-7"]);
  assert.equal(plan[3].cle, "2-5", "puis 1 case");
  assert.equal(plan[4].cle, "4-4", "puis 2 cases");
  assert.ok(plan.every(item => etat.calculs[item.cle]), "aucun calcul jamais vu");
  assert.equal(new Set(plan.map(item => item.cle)).size, 5, "jamais deux fois le même fait");

  const questions = plan.map(item => core.tableQuestion(item.type, item.first, item.second));
  questions.forEach((question, index) => {
    assert.equal(parcours.cleFait(question.factKey), plan[index].cle, "chaque question porte bien sur son fait");
  });
  assert.ok(questions.every(question => ["direct", "missing"].includes(question.category)), "pas de division avant ★★★");
  assert.ok(questions.some(question => question.category === "direct"));
  assert.ok(questions.some(question => question.category === "missing"));
});

test("la révision ne propose jamais un calcul jamais vu, même sur une table acquise ; une grille vide ne donne rien", () => {
  assert.deepEqual(parcours.planRevision(parcours.creerParcours()), [], "grille vide : aucune question");
  let etat = acquerir(parcours.creerParcours(), 2);
  // table 2 acquise ; 6-7 su (3 jours) ; tout le reste jamais vu
  etat = repondre(etat, "6-7", true, "2026-09-01");
  etat = repondre(etat, "6-7", true, "2026-09-02");
  etat = repondre(etat, "6-7", true, "2026-09-03");
  const plan = parcours.planRevision(etat, {random: () => 0});
  assert.deepEqual(plan.map(item => item.cle), ["6-7"], "seul le calcul vu (su, en entretien) ; les faits jamais vus de la table 2 restent hors révision");
  assert.deepEqual(parcours.planRevision(etat, {table: 2}), [], "sur la table 2 : rien de vu, rien à réviser");
});

test("l’entretien des faits sus arrive en dernier, du plus ancien au plus récent", () => {
  let etat = parcours.creerParcours();
  parcours.FAITS.forEach(cle => {
    etat = repondre(etat, cle, true, "2026-09-03");
    etat = repondre(etat, cle, true, "2026-09-04");
    etat = repondre(etat, cle, true, "2026-09-05");
  });
  etat.calculs["6-7"] = {cases: 3, vu: "2026-08-01", erreur: null, gagne: "2026-08-01"};
  etat.calculs["2-9"] = {cases: 3, vu: "2026-08-15", erreur: null, gagne: "2026-08-15"};
  const plan = parcours.planRevision(etat, {random: () => 0});
  assert.deepEqual(plan.slice(0, 2).map(item => item.cle), ["6-7", "2-9"], "les sus les plus anciens d’abord quand tout est su");
});

// Un parcours au sommet de l'escalier : les 9 tables, le mélange, puis une marche.
function legende(etoile = 1) {
  let etat = parcours.creerParcours();
  parcours.TABLES.forEach(table => {
    if (parcours.melangeDu(etat)) etat = parcours.appliquerSerie(etat, normaliser(parcours.configMelange(etat)), {correct: 20, total: 20, date: DATE}).parcours;
    etat = parcours.appliquerSerie(etat, normaliser(parcours.configValidation(table)), {correct: 20, total: 20, date: DATE}).parcours;
  });
  etat = parcours.appliquerSerie(etat, normaliser(parcours.configMelange(etat)), {correct: 20, total: 20, date: DATE}).parcours;
  return parcours.appliquerSerie(etat, normaliser(parcours.configEtoile(etoile)), {correct: 25, total: 25, date: DATE}).parcours;
}

test("les divisions n’apparaissent en révision qu’à partir de la première étoile", () => {
  assert.ok(!parcours.planRevision(parcours.creerParcours(), {random: () => 0}).some(item => item.type.startsWith("division")), "sans étoile, pas de division");
  let etat = legende(1);
  assert.equal(etat.expert.etoiles, 1);
  parcours.FAITS.slice(0, 10).forEach(cle => { etat = repondre(etat, cle, true, "2026-09-02"); });
  const plan = parcours.planRevision(etat, {random: () => 0});
  const questions = plan.map(item => core.tableQuestion(item.type, item.first, item.second));
  assert.ok(questions.some(question => question.category === "division"));
});

test("révision sur une table : les calculs vus de cette table, ratés d’abord, sans jamais en sortir", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "7-8", false);
  etat = repondre(etat, "6-7", true);
  etat = repondre(etat, "3-4", false);
  const plan = parcours.planRevision(etat, {table: 7, random: () => 0});
  assert.deepEqual(plan.map(item => item.cle), ["7-8", "6-7"]);
  assert.ok(plan.every(item => parcours.facteursFait(item.cle).includes(7)));
  // Dix calculs vus ou plus : dix questions, jamais deux fois le même.
  let plein = parcours.creerParcours();
  parcours.FAITS.slice(0, 14).forEach(cle => { plein = repondre(plein, cle, cle.endsWith("5"), "2026-09-02"); });
  const dix = parcours.planRevision(plein, {random: () => 0});
  assert.equal(dix.length, 10);
  assert.equal(new Set(dix.map(item => item.cle)).size, 10);
});

test("la prochaine étape conseille une révision dès 5 calculs à travailler", () => {
  let etat = parcours.creerParcours();
  ["2-6", "3-7", "4-8", "5-9", "6-6"].slice(0, 4).forEach(cle => { etat = repondre(etat, cle, false); });
  assert.notEqual(parcours.prochaineEtape(etat).type, "revision", "4 calculs : pas encore de conseil");
  etat = repondre(etat, "6-6", false);
  const etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "revision");
  assert.match(etape.libelle, /5 calculs à travailler/);
  assert.deepEqual(etape.config, {mode: "revision", table: null});
  assert.equal(parcours.etatAffichage(etat).prochaine.type, "revision");
});

test("les étoiles valident par échantillon : le parcours ne dit « fini » que grille verte", () => {
  let etat = legende(5);
  assert.equal(etat.expert.couronne, DATE);
  let etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "legende", "Légende avec une grille jamais remplie : la révision n’a rien à reprendre, c’est l’escalier qui fait rencontrer les calculs");
  assert.match(etape.libelle, /36 calculs que tu n’as jamais rencontrés : rejoue une marche/);
  assert.deepEqual(etape.config, parcours.configEtoile(5));

  etat = repondre(etat, "7-8", false, "2026-09-01");
  etat = repondre(etat, "6-9", true, "2026-09-01");
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "revision", "des calculs vus mais pas sus : révision conseillée");
  assert.match(etape.libelle, /2 calculs à passer au vert/);
  assert.deepEqual(etape.config, {mode: "revision", table: null});

  parcours.FAITS.forEach(cle => {
    etat = repondre(etat, cle, true, "2026-09-02");
    etat = repondre(etat, cle, true, "2026-09-03");
    etat = repondre(etat, cle, true, "2026-09-04");
  });
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "legende");
  assert.match(etape.libelle, /36 calculs sont verts/);
});

test("passerelle : une table acquise avec 2 calculs à 0 est « à revoir », le ✓ reste", () => {
  let etat = acquerir(parcours.creerParcours(), 7);
  etat = repondre(etat, "7-8", false);
  assert.deepEqual(parcours.tablesARevoir(etat), [], "un seul calcul à 0 ne suffit pas");
  etat = repondre(etat, "6-7", false);
  assert.deepEqual(parcours.tablesARevoir(etat), [7]);
  const affichage = parcours.etatAffichage(etat);
  const ligne7 = affichage.lignes.find(ligne => ligne.table === 7);
  assert.equal(ligne7.aRevoir, true);
  assert.equal(ligne7.acquise, DATE, "le ✓ reste");
  assert.equal(affichage.lignes.find(ligne => ligne.table === 6).aRevoir, false, "la table de 6 n’est pas acquise");
  assert.deepEqual(affichage.calculs, parcours.resumeCalculs(etat));
});

test("la grille est sauvegardée avec le parcours et résiste aux données abîmées", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "6-7", false);
  etat = repondre(etat, "2-5", true);
  const relu = parcours.normaliserParcours(JSON.parse(JSON.stringify(etat)));
  assert.deepEqual(relu, etat);

  const abime = parcours.normaliserParcours({calculs: {
    "6-7": {cases: 99, vu: DATE, erreur: null},
    "7-10": {cases: 2, vu: DATE, erreur: null},
    "2-5": {cases: 2},
    "3-3": "pas un objet"
  }});
  assert.equal(abime.calculs["6-7"].cases, 0, "un nombre de cases invalide repart à 0, comme le reste du parcours");
  assert.equal(abime.calculs["7-10"], undefined, "fait hors grille ignoré");
  assert.equal(abime.calculs["2-5"], undefined, "un fait sans date de passage est ignoré");
  assert.equal(abime.calculs["3-3"], undefined);

  assert.equal(parcours.estVide(etat), false, "des calculs enregistrés = un parcours non vide");
  assert.ok(parcours.estVide(parcours.remettreAZero(etat)), "recommencer à zéro efface aussi la grille");
});

test("appliquerReponse ne modifie jamais l’objet reçu", () => {
  const etat = repondre(parcours.creerParcours(), "6-7", true);
  const copie = JSON.stringify(etat);
  parcours.appliquerReponse(etat, "6-7", {correcte: false, date: DATE});
  parcours.planRevision(etat);
  parcours.grilleCalculs(etat);
  assert.equal(JSON.stringify(etat), copie);
});

const html = await (await import("node:fs/promises")).readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const confidentialite = await (await import("node:fs/promises")).readFile(new URL("../confidentialite.html", import.meta.url), "utf8");

test("la page a l’écran Mes calculs : entrée depuis l’accueil, grille, détail, révision", () => {
  assert.match(html, /\["intro", "launch", "play", "result", "parcours", "calculs"\]/);
  assert.match(html, /id="open-calculs" class="acc-lien"[\s\S]*Mes calculs/, "l’entrée est la carte de l’accueil (lot 2)");
  assert.doesNotMatch(html, /id="parcours-calculs"/, "plus de bouton-carte dans le parcours");
  assert.match(html, /id="calculs"[^>]*class="calculs-screen"/);
  assert.match(html, /id="calculs-resume"/);
  assert.match(html, /id="calculs-grille"/);
  assert.match(html, /id="calculs-detail"/);
  assert.match(html, /id="calculs-reviser"[\s\S]*Réviser mes calculs/);
  assert.ok(html.indexOf('id="calculs-reviser"') < html.indexOf('id="calculs-resume"'), "Réviser EN HAUT, au-dessus du résumé et de la grille (décision du 08/09/2026)");
  assert.ok(html.indexOf('id="calculs-resume"') < html.indexOf('id="calculs-grille"'));
  assert.doesNotMatch(html, /class="calculs-note"/, "le paragraphe de règles a disparu : les règles vivent dans « Comment ça marche ? »");
  assert.match(html, /id="calculs-back"/);
  assert.match(html, /PARCOURS\.serieAlimenteGrille/);
  assert.match(html, /PARCOURS\.appliquerReponse/);
  assert.match(html, /PARCOURS\.planRevision/);
  assert.match(html, /CORE\.tableQuestion/);
  assert.match(html, /ouvrir === "calculs"\) openCalculs\(\)/);
});

test("le détail d’une case écrit le calcul dans les deux sens et empile ses informations", () => {
  assert.match(html, /ligne === colonne/, "la diagonale est traitée à part");
  assert.match(html, /\? `\$\{ligne\} × \$\{colonne\} = \$\{produit\}`/, "sur la diagonale le calcul n’est pas répété");
  assert.match(html, /: `\$\{ligne\} × \$\{colonne\} = \$\{colonne\} × \$\{ligne\} = \$\{produit\}`/, "ailleurs les deux sens sont écrits");
  assert.doesNotMatch(html, /zone\.textContent = morceaux\.join/, "le détail n’aligne plus ses informations derrière des points");
  assert.match(html, /ligneDetail\("mc-detail-calcul", calcul\)/);
  assert.match(html, /ligneDetail\("mc-detail-etat", /);
  assert.match(html, /majuscule\(LIBELLES_ETATS_CALCULS\[etat\]\)/);
  assert.match(html, /Une case par jour : reviens demain\./, "la date n’est écrite que lorsqu’elle veut dire quelque chose");
  assert.match(html, /function jourDuJour\(\) \{\s*return PARCOURS\.jourLocal\(\);/, "même convention de date que le moteur : le jour local (lot 3)");
  assert.match(html, /\.mc-detail-calcul \{ font-size: 1\.05rem/);
  assert.match(html, /\.calculs-detail \{[\s\S]*?min-height: 78px/, "la hauteur réservée couvre trois lignes : la grille ne saute pas");
});

test("seule la première réponse compte pour la grille, et un raté ne revient qu’une fois", () => {
  assert.match(html, /if \(!question\.retry\) alimenterMesCalculs\(question, correct && !skip\);/, "les calculs qui reviennent n’alimentent pas la grille");
  assert.match(html, /const willRetry = !correct && !question\.retry;/, "un calcul raté revient une seule fois par série de révision");
  assert.doesNotMatch(html, /repartira dans la prochaine révision/, "la règle n’est plus écrite sur l’écran de résultat (lot 2)");
  assert.match(html, /\$\("result-detail"\)\.textContent = `Série terminée en \$\{formatElapsed\(elapsed\)\}\.`;/);
});

test("la révision : jusqu’à 10 questions sans chrono, retour des ratés, Encore une révision", () => {
  assert.match(html, /function startRevision\(/);
  assert.match(html, /mode: "revision"/);
  assert.match(html, /Encore une révision/);
  assert.match(html, /if \(!plan\.length\) return;/, "une grille vide ne lance rien");
  assert.match(html, /reviser\.classList\.toggle\("is-vide", !questionsRevision\(resume\)\)/, "et le bouton le montre");
  assert.match(html, /au vert/);
  assert.match(html, /au premier essai/);
  assert.match(html, /if \(entry\.retour\) \{[\s\S]*?number\.textContent = "Il est revenu";/, "un calcul qui revient n’est pas numéroté Question 11, 12… — il est marqué « Il est revenu » (lot R2 : les autres n’ont plus de numéro)");
  assert.match(html, /Rien à revoir pour l’instant : \$\{pluriel\(questions, "question"\)\} pour entretenir ta grille\./);
  assert.match(html, /Tout est su ! 10 questions pour entretenir ta grille\./);
  assert.match(html, /Ta grille est vide : elle se remplit dans Je m’entraîne et les validations\./);
  assert.doesNotMatch(html, /on découvre les 10 premiers calculs/, "plus de découverte de calculs par la révision (lot 3)");
  assert.doesNotMatch(html, /L’étoile valide toutes tes tables d’un coup/, "lot 3 : plus de raccourci « ★ valide les 9 tables »");
  assert.match(html, /id="result-verdict"/, "lot R2 : la fête est le cadre du verdict");
  assert.match(html, /renderVerdict\(suivi, elapsed\)/);
  assert.match(html, /verdict\.titre = "Légende des tables !";/, "écran de fête 👑");
  assert.match(html, /Table de \$\{validation\.table\} acquise !/, "écran de fête 🎉 à chaque table validée");
  assert.match(html, /animation: none !important/, "la fête respecte prefers-reduced-motion");
});

test("la fiche imprimable a une page 2 « Mes calculs » et le PDF vide aussi", async () => {
  const fs = await import("node:fs/promises");
  assert.match(html, /id="fiche-calculs"/);
  assert.match(html, /fiche-page2/);
  assert.match(html, /Mes calculs<\/h1>|Mes<br>calculs<\/h1>|<h1>Mes calculs/);
  const pdf = await fs.readFile(new URL("../outils/calcul_mental/fiche_parcours_tables.pdf", import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.match(pdf.toString("latin1"), /\/Count 2/, "le PDF vide fait deux pages");
  const source = await fs.readFile(new URL("../_sources/defi-tables/generer_fiche_parcours.py", import.meta.url), "utf8");
  assert.match(source, /MES CALCULS/);
});

test("la page Confidentialité mentionne la grille des calculs", () => {
  assert.match(confidentialite, /par calcul|grille des calculs|Mes calculs/);
});
