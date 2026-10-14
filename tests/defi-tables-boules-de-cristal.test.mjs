// Lot « boules de cristal » (décision de Gwenaël du 14/10/2026, planche 5) :
// dans Mon parcours, les cinq marches de l'escalier sont des boules de même
// taille ; leurs étoiles aussi ont toutes la même taille, rangées
// comme sur les Dragon Balls (1 au centre · 2 en diagonale · 3 en triangle ·
// 4 en carré · 5 en quinconce). Gagnée : orange, étoiles rouges ; à tenter :
// blanche cerclée d'orange ; plus tard : grise en pointillés. Le badge « ★★ »
// au-dessus est retiré ; « 👑 Légende des tables » reste. L'accueil garde son
// escalier doré (choix du 14/10 au soir) et la fiche (papier) ses étoiles.

import test from "node:test";
import assert from "node:assert/strict";
import {PARCOURS, html, entre} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
const BLOC = entre("      // Lot « boules de cristal » (décision de Gwenaël du 14/10/2026, planche", "      function makeCell(");

// Un document minimal : de quoi exécuter bouleMarche pour de vrai.
function noeud(nom) {
  const n = {nom, attributs: {}, enfants: [],
    setAttribute(cle, valeur) { n.attributs[cle] = String(valeur); },
    append(...enfants) { n.enfants.push(...enfants); }};
  return n;
}
const documentFaux = {createElementNS: (ns, nom) => (assert.equal(ns, "http://www.w3.org/2000/svg"), noeud(nom))};
const {bouleMarche, BOULE_ETOILES} = new Function("document", `${BLOC}\nreturn {bouleMarche, BOULE_ETOILES};`)(documentFaux);

const trouver = (n, nom) => n.enfants.filter(e => e.nom === nom);
// Les étoiles d'une boule : un chemin, une étoile par « M », dix pointes chacune.
function etoiles(svg) {
  const [chemin] = trouver(svg, "path");
  return chemin.attributs.d.split("M").filter(Boolean).map(morceau => {
    const points = morceau.replace("Z", "").split("L").map(p => p.split(",").map(Number));
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
    const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
    const rayon = Math.max(...points.map(([x, y]) => Math.hypot(x - cx, y - cy)));
    return {points, cx, cy, rayon};
  });
}

test("cinq boules, de 1 à 5 étoiles, rangées comme sur les Dragon Balls", () => {
  assert.deepEqual(Object.keys(BOULE_ETOILES).map(Number), [1, 2, 3, 4, 5]);
  for (let n = 1; n <= 5; n++) {
    const svg = bouleMarche({etoile: n}, "gagnee");
    assert.equal(svg.attributs.viewBox, "0 0 52 52");
    assert.equal(svg.attributs["aria-hidden"], "true", "l'étiquette est sur la case, pas sur le dessin");
    const liste = etoiles(svg);
    assert.equal(liste.length, n, `la boule ${n} a ${n} étoile(s)`);
    liste.forEach(e => assert.equal(e.points.length, 10, "une étoile à cinq branches : dix points"));
  }
  // 1 au centre ; 2 en diagonale ; 3 en triangle (une en haut, deux en bas) ;
  // 4 en carré ; 5 en quinconce (le carré et le centre).
  const centres = n => etoiles(bouleMarche({etoile: n}, "gagnee")).map(e => [Math.round(e.cx - 26), Math.round(e.cy - 26)]);
  const a = centres(1);
  assert.equal(a.length, 1);
  assert.ok(Math.abs(a[0][0]) <= 1 && Math.abs(a[0][1]) <= 1, "1 : au centre");
  const [d1, d2] = centres(2);
  assert.ok(d1[0] < 0 && d1[1] < 0 && d2[0] > 0 && d2[1] > 0, "2 : en diagonale");
  const t = centres(3);
  assert.ok(t[0][1] < 0 && t[1][1] > 0 && t[2][1] > 0 && t[1][0] < 0 && t[2][0] > 0, "3 : une en haut, deux en bas");
  const c = centres(4);
  assert.deepEqual(c.map(([x, y]) => [Math.sign(x), Math.sign(y)]), [[-1, -1], [1, -1], [-1, 1], [1, 1]], "4 : en carré");
  const q = centres(5);
  assert.ok(Math.abs(q[0][0]) <= 1 && Math.abs(q[0][1]) <= 1, "5 : une au centre…");
  assert.deepEqual(q.slice(1).map(([x, y]) => [Math.sign(x), Math.sign(y)]), [[-1, -1], [1, -1], [-1, 1], [1, 1]], "… et quatre aux coins");
});

test("toutes les étoiles ont la même taille, d'une boule à l'autre, et tiennent dans leur boule", () => {
  const rayons = [];
  for (let n = 1; n <= 5; n++) {
    etoiles(bouleMarche({etoile: n}, "suivante")).forEach(e => {
      rayons.push(e.rayon);
      const loin = Math.hypot(e.cx - 26, e.cy - 26) + e.rayon;
      assert.ok(loin < 22 - 1, `boule ${n} : l'étoile reste dans le disque (${loin.toFixed(1)} < 21)`);
    });
    // Deux étoiles d'une même boule ne se touchent pas.
    const liste = etoiles(bouleMarche({etoile: n}, "suivante"));
    liste.forEach((e, i) => liste.slice(i + 1).forEach(f => assert.ok(Math.hypot(e.cx - f.cx, e.cy - f.cy) > e.rayon + f.rayon * .46, `boule ${n} : étoiles séparées`)));
  }
  const min = Math.min(...rayons), max = Math.max(...rayons);
  assert.ok(max - min < .05, `même taille partout (${min.toFixed(2)} à ${max.toFixed(2)})`);
});

test("les trois états : gagnée orange aux étoiles rouges, à tenter blanche cerclée d'orange, plus tard grise en pointillés", () => {
  const gagnee = bouleMarche({etoile: 2}, "gagnee");
  const [fondG] = trouver(gagnee, "circle");
  assert.match(fondG.attributs.fill, /^url\(#boule-\d+\)$/);
  assert.equal(fondG.attributs.stroke, "#c9701a");
  assert.equal(fondG.attributs["stroke-dasharray"], undefined);
  assert.equal(trouver(gagnee, "path")[0].attributs.fill, "#c62828", "étoiles rouges");
  assert.equal(trouver(gagnee, "ellipse").length, 1, "le reflet de la boule gagnée");
  // Le reflet ne touche aucune étoile, quelle que soit la boule.
  for (let n = 1; n <= 5; n++) {
    const boule = bouleMarche({etoile: n}, "gagnee");
    const [reflet] = trouver(boule, "ellipse");
    const {cx, cy, rx, ry} = Object.fromEntries(Object.entries(reflet.attributs).map(([k, v]) => [k, Number(v)]));
    etoiles(boule).forEach(e => e.points.forEach(([x, y]) => assert.ok(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1, `boule ${n} : une pointe d'étoile sous le reflet`)));
    assert.ok(cy - ry > 26 - 22 + 1, "le reflet reste dans la boule");
  }
  const [defsG] = trouver(gagnee, "defs");
  const [degradeG] = defsG.enfants;
  assert.equal(`url(#${degradeG.attributs.id})`, fondG.attributs.fill, "le dégradé est dans la boule elle-même");
  assert.deepEqual(degradeG.enfants.map(s => s.attributs["stop-color"]), ["#ffd27a", "#f6a623", "#e3780c"]);

  const suivante = bouleMarche({etoile: 3}, "suivante");
  const [fondS] = trouver(suivante, "circle");
  assert.equal(fondS.attributs.stroke, "#e8961e", "cerclée d'orange");
  assert.equal(trouver(suivante, "path")[0].attributs.fill, "#e8961e", "étoiles orange");
  assert.equal(trouver(suivante, "ellipse").length, 0);
  assert.deepEqual(trouver(suivante, "defs")[0].enfants[0].enfants.map(s => s.attributs["stop-color"]), ["#ffffff", "#fff2dd"], "blanche");

  const plusTard = bouleMarche({etoile: 4}, "plustard");
  const [fondP] = trouver(plusTard, "circle");
  assert.equal(fondP.attributs.fill, "#f1f4f7");
  assert.equal(fondP.attributs["stroke-dasharray"], "4 3", "en pointillés");
  assert.equal(trouver(plusTard, "defs").length, 0);
  assert.equal(trouver(plusTard, "path")[0].attributs.fill, "#c3ccd5");

  // Chaque boule a SON dégradé : un dégradé pris dans un écran caché (l'accueil
  // quand Mon parcours est ouvert) ne se dessinerait pas.
  const ids = [1, 2, 3, 4, 5].map(n => trouver(trouver(bouleMarche({etoile: n}, "gagnee"), "defs")[0], "radialGradient")[0].attributs.id);
  assert.equal(new Set(ids).size, 5, "cinq identifiants différents");
  assert.notEqual(ids[0], degradeG.attributs.id);
});

test("Mon parcours : chaque case de l'escalier est une boule ; plus de badge ★★, la Légende garde « 👑 Légende des tables »", () => {
  const zone = entre("        // « Je deviens expert » : l'escalier des cinq marches", "        expert.append(expertHead, stars);");
  assert.match(zone, /texte: bouleMarche\(marche, marche\.gagnee \? "gagnee" : jouable \? "suivante" : "plustard"\),/, "gagnée, à tenter (la suivante, jouable), plus tard");
  assert.doesNotMatch(zone, /symboleMarche/);
  assert.match(zone, /expertBadge\.textContent = couronne \? "👑 Légende des tables" : expertOuvert \? "" : expertAttend;/);
  assert.doesNotMatch(zone, /PARCOURS\.symboleEtoile\(etat\.expert\.niveau\)/, "le niveau ★★ n'est plus écrit au-dessus des boules");
  // Les règles de D5 ne bougent pas.
  assert.match(zone, /const jouable = expertOuvert && \(marche\.suivante \|\| \(marche\.gagnee && marche\.etoile === PARCOURS\.ETOILES_MAX\)\);/);
  assert.match(zone, /config: jouable \? marche\.config : null,/);
  // La case n'a plus de cadre : c'est la boule.
  assert.match(html, /#parcours-expert \.marche-cell \.cell\.is-star \{ width: 52px; min-width: 0; height: 52px; min-height: 0; padding: 0; border: 0; border-radius: 50%; background: none; \}/);
  assert.match(html, /#parcours-expert \.cell \.boule \{ display: block; width: 100%; height: 100%; \}/);
  assert.doesNotMatch(html, /\.cell\.is-star\.n[2-5] \{|\.cell\.is-star\.is-fermee \{/, "les étoiles ne rapetissent plus d'une marche à l'autre");
  // Ce que la page lit : Tom, 9 tables, ★★ → deux gagnées, la 3e à tenter, deux plus tard.
  const etat = P.etatAffichage(tom());
  const jouable = m => etat.expert.ouvert && (m.suivante || (m.gagnee && m.etoile === P.ETOILES_MAX));
  assert.deepEqual(etat.expert.marches.map(m => (m.gagnee ? "gagnee" : jouable(m) ? "suivante" : "plustard")), ["gagnee", "gagnee", "suivante", "plustard", "plustard"]);
});

test("l'accueil garde son escalier doré, avec ses étoiles (choix de Gwenaël du 14/10 au soir)", () => {
  const zone = entre("        expert.marches.forEach(marche => {\n          const item = document.createElement(\"div\");", "          escalier.append(item);");
  assert.match(zone, /bloc\.className = "bloc";\s*bloc\.append\(symboleMarche\(marche\)\);/);
  assert.match(zone, /item\.append\(bloc, duree\);/);
  assert.doesNotMatch(zone, /bouleMarche/, "pas de boules sur l'accueil");
  assert.match(html, /\.marche:nth-child\(1\) \.bloc \{ height: 40px; \} \.marche:nth-child\(2\) \.bloc \{ height: 52px; \}/, "les marches de plus en plus hautes");
  assert.match(html, /\.marche\.is-suivante small \{ color: var\(--blue\); \}/);
});

test("la fiche (papier) garde ses étoiles et sa couronne", () => {
  assert.match(html, /star\.append\(symboleMarche\(marche\)\);/);
  assert.match(html, /function symboleMarche\(marche\) \{/);
});

function tom() {
  const p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.expert = {etoiles: 2, dernier: "2026-10-13", couronne: null};
  return P.normaliserParcours(p);
}
