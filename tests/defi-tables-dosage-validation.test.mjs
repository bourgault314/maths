// Lot « dosage + validation » de Défi tables (19/09/2026) — le parcours d'une
// table, points 1 et 2 de Claire, Jackie et Gwenaël :
//
//  - le compteur « fois » : combien de fois chaque activité de J'apprends et
//    chaque entraînement ont été faits (l'accueil montre un nombre qui ne fait
//    que monter, plus cinq ronds qui se lisaient « niveau terminé ») ;
//  - le seuil de la validation : les trois entraînements réussis ne suffisent
//    plus, il faut AUSSI les 8 calculs de la table en boîte 3 (deux
//    rendez-vous réussis, donc au plus tôt le lendemain) — un conseil, jamais
//    un verrou ; l'accueil et l'écran de résultat disent le rendez-vous ;
//  - la table acquise choisie depuis « Changer de table » s'affiche (le point
//    de Jackie : elle affichait la table de 2 sans un mot) et l'option
//    « Comme la validation, en 2 min » y reste proposée.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fauxStockage} from "./defi-tables-faux-monde.mjs";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const core = require("../outils/calcul_mental/defi_tables_core.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const applis = await readFile(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");

const J1 = "2026-09-14", J2 = "2026-09-15", J5 = "2026-09-18";

function jouer(etat, config, correct, total, date = J1) {
  return P.appliquerSerie(etat, core.normalizeConfiguration(config), {correct, total, date});
}
// Une série qui répond aussi aux calculs de la grille (comme la page le fait).
function jouerSerie(etat, config, faits, {date = J1, rates = []} = {}) {
  faits.forEach(cle => { etat = P.appliquerReponse(etat, cle, {correcte: !rates.includes(cle), date}).parcours; });
  return jouer(etat, config, faits.length - rates.length, faits.length, date).parcours;
}
function troisReussis(date = J1) {
  let p = P.creerParcours();
  ["desordre", "trous", "mixte"].forEach(e => { p = jouerSerie(p, P.configEntraine(7, e), P.faitsDeLaTable(7), {date}); });
  return p;
}

// ------------------------------------------------------------ le compteur « fois »

test("les 8 calculs de la table de 7, clé « min-max » : ni ×0, ni ×1, ni ×10", () => {
  assert.deepEqual(P.faitsDeLaTable(7), ["2-7", "3-7", "4-7", "5-7", "6-7", "7-7", "7-8", "7-9"]);
  assert.equal(P.faitsDeLaTable(2).length, 8);
  assert.equal(P.faitsDeLaTable(10).length, 0, "la table de 10 n’a pas de case dans la grille : son seuil est vide, donc toujours atteint");
});

test("chaque table part avec un compteur à zéro pour les cinq activités et les trois entraînements", () => {
  const p = P.creerParcours();
  assert.deepEqual(P.CLES_FOIS, ["beads", "construct", "gaps", "ordered", "random", "desordre", "trous", "mixte"]);
  P.TABLES.forEach(table => assert.deepEqual(p.tables[table].fois, {beads: 0, construct: 0, gaps: 0, ordered: 0, random: 0, desordre: 0, trous: 0, mixte: 0}));
});

test("J’apprends : chaque activité terminée compte une fois de plus, même refaite le même jour ; l’état reste 0/1/2", () => {
  let p = P.creerParcours();
  let r = jouer(p, P.configApprends(7, "beads"), 10, 10);
  assert.deepEqual(r.evenements, [{type: "apprends", table: 7, activite: "beads", termines: 1, fois: 1}]);
  p = r.parcours;
  p = jouer(p, P.configApprends(7, "beads"), 10, 10).parcours;
  r = jouer(p, P.configApprends(7, "beads"), 10, 10);
  assert.equal(r.evenements[0].fois, 3);
  assert.equal(r.parcours.tables[7].fois.beads, 3);
  assert.equal(r.parcours.tables[7].apprends.beads, 2, "l’état ne dépasse jamais 2");
  assert.equal(r.parcours.tables[7].fois.construct, 0, "les autres activités ne bougent pas");
  assert.equal(r.parcours.tables[2].fois.beads, 0, "ni les autres tables");
  // Commencer sans finir ne compte pas.
  const commence = P.demarrerSerie(P.creerParcours(), core.normalizeConfiguration(P.configApprends(7, "gaps")));
  assert.equal(commence.tables[7].apprends.gaps, 1);
  assert.equal(commence.tables[7].fois.gaps, 0);
});

test("Je m’entraîne : un entraînement terminé compte, réussi ou non — les ronds disent « réussi », le nombre dit « combien de fois »", () => {
  let p = P.creerParcours();
  let r = jouer(p, P.configEntraine(7, "desordre"), 6, 10);
  assert.equal(r.evenements[0].reussi, false);
  assert.equal(r.evenements[0].fois, 1, "raté, mais fait");
  p = r.parcours;
  assert.equal(p.tables[7].entraine.desordre, 1);
  r = jouer(p, P.configEntraine(7, "desordre"), 10, 10);
  assert.equal(r.evenements[0].fois, 2);
  assert.equal(r.parcours.tables[7].entraine.desordre, 2);
  assert.equal(r.parcours.tables[7].fois.desordre, 2);
  assert.equal(r.parcours.tables[7].fois.trous, 0);
});

test("un ancien parcours sans « fois » se lit à zéro ; une valeur folle est bornée ; la copie est propre", () => {
  const ancien = P.normaliserParcours({version: 3, tables: {7: {apprends: {beads: 2}, entraine: {desordre: 2}}}});
  assert.deepEqual(ancien.tables[7].fois, {beads: 0, construct: 0, gaps: 0, ordered: 0, random: 0, desordre: 0, trous: 0, mixte: 0}, "clé absente = 0, rien ne casse");
  const borne = P.normaliserParcours({version: 3, tables: {7: {fois: {beads: 123456, trous: -4, mixte: "7", gaps: "n’importe quoi"}}}});
  assert.equal(borne.tables[7].fois.beads, P.FOIS_MAX);
  assert.equal(borne.tables[7].fois.trous, 0);
  assert.equal(borne.tables[7].fois.mixte, 7);
  assert.equal(borne.tables[7].fois.gaps, 0);
  // Le plafond tient aussi à l'incrément.
  const plein = P.normaliserParcours({version: 3, tables: {7: {fois: {beads: P.FOIS_MAX}}}});
  assert.equal(jouer(plein, P.configApprends(7, "beads"), 10, 10).parcours.tables[7].fois.beads, P.FOIS_MAX);
  // Sérialisé puis relu : identique (c'est ce qui part au serveur).
  const p = jouer(jouer(P.creerParcours(), P.configApprends(7, "beads"), 10, 10).parcours, P.configEntraine(7, "trous"), 10, 10).parcours;
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(p))).tables[7].fois, p.tables[7].fois);
});

test("à la fusion de deux appareils, le compteur prend le plus grand des deux (pas la somme)", () => {
  const a = P.normaliserParcours({version: 3, tables: {7: {fois: {beads: 3, desordre: 1}}}});
  const b = P.normaliserParcours({version: 3, tables: {7: {fois: {beads: 2, desordre: 4, mixte: 1}}}});
  const fusion = P.fusionner(a, b);
  assert.deepEqual(fusion.tables[7].fois, {beads: 3, construct: 0, gaps: 0, ordered: 0, random: 0, desordre: 4, trous: 0, mixte: 1});
});

test("le serveur accepte « fois » (sinon filtrer_progression le jette à la synchro) — et rien d’autre de nouveau", () => {
  const cles = applis.match(/'cles' => \[([\s\S]*?)\]/)[1];
  assert.match(cles, /'fois'/, "« fois » déclaré dans lib/applis.php");
  // Ses sous-clés sont des noms déjà déclarés : aucune autre clé à ouvrir.
  P.CLES_FOIS.forEach(cle => assert.match(cles, new RegExp(`'${cle}'`)));
});

// ------------------------------------------------------- le seuil de la validation

test("validationTable : le point sur les 8 calculs — prêts (boîte 3+), dus, à venir, jamais vus", () => {
  const vide = P.validationTable(P.creerParcours(), 7, J1);
  assert.deepEqual(vide, {total: 8, prets: 0, inconnus: 8, dus: 0, aVenir: 0, prochain: null, prete: false});
  // Jour 1 : trois entraînements réussis → les 8 calculs en boîte 2, dus demain.
  const j1 = troisReussis(J1);
  const point = P.validationTable(j1, 7, J1);
  assert.deepEqual(point, {total: 8, prets: 0, inconnus: 0, dus: 0, aVenir: 8, prochain: {jour: J2, dans: 1}, prete: false});
  P.faitsDeLaTable(7).forEach(cle => assert.equal(j1.calculs[cle].boite, 2));
  // Jour 2 : ils sont dus.
  assert.deepEqual(P.validationTable(j1, 7, J2), {total: 8, prets: 0, inconnus: 0, dus: 8, aVenir: 0, prochain: null, prete: false});
  // Jour 2, révision réussie → boîte 3 : prête.
  let j2 = j1;
  P.calculsDus(j2, {aujourdhui: J2}).forEach(cle => { j2 = P.appliquerReponse(j2, cle, {correcte: true, date: J2}).parcours; });
  assert.deepEqual(P.validationTable(j2, 7, J2), {total: 8, prets: 8, inconnus: 0, dus: 0, aVenir: 0, prochain: null, prete: true});
  // Un raté aujourd'hui redescend en boîte 2 et revient demain : plus prête.
  const rate = P.appliquerReponse(j2, "7-8", {correcte: false, date: J2}).parcours;
  assert.deepEqual(P.validationTable(rate, 7, J2), {total: 8, prets: 7, inconnus: 0, dus: 0, aVenir: 1, prochain: {jour: "2026-09-16", dans: 1}, prete: false});
  // Le seuil est bien la boîte 3 (SEUILS), et la table de 10 (aucune case) est toujours prête.
  assert.equal(P.SEUILS.validation.boiteMin, 3);
  assert.equal(P.validationTable(P.creerParcours(), 10, J1).prete, true);
});

test("le rond bleu : les trois réussis ne suffisent plus — il reste sur Je m’entraîne jusqu’aux 8 calculs en boîte 3, puis passe sur Je valide", () => {
  const j1 = troisReussis(J1);
  const ligne = (p, jour) => P.etatAffichage(p, jour).lignes.find(l => l.table === 7);
  assert.equal(ligne(j1, J1).conseil, "entraine", "jour 1 : les 8 calculs en boîte 2 → toujours Je m’entraîne");
  assert.equal(P.etapeTable(j1, 7, J1).type, "entraine");
  assert.equal(ligne(j1, J2).conseil, "entraine", "jour 2 avant la révision : toujours Je m’entraîne (et Mes calculs du jour devant)");
  assert.equal(P.prochaineEtape(j1, J2).type, "revision");
  let j2 = j1;
  P.calculsDus(j2, {aujourdhui: J2}).forEach(cle => { j2 = P.appliquerReponse(j2, cle, {correcte: true, date: J2}).parcours; });
  assert.equal(ligne(j2, J2).conseil, "valide", "jour 2 après la révision : les 8 en boîte 3 → Je valide ma table");
  assert.equal(P.etapeTable(j2, 7, J2).type, "validation");
  // prochaineEtape (le rond de « Ma prochaine étape ») suit l'ordre conseillé :
  // la table de 2 d'abord ; sur la table de 2 elle-même, même règle.
  const t2 = (() => { let p = P.creerParcours(); ["desordre", "trous", "mixte"].forEach(e => { p = jouerSerie(p, P.configEntraine(2, e), P.faitsDeLaTable(2), {date: J1}); }); return p; })();
  assert.equal(P.prochaineEtape(t2, J1).type, "entraine");
  assert.equal(P.prochaineEtape(t2, J1).table, 2);
  // Rien n'est verrouillé : la validation se joue quand l'élève veut, et acquiert la table.
  const forcee = jouerSerie(j1, P.configValidation(7), [...P.faitsDeLaTable(7), ...P.faitsDeLaTable(7), ...P.faitsDeLaTable(7).slice(0, 4)], {date: J1});
  assert.equal(forcee.tables[7].acquise, J1, "validée le jour 1 malgré le rond sur Je m’entraîne");
  assert.equal(ligne(forcee, J1).conseil, "valide", "acquise → « valide » (la page n’y met aucun rond)");
  // Sans le point sur la grille, conseilTable garde la règle d'avant (compatibilité).
  assert.equal(P.conseilTable(j1.tables[7]), "valide");
});

test("les trois réussis mais pas prêts : l’étape proposée est l’entraînement refait le moins souvent", () => {
  let p = troisReussis(J1);
  assert.equal(P.etapeTable(p, 7, J1).entrainement, "desordre", "tous à 1 fois → le premier");
  p = jouerSerie(p, P.configEntraine(7, "desordre"), P.faitsDeLaTable(7), {date: J1});
  p = jouerSerie(p, P.configEntraine(7, "trous"), P.faitsDeLaTable(7), {date: J1});
  assert.equal(P.etapeTable(p, 7, J1).entrainement, "mixte", "désordre 2, trous 2, mixte 1 → les deux");
  assert.equal(P.etapeTable(p, 7, J1).config.mode, "train");
});

test("l’événement « entraine » porte le point sur la validation : l’écran de résultat sait s’il dit « tu peux valider » ou le rendez-vous", () => {
  let p = P.creerParcours();
  p = jouerSerie(p, P.configEntraine(7, "desordre"), P.faitsDeLaTable(7), {date: J1});
  p = jouerSerie(p, P.configEntraine(7, "trous"), P.faitsDeLaTable(7), {date: J1});
  P.faitsDeLaTable(7).forEach(cle => { p = P.appliquerReponse(p, cle, {correcte: true, date: J1}).parcours; });
  const r = jouer(p, P.configEntraine(7, "mixte"), 10, 10, J1);
  const e = r.evenements.find(ev => ev.type === "entraine");
  assert.equal(e.pret, true);
  assert.equal(e.validation.prete, false);
  assert.deepEqual(e.validation.prochain, {jour: J2, dans: 1});
  // Le lendemain, révision faite, le troisième entraînement dirait « tu peux valider ».
  let j2 = r.parcours;
  P.calculsDus(j2, {aujourdhui: J2}).forEach(cle => { j2 = P.appliquerReponse(j2, cle, {correcte: true, date: J2}).parcours; });
  assert.equal(jouer(j2, P.configEntraine(7, "mixte"), 10, 10, J2).evenements[0].validation.prete, true);
});

// ------------------------------------------------------------------- la page

test("l’accueil : la pastille « N fois » remplace les ronds de J’apprends, Je m’entraîne garde ses ronds et compte dans le texte", () => {
  assert.match(html, /const foisApprends = ligne\.apprends\.reduce\(\(somme, item\) => somme \+ item\.fois, 0\);/);
  assert.match(html, /sousTitre: `facultatif · \$\{ligne\.apprends\.length\} activités`,\s*points: foisApprends \? \[pastilleFois\(foisApprends\)\] : \[\],/, "plus de ronds, une pastille, rien à 0");
  assert.match(html, /function pastilleFois\(fois\) \{[\s\S]*?pastille\.className = "fois";[\s\S]*?pastille\.textContent = `\$\{fois\}\\u00a0fois`;/);
  assert.match(html, /\.etape \.fois \{ display: inline-flex;[^}]*background: var\(--teal\); color: #fff;/);
  assert.doesNotMatch(html, /activité\$\{terminees > 1 \? "s" : ""\} sur \$\{ligne\.apprends\.length\}`/, "plus de « 5 activités sur 5 »");
  assert.match(html, /const foisEntraine = ligne\.entraine\.reduce\(\(somme, item\) => somme \+ item\.fois, 0\);/);
  assert.match(html, /\? `réussi ✓ · fait \$\{foisEntraine\}\\u00a0fois`\s*: reussis\s*\? `puis : \$\{NOMS_ENTRAINEMENTS\[prochainEntrainement\.entrainement\]\}`\s*: `d’abord : \$\{NOMS_ENTRAINEMENTS\[prochainEntrainement\.entrainement\]\}`/, "trois sous-titres courts, une ligne à 320 px");
  assert.match(html, /points: ligne\.entraine\.map\(item => etoile\(item\.etat\)\),/, "les trois ronds de Je m’entraîne restent");
  // Les panneaux : « fait N fois » sous chaque activité et chaque entraînement.
  assert.match(html, /fois: item\.fois,\s*conseillee: Boolean\(prochaineActivite\)/);
  assert.match(html, /fois: item\.fois,\s*conseillee: Boolean\(prochainEntrainement\)/);
  assert.match(html, /compte\.className = "fois-petit";\s*compte\.textContent = `\$\{detail \? " · " : ""\}fait \$\{fois\}\\u00a0fois`;/);
  assert.match(html, /\.choix-activite \.fois-petit \{ color: var\(--teal\);/);
});

test("l’accueil : l’encadré du rendez-vous, sous les étapes, seulement quand les trois sont réussis et la grille pas prête", () => {
  assert.match(html, /if \(!ligne\.acquise && reussis === 3 && !ligne\.validation\.prete\) \{\s*const rdv = document\.createElement\("p"\);\s*rdv\.className = "rdv";\s*rdv\.id = "acc-rdv";\s*rdv\.textContent = soude\(phraseRendezVous\(ligne\.validation, table\)\);/);
  assert.match(html, /\.matable \.rdv \{ margin: 10px 0 2px;/);
  // Les phrases, une par cas, construites par le moteur du texte.
  const debut = html.indexOf("function phraseRendezVous(validation, table)");
  const source = html.slice(html.indexOf("function pluriel(nombre, mot)"), html.indexOf("// Même convention de date que le moteur"))
    + html.slice(debut, html.indexOf("\n      }\n", debut) + 8);
  const {phraseRendezVous} = new Function(`${source}\nreturn {phraseRendezVous};`)();
  assert.equal(phraseRendezVous({total: 8, prets: 0, inconnus: 0, dus: 0, aVenir: 8, prochain: {jour: J2, dans: 1}}, 7),
    "Tes 8 calculs ont rendez-vous demain. C’est en les revoyant qu’ils rentrent : tu valideras ta table après.");
  assert.equal(phraseRendezVous({total: 8, prets: 5, inconnus: 0, dus: 0, aVenir: 3, prochain: {jour: J5, dans: 3}}, 7),
    "Encore 3 calculs : ils ont rendez-vous dans 3 jours. C’est en les revoyant qu’ils rentrent : tu valideras ta table après.");
  assert.equal(phraseRendezVous({total: 8, prets: 7, inconnus: 0, dus: 0, aVenir: 1, prochain: {jour: J2, dans: 1}}, 7),
    "Encore 1 calcul : ils ont rendez-vous demain. C’est en les revoyant qu’ils rentrent : tu valideras ta table après.");
  assert.equal(phraseRendezVous({total: 8, prets: 0, inconnus: 0, dus: 8, aVenir: 0, prochain: null}, 7),
    "8 calculs de la table de 7 t’attendent dans Mes calculs du jour : c’est en les revoyant qu’ils rentrent. Tu valideras ta table après.");
  assert.equal(phraseRendezVous({total: 8, prets: 7, inconnus: 0, dus: 1, aVenir: 0, prochain: null}, 7),
    "1 calcul de la table de 7 t’attend dans Mes calculs du jour : c’est en les revoyant qu’ils rentrent. Tu valideras ta table après.");
  assert.equal(phraseRendezVous({total: 8, prets: 6, inconnus: 2, dus: 0, aVenir: 0, prochain: null}, 7),
    "Il te reste 2 calculs de la table de 7 à rencontrer : refais un entraînement, puis tu valideras ta table.");
});

test("l’écran de résultat après le troisième entraînement : « tu peux valider » seulement si la grille est prête, sinon le rendez-vous", () => {
  assert.match(html, /if \(entraine && entraine\.reussi && entraine\.pret\) \{\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*if \(!entraine\.validation \|\| entraine\.validation\.prete\) return "Tes trois entraînements sont réussis : tu peux valider ta table !";\s*return `Tes trois entraînements sont réussis ! \$\{phraseRendezVous\(entraine\.validation, entraine\.table\)\}`;/);
});

test("le point de Jackie : une table acquise choisie depuis « Changer de table » reste « ma table » ; validée après avoir été choisie, elle cède la place", () => {
  const debut = html.indexOf("const CLE_TABLE_CHOISIE");
  const source = html.slice(debut, html.indexOf("const NOMS_ENTRAINEMENTS"));
  const session = fauxStockage();
  const logique = new Function("PARCOURS", "PARCOURS_TABLES", "codeSuivi", "stockageSession", `${source}
    return {lireTableChoisie, lireChoixTable, ecrireTableChoisie, tableEnCours};`)(P, [...P.TABLES], "", () => session);
  let p = P.creerParcours();
  p = jouerSerie(p, P.configValidation(7), [...P.faitsDeLaTable(7), ...P.faitsDeLaTable(7), ...P.faitsDeLaTable(7).slice(0, 4)], {date: J1});
  const etat = P.etatAffichage(p, J1);
  assert.deepEqual(etat.acquises, [7]);
  assert.equal(logique.tableEnCours(etat), 2, "sans choix : la première de l’ordre conseillé");
  logique.ecrireTableChoisie(7, {acquise: true});
  assert.deepEqual(logique.lireChoixTable(), {table: 7, acquise: true});
  assert.equal(logique.lireTableChoisie(), 7);
  assert.equal(logique.tableEnCours(etat), 7, "choisie alors qu’elle était acquise : sa carte s’affiche (plus la table de 2)");
  // Choisie AVANT d'être validée : une fois acquise, la carte passe à la suivante, comme avant.
  logique.ecrireTableChoisie(7);
  assert.deepEqual(logique.lireChoixTable(), {table: 7, acquise: false});
  assert.equal(logique.tableEnCours(etat), 2, "validée après le choix → la suivante");
  // Un ancien enregistrement sans le drapeau se lit « pas acquise » : rien ne casse.
  session.setItem("mathsgo-defi-tables-table", JSON.stringify({code: "", table: 7}));
  assert.equal(logique.tableEnCours(etat), 2);
  // Le bouton du choix écrit le drapeau, et la carte acquise n'a aucune étape conseillée.
  assert.match(html, /ecrireTableChoisie\(candidate, \{acquise\}\);/);
  assert.match(html, /const conseilCarte = ligne\.acquise \? null : conseil;/);
  assert.match(html, /conseille: conseilCarte === "apprends",/);
  assert.match(html, /conseille: conseilCarte === "entraine",/);
  assert.match(html, /conseille: conseilCarte === "valide",/);
  assert.match(html, /titre: ligne\.acquise \? "Ma table est acquise" : "Je valide ma table",\s*sousTitre: ligne\.acquise \? `acquise le \$\{dateEnLettres\(ligne\.acquise\)\}` : "20 questions · 1 min 30",/);
});

test("« Comme la validation, en 2 min » reste proposée sur une table acquise", () => {
  const debut = html.indexOf('libelle: "Comme la validation, en 2 min"');
  const avant = html.slice(debut - 400, debut);
  assert.doesNotMatch(avant, /if \(!ligne\.acquise\)/, "plus de condition « pas acquise » devant l’option");
  assert.match(avant, /\{\s*choixEntraine\.push\(\{\s*$/);
});

test("le moteur a changé : nouveau numéro de cache, copie serveur identique, parcours de référence à jour", async () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261002-1/);
  const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "_serveur/public/prof/defi_tables_mon_parcours.js : la copie octet pour octet (dépôt FTP)");
  const reference = JSON.parse(await readFile(new URL("../_serveur/tests/parcours-reference.json", import.meta.url), "utf8"));
  const table7 = reference.tables && reference.tables[7];
  assert.ok(table7 && table7.fois && typeof table7.fois.beads === "number", "le parcours de référence porte « fois » (node scripts/generer-parcours-reference.mjs)");
});
