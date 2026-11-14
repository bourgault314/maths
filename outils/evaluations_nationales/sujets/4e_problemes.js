/* maths&go — Évaluation nationale de début de 4e, test spécifique « Résolution de problèmes » (DEPP, septembre 2024,
   2025 et 2026 : le même sujet les trois années, documents « Présentation des exercices » comparés réponse par réponse).
   Source : https://eduscol.education.gouv.fr/evaluations-nationales-4e — licence Etalab 2.0.
   Lot EN9 : le sujet officiel seulement, à l'identique (énoncés, réponses, ordre des réponses, figures redessinées).
   Les pièges expliqués dans la vue prof suivent l'analyse des distracteurs publiée par la DEPP (section 12.4), réécrite
   sans mot genré. Pas encore de sujet jumeau : la variété de chaque problème se décidera avec Gwenaël, problème par
   problème. Comme dans le vrai test, la calculatrice est intégrée à chaque question, sauf à la question 10 (fractions). */
(function (racine) {
  "use strict";
  const { svg, quadrillage, frac, lettre, MOINS } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const officielle = (contenu) => () => Object.assign({ melange: false }, contenu);
  const ENCRE = "#143451";

  // ---------- Figures ----------
  // Q2 : le terrain clos (pentagone). Côtés connus écrits sur la figure ; le cinquième n'a pas de mesure.
  const TERRAIN = { cotes: [20, 50, 50, 50], perimetre: 210 };
  function figureTerrain() {
    const P = [[62, 105], [108, 24], [260, 105], [260, 262], [62, 262]];
    const lg = (x, y, t, a = "middle") => `<text x="${x}" y="${y}" font-size="14" font-weight="700" text-anchor="${a}" fill="${ENCRE}">${t}</text>`;
    return svg(326, 286,
      `<polygon points="${P.map((p) => p.join(",")).join(" ")}" fill="#e4e1f5" stroke="#3f4fb0" stroke-width="2.2" stroke-linejoin="round"/>` +
      lg(76, 58, `${TERRAIN.cotes[0]} m`, "end") + lg(56, 188, `${TERRAIN.cotes[1]} m`, "end") + lg(268, 188, `${TERRAIN.cotes[2]} m`, "start") + lg(161, 280, `${TERRAIN.cotes[3]} m`),
      "Plan du terrain : un polygone à cinq côtés ; quatre côtés mesurent 20 m, 50 m, 50 m et 50 m ; le cinquième n’a pas de mesure", 270);
  }

  // Q7 : la zone boisée, case par case (colonnes de 0 à 9, lignes de 0 à 5, dans le rectangle de 10 × 6 carreaux).
  // Le test recompte les carreaux et relit la légende (1 km² = 2 × 2 carreaux).
  const BOIS = { 0: [1, 2, 3, 4, 5, 6], 1: [1, 2, 3, 4, 5, 6], 2: [0, 1, 2, 3, 4, 5, 6, 7, 8], 3: [1, 2, 3, 4, 5, 6, 7, 8, 9], 4: [2, 6], 5: [2, 3, 6, 7] };
  const PLAN = { colonnes: 10, lignes: 6, legende: 2 };
  function figureBois() {
    const P = 30, X = 4, Y = 4, VERT = "#2f9e44";
    const boise = (col, lig) => (BOIS[lig] || []).includes(col);
    const arbres = (x, y) => [[.28, .3], [.72, .3], [.28, .74], [.72, .74]].map(([a, b]) => {
      const cx = x + a * P, cy = y + b * P;
      return `<path d="M${cx - 4} ${cy}h8M${cx} ${cy - 4}v8M${cx - 3} ${cy - 3}l6 6M${cx + 3} ${cy - 3}l-6 6" stroke="${VERT}" stroke-width="1.2"/>`;
    }).join("");
    let zone = "", bord = "";
    for (let lig = 0; lig < PLAN.lignes; lig++) for (let col = 0; col < PLAN.colonnes; col++) {
      if (!boise(col, lig)) continue;
      const x = X + col * P, y = Y + lig * P;
      zone += arbres(x, y);
      if (!boise(col, lig - 1)) bord += `M${x} ${y}h${P}`;
      if (!boise(col, lig + 1)) bord += `M${x} ${y + P}h${P}`;
      if (!boise(col - 1, lig)) bord += `M${x} ${y}v${P}`;
      if (!boise(col + 1, lig)) bord += `M${x + P} ${y}v${P}`;
    }
    const L = X + 11 * P; // la légende commence à la 12e colonne
    const legende = `<text x="${L}" y="${Y + 20}" font-size="14" fill="${ENCRE}">Légende :</text>
      <rect x="${L}" y="${Y + P}" width="${PLAN.legende * P}" height="${PLAN.legende * P}" fill="#ececec" stroke="#222" stroke-width="2"/>
      <text x="${L + P}" y="${Y + 2 * P + 5}" font-size="14" text-anchor="middle" fill="${ENCRE}">1 km²</text>
      <rect x="${L}" y="${Y + 4 * P}" width="${P}" height="${P}" fill="#fff" stroke="${VERT}" stroke-width="2"/>${arbres(L, Y + 4 * P)}
      <text x="${L + P + 6}" y="${Y + 4.5 * P + 5}" font-size="14" fill="${ENCRE}">zone boisée</text>`;
    return svg(16 * P + 8, PLAN.lignes * P + 8,
      quadrillage(X, Y, 16, PLAN.lignes, P, "#c9d2da") + zone +
      `<path d="${bord}" fill="none" stroke="${VERT}" stroke-width="2.2" stroke-linecap="square"/>` +
      `<rect x="${X}" y="${Y}" width="${PLAN.colonnes * P}" height="${PLAN.lignes * P}" fill="none" stroke="#222" stroke-width="2.4"/>` + legende,
      "Plan d’un terrain sur un quadrillage, avec une zone boisée ; légende : un carré de 2 carreaux sur 2 représente 1 km²", 460);
  }

  // Q13 : le rectangle de côtés a et b, la bande hachurée de largeur 3 en bas à droite.
  function figureHachures() {
    const g = 60, d = 420, h = 30, bas = 200, milieu = 220, haut3 = 146;
    const angle = (x, y, sx, sy) => `<rect x="${sx > 0 ? x : x - 12}" y="${sy > 0 ? y : y - 12}" width="12" height="12" fill="#d9efd9" stroke="#2f8a3a" stroke-width="1.4"/>`;
    const fleche = (x1, y1, x2, y2) => {
      const a = Math.atan2(y2 - y1, x2 - x1), t = (x, y, s) => `M${x} ${y}l${(-7 * Math.cos(a + s)).toFixed(1)} ${(-7 * Math.sin(a + s)).toFixed(1)}`;
      const r = (x, y, s) => `M${x} ${y}l${(7 * Math.cos(a + s)).toFixed(1)} ${(7 * Math.sin(a + s)).toFixed(1)}`;
      return `<path d="M${x1} ${y1}L${x2} ${y2}${t(x2, y2, .5)}${t(x2, y2, -.5)}${r(x1, y1, .5)}${r(x1, y1, -.5)}" fill="none" stroke="#444" stroke-width="1.8" stroke-linecap="round"/>`;
    };
    const L = (x, y, t) => `<text x="${x}" y="${y}" font-size="20" font-style="italic" font-family="Cambria Math,Times New Roman,serif" text-anchor="middle" fill="#111">${t}</text>`;
    // Tout descend de 14 : la lettre b au-dessus de la flèche n'est pas coupée en haut.
    return svg(470, 272, `<g transform="translate(0 14)">` +
      `<defs><pattern id="hachures-en4-q13" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff"/><line x1="0" y1="0" x2="0" y2="7" stroke="#b03a2e" stroke-width="2.6"/></pattern></defs>` +
      `<rect x="${milieu}" y="${haut3}" width="${d - milieu}" height="${bas - haut3}" fill="url(#hachures-en4-q13)" stroke="#8c2a20" stroke-width="2"/>` +
      `<path d="M${g} ${h}H${d}V${bas}H${g}Z" fill="none" stroke="#222" stroke-width="2.2"/>` +
      angle(g, h, 1, 1) + angle(d, h, -1, 1) + angle(g, bas, 1, -1) + angle(milieu, haut3, 1, 1) + angle(d, haut3, -1, 1) + angle(milieu, bas, 1, -1) + angle(d, bas, -1, -1) +
      fleche(g, 14, d, 14) + L((g + d) / 2, 10, "b") +
      fleche(40, h, 40, bas) + L(24, (h + bas) / 2 + 6, "a") +
      fleche(g, 222, milieu, 222) + L((g + milieu) / 2, 246, "a") +
      fleche(438, haut3, 438, bas) + `<text x="452" y="${(haut3 + bas) / 2 + 7}" font-size="20" font-family="Cambria Math,Times New Roman,serif" fill="#111">3</text></g>`,
      "Rectangle de côtés a et b ; en bas à droite, une bande hachurée de largeur 3 ; le segment du bas, à gauche de la bande, mesure a", 470);
  }

  // Q19 : diagramme circulaire de l'œuf (coquille 10 %, blanc 60 %, jaune : ce qui reste, sans pourcentage écrit).
  const OEUF = { masse: 60, coquille: 10, blanc: 60 };
  function figureOeuf() {
    // Le secteur de la coquille (10 %) est trop étroit pour son nom : « Coquille 10 % » s'écrit dehors, relié par un trait.
    const r = 92, cx = 100, cy = 124;
    const P = (a, rr = r) => [cx + rr * Math.sin((a * Math.PI) / 180), cy - rr * Math.cos((a * Math.PI) / 180)];
    const part = (a1, a2, fill) => {
      const [x1, y1] = P(a1), [x2, y2] = P(a2);
      return `<path d="M${cx} ${cy}L${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z" fill="${fill}" stroke="#333" stroke-width="1.3"/>`;
    };
    const a1 = OEUF.coquille * 3.6, a2 = a1 + OEUF.blanc * 3.6;
    const t = (x, y, s, gras, a = "middle") => `<text x="${x}" y="${y}" font-size="${gras ? 19 : 16}" ${gras ? 'font-weight="800"' : ""} text-anchor="${a}" fill="#111">${s}</text>`;
    const [lx, ly] = P(a1 / 2, 70), [ex, ey] = P(a1 / 2, r + 14);
    return svg(268, 222,
      part(0, a1, "#dcdcdc") + part(a1, a2, "#fff") + part(a2, 360, "#f0ef6a") +
      `<path d="M${lx.toFixed(1)} ${ly.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}H${(ex + 22).toFixed(1)}" fill="none" stroke="#333" stroke-width="1.2"/>` +
      t(ex + 26, ey - 4, "Coquille", false, "start") + t(ex + 26, ey + 19, "10 %", true, "start") +
      t(cx + 22, cy + 30, "Blanc") + t(cx + 22, cy + 52, "60 %", true) + t(cx - 46, cy - 18, "Jaune"),
      "Diagramme circulaire de la composition de l’œuf : coquille 10 %, blanc 60 %, jaune : le reste", 260);
  }
  // Un tableau de réponse (Q19), petit, en cases.
  const COLONNES = ["Œuf", "Coquille", "Blanc", "Jaune"];
  function tableau(masses, pourcents) {
    const cases = (titre, v) => `<span class="mt-titre">${titre}</span>` + v.map((x) => `<span>${x}</span>`).join("");
    return `<span class="mini-tab" role="table" aria-label="Masse (g) : ${masses.join(", ")} ; % : ${pourcents.join(", ")}"><span class="mt-titre"></span>${COLONNES.map((x) => `<span class="mt-titre">${x}</span>`).join("")}${cases("Masse (g)", masses)}${cases("%", pourcents)}</span>`;
  }

  const Q = [];

  Q.push({
    num: 1, domaine: "OGD", competence: "Calculer un prix avec le prix au kilogramme",
    generer: officielle({
      enonce: "Dans un supermarché, les fraises sont à 2 € le kilogramme.<br><strong>Combien vais-je payer pour acheter 5 kg de fraises dans ce supermarché ?</strong>",
      choix: [
        c("5 €", false, "Reprend le 5 de 5 kg sans calculer."),
        c("6 €", false, "Pense que la masse augmente de 4, donc le prix aussi (2 € + 4 €)."),
        c("7 €", false, "Additionne des nombres de l’énoncé (2 + 5)."),
        c("10 €", true),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "GM", competence: "Utiliser le périmètre d’un polygone pour calculer une longueur",
    generer: officielle({
      // Sur ordinateur, la figure se met à gauche des réponses : le texte qui la suit dans le sujet passe au-dessus d'elle.
      enonce: "Le dessin ci-dessous représente le plan d’un terrain clos.<br>On connait la longueur de quatre des côtés du terrain.<br>Le périmètre de ce terrain est de 210 m.<br><strong>Quelle est la longueur du cinquième côté ?</strong>",
      figure: figureTerrain(),
      choix: [
        c("210 m", false, "Reprend le périmètre du terrain."),
        c("170 m", false, "Calcule la somme des côtés connus et oublie de la soustraire au périmètre."),
        c("40 m", true),
        c("30 m", false, "Pense que les deux derniers côtés font ensemble 50 m, comme les autres (50 − 20)."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "OGD", competence: "Utiliser « trois fois plus rapide » pour calculer une durée",
    generer: officielle({
      enonce: "César et Romain habitent à la même distance du collège. Romain vient au collège à pied. Sa vitesse est de 5 km/h. César vient à vélo. Il est trois fois plus rapide. Le trajet de Romain dure 12 minutes.<br><strong>Combien dure le trajet de César ?</strong>",
      choix: [
        c("36 min", false, "Voit bien le coefficient 3, mais multiplie au lieu de diviser (12 × 3)."),
        c("15 min", false, "Traduit « trois fois plus » par « trois de plus » (12 + 3)."),
        c("4 min", true),
        c("3 min", false, "Tire une durée de 3 minutes de « trois fois plus rapide »."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "OGD", competence: "Calculer une quatrième proportionnelle (nombres décimaux)",
    generer: officielle({
      enonce: "Dans une même boulangerie, Lucas achète 7 pains au chocolat et paie 6,30 €, Enzo achète 9 pains au chocolat et paie 8,10 €.<br><strong>Combien paierait Camillia pour 8 pains au chocolat ?</strong>",
      choix: [
        c("7,10 €", false, "Enlève 1 € au prix de 9 pains, parce que 8 = 9 − 1."),
        c("7,20 €", true),
        c("0,90 €", false, "Calcule bien le prix d’un pain au chocolat et s’arrête là."),
        c("7,30 €", false, "Ajoute 1 € au prix de 7 pains, parce que 8 = 7 + 1."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "OGD", competence: "Calculer une quatrième proportionnelle",
    generer: officielle({
      enonce: "Louise a acheté 10 objets identiques pour 22 €.<br><strong>Combien coutent 15 de ces objets ?</strong>",
      choix: [
        c("47 €", false, "Additionne les trois nombres de l’énoncé (10 + 22 + 15)."),
        c("33 €", true),
        c("15 €", false, "Reprend le nombre d’objets sans utiliser le prix de 10 objets."),
        c("27 €", false, "Ajoute 5 € pour 5 objets de plus (22 + 5)."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Calculer une fraction d’une longueur",
    generer: officielle({
      enonce: "Une randonnée cyclotouriste est organisée sur un parcours de 60 km. Un arrêt est prévu au tiers de ce parcours.<br><strong>Quelle est la distance parcourue avant cet arrêt ?</strong>",
      choix: [
        c("10 km", false, "Divise par 6 au lieu de 3 : calcule le sixième du parcours."),
        c("12 km", false, "Divise par 5 au lieu de 3 : calcule le cinquième du parcours."),
        c("15 km", false, "Divise par 4 au lieu de 3 : calcule le quart du parcours."),
        c("20 km", true),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "GM", competence: "Déterminer une superficie sur un plan (avec une légende)",
    generer: officielle({
      enonce: "Le plan de ce terrain indique une zone boisée.",
      figure: figureBois(),
      apres: "<strong>La superficie de la zone boisée est de…</strong>",
      choix: [
        c("9 km²", true),
        c("36 km²", false, "Compte bien les 36 carreaux de la zone boisée, mais ne tient pas compte de la légende."),
        c("60 km²", false, "Compte tous les carreaux du rectangle, sans tenir compte de la légende."),
        c("4 km²", false, "Reprend le carré de la légende (4 carreaux)."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "OGD", competence: "Utiliser une probabilité donnée en pourcentage", disposition: "grille",
    generer: officielle({
      enonce: "Une boite de macarons (biscuits fourrés) contient 3 macarons au café, 3 à la fraise, 6 au chocolat et 4 à la pomme. On prend un macaron les yeux fermés, sans avoir vu la boite auparavant.<br><strong>On a 25 % de chances d’attraper un macaron…</strong>",
      choix: [
        c("au café.", false, "Associe 25 % à « une chance sur 4 » (4 parfums) sans tenir compte du nombre de macarons de chaque parfum."),
        c("au chocolat.", false, "Choisit le parfum le plus représenté, ou associe 25 % à « une chance sur 4 » sans tenir compte du nombre de macarons de chaque parfum."),
        c("à la fraise.", false, "Associe 25 % à « une chance sur 4 » (4 parfums) sans tenir compte du nombre de macarons de chaque parfum."),
        c("à la pomme.", true),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "GM", competence: "Utiliser le périmètre d’un rectangle pour calculer une longueur",
    generer: officielle({
      enonce: "Anna marche 100 m pour faire le tour de son jardin rectangulaire. La longueur de ce jardin est de 30 m.<br><strong>Quelle est la largeur ?</strong>",
      choix: [
        c("35 m", false, "N’enlève qu’une seule longueur : (100 − 30) ÷ 2."),
        c("20 m", true),
        c("25 m", false, "Raisonne comme pour un carré (100 ÷ 4)."),
        c("40 m", false, "Oublie qu’il y a deux largeurs : 100 − 2 × 30."),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "NC", competence: "Additionner des fractions", calculatrice: false,
    generer: officielle({
      enonce: `Tom a mangé ${frac(1, 2)} gâteau. Jean a mangé ${frac(1, 4)} du même gâteau.<br><strong>À eux deux, quelle fraction du gâteau ont-ils mangée ?</strong>`,
      choix: [
        c(frac(2, 6), false, "Additionne les numérateurs entre eux et les dénominateurs entre eux : (1 + 1) sur (2 + 4)."),
        c(frac(2, 4), false, "Additionne les numérateurs et garde le dénominateur 4."),
        c(frac(1, 6), false, "Additionne seulement les dénominateurs : 1 sur (2 + 4)."),
        c(frac(3, 4), true),
      ],
    }),
  });

  Q.push({
    num: 11, domaine: "OGD", competence: "Calculer une quatrième proportionnelle avec une conversion",
    generer: officielle({
      enonce: "Avec 20 L de lait on obtient 1 kg de beurre.<br><strong>Pour obtenir 100 g de beurre, il faut … de lait.</strong>",
      choix: [
        c("2 000 L", false, "Multiplie 20 L par 100."),
        c("20 cL", false, "Divise 20 L par 100, puis convertit en cL."),
        c("200 L", false, "Multiplie 20 L par 10 au lieu de diviser."),
        c("2 L", true),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "OGD", competence: "Résoudre un problème de proportionnalité à deux étapes",
    generer: officielle({
      enonce: "Quand Romain prend sa douche, il ouvre le robinet au maximum pendant 8 minutes et il utilise 80 litres d’eau.<br>Quand il prend un bain, il ouvre le même robinet au maximum pendant 12 minutes.<br><strong>Quel volume d’eau économise-t-il en choisissant de prendre une douche à la place d’un bain ?</strong>",
      choix: [
        c("160 L", false, "Calcule 80 L × 2."),
        c("40 L", true),
        c("10 L", false, "Calcule le débit du robinet (10 L par minute) et s’arrête là."),
        c("120 L", false, "Calcule l’eau utilisée pour le bain et s’arrête là."),
      ],
    }),
  });

  const a = lettre("a"), b = lettre("b");
  Q.push({
    num: 13, domaine: "NC", competence: "Utiliser le calcul littéral pour exprimer une aire",
    generer: officielle({
      enonce: "On considère la figure suivante.",
      figure: figureHachures(),
      apres: `<strong>On souhaite exprimer l’aire de la surface hachurée en fonction de ${a} et ${b}.</strong>`,
      choix: [
        c(`3(${b} ${MOINS} ${a})`, true),
        c(`3(${b} + ${a})`, false, "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur 3."),
        c(`3${a}`, false, "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur 3."),
        c(`3${b}`, false, "N’exprime pas correctement la longueur du rectangle hachuré, mais multiplie bien par la largeur 3."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "GM", competence: "Utiliser l’aire d’un rectangle pour calculer une longueur",
    generer: officielle({
      enonce: "On veut carreler un salon de 56 m².<br>Ce salon a la forme d’un rectangle de longueur 8 m.<br><strong>Quelle est la largeur du salon ?</strong>",
      choix: [
        c("64 m", false, "Additionne les nombres de l’énoncé (56 + 8)."),
        c("14 m", false, "Utilise la formule de l’aire d’un triangle et non d’un rectangle (56 × 2 ÷ 8)."),
        c("7 m", true),
        c("48 m", false, "Soustrait les nombres de l’énoncé (56 − 8)."),
      ],
    }),
  });

  Q.push({
    num: 15, domaine: "GM", competence: "Calculer et comparer des durées (avec une conversion)", disposition: "ligne",
    generer: officielle({
      enonce: "Un ébéniste fabrique des figurines en bois.<br>La réalisation complète d’une figurine nécessite 17 minutes.<br>On lui demande de réaliser 11 figurines en trois heures.<br><strong>Est-ce possible s’il travaille sans interruption ?</strong>",
      choix: [
        c("OUI. Il pourra fabriquer douze figurines.", false, "Compte environ 4 figurines par heure, donc 12 en 3 heures."),
        c("NON. Il pourra fabriquer seulement neuf figurines.", false, "Compte 3 figurines par heure, donc 9 en 3 heures."),
        c("OUI. Il lui faudra moins de deux heures.", false, "Fait un calcul de proportionnalité erroné (17 × 11 ÷ 3, environ 62)."),
        c("NON. Il lui manquera sept minutes.", true),
      ],
    }),
  });

  Q.push({
    num: 16, domaine: "OGD", competence: "Utiliser un pourcentage pour calculer une quantité", disposition: "grille",
    generer: officielle({
      enonce: "Anna lit un livre de 110 pages.<br>Chaque jour elle en lit 10 %.<br><strong>Combien lit-elle de pages en 7 jours ?</strong>",
      choix: [
        c("70 pages", false, "Confond 10 % et 10 pages, puis multiplie bien par 7."),
        c("77 pages", true),
        c("10 pages", false, "Confond 10 % et 10 pages, et donne les pages d’un seul jour."),
        c("11 pages", false, "Calcule bien 10 % de 110 pages, mais s’arrête à un jour."),
      ],
    }),
  });

  Q.push({
    num: 17, domaine: "OGD", competence: "Calculer une quatrième proportionnelle avec une conversion",
    generer: officielle({
      enonce: "Il faut 80 g de fleurs de crocus pour obtenir 1 g de safran.<br><strong>Quelle masse de safran un producteur pourra-t-il produire avec 1 kg de fleurs de crocus ?</strong>",
      choix: [
        c("80 g", false, "Associe 1 g et 1 kg sans tenir compte des unités, et reprend les 80 g de l’énoncé."),
        c("12,5 kg", false, "A la bonne démarche, mais se trompe d’unité pour le résultat."),
        c("12,5 g", true),
        c("80 kg", false, "Associe 1 g et 1 kg, et change seulement l’unité de 80 g."),
      ],
    }),
  });

  Q.push({
    num: 18, domaine: "OGD", competence: "Déterminer un pourcentage",
    generer: officielle({
      enonce: "Dans une fratrie de 5 enfants, un seul est gaucher et les autres sont droitiers.<br><strong>Quel est le pourcentage d’enfants droitiers dans cette fratrie ?</strong>",
      choix: [
        c("80 %", true),
        c("75 %", false, "Compare les gauchers aux droitiers (1 sur 4, soit 25 %), puis prend le complément à 100 %."),
        c("4 %", false, "Confond le nombre d’enfants droitiers et le pourcentage."),
        c("20 %", false, "Calcule le pourcentage d’enfants gauchers : lit mal la question, mais maitrise les pourcentages."),
      ],
    }),
  });

  Q.push({
    num: 19, domaine: "OGD", competence: "Relier un diagramme circulaire et un tableau (proportionnalité)", disposition: "tableaux",
    generer: officielle({
      enonce: "Voici la composition de l’œuf.<br>En moyenne, un œuf pèse 60 g.<br><strong>Lequel des tableaux ci-dessous est correct ?</strong>",
      figure: figureOeuf(),
      figureACote: "grande",
      choix: [
        c(tableau([60, 10, 60, 30], [60, 10, 60, 30]), false, "Reprend les valeurs du diagramme à l’identique."),
        c(tableau([60, 10, 36, 18], [100, 10, 60, 30]), false, "Se trompe pour la masse de la coquille."),
        c(tableau([60, 6, 36, 18], [100, 10, 60, 30]), true),
        c(tableau([60, 6, 60, 30], [100, 10, 60, 30]), false, "Se trompe pour les masses du blanc et du jaune."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["4e-problemes"] = {
    id: "4e-problemes",
    niveau: "4e",
    titre: "Résolution de problèmes",
    annee: 2026,
    source: "DEPP — Évaluation nationale de début de quatrième, septembre 2024, 2025 et 2026 (test spécifique « Résolution de problèmes »), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/evaluations-nationales-4e",
    consignes: "Avec la calculatrice de l’appli. Pour chaque question, une seule réponse est juste.",
    calculatrice: true,
    jumeaux: false,
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures", OGD: "Organisation et gestion de données, fonctions" },
    // Groupes de maîtrise publiés par la DEPP pour ce test (sur 19), section 12.2 — les mêmes en 2024, 2025 et 2026.
    seuils: [{ max: 4, nom: "À besoins" }, { max: 10, nom: "Fragile" }, { max: 19, nom: "Satisfaisant" }],
    officiels: [{ cle: "2026", annee: 2026, titre: "Le sujet officiel", detail: "Les vraies questions. Le même sujet est tombé en 2024, 2025 et 2026." }],
    questions: Q,
    donnees: { TERRAIN, BOIS, PLAN, OEUF },
  };
})(typeof window !== "undefined" ? window : globalThis);
