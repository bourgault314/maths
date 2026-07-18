// Sélection déterministe des questions d'une série (§8.5).
//
// CE QUE « BIEN CHOISIR » VEUT DIRE ICI
//
// Tirer 10 gabarits au hasard dans une liste donne régulièrement six fois
// la même notion et deux fois la même question. Une série d'automatismes
// doit au contraire :
//
//   — répartir les questions entre les notions demandées, sans en oublier ;
//   — éviter qu'un même gabarit tombe deux fois de suite ;
//   — entrelacer les modules, pour que l'élève change vraiment de sujet ;
//   — ne jamais reposer exactement la même question ;
//   — et redonner EXACTEMENT la même série pour la même graine.
//
// Tout est fait sans horloge et sans Math.random : les seuls tirages
// viennent des flux de graines dérivés de la graine de série.

import { creerGenerateur } from "./aleatoire.js";
import { FLUX, derive } from "./graines.js";

/** Toute modification qui change les séries produites incrémente ce numéro. */
export const VERSION_SELECTION = 1;

/**
 * Empreinte de STRUCTURE d'une question : ce qui reste quand on retire les
 * valeurs. Deux questions de même empreinte posent « la même chose avec
 * d'autres nombres » — c'est ce qu'on veut espacer dans une série.
 *
 * @param {object} question — question instanciée
 * @returns {string}
 */
export function empreinteStructure(question) {
  if (!question || typeof question !== "object") return "";
  const notion = question.cible?.notion ?? "";
  // `tracabilite.gabarit` est un NUMÉRO DE VERSION (contrat question/2) ;
  // l'identifiant du gabarit est `idGabarit`. Confondre les deux donnerait
  // une empreinte identique pour tous les gabarits de même version.
  const gabarit = question.tracabilite?.idGabarit ?? question.origine?.gabarit ?? "";
  const formes = (question.enonce ?? [])
    .map((bloc) => (bloc?.type === "objet" ? `objet:${bloc.objet}` : bloc?.type))
    .join(",");
  const reponse = question.reponse?.type ?? "";
  return `${notion}|${gabarit}|${formes}|${reponse}`;
}

/**
 * Empreinte d'INSTANCE : la question exacte, valeurs comprises. Sert à
 * garantir qu'aucune question n'est posée deux fois.
 *
 * @param {object} question
 * @returns {string}
 */
export function empreinteInstance(question) {
  if (!question || typeof question !== "object") return "";
  const textes = (question.enonce ?? [])
    .map((bloc) => (bloc?.type === "objet"
      ? `${bloc.objet}:${stableJson(bloc.donnees ?? bloc.visuel?.parametres ?? {})}`
      : String(bloc?.contenu ?? "")))
    .join("");
  return `${empreinteStructure(question)}|${textes}|${stableJson(question.reponse?.valeur ?? null)}`;
}

/** JSON à clés triées : le même contenu donne toujours le même texte. */
function stableJson(valeur) {
  if (Array.isArray(valeur)) return `[${valeur.map(stableJson).join(",")}]`;
  if (valeur && typeof valeur === "object") {
    return `{${Object.keys(valeur).sort().map((c) => `${JSON.stringify(c)}:${stableJson(valeur[c])}`).join(",")}}`;
  }
  return JSON.stringify(valeur) ?? "null";
}

/**
 * Répartit `total` places entre `parts`, au plus juste.
 * Méthode du plus fort reste : chacun reçoit sa part entière, puis les
 * places restantes vont aux premiers d'un ordre tiré au sort (donc
 * reproductible) — jamais toujours aux mêmes.
 *
 * @param {number} total @param {string[]} parts @param {object} aleatoire
 * @returns {Map<string, number>}
 */
export function repartir(total, parts, aleatoire) {
  const repartition = new Map();
  if (parts.length === 0) return repartition;

  const base = Math.floor(total / parts.length);
  let reste = total - base * parts.length;
  for (const part of parts) repartition.set(part, base);

  // L'ordre du reste est tiré : sinon la première notion de la liste serait
  // systématiquement avantagée dans toutes les séries impaires.
  for (const part of aleatoire.melange(parts)) {
    if (reste <= 0) break;
    repartition.set(part, repartition.get(part) + 1);
    reste -= 1;
  }
  return repartition;
}

/**
 * Ordonne les questions choisies pour que deux voisines ne partagent ni le
 * même gabarit ni le même module.
 *
 * Méthode : à chaque pas, on prend le candidat le plus « urgent » (celui
 * dont il reste le plus d'exemplaires) parmi ceux qui ne répètent pas le
 * précédent. Si aucun ne convient — cas d'un seul module demandé, par
 * exemple — on prend quand même le plus urgent : une série un peu répétitive
 * vaut mieux qu'une série qui n'existe pas (§8.6).
 *
 * @param {Array<{ gabarit: string, module: string, notion: string }>} choix
 * @param {object} aleatoire
 */
export function entrelacer(choix, aleatoire) {
  const restants = aleatoire.melange(choix).map((c) => ({ ...c }));
  const sortie = [];
  let precedent = null;

  while (restants.length > 0) {
    const compteModule = new Map();
    for (const c of restants) {
      compteModule.set(c.module, (compteModule.get(c.module) ?? 0) + 1);
    }

    const acceptable = (c) => precedent === null
      || (c.gabarit !== precedent.gabarit && c.module !== precedent.module);
    const tolerable = (c) => precedent === null || c.gabarit !== precedent.gabarit;

    let indice = trouverPlusUrgent(restants, compteModule, acceptable);
    if (indice === -1) indice = trouverPlusUrgent(restants, compteModule, tolerable);
    if (indice === -1) indice = trouverPlusUrgent(restants, compteModule, () => true);

    precedent = restants[indice];
    sortie.push(precedent);
    restants.splice(indice, 1);
  }
  return sortie;
}

function trouverPlusUrgent(restants, compteModule, convient) {
  let meilleur = -1;
  let meilleurPoids = -1;
  for (let i = 0; i < restants.length; i++) {
    if (!convient(restants[i])) continue;
    const poids = compteModule.get(restants[i].module) ?? 0;
    if (poids > meilleurPoids) {
      meilleurPoids = poids;
      meilleur = i;
    }
  }
  return meilleur;
}

/**
 * Choisit et ordonne les gabarits d'une série.
 *
 * @param {{
 *   candidats: Array<{ gabarit: string, module: string, notion: string, palier?: number }>,
 *   nombreDeQuestions: number,
 *   graineSerie: number,
 * }} demande
 * @returns {Array<{ gabarit: string, module: string, notion: string, rang: number }>}
 */
export function selectionnerGabarits({ candidats, nombreDeQuestions, graineSerie }) {
  if (!Array.isArray(candidats) || candidats.length === 0) {
    throw new RangeError("selectionnerGabarits : aucun gabarit candidat");
  }
  if (!Number.isInteger(nombreDeQuestions) || nombreDeQuestions < 1) {
    throw new RangeError("selectionnerGabarits : nombre de questions invalide");
  }

  const hasardNotions = creerGenerateur(derive(graineSerie, FLUX.NOTIONS));
  const hasardGabarits = creerGenerateur(derive(graineSerie, FLUX.GABARITS));
  const hasardMelange = creerGenerateur(derive(graineSerie, FLUX.MELANGE));

  // 1. Répartir les questions entre les notions demandées.
  const parNotion = new Map();
  for (const candidat of candidats) {
    if (!parNotion.has(candidat.notion)) parNotion.set(candidat.notion, []);
    parNotion.get(candidat.notion).push(candidat);
  }
  const notions = [...parNotion.keys()].sort();
  const quota = repartir(nombreDeQuestions, notions, hasardNotions);

  // 2. Dans chaque notion, répartir entre ses gabarits — on fait le tour
  //    des gabarits avant d'en répéter un, pour couvrir les familles.
  const choix = [];
  for (const notion of notions) {
    const combien = quota.get(notion) ?? 0;
    if (combien === 0) continue;
    const gabaritsDeLaNotion = parNotion.get(notion);
    let pioche = [];
    for (let i = 0; i < combien; i++) {
      if (pioche.length === 0) pioche = hasardGabarits.melange(gabaritsDeLaNotion);
      const pris = pioche.shift();
      choix.push({ gabarit: pris.gabarit, module: pris.module, notion: pris.notion });
    }
  }

  // 3. Entrelacer, puis numéroter : le rang sert à dériver la graine des
  //    valeurs, il doit être stable.
  return entrelacer(choix, hasardMelange).map((c, rang) => ({ ...c, rang }));
}
