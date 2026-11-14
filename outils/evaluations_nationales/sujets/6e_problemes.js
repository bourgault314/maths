/* maths&go — Évaluation nationale de début de 6e, test spécifique « Résolution de problèmes » (DEPP, septembre 2024,
   2025 et 2026 : le même sujet les trois années, documents « professeur » comparés réponse par réponse).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-6e — licence Etalab 2.0.
   Lot EN9 : le sujet officiel seulement, à l'identique (énoncés, réponses, ordre des réponses, figures redessinées).
   Les pièges expliqués dans la vue prof suivent l'analyse des distracteurs publiée par la DEPP (document « professeur »,
   section 11.4), réécrite sans mot genré. Pas encore de sujet jumeau : la variété de chaque problème se décidera avec
   Gwenaël, problème par problème. Comme dans le vrai test, la calculatrice est intégrée à chaque question. */
(function (racine) {
  "use strict";
  const { svg, quadrillage } = racine.EN;

  // Un choix : texte affiché + juste/faux + l'erreur que trahit le piège (vue prof, après « l'élève … »).
  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  // Une question du sujet officiel : toujours le même énoncé, les réponses dans l'ordre du sujet.
  const officielle = (contenu) => () => Object.assign({ melange: false }, contenu);

  // ---------- Figures ----------
  // Q15 : deux polygones sur un quadrillage (carreaux de 30). Les sommets sont donnés en carreaux : le test recalcule
  // les deux aires depuis ces points.
  const FIGURE_A = [[1, 1], [5, 1], [5, 2], [4, 2], [4, 3], [5, 3], [5, 4], [1, 4]];
  const FIGURE_B = [[8, 1], [12, 1], [12, 2], [13, 3], [12, 3], [12, 4], [10, 4], [9, 3], [8, 4]];
  function figuresAires() {
    const P = 30, X = 4, Y = 4;
    const poly = (pts) => `<polygon points="${pts.map(([x, y]) => `${X + x * P},${Y + y * P}`).join(" ")}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`;
    const nom = (x, y, t) => `<text x="${X + x * P}" y="${Y + y * P}" font-size="12" text-anchor="middle" fill="#143451">${t}</text>`;
    return svg(14 * P + 8, 5 * P + 8,
      quadrillage(X, Y, 14, 5, P, "#c9d2da") + poly(FIGURE_A) + poly(FIGURE_B) + nom(2.6, 2.6, "Figure A") + nom(10.3, 2.2, "Figure B"),
      "Figure A et figure B tracées sur un quadrillage", 520);
  }

  // Q16 : deux chemins pour aller au collège. Longueurs écrites sur les segments (le test les relit).
  const CHEMINS = { haut: [150, 100, 100], bas: [250, 150] };
  function figureChemins() {
    const trait = (pts) => `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#143451" stroke-width="2" stroke-linejoin="round"/>`;
    const croix = ([x, y]) => `<path d="M${x - 5} ${y - 5}l10 10M${x + 5} ${y - 5}l-10 10" stroke="#143451" stroke-width="1.8"/>`;
    const lg = (x, y, n) => `<text x="${x}" y="${y}" font-size="15" font-weight="700" text-anchor="middle" fill="#143451">${n} m</text>`;
    const haut = [[78, 70], [228, 22], [318, 82], [458, 82]];
    const bas = [[78, 96], [318, 162], [458, 96]];
    // L'élève (à gauche) et le collège (à droite), dessinés simplement.
    const eleve = `<circle cx="44" cy="58" r="11" fill="#f2c9a0" stroke="#143451" stroke-width="1.6"/>
      <path d="M44 70 L30 104 L58 104 Z" fill="#e0507a" stroke="#143451" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M38 104 L36 122 M50 104 L52 122" stroke="#143451" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="52" y="74" width="12" height="20" rx="3" fill="#4c7fd0" stroke="#143451" stroke-width="1.4"/>`;
    let fenetres = "";
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) fenetres += `<rect x="${486 + i * 21}" y="${62 + j * 22}" width="11" height="13" fill="#5b6b7b"/>`;
    const college = `<rect x="474" y="50" width="96" height="88" fill="#eef1f4" stroke="#143451" stroke-width="1.8"/>
      <rect x="490" y="26" width="64" height="18" fill="#fff" stroke="#143451" stroke-width="1.4"/>
      <text x="522" y="39" font-size="11" font-weight="700" text-anchor="middle" fill="#143451">Collège</text>
      <path d="M522 44 V50" stroke="#143451" stroke-width="1.4"/>${fenetres}
      <rect x="512" y="118" width="20" height="20" fill="#5b6b7b"/>`;
    return svg(578, 178,
      eleve + college + trait(haut) + trait(bas) + [...haut, ...bas].map(croix).join("") +
      lg(140, 36, CHEMINS.haut[0]) + lg(290, 42, CHEMINS.haut[1]) + lg(388, 72, CHEMINS.haut[2]) +
      lg(184, 152, CHEMINS.bas[0]) + lg(410, 152, CHEMINS.bas[1]),
      "Deux chemins vont au collège : en haut, trois segments de 150 m, 100 m et 100 m ; en bas, deux segments de 250 m et 150 m", 600);
  }

  const Q = [];

  // ---------- Nombres et calculs ----------
  Q.push({
    // « ligne » : au téléphone, un calcul par ligne (en deux colonnes, « 15 + 0,33 + 0,76 » se coupait en deux).
    num: 1, domaine: "NC", competence: "Associer une opération à un problème (nombres décimaux)", disposition: "ligne",
    generer: officielle({
      enonce: "Lors de son anniversaire, Robin achète 15 bouteilles de jus de fruits de 0,33 L chacune.<br>Une bouteille coute 0,76 €.<br>Un des calculs ci-dessous permet de trouver le nombre total de litres de jus de fruits.<br><strong>Lequel ?</strong>",
      choix: [
        c("15 + 0,33 + 0,76", false, "Veut utiliser toutes les valeurs et ne voit pas qu’il s’agit d’un problème multiplicatif."),
        c("15 × 0,33", true),
        c("15 × 0,33 × 0,76", false, "Repère le problème multiplicatif, mais veut utiliser toutes les valeurs."),
        c("15 × 0,76", false, "Confond avec le calcul du prix."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "NC", competence: "Résoudre un problème en deux ou trois étapes (nombres décimaux)",
    generer: officielle({
      enonce: "À la boulangerie, Kim a acheté 3 croissants à 1,20 € l’un et un pain aux raisins à 2 €.<br>Elle donne 10 €.<br><strong>Combien va-t-on lui rendre ?</strong>",
      choix: [
        c("5,60 €", false, "Calcule le prix à payer (3 × 1,20 € + 2 €) et s’arrête là."),
        c("4,40 €", true),
        c("3,20 €", false, "Calcule le prix à payer sans tenir compte des 3 croissants (1,20 € + 2 €)."),
        c("6,80 €", false, "Calcule la monnaie rendue sans tenir compte des 3 croissants (10 € − 1,20 € − 2 €)."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "NC", competence: "Résoudre un problème de proportionnalité (nombres entiers)", disposition: "grille",
    generer: officielle({
      enonce: "À la boulangerie, Juliette achète 9 croissants et paie 12 euros.<br>J’achète 3 croissants.<br><strong>Combien vais-je payer ?</strong>",
      choix: [
        c("6 euros", false, "Reporte sur le prix l’écart entre les nombres de croissants (9 − 3 = 6, donc 12 − 6)."),
        c("environ 1,33 euros", false, "Calcule le prix d’un croissant et s’arrête là."),
        c("4 euros", true),
        c("3 euros", false, "Voit que 3 croissants, c’est 3 fois moins que 9, et s’arrête là."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "NC", competence: "Retrouver le nombre de départ d’un programme de calcul",
    generer: officielle({
      enonce: "Je choisis un nombre.<br>Si j’augmente ce nombre de 5, j’obtiens la moitié de 1 000.<br><strong>Quel nombre ai-je choisi au départ ?</strong>",
      choix: [
        c("505", false, "Prend bien la moitié de 1 000, puis ajoute 5 au lieu de l’enlever."),
        c("495", true),
        c("1 005", false, "Voit les nombres 5 et 1 000 sans tenir compte de ce qu’on lui demande."),
        c("995", false, "Ne tient pas compte de « j’obtiens la moitié de 1 000 »."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "NC", competence: "Résoudre un problème de proportionnalité (nombres entiers)",
    generer: officielle({
      enonce: "Dans une recette, pour faire un gâteau au chocolat pour 8 personnes, il faut 4 œufs.<br><strong>Combien dois-je prévoir d’œufs pour 24 personnes ?</strong>",
      choix: [
        c("12", true),
        c("24", false, "Reprend le nombre de personnes."),
        c("28", false, "Additionne des nombres de l’énoncé (24 + 4)."),
        c("32", false, "Multiplie les deux nombres de l’énoncé (8 × 4)."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Résoudre un problème multiplicatif : compter des assortiments",
    generer: officielle({
      enonce: "Dans sa commode, Kevin a 5 écharpes différentes et 3 paires de gants différentes.<br><strong>Combien d’assortiments différents peut-il réaliser ?</strong>",
      choix: [
        c("15", true),
        c("8", false, "Additionne les deux nombres : compte les accessoires et non les assortiments."),
        c("2", false, "Soustrait les deux nombres de manière automatique."),
        c("10", false, "Choisit un ordre de grandeur qui paraît cohérent, sans calculer."),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "NC", competence: "Résoudre un problème de comparaison (« trois fois moins »)",
    generer: officielle({
      enonce: "Matthieu a trois fois moins de jeux vidéo que Julie.<br>Matthieu a 12 jeux vidéo.<br><strong>Combien de jeux a Julie ?</strong>",
      choix: [
        c("15", false, "Traduit « trois fois moins » par une addition (12 + 3)."),
        c("36", true),
        c("4", false, "Applique « trois fois moins » au nombre 12, sans comprendre la situation."),
        c("9", false, "Traduit « trois fois moins » par une soustraction (12 − 3)."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "NC", competence: "Résoudre un problème à deux étapes (nombres entiers)",
    generer: officielle({
      enonce: "« Sam le pirate » veut partager les 50 pièces d’or de son trésor.<br>Il donne 7 pièces à chacun de ses compagnons.<br>Il garde les 8 dernières pièces pour lui.<br><strong>Combien a-t-il de compagnons ?</strong>",
      choix: [
        c("5", false, "Choisit un nombre proche sans avoir trouvé la démarche."),
        c("8", false, "Choisit un nombre proche sans avoir trouvé la démarche."),
        c("7", false, "Fait la division de 50 par 7 sans tenir compte des 8 pièces gardées."),
        c("6", true),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "NC", competence: "Résoudre un problème en deux ou trois étapes (nombres entiers)", disposition: "grille",
    generer: officielle({
      enonce: "Un centre de vacances propose des séjours à 50 euros par personne et par jour.<br>Une famille de trois personnes y passe sept jours.<br><strong>Combien lui coutera ce séjour ?</strong>",
      choix: [
        c("350 euros", false, "Ne tient compte que du nombre de jours, pas du nombre de personnes."),
        c("500 euros", false, "Additionne 3 et 7, puis multiplie 50 euros par ce nombre."),
        c("150 euros", false, "Ne tient compte que du nombre de personnes, pas du nombre de jours."),
        c("1 050 euros", true),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "NC", competence: "Résoudre un problème à deux étapes : un écart qui reste le même",
    generer: officielle({
      enonce: "Carl et Lucie courent autour d’un stade.<br>Ils courent à la même vitesse, mais Carl a commencé à courir avant Lucie.<br>Quand Carl a parcouru 6 tours, Lucie a parcouru 2 tours.<br><strong>Combien de tours aura parcourus Carl quand Lucie en aura parcouru 4 ?</strong>",
      choix: [
        c("10", false, "Ajoute 4 tours au nombre de tours de Carl (6 + 4)."),
        c("12", false, "Applique la proportionnalité sans comprendre la situation."),
        c("8", true),
        c("6", false, "Ajoute 4 tours au nombre de tours de Lucie (2 + 4)."),
      ],
    }),
  });

  // ---------- Grandeurs et mesures ----------
  Q.push({
    num: 11, domaine: "GM", competence: "Utiliser l’échelle d’une carte",
    generer: officielle({
      enonce: "Sur une carte, 1 cm représente 4 km dans la réalité.<br><strong>Trouver la distance dans la réalité d’un segment de 10 cm sur le plan.</strong>",
      choix: [
        c("0,4 km", false, "Se trompe de coefficient : divise par 10 au lieu de multiplier."),
        c("4 km", false, "Se trompe de coefficient : reprend la distance pour 1 cm."),
        c("40 km", true),
        c("400 km", false, "Se trompe de coefficient : multiplie par 100 au lieu de 10."),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "GM", competence: "Résoudre un problème de vitesse (le quart d’une heure)",
    generer: officielle({
      enonce: "Une voiture roule à vitesse constante. Elle parcourt 80 km en une heure.<br><strong>Quelle distance parcourt-elle en un quart d’heure ?</strong>",
      choix: [
        c("20 km", true),
        c("40 km", false, "Prend la moitié au lieu du quart."),
        c("60 km", false, "Prend les trois quarts au lieu du quart."),
        c("80 km", false, "Ne prend pas le quart : reprend la distance en une heure."),
      ],
    }),
  });

  Q.push({
    num: 13, domaine: "GM", competence: "Utiliser le périmètre d’un rectangle pour calculer une longueur",
    generer: officielle({
      enonce: "Un rectangle a un périmètre de 500 m.<br>Sa longueur mesure 150 m.<br><strong>Combien mesure sa largeur ?</strong>",
      choix: [
        c("100 m", true),
        c("350 m", false, "Soustrait la longueur au périmètre une seule fois (500 − 150)."),
        c("200 m", false, "Retire bien deux fois la longueur, mais oublie que le résultat vaut deux largeurs."),
        c("125 m", false, "Divise le périmètre par 4, comme pour un carré."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "GM", competence: "Calculer une masse (division et unités)",
    generer: officielle({
      enonce: "Un paquet de 30 objets identiques pèse 12 kg.<br><strong>Combien pèse un objet ?</strong>",
      choix: [
        c("2,5 g", false, "Divise le grand nombre par le petit (30 ÷ 12) et se trompe d’unité."),
        c("0,4 kg", true),
        c("2,5 kg", false, "Divise le grand nombre par le petit (30 ÷ 12), sans tenir compte de la situation."),
        c("0,4 g", false, "Fait la bonne division mais se trompe d’unité."),
      ],
    }),
  });

  Q.push({
    num: 15, domaine: "GM", competence: "Comparer des aires à l’aide d’un quadrillage", disposition: "ligne",
    generer: officielle({
      // Sur ordinateur, les figures se mettent à droite de l'énoncé (les quatre longues réponses gardent toute la largeur) :
      // « ci-contre » ; au téléphone, elles sont dessous : « ci-dessous », comme dans le sujet.
      enonce: "Observer les figures <span class=\"mot-ordi\">ci-contre</span><span class=\"mot-tel\">ci-dessous</span>.",
      figure: figuresAires(),
      figureACote: true,
      apres: "<strong>Laquelle de ces quatre affirmations est vraie ?</strong>",
      choix: [
        c("L’aire de la figure A est plus grande que celle de la figure B.", false, "Se trompe en recomposant les figures, ou confond l’aire et le périmètre."),
        c("L’aire de la figure A est plus petite que celle de la figure B.", true),
        c("L’aire de la figure A est la même que celle de la figure B.", false, "Se trompe en recomposant les figures, ou confond l’aire et le périmètre."),
        c("On ne peut pas savoir quelle est la plus grande aire car les deux figures ne sont pas superposables.", false, "Compare par superposition et ne peut pas conclure."),
      ],
    }),
  });

  Q.push({
    num: 16, domaine: "GM", competence: "Calculer et comparer des longueurs",
    generer: officielle({
      enonce: "<strong>Quelle est la longueur du chemin le plus court pour aller au collège ?</strong>",
      figure: figureChemins(),
      choix: [
        c("350 m", true),
        c("100 m", false, "Choisit la plus petite longueur (dans le dessin ou parmi les réponses)."),
        c("750 m", false, "Additionne toutes les longueurs du dessin."),
        c("400 m", false, "Prend pour le plus court le chemin qui n’a que deux segments."),
      ],
    }),
  });

  Q.push({
    num: 17, domaine: "GM", competence: "Calculer une contenance (division et unités)",
    generer: officielle({
      enonce: "Marie a constaté qu’il faut un litre de lait pour remplir complètement quatre verres identiques.<br><strong>Quelle est la contenance d’un verre ?</strong>",
      choix: [
        c("0,25 cL", false, "Fait le bon calcul mais se trompe d’unité, sans idée de l’ordre de grandeur."),
        c("25 cL", true),
        c("4 cL", false, "Divise le grand nombre par le petit (4 ÷ 1), puis change d’unité."),
        c("0,04 L", false, "Divise le grand nombre par le petit, puis corrige parce que 4 L paraît trop grand."),
      ],
    }),
  });

  Q.push({
    num: 18, domaine: "GM", competence: "Résoudre un problème de comparaison en plusieurs étapes",
    generer: officielle({
      enonce: "Une douche représente en moyenne 80 L d’eau et un bain 200 L d’eau.<br><strong>Si Joseph prend une douche par jour au lieu d’un bain, quelle sera l’économie d’eau réalisée à la fin d’une semaine ?</strong>",
      choix: [
        c("280 L", false, "Additionne les deux quantités données (80 + 200)."),
        c("840 L", true),
        c("1 400 L", false, "Pense bien à la semaine, mais ne comprend pas la première partie de l’énoncé (200 × 7)."),
        c("1 960 L", false, "Pense bien à la semaine, mais additionne les deux quantités pour un jour ((80 + 200) × 7)."),
      ],
    }),
  });

  Q.push({
    num: 19, domaine: "GM", competence: "Déterminer un instant à partir d’un instant et d’une durée", disposition: "grille",
    generer: officielle({
      enonce: "Le cours de mathématiques dure 55 minutes.<br>Aujourd’hui, le professeur a débuté par des activités mentales qui ont duré un quart d’heure.<br>Le reste du temps, à partir de 10 h 10, a été consacré à résoudre des problèmes.<br><strong>À quelle heure le cours s’est-il terminé ?</strong>",
      choix: [
        c("10 h 50", true),
        c("10 h 25", false, "Ajoute le quart d’heure d’activités mentales à 10 h 10."),
        c("11 h 20", false, "Ajoute toutes les durées : les 15 minutes d’activités mentales et les 55 minutes du cours."),
        c("11 h 05", false, "Ne tient pas compte des 15 minutes d’activités mentales (10 h 10 + 55 min)."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-problemes"] = {
    id: "6e-problemes",
    niveau: "6e",
    titre: "Résolution de problèmes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de sixième, septembre 2024, 2025 et 2026 (test spécifique « Résolution de problèmes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-6e",
    consignes: "Avec la calculatrice de l’appli. Pour chaque question, une seule réponse est juste.",
    // Comme dans le vrai test : la calculatrice est dans chaque question (une question peut l'enlever : calculatrice: false).
    calculatrice: true,
    // Pas encore de sujet jumeau (lot EN9) : ni carte « Un sujet jumeau », ni « Refaire mes questions ratées ».
    jumeaux: false,
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 19), section 11.2 — les mêmes en 2024, 2025 et 2026.
    seuils: [{ max: 4, nom: "À besoins" }, { max: 9, nom: "Fragile" }, { max: 19, nom: "Satisfaisant" }],
    officiels: [{ cle: "2026", annee: 2026, titre: "Le sujet officiel", detail: "Les vraies questions. Le même sujet est tombé en 2024, 2025 et 2026." }],
    questions: Q,
    // Pour les tests : les données des figures, relues pour recalculer les bonnes réponses.
    donnees: { FIGURE_A, FIGURE_B, CHEMINS },
  };
})(typeof window !== "undefined" ? window : globalThis);
