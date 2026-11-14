/* maths&go — « Exemples de questions et de tâches » Eduscol, 4e, fiche « Expressions algébriques » (page « Accompagner
   les élèves en mathématiques – 4e, 3e et 2de »). Source : fiche élève et fiche professeur, licence Etalab 2.0.
   Lot EN8b : la fiche à l'identique (énoncés, réponses dans l'ordre de la fiche élève — en Q4 la fiche professeur range
   les deux premières autrement —, figures redessinées), sans jumeau, sans calculatrice. Les pièges des QCM et de la grille
   (Q5) suivent l'analyse de la fiche professeur, réécrite sans mot genré ; les autres sont de maths&go (nonPublie, liste
   ⚠ dans PIEGES-a-relire-EN8b.md). Q6 et Q7 : la réponse ici, la justification sur la feuille. Q8 : la formule tapée au
   pavé (𝑛, +, −, ×, parenthèses), toute écriture égale à 2𝑛 − 1 acceptée, comme le dit la fiche professeur.
   Eduscol ne publie pas de repères pour ces exemples : pas de groupe au bilan. */
(function (racine) {
  "use strict";
  const { lettre, MOINS, svg } = racine.EN;

  const c = (html, juste, erreur, nonPublie) => ({ html, juste: Boolean(juste), erreur: erreur || "", nonPublie: Boolean(nonPublie) });
  const officielle = (contenu) => () => Object.assign({ melange: false, choix: [] }, contenu);
  const x = lettre("x"), y = lettre("y"), b = lettre("b"), n = lettre("n");
  // Une expression ne se coupe jamais en fin de ligne (« 2𝑦 + 6𝑥𝑦² » reste d'un seul tenant).
  const ex = (h) => `<span class="insecable">${h}</span>`;
  const ENCRE = "#143451";
  // La lettre dans une figure : ronde et en italique, comme dans le texte.
  const xs = '<tspan font-style="italic" font-family="Cambria Math,Times New Roman,serif" font-size="1.12em">x</tspan>';

  // ---------- Figures ----------
  // Q7 : le triangle ABC (pas à l'échelle, comme sur la fiche) : CA = 𝑥, AB = 3𝑥 + 1, CB = 2𝑥 + 5.
  const TRIANGLE = { CA: [1, 0], AB: [3, 1], CB: [2, 5], perimetre: 21 }; // [coefficient de 𝑥, nombre]
  function figureTriangle() {
    const C = [26, 22], A = [80, 96], B = [372, 96]; // 4 px d'air en haut : le « C » ne touche pas le bord du dessin
    const t = (px, py, contenu, ancre = "middle", coul = "#111") => `<text x="${px}" y="${py}" font-size="17" text-anchor="${ancre}" fill="${coul}">${contenu}</text>`;
    const s = `<path d="M${C} L${A} L${B} Z" fill="#dfe2fb" stroke="#4a52c9" stroke-width="2" stroke-linejoin="round"/>` +
      t(C[0] - 6, C[1] - 2, "C", "end", ENCRE) + t(A[0], A[1] + 22, "A", "middle", ENCRE) + t(B[0] + 8, B[1] + 6, "B", "start", ENCRE) +
      t(40, 70, xs, "end") +
      t(212, 46, `2${xs} + 5`) +
      t(232, 120, `3${xs} + 1`);
    return svg(400, 128, s, "Triangle ABC : le côté CA mesure x, le côté AB mesure 3x + 1, le côté CB mesure 2x + 5", 470);
  }

  // Q8 : les motifs des étapes 1 à 4 (une colonne de n carrés, une ligne de n − 1 carrés en bas, à droite).
  const MOTIF = { etapes: 4, carres: (k) => 2 * k - 1 };
  function figureMotifs() {
    const P = 17, bas = 78;
    let s = "", x0 = 28;
    for (let k = 1; k <= MOTIF.etapes; k++) {
      for (let i = 0; i < k; i++) s += `<rect x="${x0}" y="${bas - (i + 1) * P}" width="${P}" height="${P}" fill="#fff" stroke="#111" stroke-width="1.6"/>`;
      for (let j = 1; j < k; j++) s += `<rect x="${x0 + j * P}" y="${bas - P}" width="${P}" height="${P}" fill="#fff" stroke="#111" stroke-width="1.6"/>`;
      const largeur = k * P;
      s += `<text x="${x0 + largeur / 2}" y="${bas + 20}" font-size="14" text-anchor="middle" fill="#111">Étape ${k}</text>`;
      x0 += Math.max(largeur, 44) + 40;
    }
    return svg(x0 - 12, bas + 28, s, "Étape 1 : 1 carré. Étape 2 : une colonne de 2 carrés et 1 carré à droite en bas. Étape 3 : une colonne de 3 carrés et 2 carrés à droite. Étape 4 : une colonne de 4 carrés et 3 carrés à droite", 380);
  }

  // ---------- Questions ----------
  const Q = [];

  Q.push({
    num: 1, domaine: "LIT", competence: "Calculer la valeur d’une expression littérale",
    generer: officielle({
      enonce: `On considère l’expression ${ex(`E = 3${x} + ${y}²`)}. Quelle est la valeur de E lorsque ${ex(`${x} = 2`)} et ${ex(`${y} = 1`)} ?<br><strong>Cocher la réponse exacte.</strong>`,
      disposition: "ligne4",
      choix: [
        c("7", true),
        c("8", false, `Calcule 2${y} à la place de ${y}².`),
        c("10", false, `Calcule 5${x}${y} au lieu de 3${x} + ${y}².`),
        c("33", false, `N’identifie pas le produit dans l’expression 3${x} et utilise le nombre 32 dans ses calculs.`),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "LIT", competence: "Réduire une expression littérale",
    generer: officielle({
      enonce: `<strong>Cocher la réponse exacte.</strong><br>Quand on réduit l’expression : ${ex(`2 + 3 × ${b} + 4 × ${b} × ${b}`)}, on obtient :`,
      disposition: "ligne",
      choix: [
        c(`9${b}`, false, `Additionne tous les coefficients (2 + 3 + 4) en gardant le ${b}.`),
        c(`2 + 7${b}²`, false, `Réduit 3 × ${b} + 4 × ${b} × ${b} en (3 + 4)${b}² et garde le terme constant.`),
        c(`2 + 7${b}`, false, `Réduit 3 × ${b} + 4 × ${b} × ${b} en (3 + 4)${b} et garde le terme constant.`),
        c(`2 + 3${b} + 4${b}²`, true),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "LIT", competence: "Développer une expression (distributivité simple)",
    generer: officielle({
      enonce: `Quelle expression obtient-on en développant ${ex(`3(5${x} + 1)`)} ?<br><strong>Cocher la réponse exacte.</strong>`,
      disposition: "ligne",
      choix: [
        c(`18${x}`, false, `Réduit l’expression 5${x} + 1 en 6${x}, parce qu’il y a une somme à calculer.`),
        c(`15${x} + 1`, false, `Multiplie 5${x} par 3 mais pas 1, comme si les parenthèses n’existaient pas.`),
        c(`15${x} + 3`, true),
        c(`35${x} + 1`, false, `Enlève les parenthèses et colle le premier facteur au premier terme : 3 et 5${x} donnent 35${x}.`),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "LIT", competence: "Factoriser une expression",
    generer: officielle({
      enonce: `Quelle expression est égale à ${ex(`2${y} + 6${x}${y}²`)} ?<br><strong>Cocher la réponse exacte.</strong>`,
      disposition: "ligne",
      // L'ordre de la fiche élève (la fiche professeur met 2𝑦(1 + 6𝑥𝑦) en premier).
      choix: [
        c(`2${y}(1 + 3${x}${y})`, true),
        c(`2${y}(1 + 6${x}${y})`, false, `Se trompe sur le coefficient de ${x}${y} : le 2 mis en facteur devant les parenthèses concerne aussi le terme 6${x}${y}².`),
        c(`2${y}(1 + 3${x})`, false, `Ne tient pas compte du carré dans le terme 6${x}${y}².`),
        c(`1 + 3${x}${y}`, false, `« Simplifie » l’expression en la divisant par 2${y}, le facteur commun de ses deux termes.`),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "LIT", competence: "Reconnaître une somme et un produit (dernière opération)",
    generer: officielle({
      // La fiche dit « Entourer la réponse correcte. » : ici, on coche.
      enonce: "La dernière opération à effectuer pour calculer chaque expression numérique est-elle une somme ou un produit ?<br><strong>Cocher la réponse correcte.</strong>",
      grille: {
        colonnes: ["SOMME", "PRODUIT"],
        lignes: [
          { html: "2(3 + 4)", juste: 1, erreurs: ["N’identifie pas l’expression comme le produit d’un nombre par une somme : la somme dans l’un des facteurs peut tromper.", ""] },
          { html: "2 × 4 + 6", juste: 0, erreurs: ["", "Prend le produit pour la dernière opération : c’est le premier calcul écrit dans le sens de la lecture, et le premier fait de tête."] },
          { html: "2 × 3 + 4 × 7", juste: 0, erreurs: ["", "Prend un produit pour la dernière opération : c’est le premier calcul écrit dans le sens de la lecture, et le premier fait de tête."] },
        ],
      },
    }),
  });

  Q.push({
    num: 6, domaine: "LIT", competence: "Tester une égalité pour une valeur",
    attendu: `Oui, car d’une part 4² ${MOINS} 9 = 16 ${MOINS} 9 = 7, et d’autre part 3 × 4 ${MOINS} 5 = 12 ${MOINS} 5 = 7.`,
    indicateurs: [
      `Calcule 3 × 4 ${MOINS} 5.`,
      `Calcule 4² ${MOINS} 9.`,
      "Observe que les deux résultats sont les mêmes.",
      "Point d’attention : l’égalité ne doit pas être écrite dès le départ dans la justification.",
    ],
    generer: officielle({
      enonce: `L’égalité ${ex(`${x}² ${MOINS} 9 = 3${x} ${MOINS} 5`)} est-elle vraie pour ${ex(`${x} = 4`)} ?<br><strong>Justifier la réponse par des calculs.</strong>`,
      disposition: "ligne",
      preuve: true,
      choix: [
        c("Oui", true),
        c("Non", false, "Se trompe dans le calcul d’un des deux membres, par exemple 4² = 8 au lieu de 16.", true),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "LIT", competence: "Mettre un problème en équation (périmètre)",
    attendu: `${x} = 2,5 (2,5 cm).`,
    indicateurs: [
      "Deux procédures sont possibles : toute trace de recherche et d’argumentation, même partielle, est à valoriser.",
      "Par essais : avec 2, le périmètre mesure 18 cm ; avec 3, on obtient 24 cm ; la réponse est donc entre 2 et 3 ; avec 2,5, on obtient 21 cm.",
      `Par une équation : ${x} + 3${x} + 1 + 2${x} + 5 = 6${x} + 6, puis 6${x} + 6 = 21 donne ${x} = 2,5.`,
    ],
    generer: officielle({
      enonce: "Le périmètre du triangle ABC mesure 21 cm.",
      figure: figureTriangle(),
      figureAGauche: true,
      apres: `<strong>Quelle est la valeur de ${x} ? Justifier.</strong>`,
      preuve: true,
      saisie: { lignes: [{ modele: `${x} = □`, attendus: [(TRIANGLE.perimetre - TRIANGLE.AB[1] - TRIANGLE.CB[1]) / (TRIANGLE.CA[0] + TRIANGLE.AB[0] + TRIANGLE.CB[0])], pieges: [
        { valeurs: [3.5], nonPublie: true, erreur: `Additionne seulement les termes en ${x} (${x} + 3${x} + 2${x} = 21) et oublie 1 et 5.` },
        { valeurs: [4.5], nonPublie: true, erreur: `Trouve 6${x} + 6 = 21, puis ajoute 6 au lieu de l’enlever.` },
        { valeurs: [15], nonPublie: true, erreur: `Trouve 6${x} = 15, mais oublie de diviser par 6.` },
      ] }] },
    }),
  });

  Q.push({
    num: 8, domaine: "LIT", competence: "Écrire une formule en fonction de 𝑛 (motif qui grandit)",
    generer: officielle({
      enonce: `<strong>Quelle formule</strong>, en fonction de ${n}, permet de calculer le nombre de carrés nécessaires pour construire le motif de l’étape ${n} ?`,
      figure: figureMotifs(),
      saisie: { lignes: [{ modele: "□", expression: true, attendus: ["2n−1"], pieges: [
        { formule: "2n", nonPublie: true, erreur: `Compte une colonne et une ligne de ${n} carrés chacune, sans voir que le carré du coin est compté deux fois.` },
        { formule: "2n−2", nonPublie: true, erreur: `Oublie le carré du coin : compte seulement une colonne et une ligne de ${n} ${MOINS} 1 carrés.` },
        { formule: "2n+1", nonPublie: true, erreur: "Ajoute le carré du coin au lieu de l’enlever." },
        { formule: "n+2", nonPublie: true, erreur: "Voit que le nombre de carrés augmente de 2 d’une étape à l’autre, mais ajoute 2 à l’étape au lieu de multiplier l’étape par 2." },
        { sansLettre: true, nonPublie: true, erreur: `Donne le nombre de carrés d’une étape au lieu d’une formule en fonction de ${n}.` },
      ] }] },
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-exemples-expressions"] = {
    id: "4e-exemples-expressions",
    famille: "Exemples de questions Eduscol",
    niveau: "4e",
    titre: "Expressions algébriques",
    source: "Ministère de l’Éducation nationale — « Accompagner les élèves en mathématiques – 4e, 3e et 2de », exemples d’exercices de quatrième, fiche « Expressions algébriques », Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/6858/accompagner-les-eleves-en-mathematiques-4e-3e-et-2de",
    consignes: "Sans calculatrice. Prévois une feuille pour les justifications.",
    jumeaux: false,
    seuils: null, // Eduscol ne publie pas de repères pour ces exemples
    domaines: { LIT: "Utiliser le calcul littéral" },
    officiels: [{ cle: "eduscol", annee: "eduscol", titre: "Les questions d’Eduscol", detail: "La fiche « Expressions algébriques » de 4e, à l’identique." }],
    questions: Q,
    donnees: { TRIANGLE, MOTIF },
  };
})(typeof window !== "undefined" ? window : globalThis);
