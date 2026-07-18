// Logique de manipulation ÉquaSplat — version 1, BROUILLON.
//
// Le cerveau du Splat d'équations à DEUX PLATEAUX, refait proprement
// d'après les outils historiques (outils/equasplat.html et
// outils/equasplat_import_splat.html) : des taches qui cachent
// l'inconnue, des jetons numériques, et l'équation qui suit chaque
// geste, prête pour l'objet rédaction.
//
// Tout est PUR : un état entre, un état sort, aucune touche au
// navigateur — donc tout est testable. Le dessin est l'affaire de
// plateaux-splat.js, l'interface celle de l'Atelier.
//
// Conventions reprises verbatim des outils :
// - deux univers : « positif » (constantes et solution positives) et
//   « relatif » (jetons verts/rouges, paires nulles) ;
// - taches opposées (−x, violettes) : option du Splat relatif ;
// - certaines actions RÉÉCRIVENT la ligne d'équation courante
//   (décomposer, regrouper, fusionner : l'écriture change, pas
//   l'équation), d'autres AJOUTENT une ligne (enlever, ajouter aux
//   deux membres, prendre l'opposé, partager, paire nulle, conclure) ;
// - les opérations « aux deux membres » portent une annotation pour la
//   rédaction : « −5 », « +x », « ×(−1) », « :3 » ;
// - c'est TOUJOURS l'utilisateur qui donne la réponse (somme d'un
//   regroupement, résultat d'une fusion, décomposition) — SAUF les
//   partages, proposés en clic parmi les diviseurs ;
// - l'import Splat Équations est intégré ici : le format d'URL de
//   l'ancien fichier « _import » est lu par importerCharge().

export const VERSION_EQUASPLAT_LOGIQUE = 1;

export const MODES_ACTION = [
  "decomposer",
  "regrouper",
  "partager",
  "enlever",
  "paquets",
];

const MAX_HISTORIQUE = 80;
const MAX_TACHES = 16;
const MAX_PIECES = 80;

const clone = (valeur) => JSON.parse(JSON.stringify(valeur));

/** Une tache (inconnue). signe −1 = tache opposée (violette). */
export function creerTache(signe = 1) {
  return { type: "tache", signe: signe < 0 ? -1 : 1 };
}

/** Un jeton numérique. `unitaire` = petite bille de 1 (mode primaire). */
export function creerJeton(valeur, { unitaire = false } = {}) {
  return { type: "jeton", valeur: Number(valeur), ...(unitaire ? { unitaire: true } : {}) };
}

const active = (piece) => piece.etat !== "supprime";
const signeTache = (piece) => (piece && piece.signe === -1 ? -1 : 1);

/** « −7 » avec le vrai signe moins, « 12 » sinon. */
export function nombreSigne(valeur) {
  const v = Number(valeur) || 0;
  return v < 0 ? `−${Math.abs(v)}` : String(v);
}

function lettreAffichee(etat) {
  return etat.affichageInconnue === "question" ? "?" : etat.lettre;
}

function termeX(coef, etat) {
  const v = lettreAffichee(etat);
  const affiche = (n) => (etat.affichageInconnue === "question" ? `${n} × ${v}` : `${n}${v}`);
  if (coef === 1) return v;
  if (coef === -1) return `−${v}`;
  if (coef < 0) return `−${affiche(Math.abs(coef))}`;
  return affiche(coef);
}

function termeNombre(valeur, etat) {
  const v = Number(valeur) || 0;
  if (v < 0) {
    return etat.ecriture === "simplifiee" ? `−${Math.abs(v)}` : `(−${Math.abs(v)})`;
  }
  return String(v);
}

function joindreTermes(termes, etat) {
  if (!termes.length) return "0";
  if (etat.ecriture !== "simplifiee") return termes.join(" + ");
  let expression = "";
  for (const terme of termes) {
    if (!terme) continue;
    if (!expression) expression = terme;
    else if (terme.startsWith("−")) expression += ` − ${terme.slice(1)}`;
    else expression += ` + ${terme}`;
  }
  return expression || "0";
}

function piecesActives(etat, cote) {
  return etat[cote].filter(active);
}

// Quand un membre ne contient que des nombres et l'autre l'inconnue,
// le terme égal à la quantité d'en face est écrit EN DERNIER :
// « x + 5 = 5 + 45 » devient « x + 5 = 45 + 5 » — le terme à enlever
// se lit en bout de ligne (port de piecesForEquationDisplay).
function constanteCibleDuCote(etat, cote) {
  const autre = cote === "gauche" ? "droite" : "gauche";
  const pieces = piecesActives(etat, cote).filter(
    (p) => !(p.type === "jeton" && Number(p.valeur) === 0),
  );
  const piecesAutre = piecesActives(etat, autre).filter(
    (p) => !(p.type === "jeton" && Number(p.valeur) === 0),
  );
  const aDesTaches = pieces.some((p) => p.type === "tache");
  const autreADesTaches = piecesAutre.some((p) => p.type === "tache");
  if (aDesTaches || !autreADesTaches) return null;
  const jetons = pieces.filter((p) => p.type === "jeton");
  const jetonsAutre = piecesAutre.filter((p) => p.type === "jeton");
  if (jetons.length < 2 || jetonsAutre.length === 0) return null;
  const cible = jetonsAutre.reduce((s, p) => s + Number(p.valeur || 0), 0);
  return cible === 0 ? null : cible;
}

function piecesPourEcriture(etat, cote, pieces) {
  const cible = constanteCibleDuCote(etat, cote);
  if (cible === null) return pieces;
  const indice = pieces.findIndex((p) => p.type === "jeton" && Number(p.valeur) === cible);
  if (indice < 0 || indice === pieces.length - 1) return pieces;
  const ordonnees = pieces.slice();
  const [jeton] = ordonnees.splice(indice, 1);
  ordonnees.push(jeton);
  return ordonnees;
}

/**
 * Écrit un membre : « 2x + 4 », « x + (−3) », « 3 − 4 » (simplifiée)…
 * Les taches d'un même signe se regroupent ; dès que des taches
 * opposées cohabitent dans le membre, on ne les simplifie PAS (c'est
 * à l'élève de faire la paire nulle) : seules les séries consécutives
 * de même signe se comptent ensemble. Les billes unitaires s'écrivent
 * en un seul nombre (leur somme).
 */
export function texteDuCote(etat, cote) {
  const pieces = piecesPourEcriture(
    etat,
    cote,
    piecesActives(etat, cote).filter((p) => !(p.type === "jeton" && Number(p.valeur) === 0)),
  );
  const taches = pieces.filter((p) => p.type === "tache");
  const signes = new Set(taches.map(signeTache));
  const sommeBilles = pieces
    .filter((p) => p.type === "jeton" && p.unitaire)
    .reduce((s, p) => s + Number(p.valeur || 0), 0);

  const termes = [];
  let billesFaites = false;

  if (signes.size <= 1) {
    let tachesFaites = false;
    for (const p of pieces) {
      if (p.type === "tache") {
        if (!tachesFaites) {
          const coef = taches.reduce((s, t) => s + signeTache(t), 0);
          if (coef !== 0) termes.push(termeX(coef, etat));
          tachesFaites = true;
        }
      } else if (p.unitaire) {
        if (!billesFaites) {
          if (sommeBilles !== 0) termes.push(termeNombre(sommeBilles, etat));
          billesFaites = true;
        }
      } else {
        termes.push(termeNombre(p.valeur, etat));
      }
    }
    return joindreTermes(termes, etat);
  }

  let i = 0;
  while (i < pieces.length) {
    const p = pieces[i];
    if (p.type === "tache") {
      const signe = signeTache(p);
      let compte = 0;
      while (i < pieces.length && pieces[i].type === "tache" && signeTache(pieces[i]) === signe) {
        compte++;
        i++;
      }
      const coef = signe * compte;
      if (coef !== 0) termes.push(termeX(coef, etat));
    } else if (p.unitaire) {
      if (!billesFaites) {
        if (sommeBilles !== 0) termes.push(termeNombre(sommeBilles, etat));
        billesFaites = true;
      }
      i++;
    } else {
      termes.push(termeNombre(p.valeur, etat));
      i++;
    }
  }
  return joindreTermes(termes, etat);
}

/**
 * La situation de conclusion : un membre ne porte que des jetons de
 * MÊME valeur, l'autre autant de taches POSITIVES — « 3x = 3 × 4 ».
 * Avec des taches opposées il n'y a pas de raccourci −x = n → x = −n :
 * l'élève passe d'abord par « prendre l'opposé ».
 */
export function infoConclusion(etat) {
  const gauche = piecesActives(etat, "gauche").filter(
    (p) => !(p.type === "jeton" && Number(p.valeur) === 0),
  );
  const droite = piecesActives(etat, "droite").filter(
    (p) => !(p.type === "jeton" && Number(p.valeur) === 0),
  );
  if (gauche.length === 0 || droite.length === 0) return null;
  const queJetons = (arr) => arr.every((p) => p.type === "jeton");
  const queTachesPositives = (arr) =>
    arr.length > 0 && arr.every((p) => p.type === "tache" && signeTache(p) > 0);
  const memeValeur = (arr) => queJetons(arr) && arr.every((p) => p.valeur === arr[0].valeur);

  if (memeValeur(gauche) && queTachesPositives(droite) && droite.length === gauche.length) {
    return { valeur: gauche[0].valeur, nombre: droite.length, coteTaches: "droite", coteJetons: "gauche" };
  }
  if (memeValeur(droite) && queTachesPositives(gauche) && gauche.length === droite.length) {
    return { valeur: droite[0].valeur, nombre: gauche.length, coteTaches: "gauche", coteJetons: "droite" };
  }
  return null;
}

function produitDeConclusion(info, etat) {
  const facteur =
    Number(info.valeur) < 0 ? `(−${Math.abs(info.valeur)})` : String(info.valeur);
  return `${info.nombre} × ${facteur}`;
}

/** L'équation courante, telle qu'elle s'écrit dans la rédaction. */
export function texteEquation(etat) {
  const info = infoConclusion(etat);
  if (info && (info.nombre === 1 || etat.conclusionFaite)) {
    const inconnue = lettreAffichee(etat);
    const valeur = nombreSigne(info.valeur);
    return info.coteTaches === "gauche" ? `${inconnue} = ${valeur}` : `${valeur} = ${inconnue}`;
  }
  if (info) {
    const gauche = info.coteTaches === "gauche" ? termeX(info.nombre, etat) : produitDeConclusion(info, etat);
    const droite = info.coteTaches === "droite" ? termeX(info.nombre, etat) : produitDeConclusion(info, etat);
    return `${gauche} = ${droite}`;
  }
  return `${texteDuCote(etat, "gauche")} = ${texteDuCote(etat, "droite")}`;
}

/** L'équation est-elle résolue (une tache seule face à sa valeur) ? */
export function estResolue(etat) {
  if (etat.conclusionFaite) return true; // conclusion posée (dont paquets justes)
  const info = infoConclusion(etat);
  return Boolean(info && info.nombre === 1);
}

function memoriser(etat) {
  etat.pileAnnulation.push(
    clone({
      gauche: etat.gauche,
      droite: etat.droite,
      historique: etat.historique,
      conclusionFaite: etat.conclusionFaite,
      paquets: etat.paquets,
    }),
  );
  if (etat.pileAnnulation.length > MAX_HISTORIQUE) etat.pileAnnulation.shift();
}

// Nouvelle ligne d'équation (si elle change), avec son annotation.
function pousserEtape(etat, operation = null) {
  const equation = texteEquation(etat);
  const derniere = etat.historique[etat.historique.length - 1];
  if (!derniere || derniere.equation !== equation) {
    etat.historique.push({ equation, ...(operation ? { operation } : {}) });
    if (etat.historique.length > MAX_HISTORIQUE) etat.historique.shift();
  }
}

// L'écriture change, pas l'équation : on réécrit la ligne courante.
function reecrireEtapeCourante(etat) {
  const equation = texteEquation(etat);
  if (!etat.historique.length) etat.historique.push({ equation });
  else etat.historique[etat.historique.length - 1].equation = equation;
}

/* ————— Le parseur d'équation ————— */

function normaliserLettres(texte) {
  const table = {
    "𝑎": "a", "𝑏": "b", "𝑐": "c", "𝑑": "d", "𝑒": "e", "𝑓": "f", "𝑔": "g", "ℎ": "h",
    "𝑖": "i", "𝑗": "j", "𝑘": "k", "𝑙": "l", "𝑚": "m", "𝑛": "n", "𝑜": "o", "𝑝": "p",
    "𝑞": "q", "𝑟": "r", "𝑠": "s", "𝑡": "t", "𝑢": "u", "𝑣": "v", "𝑤": "w", "𝑥": "x",
    "𝑦": "y", "𝑧": "z",
  };
  return String(texte || "").replace(/[\u{1D44E}-\u{1D467}ℎ]/gu, (c) => table[c] || c);
}

function analyserMembre(brut, nomCote, contexte) {
  let compact = normaliserLettres(brut)
    .replace(/[×·*]/g, "*")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "");
  if (!compact) throw new Error(`Le membre ${nomCote} est vide.`);
  if (/[(),;/]/.test(compact)) {
    throw new Error("Utilise seulement des sommes simples : par exemple 2x + 4 = 18.");
  }
  if (/[.]/.test(compact)) {
    throw new Error("Les décimaux ne sont pas acceptés ici : utilise seulement des entiers.");
  }
  if (!/^[0-9a-zA-Z+*-]+$/.test(compact)) {
    throw new Error("Caractère non reconnu. Utilise des entiers, une lettre, +, − et ×.");
  }
  if (!/^[+-]/.test(compact)) compact = "+" + compact;

  const morceaux = [...compact.matchAll(/([+-])([^+-]+)/g)];
  if (!morceaux.length || morceaux.map((m) => m[0]).join("") !== compact) {
    throw new Error(`Expression non reconnue dans le membre ${nomCote}.`);
  }

  let coef = 0;
  let constante = 0;
  const pieces = [];
  for (const m of morceaux) {
    const signe = m[1] === "-" ? -1 : 1;
    const terme = m[2];
    if (!terme) throw new Error(`Il manque un terme dans le membre ${nomCote}.`);
    const lettres = terme.match(/[a-zA-Z]/g) || [];
    if (lettres.length > 1) throw new Error("Un terme ne doit contenir qu'une seule inconnue.");
    if (lettres.length === 1) {
      const lettre = lettres[0].toLowerCase();
      if (contexte.lettre && contexte.lettre !== lettre) {
        throw new Error("Utilise une seule lettre inconnue dans toute l'équation.");
      }
      contexte.lettre = lettre;
      const brutCoef = terme.replace(/[a-zA-Z*]/g, "");
      const n = brutCoef === "" ? 1 : Number(brutCoef);
      if (!Number.isInteger(n)) throw new Error(`Coefficient non reconnu dans le membre ${nomCote}.`);
      const coefSigne = signe * n;
      coef += coefSigne;
      if (coefSigne !== 0) pieces.push({ type: "tache", coef: coefSigne });
    } else {
      if (terme.includes("*")) {
        throw new Error(`Produit numérique inutile dans le membre ${nomCote}. Écris directement le résultat.`);
      }
      const n = Number(terme);
      if (!Number.isInteger(n)) throw new Error(`Nombre non reconnu dans le membre ${nomCote}.`);
      const valeur = signe * n;
      constante += valeur;
      if (valeur !== 0) pieces.push({ type: "jeton", valeur });
    }
  }
  return { coef, constante, pieces };
}

/**
 * Analyse une équation ÉquaSplat, avec les garde-fous de l'outil.
 * @param {string} texte — ex. « 3 + 2x + 4 = 18 + x »
 * @param {object} [options]
 * @param {"positif"|"relatif"} [options.univers]
 * @param {boolean} [options.tachesOpposees]
 */
export function analyserEquationSplat(texte, { univers = "positif", tachesOpposees = false } = {}) {
  const original = String(texte || "").trim();
  if (!original) throw new Error("Écris une équation à construire.");
  const membres = normaliserLettres(original).replace(/[−–—]/g, "-").split("=");
  if (membres.length !== 2) throw new Error("Il faut exactement un signe égal.");

  const contexte = { lettre: null };
  const gauche = analyserMembre(membres[0], "de gauche", contexte);
  const droite = analyserMembre(membres[1], "de droite", contexte);
  if (!contexte.lettre) throw new Error("Il faut une inconnue : par exemple x, n ou a.");

  const relatif = univers === "relatif";
  if (!relatif && (gauche.constante < 0 || droite.constante < 0)) {
    throw new Error(
      "En Splat positif, les constantes doivent rester positives. Passe en Splat relatif pour utiliser des nombres négatifs.",
    );
  }
  if (!(relatif && tachesOpposees) && (gauche.coef < 0 || droite.coef < 0)) {
    throw new Error("Pour construire une équation avec −x, choisis Splat relatif puis active les taches opposées.");
  }
  if (Math.abs(gauche.coef) + Math.abs(droite.coef) > MAX_TACHES) {
    throw new Error("Cette équation crée trop de taches pour rester lisible.");
  }
  if (gauche.pieces.length + droite.pieces.length > MAX_PIECES) {
    throw new Error("Cette équation crée trop d'objets pour rester lisible.");
  }

  const denominateur = gauche.coef - droite.coef;
  const numerateur = droite.constante - gauche.constante;
  if (denominateur === 0) {
    throw new Error("Cette équation ne donne pas une solution unique utilisable ici.");
  }
  if (numerateur % denominateur !== 0) {
    throw new Error("Équation refusée : la solution n'est pas un nombre entier.");
  }
  const solution = numerateur / denominateur;
  if (solution === 0) {
    throw new Error("Équation refusée : la solution 0 n'est pas prise en charge dans cette version.");
  }
  if (!relatif && solution < 0) {
    throw new Error("En Splat positif, la solution doit être positive. Passe en Splat relatif pour une solution négative.");
  }

  return { gauche, droite, solution, lettre: contexte.lettre };
}

function piecesDepuisMembre(membre) {
  const pieces = [];
  for (const item of membre.pieces) {
    if (item.type === "tache") {
      const signe = item.coef < 0 ? -1 : 1;
      for (let i = 0; i < Math.abs(item.coef); i++) pieces.push(creerTache(signe));
    } else if (item.valeur !== 0) {
      // chaque terme écrit devient UN jeton : « 3 + 4 » → jetons 3 et 4
      pieces.push(creerJeton(item.valeur));
    }
  }
  return pieces;
}

/**
 * Crée l'état ÉquaSplat à partir d'une équation écrite.
 * @param {string} texte
 * @param {object} [options]
 * @param {"positif"|"relatif"} [options.univers]
 * @param {boolean} [options.tachesOpposees]
 * @param {"lettre"|"question"} [options.affichageInconnue]
 * @param {"detaillee"|"simplifiee"} [options.ecriture]
 */
export function creerEtat(texte, options = {}) {
  const {
    univers = "positif",
    tachesOpposees = false,
    affichageInconnue = "lettre",
    ecriture = "detaillee",
  } = options;
  const analyse = analyserEquationSplat(texte, { univers, tachesOpposees });
  const etat = {
    lettre: analyse.lettre,
    solution: analyse.solution,
    univers,
    tachesOpposees: univers === "relatif" && tachesOpposees,
    affichageInconnue,
    ecriture: univers === "relatif" ? ecriture : "detaillee",
    modeBilles: false,
    gauche: piecesDepuisMembre(analyse.gauche),
    droite: piecesDepuisMembre(analyse.droite),
    historique: [],
    pileAnnulation: [],
    conclusionFaite: false,
    paquets: null,
  };
  etat.historique.push({ equation: texteEquation(etat) });
  return etat;
}

/* ————— Le générateur d'équations (hasard reproductible) ————— */

function entierNonNul(generateur, min, max) {
  for (let i = 0; i < 80; i++) {
    const v = generateur.entier(min, max);
    if (v !== 0) return v;
  }
  return Math.abs(min) >= Math.abs(max) ? min : max;
}

function decouperValeur(valeur, nombre, generateur, relatif) {
  valeur = Math.round(Number(valeur) || 0);
  nombre = Math.max(1, Math.min(3, Math.round(nombre) || 1));
  if (valeur === 0 || nombre <= 1) return [valeur];

  if (relatif) {
    // un vrai petit calcul relatif : des termes positifs ET négatifs
    const extra = generateur.entier(2, 9);
    if (nombre === 2) {
      if (valeur > 0) return generateur.melange([valeur + extra, -extra]);
      return generateur.melange([valeur - extra, extra]);
    }
    if (valeur > 0) {
      const total = valeur + extra;
      const coupe = generateur.entier(1, Math.max(1, total - 1));
      return generateur.melange([coupe, total - coupe, -extra]).filter((v) => v !== 0);
    }
    const totalAbs = Math.abs(valeur - extra);
    const coupe = generateur.entier(1, Math.max(1, totalAbs - 1));
    return generateur.melange([-coupe, -(totalAbs - coupe), extra]).filter((v) => v !== 0);
  }

  const absolu = Math.abs(valeur);
  if (absolu < nombre) return [valeur];
  const coupes = [];
  for (let i = 0; i < nombre - 1; i++) coupes.push(generateur.entier(1, absolu - 1));
  coupes.sort((a, b) => a - b);
  const points = [0, ...coupes, absolu];
  const parts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const part = points[i + 1] - points[i];
    if (part > 0) parts.push(part * Math.sign(valeur));
  }
  return parts.length === nombre ? parts : [valeur];
}

function texteDuMembreGenere(coef, constante, lettre, nombreJetons, generateur, relatif) {
  const termeInconnue =
    coef !== 0 ? (coef === 1 ? lettre : coef === -1 ? `-${lettre}` : `${coef}${lettre}`) : null;
  const nombres = decouperValeur(constante, nombreJetons, generateur, relatif)
    .filter((v) => v !== 0)
    .map(String);
  const joindre = (termes) => {
    let texte = "";
    for (const t of termes) {
      if (!texte) texte = t.startsWith("-") ? `−${t.slice(1)}` : t;
      else if (t.startsWith("-")) texte += ` − ${t.slice(1)}`;
      else texte += ` + ${t}`;
    }
    return texte || "0";
  };
  if (!termeInconnue) return joindre(nombres);
  if (!nombres.length) return joindre([termeInconnue]);
  if (nombres.length >= 2) {
    // rendre la décomposition visible : « 3 + 2x + 4 = … »
    const coupe = generateur.entier(1, nombres.length - 1);
    return joindre([...nombres.slice(0, coupe), termeInconnue, ...nombres.slice(coupe)]);
  }
  return generateur.reel() < 0.5
    ? joindre([termeInconnue, ...nombres])
    : joindre([...nombres, termeInconnue]);
}

/**
 * Fabrique le texte d'une équation aléatoire, prête pour creerEtat.
 * Reproductible : même générateur (même graine), même équation.
 * @param {{entier: Function, reel: Function, melange: Function, choix: Function}} generateur
 * @param {object} [options]
 * @param {"positif"|"relatif"} [options.univers]
 * @param {boolean} [options.tachesOpposees]
 * @param {"xpb"|"axc"|"axb"|"both"|"melange"} [options.type]
 * @param {1|2|3|"melange"} [options.jetonsDepart]
 */
export function creerEquationAleatoire(generateur, options = {}, garde = 0) {
  const {
    univers = "positif",
    tachesOpposees = false,
    type = "melange",
    jetonsDepart = 1,
  } = options;
  const relatif = univers === "relatif";
  const avecOpposees = relatif && tachesOpposees;
  const nombreJetons =
    jetonsDepart === "melange" ? generateur.entier(1, 3) : Math.max(1, Math.min(3, Number(jetonsDepart) || 1));
  const types = ["xpb", "axc", "axb", "both"];
  const modeChoisi = type === "melange" ? types[generateur.entier(0, 3)] : type;
  const lettres = ["x", "n", "a", "t", "m"];
  const lettre = lettres[generateur.entier(0, lettres.length - 1)];
  const x = relatif ? entierNonNul(generateur, -10, 10) : generateur.entier(2, 12);
  const coef = (min, max) => {
    const v = generateur.entier(min, max);
    return avecOpposees && generateur.reel() < 0.35 ? -v : v;
  };

  let coefGauche = modeChoisi === "xpb" ? 1 : coef(2, 5);
  let constGauche =
    modeChoisi === "axc" ? 0 : relatif ? entierNonNul(generateur, -12, 12) : generateur.entier(Math.max(2, nombreJetons), 18);
  let coefDroite = 0;
  let constDroite = coefGauche * x + constGauche;

  if (modeChoisi === "both") {
    coefGauche = coef(3, 5);
    do {
      coefDroite = coef(1, 4);
    } while (coefDroite === coefGauche);
    constGauche = relatif ? entierNonNul(generateur, -12, 12) : generateur.entier(Math.max(2, nombreJetons), 14);
    constDroite = (coefGauche - coefDroite) * x + constGauche;
    if (relatif && constDroite === 0 && garde < 200) {
      return creerEquationAleatoire(generateur, options, garde + 1);
    }
  }

  if (!relatif && (constDroite < nombreJetons || constDroite <= 0) && garde < 200) {
    return creerEquationAleatoire(generateur, options, garde + 1);
  }

  return `${texteDuMembreGenere(coefGauche, constGauche, lettre, nombreJetons, generateur, relatif)} = ${texteDuMembreGenere(coefDroite, constDroite, lettre, nombreJetons, generateur, relatif)}`;
}

/* ————— Les actions qui RÉÉCRIVENT la ligne courante ————— */

/**
 * Décompose un jeton en une somme (l'utilisateur écrit la somme).
 * En relatif, les termes peuvent être négatifs ; la somme doit être exacte.
 */
export function decomposerJeton(etat, cote, indice, morceaux) {
  const piece = etat[cote]?.[indice];
  if (!piece || piece.type !== "jeton" || !active(piece)) {
    throw new Error("choisir un jeton encore en jeu");
  }
  if (!Array.isArray(morceaux) || morceaux.length < 2) {
    throw new Error("écrire une somme avec au moins deux termes");
  }
  if (morceaux.some((v) => !Number.isInteger(v) || v === 0)) {
    throw new Error("écrire des entiers non nuls");
  }
  if (etat.univers !== "relatif" && morceaux.some((v) => v < 0)) {
    throw new Error("en Splat positif, les termes restent positifs");
  }
  const somme = morceaux.reduce((s, v) => s + v, 0);
  if (somme !== piece.valeur) {
    throw new Error(`la somme fait ${nombreSigne(somme)}, il faut ${nombreSigne(piece.valeur)}`);
  }
  memoriser(etat);
  etat[cote].splice(indice, 1, ...morceaux.map((v) => creerJeton(v)));
  reecrireEtapeCourante(etat);
  return etat;
}

/**
 * Regroupe des jetons d'un même membre : l'utilisateur DONNE la somme.
 * @param {Array<{cote: string, indice: number}>} selection
 */
export function regrouperJetons(etat, selection, sommeProposee) {
  if (!Array.isArray(selection) || selection.length < 2) {
    throw new Error("sélectionner au moins deux jetons");
  }
  const cote = selection[0].cote;
  if (selection.some((s) => s.cote !== cote)) {
    throw new Error("regrouper seulement des jetons du même membre");
  }
  const pieces = selection.map((s) => etat[cote]?.[s.indice]);
  if (pieces.some((p) => !p || p.type !== "jeton" || !active(p))) {
    throw new Error("sélectionner des jetons encore en jeu");
  }
  const somme = pieces.reduce((s, p) => s + Number(p.valeur || 0), 0);
  if (!Number.isInteger(sommeProposee) || sommeProposee !== somme) {
    throw new Error("ce n'est pas la bonne somme — recompte et réessaie");
  }
  memoriser(etat);
  const indices = selection.map((s) => s.indice).sort((a, b) => a - b);
  const [premier] = indices;
  const coords = pieces.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const fusionne = creerJeton(somme);
  if (coords.length) {
    fusionne.x = coords.reduce((s, p) => s + p.x, 0) / coords.length;
    fusionne.y = coords.reduce((s, p) => s + p.y, 0) / coords.length;
  }
  for (const i of [...indices].reverse()) etat[cote].splice(i, 1);
  etat[cote].splice(premier, 0, fusionne);
  if (somme === 0) {
    // paire/somme nulle : le 0 disparaît du plateau (l'interface peut
    // l'animer) et l'équation gagne une ligne
    etat[cote].splice(premier, 1);
    pousserEtape(etat);
  } else {
    reecrireEtapeCourante(etat);
  }
  return etat;
}

/**
 * Fusionne deux jetons par glisser-déposer : l'utilisateur DONNE le
 * résultat. Un résultat nul fait disparaître la paire (paire nulle).
 */
export function fusionnerJetons(etat, cote, indiceSource, indiceCible, resultatPropose) {
  const source = etat[cote]?.[indiceSource];
  const cible = etat[cote]?.[indiceCible];
  if (!source || !cible || indiceSource === indiceCible) {
    throw new Error("choisir deux jetons différents");
  }
  if (source.type !== "jeton" || cible.type !== "jeton" || !active(source) || !active(cible)) {
    throw new Error("choisir deux jetons encore en jeu");
  }
  const attendu = Number(cible.valeur) + Number(source.valeur);
  if (!Number.isInteger(resultatPropose) || resultatPropose !== attendu) {
    throw new Error("ce n'est pas encore le bon résultat");
  }
  memoriser(etat);
  const fusionne = creerJeton(attendu);
  const sx = Number.isFinite(source.x) ? source.x : null;
  const tx = Number.isFinite(cible.x) ? cible.x : null;
  const sy = Number.isFinite(source.y) ? source.y : null;
  const ty = Number.isFinite(cible.y) ? cible.y : null;
  fusionne.x = sx !== null && tx !== null ? (sx + tx) / 2 : sx !== null ? sx : tx ?? undefined;
  fusionne.y = sy !== null && ty !== null ? (sy + ty) / 2 : sy !== null ? sy : ty ?? undefined;
  const premier = Math.min(indiceSource, indiceCible);
  for (const i of [indiceSource, indiceCible].sort((a, b) => b - a)) etat[cote].splice(i, 1);
  if (attendu === 0) {
    pousserEtape(etat);
  } else {
    etat[cote].splice(premier, 0, fusionne);
    reecrireEtapeCourante(etat);
  }
  return etat;
}

/* ————— Les actions qui AJOUTENT une ligne d'équation ————— */

/** Partage un jeton en n parts égales (choix proposé en clic). */
export function partagerJeton(etat, cote, indice, parts) {
  const piece = etat[cote]?.[indice];
  if (!piece || piece.type !== "jeton" || !active(piece)) {
    throw new Error("choisir un jeton encore en jeu");
  }
  if (!Number.isInteger(parts) || parts < 2) throw new Error("au moins deux parts");
  if (piece.valeur % parts !== 0) {
    throw new Error(`${nombreSigne(piece.valeur)} n'est pas partageable en ${parts} parts entières égales`);
  }
  memoriser(etat);
  etat[cote].splice(
    indice,
    1,
    ...Array.from({ length: parts }, () => creerJeton(piece.valeur / parts)),
  );
  // le produit « n × v » apparaît ; la division « :n » sera notée à la conclusion
  pousserEtape(etat);
  return etat;
}

/** Bilan d'une sélection pour « enlever dans chaque membre ». */
export function infoSuppression(etat, selection) {
  const parCote = { gauche: [], droite: [] };
  for (const s of selection || []) {
    const piece = etat[s.cote]?.[s.indice];
    if (piece && active(piece)) parCote[s.cote].push(piece);
  }
  const { gauche, droite } = parCote;

  // paire nulle x / −x dans UN SEUL membre (taches opposées actives)
  const seul = gauche.length ? gauche : droite;
  const coteSeul = gauche.length ? "gauche" : droite.length ? "droite" : null;
  if (
    etat.tachesOpposees &&
    coteSeul &&
    !(gauche.length && droite.length) &&
    seul.length >= 2 &&
    seul.every((p) => p.type === "tache")
  ) {
    const coefficient = seul.reduce((s, p) => s + signeTache(p), 0);
    if (coefficient === 0) return { ok: true, genre: "paireNulle", cote: coteSeul };
  }

  if (!gauche.length || !droite.length) return { ok: false, raison: "unSeulCote" };
  const toutes = gauche.concat(droite);
  const type = toutes[0].type;
  if (toutes.some((p) => p.type !== type)) return { ok: false, raison: "typesMelanges" };
  if (type === "tache") {
    const coefGauche = gauche.reduce((s, p) => s + signeTache(p), 0);
    const coefDroite = droite.reduce((s, p) => s + signeTache(p), 0);
    if (coefGauche !== coefDroite) return { ok: false, raison: "tachesDifferentes" };
    if (coefGauche === 0) return { ok: false, raison: "selectionNulle" };
    return { ok: true, genre: "taches", coefficient: coefGauche };
  }
  const sommeGauche = gauche.reduce((s, p) => s + Number(p.valeur || 0), 0);
  const sommeDroite = droite.reduce((s, p) => s + Number(p.valeur || 0), 0);
  if (sommeGauche !== sommeDroite) return { ok: false, raison: "sommesDifferentes" };
  return { ok: true, genre: "jetons", somme: sommeGauche };
}

function operationSoustraction(etat, info) {
  if (info.genre === "taches") {
    const coefficient = -info.coefficient;
    const abs = Math.abs(coefficient);
    const corps = abs === 1 ? lettreAffichee(etat) : `${abs}${lettreAffichee(etat)}`;
    return coefficient < 0 ? `−${corps}` : `+${corps}`;
  }
  const valeur = -info.somme;
  return valeur < 0 ? `−${Math.abs(valeur)}` : `+${valeur}`;
}

/**
 * Enlève la même quantité dans chaque membre — ou annule une paire
 * nulle x / −x dans un seul membre. Note l'opération pour la rédaction.
 */
export function enleverSelection(etat, selection) {
  const info = infoSuppression(etat, selection);
  if (!info.ok) {
    const messages = {
      unSeulCote: "sélectionner la même quantité dans les deux membres",
      typesMelanges: "ne pas mélanger taches et jetons numériques",
      tachesDifferentes: "les taches sélectionnées ne représentent pas la même quantité d'inconnues",
      selectionNulle: "pour annuler une paire nulle, sélectionner les taches x et −x dans un seul membre",
      sommesDifferentes: "les jetons sélectionnés ne font pas la même somme",
    };
    throw new Error(messages[info.raison] || "sélection impossible à enlever");
  }
  memoriser(etat);
  for (const s of selection) {
    const piece = etat[s.cote]?.[s.indice];
    if (piece) piece.etat = "supprime";
  }
  if (info.genre === "paireNulle") pousserEtape(etat);
  else pousserEtape(etat, operationSoustraction(etat, info));
  return etat;
}

/** Bilan d'une sélection de taches pour la paire nulle en mode Regrouper. */
export function infoPaireNulle(etat, selection) {
  if (!etat.tachesOpposees) return { ok: false, raison: "opposeesInactives" };
  if (!Array.isArray(selection) || selection.length < 2) return { ok: false, raison: "pasAssez" };
  const cote = selection[0].cote;
  if (selection.some((s) => s.cote !== cote)) return { ok: false, raison: "cotesDifferents" };
  const pieces = selection.map((s) => etat[cote]?.[s.indice]);
  if (pieces.some((p) => !p || p.type !== "tache" || !active(p))) {
    return { ok: false, raison: "pasQueDesTaches" };
  }
  const coefficient = pieces.reduce((s, p) => s + signeTache(p), 0);
  if (coefficient !== 0) return { ok: false, raison: "sommeNonNulle" };
  return { ok: true, cote };
}

/** Regroupe une paire nulle de taches : x + (−x) = 0, elles disparaissent. */
export function annulerPaireTaches(etat, selection) {
  const info = infoPaireNulle(etat, selection);
  if (!info.ok) throw new Error("sélectionner autant de taches x que de taches −x dans un même membre");
  memoriser(etat);
  const indices = selection.map((s) => s.indice).sort((a, b) => b - a);
  for (const i of indices) etat[info.cote].splice(i, 1);
  pousserEtape(etat);
  return etat;
}

/** Ajoute le même jeton dans chaque membre (opération « +n » / « −n »). */
export function ajouterAuxDeuxMembres(etat, valeur) {
  if (!Number.isInteger(valeur) || valeur === 0) {
    throw new Error("écrire un entier non nul");
  }
  if (etat.univers !== "relatif" && valeur < 0) {
    throw new Error("dans Splat positif, on n'ajoute que des jetons positifs");
  }
  memoriser(etat);
  etat.gauche.push(creerJeton(valeur));
  etat.droite.push(creerJeton(valeur));
  pousserEtape(etat, valeur < 0 ? `−${Math.abs(valeur)}` : `+${valeur}`);
  return etat;
}

/** Ajoute les mêmes taches (±x) dans chaque membre. */
export function ajouterTachesAuxDeuxMembres(etat, signe, nombre = 1) {
  if (!etat.tachesOpposees) {
    throw new Error("activer les taches opposées pour ajouter des taches");
  }
  if (!Number.isInteger(nombre) || nombre < 1 || nombre > 8) {
    throw new Error("choisir un nombre de taches entre 1 et 8");
  }
  memoriser(etat);
  const s = signe < 0 ? -1 : 1;
  for (let i = 0; i < nombre; i++) {
    etat.gauche.push(creerTache(s));
    etat.droite.push(creerTache(s));
  }
  const coefficient = s * nombre;
  const abs = Math.abs(coefficient);
  const corps = abs === 1 ? lettreAffichee(etat) : `${abs}${lettreAffichee(etat)}`;
  pousserEtape(etat, coefficient < 0 ? `−${corps}` : `+${corps}`);
  return etat;
}

/** Prend l'opposé de chaque membre (opération « ×(−1) »). */
export function prendreLOppose(etat) {
  if (!etat.tachesOpposees) {
    throw new Error("activer les taches opposées pour prendre l'opposé");
  }
  memoriser(etat);
  for (const cote of ["gauche", "droite"]) {
    for (const piece of etat[cote]) {
      if (!active(piece)) continue;
      if (piece.type === "jeton") piece.valeur = -Number(piece.valeur || 0);
      else piece.signe = -signeTache(piece);
    }
  }
  pousserEtape(etat, "×(−1)");
  return etat;
}

/**
 * Conclut : « 3x = 3 × 4 » devient « x = 4 ». La division des deux
 * membres est notée ici (« :3 »), pas au moment du partage — verbatim
 * de l'outil. Le plateau se simplifie : une tache face à un jeton.
 */
export function conclure(etat) {
  const info = infoConclusion(etat);
  if (!info) throw new Error("le plateau ne montre pas encore la valeur d'une tache");
  if (etat.conclusionFaite || info.nombre === 1) return etat;
  memoriser(etat);
  const tache = creerTache(1);
  const jeton = creerJeton(info.valeur);
  if (info.coteTaches === "gauche") {
    etat.gauche = [tache];
    etat.droite = [jeton];
  } else {
    etat.gauche = [jeton];
    etat.droite = [tache];
  }
  etat.conclusionFaite = true;
  pousserEtape(etat, `:${info.nombre}`);
  return etat;
}

/* ————— Aides (propositions, diviseurs, occasions) ————— */

/** Diviseurs utiles pour « partager équitablement » (2 à 8 parts). */
export function diviseursDe(valeur) {
  const n = Math.abs(Math.round(Number(valeur) || 0));
  const diviseurs = [];
  for (let d = 2; d <= 8; d++) if (n % d === 0 && n / d >= 1) diviseurs.push(d);
  return diviseurs;
}

/**
 * Les propositions de décomposition « intelligentes » de l'outil :
 * d'abord faire apparaître la quantité de l'autre membre (pour pouvoir
 * l'enlever ensuite), puis les partages utiles, puis les partages
 * simples et 1 + reste.
 */
export function propositionsDecomposition(etat, cote, indice) {
  const piece = etat[cote]?.[indice];
  if (!piece || piece.type !== "jeton") return [];
  const valeur = Number(piece.valeur);
  const autre = cote === "gauche" ? "droite" : "gauche";
  const propositions = [];

  const jetonsAutre = piecesActives(etat, autre).filter((p) => p.type === "jeton");
  const cibles = [];
  for (const j of jetonsAutre) {
    const v = Number(j.valeur);
    if (Number.isFinite(v) && v > 0) cibles.push(v);
  }
  const sommeAutre = jetonsAutre.reduce((s, p) => s + Number(p.valeur || 0), 0);
  if (sommeAutre > 0) cibles.push(sommeAutre);
  for (const cible of cibles) {
    if (cible > 0 && cible < valeur) propositions.push([cible, valeur - cible]);
  }

  const gauche = piecesActives(etat, "gauche");
  const droite = piecesActives(etat, "droite");
  const tachesGauche = gauche.filter((p) => p.type === "tache").length;
  const tachesDroite = droite.filter((p) => p.type === "tache").length;
  const jetonsGauche = gauche.filter((p) => p.type === "jeton").length;
  const jetonsDroite = droite.filter((p) => p.type === "jeton").length;
  const partsUtiles =
    cote === "droite" && tachesDroite === 0 && jetonsGauche === 0 && tachesGauche >= 2
      ? tachesGauche
      : cote === "gauche" && tachesGauche === 0 && jetonsDroite === 0 && tachesDroite >= 2
        ? tachesDroite
        : 0;
  if (partsUtiles >= 2 && valeur % partsUtiles === 0) {
    propositions.push(Array.from({ length: partsUtiles }, () => valeur / partsUtiles));
  }

  for (let n = 2; n <= 6; n++) {
    if (valeur % n === 0) propositions.push(Array.from({ length: n }, () => valeur / n));
  }
  if (valeur > 3) propositions.push([1, valeur - 1]);
  if (valeur > 5) propositions.push([2, valeur - 2]);

  const uniques = [];
  const vues = new Set();
  for (const p of propositions) {
    if (!Array.isArray(p) || p.length < 2) continue;
    if (p.some((v) => !Number.isFinite(v) || v <= 0)) continue;
    if (p.reduce((a, b) => a + b, 0) !== valeur) continue;
    const cle = p.join("+");
    if (!vues.has(cle)) {
      vues.add(cle);
      uniques.push(p);
    }
  }
  return uniques.slice(0, 8);
}

/**
 * L'occasion de partage : un seul jeton face à plusieurs taches de
 * même signe, divisible par leur nombre.
 */
export function occasionPartage(etat) {
  for (const [coteJetons, coteTaches] of [["droite", "gauche"], ["gauche", "droite"]]) {
    const jetons = piecesActives(etat, coteJetons).filter((p) => p.type === "jeton");
    const taches = piecesActives(etat, coteTaches).filter((p) => p.type === "tache");
    const autresJetons = piecesActives(etat, coteTaches).filter((p) => p.type === "jeton");
    const autresTaches = piecesActives(etat, coteJetons).filter((p) => p.type === "tache");
    if (
      jetons.length === 1 &&
      autresTaches.length === 0 &&
      autresJetons.length === 0 &&
      taches.length >= 2 &&
      taches.every((p) => signeTache(p) === signeTache(taches[0]))
    ) {
      const valeur = Number(jetons[0].valeur);
      if (valeur % taches.length === 0) {
        return {
          coteJetons,
          coteTaches,
          indice: etat[coteJetons].indexOf(jetons[0]),
          valeur,
          parts: taches.length,
          resultat: valeur / taches.length,
        };
      }
    }
  }
  return null;
}

/* ————— Le mode billes (import du Splat primaire) et ses paquets ————— */

function queTachesPositives(pieces) {
  return pieces.length > 0 && pieces.every((p) => p.type === "tache" && signeTache(p) > 0);
}

function queBillesUnitaires(pieces) {
  return (
    pieces.length > 0 && pieces.every((p) => p.type === "jeton" && p.unitaire && Number(p.valeur) === 1)
  );
}

/**
 * L'occasion de faire des paquets : plusieurs taches d'un côté, rien
 * que des billes de l'autre. Renvoie les choix (tous les diviseurs).
 */
export function occasionPaquets(etat) {
  if (!etat.modeBilles) return null;
  const gauche = piecesActives(etat, "gauche");
  const droite = piecesActives(etat, "droite");
  const construire = (coteTaches, coteBilles, taches, billes) => {
    if (taches.length <= 1 || billes.length <= 0) return null;
    const choix = [];
    for (let d = 1; d <= billes.length; d++) {
      if (billes.length % d === 0) choix.push({ nombrePaquets: d, parPaquet: billes.length / d });
    }
    return { coteTaches, coteBilles, nombreTaches: taches.length, nombreBilles: billes.length, choix };
  };
  if (queTachesPositives(gauche) && queBillesUnitaires(droite)) {
    return construire("gauche", "droite", gauche, droite);
  }
  if (queBillesUnitaires(gauche) && queTachesPositives(droite)) {
    return construire("droite", "gauche", droite, gauche);
  }
  return null;
}

/**
 * Range les billes en paquets. Si le nombre de paquets égale le nombre
 * de taches, le partage est juste et la conclusion s'écrit (« x = n »).
 * Un partage faux reste posé (l'élève le voit), sans conclusion.
 */
export function faireDesPaquets(etat, nombrePaquets) {
  const situation = occasionPaquets(etat);
  nombrePaquets = Math.round(Number(nombrePaquets) || 0);
  if (!situation || nombrePaquets <= 0 || situation.nombreBilles % nombrePaquets !== 0) {
    throw new Error("choisir un partage possible des jetons");
  }
  memoriser(etat);
  const parPaquet = situation.nombreBilles / nombrePaquets;
  const correct = nombrePaquets === situation.nombreTaches;
  etat.paquets = {
    cote: situation.coteBilles,
    nombrePaquets,
    parPaquet,
    nombreTaches: situation.nombreTaches,
    correct,
  };
  if (correct) {
    const equation = `${lettreAffichee(etat)} = ${parPaquet}`;
    const derniere = etat.historique[etat.historique.length - 1];
    if (!derniere || derniere.equation !== equation) {
      etat.historique.push({ equation, operation: `:${nombrePaquets}` });
    }
    etat.conclusionFaite = true;
  }
  return etat;
}

/* ————— L'import Splat Équations (l'ancien fichier « _import ») ————— */

function normaliserPieceImportee(brut) {
  if (brut == null) return null;
  if (typeof brut === "number") return creerJeton(brut);
  if (typeof brut === "string") {
    const s = normaliserLettres(brut.trim().toLowerCase());
    if (s === "x" || s === "?") return creerTache(1);
    if (s === "-x" || s === "−x") return creerTache(-1);
    const n = Number(s.replace(",", ".").replace("−", "-"));
    return Number.isFinite(n) ? creerJeton(n) : null;
  }
  if (typeof brut === "object") {
    const type = String(brut.type || brut.kind || "").toLowerCase();
    const signe = Number(brut.sign) < 0 || brut.opposed === true || brut.negative === true ? -1 : 1;
    if (type === "x" || type === "unknown" || type === "variable") return creerTache(signe);
    if (["number", "token", "const", "constant", "v"].includes(type)) {
      const n = Number(brut.value);
      if (!Number.isFinite(n)) return null;
      return creerJeton(n, { unitaire: brut.unit === true || brut.unit === "true" });
    }
  }
  return null;
}

function normaliserCoteImporte(liste, modeBilles) {
  if (!Array.isArray(liste)) return [];
  const pieces = [];
  for (const brut of liste) {
    // au-delà du plafond, inutile de continuer : l'import sera refusé
    if (pieces.length > MAX_PIECES) break;
    const piece = normaliserPieceImportee(brut);
    if (!piece) continue;
    if (piece.type === "jeton" && Number(piece.valeur) === 0) continue;
    if (modeBilles && piece.type === "jeton" && !piece.unitaire) {
      const n = Number(piece.valeur);
      if (n > 0 && Number.isInteger(n) && n <= MAX_PIECES) {
        for (let i = 0; i < n && pieces.length <= MAX_PIECES; i++) {
          pieces.push(creerJeton(1, { unitaire: true }));
        }
        continue;
      }
    }
    pieces.push(piece);
  }
  return pieces;
}

function bilanCote(pieces) {
  return pieces.reduce(
    (acc, p) => {
      if (p.type === "tache") acc.x += signeTache(p);
      else acc.n += Number(p.valeur) || 0;
      return acc;
    },
    { x: 0, n: 0 },
  );
}

/**
 * Crée l'état depuis une charge utile Splat Équations — le format que
 * l'ancien fichier « equasplat_import_splat » lisait dans l'URL :
 * { source, variable, unknownDisplay, universe, numberMode,
 *   signedWritingMode, x, left/top, right/bottom }.
 */
export function importerCharge(charge) {
  if (!charge || typeof charge !== "object") {
    throw new Error("impossible de lire l'équation importée");
  }
  const lettre = normaliserLettres(
    typeof charge.variable === "string" && charge.variable.trim() ? charge.variable.trim() : "x",
  )
    .toLowerCase()
    .replace(/[^a-z]/g, "")[0] || "x";
  const affichageBrut = String(charge.unknownDisplay || charge.display || "letter").toLowerCase();
  const affichageInconnue = ["question", "?", "interrogation"].includes(affichageBrut)
    ? "question"
    : "lettre";
  const modeBilles = String(charge.numberMode || charge.tokenMode || "").toLowerCase() === "unit";
  const ecritureBrute = String(
    charge.signedWritingMode || charge.signedNotation || charge.writingMode || "simplified",
  ).toLowerCase();
  const ecriture = ["parentheses", "parenthesis", "parenthèses"].includes(ecritureBrute)
    ? "detaillee"
    : "simplifiee";

  const gauche = normaliserCoteImporte(charge.left || charge.top || charge.haut || [], modeBilles);
  const droite = normaliserCoteImporte(charge.right || charge.bottom || charge.bas || [], modeBilles);
  if (!gauche.length || !droite.length) {
    throw new Error("impossible de lire l'équation importée");
  }

  const contientRelatif = gauche
    .concat(droite)
    .some((p) => (p.type === "jeton" && Number(p.valeur) < 0) || (p.type === "tache" && signeTache(p) < 0));
  const univers =
    String(charge.universe || charge.workUniverse || "").toLowerCase() === "relative" || contientRelatif
      ? "relatif"
      : "positif";
  const tachesOpposees = gauche.concat(droite).some((p) => p.type === "tache" && signeTache(p) < 0);

  // les mêmes garde-fous que la saisie normale : plafonds, solution
  // unique, entière, non nulle — jamais de confiance à la valeur reçue
  const nbTaches = gauche.concat(droite).filter((p) => p.type === "tache").length;
  if (nbTaches > MAX_TACHES) {
    throw new Error("Cette équation crée trop de taches pour rester lisible.");
  }
  if (gauche.length + droite.length > MAX_PIECES) {
    throw new Error("Cette équation crée trop d'objets pour rester lisible.");
  }
  const bilanGauche = bilanCote(gauche);
  const bilanDroite = bilanCote(droite);
  const denominateur = bilanGauche.x - bilanDroite.x;
  if (denominateur === 0) {
    throw new Error("Cette équation ne donne pas une solution unique utilisable ici.");
  }
  const solution = (bilanDroite.n - bilanGauche.n) / denominateur;
  if (!Number.isInteger(solution)) {
    throw new Error("Équation refusée : la solution n'est pas un nombre entier.");
  }
  if (solution === 0) {
    throw new Error("Équation refusée : la solution 0 n'est pas prise en charge dans cette version.");
  }
  if (univers === "positif" && solution < 0) {
    throw new Error("En Splat positif, la solution doit être positive.");
  }
  const solutionAnnoncee = Number(charge.x);
  if (Number.isFinite(solutionAnnoncee) && solutionAnnoncee !== solution) {
    throw new Error("L'équation importée annonce une solution qui ne correspond pas à ses plateaux.");
  }

  const etat = {
    lettre,
    solution,
    univers,
    tachesOpposees,
    affichageInconnue,
    ecriture: univers === "relatif" ? ecriture : "detaillee",
    modeBilles,
    gauche,
    droite,
    historique: [],
    pileAnnulation: [],
    conclusionFaite: false,
    paquets: null,
  };
  etat.historique.push({ equation: texteEquation(etat) });
  return etat;
}

// Bien plus qu'il n'en faut pour 80 pièces — au-delà, l'URL est hostile.
const MAX_LONGUEUR_CHARGE = 20000;

/** Décode « ?data= » ou « #data= » (base64url) vers la charge utile. */
export function decoderChargeUrl(brut) {
  if (!brut) return null;
  if (String(brut).length > MAX_LONGUEUR_CHARGE) return null;
  const candidats = [];
  try {
    candidats.push(decodeURIComponent(brut));
  } catch {
    /* candidat suivant */
  }
  try {
    const propre = String(brut).trim().replace(/-/g, "+").replace(/_/g, "/");
    const bourrage = propre.length % 4 ? "=".repeat(4 - (propre.length % 4)) : "";
    const decode = (globalThis.atob || ((s) => Buffer.from(s, "base64").toString("binary")))(
      propre + bourrage,
    );
    candidats.push(
      decodeURIComponent(
        decode.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""),
      ),
    );
  } catch {
    /* candidat suivant */
  }
  candidats.push(String(brut));
  for (const candidat of candidats) {
    try {
      const analyse = JSON.parse(candidat);
      if (analyse && typeof analyse === "object") return analyse;
    } catch {
      /* candidat suivant */
    }
  }
  return null;
}

/* ————— Annulation ————— */

/** Annule la dernière action (mémorisée par chacune des actions). */
export function annuler(etat) {
  const instantane = etat.pileAnnulation.pop();
  if (!instantane) return etat;
  etat.gauche = instantane.gauche;
  etat.droite = instantane.droite;
  etat.historique = instantane.historique;
  etat.conclusionFaite = instantane.conclusionFaite;
  etat.paquets = instantane.paquets;
  return etat;
}
