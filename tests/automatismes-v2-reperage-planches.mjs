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
      titre: "Cours · vocabulaire du repère",
      sousTitre: "Axes, graduations et flèches portent les couleurs communes",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        afficherLegendesAxes: true,
        axesMisesEnEvidence: ["abscisses", "ordonnees"],
      }),
    },
    {
      titre: "GE-03 · 1 — Lire l'abscisse",
      sousTitre: "Projection verticale orange sur un repère neutre",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 3, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [{ x: -3, y: 2, axe: "abscisses" }],
      }),
    },
    {
      titre: "GE-03 · 2 — Lire l'ordonnée",
      sousTitre: "Projection horizontale turquoise sur un repère neutre",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 3, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [{ x: -3, y: 2, axe: "ordonnees" }],
      }),
    },
    {
      titre: "GE-03 · 3 — Écrire les coordonnées",
      sousTitre: "Les deux projections sont réunies seulement à la fin",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 3, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [
          { x: -3, y: 2, axe: "abscisses" },
          { x: -3, y: 2, axe: "ordonnees" },
        ],
      }),
    },
    {
      titre: "GE-04 · 1 — Partir de O",
      sousTitre: "L'origine est repérée sans dévoiler la position finale",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        mettreOrigineEnEvidence: true,
      }),
    },
    {
      titre: "GE-04 · 2 — Déplacement horizontal",
      sousTitre: "Depuis O jusqu'à l'abscisse, en orange",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        cheminPlacement: { x: 2, y: -1, etape: "horizontal" },
      }),
    },
    {
      titre: "GE-04 · 3 — Déplacement vertical",
      sousTitre: "Depuis l'abscisse jusqu'à l'ordonnée, en turquoise",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        cheminPlacement: { x: 2, y: -1, etape: "complet" },
      }),
    },
    {
      titre: "GE-04 · 4 — Placer le point",
      sousTitre: "Le point n'apparaît qu'à l'intersection finale",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [{ nom: "B", x: 2, y: -1 }],
        cheminPlacement: { x: 2, y: -1, etape: "complet" },
      }),
    },
    {
      titre: "Bords et coins",
      sousTitre: "Huit positions extrêmes, lettres entièrement visibles",
      dessin: dessinerRepereCartesien({
        xMin: -4, xMax: 4, yMin: -3, yMax: 3, largeur: largeurCarte,
        points: [
          { nom: "A", x: -4, y: 3 },
          { nom: "B", x: 4, y: 3 },
          { nom: "C", x: -4, y: -3 },
          { nom: "D", x: 4, y: -3 },
          { nom: "E", x: -4, y: 0 },
          { nom: "F", x: 4, y: 0 },
          { nom: "G", x: 0, y: 3 },
          { nom: "H", x: 0, y: -3 },
        ],
      }),
    },
    {
      titre: "Pas 0,25 réellement utilisé",
      sousTitre: "T(−1,25 ; −0,25), valeurs décimales lisibles",
      dessin: dessinerRepereCartesien({
        xMin: -1.25, xMax: 1.5, yMin: -1.25, yMax: 1, pas: 0.25,
        largeur: largeurCarte,
        points: [{ nom: "T", x: -1.25, y: -0.25 }],
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
      titre: "Coordonnées nulles",
      sousTitre: "C(3 ; 0), D(0 ; −2) et origine O préservée",
      dessin: dessinerRepereCartesien({
        xMin: -3, xMax: 4, yMin: -5, yMax: 3, largeur: largeurCarte,
        points: [
          { nom: "C", x: 3, y: 0 },
          { nom: "D", x: 0, y: -2 },
        ],
      }),
    },
  ];
  const marge = 30;
  const ecart = 24;
  const colonnes = 2;
  const hauteurs = dessins.map(({ dessin }) => dessin.hauteur + 92);
  const hauteursLignes = Array.from({ length: Math.ceil(dessins.length / colonnes) }, (_, ligne) =>
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
      titre: "Vocabulaire",
      sousTitre: "Axes colorés sans flèche ajoutée",
      options: {
        xMin: -4, xMax: 4, yMin: -3, yMax: 3,
        afficherLegendesAxes: true,
        axesMisesEnEvidence: ["abscisses", "ordonnees"],
      },
    },
    {
      titre: "Lire l'abscisse",
      sousTitre: "Projection verticale orange",
      options: {
        xMin: -4, xMax: 4, yMin: -3, yMax: 3,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [{ x: -3, y: 2, axe: "abscisses" }],
      },
    },
    {
      titre: "Lire l'ordonnée",
      sousTitre: "Projection horizontale turquoise",
      options: {
        xMin: -4, xMax: 4, yMin: -3, yMax: 3,
        points: [{ nom: "A", x: -3, y: 2 }],
        guides: [{ x: -3, y: 2, axe: "ordonnees" }],
      },
    },
    {
      titre: "Placer B(2 ; −1)",
      sousTitre: "Horizontal puis vertical",
      options: {
        xMin: -4, xMax: 4, yMin: -3, yMax: 3,
        points: [{ nom: "B", x: 2, y: -1 }],
        cheminPlacement: { x: 2, y: -1, etape: "complet" },
      },
    },
    {
      titre: "Pas 0,25",
      sousTitre: "T au bord gauche, lettre visible",
      options: {
        xMin: -1.25, xMax: 1.5, yMin: -1.25, yMax: 1, pas: 0.25,
        points: [{ nom: "T", x: -1.25, y: -0.25 }],
      },
    },
    {
      titre: "Coordonnées nulles",
      sousTitre: "C(3 ; 0) et D(0 ; −2)",
      options: {
        xMin: -3, xMax: 4, yMin: -5, yMax: 3,
        points: [
          { nom: "C", x: 3, y: 0 },
          { nom: "D", x: 0, y: -2 },
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
