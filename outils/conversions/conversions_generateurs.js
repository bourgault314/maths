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
    // (Lot B6-2 : le mégamètre, le microgramme et le nanogramme, le
    // microlitre ; la puissance, du watt au gigawatt.)
    longueur: {Mm: 6, km: 3, hm: 2, dam: 1, m: 0, dm: -1, cm: -2, mm: -3, "µm": -6, nm: -9},
    masse: {t: 6, kg: 3, hg: 2, dag: 1, g: 0, dg: -1, cg: -2, mg: -3, "µg": -6, ng: -9},
    contenance: {hL: 2, daL: 1, L: 0, dL: -1, cL: -2, mL: -3, "µL": -6},
    aire: {"km²": 6, "m²": 0, "dm²": -2, "cm²": -4, "mm²": -6},
    volume: {"m³": 0, "dm³": -3, "cm³": -6},
    octet: {o: 0, ko: 3, Mo: 6, Go: 9},
    puissance: {W: 0, kW: 3, MW: 6, GW: 9},
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
    mg: "milligrammes", hL: "hectolitres", daL: "décalitres",
    // Lot B6-2 : de nano à giga.
    Go: "gigaoctets", Mo: "mégaoctets", ko: "kilooctets", o: "octets", "µm": "micromètres", nm: "nanomètres", Mm: "mégamètres",
    "µg": "microgrammes", ng: "nanogrammes", "µL": "microlitres", W: "watts", kW: "kilowatts", MW: "mégawatts", GW: "gigawatts",
    // Lot B3-2 : les aires du CM2.
    "cm²": "centimètres carrés", "dm²": "décimètres carrés", "m²": "mètres carrés"
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
    hL: "hectolitre", daL: "décalitre",
    Go: "gigaoctet", Mo: "mégaoctet", ko: "kilooctet", o: "octet", "µm": "micromètre", nm: "nanomètre", Mm: "mégamètre",
    "µg": "microgramme", ng: "nanogramme", "µL": "microlitre", W: "watt", kW: "kilowatt", MW: "mégawatt", GW: "gigawatt"};
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

  // Lot R1-noms (21/11, choix de Gwenaël) : le nom de l'unité, lu à partir
  // de son symbole (« 1 cm, c'est… » : un centimètre, un centilitre, un
  // kilomètre) ou écrit à partir de son nom (« Un centimètre s'écrit 1… » :
  // cm, cL, km). Le programme du cycle 2 (S440) : les unités ET leurs
  // symboles. Les mauvaises réponses sont les vraies confusions : le même
  // début avec une autre grandeur (cm et cL, km et kg), une autre taille de
  // la même grandeur (cm et km, cL et L), le m de milli lu comme celui de
  // mètre (mm et m), le m du mètre et le « min » de la minute. Les dix
  // unités des dix repères de R1 ; la question garde son repère (son
  // dessin pour l'image, sa carte pour la correction).
  const FAUX_NOMS = {mm: ["m", "cm"], cm: ["cL", "km"], dm: ["dL", "cm"], m: ["mm", "min"], km: ["kg", "m"],
    g: ["kg", "L"], kg: ["km", "g"], t: ["kg", "L"], cL: ["cm", "L"], L: ["cL", "m"]};
  function questionNom(code, degre, rep, rng, sens = null) {
    const r = CARTE.repere(rep);
    const u = r.unite;
    const lu = x => CARTE.lu("1", x);
    const Lu = x => `${lu(x)[0].toUpperCase()}${lu(x).slice(1)}`;
    const ecrit = sens || (degre === 1 ? "nom" : degre === 3 ? "symbole" : choisir(rng, ["nom", "symbole"]));
    const unites = melanger(rng, [u, ...FAUX_NOMS[u]]);
    const bon = unites.indexOf(u);
    const pourquoi = {};
    let texte;
    let choix;
    if (ecrit === "nom") {
      texte = CARTE.typo(`1 ${u}, c'est ${CASE}`);
      choix = unites.map(lu);
      unites.forEach((x, k) => { if (k !== bon) pourquoi[k] = CARTE.typo(`${Lu(x)} s'écrit 1 ${x}.`); });
    } else {
      texte = CARTE.typo(`${Lu(u)} s'écrit 1${NB}${CASE}`);
      choix = unites.slice();
      unites.forEach((x, k) => { if (k !== bon) pourquoi[k] = CARTE.typo(`1 ${x}, c'est ${lu(x)}.`); });
    }
    return q({
      code, degre, forme: "qcm", texte,
      morceaux: {phrase: texte, apres: "", sorte: ecrit === "nom" ? "nom" : "symbole"},
      choix, bon, reponse: choix[bon], reponseTexte: ecrit === "nom" ? lu(u) : `1${NB}${u}`, pourquoi,
      unite: u, resume: CARTE.typo(`1 ${u}, c'est ${lu(u)}`), repere: rep, outil: "nom-unite", grandeur: r.grandeur,
      image: [], correction: [CARTE.typo(`1 ${u}, c'est ${lu(u)}.`)],
      donnees: {type: "nom", repere: rep, unite: u, sens: ecrit},
      cle: `${code}:${rep}:nom-${ecrit}`
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
      if (usage === "valide") return {0: "associer", 1: "quoi", 2: "unite", 3: "nom", 4: "valeur", 5: "quoi", 6: "regle", 7: "saisie", 8: "valeur", 9: "saisie"};
      if (usage === "entraine") {
        return {0: "associer", 1: "unite", 2: "quoi", 3: "nom", 4: "quoi", 5: "unite", 6: "regle", 7: "valeur", 8: "saisie", 9: "quoi",
          10: "associer", 11: "quoi", 12: "valeur", 13: "regle", 14: "nom", 15: "saisie", 16: "valeur", 17: "quoi", 18: "associer",
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
      if (forme === "nom") return questionNom("R1", degre, choisir(rng, reps), rng);
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
        : degre === 3 ? choisir(rng, ["valeur", "saisie"]) : choisir(rng, ["unite", "valeur", "saisie", "nom"]);
      if (sorte === "nom") return questionNom("R1", degre, choisir(rng, reps), rng);
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
    ["De Saint‑Denis à Saint‑Paul :", "30", "km", 2], ["Un bébé à la naissance :", "3", "kg", 2],
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
    ["mesurer la distance de Saint‑Denis à Saint‑Pierre", "km", "mm", 1], ["peser un éléphant", "t", "g", 1],
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
    ["Un match de football :", "90", "min", 2], ["De Saint‑Pierre à Saint‑Denis en voiture : environ", "1", "h", 2],
    ["Monter à pied au sommet du Piton des Neiges : environ", "5", "h", 3], ["Faire bouillir l'eau des pâtes :", "8", "min", 3],
    ["De La Réunion à Paris en avion : environ", "11", "h", 3], ["Un mois : environ", "30", "jours", 3], ["Une chanson :", "3", "min", 3],
    ["Laisser lever la pâte à pain :", "2", "h", 3],
    // Lot A2 ter : La Réunion.
    // (Lot R1-refonte : « Manger un samoussa : 2 min » retiré, Gwenaël, 18/11.)
    ["Prendre une douche : environ", "5", "min", 1], ["Faire cuire un cari : environ", "1", "h", 2],
    ["Le trajet en Car Jaune de Saint‑Pierre à Saint‑Denis : environ", "2", "h", 2], ["La marche jusqu'au Trou de Fer : environ", "2", "h", 3],
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
    return m ? `${h}${NB}h${NB}${m}${NB}min` : `${h}${NB}h`;
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
      forme: "deux-cases", texte: `${total}${NB}min = ${CASE}${NB}h${NB}${CASE}${NB}min`, morceaux: {avant: `${total}${NB}min =`, cases: ["h", "min"]},
      reponse: [String(h), String(m)], reponseTexte: hm(h, m), unite: "min", resume: `${total}${NB}min = ${h}${NB}h${NB}${m}${NB}min`,
      relation: `1${NB}h = 60${NB}min`, heure: {h, m, versHeures: true}, tableau: {},
      image: [`1${NB}h = 60${NB}min`, `${total}${NB}min = ${Array(h).fill(`60${NB}min`).join(" + ")} + ${m}${NB}min`],
      correction: [`1${NB}h = 60${NB}min`, `${total}${NB}min = ${Array(h).fill(`60${NB}min`).join(" + ")} + ${m}${NB}min = ${h}${NB}h${NB}${m}${NB}min`],
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
      forme: "deux-cases", texte: `${Mots}, c'est ${CASE}${NB}h${NB}${CASE}${NB}min`, morceaux: {avant: `${Mots}, c'est`, cases: ["h", "min"]},
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
          forme: "deux-cases", texte: `${mots} = ${CASE}${NB}h${NB}${CASE}${NB}min`, morceaux: {avant: `${mots} =`, cases: ["h", "min"]},
          reponse: [String(H), String(M)], reponseTexte: hm(H, M), unite: "min", resume: `${mots} = ${H}${NB}h${NB}${M}${NB}min`,
          relation: `un quart d'heure = 15${NB}min`, heure: {h, demis, quarts},
          image: [`une demi-heure = 30${NB}min ; un quart d'heure = 15${NB}min`, `${mots} = ${total}${NB}min`],
          correction: [`${mots} = ${total}${NB}min`, `${total}${NB}min = ${H}${NB}h${NB}${M}${NB}min`],
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
    [t => `Le Car Jaune part de Saint‑Pierre à ${t}.`, d => `Le trajet dure ${d}.`, "Arrivée :", 30, 150, 420, 1020],
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
    [t => `Le Car Jaune arrive à Saint‑Denis à ${t}.`, d => `Le trajet a duré ${d}.`, "Départ :", 30, 150, 420, 1020],
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
      texte: `${enonce} ${avant} ${cases ? `${CASE}${NB}h${NB}${CASE}${cases[1] ? `${NB}min` : ""}` : `${CASE}${NB}${apres}`}`,
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
  const ORDRE_UNITES_2 = {longueur: ["mm", "cm", "dm", "m", "km"], masse: ["mg", "g", "kg", "t"], contenance: ["mL", "cL", "dL", "L"],
    // (Lot B3-1 : « Mes repères d'aire » au même modèle, les unités du CM2.)
    aire: ["cm²", "dm²", "m²"]};
  // Le nom court d'un repère, sous son dessin, au téléphone (relier, l'objet
  // à trouver) : deux lignes au plus.
  const COURTS_2 = {l1: "La plus petite graduation", l2: "Une pièce de 1 centime", l5: "Un tour de piste", l6: "Le viaduc du Littoral",
    l7: "St‑Pierre à St‑Denis", l8: "Le Piton des Neiges", l9: "La Diagonale des Fous", l10: "Mon petit doigt",
    l11: "Un très grand pas", m5: "Un pack d'eau", m8: "1 L d'eau", m9: "Une ramette", c1: "Une cuillère à café", c4: "Un chauffe-eau solaire",
    // Lot R1-refonte
    l13: "La poignée de la porte", l14: "10 terrains de foot", l15: "Ma main", m6: "Une petite voiture",
    // Lot B3-1
    a1: "Un carreau de 1 cm", a6: "L'ongle du pouce", a7: "La paume de ma main", a3: "Une affiche A0", a4: "Un terrain de foot"};
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
    contenance: ["Lequel contient le plus ?", "Lequel contient le moins ?"],
    // (Lot B3-1)
    aire: ["Lequel a la plus grande aire ?", "Lequel a la plus petite aire ?"]};
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
  // (Lot B3-1, R8 : `ranger`, « Range ces aires » en 7e de Je valide et
  // trois fois dans À toi.)
  function etapeReperes2(code, {ranger = false} = {}) {
    // `reperes` : relier et comparer en ont plusieurs ; ils ne comptent pas
    // comme « le repère demandé » (`seul`).
    const reps = x => x.reperes || [x.repere];
    const seul = x => !x.reperes;
    return {
      exclureExemples: false,
      formes(usage) {
        if (usage === "valide") return Object.assign({2: "quoi", 4: "comparer", 5: "saisie", 7: "quoi", 9: "associer"}, ranger ? {6: "ranger"} : {});
        // (Comparer n'est jamais juste avant relier : avec 5 repères de
        // contenance, il ne resterait plus trois repères à relier.)
        if (usage === "entraine") return Object.assign({2: "quoi", 4: "comparer", 7: "associer", 11: "comparer", 13: "quoi", 15: "associer", 18: "comparer", 20: "quoi", 22: "associer", 24: "comparer"},
          ranger ? {9: "ranger", 16: "ranger", 23: "ranger"} : {});
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
        if (forme === "ranger") return questionRangerR8(degre, rng);
        let choisis = tous;
        if (usage === "valide") {
          const deja = new Set(serie.filter(seul).map(x => x.repere));
          const manquent = nouveaux.filter(c => !deja.has(c));
          // (Les places libres : celles d'un repère seul, de celle-ci à la
          // dernière — 10, moins relier, comparer et ranger.)
          const autres = Object.entries(Object.assign({4: "comparer", 9: "associer"}, ranger ? {6: "ranger"} : {})).map(([p]) => Number(p));
          const restent = Array.from({length: 10}, (_, p) => p).filter(p => p >= i && !autres.includes(p)).length;
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

  // ===================================================== palier 3 (lot B3-1)
  // Les repères du CM2 (carte v4, « Mes repères » du palier 3) :
  // R7 « J'estime avec un repère », R8 « Mes repères d'aire », R9
  // « Qu'est-ce qu'on mesure ? ». Choix de Gwenaël du 21/11 (lot B3-1a, les
  // trois recommandés) : le repère reporté le long de l'objet ; « … est
  // proche de… » pour un calcul, les arrondis pour outil ; périmètre ou
  // aire, deux dessins. Le volume n'entre pas au CM2 (le cm³ est en 6e).
  // Les unités restent écrites dans les calculs (S023 p. 5-6).

  // --------------------------------------------- R7 · J'estime avec un repère
  // Le repère reporté (S023 p. 3 : « un stylo mesure environ 15 cm, je peux
  // estimer la longueur de la trousse » ; Ontario : « un étage ≈ 3 m ») :
  // l'objet, le repère dessiné n fois le long de l'objet, trois mesures au
  // choix (l'ordre de grandeur : × 10, ÷ 10). [la phrase, le nom sous le
  // dessin, le repère, sa mesure, n, la longueur de l'objet en quarts de repère,
  // la réponse, les trois choix, la ligne de la correction, le degré].
  // (Degré 0 : l'exemple de On te montre, jamais dans une série.)
  // Les repères dessinés : la voiture (4 m), le très grand pas (1 m),
  // l'empan (15 cm), la main (10 cm), le terrain de foot (10 terrains bout
  // à bout : 1 km, donc environ 100 m chacun).
  const REPORTES = [
    ["Le bassin de la piscine de Saint‑Paul mesure environ…", "Le bassin", "l4", "4 m", 6, 25, "25 m", ["2,5 m", "25 m", "250 m"], "6 voitures : environ 24 m, donc 25 m", 0],
    ["Un bus du Car Jaune mesure environ…", "Le bus", "l4", "4 m", 3, 12, "12 m", ["1,2 m", "12 m", "120 m"], "3 voitures : environ 12 m", 1],
    ["Le tableau de la classe mesure environ…", "Le tableau", "l11", "1 m", 3, 12, "3 m", ["30 cm", "3 m", "30 m"], "3 grands pas : environ 3 m", 1],
    ["Un grand cahier mesure environ…", "Le cahier", "l15", "10 cm", 3, 12, "30 cm", ["3 cm", "30 cm", "3 m"], "3 mains : environ 30 cm", 1],
    ["La salle de classe mesure environ…", "La salle", "l11", "1 m", 8, 32, "8 m", ["80 cm", "8 m", "80 m"], "8 grands pas : environ 8 m", 2],
    ["Une table d'élève mesure environ…", "La table", "l12", "15 cm", 4, 16, "60 cm", ["6 cm", "60 cm", "6 m"], "4 empans : environ 60 cm", 2],
    ["Le portail de la cour mesure environ…", "Le portail", "l11", "1 m", 4, 16, "4 m", ["40 cm", "4 m", "40 m"], "4 grands pas : environ 4 m", 2],
    ["Le terrain de basket mesure environ…", "Le terrain", "l4", "4 m", 7, 28, "30 m", ["3 m", "30 m", "300 m"], "7 voitures : environ 28 m, donc 30 m", 3],
    ["De l'école au stade, il y a environ…", "Le chemin", "l14", "100 m", 5, 20, "500 m", ["50 m", "500 m", "5 km"], "5 terrains de foot : environ 500 m", 3],
    ["Le banc de la cour mesure environ…", "Le banc", "l12", "15 cm", 7, 27, "1 m", ["10 cm", "1 m", "10 m"], "7 empans : environ 105 cm, donc 1 m", 3],
    // (Lot B3-1c : six de plus ; au banc des répétitions, après 25 questions
    // d'À toi, Je valide en reposait 4,7 sur 10.)
    ["Une trousse mesure environ…", "La trousse", "l15", "10 cm", 2, 8, "20 cm", ["2 cm", "20 cm", "2 m"], "2 mains : environ 20 cm", 1],
    ["Un camion poubelle mesure environ…", "Le camion", "l4", "4 m", 2, 8, "8 m", ["80 cm", "8 m", "80 m"], "2 voitures : environ 8 m", 1],
    ["Le préau de l'école mesure environ…", "Le préau", "l11", "1 m", 10, 40, "10 m", ["1 m", "10 m", "100 m"], "10 grands pas : environ 10 m", 2],
    ["Le pont sur la ravine mesure environ…", "Le pont", "l4", "4 m", 5, 20, "20 m", ["2 m", "20 m", "200 m"], "5 voitures : environ 20 m", 2],
    ["La fenêtre de la classe mesure environ…", "La fenêtre", "l12", "15 cm", 8, 32, "120 cm", ["12 cm", "120 cm", "12 m"], "8 empans : environ 120 cm", 3],
    ["Le sentier jusqu'à la cascade mesure environ…", "Le sentier", "l14", "100 m", 8, 32, "800 m", ["80 m", "800 m", "8 km"], "8 terrains de foot : environ 800 m", 3]
  ];
  const NOMS_REPORTE = {l4: ["voiture", "voitures", "Une voiture : environ 4 m."], l11: ["grand pas", "grands pas", "Un très grand pas : environ 1 m."],
    l12: ["empan", "empans", "Mon empan : environ 15 cm."], l15: ["main", "mains", "Ma main : environ 10 cm."],
    l14: ["terrain de foot", "terrains de foot", "Un terrain de foot : environ 100 m."]};
  // Le repère compté, sans dessin : [la phrase, le repère (ou null quand
  // la phrase le donne), n, la réponse, les trois choix, la ligne de la
  // correction, le degré]. La phrase finit par « environ… ».
  const FOIS_R7 = [
    ["Un immeuble a 12 étages. Un étage mesure environ 3 m. L'immeuble mesure environ…", null, 12, "36 m", ["3,6 m", "36 m", "360 m"], "12 × 3 m = 36 m", 0],
    ["Une carafe se remplit avec 5 verres. La carafe contient environ…", "c5", 5, "1 L", ["10 cL", "1 L", "10 L"], "5 × 20 cL = 100 cL = 1 L", 1],
    ["Le couloir mesure 15 grands pas. Le couloir mesure environ…", "l11", 15, "15 m", ["1,5 m", "15 m", "150 m"], "15 × 1 m = 15 m", 1],
    ["Un sac de letchis pèse autant que 3 paquets de riz. Le sac pèse environ…", "m4", 3, "3 kg", ["300 g", "3 kg", "30 kg"], "3 × 1 kg = 3 kg", 1],
    ["Le cross de l'école fait 3 tours de piste. Le cross mesure environ…", "l5", 3, "1 200 m", ["120 m", "1 200 m", "12 km"], "3 × 400 m = 1 200 m", 2],
    ["Mon cartable pèse autant que 2 ramettes de papier. Mon cartable pèse environ…", "m9", 2, "5 kg", ["500 g", "5 kg", "50 kg"], "2 × 2,5 kg = 5 kg", 2],
    ["Une bouteille de jus remplit 4 verres. La bouteille contient environ…", "c5", 4, "80 cL", ["8 cL", "80 cL", "8 L"], "4 × 20 cL = 80 cL", 2],
    ["Une tour a 20 étages. Un étage mesure environ 3 m. La tour mesure environ…", null, 20, "60 m", ["6 m", "60 m", "600 m"], "20 × 3 m = 60 m", 2],
    ["La cour de récréation fait 12 voitures de long. La cour mesure environ…", "l4", 12, "50 m", ["5 m", "50 m", "500 m"], "12 × 4 m = 48 m, donc environ 50 m", 3],
    ["Une marmite de cari se remplit avec 3 bouteilles d'eau. La marmite contient environ…", "c7", 3, "5 L", ["50 cL", "5 L", "50 L"], "3 × 1,5 L = 4,5 L, donc environ 5 L", 3],
    ["Un camion porte 10 petites voitures. Le camion porte environ…", "m6", 10, "10 t", ["1 t", "10 t", "100 t"], "10 × 1 t = 10 t", 3],
    ["Un seau se remplit avec 7 bouteilles d'eau. Le seau contient environ…", "c7", 7, "10 L", ["1 L", "10 L", "100 L"], "7 × 1,5 L = 10,5 L, donc environ 10 L", 3],
    // (Lot B3-1c : six de plus.)
    ["Un régime de bananes pèse autant que 8 paquets de riz. Le régime pèse environ…", "m4", 8, "8 kg", ["800 g", "8 kg", "80 kg"], "8 × 1 kg = 8 kg", 1],
    ["Une théière se remplit avec 3 verres. La théière contient environ…", "c5", 3, "60 cL", ["6 cL", "60 cL", "6 L"], "3 × 20 cL = 60 cL", 1],
    ["Un jerrican se remplit avec 4 bouteilles d'eau. Le jerrican contient environ…", "c7", 4, "6 L", ["60 cL", "6 L", "60 L"], "4 × 1,5 L = 6 L", 2],
    ["Le terrain de pétanque mesure 12 grands pas. Le terrain mesure environ…", "l11", 12, "12 m", ["1,2 m", "12 m", "120 m"], "12 × 1 m = 12 m", 2],
    ["Au cross, je fais 6 tours de piste. Je cours environ…", "l5", 6, "2 400 m", ["240 m", "2 400 m", "24 km"], "6 × 400 m = 2 400 m", 3],
    ["Un jacquier pèse autant que 4 ramettes de papier. Le jacquier pèse environ…", "m9", 4, "10 kg", ["1 kg", "10 kg", "100 kg"], "4 × 2,5 kg = 10 kg", 3]
  ];
  // La taille d'une mesure écrite (« 1 200 m », « 80 cL ») dans la plus
  // petite unité de sa grandeur.
  function tailleTexte(t) {
    const [, n, u] = t.replace(/[\u00a0\u202f]/g, " ").match(/^([\d ,]+) (\S+)$/);
    const g = grandeurDe(u);
    return {v: convertir(milli(n.replace(/ /g, "")), u, ORDRE_UNITES_2[g][0]), g};
  }
  // Le pourquoi d'une mesure trop grande ou trop petite (« 2,5 m, c'est
  // bien trop court. »). (Lot B3-1c : sur une ligne, 31 signes au plus ;
  // « beaucoup trop court » passait sur deux lignes au petit Android avec
  // une police large, la correction de Je valide tombait à 77 %.)
  const TROP_R7 = {longueur: ["bien trop court", "bien trop long"], masse: ["bien trop léger", "bien trop lourd"], contenance: ["bien trop peu", "beaucoup trop"]};
  function pourquoiOrdre(choix, bon) {
    const p = {};
    const r = tailleTexte(choix[bon]);
    choix.forEach((c, k) => {
      if (k === bon) return;
      const x = tailleTexte(c);
      p[k] = CARTE.typo(`${c}, c'est ${TROP_R7[r.g][x.v > r.v ? 1 : 0]}.`);
    });
    return p;
  }
  function questionReporte(degre, rng, i) {
    const [phrase, nom, rep, mesure, n, quarts, reponse, trois, ligne] = REPORTES[i];
    const choix = melanger(rng, trois).map(c => CARTE.typo(c));
    const bon = choix.indexOf(CARTE.typo(reponse));
    const [un, plusieurs, note] = NOMS_REPORTE[rep];
    const texte = CARTE.typo(phrase);
    return q({
      code: "R7", degre, forme: "qcm", texte, morceaux: {phrase: texte, apres: "", sorte: "mesure"},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], unite: reponse.split(" ").pop(),
      grandeur: "longueur", resume: CARTE.typo(`${phrase.replace(/…$/, "")} ${reponse}.`),
      outil: "reporte", reporte: {repere: rep, n, quarts, nom, mesure: CARTE.typo(mesure), total: CARTE.typo(reponse), un, plusieurs},
      noteOutil: CARTE.typo(note), image: [CARTE.typo(note)], repereImage: rep,
      correction: [CARTE.typo(ligne)], ligneR7: CARTE.typo(ligne), vertR7: CARTE.typo(reponse),
      pourquoi: pourquoiOrdre(choix, bon),
      donnees: {type: "estimer", sorte: "reporte", situation: i},
      cle: `R7:r:${i}`
    });
  }
  function questionFoisR7(degre, rng, i) {
    const [phrase, rep, n, reponse, trois, ligne] = FOIS_R7[i];
    const choix = melanger(rng, trois).map(c => CARTE.typo(c));
    const bon = choix.indexOf(CARTE.typo(reponse));
    const r = rep ? CARTE.repere(rep) : null;
    const g = tailleTexte(reponse).g;
    const k = phrase.lastIndexOf(". ");
    const enonce = CARTE.typo(phrase.slice(0, k + 1));
    const fin = CARTE.typo(phrase.slice(k + 2));
    const noteOutil = CARTE.typo(rep ? `Je compte ${n} fois mon repère.` : `Je compte ${n} fois un étage.`);
    const monRepere = r ? CARTE.typo(`Mon repère : ${r.objet[0].toLowerCase()}${r.objet.slice(1)}, ${r.valeur}.`) : null;
    return q({
      code: "R7", degre, forme: "qcm", texte: CARTE.typo(phrase), morceaux: {enonce, phrase: fin, apres: "", sorte: "mesure"},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], unite: null, grandeur: g,
      // (Lot B3-1c : la dernière phrase seulement, le résumé tient sur deux lignes.)
      resume: CARTE.typo(`${phrase.slice(k + 2).replace(/…$/, "")} ${reponse}.`),
      outil: "fois-r7", repereCarte: rep, noteOutil, image: monRepere ? [monRepere] : [noteOutil],
      correction: [CARTE.typo(ligne)], ligneR7: CARTE.typo(ligne), vertR7: CARTE.typo(reponse),
      pourquoi: pourquoiOrdre(choix, bon),
      donnees: {type: "estimer", sorte: "fois", situation: i},
      cle: `R7:f:${i}`
    });
  }

  // L'estimation d'un calcul (S002 p. 10, S003 p. 10 : « 212 m + 298 m +
  // 496 m est proche de 1 000 m » ; « 1 212 L − 496 L est proche de 700 L,
  // car 1 200 L − 500 L = 700 L » ; « 52 × 37 L ≈ 2 000 L » ; « 59 437 kg ÷ 6
  // est proche de 10 000 kg, car 6 × 10 000 kg = 60 000 kg » ; « 597 kg ÷ 2
  // est proche de 300 kg »). Les trois choix : le calcul arrondi, 10 fois
  // plus, 10 fois moins. L'outil : chaque nombre et son arrondi, jamais le
  // résultat. Degré 1 : des sommes de centaines ; degré 2 : des
  // différences et des sommes de milliers ; degré 3 : des produits et des
  // partages. (Un nombre n'est jamais à mi-chemin : 250 ne s'arrondit pas.)
  const UNITES_CALCUL = ["m", "L", "kg"];
  // (Un produit : « 52 × 37 L », jamais « 52 × 37 m », qu'on lirait comme une aire.)
  const UNITES_PRODUIT = ["L", "kg"];
  // Un nombre près d'un nombre rond : r ± un écart (jamais plus du quart du pas).
  function presDe(rng, r, pas) {
    for (let essai = 0; essai < 20; essai += 1) {
      const e = entre(rng, 1, pas === 10 ? 3 : Math.floor(pas / 5));
      const x = rng() < 0.5 ? r - e : r + e;
      if (x > 0 && x % 10 !== 0) return x;
    }
    return r + 3;
  }
  const NB_TXT = x => ecrire(milli(x));
  function tirerCalcul(rng, degre) {
    const produit = degre === 3 && rng() < 0.5;
    const u = choisir(rng, produit ? UNITES_PRODUIT : UNITES_CALCUL);
    const M = x => `${NB_TXT(x)}${NB}${u}`;
    if (degre === 1) {
      const n = rng() < 0.6 ? 3 : 2;
      const ronds = Array.from({length: n}, () => 100 * entre(rng, 1, 5));
      const nombres = ronds.map(r => presDe(rng, r, 100));
      const total = ronds.reduce((a, b) => a + b, 0);
      return {op: "+", u, nombres, ronds, total, texte: nombres.map(M).join(" + "), arrondi: `${ronds.map(M).join(" + ")} = ${M(total)}`};
    }
    if (degre === 2) {
      if (rng() < 0.5) {
        const a = 100 * entre(rng, 11, 49);
        const b = 100 * entre(rng, 2, Math.min(9, a / 100 - 2));
        const A = presDe(rng, a, 100);
        const B = presDe(rng, b, 100);
        return {op: "−", u, nombres: [A, B], ronds: [a, b], total: a - b, texte: `${M(A)} − ${M(B)}`, arrondi: `${M(a)} − ${M(b)} = ${M(a - b)}`};
      }
      const ronds = [1000 * entre(rng, 1, 4), 1000 * entre(rng, 1, 4)];
      const nombres = ronds.map(r => presDe(rng, r, 1000));
      return {op: "+", u, nombres, ronds, total: ronds[0] + ronds[1], texte: nombres.map(M).join(" + "), arrondi: `${ronds.map(M).join(" + ")} = ${M(ronds[0] + ronds[1])}`};
    }
    if (produit) {
      // 52 × 37 L : deux nombres de deux chiffres, arrondis à la dizaine.
      const a = 10 * entre(rng, 2, 9);
      const b = 10 * entre(rng, 2, 9);
      const A = presDe(rng, a, 10);
      const B = presDe(rng, b, 10);
      return {op: "×", u, nombres: [A, B], ronds: [a, b], total: a * b, texte: `${NB_TXT(A)} × ${M(B)}`, arrondi: `${NB_TXT(a)} × ${M(b)} = ${M(a * b)}`, sansUnite: 0};
    }
    // 59 437 kg ÷ 6 : le partage d'un nombre près d'un multiple facile.
    const d = entre(rng, 2, 9);
    const p = choisir(rng, [100, 1000, 10000]);
    const r = d * p * entre(rng, 1, Math.max(1, Math.floor(9 / d)));
    const N = presDe(rng, r, Math.max(100, p / 2));
    return {op: "÷", u, nombres: [N, d], ronds: [r, d], total: r / d, texte: `${M(N)} ÷ ${d}`, arrondi: `${M(r)} ÷ ${d} = ${M(r / d)}`, sansUnite: 1};
  }
  function questionCalculR7(degre, rng, impose = null) {
    for (let essai = 0; essai < 30; essai += 1) {
      const c = impose || tirerCalcul(rng, degre);
      if (!c) continue;
      const {u, total} = c;
      const M = x => `${NB_TXT(x)}${NB}${u}`;
      // Les trois choix : 10 fois moins, le bon, 10 fois plus (des nombres
      // entiers).
      if (total % 10 !== 0 || total < 100) continue;
      // (Lot B3-1c : mélangés ; la bonne réponse était toujours au milieu.)
      const trois = melanger(rng, [total / 10, total, total * 10]);
      const choix = trois.map(M).map(t => CARTE.typo(t));
      const bon = trois.indexOf(total);
      // (Une réponse n'est jamais un nombre de l'énoncé, ni un arrondi de
      // l'outil : « 1 209 m − 584 m », « 584 m → 600 m », la réponse 600 m.)
      if (c.nombres.includes(total) || c.ronds.includes(total)) continue;
      const texte = CARTE.typo(`${c.texte} est proche de…`);
      const lignes = c.nombres.map((x, k) => (c.sansUnite === k && c.op !== "÷" ? [NB_TXT(x), NB_TXT(c.ronds[k])] : c.op === "÷" && k === 1 ? null : [M(x), M(c.ronds[k])])).filter(Boolean);
      const pourquoi = {};
      trois.forEach((v, k) => { if (v !== total) pourquoi[k] = v < total ? "Un zéro de moins." : "Un zéro de trop."; });
      // (« 100 000 kg » sortait de son bouton à 360 px avec une police
      // large : les réponses longues en plus petit, comme des mots.)
      const longues = choix.some(c => c.length > 8);
      return q({
        code: "R7", degre, forme: "qcm", texte, morceaux: {phrase: texte, apres: "", sorte: longues ? "mots" : "mesure"},
        choix, bon, reponse: choix[bon], reponseTexte: choix[bon], unite: u, grandeur: grandeurDe(u),
        resume: CARTE.typo(`${c.texte} ≈ ${M(total)}`),
        outil: "arrondis", arrondis: lignes.map(([a, b]) => [CARTE.typo(a), CARTE.typo(b)]),
        // (Lot B3-1c : la note sur une ligne avec une police large.)
        noteOutil: c.op === "÷" ? "Un nombre facile à partager." : "J'arrondis chaque nombre.",
        image: [CARTE.typo(`${lignes[0][0]} → ${lignes[0][1]}`)],
        correction: [CARTE.typo(c.arrondi), CARTE.typo(`${c.texte} ≈ ${M(total)}`)], ligneR7: CARTE.typo(c.arrondi), vertR7: CARTE.typo(M(total)),
        pourquoi,
        donnees: {type: "estimer-calcul", op: c.op, nombres: c.nombres, ronds: c.ronds, unite: u},
        cle: `R7:c:${c.nombres.join(c.op)}${u}`.replace(/\s/g, "")
      });
    }
    return null;
  }
  // L'exemple de On te montre (jamais dans une série).
  const EXEMPLE_CALCUL_R7 = "R7:c:212+298+496m";
  ETAPES.R7 = {
    clesExemples: ["R7:r:0", "R7:f:0", EXEMPLE_CALCUL_R7],
    // Je valide : trois repères reportés, trois comptés, quatre calculs ;
    // À toi : les trois en alternance.
    formes(usage) {
      if (usage === "valide") return {0: "reporte", 1: "calcul", 2: "fois", 3: "reporte", 4: "calcul", 5: "fois", 6: "calcul", 7: "reporte", 8: "fois", 9: "calcul"};
      if (usage === "entraine") {
        const f = {};
        const cycle = ["reporte", "calcul", "fois", "reporte", "fois", "calcul"];
        for (let i = 0; i < 25; i += 1) f[i] = cycle[i % cycle.length];
        return f;
      }
      return {};
    },
    tirer(rng, degre, i, usage, forme) {
      const f = forme || choisir(rng, ["reporte", "fois", "calcul"]);
      if (f === "calcul") return questionCalculR7(degre, rng);
      const liste = f === "reporte" ? REPORTES : FOIS_R7;
      // (Au degré 3, aussi celles du degré 2 : il n'y en a que deux ou trois.)
      const vivier = liste.map((s, k) => [s, k]).filter(([s]) => s[s.length - 1] === degre || (degre === 3 && s[s.length - 1] === 2));
      const [, k] = choisir(rng, vivier);
      return f === "reporte" ? questionReporte(degre, rng, k) : questionFoisR7(degre, rng, k);
    }
  };

  // ----------------------------------------------- R8 · Mes repères d'aire
  // Au modèle des repères du CM1 (etapeReperes2, la grandeur aire), et
  // « Range ces aires » (carte v4 : 40 cm², 12 dm², 4 m², 50 m²) : on
  // range d'abord par unité (cm² < dm² < m²), puis par nombre ; le piège,
  // le plus grand nombre n'est pas la plus grande aire. (Les conversions
  // d'aires viennent après, lots B3-2.) Des nombres qu'on écrit vraiment :
  // en cm², de 20 à 90 ; en dm², de 2 à 40 ; en m², de 2 à 90 (moins de
  // 1 dm², moins de 1 m² : jamais d'ambiguïté).
  const BORNES_R8 = {"cm²": [20, 90], "dm²": [2, 40], "m²": [2, 90]};
  function questionRangerR8(degre, rng) {
    for (let essai = 0; essai < 60; essai += 1) {
      const us = melanger(rng, ["cm²", "dm²", "m²", choisir(rng, ["cm²", "dm²", "m²"])]);
      const liste = us.map(u => {
        const [a, b] = BORNES_R8[u];
        const n = u === "cm²" ? 5 * entre(rng, a / 5, b / 5) : entre(rng, a, b);
        return [n, u];
      });
      const val = ([n, u]) => n * {"cm²": 1, "dm²": 100, "m²": 10000}[u];
      const vals = liste.map(val);
      if (new Set(vals).size !== 4) continue;
      // Le piège : un plus grand nombre devant une plus petite aire.
      const piege = liste.some((a, i) => liste.some((b, j) => a[1] !== b[1] && a[0] > b[0] && vals[i] < vals[j]));
      if (!piege) continue;
      const ordre = [0, 1, 2, 3].sort((x, y) => vals[x] - vals[y]);
      if (ordre.every((x, k) => x === k)) continue;
      const mesures = liste.map(([n, u]) => CARTE.typo(`${n} ${u}`));
      const rangees = ordre.map(k => mesures[k]);
      const consigne = "Range ces aires de la plus petite à la plus grande.";
      return q({
        code: "R8", degre, forme: "ranger", texte: `${consigne} ${mesures.join(" ; ")}`,
        morceaux: {phrase: consigne, consigne: "Touche-les dans l'ordre : 1, 2, 3, 4."},
        mesures, ordre, reponse: ordre.join(","), reponseTexte: rangees.join(" < "), unite: null,
        resume: rangees.join(" < "), outil: "reperes-unites", grandeur: "aire", unites: ["cm²", "dm²", "m²"], reperes: [],
        image: ["cm² < dm² < m²"],
        correction: [rangees.join(" < "), CARTE.typo("D'abord l'unité : cm² < dm² < m² ; puis le nombre.")], uniteCommune: null,
        donnees: {type: "ranger-aires", mesures: liste.map(([n, u]) => [String(n), u])},
        cle: `R8:ranger:${rangees.join("<").replace(/[\s\u00a0\u202f]/g, "")}`
      });
    }
    return null;
  }
  ETAPES.R8 = etapeReperes2("R8", {ranger: true});

  // -------------------------------------------- R9 · Qu'est-ce qu'on mesure ?
  // Les cinq grandeurs du CM2 (R2 + « une aire : les carreaux ») ; le
  // périmètre ou l'aire (S003 p. 15 : « l'élève sait différencier le
  // périmètre et l'aire » ; S038 : repasser le contour, colorier la
  // surface ; 36 % comptent le contour pour une aire, A5) ; le gros qui
  // n'est pas le plus lourd (S023 p. 3 : le paquet de céréales et la
  // bouteille), le haut qui ne contient pas le plus (Japon). Pas de
  // volume : il vient en 6e.
  const GRANDEURS_5 = ["une longueur", "une masse", "une contenance", "une durée", "une aire"];
  const CLES_5 = ["longueur", "masse", "contenance", "duree", "aire"];
  // (Lot B3-1c : un pourquoi tient sur une ligne, 31 signes au plus.)
  const RAISON_5 = {longueur: "Une distance : une longueur.", masse: "Je pèse : une masse.", contenance: "Je mesure ce que ça contient.",
    duree: "Je mesure un temps : une durée.", aire: "Une surface : une aire."};
  // [la situation, la grandeur, le degré]
  const SITUATIONS_R9 = [
    ["Je compte les carreaux qui couvrent la figure.", "aire", 1], ["Je recouvre la table avec des feuilles A4.", "aire", 1],
    ["Je pose la règle le long du cahier.", "longueur", 1], ["Je pèse les ananas sur la balance.", "masse", 1],
    ["Je verse le jus de goyavier dans le verre doseur.", "contenance", 1], ["Je déclenche le chronomètre au départ de la course.", "duree", 1],
    ["Je veux savoir combien de carreaux il faut pour le sol de la cuisine.", "aire", 2], ["Je veux savoir quelle surface de mur je vais peindre.", "aire", 2],
    ["Je veux savoir quelle longueur de grillage il faut autour du jardin.", "longueur", 2], ["Je veux savoir si le colis pèse plus de 2 kg.", "masse", 2],
    ["Je veux savoir combien d'eau il faut pour remplir le bassin.", "contenance", 2], ["Je veux savoir combien de temps sèche la peinture.", "duree", 2],
    ["Je veux savoir quelle surface de tôle il faut pour le toit de la case.", "aire", 3], ["Je veux savoir quelle place prend le tapis sur le sol.", "aire", 3],
    ["Je veux savoir quelle surface occupe le champ de cannes.", "aire", 3], ["Je veux savoir quelle longueur de ruban il faut autour du cadeau.", "longueur", 3],
    ["Je veux savoir combien de temps dure la descente du Piton.", "duree", 3], ["Je veux savoir combien de sirop tient dans la bouteille.", "contenance", 3],
    // (Lot B3-1c : neuf de plus ; au banc des répétitions, après 25 questions
    // d'À toi, Je valide en reposait 5 sur 10.)
    ["Je mesure ma taille sous la toise.", "longueur", 1], ["Je regarde combien de temps dure la récréation.", "duree", 1],
    ["Je veux savoir combien pèse mon cartable.", "masse", 2], ["Je veux savoir combien de jus contient la carafe.", "contenance", 2],
    ["Je veux savoir quelle distance je parcours jusqu'à l'école.", "longueur", 2], ["Je veux savoir combien de nappes il faut pour couvrir la table.", "aire", 3],
    ["Je veux savoir combien d'eau tient l'aquarium.", "contenance", 3], ["Je veux savoir combien de temps met le Car Jaune jusqu'à Saint‑Denis.", "duree", 3],
    ["Je veux savoir combien pèse le sac de letchis.", "masse", 3]
  ];
  // (Lot B3-1c : le résumé court d'une situation, pour la fin de Je valide
  // et le bilan ; la phrase entière passait sur cinq lignes au petit iPhone
  // avec une police large, « Accueil » sortait du cadre — vu par le robot.)
  const COURTS_R9 = ["Les carreaux de la figure", "La table en feuilles A4", "La règle le long du cahier", "Les ananas sur la balance", "Le jus dans le verre doseur", "Le chronomètre de la course", "Les carreaux du sol", "Le mur à peindre", "Le grillage du jardin", "Le colis", "L'eau du bassin", "La peinture qui sèche", "La tôle du toit", "Le tapis sur le sol", "Le champ de cannes", "Le ruban du cadeau", "La descente du Piton", "Le sirop de la bouteille", "Ma taille", "La récréation", "Mon cartable", "Le jus de la carafe", "Le trajet jusqu'à l'école", "Les nappes sur la table", "L'eau de l'aquarium", "Le Car Jaune jusqu'à Saint‑Denis", "Le sac de letchis"];
  const COURTS_PA = ["La clôture du jardin", "Le carrelage de la cuisine", "Le ruban autour de la carte", "La peinture du mur", "Le tour du terrain", "La nappe sur la table", "Le gazon du jardin", "La bordure de la nappe", "Le grillage du champ", "Les tôles du toit", "Le papier cadeau", "La guirlande de la fenêtre", "La frise de la classe", "Les dalles de la cour", "Les plinthes de la chambre", "La moquette de la chambre", "Le bord du terrain", "La pelouse du terrain", "Les galets du bassin", "Le fond de la piscine", "Le cadre du tableau", "Le vernis de la table", "La haie du jardin", "Les panneaux du toit"];
  function questionGrandeur5(degre, rng) {
    const vivier = SITUATIONS_R9.map((o, i) => [o, i]).filter(([o]) => o[2] === degre);
    const [[phrase, grandeur], i] = choisir(rng, vivier);
    // Quatre réponses : la bonne, et trois autres ; l'aire ou la longueur
    // toujours là (la confusion du périmètre).
    const autres = melanger(rng, CLES_5.filter(c => c !== grandeur));
    const voisine = grandeur === "aire" ? "longueur" : "aire";
    const trois = [voisine, ...autres.filter(c => c !== voisine).slice(0, 2)];
    const cles = CLES_5.filter(c => c === grandeur || trois.includes(c));
    const choix = cles.map(c => GRANDEURS_5[CLES_5.indexOf(c)]);
    const bon = cles.indexOf(grandeur);
    const texte = CARTE.typo(phrase);
    const pourquoi = {};
    choix.forEach((c, k) => { if (k !== bon) pourquoi[k] = CARTE.typo(RAISON_5[grandeur]); });
    return q({
      code: "R9", degre, forme: "qcm", texte: CARTE.typo(`${phrase} Qu'est-ce que je mesure ?`),
      morceaux: {phrase: texte, sorte: "grandeur", consigne: CARTE.typo("Qu'est-ce que je mesure ?")},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], pourquoi,
      unite: null, resume: CARTE.typo(`${COURTS_R9[i]} : ${choix[bon]}.`), outil: "grandeurs", avecAire: true, grandeur,
      correction: [CARTE.typo(`Je mesure ${choix[bon]}.`)],
      donnees: {type: "grandeur5", situation: i, grandeur},
      cle: `R9:g:${i}`
    });
  }
  // Le périmètre ou l'aire : [la situation, "perimetre" ou "aire", le degré].
  const PERIM_AIRE = [
    ["Je pose une clôture autour du jardin.", "perimetre", 0], ["Je pose du carrelage dans la cuisine.", "aire", 0],
    ["Je colle un ruban tout autour de la carte.", "perimetre", 1], ["Je peins tout le mur.", "aire", 1],
    ["Je fais le tour du terrain en courant.", "perimetre", 1], ["Je recouvre la table d'une nappe.", "aire", 1],
    ["Je sème du gazon dans tout le jardin.", "aire", 2], ["Je couds une bordure autour de la nappe.", "perimetre", 2],
    ["J'entoure le champ de cannes d'un grillage.", "perimetre", 2], ["Je pose des tôles sur le toit de la case.", "aire", 2],
    ["J'emballe la boîte dans du papier cadeau.", "aire", 2], ["Je mets une guirlande autour de la fenêtre.", "perimetre", 2],
    ["Je colle une frise tout autour de la classe.", "perimetre", 3], ["Je compte les dalles qui couvrent la cour.", "aire", 3],
    ["Je pose des plinthes au bas des murs de la chambre.", "perimetre", 3], ["J'achète de la moquette pour la chambre.", "aire", 3],
    // (Lot B3-1c : huit de plus.)
    ["Je trace à la craie le bord du terrain.", "perimetre", 1], ["Je pose de la pelouse sur tout le terrain.", "aire", 1],
    ["Je mets des galets tout autour du bassin.", "perimetre", 2], ["Je carrelle le fond de la piscine.", "aire", 2],
    ["Je pose un cadre autour du tableau.", "perimetre", 2], ["Je vernis tout le dessus de la table.", "aire", 3],
    ["Je plante une haie le long des quatre côtés du jardin.", "perimetre", 3], ["Je couvre le toit de panneaux solaires.", "aire", 3]
  ];
  const MOTS_PA = {perimetre: "le périmètre", aire: "l'aire"};
  function questionPerimAire(degre, rng, i) {
    const [phrase, bonne] = PERIM_AIRE[i];
    const choix = ["le périmètre", "l'aire"];
    const bon = choix.indexOf(MOTS_PA[bonne]);
    const texte = CARTE.typo(phrase);
    const raison = bonne === "perimetre" ? "Je fais le tour : le périmètre." : "Je couvre la surface : l'aire.";
    // (Lot B3-1c : le pourquoi dit ce qu'est le mauvais choix ; il répétait
    // la correction mot pour mot.)
    const pourquoiPA = bonne === "perimetre" ? "L'aire, c'est ce qu'on couvre." : "Le périmètre, c'est le tour.";
    return q({
      code: "R9", degre, forme: "qcm", texte: CARTE.typo(`${phrase} Qu'est-ce que je mesure ?`),
      morceaux: {phrase: texte, sorte: "mots", consigne: CARTE.typo("Qu'est-ce que je mesure ?")},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], pourquoi: {[1 - bon]: pourquoiPA},
      unite: null, resume: CARTE.typo(`${COURTS_PA[i]} : ${choix[bon]}.`), outil: "perim-aire", perimAire: bonne,
      image: ["le périmètre : le tour", "l'aire : la surface"],
      correction: [CARTE.typo(raison)],
      donnees: {type: "perim-aire", situation: i, bonne},
      cle: `R9:pa:${i}`
    });
  }
  // Le gros qui n'est pas le plus lourd, le haut qui ne contient pas le
  // plus : [la phrase, la question, les deux objets, le bon, les deux
  // lignes de la correction, la grandeur, le degré]. (Des repères connus :
  // 1 L d'eau, 1 kg ; la pièce de 1 €, 7,5 g ; le pack d'eau, 9 kg ; le
  // verre, 20 cL ; la canette, 33 cL.)
  const PIEGES_R9 = [
    ["Un paquet de céréales est plus gros qu'une bouteille d'eau de 1,5 L.", "Lequel est le plus lourd ?", ["le paquet de céréales", "la bouteille d'eau"], 1,
      ["La bouteille d'eau : environ 1,5 kg.", "Le paquet de céréales : environ 500 g."], "masse", 0],
    ["Un sac de chips est plus gros qu'une brique de lait.", "Lequel est le plus lourd ?", ["le sac de chips", "la brique de lait"], 1,
      ["La brique de lait : environ 1 kg.", "Le sac de chips : environ 150 g."], "masse", 2],
    ["Un ballon de baudruche est plus gros qu'une pièce de 1 €.", "Lequel est le plus lourd ?", ["le ballon", "la pièce de 1 €"], 1,
      ["La pièce de 1 € : 7,5 g.", "Le ballon : environ 3 g."], "masse", 2],
    ["Un carton vide est plus gros qu'un pack de 6 bouteilles d'eau.", "Lequel est le plus lourd ?", ["le carton vide", "le pack d'eau"], 1,
      ["Le pack d'eau : environ 9 kg.", "Le carton vide : environ 500 g."], "masse", 3],
    ["Un verre est plus haut qu'une casserole.", "Lequel contient le plus ?", ["le verre", "la casserole"], 1,
      ["La casserole : environ 2 L.", "Le verre : environ 20 cL."], "contenance", 2],
    ["Une canette est plus haute qu'un grand bol.", "Lequel contient le plus ?", ["la canette", "le grand bol"], 1,
      ["Le grand bol : environ 50 cL.", "La canette : 33 cL."], "contenance", 3],
    ["Une bouteille de sirop est plus haute qu'une bassine.", "Laquelle contient le plus ?", ["la bouteille de sirop", "la bassine"], 1,
      ["La bassine : environ 10 L.", "La bouteille de sirop : environ 70 cL."], "contenance", 3],
    // (Lot B3-1c : deux de plus.)
    ["Un sac de pop-corn est plus gros qu'un paquet de sucre.", "Lequel est le plus lourd ?", ["le sac de pop-corn", "le paquet de sucre"], 1,
      ["Le paquet de sucre : 1 kg.", "Le sac de pop-corn : environ 100 g."], "masse", 2],
    ["Un vase est plus haut qu'un saladier.", "Lequel contient le plus ?", ["le vase", "le saladier"], 1,
      ["Le saladier : environ 3 L.", "Le vase : environ 1 L."], "contenance", 2]
  ];
  const PIEGE_RAISON = {masse: "Plus gros ne veut pas dire plus lourd.", contenance: "Plus haut ne veut pas dire contenir plus."};
  // (Lot B3-1c : le pourquoi sur une ligne ; la règle reste dans l'outil.)
  const PIEGE_POURQUOI = {masse: "Plus gros, mais plus léger.", contenance: "Plus haut, mais plus étroit."};
  function questionPiegeR9(degre, rng, i) {
    const [phrase, question, objets, b, lignesC, g] = PIEGES_R9[i];
    const ordre = melanger(rng, [0, 1]);
    const choix = ordre.map(k => CARTE.typo(objets[k]));
    const bon = ordre.indexOf(b);
    const enonce = CARTE.typo(phrase);
    return q({
      code: "R9", degre, forme: "qcm", texte: CARTE.typo(`${phrase} ${question}`),
      morceaux: {enonce, phrase: CARTE.typo(question), sorte: "mots"},
      choix, bon, reponse: choix[bon], reponseTexte: choix[bon], pourquoi: {[1 - bon]: PIEGE_POURQUOI[g]},
      unite: null, resume: CARTE.typo(`${question.replace(/ \?$/, "")} : ${choix[bon]}.`), outil: "reperes-unites", grandeur: g,
      unites: g === "masse" ? ["g", "kg"] : ["cL", "L"], noteOutil: PIEGE_RAISON[g],
      image: [PIEGE_RAISON[g]],
      correction: lignesC.map(t => CARTE.typo(t)),
      donnees: {type: "piege", situation: i, grandeur: g},
      cle: `R9:p:${i}`
    });
  }
  ETAPES.R9 = {
    clesExemples: ["R9:pa:0", "R9:pa:1", "R9:p:0"],
    // Je valide : quatre fois la grandeur, quatre fois périmètre ou aire,
    // deux pièges ; À toi : le même mélange.
    formes(usage) {
      if (usage === "valide") return {0: "grandeur", 1: "pa", 2: "piege", 3: "grandeur", 4: "pa", 5: "grandeur", 6: "pa", 7: "piege", 8: "grandeur", 9: "pa"};
      if (usage === "entraine") {
        const f = {};
        const cycle = ["pa", "grandeur", "pa", "grandeur", "piege"];
        for (let i = 0; i < 25; i += 1) f[i] = cycle[i % cycle.length];
        return f;
      }
      return {};
    },
    tirer(rng, degre, i, usage, forme) {
      const f = forme || (degre === 1 ? choisir(rng, ["grandeur", "pa"]) : choisir(rng, ["grandeur", "pa", "piege"]));
      if (f === "grandeur") return questionGrandeur5(degre, rng);
      const liste = f === "pa" ? PERIM_AIRE : PIEGES_R9;
      const vivier = liste.map((s, k) => [s, k]).filter(([s]) => s[s.length - 1] === degre || (f === "piege" && degre === 1 && s[s.length - 1] === 2));
      const [, k] = choisir(rng, vivier);
      return f === "pa" ? questionPerimAire(degre, rng, k) : questionPiegeR9(degre, rng, k);
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
  // (Lot B3-2c, relecture : avec des millièmes, « 30,27 » au lieu de
  // « 3,027 » n'a pas de zéro de trop, la virgule est mal placée : pour
  // C9, quand l'une des deux a une virgule, « Dix fois trop grand. ».
  // C3, C4, C5 gardent leur phrase.)
  function zeroDeTrop(question, lu, attendu) {
    if (question.code === "C9" && (lu === attendu * 10n || lu * 10n === attendu) && (decimales(lu) || decimales(attendu))) {
      return lu > attendu ? "Dix fois trop grand." : "Dix fois trop petit.";
    }
    return lu > attendu ? "Un zéro de trop." : "Un zéro de moins.";
  }
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
      return {erreur: 2, retour: zeroDeTrop(question, lu, attendu)};
    }
    return null;
  }

  // Au choix, C3 : les fausses sont les vraies erreurs des décimaux, dans
  // cet ordre ; vers la petite unité : la virgule effacée, le zéro mal
  // placé, un zéro de trop, le nombre gardé, divisé ; vers la grande : un
  // zéro de moins (« 3,5 m » pour 35 cm), multiplié, le nombre gardé.
  // Le pourquoi : une ligne (« 0,5 m, ce n'est pas 5 cm. »).
  // (Lot B3-2 : `dmax`, trois chiffres après la virgule pour C9.)
  function choixPropres(faux, rep, dmax = 2) {
    const borne = 100000n * MILLE;
    const propres = [];
    faux.forEach(y => {
      if (y !== null && y !== rep && y >= 1n && y <= borne && decimales(y) <= dmax && (dmax > 2 || y >= 10n) && !propres.includes(y)) propres.push(y);
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
    const propres = choixPropres(faux, rep, x.code === "C9" ? 3 : 2);
    if (propres.length < 2) return null;
    return enQcm(x, rep, [propres[0], choisir(rng, propres.slice(1))], y => {
      const e = erreursDec(x, y);
      if (e && (e.erreur === 1 || e.erreur === 3)) return `1${NB}${d.de} est plus ${e.erreur === 1 ? "grand" : "petit"} que 1${NB}${d.vers}.`;
      return e ? e.retour : zeroDeTrop(x, y, rep);
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

  // ---------------------------------------------- C7 · Ranger des mesures
  // Lot B2-2b-1 (carte v4 ; S002 p. 15-16 : ranger dans l'ordre croissant
  // quatre longueurs d'unités différentes, 33 m ; 56,8 cm ; 0,2 km ;
  // 2,7 dam ; trois masses, 0,33 t et 565 kg ; jusqu'à quatre contenances,
  // du mL au hL). La forme `ranger` de C2, telle quelle (quatre mesures à
  // toucher). Les séries « Classer / Trier » de l'exerciseur (TRI_DB) : les
  // longueurs, les masses, les contenances (les aires et les volumes vont à
  // leurs paliers ; « 0,5 L, 75 cL, 1 dm³, 2 000 mL » au palier des
  // volumes ; « 0,001 km » au CM2). « Coche tout ce qui est plus grand que
  // 340 cm » (forme `plusieurs`, choix de Gwenaël du 14/11). « 250 cm ou
  // 3 m ? » et la même mesure (le dossier du 15/11 : corriger « 300 cm est
  // plus long que 3 m car 300 > 3 »). L'aide : tout dans la même unité
  // (l'outil, l'échelle des unités et l'unité commune ; l'image, les
  // mesures récrites dans cette unité).
  const UNITES_C7 = {longueur: ["mm", "cm", "dm", "m", "dam", "hm", "km"], masse: ["mg", "cg", "dg", "g", "dag", "hg", "kg", "t"],
    contenance: ["mL", "cL", "dL", "L", "daL", "hL"]};
  // Comment on écrit une mesure dans chaque unité : [le plus petit nombre,
  // le plus grand, les chiffres après la virgule]. Pas de « 0,02 L » (on
  // écrit 2 cL), ni « 18,1 dm », « 60,2 dag », « 93,6 dL » (les unités
  // rares et les « déci » en nombres entiers), ni « 9 340 cm ».
  const FORMAT_C7 = {km: [0.1, 200, 2], hm: [1, 50, 1], dam: [1, 99, 1], m: [0.1, 5000, 2], dm: [1, 50, 0], cm: [1, 1000, 1], mm: [1, 2000, 0],
    t: [0.1, 50, 2], kg: [0.1, 2000, 2], hg: [1, 50, 0], dag: [1, 50, 0], g: [0.1, 5000, 2], dg: [1, 50, 0], cg: [1, 500, 0], mg: [1, 5000, 0],
    hL: [0.2, 20, 1], daL: [1, 20, 0], L: [0.1, 500, 2], dL: [1, 20, 0], cL: [1, 200, 0], mL: [1, 2000, 0]};
  const NOMS_GRANDEUR_C7 = {longueur: "longueur", masse: "masse", contenance: "contenance"};
  const BORNE_C7 = 100000n * MILLE;
  // Une mesure qu'on écrit vraiment dans l'unité u.
  function naturelleC7(m, u) {
    const [mini, maxi, dec] = FORMAT_C7[u];
    return m !== null && m > 0n && m >= BigInt(Math.round(mini * 1000)) && m <= BigInt(maxi) * MILLE && decimales(m) <= dec
      && mesureVraie(m, u, BORNE_C7);
  }
  // Un nombre réel arrondi à 2 chiffres (parfois 3), en millièmes.
  function arrondiC7(rng, y, u) {
    if (!(y > 0) || !Number.isFinite(y)) return null;
    const e = Math.floor(Math.log10(y));
    let pas = Math.pow(10, e - (rng() < 0.25 ? 2 : 1));
    const fin = Math.pow(10, -FORMAT_C7[u][2]);
    if (pas < fin) pas = fin;
    const x = Math.round(y / pas) * pas;
    const m = BigInt(Math.round(x * 1000));
    return naturelleC7(m, u) ? m : null;
  }
  // L'échelle de l'outil : les unités de la plus grande à la plus petite
  // présente, celles d'entre elles comprises (la tonne : deux colonnes sans
  // nom avant le kilogramme, comme au glisse-unité).
  const ECHELLE_C7 = {longueur: COLONNES.longueur, masse: ["t", "", "", "kg", "hg", "dag", "g", "dg", "cg", "mg"], contenance: COLONNES.contenance};
  function echelleC7(grandeur, unites) {
    const tout = ECHELLE_C7[grandeur];
    const idx = unites.map(u => tout.indexOf(u));
    return tout.slice(Math.min(...idx), Math.max(...idx) + 1);
  }
  // La valeur d'une mesure dans la plus petite unité de sa grandeur.
  function baseC7(m, u) {
    return convertir(m, u, UNITES_C7[grandeurDe(u)][0]);
  }
  // L'unité commune : une unité présente où toutes les mesures s'écrivent
  // au centième (« 0,2 km = 20 000 cm » ; pas « 56,8 cm = 0,568 m ») ; de
  // préférence une unité courante (pas le dam, le hg…), des nombres pas
  // trop grands (« 1 000 m », pas « 100 000 cm »), puis des nombres entiers
  // (« 340 g », pas « 34 dag »).
  function uniteCommuneC7(liste) {
    const presentes = [...new Set(liste.map(([, u]) => u))].sort((a, b) => exposant(a) - exposant(b));
    const bonnes = presentes.filter(c => liste.every(([m, u]) => {
      const y = convertir(m, u, c);
      return y !== null && y > 0n && y <= BORNE_C7 && decimales(y) <= 2;
    }));
    const plusGrand = c => liste.reduce((x, [m, u]) => { const y = convertir(m, u, c); return y > x ? y : x; }, 0n);
    const cout = c => [RARES.includes(c) ? 1 : 0, plusGrand(c) > 10000n * MILLE ? 1 : 0,
      liste.some(([m, u]) => convertir(m, u, c) % MILLE !== 0n) ? 1 : 0, Number(plusGrand(c))];
    const avant = (x, y) => { for (let k = 0; k < 4; k += 1) if (x[k] !== y[k]) return x[k] < y[k]; return false; };
    return bonnes.reduce((a, c) => (a === null || avant(cout(c), cout(a)) ? c : a), null);
  }
  // L'ordre des seuls nombres (l'erreur : « 300 cm est plus long que 3 m
  // car 300 > 3 »), ou null si deux nombres sont égaux.
  function ordreNombresC7(liste) {
    const n = liste.map(([m]) => m);
    if (new Set(n.map(String)).size !== n.length) return null;
    return n.map((_, k) => k).sort((a, b) => (n[a] < n[b] ? -1 : 1));
  }

  // Les listes d'unités (quatre places) : d1 deux unités ; d2 trois ; d3
  // quatre (S002), ou trois très étalées. [unités, étalement (log10)].
  const LISTES_C7 = {
    1: [["m", "m", "cm", "cm"], ["km", "km", "m", "m"], ["cm", "cm", "mm", "mm"], ["m", "m", "dm", "dm"], ["kg", "kg", "g", "g"],
      ["g", "g", "mg", "mg"], ["t", "t", "kg", "kg"], ["L", "L", "cL", "cL"], ["L", "L", "mL", "mL"], ["cL", "cL", "mL", "mL"]],
    2: [["m", "dm", "cm", "cm"], ["km", "hm", "m", "m"], ["m", "cm", "mm", "mm"], ["dam", "m", "m", "dm"], ["kg", "hg", "g", "g"],
      ["g", "cg", "mg", "mg"], ["t", "kg", "kg", "t"], ["kg", "dag", "g", "g"], ["L", "dL", "cL", "cL"], ["L", "cL", "mL", "mL"],
      ["hL", "L", "L", "hL"], ["dL", "cL", "mL", "mL"]],
    3: [["km", "dam", "m", "cm"], ["km", "dam", "m", "cm"], ["km", "hm", "dam", "m"], ["m", "dm", "cm", "mm"], ["hm", "m", "dm", "cm"],
      ["kg", "hg", "dag", "g"], ["g", "dg", "cg", "mg"], ["t", "kg", "kg", "g"], ["hL", "L", "dL", "cL"], ["L", "dL", "cL", "mL"],
      ["hL", "L", "cL", "mL"]]
  };
  const ETALE_C7 = {1: [0.45, 10], 2: [0.75, 40], 3: [1.3, 1000]};
  // Les séries « Classer / Trier » de l'exerciseur (TRI_DB), au palier 2 :
  // d1 le même nombre, quatre unités ; d2 et d3 les mélanges (sans ceux
  // dont les mesures ne s'écrivent dans aucune unité commune au CM1 :
  // « 12 mm, 15 cm, 1,2 m, 10 km » ; « 3 000 mg, 2 500 g, 4 kg, 0,5 t »).
  const TRI_C7 = {
    1: [[["5", "mm"], ["5", "cm"], ["5", "m"], ["5", "km"]], [["2", "mg"], ["2", "g"], ["2", "kg"], ["2", "t"]],
      [["10", "mL"], ["10", "cL"], ["10", "L"], ["10", "hL"]], [["15", "g"], ["15", "dag"], ["15", "kg"], ["15", "t"]],
      [["8", "cL"], ["8", "dL"], ["8", "L"], ["8", "daL"]]],
    2: [[["500", "g"], ["2", "kg"], ["15", "kg"], ["1,5", "t"]], [["33", "cL"], ["1,5", "L"], ["10", "L"], ["150", "L"]],
      [["2", "mm"], ["5", "cm"], ["80", "cm"], ["2", "m"]], [["20", "g"], ["250", "g"], ["4", "kg"], ["1,2", "t"]]],
    3: [[["1", "cL"], ["100", "mL"], ["1", "L"], ["1000", "L"]], [["2000", "g"], ["2,5", "kg"], ["0,01", "t"], ["15", "kg"]]]
  };
  // Le même nombre, quatre unités du CM1 (le niveau 1 de l'exerciseur).
  const NOMBRES_MEME_C7 = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25, 50];

  function tirerListeC7(rng, degre) {
    const unites = choisir(rng, LISTES_C7[degre]);
    const [s, rapport] = ETALE_C7[degre];
    for (let essai = 0; essai < 60; essai += 1) {
      // Une première mesure (dans une unité du milieu, le plus souvent),
      // puis les autres autour d'elle.
      const r0 = rng() < 0.7 ? 1 + Math.floor(rng() * 2) : (rng() < 0.5 ? 0 : 3);
      const base0 = unites[r0];
      const [mini, maxi] = FORMAT_C7[base0];
      const ref = arrondiC7(rng, mini * Math.pow(maxi / mini, 0.15 + 0.6 * rng()), base0);
      if (!ref) continue;
      const vRef = Number(baseC7(ref, base0)) / 1000;
      const liste = [[ref, base0]];
      let bien = true;
      for (let k = 0; k < 4 && bien; k += 1) {
        if (k === r0) continue;
        const u = unites[k];
        let m = null;
        for (let t = 0; t < 12 && !m; t += 1) {
          const v = vRef * Math.pow(10, (2 * rng() - 1) * s);
          m = arrondiC7(rng, v / (Number(baseC7(MILLE, u)) / 1000), u);
        }
        if (!m) bien = false;
        else liste.push([m, u]);
      }
      if (!bien) continue;
      const vals = liste.map(([m, u]) => baseC7(m, u));
      const tries = vals.slice().sort((a, b) => (a < b ? -1 : 1));
      if (tries.some((v, k) => k && v * 100n < tries[k - 1] * 110n)) continue;
      if (tries[3] > tries[0] * BigInt(rapport)) continue;
      // Le piège : deux mesures d'unités différentes, le plus grand nombre
      // est la plus petite mesure.
      const piege = liste.some(([a, u], i) => liste.some(([b, w], j) => u !== w && a > b && vals[i] < vals[j]));
      if (!piege) continue;
      return {liste, sorte: "melange"};
    }
    return null;
  }

  // Des situations (une question à ranger sur quatre dans À toi, la 7e de
  // Je valide) : [la consigne, les unités, le plus petit et le plus grand,
  // dans la première unité]. Des mesures vraisemblables ; La Réunion à côté
  // de tous les jours.
  const SITUATIONS_C7 = [
    ["Range ces sauts en longueur du plus court au plus long.", ["m", "cm", "dm"], 1.5, 4.5],
    ["Range ces cannes à sucre de la plus courte à la plus longue.", ["m", "cm", "dm"], 1.2, 3],
    ["Range ces planches de la plus courte à la plus longue.", ["m", "cm", "mm"], 0.5, 2],
    ["Range ces sentiers de La Réunion du plus court au plus long.", ["km", "m"], 1.5, 12],
    ["Range ces sacs de letchis du plus léger au plus lourd.", ["kg", "g"], 0.5, 4],
    ["Range ces colis du plus léger au plus lourd.", ["kg", "g"], 0.6, 4.5],
    ["Range ces bouteilles de la plus petite à la plus grande.", ["L", "cL", "mL"], 0.25, 2],
    ["Range ces arrosoirs du plus petit au plus grand.", ["L", "dL", "cL"], 0.8, 2]
  ];
  function tirerSituationC7(rng) {
    const [consigne, us, mini, maxi] = choisir(rng, SITUATIONS_C7);
    for (let essai = 0; essai < 60; essai += 1) {
      const liste = [];
      for (let k = 0; k < 4; k += 1) {
        const u = k < 2 ? us[k] : choisir(rng, us);
        const v = mini * Math.pow(maxi / mini, rng());
        const m = arrondiC7(rng, v * (Number(convertir(MILLE, us[0], u)) / 1000), u);
        if (!m) break;
        liste.push([m, u]);
      }
      if (liste.length !== 4) continue;
      const vals = liste.map(([m, u]) => baseC7(m, u));
      const tries = vals.slice().sort((a, b) => (a < b ? -1 : 1));
      if (tries.some((v, k) => k && v * 100n < tries[k - 1] * 108n)) continue;
      const piege = liste.some(([a, u], i) => liste.some(([b, w], j) => u !== w && a > b && vals[i] < vals[j]));
      if (!piege) continue;
      return {liste, sorte: "situation", consigne};
    }
    return null;
  }

  function questionRangerC7(code, degre, rng, situation = false) {
    for (let essai = 0; essai < 40; essai += 1) {
      let tirage = null;
      const r = rng();
      if (situation) tirage = tirerSituationC7(rng);
      else if (degre === 1 && r < 0.35) {
        if (rng() < 0.4) tirage = {liste: choisir(rng, TRI_C7[1]).map(([n, u]) => [milli(n), u]), sorte: "meme", tri: true};
        else {
          const gr = choisir(rng, ["longueur", "masse", "contenance"]);
          const us = melanger(rng, UNITES_C7[gr].filter(u => u !== "daL")).slice(0, 4);
          const n = milli(choisir(rng, NOMBRES_MEME_C7));
          tirage = {liste: us.map(u => [n, u]), sorte: "meme"};
          if (!tirage.liste.every(([m, u]) => mesureVraie(m, u, BORNE_C7))) continue;
        }
      } else if (degre >= 2 && r < (degre === 2 ? 0.3 : 0.2)) {
        tirage = {liste: choisir(rng, TRI_C7[degre]).map(([n, u]) => [milli(n), u]), sorte: "tri", tri: true};
      } else tirage = tirerListeC7(rng, degre);
      if (!tirage) continue;
      const {liste, sorte} = tirage;
      const grandeur = grandeurDe(liste[0][1]);
      const vals = liste.map(([m, u]) => baseC7(m, u));
      if (new Set(vals.map(String)).size !== 4) continue;
      const meme = sorte === "meme";
      const commune = meme ? null : uniteCommuneC7(liste);
      if (!meme && !commune) continue;
      const affiche = melanger(rng, [0, 1, 2, 3]);
      const lst = affiche.map(k => liste[k]);
      const vs = affiche.map(k => vals[k]);
      const ordre = [0, 1, 2, 3].sort((x, y) => (vs[x] < vs[y] ? -1 : 1));
      if (ordre.every((x, k) => x === k)) continue;
      const mesures = lst.map(([m, u]) => mes(m, u));
      const rangees = ordre.map(k => mesures[k]);
      const unites = [...new Set(lst.map(([, u]) => u))];
      // (Le même nombre : les relations des unités voisines posées.)
      const croissantes = unites.slice().sort((a, b) => exposant(a) - exposant(b));
      const relationsMeme = croissantes.slice(1).map((u, k) => relationTexte(u, croissantes[k]));
      // L'image : les mesures écrites dans l'unité commune (celles qui n'y
      // sont pas), dans l'ordre où elles sont posées ; le même nombre :
      // l'échelle des unités.
      const ecritures = meme ? [] : lst.filter(([, u]) => u !== commune).map(([m, u]) => `${mes(m, u)} = ${mes(convertir(m, u, commune), commune)}`);
      const note = meme ? "Le nombre est le même : je regarde l'unité." : `J'écris toutes les mesures en ${commune}.`;
      const consigne = tirage.consigne || "Range ces mesures de la plus petite à la plus grande.";
      const cleListe = rangees.join("<").replace(/[\s  ]/g, "");
      return q({
        code, degre, forme: "ranger", texte: `${consigne} ${mesures.join(" ; ")}`,
        morceaux: {phrase: consigne, consigne: "Touche-les dans l'ordre : 1, 2, 3, 4."},
        mesures, ordre, reponse: ordre.join(","), reponseTexte: rangees.join(" < "), unite: commune || lst[ordre[0]][1],
        resume: rangees.join(" < "), relation: note, outil: "ranger", grandeur,
        echelleOutil: {grandeur, unites: echelleC7(grandeur, unites), marque: unites, note},
        image: meme ? relationsMeme : ecritures,
        correction: [rangees.join(" < ")].concat(ecritures.slice(0, 2)),
        // (Le pourquoi : les nombres rangés sans l'unité, ou à l'envers.)
        ordreNombres: meme ? null : ordreNombresC7(lst), uniteCommune: commune,
        relationCle: `ranger:${unites.slice().sort().join("-")}`, sorteC7: meme ? "meme" : tirage.tri ? "tri" : situation ? "situation" : "ranger",
        donnees: {type: "ranger", mesures: lst.map(([m, u]) => [brut(m), u])},
        cle: `${code}:ranger:${cleListe}`
      });
    }
    return null;
  }

  // « 250 cm ou 3 m : quelle mesure est la plus grande ? », ou la même
  // mesure (« 300 cm ou 3 m » : même longueur). La grande unité porte le
  // plus petit nombre (le piège). Trois réponses : les deux mesures, « Même
  // longueur » (« masse », « contenance »).
  const PAIRES_CMP_C7 = [["m", "cm"], ["m", "cm"], ["km", "m"], ["m", "dm"], ["cm", "mm"], ["dam", "m"], ["kg", "g"], ["kg", "g"], ["t", "kg"],
    ["g", "mg"], ["L", "cL"], ["L", "cL"], ["L", "mL"], ["hL", "L"], ["dL", "cL"]];
  function questionComparerC7(code, degre, rng) {
    for (let essai = 0; essai < 60; essai += 1) {
      const [G, p] = choisir(rng, PAIRES_CMP_C7);
      const f = facteur(G, p);
      const A = arrondiC7(rng, Math.pow(10, -0.6 + 1.6 * rng()), G);
      // (Pas « 1 dL » : l'image, « 1 dL = 10 cL », serait la réponse.)
      if (!A || A === MILLE) continue;
      const Af = A * f;
      if (!naturelleC7(Af, p)) continue;
      const egal = rng() < (degre === 1 ? 0.25 : 0.35);
      let B = Af;
      if (!egal) {
        const k = rng() < 0.5 ? 0.6 + 0.3 * rng() : 1.12 + 0.4 * rng();
        B = arrondiC7(rng, (Number(Af) / 1000) * k, p);
        if (!B || B === Af) continue;
        const ecart = Number(B > Af ? B - Af : Af - B) / Number(B > Af ? Af : B);
        if (ecart < 0.08) continue;
      }
      // (Le piège : le plus grand nombre est dans la petite unité.)
      if (B <= A) continue;
      const deux = melanger(rng, [[A, G], [B, p]]);
      const mesures = deux.map(([v, u]) => mes(v, u));
      const grandeur = grandeurDe(G);
      const memeT = `Même ${NOMS_GRANDEUR_C7[grandeur]}`;
      const choix = mesures.concat([memeT]);
      const grand = egal ? memeT : Af > B ? mes(A, G) : mes(B, p);
      const bon = choix.indexOf(grand);
      const phrase = `Quelle mesure est la plus grande${NB}: ${mesures[0]} ou ${mesures[1]}${NB}?`;
      const pourquoi = {};
      choix.forEach((c, k) => { if (k !== bon) pourquoi[k] = `${mes(A, G)}, c'est ${mes(Af, p)}.`; });
      const signe = egal ? "=" : Af > B ? ">" : "<";
      const resume = egal ? `${mes(A, G)} = ${mes(B, p)}` : Af > B ? `${mes(B, p)} < ${mes(A, G)}` : `${mes(A, G)} < ${mes(B, p)}`;
      const note = `J'écris les deux mesures en ${p}.`;
      return q({
        code, degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "comparer-c7"},
        choix, bon, pourquoi, reponse: String(bon), reponseTexte: grand, unite: null,
        resume, correction: [`${mes(A, G)} = ${mes(Af, p)}`, egal ? `${memeT}.` : `${mes(Af, p)} ${signe} ${mes(B, p)}`],
        relation: note, outil: "ranger", echelleOutil: {grandeur, unites: echelleC7(grandeur, [G, p]), marque: [G, p], note},
        image: [relationTexte(G, p), "Puis je compare les nombres."],
        grandeur, relationCle: `${G}-${p}:cmp`, sorteC7: egal ? "egal" : "comparer",
        donnees: {type: "comparer-c7", a: brut(A), ua: G, b: brut(B), ub: p},
        cle: `${code}:cmp:${brut(A)}${G}:${brut(B)}${p}`
      });
    }
    return null;
  }

  // « Coche tout ce qui est plus grand que 340 cm. » (ou « plus petit
  // que ») : quatre cartes, deux ou trois justes, chacune dans une autre
  // unité ; une carte au moins a le plus grand nombre sans être la plus
  // grande mesure. Le pourquoi d'une carte fausse cochée : la carte dite
  // dans l'unité de la cible (« 3,2 m, c'est 320 cm. »).
  const CIBLES_C7 = [["cm", ["m", "mm", "dm"]], ["cm", ["m", "mm", "dm"]], ["m", ["km", "cm", "dam"]], ["mm", ["cm", "m"]],
    ["g", ["kg", "mg", "dag"]], ["kg", ["g", "t"]], ["cL", ["L", "mL", "dL"]], ["mL", ["L", "cL"]], ["L", ["cL", "mL", "hL"]]];
  function questionPlusQueC7(code, degre, rng) {
    for (let essai = 0; essai < 80; essai += 1) {
      const [u, autres] = choisir(rng, CIBLES_C7);
      const y0 = Math.pow(10, 0.3 + 2.2 * rng());
      const e0 = Math.pow(10, Math.floor(Math.log10(y0)) - 1);
      const X = arrondiC7(() => 0.9, Math.round(y0 / e0) * e0, u);
      if (!X || X < 2n * MILLE) continue;
      const plus = rng() < 0.6;
      const k = rng() < 0.5 ? 2 : 3;
      const justes = [];
      const fausses = [];
      for (let t = 0; t < 40 && (justes.length < k || fausses.length < 4 - k); t += 1) {
        const haut = justes.length < k && (fausses.length >= 4 - k || rng() < 0.5) ? plus : !plus;
        const w = choisir(rng, autres);
        const r = haut ? 1.1 + 0.6 * rng() : 0.5 + 0.38 * rng();
        const m = arrondiC7(rng, (Number(X) / 1000) * r / (Number(convertir(MILLE, w, u)) / 1000), w);
        if (!m) continue;
        const y = convertir(m, w, u);
        if (y === null || decimales(y) > 2 || y > BORNE_C7 || y === X) continue;
        const ecart = Number(y > X ? y - X : X - y) / Number(X);
        if (ecart < 0.08) continue;
        const carte = [m, w, y];
        if ([...justes, ...fausses].some(([, , z]) => z === y || Number(z > y ? z - y : y - z) / Number(y) < 0.05)) continue;
        const juste = plus ? y > X : y < X;
        if (juste && justes.length < k) justes.push(carte);
        else if (!juste && fausses.length < 4 - k) fausses.push(carte);
      }
      if (justes.length !== k || fausses.length !== 4 - k) continue;
      const cartes = melanger(rng, justes.concat(fausses));
      // (Deux unités au moins parmi les cartes.)
      if (new Set(cartes.map(([, w]) => w)).size < 2) continue;
      // Le piège : une carte dont le nombre trompe (plus grand nombre, plus
      // petite mesure, ou l'inverse).
      const trompe = cartes.some(([m, , y]) => (m > X) !== (y > X));
      if (!trompe) continue;
      const textes = cartes.map(([m, w]) => mes(m, w));
      if (new Set(textes).size !== 4) continue;
      const bons = cartes.map((c, i) => (justes.includes(c) ? i : -1)).filter(i => i >= 0);
      const pourquoi = {};
      cartes.forEach(([, , y], i) => { if (!bons.includes(i)) pourquoi[i] = `${textes[i]}, c'est ${mes(y, u)}.`; });
      const cibleT = mes(X, u);
      const mot = plus ? "plus grand" : "plus petit";
      const phrase = `Coche tout ce qui est ${mot} que ${cibleT}.`;
      const resume = `${plus ? "Plus grand" : "Plus petit"} que ${cibleT}${NB}: ${bons.map(i => textes[i]).join(" ; ")}`;
      const grandeur = grandeurDe(u);
      const us = [...new Set(cartes.map(([, w]) => w))];
      const relations = us.map(w => (exposant(w) > exposant(u) ? relationTexte(w, u) : relationTexte(u, w))).slice(0, 2);
      const note = `J'écris tout en ${u}.`;
      return q({
        code, degre, forme: "plusieurs", texte: `${phrase} ${textes.join(" ; ")}`,
        morceaux: {phrase, consigne: "Il y en a plusieurs. Puis Valider."},
        cartes: textes, bons, reponse: bons.join(","), reponseTexte: bons.map(i => textes[i]).join(" ; "), unite: u,
        // (La correction, sous les cartes : chacune écrite dans l'unité de
        // la cible, dans le même ordre ; le bilan garde le résumé.)
        resume, correction: [`En ${u} : ${cartes.map(([, , y]) => ecrire(y)).join(" ; ")}`], pourquoi,
        relation: note, outil: "ranger", echelleOutil: {grandeur, unites: echelleC7(grandeur, [u, ...us]), marque: [u, ...us], note},
        image: relations.concat([`Puis j'écris tout en ${u}.`]),
        grandeur, relationCle: `${u}:plus`, sorteC7: "plusieurs",
        donnees: {type: "plus-que", sens: plus ? ">" : "<", cible: [brut(X), u], cartes: cartes.map(([m, w]) => [[brut(m), w]])},
        cle: `${code}:p:${plus ? ">" : "<"}${cleTexte(cibleT)}:${textes.map(cleTexte).sort().join("|")}`
      });
    }
    return null;
  }

  // Je valide : « … ou … ? » en 3e et en 6e, une situation en 7e, « Coche »
  // en dernier (jamais retirée du mêlé), ranger ailleurs ; À toi : « … ou
  // … ? » aux places 4, 11 et 18, « Coche » aux places 13 et 23, une
  // situation une fois sur quatre ailleurs ; un retour : ranger, puis
  // « … ou … ? ».
  function formesC7(usage, rng) {
    if (usage === "valide") return {2: "comparer", 5: "comparer", 6: "situation", 9: "plusieurs"};
    if (usage === "entraine") {
      const f = {3: "comparer", 10: "comparer", 12: "plusieurs", 17: "comparer", 22: "plusieurs"};
      for (let i = 0; i < 25; i += 1) if (!f[i] && rng() < 0.25) f[i] = "situation";
      return f;
    }
    if (usage === "retour") return {1: "comparer"};
    return {};
  }
  ETAPES.C7 = {
    clesExemples: ["C7:ranger:56,8cm<2,7dam<33m<0,2km", "C7:cmp:3m:250cm", "C7:ranger:75cL<800mL<0,9L<1L"],
    tirer(rng, degre, i, usage, forme) {
      if (forme === "comparer") return questionComparerC7("C7", degre, rng);
      if (forme === "plusieurs") return questionPlusQueC7("C7", degre, rng);
      return questionRangerC7("C7", degre, rng, forme === "situation");
    },
    formes: formesC7,
    // (Dans Je valide : une même liste d'unités une fois ; le même nombre
    // une fois ; une série de l'exerciseur une fois ; « même mesure » une
    // fois au plus.)
    accepte(serie, question, usage) {
      if (usage !== "valide") return true;
      if (serie.some(x => x.relationCle === question.relationCle)) return false;
      const n = s => serie.filter(x => x.sorteC7 === s).length;
      if (["meme", "tri", "egal"].includes(question.sorteC7) && n(question.sorteC7) >= 1) return false;
      return true;
    },
    valide: serieConvertirBonne,
    erreurs: () => null
  };

  // --------------------------------------- C8 · Calculer avec deux unités
  // Lot B2-2b-2 (carte v4 ; S002 p. 16-17 : « la somme ou la différence de
  // deux longueurs qui ne sont pas données dans la même unité, par exemple
  // 8,2 m + 0,43 dam » ; « 8,2 kg + 840 g » ; « en exprimant le résultat
  // avec une seule unité, comme 1 L − 25 cL »). Le résultat s'écrit dans
  // l'une des deux unités, la grande ou la petite ; une seule des deux
  // mesures se convertit (le glisse-unité de l'outil la porte). La
  // correction écrit l'unité à chaque pas : « 25 cL = 250 mL »,
  // « 250 mL + 330 mL = 580 mL ». Les sortes : d1, des nombres entiers et
  // le résultat dans la petite unité (« 2 m − 45 cm = … cm »), et le
  // complément (« 1 kg = 350 g + … g ») ; d2, des décimaux, les deux sens
  // (« 8,2 kg + 840 g = … kg ») ; d3, les unités du CM1 et les zéros
  // (« 3 kg − 450 g = … kg », « 8,2 m + 0,43 dam = … m ») ; des situations
  // (le marché de Saint-Pierre, le cari, le rougail, le Grand Raid, la
  // Diagonale des Fous, le marathon de 42 km 195 m).
  // Comment on écrit une mesure dans un calcul : FORMAT_C7 (lot B2-2b-1),
  // un peu plus large pour un total (« 8 400 m », « 1 580 mL »).
  const FORMAT_C8 = Object.assign({}, FORMAT_C7, {m: [0.1, 10000, 2], g: [0.1, 10000, 2], mL: [1, 5000, 0], cL: [1, 500, 0],
    cm: [1, 2000, 1], kg: [0.1, 500, 2], L: [0.1, 100, 2], km: [0.1, 200, 2]});
  function naturelleC8(m, u) {
    const [mini, maxi, dec] = FORMAT_C8[u];
    return m !== null && m > 0n && m >= BigInt(Math.round(mini * 1000)) && m <= BigInt(maxi) * MILLE && decimales(m) <= dec
      && mesureVraie(m, u, BORNE_C7);
  }
  // Un nombre réel arrondi à deux chiffres significatifs (un seul, une
  // fois sur trois), en millièmes, s'il s'écrit dans l'unité u.
  function arrondiC8(rng, y, u, entier = false) {
    if (!(y > 0) || !Number.isFinite(y)) return null;
    const e = Math.floor(Math.log10(y));
    let pas = Math.pow(10, e - (rng() < 0.33 ? 0 : 1));
    if (entier && pas < 1) pas = 1;
    const fin = Math.pow(10, -FORMAT_C8[u][2]);
    if (pas < fin) pas = fin;
    const m = BigInt(Math.round(Math.round(y / pas) * pas * 1000));
    return naturelleC8(m, u) ? m : null;
  }
  const PAIRES_C8 = {
    1: [["m", "cm"], ["m", "cm"], ["km", "m"], ["kg", "g"], ["kg", "g"], ["L", "cL"], ["L", "cL"], ["cL", "mL"], ["cm", "mm"], ["t", "kg"], ["L", "mL"]],
    2: [["m", "cm"], ["km", "m"], ["kg", "g"], ["L", "cL"], ["L", "mL"], ["cL", "mL"], ["cm", "mm"], ["t", "kg"], ["m", "dm"], ["dL", "cL"]],
    3: [["dam", "m"], ["hm", "m"], ["hg", "g"], ["dag", "g"], ["dL", "cL"], ["dL", "mL"], ["hL", "L"], ["g", "cg"], ["g", "mg"], ["cg", "mg"],
      ["km", "m"], ["kg", "g"], ["L", "cL"], ["m", "cm"]]
  };
  // Les mots de l'outil, après le glisse-unité (comme « Puis j'ajoute… »
  // de C1 et C5) : la mesure qui ne se convertit pas.
  function puisC8(op, cEst, autre) {
    if (op === "+") return `Puis j'ajoute ${autre}.`;
    return cEst === "a" ? `Puis j'enlève ${autre}.` : `Puis je l'enlève de ${autre}.`;
  }
  // Une question de calcul : [a, ua] op [b, ub], le résultat en `vers`
  // (l'une des deux unités). `texteA` : « 42 km 195 m » (le marathon).
  // `situation` : {enonce, avant} ; `complement` : « 1 kg = 350 g + … g ».
  function questionCalculC8(code, degre, {A, ua, op, B, ub, vers, sorte, situation = null, complement = false, texteA = null}) {
    const Av = convertir(A, ua, vers);
    const Bv = convertir(B, ub, vers);
    if (Av === null || Bv === null) return null;
    const rep = op === "+" ? Av + Bv : Av - Bv;
    if (rep <= 0n || !naturelleC8(rep, vers)) return null;
    // La mesure à convertir (l'autre est déjà dans l'unité du résultat).
    const cEst = ua === vers ? "b" : "a";
    const [c, uc, cv] = cEst === "a" ? [A, ua, Av] : [B, ub, Bv];
    if (uc === vers) return null;
    // (La mesure convertie s'écrit vraiment, pas « 0,1 hm » ; le résultat
    // n'est pas l'une des deux mesures, « 1,2 m − 0,6 m = 0,6 m ».)
    if (!texteA && !naturelleC8(cv, vers)) return null;
    if (rep === Av || rep === Bv) return null;
    const ta = texteA || mes(A, ua);
    const tb = mes(B, ub);
    const signe = op === "+" ? "+" : "−";
    const gauche = `${ta} ${signe} ${tb}`;
    const autre = cEst === "a" ? tb : ta;
    const [g, p] = exposant(uc) > exposant(vers) ? [uc, vers] : [vers, uc];
    const f = facteur(g, p);
    const relation = relationTexte(g, p);
    const pas = exposant(uc) > exposant(vers) ? `${ecrire(c)} × ${mes(f * MILLE, vers)}` : `${ecrire(c)} ÷ ${ecrire(f * MILLE)}${NB}${vers}`;
    const puis = puisC8(op, cEst, cEst === "a" ? tb : (texteA ? mes(Av, vers) : ta));
    const ecritA = cEst === "a" ? mes(cv, vers) : mes(Av, vers);
    const ecritB = cEst === "b" ? mes(cv, vers) : mes(Bv, vers);
    let texte;
    let morceaux;
    let resume;
    let forme = "phrase";
    if (complement) {
      // « 1 kg = 350 g + … g » : la case dans la phrase, et dessous.
      const phrase = `${ta} = ${tb} + ${CASE}${NB}${vers}`;
      texte = phrase;
      morceaux = {phrase, apres: vers};
      resume = `${ta} = ${tb} + ${mes(rep, vers)}`;
    } else if (situation) {
      forme = "nombre";
      texte = `${situation.enonce} ${situation.avant} ${CASE}${NB}${vers}`;
      morceaux = {enonce: situation.enonce, avant: situation.avant, apres: vers};
      resume = `${gauche} = ${mes(rep, vers)}`;
    } else {
      // (Une ligne longue avec la case, « 8,2 kg + 840 g = … kg » : la
      // phrase sur sa ligne, la case dessous, comme C5.)
      texte = `${gauche} = ${CASE}${NB}${vers}`;
      morceaux = {phrase: `${gauche} =`, apres: vers};
      resume = `${gauche} = ${mes(rep, vers)}`;
    }
    // (Pas « 1 kg = 1 × 1 000 g » sous « 1 kg = 1 000 g ».)
    const image = c === MILLE ? [relation, puis] : [relation, `${mes(c, uc)} = ${pas}`, puis];
    // La correction : la mesure convertie (le glisse-unité la montre), puis
    // le calcul dans une seule unité, en vert (`resumeVert`) ; le complément
    // garde sa forme (« 1 000 g = 350 g + 650 g »).
    const enUne = complement ? `${mes(Av, vers)} = ${mes(Bv, vers)} + ${mes(rep, vers)}` : `${ecritA} ${signe} ${ecritB} = ${mes(rep, vers)}`;
    const correction = [`${mes(c, uc)} = ${mes(cv, vers)}`, enUne];
    const x = q({
      code, degre, forme, texte, morceaux,
      reponse: brut(rep), reponseTexte: mes(rep, vers), unite: vers, resume, resumeVert: enUne,
      relation, outil: "glisse-unite", glisse: glisse(c, uc, vers, {cm1: true, decimaux: true}), puis,
      image, correction, grandeur: grandeurDe(vers), relationCle: `${g}-${p}`, sorteC8: sorte,
      sensC8: exposant(vers) === exposant(g) ? "grande" : "petite", opC8: op,
      donnees: {type: "calc", op, a: brut(A), ua, b: brut(B), ub, vers, sorte},
      cleBase: `${code}:${brut(A)}${ua}${op}${brut(B)}${ub}`,
      cle: `${code}:${brut(A)}${ua}${op}${brut(B)}${ub}>${vers}${complement ? ":c" : ""}`
    });
    // (L'aide n'écrit jamais la réponse : « Puis j'enlève 50 cm. » pour
    // « 1 m − 50 cm = … cm » la donnerait.)
    const r = mes(rep, vers);
    if ([relation, ...image].some(l => l.includes(r))) return null;
    return x;
  }

  // Les nombres d'une question : la grande mesure A (en g), la petite B
  // (en p), à peu près du même ordre (B entre un dixième et une fois et
  // demie A). d1 : des nombres entiers, le résultat dans la petite unité.
  function tirerCalculC8(code, degre, rng) {
    for (let essai = 0; essai < 80; essai += 1) {
      const [g, p] = choisir(rng, PAIRES_C8[degre]);
      const f = Number(facteur(g, p));
      const op = rng() < 0.5 ? "+" : "-";
      let A;
      if (degre === 1) A = milli(f <= 10 ? entre(rng, 2, 9) * (rng() < 0.5 ? 10 : 1) : entre(rng, 1, 9));
      else {
        const [mini, maxi] = FORMAT_C8[g];
        A = arrondiC8(rng, Math.max(mini, 0.5) * Math.pow(Math.min(maxi, 50) / Math.max(mini, 0.5), rng() * 0.8), g, false);
      }
      // (Au moins 1 de la grande unité : « 0,62 kg − 500 g » ne se dit pas.)
      if (!A || !naturelleC8(A, g) || A < MILLE) continue;
      const ratio = op === "-" ? 0.15 + 0.75 * rng() : 0.15 + 1.3 * rng();
      const B = arrondiC8(rng, (Number(A) / 1000) * f * ratio, p, degre === 1);
      if (!B) continue;
      if (degre === 1 && (A % MILLE || B % MILLE)) continue;
      // (Une mesure qui tombe juste dans la grande unité s'écrit dans la
      // grande : pas « 3 000 g + 2 kg », ni « 1 L + 100 cL » ; une unité
      // rare pas en dizaines : pas « 10 dag ».)
      if (B % (BigInt(f) * MILLE) === 0n) continue;
      // (Une petite mesure reste petite : pas « 850 cm », « 4 800 mL » ;
      // au plus 2 de la grande unité, 9 dm, 99 mm.)
      if (B >= BigInt(f === 10 ? (p === "dm" ? 10 : 100) : 2 * f) * MILLE) continue;
      if ((RARES.includes(g) && A % (10n * MILLE) === 0n) || (RARES.includes(p) && B % (10n * MILLE) === 0n)) continue;
      // (Le résultat : d1 dans la petite unité ; sinon l'une ou l'autre.)
      const vers = degre === 1 ? p : rng() < 0.5 ? g : p;
      // L'ordre : la grande mesure d'abord, le plus souvent ; pour une
      // somme, parfois la petite d'abord (« 450 g + 2 kg »).
      const petiteDabord = op === "+" && rng() < 0.25;
      const champs = petiteDabord ? {A: B, ua: p, op, B: A, ub: g} : {A, ua: g, op, B, ub: p};
      // (d2 : un décimal au moins ; d3 : une unité du CM1 ou un zéro.)
      if (degre === 2 && !(A % MILLE) && !(B % MILLE) && vers === p) continue;
      const x = questionCalculC8(code, degre, Object.assign(champs, {vers, sorte: `${op === "+" ? "plus" : "moins"}-${vers === g ? "grande" : "petite"}`}));
      if (!x) continue;
      // (Un résultat qui tombe juste dans la grande unité ne s'écrit pas
      // dans la petite : pas « 2 000 mg ».)
      if (vers === p && milli(x.reponse) % (BigInt(f) * MILLE) === 0n) continue;
      if (degre === 3 && !NOUVELLES_CM1.includes(g) && !NOUVELLES_CM1.includes(p) && !/,0\d/.test(x.reponse) && !/0,/.test(x.reponse)) continue;
      return x;
    }
    return null;
  }

  // Le complément (« 1 kg = 350 g + … g », « 1 L = 25 cL + … cL ») : ce
  // qu'il faut ajouter pour faire l'unité, ou 2, 5 unités.
  const COMPLEMENTS_C8 = [["kg", "g"], ["L", "cL"], ["m", "cm"], ["km", "m"], ["L", "mL"], ["t", "kg"]];
  function questionComplementC8(code, degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, COMPLEMENTS_C8);
      const f = Number(facteur(g, p));
      const n = degre === 1 ? 1 : choisir(rng, [1, 1, 2, 5]);
      const pasB = f >= 1000 ? choisir(rng, [50, 100]) : 5;
      const b = entre(rng, 1, Math.floor((n * f) / pasB) - 1) * pasB;
      if (b * 2 === n * f) continue;
      const x = questionCalculC8(code, degre, {A: milli(n), ua: g, op: "-", B: milli(b), ub: p, vers: p, sorte: "complement", complement: true});
      if (x) return x;
    }
    return null;
  }

  // Les situations : [l'énoncé (P : un prénom ; A, B : les mesures), la
  // fin (« En tout : »), l'opération, la grande unité et ses bornes et son
  // pas, la petite et ses bornes et son pas, les unités du résultat].
  // Des mesures vraisemblables ; La Réunion à côté de tous les jours.
  const SITUATIONS_C8 = [
    ["Marché de Saint‑Pierre : {A} de letchis, {B} de mangues.", "En tout,", "+", ["kg", 1, 3, 0.5], ["g", 250, 900, 50], ["kg", "g"]],
    ["Pour un cari : {A} de poulet et {B} d'oignons.", "En tout,", "+", ["kg", 1, 2.5, 0.5], ["g", 200, 600, 50], ["kg", "g"]],
    ["{P} a {A} de saucisses. Le rougail en prend {B}.", "Il reste", "-", ["kg", 1, 3, 0.5], ["g", 300, 900, 50], ["kg", "g"]],
    ["Jus de goyavier : une bouteille de {A}. On en verse {B}.", "Il reste", "-", ["L", 1, 2, 0.5], ["cL", 15, 50, 5], ["L", "cL"]],
    ["Au Grand Raid, {P} court {A}, puis encore {B}.", "En tout,", "+", ["km", 12, 60, 0.5], ["m", 300, 900, 100], ["km"]],
    ["Diagonale des Fous : étape de {A}. {P} a fait {B}.", "Il reste", "-", ["km", 3, 9, 0.5], ["m", 300, 900, 100], ["km", "m"]],
    ["Un rouleau de tissu de {A}. {P} en coupe {B}.", "Il reste", "-", ["m", 2, 5, 0.5], ["cm", 35, 95, 5], ["m", "cm"]],
    ["{P} pose bout à bout deux planches : {A} et {B}.", "En tout,", "+", ["m", 1, 2.5, 0.5], ["cm", 40, 95, 5], ["m", "cm"]],
    ["Un sac de riz de {A}. {P} en prend {B}.", "Il reste", "-", ["kg", 2, 5, 0.5], ["g", 250, 750, 50], ["kg", "g"]],
    ["{P} boit une canette de {A}, puis {B} d'eau.", "En tout,", "+", ["cL", 33, 33, 1], ["mL", 150, 250, 50], ["cL", "mL"]]
  ];
  // Le marathon : 42 km 195 m (les millièmes de km sont au CM2 : on
  // l'écrit avec deux unités), et le panneau d'un kilomètre.
  const PANNEAUX_C8 = [30, 35, 38, 40, 41];
  function situationC8(code, degre, rng) {
    if (degre >= 2 && rng() < 0.12) {
      const km = choisir(rng, PANNEAUX_C8);
      return questionCalculC8(code, degre, {A: milli(42195), ua: "m", op: "-", B: milli(km), ub: "km", vers: "m", sorte: "marathon",
        texteA: `42${NB}km 195${NB}m`,
        situation: {enonce: `${choisir(rng, PRENOMS)} a couru ${km}${NB}km d'un marathon de 42${NB}km 195${NB}m.`, avant: "Il reste"}});
    }
    for (let essai = 0; essai < 40; essai += 1) {
      const k = Math.floor(rng() * SITUATIONS_C8.length);
      const [modele, avant, op, [g, gMin, gMax, gPas], [p, pMin, pMax, pPas], verses] = SITUATIONS_C8[k];
      const a = gMin + Math.floor(rng() * (Math.round((gMax - gMin) / gPas) + 1)) * gPas;
      const b = pMin + Math.floor(rng() * (Math.round((pMax - pMin) / pPas) + 1)) * pPas;
      const A = BigInt(Math.round(a * 1000));
      const B = BigInt(Math.round(b * 1000));
      // (d1 : le résultat dans la petite unité, des nombres entiers.)
      const vers = degre === 1 ? (verses.includes(p) ? p : null) : choisir(rng, verses);
      if (!vers || (degre === 1 && A % MILLE)) continue;
      const prenom = choisir(rng, PRENOMS);
      const enonce = modele.replace("{P}", prenom).replace("{A}", mes(A, g)).replace("{B}", mes(B, p));
      const x = questionCalculC8(code, degre, {A, ua: g, op, B, ub: p, vers, sorte: `situation-${k}`, situation: {enonce, avant}});
      if (x) return Object.assign(x, {situationC8: k});
    }
    return null;
  }

  // L'exemple officiel qui n'est pas dans On te montre (S002) :
  // « 8,2 m + 0,43 dam = … m » (le seul dam à virgule de l'étape : on ne
  // l'écrit pas ainsi, mais le programme le donne en exemple).
  function officielleC8(code, degre) {
    return questionCalculC8(code, degre, {A: milli("8,2"), ua: "m", op: "+", B: milli("0,43"), ub: "dam", vers: "m", sorte: "officielle"});
  }

  // Les erreurs de C8 au pavé. Une ligne au petit téléphone (31 caractères
  // au plus) : ajouter les nombres sans convertir ; une conversion fausse
  // d'un zéro ; ajouter au lieu d'enlever (ou l'inverse) ; le résultat
  // écrit dans l'autre unité ; la virgule.
  function erreursC8(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "calc" || typeof lu !== "bigint") return null;
    const A = milli(d.a);
    const B = milli(d.b);
    const Av = convertir(A, d.ua, d.vers);
    const Bv = convertir(B, d.ub, d.vers);
    const rep = milli(question.reponse);
    const calc = (x, y) => (d.op === "+" ? x + y : x - y);
    const cEst = d.ua === d.vers ? "b" : "a";
    const [c, uc, cv] = cEst === "a" ? [A, d.ua, Av] : [B, d.ub, Bv];
    const brutA = d.sorte === "marathon" ? milli(42195) : A;
    if (lu === calc(brutA, B) || (d.op === "-" && lu === B - A)) return {erreur: 5, retour: `J'écris d'abord tout en ${d.vers}.`};
    for (const faux of [cv * 10n, cv % 10n === 0n ? cv / 10n : null, cv * 100n, cv % 100n === 0n ? cv / 100n : null]) {
      if (faux === null) continue;
      const r = cEst === "a" ? calc(faux, Bv) : calc(Av, faux);
      if (r > 0n && lu === r) return {erreur: 6, retour: `${mes(c, uc)}, c'est ${mes(cv, d.vers)}.`};
    }
    if (d.op === "-" && lu === Av + Bv) return {erreur: 7, retour: "J'enlève, je n'ajoute pas."};
    if (d.op === "+" && lu === (Av > Bv ? Av - Bv : Bv - Av)) return {erreur: 7, retour: "J'ajoute, je n'enlève pas."};
    const autre = d.vers === d.ua ? d.ub : d.ua;
    const dansAutre = convertir(rep, d.vers, autre);
    if (dansAutre !== null && lu === dansAutre) return {erreur: 8, retour: `${ecrire(lu)}, ce serait des ${autre}.`};
    // (Avec des nombres entiers, c'est un zéro, pas la virgule.)
    if (lu === rep * 10n || lu * 10n === rep) {
      if (rep % MILLE || lu % MILLE) return {erreur: 9, retour: "La virgule est mal placée."};
      return {erreur: 9, retour: lu > rep ? "Un zéro de trop." : "Un zéro de moins."};
    }
    return null;
  }

  // Je valide : le complément en 3e, une situation en 7e ; À toi : le
  // complément aux places 3 et 14, une situation une fois sur quatre
  // ailleurs ; un retour : une situation en 2e.
  function formesC8(usage, rng) {
    if (usage === "valide") return {2: "complement", 6: "situation"};
    if (usage === "entraine") {
      const f = {2: "complement", 13: "complement"};
      for (let i = 0; i < 25; i += 1) if (!f[i] && rng() < 0.25) f[i] = "situation";
      return f;
    }
    if (usage === "retour") return {1: "situation"};
    return {};
  }
  ETAPES.C8 = {
    clesExemples: ["C8:1L-25cL", "C8:8,2kg+840g", "C8:25cL+330mL"],
    tirer(rng, degre, i, usage, forme) {
      if (forme === "complement") return questionComplementC8("C8", degre, rng);
      if (forme === "situation") return situationC8("C8", degre, rng);
      if (degre === 3 && rng() < 0.06) return officielleC8("C8", degre);
      return tirerCalculC8("C8", degre, rng);
    },
    formes: formesC8,
    // (Dans Je valide : une même relation deux fois au plus ; une même
    // sorte trois fois au plus ; une même situation une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide") return true;
      if (serie.filter(x => x.relationCle === question.relationCle).length >= 2) return false;
      if (serie.filter(x => x.sorteC8 === question.sorteC8).length >= 3) return false;
      return true;
    },
    // (Les sommes et les différences trois fois au moins ; le résultat
    // dans la grande unité trois fois au moins ; les trois grandeurs.)
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const n = k => serie.filter(k).length;
      return serieConvertirBonne(serie, usage) && n(x => x.opC8 === "+") >= 3 && n(x => x.opC8 === "-") >= 3
        && n(x => x.sensC8 === "grande") >= 3;
    },
    erreurs: erreursC8
  };

  // ================================================ lot B2-3a : A5 (CM1)
  // « L'aire en carreaux » (carte v4 ; S002 p. 16 : « comparer des aires
  // sans avoir recours à la mesure […] par superposition ou par découpage et
  // recollement » ; « déterminer l'aire d'une surface composée de carreaux
  // entiers et de demi-carreaux » ; « encadrer l'aire d'une surface
  // quelconque » ; « 1 cm² est l'aire d'un carré de 1 cm de côté » ; « deux
  // figures peuvent avoir la même aire, mais des périmètres différents »).
  // Choix de Gwenaël du 20/11 (maquette sur la vraie page) : les demis se
  // RECOLLENT dans l'outil ; on compare en SUPERPOSANT ; la réponse en
  // carreaux au degré 1, en cm² ensuite (« 1 carreau = 1 cm² »).
  //
  // Une figure : des lignes de caractères, une par rangée de carreaux.
  //   "#" un carreau entier · "." rien · un demi-carreau (le triangle
  //   coloré) : "a" en haut à gauche ◤, "b" en haut à droite ◥, "c" en bas
  //   à droite ◢, "d" en bas à gauche ◣.
  // Chaque carreau se partage en quatre quarts (le triangle du centre vers
  // chaque côté : N, E, S, O) : un carreau entier, les quatre ; un demi,
  // deux. L'aire en quarts sert à superposer et à vérifier.
  const QUARTS_A5 = {"#": 15, a: 9, b: 3, c: 6, d: 12};
  const UNITE_A5 = {carreaux: "carreaux", cm2: "cm²"};
  function piecesA5(fig) {
    const p = [];
    fig.forEach((l, y) => [...l].forEach((ch, x) => { if (QUARTS_A5[ch]) p.push({ch, x, y, demi: ch !== "#"}); }));
    return p;
  }
  function pleinsA5(fig) { return piecesA5(fig).filter(p => !p.demi).length; }
  function demisA5(fig) { return piecesA5(fig).filter(p => p.demi).length; }
  // L'aire en demi-carreaux (toujours un entier).
  function aireDemisA5(fig) { return 2 * pleinsA5(fig) + demisA5(fig); }
  function plein(fig, x, y) { return (fig[y] || "")[x] === "#"; }
  // Le périmètre d'une figure de carreaux entiers (en côtés de carreau) :
  // l'erreur « j'ai compté le tour ».
  function perimetreA5(fig) {
    let n = 0;
    piecesA5(fig).forEach(({x, y}) => { [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!plein(fig, x + dx, y + dy)) n += 1; }); });
    return n;
  }
  // Une figure de carreaux entiers d'un seul tenant, sans trou, aux bords
  // réguliers : chaque colonne est une bande verticale ; d'une colonne à la
  // suivante, le haut et le bas bougent d'un carreau au plus, et les deux
  // bandes se touchent. Puis des demis, là où un vrai dessin en aurait :
  // un coin rentrant rempli (le demi a ses deux côtés contre la figure) ou
  // un coin sortant coupé en biais (le carreau du coin devient un demi). Pas
  // deux demis côte à côte. (Lot B2-3a, premier essai : des demis collés au
  // hasard faisaient des pointes, des figures « en dents de scie ».)
  function figureA5(rng, {W, H, pleins: [pMin, pMax], demis: [dMin, dMax]}) {
    for (let essai = 0; essai < 600; essai += 1) {
      const w = entre(rng, W[0], W[1]);
      const h = entre(rng, H[0], H[1]);
      const cols = [];
      let ok = true;
      for (let x = 0; x < w && ok; x += 1) {
        const v = cols[x - 1];
        let c = null;
        for (let k = 0; k < 30 && !c; k += 1) {
          const haut = v ? Math.max(0, Math.min(h - 1, v[0] + entre(rng, -1, 1))) : entre(rng, 0, h - 1);
          const bas = v ? Math.max(haut + 1, Math.min(h, v[1] + entre(rng, -1, 1))) : entre(rng, haut + 1, h);
          if (!v || (haut < v[1] && bas > v[0])) c = [haut, bas];
        }
        if (!c) ok = false; else cols.push(c);
      }
      if (!ok) continue;
      // La figure remplit sa boîte (pas de rangée ni de colonne vide).
      if (Math.min(...cols.map(c => c[0])) !== 0 || Math.max(...cols.map(c => c[1])) !== h) continue;
      const g = Array.from({length: h}, (_, y) => Array.from({length: w}, (_, x) => (y >= cols[x][0] && y < cols[x][1] ? "#" : ".")));
      const nd = 2 * entre(rng, dMin / 2, dMax / 2);
      const est = (x, y) => Boolean(g[y]) && g[y][x] === "#";
      const vide = (x, y) => !est(x, y);
      // [x, y, demi] : les places possibles.
      const places = [];
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const [hh, bb, gg, dd] = [est(x, y - 1), est(x, y + 1), est(x - 1, y), est(x + 1, y)];
          if (g[y][x] === ".") {
            // Un coin rentrant : deux côtés perpendiculaires contre la
            // figure, les deux autres libres.
            if (bb && dd && !hh && !gg) places.push([x, y, "c"]);
            if (bb && gg && !hh && !dd) places.push([x, y, "d"]);
            if (hh && dd && !bb && !gg) places.push([x, y, "b"]);
            if (hh && gg && !bb && !dd) places.push([x, y, "a"]);
          } else {
            // Un coin sortant : deux côtés perpendiculaires libres, les deux
            // autres contre la figure (elle reste d'un seul tenant).
            if (vide(x, y - 1) && vide(x - 1, y) && bb && dd) places.push([x, y, "c"]);
            if (vide(x, y - 1) && vide(x + 1, y) && bb && gg) places.push([x, y, "d"]);
            if (vide(x, y + 1) && vide(x - 1, y) && hh && dd) places.push([x, y, "b"]);
            if (vide(x, y + 1) && vide(x + 1, y) && hh && gg) places.push([x, y, "a"]);
          }
        }
      }
      const pris = [];
      melanger(rng, places).forEach(([x, y, ch]) => {
        if (pris.length >= nd) return;
        if (pris.some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) <= 1)) return;
        pris.push([x, y, ch]);
      });
      if (pris.length < nd) continue;
      pris.forEach(([x, y, ch]) => { g[y][x] = ch; });
      const fig = g.map(l => l.join(""));
      const n = fig.join("").split("").filter(ch => ch === "#").length;
      if (n < pMin || n > pMax) continue;
      // Pas un simple rectangle (sauf au degré 1, une fois sur cinq).
      if (nd === 0 && n === w * h && rng() < 0.8) continue;
      return fig;
    }
    return null;
  }
  // Superposer B sur A : le décalage (dx, dy) de B qui recouvre le plus de A
  // (en quarts), puis ce qui dépasse de chacune (en quarts).
  function quartsDe(fig, dx = 0, dy = 0) {
    const m = new Map();
    piecesA5(fig).forEach(p => m.set(`${p.x + dx},${p.y + dy}`, QUARTS_A5[p.ch]));
    return m;
  }
  const bits = k => ((k & 1) + ((k >> 1) & 1) + ((k >> 2) & 1) + ((k >> 3) & 1));
  function superposerA5(A, B) {
    const qa = quartsDe(A);
    let meilleur = null;
    const wa = Math.max(...A.map(l => l.length)); const wb = Math.max(...B.map(l => l.length));
    for (let dy = -(B.length - 1); dy <= A.length - 1; dy += 1) {
      for (let dx = -(wb - 1); dx <= wa - 1; dx += 1) {
        const qb = quartsDe(B, dx, dy);
        let commun = 0;
        qb.forEach((k, cle) => { commun += bits(k & (qa.get(cle) || 0)); });
        // (À égalité : le plus près du coin en haut à gauche.)
        if (!meilleur || commun > meilleur.commun || (commun === meilleur.commun && Math.abs(dx) + Math.abs(dy) < Math.abs(meilleur.dx) + Math.abs(meilleur.dy))) {
          meilleur = {dx, dy, commun};
        }
      }
    }
    const qb = quartsDe(B, meilleur.dx, meilleur.dy);
    let depasseA = 0; let depasseB = 0;
    qa.forEach((k, cle) => { depasseA += bits(k & ~(qb.get(cle) || 0)); });
    qb.forEach((k, cle) => { depasseB += bits(k & ~(qa.get(cle) || 0)); });
    return {dx: meilleur.dx, dy: meilleur.dy, depasseA, depasseB};
  }
  const NOMBRE_A5 = q4 => (q4 % 4 === 0 ? String(q4 / 4) : `${Math.floor(q4 / 4)},${(q4 % 4) * 25}`.replace(",50", ",5"));
  const carreauxA5 = n => `${n}${NB}carreau${n === "1" || n === 1 || /^[01],/.test(String(n)) ? "" : "x"}`;

  // « Quelle est l'aire de cette figure ? » Degré 1 : des carreaux entiers,
  // en carreaux ; degré 2 : des demis, en cm² ; degré 3 : jusqu'à 30
  // carreaux, plus de demis, en cm².
  const TAILLES_A5 = {
    1: {W: [3, 5], H: [2, 3], pleins: [5, 12], demis: [0, 0]},
    2: {W: [3, 6], H: [2, 4], pleins: [6, 16], demis: [2, 4]},
    3: {W: [4, 7], H: [3, 4], pleins: [12, 26], demis: [2, 6]}
  };
  function questionCompterA5(degre, rng, fig = null) {
    fig = fig || figureA5(rng, TAILLES_A5[degre]);
    if (!fig) return null;
    const unite = degre === 1 ? "carreaux" : "cm2";
    const p = pleinsA5(fig); const d = demisA5(fig); const n = p + d / 2;
    if (n > 30) return null;
    const U = UNITE_A5[unite];
    const phrase = "Quelle est l'aire de la figure ?";
    const reponseTexte = `${n}${NB}${U}`;
    const lignes = d ? [carreauxA5(p), `+ ${d}${NB}demis`, `= ${carreauxA5(n)}`] : [`= ${carreauxA5(n)}`];
    if (unite === "cm2") lignes.push(`= ${n}${NB}cm²`);
    return q({
      code: "A5", degre, forme: "nombre", texte: `${phrase} … ${U}`,
      morceaux: {phrase, apres: U, aire: true},
      aire: {sorte: "compter", fig, unite},
      reponse: String(n), reponseTexte, unite: U,
      resume: `L'aire est ${reponseTexte}`,
      outil: "aire",
      image: d ? ["Deux demis font un carreau."] : ["Je compte rangée par rangée."],
      correction: lignes,
      sorteA5: "compter",
      donnees: {type: "aire", sorte: "compter", pleins: p, demis: d, perimetre: d ? null : perimetreA5(fig)},
      cle: `A5:c:${fig.join("/")}`
    });
  }
  // Les erreurs de « Quelle est l'aire ? » (31 caractères au plus).
  function erreursA5(question, lu, lus) {
    const d = question.donnees;
    if (d.sorte === "encadrer" && lus) {
      const [a, b] = lus.map(x => Number(x / 1000n));
      if (a === d.touches && b === d.entiers) return {erreur: 1, retour: "Le plus petit nombre d'abord."};
      if (a !== d.entiers && b === d.touches) return {erreur: 2, retour: "Dedans : les carreaux entiers."};
      if (a === d.entiers && b !== d.touches) return {erreur: 3, retour: "Puis ceux que la tache touche."};
      return null;
    }
    if (d.sorte !== "compter" || typeof lu !== "bigint" || lu % 1000n) return null;
    const v = Number(lu / 1000n);
    const n = d.pleins + d.demis / 2;
    if (d.demis && v === d.pleins + d.demis) return {erreur: 1, retour: "Deux demis font un carreau."};
    if (d.demis && v === d.pleins) return {erreur: 2, retour: "Tu as oublié les demis."};
    if (d.perimetre && v === d.perimetre && v !== n) return {erreur: 3, retour: "Ça, c'est le tour de la figure."};
    if (Math.abs(v - n) === 1) return {erreur: 4, retour: "Je numérote chaque carreau."};
    return null;
  }

  // Comparer deux figures. « Laquelle a la plus grande aire ? » (A, B,
  // Même aire) ou « Même aire pour A et B ? » (Oui, Non). Degré 1 : deux
  // aires bien différentes (on le voit) ; degré 2 : la même aire ou 1 à 3
  // carreaux d'écart, des carreaux entiers ; degré 3 : avec des demis.
  const TAILLES_CMP = {
    1: {W: [2, 4], H: [2, 3], pleins: [3, 10], demis: [0, 0]},
    2: {W: [2, 5], H: [2, 3], pleins: [5, 12], demis: [0, 0]},
    3: {W: [2, 5], H: [2, 3], pleins: [5, 11], demis: [2, 2]}
  };
  function deuxFiguresA5(degre, rng, meme) {
    for (let essai = 0; essai < 200; essai += 1) {
      const A = figureA5(rng, TAILLES_CMP[degre]);
      const B = figureA5(rng, TAILLES_CMP[degre]);
      if (!A || !B || A.join("/") === B.join("/")) continue;
      const a = aireDemisA5(A); const b = aireDemisA5(B);
      if (meme && a !== b) continue;
      if (!meme) {
        if (a === b) continue;
        const [p, g] = [Math.min(a, b), Math.max(a, b)];
        if (degre === 1 && g < p * 1.5) continue;
        if (degre > 1 && g - p > 6) continue;
      }
      // (Deux figures de même aire ne se recouvrent pas tout à fait : sinon
      // ce serait la même figure.)
      const s = superposerA5(A, B);
      if (meme && s.depasseA === 0) continue;
      return {A, B, a, b, s};
    }
    return null;
  }
  function questionComparerA5(degre, rng, sorte) {
    const memeAire = sorte === "meme" ? rng() < 0.5 : degre > 1 && rng() < 0.34;
    const f = deuxFiguresA5(degre, rng, memeAire);
    if (!f) return null;
    const {A, B, a, b, s} = f;
    const ta = carreauxA5(NOMBRE_A5(2 * a)); const tb = carreauxA5(NOMBRE_A5(2 * b));
    const dep = [`A : ${ta}`, `B : ${tb}`];
    let choix; let bon; let pourquoi; let phrase; let reponse;
    if (sorte === "meme") {
      phrase = "Même aire pour A et B ?";
      choix = ["Oui", "Non"];
      bon = a === b ? 0 : 1;
      reponse = choix[bon];
      pourquoi = a === b ? {1: "La forme change, pas l'aire."} : {0: "Compte chaque figure."};
    } else {
      phrase = "La plus grande aire ?";
      choix = ["A", "B", "Même aire"];
      bon = a === b ? 2 : a > b ? 0 : 1;
      reponse = choix[bon];
      pourquoi = a === b ? {0: "La forme change, pas l'aire.", 1: "La forme change, pas l'aire."}
        : {[1 - bon]: `Pose B sur A : ${choix[bon]} dépasse plus.`, 2: `Compte : ${choix[bon]} a plus de carreaux.`};
    }
    const verdict = a === b ? "Même aire." : `${a > b ? "A" : "B"} a la plus grande aire.`;
    return q({
      code: "A5", degre, forme: "qcm", texte: `${phrase} ${choix.join(" · ")}`,
      morceaux: {phrase, deuxFig: true},
      aire: {sorte, a: A, b: B, dx: s.dx, dy: s.dy, depasseA: s.depasseA, depasseB: s.depasseB},
      choix, bon, reponse, reponseTexte: reponse, pourquoi,
      resume: `${dep.join(" · ")}. ${verdict}`,
      outil: "aire",
      image: ["Je pose B sur A.", "Je compare ce qui dépasse."],
      correction: [dep.join(" · "), `= ${verdict}`],
      sorteA5: sorte,
      donnees: {type: "aire", sorte, aireA: a, aireB: b},
      cle: `A5:${sorte === "meme" ? "m" : "p"}:${A.join("/")}|${B.join("/")}`
    });
  }

  // Encadrer l'aire d'une tache (S002 p. 16 : « comprise entre 18 carreaux
  // et 36 carreaux »). Une ellipse sur le quadrillage : les carreaux
  // entiers dedans, puis tous ceux qu'elle touche. On écarte les ellipses
  // qui touchent un carreau à peine, ou qui en laissent dépasser à peine un
  // coin (on ne verrait pas la différence).
  function tacheA5(rng) {
    for (let essai = 0; essai < 300; essai += 1) {
      // (L'ellipse d'abord, posée n'importe où dans son premier carreau ;
      // le quadrillage autour. Des aires plus variées qu'une ellipse
      // centrée.)
      const rx = entre(rng, 16, 38) / 10; const ry = entre(rng, 11, 19) / 10;
      const cx = rx + entre(rng, 1, 9) / 10; const cy = ry + entre(rng, 1, 9) / 10;
      const W = Math.ceil(cx + rx); const H = Math.ceil(cy + ry);
      if (W > 8 || H > 4 || W < 4) continue;
      const f = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      const cases = [];
      let sur = true;
      for (let y = 0; y < H && sur; y += 1) {
        for (let x = 0; x < W; x += 1) {
          const px = Math.min(Math.max(cx, x), x + 1); const py = Math.min(Math.max(cy, y), y + 1);
          const mini = f(px, py);
          const maxi = Math.max(f(x, y), f(x + 1, y), f(x, y + 1), f(x + 1, y + 1));
          if ((mini > 0.86 && mini <= 1) || (maxi > 0.95 && maxi < 1.14)) { sur = false; break; }
          cases.push(maxi <= 1 ? 2 : mini <= 1 ? 1 : 0);
        }
      }
      if (!sur) continue;
      const entiers = cases.filter(k => k === 2).length;
      const touches = cases.filter(k => k > 0).length;
      if (entiers < 3 || touches > 30 || touches - entiers < 6) continue;
      return {W, H, cx: Math.round(cx * 100) / 100, cy: Math.round(cy * 100) / 100, rx, ry, cases, entiers, touches};
    }
    return null;
  }
  function questionEncadrerA5(degre, rng) {
    const t = tacheA5(rng);
    if (!t) return null;
    const avant = "L'aire de la tache est entre\u00a0:";
    return q({
      code: "A5", degre, forme: "deux-cases", texte: `${avant} … et … carreaux.`,
      morceaux: {avant, cases: ["et", "carreaux."], aire: true},
      aire: {sorte: "encadrer", tache: t},
      reponse: [String(t.entiers), String(t.touches)], reponseTexte: `${t.entiers} et ${t.touches}`, unite: "carreaux",
      resume: `L'aire est entre ${t.entiers} et ${carreauxA5(t.touches)}`,
      outil: "aire",
      image: ["Dedans : les carreaux entiers.", "Puis ceux que la tache touche."],
      correction: [`${carreauxA5(t.entiers)} entiers dedans`, `${carreauxA5(t.touches)} la recouvrent`, `= entre ${t.entiers} et ${carreauxA5(t.touches)}`],
      sorteA5: "encadrer",
      donnees: {type: "aire", sorte: "encadrer", entiers: t.entiers, touches: t.touches},
      cle: `A5:e:${t.W}x${t.H}:${t.cx},${t.cy},${t.rx},${t.ry}`
    });
  }
  // Les places des sortes. Je valide : compter cinq fois, comparer deux
  // fois, « Même aire ? » deux fois, encadrer en 8e. À toi : à peu près
  // pareil, encadrer deux fois au degré 3.
  const PLACES_A5 = {
    valide: ["compter", "comparer", "compter", "compter", "meme", "compter", "comparer", "encadrer", "compter", "meme"],
    entraine: ["compter", "compter", "comparer", "compter", "meme", "compter",
      "compter", "comparer", "compter", "compter", "meme", "compter", "comparer", "compter", "compter",
      "compter", "encadrer", "compter", "comparer", "compter", "meme", "compter", "encadrer", "compter", "comparer"],
    test: ["compter", "comparer", "encadrer", "compter"],
    aide: ["compter", "comparer", "compter"],
    retour: ["compter", "comparer"],
    echauffement: ["compter"]
  };
  function formesA5(usage, rng) {
    const p = PLACES_A5[usage];
    const f = {};
    if (p) p.forEach((s, i) => { f[i] = s; });
    else for (let i = 0; i < 40; i += 1) { const r = rng(); f[i] = r < 0.55 ? "compter" : r < 0.75 ? "comparer" : r < 0.9 ? "meme" : "encadrer"; }
    return f;
  }
  ETAPES.A5 = {
    clesExemples: ["A5:c:###./####/#...", "A5:c:c##d/####", "A5:p:###/###|######"],
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || "compter";
      if (sorte === "encadrer") return degre === 3 ? questionEncadrerA5(degre, rng) : questionCompterA5(degre, rng);
      if (sorte === "comparer" || sorte === "meme") return questionComparerA5(degre, rng, sorte);
      return questionCompterA5(degre, rng);
    },
    formes: formesA5,
    erreurs(question, lu, lus) { return erreursA5(question, lu, lus); }
  };

  // ================================== lot B2-3b-1 : Q2 « Ajouter, retirer » (CM1)
  // Programme de CM1 (S002 p. 11-13) : des problèmes additifs en une étape
  // (« parties-tout », « comparaison »), en deux ou trois étapes, et mixtes,
  // avec des nombres décimaux ; ici, toujours avec deux unités. Carte v4 :
  // le périmètre d'un rectangle en m et cm ; « Est-ce vraisemblable ? » ;
  // le schéma en barres ; le problème de la tare (pot vide, pot plein) ;
  // S002 : Izmir (3 pains de 210 g, 2 bouteilles de 1,6 kg), Alix (1,61 m,
  // 13 cm de plus que Bruno), les balances (3 ciseaux + 140 g = 500 g).
  // Choix de Gwenaël sur la maquette (20/11) : comparer avec DEUX BARRES
  // COLLÉES (l'écart en pointillé au bout de la plus courte) ; la balance
  // DESSINÉE dans la question ; le rectangle DESSINÉ, ses côtés écrits.
  // Les sortes : réunir (le tout), une partie (le reste, la tare), comparer
  // (de plus, de moins, l'écart), le périmètre, Izmir (des objets pareils),
  // la balance, deux étapes (les deux ensemble ; deux morceaux enlevés).
  // Chaque question porte ses `termes` (mesure, unité, coefficient) et son
  // diviseur : la réponse est (Σ coefficient × mesure) ÷ diviseur, dans
  // l'unité `vers` (le test la recalcule à part).
  const tireQ2 = (rng, [u, min, max, pas]) => {
    const n = Math.round((max - min) / pas);
    return [BigInt(Math.round((min + Math.floor(rng() * (n + 1)) * pas) * 1000)), u];
  };
  // « le cartable d'Inès », « celui de Noa ».
  const deQ2 = p => (/^[AEIOUÉÈÂÎ]/.test(p) ? `d'${p}` : `de ${p}`);
  const queQ2 = p => (/^[AEIOUÉÈÂÎ]/.test(p) ? `qu'${p}` : `que ${p}`);
  const deuxPrenomsQ2 = rng => {
    const a = choisir(rng, PRENOMS);
    return [a, choisir(rng, PRENOMS.filter(p => p !== a))];
  };
  // Une mesure et sa conversion, si elle n'est pas déjà dans l'unité `vers`.
  const ecritQ2 = (m, u, vers) => (u === vers ? mes(m, u) : `${mes(m, u)} = ${mes(convertir(m, u, vers), vers)}`);
  const remplirQ2 = (t, champs) => t.replace(/\{(\w+)\}/g, (_, k) => champs[k]);
  // La réponse : (Σ k × mesure en `vers`) ÷ n, ou null si elle ne tombe pas
  // juste ou ne s'écrit pas dans `vers`.
  function valeurQ2(termes, n, vers) {
    let s = 0n;
    for (const [m, u, k] of termes) {
      const c = convertir(m, u, vers);
      if (c === null) return null;
      s += BigInt(k) * c;
    }
    if (s <= 0n || s % BigInt(n) !== 0n) return null;
    const r = s / BigInt(n);
    return naturelleC8(r, vers) ? r : null;
  }
  // Chaque mesure donnée s'écrit vraiment dans son unité, et dans `vers`
  // si elle s'y convertit (« 350 g = 0,35 kg », pas « 5 g = 0,005 kg »).
  function mesuresQ2(termes, vers) {
    return termes.every(([m, u]) => naturelleC8(m, u) && (u === vers || grandeurDe(u) !== grandeurDe(vers) || naturelleC8(convertir(m, u, vers), vers)));
  }
  const cleQ2 = (modele, termes, n) => `Q2:${modele}:${termes.map(([m, u, k]) => `${k}*${brut(m)}${u}`).join("|")}${n > 1 ? `/${n}` : ""}`;

  // Réunir : le tout. [modèle, énoncé, avant, la mesure A, la mesure B,
  // ce que trouve quelqu'un (« Est-ce vraisemblable ? »)].
  const REUNIR_Q2 = [
    ["cabas", "{P} achète {A} de carottes et {B} de tomates. Quelle est la masse totale ?", "En tout,", ["kg", 1, 3, 0.5], ["g", 150, 900, 50], "{M} en tout"],
    ["letchis", "Au marché, {P} prend {A} de letchis et {B} de mangues. Quelle est la masse totale ?", "En tout,", ["kg", 1, 2.5, 0.5], ["g", 250, 900, 50], "{M} en tout"],
    ["cascade", "{P} marche {A}, puis {B} jusqu'à la cascade. Quelle est la distance totale ?", "En tout,", ["km", 1, 4, 0.5], ["m", 200, 900, 50], "{M} en tout"],
    ["pichet", "{P} mélange {A} de jus d'ananas et {B} de jus de goyavier. Combien de jus en tout ?", "En tout,", ["L", 1, 2, 0.5], ["cL", 20, 75, 5], "{M} en tout"],
    ["tissu", "{P} coud bout à bout deux bandes de tissu : {A} et {B}. Quelle est la longueur totale ?", "En tout,", ["m", 1, 3, 0.5], ["cm", 35, 95, 5], "{M} en tout"]
  ];
  // Une partie : le tout A, une partie B, l'autre partie.
  const PARTIE_Q2 = [
    ["pot", "Un pot de confiture plein pèse {A}. Le pot vide pèse {B}. Quelle est la masse de la confiture ?", "Confiture :", ["kg", 1, 1.5, 0.05], ["g", 250, 450, 50], "{M} de confiture"],
    ["caisse", "Une caisse de mangues pèse {A}. La caisse vide pèse {B}. Quelle est la masse des mangues ?", "Mangues :", ["kg", 4, 9, 0.5], ["g", 500, 900, 100], "{M} de mangues"],
    ["ficelle", "Un rouleau de ficelle mesure {A}. {P} en coupe {B}. Quelle longueur de ficelle reste-t-il ?", "Il reste", ["m", 2, 5, 0.5], ["cm", 35, 95, 5], "qu'il reste {M}"],
    ["bouteille", "Une bouteille contient {A} d'eau. {P} en boit {B}. Combien d'eau reste-t-il ?", "Il reste", ["L", 1, 2, 0.5], ["cL", 20, 75, 5], "qu'il reste {M}"],
    ["fruits", "{P} achète {A} de fruits : des pommes et {B} de poires. Quelle est la masse des pommes ?", "Pommes :", ["kg", 2, 5, 0.5], ["g", 400, 950, 50], "{M} de pommes"]
  ];
  // Comparer : A (le premier prénom), B l'écart, l'autre prénom (Q).
  // `moins` : P a B de plus que Q (Q = A − B) ; `plus` : P a B de moins
  // (Q = A + B) ; `ecart` : P et Q donnés, l'écart cherché.
  const COMPARER_Q2 = [
    ["taille", ["m", 1.3, 1.65, 0.01], ["cm", 4, 19, 1], {
      moins: "{P} mesure {A}. C'est {B} de plus {qQ}. Combien mesure {Q} ?",
      plus: "{P} mesure {A}. C'est {B} de moins {qQ}. Combien mesure {Q} ?",
      ecart: "{P} mesure {A} et {Q} mesure {C}. Quel est l'écart de taille ?"}, "{Q} :", "{qQ} mesure {M}"],
    ["saut", ["m", 2, 3.6, 0.05], ["cm", 10, 60, 5], {
      moins: "Au saut en longueur, {P} saute {A}. {Q} saute {B} de moins. Quelle longueur saute {Q} ?",
      plus: "Au saut en longueur, {P} saute {A}. {Q} saute {B} de plus. Quelle longueur saute {Q} ?",
      ecart: "Au saut en longueur, {P} saute {A} et {Q} saute {C}. Quel est l'écart ?"}, "{Q} :", "{qQ} saute {M}"],
    ["cartable", ["kg", 2, 3.5, 0.1], ["g", 200, 900, 50], {
      moins: "Le cartable {dP} pèse {A}. Celui {dQ} pèse {B} de moins. Combien pèse le cartable {dQ} ?",
      plus: "Le cartable {dP} pèse {A}. Celui {dQ} pèse {B} de plus. Combien pèse le cartable {dQ} ?",
      ecart: "Le cartable {dP} pèse {A} et celui {dQ} pèse {C}. Quel est l'écart ?"}, "Cartable :", "que ce cartable pèse {M}"],
    ["course", ["km", 1, 5, 0.5], ["m", 200, 900, 100], {
      moins: "{P} court {A}. {Q} court {B} de moins. Quelle distance court {Q} ?",
      plus: "{P} court {A}. {Q} court {B} de plus. Quelle distance court {Q} ?",
      ecart: "{P} court {A} et {Q} court {C}. Quel est l'écart ?"}, "{Q} :", "{qQ} court {M}"]
  ];
  // Izmir (S002) : n1 objets de a et n2 objets de b. [modèle, énoncé,
  // avant, a, b, les nombres d'objets possibles].
  const IZMIR_Q2 = [
    ["pains", "{P} achète {n1} pains de {a} et {n2} bouteilles d'eau de {b}. Quelle est la masse totale ?", "En tout,", ["g", 150, 300, 10], ["kg", 1.5, 1.6, 0.1]],
    ["farine", "{P} achète {n1} paquets de riz de {a} et {n2} sacs de farine de {b}. Quelle est la masse totale ?", "En tout,", ["g", 150, 400, 50], ["kg", 1, 2, 1]],
    ["planches", "{P} pose bout à bout {n2} planches de {b} et {n1} tasseaux de {a}. Quelle est la longueur totale ?", "En tout,", ["cm", 40, 90, 5], ["m", 1.2, 2.5, 0.1]],
    ["fete", "{P} achète {n2} bouteilles de {b} et {n1} canettes de {a}. Quelle quantité de boisson en tout ?", "En tout,", ["cL", 33, 33, 1], ["L", 1.5, 2, 0.5]]
  ];
  // Deux étapes : les deux ensemble (S002 : Léo et Lucie) ; deux morceaux
  // enlevés (S002 : Agathe).
  const ENSEMBLE_Q2 = [
    ["course2", "{P} court {A}. {Q} court {B} de plus. Quelle distance courent les deux enfants ensemble ?", "Ensemble :", ["km", 1, 3, 0.5], ["m", 200, 800, 100]],
    ["sacs", "Le sac {dP} pèse {A}. Celui {dQ} pèse {B} de plus. Combien pèsent les deux sacs ensemble ?", "Ensemble :", ["kg", 2, 4, 0.5], ["g", 300, 900, 100]]
  ];
  const RESTE_Q2 = [
    ["ruban3", "Un ruban mesure {A}. {P} en coupe {B}, puis {C}. Quelle longueur de ruban reste-t-il ?", "Il reste", ["m", 2, 4, 0.5], ["cm", 25, 95, 5], ["cm", 25, 95, 5]],
    ["sentier3", "Un sentier mesure {A}. {P} marche {B}, puis {C}. Quelle distance reste-t-il à marcher ?", "Il reste", ["km", 3, 6, 0.5], ["km", 1, 2, 0.5], ["m", 300, 900, 100]]
  ];

  // L'unité de la réponse : la petite au degré 1 (des nombres entiers),
  // l'une ou l'autre au degré 2, la grande au degré 3 (des décimaux).
  function versQ2(rng, degre, grande, petite) {
    if (degre === 1) return petite;
    if (degre === 3) return grande;
    return rng() < 0.5 ? grande : petite;
  }

  // Le schéma en barres : `tout` en haut, `parts` dessous (`poids` : leurs
  // largeurs) ; ou deux barres collées (`deux`). `cherchee` : où est « ? ».
  // La correction : le même schéma, la réponse à la place de « ? », en vert.
  function corrigerSchemaQ2(s, r) {
    const c = JSON.parse(JSON.stringify(s));
    if (c.deux) {
      // (Les deux ensemble : la barre de l'autre se remplit, et le calcul
      // en vert dessous dit le total ; pas de ligne « Ensemble » en plus,
      // elle passait la correction d'À toi à 73 % au petit iPhone.)
      if (c.deux.total) { delete c.deux.total; c.deux.verte = null; }
      else ["haut", "bas"].forEach((k, i) => { if (c.deux[k][1].startsWith("?")) { c.deux[k][1] = r; c.deux.verte = i; } });
      if (c.deux.ecart.startsWith("?")) { c.deux.ecart = r; c.deux.verte = "ecart"; }
      if (c.deux.provisoire) c.deux.haut[1] = c.deux.provisoire;
      delete c.deux.provisoire;
      return c;
    }
    if (c.tout.startsWith("?")) { c.tout = r; c.verte = -2; }
    c.parts = c.parts.map((p, i) => (p.startsWith("?") ? ((c.verte = c.verte === undefined ? i : c.verte), r) : p));
    if (c.verte === undefined) c.verte = -1;
    return c;
  }

  // La question finie. spec : {sorte, modele, degre, enonce, avant, apres,
  // vers, termes, n, schema, image, correction, figure, note, trouve,
  // grande} ; `vrai` : null, « oui » ou « non » (« Est-ce vraisemblable ? »).
  function finirQ2(spec, rng, vrai) {
    const {sorte, modele, degre, vers, termes} = spec;
    const n = spec.n || 1;
    const rep = valeurQ2(termes, n, vers);
    if (rep === null || !mesuresQ2(termes, vers)) return null;
    const r = mes(rep, vers);
    const schema = spec.schema(r);
    // (L'aide n'écrit jamais la réponse : ni l'outil, ni l'image.)
    const outilTextes = schema.deux ? [schema.deux.haut[1], schema.deux.bas[1], schema.deux.ecart, schema.deux.total || ""] : [schema.tout, ...schema.parts];
    const echappe = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reRep = new RegExp(`(^|[^\\d,${FINE}])${echappe}($|[^\\wÀ-ÿ²³])`);
    if ([...outilTextes, ...spec.image, spec.note || ""].some(t => reRep.test(t))) return null;
    const cleBase = cleQ2(modele, termes, n);
    const cle = `${cleBase}>${vers}`;
    const schemaCorr = corrigerSchemaQ2(schema, r);
    const base = {
      code: "Q2", degre, unite: vers, outil: "schema", schema, schemaCorr, repTexteQ2: r, noteOutil: spec.note || "Je mets tout dans la même unité.",
      image: spec.image, correction: spec.correction(r), grandeur: grandeurDe(vers), sorteQ2: sorte, modeleQ2: modele,
      donnees: Object.assign({type: "q2", sorte, termes: termes.map(([m, u, k]) => [brut(m), u, k]), n, vers}, spec.sens ? {sens: spec.sens} : {}),
      cle, cleBase
    };
    if (spec.figure) base.figurePb = spec.figure;
    if (!vrai) {
      // (Une ligne « avant » de 8 caractères et plus, « Mangues : » :
      // la ligne de la case un peu plus petite, `long` ; l'énoncé un peu
      // plus serré que celui de Q1, `serre` : quatre lignes avec une police large
      // au petit iPhone faisaient passer une question mêlée de C8 à 76 %
      // dans Je valide.)
      const champsTexte = spec.figure ? {enonce: spec.enonce, avant: spec.avant || "", apres: vers, figure: spec.figure, serre: true}
        : Object.assign({enonce: spec.enonce, avant: spec.avant, apres: vers}, spec.avant.length >= 8 ? {long: true} : {},
          {serre: true});
      return q(Object.assign(base, {
        forme: "nombre", texte: `${spec.enonce} ${spec.avant ? `${spec.avant} ` : ""}${CASE}${NB}${vers}`, morceaux: champsTexte,
        reponse: brut(rep), reponseTexte: r, resume: `${spec.avant ? `${spec.avant} ` : ""}${r}`, resumeVert: spec.correction(r).slice(-1)[0]
      }));
    }
    // « Est-ce vraisemblable ? » : quelqu'un propose un résultat. Vrai : le
    // bon ; faux : × 10, ÷ 10, × 100 ou ÷ 100 (l'erreur de conversion),
    // qui s'écrit encore dans l'unité.
    const oui = vrai === "oui";
    let propose = rep;
    if (!oui) {
      const essais = [rep * 10n, rep * 100n, rep % 10n === 0n ? rep / 10n : null, rep % 100n === 0n ? rep / 100n : null]
        .filter(x => x !== null && x > 0n && decimales(x) <= 2 && x <= 100000n * MILLE && x >= 10n);
      if (!essais.length) return null;
      propose = choisir(rng, essais);
    }
    const auteur = choisir(rng, PRENOMS.filter(p => !spec.enonce.includes(p)));
    const dit = `${auteur} trouve ${remplirQ2(spec.trouve, {M: mes(propose, vers)})}.`;
    const enonce = spec.enonce.replace(/ (Quelle|Quel|Combien)[^.]*\?$/, "");
    const raison = oui ? `Oui : c'est bien ${r}.` : `Non : c'est ${r}, pas ${mes(propose, vers)}.`;
    return q(Object.assign(base, {
      forme: "vrai-faux", texte: `${enonce} ${dit} Est-ce vraisemblable${NB}?`,
      morceaux: {enonce, proposition: dit, serre: true},
      choix: ["Oui", "Non"], bon: oui ? 0 : 1, reponse: oui ? "Oui" : "Non", reponseTexte: oui ? "Oui" : "Non",
      resume: `${dit} ${oui ? "Vraisemblable." : "Pas vraisemblable."}`, correction: [raison], raisonQ2: raison,
      // (Le pourquoi d'un mauvais choix : une ligne au petit téléphone.)
      pourquoi: oui ? {1: "Le calcul est juste."} : {0: propose > rep ? "C'est beaucoup trop." : "C'est beaucoup trop peu."},
      donnees: Object.assign({}, base.donnees, {propose: brut(propose), vrai: oui}),
      cle: `${cle}:v${oui ? 1 : 0}`
    }));
  }

  // ---------------------------------------------------- les sortes de Q2
  function reunirQ2(degre, rng, k = null) {
    const [modele, texte, avant, [ga, ...ba], [gb, ...bb], trouve] = REUNIR_Q2[k === null ? Math.floor(rng() * REUNIR_Q2.length) : k];
    const [A, ua] = tireQ2(rng, [ga, ...ba]);
    const [B, ub] = tireQ2(rng, [gb, ...bb]);
    const vers = versQ2(rng, degre, ua, ub);
    const P = choisir(rng, PRENOMS);
    const Av = convertir(A, ua, vers);
    const Bv = convertir(B, ub, vers);
    const enonce = remplirQ2(texte, {P, A: mes(A, ua), B: mes(B, ub)});
    const conv = ua === vers ? `${mes(B, ub)} = ${mes(Bv, vers)}` : `${mes(A, ua)} = ${mes(Av, vers)}`;
    return {sorte: "reunir", modele, degre, enonce, avant, vers, trouve, termes: [[A, ua, 1], [B, ub, 1]],
      schema: () => ({tout: `?${NB}${vers}`, parts: [ecritQ2(A, ua, vers), ecritQ2(B, ub, vers)], poids: [Number(Av), Number(Bv)]}),
      image: [conv, `${mes(Av, vers)} + ${mes(Bv, vers)} = ${CASE}`],
      correction: r => [conv, `${mes(Av, vers)} + ${mes(Bv, vers)} = ${r}`]};
  }
  function partieQ2(degre, rng, k = null) {
    const [modele, texte, avant, [ga, ...ba], [gb, ...bb], trouve] = PARTIE_Q2[k === null ? Math.floor(rng() * PARTIE_Q2.length) : k];
    const [A, ua] = tireQ2(rng, [ga, ...ba]);
    const [B, ub] = tireQ2(rng, [gb, ...bb]);
    const vers = versQ2(rng, degre, ua, ub);
    const P = choisir(rng, PRENOMS);
    const Av = convertir(A, ua, vers);
    const Bv = convertir(B, ub, vers);
    const enonce = remplirQ2(texte, {P, A: mes(A, ua), B: mes(B, ub)});
    const conv = ua === vers ? `${mes(B, ub)} = ${mes(Bv, vers)}` : `${mes(A, ua)} = ${mes(Av, vers)}`;
    return {sorte: "partie", modele, degre, enonce, avant, vers, trouve, termes: [[A, ua, 1], [B, ub, -1]],
      schema: () => ({tout: ecritQ2(A, ua, vers), parts: [ecritQ2(B, ub, vers), `?${NB}${vers}`], poids: [Number(Bv), Number(Av - Bv)]}),
      image: [conv, `${mes(Av, vers)} − ${mes(Bv, vers)} = ${CASE}`],
      correction: r => [conv, `${mes(Av, vers)} − ${mes(Bv, vers)} = ${r}`]};
  }
  function comparerQ2(degre, rng, {k = null, sens = null, A0 = null, B0 = null} = {}) {
    const [modele, ga, gb, textes, avant0, trouve0] = COMPARER_Q2[k === null ? Math.floor(rng() * COMPARER_Q2.length) : k];
    const s = sens || choisir(rng, ["moins", "moins", "plus", "ecart"]);
    const [A, ua] = A0 ? [A0, ga[0]] : tireQ2(rng, ga);
    const [B, ub] = B0 ? [B0, gb[0]] : tireQ2(rng, gb);
    const [P, Q] = deuxPrenomsQ2(rng);
    // (L'écart : la mesure de Q est donnée dans la petite unité ; on cherche
    // l'écart, dans la petite unité.)
    const vers = s === "ecart" ? ub : versQ2(rng, Math.max(degre, 2), ua, ub);
    const Av = convertir(A, ua, vers);
    const Bv = convertir(B, ub, vers);
    const C = s === "ecart" ? convertir(A, ua, ub) - B : null;
    if (C !== null && (C <= 0n || !naturelleC8(C, ub))) return null;
    // (Une mesure qui tombe juste dans la grande unité s'écrit dans la
    // grande : pas « celui de Kenzo pèse 2 000 g ».)
    if (C !== null && C % (facteur(ua, ub) * MILLE) === 0n) return null;
    const enonce = remplirQ2(textes[s], {P, Q, dP: deQ2(P), dQ: deQ2(Q), qQ: queQ2(Q), A: mes(A, ua), B: mes(B, ub), C: C === null ? "" : mes(C, ub)});
    const avant = s === "ecart" ? "Écart :" : remplirQ2(avant0, {Q, dQ: deQ2(Q)});
    const trouve = s === "ecart" ? "un écart de {M}" : remplirQ2(trouve0, {Q, dQ: deQ2(Q), qQ: queQ2(Q), M: "{M}"});
    // (La mesure qui se convertit : A en petite unité, ou l'écart B en
    // grande.)
    const conv = ua !== vers ? `${mes(A, ua)} = ${mes(Av, vers)}` : `${mes(B, ub)} = ${mes(Bv, vers)}`;
    const op = s === "plus" ? "+" : "−";
    // (L'écart : les deux mesures dans la petite unité ; A se convertit.)
    const termes = s === "ecart" ? [[A, ua, 1], [C, ub, -1]] : [[A, ua, 1], [B, ub, s === "plus" ? 1 : -1]];
    const [x, y] = s === "ecart" ? [Av, C] : [Av, Bv];
    // (L'écart est court, au bout de la barre : sa mesure seule ; s'il se
    // convertit, la conversion est dans la phrase de l'outil.)
    const deux = s === "moins" ? {haut: [P, ecritQ2(A, ua, vers)], bas: [Q, `?${NB}${vers}`], ecart: mes(B, ub)}
      : s === "plus" ? {haut: [Q, `?${NB}${vers}`], bas: [P, ecritQ2(A, ua, vers)], ecart: mes(B, ub)}
        : {haut: [P, ecritQ2(A, ua, vers)], bas: [Q, mes(C, ub)], ecart: `?${NB}${vers}`};
    const note = s !== "ecart" && ub !== vers ? `J'écris tout en ${vers} : ${mes(B, ub)} = ${mes(Bv, vers)}.` : null;
    return {sorte: "comparer", sens: s, modele: `${modele}-${s}`, degre, enonce, avant, vers, trouve, termes, note,
      schema: () => ({deux}),
      image: [conv, `${mes(x, vers)} ${op} ${mes(y, vers)} = ${CASE}`],
      correction: r => [conv, `${mes(x, vers)} ${op} ${mes(y, vers)} = ${r}`]};
  }
  function perimetreQ2(degre, rng) {
    const [L, uL] = tireQ2(rng, ["m", 1, 4, 0.1]);
    const [l, ul] = tireQ2(rng, ["cm", 30, 95, 5]);
    // (Le côté en m a au plus une décimale, « 2,5 m » ; pas « 2,0 m ».)
    const vers = degre >= 3 ? "m" : "cm";
    const Lv = convertir(L, uL, vers);
    const lv = convertir(l, ul, vers);
    const conv = vers === "cm" ? `${mes(L, uL)} = ${mes(Lv, vers)}` : `${mes(l, ul)} = ${mes(lv, vers)}`;
    return {sorte: "perimetre", modele: "rectangle", degre, enonce: "Quel est le périmètre de ce rectangle ?", avant: "", vers, trouve: "",
      termes: [[L, uL, 2], [l, ul, 2]], figure: {type: "rectangle", longueur: mes(L, uL), largeur: mes(l, ul)},
      note: `Je fais le tour : ${conv}.`,
      schema: () => ({tout: `?${NB}${vers}`, parts: [mes(Lv, vers), mes(lv, vers), mes(Lv, vers), mes(lv, vers)], poids: [Number(Lv), Number(lv), Number(Lv), Number(lv)]}),
      image: [conv, `${mes(Lv, vers)} + ${mes(lv, vers)} + ${mes(Lv, vers)} + ${mes(lv, vers)} = ${CASE}`],
      correction: r => [conv, `2 × ${mes(Lv, vers)} + 2 × ${mes(lv, vers)} = ${r}`]};
  }
  function izmirQ2(degre, rng, {k = null, a0 = null, b0 = null, n10 = null, n20 = null} = {}) {
    const [modele, texte, avant, ga, gb] = IZMIR_Q2[k === null ? Math.floor(rng() * IZMIR_Q2.length) : k];
    const [a, ua] = a0 ? [a0, ga[0]] : tireQ2(rng, ga);
    const [b, ub] = b0 ? [b0, gb[0]] : tireQ2(rng, gb);
    const n1 = n10 || entre(rng, 2, 4);
    const n2 = n20 || entre(rng, 2, 3);
    const vers = degre >= 3 ? ub : versQ2(rng, degre, ub, ua);
    const P = choisir(rng, PRENOMS);
    const p1 = a * BigInt(n1);
    const p2 = b * BigInt(n2);
    if (!naturelleC8(p1, ua) || !naturelleC8(p2, ub)) return null;
    const p1v = convertir(p1, ua, vers);
    const p2v = convertir(p2, ub, vers);
    const enonce = remplirQ2(texte, {P, n1, n2, a: mes(a, ua), b: mes(b, ub)});
    // (Dans l'ordre du texte : les planches avant les tasseaux.)
    const bDabord = texte.indexOf("{b}") < texte.indexOf("{a}");
    let l1 = `${n1} × ${mes(a, ua)} = ${ecritQ2(p1, ua, vers)}`;
    let l2 = `${n2} × ${mes(b, ub)} = ${ecritQ2(p2, ub, vers)}`;
    let parts = [`${n1} × ${mes(a, ua)}`, `${n2} × ${mes(b, ub)}`];
    let poids = [Number(p1v), Number(p2v)];
    let calc = `${mes(p1v, vers)} + ${mes(p2v, vers)}`;
    if (bDabord) { [l1, l2] = [l2, l1]; parts = parts.reverse(); poids = poids.reverse(); calc = `${mes(p2v, vers)} + ${mes(p1v, vers)}`; }
    return {sorte: "izmir", modele, degre, enonce, avant, vers, trouve: "{M} en tout", termes: [[a, ua, n1], [b, ub, n2]],
      schema: () => ({tout: `?${NB}${vers}`, parts, poids}),
      image: [l1, l2],
      correction: r => [l1, l2, `${calc} = ${r}`]};
  }
  const TOTAUX_BALANCE = [1, 1, 1.5, 2];
  function balanceQ2(degre, rng, {n0 = null, p0 = null, T0 = null} = {}) {
    const n = n0 || entre(rng, 2, 4);
    const T = T0 !== null ? T0 : BigInt(Math.round(choisir(rng, TOTAUX_BALANCE) * 1000)) * MILLE;
    // (Quatre conserves : sans poids, le plateau n'a pas la place.)
    const p = p0 !== null ? p0 : n === 4 || rng() < 0.2 ? 0n : BigInt(entre(rng, 2, 10) * 50) * MILLE;
    const reste = T - p;
    if (reste <= 0n || reste % BigInt(n) !== 0n) return null;
    const boite = reste / BigInt(n);
    // (Une boîte de 100 g à 800 g, un nombre rond de 5 g.)
    if (boite < 100n * MILLE || boite > 800n * MILLE || boite % (5n * MILLE) !== 0n) return null;
    const Tkg = T / 1000n;
    const termes = p ? [[Tkg, "kg", 1], [p, "g", -1]] : [[Tkg, "kg", 1]];
    const conv = `${mes(Tkg, "kg")} = ${mes(T, "g")}`;
    const lignes = p ? [conv, `${mes(T, "g")} − ${mes(p, "g")} = ${mes(reste, "g")}`] : [conv];
    return {sorte: "balance", modele: `balance${n}`, degre, enonce: "Les conserves sont identiques. Quelle est la masse d'une conserve ?", avant: "", vers: "g", trouve: "{M} pour une conserve",
      termes, n, figure: {type: "balance", n, poids: p ? mes(p, "g") : "", total: mes(Tkg, "kg")},
      note: p ? `D'abord, j'enlève les ${mes(p, "g")}.` : `Je partage en ${n}.`,
      schema: () => ({tout: conv, parts: [...Array(n).fill("?"), ...(p ? [mes(p, "g")] : [])], poids: [...Array(n).fill(Number(boite)), ...(p ? [Number(p)] : [])]}),
      image: [...lignes, `${mes(reste, "g")} ÷ ${n} = ${CASE}`],
      correction: r => [...lignes, `${mes(reste, "g")} ÷ ${n} = ${r}`]};
  }
  function ensembleQ2(degre, rng) {
    const [modele, texte, avant, ga, gb] = choisir(rng, ENSEMBLE_Q2);
    const [A, ua] = tireQ2(rng, ga);
    const [B, ub] = tireQ2(rng, gb);
    const vers = degre >= 3 ? (rng() < 0.6 ? ua : ub) : ub;
    const [P, Q] = deuxPrenomsQ2(rng);
    const Av = convertir(A, ua, vers);
    const Bv = convertir(B, ub, vers);
    const Qv = Av + Bv;
    if (!naturelleC8(Qv, vers)) return null;
    const enonce = remplirQ2(texte, {P, Q, dP: deQ2(P), dQ: deQ2(Q), A: mes(A, ua), B: mes(B, ub)});
    const conv = ua === vers ? `${mes(B, ub)} = ${mes(Bv, vers)}` : `${mes(A, ua)} = ${mes(Av, vers)}`;
    const l1 = `${Q} : ${mes(Av, vers)} + ${mes(Bv, vers)} = ${mes(Qv, vers)}`;
    return {sorte: "deux", modele, degre, enonce, avant, vers, trouve: "{M} pour les deux", termes: [[A, ua, 2], [B, ub, 1]],
      note: ub !== vers ? `J'écris tout en ${vers} : ${mes(B, ub)} = ${mes(Bv, vers)}.` : "Puis j'ajoute les deux barres.",
      schema: () => ({deux: {haut: [Q, ""], bas: [P, ecritQ2(A, ua, vers)], ecart: mes(B, ub), total: `Ensemble : ?${NB}${vers}`, provisoire: mes(Qv, vers)}}),
      image: [conv, l1, `${mes(Av, vers)} + ${mes(Qv, vers)} = ${CASE}`],
      correction: r => [conv, l1, `${mes(Av, vers)} + ${mes(Qv, vers)} = ${r}`]};
  }
  function resteQ2(degre, rng) {
    const [modele, texte, avant, ga, gb, gc] = choisir(rng, RESTE_Q2);
    const [A, ua] = tireQ2(rng, ga);
    const [B, ub] = tireQ2(rng, gb);
    const [C, uc] = tireQ2(rng, gc);
    if (ub === uc && B === C) return null;
    // (Une seule mesure à convertir : le ruban en cm, le sentier en km.)
    const vers = modele === "ruban3" ? "cm" : "km";
    const P = choisir(rng, PRENOMS);
    const [Av, Bv, Cv] = [convertir(A, ua, vers), convertir(B, ub, vers), convertir(C, uc, vers)];
    const enonce = remplirQ2(texte, {P, A: mes(A, ua), B: mes(B, ub), C: mes(C, uc)});
    const convs = [[A, ua], [B, ub], [C, uc]].filter(([, u]) => u !== vers).map(([m, u]) => `${mes(m, u)} = ${mes(convertir(m, u, vers), vers)}`);
    return {sorte: "deux", modele, degre, enonce, avant, vers, trouve: "qu'il reste {M}", termes: [[A, ua, 1], [B, ub, -1], [C, uc, -1]],
      schema: () => ({tout: ecritQ2(A, ua, vers), parts: [mes(Bv, vers), mes(Cv, vers), `?${NB}${vers}`], poids: [Number(Bv), Number(Cv), Number(Av - Bv - Cv)]}),
      image: [convs.join(" ; "), `${mes(Av, vers)} − ${mes(Bv, vers)} − ${mes(Cv, vers)} = ${CASE}`],
      correction: r => [convs.join(" ; "), `${mes(Av, vers)} − ${mes(Bv, vers)} − ${mes(Cv, vers)} = ${r}`]};
  }

  // Les erreurs de Q2 au pavé (une ligne au petit téléphone, 31 caractères
  // au plus) : sans convertir ; une conversion fausse d'un zéro ; l'autre
  // opération ; le périmètre à deux côtés ; un seul objet de chaque ;
  // la balance sans enlever le poids, ou sans partager ; une seule étape ;
  // le résultat dans l'autre unité ; la virgule.
  function erreursQ2(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "q2" || typeof lu !== "bigint") return null;
    const termes = d.termes.map(([m, u, k]) => [milli(m), u, k]);
    const rep = milli(question.reponse);
    const somme = (f, liste = termes) => liste.reduce((s, [m, u, k]) => s + BigInt(f(k)) * convertir(m, u, d.vers), 0n);
    const n = BigInt(d.n || 1);
    // Sans convertir : les nombres tels qu'ils sont écrits.
    const brutSomme = termes.reduce((s, [m, , k]) => s + BigInt(k) * m, 0n);
    if (termes.some(([, u]) => u !== d.vers) && (lu === brutSomme / n || lu * n === brutSomme)) return {erreur: 5, retour: `J'écris d'abord tout en ${d.vers}.`};
    const s = d.sorte;
    if (s === "perimetre" && lu === somme(() => 1)) return {erreur: 10, retour: "Le tour a quatre côtés."};
    if (s === "izmir" && lu === somme(() => 1)) return {erreur: 10, retour: "Je compte chaque objet."};
    if (s === "balance") {
      const T = convertir(termes[0][0], termes[0][1], d.vers);
      if (termes.length > 1 && lu * n === T) return {erreur: 10, retour: `J'enlève d'abord les ${mes(termes[1][0], "g")}.`};
      if (lu === rep * n) return {erreur: 10, retour: `C'est la masse de ${n} conserves.`};
    }
    if (s === "deux" && termes.length === 2 && lu === somme(k => (k === 2 ? 1 : k))) return {erreur: 10, retour: "On cherche les deux ensemble."};
    if (s === "deux" && termes.length === 3) {
      for (const j of [1, 2]) if (lu === somme((k) => k, termes.filter((_, i) => i !== j))) return {erreur: 10, retour: "J'enlève les deux longueurs."};
    }
    // L'autre opération : A + B au lieu de A − B, ou l'inverse.
    if (termes.length === 2 && ["reunir", "partie", "comparer"].includes(s)) {
      const a = convertir(termes[0][0], termes[0][1], d.vers);
      const b = convertir(termes[1][0], termes[1][1], d.vers);
      const inverse = termes[1][2] > 0 ? a - b : a + b;
      if (lu === inverse || (s === "reunir" && lu === -inverse)) {
        const retour = s === "reunir" ? "On cherche le tout : j'ajoute." : s === "partie" ? "Une partie : j'enlève." : d.sens === "ecart" ? "L'écart : j'enlève." : "Relis : qui a le plus ?";
        return {erreur: 7, retour};
      }
    }
    // Une conversion fausse d'un zéro (× 10 ou ÷ 10 sur la mesure convertie).
    for (let j = 0; j < termes.length; j += 1) {
      const [m, u, k] = termes[j];
      if (u === d.vers) continue;
      const c = convertir(m, u, d.vers);
      for (const faux of [c * 10n, c % 10n === 0n ? c / 10n : null]) {
        if (faux === null) continue;
        const tot = somme(kk => kk) - BigInt(k) * c + BigInt(k) * faux;
        if (tot > 0n && tot % n === 0n && lu === tot / n) return {erreur: 6, retour: `${mes(m, u)}, c'est ${mes(c, d.vers)}.`};
      }
    }
    const autreU = termes.map(([, u]) => u).find(u => u !== d.vers);
    const dansAutre = autreU ? convertir(rep, d.vers, autreU) : null;
    if (dansAutre !== null && lu === dansAutre) return {erreur: 8, retour: `${ecrire(lu)}, ce serait des ${autreU}.`};
    if (lu === rep * 10n || lu * 10n === rep) {
      if (rep % MILLE || lu % MILLE) return {erreur: 9, retour: "La virgule est mal placée."};
      return {erreur: 9, retour: lu > rep ? "Un zéro de trop." : "Un zéro de moins."};
    }
    return null;
  }

  // Les places : « Est-ce vraisemblable ? » aux places 4 et 8 de Je valide
  // (un Oui, un Non), 4, 9, 14, 19, 24 d'À toi (comme Q1) ; une sorte
  // nouvelle à chaque degré.
  const PLACES_Q2 = {
    valide: ["partie", "reunir", "partie", "V", "comparer", "perimetre", "comparer", "V", "balance|izmir", "deux"],
    entraine: ["reunir", "partie", "reunir", "V", "partie", "reunir",
      "comparer", "perimetre", "V", "comparer", "reunir", "partie", "comparer", "V", "perimetre",
      "izmir", "comparer", "balance", "V", "deux", "perimetre", "izmir", "balance", "V", "deux"],
    test: ["comparer", "balance|izmir", "deux", "partie"],
    aide: ["reunir", "comparer", "partie"],
    retour: ["comparer|partie|V", "perimetre|reunir"],
    echauffement: ["comparer|partie|reunir"]
  };
  function formesQ2(usage, rng) {
    const p = PLACES_Q2[usage];
    const f = {};
    if (!p) return f;
    const [x, y] = rng() < 0.5 ? ["vrai-oui", "vrai-non"] : ["vrai-non", "vrai-oui"];
    let v = 0;
    p.forEach((s, i) => {
      const t = choisir(rng, s.split("|"));
      if (t === "V") { f[i] = usage === "valide" ? [x, y][v] : rng() < 0.5 ? "vrai-oui" : "vrai-non"; v += 1; } else f[i] = t;
    });
    return f;
  }
  // Une question d'une sorte (essais jusqu'à une question qui s'écrit).
  function tirerQ2(rng, degre, forme) {
    const vrai = forme && forme.startsWith("vrai") ? forme.slice(5) : null;
    const sorte = vrai ? choisir(rng, ["reunir", "partie", "comparer", "comparer"]) : forme || choisir(rng, ["reunir", "partie", "comparer"]);
    for (let essai = 0; essai < 40; essai += 1) {
      let spec = null;
      if (sorte === "reunir") spec = reunirQ2(degre, rng);
      else if (sorte === "partie") spec = partieQ2(degre, rng);
      else if (sorte === "comparer") spec = comparerQ2(degre, rng, vrai ? {sens: choisir(rng, ["moins", "plus"])} : {});
      else if (sorte === "perimetre") spec = perimetreQ2(degre, rng);
      else if (sorte === "izmir") spec = izmirQ2(degre, rng);
      else if (sorte === "balance") spec = balanceQ2(degre, rng);
      else if (sorte === "deux") spec = rng() < 0.5 ? ensembleQ2(degre, rng) : resteQ2(degre, rng);
      const x = spec && finirQ2(spec, rng, vrai);
      if (x) return x;
    }
    return null;
  }
  ETAPES.Q2 = {
    // On te montre : le pot de confiture (1,2 kg, 350 g) ; Alix et Bruno
    // (1,61 m, 13 cm) ; Izmir (3 pains de 210 g, 2 bouteilles de 1,6 kg).
    clesExemples: [cleQ2("pot", [[1200n, "kg", 1], [350000n, "g", -1]], 1), cleQ2("taille-moins", [[1610n, "m", 1], [13000n, "cm", -1]], 1),
      cleQ2("pains", [[210000n, "g", 3], [1600n, "kg", 2]], 1)],
    tirer(rng, degre, i, usage, forme) {
      return tirerQ2(rng, degre, forme);
    },
    formes: formesQ2,
    // (Dans Je valide : un même contexte une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      return !serie.some(x => x.modeleQ2.split("-")[0] === question.modeleQ2.split("-")[0]);
    },
    erreurs: erreursQ2
  };

  // ======================= lot B2-3b-2 : Q10 « Durées et horaires » (CM1)
  // Programme de CM1 (S002 p. 17-18) : des problèmes en une ou deux étapes
  // avec des durées ; des horaires de transport et de marées ; l'axe du
  // temps orienté avec des arcs et des instants intermédiaires ; « aucun
  // algorithme posé en base soixante ». Les deux exemples officiels : Ismaël
  // (de 7 h 47 à 8 h 16), Lucie (1 h 17 min, arrivée à 12 h 10), le train
  // (7 h 43, 1 h 34 min, puis 52 min). Toutes les minutes (pas seulement de
  // 5 en 5 comme « Entre deux heures » au palier 1).
  // Choix de Gwenaël sur la maquette (21/11, 2 h 45) : l'axe à arcs du
  // document officiel, l'heure pile en gris quand elle a la place ;
  // l'horaire du Car Jaune en tableau (les écarts de la ligne O2) ; les
  // quatre marées du jour à Saint-Gilles (des écarts de 5 h 20 à 7 h, comme
  // les vraies) ; la correction : l'axe refait en vert, par l'heure pile.
  // Les instants sont des minutes depuis minuit ; jamais une heure pile
  // (la réponse a toujours ses minutes).
  const pileApres = t => Math.ceil(t / 60) * 60;
  const pileAvant = t => Math.floor(t / 60) * 60;
  // Les bonds par l'heure pile, de a à b : [a, (heure pile), (heure pile), b].
  function bondsQ10(a, b) {
    const p = [a];
    if (pileApres(a) < b && pileApres(a) > a) p.push(pileApres(a));
    if (pileAvant(b) > p[p.length - 1] && pileAvant(b) < b) p.push(pileAvant(b));
    p.push(b);
    return p;
  }
  // Une durée sur un arc : « 13 min », « 2 h », « 1 h 34 min ».
  const arcQ10 = d => (d % 60 === 0 ? `${d / 60}${NB}h` : dureeTexte(d));

  // Trouver une durée : [modèle, énoncé ({P}, {D}, {A}), durée min, max,
  // début au plus tôt, au plus tard].
  const DUREE_Q10 = [
    ["ecole", "{P} part de la maison à {D} et arrive à l'école à {A}. Combien de temps dure le trajet ?", 12, 50, 395, 455],
    ["recre", "La récréation commence à {D} et finit à {A}. Combien de temps dure la récréation ?", 12, 25, 580, 620],
    ["vol", "L'avion décolle de La Réunion à {D} et atterrit à Maurice à {A}.", 40, 50, 360, 1170],
    ["piscine", "La séance de piscine commence à {D} et finit à {A}. Combien de temps dure la séance ?", 40, 75, 480, 960],
    ["cari", "Le cari cuit de {D} à {A}. Combien de temps dure la cuisson ?", 45, 90, 600, 1110],
    ["film", "Le film commence à {D} et finit à {A}. Combien de temps dure le film ?", 85, 150, 810, 1250],
    ["match", "Le match de basket commence à {D} et finit à {A}. Combien de temps dure le match ?", 70, 110, 840, 1140],
    ["piton", "{P} part du gîte à {D} et arrive au sommet du Piton des Neiges à {A}.", 85, 130, 180, 270]
  ];
  // Trouver l'heure d'arrivée : [modèle, énoncé ({P}, {D}, {d}), la case,
  // durée min, max, début au plus tôt, au plus tard].
  const ARRIVEE_Q10 = [
    ["ecole", "{P} part de la maison à {D}. Le trajet jusqu'à l'école dure {d}. À quelle heure arrive {P} ?", "Arrivée :", 12, 45, 395, 455],
    ["vol", "L'avion décolle de La Réunion à {D}. Le vol jusqu'à Maurice dure {d}.", "Arrivée :", 40, 50, 360, 1170],
    ["gateau", "Le gâteau entre dans le four à {D}. La cuisson dure {d}. À quelle heure sort le gâteau ?", "Sortie :", 25, 55, 540, 1080],
    ["recre", "La récréation commence à {D} et dure {d}. À quelle heure finit la récréation ?", "Fin :", 12, 25, 580, 620],
    ["piscine", "La séance de piscine commence à {D} et dure {d}. À quelle heure finit la séance ?", "Fin :", 40, 75, 480, 960],
    ["film", "Le film commence à {D} et dure {d}. À quelle heure finit le film ?", "Fin :", 85, 150, 810, 1250],
    ["match", "Le match commence à {D} et dure {d}. À quelle heure finit le match ?", "Fin :", 70, 110, 840, 1140],
    ["route", "{P} part de Saint‑Denis en voiture à {D}. Le trajet jusqu'à Saint‑Pierre dure {d}.", "Arrivée :", 65, 100, 360, 1080],
    ["piton", "{P} part du gîte à {D} et monte {d} jusqu'au sommet du Piton des Neiges.", "Arrivée :", 85, 130, 180, 270],
    ["cari", "Le cari commence à cuire à {D}. La cuisson dure {d}. À quelle heure finit la cuisson ?", "Fin :", 45, 90, 600, 1110],
    ["velo", "{P} part à {D} pour une étape de course à vélo, qui dure {d}.", "Arrivée :", 65, 110, 540, 840]
  ];
  // Trouver l'heure de départ : [modèle, énoncé ({P}, {A}, {d}), la case,
  // durée min, max, fin au plus tôt, au plus tard].
  const DEPART_Q10 = [
    ["ecole", "{P} arrive à l'école à {A}, après {d} de trajet. À quelle heure part {P} de la maison ?", "Départ :", 12, 45, 425, 475],
    ["vol", "L'avion atterrit à Maurice à {A}, après {d} de vol depuis La Réunion.", "Décollage :", 40, 50, 400, 1210],
    ["film", "Le film finit à {A}. Le film dure {d}. À quelle heure commence le film ?", "Début :", 85, 150, 900, 1380],
    ["recre", "La récréation finit à {A} et dure {d}. À quelle heure commence la récréation ?", "Début :", 12, 25, 605, 640],
    ["piscine", "La séance de piscine finit à {A} et dure {d}. À quelle heure commence la séance ?", "Début :", 40, 75, 540, 1020],
    ["cari", "Le cari est cuit à {A}, après {d} de cuisson. À quelle heure commence la cuisson ?", "Début :", 45, 90, 660, 1170],
    ["velo", "{P} met {d} pour une étape de course à vélo et passe la ligne d'arrivée à {A}.", "Départ :", 65, 110, 600, 900],
    ["car", "Le Car Jaune arrive à Saint‑Denis à {A}. Le trajet depuis Saint‑Pierre dure {d}.", "Départ :", 75, 125, 420, 1140]
  ];
  // Deux étapes : [modèle, énoncé ({P}, {D}, {d1}, {d2}), la case, d1 min,
  // max, d2 min, max, départ au plus tôt, au plus tard, les deux instants
  // sous l'axe].
  const DEUX_Q10 = [
    ["train", "Le train part à {D} : {d1} jusqu'à la 1re gare, puis {d2} jusqu'à la 2e gare.", "Arrivée :", 65, 110, 30, 59, 360, 960, ["1re gare", "2e gare"]],
    ["cinema", "La séance commence à {D} : {d1} de publicités, puis un film de {d2}. À quelle heure finit le film ?", "Fin :", 10, 20, 85, 140, 810, 1220, ["le film", "la fin"]],
    ["plage", "{P} prend le Car Jaune à {D} : {d1} de trajet, puis {d2} à pied jusqu'à la plage.", "Arrivée :", 20, 55, 10, 25, 420, 900, ["descente", "plage"]]
  ];
  // Le Car Jaune, ligne O2 (Saint-Pierre - Saint-Denis par le littoral) :
  // les minutes depuis la gare de Saint-Pierre, d'après la fiche horaire.
  // (Le trait d'union insécable : « St‑Pierre » ne se coupe pas.)
  const O2 = [["St‑Pierre", 0], ["St‑Louis", 10], ["St‑Leu", 37], ["St‑Gilles", 53], ["St‑Paul", 70], ["Le Port", 82], ["St‑Denis", 103]];

  // L'instant tiré : jamais une heure pile.
  const instantQ10 = (rng, a, b) => {
    for (let k = 0; k < 30; k += 1) { const t = entre(rng, a, b); if (t % 60) return t; }
    return null;
  };
  // Les durées d'un degré. Degré 1 : moins d'une heure, en passant une
  // heure pile ; degrés 2 et 3 : plus d'une heure, avec des minutes.
  const dureeOk = (degre, d) => (degre === 1 ? d < 60 : d > 60 && d % 60 !== 0);

  // La question finie. spec : {sorte, modele, degre, enonce, avant,
  // cherche (duree, arrivee, depart), dep, arr, mid (deux étapes), support,
  // sous (les noms sous l'axe)}.
  function finirQ10(spec) {
    const {sorte, modele, degre, enonce, cherche, dep, arr} = spec;
    const d = arr - dep;
    if (d <= 0 || dep % 60 === 0 || arr % 60 === 0 || (spec.mid && spec.mid % 60 === 0) || arr >= 24 * 60) return null;
    // On passe toujours une heure pile (sinon, ce n'est qu'une soustraction).
    if (pileAvant(arr) === pileAvant(dep)) return null;
    // (Une durée a toujours ses minutes : pas « 1 h » tout rond.)
    if (cherche === "duree" && d % 60 === 0) return null;
    const sous = spec.sous || [];
    const deux = sorte === "deux";
    let reponse;
    let reponseTexte;
    let cases = null;
    let apres = "";
    let unite;
    if (cherche === "duree") {
      reponseTexte = dureeTexte(d);
      if (d < 60) { reponse = String(d); apres = "min"; } else { reponse = [String(Math.floor(d / 60)), String(d % 60)]; cases = ["h", "min"]; }
      unite = "min";
    } else {
      const t = cherche === "arrivee" ? arr : dep;
      reponse = [String(Math.floor(t / 60)), String(t % 60)];
      cases = ["h", ""];
      reponseTexte = heureTexte(t);
      unite = "h";
    }
    // L'outil : l'axe du temps, comme dans le document officiel ; l'heure
    // pile en gris (choix de Gwenaël du 21/11).
    let arcs;
    let arcsCorr;
    let lignes;
    if (deux) {
      const mid = spec.mid;
      arcs = {instants: [{t: dep}, {t: mid, vide: true, sous: sous[0]}, {t: arr, cache: true, sous: sous[1]}],
        arcs: [{de: 0, a: 1, texte: arcQ10(mid - dep)}, {de: 1, a: 2, texte: arcQ10(arr - mid)}], piles: true};
      // La correction : les deux instants trouvés, en vert.
      arcsCorr = {instants: [{t: dep}, {t: mid, vert: true, sous: sous[0]}, {t: arr, vert: true, sous: sous[1]}],
        arcs: [{de: 0, a: 1, texte: arcQ10(mid - dep)}, {de: 1, a: 2, texte: arcQ10(arr - mid)}]};
      lignes = [`${heureTexte(dep)} + ${dureeTexte(mid - dep)} = ${heureTexte(mid)}`, `${heureTexte(mid)} + ${dureeTexte(arr - mid)} = ${heureTexte(arr)}`];
    } else {
      arcs = {instants: [{t: dep, cache: cherche === "depart", sous: sous[0]}, {t: arr, cache: cherche === "arrivee", sous: sous[1]}],
        arcs: [{de: 0, a: 1, texte: cherche === "duree" ? "?" : arcQ10(d)}], piles: true};
      // La correction : les bonds par l'heure pile, en vert ; la réponse en
      // vert sur l'axe.
      const p = bondsQ10(dep, arr);
      arcsCorr = {instants: p.map((t, k) => ({t, vert: (cherche === "arrivee" && k === p.length - 1) || (cherche === "depart" && k === 0),
        sous: k === 0 ? sous[0] : k === p.length - 1 ? sous[1] : undefined})),
      arcs: p.slice(1).map((t, k) => ({de: k, a: k + 1, texte: arcQ10(t - p[k]), vert: true}))};
      const somme = p.slice(1).map((t, k) => arcQ10(t - p[k])).join(" + ");
      lignes = cherche === "duree" ? [p.length > 2 ? `${somme} = ${reponseTexte}` : `De ${heureTexte(dep)} à ${heureTexte(arr)} : ${reponseTexte}`]
        : cherche === "arrivee" ? [`${heureTexte(dep)} + ${dureeTexte(d)} = ${reponseTexte}`] : [`${heureTexte(arr)} − ${dureeTexte(d)} = ${reponseTexte}`];
    }
    // L'image : le premier bond (jusqu'à l'heure pile, ou la première étape).
    let bond;
    if (deux) bond = `D'abord : ${heureTexte(dep)} + ${dureeTexte(spec.mid - dep)} = ${CASE}`;
    else if (cherche === "depart") bond = `${heureTexte(arr)} − ${arr % 60}${NB}min = ${heureTexte(pileAvant(arr))}`;
    else if (cherche === "arrivee") bond = `${heureTexte(dep)} + ${pileApres(dep) - dep}${NB}min = ${heureTexte(pileApres(dep))}`;
    else bond = `De ${heureTexte(dep)} à ${heureTexte(pileApres(dep))} : ${pileApres(dep) - dep}${NB}min`;
    // (La ligne des cases plus petite, `long`, et l'énoncé serré, `serre`,
    // comme Q2 : l'énoncé, le tableau et les deux cases tiennent au petit
    // iPhone.)
    const morceaux = cases ? {enonce, avant: spec.avant, cases, serre: true, long: true} : {enonce, avant: spec.avant, apres, serre: true, long: true};
    if (spec.support) morceaux.support = spec.support;
    const texteCases = cases ? `${CASE}${NB}h ${CASE}${cases[1] ? `${NB}min` : ""}` : `${CASE}${NB}${apres}`;
    const cle = `Q10:${modele}:${cherche}:${dep}-${spec.mid || ""}-${arr}`;
    return q({
      code: "Q10", degre, forme: cases ? "deux-cases" : "nombre",
      texte: `${enonce} ${spec.avant} ${texteCases}`, morceaux,
      reponse, reponseTexte, unite, resume: `${spec.avant} ${reponseTexte}`, resumeVert: lignes[lignes.length - 1],
      outil: "axe-arcs", grandeur: "duree", arcs, arcsCorr, repTexteQ10: reponseTexte, noteOutil: "Je passe par l'heure pile.",
      relation: `1${NB}h = 60${NB}min`, image: [`1${NB}h = 60${NB}min`, bond], correction: lignes,
      sorteQ10: sorte, modeleQ10: modele,
      donnees: Object.assign({type: "q10", sorte, cherche, depart: dep, arrivee: arr}, spec.mid ? {milieu: spec.mid} : {},
        spec.support ? {support: spec.support} : {}),
      cle, cleBase: cle
    });
  }

  // ---------------------------------------------------- les sortes de Q10
  // Une étape : la durée, l'heure d'arrivée, l'heure de départ.
  function uneEtapeQ10(degre, rng, cherche) {
    const liste = cherche === "duree" ? DUREE_Q10 : cherche === "arrivee" ? ARRIVEE_Q10 : DEPART_Q10;
    const c = choisir(rng, liste.filter(x => {
      const [dMin, dMax] = cherche === "duree" ? x.slice(2, 4) : x.slice(3, 5);
      return degre === 1 ? dMin < 60 : dMax > 61;
    }));
    const [modele, texte] = c;
    const [dMin, dMax, tMin, tMax] = cherche === "duree" ? c.slice(2, 6) : c.slice(3, 7);
    const avant = cherche === "duree" ? "Durée :" : c[2];
    const d = entre(rng, Math.max(dMin, degre === 1 ? 1 : 61), Math.min(dMax, degre === 1 ? 59 : 999));
    if (!dureeOk(degre, d)) return null;
    // (Pour l'heure de départ, la fin est tirée dans ses bornes.)
    let t0 = instantQ10(rng, tMin, tMax);
    if (t0 === null) return null;
    // (Degré 3 : les minutes débordent ; les minutes du départ, ou de la fin
    // pour l'heure de départ, sont tirées pour cela.)
    if (degre === 3 && d % 60 >= 2) {
      t0 = pileAvant(t0) + (cherche === "depart" ? entre(rng, 1, (d % 60) - 1) : entre(rng, 61 - (d % 60), 59));
      if (t0 < tMin || t0 > tMax) return null;
    }
    const [dep, arr] = cherche === "depart" ? [t0 - d, t0] : [t0, t0 + d];
    // Degré 3 : les minutes débordent (7 h 43 + 1 h 34 min), ou il faut
    // reculer au-delà de l'heure pile (12 h 10 − 1 h 17 min).
    if (degre === 3 && cherche === "arrivee" && (dep % 60) + (d % 60) <= 60) return null;
    if (degre === 3 && cherche === "depart" && (arr % 60) >= (d % 60)) return null;
    if (degre === 3 && cherche === "duree" && (arr % 60) >= (dep % 60)) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, D: heureTexte(dep), A: heureTexte(arr), d: dureeTexte(d)});
    return finirQ10({sorte: cherche, modele, degre, enonce, avant, cherche, dep, arr});
  }
  // Deux étapes (le train du document officiel, la séance de cinéma, le
  // Car Jaune puis la plage).
  function deuxEtapesQ10(degre, rng) {
    const [modele, texte, avant, a1, b1, a2, b2, tMin, tMax, sous] = choisir(rng, DEUX_Q10);
    const d1 = entre(rng, a1, b1);
    const d2 = entre(rng, a2, b2);
    const dep = instantQ10(rng, tMin, tMax);
    if (dep === null || d1 % 60 === 0 || d2 % 60 === 0) return null;
    const mid = dep + d1;
    const arr = mid + d2;
    // (Une des deux étapes au moins passe une heure pile.)
    if (pileAvant(mid) === pileAvant(dep) && pileAvant(arr) === pileAvant(mid)) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, D: heureTexte(dep), d1: dureeTexte(d1), d2: dureeTexte(d2)});
    return finirQ10({sorte: "deux", modele, degre, enonce, avant, cherche: "arrivee", dep, arr, mid, sous});
  }
  // L'horaire du Car Jaune : quatre arrêts de la ligne O2,
  // dans un sens ou dans l'autre ; la durée entre deux d'entre eux.
  function carQ10(degre, rng) {
    const nord = rng() < 0.5;
    const ligne = nord ? O2 : O2.slice().reverse().map(([n, m]) => [n, 103 - m]);
    // (Quatre arrêts de la ligne, dans l'ordre, comme un extrait de la fiche
    // horaire : jusqu'à 1 h 43 min de trajet.)
    const ks = melanger(rng, [0, 1, 2, 3, 4, 5, 6]).slice(0, 4).sort((x, y) => x - y);
    const depart = entre(rng, 330, 1050);
    const arrets = ks.map(k => [ligne[k][0], depart + ligne[k][1] - ligne[ks[0]][1]]);
    const paires = [];
    for (let a = 0; a < 4; a += 1) for (let b = a + 1; b < 4; b += 1) paires.push([a, b]);
    // (Les paires qui conviennent : on passe une heure pile, jamais une
    // heure pile au bout, des minutes à la durée ; plus d'une heure au
    // degré 3.)
    const bonnes = paires.filter(([x, y]) => {
      const [u, v] = [arrets[x][1], arrets[y][1]];
      return u % 60 && v % 60 && pileAvant(v) > pileAvant(u) && (v - u) % 60 && (degre === 3 ? v - u > 60 : true);
    });
    if (!bonnes.length) return null;
    const [a, b] = choisir(rng, bonnes);
    const [dep, arr] = [arrets[a][1], arrets[b][1]];
    if (arr - dep > 60 && (arr - dep) % 60 === 0) return null;
    // (« Du Port à St‑Denis », « de St‑Leu au Port ».)
    const de = n => (n === "Le Port" ? "du Port" : `de ${n}`);
    const a2 = n => (n === "Le Port" ? "au Port" : `à ${n}`);
    const De = de(arrets[a][0]);
    const enonce = `En Car Jaune, ${De} ${a2(arrets[b][0])} :`;
    return finirQ10({sorte: "car", modele: `car-${nord ? "n" : "s"}`, degre, enonce, avant: "Durée :", cherche: "duree", dep, arr,
      sous: [arrets[a][0], arrets[b][0]], support: {type: "car", arrets}});
  }
  // Les marées de Saint-Gilles : quatre marées dans la journée, basse et
  // haute l'une après l'autre, de 5 h 20 à 7 h d'écart.
  function mareeQ10(degre, rng) {
    let t = entre(rng, 30, 210);
    const basse0 = rng() < 0.5;
    const liste = [];
    for (let k = 0; k < 4; k += 1) {
      liste.push([(k % 2 === 0) === basse0 ? "basse" : "haute", t]);
      t += entre(rng, 320, 420);
    }
    if (liste[3][1] >= 24 * 60 - 5 || liste.some(([, x]) => x % 60 === 0)) return null;
    // (Chaque marée se nomme par son rang : « de la 1re marée haute à la
    // 2e basse ».)
    const k = entre(rng, 0, 2);
    const rang = j => (liste.slice(0, j + 1).filter(([x]) => x === liste[j][0]).length === 1 ? "1re" : "2e");
    const [dep, arr] = [liste[k][1], liste[k + 1][1]];
    // (Une ligne au petit téléphone : le tableau dit « Marées à Saint‑Gilles ».)
    const enonce = `De la ${rang(k)} marée ${liste[k][0]} à la ${rang(k + 1)} ${liste[k + 1][0]} :`;
    return finirQ10({sorte: "maree", modele: "maree", degre, enonce, avant: "Durée :", cherche: "duree", dep, arr,
      sous: [liste[k][0], liste[k + 1][0]], support: {type: "maree", liste}});
  }

  // Au choix (les pièges de la base 100, comme D7) : l'heure d'arrivée
  // d'une ou de deux étapes, où les minutes débordent.
  function choixQ10(x, rng) {
    if (!x || x.donnees.cherche !== "arrivee") return null;
    const d = x.donnees;
    const dep = d.depart;
    const arr = d.arrivee;
    const etapes = d.milieu ? [d.milieu - dep, arr - d.milieu] : [arr - dep];
    const mm = (dep % 60) + etapes.reduce((s, e) => s + (e % 60), 0);
    const hh = Math.floor(dep / 60) + etapes.reduce((s, e) => s + Math.floor(e / 60), 0);
    if (mm < 60 || mm >= 100) return null;
    const brutH = (h, m) => `${h}${NB}h${NB}${String(m).padStart(2, "0")}`;
    const bonne = heureTexte(arr);
    const piege = brutH(hh, mm);
    const autres = [heureTexte(arr + 60), heureTexte(arr - 60)].filter(t => t !== bonne && t !== piege);
    const faux = d.milieu ? [heureTexte(d.milieu), ...autres] : autres;
    const choix = melanger(rng, [bonne, piege, choisir(rng, faux)]);
    const pourquoi = {};
    choix.forEach((c, i) => {
      if (c === piege) pourquoi[i] = `${mm}${NB}min = ${dureeTexte(mm)}.`;
      else if (d.milieu && c === heureTexte(d.milieu)) pourquoi[i] = "Ajoute aussi la 2e étape.";
      else if (c !== bonne) pourquoi[i] = "Compte bien les heures.";
    });
    const consigne = `${x.morceaux.avant.replace(/ :$/, "")}${NB}?`;
    return Object.assign(x, {
      forme: "qcm", texte: `${x.morceaux.enonce} ${consigne}`, morceaux: {enonce: x.morceaux.enonce, consigne, serre: true, sorte: "heure"},
      choix, bon: choix.indexOf(bonne), pourquoi, cle: `${x.cle}:q`, cleBase: x.cleBase
    });
  }

  // Les erreurs de Q10 au pavé (une ligne au petit téléphone, 31 caractères
  // au plus) : la base 100 (« 69 min », « 8 h 77 »), une heure de trop ou
  // de moins, l'autre sens (ajouter au lieu de reculer), une seule étape.
  function erreursQ10(question, lu, lus) {
    const d = question.donnees;
    if (!d || d.type !== "q10") return null;
    const v = lus ? lus.map(x => Number(x / MILLE)) : [Number(lu / MILLE)];
    const t = v.length === 2 ? v[0] * 60 + v[1] : v[0];
    const cent = x => Math.floor(x / 60) * 100 + (x % 60);
    const dep = d.depart;
    const arr = d.arrivee;
    const duree = arr - dep;
    const ecrit = (h, m) => v.length === 2 && v[0] === h && v[1] === m;
    if (d.cherche === "duree") {
      const c = cent(arr) - cent(dep);
      if ((v.length === 1 && v[0] === c) || ecrit(Math.floor(c / 100), c % 100)) return {erreur: 1, retour: `1${NB}h = 60${NB}min, pas 100${NB}min.`};
      if (v.length === 2 && v[1] < 60 && Math.abs(t - duree) === 60) return {erreur: 2, retour: "Compte bien les heures."};
      return null;
    }
    if (v.length !== 2) return null;
    if (d.cherche === "arrivee") {
      const etapes = d.milieu ? [d.milieu - dep, arr - d.milieu] : [duree];
      const mm = (dep % 60) + etapes.reduce((s, e) => s + (e % 60), 0);
      const hh = Math.floor(dep / 60) + etapes.reduce((s, e) => s + Math.floor(e / 60), 0);
      if (mm >= 60 && ecrit(hh, mm)) return {erreur: 3, retour: `${mm}${NB}min = ${dureeTexte(mm)}.`};
      if (d.milieu && v[1] < 60 && t === d.milieu) return {erreur: 4, retour: "Ajoute aussi la 2e étape."};
      if (d.milieu && v[1] < 60 && t === dep + (arr - d.milieu)) return {erreur: 4, retour: "Ajoute aussi la 1re étape."};
      if (!d.milieu && v[1] < 60 && t === dep - duree) return {erreur: 5, retour: "On cherche l'heure d'arrivée."};
    } else {
      const c = cent(arr) - (Math.floor(duree / 60) * 100 + (duree % 60));
      if ((arr % 60) < (duree % 60) && ecrit(Math.floor(c / 100), c % 100)) return {erreur: 1, retour: `1${NB}h = 60${NB}min, pas 100${NB}min.`};
      if (v[1] < 60 && t === arr + duree) return {erreur: 5, retour: "On cherche l'heure de départ."};
    }
    if (v[1] < 60 && Math.abs(t - (d.cherche === "arrivee" ? arr : dep)) === 60) return {erreur: 2, retour: "Compte bien les heures."};
    return null;
  }

  // Les places : la durée, l'arrivée, le départ d'abord ; le Car Jaune et
  // les marées ensuite ; les deux étapes et le piège au choix à la fin.
  const PLACES_Q10 = {
    valide: ["duree", "arrivee", "depart", "car", "depart", "maree", "duree", "deux", "choix", "arrivee"],
    entraine: ["duree", "arrivee", "duree", "depart", "arrivee", "duree",
      "duree", "car", "arrivee", "depart", "maree", "duree", "car", "depart", "arrivee",
      "deux", "car", "maree", "choix", "deux", "depart", "maree", "deux", "choix", "duree"],
    test: ["car|maree", "deux", "choix|depart", "duree"],
    aide: ["duree", "arrivee", "depart"],
    retour: ["duree|depart|arrivee", "car|maree"],
    echauffement: ["duree|arrivee"]
  };
  function tirerQ10(rng, degre, forme) {
    const sorte = forme || choisir(rng, ["duree", "arrivee", "depart"]);
    for (let essai = 0; essai < 60; essai += 1) {
      let x = null;
      if (sorte === "car") x = carQ10(degre, rng);
      else if (sorte === "maree") x = mareeQ10(degre, rng);
      else if (sorte === "deux") x = deuxEtapesQ10(degre, rng);
      else if (sorte === "choix") x = choixQ10(rng() < 0.5 ? deuxEtapesQ10(degre, rng) : uneEtapeQ10(Math.max(degre, 2), rng, "arrivee"), rng);
      else x = uneEtapeQ10(degre, rng, sorte);
      if (x) return x;
    }
    return null;
  }
  ETAPES.Q10 = {
    // On te montre : Ismaël (de 7 h 47 à 8 h 16), Lucie (1 h 17 min,
    // arrivée à 12 h 10), le train (7 h 43, 1 h 34 min, puis 52 min).
    clesExemples: ["Q10:ecole:duree:467--496", "Q10:velo:depart:653--730", "Q10:train:arrivee:463-557-609"],
    tirer(rng, degre, i, usage, forme) {
      return tirerQ10(rng, degre, forme);
    },
    formes(usage, rng) {
      const p = PLACES_Q10[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    // (Dans Je valide : un même contexte une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      return !serie.some(x => x.modeleQ10 === question.modeleQ10);
    },
    erreurs(question, lu, lus) { return erreursQ10(question, lu, lus); }
  };

  // ============================ lot B6-1 : D6 « Toutes les heures décimales » (4e)
  // Programme de 4e et attendus (« convertir 0,2 h en minutes, 36 min en
  // heure, 1 h 45 min en heure » ; « 2,1 h = … h … min ») ; c'est la
  // conversion n° 1 du brevet (35 sujets, 17 où elle se cache dans une
  // vitesse) ; « 3 h 20 min n'est pas 3,2 h » (Amérique du Sud 2022) ;
  // « 2,6 h = 2 h 36 min » (la plupart des candidats n'y arrivent pas) ;
  // S097 p. 20 : la lumière du Soleil (500 s, ou 8,3 min).
  // Choix de Gwenaël sur la maquette (21/11, 10 h 30) : l'outil est la
  // double droite des heures (0 à 1 h en dixièmes : 0,1 h = 6 min) ; la
  // correction, la droite refaite en vert et la ligne de calcul.
  // Une durée décimale est un entier de centièmes (135 → 1,35 h) ; les
  // minutes tombent juste (un multiple de 5 centièmes = 3 min).
  const decH = (x, u = "h") => mes(BigInt(x) * 10n, u);
  // (Les minutes de x centièmes : x × 60 ÷ 100.)
  const minDe = x => (x * 3) / 5;
  // Des minutes aux centièmes d'heure (m multiple de 3).
  const centDe = m => (m * 5) / 3;
  // Les deux unités : les heures et les minutes ; les minutes et les secondes.
  const U_D6 = {h: ["h", "min"], min: ["min", "s"]};
  // Une valeur tirée : des dixièmes (pas 10), des « quarts » (25, 50, 75) ou
  // des centièmes multiples de 5 qui ne sont pas des dixièmes (degré 3).
  function partieD6(rng, sorte) {
    if (sorte === "dixiemes") { let k; do { k = entre(rng, 1, 9); } while (k === 5 && rng() < 0.5); return k * 10; }
    if (sorte === "quarts") return choisir(rng, [25, 50, 75]);
    let k;
    do { k = entre(rng, 1, 19); } while (k % 2 === 0);
    return k * 5;
  }
  // Situations (une durée en heures décimales, à écrire en heures et
  // minutes) : [modèle, énoncé ({P}, {d}), centièmes min, max].
  const SITUATIONS_D6 = [
    ["vol", "Le vol Réunion – Paris dure {d}.", 1060, 1160],
    ["piton", "La montée au Piton des Neiges : {d}.", 410, 560],
    ["car", "Le trajet en Car Jaune dure {d}.", 155, 195],
    ["trajet", "Le trajet {deP} dure {d}.", 105, 395],
    ["film", "Le film dure {d}.", 140, 240],
    ["nuit", "{P} dort {d} cette nuit.", 720, 980],
    ["raid", "Une étape du Grand Raid : {d}.", 230, 590]
  ];
  // Des minutes décimales en secondes (S097 p. 20 : la lumière du Soleil) :
  // [modèle, énoncé ({P}, {d}), les valeurs en centièmes de minute].
  // (Des énoncés d'une ligne au petit téléphone : la question la plus
  // haute fixe la hauteur de toute la série.)
  const SECONDES_D6 = [
    ["soleil", "Du Soleil à la Terre, la lumière met {d}.", [830]],
    ["chanson", "La chanson dure {d}.", [255, 265, 285, 315, 335, 345, 365, 385, 415, 435]],
    ["course", "{P} court le 400\u00a0m en {d}.", [115, 125, 135, 145, 155]],
    ["micro", "Le plat chauffe {d} au micro-ondes.", [150, 250, 350, 175, 225, 275]],
    ["oeuf", "L'œuf à la coque cuit {d}.", [350, 325, 375]]
  ];


  // La double droite des heures (l'outil et la correction) : `c` la
  // graduation cherchée en centièmes (de 0 à 100, un tiers d'heure
  // compris), `sens` h>min ou min>h, `u` les deux unités.
  const droiteD6 = (c, sens, u = "h") => ({c, sens, haut: U_D6[u][0], bas: U_D6[u][1]});

  // La question finie. spec : {sorte, degre, x (centièmes de l'unité
  // haute, la durée), u, forme…}.
  function finirD6(spec) {
    const {sorte, degre, x} = spec;
    const u = spec.u || "h";
    const [H, P] = U_D6[u];
    const h = Math.floor(x / 100);
    const d = x % 100;
    const total = minDe(x);
    const md = minDe(d);
    const relation = u === "h" ? `0,1${NB}h = 6${NB}min` : `0,1${NB}min = 6${NB}s`;
    const base = {code: "D6", degre, grandeur: "duree", outil: "droite-h", relation, sorteD6: sorte};
    // Des heures décimales vers les minutes.
    if (["dec", "hmin", "total", "situation", "secondes"].includes(sorte)) {
      const gauche = decH(x, H);
      const cases = sorte === "hmin" || sorte === "situation";
      const reponse = cases ? [String(h), String(md)] : String(total);
      const reponseTexte = cases ? hm(h, md) : `${total}${NB}${P}`;
      let texte;
      let morceaux;
      if (sorte === "situation" || sorte === "secondes") {
        const enonce = spec.enonce;
        const avant = "Durée :";
        morceaux = cases ? {enonce, avant, cases: [H, P], serre: true, long: true} : {enonce, avant, apres: P, serre: true, long: true};
        texte = `${enonce} ${avant} ${cases ? `${CASE}${NB}${H}${NB}${CASE}${NB}${P}` : `${CASE}${NB}${P}`}`;
      } else if (cases) {
        texte = `${gauche} = ${CASE}${NB}${H}${NB}${CASE}${NB}${P}`;
        morceaux = {avant: `${gauche} =`, cases: [H, P]};
      } else {
        texte = `${gauche} = ${CASE}${NB}${P}`;
        morceaux = {avant: `${gauche} =`, apres: P};
      }
      // La correction : la droite en vert, puis une ligne (la réponse en
      // vert) ; l'image : le calcul posé, sans le résultat.
      const ligne = h && cases ? `${gauche} = ${h}${NB}${H} + ${decH(d, H)} = ${reponseTexte}`
        : `${ecrire(BigInt(x) * 10n)} × 60${NB}${P} = ${reponseTexte}`;
      const image = h && cases ? [`${gauche} = ${h}${NB}${H} + ${decH(d, H)}`, `${decH(d, H)} = ${ecrire(BigInt(d) * 10n)} × 60${NB}${P}`]
        : [`1${NB}${H} = 60${NB}${P}`, `${gauche} = ${ecrire(BigInt(x) * 10n)} × 60${NB}${P}`];
      const note = h ? (cases ? "Je lis la partie décimale sur la droite." : `${h}${NB}${H} = ${h * 60}${NB}${P}, puis la droite.`) : `Je cherche ${gauche} sur la droite.`;
      return q(Object.assign(base, {
        forme: cases ? "deux-cases" : "nombre", texte, morceaux, reponse, reponseTexte, unite: P,
        resume: sorte === "situation" || sorte === "secondes" ? `${gauche} = ${reponseTexte}` : `${gauche} = ${reponseTexte}`,
        droiteH: droiteD6(d, "h>min", u), noteOutil: note, image, correction: [ligne], ligneD6: ligne, vertD6: reponseTexte,
        modeleD6: spec.modele || sorte,
        donnees: {type: "d6", sorte, x, u, vers: cases ? "hmin" : P},
        cle: `D6:${u}:${x}>${cases ? "hmin" : P}`
      }));
    }
    // Des minutes vers les heures décimales.
    if (["inv", "invhm", "invtot"].includes(sorte)) {
      // (x : la durée en centièmes d'heure ; sa partie décimale tombe en
      // minutes entières.)
      const gauche = sorte === "invtot" ? `${total}${NB}min` : hm(h, md);
      const reponse = brut(BigInt(x) * 10n);
      const reponseTexte = decH(x);
      const texte = `${gauche} = ${CASE}${NB}h`;
      const ligne = sorte === "invhm" ? `${gauche} = ${h}${NB}h + ${decH(d)} = ${reponseTexte}`
        : `${gauche} = (${total}${NB}÷${NB}60)${NB}h = ${reponseTexte}`;
      const image = sorte === "invhm" ? [`${md}${NB}min = (${md}${NB}÷${NB}60)${NB}h`, `${gauche} = ${h}${NB}h + ${md}${NB}min`]
        : [`1${NB}h = 60${NB}min`, `${gauche} = (${total}${NB}÷${NB}60)${NB}h`];
      const note = sorte === "inv" ? `Je cherche ${md}${NB}min sur la droite.` : sorte === "invhm" ? `${h}${NB}h, puis ${md}${NB}min sur la droite.`
        : "Je fais d'abord des paquets de 60 min.";
      return q(Object.assign(base, {
        forme: "nombre", texte, morceaux: {avant: `${gauche} =`, apres: "h"}, reponse, reponseTexte, unite: "h",
        resume: `${gauche} = ${reponseTexte}`, droiteH: droiteD6(d, "min>h"), noteOutil: CARTE.typo(note), image, correction: [ligne],
        ligneD6: ligne, vertD6: reponseTexte, modeleD6: sorte,
        donnees: {type: "d6", sorte, x, u: "h", vers: "h"},
        cle: `D6:h:${x}<${sorte === "invtot" ? "min" : "hmin"}`
      }));
    }
    return null;
  }

  // Trois réponses au choix, avec les vraies erreurs (« 2,3 h = 2 h 30 min »,
  // « 2 h 3 min » ; « 1,35 h = 135 min = 2 h 15 min »).
  function choixD6(degre, rng) {
    const h = entre(rng, 1, 4);
    const d = partieD6(rng, degre === 2 ? "dixiemes" : "centiemes");
    const x = h * 100 + d;
    const md = minDe(d);
    const bonne = hm(h, md);
    const faux = [];
    if (d < 60) faux.push([hm(h, d), `${decH(d)}, ce n'est pas ${d}${NB}min.`]);
    if (d % 10 === 0) faux.push([hm(h, d / 10), `${decH(d)}, ce n'est pas ${d / 10}${NB}min.`]);
    if (Math.floor(x / 60) !== h || x % 60 !== md) faux.push([hm(Math.floor(x / 60), x % 60), `${decH(x)}, ce n'est pas ${mes(x, "min")}.`]);
    faux.push([hm(h + 1, md), "Compte bien les heures."]);
    const propres = [];
    faux.forEach(f => { if (f[0] !== bonne && !propres.some(p => p[0] === f[0])) propres.push(f); });
    if (propres.length < 2) return null;
    const deux = [propres[0], propres[1]];
    const choix = melanger(rng, [bonne, deux[0][0], deux[1][0]]);
    const pourquoi = {};
    choix.forEach((c, k) => { const f = deux.find(y => y[0] === c); if (f) pourquoi[k] = f[1]; });
    const x0 = finirD6({sorte: "hmin", degre, x});
    const phrase = `${decH(x)} = ${CASE}`;
    return Object.assign(x0, {
      forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "duree"}, choix, bon: choix.indexOf(bonne), pourquoi,
      reponse: bonne, cle: `${x0.cle}:q`, cleBase: x0.cle, sorteD6: "choix", modeleD6: "choix"
    });
  }
  // « 20 min = … h » : un tiers d'heure (attendus de 4e : « 1⁄3 h, pas
  // 0,2 h ni 0,3 h »).
  const TIERS_D6 = [[10, "1⁄6", ["0,1", "0,6"]], [20, "1⁄3", ["0,2", "0,3"]], [40, "2⁄3", ["0,4", "0,6"]], [50, "5⁄6", ["0,5", "0,8"]]];
  function tiersD6(degre, rng) {
    const [m, f, faux] = choisir(rng, TIERS_D6);
    const bonne = `${f}${NB}h`;
    const choix = melanger(rng, [bonne, ...faux.map(y => `${y}${NB}h`)]);
    const pourquoi = {};
    faux.forEach(y => { pourquoi[choix.indexOf(`${y}${NB}h`)] = `${y}${NB}h = ${minDe(Number(y.split(",")[1]) * 10)}${NB}min.`; });
    const phrase = `${m}${NB}min = ${CASE}`;
    const ligne = `${m}${NB}min = ${m}⁄60${NB}h = ${bonne}`;
    return q({
      code: "D6", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "duree"}, choix, bon: choix.indexOf(bonne), pourquoi,
      reponse: bonne, reponseTexte: bonne, unite: "h", resume: `${m}${NB}min = ${bonne}`, grandeur: "duree", outil: "droite-h",
      relation: `0,1${NB}h = 6${NB}min`, droiteH: Object.assign(droiteD6(centDe(m), "min>h"), {hautTexte: f}),
      noteOutil: `${m}${NB}min ne tombe pas sur un dixième.`, image: [`1${NB}min = 1⁄60${NB}h`, `${m}${NB}min = ${m}⁄60${NB}h`],
      correction: [ligne], ligneD6: ligne, vertD6: bonne, sorteD6: "tiers", modeleD6: "tiers",
      donnees: {type: "d6", sorte: "tiers", m}, cle: `D6:tiers:${m}`
    });
  }
  // « Le plus long : 1,45 h ou 1 h 30 min ? » — souvent un piège (lire
  // 0,45 h comme 45 min fait choisir 1,45 h) ; une fois sur cinq, la même
  // durée.
  function comparerD6(degre, rng) {
    const h = entre(rng, 1, 3);
    const d = partieD6(rng, degre === 2 ? "dixiemes" : "centiemes");
    const x = h * 100 + d;
    const md = minDe(d);
    let m2;
    const r = rng();
    if (r < 0.2) m2 = md;
    else if (r < 0.75 && d < 60 && d - md >= 6) m2 = entre(rng, md + 3, d - 3);
    else { do { m2 = entre(rng, 5, 55); } while (Math.abs(m2 - md) < 4 || m2 === d); }
    if (m2 <= 0 || m2 >= 60) return null;
    const A = decH(x);
    const B = hm(h, m2);
    // (L'ordre des deux durées est tiré : la bonne réponse à toutes les places.)
    const aGauche = rng() < 0.5;
    const choix = aGauche ? [A, B, "Même durée"] : [B, A, "Même durée"];
    const gagnant = md === m2 ? "Même durée" : md > m2 ? A : B;
    const bon = choix.indexOf(gagnant);
    const pourquoi = {};
    choix.forEach((c, k) => { if (k !== bon) pourquoi[k] = `${A} = ${hm(h, md)}.`; });
    const phrase = `Le plus long : ${choix[0]} ou ${choix[1]}${NB}?`;
    const ligne = `${A} = ${hm(h, md)}`;
    return q({
      code: "D6", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "comparer"}, choix, bon, pourquoi,
      reponse: choix[bon], reponseTexte: choix[bon], unite: null, resume: bon === 2 ? `${A} = ${B}` : `Le plus long : ${choix[bon]}`,
      grandeur: "duree", outil: "droite-h", relation: `0,1${NB}h = 6${NB}min`, droiteH: droiteD6(d, "h>min"),
      noteOutil: "Je compare dans la même unité.", image: [`${A} = ${h}${NB}h + ${decH(d)}`, `${decH(d)} = ${ecrire(BigInt(d) * 10n)} × 60${NB}min`],
      correction: [ligne], ligneD6: ligne, vertD6: hm(h, md), sorteD6: "comparer", modeleD6: "comparer",
      donnees: {type: "d6", sorte: "comparer", x, m: h * 60 + m2}, cle: `D6:cmp:${x}:${m2}`
    });
  }

  function tirerD6Brut(rng, degre, sorte) {
    // Les heures décimales vers les minutes.
    // (Pas 0,1 h ni 6 min seuls : c'est la relation écrite sur l'outil.)
    if (sorte === "dec") {
      const x = partieD6(rng, degre === 1 ? (rng() < 0.75 ? "dixiemes" : "quarts") : "centiemes");
      return x === 10 ? null : finirD6({sorte, degre, x});
    }
    if (sorte === "hmin") return finirD6({sorte, degre, x: entre(rng, 1, degre === 3 ? 4 : 5) * 100 + partieD6(rng, degre === 3 ? "centiemes" : "dixiemes")});
    if (sorte === "total") {
      const x = entre(rng, 1, 4) * 100 + partieD6(rng, degre === 3 ? "centiemes" : rng() < 0.7 ? "dixiemes" : "quarts");
      return finirD6({sorte, degre, x});
    }
    if (sorte === "situation") {
      const [modele, texte, a, b] = choisir(rng, SITUATIONS_D6);
      const x = entre(rng, Math.ceil(a / 5), Math.floor(b / 5)) * 5;
      if (degre === 2 ? x % 10 !== 0 : x % 10 === 0) return null;
      if (x % 100 === 0 || x % 100 === 50) return null;
      const P = choisir(rng, PRENOMS);
      const enonce = remplirQ2(texte, {P, deP: deQ2(P), d: decH(x)});
      return finirD6({sorte, degre, x, enonce, modele});
    }
    if (sorte === "secondes") {
      const [modele, texte, valeurs] = choisir(rng, SECONDES_D6);
      const x = choisir(rng, valeurs);
      const enonce = remplirQ2(texte, {P: choisir(rng, PRENOMS), d: decH(x, "min")});
      return finirD6({sorte, degre, x, u: "min", enonce, modele});
    }
    // Les minutes vers les heures décimales.
    if (sorte === "inv") {
      const x = degre === 1 ? (rng() < 0.75 ? partieD6(rng, "dixiemes") : partieD6(rng, "quarts")) : partieD6(rng, "centiemes");
      return x === 10 ? null : finirD6({sorte, degre, x});
    }
    if (sorte === "invhm") return finirD6({sorte, degre, x: entre(rng, 1, 4) * 100 + partieD6(rng, degre === 3 ? (rng() < 0.7 ? "centiemes" : "quarts") : "dixiemes")});
    if (sorte === "invtot") {
      const x = entre(rng, 1, 3) * 100 + partieD6(rng, degre === 3 ? "centiemes" : rng() < 0.6 ? "dixiemes" : "quarts");
      return finirD6({sorte, degre, x});
    }
    if (sorte === "choix") return choixD6(Math.max(2, degre), rng);
    if (sorte === "tiers") return tiersD6(3, rng);
    if (sorte === "comparer") return comparerD6(Math.max(2, degre), rng);
    return null;
  }
  // Les sortes de chaque degré (l'exerciseur, et une place sans sorte).
  const SORTES_D6 = {1: ["dec", "inv"], 2: ["hmin", "total", "invhm", "invtot", "choix", "comparer", "situation"],
    3: ["dec", "hmin", "invhm", "total", "choix", "tiers", "comparer", "situation", "secondes"]};
  // Les places : les dixièmes au degré 1 ; les heures et les minutes, le
  // piège et « le plus long » au degré 2 ; les centièmes, le tiers
  // d'heure, les situations et les secondes au degré 3.
  const PLACES_D6 = {
    valide: ["dec", "inv", "dec", "hmin", "invhm", "choix", "comparer", "hmin", "situation|secondes", "tiers|invhm"],
    entraine: ["dec", "inv", "dec", "inv", "dec", "inv",
      "hmin", "total", "invhm", "hmin", "choix", "invtot", "comparer", "situation", "hmin",
      "dec", "hmin", "invhm", "choix", "situation", "total", "tiers", "secondes", "comparer", "invhm"],
    test: ["hmin", "invhm", "choix|tiers", "invtot|total"],
    aide: ["dec", "hmin", "invhm"],
    retour: ["hmin|invhm", "total|invtot|comparer"],
    echauffement: ["hmin|invhm"]
  };
  function tirerD6(rng, degre, forme) {
    const sorte = forme || choisir(rng, SORTES_D6[degre]);
    for (let essai = 0; essai < 40; essai += 1) {
      const x = tirerD6Brut(rng, degre, sorte);
      if (x) return x;
    }
    return null;
  }

  // Les erreurs de D6 au pavé (une ligne au petit téléphone, 31 caractères
  // au plus) : les chiffres après la virgule lus comme des minutes
  // (« 0,35 h = 35 min », « 1,35 h = 1 h 35 min », « 0,3 h = 3 min ») ;
  // diviser par 100 (« 36 min = 0,36 h ») ; 1,35 h lu 135 min.
  function erreursD6(question, lu, lus) {
    const d = question.donnees;
    if (!d || d.type !== "d6") return null;
    const v = lus ? lus.map(y => Number(y) / 1000) : [Number(lu) / 1000];
    const x = d.x;
    const h = Math.floor(x / 100);
    const dd = x % 100;
    const [H, P] = U_D6[d.u || "h"];
    if (d.sorte === "inv" || d.sorte === "invhm" || d.sorte === "invtot") {
      const m = d.sorte === "invtot" ? minDe(x) : minDe(dd);
      const lu0 = v[0];
      if (d.sorte !== "invtot" && Math.abs(lu0 - (h + m / 100)) < 1e-9) return {erreur: 4, retour: `${m}${NB}min, ce n'est pas ${decH(m)}.`};
      if (d.sorte === "invtot" && Math.abs(lu0 - minDe(x) / 100) < 1e-9) return {erreur: 4, retour: "Je divise par 60, pas par 100."};
      if (d.sorte === "invtot" && Math.abs(lu0 - (Math.floor(minDe(x) / 60) + (minDe(x) % 60) / 100)) < 1e-9) return {erreur: 4, retour: `${minDe(x) % 60}${NB}min, ce n'est pas ${decH(minDe(x) % 60)}.`};
      if (Math.abs(lu0 - (d.sorte === "invtot" ? minDe(x) : h * 60 + m)) < 1e-9) return {erreur: 5, retour: "La réponse est en heures."};
      return null;
    }
    if (v.length === 2) {
      if (v[0] === h && v[1] === dd && dd !== minDe(dd)) return {erreur: 1, retour: `1${NB}${H} = 60${NB}${P}, pas 100${NB}${P}.`};
      if (v[0] === h && dd % 10 === 0 && v[1] === dd / 10) return {erreur: 3, retour: `${decH(dd, H)}, ce n'est pas ${dd / 10}${NB}${P}.`};
      // (« 10,75 h, ce n'est pas 1 075 min. » : 32 caractères, trop long
      // pour une ligne au petit téléphone ; la phrase courte.)
      if (v[0] === Math.floor(x / 60) && v[1] === x % 60 && x >= 60) return {erreur: 2, retour: x >= 1000 ? `Ce n'est pas ${mes(x, P)}.` : `${decH(x, H)}, ce n'est pas ${mes(x, P)}.`};
      return null;
    }
    const t = v[0];
    if (t === x && x !== minDe(x)) return {erreur: 1, retour: h ? `1${NB}${H} = 60${NB}${P}, pas 100${NB}${P}.` : `${decH(x, H)}, ce n'est pas ${mes(x, P)}.`};
    if (!h && dd % 10 === 0 && t === dd / 10) return {erreur: 3, retour: `${decH(dd, H)}, ce n'est pas ${dd / 10}${NB}${P}.`};
    if (h && t === h * 60 + dd && dd !== minDe(dd)) return {erreur: 2, retour: `${decH(dd, H)}, ce n'est pas ${dd}${NB}${P}.`};
    if (h && dd % 10 === 0 && t === h * 60 + dd / 10) return {erreur: 3, retour: `${decH(dd, H)}, ce n'est pas ${dd / 10}${NB}${P}.`};
    return null;
  }

  ETAPES.D6 = {
    // On te montre : 0,2 h (attendus de 4e), 2,6 h (l'erreur des candidats),
    // 36 min (attendus).
    clesExemples: ["D6:h:20>min", "D6:h:260>hmin", "D6:h:60<hmin"],
    tirer(rng, degre, i, usage, forme) {
      return tirerD6(rng, degre, forme);
    },
    formes(usage, rng) {
      const p = PLACES_D6[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    // (Dans Je valide : une même situation une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      if (question.sorteD6 !== "situation" && question.sorteD6 !== "secondes") return true;
      return !serie.some(x => x.modeleD6 === question.modeleD6);
    },
    erreurs(question, lu, lus) { return erreursD6(question, lu, lus); }
  };

  // ============================================ lot B6-1 : G1 « km/h et m/s » (4e)
  // Programme de 4e (« convertir des km/h en m/s et inversement ») ; brevet
  // (« 90 km/h en m/s : 25 m/s », « montrer que 10 m/s = 36 km/h »,
  // « un éléphant à 5 m/s est plus rapide qu'un cochon à 17 km/h », « un
  // avion à 1 200 km/h va moins vite que le son, 340 m/s ») ; Japon : la
  // même vitesse par heure, par minute, par seconde (72 km/h = 1 200 m/min
  // = 20 m/s), avant « ÷ 3,6 ».
  // Choix de Gwenaël sur la maquette (21/11, 10 h 30) : l'outil, ce sont
  // les trois étapes « En 1 h → En 1 min → En 1 s » reliées par ÷ 60 ;
  // « ÷ 3,6 » vient dans À retenir (et dans l'image au degré 3) ; la
  // correction : les trois cases remplies en vert, puis la ligne.
  // Une vitesse est `s2`, le double de sa valeur en m/s (un entier) : 1 m/s
  // = 3,6 km/h, donc toutes les vitesses tombent juste (0,5 m/s = 1,8 km/h).
  const msDe = s2 => BigInt(s2) * 500n;
  const kmhDe = s2 => BigInt(s2) * 1800n;
  // Les mètres parcourus en 1 h, en 1 min, en 1 s (en millièmes).
  const metresG1 = s2 => [BigInt(s2) * 1800000n, BigInt(s2) * 30000n, BigInt(s2) * 500n];
  const vit = (m, u) => `${ecrire(m)}${NB}${u}`;
  const COL_G1 = [`En 1${NB}h`, `En 1${NB}min`, `En 1${NB}s`];
  // Les valeurs de chaque degré (en m/s). Sans calculatrice (Gwenaël,
  // 21/11) : tout se fait de tête par les étapes ÷ 60 (pas 340 m/s au pavé).
  const VALEURS_G1 = {
    kmh: {1: [1, 2, 5, 10, 15, 20, 25, 30], 2: [1, 2, 35, 40, 45, 50, 60, 75, 90, 100, 250], 3: ["0,5", "1,5", "2,5", "7,5", "12,5", "17,5", "22,5", 300]},
    ms: {1: [1, 2, 5, 10, 15, 20, 25, 30], 2: [2, 3, 4, 8, 15, 25, 30, 40, 50], 3: ["0,5", "1,5", "2,5", "7,5", "12,5", 250]}
  };
  const s2De = v => Number(milli(v) / 500n);
  // Situations : la vitesse dans l'unité où on la dit vraiment. [modèle,
  // énoncé ({P}, {v}), les vitesses (en m/s)].
  const SITUATIONS_KMH_G1 = [
    ["littoral", "Sur la route du Littoral, une voiture roule à {v}.", [25]],
    ["car", "Le Car Jaune roule à {v}.", [20, 25]],
    ["velo", "{P} roule à vélo à {v}.", [5, "7,5"]],
    ["marche", "{P} marche à {v}.", ["1,5"]],
    ["raid", "Sur le Grand Raid, {P} avance à {v}.", [2]],
    ["scooter", "Un scooter roule à {v}.", ["12,5"]],
    ["cyclone", "Pendant le cyclone, le vent souffle à {v}.", [50, 60]],
    ["tgv", "Un TGV roule à {v}.", [90]],
    ["avion", "Un avion de ligne vole à {v}.", [250]],
    ["guepard", "Un guépard court à {v}.", [30]]
  ];
  const SITUATIONS_MS_G1 = [
    ["sprint", "{P} court le 100 m à {v}.", [6, 7]],
    ["elephant", "Un éléphant court à {v}.", [5]],
    ["escalator", "Un escalator monte à {v}.", ["0,5"]],
    ["vent", "Le vent souffle à {v}.", [10, 15, 20]],
    ["baleine", "Une baleine à bosse nage à {v}.", ["2,5"]],
    ["nage", "{P} nage à {v}.", [1]]
  ];
  // Qui va le plus vite ? (Brevet : l'éléphant et le cochon, le son et
  // l'avion.) [A, nom de A, A en m/s, B, nom de B, B en km/h].
  const COMPARER_G1 = [
    ["Un éléphant court à {a}.", "L'éléphant", 5, "Un cochon court à {b}.", "Le cochon", [17, 20]],
    ["Dans l'air, le son va à {a}.", "Le son", 340, "Un avion vole à {b}.", "L'avion", [1200, 1250]],
    ["Un guépard court à {a}.", "Le guépard", 30, "Une voiture roule à {b}.", "La voiture", [100, 108, 110]],
    ["{P} court le 100 m à {a}.", "{P}", 7, "Un cycliste roule à {b}.", "Le cycliste", [20, 25, 30]],
    ["Le vent souffle à {a}.", "Le vent", 15, "Un scooter roule à {b}.", "Le scooter", [45, 54, 60]],
    ["Une baleine à bosse nage à {a}.", "La baleine", "2,5", "{P} marche à {b}.", "{P}", [5, 9, 10]]
  ];
  // Le chemin de l'outil : de la colonne connue à la colonne cherchée.
  const etapesG1 = (s2, depuis, vers, km = false) => ({s2, depuis, vers, km});

  // La question finie. spec : {sorte, degre, s2, depuis, vers (les
  // colonnes : 0 en 1 h, 1 en 1 min, 2 en 1 s), de, a (les unités : km/h,
  // m/min, m/s), forme, enonce, modele}.
  const VALEUR_U = {"km/h": kmhDe, "m/s": msDe, "m/min": s2 => BigInt(s2) * 30000n};
  const COL_U = {"km/h": 0, "m/min": 1, "m/s": 2};
  function finirG1(spec) {
    const {sorte, degre, s2, de, a} = spec;
    const gauche = vit(VALEUR_U[de](s2), de);
    const rep = VALEUR_U[a](s2);
    const reponseTexte = vit(rep, a);
    const depuis = COL_U[de];
    const vers = COL_U[a];
    const m = metresG1(s2);
    let texte;
    let morceaux;
    let resume = `${gauche} = ${reponseTexte}`;
    if (sorte === "par") {
      // « À 72 km/h, combien de mètres en 1 s ? »
      const temps = a === "m/s" ? "1 s" : "1 min";
      const phrase = `À ${gauche}, combien de mètres en ${temps.replace(" ", NB)}${NB}?`;
      texte = phrase;
      morceaux = {phrase, apres: "m"};
      resume = `À ${gauche} : ${vit(rep, "m")} en ${temps.replace(" ", NB)}`;
    } else if (sorte === "situation") {
      const avant = "Vitesse :";
      texte = `${spec.enonce} ${avant} ${CASE}${NB}${a}`;
      morceaux = {enonce: spec.enonce, avant, apres: a, serre: true};
    } else {
      texte = `${gauche} = ${CASE}${NB}${a}`;
      morceaux = {avant: `${gauche} =`, apres: a};
    }
    const reponseFinale = sorte === "par" ? vit(rep, "m") : reponseTexte;
    // L'outil : la relation au-dessus (« 72 km = 72 000 m », « 1 km =
    // 1 000 m »), les trois cases dessous ; l'image : le calcul posé, sans
    // le résultat (au degré 3, le raccourci « ÷ 3,6 »).
    const relation = de === "km/h" ? `${ecrire(kmhDe(s2))}${NB}km = ${vit(m[0], "m")}` : `1${NB}km = 1${FINE}000${NB}m`;
    let image;
    if (degre === 3 && de === "km/h" && a === "m/s") image = ["De km/h à m/s : ÷ 3,6", `${ecrire(kmhDe(s2))} ÷ 3,6`];
    else if (degre === 3 && de === "m/s" && a === "km/h") image = ["De m/s à km/h : × 3,6", `${ecrire(msDe(s2))} × 3,6`];
    else {
      const sens = vers > depuis ? "÷" : "×";
      const f = Math.abs(vers - depuis) === 2 ? `3${FINE}600` : "60";
      image = [`${COL_G1[depuis]} : ${vit(m[depuis], "m")}`, `${COL_G1[vers]} : ${vit(m[depuis], "m")} ${sens} ${f}`];
    }
    const ligne = sorte === "par" ? `${COL_G1[vers]} : ${reponseFinale}` : `${gauche} = ${reponseTexte}`;
    // (Vers les km/h : la ligne d'avant, les mètres en kilomètres.)
    const avantLigne = a === "km/h" ? `${vit(m[0], "m")} = ${ecrire(kmhDe(s2))}${NB}km` : null;
    return q({
      code: "G1", degre, forme: sorte === "par" ? "phrase" : "nombre", texte, morceaux,
      reponse: brut(rep), reponseTexte: reponseFinale, unite: sorte === "par" ? "m" : a, resume,
      grandeur: "vitesse", outil: "etapes-v", relation, etapesV: etapesG1(s2, depuis, vers, a === "km/h"),
      noteOutil: vers > depuis ? "Par heure, par minute, puis par seconde." : "Par seconde, par minute, puis par heure.",
      image, correction: avantLigne ? [avantLigne, ligne] : [ligne], ligneG1: ligne, vertG1: reponseFinale,
      sorteG1: sorte, modeleG1: spec.modele || sorte,
      donnees: {type: "g1", sorte, s2, de, a},
      cle: `G1:${s2}:${de}>${a}`
    });
  }
  // « 90 km/h, cela veut dire : 90 km en 1 h » (degré 1).
  function sensG1(rng) {
    const kmh = rng() < 0.5;
    const v = kmh ? choisir(rng, [30, 50, 90, 110, 130]) : choisir(rng, [2, 5, 8, 10, 20]);
    const u = kmh ? "km/h" : "m/s";
    const bonne = kmh ? `${v}${NB}km en 1${NB}h` : `${v}${NB}m en 1${NB}s`;
    const faux = kmh ? [`${v}${NB}m en 1${NB}s`, `${v}${NB}km en 1${NB}min`] : [`${v}${NB}km en 1${NB}h`, `${v}${NB}m en 1${NB}min`];
    const choix = melanger(rng, [bonne, ...faux]);
    const pourquoi = {};
    choix.forEach((c, k) => { if (c !== bonne) pourquoi[k] = kmh ? "km/h : des km par heure." : "m/s : des mètres par seconde."; });
    const phrase = `${v}${NB}${u}, cela veut dire${NB}:`;
    return q({
      code: "G1", degre: 1, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "sens"}, choix, bon: choix.indexOf(bonne), pourquoi,
      reponse: bonne, reponseTexte: bonne, unite: null, resume: `${v}${NB}${u} : ${bonne}`, grandeur: "vitesse", outil: "lignes",
      outilLignes: ["km/h : kilomètres par heure", "m/s : mètres par seconde"], image: [`Le «${NB}par${NB}» veut dire «${NB}en 1${NB}».`, `${v}${NB}${u} : ${v} … en 1 …`],
      correction: [kmh ? `km/h : ${v}${NB}km en 1${NB}h` : `m/s : ${v}${NB}m en 1${NB}s`], sorteG1: "sens", modeleG1: "sens",
      donnees: {type: "g1", sorte: "sens", v, u}, cle: `G1:sens:${v}${u}`
    });
  }
  // Qui va le plus vite ? Les deux vitesses en km/h (× 3,6 tombe toujours
  // juste) ; souvent le piège du plus grand nombre (17 km/h contre 5 m/s).
  function comparerG1(degre, rng) {
    const [ta, na, va, tb, nb, vbs] = choisir(rng, COMPARER_G1);
    const s2 = s2De(va);
    const vb = choisir(rng, vbs);
    const [P, P2] = melanger(rng, PRENOMS);
    const A = na.replace("{P}", P);
    const B = nb.replace("{P}", P2);
    const enonce = `${remplirQ2(ta, {P, a: vit(msDe(s2), "m/s")})} ${remplirQ2(tb, {P: P2, b: vit(milli(vb), "km/h")})}`;
    const kA = kmhDe(s2);
    const kB = milli(vb);
    const aGauche = rng() < 0.5;
    const choix = aGauche ? [A, B, "Même vitesse"] : [B, A, "Même vitesse"];
    const gagnant = kA === kB ? "Même vitesse" : kA > kB ? A : B;
    const bon = choix.indexOf(gagnant);
    const pourquoi = {};
    choix.forEach((c, k) => { if (k !== bon) pourquoi[k] = `${vit(msDe(s2), "m/s")} = ${vit(kA, "km/h")}.`; });
    const consigne = `Le plus rapide${NB}?`;
    const ligne = `${vit(msDe(s2), "m/s")} = ${vit(kA, "km/h")}`;
    const m = metresG1(s2);
    return q({
      code: "G1", degre, forme: "qcm", texte: `${enonce} ${consigne}`, morceaux: {enonce, consigne, serre: true, sorte: "comparer"}, choix, bon, pourquoi,
      reponse: gagnant, reponseTexte: gagnant, unite: null, resume: kA === kB ? `${ligne} : même vitesse` : `Le plus rapide : ${gagnant}`,
      grandeur: "vitesse", outil: "etapes-v", relation: `1${NB}km = 1${FINE}000${NB}m`, etapesV: etapesG1(s2, 2, 0, true),
      noteOutil: "Je compare en km/h.", image: [`En 1${NB}s : ${vit(m[2], "m")}`, `En 1${NB}h : ${vit(m[2], "m")} × 3${FINE}600`],
      correction: [`${vit(m[0], "m")} = ${ecrire(kA)}${NB}km`, ligne], ligneG1: ligne,
      vertG1: vit(kA, "km/h"), sorteG1: "comparer", modeleG1: `cmp:${na}`,
      donnees: {type: "g1", sorte: "comparer", s2, kmhB: brut(kB)}, cle: `G1:cmp:${s2}:${brut(kB)}`
    });
  }
  function tirerG1Brut(rng, degre, sorte) {
    if (sorte === "sens") return sensG1(rng);
    if (sorte === "kmh" || sorte === "ms") {
      const s2 = s2De(choisir(rng, VALEURS_G1[sorte][degre]));
      return sorte === "kmh" ? finirG1({sorte, degre, s2, de: "km/h", a: "m/s"}) : finirG1({sorte, degre, s2, de: "m/s", a: "km/h"});
    }
    if (sorte === "par") {
      const s2 = s2De(choisir(rng, degre === 1 ? [5, 10, 20, 15] : [5, 10, 15, 20, 25, 30, 40]));
      return finirG1({sorte, degre, s2, de: "km/h", a: degre === 1 ? "m/s" : "m/min"});
    }
    if (sorte === "etape") {
      const s2 = s2De(choisir(rng, [5, 10, 15, 20, 25, 30, 40, 50]));
      const [de, a] = degre === 3 ? choisir(rng, [["m/min", "km/h"], ["km/h", "m/min"]]) : choisir(rng, [["km/h", "m/min"], ["m/min", "m/s"]]);
      return finirG1({sorte, degre, s2, de, a});
    }
    if (sorte === "situation") {
      const enKmh = rng() < 0.55;
      const [modele, t, vs] = choisir(rng, enKmh ? SITUATIONS_KMH_G1 : SITUATIONS_MS_G1);
      const s2 = s2De(choisir(rng, vs));
      // (Le degré 2 : des vitesses rondes ; le degré 3 : toutes.)
      if (degre === 2 && s2 % 2) return null;
      const P = choisir(rng, PRENOMS);
      const de = enKmh ? "km/h" : "m/s";
      const enonce = remplirQ2(t, {P, v: vit(VALEUR_U[de](s2), de)});
      return finirG1({sorte, degre, s2, de, a: enKmh ? "m/s" : "km/h", enonce, modele});
    }
    if (sorte === "comparer") return comparerG1(degre, rng);
    return null;
  }
  const SORTES_G1 = {1: ["sens", "kmh", "ms", "par"], 2: ["kmh", "ms", "par", "etape", "situation", "comparer"], 3: ["kmh", "ms", "etape", "situation", "comparer"]};
  const PLACES_G1 = {
    valide: ["sens", "kmh", "ms", "kmh", "par", "etape", "comparer", "kmh", "ms", "comparer|situation"],
    entraine: ["sens", "kmh", "ms", "par", "kmh", "ms",
      "kmh", "ms", "etape", "situation", "par", "comparer", "kmh", "etape", "ms",
      "kmh", "ms", "situation", "comparer", "etape", "kmh", "situation", "ms", "comparer", "kmh"],
    test: ["kmh", "situation", "comparer", "ms"],
    aide: ["kmh", "kmh", "ms"],
    retour: ["kmh|ms", "comparer|situation|etape"],
    echauffement: ["kmh|ms"]
  };
  function tirerG1(rng, degre, forme) {
    const sorte = forme || choisir(rng, SORTES_G1[degre]);
    for (let essai = 0; essai < 40; essai += 1) {
      const x = tirerG1Brut(rng, degre, sorte);
      if (x) return x;
    }
    return null;
  }
  // Les erreurs de G1 au pavé (une ligne au petit téléphone) : s'arrêter en
  // route (les mètres en 1 h, en 1 min), multiplier au lieu de diviser,
  // oublier les mètres ou les kilomètres.
  function erreursG1(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "g1" || d.sorte === "sens" || d.sorte === "comparer") return null;
    const m = metresG1(d.s2);
    const rep = milli(question.reponse);
    const ou = ["en 1 h", "en 1 min", "en 1 s"].map(t => t.replace(" ", NB));
    const v = COL_U[d.a];
    for (let k = 0; k < 3; k += 1) if (k !== v && lu === m[k]) return {erreur: 1, retour: `${vit(m[k], "m")}, c'est ${ou[k]}.`};
    if (d.de === "km/h" && d.a === "m/s" && lu === (rep * 36n * 36n) / 100n) return {erreur: 2, retour: "En 1 s, on va moins loin."};
    if (d.de === "m/s" && d.a === "km/h" && (lu * 36n * 36n) / 100n === rep && lu !== rep) return {erreur: 2, retour: "En 1 h, on va plus loin."};
    if (d.a === "km/h" && lu === m[0]) return {erreur: 3, retour: "La réponse est en km."};
    if (d.a !== "km/h" && lu * 1000n === rep) return {erreur: 3, retour: "La réponse est en mètres."};
    return null;
  }

  ETAPES.G1 = {
    // On te montre : 36 km/h (S097 et l'exemple de la carte), 10 m/s (sujet
    // zéro 2017), 90 km/h (brevet, 25 m/s, puis ÷ 3,6).
    clesExemples: ["G1:20:km/h>m/s", "G1:20:m/s>km/h", "G1:50:km/h>m/s"],
    tirer(rng, degre, i, usage, forme) {
      return tirerG1(rng, degre, forme);
    },
    formes(usage, rng) {
      const p = PLACES_G1[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    // (Dans Je valide : une même situation, une même paire, une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      if (question.sorteG1 !== "situation" && question.sorteG1 !== "comparer") return true;
      return !serie.some(x => x.modeleG1 === question.modeleG1);
    },
    erreurs(question, lu) { return erreursG1(question, lu); }
  };

  // ======================================================= palier 6 (lot B6-2)
  //
  // P5 · Les préfixes de nano à giga (4e). Programme (S097 p. 9) : « on
  // introduit en fonction des besoins les préfixes des puissances de 10 de
  // nano à giga », avec l'astronomie, la physique, l'informatique, les
  // nanotechnologies, « et on fait le lien avec les conversions ». Brevet :
  // 1,5 Go libres, des morceaux de 4 Mo (Polynésie 2019) ; 1 Go = 1 000 Mo
  // (on garde 1 ko = 1 000 o). Sans calculatrice (Gwenaël, 21/11).
  // Choix de Gwenaël du 21/11 (maquette sur la vraie page) : l'outil est le
  // glisse-unité, juste les colonnes utiles (Go, deux colonnes sans nom,
  // Mo), et pour µm on part du mm déjà connu.
  const PREFIXES_GN = [
    {nom: "giga", sym: "G", e: 9, sens: "un milliard", choix: ["un milliard", "un million", "un milliardième"]},
    {nom: "méga", sym: "M", e: 6, sens: "un million", choix: ["un million", "un milliard", "un millionième"]},
    {nom: "kilo", sym: "k", e: 3, sens: "mille", choix: ["mille", "un millième", "un million"]},
    {nom: "milli", sym: "m", e: -3, sens: "un millième", choix: ["un millième", "mille", "un millionième"]},
    {nom: "micro", sym: "µ", e: -6, sens: "un millionième", choix: ["un millionième", "un millième", "un million"]},
    {nom: "nano", sym: "n", e: -9, sens: "un milliardième", choix: ["un milliardième", "un millionième", "un milliard"]}
  ];
  const PREFIXE_GN = {};
  PREFIXES_GN.forEach(p => { PREFIXE_GN[p.nom] = p; PREFIXE_GN[p.sym] = p; });
  // Les unités de P5, par grandeur, de la plus grande à la plus petite ;
  // d'une à la suivante : × 1 000.
  const UNITES_P5 = {octet: ["Go", "Mo", "ko", "o"], longueur: ["m", "mm", "µm", "nm"], masse: ["g", "mg", "µg", "ng"],
    contenance: ["L", "mL", "µL"], puissance: ["GW", "MW", "kW", "W"]};
  // Le mot qui porte le préfixe, pour « que veut dire micro ? ».
  const MOT_P5 = {giga: ["gigaoctet", "gigawatt"], "méga": ["mégaoctet", "mégawatt"], micro: ["micromètre", "microlitre", "microgramme"],
    nano: ["nanomètre", "nanogramme"]};
  // Les colonnes du glisse-unité : la ligne entière d'une grandeur, dont on
  // prend la fenêtre utile.
  const LIGNES_P5 = {
    octet: ["Go", "", "", "Mo", "", "", "ko", "", "", "o"],
    longueur: ["m", "dm", "cm", "mm", "", "", "µm", "", "", "nm"],
    masse: ["g", "dg", "cg", "mg", "", "", "µg", "", "", "ng"],
    contenance: ["L", "dL", "cL", "mL", "", "", "µL"],
    puissance: ["GW", "", "", "MW", "", "", "kW", "", "", "W"]
  };
  const CONNUES_P5 = ["m", "mm", "g", "mg", "L", "mL"];
  function colonnesP5(de, vers) {
    const l = LIGNES_P5[grandeurDe(de)];
    let a = Math.min(l.indexOf(de), l.indexOf(vers));
    const b = Math.max(l.indexOf(de), l.indexOf(vers));
    if (/^[µn]/.test(l[a])) {
      const connue = l.slice(0, a).reverse().find(u => CONNUES_P5.includes(u));
      if (connue) a = l.indexOf(connue);
    }
    return l.slice(a, b + 1);
  }
  function glisseP5(valeur, de, vers) {
    return Object.assign(glisse(valeur, de, vers), {pale: false, colonnes: colonnesP5(de, vers)});
  }
  const NOTE_P5 = CARTE.typo("D'une unité à la suivante : × 1 000.");
  // (L'outil : les préfixes et les nombres dans le même ordre, sans les
  // relier — c'est la question ; l'image : l'ordre des préfixes.)
  const LIGNES_GRANDS_P5 = ["kilo · méga · giga", "mille · million · milliard"];
  const LIGNES_PETITS_P5 = ["milli · micro · nano", "millième · millionième · milliardième"];
  const lignesSensP5 = noms => (noms.some(n => PREFIXE_GN[n].e > 0) ? LIGNES_GRANDS_P5 : []).concat(noms.some(n => PREFIXE_GN[n].e < 0) ? LIGNES_PETITS_P5 : []);
  const IMAGE_SENS_P5 = ["giga > méga > kilo", "milli > micro > nano"];
  function echelleP5(grandeur, marque) {
    return {grandeur, unites: UNITES_P5[grandeur], marque, note: NOTE_P5};
  }
  const voyelle = mot => /^[aeiouyéèh]/.test(mot);
  const deMot = mot => (voyelle(mot) ? `d'${mot}` : `de ${mot}`);

  // Une conversion de P5 (« 1,5 Go = … Mo », « Combien de nanomètres dans
  // 4 µm ? », ou une situation). La relation au-dessus de l'outil, sauf
  // quand elle est la réponse.
  function questionP5(degre, ecrit, valeur, de, vers, extra = {}) {
    const rep = convertir(valeur, de, vers);
    if (rep === null || rep <= 0n) return null;
    const grandeur = grandeurDe(de);
    const [g, p] = exposant(de) > exposant(vers) ? [de, vers] : [vers, de];
    const gauche = mes(valeur, de);
    const reponseTexte = mes(rep, vers);
    const resume = `${gauche} = ${reponseTexte}`;
    const relation = relationTexte(g, p);
    let texte;
    let morceaux;
    if (extra.enonce) {
      texte = `${extra.enonce} ${extra.avant} ${CASE}${NB}${vers}`;
      morceaux = {enonce: extra.enonce, avant: extra.avant, apres: vers, serre: true};
    } else if (ecrit === "phrase") {
      const phrase = `Combien ${deMot(MOTS[vers])} dans ${gauche}${NB}?`;
      texte = phrase;
      morceaux = {phrase, apres: vers};
    } else {
      texte = `${gauche} = ${CASE}${NB}${vers}`;
      morceaux = {avant: `${gauche} =`, apres: vers};
    }
    const sansRel = relation.split(" = ").includes(reponseTexte) || relation === resume;
    const x = q({
      code: "P5", degre, forme: ecrit === "phrase" || extra.enonce ? "phrase" : "nombre", texte, morceaux,
      reponse: brut(rep), reponseTexte, unite: vers, resume,
      relation, outil: "glisse-unite", glisse: glisseP5(valeur, de, vers), outilSansRelation: sansRel,
      echelle: echelleP5(grandeur, [de, vers]), image: [UNITES_P5[grandeur].join(" · "), NOTE_P5],
      correction: resume === relation ? [relation] : [relation, `donc ${resume}`],
      grandeur, relationCle: `${g}-${p}`, sorteP5: extra.sorte || "conv", modeleP5: extra.modele || null,
      donnees: {type: "conv", valeur: brut(valeur), de, vers},
      cle: `P5:${brut(valeur)}${de}>${vers}`
    });
    delete extra.enonce; delete extra.avant;
    return x;
  }

  // « Dans gigaoctet, que veut dire giga ? » ; « Quel préfixe veut dire un
  // millionième ? ». Les fausses : le préfixe voisin et le contraire.
  function sensP5(degre, p, rng) {
    const parNom = rng() < 0.5;
    const autres = melanger(rng, p.choix.slice(1));
    let choix;
    let phrase;
    let bonne;
    const pourquoi = {};
    if (parNom) {
      const mot = choisir(rng, MOT_P5[p.nom]);
      phrase = `Dans «${NB}${mot}${NB}», que veut dire ${p.nom}${NB}?`;
      choix = melanger(rng, [p.sens, ...autres]);
      bonne = p.sens;
      choix.forEach((c, k) => {
        if (c === bonne) return;
        const x = PREFIXES_GN.find(y => y.sens === c);
        pourquoi[k] = `${c[0].toUpperCase()}${c.slice(1)}, c'est ${x.nom}.`;
      });
    } else {
      phrase = `Quel préfixe veut dire ${p.sens}${NB}?`;
      const noms = [p, ...autres.map(c => PREFIXES_GN.find(y => y.sens === c))];
      choix = melanger(rng, noms.map(x => x.nom));
      bonne = p.nom;
      choix.forEach((c, k) => { if (c !== bonne) pourquoi[k] = `${c} veut dire ${PREFIXE_GN[c].sens}.`; });
    }
    const exemple = CARTE.typo({giga: "1 Go = 1 000 Mo", "méga": "1 Mo = 1 000 ko", micro: "1 mm = 1 000 µm", nano: "1 µm = 1 000 nm"}[p.nom]);
    return q({
      code: "P5", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "mots"}, choix, bon: choix.indexOf(bonne), pourquoi,
      reponse: bonne, reponseTexte: bonne, unite: null, resume: `${p.nom} veut dire ${p.sens}`,
      outil: "lignes", outilLignes: lignesSensP5([p.nom]), outilPetit: true, image: IMAGE_SENS_P5,
      correction: [`${p.nom} veut dire ${p.sens}.`, exemple], relationCle: `sens:${p.nom}`, sorteP5: "sens",
      donnees: {type: "sens-p5", prefixe: p.nom, par: parNom ? "nom" : "sens"}, cle: `P5:sens:${p.nom}:${parNom ? "n" : "s"}`
    });
  }

  // Une relation au choix (« 1 Mo = … ko » : 1 000, 100 ou 1 000 000 ;
  // « 1 nm = … µm » : 0,001, 1 000 ou 0,01).
  function choixP5(degre, de, vers, rng) {
    const x = questionP5(degre, "nombre", MILLE, de, vers);
    if (!x) return null;
    const rep = milli(x.reponse);
    const grand = exposant(de) > exposant(vers);
    const faux = grand ? [100n * MILLE, MILLE * 1000000n] : [MILLE * 1000n, 10n];
    const choix = melanger(rng, [rep, ...faux]).map(ecrire);
    const bon = choix.indexOf(ecrire(rep));
    const pourquoi = {};
    choix.forEach((c, k) => {
      if (k === bon) return;
      const y = milli(c.replace(new RegExp(FINE, "g"), ""));
      if (grand ? y > rep : y < rep) pourquoi[k] = CARTE.typo(grand ? "Un seul pas : × 1 000." : "Un seul pas : ÷ 1 000.");
      else if (!grand && y > MILLE) pourquoi[k] = `1${NB}${de} est plus petit que 1${NB}${vers}.`;
      else pourquoi[k] = CARTE.typo(`De ${de} à ${vers} : 1 000 fois.`);
    });
    const phrase = `1${NB}${de} = ${CASE}${NB}${vers}`;
    // (Sans la phrase sous le glisse-unité : la réponse dit déjà la
    // relation ; avec elle, la correction tombait à 80 % au petit iPhone
    // quand un problème était dans la série.)
    x.glisse = Object.assign({}, x.glisse, {phrase: null, phraseCourte: null});
    return Object.assign(x, {forme: "qcm", texte: phrase, morceaux: {phrase, apres: vers, sorte: "valeur"}, choix, bon, pourquoi,
      sorteP5: "choix", cle: `${x.cle}:q`});
  }

  // Relier trois préfixes à leur sens (« giga — milliard »). Degré 3 : deux
  // qui se confondent (micro et milli, méga et micro).
  function relierP5(degre, rng) {
    let trois;
    if (degre === 3) trois = melanger(rng, [PREFIXE_GN["micro"], PREFIXE_GN["milli"], choisir(rng, [PREFIXE_GN["méga"], PREFIXE_GN["nano"]])]);
    else trois = melanger(rng, PREFIXES_GN.filter(p => p.nom !== "kilo" && p.nom !== "milli")).slice(0, 3);
    let ordre = melanger(rng, [0, 1, 2]);
    while (ordre.every((k, j) => k === j)) ordre = melanger(rng, [0, 1, 2]);
    const court = x => x.sens.replace(/^un /, "");
    const mesures = ordre.map(k => court(trois[k]));
    const bonnes = trois.map((x, k) => ordre.indexOf(k));
    const consigne = "Relie chaque préfixe à son sens.";
    const lignes = trois.map(x => `${x.nom} : ${court(x)}`);
    return q({
      code: "P5", degre, forme: "associer", texte: `${consigne} ${trois.map(x => x.nom).join(" ; ")} — ${mesures.join(" ; ")}`,
      morceaux: {phrase: consigne, mots: true, longs: true}, objets: trois.map(x => ({texte: x.nom})), mesures, bonnes,
      reponse: bonnes.join(","), reponseTexte: lignes.join(" ; "), resume: lignes.join(" ; "),
      relation: lignes.join(" ; "), outil: "lignes", outilLignes: lignesSensP5(trois.map(x => x.nom)), outilPetit: true, image: IMAGE_SENS_P5,
      correction: lignes, relationCle: "relier", sorteP5: "associer",
      donnees: {type: "associer-p5", prefixes: trois.map(x => x.nom), mesures: mesures.slice()},
      cle: `P5:a:${trois.map(x => x.nom).sort().join("+")}`
    });
  }

  // « Quelle mesure est la plus grande ? » (degré 3) : une mesure dans la
  // grande unité, l'autre dans la petite avec un plus grand nombre (le
  // piège), 15 % d'écart au moins.
  const COMPARER_P5 = [["Go", "Mo", ["0,8", "1,2", "1,5", "2", "2,5", "3"]], ["Mo", "ko", ["0,6", "1,5", "2", "3,5", "4"]],
    ["µm", "nm", ["0,2", "0,5", "0,8", "1,5", "2"]], ["mm", "µm", ["0,3", "0,5", "0,8", "1,2"]], ["MW", "kW", ["0,8", "1,5", "2", "3"]],
    ["mg", "µg", ["0,5", "0,8", "1,5"]], ["mL", "µL", ["0,2", "0,5", "0,8"]]];
  function comparerP5(degre, rng) {
    const [G, p, valeurs] = choisir(rng, COMPARER_P5);
    const A = milli(choisir(rng, valeurs));
    const Af = A * 1000n;
    const k = choisir(rng, [0.6, 0.75, 0.8, 1.25, 1.5, 1.6]);
    const pas = Number(Af / MILLE) >= 1000 ? 100 : 50;
    const b = BigInt(Math.round((Number(Af / MILLE) * k) / pas) * pas);
    const B = b * MILLE;
    if (B <= A || B === Af) return null;
    const deux = melanger(rng, [[A, G], [B, p]]);
    const choix = deux.map(([v, u]) => mes(v, u));
    const grand = Af > B ? mes(A, G) : mes(B, p);
    const bon = choix.indexOf(grand);
    const phrase = `Quelle mesure est la plus grande${NB}?`;
    const grandeur = grandeurDe(G);
    const ligne = `${mes(A, G)} = ${mes(Af, p)}`;
    return q({
      code: "P5", degre, forme: "qcm", texte: `${phrase} ${choix.join(" ou ")}`, morceaux: {phrase, apres: "", sorte: "comparer-mes"},
      choix, bon, reponse: grand, reponseTexte: grand, unite: null,
      resume: `${ligne}${NB}; la plus grande : ${grand}`,
      // (Sans la phrase sous le glisse-unité : la correction tient au petit
      // téléphone avec une police large, 85 % avec elle.)
      relation: relationTexte(G, p), outil: "glisse-unite", glisse: Object.assign(glisseP5(A, G, p), {phrase: null, phraseCourte: null}), outilSansRelation: false,
      echelle: Object.assign(echelleP5(grandeur, [G, p]), {note: "J'écris les deux mesures dans la même unité."}),
      image: [UNITES_P5[grandeur].join(" · "), "J'écris les deux mesures dans la même unité."],
      correction: [ligne, `La plus grande : ${grand}`], pourquoi: {[1 - bon]: `${ligne}.`},
      // (Sous le glisse-unité, une ligne : « La plus grande : 4 400 ko » ; le
      // résumé sur deux lignes faisait tomber l'aide à 78 %.)
      ligneP6: `La plus grande : ${grand}`, vertP6: grand,
      grandeur, relationCle: `${G}-${p}:cmp`, sorteP5: "comparer",
      donnees: {type: "comparer-p5", a: brut(A), ua: G, b: brut(B), ub: p},
      cle: `P5:cmp:${brut(A)}${G}:${brut(B)}${p}`
    });
  }

  // Les situations (degré 2 et 3) : une seule conversion, une mesure vraie.
  // [modèle, énoncé, ce qu'on cherche, de, vers, valeurs]
  const SITUATIONS_P5 = [
    ["cle", "Une clé USB peut contenir {v}.", "Capacité :", "Go", "Mo", ["8", "16", "32", "64"]],
    ["telephone", "Un téléphone a {v} de mémoire.", "Mémoire :", "Go", "Mo", ["64", "128"]],
    ["photo", "Une photo du Piton de la Fournaise fait {v}.", "Taille :", "Mo", "ko", ["2", "3", "4", "2,5"]],
    ["chanson", "Une chanson fait {v}.", "Taille :", "Mo", "ko", ["3", "4", "5"]],
    ["film", "Un film fait {v}.", "Taille :", "Mo", "Go", ["700", "1200", "1500", "2500"]],
    ["cheveu", "Un cheveu a une épaisseur d'environ {v}.", "Épaisseur :", "µm", "mm", ["60", "70", "80"]],
    ["sable", "Un grain de sable de l'Hermitage mesure environ {v}.", "Taille :", "µm", "mm", ["200", "300", "500"]],
    ["bacterie", "Une bactérie mesure environ {v}.", "Longueur :", "µm", "nm", ["1", "2", "3"]],
    ["globule", "Un globule rouge mesure environ {v}.", "Diamètre :", "µm", "nm", ["7", "8"]],
    ["dengue", "Le virus de la dengue mesure environ {v}.", "Taille :", "nm", "µm", ["50"]],
    ["chik", "Le virus du chikungunya mesure environ {v}.", "Taille :", "nm", "µm", ["70"]],
    ["goutte", "Une goutte d'eau contient environ {v}.", "Contenance :", "µL", "mL", ["50"]],
    ["eolienne", "Une éolienne a une puissance de {v}.", "Puissance :", "MW", "kW", ["2", "3", "2,5"]],
    ["bouilloire", "Une bouilloire a une puissance de {v}.", "Puissance :", "W", "kW", ["1800", "2000", "2200"]]
  ];
  function situationP5(degre, rng) {
    const [modele, t, avant, de, vers, vs] = choisir(rng, SITUATIONS_P5);
    const v = milli(choisir(rng, vs));
    const enonce = remplirQ2(t, {v: mes(v, de)});
    return questionP5(degre, "nombre", v, de, vers, {enonce, avant, sorte: "situation", modele});
  }

  // Les problèmes (degré 3, deux pas, de tête) : la conversion cachée.
  // [modèle, énoncé, ce qu'on cherche, unité de la réponse, a, ua, b, ub, calcul]
  const PB_P5 = [
    ["chansons", "Il reste {a} libres. Une chanson fait {b}. Combien de chansons au plus ?", "Chansons :", "",
      [["1,5", "4"], ["2", "5"], ["1", "4"], ["1,2", "4"], ["3", "5"]], "Go", "Mo", "div"],
    ["photos", "Une clé USB de {a}. Une photo fait {b}. Combien de photos au plus ?", "Photos :", "",
      [["2", "4"], ["4", "5"], ["1", "2"], ["2", "5"]], "Go", "Mo", "div"],
    ["films", "Deux films : {a} et {b}. Combien de gigaoctets en tout ?", "En tout :", "Go",
      [["700", "1,3"], ["800", "1,7"], ["500", "1,5"], ["1200", "0,8"]], "Mo", "Go", "plus"],
    ["virus", "Un cheveu a {a} d'épaisseur, un virus {b}. Combien de virus côte à côte ?", "Virus :", "",
      [["80", "100"], ["60", "100"], ["80", "50"], ["70", "100"]], "µm", "nm", "div"],
    ["panneaux", "Un toit de Saint‑Pierre a {n} panneaux solaires de {b}. Combien de kW en tout ?", "En tout :", "kW",
      [["4", "250"], ["8", "250"], ["6", "500"], ["10", "300"]], "", "W", "fois"]
  ];
  function problemeP5(degre, rng) {
    const [modele, t, avant, uRep, valeurs, ua, ub, op] = choisir(rng, PB_P5);
    const [a, b] = choisir(rng, valeurs).map(milli);
    let rep;
    let lignes;
    if (op === "div") {
      const af = convertir(a, ua, ub);
      if (af % b !== 0n) return null;
      rep = (af / b) * MILLE;
      lignes = [`${mes(a, ua)} = ${mes(af, ub)}`, `${ecrire(af)} ÷ ${ecrire(b)} = ${ecrire(rep)}`];
    } else if (op === "plus") {
      const ag = convertir(a, ua, ub);
      rep = ag + b;
      lignes = [`${mes(a, ua)} = ${mes(ag, ub)}`, `${mes(ag, ub)} + ${mes(b, ub)} = ${mes(rep, ub)}`];
    } else {
      const total = (a / MILLE) * b;
      rep = convertir(total, ub, uRep);
      lignes = [`${ecrire(a)} × ${mes(b, ub)} = ${mes(total, ub)}`, `${mes(total, ub)} = ${mes(rep, uRep)}`];
    }
    if (!rep || rep <= 0n) return null;
    const enonce = remplirQ2(t, {a: mes(a, ua), b: mes(b, ub), n: ecrire(a)}).replace(/ \?$/, `${NB}?`);
    const reponseTexte = uRep ? mes(rep, uRep) : ecrire(rep);
    const grandeur = grandeurDe(ub);
    const conv = op === "fois" ? [ub, uRep] : [ua, ub];
    return q({
      code: "P5", degre, forme: "phrase", texte: `${enonce} ${avant} ${CASE}${uRep ? NB + uRep : ""}`,
      morceaux: {enonce, avant, apres: uRep, serre: true},
      reponse: brut(rep), reponseTexte, unite: uRep || null, resume: lignes[1], resumeVert: lignes[1],
      relation: relationTexte(...(exposant(conv[0]) > exposant(conv[1]) ? conv : [conv[1], conv[0]])), outil: "lignes",
      outilLignes: [relationTexte(...(exposant(conv[0]) > exposant(conv[1]) ? conv : [conv[1], conv[0]]))],
      noteOutil: "J'écris d'abord tout dans la même unité.",
      image: ["J'écris d'abord tout dans la même unité."], correction: lignes, grandeur, sorteP5: "pb", modeleP5: modele,
      // (La correction dans l'ordre : la conversion, puis le calcul, la
      // réponse en vert — comme P6.)
      lignesAvantP6: [lignes[0]], ligneP6: lignes[1], vertP6: reponseTexte,
      donnees: {type: "pb-p5", op, a: brut(a), ua, b: brut(b), ub, uRep},
      cle: `P5:pb:${modele}:${brut(a)}:${brut(b)}`
    });
  }

  // Les relations : un pas (« 1 Go = … Mo », « 1 nm = … µm ») ou deux pas
  // au degré 3 (« 1 m = … µm », « 1 Go = … ko »).
  function pairesP5(pas) {
    const l = [];
    Object.values(UNITES_P5).forEach(u => u.forEach((g, i) => { if (u[i + pas]) l.push([g, u[i + pas]]); }));
    return l;
  }
  // (Sans m → mm, g → mg, L → mL : déjà appris au CM1.)
  // (Les octets et les longueurs deux fois plus souvent ; les watts, sans
  // le gigawatt.)
  const UN_PAS_P5 = pairesP5(1).filter(([g]) => !["m", "g", "L", "GW"].includes(g))
    .flatMap(x => (["octet", "longueur"].includes(grandeurDe(x[0])) ? [x, x] : [x]));
  const DEUX_PAS_P5 = pairesP5(2).filter(([g, p]) => !(g === "Go" && p === "o") && !(g === "m" && p === "nm"));
  function tirerP5Brut(rng, degre, sorte) {
    if (sorte === "sens") return sensP5(degre, choisir(rng, PREFIXES_GN.filter(p => MOT_P5[p.nom])), rng);
    if (sorte === "associer") return relierP5(degre, rng);
    if (sorte === "comparer") return comparerP5(degre, rng);
    if (sorte === "situation") return situationP5(degre, rng);
    if (sorte === "pb") return problemeP5(degre, rng);
    if (sorte === "choix") { const [g, p] = choisir(rng, UN_PAS_P5); return rng() < 0.5 ? choixP5(degre, g, p, rng) : choixP5(degre, p, g, rng); }
    const ecrit = degre > 1 && rng() < 0.3 ? "phrase" : "nombre";
    if (sorte === "rel") {
      if (degre === 3) { const [g, p] = choisir(rng, DEUX_PAS_P5); return questionP5(degre, ecrit, MILLE, g, p, {sorte: "rel"}); }
      const [g, p] = choisir(rng, UN_PAS_P5);
      return degre === 1 ? questionP5(degre, ecrit, MILLE, g, p, {sorte: "rel"}) : questionP5(degre, ecrit, MILLE, p, g, {sorte: "rel"});
    }
    // « conv » : d1, un entier vers la petite unité (3 Go = 3 000 Mo) ;
    // d2, une virgule vers la petite (1,5 Go), ou un nombre rond vers la
    // grande (2 500 Mo = 2,5 Go) ; d3, vers la grande sans nombre rond
    // (350 nm = 0,35 µm ; 80 µm = 0,08 mm), ou deux pas (2 Go = 2 000 000 ko).
    const [g, p] = choisir(rng, UN_PAS_P5);
    if (degre === 1) return questionP5(degre, ecrit, BigInt(entre(rng, 2, 9)) * MILLE, g, p);
    if (degre === 2) {
      if (rng() < 0.5) return questionP5(degre, ecrit, BigInt(entre(rng, 11, 95)) * 100n, g, p);
      return questionP5(degre, ecrit, BigInt(entre(rng, 2, 9)) * 500n * MILLE + (rng() < 0.4 ? 0n : 0n), p, g);
    }
    if (rng() < 0.25) {
      const [G2, P2] = choisir(rng, DEUX_PAS_P5);
      return questionP5(degre, ecrit, BigInt(entre(rng, 2, 9)) * MILLE, G2, P2);
    }
    const n = BigInt(choisir(rng, [entre(rng, 11, 99) * 10, entre(rng, 2, 9) * 10, entre(rng, 101, 999)]));
    return questionP5(degre, ecrit, n * MILLE, p, g);
  }
  // (« 1 000 ng = … µg » est une relation : pas dans « conv ».)
  function tirerP5Conv(rng, degre, sorte) {
    const x = tirerP5Brut(rng, degre, sorte);
    return x && sorte === "conv" && x.reponse === "1" ? null : x;
  }
  const SORTES_P5 = {1: ["sens", "rel", "conv"], 2: ["rel", "conv", "choix", "situation", "associer"], 3: ["rel", "conv", "comparer", "situation", "pb"]};
  const PLACES_P5 = {
    valide: ["sens", "rel", "conv", "rel", "choix", "conv", "situation", "comparer", "conv", "pb|associer"],
    entraine: ["sens", "rel", "conv", "rel", "conv", "sens",
      "conv", "choix", "situation", "conv", "associer", "rel", "situation", "choix", "conv",
      "conv", "comparer", "pb", "rel", "situation", "comparer", "conv", "pb", "associer", "conv"],
    test: ["conv", "comparer|pb", "conv", "situation"],
    aide: ["rel", "conv", "conv"],
    retour: ["conv", "situation|choix"],
    echauffement: ["conv"]
  };
  // Les erreurs de P5 au pavé : celles des relations (le sens, le nombre
  // gardé, un zéro), plus deux pas au lieu d'un, et 1 024.
  function erreursP5(question, lu) {
    const d = question.donnees;
    if (!d) return null;
    if (d.type === "pb-p5") {
      const a = milli(d.a);
      const b = milli(d.b);
      if (d.op === "div" && b && (a * MILLE) % b === 0n && lu === (a * MILLE) / b) return {erreur: 6, retour: "J'écris d'abord la même unité."};
      if (d.op === "plus" && lu === a + b) return {erreur: 6, retour: "J'écris d'abord la même unité."};
      return null;
    }
    if (d.type !== "conv") return null;
    const v = milli(d.valeur);
    const attendu = milli(question.reponse);
    const bas = exposant(d.de) > exposant(d.vers);
    if (bas && lu === attendu * 1000n) return {erreur: 2, retour: "Un seul pas : × 1 000."};
    if (!bas && lu * 1000n === attendu) return {erreur: 2, retour: "Un seul pas : ÷ 1 000."};
    // (Le nombre gardé : une phrase courte, une ligne au petit téléphone.)
    if (lu === v) return {erreur: 4, retour: CARTE.typo(bas ? "Le nombre change : × 1 000." : "Le nombre change : ÷ 1 000.")};
    // (Deux pas : « 7 m = … µm », 0,007 tapé.)
    if (bas && lu < v) return {erreur: 1, retour: "Tu as divisé. Vers une unité plus petite, je multiplie."};
    if (!bas && lu > v) return {erreur: 3, retour: "Tu as multiplié. Vers une unité plus grande, je divise."};
    if (bas && ["Go", "Mo", "ko"].includes(d.de) && lu === v * 1024n) return {erreur: 2, retour: `Ici, 1${NB}${d.de} = 1${FINE}000${NB}${d.vers}.`};
    return erreursRel(question, lu);
  }
  ETAPES.P5 = {
    // On te montre : 1 Go = 1 000 Mo, 1 µm = 1 000 nm, 1,5 Go = 1 500 Mo
    // (le brevet).
    clesExemples: ["P5:1000Go>Mo", "P5:1000µm>nm", "P5:1500Go>Mo"],
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || choisir(rng, SORTES_P5[degre]);
      for (let essai = 0; essai < 30; essai += 1) {
        const x = tirerP5Conv(rng, degre, sorte);
        if (x) return x;
      }
      return null;
    },
    formes(usage, rng) {
      const p = PLACES_P5[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    // Dans Je valide : une même relation, une même situation, une fois ;
    // ailleurs, pas deux fois la même relation à trois questions près.
    accepte(serie, question, usage) {
      if (question.modeleP5 && (usage === "valide" || usage === "test") && serie.some(x => x.modeleP5 === question.modeleP5)) return false;
      return uneRelationUneFois(serie, question, usage);
    },
    // Dans Je valide : les octets et une autre grandeur au moins.
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const g = new Set(serie.map(x => x.grandeur).filter(Boolean));
      return g.has("octet") && g.size >= 3;
    },
    erreurs(question, lu) { return erreursP5(question, lu); }
  };

  // P6 · Les préfixes en puissances de 10 (3e). Attendus de 4e : 3 µL =
  // 3 × 10⁻⁶ L, 7 Mm = 7 × 10⁶ m ; S097 p. 17 : 1 200 = 1,2 × 10³ ; p. 20 :
  // l'électron et le proton ; repères de 3e : 1 m³ = (10² cm)³ = 10⁶ cm³.
  // Choix de Gwenaël du 21/11 : l'outil est la bande des 7 préfixes par
  // 1 000 avec leur puissance de 10 ; l'exposant s'écrit dans une case
  // levée au-dessus du 10, et le pavé a « − » à la place de la virgule.
  const SUP = {"-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹"};
  const puiss = e => `10${String(e).split("").map(c => SUP[c]).join("")}`;
  const moins = e => (e < 0 ? `−${-e}` : String(e));
  const BASES_P6 = {m: ["Mm", "km", "mm", "µm", "nm"], g: ["kg", "mg", "µg", "ng"], L: ["mL", "µL"], o: ["Go", "Mo", "ko"], W: ["GW", "MW", "kW"]};
  const BASE_DE = {};
  Object.entries(BASES_P6).forEach(([b, l]) => l.forEach(u => { BASE_DE[u] = b; }));
  const prefDe = u => PREFIXE_GN[u.slice(0, u.length - BASE_DE[u].length)];
  // La bande de l'outil : la base, les préfixes marqués.
  const bandeP6 = (base, marque, extra = {}) => Object.assign({base, marque}, extra);
  const IMAGE_P6 = CARTE.typo("D'une case à l'autre : × 10³.");

  // « 1 µm = 10^… m » ; « 3 µL = 3 × 10^… L » ; « 1 km = 10^… mm ».
  function puissP6(degre, n, u, vers, sorte) {
    const e = exposant(u) - exposant(vers);
    const avant = n === 1 ? `1${NB}${u} =` : `${ecrire(milli(n))}${NB}${u} = ${ecrire(milli(n))}${NB}×`;
    const reponseTexte = `${n === 1 ? "" : `${ecrire(milli(n))}${NB}×${NB}`}${puiss(e)}${NB}${vers}`;
    const resume = `${n === 1 ? `1${NB}${u}` : `${ecrire(milli(n))}${NB}${u}`} = ${reponseTexte}`;
    const deuxPref = Boolean(BASE_DE[vers]);
    const marque = [u, vers].filter(x => BASE_DE[x] && BASE_DE[x] !== x).map(x => prefDe(x).sym);
    const base = BASE_DE[u];
    const e1 = deuxPref ? exposant(u) - exposant(base) : e;
    const l1 = deuxPref ? `1${NB}${u} = ${puiss(e1)}${NB}${base} = ${puiss(e)}${NB}${vers}` : `1${NB}${u} = ${puiss(e)}${NB}${vers}`;
    const lignes = n === 1 ? [l1] : [l1, `donc ${resume}`];
    return q({
      code: "P6", degre, forme: "exposant", texte: `${avant} 10^${CASE} ${vers}`, morceaux: {avant, apres: vers, exposant: true},
      reponse: moins(e), reponseTexte: n === 1 ? `${puiss(e)}${NB}${vers}` : reponseTexte, unite: vers, resume,
      outil: "bande-p", bandeP: bandeP6(base, marque), image: [IMAGE_P6],
      correction: lignes, ligneP6: lignes[lignes.length - 1], vertP6: n === 1 ? `${puiss(e)}${NB}${vers}` : reponseTexte, lignesAvantP6: lignes.slice(0, -1),
      grandeur: grandeurDe(u), relationCle: `p6:${u}-${vers}`, sorteP6: sorte,
      donnees: {type: "exposant", n: String(n), de: u, vers, sorte}, cle: `P6:${sorte}:${n}${u}>${vers}`
    });
  }
  // « 5 µm = … m » : 5 × 10⁻⁶ m, 5 × 10⁶ m ou 5 × 10⁻³ m (le sens, le
  // préfixe voisin).
  const NOM_E = {9: "giga", 6: "méga", 3: "kilo", "-3": "milli", "-6": "micro", "-9": "nano"};
  function ecritureP6(degre, n, u, rng) {
    const base = BASE_DE[u];
    const e = exposant(u) - exposant(base);
    const voisin = e > 0 ? (e === 3 ? 6 : e - 3) : (e === -3 ? -6 : e + 3);
    const es = melanger(rng, [e, -e, voisin]);
    const t = x => `${ecrire(milli(n))}${NB}×${NB}${puiss(x)}${NB}${base}`;
    const choix = es.map(t);
    const bon = es.indexOf(e);
    const pourquoi = {};
    es.forEach((x, k) => { if (k !== bon) pourquoi[k] = `${puiss(x)}, c'est ${NOM_E[x]}.`; });
    const phrase = `${ecrire(milli(n))}${NB}${u} = ${CASE}`;
    const ligne = `1${NB}${u} = ${puiss(e)}${NB}${base}, donc ${ecrire(milli(n))}${NB}${u} = ${t(e)}`;
    return q({
      code: "P6", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "puissances"}, choix, bon, pourquoi,
      reponse: choix[bon], reponseTexte: choix[bon], unite: null, resume: `${ecrire(milli(n))}${NB}${u} = ${choix[bon]}`,
      outil: "bande-p", bandeP: bandeP6(base, [prefDe(u).sym]), image: [IMAGE_P6],
      correction: [ligne], ligneP6: ligne, vertP6: t(e), grandeur: grandeurDe(u), relationCle: `p6:${u}-${base}`, sorteP6: "ecriture",
      donnees: {type: "ecriture-p6", n: String(n), de: u, e}, cle: `P6:ecr:${n}${u}`
    });
  }
  // « 10⁻⁶ m = 1 … » : µm, mm ou nm.
  function prefixeP6(degre, u, rng) {
    const base = BASE_DE[u];
    const autres = BASES_P6[base].filter(x => x !== u);
    const voisins = autres.sort((a, b) => Math.abs(exposant(a) - exposant(u)) - Math.abs(exposant(b) - exposant(u))).slice(0, 2);
    if (voisins.length < 2) return null;
    const choix = melanger(rng, [u, ...voisins]);
    const e = exposant(u) - exposant(base);
    const bon = choix.indexOf(u);
    const pourquoi = {};
    choix.forEach((x, k) => { if (k !== bon) pourquoi[k] = `1${NB}${x} = ${puiss(exposant(x) - exposant(base))}${NB}${base}.`; });
    const phrase = `${puiss(e)}${NB}${base} = 1${NB}${CASE}`;
    const ligne = `${prefDe(u).nom} : ${puiss(e)}, donc ${puiss(e)}${NB}${base} = 1${NB}${u}`;
    return q({
      code: "P6", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "unites"}, choix, bon, pourquoi,
      reponse: u, reponseTexte: `1${NB}${u}`, unite: null, resume: `${puiss(e)}${NB}${base} = 1${NB}${u}`,
      outil: "bande-p", bandeP: bandeP6(base, []), image: [IMAGE_P6],
      correction: [ligne], ligneP6: ligne, vertP6: `1${NB}${u}`, grandeur: grandeurDe(u), relationCle: `p6:${u}-${base}`, sorteP6: "prefixe",
      donnees: {type: "prefixe-p6", de: u, e}, cle: `P6:pref:${u}`
    });
  }
  // « 1 200 m = 1,2 × 10^… m » (S097 p. 17) ; des grandeurs vraies de La
  // Réunion et de l'espace. [énoncé ou null, valeur, mantisse, exposant, unité]
  // (L'énoncé dit ce qu'on mesure ; le nombre est sur la ligne de la case.)
  const GRANDS_P6 = [
    ["L'altitude du Piton de la Fournaise :", "2632", "2,632", 3, "m"],
    ["L'altitude du Piton des Neiges :", "3070", "3,07", 3, "m"],
    ["L'aire de La Réunion, environ :", "2500", "2,5", 3, "km²"],
    ["Du Soleil à la Terre, environ :", "150000000", "1,5", 8, "km"],
    ["De la Terre à la Lune, environ :", "384000", "3,84", 5, "km"],
    ["Le tour de La Réunion, environ :", "210", "2,1", 2, "km"]
  ];
  const MANTISSES_P6 = ["1,2", "2,5", "4,5", "3,6", "7,2", "1,25", "6,4"];
  function grandP6(degre, rng) {
    let enonce = null;
    let v;
    let m;
    let e;
    let u;
    if (degre === 3 || rng() < 0.35) {
      const [t, vv, mm, ee, uu] = choisir(rng, GRANDS_P6);
      [v, m, e, u] = [vv, mm, ee, uu];
      enonce = t.replace(/ :$/, `${NB}:`);
    } else {
      m = choisir(rng, MANTISSES_P6);
      e = degre === 1 ? 3 : choisir(rng, [3, 4, 5]);
      u = choisir(rng, ["m", "g", "L"]);
      const [ent, dec = ""] = m.split(",");
      v = (ent + dec).padEnd(ent.length + e, "0");
    }
    const V = `${ecrire(milli(v))}${NB}${u}`;
    const avant = `${V} = ${m}${NB}×`;
    const resume = `${V} = ${m}${NB}×${NB}${puiss(e)}${NB}${u}`;
    const zeros = (v.match(/0+$/) || [""])[0].length;
    const lignes = [`${ecrire(milli(v))} = ${m} × ${ecrire(milli(String(10 ** e)))}`, `donc ${resume}`];
    return q({
      code: "P6", degre, forme: "exposant", texte: `${enonce ? `${enonce} ` : ""}${avant} 10^${CASE} ${u}`,
      morceaux: Object.assign({avant, apres: u, exposant: true}, enonce ? {enonce, serre: true} : {}),
      reponse: moins(e), reponseTexte: `${m}${NB}×${NB}${puiss(e)}${NB}${u}`, unite: u, resume,
      outil: "lignes", outilLignes: ["10² = 100 ; 10³ = 1 000", "10⁶ = 1 000 000"].map(CARTE.typo), noteOutil: "Je compte les rangs de la virgule.",
      image: ["Je compte les rangs de la virgule."],
      correction: lignes, ligneP6: resume, vertP6: `${m}${NB}×${NB}${puiss(e)}${NB}${u}`, lignesAvantP6: [lignes[0]],
      grandeur: null, sorteP6: "grand", modeleP6: enonce ? `g:${v}` : null, zerosP6: zeros,
      donnees: {type: "exposant", sorte: "grand", v, m, e}, cle: `P6:g:${v}${u}`
    });
  }
  // Comparer (degré 3) : une mesure avec un préfixe et une en puissance de
  // 10 (le plus grand nombre n'est pas la plus grande) ; l'électron et le
  // proton (S097 p. 20).
  const CMP_P6 = {m: "Quelle longueur est la plus grande ?", g: "Quelle masse est la plus grande ?", o: "Quel fichier est le plus gros ?"};
  function comparerP6(degre, rng) {
    if (rng() < 0.25) {
      const enonce = `Électron : 9,1${NB}×${NB}10⁻³¹${NB}kg. Proton : 1,7${NB}×${NB}10⁻²⁷${NB}kg.`;
      const consigne = `Le plus lourd${NB}?`;
      const choix = melanger(rng, ["L'électron", "Le proton"]);
      const bon = choix.indexOf("Le proton");
      return q({
        code: "P6", degre, forme: "qcm", texte: `${enonce} ${consigne}`, morceaux: {enonce, consigne, serre: true, sorte: "comparer"}, choix, bon,
        pourquoi: {[1 - bon]: "10⁻³¹ est plus petit que 10⁻²⁷."}, reponse: "Le proton", reponseTexte: "Le proton", unite: null,
        resume: "Le plus lourd : le proton", outil: "lignes", outilLignes: ["Les deux en kg : je compare", "les exposants, −31 et −27."],
        image: ["Je compare d'abord les exposants."],
        correction: ["10⁻²⁷ > 10⁻³¹", "Le plus lourd : le proton"], ligneP6: "Le plus lourd : le proton", vertP6: "le proton",
        lignesAvantP6: ["10⁻²⁷ > 10⁻³¹"], grandeur: "masse", sorteP6: "comparer", modeleP6: "electron",
        donnees: {type: "comparer-p6", electron: true}, cle: "P6:cmp:electron"
      });
    }
    const base = choisir(rng, ["m", "m", "g", "o"]);
    const u = choisir(rng, BASES_P6[base].filter(x => x !== "Mm"));
    const e = exposant(u) - exposant(base);
    const na = entre(rng, 2, 9);
    const nb = entre(rng, 2, 9);
    if (na === nb) return null;
    // L'autre en puissance de 10 : 3 crans de plus ou de moins ; le plus
    // grand nombre est du côté de la plus petite mesure.
    const eb = rng() < 0.5 ? e - 3 : e + 3;
    if (Math.abs(eb) > 9 || eb === 0) return null;
    const A = `${na}${NB}${u}`;
    const B = `${nb}${NB}×${NB}${puiss(eb)}${NB}${base}`;
    const aGrand = e > eb;
    if ((aGrand && na > nb) || (!aGrand && nb > na)) return null;
    const choix = melanger(rng, [A, B]);
    const grand = aGrand ? A : B;
    const bon = choix.indexOf(grand);
    const ligneA = `${A} = ${na}${NB}×${NB}${puiss(e)}${NB}${base}`;
    const phrase = CMP_P6[base].replace(" ?", `${NB}?`);
    return q({
      code: "P6", degre, forme: "qcm", texte: `${phrase} ${choix.join(" ou ")}`, morceaux: {phrase, apres: "", sorte: "comparer-mes"}, choix, bon,
      pourquoi: {[1 - bon]: `${puiss(Math.max(e, eb))} est plus grand que ${puiss(Math.min(e, eb))}.`},
      reponse: grand, reponseTexte: grand, unite: null, resume: `${ligneA}${NB}; ${base === "o" ? "le plus gros" : "la plus grande"} : ${grand}`,
      outil: "bande-p", bandeP: bandeP6(base, [prefDe(u).sym]), image: ["Je compare d'abord les exposants."],
      correction: [ligneA, `${base === "o" ? "Le plus gros" : "La plus grande"} : ${grand}`], ligneP6: `${base === "o" ? "Le plus gros" : "La plus grande"} : ${grand}`, vertP6: grand, lignesAvantP6: [ligneA],
      grandeur: grandeurDe(u), relationCle: `p6:${u}-${base}`, sorteP6: "comparer",
      donnees: {type: "comparer-p6", na, u, nb, eb, base}, cle: `P6:cmp:${na}${u}:${nb}e${eb}`
    });
  }
  // Les aires et les volumes en puissances de 10 (repères de 3e : 1 m =
  // 10² cm, donc 1 m³ = (10² cm)³ = 10⁶ cm³). [de, vers, la relation des
  // longueurs, exposant de la longueur, 2 ou 3]
  const VOLUMES_P6 = [["m³", "cm³", "1 m = 10² cm", 2, 3], ["m³", "dm³", "1 m = 10¹ dm", 1, 3], ["dm³", "m³", "1 dm = 10⁻¹ m", -1, 3],
    ["cm³", "m³", "1 cm = 10⁻² m", -2, 3], ["m²", "cm²", "1 m = 10² cm", 2, 2], ["km²", "m²", "1 km = 10³ m", 3, 2]];
  function volumeP6(degre, rng) {
    const [de, vers, rel, k, d] = choisir(rng, VOLUMES_P6);
    const e = k * d;
    const p = puiss(k);
    const produit = `${Array(d).fill(p).join(" × ")}${NB}${vers}`;
    const resume = `1${NB}${de} = ${puiss(e)}${NB}${vers}`;
    const lignes = [`1${NB}${de} = ${produit}`, `= ${puiss(e)}${NB}${vers}`];
    return q({
      code: "P6", degre, forme: "exposant", texte: `1${NB}${de} = 10^${CASE} ${vers}`, morceaux: {avant: `1${NB}${de} =`, apres: vers, exposant: true},
      reponse: moins(e), reponseTexte: `${puiss(e)}${NB}${vers}`, unite: vers, resume,
      outil: "lignes", outilLignes: [rel.replace(/ /g, NB).replace(`${NB}=${NB}`, " = "), `1${NB}${de} = ${produit}`], noteOutil: "J'ajoute les exposants.",
      image: [rel.replace(/ /g, NB).replace(`${NB}=${NB}`, " = ")],
      correction: lignes, ligneP6: resume, vertP6: `${puiss(e)}${NB}${vers}`, lignesAvantP6: [lignes[0]],
      grandeur: d === 3 ? "volume" : "aire", relationCle: `p6:${de}-${vers}`, sorteP6: "volume", dimP6: d, kP6: k,
      donnees: {type: "exposant", sorte: "volume", de, vers, e}, cle: `P6:v:${de}>${vers}`
    });
  }
  const UNITES_P6 = {1: ["km", "mm", "kg", "mg", "mL", "ko", "kW", "Mo", "µm"], 2: ["Mm", "km", "mm", "µm", "nm", "kg", "mg", "µg", "ng", "mL", "µL", "Go", "Mo", "ko", "GW", "MW", "kW"]};
  const DEUX_PREF_P6 = [["km", "mm"], ["mm", "km"], ["µm", "mm"], ["nm", "µm"], ["mm", "µm"], ["Go", "ko"], ["ko", "Mo"], ["mg", "µg"], ["ng", "µg"], ["MW", "kW"], ["km", "µm"]];
  function tirerP6Brut(rng, degre, sorte) {
    const u = choisir(rng, UNITES_P6[degre === 1 ? 1 : 2]);
    if (sorte === "puiss") {
      if (degre === 3) { const [a, b] = choisir(rng, DEUX_PREF_P6); return puissP6(degre, 1, a, b, "puiss"); }
      return puissP6(degre, 1, u, BASE_DE[u], "puiss");
    }
    if (sorte === "mantisse") {
      const n = entre(rng, 2, 9);
      if (degre === 3 && rng() < 0.5) { const [a, b] = choisir(rng, DEUX_PREF_P6.filter(([x]) => x !== "km" || true)); return puissP6(degre, n, a, b, "mantisse"); }
      return puissP6(degre, n, u, BASE_DE[u], "mantisse");
    }
    if (sorte === "ecriture") return ecritureP6(degre, entre(rng, 2, 9), u, rng);
    if (sorte === "prefixe") return prefixeP6(degre, u, rng);
    if (sorte === "grand") return grandP6(degre, rng);
    if (sorte === "comparer") return comparerP6(degre, rng);
    if (sorte === "volume") return volumeP6(degre, rng);
    return null;
  }
  const SORTES_P6 = {1: ["puiss", "prefixe", "ecriture"], 2: ["puiss", "mantisse", "grand", "prefixe", "ecriture"], 3: ["puiss", "mantisse", "comparer", "volume", "grand"]};
  const PLACES_P6 = {
    valide: ["puiss", "puiss", "prefixe", "puiss", "mantisse", "ecriture", "grand", "mantisse", "comparer", "volume|puiss"],
    entraine: ["puiss", "puiss", "prefixe", "puiss", "ecriture", "puiss",
      "puiss", "mantisse", "grand", "prefixe", "puiss", "ecriture", "mantisse", "grand", "puiss",
      "puiss", "comparer", "mantisse", "volume", "grand", "puiss", "comparer", "mantisse", "volume", "puiss"],
    test: ["mantisse", "comparer|volume", "puiss", "grand"],
    aide: ["puiss", "mantisse", "puiss"],
    retour: ["puiss|mantisse", "ecriture|grand"],
    echauffement: ["puiss"]
  };
  // Le pourquoi d'un exposant faux (une ligne au petit téléphone) : le
  // signe, un cran au lieu de trois, un seul des deux préfixes, les zéros
  // comptés au lieu des rangs, le carré ou le cube oublié.
  function erreursP6(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "exposant") return null;
    const e = Number(question.reponse.replace("−", "-"));
    if (d.sorte === "grand") {
      if (lu === -e) return {erreur: 1, retour: "Grand nombre : pas de signe −."};
      if (lu === question.zerosP6 && lu !== e && lu > 0 && lu < 5) return {erreur: 4, retour: `${d.m} × ${puiss(lu)} = ${ecrire(milli(d.m) * 10n ** BigInt(lu))}.`};
      return null;
    }
    if (d.sorte === "volume") {
      if (lu === -e) return {erreur: 1, retour: `1${NB}${d.de} est plus ${e > 0 ? "grand" : "petit"} que 1${NB}${d.vers}.`};
      if (lu === question.kP6) return {erreur: 4, retour: question.dimP6 === 3 ? "Un cube : l'exposant × 3." : "Un carré : l'exposant × 2."};
      return null;
    }
    if (lu === -e && e !== 0) return {erreur: 1, retour: `1${NB}${d.de} est plus ${e > 0 ? "grand" : "petit"} que 1${NB}${d.vers}.`};
    if (e % 3 === 0 && lu * 3 === e) return {erreur: 2, retour: `Chaque case : × 10³, pas × 10.`};
    if (BASE_DE[d.vers] !== d.vers && BASE_DE[d.de]) {
      const b = BASE_DE[d.de];
      if (lu === exposant(d.de) - exposant(b) || lu === exposant(b) - exposant(d.vers)) return {erreur: 3, retour: `De ${d.de} à ${b}, puis de ${b} à ${d.vers}.`};
    }
    return null;
  }
  ETAPES.P6 = {
    // On te montre : 1 km = 10³ m, 1 nm = 10⁻⁹ m, 3 µL = 3 × 10⁻⁶ L.
    clesExemples: ["P6:puiss:1km>m", "P6:puiss:1nm>m", "P6:mantisse:3µL>L"],
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || choisir(rng, SORTES_P6[degre]);
      for (let essai = 0; essai < 30; essai += 1) {
        const x = tirerP6Brut(rng, degre, sorte);
        if (x) return x;
      }
      return null;
    },
    formes(usage, rng) {
      const p = PLACES_P6[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    accepte(serie, question, usage) {
      if (question.modeleP6 && (usage === "valide" || usage === "test") && serie.some(x => x.modeleP6 === question.modeleP6)) return false;
      return uneRelationUneFois(serie, question, usage);
    },
    // Dans Je valide : des exposants positifs et négatifs.
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const ex = serie.filter(x => x.forme === "exposant").map(x => x.reponse);
      return ex.some(r => r.startsWith("−")) && ex.some(r => !r.startsWith("−"));
    },
    erreurs(question, lu) { return erreursP6(question, lu); }
  };

  // ============================================ lot B6-3 : Q9 (4e, 3e)
  // « Problèmes : vitesses, débits et masses volumiques ». Programme de 4e
  // (débits m³/s ↔ L/min) et de 3e (m³/s ↔ L/h) ; S097 p. 40-43 : le
  // changement d'unité est une situation de proportionnalité (le tableau à
  // deux lignes, l'unité écrite) ; €/kg, €/L, €/m, la consommation ; le bus
  // de Clotilde lu sur un graphique en km et min. Brevet : la bougie (cire à
  // 0,7 g/cm³), le béton, la médaille, les granulés (750 kg/m³), le bassin
  // (112 m³ à 4 m³/h), le colis le plus dense, l'écran de 50 pouces ;
  // 3 h 20 min n'est pas 3,2 h. Évaluations nationales de 4e : la douche,
  // « trois fois plus rapide ».
  // Choix de Gwenaël du 21/11 (maquette sur la vraie page) : l'outil est le
  // tableau de proportionnalité (deux lignes, une par grandeur, « × k » sur
  // un arc au-dessus et au-dessous ; trois colonnes, le retour à l'unité,
  // quand le rapport n'est pas entier) ; l'image, le tableau sans « × k » ;
  // le graphique du bus aux degrés 2 et 3 ; sans calculatrice (des nombres
  // de tête), et de temps en temps un vrai nombre de brevet : « Quel
  // calcul ? ».
  //
  // Une unité : [facteur (p / q) vers l'unité de base de sa grandeur,
  // grandeur]. La base : la seconde, le millilitre, le gramme, le
  // millimètre, l'euro.
  const U9 = {
    s: [1n, 1n, "duree"], min: [60n, 1n, "duree"], h: [3600n, 1n, "duree"], j: [86400n, 1n, "duree"],
    mL: [1n, 1n, "volume"], cL: [10n, 1n, "volume"], L: [1000n, 1n, "volume"], "cm³": [1n, 1n, "volume"], "dm³": [1000n, 1n, "volume"],
    "m³": [1000000n, 1n, "volume"],
    g: [1n, 1n, "masse"], kg: [1000n, 1n, "masse"], t: [1000000n, 1n, "masse"],
    mm: [1n, 1n, "longueur"], cm: [10n, 1n, "longueur"], m: [1000n, 1n, "longueur"], km: [1000000n, 1n, "longueur"],
    pouce: [254n, 10n, "longueur"], mille: [1852000n, 1n, "longueur"],
    "€": [1n, 1n, "prix"]
  };
  const NOMS_U9 = {s: "secondes", min: "minutes", h: "heures", L: "litres", mL: "millilitres", cL: "centilitres", "m³": "m³", g: "grammes",
    kg: "kilogrammes", t: "tonnes", cm: "centimètres", km: "kilomètres", m: "mètres", "€": "euros"};
  const NOMS_LIGNE_Q9 = {duree: "Durée", volume: "Volume", masse: "Masse", longueur: "Distance", prix: "Prix"};
  // L'unité écrite (« 1 pouce », « 50 pouces »).
  const symQ9 = (u, m) => (u === "pouce" ? (m > MILLE ? "pouces" : "pouce") : u === "mille" ? (m > MILLE ? "milles" : "mille") : u);
  const mesQ9 = (m, u) => `${ecrire(m)}${NB}${symQ9(u, m)}`;
  // m (en u) vers v : exact, ou null.
  function convQ9(m, u, v) {
    const [p1, q1] = U9[u];
    const [p2, q2] = U9[v];
    const n = m * p1 * q2;
    const d = q1 * p2;
    return n % d === 0n ? n / d : null;
  }
  const pgcdQ9 = (a, b) => (b === 0n ? a : pgcdQ9(b, a % b));
  // « 1 h = 60 min », « 1 m³ = 1 000 L » : de la grande unité à la petite.
  function relQ9(u, v) {
    const [g, p] = U9[u][0] * U9[v][1] > U9[v][0] * U9[u][1] ? [u, v] : [v, u];
    const f = convQ9(MILLE, g, p);
    return f === null ? null : `1${NB}${symQ9(g, MILLE)} = ${mesQ9(f, p)}`;
  }
  function relVirgule(u, v) {
    const [g, p] = U9[u][0] * U9[v][1] > U9[v][0] * U9[u][1] ? [u, v] : [v, u];
    const f = convQ9(MILLE, g, p);
    return `1${NB}${symQ9(g, MILLE)}, c'est ${mesQ9(f, p)}.`;
  }

  // La question finie. spec : {sorte, degre, modele, enonce, avant, apres
  // (l'unité de la case), taux: [[n, un], [d, ud]] (n un pour d ud), x: [v,
  // u] (ce qu'on donne), cherche (l'unité de la réponse), noms (les deux
  // lignes du tableau, si ce ne sont pas les grandeurs), nus (des nombres
  // sans unité dans le tableau : le pouce), relation, suffixe (« en 1 h »),
  // figure, fautes}.
  function finirQ9(spec) {
    const {sorte, degre, taux, x, cherche} = spec;
    const [n, un] = [milli(taux[0][0]), taux[0][1]];
    const [d, ud] = [milli(taux[1][0]), taux[1][1]];
    const [xv, xu] = [milli(x[0]), x[1]];
    const g = U9[xu][2];
    // La ligne 1 : la grandeur donnée ; la ligne 2 : celle qu'on cherche.
    const [r1, u1, r2b, u2b] = U9[ud][2] === g ? [d, ud, n, un] : [n, un, d, ud];
    // (La ligne 2 dans l'unité de la réponse quand elle est plus petite :
    // « 60 min ÷ 5 », « 2 000 L × 60 », pas « 1 h ÷ 5 = 0,2 h ».)
    const plusPetite = U9[cherche][0] * U9[u2b][1] < U9[u2b][0] * U9[cherche][1];
    // L'unité commune de la ligne 1 : la plus petite des deux.
    const c = U9[u1][0] * U9[xu][1] <= U9[xu][0] * U9[u1][1] ? u1 : xu;
    const a1 = convQ9(r1, u1, c);
    const a2 = convQ9(xv, xu, c);
    if (a1 === null || a2 === null || a1 === a2) return null;
    // (Lot B6-3c : deux conversions, « 1 min = 60 s » et « 1 m³ = 1 000 L ».
    // La ligne 2 reste dans l'unité donnée quand le calcul tombe juste ; la
    // ligne de calcul finit par la seconde, « 5 m³ × 60 = 300 m³ =
    // 300 000 L », comme « 100 m × 60 = 6 000 m = 6 km ». Avec les deux dans
    // l'étiquette, la correction passait à 79 % au petit iPhone.)
    const deux = u1 !== xu && u2b !== cherche;
    const justeEn = u => {
      const rr = convQ9(r2b, u2b, u);
      if (rr === null || (rr * a2) % a1 !== 0n) return false;
      if (a2 % a1 !== 0n && a1 % a2 !== 0n && rr % (a1 / pgcdQ9(a1, a2)) !== 0n) return false;
      return convQ9((rr * a2) / a1, u, cherche) !== null;
    };
    const u2 = plusPetite && convQ9(r2b, u2b, cherche) !== null && !(deux && justeEn(u2b)) ? cherche : u2b;
    const r2 = convQ9(r2b, u2b, u2);
    // La case cherchée, dans l'unité de la ligne 2, puis dans celle de la réponse.
    if ((r2 * a2) % a1 !== 0n) return null;
    const rep2 = (r2 * a2) / a1;
    const rep = convQ9(rep2, u2, cherche);
    if (rep === null || rep <= 0n || rep % 1n !== 0n) return null;
    // Le passage d'une colonne à l'autre : × k, ÷ k, ou (degré 3) le retour
    // à l'unité, « ÷ 4 » puis « × 7 ».
    let colonnes;
    let fleches;
    let calcul;
    const nb = v => ecrire(v);
    if (a2 % a1 === 0n) {
      const k = a2 / a1;
      colonnes = [[a1, a2], [r2, null]];
      fleches = [`×${NB}${nb(k * MILLE)}`];
      calcul = `${mesQ9(r2, u2)} × ${nb(k * MILLE)}`;
    } else if (a1 % a2 === 0n) {
      const k = a1 / a2;
      colonnes = [[a1, a2], [r2, null]];
      fleches = [`÷${NB}${nb(k * MILLE)}`];
      calcul = `${mesQ9(r2, u2)} ÷ ${nb(k * MILLE)}`;
    } else {
      const p = pgcdQ9(a1, a2);
      const m1 = a1 / p;
      const m2 = a2 / p;
      if (m1 > 12n || m2 > 20n || r2 % m1 !== 0n) return null;
      colonnes = [[a1, p, a2], [r2, r2 / m1, null]];
      fleches = [`÷${NB}${nb(m1 * MILLE)}`, `×${NB}${nb(m2 * MILLE)}`];
      calcul = `${mesQ9(r2, u2)} ÷ ${nb(m1 * MILLE)} × ${nb(m2 * MILLE)}`;
    }
    const cel = (v, u) => (spec.nus ? nb(v) : mesQ9(v, u));
    const noms = spec.noms || [NOMS_LIGNE_Q9[g], NOMS_LIGNE_Q9[U9[u2][2]]];
    const tableauQ = {
      noms,
      lignes: [colonnes[0].map(v => cel(v, c)), colonnes[1].map(v => (v === null ? null : cel(v, u2)))],
      fleches,
      rep: cel(rep2, u2)
    };
    // La conversion, dans l'étiquette jaune (« 1 h = 60 min »).
    const rels = [];
    if (u1 !== xu) rels.push(relQ9(u1, xu));
    if (u2b !== cherche) rels.push(relQ9(u2b, cherche));
    const relation = spec.relation !== undefined ? spec.relation : rels.filter(Boolean).join(" · ") || null;
    // (Dans la correction, la seconde conversion est déjà au bout de la
    // ligne de calcul : l'étiquette ne garde que la première.)
    const relationCorr = spec.relation !== undefined || u2 === cherche || rels.filter(Boolean).length < 2 ? relation : rels.filter(Boolean)[0];
    // (Dans l'outil, la première est dans le tableau, « 1 s | 60 s » : il
    // garde la seconde, celle de la réponse, « 1 m³ = 1 000 L ». Avec les
    // deux, l'étiquette passait sous « L'outil » et l'outil tombait à 59 %
    // au petit iPhone avec une police large.)
    const relationOutil = spec.relation !== undefined || u2 === cherche || rels.filter(Boolean).length < 2 ? relation : rels.filter(Boolean)[1];
    const vert = spec.nus ? mesQ9(rep, cherche) : mesQ9(rep, cherche);
    const ligne = `${calcul} = ${mesQ9(rep2, u2)}${u2 !== cherche ? ` = ${vert}` : ""}${spec.suffixe ? ` ${spec.suffixe}` : ""}`;
    const enonce = spec.enonce;
    const avant = spec.avant || "";
    const texte = `${enonce} ${avant ? `${avant} ` : ""}${CASE}${NB}${spec.apres}`;
    // Les erreurs prévues (une ligne au petit téléphone) : la conversion
    // oubliée ; 1 h = 100 min ; le calcul à l'envers ; la réponse restée
    // dans l'unité du tableau.
    const fautes = [];
    const ajouterFaute = (v, retour) => { if (v !== null && v > 0n && v !== rep && !fautes.some(f => f[0] === v)) fautes.push([v, retour]); };
    if (u1 !== xu && r1 !== 0n) {
      const brutX = (r2 * xv) % r1 === 0n ? (r2 * xv) / r1 : null;
      ajouterFaute(brutX === null ? null : convQ9(brutX, u2, cherche), relVirgule(u1, xu));
      // (1 h = 100 min : le piège des heures décimales.)
      if (c === "min" && [u1, xu].includes("h")) {
        const a1c = u1 === "h" ? r1 * 100n : a1;
        const a2c = xu === "h" ? xv * 100n : a2;
        if ((r2 * a2c) % a1c === 0n) ajouterFaute(convQ9((r2 * a2c) / a1c, u2, cherche), `1${NB}h, c'est 60${NB}min, pas 100.`);
      }
    }
    if ((r2 * a1) % a2 === 0n) ajouterFaute(convQ9((r2 * a1) / a2, u2, cherche), (r2 * a1) / a2 > rep2 ? "Le nombre doit rapetisser." : "Le nombre doit grandir.");
    if (u2 !== cherche) ajouterFaute(rep2, `La réponse est en ${NOMS_U9[cherche] || cherche}.`);
    (spec.fautes || []).forEach(([v, t]) => ajouterFaute(typeof v === "bigint" ? v : milli(v), t));
    return q({
      code: "Q9", degre, forme: "nombre", texte,
      morceaux: Object.assign({enonce, avant, apres: spec.apres, serre: true}, spec.figure ? {figure: spec.figure} : {}),
      // (Lot B6-3c : une vitesse, « 12 km en 1 h » : le bilan dit aussi
      // « donc 12 km/h », pour mettre la réponse en vert là où elle est.)
      reponse: brut(rep), reponseTexte: `${ecrire(rep)}${NB}${spec.apres}`, unite: spec.apres,
      resume: spec.suffixe ? `${ligne}, donc ${ecrire(rep)}${NB}${spec.apres}` : ligne, resumeVert: spec.suffixe ? `${ligne}, donc ${ecrire(rep)}${NB}${spec.apres}` : ligne,
      grandeur: U9[u2][2], outil: "tableau-p", tableauP: tableauQ, relation, relationCorr, relationOutil,
      noteOutil: null, image: [], correction: [ligne], ligneQ9: ligne, vertQ9: vert,
      sorteQ9: sorte, modeleQ9: spec.modele, fautesQ9: fautes.map(([v, t]) => [brut(v), t]),
      donnees: {type: "q9", taux: [[brut(n), un], [brut(d), ud]], x: [brut(xv), xu], cherche},
      cle: `Q9:${spec.modele}:${brut(xv)}${xu}:${brut(n)}${un}/${brut(d)}${ud}>${cherche}`
    });
  }

  // Les situations : [modèle, degrés, énoncé ({P}, {a}, {b}), avant, unité
  // de la case, valeurs [[a, b], …], (a, b) → {taux, x, cherche}].
  // Des nombres de tête (Gwenaël, 21/11) ; La Réunion à côté de tous les
  // jours ; aucun chiffre inventé pour un lieu nommé (« une cascade de
  // l'île »).
  const ParMin = (a, b) => ({taux: [[a, "L"], [1, "min"]], x: [b, "h"], cherche: "L"});
  const SITUATIONS_Q9 = {
    debit: [
      ["tuyau", [1, 2], "Un tuyau d'arrosage donne {a} L par minute. Combien de litres en {b} h ?", "", "L", [[15, 1], [12, 1], [20, 1], [15, 2], [10, 2]], ParMin],
      ["douche", [1, 2, 3], "Une douche coule à {a} L par minute. Combien de litres en {b} s ?", "", "L", [[12, 30], [10, 30], [12, 15], [8, 45]],
        (a, b) => ({taux: [[a, "L"], [1, "min"]], x: [b, "s"], cherche: "L"})],
      ["fuite", [2, 3], "Un robinet qui fuit perd 1 L toutes les {a} min. Combien de litres en {b} h ?", "", "L", [[5, 1], [5, 12], [10, 24], [6, 3], [4, 2]],
        (a, b) => ({taux: [[1, "L"], [a, "min"]], x: [b, "h"], cherche: "L"})],
      ["goutte", [3], "Un robinet perd 1 mL toutes les {a} s. Combien de millilitres en {b} h ?", "", "mL", [[10, 1], [5, 1], [20, 2], [12, 1]],
        (a, b) => ({taux: [[1, "mL"], [a, "s"]], x: [b, "h"], cherche: "mL"})],
      ["arrosage", [2, 3], "Un arroseur donne {a} L en {b} min. Combien de litres en 1 h ?", "", "L", [[30, 4], [45, 9], [15, 4], [21, 4]],
        (a, b) => ({taux: [[a, "L"], [b, "min"]], x: [1, "h"], cherche: "L"})]
    ],
    duree: [
      ["bassin", [1, 2], "Il manque {a} m³ d'eau au bassin. Le tuyau donne {b} L par minute.", "Durée :", "min",
        [[3, 50], [2, 40], [6, 100], [1, 50], [4, 50]], (a, b) => ({taux: [[b, "L"], [1, "min"]], x: [a, "m³"], cherche: "min"})],
      ["citerne", [2, 3], "Une citerne de {a} L se vide à {b} L par minute. En combien d'heures ?", "", "h",
        [[1200, 10], [1800, 15], [2400, 20], [900, 5]], (a, b) => ({taux: [[b, "L"], [1, "min"]], x: [a, "L"], cherche: "h"})]
    ],
    cascade: [
      ["cascade", [2, 3], "Une cascade de l'île débite {a} m³ par seconde. Combien de litres en 1 min ?", "", "L", [[2, 1], [3, 1], [5, 1]],
        a => ({taux: [[a, "m³"], [1, "s"]], x: [1, "min"], cherche: "L"})],
      ["source", [2, 3], "Une source donne {a} L par seconde. Combien de m³ en 1 h ?", "", "m³", [[5, 1], [10, 1], [2, 1]],
        a => ({taux: [[a, "L"], [1, "s"]], x: [1, "h"], cherche: "m³"})]
    ],
    riviere: [
      ["riviere", [3], "Une rivière de l'île débite {a} m³/s. Combien de litres en 1 h ?", "", "L", [[2, 1], [3, 1], [5, 1]],
        a => ({taux: [[a, "m³"], [1, "s"]], x: [1, "h"], cherche: "L"})],
      ["pompe", [3], "Une pompe débite {a} L/h. Combien de litres par minute ?", "", "L", [[600, 1], [1200, 1], [1800, 1], [900, 1]],
        a => ({taux: [[a, "L"], [1, "h"]], x: [1, "min"], cherche: "L"})]
    ],
    vitesse: [
      ["bus", [1, 2], "Le bus de {P} roule à {a} km/h. Combien de kilomètres en {b} min ?", "", "km", [[9, 20], [30, 20], [60, 15], [45, 20], [60, 45]],
        (a, b) => ({taux: [[a, "km"], [1, "h"]], x: [b, "min"], cherche: "km"})],
      ["marche", [1, 2, 3], "{P} marche à {a} km/h. Combien de kilomètres en {b} min ?", "", "km", [["4,5", 20], [6, 30], [5, 30], [6, 20], ["4,5", 40]],
        (a, b) => ({taux: [[a, "km"], [1, "h"]], x: [b, "min"], cherche: "km"})],
      ["velo", [2, 3], "{P} roule à vélo à {a} km/h. Combien de mètres en 1 min ?", "", "m", [[12, 1], [18, 1], [15, 1], [24, 1]],
        a => ({taux: [[a, "km"], [1, "h"]], x: [1, "min"], cherche: "m"})]
    ],
    vmoy: [
      // (Lot B6-3c : sans « Vitesse : » devant la case, la question le demande
      // déjà ; « Vitesse : … km/h » sortait de la ligne au petit iPhone.)
      ["cycliste", [1, 2], "Un cycliste parcourt {a} km en {b} min. Quelle est sa vitesse ?", "", "km/h", [[15, 30], [10, 20], [8, 30], [12, 20], [25, 30]],
        (a, b) => ({taux: [[a, "km"], [b, "min"]], x: [1, "h"], cherche: "km", suffixe: `en 1${NB}h`})],
      ["littoral", [2, 3], "Route du Littoral : une voiture fait {a} km en {b} min. Sa vitesse ?", "", "km/h",
        [[12, 9], [12, 8], [10, 8], [9, 6]], (a, b) => ({taux: [[a, "km"], [b, "min"]], x: [1, "h"], cherche: "km", suffixe: `en 1${NB}h`})],
      ["kayak", [2, 3], "{P} pagaie {a} m en {b} s. Quelle est sa vitesse en km/h ?", "", "km/h", [[50, 30], [100, 60], [25, 30], [20, 12]],
        (a, b) => ({taux: [[a, "m"], [b, "s"]], x: [1, "h"], cherche: "km", suffixe: `en 1${NB}h`})]
    ],
    temps: [
      ["car", [2, 3], "Le Car Jaune roule à {a} km/h. Combien de minutes pour faire {b} km ?", "", "min", [[60, 12], [60, 18], [90, 30], [80, 20], [72, 18]],
        (a, b) => ({taux: [[a, "km"], [1, "h"]], x: [b, "km"], cherche: "min"})],
      ["sentier", [2, 3], "{P} marche à {a} km/h. Combien de minutes pour faire {b} km ?", "", "min", [[4, 2], [5, 3], [6, 4], [3, 2]],
        (a, b) => ({taux: [[a, "km"], [1, "h"]], x: [b, "km"], cherche: "min"})]
    ],
    mv: [
      ["bougie1", [1, 2], "Une bougie : {a} cm³ de cire. 1 cm³ de cire pèse 0,7 g.", "Masse :", "g", [[300, 1], [200, 1], [500, 1], [400, 1]],
        a => ({taux: [["0,7", "g"], [1, "cm³"]], x: [a, "cm³"], cherche: "g"})],
      ["bougie3", [3], "Un bloc de cire : {a} cm³ à 0,7 g/cm³. Sa masse en kg ?", "", "kg", [[2000, 1], [3000, 1], [1500, 1]],
        a => ({taux: [["0,7", "g"], [1, "cm³"]], x: [a, "cm³"], cherche: "kg"})],
      ["beton", [1, 2], "1 m³ de béton pèse 2,4 t. Combien de kilogrammes pour {a} m³ ?", "", "kg", [["0,5", 1], [2, 1], ["1,5", 1], [3, 1]],
        a => ({taux: [["2,4", "t"], [1, "m³"]], x: [a, "m³"], cherche: "kg"})],
      ["ble", [2, 3], "1 m³ de blé pèse 800 kg. Une benne : {a} m³ de blé. Combien de tonnes ?", "", "t", [[15, 1], [10, 1], [5, 1], [20, 1]],
        a => ({taux: [[800, "kg"], [1, "m³"]], x: [a, "m³"], cherche: "t"})],
      ["medaille", [3], "Une médaille d'argent : {a} cm³. L'argent : 10,5 g/cm³.", "Masse :", "g", [[2, 1], [4, 1], [6, 1]],
        a => ({taux: [["10,5", "g"], [1, "cm³"]], x: [a, "cm³"], cherche: "g"})],
      ["granules", [3], "Des granulés de bois : 750 kg/m³. Combien de tonnes pour {a} m³ ?", "", "t", [[4, 1], [8, 1], [2, 1]],
        a => ({taux: [[750, "kg"], [1, "m³"]], x: [a, "m³"], cherche: "t"})]
    ],
    prix: [
      ["letchis", [1, 2], "Les letchis coûtent {a} € le kilo. Combien pour {b} g ?", "", "€", [[6, 500], [8, 500], [4, 250], [10, 500]],
        (a, b) => ({taux: [[a, "€"], [1, "kg"]], x: [b, "g"], cherche: "€"})],
      ["tissu", [1, 2], "Le tissu coûte {a} € le mètre. Combien pour {b} cm ?", "", "€", [[8, 50], [12, 50], [6, 25], [10, 20]],
        (a, b) => ({taux: [[a, "€"], [1, "m"]], x: [b, "cm"], cherche: "€"})],
      ["jus", [1, 2], "Le jus de goyave coûte {a} € le litre. Combien pour {b} cL ?", "", "€", [[2, 50], [4, 25], [3, 50], [2, 25]],
        (a, b) => ({taux: [[a, "€"], [1, "L"]], x: [b, "cL"], cherche: "€"})],
      ["mangues", [3], "Les mangues coûtent {a} € le kilo. Combien pour {b} g ?", "", "€", [[6, 750], [4, 750], [8, 750], [10, 600]],
        (a, b) => ({taux: [[a, "€"], [1, "kg"]], x: [b, "g"], cherche: "€"})]
    ],
    conso: [
      ["conso", [1, 2], "Une voiture consomme {a} L aux 100 km. Combien de litres pour {b} km ?", "", "L", [[5, 300], [6, 200], [5, 50], [7, 200], [4, 50]],
        (a, b) => ({taux: [[a, "L"], [100, "km"]], x: [b, "km"], cherche: "L"})],
      ["conso1", [3], "Une voiture consomme {a} L aux 100 km. Combien de centilitres pour 1 km ?", "", "cL", [[5, 1], [6, 1], [8, 1], [4, 1]],
        a => ({taux: [[a, "L"], [100, "km"]], x: [1, "km"], cherche: "cL"})]
    ],
    pouce: [
      ["ecran", [1, 2], "Un écran de {a} pouces. 1 pouce = 2,54 cm. Sa diagonale en cm ?", "", "cm", [[50, 1], [10, 1], [20, 1], [100, 1]],
        a => ({taux: [["2,54", "cm"], [1, "pouce"]], x: [a, "pouce"], cherche: "cm", nus: true, noms: ["Pouces", "cm"], relation: null})],
      ["ecran-m", [3], "Un écran de {a} pouces. 1 pouce = 2,54 cm. Sa diagonale en mètres ?", "", "m", [[50, 1], [40, 1], [60, 1]],
        a => ({taux: [["2,54", "cm"], [1, "pouce"]], x: [a, "pouce"], cherche: "m", nus: true, noms: ["Pouces", "cm"]})],
      ["mille", [3], "Un bateau parcourt {a} milles marins. 1 mille = 1,852 km. Combien de km ?", "", "km", [[10, 1], [5, 1], [20, 1]],
        a => ({taux: [["1,852", "km"], [1, "mille"]], x: [a, "mille"], cherche: "km", nus: true, noms: ["Milles", "km"], relation: null})]
    ]
  };
  // (« 1 pouce = 2,54 cm » ne se coupe pas ; un nombre et son unité non
  // plus.)
  // « de » devant un prénom tiré : « le bus d'Inès ».
  const deQ9 = P => (/^[AEIOUYÉÈÊÂÎÔ]/.test(P) ? `d'${P}` : `de ${P}`);
  function remplirQ9(t, v) {
    return t.replace("de {P}", deQ9(v.P || "")).replace("{P}", v.P || "").replace("{a}", v.a).replace("{b}", v.b)
      .replace(/1 pouce = 2,54 cm/, `1${NB}pouce${NB}=${NB}2,54${NB}cm`).replace(/1 mille = 1,852 km/, `1${NB}mille${NB}=${NB}1,852${NB}km`)
      .replace(/(\d) (?=(?:L|mL|cL|km|m|cm|kg|g|t|h|min|s|€|m³|cm³|pouces|milles)(?![\wÀ-ÿ²³]))/g, `$1${NB}`)
      .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${FINE}`).replace(/ \?$/, `${NB}?`).replace(/ :$/, `${NB}:`);
  }
  function situationQ9(degre, rng, sorte) {
    const liste = SITUATIONS_Q9[sorte].filter(s => s[1].includes(degre));
    if (!liste.length) return null;
    const [modele, , t, avant, apres, valeurs, faire] = choisir(rng, liste);
    const [a, b] = choisir(rng, valeurs);
    const f = faire(a, b);
    const ecrireV = v => ecrire(milli(v));
    const enonce = remplirQ9(t, {P: choisir(rng, PRENOMS), a: ecrireV(a), b: ecrireV(b)});
    const x = finirQ9(Object.assign({sorte, degre, modele, enonce, avant: avant ? avant.replace(/ :$/, `${NB}:`) : "", apres}, f));
    // (Le retour à l'unité, trois colonnes : au degré 3 seulement.)
    if (!x || (x.tableauP.lignes[0].length === 3 && degre < 3)) return null;
    return x;
  }

  // Le graphique du bus (S097 p. 41) : la distance (km) selon la durée
  // (min), une droite depuis 0, des croix, la lecture en pointillés. Des
  // points sur le quadrillage : [minutes, km, minutes max, km max].
  const GRAPHES_Q9 = [[20, 3, 30, 4], [15, 2, 30, 4], [30, 4, 30, 5], [10, 2, 30, 6], [20, 5, 30, 8], [15, 3, 30, 6], [30, 6, 40, 8], [20, 4, 30, 6]];
  function grapheQ9(degre, rng) {
    const [m, k, xMax, yMax] = choisir(rng, GRAPHES_Q9);
    // (Des vitesses de 8 à 15 km/h : un vélo, une trottinette, le bus de
    // S097, à 9 km/h et plus. Lot B6-3c : sans prénom, « Ce bus » montre le
    // graphique ; l'énoncé tient sur deux lignes avec une police large : la
    // question du graphique fixe la hauteur de toute la série, et à trois
    // lignes l'outil tombait à 79 % au petit iPhone.)
    const vehicule = choisir(rng, ["Ce bus", "Ce vélo", "Cette trottinette"]);
    if (vehicule === "Ce bus" && (60 * k) / m < 9) return null;
    const enonce = `${vehicule} roule toujours à la même vitesse. Sa vitesse${NB}?`;
    const x = finirQ9({sorte: "graphe", degre, modele: `graphe:${m}:${k}`, enonce, avant: "", apres: "km/h",
      taux: [[k, "km"], [m, "min"]], x: [1, "h"], cherche: "km", suffixe: `en 1${NB}h`,
      // (Les croix sur le quadrillage : le point lu, et son double s'il
      // tient dans le graphique.)
      figure: {type: "graphe", xMax, yMax, point: [m, k], croix: [[m, k], [2 * m, 2 * k]].filter(([a, b]) => a <= xMax && b <= yMax)}});
    return x;
  }

  // Au choix. Le piège « 3 h 20 min n'est pas 3,2 h » (brevet 2022) :
  // [km, h, min] — la vitesse juste, celle de « 3,2 h », celle des heures
  // seules.
  const PIEGES_Q9 = [[36, 3, 20], [24, 1, 20], [48, 3, 20], [12, 1, 20]];
  function piegeQ9(degre, rng) {
    const [km, h, mn] = choisir(rng, PIEGES_Q9);
    const t = h * 60 + mn;
    const vraie = (milli(km) * 60n) / BigInt(t);
    if ((milli(km) * 60n) % BigInt(t) !== 0n) return null;
    const dec = milli(`${h},${mn}`);
    const fausse = (milli(km) * MILLE) / dec;
    if ((milli(km) * MILLE) % dec !== 0n || fausse === vraie) return null;
    const seule = milli(km) / BigInt(h);
    const vit = v => `${ecrire(v)}${NB}km/h`;
    const bonne = vit(vraie);
    const choix = melanger(rng, [bonne, vit(fausse), vit(seule)].filter((c, i, l) => l.indexOf(c) === i));
    if (choix.length < 3) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = `${P} parcourt ${km}${NB}km en ${h}${NB}h${NB}${mn}${NB}min à vélo. Quelle est sa vitesse${NB}?`;
    const pourquoi = {};
    choix.forEach((c, k) => {
      if (c === vit(fausse)) pourquoi[k] = `${h}${NB}h${NB}${mn}${NB}min, ce n'est pas ${ecrire(dec)}${NB}h.`;
      else if (c !== bonne) pourquoi[k] = `Il y a aussi les ${mn}${NB}min.`;
    });
    const p = pgcdQ9(BigInt(t), 60n);
    const m1 = BigInt(t) / p;
    const m2 = 60n / p;
    const tabl = m1 <= 20n ? {noms: ["Durée", "Distance"], lignes: [[`${t}${NB}min`, `${ecrire(p * MILLE)}${NB}min`, `60${NB}min`], [`${km}${NB}km`, mesQ9(milli(km) / m1, "km"), null]],
      fleches: [`÷${NB}${m1}`, `×${NB}${m2}`], rep: mesQ9(vraie, "km")} : null;
    if (!tabl || (milli(km) % m1) !== 0n) return null;
    const ligne = `${km}${NB}km ÷ ${m1} × ${m2} = ${mesQ9(vraie, "km")} en 1${NB}h`;
    return q({
      code: "Q9", degre, forme: "qcm", texte: enonce, morceaux: {enonce, serre: true, sorte: "piege"}, choix, bon: choix.indexOf(bonne), pourquoi,
      reponse: bonne, reponseTexte: bonne, unite: null, resume: ligne, resumeVert: ligne, grandeur: "longueur",
      // (Dans la correction, « 3 h = 180 min » : « 3 h 20 min = 200 min »
      // ne tient pas à côté de l'étiquette au petit iPhone ; le tableau
      // montre les 200 min.)
      outil: "tableau-p", tableauP: tabl, relation: `${h}${NB}h${NB}${mn}${NB}min = ${t}${NB}min`, relationCorr: `${h}${NB}h = ${h * 60}${NB}min`, image: [], correction: [ligne], ligneQ9: ligne, vertQ9: mesQ9(vraie, "km"),
      sorteQ9: "piege", modeleQ9: `piege:${km}`, donnees: {type: "q9-piege", km, h, mn}, cle: `Q9:piege:${km}:${h}:${mn}`
    });
  }

  // « Quel calcul ? » : un vrai nombre de brevet, l'élève choisit le
  // calcul (le bon, l'inverse, la mauvaise opération ou la conversion
  // oubliée). [modèle, énoncé, consigne, bon, faux 1, pourquoi 1, faux 2,
  // pourquoi 2, le tableau (noms, ligne 1, ligne 2, flèche)].
  const CALCULS_Q9 = [
    ["bassin", "Il manque 112 m³ d'eau au bassin. Le tuyau donne 4 m³ par heure.", "Quel calcul donne la durée ?",
      "112 ÷ 4", "112 × 4", "Le nombre doit rapetisser.", "4 ÷ 112", "Combien de fois 4 m³ ?",
      [["Volume", "Durée"], ["4 m³", "112 m³"], ["1 h", null]]],
    ["granules", "Un silo : 16 m³ de granulés de bois. 1 m³ de granulés pèse 750 kg.", "Quel calcul donne la masse ?",
      "16 × 750", "750 ÷ 16", "16 m³, c'est 16 fois 1 m³.", "16 ÷ 750", "Le nombre doit grandir.",
      [["Volume", "Masse"], ["1 m³", "16 m³"], ["750 kg", null]]],
    ["seine", "La Seine débite 328 m³ par seconde.", "Quel calcul pour 3 min, en m³ ?",
      "328 × 180", "328 × 3", "3 min, c'est 180 s.", "328 ÷ 180", "Le nombre doit grandir.",
      [["Durée", "Volume"], ["1 s", "180 s"], ["328 m³", null]]],
    ["voiture", "Une voiture parcourt 150 km en 1 h 30 min.", "Quel calcul donne les km/h ?",
      "150 ÷ 1,5", "150 ÷ 1,3", "30 min, c'est 0,5 h.", "150 × 1,5", "Le nombre doit rapetisser.",
      [["Durée", "Distance"], ["90 min", "60 min"], ["150 km", null]]],
    ["essence", "Une voiture consomme 6,5 L aux 100 km.", "Quel calcul pour 340 km ?",
      "6,5 × 3,4", "6,5 × 340", "340 km, c'est 3,4 fois 100 km.", "340 ÷ 6,5", "On cherche des litres.",
      [["Distance", "Essence"], ["100 km", "340 km"], ["6,5 L", null]]]
  ];
  // (Une ligne de calcul ne se coupe pas : « 112 ÷ 4 ».)
  const tyQ9 = s => remplirQ9(s, {a: "", b: ""}).replace(/ ([×÷]) /g, `${NB}$1${NB}`).replace(/(\d) h (?=\d)/, `$1${NB}h${NB}`);
  function calculQ9(degre, rng) {
    const [modele, t, consigne, bon, f1, p1, f2, p2, [noms, l1, l2]] = choisir(rng, CALCULS_Q9);
    const enonce = tyQ9(t);
    const choix = melanger(rng, [bon, f1, f2].map(tyQ9));
    const pourquoi = {};
    choix.forEach((c, k) => { if (c === tyQ9(f1)) pourquoi[k] = tyQ9(p1); else if (c === tyQ9(f2)) pourquoi[k] = tyQ9(p2); });
    const consigneT = tyQ9(consigne);
    const juste = tyQ9(bon);
    return q({
      code: "Q9", degre, forme: "qcm", texte: `${enonce} ${consigneT}`, morceaux: {enonce, consigne: consigneT, serre: true, sorte: "calcul"},
      choix, bon: choix.indexOf(juste), pourquoi, reponse: juste, reponseTexte: juste, unite: null, resume: juste, grandeur: null,
      outil: "tableau-p", tableauP: {noms, lignes: [l1.map(tyQ9), l2.map(v => (v ? tyQ9(v) : null))], fleches: [], rep: null},
      relation: null, image: [], correction: [juste], ligneQ9: juste, vertQ9: juste,
      sorteQ9: "calcul", modeleQ9: `calcul:${modele}`, donnees: {type: "q9-calcul", modele}, cle: `Q9:calcul:${modele}`
    });
  }

  // « Le plus dense ? » (brevet 2025), « Le moins cher au kilo ? » : deux
  // produits, deux unités ; souvent le piège du plus grand nombre.
  // [modèle, A, [masse ou prix], [volume ou masse], B, …].
  const COMPARER_Q9 = {
    dense: [
      ["colis", "Le colis A", ["6", "kg"], ["10", "dm³"], "Le colis B", ["40", "kg"], ["0,1", "m³"]],
      ["colis2", "Le colis A", ["3", "kg"], ["5", "dm³"], "Le colis B", ["500", "kg"], ["1", "m³"]],
      ["sacs", "Le sac A", ["12", "kg"], ["20", "dm³"], "Le sac B", ["0,8", "t"], ["1", "m³"]]
    ],
    cher: [
      ["fruits", "Les letchis", ["3", "€"], ["500", "g"], "Les mangues", ["5", "€"], ["1", "kg"]],
      ["riz", "Le riz blanc", ["2", "€"], ["1", "kg"], "Le riz rouge", ["1,5", "€"], ["500", "g"]],
      ["epices", "Le curcuma", ["4", "€"], ["250", "g"], "Le massalé", ["15", "€"], ["1", "kg"]]
    ]
  };
  // Une mesure dans l'unité de base de sa grandeur (en millièmes).
  const baseQ9 = (m, u) => (milli(m) * U9[u][0]) / U9[u][1];
  function comparerQ9(degre, rng, sorte) {
    const [modele, A, [ma, uma], [va, uva], B, [mb, umb], [vb, uvb]] = choisir(rng, COMPARER_Q9[sorte]);
    const dense = sorte === "dense";
    // Pour 1 dm³ (en grammes) ou pour 1 kg (en euros).
    const ref = dense ? baseQ9(1, "dm³") : baseQ9(1, "kg");
    const par = (m, um, v, uv) => (baseQ9(m, um) * ref) / baseQ9(v, uv);
    const pa = par(ma, uma, va, uva);
    const pb = par(mb, umb, vb, uvb);
    const egal = dense ? "Aussi dense" : "Même prix";
    const gagnant = pa === pb ? egal : dense ? (pa > pb ? A : B) : (pa < pb ? A : B);
    const choix = rng() < 0.5 ? [A, B, egal] : [B, A, egal];
    const bon = choix.indexOf(gagnant);
    const m = (v, u) => `${ecrire(milli(v))}${NB}${u}`;
    const pour = (v, u) => (dense ? `pour ${m(v, u)}` : milli(v) === MILLE && u === "kg" ? "le kilo" : `les ${m(v, u)}`);
    const enonce = `${A}${NB}: ${m(ma, uma)} ${pour(va, uva)}. ${B}${NB}: ${m(mb, umb)} ${pour(vb, uvb)}.`;
    const consigne = dense ? `Le plus dense${NB}?` : `Le moins cher au kilo${NB}?`;
    const val = p => (dense ? mesQ9(p, "g") : mesQ9(p, "€"));
    const court = t => t.replace(/^(Le|Les) /, "");
    const ligne = dense ? `Pour 1${NB}dm³${NB}: A ${val(pa)}, B ${val(pb)}` : `Le kilo${NB}: ${court(A)} ${val(pa)}, ${court(B)} ${val(pb)}`;
    const pourquoi = {};
    choix.forEach((c, k) => { if (k !== bon) pourquoi[k] = dense ? `Compare pour 1${NB}dm³.` : `Compare le prix de 1${NB}kg.`; });
    // L'outil : le premier produit qui n'est pas déjà pour 1 dm³ ou 1 kg,
    // ramené à 1 dm³ ou 1 kg.
    const [m0, um0, v0, uv0] = baseQ9(va, uva) === ref ? [mb, umb, vb, uvb] : [ma, uma, va, uva];
    const unC = dense ? "dm³" : "g";
    const vc = convQ9(milli(v0), uv0, unC);
    const refC = convQ9(MILLE, dense ? "dm³" : "kg", unC);
    if (vc === null || (vc > refC ? vc % refC : refC % vc) !== 0n) return null;
    const fl = vc > refC ? `÷${NB}${ecrire((vc / refC) * MILLE)}` : `×${NB}${ecrire((refC / vc) * MILLE)}`;
    const tabl = {noms: [dense ? "Volume" : "Masse", dense ? "Masse" : "Prix"], lignes: [[mesQ9(vc, unC), mesQ9(refC, unC)], [m(m0, um0), null]], fleches: [fl], rep: null};
    return q({
      code: "Q9", degre, forme: "qcm", texte: `${enonce} ${consigne}`, morceaux: {enonce, consigne, serre: true, sorte},
      choix, bon, pourquoi, reponse: gagnant, reponseTexte: gagnant, unite: null, resume: ligne, resumeVert: ligne, grandeur: null,
      outil: "tableau-p", tableauP: tabl, relation: dense ? `1${NB}m³ = 1${FINE}000${NB}dm³` : `1${NB}kg = 1${FINE}000${NB}g`,
      image: [], correction: [ligne], ligneQ9: ligne, vertQ9: null,
      sorteQ9: sorte, modeleQ9: `${sorte}:${modele}`, donnees: {type: `q9-${sorte}`, a: [ma, uma, va, uva], b: [mb, umb, vb, uvb]}, cle: `Q9:${sorte}:${modele}`
    });
  }
  // « Trois fois plus rapide » (évaluations nationales de 4e).
  // (Lot B6-3c : jamais « 3 fois plus vite pendant 20 min » : la réponse
  // était toujours la vitesse de l'énoncé, il suffisait de la recopier.)
  const FOIS_Q9 = [[4, 3, 15], [4, 3, 30], [6, 3, 30], [6, 2, 15], [6, 2, 20], [4, 2, 15]];
  function foisQ9(degre, rng) {
    const [v, k, mn] = choisir(rng, FOIS_Q9);
    const [P, P2] = melanger(rng, PRENOMS);
    const mot = k === 3 ? "trois fois" : "deux fois";
    const vk = milli(v * k);
    const enonce = `${P} marche à ${v}${NB}km/h. ${P2} roule ${mot} plus vite. Distance en ${mn}${NB}min${NB}?`;
    const oubli = (milli(v) * BigInt(mn)) % 60n === 0n ? (milli(v) * BigInt(mn)) / 60n : null;
    const x = finirQ9({sorte: "fois", degre, modele: `fois:${v}:${k}`, enonce, avant: `${P2}${NB}:`, apres: "km",
      taux: [[vk, "km"], [1, "h"]], x: [mn, "min"], cherche: "km", relation: `1${NB}h = 60${NB}min`,
      fautes: oubli ? [[oubli, `${P2} va ${mot} plus vite.`]] : []});
    return x;
  }

  function tirerQ9Brut(rng, degre, sorte) {
    if (sorte === "graphe") return grapheQ9(degre, rng);
    if (sorte === "piege") return piegeQ9(degre, rng);
    if (sorte === "calcul") return calculQ9(degre, rng);
    if (sorte === "dense" || sorte === "cher") return comparerQ9(degre, rng, sorte);
    if (sorte === "fois") return foisQ9(degre, rng);
    if (SITUATIONS_Q9[sorte]) return situationQ9(degre, rng, sorte);
    return null;
  }
  const SORTES_Q9 = {
    1: ["debit", "duree", "vitesse", "vmoy", "mv", "prix", "conso", "pouce"],
    2: ["debit", "duree", "cascade", "vitesse", "vmoy", "temps", "mv", "prix", "conso", "pouce", "graphe", "piege", "fois", "dense", "cher", "calcul"],
    3: ["debit", "duree", "cascade", "riviere", "vitesse", "vmoy", "temps", "mv", "prix", "conso", "pouce", "graphe", "piege", "dense", "calcul"]
  };
  const PLACES_Q9 = {
    valide: ["debit", "vitesse", "mv", "duree", "prix|conso", "graphe|cascade", "vmoy|temps", "pouce|mv", "piege|dense|cher|calcul", "riviere|cascade|temps"],
    entraine: ["debit", "vitesse", "mv", "prix", "vmoy", "duree",
      "cascade", "graphe", "temps", "conso", "dense", "pouce", "calcul", "fois", "cher",
      "riviere", "vmoy", "mv", "piege", "debit", "graphe", "temps", "calcul", "pouce", "duree"],
    test: ["debit|vitesse", "mv|prix", "riviere|cascade|temps", "vmoy|duree"],
    aide: ["debit", "vitesse", "mv"],
    retour: ["debit|vitesse|mv|prix", "cascade|temps|vmoy|duree"],
    echauffement: ["debit|vitesse|mv"]
  };
  function tirerQ9(rng, degre, forme) {
    const sorte = forme || choisir(rng, SORTES_Q9[degre]);
    for (let essai = 0; essai < 40; essai += 1) {
      const x = tirerQ9Brut(rng, degre, sorte);
      if (x) return x;
    }
    return null;
  }
  // Les erreurs de Q9 au pavé : celles que la question a prévues.
  function erreursQ9(question, lu) {
    const f = (question.fautesQ9 || []).find(([v]) => milli(v) === lu);
    return f ? {erreur: 1, retour: f[1]} : null;
  }

  ETAPES.Q9 = {
    // On te montre : le tuyau d'arrosage (15 L par minute, en 1 h), le bus
    // de Clotilde (S097 : 9 km/h, en 20 min), le bassin (3 m³ à 50 L par
    // minute).
    clesExemples: ["Q9:tuyau:1h:15L/1min>L", "Q9:bus:20min:9km/1h>km", "Q9:bassin:3m³:50L/1min>min"],
    tirer(rng, degre, i, usage, forme) {
      return tirerQ9(rng, degre, forme);
    },
    formes(usage, rng) {
      const p = PLACES_Q9[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    // (Dans une série : un même modèle une fois.)
    accepte(serie, question) {
      return !serie.some(x => x.modeleQ9 === question.modeleQ9);
    },
    erreurs(question, lu) { return erreursQ9(question, lu); }
  };

  // ======================================================== palier 3 (lot B3-2)
  // C9 « Avec des millièmes », A1 « 1 m² = 100 dm², 1 dm² = 100 cm² », A2
  // « Convertir des aires (vers plus petit) ». Choix de Gwenaël du 21/11
  // (lot B3-2a, les trois recommandés) : C9, l'arrondi à l'entier sur la
  // droite graduée ; A1, on touche le carré, une rangée de plus à chaque
  // fois ; A2, le découpage au degré 1, puis le calcul. Les unités restent
  // écrites dans les calculs (S023 p. 7). Le tableau des unités d'aire est
  // écarté (S001 : « au cours moyen, les élèves n'utilisent pas de tableaux
  // pour effectuer des conversions »).
  // Un outil ne donne jamais la réponse : la ligne « 3,7 dm² = 3,7 ×
  // 100 cm² » ne dit jamais 370 ; la droite n'écrit rien en vert avant la
  // correction ; le compteur du carré s'arrête quand l'élève s'arrête.
  // Un pourquoi : 31 signes au plus (une ligne au petit téléphone).

  // --------------------------------------------- C9 · Avec des millièmes
  // S433 (attendus de CM2) : 6 m 65 mm = 6,065 m ; 18 mm = 0,018 m. S003
  // p. 10 : 2 070 g = 2,07 kg ; « l'arrondi à l'entier de 5,78 est 6, de
  // 3,5 est 4 » ; la partie entière (« de 105,78 »). L'exerciseur (niveau
  // 3) : les zéros pièges au millième, 0,005 kg = 5 g. Des millièmes
  // seulement entre deux unités qui font × 1 000 : la grande unité porte les
  // millièmes, la petite est un nombre entier (jamais « 2,5 g » ni
  // « 0,6 mm »). L'arrondi au dixième, au centième : en 6e (palier 4).
  const PAIRES_C9 = [["km", "m"], ["m", "mm"], ["kg", "g"], ["L", "mL"], ["t", "kg"], ["m", "mm"], ["kg", "g"], ["km", "m"]];
  // La grande unité : pas plus de… (une course de 60 km, un camion de 40 t).
  const BORNES_C9 = {km: 60, m: 50, kg: 50, L: 20, t: 40};
  function vraieC9(vg, g, vp) {
    return vg > 0n && vg <= BigInt(BORNES_C9[g]) * MILLE && decimales(vg) <= 3 && vp % MILLE === 0n && vp >= MILLE;
  }
  // Le nombre dans la grande unité. d1 : trois chiffres non nuls après la
  // virgule (2,375) ; d2 : les zéros au milieu (2,07 ; 1,005 ; 4,075 ;
  // 3,405 ; 12,005) ; d3 : moins de 1 (0,018 ; 0,005 ; 0,375 ; 0,05).
  const MODELES_C9 = {1: ["a,bcd", "a,bcd", "ab,bcd"], 2: ["a,0b", "a,00b", "a,0bc", "a,b0c", "ab,00c"], 3: ["0,0ab", "0,00a", "0,abc", "0,0a", "a,00b"]};
  function nombreC9(rng, modele) {
    const c = () => entre(rng, 1, 9);
    const ab = () => entre(rng, 10, 39);
    const t = {
      "a,bcd": () => `${c()},${c()}${c()}${c()}`, "ab,bcd": () => `${ab()},${c()}${c()}${c()}`,
      "a,0b": () => `${c()},0${c()}`, "a,00b": () => `${c()},00${c()}`, "a,0bc": () => `${c()},0${c()}${c()}`,
      "a,b0c": () => `${c()},${c()}0${c()}`, "ab,00c": () => `${ab()},00${c()}`,
      "0,0ab": () => `0,0${c()}${c()}`, "0,00a": () => `0,00${c()}`, "0,abc": () => `0,${c()}${c()}${c()}`, "0,0a": () => `0,0${c()}`
    }[modele];
    return milli(t());
  }
  function conversionC9(degre, v, de, vers) {
    const rep = convertir(v, de, vers);
    if (rep === null) return null;
    const bas = exposant(de) > exposant(vers);
    const [g, p, vg, vp] = bas ? [de, vers, v, rep] : [vers, de, rep, v];
    if (!vraieC9(vg, g, vp)) return null;
    const f = facteur(g, p);
    const relation = relationTexte(g, p);
    const pas = bas ? `${ecrire(v)} × ${mes(f * MILLE, vers)}` : `${ecrire(v)} ÷ ${ecrire(f * MILLE)}${NB}${vers}`;
    return questionConversion("C9", degre, "nombre", v, de, vers, {
      relation, outil: "glisse-unite", glisse: glisse(v, de, vers, {cm1: true, decimaux: true}),
      image: [relation, `donc ${mes(v, de)} = ${pas}`],
      correction: [relation, `donc ${mes(v, de)} = ${pas} = ${mes(rep, vers)}`],
      grandeur: grandeurDe(g), relationCle: `${g}-${p}`, sorteC9: "conv"
    });
  }
  function tirerConvC9(rng, degre) {
    for (let essai = 0; essai < 60; essai += 1) {
      const [g, p] = choisir(rng, PAIRES_C9);
      const vg = nombreC9(rng, choisir(rng, MODELES_C9[degre]));
      const vp = convertir(vg, g, p);
      const x = rng() < 0.55 ? conversionC9(degre, vg, g, p) : conversionC9(degre, vp, p, g);
      if (x) return x;
    }
    return null;
  }
  // La même conversion, en phrase : « Combien de mètres dans 18 mm ? ».
  function enPhrase(x) {
    if (!x) return null;
    const d = x.donnees;
    const e = ecrireConversion("phrase", milli(d.valeur), d.de, d.vers);
    return Object.assign(x, {forme: "phrase", texte: e.texte, morceaux: e.morceaux});
  }
  // Des mesures vraies, de La Réunion et de tous les jours : [l'énoncé, la
  // mesure, son unité, l'unité demandée, le degré].
  const SITUATIONS_C9 = [
    ["Le Piton des Neiges culmine à 3 069 m.", "3069", "m", "km", 2],
    ["Le Piton de la Fournaise culmine à 2 632 m.", "2632", "m", "km", 1],
    ["Le Grand Bénare culmine à 2 898 m.", "2898", "m", "km", 1],
    ["Le Maïdo culmine à 2 205 m.", "2205", "m", "km", 2],
    ["Un marathon mesure 42,195 km.", "42,195", "km", "m", 1],
    ["Une fourmi mesure 4 mm.", "4", "mm", "m", 3],
    ["Un grain de riz mesure 6 mm.", "6", "mm", "m", 3],
    ["Un crayon mesure 175 mm.", "175", "mm", "m", 3],
    ["Un ananas pèse 0,85 kg.", "0,85", "kg", "g", 2],
    ["Un camion de cannes porte 12,45 t.", "12,45", "t", "kg", 2],
    ["Un téléphone pèse 185 g.", "185", "g", "kg", 3],
    ["Un colis pèse 3 060 g.", "3060", "g", "kg", 2],
    ["Une bouteille de sirop contient 0,75 L.", "0,75", "L", "mL", 2],
    ["Une canette contient 330 mL.", "330", "mL", "L", 3],
    ["Le sentier jusqu'à la cascade mesure 1 250 m.", "1250", "m", "km", 2],
    ["Un bébé pèse 3 450 g à la naissance.", "3450", "g", "kg", 1],
    ["Une gourde contient 0,6 L.", "0,6", "L", "mL", 3],
    ["Un sac de letchis pèse 1,875 kg.", "1,875", "kg", "g", 1],
    ["La piste cyclable mesure 4 075 m.", "4075", "m", "km", 2],
    ["Un jacquier pèse 8,05 kg.", "8,05", "kg", "g", 3]
  ].map(([t, ...r]) => [CARTE.typo(t), ...r]);
  function situationC9(degre, rng) {
    const vivier = SITUATIONS_C9.map((s, k) => [s, k]).filter(([s]) => s[4] <= degre);
    const [[enonce, n, de, vers], k] = choisir(rng, vivier);
    const x = conversionC9(degre, milli(n), de, vers);
    if (!x) return null;
    const avant = `${mes(milli(n), de)} =`;
    return Object.assign(x, {
      forme: "nombre", texte: `${enonce} ${avant} ${CASE}${NB}${vers}`, morceaux: {enonce, avant, apres: vers},
      sorteC9: "situation", situationC9: k, cleBase: x.cle, cle: `C9:s:${k}`
    });
  }

  // Deux unités vers une seule (S433 : 6 m 65 mm = … m) : le glisse-unité
  // porte la petite mesure, « Puis j'ajoute 6 m. » (comme C5). d2 : deux
  // chiffres ou un seul (6 m 5 mm) ; d3 : aussi trois chiffres avec un zéro
  // (6 m 305 mm), et le marathon (42 km 195 m).
  const DEUX_C9 = [["m", "mm"], ["km", "m"], ["kg", "g"], ["L", "mL"]];
  function deuxUnitesC9(degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, DEUX_C9);
      let a = entre(rng, 1, 9);
      const deux = () => { let k; do { k = entre(rng, 11, 99); } while (k % 10 === 0); return k; };
      let b = degre <= 2 ? (rng() < 0.6 ? deux() : entre(rng, 1, 9)) : choisir(rng, [entre(rng, 1, 9), entre(rng, 1, 9) * 100 + entre(rng, 1, 9), deux()]);
      if (degre === 3 && g === "km" && rng() < 0.2) [a, b] = [42, 195];
      const A = milli(a);
      const B = milli(b);
      const f = facteur(g, p);
      const Bg = convertir(B, p, g);
      const rep = A + Bg;
      if (!vraieC9(rep, g, A * f + B)) continue;
      const gauche = `${mes(A, g)} ${mes(B, p)}`;
      const relation = relationTexte(g, p);
      return q({
        code: "C9", degre, forme: "phrase", texte: `${gauche} = ${CASE}${NB}${g}`,
        morceaux: {phrase: `${gauche} =`, apres: g},
        reponse: brut(rep), reponseTexte: mes(rep, g), unite: g, resume: `${gauche} = ${mes(rep, g)}`,
        relation, outil: "glisse-unite", glisse: glisse(B, p, g, {cm1: true, decimaux: true}), plus: mes(A, g),
        image: [relation, `donc ${gauche} = ${mes(A, g)} + ${ecrire(B)} ÷ ${ecrire(f * MILLE)}${NB}${g}`],
        correction: [`${mes(B, p)} = ${mes(Bg, g)}`, `${gauche} = ${mes(A, g)} + ${mes(Bg, g)} = ${mes(rep, g)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`, somme: true, sorteC9: "deux-unites",
        donnees: {type: "somme", a: String(a), ua: g, b: String(b), ub: p, vers: g},
        cle: `C9:${a}${g}${b}${p}>${g}`
      });
    }
    return null;
  }
  // Deux cases : « 6,065 m = … m … mm » (d2 : 6,065 ; 3,405 ; d3 : 2,005 ;
  // 4,07).
  function deuxCasesC9(degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, DEUX_C9);
      const a = entre(rng, 1, 9);
      const b = degre <= 2 ? choisir(rng, [entre(rng, 11, 99), entre(rng, 1, 9) * 100 + entre(rng, 1, 9), entre(rng, 101, 999)]) : choisir(rng, [entre(rng, 1, 9), entre(rng, 1, 9) * 10]);
      if (degre <= 2 && b % 10 === 0) continue;
      const f = facteur(g, p);
      const X = milli(a) * f + milli(b);
      const v = convertir(X, p, g);
      if (!vraieC9(v, g, X)) continue;
      const reste = v - milli(a);
      const gauche = mes(v, g);
      const relation = relationTexte(g, p);
      return q({
        code: "C9", degre, forme: "deux-cases", texte: `${gauche} = ${CASE}${NB}${g} ${CASE}${NB}${p}`,
        morceaux: {avant: `${gauche} =`, cases: [g, p]},
        reponse: [String(a), String(b)], reponseTexte: `${mes(milli(a), g)} ${mes(milli(b), p)}`, unite: p,
        resume: `${gauche} = ${mes(milli(a), g)} ${mes(milli(b), p)}`,
        relation, outil: "glisse-unite", glisse: glisse(v, g, p, {cm1: true, decimaux: true}),
        image: [relation, `${gauche} = ${mes(milli(a), g)} + ${mes(reste, g)}`],
        correction: [`${mes(reste, g)} = ${mes(milli(b), p)}`, `${gauche} = ${mes(milli(a), g)} ${mes(milli(b), p)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`, deux: true, sorteC9: "deux-cases",
        donnees: {type: "deux", valeur: brut(v), de: g, grande: g, petite: p},
        cle: `C9:${brut(v)}${g}>${g}+${p}`
      });
    }
    return null;
  }
  // « Trouve l'intrus » au millième : trois écritures de la même mesure
  // (2,07 kg ; 2 070 g ; 2 kg 70 g) et une vraie erreur, le zéro oublié
  // (2,7 kg) ou mis au mauvais rang (2 kg 700 g, 2 700 g).
  function intrusC9(degre, rng) {
    for (let essai = 0; essai < 40; essai += 1) {
      const [g, p] = choisir(rng, DEUX_C9);
      const a = entre(rng, 1, 9);
      const b = choisir(rng, degre === 3 ? [entre(rng, 1, 9), entre(rng, 1, 9) * 10] : [entre(rng, 11, 99), entre(rng, 1, 9) * 10, entre(rng, 1, 9)]);
      const f = facteur(g, p);
      const A = milli(a);
      const B = milli(b);
      const X = A * f + B;
      const vg = convertir(X, p, g);
      if (!vraieC9(vg, g, X)) continue;
      const egales = [[[vg, g]], [[X, p]], [[A, g], [B, p]]];
      const oublie = lireMilli(`${a},${b}`);
      const fausses = [[[oublie, g]], [[oublie, g]]];
      if (b * 10 < 1000) fausses.push([[A, g], [B * 10n, p]], [[A * f + B * 10n, p]]);
      const intrus = choisir(rng, fausses);
      const cartes = melanger(rng, egales.concat([intrus]));
      const textes = cartes.map(texteEcriture);
      const bon = cartes.indexOf(intrus);
      const vi = valeurC5(intrus);
      const autre = intrus.length === 1 && intrus[0][1] === p ? mes(convertir(intrus[0][0], p, g), g) : mes(convertir(vi, BASE_C5[grandeurDe(g)], p), p);
      const pourquoi = {};
      cartes.forEach((e, i) => {
        if (i === bon) return;
        const meme = egales.find(x => x !== e && x.length === 1 && x[0][1] !== (e.length === 1 ? e[0][1] : null)) || egales.find(x => x !== e);
        pourquoi[i] = `${textes[i]} = ${texteEcriture(meme)}.`;
      });
      const egalesT = egales.map(texteEcriture);
      const phrase = "Trouve l'intrus : la mesure qui n'est pas égale aux autres.";
      const fin = `${textes[bon]} = ${autre} : c'est l'intrus.`;
      return q({
        code: "C9", degre, forme: "qcm", texte: `${phrase} ${textes.join(" ; ")}`,
        morceaux: {phrase},
        choix: textes, bon, pourquoi, reponse: String(bon), reponseTexte: textes[bon], unite: p,
        resume: fin, correction: [egalesT.join(" = "), fin],
        relation: relationTexte(g, p), outil: "glisse-unite",
        glisseOutil: glisse(vg, g, p, {cm1: true, decimaux: true}),
        image: [relationTexte(g, p), "J'écris tout dans la même unité."],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`, sorteC9: "intrus",
        donnees: {type: "intrus", cartes: cartes.map(e => e.map(([m, u]) => [brut(m), u]))},
        cle: `C9:i:${brut(X)}${p}`
      });
    }
    return null;
  }

  // L'arrondi à l'entier (S003 p. 10) et la partie entière. La droite
  // graduée de a à a + 1 en dixièmes, le milieu en orange, la croix sur la
  // mesure (choix de Gwenaël du 21/11). Au degré 1, trois réponses au
  // choix : l'arrondi, la troncature (ou l'arrondi de l'autre côté),
  // l'arrondi au dixième ; ensuite, tapé (« 3,584 m ≈ … m »). d3 : le
  // milieu (3,5 m ≈ 4 m), le passage à la dizaine (9,7 kg ≈ 10 kg), moins
  // de 1 (0,8 L ≈ 1 L), le piège du dixième 4 (4,49 m ≈ 4 m, pas 5 m).
  const AU_C9 = {m: "au mètre", km: "au kilomètre", kg: "au kilogramme", L: "au litre"};
  // [la phrase (sa mesure dedans), la mesure, l'unité, le degré]
  const ARRONDIS_C9 = [
    ["Un marathon mesure 42,195 km.", "42,195", "km", 2],
    ["Le Piton des Neiges culmine à 3,069 km.", "3,069", "km", 1],
    ["Le Piton de la Fournaise culmine à 2,632 km.", "2,632", "km", 1],
    ["Le Grand Bénare culmine à 2,898 km.", "2,898", "km", 2],
    ["Un régime de bananes pèse 12,75 kg.", "12,75", "kg", 1],
    ["Un sac de letchis pèse 2,375 kg.", "2,375", "kg", 1],
    ["Au lancer de poids, Kenzo lance à 8,46 m.", "8,46", "m", 2],
    ["Au saut en longueur, Naïma saute 3,25 m.", "3,25", "m", 1],
    ["Une bouteille d'eau contient 1,5 L.", "1,5", "L", 3],
    // (Lot B3-2c : un CM2 court le cross de l'école, comme au B3-1.)
    ["Le cross de l'école mesure 1,5 km.", "1,5", "km", 3],
    ["Une valise pèse 18,65 kg.", "18,65", "kg", 2],
    ["Un bébé pèse 3,45 kg à la naissance.", "3,45", "kg", 3],
    ["Le sentier jusqu'à la cascade mesure 1,975 km.", "1,975", "km", 3],
    ["Un aquarium contient 54,6 L.", "54,6", "L", 2],
    // (Lot B3-2c : un seul chiffre après la virgule, au degré 2, tapé.)
    ["Un giraumon pèse 4,8 kg.", "4,8", "kg", 2],
    ["La piste de l'aéroport de Gillot mesure 3,2 km.", "3,2", "km", 2],
    ["Un jacquier pèse 9,7 kg.", "9,7", "kg", 3],
    ["Un arrosoir contient 7,35 L.", "7,35", "L", 2]
  ].map(([t, ...r]) => [CARTE.typo(t), ...r]);
  const U_ARRONDI = ["m", "kg", "L", "km", "m", "kg"];
  function valeurArrondi(rng, degre) {
    const d = () => entre(rng, 1, 9);
    if (degre === 1) {
      const a = entre(rng, 1, 19);
      const t = choisir(rng, [1, 2, 3, 6, 7, 8]);
      return choisir(rng, [`${a},${t}${d()}${d()}`, `${a},${t}${d()}`, `${a},${t}${d()}${d()}`]);
    }
    if (degre === 2) {
      const a = entre(rng, 1, 49);
      const t = choisir(rng, [0, 1, 2, 3, 4, 6, 7, 8, 9]);
      return choisir(rng, [`${a},${t}${d()}${d()}`, `${a},${t}${d()}`, `${a},5${d()}${d()}`]);
    }
    const sorte = choisir(rng, ["milieu", "dix", "zero", "quatre"]);
    if (sorte === "milieu") return `${entre(rng, 1, 29)},5`;
    if (sorte === "dix") return `${choisir(rng, [9, 19, 29, 39])},${entre(rng, 6, 9)}${rng() < 0.5 ? d() : ""}`;
    if (sorte === "zero") return `0,${entre(rng, 6, 9)}${rng() < 0.5 ? d() : ""}`;
    return `${entre(rng, 1, 29)},4${entre(rng, 5, 9)}${rng() < 0.5 ? d() : ""}`;
  }
  // L'arrondi au dixième (le mauvais choix « 3,6 m » pour 3,584 m).
  function auDixieme(x) {
    return ((x + 50n) / 100n) * 100n;
  }
  function questionArrondi(degre, rng, {saisie, valeur, u, situation = null}) {
    const x = milli(valeur);
    const a = x / MILLE;
    const reste = x % MILLE;
    if (!reste) return null;
    const milieu = reste === 500n;
    const rep = reste >= 500n ? a + 1n : a;
    const X = mes(x, u);
    const R = mes(rep * MILLE, u);
    const M = k => mes(k * MILLE, u);
    const au = AU_C9[u];
    const extra = {};
    let forme;
    let texte;
    let morceaux;
    if (!saisie) {
      const dix = auDixieme(x);
      // (Lot B3-2c, relecture : « 3,2 km » arrondi au kilomètre proposait
      // 3,2 km lui-même, « Ça, c'est arrondi au dixième. » : une mesure à
      // un seul chiffre après la virgule n'est pas au choix.)
      if (a < 1n || dix % MILLE === 0n || dix === x) return null;
      const trois = melanger(rng, [a * MILLE, (a + 1n) * MILLE, dix]);
      const choix = trois.map(y => mes(y, u));
      const bon = trois.indexOf(rep * MILLE);
      const pourquoi = {};
      trois.forEach((y, k) => {
        if (k === bon) return;
        if (y === dix) pourquoi[k] = "Ça, c'est arrondi au dixième.";
        else pourquoi[k] = milieu ? "Au milieu : au-dessus." : `Plus près de ${R}.`;
      });
      forme = "qcm";
      texte = situation ? `${situation} Arrondi ${au} :` : `${X} arrondi ${au} :`;
      morceaux = situation ? {enonce: situation, phrase: `Arrondi ${au} :`, apres: "", sorte: "mesure"} : {phrase: texte, apres: "", sorte: "mesure"};
      Object.assign(extra, {choix, bon, pourquoi});
    } else {
      forme = "nombre";
      const enonce = situation ? `${situation} J'arrondis ${au}.` : `J'arrondis ${au}.`;
      texte = `${enonce} ${X} ≈ ${CASE}${NB}${u}`;
      morceaux = {enonce, avant: `${X} ≈`, apres: u};
    }
    return q(Object.assign({
      code: "C9", degre, forme, texte, morceaux,
      reponse: forme === "qcm" ? extra.choix[extra.bon] : brut(rep * MILLE), reponseTexte: R, unite: u, grandeur: grandeurDe(u),
      resume: `${X} ≈ ${R}`,
      outil: "droite-c9", droiteC9: {a: Number(a), x: ecrire(x), u, milieu: true},
      noteOutil: milieu ? "Pile au milieu : au-dessus." : `Le plus proche : ${M(a)} ou ${M(a + 1n)} ?`,
      image: [`${M(a)} < ${X} < ${M(a + 1n)}`, `Le milieu : ${mes(a * MILLE + 500n, u)}.`],
      correction: [`${X} ≈ ${R}`], ligneB32: [`${X} ≈ `, R, ""],
      sorteC9: "arrondi", sorteArrondi: situation ? "situation" : "nombre",
      donnees: {type: "arrondi", valeur: brut(x), unite: u},
      cleBase: `C9:a:${brut(x)}${u}`, cle: `C9:a:${brut(x)}${u}${forme === "qcm" ? ":q" : ""}`
    }, extra));
  }
  function tirerArrondiC9(degre, rng) {
    const saisie = degre >= 2;
    if (rng() < 0.35) {
      const vivier = ARRONDIS_C9.filter(s => s[3] <= degre);
      const [phrase, n, u] = choisir(rng, vivier);
      return questionArrondi(degre, rng, {saisie, valeur: n, u, situation: phrase});
    }
    for (let essai = 0; essai < 20; essai += 1) {
      const x = questionArrondi(degre, rng, {saisie, valeur: valeurArrondi(rng, degre), u: choisir(rng, U_ARRONDI)});
      if (x) return x;
    }
    return null;
  }
  // Les erreurs de l'arrondi tapé.
  function erreursArrondi(question, lu, saisie) {
    const d = question.donnees;
    const x = milli(d.valeur);
    const a = x / MILLE;
    const rep = milli(question.reponse);
    if (lu === x) return {erreur: 21, retour: "Sans virgule : un nombre entier."};
    if (lu % MILLE) return lu === auDixieme(x) ? {erreur: 22, retour: "Ça, c'est arrondi au dixième."} : null;
    if (lu === a * MILLE || lu === (a + 1n) * MILLE) {
      return {erreur: 23, retour: x % MILLE === 500n ? "Au milieu : au-dessus." : `Plus près de ${mes(rep, d.unite)}.`};
    }
    return null;
  }
  // La partie entière (S003 p. 10 : « la partie entière de 105,78 ») :
  // « Dans 3,584 m, combien de mètres entiers ? ».
  // (Lot B3-2c, relecture : la droite de l'outil commençait par « 3 m » et
  // l'image par « 3 m < 3,584 m < 4 m » : la réponse. Règle de Gwenaël : un
  // outil ne donne jamais la réponse. L'outil est un exemple sur un autre
  // nombre, dans une autre unité, jamais le même nombre entier ; l'image,
  // la méthode seule. La correction garde la droite, en vert.)
  const EXEMPLES_ENTIERE = [["7,25", "m"], ["12,6", "kg"], ["8,4", "km"], ["25,5", "L"], ["3,75", "kg"], ["16,8", "m"], ["5,75", "L"], ["2,5", "km"]];
  function exempleEntiere(a, u) {
    const bons = EXEMPLES_ENTIERE.filter(([n, v]) => v !== u && BigInt(n.split(",")[0]) !== a);
    const [n, v] = bons[Number(a % BigInt(bons.length))];
    return {nombre: n, entier: n.split(",")[0], u: v};
  }
  function questionEntiere(degre, rng) {
    const u = choisir(rng, U_ARRONDI);
    const d = () => entre(rng, 1, 9);
    let x;
    if (degre === 1) x = milli(`${entre(rng, 1, 19)},${d()}${d()}${d()}`);
    else if (degre === 2) x = milli(choisir(rng, [`${entre(rng, 2, 49)},0${d()}`, `${entre(rng, 2, 49)},${entre(rng, 5, 9)}${d()}`, `${entre(rng, 2, 49)},00${d()}`]));
    else x = milli(`${entre(rng, 101, 499)},${d()}${d()}`);
    const a = x / MILLE;
    const reste = x % MILLE;
    if (!reste || a < 1n) return null;
    const X = mes(x, u);
    const R = mes(a * MILLE, u);
    const phrase = `Dans ${X}, combien de ${MOTS[u]} entiers${NB}?`;
    return q({
      code: "C9", degre, forme: "phrase", texte: `${phrase} ${CASE}${NB}${u}`, morceaux: {phrase, apres: u},
      reponse: brut(a * MILLE), reponseTexte: R, unite: u, grandeur: grandeurDe(u),
      resume: `Dans ${X}, les ${MOTS[u]} entiers : ${R}`,
      outil: "droite-c9", droiteC9: {a: Number(a), x: ecrire(x), u, milieu: false, entiere: true},
      exempleC9: exempleEntiere(a, u),
      noteOutil: `Avant la virgule : les ${MOTS[u]} entiers.`,
      image: [`Avant la virgule : les ${MOTS[u]} entiers.`, `Après la virgule : moins d'un ${MOTS[u].replace(/s$/, "")}.`],
      correction: [`${X} = ${R} + ${mes(reste, u)}`], ligneB32: [`${X} = `, R, ` + ${mes(reste, u)}`],
      sorteC9: "entiere",
      donnees: {type: "entiere", valeur: brut(x), unite: u},
      cle: `C9:e:${brut(x)}${u}`
    });
  }
  function erreursEntiere(question, lu) {
    const x = milli(question.donnees.valeur);
    const a = x / MILLE;
    const apres = BigInt(brut(x).split(",")[1]) * MILLE;
    if (lu === x) return {erreur: 31, retour: "Seulement avant la virgule."};
    if (lu === (a + 1n) * MILLE) return {erreur: 32, retour: "Je n'arrondis pas ici."};
    if (lu === apres) return {erreur: 33, retour: "Ça, c'est après la virgule."};
    return null;
  }

  // Les places de C9 : Je valide, une conversion et l'arrondi d'abord, puis
  // deux unités, la partie entière, au choix, l'arrondi tapé, l'intrus,
  // deux cases, les zéros ; À toi, toutes les sortes en alternance.
  const PLACES_C9 = {
    valide: ["conv", "arrondi", "conv-phrase", "deux-unites", "entiere", "choix", "arrondi", "intrus", "deux-cases", "conv"],
    entraine: ["conv", "arrondi", "conv", "entiere", "conv-phrase", "arrondi",
      "deux-unites", "conv", "choix", "arrondi", "intrus", "deux-cases", "entiere", "conv-phrase", "arrondi",
      "conv", "intrus", "arrondi", "deux-unites", "choix", "conv", "deux-cases", "arrondi", "entiere", "conv"],
    test: ["conv", "arrondi", "intrus", "deux-unites"],
    aide: ["conv", "arrondi", "conv"],
    retour: ["conv", "arrondi"],
    echauffement: ["conv"]
  };
  function sorteAuHasard(rng, poids) {
    let r = rng() * poids.reduce((s, [, p]) => s + p, 0);
    for (const [s, p] of poids) { r -= p; if (r < 0) return s; }
    return poids[0][0];
  }
  // Au choix, les pourquoi de C3 sur une ligne (31 signes) : avec des
  // millièmes, « 17 009 kg, ce n'est pas 17 009 t. » en prenait deux.
  function pourquoiCourts(x) {
    if (!x) return null;
    const v = milli(x.donnees.valeur);
    Object.keys(x.pourquoi).forEach(k => {
      const t = x.pourquoi[k];
      if (t.length <= 31) return;
      const y = milli(x.choix[k].replace(new RegExp(FINE, "g"), ""));
      x.pourquoi[k] = y === v ? "Le nombre change aussi." : /virgule/.test(t) ? "La virgule ne s'efface pas." : zeroDeTrop(x, y, milli(x.reponse));
    });
    return x;
  }
  ETAPES.C9 = {
    clesExemples: ["C9:2,375kg>g", "C9:18mm>m", "C9:a:3,584m"],
    formes(usage) {
      const p = PLACES_C9[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = s; });
      return f;
    },
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || sorteAuHasard(rng, [["conv", 4], ["arrondi", 3], ["entiere", 1], ["choix", 1], ["intrus", 1], ["deux-unites", 1], ["deux-cases", 1]]);
      if (sorte === "arrondi") return tirerArrondiC9(degre, rng);
      if (sorte === "entiere") return questionEntiere(degre, rng);
      if (sorte === "intrus") return intrusC9(degre, rng);
      if (sorte === "deux-unites") {
        // (Au degré 1 — l'exerciseur —, les nombres du degré 2.)
        const x = deuxUnitesC9(Math.max(2, degre), rng);
        return x && Object.assign(x, {degre});
      }
      if (sorte === "deux-cases") return deuxCasesC9(degre, rng);
      if (sorte === "conv" && degre >= 2 && rng() < 0.3) return situationC9(degre, rng);
      const x = tirerConvC9(rng, degre);
      if (sorte === "choix") return pourquoiCourts(enChoixDec(x, rng));
      return sorte === "conv-phrase" ? enPhrase(x) : x;
    },
    // (Dans Je valide : une même relation deux fois au plus.)
    accepte(serie, question, usage) {
      if (usage !== "valide" || !question.relationCle) return true;
      return serie.filter(x => x.relationCle === question.relationCle).length < 2;
    },
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const n = gr => serie.filter(x => x.grandeur === gr).length;
      return n("longueur") >= 2 && n("masse") >= 2;
    },
    erreurs(question, lu, cases, saisie) {
      const d = question.donnees;
      if (d.type === "arrondi") return typeof lu === "bigint" ? erreursArrondi(question, lu, saisie) : null;
      if (d.type === "entiere") return typeof lu === "bigint" ? erreursEntiere(question, lu) : null;
      return erreursC5(question, lu, cases, saisie);
    }
  };

  // ----------------------------- A1 · 1 m² = 100 dm², 1 dm² = 100 cm²
  // S003 p. 17 : « justifier les égalités 1 m² = 100 dm² et 1 dm² =
  // 100 cm² par un découpage » ; S023 p. 7 : « 1 dm² = 1 dm × 1 dm =
  // 10 cm × 10 cm = 100 cm² ». L'outil : le carré de 1 dm² (ou de 1 m²)
  // quadrillé 10 × 10 ; chaque toucher colore une rangée de plus et le
  // compteur dit combien de carreaux. Les sortes : les deux égalités (au
  // pavé, en phrase, au choix 10 · 100 · 1 000), l'inverse (100 cm² =
  // … dm²), les rangées coloriées (3 rangées : 30 cm²), les multiples
  // (4 dm² = … cm², 400 cm² = … dm²), et au degré 3, 1 m² = 10 000 cm².
  // Seulement cm², dm², m² au CM2.
  const CARRE_A1 = {"dm²": {cote: `10${NB}cm`, petite: "cm²", rel: `1${NB}dm = 10${NB}cm`}, "m²": {cote: `10${NB}dm`, petite: "dm²", rel: `1${NB}m = 10${NB}dm`}};
  const SOUS_A1 = {"dm²": "cm²", "m²": "dm²"};
  const COTE_A1 = {"dm²": ["dm", "cm"], "m²": ["m", "dm"]};
  // Une conversion d'aire (A1, A2) : la question, sa relation, sa
  // correction écrite avec les unités ; `extra` : l'outil.
  function conversionAire(code, degre, v, de, vers, extra = {}) {
    const rep = convertir(v, de, vers);
    if (rep === null || rep <= 0n || rep > 100000n * MILLE || decimales(rep) > 2) return null;
    const bas = exposant(de) > exposant(vers);
    const [g, p] = bas ? [de, vers] : [vers, de];
    const F = facteur(g, p);
    const relation = relationTexte(g, p);
    const X = mes(v, de);
    const R = mes(rep, vers);
    const fois = bas ? `${ecrire(v)} × ${mes(F * MILLE, p)}` : `${ecrire(rep)} × ${mes(F * MILLE, p)}`;
    const ligne = bas ? [`${X} = ${fois} = `, R, ""] : [`${X} = ${fois} = `, R, ""];
    return questionConversion(code, degre, "nombre", v, de, vers, Object.assign({
      relation, grandeur: "aire", relationCle: `${g}-${p}`,
      correction: [relation, `${X} = ${fois} = ${R}`], ligneB32: ligne
    }, extra));
  }
  function outilCarreA1(g, extra = {}) {
    const c = CARRE_A1[g];
    return Object.assign({outil: "carre-a1", carreA1: {cote: c.cote, petite: c.petite, rel: c.rel, grande: g},
      noteOutil: "Touche le carré : une rangée de plus.", carreCorr: true}, extra);
  }
  function faitA1(degre, g, rng, inverse = false) {
    const p = SOUS_A1[g];
    const [lg, lp] = COTE_A1[g];
    const x = inverse ? conversionAire("A1", degre, 100n * MILLE, p, g, outilCarreA1(g)) : conversionAire("A1", degre, MILLE, g, p, outilCarreA1(g));
    if (!x) return null;
    // La correction, avec les unités : « 1 dm² = 10 cm × 10 cm = 100 cm² »
    // (au petit téléphone, la page la fait tenir sur une ligne).
    const dix = `10${NB}${lp} × 10${NB}${lp}`;
    if (inverse) {
      // (Lot B3-2c, relecture : « … = 1 dm × 1 dm = 1 dm² » essayé, mesuré :
      // au petit iPhone, la ligne rapetissait à 13,6 px, et passait sur deux
      // lignes à 11,9 px avec une police large. Gardé.)
      x.ligneB32 = [`${mes(100n * MILLE, p)} = ${dix} = `, mes(MILLE, g), ""];
      x.correction = [x.ligneB32.join("")];
    } else {
      x.ligneB32 = [`1${NB}${g} = ${dix} = `, mes(100n * MILLE, p), ""];
      x.correction = [`1${NB}${g} = ${dix} = ${mes(100n * MILLE, p)}`];
    }
    x.image = [`Un carreau : 1${NB}${p}.`];
    x.sorteA1 = inverse ? "inverse" : "fait";
    // (Au choix : 10, 100, 1 000 ; les deux erreurs connues, la rangée
    // seule et le cube.)
    if (rng && !inverse) {
      const trois = melanger(rng, [10n, 100n, 1000n]);
      const choix = trois.map(k => ecrire(k * MILLE));
      const bon = trois.indexOf(100n);
      const pourquoi = {};
      trois.forEach((k, i) => { if (k === 10n) pourquoi[i] = `10 rangées de 10${NB}carreaux.`; else if (k === 1000n) pourquoi[i] = `10 × 10 = 100, pas 1${FINE}000.`; });
      const phrase = `1${NB}${g} = ${CASE}${NB}${p}`;
      Object.assign(x, {forme: "qcm", texte: phrase, morceaux: {phrase, apres: p, sorte: "valeur"}, choix, bon, pourquoi, cleBase: x.cle, cle: `${x.cle}:q`});
    }
    return x;
  }
  // « Je colorie 3 rangées du carré de 1 dm² : … cm² ».
  function rangeesA1(degre, rng) {
    const g = choisir(rng, ["dm²", "m²"]);
    const p = SOUS_A1[g];
    const n = entre(rng, 2, 9);
    const enonce = `Dans le carré de 1${NB}${g}, je colorie ${n} rangées.`;
    // (Lot B3-2 : « Aire coloriée : » ne tenait pas avec la case au petit iPhone.)
    const avant = "Aire :";
    const R = mes(BigInt(n * 10) * MILLE, p);
    return q(Object.assign({
      code: "A1", degre, forme: "nombre", texte: `${enonce} ${avant} ${CASE}${NB}${p}`, morceaux: {enonce, avant, apres: p},
      reponse: String(n * 10), reponseTexte: R, unite: p, grandeur: "aire",
      resume: `${n} rangées de 10${NB}${p} : ${R}`,
      image: [`Une rangée : 10${NB}carreaux de 1${NB}${p}.`],
      correction: [`${n} × 10${NB}${p} = ${R}`], ligneB32: [`${n} × 10${NB}${p} = `, R, ""], rangeesA1: n,
      sorteA1: "rangees", relationCle: `${g}-${p}`,
      donnees: {type: "rangees", n, unite: p},
      cle: `A1:r:${n}${g}`
    }, outilCarreA1(g)));
  }
  // Les multiples : « 4 dm² = … cm² », « 400 cm² = … dm² » (d2) ;
  // « 30 dm² = 3 000 cm² », « 2 000 cm² = 20 dm² » (d3).
  function multipleA1(degre, rng, inverse) {
    const g = choisir(rng, ["dm²", "m²"]);
    const p = SOUS_A1[g];
    const n = degre === 3 ? entre(rng, 1, 9) * 10 + (rng() < 0.4 ? entre(rng, 1, 9) : 0) : entre(rng, 2, 15);
    const v = inverse ? BigInt(n * 100) * MILLE : BigInt(n) * MILLE;
    const x = inverse ? conversionAire("A1", degre, v, p, g, outilCarreA1(g)) : conversionAire("A1", degre, v, g, p, outilCarreA1(g));
    if (!x) return null;
    // (Vers l'unité plus grande : « 400 cm² = 4 × 100 cm² = 4 dm² ».)
    if (inverse) {
      x.ligneB32 = [`${mes(v, p)} = ${n} × ${mes(100n * MILLE, p)} = `, mes(BigInt(n) * MILLE, g), ""];
      x.correction = [`${mes(v, p)} = ${n} × ${mes(100n * MILLE, p)} = ${mes(BigInt(n) * MILLE, g)}`];
    }
    x.image = [`Un carreau : 1${NB}${p}.`];
    x.sorteA1 = inverse ? "multiple-inverse" : "multiple";
    return x;
  }
  // 1 m² = 10 000 cm² (d3) : le carré de 1 m², puis chaque dm² en cm².
  // (Lot B3-2c : `choix` force les réponses au choix ; elles se mélangent
  // avec le vrai tirage — la bonne était toujours en premier.)
  function metreCmA1(degre, rng, inverse, choix = null) {
    const x = inverse ? conversionAire("A1", degre, 10000n * MILLE, "cm²", "m²", outilCarreA1("m²")) : conversionAire("A1", degre, MILLE, "m²", "cm²", outilCarreA1("m²"));
    if (!x) return null;
    x.noteOutil = `Puis chaque dm², c'est 100${NB}cm².`;
    // (Lot B3-2c, relecture : « 1 m² = 100 dm² = 100 × 100 cm² = … »
    // essayé, mesuré : au petit iPhone, la ligne rapetissait à 13,6 px, et
    // 11,9 px avec une police large, sur deux lignes au petit Android. Gardé.)
    x.ligneB32 = inverse ? [`10${FINE}000${NB}cm² = 100 × 100${NB}cm² = `, `1${NB}m²`, ""] : [`1${NB}m² = 100 × 100${NB}cm² = `, mes(10000n * MILLE, "cm²"), ""];
    x.correction = [x.ligneB32.join("")];
    // (Pas « 1 m² = 100 dm² » : pour « 10 000 cm² = … m² », la ligne
    // commencerait par la réponse.)
    x.image = [`Un carré de 1${NB}m de côté : 100${NB}dm².`, `1${NB}dm² = 100${NB}cm²`];
    x.sorteA1 = inverse ? "metre-cm-inverse" : "metre-cm";
    if (!inverse && rng && (choix === null ? rng() < 0.4 : choix)) {
      const trois = melanger(rng, [1000n, 10000n, 100n]);
      const choix = trois.map(k => ecrire(k * MILLE));
      const bon = trois.indexOf(10000n);
      const pourquoi = {};
      trois.forEach((k, i) => { if (k === 100n) pourquoi[i] = "Ça, c'est en dm²."; else if (k === 1000n) pourquoi[i] = `100 × 100 = 10${FINE}000.`; });
      const phrase = `1${NB}m² = ${CASE}${NB}cm²`;
      Object.assign(x, {forme: "qcm", texte: phrase, morceaux: {phrase, apres: "cm²", sorte: "valeur"}, choix, bon, pourquoi, cleBase: x.cle, cle: `${x.cle}:q`});
    }
    return x;
  }
  // Les erreurs d'une conversion d'aire (A1, A2). Une ligne (31 signes).
  function erreursAire(question, lu) {
    const d = question.donnees;
    if (typeof lu !== "bigint") return null;
    if (d.type === "rangees") return lu === BigInt(d.n) * MILLE ? {erreur: 4, retour: `Une rangée : 10${NB}carreaux.`} : null;
    if (d.type !== "conv") return null;
    const v = milli(d.valeur);
    const rep = milli(question.reponse);
    const bas = exposant(d.de) > exposant(d.vers);
    const [g, p] = bas ? [d.de, d.vers] : [d.vers, d.de];
    const F = facteur(g, p);
    if (bas && v % F === 0n && lu === v / F) return {erreur: 1, retour: "Vers plus petit : je multiplie."};
    if (!bas && lu === v * F) return {erreur: 3, retour: "Vers plus grand : je divise."};
    if (v === MILLE && bas && lu === 1000n * MILLE && F === 100n) return {erreur: 2, retour: `10 × 10 = 100, pas 1${FINE}000.`};
    if (bas && lu === v * 10n) return {erreur: 2, retour: `1${NB}${g} = ${mes(F * MILLE, p)}, pas 10.`};
    if (bas && F === 10000n && lu === v * 100n) return {erreur: 2, retour: `Et chaque dm², c'est 100${NB}cm².`};
    if (!bas && lu * 10n === v) return {erreur: 2, retour: `${mes(F * MILLE, p)} font 1${NB}${g}, pas 10.`};
    // (Le zéro mal placé : 3,5 dm² → 305 cm².)
    const reste = v % MILLE;
    if (bas && reste && decimales(v) < String(F).length - 1) {
      const chiffres = BigInt(brut(v).split(",")[1]) * MILLE;
      if (lu === (v - reste) * F + chiffres) return {erreur: 6, retour: `${mes(reste, d.de)}, c'est ${mes(convertir(reste, d.de, d.vers), d.vers)}.`};
    }
    if (lu === rep * 10n) return {erreur: 5, retour: "Un zéro de trop."};
    if (lu * 10n === rep) return {erreur: 5, retour: "Un zéro de moins."};
    if (lu === v) {
      const t = `${mes(v, d.de)}, ce n'est pas ${mes(v, d.vers)}.`;
      return {erreur: 7, retour: t.length <= 31 ? t : "Le nombre change aussi."};
    }
    return null;
  }
  const PLACES_A1 = {
    valide: ["fait", "rangees", "choix", "inverse", "multiple", "multiple-phrase", "multiple-inverse", "metre-cm", "multiple", "multiple-inverse"],
    entraine: ["fait", "rangees", "choix", "rangees", "fait-phrase", "rangees",
      "inverse", "multiple", "multiple-inverse", "multiple-phrase", "inverse", "multiple", "choix", "multiple-inverse", "multiple",
      "metre-cm", "multiple", "multiple-inverse", "multiple-phrase", "multiple", "metre-cm", "multiple-inverse", "multiple", "choix", "multiple-phrase"],
    test: ["multiple", "metre-cm", "multiple-inverse", "inverse"],
    aide: ["fait", "multiple", "multiple-inverse"],
    retour: ["multiple", "multiple-inverse"],
    echauffement: ["multiple"]
  };
  ETAPES.A1 = {
    // Les deux égalités SONT ce qu'on apprend par cœur : Je valide doit
    // pouvoir les demander (comme les relations de P1).
    exclureExemples: false,
    clesExemples: ["A1:1dm²>cm²", "A1:1m²>dm²"],
    formes(usage) {
      const p = PLACES_A1[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = s; });
      return f;
    },
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || choisir(rng, {1: ["fait", "rangees", "choix"], 2: ["inverse", "multiple", "multiple-inverse"], 3: ["metre-cm", "multiple", "multiple-inverse"]}[degre]);
      const g = choisir(rng, ["dm²", "m²"]);
      if (sorte === "fait") return faitA1(degre, g, null);
      if (sorte === "fait-phrase") return enPhrase(faitA1(degre, g, null));
      if (sorte === "choix") return degre === 3 ? metreCmA1(degre, rng, false, true) : faitA1(degre, g, rng);
      if (sorte === "inverse") return faitA1(degre, g, null, true);
      if (sorte === "rangees") return rangeesA1(degre, rng);
      if (sorte === "metre-cm") return metreCmA1(degre, rng, rng() < 0.3);
      const x = multipleA1(degre, rng, sorte === "multiple-inverse");
      return sorte === "multiple-phrase" ? enPhrase(x) : x;
    },
    valide(serie, usage) {
      if (usage !== "valide") return true;
      // (Les deux carrés : celui de 1 dm² et celui de 1 m².)
      return serie.filter(x => x.relationCle === "dm²-cm²").length >= 2 && serie.filter(x => x.relationCle === "m²-dm²").length >= 2;
    },
    erreurs(question, lu) { return erreursAire(question, lu); }
  };

  // --------------------------- A2 · Convertir des aires (vers plus petit)
  // S003 p. 17 : « convertir 3,7 dm² en cm² en s'appuyant sur 1 dm² =
  // 100 cm² ». Vers une unité plus petite seulement (vers la plus grande :
  // A3, en 6e). Degré 1 : des dixièmes, quatre carrés dessinés au plus
  // (3,7 dm² : 3 carrés et 7 rangées) ; degré 2 : des centièmes, des
  // nombres plus grands (12,4 m²), au choix ; degré 3 : les zéros (3,05 dm²
  // = 305 cm² ; 0,07 m² = 7 dm²) et m² → cm² (× 10 000).
  // Des aires vraies : [l'énoncé, la mesure, son unité, l'unité demandée,
  // le degré]. (Une carte postale de 10 cm sur 15 cm : 1,5 dm².)
  const SITUATIONS_A2 = [
    ["Une carte postale a une aire de 1,5 dm².", "1,5", "dm²", "cm²", 1],
    ["Un écran de tablette a une aire de 3,2 dm².", "3,2", "dm²", "cm²", 1],
    ["Une serviette de plage a une aire de 1,5 m².", "1,5", "m²", "dm²", 1],
    ["Un panneau solaire a une aire de 1,7 m².", "1,7", "m²", "dm²", 1],
    ["Une nappe a une aire de 2,4 m².", "2,4", "m²", "dm²", 1],
    ["Une feuille A4 a une aire d'environ 6,2 dm².", "6,2", "dm²", "cm²", 2],
    ["Une chambre a une aire de 12 m².", "12", "m²", "dm²", 2],
    ["La case créole a une aire de 48,5 m².", "48,5", "m²", "dm²", 2],
    ["Une ardoise a une aire de 4,5 dm².", "4,5", "dm²", "cm²", 2],
    ["Le tableau de la classe a une aire de 4,8 m².", "4,8", "m²", "dm²", 2],
    ["Un carreau de faïence a une aire de 2,25 dm².", "2,25", "dm²", "cm²", 2],
    ["La varangue a une aire de 18,5 m².", "18,5", "m²", "dm²", 2],
    ["Le terrain de pétanque a une aire de 45 m².", "45", "m²", "dm²", 2],
    ["Un carreau de la varangue a une aire de 0,09 m².", "0,09", "m²", "dm²", 3],
    ["Une dalle de la cour a une aire de 0,25 m².", "0,25", "m²", "dm²", 3],
    ["Un timbre a une aire de 0,04 dm².", "0,04", "dm²", "cm²", 3],
    ["Une fenêtre a une aire de 1,2 m².", "1,2", "m²", "cm²", 3],
    ["Un panneau solaire a une aire de 1,7 m².", "1,7", "m²", "cm²", 3]
  ].map(([t, ...r]) => [CARTE.typo(t), ...r]);
  // Peut-on découper ? quatre carrés dessinés au plus (le dernier en
  // rangées) : n,d avec n ≤ 3, ou n ≤ 4 entier.
  function decoupeDe(v, g, p) {
    if (facteur(g, p) !== 100n || decimales(v) > 1) return null;
    const n = Number(v / MILLE);
    const d = Number((v % MILLE) / 100n);
    // (Pas 0,1 dm² : « Une rangée : 10 cm². » serait la réponse.)
    if (n + (d ? 1 : 0) > 4 || n + d === 0 || (n === 0 && d === 1)) return null;
    return {n, d, grande: g, petite: p};
  }
  function conversionA2(degre, v, g, p) {
    if (v === MILLE) return null;
    const F = facteur(g, p);
    const dec = degre === 1 ? decoupeDe(v, g, p) : null;
    const extra = dec
      ? {outil: "decoupe-a2", decoupeA2: dec, decoupeCorr: true, noteOutil: dec.d ? `Une rangée : 10${NB}${p}.` : `Un carré : 1${NB}${g}.`}
      : {outil: "calcul-a2", calculA2: {nombre: ecrire(v), grande: g, petite: p, facteur: ecrire(F * MILLE)}, noteOutil: `Chaque ${g}, c'est ${mes(F * MILLE, p)}.`};
    const x = conversionAire("A2", degre, v, g, p, extra);
    if (!x) return null;
    x.image = F === 10000n ? [`1${NB}m² = 100${NB}dm²`, `1${NB}dm² = 100${NB}cm²`] : [x.relation];
    x.sorteA2 = dec ? "decoupe" : "calcul";
    return x;
  }
  function tirerA2(rng, degre) {
    const c = () => entre(rng, 1, 9);
    for (let essai = 0; essai < 40; essai += 1) {
      let [g, p] = choisir(rng, [["dm²", "cm²"], ["m²", "dm²"]]);
      let t;
      if (degre === 1) t = rng() < 0.2 ? `${entre(rng, 2, 4)}` : `${entre(rng, 0, 3)},${c()}`;
      else if (degre === 2) t = choisir(rng, [`${c()},${c()}${c()}`, `${entre(rng, 11, 49)},${c()}`, `${entre(rng, 5, 9)},${c()}`, `${entre(rng, 11, 60)}`]);
      else {
        if (rng() < 0.4) { [g, p] = ["m²", "cm²"]; t = choisir(rng, [`${c()},${c()}`, `0,${c()}`, `${entre(rng, 2, 9)}`]); }
        else t = choisir(rng, [`${c()},0${c()}`, `0,0${c()}`, `${entre(rng, 11, 49)},0${c()}`, `0,${c()}${c()}`]);
      }
      const x = conversionA2(degre, milli(t), g, p);
      if (x) return x;
    }
    return null;
  }
  function situationA2(degre, rng) {
    const vivier = SITUATIONS_A2.map((s, k) => [s, k]).filter(([s]) => s[4] === degre);
    const [[enonce, n, g, p], k] = choisir(rng, vivier);
    const x = conversionA2(degre, milli(n), g, p);
    if (!x) return null;
    const avant = `${mes(milli(n), g)} =`;
    return Object.assign(x, {texte: `${enonce} ${avant} ${CASE}${NB}${p}`, morceaux: {enonce, avant, apres: p},
      sorteA2: `situation-${x.sorteA2}`, situationA2: k, cleBase: x.cle, cle: `A2:s:${k}`});
  }
  // Au choix : la rangée seule (× 10), un zéro de trop (× 1 000), le
  // nombre gardé, le zéro mal placé.
  function enChoixA2(x, rng) {
    if (!x) return null;
    const d = x.donnees;
    const v = milli(d.valeur);
    const rep = milli(x.reponse);
    const F = facteur(d.de, d.vers);
    const reste = v % MILLE;
    const malPlace = reste && decimales(v) < String(F).length - 1 ? (v - reste) * F + BigInt(brut(v).split(",")[1]) * MILLE : null;
    const faux = [v * 10n, malPlace, F === 100n ? v * 1000n : v * 100n, v].filter(y => y !== null && y !== rep && y <= 100000n * MILLE && decimales(y) <= 2);
    const propres = [...new Set(faux.map(String))].map(BigInt);
    if (propres.length < 2) return null;
    return enQcm(x, rep, [propres[0], choisir(rng, propres.slice(1))], y => {
      const e = erreursAire(x, y);
      return e ? e.retour : y > rep ? "Un zéro de trop." : "Un zéro de moins.";
    }, rng);
  }
  const PLACES_A2 = {
    valide: ["conv", "situation", "conv-phrase", "conv", "choix", "situation", "conv", "conv", "situation", "conv-phrase"],
    entraine: ["conv", "conv", "situation", "conv-phrase", "conv", "situation",
      "conv", "choix", "situation", "conv", "conv-phrase", "conv", "choix", "situation", "conv",
      "conv", "situation", "conv", "choix", "conv-phrase", "conv", "situation", "conv", "choix", "conv"],
    test: ["conv", "conv", "situation", "choix"],
    aide: ["conv", "situation", "conv"],
    retour: ["conv", "situation"],
    echauffement: ["conv"]
  };
  ETAPES.A2 = {
    clesExemples: ["A2:3,7dm²>cm²", "A2:2,45m²>dm²", "A2:0,6dm²>cm²"],
    formes(usage) {
      const p = PLACES_A2[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = s; });
      return f;
    },
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || choisir(rng, ["conv", "conv", "situation", "choix"]);
      if (sorte === "situation") return situationA2(degre, rng);
      const x = tirerA2(rng, degre);
      if (sorte === "choix") return enChoixA2(x, rng);
      return sorte === "conv-phrase" ? enPhrase(x) : x;
    },
    valide(serie, usage) {
      if (usage !== "valide") return true;
      const n = u => serie.filter(x => x.donnees.de === u).length;
      return n("dm²") >= 3 && n("m²") >= 3;
    },
    erreurs(question, lu) { return erreursAire(question, lu); }
  };
  // (Lot B3-2c, mesuré au petit Android et par le robot : « 3 069 m = … km »,
  // « 46,521 kg ≈ … kg », « 2,4 m² = … dm² » sortaient du cadre de la
  // question à 360 px.) La ligne de la case un peu plus petite (`long`) dès
  // 11 signes autour de la case ; une situation (son énoncé au-dessus) plus
  // serrée aussi (`serre`, comme Q2).
  function ligneB32(x) {
    const m = x && x.morceaux;
    if (!m || m.avant === undefined) return x;
    const n = m.avant.length + (m.apres || "").length + (m.cases || []).join("").length;
    if (n >= 11) m.long = true;
    // Sous un énoncé (une situation, « J'arrondis au mètre. ») : l'énoncé
    // serré sur deux lignes au plus (`deuxLignes`, comme les phrases au-dessus
    // de la case : avec une police large, il en prenait trois et la question
    // de toute la série grandissait), la case un peu moins large (`etroite` :
    // « 2,632 km ≈ … km », « 2,25 dm² = … cm² » sortaient du cadre à 360 px
    // avec une police large ; la réponse a six signes au plus).
    if (m.enonce && x.forme === "nombre") Object.assign(m, {long: true, serre: true, etroite: true, deuxLignes: true});
    return x;
  }
  // (Lot B3-2c, relecture : « 9,855 L arrondi au litre : », « Aire : »,
  // « … : c'est l'intrus. » avaient une espace normale devant « : » ;
  // ces textes sont affichés tels quels. Tous passent par CARTE.typo.)
  function typoB32(x) {
    if (!x) return x;
    const t = CARTE.typo;
    const m = x.morceaux;
    if (m) ["phrase", "avant", "enonce"].forEach(k => { if (typeof m[k] === "string") m[k] = t(m[k]); });
    ["texte", "resume", "noteOutil"].forEach(k => { if (typeof x[k] === "string") x[k] = t(x[k]); });
    ["correction", "ligneB32", "image"].forEach(k => { if (Array.isArray(x[k])) x[k] = x[k].map(t); });
    if (x.pourquoi) Object.keys(x.pourquoi).forEach(k => { x.pourquoi[k] = t(x.pourquoi[k]); });
    return x;
  }
  ["C9", "A1", "A2"].forEach(code => {
    const tirer = ETAPES[code].tirer;
    ETAPES[code].tirer = (...args) => typoB32(ligneB32(tirer(...args)));
  });

  // ======================================================== palier 3 (lot B3-3)
  // D3 « Minutes et secondes », Q3 « Problèmes : plusieurs fois, partager »,
  // Q4 « Problèmes : une fraction d'une quantité ». Choix pris dans la nuit
  // du 21 au 22/11 en l'absence de Gwenaël (lot B3-3a, réversibles) : D3, la
  // barre de la minute (comme la barre de l'heure de D1) et l'axe à arcs de
  // Q10 pour une durée à la seconde ; Q3 et Q4, la barre du document (S003
  // p. 4 et 11-12, comme Q2 et C6). Les unités restent écrites dans les
  // calculs (S023 p. 5) ; aucun algorithme posé en base soixante (S003
  // p. 18) ; pas de tableau de conversion au cours moyen (S001).
  // Un outil ne donne jamais la réponse ; un pourquoi : 31 signes au plus.
  // La correction : le dessin en vert, puis les lignes de calcul ; la
  // dernière en trois morceaux (avant, la réponse en vert, après) :
  // `lignesB33`.

  // --------------------------------------------- D3 · Minutes et secondes
  // S003 p. 18 : lire l'heure avec la trotteuse ; la durée entre 8 h 52 min
  // 27 s et 11 h 37 min 18 s ; les secondes dans deux heures et vingt
  // minutes ; un axe orienté, des instants intermédiaires. S003 p. 19 : le
  // marathon (une durée), l'étape cycliste (l'heure de départ), le triathlon
  // (une durée manquante, des kilomètres qui ne servent pas). S433 : 200 s
  // = 3 min 20 s, « dans 2 000 heures, combien de jours ? ». Les instants
  // sont des secondes depuis minuit.
  const sD3 = n => `${ecrire(BigInt(n) * MILLE)}${NB}s`;
  function partsD3(t) {
    return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60];
  }
  // « 9 h 58 min 40 s » ; « 10 h » (l'heure pile) ; « 10 h 15 min » (la
  // minute pile). Une heure ne se coupe jamais (insécables partout).
  function instantD3(t) {
    const [h, m, s] = partsD3(t);
    const p = [`${h}${NB}h`];
    if (m || s) p.push(`${m}${NB}min`);
    if (s) p.push(`${s}${NB}s`);
    return p.join(NB);
  }
  // « 1 h 17 min 32 s », « 13 min 35 s », « 45 s ».
  function dureeD3(d) {
    const [h, m, s] = partsD3(d);
    const p = [];
    if (h) p.push(`${h}${NB}h`);
    // (« 3 h 0 min 37 s », pas « 3 h 37 s » qui se lirait 3 h 37.)
    if (m || (h && s)) p.push(`${m}${NB}min`);
    if (s || !p.length) p.push(`${s}${NB}s`);
    return p.join(NB);
  }
  // « 83 jours 8 h ».
  const joursD3 = (j, h) => (h ? `${j}${NB}jours${NB}${h}${NB}h` : `${j}${NB}jours`);
  // La réponse dans les cases : [h, min, s], [min, s], [jours, h]…
  const TAILLES_D3 = {s: {h: 3600, min: 60, s: 1}, h: {jours: 24, h: 1}};
  function enCasesD3(qte, base, unites) {
    let reste = qte;
    return unites.map(u => { const t = TAILLES_D3[base][u]; const n = Math.floor(reste / t); reste -= n * t; return String(n); });
  }
  // Une question de D3 finie : la réponse dans ses cases, la clé sans espace.
  function finirD3(champs) {
    const {sorte, qte, base, unites} = champs.d3;
    const reponse = enCasesD3(qte, base, unites);
    const deux = unites.length > 1;
    const ec = n => ecrire(BigInt(n) * MILLE);
    const reponseTexte = base === "h" ? (deux ? joursD3(Number(reponse[0]), Number(reponse[1])) : `${ec(reponse[0])}${NB}jours`)
      : deux ? unites.map((u, k) => `${ec(reponse[k])}${NB}${u}`).join(NB) : `${ec(reponse[0])}${NB}${unites[0]}`;
    const x = q(Object.assign({
      code: "D3", grandeur: "duree", unite: unites[unites.length - 1],
      reponse: deux ? reponse : reponse[0], reponseTexte, sorteD3: sorte
    }, champs, {
      donnees: Object.assign({type: "d3", sorte, q: qte, base, unites}, champs.donnees || {})
    }));
    delete x.d3;
    if (deux && x.forme !== "qcm") x.forme = "deux-cases";
    return x;
  }

  // 1 min = 60 s (au pavé, en phrase, au choix 60 · 100 · 30).
  function faitD3(degre, rng, auChoix = false) {
    const avant = `1${NB}min =`;
    // (Au choix 60 · 100 · 30 une fois sur quatre, au pavé ou en phrase sinon.)
    if (rng && !auChoix && rng() < 0.25) auChoix = true;
    const phrase = rng && !auChoix && rng() < 0.4;
    const x = finirD3({
      degre, forme: phrase ? "phrase" : "nombre",
      texte: phrase ? `Combien de secondes dans 1${NB}min${NB}? ${CASE}${NB}s` : `${avant} ${CASE}${NB}s`,
      morceaux: phrase ? {phrase: `Combien de secondes dans 1${NB}min${NB}?`, apres: "s"} : {avant, apres: "s"},
      resume: `1${NB}min = 60${NB}s`,
      outil: "barre-minute", barreD3: {n: 1, plus: 0, quarts: true}, noteOutil: "Un quart de minute : 15 s.",
      image: [`Un quart de tour de trotteuse : 15${NB}s.`, "Combien de quarts dans un tour ?"],
      correction: [`1${NB}min = 4 × 15${NB}s = 60${NB}s`], lignesB33: [[`1${NB}min = 4 × 15${NB}s = `, sD3(60), ""]],
      corrB33: {type: "barre-minute", n: 1, plus: 0, quarts: true},
      d3: {sorte: "fait", qte: 60, base: "s", unites: ["s"]}, cle: "D3:f:1min"
    });
    if (!auChoix) return x;
    const trois = melanger(rng, [60, 100, 30]);
    // (Correctif B3-3 : l'unité dans chaque choix, « 30 s », comme les
    // autres choix de D3 : « Tu as choisi : 30 s ».)
    const choix = trois.map(v => sD3(v));
    const bon = trois.indexOf(60);
    const pourquoi = {};
    trois.forEach((v, k) => {
      if (v === 100) pourquoi[k] = `60${NB}s dans 1${NB}min, pas 100.`;
      if (v === 30) pourquoi[k] = `30${NB}s : une demi-minute.`;
    });
    return Object.assign(x, {forme: "qcm", texte: `${avant} ${CASE}`, morceaux: {phrase: `${avant} ${CASE}`, apres: "", sorte: "duree"},
      choix, bon, pourquoi, cleBase: x.cle, cle: `${x.cle}:q`});
  }

  // Des situations (une chanson, le micro-ondes…) : [la phrase avec {X},
  // la sorte, les durées possibles en secondes (min, max, pas), le degré].
  const SITUATIONS_D3 = [
    ["Une chanson dure {X}.", "min-s", [150, 285, 15], 2],
    ["Une vidéo dure {X}.", "min-s", [95, 270, 5], 2],
    ["Un œuf à la coque cuit {X}.", "min-s", [180, 240, 30], 2],
    ["Le séga du spectacle dure {X}.", "min-s", [150, 280, 10], 2],
    ["Le micro-ondes chauffe le bol {X}.", "s-min", [70, 150, 10], 2],
    ["Le feu reste rouge {X}.", "s-min", [65, 110, 5], 2],
    ["Un épisode de dessin animé dure {X}.", "min-s", [1230, 1470, 15], 3],
    ["Le gâteau cuit {X}.", "min-s", [1530, 2370, 30], 3]
  ];

  // min → s. d1 : « 3 min = … s » (la barre) ; d2 : « 4 min 15 s = … s » ;
  // d3 : « 2 h 20 min = … s » (S003, deux étapes) ou « 12 min 30 s ».
  function minSecD3(degre, rng, total0 = null, situation = null) {
    let h = 0;
    let m;
    let s = 0;
    if (total0 !== null) [h, m, s] = partsD3(total0);
    else if (degre === 1) m = entre(rng, 2, 9);
    else if (degre === 2) { m = entre(rng, 1, 4); s = entre(rng, 1, 11) * 5; }
    else if (rng() < 0.55) { h = entre(rng, 1, 3); m = entre(rng, 1, 11) * 5; }
    else { m = entre(rng, 6, 19); s = entre(rng, 1, 11) * 5; if (m === 10) return null; }
    const total = h * 3600 + m * 60 + s;
    const gauche = dureeD3(total);
    const R = sD3(total);
    const avant = `${gauche} =`;
    const champs = {degre, forme: "nombre", texte: `${avant} ${CASE}${NB}s`, morceaux: {avant, apres: "s"}, resume: `${gauche} = ${R}`,
      relation: `1${NB}min = 60${NB}s`, d3: {sorte: "min-s", qte: total, base: "s", unites: ["s"]}, cle: `D3:${total}s>s`};
    if (h) {
      const M = h * 60 + m;
      Object.assign(champs, {outil: "lignes", outilLignes: [`1${NB}h = 60${NB}min`, `1${NB}min = 60${NB}s`], noteOutil: "D'abord tout en minutes.",
        image: [`${gauche} = ${h} × 60${NB}min + ${m}${NB}min`], correction: [`${gauche} = ${M}${NB}min`, `${M} × 60${NB}s = ${R}`],
        lignesB33: [`${gauche} = ${M}${NB}min`, [`${M} × 60${NB}s = `, R, ""]], corrB33: null});
    } else if (m <= 5) {
      Object.assign(champs, {outil: "barre-minute", barreD3: {n: m, plus: s}, noteOutil: "Je compte les secondes de chaque bloc.",
        image: [`1${NB}min = 60${NB}s`, `${m}${NB}min = ${m} × 60${NB}s`],
        correction: [`${s ? `${m} × 60${NB}s + ${s}${NB}s` : `${m} × 60${NB}s`} = ${R}`],
        lignesB33: [[s ? `${m === 1 ? `60${NB}s` : `${m} × 60${NB}s`} + ${s}${NB}s = ` : `${m} × 60${NB}s = `, R, ""]],
        corrB33: {type: "barre-minute", n: m, plus: s}});
    } else {
      Object.assign(champs, {outil: "lignes", outilLignes: [`1${NB}min = 60${NB}s`, `10${NB}min = 600${NB}s`], noteOutil: "Je compte les secondes de chaque minute.",
        // (Sans secondes en plus : « 8 × 60 s = 480 s », pas « + 0 s ».)
        image: [`${m}${NB}min = ${m} × 60${NB}s`], correction: [`${m} × 60${NB}s${s ? ` + ${s}${NB}s` : ""} = ${R}`],
        lignesB33: [[`${m} × 60${NB}s${s ? ` + ${s}${NB}s` : ""} = `, R, ""]], corrB33: null});
    }
    const x = finirD3(champs);
    if (situation) {
      // (La situation donne la durée ; la ligne demande « Durée : … s ».)
      const enonce = situation.replace("{X}", gauche);
      Object.assign(x, {texte: `${enonce} Durée : ${CASE}${NB}s`, morceaux: {enonce, avant: "Durée :", apres: "s"}, sorteD3: "situation", cleBase: x.cle, cle: `${x.cle}:s`});
    }
    return x;
  }

  // s → min. d1 : « 180 s = … min » ; d2 : « 200 s = … min … s » (le
  // reste, S433) ; d3 : « 2 000 s = … min … s ».
  function secMinD3(degre, rng, total0 = null, situation = null) {
    let total = total0;
    if (total === null) {
      if (degre === 1) total = entre(rng, 2, 9) * 60;
      else if (degre === 2) total = entre(rng, 1, 4) * 60 + entre(rng, 1, 11) * 5;
      else total = entre(rng, 20, 48) * 50;
    }
    if (degre >= 2 && total % 60 === 0) return null;
    const m = Math.floor(total / 60);
    const s = total % 60;
    const G = sD3(total);
    const avant = `${G} =`;
    const champs = {degre, resume: "", relation: `1${NB}min = 60${NB}s`, cle: `D3:${total}s>min`};
    if (!s) {
      const R = `${m}${NB}min`;
      Object.assign(champs, {forme: "nombre", texte: `${avant} ${CASE}${NB}min`, morceaux: {avant, apres: "min"}, resume: `${G} = ${R}`,
        outil: "barre-minute", barreD3: {n: 1, plus: 0}, noteOutil: `Je fais des paquets de 60${NB}s.`,
        image: [`1${NB}min = 60${NB}s`, `${G} = ${CASE} × 60${NB}s`],
        correction: [`${G} = ${m} × 60${NB}s = ${R}`], lignesB33: [[`${G} = ${m} × 60${NB}s = `, R, ""]], corrB33: {type: "barre-minute", n: m, plus: 0},
        d3: {sorte: "s-min", qte: total, base: "s", unites: ["min"]}});
    } else {
      const R = `${m}${NB}min${NB}${s}${NB}s`;
      const petit = m <= 5;
      Object.assign(champs, {texte: `${avant} ${CASE}${NB}min ${CASE}${NB}s`, morceaux: {avant, cases: ["min", "s"]}, resume: `${G} = ${R}`,
        outil: petit ? "barre-minute" : "lignes", barreD3: {n: 1, plus: 0},
        outilLignes: [`1${NB}min = 60${NB}s`, `10${NB}min = 600${NB}s`], noteOutil: `Je fais des paquets de 60${NB}s.`,
        image: petit ? [`1${NB}min = 60${NB}s`, `${G} = ${CASE} × 60${NB}s + ${CASE}${NB}s`] : [`10${NB}min = 600${NB}s`, `${G} = ${CASE} × 60${NB}s + ${CASE}${NB}s`],
        correction: [`${G} = ${m} × 60${NB}s + ${sD3(s)} = ${R}`],
        lignesB33: [[`${G} = ${m} × 60${NB}s + ${sD3(s)} = `, R, ""]], corrB33: petit ? {type: "barre-minute", n: m, plus: s} : null,
        d3: {sorte: "s-min", qte: total, base: "s", unites: ["min", "s"]}});
    }
    const x = finirD3(champs);
    if (situation) {
      const enonce = situation.replace("{X}", G);
      x.morceaux = Object.assign({}, x.morceaux, {enonce, avant: "Durée :"});
      x.texte = `${enonce} Durée : ${x.texte.slice(x.texte.indexOf("=") + 2)}`;
      Object.assign(x, {sorteD3: "situation", cleBase: x.cle, cle: `${x.cle}:s`});
    }
    return x;
  }
  function situationD3(degre, rng) {
    const vivier = SITUATIONS_D3.filter(s => s[3] === degre);
    if (!vivier.length) return null;
    const [phrase, sorte, [a, b, pas]] = choisir(rng, vivier);
    const t = entre(rng, a, b, pas);
    if (t % 60 === 0) return null;
    return sorte === "min-s" ? minSecD3(degre, rng, t, phrase) : secMinD3(degre, rng, t, phrase);
  }

  // h → jours (S433 : « Dans 2 000 heures, combien de jours ? »). d2 : 72 h
  // = 3 jours ; d3 : avec un reste, 2 000 h = 83 jours 8 h.
  function joursDeD3(degre, rng) {
    const H = degre <= 2 ? entre(rng, 2, 7) * 24 : choisir(rng, [entre(rng, 2, 9) * 50, entre(rng, 5, 20) * 100]);
    if (degre === 3 && H % 24 === 0) return null;
    const j = Math.floor(H / 24);
    const r = H % 24;
    const G = `${ecrire(BigInt(H) * MILLE)}${NB}h`;
    const avant = `${G} =`;
    const rel = `1${NB}jour = 24${NB}h`;
    const commun = {degre, relation: rel, outil: "barre-jour", barreD3: {n: 1, plus: 0, jour: true}, noteOutil: `Je fais des paquets de 24${NB}h.`,
      cle: `D3:${H}h>j`};
    if (!r) {
      const R = `${j}${NB}jours`;
      return finirD3(Object.assign(commun, {forme: "nombre", texte: `${avant} ${CASE}${NB}jours`, morceaux: {avant, apres: "jours"}, resume: `${G} = ${R}`,
        image: [rel, `${G} = ${CASE} × 24${NB}h`], correction: [`${G} = ${j} × 24${NB}h = ${R}`], lignesB33: [[`${G} = ${j} × 24${NB}h = `, R, ""]],
        corrB33: null, d3: {sorte: "jours", qte: H, base: "h", unites: ["jours"]}}));
    }
    const R = joursD3(j, r);
    const fois = `${j} × 24${NB}h = ${ecrire(BigInt(j * 24) * MILLE)}${NB}h`;
    return finirD3(Object.assign(commun, {texte: `${avant} ${CASE}${NB}jours ${CASE}${NB}h`, morceaux: {avant, cases: ["jours", "h"]}, resume: `${G} = ${R}`,
      image: [rel, `10${NB}jours = 240${NB}h`], correction: [fois, `${G} = ${R}`], lignesB33: [fois, [`${G} = `, R, ""]], corrB33: null,
      d3: {sorte: "jours", qte: H, base: "h", unites: ["jours", "h"]}}));
  }

  // Lire l'heure à la seconde (S003 p. 18) : l'horloge à trois aiguilles
  // dans la question, trois cases. d1 : les secondes de 5 en 5 ; ensuite,
  // à la seconde près.
  function lireD3(degre, rng) {
    const h = entre(rng, 1, 11);
    const m = entre(rng, 3, 56);
    const s = degre === 1 ? entre(rng, 1, 11) * 5 : entre(rng, 1, 59);
    if (degre >= 2 && s % 5 === 0) return null;
    // (La grande aiguille et la trotteuse jamais l'une sur l'autre.)
    if (Math.abs(m - s) < 4) return null;
    const t = h * 3600 + m * 60 + s;
    const phrase = "Quelle heure est-il ?";
    const R = instantD3(t);
    return finirD3({
      degre, texte: `${phrase} ${CASE}${NB}h ${CASE}${NB}min ${CASE}${NB}s`, morceaux: {phrase, horlogeD3: {h, m, s}, cases: ["h", "min", "s"]},
      resume: `L'horloge indique ${R}.`, outil: "aiguilles-d3", noteOutil: "",
      image: ["Une petite graduation : 1 min,", "ou 1 s pour la trotteuse."],
      correction: [R], lignesB33: [["", R, ""]], corrB33: {type: "horloge", h, m, s},
      d3: {sorte: "lire", qte: t, base: "s", unites: ["h", "min", "s"]}, donnees: {h, m, s}, cle: `D3:l:${t}`
    });
  }

  // Les durées à la seconde : [modèle, énoncé ({P}, {D}, {A}), durée min,
  // max (en s), heure du début au plus tôt, au plus tard (en h)].
  // d1 : moins d'une minute, en passant la minute pile ; d2 : quelques
  // minutes, en passant l'heure pile ; d3 : plus d'une heure (le marathon).
  const DUREES_D3 = {
    1: [
      ["feu", "Le feu reste rouge de {D} à {A}.", 20, 50, 7, 18],
      ["micro", "Le micro-ondes tourne de {D} à {A}.", 30, 55, 7, 19],
      ["pub", "Une publicité passe de {D} à {A}.", 15, 45, 12, 20],
      ["sprint", "50 m en EPS : de {D} à {A}.", 8, 12, 8, 16],
      ["nage", "{P} nage une longueur de {D} à {A}.", 25, 55, 8, 17]
    ],
    2: [
      ["course", "{P} court de {D} à {A}.", 360, 1500, 7, 17],
      ["video", "Une vidéo passe de {D} à {A}.", 130, 540, 9, 20],
      ["chanson", "Une chanson passe de {D} à {A}.", 130, 290, 9, 20],
      ["cross", "Cross de l'école : de {D} à {A}.", 420, 840, 8, 11],
      ["pirogue", "Course de pirogues : de {D} à {A}.", 600, 1500, 8, 16],
      ["baie", "Baie de Saint-Paul à la nage : de {D} à {A}.", 1500, 2900, 7, 15]
    ],
    3: [
      ["marathon", "Marathon : de {D} à {A}.", 10800, 18000, 8, 10],
      ["semi", "Semi-marathon : de {D} à {A}.", 5100, 9000, 7, 9],
      ["mega", "Mégavalanche du Maïdo : de {D} à {A}.", 3700, 5900, 8, 13]
    ]
  };
  // Trouver l'heure de départ : [modèle, énoncé ({P}, {A}, {d}), durée min,
  // max (en s), fin au plus tôt, au plus tard (en h)]. d3 : l'étape
  // cycliste de S003 (1 h 17 min 32 s, arrivée à 12 h 10 min 43 s).
  const DEPARTS_D3 = {
    2: [
      ["plage", "Arrivée à la plage à {A}, après {d} de marche.", 400, 1500, 8, 17],
      ["cross", "Au cross, {P} court {d} et arrive à {A}.", 420, 840, 9, 11],
      ["pirogue", "Une pirogue arrive à {A}, après {d} de course.", 600, 1500, 9, 16]
    ],
    3: [
      ["velo", "Étape à vélo : {d} de course, arrivée à {A}.", 3700, 7800, 11, 17],
      ["semi", "Semi-marathon : {d} de course, arrivée à {A}.", 5100, 9000, 9, 12],
      ["marathon", "Marathon : {d} de course, arrivée à {A}.", 10800, 18000, 10, 14]
    ]
  };
  // L'axe à la seconde (comme l'axe de Q10) : `piles` (l'heure ou la minute
  // pile en gris), les instants sous l'axe sur deux lignes. Le bond : du
  // départ à la pile, puis de la pile à l'arrivée.
  function pileD3(degre, dep, arr) {
    const pas = degre === 1 ? 60 : 3600;
    const p = Math.ceil(dep / pas) * pas;
    return p > dep && p < arr ? p : null;
  }
  function dureeEntreD3(degre, rng) {
    const [modele, texte, dMin, dMax, hMin, hMax] = choisir(rng, DUREES_D3[degre]);
    const d = entre(rng, dMin, dMax);
    const pas = degre === 1 ? 60 : 3600;
    // Le départ : un peu avant la pile (au degré 3, les minutes de
    // l'arrivée plus petites que celles du départ : une seule retenue, sur
    // les secondes, comme le marathon de S003).
    const pile = entre(rng, hMin, hMax) * 3600 + (degre === 1 ? entre(rng, 2, 59) * 60 : 0);
    const avantPile = degre === 1 ? entre(rng, 2, d - 2) : degre === 2 ? entre(rng, 20, Math.min(d - 30, 900)) : entre(rng, 600, 2400);
    const dep = pile - avantPile;
    const arr = dep + d;
    if (dep % 60 === 0 || arr % 60 === 0 || pileD3(degre, dep, arr) !== pile || Math.floor(arr / pas) * pas !== pile && degre < 3) return null;
    if (degre === 3) {
      if (arr % 3600 === 0 || partsD3(arr)[1] >= partsD3(dep)[1] - 1 || Math.floor(arr / 3600) - Math.floor(dep / 3600) < 2) return null;
      if (Math.floor(d / 3600) < 1 || partsD3(d)[1] === 0) return null;
    }
    if (d % 60 === 0 || (degre === 2 && d >= 3600)) return null;
    // (Le départ et l'arrivée ont leurs minutes ; jamais « 10 h 0 min 12 s ».)
    if (degre >= 2 && (partsD3(dep)[1] === 0 || partsD3(arr)[1] === 0)) return null;
    // (Correctif B3-3 : le marathon et le semi-marathon partent entre 7 h et
    // 10 h.)
    if ((modele === "marathon" || modele === "semi") && (dep < 7 * 3600 || dep > 10 * 3600)) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, D: instantD3(dep), A: instantD3(arr)});
    const b1 = pile - dep;
    const b2 = arr - pile;
    const R = dureeD3(d);
    // (La réponse ne se lit jamais dans un instant écrit : « 8 s » dans
    // « 58 s », « 9 min 17 s » dans « 59 min 17 s ».)
    if ([dep, pile, arr].some(t => instantD3(t).includes(R))) return null;
    const unites = degre === 1 ? ["s"] : degre === 2 ? ["min", "s"] : ["h", "min", "s"];
    const ss = (b1 % 60) + (b2 % 60);
    const somme = `${dureeD3(b1)} + ${dureeD3(b2)}`;
    // (Une ligne quand elle tient au petit téléphone ; au degré 3, deux :
    // « 29 min 33 s + 3 h 27 min 48 s », puis « = 3 h 57 min 21 s ».)
    // (Correctif B3-3 : quand les secondes des deux bonds font plus d'une
    // minute, une note courte sous la correction, « 104 s = 1 min 44 s » —
    // la retenue se voit, même après « Je ne sais pas ».)
    const lignes = degre < 3 ? [[`${somme} = `, R, ""]] : [somme, ["= ", R, ""]];
    const noteCorrB33 = ss >= 60 ? `${sD3(ss)} = 1${NB}min${NB}${sD3(ss - 60)}` : "";
    const avant = "Durée :";
    const texteCases = unites.map(u => `${CASE}${NB}${u}`).join(" ");
    return finirD3({
      degre, forme: "nombre", texte: `${enonce} ${avant} ${texteCases}`,
      morceaux: unites.length > 1 ? {enonce, avant, cases: unites, serre: true, long: true} : {enonce, avant, apres: "s", serre: true, long: true},
      resume: `${avant} ${R}`, outil: "axe-sec",
      axeD3: {instants: [{t: dep}, {t: pile, gris: true}, {t: arr}], arcs: [{de: 0, a: 2, texte: "?"}]},
      noteOutil: degre === 1 ? "Je passe par la minute pile." : "Je passe par l'heure pile.",
      image: [degre === 1 ? `1${NB}min = 60${NB}s` : `1${NB}h = 60${NB}min`, `De ${instantD3(dep)} à ${instantD3(pile)} : ${CASE}`],
      correction: lignes.map(l => (Array.isArray(l) ? l.join("") : l)), lignesB33: lignes,
      corrB33: {type: "axe", instants: [{t: dep}, {t: pile}, {t: arr}], arcs: [{de: 0, a: 1, texte: dureeD3(b1), vert: true}, {de: 1, a: 2, texte: dureeD3(b2), vert: true}]},
      noteCorrB33,
      d3: {sorte: "duree", qte: d, base: "s", unites}, donnees: {depart: dep, arrivee: arr, cherche: "duree"},
      modeleD3: modele, cle: `D3:d:${modele}:${dep}-${arr}`
    });
  }
  function departD3(degre, rng) {
    const deg = Math.max(2, degre);
    const [modele, texte, dMin, dMax, hMin, hMax] = choisir(rng, DEPARTS_D3[deg]);
    const d = entre(rng, dMin, dMax);
    const pile = entre(rng, hMin, hMax) * 3600;
    const apresPile = deg === 2 ? entre(rng, 70, Math.min(d - 60, 1500)) : entre(rng, 300, 1500);
    const arr = pile + apresPile;
    const dep = arr - d;
    if (dep % 60 === 0 || arr % 60 === 0 || d % 60 === 0 || dep >= pile) return null;
    if (partsD3(dep)[1] === 0 || partsD3(arr)[1] === 0) return null;
    if (deg === 3 && (Math.floor(d / 3600) < 1 || partsD3(d)[1] === 0)) return null;
    if (deg === 2 && (d >= 3600 || pile - dep >= 3600)) return null;
    // (Correctif B3-3 : le marathon et le semi-marathon partent entre 7 h et
    // 10 h.)
    if ((modele === "marathon" || modele === "semi") && (dep < 7 * 3600 || dep > 10 * 3600)) return null;
    // (Correctif B3-3, S003 p. 18 : aucun algorithme posé en base soixante.
    // La correction suit les deux bonds de l'axe : d'abord le bond de
    // l'heure pile à l'arrivée, enlevé de la durée — sans retenue, les
    // minutes et les secondes de la durée sont plus grandes —, puis on
    // recule de ce qui reste depuis l'heure pile.)
    const b2 = arr - pile;
    const b1 = pile - dep;
    if (partsD3(d)[1] < partsD3(b2)[1] || partsD3(d)[2] < partsD3(b2)[2]) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, A: instantD3(arr), d: dureeD3(d)});
    const R = instantD3(dep);
    const avant = "Départ :";
    const lignes = [`${dureeD3(d)} − ${dureeD3(b2)} = ${dureeD3(b1)}`, [`${instantD3(pile)} − ${dureeD3(b1)} = `, R, ""]];
    return finirD3({
      degre, texte: `${enonce} ${avant} ${CASE}${NB}h ${CASE}${NB}min ${CASE}${NB}s`,
      morceaux: {enonce, avant, cases: ["h", "min", "s"], serre: true, long: true},
      resume: `${avant} ${R}`, outil: "axe-sec",
      axeD3: {instants: [{t: dep, cache: true}, {t: pile, gris: true}, {t: arr}], arcs: [{de: 0, a: 2, texte: dureeD3(d)}]},
      noteOutil: "Je recule jusqu'à l'heure pile.",
      image: [`1${NB}h = 60${NB}min`, `De ${instantD3(pile)} à ${instantD3(arr)} : ${dureeD3(arr - pile)}`],
      correction: lignes.map(l => (Array.isArray(l) ? l.join("") : l)), lignesB33: lignes,
      corrB33: {type: "axe", instants: [{t: dep, vert: true}, {t: pile}, {t: arr}], arcs: [{de: 0, a: 1, texte: dureeD3(pile - dep), vert: true}, {de: 1, a: 2, texte: dureeD3(arr - pile), vert: true}]},
      d3: {sorte: "depart", qte: dep, base: "s", unites: ["h", "min", "s"]}, donnees: {depart: dep, arrivee: arr, duree: d, cherche: "depart"},
      modeleD3: `dep-${modele}`, cle: `D3:p:${modele}:${dep}-${arr}`
    });
  }
  // Le triathlon (S003 p. 19) : la nage, le vélo et la course, leurs
  // distances (qui ne servent pas ici), le temps total ; la course est la
  // durée manquante. (Pour le téléphone, la nage et le vélo en minutes
  // rondes : la correction tient en deux lignes.)
  function triathlonD3(degre, rng) {
    const nage = entre(rng, 25, 45) * 60;
    const velo = entre(rng, 65, 95) * 60;
    const course = entre(rng, 40, 59) * 60 + entre(rng, 1, 59);
    if (velo % 3600 === 0 || (nage + velo) % 3600 === 0) return null;
    const total = nage + velo + course;
    const nv = nage + velo;
    // (Correctif B3-3 : la course se trouve en complétant, par l'heure pile
    // — aucune soustraction posée en base soixante.)
    const pile = Math.ceil(nv / 3600) * 3600;
    if (pile >= total || total % 60 === 0) return null;
    const P = choisir(rng, PRENOMS);
    // (Sans tableau : la question reste basse au petit téléphone.)
    // (Correctif B3-3 : l'énoncé sur deux lignes au petit téléphone avec une
    // police large ; les kilomètres de la course restent, ils ne servent pas.)
    const enonce = `Triathlon en ${dureeD3(total)} : nage ${dureeD3(nage)}, vélo ${dureeD3(velo)}.`;
    const avant = "Course (10 km) :";
    const R = dureeD3(course);
    const lignes = [`${dureeD3(nage)} + ${dureeD3(velo)} = ${dureeD3(nv)}`, `${dureeD3(nv)} → ${dureeD3(pile)} : ${dureeD3(pile - nv)}`,
      `${dureeD3(pile)} → ${dureeD3(total)} : ${dureeD3(total - pile)}`, [`${dureeD3(pile - nv)} + ${dureeD3(total - pile)} = `, R, ""]];
    return finirD3({
      degre, texte: `${enonce} ${avant} ${CASE}${NB}min ${CASE}${NB}s`,
      morceaux: {enonce, avant, cases: ["min", "s"], serre: true, long: true},
      resume: `${avant} ${R}`, outil: "schema-d3",
      schemaD3: {tout: dureeD3(total), parts: [dureeD3(nage), dureeD3(velo), "?"], poids: [nage, velo, course]},
      noteOutil: "Les kilomètres ne servent pas ici.",
      image: [`Nage et vélo : ${dureeD3(nage)} + ${dureeD3(velo)}`],
      correction: lignes.map(l => (Array.isArray(l) ? l.join("") : l)), lignesB33: lignes,
      corrB33: null,
      d3: {sorte: "triathlon", qte: course, base: "s", unites: ["min", "s"]}, donnees: {total, nage, velo},
      modeleD3: "triathlon", cle: `D3:t:${nage}-${velo}-${total}`
    });
  }
  // Au choix (le piège de la base 100) : d2, « 150 s = … » ; d3, une durée
  // dont les secondes débordent. (Correctif B3-3 : plus de « 0,5 min » —
  // les durées décimales sont à D5, en 6e.)
  function choixD3(degre, rng) {
    if (degre === 1) return faitD3(1, rng, true);
    if (degre === 2) {
      const m = entre(rng, 1, 4);
      const s = entre(rng, 2, 11) * 5;
      const total = m * 60 + s;
      if (s >= 60 || total >= 100 * m + 60) return null;
      const bonne = `${m}${NB}min${NB}${s}${NB}s`;
      // Le piège : lire les secondes comme un nombre à virgule (150 s :
      // 1 min 50 s).
      const c = Math.floor(total / 100);
      const piege = `${c}${NB}min${NB}${total % 100}${NB}s`;
      const autre = `${m + 1}${NB}min${NB}${s}${NB}s`;
      if (c < 1 || total % 100 >= 60 || piege === bonne) return null;
      const choix = melanger(rng, [bonne, piege, autre]);
      const pourquoi = {};
      choix.forEach((t, k) => { if (t === piege) pourquoi[k] = `${sD3(total)}, c'est ${bonne}.`; else if (t === autre) pourquoi[k] = `${m + 1}${NB}min, c'est ${sD3((m + 1) * 60)}.`; });
      const phrase = `${sD3(total)} = ${CASE}`;
      return finirD3({degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "duree"}, choix, bon: choix.indexOf(bonne), pourquoi,
        resume: `${sD3(total)} = ${bonne}`, relation: `1${NB}min = 60${NB}s`, outil: "barre-minute", barreD3: {n: 1, plus: 0}, noteOutil: `Je fais des paquets de 60${NB}s.`,
        image: [`1${NB}min = 60${NB}s`], correction: [`${m} × 60${NB}s = ${sD3(m * 60)}`, `${sD3(total)} = ${bonne}`],
        lignesB33: [`${m} × 60${NB}s = ${sD3(m * 60)}`, [`${sD3(total)} = `, bonne, ""]], corrB33: {type: "barre-minute", n: m, plus: s},
        d3: {sorte: "choix", qte: total, base: "s", unites: ["min", "s"]}, cle: `D3:${total}s>min:q`, cleBase: `D3:${total}s>min`});
    }
    // d3 : la durée par l'heure pile, les secondes qui débordent.
    for (let essai = 0; essai < 30; essai += 1) {
      const x = dureeEntreD3(2, rng);
      if (!x) continue;
      const {depart: dep, arrivee: arr} = x.donnees;
      const pile = Math.ceil(dep / 3600) * 3600;
      const b1 = pile - dep;
      const b2 = arr - pile;
      if ((b1 % 60) + (b2 % 60) < 60 || (b1 % 60) + (b2 % 60) >= 100) continue;
      // (Le piège de la base 100 reste sous l'heure : « 1 h 2 min 21 s »
      // faisait sortir la rangée des choix de l'écran du petit téléphone.)
      if (arr - dep + 2400 >= 3600) continue;
      const bonne = dureeD3(arr - dep);
      // (Correctif B3-3 : deux choix vraiment faux. La minute de retenue
      // oubliée ; la base 100 jusqu'à l'heure pile — « de 47 min à 100 » —,
      // 40 min de trop. « 31 min 77 s » valait la bonne réponse.)
      const piege = dureeD3(arr - dep + 2400);
      const autre = dureeD3(arr - dep - 60);
      const choix = melanger(rng, [bonne, piege, autre]);
      const pourquoi = {};
      const ss = (b1 % 60) + (b2 % 60);
      choix.forEach((t, k) => { if (t === piege) pourquoi[k] = `1${NB}h = 60${NB}min, pas 100${NB}min.`; else if (t === autre) pourquoi[k] = `${sD3(ss)} : plus d'une minute.`; });
      const consigne = `Durée${NB}?`;
      return Object.assign(x, {degre, forme: "qcm", texte: `${x.morceaux.enonce} ${consigne}`, morceaux: {enonce: x.morceaux.enonce, consigne, serre: true, sorte: "heure"},
        choix, bon: choix.indexOf(bonne), pourquoi, cleBase: x.cle, cle: `${x.cle}:q`, sorteD3: "choix",
        donnees: Object.assign({}, x.donnees, {sorte: "choix"})});
    }
    return null;
  }

  // Les erreurs de D3 au pavé (une ligne au petit téléphone, 31 signes).
  function erreursD3(question, lu, lus) {
    const d = question.donnees;
    if (!d || d.type !== "d3") return null;
    const v = lus ? lus.map(x => Number(x / MILLE)) : [Number(lu / MILLE)];
    const egal = (...w) => v.length === w.length && v.every((x, k) => x === w[k]);
    const cent = "1 min = 60 s, pas 100 s.";
    if (d.sorte === "fait") {
      if (egal(100)) return {erreur: 1, retour: `60${NB}s dans 1${NB}min, pas 100.`};
      return null;
    }
    if (d.sorte === "min-s") {
      const [h, m, s] = partsD3(d.q);
      if (h) {
        if (egal(h * 60 + m)) return {erreur: 2, retour: "Ça, ce sont des minutes."};
        if (egal(h * 3600 + m)) return {erreur: 3, retour: `Et ${m}${NB}min en secondes.`};
        if (egal((h * 100 + m) * 60) || egal((h * 60 + m) * 100)) return {erreur: 1, retour: "Une heure, c'est 60 min."};
        return null;
      }
      if (egal(m * 100 + s)) return {erreur: 1, retour: cent};
      if (s && egal(m * 60)) return {erreur: 3, retour: `Et les ${s}${NB}s en plus.`};
      if (egal(m * 60 + s * 60)) return {erreur: 3, retour: `${s}${NB}s, ce n'est pas ${s}${NB}min.`};
      return null;
    }
    if (d.sorte === "s-min") {
      const m = Math.floor(d.q / 60);
      const s = d.q % 60;
      if (egal(Math.floor(d.q / 100), d.q % 100) || (d.q % 100 === 0 && egal(d.q / 100))) return {erreur: 1, retour: cent};
      if (egal(d.q * 60)) return {erreur: 4, retour: "Vers les minutes : je divise."};
      if (s && egal(m, 0)) return {erreur: 3, retour: `Il reste ${s}${NB}s.`};
      return null;
    }
    if (d.sorte === "jours") {
      if (egal(Math.floor(d.q / 100), d.q % 100) || egal(d.q / 100) || egal(Math.floor(d.q / 60), d.q % 60)) return {erreur: 5, retour: `1${NB}jour, c'est 24${NB}h.`};
      return null;
    }
    if (d.sorte === "lire") {
      if (egal(d.h, d.s, d.m)) return {erreur: 6, retour: "La grande : les minutes."};
      if (v.length === 3 && v[0] === d.h && v[1] === d.m && v[2] !== d.s && v[2] === Math.floor(d.s / 5)) return {erreur: 6, retour: "La trotteuse : les secondes."};
      if (v.length === 3 && v[0] === d.h && v[2] === d.s && v[1] !== d.m && v[1] === Math.floor(d.m / 5)) return {erreur: 6, retour: "La grande : les minutes."};
      return null;
    }
    // Les durées, l'heure de départ, le triathlon : la base 100, une heure
    // ou une minute de trop, l'autre sens.
    const t = v.length === 3 ? v[0] * 3600 + v[1] * 60 + v[2] : v.length === 2 ? v[0] * 60 + v[1] : v[0];
    const okMs = v.slice(1).every(x => x < 60);
    if (d.sorte === "duree" || d.sorte === "choix") {
      const b1 = (Math.ceil(d.depart / 3600) * 3600) - d.depart;
      const b2 = d.arrivee - d.depart - b1;
      const [ha, ma, sa] = partsD3(b1);
      const [hb, mb, sb] = partsD3(b2);
      if (!okMs && (egal(ma + mb, sa + sb) || egal(ha + hb, ma + mb, sa + sb))) return {erreur: 7, retour: `${sa + sb}${NB}s : plus d'une minute.`};
      // (Correctif B3-3 : au degré 1, la durée fait moins d'une minute.)
      if (okMs && Math.abs(t - d.q) === 60) return {erreur: 8, retour: d.unites.length === 1 ? `Moins d'une minute : ${sD3(d.q)}.` : "Compte bien les minutes."};
      if (okMs && Math.abs(t - d.q) === 3600) return {erreur: 8, retour: "Compte bien les heures."};
      return null;
    }
    if (d.sorte === "depart") {
      if (okMs && t === d.arrivee + d.duree) return {erreur: 9, retour: "On cherche l'heure de départ."};
      if (okMs && Math.abs(t - d.q) === 3600) return {erreur: 8, retour: "Compte bien les heures."};
      if (okMs && Math.abs(t - d.q) === 60) return {erreur: 8, retour: "Compte bien les minutes."};
      if (!okMs) return {erreur: 7, retour: "1 h = 60 min, 1 min = 60 s."};
      return null;
    }
    if (d.sorte === "triathlon") {
      if (okMs && t === d.total) return {erreur: 10, retour: "Ça, c'est le temps total."};
      if (okMs && t === d.total - d.nage) return {erreur: 10, retour: "Enlève aussi le vélo."};
      if (okMs && t === d.total - d.velo) return {erreur: 10, retour: "Enlève aussi la nage."};
      if (okMs && Math.abs(t - d.q) === 60) return {erreur: 8, retour: "Compte bien les minutes."};
      return null;
    }
    return null;
  }

  // Les places. Je valide (choix du lot B3-3a) : la relation, lire l'heure,
  // min → s ; s → min avec le reste, la durée, au choix, l'heure de départ ;
  // h → s (2 h 20 min), le marathon, les jours (2 000 h).
  const PLACES_D3 = {
    valide: ["fait", "lire", "min-s", "s-min", "duree", "choix", "depart", "min-s", "duree", "jours"],
    entraine: ["min-s", "s-min", "lire", "min-s", "duree", "s-min",
      "min-s", "s-min", "duree", "lire", "choix", "depart", "situation", "min-s", "jours",
      "min-s", "duree", "s-min", "triathlon", "jours", "depart", "choix", "duree", "min-s", "triathlon"],
    test: ["s-min", "duree", "depart", "duree|min-s"],
    aide: ["min-s", "duree", "s-min"],
    retour: ["min-s|s-min|duree", "duree|lire|depart"],
    echauffement: ["min-s|s-min"]
  };
  function tirerD3(rng, degre, sorte) {
    for (let essai = 0; essai < 40; essai += 1) {
      let x = null;
      if (sorte === "fait") x = faitD3(degre, rng);
      else if (sorte === "min-s") x = degre >= 2 && rng() < 0.25 ? situationD3(degre, rng) : minSecD3(degre, rng);
      else if (sorte === "s-min") x = degre >= 2 && rng() < 0.25 ? situationD3(degre, rng) : secMinD3(degre, rng);
      else if (sorte === "situation") x = situationD3(Math.max(2, degre), rng);
      else if (sorte === "jours") x = joursDeD3(Math.max(2, degre), rng);
      else if (sorte === "lire") x = lireD3(degre, rng);
      else if (sorte === "duree") x = dureeEntreD3(degre, rng);
      else if (sorte === "depart") x = departD3(degre, rng);
      else if (sorte === "triathlon") x = degre === 3 ? triathlonD3(degre, rng) : dureeEntreD3(degre, rng);
      else if (sorte === "choix") x = choixD3(degre, rng);
      if (x) return Object.assign(x, {degre});
    }
    return null;
  }
  ETAPES.D3 = {
    // On te montre : 1 min = 60 s (la trotteuse) ; 4 min 15 s = 255 s (la
    // barre) ; Noa, de 9 h 58 min 40 s à 10 h 12 min 15 s (l'axe).
    clesExemples: ["D3:255s>s", "D3:d:course:35920-36735"],
    formes(usage, rng) {
      const p = PLACES_D3[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    tirer(rng, degre, i, usage, forme) {
      const sorte = forme || choisir(rng, {1: ["fait", "min-s", "s-min", "lire", "duree"], 2: ["min-s", "s-min", "duree", "depart", "jours", "lire", "choix"],
        3: ["min-s", "s-min", "duree", "depart", "jours", "triathlon", "choix"]}[degre]);
      return tirerD3(rng, degre, sorte);
    },
    // (Dans Je valide : un même contexte une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      return !question.modeleD3 || !serie.some(x => x.modeleD3 === question.modeleD3);
    },
    erreurs(question, lu, lus) { return erreursD3(question, lu, lus); }
  };

  // ------------------------- Q3 · Problèmes : plusieurs fois, partager
  // S003 p. 11-13 : la valeur d'une part, le nombre de parts (« lorsque la
  // valeur d'une part est un nombre entier inférieur ou égal à 10 »), « fois
  // plus, fois moins », les étagères (12, pas 15). S023 p. 5 : « 35 cm :
  // 7 cm = 5 » (le nombre de parts, sans unité) ; « 35 cm ÷ 7 = 5 cm » (la
  // valeur d'une part). L'exerciseur : « Multiplications » (6 verres de
  // 25 cL), « Divisions » (3,6 m en 6). L'outil : la barre du document (le
  // tout au-dessus avec son accolade, les parts égales, ce qu'on cherche
  // dessous).
  // [modèle, énoncé ({P}, {n}, {M}), avant, [unité, min, max, pas], unité de
  // la réponse, n min, n max, le nom des parts]
  // (Correctif B3-3 : des énoncés courts — deux lignes au petit téléphone,
  // la question claire : « Quel volume en tout ? », « Longueur d'un
  // morceau ? ».)
  const FOIS_Q3 = [
    ["goyave", "{P} remplit {n} verres de {M} de jus de goyave.", "En tout :", ["cL", 20, 25, 5], "L", 4, 8, "verres"],
    ["letchis", "{P} achète {n} barquettes de {M} de letchis.", "En tout :", ["g", 250, 500, 250], "kg", 2, 8, "barquettes"],
    ["piste", "{P} fait {n} tours de piste de {M}.", "En tout :", ["m", 400, 400, 1], "km", 3, 9, "tours"],
    ["bassin", "{P} nage {n} longueurs de {M} à la piscine.", "En tout :", ["m", 25, 50, 25], "km", 6, 12, "longueurs"],
    ["canne", "{P} coupe {n} tronçons de canne de {M}.", "En tout :", ["cm", 40, 90, 10], "m", 3, 8, "tronçons"],
    ["sirop", "{P} achète {n} bouteilles de {M} de sirop.", "En tout :", ["cL", 50, 75, 25], "L", 2, 6, "bouteilles"]
  ];
  // [modèle, énoncé ({P}, {n}, {T}), avant, [unité du tout, min, max, pas],
  // unité de la réponse, n min, n max, le nom des parts, bornes de la
  // réponse (facultatives, dans son unité)]
  // (Correctif B3-3 : un verre de jus, de 15 cL à 25 cL, partout.)
  const VERRE_Q3 = [15, 25];
  const PARTAGE_Q3 = [
    ["ruban", "{P} coupe un ruban de {T} en {n} morceaux égaux.", "Un morceau :", ["m", 1.2, 4.8, 0.2], "cm", 3, 8, "morceaux"],
    ["riz", "{P} partage {T} de riz en {n} sachets égaux.", "Un sachet :", ["kg", 1, 5, 0.5], "g", 2, 8, "sachets"],
    ["jus", "{P} partage {T} de jus de goyave entre {n} verres.", "Un verre :", ["L", 1, 2, 0.5], "cL", 4, 8, "verres", VERRE_Q3],
    ["relais", "Un relais de {T} se court en {n} parties égales.", "Une partie :", ["km", 1, 6, 0.2], "m", 4, 8, "parties"],
    ["corde", "{P} coupe une corde de {T} en {n} morceaux égaux.", "Un morceau :", ["m", 2, 6, 0.5], "cm", 4, 8, "morceaux"]
  ];
  // Le nombre de parts : [modèle, énoncé ({P}, {T}, {p}), l'objet (après
  // la case), [unité du tout, min, max, pas], unité de la part, les parts
  // des degrés 1-2 (10 au plus, S003), celles du degré 3 (des parts de 100
  // qui se font de tête : 4 × 25 cm = 1 m)].
  // (Correctif B3-3 : un verre de jus, de 15 cL à 25 cL — seulement au
  // degré 3, la part des degrés 1-2 fait 10 au plus ; une dose de sirop,
  // quelques centilitres.)
  const PARTS_Q3 = [
    ["ruban", "{P} coupe {T} de ruban en morceaux de {p}. Combien de morceaux ?", "morceaux", ["m", 0.4, 1.8, 0.1], "cm", [5, 6, 8, 10], [20, 25, 50]],
    ["jus", "Avec {T} de jus, {P} remplit des verres de {p}. Combien de verres ?", "verres", ["L", 0.5, 3, 0.5], "cL", [], [20, 25]],
    ["sable", "Un camion livre {T} de sable en sacs de {p}. Combien de sacs ?", "sacs", ["t", 0.5, 1.5, 0.5], "kg", [], [25, 50]],
    ["sirop", "{T} de sirop donne des doses de {p}. Combien de doses ?", "doses", ["L", 0.5, 1, 0.5], "cL", [2, 4, 5], []],
    // (Correctif B3-3 : deux contextes de plus aux degrés 1-2 — Je valide
    // ne reprend pas un contexte.)
    ["bandes", "{P} coupe {T} de tissu en bandes de {p}. Combien de bandes ?", "bandes", ["m", 0.4, 1.2, 0.1], "cm", [5, 8, 10], []],
    ["bambou", "Un bambou de {T} est coupé en morceaux de {p}. Combien de morceaux ?", "morceaux", ["m", 0.4, 1.5, 0.1], "cm", [5, 6, 8, 10], []]
  ];
  // Fois plus, fois moins (S003 p. 12) : [modèle, énoncé ({A}, {k}),
  // avant, [unité de A, min, max, pas], unité de la réponse, k min, k max,
  // bornes vraies de la réponse (dans son unité), plus ?]
  const FOIS_PLUS_Q3 = [
    ["jacquier", "Un ananas pèse {A}. Le jacquier pèse {k} fois plus.", "Jacquier :", ["g", 1200, 2000, 100], "kg", 4, 8, [5, 15], true],
    ["chien", "Le chaton pèse {A}. Le chien pèse {k} fois plus.", "Chien :", ["g", 600, 900, 100], "kg", 5, 9, [3, 8], true],
    ["canne", "Un tronçon de canne mesure {A}. La canne est {k} fois plus longue.", "Canne :", ["cm", 40, 80, 10], "m", 3, 5, [1.2, 4], true],
    ["verre", "Une bouteille contient {A} de jus. Un verre en contient {k} fois moins.", "Un verre :", ["L", 1, 1.5, 0.5], "cL", 4, 6, VERRE_Q3, false],
    ["piton", "Le sentier mesure {A}. Le chemin de l'école est {k} fois plus court.", "Chemin :", ["km", 3, 6, 0.5], "m", 5, 10, [300, 1200], false]
  ];
  // Les étagères (S003 p. 12-13) : des planches de L, des étagères de e ;
  // il reste un bout par planche (12, pas 15).
  const PLANCHES_Q3 = [[5, "m", 2, "m"], [5, "m", 150, "cm"], [3, "m", 80, "cm"], [4, "m", 150, "cm"], [2.5, "m", 60, "cm"], [3, "m", 120, "cm"], [4, "m", 90, "cm"]];
  // Deux étapes (acheter, puis partager) : [modèle, énoncé ({P}, {n}, {M},
  // {k}), avant, [unité, min, max, pas], unité de la réponse, n min, n max,
  // k min, k max]
  const DEUX_Q3 = [
    ["tissu", "{P} achète {n} coupons de tissu de {M} et coupe le tout en {k} morceaux égaux.", "Un morceau :", ["m", 1.5, 3, 0.5], "cm", 2, 4, 3, 8],
    ["jus", "{P} achète {n} bouteilles de {M} de jus et partage le tout entre {k} verres.", "Un verre :", ["L", 1, 2, 0.5], "cL", 2, 4, 6, 12, VERRE_Q3],
    ["riz", "{P} achète {n} sacs de riz de {M} et partage le tout en {k} sachets.", "Un sachet :", ["kg", 1, 2, 0.5], "g", 2, 5, 4, 10]
  ];
  // Dans des bornes [min, max] (dans l'unité de la réponse), ou sans bornes.
  const dansBornesQ3 = (rep, bornes) => !bornes || (rep >= BigInt(Math.round(bornes[0] * 1000)) && rep <= BigInt(Math.round(bornes[1] * 1000)));
  // (Correctif B3-3 : une réponse en m, mL ou g est entière — personne ne
  // mesure un chemin au demi-mètre ni un cocktail au demi-millilitre.)
  const entiereQ3 = (rep, vers) => !["m", "mL", "g"].includes(vers) || rep % MILLE === 0n;
  // Un nombre tiré dans [unité, min, max, pas] (pas décimal permis).
  function tireQ3(rng, [u, a, b, pas]) {
    const k = Math.round((b - a) / pas);
    const v = Math.round((a + pas * Math.floor(rng() * (k + 1))) * 1000);
    return [BigInt(v), u];
  }
  // La barre du document (outil, image, correction) : `tout` au-dessus avec
  // son accolade ; les parts (« … » : d'autres parts, en pointillés) ;
  // `dessous` avec son accolade. Au-delà de 6 parts : les 3 premières, « … »,
  // les 2 dernières.
  // (Mesuré en gros plan à 300 px, police large : « 1 500 g », « 80 cm » ne
  // tiennent pas dans six cases ; une mesure de cinq signes et plus :
  // quatre cases au plus.)
  function partsQ3(n, texte, premiere = null) {
    const p = Array.from({length: n}, (_, i) => (i === 0 && premiere !== null ? premiere : texte));
    if (Math.max((texte || "").length, (premiere || "").length) >= 5 && n > 4) return [p[0], p[1], "…", p[n - 1]];
    return n > 6 ? [...p.slice(0, 3), "…", ...p.slice(-2)] : p;
  }
  // La question finie. spec : {sorte, modele, degre, enonce, avant, apres,
  // vers, reponse (millièmes), barre, barreCorr, image, lignes, donnees,
  // cle, note}.
  function finirQ3(spec, rng = null, vrai = null) {
    const {sorte, modele, degre, enonce, vers} = spec;
    const rep = spec.reponse;
    if (rep === null || rep <= 0n || decimales(rep) > 2 || rep > 100000n * MILLE) return null;
    const unite = spec.apres || vers;
    const R = spec.compte ? `${ecrire(rep)}${NB}${unite}` : mes(rep, vers);
    const vertTexte = spec.compte ? ecrire(rep) : R;
    // (L'aide n'écrit jamais la réponse : ni l'outil, ni l'image, ni la note.)
    const echappe = R.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reRep = new RegExp(`(^|[^\\d,${FINE}])${echappe}($|[^\\wÀ-ÿ²³])`);
    const outilT = [spec.barre.tout, ...spec.barre.parts, spec.barre.dessous || "", ...spec.image, spec.note || ""];
    if (outilT.some(t => reRep.test(t))) return null;
    if (spec.compte && [spec.barre.dessous || "", ...spec.image].some(t => new RegExp(`(^|\\D)${ecrire(rep)}(\\D|$)`).test(t))) return null;
    const lignes = spec.lignes(vertTexte);
    // (« @ » dans la barre de la correction : la réponse, en vert.)
    const corr = JSON.parse(JSON.stringify(spec.barreCorr));
    const remplace = t => (t === "@" ? R : t);
    corr.tout = remplace(corr.tout);
    corr.parts = corr.parts.map(remplace);
    // (Une mesure de cinq signes et plus dans une case : quatre cases au plus.)
    if (corr.parts.length > 4 && corr.parts.some(p => p.length >= 5)) corr.parts = [corr.parts[0], corr.parts[1], "…", corr.parts[corr.parts.length - 1]];
    corr.dessous = remplace(corr.dessous || "");
    const base = {
      code: "Q3", degre, unite, grandeur: spec.compte ? "nombre" : grandeurDe(vers), sorteQ3: sorte, modeleQ3: modele,
      outil: "barre-q3", barreQ3: spec.barre, noteOutil: spec.note || "Je mets tout dans la même unité.",
      image: spec.image, correction: lignes.map(l => (Array.isArray(l) ? l.join("") : l)), lignesB33: lignes,
      corrB33: Object.assign({type: "barre-q3"}, corr),
      donnees: Object.assign({type: "q3", sorte, vers}, spec.donnees), cle: spec.cle, cleBase: spec.cle
    };
    if (!vrai) {
      const avant = spec.avant || "";
      return q(Object.assign(base, {
        forme: "nombre", texte: `${enonce} ${avant ? `${avant} ` : ""}${CASE}${NB}${unite}`,
        morceaux: {enonce, avant, apres: unite, serre: true},
        reponse: brut(rep), reponseTexte: R, resume: `${avant ? `${avant} ` : ""}${R}`
      }));
    }
    // « Est-ce vraisemblable ? » (comme Q2) : quelqu'un propose un résultat
    // juste, ou × 10, ÷ 10, × 100 (la conversion oubliée).
    const oui = vrai === "oui";
    let propose = rep;
    if (!oui) {
      const essais = [rep * 10n, rep * 100n, rep % 10n === 0n ? rep / 10n : null].filter(x => x !== null && x > 0n && decimales(x) <= 2 && x <= 100000n * MILLE);
      if (!essais.length) return null;
      propose = choisir(rng, essais);
    }
    const auteur = choisir(rng, PRENOMS.filter(p => !enonce.includes(p)));
    const dit = `${auteur} trouve ${mes(propose, vers)}.`;
    // (La question, la dernière phrase, s'en va : « Longueur d'un
    // morceau ? » comme « Combien de verres ? ».)
    const sans = enonce.replace(/ [^.]*\?$/, "");
    const raison = oui ? `Oui : c'est bien ${R}.` : `Non : c'est ${R}, pas ${mes(propose, vers)}.`;
    return q(Object.assign(base, {
      forme: "vrai-faux", texte: `${sans} ${dit} Est-ce vraisemblable${NB}?`, morceaux: {enonce: sans, proposition: dit, serre: true},
      choix: ["Oui", "Non"], bon: oui ? 0 : 1, reponse: oui ? "Oui" : "Non", reponseTexte: oui ? "Oui" : "Non",
      resume: `${dit} ${oui ? "Vraisemblable." : "Pas vraisemblable."}`, correction: [raison], lignesB33: [raison.startsWith("Oui") ? ["Oui : c'est bien ", R, "."] : ["Non : c'est ", R, `, pas ${mes(propose, vers)}.`]],
      pourquoi: oui ? {1: "Le calcul est juste."} : {0: propose > rep ? "C'est beaucoup trop." : "C'est beaucoup trop peu."},
      donnees: Object.assign({}, base.donnees, {propose: brut(propose), vrai: oui}), cle: `${spec.cle}:v${oui ? 1 : 0}`
    }));
  }
  function foisQ3(degre, rng) {
    const [modele, texte, avant, spec, vers, nMin, nMax, nom] = choisir(rng, FOIS_Q3);
    const [M, u] = tireQ3(rng, spec);
    const n = entre(rng, nMin, nMax);
    const tot = BigInt(n) * M;
    const rep = convertir(tot, u, vers);
    if (rep === null || rep % MILLE === 0n && degre === 1 && rng() < 0.5) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, n, M: mes(M, u)});
    return {sorte: "fois", modele, degre, enonce, avant, vers, reponse: rep,
      barre: {tout: `?${NB}${vers}`, parts: partsQ3(n, mes(M, u)), dessous: `${n}${NB}${nom}`},
      barreCorr: {tout: `${mes(tot, u)} = ${mes(rep, vers)}`, parts: partsQ3(n, mes(M, u)), dessous: `${n}${NB}${nom}`, vertTout: true},
      image: [`${n} × ${mes(M, u)} = ${CASE}`, `Puis en ${vers}.`],
      lignes: v => [`${n} × ${mes(M, u)} = ${mes(tot, u)}`, [`${mes(tot, u)} = `, v, ""]],
      donnees: {a: brut(M), ua: u, n}, cle: `Q3:f:${modele}:${n}x${brut(M)}${u}`};
  }
  function partageQ3(degre, rng) {
    const [modele, texte, avant, spec, vers, nMin, nMax, nom, bornes] = choisir(rng, PARTAGE_Q3);
    const [T, u] = tireQ3(rng, spec);
    const n = entre(rng, nMin, nMax);
    const Tv = convertir(T, u, vers);
    if (Tv === null || Tv % BigInt(n) !== 0n) return null;
    const rep = Tv / BigInt(n);
    if (rep % MILLE !== 0n || !dansBornesQ3(rep, bornes)) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, n, T: mes(T, u)});
    return {sorte: "partage", modele, degre, enonce, avant, vers, reponse: rep,
      barre: {tout: mes(T, u), parts: partsQ3(n, "", `?${NB}${vers}`), dessous: `${n}${NB}${nom}`},
      barreCorr: {tout: `${mes(T, u)} = ${mes(Tv, vers)}`, parts: partsQ3(n, "", "@"), dessous: `${n}${NB}${nom}`, partsVertes: true},
      image: [`${mes(T, u)} = ${CASE}${NB}${vers}`, `Puis je partage en ${n}.`],
      lignes: v => [`${mes(T, u)} = ${mes(Tv, vers)}`, [`${mes(Tv, vers)} ÷ ${n} = `, v, ""]],
      donnees: {a: brut(T), ua: u, n}, cle: `Q3:p:${modele}:${brut(T)}${u}/${n}`};
  }
  function partsDeQ3(degre, rng) {
    const [modele, texte, apres, spec, up, petites, grandes] = choisir(rng, PARTS_Q3.filter(x => (degre === 3 ? x[6] : x[5]).length));
    const [T, u] = tireQ3(rng, spec);
    const p = BigInt(choisir(rng, degre === 3 ? grandes : petites)) * MILLE;
    const Tv = convertir(T, u, up);
    if (Tv === null || Tv % p !== 0n) return null;
    const n = Tv / p;
    if (n < 4n || n > 60n) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, T: mes(T, u), p: mes(p, up)});
    // (Le nombre de parts est la réponse : la barre en montre toujours
    // « … » ; une part de 5 signes et plus — « 10 cm » — ne tient que dans
    // quatre cases au petit téléphone, comme partsQ3.)
    const cases = mes(p, up).length >= 5 ? [mes(p, up), mes(p, up), "…", mes(p, up)] : [mes(p, up), mes(p, up), mes(p, up), "…", mes(p, up), mes(p, up)];
    return {sorte: "parts", modele, degre, enonce, avant: "", apres, compte: true, vers: up, reponse: n * MILLE,
      barre: {tout: `${mes(T, u)} = ${mes(Tv, up)}`, parts: cases, dessous: `?${NB}${apres}`},
      barreCorr: {tout: `${mes(T, u)} = ${mes(Tv, up)}`, parts: [mes(p, up), mes(p, up), mes(p, up), "…", mes(p, up), mes(p, up)], dessous: "@", vertDessous: true},
      image: [`${mes(T, u)} = ${mes(Tv, up)}`, `Combien de fois ${mes(p, up)}${NB}?`],
      lignes: v => [[`${mes(Tv, up)} ÷ ${mes(p, up)} = `, v, ""]],
      note: "Je mets tout dans la même unité.",
      donnees: {a: brut(T), ua: u, part: brut(p), up}, cle: `Q3:n:${modele}:${brut(T)}${u}/${brut(p)}${up}`};
  }
  function foisPlusQ3(degre, rng) {
    const [modele, texte, avant, spec, vers, kMin, kMax, [bMin, bMax], plus] = choisir(rng, FOIS_PLUS_Q3);
    const [A, u] = tireQ3(rng, spec);
    const k = entre(rng, kMin, kMax);
    const Av = convertir(A, u, vers);
    if (Av === null) return null;
    let rep;
    if (plus) rep = Av * BigInt(k);
    else { if (Av % BigInt(k) !== 0n) return null; rep = Av / BigInt(k); }
    if (!dansBornesQ3(rep, [bMin, bMax]) || decimales(rep) > 1 || !entiereQ3(rep, vers)) return null;
    const enonce = remplirQ2(texte, {A: mes(A, u), k});
    const conv = `${mes(A, u)} = ${mes(Av, vers)}`;
    return {sorte: "fois-plus", modele, degre, enonce, avant, vers, reponse: rep,
      barre: plus ? {tout: `?${NB}${vers}`, parts: partsQ3(k, mes(A, u)), dessous: `${k} fois`} : {tout: mes(A, u), parts: partsQ3(k, "", `?${NB}${vers}`), dessous: `${k} parts`},
      barreCorr: plus ? {tout: "@", parts: partsQ3(k, mes(Av, vers)), dessous: `${k} fois`, vertTout: true} : {tout: conv, parts: partsQ3(k, "", "@"), dessous: `${k} parts`, partsVertes: true},
      image: [conv, plus ? `${k} fois plus : ${k} × ${CASE}` : `${k} fois moins : ${CASE} ÷ ${k}`],
      lignes: v => [conv, [plus ? `${k} × ${mes(Av, vers)} = ` : `${mes(Av, vers)} ÷ ${k} = `, v, ""]],
      donnees: {a: brut(A), ua: u, k, plus}, cle: `Q3:x:${modele}:${brut(A)}${u}${plus ? "*" : "/"}${k}`};
  }
  function planchesQ3(degre, rng) {
    const [L, uL, e, ue] = choisir(rng, PLANCHES_Q3);
    const n = entre(rng, 3, 8);
    const Lm = BigInt(Math.round(L * 1000));
    const em = BigInt(e) * MILLE;
    const Lv = convertir(Lm, uL, ue);
    const per = Lv / em;
    const reste = Lv - per * em;
    if (!reste || per < 1n) return null;
    const faux = (BigInt(n) * Lv) / em;
    if (faux === BigInt(n) * per) return null;
    const P = choisir(rng, PRENOMS);
    // (Correctif B3-3 : un énoncé plus court ; « un seul morceau » est dans la note de l'outil.)
    const enonce = `${P} a ${n} planches de ${mes(Lm, uL)}. Une étagère fait ${mes(em, ue)}. Combien d'étagères${NB}?`;
    const morceaux = Array.from({length: Number(per)}, () => mes(em, ue));
    return {sorte: "planches", modele: `planches-${L}${e}`, degre, enonce, avant: "", apres: "étagères", compte: true, vers: ue, reponse: BigInt(n) * per * MILLE,
      barre: {tout: `Une planche : ${uL === ue ? mes(Lm, uL) : `${mes(Lm, uL)} = ${mes(Lv, ue)}`}`, parts: [mes(em, ue), "…"], dessous: ""},
      barreCorr: {tout: `Une planche : ${mes(Lm, uL)}`, parts: morceaux, perdu: mes(reste, ue), dessous: ""},
      note: "Une étagère : un seul morceau.",
      image: [`Une planche : combien d'étagères${NB}?`, `Puis pour ${n} planches.`],
      lignes: v => [`Une planche : ${per} étagère${per > 1n ? "s" : ""}.`, [`${n} × ${per} = `, v, `${NB}étagères`]],
      donnees: {n, L: brut(Lm), uL, e: brut(em), ue}, cle: `Q3:e:${n}x${brut(Lm)}${uL}/${brut(em)}${ue}`};
  }
  function deuxQ3(degre, rng) {
    const [modele, texte, avant, spec, vers, nMin, nMax, kMin, kMax, bornes] = choisir(rng, DEUX_Q3);
    const [M, u] = tireQ3(rng, spec);
    const n = entre(rng, nMin, nMax);
    const k = entre(rng, kMin, kMax);
    const tot = BigInt(n) * M;
    const totv = convertir(tot, u, vers);
    if (totv === null || totv % BigInt(k) !== 0n) return null;
    const rep = totv / BigInt(k);
    if (rep % MILLE !== 0n || !dansBornesQ3(rep, bornes)) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, n, M: mes(M, u), k});
    return {sorte: "deux", modele, degre, enonce, avant, vers, reponse: rep,
      barre: {tout: `${n} × ${mes(M, u)}`, parts: partsQ3(k, "", `?${NB}${vers}`), dessous: `${k} parts`},
      barreCorr: {tout: `${mes(tot, u)} = ${mes(totv, vers)}`, parts: partsQ3(k, "", "@"), dessous: `${k} parts`, partsVertes: true},
      image: [`${n} × ${mes(M, u)} = ${CASE}`, `Puis je partage en ${k}.`],
      lignes: v => [`${n} × ${mes(M, u)} = ${mes(tot, u)} = ${mes(totv, vers)}`, [`${mes(totv, vers)} ÷ ${k} = `, v, ""]],
      donnees: {a: brut(M), ua: u, n, k}, cle: `Q3:d:${modele}:${n}x${brut(M)}${u}/${k}`};
  }
  // Les erreurs de Q3 (une ligne, 31 signes au plus).
  function erreursQ3(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "q3" || typeof lu !== "bigint") return null;
    const rep = milli(question.reponse);
    const conv = (m, u) => convertir(milli(m), u, d.vers);
    if (d.sorte === "fois") {
      const brutT = milli(d.a) * BigInt(d.n);
      if (lu === brutT) return {erreur: 1, retour: `Puis j'écris le tout en ${d.vers}.`};
      if (lu === milli(d.a)) return {erreur: 2, retour: `Il y en a ${d.n}.`};
    }
    if (d.sorte === "partage") {
      const t = milli(d.a);
      if (t % BigInt(d.n) === 0n && lu === t / BigInt(d.n)) return {erreur: 1, retour: `J'écris d'abord le tout en ${d.vers}.`};
      if (lu === conv(d.a, d.ua) * BigInt(d.n)) return {erreur: 3, retour: "On partage : c'est plus petit."};
    }
    if (d.sorte === "parts") {
      const T = convertir(milli(d.a), d.ua, d.up);
      const p = milli(d.part);
      if (lu === T * p / MILLE) return {erreur: 3, retour: "On cherche combien de fois."};
      if (lu * p === milli(d.a) * MILLE) return {erreur: 1, retour: `${mes(milli(d.a), d.ua)}, c'est ${mes(T, d.up)}.`};
    }
    if (d.sorte === "planches") {
      const Lv = convertir(milli(d.L), d.uL, d.ue);
      const faux = (BigInt(d.n) * Lv) / milli(d.e);
      const reste = Lv - (Lv / milli(d.e)) * milli(d.e);
      if (lu === faux * MILLE) return {erreur: 4, retour: `Il reste ${mes(reste, d.ue)} par planche.`};
    }
    if (d.sorte === "fois-plus") {
      const Av = conv(d.a, d.ua);
      const autre = d.plus ? (Av % BigInt(d.k) === 0n ? Av / BigInt(d.k) : null) : Av * BigInt(d.k);
      if (autre !== null && lu === autre) return {erreur: 3, retour: d.plus ? `${d.k} fois plus : c'est plus.` : `${d.k} fois moins : c'est moins.`};
      const brutR = d.plus ? milli(d.a) * BigInt(d.k) : (milli(d.a) % BigInt(d.k) === 0n ? milli(d.a) / BigInt(d.k) : null);
      if (brutR !== null && lu === brutR) return {erreur: 1, retour: `J'écris la réponse en ${d.vers}.`};
    }
    if (d.sorte === "deux") {
      const tot = convertir(milli(d.a) * BigInt(d.n), d.ua, d.vers);
      if (lu === tot) return {erreur: 5, retour: `Puis je partage en ${d.k}.`};
      if (lu === conv(d.a, d.ua) / BigInt(d.k) && conv(d.a, d.ua) % BigInt(d.k) === 0n) return {erreur: 5, retour: `Il y a ${d.n} ${d.modele === "riz" ? "sacs" : d.modele === "jus" ? "bouteilles" : "coupons"}.`};
    }
    if (lu === rep * 10n || lu * 10n === rep) {
      if (rep % MILLE || lu % MILLE) return {erreur: 9, retour: "La virgule est mal placée."};
      return {erreur: 9, retour: lu > rep ? "Un zéro de trop." : "Un zéro de moins."};
    }
    return null;
  }
  const PLACES_Q3 = {
    valide: ["fois", "partage", "fois", "parts", "fois-plus", "V", "partage", "planches", "deux", "parts"],
    entraine: ["fois", "partage", "fois", "partage", "fois", "partage",
      "parts", "fois-plus", "V", "parts", "partage", "fois-plus", "fois", "V", "parts",
      "planches", "deux", "parts", "V", "fois-plus", "planches", "deux", "parts", "V", "partage"],
    test: ["parts", "planches", "deux", "fois-plus"],
    aide: ["fois", "parts", "partage"],
    retour: ["fois|partage|parts", "parts|fois-plus|V"],
    echauffement: ["fois|partage"]
  };
  function tirerQ3(rng, degre, forme) {
    const vrai = forme && forme.startsWith("vrai") ? forme.slice(5) : null;
    const sorte = vrai ? "fois" : forme || choisir(rng, {1: ["fois", "partage"], 2: ["parts", "fois-plus", "partage"], 3: ["planches", "deux", "parts"]}[degre]);
    for (let essai = 0; essai < 60; essai += 1) {
      let spec = null;
      if (sorte === "fois") spec = foisQ3(degre, rng);
      else if (sorte === "partage") spec = partageQ3(degre, rng);
      else if (sorte === "parts") spec = partsDeQ3(degre, rng);
      else if (sorte === "fois-plus") spec = foisPlusQ3(degre, rng);
      else if (sorte === "planches") spec = planchesQ3(degre, rng);
      else if (sorte === "deux") spec = deuxQ3(degre, rng);
      const x = spec && finirQ3(spec, rng, vrai);
      if (x) return x;
    }
    return null;
  }
  ETAPES.Q3 = {
    // On te montre : Lina, 1,2 m de ruban en morceaux de 8 cm (15) ; 6
    // verres de 25 cL ; 6 planches de 5 m, des étagères de 2 m (12, pas 15).
    clesExemples: ["Q3:n:ruban:1,2m/8cm", "Q3:f:goyave:6x25cL", "Q3:e:6x5m/2m"],
    tirer(rng, degre, i, usage, forme) { return tirerQ3(rng, degre, forme); },
    formes(usage, rng) {
      const p = PLACES_Q3[usage];
      const f = {};
      if (!p) return f;
      const [x, y] = rng() < 0.5 ? ["vrai-oui", "vrai-non"] : ["vrai-non", "vrai-oui"];
      let v = 0;
      p.forEach((s, i) => {
        const t = choisir(rng, s.split("|"));
        if (t === "V") { f[i] = usage === "valide" ? [x, y][v] : rng() < 0.5 ? "vrai-oui" : "vrai-non"; v += 1; } else f[i] = t;
      });
      return f;
    },
    // (Dans Je valide : un même contexte une fois.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      return !serie.some(x => x.modeleQ3 === question.modeleQ3);
    },
    erreurs(question, lu) { return erreursQ3(question, lu); }
  };

  // ------------------------------ Q4 · Une fraction d'une quantité
  // S003 p. 4 : « 2⁄3 de 12 œufs », « 3⁄10 de 500 g de farine », « 2⁄5 de
  // 60 kg de sable » avec le schéma (60 = 5 × 12, 2 fois 12 kg = 24 kg) ;
  // S003 p. 22 : le cocktail de 250 mL ; S001 : « deux tiers de 12 €, trois
  // quarts de 100 mètres » ; dénominateurs jusqu'à 60 (ici 2 à 10). Les
  // fractions s'écrivent avec la barre U+2044, en colonne dans la page.
  // [modèle, énoncé ({F} la fraction, {Q} la quantité, {P}), avant, unité,
  // les quantités, l'unité plus petite (degré 3)]
  const QUANTITES_Q4 = [
    ["sable", "Pour la varangue, on prend {F} d'un sac de {Q} de sable.", "Masse :", "kg", [20, 25, 30, 40, 50, 60], null],
    ["bananes", "{P} donne {F} d'un régime de bananes de {Q}.", "Masse :", "kg", [10, 12, 15, 16, 18, 20, 24], null],
    ["sentier", "Sentier du Piton des Neiges : {Q}. {P} en a parcouru {F}.", "Distance :", "km", [4, 5, 6, 8, 10, 12], "m"],
    ["farine", "Une recette demande {F} d'un paquet de farine de {Q}.", "Masse :", "g", [500, 1000], null],
    ["argent", "{P} a {Q} d'argent de poche et en dépense {F}.", "Dépense :", "€", [12, 20, 24, 30, 40], null],
    ["piste", "La piste mesure {Q}. {P} en court {F}.", "Distance :", "m", [100, 200, 400], null],
    ["lait", "On verse {F} d'un bidon de {Q} de lait dans la marmite.", "Volume :", "L", [1, 2, 3, 4], "cL"],
    ["goyave", "{P} sert {F} d'une bouteille de {Q} de jus de goyave.", "Volume :", "L", [1, 2], "cL"],
    ["riz", "Pour la fête, on cuit {F} d'un sac de riz de {Q}.", "Masse :", "kg", [2, 5, 10], "g"],
    // (Correctif B3-3 : quatre contextes de plus, avec une unité plus
    // petite — Je valide ne reprend jamais un contexte.)
    ["canne", "Un camion apporte {Q} de canne à l'usine. On en broie {F}.", "Masse :", "t", [2, 4, 5, 10], "kg"],
    ["eau", "{P} boit {F} d'une bouteille d'eau de {Q}.", "Volume :", "L", [1, 2], "cL"],
    ["tissu", "{P} utilise {F} d'un coupon de tissu de {Q}.", "Longueur :", "m", [2, 3, 4, 5, 6], "cm"],
    ["letchis", "{P} mange {F} d'un sac de letchis de {Q}.", "Masse :", "kg", [1, 2, 3], "g"]
  ];
  const PETITES_Q4 = new Set(QUANTITES_Q4.filter(x => x[5]).map(x => x[0]));
  const FRACTIONS_Q4 = {1: [[1, 2], [1, 3], [1, 4], [1, 5], [1, 10]], 2: [[2, 3], [3, 4], [2, 5], [3, 5], [3, 10], [7, 10], [5, 6], [3, 8]], 3: [[3, 4], [2, 5], [3, 10], [2, 3], [4, 5]]};
  const fracQ4 = (k, n) => `${k}⁄${n}`;
  function texteFracQ4(k, n) {
    return k === 1 && n === 2 ? "la moitié" : fracQ4(k, n);
  }
  // La barre de S003 (choix du B3-3a) : `tout` au-dessus, n parts égales,
  // les k prises en bleu pâle (`debut` : la première prise), l'accolade
  // dessous avec la fraction et « ? ». `hachees` : des parts déjà prises
  // par autre chose (le cocktail).
  function finirQ4(spec, rng) {
    const {modele, degre, k, n, Q, u, vers, enonce, avant} = spec;
    const Qv = convertir(Q, u, vers);
    if (Qv === null || Qv % BigInt(n) !== 0n) return null;
    const part = Qv / BigInt(n);
    const rep = part * BigInt(k);
    if (decimales(part) > 1 || decimales(rep) > 1 || rep <= 0n) return null;
    // (Des euros entiers : pas « 4,8 € ». Correctif B3-3 : des m, des mL et
    // des g entiers aussi — pas « 187,5 mL ».)
    if (["€", "m", "mL", "g"].includes(vers) && (part % MILLE || rep % MILLE)) return null;
    const R = mes(rep, vers);
    const P = mes(part, vers);
    const toutTexte = u === vers ? mes(Q, u) : `${mes(Q, u)} = ${mes(Qv, vers)}`;
    const barre = {tout: toutTexte, n, k, debut: spec.debut || 0, frac: spec.etiquette || fracQ4(k, n), hachees: spec.hachees || []};
    // (Correctif B3-3 : sous les parts hachurées du cocktail, « 2⁄5 letchi ».)
    if (spec.hachuresFrac) Object.assign(barre, {hachuresFrac: spec.hachuresFrac, hachuresNom: spec.hachuresNom});
    // (L'outil n'écrit jamais la réponse ; au degré 1, la valeur d'une part
    // est la réponse : la note dit seulement « en n parts égales ».)
    // (Quand chaque part écrit sa valeur dans la barre — 5 parts au plus —,
    // une seule ligne : « 2 × 12 kg = 24 kg » ; sinon le partage d'abord.)
    const lignes = k === 1 ? [[`${mes(Qv, vers)} ÷ ${n} = `, R, ""]] : n <= 5 ? [[`${k} × ${P} = `, R, ""]] : [`${mes(Qv, vers)} ÷ ${n} = ${P}`, [`${k} × ${P} = `, R, ""]];
    const x = q({
      code: "Q4", degre, forme: "nombre", texte: `${enonce} ${avant} ${CASE}${NB}${vers}`, morceaux: {enonce, avant, apres: vers, serre: true},
      reponse: brut(rep), reponseTexte: R, unite: vers, grandeur: grandeurDe(vers), resume: `${avant} ${R}`,
      outil: "barre-q4", barreQ4: barre, noteOutil: `${mes(Q, u)} en ${n} parts égales.`,
      image: [u === vers ? `1 part : ${mes(Q, u)} ÷ ${n}` : `${mes(Q, u)} = ${mes(Qv, vers)}`, k === 1 ? "Je partage, je ne multiplie pas." : `Puis ${k} parts.`],
      correction: lignes.map(l => (Array.isArray(l) ? l.join("") : l)), lignesB33: lignes,
      corrB33: Object.assign({type: "barre-q4", valeur: P, total: R}, barre),
      sorteQ4: spec.sorte, modeleQ4: modele,
      donnees: {type: "q4", k, n, q: brut(Q), u, vers}, cle: `Q4:${modele}:${k}/${n}:${brut(Q)}${u}>${vers}`, cleBase: `Q4:${modele}:${k}/${n}:${brut(Q)}${u}>${vers}`
    });
    if (spec.sorte !== "choix") return x;
    // Au choix : une seule part ; partager par le numérateur ; multiplier ;
    // le reste (correctif B3-3 : « enlever 2 », 498 g pour la moitié de
    // 500 g, n'était pas une vraie erreur).
    const faux = [];
    const pourquoi = [];
    if (k > 1) { faux.push(part); pourquoi.push("C'est une seule part."); }
    if (k > 1 && Qv % BigInt(k) === 0n) { faux.push(Qv / BigInt(k)); pourquoi.push(`On partage en ${n}, pas en ${k}.`); }
    if (k === 1) { faux.push(Qv * BigInt(n)); pourquoi.push("On partage : c'est moins."); }
    faux.push(part * BigInt(n - k)); pourquoi.push("Ça, c'est le reste.");
    const paires = faux.map((y, j) => [y, pourquoi[j]]).filter(([y]) => y !== rep && y > 0n && decimales(y) <= 1 && (!["€", "m", "mL", "g"].includes(vers) || y % MILLE === 0n));
    const uniques = paires.filter(([y], j) => paires.findIndex(([z]) => z === y) === j);
    if (uniques.length < 2) return null;
    const trois = melanger(rng, [[rep, null], ...uniques.slice(0, 2)]);
    const choix = trois.map(([y]) => mes(y, vers));
    const bon = trois.findIndex(([, p]) => p === null);
    const pq = {};
    trois.forEach(([, p], j) => { if (p) pq[j] = p; });
    const consigne = `${avant.replace(/ :$/, "")}${NB}?`;
    const sans = enonce.replace(/ [^.]*\?$/, "");
    return Object.assign(x, {forme: "qcm", texte: `${sans} ${consigne}`,
      morceaux: {enonce: sans, consigne, serre: true, sorte: "mesure"}, choix, bon, pourquoi: pq, cle: `${x.cle}:q`});
  }
  function tirerQ4(rng, degre, sorte) {
    if (sorte === "cocktail") return cocktailQ4(rng);
    const [modele, texte, avant, u, quantites, petite] = choisir(rng, QUANTITES_Q4);
    const [k, n] = choisir(rng, FRACTIONS_Q4[sorte === "choix" ? choisir(rng, [1, 2]) : degre]);
    const Q = BigInt(choisir(rng, quantites)) * MILLE;
    const vers = degre === 3 && sorte !== "choix" ? petite : u;
    if (!vers) return null;
    const P = choisir(rng, PRENOMS);
    const enonce = remplirQ2(texte, {P, Q: mes(Q, u), F: texteFracQ4(k, n)});
    return finirQ4({sorte: sorte || "fraction", modele, degre, k, n, Q, u, vers, enonce, avant}, rng);
  }
  // Le cocktail (S003 p. 22) : un verre de 250 mL, une part de jus de
  // letchi (S003 écrit « litchi », La Réunion « letchi »), le reste de jus
  // d'orange ; on demande l'un ou l'autre (le reste : deux étapes).
  function cocktailQ4(rng) {
    const V = choisir(rng, [200, 250, 300]);
    const [kl, n] = choisir(rng, [[2, 5], [1, 5], [3, 10], [1, 4], [2, 3]]);
    const reste = rng() < 0.5;
    // (Correctif B3-3 : plus court, deux lignes avec une police large.)
    const enonce = `Cocktail de ${V}${NB}mL : ${fracQ4(kl, n)} de letchi, le reste d'orange. Volume ${reste ? "d'orange" : "de letchi"}${NB}?`;
    const k = reste ? n - kl : kl;
    return finirQ4({sorte: "cocktail", modele: "cocktail", degre: 3, k, n, Q: BigInt(V) * MILLE, u: "mL", vers: "mL", enonce, avant: reste ? "Orange :" : "Letchi :",
      debut: reste ? kl : 0, etiquette: reste ? "le reste" : null, hachees: reste ? Array.from({length: kl}, (_, i) => i) : [],
      hachuresFrac: reste ? fracQ4(kl, n) : null, hachuresNom: "letchi"}, rng);
  }
  function erreursQ4(question, lu) {
    const d = question.donnees;
    if (!d || d.type !== "q4" || typeof lu !== "bigint") return null;
    const Qv = convertir(milli(d.q), d.u, d.vers);
    const part = Qv / BigInt(d.n);
    const rep = milli(question.reponse);
    if (d.k > 1 && lu === part) return {erreur: 1, retour: "C'est une seule part."};
    if (d.k > 1 && Qv % BigInt(d.k) === 0n && lu === Qv / BigInt(d.k)) return {erreur: 2, retour: `On partage en ${d.n}, pas en ${d.k}.`};
    if (d.u !== d.vers && milli(d.q) * BigInt(d.k) % BigInt(d.n) === 0n && lu === milli(d.q) * BigInt(d.k) / BigInt(d.n)) return {erreur: 3, retour: `J'écris la réponse en ${d.vers}.`};
    if (question.sorteQ4 === "cocktail" && lu === Qv - rep) return {erreur: 4, retour: "Ça, c'est l'autre jus."};
    if (lu === Qv - rep) return {erreur: 5, retour: "Ça, c'est le reste."};
    if (lu === rep * 10n || lu * 10n === rep) {
      if (rep % MILLE || lu % MILLE) return {erreur: 9, retour: "La virgule est mal placée."};
      return {erreur: 9, retour: lu > rep ? "Un zéro de trop." : "Un zéro de moins."};
    }
    return null;
  }
  const PLACES_Q4 = {
    valide: ["fraction", "fraction", "choix", "fraction", "fraction", "choix", "fraction", "fraction", "cocktail", "fraction"],
    entraine: ["fraction", "fraction", "choix", "fraction", "fraction", "fraction",
      "fraction", "fraction", "choix", "fraction", "fraction", "fraction", "choix", "fraction", "fraction",
      "fraction", "cocktail", "fraction", "fraction", "cocktail", "fraction", "fraction", "cocktail", "fraction", "fraction"],
    test: ["fraction", "fraction", "cocktail", "choix"],
    aide: ["fraction", "fraction", "choix"],
    retour: ["fraction|choix", "fraction"],
    echauffement: ["fraction"]
  };
  ETAPES.Q4 = {
    // On te montre : 2⁄5 de 60 kg de sable (S003) ; 3⁄10 de 500 g de farine
    // (S003) ; 3⁄4 de 2 L de lait, en cL.
    clesExemples: ["Q4:sable:2/5:60kg>kg", "Q4:farine:3/10:500g>g", "Q4:lait:3/4:2L>cL"],
    tirer(rng, degre, i, usage, forme) {
      for (let essai = 0; essai < 60; essai += 1) {
        const x = tirerQ4(rng, degre, forme || (degre === 3 && rng() < 0.25 ? "cocktail" : "fraction"));
        if (x) return Object.assign(x, {degre});
      }
      return null;
    },
    formes(usage, rng) {
      const p = PLACES_Q4[usage];
      const f = {};
      if (p) p.forEach((s, i) => { f[i] = choisir(rng, s.split("|")); });
      return f;
    },
    // (Dans Je valide : une situation une fois ; correctif B3-3 : aux degrés
    // 1 et 2, quatre situations « à petite unité » au plus, il en reste pour
    // le degré 3, qui convertit.)
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      if (serie.some(x => x.modeleQ4 === question.modeleQ4)) return false;
      const petite = x => x.degre < 3 && PETITES_Q4.has(x.modeleQ4);
      return !petite(question) || serie.filter(petite).length < 4;
    },
    erreurs(question, lu) { return erreursQ4(question, lu); }
  };

  // (Comme au lot B3-2) La ligne de la case plus petite dès 11 signes ;
  // sous un énoncé, l'énoncé serré sur deux lignes au plus (la case moins
  // large quand la réponse est courte). Les textes neufs passent par
  // CARTE.typo (aucune espace normale devant « : ? »).
  function ligneB33(x) {
    const m = x && x.morceaux;
    if (!m) return x;
    if (m.avant !== undefined) {
      const n = (m.avant || "").length + (m.apres || "").length + (m.cases || []).join("").length;
      if (n >= 11) m.long = true;
    }
    // (Correctif B3-3 : l'énoncé jamais sous 14 px — `plancher`.)
    if (m.enonce && (x.forme === "nombre" || x.forme === "deux-cases")) Object.assign(m, {long: true, serre: true, deuxLignes: true, plancher: 14}, x.forme === "nombre" && String(x.reponse).length <= 6 ? {etroite: true} : {});
    return x;
  }
  function typoB33(x) {
    if (!x) return x;
    const t = CARTE.typo;
    const m = x.morceaux;
    if (m) ["phrase", "avant", "enonce", "consigne", "proposition"].forEach(k => { if (typeof m[k] === "string") m[k] = t(m[k]); });
    ["texte", "resume", "noteOutil", "reponseTexte"].forEach(k => { if (typeof x[k] === "string") x[k] = t(x[k]); });
    ["correction", "image", "outilLignes"].forEach(k => { if (Array.isArray(x[k])) x[k] = x[k].map(t); });
    if (Array.isArray(x.choix)) x.choix = x.choix.map(t);
    if (Array.isArray(x.lignesB33)) {
      x.lignesB33 = x.lignesB33.map(l => (Array.isArray(l) ? l.map(t) : t(l)));
      // (La correction écrite est celle qui s'affiche, ligne par ligne.)
      x.correction = x.lignesB33.map(l => (Array.isArray(l) ? l.join("") : l));
    }
    if (x.pourquoi) Object.keys(x.pourquoi).forEach(k => { x.pourquoi[k] = t(x.pourquoi[k]); });
    return x;
  }
  ["D3", "Q3", "Q4"].forEach(code => {
    const tirer = ETAPES[code].tirer;
    ETAPES[code].tirer = (...args) => typoB33(ligneB33(tirer(...args)));
  });

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
      const pareil = l => lu.length === l.length && lu.every((x, k) => x === l[k]);
      const juste = pareil(attendu);
      // (Lot B2-2b-1, C7 : les nombres rangés sans regarder l'unité — « 300 cm
      // est plus long que 3 m car 300 > 3 » —, ou de la plus grande à la
      // plus petite. Une ligne au petit téléphone.)
      let retour = null;
      if (!juste && question.ordreNombres !== undefined) {
        if (question.ordreNombres && pareil(question.ordreNombres)) retour = `J'écris tout en ${question.uniteCommune} d'abord.`;
        else if (pareil(attendu.slice().reverse())) retour = "Je commence par la plus petite.";
      }
      return {juste, erreur: retour ? 11 : null, retour: retour ? CARTE.typo(retour) : null};
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
    // Lot B6-2 (P6) : un exposant, un entier peut-être négatif (« −6 »).
    if (question.forme === "exposant") {
      const t = String(saisie == null ? "" : saisie).replace(/\s/g, "").replace(/^[−-]/, "-");
      if (!/^-?\d{1,2}$/.test(t)) return {juste: false, erreur: null, retour: null};
      const lu = Number(t);
      if (lu === Number(question.reponse.replace("−", "-"))) return {juste: true, erreur: null, retour: null};
      const e = etape && etape.erreurs ? etape.erreurs(question, lu) : null;
      return {juste: false, erreur: e ? e.erreur : null, retour: e ? CARTE.typo(e.retour) : null};
    }
    if (question.forme === "deux-cases") {
      const lus = (Array.isArray(saisie) ? saisie : []).map(lireMilli);
      const attendus = question.reponse.map(milli);
      // (Lot B3-3 : trois cases, « … h … min … s ».)
      const juste = lus.length === attendus.length && lus.every((l, i) => typeof l === "bigint" && l === attendus[i]);
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
  // Lot B3-2 : C9 (les conversions au millième), A1 et A2 (les aires).
  const SENS = {C1: [1], C2: [1], P1: [3], E1: [3], P2: [1], P3: [1, 3], P4: [1, 3], C3: [1, 3], C4: [1, 3], C5: [1, 3], P5: [1, 3], C9: [1, 3], A1: [1, 3], A2: [1]};
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
    // lot B6-2 (P5, P6) : de nano à giga, les puissances de 10
    PREFIXES_GN,
    puissanceTexte: puiss,
    PRENOMS,
    OBJETS,
    OBJETS_UNITE,
    OBJETS_MESURE,
    OBJETS_DECIMAUX,
    VRAISEMBLANCE,
    dansBornes,
    PLANS,
    // lot B2-3a (A5) : l'aire en carreaux
    QUARTS_A5,
    piecesA5,
    aireDemisA5,
    superposerA5,
    perimetreA5
  });
});
