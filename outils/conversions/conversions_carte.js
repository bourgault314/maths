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
// « Problèmes : vitesses et débits » (3e : grandeurs composées), puis
// « Problèmes : vitesses, débits et masses volumiques » (carte v4, lot B6-3).
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
  const UNITES_TEXTE = "centimes?|carreaux?|c|km|hm|dam|dm|cm|mm|m|kg|hg|dag|dg|cg|mg|g|t|hL|daL|dL|cL|mL|L|min|h|s|km²|m²|dm²|cm²|mm²|m³|dm³|cm³|ko|Mo|Go|o|Mm|µm|nm|µg|ng|µL|kW|MW|GW|W|km/h|m/s|m/min|ha|ans?|mois|siècles?|millénaires?|jours?|semaines?|étapes?|repères?|questions?|justes|erreurs?|fois|sur|(?:kilo|hecto|déca|déci|centi|milli)?(?:mètres?|grammes?|litres?)|€|bouteilles|virus|chansons|photos|pouces?|milles?|morceaux|étagères|planches?|verres?|barquettes|tours|longueurs|tronçons|sachets|sacs|seaux|doses|parts|parties|coupons|fois";
  const RE_MILLIERS = /(\d) (?=\d{3}(?!\d))/g;
  const RE_UNITE = new RegExp(`(\\d) (?=(?:${UNITES_TEXTE})(?![\\wÀ-ÿ²³]))`, "g");

  // Les espaces des nombres et des unités, comme au cahier (et comme
  // formaterNombre de Défi calcul). Idempotent.
  function typo(texte) {
    if (typeof texte !== "string") return texte;
    let t = texte;
    for (let i = 0; i < 3; i += 1) t = t.replace(RE_MILLIERS, `$1${FINE}`);
    t = t.replace(RE_UNITE, `$1${INSECABLE}`);
    // (Lot B5-1 : l'are, « 6,5 a », mais pas « une feuille A4 a une aire ».)
    t = t.replace(/(^|[^\wÀ-ÿ\d,])(\d+(?:,\d+)?) a(?![\wÀ-ÿ²³'’])/g, `$1$2${INSECABLE}a`);
    // (Lot B2-3b-2 : une heure ou une durée ne se coupe pas entre « h » et
    // les minutes : « 10 h 40 », « 1 h 10 min ».)
    t = t.replace(new RegExp(`(\\d${INSECABLE}h) (?=\\d)`, "g"), `$1${INSECABLE}`);
    // (Lot B3-3 : à la seconde, « 12 min 15 s » ne se coupe pas non plus.)
    t = t.replace(new RegExp(`(\\d${INSECABLE}min) (?=\\d+${INSECABLE}s(?![\\wÀ-ÿ]))`, "g"), `$1${INSECABLE}`);
    t = t.replace(new RegExp(`(\\d${INSECABLE}jours) (?=\\d+${INSECABLE}h(?![\\wÀ-ÿ]))`, "g"), `$1${INSECABLE}`);
    // (Lot B4-2 : « 3 semaines 4 jours 9 h », « 6 ans 4 mois », « 2 siècles
    // 30 ans » ne se coupent pas non plus.)
    t = t.replace(new RegExp(`(\\d${INSECABLE}(?:semaines?|jours?|ans?|mois|siècles?|millénaires?)) (?=\\d+${INSECABLE}(?:semaines?|jours?|h|ans?|mois|siècles?)(?![\\wÀ-ÿ]))`, "g"), `$1${INSECABLE}`);
    // (Lot B6-2 : « 3 × 10⁻⁶ L » ne se coupe pas : ni après l'exposant, ni
    // autour du « × » devant une puissance de 10.)
    t = t.replace(new RegExp(`([⁰¹²³⁴⁵⁶⁷⁸⁹]) (?=(?:${UNITES_TEXTE})(?![\\wÀ-ÿ²³]))`, "g"), `$1${INSECABLE}`);
    t = t.replace(/(\d) × (?=10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻])/g, `$1${INSECABLE}×${INSECABLE}`);
    t = t.replace(/ ([?!:;»])/g, `${INSECABLE}$1`).replace(/« /g, `«${INSECABLE}`);
    // (Lot B3-1 : un nom de lieu ne se coupe pas à son trait d'union,
    // « Saint- / Paul » : le trait d'union insécable U+2011.)
    t = t.replace(/\b(Saint|Sainte|St|Ste)-(?=[A-ZÉÈ])/g, "$1\u2011");
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
    {code: "R1", rang: 1, palier: 1, famille: "reperes", classe: "CE1 · CE2", nom: "Mes premiers repères", exemple: "poignée : 1 m"},
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
    {code: "C5", rang: 17, palier: 2, famille: "convertir", classe: "CM1", nom: "Une mesure, plusieurs écritures", nomCourt: "Plusieurs écritures", exemple: "215 cm = 2,15 m"},
    {code: "C6", rang: 18, palier: 2, famille: "convertir", classe: "CM1", nom: "Les fractions usuelles", exemple: "3⁄4 m = 75 cm"},
    {code: "C7", rang: 19, palier: 2, famille: "convertir", classe: "CM1", nom: "Ranger des mesures", exemple: "250 cm < 3 m"},
    {code: "C8", rang: 20, palier: 2, famille: "convertir", classe: "CM1", nom: "Calculer avec deux unités", exemple: "1 L − 25 cL"},
    {code: "D2", rang: 21, palier: 1, famille: "durees", classe: "CE1", nom: "La demi-heure, le quart d'heure", exemple: ""},
    {code: "Q2", rang: 22, palier: 2, famille: "problemes", classe: "CM1", nom: "Problèmes : ajouter, retirer", nomCourt: "Ajouter, retirer", exemple: ""},
    // Palier 3 · Le CM2
    {code: "R7", rang: 23, palier: 3, famille: "reperes", classe: "CM2", nom: "J'estime avec un repère", exemple: ""},
    {code: "R8", rang: 24, palier: 3, famille: "reperes", classe: "CM2", nom: "Mes repères d'aire", exemple: "affiche A0 : 1 m²"},
    {code: "R9", rang: 25, palier: 3, famille: "reperes", classe: "CM2", nom: "Qu'est-ce qu'on mesure ?", exemple: ""},
    {code: "A1", rang: 26, palier: 3, famille: "aires", classe: "CM2", nom: "1 m² = 100 dm², 1 dm² = 100 cm²", nomCourt: "m², dm² et cm²", exemple: "1 m² = 100 dm²"},
    {code: "A2", rang: 27, palier: 3, famille: "aires", classe: "CM2", nom: "Convertir des aires (vers plus petit)", nomCourt: "Convertir des aires", exemple: "3,7 dm² = 370 cm²"},
    {code: "D3", rang: 28, palier: 3, famille: "durees", classe: "CM2", nom: "Minutes et secondes", exemple: "1 min = 60 s"},
    {code: "Q3", rang: 29, palier: 3, famille: "problemes", classe: "CM2", nom: "Problèmes : plusieurs fois, partager", nomCourt: "Plusieurs fois, partager", exemple: ""},
    {code: "Q4", rang: 30, palier: 3, famille: "problemes", classe: "CM2", nom: "Problèmes : une fraction d'une quantité", nomCourt: "Une fraction d'une quantité", exemple: ""},
    // Palier 4 · La 6e
    {code: "A3", rang: 31, palier: 4, famille: "aires", classe: "6e", nom: "Convertir des aires (vers plus grand)", nomCourt: "Aires : vers plus grand", exemple: "370 cm² = 3,7 dm²"},
    {code: "V1", rang: 32, palier: 4, famille: "volumes", classe: "6e", nom: "Le centimètre cube", exemple: "1 cm³"},
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
    {code: "D6", rang: 44, palier: 6, famille: "durees", classe: "4e", nom: "Toutes les heures décimales", nomCourt: "Heures décimales", exemple: "0,2 h = 12 min"},
    {code: "G1", rang: 45, palier: 6, famille: "grandeurs", classe: "4e", nom: "km/h et m/s", exemple: "36 km/h = 10 m/s"},
    {code: "P5", rang: 46, palier: 6, famille: "grandeurs", classe: "4e", nom: "Les préfixes de nano à giga", exemple: "1 Go = 1 000 Mo"},
    {code: "P6", rang: 47, palier: 6, famille: "grandeurs", classe: "3e", nom: "Les préfixes en puissances de 10", exemple: ""},
    {code: "Q9", rang: 48, palier: 6, famille: "problemes", classe: "4e", nom: "Problèmes : vitesses, débits et masses volumiques", nomCourt: "Grandeurs composées", exemple: "km/h, L/min, kg/m³"},
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
    {code: "l3", grandeur: "longueur", etape: "R3", objet: "Une feuille A4", valeur: "21 cm sur 29,7 cm", debut: "Une feuille A4 mesure", nombre: "21", unite: "cm", fin: "de large"},
    {code: "l4", grandeur: "longueur", etape: "R3", objet: "Une voiture", valeur: "environ 4 m de long", debut: "Une voiture mesure environ", nombre: "4", unite: "m", fin: "de long"},
    {code: "l5", grandeur: "longueur", etape: "R3", objet: "Un tour de piste d'athlétisme", valeur: "400 m", debut: "Un tour de piste d'athlétisme mesure", nombre: "400", unite: "m", fin: ""},
    {code: "l6", grandeur: "longueur", etape: "R3", objet: "Le viaduc de la Nouvelle route du Littoral", valeur: "5,4 km", debut: "Le viaduc de la Nouvelle route du Littoral mesure", nombre: "5,4", unite: "km", fin: "", local: true},
    {code: "l7", grandeur: "longueur", etape: "R3", objet: "De Saint‑Pierre à Saint‑Denis", valeur: "environ 80 km en voiture", debut: "De Saint‑Pierre à Saint‑Denis, en voiture, il y a environ", nombre: "80", unite: "km", fin: "", local: true},
    {code: "l8", grandeur: "longueur", etape: "R3", objet: "Le Piton des Neiges", valeur: "environ 3 km d'altitude", debut: "Le Piton des Neiges s'élève à environ", nombre: "3", unite: "km", fin: "d'altitude", local: true},
    {code: "l9", grandeur: "longueur", etape: "R3", objet: "La Diagonale des Fous", valeur: "environ 170 km", debut: "La Diagonale des Fous mesure environ", nombre: "170", unite: "km", fin: "", local: true},
    {code: "m1", grandeur: "masse", etape: "R4", objet: "Un grain de riz", valeur: "environ 25 mg", debut: "Un grain de riz pèse environ", nombre: "25", unite: "mg", fin: ""},
    {code: "m2", grandeur: "masse", etape: "R4", objet: "Une feuille A4", valeur: "environ 5 g", debut: "Une feuille A4 pèse environ", nombre: "5", unite: "g", fin: ""},
    {code: "m3", grandeur: "masse", etape: "R4", objet: "Une pièce de 1 €", valeur: "7,5 g", debut: "Une pièce de 1 € pèse", nombre: "7,5", unite: "g", fin: ""},
    {code: "m4", grandeur: "masse", etape: "R1", objet: "Un paquet de riz", valeur: "1 kg, sans l'emballage", debut: "Un paquet de riz pèse", nombre: "1", unite: "kg", fin: ""},
    {code: "m5", grandeur: "masse", etape: "R4", objet: "Un pack de 6 bouteilles d'eau", valeur: "environ 9 kg", debut: "Un pack de 6 bouteilles d'eau pèse environ", nombre: "9", unite: "kg", fin: ""},
    {code: "m6", grandeur: "masse", etape: "R1", objet: "Une petite voiture", valeur: "environ 1 t", debut: "Une petite voiture pèse environ", nombre: "1", unite: "t", fin: ""},
    {code: "c1", grandeur: "contenance", etape: "R5", objet: "Une cuillère à café", valeur: "5 mL", debut: "Une cuillère à café contient", nombre: "5", unite: "mL", fin: ""},
    {code: "c2", grandeur: "contenance", etape: "R1", objet: "Une canette", valeur: "33 cL", debut: "Une canette contient", nombre: "33", unite: "cL", fin: ""},
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
    {code: "l10", grandeur: "longueur", etape: "R1", objet: "La largeur de mon petit doigt", valeur: "environ 1 cm", debut: "Mon petit doigt a une largeur d'environ", nombre: "1", unite: "cm", fin: ""},
    {code: "l11", grandeur: "longueur", etape: "R3", objet: "Un très grand pas", valeur: "environ 1 m", debut: "Un très grand pas mesure environ", nombre: "1", unite: "m", fin: ""},
    {code: "m7", grandeur: "masse", etape: "R1", objet: "Un trombone", valeur: "environ 1 g", debut: "Un trombone pèse environ", nombre: "1", unite: "g", fin: ""},
    {code: "m8", grandeur: "masse", etape: "R4", objet: "Une bouteille de 1 L d'eau", valeur: "1 kg (sans la bouteille)", debut: "Un litre d'eau pèse", nombre: "1", unite: "kg", fin: ""},
    {code: "c5", grandeur: "contenance", etape: "R5", objet: "Un verre", valeur: "environ 20 cL", debut: "Un verre contient environ", nombre: "20", unite: "cL", fin: ""},
    {code: "a6", grandeur: "aire", etape: "R8", objet: "L'ongle de mon pouce", valeur: "environ 1 cm²", debut: "L'ongle de mon pouce a une aire d'environ", nombre: "1", unite: "cm²", fin: ""},
    {code: "a7", grandeur: "aire", etape: "R8", objet: "La paume de ma main", valeur: "environ 1 dm²", debut: "La paume de ma main a une aire d'environ", nombre: "1", unite: "dm²", fin: ""},
    // (Lot B5-1 : un dé à jouer fait environ 1,6 cm de côté, environ 4 cm³ —
    // vu au lot B4-1 ; il sert de repère à côté du petit cube, dans l'outil de R10.)
    {code: "v5", grandeur: "volume", etape: "V1", objet: "Un dé à jouer", valeur: "environ 4 cm³", debut: "Un dé à jouer a un volume d'environ", nombre: "4", unite: "cm³", fin: ""},
    // Lot B1-1 (carte v4 : le repère personnel, la ramette, S438-S439 ; le
    // programme de CM1 : « estimer la contenance d'une bouteille, d'un
    // arrosoir ») : la planche 7, dessinée le 15/11.
    {code: "l12", grandeur: "longueur", etape: "R3", objet: "Mon empan", valeur: "environ 15 cm", debut: "Mon empan mesure environ", nombre: "15", unite: "cm", fin: ""},
    {code: "m9", grandeur: "masse", etape: "R4", objet: "Une ramette de 500 feuilles A4", valeur: "environ 2,5 kg", debut: "Une ramette de 500 feuilles A4 pèse environ", nombre: "2,5", unite: "kg", fin: ""},
    {code: "c6", grandeur: "contenance", etape: "R5", objet: "Un grand arrosoir", valeur: "10 L", debut: "Un grand arrosoir contient", nombre: "10", unite: "L", fin: ""},
    {code: "c7", grandeur: "contenance", etape: "R5", objet: "Une bouteille d'eau", valeur: "1,5 L", debut: "Une bouteille d'eau contient", nombre: "1,5", unite: "L", fin: ""},
    // Lot R1-refonte (18/11, décidé avec Gwenaël) : « Mes premiers repères »
    // a UN repère par unité du CE2, dix en tout, les seuls à apprendre par
    // cœur au palier 1 : 1 mm la graduation (l1), 1 cm le petit doigt (l10,
    // venu de R3), 1 dm la main (l15), 1 m la poignée de porte (l13), 1 km
    // 10 terrains de foot (l14), 1 g le trombone (m7, venu de R4), 1 kg le
    // paquet de riz (m4), 1 t la petite voiture (m6), 33 cL la canette (c2),
    // 1 L la brique (c3). La feuille A4, la voiture de 4 m et Saint-Pierre →
    // Saint-Denis passent au CM1 (R3) ; la pièce de 1 € et le pack d'eau
    // aussi (R4). Les repères de la poignée, de la main et des terrains de
    // foot viennent de la colonne « Action en classe » de l'exerciseur
    // (ACTIONS_DB) et du programme du cycle 2 (S440 : « la hauteur de la
    // porte »). Un repère est approché (« environ ») ; une relation est
    // exacte (« = ») : jamais « = » pour un repère approché.
    {code: "l13", grandeur: "longueur", etape: "R1", objet: "La poignée de la porte", valeur: "à environ 1 m du sol", debut: "La poignée de la porte est à environ", nombre: "1", unite: "m", fin: "du sol"},
    {code: "l14", grandeur: "longueur", etape: "R1", objet: "10 terrains de foot bout à bout", valeur: "environ 1 km", debut: "10 terrains de foot bout à bout mesurent environ", nombre: "1", unite: "km", fin: ""},
    {code: "l15", grandeur: "longueur", etape: "R1", objet: "La largeur de ma main", valeur: "environ 1 dm (10 cm)", debut: "Ma main a une largeur d'environ", nombre: "1", unite: "dm", fin: ""}
  ];
  // Lot 3b-2 : chaque repère a son illustration (conversions-reperes/,
  // dessinées par ChatGPT d'après les planches du lot 3b, découpées par
  // Claude ; elles remplacent les émoticônes). Trois repères reprennent
  // l'image d'un autre : la voiture (4 m, 1 t), la feuille A4 (21 cm, 6 dm²),
  // la brique de lait (1 L, 1 dm³). Le Piton des Neiges est une adaptation
  // d'une photo sous licence CC BY-SA 3.0 : son crédit s'écrit sous l'image.
  // Les mesures ne sont jamais dans l'image : l'appli les écrit dessous.
  const IMAGES_REPRISES = {m6: "l4", a2: "l3", v2: "c3"};
  // (Lot R1-refonte : la poignée de porte, la main et le petit doigt sur la
  // règle viennent de la planche 8, dessinée le 18/11 ; le terrain de foot,
  // dessiné par Claude aux couleurs de la planche : la bande de 10 terrains
  // était illisible en petit.)
  const CREDITS = {l8: "D'après Nicolas PAYET, Piton des Neiges depuis Cilaos, CC BY-SA 3.0 ; adaptation illustrée"};
  REPERES.forEach(r => {
    r.image = `${IMAGES_REPRISES[r.code] || r.code}.webp`;
    if (CREDITS[r.code]) r.credit = CREDITS[r.code];
  });

  // Lot R1-noms (21/11, choix de Gwenaël : « est-ce que c'est pas trop dur
  // pour les élèves directement l'abréviation ? ») : le programme du cycle 2
  // (S440) demande les unités ET leurs symboles (« le mètre et le
  // centimètre et les symboles associés »). Les dix repères de « Mes
  // premiers repères » disent le nom de leur unité, en toutes lettres, à
  // côté du symbole (`lu` : « un centimètre », « 33 centilitres »).
  const NOMS_LUS = {mm: ["un millimètre", "millimètres"], cm: ["un centimètre", "centimètres"], dm: ["un décimètre", "décimètres"],
    m: ["un mètre", "mètres"], km: ["un kilomètre", "kilomètres"], g: ["un gramme", "grammes"], kg: ["un kilogramme", "kilogrammes"],
    t: ["une tonne", "tonnes"], cL: ["un centilitre", "centilitres"], dL: ["un décilitre", "décilitres"], L: ["un litre", "litres"],
    min: ["une minute", "minutes"], h: ["une heure", "heures"]};
  function lireMesure(nombre, unite) {
    const n = NOMS_LUS[unite];
    if (!n) return null;
    return String(nombre) === "1" ? n[0] : `${nombre}\u00a0${n[1]}`;
  }
  REPERES.forEach(r => { if (r.etape === "R1") r.lu = lireMesure(r.nombre, r.unite); });

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
    // Lot R1-refonte (18/11, choix de Gwenaël) : les dix repères, un par
    // unité du CE2. On te montre : un temps par repère (son dessin, sa
    // mesure, et le geste à faire en classe, repris de la colonne « Action
    // en classe » de l'exerciseur : toujours vérifier avec la règle, jamais
    // avec l'écran, qui ne montre pas les vrais centimètres). Puis la liste
    // des dix, à recopier, AVANT À toi (`listeAvant`) : aucune question ne
    // porte sur un repère pas encore vu.
    R1: {
      pret: true,
      listeAvant: true,
      aide: {outil: "carte-repere", image: "dessin-repere"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "La plus petite graduation de la règle mesure", reponse: "1", apres: "mm"},
          consigne: "Un repère, c'est un objet que je connais bien :\nil m'aide à imaginer une mesure.",
          aide: {type: "repere", repere: "l1"}, geste: "Regarde ta règle : entre deux petits traits, il y a 1 mm."},
        {etiquette: "Je vois", question: {avant: "Mon petit doigt a une largeur d'environ", reponse: "1", apres: "cm"},
          consigne: "Les longueurs : un repère pour chaque unité.",
          aide: {type: "repere", repere: "l10"}, geste: "Montre 1 cm avec tes doigts, puis vérifie avec ta règle."},
        {etiquette: "Je vois", question: {avant: "Ma main a une largeur d'environ", reponse: "1", apres: "dm"},
          consigne: "Les longueurs : un repère pour chaque unité.",
          aide: {type: "repere", repere: "l15"}, geste: "Pose ta main à plat sur ta règle : environ 10 cm."},
        {etiquette: "Je vois", question: {avant: "La poignée de la porte est à environ", reponse: "1", apres: "m du sol"},
          consigne: "Les longueurs : un repère pour chaque unité.",
          aide: {type: "repere", repere: "l13"}, geste: "Pose ta main sur la poignée de la porte : elle est à environ 1 m du sol."},
        {etiquette: "Je vois", question: {avant: "10 terrains de foot bout à bout mesurent environ", reponse: "1", apres: "km"},
          consigne: "Les longueurs : un repère pour chaque unité.",
          aide: {type: "repere", repere: "l14"}, geste: "10 terrains de foot bout à bout : environ un quart d'heure à pied."},
        {etiquette: "Je vois", question: {avant: "Un trombone pèse environ", reponse: "1", apres: "g"},
          consigne: "Les masses : un repère pour chaque unité.",
          aide: {type: "repere", repere: "m7"}, geste: "Prends un trombone dans ta main : il pèse environ 1 g."},
        {etiquette: "Je vois", question: {avant: "Un paquet de riz pèse", reponse: "1", apres: "kg"},
          consigne: "Les masses : un repère pour chaque unité.",
          aide: {type: "repere", repere: "m4"}, geste: "Soulève un paquet de riz : sans l'emballage, le riz pèse 1 kg."},
        {etiquette: "Je vois", question: {avant: "Une petite voiture pèse environ", reponse: "1", apres: "t"},
          consigne: "Les masses : un repère pour chaque unité.",
          aide: {type: "repere", repere: "m6"}, geste: "Une petite voiture, personne ne la soulève : environ 1 t."},
        {etiquette: "Je vois", question: {avant: "Une canette contient", reponse: "33", apres: "cL"},
          consigne: "Les contenances : un repère pour chaque unité.",
          aide: {type: "repere", repere: "c2"}, geste: "Regarde l'étiquette d'une canette : 33 cL."},
        {etiquette: "Je vois", question: {avant: "Une brique de lait contient", reponse: "1", apres: "L"},
          consigne: "Les contenances : un repère pour chaque unité.",
          aide: {type: "repere", repere: "c3"}, geste: "Prends une brique de lait : elle contient 1 L."}
      ],
      // Lot A2 ter (choix de Gwenaël, le 13/11 : « ça fait beaucoup à lire
      // là-haut ; on laisse que les trucs que tu as mis en dessous ») : les
      // cartes des repères disent tout, le texte s'en va.
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      // (Après À toi, la même liste revient avant Je valide : on la relit.)
      cahierApres: "Je relis mes repères, puis je valide.",
      reperes: ["l1", "l10", "l15", "l13", "l14", "m7", "m4", "m6", "c2", "c3"]
    },
    // Lot R1-refonte (Gwenaël, 18/11) : trois travaux séparés, un par
    // temps — la grandeur, l'unité dans la même grandeur, le nombre.
    R2: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        // Lot A2 bis : la récréation (d'abord ce qu'on mesure, puis l'unité).
        {etiquette: "Je vois", question: {avant: "La récréation :", reponse: "15", apres: "min"},
          consigne: "D'abord, je me demande ce que je mesure.\nPuis je choisis l'unité.", aide: {type: "grandeurs", bonne: "duree"},
          legende: "La récréation, c'est une durée : 15 min.\n15 h, ce serait plus qu'une journée d'école !"},
        {etiquette: "Je vois", question: {avant: "La longueur d'un crayon :", reponse: "15", apres: "cm"},
          consigne: "C'est une longueur. Je compare à mes repères\npour choisir l'unité.", aide: {type: "unites", grandeur: "longueur", unites: ["mm", "cm", "m", "km"], bonne: "cm"},
          legende: "Un crayon : plus long que mon petit doigt,\nbien plus court qu'un mètre : 15 cm."},
        {etiquette: "Je vois", question: {avant: "La hauteur d'une porte :", reponse: "2", apres: "m"},
          consigne: "L'unité est trouvée : le mètre.\nJe compare encore à mon repère pour le nombre.", aide: {type: "repere", repere: "l13"},
          legende: "La porte : à peu près deux fois la poignée.\n2 m, pas 20 m ni 200 m."}
      ],
      retenir: "Je me demande ce que je mesure : une longueur, une masse, une contenance, une durée.\nJe compare à mes repères : un crayon, 15 cm, pas 15 m ; une porte, 2 m, pas 20 m.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    P1: {
      pret: true,
      aide: {outil: "glisse-unite", image: "prefixe"},
      // Lot « cohérence » (25/11) : une étape de faits à savoir par cœur
      // montre TOUS ses faits. Un temps par relation, avec son objet (la
      // règle qui s'ouvre, la balance, le verre doseur), rangés par
      // grandeur ; un dernier temps pour l'autre sens (« 100 cm = 1 m »),
      // que « Je valide » demande une fois sur trois.
      apprends: [
        {etiquette: "Les longueurs", question: {avant: "1 m =", reponse: "100", apres: "cm"},
          consigne: "Touche le mètre : il s'ouvre en 100 centimètres.",
          aide: {type: "barres", n: 1, grande: "m", petite: "cm", facteur: 100}, apres: ["1 m = 100 cm"],
          legende: "Une règle de 1 m a 100 petits traits de 1 cm."},
        {etiquette: "Les longueurs", question: {avant: "1 m =", reponse: "10", apres: "dm"},
          consigne: "Touche le mètre : il s'ouvre en 10 décimètres.",
          aide: {type: "barres", n: 1, grande: "m", petite: "dm", facteur: 10}, apres: ["1 m = 10 dm"],
          legende: "1 dm, c'est la largeur de ma main."},
        {etiquette: "Les longueurs", question: {avant: "1 dm =", reponse: "10", apres: "cm"},
          consigne: "Touche le décimètre : il s'ouvre en 10 centimètres.",
          aide: {type: "barres", n: 1, grande: "dm", petite: "cm", facteur: 10}, apres: ["1 dm = 10 cm"],
          legende: "1 cm, c'est la largeur de mon petit doigt."},
        {etiquette: "Les longueurs", question: {avant: "1 cm =", reponse: "10", apres: "mm"},
          consigne: "Touche le centimètre : il s'ouvre en 10 millimètres.",
          aide: {type: "barres", n: 1, grande: "cm", petite: "mm", facteur: 10}, apres: ["1 cm = 10 mm"],
          legende: "1 mm : la plus petite graduation de ma règle."},
        {etiquette: "Les longueurs", question: {avant: "1 m =", reponse: "1 000", apres: "mm"},
          consigne: "Touche le mètre : il s'ouvre en 1 000 millimètres.",
          aide: {type: "barres", n: 1, grande: "m", petite: "mm", facteur: 1000}, apres: ["1 m = 1 000 mm"],
          legende: "100 centimètres de 10 mm chacun."},
        {etiquette: "Les longueurs", question: {avant: "1 km =", reponse: "1 000", apres: "m"},
          consigne: "Touche le kilomètre : il s'ouvre en 1 000 mètres.",
          aide: {type: "barres", n: 1, grande: "km", petite: "m", facteur: 1000}, apres: ["1 km = 1 000 m"],
          legende: "1 km : 10 terrains de foot bout à bout."},
        {etiquette: "Les masses", question: {avant: "1 kg =", reponse: "1 000", apres: "g"},
          consigne: "Touche le plateau vide : pose des tablettes de 100 g jusqu'à l'équilibre.",
          aide: {type: "balance", nombre: 10}, apres: ["10 tablettes de 100 g", "= 1 000 g"],
          legende: "kilo veut dire mille : 1 kilogramme = 1 000 grammes."},
        {etiquette: "Les masses", question: {avant: "1 t =", reponse: "1 000", apres: "kg"},
          consigne: "Touche la tonne : elle s'ouvre en 1 000 kilogrammes.",
          aide: {type: "barres", n: 1, grande: "t", petite: "kg", facteur: 1000}, apres: ["1 t = 1 000 kg"],
          legende: "Une petite voiture pèse environ 1 t."},
        {etiquette: "Les contenances", question: {avant: "1 L =", reponse: "100", apres: "cL"},
          consigne: "Touche le verre doseur : ses traits comptent les centilitres.",
          aide: {type: "verre", grande: "L", petite: "cL", facteur: 100}, apres: ["1 L = 100 cL"],
          legende: "L'eau arrive au trait du haut : 1 L, c'est 100 cL."},
        {etiquette: "Les contenances", question: {avant: "1 L =", reponse: "10", apres: "dL"},
          consigne: "Touche le verre doseur : ses traits comptent les décilitres.",
          aide: {type: "verre", grande: "L", petite: "dL", facteur: 10}, apres: ["1 L = 10 dL"],
          legende: "1 L, c'est 10 dL."},
        {etiquette: "Dans l'autre sens", question: {avant: "100 cm =", reponse: "1", apres: "m"},
          relation: ["1 m = 100 cm", "donc 100 cm = 1 m"],
          consigne: "Touche les 100 centimètres : ils se regroupent en 1 mètre.",
          aide: {type: "barres", n: 1, grande: "m", petite: "cm", facteur: 100, regrouper: true}, apres: ["100 cm = 1 m"],
          legende: "Une relation se lit dans les deux sens."}
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
          apres: ["60 min + 10 min = 70 min"]},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Dans l'autre sens", question: {avant: "130 min =", reponse: "2 h 10", apres: "min"},
          relation: ["1 h = 60 min", "130 min = 60 min + 60 min + 10 min"],
          aide: {type: "heure", heures: 2, parts: 1, plus: 10},
          apres: ["2 paquets de 60 min, et 10 min", "= 2 h 10 min"]}
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
          legende: "Et 0,85 €, c'est 0 € 85 c : 85 c."},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Dans l'autre sens", question: {avant: "400 c =", reponse: "4", apres: "€"},
          relation: ["1 € = 100 c", "donc 400 c = 4 × 100 c"],
          aide: {type: "pieces", pieces: [100, 100, 100, 100]},
          apres: ["100 c + 100 c + 100 c + 100 c", "= 4 €"]}
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
        // (Lot R1-refonte : le petit doigt est passé à « Mes premiers
        // repères » ; l'empan prend sa place.)
        {etiquette: "Je vois", question: {avant: "Mon empan mesure environ", reponse: "15", apres: "cm"},
          consigne: "Mes repères à moi, je les ai toujours avec moi :\nje mesure mon empan avec ma règle.",
          aide: {type: "repere", repere: "l12"}, legende: "Mon empan, la main bien ouverte : environ 15 cm.\nMa main, doigts serrés : environ 10 cm."},
        {etiquette: "Je vois", question: {avant: "Un très grand pas mesure environ", reponse: "1", apres: "m"},
          consigne: "Je fais un très grand pas,\npuis je le mesure avec le mètre de la classe.",
          aide: {type: "repere", repere: "l11"}, legende: "Un très grand pas : environ 1 m.\nUne voiture : environ 4 grands pas, 4 m."},
        {etiquette: "Je vois", question: {avant: "Un tour de piste d'athlétisme mesure", reponse: "400", apres: "m"},
          consigne: "Pour les grandes longueurs, un repère que je peux parcourir.",
          aide: {type: "repere", repere: "l5"}, legende: "Un tour de piste : 400 m.\nDeux tours et demi : 1 000 m, 1 km."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["l12", "l11", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9"]
    },
    R4: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        // (Lot R1-refonte : le trombone est passé à « Mes premiers
        // repères » ; la pièce de 1 € prend sa place.)
        {etiquette: "Je vois", question: {avant: "Une pièce de 1 € pèse", reponse: "7,5", apres: "g"},
          consigne: "Je pose une pièce de 1 € sur la balance de la classe.",
          aide: {type: "repere", repere: "m3"}, legende: "Une pièce de 1 € : 7,5 g. Une feuille A4 : environ 5 g.\nUne ramette de 500 feuilles : environ 2,5 kg."},
        {etiquette: "Je vois", question: {avant: "Un litre d'eau pèse", reponse: "1", apres: "kg"},
          consigne: "Je pèse une bouteille de 1 L d'eau :\nl'eau seule pèse 1 kilogramme.",
          aide: {type: "repere", repere: "m8"}, legende: "1 L d'eau : 1 kg.\nUn pack de 6 bouteilles de 1,5 L : 9 L d'eau, environ 9 kg."},
        {etiquette: "Je vois", question: {avant: "Un grain de riz pèse environ", reponse: "25", apres: "mg"},
          consigne: "Pour les toutes petites masses :\nle milligramme (mg), mille fois plus petit que le gramme.",
          aide: {type: "repere", repere: "m1"}, legende: "Un grain de riz : environ 25 mg.\n40 grains de riz : environ 1 g."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["m3", "m8", "m1", "m2", "m9", "m5"]
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
    // ============================================ palier 3 (lot B3-1)
    // Les repères du CM2. Choix de Gwenaël du 21/11 (lot B3-1a) : le repère
    // reporté le long de l'objet (les voitures au-dessus du bassin de la
    // piscine de Saint‑Paul) ; pour un calcul, « … est proche de… », les
    // arrondis ; périmètre ou aire, deux dessins. Ontario : « un étage ≈
    // 3 m » ; S002-S003 p. 10 : « 212 m + 298 m + 496 m est proche de
    // 1 000 m ».
    R7: {
      pret: true,
      aide: {outil: "reporte", image: "repere"},
      apprends: [
        {etiquette: "Je reporte", question: {enonce: "Le bassin de la piscine de Saint‑Paul mesure environ…", avant: "", reponse: "25", apres: "m"},
          consigne: "Je reporte mon repère.\nTouche les voitures.",
          aide: {type: "reporte", repere: "l4", n: 6, quarts: 25, nom: "Le bassin", mesure: "4 m", total: "25 m"},
          apres: ["6 voitures : environ 24 m,", "donc environ 25 m."]},
        {etiquette: "J'arrondis", question: {enonce: "212 m + 298 m + 496 m est proche de…", avant: "", reponse: "1 000", apres: "m"},
          consigne: "J'arrondis chaque nombre.\nTouche les nombres.",
          aide: {type: "arrondis", paires: [["212 m", "200 m"], ["298 m", "300 m"], ["496 m", "500 m"]]},
          apres: ["200 m + 300 m + 500 m = 1 000 m"]},
        {etiquette: "Je vérifie", question: {enonce: "Un immeuble a 12 étages. Un étage mesure environ 3 m. L'immeuble mesure environ…", avant: "", reponse: "36", apres: "m"},
          consigne: "Je compte 12 fois mon repère.",
          aide: {type: "phrase", lignes: ["Un étage : environ 3 m.", "12 étages : 12 fois plus."]},
          apres: ["12 × 3 m", "= 36 m"]}
      ],
      retenir: "Je compte combien de fois mon repère : 6 voitures de 4 m, environ 24 m.\nPour un calcul, j'arrondis chaque nombre : 212 m + 496 m ≈ 200 m + 500 m = 700 m.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Mes repères d'aire, au modèle des repères du CM1 (carte v4 : le
    // carreau, l'ongle, la paume, la feuille A4, l'affiche A0, le terrain
    // de foot).
    R8: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Un carreau de 1 cm de côté a une aire de", reponse: "1", apres: "cm²"},
          consigne: "Je trace un carré de 1 cm de côté :\nson aire est 1 centimètre carré.",
          aide: {type: "repere", repere: "a1"}, legende: "L'ongle de mon pouce : environ 1 cm²."},
        {etiquette: "Je vois", question: {avant: "La paume de ma main a une aire d'environ", reponse: "1", apres: "dm²"},
          consigne: "Un carré de 1 dm de côté : 1 décimètre carré.\nMa paume le couvre à peu près.",
          aide: {type: "repere", repere: "a7"}, legende: "La paume de ma main : environ 1 dm².\nUne feuille A4 : environ 6 dm²."},
        {etiquette: "Je vois", question: {avant: "Une affiche A0 a une aire de", reponse: "1", apres: "m²"},
          consigne: "Un carré de 1 m de côté : 1 mètre carré.\nUne affiche A0 a cette aire.",
          aide: {type: "repere", repere: "a3"}, legende: "16 feuilles A4 couvrent une affiche A0.\nUn terrain de foot : environ 7 000 m²."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["a1", "a6", "a7", "a2", "a3", "a4"]
    },
    // Qu'est-ce qu'on mesure ? Les cinq grandeurs du CM2, le périmètre ou
    // l'aire (S038 : repasser le contour, colorier la surface), le gros
    // qui n'est pas le plus lourd (S023 p. 3).
    R9: {
      pret: true,
      aide: {outil: "grandeurs", image: "grandeurs"},
      apprends: [
        {etiquette: "Je vois", question: {vraisemblable: true, enonce: "Je pose une clôture autour du jardin. Qu'est-ce que je mesure ?", reponse: "le périmètre"},
          consigne: "La clôture fait le tour du jardin.\nTouche le bon dessin.",
          aide: {type: "perim-aire", bonne: "perimetre"},
          apres: ["Le tour : le périmètre.", "C'est une longueur, en m."]},
        {etiquette: "Je vois", question: {vraisemblable: true, enonce: "Je pose du carrelage dans la cuisine. Qu'est-ce que je mesure ?", reponse: "l'aire"},
          consigne: "Le carrelage couvre tout le sol.\nTouche le bon dessin.",
          aide: {type: "perim-aire", bonne: "aire"},
          apres: ["La surface : l'aire.", "Je compte des carreaux, en m²."]},
        {etiquette: "Je compare", question: {vraisemblable: true, enonce: "Un paquet de céréales est plus gros qu'une bouteille d'eau de 1,5 L. Lequel est le plus lourd ?", reponse: "la bouteille"},
          consigne: "Gros ne veut pas dire lourd.\nJe pense à mon repère.",
          aide: {type: "repere", repere: "m8"},
          apres: ["La bouteille : environ 1,5 kg.", "Les céréales : environ 500 g."]}
      ],
      retenir: "Le périmètre, c'est le tour : une longueur. L'aire, c'est la surface, en carreaux.\nPlus gros ne veut pas dire plus lourd ; plus haut ne veut pas dire contenir plus.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // ============================================ palier 3 (lot B3-2)
    // C9 « Avec des millièmes » (S433 : 6 m 65 mm = 6,065 m ; 18 mm =
    // 0,018 m ; S003 p. 10 : 2 070 g = 2,07 kg, « l'arrondi à l'entier de
    // 5,78 est 6, de 3,5 est 4 »). Choix de Gwenaël du 21/11 (lot B3-2a) :
    // l'arrondi sur la droite graduée de 3 m à 4 m, le milieu en orange.
    C9: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "2,375 kg =", reponse: "2 375", apres: "g"},
          relation: ["1 kg = 1 000 g", "donc 2,375 kg = 2,375 × 1 000 g"],
          aide: {type: "glisse-unite", grandeur: "masse", nombre: "2,375", de: "kg", vers: "g", pale: false, colonnes: ["kg", "hg", "dag", "g", "dg", "cg", "mg"]},
          apres: ["Le 5 glisse aux unités :", "un millième de kg devient 1 g."]},
        {etiquette: "Je représente", question: {avant: "18 mm =", reponse: "0,018", apres: "m"},
          consigne: "La virgule repère le chiffre des unités.\nLes zéros remplissent les colonnes vides.",
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "18", de: "mm", vers: "m", pale: false},
          apres: ["Sous m, le 0 : le chiffre des unités.", "18 mm = 0,018 m."],
          legende: "Pas 0,18 m : ce serait 180 mm."},
        {etiquette: "J'arrondis", question: {avant: "3,584 m ≈", reponse: "4", apres: "m"},
          consigne: "Le nombre entier le plus proche.\nTouche la droite.",
          aide: {type: "droite-c9", a: 3, x: "3,584", u: "m"},
          apres: ["Plus près de 4 m que de 3 m :", "3,584 m ≈ 4 m"],
          legende: "Au milieu, au-dessus : 3,5 m ≈ 4 m."}
      ],
      retenir: "Avec des millièmes, je convertis de la même façon : 2,375 kg = 2 375 g ; 18 mm = 0,018 m.\nArrondir au mètre, c'est prendre le nombre entier de mètres le plus proche : 3,584 m ≈ 4 m.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["2,375 kg = 2 375 g", "18 mm = 0,018 m", "2 070 g = 2,07 kg", "0,005 kg = 5 g", "3,584 m ≈ 4 m", "3,5 m ≈ 4 m"],
      reperes: []
    },
    // A1 « 1 m² = 100 dm², 1 dm² = 100 cm² » (S003 p. 17 : l'égalité se
    // justifie par un découpage avant de servir ; S023 p. 7 : « 1 dm² =
    // 1 dm × 1 dm = 10 cm × 10 cm = 100 cm² »). Choix de Gwenaël du 21/11 :
    // on touche le carré, une rangée de plus à chaque fois.
    A1: {
      pret: true,
      aide: {outil: "carre-a1", image: "carre-a1"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 dm² =", reponse: "100", apres: "cm²"},
          consigne: "Un carré de 1 dm de côté.\nTouche-le : une rangée de plus.",
          aide: {type: "carre-a1", cote: "10 cm", petite: "cm²", grande: "dm²"},
          apres: ["10 rangées de 10 carreaux", "= 100 carreaux de 1 cm²"],
          legende: "1 dm = 10 cm : 10 carreaux sur chaque côté."},
        {etiquette: "Je vois", question: {avant: "1 m² =", reponse: "100", apres: "dm²"},
          consigne: "Un carré de 1 m de côté.\nTouche-le : une rangée de plus.",
          aide: {type: "carre-a1", cote: "10 dm", petite: "dm²", grande: "m²"},
          apres: ["10 rangées de 10 carreaux", "= 100 carreaux de 1 dm²"],
          legende: "1 m = 10 dm : 10 carreaux sur chaque côté."},
        {etiquette: "J'écris", question: {avant: "10 cm × 10 cm =", reponse: "100", apres: "cm²"},
          consigne: "J'écris les unités dans le calcul.",
          aide: {type: "phrase", lignes: ["1 dm = 10 cm", "1 dm² = 1 dm × 1 dm"]},
          apres: ["1 dm² = 10 cm × 10 cm", "= 100 cm²"]},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Dans l'autre sens", question: {avant: "100 cm² =", reponse: "1", apres: "dm²"},
          relation: ["1 dm² = 100 cm²", "donc 100 cm² = 1 dm²"],
          aide: {type: "carre-a1", cote: "10 cm", petite: "cm²", grande: "dm²"},
          apres: ["100 carreaux de 1 cm²", "= 1 dm²"]}
      ],
      retenir: "Un carré de 1 dm de côté se découpe en 10 rangées de 10 carreaux de 1 cm² : 1 dm² = 10 cm × 10 cm = 100 cm².\nDe même, 1 m² = 10 dm × 10 dm = 100 dm².",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 m² = 100 dm²", "1 dm² = 100 cm²", "1 m = 10 dm", "1 dm = 10 cm"],
      reperes: []
    },
    // A2 « Convertir des aires (vers plus petit) » (S003 p. 17 : « convertir
    // 3,7 dm² en cm² en s'appuyant sur 1 dm² = 100 cm² »). Choix de Gwenaël
    // du 21/11 : le découpage au degré 1, puis le calcul. Pas de tableau
    // (S001 : « au cours moyen, les élèves n'utilisent pas de tableaux pour
    // effectuer des conversions »).
    A2: {
      pret: true,
      aide: {outil: "decoupe-a2", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "3,7 dm² =", reponse: "370", apres: "cm²"},
          consigne: "Touche les carrés de 1 dm² :\nchacun s'ouvre en 100 cm².",
          aide: {type: "decoupe-a2", n: 3, d: 7, grande: "dm²", petite: "cm²"},
          apres: ["300 cm² + 70 cm²", "= 370 cm²"],
          legende: "0,7 dm² : 7 rangées de 10 cm²."},
        {etiquette: "Je calcule", question: {avant: "2,45 m² =", reponse: "245", apres: "dm²"},
          consigne: "Chaque m², c'est 100 dm².\nTouche le calcul.",
          aide: {type: "calcul-a2", nombre: "2,45", grande: "m²", petite: "dm²", facteur: "100"},
          apres: ["2,45 × 100 dm² = 245 dm²", "2,45 m² = 245 dm²"]},
        {etiquette: "Je vérifie", question: {avant: "0,6 dm² =", reponse: "60", apres: "cm²"},
          consigne: "Moins de 1 dm² : des rangées seulement.\nTouche le carré.",
          aide: {type: "decoupe-a2", n: 0, d: 6, grande: "dm²", petite: "cm²"},
          apres: ["6 rangées de 10 cm²", "= 60 cm²"],
          legende: "Pas 6 cm² : 1 dm² = 100 cm²."}
      ],
      retenir: "Pour convertir une aire, je m'appuie sur 1 m² = 100 dm² et 1 dm² = 100 cm².\n3,7 dm² = 3,7 × 100 cm² = 370 cm².",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["3,7 dm² = 370 cm²", "2,45 m² = 245 dm²", "0,6 dm² = 60 cm²", "1,5 m² = 150 dm²", "4 dm² = 400 cm²", "1 m² = 10 000 cm²"],
      reperes: []
    },
    // ============================================ palier 3 (lot B3-3)
    // D3 « Minutes et secondes » (S003 p. 18-19 : la trotteuse ; de 8 h 52 min
    // 27 s à 11 h 37 min 18 s ; les secondes dans 2 h 20 min ; un axe orienté,
    // sans algorithme posé en base soixante ; S433 : 2 000 h en jours). Choix
    // pris en l'absence de Gwenaël (B3-3a, réversibles) : la barre de la
    // minute (comme la barre de l'heure de D1), l'axe à arcs de Q10.
    D3: {
      pret: true,
      aide: {outil: "barre-minute", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 min =", reponse: "60", apres: "s"},
          consigne: "Touche l'horloge : la trotteuse avance de 15 s.",
          aide: {type: "trotteuse", pas: 15},
          apres: ["15 s + 15 s + 15 s + 15 s", "= 60 s"],
          legende: "Un tour de trotteuse : 1 min."},
        {etiquette: "Je représente", question: {avant: "4 min 15 s =", reponse: "255", apres: "s"},
          relation: ["1 min = 60 s", "donc 4 min = 4 × 60 s"],
          aide: {type: "barre-minute", n: 4, plus: 15, touche: true},
          apres: ["4 × 60 s + 15 s", "= 255 s"]},
        {etiquette: "Je calcule", question: {enonce: "Noa part à 9 h 58 min 40 s et arrive à 10 h 12 min 15 s.", avant: "Durée :", reponse: "13 min 35 s", apres: ""},
          consigne: "Touche l'axe : je passe par l'heure pile.",
          aide: {type: "axe-sec",
            avant: {instants: [{t: 35920}, {t: 36000, gris: true}, {t: 36735}], arcs: [{de: 0, a: 2, texte: "?"}]},
            apres: {instants: [{t: 35920}, {t: 36000}, {t: 36735}], arcs: [{de: 0, a: 1, texte: "1 min 20 s", vert: true}, {de: 1, a: 2, texte: "12 min 15 s", vert: true}]}},
          apres: ["1 min 20 s + 12 min 15 s", "= 13 min 35 s"]}
      ],
      retenir: "1 min = 60 s, pas 100 s.\n4 min 15 s = 4\u00a0×\u00a060 s + 15 s = 255 s.\nPour une durée, je passe par l'heure pile : 1 min 20 s + 12 min 15 s = 13 min 35 s.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 min = 60 s", "1 h = 3 600 s", "1 jour = 24 h", "4 min 15 s = 255 s", "200 s = 3 min 20 s"],
      reperes: []
    },
    // Q3 « Problèmes : plusieurs fois, partager » (S003 p. 11-13 ; S023 p. 5 :
    // « 35 cm : 7 cm = 5 », « 35 cm ÷ 7 = 5 cm » ; l'exerciseur :
    // « Multiplications », « Divisions »). Choix pris en l'absence de
    // Gwenaël (B3-3a, réversible) : la barre du document.
    Q3: {
      pret: true,
      aide: {outil: "barre-q3", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Lina coupe 1,2 m de ruban en morceaux de 8 cm. Combien de morceaux ?", avant: "", reponse: "15", apres: "morceaux"},
          consigne: "Touche la barre : tout en cm.",
          aide: {type: "barre-q3", tout: "1,2 m", toutApres: "1,2 m = 120 cm", parts: ["8 cm", "8 cm", "8 cm", "…", "8 cm", "8 cm"], dessous: "? morceaux", touche: true},
          apres: ["120 cm ÷ 8 cm", "= 15"],
          legende: "15 morceaux de 8 cm."},
        {etiquette: "Je représente", question: {enonce: "Noa remplit 6 verres de 25 cL de jus de goyave. Quelle quantité en tout ?", avant: "En tout :", reponse: "1,5", apres: "L"},
          consigne: "Une case par verre.",
          aide: {type: "barre-q3", tout: "? L", parts: ["25 cL", "25 cL", "25 cL", "25 cL", "25 cL", "25 cL"], dessous: "6 verres"},
          apres: ["6 × 25 cL = 150 cL", "= 1,5 L"]},
        {etiquette: "Je vérifie", question: {enonce: "Léo a 6 planches de 5 m. Une étagère : un morceau de 2 m. Combien d'étagères ?", avant: "", reponse: "12", apres: "étagères"},
          consigne: "Touche la planche : je coupe des morceaux de 2 m.",
          aide: {type: "planche-q3", tout: "Une planche : 5 m", parts: ["2 m", "2 m"], perdu: "1 m", touche: true},
          apres: ["Une planche : 2 étagères.", "6 × 2 = 12 étagères"],
          legende: "Pas 15 : il reste 1 m par planche."}
      ],
      retenir: "Je fais un schéma en barres, puis j'écris toutes les mesures dans la même unité.\nPlusieurs fois la même mesure : je multiplie. Partager, ou chercher combien de fois : je divise.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Q4 « Problèmes : une fraction d'une quantité » (S003 p. 4 : 2⁄5 de 60 kg
    // de sable, 3⁄10 de 500 g de farine ; p. 22 : le cocktail ; S001 : deux
    // tiers de 12 €, trois quarts de 100 m). Choix pris en l'absence de
    // Gwenaël (B3-3a, réversible) : la barre du document et de C6.
    Q4: {
      pret: true,
      aide: {outil: "barre-q4", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Pour la varangue, on prend 2⁄5 d'un sac de 60 kg de sable.", avant: "Masse :", reponse: "24", apres: "kg"},
          consigne: "Touche la barre : je partage 60 kg en 5.",
          aide: {type: "barre-q4", tout: "60 kg", n: 5, k: 2, valeur: "12 kg", total: "24 kg", frac: "2⁄5", touche: true},
          apres: ["60 kg ÷ 5 = 12 kg", "2 × 12 kg = 24 kg"]},
        {etiquette: "Je représente", question: {enonce: "Une recette demande 3⁄10 d'un paquet de farine de 500 g.", avant: "Masse :", reponse: "150", apres: "g"},
          consigne: "Touche la barre : je partage 500 g en 10.",
          aide: {type: "barre-q4", tout: "500 g", n: 10, k: 3, valeur: "50 g", total: "150 g", frac: "3⁄10", touche: true},
          apres: ["500 g ÷ 10 = 50 g", "3 × 50 g = 150 g"]},
        {etiquette: "Je vérifie", question: {enonce: "On verse 3⁄4 d'un bidon de 2 L de lait dans la marmite.", avant: "Volume :", reponse: "150", apres: "cL"},
          consigne: "Touche la barre : je partage 200 cL en 4.",
          aide: {type: "barre-q4", tout: "2 L = 200 cL", n: 4, k: 3, valeur: "50 cL", total: "150 cL", frac: "3⁄4", touche: true},
          apres: ["200 cL ÷ 4 = 50 cL", "3 × 50 cL = 150 cL"]}
      ],
      retenir: "Pour prendre 2⁄5 de 60 kg, je partage 60 kg en 5 parts égales :\n60 kg ÷ 5 = 12 kg.\nPuis je prends 2 parts : 2\u00a0×\u00a012 kg = 24 kg.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // ============================================ palier 4 (lot B4-1)
    // A3 « Convertir des aires (vers plus grand) » (S004 p. 11 : m² ↔ dm²,
    // dm² ↔ cm², dans les deux sens ; « la mesure en dm² est 100 fois plus
    // petite » ; « 1 cm² est le centième de 1 dm² » ; le tableau de
    // conversion est déconseillé). Choix de Gwenaël du 22/11 (B4-1a) : on
    // regroupe au degré 1, puis le calcul « (2 450 ÷ 100) dm² ».
    A3: {
      pret: true,
      aide: {outil: "regroupe-a3", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "370 cm² =", reponse: "3,7", apres: "dm²"},
          consigne: "Touche : 100 carreaux font 1 dm².\nUn carré de plus à chaque fois.",
          aide: {type: "regroupe-a3", nb: 37, petite: "cm²", grande: "dm²"},
          apres: ["3 dm² + 70 cm²", "= 3,7 dm²"],
          legende: "Une colonne : 0,1 dm²."},
        {etiquette: "Je calcule", question: {avant: "2 450 cm² =", reponse: "24,5", apres: "dm²"},
          consigne: "En dm², un nombre 100 fois plus petit.\nTouche le calcul.",
          aide: {type: "calcul-a3", gauche: "2 450 cm²", nombre: "2 450", op: "÷", facteur: "100", unite: "dm²"},
          apres: ["2 450 ÷ 100 = 24,5", "2 450 cm² = 24,5 dm²"]},
        {etiquette: "Je vérifie", question: {avant: "40 dm² =", reponse: "0,4", apres: "m²"},
          consigne: "Moins de 100 dm² : pas de carré entier.\nTouche les colonnes.",
          aide: {type: "regroupe-a3", nb: 4, petite: "dm²", grande: "m²"},
          apres: ["4 colonnes de 0,1 m²", "= 0,4 m²"],
          legende: "Pas 4 m² : 100 dm² font 1 m²."}
      ],
      retenir: "Vers une unité plus grande, je regroupe : 100 cm² font 1 dm², 100 dm² font 1 m². 1 cm² est le centième de 1 dm². Un carré de 1 km de côté a une aire de 1 km².\nEn dm², le nombre est 100 fois plus petit : 2 450 cm² = (2 450 ÷ 100) dm² = 24,5 dm².",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["370 cm² = 3,7 dm²", "2 450 cm² = 24,5 dm²", "40 dm² = 0,4 m²", "3,7 m² = 370 dm²", "1 cm² = 0,01 dm²"],
      reperes: []
    },
    // V1 « Le centimètre cube » (S004 p. 11 et 17 : 1 cm³, le volume d'un
    // cube d'arête 1 cm ; dénombrer, comparer des assemblages). Choix de
    // Gwenaël du 22/11 (B4-1a) : le pavé se démonte, une couche par toucher.
    // (Pas le dé à jouer : il fait environ 4 cm³.)
    V1: {
      pret: true,
      aide: {outil: "cubes-v1", image: "cubes-v1"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Des cubes de 1 cm³.", avant: "Volume :", reponse: "24", apres: "cm³"},
          consigne: "Touche : une couche se soulève.\nUne couche, puis les couches.",
          aide: {type: "cubes-v1", forme: "pave", nx: 4, ny: 3, nz: 2},
          apres: ["Une couche : 4 × 3 = 12 cubes", "= 2 × 12 cm³ = 24 cm³"],
          legende: "Les cubes cachés comptent aussi."},
        {etiquette: "Je compte", question: {enonce: "Un escalier de cubes de 1 cm³.", avant: "Volume :", reponse: "12", apres: "cm³"},
          consigne: "Touche : les couches se soulèvent.\nChaque couche se voit par-dessus.",
          aide: {type: "cubes-v1", forme: "escalier", nx: 3, ny: 2, nz: 3},
          apres: ["6 + 4 + 2", "= 12 cm³"]},
        {etiquette: "Je retiens", question: {avant: "Un cube de 1 cm de côté :", reponse: "1", apres: "cm³"},
          consigne: "1 cm³ : le volume d'un cube\nde 1 cm de côté.",
          aide: {type: "cubes-v1", forme: "pave", nx: 1, ny: 1, nz: 1, cote: true},
          apres: ["1 cm × 1 cm × 1 cm", "= 1 cm³"],
          legende: "Pas un dé à jouer : il est plus gros."}
      ],
      retenir: "1 cm³, c'est le volume d'un cube de 1 cm de côté.\nPour trouver un volume, je compte les cubes de 1 cm³, sans oublier les cubes cachés : une couche, puis les couches. 2 couches de 3 rangées de 4 cubes : 2 × 12 = 24 cm³.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Q5 « Problèmes : périmètres et aires » (S004 p. 4-5 : 1,5 L dans 8
    // verres, la conversion jamais annoncée ; 3,7 dm × 2,9 dm contrôlé par
    // 4 × 3 = 12 ; la carte v4 : le rectangle de 3,5 m sur 40 cm). B4-1a :
    // pas la piste homologuée (le périmètre du disque, π).
    Q5: {
      pret: true,
      aide: {outil: "rect-q5", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Léa partage 1,5 L de jus de goyave entre 8 verres.", avant: "Un verre :", reponse: "18,75", apres: "cL"},
          consigne: "Touche la barre : tout en cL.",
          aide: {type: "barre-q3", tout: "1,5 L", toutApres: "1,5 L = 150 cL", parts: ["? cL", "", "", "…", "", ""], dessous: "8 verres", touche: true},
          apres: ["150 cL ÷ 8", "= 18,75 cL"]},
        {etiquette: "Je calcule", question: {enonce: "Une plaque de liège de 3,7 dm sur 2,9 dm.", avant: "Aire :", reponse: "1 073", apres: "cm²"},
          consigne: "Touche : les côtés en cm.\nAire : longueur × largeur.",
          aide: {type: "rect-q5", longueur: "3,7 dm", largeur: "2,9 dm", apres: {longueur: "3,7 dm = 37 cm", largeur: "2,9 dm = 29 cm"}},
          apres: ["37 cm × 29 cm", "= 1 073 cm²"],
          legende: "Je contrôle : environ 4 × 3 = 12 dm²."},
        {etiquette: "Je vérifie", question: {enonce: "Noa fait 25 tours d'une piste de 400 m.", avant: "En tout :", reponse: "10", apres: "km"},
          consigne: "Une case par tour ; puis en km.",
          aide: {type: "barre-q3", tout: "? km", parts: ["400 m", "400 m", "…", "400 m"], dessous: "25 tours"},
          apres: ["25 × 400 m = 10 000 m", "= 10 km"]}
      ],
      retenir: "J'écris toutes les mesures dans la même unité avant de calculer.\nPérimètre : je fais le tour. Aire d'un rectangle : longueur × largeur.\nJe contrôle avec un ordre de grandeur : 3,7 dm × 2,9 dm, environ 4 × 3 = 12 dm².",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // ============================================ palier 4 (lot B4-2)
    // D4 « Jours, semaines, années, siècles » (S004 p. 6 et 10-11 : 609 h =
    // 3 semaines 4 jours 9 h, par la division euclidienne ; 34 990 s ;
    // « 76 mois ou 5 ans » ; l'année bissextile, le siècle, le millénaire).
    // Choix de Gwenaël du 22/11 (B4-2a) : la chaîne des paquets ; On te
    // montre, le calendrier (décidé par Claude, réversible).
    D4: {
      pret: true,
      aide: {outil: "chaine-d4", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "25 jours =", cases: ["semaines", "jours"], reponse: ["3", "4"]},
          consigne: "Touche le calendrier :\nune semaine de plus.",
          aide: {type: "calendrier-d4", jours: 25},
          apres: ["25 jours = 3 × 7 jours + 4 jours", "= 3 semaines 4 jours"]},
        {etiquette: "Je calcule", question: {avant: "609 h =", cases: ["semaines", "jours", "h"], reponse: ["3", "4", "9"]},
          consigne: "Touche la chaîne : des paquets\nde 24 h, puis de 7 jours.",
          aide: {type: "chaine-d4", unites: ["semaines", "jours", "h"], tailles: [7, 24], total: 609},
          apres: ["609 h = 25 × 24 h + 9 h", "25 jours = 3 × 7 jours + 4 jours"]},
        {etiquette: "Je compare", question: {avant: "76 mois =", cases: ["ans", "mois"], reponse: ["6", "4"]},
          consigne: "Touche la chaîne : des paquets\nde 12 mois.",
          aide: {type: "chaine-d4", unites: ["ans", "mois"], tailles: [12], total: 76},
          apres: ["76 mois = 6 × 12 mois + 4 mois", "6 ans 4 mois : plus que 5 ans."]}
      ],
      retenir: "1 jour = 24 h ; 1 semaine = 7 jours ; 1 an = 12 mois ; 1 siècle = 100 ans ; 1 millénaire = 1 000 ans.\nUne année bissextile a 366 jours.\nJe fais des paquets : 25 jours = 3 × 7 jours + 4 jours.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 jour = 24 h", "1 semaine = 7 jours", "1 an = 12 mois", "1 siècle = 100 ans", "1 millénaire = 1 000 ans", "1 millénaire = 10 siècles"],
      reperes: []
    },
    // D5 « Les heures décimales usuelles » (S004 p. 10-11 : ½ h = 0,5 h =
    // 30 min, ¼ h, ¾ h, 1⁄10 h = 6 min ; « les écritures sexagésimale et
    // décimale »). La version de 6e de D6. Choix de Gwenaël du 22/11
    // (B4-2a) : la double droite en quarts ; pour 0,1 h, la droite en
    // dixièmes de D6.
    D5: {
      pret: true,
      aide: {outil: "droite-h", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "0,25 h =", reponse: "15", apres: "min"},
          consigne: "Touche la droite :\nune heure en quatre quarts.",
          aide: {type: "droite-h", c: 25, quarts: true, sens: "h>min", haut: "h", bas: "min"},
          apres: ["0,25 h = ¼ h = 60 min ÷ 4", "= 15 min"]},
        {etiquette: "Je vois", question: {avant: "0,1 h =", reponse: "6", apres: "min"},
          consigne: "Touche la droite :\nune heure en dix dixièmes.",
          aide: {type: "droite-h", c: 10, sens: "h>min", haut: "h", bas: "min", grand: true},
          apres: ["0,1 h = 1⁄10 h = 60 min ÷ 10", "= 6 min"]},
        {etiquette: "Je vérifie", question: {avant: "1 h 45 min =", reponse: "1,75", apres: "h"},
          relation: ["1 h 45 min = 1 h + 45 min", "45 min = ¾ h = 0,75 h"],
          aide: {type: "droite-h", c: 75, quarts: true, sens: "min>h", haut: "h", bas: "min"},
          apres: ["1 h + 0,75 h", "= 1,75 h"],
          legende: "Pas 1,45 h : une heure, c'est 60 min."}
      ],
      retenir: "½ h = 0,5 h = 30 min ; ¼ h = 0,25 h = 15 min ; ¾ h = 0,75 h = 45 min ; 1⁄10 h = 0,1 h = 6 min.\n1 h 30 min = 1,5 h, pas 1,3 h : une heure, c'est 60 min, pas 100.\n2 h 15 min = 2,25 h.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["0,5 h = 30 min", "0,25 h = 15 min", "0,75 h = 45 min", "0,1 h = 6 min", "1 h 30 min = 1,5 h", "2 h 15 min = 2,25 h"],
      reperes: []
    },
    // Q6 « Problèmes : horaires et durées » (S004 p. 10 et 17 : le cinéma de
    // 17 h 40 + 110 min, la durée des cours de la semaine, les bus, le
    // tableau de covoiturage). Choix de Gwenaël du 22/11 (B4-2a) : la frise
    // des trajets pour comparer ; l'axe à arcs de Q10 pour une durée.
    Q6: {
      pret: true,
      aide: {outil: "frise-q6", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Le film commence à 17 h 40 et dure 110 min.", avant: "Fin :", reponse: "19 h 30", apres: ""},
          consigne: "110 min = 1 h 50 min.\nTouche l'axe : je passe par l'heure pile.",
          aide: {type: "arcs",
            avant: {instants: [{t: 1060}, {t: 1170, cache: true}], arcs: [{de: 0, a: 1, texte: "1 h 50 min"}], piles: true},
            apres: {instants: [{t: 1060}, {t: 1080}, {t: 1140}, {t: 1170, vert: true}], arcs: [{de: 0, a: 1, texte: "20 min", vert: true}, {de: 1, a: 2, texte: "1 h", vert: true}, {de: 2, a: 3, texte: "30 min", vert: true}]}},
          apres: ["17 h 40 + 1 h 50 min", "= 19 h 30"]},
        {etiquette: "Je compare", question: {enonce: "Covoiturage vers Saint-Pierre :", support: {type: "covoit", lignes: [["Kévin", 400, 465, 6], ["Maëva", 430, 505, 5], ["Inès", 485, 555, 6]]},
          avant: "Le plus rapide :", reponse: "Kévin", apres: ""},
          consigne: "Touche la frise : la durée\nde chaque trajet.",
          aide: {type: "frise-q6", trajets: [["Kévin", 400, 465], ["Maëva", 430, 505], ["Inès", 485, 555]]},
          apres: ["1 h 5 min < 1 h 10 min < 1 h 15 min", "= Kévin"]},
        {etiquette: "Je calcule", question: {enonce: "Noa a 5 h 30 min de cours par jour, 4 jours par semaine.", avant: "Par semaine :", reponse: "22", apres: "h"},
          relation: ["4 × 5 h = 20 h", "4 × 30 min = 120 min = 2 h"],
          aide: {type: "phrase", lignes: ["20 h + 2 h"]},
          apres: ["4 × 5 h 30 min = 20 h 120 min", "= 22 h"]}
      ],
      retenir: "Pour une durée, je passe par l'heure pile : de 6 h 40 à 7 h 45, c'est 20 min + 45 min = 1 h 5 min.\nPour comparer des trajets, je calcule la durée de chacun.\n110 min = 1 h 50 min, donc 17 h 40 + 110 min = 19 h 30.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // ============================================ palier 5 (lot B5-1)
    // A4 « Toutes les unités d'aire » (S097 p. 10 : connaître les unités
    // d'aire et de volume ; S186 : 1 m² = 10 dm × 10 dm = 100 dm² ; carte
    // v4 : l'are et l'hectare). Choix de Gwenaël du 22/11 (B5-1a) : son
    // tableau des aires quand on saute une unité ou plus, le calcul « × 100 »
    // entre deux unités voisines.
    A4: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 cm² =", reponse: "100", apres: "mm²"},
          consigne: "Le carré de 1 cm de côté, agrandi :\n10 mm sur 10 mm. Touche le carré.",
          aide: {type: "carre-a1", cote: "10 mm", petite: "mm²", rel: "1 cm = 10 mm", grande: "cm²"},
          apres: ["1 cm² = 10 mm × 10 mm", "= 100 mm²"],
          legende: "Deux unités voisines : × 100.\n4 cm² = 4 × 100 mm² = 400 mm²."},
        {etiquette: "Je glisse", question: {avant: "3,5 m² =", reponse: "35 000", apres: "cm²"},
          consigne: "On saute une unité : le tableau des aires.\nDeux cases par unité.",
          aide: {type: "glisse-unite", grandeur: "aire", nombre: "3,5", de: "m²", vers: "cm²", pale: false, aires: true,
            colonnes: ["", "dam²", "", "m²", "", "dm²", "", "cm²", "", "mm²"]},
          apres: ["1 m² = 10 000 cm²", "3,5 m² = 35 000 cm²"]},
        {etiquette: "L'hectare", question: {avant: "2,5 ha =", reponse: "25 000", apres: "m²"},
          consigne: "1 ha : un carré de 100 m de côté.\nDans le tableau, ha est sous hm².",
          aide: {type: "glisse-unite", grandeur: "aire", nombre: "2,5", de: "hm²", vers: "m²", pale: false, aires: true, sous: {"hm²": "ha", "dam²": "a"},
            colonnes: ["", "km²", "", "hm²", "", "dam²", "", "m²", "", "dm²"]},
          apres: ["1 ha = 10 000 m²", "2,5 ha = 25 000 m²"],
          legende: "Un terrain de foot : environ 0,7 ha."}
      ],
      retenir: "Deux unités d'aire voisines : × 100 ou ÷ 100 (un carré de 10 × 10).\nQuand je saute une unité : le tableau des aires, deux cases par unité.\nPour ranger des aires, je les écris dans la même unité.",
      titreRelations: "À connaître par cœur",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 cm² = 100 mm²", "1 m² = 10 000 cm²", "1 a = 100 m²", "1 ha = 10 000 m²", "1 km² = 100 ha", "4 cm² = 400 mm²"],
      reperes: []
    },
    // R10 « Mes repères de volume » (carte v4 : le petit cube 1 cm³, la
    // brique 1 dm³, la cuve 1 m³, la piscine 2 500 m³ ; la boîte à
    // chaussures, le coffre, le camion), au modèle de « Mes repères d'aire ».
    R10: {
      pret: true,
      aide: {outil: "reperes-unites", image: "reperes-unites"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Le petit cube unité a un volume de", reponse: "1", apres: "cm³"},
          consigne: "Un cube de 1 cm de côté :\nson volume est 1 centimètre cube.",
          aide: {type: "repere", repere: "v1"}, legende: "Un dé à jouer : environ 4 cm³."},
        {etiquette: "Je vois", question: {avant: "Une brique de lait a un volume de", reponse: "1", apres: "dm³"},
          consigne: "Un cube de 1 dm de côté : 1 décimètre cube.\nLa brique de 1 L a ce volume.",
          aide: {type: "repere", repere: "v2"}, legende: "Une boîte à chaussures : environ 8 dm³."},
        {etiquette: "Je vois", question: {avant: "Une cuve de 1 000 L a un volume de", reponse: "1", apres: "m³"},
          consigne: "Un cube de 1 m de côté : 1 mètre cube.\nLa cuve d'eau de pluie a ce volume.",
          aide: {type: "repere", repere: "v3"}, legende: "La benne d'un camion : environ 15 m³.\nUne piscine olympique : 2 500 m³."}
      ],
      retenir: "",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["v1", "v2", "v3", "v4"]
    },
    // V2 « 1 dm³ = 1 000 cm³ » (S096 : connaître le cube de 10 ; carte v4 :
    // la décomposition 10 plaques → 100 barres → 1 000 cubes du module des
    // volumes de Gwenaël). Choix de Gwenaël du 22/11 (B5-1a) : le cube
    // s'ouvre en trois touches.
    V2: {
      pret: true,
      aide: {outil: "dm3-v2", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 dm³ =", reponse: "1 000", apres: "cm³"},
          consigne: "Touche : le cube de 1 dm de côté s'ouvre.",
          aide: {type: "dm3-v2", grande: "dm³"},
          apres: ["10 × 10 × 10 = 10³", "= 1 000 cm³"],
          legende: "1 dm = 10 cm : 10 plaques de 100 cm³."},
        {etiquette: "Je calcule", question: {avant: "3 dm³ =", reponse: "3 000", apres: "cm³"},
          consigne: "En cm³, un nombre 1 000 fois plus grand.\nTouche le calcul.",
          aide: {type: "calcul-a3", gauche: "3 dm³", nombre: "3", op: "×", facteur: "1 000", unite: "cm³"},
          apres: ["3 × 1 000 = 3 000", "3 dm³ = 3 000 cm³"],
          legende: "Vers plus grand : ÷ 1 000.\n4 500 cm³ = 4,5 dm³."},
        {etiquette: "Le mètre cube", question: {avant: "1 m³ =", reponse: "1 000", apres: "dm³"},
          consigne: "Le cube de 1 m de côté s'ouvre pareil :\n1 m = 10 dm.",
          aide: {type: "dm3-v2", grande: "m³"},
          apres: ["10 × 10 × 10", "= 1 000 dm³"]}
      ],
      retenir: "Le cube de 1 dm de côté : 10 plaques de 10 barres de 10 cubes de 1 cm³ (10³ = 1 000).\nVers une unité plus petite : × 1 000 ; vers une plus grande : ÷ 1 000.",
      titreRelations: "À connaître par cœur",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 dm³ = 1 000 cm³", "1 m³ = 1 000 dm³", "10³ = 1 000", "3 dm³ = 3 000 cm³", "500 cm³ = 0,5 dm³"],
      reperes: []
    },
    // V3 « Volume et contenance » (S097 p. 24 : 1 L = 1 dm³ ; carte v4 :
    // « 1 L = 1 m³ ? », 3,57 L en cm³, 33 cL en cm³ ; l'eau). Choix de
    // Gwenaël du 22/11 (B5-1a) : l'outil, les trois ponts ; On te montre,
    // la brique qu'on verse dans le cube.
    V3: {
      pret: true,
      aide: {outil: "ponts-v3", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 dm³ =", reponse: "1", apres: "L"},
          consigne: "Touche la brique : je verse 1 L\ndans le cube de 1 dm de côté.",
          aide: {type: "remplir-v3"},
          apres: ["Le cube est plein :", "1 dm³ = 1 L"],
          legende: "1 mL = 1 cm³ ; 1 m³ = 1 000 L."},
        {etiquette: "Je passe par les mL", question: {avant: "33 cL =", reponse: "330", apres: "cm³"},
          consigne: "1 mL = 1 cm³ : j'écris d'abord en mL.",
          aide: {type: "ponts-v3"},
          apres: ["33 cL = 330 mL", "= 330 cm³"],
          legende: "Attention : 1 L, ce n'est pas 1 m³.\n1 m³ = 1 000 L."},
        {etiquette: "L'eau", question: {avant: "1 L d'eau pèse", reponse: "1", apres: "kg"},
          consigne: "1 L d'eau pèse 1 kg.\nDonc 1 mL d'eau : 1 g ; 1 m³ d'eau : 1 t.",
          aide: {type: "repere", repere: "m8"},
          legende: "1 m³ = 1 000 L : 1 000 kg = 1 t."}
      ],
      retenir: "1 L = 1 dm³ ; 1 mL = 1 cm³ ; 1 m³ = 1 000 L (pas 1 L = 1 m³).\nDes cL aux cm³, je passe par les mL : 33 cL = 330 mL = 330 cm³.",
      titreRelations: "À connaître par cœur",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 L = 1 dm³", "1 mL = 1 cm³", "1 m³ = 1 000 L", "1 mL d'eau : 1 g", "1 L d'eau : 1 kg", "1 m³ d'eau : 1 t"],
      reperes: []
    },
    // ============================================ palier 5 (lot B5-2)
    // V4 « Convertir volumes et contenances » (S097 p. 24 : les
    // changements d'unités de volume dans la vie courante ; carte v4 : la
    // conversion n° 2 du brevet, ranger des mesures mêlant L et dm³).
    // Décision du 23/11 en l'absence de Gwenaël (réversible) : le pont et
    // × 1 000 entre voisines, son tableau des volumes quand on saute.
    V4: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je calcule", question: {avant: "2,5 L =", reponse: "2 500", apres: "cm³"},
          consigne: "1 L = 1 dm³ = 1 000 cm³.\nTouche le calcul.",
          aide: {type: "calcul-a3", gauche: "2,5 L", nombre: "2,5", op: "×", facteur: "1 000", unite: "cm³"},
          apres: ["2,5 L = 2,5 dm³ = 2,5 × 1 000 cm³", "= 2 500 cm³"]},
        {etiquette: "Je glisse", question: {avant: "0,045 m³ =", reponse: "4 500", apres: "cL"},
          consigne: "On saute des unités : le tableau des volumes.\nTrois cases par unité, les litres dessous.",
          aide: {type: "glisse-unite", grandeur: "volume", nombre: "0,045", de: "m³", vers: "cL", pale: false, cases: 3, litres: true,
            colonnes: ["", "", "m³", "", "", "dm³", "", "", "cm³"]},
          apres: ["0,045 m³ = 45 dm³ = 45 L", "= 4 500 cL"]},
        {etiquette: "Je vérifie", question: {enonce: "Une piscine contient 57,6 m³ d'eau.", avant: "57,6 m³ =", reponse: "57 600", apres: "L"},
          consigne: "1 m³ = 1 000 L.\nTouche le calcul.",
          aide: {type: "calcul-a3", gauche: "57,6 m³", nombre: "57,6", op: "×", facteur: "1 000", unite: "L"},
          apres: ["57,6 × 1 000 = 57 600", "= 57 600 L"]}
      ],
      retenir: "1 L = 1 dm³ ; 1 mL = 1 cm³ ; 1 m³ = 1 000 L.\nPar le pont, puis × 1 000 : 2,5 L = 2,5 dm³ = 2 500 cm³.\nOn saute des unités : le tableau des volumes, trois cases par unité.\nPour ranger, tout en mL.",
      titreRelations: "À connaître par cœur",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 L = 1 dm³", "1 mL = 1 cm³", "1 m³ = 1 000 L", "1 cL = 10 cm³", "2,5 L = 2 500 cm³", "1 hL = 100 L"],
      reperes: []
    },
    // Q7 « Problèmes : longueurs et aires » (S096 ; S097 p. 26 : le
    // parallélogramme, le triangle, les figures complexes). Décidé par
    // Claude : la figure cotée, la hauteur en pointillé.
    Q7: {
      pret: true,
      aide: {outil: "fig-q7", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Un champ de cannes en parallélogramme : base 250 m, hauteur 80 m.", avant: "Aire :", reponse: "2", apres: "ha"},
          consigne: "Touche la figure : sa hauteur.\nAire : base × hauteur.",
          aide: {type: "fig-q7", forme: "para", base: "250 m", hauteur: "80 m"},
          apres: ["250 m × 80 m = 20 000 m²", "= 2 ha"],
          legende: "1 ha = 10 000 m²."},
        {etiquette: "Je convertis", question: {enonce: "La voile d'un kayak, un triangle : base 1,8 m, hauteur 150 cm.", avant: "Aire :", reponse: "1,35", apres: "m²"},
          consigne: "Touche : tout en m.\nTriangle : base × hauteur ÷ 2.",
          aide: {type: "fig-q7", forme: "tri", base: "1,8 m", hauteur: "150 cm", apres: {hauteur: "1,5 m"}},
          apres: ["1,8 m × 1,5 m ÷ 2", "= 1,35 m²"]},
        {etiquette: "Je vérifie", question: {enonce: "Un terrain carré a une aire de 1 ha.", avant: "Périmètre :", reponse: "400", apres: "m"},
          consigne: "1 ha : un carré de 100 m de côté.\nTouche le carré.",
          aide: {type: "fig-q7", forme: "carre", aire: "1 ha", base: "? m", apres: {base: "100 m"}},
          apres: ["4 × 100 m", "= 400 m"]}
      ],
      retenir: "Avant de calculer : les longueurs dans la même unité.\nParallélogramme : base × hauteur. Triangle : base × hauteur ÷ 2.\nFigure complexe : je découpe, j'ajoute les aires.\nPuis l'unité demandée : 20 000 m² = 2 ha.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Q8 « Problèmes : volumes et contenances » (S097 p. 24 ; carte v4 :
    // combien de seaux de 10 L pour 1 m³ ? l'aquarium ; le brevet). Décidé
    // par Claude : le pavé coté, l'eau qui vient au toucher.
    Q8: {
      pret: true,
      aide: {outil: "pave-q8", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Un aquarium : 60 cm sur 30 cm, et 40 cm de haut.", avant: "Contenance :", reponse: "72", apres: "L"},
          consigne: "Touche le pavé : tout en dm, car 1 L = 1 dm³.",
          aide: {type: "pave-q8", l: "60 cm", p: "30 cm", h: "40 cm", dims: [6, 3, 4], apres: {l: "6 dm", p: "3 dm", h: "4 dm"}},
          apres: ["6 dm × 3 dm × 4 dm = 72 dm³", "= 72 L"]},
        {etiquette: "Je calcule", question: {enonce: "Une cuve de 1 m³, un seau de 10 L.", avant: "Il faut", reponse: "100", apres: "seaux"},
          consigne: "Touche la barre : tout en L.",
          aide: {type: "barre-q3", tout: "1 m³", toutApres: "1 m³ = 1 000 L", parts: ["10 L", "10 L", "…", "10 L"], dessous: "? seaux", touche: true},
          apres: ["1 000 L ÷ 10 L", "= 100 seaux"]},
        {etiquette: "Je vérifie", question: {enonce: "Une piscine : 8 m sur 4 m, et 1,5 m de haut.", avant: "Contenance :", reponse: "48 000", apres: "L"},
          consigne: "En m, le volume est en m³.\nPuis 1 m³ = 1 000 L.",
          aide: {type: "pave-q8", l: "8 m", p: "4 m", h: "1,5 m", dims: [16, 8, 3]},
          apres: ["8 m × 4 m × 1,5 m = 48 m³", "= 48 000 L"]}
      ],
      retenir: "Pavé : longueur × largeur × hauteur, dans la même unité.\nEn dm : des dm³, donc des L. En m : des m³ ; 1 m³ = 1 000 L.\nCombien de seaux ? Tout en L, puis je divise.\n1 L d'eau pèse 1 kg ; 1 m³ d'eau, 1 t.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Q11 « Problèmes : plans et cartes » (S097 p. 26-27 ; carte v4 : « 1 cm
    // représente 4 km »). Décisions du 23/11 en l'absence de Gwenaël
    // (réversibles) : la double droite ; « 1/200 » avec sa phrase. Décidé par
    // Claude : La Réunion sur un quadrillage (estimer l'aire de son
    // département avec l'échelle d'une carte).
    Q11: {
      pret: true,
      aide: {outil: "droite-echelle", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Sur une carte, 1 cm représente 5 km. Saint-Denis et Saint-Pierre sont à 10 cm sur la carte.", avant: "En vrai :", reponse: "50", apres: "km"},
          consigne: "Touche la droite :\n1 cm, c'est 5 km.",
          aide: {type: "droite-echelle", pas: "5", u: "km", d: "10", vrai: "50", sens: "carte>vrai"},
          apres: ["10 × 5 km", "= 50 km"]},
        {etiquette: "Je calcule", question: {enonce: "Le plan de la case est à l'échelle 1/200 : 1 cm sur le plan représente 200 cm. La varangue mesure 3,5 cm sur le plan.", avant: "En vrai :", reponse: "7", apres: "m"},
          consigne: "200 cm = 2 m.\nTouche la droite.",
          aide: {type: "droite-echelle", pas: "2", u: "m", d: "3,5", vrai: "7", sens: "carte>vrai"},
          apres: ["3,5 × 2 m", "= 7 m"]},
        {etiquette: "J'estime", question: {enonce: "La Réunion sur une carte : un carreau représente 10 km sur 10 km, donc 100 km². Son aire ?", avant: "Environ", reponse: "2 400", apres: "km²"},
          consigne: "Touche la carte :\nje compte les carreaux.",
          aide: {type: "carte-reunion"},
          apres: ["environ 24 × 100 km²", "= 2 400 km²"]}
      ],
      retenir: "« 1 cm représente 5 km » : 10 cm sur la carte, c'est 50 km.\nEn vrai vers la carte, je divise : 20 km ÷ 5 km = 4 cm.\nÉchelle 1/200 : 1 cm représente 200 cm = 2 m.\nUne aire : les carreaux × l'aire d'un carreau.",
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
          legende: "Pas 100 fois : déci veut dire un dixième.\n1 dm est le dixième de 1 m."},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Je vois", question: {avant: "1 hL =", reponse: "100", apres: "L"},
          consigne: "Les préfixes veulent dire la même chose pour toutes les unités.",
          aide: {type: "numeration", sens: "plus", base: "L", titre: "Les contenances"},
          legende: "kilo : mille ; hecto : cent ; déca : dix."},
        {etiquette: "Je vois", question: {avant: "1 m =", reponse: "100", apres: "cm"},
          consigne: "Le mètre se partage comme l'unité.",
          aide: {type: "numeration", sens: "moins", base: "m", titre: "Les longueurs"},
          legende: "déci : un dixième ; centi : un centième ; milli : un millième."}
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
          legende: "hecto veut dire cent : 1 hg = 100 g."},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Les longueurs", question: {avant: "1 dam =", reponse: "10", apres: "m"},
          consigne: "Sur l'échelle des longueurs, deux voisines : 10 fois.",
          aide: {type: "echelle", grandeur: "longueur", marque: ["dam", "m"]},
          apres: ["1 dam = 10 m", "1 m = 0,1 dam"]},
        {etiquette: "Les masses", question: {avant: "1 g =", reponse: "10", apres: "dg"},
          consigne: "Sur l'échelle des masses, c'est pareil.",
          aide: {type: "echelle", grandeur: "masse", marque: ["g", "dg"]},
          apres: ["1 g = 10 dg", "1 dg = 0,1 g"]},
        {etiquette: "Les contenances", question: {avant: "1 cL =", reponse: "10", apres: "mL"},
          consigne: "Sur l'échelle des contenances, c'est pareil.",
          aide: {type: "echelle", grandeur: "contenance", marque: ["cL", "mL"]},
          apres: ["1 cL = 10 mL", "1 mL = 0,1 cL"]}
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
          apres: ["0,33 t = 330 kg : moins que 565 kg.", "565 kg est la plus grande."]},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Dans l'autre sens", question: {avant: "1 000 mL =", reponse: "1", apres: "L"},
          relation: ["1 L = 1 000 mL", "donc 1 000 mL = 1 L"],
          aide: {type: "echelle", grandeur: "contenance", marque: ["L", "mL"], note: "De L à mL : 3 unités plus loin, 10 × 10 × 10."},
          apres: ["1 000 mL = 1 L"]},
        {etiquette: "Les longueurs", question: {avant: "1 km =", reponse: "1 000", apres: "m"},
          consigne: "De km à m, je compte les unités.",
          aide: {type: "echelle", grandeur: "longueur", marque: ["km", "m"], note: "De km à m : 3 unités plus loin, 10 × 10 × 10."},
          apres: ["1 km = 1 000 m", "1 m = 1 000 mm"]},
        {etiquette: "Les masses", question: {avant: "1 kg =", reponse: "1 000", apres: "g"},
          consigne: "De kg à g, je compte les unités.",
          aide: {type: "echelle", grandeur: "masse", marque: ["kg", "g"], note: "De kg à g : 3 unités plus loin, 10 × 10 × 10."},
          apres: ["1 kg = 1 000 g", "1 g = 1 000 mg"]}
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
    },
    // Une mesure, plusieurs écritures (lot B2-1b ; S002 : 1 600 m = 1,6 km ;
    // 2 100 mg = 2,1 g ; 3 g + 5 cg = 305 cg = 3,05 g ; 3 cm + 4 mm = 34 mm
    // = 3,4 cm). 2,15 m en barres, le petit morceau s'ouvre en 15 cm ;
    // 34 mm au glisse-unité ; l'intrus 205 cm · 20,5 dm · 2,05 m · 250 cm.
    // L'image : la relation et le calcul posé.
    C5: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "2,15 m =", reponse: "215", apres: "cm"},
          consigne: "Touche chaque morceau : il s'ouvre en centimètres.",
          aide: {type: "barres", n: 2, reste: "0,15", grande: "m", petite: "cm", facteur: 100},
          apres: ["100 cm + 100 cm + 15 cm", "= 215 cm"],
          legende: "2,15 m = 2 m 15 cm : le petit morceau, 0,15 m, c'est 15 cm."},
        {etiquette: "Je représente", question: {avant: "34 mm =", reponse: "3,4", apres: "cm"},
          relation: ["1 cm = 10 mm", "donc 34 mm = 3 cm 4 mm"],
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "34", de: "mm", vers: "cm", pale: false},
          apres: ["Sous cm, le 3 : le chiffre des unités.", "34 mm = 3 cm 4 mm = 3,4 cm."]},
        {etiquette: "Je vérifie", question: {enonce: "Trouve l'intrus : 205 cm ; 20,5 dm ; 2,05 m ; 250 cm", avant: "205 cm =", reponse: "2,05", apres: "m"},
          consigne: "J'écris les mesures dans la même unité.",
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "205", de: "cm", vers: "m", pale: false},
          apres: ["205 cm = 20,5 dm = 2,05 m.", "250 cm = 2,5 m : c'est l'intrus."]}
      ],
      retenir: "Une mesure s'écrit de plusieurs façons :\n2,15 m = 2 m 15 cm = 215 cm.\nAttention au zéro : 2 m 5 cm = 205 cm = 2,05 m, pas 2,5 m.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      // (Six égalités courtes : une police large les gardait sur deux
      // lignes au-delà de 16 caractères, « 3 g + 5 cg = 3,05 g ».)
      relations: ["1 600 m = 1,6 km", "2 100 mg = 2,1 g", "34 mm = 3,4 cm", "305 cg = 3,05 g", "205 cm = 2,05 m", "250 cL = 2,5 L"],
      reperes: []
    },
    // Les fractions usuelles (lot B2-2a ; S002 p. 15-16 : ½ km = 500 m ;
    // ¾ m = 3 × ¼ m = 3 × 25 cm = 75 cm ; ¼ kg = 250 g ; ½ t = 500 kg).
    // Choix de Gwenaël du 18/11 : l'outil, la double droite graduée ;
    // l'image, la barre partagée ; les fractions en colonne (la barre de
    // fraction U+2044, « 3⁄4 », que la page pose en colonne). On te montre :
    // le litre qui se partage en 4, la double droite du kilomètre, puis
    // 3⁄4 m = 3 × 25 cm.
    C6: {
      pret: true,
      aide: {outil: "droite2", image: "barre2"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "3⁄4 L =", reponse: "75", apres: "cL"},
          consigne: "Touche la barre de 1 L :\nelle se partage en 4.",
          aide: {type: "barre2", haut: "L", bas: "cL", parts: 4, valeur: "100", colorees: 3},
          apres: ["25 cL + 25 cL + 25 cL", "= 75 cL"],
          legende: "1 L = 100 cL, donc 1⁄4 L = 25 cL."},
        {etiquette: "Je représente", question: {avant: "1⁄2 km =", reponse: "500", apres: "m"},
          relation: ["1 km = 1 000 m", "1⁄2 km, c'est la moitié de 1 km"],
          aide: {type: "droite2", haut: "km", bas: "m", parts: 2, valeur: "1000", cherche: 1, tout: 1},
          apres: ["La moitié de 1 000 m", "= 500 m"]},
        {etiquette: "Je vérifie", question: {avant: "3⁄4 m =", reponse: "75", apres: "cm"},
          relation: ["1⁄4 m = 100 cm ÷ 4 = 25 cm", "donc 3⁄4 m = 3 × 1⁄4 m"],
          aide: {type: "droite2", haut: "m", bas: "cm", parts: 4, valeur: "100", cherche: 3, tout: 1},
          apres: ["3 × 25 cm", "= 75 cm"]},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Dans l'autre sens", question: {avant: "250 mL =", reponse: "1⁄4", apres: "L"},
          relation: ["1 L = 1 000 mL", "250 mL, c'est 1 000 mL ÷ 4"],
          aide: {type: "droite2", haut: "L", bas: "mL", parts: 4, valeur: "1000", cherche: 1, tout: 1},
          apres: ["1 000 mL ÷ 4 = 250 mL", "donc 250 mL = 1⁄4 L"]}
      ],
      retenir: "Je partage l'unité : 1 L = 100 cL, donc 1⁄4 L = 100 cL ÷ 4 = 25 cL.\n3⁄4 L, c'est 3 quarts : 3 × 25 cL = 75 cL.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1⁄2 L = 50 cL", "1⁄4 L = 25 cL", "3⁄4 kg = 750 g", "1⁄2 km = 500 m", "1⁄10 L = 10 cL", "1⁄2 t = 500 kg"],
      reperes: []
    },
    // Ranger des mesures (lot B2-2b-1 ; S002 p. 15-16 : 33 m ; 56,8 cm ;
    // 0,2 km ; 2,7 dam ; et le dossier du 15/11 : « 300 cm est plus long
    // que 3 m car 300 > 3 », l'erreur à corriger). On te montre : 250 cm ou
    // 3 m (les mètres qui s'ouvrent en centimètres) ; quatre contenances
    // écrites en mL ; l'exemple de S002, tout en cm.
    C7: {
      pret: true,
      aide: {outil: "ranger", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Quelle mesure est la plus grande : 250 cm ou 3 m ?", avant: "3 m =", reponse: "300", apres: "cm"},
          consigne: "Touche chaque mètre : il s'ouvre en centimètres.",
          aide: {type: "barres", n: 3, grande: "m", petite: "cm", facteur: 100},
          apres: ["3 m = 300 cm", "250 cm < 300 cm"],
          legende: "250 est plus grand que 3,\nmais 250 cm < 3 m."},
        {etiquette: "Je représente", question: {enonce: "Range : 1 L ; 75 cL ; 0,9 L ; 800 mL", avant: "75 cL =", reponse: "750", apres: "mL"},
          consigne: "J'écris toutes les mesures en mL.",
          aide: {type: "glisse-unite", grandeur: "contenance", nombre: "75", de: "cL", vers: "mL", pale: false},
          apres: ["0,9 L = 900 mL", "1 L = 1 000 mL"],
          legende: "75 cL < 800 mL < 0,9 L < 1 L"},
        {etiquette: "Je vérifie", question: {enonce: "Range : 33 m ; 56,8 cm ; 0,2 km ; 2,7 dam", avant: "0,2 km =", reponse: "20 000", apres: "cm"},
          consigne: "J'écris toutes les mesures en cm.",
          aide: {type: "glisse-unite", grandeur: "longueur", nombre: "0,2", de: "km", vers: "cm", pale: false},
          apres: ["33 m = 3 300 cm", "2,7 dam = 2 700 cm"],
          legende: "56,8 cm < 2,7 dam < 33 m < 0,2 km"}
      ],
      retenir: "Pour ranger des mesures, je les écris toutes dans la même unité, puis je compare les nombres.\n3 m = 300 cm, donc 250 cm < 3 m.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["250 cm < 3 m", "0,33 t < 565 kg", "75 cL < 1 L", "2,7 dam < 33 m", "950 g < 1,2 kg", "800 mL < 0,9 L"],
      reperes: []
    },
    // Calculer avec deux unités (lot B2-2b-2 ; S002 p. 16-17 : 8,2 kg +
    // 840 g = 9,04 kg, « le résultat avec une seule unité », 1 L − 25 cL ;
    // carte v4 : « 25 cL + 330 mL = 250 mL + 330 mL = 580 mL »). On te
    // montre : le verre doseur de 1 L qui se gradue en cL (on en verse
    // 25 cL) ; 8,2 kg + 840 g, tout en kg ; 25 cL + 330 mL, tout en mL.
    C8: {
      pret: true,
      aide: {outil: "glisse-unite", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Une bouteille contient 1 L. On en verse 25 cL dans un verre. Combien en reste-t-il ?", avant: "1 L − 25 cL =", reponse: "75", apres: "cL"},
          consigne: "Touche le verre : il se gradue en cL.",
          aide: {type: "verre", grande: "L", petite: "cL", facteur: 100},
          apres: ["100 cL − 25 cL", "= 75 cL"]},
        {etiquette: "Je représente", question: {avant: "8,2 kg + 840 g =", reponse: "9,04", apres: "kg"},
          consigne: "J'écris 840 g en kg.",
          aide: {type: "glisse-unite", grandeur: "masse", nombre: "840", de: "g", vers: "kg", pale: false, colonnes: ["kg", "hg", "dag", "g", "dg", "cg", "mg"]},
          apres: ["8,2 kg + 0,84 kg", "= 9,04 kg"]},
        {etiquette: "Je vérifie", question: {avant: "25 cL + 330 mL =", reponse: "580", apres: "mL"},
          consigne: "J'écris 25 cL en mL.",
          aide: {type: "glisse-unite", grandeur: "contenance", nombre: "25", de: "cL", vers: "mL", pale: false},
          apres: ["250 mL + 330 mL", "= 580 mL"]}
      ],
      retenir: "Pour ajouter ou enlever deux mesures, je les écris d'abord dans la même unité.\nLe résultat s'écrit avec une seule unité.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      // (Quatre calculs, une seule colonne : sur deux colonnes, « 8,2 kg +
      // 840 g = 9,04 kg » se coupait au téléphone.)
      relations: ["1 L − 25 cL = 75 cL", "8,2 kg + 840 g = 9,04 kg", "25 cL + 330 mL = 580 mL", "2 m − 45 cm = 155 cm"],
      relationsUneColonne: true,
      reperes: []
    },
    // Lot B2-3a : l'aire en carreaux (S002 p. 16 ; choix de Gwenaël du
    // 20/11 sur la maquette : les demis se recollent, on compare en
    // superposant, la réponse en carreaux puis en cm²). On te montre :
    // compter en touchant, recoller deux demis, poser B sur A.
    A5: {
      pret: true,
      aide: {outil: "aire", image: "aire"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "Aire :", reponse: "8", apres: "carreaux"},
          consigne: "Touche chaque carreau.",
          aide: {type: "aire-compter", fig: ["###.", "####", "#..."]},
          apres: ["Chaque carreau compté une fois", "= 8 carreaux"]},
        {etiquette: "Je représente", question: {avant: "Aire :", reponse: "7", apres: "cm²"},
          consigne: "Touche un demi : il complète l'autre.",
          aide: {type: "aire-compter", fig: ["c##d", "####"]},
          apres: ["6 carreaux + 2 demis", "= 7 carreaux = 7 cm²"],
          legende: "1 cm², c'est un carré de 1 cm de côté."},
        {etiquette: "Je compare", question: {enonce: "Même aire pour A et B ?", vraisemblable: true, reponse: "Oui"},
          consigne: "Touche B pour la poser sur A.",
          aide: {type: "aire-superposer", a: ["###", "###"], b: ["######"]},
          apres: ["A et B dépassent de 3 carreaux.", "= Même aire : 6 carreaux chacune"]}
      ],
      retenir: "L'aire, c'est la place que prend une figure. Je compte les carreaux : 1 carreau = 1 cm².\nDeux demis font un carreau. Deux figures de formes différentes peuvent avoir la même aire.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Lot B2-3b-1 : les problèmes du CM1 (S002 p. 11-13 ; carte v4 : la
    // tare, le périmètre, « Est-ce vraisemblable ? », le schéma en barres).
    // On te montre : le pot de confiture (la tare), Alix et Bruno (deux
    // barres collées, choix de Gwenaël du 20/11), Izmir (des objets pareils).
    Q2: {
      pret: true,
      aide: {outil: "schema", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Un pot de confiture plein pèse 1,2 kg. Le pot vide pèse 350 g. Quelle masse de confiture ?", avant: "Confiture :", reponse: "850", apres: "g"},
          consigne: "Je fais un schéma en barres.",
          aide: {type: "schema", tout: "Pot plein : 1,2 kg = 1 200 g", parts: ["350 g", "? g"], proportions: [2, 5]},
          apres: ["1 200 g − 350 g", "= 850 g de confiture"]},
        {etiquette: "Je représente", question: {enonce: "Alix mesure 1,61 m. C'est 13 cm de plus que Bruno. Combien mesure Bruno ?", avant: "Bruno :", reponse: "148", apres: "cm"},
          consigne: "Une barre pour chacun.",
          aide: {type: "deux-barres", haut: ["Alix", "1,61 m = 161 cm"], bas: ["Bruno", "? cm"], ecart: "13 cm"},
          apres: ["161 cm − 13 cm", "= 148 cm"]},
        {etiquette: "Je vérifie", question: {enonce: "Izmir achète 3 pains de 210 g et 2 bouteilles d'eau de 1,6 kg. Izmir trouve 3,83 kg en tout.", vraisemblable: true, reponse: "Oui"},
          consigne: "Est-ce vraisemblable ?",
          aide: {type: "schema", tout: "? kg", parts: ["3 × 210 g", "2 × 1,6 kg"], proportions: [1, 1]},
          apres: ["630 g + 3,2 kg = 0,63 kg + 3,2 kg", "= 3,83 kg"]}
      ],
      retenir: "Je fais un schéma en barres, puis j'écris toutes les mesures dans la même unité.\nPour trouver le tout, j'ajoute. Pour trouver une partie ou un écart, j'enlève.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Lot B2-3b-2 : les problèmes de durées (S002 p. 17-18 : « aucun
    // algorithme posé en base soixante », l'axe orienté, des instants
    // intermédiaires). On te montre les trois exemples officiels : Ismaël
    // (de 7 h 47 à 8 h 16), Lucie (1 h 17 min, arrivée à 12 h 10), le train
    // (7 h 43, 1 h 34 min, puis 52 min). Choix de Gwenaël du 21/11 : l'axe à
    // arcs, puis les bonds par l'heure pile en vert. (Des énoncés courts : avec
    // une police large, ceux de Lucie et du train étaient coupés à 360 × 640.)
    Q10: {
      pret: true,
      aide: {outil: "axe-arcs", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Ismaël part de chez lui à 7 h 47 et arrive au travail à 8 h 16. Combien de temps dure le trajet ?", avant: "Durée :", reponse: "29", apres: "min"},
          consigne: "Touche l'axe du temps : je passe par l'heure pile.",
          aide: {type: "arcs",
            avant: {instants: [{t: 467}, {t: 496}], arcs: [{de: 0, a: 1, texte: "?"}], piles: true},
            apres: {instants: [{t: 467}, {t: 480}, {t: 496}], arcs: [{de: 0, a: 1, texte: "13 min", vert: true}, {de: 1, a: 2, texte: "16 min", vert: true}]}},
          apres: ["13 min + 16 min", "= 29 min"]},
        {etiquette: "Je représente", question: {enonce: "Lucie roule 1 h 17 min et passe la ligne d'arrivée à 12 h 10. À quelle heure part Lucie ?", avant: "Départ :", reponse: "10 h 53", apres: ""},
          consigne: "Je recule jusqu'à l'heure pile, puis le reste.",
          aide: {type: "arcs",
            avant: {instants: [{t: 653, cache: true}, {t: 730}], arcs: [{de: 0, a: 1, texte: "1 h 17 min"}], piles: true},
            apres: {instants: [{t: 653, vert: true}, {t: 660}, {t: 720}, {t: 730}], arcs: [{de: 0, a: 1, texte: "7 min", vert: true}, {de: 1, a: 2, texte: "1 h", vert: true}, {de: 2, a: 3, texte: "10 min", vert: true}]}},
          apres: ["12 h 10 − 10 min − 1 h − 7 min", "= 10 h 53"]},
        {etiquette: "Je représente", question: {enonce: "Le train part à 7 h 43 : 1 h 34 min jusqu'à la 1re gare, puis 52 min jusqu'à la 2e gare.", avant: "Arrivée :", reponse: "10 h 09", apres: ""},
          consigne: "Deux étapes : je trouve d'abord l'heure du milieu.",
          aide: {type: "arcs",
            avant: {instants: [{t: 463}, {t: 557, vide: true, sous: "1re gare"}, {t: 609, cache: true, sous: "2e gare"}], arcs: [{de: 0, a: 1, texte: "1 h 34 min"}, {de: 1, a: 2, texte: "52 min"}]},
            apres: {instants: [{t: 463}, {t: 557, vert: true, sous: "1re gare"}, {t: 609, vert: true, sous: "2e gare"}], arcs: [{de: 0, a: 1, texte: "1 h 34 min"}, {de: 1, a: 2, texte: "52 min"}]}},
          apres: ["7 h 43 + 1 h 34 min = 9 h 17", "9 h 17 + 52 min = 10 h 09"]}
      ],
      retenir: "Je dessine l'axe du temps et je passe par l'heure pile : de 7 h 47 à 8 h 16, c'est 13 min + 16 min = 29 min.\nAvec deux étapes, je trouve d'abord l'heure du milieu.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    // Lot B6-1 : les heures décimales (4e ; attendus : 0,2 h = 12 min,
    // 36 min = 0,6 h ; brevet : 2,6 h = 2 h 36 min, et 3 h 20 min n'est pas
    // 3,2 h). Choix de Gwenaël du 21/11 : la double droite des heures (0 à
    // 1 h en dixièmes), la correction en vert.
    D6: {
      pret: true,
      aide: {outil: "droite-h", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "0,2 h =", reponse: "12", apres: "min"},
          consigne: "Touche la droite :\n0,1 h = 6 min.",
          aide: {type: "droite-h", c: 20, sens: "h>min", haut: "h", bas: "min"},
          apres: ["0,2 h = 2 × 6 min", "= 12 min"]},
        {etiquette: "Je représente", question: {avant: "2,6 h =", reponse: "2 h 36", apres: "min"},
          relation: ["2,6 h = 2 h + 0,6 h", "0,6 h, c'est 6 fois 0,1 h"],
          aide: {type: "droite-h", c: 60, sens: "h>min", haut: "h", bas: "min"},
          apres: ["2 h + 36 min", "= 2 h 36 min"]},
        {etiquette: "Je vérifie", question: {avant: "36 min =", reponse: "0,6", apres: "h"},
          relation: ["36 min, c'est 6 fois 6 min", "et 6 min = 0,1 h"],
          aide: {type: "droite-h", c: 60, sens: "min>h", haut: "h", bas: "min"},
          apres: ["6 × 0,1 h", "= 0,6 h"]}
      ],
      retenir: "1 h = 60 min, donc 0,1 h = 6 min.\nDes heures aux minutes, je multiplie par 60 : 0,35 h = 0,35 × 60 min = 21 min.\nDes minutes aux heures, je divise par 60 : 36 min = (36 ÷ 60) h = 0,6 h.\nAttention : 3,2 h = 3 h 12 min, pas 3 h 20 min.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["0,1 h = 6 min", "0,25 h = 15 min", "0,5 h = 30 min", "0,75 h = 45 min", "1,5 h = 1 h 30 min", "20 min = 1⁄3 h"],
      reperes: []
    },
    // Lot B6-1 : km/h et m/s (4e ; brevet : 90 km/h = 25 m/s, 10 m/s =
    // 36 km/h ; Japon : par heure, par minute, par seconde, avant ÷ 3,6).
    // Choix de Gwenaël du 21/11 : les trois étapes reliées par ÷ 60 ; sans
    // calculatrice.
    G1: {
      pret: true,
      aide: {outil: "etapes-v", image: "calcul"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "36 km/h =", reponse: "10", apres: "m/s"},
          consigne: "Touche les cases : en 1 min,\npuis en 1 s.",
          aide: {type: "etapes-v", s2: 20, depuis: 0, vers: 2},
          apres: ["36 000 m ÷ 60 ÷ 60", "= 10 m en 1 s"]},
        {etiquette: "Je représente", question: {avant: "10 m/s =", reponse: "36", apres: "km/h"},
          relation: ["10 m en 1 s", "En 1 h : 60 × 60 fois plus"],
          aide: {type: "etapes-v", s2: 20, depuis: 2, vers: 0, km: true},
          apres: ["36 000 m en 1 h", "= 36 km en 1 h"]},
        {etiquette: "Je vérifie", question: {avant: "90 km/h =", reponse: "25", apres: "m/s"},
          relation: ["Plus vite : 1 m/s = 3,6 km/h", "De km/h à m/s : ÷ 3,6"],
          aide: {type: "etapes-v", s2: 50, depuis: 0, vers: 2},
          apres: ["90 ÷ 3,6", "= 25 m/s"]},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "En 1 min", question: {avant: "72 km/h =", reponse: "1 200", apres: "m/min"},
          relation: ["72 km/h : 72 000 m en 1 h", "En 1 min : 60 fois moins"],
          aide: {type: "etapes-v", s2: 40, depuis: 0, vers: 1},
          apres: ["72 000 m ÷ 60", "= 1 200 m en 1 min"]}
      ],
      retenir: "72 km/h : 72 000 m en 1 h, 1 200 m en 1 min, 20 m en 1 s.\nDonc 72 km/h = 20 m/s.\nPlus vite : de km/h à m/s, je divise par 3,6 ; de m/s à km/h, je multiplie par 3,6.",
      titreRelations: "Des exemples à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 m/s = 3,6 km/h", "5 m/s = 18 km/h", "10 m/s = 36 km/h", "20 m/s = 72 km/h", "25 m/s = 90 km/h", "1 h = 3 600 s"],
      reperes: []
    },
    // Lot B6-2 : les préfixes de nano à giga (4e ; S097 p. 9 : « on fait le
    // lien avec les conversions » ; brevet : 1,5 Go libres, des morceaux de
    // 4 Mo). Les préfixes comme les nombres (le millier, le million, le
    // milliard ; le millième, le millionième, le milliardième), puis le
    // glisse-unité. Choix de Gwenaël du 21/11 : le glisse-unité, juste les
    // colonnes utiles.
    P5: {
      pret: true,
      aide: {outil: "glisse-unite", image: "echelle"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 Go =", reponse: "1 000", apres: "Mo"},
          consigne: "Touche les lignes : 1 000 fois plus.",
          aide: {type: "numeration", titre: "Les octets", lignes: [
            ["kilo", "1 millier", "= 1 000", "1 ko", "= 1 000 o"],
            ["méga", "1 million", "= 1 000 000", "1 Mo", "= 1 000 000 o"],
            ["giga", "1 milliard", "= 1 000 000 000", "1 Go", "= 1 000 000 000 o"]]},
          apres: ["D'une ligne à l'autre : × 1 000.", "1 Go = 1 000 Mo"]},
        {etiquette: "Je vois", question: {avant: "1 µm =", reponse: "1 000", apres: "nm"},
          consigne: "Touche les lignes : 1 000 fois moins.",
          aide: {type: "numeration", titre: "Les longueurs", lignes: [
            ["milli", "1 millième", "= 0,001", "1 mm", "= 0,001 m"],
            ["micro", "1 millionième", "= 0,000 001", "1 µm", "= 0,000 001 m"],
            ["nano", "1 milliardième", "= 0,000 000 001", "1 nm", "= 0,000 000 001 m"]]},
          apres: ["D'une ligne à l'autre : ÷ 1 000.", "1 µm = 1 000 nm"]},
        {etiquette: "Je vérifie", question: {enonce: "Il reste 1,5 Go libres sur un téléphone. Une chanson fait 4 Mo.", avant: "1,5 Go =", reponse: "1 500", apres: "Mo"},
          consigne: "J'écris tout en Mo.",
          aide: {type: "glisse-unite", grandeur: "octet", nombre: "1,5", de: "Go", vers: "Mo", pale: false, colonnes: ["Go", "", "", "Mo"]},
          apres: ["1 500 Mo ÷ 4 Mo = 375", "= 375 chansons au plus"]},
        // Lot « cohérence » (25/11) : ce que « Je valide » demande et que la leçon ne montrait pas.
        {etiquette: "Dans l'autre sens", question: {avant: "1 000 Mo =", reponse: "1", apres: "Go"},
          relation: ["1 Go = 1 000 Mo", "donc 1 000 Mo = 1 Go"],
          aide: {type: "glisse-unite", grandeur: "octet", nombre: "1000", de: "Mo", vers: "Go", pale: false, colonnes: ["Go", "", "", "Mo"]},
          apres: ["Vers l'unité plus grande,", "le nombre est 1 000 fois plus petit."]}
      ],
      retenir: "giga : un milliard ; méga : un million ; kilo : mille.\nmilli : un millième ; micro : un millionième ; nano : un milliardième.\nD'une unité à la suivante, c'est 1 000 fois : 1 Go = 1 000 Mo ; 1 µm = 1 000 nm.",
      titreRelations: "Les relations à connaître",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 Go = 1 000 Mo", "1 mm = 1 000 µm", "1 Mo = 1 000 ko", "1 µm = 1 000 nm", "1 ko = 1 000 o", "1 MW = 1 000 kW"],
      reperes: []
    },
    // Lot B6-2 : les préfixes en puissances de 10 (3e ; attendus de 4e :
    // 3 µL = 3 × 10⁻⁶ L ; S097 p. 17 et 20). Choix de Gwenaël du 21/11 : la
    // bande des 7 préfixes par 1 000 et leur puissance ; l'exposant dans une
    // case levée au-dessus du 10, le pavé avec « − ».
    P6: {
      pret: true,
      aide: {outil: "bande-p", image: "bande-p"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 km =", exposant: true, reponse: "3", apres: "m"},
          consigne: "Touche kilo, méga, giga.",
          aide: {type: "bande-p", base: "m", montre: ["k", "M", "G"]},
          apres: ["1 000 = 10³ ; 1 000 000 = 10⁶", "1 km = 10³ m"]},
        {etiquette: "Je vois", question: {avant: "1 nm =", exposant: true, reponse: "−9", apres: "m"},
          consigne: "Touche milli, micro, nano.",
          aide: {type: "bande-p", base: "m", montre: ["m", "µ", "n"]},
          apres: ["0,001 = 10⁻³ ; 0,000 001 = 10⁻⁶", "1 nm = 10⁻⁹ m"]},
        {etiquette: "Je vérifie", question: {avant: "3 µL = 3 ×", exposant: true, reponse: "−6", apres: "L"},
          consigne: "Touche micro.",
          aide: {type: "bande-p", base: "L", montre: ["µ"]},
          apres: ["1 µL = 10⁻⁶ L", "donc 3 µL = 3 × 10⁻⁶ L"]}
      ],
      retenir: "giga : 10⁹ ; méga : 10⁶ ; kilo : 10³.\nmilli : 10⁻³ ; micro : 10⁻⁶ ; nano : 10⁻⁹.\n1 km = 10³ m ; 1 nm = 10⁻⁹ m ; 3 µL = 3 × 10⁻⁶ L.\n1 200 m = 1,2 × 10³ m.",
      titreRelations: "Les six préfixes",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["giga : 10⁹", "milli : 10⁻³", "méga : 10⁶", "micro : 10⁻⁶", "kilo : 10³", "nano : 10⁻⁹"],
      reperes: []
    },
    // Lot B6-3 : les problèmes de vitesses, débits et masses volumiques (4e,
    // 3e ; S097 p. 40-43 : le changement d'unité est une situation de
    // proportionnalité ; brevet : le bassin, la bougie, le béton, l'écran
    // de 50 pouces). Choix de Gwenaël du 21/11 : le tableau de
    // proportionnalité, l'arc « × 60 » au-dessus et au-dessous ; sans
    // calculatrice. On te montre : le tuyau d'arrosage, le bus de Clotilde
    // (S097), le bassin.
    Q9: {
      pret: true,
      aide: {outil: "tableau-p", image: "tableau-p"},
      apprends: [
        {etiquette: "Je vois", question: {enonce: "Un tuyau d'arrosage donne 15 L par minute. Combien de litres en 1 h ?", avant: "", reponse: "900", apres: "L"},
          consigne: "Touche le tableau :\n1 h = 60 min.",
          aide: {type: "tableau-p", noms: ["Durée", "Volume"], lignes: [["1 min", "60 min"], ["15 L", null]], fleches: ["× 60"], rep: "900 L"},
          apres: ["15 L × 60", "= 900 L"]},
        {etiquette: "Je représente", question: {enonce: "Le bus de Clotilde roule à 9 km/h. Combien de kilomètres en 20 min ?", avant: "", reponse: "3", apres: "km"},
          relation: ["9 km/h : 9 km en 60 min"],
          aide: {type: "tableau-p", noms: ["Durée", "Distance"], lignes: [["60 min", "20 min"], ["9 km", null]], fleches: ["÷ 3"], rep: "3 km"},
          apres: ["9 km ÷ 3", "= 3 km"]},
        {etiquette: "Je vérifie", question: {enonce: "Il manque 3 m³ d'eau au bassin. Le tuyau donne 50 L par minute.", avant: "Durée :", reponse: "60", apres: "min"},
          relation: ["1 m³ = 1 000 L"],
          aide: {type: "tableau-p", noms: ["Volume", "Durée"], lignes: [["50 L", "3 000 L"], ["1 min", null]], fleches: ["× 60"], rep: "60 min"},
          apres: ["1 min × 60", "= 60 min"]}
      ],
      retenir: "Je range les deux grandeurs dans un tableau, dans les mêmes unités (1 h = 60 min).\nD'une colonne à l'autre, je multiplie ou je divise : 15 L × 60 = 900 L.",
      titreRelations: "Les relations utiles",
      cahier: "Je recopie cela dans mon cahier.",
      relations: ["1 h = 60 min", "1 min = 60 s", "1 h = 3 600 s", "1 m³ = 1 000 L", "1 t = 1 000 kg", "1 kg = 1 000 g"],
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
  const NOMS_LUS_T = typographier(NOMS_LUS);
  const lu = (nombre, unite) => { const t = lireMesure(nombre, unite); return t === null ? null : typo(t); };
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
    NOMS_LUS: NOMS_LUS_T,
    lu,
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
