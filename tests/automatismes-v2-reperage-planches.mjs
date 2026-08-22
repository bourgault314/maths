import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  dessinerRepereCartesien,
} from "../packages/objets/src/repere-cartesien.js";

const SORTIE = resolve(
  process.env.MATHSGO_CAPTURES ?? "/tmp/automatismes-v2-ge-reperage",
);

function echapper(texte) {
  return String(texte).replace(/[&<>"]/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[caractere]);
}

function corpsSvg(svg) {
  return svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
}

function carte({ x, y, largeur, titre, sousTitre, dessin }) {
  const hauteurEntete = 72;
  const hauteur = dessin.hauteur + hauteurEntete + 20;
  return `<g transform="translate(${x} ${y})">
    <rect width="${largeur}" height="${hauteur}" rx="18" fill="#ffffff" stroke="#d6e1e5" stroke-width="2"/>
    <text x="24" y="30" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#16324f">${echapper(titre)}</text>
    <text x="24" y="54" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#5e7180">${echapper(sousTitre)}</text>
    <g transform="translate(0 ${hauteurEntete})">${corpsSvg(dessin.svg)}</g>
  </g>`;
}

function plancheDesktop() {
  const largeurCarte = 680;
  const dessins = [
    {
      titre: "GE-03 · lecture complète",
      sousTitre: "M(−3 ; 2), repère asymétrique et pas entier",
      dessin: dessinerRepereCartesien({
        xMin: -5, xMax: 3, yMin: -3, yMax: 4, largeur: largeurCarte,
        points: [{ nom: "M", x: -3, y: 2 }],
      }),
    },
    {
      titre: "GE-03 · identifier un point",
      sousTitre: "Quatre cibles espacées, dont deux proches des axes",
      dessin: dessinerRepereCartesien({
        xMin: -3, xMax: 5, yMin: -4, yMax: 3, largeur: largeurCarte,
        points: [
          { nom: "A", x: -2, y: 2 },
          { nom: "F", x: 3, y: 0 },
          { nom: "R", x: 0, y: -3 },
          { nom: "V", x: 4, y: -2 },
        ],
      }),
    },
    {
      titre: "Aide · lire horizontal puis vertical",
      sousTitre: "Les guides rejoignent les axes sans écrire la réponse",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [
          { x: -3, y: 2, axe: "abscisses" },
          { x: -3, y: 2, axe: "ordonnees" },
        ],
      }),
    },
    {
      titre: "Cours · placer B(2 ; −1)",
      sousTitre: "Déplacement orange horizontal, puis turquoise vertical",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [{ nom: "B", x: 2, y: -1 }],
        cheminPlacement: { x: 2, y: -1, etape: "complet" },
      }),
    },
    {
      titre: "Correction GE-04",
      sousTitre: "Point choisi en rouge, point attendu en vert",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 3, yMin: -3, yMax: 5, largeur: largeurCarte,
        points: [
          { nom: "T", x: 2, y: -3, role: "choisi", afficherNom: false },
          { nom: "M", x: -3, y: 2, role: "attendu" },
        ],
        cheminPlacement: { x: -3, y: 2, etape: "complet" },
      }),
    },
    {
      titre: "Cas des axes",
      sousTitre: "C(3 ; 0), D(0 ; −2) et origine O préservée",
      dessin: dessinerRepereCartesien({
        xMin: -3, xMax: 4, yMin: -5, yMax: 3, largeur: largeurCarte,
        points: [
          { nom: "C", x: 3, y: 0 },
          { nom: "D", x: 0, y: -2, role: "exemple" },
        ],
      }),
    },
  ];
  const marge = 30;
  const ecart = 24;
  const colonnes = 2;
  const hauteurs = dessins.map(({ dessin }) => dessin.hauteur + 92);
  const hauteursLignes = Array.from({ length: dessins.length / colonnes }, (_, ligne) =>
    Math.max(...hauteurs.slice(ligne * colonnes, ligne * colonnes + colonnes)));
  const decalagesY = hauteursLignes.reduce((acc, hauteur, index) => {
    acc.push((acc[index] ?? marge) + hauteur + ecart);
    return acc;
  }, [marge]);
  const largeur = marge * 2 + colonnes * largeurCarte + ecart;
  const hauteur = decalagesY.at(-1) + marge - ecart;
  const cartes = dessins.map((configuration, index) => carte({
    x: marge + (index % colonnes) * (largeurCarte + ecart),
    y: decalagesY[Math.floor(index / colonnes)],
    largeur: largeurCarte,
    ...configuration,
  })).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}">
    <rect width="100%" height="100%" fill="#eef4f5"/>
    ${cartes}
  </svg>`;
}

function plancheMobile() {
  const largeurCarte = 320;
  const configurations = [
    {
      titre: "Question GE-03",
      sousTitre: "Lecture de M(−3 ; 2)",
      options: {
        xMin: -5, xMax: 3, yMin: -3, yMax: 4,
        points: [{ nom: "M", x: -3, y: 2 }],
      },
    },
    {
      titre: "Aide visuelle",
      sousTitre: "Guides vers les deux axes",
      options: {
        xMin: -4, xMax: 4, yMin: -3, yMax: 3,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [
          { x: -3, y: 2, axe: "abscisses" },
          { x: -3, y: 2, axe: "ordonnees" },
        ],
      },
    },
    {
      titre: "Placement GE-04",
      sousTitre: "Trajet vers B(2 ; −1)",
      options: {
        xMin: -4, xMax: 4, yMin: -3, yMax: 3,
        points: [{ nom: "B", x: 2, y: -1 }],
        cheminPlacement: { x: 2, y: -1, etape: "complet" },
      },
    },
    {
      titre: "Points sur les axes",
      sousTitre: "C(3 ; 0) et D(0 ; −2)",
      options: {
        xMin: -3, xMax: 4, yMin: -5, yMax: 3,
        points: [
          { nom: "C", x: 3, y: 0 },
          { nom: "D", x: 0, y: -2, role: "exemple" },
        ],
      },
    },
  ].map((configuration) => ({
    ...configuration,
    dessin: dessinerRepereCartesien({ ...configuration.options, largeur: largeurCarte }),
  }));
  const marge = 18;
  const ecart = 18;
  let y = marge;
  const cartes = configurations.map((configuration) => {
    const resultat = carte({ x: marge, y, largeur: largeurCarte, ...configuration });
    y += configuration.dessin.hauteur + 92 + ecart;
    return resultat;
  }).join("");
  const largeur = largeurCarte + marge * 2;
  const hauteur = y + marge - ecart;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}">
    <rect width="100%" height="100%" fill="#eef4f5"/>
    ${cartes}
  </svg>`;
}

await mkdir(SORTIE, { recursive: true });
const fichiers = [
  ["planche-repere-desktop.svg", plancheDesktop()],
  ["planche-repere-mobile-320.svg", plancheMobile()],
];
await Promise.all(fichiers.map(([nom, contenu]) =>
  writeFile(resolve(SORTIE, nom), `${contenu}\n`, "utf8")));
console.log(JSON.stringify({ sortie: SORTIE, fichiers: fichiers.map(([nom]) => nom) }));
