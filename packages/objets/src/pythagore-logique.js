// PythaBarre maths&go — moteur pur, version 1, STATUT BROUILLON.
//
// Portage fidèle du flux de l'outil historique outils/pythabarre.html
// (lu ligne à ligne) : mêmes étapes guidées, mêmes messages, mêmes
// distracteurs, même règle d'interaction — chaque placement TERMINE le
// geste, l'élève choisit lui-même la prochaine case, jamais de
// sélection automatique. Les couleurs portent un sens mathématique
// partagé avec le moulin (hypoténuse = vert, premier côté de l'angle
// droit = bleu, second = orange) et ne changent jamais d'une question
// à l'autre (makeColorMap de l'outil).
//
// Étapes du guidage (currentInstruction de l'outil) :
//   1 relation → 2 remplacer → 3 carrés → 4 opération partie-tout
//   → 5 résultat → 6 racine carrée et conclusion.
// Deux chemins : hypoténuse (regrouper, +) et côté (enlever, −).
//
// NOUVEAU par rapport à l'outil : la catégorie « avec-calculatrice »
// (racines non entières, l'affichage passe de = à ≈) — la déclinaison
// n'existait pas dans Automatismes (seuls dnb_24/24b sur triplets).

export const VERSION_PYTHAGORE = 1;

// ---------------------------------------------------------------------------
// Nombres — répliques exactes de fmt / square / approxEqual de l'outil
// ---------------------------------------------------------------------------

export function formaterNombre(n) {
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000).replace(".", ",");
}

export function carre(n) {
  return Math.round(n * n * 1000000000) / 1000000000;
}

const approxEgal = (a, b) => Math.abs(a - b) < 1e-9;

/** La racine affichée redonne-t-elle exactement le carré ? (= sinon ≈) */
export function racineExacte(valeurCarre) {
  const r = Math.sqrt(valeurCarre);
  if (!Number.isFinite(r)) return false;
  const affichee = Number(formaterNombre(r).replace(",", "."));
  if (!Number.isFinite(affichee)) return false;
  return approxEgal(carre(affichee), valeurCarre);
}

export function symboleRacine(valeurCarre) {
  return racineExacte(valeurCarre) ? "=" : "≈";
}

// ---------------------------------------------------------------------------
// Les exemples de l'outil (verbatim), plus la catégorie « avec calculatrice »
// ---------------------------------------------------------------------------

export const TRIPLETS_PYTHAGORE_FACILES = Object.freeze([
  [3, 4, 5], [5, 12, 13], [6, 8, 10], [7, 24, 25], [8, 15, 17],
  [9, 12, 15], [10, 24, 26], [12, 16, 20], [12, 35, 37], [15, 20, 25],
  [15, 36, 39], [16, 30, 34], [18, 24, 30], [20, 21, 29], [20, 48, 52],
  [21, 28, 35], [24, 32, 40], [24, 45, 51], [27, 36, 45], [28, 45, 53],
  [30, 40, 50], [33, 44, 55], [36, 48, 60], [39, 52, 65], [40, 42, 58],
  [48, 55, 73], [51, 68, 85], [60, 63, 87], [65, 72, 97],
]);

export const CATEGORIES_EXEMPLES = Object.freeze([
  { id: "entiers-simples", label: "Entiers simples",
    triplets: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [15, 20, 25], [10, 24, 26]],
    coeffs: [1] },
  { id: "entiers-varies", label: "Entiers variés", triplets: TRIPLETS_PYTHAGORE_FACILES, coeffs: [1] },
  { id: "decimaux-simples", label: "Décimaux simples",
    triplets: [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [12, 16, 20], [15, 20, 25], [20, 21, 29], [24, 32, 40], [30, 40, 50]],
    coeffs: [0.1] },
  { id: "decimaux-avances", label: "Décimaux avancés",
    triplets: [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [12, 16, 20], [15, 20, 25], [20, 21, 29]],
    coeffs: [0.25] },
  { id: "melange", label: "Mélange",
    triplets: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [15, 20, 25], [24, 32, 40]],
    coeffs: [1, 0.1, 0.5, 0.25] },
  { id: "avec-calculatrice", label: "Avec calculatrice (≈)", triplets: [], coeffs: [1] },
]);

// ---------------------------------------------------------------------------
// Le problème — réplique de buildModel (mêmes validations, mêmes messages)
// ---------------------------------------------------------------------------

const inverser = (s) => s.split("").reverse().join("");
const normaliser = (nom) => nom.split("").sort().join("");
export const memeCote = (a, b) => normaliser(a) === normaliser(b);

function cotesDepuisLettres(lettres) {
  return [lettres[0] + lettres[1], lettres[0] + lettres[2], lettres[1] + lettres[2]];
}

/**
 * Construit un problème de Pythagore.
 *
 * @param {object} options
 *   lettres « ABC », angleDroit « A », valeurs { AB: 3, AC: 4, BC: "?" }
 *   (exactement une inconnue), unite « cm », modeRelation « guide » | « auto »,
 *   rotation 0-3.
 */
export function creerProbleme({
  lettres = "ABC",
  angleDroit,
  valeurs = {},
  unite = "cm",
  modeRelation = "guide",
  rotation = 0,
} = {}) {
  const nom = String(lettres).toUpperCase().replace(/[^A-Z]/g, "");
  if (nom.length !== 3 || new Set(nom).size !== 3) {
    throw new RangeError("Pythagore : trois lettres majuscules distinctes attendues");
  }
  const lettresListe = nom.split("");
  const droit = angleDroit && lettresListe.includes(angleDroit) ? angleDroit : lettresListe[0];
  const nomsCotes = cotesDepuisLettres(lettresListe);
  if (modeRelation !== "guide" && modeRelation !== "auto") {
    throw new RangeError("Pythagore : modeRelation « guide » ou « auto »");
  }

  const lues = {};
  for (const cote of nomsCotes) {
    const brut = valeurs[cote] ?? valeurs[inverser(cote)];
    if (brut === "?" || brut === undefined || brut === null || brut === "") {
      lues[cote] = { inconnue: true };
    } else if (Number.isFinite(Number(brut)) && Number(brut) > 0) {
      lues[cote] = { valeur: Number(brut) };
    } else {
      throw new RangeError(`La longueur ${cote} doit être un nombre positif, ou bien ? si elle est inconnue.`);
    }
  }
  const inconnues = nomsCotes.filter((c) => lues[c].inconnue);
  if (inconnues.length !== 1) {
    throw new RangeError("Il faut exactement une longueur inconnue : écris ? ou laisse une seule case vide.");
  }

  const hyp = nomsCotes.find((c) => !c.includes(droit));
  const jambes = nomsCotes.filter((c) => c !== hyp);
  const inconnue = inconnues[0];
  const inconnueEstHyp = memeCote(inconnue, hyp);

  const base = {
    lettres: lettresListe,
    angleDroit: droit,
    nomsCotes,
    valeurs: lues,
    unite: String(unite ?? "").trim(),
    hyp,
    jambes,
    inconnue,
    inconnueEstHyp,
    modeRelation,
    rotation: ((Number(rotation) || 0) % 4 + 4) % 4,
    couleurs: { hyp: "vert", jambe1: "bleu", jambe2: "orange" },
  };
  if (inconnueEstHyp) {
    const jambe1 = { cote: jambes[0], valeur: lues[jambes[0]].valeur };
    const jambe2 = { cote: jambes[1], valeur: lues[jambes[1]].valeur };
    if (!Number.isFinite(jambe1.valeur) || !Number.isFinite(jambe2.valeur)) {
      throw new RangeError("Si on cherche l’hypoténuse, les deux côtés de l’angle droit doivent être connus.");
    }
    return { ...base, jambe1, jambe2 };
  }
  const hypConnue = { cote: hyp, valeur: lues[hyp].valeur };
  const jambeConnue = jambes.find((j) => !memeCote(j, inconnue));
  const connue = { cote: jambeConnue, valeur: lues[jambeConnue].valeur };
  if (!Number.isFinite(hypConnue.valeur) || !Number.isFinite(connue.valeur)) {
    throw new RangeError("Si on cherche un côté de l’angle droit, il faut connaître l’hypoténuse et l’autre côté de l’angle droit.");
  }
  if (carre(hypConnue.valeur) <= carre(connue.valeur)) {
    throw new RangeError("L’hypoténuse doit être la plus grande longueur. Ici, les données ne sont pas cohérentes pour un triangle rectangle.");
  }
  return { ...base, hypConnue, jambeConnue: connue };
}

/** La valeur (connue ou déduite) d'un côté du problème. */
export function valeurCote(probleme, cote) {
  const entree = probleme.valeurs[cote] ?? probleme.valeurs[inverser(cote)];
  if (entree && !entree.inconnue) return entree.valeur;
  if (probleme.inconnueEstHyp) {
    return Math.sqrt(carre(probleme.jambe1.valeur) + carre(probleme.jambe2.valeur));
  }
  return Math.sqrt(carre(probleme.hypConnue.valeur) - carre(probleme.jambeConnue.valeur));
}

/** L'énoncé (problemStatementHtml de l'outil, en texte pur). */
export function enonce(probleme) {
  const nom = probleme.lettres.join("");
  const connus = probleme.nomsCotes
    .filter((c) => !probleme.valeurs[c].inconnue)
    .map((c) => `${c} = ${formaterNombre(probleme.valeurs[c].valeur)}${probleme.unite ? `\u00a0${probleme.unite}` : ""}`);
  const partieConnue = connus.length ? `${connus.join(" et ")}. ` : "";
  return `Dans le triangle ${nom} rectangle en ${probleme.angleDroit}, ${partieConnue}Calculer ${probleme.inconnue}.`;
}

export function phraseIntroduction(probleme) {
  return `Le triangle ${probleme.lettres.join("")} est rectangle en ${probleme.angleDroit}, donc d’après le théorème de Pythagore, on a :`;
}

// ---------------------------------------------------------------------------
// Génération seedée par catégorie
// ---------------------------------------------------------------------------

export function genererProbleme(generateur, { categorie = "entiers-simples", inconnue, lettres = "ABC" } = {}) {
  const fiche = CATEGORIES_EXEMPLES.find((c) => c.id === categorie);
  if (!fiche) throw new RangeError(`Pythagore : catégorie inconnue « ${categorie} »`);
  const chercherHyp = inconnue === "hypotenuse" ? true : inconnue === "cote" ? false : generateur.entier(0, 1) === 1;
  const nomsCotes = cotesDepuisLettres(String(lettres).split(""));
  const [jambeA, jambeB, hypotenuse] = nomsCotes;

  let a;
  let b;
  let c;
  if (fiche.id === "avec-calculatrice") {
    // côtés entiers SANS triplet : la racine n'est pas entière, on ≈
    for (let essai = 0; essai < 60; essai++) {
      a = generateur.entier(2, 12);
      b = generateur.entier(2, 12);
      c = Math.sqrt(a * a + b * b);
      if (!racineExacte(a * a + b * b)) break;
    }
    if (!chercherHyp) {
      // hypoténuse entière, côté connu plus petit, l'autre côté irrationnel
      for (let essai = 0; essai < 60; essai++) {
        c = generateur.entier(5, 15);
        a = generateur.entier(2, c - 1);
        if (!racineExacte(c * c - a * a)) break;
      }
      b = Math.sqrt(c * c - a * a);
    }
  } else {
    const triplet = fiche.triplets[generateur.entier(0, fiche.triplets.length - 1)];
    const coeff = fiche.coeffs[generateur.entier(0, fiche.coeffs.length - 1)];
    [a, b, c] = triplet.map((v) => Math.round(v * coeff * 1000) / 1000);
  }

  const valeurs = chercherHyp
    ? { [jambeA]: a, [jambeB]: b, [hypotenuse]: "?" }
    : { [jambeA]: a, [jambeB]: "?", [hypotenuse]: c };
  return creerProbleme({
    lettres,
    angleDroit: String(lettres)[0],
    valeurs,
    rotation: generateur.entier(0, 3),
  });
}

// ---------------------------------------------------------------------------
// Le travail de l'élève — réplique d'initialWork + les actions guidées
// ---------------------------------------------------------------------------

export function creerTravail() {
  return {
    demarre: false,
    relationSlots: { lhs: null, rhs1: null, rhs2: null },
    relationComplete: false,
    remplacements: {},
    remplace: false,
    carres: {},
    operationChoisie: null,
    operationCalculee: false,
    resultat: null,
    regroupe: false,
    enleve: false,
    racineFaite: false,
    conclu: false,
    // sélections transitoires (chaque placement les remet à zéro)
    selections: { slot: null, aire: null, caseRemplacement: null, valeurRemplacement: null, caseCarre: null, valeurCarre: null },
    message: "",
    flash: null, // { cote, genre: "ok" | "bad" }
  };
}

function viderSelections(travail) {
  travail.selections = { slot: null, aire: null, caseRemplacement: null, valeurRemplacement: null, caseCarre: null, valeurCarre: null };
}

export function demarrer(travail) {
  travail.demarre = true;
  travail.message = "";
}

/** Le mode guidé courant (guidedMode de l'outil). */
export function etapeCourante(probleme, travail) {
  if (!travail.demarre) return "depart";
  if (!travail.relationComplete) return "relation";
  if (!travail.remplace) return "remplacer";
  if (ciblesCarres(probleme).some((t) => !travail.carres[t.cote])) return "calculer";
  if (!travail.operationChoisie) return "operation";
  if (!travail.operationCalculee) return "resultat";
  if (!travail.racineFaite || !travail.conclu) return "racine";
  return "fini";
}

/** L'instruction affichée (currentInstruction, textes verbatim). */
export function instruction(probleme, travail) {
  const etape = etapeCourante(probleme, travail);
  const s = travail.selections;
  if (etape === "depart") return "";
  if (probleme.modeRelation === "auto") {
    const autos = {
      relation: "Clique sur Suivant pour afficher la relation de Pythagore.",
      remplacer: "Clique sur Suivant pour remplacer les longueurs connues.",
      calculer: "Clique sur Suivant pour calculer les carrés connus.",
      operation: "Clique sur Suivant pour afficher l’opération adaptée.",
      resultat: "Clique sur Suivant pour afficher le résultat de l’opération.",
      racine: "Clique sur Suivant pour afficher la racine carrée et la conclusion.",
    };
    return autos[etape] ? { numero: numeroEtape(etape), texte: autos[etape] } : "";
  }
  if (etape === "relation") {
    if (s.slot) return { numero: 1, texte: "Clique sur l’aire d’un carré du moulin pour compléter la relation." };
    if (s.aire) return { numero: 1, texte: "Clique sur la case de la relation où placer cette aire." };
    return { numero: 1, texte: "Complète la relation de Pythagore : clique sur une case puis sur une aire, ou sur une aire puis sur une case." };
  }
  if (etape === "remplacer") {
    if (s.caseRemplacement) return { numero: 2, texte: "Clique sur la longueur à placer dans la case choisie." };
    if (s.valeurRemplacement) {
      return { numero: 2, texte: `Clique sur la case du tableau où placer ${formaterNombre(valeurCote(probleme, s.valeurRemplacement))}².` };
    }
    return { numero: 2, texte: "Remplace les longueurs connues : clique sur une case puis sur une valeur, ou dans l’autre sens." };
  }
  if (etape === "calculer") {
    if (s.caseCarre !== null) return { numero: 3, texte: "Clique sur la valeur du carré à placer dans la case choisie." };
    if (s.valeurCarre !== null) return { numero: 3, texte: `Clique sur le carré qui vaut ${formaterNombre(s.valeurCarre)}.` };
    return { numero: 3, texte: "Calcule les carrés connus : clique sur une case puis sur une valeur, ou dans l’autre sens." };
  }
  if (etape === "operation") return { numero: 4, texte: "Schéma partie-tout : choisis l’opération." };
  if (etape === "resultat") return { numero: 5, texte: "Calcule le résultat de l’opération." };
  if (etape === "racine") return { numero: 6, texte: "Choisis le résultat de la racine carrée." };
  return "";
}

function numeroEtape(etape) {
  return { relation: 1, remplacer: 2, calculer: 3, operation: 4, resultat: 5, racine: 6 }[etape] ?? 0;
}

// --- Étape 1 : la relation --------------------------------------------------

export function relationCorrecte(probleme, slots) {
  return Boolean(slots.lhs && slots.rhs1 && slots.rhs2)
    && memeCote(slots.lhs, probleme.hyp)
    && !memeCote(slots.rhs1, slots.rhs2)
    && probleme.jambes.some((j) => memeCote(j, slots.rhs1))
    && probleme.jambes.some((j) => memeCote(j, slots.rhs2));
}

function poserDansRelation(probleme, travail, slot, cote) {
  travail.relationSlots[slot] = cote;
  travail.selections.aire = null;
  // Chaque placement termine le geste. L'élève choisit lui-même la
  // prochaine case : aucun ordre imposé, aucune sélection automatique.
  travail.selections.slot = null;
  const rempli = Boolean(travail.relationSlots.lhs && travail.relationSlots.rhs1 && travail.relationSlots.rhs2);
  if (!rempli) {
    travail.message = "";
    return;
  }
  if (relationCorrecte(probleme, travail.relationSlots)) {
    travail.relationComplete = true;
    viderSelections(travail);
    travail.message = "";
  } else {
    travail.message = "La relation n’est pas correcte : clique sur une case pour la corriger.";
  }
}

export function cliquerCaseRelation(probleme, travail, slot) {
  if (!travail.demarre || travail.relationComplete) return;
  if (travail.selections.aire) {
    poserDansRelation(probleme, travail, slot, travail.selections.aire);
    return;
  }
  travail.selections.slot = slot;
  travail.message = "";
}

export function cliquerAire(probleme, travail, cote) {
  if (!travail.demarre || travail.relationComplete) return;
  if (!travail.selections.slot) {
    travail.selections.aire = cote;
    travail.message = "";
    return;
  }
  poserDansRelation(probleme, travail, travail.selections.slot, cote);
}

// --- Étapes 2 et 3 : remplacer puis calculer les carrés ---------------------

/** Les côtés connus à remplacer puis élever au carré (squareTargets). */
export function ciblesCarres(probleme) {
  if (probleme.inconnueEstHyp) return jambesDansOrdreChoisi(probleme, null);
  return [probleme.hypConnue, probleme.jambeConnue];
}

/** L'ordre des jambes tel que l'élève l'a posé dans la relation. */
export function jambesDansOrdreChoisi(probleme, travail) {
  const [j1, j2] = [probleme.jambe1, probleme.jambe2];
  const slots = travail?.relationSlots;
  if (slots?.rhs1 && memeCote(slots.rhs1, j2.cote)) return [j2, j1];
  return [j1, j2];
}

export function estRemplace(travail, cote) {
  return Boolean(travail.remplace) || Boolean(travail.remplacements[cote]);
}

export function cliquerCaseRemplacement(probleme, travail, cote) {
  if (etapeCourante(probleme, travail) !== "remplacer") return;
  if (!ciblesCarres(probleme).some((t) => memeCote(t.cote, cote)) || estRemplace(travail, cote)) return;
  const s = travail.selections;
  if (!s.valeurRemplacement) {
    s.caseRemplacement = cote;
    travail.message = "Case choisie. Clique maintenant sur la longueur à placer.";
    return;
  }
  if (!memeCote(s.valeurRemplacement, cote)) {
    travail.flash = { cote, genre: "bad" };
    travail.message = "Ce n’est pas la bonne case.";
    return;
  }
  travail.flash = { cote, genre: "ok" };
  travail.remplacements[cote] = true;
  travail.remplace = ciblesCarres(probleme).every((t) => estRemplace(travail, t.cote));
  viderSelections(travail);
  travail.message = "";
}

export function cliquerValeurRemplacement(probleme, travail, cote) {
  if (etapeCourante(probleme, travail) !== "remplacer") return;
  const s = travail.selections;
  if (s.caseRemplacement) {
    if (!memeCote(cote, s.caseRemplacement)) {
      travail.message = "Cette longueur ne correspond pas à la case choisie.";
      s.caseRemplacement = null;
      s.valeurRemplacement = null;
      return;
    }
    s.valeurRemplacement = cote;
    cliquerCaseRemplacement(probleme, travail, s.caseRemplacement ?? cote);
    return;
  }
  s.valeurRemplacement = cote;
  s.valeurCarre = null;
  travail.message = "Valeur choisie. Clique maintenant sur sa case dans le tableau.";
}

export function cliquerCaseCarre(probleme, travail, cote) {
  if (etapeCourante(probleme, travail) !== "calculer") return;
  if (travail.carres[cote] || !ciblesCarres(probleme).some((t) => memeCote(t.cote, cote))) return;
  const s = travail.selections;
  if (s.valeurCarre === null) {
    s.caseCarre = cote;
    travail.message = "Case choisie. Clique maintenant sur la valeur du carré.";
    return;
  }
  const attendu = carre(valeurCote(probleme, cote));
  if (!approxEgal(s.valeurCarre, attendu)) {
    travail.flash = { cote, genre: "bad" };
    travail.message = "Ce n’est pas la bonne case.";
    return;
  }
  travail.flash = { cote, genre: "ok" };
  travail.carres[cote] = attendu;
  viderSelections(travail);
  travail.message = "";
}

export function cliquerValeurCarre(probleme, travail, valeur) {
  if (etapeCourante(probleme, travail) !== "calculer") return;
  const s = travail.selections;
  const numerique = Number(valeur);
  if (s.caseCarre) {
    s.valeurCarre = numerique;
    cliquerCaseCarre(probleme, travail, s.caseCarre);
    return;
  }
  s.valeurCarre = numerique;
  s.valeurRemplacement = null;
  travail.message = "Résultat choisi. Clique maintenant sur le carré correspondant.";
}

// --- Étapes 4 à 6 : partie-tout, résultat, racine ---------------------------

function faireOperation(gauche, signe, droite, correcte = false) {
  const resultat = signe === "+" ? gauche + droite : gauche - droite;
  return { cle: `${formaterNombre(gauche)}${signe}${formaterNombre(droite)}`.replace(/\s+/g, ""), gauche, signe, droite, resultat, correcte };
}

export function operationCorrecte(probleme, travail) {
  if (probleme.inconnueEstHyp) {
    const [j1, j2] = jambesDansOrdreChoisi(probleme, travail);
    return faireOperation(travail.carres[j1.cote], "+", travail.carres[j2.cote], true);
  }
  return faireOperation(travail.carres[probleme.hypConnue.cote], "-", travail.carres[probleme.jambeConnue.cote], true);
}

export function propositionsOperations(probleme, travail) {
  const propositions = [];
  const ajouter = (op) => {
    if (Number.isFinite(op.resultat) && !propositions.some((x) => x.cle === op.cle)) propositions.push(op);
  };
  if (probleme.inconnueEstHyp) {
    const [j1, j2] = jambesDansOrdreChoisi(probleme, travail);
    const a = travail.carres[j1.cote];
    const b = travail.carres[j2.cote];
    ajouter(faireOperation(a, "+", b, true));
    ajouter(faireOperation(b, "+", a, true));
    ajouter(faireOperation(Math.max(a, b), "-", Math.min(a, b), false));
    ajouter(faireOperation(Math.min(a, b), "-", Math.max(a, b), false));
    ajouter(faireOperation(a, "-", b, false));
  } else {
    const h = travail.carres[probleme.hypConnue.cote];
    const k = travail.carres[probleme.jambeConnue.cote];
    ajouter(faireOperation(h, "-", k, true));
    ajouter(faireOperation(h, "+", k, false));
    ajouter(faireOperation(k, "-", h, false));
    ajouter(faireOperation(k, "+", h, false));
  }
  return propositions.slice(0, 4);
}

export function choisirOperation(probleme, travail, cle) {
  if (etapeCourante(probleme, travail) !== "operation") return;
  const choix = propositionsOperations(probleme, travail).find((op) => op.cle === cle);
  if (!choix || !choix.correcte) {
    travail.message = "Ce n’est pas l’opération adaptée.";
    return;
  }
  travail.operationChoisie = choix;
  viderSelections(travail);
  travail.message = "";
}

export function propositionsResultat(operation) {
  const bonne = operation.resultat;
  const propositions = [];
  const ajouter = (v) => {
    if (Number.isFinite(v) && !propositions.some((x) => approxEgal(x, v))) propositions.push(v);
  };
  ajouter(bonne);
  ajouter(operation.gauche + operation.droite);
  ajouter(Math.abs(operation.gauche - operation.droite));
  ajouter(operation.gauche);
  ajouter(operation.droite);
  ajouter(bonne + 10);
  ajouter(bonne - 10);
  let garde = 1;
  while (propositions.length < 5 && garde < 20) {
    ajouter(bonne + garde * 2);
    garde++;
  }
  return propositions.slice(0, 5);
}

export function choisirResultat(probleme, travail, valeur) {
  if (etapeCourante(probleme, travail) !== "resultat") return;
  const operation = travail.operationChoisie ?? operationCorrecte(probleme, travail);
  if (!approxEgal(Number(valeur), operation.resultat)) {
    travail.message = "Ce n’est pas le bon résultat.";
    return;
  }
  travail.resultat = operation.resultat;
  travail.operationCalculee = true;
  if (probleme.inconnueEstHyp) travail.regroupe = true;
  else travail.enleve = true;
  viderSelections(travail);
  travail.message = "";
}

export function propositionsCarres(probleme, travail) {
  const cibles = ciblesCarres(probleme).filter((t) => !travail.carres[t.cote]);
  const propositions = [];
  const ajouter = (v) => {
    if (Number.isFinite(v) && !propositions.some((x) => approxEgal(x, v))) propositions.push(v);
  };
  const confusionConcat = (v) => (Number.isInteger(v) && v >= 0 && v < 100 ? Number(`${Math.round(v)}2`) : NaN);
  // On veut toujours voir les deux pièges classiques : n² et n × 2.
  cibles.forEach((t) => ajouter(carre(t.valeur)));
  cibles.forEach((t) => ajouter(t.valeur * 2));
  cibles.forEach((t) => ajouter(t.valeur + 2));
  cibles.forEach((t) => ajouter(confusionConcat(t.valeur)));
  cibles.forEach((t) => ajouter(carre(t.valeur) + t.valeur));
  cibles.forEach((t) => ajouter(Math.max(0, carre(t.valeur) - t.valeur)));
  let garde = 1;
  const base = cibles[0] ? carre(cibles[0].valeur) : 0;
  while (propositions.length < 6 && garde < 30) {
    ajouter(base + garde * 3);
    garde++;
  }
  return propositions.slice(0, 6);
}

export function propositionsRacine(travail) {
  const bonne = Math.sqrt(travail.resultat);
  const base = travail.resultat;
  const propositions = [];
  const ajouter = (v) => {
    if (Number.isFinite(v) && v >= 0 && !propositions.some((x) => approxEgal(x, v))) propositions.push(v);
  };
  // Distracteurs volontaires : le carré lui-même, sa moitié, le double
  // de la racine, des voisins de la bonne racine.
  ajouter(bonne);
  ajouter(base);
  ajouter(base / 2);
  ajouter(bonne * 2);
  ajouter(Math.max(0, bonne + 1));
  ajouter(Math.max(0, bonne - 1));
  ajouter(Math.max(0, base - bonne));
  ajouter(Math.round(bonne * 10) / 10 + 2);
  let garde = 1;
  while (propositions.length < 5 && garde < 20) {
    ajouter(Math.max(0, Math.round(bonne) + garde));
    garde++;
  }
  return propositions.slice(0, 5);
}

export function choisirRacine(probleme, travail, valeur) {
  if (etapeCourante(probleme, travail) !== "racine") return;
  if (!approxEgal(Number(valeur), Math.sqrt(travail.resultat))) {
    travail.message = "Ce n’est pas le bon résultat de la racine carrée.";
    return;
  }
  travail.racineFaite = true;
  travail.conclu = true;
  viderSelections(travail);
  travail.message = "";
}

/** Mode « auto » : Suivant applique l'étape courante d'un coup. */
export function suivantAuto(probleme, travail) {
  const etape = etapeCourante(probleme, travail);
  if (etape === "depart") { demarrer(travail); return; }
  if (etape === "relation") {
    travail.relationSlots = probleme.inconnueEstHyp
      ? { lhs: probleme.hyp, rhs1: probleme.jambe1.cote, rhs2: probleme.jambe2.cote }
      : { lhs: probleme.hypConnue.cote, rhs1: probleme.jambeConnue.cote, rhs2: probleme.inconnue };
    travail.relationComplete = true;
    return;
  }
  if (etape === "remplacer") {
    for (const cible of ciblesCarres(probleme)) travail.remplacements[cible.cote] = true;
    travail.remplace = true;
    return;
  }
  if (etape === "calculer") {
    for (const cible of ciblesCarres(probleme)) travail.carres[cible.cote] = carre(cible.valeur);
    return;
  }
  if (etape === "operation") {
    travail.operationChoisie = operationCorrecte(probleme, travail);
    return;
  }
  if (etape === "resultat") {
    choisirResultat(probleme, travail, (travail.operationChoisie ?? operationCorrecte(probleme, travail)).resultat);
    return;
  }
  if (etape === "racine") {
    travail.resultat ??= operationCorrecte(probleme, travail).resultat;
    travail.racineFaite = true;
    travail.conclu = true;
  }
}

// ---------------------------------------------------------------------------
// Les lignes de la preuve — relationRows en DONNÉES (le rendu dessine la
// vraie racine carrée avec squareRootSvg, jamais le caractère √ seul).
// ---------------------------------------------------------------------------

function terme(probleme, cote, texte, options = {}) {
  return { cote, texte, ...options };
}

function texteCarreLettres(cote) {
  return `${cote}²`;
}

function texteCarreValeur(valeur) {
  return `${formaterNombre(valeur)}²`;
}

/**
 * Les lignes affichées de la rédaction, dans l'ordre de l'outil.
 * Chaque terme : { cote, texte, cliquable: "remplacer" | "calculer" | null }.
 * Types spéciaux : { type: "racine", gauche, radicande } et
 * { type: "conclusion", gauche, symbole, texte } et { type: "phrase", texte }.
 */
export function lignesPreuve(probleme, travail) {
  if (!travail.demarre || !travail.relationComplete) return [];
  const lignes = [];
  const etape = etapeCourante(probleme, travail);
  const u = probleme.inconnue;
  const afficheCarre = (cote, valeur) => {
    if (travail.carres[cote]) return formaterNombre(travail.carres[cote]);
    if (estRemplace(travail, cote)) return texteCarreValeur(valeur);
    return texteCarreLettres(cote);
  };
  const cliquab = (cote) => {
    if (etape === "remplacer" && !estRemplace(travail, cote)) return "remplacer";
    if (etape === "calculer" && estRemplace(travail, cote) && !travail.carres[cote]) return "calculer";
    return null;
  };

  if (probleme.inconnueEstHyp) {
    const [j1, j2] = jambesDansOrdreChoisi(probleme, travail);
    const droite = (transforme) => [j1, j2].map((j) => terme(probleme, j.cote, transforme(j), { cliquable: cliquab(j.cote) }));
    lignes.push({ type: "egalite", gauche: terme(probleme, probleme.hyp, texteCarreLettres(probleme.hyp)), droite: droite((j) => texteCarreLettres(j.cote)) });
    if (ciblesCarres(probleme).some((t) => estRemplace(travail, t.cote))) {
      lignes.push({ type: "egalite", gauche: terme(probleme, probleme.hyp, texteCarreLettres(probleme.hyp)), droite: droite((j) => (estRemplace(travail, j.cote) ? texteCarreValeur(j.valeur) : texteCarreLettres(j.cote))) });
    }
    if ([j1, j2].some((j) => travail.carres[j.cote])) {
      lignes.push({ type: "egalite", gauche: terme(probleme, probleme.hyp, texteCarreLettres(probleme.hyp)), droite: droite((j) => afficheCarre(j.cote, j.valeur)) });
    }
    if (travail.operationChoisie) {
      lignes.push({ type: "egalite", gauche: terme(probleme, u, texteCarreLettres(u)), droite: [terme(probleme, u, `${formaterNombre(travail.operationChoisie.gauche)} ${travail.operationChoisie.signe} ${formaterNombre(travail.operationChoisie.droite)}`)] });
    }
    if (travail.regroupe) {
      lignes.push({ type: "egalite", gauche: terme(probleme, u, texteCarreLettres(u)), droite: [terme(probleme, u, formaterNombre(travail.resultat))] });
    }
  } else {
    const h = probleme.hypConnue;
    const k = probleme.jambeConnue;
    const ordre = (() => {
      const { rhs1, rhs2 } = travail.relationSlots;
      if (rhs1 && rhs2 && memeCote(rhs1, u) && memeCote(rhs2, k.cote)) return [u, k.cote];
      return [k.cote, u];
    })();
    const droiteTermes = (transformeConnue) => ordre.map((cote) => (memeCote(cote, k.cote)
      ? terme(probleme, k.cote, transformeConnue(), { cliquable: cliquab(k.cote) })
      : terme(probleme, u, texteCarreLettres(u))));
    lignes.push({ type: "egalite", gauche: terme(probleme, h.cote, texteCarreLettres(h.cote), { cliquable: cliquab(h.cote) }), droite: droiteTermes(() => texteCarreLettres(k.cote)) });
    if (ciblesCarres(probleme).some((t) => estRemplace(travail, t.cote))) {
      lignes.push({ type: "egalite", gauche: terme(probleme, h.cote, estRemplace(travail, h.cote) ? texteCarreValeur(h.valeur) : texteCarreLettres(h.cote), { cliquable: cliquab(h.cote) }), droite: droiteTermes(() => (estRemplace(travail, k.cote) ? texteCarreValeur(k.valeur) : texteCarreLettres(k.cote))) });
    }
    if (travail.carres[h.cote] || travail.carres[k.cote]) {
      lignes.push({ type: "egalite", gauche: terme(probleme, h.cote, afficheCarre(h.cote, h.valeur), { cliquable: cliquab(h.cote) }), droite: droiteTermes(() => afficheCarre(k.cote, k.valeur)) });
    }
    if (travail.operationChoisie) {
      lignes.push({ type: "egalite", gauche: terme(probleme, u, texteCarreLettres(u)), droite: [terme(probleme, u, `${formaterNombre(travail.operationChoisie.gauche)} ${travail.operationChoisie.signe} ${formaterNombre(travail.operationChoisie.droite)}`)] });
    }
    if (travail.enleve) {
      lignes.push({ type: "egalite", gauche: terme(probleme, u, texteCarreLettres(u)), droite: [terme(probleme, u, formaterNombre(travail.resultat))] });
    }
  }

  if (travail.racineFaite) {
    lignes.push({ type: "racine", gauche: u, radicande: formaterNombre(travail.resultat) });
  }
  if (travail.conclu) {
    const symbole = symboleRacine(travail.resultat);
    const valeur = formaterNombre(Math.sqrt(travail.resultat));
    lignes.push({ type: "conclusion", gauche: u, symbole, texte: probleme.unite ? `${valeur}\u00a0${probleme.unite}` : valeur });
    if (probleme.unite) {
      lignes.push({ type: "phrase", texte: `Donc ${u} ${symbole} ${valeur}\u00a0${probleme.unite}` });
    }
  }
  return lignes;
}

// ---------------------------------------------------------------------------
// Les barres — hypBar / legBar en données pour le dessinateur
// ---------------------------------------------------------------------------

/**
 * Les deux lignes du schéma en barres (poids ∝ carrés des longueurs).
 * Avant la relation : cases-slots cliquables. Après : cases d'état.
 */
export function lignesBarres(probleme, travail) {
  if (!travail.demarre) return null;
  if (!travail.relationComplete) {
    const s = travail.relationSlots;
    const caseSlot = (slot) => ({ slot, cote: s[slot], texte: s[slot] ? texteCarreLettres(s[slot]) : "…²", poids: 1 });
    return { mode: "relation", haut: [caseSlot("lhs")], bas: [caseSlot("rhs1"), caseSlot("rhs2")] };
  }
  const etape = etapeCourante(probleme, travail);
  const texteCase = (cote, valeur) => {
    if (travail.carres[cote]) return formaterNombre(travail.carres[cote]);
    if (estRemplace(travail, cote)) return texteCarreValeur(valeur);
    return texteCarreLettres(cote);
  };
  const cliquable = (cote) => {
    if (etape === "remplacer" && !estRemplace(travail, cote)) return "remplacer";
    if (etape === "calculer" && estRemplace(travail, cote) && !travail.carres[cote]) return "calculer";
    return null;
  };
  if (probleme.inconnueEstHyp) {
    const [j1, j2] = jambesDansOrdreChoisi(probleme, travail);
    const p1 = carre(j1.valeur);
    const p2 = carre(j2.valeur);
    const haut = [{ cote: probleme.hyp, texte: texteCarreLettres(probleme.hyp), poids: p1 + p2, genre: "inconnue" }];
    if (travail.regroupe) {
      return { mode: "travail", haut, bas: [{ cote: probleme.hyp, texte: formaterNombre(travail.resultat), poids: p1 + p2, genre: "resultat" }] };
    }
    return {
      mode: "travail",
      haut,
      bas: [j1, j2].map((j) => ({ cote: j.cote, texte: texteCase(j.cote, j.valeur), poids: carre(j.valeur), genre: "connue", cliquable: cliquable(j.cote) })),
    };
  }
  const h = probleme.hypConnue;
  const k = probleme.jambeConnue;
  const pH = carre(h.valeur);
  const pK = carre(k.valeur);
  const reste = travail.resultat ?? pH - pK;
  const caseInconnue = { cote: probleme.inconnue, texte: travail.enleve ? formaterNombre(reste) : texteCarreLettres(probleme.inconnue), poids: reste, genre: travail.enleve ? "resultat" : "inconnue" };
  const caseConnue = { cote: k.cote, texte: texteCase(k.cote, k.valeur), poids: pK, genre: travail.enleve ? "enlevee" : "connue", cliquable: cliquable(k.cote) };
  const { rhs1, rhs2 } = travail.relationSlots;
  const bas = rhs1 && rhs2 && memeCote(rhs1, probleme.inconnue) && memeCote(rhs2, k.cote)
    ? [caseInconnue, caseConnue]
    : [caseConnue, caseInconnue];
  return {
    mode: "travail",
    haut: [{ cote: h.cote, texte: texteCase(h.cote, h.valeur), poids: pH, genre: "connue", cliquable: cliquable(h.cote) }],
    bas,
  };
}
