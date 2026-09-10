// Lot 4a « Je pousse les perles » (09/09/2026).
//
// La cinquième activité de J'apprends : l'élève construit la table en poussant
// des perles sur le cent, et la table s'écrit sous ses doigts. Trois choses
// sont gardées ici parce qu'elles ont chacune coûté un essai raté.
//
// 1. LA GÉOMÉTRIE. Une seule règle à tous les écrans : l'intérieur du cadre
//    fait exactement 20 perles de large, donc les 10 perles d'une rangée en
//    occupent la moitié et la coupure entre les perles poussées et celles au
//    repos tombe toujours au MILIEU. Une maquette où la rangée remplissait 85 %
//    du cadre n'était pas lisible : « il manque l'écart ».
// 2. LA PRISE. Aucune zone par perle : la rangée entière écoute et on cherche
//    la perle la plus proche du doigt. Des zones de 44 px se chevauchaient
//    d'une rangée à l'autre (« je clique au-dessus et ça prend en dessous »),
//    et écarter les rangées — l'autre fausse solution — a été refusé.
// 3. CE QUI EST ÉCRIT. Sous le boulier, l'appli n'écrit pas la multiplication
//    (la bande la porte) mais l'ADDITION du geste : 9 + 1 + 2 = 12. Les deux
//    passages de la dizaine sortent tout seuls, sans guidage.
//
// Enfin : ce lot ne touche pas au moteur du parcours. L'activité ne compte
// pour rien tant que le lot 4b ne l'a pas ajoutée à ACTIVITES_APPRENDS.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const parcours = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// Les fonctions d'écriture sont pures : on les sort de la page et on les joue.
function fonction(nom, dependances = []) {
  const code = [...dependances.map(source), source(nom)].join("\n");
  return new Function(`${code}\nreturn ${nom};`)();
}

// --------------------------------------------------------- la géométrie

test("le cadre fait 20 perles de large : la coupure tombe au milieu, sur tous les écrans", () => {
  assert.match(html, /const PERLES = Object\.freeze\(\{[\s\S]*?montant: \.45,\s*hauteurRangee: 1\.49,\s*largeurCadre: 20\.9,\s*hauteurCadre: 14\.9,\s*maxi: 55, mini: 14/,
    "les mesures relevées dans son propre rekenrek : cadre de 1 240 px pour des perles de 55, montants de 40, rangées de 82");
  assert.match(html, /largeur \/ PERLES\.largeurCadre,\s*hauteur \/ PERLES\.hauteurCadre,\s*PERLES\.maxi/,
    "la perle est recalculée pour chaque écran (jamais un zoom de la géométrie du TNI)");
  assert.match(html, /Math\.max\(PERLES\.mini, Math\.floor\(Math\.min\(/);
  // 10 perles poussées, 10 au repos, dans 20 perles de large : le vide entre
  // les deux groupes fait toujours 10 perles, seule sa position bouge.
  const positionPerle = new Function(`const boulier = {taille: 10};
    const PERLES = {parRangee: 10};
    ${html.slice(html.indexOf("      function positionPerle("), html.indexOf("\n      }", html.indexOf("      function positionPerle(")) + 8)}
    return positionPerle;`)();
  assert.equal(positionPerle(0, true), 0);
  assert.equal(positionPerle(9, true), 90);
  assert.equal(positionPerle(0, false), 100);
  assert.equal(positionPerle(9, false), 190);
  for (let poussees = 0; poussees <= 10; poussees += 1) {
    const finDuGroupeGauche = poussees ? positionPerle(poussees - 1, true) + 10 : 0;
    const debutDuGroupeDroit = poussees < 10 ? positionPerle(poussees, false) : 200;
    assert.equal(debutDuGroupeDroit - finDuGroupeGauche, 100, `avec ${poussees} perles poussées, le vide vaut toujours dix perles`);
  }
});

test("la bande prend la largeur du boulier et se pose dessous", () => {
  assert.match(html, /dom\.bande\.style\.width = `\$\{interieur \+ montant \* 2\}px`;/);
  assert.match(html, /bloc\.append\(consigne, scene, bande, addition, tableFinale, terminer\);/,
    "consigne, boulier, bande, addition : la bande est collée au boulier, l'addition en dessous et en grand");
});

// ------------------------------------------------------------- la prise

test("c’est la rangée qui écoute, jamais une zone par perle", () => {
  assert.match(html, /\.perle \{[\s\S]*?pointer-events: none;/, "une perle ne reçoit rien : elle est dessinée, pas cliquée");
  assert.match(html, /interieur\.addEventListener\("pointerdown", perlesPointerDown\)/);
  assert.match(html, /const rangee = Math\.min\(PERLES\.rangees - 1, Math\.max\(0, Math\.floor\(\(event\.clientY - rect\.top\) \/ hauteurRangee\)\)\)/,
    "la rangée se déduit de la hauteur du doigt : aucune zone ne peut déborder sur sa voisine");
  assert.match(html, /const distance = Math\.abs\(centre - x\);\s*if \(distance < meilleure\)/, "puis la perle la plus proche du doigt");
  assert.doesNotMatch(html, /perle\.addEventListener\("pointerdown"/, "surtout pas une cible par perle : c’est ce qui prenait la rangée du dessous");
});

test("un geste déplace tout le groupe, et au relâché c’est tout ou rien à une perle près", () => {
  assert.match(html, /const premiere = pousse \? etat : drag\.index;\s*const derniere = pousse \? drag\.index : etat - 1;/,
    "attraper la perle i pousse tout le groupe de etats[r] à i, comme dans son appli");
  assert.match(html, /const tolerance = boulier\.taille;/);
  assert.match(html, /if \(pousse && drag\.position <= positionPerle\(drag\.index, true\) \+ tolerance\) nouvel = drag\.index \+ 1;/);
  assert.match(html, /if \(!pousse && drag\.position >= positionPerle\(drag\.index, false\) - tolerance\) nouvel = drag\.index;/);
  assert.match(html, /rangee\.perles\[i\]\.style\.transition = "none";\s*rangee\.perles\[i\]\.style\.left = `\$\{gauche\}px`;/,
    "pendant le geste, les perles suivent le doigt en direct — pas un saut au relâché");
});

// ---------------------------------------------------- ce qui est écrit

test("l’addition s’écrit toute seule au fil des gestes", () => {
  const phraseAddition = fonction("phraseAddition", ["sommeMorceaux"]);
  assert.equal(phraseAddition(0, []), "", "rien de poussé, rien d’écrit");
  assert.equal(phraseAddition(0, [3]), "3", "la première fois, il n’y a pas d’addition à écrire");
  assert.equal(phraseAddition(3, [3]), "3 + 3 = 6");
  assert.equal(phraseAddition(9, [1]), "9 + 1 = 10");
  assert.equal(phraseAddition(9, [1, 2]), "9 + 1 + 2 = 12", "le passage de la dizaine sort du geste, il n’est pas programmé");
  assert.equal(phraseAddition(18, [2, 1]), "18 + 2 + 1 = 21", "et l’autre passage se fait dans l’autre sens");
  assert.equal(phraseAddition(9, [1, 1, 1]), "9 + 1 + 1 + 1 = 12", "un élève qui pousse une par une le voit : c’est long et laid, c’est la leçon");
  assert.equal(phraseAddition(12, []), "12", "juste après une case remplie");
});

test("un morceau à cheval sur une case se coupe au bon endroit", () => {
  const couperMorceaux = fonction("couperMorceaux");
  assert.deepEqual(couperMorceaux([3], 3), {debut: [3], reste: []});
  assert.deepEqual(couperMorceaux([10], 3), {debut: [3], reste: [7]}, "dix perles d’un coup dans la table de 3 : la case 1×3 se remplit, il reste 7");
  assert.deepEqual(couperMorceaux([1, 2], 3), {debut: [1, 2], reste: []});
  assert.deepEqual(couperMorceaux([1, 5], 3), {debut: [1, 2], reste: [3]});
  assert.deepEqual(couperMorceaux([], 3), {debut: [], reste: []});
});

test("la phrase se fige quand la case se remplit, et se défait quand l’élève revient en arrière", () => {
  assert.match(html, /if \(valide\) boulier\.figee = !boulier\.morceaux\.length;/,
    "figée seulement si le geste s’arrête pile sur la case : sinon on continue d’écrire");
  assert.match(html, /dom\.addition\.textContent = boulier\.figee\s*\? boulier\.phrase/);
  assert.match(html, /state\.revealedLearnResults\.delete\(boulier\.etape\);\s*boulier\.etape -= 1;/,
    "des perles ramenées à droite dépeuplent la bande");
  assert.match(html, /boulier\.morceaux = \(boulier\.pile\.pop\(\) \|\| \[\]\)\.concat\(boulier\.morceaux\);/,
    "et les morceaux qui avaient fait cette case redeviennent en cours");
  assert.match(html, /const attendu = totalPerles\(\) - boulier\.etape \* boulier\.table;\s*if \(sommeMorceaux\(boulier\.morceaux\) !== attendu\)/,
    "filet : ce qui est écrit est toujours ce que montre le boulier");
});

test("aucun guidage : la consigne ne change jamais", () => {
  assert.match(html, /consigne\.textContent = `Pousse \$\{table\} perle\$\{table > 1 \? "s" : ""\}\.`;/);
  assert.doesNotMatch(html, /pour finir la rangée/, "on n’explique pas le passage de la dizaine : l’écriture le montre");
});

test("à la fin, le boulier s’efface et la table entière reste", () => {
  assert.match(html, /\.question\.perles-main\.est-finie \.perles-scene,\s*\.question\.perles-main\.est-finie \.perles-consigne,\s*\.question\.perles-main\.est-finie \.perles-addition,\s*\.question\.perles-main\.est-finie \.number-stick \{ display: none; \}/,
    "le rekenrek ne sert plus à rien à cette étape (Gwenaël, sur la maquette)");
  assert.match(html, /\.question\.perles-main\.est-finie \.perles-table \{ display: grid; \}/);
  assert.match(html, /calcul\.textContent = `\$\{multiplicateur\} × \$\{boulier\.table\}`/);
  // Les onze lignes forment UNE grille de trois colonnes, centrée en bloc sous
  // le titre : lignes centrées une par une, l’écriture partait vers la droite
  // et « le centrage gauche-droite est moche par rapport au titre ».
  assert.match(html, /\.perles-table \{[\s\S]*?display: grid;\s*grid-template-columns: auto auto auto;\s*justify-content: center;/);
  assert.match(html, /\.perles-table li \{ display: contents; \}/);
  assert.match(html, /\.perles-table li b \{ text-align: right; color: var\(--teal\); \}/,
    "les produits alignés à droite : c’est cet alignement qui montre le motif des unités");
});

// ---------------------------------------------------------- la bande

test("les étiquettes de la bande portent la multiplication entière, collée", () => {
  assert.match(html, /multiplierLabel\.textContent = `\$\{multiplier\}×\$\{table\}`;/,
    "« 0×3 … 10×3 » : « ×3 » se lisait « fois trois », à l’envers du sens n × table");
  assert.doesNotMatch(html, /multiplierLabel\.textContent = `×\$\{multiplier\}`/);
  assert.match(html, /@media \(min-width: 621px\) \{\s*\.number-stick \{ width: min\(100%, 760px\); padding: 4px; \}/,
    "la bande grandit dès la tablette : il y a la place");
  assert.match(html, /@media \(min-width: 1040px\) \{\s*\.number-stick \{ width: min\(100%, 860px\); \}\s*\.number-stick-cell \{ min-height: 86px;/);
});

// ------------------------------------------------- ce que le lot NE fait PAS

test("l’activité n’apparaît qu’à son adresse d’essai", () => {
  assert.match(html, /get\("essai"\) === "perles"/);
  assert.match(html, /\.\.\.\(ESSAI_PERLES \? \[\{\s*libelle: "Je pousse les perles",/,
    "elle se place en tête de « Choisis ton activité », là où elle vivra au lot 4b");
  assert.match(html, /lancer: \(\) => launchFromParcours\(\{mode: "learn", tables: \[table\], learnActivity: "beads"\}, "menu"\)/);
});

test("le moteur du parcours ignore l’activité : rien n’est compté, rien n’est enregistré", () => {
  const config = core.normalizeConfiguration({mode: "learn", tables: [3], learnActivity: "beads"});
  assert.equal(config.learnActivity, "beads", "le noyau la connaît (il fabrique les onze produits)");
  assert.deepEqual(config.tables, [3]);
  assert.equal(core.generateQuestions(config).length, 11);
  assert.deepEqual(core.generateQuestions(config).map(question => question.multiplier), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "dans l’ordre, comme « je construis le bâton »");
  assert.ok(!parcours.ACTIVITES_APPRENDS.includes("beads"), "le moteur épinglé, lui, ne la connaît pas encore : c’est le lot 4b");
  assert.equal(parcours.classerSerie(parcours.creerParcours(), config), null, "donc la série ne compte pour rien");
  const etat = parcours.creerParcours();
  assert.equal(parcours.demarrerSerie(etat, config), etat, "aucune case « commencée »");
  const apres = parcours.appliquerSerie(etat, config, {correct: 11, total: 11});
  assert.equal(apres.classement, null);
  assert.deepEqual(apres.parcours, etat, "et le parcours enregistré ne bouge pas d’un octet");
  assert.ok(!parcours.serieAlimenteGrille(config), "J’apprends n’alimente jamais la grille des 36 calculs");
});

test("le moteur épinglé n’est pas touché par ce lot", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20260908-13/, "pas de nouveau numéro : pas de dépôt FTP pour ce lot");
  assert.match(html, /defi_tables_core\.js\?v=20260909-1/, "le noyau, lui, a changé (il accepte « beads ») : son numéro suit");
});
