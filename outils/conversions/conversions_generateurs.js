// Défi conversions — les générateurs (lot 1, 11/11/2026).
//
// Fichier COMMUN à l'appli élève et, au lot « exerciseur v2 », à
// l'exerciseur. Il ne va jamais sur le serveur de suivi.
//
//   const C = MATHSGO_CONVERSIONS;
//   C.serie(code, {usage, graine, nombre, exclure})
//     usage : "valide" (10 : 3/4/3), "entraine" (25 : 6/9/10), "test"
//     (4 : d2 d3 d3 d2), "echauffement" (1 : d2), "aide" (3 : d1 d2 d2),
//     "exerciseur" (nombre au choix, ordre progressif)
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
//   "deux-cases" (« 780 cL = □ L □ cL »), "qcm", "vrai-faux" ;
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
    octet: {o: 0, ko: 3, Mo: 6, Go: 9}
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
    min: "minutes", h: "heures"
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
    verre: {nom: "un verre", grandeur: "contenance", unite: "cL", min: "15", max: "30", pas: "5"}
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
      const phrase = `${objetDe(valeur, de)} de ${gauche}. Combien de ${MOTS[vers]}${NB}?`;
      return {texte: phrase, morceaux: {phrase, apres: vers, objet: true}};
    }
    return {texte: `${gauche} = ${CASE}${NB}${vers}`, morceaux: {avant: `${gauche} =`, apres: vers}};
  }
  // L'objet d'une mesure, selon son unité de départ et sa taille.
  function objetDe(valeur, de) {
    const n = valeur / MILLE;
    switch (de) {
      case "mm": return n < 150n ? "Un clou" : n < 1000n ? "Un bâton" : "Un tuyau";
      case "cm": return "Un ruban";
      case "dm": return "Une planche";
      case "m": return n < 1000n ? "Une corde" : "Un sentier";
      case "km": return "Une course à vélo";
      case "g": return "Un colis";
      case "kg": return n < 1000n ? "Une caisse" : "Un chargement";
      case "t": return "Un chargement";
      case "L": return "Un aquarium";
      case "dL": return "Une marmite";
      case "cL": return "Une bassine";
      default: return "Une mesure";
    }
  }

  // Ce qui rend une conversion facile ou dure à lire pour le glisse-unité.
  function glisse(valeur, de, vers) {
    return {valeur: brut(valeur), de, vers, grandeur: grandeurDe(de)};
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

  ETAPES.R1 = {
    exclureExemples: false,
    // 9 repères pour 10 questions : dans Je valide, un seul repère peut
    // revenir (posé dans l'autre sens) ; dans le test, aucun (choix de
    // Gwenaël du 11/11 au soir).
    accepte(serie, question, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      const deja = serie.filter(x => x.repere === question.repere).length;
      if (usage === "test") return deja === 0;
      if (deja >= 2) return false;
      if (deja === 1) {
        const doubles = new Set(serie.map(x => x.repere).filter((r, i, t) => t.indexOf(r) !== i));
        return doubles.size === 0;
      }
      return true;
    },
    valide(serie, usage) {
      if (usage !== "valide" && usage !== "test") return true;
      const reps = serie.map(x => x.repere);
      const doubles = reps.filter((r, i) => reps.indexOf(r) !== i).length;
      return usage === "test" ? doubles === 0 : doubles <= 1;
    },
    tirer(rng, degre) {
      const reps = CARTE.etape("R1").reperes;
      const forme = degre === 1 ? "unite" : degre === 3 ? "valeur" : choisir(rng, ["unite", "valeur"]);
      return questionRepereInterne("R1", degre, choisir(rng, reps), forme, rng);
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
    // Les trois exemples de J'apprends : jamais dans une série.
    ["De Saint-Denis à Saint-Paul :", "30", "km", 0], ["Un bébé à la naissance :", "3", "kg", 0]
  ];
  const CHOIX_UNITE = {longueur: ["mm", "cm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"]};

  ETAPES.R2 = {
    tirer(rng, degre) {
      const vivier = OBJETS_UNITE.map((o, i) => [o, i]).filter(([o]) => o[3] === degre);
      const [[debut, nombre, unite], i] = choisir(rng, vivier);
      const v = milli(nombre);
      const choix = melanger(rng, CHOIX_UNITE[grandeurDe(unite)]);
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
    clesExemples: ["R2:32", "R2:33", "R2:0"]
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

  ETAPES.P1 = {
    exclureExemples: false,
    // d1 : vers la petite unité, × 10 ou × 100 ; d2 : × 1 000, ou vers la
    // grande unité × 10 ; d3 : vers la grande unité × 100 ou × 1 000.
    tirer(rng, degre, i, usage) {
      const vivier = [];
      RELATIONS_BASES.forEach(([g, p]) => {
        const f = facteur(g, p);
        if (degre === 1 && f <= 100n) vivier.push([g, p, "bas"]);
        if (degre === 2 && f === 1000n) vivier.push([g, p, "bas"]);
        if (degre === 2 && f === 10n) vivier.push([g, p, "haut"]);
        if (degre === 3 && f >= 100n) vivier.push([g, p, "haut"]);
      });
      const [g, p, sens] = choisir(rng, vivier);
      const forme = choisir(rng, ["nombre", "nombre", "phrase"]);
      const [valeur, de, vers] = sens === "bas" ? [MILLE, g, p] : [facteur(g, p) * MILLE, p, g];
      return questionConversion("P1", degre, forme, valeur, de, vers, {
        // L'outil ne recopie pas la relation au-dessus du glisse-unité :
        // dans cette étape, elle EST la réponse (audit du 12/11).
        relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, de, vers), outilSansRelation: true,
        image: [sensDuPrefixe(g, p)],
        correction: sens === "bas" ? [relationTexte(g, p)] : [relationTexte(g, p), `donc ${mes(valeur, de)} = ${mes(MILLE, g)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`
      });
    },
    formes(usage) {
      return usage === "valide" ? {2: "phrase", 6: "phrase"} : {};
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
  const SOMMES = [["m", "cm"], ["km", "m"], ["kg", "g"], ["t", "kg"], ["L", "cL"]];

  function questionSomme(code, degre, rng) {
    const [g, p] = choisir(rng, SOMMES);
    const f = facteur(g, p);
    const a = entre(rng, 1, 9);
    const b = f === 100n ? entre(rng, 2, 99) : entre(rng, 2, 99) * 10 + (rng() < 0.5 ? 0 : entre(rng, 1, 9));
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
    const depart = x => (x.donnees.type === "conv" ? x.donnees.valeur : x.donnees.a);
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
    return {};
  }

  ETAPES.C1 = {
    clesExemples: ["C1:3m>cm", "C1:4kg>g", "C1:5L>cL"],
    tirer(rng, degre, i, usage) {
      if (degre === 3 && (usage === "valide" ? i === 9 : rng() < 0.25)) return questionSomme("C1", 3, rng);
      let rel;
      let v;
      if (degre === 1) { rel = choisir(rng, C1_RELATIONS[1]); v = entre(rng, 1, 9); }
      else if (degre === 2) {
        if (rng() < 0.5) { rel = choisir(rng, C1_RELATIONS["2a"]); v = entre(rng, 1, 9); }
        else { rel = choisir(rng, C1_RELATIONS["2b"]); v = entre(rng, 10, 99); }
      } else { rel = choisir(rng, C1_RELATIONS[3]); v = nombreDegre3(rng, rel); }
      const [g, p] = rel;
      const forme = "nombre";
      const valeur = milli(v);
      const rep = convertir(valeur, g, p);
      return questionConversion("C1", degre, forme, valeur, g, p, {
        relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, g, p),
        // L'image dessinée (audit du 12/11) : v paquets « 1 m » de 100 cm,
        // tant qu'on peut les compter d'un coup d'œil (9 au plus).
        paquets: v <= 9 ? {n: v, dans: `1${NB}${g}`, sous: mes(facteur(g, p) * MILLE, p)} : null,
        image: [relationTexte(g, p), `donc ${mes(valeur, g)} = ${ecrire(valeur)} × ${mes(facteur(g, p) * MILLE, p)}`],
        correction: [relationTexte(g, p), `donc ${mes(valeur, g)} = ${ecrire(valeur)} × ${mes(facteur(g, p) * MILLE, p)} = ${mes(rep, p)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`
      });
    },
    formes: formesConvertir,
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
    const b = f === 100n ? entre(rng, 1, 99) : entre(rng, 1, 999);
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

  ETAPES.C2 = {
    clesExemples: ["C2:500cm>m", "C2:3000g>kg", "C2:40mm>cm"],
    tirer(rng, degre, i, usage) {
      if (degre === 3 && (usage === "valide" ? i === 9 : rng() < 0.25)) return questionDeuxCases("C2", 3, rng);
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
      return questionConversion("C2", degre, "nombre", valeur, p, g, {
        relation: relationTexte(g, p), outil: "glisse-unite", glisse: glisse(valeur, p, g),
        // L'image dessinée : r paquets de 100 cm, chacun fait 1 m.
        paquets: r <= 9 ? {n: r, dans: mes(f * MILLE, p), sous: `1${NB}${g}`} : null,
        image: [`${relationTexte(g, p)} : je regroupe ${mes(f * MILLE, p)} en 1${NB}${g}.`, `donc ${mes(valeur, p)} = ${ecrire(valeur)} ÷ ${ecrire(f * MILLE)}${NB}${g}`],
        correction: [relationTexte(g, p), `donc ${mes(valeur, p)} = ${ecrire(valeur)} ÷ ${ecrire(f * MILLE)}${NB}${g} = ${mes(milli(r), g)}`],
        grandeur: grandeurDe(g), relationCle: `${g}-${p}`
      });
    },
    formes: formesConvertir,
    accepte: contraintesConvertir,
    valide: serieConvertirBonne,
    erreurs(question, lu) {
      const d = question.donnees;
      if (d.type === "deux") return null;
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
      relation: `1${NB}h = 60${NB}min`, heure: {h, m: 0, versHeures: true},
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
      relation: `1${NB}h = 60${NB}min`, heure: {h, m, versHeures: true},
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

  ETAPES.D1 = {
    clesExemples: ["D1:1h0>min", "D1:2h0>min", "D1:1h10>min"],
    tirer(rng, degre) {
      if (degre === 1) {
        if (rng() < 0.3) return versHeures("D1", 1, choisir(rng, [60, 120]));
        return versMinutes("D1", 1, 1, choisir(rng, [10, 20, 30, 40, 50]));
      }
      if (degre === 2) {
        if (rng() < 0.5) return versMinutes("D1", 2, 2, choisir(rng, [10, 20, 30, 40, 50]));
        return versMinutes("D1", 2, 1, choisir(rng, [5, 15, 25, 35, 45, 55]));
      }
      if (rng() < 0.6) {
        let total;
        do { total = entre(rng, 65, 175, 5); } while (total % 60 === 0);
        return versHeuresMinutes("D1", 3, total);
      }
      return versMinutes("D1", 3, 2, choisir(rng, [5, 15, 25, 35, 45, 55]));
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

  ETAPES.D2 = {
    exclureExemples: false,
    tirer(rng, degre) {
      if (degre === 3 && rng() < 0.4) {
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
      const [mots, h, demis, quarts] = choisir(rng, vivier);
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
        correction: lignes.concat([`${mots} = ${total}${NB}min`]),
        donnees: {type: "duree-mots", h, demis, quarts},
        cle: `D2:${h}-${demis}-${quarts}>min`
      });
    },
    erreurs(question, lu) {
      const d = question.donnees;
      if (d.deux) return null;
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
          enonce: `Un ruban mesure ${a}${NB}m. ${prenom} en coupe ${b}${NB}cm. Quelle longueur de ruban reste-t-il, en cm${NB}?`,
          avant: "Il reste", objetBorne: "ruban", partBorne: "coupeRuban", tout: `${a}${NB}m`, partie: `${b}${NB}cm`};
      }
      const a = entre(rng, 1, 3);
      const b = entre(rng, 10, 90, 10);
      return {modele: "bout", objet: "planche", prenom, a, ua: "m", b, ub: "cm", vers: "cm", op: "+",
        enonce: `${prenom} pose bout à bout une planche de ${a}${NB}m et une planche de ${b}${NB}cm. Quelle longueur en tout, en cm${NB}?`,
        avant: "En tout,", objetBorne: "planche", partBorne: "morceauPlanche"};
    }
    if (degre === 2) {
      if (rng() < 0.5) {
        const a = entre(rng, 1, 3);
        const b = entre(rng, 100, 900, 100);
        return {modele: "bout", objet: "riz", prenom, a, ua: "kg", b, ub: "g", vers: "g", op: "+",
          enonce: `${prenom} achète ${a}${NB}kg de riz et ${b}${NB}g de lentilles. Quelle est la masse en tout, en g${NB}?`,
          avant: "En tout,", objetBorne: "riz", partBorne: "lentilles"};
      }
      const a = entre(rng, 1, 2);
      const b = entre(rng, 15, 30, 5);
      return {modele: "couper", objet: "jus", prenom, a, ua: "L", b, ub: "cL", vers: "cL", op: "-",
        enonce: `Une bouteille contient ${a}${NB}L de jus. ${prenom} en verse ${b}${NB}cL dans un verre. Combien de centilitres de jus reste-t-il dans la bouteille${NB}?`,
        avant: "Il reste", objetBorne: "jus", partBorne: "verre"};
    }
    if (rng() < 0.5) {
      const a = entre(rng, 2, 9);
      const b = entre(rng, 100, 1900, 100);
      return {modele: "couper", objet: "sentier", prenom, a, ua: "km", b, ub: "m", vers: "m", op: "-",
        enonce: `Un sentier mesure ${a}${NB}km. ${prenom} a déjà marché ${mes(milli(b), "m")}. Combien de mètres reste-t-il à marcher${NB}?`,
        avant: "Il reste", objetBorne: "sentier", partBorne: "marche"};
    }
    const a = entre(rng, 2, 5);
    const b = entre(rng, 110, 190, 10);
    return {modele: "couper", objet: "ruban", prenom, a, ua: "m", b, ub: "cm", vers: "cm", op: "-",
      enonce: `Un ruban mesure ${a}${NB}m. ${prenom} en coupe ${b}${NB}cm. Quelle longueur de ruban reste-t-il, en cm${NB}?`,
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

  // ============================================================== LES SÉRIES

  const PLANS = {
    valide: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3],
    entraine: [...Array(6).fill(1), ...Array(9).fill(2), ...Array(10).fill(3)],
    test: [2, 3, 3, 2],
    echauffement: [2],
    aide: [1, 2, 2]
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
        const accepte = (x, strict) => !interdits.has(base(x)) && !s.some(y => y.cle === x.cle || base(y) === base(x))
          && (!strict || !etape.accepte || etape.accepte(s, x, usage));
        const tirer = d => {
          const x = etape.tirer(rng, d, i, usage, forme);
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
            const d = degre === 3 ? 2 : degre + 1;
            const x = tirer(essai % 2 ? d : degre);
            if (x && accepte(x, false)) choisie = Object.assign(x, {degre});
          }
          if (!choisie) epuise[`v${degre}`] = true;
        }
        for (let essai = 0; essai < 50 && !choisie && usage !== "valide" && usage !== "test"; essai += 1) {
          const x = tirer(degre);
          if (x && !interdits.has(base(x)) && (!s.length || base(s[s.length - 1]) !== base(x))) choisie = x;
        }
        if (choisie) s.push(choisie);
      });
      if (s.length === degres.length && (!etape.valide || etape.valide(s, usage))) return s.map((x, i) => Object.assign(x, {place: i + 1}));
    }
    return [];
  }

  // Une conversion posée en phrase ou en nombre (la forme imposée).
  // (« objet » s'affiche comme une phrase : sa forme reste « phrase ».)
  function reformer(x, forme) {
    if (x.donnees.type !== "conv" || (x.forme === forme && forme !== "objet")) return x;
    const d = x.donnees;
    const {texte, morceaux} = ecrireConversion(forme, milli(d.valeur), d.de, d.vers);
    return Object.assign(x, {forme: forme === "nombre" ? "nombre" : "phrase", texte, morceaux});
  }

  // ---------------------------------------------------------- la vérification

  // saisie : un texte (nombre, phrase), deux textes (deux-cases), ou la
  // place du choix touché (qcm, vrai-faux).
  function verifier(question, saisie) {
    if (!question) return {juste: false, erreur: null, retour: null};
    if (question.forme === "qcm" || question.forme === "vrai-faux") {
      return {juste: Number(saisie) === question.bon, erreur: null, retour: null};
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
    dansBornes,
    PLANS
  });
});
