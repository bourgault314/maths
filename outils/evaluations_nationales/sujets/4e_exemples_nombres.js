/* maths&go — « Exemples de questions et de tâches » Eduscol, 4e, fiche « Nombres et calculs » (page « Accompagner les
   élèves en mathématiques – 4e, 3e et 2de »). Source : fiche élève et fiche professeur, licence Etalab 2.0.
   Lot EN8b : la fiche à l'identique (énoncés, réponses dans l'ordre de la fiche élève, figures redessinées), sans jumeau,
   sans calculatrice (la fiche ne l'autorise pas). Les pièges des QCM et de Q1 suivent l'analyse de la fiche professeur,
   réécrite sans mot genré ; les autres sont de maths&go (nonPublie, liste ⚠ dans PIEGES-a-relire-EN8b.md).
   Q3 : fractions tapées au pavé (touche fraction). Q4 : grille oui / non avec l'écriture décimale au pavé. Q5 : sur la
   feuille. Q6 : grille Vrai / Faux, le « car » sur la feuille. Q7 : « Le multiplier par −2 », comme la fiche professeur
   (la fiche élève dit « par 2 » ; décision du 14/11). Q9 : la réponse ici, l'argumentation sur la feuille.
   Eduscol ne publie pas de repères pour ces exemples : pas de groupe au bilan. */
(function (racine) {
  "use strict";
  const { frac, MOINS, svg } = racine.EN;

  const c = (html, juste, erreur, nonPublie) => ({ html, juste: Boolean(juste), erreur: erreur || "", nonPublie: Boolean(nonPublie) });
  const officielle = (contenu) => () => Object.assign({ melange: false, choix: [] }, contenu);
  const NB = " "; // un nombre et son unité ne se séparent jamais
  const p2 = (exposant) => `2<sup>${exposant}</sup>`;
  const f1 = (x) => +x.toFixed(1);

  // ---------- Figures ----------
  // Droite graduée : graduations régulières, des lettres dessus, des nombres (ou des fractions) dessous, une flèche ou non.
  // Deux tailles d'écriture : ordinateur, et plus grosse au téléphone (où la droite est réduite).
  function droite(o) {
    return dessinDroite(o, 17).replace('class="figure"', 'class="figure mot-ordi"') + dessinDroite(o, 25).replace('class="figure"', 'class="figure mot-tel"');
  }
  function dessinDroite({ grads, pas, avant, apres, fleche, lettres, ecrits, fractions, etiquette }, taille) {
    const k = taille / 17;
    const p = pas * (taille > 17 ? 1.05 : 1);
    const x0 = 10 + avant, haut = 10 + taille, y = haut + 14 * k, X = (n) => f1(x0 + n * p);
    const fin = X(grads - 1) + apres;
    let s = `<line x1="10" y1="${y}" x2="${fin}" y2="${y}" stroke="#2b3f52" stroke-width="${f1(2 * k)}"/>`;
    if (fleche) s += `<path d="M${f1(fin + 12 * k)} ${y} L${f1(fin - 2 * k)} ${f1(y - 6.5 * k)} L${f1(fin - 2 * k)} ${f1(y + 6.5 * k)} Z" fill="#2b3f52"/>`;
    for (let n = 0; n < grads; n++) s += `<line x1="${X(n)}" y1="${f1(y - 8 * k)}" x2="${X(n)}" y2="${f1(y + 8 * k)}" stroke="#111" stroke-width="${f1(2 * k)}"/>`;
    for (const [n, t] of lettres) s += `<text x="${X(n)}" y="${f1(y - 13 * k)}" font-size="${taille}" font-weight="700" text-anchor="middle" fill="#0d6e45">${t}</text>`;
    let bas = y + 8 * k;
    for (const [n, t] of ecrits || []) {
      s += `<text x="${X(n)}" y="${f1(y + 14 * k + taille)}" font-size="${taille}" text-anchor="middle" fill="#111">${t}</text>`;
      bas = Math.max(bas, y + 14 * k + taille * 1.25);
    }
    for (const [n, num, den] of fractions || []) {
      const yn = y + 12 * k + taille, yb = yn + 5 * k, yd = yb + 4 * k + taille;
      s += `<text x="${X(n)}" y="${f1(yn)}" font-size="${taille}" text-anchor="middle" fill="#111">${num}</text>` +
        `<line x1="${f1(X(n) - 7 * k)}" y1="${f1(yb)}" x2="${f1(X(n) + 7 * k)}" y2="${f1(yb)}" stroke="#111" stroke-width="${f1(1.4 * k)}"/>` +
        `<text x="${X(n)}" y="${f1(yd)}" font-size="${taille}" text-anchor="middle" fill="#111">${den}</text>`;
      bas = Math.max(bas, yd + taille * 0.3);
    }
    return svg(f1(fin + (fleche ? 14 * k : 0) + 10), f1(bas + 6), s, etiquette, 640);
  }

  // Q2 : six graduations régulières, de 1/4 (1re) à 1/2 (4e) ; A, B, C, D sur les 2e, 3e, 5e et 6e (pas de 1/12).
  const DROITE_Q2 = { quart: 0, demi: 3, lettres: { A: 1, B: 2, C: 4, D: 5 } };
  const figureQ2 = () => droite({
    grads: 6, pas: 78, avant: 30, apres: 46,
    lettres: Object.entries(DROITE_Q2.lettres).map(([l, n]) => [n, l]),
    fractions: [[DROITE_Q2.quart, 1, 4], [DROITE_Q2.demi, 1, 2]],
    etiquette: "Droite graduée régulièrement : 1 quart et 1 demi sont écrits sous la 1re et la 4e graduation ; A, B, C et D sont sur les 2e, 3e, 5e et 6e graduations",
  });

  // Q8 : axe gradué régulièrement (11 graduations, une flèche) ; E sur la 2e (−3,4), D sur la 10e (+1,4) ; C, A, B sur les
  // 3e, 5e et 7e. Huit intervalles pour 4,8 unités : 0,6 par graduation.
  const AXE_Q8 = { E: 1, C: 2, A: 4, B: 6, D: 9, valeurE: -3.4, valeurD: 1.4 };
  const figureQ8 = () => droite({
    grads: 11, pas: 46, avant: 20, apres: 30, fleche: true,
    lettres: ["E", "C", "A", "B", "D"].map((l) => [AXE_Q8[l], l]),
    ecrits: [[AXE_Q8.E, `${MOINS}3,4`], [AXE_Q8.D, "+1,4"]],
    etiquette: "Axe gradué régulièrement : E, C, A, B et D sont sur des graduations ; sous E est écrit −3,4 et sous D, +1,4",
  });

  // Q7 : les deux programmes de calcul, côte à côte, au-dessus des questions (comme sur la fiche).
  const PROGRAMMES = { A: { facteur: -2, ajout: 13, depart: 3 }, B: { enleve: 7, facteur: 3, arrivee: 9 } };
  const programmes = () => `<div class="programmes" role="img" aria-label="Programme A : choisir un nombre, le multiplier par −2, ajouter 13 au résultat. Programme B : choisir un nombre, enlever 7, multiplier le résultat par 3.">
    <div class="prog"><strong>Programme A</strong><ul class="puces"><li>Choisir un nombre</li><li>Le multiplier par ${MOINS}2</li><li>Ajouter 13 au résultat</li></ul></div>
    <div class="prog"><strong>Programme B</strong><ul class="puces"><li>Choisir un nombre</li><li>Enlever 7</li><li>Multiplier le résultat par 3</li></ul></div>
  </div>`;

  // ---------- Questions ----------
  const Q = [];

  Q.push({
    num: 1, domaine: "NB", competence: "Calculer l’écart entre deux températures (nombres relatifs)",
    generer: officielle({
      enonce: `Ce matin, la température la plus basse de la ville X est de 3 °C et la température la plus basse pour la ville Y est de ${MOINS}6 °C. Quelle est la différence entre les températures les plus basses de ces deux villes ?<br><strong>Répondre ci-dessous.</strong>`,
      saisie: { lignes: [{ modele: "□ °C", attendus: [9], pieges: [
        { valeurs: [-3], erreur: `N’associe pas une différence à une soustraction, ou se trompe en calculant 3 − (−6) : soustrait les distances à zéro et garde le signe du plus grand nombre.` },
        { valeurs: [3], erreur: `N’associe pas une différence à une soustraction, ou se trompe en calculant 3 − (−6) : soustrait les distances à zéro.` },
        { valeurs: [-9], nonPublie: true, erreur: `Calcule la différence dans l’autre sens (−6 − 3) : l’écart entre les deux températures est de 9${NB}°C.` },
      ] }] },
    }),
  });

  Q.push({
    num: 2, domaine: "NB", competence: "Repérer une fraction sur une droite graduée",
    generer: officielle({
      enonce: `Quel point a pour abscisse ${frac(5, 12)} sur cette droite graduée ? <strong>Cocher la réponse exacte.</strong>`,
      figure: figureQ2(),
      disposition: "ligne4",
      choix: [
        c("A", false, `Compare mal les fractions ${frac(5, 12)} et ${frac(1, 4)}.`),
        c("B", true),
        c("C", false, `Compare mal les fractions ${frac(5, 12)} et ${frac(1, 2)} : ${frac(5, 12)} est inférieure à ${frac(5, 10)}, donc à ${frac(1, 2)}.`),
        c("D", false, `Compare mal les fractions ${frac(5, 12)} et ${frac(1, 2)} : ${frac(5, 12)} est inférieure à ${frac(5, 10)}, donc à ${frac(1, 2)}.`),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "NB", competence: "Multiplier et soustraire des fractions (nombres relatifs)",
    generer: officielle({
      enonce: "<strong>Calculer et simplifier</strong> le résultat lorsque c’est possible :",
      saisie: { lignes: [
        { modele: `${frac(4, `${MOINS}3`)} × ${frac(`${MOINS}9`, 8)} = □`, fraction: true, attendus: ["3/2"], pieges: [
          { valeurs: ["−3/2"], nonPublie: true, erreur: "Se trompe de signe : le produit de deux nombres négatifs (−36 et −24) est positif." },
          { valeurs: ["32/27"], nonPublie: true, erreur: "Multiplie en croix, comme pour une division : 4 × 8 et (−3) × (−9)." },
        ] },
        { modele: `${frac(2, 5)} ${MOINS} ${frac(3, 4)} = □`, fraction: true, attendus: ["−7/20"], pieges: [
          { valeurs: ["−1"], nonPublie: true, erreur: "Soustrait les numérateurs entre eux et les dénominateurs entre eux." },
          { valeurs: ["−1/20"], nonPublie: true, erreur: "Prend le dénominateur commun 20 sans multiplier les numérateurs." },
          { valeurs: ["7/20"], nonPublie: true, erreur: "Réduit au même dénominateur, puis calcule 15 − 8 au lieu de 8 − 15." },
        ] },
      ] },
    }),
  });

  Q.push({
    num: 4, domaine: "NB", competence: "Reconnaître une fraction qui est un nombre décimal",
    generer: officielle({
      enonce: "Dans chaque cas, dire si la fraction est un nombre décimal. <strong>Cocher la réponse exacte, si oui, donner l’écriture décimale du nombre.</strong>",
      grille: {
        colonnes: ["oui", "non"],
        saisie: { si: 0, modele: "Écriture décimale : □" },
        lignes: [
          { html: `a) ${frac(30, 60)}`, texte: "30/60", juste: 0, attendu: 0.5, nonPublie: true,
            erreurs: ["", `Ne simplifie pas la fraction : ${frac(30, 60)} = ${frac(1, 2)} = 0,5.`],
            pieges: [{ valeurs: [2], erreur: "Divise 60 par 30 au lieu de diviser 30 par 60." }] },
          { html: `b) ${frac(5, 15)}`, texte: "5/15", juste: 1, attendu: null, nonPublie: true,
            erreurs: [`Pense que ${frac(5, 15)} est un nombre décimal : ${frac(5, 15)} = ${frac(1, 3)}, et 1 ÷ 3 = 0,333… ne s’arrête jamais.`, ""] },
          { html: `c) ${frac(34, 20)}`, texte: "34/20", juste: 0, attendu: 1.7, nonPublie: true,
            erreurs: ["", `Ne voit pas que ${frac(34, 20)} = ${frac(17, 10)} : un nombre de dixièmes est un nombre décimal.`],
            pieges: [
              { valeurs: [1.14], erreur: "Écrit le quotient entier puis le reste : 34 = 1 × 20 + 14, donc « 1,14 »." },
              { valeurs: [3.4], erreur: "Divise 34 par 10 au lieu de le diviser par 20." },
            ] },
        ],
      },
    }),
  });

  Q.push({
    num: 5, domaine: "DIV", competence: "Utiliser les diviseurs communs pour faire des partages",
    attendu: "Les répartitions possibles : 1 sachet de 36 croissants et 24 pains au chocolat ; 2 sachets de 18 croissants et 12 pains au chocolat ; 3 sachets de 12 croissants et 8 pains au chocolat ; 4 sachets de 9 croissants et 6 pains au chocolat ; 6 sachets de 6 croissants et 4 pains au chocolat ; 12 sachets de 3 croissants et 2 pains au chocolat.",
    indicateurs: [
      "Utilise un diviseur commun de 36 et de 24 comme nombre de sachets.",
      "Propose plusieurs répartitions correctes.",
    ],
    generer: officielle({
      // La fiche finit par « Répondre ci-dessous. » : ici, on répond sur la feuille.
      enonce: "Camille travaille dans une boulangerie. À la fin de la journée, les invendus sont donnés à des associations pour éviter le gaspillage. Il reste 36 croissants et 24 pains au chocolat. Camille doit les répartir dans des sachets. Le nombre de sachets n’est pas limité mais chaque sachet doit avoir le même contenu. <strong>Quelles sont les répartitions possibles ?</strong>",
      feuille: true,
    }),
  });

  Q.push({
    num: 6, domaine: "PROP", competence: "Comparer des proportions",
    attendu: `Vrai, Vrai. a) La proportion passe de ${frac(14, 25)} = 0,56 à ${frac(15, 27)} ≈ 0,556. b) La proportion passe de ${frac(14, 25)} à ${frac(13, 25)}.`,
    indicateurs: [
      "Exprime chacune des proportions sous forme de fraction.",
      "Compare les fractions.",
    ],
    generer: officielle({
      enonce: "Une classe de 25 élèves comporte 14 filles et 11 garçons.<br><strong>Dire si les affirmations sont vraies ou fausses.</strong><br>La proportion de filles dans la classe varie :",
      preuve: true,
      grille: {
        colonnes: ["Vrai", "Faux"],
        lignes: [
          { html: "a) Si une fille et un garçon arrivent dans la classe ;", texte: "a) Une fille et un garçon arrivent", juste: 0, nonPublie: true,
            erreurs: ["", `Pense qu’en ajoutant autant de filles que de garçons, la proportion ne change pas : ${frac(14, 25)} devient ${frac(15, 27)}, et ces deux fractions ne sont pas égales.`] },
          { html: "b) Si un garçon arrive et une fille quitte la classe.", texte: "b) Un garçon arrive, une fille part", juste: 0, nonPublie: true,
            erreurs: ["", `Pense que la proportion ne change pas puisque l’effectif reste de 25 : le nombre de filles passe pourtant de 14 à 13.`] },
        ],
      },
    }),
  });

  Q.push({
    num: 7, domaine: "NB", competence: "Exécuter et « remonter » un programme de calcul",
    attendu: "a) 7 ; b) 10.",
    indicateurs: [
      "Programme A : enchaîne correctement les calculs (en une ligne ou non), jusqu’à 3 × (−2) + 13.",
      "Programme B : « remonte » le programme de calcul en effectuant 9 ÷ 3 + 7.",
    ],
    generer: officielle({
      enonce: "On considère les deux programmes de calcul ci-dessous :",
      figure: programmes(),
      figureDessus: true,
      reponseADroite: true,
      apres: "a) <strong>Quel nombre</strong> obtient-on avec le programme A en choisissant 3 comme nombre de départ ?<br>b) <strong>Quel nombre</strong> faut-il choisir au départ pour obtenir 9 avec le programme B ?<br><strong>Détailler les calculs.</strong>",
      preuve: true,
      long: true,
      saisie: { enLigne: true, lignes: [
        { modele: "a) □", attendus: [PROGRAMMES.A.depart * PROGRAMMES.A.facteur + PROGRAMMES.A.ajout], pieges: [
          { valeurs: [19], nonPublie: true, erreur: "Multiplie par 2 au lieu de −2 : oublie le signe moins." },
        ] },
        { modele: "b) □", attendus: [PROGRAMMES.B.arrivee / PROGRAMMES.B.facteur + PROGRAMMES.B.enleve], pieges: [
          { valeurs: [6], nonPublie: true, erreur: "Applique le programme B au nombre 9 au lieu de le remonter : (9 − 7) × 3 = 6." },
          { valeurs: [34], nonPublie: true, erreur: "Remonte le programme sans changer les opérations : 9 × 3 + 7 = 34." },
          { valeurs: [-4], nonPublie: true, erreur: "Remonte le programme en divisant par 3, mais enlève 7 au lieu de l’ajouter." },
        ] },
      ] },
    }),
  });

  Q.push({
    num: 8, domaine: "NB", competence: "Lire des abscisses sur un axe gradué (nombres relatifs)",
    generer: officielle({
      enonce: "Sur l’axe ci-dessous, la graduation est régulière.",
      figure: figureQ8(),
      apres: "<strong>Répondre par vrai ou faux</strong> à chacune des affirmations suivantes.",
      grille: {
        colonnes: ["Vrai", "Faux"],
        lignes: [
          { html: "a) L’abscisse de A est positive.", texte: "a) L’abscisse de A est positive", juste: 1, nonPublie: true,
            erreurs: ["Ne repère pas où se trouve 0 sur l’axe : A est à gauche de 0, son abscisse est −1,6.", ""] },
          { html: `b) L’abscisse de C est ${MOINS}2,8.`, texte: "b) L’abscisse de C est −2,8", juste: 0, nonPublie: true,
            erreurs: ["", "Ne trouve pas l’écart entre deux graduations (4,8 ÷ 8 = 0,6) : C est une graduation après −3,4, donc à −2,8."] },
          { html: "c) L’abscisse du milieu du segment [AB] est un nombre entier.", texte: "c) Le milieu de [AB] a une abscisse entière", juste: 0, nonPublie: true,
            erreurs: ["", "Ne cherche pas les abscisses de A et de B (−1,6 et −0,4) : le milieu de [AB] est à −1, un nombre entier."] },
        ],
      },
    }),
  });

  Q.push({
    num: 9, domaine: "NB", competence: "Comparer deux puissances de 2",
    attendu: `Oui, car 2 × ${p2(39)} = ${p2(40)}.`,
    indicateurs: [
      `Traduit correctement le double de ${p2(39)} par 2 × ${p2(39)}.`,
      `Utilise ${p2(39)} comme un produit de 39 facteurs égaux à 2.`,
      `Utilise 2 = ${p2(1)} et la propriété a<sup>n</sup> × a<sup>m</sup> = a<sup>n+m</sup>.`,
    ],
    generer: officielle({
      enonce: `Ariane affirme que ${p2(40)} est le double de ${p2(39)}. A-t-elle raison ? <strong>Argumenter la réponse.</strong>`,
      disposition: "ligne",
      preuve: true,
      choix: [
        c("Oui", true),
        c("Non", false, `Pense que le double de ${p2(39)} s’obtient en doublant la base ou l’exposant (4<sup>39</sup> ou ${p2(78)}).`, true),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-exemples-nombres"] = {
    id: "4e-exemples-nombres",
    famille: "Exemples de questions Eduscol",
    niveau: "4e",
    titre: "Nombres et calculs",
    source: "Ministère de l’Éducation nationale — « Accompagner les élèves en mathématiques – 4e, 3e et 2de », exemples d’exercices de quatrième, fiche « Nombres et calculs », Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/6858/accompagner-les-eleves-en-mathematiques-4e-3e-et-2de",
    consignes: "Sans calculatrice. Prévois une feuille pour les justifications.",
    jumeaux: false,
    seuils: null, // Eduscol ne publie pas de repères pour ces exemples
    domaines: { NB: "Utiliser les nombres pour comparer, calculer, résoudre des problèmes", PROP: "Résoudre des problèmes de proportionnalité", DIV: "Divisibilité et nombres premiers" },
    officiels: [{ cle: "eduscol", annee: "eduscol", titre: "Les questions d’Eduscol", detail: "La fiche « Nombres et calculs » de 4e, à l’identique." }],
    questions: Q,
    donnees: { DROITE_Q2, AXE_Q8, PROGRAMMES },
  };
})(typeof window !== "undefined" ? window : globalThis);
