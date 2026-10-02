/* SPLAT! Enquête — lot « projection » (30/09/2026).
   1. En projection, la correction en barres tient sur la scène (1600 × 1000) : le plateau
      et le dessin rétrécissent ensemble ; rien n'est coupé. Les hauteurs ci-dessous sont celles
      des dessins ①②③ mesurées au navigateur (la plus haute carte de chacune des 30 fiches de
      la progression en six livrets) ; avant ce lot, 338 étapes sur 355 dépassaient la scène.
      Le contrôle au navigateur sur les vraies cartes : tests/splat-enquete-projection-cadre-regression.cjs
      (hors CI, il lui faut playwright).
   2. Le menu de l'Enquête : mêmes réglages, mêmes valeurs, rangés en blocs réguliers. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
const CONSTANTES = `${ligne("const ENQ_PROJ_IDS = ")}\n${ligne("const ENQ_PROJ_SCENE_BAS = ")}\n${ligne("const ENQ_PROJ_COTE_SEUIL = ")}`;
const facteurs = new Function(`${CONSTANTES}\n${fn("enqueteProjectionFacteurs")}\nreturn enqueteProjectionFacteurs;`)();

/* hauteurs mesurées de ①, ② (absente sans total), ③ — la carte la plus haute de chaque fiche */
const HAUTEURS = {
  "10 de plus que": [344, 402, 507], "11 de moins que": [398, 402, 507], "13 une référence": [459, 402, 573],
  "14 jetons visibles": [575, 402, 562], "10d chaîne": [635, 402, 570], "11d je complète": [629, 402, 502],
  "13d désordre": [581, 402, 570], "14d grand défi additif": [697, 402, 575], "15 fois plus": [344, 402, 439],
  "16 fois moins": [452, 402, 439], "18 deux rapports": [567, 402, 570], "15d chaîne deux rapports": [635, 402, 507],
  "17d je complète avec rapport": [629, 402, 573], "18d indices composés": [406, 402, 507], "19d grand défi": [691, 402, 575],
  "20 taches répétées": [858, 402, 507], "21 répétées fois plus": [912, 402, 439], "22 sans total": [412, 439],
  "23 sans total à retourner": [520, 371], "24 défi qui rebondit": [751, 402, 500], "20d deux taches réunies": [581, 402, 570],
  "21d répétées trois couleurs": [981, 402, 565], "22d symboles": [635, 402, 502], "23d très grands nombres": [629, 402, 568],
  "24d unité commune": [693, 588, 611], "3 taches réunies + visibles (graine 77)": [643, 402, 568],
};
const BAS_PLATEAU = 548, HAUT = 620, SCENE = 1000;

test("projection : pour chaque type, le bas du dessin reste dans la scène", () => {
  for(const [nom, hs] of Object.entries(HAUTEURS)){
    const H = Math.max(...hs);
    const f = facteurs(BAS_PLATEAU, HAUT, HAUT + H);
    assert.ok(f.plateau >= 0.55 && f.plateau <= 1, `${nom} : plateau ${f.plateau}`);
    assert.ok(f.dessin > 0.6 && f.dessin <= 1, `${nom} : dessin ${f.dessin}`);
    assert.ok(Math.abs(f.plateau - f.dessin) <= 0.003, `${nom} : plateau ${f.plateau} et dessin ${f.dessin} ne vont pas ensemble`);
    /* le dessin commence sous le plateau réduit */
    if(!f.tient) assert.ok(f.y >= f.plateau * BAS_PLATEAU + 10, `${nom} : le dessin chevauche le plateau`);
    /* chaque étape, avec les facteurs de la carte, finit avant le bas de la scène */
    hs.forEach((h, i) => { const e = facteurs(BAS_PLATEAU, HAUT, HAUT + H, HAUT + h); assert.equal(e.plateau, f.plateau); assert.equal(e.y, f.y);
      assert.ok(e.y + e.dessin * h <= SCENE - 30 + 1e-6, `${nom}, étape ${i + 1} : bas ${e.y + e.dessin * h}`); });
  }
});

test("projection : le plateau et le dessin rétrécissent ensemble, du même facteur", () => {
  /* tout tient déjà : rien ne bouge */
  assert.deepEqual(facteurs(548, 620, 960), { plateau:1, dessin:1, y:620, tient:true });
  /* remonter contre le plateau suffit : aucun facteur */
  const a = facteurs(548, 620, 1012);
  assert.equal(a.plateau, 1); assert.equal(a.dessin, 1); assert.equal(a.tient, false); assert.ok(a.y < 620);
  /* sinon : le même facteur pour les deux (au millième près, le bas du dessin est arrondi) */
  for(const H of [507, 573, 643, 697, 981]){
    const f = facteurs(548, 620, 620 + H);
    assert.ok(f.plateau < 1 && f.plateau >= 0.55, `plateau ${f.plateau}`);
    assert.ok(Math.abs(f.plateau - f.dessin) <= 0.003, `dessin ${H} : ${f.plateau} / ${f.dessin}`);
  }
  assert.equal(facteurs(548, 620, 620 + 643).plateau, 0.799);
  /* plancher du plateau : au-delà, seul le dessin continue de rétrécir */
  const c = facteurs(548, 620, 620 + 1400);
  assert.equal(c.plateau, 0.55); assert.ok(c.dessin < 0.55);
  /* quelle que soit la hauteur, jamais coupé */
  for(let basP = 480; basP <= 620; basP += 10) for(let H = 200; H <= 1400; H += 7){
    const f = facteurs(basP, 620, 620 + H);
    assert.ok(f.y + f.dessin * H <= 970 + 1e-6, `plateau ${basP}, dessin ${H}`);
  }
});

/* Le cadrage lui-même, sur une scène factice : trois dessins de hauteurs connues. */
function scene(hauteurs, etape){
  const noeud = (nom, attrs = {}) => ({
    nom, attrs: { ...attrs }, enfants: [], parentNode: null, bb: null,
    setAttribute(k, v){ this.attrs[k] = String(v); }, getAttribute(k){ return this.attrs[k]; },
    appendChild(n){ if(n.parentNode) n.parentNode.removeChild(n); n.parentNode = this; this.enfants.push(n); return n; },
    insertBefore(n, ref){ if(n.parentNode) n.parentNode.removeChild(n); n.parentNode = this; this.enfants.splice(this.enfants.indexOf(ref), 0, n); return n; },
    removeChild(n){ this.enfants = this.enfants.filter(x => x !== n); n.parentNode = null; return n; },
    get childNodes(){ return this.enfants; },
    getBBox(){
      if(this.bb) return this.bb;
      const bs = this.enfants.map(e => e.getBBox()).filter(b => b.height > 0);
      if(!bs.length) return { x:0, y:0, width:0, height:0 };
      const y = Math.min(...bs.map(b => b.y)), bas = Math.max(...bs.map(b => b.y + b.height));
      return { x:0, y, width:1600, height:bas - y };
    },
  });
  const svg = noeud("svg");
  const total = noeud("g", { id:"totalGroup" }); total.bb = { x:700, y:8, width:200, height:120 };
  const plateau = noeud("g", { id:"relationTrayScale" }); plateau.bb = { x:300, y:150, width:1000, height:398 };
  svg.appendChild(total); svg.appendChild(plateau);
  const ids = ["enqueteBarres", hauteurs.length === 3 ? "enqueteLigne" : null, "enqueteCalculs"].filter(Boolean);
  const dessiner = (i) => (cible) => { const g = noeud("g", { id:ids[i] }); g.bb = { x:60, y:620, width:1480, height:hauteurs[i] }; cible.appendChild(g); return hauteurs[i]; };
  dessiner(etape - 1)(svg);
  const courant = svg.enfants[svg.enfants.length - 1];
  const document = { getElementById: (id) => { const c = (n) => n.attrs.id === id ? n : n.enfants.map(c).find(Boolean); return c(svg) || null; } };
  /* sans pas à pas G3 (enqueteProjectionPasAPas → null) : le cadrage des trois étapes, qui reste
     le repli d'une carte que G3 ne saurait pas lire ; le pas à pas : tests/splat-enquete-g3-projection.test.mjs */
  const cadrer = new Function("svg", "document", "el", "enqueteBarresModele", "drawEnqueteBarres", "drawEnqueteLigne", "drawEnqueteCalculs", "enqueteProjectionPasAPas", `
    ${CONSTANTES}
    ${fn("enqueteProjectionFacteurs")}
    ${fn("enqueteProjectionACote")}
    ${fn("enqueteProjectionCadrer")}
    return enqueteProjectionCadrer;`)(
    svg, document, noeud, () => ({ ligne: hauteurs.length === 3 ? {} : null }),
    dessiner(0), hauteurs.length === 3 ? dessiner(1) : null, dessiner(hauteurs.length - 1), () => null);
  return { svg, courant, total, plateau, f: cadrer({}, etape) };
}
function basALEcran(dessin, h){
  const m = /^translate\(800 ([\d.]+)\) scale\(([\d.]+)\) translate\(-800 -620\)$/.exec(dessin.attrs.transform || "");
  return m ? Number(m[1]) + Number(m[2]) * h : 620 + h;
}

test("projection : le plateau ne bouge pas d'un appui à l'autre, chaque étape prend la place qui reste", () => {
  for(const [nom, hs] of Object.entries(HAUTEURS)){
    const vus = [];
    hs.forEach((h, i) => {
      const s = scene(hs, i + 1);
      assert.ok(s.f, `${nom} : pas de cadrage`);
      /* la scène ne porte plus que le plateau enveloppé et le dessin, dans cet ordre */
      assert.deepEqual(s.svg.enfants.map(n => n.attrs.id), ["enqueteProjectionPlateau", s.courant.attrs.id], nom);
      assert.deepEqual(s.svg.enfants[0].enfants, [s.total, s.plateau], `${nom} : le plateau a perdu un élément`);
      assert.equal(s.courant.attrs["data-facteur"], String(s.f.dessin));
      assert.ok(basALEcran(s.courant, h) <= 970 + 1e-6, `${nom}, étape ${i + 1} : coupé (${basALEcran(s.courant, h)})`);
      vus.push(`${s.f.plateau}/${s.f.y}`);
      /* une étape plus courte que la plus haute reprend de la place : jamais plus petite qu'elle */
      const ref = new Function(`${CONSTANTES}\n${fn("enqueteProjectionFacteurs")}\nreturn enqueteProjectionFacteurs;`)()(548, 620, 620 + Math.max(...hs));
      assert.ok(s.f.dessin >= ref.dessin && s.f.dessin <= 1, `${nom}, étape ${i + 1} : dessin ${s.f.dessin}`);
      if(h < Math.max(...hs) && ref.dessin < 1) assert.ok(s.f.dessin > ref.dessin, `${nom}, étape ${i + 1} : de la place perdue`);
    });
    assert.equal(new Set(vus).size, 1, `${nom} : le plateau bouge d'une étape à l'autre (${vus})`);
  }
  /* une carte qui tient : aucune transformation */
  const s = scene([300, 320, 340], 3);
  assert.equal(s.courant.attrs.transform, undefined);
  assert.equal(s.svg.enfants[0].attrs.transform, undefined);
});

test("projection : le plateau à côté du dessin quand l'étape est trop haute et qu'un coin est libre", () => {
  const aCote = new Function(`${CONSTANTES}\n${fn("enqueteProjectionACote")}\nreturn enqueteProjectionACote;`)();
  const bp = { x:300, y:8, width:1000, height:540 };
  const dessin = (pleins, H = 981) => {
    const cadre = { getBBox: () => ({ x:60, y:620, width:1480, height:H }) };
    return { getBBox: () => ({ x:60, y:620, width:1480, height:H }), querySelector: () => cadre,
      querySelectorAll: () => [cadre, ...pleins.map(b => ({ getBBox: () => b }))] };
  };
  /* des barres à gauche, deux lignes de texte en haut : le coin bas-droit est libre */
  const barres = [{ x:80, y:640, width:1440, height:150 }, { x:80, y:800, width:700, height:780 }];
  const c = aCote(dessin(barres), bp, { plateau:0.636, dessin:0.636, y:367, tient:false });
  assert.ok(c, "pas de place trouvée");
  assert.ok(c.dessin > 0.97 && c.plateau >= 0.5 && c.plateau <= 0.9, JSON.stringify(c));
  /* le plateau posé ne recouvre aucun élément et reste dans le cadre */
  const w = c.plateau * bp.width, h = c.plateau * bp.height;
  assert.ok(c.px >= 800 + c.dessin * (780 - 800) && c.px + w <= 800 + c.dessin * (1540 - 800), JSON.stringify(c));
  assert.ok(c.py >= 10 + c.dessin * 150 && c.py + h <= 970, JSON.stringify(c));
  /* une ligne pleine largeur (②) : aucun coin libre, on reste empilé */
  assert.equal(aCote(dessin([{ x:80, y:640, width:1440, height:900 }]), bp, { plateau:0.636, dessin:0.636, y:367, tient:false }), null);
  /* un dessin qui est déjà assez grand sous le plateau ne bouge pas */
  assert.equal(aCote(dessin(barres), bp, { plateau:0.85, dessin:0.85, y:480, tient:false }), null);
  assert.equal(aCote(dessin(barres), bp, { plateau:1, dessin:1, y:620, tient:true }), null);
  /* le plateau passe par-dessus le fond blanc du cadre */
  assert.match(fn("enqueteProjectionCadrer"), /plateau\.setAttribute\("data-place", "cote"\);\n\s+svg\.appendChild\(plateau\);/);
});

test("projection : seul l'écran du professeur est cadré ; le mode élève et l'impression gardent les leurs", () => {
  const appels = html.split("enqueteProjectionCadrer(").length - 1;
  assert.equal(appels, 3, "une définition, l'appel de la projection, celui du pas à pas en mode élève (01/10/2026)");
  assert.match(fn("eleveRendreEtape"), /if\(e > 0 && card && card\.family === "C" && enqueteProjectionPasAPas\(card\)\)\{\n    enqueteProjectionCadrer\(card, e\);/);
  assert.match(fn("updateUI"), /if\(eleveActif\)\{ renderEleveSplat\(\); return; \}[\s\S]*else \{ renderCard\(cards\[idx\], revealState\); enqueteProjectionCadrer\(cards\[idx\], revealState\); \}\n\}/);
  /* un dessin qui n'est pas posé directement sur la scène (mode élève : calque décalé) n'est pas touché */
  assert.match(fn("enqueteProjectionCadrer"), /dessin && dessin\.parentNode === svg \? enqueteBarresModele\(card\) : null/);
  assert.match(html, /<svg id="mainSvg" tabindex="0" viewBox="0 0 1600 1000"/);
});

test("menu de l'Enquête : mêmes réglages et mêmes valeurs, rangés en blocs réguliers", () => {
  const a = html.indexOf('<div id="investigateSettings"');
  const menu = html.slice(a, html.indexOf("</div>\n\n", html.indexOf('id="invTotalMax"', a)));
  assert.ok(a > 0 && menu.length > 1000);
  /* la forme : quatre menus dans une grille, libellés courts */
  const forme = menu.slice(menu.indexOf('<div class="c-forme">'), menu.indexOf("Opérations autorisées"));
  assert.deepEqual([...forme.matchAll(/<label for="(\w+)">([^<]+)<\/label>/g)].map(m => `${m[1]}=${m[2]}`),
    ["invTaskCount=Taches", "invClueType=Indices", "invStructure3=Schéma", "invOrdre=Phrases"]);
  assert.ok(!/\(3 taches\)/.test(forme), "plus de « (3 taches) » dans les libellés");
  /* les valeurs des menus : inchangées (les adresses les écrivent telles quelles) */
  const valeurs = (id) => [...menu.slice(menu.indexOf(`<select id="${id}"`), menu.indexOf("</select>", menu.indexOf(`<select id="${id}"`))).matchAll(/<option value="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(valeurs("invTaskCount"), ["2", "3"]);
  assert.deepEqual(valeurs("invClueType"), ["SENTENCE", "SYMBOL"]);
  assert.deepEqual(valeurs("invStructure3"), ["HASARD", "REF", "CHAINE", "COMPLETE", "UNITE", "CHAIN", "PIVOT", "MIX"]);
  assert.deepEqual(valeurs("invOrdre"), ["HASARD", "DESSIN", "DESORDRE"]);
  /* les variantes : une grille à deux colonnes, « Sans total » et « Taches répétées » côte à côte */
  const variantes = menu.slice(menu.indexOf('class="c-ops c-variantes"'), menu.indexOf('Correction au tableau'));
  /* 02/10/2026 : la case « Pas à pas » a son bloc, « Correction au tableau », sous les variantes */
  const correction = menu.slice(menu.indexOf('Correction au tableau'), menu.indexOf('id="invMaxAdd"'));
  assert.deepEqual([...correction.matchAll(/<input type="checkbox" id="(\w+)"/g)].map(m => m[1]), ["invPasAPas"]);
  assert.deepEqual([...variantes.matchAll(/<input type="checkbox" id="(\w+)"/g)].map(m => m[1]),
    ["invVocab", "invCompose", "invNoTotal", "invRepeatOn", "invReunies"]);
  assert.match(variantes, /id="invRepeatRow"[^>]*>[\s\S]*<input id="invRepeat" type="number" min="2" max="3" value="3" \/>/);
  assert.match(html, /\.c-forme\{display:grid;grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(html, /\.c-ops\.c-variantes\{grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
  /* à 2 taches, « Schéma » et « Phrases » restent en place, grisés : plus de rangée qui apparaît */
  assert.ok(!/invStructureRow\.style\.display/.test(html) && !/invOrdreRowEl\.style\.display/.test(html));
  assert.match(html, /if\(invOrdreEl\) invOrdreEl\.disabled = !\(trois && !sansTotal\);/);
  assert.match(html, /if\(invStructure3El\) invStructure3El\.disabled = !trois \|\| \(sansTotal && !repetees\) \|\| reuniesOn;/);
  /* l'adresse : toujours écrite d'après le nombre de taches, pas d'après l'affichage */
  assert.match(html, /if\(invOrdreEl && invOrdreEl\.value !== "HASARD" && invTaskCountEl\.value === "3"\) params\.set\("ordre", invOrdreEl\.value\);/);
});
