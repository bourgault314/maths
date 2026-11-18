// Défi conversions — la carte (lot 1, 11/11/2026).
//
// Le fichier COMMUN à l'appli élève (defi_conversions.html) et, plus tard, à
// l'exerciseur et à la page prof (copie octet pour octet au lot 2). Il ne
// contient que des données : les 6 paliers, les 48 étapes, les 28 repères, et
// les textes vus par l'élève (noms, exemples, « On te montre », « À retenir »).
// Aucun générateur ici : ils sont dans conversions_generateurs.js, sous le
// même code d'étape.
//
// Les CODES (R1, C1, Q2…) et les RANGS (1 à 48) sont DÉFINITIFS : des
// progressions d'élèves y seront attachées. Le palier, le nom, l'ordre
// d'affichage peuvent changer sans rien migrer. Une étape ajoutée prend le
// rang 49 ; une étape retirée garde son code et son rang.
//
// Corrigé le 11/11 au soir (programme de cycle 2, BO n° 41 du 31/10/2024) :
// « La demi-heure, le quart d'heure » (D2) passe au palier 1 → 8 / 14 / 8 /
// 6 / 7 / 5 étapes ; « Les relations des bases » a 10 relations (1 m =
// 1 000 mm).
//
// Carte v3 (12/11/2026, lot A1 « inventaire et étude ») : 4 étapes de plus,
// rangs 49 à 52, pour couvrir le programme (BO de cycle 2 du 31/10/2024,
// programme de cycle 3 de 2025) et l'exerciseur :
//   E1 « Les euros et les centimes » (palier 1, CE1 · CE2) ;
//   D7 « Combien de temps entre deux heures ? » (palier 1, CE1 · CE2) ;
//   Q10 « Problèmes : durées et horaires » (palier 2, CM1) ;
//   A5 « L'aire en carreaux » (palier 2, CM1).
// Renommées : A4 « Toutes les unités d'aire » (ex « mm² et km² ») ; Q9
// « Problèmes : vitesses et débits » (3e : grandeurs composées).
// 8 repères de plus (le corps, l'eau, le verre, le dé) → 36 repères.
// Une étape `cachee` existe dans les données (son code et son rang sont
// réservés, le moteur l'accepte) mais l'élève ne la voit pas encore : elle
// n'entre ni dans l'ORDRE, ni dans les étapes d'un palier. Sert aux étapes
// ajoutées à un palier déjà en ligne, tant qu'elles ne sont pas construites
// (E1 et D7 : lot A2 bis).
// Le détail de chaque étape (ce que l'élève fait, les questions, les aides,
// les nombres) est dans le cahier des charges de la carte v3 :
// C:\Users\gwena\Claude cowork\defi-conversions\inventaire\defi-conversions-carte-v3.md
//
// Lot A2 bis (12/11/2026, « le palier 1 complété ») : E1 et D7 sont
// construites et ne sont plus cachées (le palier 1 passe à 10 étapes) ;
// « associer » (R1), « qu'est-ce qu'on mesure ? » et « h, min ou jours »
// (R2), « ranger » (C2) et le tableau heures / minutes (D1) arrivent ; le
// 3e temps de « Quelle unité choisir ? » devient la récréation (une durée).
//
// Carte v4 (14/11/2026, lot 1 « audit du contenu », entrée au lot 3b) :
// 2 étapes de plus, rangs 53 et 54 — C9 « Avec des millièmes » (palier 3,
// CM2) et Q11 « Problèmes : plans et cartes » (palier 5, 5e) → 54 étapes.
// Le détail : …\defi-conversions\audit-contenu\defi-conversions-carte-v4.md
//
// Typographie : tous les textes passent par typo() au chargement — espace
// fine insécable (U+202F) dans les milliers, espace insécable (U+00A0) entre
// un nombre et son unité et devant « ? ! : ; », jamais un point décimal.
(function initConversionsCarte(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_CONVERSIONS_CARTE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const FINE = " ";
  const INSECABLE = " ";
  const UNITES_TEXTE = "centimes?|c|km|hm|dam|dm|cm|mm|m|kg|hg|dag|dg|cg|mg|g|t|hL|daL|dL|cL|mL|L|min|h|s|km²|m²|dm²|cm²|mm²|m³|dm³|cm³|ko|Mo|Go|o|km/h|m/s|ans|jours?|semaines?|étapes?|repères?|questions?|justes|erreurs?|fois|sur|(?:kilo|hecto|déca|déci|centi|milli)?(?:mètres?|grammes?|litres?)|€|bouteilles";
  const RE_MILLIERS = /(\d) (?=\d{3}(?!\d))/g;
  const RE_UNITE = new RegExp(`(\\d) (?=(?:${UNITES_TEXTE})(?![\\wÀ-ÿ²³]))`, "g");

  // Les espaces des nombres et des unités, comme au cahier (et comme
  // formaterNombre de Défi calcul). Idempotent.
  function typo(texte) {
    if (typeof texte !== "string") return texte;
    let t = texte;
    for (let i = 0; i < 3; i += 1) t = t.replace(RE_MILLIERS, `$1${FINE}`);
    t = t.replace(RE_UNITE, `$1${INSECABLE}`);
    t = t.replace(/ ([?!:;»])/g, `${INSECABLE}$1`).replace(/« /g, `«${INSECABLE}`);
    return t;
  }

  function geler(objet) {
    if (objet && typeof objet === "object") {
      Object.values(objet).forEach(geler);
      Object.freeze(objet);
    }
    return objet;
  }

  // Tous les textes d'un objet passent par typo().
  function typographier(objet) {
    if (typeof objet === "string") return typo(objet);
    if (Array.isArray(objet)) return objet.map(typographier);
    if (objet && typeof objet === "object") {
      const copie = {};
      Object.keys(objet).forEach(cle => { copie[cle] = cle === "code" || cle === "famille" ? objet[cle] : typographier(objet[cle]); });
      return copie;
    }
    return objet;
  }

  // ------------------------------------------------------------ les paliers
  // Lot 3a (14/11/2026, choix de Gwenaël) : une CEINTURE par palier, de la
  // jaune à la noire ; `couleur` est celle de la ceinture (elle remplace la
  // couleur des anciennes médailles). Jaune, orange, verte et bleue : les
  // mêmes que les ceintures de Défi calcul (univers maths&go). Son nom est
  // toujours écrit à côté du dessin (imprimé en noir et blanc, la verte et la
  // bleue se ressemblent) ; jamais une couleur de texte (le jaune ne se lit
  // pas sur du blanc).
  const PALIERS = [
    {n: 1, nom: "Les bases", classes: "CE1 · CE2", ceinture: "jaune", couleur: "#f9bf3b"},
    {n: 2, nom: "Le CM1", classes: "CM1", ceinture: "orange", couleur: "#f58220"},
    {n: 3, nom: "Le CM2", classes: "CM2", ceinture: "verte", couleur: "#147447"},
    {n: 4, nom: "La 6e", classes: "6e", ceinture: "bleue", couleur: "#0b67b2"},
    {n: 5, nom: "La 5e", classes: "5e", ceinture: "marron", couleur: "#7a4a24"},
    {n: 6, nom: "La 4e et la 3e", classes: "4e · 3e", ceinture: "noire", couleur: "#1f2329"}
  ];

  // Les familles, dans l'ordre d'affichage d'un palier.
  const FAMILLES = [
    {code: "reperes", nom: "Mes repères"},
    {code: "relations", nom: "Préfixes et relations"},
    {code: "convertir", nom: "Convertir"},
    {code: "aires", nom: "Les aires"},
    {code: "volumes", nom: "Les volumes"},
    {code: "durees", nom: "Durées"},
    {code: "grandeurs", nom: "Grandeurs du collège"},
    {code: "problemes", nom: "Problèmes"}
  ];
  // Au palier 1, il n'y a pas encore de préfixes (planche 8 du lot 1).
  const NOMS_FAMILLES_PAR_PALIER = {1: {relations: "Les relations"}};

  // ------------------------------------------------------------ les étapes
  // Dans l'ordre des RANGS (l'ordre de création, figé). L'ordre d'affichage
  // et de parcours est : palier, puis famille, puis rang.
  // nomCourt : le nom sous le titre de sa famille (Mon parcours, mode prof).
  const ETAPES = [
    // Palier 1 · Les bases
    {code: "R1", rang: 1, palier: 1, famille: "reperes", classe: "CE1 · CE2", nom: "Mes premiers repères", exemple: "voiture : 4 m"},
    {code: "R2", rang: 2, palier: 1, famille: "reperes", classe: "CE1 · CE2", nom: "Quelle unité choisir ?", exemple: ""},
    {code: "P1", rang: 3, palier: 1, famille: "relations", classe: "CE1 · CE2", nom: "Les relations des bases", exemple: "1 m = 100 cm"},
    {code: "C1", rang: 4, palier: 1, famille: "convertir", classe: "CE2", nom: "Vers une unité plus petite", exemple: "3 m = 300 cm"},
    {code: "C2", rang: 5, palier: 1, famille: "convertir", classe: "CE2", nom: "Vers une unité plus grande", exemple: "500 cm = 5 m"},
    {code: "D1", rang: 6, palier: 1, famille: "durees", classe: "CE1", nom: "Heures et minutes", exemple: "1 h = 60 min"},
    {code: "Q1", rang: 7, palier: 1, famille: "problemes", classe: "CE2", nom: "Problèmes : mettre bout à bout, couper", nomCourt: "Mettre bout à bout, couper", exemple: ""},
    // Palier 2 · Le CM1
    {code: "R3", rang: 8, palier: 2, famille: "reperes", classe: "CM1", nom: "Mes repères de longueur", exemple: "Piton des Neiges : 3 km"},
    {code: "R4", rang: 9, palier: 2, famille: "reperes", classe: "CM1", nom: "Mes repères de masse", exemple: "1 L d'eau : 1 kg"},
    {code: "R5", rang: 10, palier: 2, famille: "reperes", classe: "CM1", nom: "Mes repères de contenance", exemple: "verre : 20 cL"},
    {code: "R6", rang: 11, palier: 2, famille: "reperes", classe: "CM1", nom: "Est-ce vraisemblable ?", exemple: ""},
    {code: "P2", rang: 12, palier: 2, famille: "relations", classe: "CM1", nom: "Ce que veulent dire les préfixes", nomCourt: "Le sens des préfixes", exemple: "kilo = 1 000"},
    {code: "P3", rang: 13, palier: 2, famille: "relations", classe: "CM1", nom: "Deux unités voisines", exemple: "1 cm = 0,1 dm"},
    {code: "P4", rang: 14, palier: 2, famille: "relations", classe: "CM1", nom: "Toutes les relations à connaître", nomCourt: "Toutes les relations", exemple: "1 L = 1 000 mL"},
    {code: "C3", rang: 15, palier: 2, famille: "convertir", classe: "CM1", nom: "Avec des nombres décimaux", exemple: "3,5 m = 350 cm"},
    {code: "C4", rang: 16, palier: 2, famille: "convertir", classe: "CM1", nom: "En mètre, en gramme, en litre", nomCourt: "Mètre, gramme, litre", exemple: "41 dg = 4,1 g"},
    {code: "C5", rang: 17, palier: 2, famille: "convertir", classe: "CM1", nom: "Une mesure, plusieurs écritures", exemple: "215 cm = 2,15 m"},
    {code: "C6", rang: 18, palier: 2, famille: "convertir", classe: "CM1", nom: "Les fractions usuelles", exemple: "¾ m = 75 cm"},
    {code: "C7", rang: 19, palier: 2, famille: "convertir", classe: "CM1", nom: "Ranger des mesures", exemple: ""},
    {code: "C8", rang: 20, palier: 2, famille: "convertir", classe: "CM1", nom: "Calculer avec deux unités", exemple: "1 L − 25 cL"},
    {code: "D2", rang: 21, palier: 1, famille: "durees", classe: "CE1", nom: "La demi-heure, le quart d'heure", exemple: ""},
    {code: "Q2", rang: 22, palier: 2, famille: "problemes", classe: "CM1", nom: "Problèmes : ajouter, retirer", nomCourt: "Ajouter, retirer", exemple: ""},
    // Palier 3 · Le CM2
    {code: "R7", rang: 23, palier: 3, famille: "reperes", classe: "CM2", nom: "J'estime avec un repère", exemple: ""},
    {code: "R8", rang: 24, palier: 3, famille: "reperes", classe: "CM2", nom: "Mes repères d'aire", exemple: "affiche A0 : 1 m²"},
    {code: "R9", rang: 25, palier: 3, famille: "reperes", classe: "CM2", nom: "Qu'est-ce qu'on mesure ?", exemple: ""},
    {code: "A1", rang: 26, palier: 3, famille: "aires", classe: "CM2", nom: "1 m² = 100 dm², 1 dm² = 100 cm²", exemple: "1 m² = 100 dm²"},
    {code: "A2", rang: 27, palier: 3, famille: "aires", classe: "CM2", nom: "Convertir des aires (vers plus petit)", exemple: "3,7 dm² = 370 cm²"},
    {code: "D3", rang: 28, palier: 3, famille: "durees", classe: "CM2", nom: "Minutes et secondes", exemple: "1 min = 60 s"},
    {code: "Q3", rang: 29, palier: 3, famille: "problemes", classe: "CM2", nom: "Problèmes : plusieurs fois, partager", nomCourt: "Plusieurs fois, partager", exemple: ""},
    {code: "Q4", rang: 30, palier: 3, famille: "problemes", classe: "CM2", nom: "Problèmes : une fraction d'une quantité", nomCourt: "Une fraction d'une quantité", exemple: ""},
    // Palier 4 · La 6e
    {code: "A3", rang: 31, palier: 4, famille: "aires", classe: "6e", nom: "Convertir des aires (vers plus grand)", exemple: "370 cm² = 3,7 dm²"},
    {code: "V1", rang: 32, palier: 4, famille: "volumes", classe: "6e", nom: "Le centimètre cube", exemple: ""},
    {code: "D4", rang: 33, palier: 4, famille: "durees", classe: "6e", nom: "Jours, semaines, années, siècles", exemple: "1 jour = 24 h"},
    {code: "D5", rang: 34, palier: 4, famille: "durees", classe: "6e", nom: "Les heures décimales usuelles", exemple: "0,25 h = 15 min"},
    {code: "Q5", rang: 35, palier: 4, famille: "problemes", classe: "6e", nom: "Problèmes : périmètres et aires", nomCourt: "Périmètres et aires", exemple: ""},
    {code: "Q6", rang: 36, palier: 4, famille: "problemes", classe: "6e", nom: "Problèmes : horaires et durées", nomCourt: "Horaires et durées", exemple: ""},
    // Palier 5 · La 5e
    {code: "A4", rang: 37, palier: 5, famille: "aires", classe: "5e", nom: "Toutes les unités d'aire", exemple: "1 m² = 10 000 cm²"},
    {code: "R10", rang: 38, palier: 5, famille: "volumes", classe: "5e", nom: "Mes repères de volume", exemple: "cuve : 1 m³"},
    {code: "V2", rang: 39, palier: 5, famille: "volumes", classe: "5e", nom: "1 dm³ = 1 000 cm³", exemple: "1 dm³ = 1 000 cm³"},
    {code: "V3", rang: 40, palier: 5, famille: "volumes", classe: "5e", nom: "Volume et contenance", exemple: "1 L = 1 dm³"},
    {code: "V4", rang: 41, palier: 5, famille: "volumes", classe: "5e", nom: "Convertir volumes et contenances", exemple: "2,5 L = 2 500 cm³"},
    {code: "Q7", rang: 42, palier: 5, famille: "problemes", classe: "5e", nom: "Problèmes : longueurs et aires", nomCourt: "Longueurs et aires", exemple: ""},
    {code: "Q8", rang: 43, palier: 5, famille: "problemes", classe: "5e", nom: "Problèmes : volumes et contenances", nomCourt: "Volumes et contenances", exemple: ""},
    // Palier 6 · La 4e et la 3e
    {code: "D6", rang: 44, palier: 6, famille: "durees", classe: "4e", nom: "Toutes les heures décimales", exemple: "0,2 h = 12 min"},
    {code: "G1", rang: 45, palier: 6, famille: "grandeurs", classe: "4e", nom: "km/h et m/s", exemple: "36 km/h = 10 m/s"},
    {code: "P5", rang: 46, palier: 6, famille: "grandeurs", classe: "4e", nom: "Les préfixes de nano à giga", exemple: "1 Go = 1 000 Mo"},
    {code: "P6", rang: 47, palier: 6, famille: "grandeurs", classe: "3e", nom: "Les préfixes en puissances de 10", exemple: ""},
    {code: "Q9", rang: 48, palier: 6, famille: "problemes", classe: "4e", nom: "Problèmes : vitesses et débits", nomCourt: "Vitesses et débits", exemple: ""},
    // Carte v3 (12/11) : les ajouts du programme.
    {code: "E1", rang: 49, palier: 1, famille: "convertir", classe: "CE1 · CE2", nom: "Les euros et les centimes", exemple: "1 € = 100 c"},
    {code: "D7", rang: 50, palier: 1, famille: "durees", classe: "CE1 · CE2", nom: "Combien de temps entre deux heures ?", nomCourt: "Entre deux heures", exemple: "de 8 h 30 à 10 h 50"},
    {code: "Q10", rang: 51, palier: 2, famille: "problemes", classe: "CM1", nom: "Problèmes : durées et horaires", nomCourt: "Durées et horaires", exemple: ""},
    {code: "A5", rang: 52, palier: 2, famille: "aires", classe: "CM1", nom: "L'aire en carreaux", exemple: "6 carreaux = 6 cm²"},
    // Carte v4 (14/11, lot 1 « audit du contenu ») : deux ajouts d'office
    // (attendus de CM2 et de 5e). Construites aux lots B3 et B5.
    {code: "C9", rang: 53, palier: 3, famille: "convertir", classe: "CM2", nom: "Avec des millièmes", exemple: "18 mm = 0,018 m"},
    {code: "Q11", rang: 54, palier: 5, famille: "problemes", classe: "5e", nom: "Problèmes : plans et cartes", nomCourt: "Plans et cartes", exemple: ""}
  ];

  // ------------------------------------------------------------ les repères
  // Les 28 repères de la carte v1 (§ 3, sources comprises ; la ligne « 1 g »
  // devient la feuille ET la pièce), plus les 8 de la carte v3 (le corps,
  // l'eau, le verre, le dé : les « actions en classe » et les « ponts » de
  // l'exerciseur). Codes figés. `etape` : l'étape dont la
  // validation le met au carnet. Pour les questions : `debut` + nombre +
  // unité + `fin` forment la phrase (« Une voiture mesure environ 4 m de
  // long. »). `local` : repère réunionnais.
  const REPERES = [
    // Lot A2 ter : la règle passe à « Mes premiers repères » (palier 1). Le
    // millimètre est au programme de CE2, l'élève le voit sur sa règle, et
    // les aides du palier 1 le citaient sans qu'il l'ait appris.
    {code: "l1", grandeur: "longueur", etape: "R1", objet: "La plus petite graduation de la règle", valeur: "1 mm", debut: "La plus petite graduation de la règle mesure", nombre: "1", unite: "mm", fin: ""},
    {code: "l2", grandeur: "longueur", etape: "R3", objet: "Une pièce de 1 centime", valeur: "un peu plus de 1,5 cm de large", debut: "Une pièce de 1 centime mesure un peu plus de", nombre: "1,5", unite: "cm", fin: "de large"},
    {code: "l3", grandeur: "longueur", etape: "R1", objet: "Une feuille A4", valeur: "21 cm sur 29,7 cm", debut: "Une feuille A4 mesure", nombre: "21", unite: "cm", fin: "de large"},
    {code: "l4", grandeur: "longueur", etape: "R1", objet: "Une voiture", valeur: "environ 4 m de long", debut: "Une voiture mesure environ", nombre: "4", unite: "m", fin: "de long"},
    {code: "l5", grandeur: "longueur", etape: "R3", objet: "Un tour de piste d'athlétisme", valeur: "400 m", debut: "Un tour de piste d'athlétisme mesure", nombre: "400", unite: "m", fin: ""},
    {code: "l6", grandeur: "longueur", etape: "R3", objet: "Le viaduc de la Nouvelle route du Littoral", valeur: "5,4 km", debut: "Le viaduc de la Nouvelle route du Littoral mesure", nombre: "5,4", unite: "km", fin: "", local: true},
    {code: "l7", grandeur: "longueur", etape: "R1", objet: "De Saint-Pierre à Saint-Denis", valeur: "environ 80 km en voiture", debut: "De Saint-Pierre à Saint-Denis, en voiture, il y a environ", nombre: "80", unite: "km", fin: "", local: true},
    {code: "l8", grandeur: "longueur", etape: "R3", objet: "Le Piton des Neiges", valeur: "environ 3 km d'altitude", debut: "Le Piton des Neiges s'élève à environ", nombre: "3", unite: "km", fin: "d'altitude", local: true},
    {code: "l9", grandeur: "longueur", etape: "R3", objet: "La Diagonale des Fous", valeur: "environ 170 km", debut: "La Diagonale des Fous mesure environ", nombre: "170", unite: "km", fin: "", local: true},
    {code: "m1", grandeur: "masse", etape: "R4", objet: "Un grain de riz", valeur: "environ 25 mg", debut: "Un grain de riz pèse environ", nombre: "25", unite: "mg", fin: ""},
    {code: "m2", grandeur: "masse", etape: "R4", objet: "Une feuille A4", valeur: "environ 5 g", debut: "Une feuille A4 pèse environ", nombre: "5", unite: "g", fin: ""},
    {code: "m3", grandeur: "masse", etape: "R1", objet: "Une pièce de 1 €", valeur: "7,5 g", debut: "Une pièce de 1 € pèse", nombre: "7,5", unite: "g", fin: ""},
    {code: "m4", grandeur: "masse", etape: "R1", objet: "Un paquet de riz", valeur: "1 kg", debut: "Un paquet de riz pèse", nombre: "1", unite: "kg", fin: ""},
    {code: "m5", grandeur: "masse", etape: "R1", objet: "Un pack de 6 bouteilles d'eau", valeur: "environ 9 kg", debut: "Un pack de 6 bouteilles d'eau pèse environ", nombre: "9", unite: "kg", fin: ""},
    {code: "m6", grandeur: "masse", etape: "R1", objet: "Une voiture", valeur: "environ 1 t", debut: "Une voiture pèse environ", nombre: "1", unite: "t", fin: ""},
    {code: "c1", grandeur: "contenance", etape: "R5", objet: "Une cuillère à café", valeur: "5 mL", debut: "Une cuillère à café contient", nombre: "5", unite: "mL", fin: ""},
    {code: "c2", grandeur: "contenance", etape: "R1", objet: "Une canette", valeur: "33 cL, un tiers de litre", debut: "Une canette contient", nombre: "33", unite: "cL", fin: ""},
    {code: "c3", grandeur: "contenance", etape: "R1", objet: "Une brique de lait", valeur: "1 L", debut: "Une brique de lait contient", nombre: "1", unite: "L", fin: ""},
    {code: "c4", grandeur: "contenance", etape: "R5", objet: "Un chauffe-eau solaire", valeur: "environ 200 L", debut: "Un chauffe-eau solaire contient environ", nombre: "200", unite: "L", fin: "", local: true},
    {code: "a1", grandeur: "aire", etape: "R8", objet: "Un carreau de 1 cm de côté", valeur: "1 cm²", debut: "Un carreau de 1 cm de côté a une aire de", nombre: "1", unite: "cm²", fin: ""},
    {code: "a2", grandeur: "aire", etape: "R8", objet: "Une feuille A4", valeur: "environ 6 dm²", debut: "Une feuille A4 a une aire d'environ", nombre: "6", unite: "dm²", fin: ""},
    {code: "a3", grandeur: "aire", etape: "R8", objet: "Une affiche A0", valeur: "1 m², soit 16 feuilles A4", debut: "Une affiche A0 a une aire de", nombre: "1", unite: "m²", fin: ""},
    {code: "a4", grandeur: "aire", etape: "R8", objet: "Un terrain de football", valeur: "environ 7 000 m²", debut: "Un terrain de football a une aire d'environ", nombre: "7000", unite: "m²", fin: ""},
    {code: "a5", grandeur: "aire", etape: "A4", objet: "La Réunion", valeur: "environ 2 500 km²", debut: "La Réunion a une aire d'environ", nombre: "2500", unite: "km²", fin: "", local: true},
    {code: "v1", grandeur: "volume", etape: "R10", objet: "Le petit cube unité", valeur: "1 cm³ = 1 mL", debut: "Le petit cube unité a un volume de", nombre: "1", unite: "cm³", fin: ""},
    {code: "v2", grandeur: "volume", etape: "R10", objet: "Une brique de lait", valeur: "1 L = 1 dm³", debut: "Une brique de lait a un volume de", nombre: "1", unite: "dm³", fin: ""},
    {code: "v3", grandeur: "volume", etape: "R10", objet: "Une cuve de récupération d'eau de pluie", valeur: "1 000 L = 1 m³", debut: "Une cuve de récupération d'eau de pluie a un volume de", nombre: "1", unite: "m³", fin: "", local: true},
    {code: "v4", grandeur: "volume", etape: "R10", objet: "Une piscine olympique", valeur: "2 500 m³", debut: "Une piscine olympique a un volume de", nombre: "2500", unite: "m³", fin: ""},
    // Carte v3 (12/11)
    {code: "l10", grandeur: "longueur", etape: "R3", objet: "La largeur de mon petit doigt", valeur: "environ 1 cm", debut: "Mon petit doigt a une largeur d'environ", nombre: "1", unite: "cm", fin: ""},
    {code: "l11", grandeur: "longueur", etape: "R3", objet: "Un très grand pas", valeur: "environ 1 m", debut: "Un très grand pas mesure environ", nombre: "1", unite: "m", fin: ""},
    {code: "m7", grandeur: "masse", etape: "R4", objet: "Un trombone", valeur: "environ 1 g", debut: "Un trombone pèse environ", nombre: "1", unite: "g", fin: ""},
    {code: "m8", grandeur: "masse", etape: "R4", objet: "Une bouteille de 1 L d'eau", valeur: "1 kg (sans la bouteille)", debut: "Un litre d'eau pèse", nombre: "1", unite: "kg", fin: ""},
    {code: "c5", grandeur: "contenance", etape: "R5", objet: "Un verre", valeur: "environ 20 cL", debut: "Un verre contient environ", nombre: "20", unite: "cL", fin: ""},
    {code: "a6", grandeur: "aire", etape: "R8", objet: "L'ongle de mon pouce", valeur: "environ 1 cm²", debut: "L'ongle de mon pouce a une aire d'environ", nombre: "1", unite: "cm²", fin: ""},
    {code: "a7", grandeur: "aire", etape: "R8", objet: "La paume de ma main", valeur: "environ 1 dm²", debut: "La paume de ma main a une aire d'environ", nombre: "1", unite: "dm²", fin: ""},
    {code: "v5", grandeur: "volume", etape: "V1", objet: "Un dé à jouer", valeur: "environ 1 cm³", debut: "Un dé à jouer a un volume d'environ", nombre: "1", unite: "cm³", fin: ""},
    // Lot B1-1 (carte v4 : le repère personnel, la ramette, S438-S439 ; le
    // programme de CM1 : « estimer la contenance d'une bouteille, d'un
    // arrosoir ») : la planche 7, dessinée le 15/11.
    {code: "l12", grandeur: "longueur", etape: "R3", objet: "Mon empan", valeur: "environ 15 cm", debut: "Mon empan mesure environ", nombre: "15", unite: "cm", fin: ""},
    {code: "m9", grandeur: "masse", etape: "R4", objet: "Une ramette de 500 feuilles A4", valeur: "environ 2,5 kg", debut: "Une ramette de 500 feuilles A4 pèse environ", nombre: "2,5", unite: "kg", fin: ""},
    {code: "c6", grandeur: "contenance", etape: "R5", objet: "Un grand arrosoir", valeur: "10 L", debut: "Un grand arrosoir contient", nombre: "10", unite: "L", fin: ""},
    {code: "c7", grandeur: "contenance", etape: "R5", objet: "Une bouteille d'eau", valeur: "1,5 L", debut: "Une bouteille d'eau contient", nombre: "1,5", unite: "L", fin: ""}
  ];
  // Lot 3b-2 : chaque repère a son illustration (conversions-reperes/,
  // dessinées par ChatGPT d'après les planches du lot 3b, découpées par
  // Claude ; elles remplacent les émoticônes). Trois repères reprennent
  // l'image d'un autre : la voiture (4 m, 1 t), la feuille A4 (21 cm, 6 dm²),
  // la brique de lait (1 L, 1 dm³). Le Piton des Neiges est une adaptation
  // d'une photo sous licence CC BY-SA 3.0 : son crédit s'écrit sous l'image.
  // Les mesures ne sont jamais dans l'image : l'appli les écrit dessous.
  const IMAGES_REPRISES = {m6: "l4", a2: "l3", v2: "c3"};
  const CREDITS = {l8: "D'après Nicolas PAYET, Piton des Neiges depuis Cilaos, CC BY-SA 3.0 ; adaptation illustrée"};
  REPERES.forEach(r => {
    r.image = `${IMAGES_REPRISES[r.code] || r.code}.webp`;
    if (CREDITS[r.code]) r.credit = CREDITS[r.code];
  });

  // ------------------------------------------------- le contenu du palier 1
  // `apprends` : « On te montre », 3 temps, un exemple fixe chacun (jamais
  // repris dans les séries : leurs clés sont exclues par les générateurs).
  // Chaque temps : `etiquette` (« Je vois »…), `question` (la case remplie à
  // la fin : avant / reponse / apres, ou `enonce` pour un problème),
  // `consigne`, `aide` (le dessin et ses réglages, pour
  // defi_conversions_aides.js), `apres` (les lignes qui s'affichent quand le
  // geste est fait), `legende`.
  // `retenir` : la phrase « À retenir », entière, mathématique, sans trou.
  // `relations` : le petit tableau de l'écran « À retenir » (planche 3).
  // `aide` : l'aide de « À toi » — `outil` (2 justes), puis `image`.
  const RELATIONS_BASES = ["1 m = 10 dm", "1 kg = 1 000 g", "1 m = 100 cm", "1 t = 1 000 kg", "1 dm = 10 cm", "1 L = 10 dL",
    "1 cm = 10 mm", "1 L = 100 cL", "1 m = 1 000 mm", "1 km = 1 000 m"];

  const CONTENU = {
    R1: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Une voiture mesure environ", reponse: "4", apres: "m"},
          consigne: "Un repère, c'est un objet que je connais bien : il m'aide à imaginer une mesure.",
          aide: {type: "repere", repere: "l4"}, legende: "Une voiture : environ 4 m de long.\nUn mètre, c'est un grand pas."},
        {etiquette: "Je vois", question: {avant: "Un paquet de riz pèse", reponse: "1", apres: "kg"},
          consigne: "Un repère, c'est un objet que je connais bien : il m'aide à imaginer une mesure.",
          aide: {type: "repere", repere: "m4"}, legende: "Un paquet de riz : 1 kg.\nUne feuille de papier ne pèse que quelques grammes."},
        {etiquette: "Je vois", question: {avant: "Une brique de lait contient", reponse: "1", apres: "L"},
          consigne: "Un repère, c'est un objet que je connais bien : il m'aide à imaginer une mesure.",
          aide: {type: "repere", repere: "c3"}, legende: "Une brique de lait : 1 L.\nUne canette : 33 cL, un tiers de litre."}
      ],
      // Lot A2 ter (choix de Gwenaël, le 13/11 : « ça fait beaucoup à lire
      // là-haut ; on laisse que les trucs que tu as mis en dessous ») : les
      // cartes des repères disent tout, le texte s'en va.
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["l1", "l3", "l4", "l7", "m3", "m4", "m5", "m6", "c3", "c2"]
    },
    R2: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "La longueur d'un crayon :", reponse: "15", apres: "cm"},
          consigne: "Je compare à mes repères.", aide: {type: "unites", grandeur: "longueur", unites: ["mm", "cm", "m", "km"], bonne: "cm"},
          legende: "Un crayon, c'est bien plus long qu'un centimètre\net bien plus court qu'un mètre : 15 cm."},
        {etiquette: "Je vois", question: {avant: "Un bébé à la naissance :", reponse: "3", apres: "kg"},
          consigne: "Je compare à mes repères.", aide: {type: "unites", grandeur: "masse", unites: ["g", "kg", "t"], bonne: "kg"},
          legende: "Un bébé pèse autant que 3 paquets de riz : 3 kg.\n3 g, c'est moins qu'une pièce de 1 €."},
        // Lot A2 bis : la récréation remplace « De Saint-Denis à Saint-Paul »
        // (revenu dans les séries) : d'abord ce qu'on mesure, puis l'unité.
        {etiquette: "Je vois", question: {avant: "La récréation :", reponse: "15", apres: "min"},
          consigne: "D'abord, je me demande ce que je mesure.\nPuis je choisis l'unité.", aide: {type: "grandeurs", bonne: "duree"},
          legende: "La récréation, c'est une durée : 15 min.\n15 h, ce serait plus qu'une journée d'école !"}
      ],
      retenir: "Je me demande d'abord ce que je mesure : une longueur, une masse, une contenance ou une durée.\nPuis je compare à mes repères : un crayon mesure 15 cm, pas 15 m.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    P1: {
      pret: true,
      aide: {outil: "glisse-unite", image: "prefixe"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 m =", reponse: "100", apres: "cm"},
          consigne: "Touche le mètre : il s'ouvre en 100 centimètres.",
          aide: {type: "barres", n: 1, grande: "m", petite: "cm", facteur: 100}, apres: ["1 m = 100 cm"],
          legende: "Une règle de 1 m a 100 petits traits de 1 cm."},
        {etiquette: "Je vois", question: {avant: "1 L =", reponse: "100", apres: "cL"},
          consigne: "Touche le verre doseur : ses traits comptent les centilitres.",
          aide: {type: "verre", grande: "L", petite: "cL", facteur: 100}, apres: ["1 L = 100 cL"],
          legende: "L'eau arrive au trait du haut : 1 L, c'est 100 cL."},
        {etiquette: "Je vois", question: {avant: "1 kg =", reponse: "1 000", apres: "g"},
          consigne: "Touche le plateau vide : pose des tablettes de 100 g jusqu'à l'équilibre.",
          aide: {type: "balance", nombre: 10}, apres: ["10 tablettes de 100 g", "= 1 000 g"],
          legende: "kilo veut dire mille : 1 kilogramme = 1 000 grammes."}
      ],
      // Lot A2 ter : le tableau des relations dit tout (choix de Gwenaël).
      retenir: "",
      cahier: "Je recopie cela dans mon cahier.",
      relations: RELATIONS_BASES,
      reperes: []
    },
    C1: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "3 m =", reponse: "300", apres: "cm"},
          consigne: "Touche chaque mètre : il s'ouvre en 100 centimètres.",
          aide: {type: "barres", n: 3, grande: "m", petite: "cm", facteur: 100},
          apres: ["100 cm + 100 cm + 100 cm", "= 300 cm"]},
        {etiquette: "Je représente", question: {avant: "4 kg =", reponse: "4 000", apres: "g"},
          relation: ["1 kg = 1 000 g", "donc 4 kg = 4 × 1 000 g"],
          aide: {type: "glisse-nombre", nombre: "4", rangs: 3, sens: "×"},
          apres: ["Le 4 glisse de 3 colonnes :", "il vaut 1 000 fois plus."]},
        {etiquette: "Je vérifie pourquoi", question: {avant: "5 L =", reponse: "500", apres: "cL"},
          consigne: "Le nombre ne bouge pas :\nc'est l'unité qui change de place.",
          aide: {type: "glisse-unite", grandeur: "contenance", nombre: "5", de: "L", vers: "cL"},
          apres: ["Je glisse l'unité de L à cL.", "Le 5 reste sous L, les 0 remplissent dL et cL."]}
      ],
      retenir: "Vers une unité plus petite, il en faut plus : je multiplie.\n3 m = 3 × 100 cm = 300 cm.",
      cahier: "Je recopie cela dans mon cahier.",
      relations: RELATIONS_BASES,
      reperes: []
    },
    C2: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "500 cm =", reponse: "5", apres: "m"},
          consigne: "Touche chaque paquet de 100 cm : il se regroupe en 1 mètre.",
          aide: {type: "barres", n: 5, grande: "m", petite: "cm", facteur: 100, regrouper: true},
          apres: ["5 paquets de 100 cm", "= 5 m"]},
        {etiquette: "Je représente", question: {avant: "3 000 g =", reponse: "3", apres: "kg"},
          relation: ["1 kg = 1 000 g", "donc 3 000 g = 3 000 ÷ 1 000 kg"],
          aide: {type: "glisse-nombre", nombre: "3000", rangs: 3, sens: "÷"},
          apres: ["Les chiffres glissent de 3 colonnes :", "le 3 vaut 1 000 fois moins."]},
        {etiquette: "Je vérifie pourquoi", question: {avant: "40 mm =", reponse: "4", apres: "cm"},
          consigne: "Le nombre ne bouge pas :\nc'est l'unité qui change de place.",
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "40", de: "mm", vers: "cm"},
          apres: ["Je glisse l'unité de mm à cm.", "Le 4 est sous cm : 40 mm = 4 cm."]}
      ],
      retenir: "Vers une unité plus grande, il en faut moins : je divise. 600 cm = 600 ÷ 100 m = 6 m.\nPour ranger des mesures, je les écris dans la même unité.",
      cahier: "Je recopie cela dans mon cahier.",
      relations: RELATIONS_BASES,
      reperes: []
    },
    D1: {
      pret: true,
      // L'image de « À toi » : le tableau 1 h → 60 min, 2 h → 120 min… (lot A2 bis).
      aide: {outil: "barre-heure", image: "tableau"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 h =", reponse: "60", apres: "min"},
          consigne: "Touche l'horloge : la grande aiguille avance d'un quart d'heure.",
          aide: {type: "horloge", pas: 15, fin: 60},
          apres: ["15 min + 15 min + 15 min + 15 min", "= 60 min"],
          legende: "De 8 h à 9 h, la grande aiguille fait un tour complet."},
        {etiquette: "Je représente", question: {avant: "2 h =", reponse: "120", apres: "min"},
          relation: ["1 h = 60 min", "donc 2 h = 2 × 60 min"],
          aide: {type: "heure", heures: 2, parts: 1},
          apres: ["60 min + 60 min = 120 min"]},
        {etiquette: "Je représente", question: {avant: "1 h 10 min =", reponse: "70", apres: "min"},
          relation: ["1 h = 60 min", "donc 1 h 10 min = 60 min + 10 min"],
          aide: {type: "heure", heures: 1, parts: 1, plus: 10},
          apres: ["60 min + 10 min = 70 min"]}
      ],
      retenir: "1 h = 60 min, pas 100 min.\n1 h 10 min = 60 min + 10 min = 70 min.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    D2: {
      pret: true,
      aide: {outil: "barre-heure", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "une demi-heure =", reponse: "30", apres: "min"},
          consigne: "Touche l'horloge : la grande aiguille fait un demi-tour.",
          aide: {type: "horloge", pas: 30, fin: 30},
          apres: ["La moitié d'une heure :", "une demi-heure = 30 min"]},
        {etiquette: "Je vois", question: {avant: "un quart d'heure =", reponse: "15", apres: "min"},
          consigne: "Touche l'horloge : la grande aiguille fait un quart de tour.",
          aide: {type: "horloge", pas: 15, fin: 15},
          apres: ["Le quart d'une heure :", "un quart d'heure = 15 min"]},
        {etiquette: "Je représente", question: {avant: "trois quarts d'heure =", reponse: "45", apres: "min"},
          relation: ["un quart d'heure = 15 min", "donc trois quarts d'heure = 3 × 15 min"],
          aide: {type: "heure", heures: 1, parts: 4, verte: true, compte: 3},
          apres: ["3 quarts : 3 × 15 min = 45 min"]}
      ],
      retenir: "Une demi-heure = 30 min ; un quart d'heure = 15 min.\nTrois quarts d'heure = 3 × 15 min = 45 min.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    Q1: {
      pret: true,
      aide: {outil: "schema", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Un ruban mesure 2 m. Léa en coupe 50 cm. Quelle longueur de ruban reste-t-il, en cm ?", avant: "Il reste", reponse: "150", apres: "cm"},
          consigne: "Je mets tout dans la même unité.",
          aide: {type: "schema", tout: "2 m = 200 cm", parts: ["50 cm", "? cm"], cherchee: 1, proportions: [1, 3]},
          apres: ["Le tout en haut : le ruban entier.", "Dessous : le morceau coupé et ce qui reste."]},
        {etiquette: "Je représente", question: {enonce: "Noa achète 1 kg de riz et 500 g de lentilles. Quelle est la masse en tout, en g ?", avant: "En tout,", reponse: "1 500", apres: "g"},
          relation: ["1 kg = 1 000 g", "1 000 g + 500 g = 1 500 g"],
          aide: {type: "schema", tout: "? g", parts: ["1 kg = 1 000 g", "500 g"], cherchee: -1, proportions: [2, 1]},
          apres: ["Le tout en haut : ce que je cherche.", "Dessous : les deux masses, dans la même unité."]},
        {etiquette: "Je vérifie", question: {enonce: "Un ruban mesure 3 m. Enzo en coupe 20 cm. Enzo trouve qu'il reste 280 cm de ruban.", vraisemblable: true, reponse: "Oui"},
          consigne: "Est-ce vraisemblable ?",
          aide: {type: "phrase", lignes: ["3 m = 300 cm", "300 cm − 20 cm = 280 cm"]},
          apres: ["Oui : il reste un peu moins que le ruban entier."]}
      ],
      retenir: "Avant d'ajouter ou de retirer des mesures, je les écris dans la même unité : 2 m − 50 cm = 200 cm − 50 cm = 150 cm.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Lot A2 bis : la monnaie (programme de CE1 et de CE2 ; Singapour,
    // Primary 2). Le concret : la pièce de 1 € qu'on échange contre 100
    // pièces de 1 c, les pièces d'un prix, l'étiquette. La virgule n'apparaît
    // que sur les prix (« 2,50 € ») : la réponse est toujours un entier.
    E1: {
      pret: true,
      aide: {outil: "monnaie", image: "pieces"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 € =", reponse: "100", apres: "c"},
          consigne: "Touche la pièce de 1 € : on l'échange contre des pièces de 1 centime.",
          aide: {type: "echange"}, apres: ["10 rangées de 10 pièces de 1 c", "= 100 c"],
          legende: "c, c'est le centime : 1 c est le centième de 1 €."},
        {etiquette: "Je représente", question: {avant: "3 € 50 c =", reponse: "350", apres: "c"},
          relation: ["1 € = 100 c", "donc 3 € 50 c = 3 × 100 c + 50 c"],
          aide: {type: "pieces", pieces: [100, 100, 100, 50]},
          apres: ["100 c + 100 c + 100 c + 50 c", "= 350 c"]},
        {etiquette: "Je lis un prix", question: {avant: "2,50 € =", reponse: "2 € 50", apres: "c"},
          consigne: "Sur une étiquette, la virgule sépare\nles euros et les centimes.",
          aide: {type: "etiquette", euros: 2, centimes: 50},
          apres: ["2,50 € = 2 € 50 c"],
          legende: "Et 0,85 €, c'est 0 € 85 c : 85 c."}
      ],
      retenir: "1 € = 100 c : 3 € 50 c = 350 c.\nSur une étiquette, la virgule sépare les euros et les centimes : 2,50 € = 2 € 50 c.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Lot A2 bis : la durée entre deux instants (programme de CE1, CE2 et
    // CM1 ; Singapour, Primary 3 ; Ontario). Deux horloges, puis l'axe du
    // temps : un bond d'heures, un bond de minutes, et le bond jusqu'à
    // l'heure pile.
    D7: {
      pret: true,
      aide: {outil: "axe-temps", image: "horloges"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "De 8 h à 11 h :", reponse: "3", apres: "h"},
          consigne: "Touche l'horloge de départ : sa petite aiguille avance d'une heure.",
          aide: {type: "horloges", depart: 480, arrivee: 660},
          apres: ["1 h + 1 h + 1 h", "= 3 h"]},
        {etiquette: "Je représente", question: {avant: "De 8 h 30 à 10 h 50 :", reponse: "2 h 20", apres: "min"},
          consigne: "Touche l'axe du temps :\nun bond d'heures, puis un bond de minutes.",
          aide: {type: "axe", depart: 510, bonds: [120, 20]},
          apres: ["2 h + 20 min", "= 2 h 20 min"]},
        {etiquette: "Je représente", question: {enonce: "Le bus part à 10 h 40. Le trajet dure 35 min.", avant: "Arrivée :", reponse: "11 h 15", apres: ""},
          consigne: "Je fais un bond jusqu'à l'heure pile,\npuis le reste.",
          aide: {type: "axe", depart: 640, bonds: [20, 15], cherche: "arrivee"},
          apres: ["10 h 40 + 20 min = 11 h", "11 h + 15 min = 11 h 15"]}
      ],
      retenir: "Je fais des bonds sur l'axe du temps : les heures, puis les minutes, en passant par l'heure pile.\nDe 8 h 30 à 10 h 50 : 2 h + 20 min = 2 h 20 min.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // ============================================ palier 2 (lot B1-1)
    // Mes repères du CM1 (carte v4). On te montre : trois repères de
    // l'étape, chacun relié à ce que l'élève connaît déjà (la piste du
    // repère personnel : mon petit doigt, mon très grand pas). Les cartes
    // des repères disent tout, comme à « Mes premiers repères » : pas de
    // texte « À retenir ».
    R3: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Mon petit doigt a une largeur d'environ", reponse: "1", apres: "cm"},
          consigne: "Mes repères à moi, je les ai toujours avec moi :\nje mesure mon petit doigt avec ma règle.",
          aide: {type: "repere", repere: "l10"}, legende: "Mon petit doigt : environ 1 cm de large.\nMon empan, la main bien ouverte : environ 15 cm."},
        {etiquette: "Je vois", question: {avant: "Un très grand pas mesure environ", reponse: "1", apres: "m"},
          consigne: "Je fais un très grand pas,\npuis je le mesure avec le mètre de la classe.",
          aide: {type: "repere", repere: "l11"}, legende: "Un très grand pas : environ 1 m.\nUne voiture : environ 4 grands pas, 4 m."},
        {etiquette: "Je vois", question: {avant: "Un tour de piste d'athlétisme mesure", reponse: "400", apres: "m"},
          consigne: "Pour les grandes longueurs, un repère que je peux parcourir.",
          aide: {type: "repere", repere: "l5"}, legende: "Un tour de piste : 400 m.\nDeux tours et demi : 1 000 m, 1 km."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["l10", "l12", "l11", "l2", "l5", "l6", "l8", "l9"]
    },
    R4: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Un trombone pèse environ", reponse: "1", apres: "g"},
          consigne: "Je prends un trombone dans ma main :\nc'est à peu près 1 gramme.",
          aide: {type: "repere", repere: "m7"}, legende: "Un trombone : environ 1 g. Une feuille A4 : environ 5 g.\nUne ramette de 500 feuilles : environ 2,5 kg."},
        {etiquette: "Je vois", question: {avant: "Un litre d'eau pèse", reponse: "1", apres: "kg"},
          consigne: "Je pèse une bouteille de 1 L d'eau :\nl'eau seule pèse 1 kilogramme.",
          aide: {type: "repere", repere: "m8"}, legende: "1 L d'eau : 1 kg.\nUn pack de 6 bouteilles de 1,5 L : 9 L d'eau, environ 9 kg."},
        {etiquette: "Je vois", question: {avant: "Un grain de riz pèse environ", reponse: "25", apres: "mg"},
          consigne: "Pour les toutes petites masses :\nle milligramme (mg), mille fois plus petit que le gramme.",
          aide: {type: "repere", repere: "m1"}, legende: "Un grain de riz : environ 25 mg.\n40 grains de riz : environ 1 g."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["m7", "m8", "m1", "m2", "m9"]
    },
    R5: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Une cuillère à café contient", reponse: "5", apres: "mL"},
          consigne: "Pour les toutes petites quantités :\nle millilitre (mL), mille fois plus petit que le litre.",
          aide: {type: "repere", repere: "c1"}, legende: "Une cuillère à café : 5 mL.\n2 cuillères à café : 10 mL, 1 cL."},
        {etiquette: "Je vois", question: {avant: "Un verre contient environ", reponse: "20", apres: "cL"},
          consigne: "Je verse un verre d'eau dans le verre doseur.",
          aide: {type: "repere", repere: "c5"}, legende: "Un verre : environ 20 cL.\n5 verres remplissent une brique de 1 L ; 50 verres, un grand arrosoir de 10 L."},
        {etiquette: "Je vois", question: {avant: "Un chauffe-eau solaire contient environ", reponse: "200", apres: "L"},
          consigne: "Sur les toits de La Réunion,\nun repère pour les grandes quantités.",
          aide: {type: "repere", repere: "c4"}, legende: "Un chauffe-eau solaire : environ 200 L.\nAutant que 200 briques de lait."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["c1", "c5", "c7", "c6", "c4"]
    },
    // Est-ce vraisemblable ? Je compare à un repère que je connais.
    R6: {
      pret: true,
      aide: {outil: "reperes-unites", image: "repere-proche"},
      apprends: [
        {etiquette: "Je compare", question: {enonce: "Un lit mesure 2 cm de long.", vraisemblable: true, reponse: "Non"},
          consigne: "Est-ce vraisemblable ?\nJe compare à un repère que je connais.",
          aide: {type: "repere", repere: "l11"},
          apres: ["Non : un lit, c'est deux très grands pas.", "Environ 2 m de long."]},
        {etiquette: "Je compare", question: {enonce: "Ma trousse pèse environ 10 kg.", vraisemblable: true, reponse: "Non"},
          consigne: "Est-ce vraisemblable ?\nJe compare à un repère que je connais.",
          aide: {type: "repere", repere: "m5"},
          apres: ["Non : plus lourde qu'un pack d'eau !", "Une trousse : environ 300 g."]},
        {etiquette: "Je compare", question: {enonce: "Un seau contient environ 10 L.", vraisemblable: true, reponse: "Oui"},
          consigne: "Est-ce vraisemblable ?\nJe compare à un repère que je connais.",
          aide: {type: "repere", repere: "c6"},
          apres: ["Oui : autant qu'un grand arrosoir."]}
      ],
      retenir: "Je compare à un repère que je connais : un lit, c'est deux très grands pas, environ 2 m.\nUne mesure pas vraisemblable cache souvent une erreur d'unité.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // ============================================ palier 2 (lot B1-2)
    // Préfixes et relations (carte v4). L'outil de « À toi » : le
    // glisse-unité, toutes ses colonnes ; l'image : l'échelle des unités
    // (sans nombres).
    // Ce que veulent dire les préfixes. S002 p. 15-17 : « en faisant le lien
    // avec les unités de numération » : 1 km = 1 000 m à côté de 1 millier
    // = 1 000 unités ; puis le gramme partagé comme l'unité ; puis « 1 m,
    // c'est combien de fois 1 dm ? » (23,6 % répondent 100 fois en 6e).
    P2: {
      pret: true,
      aide: {outil: "glisse-unite", image: "echelle"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 km =", reponse: "1 000", apres: "m"},
          consigne: "kilo veut dire mille, comme dans un millier.",
          aide: {type: "numeration", sens: "plus", base: "m", titre: "Les longueurs"},
          legende: "hecto veut dire cent ; déca veut dire dix."},
        {etiquette: "Je vois", question: {avant: "1 g =", reponse: "1 000", apres: "mg"},
          consigne: "Le gramme se partage comme l'unité.",
          aide: {type: "numeration", sens: "moins", base: "g", titre: "Les masses"},
          legende: "Un grain de riz pèse environ 25 mg."},
        {etiquette: "Je vérifie", question: {avant: "1 m, c'est", reponse: "10", apres: "fois 1 dm"},
          consigne: "Touche le mètre : il s'ouvre en décimètres.",
          aide: {type: "barres", n: 1, grande: "m", petite: "dm", facteur: 10}, apres: ["1 m = 10 dm"],
          legende: "Pas 100 fois : déci veut dire un dixième.\n1 dm est le dixième de 1 m."}
      ],
      retenir: "kilo, comme un millier : 1 km = 1 000 m.\ncenti, comme un centième : 1 cm est le centième de 1 m, et 1 m = 100 cm.",
      titreRelations: "Les six préfixes",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["kilo : mille", "déci : un dixième", "hecto : cent", "centi : un centième", "déca : dix", "milli : un millième"],
      reperes: []
    },
    // Deux unités voisines (S002 : 1 dm = 10 cm et 1 cm = 0,1 dm ; 1 kg =
    // 10 hg). Le décimètre qui s'ouvre, le glisse-unité qui lit le dixième,
    // la balance aux tablettes de 1 hg.
    P3: {
      pret: true,
      aide: {outil: "glisse-unite", image: "echelle"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 dm =", reponse: "10", apres: "cm"},
          consigne: "Touche le décimètre : il s'ouvre en centimètres.",
          aide: {type: "barres", n: 1, grande: "dm", petite: "cm", facteur: 10}, apres: ["1 dm = 10 cm"],
          legende: "Deux unités voisines : la plus grande vaut 10 fois l'autre."},
        {etiquette: "Je représente", question: {avant: "1 cm =", reponse: "0,1", apres: "dm"},
          relation: ["1 dm = 10 cm", "donc 1 cm est un dixième de dm"],
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "1", de: "cm", vers: "dm", pale: false},
          apres: ["Je glisse l'unité de cm à dm.", "Le 1 est sous les dixièmes : 0,1 dm."]},
        {etiquette: "Je vois", question: {avant: "1 kg =", reponse: "10", apres: "hg"},
          consigne: "Touche le plateau vide : pose des tablettes de 1 hg jusqu'à l'équilibre.",
          aide: {type: "balance", nombre: 10, hg: true}, apres: ["10 tablettes de 1 hg", "= 1 kg"],
          legende: "hecto veut dire cent : 1 hg = 100 g."}
      ],
      retenir: "Deux unités voisines : la plus grande vaut 10 fois la plus petite.\n1 dm = 10 cm, et 1 cm est un dixième de dm : 1 cm = 0,1 dm.",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 dm = 10 cm", "1 cm = 0,1 dm", "1 kg = 10 hg", "1 hg = 0,1 kg", "1 cL = 10 mL", "1 mL = 0,1 cL"],
      reperes: []
    },
    // Toutes les relations à connaître : du mm au km, du mg à la tonne, du
    // mL au hL. L'hectomètre qui s'ouvre en 100 m (le tour de piste, 4 hm),
    // le litre qui glisse jusqu'au millilitre, et « 0,33 t ou 565 kg ? »
    // (programme de CM1 2025).
    P4: {
      pret: true,
      aide: {outil: "glisse-unite", image: "echelle"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 hm =", reponse: "100", apres: "m"},
          consigne: "Touche l'hectomètre : il s'ouvre en mètres.",
          aide: {type: "barres", n: 1, grande: "hm", petite: "m", facteur: 100}, apres: ["1 hm = 100 m"],
          legende: "Un tour de piste : 400 m, c'est 4 hm."},
        {etiquette: "Je représente", question: {avant: "1 L =", reponse: "1 000", apres: "mL"},
          relation: ["1 L = 10 dL = 100 cL", "et 1 cL = 10 mL"],
          aide: {type: "glisse-unite", grandeur: "contenance", nombre: "1", de: "L", vers: "mL", pale: false},
          apres: ["Le 1 reste sous L,", "les 0 remplissent dL, cL et mL."]},
        {etiquette: "Je vérifie", question: {enonce: "0,33 t ou 565 kg : quelle mesure est la plus grande ?", avant: "0,33 t =", reponse: "330", apres: "kg"},
          consigne: "Je les écris dans la même unité.",
          aide: {type: "glisse-unite", grandeur: "masse", nombre: "0,33", de: "t", vers: "kg", pale: false, colonnes: ["t", "", "", "kg", "hg", "dag", "g"]},
          apres: ["0,33 t = 330 kg : moins que 565 kg.", "565 kg est la plus grande."]}
      ],
      retenir: "Du mm au km, du mg au kg, du mL au hL : d'une unité à la suivante, c'est toujours 10 fois.\n1 hm = 10 dam = 100 m ; 1 t = 1 000 kg.",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 km = 1 000 m", "1 m = 1 000 mm", "1 hm = 100 m", "1 m = 100 cm", "1 kg = 1 000 g", "1 g = 1 000 mg",
        "1 hL = 100 L", "1 L = 1 000 mL", "1 t = 1 000 kg", "1 L = 100 cL"],
      reperes: []
    },
    // ============================================ palier 2 (lot B2-1)
    // Convertir avec des décimaux (carte v4). S002 p. 9, S003 p. 6-9 : le
    // glisse-nombre officiel, la colonne des unités grisée, AVEC la phrase
    // (« un dixième devient une unité ») ; « la virgule repère le chiffre
    // des unités ». L'outil de « À toi » : le glisse-unité, toutes ses
    // colonnes, avec la phrase des décimaux sous lui dans la correction.
    // Avec des nombres décimaux : trois mètres et un demi-mètre ; le
    // glisse-nombre officiel ; 45 cm = 0,45 m (la virgule repère le chiffre
    // des unités). L'image : la relation et le calcul posé.
    C3: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "3,5 m =", reponse: "350", apres: "cm"},
          consigne: "Touche chaque morceau : il s'ouvre en centimètres.",
          aide: {type: "barres", n: 3, reste: "0,5", grande: "m", petite: "cm", facteur: 100},
          apres: ["300 cm + 50 cm", "= 350 cm"],
          legende: "3,5 m : trois mètres et un demi-mètre."},
        {etiquette: "Je représente", question: {avant: "2,4 L =", reponse: "24", apres: "dL"},
          relation: ["1 L = 10 dL", "donc 2,4 L = 2,4 × 10 dL"],
          aide: {type: "glisse-nombre", nombre: "2,4", rangs: 1, sens: "×"},
          apres: ["Le 4 glisse aux unités :", "un dixième devient une unité."]},
        {etiquette: "Je vérifie pourquoi", question: {avant: "45 cm =", reponse: "0,45", apres: "m"},
          consigne: "La virgule repère le chiffre des unités.",
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "45", de: "cm", vers: "m", pale: false},
          apres: ["Sous m, le 0 : le chiffre des unités.", "La virgule le suit : 0,45 m."]}
      ],
      retenir: "Avec une virgule, je convertis de la même façon :\n3,5 m = 3,5 × 100 cm = 350 cm.\nLa virgule repère le chiffre des unités : 45 cm = 0,45 m.",
      cahier: "Je recopie cela dans mon cahier.",
      relations: RELATIONS_BASES,
      reperes: []
    },
    // En mètre, en gramme, en litre (S002 p. 15-17, les exemples officiels
    // 12,3 hm = 1 230 m ; 41 dg = 4,1 g ; et S434, « 75 L = … cL », dont
    // les mauvaises réponses 750, 7,5, 0,75 sont des unités voisines).
    // L'image : l'échelle des unités.
    C4: {
      pret: true,
      aide: {outil: "glisse-unite", image: "echelle"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "12,3 hm =", reponse: "1 230", apres: "m"},
          relation: ["1 hm = 100 m", "donc 12,3 hm = 12,3 × 100 m"],
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "12,3", de: "hm", vers: "m", pale: false},
          apres: ["Je glisse l'unité de hm à m.", "Le 0 remplit la colonne m : 1 230 m."]},
        {etiquette: "Je représente", question: {avant: "41 dg =", reponse: "4,1", apres: "g"},
          consigne: "Le nombre ne bouge pas :\nc'est l'unité qui change de place.",
          aide: {type: "glisse-unite", grandeur: "masse", nombre: "41", de: "dg", vers: "g", pale: false, colonnes: ["kg", "hg", "dag", "g", "dg", "cg", "mg"]},
          apres: ["Sous g, le 4 : le chiffre des unités.", "41 dg = 4,1 g."]},
        {etiquette: "Je vérifie", question: {avant: "75 L =", reponse: "7 500", apres: "cL"},
          consigne: "Je glisse jusqu'à cL, pas seulement jusqu'à dL.",
          aide: {type: "glisse-unite", grandeur: "contenance", nombre: "75", de: "L", vers: "cL", pale: false},
          apres: ["Les 0 remplissent dL et cL.", "75 L = 7 500 cL."],
          legende: "Pas 750 : ce serait des dL."}
      ],
      retenir: "Je place le chiffre des unités sous l'unité de la mesure, puis je glisse jusqu'à l'unité demandée.\n12,3 hm = 1 230 m\n41 dg = 4,1 g\n75 L = 7 500 cL",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 hm = 100 m", "1 dm = 0,1 m", "1 dag = 10 g", "1 dg = 0,1 g", "1 hL = 100 L", "1 cL = 0,01 L"],
      reperes: []
    }
  };

  // ------------------------------------------------------------- l'assemblage
  const PALIERS_T = PALIERS.map(p => Object.assign({}, p, {etapes: 0}));
  const FAMILLE_RANG = {};
  FAMILLES.forEach((f, i) => { FAMILLE_RANG[f.code] = i; });

  const ETAPES_T = ETAPES.map(e => {
    const contenu = CONTENU[e.code] || null;
    const etape = Object.assign({}, typographier(e), {
      code: e.code,
      nomCourt: typo(e.nomCourt || e.nom),
      pret: Boolean(contenu && contenu.pret),
      cachee: Boolean(e.cachee)
    });
    if (contenu) Object.assign(etape, typographier(contenu));
    else etape.reperes = REPERES.filter(r => r.etape === e.code).map(r => r.code);
    if (contenu && !contenu.reperes.length) etape.reperes = [];
    return etape;
  });
  // Le nombre d'étapes d'un palier : celles que l'élève voit.
  ETAPES_T.forEach(e => { if (!e.cachee) PALIERS_T[e.palier - 1].etapes += 1; });

  // L'ordre du parcours : palier, famille, rang. Sans les étapes cachées.
  const ORDRE = ETAPES_T.filter(e => !e.cachee).sort((a, b) => a.palier - b.palier
    || FAMILLE_RANG[a.famille] - FAMILLE_RANG[b.famille] || a.rang - b.rang).map(e => e.code);

  const PAR_CODE = {};
  ETAPES_T.forEach(e => { PAR_CODE[e.code] = e; });
  const REPERES_T = REPERES.map(r => Object.assign({}, typographier(r), {code: r.code, nombre: r.nombre, unite: r.unite, image: r.image}));
  const REPERE_PAR_CODE = {};
  REPERES_T.forEach(r => { REPERE_PAR_CODE[r.code] = r; });

  function etape(code) {
    return PAR_CODE[code] || null;
  }
  function repere(code) {
    return REPERE_PAR_CODE[code] || null;
  }
  function palier(n) {
    return PALIERS_T[n - 1] || null;
  }
  // Les étapes d'un palier, dans l'ordre du parcours.
  function etapesDuPalier(n) {
    return ORDRE.filter(code => PAR_CODE[code].palier === n).map(code => PAR_CODE[code]);
  }
  // Les familles d'un palier, avec leurs étapes : [{code, nom, etapes}].
  function famillesDuPalier(n) {
    const noms = NOMS_FAMILLES_PAR_PALIER[n] || {};
    return FAMILLES.map(f => ({code: f.code, nom: noms[f.code] || f.nom,
      etapes: etapesDuPalier(n).filter(e => e.famille === f.code)})).filter(f => f.etapes.length);
  }
  // Un palier est « prêt » quand toutes ses étapes le sont (lot 1 : le 1 seul).
  function palierPret(n) {
    return etapesDuPalier(n).every(e => e.pret);
  }
  // Lot B1-1 : les étapes construites (le mode professeur, le robot), et le
  // parcours de l'élève : seulement les paliers prêts. Une étape prête dans
  // un palier en construction (le palier 2 après B1-1 : 4 étapes sur 16)
  // n'y entre pas : Mon parcours ne montre ce palier qu'une fois toutes ses
  // étapes prêtes, l'élève n'y tombe pas sans le voir.
  const PRETES = ORDRE.filter(code => PAR_CODE[code].pret);
  const PARCOURS = PRETES.filter(code => palierPret(PAR_CODE[code].palier));

  return geler({
    PALIERS: PALIERS_T,
    FAMILLES,
    ETAPES: ETAPES_T,
    REPERES: REPERES_T,
    ORDRE,
    PRETES,
    PARCOURS,
    typo,
    etape,
    repere,
    palier,
    etapesDuPalier,
    famillesDuPalier,
    palierPret
  });
});
