/* NC04 (calcul mental sur les décimaux positifs), écrite d'après le cahier « Nombres et calculs »,
   partie 1, vérifié par Gwenaël le 24/10/2026 (lot NC-3). Le cahier est la seule source : consignes,
   gabarits (la case dans le calcul), aides, « Encore un indice », bonnes réponses, explications,
   morceaux de cours, bornes des tirages et erreurs connues (v2.py jusqu'à la VERSION 3 et « 24/10,
   13 h », aides.py, tirages.py + tirages2.py, contenu.py pour les erreurs de la v1). Les ajouts
   NC04-j, NC04-k, NC04-l viendront avec leur cahier (étape B).

   Les nombres sont tenus en entiers (dixièmes, centièmes, millièmes) : aucun calcul en virgule
   flottante ne décide d'une réponse. */
import {
  aireCompensation,
  aireDecompo,
  bandesDixiemes,
  barres,
  casesTables,
  colonnesGlisse,
  decompositionDixiemes,
  dixiemeDeDixieme,
  divisionFraction,
  glisseNombre,
  nombre,
  operationPosee,
  RANGS_GLISSE,
} from "../aides/dessins.js";
import { champ, preparerCours, questionCahier } from "./cahier.js";

export const counts = { NC04: 9 };

// Les formes réécrites d'après le cahier (elles ne suivent plus les empreintes de l'archive de GPT).
export const formesCahier = [..."abcdefghi"].map((forme) => `NC04-${forme}`);

/* ------------------------------------------------------------------ écrire les nombres
   n : un entier compté en 10^-nd (5 273 centièmes → 52,73), les 0 de la fin effacés. Les milliers
   séparés par une espace fine. (La même écriture que numeration.js.) */
function ecrire(n, nd = 0) {
  const p = 10 ** nd;
  const dec = nd
    ? String(n % p)
        .padStart(nd, "0")
        .replace(/0+$/, "")
    : "";
  return `${nombre(Math.floor(n / p))}${dec ? `,${dec}` : ""}`;
}
// La réponse attendue dans la case : sans espace (comme le pavé l'écrit).
const brut = (ecrit) => ecrit.replace(/\s/g, "");
// Un décimal au dixième, jamais entier, entre lo et hi dixièmes (dec1 du cahier) : en dixièmes.
function dixiemes(r, lo, hi) {
  let k;
  do k = r.int(lo, hi);
  while (k % 10 === 0);
  return k;
}
const decimalesDe = (ecrit) => (ecrit.split(",")[1] || "").length;
// « 4,13 » et « 2,2 » écrits avec autant de chiffres après la virgule : « 2,20 ».
const avecZeros = (ecrit, nd) => {
  const [ent, dec = ""] = ecrit.split(",");
  return nd ? `${ent},${dec.padEnd(nd, "0")}` : ent;
};
const rangs = (k) => `${k} rang${k > 1 ? "s" : ""}`;
const listeFr = (liste) =>
  liste.length > 1 ? `${liste.slice(0, -1).join(", ")} et ${liste.at(-1)}` : liste[0];

/* Les chiffres d'un nombre écrit, rang par rang, de gauche à droite (« 52,4 » → dizaines 5, unités 2,
   dixièmes 4 ; « 0,45 » → unités 0, dixièmes 4, centièmes 5). */
function chiffresRangs(ecrit) {
  const [ent, dec = ""] = brut(ecrit).split(",");
  const iu = RANGS_GLISSE.indexOf("unités");
  const sortie = {};
  [...ent].forEach((d, k) => (sortie[RANGS_GLISSE[iu - (ent.length - 1 - k)]] = d));
  [...dec].forEach((d, k) => (sortie[RANGS_GLISSE[iu + 1 + k]] = d));
  return sortie;
}
/* Les rangs des chiffres qui glissent : du premier chiffre non nul au dernier (les 0 du bout, « 0,45 »
   ou « 6 520 », gardent seulement la place : ils n'ont pas de flèche). */
function rangsSignificatifs(ecrit) {
  const tous = Object.entries(chiffresRangs(ecrit));
  const debut = tous.findIndex(([, d]) => d !== "0");
  const fin = tous.findLastIndex(([, d]) => d !== "0");
  return tous.slice(debut, fin + 1).map(([rang]) => rang);
}
const decale = (rang, k) => RANGS_GLISSE[RANGS_GLISSE.indexOf(rang) - k];

/* ------------------------------------------------------------------ le cours, en morceaux
   Le cours du cahier (v2.py, écrit en « je »), avec ses dessins ; « Diviser par un décimal » dans la
   version du 24/10, 13 h (en fraction). */
let coursEnCache = null;
function cours() {
  if (coursEnCache) return coursEnCache;
  coursEnCache = preparerCours([
    {
      titre: "Les tables, dans les deux sens",
      texte: "Une division exacte, c'est une table à l'envers : 42 ÷ 6 = ? veut dire 6 × ? = 42.",
      exemple: "6 × 7 = 42, donc 42 ÷ 6 = 7 et 42 ÷ 7 = 6.",
      svg: casesTables(42, 6),
      formes: ["a"],
    },
    {
      titre: "Ajouter et soustraire des décimaux",
      texte:
        "J'aligne les virgules, je complète par des 0 si besoin, puis je calcule rang par rang.",
      exemple: "4,13 − 2,2 = 4,13 − 2,20 = 1,93.",
      svg: operationPosee("4,13", "2,20"),
      formes: ["b"],
    },
    {
      titre: "Calculer astucieusement",
      texte: "Je remplace un nombre par un nombre rond et je corrige : 29 = 30 − 1 ; 21 = 20 + 1.",
      exemple: "6 × 19 = 6 × 20 − 6 = 120 − 6 = 114.",
      svg: aireCompensation(6, 20, 19),
      formes: ["c"],
    },
    {
      titre: "× et ÷ par 10, 100, 1\u00a0000",
      texte: `× 10, × 100, × ${nombre(1000)} : chaque chiffre glisse de 1, 2, 3 rangs vers la gauche ; ÷ : vers la droite. La virgule ne bouge pas, ce sont les chiffres qui glissent.`,
      exemple: "3,4 × 100 = 340 ; 3,4 ÷ 100 = 0,034.",
      svg: glisseNombre(
        { unités: "3", dixièmes: "4" },
        { centaines: "3", dizaines: "4", unités: "0" },
        { decalage: 2 },
      ),
      formes: ["d", "g", "h"],
    },
    {
      titre: "Un décimal × un entier",
      texte:
        "Je décompose : les unités, puis les dixièmes. Pour un nombre plus petit que 1, je compte les dixièmes.",
      exemple: "2,3 × 4 = 2 × 4 + 0,3 × 4 = 8 + 1,2 = 9,2 ; 0,6 × 5 = 30 dixièmes = 3.",
      svg: aireDecompo("2", "0,3", "4", ["8", "1,2", "9,2"]),
      formes: ["e"],
    },
    {
      titre: "Un décimal × un décimal",
      texte:
        "Dixième × dixième = centième : 0,1 × 0,1, c'est le dixième de 0,1, soit 0,01. Je multiplie sans les virgules, puis je compte : 0,3 × 0,2, c'est 3 × 2 = 6 centièmes.",
      exemple: "0,4 × 0,2 = 0,08 ; 1,5 × 0,4 = 15 dixièmes × 4 dixièmes = 60 centièmes = 0,6.",
      // Comment on montre 0,1 × 0,1 = 0,01 (question de Gwenaël du 30/10) : le dixième d'une colonne
      // de l'unité, un seul des 100 petits carrés (dessins.js, dixiemeDeDixieme).
      svg: dixiemeDeDixieme(),
      formes: ["i"],
    },
    {
      titre: "Diviser par un décimal",
      texte:
        "J'écris la division en fraction, puis je multiplie le numérateur et le dénominateur par 10 (ou 100) : le quotient ne change pas, et je divise par un entier.",
      exemple: "2,4 ÷ 0,4 = 24/4 = 6 (je vérifie : 0,4 × 6 = 2,4).",
      svg: divisionFraction("2,4", "0,4", "24", "4", "6"),
      formes: ["f"],
    },
  ]);
  return coursEnCache;
}

// Le rappel de la famille (cahier, v1 du 21/10).
const REGLE = `On choisit une décomposition simple. Multiplier par 10, 100, ${nombre(1000)} : chaque chiffre glisse de 1, 2, 3 rangs vers la gauche ; diviser : vers la droite.`;
const GRADE = [6, 6, 6, 6, 6, 5, 4, 6, 5];
const question = (v, d) => questionCahier("NC04", v, GRADE[v], REGLE, cours(), d);
// Une réponse décimale : le nombre seul (« 42 ÷ 6 » ou « 7 × 29 » écrits dans la case sont refusés).
const decimal = (reponse) => ({ type: "numeric", values: [reponse], form: "decimal" });
// Les erreurs connues, sans doublon et jamais égales à la bonne réponse.
function sansDoublon(erreurs, bonne) {
  const vues = new Set([brut(bonne)]);
  return erreurs.filter((e) => {
    const cle = brut(String(e.reponse));
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}

/* =================================================================== NC04-a
   Facteurs de 2 à 9 ; produit ou division exacte de la même table, en alternance. Jamais 69 (aucun
   produit de la table ne l'écrit). */
function nc04a(r) {
  const a = r.int(2, 9);
  const b = r.int(2, 9);
  const N = a * b;
  if (r.next() < 0.5) {
    // Le produit : a lignes de b cases ; le total est ce qu'on cherche.
    const reponse = String(N);
    return question(0, {
      pastille: "Calcul mental",
      prompt: "Calcule.",
      gabarit: `${a} × ${b} = [0]`,
      fields: [champ(reponse, "Produit")],
      check: decimal(reponse),
      aide: {
        svg: casesTables(N, b, { totalTexte: "? cases" }),
        text: `${a} lignes de ${b} cases : je compte les cases.`,
      },
      indice: { text: `${a} lignes de ${b} : je compte de ${b} en ${b}.` },
      bonne: `${a} × ${b} = ${N}`,
      erreurs: sansDoublon(
        [
          {
            reponse: String(a + b),
            phrase: `${a} + ${b} = ${a + b} : c'est une somme. ${a} × ${b}, c'est ${a} lignes de ${b}.`,
          },
          ...[b - 1, b + 1].map((c) => ({
            reponse: String(a * c),
            phrase: `${a} × ${c} = ${a * c} ; ici, il y a ${b} cases par ligne.`,
          })),
        ],
        reponse,
      ),
      explication: {
        etapes: [`${a} lignes de ${b} cases : ${N} cases.`, `${a} × ${b} = ${N}.`],
        svg: casesTables(N, b),
      },
    });
  }
  // La division : N cases, a par ligne ; on compte les lignes.
  const reponse = String(b);
  const voisin = (c) => ({
    reponse: String(c),
    phrase: `${a} × ${c} = ${a * c} ; cherche ${a} × ? = ${N}.`,
  });
  return question(0, {
    pastille: "Calcul mental",
    prompt: "Calcule.",
    gabarit: `${N} ÷ ${a} = [0]`,
    fields: [champ(reponse, "Quotient")],
    check: decimal(reponse),
    aide: { svg: casesTables(N, a), text: `${N} cases, ${a} par ligne : je compte les lignes.` },
    indice: { text: `${a} × ? = ${N}` },
    bonne: `${N} ÷ ${a} = ${b}`,
    erreurs: sansDoublon(
      [
        // Le cahier : « 36 » pour 42 ÷ 6 (« 6 × 6 = 36 ; cherche 6 × ? = 42. »).
        {
          reponse: String(a * (b - 1)),
          phrase: `${a} × ${b - 1} = ${a * (b - 1)} ; cherche ${a} × ? = ${N}.`,
        },
        voisin(b - 1),
        voisin(b + 1),
      ],
      reponse,
    ),
    explication: {
      etapes: [`${a} × ${b} = ${N}.`, `Donc ${N} ÷ ${a} = ${b}.`],
      svg: casesTables(N, a),
    },
  });
}

/* =================================================================== NC04-b
   Décimaux positifs au dixième (0,1 à 9,9) ; une fois sur quatre, le premier au centième (1,00 à
   9,99 : des écritures de longueurs différentes, 4,13 − 2,2) ; addition, différence positive ou terme
   manquant, un tiers chacun. En centièmes. */
// Les parts du schéma : chacune au moins 13 % de la ligne, pour que son nombre tienne dedans.
function parts(x, y) {
  const min = 0.13 * (x + y);
  if (x < min) return [min, x + y - min];
  if (y < min) return [x + y - min, min];
  return [x, y];
}

function nc04b(r) {
  let a = dixiemes(r, 1, 99) * 10;
  let b = dixiemes(r, 1, 99) * 10;
  if (r.next() < 0.25) a = r.int(100, 999);
  const mode = r.pick(["+", "−", "trou"]);
  if (mode === "−") {
    [a, b] = [Math.max(a, b), Math.min(a, b)];
    if (a === b) a += 100;
  }
  const [ga, gb] = [ecrire(a, 2), ecrire(b, 2)];
  const nd = Math.max(decimalesDe(ga), decimalesDe(gb));
  const [pa, pb] = [avecZeros(ga, nd), avecZeros(gb, nd)];
  const differentes = decimalesDe(ga) !== decimalesDe(gb);
  // Les virgules mal alignées (4,13 − 2,2 calculé comme 4,13 − 2,02) : seulement quand l'un a un
  // chiffre après la virgule et l'autre deux.
  const malAligne = (x, gx) =>
    decimalesDe(gx) === 1 && nd === 2 ? Math.floor(x / 100) * 100 + (x % 100) / 10 : x;
  const alignement = (signe) => ({
    phrase: `Aligne les virgules : ${pa} ${signe} ${pb}.`,
    a2: malAligne(a, ga),
    b2: malAligne(b, gb),
  });
  const commun = { pastille: "Calcul mental" };

  if (mode === "trou") {
    const c = a + b;
    const gc = ecrire(c, 2);
    const reponse = brut(gb);
    return question(1, {
      ...commun,
      prompt: "Complète.",
      gabarit: `${ga} + [0] = ${gc}`,
      fields: [champ(reponse, "Nombre")],
      check: decimal(reponse),
      aide: {
        svg: barres([
          [[c, gc, "tot"]],
          [...parts(a, b)].map((p, i) => [p, i ? "?" : ga, i ? "inc" : "nb"]),
        ]),
        text: `Le tout ${gc} ; une part ${ga} ; l'autre part ?`,
      },
      indice: {
        svg: operationPosee(gc, ga),
        text: "La soustraction posée, sans le résultat.",
      },
      bonne: `${ga} + ${gb} = ${gc}`,
      erreurs: sansDoublon(
        [{ reponse: ecrire(a + c, 2), phrase: `On cherche la part qui manque : ${gc} − ${ga}.` }],
        reponse,
      ),
      explication: {
        etapes: [
          `La part qui manque : ${gc} − ${ga}.`,
          `${gc} − ${ga} = ${gb}.`,
          `Vérification : ${ga} + ${gb} = ${gc}.`,
        ],
      },
    });
  }

  const plus = mode === "+";
  const resultat = plus ? a + b : a - b;
  const gr = ecrire(resultat, 2);
  const reponse = brut(gr);
  const erreurs = [];
  if (differentes && decimalesDe(ga) && decimalesDe(gb)) {
    const { phrase, a2, b2 } = alignement(mode);
    const faux = plus ? a2 + b2 : a2 - b2;
    if (faux > 0 && Number.isInteger(faux)) erreurs.push({ reponse: ecrire(faux, 2), phrase });
  }
  return question(1, {
    ...commun,
    prompt: "Calcule.",
    gabarit: `${ga} ${mode} ${gb} = [0]`,
    fields: [champ(reponse, plus ? "Somme" : "Différence")],
    check: decimal(reponse),
    aide: plus
      ? {
          svg: barres([
            [[a + b, "?", "inc"]],
            [...parts(a, b)].map((p, i) => [p, i ? gb : ga, "nb"]),
          ]),
          text: `Les deux parts ${ga} et ${gb} ; le tout ?`,
        }
      : {
          svg: barres([
            [[a, ga, "tot"]],
            [...parts(b, a - b)].map((p, i) => [p, i ? "?" : gb, i ? "inc" : "nb"]),
          ]),
          text: `Le tout ${ga} ; une part ${gb} ; l'autre part ?`,
        },
    indice: {
      svg: operationPosee(ga, gb, mode),
      text: plus
        ? "L'addition posée, sans le résultat."
        : "La soustraction posée, sans le résultat.",
    },
    bonne: `${ga} ${mode} ${gb} = ${gr}`,
    erreurs: sansDoublon(erreurs, reponse),
    explication: {
      etapes: [
        ...(differentes
          ? [`J'aligne les virgules : ${ga} ${mode} ${gb} = ${pa} ${mode} ${pb}.`]
          : []),
        `${ga} ${mode} ${gb} = ${gr}.`,
        plus ? `Vérification : ${gr} − ${gb} = ${ga}.` : `Vérification : ${gr} + ${gb} = ${ga}.`,
      ],
    },
  });
}

/* =================================================================== NC04-c
   Un facteur de 2 à 9 ; l'autre 19, 29, 39, 49, 99 (on enlève) ou 21, 31, 41 (on ajoute). */
function nc04c(r) {
  const k = r.int(2, 9);
  const n = r.pick([19, 29, 39, 49, 99, 21, 31, 41]);
  const enleve = n % 10 === 9;
  const proche = enleve ? n + 1 : n - 1;
  const reponse = String(k * n);
  const signe = enleve ? "−" : "+";
  return question(2, {
    pastille: "Calcul mental",
    prompt: "Calcule.",
    gabarit: `${k} × ${n} = [0]`,
    fields: [champ(reponse, "Produit")],
    check: decimal(reponse),
    aide: {
      svg: aireCompensation(k, proche, n),
      text: enleve
        ? `${k} × ${proche}, avec une colonne de trop.`
        : `${k} × ${proche}, et une colonne en plus.`,
    },
    indice: { text: `${k} × ${n} = ${k} × ${proche} ${signe} ${k} × 1` },
    bonne: `${k} × ${n} = ${nombre(k * n)}`,
    erreurs: [
      {
        reponse: String(k * proche),
        phrase: enleve
          ? `${k} × ${proche} compte une colonne de trop : enlève ${k}.`
          : `${k} × ${proche} oublie une colonne : ajoute ${k}.`,
      },
    ],
    explication: {
      calc: [
        [`${k} × ${n}`, `= ${k} × ${proche} ${signe} ${k}`],
        ["", `= ${k * proche} ${signe} ${k}`],
        ["", `= ${nombre(k * n)}`],
      ],
      etapes: [],
    },
  });
}

/* =================================================================== NC04-d, g, h
   × et ÷ par 10, 100, 1 000 : le glisse-nombre de Gwenaël, dessiné (la bande manipulable viendra dans
   son propre lot). Les nombres sont en millièmes. */
const PUISSANCES = [10, 100, 1000];
const SENS = (mult) => (mult ? "gauche" : "droite");
const OP = (mult) => (mult ? "×" : "÷");

// Le premier chiffre qui compte d'un nombre écrit, et son rang.
function premier(ecrit) {
  const rang = rangsSignificatifs(ecrit)[0];
  return { rang, d: chiffresRangs(ecrit)[rang] };
}

// L'explication du glisse-nombre : le dessin avec une flèche par chiffre qui compte.
function glisseExplique(gx, gy, k, mult, legende) {
  return glisseNombre(chiffresRangs(gx), chiffresRangs(gy), {
    cols: colonnesGlisse(Object.keys(chiffresRangs(gx)), Object.keys(chiffresRangs(gy))),
    decalage: mult ? k : -k,
    fleches: rangsSignificatifs(gx),
    legende,
  });
}

function nc04d(r) {
  // Décimal positif (1 à 9 999, divisé par 1, 10 ou 100) ; × ou ÷ par 10, 100, 1 000 ; résultat avec
  // au plus 3 chiffres après la virgule et au plus 100 000.
  const mult = r.next() < 0.5;
  let x, k, y;
  for (;;) {
    x = r.int(1, 9999) * 10 ** (3 - r.int(0, 2));
    k = r.int(1, 3);
    if (mult) y = x * 10 ** k;
    else if (x % 10 ** k === 0) y = x / 10 ** k;
    else continue;
    if (y <= 100000000) break;
  }
  const p = 10 ** k;
  const [gx, gy] = [ecrire(x, 3), ecrire(y, 3)];
  const reponse = brut(gy);
  const cols = colonnesGlisse(Object.keys(chiffresRangs(gx)), Object.keys(chiffresRangs(gy)));
  const sens = SENS(mult);
  // Ce que disent les chiffres en glissant : le premier, puis les autres ; les 0 qui gardent la place.
  const signif = rangsSignificatifs(gx);
  const cx = chiffresRangs(gx);
  const [d0, ...autres] = signif;
  const arrivees = new Set(signif.map((rang) => decale(rang, mult ? k : -k)));
  const zeros = Object.entries(chiffresRangs(gy))
    .filter(([rang, d]) => d === "0" && !arrivees.has(rang))
    .filter(([rang]) =>
      mult
        ? RANGS_GLISSE.indexOf(rang) <= RANGS_GLISSE.indexOf("unités")
        : RANGS_GLISSE.indexOf(rang) < RANGS_GLISSE.indexOf(decale(d0, -k)),
    )
    .map(([rang]) => rang);
  const etapes = [`Le ${cx[d0]} passe des ${d0} aux ${decale(d0, mult ? k : -k)}.`];
  if (autres.length)
    etapes.push(
      `${autres
        .map((rang, i) => `${i ? "le" : "Le"} ${cx[rang]} aux ${decale(rang, mult ? k : -k)}`)
        .join(", ")}.`,
    );
  if (zeros.length === 1) etapes.push(`Un 0 garde la place des ${zeros[0]}.`);
  else if (zeros.length)
    etapes.push(`Des 0 gardent la place ${listeFr(zeros.map((rang) => `des ${rang}`))}.`);
  const erreurs = [];
  // « 52,400 » : des 0 ajoutés après la virgule (le cahier).
  if (mult && gx.includes(","))
    erreurs.push({
      reponse: `${gx}${"0".repeat(k)}`,
      phrase: "Ajouter des 0 après la virgule ne change rien : les chiffres doivent glisser.",
    });
  // Le glissement dans le mauvais sens.
  const autreSens = mult ? x / p : x * p;
  if (Number.isInteger(autreSens))
    erreurs.push({
      reponse: ecrire(autreSens, 3),
      phrase: mult
        ? `× ${nombre(p)} : les chiffres glissent vers la gauche, le nombre devient plus grand.`
        : `÷ ${nombre(p)} : les chiffres glissent vers la droite, le nombre devient plus petit.`,
    });
  const zeroLegende =
    zeros.length === 1
      ? ` ; un 0 garde la place des ${zeros[0]}`
      : zeros.length
        ? " ; des 0 gardent la place"
        : "";
  return question(3, {
    pastille: `× et ÷ par 10, 100, ${nombre(1000)}`,
    prompt: "Calcule.",
    gabarit: `${gx} ${OP(mult)} ${nombre(p)} = [0]`,
    fields: [champ(reponse, "Résultat")],
    check: decimal(reponse),
    aide: {
      svg: glisseNombre(cx, null, { cols }),
      text: `${OP(mult)} ${nombre(p)} : chaque chiffre glisse de ${rangs(k)} vers la ${sens}.`,
    },
    indice: { text: `Chaque chiffre glisse de ${rangs(k)} vers la ${sens}.` },
    bonne: `${gx} ${OP(mult)} ${nombre(p)} = ${gy}`,
    erreurs: sansDoublon(erreurs, reponse),
    explication: {
      etapes,
      svg: glisseExplique(gx, gy, k, mult, `${rangs(k)} vers la ${sens}${zeroLegende}`),
    },
  });
}

function nc04g(r) {
  // □ vaut 10, 100 ou 1 000 ; × ou ÷ ; une fois sur quatre l'égalité est écrite à l'envers (1 200 =
  // 1,2 × □, comme le programme). Le nombre : 1 à 999, divisé par 1, 10 ou 100 ; le résultat a au
  // plus 3 chiffres après la virgule. En millièmes.
  let x, k, y, mult, envers;
  for (;;) {
    x = r.int(1, 999) * 10 ** (3 - r.int(0, 2));
    k = r.int(1, 3);
    mult = r.next() < 0.5;
    envers = false;
    if (mult) {
      y = x * 10 ** k;
      envers = r.next() < 0.25;
      break;
    }
    if (x % 10 ** k === 0) {
      y = x / 10 ** k;
      break;
    }
  }
  const p = 10 ** k;
  const [gx, gy] = [ecrire(x, 3), ecrire(y, 3)];
  const reponse = String(p);
  const sens = SENS(mult);
  const { rang, d } = premier(gx);
  const arrivee = decale(rang, mult ? k : -k);
  const egalite = (case_) =>
    envers ? `${gy} = ${gx} × ${case_}` : `${gx} ${OP(mult)} ${case_} = ${gy}`;
  const erreurs = [
    {
      reponse: ecrire(1000 / p, 3),
      phrase: mult
        ? `Les chiffres ont glissé vers la gauche : on a multiplié par ${nombre(p)}.`
        : `On divise par ${nombre(p)} : □ = ${nombre(p)}.`,
    },
    ...PUISSANCES.filter((autre) => autre !== p).map((autre) => ({
      reponse: String(autre),
      phrase: `Le ${d} est passé des ${rang} aux ${arrivee} : ${rangs(k)} vers la ${sens}, c'est ${OP(mult)} ${nombre(p)}.`,
    })),
  ];
  return question(6, {
    pastille: `× et ÷ par 10, 100, ${nombre(1000)}`,
    prompt: "Complète.",
    gabarit: egalite("[0]"),
    fields: [champ(reponse, "Nombre")],
    check: decimal(reponse),
    aide: {
      svg: glisseNombre(chiffresRangs(gx), chiffresRangs(gy), {
        cols: colonnesGlisse(Object.keys(chiffresRangs(gx)), Object.keys(chiffresRangs(gy))),
        legende: "de combien de rangs les chiffres ont-ils glissé ?",
      }),
      text: "",
    },
    indice: { text: `Le ${d} est passé des ${rang} aux ${arrivee} : combien de rangs ?` },
    bonne: egalite(nombre(p)),
    erreurs: sansDoublon(erreurs, reponse),
    explication: {
      etapes: [
        `Le ${d} passe des ${rang} aux ${arrivee} : ${rangs(k)} vers la ${sens}.`,
        `${rangs(k)} vers la ${sens}, c'est ${OP(mult)} ${nombre(p)}.`,
      ],
      svg: glisseExplique(
        gx,
        gy,
        k,
        mult,
        `${rangs(k)} vers la ${sens} : ${OP(mult)} ${nombre(p)}`,
      ),
    },
  });
}

function nc04h(r) {
  // Le nombre de départ : 1 à 999, divisé par 1, 10, 100 ou 1 000 ; × ou ÷ par 10, 100, 1 000 ; le
  // résultat a au plus 3 chiffres après la virgule. En millièmes.
  let x, k, y, mult;
  for (;;) {
    x = r.int(1, 999) * 10 ** (3 - r.int(0, 3));
    k = r.int(1, 3);
    mult = r.next() < 0.5;
    if (mult) y = x * 10 ** k;
    else if (x % 10 ** k === 0) y = x / 10 ** k;
    else continue;
    break;
  }
  const p = 10 ** k;
  const [gx, gy] = [ecrire(x, 3), ecrire(y, 3)];
  const reponse = brut(gx);
  const cols = colonnesGlisse(Object.keys(chiffresRangs(gx)), Object.keys(chiffresRangs(gy)));
  // Glisser dans le mauvais sens : 45 × 100 au lieu de 45 ÷ 100 (le cahier : 4 500).
  const faux = mult ? y * p : y / p;
  const erreurs = Number.isInteger(faux)
    ? [
        {
          reponse: ecrire(faux, 3),
          phrase: `${ecrire(faux, 3)} ${OP(mult)} ${nombre(p)} ne fait pas ${gy} : fais glisser dans l'autre sens.`,
        },
      ]
    : [];
  return question(7, {
    pastille: `× et ÷ par 10, 100, ${nombre(1000)}`,
    prompt: "Complète.",
    gabarit: `[0] ${OP(mult)} ${nombre(p)} = ${gy}`,
    fields: [champ(reponse, "Nombre de départ")],
    check: decimal(reponse),
    aide: {
      svg: glisseNombre(null, chiffresRangs(gy), {
        cols,
        legende: `en bas : ${gy} · sur la bande : le nombre de départ`,
      }),
      text: "",
    },
    indice: {
      text: mult
        ? `Pour revenir en arrière, divise par ${nombre(p)}.`
        : `Pour revenir en arrière, multiplie par ${nombre(p)}.`,
    },
    bonne: `${gx} ${OP(mult)} ${nombre(p)} = ${gy}`,
    erreurs: sansDoublon(erreurs, reponse),
    explication: {
      etapes: [
        `${gy} ${OP(!mult)} ${nombre(p)} = ${gx}.`,
        `Vérification : ${gx} ${OP(mult)} ${nombre(p)} = ${gy}.`,
      ],
      svg: glisseExplique(
        gx,
        gy,
        k,
        mult,
        `${OP(mult)} ${nombre(p)} : ${rangs(k)} vers la ${SENS(mult)}`,
      ),
    },
  });
}

/* =================================================================== NC04-e
   Un entier de 2 à 9 ; le décimal de 0,2 à 0,9 une fois sur deux (les bandes de dixièmes), sinon de
   1,1 à 9,9, jamais entier (le rectangle de la décomposition). En dixièmes. */
function nc04e(r) {
  const k = r.int(2, 9);
  const a = r.next() < 0.5 ? r.int(2, 9) : dixiemes(r, 11, 99);
  const ga = ecrire(a, 1);
  const res = ecrire(a * k, 1);
  const reponse = brut(res);
  const commun = {
    pastille: "Calcul mental",
    prompt: "Calcule.",
    gabarit: `${ga} × ${k} = [0]`,
    fields: [champ(reponse, "Produit")],
    check: decimal(reponse),
    bonne: `${ga} × ${k} = ${res}`,
  };
  if (a < 10) {
    // Plus petit que 1 : k bandes de a dixièmes (v1 du cahier, retenu le 24/10).
    return question(4, {
      ...commun,
      aide: {
        svg: bandesDixiemes(k, a),
        text: `${k} fois ${a} dixièmes : je compte les cases coloriées.`,
      },
      indice: { text: `${k} fois ${a} dixièmes = ? dixièmes` },
      erreurs: sansDoublon(
        [
          {
            reponse: ecrire(a * k, 2),
            phrase: `${k} × ${a} dixièmes = ${a * k} dixièmes = ${res}.`,
          },
        ],
        reponse,
      ),
      explication: {
        calc: [
          [`${ga} × ${k}`, `= ${a} dixièmes × ${k}`],
          ["", `= ${a * k} dixièmes`],
          ["", `= ${res}`],
        ],
        // Pas de dessin : le calcul en dixièmes dit tout (la règle du cahier : un calcul, pas de dessin).
        etapes: [],
      },
    });
  }
  const ent = Math.floor(a / 10);
  const dec = a % 10;
  const gdec = `0,${dec}`;
  const p1 = String(ent * k);
  const p2 = ecrire(dec * k, 1);
  const erreurs = [];
  // « 36,12 » : les unités et les dixièmes écrits côte à côte, sans la retenue (le cahier).
  if (dec * k >= 10)
    erreurs.push({
      reponse: `${ent * k},${dec * k}`,
      phrase: `${gdec} × ${k} = ${dec * k} dixièmes = ${p2} : ${p1} + ${p2} = ${res}.`,
    });
  return question(4, {
    ...commun,
    aide: {
      svg: aireDecompo(String(ent), gdec, String(k)),
      text: "Le rectangle coupé en deux : les unités, puis les dixièmes.",
    },
    indice: {
      text: `${gdec} × ${k} = ${dec} dixième${dec > 1 ? "s" : ""} × ${k} = ? dixièmes`,
    },
    erreurs: sansDoublon(erreurs, reponse),
    explication: {
      calc: [
        [`${ga} × ${k}`, `= ${ent} × ${k} + ${gdec} × ${k}`],
        ["", `= ${p1} + ${p2}`],
        ["", `= ${res}`],
      ],
      etapes: [],
      svg: aireDecompo(String(ent), gdec, String(k), [p1, p2, res]),
    },
  });
}

/* =================================================================== NC04-f
   Diviseur de 0,2 à 0,9 ; quotient entier de 2 à 9. Écrite en fraction (24/10, 13 h). */
function nc04f(r) {
  const d = r.int(2, 9);
  const q = r.int(2, 9);
  const n = d * q;
  const [gn, gd] = [ecrire(n, 1), `0,${d}`];
  const reponse = String(q);
  return question(5, {
    pastille: "Diviser par un décimal",
    prompt: "Calcule.",
    gabarit: `${gn} ÷ ${gd} = [0]`,
    fields: [champ(reponse, "Quotient")],
    check: decimal(reponse),
    aide: {
      svg: divisionFraction(gn, gd, String(n), String(d)),
      text: "Je l'écris en fraction, puis × 10 en haut et en bas.",
    },
    indice: { text: `${n}/${d} : c'est la table de ${d}.` },
    bonne: `${gn} ÷ ${gd} = ${q}`,
    erreurs: [
      { reponse: `0,${q}`, phrase: `Combien de fois ${gd} dans ${gn} ? Plus d'une fois !` },
    ],
    explication: {
      calc: [
        [`${gn} ÷ ${gd}`, `= ${gn}/${gd}`],
        ["", `= ${n}/${d}`],
        ["", `= ${q}`],
      ],
      etapes: [],
      svg: divisionFraction(gn, gd, String(n), String(d), String(q), `${gd} × ${q} = ${gn}`),
    },
  });
}

/* =================================================================== NC04-i
   Un facteur de 0,1 à 0,9 ; l'autre de 0,1 à 0,9 (trois fois sur cinq) ou de 1,1 à 2,9. Une fois sur
   trois, 0,5 × un nombre pair de dixièmes : le produit a un 0 final (0,5 × 0,4 = 0,20 = 0,2). Les
   facteurs échangés une fois sur deux. En dixièmes ; le produit en centièmes. */
function nc04i(r) {
  let a = r.int(1, 9);
  let b = r.next() < 0.6 ? r.int(1, 9) : dixiemes(r, 11, 29);
  if (r.next() < 1 / 3) {
    a = 5;
    b = r.next() < 0.6 ? r.pick([2, 4, 6, 8]) : r.pick([12, 14, 16, 18, 24]);
  }
  if (r.next() < 0.5) [a, b] = [b, a];
  const [ga, gb] = [ecrire(a, 1), ecrire(b, 1)];
  const P = a * b;
  const res = ecrire(P, 2);
  const reponse = brut(res);
  const centiemes = `${P} centième${P > 1 ? "s" : ""}`;
  // Le contrôle (programme de 6e : « le recours systématique à un ordre de grandeur ») : un facteur
  // plus petit que 1 rend le produit plus petit que l'autre.
  const [petit, autre] = b < 10 ? [gb, ga] : [ga, gb];
  return question(8, {
    pastille: "Calcul mental",
    prompt: "Calcule.",
    gabarit: `${ga} × ${gb} = [0]`,
    fields: [champ(reponse, "Produit")],
    check: decimal(reponse),
    // Choix de Gwenaël du 30/10 : l'aide est la décomposition du document d'accompagnement de 6e ;
    // l'aire (la grille des centièmes) reste dans le cours. La phrase aussi (30/10) ; le dessin
    // s'arrête exprès avant « 6 × 0,01 » : l'indice puis l'explication finissent le calcul.
    aide: {
      svg: decompositionDixiemes(ga, gb, String(a), String(b)),
      text: `${ga}, c'est ${a} fois 0,1 ; ${gb}, c'est ${b} fois 0,1.`,
    },
    indice: { text: `Dixième × dixième = centième : ${a} × ${b} = ${centiemes}.` },
    bonne: `${ga} × ${gb} = ${res}`,
    erreurs: sansDoublon(
      [
        {
          reponse: ecrire(P, 1),
          phrase: `Des dixièmes × des dixièmes donnent des centièmes : ${centiemes} = ${res}.`,
        },
        { reponse: String(P), phrase: `${a} × ${b} = ${P}, mais ce sont des centièmes : ${res}.` },
      ],
      reponse,
    ),
    explication: {
      calc: [
        [`${ga} × ${gb}`, `= (${a} × 0,1) × (${b} × 0,1)`],
        ["", `= (${a} × ${b}) × (0,1 × 0,1)`],
        ["", `= ${P} × 0,01`],
        ["", `= ${res}`],
      ],
      etapes: [
        "0,1 × 0,1, c'est le dixième de 0,1 : 0,01.",
        `Contrôle : ${petit} est plus petit que 1, donc ${ga} × ${gb} est plus petit que ${autre}.`,
      ],
      // Pas de dessin : il redirait les calculs ligne pour ligne, et l'explication ne tenait plus
      // sans défiler (390 × 844, 1366 × 768) ; la règle du cahier : un calcul, pas de dessin.
    },
  });
}

const FORMES = [nc04a, nc04b, nc04c, nc04d, nc04e, nc04f, nc04g, nc04h, nc04i];

export const generators = {
  NC04: (r, v = 0) => FORMES[v](r),
};
