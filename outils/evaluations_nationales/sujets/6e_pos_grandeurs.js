/* maths&go — Outil de positionnement de 6e, « Grandeurs et mesures » (bibliothèque d'outils de positionnement, Eduscol).
   Source : https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants
   — licence Etalab 2.0. 12 questions, attendus de fin de CM2, repères de la notice ≤ 3 / 4 à 6 / ≥ 7. Sans calculatrice.
   Lot EN5b : le test officiel seulement, à l'identique (énoncés, réponses dans l'ordre de l'outil, figures redessinées ;
   la table de la question 2, une photo dans l'outil, est un dessin simple). Les questions 11 et 12 sont des grilles, comme
   sur le papier : 1 point seulement si les 4 lignes sont justes.
   Bonnes réponses : celles du corrigé Eduscol. Eduscol ne publie pas d'analyse des pièges pour cet outil : les explications
   de la vue prof sont écrites par maths&go (sans mot genré) et restent à relire. Pas de sujet jumeau pour l'instant. */
(function (racine) {
  "use strict";
  const { nb, svg } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const officielle = (contenu) => () => Object.assign({ melange: false }, contenu);
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });
  const INS = " ";
  const f = (x) => +x.toFixed(1);

  // ---------- Figures ----------
  // Q2 : la table carrée (une photo dans l'outil) : le plateau de verre vu en perspective, quatre pieds, la coccinelle sur
  // le bord, la longueur d'un côté (1,5 m) le long du bord du fond.
  const TABLE = { cote: 1.5 };
  function figureTable() {
    const G = [18, 98], B = [142, 52], D = [288, 84], F = [162, 134]; // coins du plateau : gauche, fond, droite, devant
    let s = "";
    const pied = (x, y, l, h, teinte) => `<rect x="${x}" y="${y}" width="${l}" height="${h}" rx="2" fill="${teinte}" stroke="#4d3a2c" stroke-width="1.2"/>`;
    s += pied(126, 66, 34, 76, "#7d6250"); // pied du fond, derrière le verre
    s += pied(66, 96, 36, 86, "#8c6d57");
    s += pied(196, 90, 36, 86, "#7f624e");
    s += `<polygon points="${[G, B, D, F].map((p) => p.join(",")).join(" ")}" fill="#d9eef3" fill-opacity="0.72" stroke="#5f8796" stroke-width="2" stroke-linejoin="round"/>`;
    s += pied(140, 120, 38, 82, "#94735c"); // pied de devant, devant le verre
    // La coccinelle, posée sur le bord gauche du plateau.
    const [cx, cy] = [72, 73];
    s += `<g transform="rotate(-20 ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="9" ry="7.5" fill="#d93a2b" stroke="#1d1d1d" stroke-width="1.2"/><circle cx="${cx + 9}" cy="${cy}" r="3.6" fill="#1d1d1d"/><line x1="${cx - 9}" y1="${cy}" x2="${cx + 6}" y2="${cy}" stroke="#1d1d1d" stroke-width="1"/><circle cx="${cx - 3}" cy="${cy - 3.5}" r="1.6" fill="#1d1d1d"/><circle cx="${cx - 3}" cy="${cy + 3.5}" r="1.6" fill="#1d1d1d"/><circle cx="${cx + 2.5}" cy="${cy - 3.2}" r="1.3" fill="#1d1d1d"/><circle cx="${cx + 2.5}" cy="${cy + 3.2}" r="1.3" fill="#1d1d1d"/></g>`;
    // La cote, parallèle au bord du fond, un peu au-dessus.
    const u = [D[0] - B[0], D[1] - B[1]], L = Math.hypot(...u), n = [u[1] / L, -u[0] / L], dec = 15;
    const P1 = [B[0] + n[0] * dec, B[1] + n[1] * dec], P2 = [D[0] + n[0] * dec, D[1] + n[1] * dec];
    const fl = (P, sens) => { const a = [u[0] / L * sens, u[1] / L * sens]; return `<path d="M${f(P[0])} ${f(P[1])} L${f(P[0] + a[0] * 10 + n[0] * 4.5)} ${f(P[1] + a[1] * 10 + n[1] * 4.5)} L${f(P[0] + a[0] * 10 - n[0] * 4.5)} ${f(P[1] + a[1] * 10 - n[1] * 4.5)} Z" fill="#111"/>`; };
    s += `<line x1="${f(P1[0])}" y1="${f(P1[1])}" x2="${f(P2[0])}" y2="${f(P2[1])}" stroke="#111" stroke-width="1.6"/>` + fl(P1, 1) + fl(P2, -1);
    const M = [(P1[0] + P2[0]) / 2 + n[0] * 11, (P1[1] + P2[1]) / 2 + n[1] * 11], angle = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
    s += `<text x="${f(M[0])}" y="${f(M[1])}" font-size="18" text-anchor="middle" fill="#111" transform="rotate(${f(angle)} ${f(M[0])} ${f(M[1])})">1,5${INS}m</text>`;
    return svg(300, 208, s, "Table carrée vue en perspective : un côté du plateau mesure 1,5 m ; une coccinelle est posée sur le bord", 300);
  }

  // Q4 : un carré de 5 carreaux sur 5 sur un quadrillage (les traits du quadrillage dépassent un peu autour, comme sur l'outil).
  const CARRE = { cote: 5 };
  function figureCarre() {
    const P = 30, g = 0.7 * P, h = 0.7 * P, d = 0.6 * P, b = 0.35 * P, n = CARRE.cote, W = g + n * P + d, H = h + n * P + b;
    let s = `<rect x="${g}" y="${h}" width="${n * P}" height="${n * P}" fill="#e1def3"/>`;
    for (let i = 0; i <= n; i++) {
      s += `<line x1="${f(g + i * P)}" y1="0" x2="${f(g + i * P)}" y2="${f(H)}" stroke="#aab4be" stroke-width="1"/>`;
      s += `<line x1="0" y1="${f(h + i * P)}" x2="${f(W)}" y2="${f(h + i * P)}" stroke="#aab4be" stroke-width="1"/>`;
    }
    s += `<rect x="${g}" y="${h}" width="${n * P}" height="${n * P}" fill="none" stroke="#3b4bb0" stroke-width="2.5"/>`;
    return svg(f(W), f(H), s, `Carré de ${n} carreaux sur ${n} carreaux dessiné sur un quadrillage`, 210);
  }

  // Q11 : le poisson sur un quadrillage de 9 × 5 carreaux ; quatre angles codés (M, O, N, E).
  const POISSON = {
    sommets: [[1, 1], [3, 2], [4, 1], [7, 1], [8.5, 2.5], [7, 4], [4, 4], [3, 3], [2, 3], [1, 4]],
    noms: { N: 0, O: 4, M: 6, E: 9 },
  };
  function figurePoisson() {
    const P = 40, m = 6, X = (x) => f(m + x * P), Y = (y) => f(m + y * P), S = POISSON.sommets, n = S.length;
    let s = `<rect x="${m}" y="${m}" width="${9 * P}" height="${5 * P}" fill="#fff"/>`;
    for (let i = 0; i <= 9; i++) s += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(5)}" stroke="#b8c0c8" stroke-width="2"/>`;
    for (let j = 0; j <= 5; j++) s += `<line x1="${X(0)}" y1="${Y(j)}" x2="${X(9)}" y2="${Y(j)}" stroke="#b8c0c8" stroke-width="2"/>`;
    // Les codages, sous le contour.
    const dir = (k, voisin) => { const a = S[k], b = S[(k + voisin + n) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    const secteur = (k, r, teinte) => {
      const [x, y] = S[k], u = dir(k, -1), v = dir(k, 1);
      let delta = Math.atan2(v[1], v[0]) - Math.atan2(u[1], u[0]);
      while (delta <= -Math.PI) delta += 2 * Math.PI;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      return `<path d="M${X(x)} ${Y(y)} L${X(x + u[0] * r)} ${Y(y + u[1] * r)} A${f(r * P)} ${f(r * P)} 0 0 ${delta > 0 ? 1 : 0} ${X(x + v[0] * r)} ${Y(y + v[1] * r)} Z" fill="${teinte}"/>`;
    };
    const { N, O, M, E } = POISSON.noms;
    s += secteur(N, 0.72, "#3d7cc9") + secteur(E, 0.68, "#f0b323") + secteur(M, 0.6, "#e0393e");
    { // angle droit en O : un petit carré plein
      const [x, y] = S[O], u = dir(O, -1), v = dir(O, 1), a = 0.42;
      s += `<polygon points="${[[x, y], [x + u[0] * a, y + u[1] * a], [x + (u[0] + v[0]) * a, y + (u[1] + v[1]) * a], [x + v[0] * a, y + v[1] * a]].map(([p, q]) => `${X(p)},${Y(q)}`).join(" ")}" fill="#111"/>`;
    }
    s += `<polygon points="${S.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}" fill="none" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/>`;
    const lettre = (t, x, y) => `<text x="${X(x)}" y="${Y(y)}" font-size="19" font-weight="700" text-anchor="middle" fill="#111">${t}</text>`;
    s += lettre("N", 0.72, 0.82) + lettre("E", 0.72, 4.62) + lettre("M", 3.66, 4.58) + lettre("O", 8.92, 2.68);
    return svg(9 * P + 2 * m, 5 * P + 2 * m, s, "Figure en forme de poisson sur un quadrillage, avec quatre angles codés aux sommets M, O, N et E", 420);
  }

  // Q12 : quatre figures sur un quadrillage (un grand carreau = 5 petits) ; coordonnées en grands carreaux.
  const FIGURES = {
    A: [[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1]],
    B: [[4, 0], [8, 0], [8, 2], [4, 2]],
    C: [[0, 4], [6, 4], [6, 5], [0, 5]],
    D: [[7, 3], [9, 3], [9, 6], [7, 6]],
  };
  function figureFigures() {
    const U = 36, gx = 0.5, gy = 0.35, X = (x) => f((x + gx) * U), Y = (y) => f((y + gy) * U), W = (gx + 9.85) * U, H = (gy + 6.35) * U;
    let s = "";
    for (let i = -2; i * 0.2 <= 9.85; i++) { const x = i * 0.2; if (x >= -gx) s += `<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${f(H)}" stroke="${i % 5 === 0 ? "#b4bcc5" : "#e6e9ed"}" stroke-width="1"/>`; }
    for (let j = -1; j * 0.2 <= 6.35; j++) { const y = j * 0.2; if (y >= -gy) s += `<line x1="0" y1="${Y(y)}" x2="${f(W)}" y2="${Y(y)}" stroke="${j % 5 === 0 ? "#b4bcc5" : "#e6e9ed"}" stroke-width="1"/>`; }
    const centre = { A: [1.5, 1.45], B: [6, 0.85], C: [3, 4.5], D: [8, 4.5] };
    for (const [nom, pts] of Object.entries(FIGURES)) {
      s += `<polygon points="${pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}" fill="#e1def3" fill-opacity="0.85" stroke="#3b4bb0" stroke-width="2"/>`;
      s += `<text x="${X(centre[nom][0])}" y="${f(Y(centre[nom][1]) + 6)}" font-size="15" text-anchor="middle" fill="#111">Figure ${nom}</text>`;
    }
    return svg(f(W), f(H), s, "Quatre figures sur un quadrillage : une croix (A), un rectangle (B), une bande (C) et un rectangle debout (D)", 420);
  }

  const Q = [];

  Q.push({
    num: 1, domaine: "GM", competence: "Choisir l’unité de longueur qui convient",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "Quelle est l’unité qui convient pour compléter la phrase suivante ?<br><strong>Le pied d’un adulte peut mesurer 30…</strong>",
      choix: [
        c("mm.", false, "N’a pas de repère de longueur (30 mm, c’est la longueur d’un pouce)."),
        c("dm.", false, "N’a pas de repère pour le décimètre (30 dm, c’est 3 m)."),
        c("cm.", true),
        c("m.", false, "N’a pas de repère de longueur (30 m, c’est plus que la longueur de deux bus)."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "GM", competence: "Calculer le périmètre d’un carré",
    entrainement: AUTO("EG08", "Périmètres"),
    generer: officielle({
      figureACote: "grande",
      enonce: "Une coccinelle fait le tour de cette table carrée.<br><strong>Quelle distance parcourt-elle ?</strong>",
      figure: figureTable(),
      choix: [
        c(`6${INS}m`, true),
        c("1,5 m", false, "Donne la longueur d’un côté de la table au lieu du tour entier."),
        c("3 m", false, "Ajoute deux côtés seulement : un demi-tour de la table."),
        c("4,20 m", false, "Se trompe en multipliant le nombre décimal : calcule 4 × 1,5 comme 4 × 1,05."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "GM", competence: "Calculer une durée à partir de deux horaires",
    entrainement: AUTO("GM03", "Durées et horaires"),
    generer: officielle({
      enonce: `Akram part de chez lui à 8${INS}h${INS}47.<br>Il arrive à 9${INS}h${INS}10 au collège.<br><strong>Combien dure le trajet entre chez lui et le collège ?</strong>`,
      choix: [
        c(`23${INS}minutes`, true),
        c(`13${INS}minutes`, false, `Compte le temps jusqu’à 9 h (13${INS}minutes) et oublie les 10${INS}minutes après 9 h.`),
        c(`37${INS}minutes`, false, "Soustrait les nombres de minutes (47 − 10 = 37) sans tenir compte du changement d’heure."),
        c(`57${INS}minutes`, false, "Ajoute les nombres de minutes (47 + 10 = 57)."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "GM", competence: "Calculer l’aire d’un carré sur un quadrillage",
    entrainement: AUTO("EG09", "Aires"),
    generer: officielle({
      figureACote: "grande",
      enonce: "Un carré est dessiné sur un quadrillage.<br>Chaque carreau de ce quadrillage mesure 1 cm de côté.<br><strong>Quelle est l’aire de ce carré en cm² ?</strong>",
      figure: figureCarre(),
      choix: [
        c("25 cm²", true),
        c("12,5 cm²", false, "Calcule 5 × 5, puis divise par 2, comme pour l’aire d’un triangle."),
        c("16 cm²", false, "Compte seulement les carreaux du bord du carré."),
        c("20 cm²", false, "Calcule le périmètre (4 × 5 = 20) au lieu de l’aire."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "GM", competence: "Trouver le côté d’un carré connaissant son périmètre",
    entrainement: AUTO("EG08", "Périmètres"),
    generer: officielle({
      enonce: "Quelle est la longueur du côté d’un carré qui a un périmètre de 40 cm ?",
      choix: [
        c("5 cm", false, "Divise le périmètre par 8 au lieu de 4."),
        c("20 cm", false, "Divise le périmètre par 2, comme si le carré n’avait que deux côtés."),
        c("10 cm", true),
        c("4 cm", false, "Confond le nombre de côtés du carré (4) avec la longueur d’un côté."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "GM", competence: "Comparer des contenances (demi-litre et millilitres)",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      disposition: "ligne",
      enonce: "Olympe a besoin de 600 mL de lait pour faire des crêpes.<br>Elle a un demi-litre de lait.<br><strong>A-t-elle assez de lait ?</strong>",
      choix: [
        c("Elle a exactement assez de lait pour sa recette.", false, "Ne sait pas qu’un demi-litre vaut 500 mL."),
        c("On ne peut pas savoir.", false, "Ne sait pas comparer des contenances écrites avec des unités différentes."),
        c("Elle n’a pas assez de lait.", true),
        c("Elle a plus de lait que ce qu’il lui faut.", false, "Ne convertit pas : pense qu’un demi-litre est plus que 600 mL."),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "GM", competence: "Connaître les relations entre unités de longueur (hectomètre)",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "Alain demande à Michèle :<br><strong>« 1 hm c’est combien de fois plus grand que 1 m ? »</strong>",
      choix: [
        c(`${nb(10000)} fois`, false, "Ne connaît pas la valeur du préfixe « hecto » : ne sait pas que 1 hm = 100 m."),
        c("10 fois", false, "Confond hectomètre et décamètre."),
        c("100 fois", true),
        c(`${nb(1000)} fois`, false, "Confond hectomètre et kilomètre."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "GM", competence: "Convertir des kilogrammes en grammes",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "<strong>6 kg = …</strong>",
      choix: [
        c("600 g", false, `Multiplie par 100 au lieu de ${nb(1000)} : confond kilogramme et hectogramme.`),
        c(`${nb(60000)}${INS}g`, false, `Multiplie par ${nb(10000)} : écrit un zéro de trop.`),
        c("60 g", false, `Multiplie par 10 au lieu de ${nb(1000)}.`),
        c(`${nb(6000)}${INS}g`, true),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "GM", competence: "Comparer des longueurs exprimées dans des unités différentes",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "Parmi ces longueurs, laquelle est la plus grande ?",
      choix: [
        c("5,15 m", false, "Compare les nombres sans regarder les unités, et pense que 5,15 est plus grand que 5,2 (plus de chiffres)."),
        c("2,3 km", true),
        c("2,25 km", false, "Voit les kilomètres, mais pense que 2,25 est plus grand que 2,3 (plus de chiffres après la virgule)."),
        c("5,2 m", false, "Compare les nombres sans regarder les unités : 5,2 est le plus grand nombre écrit."),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "GM", competence: "Connaître les relations entre unités de contenance (décilitre)",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "Quelle contenance est égale à 1 L ?",
      choix: [
        c("100 dL", false, "Confond décilitre et centilitre (1 L = 100 cL)."),
        c(`${nb(10000)}${INS}dL`, false, "Ne connaît pas le lien entre le litre et le décilitre : écrit des zéros sans repère."),
        c(`${nb(1000)}${INS}dL`, false, `Confond décilitre et millilitre (1 L = ${nb(1000)} mL).`),
        c("10 dL", true),
      ],
    }),
  });

  Q.push({
    num: 11, domaine: "GM", competence: "Reconnaître un angle aigu, droit ou obtus",
    entrainement: AUTO("EG06", "Angles et configurations"),
    generer: officielle({
      enonce: "Chaque angle codé est-il aigu, droit ou obtus ?",
      figure: figurePoisson(),
      apres: "Cocher « Aigu », « Droit » ou « Obtus » pour chaque ligne.",
      grille: {
        colonnes: ["Aigu", "Droit", "Obtus"],
        lignes: [
          { html: "Angle de sommet\u00a0M", juste: 2, erreurs: ["Confond angle aigu et angle obtus.", "Juge l’angle sans le comparer à l’angle droit d’une équerre.", ""] },
          { html: "Angle de sommet\u00a0O", juste: 1, erreurs: ["Ne reconnaît pas le codage de l’angle droit (le petit carré).", "", "Ne reconnaît pas le codage de l’angle droit (le petit carré)."] },
          { html: "Angle de sommet\u00a0N", juste: 0, erreurs: ["", "Juge l’angle sans le comparer à l’angle droit d’une équerre.", "Confond angle aigu et angle obtus."] },
          { html: "Angle de sommet\u00a0E", juste: 0, erreurs: ["", "Pense que l’angle est droit parce qu’un de ses côtés suit le quadrillage.", "Confond angle aigu et angle obtus."] },
        ],
      },
    }),
  });

  Q.push({
    num: 12, domaine: "GM", competence: "Distinguer périmètre et aire",
    entrainement: AUTO("EG09", "Aires"),
    generer: officielle({
      enonce: "",
      figure: figureFigures(),
      apres: "Cocher Vrai ou Faux pour chaque ligne", // sans point, comme dans l’outil
      grille: {
        colonnes: ["Vrai", "Faux"],
        lignes: [
          { html: "Les figures A et B ont le même périmètre.", juste: 0, erreurs: ["", "Pense que deux figures de formes différentes ne peuvent pas avoir le même périmètre."] },
          { html: "Les figures A et B ont la même aire.", juste: 1, erreurs: ["Confond aire et périmètre : même périmètre, donc même aire.", ""] },
          { html: "Les figures C et D ont le même périmètre.", juste: 1, erreurs: ["Confond aire et périmètre : même aire, donc même périmètre.", ""] },
          { html: "Les figures C et D ont la même aire.", juste: 0, erreurs: ["", "Pense que deux figures de formes différentes ne peuvent pas avoir la même aire."] },
        ],
      },
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-pos-grandeurs"] = {
    id: "6e-pos-grandeurs",
    niveau: "6e",
    famille: "Outil de positionnement",
    titre: "Grandeurs et mesures",
    annee: 2026,
    source: "Bibliothèque d’outils de positionnement, classe de 6e, « Grandeurs et mesures » (attendus de fin de CM2), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste (dans une grille : une case par ligne).",
    // Pas encore de sujet jumeau (lot EN5b) : ni carte « Un sujet jumeau », ni « Refaire mes questions ratées ».
    jumeaux: false,
    domaines: { GM: "Grandeurs et mesures" },
    // Groupes de maîtrise de la notice Eduscol (sur 12).
    seuils: [{ max: 3, nom: "À besoins" }, { max: 6, nom: "Fragile" }, { max: 12, nom: "Satisfaisant" }],
    officiels: [{ cle: "outil", annee: 2026, titre: "Le test officiel", detail: "Les 12 vraies questions de l’outil de positionnement Eduscol." }],
    questions: Q,
    // Pour les tests : les données des figures, relues pour recalculer les bonnes réponses.
    donnees: { TABLE, CARRE, POISSON, FIGURES },
  };
})(typeof window !== "undefined" ? window : globalThis);
