/* maths&go — les deux miniatures du catalogue pour « le pavé droit dans l'espace ».
   Elles sont dessinées par le moteur lui-même : la carte du catalogue montre
   exactement ce que l'outil produit.

   Format 720 × 320, la norme des miniatures du site : la carte du catalogue
   affiche l'image en `object-fit: contain` dans une boîte du même rapport, donc
   toute autre proportion laisse des bandes claires sur les côtés.

   Lancer :  node scripts/generer-miniatures-espace.mjs
*/
import { writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const M = require("../assets/js/pave-espace-moteur.js");

const racine = new URL("../", import.meta.url);
const dossier = new URL("assets/img/thumbnails/espace/", racine);

const L = 720, H = 320;
const P = M.PALETTE;
const POLICE = M.POLICE_FICHE;

const doc = (titre, corps) =>
  `<svg role="img" aria-label="${titre}" xmlns="http://www.w3.org/2000/svg" ` +
  `viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" font-family="${POLICE}">` +
  `<rect x="0" y="0" width="${L}" height="${H}" fill="${P.fond}"/>${corps}</svg>`;

/* ------------------------------------------------- 1. l'appli de classe
   Le pavé, le triangle ACG surligné, et le même triangle rabattu à côté en
   vraie forme avec son angle droit et ses longueurs : c'est tout le propos de
   l'outil en une image. */
const appli = M.dessiner({
  solide: M.creerPave(5, 3, 6),
  // À mi-chemin du curseur « Le dessin ⟷ En vrai » : on reconnaît la perspective
  // cavalière, et le solide est déjà assez tourné pour qu'on voie le triangle ACG.
  projection: M.melanger(M.matriceCavaliere(0.5, 45), M.matriceReelle(-28, 20), 0.55),
  largeur: L, hauteur: H, marge: 42,
  cadrage: "juste",
  triangle: ["A", "C", "G"],
  rabattement: 1,
  corpsSommet: 21, corpsCote: 16
});

await mkdir(dossier, { recursive: true });
await writeFile(new URL("pave-droit-espace.svg", dossier), doc(
  "Un pavé droit vu dans l espace, le triangle ACG surligné et rabattu à côté " +
  "en vraie forme avec son angle droit", appli.corps) + "\n", "utf8");

/* ------------------------------------------------- 2. le générateur
   À gauche la figure telle qu'elle sort de l'outil ; à droite les trois
   dimensions qu'on a tapées et les deux formats d'export. */
const figure = M.dessiner({
  solide: M.creerPave(5, 3, 6),
  projection: M.matriceCavaliere(0.5, 45),
  largeur: 462, hauteur: H, marge: 40,
  cadrage: "juste",
  cotes: { L: "5 cm", P: "3 cm", H: "6 cm" },
  diagonaleGrande: true,
  nomDiagonaleGrande: true,
  corpsSommet: 19, corpsCote: 15
});

const champ = (y, nom, valeur) => `
  <rect x="490" y="${y}" width="190" height="42" rx="9" fill="#F6F8FA" stroke="#d7e0e9"/>
  <text x="503" y="${y + 26}" font-size="14" fill="#5a6b7d">${nom}</text>
  <text x="666" y="${y + 27}" font-size="17" font-weight="bold" fill="${P.trait}" text-anchor="end">${valeur}</text>`;

const puce = (x, mot) => `
  <rect x="${x}" y="246" width="88" height="32" rx="16" fill="${P.surligne}"/>
  <text x="${x + 44}" y="267" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">${mot}</text>`;

const panneau =
  `<line x1="470" y1="34" x2="470" y2="286" stroke="#e3e9f0" stroke-width="1.6"/>` +
  `<text x="490" y="60" font-size="16" font-weight="bold" fill="${P.trait}">Les trois dimensions</text>` +
  champ(76, "Largeur", "5 cm") +
  champ(126, "Profondeur", "3 cm") +
  champ(176, "Hauteur", "6 cm") +
  puce(490, "SVG") + puce(592, "PNG");

await writeFile(new URL("generateur-pave-droit.svg", dossier), doc(
  "Un pavé droit ABCDEFGH en perspective cavalière avec ses cotes 5 cm, 3 cm et " +
  "6 cm, et les trois dimensions saisies dans le générateur",
  `<g>${figure.corps}</g>${panneau}`) + "\n", "utf8");

console.log(`miniatures écrites en ${L} × ${H} dans assets/img/thumbnails/espace/`);
