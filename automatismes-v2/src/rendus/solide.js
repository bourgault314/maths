import { COURS_SOLIDES_USUELS } from "../../../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=7";
import { rendreChoix } from "./reponse-choix.js?v=7";
import {
  echapper,
  rendreEntetePanneau,
  rendreEtape,
  rendreVoile,
} from "./outils-rendu.js?v=7";
import {
  blocSolide,
  commandesRotation,
  rendreSolide,
} from "./solides.js?v=7";

function rendreQuestion({ etat, question, nomNotion, rendreActionsEleve }) {
  const bloc = blocSolide(question);
  const interactif = etat.configuration.mode === "interactif";
  return `<main class="carte-question carte-question-solides">
    <p class="etiquette-notion">${echapper(nomNotion)}</p>
    <h1>${echapper(question.enonce[0].contenu)}</h1>
    ${rendreSolide(bloc, { taille: interactif ? 320 : 400 })}
    <p class="precision">${interactif ? "Choisis une seule réponse." : "Choisissez le nom du solide."}</p>
    <div class="grille-choix grille-solides ${interactif ? "" : "grille-projection"}"
      role="${interactif ? "radiogroup" : "group"}" aria-label="Noms proposés">
      ${rendreChoix({ etat, question })}
    </div>
    ${interactif ? `<div class="zone-actions">${rendreActionsEleve()}</div>` : ""}
  </main>`;
}

function rendreAide({ etat, question }) {
  if (!etat.aideOuverte) return "";
  const bloc = blocSolide(question);
  const indice = question.aide?.blocs?.[0]?.contenu ?? "Observe la forme du solide.";
  return `${rendreVoile("fermer-aide")}
    <aside class="panneau panneau-aide panneau-solides" id="panneau-aide" aria-labelledby="titre-aide">
      ${rendreEntetePanneau({
        idTitre: "titre-aide",
        titre: "Observe sans deviner",
        actionFermer: "fermer-aide",
      })}
      <section class="outil-aide outil-solide">
        ${rendreEtape(1, indice, "repere-observation")}
        ${rendreSolide(bloc, { taille: 360, manipulable: true, rotation: etat.rotationSolide })}
        ${commandesRotation()}
        <p class="consigne-manipulation">Fais glisser la figure ou utilise les boutons. Le nom n'est pas révélé.</p>
      </section>
      <section class="indices-aide">
        <h3>Ce qu'il faut regarder</h3>
        <p>Les faces planes, les surfaces courbes et la présence éventuelle d'un sommet en pointe.</p>
      </section>
    </aside>`;
}

function rendreCorrection({ etat, question }) {
  if (!etat.correctionOuverte) return "";
  const bloc = blocSolide(question);
  const propriete = question.correction?.[0]?.contenu ?? "";
  const conclusion = question.correction?.[1]?.contenu ?? "";
  return `${rendreVoile("fermer-correction")}
    <aside class="panneau panneau-correction panneau-solides" id="panneau-correction" aria-labelledby="titre-correction">
      ${rendreEntetePanneau({
        idTitre: "titre-correction",
        titre: "Correction expliquée",
        actionFermer: "fermer-correction",
      })}
      <section class="etape-correction correction-observation">
        ${rendreEtape(1, "Observer les propriétés", "repere-observation")}
        ${rendreSolide(bloc, { taille: 320, mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme) })}
        <p>${echapper(propriete)}</p>
      </section>
      <section class="etape-correction correction-conclusion">
        ${rendreEtape(2, "Nommer le solide", "repere-conclusion")}
        <p class="conclusion-solide">${echapper(conclusion)}</p>
      </section>
    </aside>`;
}

function rendreCours({ etat }) {
  if (!etat.coursOuvert) return "";
  return `${rendreVoile("fermer-cours")}
    <aside class="panneau panneau-cours" id="panneau-cours" aria-labelledby="titre-cours">
      ${rendreEntetePanneau({
        idTitre: "titre-cours",
        titre: "Les six solides à reconnaître",
        actionFermer: "fermer-cours",
        surtitre: "Mémo visuel",
      })}
      <p class="introduction-cours">On reconnaît un solide grâce à ses propriétés, pas grâce à sa position sur l'écran. Tourne les figures pour le vérifier.</p>
      ${commandesRotation()}
      <div class="grille-cours-solides">
        ${COURS_SOLIDES_USUELS.map((solide) => `<article class="carte-cours-solide">
          <h3>${echapper(solide.nom)}</h3>
          ${rendreSolide({ ...solide, vue: { lacetDeg: -34, tangageDeg: 18 } }, {
            taille: 240,
            manipulable: true,
            rotation: etat.rotationSolide,
            mettreBasesEnValeur: ["prisme", "cylindre"].includes(solide.forme),
          })}
          <p>${echapper(solide.phrase)}</p>
        </article>`).join("")}
      </div>
    </aside>`;
}

export const RENDU_SOLIDE = Object.freeze({
  question: rendreQuestion,
  aide: rendreAide,
  correction: rendreCorrection,
  cours: rendreCours,
});
