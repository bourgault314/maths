// Lot R4 « Mes calculs et la bande » (12/09/2026), les trois retouches de
// l'audit qui restaient sur la page :
//
// 1. LE DÉTAIL DE MES CALCULS (audit A2). L'écran s'ouvre sur la grille, donc
//    le cadre du détail — qui est au-dessus — se retrouvait derrière la barre
//    collée : l'élève touchait une case et ne lisait ni le calcul ni sa boîte.
//    On ramène le cadre dans l'écran, du plus petit mouvement possible, et
//    seulement s'il est caché : là où il est déjà visible, la page ne bouge pas.
//
// 2. LA BANDE NE SE CORRIGE PLUS TOUTE SEULE (audit P4, décision Q5 du
//    11/09). Dans « Je construis la bande » et « bande à trous », une mauvaise
//    réponse s'écrivait quand même dans la case : l'erreur disparaissait, le
//    calcul ne revenait pas, et le résultat annonçait « les 11 cases
//    complétées » au-dessus d'une erreur barrée. Maintenant la case reste
//    VIDE, le calcul revient en fin de bande jusqu'à être trouvé — comme dans
//    « dans l'ordre » et « désordre » — et le résultat compte les premiers
//    coups. La consigne « Ajoute 4 » laisse la place à « Complète la case
//    bleue. » quand la case d'avant est vide : on n'ajoute pas à un trou.
//
// 3. LES ÉTIQUETTES DE LA BANDE AU VIDÉOPROJECTEUR (relevé par Code au lot
//    R1). La bande copiait la largeur du boulier ; en 1280 × 590 ou
//    1366 × 650 c'est la HAUTEUR qui limite la perle, le cadre tombe à 292 px
//    et les onze « 0×10 … 10×10 » se marchaient dessus. La bande garde
//    maintenant la largeur qu'il lui faut, dans la place disponible — et
//    seulement quand il le faut : sur un téléphone et en 1366 × 768, rien ne
//    change.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// On sort la fonction de la page et on la joue avec ses seules dépendances,
// déclarées en tête (`avant`) : pas de navigateur, pas de page à charger.
function fonction(nom, {avant = "", dependances = []} = {}) {
  const code = [avant, ...dependances.map(source), source(nom)].join("\n");
  return new Function(`${code}\nreturn ${nom};`)();
}

// --------------------------------------------- 1. le détail de Mes calculs

// Un faux écran : la barre collée, le cadre du détail, la fenêtre.
function ecranCalculs({hautCadre, hauteurCadre = 78, basBarre = 44, hauteurFenetre = 667}) {
  const defilements = [];
  const cadre = {getBoundingClientRect: () => ({top: hautCadre, bottom: hautCadre + hauteurCadre})};
  const barre = {getBoundingClientRect: () => ({bottom: basBarre})};
  const avant = `
    const MARGE_DETAIL = 8;
    const cadre = ${JSON.stringify(null)};
    const $ = () => ARG.cadre;
    const document = {querySelector: () => ARG.barre};
    const window = {innerHeight: ${hauteurFenetre}, scrollBy: options => ARG.defilements.push(Math.round(options.top))};
    const sansAnimation = () => true;
  `;
  const code = [avant, source("montrerDetail")].join("\n");
  const jouer = new Function("ARG", `${code}\nreturn montrerDetail;`)({cadre, barre, defilements});
  jouer();
  return defilements;
}

test("le cadre du détail revient sous la barre collée, et seulement s’il en a besoin", () => {
  // Le cas de l'audit : l'écran ouvert sur la grille, le cadre à 7 px du haut,
  // donc sous une barre qui descend à 44 — il faut remonter la page de 45 px.
  assert.deepEqual(ecranCalculs({hautCadre: 7}), [7 - 44 - 8]);
  // Complètement au-dessus de l'écran (petit téléphone) : même règle.
  assert.deepEqual(ecranCalculs({hautCadre: -32}), [-32 - 44 - 8]);
  // Déjà visible sous la barre (iPhone de 402 px) : la page ne bouge pas.
  assert.deepEqual(ecranCalculs({hautCadre: 80}), []);
  assert.deepEqual(ecranCalculs({hautCadre: 116, basBarre: 45}), []);
  // Sous la ligne de flottaison : on descend, mais jamais au point de le
  // faire passer sous la barre à son tour.
  assert.deepEqual(ecranCalculs({hautCadre: 640}), [640 + 78 - 667 + 8]);
  assert.deepEqual(ecranCalculs({hautCadre: 660, hauteurCadre: 700}), [660 - 44 - 8],
    "un cadre plus haut que l’écran se cale sous la barre au lieu d’aligner son bas");
});

test("toucher une case ou une boîte de Mes calculs ramène le détail dans l’écran", () => {
  assert.match(html, /calculsSelection = choisie \? null : \{boite\};\s*renderCalculs\(\);\s*montrerDetail\(\);/,
    "le bandeau des cinq boîtes");
  assert.match(html, /calculsSelection = \{ligne: cellule\.ligne, colonne: cellule\.colonne, cle: cellule\.cle\};\s*renderCalculs\(\);\s*montrerDetail\(\);/,
    "les cases de la grille");
  // La barre reste collée et la grille garde son ancre : l'ouverture de
  // l'écran ne change pas.
  assert.match(html, /\.calculs-screen \.settings-toolbar \{ position: sticky; top: 0;/);
  assert.match(html, /#calculs-grille \{ scroll-margin-top: 58px; \}/);
  assert.match(html, /\$\("calculs-grille"\)\.scrollIntoView\?\.\(\{block: "start", behavior: "auto"\}\)/);
  // Le mouvement est doux, sauf pour qui demande moins d'animations.
  assert.match(html, /behavior: sansAnimation\(\) \? "auto" : "smooth"/);
  assert.match(html, /matchMedia\?\.\("\(prefers-reduced-motion: reduce\)"\)\.matches === true/);
});

// ----------------------------------- 2. la bande ne se corrige plus seule

test("une mauvaise réponse laisse la case vide et renvoie le calcul en fin de bande", () => {
  assert.match(html, /const shouldRetry = !correct \|\| assisted;/,
    "plus de « !stickActivity && » : construire la bande suit la même règle que dans l’ordre et le désordre");
  assert.match(html, /if \(!stickActivity \|\| correct\) state\.revealedLearnResults\.add\(question\.multiplier\);/,
    "la case ne se remplit que sur une bonne réponse");
  assert.match(html, /state\.lastRevealedLearnMultiplier = !stickActivity \|\| correct \? question\.multiplier : null;/,
    "pas de case qui s’allume en vert quand elle vient d’être ratée — et rien ne change dans l’ordre et le désordre");
  // Le calcul ne revient qu'une fois à la fois dans la file, mais autant de
  // fois qu'il le faut : c'est la case remplie qui termine la série.
  assert.match(html, /const alreadyWaiting = state\.questions\.slice\(state\.index \+ 1\)\.some\(candidate => candidate\.factKey === question\.factKey\);\s*if \(!alreadyWaiting\) state\.questions\.push\(\{\.\.\.question, retry: true\}\);/);
  assert.match(html, /const bandeFinie = state\.configuration\.mode === "learn"\s*&& \["construct", "gaps"\]\.includes\(state\.configuration\.learnActivity\)\s*&& state\.revealedLearnResults\.size >= CASES_BANDE;/);
  assert.match(html, /else if \(bandeFinie\) finish\(\);/);
  assert.match(html, /const CASES_BANDE = 11;/);
  assert.match(html, /const total = stickActivity \? CASES_BANDE : TOTAL;/,
    "le compteur « x / 11 cases complétées » compte les mêmes cases");
});

test("la correction dit que le calcul reviendra, comme partout ailleurs", () => {
  assert.match(html, /showAnswerFeedback\(question, correct, skip \? null : value, shouldRetry, assisted\)/);
  assert.match(html, /Bonne réponse : \$\{question\.answer\}\.\$\{willRetry \? " Le calcul reviendra\." : ""\}/);
});

test("« Ajoute 4 » laisse la place à « Complète la case bleue » quand la case d’avant est vide", () => {
  const consigne = (activite, multiplicateur, remplies) => {
    const jouer = new Function("ARG", `
      const state = {configuration: {learnActivity: ARG.activite}, revealedLearnResults: new Set(ARG.remplies)};
      const table = 4;
      const question = {multiplier: ARG.multiplicateur};
      const suitUnePleine = question?.multiplier > 0 && state.revealedLearnResults.has(question.multiplier - 1);
      return state.configuration.learnActivity === "gaps"
        ? "Complète la case bleue."
        : question?.multiplier === 0 ? "Commence à 0."
          : suitUnePleine ? \`Ajoute \${table}.\` : "Complète la case bleue.";
    `)({activite, multiplicateur, remplies});
    return jouer;
  };
  assert.equal(consigne("construct", 0, []), "Commence à 0.");
  assert.equal(consigne("construct", 5, [0, 1, 2, 3, 4]), "Ajoute 4.");
  assert.equal(consigne("construct", 5, [0, 1, 2, 3]), "Complète la case bleue.",
    "4 × 4 a été raté : on n’ajoute pas 4 à un trou");
  assert.equal(consigne("construct", 4, [0, 1, 2, 3, 5, 6, 7, 8, 9, 10]), "Ajoute 4.",
    "le calcul raté revient à la fin, et là 3 × 4 est sous ses yeux : « Ajoute 4 » redevient vrai");
  assert.equal(consigne("gaps", 7, [0, 5, 10]), "Complète la case bleue.");
  // Et c'est bien ce que la page écrit.
  assert.match(html, /const suitUnePleine = question\?\.multiplier > 0 && state\.revealedLearnResults\.has\(question\.multiplier - 1\);/);
  assert.match(html, /: suitUnePleine \? `Ajoute \$\{table\}\.` : "Complète la case bleue.";/);
});

test("le résultat de la bande compte les cases trouvées du premier coup", () => {
  const compter = (questions, responses) => fonction("casesRatees", {
    avant: `const state = ${JSON.stringify({questions, responses})};`
  })();
  const onze = Array.from({length: 11}, (_, m) => ({multiplier: m}));
  const justes = onze.map(() => ({correct: true}));
  assert.equal(compter(onze, justes), 0, "sans erreur, rien à compter");
  const uneErreur = justes.slice(); uneErreur[4] = {correct: false};
  assert.equal(compter([...onze, {multiplier: 4}], [...uneErreur, {correct: true}]), 1);
  // Le même calcul raté deux fois ne compte qu'une case.
  assert.equal(compter([...onze, {multiplier: 4}, {multiplier: 4}], [...uneErreur, {correct: false}, {correct: true}]), 1,
    "une case ratée reste une case, même si le calcul est revenu deux fois");
  // Deux cases différentes comptent deux fois.
  const deux = justes.slice(); deux[4] = {correct: false}; deux[7] = {correct: false};
  assert.equal(compter([...onze, {multiplier: 4}, {multiplier: 7}], [...deux, {correct: true}, {correct: true}]), 2);
  // Les phrases : celle sans erreur ne change pas, celle avec erreur compte.
  assert.match(html, /\(ratees \? `\$\{casesBande - ratees\} cases sur \$\{casesBande\} trouvées du premier coup` : "Les 11 cases de la bande complétées"\)/);
  assert.match(html, /\(ratees \? `\$\{casesBande - ratees\} cases sur \$\{casesBande\} complétées du premier coup` : `Les \$\{TOTAL\} cases manquantes complétées`\)/);
  assert.match(html, /const casesBande = config\.learnActivity === "gaps" \? TOTAL : CASES_BANDE;/);
});

// ------------------------------ 3. les étiquettes de la bande au projecteur

// Un faux écran : la scène, et onze étiquettes dont on connaît la largeur du
// texte (scrollWidth) — celle que le navigateur donne même quand il la coupe.
function largeurDeLaBande({largeurBoulier, texte, scene}) {
  const etiquettes = Array.from({length: 11}, () => ({scrollWidth: texte}));
  const jouer = new Function("ARG", `
    const BANDE_BORDURES = 12;
    const boulier = {dom: {bande: {querySelectorAll: () => ARG.etiquettes}, scene: {clientWidth: ARG.scene}}};
    ${source("largeurBande")}
    return largeurBande;
  `)({etiquettes, scene});
  return jouer(largeurBoulier);
}

test("la bande suit le boulier, sauf quand ses étiquettes n’y tiennent plus", () => {
  // iPhone de 402 px, table de 10 : les étiquettes font 31 px dans des cases
  // de 32 — ça tient, la bande ne bouge pas d'un pixel.
  assert.equal(largeurDeLaBande({largeurBoulier: 365, texte: 31, scene: 372}), 365);
  // 1366 × 768 : 43 px d'étiquette dans des cases de 44,5 — rien ne change.
  assert.equal(largeurDeLaBande({largeurBoulier: 502, texte: 43, scene: 716}), 502);
  // Vidéoprojecteur 1280 × 590 : le boulier tombe à 292 px, les étiquettes en
  // demandent 43 + 2 — la bande prend 11 × 45 + 12, et le boulier ne change pas.
  assert.equal(largeurDeLaBande({largeurBoulier: 292, texte: 43, scene: 716}), 44 * 11 + 12);
  // 1366 × 650 : même cause, même effet.
  assert.equal(largeurDeLaBande({largeurBoulier: 334, texte: 43, scene: 716}), 44 * 11 + 12);
  // Jamais plus large que la scène : sur un téléphone de 320 px la bande prend
  // toute la place et s'arrête là (les étiquettes de la table de 10 y restent
  // un peu justes — écran hors des tailles de référence).
  assert.equal(largeurDeLaBande({largeurBoulier: 271, texte: 31, scene: 290}), 290);
  // Et la marge qu’on garde, c’est le bord de la case : 1 px, pas plus — sinon
  // la bande s’élargirait sur un iPhone où tout tient déjà.
  assert.match(html, /etiquette\.scrollWidth \+ 1/);
  // Une bande pas encore dessinée (aucune étiquette) garde la largeur du boulier.
  const jouer = new Function(`
    const BANDE_BORDURES = 12;
    const boulier = {dom: {bande: {querySelectorAll: () => []}, scene: {clientWidth: 716}}};
    ${source("largeurBande")}
    return largeurBande;
  `)();
  assert.equal(jouer(292), 292);
});

test("la bande garde sa place sous la consigne et au-dessus du boulier", () => {
  assert.match(html, /dom\.bande\.style\.width = `\$\{largeurBande\(interieur \+ montant \* 2\)\}px`;/);
  assert.match(html, /const BANDE_BORDURES = 12;/, "3 px de marge et 3 px de bord de chaque côté");
  assert.match(html, /scene\.append\(bande, addition, cadre\);/, "l’ordre du lot R1 ne change pas");
  // La bande rebâtie à chaque geste reprend la largeur mesurée.
  assert.match(html, /bande\.style\.width = dom\.bande\.style\.width;/);
});
