import { rendreChoix } from "./reponse-choix.js?v=9";
import {
  echapper,
  rendreEntetePanneau,
  rendreEtape,
  rendreVoile,
} from "./outils-rendu.js?v=9";

function nombreQuestion(question) {
  return question.enonce.find((bloc) => bloc.id === "nombre")?.valeur;
}

function rendreVerdicts(question, diviseurs) {
  const attendus = new Set(question.reponse.attendus);
  return `<div class="verdicts-correction">
    ${diviseurs.map((diviseur) => {
      const juste = attendus.has(String(diviseur));
      return `<div class="verdict-correction ${juste ? "positif" : "negatif"}">
        <span>par ${diviseur}</span>
        <strong>${juste ? "Oui" : "Non"}</strong>
      </div>`;
    }).join("")}
  </div>`;
}

function rendreQuestion({ etat, question, nomNotion, rendreActionsEleve }) {
  const nombre = nombreQuestion(question);
  const interactif = etat.configuration.mode === "interactif";
  const sansDiviseur = question.reponse.attendus.includes("aucun");
  return `<main class="carte-question">
    <p class="etiquette-notion">${echapper(nomNotion)}</p>
    <h1>${echapper(question.enonce[0].contenu)}</h1>
    <p class="nombre-question">${echapper(nombre)}<span aria-hidden="true">.</span></p>
    <p class="precision">${interactif ? "Plusieurs réponses sont peut-être possibles." : "Quels nombres proposés conviennent ?"}</p>
    <div class="grille-choix ${interactif ? "" : "grille-projection"}" aria-label="Réponses proposées">
      ${rendreChoix({ etat, question })}
    </div>
    ${!interactif && etat.reponseRevelee && sansDiviseur
      ? '<p class="reponse-aucun" role="status">Réponse : aucun des nombres proposés.</p>'
      : ""}
    ${interactif ? `<div class="zone-actions">${rendreActionsEleve()}</div>` : ""}
  </main>`;
}

function rendreAide({ etat, question }) {
  if (!etat.aideOuverte) return "";
  const nombre = String(nombreQuestion(question));
  const blocs = question.aide?.blocs ?? [];
  const expression = etat.chiffresSomme.length === 0
    ? `${[...nombre].map(() => "□").join(" + ")} = □`
    : `${etat.chiffresSomme.map((index) => nombre[index]).join(" + ")} = □`;
  const chiffresSomme = [...nombre].map((chiffre, index) => `
    <button class="chiffre-aide ${etat.chiffresSomme.includes(index) ? "actif" : ""}"
      data-action="chiffre-aide" data-index="${index}" aria-pressed="${etat.chiffresSomme.includes(index)}">
      ${chiffre}
    </button>`).join("");
  const unite = nombre.at(-1);
  return `${rendreVoile("fermer-aide")}
    <aside class="panneau panneau-aide" id="panneau-aide" aria-labelledby="titre-aide">
      ${rendreEntetePanneau({
        idTitre: "titre-aide",
        titre: "Un coup de pouce",
        actionFermer: "fermer-aide",
      })}
      <section class="outil-aide outil-unites">
        ${rendreEtape(1, blocs[0]?.contenu ?? "Observe le chiffre des unités.", "repere-unites")}
        <div class="nombre-aide" aria-label="Nombre ${nombre}">
          ${nombre.slice(0, -1).split("").map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <button data-action="unite-aide" class="unite-aide ${etat.uniteReperee ? "actif" : ""}"
            aria-pressed="${etat.uniteReperee}" aria-label="Chiffre des unités : ${unite}">${unite}</button>
        </div>
        <p class="consigne-manipulation">Appuie sur le chiffre à observer.</p>
      </section>
      <section class="outil-aide outil-somme">
        ${rendreEtape(2, blocs[1]?.contenu ?? "Additionne tous les chiffres.", "repere-somme")}
        <div class="chiffres-aide">${chiffresSomme}</div>
        <output class="expression-aide">${echapper(expression)}</output>
        <p class="consigne-manipulation">Appuie sur les chiffres pour construire la somme.</p>
      </section>
      <section class="indices-aide">
        <h3>À vérifier ensuite</h3>
        <ul>${blocs.slice(2).map((bloc) => `<li>${echapper(bloc.contenu)}</li>`).join("")}</ul>
      </section>
    </aside>`;
}

function rendreCorrection({ etat, question }) {
  if (!etat.correctionOuverte) return "";
  const nombre = String(nombreQuestion(question));
  const chiffres = [...nombre];
  const somme = chiffres.reduce((total, chiffre) => total + Number(chiffre), 0);
  const attendus = question.reponse.attendus;
  const reponses = attendus.includes("aucun") ? ["Aucun"] : attendus;
  return `${rendreVoile("fermer-correction")}
    <aside class="panneau panneau-correction" id="panneau-correction" aria-labelledby="titre-correction">
      ${rendreEntetePanneau({
        idTitre: "titre-correction",
        titre: "Correction expliquée",
        actionFermer: "fermer-correction",
      })}
      <section class="etape-correction correction-unites">
        ${rendreEtape(1, "Regarder le chiffre des unités", "repere-unites")}
        <div class="nombre-correction" aria-label="Le chiffre des unités de ${nombre} est ${nombre.at(-1)}">
          ${chiffres.slice(0, -1).map((chiffre) => `<span>${chiffre}</span>`).join("")}
          <strong>${nombre.at(-1)}</strong>
        </div>
        ${rendreVerdicts(question, [2, 5, 10])}
        <p>${echapper(question.correction[0]?.contenu ?? "")}</p>
      </section>
      <section class="etape-correction correction-somme">
        ${rendreEtape(2, "Additionner tous les chiffres", "repere-somme")}
        <p class="calcul-correction">${echapper(chiffres.join(" + "))} <span>=</span> <strong>${somme}</strong></p>
        ${rendreVerdicts(question, [3, 9])}
        <p>${echapper(question.correction[1]?.contenu ?? "")}</p>
      </section>
      <section class="etape-correction correction-conclusion">
        ${rendreEtape(3, "Conclure", "repere-conclusion")}
        <div class="reponses-correction" aria-label="Réponse correcte">
          ${reponses.map((reponse) => `<strong>${echapper(reponse)}</strong>`).join("")}
        </div>
        <p>${echapper(question.correction[2]?.contenu ?? "")}</p>
      </section>
    </aside>`;
}

export const RENDU_DIVISIBILITE = Object.freeze({
  question: rendreQuestion,
  aide: rendreAide,
  correction: rendreCorrection,
});
