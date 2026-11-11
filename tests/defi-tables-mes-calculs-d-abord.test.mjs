// Lot « Mes calculs du jour d'abord » (08/10/2026) — décisions de Gwenaël
// (question à choix du 08/10, planches 19 et 20) : Mes calculs du jour ne
// doit plus obliger à lancer puis arrêter la séance pour passer un test.
//   - Plus rien de grisé tant que Mes calculs du jour n'est pas joué :
//     « Je passe le test », « Mon mélange », « Choisir une activité » sur
//     l'accueil ; Mon mélange et les étoiles dans Mon parcours.
//   - Toucher l'un d'eux lance D'ABORD Mes calculs du jour (les mêmes calculs
//     que la séance), puis, sur l'écran de résultat habituel, UN seul bouton
//     vers ce qui a été touché (« Je passe le test → ») — aucun écran nouveau.
//   - La séance du jour n'est pas commencée : elle reste entière, sans Mes
//     calculs du jour (joué). « Commencer » lance la séance, inchangée.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const html = lire("outils/calcul_mental/defi_tables.html");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// Un élève comme Léa, le matin : 2, 3 et 5 passées la semaine dernière, des
// calculs dus aujourd'hui, Mes calculs du jour pas encore joué.
const AUJ = "2026-10-08";
function lea() {
  const p = P.creerParcours();
  [2, 3, 5].forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.tables[4].seance.n = 2;
  for (const cle of ["2-4", "2-6", "3-3", "3-5", "3-7", "5-5", "5-8", "2-9"]) {
    p.calculs[cle] = {boite: 2, cases: 0, vu: "2026-10-05", erreur: "", gagne: "2026-10-05", echeance: AUJ};
  }
  p.jours = ["2026-10-05"];
  // La coupe des 3 déjà gagnée : pas de Mon mélange au palier avant le test
  // (lot « Mon mélange aux paliers », testé dans defi-tables-melange-paliers).
  p.melange = {...p.melange, reussi: 3};
  return P.normaliserParcours(p);
}

// ------------------------------------------- la porte enchaîne au lieu de bloquer

function lanceur(parcours) {
  const appels = [];
  const state = {apresMesCalculs: "reste d'avant", origin: null};
  const configuration = {};
  const fabrique = new Function("state", "PARCOURS", "parcours", "configuration", "startRevision", "start", "TRAIN_TYPES", "CORE", "NOM_DU_TEST", "majuscule", "NOMS_ENTRAINEMENTS", "renderAccueil", "VUE_PROF",
    `${source("nomDeLaSuite")}\n${source("launchFromParcours")}\nreturn launchFromParcours;`);
  const launchFromParcours = fabrique(state, {...P, mesCalculsAFaire: q => P.mesCalculsAFaire(q, AUJ)}, parcours, configuration,
    (table, origin) => appels.push(["revision", table, origin]), () => appels.push(["start", configuration.mode]),
    {desordre: ["direct"]}, {PRESETS: {validation: {total: 20, duration: 90}, train: {total: 10, duration: null}, learn: {total: 11, duration: null}, test: {total: 25, duration: 120}}},
    "Je passe le test", texte => texte.charAt(0).toUpperCase() + texte.slice(1),
    {desordre: "dans le désordre", trous: "nombres manquants et divisions", mixte: "résultats, nombres manquants et divisions"},
    () => appels.push(["accueil"]), false);
  return {launchFromParcours, appels, state};
}

test("Mes calculs du jour pas joué : « Je passe le test » lance d'abord Mes calculs du jour, et retient le test pour après", () => {
  const p = lea();
  assert.equal(P.mesCalculsAFaire(p, AUJ), true, "la porte est fermée ce matin");
  const l = lanceur(p);
  const config = P.configValidation(4);
  l.launchFromParcours(config, "menu");
  assert.deepEqual(l.appels, [["revision", null, "menu"]], "Mes calculs du jour (table null : la série du jour), rien d'autre ; plus de renderAccueil qui ne lançait rien");
  assert.deepEqual(l.state.apresMesCalculs, {config, origin: "menu", nom: "Je passe le test", puis: null});
});

test("Mes calculs du jour joué (ou rien à revoir) : tout se lance directement, comme avant", () => {
  const p = {...lea(), calculsDuJour: AUJ};
  assert.equal(P.mesCalculsAFaire(p, AUJ), false);
  const l = lanceur(p);
  l.launchFromParcours(P.configValidation(4), "menu");
  assert.deepEqual(l.appels, [["start", "validation"]]);
  assert.equal(l.state.apresMesCalculs, null, "aucune suite retenue (et le reste d'avant est effacé)");
  // Un élève neuf : pas de Mes calculs du jour, rien à faire d'abord.
  const neuf = lanceur(P.creerParcours());
  neuf.launchFromParcours(P.configApprends(2, "beads"), "menu");
  assert.deepEqual(neuf.appels, [["start", "learn"]]);
});

test("dans la séance, rien ne change : l'étape se lance (la séance commence elle-même par Mes calculs du jour)", () => {
  const l = lanceur(lea());
  l.launchFromParcours(P.configApprends(4, "ordered"), "seance");
  assert.deepEqual(l.appels, [["start", "learn"]]);
  assert.equal(l.state.apresMesCalculs, null);
});

test("le bouton de la suite porte le nom de ce qui a été touché, avec les mots de l'écran", () => {
  const p = lea();
  const nom = config => {
    const l = lanceur(p);
    l.launchFromParcours(config, "menu");
    return l.state.apresMesCalculs.nom;
  };
  assert.equal(nom(P.configValidation(4)), "Je passe le test");
  assert.equal(nom(P.configMelange(p)), "Mon mélange");
  assert.equal(nom(P.configValidation(4, 120)), "Comme le test, en 2 min", "l'entraînement « comme le test » du menu");
  assert.equal(nom(P.configApprends(4, "beads")), "Je pousse les perles");
  assert.equal(nom(P.configEntraine(4, "trous")), "Nombres manquants et divisions");
  // Une étoile (élève aux 9 tables, une étoile gagnée) : « Tente ★★ », comme
  // dans la séance — la marche suivante (D5 : une autre ne compte pas).
  const neuf = P.normaliserParcours({...lea(), expert: {etoiles: 1, dernier: "2026-10-01", couronne: null}, tables: Object.fromEntries(P.TABLES.map(table => [table, {...P.creerParcours().tables[table], acquise: "2026-10-01"}]))});
  const l = lanceur(neuf);
  l.launchFromParcours(P.configEtoile(2), "parcours");
  assert.equal(l.state.apresMesCalculs.nom, "Tente ★★");
  assert.equal(l.state.apresMesCalculs.origin, "parcours", "« ← » ramènera à Mon parcours");
});

// ------------------------------------------ la fin de Mes calculs du jour

test("à la fin de Mes calculs du jour (hors séance, avant le test) : la journée s'ouvre, un seul bouton mène au test", () => {
  // finish() : dans la séance, l'étape suivante ; sinon, s'il y a une suite, elle.
  assert.match(html, /if \(enSeance\(\)\) \{\s*noterEtapeDeSeance\(null\);\s*ajusterEchelle\(\);\s*\} else if \(state\.apresMesCalculs\) \{\s*ouvrirLaJournee\(\);\s*renderSuiteMesCalculs\(\);\s*ajusterEchelle\(\);\s*\}/);
  // L'écran est celui de la séance (cadre centré, pas la rangée « Ma table »).
  assert.match(html, /if \(!enSeance\(\) && !state\.apresMesCalculs\) \$\("result"\)\.classList\.remove\("is-revision"\);/);
  // renderSuiteMesCalculs, EXÉCUTÉE avec un petit DOM.
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      const classes = new Set();
      const el = {id, hidden: true, children: [], ecouteurs: {}, textContent: "", type: "", className: "",
        classList: {add: c => classes.add(c), contains: c => classes.has(c)},
        replaceChildren: (...n) => { el.children = n; }, append: (...n) => el.children.push(...n),
        addEventListener: (type, f) => { el.ecouteurs[type] = f; }};
      elements.set(id, el);
    }
    return elements.get(id);
  };
  let compteur = 0;
  const appels = [];
  const state = {apresMesCalculs: {config: P.configValidation(4), origin: "menu", nom: "Je passe le test"}};
  const rendre = new Function("$", "document", "state", "effacerSuiteSeance", "launchFromParcours", "sortieDeSerie", "quitterSerie", `${source("renderSuiteMesCalculs")}\n${source("renderBoutonSuite")}\nreturn renderSuiteMesCalculs;`)(
    element, {createElement: () => element(`nouveau-${compteur += 1}`)}, state, () => appels.push("effacer"), (config, origin) => appels.push(["lancer", config.mode, origin]),
    () => ({mot: "Ma table"}), () => appels.push("quitter"));
  rendre();
  const zone = element("seance-suite");
  assert.equal(zone.hidden, false);
  // Lot « la flèche de retour » (14/10/2026, choix de Gwenaël) : UN bouton bleu,
  // puis un lien « Ma table » dessous — cet écran n'avait aucun retour.
  assert.equal(zone.children.length, 1, "une rangée de deux boutons");
  const ligne = zone.children[0];
  assert.equal(ligne.className, "suite-boutons");
  assert.equal(ligne.children.length, 2, "« ← Ma table » à gauche, la suite à droite");
  assert.equal(ligne.children[0].className, "secondary retour-flechee");
  assert.equal(ligne.children[0].textContent, "Ma table");
  const bouton = ligne.children[1];
  assert.equal(bouton.textContent, "Je passe le test →", "la flèche ne part pas seule à la ligne");
  assert.equal(bouton.className, "primary");
  assert.equal(bouton.id, "apres-mes-calculs");
  assert.ok(element("result").classList.contains("en-seance"), "la rangée du bas (Ma table, Rejouer) est cachée, comme dans la séance");
  bouton.ecouteurs.click();
  assert.equal(state.apresMesCalculs, null);
  assert.deepEqual(appels, ["effacer", ["lancer", "validation", "menu"]]);
});

test("la journée ouverte : la porte s'ouvre, la séance n'est pas commencée et reste entière (sans Mes calculs du jour)", () => {
  // ouvrirLaJournee, EXÉCUTÉE.
  let parcours = lea();
  let sauve = 0;
  const ouvrir = new Function("PARCOURS", "sauverParcours", "lire", "ecrire", `let parcours = null;\n${source("ouvrirLaJournee")}\nreturn () => { parcours = lire(); ouvrirLaJournee(); ecrire(parcours); };`)(
    {...P, jourLocal: () => AUJ}, () => { sauve += 1; }, () => parcours, nouveau => { parcours = nouveau; });
  const avant = P.ouvrirSeance(lea(), {aujourdhui: AUJ});
  assert.equal(avant.file[0].type, "revision", "le matin, la séance commence par Mes calculs du jour");
  // L'élève joue Mes calculs du jour (ses réponses vont aux boîtes), puis la journée s'ouvre.
  P.serieDuJour(parcours, {aujourdhui: AUJ}).cles.forEach(cle => { parcours = P.appliquerReponse(parcours, cle, {correcte: true, date: AUJ}).parcours; });
  ouvrir();
  assert.equal(sauve, 1, "enregistré (et envoyé au suivi)");
  assert.equal(parcours.calculsDuJour, AUJ);
  assert.equal(P.mesCalculsAFaire(parcours, AUJ), false, "la porte est ouverte");
  assert.equal(parcours.enCours, null, "aucune séance commencée");
  assert.equal(P.bilanSeances(parcours, AUJ).aujourdhui, 0, "aucune séance comptée");
  const apres = P.ouvrirSeance(parcours, {aujourdhui: AUJ});
  assert.ok(apres.file.length >= 3, "la séance entière");
  assert.ok(apres.file.every(etape => etape.type !== "revision"), "sans Mes calculs du jour : il est joué");
  // Le serveur garde déjà ce jour (clé existante) : rien à changer côté serveur.
  assert.equal(P.normaliserParcours(JSON.parse(JSON.stringify(parcours))).calculsDuJour, AUJ);
});

test("quitter efface la suite : retour à l'accueil, une séance qui commence, un nouveau lancement", () => {
  assert.match(html, /function backToModes\(\) \{\s*quitterSeance\(\);\s*state\.apresMesCalculs = null;/);
  assert.match(html, /function commencerSeance\(table\) \{\s*state\.encoreOuverte = false;\s*state\.apresMesCalculs = null;/);
  // Lot « Ma classe : le parcours de Léa » (21/10/2026) : la vue du professeur
  // sort en premier (verrou 3), avant même de regarder la configuration.
  assert.match(html, /function launchFromParcours\(config, origin = "parcours", \{puis\} = \{\}\) \{\s*(?:\/\/[^\n]*\n\s*)*if \(VUE_PROF\) return;\s*if \(!config\) return;\s*state\.apresMesCalculs = null;\s*state\.apresMelange = null;/);
  assert.match(html, /apresMesCalculs: null,/, "nul au chargement");
});

// ------------------------------------------------- plus rien de grisé

test("l'accueil : plus rien de grisé sous la carte de la séance, « Choisir une activité » s'ouvre", () => {
  const accueil = source("renderSeanceAccueil");
  assert.doesNotMatch(accueil, /etat\.porte|disabled|est-fermee|porte-mot/);
  assert.doesNotMatch(html, /\.seance-liens\.est-fermee|\.seance-liens \.porte-mot/, "le CSS des liens grisés est retiré");
  assert.doesNotMatch(html.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, ""), /"Après Mes calculs du jour"/, "le mot « Après Mes calculs du jour » n'est plus écrit");
  assert.match(html, /const carteSeance = avecSeance && !state\.choisirActivite;/);
  assert.match(accueil, /lien\(NOM_DU_TEST, \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\), "rond"\);/);
});

test("Mon parcours : Mon mélange et les étoiles ne sont plus grisés « après Mes calculs du jour »", () => {
  const rendu = source("renderParcours");
  assert.doesNotMatch(rendu, /const porte = |porte \?|après Mes calculs du jour/);
  assert.match(rendu, /label: "Mon mélange, mes tables passées \(20 questions en 1 min 30\)",\s*texte: triangleJouer\(\),\s*config: PARCOURS\.configMelange\(parcours\)\s*\}\), droite\);/);
  assert.match(rendu, /const expertOuvert = etat\.expert\.ouvert;\s*const expertAttend = "après mes 9 tables";/);
  // Avant les 9 tables, l'escalier reste fermé (il ne s'agit pas de la porte).
  assert.match(rendu, /config: jouable \? marche\.config : null,/);
});

test("rien d'autre ne change : le moteur, le serveur, la séance", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-1/, "le moteur a changé depuis (lot S1 « les journaux »)");
  assert.equal(lire("_serveur/public/prof/defi_tables_mon_parcours.js"), lire("outils/calcul_mental/defi_tables_mon_parcours.js"));
  assert.match(html, /function commencerSeance\(table\) \{[\s\S]*?seance = PARCOURS\.ouvrirSeance\(parcours, \{table\}\);\s*lancerEtapeDeSeance\(\);/);
  assert.match(html, /suite\.textContent = `Étape \$\{seance\.faites\.length \+ 1\}\\u00a0: \$\{prochaine\.nom\}\\u00a0→`;/, "dans la séance, toujours « Étape 2 : … → »");
});

// --------------------------------- la page 2 du professeur (relecture de Code)

test("page 2 du professeur : le « · » colle au mot d'avant (il ne reste plus seul en fin de ligne)", () => {
  const rendu = source("renderFicheProf");
  assert.doesNotMatch(rendu, /join\(" · "\)|\$\{texteCoupes\} · |` · dernière/, "plus de « · » précédé d'une espace sécable");
  assert.equal((rendu.match(/\\u00a0· /g) || []).length, 6);
});
