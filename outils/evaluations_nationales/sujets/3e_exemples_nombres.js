/* maths&go — « Exemples de questions et de tâches » Eduscol, 3e, fiche « Nombres et calculs » (page « Accompagner les
   élèves en mathématiques – 4e, 3e et 2de »). Source : fiche élève et fiche professeur, licence Etalab 2.0.
   Lot EN8a : la fiche à l'identique (énoncés, réponses dans l'ordre de la fiche élève, figures redessinées), sans jumeau,
   sans calculatrice (la fiche ne l'autorise pas). Les pièges des QCM suivent l'analyse de la fiche professeur, réécrite
   sans mot genré ; ceux des réponses tapées que la fiche n'analyse pas sont de maths&go (⚠, liste dans la notice du lot).
   Q9 (exemple et contre-exemple) se fait sur la feuille ; Q10 : le résultat se tape, l'argumentation va sur la feuille.
   Eduscol ne publie pas de repères pour ces exemples : pas de groupe au bilan. */
(function (racine) {
  "use strict";
  const { frac, MOINS } = racine.EN;
  const { programme } = racine.ENX;

  const c = (html, juste, erreur) => ({ html, juste: Boolean(juste), erreur: erreur || "" });
  const officielle = (contenu) => () => Object.assign({ melange: false, choix: [] }, contenu);
  const ENCRE = "#143451";
  const p10 = (base, exposant) => `${base}<sup>${exposant}</sup>`;

  // ---------- Figures ----------
  // Q8 : le cadre du vélo (le tube horizontal en noir) et la personne mesurée (B : bras, T : buste, J : jambe).
  const VELO = { J: 86, T: 62, B: 68, diviseur: 2.4 };
  function figureVelo() {
    const tube = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8d8d8d" stroke-width="9" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d6d6d6" stroke-width="6" stroke-linecap="round"/>`;
    const noir = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="8" stroke-linecap="round"/>`;
    const etiquette = (x, y, t, ax, ay) => `<line x1="${ax}" y1="${ay}" x2="${x}" y2="${y + 8}" stroke="#333" stroke-width="1"/><rect x="${x - 2}" y="${y - 4}" width="${t.length * 6.3 + 8}" height="18" fill="#fff" stroke="#333" stroke-width="1"/><text x="${x + 2}" y="${y + 9}" font-size="11.5" fill="#111">${t}</text>`;
    const cadre =
      tube(28, 196, 128, 196) + tube(28, 196, 104, 74) + tube(128, 196, 266, 98) + tube(266, 98, 296, 198) + tube(262, 70, 268, 100) +
      noir(104, 74, 262, 70) + noir(128, 196, 104, 74) +
      `<circle cx="128" cy="196" r="7" fill="#fff" stroke="#555" stroke-width="2"/>` +
      etiquette(140, 22, "Le tube horizontal", 184, 70) + etiquette(126, 118, "Le tube de selle", 116, 136);
    // La personne : silhouette simple, de face.
    const gris = `fill="#ececec" stroke="#6d6d6d" stroke-width="1.6"`;
    const corps =
      `<circle cx="402" cy="26" r="14" ${gris}/>` +
      `<path d="M378 50h48l6 70h-60z" ${gris} stroke-linejoin="round"/>` +
      `<path d="M378 52l-22 74" stroke="#6d6d6d" stroke-width="12" stroke-linecap="round"/><path d="M378 52l-22 74" stroke="#ececec" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M426 52l22 74" stroke="#6d6d6d" stroke-width="12" stroke-linecap="round"/><path d="M426 52l22 74" stroke="#ececec" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M374 120h56l-6 92h-16l-6 -70l-6 70h-16z" ${gris} stroke-linejoin="round"/>` +
      `<line x1="330" y1="214" x2="474" y2="214" stroke="#444" stroke-width="1.5"/>`;
    const ROUGE = "#c62828";
    const mesure = (x1, y1, x2, y2) => {
      const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * 6, ny = Math.cos(a) * 6;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ROUGE}" stroke-width="2.4"/>` +
        `<line x1="${x1 - nx}" y1="${y1 - ny}" x2="${x1 + nx}" y2="${y1 + ny}" stroke="${ROUGE}" stroke-width="2.4"/>` +
        `<line x1="${x2 - nx}" y1="${y2 - ny}" x2="${x2 + nx}" y2="${y2 + ny}" stroke="${ROUGE}" stroke-width="2.4"/>`;
    };
    const lettreRouge = (x, y, t) => `<text x="${x}" y="${y}" font-size="16" font-weight="800" text-anchor="middle" fill="${ROUGE}">${t}</text>`;
    const mesures = mesure(364, 46, 340, 128) + lettreRouge(334, 86, "B") +
      mesure(462, 50, 462, 122) + lettreRouge(476, 91, "T") +
      mesure(462, 122, 462, 214) + lettreRouge(476, 173, "J");
    return racine.EN.svg(490, 226, cadre + corps + mesures,
      "À gauche, le cadre d’un vélo : le tube horizontal en haut et le tube de selle sont en noir. À droite, une personne debout : B est la longueur du bras, T la hauteur du buste, J la longueur de la jambe", 470).replace('class="figure"', 'class="figure velo"');
  }

  // Q10 : le programme de calcul.
  const PROGRAMME = { ajout: 3, facteur: 5 };
  const figureProgramme = () => programme([
    { cat: "evenement", chapeau: true, el: ["quand", { drapeau: true }, "cliqué"] },
    { cat: "capteur", el: ["demander", { champ: "Quel est le nombre de départ ?" }, "et attendre"] },
    { cat: "variable", el: ["mettre", { menu: "Nombre de départ" }, "à", { variable: "réponse" }] },
    { cat: "variable", el: ["mettre", { menu: "résultat" }, "à", { op: [{ variable: "Nombre de départ" }, "+", { nombre: String(PROGRAMME.ajout) }] }] },
    { cat: "variable", el: ["mettre", { menu: "résultat" }, "à", { op: [{ variable: "résultat" }, "*", { nombre: String(PROGRAMME.facteur) }] }] },
    { cat: "apparence", el: ["dire", { variable: "résultat" }, "pendant", { nombre: "2" }, "secondes"] },
  ], "Programme : quand le drapeau est cliqué, demander « Quel est le nombre de départ ? » et attendre ; mettre Nombre de départ à réponse ; mettre résultat à Nombre de départ + 3 ; mettre résultat à résultat * 5 ; dire résultat pendant 2 secondes", 460);

  // ---------- Questions ----------
  const Q = [];

  Q.push({
    num: 1, domaine: "NC", competence: "Soustraire deux fractions",
    generer: officielle({
      enonce: `<strong>Cocher la réponse exacte :</strong><br>${frac(4, 5)} ${MOINS} ${frac(1, 3)} =`,
      disposition: "ligne4",
      choix: [
        c(frac(3, 8), false, "Soustrait les numérateurs et additionne les dénominateurs."),
        c(frac(1, 5), false, "Ajoute 2 au numérateur et au dénominateur de 1 sur 3 pour avoir le dénominateur 5, puis soustrait : 4 sur 5 moins 3 sur 5."),
        c(frac(7, 15), true),
        c(frac(3, 2), false, "Soustrait les numérateurs entre eux et les dénominateurs entre eux."),
      ],
    }),
  });

  Q.push({
    num: 2, domaine: "NC", competence: "Multiplier deux puissances de 10",
    generer: officielle({
      enonce: `<strong>Cocher la réponse exacte :</strong><br>${p10(10, 5)} × ${p10(10, 3)} =`,
      disposition: "ligne4",
      choix: [
        c(p10(10, 15), false, "Multiplie les exposants au lieu de les additionner (la base 10 est juste)."),
        c(p10(100, 8), false, "Additionne bien les exposants, mais multiplie les bases : 10 × 10 = 100."),
        c(p10(100, 15), false, "Multiplie les bases et multiplie les exposants."),
        c(p10(10, 8), true),
      ],
    }),
  });

  Q.push({
    num: 3, domaine: "NC", competence: "Revenir en arrière dans un enchaînement de calculs",
    generer: officielle({
      enonce: "Entre 1999 et 2009, le nombre de tigres sauvages au Népal a augmenté de 20.<br>En 2018, le Népal a annoncé qu’entre 2009 et 2018, le nombre de tigres a doublé sur son territoire pour atteindre 240 individus.<br>Quel était le nombre de tigres sauvages présents au Népal en 1999 ?<br><strong>Cocher la réponse exacte :</strong>",
      choix: [
        c("20", false, "Reprend le premier nombre de l’énoncé."),
        c("100", true),
        c("120", false, "Divise par 2 le nombre de 2018, mais oublie l’augmentation de 20 entre 1999 et 2009."),
        c("220", false, "Enlève 20 au nombre de 2018 et oublie que le nombre a doublé entre 2009 et 2018."),
      ],
    }),
  });

  Q.push({
    num: 4, domaine: "NC", competence: "Calculer une augmentation de température (nombres relatifs)",
    generer: officielle({
      enonce: `Un matin la température est de ${MOINS}4 °C.<br>En début d’après-midi elle est de 10 °C.<br><strong>De combien la température a-t-elle augmenté ?</strong>`,
      choix: [
        c("6 °C", false, "Calcule 10 − 4 : ne tient pas compte du signe de −4."),
        c("10 °C", false, "Reprend la température de l’après-midi, plus haute que celle du matin, comme si c’était l’augmentation."),
        c("14 °C", true),
        c("16 °C", false, "Calcule 10 − 4 = 6, puis ajoute 6 à 10 au lieu d’ajouter 4."),
      ],
    }),
  });

  Q.push({
    num: 5, domaine: "NC", competence: "Partager une quantité selon un ratio",
    generer: officielle({
      enonce: "Dans un cocktail sans alcool, on mélange du jus de fraise, du jus de citron et de la limonade. Le ratio <em>volume de jus de fraise : volume de jus de citron : volume de limonade</em> est <em>3 : 2 : 3</em>. Pour la fête du collège, les élèves ont préparé 10 L de ce cocktail. <strong>Quel volume de jus de fraise est utilisé dans ce cocktail ?</strong>",
      choix: [
        c("3 L", false, "Reprend le nombre du ratio sans faire de calcul."),
        c("6 L", false, "Multiplie par 2 le nombre du ratio."),
        c("3,75 L", true),
        c("5 L", false, "Prend la moitié des 10 L."),
      ],
    }),
  });

  Q.push({
    num: 6, domaine: "NC", competence: "Utiliser la divisibilité pour résoudre un problème",
    indicateurs: [
      "Traduit l’énoncé en divisibilité par 3, par 5 et par 7.",
      "Liste les multiples de 7 compris entre 400 et 450, puis repère ceux qui sont aussi multiples de 3 et de 5.",
      "Ou conclut à la divisibilité par 3 × 5 × 7 = 105, en s’appuyant sur la décomposition en facteurs premiers.",
    ],
    generer: officielle({
      enonce: "Charlotte possède entre 400 et 450 livres. Elle décide de les revendre sur internet pour en acheter d’autres. Elle observe qu’elle peut regrouper ses livres par paquets de 3, de 5, ou de 7.<br><strong>Combien de livres Charlotte possède-t-elle exactement ?</strong>",
      saisie: { lignes: [{ modele: "□ livres", attendus: [420], pieges: [
        { valeurs: [105], nonPublie: true, erreur: "Trouve 3 × 5 × 7 = 105, mais oublie que le nombre est entre 400 et 450." },
        { valeurs: [405], nonPublie: true, erreur: "Trouve un multiple de 3 et de 5 entre 400 et 450, mais oublie les paquets de 7." },
        { valeurs: [435], nonPublie: true, erreur: "Trouve un multiple de 3 et de 5 entre 400 et 450, mais oublie les paquets de 7." },
      ] }] },
    }),
  });

  Q.push({
    num: 7, domaine: "NC", competence: "Comparer des masses avec « fois plus » et « fois plus léger »",
    generer: officielle({
      enonce: "Le chien est neuf fois plus lourd que le chat, la souris est vingt fois plus légère que le chat et le navet est six fois plus lourd que la souris.<br><strong>Alors le chien est certainement plus lourd que le navet, mais de combien de fois ?</strong>",
      saisie: { lignes: [{ modele: "□ fois", attendus: [30], pieges: [
        { valeurs: [1080], nonPublie: true, erreur: "Multiplie les trois nombres de l’énoncé (9 × 20 × 6) sans les relier aux animaux." },
        { valeurs: [35], nonPublie: true, erreur: "Additionne les trois nombres de l’énoncé (9 + 20 + 6)." },
      ] }] },
    }),
  });

  Q.push({
    num: 8, domaine: "NC", competence: "Appliquer une formule donnée en mots, puis convertir",
    generer: officielle({
      // Sur ordinateur, la figure est à gauche des réponses : la ligne des mesures et la question passent au-dessus d'elle
      // (mêmes mots, seule leur place change).
      enonce: "Les dimensions d’un vélo doivent être adaptées à celles de son utilisateur. Ainsi la longueur du tube horizontal est calculée de la manière suivante :<br>Additionner la hauteur T du buste et la longueur B du bras de l’utilisateur puis diviser le résultat obtenu par 2,4.<br>J = 86 cm ; T = 62 cm ; B = 68 cm<br><strong>Choisir, parmi les propositions suivantes, la longueur du tube pour cet utilisateur :</strong>",
      figure: figureVelo(),
      disposition: "deux",
      serre: true,
      long: true,
      choix: [
        c("542 mm", true),
        c("54,2 mm", false, "Calcule avec les longueurs en centimètres et ne convertit pas le résultat en millimètres."),
        c("90 mm", false, "Additionne toutes les longueurs en centimètres, même celle de la jambe, qui est inutile, puis divise par 2,4."),
        c("900 mm", false, "Additionne toutes les longueurs, même celle de la jambe, qui est inutile, divise par 2,4, puis convertit en millimètres."),
      ],
    }),
  });

  Q.push({
    num: 9, domaine: "NC", competence: "Trouver un exemple et un contre-exemple",
    attendu: "Par exemple, vrai : une personne qui a 10 pièces de 1 centime a plus d’argent qu’une personne qui a 2 pièces de 1 centime. Faux : une personne qui a 10 pièces de 1 centime a moins d’argent qu’une personne qui a 2 pièces de 10 centimes.",
    generer: officielle({
      enonce: "<strong>Donner un exemple où l’énoncé est vrai et où l’énoncé n’est pas vrai.</strong><br>La personne possédant le plus grand nombre de pièces de monnaie a le plus d’argent.<br>Exemple vrai :<br>Exemple faux :",
      feuille: true,
    }),
  });

  Q.push({
    num: 10, domaine: "NC", competence: "Exécuter un programme de calcul",
    indicateurs: [
      "Remplace le nombre de départ par (−7).",
      "Ajoute 3 au nombre de départ : −7 + 3 = −4.",
      "Multiplie le résultat obtenu par 5 : −4 × 5 = −20.",
    ],
    generer: officielle({
      enonce: "Si le nombre de départ choisi est (−7) quel est le résultat obtenu en exécutant ce programme ?",
      figure: figureProgramme(),
      apres: "<strong>Argumenter la réponse.</strong>",
      preuve: true,
      saisie: { lignes: [{ modele: "□", attendus: [(-7 + PROGRAMME.ajout) * PROGRAMME.facteur], pieges: [
        { valeurs: [-4], nonPublie: true, erreur: "Ajoute 3 mais oublie de multiplier par 5." },
        { valeurs: [20], nonPublie: true, erreur: "Fait les bons calculs mais perd le signe moins." },
      ] }] },
    }),
  });

  racine.EN_SUJETS = racine.EN_SUJETS || {};
  racine.EN_SUJETS["3e-exemples-nombres"] = {
    id: "3e-exemples-nombres",
    famille: "Exemples de questions Eduscol",
    niveau: "3e",
    titre: "Nombres et calculs",
    source: "Ministère de l’Éducation nationale — « Accompagner les élèves en mathématiques – 4e, 3e et 2de », exemples d’exercices de troisième, fiche « Nombres et calculs », Eduscol, licence Etalab 2.0.",
    lienSource: "https://eduscol.education.gouv.fr/6858/accompagner-les-eleves-en-mathematiques-4e-3e-et-2de",
    consignes: "Sans calculatrice. Prévois une feuille pour les justifications.",
    jumeaux: false,
    seuils: null, // Eduscol ne publie pas de repères pour ces exemples
    domaines: { NC: "Nombres et calculs" },
    officiels: [{ cle: "eduscol", annee: "eduscol", titre: "Les questions d’Eduscol", detail: "La fiche « Nombres et calculs » de 3e, à l’identique." }],
    questions: Q,
    donnees: { VELO, PROGRAMME },
  };
})(typeof window !== "undefined" ? window : globalThis);
