// Lot MÉMOIRE « Mes calculs du jour » (12/09/2026) : cinq boîtes par calcul et
// une échéance — le moteur, la migration des grilles existantes, les trois
// élèves types (les tests d'acceptation du lot), et ce que la page, le serveur
// et la fiche en montrent.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const core = require("../outils/calcul_mental/defi_tables_core.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const prof = await readFile(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
const applis = await readFile(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");

const J = n => P.ajouterJours("2026-09-14", n); // lundi 14 septembre 2026 + n jours
const normaliser = config => core.normalizeConfiguration(config);

// Joue une série entière : chaque calcul reçoit sa première réponse (juste,
// sauf ceux de « rates »), puis la série est appliquée au parcours.
function jouer(p, config, faits, {date, rates = []}) {
  faits.forEach(cle => { p = P.appliquerReponse(p, cle, {correcte: !rates.includes(cle), date}).parcours; });
  return P.appliquerSerie(p, normaliser(config), {correct: faits.length - rates.length, total: faits.length, date}).parcours;
}
// Une révision du jour : les dus, 10 par 10, jusqu'à zéro. Rend le nombre de séries.
function reviser(p, date, rates = []) {
  let series = 0;
  for (;;) {
    const plan = P.planRevision(p, {aujourdhui: date, random: () => 0});
    if (!plan.length) break;
    series += 1;
    plan.forEach(item => { p = P.appliquerReponse(p, item.cle, {correcte: !rates.includes(item.cle), date}).parcours; });
    if (series > 10) throw new Error("la révision tourne en rond");
  }
  return {parcours: p, series};
}
const boites = p => P.resumeCalculs(p).boites;

test("migration d’une grille d’avant (version 2) : cases 0/1/2/3 → boîtes 1/2/3/4, rien de vert ne redevient bleu, échéance depuis la dernière date", () => {
  const v2 = {version: 2, rang: 1, jours: ["2026-09-10"], tables: {2: {acquise: "2026-09-10"}}, calculs: {
    "2-2": {cases: 0, vu: "2026-09-10", erreur: "2026-09-10", gagne: null},
    "2-3": {cases: 1, vu: "2026-09-10", erreur: null, gagne: "2026-09-10"},
    "2-4": {cases: 2, vu: "2026-09-11", erreur: "2026-09-09", gagne: "2026-09-11"},
    "2-5": {cases: 3, vu: "2026-09-08", erreur: null, gagne: "2026-09-08"},
    "2-6": {cases: 3, vu: "2026-09-08", erreur: null}
  }};
  const p = P.normaliserParcours(v2);
  assert.equal(p.version, 3);
  assert.equal(p.rang, 1, "la migration du lot 3 ne rejoue pas : le rang et les jours restent");
  assert.deepEqual(p.jours, ["2026-09-10"]);
  assert.deepEqual(p.calculs["2-2"], {boite: 1, cases: 0, vu: "2026-09-10", erreur: "2026-09-10", gagne: null, echeance: "2026-09-10"}, "un rouge est dû tout de suite");
  assert.deepEqual(p.calculs["2-3"], {boite: 2, cases: 1, vu: "2026-09-10", erreur: null, gagne: "2026-09-10", echeance: "2026-09-11"});
  assert.deepEqual(p.calculs["2-4"], {boite: 3, cases: 2, vu: "2026-09-11", erreur: "2026-09-09", gagne: "2026-09-11", echeance: "2026-09-14"});
  assert.deepEqual(p.calculs["2-5"], {boite: 4, cases: 3, vu: "2026-09-08", erreur: null, gagne: "2026-09-08", echeance: "2026-09-15"}, "3 cases → boîte 4 : toujours vert");
  assert.deepEqual(p.calculs["2-6"], {boite: 4, cases: 3, vu: "2026-09-08", erreur: null, gagne: null, echeance: "2026-09-15"}, "sans gain connu : depuis le dernier passage");
  ["2-2", "2-3", "2-4", "2-5", "2-6"].forEach(cle => assert.equal(P.etatFait(p.calculs[cle]), P.etatFait({boite: v2.calculs[cle].cases + 1}), "la couleur ne change pas"));
  assert.deepEqual(P.calculsDus(p, {aujourdhui: "2026-09-14"}), ["2-2", "2-3", "2-4"], "le 14 : les trois premiers sont dus (le rouge d’abord), les verts reviennent le 15");
  // Relu, un parcours migré ne migre pas deux fois et ressort identique.
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(p))), p);
});

test("le miroir « cases » : un appareil resté sur l’appli d’avant lit la bonne couleur, et ce qu’il renvoie est migré sans rien casser", () => {
  let p = P.creerParcours();
  ["2026-09-01", "2026-09-02", "2026-09-05", "2026-09-12", "2026-09-26"].forEach(jour => { p = P.appliquerReponse(p, "7-8", {correcte: true, date: jour}).parcours; });
  assert.equal(p.calculs["7-8"].boite, 5);
  assert.equal(p.calculs["7-8"].cases, 3, "boîte 5 → 3 cases : vert pour l’ancienne appli, qui ne connaît que 0 à 3");
  // L'ancienne appli ne garde que cases / vu / erreur / gagne et renvoie une version 2.
  const renvoye = {version: 2, calculs: {"7-8": {cases: 3, vu: "2026-09-27", erreur: null, gagne: "2026-09-27"}}};
  const relu = P.normaliserParcours(renvoye);
  assert.equal(relu.calculs["7-8"].boite, 4, "au pire, boîte 5 → 4 : toujours su, jamais une grille vide");
  const fusion = P.fusionner(p, renvoye);
  assert.equal(fusion.calculs["7-8"].boite, 4, "à la fusion, le jour le plus récent (l’ancien appareil) gagne — en vert");
  assert.equal(P.fusionner(renvoye, p).calculs["7-8"].boite, 4);
});

test("un calcul raté aujourd’hui n’est plus « dû » aujourd’hui : la révision ne tourne pas en rond, il revient demain", () => {
  let p = P.creerParcours();
  P.faitsDeLaTable(2).forEach(cle => { p = P.appliquerReponse(p, cle, {correcte: true, date: J(0)}).parcours; });
  assert.equal(P.agendaCalculs(p, J(1)).dus, 8);
  const {parcours: apres, series} = reviser(p, J(1), ["2-3", "2-7"]);
  assert.equal(series, 1, "une seule série : les deux ratés ne reviennent pas dans une 2e série le même jour");
  assert.equal(P.agendaCalculs(apres, J(1)).dus, 0);
  assert.deepEqual(P.agendaCalculs(apres, J(1)).prochain, {jour: J(2), dans: 1, calculs: 2}, "« Reviens demain : 2 calculs t’attendront »");
  assert.deepEqual(P.calculsDus(apres, {aujourdhui: J(2)}), ["2-3", "2-7"], "demain, ils sont dus — et ils peuvent monter");
  assert.equal(P.appliquerReponse(apres, "2-3", {correcte: true, date: J(2)}).fait.monte, true);
  assert.deepEqual(P.calculsEnRetard(apres, J(3)).sort(), ["2-3", "2-7"], "pas refaits le 15 : en retard le 16");
});

test("élève 1 · aucune table sue : la table de 2 sur plusieurs jours, ses calculs montent via Réviser ET le mélange pendant qu’il apprend la 10", () => {
  let p = P.creerParcours();
  const t2 = P.faitsDeLaTable(2);
  // Lundi : trois entraînements (3 × 2 raté au premier), puis la validation.
  p = jouer(p, P.configEntraine(2, "desordre"), t2, {date: J(0), rates: ["2-3"]});
  p = jouer(p, P.configEntraine(2, "trous"), t2, {date: J(0)});
  p = jouer(p, P.configEntraine(2, "mixte"), t2, {date: J(0)});
  assert.deepEqual(boites(p), [1, 7, 0, 0, 0], "7 en boîte 2 ; 3 × 2 en boîte 1 (raté, puis réussi le même jour : pas de regain)");
  p = jouer(p, P.configValidation(2), t2.concat(t2.slice(0, 12)), {date: J(0)});
  assert.deepEqual(P.tablesAcquises(p), [2]);
  assert.deepEqual(boites(p), [1, 7, 0, 0, 0], "la validation le jour même ne fait rien monter : rien n’est dû");
  assert.equal(P.prochaineEtape(p, J(0)).type, "apprends", "lundi soir : rien de dû, la prochaine étape est la table de 10 (jamais touchée : J’apprends)");
  assert.equal(P.prochaineEtape(p, J(0)).table, 10);
  // Mardi : « Mes calculs du jour · 8 calculs » en tête, puis la table de 10.
  assert.equal(P.prochaineEtape(p, J(1)).type, "revision");
  assert.equal(P.prochaineEtape(p, J(1)).dus, 8);
  let r = reviser(p, J(1)); p = r.parcours;
  assert.equal(r.series, 1);
  assert.deepEqual(boites(p), [0, 1, 7, 0, 0], "7 montent en boîte 3 (retour vendredi), 3 × 2 en boîte 2 (retour mercredi)");
  assert.equal(P.prochaineEtape(p, J(1)).type, "apprends", "la révision faite, Ma table reprend le rond bleu");
  p = jouer(p, P.configEntraine(10, "desordre"), [], {date: J(1)}); // la table de 10 n'est pas dans la grille
  // Mercredi : 3 × 2 seul ; jeudi : rien ; vendredi : les 7 (boîte 3 → 4, verts).
  assert.deepEqual(P.calculsDus(p, {aujourdhui: J(2)}), ["2-3"]);
  p = reviser(p, J(2)).parcours;
  assert.equal(P.agendaCalculs(p, J(3)).dus, 0, "jeudi : rien de dû, pas de bloc");
  assert.equal(P.agendaCalculs(p, J(4)).dus, 7);
  // Vendredi, il valide la table de 10 puis joue le mélange (2 et 10) au lieu de Réviser :
  // les calculs de la table de 2 qui s'y trouvent montent aussi.
  p = P.appliquerSerie(p, normaliser(P.configValidation(10)), {correct: 20, total: 20, date: J(4)}).parcours;
  assert.deepEqual(P.tablesAcquises(p), [2, 10]);
  const melange = P.configMelange(p);
  p = jouer(p, melange, ["2-4", "2-5", "2-6"], {date: J(4)});
  assert.equal(P.etatFait(p.calculs["2-4"]), "su", "2 × 4 était dû : réussi dans le mélange, il passe en boîte 4 — vert");
  assert.equal(p.calculs["2-4"].echeance, J(11));
  assert.equal(P.agendaCalculs(p, J(4)).dus, 4, "il reste 4 calculs du jour : le bloc reste, un conseil");
  assert.equal(P.melangeDu(p), false);
});

test("élève 2 · quatre tables déjà sues : validations rapides, ~24 dus le lendemain, « Encore N », boîte 4 en deux semaines ; le parcours ne l’attend pas", () => {
  let p = P.creerParcours();
  [2, 10, 5, 3].forEach(table => {
    const faits = P.faitsDeLaTable(table);
    p = jouer(p, P.configValidation(table), faits.length ? faits.concat(faits.slice(0, 20 - faits.length)) : [], {date: J(0)});
    if (P.melangeDu(p)) p = jouer(p, P.configMelange(p), faits, {date: J(0)});
  });
  assert.deepEqual(P.tablesAcquises(p), [2, 3, 5, 10]);
  assert.equal(P.rang(p.rang).nom, "Argent");
  assert.equal(P.agendaCalculs(p, J(0)).dus, 0, "lundi soir : rien de dû");
  assert.equal(P.agendaCalculs(p, J(1)).dus, 21, "mardi : 21 calculs (les 8 + 7 + 6 des tables 2, 3 et 5) sont dus");
  let r = reviser(p, J(1)); p = r.parcours;
  assert.equal(r.series, 3, "10 + 10 + 1 : deux fois « Encore N → Continuer »");
  assert.deepEqual(boites(p), [0, 0, 21, 0, 0]);
  assert.equal(P.agendaCalculs(p, J(1)).dus, 0, "à zéro, rejouer ne fait plus rien monter");
  assert.deepEqual(P.planRevision(p, {aujourdhui: J(1)}), []);
  assert.equal(P.agendaCalculs(p, J(2)).dus, 0);
  assert.equal(P.agendaCalculs(p, J(4)).dus, 21, "vendredi (+3) : ils reviennent");
  p = reviser(p, J(4)).parcours;
  assert.deepEqual(boites(p), [0, 0, 0, 21, 0], "boîte 4 : verts, en deux semaines… le jeudi suivant (+7)");
  assert.equal(P.agendaCalculs(p, J(11)).dus, 21);
  p = reviser(p, J(11)).parcours;
  assert.deepEqual(boites(p), [0, 0, 0, 0, 21], "boîte 5 : l’entretien, toutes les deux semaines");
  assert.equal(P.agendaCalculs(p, J(25)).dus, 21);
  // Le parcours ne l'a jamais attendu : la table de 4 se travaille quand il veut.
  assert.equal(P.prochaineEtape(p, J(5)).type, "apprends");
  assert.equal(P.prochaineEtape(p, J(5)).table, 4);
});

test("élève 3 · un 3e qui sait tout : 9 tables en une soirée, Platine ; 36 dus le lendemain ; une marche pose 25 calculs sur 36 et ils montent seuls", () => {
  let p = P.creerParcours();
  P.ORDRE_CONSEIL.forEach(table => {
    const faits = P.faitsDeLaTable(table);
    p = jouer(p, P.configValidation(table), faits.length ? faits.concat(faits.slice(0, 20 - faits.length)) : [], {date: J(0)});
    if (P.melangeDu(p)) p = jouer(p, P.configMelange(p), faits, {date: J(0)});
  });
  assert.equal(P.tablesAcquises(p).length, 9);
  assert.equal(P.rang(p.rang).nom, "Platine");
  assert.equal(P.escalierOuvert(p), true);
  assert.equal(Object.keys(p.calculs).length, 36);
  assert.deepEqual(boites(p), [0, 36, 0, 0, 0]);
  assert.equal(P.agendaCalculs(p, J(1)).dus, 36, "36 dus le lendemain");
  assert.equal(P.prochaineEtape(p, J(1)).type, "revision", "le bloc du jour reste un conseil : rien ne verrouille l’escalier");
  // Mardi, il tente ★ (25 calculs sur 36) sans passer par Réviser.
  const marche = P.FAITS.slice(0, 25);
  p = jouer(p, P.configEtoile(1), marche, {date: J(1)});
  assert.equal(p.expert.etoiles, 1);
  assert.deepEqual(boites(p), [0, 11, 25, 0, 0], "les 25 calculs de la marche sont montés seuls ; 11 restent dus");
  assert.equal(P.agendaCalculs(p, J(1)).dus, 11);
  assert.equal(P.prochaineEtape(p, J(1)).dus, 11);
  // Il ne fait pas les 11 : mercredi, ils sont en retard sur la page du professeur.
  assert.equal(P.calculsEnRetard(p, J(2)).length, 11);
  assert.equal(P.calculsEnRetard(p, J(1)).length, 0, "dus aujourd’hui, pas encore en retard");
  assert.equal(P.prochaineEtape(p, J(2)).type, "revision");
  // Une erreur en boîte 5 ne renvoie jamais en boîte 1.
  let entretenu = P.normaliserParcours({calculs: {"7-8": {boite: 5, vu: J(0), erreur: null, gagne: J(0), echeance: J(14)}}});
  entretenu = P.appliquerReponse(entretenu, "7-8", {correcte: false, date: J(14)}).parcours;
  assert.deepEqual([entretenu.calculs["7-8"].boite, P.etatFait(entretenu.calculs["7-8"])], [4, "su"]);
});

test("la page : le bloc du jour en tête et conseillé, l’unique rond bleu, le bandeau des boîtes, les cinq cases, la notice", () => {
  assert.match(html, /<button id="acc-reviser" class="reviser etape" type="button" hidden><span class="num" aria-hidden="true"><svg class="neurones"/, "le rond : des neurones qui se relient (idée de Gwenaël)");
  assert.match(html, /reviser\.hidden = !agenda\.dus;/, "le bloc n’existe que quand des calculs sont dus");
  assert.match(html, /reviser\.classList\.toggle\("is-next", conseil === "reviser"\);/);
  assert.match(html, /conseille: conseil === "expert",/, "la marche de l’escalier n’est plus conseillée d’office : un seul rond bleu à l’écran");
  assert.match(html, /renderJours\(\{\.\.\.etat\.jours, demain: agenda\.dus \? 0 : etat\.jours\.demain\}\);/, "« N calculs demain » seulement quand rien n’est dû");
  assert.match(html, /function renderBoites\(resume\)/);
  assert.match(html, /nom\.textContent = `boîte \$\{boite\}`;/, "les tuiles : le nombre et « boîte N », rien d’autre (choix de Gwenaël)");
  assert.match(html, /calculsSelection = choisie \? null : \{boite\};/, "toucher une tuile liste ses calculs");
  assert.match(html, /PARCOURS\.calculsDeLaBoite\(parcours, boite\)/);
  assert.doesNotMatch(html, /calculs-resume|resumeCalculsTexte/, "la ligne « 14 sus · 8 en route · 4 à revoir » a laissé la place aux tuiles colorées");
  assert.match(html, /\$\("calculs-hint"\)\.hidden = Boolean\(agenda\.dus\);/, "la phrase sous le bouton seulement quand il n’y a rien à faire");
  assert.match(html, /for \(let index = 0; index < PARCOURS\.SEUILS\.revision\.boites; index \+= 1\) \{\s*const caseFait = document\.createElement\("span"\);\s*caseFait\.className = `mc-case\$\{index < cellule\.boite \? " is-pleine" : ""\}`;/, "cinq petites cases par cellule de la grille");
  assert.equal((html.match(/<span class="mc-cell[^"]*"><span class="mc-cases">(?:<span class="mc-case(?: is-pleine)?"><\/span>){5}<\/span><\/span>/g) || []).length, 4, "la légende : quatre états à cinq cases");
  assert.match(html, /@media \(max-width: 479px\) \{\s*\.mc-cases \{ gap: 1\.5px; \}\s*\.mc-case \{ width: 5px; height: 5px;/, "au téléphone, 5 × 5 px + 4 × 1,5 px tiennent dans une cellule de ~33 px");
  assert.match(html, /<b>Mes calculs\.<\/b> Chaque calcul a 5 boîtes\./);
  assert.match(html, /<b>Mes calculs du jour\.<\/b>/);
  assert.doesNotMatch(html, /une seule par jour|trois jours différents|Une case par jour/, "plus une trace de « une case par jour »");
  // « Encore 10 calculs » à zéro (décision du 12/09) : sur le résultat et dans Mes calculs, en secondaire.
  assert.match(html, /if \(!restants && PARCOURS\.calculsAVenir\(parcours, \{table\}\)\.length\) \{\s*const encore = document\.createElement\("button"\);\s*encore\.type = "button";\s*encore\.className = "secondary";/, "sur le résultat, quand plus rien n’est dû");
  assert.match(html, /const libre = !agenda\.dus && PARCOURS\.calculsAVenir\(parcours\)\.length > 0;/, "dans Mes calculs, le bouton devient « Encore N calculs »");
  assert.match(html, /bouton\.classList\.toggle\("secondary", !agenda\.dus\);/, "en secondaire : ce n’est plus l’étape du jour");
  assert.match(html, /"Rien ne monte : ces calculs n’étaient pas encore à revoir"/);
  assert.match(html, /defi_tables_core\.js\?v=20260912-1/);
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20260912-1/);
});

test("le serveur : « boite » et « echeance » acceptés, « cases » toujours ; la page du professeur compte les calculs en retard", async () => {
  const cles = applis.match(/'cles' => \[([\s\S]*?)\]/)[1];
  ["boite", "echeance", "cases"].forEach(cle => assert.match(cles, new RegExp(`'${cle}'`), `« ${cle} » déclaré`));
  const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "la copie serveur du moteur est identique");
  assert.match(prof, /<option value="retard">Calculs en retard<\/option>/);
  assert.match(prof, /<th><button type="button" data-tri="retard">En retard<\/button><\/th>/);
  assert.match(prof, /retard: PARCOURS\.calculsEnRetard \? PARCOURS\.calculsEnRetard\(parcours\) : null,/);
  assert.match(prof, /if \(tri\.colonne === "retard"\) return eleve\.lu\.retard \? eleve\.lu\.retard\.length : -1;/);
  assert.match(prof, /cRetard\.dataset\.libelle = "En retard";/);
  assert.match(prof, /ligne\.append\(cNom, cCode, cAcquises, cTravailler, cRetard, cMelange, cExpert, cDate, cActions\);/);
  // Le compteur est bien celui du moteur : dus AVANT aujourd'hui.
  const p = P.normaliserParcours({calculs: {
    "2-2": {boite: 2, vu: "2026-09-10", erreur: null, gagne: "2026-09-10", echeance: "2026-09-11"},
    "2-3": {boite: 3, vu: "2026-09-10", erreur: null, gagne: "2026-09-10", echeance: "2026-09-14"},
    "2-4": {boite: 4, vu: "2026-09-10", erreur: null, gagne: "2026-09-10", echeance: "2026-09-20"}
  }});
  assert.deepEqual(P.calculsEnRetard(p, "2026-09-14"), ["2-2"], "2-3 est dû aujourd’hui (pas en retard), 2-4 revient le 20");
});
