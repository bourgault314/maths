/* Les icônes des domaines, DU JOUR (décision L, 22/10/2026) : le générateur de la V2 de Gwenaël
   (automatismes-v2/src/registre-lecteur.js) pour quatre domaines — boulier, barres, trajet, motif de
   Truchet —, plus « Proportionnalité, fonctions » : un repère pas toujours centré, des points en
   petites croix orange, et selon le jour une fonction linéaire, affine, carré ou racine carrée
   (attribut data-courbe). La même icône toute une journée (la graine vient de la date locale), une
   autre le lendemain, pour CHAQUE domaine, par construction (P13) : le dernier bit de la graine est la
   parité du jour, et chaque icône a un trait à deux valeurs réglé sur cette parité (trou du boulier à
   gauche ou à droite, barre la plus haute à gauche ou à droite, premier pas du trajet, coin du motif,
   origine du repère). Deux jours consécutifs n'ont jamais la même parité. */
const GRAINES_DOMAINES = Object.freeze({
  "nombres-calculs": 0x243f6a88,
  "espace-geometrie": 0x85a308d3,
  "donnees-probabilites": 0x13198a2e,
  "pensee-informatique": 0x03707344,
  "proportionnalite-fonctions": 0x299f31d0,
});
const CACHE_ICONES = new Map();

// Le cadre arrondi commun ; `trait` false : sans bord (il est redessiné par-dessus le motif).
const fond = (couleur, trait = "#173a5e") =>
  `<rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="${couleur}"` +
  (trait ? ` stroke="${trait}" stroke-width="1.3"/>` : "/>");
const BORD =
  '<rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="none" ' +
  'stroke="#173a5e" stroke-width="1.3"/>';
const masque = (id) =>
  `<defs><clipPath id="${id}"><rect x="4" y="4" width="28" height="28" rx="4"/></clipPath></defs>`;
const svg = (contenu, attributs = "") =>
  `<svg viewBox="0 0 36 36" focusable="false"${attributs}>${contenu}</svg>`;

function hacherTexte(texte) {
  let valeur = 0x811c9dc5;
  for (const caractere of texte) {
    valeur ^= caractere.codePointAt(0);
    valeur = Math.imul(valeur, 0x01000193);
  }
  return valeur >>> 0;
}

// La graine du jour : la date locale « aaaa-mm-jj », hachée.
export function graineDuJour(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()))
    throw new TypeError("Date invalide pour les icônes du jour.");
  const deux = (nombre) => String(nombre).padStart(2, "0");
  const annee = String(date.getFullYear()).padStart(4, "0");
  const hache = hacherTexte(`${annee}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`);
  // Le rang du jour (depuis 1970, date locale) : sa parité devient le dernier bit de la graine.
  const jour = Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);
  return (((hache >>> 1) << 1) | (jour & 1)) >>> 0;
}

// La parité du jour, portée par la graine (0 ou 1).
const parite = (graine) => graine & 1;

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

const aleatoireDomaine = (domaine, graine) =>
  creerAleatoire((graine ^ GRAINES_DOMAINES[domaine]) >>> 0);

function melanger(valeurs, aleatoire) {
  const resultat = valeurs.slice();
  for (let index = resultat.length - 1; index > 0; index -= 1) {
    const autre = Math.floor(aleatoire() * (index + 1));
    [resultat[index], resultat[autre]] = [resultat[autre], resultat[index]];
  }
  return resultat;
}

// Nombres et calculs : un boulier de trois tringles, un trou par tringle.
function iconeNombres(graine) {
  const aleatoire = aleatoireDomaine("nombres-calculs", graine);
  const emplacements = [9.5, 15, 20.5, 26];
  const lignes = [
    { y: 11.5, couleurs: ["#08aaa5", "#08aaa5", "#0b67b2"] },
    { y: 18, couleurs: ["#f58220", "#f58220", "#f58220"] },
    { y: 24.5, couleurs: ["#0b67b2", "#08aaa5", "#08aaa5"] },
  ];
  let trous = melanger([0, 1, 2, 3], aleatoire).slice(0, lignes.length);
  // Le trou du 1er rang à gauche (jour pair) ou à droite (jour impair) : sinon, le boulier en miroir.
  if (Math.floor(trous[0] / 2) !== parite(graine)) trous = trous.map((trou) => 3 - trou);
  const boules = lignes
    .flatMap((ligne, rang) =>
      emplacements
        .filter((_, index) => index !== trous[rang])
        .map(
          (x, index) =>
            `<circle cx="${x}" cy="${ligne.y}" r="2.55" fill="${ligne.couleurs[index]}"/>`,
        ),
    )
    .join("");
  return svg(
    fond("#fffaf3") +
      '<g fill="none" stroke="#aebfd1" stroke-width="1.2" stroke-linecap="round">' +
      '<path d="M7.5 11.5h21M7.5 18h21M7.5 24.5h21"/></g>' +
      `<g stroke="#fffdf8" stroke-width=".72">${boules}</g>`,
  );
}

// Données et probabilités : quatre barres, hauteurs et couleurs mélangées.
function iconeDonnees(graine) {
  const aleatoire = aleatoireDomaine("donnees-probabilites", graine);
  const hauteurs = melanger([8.5, 11, 14.5, 19], aleatoire);
  // La barre la plus haute à gauche (jour pair) ou à droite (jour impair) : sinon, en miroir.
  if (Math.floor(hauteurs.indexOf(19) / 2) !== parite(graine)) hauteurs.reverse();
  const couleurs = melanger(["#08aaa5", "#0b67b2", "#6553b8", "#f58220"], aleatoire);
  const barres = [8.5, 13.55, 18.6, 23.65]
    .map((x, index) => {
      const hauteur = hauteurs[index];
      return `<rect x="${x}" y="${28 - hauteur}" width="4.25" height="${hauteur}" rx=".8" fill="${couleurs[index]}"/>`;
    })
    .join("");
  return svg(
    fond("#fffaf5") +
      '<path d="M8 28h20" fill="none" stroke="#9eb0c2" stroke-width="1.1" stroke-linecap="round"/>' +
      `<g stroke="#fffdf8" stroke-width=".55">${barres}</g>`,
  );
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
const TRAJETS = enumererTrajets(3, 3);

// Pensée informatique : un trajet sur quadrillage, du point turquoise au drapeau.
function iconeInformatique(graine) {
  const aleatoire = aleatoireDomaine("pensee-informatique", graine);
  let trajet = TRAJETS[Math.floor(aleatoire() * TRAJETS.length)];
  // Premier pas vers la droite (jour pair) ou vers le haut (jour impair) : sinon, le trajet symétrique.
  if ((trajet[0] === "D" ? 0 : 1) !== parite(graine))
    trajet = [...trajet].map((pas) => (pas === "D" ? "H" : "D")).join("");
  const chemin = `M9 27${[...trajet].map((pas) => (pas === "D" ? "h6" : "v-6")).join("")}`;
  return svg(
    fond("#f5f4ff", "#4f5fb3") +
      '<g fill="none" stroke="#c7ccee" stroke-width=".72">' +
      '<path d="M12 4v28M18 4v28M24 4v28M4 12h28M4 18h28M4 24h28"/></g>' +
      '<circle cx="8.8" cy="27" r="2.4" fill="#08aaa5" stroke="#087f78" stroke-width=".8"/>' +
      `<path d="${chemin}" fill="none" stroke="#6553b8" stroke-width="2.35" ` +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M27 9V4.8" fill="none" stroke="#b95016" stroke-width="1.35" stroke-linecap="round"/>' +
      '<path d="M27 4.8h5.6L27 8.4Z" fill="#f58220" stroke="#b95016" stroke-width=".7" ' +
      'stroke-linejoin="round"/>',
  );
}

// Espace et géométrie : un motif de Truchet 4 × 4, son plus long chemin en orange.
function iconeGeometrie(graine) {
  const aleatoire = aleatoireDomaine("espace-geometrie", graine);
  const taille = 4;
  const cellule = 7;
  const origine = 4;
  const rayon = cellule / 2;
  let orientations = Array.from({ length: taille }, () =>
    Array.from({ length: taille }, () => (aleatoire() < 0.5 ? "a" : "b")),
  );
  // La case du coin en « a » (jour pair) ou en « b » (jour impair) : sinon, le motif retourné.
  if ((orientations[0][0] === "a" ? 0 : 1) !== parite(graine))
    orientations = orientations.map((ligne) => ligne.map((o) => (o === "a" ? "b" : "a")));
  const pairePour = (orientation, bord) =>
    (orientation === "a" ? { H: "G", G: "H", D: "B", B: "D" } : { H: "D", D: "H", G: "B", B: "G" })[
      bord
    ];
  const cheminPour = (ligne, colonne, orientation, bord) => {
    const x = origine + colonne * cellule;
    const y = origine + ligne * cellule;
    if (orientation === "a")
      return bord === "H" || bord === "G"
        ? `M${x + rayon} ${y}A${rayon} ${rayon} 0 0 1 ${x} ${y + rayon}`
        : `M${x + cellule} ${y + rayon}A${rayon} ${rayon} 0 0 0 ${x + rayon} ${y + cellule}`;
    return bord === "H" || bord === "D"
      ? `M${x + rayon} ${y}A${rayon} ${rayon} 0 0 0 ${x + cellule} ${y + rayon}`
      : `M${x} ${y + rayon}A${rayon} ${rayon} 0 0 1 ${x + rayon} ${y + cellule}`;
  };
  const cheminsBase = [];
  orientations.forEach((ligne, indexLigne) =>
    ligne.forEach((orientation, indexColonne) => {
      cheminsBase.push(cheminPour(indexLigne, indexColonne, orientation, "H"));
      cheminsBase.push(
        cheminPour(indexLigne, indexColonne, orientation, orientation === "a" ? "D" : "G"),
      );
    }),
  );
  const departs = [];
  for (let index = 0; index < taille; index += 1)
    departs.push(
      { ligne: 0, colonne: index, bord: "H" },
      { ligne: index, colonne: taille - 1, bord: "D" },
      { ligne: taille - 1, colonne: index, bord: "B" },
      { ligne: index, colonne: 0, bord: "G" },
    );
  const suivre = (depart) => {
    const parcours = [];
    const visites = new Set();
    let courant = { ...depart };
    while (
      courant.ligne >= 0 &&
      courant.ligne < taille &&
      courant.colonne >= 0 &&
      courant.colonne < taille
    ) {
      const orientation = orientations[courant.ligne][courant.colonne];
      const sortie = pairePour(orientation, courant.bord);
      const cle = `${courant.ligne}:${courant.colonne}:${[courant.bord, sortie].sort().join("")}`;
      if (visites.has(cle)) break;
      visites.add(cle);
      parcours.push(cheminPour(courant.ligne, courant.colonne, orientation, courant.bord));
      const { ligne, colonne } = courant;
      if (sortie === "H") courant = { ligne: ligne - 1, colonne, bord: "B" };
      if (sortie === "D") courant = { ligne, colonne: colonne + 1, bord: "G" };
      if (sortie === "B") courant = { ligne: ligne + 1, colonne, bord: "H" };
      if (sortie === "G") courant = { ligne, colonne: colonne - 1, bord: "D" };
    }
    return parcours;
  };
  const decalage = Math.floor(aleatoire() * departs.length);
  const cheminOrange = departs
    .slice(decalage)
    .concat(departs.slice(0, decalage))
    .map(suivre)
    .reduce((plusLong, parcours) => (parcours.length > plusLong.length ? parcours : plusLong), []);
  const id = `mathsgo-truchet-${graine.toString(16)}`;
  const traits = (chemins) => chemins.map((d) => `<path d="${d}"/>`).join("");
  return svg(
    masque(id) +
      fond("#f4fbfa", false) +
      `<g clip-path="url(#${id})">` +
      `<g fill="none" stroke="#167f7b" stroke-width="1.2" stroke-linecap="round">${traits(cheminsBase)}</g>` +
      `<g fill="none" stroke="#f58220" stroke-width="2" stroke-linecap="round">${traits(cheminOrange)}</g>` +
      `</g>${BORD}`,
  );
}

const arrondi = (valeur) => Math.round(valeur * 100) / 100;

// Les quatre familles de courbes, chacune avec les origines où elle tient dans le cadre.
const COURBES = {
  lineaire: [
    [9, 27],
    [12, 24],
    [18, 18],
    [9, 18],
  ],
  affine: [
    [9, 27],
    [9, 22],
    [12, 27],
  ],
  carre: [
    [18, 27],
    [18, 23],
    [18, 18],
  ],
  racine: [
    [9, 27],
    [9, 22],
    [12, 24],
  ],
};
export const TYPES_COURBES = Object.keys(COURBES);

// Proportionnalité, fonctions : un repère, une courbe du jour, trois points en croix.
function iconeFonctions(graine) {
  const aleatoire = aleatoireDomaine("proportionnalite-fonctions", graine);
  const choisir = (liste) => liste[Math.floor(aleatoire() * liste.length)];
  const type = choisir(TYPES_COURBES);
  // Une origine sur deux selon la parité du jour : même courbe deux jours de suite, autre repère.
  const [ox, oy] = choisir(COURBES[type].filter((_, rang) => rang % 2 === parite(graine)));
  // f(x) en unités du dessin (x vers la droite depuis O, y vers le HAUT depuis O).
  let f;
  let croixX;
  if (type === "lineaire") {
    const k = choisir(oy === 18 ? [0.7, 1, 1.4, -0.8, -1.2] : [0.7, 1, 1.4]);
    f = (x) => k * x;
    croixX = [-6, 5, 10].filter((x) => ox + x > 5);
  } else if (type === "affine") {
    const b = choisir([3, 5, 7]);
    const m = choisir([0.5, 0.8, -0.4]);
    f = (x) => m * x + b;
    croixX = [0, 6, 12];
  } else if (type === "carre") {
    const a = oy === 18 ? 0.17 : choisir([0.2, 0.25]);
    f = (x) => a * x * x;
    croixX = [-6, 0, 6];
  } else {
    const a = choisir([3, 3.6]);
    f = (x) => (x >= 0 ? a * Math.sqrt(x) : NaN);
    croixX = [2, 8, 16];
  }
  const points = [];
  for (let x = -14; x <= 24; x += 0.5) {
    const y = f(x);
    if (Number.isFinite(y) && ox + x >= 3 && ox + x <= 33) points.push([ox + x, oy - y]);
  }
  const courbe = `M${points.map(([x, y]) => `${arrondi(x)} ${arrondi(y)}`).join("L")}`;
  const croix = croixX
    .map((x) => [ox + x, oy - f(x)])
    .filter(([x, y]) => x > 6 && x < 30 && y > 6 && y < 30)
    .map(([x, y]) => {
      const [g, h, b] = [arrondi(x - 1.7), arrondi(y - 1.7), arrondi(y + 1.7)];
      return `M${g} ${h}l3.4 3.4M${g} ${b}l3.4 -3.4`;
    })
    .join("");
  const id = `mathsgo-fonctions-${graine.toString(16)}`;
  return svg(
    masque(id) +
      fond("#f3fbfa", false) +
      `<g clip-path="url(#${id})">` +
      `<path d="M4 ${oy}h28M${ox} 32V4" fill="none" stroke="#9eb0c2" stroke-width="1.1"/>` +
      `<path d="${courbe}" fill="none" stroke="#0b67b2" stroke-width="2.1" ` +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      `<path d="${croix}" fill="none" stroke="#f58220" stroke-width="1.35" stroke-linecap="round"/>` +
      `</g>${BORD}`,
    ` data-courbe="${type}"`,
  );
}

const GENERATEURS = {
  "nombres-calculs": iconeNombres,
  "proportionnalite-fonctions": iconeFonctions,
  "espace-geometrie": iconeGeometrie,
  "donnees-probabilites": iconeDonnees,
  "pensee-informatique": iconeInformatique,
};

// L'icône d'un domaine pour une graine (par défaut, celle du jour) ; "" pour un domaine inconnu.
export function iconeDomaine(domaine, graine = graineDuJour()) {
  const cle = `${domaine}:${graine}`;
  if (!CACHE_ICONES.has(cle)) CACHE_ICONES.set(cle, GENERATEURS[domaine]?.(graine) || "");
  return CACHE_ICONES.get(cle);
}
