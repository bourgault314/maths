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
  const UNITES_TEXTE = "km|hm|dam|dm|cm|mm|m|kg|hg|dag|dg|cg|mg|g|t|hL|daL|dL|cL|mL|L|min|h|s|km²|m²|dm²|cm²|mm²|m³|dm³|cm³|ko|Mo|Go|o|km/h|m/s|ans|jours?|semaines?|étapes?|repères?|questions?|justes|erreurs?|fois|sur|mètres?|grammes?|litres?|centimètres?|€|bouteilles";
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
  // Couleurs : celles des médailles des planches (univers maths&go).
  const PALIERS = [
    {n: 1, nom: "Les bases", classes: "CE1 · CE2", couleur: "#087a71"},
    {n: 2, nom: "Le CM1", classes: "CM1", couleur: "#0755b8"},
    {n: 3, nom: "Le CM2", classes: "CM2", couleur: "#147447"},
    {n: 4, nom: "La 6e", classes: "6e", couleur: "#5b2a86"},
    {n: 5, nom: "La 5e", classes: "5e", couleur: "#a93030"},
    {n: 6, nom: "La 4e et la 3e", classes: "4e · 3e", couleur: "#143451"}
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
    {code: "R4", rang: 9, palier: 2, famille: "reperes", classe: "CM1", nom: "Mes repères de masse", exemple: "pack d'eau : 9 kg"},
    {code: "R5", rang: 10, palier: 2, famille: "reperes", classe: "CM1", nom: "Mes repères de contenance", exemple: "canette : 33 cL"},
    {code: "R6", rang: 11, palier: 2, famille: "reperes", classe: "CM1", nom: "Est-ce vraisemblable ?", exemple: ""},
    {code: "P2", rang: 12, palier: 2, famille: "relations", classe: "CM1", nom: "Ce que veulent dire les préfixes", exemple: "kilo = 1 000"},
    {code: "P3", rang: 13, palier: 2, famille: "relations", classe: "CM1", nom: "Deux unités voisines", exemple: "1 cm = 0,1 dm"},
    {code: "P4", rang: 14, palier: 2, famille: "relations", classe: "CM1", nom: "Toutes les relations à connaître", exemple: "1 L = 1 000 mL"},
    {code: "C3", rang: 15, palier: 2, famille: "convertir", classe: "CM1", nom: "Avec des nombres décimaux", exemple: "3,5 m = 350 cm"},
    {code: "C4", rang: 16, palier: 2, famille: "convertir", classe: "CM1", nom: "En mètre, en gramme, en litre", exemple: "41 dg = 4,1 g"},
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
    {code: "A4", rang: 37, palier: 5, famille: "aires", classe: "5e", nom: "mm² et km²", exemple: "1 cm² = 100 mm²"},
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
    {code: "Q9", rang: 48, palier: 6, famille: "problemes", classe: "4e", nom: "Problèmes : vitesses", nomCourt: "Vitesses", exemple: ""}
  ];

  // ------------------------------------------------------------ les repères
  // Les 28 repères (carte v1, § 3, sources comprises ; la ligne « 1 g »
  // devient la feuille ET la pièce). Codes figés. `etape` : l'étape dont la
  // validation le met au carnet. Pour les questions : `debut` + nombre +
  // unité + `fin` forment la phrase (« Une voiture mesure environ 4 m de
  // long. »). `local` : repère réunionnais.
  const REPERES = [
    {code: "l1", grandeur: "longueur", etape: "R3", emoji: "📏", objet: "La plus petite graduation de la règle", valeur: "1 mm", debut: "La plus petite graduation de la règle mesure", nombre: "1", unite: "mm", fin: ""},
    {code: "l2", grandeur: "longueur", etape: "R3", emoji: "🪙", objet: "Une pièce de 1 centime", valeur: "un peu plus de 1,5 cm de large", debut: "Une pièce de 1 centime mesure un peu plus de", nombre: "1,5", unite: "cm", fin: "de large"},
    {code: "l3", grandeur: "longueur", etape: "R1", emoji: "📄", objet: "Une feuille A4", valeur: "21 cm sur 29,7 cm", debut: "Une feuille A4 mesure", nombre: "21", unite: "cm", fin: "de large"},
    {code: "l4", grandeur: "longueur", etape: "R1", emoji: "🚗", objet: "Une voiture", valeur: "environ 4 m de long", debut: "Une voiture mesure environ", nombre: "4", unite: "m", fin: "de long"},
    {code: "l5", grandeur: "longueur", etape: "R3", emoji: "🏃", objet: "Un tour de piste d'athlétisme", valeur: "400 m", debut: "Un tour de piste d'athlétisme mesure", nombre: "400", unite: "m", fin: ""},
    {code: "l6", grandeur: "longueur", etape: "R3", emoji: "🌉", objet: "Le viaduc de la Nouvelle route du Littoral", valeur: "5,4 km", debut: "Le viaduc de la Nouvelle route du Littoral mesure", nombre: "5,4", unite: "km", fin: "", local: true},
    {code: "l7", grandeur: "longueur", etape: "R1", emoji: "🛣️", objet: "De Saint-Pierre à Saint-Denis", valeur: "environ 80 km en voiture", debut: "De Saint-Pierre à Saint-Denis, en voiture, il y a environ", nombre: "80", unite: "km", fin: "", local: true},
    {code: "l8", grandeur: "longueur", etape: "R3", emoji: "🌋", objet: "Le Piton des Neiges", valeur: "environ 3 km d'altitude", debut: "Le Piton des Neiges s'élève à environ", nombre: "3", unite: "km", fin: "d'altitude", local: true},
    {code: "l9", grandeur: "longueur", etape: "R3", emoji: "⛰️", objet: "La Diagonale des Fous", valeur: "environ 170 km", debut: "La Diagonale des Fous mesure environ", nombre: "170", unite: "km", fin: "", local: true},
    {code: "m1", grandeur: "masse", etape: "R4", emoji: "🍚", objet: "Un grain de riz", valeur: "environ 25 mg", debut: "Un grain de riz pèse environ", nombre: "25", unite: "mg", fin: ""},
    {code: "m2", grandeur: "masse", etape: "R4", emoji: "📄", objet: "Une feuille A4", valeur: "environ 5 g", debut: "Une feuille A4 pèse environ", nombre: "5", unite: "g", fin: ""},
    {code: "m3", grandeur: "masse", etape: "R1", emoji: "🪙", objet: "Une pièce de 1 €", valeur: "7,5 g", debut: "Une pièce de 1 € pèse", nombre: "7,5", unite: "g", fin: ""},
    {code: "m4", grandeur: "masse", etape: "R1", emoji: "🍙", objet: "Un paquet de riz", valeur: "1 kg", debut: "Un paquet de riz pèse", nombre: "1", unite: "kg", fin: ""},
    {code: "m5", grandeur: "masse", etape: "R1", emoji: "💧", objet: "Un pack de 6 bouteilles d'eau", valeur: "environ 9 kg", debut: "Un pack de 6 bouteilles d'eau pèse environ", nombre: "9", unite: "kg", fin: ""},
    {code: "m6", grandeur: "masse", etape: "R1", emoji: "🚗", objet: "Une voiture", valeur: "environ 1 t", debut: "Une voiture pèse environ", nombre: "1", unite: "t", fin: ""},
    {code: "c1", grandeur: "contenance", etape: "R5", emoji: "🥄", objet: "Une cuillère à café", valeur: "5 mL", debut: "Une cuillère à café contient", nombre: "5", unite: "mL", fin: ""},
    {code: "c2", grandeur: "contenance", etape: "R1", emoji: "🥤", objet: "Une canette", valeur: "33 cL, un tiers de litre", debut: "Une canette contient", nombre: "33", unite: "cL", fin: ""},
    {code: "c3", grandeur: "contenance", etape: "R1", emoji: "🥛", objet: "Une brique de lait", valeur: "1 L", debut: "Une brique de lait contient", nombre: "1", unite: "L", fin: ""},
    {code: "c4", grandeur: "contenance", etape: "R5", emoji: "☀️", objet: "Un chauffe-eau solaire", valeur: "environ 200 L", debut: "Un chauffe-eau solaire contient environ", nombre: "200", unite: "L", fin: "", local: true},
    {code: "a1", grandeur: "aire", etape: "R8", emoji: "🔲", objet: "Un carreau de 1 cm de côté", valeur: "1 cm²", debut: "Un carreau de 1 cm de côté a une aire de", nombre: "1", unite: "cm²", fin: ""},
    {code: "a2", grandeur: "aire", etape: "R8", emoji: "📄", objet: "Une feuille A4", valeur: "environ 6 dm²", debut: "Une feuille A4 a une aire d'environ", nombre: "6", unite: "dm²", fin: ""},
    {code: "a3", grandeur: "aire", etape: "R8", emoji: "🖼️", objet: "Une affiche A0", valeur: "1 m², soit 16 feuilles A4", debut: "Une affiche A0 a une aire de", nombre: "1", unite: "m²", fin: ""},
    {code: "a4", grandeur: "aire", etape: "R8", emoji: "⚽", objet: "Un terrain de football", valeur: "environ 7 000 m²", debut: "Un terrain de football a une aire d'environ", nombre: "7000", unite: "m²", fin: ""},
    {code: "a5", grandeur: "aire", etape: "A4", emoji: "🏝️", objet: "La Réunion", valeur: "environ 2 500 km²", debut: "La Réunion a une aire d'environ", nombre: "2500", unite: "km²", fin: "", local: true},
    {code: "v1", grandeur: "volume", etape: "R10", emoji: "🧊", objet: "Le petit cube unité", valeur: "1 cm³ = 1 mL", debut: "Le petit cube unité a un volume de", nombre: "1", unite: "cm³", fin: ""},
    {code: "v2", grandeur: "volume", etape: "R10", emoji: "🥛", objet: "Une brique de lait", valeur: "1 L = 1 dm³", debut: "Une brique de lait a un volume de", nombre: "1", unite: "dm³", fin: ""},
    {code: "v3", grandeur: "volume", etape: "R10", emoji: "🛢️", objet: "Une cuve de récupération d'eau de pluie", valeur: "1 000 L = 1 m³", debut: "Une cuve de récupération d'eau de pluie a un volume de", nombre: "1", unite: "m³", fin: "", local: true},
    {code: "v4", grandeur: "volume", etape: "R10", emoji: "🏊", objet: "Une piscine olympique", valeur: "2 500 m³", debut: "Une piscine olympique a un volume de", nombre: "2500", unite: "m³", fin: ""}
  ];

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
      retenir: "Mes premiers repères : une feuille A4 mesure 21 cm de large ; une voiture mesure environ 4 m de long ; de Saint-Pierre à Saint-Denis, il y a environ 80 km. Une pièce de 1 € pèse 7,5 g ; un paquet de riz pèse 1 kg ; un pack de 6 bouteilles d'eau pèse environ 9 kg ; une voiture pèse environ 1 t. Une brique de lait contient 1 L ; une canette contient 33 cL.",
      cahier: "Je les note dans mon cahier et je les apprends par cœur.",
      reperes: ["l3", "l4", "l7", "m3", "m4", "m5", "m6", "c3", "c2"]
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
        {etiquette: "Je vois", question: {avant: "De Saint-Denis à Saint-Paul :", reponse: "30", apres: "km"},
          consigne: "Je compare à mes repères.", aide: {type: "unites", grandeur: "longueur", unites: ["mm", "cm", "m", "km"], bonne: "km"},
          legende: "30 m, ce n'est même pas la longueur de 8 voitures.\nUne route entre deux villes se compte en km."}
      ],
      retenir: "Pour choisir l'unité, je compare à mes repères : un crayon mesure 15 cm, pas 15 m ni 15 mm ; un bébé pèse 3 kg, pas 3 g.",
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
          consigne: "Touche la bouteille : elle se gradue en 100 centilitres.",
          aide: {type: "barres", n: 1, grande: "L", petite: "cL", facteur: 100}, apres: ["1 L = 100 cL"],
          legende: "Une bouteille de 1 L se remplit avec 100 cL."},
        {etiquette: "Je représente", question: {avant: "1 kg =", reponse: "1 000", apres: "g"},
          consigne: "Le nom de l'unité dit la relation.",
          aide: {type: "phrase", lignes: ["kilo veut dire mille :", "1 kilogramme = 1 000 grammes"]},
          legende: "De même, 1 kilomètre = 1 000 mètres."}
      ],
      retenir: "1 m = 10 dm = 100 cm = 1 000 mm ; 1 dm = 10 cm ; 1 cm = 10 mm ; 1 km = 1 000 m. 1 kg = 1 000 g ; 1 t = 1 000 kg. 1 L = 10 dL = 100 cL.",
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
      retenir: "Pour passer à une unité plus petite, il en faut plus : je multiplie.\n1 m = 100 cm, donc 3 m = 3 × 100 cm = 300 cm.",
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
      retenir: "Pour passer à une unité plus grande, il en faut moins : je divise. 1 m = 100 cm, donc 600 cm = 600 ÷ 100 m = 6 m.",
      cahier: "Je recopie cela dans mon cahier.",
      relations: RELATIONS_BASES,
      reperes: []
    },
    D1: {
      pret: true,
      aide: {outil: "barre-heure", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "1 h =", reponse: "60", apres: "min"},
          consigne: "Touche la barre de l'heure : elle se coupe en 4 quarts d'heure.",
          aide: {type: "heure", heures: 1, parts: 4},
          apres: ["15 min + 15 min + 15 min + 15 min", "= 60 min"]},
        {etiquette: "Je représente", question: {avant: "2 h =", reponse: "120", apres: "min"},
          relation: ["1 h = 60 min", "donc 2 h = 2 × 60 min"],
          aide: {type: "heure", heures: 2, parts: 1},
          apres: ["60 min + 60 min = 120 min"]},
        {etiquette: "Je représente", question: {avant: "1 h 10 min =", reponse: "70", apres: "min"},
          relation: ["1 h = 60 min", "donc 1 h 10 min = 60 min + 10 min"],
          aide: {type: "heure", heures: 1, parts: 1, plus: 10},
          apres: ["60 min + 10 min = 70 min"]}
      ],
      retenir: "1 h = 60 min (et pas 100 min). 2 h = 2 × 60 min = 120 min ; 1 h 10 min = 60 min + 10 min = 70 min.",
      cahier: "Je recopie cela dans mon cahier.",
      reperes: []
    },
    D2: {
      pret: true,
      aide: {outil: "barre-heure", image: "relation"},
      apprends: [
        {etiquette: "Je vois", question: {avant: "une demi-heure =", reponse: "30", apres: "min"},
          consigne: "Touche la barre de l'heure : elle se coupe en 2 moitiés.",
          aide: {type: "heure", heures: 1, parts: 2, verte: true},
          apres: ["La moitié de 60 min :", "une demi-heure = 30 min"]},
        {etiquette: "Je vois", question: {avant: "un quart d'heure =", reponse: "15", apres: "min"},
          consigne: "Touche la barre de l'heure : elle se coupe en 4 quarts.",
          aide: {type: "heure", heures: 1, parts: 4, verte: true},
          apres: ["Le quart de 60 min :", "un quart d'heure = 15 min"]},
        {etiquette: "Je représente", question: {avant: "trois quarts d'heure =", reponse: "45", apres: "min"},
          relation: ["un quart d'heure = 15 min", "donc trois quarts d'heure = 3 × 15 min"],
          aide: {type: "heure", heures: 1, parts: 4, verte: true, compte: 3},
          apres: ["3 quarts : 3 × 15 min = 45 min"]}
      ],
      retenir: "Une heure, c'est 60 min. Une demi-heure = 30 min ; un quart d'heure = 15 min ; trois quarts d'heure = 3 × 15 min = 45 min.",
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
      pret: Boolean(contenu && contenu.pret)
    });
    if (contenu) Object.assign(etape, typographier(contenu));
    else etape.reperes = REPERES.filter(r => r.etape === e.code).map(r => r.code);
    if (contenu && !contenu.reperes.length) etape.reperes = [];
    return etape;
  });
  ETAPES_T.forEach(e => { PALIERS_T[e.palier - 1].etapes += 1; });

  // L'ordre du parcours : palier, famille, rang.
  const ORDRE = ETAPES_T.slice().sort((a, b) => a.palier - b.palier
    || FAMILLE_RANG[a.famille] - FAMILLE_RANG[b.famille] || a.rang - b.rang).map(e => e.code);

  const PAR_CODE = {};
  ETAPES_T.forEach(e => { PAR_CODE[e.code] = e; });
  const REPERES_T = REPERES.map(r => Object.assign({}, typographier(r), {code: r.code, nombre: r.nombre, unite: r.unite}));
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

  return geler({
    PALIERS: PALIERS_T,
    FAMILLES,
    ETAPES: ETAPES_T,
    REPERES: REPERES_T,
    ORDRE,
    typo,
    etape,
    repere,
    palier,
    etapesDuPalier,
    famillesDuPalier,
    palierPret
  });
});
