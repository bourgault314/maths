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

  const MOTS = {
    km: "kilomètres", m: "mètres", dm: "décimètres", cm: "centimètres", mm: "millimètres",
    t: "tonnes", kg: "kilogrammes", g: "grammes", L: "litres", dL: "décilitres", cL: "centilitres", mL: "millilitres",
    min: "minutes", h: "heures", "€": "euros", c: "centimes"
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
      const phrase = `Combien de ${MOTS[vers]} dans ${gauche}${NB}?`;
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
  // Et une conversion qu'on fait vraiment : jamais un objet en décilitres
  // (un aquarium de 98 L en dL), des millimètres depuis les mètres
  // seulement pour une table (on la commande en mm).
  function objetDe(valeur, de, vers) {
    // (Ni en dm : « une planche de 30 dm », « une canne à sucre de 390 cm,
    // combien de dm ? » ne se disent pas dans la vie ; le dm reste dans les
    // calculs.)
    if (valeur % MILLE !== 0n || [de, vers].some(u => u === "dL" || u === "dm")) return null;
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
    L: "litre", dL: "décilitre", cL: "centilitre", mL: "millilitre"};
  function glisse(valeur, de, vers) {
    const g = {valeur: brut(valeur), de, vers, grandeur: grandeurDe(de)};
    if (MOT[de] && MOT[vers]) {
      if (exposant(de) > exposant(vers)) {
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
  const ORDRE_UNITES = {longueur: ["mm", "cm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"]};

  function questionRepereInterne(code, degre, rep, forme, rng) {
    const r = CARTE.repere(rep);
    const v = milli(r.nombre);
    const fin = r.fin ? ` ${r.fin}` : "";
    const resume = `${r.objet} : ${r.valeur}`;
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
        unite: r.unite, resume, repere: rep, outil: "reperes-unites",
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
      unite: r.unite, resume, repere: rep, outil: "reperes-unites",
      image: [], correction: [resume],
      donnees: {type: "repere", repere: rep, sorte: forme},
      cle: `${code}:${rep}:${forme}`
    });
  }

  // « Associer » (lot A2 bis, la question qui manquait à l'exerciseur) :
  // 3 objets, 3 mesures, à relier au doigt. Degré 2 : trois grandeurs
  // différentes ; degré 3 : la même grandeur (il faut connaître le repère,
  // l'unité ne suffit pas). Jamais deux fois le même objet (« Une voiture »
  // mesure 4 m ET pèse 1 t), jamais deux fois la même mesure.
  // `eviter` : les repères des questions juste avant (lot A2 ter : pas deux
  // fois le même repère à moins de 5 questions dans À toi).
  // Lot 3b-2 : au téléphone peu haut, le nom d'un objet à relier tient en
  // deux lignes sous son dessin.
  const NOMS_COURTS = {l1: "La plus petite graduation"};
  function questionAssocier(code, degre, rng, eviter = []) {
    const tous = CARTE.etape(code).reperes.map(c => CARTE.repere(c));
    const libres = tous.filter(r => !eviter.includes(r.code));
    const reps = libres.length >= 3 ? libres : tous;
    let trois = [];
    for (let essai = 0; essai < 60; essai += 1) {
      if (degre === 3) {
        const possibles = ["longueur", "masse"].filter(g => reps.filter(r => r.grandeur === g).length >= 3);
        const g = choisir(rng, possibles.length ? possibles : ["longueur", "masse"]);
        trois = melanger(rng, (possibles.length ? reps : tous).filter(r => r.grandeur === g)).slice(0, 3);
      } else trois = melanger(rng, reps).slice(0, 3);
      const objets = new Set(trois.map(r => r.objet));
      const mesures = new Set(trois.map(r => `${r.nombre}${r.unite}`));
      const grandeurs = new Set(trois.map(r => r.grandeur));
      if (trois.length === 3 && objets.size === 3 && mesures.size === 3 && (degre === 3 || grandeurs.size === 3)) break;
    }
    const mesureDe = r => CARTE.typo(`${ecrire(milli(r.nombre))} ${r.unite}`);
    // Lot A2 ter (Gwenaël, le 13/11 : « chacun est en face de chacun, c'est
    // normal ? ») : jamais les trois mesures en face de leur objet.
    let ordreMesures = melanger(rng, [0, 1, 2]);
    while (ordreMesures.every((k, j) => k === j)) ordreMesures = melanger(rng, [0, 1, 2]);
    const mesures = ordreMesures.map(k => mesureDe(trois[k]));
    const bonnes = trois.map((r, k) => ordreMesures.indexOf(k));
    const consigne = "Relie chaque objet à sa mesure.";
    const correction = trois.map(r => CARTE.typo(`${r.objet} : ${r.valeur}`));
    return q({
      code, degre, forme: "associer",
      texte: CARTE.typo(`${consigne} ${trois.map(r => r.objet).join(" ; ")} — ${mesures.join(" ; ")}`),
      morceaux: {phrase: consigne},
      objets: trois.map(r => Object.assign({texte: r.objet, repere: r.code}, NOMS_COURTS[r.code] ? {court: NOMS_COURTS[r.code]} : {})), mesures, bonnes,
      reponse: bonnes.join(","), reponseTexte: trois.map(r => `${r.objet} : ${mesureDe(r)}`).join(" ; "),
      resume: trois.map(r => `${r.objet} : ${mesureDe(r)}`).join(" ; "),
      reperes: trois.map(r => r.code), unites: trois.map(r => r.unite), outil: "reperes-unites",
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
  const OBJETS_REGLE = {crayon: ["ce crayon", "Le crayon", 5, 8], gomme: ["cette gomme", "La gomme", 2, 4], trombone: ["ce trombone", "Le trombone", 3, 5],
    clou: ["ce clou", "Le clou", 2, 5]};
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
      resume: `${Le} mesure ${longueur}${NB}cm`, outil: "regle",
      image: [`${Le} commence à ${debut}${NB}cm, pas à 0.`, `Je compte les espaces de 1${NB}cm, pas les traits.`],
      correction: [`${Le} va de ${debut}${NB}cm à ${fin}${NB}cm.`, `${fin} − ${debut} = ${longueur} : ${Le.toLowerCase()} mesure ${longueur}${NB}cm.`],
      donnees: {type: "regle", objet, debut, fin},
      cle: `R1:regle:${objet}:${debut}-${fin}`
    });
  }

  ETAPES.R1 = {
    exclureExemples: false,
    // Associer : la dernière question de Je valide, 3 fois sur 25 dans À toi.
    // Lot 3b : la valeur au pavé (« saisie ») en 6e et en 8e de Je valide.
    formes(usage) {
      // Lot 3b-2 : la règle à lire en 3e de Je valide, trois fois dans À toi.
      if (usage === "valide") return {2: "regle", 5: "saisie", 7: "saisie", 9: "associer"};
      if (usage === "entraine") return {3: "regle", 7: "associer", 11: "regle", 15: "associer", 19: "regle", 22: "associer"};
      return {};
    },
    // Lot A2 ter (Gwenaël, le 13/11 : « Une voiture pèse environ … » puis
    // « Une voiture pèse environ … t » dans la même série) : dans Je valide
    // (et le test, On revoit), JAMAIS deux fois le même repère — les 9
    // questions à choix ont 9 repères différents ; la question à relier, la
    // 10e, en reprend forcément trois. Dans À toi, pas deux fois le même
    // repère à moins de 5 questions d'écart (relier compris). Remplace le
    // « un seul repère peut revenir » du 11/11 au soir.
    jamais(serie, question, usage) {
      const reps = x => (x.forme === "associer" ? x.reperes : [x.repere]);
      if (usage === "entraine" || usage === "exerciseur") {
        return !serie.slice(-4).some(y => reps(y).some(r => reps(question).includes(r)));
      }
      if (question.forme === "associer") return true;
      return !serie.some(y => y.forme !== "associer" && y.repere === question.repere);
    },
    tirer(rng, degre, i, usage, forme, serie = []) {
      const recents = serie.slice(-4).flatMap(x => (x.forme === "associer" ? x.reperes : [x.repere]));
      if (forme === "associer") return questionAssocier("R1", degre, rng, recents);
      if (forme === "regle") return questionRegle(degre, rng);
      let reps = CARTE.etape("R1").reperes;
      // Avant une question à relier de À toi, les quatre questions à choix
      // laissent libre ce qu'il lui faudra : un repère de chaque grandeur
      // avant celle de degré 2 (place 8), trois repères d'une même grandeur
      // avant celles de degré 3 (places 16 et 23).
      if (usage === "entraine") {
        [[8, 2], [16, 3], [23, 3]].forEach(([j, d]) => {
          const ecart = j - (i + 1);
          if (ecart < 1 || ecart > 4) return;
          const dejaLa = serie.slice(Math.max(0, j - 5)).flatMap(x => (x.forme === "associer" ? x.reperes : [x.repere]));
          const libres = pris => {
            const n = g => CARTE.etape("R1").reperes.filter(c => CARTE.repere(c).grandeur === g && !pris.includes(c)).length;
            return d === 2 ? ["longueur", "masse", "contenance"].every(g => n(g) >= 1) : n("longueur") >= 3 || n("masse") >= 3;
          };
          reps = reps.filter(c => libres(dejaLa.concat(c)));
        });
      }
      // Lot 3b (carte v4 : « demander aussi la valeur sans choix ») : trois
      // façons de demander un même repère — l'unité, la valeur parmi trois,
      // la valeur au pavé. Une même question ne revient pas dans une série.
      const sorte = forme === "saisie" ? "saisie" : degre === 1 ? "unite"
        : degre === 3 ? choisir(rng, ["valeur", "saisie"]) : choisir(rng, ["unite", "valeur", "saisie"]);
      return questionRepereInterne("R1", degre, choisir(rng, reps), sorte, rng);
    }
  };

  // ----------------------------------------------- R2 · Quelle unité choisir ?
  // Une unité qu'on utilise vraiment, et une seule plausible. Longueurs :
  // 4 choix (mm, cm, m, km) ; masses et contenances : 3 (le cycle 2 n'en a
  // pas plus).
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
    ["De Saint-Denis à Saint-Paul :", "30", "km", 2], ["Un bébé à la naissance :", "3", "kg", 0],
    // Les objets de l'exerciseur (lot A2 bis), avec ses mesures.
    ["La longueur d'un lit :", "2", "m", 1], ["Un œuf :", "60", "g", 1], ["Une baguette de pain :", "250", "g", 1],
    ["Un gros dictionnaire :", "1", "kg", 1], ["Un grand arrosoir plein :", "10", "L", 1],
    ["De la maison à l'école : environ", "1", "km", 2], ["L'épaisseur d'une carte bancaire :", "1", "mm", 3],
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
    ["La hauteur d'une canne à sucre : environ", "3", "m", 2], ["Un ananas Victoria : environ", "800", "g", 3]
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
    ["Manger un samoussa :", "2", "min", 1], ["Faire cuire un cari : environ", "1", "h", 2],
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

  function questionSansNombre(degre, rng) {
    const vivier = SANS_NOMBRE.map((o, i) => [o, i]).filter(([o]) => o[3] === degre);
    const [[quoi, unite, fausse], i] = choisir(rng, vivier);
    const g = grandeurDe(unite);
    const autres = melanger(rng, AUTRES_GRANDEURS[g]);
    // Deux autres grandeurs différentes (pas « kg » et « g » ensemble).
    const deux = [autres[0], autres.find(u => grandeurDe(u) !== grandeurDe(autres[0]))];
    const choix = melanger(rng, [unite, fausse || deux[1], deux[0]]);
    const phrase = CARTE.typo(`Quelle unité pour ${quoi} ?`);
    const resume = CARTE.typo(`Pour ${quoi} : ${NOM_UNITE[unite]}.`);
    return q({
      code: "R2", degre, forme: "qcm", texte: phrase, morceaux: {phrase, apres: "", sorte: "sansNombre"},
      choix, bon: choix.indexOf(unite), reponse: unite, reponseTexte: unite, unite,
      resume, outil: "reperes-unites", grandeur: g,
      correction: [CARTE.typo(`${NOM_UNITE[unite][0].toUpperCase()}${NOM_UNITE[unite].slice(1)}.`)],
      donnees: {type: "unite-sans", objet: i, unite},
      cle: `R2:s:${i}`
    });
  }

  ETAPES.R2 = {
    // Je valide : « qu'est-ce qu'on mesure ? » en 4e, « Quelle unité
    // pour… ? » (sans nombre, lot 3b) en 6e, « h, min ou jours » en 8e ;
    // ailleurs, une question sur cinq de chaque.
    formes(usage) {
      if (usage !== "valide") return {};
      const f = {};
      for (let i = 0; i < 10; i += 1) f[i] = "unite";
      f[3] = "grandeur";
      f[5] = "sans";
      f[7] = "duree";
      return f;
    },
    tirer(rng, degre, place, usage, forme) {
      const r = forme && forme !== "unite" ? 1 : forme === "unite" ? 0.9 : rng();
      if (forme === "grandeur" || r < 0.2) return questionGrandeur(degre, rng);
      if (forme === "duree" || r < 0.35) return questionUniteDuree(degre, rng);
      if (forme === "sans" || r < 0.55) return questionSansNombre(degre, rng);
      const vivier = OBJETS_UNITE.map((o, i) => [o, i]).filter(([o]) => o[3] === degre);
      const [[debut, nombre, unite], i] = choisir(rng, vivier);
      const v = milli(nombre);
      // Lot 3b (carte v4 : « une autre grandeur » dans les mauvaises
      // réponses) : pour une masse ou une contenance (3 unités au cycle 2),
      // une 4e réponse d'une autre grandeur.
      const memes = CHOIX_UNITE[grandeurDe(unite)];
      const choix = melanger(rng, memes.length < 4 ? memes.concat(choisir(rng, AUTRES_GRANDEURS[grandeurDe(unite)])) : memes);
      const texte = CARTE.typo(`${debut} ${ecrire(v)} ${CASE}`);
      return q({
        code: "R2", degre, forme: "qcm", texte, morceaux: {phrase: texte, apres: "", sorte: "unite"},
        choix, bon: choix.indexOf(unite), reponse: unite, reponseTexte: mes(v, unite), unite,
        resume: CARTE.typo(`${debut} ${mes(v, unite)}`), outil: "reperes-unites", grandeur: grandeurDe(unite),
        correction: [CARTE.typo(`${debut} ${mes(v, unite)}`)],
        donnees: {type: "unite", objet: i, unite},
        cle: `R2:${i}`
      });
    },
    clesExemples: ["R2:0", "R2:33", "R2:d:0"]
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
      if (v % f === 0n && lu === v / f) return {erreur: 1, retour: `Tu as divisé. Une unité plus petite, il en faut plus : ${question.relation}, donc ${mes(v, d.de)} = ${ecrire(v)} × ${mes(f * MILLE, d.vers)}.`};
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
      if (lu === v * f) return {erreur: 1, retour: `Tu as multiplié. Une unité plus grande, il en faut moins : ${question.relation}, donc ${mes(v, d.de)} = ${ecrire(v)} ÷ ${ecrire(f * MILLE)}${NB}${d.vers}.`};
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
    // h de 7 à 12 ; m : 15, 30 ou 45.
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
      if (usage === "valide") return {2: "choix", 4: "quarts", 6: "heure", 8: "heure"};
      if (usage === "entraine") {
        const f = {};
        for (let i = 0; i < 25; i += 1) {
          const r = rng();
          if (r < 0.2) f[i] = "choix";
          else if (r < 0.35 && i >= 6 && i < 15) f[i] = "quarts";
          else if (r < 0.5 && i >= 6) f[i] = "heure";
        }
        return f;
      }
      return {};
    },
    tirer(rng, degre, i, usage, forme) {
      if (forme === "heure") return questionHeureMots(degre === 1 ? 2 : degre, rng);
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
        if (lu === milli(d.total)) return {erreur: 7, retour: `${ecrire(milli(d.total))}${NB}c, ce n'est pas ${ecrire(milli(d.total))}${NB}€ : 100${NB}c = 1${NB}€, donc ${ecrire(milli(d.total))}${NB}c = ${prixTexte(d.total)}.`};
        if (lu === milli(d.total) / 10n) return {erreur: 1, retour: `1${NB}€ = 100${NB}c, pas 10${NB}c : ${ecrire(milli(d.total))}${NB}c = ${prixTexte(d.total)}.`};
        return null;
      }
      const n = Number(lu / MILLE);
      if (lu % MILLE !== 0n) return null;
      if (d.sorte === "versE") {
        if (n === d.total * 100) return {erreur: 3, retour: `Une unité plus grande, il en faut moins : 100${NB}c = 1${NB}€, donc ${ecrire(milli(d.total))}${NB}c = ${d.total / 100}${NB}€.`};
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
  // ranger).
  function verifier(question, saisie) {
    if (!question) return {juste: false, erreur: null, retour: null};
    if (question.forme === "qcm" || question.forme === "vrai-faux") {
      return {juste: Number(saisie) === question.bon, erreur: null, retour: null};
    }
    // Associer : la mesure choisie pour chaque objet ; ranger : les places
    // touchées, de la plus petite à la plus grande (lot A2 bis).
    if (question.forme === "associer" || question.forme === "ranger") {
      const attendu = question.forme === "associer" ? question.bonnes : question.ordre;
      const lu = Array.isArray(saisie) ? saisie.map(Number) : [];
      return {juste: lu.length === attendu.length && lu.every((x, k) => x === attendu[k]), erreur: null, retour: null};
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
    const e = etape && etape.erreurs ? etape.erreurs(question, lu) : null;
    return {juste: false, erreur: e ? e.erreur : null, retour: e ? CARTE.typo(e.retour) : null};
  }

  // « Je prévois » (lot 3b-2, choix de Gwenaël du 14/11 : « grandir ou
  // rapetisser ? » seulement après une erreur de sens). Les erreurs de sens :
  // diviser au lieu de multiplier, ou l'inverse — l'erreur 1 de C1 et de C2,
  // l'erreur 3 de P1 (vers une unité plus grande, le nombre gardé ou
  // multiplié), l'erreur 3 de E1 (des centimes vers les euros, × 100).
  const SENS = {C1: [1], C2: [1], P1: [3], E1: [3]};
  // `tape` : ce que l'élève a écrit (ou le texte du choix touché).
  function erreurDeSens(question, tape) {
    if (!question || !SENS[question.code] || question.forme === "deux-cases" || question.forme === "associer" || question.forme === "ranger") return false;
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
    HORS_CYCLE_2,
    PRENOMS,
    OBJETS,
    OBJETS_UNITE,
    OBJETS_MESURE,
    dansBornes,
    PLANS
  });
});
