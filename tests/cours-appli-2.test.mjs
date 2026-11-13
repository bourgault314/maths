// L'appli Cours, lot « cours-appli-2 » (13/11/2026). Choix de Gwenaël (questions à choix du 13/11, planches) :
//  - « Mes cours » (espace élève) : une classe qui a des chapitres de plusieurs niveaux voit sa liste rangée
//    sous « 4e » puis « 3e » ; chaque chapitre : le DOMAINE écrit en petit (noms courts), une bande de la
//    couleur du domaine (celles du catalogue du site), le nom court du chapitre en gros (version 1) ;
//  - « Régler les cours » : « Tout ouvrir » et « Tout fermer » pour le niveau affiché ;
//  - Ma classe : l'onglet Cours devient un résumé (élèves de la semaine, une ligne par chapitre, les fiches
//    d'un chapitre déplié avec leur nombre d'élèves, la grille à déplier) ; les fiches ouvertes vont AUSSI dans
//    la fiche de l'élève (« Activité », jour par jour), sans compter comme un jour de travail.
//
// Ces tests EXÉCUTENT les fonctions des deux pages, telles qu'elles y sont écrites.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const espace = lire("_serveur/public/index.php");
const prof = lire("_serveur/public/prof/index.php");
const coursPhp = lire("_serveur/public/lib/cours.php");
const catalogue = JSON.parse(lire("_serveur/public/lib/cours.json")).chapitres;

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") { profondeur -= 1; if (profondeur === 0) return source.slice(position, i + 1); }
  }
  throw new Error("bloc non fermé");
}
function fonction(source, nom) {
  const m = new RegExp(`function ${nom}\\(`).exec(source);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}
function constante(source, nom) {
  const debut = source.indexOf(`const ${nom} = `);
  assert.ok(debut >= 0, `la page doit définir ${nom}`);
  return source.slice(debut, source.indexOf(";\n", debut) + 1);
}

// Les domaines rangés par le serveur (lib/cours.php), par code de chapitre.
const blocDomaines = coursPhp.slice(coursPhp.indexOf("const COURS_DOMAINES = ["), coursPhp.indexOf("];", coursPhp.indexOf("const COURS_DOMAINES = [")));
const domainesServeur = Object.fromEntries([...blocDomaines.matchAll(/'([A-Z]{2,8})' => '([a-z]+)'/g)].map(m => [m[1], m[2]]));

test("chaque chapitre du livret a son domaine, sauf « Préparer la seconde » ; l'espace élève connaît chaque domaine du serveur", () => {
  const DOMAINES_COURS = new Function(`${constante(espace, "DOMAINES_COURS")} return DOMAINES_COURS;`)();
  catalogue.forEach(c => {
    const code = c.id.slice(3);
    if (code === "SEC") assert.equal(domainesServeur[code], undefined, "« Préparer la seconde » : pas de domaine");
    else assert.ok(domainesServeur[code], `${c.id} : un domaine`);
  });
  new Set(Object.values(domainesServeur)).forEach(cle => {
    assert.ok(DOMAINES_COURS[cle], `l'espace élève connaît « ${cle} »`);
    assert.match(DOMAINES_COURS[cle].couleur, /^#[0-9a-f]{6}$/);
  });
  // Les couleurs sont celles du catalogue du site (outils/index.html, catalogue-refonte-data.js).
  const site = lire("assets/js/catalogue-refonte-data.js");
  [["nombres", "nombres-calculs"], ["algebre", "algebre"], ["proportionnalite", "proportionnalite-mesures"], ["geometrie", "geometrie"],
    ["donnees", "donnees"], ["informatique", "informatique"]].forEach(([cle, id]) => {
    const bloc = site.slice(site.indexOf(`"id": "${id}"`), site.indexOf(`"id": "${id}"`) + 400);
    assert.ok(bloc.includes(`"color": "${DOMAINES_COURS[cle].couleur}"`), `${cle} : la couleur du domaine « ${id} » du site`);
  });
  // Les noms courts choisis par Gwenaël, tels quels.
  assert.deepEqual(Object.values(DOMAINES_COURS).map(d => d.nom), ["Nombres et calculs", "Algèbre", "Proportionnalité et fonctions",
    "Espace et géométrie", "Données et probabilités", "Pensée informatique"]);
  // Le serveur ne donne que la clé, jamais un nom ni une couleur.
  assert.match(coursPhp, /'domaine' => cours_domaine\(\$c\['id'\]\),/);
});

test("« Mes cours » : rangé sous « 4e » puis « 3e » ; un seul niveau : pas de titre ; le nom court, le domaine écrit", () => {
  const chapitresParNiveau = new Function(`${constante(espace, "ORDRE_NIVEAUX")}\n${fonction(espace, "chapitresParNiveau")} return chapitresParNiveau;`)();
  const ch = (id, niveau) => ({id, niveau});
  // Le catalogue met la 4e avant la 3e ; une classe peut recevoir dans un autre ordre, la 4e reste devant.
  const groupes = chapitresParNiveau([ch("3e-PYT", "3e"), ch("4e-PCT", "4e"), ch("3e-THA", "3e"), ch("4e-EQU", "4e")]);
  assert.deepEqual(groupes.map(g => g.niveau), ["4e", "3e"]);
  assert.deepEqual(groupes.map(g => g.chapitres.map(c => c.id)), [["4e-PCT", "4e-EQU"], ["3e-PYT", "3e-THA"]], "l'ordre de la progression dans chaque niveau");
  assert.equal(chapitresParNiveau([ch("3e-PYT", "3e")]).length, 1);
  const liste = fonction(espace, "dessinerListeCours");
  assert.match(liste, /if \(groupes\.length > 1\) \{/, "les titres de niveau seulement si la classe a plusieurs niveaux");
  assert.match(liste, /lien\.querySelector\("strong"\)\.textContent = chapitre\.chapitre \|\| chapitre\.titre;/, "le nom court en gros");
  assert.match(liste, /lien\.querySelector\("\.cours-domaine"\)\.textContent = domaine\.nom;/, "le domaine ÉCRIT (lisible sans couleur)");
  assert.doesNotMatch(liste, /surTitre\(/, "plus le nom du chapitre en petites capitales au-dessus du titre long");
  // Une clé inconnue venue du serveur ou de la copie de l'onglet : pas de domaine.
  assert.match(fonction(espace, "coursLus"), /domaine: Object\.prototype\.hasOwnProperty\.call\(DOMAINES_COURS, c\.domaine\) \? c\.domaine : "",/);
});

// La page du professeur, rejouée : juste ce qu'il faut autour des fonctions.
const COURS = catalogue.map(c => Object.assign({}, c, {
  fiches: c.fiches.map(f => Object.assign({}, f, {url: `https://mathsgo.re${f.page}`})),
  brevet: c.brevet ? Object.assign({}, c.brevet, {url: `https://mathsgo.re${c.brevet.page}`}) : null
}));
function pageProf(reglage) {
  const sources = ["coursDeLaClasse", "jourOuvert", "joursCoursDe", "texteLigne", "pluriel", "combienOntOuvert"].map(n => fonction(prof, n)).join("\n");
  return new Function("COURS", "classe", `const JOUR_ISO = /^\\d{4}-\\d{2}-\\d{2}$/;\nconst ANZAN = null, CALCUL_CORE = null;\n${sources}\nreturn {joursCoursDe, texteLigne, combienOntOuvert};`)(
    COURS, {id: 1, reglages: {cours: reglage}});
}

test("fiche de l'élève : les fiches ouvertes, rangées par jour et par chapitre, « ouverture des fiches 2 et 5 » ; une fiche inconnue ou un jour abîmé : oubliés", () => {
  const p = pageProf({chapitres: ["4e-PCT", "3e-PYT"]});
  const eleve = {id: 7, ouvertes: {"4e-PCT-06": "2026-11-12", "4e-PCT-02": "2026-11-12", "3e-PCT-brevet": "2026-11-12",
    "3e-PYT-02": "2026-11-12", "4e-TRI-03": "2026-11-10", "3e-ZZZ-01": "2026-11-12", "4e-PCT-03": "13/11/2026"}};
  const jours = p.joursCoursDe(eleve);
  assert.deepEqual([...jours.keys()].sort(), ["2026-11-10", "2026-11-12"]);
  const douze = jours.get("2026-11-12");
  assert.deepEqual(douze.map(l => l.chapitre), ["Pourcentages", "Le triangle rectangle"], "un chapitre par ligne, dans l'ordre du livret");
  assert.deepEqual(douze[0].fiches, [2, 5], "les numéros que voient les élèves (4e-PCT-06 est la fiche 5)");
  assert.deepEqual(douze[1].fiches, [4], "3e-PYT-02 est la fiche 4 du chapitre");
  assert.equal(douze[0].brevet, true);
  // 4e-TRI-03 est commune à 4e-TRI et 3e-PYT : rangée dans le chapitre que la classe a ouvert.
  assert.deepEqual(jours.get("2026-11-10"), [{chapitre: "Le triangle rectangle", niveau: "3e", fiches: [3], brevet: false}]);
  assert.deepEqual(p.texteLigne("cours", douze[0]), ["Pourcentages : ouverture des fiches\u00a02 et 5 et des Exercices type", "", false]);
  assert.deepEqual(p.texteLigne("cours", jours.get("2026-11-10")[0]), ["Le triangle rectangle : ouverture de la fiche\u00a03", "", false]);
  assert.deepEqual(p.texteLigne("cours", {chapitre: "Le triangle rectangle", niveau: "3e", fiches: [], brevet: true}),
    ["Le triangle rectangle : ouverture de l’Entraînement brevet", "", false]);
  assert.equal(p.joursCoursDe({id: 8}).size, 0, "rien d'ouvert : rien");
  const texte = fonction(prof, "texteLigne");
  const brancheCours = texte.slice(texte.indexOf('cle === "cours"'), texte.indexOf('cle === "coffres"')).replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(brancheCours, /\blue\b|ouverte|ouvertes/, "jamais « lue », aucun accord");
});

test("fiche de l'élève : Cours dans « Activité » seulement — ni jour de travail, ni bilan ; un rond vide ; la phrase qui le dit", () => {
  const jours = fonction(prof, "joursDeLaFiche");
  assert.match(jours, /const eleveCours = eleveDe\("cours", id\);/);
  assert.match(jours, /lignes\.forEach\(ligne => parJour\.get\(jour\)\.push\(\{cle: "cours", ligne\}\)\);/);
  assert.match(jours, /ouvrir une fiche ne compte pas comme un jour de travail/);
  // Le bilan (calendrier, « N jours », absent, La classe) ne connaît toujours pas Cours.
  assert.match(fonction(prof, "applisDuBilan"), /APPLIS\.filter\(appli => !appli\.sansSuivi\)/);
  assert.doesNotMatch(fonction(prof, "bilanEleve"), /cours/i);
  assert.match(fonction(prof, "puceAppli"), /cle === "cours" \? "lc-puce cours" : "lc-puce"/);
  assert.match(prof, /\.lc-puce\.cours \{ background: #fff !important; border: 2px solid #063f86;/);
  // La liste de Cours se lit avec les autres, seulement si la classe a Cours.
  assert.match(fonction(prof, "coursALire"), /\.includes\("cours"\)/);
  assert.match(fonction(prof, "chargerLaClasse"), /chargerApplis\(listesALire\(\)\)/);
  assert.match(fonction(prof, "contenuEnsemble"), /const manquantes = listesALire\(\);/);
});

test("onglet Cours : un résumé — les élèves de la semaine, « ouvert par N élèves sur M », le nombre par fiche, la grille à déplier", () => {
  const p = pageProf({chapitres: ["4e-PCT"]});
  const liste = [{ouvertes: {"4e-PCT-01": "2026-11-09"}}, {ouvertes: {"4e-PCT-02": "2026-11-02", "3e-PCT-brevet": "2026-11-13"}}, {ouvertes: {}}, {}];
  assert.equal(p.combienOntOuvert(liste, ["4e-PCT-01", "4e-PCT-02", "3e-PCT-brevet"]), 2, "au moins une fiche du chapitre");
  assert.equal(p.combienOntOuvert(liste, ["4e-PCT-02"]), 1);
  assert.equal(p.combienOntOuvert(liste, ["4e-PCT-01", "4e-PCT-02"], "2026-11-09"), 1, "depuis lundi");
  const dessin = fonction(prof, "dessinerCoursProf");
  assert.match(dessin, /"Cette semaine, "/);
  assert.match(dessin, /"ouvert par "/);
  assert.match(dessin, /"Élève par élève ▾"/, "la grille complète reste, à déplier");
  assert.match(dessin, /const deplie = coursDeplies\.has\(cleChap\);/, "rien de déplié au départ");
  assert.match(dessin, /Ouvrir une fiche n’est pas la lire\./);
  assert.doesNotMatch(dessin, /\blue\b|\bil\b|\belle\b/, "jamais « lue », aucun mot genré");
});

test("« Régler les cours » : « Tout ouvrir » et « Tout fermer » pour le niveau affiché, rien ne part avant « Enregistrer »", () => {
  const regler = fonction(prof, "dessinerReglerCours");
  assert.match(regler, /\[\["Tout ouvrir", true, ouverts === chapitres\.length\], \["Tout fermer", false, ouverts === 0\]\]/);
  assert.match(regler, /chapitres\.forEach\(ch => \{ if \(ouvrir\) c\.chapitres\.add\(ch\.id\); else c\.chapitres\.delete\(ch\.id\); \}\);\s*dessinerRegler\(\);/,
    "le brouillon seulement, puis on redessine");
  assert.doesNotMatch(regler.slice(regler.indexOf("Tout ouvrir"), regler.indexOf("corps.append(tous)")), /api\(|sans\.|avec\./,
    "aucun envoi, et les cases des fiches ne bougent pas");
});
