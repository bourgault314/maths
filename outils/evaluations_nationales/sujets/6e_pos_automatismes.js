/* maths&go — Outil de positionnement de 6e, « Automatismes » (bibliothèque d'outils de positionnement, Eduscol).
   Source : https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants
   — licence Etalab 2.0. 21 questions, attendus de fin de CM2, repères de la notice ≤ 5 / 6 à 11 / ≥ 12. Sans calculatrice.
   Lot EN5a : le test officiel seulement, à l'identique (énoncés, réponses dans l'ordre de l'outil, figures redessinées).
   Bonnes réponses : celles du corrigé Eduscol. Eduscol ne publie pas d'analyse des pièges pour cet outil : les explications
   de la vue prof sont écrites par maths&go (sans mot genré) et restent à relire. Pas de sujet jumeau pour l'instant. */
(function (racine) {
  "use strict";
  const { nb, frac, svg, quadrillage, COUL } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const officielle = (contenu) => () => Object.assign({ melange: false }, contenu);
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });

  // ---------- Figures ----------
  // Q8 : rectangle de 2 × 6 carreaux sur un quadrillage (un carreau de marge autour, coupé à moitié comme sur l'outil).
  const RECTANGLE = { largeur: 2, hauteur: 6 };
  function figureRectangle() {
    const P = 30, m = 15, L = RECTANGLE.largeur, H = RECTANGLE.hauteur;
    const W = L * P + 2 * m, Ht = H * P + 2 * m;
    // Le rectangle est grisé, mais on voit le quadrillage à travers (on compte les carreaux, comme sur l'outil).
    let s = `<rect x="${m}" y="${m}" width="${L * P}" height="${H * P}" fill="#e3e6ea"/>`;
    for (let i = 0; i <= L; i++) s += `<line x1="${m + i * P}" y1="0" x2="${m + i * P}" y2="${Ht}" stroke="#aab4be" stroke-width="1"/>`;
    for (let j = 0; j <= H; j++) s += `<line x1="0" y1="${m + j * P}" x2="${W}" y2="${m + j * P}" stroke="#aab4be" stroke-width="1"/>`;
    s += `<rect x="${m}" y="${m}" width="${L * P}" height="${H * P}" fill="none" stroke="#111" stroke-width="2"/>`;
    s += `<text x="${m + (L * P) / 2}" y="${m + 2.85 * P}" font-size="11" text-anchor="middle" fill="#333">rectangle</text>`;
    return svg(W, Ht, s, `Rectangle de ${L} carreaux sur ${H} carreaux dessiné sur un quadrillage`, 130);
  }

  // Demi-droite graduée : graduations régulières, quelques-unes en gras, des nombres écrits dessous, une lettre dessus.
  // grads : nombre de graduations ; avant : longueur de trait avant la première ; ecrits : [rang, texte] ; grasses : rangs.
  // Deux tailles d'écriture : une pour l'ordinateur, une plus grosse pour le téléphone (la droite y est réduite de moitié).
  function demiDroite(o) {
    return dessinDroite(o, 20).replace('class="figure"', 'class="figure mot-ordi"') + dessinDroite(o, 30).replace('class="figure"', 'class="figure mot-tel"');
  }
  function dessinDroite({ grads, pas, avant, apres, ecrits, grasses, lettre, etiquette }, taille) {
    const x0 = 10 + avant, y = 16 + taille * 1.5, X = (k) => +(x0 + k * pas).toFixed(1);
    let s = `<line x1="10" y1="${y}" x2="${X(grads - 1) + apres}" y2="${y}" stroke="#8a96a3" stroke-width="2"/>`;
    for (let k = 0; k < grads; k++) {
      const g = grasses.includes(k);
      s += `<line x1="${X(k)}" y1="${y - (g ? 11 : 8)}" x2="${X(k)}" y2="${y + (g ? 11 : 8)}" stroke="${g ? "#111" : "#8a96a3"}" stroke-width="${g ? 2.6 : 1.6}"/>`;
    }
    for (const [k, t] of ecrits) s += `<text x="${X(k)}" y="${y + 16 + taille}" font-size="${taille}" text-anchor="middle" fill="#111">${t}</text>`;
    s += `<text x="${X(lettre[0])}" y="${y - 18}" font-size="${taille}" font-weight="700" text-anchor="middle" fill="#111">${lettre[1]}</text>`;
    return svg(X(grads - 1) + apres + 10, y + 26 + taille, s, etiquette, 620);
  }
  // Q9 : de 495 000 à 570 000 de 5 000 en 5 000 ; 500 000 et 530 000 écrits ; B sur la 12e graduation.
  const DROITE_B = { depart: 495000, pas: 5000, rangB: 11, ecrits: [1, 7] };
  const figureB = () => demiDroite({
    grads: 16, pas: 40, avant: 30, apres: 18, grasses: [1, 7, 11],
    ecrits: DROITE_B.ecrits.map((k) => [k, nb(DROITE_B.depart + k * DROITE_B.pas)]), lettre: [DROITE_B.rangB, "B"],
    etiquette: "Demi-droite graduée : 500 000 et 530 000 sont écrits, le point B est sur une graduation",
  });
  // Q12 : de 4 à 5,05 de 0,05 en 0,05 ; 4, 4,1, 4,2 et 5 écrits ; M sur la 11e graduation.
  const DROITE_M = { depart: 4, pas: 0.05, rangM: 10, ecrits: [0, 2, 4, 20] };
  const figureM = () => demiDroite({
    grads: 22, pas: 27, avant: 22, apres: 12, grasses: [0, 20],
    ecrits: DROITE_M.ecrits.map((k) => [k, nb(Math.round((DROITE_M.depart + k * DROITE_M.pas) * 100) / 100)]), lettre: [DROITE_M.rangM, "M"],
    etiquette: "Demi-droite graduée de 4 à 5 : 4 ; 4,1 ; 4,2 et 5 sont écrits, le point M est sur une graduation",
  });

  const Q = [];

  Q.push({
    num: 1, domaine: "NC", competence: "Écrire un nombre à partir de ses chiffres (centaines, unités)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: "Quel nombre a 3 pour chiffre des centaines et 9 pour chiffre des unités ?",
      choix: [
        c("3009", false, "Place le 3 au rang des unités de mille."),
        c("9,03", false, "Écrit les deux chiffres dans le désordre et confond centaines et centièmes."),
        c("309", true),
        c("9,300", false, "Écrit les deux chiffres dans le désordre, avec une virgule."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "GM", competence: "Choisir l’unité de longueur qui convient",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "Quelle unité convient pour compléter la phrase suivante ?<br><strong>La largeur d’une salle de classe peut mesurer 6…</strong>",
      choix: [
        c("dm.", false, "N’a pas de repère pour le décimètre (6 dm, c’est la largeur d’une table)."),
        c("m.", true),
        c("cm.", false, "N’a pas de repère de longueur (6 cm, c’est moins qu’un doigt)."),
        c("mm.", false, "N’a pas de repère de longueur (6 mm, c’est l’épaisseur d’un crayon)."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "NC", competence: "Écrire en chiffres un grand nombre donné en lettres",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: "Quelle est l’écriture en chiffres du nombre ci-dessous ?<br><strong>trente-huit-millions</strong>",
      choix: [
        c("30 800 000", false, "Écrit « trente » puis « huit » l’un après l’autre, sans lire « trente-huit millions » comme un tout."),
        c("38 000", false, "Confond millions et milliers."),
        c("38 000 000", true),
        c("30 000 008", false, "Écrit « trente millions » puis place le 8 au rang des unités."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "GM", competence: "Choisir l’unité de masse qui convient",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      disposition: "ligne",
      enonce: "Par quelle unité peut-on compléter la phrase suivante ?<br><strong>Une araignée pèse…</strong>",
      choix: [
        c("1 gramme (g).", true),
        c("1 kilogramme (kg).", false, "Choisit une unité de masse sans repère de grandeur (1 kg, c’est un paquet de sucre)."),
        c("1 millimètre (mm).", false, "Pense à la petite taille de l’araignée : confond masse et longueur."),
        c("1 litre (L).", false, "Ne distingue pas masse et contenance."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "NC", competence: "Comparer deux grands nombres entiers",
    entrainement: AUTO("NC02", "Comparer des nombres"),
    generer: officielle({
      disposition: "ligne",
      enonce: "Choisir la proposition qui permet de compléter la phrase suivante :<br><strong>1 234 567 est … 999 999.</strong>",
      choix: [
        c("« égal à »", false, "Répond au hasard, sans comparer."),
        c("« inférieur à »", false, "Compare les premiers chiffres (1 et 9) au lieu du nombre de chiffres."),
        c("« supérieur à »", true),
        c("On ne peut pas savoir.", false, "Ne sait pas comparer des nombres qui n’ont pas le même nombre de chiffres."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Connaître les tables de multiplication",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer: officielle({
      enonce: "<strong>7 × 8 = …</strong>",
      choix: [
        c("72", false, "Confond avec 8 × 9 ou 9 × 8."),
        c("56", true),
        c("54", false, "Confond avec 6 × 9."),
        c("48", false, "Confond avec 6 × 8."),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "NC", competence: "Connaître le rang des dixièmes",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: "Dans le nombre <strong>276,13</strong> le chiffre des dixièmes est…",
      choix: [
        c("1", true),
        c("6", false, "Confond dixièmes et unités."),
        c("7", false, "Confond dixièmes et dizaines."),
        c("3", false, "Confond dixièmes et centièmes (prend le dernier chiffre)."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "GM", competence: "Calculer le périmètre d’un rectangle sur un quadrillage",
    entrainement: AUTO("EG08", "Périmètres"),
    generer: () => ({
      melange: false,
      enonce: "Un rectangle est dessiné sur un quadrillage.<br>Dans ce quadrillage, chaque carreau fait 1 cm de côté.<br><strong>Quel est le périmètre, en centimètres, de ce rectangle ?</strong>",
      figure: figureRectangle(),
      choix: [
        c("6 cm", false, "Ne compte que la longueur."),
        c("8 cm", false, "Ajoute la longueur et la largeur sans les doubler (demi-périmètre)."),
        c("16 cm", true),
        c("32 cm", false, "Compte chaque côté deux fois : double le périmètre."),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "NC", competence: "Repérer un grand nombre entier sur une demi-droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer: () => ({
      melange: false, disposition: "grille",
      enonce: "Voici une demi-droite graduée :",
      figure: figureB(),
      apres: "<strong>Quel est le nombre repéré par la lettre B ?</strong>",
      choix: [
        c("515 000", false, "Prend un nombre entre 500 000 et 530 000 : ne voit pas que B est après 530 000."),
        c("585 000", false, "Ajoute à 530 000 toutes les graduations comptées depuis le début de la demi-droite (11 × 5 000)."),
        c("570 000", false, "Compte les graduations de 10 000 en 10 000 après 530 000 (4 graduations)."),
        c("550 000", true),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "GM", competence: "Reconnaître une unité d’aire",
    entrainement: AUTO("EG09", "Aires"),
    generer: officielle({
      enonce: "Parmi ces unités, <strong>laquelle mesure des aires ?</strong>",
      choix: [
        c("dm³", false, "Confond unité d’aire et unité de volume."),
        c("m²", true),
        c("cm", false, "Confond aire et longueur."),
        c("L", false, "Confond aire et contenance."),
      ],
    }),
  });

  Q.push({
    num: 11, domaine: "GM", competence: "Calculer le périmètre d’un carré",
    entrainement: AUTO("EG08", "Périmètres"),
    generer: officielle({
      enonce: "Quel est le périmètre d’un carré de 5 cm de côté ?",
      choix: [
        c("10 cm", false, "Ne compte que deux côtés."),
        c("15 cm", false, "Ne compte que trois côtés."),
        c("25 cm", false, "Confond périmètre et aire (5 × 5)."),
        c("20 cm", true),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "NC", competence: "Repérer un nombre décimal sur une demi-droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer: () => ({
      melange: false, disposition: "grille",
      enonce: "Observer cette demi-droite graduée.",
      figure: figureM(),
      apres: "<strong>Quelle est l’abscisse du point M ?</strong>",
      choix: [
        c("4,8", false, "Compte de 0,1 en 0,1 après 4,2 : 6 graduations, 4,2 + 0,6."),
        c("4,5", true),
        c("4,9", false, "Compte de 0,1 en 0,1 après 4,1 : 8 graduations, 4,1 + 0,8."),
        c("4,6", false, "Compte les 6 graduations après 4,2, mais les ajoute à 4 (4 + 0,6)."),
      ],
    }),
  });

  Q.push({
    num: 13, domaine: "NC", competence: "Passer d’une fraction décimale à l’écriture décimale",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      enonce: `Quel nombre est égal à la fraction ${frac(562, 10)} ?`,
      choix: [
        c("56,2", true),
        c("0,562", false, "Divise par 1 000 au lieu de 10."),
        c("5 620", false, "Multiplie par 10 au lieu de diviser."),
        c("5,62", false, "Divise par 100 au lieu de 10."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "GM", competence: "Convertir des longueurs (mm et cm)",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "<strong>750 mm = …</strong>",
      choix: [
        c("7,5 cm", false, "Divise par 100, comme pour passer en mètres."),
        c("75 cm", true),
        c("0,75 cm", false, "Divise par 1 000, comme pour passer en mètres."),
        c("7 500 cm", false, "Multiplie par 10 au lieu de diviser."),
      ],
    }),
  });

  Q.push({
    num: 15, domaine: "NC", competence: "Comparer des nombres décimaux",
    entrainement: AUTO("NC02", "Comparer des décimaux"),
    generer: officielle({
      enonce: "Quel est <strong>le plus petit</strong> nombre parmi les suivants ?",
      choix: [
        c("0,102", true),
        c("0,12", false, "Compare les parties décimales comme des nombres entiers (12 < 102 < 110), sans tenir compte de 0,2."),
        c("0,2", false, "Pense que le nombre qui a le moins de chiffres est le plus petit."),
        c("0,110", false, "Compare les parties décimales comme des nombres entiers (102 < 110)."),
      ],
    }),
  });

  Q.push({
    num: 16, domaine: "GM", competence: "Convertir des contenances (mL et L)",
    entrainement: AUTO("GM01", "Unités de longueur, masse et capacité"),
    generer: officielle({
      enonce: "Quel nombre permet de compléter cette égalité ?<br><strong>1 300 mL = … L</strong>",
      choix: [
        c("130", false, "Divise par 10 au lieu de 1 000."),
        c("0,13", false, "Divise par 10 000 au lieu de 1 000."),
        c("13", false, "Divise par 100 au lieu de 1 000."),
        c("1,3", true),
      ],
    }),
  });

  Q.push({
    num: 17, domaine: "GM", competence: "Convertir des prix (euros et centimes)",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      disposition: "ligne",
      enonce: "Comment peut-on compléter la phrase suivante ?<br><strong>4,03 euros vaut…</strong>",
      choix: [
        c("40,3 centimes d’euros.", false, "Multiplie par 10 au lieu de 100."),
        c("4,03 centimes d’euros.", false, "Garde le même nombre en changeant seulement l’unité."),
        c("403 centimes d’euros.", true),
        c("4030 centimes d’euros.", false, "Multiplie par 1 000 au lieu de 100, ou « enlève la virgule » et ajoute un 0."),
      ],
    }),
  });

  Q.push({
    num: 18, domaine: "NC", competence: "Comparer des fractions de même numérateur",
    entrainement: AUTO("NC10", "Comparer et encadrer des fractions"),
    generer: officielle({
      enonce: "Quel est <strong>le plus grand</strong> nombre parmi les nombres suivants ?",
      disposition: "ligne",
      choix: [
        c(frac(1, 2), true),
        c(frac(1, 3), false, "Ne sait pas comparer des fractions de même numérateur."),
        c(frac(1, 4), false, "Ne sait pas comparer des fractions de même numérateur."),
        c(frac(1, 5), false, "Pense qu’un plus grand dénominateur donne une plus grande fraction (choisit le plus grand : 5)."),
      ],
    }),
  });

  Q.push({
    num: 19, domaine: "NC", competence: "Multiplier un nombre décimal par un entier",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer: officielle({
      enonce: "<strong>5,3 × 4 = …</strong>",
      choix: [
        c("201,2", false, "Multiplie chaque partie séparément et colle les résultats : 5 × 4 = 20, 3 × 4 = 12 → « 20 » et « 1,2 »."),
        c("20,12", false, "Multiplie la partie entière et la partie décimale séparément (5 × 4 = 20 ; 3 × 4 = 12) et les met de part et d’autre de la virgule."),
        c("12,20", false, "Multiplie les deux parties séparément puis les écrit dans le désordre."),
        c("21,2", true),
      ],
    }),
  });

  Q.push({
    num: 20, domaine: "NC", competence: "Connaître les relations entre unités de numération (centaines)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      disposition: "ligne",
      enonce: "<strong>24 centaines</strong> c’est…",
      choix: [
        c("2 400", true),
        c("0,24", false, "Confond centaines et centièmes."),
        c("240 unités", false, "Multiplie par 10 au lieu de 100 (confond avec 24 dizaines)."),
        c("2 dizaines 4 unités", false, "Lit seulement les chiffres de 24, sans tenir compte des centaines."),
      ],
    }),
  });

  Q.push({
    num: 21, domaine: "NC", competence: "Décomposer une fraction en un entier et une fraction inférieure à 1",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      enonce: `Parmi les décompositions suivantes, laquelle est égale à ${frac(11, 6)} ?`,
      disposition: "ligne",
      choix: [
        c(`11 + ${frac(1, 6)}`, false, "Sépare les deux nombres de la fraction : garde 11 et met 1 au numérateur."),
        c(`2 + ${frac(5, 6)}`, false, "Trouve bien les 5 sixièmes qui restent, mais se trompe sur la partie entière."),
        c(`1 + ${frac(5, 6)}`, true),
        c(`10 + ${frac(1, 6)}`, false, "Décompose le numérateur (11 = 10 + 1) sans tenir compte du dénominateur."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-pos-automatismes"] = {
    id: "6e-pos-automatismes",
    niveau: "6e",
    famille: "Outil de positionnement",
    titre: "Automatismes",
    annee: 2026,
    source: "Bibliothèque d’outils de positionnement, classe de 6e, « Automatismes » (attendus de fin de CM2), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste.",
    // Pas encore de sujet jumeau (lot EN5a) : ni carte « Un sujet jumeau », ni « Refaire mes questions ratées ».
    jumeaux: false,
    domaines: { NC: "Nombres et calculs", GM: "Grandeurs et mesures" },
    // Groupes de maîtrise de la notice Eduscol (sur 21).
    seuils: [{ max: 5, nom: "À besoins" }, { max: 11, nom: "Fragile" }, { max: 21, nom: "Satisfaisant" }],
    officiels: [{ cle: "outil", annee: 2026, titre: "Le test officiel", detail: "Les 21 vraies questions de l’outil de positionnement Eduscol." }],
    questions: Q,
    // Pour les tests : les données des figures, relues pour recalculer les bonnes réponses.
    donnees: { RECTANGLE, DROITE_B, DROITE_M },
  };
})(typeof window !== "undefined" ? window : globalThis);
