import { rng } from "./core.js";
import { generators as nombres, counts as quantitesNombres } from "./generateurs/nombres.js";
import {
  generators as divisibilite,
  counts as quantitesDivisibilite,
  formesCahier as formesDivisibilite,
} from "./generateurs/divisibilite.js";
import {
  generators as numeration,
  counts as quantitesNumeration,
  formesCahier as formesNumeration,
} from "./generateurs/numeration.js";
import { generators as algebre, counts as quantitesAlgebre } from "./generateurs/algebre.js";
import { generators as geometrie, counts as quantitesGeometrie } from "./generateurs/geometrie.js";
import { generators as mesures, counts as quantitesMesures } from "./generateurs/mesures.js";
import { generators as donnees, counts as quantitesDonnees } from "./generateurs/donnees_algo.js";
import {
  generators as proportionnalite,
  counts as quantitesProportionnalite,
} from "./generateurs/proportion_fonctions.js";

export const generateurs = Object.freeze({
  ...nombres,
  ...numeration,
  ...divisibilite,
  ...algebre,
  ...geometrie,
  ...mesures,
  ...donnees,
  ...proportionnalite,
});

export const nombresFormes = Object.freeze({
  ...quantitesNombres,
  ...quantitesNumeration,
  ...quantitesDivisibilite,
  ...quantitesAlgebre,
  ...quantitesGeometrie,
  ...quantitesMesures,
  ...quantitesDonnees,
  ...quantitesProportionnalite,
});

// Les formes réécrites d'après les cahiers de domaine (lot NC-1 : NC17 et NC18 ; lot NC-2 : NC01, NC02
// et NC03). Elles ne suivent plus les empreintes de l'archive de GPT ; leurs propres tests sont
// tests/automatismes-cahier-*.test.mjs.
export const formesCahier = Object.freeze(new Set([...formesNumeration, ...formesDivisibilite]));

export function formesDisponibles(famille) {
  if (!Object.hasOwn(generateurs, famille)) return [];
  return Array.from({ length: nombresFormes[famille] }, (_, rang) =>
    String.fromCharCode(97 + rang),
  );
}

export function genererQuestion(famille, forme, graine) {
  if (!Object.hasOwn(generateurs, famille)) throw new RangeError("Famille inconnue.");
  if (!formesDisponibles(famille).includes(forme)) throw new RangeError("Forme inconnue.");
  if (!Number.isInteger(graine) || graine < 1 || graine > 2147483647) {
    throw new RangeError("Graine hors limites.");
  }
  const indice = forme.charCodeAt(0) - 97;
  const question = generateurs[famille](rng(graine), indice);
  return {
    ...question,
    famille,
    forme,
    graine,
    id: `${famille}-${forme}@${graine}`,
    fields: question.fields.map((champ) => ({ ...champ, kind: champ.kind || "number" })),
  };
}
