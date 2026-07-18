// Banque V2 des automatismes — registre des modules reconstruits.
//
// Un module n'entre ici QUE s'il est écrit à neuf (§1). Les 43 modules
// publics restent des conteneurs stables : ce registre dit lesquels ont
// déjà quitté le noyau hérité, notion par notion (§1.3).
//
// Rien de ce qui figure ici n'est visible des élèves tant que Gwenaël ne
// l'a pas validé (§7, §11.7).

import { MODULE_CRITERES_DIVISIBILITE } from "./modules/criteres-divisibilite/index.js";

export const VERSION_BANQUE = 1;

/** Les modules V2, par identifiant canonique. */
export const MODULES_V2 = Object.freeze({
  "criteres-divisibilite": MODULE_CRITERES_DIVISIBILITE,
});

/** Retrouve un module par son identifiant canonique ou son ancien dnb_XX. */
export function moduleParId(identifiant) {
  if (Object.hasOwn(MODULES_V2, identifiant)) return MODULES_V2[identifiant];
  return Object.values(MODULES_V2).find((m) => (m.legacyIds ?? []).includes(identifiant)) ?? null;
}

/** Toutes les notions atomiques déclarées, module d'origine compris. */
export function toutesLesNotions() {
  return Object.values(MODULES_V2).flatMap((module) =>
    module.notions.map((notion) => ({ module: module.id, ...notion })),
  );
}

/** Les notions réellement publiables : validées par Gwenaël, et elles seules. */
export function notionsPubliees() {
  return toutesLesNotions().filter((notion) => notion.validation?.etat === "valide");
}

/** L'avancement du chantier, en clair. */
export function avancement() {
  const notions = toutesLesNotions();
  const compte = { valide: 0, "a-valider": 0, brouillon: 0 };
  for (const notion of notions) {
    const etat = notion.validation?.etat ?? "brouillon";
    if (Object.hasOwn(compte, etat)) compte[etat] += 1;
  }
  return { modules: Object.keys(MODULES_V2).length, notions: notions.length, ...compte };
}
