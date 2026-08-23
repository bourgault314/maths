// Sélection commune des profils pédagogiques d'Automatismes DNB V2.
//
// Un paquet décrit exactement vingt jetons de référence. Les jetons sont
// mélangés avec le générateur seedé, puis tirés sans remise. Une petite série
// est donc un échantillon du paquet entier, jamais le préfixe d'une recette
// fixe. Les dimensions indépendantes utilisent des sous-graines distinctes.

import { creerGenerateur, validerGraine } from "./aleatoire.js?v=53";

export const VERSION_PAQUETS_PONDERES = 1;
export const TAILLE_PAQUET_REFERENCE = 20;

const CATEGORIES_PROFIL = new Set(["principale", "secondaire", "rare"]);
const FORMAT_IDENTIFIANT = /^[a-z0-9][a-z0-9._-]*$/;

function comparerTextesCanoniques(a, b) {
  const texteA = String(a);
  const texteB = String(b);
  if (texteA < texteB) return -1;
  if (texteA > texteB) return 1;
  return 0;
}

function figerProfil(profil) {
  return Object.freeze({ ...profil });
}

function exigerNombreElements(nombreElements) {
  if (!Number.isInteger(nombreElements) || nombreElements < 1) {
    throw new RangeError("paquet pondéré : nombre d'éléments entier positif requis");
  }
}

/**
 * Valide et normalise la déclaration pédagogique d'un paquet de vingt.
 * L'ordre de déclaration n'a aucun effet : les profils sont canonisés par id.
 *
 * @param {{
 *   id: string,
 *   profils: readonly ({id: string, quota: number, categorie: string} & Record<string, unknown>)[],
 * }} declaration
 */
export function definirPaquetPondere({ id, profils }) {
  if (typeof id !== "string" || !FORMAT_IDENTIFIANT.test(id)) {
    throw new TypeError("paquet pondéré : identifiant canonique requis");
  }
  if (!Array.isArray(profils) || profils.length === 0) {
    throw new RangeError("paquet pondéré : au moins un profil est requis");
  }
  const ids = new Set();
  let total = 0;
  const normalises = profils.map((profil) => {
    if (!profil || typeof profil !== "object" || Array.isArray(profil)) {
      throw new TypeError(`paquet pondéré ${id} : profil objet requis`);
    }
    if (typeof profil.id !== "string" || !FORMAT_IDENTIFIANT.test(profil.id)) {
      throw new TypeError(`paquet pondéré ${id} : id de profil invalide`);
    }
    if (ids.has(profil.id)) {
      throw new RangeError(`paquet pondéré ${id} : profil ${profil.id} dupliqué`);
    }
    if (!Number.isInteger(profil.quota) || profil.quota < 1) {
      throw new RangeError(`paquet pondéré ${id} : quota positif entier requis`);
    }
    if (!CATEGORIES_PROFIL.has(profil.categorie)) {
      throw new RangeError(`paquet pondéré ${id} : catégorie de profil inconnue`);
    }
    ids.add(profil.id);
    total += profil.quota;
    return figerProfil(profil);
  }).sort((a, b) => comparerTextesCanoniques(a.id, b.id));
  if (total !== TAILLE_PAQUET_REFERENCE) {
    throw new RangeError(
      `paquet pondéré ${id} : ${TAILLE_PAQUET_REFERENCE} jetons attendus, ${total} reçus`,
    );
  }
  return Object.freeze({
    id,
    tailleReference: TAILLE_PAQUET_REFERENCE,
    profils: Object.freeze(normalises),
  });
}

function jetonsCanoniques(paquet, cycle) {
  return paquet.profils.flatMap((profil) =>
    Array.from({ length: profil.quota }, (_, occurrence) => Object.freeze({
      ...profil,
      occurrence,
      cycle,
      idTirage: `${profil.id}#${occurrence}@${cycle}`,
    })));
}

/**
 * Tire sans remise dans chaque cycle de vingt. Au-delà de vingt éléments, un
 * nouveau cycle complet est ouvert avec une sous-graine différente.
 */
export function tirerProfilsPonderes({ paquet, graine, nombreElements }) {
  if (!paquet || paquet.tailleReference !== TAILLE_PAQUET_REFERENCE) {
    throw new TypeError("paquet pondéré : paquet de référence validé requis");
  }
  validerGraine(graine);
  exigerNombreElements(nombreElements);
  const resultat = [];
  for (let cycle = 0; resultat.length < nombreElements; cycle += 1) {
    const aleatoire = creerGenerateur(
      `paquet-v${VERSION_PAQUETS_PONDERES}:${paquet.id}:${graine}:cycle-${cycle}`,
    );
    resultat.push(...aleatoire.melange(jetonsCanoniques(paquet, cycle)));
  }
  return resultat.slice(0, nombreElements);
}

/**
 * Tire plusieurs dimensions avec des sous-graines indépendantes, puis les
 * associe position par position. Le nom canonique d'une dimension fait partie
 * de sa sous-graine ; l'ordre des propriétés de l'objet est sans effet.
 */
export function tirerDimensionsPonderees({ dimensions, graine, nombreElements }) {
  if (!dimensions || typeof dimensions !== "object" || Array.isArray(dimensions)) {
    throw new TypeError("dimensions pondérées : objet de paquets requis");
  }
  validerGraine(graine);
  exigerNombreElements(nombreElements);
  const noms = Object.keys(dimensions).sort(comparerTextesCanoniques);
  if (noms.length === 0 || noms.some((nom) => !FORMAT_IDENTIFIANT.test(nom))) {
    throw new RangeError("dimensions pondérées : noms canoniques requis");
  }
  const resultat = Array.from({ length: nombreElements }, () => ({}));
  for (const nom of noms) {
    const tirages = tirerProfilsPonderes({
      paquet: dimensions[nom],
      graine: `${graine}:dimension-${nom}`,
      nombreElements,
    });
    tirages.forEach((profil, index) => {
      resultat[index][nom] = profil;
    });
  }
  return resultat.map((element) => Object.freeze(element));
}

/**
 * Associe deux dimensions déjà tirées en conservant exactement leurs quotas.
 * Le prédicat ne sert qu'aux incompatibilités réelles (par exemple un QCM de
 * coordonnées ne peut pas cibler un axe), jamais à fabriquer une progression.
 */
export function apparierProfilsCompatibles({ elements, profils, graine, estCompatible }) {
  if (!Array.isArray(elements) || !Array.isArray(profils) || elements.length !== profils.length) {
    throw new RangeError("appariement pondéré : dimensions de même longueur requises");
  }
  if (typeof estCompatible !== "function") {
    throw new TypeError("appariement pondéré : prédicat de compatibilité requis");
  }
  validerGraine(graine);
  const aleatoire = creerGenerateur(
    `appariement-paquet-v${VERSION_PAQUETS_PONDERES}:${graine}:${elements.length}`,
  );
  const profilsCanoniques = [...profils].sort((a, b) =>
    comparerTextesCanoniques(a.idTirage ?? a.id, b.idTirage ?? b.id));
  const positions = elements.map((element, index) => ({
    index,
    candidats: aleatoire.melange(
      profilsCanoniques
        .map((profil, profilIndex) => ({ profil, profilIndex }))
        .filter(({ profil }) => estCompatible(element, profil)),
    ),
  })).sort((a, b) => a.candidats.length - b.candidats.length || a.index - b.index);
  if (positions.some(({ candidats }) => candidats.length === 0)) {
    throw new Error("appariement pondéré : aucun profil compatible");
  }
  const resultat = Array(elements.length);
  const elementParProfil = Array(profilsCanoniques.length).fill(-1);
  const candidatsParElement = new Map(
    positions.map(({ index, candidats }) => [index, candidats]),
  );
  function chercherProfil(indexElement, visites) {
    for (const { profilIndex } of candidatsParElement.get(indexElement)) {
      if (visites.has(profilIndex)) continue;
      visites.add(profilIndex);
      const ancienElement = elementParProfil[profilIndex];
      if (
        ancienElement === -1
        || chercherProfil(ancienElement, visites)
      ) {
        elementParProfil[profilIndex] = indexElement;
        return true;
      }
    }
    return false;
  }
  for (const { index } of positions) {
    if (!chercherProfil(index, new Set())) {
      throw new Error("appariement pondéré : quotas incompatibles");
    }
  }
  elementParProfil.forEach((indexElement, profilIndex) => {
    if (indexElement !== -1) resultat[indexElement] = profilsCanoniques[profilIndex];
  });
  if (resultat.some((profil) => profil === undefined)) {
    throw new Error("appariement pondéré : association incomplète");
  }
  return resultat;
}

/**
 * Associe deux dimensions sans remise tout en interdisant qu'une même
 * combinaison visible soit produite deux fois. Les quotas déjà tirés sont
 * conservés intégralement ; l'appelant peut donc réessayer avec une autre
 * sous-graine lorsque son petit échantillon est mathématiquement incompatible.
 */
export function apparierProfilsSansDoublon({
  elements,
  profils,
  graine,
  cleElement,
  cleProfil,
  estCompatible = () => true,
}) {
  if (!Array.isArray(elements) || !Array.isArray(profils) || elements.length !== profils.length) {
    throw new RangeError("appariement sans doublon : dimensions de même longueur requises");
  }
  if (
    typeof cleElement !== "function"
    || typeof cleProfil !== "function"
    || typeof estCompatible !== "function"
  ) {
    throw new TypeError("appariement sans doublon : fonctions de contrainte requises");
  }
  validerGraine(graine);
  const aleatoire = creerGenerateur(
    `appariement-sans-doublon-v${VERSION_PAQUETS_PONDERES}:${graine}:${elements.length}`,
  );

  function grouper(liste, obtenirCle, nom) {
    const groupes = new Map();
    liste.forEach((valeur, index) => {
      const cle = obtenirCle(valeur);
      if (typeof cle !== "string" && typeof cle !== "number") {
        throw new TypeError(`appariement sans doublon : clé ${nom} invalide`);
      }
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push({ valeur, index });
    });
    return [...groupes.entries()]
      .sort(([a], [b]) => comparerTextesCanoniques(a, b))
      .map(([cle, valeurs]) => ({ cle, valeurs }));
  }

  const groupesElements = grouper(elements, cleElement, "élément");
  const groupesProfils = grouper(
    [...profils].sort((a, b) =>
      comparerTextesCanoniques(a.idTirage ?? a.id, b.idTirage ?? b.id)),
    cleProfil,
    "profil",
  );
  const source = 0;
  const debutElements = 1;
  const debutProfils = debutElements + groupesElements.length;
  const puits = debutProfils + groupesProfils.length;
  const graphe = Array.from({ length: puits + 1 }, () => []);

  function ajouterArc(depart, arrivee, capacite) {
    const direct = { arrivee, capacite, inverse: graphe[arrivee].length };
    const retour = { arrivee: depart, capacite: 0, inverse: graphe[depart].length };
    graphe[depart].push(direct);
    graphe[arrivee].push(retour);
    return direct;
  }

  groupesElements.forEach((groupe, index) => {
    ajouterArc(source, debutElements + index, groupe.valeurs.length);
  });
  groupesProfils.forEach((groupe, index) => {
    ajouterArc(debutProfils + index, puits, groupe.valeurs.length);
  });
  const arcsCombinaisons = [];
  groupesElements.forEach((groupeElement, indexElement) => {
    const ordreProfils = aleatoire.melange(
      groupesProfils.map((_, indexProfil) => indexProfil),
    );
    for (const indexProfil of ordreProfils) {
      const groupeProfil = groupesProfils[indexProfil];
      const compatibilites = groupeElement.valeurs.flatMap(({ valeur: element }) =>
        groupeProfil.valeurs.map(({ valeur: profil }) => estCompatible(element, profil)));
      if (compatibilites.some((valeur) => valeur !== compatibilites[0])) {
        throw new TypeError(
          "appariement sans doublon : clés insuffisantes pour la compatibilité",
        );
      }
      if (!compatibilites[0]) continue;
      const arc = ajouterArc(
        debutElements + indexElement,
        debutProfils + indexProfil,
        1,
      );
      arcsCombinaisons.push({ indexElement, indexProfil, arc });
    }
  });

  let flot = 0;
  while (true) {
    const parents = Array(graphe.length).fill(null);
    const file = [source];
    parents[source] = { depart: -1, indexArc: -1 };
    for (let curseur = 0; curseur < file.length && parents[puits] === null; curseur += 1) {
      const depart = file[curseur];
      graphe[depart].forEach((arc, indexArc) => {
        if (arc.capacite > 0 && parents[arc.arrivee] === null) {
          parents[arc.arrivee] = { depart, indexArc };
          file.push(arc.arrivee);
        }
      });
    }
    if (parents[puits] === null) break;
    let ajout = Infinity;
    for (let noeud = puits; noeud !== source;) {
      const { depart, indexArc } = parents[noeud];
      ajout = Math.min(ajout, graphe[depart][indexArc].capacite);
      noeud = depart;
    }
    for (let noeud = puits; noeud !== source;) {
      const { depart, indexArc } = parents[noeud];
      const arc = graphe[depart][indexArc];
      arc.capacite -= ajout;
      graphe[noeud][arc.inverse].capacite += ajout;
      noeud = depart;
    }
    flot += ajout;
  }
  if (flot !== elements.length) {
    throw new Error("appariement sans doublon : quotas incompatibles");
  }

  const profilsDisponibles = groupesProfils.map((groupe) => aleatoire.melange(
    groupe.valeurs.map(({ valeur }) => valeur),
  ));
  const resultat = Array(elements.length);
  groupesElements.forEach((groupe, indexElement) => {
    const indexProfils = aleatoire.melange(
      arcsCombinaisons
        .filter((liaison) => liaison.indexElement === indexElement && liaison.arc.capacite === 0)
        .map(({ indexProfil }) => indexProfil),
    );
    const positions = aleatoire.melange(groupe.valeurs.map(({ index }) => index));
    positions.forEach((position, index) => {
      resultat[position] = profilsDisponibles[indexProfils[index]].pop();
    });
  });
  return resultat;
}

/**
 * Réordonne des éléments sans modifier la sélection. La contrainte est
 * garantie lorsqu'elle est mathématiquement réalisable ; sinon la fonction
 * produit l'ordre déterministe qui évite une répétition tant qu'une autre clé
 * reste disponible.
 */
export function ordonnerEnLimitantRepetitions({
  elements,
  graine,
  cle,
  maximumConsecutif = 1,
}) {
  if (!Array.isArray(elements)) {
    throw new TypeError("ordre pondéré : tableau d'éléments requis");
  }
  if (typeof cle !== "function") {
    throw new TypeError("ordre pondéré : fonction de clé requise");
  }
  if (!Number.isInteger(maximumConsecutif) || maximumConsecutif < 1) {
    throw new RangeError("ordre pondéré : maximum consécutif positif requis");
  }
  validerGraine(graine);
  const aleatoire = creerGenerateur(
    `ordre-paquet-v${VERSION_PAQUETS_PONDERES}:${graine}:${elements.length}`,
  );
  const files = new Map();
  for (const element of elements) {
    const valeur = cle(element);
    if (typeof valeur !== "string" && typeof valeur !== "number") {
      throw new TypeError("ordre pondéré : clé texte ou numérique requise");
    }
    if (!files.has(valeur)) files.set(valeur, []);
    files.get(valeur).push(element);
  }
  for (const [valeur, file] of files) {
    const canonique = [...file].sort((a, b) => comparerTextesCanoniques(
      a?.idTirage ?? JSON.stringify(a),
      b?.idTirage ?? JSON.stringify(b),
    ));
    files.set(valeur, aleatoire.melange(canonique));
  }
  const compte = new Map([...files].map(([valeur, file]) => [valeur, file.length]));
  const valeurs = aleatoire.melange(
    [...files.keys()].sort(comparerTextesCanoniques),
  );
  const priorite = new Map(valeurs.map((valeur, index) => [valeur, index]));
  const ordreCles = [];
  const impasses = new Set();

  function placer(precedent, longueurSerie) {
    if (ordreCles.length === elements.length) return true;
    const cleMemo = `${valeurs.map((valeur) => compte.get(valeur)).join(",")}|${precedent}|${longueurSerie}`;
    if (impasses.has(cleMemo)) return false;
    const candidates = valeurs
      .filter((valeur) =>
        compte.get(valeur) > 0
        && (valeur !== precedent || longueurSerie < maximumConsecutif))
      .sort((a, b) =>
        compte.get(b) - compte.get(a) || priorite.get(a) - priorite.get(b));
    for (const choisie of candidates) {
      compte.set(choisie, compte.get(choisie) - 1);
      ordreCles.push(choisie);
      const nouvelleLongueur = choisie === precedent ? longueurSerie + 1 : 1;
      if (placer(choisie, nouvelleLongueur)) return true;
      ordreCles.pop();
      compte.set(choisie, compte.get(choisie) + 1);
    }
    impasses.add(cleMemo);
    return false;
  }

  if (!placer(undefined, 0)) {
    ordreCles.length = 0;
    for (const [valeur, file] of files) compte.set(valeur, file.length);
    let precedent;
    let longueurSerie = 0;
    while (ordreCles.length < elements.length) {
      const disponibles = valeurs
        .filter((valeur) => compte.get(valeur) > 0)
        .sort((a, b) =>
          compte.get(b) - compte.get(a) || priorite.get(a) - priorite.get(b));
      const choisie = disponibles.find((valeur) =>
        valeur !== precedent || longueurSerie < maximumConsecutif) ?? disponibles[0];
      compte.set(choisie, compte.get(choisie) - 1);
      ordreCles.push(choisie);
      if (choisie === precedent) longueurSerie += 1;
      else {
        precedent = choisie;
        longueurSerie = 1;
      }
    }
  }
  return ordreCles.map((valeur) => files.get(valeur).pop());
}
