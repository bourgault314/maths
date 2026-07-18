// Objet officiel « deux plateaux » (ÉquaSplat) — version 1, BROUILLON.
//
// LE plateau double du Splat d'équations, porté verbatim des outils
// historiques (outils/equasplat.html, outils/equasplat_import_splat.html) :
// deux plateaux arrondis face à face, le signe « = » entre les deux,
// des taches qui cachent l'inconnue (violettes quand c'est −x), des
// jetons numériques ronds que l'on fait glisser, les hachures des
// pièces enlevées, et les boîtes de paquets du mode billes.
//
// Le dessin est une chaîne SVG PURE et déterministe : mêmes pièces,
// mêmes positions, même dessin — donc testable et exportable, à toute
// taille (tableau de classe comme écran de téléphone). Le placement
// « naturel » des jetons est reproductible : il consomme le générateur
// seedé du moteur d'exercices, jamais Math.random.
//
// Couleurs et mesures relevées dans l'outil :
// - plateaux 720×650 dans une scène 1600×820, coins 34 ;
// - taches r=84 : encre #111827, opposées #4c1d95, texte blanc italique ;
// - jetons r=54 : en positif, teinte par valeur (h = |v|·37 mod 360) ;
//   en relatif, vert (positif) / rouge (négatif) / gris (zéro) ;
// - billes unitaires r=18, bleu rgba(27,102,255), sans chiffre ;
// - boîtes de paquets bleues en pointillé, vertes quand le compte est bon.

import { cheminTache } from "./splat.js";

export const VERSION_PLATEAUX_SPLAT = 1;

export const SCENE = { largeur: 1600, hauteur: 820 };
export const RAYON_JETON = 54;
export const RAYON_BILLE = 18;
export const RAYON_TACHE = 84;

export const COULEURS_PLATEAUX = {
  plateauFond: "rgba(255,255,255,.82)",
  plateauBord: "rgba(15,23,42,.18)",
  egal: "#94a3b8",
  tache: "#111827",
  tacheOpposee: "#4c1d95",
  tacheBord: "rgba(0,0,0,.22)",
  tacheTexte: "#ffffff",
  jetonTexte: "#0f172a",
  relatifPositifFond: "#ecfdf5",
  relatifPositifBord: "#16a34a",
  negatifFond: "#fff1f2",
  negatifBord: "#e11d48",
  zeroFond: "#f1f5f9",
  zeroBord: "#64748b",
  billeFond: "rgba(27,102,255,0.18)",
  billeBord: "rgba(27,102,255,0.58)",
  selectionSuppression: "#f97316",
  selectionRegroupement: "#16a34a",
  paquetBord: "rgba(59,130,246,.42)",
  paquetFond: "rgba(255,255,255,.42)",
  paquetJusteBord: "rgba(22,163,74,.82)",
  paquetJusteFond: "rgba(22,163,74,.12)",
};

/** Le rectangle d'un plateau. */
export function plateauDuCote(cote) {
  return cote === "gauche"
    ? { x: 40, y: 74, w: 720, h: 650 }
    : { x: 840, y: 74, w: 720, h: 650 };
}

/** En positif, chaque valeur reçoit sa teinte (verbatim de l'outil). */
export function couleurJetonPositif(valeur) {
  const magnitude = Math.abs(Math.round(Number(valeur) || 0));
  const teinte = ((magnitude * 37) % 360 + 360) % 360;
  return {
    fond: `hsla(${teinte}, 78%, 54%, .20)`,
    bord: `hsla(${teinte}, 78%, 45%, .62)`,
  };
}

const rayonJeton = (piece) => (piece.unitaire ? RAYON_BILLE : RAYON_JETON);

// Les rangées de taches : 1 → [1], 3 → [2,1], 5+ → [3, reste].
function rangeesDeTaches(n) {
  if (n <= 1) return [n];
  if (n === 2) return [2];
  if (n === 3) return [2, 1];
  if (n === 4) return [2, 2];
  return [3, n - 3];
}

/**
 * Les positions des taches d'un membre — toujours calculées, jamais
 * mémorisées : la constellation se resserre quand une tache part.
 * @returns {Map<number, {cx: number, cy: number, r: number}>} indice → position
 */
export function positionsTaches(pieces, plateau) {
  const zone = { x: plateau.x + 70, y: plateau.y + 80, w: plateau.w - 140, h: 400 };
  const indices = [];
  pieces.forEach((piece, indice) => {
    if (piece.type === "tache") indices.push(indice);
  });
  const rangees = rangeesDeTaches(indices.length);
  const positions = new Map();
  let k = 0;
  for (let r = 0; r < rangees.length; r++) {
    const colonnes = rangees[r];
    const largeurCase = zone.w / Math.max(1, colonnes);
    const cy = zone.y + zone.h * ((r + 0.5) / rangees.length);
    for (let c = 0; c < colonnes && k < indices.length; c++, k++) {
      positions.set(indices[k], { cx: zone.x + largeurCase * (c + 0.5), cy, r: RAYON_TACHE });
    }
  }
  return positions;
}

function zoneJetons(plateau) {
  return { x: plateau.x + 42, y: plateau.y + 54, w: plateau.w - 84, h: plateau.h - 96 };
}

const borner = (v, min, max) => Math.max(min, Math.min(max, v));

function eloignerDesTaches(plateau, pieces, cx, cy, r) {
  let p = { cx, cy };
  const taches = [...positionsTaches(pieces, plateau).values()];
  for (let passe = 0; passe < 5; passe++) {
    let bouge = false;
    for (const t of taches) {
      const distanceMin = t.r + r + 16;
      let dx = p.cx - t.cx;
      let dy = p.cy - t.cy;
      let distance = Math.hypot(dx, dy);
      if (distance < distanceMin) {
        if (distance < 0.001) {
          dx = 1;
          dy = 0;
          distance = 1;
        }
        const poussee = distanceMin - distance;
        p.cx += (dx / distance) * poussee;
        p.cy += (dy / distance) * poussee;
        const zone = zoneJetons(plateau);
        p = {
          cx: borner(p.cx, zone.x + r, zone.x + zone.w - r),
          cy: borner(p.cy, zone.y + r, zone.y + zone.h - r),
        };
        bouge = true;
      }
    }
    if (!bouge) break;
  }
  return p;
}

/**
 * Contraint la position d'un jeton : dans le plateau, hors des taches.
 * C'est la règle du glisser-déposer de l'interface.
 */
export function contraindrePositionJeton(plateau, pieces, cx, cy, r = RAYON_JETON) {
  const zone = zoneJetons(plateau);
  const bornee = {
    cx: borner(cx, zone.x + r, zone.x + zone.w - r),
    cy: borner(cy, zone.y + r, zone.y + zone.h - r),
  };
  return eloignerDesTaches(plateau, pieces, bornee.cx, bornee.cy, r);
}

/**
 * Pose des coordonnées « naturelles » sur les jetons qui n'en ont pas
 * encore : tirage reproductible (générateur seedé), hors des taches,
 * sans chevauchement, puis petite relaxation. Les jetons déjà placés
 * (glissés à la main) ne bougent que s'ils gênent.
 */
export function placerJetons(etat, generateur) {
  for (const cote of ["gauche", "droite"]) {
    const plateau = plateauDuCote(cote);
    const pieces = etat[cote];
    const zone = zoneJetons(plateau);
    const taches = [...positionsTaches(pieces, plateau).values()];
    const jetons = pieces.filter((p) => p.type === "jeton");
    const poses = [];

    for (const jeton of jetons) {
      const r = rayonJeton(jeton);
      if (Number.isFinite(jeton.x) && Number.isFinite(jeton.y)) {
        const p = contraindrePositionJeton(plateau, pieces, jeton.x, jeton.y, r);
        jeton.x = p.cx;
        jeton.y = p.cy;
        poses.push({ cx: p.cx, cy: p.cy, r });
        continue;
      }
      let trouvee = null;
      for (let essai = 0; essai < 140 && !trouvee; essai++) {
        const cx = zone.x + r + generateur.reel() * Math.max(1, zone.w - 2 * r);
        const cy = zone.y + r + generateur.reel() * Math.max(1, zone.h - 2 * r);
        const p = contraindrePositionJeton(plateau, pieces, cx, cy, r);
        const surTache = taches.some((t) => Math.hypot(p.cx - t.cx, p.cy - t.cy) < t.r + r + 18);
        const tropPres = poses.some(
          (q) => Math.hypot(p.cx - q.cx, p.cy - q.cy) < (r + q.r) * (essai < 90 ? 1.06 : 0.91),
        );
        if (!surTache && !tropPres) trouvee = p;
      }
      if (!trouvee) {
        trouvee = contraindrePositionJeton(
          plateau,
          pieces,
          zone.x + zone.w * (0.28 + generateur.reel() * 0.44),
          zone.y + zone.h * (0.56 + generateur.reel() * 0.34),
          r,
        );
      }
      jeton.x = trouvee.cx;
      jeton.y = trouvee.cy;
      poses.push({ cx: trouvee.cx, cy: trouvee.cy, r });
    }

    // relaxation : on écarte les derniers chevauchements
    for (let passe = 0; passe < 18; passe++) {
      let bouge = false;
      for (let i = 0; i < jetons.length; i++) {
        for (let j = i + 1; j < jetons.length; j++) {
          const a = jetons[i];
          const b = jetons[j];
          const distanceMin = (rayonJeton(a) + rayonJeton(b)) * 1.05;
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distance = Math.hypot(dx, dy);
          if (distance < 0.001) {
            dx = 1;
            dy = 0;
            distance = 1;
          }
          if (distance < distanceMin) {
            const poussee = (distanceMin - distance) / 2;
            const pa = contraindrePositionJeton(
              plateau, pieces, a.x - (dx / distance) * poussee, a.y - (dy / distance) * poussee, rayonJeton(a),
            );
            const pb = contraindrePositionJeton(
              plateau, pieces, b.x + (dx / distance) * poussee, b.y + (dy / distance) * poussee, rayonJeton(b),
            );
            a.x = pa.cx;
            a.y = pa.cy;
            b.x = pb.cx;
            b.y = pb.cy;
            bouge = true;
          }
        }
      }
      if (!bouge) break;
    }
  }
  return etat;
}

/**
 * Le jeton sur lequel on vient d'en déposer un autre (candidat à la
 * fusion) : il faut déposer franchement dessus, sans viser le centre.
 * @returns {number | null} l'indice du jeton cible
 */
export function chercherFusion(etat, cote, indiceSource, cx, cy) {
  const pieces = etat[cote];
  const source = pieces?.[indiceSource];
  if (!source || source.type !== "jeton" || source.etat === "supprime") return null;
  let meilleur = null;
  let meilleureDistance = Infinity;
  pieces.forEach((piece, indice) => {
    if (indice === indiceSource || piece.type !== "jeton" || piece.etat === "supprime") return;
    if (!Number.isFinite(piece.x) || !Number.isFinite(piece.y)) return;
    const distance = Math.hypot(cx - piece.x, cy - piece.y);
    if (distance < RAYON_JETON * 1.55 && distance < meilleureDistance) {
      meilleur = indice;
      meilleureDistance = distance;
    }
  });
  return meilleur;
}

// La grille des boîtes de paquets (mode billes), verbatim.
function grilleDePaquets(plateau, nombrePaquets) {
  const colonnes = Math.ceil(Math.sqrt(nombrePaquets));
  const rangees = Math.ceil(nombrePaquets / colonnes);
  const marge = 34;
  const ecart = 14;
  const largeur = (plateau.w - marge * 2 - ecart * (colonnes - 1)) / colonnes;
  const hauteur = (plateau.h - 96 - marge - ecart * (rangees - 1)) / rangees;
  const boites = [];
  for (let i = 0; i < nombrePaquets; i++) {
    boites.push({
      x: plateau.x + marge + (i % colonnes) * (largeur + ecart),
      y: plateau.y + 78 + Math.floor(i / colonnes) * (hauteur + ecart),
      w: largeur,
      h: hauteur,
    });
  }
  return boites;
}

function positionsDansBoite(boite, nombre) {
  const r = RAYON_BILLE;
  const marge = 24;
  const colonnes = Math.max(1, Math.floor((boite.w - marge * 2) / (r * 2 + 8)));
  const rangees = Math.max(1, Math.ceil(nombre / colonnes));
  const pasX = nombre === 1 ? 0 : Math.min(r * 2 + 12, (boite.w - marge * 2) / Math.max(1, Math.min(colonnes, nombre) - 1 || 1));
  const pasY = rangees <= 1 ? 0 : Math.min(r * 2 + 10, (boite.h - marge * 2 - 18) / Math.max(1, rangees - 1));
  const departY = boite.y + boite.h / 2 - ((rangees - 1) * pasY) / 2 + 8;
  const positions = [];
  for (let i = 0; i < nombre; i++) {
    const rangee = Math.floor(i / colonnes);
    const colonnesUtiles = Math.min(colonnes, nombre - rangee * colonnes);
    const departX = boite.x + boite.w / 2 - ((colonnesUtiles - 1) * pasX) / 2;
    positions.push({ cx: departX + (i % colonnes) * pasX, cy: departY + rangee * pasY, r });
  }
  return positions;
}

/**
 * Le rangement en paquets : les boîtes et la position de chaque bille.
 * @returns {{boites: Array, positions: Map<number, object>} | null}
 */
export function dispositionPaquets(etat) {
  if (!etat.paquets) return null;
  const { cote, nombrePaquets, parPaquet } = etat.paquets;
  const plateau = plateauDuCote(cote);
  const indices = [];
  etat[cote].forEach((piece, indice) => {
    if (piece.type === "jeton" && piece.unitaire && piece.etat !== "supprime") indices.push(indice);
  });
  if (indices.length !== nombrePaquets * parPaquet) return null;
  const boites = grilleDePaquets(plateau, nombrePaquets);
  const positions = new Map();
  let curseur = 0;
  boites.forEach((boite) => {
    for (const p of positionsDansBoite(boite, parPaquet)) {
      if (curseur >= indices.length) break;
      positions.set(indices[curseur], p);
      curseur++;
    }
  });
  return { cote, boites, positions };
}

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

const MOTIF_HACHURES =
  `<pattern id="hachuresSupprime" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">` +
  `<rect width="12" height="12" fill="rgba(229,231,235,.56)"/>` +
  `<line x1="0" y1="0" x2="0" y2="12" stroke="rgba(15,23,42,.50)" stroke-width="3"/>` +
  `</pattern>`;

function etiquetteTache(etat, piece) {
  const base = etat.affichageInconnue === "question" ? "?" : etat.lettre;
  return signePiece(piece) < 0 ? `−${base}` : base;
}

const signePiece = (piece) => (piece.signe === -1 ? -1 : 1);

function dessinerUneTache(etat, piece, pos, marques) {
  const opposee = signePiece(piece) < 0;
  const chemin = cheminTache(pos.cx, pos.cy, pos.r);
  const morceaux = [
    `<path d="${chemin}" fill="${opposee ? COULEURS_PLATEAUX.tacheOpposee : COULEURS_PLATEAUX.tache}" stroke="${opposee ? "rgba(76,29,149,.42)" : COULEURS_PLATEAUX.tacheBord}" stroke-width="3"/>`,
    `<text x="${pos.cx}" y="${pos.cy + 5}" fill="${COULEURS_PLATEAUX.tacheTexte}" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="38" font-weight="950" text-anchor="middle" dominant-baseline="middle">${echapper(etiquetteTache(etat, piece))}</text>`,
  ];
  if (piece.etat === "supprime") {
    morceaux.push(`<path d="${chemin}" fill="url(#hachuresSupprime)" stroke="rgba(15,23,42,.45)" stroke-width="2"/>`);
  }
  if (marques.suppression) {
    morceaux.push(`<path d="${cheminTache(pos.cx, pos.cy, pos.r + 8)}" fill="none" stroke="${COULEURS_PLATEAUX.selectionSuppression}" stroke-width="7" opacity=".85"/>`);
  }
  if (marques.regroupement) {
    morceaux.push(`<path d="${cheminTache(pos.cx, pos.cy, pos.r + 8)}" fill="none" stroke="${COULEURS_PLATEAUX.selectionRegroupement}" stroke-width="7" opacity=".9"/>`);
  }
  return morceaux.join("");
}

function couleursJeton(etat, piece) {
  if (piece.unitaire) {
    return { fond: COULEURS_PLATEAUX.billeFond, bord: COULEURS_PLATEAUX.billeBord };
  }
  const valeur = Number(piece.valeur);
  if (valeur < 0) return { fond: COULEURS_PLATEAUX.negatifFond, bord: COULEURS_PLATEAUX.negatifBord };
  if (valeur === 0) return { fond: COULEURS_PLATEAUX.zeroFond, bord: COULEURS_PLATEAUX.zeroBord };
  if (etat.univers === "relatif") {
    return { fond: COULEURS_PLATEAUX.relatifPositifFond, bord: COULEURS_PLATEAUX.relatifPositifBord };
  }
  return couleurJetonPositif(valeur);
}

function dessinerUnJeton(etat, piece, pos, marques) {
  const { fond, bord } = couleursJeton(etat, piece);
  const morceaux = [
    `<circle cx="${pos.cx}" cy="${pos.cy}" r="${pos.r}" fill="${fond}" stroke="${bord}" stroke-width="3"/>`,
  ];
  if (!piece.unitaire) {
    const texte = Number(piece.valeur) < 0 ? `−${Math.abs(piece.valeur)}` : String(piece.valeur);
    morceaux.push(
      `<text x="${pos.cx}" y="${pos.cy + 2}" fill="${COULEURS_PLATEAUX.jetonTexte}" font-family="system-ui, sans-serif" font-size="50" font-weight="950" text-anchor="middle" dominant-baseline="middle">${echapper(texte)}</text>`,
    );
  }
  if (piece.etat === "supprime") {
    morceaux.push(`<circle cx="${pos.cx}" cy="${pos.cy}" r="${pos.r}" fill="url(#hachuresSupprime)" stroke="rgba(15,23,42,.45)" stroke-width="2"/>`);
  }
  if (marques.suppression) {
    morceaux.push(`<circle cx="${pos.cx}" cy="${pos.cy}" r="${pos.r + 8}" fill="none" stroke="${COULEURS_PLATEAUX.selectionSuppression}" stroke-width="7" opacity=".85"/>`);
  }
  if (marques.regroupement) {
    morceaux.push(`<circle cx="${pos.cx}" cy="${pos.cy}" r="${pos.r + 8}" fill="none" stroke="${COULEURS_PLATEAUX.selectionRegroupement}" stroke-width="7" opacity=".9"/>`);
  }
  return morceaux.join("");
}

// Position de repli déterministe pour un jeton jamais placé (tests,
// premier rendu avant placerJetons) : petite grille sous les taches.
function positionDeRepli(plateau, rang, r) {
  const zone = zoneJetons(plateau);
  const parRangee = Math.max(1, Math.floor(zone.w / (r * 2.4)));
  return {
    cx: zone.x + r + (rang % parRangee) * r * 2.4,
    cy: zone.y + zone.h - r - Math.floor(rang / parRangee) * r * 2.3,
    r,
  };
}

/**
 * Dessine les deux plateaux.
 *
 * @param {object} etat — l'état d'equasplat-logique (gauche, droite,
 *   univers, lettre, affichageInconnue, paquets…)
 * @param {object} [options]
 * @param {number} [options.largeur] — largeur du rendu en pixels
 * @param {"garder"|"masquer"} [options.apresSuppression]
 * @param {Array<{cote, indice}>} [options.selectionSuppression] — contours oranges
 * @param {Array<{cote, indice}>} [options.selectionRegroupement] — contours verts
 * @param {boolean} [options.interactif] — pose data-cote/data-indice
 *   sur chaque pièce (pour les clics et le glisser de l'interface)
 * @returns {string} balise <svg> autonome
 */
export function dessinerPlateaux(etat, options = {}) {
  const {
    largeur = 1120,
    apresSuppression = "garder",
    selectionSuppression = [],
    selectionRegroupement = [],
    interactif = false,
  } = options;
  if (!etat || !Array.isArray(etat.gauche) || !Array.isArray(etat.droite)) {
    throw new TypeError("dessinerPlateaux : un état ÉquaSplat est requis");
  }
  const hauteur = Math.round((largeur * SCENE.hauteur) / SCENE.largeur);
  const cleSelection = (s) => `${s.cote}:${s.indice}`;
  const suppression = new Set(selectionSuppression.map(cleSelection));
  const regroupement = new Set(selectionRegroupement.map(cleSelection));
  const paquets = dispositionPaquets(etat);

  const morceaux = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCENE.largeur} ${SCENE.hauteur}" width="${largeur}" height="${hauteur}" role="img" aria-label="deux plateaux ÉquaSplat">`,
    `<defs>${MOTIF_HACHURES}</defs>`,
  ];

  for (const cote of ["gauche", "droite"]) {
    const plateau = plateauDuCote(cote);
    morceaux.push(
      `<rect x="${plateau.x}" y="${plateau.y}" width="${plateau.w}" height="${plateau.h}" rx="34" fill="${COULEURS_PLATEAUX.plateauFond}" stroke="${COULEURS_PLATEAUX.plateauBord}" stroke-width="3"/>`,
    );
  }
  morceaux.push(
    `<text x="800" y="400" fill="${COULEURS_PLATEAUX.egal}" font-family="system-ui, sans-serif" font-size="70" font-weight="950" text-anchor="middle" dominant-baseline="middle">=</text>`,
  );

  if (paquets && etat.paquets) {
    const juste = etat.paquets.correct;
    for (const boite of paquets.boites) {
      morceaux.push(
        `<rect x="${boite.x}" y="${boite.y}" width="${boite.w}" height="${boite.h}" rx="16" ` +
          (juste
            ? `fill="${COULEURS_PLATEAUX.paquetJusteFond}" stroke="${COULEURS_PLATEAUX.paquetJusteBord}" stroke-width="3.2"/>`
            : `fill="${COULEURS_PLATEAUX.paquetFond}" stroke="${COULEURS_PLATEAUX.paquetBord}" stroke-width="2.4" stroke-dasharray="8 7"/>`),
      );
    }
  }

  for (const cote of ["gauche", "droite"]) {
    const plateau = plateauDuCote(cote);
    const pieces = etat[cote];
    const posTaches = positionsTaches(pieces, plateau);
    let repli = 0;
    pieces.forEach((piece, indice) => {
      if (apresSuppression === "masquer" && piece.etat === "supprime") return;
      let pos;
      if (piece.type === "tache") {
        pos = posTaches.get(indice);
      } else if (paquets && paquets.cote === cote && paquets.positions.has(indice)) {
        pos = paquets.positions.get(indice);
      } else if (Number.isFinite(piece.x) && Number.isFinite(piece.y)) {
        pos = { cx: piece.x, cy: piece.y, r: rayonJeton(piece) };
      } else {
        pos = positionDeRepli(plateau, repli++, rayonJeton(piece));
      }
      if (!pos) return;
      const marques = {
        suppression: suppression.has(`${cote}:${indice}`),
        regroupement: regroupement.has(`${cote}:${indice}`),
      };
      const attributs = interactif
        ? ` data-cote="${cote}" data-indice="${indice}" data-type="${piece.type}"${piece.etat === "supprime" ? ` data-supprime="1"` : ""}`
        : "";
      const opacite = piece.etat === "supprime" ? ` opacity=".28"` : "";
      morceaux.push(`<g${attributs}${opacite}>`);
      if (piece.type === "tache") {
        morceaux.push(dessinerUneTache(etat, piece, pos, marques));
      } else {
        if (interactif && piece.etat !== "supprime") {
          morceaux.push(
            `<circle cx="${pos.cx}" cy="${pos.cy}" r="${pos.r + (piece.unitaire ? 14 : 32)}" fill="transparent"/>`,
          );
        }
        morceaux.push(dessinerUnJeton(etat, piece, pos, marques));
      }
      morceaux.push(`</g>`);
    });
  }

  morceaux.push(`</svg>`);
  return morceaux.join("");
}
