// Pont vers la bibliothèque officielle des objets (packages/objets).
//
// L'appli Automatismes est en scripts classiques ; ce fichier, chargé
// en <script type="module">, importe les objets officiels et les
// expose sur window.MATHSGO_OBJETS. Le moteur (02-question-engine.js)
// les utilise QUAND ILS SONT LÀ et retombe sur ses anciens dessins
// sinon — l'appli ne casse jamais, même si le module ne charge pas.
//
// Premier branchement : la barre de pourcentage unique (les anciens
// dessins divergents de dnb_04 et dnb_35 sont remplacés par l'objet
// officiel, palette et géométrie des gabarits de Gwenaël).
import { dessinerBarrePourcentage } from "../../packages/objets/src/barre-pourcentage.js";

window.MATHSGO_OBJETS = Object.freeze({
  ...(window.MATHSGO_OBJETS || {}),
  dessinerBarrePourcentage,
});
