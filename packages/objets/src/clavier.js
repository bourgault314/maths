// Clavier maths&go commun aux saisies tactiles.
//
// Une disposition décrit uniquement les touches utiles à une réponse. Le
// lecteur choisit la disposition adaptée : les touches prévues pour les
// décimaux ou les calculs ne sont donc jamais affichées sur une question qui
// attend seulement un entier naturel.

export const VERSION_CLAVIER = 2;

export const ACTION_TOUCHE_SAISIR = "saisir";
export const ACTION_TOUCHE_EFFACER = "effacer";
export const ACTION_TOUCHE_VALIDER = "valider";

const toucheSaisie = (valeur, options = {}) => Object.freeze({
  id: options.id ?? `saisir-${valeur}`,
  libelle: options.libelle ?? valeur,
  valeur,
  action: ACTION_TOUCHE_SAISIR,
  classe: options.classe ?? "",
  ariaLabel: options.ariaLabel ?? "",
});

const toucheAction = (id, libelle, action, options = {}) => Object.freeze({
  id,
  libelle,
  action,
  classe: options.classe ?? "",
  ariaLabel: options.ariaLabel ?? libelle,
});

const chiffresTelephone = Object.freeze(
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((chiffre) => toucheSaisie(String(chiffre))),
);

const effacer = toucheAction(
  "effacer",
  "Effacer",
  ACTION_TOUCHE_EFFACER,
  { classe: "touche-effacer", ariaLabel: "Effacer le dernier caractère" },
);
const valider = toucheAction(
  "valider",
  "Valider",
  ACTION_TOUCHE_VALIDER,
  { classe: "touche-valider" },
);

function figerDisposition({ id, colonnes, touches }) {
  return Object.freeze({ id, colonnes, touches: Object.freeze(touches) });
}

export const DISPOSITIONS_CLAVIER = Object.freeze({
  "entier-naturel": figerDisposition({
    id: "entier-naturel",
    colonnes: 3,
    touches: [...chiffresTelephone, effacer, toucheSaisie("0"), valider],
  }),
  // Préparée pour les futures réponses décimales. Elle n'est pas utilisée par
  // NC-01 et ses touches restent donc invisibles aujourd'hui.
  "nombre-decimal": figerDisposition({
    id: "nombre-decimal",
    colonnes: 3,
    touches: [
      ...chiffresTelephone,
      effacer,
      toucheSaisie("0"),
      toucheSaisie(",", { id: "virgule", ariaLabel: "Virgule décimale" }),
      toucheSaisie("−", { id: "signe-moins", ariaLabel: "Signe moins" }),
      valider,
    ],
  }),
  // Disposition plus large prévue pour un futur champ de calcul libre.
  calcul: figerDisposition({
    id: "calcul",
    colonnes: 4,
    touches: [
      toucheSaisie("7"), toucheSaisie("8"), toucheSaisie("9"), toucheSaisie("+"),
      toucheSaisie("4"), toucheSaisie("5"), toucheSaisie("6"), toucheSaisie("−"),
      toucheSaisie("1"), toucheSaisie("2"), toucheSaisie("3"), toucheSaisie(","),
      toucheSaisie("0"), toucheSaisie("×"), effacer, valider,
    ],
  }),
});

const ALIAS_DISPOSITIONS = Object.freeze({
  nombres: "entier-naturel",
});

export function obtenirDispositionClavier(id = "entier-naturel") {
  const idNormalise = ALIAS_DISPOSITIONS[id] ?? id;
  const disposition = DISPOSITIONS_CLAVIER[idNormalise];
  if (!disposition) {
    throw new RangeError(`obtenirDispositionClavier : disposition inconnue « ${id} »`);
  }
  return disposition;
}

function valeurHistoriqueTouche(touche) {
  if (touche.action === ACTION_TOUCHE_EFFACER) return "⌫";
  if (touche.action === ACTION_TOUCHE_VALIDER) return "OK";
  return touche.valeur;
}

// Compatibilité avec les outils qui lisaient encore la table de la version 1.
export const DISPOSITIONS = Object.freeze({
  nombres: Object.freeze(
    DISPOSITIONS_CLAVIER["entier-naturel"].touches.map(valeurHistoriqueTouche),
  ),
  calcul: Object.freeze(
    DISPOSITIONS_CLAVIER.calcul.touches.map(valeurHistoriqueTouche),
  ),
});

/**
 * Fabrique DOM conservée pour les autres outils maths&go.
 * @param {HTMLElement} conteneur
 * @param {object} options
 * @param {"entier-naturel" | "nombre-decimal" | "nombres" | "calcul"} [options.disposition]
 * @param {(touche: string) => void} options.surTouche
 * @returns {{ detruire: () => void }}
 */
export function creerClavier(
  conteneur,
  { disposition = "entier-naturel", surTouche } = {},
) {
  if (!conteneur || typeof conteneur.appendChild !== "function") {
    throw new TypeError("creerClavier : un élément conteneur est requis");
  }
  if (typeof surTouche !== "function") {
    throw new TypeError("creerClavier : la fonction surTouche est requise");
  }
  const configuration = obtenirDispositionClavier(disposition);
  const racine = conteneur.ownerDocument.createElement("div");
  racine.className = "clavier-mathsgo";
  racine.setAttribute("role", "group");
  racine.setAttribute("aria-label", "Clavier de saisie");
  racine.dataset.colonnes = String(configuration.colonnes);

  for (const touche of configuration.touches) {
    const bouton = conteneur.ownerDocument.createElement("button");
    bouton.type = "button";
    bouton.className = [
      "clavier-touche",
      touche.classe,
      touche.action === ACTION_TOUCHE_VALIDER ? "clavier-valider" : "",
    ].filter(Boolean).join(" ");
    bouton.dataset.touche = valeurHistoriqueTouche(touche);
    bouton.textContent = touche.libelle;
    if (touche.ariaLabel) bouton.setAttribute("aria-label", touche.ariaLabel);
    bouton.addEventListener("click", () => {
      if (touche.action === ACTION_TOUCHE_EFFACER) surTouche("⌫");
      else if (touche.action === ACTION_TOUCHE_VALIDER) surTouche("OK");
      else surTouche(touche.valeur);
    });
    racine.appendChild(bouton);
  }

  conteneur.appendChild(racine);
  return { detruire: () => racine.remove() };
}
