const GRAINES_DOMAINES = Object.freeze({
  nombres: 0x243f6a88,
  geometrie: 0x85a308d3,
  donnees: 0x13198a2e,
  informatique: 0x03707344,
});

export const ICONES_DOMAINES_MENU = Object.freeze({
  NOMBRES: "nombres",
  GEOMETRIE: "geometrie",
  DONNEES: "donnees",
  INFORMATIQUE: "informatique",
});

const CACHE_ICONES = new Map();

function hacherTexte(texte) {
  let valeur = 0x811c9dc5;
  for (const caractere of texte) {
    valeur ^= caractere.codePointAt(0);
    valeur = Math.imul(valeur, 0x01000193);
  }
  return valeur >>> 0;
}

export function graineIconesDomainesDuJour(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("date invalide pour les icônes du menu");
  }
  const annee = String(date.getFullYear()).padStart(4, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return hacherTexte(`${annee}-${mois}-${jour}`);
}

function creerAleatoire(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let valeur = etat;
    valeur = Math.imul(valeur ^ (valeur >>> 15), valeur | 1);
    valeur ^= valeur + Math.imul(valeur ^ (valeur >>> 7), valeur | 61);
    return ((valeur ^ (valeur >>> 14)) >>> 0) / 4294967296;
  };
}

function aleatoireDomaine(domaine, graine) {
  return creerAleatoire((graine ^ GRAINES_DOMAINES[domaine]) >>> 0);
}

function melanger(valeurs, aleatoire) {
  const resultat = valeurs.slice();
  for (let index = resultat.length - 1; index > 0; index -= 1) {
    const autre = Math.floor(aleatoire() * (index + 1));
    [resultat[index], resultat[autre]] = [resultat[autre], resultat[index]];
  }
  return resultat;
}

function rendreIconeNombres(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.NOMBRES, graine);
  const emplacements = [9.5, 15, 20.5, 26];
  const lignes = [
    { y: 11.5, couleurs: ["#08aaa5", "#08aaa5", "#0b67b2"] },
    { y: 18, couleurs: ["#f58220", "#f58220", "#f58220"] },
    { y: 24.5, couleurs: ["#0b67b2", "#08aaa5", "#08aaa5"] },
  ];
  const trous = melanger([0, 1, 2, 3], aleatoire).slice(0, lignes.length);
  const boules = lignes.flatMap((ligne, indexLigne) => {
    const occupes = emplacements.filter((_, index) => index !== trous[indexLigne]);
    return occupes.map((x, index) =>
      `<circle cx="${x}" cy="${ligne.y}" r="2.55" fill="${ligne.couleurs[index]}"/>`);
  }).join("");
  return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf3" stroke="#173a5e" stroke-width="1.3"/><g fill="none" stroke="#aebfd1" stroke-width="1.2" stroke-linecap="round"><path d="M7.5 11.5h21M7.5 18h21M7.5 24.5h21"/></g><g stroke="#fffdf8" stroke-width=".72">${boules}</g></svg>`;
}

function rendreIconeDonnees(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.DONNEES, graine);
  const hauteurs = melanger([8.5, 11, 14.5, 19], aleatoire);
  const couleurs = melanger(["#08aaa5", "#0b67b2", "#6553b8", "#f58220"], aleatoire);
  const abscisses = [8.5, 13.55, 18.6, 23.65];
  const barres = abscisses.map((x, index) => {
    const hauteur = hauteurs[index];
    return `<rect x="${x}" y="${28 - hauteur}" width="4.25" height="${hauteur}" rx=".8" fill="${couleurs[index]}"/>`;
  }).join("");
  return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf5" stroke="#173a5e" stroke-width="1.3"/><path d="M8 28h20" fill="none" stroke="#9eb0c2" stroke-width="1.1" stroke-linecap="round"/><g stroke="#fffdf8" stroke-width=".55">${barres}</g></svg>`;
}

function enumererTrajets(droite, haut, prefixe = "", trajets = []) {
  if (droite === 0 && haut === 0) {
    trajets.push(prefixe);
    return trajets;
  }
  if (droite > 0) enumererTrajets(droite - 1, haut, `${prefixe}D`, trajets);
  if (haut > 0) enumererTrajets(droite, haut - 1, `${prefixe}H`, trajets);
  return trajets;
}

function rendreIconeInformatique(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.INFORMATIQUE, graine);
  const trajets = enumererTrajets(3, 3);
  const trajet = trajets[Math.floor(aleatoire() * trajets.length)];
  const chemin = `M9 27${[...trajet].map((mouvement) => mouvement === "D" ? "h6" : "v-6").join("")}`;
  return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#f5f4ff" stroke="#4f5fb3" stroke-width="1.3"/><g fill="none" stroke="#c7ccee" stroke-width=".72"><path d="M12 4v28M18 4v28M24 4v28M4 12h28M4 18h28M4 24h28"/></g><circle cx="8.8" cy="27" r="2.4" fill="#08aaa5" stroke="#087f78" stroke-width=".8"/><path d="${chemin}" fill="none" stroke="#6553b8" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 9V4.8" fill="none" stroke="#b95016" stroke-width="1.35" stroke-linecap="round"/><path d="M27 4.8h5.6L27 8.4Z" fill="#f58220" stroke="#b95016" stroke-width=".7" stroke-linejoin="round"/></svg>`;
}

function rendreIconeGeometrie(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.GEOMETRIE, graine);
  const taille = 4;
  const cellule = 7;
  const origine = 4;
  const rayon = cellule / 2;
  const orientations = Array.from({ length: taille }, () =>
    Array.from({ length: taille }, () => aleatoire() < 0.5 ? "a" : "b"));

  const pairePour = (orientation, bord) => {
    const paires = orientation === "a"
      ? { H: "G", G: "H", D: "B", B: "D" }
      : { H: "D", D: "H", G: "B", B: "G" };
    return paires[bord];
  };
  const cheminPour = (ligne, colonne, orientation, bord) => {
    const x = origine + colonne * cellule;
    const y = origine + ligne * cellule;
    if (orientation === "a") {
      return bord === "H" || bord === "G"
        ? `M${x + rayon} ${y}A${rayon} ${rayon} 0 0 1 ${x} ${y + rayon}`
        : `M${x + cellule} ${y + rayon}A${rayon} ${rayon} 0 0 0 ${x + rayon} ${y + cellule}`;
    }
    return bord === "H" || bord === "D"
      ? `M${x + rayon} ${y}A${rayon} ${rayon} 0 0 0 ${x + cellule} ${y + rayon}`
      : `M${x} ${y + rayon}A${rayon} ${rayon} 0 0 1 ${x + rayon} ${y + cellule}`;
  };

  const cheminsBase = [];
  orientations.forEach((ligne, indexLigne) => ligne.forEach((orientation, indexColonne) => {
    cheminsBase.push(cheminPour(indexLigne, indexColonne, orientation, "H"));
    cheminsBase.push(cheminPour(indexLigne, indexColonne, orientation, orientation === "a" ? "D" : "G"));
  }));

  const departs = [];
  for (let index = 0; index < taille; index += 1) {
    departs.push(
      { ligne: 0, colonne: index, bord: "H" },
      { ligne: index, colonne: taille - 1, bord: "D" },
      { ligne: taille - 1, colonne: index, bord: "B" },
      { ligne: index, colonne: 0, bord: "G" },
    );
  }
  const suivre = (depart) => {
    const parcours = [];
    const visites = new Set();
    let courant = { ...depart };
    while (
      courant.ligne >= 0 && courant.ligne < taille
      && courant.colonne >= 0 && courant.colonne < taille
    ) {
      const orientation = orientations[courant.ligne][courant.colonne];
      const sortie = pairePour(orientation, courant.bord);
      const cle = `${courant.ligne}:${courant.colonne}:${[courant.bord, sortie].sort().join("")}`;
      if (visites.has(cle)) break;
      visites.add(cle);
      parcours.push(cheminPour(courant.ligne, courant.colonne, orientation, courant.bord));
      if (sortie === "H") courant = { ligne: courant.ligne - 1, colonne: courant.colonne, bord: "B" };
      if (sortie === "D") courant = { ligne: courant.ligne, colonne: courant.colonne + 1, bord: "G" };
      if (sortie === "B") courant = { ligne: courant.ligne + 1, colonne: courant.colonne, bord: "H" };
      if (sortie === "G") courant = { ligne: courant.ligne, colonne: courant.colonne - 1, bord: "D" };
    }
    return parcours;
  };
  const decalage = Math.floor(aleatoire() * departs.length);
  const departsOrdonnes = departs.slice(decalage).concat(departs.slice(0, decalage));
  const cheminOrange = departsOrdonnes
    .map(suivre)
    .reduce((plusLong, parcours) => parcours.length > plusLong.length ? parcours : plusLong, []);
  const idMasque = `mathsgo-truchet-${graine.toString(16)}`;
  const base = cheminsBase.map((d) => `<path d="${d}"/>`).join("");
  const orange = cheminOrange.map((d) => `<path d="${d}"/>`).join("");
  return `<svg viewBox="0 0 36 36" focusable="false"><defs><clipPath id="${idMasque}"><rect x="4" y="4" width="28" height="28" rx="4"/></clipPath></defs><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#f4fbfa"/><g clip-path="url(#${idMasque})"><g fill="none" stroke="#167f7b" stroke-width="1.2" stroke-linecap="round">${base}</g><g fill="none" stroke="#f58220" stroke-width="2" stroke-linecap="round">${orange}</g></g><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="none" stroke="#173a5e" stroke-width="1.3"/></svg>`;
}

export function rendreIconeDomaineMenu(domaine, graine = graineIconesDomainesDuJour()) {
  if (!Object.values(ICONES_DOMAINES_MENU).includes(domaine)) {
    throw new RangeError(`domaine d'icône inconnu : ${domaine}`);
  }
  if (!Number.isInteger(graine) || graine < 0 || graine > 0xffffffff) {
    throw new RangeError("graine d'icône invalide");
  }
  const cle = `${domaine}:${graine}`;
  if (CACHE_ICONES.has(cle)) return CACHE_ICONES.get(cle);
  const generateurs = {
    [ICONES_DOMAINES_MENU.NOMBRES]: rendreIconeNombres,
    [ICONES_DOMAINES_MENU.GEOMETRIE]: rendreIconeGeometrie,
    [ICONES_DOMAINES_MENU.DONNEES]: rendreIconeDonnees,
    [ICONES_DOMAINES_MENU.INFORMATIQUE]: rendreIconeInformatique,
  };
  const rendu = generateurs[domaine](graine);
  CACHE_ICONES.set(cle, rendu);
  return rendu;
}
