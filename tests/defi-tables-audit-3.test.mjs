// Défi tables — audit 3 (01/10/2026) : sur ordinateur, le cadre blanc tient
// toujours entier dans l'écran. Les deux fonctions de calcul (bornes et
// recherche) sont EXÉCUTÉES telles qu'elles sont écrites dans la page ; la
// mesure elle-même (hauteurs réelles) a été jouée au navigateur à 9 tailles
// d'écran et 6 écrans, avec le repère d'un élève suivi — voir la notice.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

const bloc = html.slice(html.indexOf("      const ECHELLE = Object.freeze("), html.indexOf("      function ajusterEchelle() {"));
const {bornesEchelle, chercherEchelle} = new Function(`${bloc}; return {bornesEchelle, chercherEchelle};`)();
const ajuster = html.slice(html.indexOf("      function ajusterEchelle() {"), html.indexOf('      window.addEventListener("resize", ajusterEchelle);'));

test("téléphone et tablette : jamais d’échelle, en fenêtre comme en plein écran", () => {
  for (const largeur of [320, 390, 820, 1023]) {
    assert.deepEqual(bornesEchelle(largeur, false), {min: 1, max: 1, longue: 1});
    assert.deepEqual(bornesEchelle(largeur, true), {min: 1, max: 1, longue: 1});
  }
});

test("fenêtre normale sur ordinateur : jamais plus grand que nature, réduit jusqu’à ×0,8", () => {
  for (const largeur of [1024, 1366, 1440, 1920, 2560]) {
    assert.deepEqual(bornesEchelle(largeur, false), {min: 0.8, max: 1, longue: 1}, `${largeur} px`);
  }
});

test("plein écran : agrandi jusqu’à ×1,6, sans dépasser la largeur de l’écran", () => {
  assert.equal(bornesEchelle(1920, true).max, 1.6);
  assert.equal(bornesEchelle(2560, true).max, 1.6);
  assert.ok(Math.abs(bornesEchelle(1024, true).max - (1024 - 32) / 850) < 1e-9, "la colonne de 850 px ne sort pas d’un écran de 1 024 px");
  assert.equal(bornesEchelle(1440, true).longue, 1.125, "une page longue suit la largeur (1 440 / 1 280)");
  assert.equal(bornesEchelle(1920, true).longue, 1.5);
  assert.equal(bornesEchelle(1100, true).longue, 1, "jamais réduite");
});

test("la recherche : la plus grande échelle qui tient, jamais une échelle qui déborde", () => {
  const besoin = hauteur => z => hauteur * z <= 769; // un contenu de « hauteur » px dans une fenêtre de 769 px
  const fenetre = {min: 0.8, max: 1, longue: 1};
  assert.equal(chercherEchelle(fenetre, besoin(750)), 1, "ce qui tient n’est pas touché");
  const z = chercherEchelle(fenetre, besoin(830));
  assert.ok(z <= 769 / 830 && z > 769 / 830 - 0.01, `juste ce qu’il faut (${z})`);
  assert.equal(Math.round(z * 200), z * 200, "au 1/200");
  assert.equal(chercherEchelle(fenetre, besoin(1400)), 1, "une page longue garde sa taille en fenêtre");
  const plein = {min: 0.8, max: 1.6, longue: 1.125};
  assert.equal(chercherEchelle(plein, besoin(400)), 1.6, "plafonné");
  assert.equal(chercherEchelle(plein, besoin(1400)), 1.125, "une page longue suit la largeur en plein écran");
  const zp = chercherEchelle(plein, besoin(600));
  assert.ok(zp <= 769 / 600 && zp > 769 / 600 - 0.01);
  assert.equal(chercherEchelle({min: 1, max: 1, longue: 1}, () => false), 1, "téléphone : aucune mesure");
});

test("la mesure : sans le pied de page, le repère compris ; la carte du jeu ne défile pas", () => {
  assert.match(ajuster, /const pleinEcran = corps\.classList\.contains\("fullscreen-active"\);\s*const bornes = bornesEchelle\(window\.innerWidth, pleinEcran\);/);
  assert.match(ajuster, /if \(!fige && corps\.offsetHeight > limite\) return false;\s*return !\(enJeu && carte && carte\.scrollHeight > carte\.clientHeight \+ 1\);/);
  assert.match(ajuster, /corps\.classList\.add\("mesure-cadre"\);[\s\S]*corps\.classList\.remove\("mesure-cadre"\);/);
  assert.match(ajuster, /chercherEchelle\(enJeu \|\| accueil \? \{\.\.\.bornes, longue: bornes\.min\} : bornes, tient\)/, "une série ou l’accueil trop hauts gardent la plus petite échelle");
  assert.match(ajuster, /classList\.contains\("mode-fiche"\) \|\| corps\.classList\.contains\("voir-fiche"\)/, "la fiche a sa propre échelle");
  assert.match(html, /body\.mesure-cadre \{ min-height: 0 !important; \}\s*body\.mesure-cadre \.site-footer \{ display: none !important; \}/);
});

test("l’échelle est remesurée à chaque écran, à la première question, au plein écran et au redimensionnement", () => {
  assert.match(html, /suivreHistorique\(name\);\s*ajusterEchelle\(\);\s*\}/, "show()");
  assert.match(html, /show\("play"\);\s*renderQuestion\(\);[\s\S]{0,260}ajusterEchelle\(\);/, "la première question");
  assert.match(html, /label\.textContent = active \? "Quitter le plein écran" : "Plein écran";\s*ajusterEchelle\(\);/);
  assert.match(html, /window\.addEventListener\("resize", ajusterEchelle\);/);
  assert.match(html, /if \(!state\.etapeOuverte && !\$\("intro"\)\.hidden\) ajusterEchelle\(\);/, "l’accueil, sauf quand un choix est déplié");
});

test("le CSS : une seule échelle, jamais à l’impression ; la hauteur du jeu suit l’échelle", () => {
  assert.match(html, /@media screen \{\s*\.shell \{ zoom: var\(--echelle, 1\); \}\s*\}/);
  assert.doesNotMatch(html, /--echelle-jeu/, "plus d’échelle à part pour le jeu");
  assert.match(html, /\.challenge-playing \.shell \{ height: calc\(\(100dvh - var\(--bas-cadre, 0px\)\) \/ var\(--echelle, 1\)\); display: grid;/);
  assert.match(html, /body\.fullscreen-active \.shell \{ min-height: calc\(\(100dvh - var\(--bas-cadre, 0px\)\) \/ var\(--echelle, 1\)\); padding-bottom: 0; \}/);
  const telephone = html.slice(html.indexOf("@media (max-width: 620px) {\n      .shell { width: 100%; }"), html.indexOf("@media (min-width: 621px) and (max-height: 900px) {"));
  assert.match(telephone, /\.challenge-playing \.shell \{ height: 100dvh;/, "le téléphone n’est pas touché");
});

test("Mes calculs, Mon parcours et Lire la table : pages longues, jamais réduites en fenêtre", () => {
  // Retouche de Cowork (01/10/2026) : ×1 en fenêtre, comme sur main ; en plein
  // écran, agrandies d’après la largeur. Sans passer par la mesure.
  assert.match(ajuster, /if \(\["calculs", "parcours", "lire"\]\.some\(id => !document\.getElementById\(id\)\.hidden\)\) \{\s*racine\.style\.setProperty\("--echelle", bornes\.longue\.toFixed\(3\)\);\s*return;\s*\}/);
  assert.ok(ajuster.indexOf('["calculs", "parcours", "lire"]') < ajuster.indexOf('corps.classList.add("mesure-cadre")'), "avant toute mesure");
  assert.equal(bornesEchelle(1366, false).longue, 1, "fenêtre : ×1");
  assert.equal(bornesEchelle(1920, true).longue, 1.5, "plein écran : d’après la largeur");
});

// Relecture de Code (01/10/2026) : trois défauts vus au navigateur.
test("l’accueil sans choix déplié n’est pas une page longue : il garde la plus petite échelle", () => {
  // 1 366 × 650, élève suivi : quand « Mes calculs du jour » arrivait,
  // l’accueil ne tenait plus à ×0,8 et remontait à ×1 (195 px sous l’écran).
  assert.match(ajuster, /const accueil = !document\.getElementById\("intro"\)\.hidden && !document\.getElementById\("mode-screen"\)\.hidden && !state\.etapeOuverte;/);
});

test("la mesure rend la position de défilement (Mon parcours défilé jusqu’en bas)", () => {
  assert.match(ajuster, /const defilement = window\.scrollY;\s*(\/\/[^\n]*\s*)*corps\.classList\.add\("mesure-cadre"\);/);
  assert.match(ajuster, /if \(window\.scrollY !== defilement\) window\.scrollTo\(0, defilement\);/);
});

test("les sauts sous la bande restent sous leurs cases quand l’échelle n’est pas 1", () => {
  const tracer = html.slice(html.indexOf("      function tracerSauts("), html.indexOf("      function retracerSauts() {"));
  // getBoundingClientRect rend des pixels d’écran ; le dessin vit dans la colonne mise à l’échelle.
  assert.match(tracer, /const echelle = stick\.offsetWidth \? cadre\.width \/ stick\.offsetWidth : 1;/);
  assert.match(tracer, /return \(r\.left \+ r\.width \/ 2 - cadre\.left\) \/ echelle;/);
  assert.match(tracer, /svg\.setAttribute\("width", String\(largeur\)\);/);
  assert.match(tracer, /dessin\.style\.width = `\$\{largeur\}px`;/);
  assert.doesNotMatch(tracer, /Math\.round\(cadre\.width\)/);
  // La première question est dessinée avant la mesure : on retrace si l’échelle a changé.
  assert.match(ajuster, /if \(z\.toFixed\(3\) !== avant\) retracerSauts\(\);/);
});

test("« Quitter le plein écran » reste dans la barre du haut", () => {
  assert.match(html, /body\.fullscreen-active \.fullscreen-toggle \{ border-color: #7899ae; background: #fff; \}/);
  assert.doesNotMatch(html, /body\.fullscreen-active \.fullscreen-toggle \{[^}]*position: fixed/);
});
