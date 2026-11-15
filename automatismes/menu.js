/* Le menu par intitulés officiels (lot « menu par intitulés », 15/11/2026).
   Les données viennent de catalogue/menu.json, tiré du référentiel par export_menu.py (dossier
   automatismes-refonte\referentiel\_source de Gwenaël) : on ne l'écrit jamais à la main.
   Une ligne du menu = un intitulé officiel (puce « Automatismes », objectif d'apprentissage, intitulé de
   la liste du brevet) ; ses questions = celles de l'appli qui le travaillent. Les familles restent en
   coulisse : elles ne servent qu'à ranger les lignes sous les sous-titres du domaine (GROUPES). */
import { rng } from "./core.js";
import { genererQuestion } from "./moteur.js";
import { GROUPES } from "./groupes-domaines.js";

/* Les années du sélecteur : le bouton, et la classe du référentiel qu'il montre. La 3e de cette année
   suit le programme 2020 (brevet 2027) ; la nouvelle 3e (programme 2026) arrive à la rentrée 2028.
   Le brevet montre la liste indicative DNB d'octobre 2025 (rubrique DNB). */
export const ANNEES = [
  { id: "6e", nom: "6e", classe: "6e" },
  { id: "5e", nom: "5e", classe: "5e" },
  { id: "4e", nom: "4e", classe: "4e" },
  { id: "3e", nom: "3e", classe: "3e-2027" },
  { id: "brevet", nom: "Brevet", classe: "brevet", rubriques: ["DNB"] },
];
export const IDS_ANNEES = ANNEES.map((annee) => annee.id);

/* Les années cochées, lues et bornées : au moins une, dans l'ordre du sélecteur. */
export function anneesValides(valeur, defaut = ["3e"]) {
  const liste = Array.isArray(valeur) ? valeur : [valeur];
  const gardees = IDS_ANNEES.filter((id) => liste.includes(id));
  return gardees.length ? gardees : defaut;
}

/* Les lignes d'une année, dans l'ordre du programme (celui du fichier). */
export function lignesDeLAnnee(menu, idAnnee) {
  const annee = ANNEES.find((entree) => entree.id === idAnnee);
  if (!annee) return [];
  return menu.lignes.filter(
    (ligne) =>
      ligne.classe === annee.classe &&
      (!annee.rubriques || annee.rubriques.includes(ligne.rubrique)),
  );
}

/* Une ligne se coche si au moins une de ses questions existe dans l'appli. */
export function ligneJouable(ligne, parForme) {
  return ligne.questions.some((id) => parForme.has(id));
}

/* Les formes jouables du catalogue : « NC04-d » → { famille, forme }. */
export function formesDuCatalogue(catalogue) {
  const parForme = new Map();
  for (const famille of catalogue) {
    if (famille.valide === false) continue;
    for (const forme of famille.formes) {
      if (forme.valide === false) continue;
      parForme.set(`${famille.id}-${forme.id}`, { famille, forme });
    }
  }
  return parForme;
}

/* Le sous-titre d'une ligne dans son domaine : le groupe de sa famille ; sinon « Autres ». */
const GROUPE_DE = Object.fromEntries(
  Object.values(GROUPES).flatMap((groupes) =>
    groupes.flatMap(([titre, ids]) => ids.map((id) => [id, titre])),
  ),
);
export function groupeDe(ligne) {
  return GROUPE_DE[ligne.famille] || "";
}

/* Les lignes d'un domaine pour les années cochées, rangées par année puis par sous-titre (l'ordre des
   GROUPES du domaine, les lignes sans groupe à la fin), chaque sous-titre dans l'ordre du programme :
   les puces « Automatismes » d'abord, puis les objectifs. */
export function rangerDomaine(menu, annees, domaine) {
  const ordreGroupes = (GROUPES[domaine] || []).map(([titre]) => titre);
  return annees.map((idAnnee) => {
    const lignes = lignesDeLAnnee(menu, idAnnee).filter((ligne) => ligne.domaine === domaine);
    const groupes = [];
    for (const titre of [...ordreGroupes, ""]) {
      const liste = lignes.filter(
        (ligne) => (ordreGroupes.includes(groupeDe(ligne)) ? groupeDe(ligne) : "") === titre,
      );
      if (liste.length) groupes.push({ titre, lignes: liste });
    }
    return { annee: idAnnee, groupes };
  });
}

/* Les lignes d'une leçon du livret (test de début de leçon) : niveau « 4e » ou « 3e », code « TRI ».
   Toutes ses lignes, de toutes les classes : une leçon de 4e peut s'appuyer sur une ligne de 3e 2027. */
export function lignesDeLaLecon(menu, niveau, code) {
  const lecon = (menu.lecons || []).find(
    (entree) => entree.niveau === niveau && entree.code === code,
  );
  if (!lecon) return [];
  const parId = new Map(menu.lignes.map((ligne) => [ligne.id, ligne]));
  return lecon.lignes.map((id) => parId.get(id)).filter(Boolean);
}

/* Une série tirée des lignes cochées : on prend les lignes à tour de rôle au hasard (comme les notions
   avant), puis une de leurs questions, la moins vue d'abord, sans répéter un type tant qu'il en reste.
   Une question commune à deux lignes cochées n'existe qu'une fois : elle n'est pas tirée deux fois
   plus souvent. */
export function creerSerieLignes(catalogue, lignes, options, nombreVues = () => 0) {
  const { graine } = options;
  if (!Number.isInteger(graine) || graine < 1 || graine > 2147483647)
    throw new RangeError("Graine de série hors limites.");
  const demande = Number(options.nombre ?? 10);
  const nombre = Math.max(1, Math.min(40, Number.isFinite(demande) ? Math.trunc(demande) : 10));
  const parForme = formesDuCatalogue(catalogue);
  const vues = new Set();
  const jouables = [];
  for (const ligne of lignes) {
    const ids = ligne.questions.filter((id) => parForme.has(id) && !vues.has(id));
    ids.forEach((id) => vues.add(id));
    if (ids.length) jouables.push({ ligne, ids });
  }
  if (!jouables.length) throw new Error("Aucune question disponible avec ces réglages.");
  const hasard = rng(graine);
  const utilisees = new Set();
  let reserve = [...jouables];
  return Array.from({ length: nombre }, () => {
    if (!reserve.length) reserve = [...jouables];
    const choix = hasard.pick(reserve);
    reserve = reserve.filter((autre) => autre !== choix);
    let disponibles = choix.ids.filter((id) => !utilisees.has(id));
    if (!disponibles.length) {
      choix.ids.forEach((id) => utilisees.delete(id));
      disponibles = choix.ids;
    }
    const compte = (id) => nombreVues(...id.split("-"));
    const minimum = Math.min(...disponibles.map(compte));
    const id = hasard.pick(disponibles.filter((autre) => compte(autre) === minimum));
    utilisees.add(id);
    const { famille, forme } = parForme.get(id);
    const question = genererQuestion(famille.id, forme.id, hasard.int(1, 2147483647));
    question.ligne = choix.ligne.id;
    return question;
  });
}
