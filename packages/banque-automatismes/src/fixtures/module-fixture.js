// MODULE DE FIXTURE — outillage technique, PAS un module de classe.
//
// POURQUOI IL EXISTE
//
// Le socle doit pouvoir être éprouvé de bout en bout — sélection, tirage,
// série, code partageable, rejeu à l'identique — SANS attendre qu'un
// contenu pédagogique soit écrit et validé. Ce module joue ce rôle.
//
// CE QU'IL N'EST PAS
//
// Il n'entre pas dans MODULES_V2 : il ne peut donc apparaître ni dans le
// menu, ni dans une série d'élève. Ses « savoir-faire » sont des étiquettes
// techniques, pas des objectifs d'apprentissage. Son état de validation est
// « brouillon » et le restera : personne ne doit le valider.
//
// Le premier vrai contenu viendra au lot 1 (« Puissances et carrés »),
// avec les formulations de Gwenaël.

export const SCHEMA = "mathsgo.module-questions/1";

const brouillon = { etat: "brouillon", date: null, auteur: null };

export const MODULE_FIXTURE = {
  schema: SCHEMA,
  id: "fixture-technique",
  legacyIds: [],
  // Code de série 999 : hors de la plage des modules publics (0-42), pour
  // qu'aucune collision ne soit possible avec un vrai module.
  codeSerie: 999,
  version: 1,
  titre: "Fixture technique (ne pas utiliser en classe)",
  domaine: "nombres-calculs",
  niveaux: ["6e", "5e", "4e", "3e"],
  calculatrice: "interdite",
  provenance: "origine-mathsgo",
  validation: brouillon,

  notions: [
    {
      id: "fixture-somme-simple",
      savoirFaire: "Fixture technique : produire une somme dont la réponse est un entier.",
      enseigne: false,
      automatise: false,
      automatismesBO: [],
      horsAutomatismeBO: true,
      prerequis: [],
      paliers: ["1 — petites valeurs", "2 — valeurs plus grandes"],
      famillesDeCas: ["concept"],
      modelesErreurs: ["fixture-difference", "fixture-produit"],
      validation: brouillon,
    },
    {
      id: "fixture-somme-bornee",
      savoirFaire: "Fixture technique : éprouver les invariants et le repli déterministe.",
      enseigne: false,
      automatise: false,
      automatismesBO: [],
      horsAutomatismeBO: true,
      prerequis: ["fixture-somme-simple"],
      paliers: ["1 — borne haute"],
      famillesDeCas: ["limite"],
      modelesErreurs: [],
      validation: brouillon,
    },
  ],

  gabarits: [
    {
      id: "fixture-somme-petite",
      notion: "fixture-somme-simple",
      generateur: "fixture/somme",
      palier: 1,
      parametres: { maximum: 10 },
      reponse: "entier",
      validation: brouillon,
    },
    {
      id: "fixture-somme-moyenne",
      notion: "fixture-somme-simple",
      generateur: "fixture/somme",
      palier: 2,
      parametres: { maximum: 50 },
      reponse: "entier",
      validation: brouillon,
    },
    {
      id: "fixture-somme-bornee-haute",
      notion: "fixture-somme-bornee",
      generateur: "fixture/somme",
      palier: 1,
      parametres: { maximum: 99, interdireZero: true },
      reponse: "entier",
      validation: brouillon,
    },
  ],
};

/**
 * Une banque de test, de la même forme que la vraie.
 * Les tests et le banc d'essai la passent à `creerSerie` exactement comme
 * ils passeraient la banque réelle — c'est ce qui donne sa valeur à la
 * fixture : elle emprunte le vrai chemin, pas un chemin de test.
 */
export const BANQUE_FIXTURE = Object.freeze({
  VERSION_BANQUE: 1,
  MODULES_V2: Object.freeze({ "fixture-technique": MODULE_FIXTURE }),
});
