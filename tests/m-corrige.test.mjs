// Lot « M corrigé » (21/11/2026) — le M de maths&go redessiné partout.
//
// Décision de Gwenaël (planche « variantes-haut », variante C) : le V turquoise
// part du SOMMET des barres blanches et a leur largeur (12), la barre orange
// s'arrête sous les barres (18 → 82). Rien ne dépasse, et le turquoise sort de
// la barre à l'arrondi, sans coupure.
//
// Ce test garde trois choses :
//  1. la source dit bien ce dessin ;
//  2. toutes les copies d'une même image sont les mêmes octets (dépôt, serveur,
//     chemins canoniques de assets/img/logos/mathsgo/) ;
//  3. il ne reste l'ancien M nulle part où on l'avait collé (pieds des fiches de
//     cours, à l'écran ET à l'impression, pages de « Chat, c'est toi le chat »).
//     Les pages de cours sont fabriquées par Livret de cours\_moteur (livret.js
//     et livret.css), corrigés le même jour : une prochaine fabrication garde le
//     bon M.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const racine = new URL("../", import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, racine));
const empreinte = (chemin) => createHash("sha256").update(lire(chemin)).digest("hex");

const ANCIEN = [
  'd="M15 82H85"',
  'd="M18 24L50 66L82 24"',
  'stroke="#00AFAA" stroke-width="14"',
  "M15%2082H85",
  "M18%2024L50%2066L82%2024",
  "%2300AFAA%22%20stroke-width%3D%2214",
];

test("M corrigé : la source a le V depuis le sommet des barres, aussi large qu'elles, et la barre orange sous les barres", () => {
  const svg = lire("favicon.svg").toString("utf8");
  assert.match(svg, /<path d="M18 82H82" stroke="#FA7D05" stroke-width="10"\/>/);
  assert.match(svg, /<path d="M18 18L50 66L82 18" stroke="#00AFAA" stroke-width="12"\/>/);
  assert.match(svg, /<path d="M18 18V82 M82 18V82" stroke="#FFFFFF" stroke-width="12"\/>/);
  for (const vieux of ANCIEN) assert.ok(!svg.includes(vieux), `favicon.svg : plus de ${vieux}`);
});

test("M corrigé : chaque copie est la même image, octet pour octet", () => {
  const familles = [
    ["favicon.svg", "_serveur/public/favicon.svg", "assets/img/logos/mathsgo/m.svg"],
    ["favicon.ico", "_serveur/public/favicon.ico"],
    ["apple-touch-icon.png", "assets/img/apple-touch-icon.png", "_serveur/public/apple-touch-icon.png", "assets/img/logos/mathsgo/m-180.png"],
    ["assets/img/favicon-192.png", "assets/img/logos/mathsgo/m-192.png"],
    ["assets/img/favicon-32.png", "assets/img/logos/mathsgo/m-32.png"],
  ];
  for (const [modele, ...copies] of familles) {
    for (const copie of copies) {
      assert.equal(empreinte(copie), empreinte(modele), `${copie} doit être ${modele} (cp ${modele} ${copie})`);
    }
  }
});

test("M corrigé : l'icône de l'iPhone est pleine (aucun coin transparent)", () => {
  const png = lire("apple-touch-icon.png");
  assert.equal(png.readUInt32BE(16), 180, "180 px de large");
  assert.equal(png.readUInt32BE(20), 180, "180 px de haut");
  assert.equal(png[25], 2, "PNG en couleurs SANS canal de transparence : le carré bleu va jusqu'aux bords");
});

test("M corrigé : l'ancien M n'est plus collé nulle part (fiches de cours à l'écran et à l'impression, Chat c'est toi le chat)", () => {
  const pages = [];
  for (const niveau of ["3e", "4e"]) {
    for (const nom of readdirSync(new URL(`cours/${niveau}/`, racine))) {
      if (nom.endsWith(".html")) pages.push(`cours/${niveau}/${nom}`);
    }
  }
  assert.ok(pages.length > 100, "les fiches de cours sont bien là");
  pages.push("outils/chat-cest-toi-le-chat-en-ligne.html", "outils/chat-cest-toi-le-chat-projection.html");
  const fautes = [];
  let pieds = 0;
  for (const page of pages) {
    const texte = lire(page).toString("utf8");
    for (const vieux of ANCIEN) if (texte.includes(vieux)) fautes.push(`${page} : ${vieux}`);
    if (texte.includes('d="M18 18L50 66L82 18" stroke="#00AFAA" stroke-width="12"')) pieds += 1;
  }
  assert.deepEqual(fautes, []);
  assert.ok(pieds > 100, "le pied des fiches porte le M corrigé");
  // les deux pages de Chat portent le favicon en data:base64 : c'est le nouveau
  const b64 = lire("favicon.svg").toString("base64");
  for (const page of ["outils/chat-cest-toi-le-chat-en-ligne.html", "outils/chat-cest-toi-le-chat-projection.html"]) {
    assert.ok(lire(page).toString("utf8").includes(b64), `${page} : le favicon en base64 est le nouveau`);
  }
});
