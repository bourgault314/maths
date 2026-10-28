/* NC17 (critères de divisibilité) et NC18 (diviseurs, nombres premiers, division euclidienne),
   écrits d'après le cahier « Nombres et calculs », partie 1, vérifié par Gwenaël le 24/10/2026
   (lot NC-1). Le cahier est la seule source : consignes, gabarits (la case dans le calcul), aides,
   « Encore un indice », bonnes réponses, explications ligne sous ligne, morceaux de cours, bornes des
   tirages et erreurs connues. Les ajouts du cahier sont NC17-f et NC18-g.

   Ce que chaque question donne à la coque en plus du moule (voir aides/README.md) : cahier, pastille,
   gabarit, touches, bonne, erreurs, explication { calc, etapes, svg }, course.morceaux. */
import {
  arbre,
  barres,
  cases,
  chiffres,
  criteres,
  droite,
  INC_TEXTE,
  nombre,
  pairesBarre,
  premiersGrille,
  reglesUnites,
  venn,
  VERT,
} from "../aides/dessins.js";
import { champ, preparerCours, questionCahier } from "./cahier.js";

export const counts = { NC17: 6, NC18: 7 };

// Les formes réécrites d'après le cahier (elles ne suivent plus les empreintes de l'archive de GPT).
export const formesCahier = [
  ..."abcdef".split("").map((f) => `NC17-${f}`),
  ..."abcdefg".split("").map((f) => `NC18-${f}`),
];

const somme = (n) => [...String(n)].reduce((s, c) => s + Number(c), 0);
const plus = (n) => [...String(n)].join(" + ");
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
const premier = (n) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const facteurs = (n) => {
  const liste = [];
  for (let d = 2; n > 1; d++)
    while (n % d === 0) {
      liste.push(d);
      n /= d;
    }
  return liste;
};
const diviseurs = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const ou = (liste) =>
  liste.length < 2 ? liste.join("") : `${liste.slice(0, -1).join(", ")} ou ${liste.at(-1)}`;
const et = (liste) =>
  liste.length < 2 ? liste.join("") : `${liste.slice(0, -1).join(", ")} et ${liste.at(-1)}`;
const MOTS = ["zéro", "un", "deux", "trois", "quatre", "cinq"];
function melanger(r, liste) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/* ------------------------------------------------------------------ le cours, en morceaux
   Un cours par famille, un morceau par type de question, écrit en « je » (proposition de Gwenaël du
   21/10). Le morceau de la question en haut, encadré ; « Le reste du cours » dessous. */
let coursEnCache = null;
function cours() {
  coursEnCache ||= {
    NC17: [
      {
        titre: "Divisible, ça veut dire quoi ?",
        texte:
          "Un nombre est <b>divisible</b> par un autre quand la division tombe juste : le reste est 0. « 12 est divisible par 3 », « 3 divise 12 », « 12 est un multiple de 3 » : c'est la même phrase.",
        exemple: "12 = 3 × 4, reste 0 : 12 est divisible par 3.",
        svg: barres(
          [
            [[12, "12", "tot"]],
            [
              [4, "4", "nb"],
              [4, "4", "nb"],
              [4, "4", "nb"],
            ],
          ],
          { legende: "12 = 3 × 4, reste 0" },
        ),
        formes: [],
      },
      {
        titre: "Par 2, 5 et 10 : je regarde le chiffre des unités",
        texte:
          "Par 2 : le chiffre des unités est 0, 2, 4, 6 ou 8. Par 5 : il est 0 ou 5. Par 10 : il est 0. Divisible par 10, c'est être divisible par 2 <b>et</b> par 5.",
        exemple: "230 : chiffre des unités 0 → divisible par 2, par 5 et par 10.",
        svg: chiffres("230", { unites: true }),
        formes: ["a"],
      },
      {
        titre: "Par 3 et 9 : j'additionne tous les chiffres",
        texte:
          "Si la somme des chiffres est dans la table de 3, le nombre est divisible par 3 ; dans la table de 9, par 9. Le chiffre des unités ne suffit pas : 43 finit par 3, mais 4 + 3 = 7 ; il n'est pas divisible par 3. Un nombre divisible par 9 est aussi divisible par 3.",
        exemple:
          "372 : 3 + 7 + 2 = 12 → divisible par 3, pas par 9. 729 : 7 + 2 + 9 = 18 → par 3 et par 9.",
        svg: chiffres("372", { somme: true }),
        formes: ["b", "c", "d", "f"],
      },
      {
        titre: "Je justifie avec le bon critère",
        texte:
          "Pour 2, 5, 10 : une phrase avec le chiffre des unités. Pour 3, 9 : une phrase avec la somme des chiffres.",
        exemple: "« 7 + 6 + 8 = 21 et 21 est dans la table de 3, donc 768 est divisible par 3. »",
        svg: criteres("768"),
        formes: ["e"],
      },
    ],
    NC18: [
      {
        titre: "Les diviseurs d'un nombre",
        texte:
          "a est un <b>diviseur</b> de n si n = a × b avec b entier. Je cherche les paires : 1 × n, 2 × …, 3 × … Quand une division ne tombe pas juste, je barre la ligne ; quand les paires se répètent, j'ai fini.",
        exemple:
          "30 = 1 × 30 = 2 × 15 = 3 × 10 = 5 × 6 : les diviseurs de 30 sont 1, 2, 3, 5, 6, 10, 15, 30.",
        svg: pairesBarre(
          30,
          [
            [1, 30, false],
            [2, 15, false],
            [3, 10, false],
            [4, null, true],
            [5, 6, false],
          ],
          "4 : ça ne tombe pas juste, je barre",
        ),
        formes: ["a", "b"],
      },
      {
        titre: "Les nombres premiers",
        texte:
          "Un nombre <b>premier</b> a exactement deux diviseurs : 1 et lui-même. 1 n'est pas premier (un seul diviseur). Les nombres premiers jusqu'à 50 : 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47. Pour savoir si un nombre est premier, je le divise par 2, 3, 5, 7… et je m'arrête quand le carré du diviseur dépasse le nombre.",
        exemple:
          "51 = 3 × 17 : 51 n'est pas premier. 41 : ni 2, ni 3, ni 5 ; 7 × 7 = 49 dépasse déjà 41 → 41 est premier.",
        svg: "",
        formes: ["e"],
      },
      {
        titre: "Décomposer en facteurs premiers",
        texte:
          "J'écris le nombre comme un produit de nombres premiers ; je commence par 2, 3, 5, et je continue jusqu'à n'avoir que des premiers.",
        exemple: "60 = 2 × 30 = 2 × 2 × 15 = 2 × 2 × 3 × 5 = 2² × 3 × 5.",
        svg: "",
        formes: ["c"],
      },
      {
        titre: "La division euclidienne",
        texte:
          "Diviser a par b : a = b × q + r, avec r plus petit que b. q est le quotient, r le reste.",
        exemple: "23 = 5 × 4 + 3 : quotient 4, reste 3 (et 3 < 5).",
        svg: cases(23, 5),
        formes: ["d"],
      },
      {
        titre: "Diviseur commun, multiple commun",
        texte:
          "Le plus grand diviseur commun : je décompose les deux nombres, je prends les facteurs qu'ils ont en commun et je les multiplie. Le plus petit multiple commun : je cherche le premier nombre qui est dans les deux tables.",
        exemple:
          "12 = 2 × 2 × 3 et 18 = 2 × 3 × 3 : en commun 2 × 3 = 6. Multiples de 4 : 4, 8, 12 ; de 6 : 6, 12 → 12.",
        svg: venn(12, 18, [2, 2, 3], [2, 3, 3], [[2], [2, 3], [3]]),
        formes: ["f", "g"],
      },
    ],
  };
  for (const morceaux of Object.values(coursEnCache)) preparerCours(morceaux);
  return coursEnCache;
}

const REGLE = {
  NC17: "Par 2, 5 et 10 : je regarde le chiffre des unités. Par 3 et 9 : j'additionne tous les chiffres.",
  NC18: "Un diviseur partage sans reste. Un nombre premier a exactement deux diviseurs : 1 et lui-même.",
};
const GRADE = { NC17: [6, 5, 5, 5, 5, 5], NC18: [6, 5, 3, 6, 3, 3, 4] };

// La question du cahier, dans la forme du moule (voir cahier.js).
const question = (famille, v, d) =>
  questionCahier(famille, v, GRADE[famille][v], REGLE[famille], cours()[famille], d);

/* =================================================================== NC17 */
function nc17a(r) {
  // Chiffre des unités de 0 à 9, « Aucun » environ une fois sur six ; entier de 100 à 99 998.
  const u = r.next() < 1 / 6 ? r.pick([1, 3, 7, 9]) : r.pick([0, 2, 4, 5, 6, 8]);
  let n = r.int(10, 9999) * 10 + u;
  if (n > 99998) n -= 10;
  const N = nombre(n);
  const choix = ["2", "5", "10", "Aucun"];
  const texteDe = (liste) => (liste.length ? liste.join(" ; ") : "Aucun");
  const vrais = [2, 5, 10].filter((d) => n % d === 0);
  const reponse = texteDe(vrais);
  const PHRASES = {
    2: "Pour 2, le chiffre des unités doit être 0, 2, 4, 6 ou 8.",
    5: "Pour 5, le chiffre des unités doit être 0 ou 5.",
    10: "Pour 10, le chiffre des unités doit être 0.",
  };
  // Toutes les réponses fausses possibles, chacune avec la règle du premier diviseur mal classé.
  const erreurs = [];
  for (let masque = 0; masque < 8; masque++) {
    const liste = [2, 5, 10].filter((_, i) => masque & (1 << i));
    if (texteDe(liste) === reponse) continue;
    const mal = [2, 5, 10].find((d) => liste.includes(d) !== (n % d === 0));
    erreurs.push({ reponse: texteDe(liste), phrase: PHRASES[mal] });
  }
  const bonne =
    u === 0
      ? `${N} est divisible par 2, par 5 et par 10`
      : u === 5
        ? `${N} est divisible par 5 seulement`
        : u % 2 === 0
          ? `${N} est divisible par 2 seulement`
          : `${N} n'est divisible ni par 2, ni par 5, ni par 10`;
  const etapes = [`Le chiffre des unités est ${u}.`];
  etapes.push(
    u % 2 === 0 ? `${u} est pair : divisible par 2.` : `${u} est impair : pas divisible par 2.`,
  );
  if (u === 0) etapes.push("0 : divisible par 5 et par 10.");
  else if (u === 5) etapes.push("C'est 5 : divisible par 5, mais pas par 10.");
  else etapes.push(`${u} n'est ni 0 ni 5 : ni par 5, ni par 10.`);
  return question("NC17", 0, {
    pastille: "Critères de divisibilité",
    prompt: "Par quels nombres est-il divisible ?",
    math: N,
    fields: [
      champ(reponse, "Choisis les nombres", "text", {
        options: choix,
        multiple: true,
        exclusif: "Aucun",
      }),
    ],
    check: { type: "text", values: [reponse] },
    aide: { svg: reglesUnites(String(n)), text: "" },
    indice: { text: `${u} est-il 0, 2, 4, 6 ou 8 ?\n${u} est-il 0 ou 5 ?\n${u} est-il 0 ?` },
    bonne,
    erreurs,
    explication: { etapes },
  });
}

// Les multiples de k autour de s : (9, 18, 27) pour 19 et 9.
function autour(s, k) {
  const bas = s % k === 0 ? s : Math.floor(s / k) * k;
  return [bas - k, bas, bas + k].filter((x) => x > 0);
}

function nc17b(r) {
  const k = r.pick([3, 9]);
  const oui = r.bool();
  let n;
  for (;;) {
    n = r.int(100, 9999);
    const s = somme(n);
    if (oui && s % k === 0) break;
    // Pour 9, un « Non » sur deux est divisible par 3 (le piège).
    if (!oui && s % k !== 0) {
      if (k === 9 && r.bool() && s % 3 !== 0) continue;
      break;
    }
  }
  const s = somme(n);
  const N = nombre(n);
  const table = autour(s, k).join(", ");
  const reponse = oui ? "Oui" : "Non";
  return question("NC17", 1, {
    pastille: "Critères de divisibilité",
    prompt: `Ce nombre est-il divisible par ${k} ?`,
    math: N,
    fields: [champ(reponse, "Choisis une réponse", "text", { options: ["Oui", "Non"] })],
    check: { type: "text", values: [reponse] },
    aide: {
      svg: chiffres(String(n), { somme: true }),
      text: `Si la somme des chiffres est dans la table de ${k}, le nombre aussi.`,
    },
    indice: { text: `La somme vaut ${s}. ${s} est-il dans la table de ${k} ? (${table}…)` },
    bonne: `${reponse} : ${plus(n)} = ${s}`,
    erreurs: [
      {
        reponse: oui ? "Non" : "Oui",
        phrase: oui
          ? `${s} est dans la table de ${k} (${table}).`
          : `${s} n'est pas dans la table de ${k} (${table}).`,
      },
    ],
    explication: {
      etapes: [
        `${plus(n)} = ${s}.`,
        `Table de ${k} : ${table}… ${s} ${oui ? "y est" : "n'y est pas"}.`,
        `${N} ${oui ? "est" : "n'est pas"} divisible par ${k}.`,
      ],
      svg: chiffres(String(n), { somme: true, total: s }),
    },
  });
}

function nc17c(r) {
  const k = r.pick([9, 3]);
  let ds, pos, connu;
  // 3 ou 4 chiffres, le trou au milieu ; la somme connue n'est jamais dans la table (sinon 0 et 9,
  // ou 0, 3, 6, 9 conviennent, et « le nombre juste après » de l'indice ne dit plus tout).
  do {
    const nch = r.pick([3, 4]);
    ds = [r.int(1, 9), ...Array.from({ length: nch - 1 }, () => r.int(0, 9))];
    pos = r.int(1, nch - 2);
    connu = ds.reduce((s, c) => s + c, 0) - ds[pos];
  } while (connu % k === 0);
  const solutions = [...Array(10).keys()].filter((c) => (connu + c) % k === 0);
  const cible = Math.ceil(connu / k) * k;
  const chiffre = cible - connu;
  const avec = (c) => ds.map((x, i) => (i === pos ? c : x));
  const connus = ds.filter((_, i) => i !== pos).join(" + ");
  const autres = solutions.filter((c) => c !== chiffre);
  return question("NC17", 2, {
    pastille: "Critères de divisibilité",
    prompt: `Quel chiffre écrire pour que le nombre soit divisible par ${k} ?`,
    gabarit: ds.map((x, i) => (i === pos ? "[0]" : String(x))).join(""),
    fields: [champ(chiffre, "Chiffre")],
    check: { type: "property", rule: "digitFill", known: connu, divisor: k },
    aide: {
      svg: chiffres(avec("?").join(""), { somme: true }),
      text: `${avec("□").join(" + ")} doit tomber dans la table de ${k}.`,
    },
    indice: {
      text: `${connus} = ${connu}. Quel est le nombre de la table de ${k} juste après ${connu} ?`,
    },
    bonne:
      `${avec(chiffre).join(" ")} : ${avec(chiffre).join(" + ")} = ${cible}` +
      (autres.length ? ` — ${ou(autres)} aussi` : ""),
    erreurs: [...Array(10).keys()]
      .filter((c) => !solutions.includes(c))
      .map((c) => ({
        reponse: String(c),
        phrase: `${avec(c).join(" + ")} = ${connu + c} : ce n'est pas dans la table de ${k}.`,
      })),
    explication: {
      etapes: [
        `${connus} = ${connu}.`,
        `Juste après ${connu} dans la table de ${k} : ${cible}.`,
        `${cible} − ${connu} = ${chiffre} : j'écris ${chiffre} → ${nombre(avec(chiffre).join(""))}.`,
      ],
      svg: chiffres(avec(chiffre).join(""), { somme: true, total: cible, remplie: pos }),
    },
  });
}

function nc17d(r) {
  const nch = r.pick([3, 4, 5]);
  const k = r.pick([3, 9]);
  const mode = r.pick(["u", "u", "2", "5"]);
  const u = mode === "u" ? r.int(1, 9) : 0;
  const m = mode === "u" ? null : Number(mode);
  // L'exemple : le plus petit, qui commence par 1 (comme l'indice) et finit par u (ou par 0).
  let exemple = 10 ** (nch - 1);
  while (exemple % 10 !== u || exemple % k !== 0) exemple++;
  const s = somme(exemple);
  const vides = "□ ".repeat(nch - 1);
  const reste = nch - 2;
  const motReste = `${MOTS[reste]} chiffre${reste > 1 ? "s" : ""}`;
  return question("NC17", 3, {
    pastille: "Critères de divisibilité",
    prompt:
      mode === "u"
        ? `Écris un nombre de ${nch} chiffres, divisible par ${k}, dont le chiffre des unités est ${u}.`
        : `Écris un nombre de ${nch} chiffres, divisible par ${k} et par ${m}.`,
    gabarit: "[0]",
    fields: [champ(exemple, "Nombre", "number", { large: true })],
    check: {
      type: "property",
      rule: "digitSum",
      digits: nch,
      sumDivisor: k,
      lastDigit: mode === "u" ? u : null,
      alsoDivisor: m,
    },
    aide: {
      svg: chiffres("?".repeat(nch - 1) + (mode === "u" ? u : "?"), {
        somme: true,
        legende: `somme : dans la table de ${k}`,
      }),
      text:
        mode === "u"
          ? `Le ${u} est déjà à sa place ; il reste ${MOTS[nch - 1]} chiffres à choisir.`
          : m === 2
            ? "Par 2 : le chiffre des unités est 0, 2, 4, 6 ou 8."
            : "Par 5 : le chiffre des unités est 0 ou 5.",
    },
    indice: {
      text:
        mode === "u"
          ? `Commence par 1. Il reste ${motReste} pour que la somme tombe dans la table de ${k}.`
          : `Commence par 1 et finis par 0. Il reste ${motReste} pour que la somme tombe dans la table de ${k}.`,
    },
    bonne: `par exemple ${nombre(exemple)} (${plus(exemple)} = ${s})`,
    explication: {
      etapes: [
        mode === "u"
          ? `${nch} chiffres, le chiffre des unités est ${u} : ${vides}${u}.`
          : `${nch} chiffres, divisible par ${m} : je finis par 0 → ${vides}0.`,
        `${plus(exemple)} = ${s}, dans la table de ${k}.`,
        `${nombre(exemple)} convient (il y en a beaucoup d'autres).`,
      ],
      svg: chiffres(String(exemple), { somme: true, total: s }),
    },
  });
}

function nc17e(r) {
  // Multiple de 3 (ou de 9) de 102 à 999 ; une phrase juste (la somme) ; deux phrases fausses tirées
  // parmi de vraies erreurs d'élèves, chacune vraie mais sans rapport avec le critère.
  const k = r.pick([3, 3, 9]);
  let n, pieges;
  do {
    n = r.int(Math.ceil(102 / k), Math.floor(999 / k)) * k;
    const [d0, d1, u] = [...String(n)].map(Number);
    const dansTable = (c) => c > 0 && c % k === 0;
    pieges = [];
    if (u % 2 === 0)
      pieges.push({
        texte: `Son chiffre des unités, ${u}, est pair.`,
        phrase: `Être pair prouve « divisible par 2 », pas par ${k}.`,
      });
    if (dansTable(u))
      pieges.push({
        texte: `Son chiffre des unités, ${u}, est dans la table de ${k}.`,
        phrase: "Le chiffre des unités ne décide que pour 2, 5 et 10.",
      });
    if (dansTable(d1))
      pieges.push({
        texte: `Il contient le chiffre ${d1}, qui est dans la table de ${k}.`,
        phrase: `Pour ${k}, on utilise tous les chiffres.`,
      });
    if (dansTable(d0))
      pieges.push({
        texte: `Son premier chiffre, ${d0}, est dans la table de ${k}.`,
        phrase: `Pour ${k}, on utilise tous les chiffres.`,
      });
  } while (pieges.length < 2);
  const s = somme(n);
  const juste = `${plus(n)} = ${s}, et ${s} est dans la table de ${k}.`;
  const deux = melanger(r, pieges).slice(0, 2);
  const choix = melanger(r, [juste, ...deux.map((p) => p.texte)]);
  return question("NC17", 4, {
    pastille: "Critères de divisibilité",
    prompt: `Quelle phrase prouve que ${n} est divisible par ${k} ?`,
    fields: [champ(juste, "Choisis une phrase", "text", { options: choix, colonne: true })],
    check: { type: "text", values: [juste] },
    aide: { svg: criteres(String(n)), text: `Pour ${k}, on utilise tous les chiffres.` },
    indice: { text: "Quelle phrase parle de la somme des chiffres ?" },
    bonne: juste,
    erreurs: deux.map((p) => ({ reponse: p.texte, phrase: p.phrase })),
    explication: {
      etapes: [
        `Pour ${k}, le critère est la somme des chiffres.`,
        `${plus(n)} = ${s} = ${k} × ${s / k}.`,
        "Le chiffre des unités ne décide que pour 2, 5 et 10.",
      ],
    },
  });
}

function nc17f(r) {
  // Quatre nombres de 3 chiffres, un seul multiple de 3 ; un piège finit par 3 ou 9 sans l'être.
  const bon = r.int(34, 333) * 3;
  let piege;
  do piege = r.int(10, 99) * 10 + r.pick([3, 9]);
  while (piege % 3 === 0);
  const autres = [];
  while (autres.length < 2) {
    const x = r.int(100, 999);
    if (x % 3 !== 0 && ![bon, piege, ...autres].includes(x)) autres.push(x);
  }
  const choix = melanger(r, [bon, piege, ...autres]).map(String);
  return question("NC17", 5, {
    pastille: "Critères de divisibilité",
    prompt: "Lequel de ces nombres est divisible par 3 ?",
    fields: [champ(bon, "Choisis une réponse", "text", { options: choix })],
    check: { type: "text", values: [String(bon)] },
    aide: {
      svg: chiffres(String(piege), { somme: true }),
      text: "Pour chaque nombre : la somme de ses chiffres.",
    },
    indice: {
      text: `${plus(piege)} = ${somme(piege)} : pas dans la table de 3. Fais pareil pour les autres.`,
    },
    bonne: `${bon} : ${plus(bon)} = ${somme(bon)}`,
    erreurs: [piege, ...autres].map((x) => ({
      reponse: String(x),
      phrase:
        x === piege
          ? `${x} finit par ${x % 10}, mais ${plus(x)} = ${somme(x)} : pas dans la table de 3.`
          : `${plus(x)} = ${somme(x)} : pas dans la table de 3.`,
    })),
    explication: {
      etapes: [
        `${choix.map((x) => `${x} : ${plus(x)} = ${somme(x)}`).join(" · ")}.`,
        `Seul ${somme(bon)} est dans la table de 3.`,
        `${bon} est divisible par 3.`,
      ],
      svg: chiffres(String(piege), { somme: true, total: somme(piege) }),
    },
  });
}

/* =================================================================== NC18 */
function nc18a(r) {
  const n = r.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 48]);
  const ds = diviseurs(n);
  const petits = ds.filter((d) => d * d <= n);
  const dernier = petits.at(-1);
  const suivant = ds.find((d) => d > dernier);
  const nonDiviseurs = [];
  for (let d = 2; d < suivant; d++) if (n % d) nonDiviseurs.push(d);
  const premierBarre = [2, 3, 4, 5].find((d) => n % d);
  const lignesAide = (barre) =>
    [1, 2, 3, 4, 5].map((d) => [d, d === 1 ? n : null, barre && d === premierBarre]);
  const etapes = [`${n} = ${petits.map((d) => `${d} × ${n / d}`).join(" = ")}.`];
  if (nonDiviseurs.length)
    etapes.push(`${nonDiviseurs.join(", ")} : la division ne tombe pas juste.`);
  etapes.push(
    `Après ${dernier} × ${n / dernier}, la paire suivante serait ${suivant} × ${n / suivant} : j'ai fini.`,
  );
  return question("NC18", 0, {
    pastille: "Diviseurs",
    prompt: `Écris tous les diviseurs de ${n}.`,
    gabarit: "[0]",
    touches: [";"],
    fields: [champ(ds.join(" ; "), "Diviseurs, séparés par ;", "text", { large: true })],
    check: { type: "set", values: ds.map(String), number: n, manquants: true },
    aide: { svg: pairesBarre(n, lignesAide(false)), text: "" },
    indice: {
      svg: pairesBarre(n, lignesAide(true)),
      text: "Continue jusqu'à ce que les paires se répètent.",
    },
    bonne: ds.join(" ; "),
    explication: {
      etapes,
      svg: pairesBarre(
        n,
        Array.from({ length: dernier }, (_, i) => i + 1).map((d) => [
          d,
          n % d ? null : n / d,
          n % d !== 0,
        ]),
        "les deux nombres de chaque paire sont des diviseurs",
      ),
    },
  });
}

function nc18b(r) {
  // De 100 à 500, jamais premier, avec au moins un diviseur parmi 2, 3, 5, 9, 10.
  let n;
  do n = r.int(100, 500);
  while (premier(n) || (n % 2 && n % 3 && n % 5));
  const u = n % 10;
  const d = n % 3 === 0 ? 3 : n % 2 === 0 ? 2 : 5;
  const autres = diviseurs(n).filter((x) => ![1, n, d].includes(x));
  const listeAutres = autres.length <= 3 ? ou(autres) : `${autres.slice(0, 3).join(", ")}…`;
  const [indice, premiere] =
    d === 3
      ? [
          `${plus(n)} = ${somme(n)} : regarde la table de 3.`,
          `${plus(n)} = ${somme(n)}, dans la table de 3.`,
        ]
      : d === 2
        ? [
            `Le chiffre des unités, ${u}, est pair : regarde la table de 2.`,
            `Le chiffre des unités, ${u}, est pair.`,
          ]
        : [
            `Le chiffre des unités est ${u} : regarde la table de 5.`,
            `Le chiffre des unités est ${u}.`,
          ];
  return question("NC18", 1, {
    pastille: "Diviseurs",
    prompt: `Donne un diviseur de ${n}, autre que 1 et ${n}.`,
    gabarit: "[0]",
    fields: [champ(d, "Diviseur")],
    check: { type: "property", rule: "divisor", number: n, exclude: [1, n], reste: true },
    aide: {
      svg: criteres(String(n)),
      text: "Les critères de divisibilité aident à trouver un diviseur.",
    },
    indice: { text: indice },
    bonne: `${d} (${n} = ${d} × ${n / d})${autres.length ? ` — ${listeAutres} aussi` : ""}`,
    explication: {
      etapes: [
        premiere,
        `${n} = ${d} × ${n / d}.`,
        `${d} est un diviseur de ${n} (${n / d} aussi).`,
      ],
      svg: criteres(String(n)),
    },
  });
}

const puissances = (liste) => {
  const sup = (e) => String(e).replace(/\d/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]);
  const uniques = [...new Set(liste)];
  return uniques
    .map((p) => {
      const e = liste.filter((x) => x === p).length;
      return e > 1 ? `${p}${sup(e)}` : String(p);
    })
    .join(" × ");
};

function nc18c(r) {
  // De 12 à 500, produit de 2 à 5 facteurs premiers pris parmi 2, 3, 5, 7, 11, 13 ; au moins un 2,
  // un 3 ou un 5 (l'aide dit « je commence par 2, 3 ou 5 »).
  let fs, n;
  do {
    fs = Array.from({ length: r.int(2, 5) }, () => r.pick([2, 2, 3, 3, 5, 7, 11, 13])).sort(
      (a, b) => a - b,
    );
    n = fs.reduce((p, x) => p * x, 1);
  } while (n < 12 || n > 500 || !fs.some((p) => p <= 5));
  const p = fs[0];
  const q = n / p;
  // L'explication : un facteur premier de plus à chaque ligne, les « = » les uns sous les autres.
  const calc = [];
  for (let i = 1; i < fs.length; i++) {
    const resteProduit = fs.slice(i).reduce((a, b) => a * b, 1);
    calc.push([i === 1 ? String(n) : "", `= ${[...fs.slice(0, i), resteProduit].join(" × ")}`]);
  }
  if (new Set(fs).size < fs.length) calc.push(["", `= ${puissances(fs)}`]);
  const uniques = [...new Set(fs)];
  return question("NC18", 2, {
    pastille: "Facteurs premiers",
    prompt: `Décompose ${n} en produit de facteurs premiers.`,
    gabarit: `${n} = [0]`,
    touches: ["×", "²"],
    fields: [champ(fs.join(" × "), "Produit de facteurs premiers", "text", { large: true })],
    check: { type: "property", rule: "primeFactors", number: n },
    aide: {
      svg: arbre(n, null, null, "je commence par 2, 3 ou 5"),
      text: `L'arbre : ${n} = □ × □, puis je continue.`,
    },
    indice: {
      svg: arbre(n, p, q),
      text: premier(q) ? `${q} est premier : c'est fini.` : `${q} n'est pas premier : continue.`,
    },
    bonne: `${n} = ${fs.join(" × ")}`,
    explication: {
      calc,
      etapes: [
        `${et(uniques)} ${uniques.length > 1 ? "sont premiers" : "est premier"} : c'est fini.`,
      ],
    },
  });
}

function nc18d(r) {
  // Diviseur de 2 à 9 ; quotient de 2 à 12 ; reste de 0 au diviseur moins 1 (0 une fois sur cinq).
  const d = r.int(2, 9);
  const q = r.int(2, 12);
  const reste = r.next() < 0.2 ? 0 : r.int(1, d - 1);
  const n = d * q + reste;
  return question("NC18", 3, {
    pastille: "Division euclidienne",
    prompt: `Division euclidienne de ${n} par ${d}.`,
    gabarit: `${n} = ${d} × [0] + [1]`,
    fields: [champ(q, "Quotient"), champ(reste, "Reste")],
    check: { type: "fields", values: [String(q), String(reste)] },
    aide: {
      svg: cases(n, d),
      text: `${n} cases rangées par lignes de ${d} : les lignes pleines, puis ce qui reste.`,
    },
    indice: { text: `${d} × ${q} = ${d * q}. Combien de cases après ${d * q} ?` },
    erreurs: [
      {
        reponse: [String(q - 1), String(reste + d)],
        phrase: `Le reste doit être plus petit que ${d}.`,
      },
    ],
    explication: {
      etapes: [
        `${d} × ${q} = ${d * q} et ${d} × ${q + 1} = ${d * (q + 1)} dépasse ${n}.`,
        `${n} − ${d * q} = ${reste}, et ${reste} < ${d}.`,
        `Quotient ${q}, reste ${reste}.`,
      ],
      svg: cases(n, d),
    },
  });
}

function nc18e(r) {
  // Un premier de 11 à 47 ; le nombre 1 ; un carré impair (25, 49) ; un impair multiple de 3.
  const p = r.pick([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);
  const carre = r.pick([25, 49]);
  const m3 = r.pick([27, 39, 51, 57]);
  const racine = Math.sqrt(carre);
  const choix = melanger(r, [p, 1, carre, m3]).map(String);
  return question("NC18", 4, {
    pastille: "Nombres premiers",
    prompt: "Lequel de ces nombres est premier ?",
    fields: [champ(p, "Choisis une réponse", "text", { options: choix })],
    check: { type: "text", values: [String(p)] },
    aide: {
      svg: premiersGrille(choix.map(Number), [2, 3, 5, 7]),
      text: "Je teste 2, 3, 5, 7 pour chaque nombre.",
    },
    indice: { text: "1 n'a qu'un seul diviseur : il n'est pas premier." },
    bonne: String(p),
    erreurs: [
      { reponse: "1", phrase: "1 n'a qu'un seul diviseur : il n'est pas premier." },
      { reponse: String(carre), phrase: `${carre} = ${racine} × ${racine}.` },
      {
        reponse: String(m3),
        phrase: `${m3} = 3 × ${m3 / 3} (${plus(m3)} = ${somme(m3)}, dans la table de 3).`,
      },
    ],
    explication: {
      etapes: [
        `1 : un seul diviseur. ${m3} = 3 × ${m3 / 3}. ${carre} = ${racine} × ${racine}.`,
        `${p} : ni par 2, ni par 3, ni par 5, ni par 7.`,
        `Je m'arrête à 7 : 11 × 11 = 121 dépasse ${p}. ${p} est premier.`,
      ],
    },
  });
}

function nc18f(r) {
  // Deux nombres jusqu'à 100, fabriqués g × m et g × n : g de 2 à 15 (la réponse), m et n de 2 à 9
  // sans diviseur commun ; jamais l'un multiple de l'autre.
  let g, m, n;
  do {
    g = r.int(2, 15);
    m = r.int(2, 9);
    n = r.int(2, 9);
  } while (m === n || pgcd(m, n) !== 1 || g * m > 100 || g * n > 100);
  const [a, b] = [g * m, g * n];
  const [fa, fb] = [facteurs(a), facteurs(b)];
  const repartition = [facteurs(m), facteurs(g), facteurs(n)];
  const etapes = [
    `${a} = ${fa.join(" × ")} ; ${b} = ${fb.join(" × ")}.`,
    `En commun : ${repartition[1].join(" × ")}.`,
  ];
  if (repartition[1].length > 1) etapes.push(`${repartition[1].join(" × ")} = ${g}.`);
  return question("NC18", 5, {
    pastille: "Diviseur commun",
    prompt: `Quel est le plus grand diviseur commun à ${a} et ${b} ?`,
    gabarit: "[0]",
    fields: [champ(g, "Plus grand diviseur commun")],
    check: { type: "numeric", values: [String(g)] },
    aide: { svg: venn(a, b, fa, fb), text: "Les facteurs communs vont au milieu." },
    indice: { svg: venn(a, b, fa, fb, repartition), text: "Multiplie ceux du milieu." },
    bonne: String(g),
    erreurs: diviseurs(g)
      .filter((c) => c < g)
      .map((c) => ({
        reponse: String(c),
        phrase: `${c} divise bien ${a} et ${b}, mais il y en a un plus grand.`,
      })),
    explication: { etapes, svg: venn(a, b, fa, fb, repartition) },
  });
}

function nc18g(r) {
  // Deux nombres de 2 à 15, plus petit multiple commun au plus 120 ; jamais l'un multiple de l'autre.
  let a, b, L;
  do {
    a = r.int(2, 15);
    b = r.int(2, 15);
    L = (a * b) / pgcd(a, b);
  } while (a === b || a % b === 0 || b % a === 0 || L > 120);
  const g = pgcd(a, b);
  const [fa, fb] = [facteurs(a), facteurs(b)];
  const repartition = [facteurs(a / g), facteurs(g), facteurs(b / g)];
  // L'aide : les bonds de a au-dessus, de b au-dessous, jusqu'au dernier AVANT le point commun
  // (au plus 3 de chaque) ; la droite va un peu plus loin que ce point quand il tient (≤ 50).
  const na = Math.min(L / a - 1, 3);
  const nb = Math.min(L / b - 1, 3);
  const loin = Math.max(na * a, nb * b);
  const R = L <= 50 ? Math.ceil((L + 1) / 10) * 10 : Math.ceil((loin + 1) / 10) * 10;
  const ticks = Array.from({ length: R / 10 + 1 }, (_, i) => i * 10);
  const sauts = [
    ...Array.from({ length: na }, (_, i) => [i * a, (i + 1) * a, "", VERT, 1]),
    ...Array.from({ length: nb }, (_, i) => [i * b, (i + 1) * b, "", INC_TEXTE, -1]),
  ];
  const pas = R <= 50 ? 1 : 5;
  const multiples = (x) => {
    const liste = Array.from({ length: L / x }, (_, i) => (i + 1) * x);
    return liste.length > 6
      ? `${liste.slice(0, 3).join(", ")}, …, ${liste.slice(-2).join(", ")}`
      : liste.join(", ");
  };
  const fausses = new Set([2 * L]);
  for (let k = 3; k * L <= a * b; k++) fausses.add(k * L);
  if (a * b !== L) fausses.add(a * b);
  return question("NC18", 6, {
    pastille: "Multiple commun",
    prompt: `Quel est le plus petit multiple commun à ${a} et ${b} ?`,
    gabarit: "[0]",
    fields: [champ(L, "Plus petit multiple commun")],
    check: { type: "numeric", values: [String(L)] },
    aide: {
      svg: droite(0, R, ticks, Object.fromEntries(ticks.map((v) => [v, String(v)])), {
        sauts,
        petits: Array.from({ length: R / pas + 1 }, (_, i) => i * pas),
        W: 340,
      }),
      text: `Bonds de ${a} au-dessus, bonds de ${b} au-dessous : où tombent-ils ensemble ?`,
    },
    indice: {
      svg: venn(a, b, fa, fb, repartition),
      text: "Je prends tous les facteurs, une seule fois ceux du milieu.",
    },
    bonne: String(L),
    erreurs: [...fausses].map((x) => ({
      reponse: String(x),
      phrase: `${x} est un multiple commun, mais il y en a un plus petit.`,
    })),
    explication: {
      etapes: [
        `Multiples de ${a} : ${multiples(a)}.`,
        `Multiples de ${b} : ${multiples(b)}.`,
        `Le premier qui est dans les deux : ${L}.`,
      ],
      svg: venn(a, b, fa, fb, repartition),
    },
  });
}

const NC17 = [nc17a, nc17b, nc17c, nc17d, nc17e, nc17f];
const NC18 = [nc18a, nc18b, nc18c, nc18d, nc18e, nc18f, nc18g];

export const generators = {
  NC17: (r, v = 0) => NC17[v](r),
  NC18: (r, v = 0) => NC18[v](r),
};
