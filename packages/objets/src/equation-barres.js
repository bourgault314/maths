// Équation → schéma en barres : le cœur automatique d'ÉquaBarre,
// porté proprement. STATUT BROUILLON.
//
// Règles reprises de l'outil historique (outils/equabarre.html) :
// - entiers strictement positifs uniquement, une seule lettre
//   d'inconnue, opérations + et × (implicite autorisé : 2x, 2(x+3)),
//   parenthèses ;
// - la multiplication est une RÉPÉTITION de morceaux : 3x → trois
//   cases x ; 2(x+3) → x, 3, x, 3 ;
// - membre gauche de l'équation → ligne du BAS, membre droit → ligne
//   du HAUT (comme dans l'outil) ;
// - la solution doit être un entier strictement positif, sinon refus
//   avec message clair ;
// - chaque case inconnue pèse la solution : les deux lignes du schéma
//   ont alors exactement la même longueur.

export const VERSION_EQUATION_BARRES = 1;

// Garde-fous IMMÉDIATS (pas après coup) : une équation hostile comme
// « 100000000x = … » ne doit jamais créer des millions de cases.
export const MAX_CASES = 80;
export const MAX_LONGUEUR_EQUATION = 120;

function analyserMembre(texte, position0) {
  // Grammaire : expr := terme (+ terme)* ; terme := facteur (×? facteur)* ;
  // facteur := entier | lettre | ( expr )
  // Chaque niveau renvoie { pieces, lettres, nombres } où pieces est la
  // liste ordonnée de cases { type: "nombre"|"inconnue", valeur? }.
  let i = 0;
  const texteSansEspaces = texte.replace(/\s+/g, "");
  const erreur = (message) => {
    throw new RangeError(`équation, caractère ${position0 + i + 1} : ${message}`);
  };

  const facteur = () => {
    const c = texteSansEspaces[i];
    if (c === "(") {
      i += 1;
      const contenu = expr();
      if (texteSansEspaces[i] !== ")") erreur("parenthèse fermante attendue");
      i += 1;
      return contenu;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < texteSansEspaces.length && /[0-9]/.test(texteSansEspaces[j])) j += 1;
      const valeur = Number(texteSansEspaces.slice(i, j));
      if (texteSansEspaces[j] === "." || texteSansEspaces[j] === ",") {
        erreur("nombres entiers uniquement (pas de décimaux)");
      }
      if (valeur === 0) erreur("les valeurs doivent être strictement positives");
      i = j;
      return [{ type: "nombre", valeur }];
    }
    if (/[a-z]/i.test(c ?? "")) {
      i += 1;
      return [{ type: "inconnue", lettre: c.toLowerCase() }];
    }
    if (c === "-" || c === "−") erreur("les soustractions et négatifs ne sont pas gérés");
    erreur(`symbole inattendu « ${c ?? "fin" } »`);
  };

  const terme = () => {
    let resultat = facteur();
    for (;;) {
      const c = texteSansEspaces[i];
      const multiplicationExplicite = c === "*" || c === "×" || c === "·";
      const multiplicationImplicite =
        c !== undefined && (/[0-9a-z(]/i.test(c)) && c !== ")";
      if (!multiplicationExplicite && !multiplicationImplicite) return resultat;
      if (multiplicationExplicite) i += 1;
      const droite = facteur();
      // répétition : le côté qui est un nombre pur répète l'autre côté.
      // Le plafond est vérifié AVANT de créer le moindre tableau.
      const nombrePur = (liste) => liste.length === 1 && liste[0].type === "nombre";
      const repeter = (fois, morceauxARepeter) => {
        if (fois * morceauxARepeter.length > MAX_CASES) {
          erreur(`multiplication trop grande (maximum ${MAX_CASES} cases)`);
        }
        return Array.from({ length: fois }, () =>
          morceauxARepeter.map((p) => ({ ...p })),
        ).flat();
      };
      if (nombrePur(resultat)) {
        resultat = repeter(resultat[0].valeur, droite);
      } else if (nombrePur(droite)) {
        resultat = repeter(droite[0].valeur, resultat);
      } else {
        erreur("multiplication entre deux expressions à inconnue non gérée");
      }
    }
  };

  const expr = () => {
    const morceaux = [...terme()];
    while (texteSansEspaces[i] === "+") {
      i += 1;
      morceaux.push(...terme());
    }
    return morceaux;
  };

  const pieces = expr();
  if (i < texteSansEspaces.length) {
    if (texteSansEspaces[i] === "-" || texteSansEspaces[i] === "−") {
      erreur("les soustractions et négatifs ne sont pas gérés");
    }
    erreur(`symbole inattendu « ${texteSansEspaces[i]} »`);
  }
  if (pieces.length > MAX_CASES) erreur(`membre trop long (${MAX_CASES} cases maximum)`);
  return pieces;
}

/**
 * Analyse une équation du langage ÉquaBarre.
 * @param {string} texte — ex. « 2 + 2x + 7 = 3x + 5 + 1 »
 * @returns {{ lettre: string, solution: number,
 *   membreGauche: Array<object>, membreDroit: Array<object> }}
 */
export function analyserEquation(texte) {
  if (typeof texte !== "string" || !texte.includes("=")) {
    throw new RangeError("équation : un signe = est requis");
  }
  if (texte.length > MAX_LONGUEUR_EQUATION) {
    throw new RangeError(`équation : trop longue (maximum ${MAX_LONGUEUR_EQUATION} caractères)`);
  }
  const [gauche, droite, ...reste] = texte.split("=");
  if (reste.length > 0) throw new RangeError("équation : un seul signe = attendu");

  const membreGauche = analyserMembre(gauche, 0);
  const membreDroit = analyserMembre(droite, gauche.length + 1);

  const lettres = new Set(
    [...membreGauche, ...membreDroit]
      .filter((p) => p.type === "inconnue")
      .map((p) => p.lettre),
  );
  if (lettres.size === 0) throw new RangeError("équation : aucune inconnue trouvée");
  if (lettres.size > 1) {
    throw new RangeError(`équation : une seule lettre d'inconnue attendue (trouvé : ${[...lettres].join(", ")})`);
  }
  const lettre = [...lettres][0];

  const somme = (liste) =>
    liste.filter((p) => p.type === "nombre").reduce((s, p) => s + p.valeur, 0);
  const compteX = (liste) => liste.filter((p) => p.type === "inconnue").length;

  const denominateur = compteX(membreGauche) - compteX(membreDroit);
  if (denominateur === 0) {
    throw new RangeError("équation : autant d'inconnues des deux côtés, impossible à résoudre");
  }
  const solution = (somme(membreDroit) - somme(membreGauche)) / denominateur;
  if (!Number.isInteger(solution) || solution <= 0) {
    throw new RangeError(
      `équation : la solution doit être un entier strictement positif (ici ${lettre} = ${solution})`,
    );
  }

  return { lettre, solution, membreGauche, membreDroit };
}

/**
 * Transforme une équation en données prêtes pour dessinerBarres :
 * membre droit en haut, membre gauche en bas, inconnue pesant sa
 * solution — exactement la construction d'ÉquaBarre.
 * @param {string} texte
 * @param {{ affichage?: "lettre" | "question" | "splat" }} [options]
 */
export function barresDepuisEquation(texte, options = {}) {
  const { lettre, solution, membreGauche, membreDroit } = analyserEquation(texte);
  const enPieces = (liste) =>
    liste.map((p) =>
      p.type === "inconnue" ? { type: "inconnue" } : { type: "nombre", valeur: p.valeur },
    );
  return {
    lignes: [{ pieces: enPieces(membreDroit) }, { pieces: enPieces(membreGauche) }],
    inconnue: { affichage: options.affichage ?? "lettre", lettre, valeur: solution },
    solution,
    lettre,
  };
}
