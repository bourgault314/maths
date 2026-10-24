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
// 4. LE GESTE (correctifs du 10/09/2026, premier essai au doigt de Gwenaël).
//    « Pousse 2 perles » veut dire deux, pas huit — et pas un plus un non plus.
//    Un seul geste est accepté : le bon nombre, d'un coup, sur la rangée en
//    cours ; tout autre groupe revient à droite et la consigne dit ce qu'on
//    attendait. Le 4a acceptait tout et remplissait quatre cases d'un coup ;
//    « il y en a qui vont faire plus un, plus un, plus un » a tranché le reste.
//
// 5. LA CONSIGNE (lot 4b, deuxième essai au doigt) : elle suit l'étape, et
//    les refus ne donnent plus la réponse. « Pousse 8 perles. » / « Pousse
//    8 perles en deux coups. » / après le premier coup « 2 + ? = 8 » ; refus :
//    « Trop de perles ! », « Pas assez de perles ! », « Finis la rangée
//    d'abord ! ». « Pousse-en 6 » disait la décomposition à la place de l'élève.
//
// Depuis le lot 4b, l'activité COMPTE : « beads » est la première des cinq
// activités de J'apprends du moteur épinglé, ouverte à tous.

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

test("le cadre fait 20 perles de large — 15 sur un téléphone — et la coupure reste nette", () => {
  assert.match(html, /const PERLES = Object\.freeze\(\{[\s\S]*?montant: \.45,\s*hauteurRangee: 1\.49,\s*largeurCadre: 20\.9,\s*hauteurCadre: 14\.9,\s*maxi: 55, mini: 14,\s*ecart: 10, ecartSerre: 5, perleAuDoigt: 22/,
    "les mesures relevées dans son propre rekenrek : cadre de 1 240 px pour des perles de 55, montants de 40, rangées de 82");
  assert.match(html, /const taillePour = largeurCadre => Math\.max\(PERLES\.mini, Math\.floor\(Math\.min\(\s*largeur \/ largeurCadre,\s*hauteur \/ PERLES\.hauteurCadre,\s*PERLES\.maxi/,
    "la perle est recalculée pour chaque écran (jamais un zoom de la géométrie du TNI)");
  // Lot R1 (audit du 11/09, A9) : sur un téléphone de 402 px le cadre de 20
  // donnait des perles de 17 px et des rangées de 25 — trop petit pour un
  // doigt. Sous 22 px de perle, le vide passe de 10 à 5 perles : 23 px,
  // rangées de 34. Tablette et ordinateur gardent le cadre de 20.
  assert.match(html, /let taille = taillePour\(PERLES\.largeurCadre\);[\s\S]*?const tailleSerree = taillePour\(PERLES\.largeurCadre - PERLES\.ecart \+ PERLES\.ecartSerre\);\s*if \(taille < PERLES\.perleAuDoigt && tailleSerree > taille\) \{\s*ecart = PERLES\.ecartSerre;\s*taille = tailleSerree;/);
  assert.match(html, /if \(taille === boulier\.taille && ecart === boulier\.ecart\) return;/);
  assert.match(html, /const interieur = taille \* \(PERLES\.parRangee \+ boulier\.ecart\);/, "l'intérieur du cadre suit le vide choisi");
  const source = html.slice(html.indexOf("      function positionPerle("), html.indexOf("\n      }", html.indexOf("      function positionPerle(")) + 8);
  for (const ecart of [10, 5]) {
    // 10 perles poussées, 10 au repos : le vide entre les deux groupes garde
    // toujours la même largeur (10 perles, ou 5), seule sa position bouge.
    const positionPerle = new Function(`const boulier = {taille: 10, ecart: ${ecart}};
      const PERLES = {parRangee: 10};
      ${source}
      return positionPerle;`)();
    assert.equal(positionPerle(0, true), 0);
    assert.equal(positionPerle(9, true), 90);
    assert.equal(positionPerle(0, false), ecart * 10);
    assert.equal(positionPerle(9, false), ecart * 10 + 90);
    for (let poussees = 0; poussees <= 10; poussees += 1) {
      const finDuGroupeGauche = poussees ? positionPerle(poussees - 1, true) + 10 : 0;
      const debutDuGroupeDroit = poussees < 10 ? positionPerle(poussees, false) : (ecart + 10) * 10;
      assert.equal(debutDuGroupeDroit - finDuGroupeGauche, ecart * 10, `avec ${poussees} perles poussées, le vide vaut toujours ${ecart} perles`);
    }
  }
  // La géométrie de la page tient la promesse : 402 px de large (iPhone),
  // 372 px pour la scène → 17 px avec le cadre de 20, 23 px avec le cadre de 15.
  assert.equal(Math.floor(372 / 20.9), 17);
  assert.equal(Math.floor(372 / 15.9), 23);
  assert.ok(Math.round(23 * 1.49) >= 32, "la rangée se prend au doigt : 32 px au moins");
  // Relecture du 12/09 : on ne resserre que si la perle y GAGNE. Sur un
  // portable (fenêtre 1536 × 730 : 716 px de large, 326 de haut pour le
  // boulier) ou un vidéoprojecteur, c'est la hauteur qui limite — resserrer
  // ne ferait que rétrécir le cadre, et la bande avec lui, dont les
  // étiquettes « 10×8 » se marcheraient dessus.
  const perlePour = (largeur, hauteur, cadre) => Math.max(14, Math.floor(Math.min(largeur / cadre, hauteur / 14.9, 55)));
  assert.equal(perlePour(716, 326, 20.9), 21);
  assert.equal(perlePour(716, 326, 15.9), 21, "portable : le cadre de 15 ne donne pas une perle plus grosse, on garde le cadre de 20");
  assert.ok(perlePour(372, 421, 15.9) > perlePour(372, 421, 20.9), "iPhone de 402 px : là, le cadre de 15 fait bien grandir la perle (17 → 23)");
});

test("la bande et l'addition au-dessus, le boulier en bas, dans la même scène", () => {
  // Lot R4 : la bande prend la largeur du boulier tant que ses étiquettes y
  // tiennent (largeurBande), et pas plus large qu'il ne faut — la règle est
  // détaillée dans defi-tables-bande-et-calculs.test.mjs.
  assert.match(html, /dom\.bande\.style\.width = `\$\{largeurBande\(interieur \+ montant \* 2\)\}px`;/, "la bande part de la largeur du boulier");
  // Lot R1 : décidé par Gwenaël sur son iPhone (11/09) — « le boulier
  // au-dessus fait qu'on ne regarde pas les résultats » : de haut en bas,
  // la bande, l'addition, puis le boulier, là où le pouce travaille. Le même
  // ordre sur tablette et ordinateur.
  assert.match(html, /scene\.append\(bande, addition, cadre\);\s*bloc\.append\(consigne, scene, tableFinale, terminer\);/,
    "bande, addition, boulier vivent dans la même scène, centrés ensemble sous la consigne (lot 4b : l'espace libre ne se glisse plus entre eux)");
  assert.match(html, /\.perles-scene \{[^}]*grid-auto-rows: max-content; align-content: space-evenly;/, "l'espace libre se partage à égalité autour et entre les trois");
  assert.match(html, /let hauteur = dom\.scene\.clientHeight - dom\.bande\.offsetHeight - dom\.addition\.offsetHeight - interligne \* 2;/,
    "la mesure du boulier retire la bande et l'addition de la hauteur disponible");
});

test("lot R1 : ce qui se lit sur un téléphone — barre d'état sur une ligne, table finale en grand", () => {
  // A15 : « Ma / table » et « À ton / rythme » se coupaient en deux.
  assert.match(html, /\.challenge-playing \.game-menu \{ padding: 4px 9px; white-space: nowrap; \}/);
  // Relecture du 12/09 : les deux pastilles ne se coupent plus, mais le
  // compteur du milieu peut passer à la ligne — sinon son texte passait SOUS
  // la pastille du temps (« cases complét » à 375 et 360 px, et à 402 px
  // quand le bouton dit « Mon parcours »).
  assert.match(html, /\.challenge-playing #question-count \{ font-size: \.92rem; line-height: 1\.15; \}/);
  assert.doesNotMatch(html, /\.challenge-playing #question-count \{[^}]*white-space: nowrap/);
  // La pastille du temps garde ses 78 px (règle du dessus) : le chrono ne
  // change plus de largeur à chaque seconde.
  assert.match(html, /\.challenge-playing \.status strong \{ flex-shrink: 0; white-space: nowrap; \}/);
  assert.match(html, /\.challenge-playing \.status strong\.no-timer \{ padding: 4px 9px; font-size: \.84rem; \}/);
  // P2 : la table construite en grand sur toute la page (18 px avant).
  assert.match(html, /\.perles-table \{[\s\S]*?font-size: clamp\(1\.1rem, min\(8vw, 4\.2dvh\), 3rem\);\s*font-weight: 900;\s*line-height: 1\.3;/);
  assert.match(html, /\.question\.perles-main\.est-finie \.expression \{ margin: 0 0 8px; font-size: clamp\(1\.45rem, 7vw, 2\.6rem\); \}/);
  // G6 : sur l'écran de la bande, le titre n'est plus 50 px (32 px, la bande centrée dessous).
  assert.match(html, /\.question\.stick-main \.expression,\s*\.challenge-playing \.question\.stick-main \.expression \{ min-height: 0; margin: 4px 0 6px; padding: 6px 14px; font-size: clamp\(1\.6rem, 8vw, 2rem\); \}/);
  assert.match(html, /\.challenge-playing \.question\.stick-main \.learn-sequence \{ margin: auto 0; \}/);
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

test("un seul geste est accepté : le bon nombre, d’un coup, sur la rangée en cours", () => {
  const PERLES = {parRangee: 10};
  const code = [source("gesteAttendu"), source("verifierGeste")].join("\n");
  const {gesteAttendu, verifierGeste} = new Function(`const PERLES = ${JSON.stringify(PERLES)};\n${code}\nreturn {gesteAttendu, verifierGeste};`)();
  const vide = () => Array(10).fill(0);
  const etats = (...valeurs) => Object.assign(vide(), valeurs);

  // Le geste attendu, table de 8 : 8 d’un coup, puis 2 (la rangée se finit) et 6, puis 4 et 4.
  assert.deepEqual(gesteAttendu(vide(), 0, 8), {rangee: 0, nombre: 8});
  assert.deepEqual(gesteAttendu(etats(8), 1, 8), {rangee: 0, nombre: 2}, "il ne reste que 2 perles libres sur la rangée");
  assert.deepEqual(gesteAttendu(etats(10), 1, 8), {rangee: 1, nombre: 6}, "puis les 6 qui manquent, sur la rangée suivante");
  assert.deepEqual(gesteAttendu(etats(10, 6), 2, 8), {rangee: 1, nombre: 4});
  assert.deepEqual(gesteAttendu(etats(10, 10), 2, 8), {rangee: 2, nombre: 4});
  // Table de 3, arrivé à 9 : 1 puis 2 — l’écriture dira 9 + 1 + 2 = 12.
  assert.deepEqual(gesteAttendu(etats(9), 3, 3), {rangee: 0, nombre: 1});
  assert.deepEqual(gesteAttendu(etats(10), 3, 3), {rangee: 1, nombre: 2});

  // Les trois refus, et le bon geste.
  assert.equal(verifierGeste(vide(), 0, 2, 0, 2), null, "table de 2 : deux perles d’un coup, c’est le bon geste");
  assert.deepEqual(verifierGeste(vide(), 0, 2, 0, 8), {motif: "trop", nombre: 2}, "huit d’un coup : trop");
  assert.deepEqual(verifierGeste(vide(), 0, 3, 0, 1), {motif: "peu", nombre: 3}, "une seule à la table de 3 : le +1+1+1 est refusé");
  assert.deepEqual(verifierGeste(etats(8), 1, 8, 1, 8), {motif: "rangee", nombre: 2}, "sauter à la rangée du dessous sans finir celle-ci");
  assert.equal(verifierGeste(etats(8), 1, 8, 0, 2), null, "finir la rangée avec 2 : bon geste");
  assert.equal(verifierGeste(etats(10), 1, 8, 1, 6), null, "puis 6 sur la suivante : bon geste");
  assert.deepEqual(verifierGeste(etats(10), 1, 8, 1, 8), {motif: "trop", nombre: 6});
  assert.equal(verifierGeste(etats(9), 3, 3, 0, 1), null, "9 + 1 : la seule perle libre, c’est le bon geste");
  assert.equal(verifierGeste(etats(6, 3), 4, 2, 2, -3), null, "ramener des perles à droite est toujours permis, sur n’importe quelle rangée");

  // Dans le geste : le refus passe AVANT d’écrire l’état, et redessine ; un bon geste lève le refus.
  assert.match(html, /const refus = verifierGeste\(boulier\.etats, boulier\.etape, boulier\.table, drag\.rangee, ecart\);\s*if \(refus\) \{\s*dessinerBoulier\(true\);\s*refuserGeste\(refus\);\s*return;\s*\}\s*boulier\.etats\[drag\.rangee\] = nouvel;/,
    "le groupe repart d’où il vient : etats[r] n’est pas touché");
  assert.match(html, /if \(ecart\) \{ leverRefus\(\); enregistrerGeste\(ecart\); \}/, "« Trop de perles ! » ne reste pas pendant que la case se remplit");
});

test("le refus ne dit que la direction, en rouge, à la même place, puis la consigne revient", () => {
  const messageRefus = fonction("messageRefus");
  assert.equal(messageRefus({motif: "trop", nombre: 2}), "Trop de perles !");
  assert.equal(messageRefus({motif: "peu", nombre: 3}), "Pas assez de perles !");
  assert.equal(messageRefus({motif: "peu", nombre: 6}), "Pas assez de perles !", "jamais le nombre : « Pousse-en 6 » donnait la décomposition 2 + 6");
  assert.equal(messageRefus({motif: "rangee", nombre: 2}), "Finis la rangée d’abord !");
  assert.doesNotMatch(source("messageRefus"), /refus\.nombre/, "le nombre attendu ne sort jamais vers l’élève");
  assert.match(html, /consigne\.classList\.remove\("est-refus"\);\s*void consigne\.offsetWidth;\s*consigne\.classList\.add\("est-refus"\);/,
    "le tremblement rejoue à chaque refus, même enchaîné");
  assert.match(html, /boulier\.refus = setTimeout\(leverRefus, 1800\);/);
  assert.match(html, /consigne\.textContent = consigneDeBase\(\);\s*consigne\.classList\.remove\("est-refus"\);/,
    "la consigne redevient celle de l’étape — jamais un autre texte");
  assert.match(html, /\.perles-consigne\.est-refus \{ color: var\(--red\);/);
  assert.match(html, /clearTimeout\(boulier\.refus\);\s*Object\.assign\(boulier, \{/, "un boulier neuf n’hérite pas d’un refus en cours");
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
  // Audit 4 : la phrase passe par ecrireAddition (les « + 2 » en bleu), même texte.
  assert.match(html, /ecrireAddition\(dom\.addition, boulier\.figee\s*\? boulier\.phrase/);
  assert.match(html, /state\.revealedLearnResults\.delete\(boulier\.etape\);\s*boulier\.etape -= 1;/,
    "des perles ramenées à droite dépeuplent la bande");
  assert.match(html, /boulier\.morceaux = \(boulier\.pile\.pop\(\) \|\| \[\]\)\.concat\(boulier\.morceaux\);/,
    "et les morceaux qui avaient fait cette case redeviennent en cours");
  assert.match(html, /const attendu = totalPerles\(\) - boulier\.etape \* boulier\.table;\s*if \(sommeMorceaux\(boulier\.morceaux\) !== attendu\)/,
    "filet : ce qui est écrit est toujours ce que montre le boulier");
});

test("la consigne suit l’étape : « en deux coups » quand la rangée ne peut pas tout prendre, puis « 2 + ? = 8 »", () => {
  // consigneDeBase lit l'état du boulier : on le joue avec de vrais états.
  const code = [source("gesteAttendu"), source("totalPerles"), source("consigneDeBase")].join("\n");
  const consigne = (table, etape, ...valeurs) => new Function(`const PERLES = {parRangee: 10, rangees: 10};
    const boulier = {table: ${table}, etape: ${etape}, etats: Object.assign(Array(10).fill(0), ${JSON.stringify(valeurs)})};
    ${code}
    return consigneDeBase();`)();
  // Table de 8 : 8 d'un coup ; puis la rangée n'a que 2 perles libres → en deux coups ; après le 2 → 2 + ? = 8.
  assert.equal(consigne(8, 0), "Pousse 8 perles.");
  assert.equal(consigne(8, 1, 8), "Pousse 8 perles en deux coups.", "la rangée en cours ne peut pas prendre les 8");
  assert.equal(consigne(8, 1, 10), "2 + ? = 8", "après le premier coup : la question, jamais le 6");
  assert.equal(consigne(8, 2, 10, 6), "Pousse 8 perles en deux coups.", "16 : il reste 4 sur la rangée");
  assert.equal(consigne(8, 2, 10, 10), "4 + ? = 8");
  assert.equal(consigne(8, 3, 10, 10, 4), "Pousse 8 perles en deux coups.", "24 : la rangée n’a que 6 places");
  assert.equal(consigne(8, 5, 10, 10, 10, 10), "Pousse 8 perles.", "40 : rangée neuve, ça tient");
  // Table de 3 : 3, 3, 3, puis 9 + 1 + 2.
  assert.equal(consigne(3, 3, 9), "Pousse 3 perles en deux coups.");
  assert.equal(consigne(3, 3, 10), "1 + ? = 3");
  assert.equal(consigne(3, 4, 10, 2), "Pousse 3 perles.");
  // Table de 2 : jamais en deux coups (10 est pair). Table de 10 : une rangée par case.
  for (let etape = 0; etape < 10; etape += 1) assert.equal(consigne(2, etape, ...Array(Math.floor(etape * 2 / 10)).fill(10), (etape * 2) % 10), "Pousse 2 perles.");
  assert.equal(consigne(10, 3, 10, 10, 10), "Pousse 10 perles.");
  assert.equal(consigne(1, 0), "Pousse 1 perle.");
  assert.equal(consigne(3, 10, ...Array(10).fill(10)), "", "table finie : plus de consigne (elle est cachée de toute façon)");
  // Elle est posée à la construction et recalculée après chaque geste accepté — pas pendant un refus.
  assert.match(html, /consigne\.textContent = consigneDeBase\(\);\s*const scene = document\.createElement\("div"\);/);
  assert.match(html, /if \(consigne && !consigne\.classList\.contains\("est-refus"\)\) consigne\.textContent = consigneDeBase\(\);/,
    "majBoulier remet la consigne à jour, sauf pendant le message rouge (leverRefus s’en charge)");
  assert.doesNotMatch(html.replace(/\/\/[^\n]*/g, ""), /pour finir la rangée|D’un seul coup|Pousse-en/, "on n’explique pas la décomposition : l’élève la trouve, l’écriture la montre (hors commentaires)");
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
  assert.match(html, /texte\.append\(String\(multiplier\), fois, String\(table\)\);/,
    "« 0×3 … 10×3 » : « ×3 » se lisait « fois trois », à l’envers du sens n × table");
  assert.doesNotMatch(html, /texte\.append\(fois, String\(multiplier\)\)/);
  assert.match(html, /@media \(min-width: 621px\) \{\s*\.number-stick \{ width: min\(100%, 760px\); padding: 4px; \}/,
    "la bande grandit dès la tablette : il y a la place");
  assert.match(html, /@media \(min-width: 1040px\) \{\s*\.number-stick \{ width: min\(100%, 860px\); \}\s*\.number-stick-cell \{ min-height: 86px;/);
});

// ------------------------------------------------- l'activité compte (lot 4b)

test("l’activité est ouverte à tous, en tête de J’apprends", () => {
  assert.doesNotMatch(html, /ESSAI_PERLES|essai=perles|get\("essai"\)/, "plus de garde d’essai");
  assert.equal(parcours.ACTIVITES_APPRENDS[0], "beads", "première des cinq activités du moteur");
  assert.equal(parcours.ACTIVITES_APPRENDS.length, 5);
  assert.equal(parcours.LIBELLES_APPRENDS.beads, "je pousse les perles");
  assert.equal(parcours.CONSIGNES_APPRENDS.beads, "pousse les perles");
  // L'accueil liste ligne.apprends, donc les perles en tête, sans rien d'ajouté à la main.
  assert.match(html, /items: ligne\.apprends\.map\(item => \(\{\s*libelle: majuscule\(PARCOURS\.LIBELLES_APPRENDS\[item\.activite\]\),/);
  assert.doesNotMatch(html, /sur 4`|4 activités"|\/ 4\)/, "plus aucun « sur 4 » écrit en dur : le nombre vient du moteur");
});

test("le moteur du parcours compte l’activité : commencée, terminée, « 1 activité sur 5 »", () => {
  const config = core.normalizeConfiguration({mode: "learn", tables: [3], learnActivity: "beads"});
  assert.equal(config.learnActivity, "beads", "le noyau la connaît (il fabrique les onze produits)");
  assert.deepEqual(config.tables, [3]);
  assert.equal(core.generateQuestions(config).length, 11);
  assert.deepEqual(core.generateQuestions(config).map(question => question.multiplier), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "dans l’ordre, comme « je construis la bande »");
  assert.deepEqual(parcours.classerSerie(parcours.creerParcours(), config), {type: "apprends", table: 3, activite: "beads"});
  const etat = parcours.creerParcours();
  const commence = parcours.demarrerSerie(etat, config);
  assert.equal(commence.tables[3].apprends.beads, 1, "la case « commencée »");
  assert.equal(etat.tables[3].apprends.beads, 0, "sans toucher à l’objet reçu");
  const apres = parcours.appliquerSerie(commence, config, {correct: 11, total: 11});
  assert.equal(apres.parcours.tables[3].apprends.beads, 2);
  assert.deepEqual(apres.evenements, [{type: "apprends", table: 3, activite: "beads", termines: 1, fois: 1}]);
  assert.deepEqual(parcours.etatAffichage(apres.parcours).lignes[1].apprends.map(item => item.activite), ["beads", "construct", "gaps", "ordered", "random"]);
  assert.ok(!parcours.serieAlimenteGrille(config), "J’apprends n’alimente jamais la grille des 36 calculs");
});

test("un parcours d’avant garde ses cases : rien ne glisse d’un cran", () => {
  // Les activités sont rangées PAR NOM : un parcours enregistré avant le lot
  // 4b (v1 ou v2) retrouve exactement ses cases, et la perle qui lui manque
  // vaut 0. « Les élèves qui ont déjà validé des activités gardent leurs
  // cases ; la nouvelle s'insère AVANT, rien ne doit glisser d'un cran. »
  const cases = {construct: 2, gaps: 1, ordered: 2, random: 0};
  [
    {version: 2, tables: {7: {apprends: cases}}, rang: 0, jours: []},
    {version: 1, tables: {7: {apprends: cases, acquise: "2026-09-01"}}, expert: {niveau: 3}},
    {tables: {7: {apprends: cases}}}
  ].forEach(brut => {
    const relu = parcours.normaliserParcours(brut);
    assert.deepEqual(relu.tables[7].apprends, {beads: 0, construct: 2, gaps: 1, ordered: 2, random: 0}, `parcours ${brut.version || "sans version"}`);
    assert.equal(relu.version, 3, "lot mémoire : version 3");
    const ligne = parcours.etatAffichage(relu).lignes.find(item => item.table === 7);
    assert.deepEqual(ligne.apprends.map(item => item.etat), [0, 2, 1, 2, 0], "l’accueil montre ○ ✓ ◔ ✓ ○ : les perles à faire, le reste tel quel");
    assert.equal(ligne.apprends.filter(item => item.etat === 2).length, 2, "« 2 activités sur 5 »");
  });
  // Un parcours de référence complet (tel que le serveur le renvoie) : idem.
  const reference = JSON.parse(JSON.stringify(parcours.normaliserParcours({version: 2, tables: {5: {apprends: {construct: 2, gaps: 2, ordered: 2, random: 2}}}})));
  assert.deepEqual(reference.tables[5].apprends, {beads: 0, construct: 2, gaps: 2, ordered: 2, random: 2});
  // La fusion de deux appareils, dont un resté sur l'ancienne appli (sans « beads ») : le maximum par nom.
  const neuf = parcours.normaliserParcours({version: 2, tables: {5: {apprends: {beads: 2, construct: 1}}}});
  const vieux = {version: 2, tables: {5: {apprends: {construct: 2, gaps: 2}}}};
  [parcours.fusionner(neuf, vieux), parcours.fusionner(vieux, neuf)].forEach(fusion => {
    assert.deepEqual(fusion.tables[5].apprends, {beads: 2, construct: 2, gaps: 2, ordered: 0, random: 0});
  });
  // Et la remise à zéro repart avec les cinq.
  assert.deepEqual(parcours.remettreAZero(neuf).tables[5].apprends, {beads: 0, construct: 0, gaps: 0, ordered: 0, random: 0});
});

test("le rond bleu : J’apprends tant que les cinq ne sont pas terminées et qu’aucun entraînement n’est réussi", () => {
  // Règle de Gwenaël, 10/09/2026 : « finir un J'apprends ne veut pas dire
  // qu'il connaît ». Deux portes vers Je m'entraîne : les cinq activités
  // terminées, OU un entraînement réussi (valeur 2) de lui-même.
  const ligne = (apprends = {}, entraine = {}) => {
    const p = parcours.normaliserParcours({version: 2, tables: {6: {apprends, entraine}}});
    return parcours.etatAffichage(p).lignes.find(item => item.table === 6);
  };
  assert.equal(parcours.conseilTable(parcours.creerParcours().tables[6]), "apprends", "parcours vierge → J’apprends");
  assert.equal(parcours.prochaineEtape(parcours.creerParcours()).activite, "beads", "… et d’abord les perles");
  assert.equal(ligne({construct: 1}).conseil, "apprends", "une activité à moitié → toujours J’apprends");
  assert.equal(ligne({beads: 2, construct: 2, gaps: 2, ordered: 2}).conseil, "apprends", "4 sur 5 → toujours J’apprends");
  assert.equal(ligne({beads: 2, construct: 2, gaps: 2, ordered: 2, random: 2}).conseil, "entraine", "5 sur 5 → Je m’entraîne");
  assert.equal(ligne({}, {desordre: 2}).conseil, "entraine", "un entraînement réussi avec 0 activité → Je m’entraîne");
  assert.equal(ligne({}, {desordre: 1}).conseil, "apprends", "un entraînement seulement tenté (1) ne compte pas");
  // Lot « dosage + validation » (19/09/2026) : les trois réussis ne
  // suffisent plus sans les 8 calculs en boîte 3 — conseilTable seule (sans
  // le point sur la grille) garde la lecture d'avant, la ligne de
  // etatAffichage lit la grille.
  assert.equal(parcours.conseilTable(parcours.normaliserParcours({version: 2, tables: {6: {entraine: {desordre: 2, trous: 2, mixte: 2}}}}).tables[6]), "valide", "sans la grille : la règle d’avant");
  assert.equal(ligne({}, {desordre: 2, trous: 2, mixte: 2}).conseil, "entraine", "les trois réussis, grille vide → toujours Je m’entraîne");
  assert.equal(ligne({beads: 2}, {desordre: 2, trous: 2, mixte: 2, acquise: null}).conseil, "entraine");
  // prochaineEtape suit la même règle, et nomme l'activité conseillée.
  const p = parcours.normaliserParcours({version: 2, tables: {2: {apprends: {beads: 2, construct: 2}}}});
  assert.deepEqual(parcours.prochaineEtape(p), {type: "apprends", table: 2, activite: "gaps", libelle: "Table de 2 : complète une bande à trous", config: {mode: "learn", tables: [2], learnActivity: "gaps"}});
  // Un élève qui saute tout et valide : la table est acquise, le moteur passe à la suivante, comme aujourd'hui.
  const direct = parcours.appliquerSerie(parcours.creerParcours(), parcours.configValidation(2), {correct: 20, total: 20}).parcours;
  assert.ok(direct.tables[2].acquise);
  assert.equal(parcours.prochaineEtape(direct).table, 10);
});

test("le moteur épinglé a changé : nouveau numéro, copie serveur identique, serveur qui accepte « beads »", async () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261023-3/, "le moteur a changé : son numéro monte (et un dépôt FTP suit)");
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/, "le noyau aussi (« la bande » dans ses libellés)");
  const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "_serveur/public/prof/defi_tables_mon_parcours.js : la copie octet pour octet");
  const applis = await readFile(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");
  assert.match(applis, /'apprends', 'beads', 'construct'/, "sans « beads » dans lib/applis.php, le serveur jetterait la case à la synchro");
});

test("la bande s’appelle la bande, partout où l’élève lit", async () => {
  assert.equal(parcours.LIBELLES_APPRENDS.construct, "je construis la bande");
  assert.equal(parcours.LIBELLES_APPRENDS.gaps, "je complète une bande à trous");
  assert.equal(parcours.CONSIGNES_APPRENDS.construct, "construis la bande");
  assert.match(html, /<strong>Je construis la bande<\/strong>/);
  assert.match(html, /<strong>Je complète une bande à trous<\/strong>/);
  assert.match(html, /"Voir la bande \(vide\)"/);
  assert.match(html, /"La bande est complète\. Choisis une autre activité quand tu es prêt\."/);
  assert.match(html, /"Les 11 cases de la bande complétées"/);
  assert.match(html, /"Bravo\\u00a0! On le reverra sans la bande\."/);
  const coreSource = await readFile(new URL("../outils/calcul_mental/defi_tables_core.js", import.meta.url), "utf8");
  assert.match(coreSource, /construct: "je construis la bande"/);
  const moteurSource = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  [html, coreSource, moteurSource].forEach(texte => {
    assert.doesNotMatch(texte.replace(/ex-bâton/g, ""), /bâton/i, "le mot ne reste que dans le commentaire d’en-tête du moteur, qui raconte le renommage");
  });
  assert.match(html, /stick\.className = "number-stick";/, "le nom interne ne change pas");
  // La fiche imprimée (lot 2b) : plus de colonnes J'apprends / Je m'entraîne,
  // une rangée par table ; le cadre du professeur nomme « la bande ».
  assert.doesNotMatch(html, /fiche-table|fiche-dot/);
  assert.match(html, /<th>Je construis<br>la bande<\/th><th>Bande<br>à trous<\/th>/);
});
