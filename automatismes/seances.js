import { rng } from "./core.js";
import { genererQuestion } from "./moteur.js";

export const DOMAINES = [
  ["nombres-calculs", "Nombres et calculs", "±"],
  ["proportionnalite-fonctions", "Proportionnalité, fonctions", "ƒ"],
  ["espace-geometrie", "Espace et géométrie", "△"],
  ["donnees-probabilites", "Données et probabilités", "▥"],
  ["pensee-informatique", "Pensée informatique", "↻"],
];

const GROUPES_BREVET = [
  ["Nombres et calculs"],
  ["Nombres et calculs"],
  ["Nombres et calculs"],
  ["Calcul littéral et équations"],
  ["Calcul littéral et équations"],
  ["Géométrie et repérage"],
  ["Grandeurs et mesures"],
  ["Proportionnalité et pourcentages", "Fonctions et graphiques"],
  ["Statistiques et probabilités", "Algorithmique et programmation"],
];

export function nouvelleGraine() {
  return (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647) + 1;
}

export function formesEligibles(famille, filtre = "brevet", examen = false) {
  return famille.formes.filter((forme) => {
    const niveau = filtre === "brevet" ? forme.brevet : forme.niveaux.includes(filtre);
    if (!niveau || forme.valide === false) return false;
    if (!examen) return true;
    const question = genererQuestion(famille.id, forme.id, 913 + forme.indiceGenerateur);
    return !question.fields.some((champ) => champ.options);
  });
}

export function famillesEligibles(catalogue, filtre, examen = false) {
  return catalogue.filter((famille) => {
    return famille.valide !== false && formesEligibles(famille, filtre, examen).length;
  });
}

function choisirForme(famille, formes, hasard, utilisees, nombreVues) {
  let disponibles = formes.filter((forme) => !utilisees.has(`${famille.id}-${forme.id}`));
  if (!disponibles.length) {
    formes.forEach((forme) => utilisees.delete(`${famille.id}-${forme.id}`));
    disponibles = formes;
  }
  const minimum = Math.min(...disponibles.map((forme) => nombreVues(famille.id, forme.id)));
  const choix = hasard.pick(
    disponibles.filter((forme) => nombreVues(famille.id, forme.id) === minimum),
  );
  utilisees.add(`${famille.id}-${choix.id}`);
  return choix;
}

export function creerSerie(catalogue, options, nombreVues = () => 0) {
  const { mode = "train", filtre = "brevet", graine, ids } = options;
  if (!Number.isInteger(graine) || graine < 1 || graine > 2147483647) {
    throw new RangeError("Graine de série hors limites.");
  }
  const examen = mode === "exam";
  const demande = Number(options.nombre ?? 8);
  const entier = Number.isFinite(demande) ? Math.trunc(demande) : 8;
  const nombre = examen ? 9 : Math.max(1, Math.min(40, entier));
  const familles = famillesEligibles(catalogue, examen ? "brevet" : filtre, examen);
  const choisies = familles.filter((famille) => !ids?.length || ids.includes(famille.id));
  if (!choisies.length) throw new Error("Aucune notion disponible avec ces réglages.");
  const hasard = rng(graine);
  const utilisees = new Set();
  let reserve = [...choisies];
  return Array.from({ length: nombre }, (_, rang) => {
    if (!reserve.length) reserve = [...choisies];
    const groupe = GROUPES_BREVET[rang % 9];
    let candidates = examen
      ? reserve.filter((famille) => groupe.includes(famille.categorie))
      : reserve;
    if (!candidates.length && examen)
      candidates = choisies.filter((famille) => groupe.includes(famille.categorie));
    if (!candidates.length) throw new Error("La composition brevet est incomplète.");
    const famille = hasard.pick(candidates);
    reserve = reserve.filter((autre) => autre.id !== famille.id);
    const formes = formesEligibles(famille, examen ? "brevet" : filtre, examen);
    const forme = choisirForme(famille, formes, hasard, utilisees, nombreVues);
    return genererQuestion(famille.id, forme.id, hasard.int(1, 2147483647));
  });
}

export function adresseSerie(options, base) {
  const url = new URL(base);
  url.search = "";
  url.searchParams.set("notions", options.ids.join(","));
  url.searchParams.set("graine", options.graine);
  url.searchParams.set("nombre", options.nombre);
  url.searchParams.set("niveau", options.filtre);
  return url;
}
