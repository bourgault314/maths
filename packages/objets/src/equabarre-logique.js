// Logique de manipulation ÉquaBarre — version 1, BROUILLON.
//
// Le cerveau de l'ÉquaBarre manipulable, refait proprement d'après
// l'outil historique (outils/equabarre.html) : les cinq opérations au
// clic — décomposer, regrouper, partager équitablement, déplacer,
// enlever dans chaque membre — et l'équation qui suit chaque geste.
//
// Tout est PUR : un état entre, un état sort, aucune touche au
// navigateur — donc tout est testable. Le dessin reste l'affaire de
// dessinerBarres, l'interface celle de l'Atelier/du player.
//
// Conventions reprises de l'outil :
// - membre gauche de l'équation = ligne du BAS, membre droit = HAUT ;
// - « enlever dans chaque membre » exige la même quantité des deux
//   côtés : autant d'inconnues ET la même somme de nombres ;
// - une case enlevée reste visible hachurée (« garder hachuré ») ;
// - l'historique garde chaque étape de l'équation.

import { analyserEquation } from "./equation-barres.js";

export const VERSION_EQUABARRE_LOGIQUE = 1;
export const MODES = ["decomposer", "regrouper", "partager", "deplacer", "enlever"];
const MAX_HISTORIQUE = 80;

const clone = (valeur) => JSON.parse(JSON.stringify(valeur));

/**
 * Écrit un membre sous forme de texte : « 2 + 2x + 7 » (cases enlevées
 * exclues). Un partage équitable s'écrit « n × v » (4 parts de 2 →
 * « 4 × 2 »), comme dans l'outil historique.
 */
export function texteDuMembre(pieces, lettre) {
  const actives = pieces.filter((p) => p.etat !== "supprime");
  const nbX = actives.filter((p) => p.type === "inconnue").length;
  const termes = [];
  if (nbX > 0) termes.push(nbX === 1 ? lettre : `${nbX}${lettre}`);
  const groupesVus = new Set();
  for (const p of actives) {
    if (p.type !== "nombre") continue;
    if (p.groupe !== undefined) {
      if (groupesVus.has(p.groupe)) continue;
      groupesVus.add(p.groupe);
      const effectif = actives.filter((a) => a.groupe === p.groupe).length;
      termes.push(effectif > 1 ? `${effectif} × ${p.valeur}` : String(p.valeur));
    } else {
      termes.push(String(p.valeur));
    }
  }
  return termes.length ? termes.join(" + ") : "0";
}

function equationCourante(etat) {
  // ligne 1 = membre gauche (bas), ligne 0 = membre droit (haut)
  return `${texteDuMembre(etat.lignes[1].pieces, etat.lettre)} = ${texteDuMembre(etat.lignes[0].pieces, etat.lettre)}`;
}

/**
 * Crée l'état initial à partir d'une équation du langage ÉquaBarre.
 * @param {string} texte — ex. « 2 + 2x + 7 = 3x + 5 + 1 »
 */
export function creerEtat(texte) {
  const { lettre, solution, membreGauche, membreDroit } = analyserEquation(texte);
  const enPieces = (liste) =>
    liste.map((p) =>
      p.type === "inconnue" ? { type: "inconnue" } : { type: "nombre", valeur: p.valeur },
    );
  const etat = {
    lettre,
    solution,
    mode: "enlever",
    lignes: [{ pieces: enPieces(membreDroit) }, { pieces: enPieces(membreGauche) }],
    selection: [],
    historique: [],
    pileAnnulation: [],
  };
  etat.historique.push({ equation: equationCourante(etat) });
  return etat;
}

function memoriser(etat) {
  const instantane = clone({ lignes: etat.lignes, historique: etat.historique });
  for (const ligne of instantane.lignes) {
    for (const piece of ligne.pieces) {
      if (piece.etat === "selectionSuppression" || piece.etat === "selectionAjout") {
        delete piece.etat;
      }
    }
  }
  etat.pileAnnulation.push(instantane);
  if (etat.pileAnnulation.length > MAX_HISTORIQUE) etat.pileAnnulation.shift();
}

function terminerAction(etat, operation) {
  etat.selection = [];
  for (const ligne of etat.lignes) {
    for (const piece of ligne.pieces) {
      if (piece.etat === "selectionSuppression" || piece.etat === "selectionAjout") {
        delete piece.etat;
      }
    }
  }
  const equation = equationCourante(etat);
  const derniere = etat.historique.at(-1);
  // règle de l'outil : une ligne quand l'équation change (ou opération annotée)
  if (operation || !derniere || derniere.equation !== equation) {
    etat.historique.push({ equation, ...(operation ? { operation } : {}) });
    if (etat.historique.length > MAX_HISTORIQUE) etat.historique.shift();
  }
}

/** La pièce est-elle encore en jeu ? */
const active = (piece) => piece.etat !== "supprime";

export function changerMode(etat, mode) {
  if (!MODES.includes(mode)) throw new RangeError(`mode inconnu « ${mode} »`);
  etat.mode = mode;
  etat.selection = [];
  for (const ligne of etat.lignes) {
    for (const piece of ligne.pieces) {
      if (piece.etat === "selectionSuppression" || piece.etat === "selectionAjout") {
        delete piece.etat;
      }
    }
  }
  return etat;
}

/**
 * Clic sur une pièce. Selon le mode, sélectionne/désélectionne ou
 * déclenche l'opération. Renvoie une description de ce qui s'est passé
 * (l'interface peut ouvrir un dialogue pour décomposer/partager).
 */
export function cliquerPiece(etat, ligneIdx, pieceIdx) {
  const piece = etat.lignes[ligneIdx]?.pieces[pieceIdx];
  if (!piece || !active(piece)) return { action: "rien" };

  if (etat.mode === "decomposer" || etat.mode === "partager") {
    if (piece.type !== "nombre") return { action: "rien" };
    return { action: etat.mode, ligne: ligneIdx, indice: pieceIdx, valeur: piece.valeur };
  }

  const deja = etat.selection.findIndex((s) => s.ligne === ligneIdx && s.indice === pieceIdx);
  if (deja >= 0) {
    etat.selection.splice(deja, 1);
    delete piece.etat;
    return { action: "deselection" };
  }

  if (etat.mode === "regrouper" && piece.type !== "nombre") return { action: "rien" };
  if (etat.mode === "regrouper" && etat.selection.length && etat.selection[0].ligne !== ligneIdx) {
    return { action: "rien" }; // regroupement dans un seul membre
  }

  etat.selection.push({ ligne: ligneIdx, indice: pieceIdx });
  piece.etat = etat.mode === "enlever" ? "selectionSuppression" : "selectionAjout";

  if (etat.mode === "deplacer" && etat.selection.length === 2) {
    const [a, b] = etat.selection;
    if (a.ligne !== b.ligne) {
      etat.selection = [b];
      delete etat.lignes[a.ligne].pieces[a.indice].etat;
      etat.lignes[b.ligne].pieces[b.indice].etat = "selectionAjout";
      return { action: "selection" };
    }
    memoriser(etat);
    const pieces = etat.lignes[a.ligne].pieces;
    [pieces[a.indice], pieces[b.indice]] = [pieces[b.indice], pieces[a.indice]];
    // déplacer réorganise l'affichage : l'équation ne change pas
    etat.selection = [];
    for (const piece of pieces) {
      if (piece.etat === "selectionAjout" || piece.etat === "selectionSuppression") delete piece.etat;
    }
    return { action: "deplace" };
  }

  return { action: "selection" };
}

/** L'« enlever dans chaque membre » est-il possible avec la sélection courante ? */
export function enleverPossible(etat) {
  const parLigne = [0, 1].map((l) => etat.selection.filter((s) => s.ligne === l));
  if (!parLigne[0].length || !parLigne[1].length) return false;
  const bilan = parLigne.map((liste) => {
    let x = 0, somme = 0;
    for (const { ligne, indice } of liste) {
      const piece = etat.lignes[ligne].pieces[indice];
      if (piece.type === "inconnue") x += 1;
      else somme += piece.valeur;
    }
    return { x, somme };
  });
  return bilan[0].x === bilan[1].x && bilan[0].somme === bilan[1].somme;
}

/** Enlève la sélection (même quantité exigée des deux côtés). */
export function enleverSelection(etat) {
  if (etat.mode !== "enlever") throw new Error("passer en mode « enlever » d'abord");
  if (!enleverPossible(etat)) {
    throw new Error("il faut sélectionner la même quantité en haut et en bas (autant d'inconnues, même somme)");
  }
  memoriser(etat);
  // texte de l'opération pour la rédaction : « −2x », « −6 », « −(2x + 6) »
  const enleves = etat.selection.filter((s) => s.ligne === 1);
  let x = 0, somme = 0;
  for (const { ligne, indice } of enleves) {
    const piece = etat.lignes[ligne].pieces[indice];
    if (piece.type === "inconnue") x += 1;
    else somme += piece.valeur;
  }
  const termes = [];
  if (x > 0) termes.push(x === 1 ? etat.lettre : `${x}${etat.lettre}`);
  if (somme > 0) termes.push(String(somme));
  const operation =
    termes.length > 1 ? `−(${termes.join(" + ")})` : `−${termes[0]}`;
  for (const { ligne, indice } of etat.selection) {
    etat.lignes[ligne].pieces[indice].etat = "supprime";
  }
  terminerAction(etat, operation);
  return etat;
}

/** Décompose un nombre en une somme (ex. 9 → [4, 5]). */
export function decomposer(etat, ligneIdx, pieceIdx, morceaux) {
  const piece = etat.lignes[ligneIdx]?.pieces[pieceIdx];
  if (!piece || piece.type !== "nombre" || !active(piece)) {
    throw new Error("choisir un nombre encore en jeu");
  }
  if (!Array.isArray(morceaux) || morceaux.length < 2 || morceaux.some((v) => !Number.isInteger(v) || v <= 0)) {
    throw new Error("donner au moins deux entiers strictement positifs");
  }
  const somme = morceaux.reduce((s, v) => s + v, 0);
  if (somme !== piece.valeur) {
    throw new Error(`la somme fait ${somme}, il faut ${piece.valeur}`);
  }
  memoriser(etat);
  etat.lignes[ligneIdx].pieces.splice(
    pieceIdx,
    1,
    ...morceaux.map((valeur) => ({ type: "nombre", valeur })),
  );
  terminerAction(etat);
  return etat;
}

/**
 * Partage équitablement un nombre en n parts entières égales. Les parts
 * restent groupées pour que l'équation s'écrive « n × v ».
 */
let prochainGroupe = 1;
export function partager(etat, ligneIdx, pieceIdx, parts) {
  const piece = etat.lignes[ligneIdx]?.pieces[pieceIdx];
  if (!piece || piece.type !== "nombre" || !active(piece)) {
    throw new Error("choisir un nombre encore en jeu");
  }
  if (!Number.isInteger(parts) || parts < 2) throw new Error("au moins deux parts");
  if (piece.valeur % parts !== 0) {
    throw new Error(`${piece.valeur} n'est pas partageable en ${parts} parts entières égales`);
  }
  memoriser(etat);
  const groupe = `partage-${prochainGroupe++}`;
  etat.lignes[ligneIdx].pieces.splice(
    pieceIdx,
    1,
    ...Array.from({ length: parts }, () => ({ type: "nombre", valeur: piece.valeur / parts, groupe })),
  );
  terminerAction(etat);
  return etat;
}

/** Somme des nombres actuellement sélectionnés (pour le dialogue). */
export function sommeSelection(etat) {
  return etat.selection.reduce(
    (s, { ligne, indice }) => s + (etat.lignes[ligne].pieces[indice].valeur ?? 0),
    0,
  );
}

/**
 * Aide au regroupement, VERBATIM de l'outil historique
 * (buildAddSuggestions) : la bonne somme est toujours présente, avec
 * 3 distracteurs tirés de [+1, −1, +10, −10, ×2]. `melange` doit
 * mélanger une liste (fourni par l'interface, testable ici).
 */
export function aideRegroupement(somme, melange = (l) => l) {
  const distracteurs = [
    somme + 1,
    Math.max(1, somme - 1),
    somme + 10,
    Math.max(1, somme - 10),
    somme * 2,
  ].filter(
    (valeur, index, tableau) =>
      Number.isFinite(valeur) && valeur > 0 && valeur !== somme && tableau.indexOf(valeur) === index,
  );
  return melange([somme, ...melange(distracteurs).slice(0, 3)]);
}

/** Diviseurs proposés pour « partager équitablement » (2 à n parts). */
export function diviseursDe(n) {
  const diviseurs = [];
  for (let d = 2; d <= n; d++) if (n % d === 0) diviseurs.push(d);
  return diviseurs;
}

/**
 * Aide à la décomposition, fidèle à buildSuggestions de l'outil : la
 * PREMIÈRE proposition est la décomposition pédagogiquement UTILE —
 * faire apparaître un nombre déjà présent dans l'autre membre (pour
 * préparer « enlever dans chaque membre »). Elle n'est jamais
 * mélangée. Suivent jusqu'à 3 découpages valides variés.
 */
export function aideDecomposition(etat, ligneIdx, valeur, melange = (l) => l) {
  const propositions = [];
  const vues = new Set();
  const ajouter = (texte, tableau) => {
    if (texte && !vues.has(texte)) { vues.add(texte); tableau.push(texte); }
  };

  // 1. la proposition utile : un nombre actif de l'AUTRE membre
  const autre = etat.lignes[1 - ligneIdx].pieces.filter(
    (p) => p.type === "nombre" && p.etat !== "supprime" && p.valeur < valeur,
  );
  if (autre.length) {
    const cible = autre.reduce((a, b) => (b.valeur > a.valeur ? b : a)).valeur;
    ajouter(`${cible} + ${valeur - cible}`, propositions);
  }

  // 2. autres découpages valides (dizaine, valeur de x, moitié, −5, −10)
  const candidats = [];
  for (const [u, v] of [
    [10, valeur - 10],
    [etat.solution, valeur - etat.solution],
    [Math.floor(valeur / 2), valeur - Math.floor(valeur / 2)],
    [Math.max(1, valeur - 5), Math.min(valeur - 1, 5)],
    [Math.max(1, valeur - 10), Math.min(valeur - 1, 10)],
    [1, valeur - 1],
    [2, valeur - 2],
  ]) {
    if (u > 0 && v > 0 && u + v === valeur) ajouter(`${u} + ${v}`, candidats);
  }
  for (const c of melange(candidats)) {
    if (!propositions.includes(c)) propositions.push(c);
    if (propositions.length >= 4) break;
  }
  return propositions.slice(0, 4);
}

/**
 * Regroupe les nombres sélectionnés d'un même membre en leur somme.
 * C'est l'ÉLÈVE qui donne la somme (pédagogie de l'outil historique) :
 * une somme fausse est refusée avec un message clair.
 */
export function regrouperSelection(etat, sommeProposee) {
  if (etat.mode !== "regrouper") throw new Error("passer en mode « regrouper » d'abord");
  if (etat.selection.length < 2) throw new Error("sélectionner au moins deux nombres");
  const ligneIdx = etat.selection[0].ligne;
  const indices = etat.selection.map((s) => s.indice).sort((a, b) => a - b);
  const somme = indices.reduce(
    (s, i) => s + etat.lignes[ligneIdx].pieces[i].valeur,
    0,
  );
  if (sommeProposee !== undefined && sommeProposee !== somme) {
    throw new Error(`ce n'est pas la bonne somme — recompte et réessaie`);
  }
  memoriser(etat);
  const pieces = etat.lignes[ligneIdx].pieces;
  for (const i of [...indices].reverse().slice(0, -1)) pieces.splice(i, 1);
  pieces[indices[0]] = { type: "nombre", valeur: somme };
  terminerAction(etat);
  return etat;
}

/** Annule la dernière opération. */
export function annuler(etat) {
  const instantane = etat.pileAnnulation.pop();
  if (!instantane) return etat;
  etat.lignes = instantane.lignes;
  etat.historique = instantane.historique;
  etat.selection = [];
  return etat;
}

/** L'équation est-elle résolue (x = valeur seule face à des nombres) ? */
export function estResolue(etat) {
  const bilans = etat.lignes.map((ligne) => {
    const actives = ligne.pieces.filter(active);
    return {
      x: actives.filter((p) => p.type === "inconnue").length,
      nombres: actives.filter((p) => p.type === "nombre"),
    };
  });
  const [haut, bas] = bilans;
  const seulX = (m) => m.x === 1 && m.nombres.length === 0;
  const queNombres = (m) => m.x === 0;
  return (seulX(haut) && queNombres(bas)) || (seulX(bas) && queNombres(haut));
}
