import { validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=53";
import {
  apparierProfilsSansDoublon,
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=53";
import {
  GABARIT_VOLUME_CUBE_PAVE,
  GABARIT_VOLUME_CYLINDRE,
  GABARIT_VOLUME_PRISME,
} from "./calcul-volumes.js?v=53";

export const VERSION_PLANS_SERIES_VOLUMES = 1;

export const PAQUET_FORMES_VOLUME_CUBE_PAVE = definirPaquetPondere({
  id: "gm13-formes",
  profils: [
    { id: "cube", quota: 10, categorie: "principale", forme: "cube" },
    { id: "pave", quota: 10, categorie: "principale", forme: "pave" },
  ],
});

export const PAQUET_MODES_VOLUME_CYLINDRE = definirPaquetPondere({
  id: "gm15-modes",
  profils: [
    { id: "exact", quota: 10, categorie: "principale", mode: "exact" },
    { id: "approximation", quota: 10, categorie: "principale", mode: "approximation" },
  ],
});

export const PAQUET_DONNEES_VOLUMES = definirPaquetPondere({
  id: "gm13-gm15-donnees",
  profils: Array.from({ length: 5 }, (_, donneesIndex) => ({
    id: `donnees-${donneesIndex}`,
    quota: 4,
    categorie: donneesIndex < 3 ? "principale" : "secondaire",
    donneesIndex,
  })),
});

export const PAQUET_VUES_VOLUMES = definirPaquetPondere({
  id: "gm13-gm15-vues",
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
    throw new RangeError("serie volumes : longueur entre 1 et 20 requise");
  }
}

function dimensions(graine, nombreQuestions, principales = {}) {
  const donnees = tirerProfilsPonderes({
    paquet: PAQUET_DONNEES_VOLUMES,
    graine: `${graine}:dimension-donnees`,
    nombreElements: nombreQuestions,
  });
  const dimensionsPrincipales = Object.fromEntries(
    Object.entries(principales).sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([nom, paquet]) => [nom, tirerProfilsPonderes({
        paquet,
        graine: `${graine}:dimension-${nom}`,
        nombreElements: nombreQuestions,
      })]),
  );
  let vues;
  for (let essai = 0; essai < 60; essai += 1) {
    const candidates = tirerProfilsPonderes({
      paquet: PAQUET_VUES_VOLUMES,
      graine: `${graine}:dimension-vue:essai-${essai}`,
      nombreElements: nombreQuestions,
    });
    try {
      vues = apparierProfilsSansDoublon({
        elements: donnees,
        profils: candidates,
        graine: `${graine}:appariement-donnees-vues:${essai}`,
        cleElement: ({ id }) => id,
        cleProfil: ({ id }) => id,
      });
      break;
    } catch (erreur) {
      if (!String(erreur.message).startsWith("appariement sans doublon")) throw erreur;
    }
  }
  if (!vues) throw new Error("serie volumes : couples données-vues distincts introuvables");
  return donnees.map((donnee, index) => ({
    donnees: donnee,
    vue: vues[index],
    ...Object.fromEntries(
      Object.entries(dimensionsPrincipales).map(([nom, profils]) => [nom, profils[index]]),
    ),
  }));
}

function finaliserPlan(elements, { gabarit, graine, clePrincipale = null }) {
  const ordonnes = clePrincipale === null
    ? ordonnerEnLimitantRepetitions({
        elements,
        graine: `${gabarit.id}:ordre-donnees:${graine}`,
        cle: ({ donnees }) => donnees.id,
      })
    : ordonnerEnLimitantRepetitions({
        elements,
        graine: `${gabarit.id}:ordre-principal:${graine}`,
        cle: clePrincipale,
      });
  return ordonnes.map((element, position) => ({
    position,
    gabarit,
    parametres: {
      donneesIndex: element.donnees.donneesIndex,
      vueIndex: element.vue.vueIndex,
      ...(element.forme === undefined ? {} : { forme: element.forme.forme }),
      ...(element.mode === undefined ? {} : { mode: element.mode.mode }),
    },
  }));
}

export function planifierSerieVolumeCubePave({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  return finaliserPlan(
    dimensions(
      `gm13-v${VERSION_PLANS_SERIES_VOLUMES}:${graine}`,
      nombreQuestions,
      { forme: PAQUET_FORMES_VOLUME_CUBE_PAVE },
    ),
    {
      gabarit: GABARIT_VOLUME_CUBE_PAVE,
      graine,
      clePrincipale: ({ forme }) => forme.id,
    },
  );
}

export function planifierSerieVolumePrisme({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  return finaliserPlan(
    dimensions(`gm14-v${VERSION_PLANS_SERIES_VOLUMES}:${graine}`, nombreQuestions),
    { gabarit: GABARIT_VOLUME_PRISME, graine },
  );
}

export function planifierSerieVolumeCylindre({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  return finaliserPlan(
    dimensions(
      `gm15-v${VERSION_PLANS_SERIES_VOLUMES}:${graine}`,
      nombreQuestions,
      { mode: PAQUET_MODES_VOLUME_CYLINDRE },
    ),
    {
      gabarit: GABARIT_VOLUME_CYLINDRE,
      graine,
      clePrincipale: ({ mode }) => mode.id,
    },
  );
}

export function signatureVisibleQuestionVolume(question) {
  return JSON.stringify({ enonce: question.enonce });
}

function genererDepuisPlan({ registre, graine, plan, nom }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError(`${nom} : registre requis`);
  }
  const signatures = new Set();
  return plan.map((element, index) => {
    for (let essai = 0; essai < 80; essai += 1) {
      const question = registre.instancier(
        { ...element.gabarit, parametres: { ...element.parametres } },
        `${graine}:${index + 1}:${essai}`,
      );
      const signature = signatureVisibleQuestionVolume(question);
      if (!signatures.has(signature)) {
        signatures.add(signature);
        return question;
      }
    }
    throw new Error(`${nom} : doublon visible à la position ${index + 1}`);
  });
}

export function genererSerieVolumeCubePave({ registre, graine, nombreQuestions = 10 }) {
  return genererDepuisPlan({
    registre,
    graine,
    plan: planifierSerieVolumeCubePave({ graine, nombreQuestions }),
    nom: "serie volume-cube-pave",
  });
}

export function genererSerieVolumePrisme({ registre, graine, nombreQuestions = 10 }) {
  return genererDepuisPlan({
    registre,
    graine,
    plan: planifierSerieVolumePrisme({ graine, nombreQuestions }),
    nom: "serie volume-prisme",
  });
}

export function genererSerieVolumeCylindre({ registre, graine, nombreQuestions = 10 }) {
  return genererDepuisPlan({
    registre,
    graine,
    plan: planifierSerieVolumeCylindre({ graine, nombreQuestions }),
    nom: "serie volume-cylindre",
  });
}
