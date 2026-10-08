/* SPLAT! Enquête — lot E7 « au téléphone : phrases lisibles, plateau remonté » (24/09/2026).
   Sur un écran de moins de 600 px, pendant la question d'une carte de l'Enquête :
   - les phrases d'indice quittent le dessin et s'écrivent en HTML, en haut, sur toute la
     largeur, en 14 px (elles tombaient à 9-10 px, 7 px sur un petit téléphone) ;
   - le TOTAL passe à droite du plateau, à 10 px (jamais collé) ; une carte sans total n'a pas de
     case (08/10/2026) : le plateau garde la taille qu'il avait à côté d'elle, centré ;
   - le dessin est cadré sur les taches seules et le plateau prend la hauteur de son
     dessin (plus de bande blanche au-dessus du TOTAL) ;
   - la réserve sous la carte ne garde que la 2e ligne du message (à la 3e erreur, la réponse
     s'écrit et le pavé s'efface : plus de bouton « Voir la réponse » sous le pavé, 05/10/2026).
   Ordinateur, tablette, projection et impression : rien ne change (preuve au pixel à part).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function constLine(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
const feuille = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
function regles(css){
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), decl: m[2].trim() }));
}
function decl(sel){
  const r = regles(feuille).find((x) => x.sel === sel);
  assert.ok(r, `règle ${sel} introuvable`);
  return r.decl;
}

// --- un tout petit DOM : juste ce que les fonctions lisent ----------------------------------
class N {
  constructor(tag, id = ""){ this.tagName = tag; /* SVG : minuscules, comme dans le navigateur */ this.id = id; this.enfants = []; this.parentNode = null; this.style = {}; this._cls = new Set(); this.innerHTML = ""; this.className = ""; this.rect = { width: 0, height: 0, top: 0, bottom: 0 }; }
  get classList(){ const s = this._cls; return { add: (c) => s.add(c), remove: (...c) => c.forEach((x) => s.delete(x)), contains: (c) => s.has(c), toggle: (c, v) => (v ? s.add(c) : s.delete(c)) }; }
  appendChild(n){ n.parentNode = this; this.enfants.push(n); return n; }
  insertBefore(n, ref){ n.parentNode = this; const i = ref ? this.enfants.indexOf(ref) : -1; if(i < 0) this.enfants.push(n); else this.enfants.splice(i, 0, n); return n; }
  removeChild(n){ const i = this.enfants.indexOf(n); if(i >= 0) this.enfants.splice(i, 1); n.parentNode = null; return n; }
  remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
  get previousElementSibling(){ if(!this.parentNode) return null; const i = this.parentNode.enfants.indexOf(this); return i > 0 ? this.parentNode.enfants[i - 1] : null; }
  getBoundingClientRect(){ return this.rect; }
}
function trouver(racine, id){
  if(racine.id === id) return racine;
  for(const e of racine.enfants){ const r = trouver(e, id); if(r) return r; }
  return null;
}
function monter(){
  const carte = new N("div", "cardbox");
  const plateau = carte.appendChild(new N("div", "svgWrap"));
  plateau.rect = { width: 352, height: 388, top: 37, bottom: 425 };
  const svg = plateau.appendChild(new N("svg", "mainSvg"));
  svg.attrs = {};
  svg.setAttribute = (k, v) => { svg.attrs[k] = v; };
  svg.viewBox = { baseVal: { x: 0, y: 0, width: 1400, height: 600 } };
  const document = {
    getElementById: (id) => trouver(carte, id),
    createElement: (tag) => new N(tag)
  };
  return { carte, plateau, svg, document };
}
const carteC = (extra = {}) => ({
  family: "C", total: 38, hidden: [9, 5, 17], visible: [7],
  _rel: { taskCount: 3 }, _inv: { indices: ["Sous la tache noire, il y a 12 jetons de plus que sous la tache bleue.", "Sous la tache violette, il y a 8 jetons de moins que sous la tache noire."] },
  ...extra
});

const outils = (document, svg, etat = {}) => new Function("document", "svg", "etat", `
  let eleveIndicesTel = !!etat.tel;
  ${constLine("const ELEVE_PLATEAU_MIN_ENQ")}
  ${constLine("const ELEVE_TOTAL_TEL_PLACE")}
  ${constLine("const ENQUETE_REGLE_REPETEES")}
  ${fn("eleveIndicesPossible")}
  ${fn("eleveIndicesHtml")}
  ${fn("enqueteSansCase")}
  ${fn("eleveIndicesAfficher")}
  ${fn("eleveIndicesHauteurPlateau")}
  ${fn("eleveCadrerScene")}
  return { possible: eleveIndicesPossible, html: eleveIndicesHtml, afficher: eleveIndicesAfficher,
    hauteur: eleveIndicesHauteurPlateau, cadrer: eleveCadrerScene, regler: (v) => { eleveIndicesTel = v; } };
`)(document, svg, etat);

test("seules les cartes de l'Enquête écrites en phrases passent au texte HTML", () => {
  const { document, svg } = monter();
  const o = outils(document, svg);
  assert.equal(o.possible(carteC()), true);
  assert.equal(o.possible(carteC({ _inv: { indices: [["rouge", "=", "2", "×", "verte"]] } })), false, "indices en symboles : restent dessinés");
  assert.equal(o.possible(carteC({ _directSubstitution: true })), false);
  assert.equal(o.possible({ family: "N", _inv: { indices: ["x"] } }), false, "monde 2 : rien ne change");
  assert.equal(o.possible(carteC({ _inv: { indices: [] } })), false);
});

test("les phrases dans l'ordre, texte échappé, et la règle des taches répétées en dernier", () => {
  const { document, svg } = monter();
  const o = outils(document, svg);
  const h = o.html(carteC({ _inv: { indices: ["a < b & c"] }, _rel: { repetees: { couleurDe: [0, 0, 1] } } }));
  assert.equal(h, '<p>a &lt; b &amp; c</p><p class="regle">Les taches de même couleur cachent le même nombre de jetons.</p>');
  assert.equal(o.html(carteC()).split("<p>").length - 1, 2);
});

test("téléphone : les phrases au-dessus du plateau, le TOTAL dans la 2e colonne ; hors téléphone, rien", () => {
  const { document, svg, carte, plateau } = monter();
  const o = outils(document, svg, { tel: true });
  o.afficher(carteC());
  const bloc = document.getElementById("eleveIndices");
  assert.ok(bloc, "le bloc de phrases existe");
  assert.equal(carte.enfants.indexOf(bloc), carte.enfants.indexOf(plateau) - 1, "juste au-dessus du plateau");
  const tot = document.getElementById("eleveTotalTel");
  assert.equal(tot.parentNode, plateau, "le TOTAL est dans le plateau (sa 2e colonne)");
  assert.equal(tot.innerHTML, "<span>TOTAL</span><b>38</b>");
  assert.ok(plateau.classList.contains("avecTotalTel"));
  // une carte de l'Enquête sans total n'a PAS DE CASE (08/10/2026) : ni « TOTAL ? » ni « PAS DE
  // TOTAL », les phrases restent ; le plateau garde sa taille (classe sansCaseTel, voir plus bas)
  o.afficher(carteC({ _rel: { sansTotal: true } }));
  assert.equal(document.getElementById("eleveTotalTel"), null, "sans total : pas de case");
  assert.ok(document.getElementById("eleveIndices"), "les phrases restent");
  assert.equal(plateau.classList.contains("avecTotalTel"), false);
  assert.ok(plateau.classList.contains("sansCaseTel"));
  // la carte suivante, avec total : sa case revient, la classe ne reste pas
  o.afficher(carteC());
  assert.equal(document.getElementById("eleveTotalTel").innerHTML, "<span>TOTAL</span><b>38</b>");
  assert.equal(plateau.classList.contains("sansCaseTel"), false, "la classe ne reste pas d'une carte à l'autre");
  assert.doesNotMatch(fn("eleveIndicesAfficher"), /inconnu|"\?"/, "plus de « TOTAL ? » au téléphone");
  assert.equal(carte.enfants.filter((n) => n.id === "eleveIndices").length, 1, "jamais deux blocs");
  // hors téléphone (ou écran de fin) : tout s'en va
  o.regler(false);
  o.afficher(carteC());
  assert.equal(document.getElementById("eleveIndices"), null);
  assert.equal(document.getElementById("eleveTotalTel"), null);
  assert.equal(plateau.classList.contains("avecTotalTel"), false);
  assert.equal(plateau.classList.contains("sansCaseTel"), false);
});

test("le dessin est cadré sans les phrases ni le TOTAL (au téléphone seulement)", () => {
  const monte = (tel) => {
    const m = monter();
    const clue = m.svg.appendChild(new N("g", "clueGroup"));
    const boite = m.svg.appendChild(new N("rect"));
    const gT = m.svg.appendChild(new N("g", "totalGroup"));
    m.svg.getBBox = () => ({ x: 100, y: 200, width: 1400, height: 600 });
    outils(m.document, m.svg, { tel }).cadrer();
    return { ...m, clue, boite, gT };
  };
  const t = monte(true);
  assert.equal(t.clue.parentNode, null, "phrases retirées du dessin");
  assert.equal(t.gT.parentNode, null, "TOTAL retiré du dessin");
  assert.equal(t.boite.parentNode, null, "sa boîte aussi");
  assert.equal(t.svg.attrs.viewBox, "76 176 1448 648");
  const o = monte(false);
  assert.ok(o.clue.parentNode && o.gT.parentNode && o.boite.parentNode, "ordinateur : le dessin garde tout");
});

test("le plateau prend la hauteur de son dessin, à la largeur de sa colonne (TOTAL et écart de 10 px ôtés)", () => {
  const { document, svg, plateau } = monter();
  const o = outils(document, svg, { tel: true });
  o.afficher(carteC());
  document.getElementById("eleveTotalTel").rect = { width: 62, height: 50 };
  o.hauteur();
  const attendu = Math.round((352 - 62 - 10) * 600 / 1400);
  assert.equal(plateau.style.height, attendu + "px");
  assert.equal(plateau.style.minHeight, attendu + "px");
  // Enquête sans total (08/10/2026) : plus de case, mais sa place (80 px) est ôtée quand même — le
  // plateau garde la taille qu'il avait à côté d'elle, et le dessin se centre
  o.afficher(carteC({ _rel: { sansTotal: true } }));
  o.hauteur();
  assert.equal(plateau.style.height, Math.round((352 - 80) * 600 / 1400) + "px");
  const autre = monter();
  outils(autre.document, autre.svg, { tel: false }).hauteur();
  assert.equal(autre.plateau.style.height, undefined, "hors téléphone : la hauteur du CSS");
});

test("au pavé : réserve de 22 px et plancher de 100 px pour l'Enquête au téléphone, 48 et 150 ailleurs", () => {
  const cas = (tel, besoinSansReserve) => {
    const plateau = { style: {}, getBoundingClientRect: () => ({ height: 200 }) };
    const boite = { getBoundingClientRect: () => ({ bottom: besoinSansReserve }) };
    new Function("document", "window", "tel", `
      let eleveIndicesTel = tel;
      ${constLine("const ELEVE_PLATEAU_MIN ")}
      ${constLine("const ELEVE_PLATEAU_MIN_ENQ")}
      let elevePaveZone = 500;
      function eleveIndicesHauteurPlateau(){}
      ${fn("elevePaveCalerCarte")}
      elevePaveCalerCarte();
    `)({ getElementById: () => plateau, querySelector: () => boite }, { scrollY: 0 }, tel);
    return plateau.style.height;
  };
  // zone 500, jeu 10 : place 490. Carte qui finit à 480 : l'Enquête (réserve 22) doit rendre 12 px
  assert.equal(cas(true, 480), "188px");
  // ailleurs (réserve 48) : 38 px
  assert.equal(cas(false, 480), "162px");
  // beaucoup trop haute : planchers
  assert.equal(cas(true, 900), "100px");
  assert.equal(cas(false, 900), "150px");
});

test("3e erreur (05/10/2026) : la réponse s'écrit et le pavé s'efface — plus de bouton à faire défiler au-dessus du pavé", () => {
  const v = fn("eleveValiderSplat");
  assert.match(v, /if\(eleveEchecs >= ELEVE_ECHECS_MAX\)\{ eleveMontrerReponse\(\); return; \}/);
  assert.doesNotMatch(html, /eleveMontrerAuDessusDuPave|eleveRemonterApresErreur|eleveDefileErreur/, "le défilement d'avant n'a plus lieu d'être");
  // le pavé suit le Valider : éteint (carte finie), il s'efface
  assert.match(fn("elevePaveSynchroniser"), /if\(carte && bouton && !bouton\.disabled\) elevePave\.afficher\(\);\n  else elevePave\.masquer\(\);/);
  assert.match(fn("eleveMontrerReponse"), /bouton\.disabled = true;/);
});

test("le schéma (lot E6) remplace les phrases du haut par son bandeau TOTAL + phrases", () => {
  const { document, svg, carte, plateau } = monter();
  const o = outils(document, svg, { tel: true });
  o.afficher(carteC());
  new Function("document", `${fn("enqueteSansCase")} ${fn("eleveRappelHtml")} ${fn("eleveRappelAfficher")} eleveRappelAfficher(arguments[1]);`)(document, carteC());
  assert.equal(document.getElementById("eleveIndices"), null, "pas deux fois les phrases");
  const bandeau = document.getElementById("eleveRappel");
  assert.equal(carte.enfants.indexOf(bandeau), carte.enfants.indexOf(plateau) - 1);
  // CSS : le TOTAL de la 2e colonne se cache pendant le schéma
  assert.match(decl("body.eleve-mode #svgWrap.eleveSchemaTel #eleveTotalTel"), /display:none/);
});

test("renderEleveSplat : le drapeau avant le dessin, les phrases et la hauteur après le cadrage ; l'écran de fin garde le plateau d'avant", () => {
  const r = fn("renderEleveSplat");
  assert.match(r, /eleveIndicesTel = !!enquete && eleveIndicesPossible\(card\) && eleveSchemaTelephone\(\);[^\n]*\n  renderCard\(card, 0\);\n  eleveCadrerScene\(\);\n  eleveIndicesAfficher\(card\);\n  eleveIndicesHauteurPlateau\(\);/);
  assert.match(fn("renderEleveFinSplat"), /eleveIndicesTel = false; eleveIndicesAfficher\(null\);/);
  assert.match(fn("elevePaveCalerCarte"), /plateau\.style\.minHeight = "";\n  eleveIndicesHauteurPlateau\(\);/);
});

test("appareil tourné pendant la question : on change de disposition, les cases remplies ne bougent pas", () => {
  const journal = [];
  const etat = new Function("journal", `
    let eleveActif = true, eleveIdx = 0, eleveSchemaEtape = 0, eleveIndicesTel = true, large = false;
    const eleveSerie = [{ family: "C", _rel: {}, _inv: { indices: ["x"] } }];
    function eleveIndicesPossible(){ return true; }
    function eleveSchemaTelephone(){ return !large; }
    function elevePaveRendrePlateau(){ journal.push("rendre"); }
    function renderCard(c, e){ journal.push("dessin " + e + " tel=" + eleveIndicesTel); }
    function eleveCadrerScene(){ journal.push("cadrer"); }
    function eleveIndicesAfficher(){ journal.push("afficher"); }
    function eleveIndicesHauteurPlateau(){ journal.push("hauteur"); }
    function renderEleveSplat(){ journal.push("NOUVELLE CARTE"); }
    ${fn("eleveIndicesRecaler")}
    return { tourner: (v) => { large = v; eleveIndicesRecaler(); }, tel: () => eleveIndicesTel, schema: (e) => { eleveSchemaEtape = e; } };
  `)(journal);
  etat.tourner(false);
  assert.deepEqual(journal, [], "même disposition : rien");
  etat.tourner(true);
  assert.equal(etat.tel(), false);
  assert.deepEqual(journal, ["rendre", "dessin 0 tel=false", "cadrer", "afficher", "hauteur"]);
  journal.length = 0;
  etat.schema(2);
  etat.tourner(false);
  assert.deepEqual(journal, [], "pendant le schéma, c'est eleveDessinerSchema (lot E6) qui gère");
});

test("CSS : phrases en 14 px, TOTAL à 10 px du plateau, question sur une ligne sur un petit téléphone", () => {
  assert.match(decl("#eleveIndices p"), /font-size:14px/);
  assert.match(decl("body.eleve-mode #svgWrap.avecTotalTel"), /column-gap:10px/);
  assert.match(constLine("const ELEVE_PLATEAU_MIN_ENQ"), /ELEVE_TOTAL_TEL_ECART = 10;/);
  assert.match(feuille, /@media \(max-width:379px\)\{ #elevePanel\.enquete \.eleveConsigne\{font-size:14px\} \}/);
});
