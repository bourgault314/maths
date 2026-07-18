// Module public « criteres-divisibilite » (anciennement dnb_08) — banque V2.
//
// PREMIER MODULE RECONSTRUIT (cahier des charges §8.2, ordre 1).
// Écrit à neuf : aucun énoncé, aucune valeur, aucun distracteur, aucun
// formula_code de l'ancienne banque. L'ancienne banque n'a servi que
// d'inventaire de notions (§1).
//
// DONNÉES PURES uniquement : ce fichier ne contient aucune fonction,
// aucun SVG, aucun HTML. Il nomme les générateurs, il ne les embarque pas.
//
// ÉTAT : tout est « a-valider ». Aucune notion n'est visible des élèves
// tant que Gwenaël ne l'a pas validée lui-même (§7, §11.7).
//
// DEUX PROPOSITIONS SOUMISES À VALIDATION, signalées ci-dessous :
//   1. ajouter le niveau 5e (l'automatisme 5-01 du BO s'applique depuis
//      2026-2027 ; le module n'était proposé qu'en 4e, 3e et DNB) ;
//   2. ajouter le critère de 10 au titre et aux notions (il figure dans
//      5-01 mais était absent du titre historique).

export const SCHEMA = "mathsgo.module-questions/1";

/** Ce qui reste à trancher avec Gwenaël avant publication. */
export const QUESTIONS_OUVERTES = Object.freeze([
  "Ajouter le niveau 5e ? L'automatisme BO 5-01 (critères par 2, 5 et 10) s'applique depuis 2026-2027.",
  "Ajouter le critère de 10 ? Il est dans 5-01 mais absent du titre historique.",
  "Le gabarit « chiffre manquant » demande le PLUS PETIT chiffre pour que la réponse soit unique. Formulation à valider.",
  "Pour les diviseurs au clic : exiger la sélection complète (tout ou rien) ou accepter une réponse partielle ?",
]);

const enAttente = { etat: "a-valider", date: null, auteur: null };

export const MODULE_CRITERES_DIVISIBILITE = {
  schema: SCHEMA,
  id: "criteres-divisibilite",
  legacyIds: ["dnb_08"],
  codeSerie: 9,
  version: 1,
  titre: "Critères de divisibilité par 2, 3, 5, 9 et 10",
  domaine: "nombres-calculs",
  // PROPOSITION : 5e ajouté (BO 5-01). Historiquement : 4e, 3e, DNB.
  niveaux: ["5e", "4e", "3e", "DNB"],
  calculatrice: "interdite",
  provenance: "reconstruit",
  validation: enAttente,

  // --- Les notions atomiques (§1.3, §3.2) -----------------------------------
  // Chacune se valide et se migre séparément. Le module ne sera déclaré
  // entièrement reconstruit que lorsque toutes auront quitté le legacy.
  notions: [
    {
      id: "critere-2",
      savoirFaire: "Reconnaître un multiple de 2 grâce au chiffre des unités.",
      enseigne: true,
      automatise: true,
      automatismesBO: ["5-01", "3-09"],
      prerequis: [],
      paliers: [
        "1 — nombres à 3 chiffres, multiple proche immédiat",
        "2 — nombres à 4 chiffres",
        "3 — le nombre de départ est déjà un multiple (piège du « strictement »)",
      ],
      famillesDeCas: ["concept", "variation", "limite"],
      modelesErreurs: ["mauvais-sens", "ajoute-le-diviseur", "garde-le-depart"],
      validation: enAttente,
    },
    {
      id: "critere-5",
      savoirFaire: "Reconnaître un multiple de 5 grâce au chiffre des unités (0 ou 5).",
      enseigne: true,
      automatise: true,
      automatismesBO: ["5-01", "3-09"],
      prerequis: [],
      paliers: [
        "1 — nombres à 3 chiffres",
        "2 — nombres à 4 chiffres",
        "3 — le nombre de départ est déjà un multiple",
      ],
      famillesDeCas: ["concept", "variation", "limite"],
      modelesErreurs: ["mauvais-sens", "ajoute-le-diviseur", "garde-le-depart"],
      validation: enAttente,
    },
    {
      id: "critere-10",
      savoirFaire: "Reconnaître un multiple de 10, et savoir qu'il est alors aussi multiple de 2 et de 5.",
      enseigne: true,
      automatise: true,
      automatismesBO: ["5-01"],
      prerequis: ["critere-2", "critere-5"],
      paliers: [
        "1 — nombres à 3 chiffres",
        "2 — nombres à 4 chiffres",
        "3 — lien explicite avec 2 et 5",
      ],
      famillesDeCas: ["concept", "variation", "limite"],
      modelesErreurs: ["mauvais-sens", "garde-le-depart"],
      validation: enAttente,
    },
    {
      id: "critere-3",
      savoirFaire: "Reconnaître un multiple de 3 par la somme de ses chiffres.",
      enseigne: true,
      automatise: true,
      automatismesBO: ["3-09"],
      prerequis: [],
      paliers: [
        "1 — 3 chiffres, trou au milieu",
        "2 — 4 chiffres, trou déplacé",
        "3 — trou en première position (le chiffre 0 y est interdit)",
      ],
      famillesDeCas: ["concept", "variation", "piege", "limite", "maitrise"],
      modelesErreurs: ["somme-au-lieu-du-chiffre", "critere-du-dernier-chiffre", "pas-le-plus-petit"],
      validation: enAttente,
    },
    {
      id: "critere-9",
      savoirFaire: "Reconnaître un multiple de 9 par la somme de ses chiffres, sans le confondre avec 3.",
      enseigne: true,
      automatise: true,
      automatismesBO: ["3-09"],
      prerequis: ["critere-3"],
      paliers: [
        "1 — 3 chiffres, trou au milieu",
        "2 — 4 chiffres",
        "3 — la somme est multiple de 3 sans l'être de 9",
      ],
      famillesDeCas: ["concept", "variation", "piege", "limite", "maitrise"],
      modelesErreurs: ["somme-au-lieu-du-chiffre", "critere-du-dernier-chiffre", "confusion-3-9", "pas-le-plus-petit"],
      validation: enAttente,
    },
    {
      id: "diviseurs-parmi-les-criteres",
      savoirFaire: "Choisir, parmi 2, 3, 5, 9 et 10, tous les diviseurs d'un nombre donné.",
      enseigne: true,
      automatise: true,
      automatismesBO: ["5-01", "3-09"],
      prerequis: ["critere-2", "critere-3", "critere-5", "critere-9", "critere-10"],
      paliers: [
        "1 — un ou deux diviseurs, critères indépendants",
        "2 — multiple de 10 : penser à 2 et 5",
        "3 — multiple de 3 mais pas de 9",
      ],
      famillesDeCas: ["concept", "variation", "piege", "limite", "maitrise"],
      modelesErreurs: [
        "confusion-3-9",
        "oubli-2-et-5-si-multiple-de-10",
        "critere-du-dernier-chiffre-pour-3",
      ],
      validation: enAttente,
    },
  ],

  // --- Les gabarits (§3.3) --------------------------------------------------
  // Les paramètres décrivent des CONTRAINTES PÉDAGOGIQUES, pas des bornes
  // aléatoires : quel critère, dans quel sens, sur combien de chiffres.
  gabarits: [
    // Critères de 2, 5, 10 — le multiple voisin (réponse unique et produite).
    {
      id: "multiple-voisin-2",
      notion: "critere-2",
      generateur: "divisibilite/multiple-voisin",
      palier: 1,
      parametres: { diviseur: 2, sens: "superieur" },
      reponse: "entier",
      validation: enAttente,
    },
    {
      id: "multiple-voisin-5",
      notion: "critere-5",
      generateur: "divisibilite/multiple-voisin",
      palier: 1,
      parametres: { diviseur: 5, sens: "superieur" },
      reponse: "entier",
      validation: enAttente,
    },
    {
      id: "multiple-voisin-5-descendant",
      notion: "critere-5",
      generateur: "divisibilite/multiple-voisin",
      palier: 2,
      parametres: { diviseur: 5, sens: "inferieur" },
      reponse: "entier",
      validation: enAttente,
    },
    {
      id: "multiple-voisin-10",
      notion: "critere-10",
      generateur: "divisibilite/multiple-voisin",
      palier: 1,
      parametres: { diviseur: 10, sens: "superieur" },
      reponse: "entier",
      validation: enAttente,
    },

    // Critères de 3 et 9 — le chiffre manquant (la somme des chiffres sert
    // vraiment ; le critère du dernier chiffre échoue).
    {
      id: "chiffre-manquant-3",
      notion: "critere-3",
      generateur: "divisibilite/chiffre-manquant",
      palier: 1,
      parametres: { diviseur: 3, chiffres: 3 },
      reponse: "entier",
      validation: enAttente,
    },
    {
      id: "chiffre-manquant-3-quatre-chiffres",
      notion: "critere-3",
      generateur: "divisibilite/chiffre-manquant",
      palier: 2,
      parametres: { diviseur: 3, chiffres: 4 },
      reponse: "entier",
      validation: enAttente,
    },
    {
      id: "chiffre-manquant-9",
      notion: "critere-9",
      generateur: "divisibilite/chiffre-manquant",
      palier: 2,
      parametres: { diviseur: 9, chiffres: 3 },
      reponse: "entier",
      validation: enAttente,
    },
    {
      id: "chiffre-manquant-9-quatre-chiffres",
      notion: "critere-9",
      generateur: "divisibilite/chiffre-manquant",
      palier: 3,
      parametres: { diviseur: 9, chiffres: 4 },
      reponse: "entier",
      validation: enAttente,
    },

    // La seule exception à la saisie (§3.4) : les diviseurs au clic.
    {
      id: "diviseurs-au-clic",
      notion: "diviseurs-parmi-les-criteres",
      generateur: "divisibilite/diviseurs-au-clic",
      palier: 2,
      parametres: { proposes: [2, 3, 5, 9, 10] },
      reponse: "selection-diviseurs",
      validation: enAttente,
    },
  ],

  // Aucun visuel indispensable ici : la question est entièrement numérique.
  visuels: [],
  aides: [1, 2, 3],
};

export default MODULE_CRITERES_DIVISIBILITE;
