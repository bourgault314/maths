/* maths&go — la miniature du catalogue pour « le pavé droit dans l'espace ».
   Elle est dessinée par le moteur lui-même : la carte du catalogue montre
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

/* Le pavé, le triangle ACG surligné, et le même triangle rabattu à côté en
   vraie forme avec son angle droit et ses longueurs : c'est tout le propos de
   l'outil en une image. */
const appli = M.dessiner({
  solide: M.creerPave(5, 3, 6),
  // À mi-chemin entre le dessin et l'objet réel : on reconnaît la perspective
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

console.log(`miniature écrite en ${L} × ${H} dans assets/img/thumbnails/espace/`);
