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
  rendreDonneesVolume,
  rendreEmpilementCubes,
  rendreSolide,
} from "./solides.js?v=7";

function rendreQuestion({ etat, question, nomNotion, rendreActionsEleve }) {
  const bloc = blocSolide(question);
  const interactif = etat.configuration.mode === "interactif";
  return `<main class="carte-question carte-question-solides carte-question-volumes">
    <p class="etiquette-notion">${echapper(nomNotion)}</p>
    <h1>${echapper(question.enonce[0].contenu)}</h1>
    <div class="figure-et-donnees">
      ${rendreSolide(bloc, {
        taille: interactif ? 290 : 360,
        mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
        afficherMesures: ["cube", "pave", "cylindre"].includes(bloc.forme),
        afficherHauteur: bloc.forme === "cylindre",
      })}
      ${rendreDonneesVolume(bloc)}
    </div>
    <p class="precision">Calcul mental, sans calculatrice. Choisis une seule réponse.</p>
    <div class="grille-choix grille-solides grille-volumes ${interactif ? "" : "grille-projection"}"
      role="${interactif ? "radiogroup" : "group"}" aria-label="Volumes proposés">
      ${rendreChoix({ etat, question })}
    </div>
    ${interactif ? `<div class="zone-actions">${rendreActionsEleve()}</div>` : ""}
  </main>`;
}

function rendreAide({ etat, question }) {
  if (!etat.aideOuverte) return "";
  const bloc = blocSolide(question);
  const aides = question.aide?.blocs ?? [];
  return `${rendreVoile("fermer-aide")}
    <aside class="panneau panneau-aide panneau-solides" id="panneau-aide" aria-labelledby="titre-aide">
      ${rendreEntetePanneau({
        idTitre: "titre-aide",
        titre: "Calcul guidé",
        actionFermer: "fermer-aide",
      })}
      <section class="outil-aide outil-solide">
        ${rendreSolide(bloc, {
          taille: 300,
          manipulable: true,
          rotation: etat.rotationSolide,
          mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
          afficherMesures: ["cube", "pave", "cylindre"].includes(bloc.forme),
          afficherHauteur: bloc.forme === "cylindre",
        })}
        ${rendreDonneesVolume(bloc)}
        ${commandesRotation()}
      </section>
      <div class="etapes-aide-volume">
        ${aides.map((aide, index) => `<section class="outil-aide">
          ${rendreEtape(index + 1, aide.contenu, index === 0 ? "repere-observation" : "")}
        </section>`).join("")}
      </div>
    </aside>`;
}

function rendreCorrection({ etat, question }) {
  if (!etat.correctionOuverte) return "";
  const titres = ["Écrire la formule", "Remplacer par les données", "Calculer", "Conclure avec l'unité"];
  return `${rendreVoile("fermer-correction")}
    <aside class="panneau panneau-correction panneau-solides" id="panneau-correction" aria-labelledby="titre-correction">
      ${rendreEntetePanneau({
        idTitre: "titre-correction",
        titre: "Correction expliquée",
        actionFermer: "fermer-correction",
      })}
      <div class="etapes-correction-volume">
        ${question.correction.map((bloc, index) => `<section class="etape-correction ${index === 3 ? "correction-conclusion" : "correction-observation"}">
          ${rendreEtape(index + 1, titres[index], index === 3 ? "repere-conclusion" : "repere-observation")}
          <p class="ligne-calcul-volume">${echapper(bloc.contenu)}</p>
        </section>`).join("")}
      </div>
    </aside>`;
}

function rendreCours({ etat, question }) {
  if (!etat.coursOuvert) return "";
  const bloc = blocSolide(question);
  const formule = bloc.forme === "cube"
    ? "V = côté × côté × côté"
    : bloc.forme === "pave"
      ? "V = longueur × largeur × hauteur"
      : bloc.forme === "prisme"
        ? "V = aire de la base × hauteur"
        : "V = π × rayon × rayon × hauteur";
  return `${rendreVoile("fermer-cours")}
    <aside class="panneau panneau-cours" id="panneau-cours" aria-labelledby="titre-cours">
      ${rendreEntetePanneau({
        idTitre: "titre-cours",
        titre: "Du cube unité à la formule",
        actionFermer: "fermer-cours",
        surtitre: "Cours à comprendre",
      })}
      <p class="introduction-cours">Le volume mesure la place occupée par un solide. On le mesure avec des cubes unité.</p>
      <div class="grille-cours-volume">
        <article class="carte-cours-solide">
          <span class="numero-cours">1</span><h3>Un cube unité</h3>
          ${rendreSolide({ forme: "cube", variante: "standard", mesures: { arete: 1, unite: "cm" }, vue: { lacetDeg: -32, tangageDeg: 18 } }, { taille: 200, afficherMesures: true })}
          <p>Un cube de côté 1 cm a un volume de <strong>1 cm³</strong>.</p>
        </article>
        <article class="carte-cours-solide">
          <span class="numero-cours">2</span><h3>Remplir sans trou</h3>
          ${rendreEmpilementCubes()}
          <p>3 × 2 × 2 = 12 cubes unité, donc le volume est <strong>12 cm³</strong>.</p>
        </article>
        <article class="carte-cours-solide carte-formule-volume">
          <span class="numero-cours">3</span><h3>L'invariant</h3>
          ${rendreSolide(bloc, {
            taille: 220,
            manipulable: true,
            rotation: etat.rotationSolide,
            mettreBasesEnValeur: ["prisme", "cylindre"].includes(bloc.forme),
          })}
          <p class="formule-volume">${echapper(formule)}</p>
          <p>La vue peut changer ; la formule et le volume ne changent pas.</p>
        </article>
      </div>
      ${commandesRotation()}
    </aside>`;
}

export const RENDU_VOLUME = Object.freeze({
  question: rendreQuestion,
  aide: rendreAide,
  correction: rendreCorrection,
  cours: rendreCours,
});
