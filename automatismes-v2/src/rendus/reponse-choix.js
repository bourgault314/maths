import { echapper } from "./outils-rendu.js?v=9";

export function rendreChoix({ etat, question }) {
  const interactif = etat.configuration.mode === "interactif";
  const choixVisibles = interactif
    ? question.reponse.choix
    : question.reponse.choix.filter((choix) => !choix.exclusif);

  return choixVisibles.map((choix) => {
    const selectionne = etat.selection.includes(choix.id);
    const attendu = question.reponse.attendus.includes(choix.id);
    const reveleCorrect = !interactif && etat.reponseRevelee && attendu;
    const estompe = !interactif && etat.reponseRevelee && !attendu;
    const classes = [
      "choix",
      selectionne ? "selectionne" : "",
      reveleCorrect ? "correct" : "",
      estompe ? "estompe" : "",
    ].filter(Boolean).join(" ");

    if (!interactif) {
      return `<div class="${classes}">
        ${reveleCorrect ? '<span class="coche" aria-hidden="true">✓</span>' : ""}
        <span>${echapper(choix.libelle)}</span>
        ${reveleCorrect ? '<span class="visuellement-cache">Correct</span>' : ""}
      </div>`;
    }

    const radio = question.reponse.type === "choix-unique";
    return `<button class="${classes}" data-action="choix" data-id="${echapper(choix.id)}"
      role="${radio ? "radio" : "checkbox"}" aria-checked="${selectionne}"
      aria-pressed="${selectionne}" ${etat.validation === null ? "" : "disabled"}>
      ${echapper(choix.libelle)}
    </button>`;
  }).join("");
}
