/* NC01 (numération décimale), NC02 (comparer et ranger des décimaux) et NC03 (arrondir et estimer),
   écrits d'après le cahier « Nombres et calculs », partie 1, vérifié par Gwenaël le 24/10/2026
   (lot NC-2). Le cahier est la seule source : consignes, gabarits (la case dans le calcul), aides,
   « Encore un indice », bonnes réponses, explications, morceaux de cours, bornes des tirages et erreurs
   connues (v2.py jusqu'à la VERSION 3, aides.py, tirages.py + tirages2.py). Les ajouts NC01-e,
   NC01-f, NC03-e et NC03-f viendront avec leur cahier (étape B).

   Les nombres sont tenus en entiers (dixièmes, centièmes, millièmes) : aucun calcul en virgule
   flottante ne décide d'une réponse. */
import {
  alignes,
  arrondisProduit,
  BLEU,
  droite,
  estimerSomme,
  grille100,
  nombre,
  ORANGE,
  tableauRangs,
} from "../aides/dessins.js";
import { champ, preparerCours, questionCahier } from "./cahier.js";

export const counts = { NC01: 4, NC02: 4, NC03: 4 };

// Les formes réécrites d'après le cahier (elles ne suivent plus les empreintes de l'archive de GPT).
export const formesCahier = ["NC01", "NC02", "NC03"].flatMap((famille) =>
  ["a", "b", "c", "d"].map((forme) => `${famille}-${forme}`),
);

/* ------------------------------------------------------------------ écrire les nombres
   n : un entier compté en 10^-nd (5 273 centièmes → 52,73). garder : les 0 de la fin restent
   (5,80). Les milliers séparés par une espace fine, le vrai signe moins. */
function ecrire(n, nd = 0, garder = false) {
  const p = 10 ** nd;
  const a = Math.abs(n);
  let dec = nd ? String(a % p).padStart(nd, "0") : "";
  if (!garder) dec = dec.replace(/0+$/, "");
  return `${n < 0 ? "−" : ""}${nombre(Math.floor(a / p))}${dec ? `,${dec}` : ""}`;
}

const SINGULIER = {
  dizaines: "dizaine",
  unités: "unité",
  dixièmes: "dixième",
  centièmes: "centième",
  millièmes: "millième",
};
// « 0 centième », « 1 unité », « 5 dizaines » (comme le cahier).
const combien = (k, rang) => `${k} ${k > 1 ? rang : SINGULIER[rang]}`;
const R5 = ["dizaines", "unités", "dixièmes", "centièmes", "millièmes"];
const APRES = ["dixièmes", "centièmes", "millièmes"];
const RANG_DE = { 10: "dixièmes", 100: "centièmes", 1000: "millièmes" };
const ORDINAL = { dixièmes: "1er", centièmes: "2e", millièmes: "3e" };

function melanger(r, liste) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}
// Un décimal au dixième, jamais entier, entre lo et hi dixièmes (dec1 du cahier) : en dixièmes.
function dixiemes(r, lo, hi) {
  let k;
  do k = r.int(lo, hi);
  while (k % 10 === 0);
  return k;
}
// Le chiffre de chaque rang d'un nombre écrit (« 52,738 ») ; la dizaine seulement si elle existe.
function chiffresDe(ecrit, jusqua = null) {
  const [ent, dec = ""] = ecrit.replace(/^−/, "").split(",");
  const n = Number(ent.replace(/\s/g, ""));
  const chiffres = { unités: String(n % 10) };
  if (n >= 10) chiffres.dizaines = String(Math.floor(n / 10) % 10);
  const fin = jusqua ?? dec.length;
  for (let i = 0; i < fin; i++) chiffres[APRES[i]] = dec[i] ?? "0";
  return chiffres;
}
// « 5 dizaines, 2 unités, 7 dixièmes, 3 centièmes, 8 millièmes ».
const enMots = (chiffres) =>
  R5.filter((rang) => rang in chiffres)
    .map((rang) => combien(Number(chiffres[rang]), rang))
    .join(", ");

/* ------------------------------------------------------------------ le cours, en morceaux
   Le cours du cahier (v2.py, écrit en « je »), avec les dessins de la VERSION 3 ; NC01 a son tableau
   de numération (demande de Gwenaël du 24/10). */
let coursEnCache = null;
function cours() {
  if (coursEnCache) return coursEnCache;
  coursEnCache = {
    NC01: [
      {
        titre: "Chaque chiffre a son rang",
        texte:
          "Après la virgule : les dixièmes, puis les centièmes, puis les millièmes. Je place le nombre dans le tableau, la virgule juste après les unités.",
        exemple: "37,465 : 3 dizaines, 7 unités, 4 dixièmes, 6 centièmes, 5 millièmes.",
        svg: tableauRangs(R5, chiffresDe("37,465")),
        formes: ["a"],
      },
      {
        titre: "Le chiffre ou le nombre de… ?",
        texte:
          "« Le chiffre des centièmes » : un seul chiffre. « Le nombre de centièmes » : tout ce qu'il y a, compté en centièmes. 1 unité = 10 dixièmes = 100 centièmes ; 1 dixième = 10 centièmes.",
        exemple: `Dans 37,46 : le chiffre des centièmes est 6 ; le nombre de centièmes est ${nombre(3746)}.`,
        svg: grille100(),
        formes: ["b"],
      },
      {
        titre: "Écrire avec des fractions décimales",
        texte:
          "Chaque rang est une fraction : 7/10 = 7 dixièmes, 8/1000 = 8 millièmes. Un rang vide garde sa place avec un 0.",
        exemple: "42 + 7/10 + 8/1000 = 42,708 (0 centième).",
        svg: tableauRangs(R5, chiffresDe("42,708")),
        formes: ["c", "d"],
      },
    ],
    NC02: [
      {
        titre: "Comparer des décimaux",
        texte:
          "J'écris les nombres avec autant de chiffres après la virgule (j'ajoute des 0), alignés sur la virgule, puis je compare rang par rang en partant de la gauche. Le plus long n'est pas forcément le plus grand.",
        exemple: "3,7 et 3,65 : 3,70 et 3,65 → 7 dixièmes > 6 dixièmes, donc 3,7 > 3,65.",
        svg: alignes(["3,7", "3,65"], ["unités", "dixièmes", "centièmes"], { 0: 1 }),
        formes: ["a", "b"],
      },
      {
        titre: "Comparer des négatifs",
        texte:
          "Sur la droite graduée, le plus petit est le plus à gauche. Entre deux négatifs, le plus petit est le plus loin de 0.",
        exemple: "−3,7 < −3,65.",
        svg: droite(
          -3.8,
          -3.6,
          [-3.8, -3.7, -3.6],
          { "-3.8": "−3,8", "-3.6": "−3,6" },
          {
            petits: Array.from({ length: 21 }, (_, i) => -3.8 + i / 100),
            points: [
              [-3.7, "−3,7", BLEU],
              [-3.65, "−3,65", ORANGE],
            ],
            W: 320,
          },
        ),
        formes: ["c"],
      },
      {
        titre: "Un nombre entre deux autres",
        texte:
          "J'écris les deux bornes avec un chiffre de plus après la virgule : la place apparaît.",
        exemple: "Entre 2,4 et 2,5 : 2,40 et 2,50 → 2,41, 2,45, 2,47… conviennent.",
        svg: droite(
          2.4,
          2.5,
          [2.4, 2.5],
          { 2.4: "2,4", 2.5: "2,5" },
          {
            petits: Array.from({ length: 11 }, (_, i) => 2.4 + i / 100),
            W: 320,
          },
        ),
        formes: ["d"],
      },
    ],
    NC03: [
      {
        titre: "Arrondir",
        texte:
          "Je repère les deux valeurs possibles et le milieu entre elles ; l'arrondi est la plus proche. Couper sans regarder la suite, c'est tronquer (ce n'est pas arrondir).",
        exemple: "8,46 au dixième : entre 8,4 et 8,5 ; 8,46 dépasse le milieu 8,45 → 8,5.",
        svg: droite(
          8.4,
          8.5,
          [8.4, 8.5],
          { 8.4: "8,4", 8.5: "8,5" },
          {
            points: [[8.46, "8,46", BLEU]],
            petits: Array.from({ length: 11 }, (_, i) => 8.4 + i / 100),
            milieu: 8.45,
            milieuTxt: "milieu 8,45",
          },
        ),
        formes: ["a", "b"],
      },
      {
        titre: "Un ordre de grandeur",
        texte:
          "Je remplace chaque nombre par un nombre proche et facile, et je calcule de tête : ça me dit environ combien.",
        exemple: "19,7 × 4,2 ≈ 20 × 4 = 80.",
        svg: arrondisProduit("19,7", "20", "4,2", "4"),
        formes: ["c"],
      },
      {
        titre: "Contrôler un résultat",
        texte:
          "Avant de croire un résultat, j'estime : est-il du bon ordre de grandeur ? Une somme de deux positifs est plus grande que chacun d'eux.",
        exemple: "5,6 + 3,25 ≈ 6 + 3 = 9 : un résultat comme 3,81 est impossible.",
        svg: "",
        formes: ["d"],
      },
    ],
  };
  for (const morceaux of Object.values(coursEnCache)) preparerCours(morceaux);
  return coursEnCache;
}

const REGLE = {
  NC01: "Chaque chiffre a son rang : après la virgule, les dixièmes, puis les centièmes, puis les millièmes.",
  NC02: "J'écris les nombres avec autant de chiffres après la virgule, puis je compare rang par rang en partant de la gauche.",
  NC03: "L'arrondi est la valeur la plus proche ; couper sans regarder la suite, c'est tronquer.",
};
const GRADE = { NC01: [6, 6, 6, 6], NC02: [6, 6, 5, 6], NC03: [6, 6, 6, 6] };

const question = (famille, v, d) =>
  questionCahier(famille, v, GRADE[famille][v], REGLE[famille], cours()[famille], d);

/* =================================================================== NC01 */
const POSITION = {
  unités: "juste avant la virgule",
  dixièmes: "juste après la virgule",
  centièmes: "au 2e rang après la virgule",
  millièmes: "au 3e rang après la virgule",
};

function nc01a(r) {
  // Partie entière de 1 à 99, trois décimales (la dernière jamais 0), chiffres tous différents ; rang
  // demandé : dixièmes, centièmes, millièmes, et unités une fois sur quatre.
  let e, ds;
  do {
    e = r.int(1, 99);
    ds = [r.int(0, 9), r.int(0, 9), r.int(0, 9)];
  } while (ds[2] === 0 || new Set([...String(e), ...ds.map(String)]).size !== String(e).length + 3);
  const x = `${e},${ds.join("")}`;
  const rang = r.next() < 0.25 ? "unités" : APRES[r.int(0, 2)];
  const chiffres = chiffresDe(x);
  const reponse = chiffres[rang];
  return question("NC01", 0, {
    pastille: "Numération",
    prompt: `Quel est le chiffre des ${rang} de ${x} ?`,
    gabarit: "[0]",
    fields: [champ(reponse, "Chiffre")],
    check: { type: "numeric", values: [reponse] },
    aide: {
      svg: tableauRangs(R5, null, { surligne: rang }),
      text: `Je place ${x} dans le tableau ; la colonne demandée est entourée.`,
    },
    indice: {
      text:
        rang === "unités"
          ? "Les unités : le chiffre juste avant la virgule."
          : `Les ${rang} : le ${ORDINAL[rang]} chiffre après la virgule.`,
    },
    bonne: reponse,
    erreurs: R5.filter((autre) => autre !== rang && autre in chiffres).map((autre) => ({
      reponse: chiffres[autre],
      phrase: `${chiffres[autre]} est le chiffre des ${autre} ; les ${rang} sont ${POSITION[rang]}.`,
    })),
    explication: {
      etapes: [`${x} : ${enMots(chiffres)}.`],
      svg: tableauRangs(R5, chiffres, { surligne: rang }),
    },
  });
}

function nc01b(r) {
  // Partie entière de 0 à 99, deux décimales (la dernière jamais 0) ; une fois sur quatre « combien de
  // dixièmes » (une décimale).
  const e = r.int(0, 99);
  const enDixiemes = r.next() < 0.25;
  const [unite, parUnite, nd] = enDixiemes ? ["dixièmes", 10, 1] : ["centièmes", 100, 2];
  let apres;
  if (enDixiemes) apres = r.int(1, 9);
  else
    do apres = r.int(1, 99);
    while (apres % 10 === 0);
  const x = `${e},${String(apres).padStart(nd, "0")}`;
  const total = e * parUnite + apres;
  const unites = combien(e, "unités");
  const morceaux = combien(apres, unite);
  const erreurs = [];
  if (e > 0)
    erreurs.push({
      reponse: String(apres),
      phrase:
        e === 1
          ? `L'unité compte aussi : 1 unité = ${parUnite} ${unite}.`
          : `Les ${e} unités comptent aussi : 1 unité = ${parUnite} ${unite}.`,
    });
  const chiffre = apres % 10;
  if (
    !enDixiemes &&
    chiffre !== apres &&
    chiffre !== total &&
    !erreurs.some((x) => x.reponse === String(chiffre))
  )
    erreurs.push({
      reponse: String(chiffre),
      phrase: `${chiffre} est le chiffre des centièmes. On demande le nombre de centièmes en tout.`,
    });
  const calc = [[x, `= ${unites} + ${morceaux}`]];
  if (e > 0) calc.push(["", `= ${nombre(e * parUnite)} ${unite} + ${morceaux}`]);
  calc.push(["", `= ${nombre(total)} ${total > 1 ? unite : SINGULIER[unite]}`]);
  return question("NC01", 1, {
    pastille: "Numération",
    prompt: `${x}, c'est combien de ${unite} en tout ?`,
    gabarit: `${x} = [0] ${unite}`,
    fields: [champ(total, enDixiemes ? "Dixièmes" : "Centièmes")],
    check: { type: "numeric", values: [String(total)] },
    aide: { svg: grille100(), text: `1 unité = ${parUnite} ${unite}.` },
    indice: {
      text:
        e === 0
          ? `0 unité : il n'y a que ${apres === 1 ? `le centième` : `les ${morceaux}`}.`
          : `${unites} = ${e} × ${parUnite} ${unite}. Ajoute ${apres === 1 ? `le ${SINGULIER[unite]}` : `les ${morceaux}`}.`,
    },
    bonne: `${x} = ${nombre(total)} ${total > 1 ? unite : SINGULIER[unite]}`,
    erreurs,
    explication: { calc },
  });
}

function nc01c(r) {
  // Partie entière de 0 à 99 ; 2 ou 3 fractions décimales ; un rang manque une fois sur deux (le 0
  // qui garde la place) ; termes mélangés une fois sur trois.
  const e = r.int(0, 99);
  const nb = r.pick([2, 3]);
  let rangs = [10, 100, 1000];
  if (nb === 2 || r.next() < 0.5)
    rangs = melanger(r, rangs)
      .slice(0, 2)
      .sort((a, b) => a - b);
  const termes = rangs.map((q) => [r.int(1, 9), q]);
  let ecrits = termes.map(([n, q]) => `${n}/${q}`);
  if (r.next() < 1 / 3) ecrits = melanger(r, ecrits);
  const expression = `${e ? `${e} + ` : ""}${ecrits.join(" + ")}`;
  // La valeur en dix-millièmes (les erreurs peuvent aller un rang plus loin que les millièmes).
  const valeur = e * 10000 + termes.reduce((s, [n, q]) => s + (n * 10000) / q, 0);
  const reponse = ecrire(valeur, 4);
  const dernier = Math.max(...rangs);
  const vides = [10, 100, 1000]
    .filter((q) => q < dernier && !rangs.includes(q))
    .map((q) => RANG_DE[q]);
  const chiffres = chiffresDe(reponse, APRES.indexOf(RANG_DE[dernier]) + 1);
  const erreurs = [];
  // Le 0 oublié : les chiffres des fractions collés après la virgule (42,78).
  if (vides.length)
    erreurs.push({
      reponse: `${e},${termes.map(([n]) => n).join("")}`,
      phrase: `Il n'y a pas de ${vides[0]} : écris 0 au rang des ${vides[0]}.`,
    });
  // Une fraction placée un rang trop loin (8/1000 écrit 0,0008).
  for (const [n, q] of termes) {
    const faux = ecrire(valeur - (n * 10000) / q + (n * 1000) / q, 4);
    if (faux !== reponse && !erreurs.some((x) => x.reponse === faux))
      erreurs.push({
        reponse: faux,
        phrase: `${n}/${q}, c'est ${combien(n, RANG_DE[q])} : ${ORDINAL[RANG_DE[q]]} chiffre après la virgule.`,
      });
  }
  const parRang = [...termes].sort((a, b) => a[1] - b[1]);
  return question("NC01", 2, {
    pastille: "Numération",
    prompt: "Écris ce nombre sous forme décimale.",
    gabarit: `${expression} = [0]`,
    fields: [champ(reponse, "Nombre décimal")],
    check: { type: "numeric", values: [reponse], form: "decimal" },
    aide: {
      svg: tableauRangs(R5, null, {
        etiquettes: Object.fromEntries(termes.map(([n, q]) => [RANG_DE[q], `${n}/${q}`])),
      }),
      text: "Sous chaque colonne, la fraction qui va dedans.",
    },
    indice: {
      text: vides.length
        ? `Rien ne va dans les ${vides[0]} : écris 0.`
        : `${parRang.map(([n, q], i) => `${n}/${q}${i ? "" : " va"} dans les ${RANG_DE[q]}`).join(", ")}.`,
    },
    bonne: `${expression} = ${reponse}`,
    erreurs,
    explication: {
      etapes: [`${enMots(chiffres)}.`],
      svg: tableauRangs(R5, chiffres),
    },
  });
}

function nc01d(r) {
  // Partie entière de 1 à 99 ; deux décimales (0 permis, le chiffre des centièmes jamais 0) ; variante
  // à un seul champ « + □/100 » une fois sur quatre.
  const e = r.int(1, 99);
  const a = r.int(0, 9);
  let b = r.int(0, 9);
  if (b === 0) b = r.int(1, 9);
  const x = `${e},${a}${b}`;
  const seul = r.next() < 0.25;
  const cols = ["dizaines", "unités", "dixièmes", "centièmes"];
  const chiffres = chiffresDe(x);
  const commun = {
    pastille: "Numération",
    prompt: "Complète.",
    aide: {
      svg: tableauRangs(cols, null, { entetesFraction: true }),
      text: "Les en-têtes sont écrits en fractions : 1/10, 1/100.",
    },
    indice: { text: `Place ${x} dans le tableau.` },
  };
  const svgExplication = tableauRangs(cols, chiffres, { entetesFraction: true });
  if (seul) {
    const total = 10 * a + b;
    return question("NC01", 3, {
      ...commun,
      gabarit: `${x} = ${e} + [0]/100`,
      fields: [champ(total, "Sur 100")],
      check: { type: "fields", values: [String(total)] },
      bonne: `${x} = ${e} + ${total}/100`,
      erreurs: a
        ? [
            {
              reponse: String(b),
              phrase:
                a === 1
                  ? `${b} est le chiffre des centièmes. Le dixième compte aussi : 1 dixième = 10 centièmes.`
                  : `${b} est le chiffre des centièmes. Les ${a} dixièmes comptent aussi : 1 dixième = 10 centièmes.`,
            },
          ]
        : [],
      explication: {
        etapes: [
          `${combien(a, "dixièmes")}, ${combien(b, "centièmes")}.`,
          ...(a
            ? [`${combien(a, "dixièmes")} = ${10 * a} centièmes : ${10 * a} + ${b} = ${total}.`]
            : []),
        ],
        svg: svgExplication,
      },
    });
  }
  return question("NC01", 3, {
    ...commun,
    gabarit: `${x} = ${e} + [0]/10 + [1]/100`,
    fields: [champ(a, "Sur 10"), champ(b, "Sur 100")],
    check: { type: "fields", values: [String(a), String(b)] },
    bonne: `${x} = ${e} + ${a}/10 + ${b}/100`,
    erreurs:
      a !== b
        ? [
            {
              reponse: [String(b), String(a)],
              phrase: "Le 1er chiffre après la virgule donne les dixièmes.",
            },
          ]
        : [],
    explication: {
      etapes: [`${combien(a, "dixièmes")}, ${combien(b, "centièmes")}.`],
      svg: svgExplication,
    },
  });
}

/* =================================================================== NC02 */
const signe = (a, b) => (a < b ? "<" : a > b ? ">" : "=");
const SIGNES = ["<", "=", ">"];
const decimalesDe = (ecrit) => (ecrit.split(",")[1] || "").length;
// Le nombre écrit avec nd chiffres après la virgule (3,8 → 3,80 ; 4 → 4,00).
function avecZeros(ecrit, nd) {
  const [ent, dec = ""] = ecrit.split(",");
  return nd ? `${ent},${dec.padEnd(nd, "0")}` : ent;
}
// Les colonnes des nombres alignés : (dizaines,) unités, puis les rangs après la virgule.
function colonnes(ecrits, nd) {
  const grand = ecrits.some((x) => x.replace(/^−/, "").split(",")[0].length > 1);
  return [...(grand ? ["dizaines"] : []), "unités", ...APRES.slice(0, nd)];
}
// Le premier rang où deux écritures (de même longueur, avec leurs 0) diffèrent.
function premierEcart(a, b) {
  const [ea, da] = a.replace(/^−/, "").split(",");
  const [eb, db] = b.replace(/^−/, "").split(",");
  if (ea !== eb) return { rang: "unités", ca: Number(ea.at(-1)), cb: Number(eb.at(-1)) };
  for (let i = 0; i < da.length; i++)
    if (da[i] !== db[i]) return { rang: APRES[i], ca: Number(da[i]), cb: Number(db[i]) };
  return null;
}
const MEMES = {
  unités: "",
  dixièmes: "Mêmes unités.",
  centièmes: "Mêmes unités, mêmes dixièmes.",
  millièmes: "Mêmes unités, mêmes dixièmes, mêmes centièmes.",
};

function nc02a(r) {
  // Un nombre au dixième de 0,1 à 9,9 ; l'autre à ± 0,01, ± 0,02 (ajouté le 29/10 : l'exemple du
  // cahier, 5,8 … 5,82), ± 0,05, ± 0,1, ou égal avec un 0 en plus.
  // Une fois sur deux, le plus long est le plus petit. Calculs en centièmes.
  const a = dixiemes(r, 1, 99) * 10;
  const cas = r.pick(["plus", "moins", "long_petit", "egal"]);
  let b;
  if (cas === "egal") b = a;
  else if (cas === "long_petit") b = a - r.pick([1, 2, 5]);
  else {
    const delta = r.pick([1, 2, 5, 10]);
    b = cas === "plus" ? a + delta : a - delta;
    if (b <= 0) b = a + delta;
    if (b >= 1000) b = a - delta;
  }
  const ga = cas === "egal" ? ecrire(a, 2, true) : ecrire(a, 2);
  const gb = ecrire(b, 2);
  const reponse = signe(a, b);
  const nd = Math.max(decimalesDe(ga), decimalesDe(gb));
  const [pa, pb] = [avecZeros(ga, nd), avecZeros(gb, nd)];
  const zeros = { 0: nd - decimalesDe(ga), 1: nd - decimalesDe(gb) };
  const dessin = alignes([ga, gb], colonnes([ga, gb], nd), zeros);
  const ajoute = zeros[0] + zeros[1] > 0;
  let indice, phrase, etapes;
  const completes = [
    ...(ga !== pa ? [`${ga} = ${pa}.`] : []),
    ...(gb !== pb ? [`${gb} = ${pb}.`] : []),
  ];
  if (reponse === "=") {
    indice = `${pa} et ${pb} : compare rang par rang.`;
    phrase = `${gb} = ${pb} : le 0 ajouté à la fin ne change pas le nombre.`;
    etapes = [...completes, "Les mêmes chiffres à chaque rang : les deux nombres sont égaux."];
  } else {
    const { rang, ca, cb } = premierEcart(pa, pb);
    indice = `${pa} et ${pb} : compare les ${rang}.`;
    const comparaison = `${combien(ca, rang)} ${reponse} ${combien(cb, rang)}`;
    phrase = `${pa} et ${pb} : ${comparaison}.`;
    etapes = [...completes, ...(MEMES[rang] ? [MEMES[rang]] : []), `${comparaison}.`];
  }
  return question("NC02", 0, {
    pastille: "Comparer",
    prompt: `Complète avec <, = ou > : ${ga} … ${gb}.`,
    fields: [champ(reponse, "Signe", "text", { options: SIGNES })],
    check: { type: "text", values: [reponse] },
    aide: {
      svg: dessin,
      text: ajoute
        ? "Les deux nombres alignés sur la virgule, le 0 ajouté en gris."
        : "Les deux nombres alignés sur la virgule.",
    },
    indice: { text: indice },
    bonne: `${ga} ${reponse} ${gb}`,
    erreurs: SIGNES.filter((s) => s !== reponse).map((s) => ({ reponse: s, phrase })),
    explication: { etapes, svg: dessin },
  });
}

function nc02b(r) {
  // Trois décimaux de même partie entière (0 à 20), écrits avec les mêmes chiffres (0,4 ; 0,04 ;
  // 0,404), jusqu'à trois décimales ; au moins un piège « plus long mais plus petit ». En millièmes.
  let e, choisis;
  const valeur = (m) => e * 1000 + Number(m.padEnd(3, "0"));
  for (;;) {
    e = r.int(0, 20);
    const [d, d2] = melanger(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const modeles = [
      `${d}`,
      `0${d}`,
      `${d}0${d}`,
      `${d}${d}`,
      `0${d}${d}`,
      `${d}${d2}`,
      `${d2}${d}`,
      `${d}0${d2}`,
    ];
    choisis = melanger(r, modeles).slice(0, 3);
    if (new Set(choisis.map(valeur)).size < 3) continue;
    const piege = choisis.some((x) =>
      choisis.some((y) => x.length > y.length && valeur(x) < valeur(y)),
    );
    if (piege) break;
  }
  const montres = melanger(r, choisis);
  const ecrits = montres.map((m) => `${e},${m}`);
  const tries = [...montres].sort((x, y) => valeur(x) - valeur(y)).map((m) => `${e},${m}`);
  const nd = Math.max(...montres.map((m) => m.length));
  const pad = (x) => avecZeros(x, nd);
  const zeros = Object.fromEntries(ecrits.map((x, i) => [i, nd - decimalesDe(x)]));
  const dessin = alignes(ecrits, colonnes(ecrits, nd), zeros);
  // Le premier rang où les trois ne sont pas tous égaux : le plus petit y est seul (ou les trois
  // diffèrent), ou bien c'est le plus grand qui est seul.
  const [s0, s1, s2] = tries.map(pad);
  const e01 = premierEcart(s0, s1);
  const e12 = premierEcart(s1, s2);
  const rangDe = (ecart) => APRES.indexOf(ecart.rang);
  const [x, y] = [`${combien(e01.ca, e01.rang)}`, `${combien(e12.cb, e12.rang)}`];
  let deuxieme, troisieme, raison;
  if (rangDe(e12) < rangDe(e01)) {
    deuxieme = `${s2} a ${y} : c'est le plus grand.`;
    raison = `${tries[2]} a ${y} : c'est le plus grand.`;
    troisieme = `${s0} < ${s1} (${x} < ${combien(e01.cb, e01.rang)}).`;
  } else {
    deuxieme = `${s0} a ${x} : c'est le plus petit.`;
    raison = `${tries[0]} a ${x}.`;
    troisieme = `${s1} < ${s2} (${combien(e12.ca, e12.rang)} < ${y}).`;
  }
  const ordre = (liste) => liste.join(" ; ");
  const decroissant = [...tries].reverse();
  const erreurs = [];
  for (const perm of [
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ]) {
    const liste = perm.map((i) => tries[i]);
    erreurs.push({
      reponse: liste,
      phrase:
        ordre(liste) === ordre(decroissant)
          ? "Croissant : du plus petit au plus grand."
          : `Croissant : du plus petit au plus grand. ${raison}`,
    });
  }
  return question("NC02", 1, {
    pastille: "Ranger",
    prompt: `Range dans l'ordre croissant : ${ecrits.join(" ; ")}.`,
    fields: tries.map((x, i) => champ(x, ["Le plus petit", "Au milieu", "Le plus grand"][i])),
    check: { type: "fields", values: tries },
    aide: { svg: dessin, text: "Les trois nombres alignés, complétés par des 0 gris." },
    indice: { text: `${ecrits.map(pad).join(" · ")} : compare d'abord les dixièmes.` },
    bonne: tries.join(" < "),
    erreurs,
    explication: { etapes: [`${ecrits.map(pad).join(" · ")}.`, deuxieme, troisieme], svg: dessin },
  });
}

/* La droite graduée de NC02-c : un morceau qui contient les deux négatifs, gradué en dixièmes (petites
   graduations : centièmes) quand ils sont proches, en unités (petites : dixièmes) sinon. En centièmes. */
function droiteNegatifs(a, b, ga, gb) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let pas = 10;
  let fin = 1;
  if (hi - lo > 30) [pas, fin] = [100, 10];
  const vmin = (Math.floor(lo / pas) - (lo % pas === 0 ? 1 : 0)) * pas;
  const vmax = (Math.ceil(hi / pas) + (hi % pas === 0 ? 1 : 0)) * pas;
  const ticks = [];
  for (let v = vmin; v <= vmax; v += pas) ticks.push(v / 100);
  const petits = [];
  for (let v = vmin; v <= vmax; v += fin) petits.push(v / 100);
  const etiquettes = pas === 100 ? ticks : [vmin / 100, vmax / 100];
  const labels = Object.fromEntries(etiquettes.map((v) => [v, ecrire(Math.round(v * 100), 2)]));
  // Deux textes trop proches : le second un cran plus haut.
  const ecart = (Math.abs(a - b) / (vmax - vmin)) * (340 - 52);
  const points =
    a === b
      ? [[a / 100, `${ga} = ${gb}`, BLEU]]
      : [
          [a / 100, ga, BLEU],
          [b / 100, gb, ORANGE, ecart < 50 ? 1 : 0],
        ];
  return droite(vmin / 100, vmax / 100, ticks, labels, { petits, points, W: 340 });
}

function nc02c(r) {
  // Deux négatifs proches (même partie entière, 1 ou 2 décimales) ; une fois sur quatre, parties
  // entières différentes ; l'égalité une fois sur huit. En centièmes.
  const u = r.next();
  let a, b, ga, gb;
  if (u < 0.125) {
    a = -dixiemes(r, 1, 99) * 10;
    b = a;
    [ga, gb] = [ecrire(a, 2), ecrire(a, 2, true)];
  } else {
    if (u < 0.375) {
      const e1 = r.int(1, 8);
      a = -(e1 * 100 + dixiemes(r, 1, 9) * 10);
      b = -((e1 - 1) * 100 + dixiemes(r, 1, 9) * 10);
    } else {
      const e = r.int(0, 9);
      a = -(e * 100 + r.int(1, 99));
      b = -(e * 100 + r.int(1, 9) * 10);
      if (a === b) b -= 1;
    }
    if (r.next() < 0.5) [a, b] = [b, a];
    [ga, gb] = [ecrire(a, 2), ecrire(b, 2)];
  }
  const reponse = signe(a, b);
  const dessin = droiteNegatifs(a, b, ga, gb);
  const [petit, grand] = a < b ? [ga, gb] : [gb, ga];
  const egal = reponse === "=";
  const phrase = egal
    ? `${gb} = ${ga} : le 0 ajouté à la fin ne change pas le nombre.`
    : `${petit} est plus loin de 0 que ${grand} : il est plus petit.`;
  return question("NC02", 2, {
    pastille: "Comparer",
    prompt: `Complète avec <, = ou > : ${ga} … ${gb}.`,
    fields: [champ(reponse, "Signe", "text", { options: SIGNES })],
    check: { type: "text", values: [reponse] },
    aide: { svg: dessin, text: "0 est vers la droite. Le plus à gauche est le plus petit." },
    indice: {
      text: egal
        ? `${ga} et ${gb} : le même point de la droite.`
        : `${petit} est plus loin de 0 que ${grand}.`,
    },
    bonne: `${ga} ${reponse} ${gb}`,
    erreurs: SIGNES.filter((s) => s !== reponse).map((s) => ({ reponse: s, phrase })),
    explication: {
      etapes: egal
        ? [`${ga} = ${gb}.`, "C'est le même point de la droite."]
        : [
            `Sur la droite, ${ga} est à ${a < b ? "gauche" : "droite"} de ${gb}.`,
            "Le plus à gauche est le plus petit.",
          ],
      svg: dessin,
    },
  });
}

function nc02d(r) {
  // Bornes positives consécutives au dixième (6e) ou au centième (une fois sur quatre).
  const auCentieme = r.next() < 0.25;
  const nd = auCentieme ? 2 : 1;
  const a = auCentieme ? r.int(1, 999) : dixiemes(r, 1, 98);
  const b = a + 1;
  const [ga, gb] = [ecrire(a, nd), ecrire(b, nd)];
  const [pa, pb] = [ecrire(a * 10, nd + 1, true), ecrire(b * 10, nd + 1, true)];
  const exemple = ecrire(a * 10 + 5, nd + 1);
  const p = 10 ** nd;
  const entre = [1, 2, 9].map((k) => ecrire(a * 10 + k, nd + 1));
  const erreurs = [ga, gb].map((borne) => ({
    reponse: borne,
    phrase: `${borne} est une borne : il faut un nombre entre les deux.`,
  }));
  // « 3,10 » : après 3,9 viendrait 3,10 (cahier) ; c'est 3,1, plus petit que la première borne.
  if (!auCentieme && a % 10 >= 2) {
    const e = Math.floor(a / 10);
    erreurs.push({
      reponse: `${e},10`,
      phrase: `${e},10 = ${e},1 : il est plus petit que ${ga}.`,
    });
  }
  return question("NC02", 3, {
    pastille: "Encadrer",
    prompt: `Écris un nombre décimal compris entre ${ga} et ${gb}.`,
    gabarit: `${ga} < [0] < ${gb}`,
    fields: [champ(exemple, "Nombre décimal")],
    check: {
      type: "property",
      rule: "range",
      min: a / p,
      max: b / p,
      minInclusive: false,
      maxInclusive: false,
      form: "decimal",
    },
    aide: {
      svg: droite(
        a / p,
        b / p,
        [a / p, b / p],
        { [a / p]: ga, [b / p]: gb },
        {
          petits: Array.from({ length: 11 }, (_, i) => (a * 10 + i) / (p * 10)),
          W: 340,
        },
      ),
      text: `Entre ${ga} et ${gb}, il y a de la place : 10 petites graduations.`,
    },
    indice: {
      text: `Écris ${ga} et ${gb} avec ${nd === 1 ? "deux" : "trois"} chiffres après la virgule : ${pa} et ${pb}.`,
    },
    bonne: `par exemple ${exemple}`,
    erreurs,
    explication: {
      etapes: [
        `${ga} = ${pa} et ${gb} = ${pb}.`,
        `${entre[0]} ; ${entre[1]} ; … ; ${entre[2]} sont entre les deux.`,
        `${exemple} convient (et bien d'autres).`,
      ],
      svg: droite(
        a / p,
        b / p,
        [a / p, b / p],
        { [a / p]: ga, [b / p]: gb },
        {
          petits: Array.from({ length: 11 }, (_, i) => (a * 10 + i) / (p * 10)),
          W: 340,
        },
      ),
    },
  });
}

/* =================================================================== NC03 */
/* Arrondir x (en 10^-nd) à 10^-(nd-1) : NC03-a au dixième (x en centièmes), NC03-b au centième (x en
   millièmes). Le chiffre qu'on regarde n'est jamais 5 (pas de cas « au milieu »). */
function arrondir(r, v, nd, x) {
  const bas = Math.floor(x / 10);
  const haut = bas + 1;
  const milieu = bas * 10 + 5;
  const audela = x % 10 > 5;
  const arrondi = audela ? haut : bas;
  const [gx, gbas, ghaut, gmilieu] = [
    ecrire(x, nd),
    ecrire(bas, nd - 1),
    ecrire(haut, nd - 1),
    ecrire(milieu, nd),
  ];
  const garde = ecrire(arrondi, nd - 1, true);
  const garni = ecrire(arrondi, nd - 1);
  const reponse = garni;
  const rang = nd === 2 ? "dixième" : "centième";
  const pas = 10 ** (nd - 1);
  const erreurs = [];
  if (audela)
    erreurs.push({
      reponse: gbas,
      phrase:
        nd === 2
          ? `C'est la troncature : ${gx} est plus près de ${ghaut}.`
          : `C'est la troncature (on coupe) : ${gx} est plus près de ${ghaut}.`,
    });
  else
    erreurs.push({
      reponse: ghaut,
      phrase: `${gx} est plus près de ${gbas} : il n'atteint pas le milieu ${gmilieu}.`,
    });
  // La retenue oubliée : 3,96 → « 3,10 » (9 + 1 écrit 10) ; le cahier : « 3,9 + 0,1 = 4,0. »
  if (audela && bas % 10 === 9) {
    const debut = gbas.slice(0, -1);
    erreurs.push({
      reponse: `${debut}10`,
      phrase: `${gbas} + ${nd === 2 ? "0,1" : "0,01"} = ${garde}.`,
    });
  }
  return question("NC03", v, {
    pastille: "Arrondir",
    prompt: `Arrondis au ${rang}.`,
    gabarit: `${gx} ≈ [0]`,
    fields: [champ(reponse, "Arrondi")],
    check: { type: "numeric", values: [reponse] },
    aide: {
      svg: droite(
        bas / pas,
        haut / pas,
        [bas / pas, haut / pas],
        { [bas / pas]: gbas, [haut / pas]: ghaut },
        {
          points: [[x / (pas * 10), gx, BLEU]],
          petits: Array.from({ length: 11 }, (_, i) => (bas * 10 + i) / (pas * 10)),
          milieu: milieu / (pas * 10),
          milieuTxt: `milieu ${gmilieu}`,
        },
      ),
      // Une phrase qui se suffit, pour le dixième comme pour le centième (choix de Gwenaël du 29/10 :
      // dans une série mélangée, l'élève n'a pas toujours vu le premier dessin).
      text: `Les deux arrondis possibles, le milieu en pointillés, et ${gx}.`,
    },
    indice: {
      text:
        nd === 2
          ? `${gx} est-il avant ou après le milieu ${gmilieu} ?`
          : `${gx} est-il avant ou après ${gmilieu} ?`,
    },
    bonne: `${gx} ≈ ${garni}${garde !== garni ? ` (ou ${garde})` : ""}`,
    erreurs,
    explication: {
      etapes: [
        `${gx} est entre ${gbas} et ${ghaut}.`,
        audela ? `Il dépasse le milieu ${gmilieu}.` : `Il n'atteint pas le milieu ${gmilieu}.`,
        `Le plus proche : ${garni}.`,
      ],
      svg: droite(
        bas / pas,
        haut / pas,
        [bas / pas, haut / pas],
        { [bas / pas]: gbas, [haut / pas]: ghaut },
        {
          points: [[x / (pas * 10), gx, BLEU]],
          petits: Array.from({ length: 11 }, (_, i) => (bas * 10 + i) / (pas * 10)),
          milieu: milieu / (pas * 10),
          milieuTxt: `milieu ${gmilieu}`,
        },
      ),
    },
  });
}

function nc03a(r) {
  // Nombre positif au centième, de 0,1 à 99 ; chiffre des centièmes jamais 0 ni 5 ; une retenue une
  // fois sur cinq (3,96).
  let x;
  do x = r.next() < 0.2 ? r.int(0, 98) * 100 + 90 + r.int(6, 9) : r.int(10, 9999);
  while (x % 10 === 0 || x % 10 === 5);
  return arrondir(r, 0, 2, x);
}

function nc03b(r) {
  // Nombre positif au millième ; chiffre des millièmes jamais 0 ni 5 ; retenue une fois sur cinq.
  let x;
  do
    x =
      r.next() < 0.2
        ? r.int(0, 99) * 1000 + r.int(0, 9) * 100 + 90 + r.int(6, 9)
        : r.int(100, 99999);
  while (x % 10 === 0 || x % 10 === 5);
  return arrondir(r, 1, 3, x);
}

function nc03c(r) {
  // Un facteur proche de 10, 20, 30 ou 40 ; l'autre proche d'un entier de 2 à 9 ; choix séparés par un
  // facteur 10. En dixièmes.
  const A = r.pick([10, 20, 30, 40]);
  const B = r.int(2, 9);
  const a = A * 10 + r.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
  const b = B * 10 + r.pick([-3, -2, -1, 1, 2, 3]);
  const [ga, gb] = [ecrire(a, 1), ecrire(b, 1)];
  const produit = A * B;
  const choix = [produit / 10, produit, produit * 10, produit * 100].map(nombre);
  const bonne = nombre(produit);
  return question("NC03", 2, {
    pastille: "Ordre de grandeur",
    prompt: `Quel est l'ordre de grandeur de ${ga} × ${gb} ?`,
    fields: [champ(bonne, "Choisis une réponse", "text", { options: choix })],
    check: { type: "text", values: [bonne] },
    aide: {
      svg: arrondisProduit(ga, "□", gb, "□"),
      text: "Sous chaque facteur, un nombre proche et facile.",
    },
    indice: {
      svg: arrondisProduit(ga, String(A), gb, String(B)),
      text: `${ga} ≈ ${A} et ${gb} ≈ ${B}.`,
    },
    bonne,
    erreurs: choix
      .filter((c) => c !== bonne)
      .map((c) => ({
        reponse: c,
        phrase: `${A} × ${B} = ${bonne}, pas ${c} : attention aux zéros.`,
      })),
    explication: {
      etapes: [`${ga} ≈ ${A} et ${gb} ≈ ${B}.`, `${A} × ${B} = ${bonne}.`],
      svg: arrondisProduit(ga, String(A), gb, String(B)),
    },
  });
}

function nc03d(r) {
  // Deux décimaux de 1,1 à 8,9 (au dixième ou au centième). Un tiers : le bon résultat. Deux tiers :
  // une VRAIE erreur d'élève — virgules alignées à droite (3,5 + 2,41 = 2,76), unités et dixièmes
  // additionnés à part (6,8 + 7,2 = 13,10), ou virgule placée comme dans un produit (6,8 + 7,2 = 1,40).
  // Calculs en centièmes.
  const juste = r.next() < 1 / 3;
  let mode, a, b, faux;
  for (;;) {
    mode = juste ? "juste" : r.pick(["droite", "dixiemes", "produit"]);
    a = dixiemes(r, 11, 89) * 10;
    if (mode === "droite") {
      b = r.int(111, 899);
      if (b % 10 === 0) continue;
      // 3,5 + 2,41 écrit 35 + 241 = 276 → 2,76 : toujours plus petit que la somme ; assez loin pour
      // que l'estimation le voie.
      faux = ecrire(a / 10 + b, 2);
      if (a + b - (a / 10 + b) < 200) continue;
    } else {
      b = dixiemes(r, 11, 89) * 10;
      if (mode === "dixiemes") {
        const [da, db] = [(a / 10) % 10, (b / 10) % 10];
        if (da + db < 10) continue;
        faux = `${Math.floor(a / 100) + Math.floor(b / 100)},${da + db}`;
      } else if (mode === "produit") faux = ecrire((a + b) / 10, 2, true);
      else faux = ecrire(a + b, 2);
    }
    break;
  }
  const [ga, gb, gs] = [ecrire(a, 2), ecrire(b, 2), ecrire(a + b, 2)];
  const [Ea, Eb] = [Math.round(a / 100), Math.round(b / 100)];
  const E = Ea + Eb;
  const reponse = juste ? "Oui" : "Non";
  const [da, db] = [(a / 10) % 10, (b / 10) % 10];
  const reste = da + db - 10;
  const retenue = `${combien(da, "dixièmes")} + ${combien(db, "dixièmes")} = ${da + db} dixièmes = 1 unité${reste > 0 ? ` et ${combien(reste, "dixièmes")}` : ""}`;
  const estimation = `${ga} + ${gb}, c'est environ ${Ea} + ${Eb} = ${E}.`;
  const PHRASE = {
    juste: `${ga} + ${gb} = ${gs} : Lina a raison.`,
    droite: `${ga} + ${gb}, c'est environ ${E} : ${faux} est bien trop petit.`,
    dixiemes: `${retenue} : ça fait ${gs}.`,
    produit: `${ga} + ${gb}, c'est plus que ${ga} : ${faux} est impossible.`,
  };
  const ETAPES = {
    juste: [
      `J'estime : ${ga} + ${gb} ≈ ${E}.`,
      `${gs} est proche de ${E}.`,
      `${ga} + ${gb} = ${gs} : le calcul est juste.`,
    ],
    droite: [
      `J'estime : ${ga} + ${gb} ≈ ${E}.`,
      `${faux} est loin de ${E} : le résultat est faux.`,
      `Lina a aligné les chiffres à droite (${ga.replace(",", "")} + ${gb.replace(",", "")}) au lieu d'aligner les virgules.`,
    ],
    dixiemes: [
      `${retenue}.`,
      `${ga} + ${gb} = ${gs}.`,
      "Lina a additionné les unités et les dixièmes à part, sans la retenue.",
    ],
    produit: [
      `J'estime : ${ga} + ${gb} ≈ ${E}.`,
      `${faux} est loin de ${E} : le résultat est faux.`,
      `Lina a placé la virgule comme dans un produit : ${ga} + ${gb} = ${gs}.`,
    ],
  };
  return question("NC03", 3, {
    pastille: "Contrôler un résultat",
    prompt: "Lina a écrit ce calcul. Est-il juste ?",
    math: `${ga} + ${gb} = ${faux}`,
    fields: [champ(reponse, "Choisis une réponse", "text", { options: ["Oui", "Non"] })],
    check: { type: "text", values: [reponse] },
    aide: { svg: estimerSomme(ga, gb, faux), text: "J'estime d'abord : environ combien ?" },
    indice: { text: mode === "dixiemes" ? `${retenue}.` : estimation },
    bonne: `${reponse} : ${ga} + ${gb} = ${gs}`,
    erreurs: [{ reponse: juste ? "Non" : "Oui", phrase: PHRASE[mode] }],
    explication: { etapes: ETAPES[mode] },
  });
}

const FORMES = {
  NC01: [nc01a, nc01b, nc01c, nc01d],
  NC02: [nc02a, nc02b, nc02c, nc02d],
  NC03: [nc03a, nc03b, nc03c, nc03d],
};

export const generators = {
  NC01: (r, v = 0) => FORMES.NC01[v](r),
  NC02: (r, v = 0) => FORMES.NC02[v](r),
  NC03: (r, v = 0) => FORMES.NC03[v](r),
};
