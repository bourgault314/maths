import {
  creerCone,
  creerCube,
  creerCylindre,
  creerPave,
  creerPrisme,
  creerPyramide,
  dessinerSolide,
} from "../../../packages/objets/src/solides.js?v=7";
import { echapper } from "./outils-rendu.js?v=7";

export function blocSolide(question) {
  return question.enonce.find((bloc) => bloc.type === "solide");
}

export function creerModeleSolide({ forme, variante = "standard", mesures = {} }) {
  if (forme === "cube") return creerCube({ arete: mesures.arete ?? 4 });
  if (forme === "pave") {
    if (mesures.longueur) {
      return creerPave({
        longueur: mesures.longueur,
        largeur: mesures.largeur,
        hauteur: mesures.hauteur,
      });
    }
    return variante === "haut"
      ? creerPave({ longueur: 4.2, largeur: 3, hauteur: 5.2 })
      : creerPave({ longueur: 6, largeur: 3.3, hauteur: 2.8 });
  }
  if (forme === "prisme") {
    const hauteur = mesures.hauteur ?? 5;
    return variante === "triangle"
      ? creerPrisme({ base: "triangle-rectangle", cote1: 4, cote2: 3, hauteur })
      : creerPrisme({ cotes: 5, cote: 2.8, hauteur });
  }
  if (forme === "cylindre") {
    if (mesures.rayon) return creerCylindre({ rayon: mesures.rayon, hauteur: mesures.hauteur });
    return variante === "bas"
      ? creerCylindre({ rayon: 2.8, hauteur: 3.2 })
      : creerCylindre({ rayon: 2.1, hauteur: 4.7 });
  }
  if (forme === "pyramide") {
    return variante === "triangulaire"
      ? creerPyramide({ cotes: 3, cote: 4.4, hauteur: 4.8 })
      : creerPyramide({ cotes: 4, cote: 4.2, hauteur: 4.8 });
  }
  if (forme === "cone") {
    return variante === "large"
      ? creerCone({ rayon: 2.8, hauteur: 4 })
      : creerCone({ rayon: 2.2, hauteur: 4.8 });
  }
  throw new RangeError(`solide inconnu : ${forme}`);
}

export function rendreSolide(bloc, {
  taille = 320,
  manipulable = false,
  mettreBasesEnValeur = false,
  afficherMesures = false,
  afficherHauteur = false,
  rotation = { lacetDeg: 0, tangageDeg: 0 },
} = {}) {
  const vue = bloc.vue ?? { lacetDeg: -30, tangageDeg: 16 };
  const svg = dessinerSolide(creerModeleSolide(bloc), {
    projection: "orthographique",
    lacetDeg: vue.lacetDeg + rotation.lacetDeg,
    tangageDeg: vue.tangageDeg + rotation.tangageDeg,
    taille,
    marge: 24,
    theme: "couleur",
    base: mettreBasesEnValeur,
    mesures: afficherMesures,
    hauteur: afficherHauteur,
    unite: bloc.mesures?.unite ?? "cm",
    cachees: "pointilles",
  });
  return `<div class="visuel-solide ${manipulable ? "solide-manipulable" : ""}"
    ${manipulable ? 'data-manipulable="true" tabindex="0" aria-label="Solide tournable"' : ""}>
    ${svg}
  </div>`;
}

export function rendreDonneesVolume(bloc) {
  const m = bloc.mesures;
  const unite = echapper(m.unite);
  let donnees;
  if (bloc.forme === "cube") donnees = [["Côté", `${m.arete} ${unite}`]];
  else if (bloc.forme === "pave") {
    donnees = [
      ["Longueur", `${m.longueur} ${unite}`],
      ["Largeur", `${m.largeur} ${unite}`],
      ["Hauteur", `${m.hauteur} ${unite}`],
    ];
  } else if (bloc.forme === "prisme") {
    donnees = [
      ["Aire de la base", `${m.aireBase} ${unite}²`],
      ["Hauteur", `${m.hauteur} ${unite}`],
    ];
  } else {
    donnees = [
      ["Rayon", `${m.rayon} ${unite}`],
      ["Hauteur", `${m.hauteur} ${unite}`],
    ];
  }
  return `<dl class="donnees-volume">
    ${donnees.map(([nom, valeur]) => `<div><dt>${nom}</dt><dd>${valeur}</dd></div>`).join("")}
  </dl>`;
}

export function commandesRotation() {
  return `<div class="commandes-rotation" aria-label="Tourner le solide">
    <button type="button" data-action="tourner-gauche" aria-label="Tourner le solide vers la gauche">← Tourner</button>
    <button type="button" data-action="tourner-droite" aria-label="Tourner le solide vers la droite">Tourner →</button>
  </div>`;
}

export function rendreEmpilementCubes() {
  const projeter = (x, y, z) => [78 + (x - y) * 24, 56 + (x + y) * 13 - z * 27];
  const polygone = (points, classe) => `<polygon class="${classe}" points="${points.map((p) => p.join(",")).join(" ")}"/>`;
  let faces = "";
  const L = 3;
  const P = 2;
  const H = 2;
  for (let z = 0; z < H; z += 1) {
    for (let y = P - 1; y >= 0; y -= 1) {
      for (let x = 0; x < L; x += 1) {
        if (z === H - 1) faces += polygone([
          projeter(x, y, z + 1), projeter(x + 1, y, z + 1),
          projeter(x + 1, y + 1, z + 1), projeter(x, y + 1, z + 1),
        ], "face-haut");
        if (y === 0) faces += polygone([
          projeter(x, y, z), projeter(x + 1, y, z),
          projeter(x + 1, y, z + 1), projeter(x, y, z + 1),
        ], "face-avant");
        if (x === L - 1) faces += polygone([
          projeter(x + 1, y, z), projeter(x + 1, y + 1, z),
          projeter(x + 1, y + 1, z + 1), projeter(x + 1, y, z + 1),
        ], "face-droite");
      }
    }
  }
  return `<svg class="empilement-cubes" viewBox="0 0 180 145" role="img" aria-label="Empilement de 3 fois 2 fois 2 cubes unité">${faces}</svg>`;
}
