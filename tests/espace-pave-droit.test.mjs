/* « Le pavé droit dans l'espace » — ce que les deux outils ne doivent plus
   laisser passer : une miniature au mauvais format, et deux étiquettes collées.
   Le second contrôle balaie des pavés et des réglages volontairement ingrats
   (fuyante très courte, cote longue) ; c'est là que « 3 cm » venait toucher
   « B ». */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const M = require("../assets/js/pave-espace-moteur.js");
const lire = (chemin) => fs.readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

const MINIATURES = [
  "assets/img/thumbnails/espace/pave-droit-espace.svg",
  "assets/img/thumbnails/espace/generateur-pave-droit.svg"
];

test("les miniatures du pavé droit sont au format 720 × 320 du catalogue", () => {
  // La carte du catalogue affiche l'image en `object-fit: contain` dans une
  // boîte de ce rapport : toute autre proportion laisse des bandes claires.
  for (const chemin of MINIATURES) {
    const svg = lire(chemin);
    assert.match(svg, /viewBox="0 0 720 320"/, `${chemin} : mauvais viewBox`);
    assert.match(svg, /width="720" height="320"/, `${chemin} : mauvaises dimensions`);
  }
  const catalogue = lire("assets/js/catalogue-refonte-data.js");
  assert.match(catalogue, /espace\/pave-droit-espace\.svg\?v=2/);
  assert.match(catalogue, /espace\/generateur-pave-droit\.svg\?v=2/);
});

// Même mesure que le moteur : largeur au prorata du corps, hauteur d'une ligne.
const boite = (texte, corps) => ({ l: texte.length * corps * 0.58 + 2, h: corps * 1.02 });

function etiquettes(svg) {
  const liste = [];
  const motif = /<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"[^>]*?>([^<]*)<\/text>/g;
  let m;
  while ((m = motif.exec(svg))) {
    const corps = Number(m[3]);
    const b = boite(m[4], corps);
    // texteSVG écrit la ligne de base : on remonte au centre du texte.
    liste.push({ x: Number(m[1]), y: Number(m[2]) - corps * 0.35, l: b.l, h: b.h, texte: m[4] });
  }
  return liste;
}

const blanc = (a, b) => Math.max(
  Math.abs(a.x - b.x) - (a.l + b.l) / 2,
  Math.abs(a.y - b.y) - (a.h + b.h) / 2
);

test("aucune cote ne vient se coller à une lettre de sommet", () => {
  const pavés = [
    [5, 3, 6], [6, 2, 4], [8, 1.5, 3], [12, 3, 7],
    [3, 9, 2], [4, 4, 4], [10, 2, 2], [2, 2, 10]
  ];
  const fautes = [];
  for (const [l, p, h] of pavés) {
    for (const coef of [0.4, 0.5, 0.6, 0.7]) {
      for (const angle of [30, 45, 60]) {
        const rendu = M.dessiner({
          solide: M.creerPave(l, p, h),
          projection: M.matriceCavaliere(coef, angle),
          largeur: 640, hauteur: 440, marge: 52, cadrage: "juste",
          cotes: { L: `${l} cm`, P: `${p} cm`, H: `${h} cm` },
          diagonaleGrande: true, nomDiagonaleGrande: true,
          corpsSommet: 17, corpsCote: 15, fondOpaque: true
        });
        const liste = etiquettes(rendu.svg);
        for (let i = 0; i < liste.length; i++) {
          // Rien ne dépasse du cadre : une étiquette coupée est illisible.
          const e = liste[i];
          assert.ok(
            e.x - e.l / 2 >= -1 && e.y - e.h / 2 >= -1 && e.x + e.l / 2 <= 641 && e.y + e.h / 2 <= 441,
            `« ${e.texte} » sort du cadre sur ${l}×${p}×${h} (coef ${coef}, angle ${angle})`
          );
          for (let j = i + 1; j < liste.length; j++) {
            if (blanc(liste[i], liste[j]) < 4) {
              fautes.push(`${l}×${p}×${h} coef ${coef} angle ${angle} : « ${liste[i].texte} » et « ${liste[j].texte} »`);
            }
          }
        }
      }
    }
  }
  assert.deepEqual(fautes, [], `étiquettes à moins de 4 px l'une de l'autre :\n${fautes.join("\n")}`);
});

test("en classe, l'échelle du solide ne change pas quand on affiche les dimensions", () => {
  // Le cadrage « stable » existe pour que le pavé ne respire pas au
  // vidéoprojecteur : la place réservée aux cotes ne doit pas s'y appliquer.
  const commun = {
    solide: M.creerPave(5, 3, 6),
    projection: M.matriceCavaliere(0.5, 45),
    largeur: 760, hauteur: 470, marge: 76, cadrage: "stable",
    etiquettesFluides: true, corpsSommet: 36, corpsCote: 30
  };
  const sans = M.dessiner(commun).points;
  const avec = M.dessiner({ ...commun, cotes: { L: "5 cm", P: "3 cm", H: "6 cm" } }).points;
  for (const nom of M.NOMS) {
    assert.ok(Math.hypot(sans[nom][0] - avec[nom][0], sans[nom][1] - avec[nom][1]) < 0.01,
      `le sommet ${nom} bouge quand on affiche les cotes`);
  }
});

test("les deux outils chargent le moteur avec un cache-buster", () => {
  // Sans `?v=`, un visiteur qui a déjà ouvert l'outil garde l'ancien moteur en
  // cache : il ne verra jamais une correction du placement des étiquettes.
  for (const page of ["outils/espace/pave_droit.html", "outils/espace/generateur_pave_droit.html"]) {
    assert.match(
      lire(page),
      /assets\/js\/pave-espace-moteur\.js\?v=20260916-1/,
      `${page} : le moteur doit être appelé avec le ?v= du lot`
    );
  }
});
