// Défi conversions — les générateurs (lot 1, 11/11/2026).
//
// Fichier COMMUN à l'appli élève et, au lot « exerciseur v2 », à
// l'exerciseur. Il ne va jamais sur le serveur de suivi.
//
//   const C = MATHSGO_CONVERSIONS;
//   C.serie(code, {usage, graine, nombre, exclure})
//     usage : "valide" (10 : 3/4/3), "entraine" (25 : 6/9/10), "test"
//     (4 : d2 d3 d3 d2), "echauffement" (1 : d2), "aide" (3 : d1 d2 d2),
//     "retour" (2 : d2 d2 ; « Je me souviens » et « Avant de partir », lot
//     3a : `nombre` 1 ou 2), "exerciseur" (nombre au choix, ordre progressif)
//   C.verifier(question, saisie)  → {juste, erreur, retour}
//   C.exemples(code)              → les 3 exemples de J'apprends
//   C.graineDe(texte)             → une graine (code de série)
//
// Les nombres sont EXACTS : une mesure est un entier de millièmes (BigInt),
// 3,5 → 3500n. Une conversion n'est permise que si le résultat reste un
// entier de millièmes. Jamais de nombre à virgule flottante dans un calcul
// ni dans une comparaison.
//
// Même graine, même série, sur tous les appareils (mulberry32, comme
// Défi calcul et SPLAT!).
//
// Une question : {code, degre, forme, texte, morceaux, reponse,
// reponseTexte, unite, choix?, bon?, correction, image, relation?, glisse?,
// outil, resume, donnees, cle}
//   forme : "nombre" (« 3 m = □ cm »), "phrase" (« Combien de… ? »),
//   "deux-cases" (« 780 cL = □ L □ cL »), "qcm", "vrai-faux",
//   "associer" (3 objets, 3 mesures : `objets`, `mesures`, `bonnes`),
//   "ranger" (4 mesures : `mesures`, `ordre`) — lot A2 bis ;
//   "plusieurs" (lot B2-1b, « Coche tout ce qui est égal à… » : 4 cartes,
//   `cartes`, les places justes `bons`, le pourquoi de chaque carte fausse) ;
//   lot 3b-1 (carte v4) : "qcm" sert aussi aux conversions et aux durées
//   (trois réponses, dont deux vraies erreurs : `donnees` reste celle du
//   calcul, `bon` la place de la bonne), « associer » aux relations (P1) ;
//   reponse : le nombre attendu, écrit sans espace (« 4000 », « 7,5 »), ou
//   deux nombres pour deux cases ; pour un choix, `bon` est sa place ;
//   donnees : ce qu'il faut pour RECALCULER la réponse à part (le banc
//   d'essai le fait, sans passer par le générateur) ;
//   cle : un texte sans espace — deux questions de même clé sont la même
//   question (la forme n'y entre pas : « 3 m = □ cm » et « Combien de
//   centimètres dans 3 m ? » sont la même conversion).
(function initConversionsGenerateurs(root, factory) {
  const carte = typeof module === "object" && module.exports ? require("./conversions_carte.js") : root.MATHSGO_CONVERSIONS_CARTE;
  const api = factory(carte);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_CONVERSIONS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (CARTE) => {
  "use strict";

  const FINE = " ";
  const NB = " ";
  const CASE = "…";

  // ------------------------------------------------------------------ hasard

  function mulberry32(graine) {
    let a = graine >>> 0;
    return function suivant() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function graineDe(texte) {
    let h = 2166136261;
    const chaine = String(texte);
    for (let i = 0; i < chaine.length; i += 1) {
      h ^= chaine.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function entre(rng, minimum, maximum, pas = 1) {
    const n = Math.floor((maximum - minimum) / pas) + 1;
    return minimum + pas * Math.floor(rng() * n);
  }
  function choisir(rng, liste) {
    return liste[Math.floor(rng() * liste.length)];
  }
  function melanger(rng, liste) {
    const copie = liste.slice();
    for (let i = copie.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  // ----------------------------------------------------------------- nombres
  //
  // Un nombre exact : un BigInt de millièmes.

  const MILLE = 1000n;
  function puissance(k) {
    let p = 1n;
    for (let i = 0; i < k; i += 1) p *= 10n;
    return p;
  }

  // Un texte → millièmes. Virgule ou point, espaces ignorées (normale,
  // insécable, fine), « ,5 » = 0,5. null si ce n'est pas un nombre ;
  // "hors" s'il a des chiffres non nuls au-delà des millièmes (il n'est
  // alors égal à aucune réponse).
  function lireMilli(texte) {
    const propre = String(texte == null ? "" : texte).replace(/[\s  ]/g, "").replace(",", ".");
    if (!/^\d+(\.\d*)?$|^\.\d+$/.test(propre)) return null;
    const [entiere, decimales = ""] = propre.split(".");
    const utiles = decimales.replace(/0+$/, "");
    if (utiles.length > 3) return "hors";
    return BigInt(entiere || "0") * MILLE + BigInt((utiles + "000").slice(0, 3));
  }

  // Un nombre JavaScript entier ou un texte → millièmes.
  function milli(x) {
    if (typeof x === "bigint") return x;
    if (typeof x === "number") {
      if (!Number.isInteger(x)) throw new Error("milli : entier attendu");
      return BigInt(x) * MILLE;
    }
    const m = lireMilli(x);
    if (typeof m !== "bigint") throw new Error(`milli : « ${x} » illisible`);
    return m;
  }

  // Millièmes → « 1 234,5 » (espace fine insécable des milliers, virgule,
  // zéros inutiles enlevés).
  function ecrire(m) {
    const signe = m < 0n ? "−" : "";
    const a = m < 0n ? -m : m;
    const entiere = (a / MILLE).toString().replace(/\B(?=(\d{3})+(?!\d))/g, FINE);
    const reste = (a % MILLE).toString().padStart(3, "0").replace(/0+$/, "");
    return signe + entiere + (reste ? "," + reste : "");
  }
  // Millièmes → « 1234,5 » : la réponse sans espace (ce qu'on tape).
  function brut(m) {
    return ecrire(m).replace(new RegExp(FINE, "g"), "");
  }
  // Une mesure : « 1 234,5 cm » (espace insécable avant l'unité).
  function mes(m, unite) {
    return `${ecrire(milli(m))}${NB}${unite}`;
  }

  // ----------------------------------------------------- la table des unités

  const UNITES = {
    longueur: {km: 3, hm: 2, dam: 1, m: 0, dm: -1, cm: -2, mm: -3, "µm": -6, nm: -9},
    masse: {t: 6, kg: 3, hg: 2, dag: 1, g: 0, dg: -1, cg: -2, mg: -3},
    contenance: {hL: 2, daL: 1, L: 0, dL: -1, cL: -2, mL: -3},
    aire: {"km²": 6, "m²": 0, "dm²": -2, "cm²": -4, "mm²": -6},
    volume: {"m³": 0, "dm³": -3, "cm³": -6},
    octet: {o: 0, ko: 3, Mo: 6, Go: 9},
    // La monnaie (lot A2 bis) : 1 € = 100 c.
    argent: {"€": 2, c: 0}
  };
  // Les colonnes du glisse-unité, de la plus grande à la plus petite.
  // Masses : la tonne est 1 000 kg ; les deux colonnes entre t et kg n'ont
  // pas de nom au programme (vides).
  const COLONNES = {
    longueur: ["km", "hm", "dam", "m", "dm", "cm", "mm"],
    masse: ["t", "", "", "kg", "hg", "dag", "g"],
    contenance: ["hL", "daL", "L", "dL", "cL", "mL"]
  };
  // Au palier 1 (cycle 2), les unités hors programme sont en pâle.
  const HORS_CYCLE_2 = ["hm", "dam", "hg", "dag", "hL", "daL", "mL", ""];

  // Au palier 2 (lot B1-2), toutes les colonnes, sans pâle. Les masses,
  // comme dans le matériel virtuel de Gwenaël : du kilogramme au
  // milligramme (« Masse (g) ») ; quand la tonne est en jeu, de la tonne au
  // gramme, comme au palier 1 (dix colonnes jusqu'au mg étaient trop
  // serrées au téléphone).
  const COLONNES_CM1 = {
    longueur: COLONNES.longueur,
    masse: ["kg", "hg", "dag", "g", "dg", "cg", "mg"],
    masseT: COLONNES.masse,
    contenance: COLONNES.contenance
  };

  const MOTS = {
    km: "kilomètres", m: "mètres", dm: "décimètres", cm: "centimètres", mm: "millimètres",
    t: "tonnes", kg: "kilogrammes", g: "grammes", L: "litres", dL: "décilitres", cL: "centilitres", mL: "millilitres",
    min: "minutes", h: "heures", "€": "euros", c: "centimes",
    // Lot B1-2 : les unités du CM1.
    hm: "hectomètres", dam: "décamètres", hg: "hectogrammes", dag: "décagrammes", dg: "décigrammes", cg: "centigrammes",
    mg: "milligrammes", hL: "hectolitres", daL: "décalitres"
  };

  function grandeurDe(unite) {
    return Object.keys(UNITES).find(g => Object.prototype.hasOwnProperty.call(UNITES[g], unite)) || null;
  }
  function exposant(unite) {
    const g = grandeurDe(unite);
    return g ? UNITES[g][unite] : null;
  }
  // Une conversion exacte, ou null si le résultat sort des millièmes.
  function convertir(m, de, vers) {
    const g = grandeurDe(de);
    if (!g || grandeurDe(vers) !== g) return null;
    const d = UNITES[g][de] - UNITES[g][vers];
    if (d >= 0) return m * puissance(d);
    const p = puissance(-d);
    return m % p === 0n ? m / p : null;
  }
  // Le facteur entre deux unités (de la plus grande à la plus petite) : 10ᵏ.
  function facteur(grande, petite) {
    return puissance(exposant(grande) - exposant(petite));
  }

  // ------------------------------------------------------------ les prénoms
  // Filles et garçons, de La Réunion et d'ailleurs. Aucun texte ne dit « il »
  // ni « elle » pour une personne : l'énoncé reprend le prénom.
  const PRENOMS = ["Léa", "Noa", "Inès", "Ethan", "Kylian", "Maëlys", "Enzo", "Lina", "Rayan", "Anaïs", "Kenzo", "Zoé",
    "Sacha", "Naïma", "Théo", "Jade"];

  // ------------------------------------------------------------- les objets
  // La table des objets des problèmes (fiche technique § 2.5). Les bornes
  // sont en millièmes de l'unité `unite` ; le générateur tire dedans et
  // vérifie aussi le résultat. Complétée à chaque palier.
  const OBJETS = {
    ruban: {nom: "un ruban", grandeur: "longueur", unite: "m", min: "0,5", max: "5", pas: "0,1"},
    planche: {nom: "une planche", grandeur: "longueur", unite: "m", min: "1", max: "3", pas: "1"},
    morceauPlanche: {nom: "une planche", grandeur: "longueur", unite: "cm", min: "10", max: "90", pas: "10"},
    coupeRuban: {nom: "un morceau de ruban", grandeur: "longueur", unite: "cm", min: "10", max: "200", pas: "10"},
    sentier: {nom: "un sentier", grandeur: "longueur", unite: "km", min: "2", max: "20", pas: "0,5"},
    marche: {nom: "une marche à pied", grandeur: "longueur", unite: "m", min: "100", max: "1900", pas: "100"},
    riz: {nom: "du riz", grandeur: "masse", unite: "kg", min: "1", max: "3", pas: "1"},
    lentilles: {nom: "des lentilles", grandeur: "masse", unite: "g", min: "100", max: "900", pas: "100"},
    pommes: {nom: "des pommes", grandeur: "masse", unite: "kg", min: "0,5", max: "5", pas: "0,1"},
    jus: {nom: "une bouteille de jus", grandeur: "contenance", unite: "L", min: "1", max: "2", pas: "0,25"},
    // Lot A2 ter : La Réunion.
    letchis: {nom: "des letchis", grandeur: "masse", unite: "kg", min: "1", max: "3", pas: "1"},
    longanis: {nom: "des longanis", grandeur: "masse", unite: "g", min: "100", max: "900", pas: "100"},
    sentierBelouve: {nom: "le sentier du Trou de Fer", grandeur: "longueur", unite: "km", min: "2", max: "5", pas: "1"},
    verre: {nom: "un verre", grandeur: "contenance", unite: "cL", min: "15", max: "30", pas: "5"},
    // Lot 3b : la canne à sucre, la promenade.
    canne: {nom: "une canne à sucre", grandeur: "longueur", unite: "m", min: "2", max: "4", pas: "1"},
    coupeCanne: {nom: "un morceau de canne", grandeur: "longueur", unite: "cm", min: "10", max: "90", pas: "10"},
    trajet: {nom: "un trajet à pied", grandeur: "longueur", unite: "km", min: "1", max: "3", pas: "1"}
  };
  function dansBornes(objet, m) {
    const o = OBJETS[objet];
    return m >= milli(o.min) && m <= milli(o.max);
  }

  // ----------------------------------------------- l'outillage d'une question

  function q(champs) {
    return Object.assign({morceaux: {}, correction: [], image: [], outil: null, choix: null, bon: null}, champs);
  }

  // « 3 m = … cm » : forme nombre ; « Combien de centimètres dans 3 m ? » :
  // forme phrase. La réponse est une mesure exacte.
  function questionConversion(code, degre, forme, valeur, de, vers, extra = {}) {
    const rep = convertir(valeur, de, vers);
    const gauche = mes(valeur, de);
    const {texte, morceaux} = ecrireConversion(forme, valeur, de, vers);
    return q(Object.assign({
      code, degre, forme, texte, morceaux,
      reponse: brut(rep), reponseTexte: mes(rep, vers), unite: vers,
      resume: `${gauche} = ${mes(rep, vers)}`,
      donnees: {type: "conv", valeur: brut(valeur), de, vers},
      cle: `${code}:${brut(valeur)}${de}>${vers}`
    }, extra));
  }

  // Les trois écritures d'une même conversion (audit du 12/11) :
  //   nombre « 3 m = … cm » ; phrase « Combien de centimètres dans 3 m ? » ;
  //   objet  « Une corde de 3 m. Combien de centimètres ? » (un objet réel,
  //   choisi pour que la mesure reste vraisemblable).
  function ecrireConversion(forme, valeur, de, vers) {
    const gauche = mes(valeur, de);
    if (forme === "phrase") {
      // (Lot B2-1 : « combien d'hectomètres » : le h est muet.)
      const phrase = `Combien ${/^h/.test(MOTS[vers]) ? "d'" : "de "}${MOTS[vers]} dans ${gauche}${NB}?`;
      return {texte: phrase, morceaux: {phrase, apres: vers}};
    }
    if (forme === "objet") {
      const objet = objetDe(valeur, de, vers);
      if (!objet) return null;
      const phrase = `${objet} de ${gauche}. Combien de ${MOTS[vers]}${NB}?`;
      return {texte: phrase, morceaux: {phrase, apres: vers, objet: true}};
    }
    return {texte: `${gauche} = ${CASE}${NB}${vers}`, morceaux: {avant: `${gauche} =`, apres: vers}};
  }
  // L'objet d'une mesure, selon son unité de départ et sa taille. Lot 3b
  // (carte v4 : « chaque objet a des bornes pour chaque unité » ; avant, un
  // ruban de 9 000 cm, une planche de 980 dm, une bassine de 900 cL) :
  // chaque objet a ses bornes DANS l'unité où on l'écrit vraiment, et un
  // objet ne s'écrit que dans les unités où on le mesure dans la vie (pas de
  // marmite en dL). Aucun objet ne va : la question ne prend pas la forme
  // « objet » (null), le générateur en tire une autre.
  // [objet, unité, min, max, de La Réunion ?] (bornes en unités entières)
  const OBJETS_MESURE = [
    ["Un clou", "mm", 10, 100], ["Une vis", "mm", 10, 80], ["Une coccinelle", "mm", 4, 9], ["Une planche", "mm", 500, 3000],
    ["Une gomme", "cm", 3, 6], ["Un trombone", "cm", 3, 5], ["Un crayon", "cm", 10, 19], ["Un ruban", "cm", 20, 500],
    ["Une ficelle", "cm", 20, 300], ["Une table", "cm", 60, 200], ["Une feuille de bananier", "cm", 30, 200, true],
    ["Une canne à sucre", "cm", 150, 400, true],
    ["Une table", "m", 1, 3], ["Une corde", "m", 2, 50], ["Un tuyau d'arrosage", "m", 5, 30], ["Un Car Jaune", "m", 10, 14, true],
    ["Un bassin de baignade", "m", 15, 60, true], ["Une rue", "m", 50, 900], ["Un sentier du volcan", "m", 300, 2000, true],
    ["Une randonnée", "km", 2, 20], ["Une course à vélo", "km", 5, 90], ["Un trajet en Car Jaune", "km", 10, 90, true],
    ["Un samoussa", "g", 30, 80, true], ["Une pomme", "g", 100, 250], ["Un sachet de bonbons piment", "g", 100, 500, true],
    ["Un paquet de farine", "g", 500, 1000], ["Un colis", "g", 200, 5000],
    ["Un chat", "kg", 2, 6], ["Un sac de letchis", "kg", 1, 5, true], ["Un sac de riz", "kg", 1, 25, true], ["Une valise", "kg", 5, 25],
    ["Un régime de bananes", "kg", 10, 40, true], ["Un chien", "kg", 3, 40], ["Un camion chargé", "kg", 5000, 10000],
    ["Un éléphant", "kg", 3000, 7000],
    ["Une voiture", "t", 1, 2], ["Un éléphant", "t", 3, 7], ["Un camion chargé", "t", 5, 40], ["Une baleine à bosse", "t", 25, 40, true],
    ["Une bouteille", "L", 1, 2], ["Une marmite de cari", "L", 3, 12, true], ["Un arrosoir", "L", 5, 12], ["Un seau", "L", 5, 15],
    ["Un aquarium", "L", 20, 300], ["Une baignoire", "L", 100, 200],
    ["Un verre", "cL", 10, 30], ["Une bouteille", "cL", 25, 200], ["Un verre de jus de goyavier", "cL", 15, 30, true],
    ["Un bol", "cL", 25, 50]
  ];
  // Lot B2-1 : les objets des mesures à virgule (C3, C4), bornés dans
  // l'unité où on les mesure. [objet, unité, min, max, de La Réunion ?]
  const OBJETS_DECIMAUX = [
    ["Une planche", "m", "1,2", "3"], ["Une canne à sucre", "m", "1,5", "3,5", true], ["Un Car Jaune", "m", "10,5", "13,5", true],
    ["Une table", "m", "1,2", "2,5"], ["Un ruban", "m", "0,5", "5"], ["Une corde", "m", "2,5", "30"], ["Un tuyau d'arrosage", "m", "5,5", "30"],
    ["Une feuille de bananier", "m", "0,5", "2", true],
    ["Une randonnée", "km", "2,5", "18"], ["Un trajet en Car Jaune", "km", "10,5", "60", true], ["Un sentier du volcan", "km", "1,5", "6", true],
    ["Un crayon", "cm", "10,5", "18,5"], ["Une gomme", "cm", "3,5", "6,5"], ["Une coccinelle", "mm", "4,5", "8,5"],
    ["Un sac de letchis", "kg", "1,5", "5", true], ["Un régime de bananes", "kg", "10,5", "35", true], ["Un chat", "kg", "2,5", "6"],
    ["Un melon", "kg", "0,8", "2,5"], ["Une valise", "kg", "5,5", "23"], ["Un colis", "kg", "0,5", "20"], ["Un sac de riz", "kg", "1,5", "25", true],
    ["Une voiture", "t", "1,1", "1,9"], ["Un camion chargé", "t", "5,5", "38"],
    ["Une marmite de cari", "L", "3,5", "12", true], ["Une bouteille", "L", "0,5", "2"], ["Un seau", "L", "5,5", "15"], ["Un arrosoir", "L", "5,5", "12"],
    ["Un verre", "L", "0,15", "0,3"]
  ];
  const SANS_OBJET = ["dL", "dm", "hm", "dam", "hg", "dag", "dg", "cg", "mg", "daL", "hL"];
  // Et une conversion qu'on fait vraiment : jamais un objet en décilitres
  // (un aquarium de 98 L en dL), des millimètres depuis les mètres
  // seulement pour une table (on la commande en mm).
  function objetDe(valeur, de, vers) {
    // (Ni en dm : « une planche de 30 dm », « une canne à sucre de 390 cm,
    // combien de dm ? » ne se disent pas dans la vie ; le dm reste dans les
    // calculs. Lot B2-1 : ni dans les unités du CM1 qu'on n'emploie pas pour
    // un objet, hm, dam, hg, dag, dg, cg, mg, daL, hL.)
    if ([de, vers].some(u => SANS_OBJET.includes(u))) return null;
    // Lot B2-1 : une mesure à virgule, ses objets à elle (« Une planche de
    // 2,4 m », « Un sac de letchis de 1,5 kg »).
    if (valeur % MILLE !== 0n) {
      const possibles = OBJETS_DECIMAUX.filter(([nom, u, a, b]) => u === de && valeur >= milli(a) && valeur <= milli(b)
        && !(de === "m" && vers === "mm" && nom !== "Une table" && nom !== "Une planche"));
      if (!possibles.length) return null;
      const locaux = possibles.filter(o => o[4]);
      const cle = valeur / 100n;
      const liste = locaux.length && cle % 2n === 0n ? locaux : possibles;
      return liste[Number(cle % BigInt(liste.length))][0];
    }
    const n = valeur / MILLE;
    const possibles = OBJETS_MESURE.filter(([nom, u, a, b]) => u === de && n >= BigInt(a) && n <= BigInt(b)
      && !(de === "m" && vers === "mm" && nom !== "Une table"));
    if (!possibles.length) return null;
    // Une fois sur deux (selon le nombre), un objet de La Réunion, quand la
    // mesure lui va (lot A2 ter).
    const locaux = possibles.filter(o => o[4]);
    const liste = locaux.length && n % 2n === 0n ? locaux : possibles;
    return liste[Number(n % BigInt(liste.length))][0];
  }

  // Ce qui rend une conversion facile ou dure à lire pour le glisse-unité.
  // Lot 3b-2 (S002 p. 9, S003 p. 6 : « le glisse-unité accompagne la
  // phrase », il ne la remplace pas) : la phrase que la correction dit sous
  // le glisse-unité. Au palier 1, des nombres entiers : « Chaque mètre
  // devient 100 centimètres. » ; « 100 centimètres font 1 mètre. ».
  const MOT = {km: "kilomètre", m: "mètre", dm: "décimètre", cm: "centimètre", mm: "millimètre", t: "tonne", kg: "kilogramme", g: "gramme",
    L: "litre", dL: "décilitre", cL: "centilitre", mL: "millilitre",
    hm: "hectomètre", dam: "décamètre", hg: "hectogramme", dag: "décagramme", dg: "décigramme", cg: "centigramme", mg: "milligramme",
    hL: "hectolitre", daL: "décalitre"};
  // `cm1` (lot B1-2) : le glisse-unité du palier 2, toutes ses colonnes
  // (`pale: false`, et les masses jusqu'au milligramme).
  // `decimaux` (lot B2-1) : la phrase des décimaux (C3, C4).
  function glisse(valeur, de, vers, {cm1 = false, decimaux = false} = {}) {
    const g = {valeur: brut(valeur), de, vers, grandeur: grandeurDe(de)};
    if (cm1) {
      g.pale = false;
      if (g.grandeur === "masse") g.colonnes = de === "t" || vers === "t" ? COLONNES_CM1.masseT : COLONNES_CM1.masse;
    }
    if (MOT[de] && MOT[vers]) {
      if (decimaux) {
        g.phrase = phraseDecimaux(valeur, de, vers);
        g.phraseCourte = phraseDecimaux(valeur, de, vers, true);
      }
      else if (exposant(de) > exposant(vers)) {
        const f = facteur(de, vers);
        g.phrase = `Chaque ${MOT[de]} devient ${ecrire(f * MILLE)}${NB}${MOTS[vers]}.`;
      } else {
        const f = facteur(vers, de);
        g.phrase = `${ecrire(f * MILLE)}${NB}${MOTS[de]} font 1${NB}${MOT[vers]}.`;
      }
    }
    return g;
  }

  // La relation « 1 kg = 1 000 g » entre une grande et une petite unité.
  function relationTexte(grande, petite) {
    return `1${NB}${grande} = ${mes(facteur(grande, petite) * MILLE, petite)}`;
  }

  // ============================================================== LES ÉTAPES
  //
  // Chaque étape : tirer(rng, degre, i, usage) → une question (ou null) ;
  // formes(usage) → la forme imposée à chaque place (ou null) ;
  // accepte(serie, question, usage) → les contraintes de la série ;
  // valide(serie, usage) → la série finie est-elle bonne ? ;
  // erreurs(question, valeurLue) → {erreur, retour} ou null.

  const ETAPES = {};

  // --------------------------------------------- R1 · Mes premiers repères
  // Lot R1-refonte (18/11, avec Gwenaël) : un repère par unité du CE2, dix
  // en tout (la carte). Les façons de demander, de la plus facile à la plus
  // dure : relier ; « Qu'est-ce qui mesure environ 1 m ? » (les dessins à
  // toucher, comme au palier 2) ; l'unité ; la valeur parmi trois ; la
  // valeur au pavé ; la règle à lire (le programme du CE1 : mesurer avec la
  // règle). (« Quel segment mesure environ 5 cm ? », essayé le 18/11, est
  // retiré le 19/11 par Gwenaël : un écran ne montre pas les vrais
  // centimètres ; le geste réel reste dans On te montre.) Le décimètre
  // entre dans les unités (le programme du CE2 : m, dm, cm, mm, km).
  const ORDRE_UNITES = {longueur: ["mm", "cm", "dm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"]};

  function questionRepereInterne(code, degre, rep, forme, rng) {
    const r = CARTE.repere(rep);
    const v = milli(r.nombre);
    const fin = r.fin ? ` ${r.fin}` : "";
    const resume = `${r.objet} : ${r.valeur}`;
    // (Lot R1-refonte : l'outil de À toi est la carte du repère, son dessin
    // et sa mesure ; l'image, son dessin seul.)
    const outil = code === "R1" ? "carte-repere" : "reperes-unites";
    let choix;
    let bon;
    let texte;
    if (forme === "unite") {
      const liste = ORDRE_UNITES[r.grandeur];
      const i = liste.indexOf(r.unite);
      const fenetres = [];
      for (let d = 0; d + 3 <= liste.length; d += 1) if (i >= d && i < d + 3) fenetres.push(liste.slice(d, d + 3));
      choix = melanger(rng, choisir(rng, fenetres));
      texte = `${r.debut} ${ecrire(v)} ${CASE}${fin}`;
      bon = choix.indexOf(r.unite);
    } else if (forme === "saisie") {
      // Lot 3b (carte v4) : la valeur sans choix, au pavé (« Une brique de
      // lait contient … L ») — la question de l'exerciseur qu'on avait perdue.
      const phrase = CARTE.typo(r.debut);
      const apres = CARTE.typo(`${r.unite}${fin}`);
      return q({
        code, degre, forme: "phrase", texte: CARTE.typo(`${r.debut} ${CASE}${NB}${r.unite}${fin}`),
        morceaux: {phrase, apres, sorte: "saisie"},
        reponse: brut(v), reponseTexte: `${ecrire(v)}${NB}${r.unite}`,
        unite: r.unite, resume, repere: rep, outil, grandeur: r.grandeur,
        image: [], correction: [resume],
        donnees: {type: "repere", repere: rep, sorte: "saisie"},
        cle: `${code}:${rep}:saisie`
      });
    } else {
      // La valeur : la bonne, et deux autres à × ou ÷ 10, 100, 1 000.
      const candidats = [];
      [1n, 2n, 3n].forEach(k => {
        const p = puissance(Number(k));
        candidats.push(v * p);
        if (v % p === 0n) candidats.push(v / p);
      });
      // Des nombres entiers jusqu'à 10 000, comme au CE2 (audit du 12/11 :
      // « 33 000 » ou « 0,4 » sortaient du programme).
      const propres = candidats.filter(c => c >= MILLE && c <= 10000n * MILLE && c % MILLE === 0n && c !== v);
      const autres = melanger(rng, propres).slice(0, 2);
      choix = melanger(rng, [v, ...autres]).map(ecrire);
      bon = choix.indexOf(ecrire(v));
      texte = `${r.debut} ${CASE}${NB}${r.unite}${fin}`;
    }
    texte = CARTE.typo(texte);
    return q({
      code, degre, forme: "qcm", texte, morceaux: {phrase: texte, apres: forme === "unite" ? "" : r.unite, sorte: forme},
      choix, bon, reponse: choix[bon], reponseTexte: forme === "unite" ? `${ecrire(v)}${NB}${r.unite}` : `${choix[bon]}${NB}${r.unite}`,
      unite: r.unite, resume, repere: rep, outil, grandeur: r.grandeur,
      image: [], correction: [resume],
      donnees: {type: "repere", repere: rep, sorte: forme},
      cle: `${code}:${rep}:${forme}`
    });
  }

  // « Associer » (lot A2 bis, la question qui manquait à l'exerciseur) :
  // 3 objets, 3 mesures, à relier au doigt. Degrés 1 et 2 : trois grandeurs
  // différentes ; degré 3 : la même grandeur (il faut connaître le repère,
  // l'unité ne suffit pas). Jamais deux fois le même objet, jamais deux
  // fois la même mesure.
  // `eviter` : les repères des questions juste avant (lot A2 ter : pas deux
  // fois le même repère à moins de 5 questions dans À toi).
  // Lot R1-refonte : tous les triplets possibles sont rangés une fois pour
  // toutes ; on prend un triplet libre (aucun repère à éviter), sinon rien
  // (la série tire une autre question : avant, un triplet qui ne
  // respectait pas la règle pouvait sortir sans bruit).
  const NOMS_COURTS = {l1: "La plus petite graduation", l10: "Mon petit doigt", l13: "La poignée de la porte", l14: "10 terrains", l15: "Ma main"};
  const NOMS_RELIER = {l1: "La plus petite graduation", l14: "10 terrains de foot"};
  const TRIPLETS_R1 = {};
  function tripletsR1(degre) {
    const cle = degre === 3 ? 3 : 1;
    if (TRIPLETS_R1[cle]) return TRIPLETS_R1[cle];
    const r = CARTE.etape("R1").reperes.map(c => CARTE.repere(c));
    const liste = [];
    for (let a = 0; a < r.length; a += 1) {
      for (let b = a + 1; b < r.length; b += 1) {
        for (let c = b + 1; c < r.length; c += 1) {
          const t = [r[a], r[b], r[c]];
          const g = new Set(t.map(x => x.grandeur));
          const mesures = new Set(t.map(x => `${x.nombre}${x.unite}`));
          if (mesures.size === 3 && (cle === 3 ? g.size === 1 : g.size === 3)) liste.push(t);
        }
      }
    }
    TRIPLETS_R1[cle] = liste;
    return liste;
  }
  function questionAssocier(code, degre, rng, eviter = []) {
    const libres = tripletsR1(degre).filter(t => !t.some(r => eviter.includes(r.code)));
    if (!libres.length) return null;
    const trois = melanger(rng, choisir(rng, libres));
    const mesureDe = r => CARTE.typo(`${ecrire(milli(r.nombre))} ${r.unite}`);
    // Lot A2 ter (Gwenaël, le 13/11 : « chacun est en face de chacun, c'est
    // normal ? ») : jamais les trois mesures en face de leur objet.
    let ordreMesures = melanger(rng, [0, 1, 2]);
    while (ordreMesures.every((k, j) => k === j)) ordreMesures = melanger(rng, [0, 1, 2]);
    const mesures = ordreMesures.map(k => mesureDe(trois[k]));
    const bonnes = trois.map((r, k) => ordreMesures.indexOf(k));
    const consigne = "Relie chaque objet à sa mesure.";
    // (Lot R1-refonte : la correction en peu de mots, « La poignée de la
    // porte : environ 1 m » ; en entier, trois lignes longues réduisaient
    // l'aide à 77 % au petit iPhone avec une police large.)
    const correction = trois.map(r => CARTE.typo(`${NOMS_COURTS[r.code] && r.code !== "l14" ? NOMS_COURTS[r.code] : r.code === "l14" ? "10 terrains de foot" : r.objet} : ${/environ/.test(r.valeur) ? "environ " : ""}${mesureDe(r)}`));
    return q({
      code, degre, forme: "associer",
      texte: CARTE.typo(`${consigne} ${trois.map(r => r.objet).join(" ; ")} — ${mesures.join(" ; ")}`),
      morceaux: {phrase: consigne},
      // (Lot R1-refonte : sur grand écran aussi, « La plus petite
      // graduation » et « 10 terrains de foot » : le nom entier sortait de
      // son bouton en projection avec une police large.)
      objets: trois.map(r => Object.assign({texte: NOMS_RELIER[r.code] || r.objet, repere: r.code}, NOMS_COURTS[r.code] ? {court: NOMS_COURTS[r.code]} : {})), mesures, bonnes,
      reponse: bonnes.join(","), reponseTexte: trois.map(r => `${r.objet} : ${mesureDe(r)}`).join(" ; "),
      resume: trois.map(r => `${r.objet} : ${mesureDe(r)}`).join(" ; "),
      reperes: trois.map(r => r.code), unites: trois.map(r => r.unite), outil: "carte-repere",
      correction,
      donnees: {type: "associer", reperes: trois.map(r => r.code), mesures: mesures.slice()},
      cle: `${code}:assoc:${trois.map(r => r.code).sort().join("-")}`
    });
  }

  // Lot 3b-2 (carte v4 : « lire une longueur sur la règle quand l'objet ne
  // part pas de 0 », l'erreur classique du CE1-CE2) : un objet posé sur la
  // règle dessinée, de 2 à 5 cm jusqu'à 10 cm au plus. Trois réponses : la
  // bonne, le nombre lu au bout de l'objet (8 cm pour un objet de 3 à 8 cm),
  // les traits comptés au lieu des espaces (6 cm). Le début n'est jamais 1
  // (« lu au bout » et « traits comptés » y seraient la même réponse).
  // [nom, « le … » dans la correction, longueur min, max (cm)]
  // Lot R1-refonte (Gwenaël, 18/11 : « toujours 3 » pour le clou et la
  // gomme) : c'était le hasard, mais la gomme n'allait que de 2 à 4 cm ;
  // les longueurs s'élargissent, et une série ne reprend jamais la même
  // longueur deux fois de suite (`jamais`).
  const OBJETS_REGLE = {crayon: ["ce crayon", "Le crayon", 4, 8], gomme: ["cette gomme", "La gomme", 2, 6], trombone: ["ce trombone", "Le trombone", 2, 5],
    clou: ["ce clou", "Le clou", 2, 7]};
  function questionRegle(degre, rng) {
    const objet = choisir(rng, Object.keys(OBJETS_REGLE));
    const [ce, Le, a, b] = OBJETS_REGLE[objet];
    const longueur = entre(rng, a, b);
    const debut = entre(rng, 2, Math.min(5, 10 - longueur));
    const fin = debut + longueur;
    const choix = melanger(rng, [longueur, fin, longueur + 1].map(String));
    const phrase = `Combien mesure ${ce}${NB}?`;
    return q({
      code: "R1", degre, forme: "qcm", texte: phrase,
      morceaux: {phrase, apres: "cm", sorte: "valeur", regle: {objet, debut, fin}},
      choix, bon: choix.indexOf(String(longueur)), reponse: String(longueur), reponseTexte: `${longueur}${NB}cm`, unite: "cm",
      resume: `${Le} mesure ${longueur}${NB}cm`, outil: "regle", longueurRegle: longueur,
      image: [`${Le} commence à ${debut}${NB}cm, pas à 0.`, `Je compte les espaces de 1${NB}cm, pas les traits.`],
      correction: [`${Le} va de ${debut}${NB}cm à ${fin}${NB}cm.`, `${fin} − ${debut} = ${longueur} : ${Le.toLowerCase()} mesure ${longueur}${NB}cm.`],
      donnees: {type: "regle", objet, debut, fin},
      cle: `R1:regle:${objet}:${debut}-${fin}`
    });
  }

  // Les repères d'une même grandeur, dans R1 (« Qu'est-ce qui pèse environ
  // 1 kg ? » : les trois masses). La contenance n'en a que deux : pas
  // d'objet à trouver.
  function poolR1(rep) {
    const g = CARTE.repere(rep).grandeur;
    return CARTE.etape("R1").reperes.filter(c => CARTE.repere(c).grandeur === g);
  }
  // (Les repères qu'une question demande ou montre.)
  const repsR1 = x => (x.forme === "associer" ? x.reperes : x.repere ? [x.repere] : []);

  ETAPES.R1 = {
    exclureExemples: false,
    // Lot R1-refonte : les formes, de la plus facile à la plus dure.
    // Je valide : relier, l'objet à trouver et l'unité au degré 1 ;
    // l'unité, la valeur, l'objet, la règle au degré 2 ; le pavé, la
    // valeur, le pavé au degré 3. À toi : un bon élève (9 questions) voit
    // relier, l'unité, l'objet, la règle, la valeur et le pavé.
    formes(usage) {
      if (usage === "valide") return {0: "associer", 1: "quoi", 2: "unite", 3: "unite", 4: "valeur", 5: "quoi", 6: "regle", 7: "saisie", 8: "valeur", 9: "saisie"};
      if (usage === "entraine") {
        return {0: "associer", 1: "unite", 2: "quoi", 3: "unite", 4: "quoi", 5: "unite", 6: "regle", 7: "valeur", 8: "saisie", 9: "quoi",
          10: "associer", 11: "quoi", 12: "valeur", 13: "regle", 14: "unite", 15: "saisie", 16: "valeur", 17: "quoi", 18: "associer",
          19: "saisie", 20: "regle", 21: "quoi", 22: "valeur", 23: "saisie", 24: "unite"};
      }
      return {};
    },
    // Lot A2 ter (Gwenaël, le 13/11 : « Une voiture pèse environ … » puis
    // « Une voiture pèse environ … t » dans la même série) : dans Je valide
    // (et le test, On revoit), JAMAIS deux fois le même repère demandé ; la
    // question à relier en reprend trois. Dans À toi, pas deux fois le même
    // repère à moins de 5 questions d'écart (relier compris). Lot
    // R1-refonte : la règle à lire ne reprend pas la longueur de la règle
    // d'avant.
    jamais(serie, question, usage) {
      if (question.longueurRegle) {
        const avant = serie.filter(y => y.longueurRegle);
        if (avant.length && avant[avant.length - 1].longueurRegle === question.longueurRegle) return false;
      }
      if (usage === "entraine" || usage === "exerciseur") {
        return !serie.slice(-4).some(y => repsR1(y).some(r => repsR1(question).includes(r)));
      }
      if (!repsR1(question).length || question.forme === "associer") return true;
      return !serie.some(y => y.forme !== "associer" && repsR1(y).includes(question.repere));
    },
    tirer(rng, degre, i, usage, forme, serie = []) {
      const recents = serie.slice(-4).flatMap(repsR1);
      if (forme === "associer") return questionAssocier("R1", degre, rng, usage === "entraine" || usage === "exerciseur" ? recents : []);
      if (forme === "regle") return questionRegle(degre, rng);
      // (Les repères des 4 questions d'avant sont écartés d'emblée dans À toi :
      // la série ne tire plus des questions que `jamais` refuserait.)
      let reps = CARTE.etape("R1").reperes;
      if (usage === "entraine" || usage === "exerciseur") {
        const libres = reps.filter(c => !recents.includes(c));
        if (libres.length) reps = libres;
      }
      // Avant une question à relier de À toi, les questions d'avant laissent
      // libre ce qu'il lui faudra (un triplet sans repère des 4 questions
      // d'avant).
      if (usage === "entraine") {
        const f = this.formes("entraine");
        Object.keys(f).filter(j => f[j] === "associer").map(Number).forEach(j => {
          const ecart = j - i;
          if (ecart < 1 || ecart > 4) return;
          const d = j >= 15 ? 3 : j >= 6 ? 2 : 1;
          const deja = serie.slice(Math.max(0, j - 4)).flatMap(repsR1);
          reps = reps.filter(c => tripletsR1(d).some(t => !t.some(r => deja.includes(r.code) || r.code === c)));
        });
        if (!reps.length) reps = CARTE.etape("R1").reperes.filter(c => !recents.includes(c));
      }
      if (forme === "quoi") {
        const possibles = reps.filter(c => poolR1(c).length >= 3);
        if (!possibles.length) return null;
        const rep = choisir(rng, possibles);
        return questionQuoi("R1", degre, rep, rng, poolR1(rep));
      }
      // Lot 3b (carte v4 : « demander aussi la valeur sans choix ») : trois
      // façons de demander un même repère — l'unité, la valeur parmi trois,
      // la valeur au pavé. Une même question ne revient pas dans une série.
      const sorte = forme === "saisie" || forme === "unite" || forme === "valeur" ? forme : degre === 1 ? "unite"
        : degre === 3 ? choisir(rng, ["valeur", "saisie"]) : choisir(rng, ["unite", "valeur", "saisie"]);
      return questionRepereInterne("R1", degre, choisir(rng, reps), sorte, rng);
    }
  };

  // ----------------------------------------------- R2 · Quelle unité choisir ?
  // Une unité qu'on utilise vraiment, et une seule plausible. Longueurs :
  // 4 choix (mm, cm, m, km) ; masses et contenances : 3 (le cycle 2 n'en a
  // pas plus).
  // Lot R1-refonte (Gwenaël, 18/11 : « trouver l'ordre de grandeur ou
  // trouver qu'est-ce que c'est comme grandeur, c'est pas pareil ») : trois
  // travaux séparés, du plus facile au plus dur —
  //   1. Quelle grandeur ? « Qu'est-ce que je mesure ? », et les unités de
  //      grandeurs différentes (« Une brique de lait : 1 … » : cm, g, L) ;
  //   2. Quelle unité, dans la même grandeur ? (mm, cm, m, km ; g, kg, t ;
  //      cL, dL, L ; min, h, jours) : on compare à ses repères ;
  //   3. Quel nombre, avec la même unité ? (« La hauteur d'une porte :
  //      2 m, 20 m ou 200 m ? ») : l'ordre de grandeur du nombre.
  // La correction cite les repères qui permettent de trancher (« Plus lourd
  // qu'un trombone, plus léger qu'un paquet de riz. »).
  const OBJETS_UNITE = [
    ["La longueur d'un crayon :", "15", "cm", 1], ["La hauteur d'une porte :", "2", "m", 1], ["La longueur d'une piscine :", "25", "m", 1],
    ["La largeur d'un cahier :", "17", "cm", 1], ["La longueur d'une règle :", "20", "cm", 1], ["Un cartable :", "4", "kg", 1],
    ["Une pomme :", "150", "g", 1], ["Un chat :", "4", "kg", 1], ["Un verre d'eau :", "20", "cL", 1], ["Une poubelle de cuisine :", "30", "L", 1],
    ["L'épaisseur d'une pièce de 2 € :", "2", "mm", 2], ["La longueur d'une fourmi :", "5", "mm", 2],
    ["Le tour de La Réunion en voiture : environ", "200", "km", 2], ["La longueur d'un terrain de football :", "100", "m", 2],
    ["Un éléphant :", "5", "t", 2], ["Une plaquette de beurre :", "250", "g", 2], ["Un camion chargé :", "20", "t", 2],
    ["Une gomme :", "20", "g", 2], ["Une baignoire pleine :", "150", "L", 2], ["Un pot de yaourt :", "12", "cL", 2], ["Une tasse :", "20", "cL", 2],
    ["Le Piton de la Fournaise : environ", "2 600", "m", 3], ["La taille d'un enfant de 8 ans :", "130", "cm", 3],
    ["L'épaisseur d'un cahier :", "8", "mm", 3], ["Un sac de ciment :", "25", "kg", 3], ["Un yaourt :", "125", "g", 3],
    ["Un bus :", "12", "t", 3], ["Une bouteille d'eau :", "150", "cL", 3], ["Le réservoir d'une voiture :", "50", "L", 3],
    ["Un petit verre de jus :", "2", "dL", 3], ["Une cuillère de sirop :", "1", "cL", 3], ["L'épaisseur d'un carton :", "3", "mm", 3],
    // Un exemple de J'apprends (degré 0) : jamais dans une série. « De
    // Saint-Denis à Saint-Paul » n'en est plus un (lot A2 bis).
    ["De Saint-Denis à Saint-Paul :", "30", "km", 2], ["Un bébé à la naissance :", "3", "kg", 2],
    // Les objets de l'exerciseur (lot A2 bis), avec ses mesures.
    ["La longueur d'un lit :", "2", "m", 1], ["Un œuf :", "60", "g", 1], ["Une baguette de pain :", "250", "g", 1],
    ["Un gros dictionnaire :", "1", "kg", 1], ["Un grand arrosoir plein :", "10", "L", 1],
    ["De la maison à l'école : environ", "1", "km", 2], ["L'épaisseur d'une règle en plastique :", "3", "mm", 3],
    ["L'altitude d'un avion en vol : environ", "10", "km", 3], ["Une baleine bleue : environ", "150", "t", 3],
    // Lot A2 ter : La Réunion (Gwenaël, le 13/11 : « Des trucs de La Réunion ? »).
    ["Une bouteille de jus de goyavier :", "1", "L", 1], ["Un sac de letchis :", "2", "kg", 1], ["La longueur d'un Car Jaune :", "12", "m", 1],
    ["Un régime de bananes : environ", "20", "kg", 2], ["Un samoussa :", "50", "g", 2], ["La longueur d'un bassin de baignade :", "25", "m", 2],
    ["Un bonbon piment : environ", "10", "g", 3], ["Une marmite de cari :", "5", "L", 3], ["La largeur d'une feuille de bananier :", "50", "cm", 3],
    // Lot 3b (carte v4) : les phrases des tests de positionnement de 6e et
    // de l'évaluation de 6e, et La Réunion.
    ["Le pied d'un adulte mesure environ", "30", "cm", 2], ["Une coccinelle mesure environ", "7", "mm", 2],
    ["La largeur d'une salle de classe : environ", "6", "m", 2], ["Une araignée pèse environ", "1", "g", 3],
    ["Un sac de riz :", "5", "kg", 1], ["Une canette de jus :", "33", "cL", 2], ["Une mangue : environ", "300", "g", 2],
    ["La hauteur d'une canne à sucre : environ", "3", "m", 2], ["Un ananas Victoria : environ", "800", "g", 3],
    // Lot R1-refonte : les exemples du programme du cycle 2 (S440 : la
    // trousse, la feuille, le seau d'eau, la table de la classe).
    ["La longueur d'une trousse :", "20", "cm", 1], ["La hauteur d'une table de classe : environ", "80", "cm", 2],
    ["Une feuille de papier : environ", "5", "g", 2], ["Un seau plein d'eau :", "10", "L", 1], ["Un seau plein d'eau : environ", "10", "kg", 3]
  ];
  // Lot 3b (carte v4) : « Quelle unité pour… ? », sans nombre (la question
  // de l'exerciseur, perdue). Les mauvaises réponses : une autre grandeur
  // (cL pour une longueur) et, quand il y en a une sans ambiguïté, une
  // unité de la même grandeur au mauvais ordre de grandeur (le km pour un
  // crayon). Jamais deux unités qui pourraient toutes deux convenir (le m et
  // le cm pour une porte). [mesurer…, la bonne, la fausse de même grandeur, degré]
  const SANS_NOMBRE = [
    ["mesurer la longueur d'un crayon", "cm", "km", 1], ["mesurer la longueur d'une piscine", "m", "mm", 1],
    ["peser un cartable", "kg", "t", 1], ["peser une pomme", "g", "t", 1], ["mesurer la contenance d'une baignoire", "L", null, 1],
    ["mesurer la distance de Saint-Denis à Saint-Pierre", "km", "mm", 1], ["peser un éléphant", "t", "g", 1],
    ["mesurer l'épaisseur d'une pièce de 1 €", "mm", "km", 2], ["mesurer la longueur d'un Car Jaune", "m", "mm", 2],
    ["peser un sac de letchis", "kg", "t", 2], ["mesurer la contenance d'un verre", "cL", null, 2],
    ["peser un samoussa", "g", "t", 2], ["mesurer la longueur d'un terrain de football", "m", "mm", 2],
    ["mesurer la longueur d'une fourmi", "mm", "km", 2], ["peser un camion chargé", "t", "g", 2],
    ["mesurer la contenance d'une marmite de cari", "L", null, 3], ["mesurer la largeur d'un cahier", "cm", "km", 3],
    ["mesurer la longueur du tour de La Réunion", "km", "mm", 3], ["peser une baleine à bosse", "t", "g", 3],
    ["mesurer la contenance d'une cuillère à soupe", "cL", null, 3], ["peser un trombone", "g", "t", 3],
    ["mesurer la hauteur du Piton des Neiges", "m", "mm", 3]
  ];
  // Une unité d'une autre grandeur (lot 3b ; positionnement de 6e : « Une
  // araignée pèse 1 … » : g, kg, mm, L).
  const NOM_UNITE = {mm: "le millimètre (mm)", cm: "le centimètre (cm)", m: "le mètre (m)", km: "le kilomètre (km)", g: "le gramme (g)",
    kg: "le kilogramme (kg)", t: "la tonne (t)", cL: "le centilitre (cL)", dL: "le décilitre (dL)", L: "le litre (L)"};
  const AUTRES_GRANDEURS = {longueur: ["kg", "g", "L", "cL"], masse: ["m", "cm", "mm", "L", "cL"], contenance: ["kg", "g", "m", "cm"]};
  // « Qu'est-ce qu'on mesure ? » (programme de CE2 ; la question « Quelle
  // grandeur ? » de l'exerciseur, lot A2 bis). Degré 1 : l'instrument est
  // dans la phrase ; degrés 2 et 3 : une situation de la vie.
  const GRANDEURS_CHOIX = ["une longueur", "une masse", "une contenance", "une durée"];
  const GRANDEURS_CLES = ["longueur", "masse", "contenance", "duree"];
  const SITUATIONS = [
    ["Je pose la règle le long de mon cahier.", "longueur", 1], ["Je pose la pastèque sur la balance.", "masse", 1],
    ["Je verse le jus dans le verre doseur.", "contenance", 1], ["Je regarde le chronomètre au départ et à l'arrivée de la course.", "duree", 1],
    ["Je déroule le mètre de couturière autour de ma tête.", "longueur", 1], ["Je pèse les tomates chez le marchand.", "masse", 1],
    ["Je veux savoir si l'armoire passe par la porte.", "longueur", 2], ["Je veux savoir si mon cartable est trop lourd.", "masse", 2],
    ["Je veux savoir combien d'eau tient dans l'arrosoir.", "contenance", 2], ["Je veux savoir si j'ai le temps de finir mon dessin avant la sonnerie.", "duree", 2],
    ["Je veux savoir quelle distance il y a de chez moi à l'école.", "longueur", 2], ["Je veux savoir combien de temps je mets pour aller à l'école.", "duree", 2],
    ["Je veux savoir combien de farine il faut pour le gâteau.", "masse", 3], ["Je veux savoir combien de sirop il reste dans la bouteille.", "contenance", 3],
    ["Je veux savoir combien de temps cuisent les pâtes.", "duree", 3], ["Je veux savoir quel sac de pommes de terre est le plus lourd.", "masse", 3],
    ["Je veux savoir quelle bouteille contient le plus de jus.", "contenance", 3], ["Je veux savoir si la table rentre dans la voiture.", "longueur", 3],
    // Lot A2 ter : La Réunion.
    ["Je pèse le sac de letchis au marché.", "masse", 1], ["Je verse le jus de goyavier dans le verre doseur.", "contenance", 1],
    ["Je veux savoir combien de temps dure le trajet en Car Jaune.", "duree", 2], ["Je veux savoir si la planche de surf rentre dans la voiture.", "longueur", 2],
    ["Je veux savoir combien d'eau tient dans la marmite du cari.", "contenance", 3], ["Je veux savoir quel régime de bananes est le plus lourd.", "masse", 3]
  ];
  // « h, min ou jours » (le programme de CE1 : heure, minute, jour).
  const DUREES_CHOIX = ["min", "h", "jours"];
  const DUREES_UNITE = [
    // L'exemple de J'apprends (degré 0).
    ["La récréation :", "15", "min", 0],
    ["Un film au cinéma :", "2", "h", 1], ["Se brosser les dents :", "3", "min", 1], ["Une nuit de sommeil :", "10", "h", 1], ["Un week-end :", "2", "jours", 1],
    ["La journée d'école :", "6", "h", 2], ["Faire cuire des pâtes :", "10", "min", 2], ["Les vacances de Noël : environ", "15", "jours", 2],
    ["Un match de football :", "90", "min", 2], ["De Saint-Pierre à Saint-Denis en voiture : environ", "1", "h", 2],
    ["Monter à pied au sommet du Piton des Neiges : environ", "5", "h", 3], ["Faire bouillir l'eau des pâtes :", "8", "min", 3],
    ["De La Réunion à Paris en avion : environ", "11", "h", 3], ["Un mois : environ", "30", "jours", 3], ["Une chanson :", "3", "min", 3],
    ["Laisser lever la pâte à pain :", "2", "h", 3],
    // Lot A2 ter : La Réunion.
    // (Lot R1-refonte : « Manger un samoussa : 2 min » retiré, Gwenaël, 18/11.)
    ["Prendre une douche : environ", "5", "min", 1], ["Faire cuire un cari : environ", "1", "h", 2],
    ["Le trajet en Car Jaune de Saint-Pierre à Saint-Denis : environ", "2", "h", 2], ["La marche jusqu'au Trou de Fer : environ", "2", "h", 3],
    ["Le Grand Raid, pour les derniers coureurs : environ", "3", "jours", 3]
  ];
  const CHOIX_UNITE = {longueur: ["mm", "cm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"]};

  function questionGrandeur(degre, rng) {
    const vivier = SITUATIONS.map((o, i) => [o, i]).filter(([o]) => o[2] === degre);
    const [[phrase, grandeur], i] = choisir(rng, vivier);
    const texte = CARTE.typo(phrase);
    const bon = GRANDEURS_CLES.indexOf(grandeur);
    return q({
      code: "R2", degre, forme: "qcm", texte: CARTE.typo(`${phrase} Qu'est-ce que je mesure ?`),
      morceaux: {phrase: texte, sorte: "grandeur", consigne: CARTE.typo("Qu'est-ce que je mesure ?")},
      choix: GRANDEURS_CHOIX.slice(), bon, reponse: GRANDEURS_CHOIX[bon], reponseTexte: GRANDEURS_CHOIX[bon],
      unite: null, resume: CARTE.typo(`${phrase.replace(/\.$/, "")} : ${GRANDEURS_CHOIX[bon]}.`), outil: "grandeurs", grandeur,
      correction: [CARTE.typo(`Je mesure ${GRANDEURS_CHOIX[bon]}.`)],
      donnees: {type: "grandeur", situation: i, grandeur},
      cle: `R2:g:${i}`
    });
  }
  function questionUniteDuree(degre, rng) {
    const vivier = DUREES_UNITE.map((o, i) => [o, i]).filter(([o]) => o[3] === degre);
    const [[debut, nombre, unite], i] = choisir(rng, vivier);
    const texte = CARTE.typo(`${debut} ${nombre} ${CASE}`);
    return q({
      code: "R2", degre, forme: "qcm", texte, morceaux: {phrase: texte, apres: "", sorte: "unite"},
      choix: DUREES_CHOIX.slice(), bon: DUREES_CHOIX.indexOf(unite), reponse: unite, reponseTexte: CARTE.typo(`${nombre} ${unite}`), unite,
      resume: CARTE.typo(`${debut} ${nombre} ${unite}`), outil: "reperes-unites", grandeur: "duree",
      correction: [CARTE.typo(`${debut} ${nombre} ${unite}`)],
      donnees: {type: "unite-duree", objet: i, unite},
      cle: `R2:d:${i}`
    });
  }

  // Les repères de « Mes premiers repères », du plus petit au plus grand,
  // pour les corrections (lot R1-refonte).
  const NOMS_COMPARER = {l1: "la plus petite graduation", l10: "mon petit doigt", l15: "ma main", l13: "la poignée de porte",
    l14: "10 terrains de foot", m7: "un trombone", m4: "un paquet de riz", m6: "une petite voiture", c2: "une canette", c3: "une brique de lait"};
  const MOTS_COMPARER = {longueur: ["Plus que", "moins que", "À peu près comme"], masse: ["Plus lourd que", "plus léger que", "À peu près comme"],
    contenance: ["Plus que", "moins que", "À peu près comme"]};
  function que(mot, nom) {
    return /^[aeiouéèh]/i.test(nom) ? `${mot.slice(0, -1)}'${nom}` : `${mot} ${nom}`;
  }
  // « Plus lourd qu'un trombone, plus léger qu'un paquet de riz. » : la
  // mesure placée entre les repères de sa grandeur (« Comme… » quand elle
  // en est proche, moins de 1,5 fois plus ou moins).
  function entreReperes(v, unite) {
    const g = grandeurDe(unite);
    if (!MOTS_COMPARER[g]) return null;
    const x = convertir(v, unite, ORDRE_UNITES_2[g][0]);
    const reps = CARTE.etape("R1").reperes.map(c => CARTE.repere(c)).filter(r => r.grandeur === g)
      .sort((a, b) => (taille2(a) < taille2(b) ? -1 : 1));
    const [plus, moins, comme] = MOTS_COMPARER[g];
    const proche = reps.find(r => 2n * x <= 3n * taille2(r) && 2n * taille2(r) <= 3n * x);
    if (proche) return `${comme} ${NOMS_COMPARER[proche.code]}.`;
    const dessous = reps.filter(r => taille2(r) < x).pop();
    const dessus = reps.find(r => taille2(r) > x);
    const morceaux = [];
    if (dessous) morceaux.push(que(plus, NOMS_COMPARER[dessous.code]));
    if (dessus) morceaux.push(que(dessous ? moins : `${moins[0].toUpperCase()}${moins.slice(1)}`, NOMS_COMPARER[dessus.code]));
    return morceaux.length ? `${morceaux.join(", ")}.` : null;
  }
  const NOM_GRANDEUR = {longueur: "une longueur", masse: "une masse", contenance: "une contenance", duree: "une durée"};
  // Une unité de chacune des deux autres grandeurs (travail 1).
  const AUTRES_FAMILLES = {longueur: [["g", "kg"], ["cL", "L"]], masse: [["cm", "m"], ["cL", "L"]], contenance: [["g", "kg"], ["cm", "m"]]};
  function deuxAutres(g, rng) {
    return AUTRES_FAMILLES[g].map(f => choisir(rng, f));
  }

  // Travail 1 : « Quelle unité pour peser une pomme ? » (g, cm, cL) — il
  // suffit de reconnaître la grandeur. (Lot 3b : la question de
  // l'exerciseur, sans nombre ; lot R1-refonte : les deux autres réponses
  // sont d'autres grandeurs, plus une unité de la même grandeur au mauvais
  // ordre de grandeur : c'est le travail 2.)
  function questionSansNombre(degre, rng) {
    const vivier = SANS_NOMBRE.map((o, i) => [o, i]).filter(([o]) => o[3] <= Math.max(1, degre));
    const [[quoi, unite], i] = choisir(rng, vivier);
    const g = grandeurDe(unite);
    const choix = melanger(rng, [unite, ...deuxAutres(g, rng)]);
    const phrase = CARTE.typo(`Quelle unité pour ${quoi} ?`);
    const resume = CARTE.typo(`Pour ${quoi} : ${NOM_UNITE[unite]}.`);
    return q({
      code: "R2", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "sansNombre"},
      choix, bon: choix.indexOf(unite), reponse: unite, reponseTexte: unite, unite,
      resume, outil: "familles", grandeur: g, travail: 1,
      correction: [CARTE.typo(`${NOM_UNITE[unite][0].toUpperCase()}${NOM_UNITE[unite].slice(1)} : je mesure ${NOM_GRANDEUR[g]}.`)],
      donnees: {type: "unite-sans", objet: i, unite},
      cle: `R2:s:${i}`
    });
  }

  // Un objet de OBJETS_UNITE, aux trois travaux (même objet, même
  // `cleBase` : il ne revient pas dans une série sous une autre forme).
  function vivierObjets(degre, max = false) {
    return OBJETS_UNITE.map((o, i) => [o, i]).filter(([o]) => (max ? o[3] >= 1 && o[3] <= degre : o[3] === degre));
  }
  function questionObjet(degre, rng, travail) {
    const [[debut, nombre, unite], i] = choisir(rng, vivierObjets(degre, travail === 3));
    const v = milli(nombre);
    const g = grandeurDe(unite);
    const compare = entreReperes(v, unite);
    let choix;
    let bon;
    let texte;
    let sorte = "unite";
    let apres = "";
    if (travail === 3) {
      // Le nombre : la bonne mesure, et deux autres 10 ou 100 fois plus
      // grandes ou plus petites (des nombres entiers jusqu'à 10 000, comme
      // au CE2), une plus grande et une plus petite quand c'est possible.
      const propres = [[v * 10n, 1], [v * 100n, 1], [v / 10n, -1], [v / 100n, -1]]
        .filter(([c], k) => (k < 2 || v % (k === 2 ? 10n : 100n) === 0n) && c >= MILLE && c <= 10000n * MILLE && c % MILLE === 0n);
      const grands = propres.filter(([, s]) => s > 0).map(([c]) => c);
      const petits = propres.filter(([, s]) => s < 0).map(([c]) => c);
      const deux = grands.length && petits.length ? [choisir(rng, grands), choisir(rng, petits)] : melanger(rng, grands.concat(petits)).slice(0, 2);
      if (deux.length < 2) return null;
      choix = melanger(rng, [v, ...deux]).map(ecrire);
      bon = choix.indexOf(ecrire(v));
      texte = CARTE.typo(`${debut} ${CASE}${NB}${unite}`);
      sorte = "valeur";
      apres = unite;
    } else {
      const memes = CHOIX_UNITE[g];
      choix = melanger(rng, travail === 1 ? [unite, ...deuxAutres(g, rng)] : memes.slice());
      bon = choix.indexOf(unite);
      // (Le nombre et la case ne se séparent pas en fin de ligne.)
      texte = CARTE.typo(`${debut} ${ecrire(v)}${NB}${CASE}`);
    }
    const reponseTexte = mes(v, unite);
    const correction = [CARTE.typo(`${debut} ${reponseTexte}`)];
    if (travail === 1) correction.push(CARTE.typo(`Je mesure ${NOM_GRANDEUR[g]}.`));
    else if (compare) correction.push(CARTE.typo(compare));
    return q({
      code: "R2", degre, forme: "qcm", texte, morceaux: {phrase: texte, apres, sorte},
      choix, bon, reponse: choix[bon], reponseTexte, unite,
      resume: CARTE.typo(`${debut} ${reponseTexte}`), outil: travail === 1 ? "familles" : "reperes-unites", grandeur: g, travail,
      correction,
      donnees: {type: travail === 3 ? "nombre" : travail === 1 ? "unite-grandeur" : "unite", objet: i, unite},
      cle: `R2:${travail === 3 ? "n" : travail === 1 ? "u" : ""}${i}`, cleBase: `R2:${i}`
    });
  }

  ETAPES.R2 = {
    // Lot R1-refonte : les trois travaux. Je valide : le travail 1 aux
    // places 1 à 3, le 2 aux places 4 à 7 (dont h, min ou jours), le 3 aux
    // places 8 à 10 (aux places 3, 6, 9 viennent les étapes d'avant). À
    // toi : du plus facile au plus dur dès les 9 premières questions (un
    // élève qui réussit s'arrête vers la 9e), puis un mélange.
    formes(usage) {
      if (usage === "valide") return {0: "grandeur", 1: "uniteG", 2: "sans", 3: "duree", 4: "unite", 5: "unite", 6: "unite", 7: "nombre", 8: "nombre", 9: "nombre"};
      if (usage === "entraine") {
        return {0: "grandeur", 1: "uniteG", 2: "sans", 3: "unite", 4: "unite", 5: "duree", 6: "nombre", 7: "unite", 8: "nombre",
          9: "grandeur", 10: "unite", 11: "nombre", 12: "uniteG", 13: "duree", 14: "nombre", 15: "unite", 16: "nombre", 17: "sans",
          18: "nombre", 19: "unite", 20: "duree", 21: "nombre", 22: "unite", 23: "grandeur", 24: "nombre"};
      }
      return {};
    },
    tirer(rng, degre, place, usage, forme) {
      let f = forme;
      if (!f) {
        // (Les autres usages : le travail du degré.)
        const r = rng();
        f = degre === 1 ? (r < 0.4 ? "grandeur" : r < 0.7 ? "uniteG" : "sans") : degre === 2 ? (r < 0.25 ? "duree" : "unite") : (r < 0.6 ? "nombre" : "unite");
      }
      if (f === "grandeur") return questionGrandeur(degre, rng);
      if (f === "duree") return questionUniteDuree(degre, rng);
      if (f === "sans") return questionSansNombre(degre, rng);
      if (f === "uniteG") return questionObjet(degre, rng, 1);
      if (f === "nombre") return questionObjet(degre, rng, 3);
      return questionObjet(degre, rng, 2);
    },
    // Les exemples de On te montre : la récréation (travail 1), le crayon
    // (travail 2), la porte (travail 3).
    clesExemples: ["R2:0", "R2:1", "R2:d:0"]
  };

  // --------------------------------------------- P1 · Les relations des bases
  const RELATIONS_BASES = [["m", "dm"], ["m", "cm"], ["m", "mm"], ["dm", "cm"], ["cm", "mm"], ["km", "m"], ["kg", "g"], ["t", "kg"],
    ["L", "dL"], ["L", "cL"]];
  // Ce que dit le nom de l'unité (l'image de « À toi »).
  function sensDuPrefixe(grande, petite) {
    const dit = {
      "m-dm": "déci veut dire dixième : 1 dm est le dixième de 1 m.",
      "m-cm": "centi veut dire centième : 1 cm est le centième de 1 m.",
      "m-mm": "milli veut dire millième : 1 mm est le millième de 1 m.",
      "dm-cm": "1 dm est le dixième de 1 m ; 1 cm en est le centième.",
      "cm-mm": "Sur la règle, 1 cm est partagé en petits traits de 1 mm.",
      "km-m": "kilo veut dire mille : 1 kilomètre = mille mètres.",
      "kg-g": "kilo veut dire mille : 1 kilogramme = mille grammes.",
      "t-kg": "Une tonne, c'est la masse d'une voiture : mille kilogrammes.",
      "L-dL": "déci veut dire dixième : 1 dL est le dixième de 1 L.",
      "L-cL": "centi veut dire centième : 1 cL est le centième de 1 L."
    };
    return CARTE.typo(dit[`${grande}-${petite}`]);
  }

  // « 1 m, c'est combien de fois 1 cm ? » (lot 3b ; évaluation de début de
  // 6e : 40 % d'échec, 24 % répondent « 100 fois » pour 1 m et 1 dm). Les
  // trois réponses : 10, 100, 1 000 fois.
  function questionFois(degre, g, p) {
    const f = facteur(g, p);
    const choix = ["10 fois", "100 fois", `1${FINE}000 fois`];
    const bon = f === 10n ? 0 : f === 100n ? 1 : 2;
    const phrase = CARTE.typo(`1 ${g}, c'est combien de fois 1 ${p} ?`);
    return q({
      code: "P1", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "fois"},
      // (Le résumé finit par la réponse : la correction l'écrit en une
      // ligne, sous le glisse-unité, comme pour « 1 m = … cm ».)
      choix, bon, reponse: choix[bon], reponseTexte: CARTE.typo(`${choix[bon]} 1 ${p}`), unite: null,
      resume: CARTE.typo(`1 ${g} = ${choix[bon]} 1 ${p}`),
      relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(MILLE, g, p), outilSansRelation: true,
      image: [sensDuPrefixe(g, p)],
      correction: [relationTexte(g, p), CARTE.typo(`Il faut ${choix[bon]} 1 ${p} pour faire 1 ${g}.`)],
      grandeur: grandeurDe(g), relationCle: `${g}-${p}`,
      donnees: {type: "fois", grande: g, petite: p},
      cle: `P1:${g}-${p}:f`
    });
  }
  // Relier trois relations (lot 3b ; « associer deux relations », carte
  // v4). Degré 2 : trois grandeurs ; degré 3 : trois longueurs.
  function questionRelierRelations(degre, rng) {
    for (let essai = 0; essai < 60; essai += 1) {
      const vivier = degre === 3 ? RELATIONS_BASES.filter(([g]) => grandeurDe(g) === "longueur") : RELATIONS_BASES;
      const trois = melanger(rng, vivier).slice(0, 3);
      const gauches = trois.map(([g]) => `1${NB}${g}`);
      const droites = trois.map(([g, p]) => mes(facteur(g, p) * MILLE, p));
      const grandeurs = new Set(trois.map(([g]) => grandeurDe(g)));
      if (new Set(gauches).size < 3 || new Set(droites).size < 3 || (degre !== 3 && grandeurs.size < 3)) continue;
      let ordre = melanger(rng, [0, 1, 2]);
      while (ordre.every((k, j) => k === j)) ordre = melanger(rng, [0, 1, 2]);
      const mesures = ordre.map(k => droites[k]);
      const bonnes = trois.map((x, k) => ordre.indexOf(k));
      const consigne = "Relie chaque unité à sa valeur.";
      const lignes = trois.map(([g, p]) => relationTexte(g, p));
      // L'image : ce que veulent dire les préfixes de la question (le sens
      // du mot, comme l'image des autres questions de l'étape).
      const SENS = {k: "kilo : mille", d: "déci : un dixième", c: "centi : un centième", m: "milli : un millième"};
      const prefixes = [...new Set(trois.flatMap(([g, p]) => [g, p]).filter(u => u.length === 2 && SENS[u[0]]).map(u => u[0]))];
      return q({
        code: "P1", degre, forme: "associer", texte: `${consigne} ${gauches.join(" ; ")} — ${mesures.join(" ; ")}`,
        morceaux: {phrase: consigne}, objets: gauches.map(t => ({texte: t})), mesures, bonnes,
        reponse: bonnes.join(","), reponseTexte: lignes.join(" ; "), resume: lignes.join(" ; "),
        // (Pas de glisse-unité : trois relations à la fois ; l'outil est le
        // sens des préfixes, et la correction tient en trois lignes.)
        relation: lignes.join(" ; "), outil: null, outilSansRelation: true, relationCle: "relier",
        image: [CARTE.typo(prefixes.map(x => SENS[x]).join(" ; "))],
        correction: lignes, grandeur: grandeurs.size === 1 ? [...grandeurs][0] : null,
        donnees: {type: "associer-rel", paires: trois.map(x => x.slice()), mesures: mesures.slice()},
        cle: `P1:a:${trois.map(([g, p]) => `${g}-${p}`).sort().join("+")}`
      });
    }
    return null;
  }

  ETAPES.P1 = {
    exclureExemples: false,
    // 20 faits à savoir par cœur (carte v4, lot 3b) : on varie la façon de
    // demander, pas les faits — le calcul (« 1 m = … cm »), la phrase
    // (« Combien de cm dans 1 m ? »), « combien de fois ? », relier. Une
    // même question est un fait ET sa forme : « 1 m = … cm » et « Combien
    // de cm dans 1 m ? » sont deux questions (une série n'en pose qu'une).
    // Les deux sens à chaque degré (avant, Je valide finissait par trois
    // réponses « 1 ») :
    //   d1 : vers la petite unité × 10 ou × 100, ou vers la grande × 10 ;
    //   d2 : × 1 000 vers la petite, ou × 10, × 100 vers la grande ;
    //   d3 : × 100 ou × 1 000 vers la grande, ou « combien de fois ? ».
    tirer(rng, degre, i, usage, forme) {
      if (forme === "associer") return questionRelierRelations(degre, rng);
      const vivier = [];
      RELATIONS_BASES.forEach(([g, p]) => {
        const f = facteur(g, p);
        if (degre === 1 && f <= 100n) vivier.push([g, p, "bas"]);
        if (degre === 1 && f === 10n) vivier.push([g, p, "haut"]);
        if (degre === 2 && f === 1000n) vivier.push([g, p, "bas"]);
        if (degre === 2 && f <= 100n) vivier.push([g, p, "haut"]);
        if (degre === 3 && f >= 100n) vivier.push([g, p, "haut"]);
      });
      const fois = forme === "fois" || (!forme && degre > 1 && rng() < 0.25);
      if (fois) {
        const [g, p] = choisir(rng, RELATIONS_BASES);
        return questionFois(degre, g, p);
      }
      const [g, p, sens] = choisir(rng, vivier);
      const ecrit = forme === "phrase" || forme === "nombre" ? forme : choisir(rng, ["nombre", "nombre", "phrase"]);
      const [valeur, de, vers] = sens === "bas" ? [MILLE, g, p] : [facteur(g, p) * MILLE, p, g];
      return questionConversion("P1", degre, ecrit, valeur, de, vers, {
        // L'outil ne recopie pas la relation au-dessus du glisse-unité :
        // dans cette étape, elle EST la réponse (audit du 12/11).
        relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, de, vers), outilSansRelation: true,
        image: [sensDuPrefixe(g, p)],
        correction: sens === "bas" ? [relationTexte(g, p)] : [relationTexte(g, p), `donc ${mes(valeur, de)} = ${mes(MILLE, g)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`,
        cle: `P1:${brut(valeur)}${de}>${vers}:${ecrit === "phrase" ? "p" : "n"}`
      });
    },
    // Je valide : une phrase en 3e et en 7e, « combien de fois ? » en 5e et
    // en 9e, relier en dernier ; À toi : relier deux fois.
    formes(usage) {
      if (usage === "valide") return {2: "phrase", 4: "fois", 6: "phrase", 8: "fois", 9: "associer"};
      if (usage === "entraine") return {12: "associer", 21: "associer"};
      return {};
    },
    erreurs(question, lu) {
      const d = question.donnees;
      const attendu = milli(question.reponse);
      const v = milli(d.valeur);
      if (exposant(d.de) > exposant(d.vers)) {
        if (lu * 10n === attendu || lu === attendu * 10n) return {erreur: 1, retour: `Un zéro de trop ou de moins : ${question.relation}.`};
      } else if (lu === v * facteur(d.vers, d.de) || lu === v) {
        return {erreur: 3, retour: `${mes(v, d.de)}, c'est ${mes(attendu, d.vers)} : une unité plus grande, il en faut moins.`};
      }
      return null;
    }
  };

  // -------------------------------------------- C1 · Vers une unité plus petite
  const C1_RELATIONS = {
    1: [["m", "dm"], ["m", "cm"], ["dm", "cm"], ["cm", "mm"], ["L", "dL"], ["L", "cL"]],
    "2a": [["m", "mm"], ["km", "m"], ["kg", "g"], ["t", "kg"]],
    "2b": [["m", "dm"], ["dm", "cm"], ["cm", "mm"], ["L", "dL"]],
    3: [["m", "cm"], ["L", "cL"], ["m", "mm"], ["km", "m"], ["kg", "g"], ["t", "kg"]]
  };
  // Le nombre d'une conversion de degré 3. Au CE2, les nombres vont
  // jusqu'à 10 000 (programme de cycle 2, BO n° 41 du 31/10/2024) : × 100
  // avec un nombre de deux chiffres (19 L = 1 900 cL), × 1 000 avec un
  // nombre de 2 à 10 (7 kg = 7 000 g). Avant l'audit du 12/11, « 66 m =
  // 66 000 mm » sortait du programme (18 % des questions).
  function nombreDegre3(rng, [g, p]) {
    return facteur(g, p) >= 1000n ? entre(rng, 2, 10) : entre(rng, 10, 99);
  }

  // Les mesures à deux unités, en nombres entiers (BO de CE2 : « 2 m + 15 cm »,
  // « 5 km + 750 m »).
  // Lot 3b (carte v4, programme de CE2 et recherche) : « 2 dm + 15 cm »,
  // « 3 cm + 8 mm » ; et le zéro de position : « 3 km + 45 m = 3 045 m »
  // (le piège : 345 m ou 3 450 m), une fois sur trois avec le kilo.
  const SOMMES = [["m", "cm"], ["km", "m"], ["kg", "g"], ["t", "kg"], ["L", "cL"], ["dm", "cm"], ["cm", "mm"]];

  function questionSomme(code, degre, rng) {
    const [g, p] = choisir(rng, SOMMES);
    const f = facteur(g, p);
    const a = entre(rng, 1, 9);
    const b = f === 100n ? entre(rng, 2, 99) : f === 10n ? entre(rng, 1, 19)
      : rng() < 0.3 ? entre(rng, 10, 99) : entre(rng, 2, 99) * 10 + (rng() < 0.5 ? 0 : entre(rng, 1, 9));
    const A = milli(a);
    const B = milli(b);
    const rep = A * f + B;
    const gauche = `${mes(A, g)} + ${mes(B, p)}`;
    return q({
      code, degre, forme: "phrase", texte: `${gauche} = ${CASE}${NB}${p}`,
      morceaux: {phrase: `${gauche} =`, apres: p},
      reponse: brut(rep), reponseTexte: mes(rep, p), unite: p, resume: `${gauche} = ${mes(rep, p)}`,
      relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(A, g, p), plus: mes(B, p),
      image: [`${relationTexte(g, p)}, donc ${mes(A, g)} = ${mes(A * f, p)}`, `${gauche} = ${mes(A * f, p)} + ${mes(B, p)}`],
      correction: [`${mes(A, g)} = ${mes(A * f, p)}`, `${mes(A * f, p)} + ${mes(B, p)} = ${mes(rep, p)}`],
      grandeur: grandeurDe(g), relationCle: `${g}-${p}`, somme: true,
      donnees: {type: "somme", a: String(a), ua: g, b: String(b), ub: p, vers: p},
      cle: `${code}:${a}${g}+${b}${p}`
    });
  }

  function contraintesConvertir(serie, question, usage) {
    if (usage !== "valide") return true;
    const meme = serie.filter(x => x.relationCle === question.relationCle).length;
    if (meme >= 2) return false;
    // Deux questions ne partent pas du même nombre (une question à ranger ou
    // à deux cases a sa clé pour départ).
    const depart = x => (x.donnees.type === "conv" ? x.donnees.valeur : x.donnees.a || x.cle);
    return !serie.some(x => depart(x) === depart(question));
  }
  function serieConvertirBonne(serie, usage) {
    if (usage !== "valide") return true;
    const n = gr => serie.filter(x => x.grandeur === gr).length;
    return n("longueur") >= 1 && n("masse") >= 2 && n("contenance") >= 2;
  }

  // Les écritures d'une conversion dans une série (audit du 12/11) :
  // Je valide : une phrase (place 3) et un objet (place 7) ; À toi : une
  // question sur quatre en phrase, une sur quatre avec un objet ;
  // l'échauffement : l'une des trois, au hasard.
  function formesConvertir(usage, rng) {
    if (usage === "valide") return {2: "phrase", 6: "objet"};
    if (usage === "entraine") {
      const f = {};
      for (let i = 0; i < 25; i += 1) {
        const r = rng();
        if (r < 0.25) f[i] = "phrase";
        else if (r < 0.5) f[i] = "objet";
      }
      return f;
    }
    if (usage === "echauffement") return {0: choisir(rng, ["nombre", "phrase", "objet"])};
    // Lot 3a : un retour (« Je me souviens », « Avant de partir ») : deux
    // écritures différentes, au hasard.
    if (usage === "retour") {
      const a = choisir(rng, ["nombre", "phrase", "objet"]);
      return {0: a, 1: choisir(rng, ["nombre", "phrase", "objet"].filter(f => f !== a))};
    }
    return {};
  }

  // Lot 3b (carte v4 : « les mauvaises réponses des vraies erreurs ») : la
  // même conversion, avec trois réponses au choix. Les deux fausses sont les
  // erreurs connues, dans cet ordre : vers la petite unité, × 1 000 au lieu
  // de × 100 pour le litre (1 L = 1 000 cL), un zéro de trop ou de moins
  // (le « centi » pas lu), diviser au lieu de multiplier, garder le nombre ;
  // vers la grande, un zéro de trop ou de moins, multiplier au lieu de
  // diviser, garder le nombre (évaluations de 6e et de 4e, S434).
  function enChoix(x, rng) {
    if (!x || x.donnees.type !== "conv") return null;
    const d = x.donnees;
    const v = milli(d.valeur);
    const rep = milli(x.reponse);
    const petite = exposant(d.de) > exposant(d.vers);
    const f = petite ? facteur(d.de, d.vers) : facteur(d.vers, d.de);
    const faux = petite ? [d.de === "L" && d.vers === "cL" ? v * 1000n : null, rep * 10n, rep / 10n, v % f === 0n ? v / f : null, v]
      : [rep * 10n, rep % 10n === 0n ? rep / 10n : null, v * f, v];
    const propres = [];
    faux.forEach(y => {
      if (y !== null && y !== rep && y >= MILLE && y % MILLE === 0n && y <= 10000n * MILLE && !propres.includes(y)) propres.push(y);
    });
    if (propres.length < 2) return null;
    const deux = [propres[0], choisir(rng, propres.slice(1))];
    const choix = melanger(rng, [rep, ...deux]).map(ecrire);
    const phrase = `${mes(v, d.de)} = ${CASE}${NB}${d.vers}`;
    return Object.assign(x, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: d.vers, sorte: "valeur"},
      choix, bon: choix.indexOf(ecrire(rep)), cle: `${x.cle}:q`
    });
  }
  // Je valide de C1 : une phrase en 3e, trois réponses au choix en 5e, un
  // objet en 7e ; À toi : trois fois au choix.
  function formesC1(usage, rng) {
    const f = formesConvertir(usage, rng);
    if (usage === "valide") f[4] = "choix";
    if (usage === "entraine") [4, 11, 22].forEach(i => { f[i] = "choix"; });
    return f;
  }

  ETAPES.C1 = {
    clesExemples: ["C1:3m>cm", "C1:4kg>g", "C1:5L>cL"],
    tirer(rng, degre, i, usage, forme) {
      if (degre === 3 && forme !== "choix" && (usage === "valide" ? i === 9 : rng() < 0.25)) return questionSomme("C1", 3, rng);
      let rel;
      let v;
      if (degre === 1) { rel = choisir(rng, C1_RELATIONS[1]); v = entre(rng, 1, 9); }
      else if (degre === 2) {
        if (rng() < 0.5) { rel = choisir(rng, C1_RELATIONS["2a"]); v = entre(rng, 1, 9); }
        else { rel = choisir(rng, C1_RELATIONS["2b"]); v = entre(rng, 10, 99); }
      } else { rel = choisir(rng, C1_RELATIONS[3]); v = nombreDegre3(rng, rel); }
      const [g, p] = rel;
      const valeur = milli(v);
      const rep = convertir(valeur, g, p);
      const x = questionConversion("C1", degre, "nombre", valeur, g, p, {
        relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, g, p),
        // L'image dessinée (audit du 12/11) : v paquets « 1 m » de 100 cm,
        // tant qu'on peut les compter d'un coup d'œil (9 au plus).
        paquets: v <= 9 ? {n: v, dans: `1${NB}${g}`, sous: mes(facteur(g, p) * MILLE, p)} : null,
        image: [relationTexte(g, p), `donc ${mes(valeur, g)} = ${ecrire(valeur)} × ${mes(facteur(g, p) * MILLE, p)}`],
        correction: [relationTexte(g, p), `donc ${mes(valeur, g)} = ${ecrire(valeur)} × ${mes(facteur(g, p) * MILLE, p)} = ${mes(rep, p)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`
      });
      return forme === "choix" ? enChoix(x, rng) : x;
    },
    formes: formesC1,
    accepte: contraintesConvertir,
    valide: serieConvertirBonne,
    erreurs(question, lu) {
      const d = question.donnees;
      const attendu = milli(question.reponse);
      if (d.type === "somme") {
        const a = milli(d.a);
        const b = milli(d.b);
        if (lu === a + b) return {erreur: 5, retour: `Avant d'ajouter, j'écris tout en ${d.vers} : ${mes(a, d.ua)} = ${mes(convertir(a, d.ua, d.vers), d.vers)}.`};
        const colle = lireMilli(`${d.a}${d.b}`);
        if (lu === colle && colle !== attendu) return {erreur: 6, retour: `${mes(a, d.ua)} = ${mes(convertir(a, d.ua, d.vers), d.vers)}, donc ${mes(a, d.ua)} + ${mes(b, d.vers)} = ${mes(attendu, d.vers)}.`};
        // Lot 3b : le zéro de position (3 km + 45 m lu 3 450 m).
        if (b < 100n * MILLE && convertir(a, d.ua, d.vers) + b * 10n === lu) return {erreur: 7, retour: `${mes(b, d.vers)}, ce n'est pas ${mes(b * 10n, d.vers)} : ${mes(convertir(a, d.ua, d.vers), d.vers)} + ${mes(b, d.vers)} = ${mes(attendu, d.vers)}.`};
        return null;
      }
      const v = milli(d.valeur);
      const f = facteur(d.de, d.vers);
      if (d.de === "L" && d.vers === "cL" && lu === v * 1000n) return {erreur: 4, retour: `1${NB}L = 100${NB}cL (et 1${FINE}000${NB}mL).`};
      if (v % f === 0n && lu === v / f) return {erreur: 1, retour: "Tu as divisé. Vers une unité plus petite, je multiplie."};
      if (lu === attendu * 10n || lu * 10n === attendu) {
        const faux = lu * MILLE / v;
        return {erreur: 2, retour: `Un zéro de trop ou de moins : ${question.relation}, pas ${mes(faux, d.vers)}.`};
      }
      if (lu === v) return {erreur: 3, retour: `Tu as gardé le nombre : ${mes(v, d.de)}, ce n'est pas ${mes(v, d.vers)}.`};
      return null;
    }
  };

  // -------------------------------------------- C2 · Vers une unité plus grande
  const DEUX_CASES = [["L", "cL"], ["kg", "g"], ["m", "cm"], ["km", "m"], ["t", "kg"]];

  function questionDeuxCases(code, degre, rng) {
    const [g, p] = choisir(rng, DEUX_CASES);
    const f = facteur(g, p);
    const a = entre(rng, 1, 9);
    // Lot 3b : « 2 070 g = 2 kg 70 g » (le piège : 2 kg 7 g), une fois sur
    // trois avec le kilo.
    const b = f === 100n ? entre(rng, 1, 99) : rng() < 0.3 ? entre(rng, 1, 9) * 10 : entre(rng, 1, 999);
    const valeur = milli(a) * f + milli(b);
    const gauche = mes(valeur, p);
    return q({
      code, degre, forme: "deux-cases", texte: `${gauche} = ${CASE}${NB}${g} ${CASE}${NB}${p}`,
      morceaux: {avant: `${gauche} =`, cases: [g, p]},
      reponse: [String(a), String(b)], reponseTexte: `${mes(milli(a), g)} ${mes(milli(b), p)}`, unite: p,
      resume: `${gauche} = ${mes(milli(a), g)} ${mes(milli(b), p)}`,
      relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, p, g),
      image: [relationTexte(g, p), `${gauche} = ${mes(milli(a) * f, p)} + ${mes(milli(b), p)}`],
      correction: [relationTexte(g, p), `${gauche} = ${mes(milli(a) * f, p)} + ${mes(milli(b), p)} = ${mes(milli(a), g)} ${mes(milli(b), p)}`],
      grandeur: grandeurDe(g), relationCle: `${g}-${p}`, deux: true,
      donnees: {type: "deux", valeur: brut(valeur), de: p, grande: g, petite: p},
      cle: `${code}:${brut(valeur)}${p}>${g}+${p}`
    });
  }

  // « Ranger » (lot A2 bis ; programme de CE1 et CE2 : ordonner 3 ou 4
  // mesures ; les séries de niveau 1 de l'exerciseur) : 4 mesures à toucher
  // de la plus petite à la plus grande. Degré 1 : le même nombre, quatre
  // unités (5 mm, 5 cm, 5 m, 5 km ; aussi une fois sur trois au degré 2) ;
  // degré 2 : deux unités (2 kg, 1 500 g…) ;
  // degré 3 : deux unités, des mesures proches (190 cm, 2 m, 210 cm, 3 m).
  // Jamais deux mesures égales ; jamais déjà rangées.
  const PAIRES_RANGER = {2: [["kg", "g"], ["L", "cL"], ["m", "cm"], ["km", "m"]], 3: [["m", "cm"], ["kg", "g"], ["L", "cL"], ["km", "m"], ["cm", "mm"]]};
  function questionRanger(code, degre, rng) {
    for (let essai = 0; essai < 200; essai += 1) {
      let liste;
      let paire = null;
      const memeNombre = degre === 1 || (degre === 2 && rng() < 0.3);
      if (memeNombre) {
        const n = milli(entre(rng, 2, 9));
        liste = ["mm", "cm", "m", "km"].map(u => [n, u]);
      } else {
        paire = choisir(rng, PAIRES_RANGER[degre]);
        const [g, p] = paire;
        const f = facteur(g, p);
        const pas = f >= 1000n ? 100 : f === 100n ? 10 : 1;
        if (degre === 2) {
          const a = entre(rng, 1, 4);
          const b = a + entre(rng, 1, 2);
          const k1 = entre(rng, 2, Number(f) * 5 / pas - 1);
          const k2 = entre(rng, 2, Number(f) * 5 / pas - 1);
          liste = [[milli(a), g], [milli(b), g], [milli(k1 * pas), p], [milli(k2 * pas), p]];
        } else {
          const a = entre(rng, 1, 4);
          const ecart = () => entre(rng, 1, 9) * pas;
          liste = [[milli(a), g], [milli(a + 1), g], [milli(a) * f + milli(ecart()), p], [milli(a) * f - milli(ecart()), p]];
        }
      }
      const petite = liste.reduce((u, [, x]) => (exposant(x) < exposant(u) ? x : u), liste[0][1]);
      const valeurs = liste.map(([v, u]) => convertir(v, u, petite));
      if (valeurs.some(v => v === null || v <= 0n) || new Set(valeurs.map(String)).size !== 4) continue;
      if (liste.some(([v]) => v > 10000n * MILLE || v % MILLE !== 0n)) continue;
      const affiche = melanger(rng, [0, 1, 2, 3]);
      const vals = affiche.map(k => valeurs[k]);
      const ordre = [0, 1, 2, 3].sort((x, y) => (vals[x] < vals[y] ? -1 : 1));
      if (ordre.every((x, k) => x === k)) continue;
      const mesures = affiche.map(k => mes(liste[k][0], liste[k][1]));
      const rangees = ordre.map(k => mesures[k]);
      const grandeur = grandeurDe(petite);
      // L'image : les mesures de la grande unité écrites dans la petite.
      const ecritures = affiche.map(k => liste[k]).filter(([, u]) => u !== petite)
        .map(([v, u]) => `${mes(v, u)} = ${mes(convertir(v, u, petite), petite)}`);
      const relations = memeNombre ? [relationTexte("cm", "mm"), relationTexte("m", "cm"), relationTexte("km", "m")] : [relationTexte(paire[0], paire[1])];
      const consigne = "Range ces mesures de la plus petite à la plus grande.";
      return q({
        code, degre, forme: "ranger", texte: `${consigne} ${mesures.join(" ; ")}`,
        morceaux: {phrase: consigne, consigne: "Touche-les dans l'ordre : 1, 2, 3, 4."},
        mesures, ordre, reponse: ordre.join(","), reponseTexte: rangees.join(" < "), unite: petite,
        resume: rangees.join(" < "), relation: relations.join(" ; "), relations, outil: "ranger", grandeur, relationCle: `ranger-${grandeur}`,
        image: memeNombre ? relations : ecritures,
        correction: [rangees.join(" < ")].concat(memeNombre ? [] : ecritures.slice(0, 2)),
        donnees: {type: "ranger", mesures: affiche.map(k => [brut(liste[k][0]), liste[k][1]])},
        cle: `${code}:ranger:${rangees.join("<").replace(/[\s\u00a0\u202f]/g, "")}`
      });
    }
    return null;
  }
  // Les écritures d'une série de C2 : celles de C1, et « ranger » (Je
  // valide : la 5e ; À toi : une question sur dix, à partir du degré 2).
  // Lot 3b : trois réponses au choix (les vraies erreurs) en 6e de Je
  // valide, trois fois dans À toi.
  function formesC2(usage, rng) {
    const f = formesConvertir(usage, rng);
    if (usage === "valide") { f[4] = "ranger"; f[5] = "choix"; }
    if (usage === "entraine") {
      [8, 13, 19].forEach(i => { f[i] = "ranger"; });
      [4, 11, 22].forEach(i => { f[i] = "choix"; });
    }
    return f;
  }

  ETAPES.C2 = {
    clesExemples: ["C2:500cm>m", "C2:3000g>kg", "C2:40mm>cm"],
    tirer(rng, degre, i, usage, forme) {
      if (forme === "ranger") return questionRanger("C2", degre, rng);
      if (degre === 3 && forme !== "choix" && (usage === "valide" ? i === 9 : rng() < 0.25)) return questionDeuxCases("C2", 3, rng);
      let rel;
      let r;
      if (degre === 1) { rel = choisir(rng, C1_RELATIONS[1]); r = entre(rng, 1, 9); }
      else if (degre === 2) {
        if (rng() < 0.5) { rel = choisir(rng, C1_RELATIONS["2a"]); r = entre(rng, 1, 9); }
        else { rel = choisir(rng, C1_RELATIONS["2b"]); r = entre(rng, 10, 99); }
      } else { rel = choisir(rng, C1_RELATIONS[3]); r = nombreDegre3(rng, rel); }
      const [g, p] = rel;
      const f = facteur(g, p);
      const valeur = milli(r) * f;
      const x = questionConversion("C2", degre, "nombre", valeur, p, g, {
        relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, p, g),
        // L'image dessinée : r paquets de 100 cm, chacun fait 1 m.
        paquets: r <= 9 ? {n: r, dans: mes(f * MILLE, p), sous: `1${NB}${g}`} : null,
        image: [`${relationTexte(g, p)} : je regroupe ${mes(f * MILLE, p)} en 1${NB}${g}.`, `donc ${mes(valeur, p)} = ${ecrire(valeur)} ÷ ${ecrire(f * MILLE)}${NB}${g}`],
        correction: [relationTexte(g, p), `donc ${mes(valeur, p)} = ${ecrire(valeur)} ÷ ${ecrire(f * MILLE)}${NB}${g} = ${mes(milli(r), g)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`
      });
      return forme === "choix" ? enChoix(x, rng) : x;
    },
    formes: formesC2,
    accepte: contraintesConvertir,
    valide: serieConvertirBonne,
    erreurs(question, lu, cases) {
      const d = question.donnees;
      if (d.type === "deux") {
        // Lot 3b : « 2 070 g = 2 kg 7 g » (le 0 oublié), « 20 kg 70 g ».
        if (!cases) return null;
        const f = facteur(d.grande, d.petite) * MILLE;
        const total = milli(d.valeur);
        const a = total / f;
        const b = total % f;
        if (cases[0] === a * MILLE && b % 10000n === 0n && cases[1] * 10n === b) return {erreur: 4, retour: `Il reste ${mes(b, d.petite)}, pas ${mes(b / 10n, d.petite)} : le zéro compte.`};
        if (cases[0] === a * 10n * MILLE && cases[1] === b) return {erreur: 5, retour: `${relationTexte(d.grande, d.petite)}, donc ${mes(a * f, d.petite)} = ${mes(a, d.grande)}.`};
        return null;
      }
      const v = milli(d.valeur);
      const f = facteur(d.vers, d.de);
      const attendu = milli(question.reponse);
      if (lu === v * f) return {erreur: 1, retour: "Tu as multiplié. Vers une unité plus grande, je divise."};
      if (lu === attendu * 10n || lu * 10n === attendu) return {erreur: 2, retour: `Un zéro de trop ou de moins : ${question.relation}.`};
      if (lu === v) return {erreur: 3, retour: `Tu as gardé le nombre : ${mes(v, d.de)}, ce n'est pas ${mes(v, d.vers)}.`};
      return null;
    }
  };

  // --------------------------------------------------- D1 · Heures et minutes
  function hm(h, m) {
    if (!h) return `${m}${NB}min`;
    return m ? `${h}${NB}h ${m}${NB}min` : `${h}${NB}h`;
  }
  function questionDuree(code, degre, champs) {
    return q(Object.assign({code, degre, outil: "barre-heure", grandeur: "duree"}, champs));
  }
  // « 1 h 20 min = … min »
  function versMinutes(code, degre, h, m, extra = {}) {
    const total = h * 60 + m;
    const gauche = hm(h, m);
    return questionDuree(code, degre, Object.assign({
      forme: "nombre", texte: `${gauche} = ${CASE}${NB}min`, morceaux: {avant: `${gauche} =`, apres: "min"},
      reponse: String(total), reponseTexte: `${total}${NB}min`, unite: "min", resume: `${gauche} = ${total}${NB}min`,
      relation: `1${NB}h = 60${NB}min`, heure: {h, m},
      // Le tableau de l'image (lot A2 bis) : 1 h → 60 min, 2 h → 120 min,
      // 3 h → 180 min ; la ligne qui serait la réponse a un trou.
      tableau: m ? {} : {cacheMin: h},
      image: [`1${NB}h = 60${NB}min`, h > 1 ? `donc ${gauche} = ${h} × 60${NB}min${m ? ` + ${m}${NB}min` : ""}` : `donc ${gauche} = 60${NB}min${m ? ` + ${m}${NB}min` : ""}`],
      correction: [`1${NB}h = 60${NB}min`, `${gauche} = ${Array(h).fill(`60${NB}min`).join(" + ")}${m ? ` + ${m}${NB}min` : ""} = ${total}${NB}min`],
      donnees: {type: "duree", h, m, vers: "min"},
      cle: `${code}:${h}h${m}>min`
    }, extra));
  }
  // « 120 min = … h »
  function versHeures(code, degre, total) {
    const h = total / 60;
    return questionDuree(code, degre, {
      forme: "nombre", texte: `${total}${NB}min = ${CASE}${NB}h`, morceaux: {avant: `${total}${NB}min =`, apres: "h"},
      reponse: String(h), reponseTexte: `${h}${NB}h`, unite: "h", resume: `${total}${NB}min = ${h}${NB}h`,
      relation: `1${NB}h = 60${NB}min`, heure: {h, m: 0, versHeures: true}, tableau: {cacheH: h},
      image: [`1${NB}h = 60${NB}min`, `${total}${NB}min = ${Array(h).fill(`60${NB}min`).join(" + ")}`],
      correction: [`1${NB}h = 60${NB}min`, `${total}${NB}min = ${Array(h).fill(`60${NB}min`).join(" + ")} = ${h}${NB}h`],
      donnees: {type: "duree", h: 0, m: total, vers: "h"},
      cle: `${code}:${total}min>h`
    });
  }
  // « 135 min = … h … min »
  function versHeuresMinutes(code, degre, total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return questionDuree(code, degre, {
      forme: "deux-cases", texte: `${total}${NB}min = ${CASE}${NB}h ${CASE}${NB}min`, morceaux: {avant: `${total}${NB}min =`, cases: ["h", "min"]},
      reponse: [String(h), String(m)], reponseTexte: hm(h, m), unite: "min", resume: `${total}${NB}min = ${h}${NB}h ${m}${NB}min`,
      relation: `1${NB}h = 60${NB}min`, heure: {h, m, versHeures: true}, tableau: {},
      image: [`1${NB}h = 60${NB}min`, `${total}${NB}min = ${Array(h).fill(`60${NB}min`).join(" + ")} + ${m}${NB}min`],
      correction: [`1${NB}h = 60${NB}min`, `${total}${NB}min = ${Array(h).fill(`60${NB}min`).join(" + ")} + ${m}${NB}min = ${h}${NB}h ${m}${NB}min`],
      donnees: {type: "duree-deux", m: total},
      cle: `${code}:${total}min>hmin`
    });
  }
  function erreursDuree(question, lu, cases) {
    const d = question.donnees;
    if (d.type === "duree" && d.vers === "min" && lu === milli(d.h * 100 + d.m)) {
      return {erreur: 1, retour: `1${NB}h, ce n'est pas 100${NB}min : 1${NB}h = 60${NB}min.`};
    }
    if (d.type === "duree-deux" && cases) {
      const h = Math.floor(d.m / 100);
      if (cases[0] === milli(h) && cases[1] === milli(d.m % 100)) {
        return {erreur: 2, retour: `1${NB}h = 60${NB}min, pas 100${NB}min : je compte les paquets de 60${NB}min.`};
      }
    }
    return null;
  }

  // Lot 3b (carte v4 : 45 questions possibles, 69 % déjà vues la veille ;
  // « élargir jusqu'à 3 h 59 min ») :
  //   d1 : 1 h 10 … 1 h 50, 2 h, 3 h → min ; 60, 120, 180 min → h ;
  //   d2 : de 1 h 05 à 3 h 55 (de 5 en 5) → min ;
  //   d3 : de 61 à 239 min → h et min ; de 1 h 01 à 3 h 59 → min.
  function tirerD1(rng, degre, pourChoix) {
    if (degre === 1) {
      const r = rng();
      if (!pourChoix && r < 0.25) return versHeures("D1", 1, choisir(rng, [60, 120, 180]));
      if (r < 0.45) return versMinutes("D1", 1, choisir(rng, [2, 3]), 0);
      return versMinutes("D1", 1, 1, choisir(rng, [10, 20, 30, 40, 50]));
    }
    if (degre === 2) return versMinutes("D1", 2, entre(rng, 1, 3), entre(rng, 1, 11) * 5);
    if (pourChoix || rng() < 0.6) {
      let total;
      do { total = entre(rng, 61, 239); } while (total % 60 === 0);
      return versHeuresMinutes("D1", 3, total);
    }
    return versMinutes("D1", 3, entre(rng, 1, 3), entre(rng, 1, 59));
  }
  // Trois réponses au choix, avec les erreurs de la base 10 (lot 3b ;
  // évaluation de 4e : « 135 min = 1 h 35 min » ; positionnement de 5e :
  // « 150 min = 1 h 50 », « 15 h » ; recherche : « 2 h 15 min = 215 min »,
  // « 75 min »).
  function dureeEnChoix(x, rng) {
    if (!x) return null;
    const d = x.donnees;
    let bonne;
    const faux = [];
    let morceaux;
    if (d.type === "duree-deux") {
      const T = d.m;
      const h = Math.floor(T / 60);
      const m = T % 60;
      bonne = hm(h, m);
      if (T >= 100 && T % 100 < 60) faux.push(hm(Math.floor(T / 100), T % 100));
      if (T % 100 < 60 && T % 100 !== m) faux.push(hm(h, T % 100));
      if (T % 10 === 0 && T / 10 <= 23) faux.push(hm(T / 10, 0));
      faux.push(hm(h + 1, m));
      const phrase = `${T}${NB}min = ${CASE}`;
      morceaux = {phrase, apres: "", sorte: "duree"};
    } else if (d.type === "duree" && d.vers === "min") {
      const total = d.h * 60 + d.m;
      bonne = String(total);
      faux.push(String(d.h * 100 + d.m));
      if (d.h >= 2) faux.push(String(60 + d.m));
      faux.push(String((d.h + 1) * 60 + d.m));
      morceaux = {phrase: x.texte, apres: "min", sorte: "valeur"};
    } else return null;
    const propres = [...new Set(faux)].filter(f => f !== bonne && !/^0/.test(f));
    if (propres.length < 2) return null;
    const choix = melanger(rng, [bonne, propres[0], choisir(rng, propres.slice(1))]);
    return Object.assign(x, {forme: "qcm", texte: morceaux.phrase, morceaux, choix, bon: choix.indexOf(bonne), cle: `${x.cle}:q`});
  }

  ETAPES.D1 = {
    clesExemples: ["D1:1h0>min", "D1:2h0>min", "D1:1h10>min"],
    tirer(rng, degre, i, usage, forme) {
      const x = tirerD1(rng, degre, forme === "choix");
      return forme === "choix" ? dureeEnChoix(x, rng) : x;
    },
    // Lot 3b : trois réponses au choix en 5e et en 9e de Je valide, trois
    // fois dans À toi.
    formes(usage) {
      if (usage === "valide") return {4: "choix", 8: "choix"};
      if (usage === "entraine") return {6: "choix", 14: "choix", 21: "choix"};
      return {};
    },
    erreurs: erreursDuree
  };

  // ------------------------------------- D2 · La demi-heure, le quart d'heure
  // Au palier 1, les fractions de l'heure s'écrivent en mots. `parts` :
  // heures, demi-heures, quarts d'heure (le banc recalcule par là).
  const EN_MOTS = [
    ["une demi-heure", 0, 1, 0, 1], ["un quart d'heure", 0, 0, 1, 1], ["trois quarts d'heure", 0, 0, 3, 1], ["une heure", 1, 0, 0, 1],
    ["une heure et demie", 1, 1, 0, 2], ["une heure et quart", 1, 0, 1, 2], ["deux heures et demie", 2, 1, 0, 2],
    ["deux heures et quart", 2, 0, 1, 2], ["une heure et trois quarts", 1, 0, 3, 2], ["deux quarts d'heure", 0, 0, 2, 2],
    ["deux heures et trois quarts", 2, 0, 3, 3], ["trois heures et demie", 3, 1, 0, 3], ["quatre heures et quart", 4, 0, 1, 3],
    ["trois demi-heures", 0, 3, 0, 3], ["cinq quarts d'heure", 0, 0, 5, 3]
  ];
  const EN_MOTS_DEUX = [
    ["une demi-heure et trois quarts d'heure", 0, 1, 3], ["trois demi-heures", 0, 3, 0], ["cinq quarts d'heure", 0, 0, 5],
    ["trois quarts d'heure et trois quarts d'heure", 0, 0, 6], ["une heure et trois quarts d'heure", 1, 0, 3]
  ];

  // Lot 3b (carte v4 : 20 faits, « par cœur assumé » ; « huit heures
  // moins le quart » ; la mauvaise réponse « un quart d'heure = 25 min ») :
  // trois autres façons de demander les mêmes faits.
  //   heure : l'heure dite en mots, à écrire (« huit heures moins le quart,
  //     c'est … h … min ») ;
  //   quarts : « Combien de quarts d'heure dans une heure et quart ? »
  //     (positionnement de 5e et de 6e) ;
  //   choix : « trois quarts d'heure = … », trois réponses, dont 75 min
  //     (le quart compté 25 min).
  const HEURES_LUES = ["une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze"];
  function heureEnMots(h, m) {
    // h de 1 à 12 ; m : 15, 30 ou 45.
    const nom = k => (k === 12 ? "midi" : `${HEURES_LUES[k - 1]} heure${k > 1 ? "s" : ""}`);
    if (m === 45) return `${nom(h + 1)} moins le quart`;
    if (m === 30) return h === 12 ? "midi et demi" : `${nom(h)} et demie`;
    return `${nom(h)} et quart`;
  }
  function questionHeureMots(degre, rng) {
    const m = degre === 3 ? choisir(rng, [45, 45, 30]) : choisir(rng, [15, 30]);
    const h = m === 45 ? entre(rng, 7, 11) : entre(rng, 7, 12);
    const mots = heureEnMots(h, m);
    const Mots = mots[0].toUpperCase() + mots.slice(1);
    const lignes = m === 45 ? [`moins le quart : 15${NB}min avant l'heure`, `${heureTexte((h + 1) * 60)} − 15${NB}min = ${heureTexte(h * 60 + 45)}`]
      : [m === 30 ? `et demie : 30${NB}min après l'heure` : `et quart : 15${NB}min après l'heure`, `${Mots} = ${heureTexte(h * 60 + m)}`];
    return questionDuree("D2", degre, {
      forme: "deux-cases", texte: `${Mots}, c'est ${CASE}${NB}h ${CASE}${NB}min`, morceaux: {avant: `${Mots}, c'est`, cases: ["h", "min"]},
      reponse: [String(h), String(m)], reponseTexte: heureTexte(h * 60 + m), unite: "min", resume: `${Mots}, c'est ${heureTexte(h * 60 + m)}`,
      // Lot 3b-2 : une horloge, dans l'outil et dans la correction (avant,
      // la barre des quarts d'heure).
      relation: `un quart d'heure = 15${NB}min`, outil: "horloge-quarts",
      image: [lignes[0]], correction: lignes,
      donnees: {type: "heure-mots", h, m},
      cle: `D2:heure:${h}:${m}`
    });
  }
  // Lot 3b-3 : lire l'heure sur l'horloge (programme du CE1-CE2 : lire
  // l'heure, les quarts et la demie ; l'étape la plus pauvre du palier 1,
  // 56 questions). Trois réponses en mots : la bonne et deux erreurs
  // connues — l'heure lue sur la mauvaise heure (la petite aiguille entre
  // deux nombres), « et quart » et « moins le quart » échangés, le quart
  // pris pour la demie. Toutes les heures du cadran.
  function questionLireHeure(degre, rng) {
    const m = degre === 3 ? choisir(rng, [45, 45, 30]) : degre === 2 ? choisir(rng, [15, 30, 45]) : choisir(rng, [15, 30]);
    const h = m === 45 ? entre(rng, 1, 11) : m === 15 ? entre(rng, 2, 12) : entre(rng, 1, 12);
    const bonne = heureEnMots(h, m);
    const faux = m === 15 ? [heureEnMots(h - 1, 45), heureEnMots(h, 30)]
      : m === 30 ? [heureEnMots(h < 12 ? h + 1 : h - 1, 30), heureEnMots(h, 15)]
      : [heureEnMots(h - 1, 45), heureEnMots(h, 15)];
    const choix = melanger(rng, [bonne, ...faux]);
    const grande = {15: ["3", "et quart"], 30: ["6", "et demie"], 45: ["9", "moins le quart"]}[m];
    const petite = m === 45 ? `Petite aiguille presque au ${h + 1} : ${bonne}.` : `Petite aiguille après le ${h} : ${bonne}.`;
    const phrase = CARTE.typo("Quelle heure est-il ?");
    return questionDuree("D2", degre, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "horloge", horloge: {h, m}},
      choix, bon: choix.indexOf(bonne), reponse: bonne, reponseTexte: bonne, unite: null,
      resume: CARTE.typo(`Il est ${bonne}.`), relation: `un quart d'heure = 15${NB}min`, outil: "horloge-quarts",
      image: [CARTE.typo(`Grande aiguille sur le ${grande[0]} : « ${grande[1]} ».`)],
      correction: [CARTE.typo(`Grande aiguille sur le ${grande[0]} : « ${grande[1]} ».`), CARTE.typo(petite)],
      donnees: {type: "heure-lue", h, m},
      cle: `D2:lire:${h}:${m}`
    });
  }
  const QUARTS = [
    // [la durée, le nombre de quarts, les mauvaises réponses, degré]
    ["une demi-heure", 2, ["1", "30"], 2], ["une heure", 4, ["1", "60"], 2], ["trois quarts d'heure", 3, ["4", "45"], 2],
    ["une heure et quart", 5, ["1", "4", "75"], 3], ["une heure et demie", 6, ["3", "90"], 3]
  ];
  function questionQuarts(degre, rng) {
    const vivier = QUARTS.map((x, i) => [x, i]).filter(([x]) => x[3] === degre);
    const [[duree, n, faux], i] = choisir(rng, vivier);
    const bonne = String(n);
    const choix = melanger(rng, [bonne, ...melanger(rng, faux).slice(0, 2)]);
    const phrase = CARTE.typo(`Combien de quarts d'heure dans ${duree} ?`);
    return questionDuree("D2", degre, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "quarts"},
      choix, bon: choix.indexOf(bonne), reponse: bonne, reponseTexte: bonne, unite: null,
      resume: CARTE.typo(`Dans ${duree}, il y a ${n} quarts d'heure.`), relation: `un quart d'heure = 15${NB}min`,
      heure: {h: 0, demis: 0, quarts: n},
      image: [`une heure = 4 quarts d'heure`],
      correction: [CARTE.typo(`${duree} = ${n * 15}${NB}min`), CARTE.typo(`${n * 15}${NB}min = ${n} × 15${NB}min : ${n} quarts d'heure`)],
      donnees: {type: "quarts", n, duree: i},
      cle: `D2:quarts:${i}`
    });
  }
  function d2EnChoix(x, rng) {
    if (!x || x.donnees.type !== "duree-mots" || x.donnees.deux) return null;
    const d = x.donnees;
    const total = d.h * 60 + d.demis * 30 + d.quarts * 15;
    const faux = [];
    if (d.quarts) faux.push(d.h * 60 + d.demis * 30 + d.quarts * 25);
    if (d.demis) faux.push(d.h * 60 + d.demis * 50 + d.quarts * 15);
    if (d.h) faux.push(d.h * 100 + d.demis * 30 + d.quarts * 15);
    if (d.quarts || d.demis) faux.push(d.h * 60 + d.demis * 15 + d.quarts * 30);
    const propres = [...new Set(faux)].filter(f => f !== total && f > 0);
    if (propres.length < 2) return null;
    const choix = melanger(rng, [total, propres[0], choisir(rng, propres.slice(1))]).map(String);
    const phrase = `${d.mots} = ${CASE}${NB}min`;
    return Object.assign(x, {forme: "qcm", texte: phrase, morceaux: {phrase, apres: "min", sorte: "valeur"},
      choix, bon: choix.indexOf(String(total)), cle: `${x.cle}:q`});
  }

  ETAPES.D2 = {
    exclureExemples: false,
    // Je valide : au choix en 3e, les quarts en 5e, l'heure en mots en 7e
    // et en 9e ; À toi : une question sur deux, l'une des trois.
    formes(usage, rng) {
      // Lot 3b-3 : l'horloge à lire en 8e de Je valide, environ une
      // question sur six dans À toi, et dans un retour sur deux.
      if (usage === "valide") return {2: "choix", 4: "quarts", 6: "heure", 7: "lire", 8: "heure"};
      if (usage === "entraine") {
        const f = {};
        for (let i = 0; i < 25; i += 1) {
          const r = rng();
          if (r < 0.2) f[i] = "choix";
          else if (r < 0.35 && i >= 6 && i < 15) f[i] = "quarts";
          else if (r < 0.5 && i >= 6) f[i] = "heure";
          else if (r < 0.68 && i >= 3) f[i] = "lire";
        }
        return f;
      }
      if (usage === "retour") return rng() < 0.5 ? {0: "lire"} : {1: "lire"};
      return {};
    },
    tirer(rng, degre, i, usage, forme) {
      if (forme === "heure") return questionHeureMots(degre === 1 ? 2 : degre, rng);
      if (forme === "lire") return questionLireHeure(degre, rng);
      if (forme === "quarts") return questionQuarts(degre === 1 ? 2 : degre, rng);
      if (forme === "choix") {
        const vivier = EN_MOTS.filter(m => m[4] === degre && (m[2] || m[3]));
        const [mots, h, demis, quarts] = choisir(rng, vivier);
        return d2EnChoix(this.tirer(rng, degre, i, usage, {mots: [mots, h, demis, quarts]}), rng);
      }
      const impose = forme && forme.mots ? forme.mots : null;
      if (degre === 3 && !impose && rng() < 0.4) {
        const [mots, h, demis, quarts] = choisir(rng, EN_MOTS_DEUX);
        const total = h * 60 + demis * 30 + quarts * 15;
        const H = Math.floor(total / 60);
        const M = total % 60;
        return questionDuree("D2", 3, {
          forme: "deux-cases", texte: `${mots} = ${CASE}${NB}h ${CASE}${NB}min`, morceaux: {avant: `${mots} =`, cases: ["h", "min"]},
          reponse: [String(H), String(M)], reponseTexte: hm(H, M), unite: "min", resume: `${mots} = ${H}${NB}h ${M}${NB}min`,
          relation: `un quart d'heure = 15${NB}min`, heure: {h, demis, quarts},
          image: [`une demi-heure = 30${NB}min ; un quart d'heure = 15${NB}min`, `${mots} = ${total}${NB}min`],
          correction: [`${mots} = ${total}${NB}min`, `${total}${NB}min = ${H}${NB}h ${M}${NB}min`],
          donnees: {type: "duree-mots", h, demis, quarts, deux: true},
          cle: `D2:${h}-${demis}-${quarts}>hmin`
        });
      }
      const vivier = EN_MOTS.filter(m => m[4] === degre);
      const [mots, h, demis, quarts] = impose || choisir(rng, vivier);
      const total = h * 60 + demis * 30 + quarts * 15;
      const lignes = [];
      if (h) lignes.push(`${h === 1 ? "une heure" : `${h} heures`} = ${h * 60}${NB}min`);
      if (demis) lignes.push(`une demi-heure = 30${NB}min`);
      if (quarts) lignes.push(`un quart d'heure = 15${NB}min`);
      return questionDuree("D2", degre, {
        forme: "nombre", texte: `${mots} = ${CASE}${NB}min`, morceaux: {avant: `${mots} =`, apres: "min", long: mots.length > 14},
        reponse: String(total), reponseTexte: `${total}${NB}min`, unite: "min", resume: `${mots} = ${total}${NB}min`,
        relation: `1${NB}h = 60${NB}min`, heure: {h, demis, quarts},
        image: lignes.slice(0, 2),
        correction: lignes.length === 1 && lignes[0] === `${mots} = ${total}${NB}min` ? lignes : lignes.concat([`${mots} = ${total}${NB}min`]),
        donnees: {type: "duree-mots", h, demis, quarts, mots},
        cle: `D2:${h}-${demis}-${quarts}>min`
      });
    },
    erreurs(question, lu, cases) {
      const d = question.donnees;
      if (d.type === "heure-mots") {
        if (cases && d.m === 45 && cases[0] === milli(d.h + 1) && cases[1] === milli(45)) return {erreur: 4, retour: `« Moins le quart » : 15${NB}min AVANT ${heureTexte((d.h + 1) * 60)}, donc ${heureTexte(d.h * 60 + 45)}.`};
        if (cases && d.m === 45 && cases[0] === milli(d.h + 1) && cases[1] === milli(15)) return {erreur: 4, retour: `« Moins le quart » : 15${NB}min AVANT ${heureTexte((d.h + 1) * 60)}, donc ${heureTexte(d.h * 60 + 45)}.`};
        return null;
      }
      if (d.deux || d.type !== "duree-mots") return null;
      const total = d.h * 60 + d.demis * 30 + d.quarts * 15;
      if (d.quarts && lu === milli(d.h * 60 + d.demis * 30 + d.quarts * 25)) return {erreur: 1, retour: `Un quart d'heure, c'est le quart de 60${NB}min : 15${NB}min, pas 25${NB}min.`};
      if (d.demis && lu === milli(d.h * 60 + d.demis * 50 + d.quarts * 15)) return {erreur: 2, retour: `Une demi-heure, c'est la moitié de 60${NB}min : 30${NB}min.`};
      if (d.h && lu === milli(d.h * 100 + d.demis * 30 + d.quarts * 15) && lu !== milli(total)) return {erreur: 3, retour: `1${NB}h = 60${NB}min, pas 100${NB}min.`};
      return null;
    }
  };

  // ------------------------------- Q1 · Problèmes : mettre bout à bout, couper
  // Une seule conversion, entière ; résultat positif ; unité imposée.
  // Modèles : couper (un reste), bout à bout (un total).
  function modeleProbleme(rng, degre) {
    const prenom = choisir(rng, PRENOMS);
    if (degre === 1) {
      if (rng() < 0.5) {
        const a = entre(rng, 1, 3);
        const b = entre(rng, 10, 90, 10);
        return {modele: "couper", objet: "ruban", prenom, a, ua: "m", b, ub: "cm", vers: "cm", op: "-",
          enonce: `Un ruban mesure ${a}${NB}m. ${prenom} en coupe ${b}${NB}cm. Quelle longueur de ruban reste-t-il${NB}?`,
          avant: "Il reste", objetBorne: "ruban", partBorne: "coupeRuban", tout: `${a}${NB}m`, partie: `${b}${NB}cm`};
      }
      // Lot 3b : la canne à sucre (La Réunion).
      if (rng() < 0.4) {
        const a = entre(rng, 2, 4);
        const b = entre(rng, 10, 90, 10);
        return {modele: "canne", objet: "canne", prenom, a, ua: "m", b, ub: "cm", vers: "cm", op: "-",
          enonce: `Une canne à sucre mesure ${a}${NB}m. ${prenom} en coupe un morceau de ${b}${NB}cm. Quelle longueur de canne reste-t-il${NB}?`,
          avant: "Il reste", objetBorne: "canne", partBorne: "coupeCanne"};
      }
      const a = entre(rng, 1, 3);
      const b = entre(rng, 10, 90, 10);
      return {modele: "bout", objet: "planche", prenom, a, ua: "m", b, ub: "cm", vers: "cm", op: "+",
        enonce: `${prenom} pose bout à bout une planche de ${a}${NB}m et une planche de ${b}${NB}cm. Quelle longueur en tout${NB}?`,
        avant: "En tout,", objetBorne: "planche", partBorne: "morceauPlanche"};
    }
    if (degre === 2) {
      const r = rng();
      // Lot A2 ter : au marché de Saint-Pierre (letchis et longanis).
      if (r < 0.25) {
        const a = entre(rng, 1, 3);
        const b = entre(rng, 100, 900, 100);
        return {modele: "marche", objet: "letchis", prenom, a, ua: "kg", b, ub: "g", vers: "g", op: "+",
          enonce: `Au marché, ${prenom} achète ${a}${NB}kg de letchis et ${b}${NB}g de longanis. Quelle est la masse de fruits en tout${NB}?`,
          avant: "En tout,", objetBorne: "letchis", partBorne: "longanis"};
      }
      if (r < 0.5) {
        const a = entre(rng, 1, 3);
        const b = entre(rng, 100, 900, 100);
        return {modele: "bout", objet: "riz", prenom, a, ua: "kg", b, ub: "g", vers: "g", op: "+",
          enonce: `${prenom} achète ${a}${NB}kg de riz et ${b}${NB}g de lentilles. Quelle est la masse en tout${NB}?`,
          avant: "En tout,", objetBorne: "riz", partBorne: "lentilles"};
      }
      if (r < 0.75) {
        const a = entre(rng, 1, 2);
        const b = entre(rng, 15, 30, 5);
        return {modele: "goyavier", objet: "jus", prenom, a, ua: "L", b, ub: "cL", vers: "cL", op: "-",
          enonce: `Une bouteille contient ${a}${NB}L de jus de goyavier. ${prenom} en verse ${b}${NB}cL dans un verre. Combien de jus reste-t-il${NB}?`,
          avant: "Il reste", objetBorne: "jus", partBorne: "verre"};
      }
      const a = entre(rng, 1, 2);
      const b = entre(rng, 15, 30, 5);
      return {modele: "couper", objet: "jus", prenom, a, ua: "L", b, ub: "cL", vers: "cL", op: "-",
        enonce: `Une bouteille contient ${a}${NB}L de jus. ${prenom} en verse ${b}${NB}cL dans un verre. Combien de jus reste-t-il dans la bouteille${NB}?`,
        avant: "Il reste", objetBorne: "jus", partBorne: "verre"};
    }
    const r3 = rng();
    // Lot A2 ter : le sentier du Trou de Fer (forêt de Bélouve).
    if (r3 < 0.25) {
      const a = entre(rng, 2, 5);
      const b = entre(rng, 100, 1900, 100);
      // (Lot 3b, carte v4 : « une portion du sentier » — le sentier entier
      // ne change pas de longueur d'une question à l'autre.)
      return {modele: "troudefer", objet: "sentierBelouve", prenom, a, ua: "km", b, ub: "m", vers: "m", op: "-",
        enonce: `Une portion du sentier du Trou de Fer mesure ${a}${NB}km. ${prenom} en a déjà parcouru ${mes(milli(b), "m")}. Quelle distance reste-t-il à marcher${NB}?`,
        avant: "Il reste", objetBorne: "sentierBelouve", partBorne: "marche"};
    }
    if (r3 < 0.5) {
      const a = entre(rng, 2, 9);
      const b = entre(rng, 100, 1900, 100);
      return {modele: "couper", objet: "sentier", prenom, a, ua: "km", b, ub: "m", vers: "m", op: "-",
        enonce: `Un sentier mesure ${a}${NB}km. ${prenom} a déjà marché ${mes(milli(b), "m")}. Quelle distance reste-t-il à marcher${NB}?`,
        avant: "Il reste", objetBorne: "sentier", partBorne: "marche"};
    }
    // Lot 3b : bout à bout, à pied (km puis m).
    if (r3 < 0.75) {
      const a = entre(rng, 1, 3);
      const b = entre(rng, 100, 900, 100);
      return {modele: "promenade", objet: "trajet", prenom, a, ua: "km", b, ub: "m", vers: "m", op: "+",
        enonce: `${prenom} marche ${a}${NB}km jusqu'au marché, puis ${mes(milli(b), "m")} jusqu'à la plage. Quelle distance en tout${NB}?`,
        avant: "En tout,", objetBorne: "trajet", partBorne: "marche"};
    }
    const a = entre(rng, 2, 5);
    const b = entre(rng, 110, 190, 10);
    return {modele: "couper", objet: "ruban", prenom, a, ua: "m", b, ub: "cm", vers: "cm", op: "-",
      enonce: `Un ruban mesure ${a}${NB}m. ${prenom} en coupe ${b}${NB}cm. Quelle longueur de ruban reste-t-il${NB}?`,
      avant: "Il reste", objetBorne: "ruban", partBorne: "coupeRuban"};
  }

  function questionProbleme(code, degre, rng, vraisemblable) {
    const m = modeleProbleme(rng, degre);
    const A = milli(m.a);
    const B = milli(m.b);
    const Ac = convertir(A, m.ua, m.vers);
    const rep = m.op === "+" ? Ac + B : Ac - B;
    const lignes = [`${mes(A, m.ua)} = ${mes(Ac, m.vers)}`, `${mes(Ac, m.vers)} ${m.op === "+" ? "+" : "−"} ${mes(B, m.ub)} = ${mes(rep, m.vers)}`];
    const base = {
      code, degre, unite: m.vers, relation: relationTexte(m.ua, m.vers), outil: "schema",
      schema: m.op === "-" ? {tout: `${mes(A, m.ua)} = ${mes(Ac, m.vers)}`, parts: [mes(B, m.ub), `?${NB}${m.vers}`], cherchee: 1}
        : {tout: `?${NB}${m.vers}`, parts: [`${mes(A, m.ua)} = ${mes(Ac, m.vers)}`, mes(B, m.ub)], cherchee: -1},
      image: [`Je mets tout dans la même unité : ${mes(A, m.ua)} = ${mes(Ac, m.vers)}.`, `${mes(Ac, m.vers)} ${m.op === "+" ? "+" : "−"} ${mes(B, m.ub)} = ${CASE}`],
      correction: lignes, grandeur: grandeurDe(m.ua),
      donnees: {type: "pb", op: m.op, a: String(m.a), ua: m.ua, b: String(m.b), ub: m.ub, vers: m.vers, objet: m.objetBorne, part: m.partBorne},
      cle: `${code}:${m.modele}:${m.a}${m.ua}${m.op}${m.b}${m.ub}`
    };
    if (!vraisemblable) {
      return q(Object.assign(base, {
        forme: "nombre", texte: `${m.enonce} ${m.avant} ${CASE}${NB}${m.vers}`,
        morceaux: {enonce: m.enonce, avant: m.avant, apres: m.vers},
        reponse: brut(rep), reponseTexte: mes(rep, m.vers), resume: `${m.avant} ${mes(rep, m.vers)}`
      }));
    }
    // « Est-ce vraisemblable ? » : un résultat proposé par quelqu'un.
    // Vrai : le vrai résultat ; faux : × ou ÷ 10 ou 100 (l'erreur typique
    // de conversion), toujours impossible ou très loin.
    const vrai = vraisemblable === "oui";
    let propose = rep;
    if (!vrai) {
      // Au plus 10 000 (le programme de CE2) : sinon ÷ 10.
      const essais = [rep * 10n, rep * 100n].filter(x => x <= 10000n * MILLE).concat(rep % 10000n === 0n ? [rep / 10n] : []);
      propose = essais.length ? choisir(rng, essais) : rep * 10n;
    }
    const auteur = choisir(rng, PRENOMS.filter(p => p !== m.prenom));
    const dit = m.op === "-" ? `${auteur} trouve qu'il reste ${mes(propose, m.vers)}.` : `${auteur} trouve ${mes(propose, m.vers)} en tout.`;
    const enonce = m.enonce.replace(/ (Quelle|Combien)[^?]*\?$/, "");
    const raison = vrai ? `Oui : ${lignes[1]}.`
      : m.op === "-" && propose > Ac ? `Non : ${mes(propose, m.vers)}, c'est plus que ${mes(Ac, m.vers)} au départ.`
        : `Non : ${lignes[1]}, pas ${mes(propose, m.vers)}.`;
    return q(Object.assign(base, {
      forme: "vrai-faux", texte: `${enonce} ${dit} Est-ce vraisemblable${NB}?`,
      morceaux: {enonce, proposition: dit},
      choix: ["Oui", "Non"], bon: vrai ? 0 : 1, reponse: vrai ? "Oui" : "Non", reponseTexte: vrai ? "Oui" : "Non",
      resume: `${dit} ${vrai ? "Vraisemblable." : "Pas vraisemblable."}`,
      correction: [lignes[0], raison],
      donnees: Object.assign({}, base.donnees, {type: "vrai", propose: brut(propose), vrai}),
      cle: `${base.cle}:v${vrai ? 1 : 0}`, cleBase: base.cle
    }));
  }

  ETAPES.Q1 = {
    clesExemples: ["Q1:couper:2m-50cm", "Q1:bout:1kg+500g", "Q1:couper:3m-20cm"],
    tirer(rng, degre, i, usage, forme) {
      return questionProbleme("Q1", degre, rng, forme && forme.startsWith("vrai") ? forme.slice(5) : null);
    },
    // Validation : « Est-ce vraisemblable ? » aux places 4 et 8 (un Oui, un
    // Non, dans un ordre tiré) ; entraînement : 5 sur 25.
    formes(usage, rng) {
      if (usage === "valide") {
        const [x, y] = rng() < 0.5 ? ["vrai-oui", "vrai-non"] : ["vrai-non", "vrai-oui"];
        return {3: x, 7: y};
      }
      // Oui et Non alternent ; le premier est tiré (audit du 12/11 : Oui
      // revenait 3 fois sur 5, toujours à la même place).
      if (usage === "entraine") {
        const [a, b] = rng() < 0.5 ? ["vrai-oui", "vrai-non"] : ["vrai-non", "vrai-oui"];
        return {3: a, 8: b, 13: a, 18: b, 23: rng() < 0.5 ? "vrai-oui" : "vrai-non"};
      }
      // Lot 3b (carte v4 : « Est-ce vraisemblable ? » repris dans les
      // retours et l'échauffement) : une fois sur deux, la 1re question.
      if (usage === "retour" || usage === "echauffement") {
        const r = rng();
        return r < 0.25 ? {0: "vrai-oui"} : r < 0.5 ? {0: "vrai-non"} : {};
      }
      return {};
    },
    erreurs(question, lu) {
      const d = question.donnees;
      if (d.type === "vrai") return null;
      const A = milli(d.a);
      const B = milli(d.b);
      const Ac = convertir(A, d.ua, d.vers);
      const f = facteur(d.ua, d.vers);
      if ((d.op === "-" && A > B && lu === A - B) || lu === A + B) return {erreur: 1, retour: `Avant de calculer, j'écris tout dans la même unité : ${mes(A, d.ua)} = ${mes(Ac, d.vers)}.`};
      for (const g of [A * f * 10n, A * f / 10n]) {
        const faux = d.op === "+" ? g + B : g - B;
        if (faux > 0n && lu === faux) return {erreur: 2, retour: `${mes(A, d.ua)} = ${mes(Ac, d.vers)} (1${NB}${d.ua} = ${mes(f * MILLE, d.vers)}), pas ${mes(g, d.vers)}.`};
      }
      if (lu === (d.op === "+" ? Ac - B : Ac + B)) return {erreur: 3, retour: d.op === "-" ? "Relis la question : on cherche ce qui reste." : "Relis la question : on cherche ce qu'il y a en tout."};
      return null;
    }
  };

  // ------------------------------------------- E1 · Les euros et les centimes
  // Lot A2 bis (programme de CE1 et de CE2 : 1 € = 100 c). Les sommes sont
  // des entiers de centimes (jusqu'à 9 999 c). La virgule n'apparaît que sur
  // une étiquette de prix ; la réponse est toujours un entier.
  //   versC « 3 € 50 c = … c » · versE « 600 c = … € » · deux « 250 c = … € … c »
  //   prix « 2,50 € = … € … c » · objet « Un cahier coûte 2 € 40 c.
  //   Combien de centimes ? » · pieces : les pièces dessinées, à compter.
  function euc(total) {
    const e = Math.floor(total / 100);
    const c = total % 100;
    if (!e) return `${c}${NB}c`;
    return c ? `${e}${NB}€ ${c}${NB}c` : `${e}${NB}€`;
  }
  function prixTexte(total) {
    return `${Math.floor(total / 100)},${String(total % 100).padStart(2, "0")}${NB}€`;
  }
  // Les objets à acheter : leurs prix, en centimes.
  const ACHATS = [
    ["Une baguette de pain", 90, 150], ["Un croissant", 90, 150], ["Un cahier", 150, 400], ["Un stylo", 80, 300], ["Une glace", 200, 450],
    ["Un ballon", 500, 1500], ["Un livre", 500, 1800], ["Une bouteille de jus", 150, 350], ["Une boîte de crayons", 300, 900], ["Un paquet de bonbons", 100, 250],
    // Lot A2 ter : La Réunion.
    ["Un sachet de samoussas", 250, 600], ["Un sachet de bonbons piment", 150, 400], ["Un kilo de letchis", 300, 800],
    ["Une bouteille de jus de goyavier", 200, 450], ["Une barquette de bouchons", 300, 700], ["Une barquette de cari", 600, 1200]
  ];
  // Les pièces et les billets dessinés, en centimes.
  const CENTIMES = [50, 20, 10, 5, 2, 1];
  function piecesDe(rng, degre) {
    const liste = [];
    if (degre === 1) {
      const n = entre(rng, 3, 4);
      for (let k = 0; k < n; k += 1) liste.push(choisir(rng, [50, 20, 20, 10, 10, 5]));
    } else {
      if (degre === 3) liste.push(choisir(rng, [500, 1000, 2000]));
      const euros = entre(rng, 1, 2);
      for (let k = 0; k < euros; k += 1) liste.push(choisir(rng, [100, 200]));
      const n = degre === 2 ? entre(rng, 2, 3) : 3;
      for (let k = 0; k < n; k += 1) liste.push(choisir(rng, degre === 2 ? [50, 20, 10] : CENTIMES));
    }
    return liste.sort((a, b) => b - a);
  }
  function questionArgent(degre, rng, sorte) {
    let total;
    let pieces = null;
    let texte;
    let morceaux;
    let deuxCases = false;
    let unite = "c";
    const a1 = () => entre(rng, 1, 9);
    if (sorte === "versC") {
      total = degre === 1 ? entre(rng, 2, 9) * 100 : degre === 2 ? a1() * 100 + entre(rng, 1, 9) * 10 : entre(rng, 1, 20) * 100 + choisir(rng, [entre(rng, 1, 9), entre(rng, 11, 99)]);
      texte = `${euc(total)} = ${CASE}${NB}c`;
      morceaux = {avant: `${euc(total)} =`, apres: "c"};
    } else if (sorte === "versE") {
      total = (degre === 1 ? entre(rng, 2, 9) : entre(rng, 10, 60)) * 100;
      unite = "€";
      texte = `${ecrire(milli(total))}${NB}c = ${CASE}${NB}€`;
      morceaux = {avant: `${ecrire(milli(total))}${NB}c =`, apres: "€"};
    } else if (sorte === "versEdec") {
      // Lot 3b (carte v4 : « 85 c = 0,85 € », promis, jamais tiré ;
      // programme de CE1 : « 345 centimes = 3,45 € ») : la virgule des euros,
      // au pavé.
      total = rng() < 0.5 ? entre(rng, 11, 99) : entre(rng, 1, 9) * 100 + entre(rng, 1, 99);
      unite = "€";
      texte = `${ecrire(milli(total))}${NB}c = ${CASE}${NB}€`;
      morceaux = {avant: `${ecrire(milli(total))}${NB}c =`, apres: "€"};
    } else if (sorte === "plus") {
      // Lot 3b (attendu de CE1 : « 1 € et 120 centimes = 2,20 € ») : plus de
      // 100 centimes, à regrouper.
      const e0 = entre(rng, 1, 5);
      let c0 = entre(rng, 101, 190);
      if (c0 % 100 === 0) c0 += 5;
      total = e0 * 100 + c0;
      deuxCases = true;
      texte = `${e0}${NB}€ et ${c0}${NB}c = ${CASE}${NB}€ ${CASE}${NB}c`;
      morceaux = {avant: `${e0}${NB}€ et ${c0}${NB}c =`, cases: ["€", "c"], plus: [e0, c0]};
    } else if (sorte === "deux") {
      total = degre === 2 ? a1() * 100 + entre(rng, 1, 9) * 10 : entre(rng, 1, 60) * 100 + entre(rng, 1, 99);
      deuxCases = true;
      texte = `${ecrire(milli(total))}${NB}c = ${CASE}${NB}€ ${CASE}${NB}c`;
      morceaux = {avant: `${ecrire(milli(total))}${NB}c =`, cases: ["€", "c"]};
    } else if (sorte === "prix") {
      // Degré 2 : 2,50 € ; degré 3 : le zéro piège (3,05 €) ou pas d'euro
      // (0,85 €, alors une seule case).
      const r = rng();
      if (degre === 3 && r < 0.55) {
        // 0,85 € ; et (lot 3b, Singapour P2 et positionnement de 6e :
        // « 4,03 euros vaut … centimes ») le zéro piège, 4,05 € = 405 c.
        total = r < 0.25 ? entre(rng, 11, 99) : entre(rng, 1, 9) * 100 + entre(rng, 1, 9);
        texte = `Sur l'étiquette : ${prixTexte(total)} = ${CASE}${NB}c`;
        morceaux = {avant: `Sur l'étiquette : ${prixTexte(total)} =`, apres: "c", etiquette: prixTexte(total)};
      } else {
        total = degre === 2 ? a1() * 100 + entre(rng, 1, 9) * 10 : entre(rng, 1, 20) * 100 + entre(rng, 1, 9);
        deuxCases = true;
        texte = `Sur l'étiquette : ${prixTexte(total)} = ${CASE}${NB}€ ${CASE}${NB}c`;
        morceaux = {avant: `Sur l'étiquette : ${prixTexte(total)} =`, cases: ["€", "c"], etiquette: prixTexte(total)};
      }
    } else if (sorte === "objet") {
      const [objet, min, max] = choisir(rng, ACHATS);
      const pas = degre === 2 ? 10 : 5;
      total = entre(rng, Math.ceil(min / pas), Math.floor(max / pas)) * pas;
      if (degre === 3 && total % 10 === 0) total += 5;
      if (total % 100 === 0) total += pas;
      // Un prix en euros ET en centimes (« 95 c » est déjà en centimes).
      if (total < 100) total += 100;
      const phrase = `${objet} coûte ${euc(total)}. Combien de centimes${NB}?`;
      texte = phrase;
      morceaux = {phrase, apres: "c", objet: true};
    } else {
      // Jamais « 2 € 0 c » : une somme ronde se retire.
      do {
        pieces = piecesDe(rng, degre);
        total = pieces.reduce((x, y) => x + y, 0);
      } while (total % 100 === 0);
      const phrase = "Combien d'argent en tout ?".replace(" ?", `${NB}?`);
      texte = `${phrase} ${pieces.map(euc).join(" + ")}`;
      if (total < 100) morceaux = {phrase, apres: "c", pieces};
      else { deuxCases = true; morceaux = {avant: phrase, cases: ["€", "c"], pieces}; }
    }
    const e = Math.floor(total / 100);
    const c = total % 100;
    const deuxRep = [String(e), String(c)];
    const reponse = deuxCases ? deuxRep : unite === "€" ? brut(milli(total) / 100n) : String(total);
    const reponseTexte = deuxCases ? `${e}${NB}€ ${c}${NB}c` : unite === "€" ? (total % 100 ? prixTexte(total) : `${total / 100}${NB}€`) : `${ecrire(milli(total))}${NB}c`;
    const resume = sorte === "pieces" ? `${pieces.map(euc).join(" + ")} = ${reponseTexte}`
      : sorte === "objet" ? `${morceaux.phrase.replace(/ Combien.*$/, "")} ${euc(total)} = ${reponseTexte}`
        : sorte === "prix" ? `${prixTexte(total)} = ${reponseTexte}` : `${morceaux.avant} ${reponseTexte}`;
    // L'image : les pièces de la somme, chacune avec ce qu'elle vaut (1 €
    // dedans, 100 c dessous) ; comme les paquets de « Vers une unité plus
    // petite », tant qu'on les compte d'un coup d'œil.
    const image = [];
    if (sorte === "versC" || sorte === "objet") image.push(e > 1 ? `1${NB}€ = 100${NB}c, donc ${e}${NB}€ = ${e} × 100${NB}c` : `1${NB}€ = 100${NB}c`);
    else if (sorte === "versE" || sorte === "deux" || sorte === "plus") image.push(`100${NB}c = 1${NB}€ : je fais des paquets de 100${NB}c.`);
    else if (sorte === "versEdec") image.push(total < 100 ? `Moins de 100${NB}c : moins de 1${NB}€. Après la virgule, les centimes.` : `100${NB}c = 1${NB}€ ; après la virgule, les centimes.`);
    else if (sorte === "prix") image.push(`Avant la virgule, les euros ; après la virgule, les centimes.`);
    else image.push("Je compte d'abord les euros, puis les centimes.");
    const correction = sorte === "pieces" ? [`${pieces.map(euc).join(" + ")}`, `= ${reponseTexte}`]
      : [`1${NB}€ = 100${NB}c`, resume];
    return q({
      code: "E1", degre, forme: deuxCases ? "deux-cases" : "nombre", texte, morceaux,
      reponse, reponseTexte, unite, resume, relation: `1${NB}€ = 100${NB}c`, outil: "monnaie", grandeur: "argent",
      paquetsArgent: e <= 9 && sorte !== "pieces" && sorte !== "versEdec" ? {euros: e, centimes: c} : null,
      image, correction,
      donnees: {type: "argent", sorte, total, pieces: pieces ? pieces.slice() : null},
      cle: `E1:${total}:${sorte}${pieces ? `:${pieces.join("-")}` : ""}`
    });
  }
  const SORTES_ARGENT = {1: ["versC", "versE", "pieces"], 2: ["versC", "deux", "prix", "objet", "pieces", "versE"],
    3: ["versC", "deux", "prix", "objet", "pieces", "versEdec", "plus"]};

  ETAPES.E1 = {
    clesExemples: ["E1:100:versC", "E1:350:versC", "E1:250:prix"],
    // Je valide : chaque façon de demander au moins une fois.
    formes(usage) {
      // Lot 3b : « 85 c = 0,85 € » en 8e (avant, une 2e « versC »).
      if (usage === "valide") return {0: "versC", 1: "pieces", 2: "versE", 3: "deux", 4: "objet", 5: "prix", 6: "pieces", 7: "versEdec", 8: "prix", 9: "deux"};
      return {};
    },
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme && SORTES_ARGENT[degre].includes(forme) ? forme : choisir(rng, SORTES_ARGENT[degre]);
      return questionArgent(degre, rng, sorte);
    },
    erreurs(question, lu, cases) {
      const d = question.donnees;
      const e = Math.floor(d.total / 100);
      const c = d.total % 100;
      if (cases) {
        const [x, y] = cases.map(v => Number(v / MILLE));
        if (d.sorte === "prix" && c < 10 && x === e && y === c * 10) return {erreur: 4, retour: `Après la virgule, 0${c} : c'est ${c}${NB}c, pas ${c * 10}${NB}c.`};
        if (d.sorte === "prix" && c % 10 === 0 && x === e && y === c / 10) return {erreur: 5, retour: `Après la virgule, ${c} : c'est ${c}${NB}c.`};
        if (x * 10 + y === d.total && x !== e) return {erreur: 1, retour: `1${NB}€ = 100${NB}c, pas 10${NB}c : je fais des paquets de 100${NB}c.`};
        // Lot 3b : « 4 € et 137 c » recopié sans regrouper les 100 c.
        if (d.sorte === "plus" && question.morceaux.plus && x === question.morceaux.plus[0] && y === question.morceaux.plus[1]) {
          const c0 = question.morceaux.plus[1];
          return {erreur: 6, retour: `${c0}${NB}c, c'est plus de 1${NB}€ : ${c0}${NB}c = 1${NB}€ ${c0 - 100}${NB}c.`};
        }
        return null;
      }
      if (d.sorte === "versEdec") {
        // (lu en millièmes d'euro)
        if (lu === milli(d.total)) return {erreur: 7, retour: `${ecrire(milli(d.total))}${NB}c, ce n'est pas ${ecrire(milli(d.total))}${NB}€ : 100${NB}c = 1${NB}€.`};
        if (lu === milli(d.total) / 10n) return {erreur: 1, retour: `1${NB}€ = 100${NB}c, pas 10${NB}c.`};
        return null;
      }
      const n = Number(lu / MILLE);
      if (lu % MILLE !== 0n) return null;
      if (d.sorte === "versE") {
        if (n === d.total * 100) return {erreur: 3, retour: "Tu as multiplié. Vers une unité plus grande, je divise."};
        if (n === d.total / 10) return {erreur: 1, retour: `1${NB}€ = 100${NB}c, pas 10${NB}c.`};
        return null;
      }
      if (e && n === e * 10 + c) return {erreur: 1, retour: `1${NB}€ = 100${NB}c, pas 10${NB}c.`};
      // Lot 3b : 4,05 € lu « 4 € 50 c ».
      if (d.sorte === "prix" && e && c < 10 && n === e * 100 + c * 10) return {erreur: 4, retour: `Après la virgule, 0${c} : c'est ${c}${NB}c, pas ${c * 10}${NB}c.`};
      if (e && c && (n === e * 100 || n === e)) return {erreur: 2, retour: `N'oublie pas les ${c}${NB}c : ${euc(d.total)} = ${ecrire(milli(e * 100))}${NB}c + ${c}${NB}c.`};
      return null;
    }
  };

  // --------------------------------- D7 · Combien de temps entre deux heures ?
  // Lot A2 bis (programme de CE1, CE2, CM1 : durée entre deux instants ;
  // Singapour, Primary 3). Le même jour, en heures et minutes (de 5 en 5).
  // Deux heures connues, la troisième à trouver : la durée, l'heure
  // d'arrivée, l'heure de départ. Les instants sont des minutes depuis
  // minuit (8 h 30 → 510).
  function heureTexte(t) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    return m ? `${h}${NB}h${NB}${String(m).padStart(2, "0")}` : `${h}${NB}h`;
  }
  function dureeTexte(d) {
    return hm(Math.floor(d / 60), d % 60);
  }
  // Les situations, chacune avec ses durées vraisemblables (en minutes) et
  // l'heure où elle peut commencer : un gâteau ne cuit pas 3 h, une
  // récréation n'a pas lieu à 18 h.
  //   durée cherchée : [sujet, durée min, durée max, début au plus tôt, au plus tard]
  const DUREES_SUJETS = [
    ["La récréation", 10, 30, 570, 960], ["La séance de piscine", 30, 60, 480, 960], ["Le trajet en car", 15, 180, 420, 1020],
    ["Le film", 80, 150, 540, 1020], ["La sortie au parc", 60, 240, 480, 900], ["Le spectacle de l'école", 45, 120, 540, 1020],
    ["L'atelier de peinture", 30, 90, 480, 960], ["Le match de basket", 40, 90, 480, 1020], ["La sieste", 30, 120, 720, 900],
    ["Le pique-nique", 30, 120, 690, 840],
    // Lot A2 ter : La Réunion.
    ["Le trajet en Car Jaune", 30, 150, 420, 1020], ["La marche jusqu'au Trou de Fer", 60, 180, 420, 780], ["La baignade au bassin", 30, 120, 540, 960],
    ["La cuisson du cari", 45, 90, 540, 1080]
  ];
  //   heure cherchée : [heure connue → phrase, durée → phrase, la case,
  //   durée min, durée max, début au plus tôt, au plus tard]
  const ARRIVEES = [
    [t => `Le bus part à ${t}.`, d => `Le trajet dure ${d}.`, "Arrivée :", 10, 180, 420, 1020],
    [t => `Le film commence à ${t}.`, d => `Le film dure ${d}.`, "Fin :", 80, 150, 540, 1020],
    [t => `Le gâteau entre dans le four à ${t}.`, d => `La cuisson dure ${d}.`, "Sortie du four :", 20, 60, 480, 1080],
    [t => `La randonnée commence à ${t}.`, d => `La randonnée dure ${d}.`, "Fin :", 60, 300, 420, 840],
    [t => `L'entraînement de football commence à ${t}.`, d => `L'entraînement dure ${d}.`, "Fin :", 45, 120, 480, 1020],
    // Lot A2 ter : La Réunion.
    [t => `Le Car Jaune part de Saint-Pierre à ${t}.`, d => `Le trajet dure ${d}.`, "Arrivée :", 30, 150, 420, 1020],
    [t => `Le cari est mis à cuire à ${t}.`, d => `La cuisson dure ${d}.`, "Fin de la cuisson :", 45, 90, 540, 1080],
    [t => `La marche jusqu'au Trou de Fer commence à ${t}.`, d => `La marche dure ${d}.`, "Arrivée :", 60, 180, 420, 780]
  ];
  const DEPARTS = [
    [t => `Le bus arrive à ${t}.`, d => `Le trajet a duré ${d}.`, "Départ :", 10, 180, 420, 1020],
    [t => `Le film finit à ${t}.`, d => `Le film a duré ${d}.`, "Début :", 80, 150, 540, 1020],
    [t => `Le gâteau sort du four à ${t}.`, d => `La cuisson a duré ${d}.`, "Mise au four :", 20, 60, 480, 1080],
    [t => `La randonnée finit à ${t}.`, d => `La randonnée a duré ${d}.`, "Départ :", 60, 300, 420, 840],
    [t => `L'entraînement de football finit à ${t}.`, d => `L'entraînement a duré ${d}.`, "Début :", 45, 120, 480, 1020],
    // Lot A2 ter : La Réunion.
    [t => `Le Car Jaune arrive à Saint-Denis à ${t}.`, d => `Le trajet a duré ${d}.`, "Départ :", 30, 150, 420, 1020],
    [t => `Le cari a fini de cuire à ${t}.`, d => `La cuisson a duré ${d}.`, "Début de la cuisson :", 45, 90, 540, 1080],
    [t => `La marche jusqu'au Trou de Fer finit à ${t}.`, d => `La marche a duré ${d}.`, "Départ :", 60, 180, 420, 780]
  ];
  // Deux instants, selon le degré. Degré 1 : des heures pile, ou dans la
  // même heure ; degré 2 : on passe une heure pile, moins d'une heure ;
  // degré 3 : des heures et des minutes. Dans les bornes de la situation.
  function deuxInstants(rng, degre, cherche, [dMin, dMax, tMin, tMax]) {
    for (let essai = 0; essai < 120; essai += 1) {
      let dep;
      let duree;
      if (degre === 1) {
        if (cherche === "duree" && (dMin < 60 && rng() < 0.6 || dMax < 60)) {
          const h = entre(rng, 7, 17);
          const m1 = entre(rng, 0, 7) * 5;
          duree = entre(rng, 2, (55 - m1) / 5) * 5;
          dep = h * 60 + m1;
        } else { dep = entre(rng, 7, 17) * 60; duree = entre(rng, 1, 4) * 60; }
      } else if (degre === 2) {
        dep = entre(rng, 7, 17) * 60 + entre(rng, 7, 11) * 5;
        duree = entre(rng, 3, 11) * 5;
      } else {
        dep = entre(rng, 7, 17) * 60 + entre(rng, 1, 11) * 5;
        duree = entre(rng, 1, 4) * 60 + entre(rng, 1, 11) * 5;
      }
      const arr = dep + duree;
      if (duree < dMin || duree > dMax || dep < tMin || dep > tMax || arr > 20 * 60) continue;
      const passe = Math.floor(arr / 60) > Math.floor(dep / 60);
      if (degre === 2 && (!passe || arr % 60 === 0)) continue;
      if (degre === 1 && duree % 60 && passe) continue;
      if (degre === 3 && duree % 60 === 0) continue;
      if (cherche !== "duree" && degre > 1 && (arr % 60 === 0 || dep % 60 === 0)) continue;
      return [dep, arr];
    }
    return null;
  }
  function questionEntre(degre, rng, cherche) {
    const liste = cherche === "duree" ? DUREES_SUJETS : cherche === "arrivee" ? ARRIVEES : DEPARTS;
    let contexte = null;
    let paire = null;
    for (const c of melanger(rng, liste)) {
      paire = deuxInstants(rng, degre, cherche, cherche === "duree" ? c.slice(1) : c.slice(3));
      if (paire) { contexte = c; break; }
    }
    if (!paire) return null;
    const [dep, arr] = paire;
    const duree = arr - dep;
    const H = Math.floor(duree / 60);
    let enonce;
    let avant;
    let cases = null;
    let apres = "";
    let reponse;
    let reponseTexte;
    let unite;
    if (cherche === "duree") {
      enonce = `${contexte[0]} commence à ${heureTexte(dep)} et finit à ${heureTexte(arr)}.`;
      avant = "Durée :";
      if (duree < 60) { apres = "min"; reponse = String(duree); unite = "min"; }
      else if (duree % 60 === 0) { apres = "h"; reponse = String(H); unite = "h"; }
      else { cases = ["h", "min"]; reponse = [String(H), String(duree % 60)]; unite = "min"; }
      reponseTexte = dureeTexte(duree);
    } else {
      const [phraseT, phraseD, case_] = contexte;
      const connue = cherche === "arrivee" ? dep : arr;
      const cherchee = cherche === "arrivee" ? arr : dep;
      enonce = `${phraseT(heureTexte(connue))} ${phraseD(dureeTexte(duree))}`;
      avant = case_;
      const h = Math.floor(cherchee / 60);
      const m = cherchee % 60;
      if (m) { cases = ["h", ""]; reponse = [String(h), String(m)]; }
      else { apres = "h"; reponse = String(h); }
      unite = "h";
      reponseTexte = heureTexte(cherchee);
    }
    // L'image : le premier bond (jusqu'à l'heure pile, ou les heures).
    const heurePile = t => Math.ceil(t / 60) * 60;
    let bond;
    if (cherche === "duree") {
      if (dep % 60 && arr % 60 < dep % 60) bond = `De ${heureTexte(dep)} à ${heureTexte(heurePile(dep))} : ${heurePile(dep) - dep}${NB}min.`;
      else if (H) bond = `De ${heureTexte(dep)} à ${heureTexte(dep + H * 60)} : ${H}${NB}h.`;
      else bond = "Je compte les minutes de 5 en 5 sur l'horloge.";
    } else if (cherche === "arrivee") {
      if (dep % 60 && (dep % 60) + (duree % 60) >= 60 && duree % 60) bond = `${heureTexte(dep)} + ${heurePile(dep) - dep}${NB}min = ${heureTexte(heurePile(dep))}`;
      else bond = H ? `${heureTexte(dep)} + ${H}${NB}h = ${heureTexte(dep + H * 60)}` : `${heureTexte(dep)} + ${duree}${NB}min`;
    } else if (arr % 60 && (arr % 60) < (duree % 60)) bond = `${heureTexte(arr)} − ${arr % 60}${NB}min = ${heureTexte(arr - (arr % 60))}`;
    else bond = H ? `${heureTexte(arr)} − ${H}${NB}h = ${heureTexte(arr - H * 60)}` : `${heureTexte(arr)} − ${duree}${NB}min`;
    // Lot A2 ter : quand le premier bond est déjà toute la réponse (des
    // heures pile), l'image ne l'écrit pas (« 16 h + 2 h = 18 h » donnait la
    // réponse ; l'aide ne la donne jamais).
    const fin = cherche === "duree" ? null : heureTexte(cherche === "arrivee" ? arr : dep);
    if (fin && bond.endsWith(`= ${fin}`)) bond = `${bond.slice(0, -fin.length)}${CASE}`;
    if (cherche === "duree" && bond === `De ${heureTexte(dep)} à ${heureTexte(arr)} : ${H}${NB}h.`) bond = `Je compte les heures, de ${heureTexte(dep)} à ${heureTexte(arr)}.`;
    const resume = `${enonce} ${avant} ${reponseTexte}`;
    const lignes = cherche === "duree" ? [`De ${heureTexte(dep)} à ${heureTexte(arr)} : ${dureeTexte(duree)}`]
      : cherche === "arrivee" ? [`${heureTexte(dep)} + ${dureeTexte(duree)} = ${heureTexte(arr)}`] : [`${heureTexte(arr)} − ${dureeTexte(duree)} = ${heureTexte(dep)}`];
    return q({
      code: "D7", degre, forme: cases ? "deux-cases" : "nombre",
      texte: `${enonce} ${avant} ${cases ? `${CASE}${NB}h ${CASE}${cases[1] ? `${NB}min` : ""}` : `${CASE}${NB}${apres}`}`,
      morceaux: cases ? {enonce, avant, cases} : {enonce, avant, apres},
      reponse, reponseTexte, unite, resume: `${avant} ${reponseTexte}`, outil: "axe-temps", grandeur: "duree",
      axe: {depart: dep, arrivee: arr, cherche}, horloges: {depart: dep, arrivee: arr, cherche},
      relation: `1${NB}h = 60${NB}min`, image: [bond], correction: lignes,
      donnees: {type: "entre", cherche, depart: dep, arrivee: arr},
      cle: `D7:${cherche}:${dep}-${arr}`
    });
  }

  // Lot 3b (carte v4 : « le piège officiel du CM2 », « le quart d'heure
  // oublié ») : trois réponses au choix, avec les erreurs de la base 100 —
  // « 14 h 20 + 45 min = 14 h 65 » (CM2 2026), « 13 h 30 − 53 min =
  // 12 h 77 » ou « 13 h 23 » (attendus de CM2), « de 8 h 47 à 9 h 10 :
  // 37 min » (positionnement de 6e), « 14 h 50 + 55 min = 15 h 05 »
  // (positionnement de 5e), et un quart d'heure de trop ou de moins (6e).
  function entreEnChoix(x, rng) {
    if (!x) return null;
    const d = x.donnees;
    const dep = d.depart;
    const arr = d.arrivee;
    const duree = arr - dep;
    const cent = t => Math.floor(t / 60) * 100 + (t % 60);
    const brutH = (h, m) => (m ? `${h}${NB}h${NB}${String(m).padStart(2, "0")}` : `${h}${NB}h`);
    let bonne;
    const faux = [];
    if (d.cherche === "arrivee") {
      bonne = heureTexte(arr);
      const mm = (dep % 60) + (duree % 60);
      const hh = Math.floor(dep / 60) + Math.floor(duree / 60);
      if (mm >= 60 && mm < 100) faux.push(brutH(hh, mm));
      if (mm >= 100) faux.push(brutH(hh + 1, mm - 100));
      faux.push(heureTexte(arr + 15), heureTexte(arr - 15));
    } else if (d.cherche === "depart") {
      bonne = heureTexte(dep);
      const c = cent(arr) - cent(duree);
      if (c % 100 >= 60) faux.push(brutH(Math.floor(c / 100), c % 100));
      if (arr % 60 < duree % 60) faux.push(brutH(Math.floor(arr / 60) - Math.floor(duree / 60), (duree % 60) - (arr % 60)));
      faux.push(heureTexte(dep - 15), heureTexte(dep + 15));
    } else {
      bonne = dureeTexte(duree);
      const c = cent(arr) - cent(dep);
      faux.push(c >= 100 ? hm(Math.floor(c / 100), c % 100) : `${c}${NB}min`);
      if (duree < 60 && dep % 60 > arr % 60) faux.push(`${(dep % 60) - (arr % 60)}${NB}min`);
      faux.push(dureeTexte(duree + 15), dureeTexte(duree + 60));
    }
    const propres = [...new Set(faux)].filter(f => f !== bonne);
    if (propres.length < 2) return null;
    const choix = melanger(rng, [bonne, propres[0], choisir(rng, propres.slice(1))]);
    const consigne = `${x.morceaux.avant.replace(/ :$/, "")}${NB}?`;
    return Object.assign(x, {
      forme: "qcm", texte: `${x.morceaux.enonce} ${consigne}`, morceaux: {enonce: x.morceaux.enonce, consigne, sorte: "heure"},
      choix, bon: choix.indexOf(bonne), cle: `${x.cle}:q`
    });
  }

  ETAPES.D7 = {
    clesExemples: ["D7:duree:480-660", "D7:duree:510-650", "D7:arrivee:640-675"],
    // Je valide : les trois questions (durée, arrivée, départ) ; lot 3b :
    // au choix (les pièges) en 5e et en 8e.
    formes(usage, rng) {
      if (usage === "valide") return {0: "duree", 1: "arrivee", 2: "duree", 3: "duree", 4: "choix-arrivee", 5: "depart", 6: "duree", 7: "choix-duree", 8: "arrivee", 9: "depart"};
      if (usage === "test") return {0: "duree", 1: "arrivee", 2: "depart", 3: rng() < 0.5 ? "duree" : "arrivee"};
      if (usage === "entraine") return {8: "choix-arrivee", 13: "choix-depart", 20: "choix-duree"};
      return {};
    },
    tirer(rng, degre, i, usage, forme) {
      const r = rng();
      const choix = typeof forme === "string" && forme.startsWith("choix-");
      const voulu = choix ? forme.slice(6) : forme;
      const cherche = ["duree", "arrivee", "depart"].includes(voulu) ? voulu : r < 0.5 ? "duree" : r < 0.75 ? "arrivee" : "depart";
      const x = questionEntre(degre, rng, cherche);
      return choix ? entreEnChoix(x, rng) : x;
    },
    erreurs(question, lu, cases) {
      const d = question.donnees;
      const cent = t => Math.floor(t / 60) * 100 + (t % 60);
      const diff100 = cent(d.arrivee) - cent(d.depart);
      const pile = Math.ceil(d.depart / 60) * 60;
      const lus = cases ? cases.map(v => Number(v / MILLE)) : [Number(lu / MILLE)];
      if (d.cherche === "duree") {
        if (d.arrivee % 60 >= d.depart % 60) return null;
        const faux = cases ? [Math.floor(diff100 / 100), diff100 % 100] : [diff100];
        if (faux.every((x, k) => x === lus[k])) return {erreur: 1, retour: `1${NB}h = 60${NB}min, pas 100${NB}min : je fais un bond jusqu'à ${heureTexte(pile)}.`};
        return null;
      }
      const duree = d.arrivee - d.depart;
      if (d.cherche === "arrivee" && cases) {
        const m = (d.depart % 60) + (duree % 60);
        if (m >= 60 && lus[0] === Math.floor(d.depart / 60) + Math.floor(duree / 60) && lus[1] === m) {
          return {erreur: 2, retour: `${m}${NB}min, c'est plus d'une heure : ${heureTexte(d.depart)} + ${pile - d.depart}${NB}min = ${heureTexte(pile)}.`};
        }
        return null;
      }
      if (d.cherche === "depart" && cases) {
        const f = cent(d.arrivee) - (Math.floor(duree / 60) * 100 + (duree % 60));
        if ((d.arrivee % 60) < (duree % 60) && lus[0] === Math.floor(f / 100) && lus[1] === f % 100) {
          return {erreur: 3, retour: `1${NB}h = 60${NB}min, pas 100${NB}min : je recule d'abord jusqu'à ${heureTexte(d.arrivee - (d.arrivee % 60))}.`};
        }
      }
      return null;
    }
  };

  // ================================== PALIER 2 · MES REPÈRES (lot B1-1)
  //
  // Carte v4, palier 2 (CM1) : « Mes repères de longueur » (R3), « de
  // masse » (R4), « de contenance » (R5), « Est-ce vraisemblable ? » (R6).
  // Les repères d'une étape : les siens (`reperes` de la carte : ceux qui
  // vont au carnet) et, à côté, ceux de la même grandeur appris dans « Mes
  // premiers repères » (R1). Quatre façons de demander un repère : l'unité
  // (3 choix), la valeur (3 choix, avec les nombres à virgule du CM1), la
  // valeur au pavé, « Qu'est-ce qui mesure 400 m ? » (l'objet à trouver, la
  // question cachée de l'exerciseur) ; et relier trois objets à leur mesure.
  // (Lot R1-refonte : le décimètre, la main, est un repère de R1 ; il entre
  // dans les unités de longueur.)
  const ORDRE_UNITES_2 = {longueur: ["mm", "cm", "dm", "m", "km"], masse: ["mg", "g", "kg", "t"], contenance: ["mL", "cL", "dL", "L"]};
  // Le nom court d'un repère, sous son dessin, au téléphone (relier, l'objet
  // à trouver) : deux lignes au plus.
  const COURTS_2 = {l1: "La plus petite graduation", l2: "Une pièce de 1 centime", l5: "Un tour de piste", l6: "Le viaduc du Littoral",
    l7: "St-Pierre à St-Denis", l8: "Le Piton des Neiges", l9: "La Diagonale des Fous", l10: "Mon petit doigt",
    l11: "Un très grand pas", m5: "Un pack d'eau", m8: "1 L d'eau", m9: "Une ramette", c1: "Une cuillère à café", c4: "Un chauffe-eau solaire",
    // Lot R1-refonte
    l13: "La poignée de la porte", l14: "10 terrains de foot", l15: "Ma main", m6: "Une petite voiture"};
  // (Gardés une fois calculés : les séries tirent des centaines de questions.)
  const VIVIERS_2 = {};
  function vivier2(code) {
    if (VIVIERS_2[code]) return VIVIERS_2[code];
    const e = CARTE.etape(code);
    const g = CARTE.repere(e.reperes[0]).grandeur;
    const anciens = CARTE.etape("R1").reperes.filter(c => CARTE.repere(c).grandeur === g);
    VIVIERS_2[code] = Object.freeze({nouveaux: e.reperes.slice(), anciens, tous: e.reperes.concat(anciens), grandeur: g});
    return VIVIERS_2[code];
  }
  // La mesure d'un repère, dans la plus petite unité de sa grandeur (pour
  // comparer deux repères).
  const TAILLES_2 = {};
  function taille2(r) {
    if (TAILLES_2[r.code] === undefined) TAILLES_2[r.code] = convertir(milli(r.nombre), r.unite, ORDRE_UNITES_2[r.grandeur][0]);
    return TAILLES_2[r.code];
  }
  // Deux mesures « loin » l'une de l'autre : au moins k fois plus grande.
  // (Jamais deux réponses qui pourraient toutes deux convenir : le petit
  // doigt, 1 cm, et la pièce, 1,5 cm, ne sont pas proposés ensemble.)
  function loin(a, b, k = 3n) {
    return a >= k * b || b >= k * a;
  }
  function nomCourt2(r) {
    return CARTE.typo(COURTS_2[r.code] || r.objet);
  }

  function questionRepere2(code, degre, rep, sorte, rng) {
    const r = CARTE.repere(rep);
    const v = milli(r.nombre);
    const fin = r.fin ? ` ${r.fin}` : "";
    const resume = `${r.objet} : ${r.valeur}`;
    const base = {code, degre, unite: r.unite, resume, repere: rep, outil: "reperes-unites", grandeur: r.grandeur, image: [], correction: [resume]};
    if (sorte === "saisie") {
      return q(Object.assign(base, {
        forme: "phrase", texte: CARTE.typo(`${r.debut} ${CASE}${NB}${r.unite}${fin}`),
        morceaux: {phrase: CARTE.typo(r.debut), apres: CARTE.typo(`${r.unite}${fin}`), sorte: "saisie"},
        reponse: brut(v), reponseTexte: `${ecrire(v)}${NB}${r.unite}`,
        donnees: {type: "repere", repere: rep, sorte: "saisie"},
        cle: `${code}:${rep}:saisie`
      }));
    }
    let choix;
    let texte;
    if (sorte === "unite") {
      const liste = ORDRE_UNITES_2[r.grandeur];
      const i = liste.indexOf(r.unite);
      const fenetres = [];
      for (let d = 0; d + 3 <= liste.length; d += 1) if (i >= d && i < d + 3) fenetres.push(liste.slice(d, d + 3));
      choix = melanger(rng, choisir(rng, fenetres));
      texte = `${r.debut} ${ecrire(v)} ${CASE}${fin}`;
    } else {
      // La valeur : la bonne, et deux autres à × ou ÷ 10, 100, 1 000 (l'ordre
      // de grandeur), au centième au plus (les nombres du CM1). Degré 1 :
      // loin (× 100, × 1 000) ; degré 3 : proche (× 10).
      const ks = degre === 1 ? [2, 3] : degre === 3 ? [1, 2] : [1, 2, 3];
      const candidats = [];
      ks.forEach(k => {
        const p = puissance(k);
        candidats.push(v * p);
        if (v % p === 0n) candidats.push(v / p);
      });
      const propres = candidats.filter(c => c >= 10n && c <= 100000n * MILLE && c % 10n === 0n && c !== v);
      choix = melanger(rng, [v, ...melanger(rng, propres).slice(0, 2)]).map(ecrire);
      texte = `${r.debut} ${CASE}${NB}${r.unite}${fin}`;
    }
    texte = CARTE.typo(texte);
    const bon = sorte === "unite" ? choix.indexOf(r.unite) : choix.indexOf(ecrire(v));
    return q(Object.assign(base, {
      forme: "qcm", texte, morceaux: {phrase: texte, apres: sorte === "unite" ? "" : r.unite, sorte},
      choix, bon, reponse: choix[bon], reponseTexte: `${ecrire(v)}${NB}${r.unite}`,
      donnees: {type: "repere", repere: rep, sorte},
      cle: `${code}:${rep}:${sorte}`
    }));
  }

  // « Qu'est-ce qui mesure 400 m ? » : trois repères de la même grandeur,
  // dessinés, à toucher. Les deux autres sont loin de la bonne mesure (au
  // moins 100 fois au degré 1, 10 fois au degré 2, 3 fois au degré 3) et
  // loin l'un de l'autre. La phrase reprend celle du repère (« Qu'est-ce qui
  // s'élève à environ 3 km d'altitude ? »).
  // (Lot R1-refonte : `pool`, les repères parmi lesquels chercher les deux
  // autres — à « Mes premiers repères », ceux de la même grandeur.)
  const QUOI_RESTE = {l7: "mesure environ", l10: "a une largeur d'environ", m8: "pèse", l14: "mesure environ", l15: "a une largeur d'environ"};
  function questionQuoi(code, degre, rep, rng, pool = null) {
    const r = CARTE.repere(rep);
    const t = taille2(r);
    const autres = melanger(rng, (pool || vivier2(code).tous).filter(c => c !== rep)).map(c => CARTE.repere(c));
    let deux = [];
    for (const k of [degre === 1 ? 100n : degre === 2 ? 10n : 3n, 10n, 3n]) {
      deux = [];
      autres.forEach(x => {
        if (deux.length < 2 && x.objet !== r.objet && loin(taille2(x), t, k) && deux.every(y => loin(taille2(y), taille2(x)))) deux.push(x);
      });
      if (deux.length === 2) break;
    }
    if (deux.length < 2) return null;
    const reste = QUOI_RESTE[rep] || (r.debut.startsWith(r.objet) ? r.debut.slice(r.objet.length).trim() : "mesure environ");
    const phrase = CARTE.typo(`Qu'est-ce qui ${reste} ${ecrire(milli(r.nombre))} ${r.unite}${r.fin ? ` ${r.fin}` : ""} ?`);
    const trois = melanger(rng, [r, ...deux]);
    const choix = trois.map(nomCourt2);
    const bon = trois.indexOf(r);
    return q({
      code, degre, forme: "qcm", texte: phrase,
      morceaux: {phrase, apres: "", sorte: "objets", reperes: trois.map(x => x.code)},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], unite: r.unite, grandeur: r.grandeur,
      resume: CARTE.typo(`${choix[bon]} : ${r.valeur}`), repere: rep, outil: code === "R1" ? "carte-repere" : "reperes-unites", image: [],
      correction: [`${r.objet} : ${r.valeur}`],
      donnees: {type: "repere-quoi", repere: rep, reperes: trois.map(x => x.code)},
      cle: `${code}:${rep}:quoi`
    });
  }

  // Tous les triplets possibles d'une étape (gardés une fois calculés) :
  // trois objets différents, des mesures au moins k fois plus grandes l'une
  // que l'autre, au moins un repère de l'étape.
  const TRIPLETS_2 = {};
  function triplets2(code, k) {
    const cle = `${code}:${k}`;
    if (TRIPLETS_2[cle]) return TRIPLETS_2[cle];
    const {nouveaux, tous} = vivier2(code);
    const r = tous.map(c => CARTE.repere(c));
    const ok = (x, y) => x.objet !== y.objet && loin(taille2(x), taille2(y), k);
    const liste = [];
    for (let a = 0; a < r.length; a += 1) {
      for (let b = a + 1; b < r.length; b += 1) {
        for (let c = b + 1; c < r.length; c += 1) {
          const t = [r[a], r[b], r[c]];
          if (ok(r[a], r[b]) && ok(r[a], r[c]) && ok(r[b], r[c]) && t.some(x => nouveaux.includes(x.code))) liste.push(t);
        }
      }
    }
    TRIPLETS_2[cle] = liste;
    return liste;
  }
  // Relier, au palier 2 : trois repères de la même grandeur, dont au moins
  // un de l'étape, aux mesures loin l'une de l'autre (10 fois au degré 1,
  // 3 fois ensuite).
  function questionAssocier2(code, degre, rng, eviter = []) {
    const possibles = triplets2(code, degre === 1 ? 10n : 3n);
    const libres = possibles.filter(t => !t.some(x => eviter.includes(x.code)));
    if (!possibles.length) return null;
    // (L'ordre des objets est tiré : le triplet est rangé, pas la question.)
    const trois = melanger(rng, choisir(rng, libres.length ? libres : possibles));
    const mesureDe = r => CARTE.typo(`${ecrire(milli(r.nombre))} ${r.unite}`);
    let ordreMesures = melanger(rng, [0, 1, 2]);
    while (ordreMesures.every((x, j) => x === j)) ordreMesures = melanger(rng, [0, 1, 2]);
    const mesures = ordreMesures.map(x => mesureDe(trois[x]));
    const bonnes = trois.map((r, x) => ordreMesures.indexOf(x));
    const consigne = "Relie chaque objet à sa mesure.";
    return q({
      code, degre, forme: "associer",
      texte: CARTE.typo(`${consigne} ${trois.map(r => r.objet).join(" ; ")} — ${mesures.join(" ; ")}`),
      morceaux: {phrase: consigne},
      // (Au palier 2, le nom court sur tous les écrans : « Le viaduc de la
      // Nouvelle route du Littoral » sortait de son bouton en projection.)
      objets: trois.map(r => ({texte: nomCourt2(r), repere: r.code})), mesures, bonnes,
      reponse: bonnes.join(","), reponseTexte: trois.map(r => `${r.objet} : ${mesureDe(r)}`).join(" ; "),
      resume: trois.map(r => `${r.objet} : ${mesureDe(r)}`).join(" ; "),
      reperes: trois.map(r => r.code), unites: trois.map(r => r.unite), outil: "reperes-unites", grandeur: trois[0].grandeur,
      correction: trois.map(r => `${r.objet} : ${r.valeur}`),
      donnees: {type: "associer", reperes: trois.map(r => r.code), mesures: mesures.slice()},
      cle: `${code}:assoc:${trois.map(r => r.code).sort().join("-")}`
    });
  }

  // « Qu'est-ce qui pèse le plus ? » : deux repères dessinés, à comparer
  // (programme de CM1 : comparer des masses, des contenances). Degré 1 : au
  // moins 10 fois plus ; degré 2 : 3 fois ; degré 3 : plus, sans plus (la
  // canette, 33 cL, et le verre, 20 cL). Jamais deux mesures égales.
  // (« Lequel », des deux objets : une ligne au petit téléphone, même avec
  // une police large ; sur deux lignes, la correction de Je valide passait
  // sous 80 % au petit Android.)
  const COMPARER = {longueur: ["Lequel mesure le plus ?", "Lequel mesure le moins ?"],
    masse: ["Lequel pèse le plus ?", "Lequel pèse le moins ?"],
    contenance: ["Lequel contient le plus ?", "Lequel contient le moins ?"]};
  function questionComparer(code, degre, rng, eviter = []) {
    const {tous} = vivier2(code);
    const k = degre === 1 ? 10n : degre === 2 ? 3n : 1n;
    const r = tous.map(c => CARTE.repere(c));
    const paires = [];
    r.forEach((x, a) => r.slice(a + 1).forEach(y => {
      if (x.objet !== y.objet && taille2(x) !== taille2(y) && loin(taille2(x), taille2(y), k)) paires.push([x, y]);
    }));
    if (!paires.length) return null;
    const libres = paires.filter(p => !p.some(x => eviter.includes(x.code)));
    const deux = melanger(rng, choisir(rng, libres.length ? libres : paires));
    const plus = rng() < 0.5;
    const gagnant = (taille2(deux[0]) > taille2(deux[1])) === plus ? deux[0] : deux[1];
    const autre = gagnant === deux[0] ? deux[1] : deux[0];
    const phrase = CARTE.typo(COMPARER[gagnant.grandeur][plus ? 0 : 1]);
    const choix = deux.map(nomCourt2);
    const bon = deux.indexOf(gagnant);
    return q({
      code, degre, forme: "qcm", texte: phrase,
      morceaux: {phrase, apres: "", sorte: "objets", compare: true, reperes: deux.map(x => x.code)},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], unite: gagnant.unite, grandeur: gagnant.grandeur,
      resume: CARTE.typo(`${choix[bon]} : ${gagnant.valeur}`), repere: gagnant.code, reperes: deux.map(x => x.code), outil: "reperes-unites", image: [],
      correction: [`${gagnant.objet} : ${gagnant.valeur}`, `${autre.objet} : ${autre.valeur}`],
      donnees: {type: "repere-comparer", reperes: deux.map(x => x.code), plus},
      cle: `${code}:cmp:${deux.map(x => x.code).sort().join("-")}:${plus ? "plus" : "moins"}`
    });
  }

  // Une étape de repères du CM1. Je valide : l'objet à trouver en 3e et en
  // 8e, la valeur au pavé en 6e, relier en dernier ; chaque repère de
  // l'étape y est demandé au moins une fois (les 7 repères de longueur, les
  // 4 de masse, les 3 de contenance), ceux de « Mes premiers repères »
  // complètent. Un repère ne revient pas dans Je valide quand il y en a 9
  // ou plus ; sinon deux fois au plus (avec une autre façon de demander),
  // jamais à moins de 3 questions d'écart.
  function etapeReperes2(code) {
    // `reperes` : relier et comparer en ont plusieurs ; ils ne comptent pas
    // comme « le repère demandé » (`seul`).
    const reps = x => x.reperes || [x.repere];
    const seul = x => !x.reperes;
    return {
      exclureExemples: false,
      formes(usage) {
        if (usage === "valide") return {2: "quoi", 4: "comparer", 5: "saisie", 7: "quoi", 9: "associer"};
        // (Comparer n'est jamais juste avant relier : avec 5 repères de
        // contenance, il ne resterait plus trois repères à relier.)
        if (usage === "entraine") return {2: "quoi", 4: "comparer", 7: "associer", 11: "comparer", 13: "quoi", 15: "associer", 18: "comparer", 20: "quoi", 22: "associer", 24: "comparer"};
        return {};
      },
      jamais(serie, question, usage) {
        const {tous} = vivier2(code);
        // (Avec moins de 8 repères, la contenance : pas deux fois de suite.)
        const proche = tous.length >= 8 ? 4 : 1;
        if (!seul(question)) {
          return usage === "valide" || !serie.slice(tous.length >= 8 ? -2 : -1).some(y => reps(y).some(c => question.reperes.includes(c)));
        }
        if (serie.slice(-proche).some(y => reps(y).includes(question.repere))) return false;
        if (usage === "entraine" || usage === "exerciseur") return true;
        const max = tous.length >= 9 ? 1 : 2;
        return serie.filter(y => seul(y) && y.repere === question.repere).length < max;
      },
      // (Lot R1-refonte : « Mes repères de longueur » a 10 repères, plus que
      // les 8 places d'un repère seul : 8 différents au moins.)
      valide(serie, usage) {
        if (usage !== "valide") return true;
        const demandes = new Set(serie.filter(seul).map(x => x.repere));
        const {nouveaux} = vivier2(code);
        return nouveaux.filter(c => demandes.has(c)).length >= Math.min(8, nouveaux.length);
      },
      tirer(rng, degre, i, usage, forme, serie = []) {
        const {nouveaux, tous} = vivier2(code);
        if (forme === "associer") return questionAssocier2(code, degre, rng, serie.slice(-4).flatMap(reps));
        if (forme === "comparer") return questionComparer(code, degre, rng, serie.slice(-2).flatMap(reps));
        let choisis = tous;
        if (usage === "valide") {
          const deja = new Set(serie.filter(seul).map(x => x.repere));
          const manquent = nouveaux.filter(c => !deja.has(c));
          // (Les places libres : 10, moins relier et comparer, moins celles déjà prises.)
          const restent = 8 - serie.filter(seul).length;
          if (manquent.length && (manquent.length >= restent || rng() < 0.7)) choisis = manquent;
        } else if (rng() < 0.6) choisis = nouveaux;
        const rep = choisir(rng, choisis);
        // (Ailleurs qu'aux places prévues, l'objet à trouver une fois sur cinq,
        // sauf dans Je valide.)
        if (forme === "quoi" || (!forme && usage !== "valide" && rng() < 0.2)) return questionQuoi(code, degre, rep, rng);
        const sorte = forme === "saisie" ? "saisie" : degre === 1 ? "unite"
          : degre === 3 ? choisir(rng, ["valeur", "saisie"]) : choisir(rng, ["unite", "valeur", "saisie"]);
        return questionRepere2(code, degre, rep, sorte, rng);
      }
    };
  }
  ETAPES.R3 = etapeReperes2("R3");
  ETAPES.R4 = etapeReperes2("R4");
  ETAPES.R5 = etapeReperes2("R5");

  // --------------------------------------------- R6 · Est-ce vraisemblable ?
  // Carte v4 : juger une mesure (« Un lit mesure 2 cm de long. »), Oui ou Non
  // à parts égales ; la mesure fausse change d'unité dans la même grandeur
  // (jamais « un œuf de 60 km », le défaut de l'exerciseur), ou c'est une
  // erreur des documents officiels (la trousse de 10 kg, le kiwi de 2 kg, le
  // bigorneau de 16,8 kg, Paris–New York à 800 km). Et « Quelle mesure est
  // vraisemblable ? » (« Une trousse mesure plutôt 2 cm, 20 cm ou 2 m ? »,
  // programme du cycle 2). Les fausses sont toutes au moins dix fois trop
  // grandes ou trop petites.
  // [début de la phrase, la vraie mesure, les fausses, la fin, degré, La Réunion ?]
  const VRAISEMBLANCE = [
    // Les exemples de On te montre (degré 0) : jamais dans une série.
    ["Un lit mesure", ["2", "m"], [["2", "cm"], ["2", "km"]], "de long", 0],
    ["Ma trousse pèse environ", ["300", "g"], [["10", "kg"], ["300", "kg"]], "", 0],
    ["Un seau contient environ", ["10", "L"], [["10", "mL"], ["10", "cL"]], "", 0],
    // Longueurs
    ["Une trousse mesure", ["20", "cm"], [["2", "cm"], ["20", "m"], ["2", "m"]], "de long", 1],
    ["Un crayon mesure", ["15", "cm"], [["15", "m"], ["15", "mm"], ["15", "km"]], "", 1],
    ["Une porte mesure", ["2", "m"], [["2", "cm"], ["2", "km"], ["20", "m"]], "de haut", 1],
    ["Un cahier mesure", ["17", "cm"], [["17", "m"], ["17", "mm"], ["17", "km"]], "de large", 1],
    ["Un Car Jaune mesure", ["12", "m"], [["12", "cm"], ["12", "km"], ["120", "m"]], "de long", 2, true],
    ["Une fourmi mesure", ["5", "mm"], [["5", "cm"], ["5", "m"], ["50", "cm"]], "", 2],
    ["Une voiture mesure", ["4,5", "m"], [["4,5", "cm"], ["4,5", "km"], ["45", "m"]], "de long", 2],
    ["Le tour de La Réunion en voiture fait environ", ["200", "km"], [["200", "m"], ["2 000", "km"], ["200", "cm"]], "", 2, true],
    ["Un bassin de baignade mesure", ["25", "m"], [["25", "cm"], ["25", "km"], ["25", "mm"]], "de long", 2, true],
    ["Un enfant de 9 ans mesure environ", ["1,3", "m"], [["1,3", "cm"], ["13", "m"], ["1,3", "km"]], "", 2],
    ["La salle de classe mesure environ", ["6", "m"], [["6", "cm"], ["6", "km"], ["60", "m"]], "de large", 2],
    ["Le pied d'un adulte mesure environ", ["30", "cm"], [["30", "m"], ["30", "mm"], ["3", "m"]], "", 2],
    ["Une coccinelle mesure", ["7", "mm"], [["7", "cm"], ["7", "m"], ["70", "cm"]], "", 3],
    ["Le Piton de la Fournaise s'élève à environ", ["2 600", "m"], [["2 600", "km"], ["2 600", "cm"], ["26", "m"]], "d'altitude", 3, true],
    ["De Paris à New York, il y a environ", ["5 800", "km"], [["800", "km"], ["5 800", "m"], ["58", "km"]], "", 3],
    ["Une feuille de bananier mesure environ", ["2", "m"], [["2", "cm"], ["2", "km"], ["2", "mm"]], "de long", 3, true],
    ["Un cahier a une épaisseur d'environ", ["8", "mm"], [["8", "cm"], ["8", "m"], ["80", "cm"]], "", 3],
    // Masses
    ["Un chat pèse", ["4", "kg"], [["4", "g"], ["4", "t"], ["40", "kg"]], "", 1],
    ["Une pomme pèse", ["150", "g"], [["150", "kg"], ["150", "mg"], ["15", "kg"]], "", 1],
    ["Un éléphant pèse environ", ["5", "t"], [["5", "kg"], ["5", "g"], ["50", "kg"]], "", 1],
    ["Un cartable pèse environ", ["4", "kg"], [["4", "g"], ["4", "t"], ["40", "kg"]], "", 1],
    ["Un samoussa pèse environ", ["50", "g"], [["50", "kg"], ["50", "mg"], ["5", "kg"]], "", 2, true],
    ["Un kiwi pèse environ", ["100", "g"], [["2", "kg"], ["100", "kg"], ["100", "mg"]], "", 2],
    ["Un sac de letchis pèse", ["2", "kg"], [["2", "g"], ["2", "t"], ["2", "mg"]], "", 2, true],
    ["Un œuf pèse environ", ["60", "g"], [["60", "kg"], ["60", "mg"], ["6", "kg"]], "", 2],
    ["Un bigorneau pèse environ", ["15", "g"], [["16,8", "kg"], ["15", "kg"], ["15", "t"]], "", 3, true],
    ["Un régime de bananes pèse environ", ["20", "kg"], [["20", "g"], ["20", "t"], ["2", "t"]], "", 3, true],
    ["Une baleine à bosse pèse environ", ["30", "t"], [["30", "kg"], ["30", "g"], ["300", "kg"]], "", 3, true],
    ["Une plaquette de beurre pèse", ["250", "g"], [["250", "kg"], ["250", "mg"], ["25", "kg"]], "", 3],
    // Contenances
    ["Un verre contient environ", ["20", "cL"], [["20", "L"], ["20", "mL"], ["2", "L"]], "", 1],
    ["Une bouteille de jus de goyavier contient", ["1", "L"], [["1", "mL"], ["1", "cL"], ["100", "L"]], "", 1, true],
    ["Une canette de jus contient", ["33", "cL"], [["33", "L"], ["33", "mL"], ["3,3", "L"]], "", 1],
    ["Une baignoire contient environ", ["150", "L"], [["150", "cL"], ["150", "mL"], ["15", "cL"]], "", 2],
    ["Une marmite de cari contient environ", ["5", "L"], [["5", "mL"], ["5", "cL"], ["500", "L"]], "", 2, true],
    ["Une cuillère à soupe contient", ["15", "mL"], [["15", "L"], ["15", "cL"], ["1,5", "L"]], "", 3],
    ["Le réservoir d'une voiture contient environ", ["50", "L"], [["50", "cL"], ["50", "mL"], ["5", "cL"]], "", 3],
    ["Un pot de yaourt contient environ", ["12", "cL"], [["12", "L"], ["12", "mL"], ["1,2", "L"]], "", 3]
  ];
  const TROP = {longueur: ["beaucoup trop court", "beaucoup trop long"], masse: ["beaucoup trop léger", "beaucoup trop lourd"],
    contenance: ["bien trop peu", "bien trop"]};
  // Les repères connus à la fin du palier 2 : R1 et les trois étapes de
  // repères du CM1. L'aide de R6 en montre un, le plus proche de la vraie
  // mesure (jamais celui qui la donne).
  function repereProche(grandeur, vraie) {
    const codes = ["R1", "R3", "R4", "R5"].flatMap(c => CARTE.etape(c).reperes).filter(c => CARTE.repere(c).grandeur === grandeur);
    const v = Number(vraie);
    let meilleur = null;
    let ecart = Infinity;
    codes.forEach(c => {
      const t = Number(taille2(CARTE.repere(c)));
      if (t === v) return;
      const e = Math.abs(Math.log(t / v));
      if (e < ecart) { ecart = e; meilleur = c; }
    });
    return meilleur;
  }
  function phraseMesure(s, [n, u]) {
    return CARTE.typo(`${s[0]} ${n} ${u}${s[3] ? ` ${s[3]}` : ""}.`);
  }
  function questionVraisemblance(degre, rng, i, sorte) {
    const s = VRAISEMBLANCE[i];
    const [n, u] = s[1];
    const g = grandeurDe(u);
    const vraie = convertir(milli(n), u, ORDRE_UNITES_2[g][0]);
    const P = phraseMesure(s, s[1]);
    const proche = repereProche(g, vraie);
    const rp = CARTE.repere(proche);
    const ligneRepere = CARTE.typo(`Mon repère : ${rp.objet[0].toLowerCase()}${rp.objet.slice(1)}, ${rp.valeur}.`);
    const unites = [...new Set([u, ...s[2].map(x => x[1])])];
    const base = {code: "R6", degre, unite: u, grandeur: g, unites, outil: "reperes-unites", repereProche: proche, image: [ligneRepere],
      cache: `${n.replace(/\s/g, "")}${u}`, cleBase: `R6:${i}`};
    if (sorte === "choix") {
      const deux = melanger(rng, s[2]).slice(0, 2);
      const mesures = [s[1], ...deux].map(([a, b]) => CARTE.typo(`${a} ${b}`));
      const choix = melanger(rng, mesures);
      const phrase = CARTE.typo(`${s[0]} ${CASE}${s[3] ? ` ${s[3]}.` : ""}`);
      const bon = choix.indexOf(mesures[0]);
      return q(Object.assign(base, {
        forme: "qcm", texte: CARTE.typo(`${phrase} Quelle mesure est vraisemblable ?`),
        morceaux: {phrase, apres: "", sorte: "mesure", consigne: CARTE.typo("Quelle mesure est vraisemblable ?")},
        choix, bon, reponse: choix[bon], reponseTexte: choix[bon], resume: P, correction: [P, ligneRepere],
        donnees: {type: "vraisemblance", situation: i, sorte: "choix", montre: choix.map(c => c.replace(/[  ]/g, " "))},
        cle: `R6:${i}:choix`
      }));
    }
    const vrai = sorte === "oui";
    const montre = vrai ? s[1] : choisir(rng, s[2]);
    const phrase = phraseMesure(s, montre);
    const fausse = convertir(milli(montre[0]), montre[1], ORDRE_UNITES_2[g][0]);
    const raison = vrai ? "Oui : c'est vraisemblable." : CARTE.typo(`Non : ${montre[0]} ${montre[1]}, c'est ${TROP[g][fausse > vraie ? 1 : 0]}.`);
    return q(Object.assign(base, {
      forme: "vrai-faux", texte: CARTE.typo(`${phrase} Est-ce vraisemblable ?`),
      morceaux: {phrase},
      choix: ["Oui", "Non"], bon: vrai ? 0 : 1, reponse: vrai ? "Oui" : "Non", reponseTexte: vrai ? "Oui" : "Non",
      resume: `${phrase} ${vrai ? "Vraisemblable." : "Pas vraisemblable."}`,
      correction: vrai ? [raison, ligneRepere] : [raison, P],
      donnees: {type: "vraisemblance", situation: i, sorte: vrai ? "oui" : "non", montre: `${montre[0]} ${montre[1]}`},
      cle: `R6:${i}:${montre[0]}${montre[1]}`.replace(/\s/g, "")
    }));
  }
  ETAPES.R6 = {
    clesExemples: ["R6:0", "R6:1", "R6:2"],
    // Je valide : « Quelle mesure ? » en 4e et en 8e, et 4 Oui, 4 Non dans
    // un ordre tiré ; À toi : « Quelle mesure ? » une fois sur cinq, 10 Oui
    // et 10 Non.
    formes(usage, rng) {
      const melangeOuiNon = n => melanger(rng, [...Array(n).fill("oui"), ...Array(n).fill("non")]);
      const f = {};
      if (usage === "valide") {
        const on = melangeOuiNon(4);
        [0, 1, 2, 4, 5, 6, 8, 9].forEach((p, k) => { f[p] = on[k]; });
        f[3] = "choix";
        f[7] = "choix";
      } else if (usage === "entraine") {
        const on = melangeOuiNon(10);
        let k = 0;
        for (let p = 0; p < 25; p += 1) f[p] = p % 5 === 4 ? "choix" : on[k++];
      }
      return f;
    },
    // Dans Je valide, les trois grandeurs (deux au moins de chacune).
    valide(serie, usage) {
      if (usage !== "valide") return true;
      return ["longueur", "masse", "contenance"].every(g => serie.filter(x => x.grandeur === g).length >= 2);
    },
    accepte(serie, question, usage) {
      return usage !== "valide" || serie.filter(x => x.grandeur === question.grandeur).length < 4;
    },
    tirer(rng, degre, i, usage, forme) {
      const vivier = VRAISEMBLANCE.map((s, k) => [s, k]).filter(([s]) => s[4] === degre);
      const [, k] = choisir(rng, vivier);
      const sorte = forme || (rng() < 0.2 ? "choix" : rng() < 0.5 ? "oui" : "non");
      return questionVraisemblance(degre, rng, k, sorte);
    }
  };

  // ===================================================== palier 2 (lot B1-2)
  // Préfixes et relations (carte v4) : « Ce que veulent dire les préfixes »
  // (P2), « Deux unités voisines » (P3), « Toutes les relations à
  // connaître » (P4). Les unités du CM1 : du mm au km, du mg à la tonne, du
  // mL au hL (programme de CM1 2025). Pas de tableau de conversion (S002) :
  // la relation, le sens du préfixe, le glisse-unité (toutes ses colonnes).
  // L'outil : le glisse-unité ; l'image : l'échelle des unités de la
  // grandeur, les deux unités en jeu marquées, et « Chaque unité vaut 10
  // fois celle de droite. » (jamais la réponse : l'élève compte les pas).
  // Les mauvaises réponses au choix sont les erreurs connues : « 1 m,
  // c'est 100 fois 1 dm » (23,6 % à l'entrée en 6e), hecto lu comme centi,
  // déca comme déci, kilo comme milli, « 1 hm = 10 m » (unités voisines
  // supposées), « 1 hm = 1 000 m » (hm confondu avec km), « 1 cm = 10 dm »
  // (le sens), « 1 cm = 0,01 dm » (le centième).
  const PREFIXES = [
    {nom: "kilo", sym: "k", e: 3, sens: "mille", piege: "milli"},
    {nom: "hecto", sym: "h", e: 2, sens: "cent", piege: "centi"},
    {nom: "déca", sym: "da", e: 1, sens: "dix", piege: "déci"},
    {nom: "déci", sym: "d", e: -1, sens: "un dixième", piege: "déca"},
    {nom: "centi", sym: "c", e: -2, sens: "un centième", piege: "hecto"},
    {nom: "milli", sym: "m", e: -3, sens: "un millième", piege: "kilo"}
  ];
  const PREFIXE = {};
  PREFIXES.forEach(p => { PREFIXE[p.nom] = p; });
  const BASES = {longueur: "m", masse: "g", contenance: "L"};
  const GRANDEURS_CM1 = ["longueur", "masse", "contenance"];
  // L'unité d'un préfixe dans une grandeur (« hecto », contenance → hL), si
  // elle est au programme du CM1 (pas de kL).
  function unitePrefixe(p, grandeur) {
    const u = p.sym + BASES[grandeur];
    return grandeurDe(u) === grandeur ? u : null;
  }
  function prefixeDe(u) {
    const g = grandeurDe(u);
    return PREFIXES.find(p => unitePrefixe(p, g) === u) || null;
  }
  // Les unités du CM1 d'une grandeur, de la plus grande à la plus petite
  // (l'échelle de l'image ; la tonne à part).
  function echelleDe(grandeur) {
    return COLONNES_CM1[grandeur];
  }
  const NOUVELLES_CM1 = ["hm", "dam", "hg", "dag", "dg", "cg", "mg", "hL", "daL", "mL"];
  const REGLE_ECHELLE = "Chaque unité vaut 10 fois celle de droite.";
  function lignesEchelle(grandeur) {
    return [echelleDe(grandeur).join(" · "), REGLE_ECHELLE];
  }
  // Une phrase : « 1 hectomètre », « 0,4 millimètre », « 3 décimètres ».
  function enMots(valeur, u) {
    return `${ecrire(valeur)}${NB}${valeur < 2n * MILLE ? MOT[u] : MOTS[u]}`;
  }

  // Une relation posée au pavé (« 1 hm = … m ») ou en phrase (« 1 hectomètre,
  // c'est combien de mètres ? » : les noms entiers, pour lire le préfixe).
  function questionRel(code, degre, ecrit, valeur, de, vers, extra = {}) {
    const rep = convertir(valeur, de, vers);
    if (rep === null) return null;
    const [g, p] = exposant(de) > exposant(vers) ? [de, vers] : [vers, de];
    const gauche = mes(valeur, de);
    const resume = `${gauche} = ${mes(rep, vers)}`;
    const relation = relationTexte(g, p);
    let texte;
    let morceaux;
    if (ecrit === "phrase") {
      // (« combien d'hectolitres » : le h de hecto est muet.)
      const phrase = `${enMots(valeur, de)}, c'est combien ${/^h/.test(MOTS[vers]) ? "d'" : "de "}${MOTS[vers]}${NB}?`;
      texte = phrase;
      morceaux = {phrase, apres: vers};
    } else {
      texte = `${gauche} = ${CASE}${NB}${vers}`;
      morceaux = {avant: `${gauche} =`, apres: vers};
    }
    const grandeur = grandeurDe(g);
    return q(Object.assign({
      code, degre, forme: ecrit === "phrase" ? "phrase" : "nombre", texte, morceaux,
      reponse: brut(rep), reponseTexte: mes(rep, vers), unite: vers, resume,
      // L'outil ne recopie pas la relation au-dessus du glisse-unité : elle
      // EST la réponse (comme à P1).
      relation, outil: "glisse-unite", glisse: glisse(valeur, de, vers, {cm1: true}), outilSansRelation: true,
      echelle: {grandeur, marque: [de, vers]}, image: lignesEchelle(grandeur),
      correction: resume === relation ? [relation] : [relation, `donc ${resume}`],
      grandeur, relationCle: `${g}-${p}`,
      donnees: {type: "conv", valeur: brut(valeur), de, vers},
      cle: `${code}:${brut(valeur)}${de}>${vers}:${ecrit === "phrase" ? "p" : "n"}`
    }, extra));
  }

  // Le pourquoi d'une erreur au pavé (P2, P3, P4) : le sens d'abord (« Je
  // prévois » suit), puis le nombre gardé, puis un zéro de trop ou de moins.
  function erreursRel(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "conv") return null;
    const v = milli(d.valeur);
    const attendu = milli(question.reponse);
    const bas = exposant(d.de) > exposant(d.vers);
    const f = bas ? facteur(d.de, d.vers) : facteur(d.vers, d.de);
    if (bas && v % f === 0n && lu === v / f) return {erreur: 1, retour: "Tu as divisé. Vers une unité plus petite, je multiplie."};
    if (!bas && lu === v * f) return {erreur: 3, retour: "Tu as multiplié. Vers une unité plus grande, je divise."};
    // (Une ligne au petit téléphone : la correction, juste au-dessus, dit
    // déjà la relation ; avec deux lignes, le panneau de « À toi » passait à
    // 77 % au petit iPhone.)
    if (lu === v) return {erreur: 4, retour: `${mes(v, d.de)}, ce n'est pas ${mes(v, d.vers)}.`};
    if (lu === attendu * 10n) return {erreur: 2, retour: "Un zéro de trop."};
    if (lu * 10n === attendu) return {erreur: 2, retour: "Un zéro de moins."};
    return null;
  }

  // Une relation au choix (« 1 hm = … m » : 10, 100 ou 1 000). Les fausses
  // sont données. Le pourquoi d'un mauvais choix tient sur une ligne au
  // petit téléphone (la place des réponses est petite) : l'unité que ce
  // choix ferait (« 10 m, c'est 1 dam. », « 0,01 hL, c'est 1 L. »).
  function uniteDe(y, vers) {
    return echelleDe(grandeurDe(vers)).find(u => u && convertir(MILLE, u, vers) === y) || null;
  }
  function enChoixRel(x, faux, rng) {
    if (!x) return null;
    const d = x.donnees;
    const rep = milli(x.reponse);
    const propres = faux.filter((y, k) => y !== null && y > 0n && y !== rep && faux.indexOf(y) === k);
    if (propres.length < 2) return null;
    const choix = melanger(rng, [rep, ...propres.slice(0, 2)]).map(ecrire);
    const bon = choix.indexOf(ecrire(rep));
    const pourquoi = {};
    choix.forEach((c, k) => {
      if (k === bon) return;
      const y = milli(c.replace(new RegExp(FINE, "g"), ""));
      const u = uniteDe(y, d.vers);
      // (Le sens d'abord : « 1 dm est plus petit que 1 m. »)
      const e = erreursRel(x, y);
      if (e && (e.erreur === 1 || e.erreur === 3)) pourquoi[k] = `1${NB}${d.de} est plus ${e.erreur === 1 ? "grand" : "petit"} que 1${NB}${d.vers}.`;
      else if (u) pourquoi[k] = `${mes(y, d.vers)}, c'est 1${NB}${u}.`;
      else pourquoi[k] = y > rep ? "Un zéro de trop." : "Un zéro de moins.";
    });
    const phrase = `${mes(milli(d.valeur), d.de)} = ${CASE}${NB}${d.vers}`;
    return Object.assign(x, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: d.vers, sorte: "valeur"},
      choix, bon, pourquoi, cle: `${x.cle}:q`
    });
  }

  // « 1 m, c'est combien de fois 1 dm ? » (évaluation de début de 6e 2024 :
  // 59,8 % de réussite, 23,6 % répondent « 100 fois ») ; « 1 hm, c'est
  // combien de fois 1 m ? » (positionnement de 6e). Quatre réponses : 10,
  // 100, 1 000, 10 000 fois. Le pourquoi : le sens du préfixe, ou la
  // relation de chaque unité avec la base.
  const FOIS = [10n, 100n, 1000n, 10000n];
  // Le pourquoi d'un mauvais nombre de fois : l'unité qu'il ferait
  // (« 100 cm font 1 m. »), sinon trop ou trop peu.
  function pourquoiFois(g, p, F) {
    const u = echelleDe(grandeurDe(g)).find(x => x && exposant(x) < exposant(g) && facteur(g, x) === F);
    // (Une ligne au petit téléphone, même avec une police large.)
    if (u) return `${ecrire(F * MILLE)} ${u} font 1 ${g}.`;
    return F > facteur(g, p) ? "C'est beaucoup trop de fois." : "C'est trop peu de fois.";
  }
  function questionFoisCM1(code, degre, g, p) {
    const f = facteur(g, p);
    const choix = FOIS.map(n => `${ecrire(n * MILLE)} fois`);
    const bon = FOIS.indexOf(f);
    const pourquoi = {};
    FOIS.forEach((n, k) => { if (k !== bon) pourquoi[k] = CARTE.typo(pourquoiFois(g, p, n)); });
    const phrase = CARTE.typo(`1 ${g}, c'est combien de fois 1 ${p} ?`);
    const grandeur = grandeurDe(g);
    return q({
      code, degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "fois"},
      choix, bon, pourquoi, reponse: choix[bon], reponseTexte: CARTE.typo(`${choix[bon]} 1 ${p}`), unite: null,
      resume: CARTE.typo(`1 ${g} = ${choix[bon]} 1 ${p}`),
      relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(MILLE, g, p, {cm1: true}), outilSansRelation: true,
      echelle: {grandeur, marque: [g, p]}, image: lignesEchelle(grandeur),
      correction: [relationTexte(g, p), CARTE.typo(`Il faut ${choix[bon]} 1 ${p} pour faire 1 ${g}.`)],
      grandeur, relationCle: `${g}-${p}`,
      donnees: {type: "fois", grande: g, petite: p},
      cle: `${code}:${g}-${p}:f`
    });
  }

  // Relier trois relations (P4 ; comme P1, avec les unités du CM1).
  // Degré 2 : trois grandeurs ; degré 3 : la même grandeur.
  function questionRelierCM1(code, degre, rng, vivier) {
    for (let essai = 0; essai < 60; essai += 1) {
      let liste = vivier;
      if (degre === 3) {
        const gr = choisir(rng, GRANDEURS_CM1);
        liste = vivier.filter(([g]) => grandeurDe(g) === gr);
      }
      const trois = melanger(rng, liste).slice(0, 3);
      if (trois.length < 3) continue;
      const gauches = trois.map(([g]) => `1${NB}${g}`);
      const droites = trois.map(([g, p]) => mes(facteur(g, p) * MILLE, p));
      const grandeurs = new Set(trois.map(([g]) => grandeurDe(g)));
      if (new Set(gauches).size < 3 || new Set(droites).size < 3 || (degre !== 3 && grandeurs.size < 3)) continue;
      // (Au degré 3, deux nombres égaux au moins une fois sur deux : « 1 hm »
      // et « 1 dag » ne se relient pas au nombre seul.)
      let ordre = melanger(rng, [0, 1, 2]);
      while (ordre.every((k, j) => k === j)) ordre = melanger(rng, [0, 1, 2]);
      const mesures = ordre.map(k => droites[k]);
      const bonnes = trois.map((x, k) => ordre.indexOf(k));
      const consigne = "Relie chaque unité à sa valeur.";
      const lignes = trois.map(([g, p]) => relationTexte(g, p));
      const grandeur = grandeurs.size === 1 ? [...grandeurs][0] : null;
      return q({
        code, degre, forme: "associer", texte: `${consigne} ${gauches.join(" ; ")} — ${mesures.join(" ; ")}`,
        morceaux: {phrase: consigne}, objets: gauches.map(t => ({texte: t})), mesures, bonnes,
        reponse: bonnes.join(","), reponseTexte: lignes.join(" ; "), resume: lignes.join(" ; "),
        relation: lignes.join(" ; "), outil: null, outilSansRelation: true, relationCle: "relier",
        // (L'échelle sans unité marquée : trois relations en marqueraient six.)
        echelle: grandeur ? {grandeur, marque: []} : {grandeurs: [...grandeurs], marque: []},
        image: grandeur ? lignesEchelle(grandeur) : [REGLE_ECHELLE],
        correction: lignes, grandeur,
        donnees: {type: "associer-rel", paires: trois.map(x => x.slice()), mesures: mesures.slice()},
        cle: `${code}:a:${trois.map(([g, p]) => `${g}-${p}`).sort().join("+")}`
      });
    }
    return null;
  }

  // Dans Je valide, jamais deux fois la même relation ; ailleurs, pas deux
  // fois de suite à trois questions près.
  function uneRelationUneFois(serie, question, usage) {
    if (!question.relationCle || question.relationCle === "relier") return true;
    if (usage === "valide") return !serie.some(x => x.relationCle === question.relationCle);
    return !serie.slice(-3).some(x => x.relationCle === question.relationCle);
  }
  function troisGrandeurs(serie) {
    return GRANDEURS_CM1.every(g => serie.some(x => x.grandeur === g));
  }

  // --------------------------------- P2 · Ce que veulent dire les préfixes
  // 17 faits (6 préfixes, 3 grandeurs, pas de kL) : « 1 hm = 100 m »,
  // « 1 g = 1 000 mg ». Une étape par cœur : on varie la façon de
  // demander — le sens du préfixe (« Dans hectolitre, que veut dire
  // hecto ? »), le préfixe d'un sens (« Quel préfixe veut dire cent ? »,
  // avec le piège : centi), le calcul, la phrase, « combien de fois ? »,
  // relier trois préfixes à leur sens.
  // [grande, petite, l'unité qui porte le préfixe]
  const FAITS_P2 = [];
  GRANDEURS_CM1.forEach(gr => PREFIXES.forEach(p => {
    const u = unitePrefixe(p, gr);
    if (u) FAITS_P2.push(p.e > 0 ? [u, BASES[gr], u] : [BASES[gr], u, u]);
  }));
  // Les préfixes que l'élève connaît déjà (kilo, centi, milli du palier 1).
  const CONNUS = ["kilo", "centi", "milli"];

  function questionSens(code, degre, p, grandeur, rng) {
    const u = unitePrefixe(p, grandeur);
    const piege = PREFIXE[p.piege];
    const autre = choisir(rng, PREFIXES.filter(x => (x.e > 0) === (p.e > 0) && x !== p));
    const trois = melanger(rng, [p, piege, autre]);
    const choix = trois.map(x => x.sens);
    const bon = trois.indexOf(p);
    const pourquoi = {};
    // (Une ligne : ce que veut dire le choix touché ; la correction dit le reste.)
    trois.forEach((x, k) => { if (k !== bon) pourquoi[k] = `${x.sens[0].toUpperCase()}${x.sens.slice(1)}, c'est ${x.nom}.`; });
    const phrase = CARTE.typo(`Dans « ${MOT[u]} », que veut dire ${p.nom} ?`);
    const [g, pe] = p.e > 0 ? [u, BASES[grandeur]] : [BASES[grandeur], u];
    return q({
      code, degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "mots"},
      choix, bon, pourquoi, reponse: p.sens, reponseTexte: p.sens, unite: null,
      resume: CARTE.typo(`Dans ${MOT[u]}, ${p.nom} veut dire ${p.sens}`),
      relation: relationTexte(g, pe), outil: null, outilSansRelation: true,
      echelle: {grandeur, marque: [u, BASES[grandeur]]}, image: lignesEchelle(grandeur),
      correction: [CARTE.typo(`${p.nom} veut dire ${p.sens}.`), relationTexte(g, pe)],
      grandeur, relationCle: `${g}-${pe}`,
      donnees: {type: "prefixe-sens", prefixe: p.nom, unite: u},
      cle: `${code}:s:${u}`
    });
  }
  function questionNomPrefixe(code, degre, p, rng) {
    const piege = PREFIXE[p.piege];
    const autre = choisir(rng, PREFIXES.filter(x => (x.e > 0) === (p.e > 0) && x !== p));
    const trois = melanger(rng, [p, piege, autre]);
    const choix = trois.map(x => x.nom);
    const bon = trois.indexOf(p);
    const pourquoi = {};
    trois.forEach((x, k) => { if (k !== bon) pourquoi[k] = `${x.nom} veut dire ${x.sens}.`; });
    const phrase = CARTE.typo(`Quel préfixe veut dire ${p.sens} ?`);
    const grandeur = choisir(rng, GRANDEURS_CM1.filter(gr => unitePrefixe(p, gr)));
    const u = unitePrefixe(p, grandeur);
    const [g, pe] = p.e > 0 ? [u, BASES[grandeur]] : [BASES[grandeur], u];
    return q({
      code, degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "mots"},
      choix, bon, pourquoi, reponse: p.nom, reponseTexte: p.nom, unite: null,
      resume: CARTE.typo(`Le préfixe qui veut dire ${p.sens} : ${p.nom}`),
      relation: relationTexte(g, pe), outil: null, outilSansRelation: true,
      echelle: {grandeur, marque: [BASES[grandeur]]}, image: lignesEchelle(grandeur),
      correction: [CARTE.typo(`${p.nom} veut dire ${p.sens} : ${relationTexte(g, pe)}`)],
      grandeur, relationCle: `${g}-${pe}`,
      donnees: {type: "prefixe-nom", prefixe: p.nom},
      cle: `${code}:n:${p.nom}`
    });
  }
  // Relier trois préfixes à leur sens. Degré 3 : deux préfixes qui se
  // confondent (déca et déci, hecto et centi, kilo et milli).
  function questionRelierPrefixes(code, degre, rng) {
    let trois;
    if (degre === 3) {
      const p = choisir(rng, PREFIXES);
      trois = [p, PREFIXE[p.piege], choisir(rng, PREFIXES.filter(x => x !== p && x.nom !== p.piege))];
    } else trois = melanger(rng, PREFIXES).slice(0, 3);
    trois = melanger(rng, trois);
    let ordre = melanger(rng, [0, 1, 2]);
    while (ordre.every((k, j) => k === j)) ordre = melanger(rng, [0, 1, 2]);
    // (Sans « un » : « un centième » sortait de son bouton au téléphone.)
    const court = x => x.sens.replace(/^un /, "");
    const mesures = ordre.map(k => court(trois[k]));
    const bonnes = trois.map((x, k) => ordre.indexOf(k));
    const consigne = "Relie chaque préfixe à son sens.";
    const lignes = trois.map(x => `${x.nom} : ${court(x)}`);
    return q({
      code, degre, forme: "associer", texte: `${consigne} ${trois.map(x => x.nom).join(" ; ")} — ${mesures.join(" ; ")}`,
      morceaux: {phrase: consigne, mots: true}, objets: trois.map(x => ({texte: x.nom})), mesures, bonnes,
      reponse: bonnes.join(","), reponseTexte: lignes.join(" ; "), resume: lignes.join(" ; "),
      relation: lignes.join(" ; "), outil: null, outilSansRelation: true, relationCle: "relier",
      echelle: {grandeur: "longueur", marque: ["m"]}, image: lignesEchelle("longueur"),
      correction: lignes, grandeur: null,
      donnees: {type: "associer-pref", prefixes: trois.map(x => x.nom), mesures: mesures.slice()},
      cle: `${code}:a:${trois.map(x => x.nom).sort().join("+")}`
    });
  }

  ETAPES.P2 = {
    exclureExemples: false,
    // d1 : les préfixes connus (kilo, centi, milli), le sens et le calcul ;
    // d2 : tous les préfixes, le préfixe d'un sens, « combien de fois ? »
    // pour 100 et 1 000 ; d3 : « combien de fois ? » pour 10 (1 m et 1 dm,
    // le piège des « 100 fois »), relier, les calculs avec hecto, déca, déci.
    tirer(rng, degre, i, usage, forme) {
      if (forme === "associer") return questionRelierPrefixes("P2", degre, rng);
      const prefixes = degre === 1 ? PREFIXES.filter(p => CONNUS.includes(p.nom)) : degre === 3 ? PREFIXES.filter(p => !CONNUS.includes(p.nom)) : PREFIXES;
      let sorte = forme;
      // (Dans Je valide, les places libres sont des calculs : le sens et
      // « combien de fois ? » ont leurs places.)
      if (!sorte && usage === "valide") sorte = "calcul";
      if (!sorte) {
        const r = rng();
        sorte = degre === 1 ? (r < 0.4 ? "sens" : "calcul")
          : degre === 2 ? (r < 0.25 ? "sens" : r < 0.45 ? "prefixe" : r < 0.65 ? "fois" : "calcul")
            : (r < 0.35 ? "fois" : r < 0.5 ? "sens" : "calcul");
      }
      if (sorte === "prefixe") return questionNomPrefixe("P2", degre, choisir(rng, PREFIXES), rng);
      if (sorte === "fois") {
        const faits = FAITS_P2.filter(([g, p]) => (degre === 3 ? facteur(g, p) === 10n : facteur(g, p) >= 100n));
        const [g, p] = choisir(rng, faits);
        return questionFoisCM1("P2", degre, g, p);
      }
      const p = choisir(rng, prefixes);
      const grandeur = choisir(rng, GRANDEURS_CM1.filter(gr => unitePrefixe(p, gr)));
      if (sorte === "sens") return questionSens("P2", degre, p, grandeur, rng);
      const u = unitePrefixe(p, grandeur);
      const b = BASES[grandeur];
      const [g, pe] = p.e > 0 ? [u, b] : [b, u];
      const ecrit = forme === "phrase" || forme === "nombre" ? forme : choisir(rng, ["nombre", "nombre", "phrase"]);
      return questionRel("P2", degre, ecrit, MILLE, g, pe);
    },
    // Je valide : le sens en 1re, une phrase en 3e, le préfixe d'un sens en
    // 4e, « combien de fois ? » en 5e et en 8e, le sens en 7e, relier en
    // dernier ; À toi : relier deux fois.
    formes(usage) {
      if (usage === "valide") return {0: "sens", 2: "phrase", 3: "prefixe", 4: "fois", 6: "sens", 7: "fois", 9: "associer"};
      if (usage === "entraine") return {12: "associer", 21: "associer"};
      return {};
    },
    accepte: uneRelationUneFois,
    // Dans Je valide, les trois grandeurs, et des préfixes des deux côtés
    // (kilo, hecto, déca ; déci, centi, milli).
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const cotes = new Set(serie.filter(x => x.relationCle && x.relationCle !== "relier").map(x => {
        const [g] = x.relationCle.split("-");
        return BASES[grandeurDe(g)] === g ? "moins" : "plus";
      }));
      return troisGrandeurs(serie) && cotes.size === 2;
    },
    erreurs: erreursRel
  };

  // ------------------------------------------------- P3 · Deux unités voisines
  // 17 paires (6 de longueur, 6 de masse, 5 de contenance), dans les deux
  // sens : 1 dm = 10 cm et 1 cm = 0,1 dm (S002 p. 15-17 ; automatisme de
  // 6e « 1 cm = 1/10 dm = 0,1 dm ») ; 10 cm = 1 dm ; et les dixièmes :
  // 4 mm = 0,4 cm, 0,6 L = 6 dL.
  const VOISINES = [];
  GRANDEURS_CM1.forEach(gr => {
    const c = echelleDe(gr);
    for (let k = 0; k + 1 < c.length; k += 1) VOISINES.push([c[k], c[k + 1]]);
  });
  // Au degré 1, des voisines que l'élève a déjà vues (palier 1) une fois sur deux.
  const VOISINES_CONNUES = [["m", "dm"], ["dm", "cm"], ["cm", "mm"], ["L", "dL"], ["dL", "cL"]];

  ETAPES.P3 = {
    exclureExemples: false,
    tirer(rng, degre, i, usage, forme) {
      const [g, p] = degre === 1 && rng() < 0.4 ? choisir(rng, VOISINES_CONNUES) : choisir(rng, VOISINES);
      let sorte = forme;
      if (!sorte || sorte === "phrase" || sorte === "nombre") {
        const r = rng();
        sorte = degre === 1 ? (r < 0.6 ? "bas" : "haut10") : degre === 2 ? (r < 0.4 ? "haut" : r < 0.7 ? "bas" : "choix") : (r < 0.6 ? "dix" : "haut");
        if (forme === "phrase" && (sorte === "choix" || sorte === "haut10" || sorte === "dix")) sorte = rng() < 0.5 ? "haut" : "bas";
      }
      const ecrit = forme === "phrase" ? "phrase" : forme === "nombre" ? "nombre" : (degre > 1 && rng() < 0.25 ? "phrase" : "nombre");
      if (sorte === "bas") return questionRel("P3", degre, ecrit, MILLE, g, p);
      if (sorte === "haut") return questionRel("P3", degre, ecrit, MILLE, p, g);
      if (sorte === "haut10") return questionRel("P3", degre, "nombre", 10n * MILLE, p, g);
      if (sorte === "dix") {
        const n = BigInt(entre(rng, 2, 9));
        return rng() < 0.5 ? questionRel("P3", degre, ecrit, n * MILLE, p, g) : questionRel("P3", degre, ecrit, n * 100n, g, p);
      }
      // Au choix : « 1 cm = … dm » (0,1 ; 10, le sens ; 0,01, le centième),
      // ou « 1 dm = … cm » (10 ; 0,1, le sens ; 100).
      if (rng() < 0.6) return enChoixRel(questionRel("P3", degre, "nombre", MILLE, p, g), [10n * MILLE, 10n], rng);
      return enChoixRel(questionRel("P3", degre, "nombre", MILLE, g, p), [100n, 100n * MILLE], rng);
    },
    // Je valide : 10 petites = 1 grande en 2e, une phrase en 3e et en 7e,
    // au choix en 5e, « 1 cm = … dm » en 6e et en dernier, les dixièmes en
    // 8e et 9e.
    formes(usage) {
      if (usage === "valide") return {1: "haut10", 2: "phrase", 4: "choix", 5: "haut", 6: "phrase", 7: "dix", 8: "dix", 9: "haut"};
      if (usage === "entraine") return {4: "choix", 11: "choix", 17: "choix"};
      return {};
    },
    accepte: uneRelationUneFois,
    // Dans Je valide, les trois grandeurs, et vers la grande unité (0,1 ;
    // 0,4) au moins trois fois.
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const versGrande = serie.filter(x => x.donnees.type === "conv" && exposant(x.donnees.vers) > exposant(x.donnees.de)).length;
      return troisGrandeurs(serie) && versGrande >= 3;
    },
    erreurs: erreursRel
  };

  // ------------------------------------------ P4 · Toutes les relations à connaître
  // Les relations de 100 et de 1 000 entre les unités du CM1 (25 paires ;
  // 21 avec une unité nouvelle : hm, dam, hg, dag, dg, cg, mg, hL, daL, mL),
  // dans les deux sens ; « combien de fois ? » ; relier ; « 1 cm = 0,01 m » ;
  // et comparer deux mesures d'unités différentes (« 0,33 t ou 565 kg ? »,
  // programme de CM1 2025).
  const RELATIONS_P4 = [];
  GRANDEURS_CM1.forEach(gr => {
    const c = echelleDe(gr);
    c.forEach((g, a) => c.forEach((p, b) => {
      if (b > a && (b - a === 2 || b - a === 3)) RELATIONS_P4.push([g, p]);
    }));
  });
  const RELATIONS_P4_NEUVES = RELATIONS_P4.filter(([g, p]) => NOUVELLES_CM1.includes(g) || NOUVELLES_CM1.includes(p));

  // Comparer deux mesures (degré 3) : la grande unité avec une virgule (au
  // centième), la petite en nombre entier, plus grand. Les deux mesures ne
  // sont pas trop proches (15 % au moins), et la plus grande n'est pas
  // toujours celle qui a le plus grand nombre. [grande, petite, pas de la
  // petite, min et max de la mesure en petite unité]
  const COMPARER_P4 = [["t", "kg", 5, 150, 950], ["km", "m", 10, 300, 2500], ["kg", "g", 10, 150, 2500], ["L", "mL", 10, 150, 1500],
    ["L", "cL", 1, 15, 150], ["m", "cm", 1, 40, 250], ["hm", "m", 1, 40, 300], ["hL", "L", 1, 40, 300], ["kg", "dag", 1, 15, 150]];
  function questionComparerMesures(code, degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [G, p, pas, mini, maxi] = choisir(rng, COMPARER_P4);
      const f = facteur(G, p);
      // la mesure en grande unité : n centièmes (ou dixièmes), en petite : af
      const af = BigInt(entre(rng, mini, maxi, pas));
      const A = (af * MILLE) / f;
      if ((af * MILLE) % f !== 0n || A % 10n !== 0n || A >= 10n * MILLE) continue;
      const plusGrandeA = rng() < 0.5;
      const k = plusGrandeA ? 0.55 + 0.3 * rng() : 1.15 + 0.45 * rng();
      const b = BigInt(Math.round((Number(af) * k) / pas) * pas);
      const B = b * MILLE;
      const Af = af * MILLE;
      if (B <= 0n || B === Af || B <= A || b < 10n) continue;
      const ecart = Number(B > Af ? B - Af : Af - B) / Number(B > Af ? Af : B);
      if (ecart < 0.15) continue;
      if (G === "t" && ecrire(A) === "0,33" && b === 565n) continue;
      const deux = melanger(rng, [[A, G], [B, p]]);
      const choix = deux.map(([v, u]) => mes(v, u));
      const grand = Af > B ? mes(A, G) : mes(B, p);
      const bon = choix.indexOf(grand);
      const phrase = `Quelle mesure est la plus grande${NB}: ${choix[0]} ou ${choix[1]}${NB}?`;
      const grandeur = grandeurDe(G);
      const signe = Af > B ? ">" : "<";
      return q({
        code, degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "comparer-mes"},
        choix, bon, reponse: choix[bon], reponseTexte: grand, unite: null,
        resume: `${mes(A, G)} = ${mes(Af, p)}${NB}; la plus grande : ${grand}`,
        relation: relationTexte(G, p), outil: "glisse-unite", glisse: glisse(A, G, p, {cm1: true}),
        image: G === "t" ? [relationTexte("t", "kg"), "J'écris les deux masses dans la même unité."] : ["J'écris les deux mesures dans la même unité."],
        echelle: G === "t" ? null : {grandeur, marque: [G, p], note: "J'écris les deux mesures dans la même unité."},
        correction: [`${mes(A, G)} = ${mes(Af, p)}`, `${mes(Af, p)} ${signe} ${mes(B, p)}`],
        pourquoi: {[1 - bon]: "J'écris d'abord la même unité."},
        grandeur, relationCle: `${G}-${p}:cmp`,
        donnees: {type: "comparer-mes", a: brut(A), ua: G, b: brut(B), ub: p},
        cle: `${code}:cmp:${brut(A)}${G}:${brut(B)}${p}`
      });
    }
    return null;
  }

  ETAPES.P4 = {
    exclureExemples: false,
    // d1 : 1 hm = 100 m, 100 m = 1 hm ; d2 : en phrase, au choix
    // (« 1 hm = … m » : 10, 100 ou 1 000), « combien de fois ? », relier
    // trois grandeurs ; d3 : « 1 cm = 0,01 m », comparer deux mesures,
    // relier trois unités d'une même grandeur.
    tirer(rng, degre, i, usage, forme) {
      const vivier = rng() < 0.8 ? RELATIONS_P4_NEUVES : RELATIONS_P4;
      if (forme === "associer") return questionRelierCM1("P4", degre, rng, RELATIONS_P4);
      if (forme === "comparer") return questionComparerMesures("P4", degre, rng);
      let sorte = forme;
      if (!sorte || sorte === "phrase" || sorte === "nombre") {
        const r = rng();
        sorte = degre === 1 ? (r < 0.6 ? "bas" : "haut") : degre === 2 ? (r < 0.4 ? "bas" : r < 0.6 ? "choix" : r < 0.8 ? "fois" : "haut")
          : (r < 0.3 ? "centieme" : r < 0.5 ? "comparer" : r < 0.7 ? "haut" : "bas");
        if (forme === "phrase" && !["bas", "haut"].includes(sorte)) sorte = rng() < 0.6 ? "bas" : "haut";
      }
      if (sorte === "comparer") return questionComparerMesures("P4", degre, rng);
      const ecrit = forme === "phrase" ? "phrase" : forme === "nombre" ? "nombre" : (degre > 1 && rng() < 0.25 ? "phrase" : "nombre");
      if (sorte === "centieme") {
        const [g, p] = choisir(rng, vivier.filter(([a, b]) => facteur(a, b) === 100n));
        return questionRel("P4", degre, ecrit, MILLE, p, g);
      }
      const [g, p] = choisir(rng, vivier);
      const f = facteur(g, p);
      if (sorte === "fois") return questionFoisCM1("P4", degre, g, p);
      if (sorte === "haut") return questionRel("P4", degre, ecrit, f * MILLE, p, g);
      const x = questionRel("P4", degre, sorte === "choix" ? "nombre" : ecrit, MILLE, g, p);
      // Au choix : « 1 hm = … m » — 10 (unités voisines supposées), 1 000
      // (hm confondu avec km).
      if (sorte === "choix") return enChoixRel(x, [(f * MILLE) / 10n, f * MILLE * 10n], rng);
      return x;
    },
    // Je valide : une phrase en 3e et en 7e, au choix en 4e, « combien de
    // fois ? » en 5e, comparer en 8e, « 1 cm = 0,01 m » en 9e, relier en
    // dernier ; À toi : relier deux fois, comparer trois fois.
    formes(usage) {
      if (usage === "valide") return {1: "haut", 2: "phrase", 3: "choix", 4: "fois", 6: "phrase", 7: "comparer", 8: "centieme", 9: "associer"};
      if (usage === "entraine") return {12: "associer", 16: "comparer", 21: "associer", 23: "comparer"};
      return {};
    },
    accepte: uneRelationUneFois,
    // Dans Je valide, les trois grandeurs, et au moins cinq questions sur
    // les unités nouvelles du CM1.
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const neuves = serie.filter(x => x.relationCle && NOUVELLES_CM1.some(u => x.relationCle.split(/[-:]/).includes(u))).length;
      return troisGrandeurs(serie.filter(x => x.grandeur)) && neuves >= 5;
    },
    erreurs: erreursRel
  };

  // ===================================================== palier 2 (lot B2-1)
  // Convertir avec des décimaux (carte v4) : « Avec des nombres décimaux »
  // (C3) et « En mètre, en gramme, en litre » (C4). Décimaux au centième
  // (programme de CM1), jusqu'à 100 000. S002 p. 9, S003 p. 6-9 : le
  // glisse-unité accompagne la phrase (« un dixième devient une unité »,
  // « la virgule repère le chiffre des unités ») ; il ne la remplace pas.
  // Les erreurs connues des décimaux : la virgule effacée (3,5 m → 35 cm),
  // le zéro mal placé (3,5 m → 305 cm), les zéros ajoutés après la virgule
  // (35,200), un zéro de trop ou de moins, le sens (diviser au lieu de
  // multiplier). C4 : les mauvaises réponses au choix sont la même mesure
  // dans une unité voisine (« 75 L = … cL » : 750, 7,5, 0,75 ; S434).

  // Le nombre de chiffres après la virgule d'une mesure (en millièmes).
  function decimales(m) {
    if (m % MILLE === 0n) return 0;
    if (m % 100n === 0n) return 1;
    return m % 10n === 0n ? 2 : 3;
  }
  // La virgule effacée : « 3,05 » → 305.
  function sansVirgule(m) {
    return BigInt(brut(m).replace(",", "")) * MILLE;
  }
  // Les zéros pièges du niveau 3 de l'exerciseur (0,05 ; 2,07 ; 30,4 ;
  // 305) ; `debut` : aussi « 0,41 » (un nombre plus petit que 1).
  function zerosPieges(m, debut = true) {
    const s = brut(m);
    return /,0|[1-9]0,|[1-9]0+[1-9]/.test(s) || (debut && /^0,/.test(s));
  }
  // Un nombre d'un modèle, en millièmes. Sans zéro : « a » (2 à 9), « ab »,
  // « a,b », « ab,c », « a,bc », « 0,ab », « 0,a » ; les zéros pièges :
  // « 0,0a », « a,0b », « a0,b », « ab00 ».
  function nombreModele(rng, modele) {
    const [a, b, c] = [entre(rng, 1, 9), entre(rng, 1, 9), entre(rng, 1, 9)];
    const t = {a: `${entre(rng, 2, 9)}`, ab: `${a}${b}`, "a,b": `${a},${b}`, "ab,c": `${a}${b},${c}`, "a,bc": `${a},${b}${c}`,
      "0,ab": `0,${a}${b}`, "0,a": `0,${a}`, "0,0a": `0,0${entre(rng, 2, 9)}`, "a,0b": `${a},0${b}`, "a0,b": `${a}0,${b}`, ab00: `${a}${b}00`}[modele];
    return milli(t);
  }

  // La phrase sous le glisse-unité, avec des décimaux (S002 p. 9) : vers
  // l'unité plus petite, le dernier rang écrit (« Chaque dixième de mètre
  // devient 10 centimètres. ») ; vers la plus grande, l'unité de départ
  // (« Chaque centimètre devient un centième de mètre. »). « d'hectomètre » :
  // le h est muet.
  const RANG_MOT = {100: "dixième", 10: "centième", 1: "millième"};
  // `court` : les unités en symboles (« Chaque dixième de kg devient
  // 100 g. ») ; la page la prend quand la phrase en mots ne tient pas sur
  // une ligne (une police large, au petit téléphone : « Chaque centième de
  // gramme devient 10 milligrammes. » en demandait 422 px pour 310).
  function phraseDecimaux(valeur, de, vers, court = false) {
    const nom = (u, n = 1n) => (court ? u : n === MILLE || n === 1n ? MOT[u] : MOTS[u]);
    const deU = u => (court ? `de ${u}` : /^h/.test(MOT[u]) ? `d'${MOT[u]}` : `de ${MOT[u]}`);
    const unite = () => `Chaque ${nom(de)} devient ${ecrire(facteur(de, vers) * MILLE)}${NB}${nom(vers, 2n)}.`;
    if (exposant(de) > exposant(vers)) {
      const k = decimales(valeur);
      if (!k) return unite();
      const p = convertir(MILLE / puissance(k), de, vers);
      // (Un dixième qui ne fait pas une unité entière, « un centième de
      // décimètre » : la relation de l'unité, plus simple à lire.)
      if (p < MILLE) return unite();
      return `Chaque ${RANG_MOT[Number(MILLE / puissance(k))]} ${deU(de)} devient ${ecrire(p)}${NB}${nom(vers, p)}.`;
    }
    const p = convertir(MILLE, de, vers);
    return `Chaque ${nom(de)} devient un ${RANG_MOT[Number(p)]} ${deU(vers)}.`;
  }

  // Une conversion avec des décimaux : null si un nombre sort du programme
  // de CM1 (plus de deux chiffres après la virgule, moins de 0,01, plus de
  // 100 000). L'image de C3 : la relation et le calcul posé, sans le
  // résultat ; celle de C4 : l'échelle des unités.
  // Des mesures qu'on écrit vraiment : jamais de virgule dans les plus
  // petites unités (« 45,1 mm », « 0,6 cL ») ; jamais moins de 1 dans une
  // petite unité (« 0,02 dm ») ; pas plus de 999 dans une unité rare
  // (« 9 200 dag ») ; 50 000 au plus en C3, 10 000 en C4.
  const ENTIERES = ["mm", "mg", "mL", "cg", "cL"];
  // (Ni « 0,04 daL », « 0,09 dam », « 0,01 hg » : moins de 1 seulement
  // dans les unités qu'on écrit ainsi, m, km, kg, t, L, hL, g.)
  const PAS_MOINS_DE_1 = ["mm", "cm", "dm", "mg", "cg", "dg", "mL", "cL", "dL", "dam", "hm", "dag", "hg", "daL"];
  const RARES = ["hm", "dam", "hg", "dag", "dg", "daL", "hL"];
  function mesureVraie(m, u, borne) {
    return m >= 10n && m <= borne && decimales(m) <= 2 && !(ENTIERES.includes(u) && m % MILLE !== 0n)
      && !(PAS_MOINS_DE_1.includes(u) && m < MILLE) && !(RARES.includes(u) && m >= 1000n * MILLE);
  }
  function conversionDec(code, degre, v, de, vers) {
    if (v === null || v <= 0n) return null;
    const rep = convertir(v, de, vers);
    const borne = (code === "C3" ? 50000n : 10000n) * MILLE;
    if (rep === null || !mesureVraie(v, de, borne) || !mesureVraie(rep, vers, borne)) return null;
    const bas = exposant(de) > exposant(vers);
    const [g, p] = bas ? [de, vers] : [vers, de];
    const f = facteur(g, p);
    const relation = relationTexte(g, p);
    const pas = bas ? `${ecrire(v)} × ${mes(f * MILLE, vers)}` : `${ecrire(v)} ÷ ${ecrire(f * MILLE)}${NB}${vers}`;
    const grandeur = grandeurDe(g);
    const extra = {
      relation, outil: "glisse-unite", glisse: glisse(v, de, vers, {cm1: true, decimaux: true}),
      image: [relation, `donc ${mes(v, de)} = ${pas}`],
      correction: [relation, `donc ${mes(v, de)} = ${pas} = ${mes(rep, vers)}`],
      grandeur, relationCle: `${g}-${p}`
    };
    if (code === "C4") Object.assign(extra, {echelle: {grandeur, marque: [de, vers]}, image: lignesEchelle(grandeur)});
    return questionConversion(code, degre, "nombre", v, de, vers, extra);
  }

  // Le pourquoi d'une erreur au pavé (C3, C4). L'ordre : le sens (« Je
  // prévois » suit), la virgule effacée, le zéro mal placé, le nombre
  // gardé, un zéro de trop ou de moins. Une ligne au petit téléphone.
  // `saisie` : le texte tapé (« 3,500 » : des zéros après la virgule).
  function erreursDec(question, lu, cases, saisie) {
    const d = question.donnees;
    if (!d || d.type !== "conv") return null;
    const v = milli(d.valeur);
    const attendu = milli(question.reponse);
    const bas = exposant(d.de) > exposant(d.vers);
    const f = bas ? facteur(d.de, d.vers) : facteur(d.vers, d.de);
    if (bas && v % f === 0n && lu === v / f) return {erreur: 1, retour: "Tu as divisé. Vers une unité plus petite, je multiplie."};
    if (!bas && lu === v * f) return {erreur: 3, retour: "Tu as multiplié. Vers une unité plus grande, je divise."};
    const reste = v % MILLE;
    if (reste && lu === sansVirgule(v)) return {erreur: 5, retour: "Effacer la virgule ne suffit pas."};
    // (Le zéro mal placé, 3,5 m → 305 cm : seulement quand le nombre a
    // moins de chiffres après la virgule que la relation n'a de zéros ;
    // sinon « 1,57 m → 67 dm » n'est l'erreur de personne.)
    if (bas && reste && decimales(v) < String(f).length - 1) {
      const chiffres = BigInt(brut(v).split(",")[1]) * MILLE;
      if (lu === (v - reste) * f + chiffres) return {erreur: 6, retour: `${mes(reste, d.de)}, ce n'est pas ${mes(chiffres, d.vers)}.`};
    }
    if (lu === v) {
      const zeros = /,\d*0$/.test(String(saisie || "").trim());
      return {erreur: 4, retour: zeros ? "Des zéros après la virgule ne changent rien." : `${mes(v, d.de)}, ce n'est pas ${mes(v, d.vers)}.`};
    }
    if (lu === attendu * 10n || lu * 10n === attendu) {
      if (bas && reste) return {erreur: 2, retour: `${mes(reste, d.de)}, c'est ${mes(convertir(reste, d.de, d.vers), d.vers)}.`};
      if (!bas && attendu < MILLE && lu >= MILLE) return {erreur: 2, retour: `${mes(v, d.de)}, c'est moins de 1${NB}${d.vers}.`};
      return {erreur: 2, retour: lu > attendu ? "Un zéro de trop." : "Un zéro de moins."};
    }
    return null;
  }

  // Au choix, C3 : les fausses sont les vraies erreurs des décimaux, dans
  // cet ordre ; vers la petite unité : la virgule effacée, le zéro mal
  // placé, un zéro de trop, le nombre gardé, divisé ; vers la grande : un
  // zéro de moins (« 3,5 m » pour 35 cm), multiplié, le nombre gardé.
  // Le pourquoi : une ligne (« 0,5 m, ce n'est pas 5 cm. »).
  function choixPropres(faux, rep) {
    const borne = 100000n * MILLE;
    const propres = [];
    faux.forEach(y => {
      if (y !== null && y !== rep && y >= 10n && y <= borne && decimales(y) <= 2 && !propres.includes(y)) propres.push(y);
    });
    return propres;
  }
  function enQcm(x, rep, deux, pourquoiDe, rng) {
    const d = x.donnees;
    const choix = melanger(rng, [rep, ...deux]).map(ecrire);
    const bon = choix.indexOf(ecrire(rep));
    const pourquoi = {};
    choix.forEach((c, k) => { if (k !== bon) pourquoi[k] = pourquoiDe(milli(c.replace(new RegExp(FINE, "g"), ""))); });
    const phrase = `${mes(milli(d.valeur), d.de)} = ${CASE}${NB}${d.vers}`;
    return Object.assign(x, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: d.vers, sorte: "valeur"},
      choix, bon, pourquoi, cleBase: x.cle, cle: `${x.cle}:q`
    });
  }
  function enChoixDec(x, rng) {
    if (!x || x.donnees.type !== "conv") return null;
    const d = x.donnees;
    const v = milli(d.valeur);
    const rep = milli(x.reponse);
    const bas = exposant(d.de) > exposant(d.vers);
    const f = bas ? facteur(d.de, d.vers) : facteur(d.vers, d.de);
    const reste = v % MILLE;
    const malPlace = reste && decimales(v) < String(f).length - 1 ? (v - reste) * f + BigInt(brut(v).split(",")[1]) * MILLE : null;
    const faux = bas ? [reste ? sansVirgule(v) : null, malPlace, rep * 10n, v, v % f === 0n ? v / f : null]
      : [rep * 10n, v * f, v, rep % 10n === 0n ? rep / 10n : null];
    const propres = choixPropres(faux, rep);
    if (propres.length < 2) return null;
    return enQcm(x, rep, [propres[0], choisir(rng, propres.slice(1))], y => {
      const e = erreursDec(x, y);
      if (e && (e.erreur === 1 || e.erreur === 3)) return `1${NB}${d.de} est plus ${e.erreur === 1 ? "grand" : "petit"} que 1${NB}${d.vers}.`;
      return e ? e.retour : y > rep ? "Un zéro de trop." : "Un zéro de moins.";
    }, rng);
  }
  // Au choix, C4 (S434, « 75 L = … cL » : 750, 7,5, 0,75) : la même mesure
  // écrite dans une autre unité de l'échelle, la plus proche d'abord. Le
  // pourquoi : « 750, ce serait des dL. » (comme « On te montre »).
  function enChoixVoisines(x, rng) {
    if (!x || x.donnees.type !== "conv") return null;
    const d = x.donnees;
    const v = milli(d.valeur);
    const rep = milli(x.reponse);
    const cols = echelleDe(grandeurDe(d.vers));
    const k = cols.indexOf(d.vers);
    const unites = cols.filter(u => u && u !== d.vers && u !== d.de).sort((a, b) => Math.abs(cols.indexOf(a) - k) - Math.abs(cols.indexOf(b) - k));
    const unite = {};
    const faux = unites.map(u => { const y = convertir(v, d.de, u); if (y !== null) unite[y] = u; return y; });
    const propres = choixPropres(faux, rep);
    if (propres.length < 2) return null;
    // (Une ligne au petit téléphone, police large comprise : « 6 720 g =
    // 67 200 dg, pas 67 200 kg. » en prenait deux.)
    return enQcm(x, rep, [propres[0], choisir(rng, propres.slice(1))], y => `${ecrire(y)}, ce serait des ${unite[y]}.`, rng);
  }

  // Dans Je valide, les trois grandeurs (comme C1, C2), et les deux sens
  // au moins trois fois chacun.
  function serieDecBonne(serie, usage) {
    if (usage !== "valide") return true;
    const bas = serie.filter(x => exposant(x.donnees.de) > exposant(x.donnees.vers)).length;
    return serieConvertirBonne(serie, usage) && bas >= 3 && serie.length - bas >= 3;
  }

  // ------------------------------------- C3 · Avec des nombres décimaux
  // Les unités du palier 1. d1 : un chiffre après la virgule, vers la
  // petite unité (3,5 m = 350 cm) ; d2 : les centièmes, et vers la grande
  // unité (35 cm = 0,35 m) ; d3 : les zéros (3,05 m ; 0,08 L ;
  // 7 cm = 0,07 m ; 12,5 m = 1 250 cm ; 305 cm = 3,05 m).
  const PAIRES_C3 = [["m", "cm"], ["m", "dm"], ["cm", "mm"], ["m", "mm"], ["km", "m"], ["kg", "g"], ["t", "kg"], ["L", "cL"], ["L", "dL"],
    ["dL", "cL"], ["dm", "cm"]];
  const ZEROS_C3 = [["bas", "a,0b"], ["bas", "0,0a"], ["haut", "0,0a"], ["bas", "ab,c"], ["haut", "a,0b"]];
  function tirerC3(rng, degre) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, PAIRES_C3);
      let sens = "bas";
      let modele = "a,b";
      if (degre === 2) {
        sens = rng() < 0.5 ? "bas" : "haut";
        modele = sens === "bas" ? choisir(rng, ["a,bc", "ab,c"]) : choisir(rng, ["0,ab", "a,b", "a,bc", "0,a"]);
      } else if (degre === 3) [sens, modele] = choisir(rng, ZEROS_C3);
      const P = nombreModele(rng, modele);
      // Vers la grande unité, le modèle est celui de la réponse.
      const v = sens === "bas" ? P : convertir(P, g, p);
      const x = sens === "bas" ? conversionDec("C3", degre, v, g, p) : conversionDec("C3", degre, v, p, g);
      if (!x) continue;
      // (12,5 m = 1 250 cm : le zéro est dans la réponse.)
      if (degre === 3 && modele === "ab,c" && milli(x.reponse) % (10n * MILLE) !== 0n) continue;
      if (degre < 3 && (zerosPieges(v, false) || zerosPieges(milli(x.reponse), false))) continue;
      return x;
    }
    return null;
  }
  ETAPES.C3 = {
    clesExemples: ["C3:3,5m>cm", "C3:2,4L>dL", "C3:45cm>m"],
    tirer(rng, degre, i, usage, forme) {
      const x = tirerC3(rng, degre);
      return forme === "choix" ? enChoixDec(x, rng) : x;
    },
    formes: formesC1,
    accepte: contraintesConvertir,
    valide: serieDecBonne,
    erreurs: erreursDec
  };

  // ------------------------------ C4 · En mètre, en gramme, en litre
  // Une unité du CM1 vers le mètre, le gramme, le litre, et l'inverse
  // (S002 p. 15-17 : 12,3 hm = 1 230 m ; 41 cm = 0,41 m ; 12,3 dag =
  // 123 g ; 41 dg = 4,1 g ; 23 dL = 2,3 L ; 6,4 L = 640 cL). d1 : × ou ÷ 10,
  // 100, sans zéro piège, une réponse d'au moins 1 ; d2 : jusqu'à 1 000,
  // les exemples officiels ; d3 : les zéros pièges de l'exerciseur en
  // quatre modèles (0,05 ; 2,07 ; 30,4 ; 4 300), dans la question ou dans la
  // réponse. Les unités nouvelles du CM1 trois fois sur cinq.
  const ANCIENNES_C4 = ["km", "dm", "cm", "mm", "kg", "dL", "cL"];
  function tirerC4(rng, degre) {
    for (let essai = 0; essai < 60; essai += 1) {
      const U = rng() < 0.6 ? choisir(rng, NOUVELLES_CM1) : choisir(rng, ANCIENNES_C4);
      const b = BASES[grandeurDe(U)];
      if (degre === 1 && Math.abs(exposant(U)) > 2) continue;
      const [de, vers] = rng() < 0.5 ? [U, b] : [b, U];
      const cote = rng() < 0.5 ? "v" : "rep";
      const modele = degre === 1 ? choisir(rng, ["a", "a,b", "ab"])
        : degre === 2 ? choisir(rng, cote === "v" ? ["ab,c", "a,b", "a,bc", "ab"] : ["0,ab", "a,b", "ab,c", "a,bc"])
          : choisir(rng, ["0,0a", "a,0b", "a0,b", "ab00"]);
      const P = nombreModele(rng, modele);
      const v = cote === "v" ? P : convertir(P, vers, de);
      const x = conversionDec("C4", degre, v, de, vers);
      if (!x) continue;
      const rep = milli(x.reponse);
      if (degre === 1 && (zerosPieges(v) || zerosPieges(rep) || rep < MILLE)) continue;
      if (degre === 2 && (zerosPieges(v, false) || zerosPieges(rep, false))) continue;
      return x;
    }
    return null;
  }
  ETAPES.C4 = {
    clesExemples: ["C4:12,3hm>m", "C4:41dg>g", "C4:75L>cL"],
    tirer(rng, degre, i, usage, forme) {
      const x = tirerC4(rng, degre);
      return forme === "choix" ? enChoixVoisines(x, rng) : x;
    },
    formes: formesC1,
    accepte: contraintesConvertir,
    // (Et au moins quatre questions sur les unités nouvelles du CM1.)
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const neuves = serie.filter(x => NOUVELLES_CM1.includes(x.donnees.de) || NOUVELLES_CM1.includes(x.donnees.vers)).length;
      return serieDecBonne(serie, usage) && neuves >= 4;
    },
    erreurs: erreursDec
  };

  // ------------------------------ C5 · Une mesure, plusieurs écritures
  // Lot B2-1b (plan décidé le 15/11, choix de Gwenaël du 14/11 et du 18/11).
  // Une même mesure s'écrit avec une virgule, en une unité, en deux unités :
  // 2,15 m = 2 m 15 cm = 215 cm = 21,5 dm. Les sortes :
  //   « 2 m 15 cm = … cm » (les séries à zéro de Singapour : 3 km 450 m,
  //   3 km 45 m, 3 km 5 m) ; « 2 m 5 cm = … m » (le piège 2,5) ; deux cases
  //   « 2,05 m = … m … cm » ; décomposer « 215 cm = 2 m + … dm + 5 cm » ;
  //   les conversions officielles (S002 : 1 600 m = 1,6 km ; 2 100 mg =
  //   2,1 g ; 3 g + 5 cg = 305 cg = 3,05 g ; 3 cm + 4 mm = 34 mm = 3,4 cm) ;
  //   « Trouve l'intrus » (quatre mesures, trois égales) ; « Coche tout ce
  //   qui est égal à 2,15 m » (forme `plusieurs` : quatre cartes, deux ou
  //   trois justes), deux fois dans À toi et la dernière de Je valide.
  // Décimaux au centième (CM1) : jamais de millièmes (pas de « 3,045 km »).
  const BORNE_C5 = 100000n * MILLE;
  // Une écriture : une liste de [millièmes, unité] (« 2 m 15 cm » : deux).
  function texteEcriture(parts) {
    return parts.map(([m, u]) => mes(m, u)).join(" ");
  }
  function vraieEcriture(parts) {
    return parts.every(([m, u]) => mesureVraie(m, u, BORNE_C5));
  }
  // La valeur d'une écriture dans une unité (la plus petite de la grandeur).
  const BASE_C5 = {longueur: "mm", masse: "mg", contenance: "mL"};
  function valeurC5(parts) {
    const base = BASE_C5[grandeurDe(parts[0][1])];
    return parts.reduce((s, [m, u]) => s + convertir(m, u, base), 0n);
  }
  // Une mesure en une unité, si elle s'écrit vraiment (au centième au plus).
  function dansUnite(x, de, vers) {
    const y = convertir(x, de, vers);
    return y !== null && mesureVraie(y, vers, BORNE_C5) ? y : null;
  }

  // Les familles des cartes (plusieurs, intrus) : la grande unité, la
  // petite, et celles où la même mesure s'écrit aussi (dm, dL ; mm, mL, mg).
  // (Le mètre deux fois : les écritures de tous les jours d'abord.)
  const FAMILLES_C5 = [
    {g: "m", p: "cm", mid: "dm", fine: "mm"}, {g: "m", p: "cm", mid: "dm", fine: "mm"}, {g: "L", p: "cL", mid: "dL", fine: "mL"},
    {g: "km", p: "m"}, {g: "kg", p: "g"}, {g: "g", p: "cg", fine: "mg"}
  ];
  // Le nombre de la grande unité (a) et le reste dans la petite (b), en
  // unités entières. `zero` : les zéros pièges (2 m 5 cm ; 3 km 50 m ;
  // 3 km 400 m) ; sinon deux chiffres non nuls après la virgule.
  function tirerAB(rng, f, zero) {
    const a = entre(rng, 1, 9);
    let b;
    const sansDizaine = () => { let k; do { k = entre(rng, 11, 99); } while (k % 10 === 0); return k; };
    if (f === 100n) b = zero ? entre(rng, 1, 9) : sansDizaine();
    else if (f === 1000n) b = zero ? (rng() < 0.6 ? entre(rng, 1, 9) * 10 : entre(rng, 1, 9) * 100) : sansDizaine() * 10;
    else b = entre(rng, 1, 9);
    return [a, b];
  }
  // Les écritures égales d'une mesure X (en millièmes de la petite unité),
  // et les écritures fausses (les vraies erreurs : un zéro de trop ou de
  // moins, la virgule mal placée, le nombre gardé, le zéro du reste).
  function ecrituresC5(fam, a, b) {
    const {g, p} = fam;
    const f = facteur(g, p);
    const X = milli(a) * f + milli(b);
    const egales = [[[convertir(X, p, g), g]], [[X, p]], [[milli(a), g], [milli(b), p]]];
    [fam.mid, fam.fine].forEach(u => { const y = u ? dansUnite(X, p, u) : null; if (y !== null) egales.push([[y, u]]); });
    const gDec = convertir(X, p, g);
    const fausses = [[[X * 10n, p]], [[X / 10n, p]], [[gDec * 10n, g]]];
    if (fam.mid) fausses.push([[X, fam.mid]], [[gDec, fam.mid]]);
    // Le zéro du reste : 2 m 5 cm ↔ 2 m 50 cm, 2,05 m ↔ 2,5 m.
    const b10 = BigInt(b) * 10n;
    if (b10 < f) fausses.push([[milli(a), g], [b10 * MILLE, p]], [[convertir(milli(a) * f + b10 * MILLE, p, g), g]]);
    if (b % 10 === 0) fausses.push([[milli(a), g], [milli(b / 10), p]], [[convertir(milli(a) * f + milli(b / 10), p, g), g]]);
    // Les chiffres collés : 3 km 45 m → 345 m ; 2 m 5 cm → 25 cm.
    fausses.push([[milli(Number(`${a}${b}`)), p]]);
    const garder = (liste, juste) => {
      const vues = new Set();
      return liste.filter(e => e.every(([m]) => m !== null && m > 0n) && vraieEcriture(e)).filter(e => {
        const v = valeurC5(e);
        if ((v === valeurC5([[X, p]])) !== juste || vues.has(String(v)) && !juste) return false;
        vues.add(String(v));
        return true;
      });
    };
    return {X, egales: garder(egales, true), fausses: garder(fausses, false)};
  }
  // Une écriture fausse dite dans une autre unité (le pourquoi d'une carte) :
  // « 2 150 cm, c'est 21,5 m. », « 2 m 50 cm, c'est 2,5 m. ».
  function direAutrement(e, unites) {
    const base = BASE_C5[grandeurDe(e[0][1])];
    const v = valeurC5(e);
    for (const u of unites) {
      if (e.length === 1 && e[0][1] === u) continue;
      const y = dansUnite(v, base, u);
      if (y !== null) return mes(y, u);
    }
    return null;
  }
  function cleTexte(t) {
    return t.replace(/[\s  ]/g, "");
  }

  // « Coche tout ce qui est égal à 2,15 m. » Quatre cartes, deux ou trois
  // justes ; la cible : la mesure à virgule (le plus souvent), ou en une
  // petite unité.
  function questionPlusieurs(code, degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const fam = choisir(rng, FAMILLES_C5);
      const {g, p} = fam;
      const [a, b] = tirerAB(rng, facteur(g, p), degre === 3);
      const {X, egales, fausses} = ecrituresC5(fam, a, b);
      const cibleK = rng() < 0.7 ? 0 : 1;
      const cible = egales[cibleK];
      if (!cible) continue;
      const autres = egales.filter((e, k) => k !== cibleK);
      const k = Math.min(autres.length, rng() < 0.5 ? 2 : 3);
      if (k < 2 || fausses.length < 4 - k) continue;
      // (L'écriture en deux unités, « 2 m 15 cm », est toujours une carte
      // juste : c'est l'écriture que l'étape apprend.)
      const deux = autres.filter(e => e.length === 2);
      const justes = deux.concat(melanger(rng, autres.filter(e => e.length === 1))).slice(0, k);
      const cartes = melanger(rng, justes.concat(melanger(rng, fausses).slice(0, 4 - k)));
      const textes = cartes.map(texteEcriture);
      const bons = cartes.map((e, i) => (justes.includes(e) ? i : -1)).filter(i => i >= 0);
      const cibleT = texteEcriture(cible);
      const unites = [cible.length === 1 ? cible[0][1] : g, p, g, fam.mid, fam.fine].filter(Boolean);
      const pourquoi = {};
      let bien = true;
      cartes.forEach((e, i) => {
        if (bons.includes(i)) return;
        const autre = direAutrement(e, unites);
        if (!autre) bien = false;
        else pourquoi[i] = `${textes[i]}, c'est ${autre}.`;
      });
      if (!bien) continue;
      const phrase = `Coche tout ce qui est égal à ${cibleT}.`;
      const resume = [cibleT].concat(bons.map(i => textes[i])).join(" = ");
      const cv = cible.length === 1 ? cible[0] : [X, p];
      const vers = cv[1] === g ? p : g;
      const relations = [relationTexte(g, p)].concat(fam.mid ? [relationTexte(g, fam.mid)] : []).concat(fam.fine ? [relationTexte(p, fam.fine)] : []);
      return q({
        code, degre, forme: "plusieurs", texte: `${phrase} ${textes.join(" ; ")}`,
        morceaux: {phrase, consigne: "Il y en a plusieurs. Puis Valider."},
        cartes: textes, bons, reponse: bons.join(","), reponseTexte: bons.map(i => textes[i]).join(" = "), unite: g,
        resume, correction: [resume], pourquoi,
        relation: relationTexte(g, p), outil: "glisse-unite",
        glisseOutil: glisse(cv[0], cv[1], vers, {cm1: true, decimaux: true}),
        image: relations.concat(["J'écris tout dans la même unité."]),
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`, sorteC5: "plusieurs",
        donnees: {type: "plusieurs", cible: cible.map(([m, u]) => [brut(m), u]), cartes: cartes.map(e => e.map(([m, u]) => [brut(m), u]))},
        cle: `${code}:p:${cleTexte(cibleT)}:${textes.map(cleTexte).sort().join("|")}`
      });
    }
    return null;
  }

  // « Trouve l'intrus » : trois écritures de la même mesure, dans trois
  // unités au moins différentes, et une vraie erreur.
  function questionIntrus(code, degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const fam = choisir(rng, FAMILLES_C5);
      const {g, p} = fam;
      const [a, b] = tirerAB(rng, facteur(g, p), degre === 3 || rng() < 0.4);
      const {X, egales, fausses} = ecrituresC5(fam, a, b);
      if (egales.length < 3 || !fausses.length) continue;
      const trois = melanger(rng, egales).slice(0, 3);
      const intrus = choisir(rng, fausses);
      const cartes = melanger(rng, trois.concat([intrus]));
      const textes = cartes.map(texteEcriture);
      const bon = cartes.indexOf(intrus);
      const autre = direAutrement(intrus, [intrus.length === 1 && intrus[0][1] === p ? g : p, g, fam.mid].filter(Boolean));
      if (!autre) continue;
      // Le pourquoi d'une mesure égale touchée : la même, dans une autre unité.
      const pourquoi = {};
      cartes.forEach((e, i) => {
        if (i === bon) return;
        const meme = trois.find(x => x !== e && (x.length !== e.length || x[0][1] !== e[0][1]));
        pourquoi[i] = `${textes[i]} = ${texteEcriture(meme)}.`;
      });
      const egalesT = trois.map(texteEcriture);
      const phrase = "Trouve l'intrus : la mesure qui n'est pas égale aux autres.";
      const fin = `${textes[bon]} = ${autre} : c'est l'intrus.`;
      const relations = [relationTexte(g, p)].concat(fam.mid ? [relationTexte(g, fam.mid)] : []).concat(fam.fine ? [relationTexte(p, fam.fine)] : []);
      return q({
        code, degre, forme: "qcm", texte: `${phrase} ${textes.join(" ; ")}`,
        morceaux: {phrase},
        choix: textes, bon, pourquoi, reponse: String(bon), reponseTexte: textes[bon], unite: p,
        resume: fin, correction: [egalesT.join(" = "), fin],
        relation: relationTexte(g, p), outil: "glisse-unite",
        glisseOutil: glisse(convertir(X, p, g), g, p, {cm1: true, decimaux: true}),
        image: relations.concat(["J'écris tout dans la même unité."]),
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`, sorteC5: "intrus",
        donnees: {type: "intrus", cartes: cartes.map(e => e.map(([m, u]) => [brut(m), u]))},
        cle: `${code}:i:${brut(X)}${p}`
      });
    }
    return null;
  }

  // Une mesure en deux unités vers l'une des deux : « 2 m 15 cm = … cm »,
  // « 2 m 5 cm = … m » ; `plus` : l'écriture officielle avec « + »
  // (« 3 g + 5 cg = … g », S002). Le glisse-unité de l'outil porte le
  // nombre à convertir ; « Puis j'ajoute… » (comme C1).
  const PAIRES_BAS_C5 = [["m", "cm"], ["km", "m"], ["kg", "g"], ["L", "cL"], ["cm", "mm"], ["t", "kg"], ["g", "cg"]];
  const PAIRES_HAUT_C5 = [["m", "cm"], ["km", "m"], ["kg", "g"], ["L", "cL"], ["cm", "mm"], ["g", "cg"]];
  function questionDeuxUnites(code, degre, rng, {haut, plus, zero}) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, plus ? [["g", "cg"], ["cm", "mm"], ["m", "cm"], ["L", "cL"], ["kg", "g"]] : haut ? PAIRES_HAUT_C5 : PAIRES_BAS_C5);
      const f = facteur(g, p);
      let a;
      let b;
      // (Les séries à zéro de Singapour, vers la petite unité : 3 km 450 m,
      // 3 km 45 m, 3 km 5 m.)
      if (!haut && f === 1000n) {
        a = entre(rng, 1, 9);
        b = zero ? (rng() < 0.5 ? entre(rng, 1, 9) : entre(rng, 11, 99)) : entre(rng, 1, 9) * 100 + entre(rng, 1, 9) * 10 + (rng() < 0.5 ? 0 : entre(rng, 1, 9));
        if (zero && b % 10 === 0) continue;
      } else [a, b] = tirerAB(rng, f, zero);
      const A = milli(a);
      const B = milli(b);
      const vers = haut ? g : p;
      const rep = convertir(A, g, vers) + convertir(B, p, vers);
      if (!mesureVraie(rep, vers, BORNE_C5) || !vraieEcriture([[A, g], [B, p]])) continue;
      const gauche = `${mes(A, g)} ${plus ? "+ " : ""}${mes(B, p)}`;
      const relation = relationTexte(g, p);
      const extra = haut
        ? {glisse: glisse(B, p, g, {cm1: true, decimaux: true}), plus: mes(A, g),
          image: [relation, `donc ${gauche} = ${mes(A, g)} + ${ecrire(B)} ÷ ${ecrire(f * MILLE)}${NB}${g}`],
          correction: [`${mes(B, p)} = ${mes(convertir(B, p, g), g)}`, `${gauche} = ${mes(A, g)} + ${mes(convertir(B, p, g), g)} = ${mes(rep, g)}`]}
        : {glisse: glisse(A, g, p, {cm1: true, decimaux: true}), plus: mes(B, p),
          image: [relation, `donc ${gauche} = ${mes(A * f, p)} + ${mes(B, p)}`],
          correction: [`${mes(A, g)} = ${mes(A * f, p)}`, `${gauche} = ${mes(A * f, p)} + ${mes(B, p)} = ${mes(rep, p)}`]};
      return q(Object.assign({
        code, degre, forme: "phrase", texte: `${gauche} = ${CASE}${NB}${vers}`,
        morceaux: {phrase: `${gauche} =`, apres: vers},
        reponse: brut(rep), reponseTexte: mes(rep, vers), unite: vers, resume: `${gauche} = ${mes(rep, vers)}`,
        relation, outil: "glisse-unite", grandeur: grandeurDe(g), relationCle: `${g}-${p}`, somme: true,
        sorteC5: `${plus ? "plus" : "deux-unites"}-${haut ? "haut" : "bas"}`,
        donnees: {type: "somme", a: String(a), ua: g, b: String(b), ub: p, vers},
        cle: `${code}:${a}${g}${b}${p}>${vers}`
      }, extra));
    }
    return null;
  }

  // Deux cases : « 2,15 m = … m … cm » (d3 : 2,05 m ; 3,05 km ; 2,5 m).
  function questionDeuxCasesC5(code, degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, [["m", "cm"], ["L", "cL"], ["km", "m"], ["kg", "g"]]);
      const f = facteur(g, p);
      const [a, b] = tirerAB(rng, f, degre === 3);
      const X = milli(a) * f + milli(b);
      const v = convertir(X, p, g);
      if (!mesureVraie(v, g, BORNE_C5)) continue;
      const reste = v - milli(a);
      const gauche = mes(v, g);
      const relation = relationTexte(g, p);
      return q({
        code, degre, forme: "deux-cases", texte: `${gauche} = ${CASE}${NB}${g} ${CASE}${NB}${p}`,
        morceaux: {avant: `${gauche} =`, cases: [g, p]},
        reponse: [String(a), String(b)], reponseTexte: `${mes(milli(a), g)} ${mes(milli(b), p)}`, unite: p,
        resume: `${gauche} = ${mes(milli(a), g)} ${mes(milli(b), p)}`,
        relation, outil: "glisse-unite", glisse: glisse(v, g, p, {cm1: true, decimaux: true}),
        image: [relation, `${gauche} = ${mes(milli(a), g)} + ${mes(reste, g)}`],
        correction: [`${mes(reste, g)} = ${mes(milli(b), p)}`, `${gauche} = ${mes(milli(a), g)} ${mes(milli(b), p)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`, deux: true, sorteC5: "deux-cases",
        donnees: {type: "deux", valeur: brut(v), de: g, grande: g, petite: p},
        cle: `${code}:${brut(v)}${g}>${g}+${p}`
      });
    }
    return null;
  }

  // Décomposer : « 215 cm = 2 m + … dm + 5 cm » (d2 : depuis « 2,15 m »).
  // Un chiffre par unité ; la case est à l'une des trois places.
  const DECOMPOSER = [["m", "dm", "cm"], ["L", "dL", "cL"]];
  function questionDecomposer(code, degre, rng) {
    const us = choisir(rng, DECOMPOSER);
    const ch = [entre(rng, 1, 9), entre(rng, 1, 9), entre(rng, 1, 9)];
    const k = entre(rng, 0, 2);
    // (Le chiffre cherché : 2 à 9 ; « 1 dm » se lirait dans la relation
    // de l'image, « 1 dm = 10 cm ».)
    ch[k] = entre(rng, 2, 9);
    const X = milli(ch[0] * 100 + ch[1] * 10 + ch[2]);
    const [de, v] = degre >= 2 ? [us[0], convertir(X, us[2], us[0])] : [us[2], X];
    const morceau = i => (i === k ? `${CASE}${NB}${us[i]}` : mes(milli(ch[i]), us[i]));
    const tous = [0, 1, 2].map(i => mes(milli(ch[i]), us[i]));
    const resume = `${mes(v, de)} = ${tous.join(" + ")}`;
    const vers = de === us[0] ? us[2] : us[0];
    // (La décomposition en entier sur sa ligne, la case et l'unité dessous :
    // « 699 cm = … m + 9 dm + 9 cm » ne tenait pas sur une ligne avec la
    // case au petit téléphone.)
    const phrase = `${mes(v, de)} = ${[0, 1, 2].map(morceau).join(" + ")}`;
    return q({
      code, degre, forme: "phrase", texte: phrase,
      morceaux: {phrase, apres: us[k]},
      reponse: String(ch[k]), reponseTexte: tous[k], unite: us[k], resume,
      relation: relationTexte(us[0], us[2]), outil: "glisse-unite", glisse: glisse(v, de, vers, {cm1: true, decimaux: true}),
      image: [relationTexte(us[0], us[1]), relationTexte(us[1], us[2])],
      correction: [`${mes(X, us[2])} = ${[0, 1, 2].map(i => mes(milli(ch[i]) * facteur(us[i], us[2]), us[2])).join(" + ")}`, resume],
      grandeur: grandeurDe(de), relationCle: `${us[0]}-${us[2]}`, sorteC5: "decomposer",
      donnees: {type: "decomp", valeur: brut(v), de, parts: [0, 1, 2].map(i => [String(ch[i]), us[i]]), cache: k},
      cle: `${code}:${brut(v)}${de}>dec${k}`
    });
  }

  // Les conversions officielles (S002) : d'une petite unité vers la
  // grande, un nombre entier devient un nombre à virgule (1 600 m = 1,6 km ;
  // 2 100 mg = 2,1 g ; 34 mm = 3,4 cm ; 250 cL = 2,5 L) ; d3 : les zéros
  // (2 050 m = 2,05 km ; 305 cg = 3,05 g).
  const OFFICIELLES = [["m", "km"], ["mg", "g"], ["g", "kg"], ["cL", "L"], ["mm", "cm"], ["cg", "g"], ["cm", "m"]];
  function questionOfficielle(code, degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [p, g] = choisir(rng, OFFICIELLES);
      const f = facteur(g, p);
      const [a, b] = [entre(rng, 1, 9), entre(rng, 1, 9)];
      let n;
      if (f === 1000n) n = degre === 3 ? a * 1000 + b * 10 : a * 1000 + b * 100 + (rng() < 0.4 ? entre(rng, 1, 9) * 10 : 0);
      else if (f === 100n) n = degre === 3 ? a * 100 + b : a * 100 + b * 10 + (rng() < 0.4 ? entre(rng, 1, 9) : 0);
      else n = a * 10 + b;
      const x = conversionDec(code, degre, milli(n), p, g);
      if (x) return Object.assign(x, {sorteC5: "officielle"});
    }
    return null;
  }

  // Les erreurs de C5 au pavé. Une ligne au petit téléphone.
  function erreursC5(question, lu, cases, saisie) {
    const d = question.donnees;
    if (d.type === "conv") return erreursDec(question, lu, cases, saisie);
    if (d.type === "somme") {
      const A = milli(d.a);
      const B = milli(d.b);
      const vers = d.vers;
      const attendu = milli(question.reponse);
      // (Une ligne au petit téléphone, police large comprise : « Avant
      // d'ajouter, j'écris tout en kg. » en prenait deux.)
      if (lu === A + B) return {erreur: 5, retour: `J'écris d'abord tout en ${vers}.`};
      if (vers === d.ub) {
        const colle = lireMilli(`${d.a}${d.b}`);
        if (lu === colle && colle !== attendu) return {erreur: 6, retour: `${mes(A, d.ua)}, c'est ${mes(convertir(A, d.ua, d.ub), d.ub)}.`};
        if (lu === convertir(A, d.ua, d.ub) + B * 10n) return {erreur: 7, retour: `${mes(B, d.ub)}, ce n'est pas ${mes(B * 10n, d.ub)}.`};
        return null;
      }
      const partie = convertir(B, d.ub, d.ua);
      const faux = lireMilli(`${d.a},${d.b}`);
      if (typeof faux === "bigint" && lu === faux && faux !== attendu) return {erreur: 6, retour: `${mes(B, d.ub)}, c'est ${mes(partie, d.ua)}.`};
      if (lu === convertir(A, d.ua, d.ub) + B) return {erreur: 7, retour: `${ecrire(lu)}, ce serait des ${d.ub}.`};
      return null;
    }
    if (d.type === "deux") {
      if (!cases) return null;
      const f = facteur(d.grande, d.petite) * MILLE;
      const total = convertir(milli(d.valeur), d.de, d.petite);
      const a = total / f;
      const b = total % f;
      const reste = convertir(b, d.petite, d.grande);
      if (cases[0] === a * MILLE && (cases[1] === b * 10n || cases[1] * 10n === b)) return {erreur: 6, retour: `${mes(reste, d.grande)}, c'est ${mes(b, d.petite)}.`};
      return null;
    }
    if (d.type === "decomp") {
      if (lu >= 10n * MILLE) return {erreur: 8, retour: "Un seul chiffre par unité."};
      return null;
    }
    return null;
  }

  // Les écritures de C5 : Je valide, « Trouve l'intrus » en 4e, « Coche
  // tout ce qui est égal à… » en dernier (jamais retirée du mêlé) ; À toi :
  // l'intrus deux fois, « Coche » deux fois (choix de Gwenaël du 18/11).
  function formesC5(usage) {
    if (usage === "valide") return {3: "intrus", 9: "plusieurs"};
    if (usage === "entraine") return {8: "intrus", 12: "plusieurs", 19: "intrus", 22: "plusieurs"};
    return {};
  }
  const SORTES_C5 = {1: ["deux-bas", "deux-bas", "decomposer", "plus-bas"], 2: ["deux-haut", "deux-cases", "decomposer", "officielle", "plus-haut"],
    3: ["deux-bas", "deux-haut", "deux-cases", "officielle", "plus-haut"]};
  ETAPES.C5 = {
    clesExemples: ["C5:2m15cm>cm", "C5:34mm>cm", "C5:i:205cm"],
    tirer(rng, degre, i, usage, forme) {
      if (forme === "intrus") return questionIntrus("C5", degre, rng);
      if (forme === "plusieurs") return questionPlusieurs("C5", degre, rng);
      const sorte = choisir(rng, SORTES_C5[degre]);
      const zero = degre === 3;
      if (sorte === "deux-bas") return questionDeuxUnites("C5", degre, rng, {haut: false, plus: false, zero});
      if (sorte === "deux-haut") return questionDeuxUnites("C5", degre, rng, {haut: true, plus: false, zero});
      if (sorte === "plus-bas") return questionDeuxUnites("C5", degre, rng, {haut: false, plus: true, zero});
      if (sorte === "plus-haut") return questionDeuxUnites("C5", degre, rng, {haut: true, plus: true, zero});
      if (sorte === "deux-cases") return questionDeuxCasesC5("C5", degre, rng);
      if (sorte === "decomposer") return questionDecomposer("C5", degre, rng);
      return questionOfficielle("C5", degre, rng);
    },
    formes: formesC5,
    // (Dans Je valide : une même relation deux fois au plus, une même sorte
    // deux fois au plus.)
    accepte(serie, question, usage) {
      if (usage !== "valide") return true;
      if (serie.filter(x => x.relationCle === question.relationCle).length >= 2) return false;
      // (Décomposer : une fois.)
      return serie.filter(x => x.sorteC5 === question.sorteC5).length < (question.sorteC5 === "decomposer" ? 1 : 2);
    },
    valide: serieConvertirBonne,
    erreurs: erreursC5
  };

  // ------------------------------------------- C6 · Les fractions usuelles
  // Lot B2-2a (carte v4 ; S002 p. 15-16 : ½ km = 500 m ; ¾ m = 3 × ¼ m =
  // 3 × 25 cm = 75 cm ; ¼ kg = 250 g ; ½ t = 500 kg ; p. 11 : les bandes de
  // 37/10 cm et de 4 + 3/10 cm). Choix de Gwenaël du 18/11 (sur maquette) :
  // l'outil, la double droite graduée ; l'image, la barre partagée ; la
  // correction, la double droite complétée ; les fractions écrites en
  // colonne. Une fraction s'écrit avec la barre de fraction U+2044
  // (« 3⁄4 ») : la page la pose en colonne (`AIDES.fractions`).
  // Les sortes : « 3⁄4 L = … cL » (nombre), « Combien de centilitres dans
  // trois quarts de litre ? » (phrase), une situation (« Une recette demande
  // 3⁄4 L de lait. »), les « ponts » de l'exerciseur (trois réponses au
  // choix, les vraies erreurs), « 75 cL = … L » (¼, ½ ou ¾ au choix), les
  // dixièmes (3⁄10 m = 30 cm), « un litre et demi » (1 L + 1⁄2 L), les
  // bandes à comparer (37⁄10 cm ou 4 + 3⁄10 cm ?).
  const FR = "⁄";
  function fracTexte(n, d) {
    return `${n}${FR}${d}`;
  }
  function pgcd(a, b) {
    return b ? pgcd(b, a % b) : a;
  }
  const NOMBRES_MOTS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const DEMI = {L: "un demi-litre", m: "un demi-mètre", km: "un demi-kilomètre", kg: "un demi-kilogramme", t: "une demi-tonne", cm: "un demi-centimètre"};
  // « trois quarts de litre », « sept dixièmes de mètre », « deux litres et
  // demi ».
  function fracEnMots(n, d, u, a = 0) {
    if (a) return `${a === 1 ? "un" : NOMBRES_MOTS[a]} ${a === 1 ? MOT[u] : MOTS[u]} et demi`;
    if (d === 2) return DEMI[u];
    const nom = d === 4 ? (n === 1 ? "un quart" : "trois quarts") : `${NOMBRES_MOTS[n]} dixième${n > 1 ? "s" : ""}`;
    return `${nom} de ${MOT[u]}`;
  }
  // La mesure écrite : « 3⁄4 L », « 1 L + 1⁄2 L ».
  function fracMesure(n, d, u, a = 0) {
    return a ? `${a}${NB}${u} + ${fracTexte(n, d)}${NB}${u}` : `${fracTexte(n, d)}${NB}${u}`;
  }
  // Les paires (l'unité de la fraction, l'unité de la réponse).
  const PAIRES_C6 = {
    d1: [["L", "cL"], ["kg", "g"], ["m", "cm"], ["km", "m"], ["t", "kg"], ["L", "mL"], ["cm", "mm"]],
    trois: [["L", "cL"], ["L", "mL"], ["kg", "g"], ["m", "cm"], ["km", "m"], ["t", "kg"]],
    mille: [["L", "mL"], ["kg", "g"], ["km", "m"], ["t", "kg"]],
    demi: [["L", "cL"], ["kg", "g"], ["km", "m"], ["m", "cm"]]
  };
  // Les situations (l'unité, la réponse, les fractions qui vont, la phrase).
  // « {F} » : la mesure écrite ; « {M} » : en mots (un litre et demi) ;
  // de La Réunion ? ; pour « et demi », le plus grand nombre d'unités
  // (une bouteille de jus d'un litre et demi, pas de trois).
  const SITUATIONS_C6 = [
    ["L", "cL", ["1/2", "1/4", "3/4"], "Une recette demande {F} de lait."],
    ["L", "cL", ["1/2", "1/4"], "Un pot de {F} de jus de goyavier.", true],
    ["L", "cL", ["1/2"], "Une bouteille d'eau de {F}."],
    ["L", "mL", ["1/2", "1/4", "3/4"], "Une recette de crêpes demande {F} de lait."],
    ["L", "cL", ["a"], "Une bouteille de jus contient {M}.", false, 1],
    ["kg", "g", ["1/2", "1/4", "3/4"], "Une recette demande {F} de farine."],
    ["kg", "g", ["1/2", "1/4"], "Un sachet de {F} de piments.", true],
    ["kg", "g", ["3/4", "1/2"], "Il faut {F} de tomates pour le rougail.", true],
    ["kg", "g", ["1/2"], "Un sac de {F} de letchis.", true],
    ["kg", "g", ["a"], "Un sac de riz pèse {M}.", true, 4],
    ["km", "m", ["1/2", "1/4", "3/4"], "La plage est à {F} de l'école.", true],
    ["km", "m", ["a"], "Une randonnée de {M}.", false, 4],
    ["m", "cm", ["1/2", "1/4", "3/4"], "Un ruban de {F}."],
    ["m", "cm", ["1/2", "3/4"], "Un morceau de canne à sucre de {F}.", true],
    ["m", "cm", ["a"], "Une table mesure {M}.", false, 2],
    ["t", "kg", ["1/2", "1/4", "3/4"], "Une remorque de {F} de cannes à sucre.", true]
  ];
  function situationC6(rng, n, d, g, p, a) {
    const cle = a ? "a" : `${n}/${d}`;
    const possibles = SITUATIONS_C6.filter(([u, v, fr, , , max]) => u === g && v === p && fr.includes(cle) && (!a || a <= max));
    if (!possibles.length) return null;
    const locaux = possibles.filter(s => s[4]);
    const [, , , modele] = choisir(rng, locaux.length && rng() < 0.5 ? locaux : possibles);
    const phrase = modele.replace("{F}", fracMesure(n, d, g)).replace("{M}", fracEnMots(n, d, g, a));
    return `${phrase} Combien de ${MOTS[p]}${NB}?`;
  }

  // Une question de C6 : n⁄d de l'unité g (et `a` unités entières : un litre
  // et demi), à écrire dans l'unité p. `forme` : nombre, phrase, situation.
  // Rend null si la fraction ne tombe pas juste dans p, ou si aucune
  // situation ne va.
  function questionFrac(code, degre, rng, {n, d, g, p, a = 0, forme = "nombre"}) {
    const unite = facteur(g, p) * MILLE;
    if (unite % BigInt(d * 1000) !== 0n) return null;
    const part = unite / BigInt(d);
    const rep = BigInt(a) * unite + BigInt(n) * part;
    const F = fracTexte(n, d);
    const k = pgcd(n, d);
    const gauche = fracMesure(n, d, g, a);
    let texte;
    let morceaux;
    if (forme === "phrase") {
      const phrase = `Combien de ${MOTS[p]} dans ${fracEnMots(n, d, g, a)}${NB}?`;
      texte = phrase;
      morceaux = {phrase, apres: p};
    } else if (forme === "situation") {
      const phrase = situationC6(rng, n, d, g, p, a);
      if (!phrase) return null;
      texte = phrase;
      morceaux = {phrase, apres: p, situation: true};
    } else {
      texte = `${gauche} = ${CASE}${NB}${p}`;
      morceaux = {avant: `${gauche} =`, apres: p};
    }
    // La correction : une ligne sous la double droite complétée.
    const ligne = a ? `${mes(BigInt(a) * unite, p)} + ${mes(part, p)} = ${mes(rep, p)}`
      : n === 1 ? `${F}${NB}${g} = ${mes(unite, p)} ÷ ${d} = ${mes(rep, p)}`
        : `${F}${NB}${g} = ${n} × ${mes(part, p)} = ${mes(rep, p)}`;
    // L'image (sous la barre partagée) : le calcul posé, sans le résultat.
    // (Un et demi : une ligne ; avec « 1 L + 1⁄2 L » en plus, l'image
    // débordait de sa zone au petit iPhone.)
    const image = a ? [`${fracTexte(1, 2)}${NB}${g} : la moitié de 1${NB}${g}`]
      : n === 1 ? [`${F}${NB}${g} = ${mes(unite, p)} ÷ ${d}`]
        : [`${F}${NB}${g} = ${n} × ${fracTexte(1, d)}${NB}${g}`];
    return q({
      code, degre, forme: forme === "nombre" ? "nombre" : "phrase", texte, morceaux,
      reponse: brut(rep), reponseTexte: mes(rep, p), unite: p,
      resume: `${gauche} = ${mes(rep, p)}`,
      relation: relationTexte(g, p), outil: "droite2",
      // (Un et demi : la droite de l'unité entière d'avant à la suivante,
      // « 4 km = 4 000 m » à gauche ; de 0 à 5 km, les graduations se
      // chevauchaient au téléphone.)
      droite: {haut: g, bas: p, parts: d, valeur: brut(unite), cherche: n, tout: 1, debut: a},
      barre: {haut: g, bas: p, parts: d, valeur: brut(unite), colorees: n},
      image, correction: [ligne],
      grandeur: grandeurDe(g), relationCle: `${g}-${p}`, fraction: `${n / k}/${d / k}`,
      sorteC6: a ? "demi-plus" : d === 10 ? "dixiemes" : `${n}/${d}`,
      donnees: {type: "frac", n: String(n), d: String(d), a: String(a), de: g, vers: p},
      cle: `${code}:${a ? `${a}+` : ""}${n}/${d}${g}>${p}`
    });
  }

  // Les pourquoi de C6 (une ligne au petit téléphone).
  function erreursC6(question, lu) {
    const x = question.donnees;
    if (!x || x.type !== "frac") return null;
    const [n, d, a] = [Number(x.n), Number(x.d), Number(x.a)];
    const unite = facteur(x.de, x.vers) * MILLE;
    const part = unite / BigInt(d);
    const rep = milli(question.reponse);
    const F = fracTexte(n, d);
    if (a) {
      if (lu === BigInt(n) * part) return {erreur: 2, retour: `Et ${mes(BigInt(a) * unite, x.vers)} en plus.`};
      if (lu === milli(`${a},5`)) return {erreur: 3, retour: `${ecrire(lu)}, ce serait des ${x.de}.`};
      if (lu === BigInt(a) * unite + 5n * MILLE || lu === milli(Number(`${a}5`))) return {erreur: 4, retour: `${F}${NB}${x.de}, c'est ${mes(part, x.vers)}.`};
      return null;
    }
    if (n > 1 && lu === part) return {erreur: 1, retour: `C'est ${fracTexte(1, d)}${NB}${x.de} : il en faut ${n}.`};
    if (lu === rep * 10n || lu * 10n === rep) return {erreur: 2, retour: `${relationTexte(x.de, x.vers)}.`};
    if (lu >= unite) return {erreur: 3, retour: `${F}${NB}${x.de}, c'est moins de 1${NB}${x.de}.`};
    const colles = [n, d, Number(`${n}${d}`), Number(`${n}${d}0`), Number(`${n}${d}00`)].map(y => BigInt(y) * MILLE).concat([milli(`${n},${d}`)]);
    if (colles.includes(lu)) return {erreur: 4, retour: `${F}, c'est ${n} part${n > 1 ? "s" : ""} sur ${d}.`};
    return null;
  }

  // Les « ponts » de l'exerciseur (un demi, un quart, trois quarts) (« Un quart de litre, c'est : 25 cL ;
  // 15 cL ; 250 cL ») : la question en mots, trois réponses au choix ; les
  // fausses sont les vraies erreurs (une seule part, un zéro de trop ou de
  // moins, les chiffres collés, plus de 1 L).
  function enChoixFrac(x, rng) {
    if (!x || x.donnees.type !== "frac" || Number(x.donnees.a) || x.donnees.d === "10") return null;
    const v = x.donnees;
    const [n, d] = [Number(v.n), Number(v.d)];
    const unite = facteur(v.de, v.vers) * MILLE;
    const part = unite / BigInt(d);
    const rep = milli(x.reponse);
    // (Les chiffres collés, « 340 g » pour 3⁄4 kg, seulement pour trois
    // quarts ; un quart lu « 4 » ; quatre litres pour un quart, jamais
    // pour un demi.)
    const colle = n > 1 ? BigInt(Number(`${n}${d}`) * (unite >= 1000n * MILLE ? 10 : 1)) * MILLE : d === 4 ? BigInt(d) * MILLE : null;
    const faux = [n > 1 ? part : null, colle, rep % 10000n === 0n ? rep / 10n : null, rep * 10n, d === 4 ? BigInt(d) * unite : null];
    const propres = [];
    faux.forEach(y => {
      if (y !== null && y !== rep && y >= MILLE && y % MILLE === 0n && y <= 100000n * MILLE && !propres.includes(y)) propres.push(y);
    });
    if (propres.length < 2) return null;
    const deux = [propres[0], choisir(rng, propres.slice(1))];
    const choix = melanger(rng, [rep, ...deux]).map(ecrire);
    const bon = choix.indexOf(ecrire(rep));
    const pourquoi = {};
    choix.forEach((c, k) => {
      if (k === bon) return;
      const e = erreursC6(x, milli(c.replace(new RegExp(FINE, "g"), "")));
      pourquoi[k] = e ? e.retour : `${fracTexte(n, d)}${NB}${v.de} = ${mes(rep, v.vers)}.`;
    });
    const mots = fracEnMots(n, d, v.de);
    // (« = … g » ensemble : seul en début de ligne, « … g » se lisait mal.)
    const phrase = `${mots[0].toUpperCase()}${mots.slice(1)}${NB}=${NB}${CASE}${NB}${v.vers}`;
    return Object.assign(x, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: v.vers, sorte: "valeur"},
      choix, bon, pourquoi, cleBase: x.cle, cle: `${x.cle}:q`, sorteC6: "pont"
    });
  }

  // « 75 cL = … L » : un quart, un demi ou trois quarts de l'unité, au
  // choix (les trois, toujours dans le même ordre).
  function questionPart(code, degre, rng) {
    const [g, p] = choisir(rng, PAIRES_C6.trois);
    const [n, d] = choisir(rng, [[1, 4], [1, 2], [3, 4]]);
    const unite = facteur(g, p) * MILLE;
    const part = unite / 4n;
    const v = unite * BigInt(n) / BigInt(d);
    const choix = ["1/4", "1/2", "3/4"].map(f => f.replace("/", FR));
    const bon = choix.indexOf(fracTexte(n, d));
    const pourquoi = {};
    // (Le pourquoi sans fraction : « 1⁄2 L, c'est 500 mL. » en colonne
    // grandissait le panneau de Je valide, 83 % au petit iPhone dans WebKit.)
    [[1, 4], [1, 2], [3, 4]].forEach(([a, b], k) => { if (k !== bon) pourquoi[k] = `Ce serait ${mes(unite * BigInt(a) / BigInt(b), p)}, pas ${mes(v, p)}.`; });
    const phrase = `${mes(v, p)} = ${CASE}${NB}${g}`;
    const quarts = (n * 4) / d;
    const ligne = quarts === 1 ? `${mes(v, p)} = ${mes(unite, p)} ÷ 4 = ${fracTexte(1, 4)}${NB}${g}`
      : `${mes(v, p)} = ${quarts} × ${mes(part, p)} = ${fracTexte(n, d)}${NB}${g}`;
    return q({
      code, degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: g, sorte: "part"},
      choix, bon, pourquoi, reponse: String(bon), reponseTexte: `${fracTexte(n, d)}${NB}${g}`, unite: g,
      resume: `${mes(v, p)} = ${fracTexte(n, d)}${NB}${g}`, correction: [ligne],
      relation: relationTexte(g, p), outil: "droite2",
      droite: {haut: g, bas: p, parts: 4, valeur: brut(unite), cherche: quarts, tout: 1, partie: true},
      barre: {haut: g, bas: p, parts: 4, valeur: brut(unite), colorees: 0},
      // (L'image ne dit pas « 1⁄4 L = 100 cL ÷ 4 » : pour 25 cL, ce serait
      // la réponse. La relation est déjà sur la barre.)
      image: [`Je partage 1${NB}${g} en 4 parts égales.`],
      grandeur: grandeurDe(g), relationCle: `${g}-${p}`, fraction: `${n}/${d}`, sorteC6: "part",
      donnees: {type: "frac-part", valeur: brut(v), de: p, vers: g, n: String(n), d: String(d)},
      cle: `${code}:part:${brut(v)}${p}>${g}`
    });
  }

  // Les bandes de S002 (p. 11) : « 37⁄10 cm ou 4 + 3⁄10 cm : quelle bande
  // est la plus longue ? » ; une fois sur quatre, la même longueur.
  function questionBandes(code, degre, rng) {
    let A;
    do { A = entre(rng, 21, 69); } while (A % 10 === 0);
    let b;
    let c;
    // (Comme dans S002, des longueurs proches : le nombre d'unités de
    // l'une, ou celui d'après — « 37 » paraît plus grand que « 4 ».)
    if (rng() < 0.25) { b = Math.floor(A / 10); c = A % 10; }
    else {
      do { b = Math.floor(A / 10) + entre(rng, 0, 1); c = entre(rng, 1, 9); } while (Math.abs(b * 10 + c - A) < 2);
    }
    const B = b * 10 + c;
    const tA = `${fracTexte(A, 10)}${NB}cm`;
    const tB = `${b} + ${fracTexte(c, 10)}${NB}cm`;
    const choix = [tA, tB, "Même longueur"];
    const bon = A === B ? 2 : A > B ? 0 : 1;
    const dA = `${ecrire(milli(A) / 10n)}${NB}cm`;
    const dB = `${ecrire(milli(B) / 10n)}${NB}cm`;
    const pourquoi = {};
    choix.forEach((x, k) => {
      if (k === bon) return;
      pourquoi[k] = bon === 2 ? `Les deux font ${dA}.` : k === 2 ? `${dA}, ce n'est pas ${dB}.` : `${x}, c'est ${k === 0 ? dA : dB}.`;
    });
    const phrase = "Quelle bande est la plus longue ?";
    return q({
      code, degre, forme: "qcm", texte: `${phrase} ${tA} ; ${tB}`,
      morceaux: {phrase: `Une bande de ${tA}, une bande de ${tB}.`, consigne: "Laquelle est la plus longue ?"},
      choix, bon, pourquoi, reponse: String(bon), reponseTexte: choix[bon], unite: "cm",
      resume: bon === 2 ? `${tA} = ${tB} = ${dA}` : `${choix[bon]} : la plus longue`,
      correction: [`${tA} = ${dA}`, `${tB} = ${dB}`],
      relation: `${fracTexte(10, 10)}${NB}cm = 1${NB}cm`, outil: "lignes",
      outilLignes: [`${fracTexte(10, 10)}${NB}cm = 1${NB}cm`, "J'écris chaque longueur avec une virgule."],
      image: [`${tA} = ${Math.floor(A / 10)}${NB}cm + ${fracTexte(A % 10, 10)}${NB}cm`],
      grandeur: "longueur", relationCle: "bandes", sorteC6: "bandes",
      donnees: {type: "bandes", a: String(A), b: String(b), c: String(c)},
      cle: `${code}:bandes:${A}|${b}+${c}`
    });
  }

  // Les degrés : d1 un demi, un quart, un dixième ; d2 trois
  // quarts, les dixièmes, et le millilitre ; d3 « un litre et demi », trois
  // quarts et les dixièmes vers g, m, kg, mL.
  function tirerC6(rng, degre, forme) {
    for (let essai = 0; essai < 40; essai += 1) {
      let n;
      let d;
      let a = 0;
      let paire;
      if (degre === 1) {
        paire = choisir(rng, PAIRES_C6.d1);
        // (Et un dixième, « 1⁄10 L = 10 cL » : avec un demi et un quart
        // seulement, neuf questions, et Je valide reprenait celles d'À toi.)
        [n, d] = choisir(rng, [[1, 2], [1, 2], [1, 4], [1, 10]]);
        if (paire[1] === "mm" && d !== 2) continue;
      } else if (degre === 2) {
        if (rng() < 0.65) { paire = choisir(rng, PAIRES_C6.trois); [n, d] = rng() < 0.8 ? [3, 4] : choisir(rng, [[1, 4], [1, 2]]); }
        else { paire = choisir(rng, PAIRES_C6.trois); n = entre(rng, 1, 9); d = 10; }
      } else {
        const r = rng();
        if (r < 0.4) { paire = choisir(rng, PAIRES_C6.demi); [n, d] = [1, 2]; a = entre(rng, 1, 4); }
        else if (r < 0.7) { paire = choisir(rng, PAIRES_C6.mille); [n, d] = choisir(rng, [[3, 4], [1, 4], [3, 4]]); }
        else { paire = choisir(rng, PAIRES_C6.mille); n = entre(rng, 2, 9); d = 10; }
      }
      const [g, p] = paire;
      const x = questionFrac("C6", degre, rng, {n, d, g, p, a, forme: forme === "phrase" || forme === "situation" ? forme : "nombre"});
      if (x) return x;
    }
    return null;
  }
  // Je valide : une phrase en 3e, un pont au choix en 5e, une situation en
  // 7e, « 75 cL = … L » en 9e. À toi : une question sur quatre en phrase,
  // une sur quatre en situation ; les ponts aux places 5, 12 et 23 ;
  // « … = … L » aux places 9 et 18 ; les bandes à la 21e.
  function formesC6(usage, rng) {
    const f = formesConvertir(usage, rng);
    Object.keys(f).forEach(i => { if (f[i] === "objet") f[i] = "situation"; });
    if (usage === "valide") { f[4] = "choix"; f[6] = "situation"; f[8] = "part"; }
    if (usage === "entraine") {
      [4, 11, 22].forEach(i => { f[i] = "choix"; });
      [8, 17].forEach(i => { f[i] = "part"; });
      f[20] = "bandes";
    }
    return f;
  }
  ETAPES.C6 = {
    clesExemples: ["C6:3/4L>cL", "C6:1/2km>m", "C6:3/4m>cm"],
    tirer(rng, degre, i, usage, forme) {
      if (forme === "part") return questionPart("C6", degre, rng);
      if (forme === "bandes") return questionBandes("C6", degre, rng);
      if (forme === "choix") {
        for (let essai = 0; essai < 20; essai += 1) {
          const x = enChoixFrac(tirerC6(rng, Math.min(degre, 2), "nombre"), rng);
          if (x) return Object.assign(x, {degre});
        }
        return null;
      }
      return tirerC6(rng, degre, forme);
    },
    formes: formesC6,
    // (Dans Je valide : une même paire d'unités deux fois au plus, une même
    // fraction trois fois au plus.)
    accepte(serie, question, usage) {
      if (usage !== "valide") return true;
      if (serie.filter(x => x.relationCle === question.relationCle).length >= 2) return false;
      return serie.filter(x => x.fraction && x.fraction === question.fraction).length < 3;
    },
    valide: serieConvertirBonne,
    erreurs: erreursC6
  };

  // ============================================================== LES SÉRIES

  const PLANS = {
    valide: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    entraine: [...Array(6).fill(1), ...Array(9).fill(2), ...Array(10).fill(3)],
    test: [2, 3, 3, 2],
    echauffement: [2],
    aide: [1, 2, 2],
    // Lot 3a (14/11/2026) : les questions d'un retour (« Je me souviens »,
    // « Avant de partir ») : 2 au premier retour, 1 ensuite (`nombre`).
    retour: [2, 2]
  };

  function plan(usage, nombre) {
    if (usage === "exerciseur") {
      const n = Math.max(1, nombre || 10);
      return Array.from({length: n}, (_, i) => 1 + Math.min(2, Math.floor((3 * i) / n)));
    }
    const p = PLANS[usage] || PLANS.entraine;
    return nombre ? p.slice(0, nombre) : p.slice();
  }

  function etapePrete(code) {
    return Boolean(ETAPES[code]);
  }

  // Les clés des exemples de « J'apprends » de cette étape (exclues des
  // séries, sauf pour les étapes de faits à savoir par cœur : leurs exemples
  // SONT les faits, la validation doit pouvoir les demander).
  function clesExemples(code) {
    const e = ETAPES[code];
    if (!e || e.exclureExemples === false) return [];
    return e.clesExemples || [];
  }

  // La série d'une étape. Même graine, même série.
  function serie(code, {usage = "entraine", graine = 1, nombre = null, exclure = []} = {}) {
    const etape = ETAPES[code];
    if (!etape) return [];
    const degres = plan(usage, nombre);
    const interdits = new Set([...clesExemples(code), ...exclure]);
    for (let tour = 0; tour < 40; tour += 1) {
      const rng = mulberry32((graine + tour * 0x9e3779b9) >>> 0);
      const formes = etape.formes ? etape.formes(usage, rng) : {};
      const s = [];
      const epuise = {};
      degres.forEach((degre, i) => {
        const forme = formes[i] || null;
        // `cleBase` : un même problème posé autrement (« Est-ce
        // vraisemblable ? ») reste le même problème.
        const base = x => x.cleBase || x.cle;
        // `jamais` : une contrainte de l'étape qui tient toujours, même quand
        // le vivier s'épuise (lot A2 ter : un repère ne revient pas).
        const jamais = x => !etape.jamais || etape.jamais(s, x, usage);
        const accepte = (x, strict) => !interdits.has(base(x)) && !s.some(y => y.cle === x.cle || base(y) === base(x))
          && jamais(x) && (!strict || !etape.accepte || etape.accepte(s, x, usage));
        const tirer = d => {
          const x = etape.tirer(rng, d, i, usage, forme, s);
          if (x && forme && (forme === "phrase" || forme === "nombre" || forme === "objet") && x.forme !== "deux-cases" && !x.somme && x.forme !== "qcm") {
            return reformer(x, forme);
          }
          return x;
        };
        let choisie = null;
        // Un vivier déjà trouvé épuisé dans cette série ne se retente pas
        // (les étapes de faits n'ont que quelques questions par degré).
        if (!epuise[degre]) {
          for (let essai = 0; essai < 80 && !choisie; essai += 1) {
            const x = tirer(degre);
            if (x && accepte(x, essai < 50)) choisie = x;
          }
          if (!choisie) epuise[degre] = true;
        }
        // Le vivier du degré est épuisé : un degré voisin, puis, pour
        // l'entraînement seulement, une question déjà posée, jamais deux
        // fois de suite.
        if (!choisie && !epuise[`v${degre}`]) {
          for (let essai = 0; essai < 50 && !choisie; essai += 1) {
            // (Relier garde son degré : au degré 3, trois objets de la même
            // grandeur ; un degré voisin mélangerait les grandeurs.)
            const d = forme === "associer" ? degre : degre === 3 ? 2 : degre + 1;
            const x = tirer(essai % 2 ? d : degre);
            if (x && accepte(x, false)) choisie = Object.assign(x, {degre});
          }
          if (!choisie) epuise[`v${degre}`] = true;
        }
        for (let essai = 0; essai < 50 && !choisie && usage !== "valide" && usage !== "test"; essai += 1) {
          const x = tirer(degre);
          if (x && !interdits.has(base(x)) && (!s.length || base(s[s.length - 1]) !== base(x)) && jamais(x)) choisie = x;
        }
        if (choisie) s.push(choisie);
      });
      if (s.length === degres.length && (!etape.valide || etape.valide(s, usage))) return s.map((x, i) => Object.assign(x, {place: i + 1}));
    }
    return [];
  }

  // Une conversion posée en phrase ou en nombre (la forme imposée).
  // (« objet » s'affiche comme une phrase : sa forme reste « phrase ».)
  // Lot 3b : aucun objet vraisemblable pour cette mesure → null (le
  // générateur en tire une autre).
  function reformer(x, forme) {
    if (x.donnees.type !== "conv" || (x.forme === forme && forme !== "objet")) return x;
    const d = x.donnees;
    const ecrit = ecrireConversion(forme, milli(d.valeur), d.de, d.vers);
    if (!ecrit) return null;
    return Object.assign(x, {forme: forme === "nombre" ? "nombre" : "phrase", texte: ecrit.texte, morceaux: ecrit.morceaux});
  }

  // ---------------------------------------------------------- la vérification

  // saisie : un texte (nombre, phrase), deux textes (deux-cases), la place
  // du choix touché (qcm, vrai-faux), ou une liste de places (associer,
  // ranger, plusieurs).
  function verifier(question, saisie) {
    if (!question) return {juste: false, erreur: null, retour: null};
    if (question.forme === "qcm" || question.forme === "vrai-faux") {
      // (Lot B1-2 : le pourquoi d'une mauvaise réponse au choix, quand la
      // question en a un : « déci veut dire un dixième, pas un centième. »)
      const juste = Number(saisie) === question.bon;
      const pourquoi = !juste && question.pourquoi ? question.pourquoi[Number(saisie)] : null;
      return {juste, erreur: null, retour: pourquoi ? CARTE.typo(pourquoi) : null};
    }
    // Associer : la mesure choisie pour chaque objet ; ranger : les places
    // touchées, de la plus petite à la plus grande (lot A2 bis).
    if (question.forme === "associer" || question.forme === "ranger") {
      const attendu = question.forme === "associer" ? question.bonnes : question.ordre;
      const lu = Array.isArray(saisie) ? saisie.map(Number) : [];
      return {juste: lu.length === attendu.length && lu.every((x, k) => x === attendu[k]), erreur: null, retour: null};
    }
    // « Coche tout ce qui est égal à… » (lot B2-1b) : les places cochées.
    // Juste : toutes les bonnes cartes, et elles seules. Le pourquoi : la
    // première carte fausse cochée, dite dans une autre unité ; sinon, les
    // cartes oubliées.
    if (question.forme === "plusieurs") {
      const lu = [...new Set((Array.isArray(saisie) ? saisie : []).map(Number))].sort((a, b) => a - b);
      const bons = question.bons.slice().sort((a, b) => a - b);
      const juste = lu.length === bons.length && lu.every((x, k) => x === bons[k]);
      if (juste) return {juste: true, erreur: null, retour: null};
      const faux = lu.find(k => !bons.includes(k));
      const oublies = bons.filter(k => !lu.includes(k));
      let retour = null;
      if (faux !== undefined && question.pourquoi[faux]) retour = question.pourquoi[faux];
      // (Une ligne au petit téléphone : la carte oubliée, s'il n'y en a qu'une.)
      else if (oublies.length && lu.length) retour = oublies.length === 1 ? `Tu as oublié ${question.cartes[oublies[0]]}.` : "Tu en as oublié deux.";
      return {juste: false, erreur: faux !== undefined ? 9 : 10, retour: retour ? CARTE.typo(retour) : null};
    }
    const etape = ETAPES[question.code];
    if (question.forme === "deux-cases") {
      const lus = (Array.isArray(saisie) ? saisie : []).map(lireMilli);
      const attendus = question.reponse.map(milli);
      const juste = lus.length === 2 && lus.every((l, i) => typeof l === "bigint" && l === attendus[i]);
      if (juste) return {juste: true, erreur: null, retour: null};
      const e = etape && etape.erreurs && lus.every(l => typeof l === "bigint") ? etape.erreurs(question, null, lus) : null;
      return {juste: false, erreur: e ? e.erreur : null, retour: e ? CARTE.typo(e.retour) : null};
    }
    const lu = lireMilli(saisie);
    if (typeof lu !== "bigint") return {juste: false, erreur: null, retour: null};
    if (lu === milli(question.reponse)) return {juste: true, erreur: null, retour: null};
    // (Lot B2-1 : le texte tapé aussi, « 3,500 ».)
    const e = etape && etape.erreurs ? etape.erreurs(question, lu, undefined, saisie) : null;
    return {juste: false, erreur: e ? e.erreur : null, retour: e ? CARTE.typo(e.retour) : null};
  }

  // « Je prévois » (lot 3b-2, choix de Gwenaël du 14/11 : « grandir ou
  // rapetisser ? » seulement après une erreur de sens). Les erreurs de sens :
  // diviser au lieu de multiplier, ou l'inverse — l'erreur 1 de C1 et de C2,
  // l'erreur 3 de P1 (vers une unité plus grande, le nombre gardé ou
  // multiplié), l'erreur 3 de E1 (des centimes vers les euros, × 100).
  // Lot B1-2 : P2 (vers la petite unité seulement, divisé : 1), P3 et P4
  // (vers la grande aussi, multiplié : 3).
  // Lot B2-1 : C3 et C4, dans les deux sens ; C5 (B2-1b) : les conversions
  // officielles (1 600 m = … km), seulement.
  const SENS = {C1: [1], C2: [1], P1: [3], E1: [3], P2: [1], P3: [1, 3], P4: [1, 3], C3: [1, 3], C4: [1, 3], C5: [1, 3]};
  // `tape` : ce que l'élève a écrit (ou le texte du choix touché).
  function erreurDeSens(question, tape) {
    if (!question || !SENS[question.code] || question.forme === "deux-cases" || question.forme === "associer" || question.forme === "ranger" || question.forme === "plusieurs") return false;
    const etape = ETAPES[question.code];
    const lu = lireMilli(tape);
    if (typeof lu !== "bigint" || !etape || !etape.erreurs) return false;
    if (lu === milli(question.reponse)) return false;
    const e = etape.erreurs(question, lu);
    return Boolean(e && SENS[question.code].includes(e.erreur));
  }
  // Le sens attendu : le nombre grandit (vers une unité plus petite) ou
  // rapetisse (vers une plus grande), et la phrase qui le dit.
  function sensDe(question) {
    const d = question.donnees || {};
    let grandit;
    let de;
    let vers;
    if (d.type === "conv") { grandit = exposant(d.de) > exposant(d.vers); de = d.de; vers = d.vers; }
    else if (d.type === "argent") { grandit = question.unite === "c"; de = grandit ? "€" : "c"; vers = grandit ? "c" : "€"; }
    else return null;
    const phrase = grandit ? `De ${de} à ${vers}, une unité plus petite : il en faut plus. Le nombre grandit.`
      : `De ${de} à ${vers}, une unité plus grande : il en faut moins. Le nombre rapetisse.`;
    return {grandit, phrase: CARTE.typo(phrase), question: CARTE.typo(`De ${de} à ${vers} : le nombre va-t-il grandir ou rapetisser ?`)};
  }
  // Pour le robot de vérification : une réponse qui est une erreur de sens
  // (le texte à taper, ou la place du choix), ou null.
  function fauxDeSens(question) {
    if (!question || !SENS[question.code]) return null;
    if (question.choix) {
      const i = question.choix.findIndex(c => erreurDeSens(question, c));
      return i >= 0 ? {choix: i} : null;
    }
    const d = question.donnees || {};
    const candidats = [];
    if (d.type === "conv") {
      const v = milli(d.valeur);
      const f = exposant(d.de) > exposant(d.vers) ? facteur(d.de, d.vers) : facteur(d.vers, d.de);
      candidats.push(v * f, v % f === 0n ? v / f : null, v);
    } else if (d.type === "argent") candidats.push(milli(d.total * 100));
    const bon = candidats.find(c => c !== null && erreurDeSens(question, ecrire(c)));
    return bon === undefined ? null : {texte: brut(bon)};
  }

  function exemples(code) {
    const e = CARTE.etape(code);
    return e && e.apprends ? e.apprends : [];
  }

  // La « carte » d'une question, montrée après une erreur à l'échauffement :
  // le repère du carnet, ou la relation.
  function carteDe(question) {
    if (question.repere) return {type: "repere", repere: question.repere};
    return {type: "relation", lignes: question.correction.slice(0, 2)};
  }

  // Une question sur un repère du carnet (l'échauffement) : « Une brique de
  // lait contient 1 … », trois unités au choix.
  function questionRepere(code, graine = 1) {
    const r = CARTE.repere(code);
    if (!r) return null;
    const etape = r.etape;
    return Object.assign(questionRepereBrute(etape, code, mulberry32(graine)), {degre: 2});
  }
  function questionRepereBrute(etape, code, rng) {
    // (Lot B1-1 : un repère du CM1 a ses unités, mg et mL comprises.)
    if (CARTE.etape(etape).palier >= 2) return questionRepere2(etape, 2, code, "unite", rng);
    return questionRepereInterne(etape, 2, code, "unite", rng);
  }

  return Object.freeze({
    serie,
    verifier,
    erreurDeSens,
    sensDe,
    fauxDeSens,
    questionRepere,
    exemples,
    graineDe,
    mulberry32,
    etapePrete,
    clesExemples,
    carteDe,
    // outils exposés pour les aides, les tests et l'exerciseur
    lireMilli,
    milli,
    ecrire,
    brut,
    mes,
    convertir,
    facteur,
    grandeurDe,
    exposant,
    UNITES,
    COLONNES,
    COLONNES_CM1,
    HORS_CYCLE_2,
    PREFIXES,
    PRENOMS,
    OBJETS,
    OBJETS_UNITE,
    OBJETS_MESURE,
    OBJETS_DECIMAUX,
    VRAISEMBLANCE,
    dansBornes,
    PLANS
  });
});
