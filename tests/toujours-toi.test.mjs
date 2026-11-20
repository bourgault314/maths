// Lot « toujours toi » (11/11/2026, planches validées par Gwenaël) : la question
// « C'est toujours toi ? » (après dix minutes sans geste) devient une petite copie
// de l'écran d'entrée de Mon espace — le titre, UNE ligne (« Retape ton code pour
// continuer. », que « Ce n'est pas le bon code. » remplace au même endroit), le
// cadre blanc des six cases avec « Entrer », et « Non, ce n'est pas moi » en lien
// dessous. Le dessin vit dans le module commun (code-en-cases.js, .cec-garde) :
// le même dans Mon espace, Défi tables, Défi calcul, SPLAT!, Coffres et Anzan.
// La règle de garde elle-même (dix minutes, trois essais, « Non » → sortie) ne
// change pas : ses tests restent ceux des lots précédents.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const racine = new URL("../", import.meta.url);
const lire = chemin => readFileSync(new URL(chemin, racine), "utf8");
const CEC = createRequire(import.meta.url)("../assets/js/code-en-cases.js");

const PAGES_HTML = [
  {nom: "Mon espace", chemin: "_serveur/public/index.php", debut: '<div id="garde" class="garde"', erreur: "garde-erreur", non: "garde-non", oui: "garde-oui", champ: "garde-code"},
  {nom: "Défi tables", chemin: "outils/calcul_mental/defi_tables.html", debut: '<div id="suivi-garde" class="suivi-garde"', erreur: "suivi-garde-erreur", non: "suivi-garde-non", oui: "suivi-garde-oui", champ: "suivi-garde-code"},
  {nom: "Défi calcul", chemin: "outils/calcul_mental/defi_calcul_modules.html", debut: '<div id="suivi-garde" class="suivi-garde"', erreur: "suivi-garde-erreur", non: "suivi-garde-non", oui: "suivi-garde-oui", champ: "suivi-garde-code"}
];

function carte(source, debut) {
  const i = source.indexOf(debut);
  assert.ok(i > 0, "la carte de la question est dans la page");
  const j = source.indexOf("Non, ce n’est pas moi</button>", i);
  assert.ok(j > i, "et se termine par « Non »");
  return source.slice(i, j + 40);
}

for (const p of PAGES_HTML) {
  test(`${p.nom} : la question est la copie de l'écran d'entrée (une ligne, le cadre, « Entrer », « Non » en lien)`, () => {
    const c = carte(lire(p.chemin), p.debut);
    assert.doesNotMatch(c, /Personne n’a touché/, "plus de longue explication");
    assert.doesNotMatch(c, /C’est moi/, "le bouton s'appelle « Entrer », comme à l'entrée");
    assert.match(c, /class="[^"]*\bcec-garde\b/, "la carte prend le dessin commun");
    // L'erreur AVANT la consigne, dans la même ligne : c'est ce qui la fait
    // prendre la place de la consigne (sélecteur « + »).
    const ligne = c.match(/<div class="cec-garde-ligne">([\s\S]*?)<\/div>/);
    assert.ok(ligne, "la ligne consigne/erreur");
    assert.match(ligne[1], new RegExp(`^\\s*<p id="${p.erreur}" class="cec-garde-erreur" role="alert" hidden><\\/p>\\s*<p class="cec-garde-consigne">Retape ton code pour continuer\\.<\\/p>\\s*$`));
    const form = c.match(/<form [^>]*class="cec-garde-cadre"[^>]*>([\s\S]*?)<\/form>/);
    assert.ok(form, "le cadre est le formulaire");
    assert.match(form[1], new RegExp(`id="${p.champ}"`), "les six cases sont dans le cadre");
    assert.match(form[1], new RegExp(`id="${p.oui}"[^>]*class="cec-garde-entrer"|class="cec-garde-entrer"[^>]*id="${p.oui}"`));
    assert.match(form[1], />Entrer<\/button>/);
    assert.doesNotMatch(form[1], new RegExp(`id="${p.non}"`), "« Non » est sous le cadre, pas dedans");
    assert.match(c, new RegExp(`<button [^>]*id="${p.non}"[^>]*class="cec-garde-non"|<button [^>]*class="cec-garde-non"[^>]*id="${p.non}"`));
    assert.match(c, /toujours toi&nbsp;\?/, "« ? » jamais seul en début de ligne");
  });
}

for (const [nom, chemin] of [["SPLAT!", "assets/js/splat-suivi.js"], ["Coffres magiques", "assets/js/coffres-suivi.js"], ["Flash Anzan", "outils/calcul_mental/flash_anzan_suivi.js"]]) {
  test(`${nom} : l'habillage construit la même carte, et ne la redessine plus lui-même`, () => {
    const s = lire(chemin);
    assert.doesNotMatch(s, /Personne n’a touché/);
    assert.doesNotMatch(s, /"C’est moi"/);
    assert.match(s, /el\("div", \{class: "suivi-garde-carte cec-garde"\}\)/);
    assert.match(s, /ligne\.append\(erreur, consigne\);/, "l'erreur avant la consigne");
    assert.match(s, /"Retape ton code pour continuer\."/);
    assert.match(s, /el\("form", \{id: "suivi-garde-form", class: "cec-garde-cadre"/);
    assert.match(s, /form\.append\(label, champ, oui\);/, "« Entrer » dans le cadre");
    assert.match(s, /carte\.append\(titre, ligne, form, non\);/, "« Non » dessous");
    assert.match(s, /"Entrer"\)/);
    assert.doesNotMatch(s, /\.suivi-garde-carte\{/, "plus de dessin de carte propre à l'habillage");
    assert.match(s, /prenom \+ "\\u00a0\?"/);
  });
}

test("le module commun porte le dessin de la carte : l'erreur prend la place de la consigne, rien ne bouge", () => {
  const st = CEC.STYLE;
  assert.match(st, /\.cec-garde \.cec-garde-ligne\{display:grid;/);
  assert.match(st, /\.cec-garde \.cec-garde-ligne>\*\{grid-area:1\/1;margin:0\}/);
  assert.match(st, /\.cec-garde \.cec-garde-erreur\[hidden\]\{display:block!important;visibility:hidden\}/, "l'erreur vide garde sa place");
  assert.match(st, /\.cec-garde \.cec-garde-erreur:not\(\[hidden\]\)\+\.cec-garde-consigne\{visibility:hidden\}/);
  assert.match(st, /\.cec-garde \.cec-garde-cadre\{[^}]*background:#fff;/, "le cadre blanc de l'entrée");
  assert.match(st, /\.cec-garde \.cec-garde-entrer\{[^}]*width:100%;/, "« Entrer » toute la largeur au téléphone");
  assert.match(st, /@media \(min-width:600px\)\{\.cec-garde \.cec-garde-entrer\{width:auto;min-width:240px;/, "centré sur un grand écran, comme l'entrée");
  assert.match(st, /\.cec-garde \.cec-garde-non\{[^}]*min-height:44px;[^}]*text-decoration:underline;/, "« Non » : un lien qu'on touche du doigt");
  assert.match(st, /\.cec-garde \.cec-garde-lecteur\{position:absolute;width:1px;height:1px;/, "l'étiquette pour le lecteur d'écran seulement");
});

test("les pages qui chargent le module et les habillages changent d'adresse (cache)", () => {
  for (const page of ["outils/splat_univers.html", "outils/splat.html", "outils/splat_tache_barre.html", "outils/equasplat.html",
    "outils/calcul_mental/coffres_magiques_solo.html", "outils/club_maths/carres_gloutons.html", "outils/calcul_mental/flash_anzan.html",
    "outils/calcul_mental/defi_tables.html", "outils/calcul_mental/defi_calcul_modules.html"]) {
    const s = lire(page);
    assert.match(s, /assets\/js\/code-en-cases\.js\?v=20261111-2"/, page);
    assert.doesNotMatch(s, /(splat-suivi|coffres-suivi|flash_anzan_suivi)\.js\?v=20261111-1"/, page);
  }
  assert.match(lire("outils/calcul_mental/defi_calcul_modules.html"), /defi_calcul\.css\?v=20261119-1"/);
});
