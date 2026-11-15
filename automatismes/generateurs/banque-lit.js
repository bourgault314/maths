/* La banque du calcul littéral de 3e (passe 1, lot B1, 15/11/2026).
   Des questions SANS aide ni cours (la passe 2 les écrira, leçon par leçon) : le tirage, la bonne
   réponse et les ERREURS ATTENDUES calculées (2 ou 3), qui servent aux deux formats :
   - réponse tapée : quand l'élève tape une de ces erreurs, l'appli la nomme (champ erreurs) ;
   - QCM : les mauvaises réponses proposées sont ces erreurs (versionQcm).
   Une famille = un savoir-faire ; tout varie à l'intérieur (nombres, lettre, signes, nombre de termes),
   avec un niveau 1-2-3 (genererBanque) plutôt qu'une question de plus. Tous les calculs sont faits
   sur des entiers. Les questions qui sont un choix par nature (somme ou produit ?, oui ou non ?) sont
   des QCM d'office. */
import { polynomial } from "../core.js";
import { typo } from "./cahier.js";
import { svg, line, text } from "./draw.js";

export const formesBanque = ["NC19-f", "NC19-g", "NC19-h", "NC20-g", "NC20-h", "NC21-g", "NC23-e"];

const M = "−";
const LETTRES = ["x", "a", "b", "n", "t", "y"];
const melanger = (r, liste) => {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
};

/* Un terme { c, p } (coefficient entier, puissance 0, 1 ou 2) écrit avec sa lettre ; dans une somme,
   le signe du terme devient l'opération (« − 4x »). */
const corps = (c, p, l) =>
  p === 0
    ? String(Math.abs(c))
    : `${Math.abs(c) === 1 ? "" : Math.abs(c)}${l}${p === 2 ? "²" : ""}`;
export function somme(termes, l = "x") {
  const gardes = termes.filter((t) => t.c !== 0);
  if (!gardes.length) return "0";
  return gardes
    .map((t, i) =>
      i === 0
        ? `${t.c < 0 ? M : ""}${corps(t.c, t.p, l)}`
        : ` ${t.c < 0 ? M : "+"} ${corps(t.c, t.p, l)}`,
    )
    .join("");
}
const oppose = (termes) => termes.map((t) => ({ ...t, c: -t.c }));

/* La valeur d'une expression écrite (pour écarter une erreur égale à la bonne réponse) : on la
   compare par ses coefficients, comme le correcteur. */
function memeValeur(a, b) {
  try {
    const p = polynomial(String(a).replace(/[a-z]/g, "x"));
    const q = polynomial(String(b).replace(/[a-z]/g, "x"));
    return Array.from({ length: Math.max(p.length, q.length) }, (_, i) => p[i] || 0).every(
      (v, i) => Math.abs(v - (q[i] || 0)) < 1e-9,
    );
  } catch {
    return false;
  }
}
// Les erreurs gardées : différentes de la bonne réponse et entre elles, au plus trois.
function erreursValides(bonne, liste, expression = true) {
  const gardees = [];
  for (const erreur of liste) {
    if (!erreur?.reponse) continue;
    const egal = (a, b) => (expression ? memeValeur(a, b) : String(a) === String(b));
    if (egal(erreur.reponse, bonne) || gardees.some((g) => egal(g.reponse, erreur.reponse)))
      continue;
    gardees.push({ reponse: erreur.reponse, phrase: typo(erreur.phrase) });
  }
  return gardees.slice(0, 3);
}

/* La question de la banque, dans la forme du moule (moteur.js, core.js). hints vide : la coque dit
   « Aide à venir ». solution : l'égalité complète ou la phrase de la bonne réponse (le moule en exige
   une ; pas d'autre explication avant la passe 2). */
function questionBanque(id, d) {
  const [famille, forme] = id.split("-");
  const v = forme.charCodeAt(0) - 97;
  return {
    family: famille,
    variant: `${famille}-${String.fromCharCode(65 + v)}`,
    grade: d.grade || 3,
    dnb: true,
    prompt: typo(d.prompt),
    math: d.math || "",
    fields: d.fields,
    check: d.check,
    hints: [],
    solution: typo(d.solution),
    visual: d.visual || "",
    course: { rule: "", example: "", svg: "" },
    tags: [],
    banque: true,
    niveau: d.niveau,
    formats: d.qcm ? ["qcm"] : ["tapee", "qcm"],
    gabarit: d.gabarit || null,
    touches: d.touches || null,
    bonne: typo(d.bonne),
    erreurs: d.erreurs,
    ...(d.enQcm ? { enQcm: { prompt: typo(d.enQcm.prompt), math: d.enQcm.math || "" } } : {}),
  };
}

// Une réponse tapée (expression) : la case dans le calcul, « = [0] ».
function tapee(id, d) {
  const touches = ["+", "×", "(", ")", "²", d.lettre];
  return questionBanque(id, {
    ...d,
    gabarit: `${d.expression} = [0]`,
    touches,
    fields: [
      { label: "Réponse", answer: d.reponse, kind: "expression", unit: "", placeholder: "" },
    ],
    check: { type: "expression", values: [d.reponse], form: "simple" },
    bonne: `${d.expression} = ${d.reponse}`,
    solution: `${d.expression} = ${d.reponse}.`,
    erreurs: erreursValides(d.reponse, d.erreurs),
    enQcm: { prompt: d.promptQcm, math: d.expression },
  });
}

// Un choix par nature : les propositions, la bonne, et la phrase de chaque mauvaise.
function choix(id, d) {
  return questionBanque(id, {
    ...d,
    qcm: true,
    fields: [
      {
        label: "Choisis",
        answer: d.reponse,
        kind: "text",
        unit: "",
        placeholder: "",
        options: d.options,
        // Des égalités ou des phrases : une proposition par ligne, toutes à la même taille.
        ...(d.colonne ? { colonne: true } : {}),
      },
    ],
    check: { type: "text", values: [d.reponse] },
    bonne: d.bonne,
    solution: d.bonne,
    erreurs: erreursValides(
      d.reponse,
      Object.entries(d.phrases).map(([reponse, phrase]) => ({ reponse, phrase })),
      false,
    ),
  });
}

/* ───────────── NC19-f — Écrire en fonction de n : double, triple, moitié, successeur… ───────────── */
const MOTS = {
  double: { e: (u) => `2${u}`, p: 1 },
  triple: { e: (u) => `3${u}`, p: 1 },
  moitie: { e: (u) => `${u}/2`, p: 1 },
  successeur: { e: (u) => `${u} + 1`, p: 0 },
  predecesseur: { e: (u) => `${u} ${M} 1`, p: 0 },
  carre: { e: (u) => `${u}²`, p: 2 },
};
const NOMS = {
  double: "le double",
  triple: "le triple",
  moitie: "la moitié",
  successeur: "le successeur",
  predecesseur: "le prédécesseur",
  carre: "le carré",
};
// « le double de n » ; avec un mot devant un autre : « le double du successeur de n ».
const de = (nom) => (/^le /.test(nom) ? nom.replace(/^le /, "du ") : `de ${nom}`);
// L'expression d'un mot appliqué à une expression : parenthèses si elle est une somme.
function appliquer(mot, u) {
  const somme = /[+−]/.test(u);
  const base = somme ? `(${u})` : u;
  if (mot === "double" || mot === "triple") return MOTS[mot].e(somme ? base : u);
  if (mot === "moitie") return `${base}/2`;
  if (mot === "carre") return /^[a-z]$/.test(u) ? `${u}²` : `(${u})²`;
  return MOTS[mot].e(u);
}
function nc19f(r, niveau) {
  const l = r.pick(["n", "x", "a", "t"]);
  if (niveau === 1) {
    const mot = r.pick(Object.keys(MOTS));
    const reponse = MOTS[mot].e(l);
    const pieges = {
      double: [
        [`${l}²`, `Le double, c'est 2 fois le nombre : 2${l}. ${l}² est le carré de ${l}.`],
        [`${l} + 2`, `Le double, c'est 2 fois le nombre, pas le nombre plus 2.`],
      ],
      triple: [
        [`${l} + 3`, `Le triple, c'est 3 fois le nombre, pas le nombre plus 3.`],
        [`${l}/3`, `${l}/3 est le tiers de ${l} ; le triple, c'est 3${l}.`],
      ],
      moitie: [
        [`2${l}`, `2${l} est le double de ${l} ; la moitié, c'est ${l} divisé par 2.`],
        [`${l} ${M} 2`, `La moitié, c'est ${l} divisé par 2, pas ${l} moins 2.`],
      ],
      successeur: [
        [`${l} ${M} 1`, `${l} ${M} 1 vient avant ${l} : c'est le prédécesseur.`],
        [`2${l}`, `Le successeur, c'est le nombre qui suit : on ajoute 1.`],
      ],
      predecesseur: [
        [`${l} + 1`, `${l} + 1 vient après ${l} : c'est le successeur.`],
        [`${l}/2`, `Le prédécesseur, c'est le nombre qui précède : on enlève 1.`],
      ],
      carre: [
        [`2${l}`, `2${l} est le double de ${l} ; le carré, c'est ${l} × ${l} = ${l}².`],
        [`${l} + 2`, `Le carré, c'est ${l} × ${l} = ${l}².`],
      ],
    }[mot];
    return tapeeMots(r, l, `${NOMS[mot]} de ${l}`, reponse, pieges, niveau);
  }
  // Deux mots : l'ordre compte (« le double du successeur » ≠ « le successeur du double »).
  const paires =
    niveau === 2
      ? [
          ["double", "successeur"],
          ["successeur", "double"],
          ["triple", "predecesseur"],
          ["predecesseur", "triple"],
          ["moitie", "successeur"],
          ["successeur", "moitie"],
        ]
      : [
          ["carre", "successeur"],
          ["successeur", "carre"],
          ["double", "carre"],
          ["carre", "double"],
          ["carre", "predecesseur"],
          ["predecesseur", "carre"],
        ];
  const [exterieur, interieur] = r.pick(paires);
  const reponse = appliquer(exterieur, MOTS[interieur].e(l));
  const inverse = appliquer(interieur, MOTS[exterieur].e(l));
  const sansParentheses = reponse.replace(/[()]/g, "");
  const pieges = [
    [
      inverse,
      `${inverse}, c'est ${NOMS[interieur]} ${de(NOMS[exterieur])} de ${l} : l'ordre des mots est inversé.`,
    ],
    [
      sansParentheses,
      `On prend ${NOMS[exterieur]} de TOUT ${MOTS[interieur].e(l)} : il faut des parenthèses.`,
    ],
  ];
  // Un mot pris pour un autre (successeur ↔ prédécesseur, double ↔ carré, triple ↔ double, moitié ↔ double).
  const CONFONDU = {
    successeur: "predecesseur",
    predecesseur: "successeur",
    double: "carre",
    carre: "double",
    triple: "double",
    moitie: "double",
  };
  const confondu = appliquer(CONFONDU[exterieur], MOTS[interieur].e(l));
  pieges.push([
    confondu,
    `${confondu}, c'est ${NOMS[CONFONDU[exterieur]]} ${de(NOMS[interieur])} de ${l}, pas ${NOMS[exterieur]}.`,
  ]);
  return tapeeMots(
    r,
    l,
    `${NOMS[exterieur]} ${de(NOMS[interieur])} de ${l}`,
    reponse,
    pieges,
    niveau,
  );
}
function tapeeMots(r, l, mots, reponse, pieges, niveau) {
  return questionBanque("NC19-f", {
    niveau,
    grade: 5,
    prompt: `Écris en fonction de ${l} : ${mots}.`,
    touches: ["+", "×", "(", ")", "²", l],
    fields: [{ label: "Réponse", answer: reponse, kind: "expression", unit: "", placeholder: "" }],
    check: { type: "expression", values: [reponse] },
    bonne: `${mots[0].toUpperCase()}${mots.slice(1)} : ${reponse}`,
    solution: `${mots[0].toUpperCase()}${mots.slice(1)} s'écrit ${reponse}.`,
    erreurs: erreursValides(
      reponse,
      pieges.map(([rep, phrase]) => ({ reponse: rep, phrase })),
    ),
    enQcm: { prompt: `Quelle expression est ${mots} ?`, math: "" },
  });
}

/* ───────────── NC19-g — Somme ou produit ? (la nature d'une expression) ─────────────
   Niveau 1 : expressions numériques ; 2 : littérales ; 3 : carré d'une somme ou somme de carrés
   (famille 3e-13-F1 regroupée ici : c'est la même tâche, reconnaître la dernière opération). */
const SOMME = "Une somme";
const PRODUIT = "Un produit";
const CARRE_SOMME = "Le carré d'une somme";
const SOMME_CARRES = "Une somme de deux carrés";
function nc19g(r, niveau) {
  const a = r.int(2, 9),
    b = r.int(2, 9),
    c = r.int(2, 9),
    d = r.int(2, 9);
  if (niveau === 3) {
    const l = r.pick(["x", "a", "y"]);
    const k = r.pick([1, 2, 3, 5]);
    const t = k === 1 ? l : `${k}${l}`;
    const carre = r.bool();
    const forme = r.int(0, 2);
    // carré d'une somme : (t + b)² ; somme de carrés : t² + b², écrite de trois façons.
    const expression = carre
      ? r.bool()
        ? `(${t} + ${b})²`
        : `(${b} + ${t})²`
      : [
          `${k === 1 ? l : `(${t})`}² + ${b}²`,
          `${k === 1 ? `${l}²` : `${k * k}${l}²`} + ${b * b}`,
          `${b * b} + ${k === 1 ? `${l}²` : `${k * k}${l}²`}`,
        ][forme];
    const reponse = carre ? CARRE_SOMME : SOMME_CARRES;
    return choix("NC19-g", {
      niveau,
      prompt: "Cette expression est-elle le carré d'une somme ou une somme de deux carrés ?",
      math: expression,
      reponse,
      options: [CARRE_SOMME, SOMME_CARRES],
      bonne: `${expression} est ${reponse.toLowerCase()}.`,
      phrases: carre
        ? {
            [SOMME_CARRES]:
              "La somme est entre parenthèses : on la calcule d'abord, puis on l'élève au carré.",
          }
        : {
            [CARRE_SOMME]:
              forme === 0
                ? "Il n'y a pas de parenthèses autour de la somme : on calcule les deux carrés, puis on additionne."
                : `${k === 1 ? `${l}²` : `${k * k}${l}² = (${t})²`} et ${b * b} = ${b}² : on additionne deux carrés.`,
          },
    });
  }
  // Les modèles : [expression, nature, ce qui se calcule en dernier].
  const l = r.pick(["x", "a", "y", "n"]);
  const modeles =
    niveau === 1
      ? [
          [`${a} × ${b} + ${c}`, SOMME],
          [`${a} + ${b} × ${c}`, SOMME],
          [`${a} × ${b} + ${c} × ${d}`, SOMME],
          [`${a} × (${b} + ${c}) + ${d}`, SOMME],
          [`${a}(${b} + ${c})`, PRODUIT],
          [`(${a} + ${b}) × ${c}`, PRODUIT],
          [`(${a} + ${b})(${c} + ${d})`, PRODUIT],
          [`${a} × ${b} × (${c} + ${d})`, PRODUIT],
        ]
      : [
          [`${a}${l} + ${b}`, SOMME],
          [`${a} + ${b}${l}`, SOMME],
          [`${a}(${l} + ${b}) + ${c}`, SOMME],
          [`${a} + ${b}(${l} ${M} ${c})`, SOMME],
          [`${a}(${l} + ${b})`, PRODUIT],
          [`(${l} + ${b}) × ${a}`, PRODUIT],
          [`(${l} + ${a})(${l} ${M} ${b})`, PRODUIT],
          [`${l}(${l} + ${a})`, PRODUIT],
        ];
  const [expression, reponse] = r.pick(modeles);
  return choix("NC19-g", {
    niveau,
    grade: 5,
    prompt: "Cette expression est-elle une somme ou un produit ?",
    math: expression,
    reponse,
    options: [SOMME, PRODUIT],
    bonne: `${expression} est ${reponse === SOMME ? "une somme" : "un produit"}.`,
    phrases:
      reponse === SOMME
        ? {
            [PRODUIT]: `On calcule d'abord ${/[()]/.test(expression) ? "les parenthèses et les produits" : "les produits"} ; le dernier calcul est l'addition.`,
          }
        : {
            [SOMME]: `On calcule d'abord ce qui est entre parenthèses ; le dernier calcul est la multiplication.`,
          },
  });
}

/* ───────────── NC19-h — Écrire sans le signe × (conventions d'écriture) ─────────────
   Les 0 et les 1 (famille 3e-11-F1) sont regroupés ici : c'est la même tâche, écrire le plus
   simplement possible. */
function nc19h(r, niveau) {
  const l = r.pick(LETTRES);
  const k = r.int(2, 9),
    m = r.int(2, 9),
    n = r.int(2, 9);
  const P = (s) => `${l}${s === 2 ? "²" : ""}`;
  let cas;
  if (niveau === 1)
    cas = r.pick([
      [
        `${k} × ${l}`,
        `${k}${l}`,
        [[`${k} + ${l}`, `${k} × ${l}, c'est ${k} fois ${l} : on écrit ${k}${l}.`]],
      ],
      [
        `${l} × ${k}`,
        `${k}${l}`,
        [[`${l} + ${k}`, `${l} × ${k}, c'est ${k} fois ${l} : on écrit ${k}${l}.`]],
      ],
      [
        `${l} + ${l}`,
        `2${l}`,
        [[`${l}²`, `${l} + ${l}, c'est 2 fois ${l} : 2${l}. ${l}² = ${l} × ${l}.`]],
      ],
      [`${l} × ${l}`, `${l}²`, [[`2${l}`, `${l} × ${l} = ${l}² ; 2${l}, c'est ${l} + ${l}.`]]],
      [`1 × ${l}`, l, [[`1`, `Multiplier par 1 ne change pas le nombre : 1 × ${l} = ${l}.`]]],
      [`${l} × 1`, l, [[`1`, `Multiplier par 1 ne change pas le nombre : ${l} × 1 = ${l}.`]]],
      [`0 × ${l}`, "0", [[l, `Multiplier par 0 donne 0, quel que soit ${l}.`]]],
      [`0 + ${l}`, l, [["0", `Ajouter 0 ne change pas le nombre : 0 + ${l} = ${l}.`]]],
    ]);
  else if (niveau === 2)
    cas = r.pick([
      [
        `${k} + ${m} × ${l}`,
        `${k} + ${m}${l}`,
        [
          [
            `${k + m}${l}`,
            `On ne peut pas ajouter ${k} et ${m}${l} : ${m} × ${l} s'écrit ${m}${l}, le ${k} reste seul.`,
          ],
        ],
      ],
      [
        `${l} × ${l} + ${k}`,
        `${P(2)} + ${k}`,
        [[`2${l} + ${k}`, `${l} × ${l} = ${l}², pas 2${l}.`]],
      ],
      [
        `${l} × ${k} ${M} ${m}`,
        `${k}${l} ${M} ${m}`,
        [
          ...(Math.abs(k - m) > 1
            ? [
                [
                  somme([{ c: k - m, p: 1 }], l),
                  `${k}${l} et ${m} ne se regroupent pas : ${l} × ${k} s'écrit ${k}${l}.`,
                ],
              ]
            : []),
          [
            somme(
              [
                { c: 1, p: 1 },
                { c: k - m, p: 0 },
              ],
              l,
            ),
            `${l} × ${k}, c'est ${k} fois ${l} : on écrit ${k}${l}.`,
          ],
        ],
      ],
      [
        `${k} × ${l} × ${l}`,
        `${k}${P(2)}`,
        [[`${2 * k}${l}`, `${l} × ${l} = ${l}² : ${k} × ${l} × ${l} = ${k}${l}².`]],
      ],
      [
        `1 × ${l} + 0`,
        l,
        [
          ["1", `1 × ${l} = ${l} ; ajouter 0 ne change rien.`],
          [`${l} + 1`, `On n'ajoute pas 1 : 1 × ${l} = ${l}.`],
        ],
      ],
      [
        `${l} + ${l} + ${k}`,
        `2${l} + ${k}`,
        [
          [`${P(2)} + ${k}`, `${l} + ${l} = 2${l} ; ${l}², c'est ${l} × ${l}.`],
          [`${k + 2}${l}`, `2${l} et ${k} ne se regroupent pas.`],
        ],
      ],
    ]);
  else
    cas = r.pick([
      // Positionnement 4e Q6 : a × a + a × 3 + 7.
      [
        `${l} × ${l} + ${l} × ${k} + ${m}`,
        `${P(2)} + ${k}${l} + ${m}`,
        [
          [
            `${P(2)} + ${k + m}${l}`,
            `${k}${l} et ${m} ne se regroupent pas : ${l} × ${k} s'écrit ${k}${l}.`,
          ],
          [
            `${1 + k + m}${l}`,
            `${l}², ${k}${l} et ${m} ne sont pas de même nature : ils ne se regroupent pas.`,
          ],
        ],
      ],
      // Exemples 4e Q2 : 2 + 3 × b + 4 × b × b.
      [
        `${k} + ${m} × ${l} + ${n} × ${l} × ${l}`,
        `${k} + ${m}${l} + ${n}${P(2)}`,
        [
          [
            `${k + m + n}${l}`,
            `${k}, ${m}${l} et ${n}${l}² ne sont pas de même nature : ils ne se regroupent pas.`,
          ],
          [
            `${k} + ${m + n}${P(2)}`,
            `${m}${l} et ${n}${l}² ne se regroupent pas : ${l} et ${l}² ne sont pas de même nature.`,
          ],
          [`${k} + ${m + n}${l}`, `${n} × ${l} × ${l} = ${n}${l}², pas ${n}${l}.`],
        ],
      ],
      [
        `${l} × ${l} + ${l} + ${l}`,
        `${P(2)} + 2${l}`,
        [
          [`2${P(2)}`, `${l} + ${l} = 2${l} ; seul ${l} × ${l} donne ${l}².`],
          [`3${l}`, `${l} × ${l} = ${l}², pas ${l}.`],
        ],
      ],
      [
        `1 × ${l} × ${l} + 0 × ${l}`,
        P(2),
        [
          [`${P(2)} + ${l}`, `0 × ${l} = 0 : ce terme disparaît.`],
          ["0", `1 × ${l} × ${l} = ${l}² ; seul 0 × ${l} donne 0.`],
        ],
      ],
    ]);
  const [expression, reponse, pieges] = cas;
  return tapee("NC19-h", {
    niveau,
    grade: 5,
    lettre: l,
    prompt: "Écris le plus simplement possible.",
    promptQcm: "Quelle est l'écriture la plus simple ?",
    expression,
    reponse,
    erreurs: pieges.map(([rep, phrase]) => ({ reponse: rep, phrase })),
  });
}

/* ───────────── NC20-g — L'opposé d'une expression : −(5 − 4x) = −5 + 4x ───────────── */
function nc20g(r, niveau) {
  const l = r.pick(["x", "a", "y", "t"]);
  const signe = () => (niveau === 1 ? 1 : r.pick([1, -1]));
  let termes;
  if (niveau === 3)
    termes = melanger(r, [
      { c: signe() * r.int(1, 5), p: 2 },
      { c: signe() * r.int(2, 9), p: 1 },
      { c: signe() * r.int(1, 9), p: 0 },
    ]);
  else {
    termes = melanger(r, [
      { c: signe() * r.int(2, 9), p: 1 },
      { c: signe() * r.int(1, 9), p: 0 },
    ]);
    // Au niveau 2, au moins un terme négatif (le cas de −(5 − 4x)).
    if (niveau === 2 && termes.every((t) => t.c > 0)) termes[1] = { ...termes[1], c: -termes[1].c };
  }
  const interieur = somme(termes, l);
  const expression = `${M}(${interieur})`;
  const reponse = somme(oppose(termes), l);
  const premierSeul = somme([{ ...termes[0], c: -termes[0].c }, ...termes.slice(1)], l);
  const toutNegatif = somme(
    termes.map((t) => ({ ...t, c: -Math.abs(t.c) })),
    l,
  );
  const negatif = termes.find((t) => t.c < 0);
  const erreurs = [
    {
      reponse: premierSeul,
      phrase:
        "Le signe − devant la parenthèse change le signe de chaque terme, pas seulement du premier.",
    },
    {
      reponse: interieur,
      phrase:
        "Le signe − devant la parenthèse ne disparaît pas : il change le signe de chaque terme.",
    },
    negatif && {
      reponse: toutNegatif,
      phrase: `L'opposé d'un nombre négatif est positif : ${M}(${M}${corps(negatif.c, negatif.p, l)}) = +${corps(negatif.c, negatif.p, l)}.`,
    },
  ];
  return tapee("NC20-g", {
    niveau,
    grade: 4,
    lettre: l,
    prompt: "Écris sans parenthèses.",
    promptQcm: "Quelle est l'écriture sans parenthèses ?",
    expression,
    reponse,
    erreurs,
  });
}

/* ───────────── NC20-h — Facteur commun ou terme commun ? (peut-on barrer ?) ─────────────
   La fraction est dessinée (trait horizontal, numérateur et dénominateur sans parenthèses). */
function fractionDessin(haut, bas) {
  const taille = 30;
  const largeur = Math.max(haut.length, bas.length) * 15 + 30;
  const w = Math.max(160, largeur + 40);
  const milieu = w / 2;
  return (
    svg(
      text(milieu, 40, haut, taille, "#173e3a", "middle") +
        line(milieu - largeur / 2, 56, milieu + largeur / 2, 56, "#173e3a", 2.5) +
        text(milieu, 92, bas, taille, "#173e3a", "middle"),
      w,
      108,
    )
      .replace('aria-label="Schéma mathématique"', `aria-label="${haut} sur ${bas}"`)
      // Taille naturelle (les chiffres comme ceux du calcul) : le dessin ne s'agrandit pas à la carte.
      .replace("<svg ", `<svg width="${w}" height="108" `)
  );
}
function nc20h(r, niveau) {
  const k = r.int(2, 9);
  // a et b différents entre eux et de k : un seul nombre à barrer, jamais deux fois le même en haut.
  let a = r.int(2, 9),
    b = r.int(2, 9);
  while (a === k) a = r.int(2, 9);
  while (b === a || b === k) b = r.int(2, 9);
  const l = r.pick(["x", "a", "y"]);
  // [numérateur, dénominateur, ce qu'on barre, oui/non, la phrase de l'erreur]
  const oui = (barre) => `${barre} est un facteur en haut et en bas : on peut le barrer.`;
  const modeles =
    niveau === 1
      ? [
          [
            `${k} + ${a}`,
            `${k} + ${b}`,
            String(k),
            false,
            `${k} est un terme d'une somme, pas un facteur : ${k + a}/${k + b} n'est pas égal à ${a}/${b}.`,
          ],
          [`${k} × ${a}`, `${k} × ${b}`, String(k), true, oui(k)],
          [
            `${a} + ${k}`,
            `${k} × ${b}`,
            String(k),
            false,
            `En haut, ${k} est un terme de la somme ${a} + ${k}, pas un facteur.`,
          ],
          [`${a} × ${k}`, `${b} × ${k}`, String(k), true, oui(k)],
        ]
      : niveau === 2
        ? [
            [
              `${l} + ${a}`,
              `${l} + ${b}`,
              l,
              false,
              `${l} est un terme d'une somme, pas un facteur : on ne peut pas le barrer.`,
            ],
            [
              `${a}${l}`,
              `${b}${l}`,
              l,
              true,
              `${a}${l} = ${a} × ${l} et ${b}${l} = ${b} × ${l} : ${l} est un facteur en haut et en bas.`,
            ],
            [
              `${k}${l} + ${a}`,
              `${k}${l}`,
              `${k}${l}`,
              false,
              `En haut, ${k}${l} est un terme de la somme ${k}${l} + ${a}, pas un facteur.`,
            ],
            [`${k} × ${l}`, `${k} × ${a}`, String(k), true, oui(k)],
          ]
        : [
            [
              `${l}³`,
              `${k}${l}²`,
              `${l}²`,
              true,
              `${l}³ = ${l} × ${l}² : ${l}² est un facteur en haut et en bas.`,
            ],
            [
              `${l}² + ${a}`,
              `${l}²`,
              `${l}²`,
              false,
              `En haut, ${l}² est un terme de la somme ${l}² + ${a}, pas un facteur.`,
            ],
            [
              `${l}(${l} + ${a})`,
              `${k}${l}`,
              l,
              true,
              `${l}(${l} + ${a}) = ${l} × (${l} + ${a}) : ${l} est un facteur en haut et en bas.`,
            ],
            [
              `(${l} + ${a})²`,
              `${l} + ${a}`,
              `${l} + ${a}`,
              true,
              `(${l} + ${a})² = (${l} + ${a}) × (${l} + ${a}) : la parenthèse entière est un facteur.`,
            ],
            [
              `${l}² + ${l}`,
              `${k}${l}`,
              l,
              false,
              `En haut, ${l} est un terme de la somme ${l}² + ${l}, pas un facteur.`,
            ],
          ];
  const [haut, bas, barre, possible, phrase] = r.pick(modeles);
  const reponse = possible ? "Oui" : "Non";
  const mot = /[+−]/.test(barre) ? `les deux (${barre})` : `les deux ${barre}`;
  return choix("NC20-h", {
    niveau,
    grade: 3,
    prompt: `Peut-on simplifier ce quotient en barrant ${mot} ?`,
    visual: fractionDessin(haut, bas),
    reponse,
    options: ["Oui", "Non"],
    bonne: possible
      ? `Oui : ${barre} est un facteur en haut et en bas.`
      : `Non : ${barre} n'est pas un facteur.`,
    phrases: { [possible ? "Non" : "Oui"]: phrase },
  });
}

/* ───────────── NC21-g — Équation ou identité ? ─────────────
   Deux égalités vraies pour une même valeur : une seule l'est pour toutes les valeurs. */
function nc21g(r, niveau) {
  const l = r.pick(["x", "a", "t"]);
  const k = r.int(2, 6),
    a = r.int(1, 9);
  let identite, equation, valeur;
  if (niveau === 1) {
    const c1 = r.int(2, 6),
      c2 = r.int(2, 6);
    identite = r.pick([
      `${l} + ${l} = 2${l}`,
      `${c1}${l} + ${c2}${l} = ${c1 + c2}${l}`,
      `${l} × ${l} = ${l}²`,
      `${l} × ${c1} = ${c1}${l}`,
    ]);
    valeur = r.int(1, 6);
    equation = `${k}${l} + ${a} = ${k * valeur + a}`;
  } else if (niveau === 2) {
    // Le piège « x + x = x² » : vraie pour x = 2 (et 0) seulement.
    if (r.bool()) {
      identite = `${l} + ${l} = 2${l}`;
      equation = `${l} + ${l} = ${l}²`;
      valeur = 2;
    } else {
      identite = `${k}(${l} + ${a}) = ${k}${l} + ${k * a}`;
      valeur = r.int(1, 5);
      equation = `${k}(${l} + ${a}) = ${k * (valeur + a)}`;
    }
  } else {
    // Le piège « (x + a)² = x² + a² » : vraie seulement pour x = 0.
    identite = r.pick([
      `(${l} + ${a})² = ${l}² + ${2 * a}${l} + ${a * a}`,
      `(${l} + ${a})(${l} ${M} ${a}) = ${l}² ${M} ${a * a}`,
    ]);
    equation = `(${l} + ${a})² = ${l}² + ${a * a}`;
    valeur = 0;
  }
  // Une autre valeur, pour laquelle l'équation est fausse (la phrase de l'erreur la donne).
  const autre = valeur === 1 ? 2 : 1;
  const egalites = r.bool() ? [identite, equation] : [equation, identite];
  const LES_DEUX = "Les deux";
  return choix("NC21-g", {
    niveau,
    grade: niveau === 3 ? 3 : 4,
    prompt: `Pour ${l} = ${valeur}, ces deux égalités sont vraies. Laquelle est vraie pour toutes les valeurs de ${l} ?`,
    reponse: identite,
    options: [...egalites, LES_DEUX],
    colonne: true,
    bonne: `${identite} est vraie pour toutes les valeurs de ${l}.`,
    phrases: {
      [LES_DEUX]: `Un seul essai ne suffit pas : pour ${l} = ${autre}, ${equation} est fausse.`,
      [equation]: `Cette égalité n'est vraie que pour certaines valeurs : pour ${l} = ${autre}, elle est fausse.`,
    },
  });
}

/* ───────────── NC23-e — Simple, double ou aucune distributivité ? ─────────────
   Les trois écritures avec les mêmes nombres : (2 + 3a)(4a + 1) ; 2 + 3a(4a + 1) ; 2 + 3a × 4a + 1. */
const SIMPLE = "La simple distributivité";
const DOUBLE = "La double distributivité";
const AUCUNE = "Aucune : il n'y a rien à développer";
function nc23e(r, niveau) {
  const l = r.pick(["x", "a", "y"]);
  const p = r.int(1, 9),
    q = r.int(2, 6),
    s = r.int(2, 6),
    t = r.int(1, 9);
  const op = niveau === 1 ? "+" : r.pick(["+", M]);
  const trio = [
    [`(${p} + ${q}${l})(${s}${l} ${op} ${t})`, DOUBLE],
    [`${p} + ${q}${l}(${s}${l} ${op} ${t})`, SIMPLE],
    [`${p} + ${q}${l} × ${s}${l} ${op} ${t}`, AUCUNE],
  ];
  if (niveau === 3)
    trio.push(
      [`${p} ${M} (${q}${l} + ${t})(${l} ${op} ${s})`, DOUBLE],
      [`(${q}${l} ${op} ${t}) × ${s}`, SIMPLE],
    );
  const [expression, reponse] = r.pick(trio);
  const phrases = {
    [DOUBLE]: {
      [SIMPLE]:
        "Deux sommes sont multipliées : chaque terme de la première multiplie chaque terme de la seconde.",
      [AUCUNE]: "Deux sommes entre parenthèses sont multipliées : il faut développer.",
    },
    [SIMPLE]: {
      [DOUBLE]: "Un seul facteur multiplie la parenthèse : c'est la simple distributivité.",
      [AUCUNE]: "Un facteur multiplie une parenthèse : il faut développer.",
    },
    [AUCUNE]: {
      [SIMPLE]: `Il n'y a pas de parenthèses : ${q}${l} × ${s}${l} est un produit de deux termes, il se calcule directement.`,
      [DOUBLE]: `Il n'y a pas de parenthèses : on calcule ${q}${l} × ${s}${l}, puis on réduit.`,
    },
  }[reponse];
  return choix("NC23-e", {
    niveau,
    grade: 3,
    prompt: "Pour développer cette expression, quelle propriété faut-il utiliser ?",
    math: expression,
    reponse,
    options: [SIMPLE, DOUBLE, AUCUNE],
    colonne: true,
    bonne: `${expression} : ${reponse === AUCUNE ? "aucune propriété, il n'y a rien à développer" : reponse.toLowerCase()}.`,
    phrases,
  });
}

const GENERATEURS = {
  "NC19-f": nc19f,
  "NC19-g": nc19g,
  "NC19-h": nc19h,
  "NC20-g": nc20g,
  "NC20-h": nc20h,
  "NC21-g": nc21g,
  "NC23-e": nc23e,
};

/* Une question de la banque. niveau : 1, 2 ou 3 ; sans niveau (série du menu, avant les réglages de
   la série du lot R), il est tiré au hasard. */
export function genererBanque(id, r, niveau) {
  if (!Object.hasOwn(GENERATEURS, id)) throw new RangeError("Forme de la banque inconnue.");
  const n = [1, 2, 3].includes(niveau) ? niveau : r.int(1, 3);
  return GENERATEURS[id](r, n);
}

/* La version QCM d'une question tapée : les propositions sont la bonne réponse et les erreurs
   attendues, mélangées. Une question sans erreur attendue reste tapée. */
export function versionQcm(question, r) {
  if (question.formats?.[0] === "qcm" || !question.erreurs?.length) return question;
  const bonne = question.fields[0].answer;
  const options = melanger(r, [bonne, ...question.erreurs.map((erreur) => erreur.reponse)]);
  return {
    ...question,
    prompt: question.enQcm?.prompt || question.prompt,
    math: question.enQcm?.math || "",
    gabarit: null,
    touches: null,
    fields: [{ label: "Choisis", answer: bonne, kind: "text", unit: "", placeholder: "", options }],
    check: { type: "text", values: [bonne] },
    format: "qcm",
  };
}
