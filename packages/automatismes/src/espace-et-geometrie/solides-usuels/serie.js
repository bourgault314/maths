import {
  apparierProfilsSansDoublon,
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=51";
import { validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=51";
import { GABARIT_RECONNAISSANCE_SOLIDES } from "./reconnaissance.js?v=51";

export const VERSION_PLAN_SERIE_SOLIDES_USUELS = 1;

export const PAQUET_PROFILS_SOLIDES_USUELS = definirPaquetPondere({
  id: "ge12-profils",
  profils: [
    { id: "cube-standard", quota: 4, categorie: "principale", forme: "cube", variante: "standard" },
    { id: "pave-allonge", quota: 2, categorie: "principale", forme: "pave", variante: "allonge" },
    { id: "pave-haut", quota: 2, categorie: "principale", forme: "pave", variante: "haut" },
    { id: "prisme-triangle", quota: 2, categorie: "secondaire", forme: "prisme", variante: "triangle" },
    { id: "prisme-pentagone", quota: 1, categorie: "secondaire", forme: "prisme", variante: "pentagone" },
    { id: "cylindre-standard", quota: 2, categorie: "secondaire", forme: "cylindre", variante: "standard" },
    { id: "cylindre-bas", quota: 1, categorie: "secondaire", forme: "cylindre", variante: "bas" },
    { id: "pyramide-carree", quota: 2, categorie: "secondaire", forme: "pyramide", variante: "carree" },
    { id: "pyramide-triangulaire", quota: 1, categorie: "rare", forme: "pyramide", variante: "triangulaire" },
    { id: "cone-standard", quota: 2, categorie: "secondaire", forme: "cone", variante: "standard" },
    { id: "cone-large", quota: 1, categorie: "rare", forme: "cone", variante: "large" },
  ],
});

export const PAQUET_VUES_SOLIDES_USUELS = definirPaquetPondere({
  id: "ge12-vues",
  profils: [
    { id: "vue-0", quota: 5, categorie: "principale", vueIndex: 0 },
    { id: "vue-1", quota: 5, categorie: "principale", vueIndex: 1 },
    { id: "vue-2", quota: 5, categorie: "principale", vueIndex: 2 },
    { id: "vue-3", quota: 5, categorie: "principale", vueIndex: 3 },
  ],
});

function exigerConfiguration(graine, nombreQuestions) {
  validerGraine(graine);
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) {
    throw new RangeError("serie solides-usuels : longueur entre 1 et 20 requise");
  }
}

export function planifierSerieSolidesUsuels({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  const profils = ordonnerEnLimitantRepetitions({
    elements: tirerProfilsPonderes({
      paquet: PAQUET_PROFILS_SOLIDES_USUELS,
      graine: `ge12-profils-v${VERSION_PLAN_SERIE_SOLIDES_USUELS}:${graine}`,
      nombreElements: nombreQuestions,
    }),
    graine: `ge12-ordre-v${VERSION_PLAN_SERIE_SOLIDES_USUELS}:${graine}`,
    cle: ({ forme }) => forme,
  });
  let vues;
  for (let essai = 0; essai < 60; essai += 1) {
    const candidates = tirerProfilsPonderes({
      paquet: PAQUET_VUES_SOLIDES_USUELS,
      graine: `ge12-vues-v${VERSION_PLAN_SERIE_SOLIDES_USUELS}:${graine}:essai-${essai}`,
      nombreElements: nombreQuestions,
    });
    try {
      vues = apparierProfilsSansDoublon({
        elements: profils,
        profils: candidates,
        graine: `ge12-vues-appariement-v${VERSION_PLAN_SERIE_SOLIDES_USUELS}:${graine}:${essai}`,
        cleElement: ({ id }) => id,
        cleProfil: ({ id }) => id,
      });
      break;
    } catch (erreur) {
      if (!String(erreur.message).startsWith("appariement sans doublon")) throw erreur;
    }
  }
  if (!vues) throw new Error("serie solides-usuels : vues distinctes introuvables");
  return profils.map((profil, position) => ({
    position,
    forme: profil.forme,
    variante: profil.variante,
    vueIndex: vues[position].vueIndex,
    gabarit: GABARIT_RECONNAISSANCE_SOLIDES,
    parametres: {
      forme: profil.forme,
      variante: profil.variante,
      vueIndex: vues[position].vueIndex,
    },
  }));
}

export function signatureVisibleQuestionSolides(question) {
  return JSON.stringify({ enonce: question.enonce });
}

export function genererSerieSolidesUsuels({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError("serie solides-usuels : registre requis");
  }
  const signatures = new Set();
  return planifierSerieSolidesUsuels({ graine, nombreQuestions }).map((element, index) => {
    for (let essai = 0; essai < 40; essai += 1) {
      const question = registre.instancier(
        { ...element.gabarit, parametres: { ...element.parametres } },
        `${graine}:${index + 1}:${essai}`,
      );
      const signature = signatureVisibleQuestionSolides(question);
      if (!signatures.has(signature)) {
        signatures.add(signature);
        return question;
      }
    }
    throw new Error(`serie solides-usuels : doublon visible à la position ${index + 1}`);
  });
}
