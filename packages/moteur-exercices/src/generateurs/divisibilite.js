// Générateur — critères de divisibilité (module public « dnb_08 »).
//
// PREMIER GÉNÉRATEUR V2 (cahier des charges §11.6). Écrit à neuf : aucun
// énoncé, aucune valeur, aucun distracteur de l'ancienne banque.
//
// Doctrine appliquée :
//   §4.2 — on choisit D'ABORD la réponse voulue, puis on construit les
//          données autour. Aucun rejet aléatoire à l'aveugle.
//   §4.6 — toute recherche est bornée, avec invariants et repli déterministe.
//   §5   — les « distracteurs » sont des MODÈLES D'ERREURS diagnostiques.
//   §6   — trois niveaux d'aide ; le niveau 3 amorce sans donner la réponse.
//   §9.1 — aucune fonction, aucun eval, aucun Math.random, aucun DOM.
//
// La réponse est TOUJOURS produite par l'élève, sauf « diviseurs au clic »,
// seule exception autorisée par le cahier des charges (§3.4).

import { creerGenerateur, VERSION_ALEATOIRE } from "../aleatoire.js";
import {
  SCHEMA_QUESTION_INSTANCE_2,
  valeurEntier,
  valeurSelectionDiviseurs,
} from "../../../contrats/src/question-instance-2.js";

export const VERSION_GENERATEUR_DIVISIBILITE = 1;

/** Les critères travaillés, et le texte de la règle correspondante. */
export const CRITERES = Object.freeze({
  2: { regle: "un nombre est divisible par 2 si son chiffre des unités est 0, 2, 4, 6 ou 8", ou: "le chiffre des unités" },
  3: { regle: "un nombre est divisible par 3 si la somme de ses chiffres est un multiple de 3", ou: "la somme des chiffres" },
  5: { regle: "un nombre est divisible par 5 si son chiffre des unités est 0 ou 5", ou: "le chiffre des unités" },
  9: { regle: "un nombre est divisible par 9 si la somme de ses chiffres est un multiple de 9", ou: "la somme des chiffres" },
  10: { regle: "un nombre est divisible par 10 si son chiffre des unités est 0", ou: "le chiffre des unités" },
});

export const FAMILLES_DE_CAS = Object.freeze(["concept", "variation", "piege", "limite", "maitrise"]);

const MAX_ESSAIS = 60;

const sommeChiffres = (n) => String(Math.abs(n)).split("").reduce((s, c) => s + Number(c), 0);
const espaceMillier = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

// ---------------------------------------------------------------------------
// Gabarit 1 — le chiffre manquant (critères de 3 et de 9)
// ---------------------------------------------------------------------------
//
// « Quel est le plus petit chiffre à écrire à la place de ? pour que
//   4?2 soit divisible par 3 ? »
//
// La consigne demande le PLUS PETIT chiffre : la réponse est unique, et
// l'élève doit vraiment parcourir le critère au lieu de s'arrêter au
// premier essai qui marche.

function chiffreManquant(generateur, { diviseur, chiffres, famille }) {
  const positions = chiffres === 3 ? [0, 1] : [0, 1, 2];
  // « limite » force le trou en tête : le chiffre 0 y est interdit, ce qui
  // change la réponse minimale et piège l'automatisme.
  const position = famille === "limite" ? 0 : generateur.choix(positions);

  for (let essai = 0; essai < MAX_ESSAIS; essai++) {
    const connus = [];
    for (let i = 0; i < chiffres; i++) {
      if (i === position) continue;
      connus.push(i === 0 ? generateur.entier(1, 9) : generateur.entier(0, 9));
    }
    const sommeConnue = connus.reduce((s, c) => s + c, 0);
    const premierAutorise = position === 0 ? 1 : 0;

    const solutions = [];
    for (let d = premierAutorise; d <= 9; d++) {
      if ((sommeConnue + d) % diviseur === 0) solutions.push(d);
    }
    if (solutions.length === 0) continue;

    // « piege » : on veut que le chiffre des unités du nombre obtenu soit
    // lui-même un multiple du diviseur — l'élève qui applique le critère du
    // dernier chiffre tombe alors juste par hasard sur les autres cas, et
    // se trompe ici.
    const chiffresFinaux = [...connus];
    chiffresFinaux.splice(position, 0, solutions[0]);
    const unites = chiffresFinaux[chiffresFinaux.length - 1];
    if (famille === "piege" && (unites % diviseur === 0) === (position === chiffres - 1)) continue;
    if (famille === "maitrise" && solutions.length < 2) continue;

    const reponse = solutions[0];
    const masque = chiffresFinaux.map((c, i) => (i === position ? "?" : String(c))).join("");
    const nombreComplet = Number(chiffresFinaux.join(""));

    return {
      diviseur,
      position,
      masque,
      sommeConnue,
      solutions,
      reponse,
      nombreComplet,
      connus,
    };
  }
  // Repli déterministe (§4.6) : un cas construit à la main, jamais d'échec muet.
  const repli = diviseur === 9 ? { masque: "3?6", sommeConnue: 9, reponse: 0, nombreComplet: 306 }
    : { masque: "4?2", sommeConnue: 6, reponse: 0, nombreComplet: 402 };
  return { diviseur, position: 1, solutions: [repli.reponse], connus: [], ...repli };
}

function questionChiffreManquant(instance, contexte) {
  const { diviseur, masque, sommeConnue, reponse, nombreComplet, solutions } = instance;
  const critere = CRITERES[diviseur];

  // Modèles d'erreurs (§5) — chacun est un diagnostic, pas un leurre.
  const modeles = [];
  const ajouter = (id, valeur, message) => {
    if (valeur === reponse || !Number.isInteger(valeur) || valeur < 0 || valeur > 9) return;
    if (modeles.some((m) => m.valeur.valeur === valeur)) return;
    modeles.push({ id, valeur: valeurEntier(valeur), message });
  };
  // L'élève donne la somme des chiffres connus au lieu du chiffre cherché.
  ajouter("somme-au-lieu-du-chiffre", sommeConnue % 10,
    "Tu as donné la somme des chiffres connus, pas le chiffre à écrire.");
  // L'élève applique le critère du dernier chiffre (celui de 2, 5 ou 10).
  ajouter("critere-du-dernier-chiffre", diviseur === 9 ? 9 : 3,
    `Ici, on ne regarde pas le dernier chiffre : ${critere.regle}.`);
  // L'élève trouve un chiffre qui marche, mais pas le plus petit.
  if (solutions.length > 1) {
    ajouter("pas-le-plus-petit", solutions[1],
      "Ce chiffre convient, mais la question demande le PLUS PETIT.");
  }
  // Confusion 3 / 9 : la somme est multiple de 3 sans l'être de 9.
  if (diviseur === 9) {
    for (let d = 0; d <= 9; d++) {
      if ((sommeConnue + d) % 3 === 0 && (sommeConnue + d) % 9 !== 0) {
        ajouter("confusion-3-9", d,
          "La somme est bien un multiple de 3, mais il faut un multiple de 9.");
        break;
      }
    }
  }

  return {
    schema: SCHEMA_QUESTION_INSTANCE_2,
    id: `${contexte.module}#${contexte.position}`,
    cible: { module: contexte.module, notion: contexte.notion, automatismeBO: contexte.automatismeBO },
    parametres: { diviseur, masque, nombreComplet, sommeConnue, solutions },
    enonce: [
      {
        type: "texte",
        contenu: `Quel est le plus petit chiffre à écrire à la place de ? pour que ${masque} soit divisible par ${diviseur} ?`,
      },
    ],
    reponse: { type: "entier", valeur: valeurEntier(reponse), politique: { accepteEspaces: true } },
    modelesErreurs: modeles,
    aides: [
      {
        niveau: 1,
        blocs: [{ type: "texte", contenu: `On cherche un chiffre (de 0 à 9). Pour la divisibilité par ${diviseur}, ce qui compte, c'est ${critere.ou}.` }],
      },
      {
        niveau: 2,
        blocs: [{ type: "texte", contenu: `Le critère : ${critere.regle}.` }],
      },
      {
        niveau: 3,
        blocs: [{
          type: "texte",
          contenu: `La somme des chiffres déjà écrits vaut ${sommeConnue}. Cherche le plus petit chiffre à ajouter pour atteindre un multiple de ${diviseur}.`,
        }],
      },
    ],
    correction: [
      { type: "texte", contenu: `Somme des chiffres connus : ${sommeConnue}. En écrivant ${reponse}, la somme devient ${sommeConnue + reponse}, qui est un multiple de ${diviseur}.` },
      { type: "texte", contenu: `Le nombre est ${espaceMillier(nombreComplet)}, et ${espaceMillier(nombreComplet)} = ${diviseur} × ${nombreComplet / diviseur}.` },
    ],
    tracabilite: {
      generateur: VERSION_GENERATEUR_DIVISIBILITE,
      gabarit: contexte.versionGabarit,
      aleatoire: VERSION_ALEATOIRE,
      graine: contexte.graine,
    },
  };
}

// ---------------------------------------------------------------------------
// Gabarit 2 — le multiple voisin (critères de 2, 5 et 10)
// ---------------------------------------------------------------------------
//
// « Quel est le plus petit multiple de 5 supérieur à 347 ? »
// Réponse unique, produite par l'élève, et le critère sert vraiment.

function multipleVoisin(generateur, { diviseur, sens, famille }) {
  const bas = famille === "maitrise" ? 1000 : 100;
  const haut = famille === "maitrise" ? 9000 : 999;
  for (let essai = 0; essai < MAX_ESSAIS; essai++) {
    const depart = generateur.entier(bas, haut);
    const reste = depart % diviseur;
    // « limite » : le nombre de départ est LUI-MÊME un multiple — il faut
    // alors décider si « strictement supérieur » l'exclut. C'est le piège.
    if (famille === "limite" && reste !== 0) continue;
    if (famille !== "limite" && reste === 0) continue;

    const reponse = sens === "superieur"
      ? depart + (diviseur - reste === 0 ? diviseur : diviseur - reste)
      : depart - (reste === 0 ? diviseur : reste);
    if (reponse <= 0) continue;
    return { diviseur, sens, depart, reste, reponse };
  }
  const depart = diviseur === 10 ? 347 : diviseur === 5 ? 347 : 347;
  const reste = depart % diviseur;
  return { diviseur, sens, depart, reste, reponse: depart + (diviseur - reste) };
}

function questionMultipleVoisin(instance, contexte) {
  const { diviseur, sens, depart, reponse } = instance;
  const critere = CRITERES[diviseur];
  const mot = sens === "superieur" ? "supérieur" : "inférieur";

  const modeles = [];
  const ajouter = (id, valeur, message) => {
    if (valeur === reponse || !Number.isSafeInteger(valeur) || valeur <= 0) return;
    if (modeles.some((m) => m.valeur.valeur === valeur)) return;
    modeles.push({ id, valeur: valeurEntier(valeur), message });
  };
  // L'élève part dans le mauvais sens.
  const autreSens = sens === "superieur"
    ? depart - (depart % diviseur === 0 ? diviseur : depart % diviseur)
    : depart + (diviseur - (depart % diviseur));
  ajouter("mauvais-sens", autreSens, `Ce multiple est ${sens === "superieur" ? "inférieur" : "supérieur"} au nombre de départ.`);
  // L'élève ajoute simplement le diviseur sans se caler sur le multiple.
  ajouter("ajoute-le-diviseur", sens === "superieur" ? depart + diviseur : depart - diviseur,
    `Ajouter ${diviseur} ne suffit pas : il faut atteindre un multiple de ${diviseur}.`);
  // L'élève s'arrête au nombre de départ.
  ajouter("garde-le-depart", depart, `${espaceMillier(depart)} n'est pas un multiple de ${diviseur}.`);

  return {
    schema: SCHEMA_QUESTION_INSTANCE_2,
    id: `${contexte.module}#${contexte.position}`,
    cible: { module: contexte.module, notion: contexte.notion, automatismeBO: contexte.automatismeBO },
    parametres: { diviseur, sens, depart },
    enonce: [
      {
        type: "texte",
        contenu: `Quel est le plus ${sens === "superieur" ? "petit" : "grand"} multiple de ${diviseur} strictement ${mot} à ${espaceMillier(depart)} ?`,
      },
    ],
    reponse: { type: "entier", valeur: valeurEntier(reponse), politique: { accepteEspaces: true } },
    modelesErreurs: modeles,
    aides: [
      { niveau: 1, blocs: [{ type: "texte", contenu: `Un multiple de ${diviseur} se reconnaît à ${critere.ou}.` }] },
      { niveau: 2, blocs: [{ type: "texte", contenu: `Le critère : ${critere.regle}.` }] },
      {
        niveau: 3,
        blocs: [{
          type: "texte",
          contenu: `${espaceMillier(depart)} n'est pas un multiple de ${diviseur}. Avance ${sens === "superieur" ? "vers le haut" : "vers le bas"} jusqu'au premier nombre dont ${critere.ou} convient.`,
        }],
      },
    ],
    correction: [
      { type: "texte", contenu: `${espaceMillier(reponse)} = ${diviseur} × ${reponse / diviseur}, et c'est le premier multiple de ${diviseur} ${mot} à ${espaceMillier(depart)}.` },
    ],
    tracabilite: {
      generateur: VERSION_GENERATEUR_DIVISIBILITE,
      gabarit: contexte.versionGabarit,
      aleatoire: VERSION_ALEATOIRE,
      graine: contexte.graine,
    },
  };
}

// ---------------------------------------------------------------------------
// Gabarit 3 — les diviseurs au clic (§3.4, seule exception à la saisie)
// ---------------------------------------------------------------------------

function diviseursParmiLesCriteres(generateur, { proposes, famille }) {
  for (let essai = 0; essai < MAX_ESSAIS; essai++) {
    const nombre = generateur.entier(100, 9999);
    const attendus = proposes.filter((d) => nombre % d === 0);
    // On refuse le tout-ou-rien : une question sans aucun diviseur, ou où
    // tout marche, n'apprend rien.
    if (attendus.length === 0 || attendus.length === proposes.length) continue;
    // « piege » : divisible par 3 sans l'être par 9 (ou l'inverse impossible),
    // c'est LA confusion à travailler.
    if (famille === "piege" && !(nombre % 3 === 0 && nombre % 9 !== 0)) continue;
    // « limite » : multiple de 10 — il faut penser à cocher aussi 2 et 5.
    if (famille === "limite" && nombre % 10 !== 0) continue;
    if (famille === "maitrise" && attendus.length < 3) continue;
    return { nombre, attendus };
  }
  return { nombre: 3645, attendus: proposes.filter((d) => 3645 % d === 0) };
}

function questionDiviseurs(instance, contexte, proposes) {
  const { nombre, attendus } = instance;
  const somme = sommeChiffres(nombre);

  const modeles = [];
  const ajouter = (id, liste, message) => {
    const trie = [...new Set(liste)].sort((a, b) => a - b);
    if (trie.length === attendus.length && trie.every((v, i) => v === attendus[i])) return;
    if (modeles.some((m) => m.valeur.attendus.join() === trie.join())) return;
    modeles.push({ id, valeur: valeurSelectionDiviseurs(proposes, trie), message });
  };
  if (nombre % 3 === 0 && nombre % 9 !== 0) {
    ajouter("confusion-3-9", [...attendus, 9],
      `La somme des chiffres vaut ${somme} : multiple de 3, mais pas de 9.`);
  }
  if (nombre % 10 === 0) {
    ajouter("oubli-2-et-5-si-multiple-de-10", attendus.filter((d) => d !== 2 && d !== 5),
      "Un multiple de 10 est toujours aussi multiple de 2 et de 5.");
  }
  const dernier = nombre % 10;
  if (dernier % 3 === 0 && nombre % 3 !== 0) {
    ajouter("critere-du-dernier-chiffre-pour-3", [...attendus, 3],
      "Pour 3, on regarde la somme des chiffres, pas le dernier chiffre.");
  }
  // Deux diagnostics toujours disponibles : la sélection incomplète et la
  // sélection excédentaire. Le tirage garantit 0 < attendus < propositions,
  // donc ces deux modèles existent quel que soit le nombre.
  ajouter("selection-incomplete", attendus.slice(0, -1),
    `Il manque un diviseur : vérifie les cinq critères un par un.`);
  const enTrop = proposes.find((d) => !attendus.includes(d));
  ajouter("selection-excedentaire", [...attendus, enTrop],
    `${espaceMillier(nombre)} n'est pas divisible par ${enTrop} : revois ce critère.`);

  return {
    schema: SCHEMA_QUESTION_INSTANCE_2,
    id: `${contexte.module}#${contexte.position}`,
    cible: { module: contexte.module, notion: contexte.notion, automatismeBO: contexte.automatismeBO },
    parametres: { nombre, proposes, sommeChiffres: somme },
    enonce: [
      { type: "texte", contenu: `Parmi ces nombres, lesquels divisent ${espaceMillier(nombre)} ?` },
    ],
    reponse: {
      type: "selection-diviseurs",
      valeur: valeurSelectionDiviseurs(proposes, attendus),
      politique: { toutOuRien: true },
    },
    modelesErreurs: modeles,
    aides: [
      { niveau: 1, blocs: [{ type: "texte", contenu: "Examine les diviseurs un par un : chacun a son propre critère." }] },
      {
        niveau: 2,
        blocs: [{
          type: "texte",
          contenu: "2, 5 et 10 se lisent sur le chiffre des unités. 3 et 9 se lisent sur la somme des chiffres.",
        }],
      },
      {
        niveau: 3,
        blocs: [{
          type: "texte",
          contenu: `Le chiffre des unités est ${dernier}, et la somme des chiffres vaut ${somme}. Applique maintenant chaque critère.`,
        }],
      },
    ],
    correction: [
      { type: "texte", contenu: `Chiffre des unités : ${dernier}. Somme des chiffres : ${somme}.` },
      {
        type: "texte",
        contenu: attendus.length > 0
          ? `${espaceMillier(nombre)} est divisible par ${attendus.join(", ")}.`
          : `${espaceMillier(nombre)} n'est divisible par aucun de ces nombres.`,
      },
    ],
    tracabilite: {
      generateur: VERSION_GENERATEUR_DIVISIBILITE,
      gabarit: contexte.versionGabarit,
      aleatoire: VERSION_ALEATOIRE,
      graine: contexte.graine,
    },
  };
}

// ---------------------------------------------------------------------------
// Entrée publique
// ---------------------------------------------------------------------------

const GABARITS = {
  "chiffre-manquant": (generateur, parametres, contexte) =>
    questionChiffreManquant(
      chiffreManquant(generateur, {
        diviseur: parametres.diviseur,
        chiffres: parametres.chiffres ?? 3,
        famille: contexte.famille,
      }),
      contexte,
    ),
  "multiple-voisin": (generateur, parametres, contexte) =>
    questionMultipleVoisin(
      multipleVoisin(generateur, {
        diviseur: parametres.diviseur,
        sens: parametres.sens ?? "superieur",
        famille: contexte.famille,
      }),
      contexte,
    ),
  "diviseurs-au-clic": (generateur, parametres, contexte) => {
    const proposes = parametres.proposes ?? [2, 3, 5, 9, 10];
    return questionDiviseurs(
      diviseursParmiLesCriteres(generateur, { proposes, famille: contexte.famille }),
      contexte,
      proposes,
    );
  },
};

/** Les gabarits que ce générateur sait produire. */
export const GABARITS_DIVISIBILITE = Object.freeze(Object.keys(GABARITS));

/**
 * Produit une question-instance de divisibilité.
 *
 * @param {object} demande
 *   graine — graine dérivée de la série (obligatoire, jamais Math.random)
 *   gabarit — « chiffre-manquant » | « multiple-voisin » | « diviseurs-au-clic »
 *   parametres — contraintes pédagogiques validées (diviseur, sens, chiffres…)
 *   notion, module, automatismeBO — la cible
 *   famille — famille de cas (§4.1)
 *   position — rang dans la série
 *   versionGabarit — version du gabarit de la banque
 * @returns {object} question-instance/2
 */
export function genererDivisibilite(demande = {}) {
  const {
    graine,
    gabarit,
    parametres = {},
    notion,
    module = "criteres-divisibilite",
    automatismeBO = null,
    famille = "concept",
    position = 1,
    versionGabarit = 1,
  } = demande;

  if (graine === undefined || graine === null || graine === "") {
    throw new RangeError("genererDivisibilite : une graine est obligatoire (aucun hasard non reproductible)");
  }
  const fabrique = GABARITS[gabarit];
  if (!fabrique) {
    throw new RangeError(`genererDivisibilite : gabarit inconnu « ${gabarit} »`);
  }
  if (!FAMILLES_DE_CAS.includes(famille)) {
    throw new RangeError(`genererDivisibilite : famille de cas inconnue « ${famille} »`);
  }
  if (typeof notion !== "string" || notion.length === 0) {
    throw new RangeError("genererDivisibilite : la notion travaillée doit être nommée");
  }
  // Les paramètres sont validés AVANT tout tirage (§3.3).
  if (gabarit !== "diviseurs-au-clic") {
    if (!Object.hasOwn(CRITERES, parametres.diviseur)) {
      throw new RangeError(`genererDivisibilite : diviseur non couvert « ${parametres.diviseur} »`);
    }
    if (gabarit === "chiffre-manquant" && ![3, 9].includes(parametres.diviseur)) {
      throw new RangeError(
        "chiffre-manquant : réservé aux critères de 3 et 9 — pour 2, 5 et 10 le chiffre des unités admet plusieurs réponses",
      );
    }
    if (gabarit === "multiple-voisin" && ![2, 5, 10].includes(parametres.diviseur)) {
      throw new RangeError("multiple-voisin : prévu pour les critères de 2, 5 et 10");
    }
  }

  const generateur = creerGenerateur(`${graine}|${gabarit}|${famille}|${position}`);
  return fabrique(generateur, parametres, {
    module,
    notion,
    automatismeBO,
    famille,
    position,
    graine,
    versionGabarit,
  });
}
