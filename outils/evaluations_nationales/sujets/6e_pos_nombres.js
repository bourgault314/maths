/* maths&go — Outil de positionnement de 6e, « Nombres et calculs » (bibliothèque d'outils de positionnement, Eduscol).
   Source : https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants
   — licence Etalab 2.0. 19 questions, attendus de fin de CM2, repères de la notice ≤ 5 / 6 à 10 / ≥ 11. Sans calculatrice.
   Lot EN5b : le test officiel seulement, à l'identique (énoncés, réponses dans l'ordre de l'outil, figures redessinées).
   La question 12 est une grille Vrai / Faux, comme sur le papier : 1 point seulement si les 4 lignes sont justes.
   Bonnes réponses : celles du corrigé Eduscol. Eduscol ne publie pas d'analyse des pièges pour cet outil : les explications
   de la vue prof sont écrites par maths&go (sans mot genré) et restent à relire. Pas de sujet jumeau pour l'instant. */
(function (racine) {
  "use strict";
  const { nb, frac, svg } = racine.EN;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const officielle = (contenu) => () => Object.assign({ melange: false }, contenu);
  const AUTO = (notion, libelle) => ({ appli: "Automatismes", notion, libelle, url: `/automatismes/?notions=${notion}&nombre=8` });

  // ---------- Figures ----------
  // Demi-droite graduée (même dessin que l'outil « Automatismes », lot EN5a) : graduations régulières, quelques-unes en
  // gras, des nombres écrits dessous, des lettres dessus, une flèche au bout si l'outil en a une. Deux tailles d'écriture :
  // une pour l'ordinateur, une plus grosse pour le téléphone (la droite y est réduite de moitié).
  function demiDroite(o) {
    // Au téléphone, les graduations se resserrent (pasTel) : la droite est moins large, donc moins réduite.
    return dessinDroite(o, 20).replace('class="figure"', 'class="figure mot-ordi"') + dessinDroite(Object.assign({}, o, { pas: o.pasTel || o.pas }), 30).replace('class="figure"', 'class="figure mot-tel"');
  }
  function dessinDroite({ grads, pas, avant, apres, ecrits, grasses, lettres, fleche, etiquette }, taille) {
    // Au téléphone (écriture plus grosse), les graduations grandissent avec l'écriture : réduites de moitié, elles se voient.
    const k = taille / 20, hG = 11 * k, hP = 8 * k;
    const x0 = 10 + avant, y = 8 + taille * 0.8 + hG + 6, X = (n) => +(x0 + n * pas).toFixed(1);
    const fin = X(grads - 1) + apres;
    let s = `<line x1="10" y1="${y}" x2="${fin}" y2="${y}" stroke="#8a96a3" stroke-width="${f(2 * k)}"/>`;
    if (fleche) s += `<path d="M${f(fin + 2 * k)} ${y} L${f(fin - 10 * k)} ${f(y - 6 * k)} L${f(fin - 10 * k)} ${f(y + 6 * k)} Z" fill="#8a96a3"/>`;
    for (let n = 0; n < grads; n++) {
      const g = grasses.includes(n);
      s += `<line x1="${X(n)}" y1="${f(y - (g ? hG : hP))}" x2="${X(n)}" y2="${f(y + (g ? hG : hP))}" stroke="${g ? "#111" : "#8a96a3"}" stroke-width="${f((g ? 2.6 : 1.6) * k)}"/>`;
    }
    const basBas = f(y + hG + 4 + taille * 0.8);
    for (const [n, t] of ecrits) s += `<text x="${X(n)}" y="${basBas}" font-size="${taille}" text-anchor="middle" fill="#111">${t}</text>`;
    for (const [n, t] of lettres) s += `<text x="${X(n)}" y="${f(y - hG - 5)}" font-size="${taille}" font-weight="700" text-anchor="middle" fill="#111">${t}</text>`;
    return svg(f(fin + (fleche ? 6 : 0) + 10), f(basBas + taille * 0.3 + 6), s, etiquette, 640);
  }
  const f = (x) => +x.toFixed(1);

  // Q9 : de 5 000 en 5 000, 1 600 000 sur la 3e graduation, 1 630 000 sur la 9e, D sur la 20e (21 graduations, une flèche).
  const DROITE_D = { grads: 21, rang1600: 2, rang1630: 8, rangD: 19 };
  const figureD = () => demiDroite({
    grads: DROITE_D.grads, pas: 30, pasTel: 28, avant: 22, apres: 26, fleche: true,
    grasses: [DROITE_D.rang1600, DROITE_D.rang1630, DROITE_D.rangD],
    ecrits: [[DROITE_D.rang1600, nb(1600000)], [DROITE_D.rang1630, nb(1630000)]], lettres: [[DROITE_D.rangD, "D"]],
    etiquette: "Demi-droite graduée : 1 600 000 et 1 630 000 sont écrits, le point D est sur une graduation",
  });

  // Q17 : de 0,05 en 0,05 ; 5,9 sur la 2e graduation, 6,2 sur la 8e ; A, B, C, D sur les 5e, 12e, 16e et 19e.
  const DROITE_C = { grads: 19, rang59: 1, rang62: 7, lettres: { A: 4, B: 11, C: 15, D: 18 } };
  const figureC = () => demiDroite({
    grads: DROITE_C.grads, pas: 34, pasTel: 24, avant: 26, apres: 28,
    grasses: [DROITE_C.rang59, DROITE_C.rang62, ...Object.values(DROITE_C.lettres)],
    ecrits: [[DROITE_C.rang59, "5,9"], [DROITE_C.rang62, "6,2"]], lettres: Object.entries(DROITE_C.lettres).map(([l, k]) => [k, l]),
    etiquette: "Demi-droite graduée : 5,9 et 6,2 sont écrits, les points A, B, C et D sont sur des graduations",
  });

  // Q13 : de 0 à 2 en cinquièmes (traits vers le haut, 0, 1 et 2 écrits au-dessus), une flèche sous la 5e graduation.
  const DROITE_FLECHE = { parUnite: 5, rangFleche: 4, grads: 12 };
  function figureFleche() {
    const pas = 38, x0 = 30, y = 82, X = (k) => x0 + k * pas, fin = X(DROITE_FLECHE.grads - 1) + 26;
    let s = `<line x1="12" y1="${y}" x2="${fin}" y2="${y}" stroke="#111" stroke-width="4"/>`;
    for (let k = 0; k < DROITE_FLECHE.grads; k++) {
      const grand = k % DROITE_FLECHE.parUnite === 0;
      s += `<line x1="${X(k)}" y1="${y}" x2="${X(k)}" y2="${y - (grand ? 30 : 14)}" stroke="#111" stroke-width="${grand ? 3.2 : 2}"/>`;
      if (grand) s += `<text x="${X(k)}" y="${y - 44}" font-size="22" font-weight="700" text-anchor="middle" fill="#111">${k / DROITE_FLECHE.parUnite}</text>`;
    }
    const xf = X(DROITE_FLECHE.rangFleche);
    s += `<path d="M${xf} ${y + 5} L${xf + 15} ${y + 22} L${xf + 7} ${y + 22} L${xf + 7} ${y + 50} L${xf - 7} ${y + 50} L${xf - 7} ${y + 22} L${xf - 15} ${y + 22} Z" fill="#4a4f55"/>`;
    return svg(fin + 12, y + 58, s, "Demi-droite graduée de 0 à 2 : une flèche montre une graduation entre 0 et 1", 470);
  }

  const Q = [];

  Q.push({
    num: 1, domaine: "NC", competence: "Comparer deux grands nombres entiers de même longueur",
    entrainement: AUTO("NC02", "Comparer des nombres"),
    generer: officielle({
      disposition: "ligne",
      enonce: `Choisir la proposition qui convient pour compléter la phrase suivante :<br><strong>${nb(24745236)} est … ${nb(23045239)}.</strong>`,
      choix: [
        c("« supérieur à »", true),
        c("« inférieur à »", false, "Compare les chiffres des unités (6 et 9) au lieu de partir du plus grand rang."),
        c("« égal à »", false, "Voit deux nombres de même longueur qui se ressemblent et ne les compare pas chiffre à chiffre."),
        c("On ne peut pas savoir.", false, "Ne sait pas comparer deux nombres qui ont le même nombre de chiffres."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "NC", competence: "Comprendre le signe = (compléter une égalité)",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer: officielle({
      enonce: "Par quel nombre doit-on compléter l’égalité suivante pour qu’elle soit juste ?<br><strong>10 × 2 = 5 + …</strong>",
      choix: [
        c("25", false, "Lit le signe = comme « donne le résultat » : calcule 10 × 2 = 20, puis 20 + 5 = 25."),
        c("15", true),
        c("95", false, "Se trompe dans le produit (10 × 10 = 100 au lieu de 10 × 2), puis cherche ce qui manque à 5."),
        c("7", false, "Calcule 10 + 2 = 12 au lieu de 10 × 2, puis cherche ce qui manque à 5."),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "NC", competence: "Connaître les relations entre unités de numération",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      disposition: "ligne",
      enonce: "<strong>100 unités = …</strong>",
      choix: [
        c("1 centaine", true),
        c("1 unité de mille", false, "Confond le rang des centaines et celui des unités de mille."),
        c("1 dizaine", false, "Confond centaine et dizaine (100 unités, c’est 10 dizaines)."),
        c("1 dizaine de mille", false, "Associe « 100 » à un grand rang, sans relier les unités de numération les unes aux autres."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "NC", competence: "Écrire un nombre décimal à partir de ses chiffres (unités, centièmes)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: "Quel nombre a 8 pour chiffre des unités et 6 pour chiffre des centièmes ?",
      choix: [
        c("8,600", false, "Place le 6 au rang des dixièmes : confond dixièmes et centièmes."),
        c("608", false, "Confond centièmes et centaines."),
        c("8,06", true),
        c("6008", false, "Place le 6 au rang des unités de mille : ne voit pas que les centièmes sont après la virgule."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "NC", competence: "Passer d’une fraction décimale à l’écriture décimale",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      enonce: `Quel nombre est égal à la fraction\u00a0${frac(4, 100)} ?`,
      choix: [
        c("100,4", false, "Écrit le dénominateur puis le numérateur, séparés par une virgule."),
        c("0,04", true),
        c("400", false, "Multiplie 4 par 100 au lieu de diviser."),
        c("4,100", false, "Écrit le numérateur puis le dénominateur, séparés par une virgule : lit la barre de fraction comme une virgule."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Calculer un produit en regroupant les facteurs (2 × 5)",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer: officielle({
      enonce: "<strong>2 × 36 × 5 = …</strong>",
      choix: [
        c("43", false, "Additionne les trois nombres (2 + 36 + 5)."),
        c("360", true),
        c("77", false, "Calcule 2 × 36 = 72, puis ajoute 5 au lieu de multiplier."),
        c("370", false, "Fait une erreur dans le premier produit (2 × 36 = 74), puis multiplie par 5."),
      ],
    }),
  });

  Q.push({
    num: 7, domaine: "NC", competence: "Additionner deux nombres décimaux",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer: officielle({
      enonce: "<strong>16,4 + 5,8 = …</strong>",
      choix: [
        c("21,12", false, "Additionne à part les parties entières (16 + 5 = 21) et les parties décimales (4 + 8 = 12)."),
        c("22,2", true),
        c("12,2", false, "Oublie la dizaine de 16 : calcule 6,4 + 5,8."),
        c("11,12", false, "Additionne chiffre à chiffre, unités avec unités (6 + 5) et dixièmes avec dixièmes (4 + 8), sans retenue, et oublie la dizaine."),
      ],
    }),
  });

  Q.push({
    num: 8, domaine: "NC", competence: "Comprendre le signe = (trouver l’opération qui manque)",
    entrainement: AUTO("NC04", "Calcul mental"),
    generer: officielle({
      enonce: "Quelle opération permet de compléter l’égalité pour qu’elle soit juste ?<br><strong>4 × 8 = 40 … 8</strong>",
      choix: [
        c("−", true),
        c("+", false, "Ne calcule pas les deux côtés de l’égalité (4 × 8 = 32 et 40 + 8 = 48)."),
        c("×", false, "Recopie le signe × de la partie gauche, sans calculer."),
        c(":", false, "Choisit une opération sans vérifier l’égalité (40 : 8 = 5)."),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "NC", competence: "Repérer un grand nombre entier sur une demi-droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer: officielle({
      enonce: "Voici une demi-droite graduée :",
      figure: figureD(),
      apres: "<strong>Quel est le nombre repéré par la lettre\u00a0D ?</strong>",
      choix: [
        c(nb(1615000), false, `Prend un nombre entre ${nb(1600000)} et ${nb(1630000)} : ne voit pas que D est bien après ${nb(1630000)}.`),
        c(nb(1650000), false, `Voit que D est après ${nb(1630000)}, mais ne trouve pas la valeur d’une graduation (${nb(5000)}).`),
        c(nb(1670000), false, `Se trompe dans le compte des graduations après ${nb(1630000)}, ou dans leur valeur (${nb(5000)}).`),
        c(nb(1685000), true),
      ],
    }),
  });

  Q.push({
    num: 10, domaine: "NC", competence: "Reconnaître une fraction comprise entre 0 et 1",
    entrainement: AUTO("NC10", "Comparer et encadrer des fractions"),
    generer: officielle({
      enonce: "Parmi les fractions suivantes, laquelle est comprise entre 0 et 1 ?",
      choix: [
        c(frac(7, 3), false, "Ne sait pas qu’une fraction est plus petite que 1 quand son numérateur est plus petit que son dénominateur."),
        c(frac(7, 2), false, "Pense qu’une fraction est plus petite que 1 quand son dénominateur est petit."),
        c(frac(2, 7), true),
        c(frac(4, 3), false, "Pense qu’une fraction proche de 1 est forcément entre 0 et 1 : ne compare pas le numérateur au dénominateur."),
      ],
    }),
  });

  Q.push({
    num: 11, domaine: "NC", competence: "Ajouter des dixièmes à un nombre décimal",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: "J’ajoute 3 dixièmes à 2,6.<br><strong>J’obtiens…</strong>",
      choix: [
        c("2,63", false, "Écrit le 3 à la suite de 2,6, au rang des centièmes."),
        c("32,6", false, "Écrit le 3 devant 2,6."),
        c("2,9", true),
        c("2,36", false, "Place le 3 juste après la virgule et décale le 6, sans ajouter."),
      ],
    }),
  });

  Q.push({
    num: 12, domaine: "NC", competence: "Reconnaître des écritures d’un même nombre décimal (les zéros inutiles)",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      enonce: "Le nombre 7,6 peut aussi s’écrire…<br>Cocher Vrai ou Faux pour chaque ligne.",
      grille: {
        colonnes: ["Vrai", "Faux"],
        lignes: [
          { html: "7,06", juste: 1, erreurs: ["Pense qu’ajouter un zéro juste après la virgule ne change pas le nombre.", ""] },
          { html: "07,6", juste: 0, erreurs: ["", "Pense qu’un zéro écrit devant le nombre le change."] },
          { html: "7,60", juste: 0, erreurs: ["", "Ne sait pas qu’un zéro à la fin de la partie décimale ne change pas le nombre."] },
          { html: "70,6", juste: 1, erreurs: ["Pense qu’un zéro ajouté ne change jamais le nombre, quelle que soit sa place.", ""] },
        ],
      },
    }),
  });

  Q.push({
    num: 13, domaine: "NC", competence: "Repérer une fraction sur une demi-droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer: officielle({
      enonce: "Quel nombre est désigné par la flèche ?",
      figure: figureFleche(),
      choix: [
        c(frac(4, 5), true),
        c(frac(1, 4), false, "Compte les 4 petites graduations entre 0 et 1 au lieu des 5 intervalles, et écrit 1 sur 4."),
        c(frac(5, 6), false, "Compte les graduations au lieu des intervalles : la flèche est sur la 5e des 6 graduations de 0 à 1."),
        c(frac(4, 11), false, "Prend les 11 graduations de 0 à 2 comme dénominateur, au lieu de partager le segment de 0 à 1."),
      ],
    }),
  });

  Q.push({
    num: 14, domaine: "NC", competence: "Connaître les relations entre unités de numération (dixièmes)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: "<strong>54 dixièmes</strong> c’est…",
      choix: [
        c("5,4", true),
        c("54", false, "Ne tient pas compte du mot « dixièmes »."),
        c("540", false, "Multiplie par 10 au lieu de diviser : confond dixièmes et dizaines."),
        c("0,54", false, "Divise par 100 : confond dixièmes et centièmes."),
      ],
    }),
  });

  Q.push({
    num: 15, domaine: "NC", competence: "Continuer une suite de nombres décimaux (passage à l’unité)",
    entrainement: AUTO("NC01", "Numération décimale"),
    generer: officielle({
      enonce: `Chaque nombre de la suite est obtenu en ajoutant 0,1 à celui qui précède :<br><span class="suite">0,5 0,6 0,7 0,8 0,9</span><br><strong>Quel est le nombre suivant ?</strong>`,
      choix: [
        c("10", false, "Lit les chiffres après la virgule comme un nombre entier : après 9 vient 10."),
        c("10,0", false, "Écrit « dix dixièmes » comme 10 : ne fait pas le lien entre 10 dixièmes et 1 unité."),
        c("0,10", false, "Calcule 9 + 1 = 10 après la virgule : traite la partie décimale comme un nombre entier."),
        c("1,0", true),
      ],
    }),
  });

  Q.push({
    num: 16, domaine: "NC", competence: "Passer de l’écriture décimale à une fraction décimale",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      disposition: "ligne",
      enonce: "Quelle écriture correspond au nombre 5,89 ?",
      choix: [
        c(`5 + ${frac(9, 10)} + ${frac(8, 100)}`, false, "Inverse les chiffres des dixièmes et des centièmes."),
        c(frac(589, 10), false, "Ne relie pas le nombre de chiffres après la virgule au dénominateur : 10 au lieu de 100."),
        c("Cinq unités et 89 dixièmes", false, "Lit 89 comme des dixièmes au lieu de 89 centièmes."),
        c(frac(589, 100), true),
      ],
    }),
  });

  Q.push({
    num: 17, domaine: "NC", competence: "Repérer un nombre décimal sur une demi-droite graduée",
    entrainement: AUTO("EG01", "Droite graduée"),
    generer: officielle({
      enonce: "Voici une demi-droite graduée :",
      figure: figureC(),
      apres: "<strong>Quel est le nombre repéré par la lettre\u00a0C ?</strong>",
      choix: [
        c("6,75", false, "Donne le nombre repéré par D : se trompe de point ou compte trois graduations de trop."),
        c("6,6", true),
        c("6,4", false, "Donne le nombre repéré par B : se trompe de point ou compte quatre graduations de moins."),
        c("6,05", false, "Donne le nombre repéré par A : ne trouve pas la valeur d’une graduation (0,05) et se trompe de point."),
      ],
    }),
  });

  Q.push({
    num: 18, domaine: "NC", competence: "Connaître l’écriture décimale d’un quart",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      enonce: `<strong>${frac(1, 4)} = …</strong>`,
      choix: [
        c("0,5", false, "Confond un quart et un demi."),
        c("1,4", false, "Écrit le numérateur et le dénominateur séparés par une virgule."),
        c("1,25", false, "Sait qu’un quart s’écrit avec 25, mais se trompe sur la partie entière (1 au lieu de 0)."),
        c("0,25", true),
      ],
    }),
  });

  Q.push({
    num: 19, domaine: "NC", competence: "Décomposer une fraction en un entier et une fraction inférieure à 1",
    entrainement: AUTO("NC08", "Écritures d’un même nombre"),
    generer: officielle({
      enonce: `Parmi les propositions suivantes, laquelle est une autre écriture de\u00a0${frac(13, 5)} ?`,
      choix: [
        c(`2 + ${frac(3, 5)}`, true),
        c(`3 + ${frac(1, 5)}`, false, "Sépare les chiffres de 13 et les remet à l’envers : 3 unités et 1 cinquième."),
        c(`1 + ${frac(3, 5)}`, false, "Sépare les chiffres de 13 : 1 unité et 3 cinquièmes."),
        c(`12 + ${frac(1, 5)}`, false, "Décompose le numérateur (13 = 12 + 1) sans tenir compte du dénominateur."),
      ],
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["6e-pos-nombres"] = {
    id: "6e-pos-nombres",
    niveau: "6e",
    famille: "Outil de positionnement",
    titre: "Nombres et calculs",
    annee: 2026,
    source: "Bibliothèque d’outils de positionnement, classe de 6e, « Nombres et calculs » (attendus de fin de CM2), Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/5211/la-bibliotheque-d-outils-de-positionnement-un-ensemble-de-ressources-au-service-des-enseignants",
    consignes: "Sans calculatrice. Pour chaque question, une seule réponse est juste (dans une grille : une case par ligne).",
    // Pas encore de sujet jumeau (lot EN5b) : ni carte « Un sujet jumeau », ni « Refaire mes questions ratées ».
    jumeaux: false,
    domaines: { NC: "Nombres et calculs" },
    // Groupes de maîtrise de la notice Eduscol (sur 19).
    seuils: [{ max: 5, nom: "À besoins" }, { max: 10, nom: "Fragile" }, { max: 19, nom: "Satisfaisant" }],
    officiels: [{ cle: "outil", annee: 2026, titre: "Le test officiel", detail: "Les 19 vraies questions de l’outil de positionnement Eduscol." }],
    questions: Q,
    // Pour les tests : les données des figures, relues pour recalculer les bonnes réponses.
    donnees: { DROITE_D, DROITE_C, DROITE_FLECHE },
  };
})(typeof window !== "undefined" ? window : globalThis);
