// Objet officiel « clavier » — version 1, BROUILLON.
//
// Le petit clavier fourni EN BAS, décision de Gwenaël : on ne laisse
// pas le clavier natif du téléphone s'ouvrir — l'élève tape sur NOS
// touches. Le même objet servira partout : dialogues d'ÉquaBarre,
// réponses des questions du futur diaporama, exercices sur téléphone.
//
// C'est un objet d'INTERFACE (il a besoin de la page) : la fabrique
// crée les touches dans un conteneur et rappelle `surTouche` à chaque
// appui. Aucune dépendance, styles portés par la page hôte via les
// classes `clavier-mathsgo` et `clavier-touche`.

export const VERSION_CLAVIER = 1;

export const DISPOSITIONS = {
  nombres: ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "⌫", "OK"],
  calcul: ["7", "8", "9", "+", "4", "5", "6", "−", "1", "2", "3", ",", "0", "×", "⌫", "OK"],
};

/**
 * Crée un clavier dans `conteneur`.
 * @param {HTMLElement} conteneur
 * @param {object} options
 * @param {"nombres" | "calcul"} [options.disposition]
 * @param {(touche: string) => void} options.surTouche — reçoit chaque
 *   appui : un caractère, « ⌫ » (effacer) ou « OK » (valider)
 * @returns {{ detruire: () => void }}
 */
export function creerClavier(conteneur, { disposition = "nombres", surTouche } = {}) {
  if (!conteneur || typeof conteneur.appendChild !== "function") {
    throw new TypeError("creerClavier : un élément conteneur est requis");
  }
  if (typeof surTouche !== "function") {
    throw new TypeError("creerClavier : la fonction surTouche est requise");
  }
  const touches = DISPOSITIONS[disposition];
  if (!touches) {
    throw new RangeError(`creerClavier : disposition inconnue « ${disposition} »`);
  }

  const racine = conteneur.ownerDocument.createElement("div");
  racine.className = "clavier-mathsgo";
  racine.setAttribute("role", "group");
  racine.setAttribute("aria-label", "clavier de saisie");
  racine.dataset.colonnes = disposition === "calcul" ? "4" : "3";

  for (const touche of touches) {
    const bouton = conteneur.ownerDocument.createElement("button");
    bouton.type = "button";
    bouton.className = "clavier-touche";
    bouton.dataset.touche = touche;
    bouton.textContent = touche;
    if (touche === "⌫") bouton.setAttribute("aria-label", "effacer");
    if (touche === "OK") {
      bouton.classList.add("clavier-valider");
      bouton.setAttribute("aria-label", "valider");
    }
    bouton.addEventListener("click", () => surTouche(touche));
    racine.appendChild(bouton);
  }

  conteneur.appendChild(racine);
  return { detruire: () => racine.remove() };
}
