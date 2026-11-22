// Défi conversions — les aides dessinées (lot 1, 11/11/2026).
//
// Propre à l'appli (ni l'exerciseur ni le serveur ne le chargent). Tout est
// construit en DOM, et tout texte passe par textContent : aucun texte n'est
// injecté en HTML.
//
//   AIDES.montrer(zone, aide, {fini})   un temps de « On te montre » (la
//                                       fiche de la carte) ; fini() quand le
//                                       geste est fait
//   AIDES.outil(zone, question, {fini}) l'outil de « À toi » : glisse-unité,
//                                       barre de l'heure, schéma en barres,
//                                       repères des unités
//   AIDES.image(zone, question)         l'image : la relation écrite
//   AIDES.carteRepere(code)             la carte d'un repère du carnet
//   AIDES.ceinture(n, {etat, doree})    la ceinture d'un palier (lot 3a)
//
// Le glisse-unité est celui du matériel virtuel de Gwenaël
// (conversions_materiel_virtuel.html), refait fidèlement au lot A2 : le
// nombre ne bouge pas, les deux poignées « L'unité de mesure » et « Le
// chiffre des unités » glissent ensemble. Le glisse-nombre est celui de Défi calcul, simplifié :
// les chiffres glissent, la virgule reste. Le schéma en barres suit les
// conventions de Gwenaël : angles droits, parts collées, une seule part
// verte, « ? » sur la part cherchée, pas de vert quand les parts sont
// inégales.
(function initDefiConversionsAides(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_DEFI_CONVERSIONS_AIDES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (root) => {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";
  const NB = " ";
  const carte = () => root.MATHSGO_CONVERSIONS_CARTE;
  const gen = () => root.MATHSGO_CONVERSIONS;

  function el(tag, classe, texte) {
    const e = root.document.createElement(tag);
    if (classe) e.className = classe;
    if (texte !== undefined && texte !== null) {
      if (String(texte).includes(BARRE)) e.appendChild(texteFractions(texte));
      else e.textContent = texte;
    }
    return e;
  }
  // Lot B2-2a (choix de Gwenaël du 18/11) : une fraction s'écrit en
  // colonne, le numérateur sur le dénominateur, comme au tableau. Les
  // générateurs l'écrivent avec la barre de fraction U+2044 (« 3⁄4 ») ; ce
  // texte devient trois morceaux : le haut, la barre (cachée, pour que le
  // texte lu reste « 3⁄4 »), le bas. Rend un fragment.
  const BARRE = "⁄";
  function texteFractions(texte) {
    const f = root.document.createDocumentFragment();
    // (La fraction et son unité ne se séparent pas en fin de ligne :
    // « 1⁄4 L » restent ensemble, comme un nombre et son unité.)
    const morceaux = String(texte).split(/(\d+⁄\d+(?:\u00a0[^\s\u00a0]+)?)/);
    morceaux.forEach(m => {
      const x = m.match(/^(\d+)⁄(\d+)(\u00a0[^\s\u00a0]+)?$/);
      if (!x) { if (m) f.appendChild(root.document.createTextNode(m)); return; }
      const s = root.document.createElement("span");
      s.className = "frac";
      const haut = root.document.createElement("span");
      haut.className = "fn";
      haut.textContent = x[1];
      const barre = root.document.createElement("span");
      barre.className = "fs";
      barre.textContent = BARRE;
      const bas = root.document.createElement("span");
      bas.className = "fd";
      bas.textContent = x[2];
      s.append(haut, barre, bas);
      if (x[3]) {
        const ensemble = root.document.createElement("span");
        ensemble.className = "frac-unite";
        ensemble.append(s, root.document.createTextNode(x[3]));
        f.appendChild(ensemble);
      } else f.appendChild(s);
    });
    return f;
  }
  function svg(tag, attributs, texte) {
    const e = root.document.createElementNS(SVG, tag);
    Object.keys(attributs || {}).forEach(k => e.setAttribute(k, attributs[k]));
    if (texte !== undefined) e.textContent = texte;
    return e;
  }
  // Des lignes de texte (« \n » coupe la ligne), sans HTML. Les espaces
  // des nombres, des unités et devant « : » passent par typo() (sinon « : »
  // pouvait commencer une ligne).
  function lignes(classe, texte) {
    const bloc = el("div", classe);
    String(texte).split("\n").forEach((ligne, i) => {
      ligne = carte().typo(ligne);
      if (i) bloc.appendChild(el("br"));
      bloc.appendChild(texteFractions(ligne));
    });
    return bloc;
  }

  // Lot A2 ter : « Suivant » sans avoir fait le geste de On te montre le
  // joue à la place de l'élève (Gwenaël, le 13/11 : « Est-ce que l'élève va
  // penser à toucher ? »). Chaque dessin à toucher rend sa fonction `jouer` :
  // elle refait les touchers un par un, à un rythme qu'on voit.
  function enChaine(un, encore, pas) {
    return () => {
      const suite = () => {
        if (!encore()) return;
        un();
        root.setTimeout(suite, pas);
      };
      suite();
    };
  }

  // ------------------------------------------- les petits dessins (lot 3b-2)
  // Ils remplacent les dernières émoticônes de l'appli (Gwenaël, 14/11 :
  // « de vrais dessins »). Dessinés à plat, comme la ceinture : contour
  // bleu marine, turquoise et orange de maths&go, du blanc ; un contour
  // épais pour qu'ils se lisent aussi imprimés en noir et blanc. Carré de
  // 48 : l'icône prend la taille du texte (1 em) là où était l'émoticône.
  const N = "#02306D";
  const TU = "#00AFAA";
  const OR2 = "#FA7D05";
  const BL = "#ffffff";
  const PALE = "#d8f3f1";
  const trait = (extra = {}) => Object.assign({stroke: N, "stroke-width": "2.4", "stroke-linejoin": "round", "stroke-linecap": "round"}, extra);
  const ICONES = {
    // la punaise du glisse-unité (l'unité de départ)
    punaise: [["g", {transform: "rotate(32 24 24)"}, [
      ["path", trait({d: "M24 28V45", fill: "none", "stroke-width": "3"})],
      ["path", trait({d: "M17.5 15h13l-2.5 9h-8z", fill: OR2})],
      ["rect", trait({x: "13", y: "6", width: "22", height: "9.5", rx: "4.75", fill: OR2})],
      ["rect", trait({x: "15", y: "23.5", width: "18", height: "5", rx: "2.5", fill: OR2})],
      ["rect", {x: "17", y: "8.4", width: "7", height: "2.6", rx: "1.3", fill: BL}]]]],
    // l'étape validée : une médaille, et des confettis
    fete: [["path", trait({d: "M17 27L11 44l6.5-2.5 3.5 5 4.5-15z", fill: TU})],
      ["path", trait({d: "M31 27l6 17-6.5-2.5-3.5 5-4.5-15z", fill: OR2})],
      ["circle", trait({cx: "24", cy: "20", r: "13", fill: BL})],
      ["circle", {cx: "24", cy: "20", r: "9", fill: TU}],
      ["path", {d: "M19.3 20.3l3.3 3.4 6.2-6.8", fill: "none", stroke: BL, "stroke-width": "3.4", "stroke-linecap": "round", "stroke-linejoin": "round"}],
      ["rect", trait({x: "3", y: "6", width: "5", height: "3", rx: "1", fill: OR2, "stroke-width": "1.4", transform: "rotate(-25 5.5 7.5)"})],
      ["rect", trait({x: "40", y: "5", width: "5", height: "3", rx: "1", fill: TU, "stroke-width": "1.4", transform: "rotate(30 42.5 6.5)"})],
      ["circle", trait({cx: "6", cy: "26", r: "2", fill: TU, "stroke-width": "1.4"})],
      ["circle", trait({cx: "42", cy: "25", r: "2", fill: OR2, "stroke-width": "1.4"})]],
    // « Tu connais déjà ? » : on monte marche par marche
    escalier: [["path", trait({d: "M4 43V35h10v-8h10v-8h10v-8h10v32z", fill: PALE})],
      ["path", {d: "M4 35h10M14 27h10M24 19h10M34 11h10", stroke: TU, "stroke-width": "3.2", "stroke-linecap": "round"}],
      ["path", trait({d: "M9 35V22", fill: "none"})],
      ["path", trait({d: "M9 22l9 3.2-9 3.3z", fill: OR2, "stroke-width": "1.8"})]],
    // Mon carnet
    carnet: [["rect", trait({x: "11", y: "5", width: "29", height: "38", rx: "3.5", fill: OR2})],
      ["rect", trait({x: "18", y: "12", width: "16", height: "10", rx: "1.8", fill: BL})],
      ["path", trait({d: "M21.5 15.6h9M21.5 18.6h6", fill: "none", "stroke-width": "1.7"})],
      ["path", trait({d: "M7 11h7M7 19h7M7 27h7M7 35h7", fill: "none"})]],
    // à toi d'écrire ; le cahier
    crayon: [["g", {transform: "rotate(-42 24 24)"}, [
      ["path", trait({d: "M11 19L2.5 24 11 29z", fill: "#f6dcb5"})],
      ["path", {d: "M5.3 22.4L2.5 24l2.8 1.6z", fill: N}],
      ["rect", trait({x: "11", y: "19", width: "24", height: "10", fill: OR2})],
      ["path", {d: "M11 24h24", stroke: "#c25a00", "stroke-width": "1.6"}],
      ["rect", trait({x: "35", y: "19", width: "4", height: "10", fill: BL})],
      ["rect", trait({x: "39", y: "19", width: "6", height: "10", rx: "2.5", fill: TU})]]]],
    // une étape (ou un palier) en préparation : le cône de chantier
    chantier: [["path", trait({d: "M19 8h10l7.5 30h-25z", fill: OR2})],
      ["path", {d: "M16.4 18.5h15.2l1.6 6.4H14.8z", fill: BL}],
      ["path", trait({d: "M19 8h10l7.5 30h-25z", fill: "none"})],
      ["rect", trait({x: "7", y: "38", width: "34", height: "5.5", rx: "2", fill: TU})]],
    // le professeur regarde une série
    oeil: [["path", trait({d: "M3 24Q24 4 45 24 24 44 3 24z", fill: BL})],
      ["circle", trait({cx: "24", cy: "24", r: "8.5", fill: TU})],
      ["circle", {cx: "24", cy: "24", r: "3.6", fill: N}],
      ["circle", {cx: "21.5", cy: "21.5", r: "1.6", fill: BL}]],
    // la récréation (15 min)
    cloche: [["circle", trait({cx: "24", cy: "6.5", r: "2.6", fill: OR2})],
      ["path", trait({d: "M24 9c-7.5 0-11.5 5.8-11.5 13v7L8 35.5h32L35.5 29v-7C35.5 14.8 31.5 9 24 9z", fill: OR2})],
      ["path", {d: "M17 22c0-4.5 2-8 5.5-9.3", fill: "none", stroke: BL, "stroke-width": "2.4", "stroke-linecap": "round"}],
      ["circle", trait({cx: "24", cy: "39.5", r: "3.6", fill: TU})]],
    // une journée
    soleil: [["path", trait({d: "M24 3v7M24 38v7M3 24h7M38 24h7M9.2 9.2l5 5M33.8 33.8l5 5M9.2 38.8l5-5M33.8 14.2l5-5", fill: "none", "stroke-width": "3"})],
      ["circle", trait({cx: "24", cy: "24", r: "10", fill: OR2})]],
    // ce qui est très léger
    plume: [["path", trait({d: "M41 5C25 7 13 18 12.5 36 30 34 40 21 41 5z", fill: TU})],
      ["path", trait({d: "M41 5L7 43", fill: "none"})],
      ["path", {d: "M33 14l-6-1.5M28.5 19.5l-7.5-1M24 25l-8 0", stroke: BL, "stroke-width": "2", "stroke-linecap": "round"}]],
    // mesurer une longueur
    regle: [["g", {transform: "rotate(-22 24 24)"}, [
      ["rect", trait({x: "2", y: "17", width: "44", height: "14", rx: "2.5", fill: "#fff3c4"})],
      ["path", trait({d: "M7 17v6M12.5 17v4M18 17v6M23.5 17v4M29 17v6M34.5 17v4M40 17v6", fill: "none", "stroke-width": "1.8"})]]]],
    // mesurer une masse
    balance: [["path", trait({d: "M24 11v27M8 14h32", fill: "none", "stroke-width": "2.8"})],
      ["path", trait({d: "M8 14L3.5 27M8 14l4.5 13M40 14l-4.5 13M40 14l4.5 13", fill: "none", "stroke-width": "1.6"})],
      ["path", trait({d: "M2 27h12.5a6.25 4.5 0 0 1-12.5 0z", fill: TU})],
      ["path", trait({d: "M33.5 27H46a6.25 4.5 0 0 1-12.5 0z", fill: TU})],
      ["circle", trait({cx: "24", cy: "10", r: "3", fill: OR2})],
      ["rect", trait({x: "14", y: "38", width: "20", height: "5.5", rx: "2.2", fill: OR2})]],
    // mesurer une contenance
    verreDoseur: [["path", trait({d: "M13.6 24.5h18.8l-1.2 17.5H14.8z", fill: TU, stroke: "none"})],
      ["path", trait({d: "M10 7h26l-2.6 35H12.6z", fill: "none"})],
      ["path", trait({d: "M36 13h3.5a3.5 3.5 0 0 1 3.5 3.5v9a3.5 3.5 0 0 1-3.5 3.5h-5", fill: "none", "stroke-width": "2.6"})],
      ["path", trait({d: "M13 14h6M13.3 20h4M13.6 26h6M14 32h4", fill: "none", "stroke-width": "1.7"})]],
    // mesurer une durée
    chrono: [["rect", trait({x: "20", y: "3.5", width: "8", height: "5", rx: "1.6", fill: OR2})],
      ["path", trait({d: "M24 8.5v4M36 13.5l3-3", fill: "none"})],
      ["circle", trait({cx: "24", cy: "28", r: "15.5", fill: BL})],
      ["path", trait({d: "M24 15.5v2.5M36.5 28H34M24 40.5V38M11.5 28H14", fill: "none", "stroke-width": "1.8"})],
      ["path", {d: "M24 28V18.5", stroke: OR2, "stroke-width": "3.2", "stroke-linecap": "round"}],
      ["circle", {cx: "24", cy: "28", r: "2.6", fill: N}]],
    // une aire (lot B3-1, R9) : une surface en carreaux, au modèle des
    // instruments de R2 (même trait, mêmes couleurs)
    aire: [["rect", trait({x: "7", y: "9", width: "34", height: "30", rx: "2", fill: BL})],
      ["rect", {x: "8.2", y: "10.2", width: "9", height: "7.8", fill: TU}], ["rect", {x: "19.5", y: "10.2", width: "9", height: "7.8", fill: TU}],
      ["rect", {x: "8.2", y: "20.2", width: "9", height: "7.8", fill: TU}],
      ["path", trait({d: "M18.3 9v30M29.6 9v30M7 19h34M7 29h34", fill: "none", "stroke-width": "1.6"})],
      ["rect", trait({x: "7", y: "9", width: "34", height: "30", rx: "2", fill: "none"})]],
    // à la prochaine séance
    calendrier: [["rect", trait({x: "6", y: "10", width: "36", height: "33", rx: "3.5", fill: BL})],
      ["path", trait({d: "M6 13.5A3.5 3.5 0 0 1 9.5 10h29a3.5 3.5 0 0 1 3.5 3.5V20H6z", fill: OR2})],
      ["path", trait({d: "M15 6v8M33 6v8", fill: "none", "stroke-width": "2.8"})],
      ["rect", {x: "12", y: "25", width: "6", height: "5", rx: "1", fill: TU}], ["rect", {x: "21", y: "25", width: "6", height: "5", rx: "1", fill: TU}],
      ["rect", {x: "30", y: "25", width: "6", height: "5", rx: "1", fill: TU}], ["rect", {x: "12", y: "33", width: "6", height: "5", rx: "1", fill: TU}],
      ["rect", trait({x: "21", y: "33", width: "6", height: "5", rx: "1", fill: OR2, "stroke-width": "1.6"})]]
  };
  function poserFormes(parent, formes) {
    formes.forEach(([tag, attributs, enfants]) => {
      const e = svg(tag, attributs);
      if (enfants) poserFormes(e, enfants);
      parent.appendChild(e);
    });
  }
  // icone("carnet") → un <svg class="ico"> de 1 em, décoratif (le texte à
  // côté dit ce qu'il montre).
  function icone(nom, classe = "") {
    const s = svg("svg", {viewBox: "0 0 48 48", class: `ico${classe ? ` ${classe}` : ""}`, "aria-hidden": "true", focusable: "false"});
    poserFormes(s, ICONES[nom] || []);
    return s;
  }
  // L'illustration d'un repère (lot 3b-2) : une boîte de taille fixe (la
  // zone se mesure avant que l'image soit chargée), l'image dedans, entière.
  function imageRepere(code, classe = "") {
    const r = carte().repere(code);
    const boite = el("span", `ill${classe ? ` ${classe}` : ""}`);
    if (!r || !r.image) return boite;
    const img = el("img");
    img.src = `./conversions-reperes/${r.image}`;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    boite.appendChild(img);
    return boite;
  }
  // Un visuel des listes de repères : un repère (« l3 ») ou un petit dessin
  // (« !regle »).
  function visuel(v, classe = "") {
    return String(v).startsWith("!") ? icone(String(v).slice(1), classe) : imageRepere(v, classe);
  }

  // ------------------------------------------------------ la carte d'un repère
  function carteRepere(code, {grande = false} = {}) {
    const r = carte().repere(code);
    const bloc = el("div", `carte-rep${grande ? " grande" : ""}`);
    bloc.appendChild(imageRepere(code));
    const t = el("div", "t");
    t.appendChild(el("small", "", r.objet));
    t.appendChild(root.document.createTextNode(r.valeur));
    // (Lot R1-noms, choix de Gwenaël du 21/11 : les dix repères de « Mes
    // premiers repères » disent le nom de leur unité, en bleu, sous la
    // mesure : « environ 1 cm » puis « un centimètre ».)
    if (r.lu) t.appendChild(el("span", "lu", r.lu));
    if (r.credit) t.appendChild(el("span", "credit", r.credit));
    bloc.appendChild(t);
    return bloc;
  }

  // ------------------------------------------------ la règle à lire (lot 3b-2)
  // Une règle de 10 cm dessinée en code, à l'échelle (31 unités par cm), et
  // un objet posé dessus de `debut` à `fin` (en cm). `marquer` : la
  // correction, la longueur de l'objet en vert sur la règle. Aucun nombre
  // dans l'objet : les nombres sont ceux de la règle.
  const CM = 31;
  const X0 = 15;
  function objetSurRegle(g, objet, xa, xb) {
    const y = 16;
    if (objet === "crayon") {
      poserFormes(g, [
        ["path", trait({d: `M${xa} ${y}L${xa + 11} ${y - 6.5}V${y + 6.5}z`, fill: "#f6dcb5", "stroke-width": "1.8"})],
        ["path", {d: `M${xa} ${y}l3.6-2.1v4.2z`, fill: N}],
        ["rect", trait({x: xa + 11, y: y - 6.5, width: xb - xa - 21, height: 13, fill: OR2, "stroke-width": "1.8"})],
        ["path", {d: `M${xa + 11} ${y}H${xb - 10}`, stroke: "#c25a00", "stroke-width": "1.4"}],
        ["rect", trait({x: xb - 10, y: y - 6.5, width: 3.5, height: 13, fill: BL, "stroke-width": "1.8"})],
        ["rect", trait({x: xb - 6.5, y: y - 6.5, width: 6.5, height: 13, rx: 2.5, fill: TU, "stroke-width": "1.8"})]]);
    } else if (objet === "gomme") {
      const m = (xa + xb) / 2;
      poserFormes(g, [["rect", trait({x: xa, y: y - 8, width: xb - xa, height: 16, rx: 3, fill: BL, "stroke-width": "1.8"})],
        ["path", trait({d: `M${m} ${y - 8}H${xb - 3}a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H${m}z`, fill: TU, "stroke-width": "1.8"})]]);
    } else if (objet === "trombone") {
      const w = xb - xa;
      poserFormes(g, [["path", trait({d: `M${xa + 0.9 * w} ${y - 3}H${xa + 6}a3.5 3.5 0 0 0 0 7H${xb - 5}a4.5 4.5 0 0 0 0-9H${xa + 4.5}a5.5 5.5 0 0 0 0 11H${xa + 0.75 * w}`,
        fill: "none", stroke: "#3d5a73", "stroke-width": "2.2"})]]);
    } else {
      poserFormes(g, [["rect", trait({x: xa, y: y - 8, width: 3.5, height: 16, rx: 1, fill: "#9fb3c4", "stroke-width": "1.6"})],
        ["path", trait({d: `M${xa + 3.5} ${y - 3}H${xb - 7}L${xb} ${y}L${xb - 7} ${y + 3}H${xa + 3.5}z`, fill: "#c9d6e2", "stroke-width": "1.6"})]]);
    }
  }
  function regle({objet, debut, fin, marquer = false, classe = "regle-q"}) {
    const s = svg("svg", {viewBox: "0 0 340 66", class: `dessin ${classe}`, role: "img",
      "aria-label": "Une règle graduée de 0 à 10 cm, et l'objet posé dessus"});
    const X = cm => X0 + cm * CM;
    s.appendChild(svg("rect", trait({x: 4, y: 29, width: 332, height: 34, rx: 3, fill: "#fff3c4", "stroke-width": "1.8"})));
    if (marquer) s.appendChild(svg("rect", {x: X(debut), y: 30, width: (fin - debut) * CM, height: 18, fill: "#bfe9cf"}));
    for (let mm = 0; mm <= 100; mm += 1) {
      const h = mm % 10 === 0 ? 12 : mm % 5 === 0 ? 8 : 5;
      const x = (X0 + (mm * CM) / 10).toFixed(1);
      s.appendChild(svg("line", {x1: x, y1: 29, x2: x, y2: 29 + h, stroke: N, "stroke-width": mm % 10 === 0 ? 1.6 : 0.9}));
    }
    for (let c = 0; c <= 10; c += 1) {
      const fort = marquer && (c === debut || c === fin);
      s.appendChild(svg("text", {x: X(c), y: 57, "text-anchor": "middle", "font-size": 12, "font-weight": fort ? 900 : 800, fill: fort ? "#0e7a36" : N}, String(c)));
    }
    // Deux pointillés : où l'objet commence et finit sur la règle.
    [debut, fin].forEach(c => s.appendChild(svg("line", {x1: X(c), y1: 4, x2: X(c), y2: 29, stroke: marquer ? "#0e7a36" : "#8ea1af", "stroke-width": 1.2, "stroke-dasharray": "2.5 2"})));
    const g = svg("g", {});
    objetSurRegle(g, objet, X(debut), X(fin));
    s.appendChild(g);
    return s;
  }
  // L'outil de la règle à lire : un centimètre, c'est un espace entre deux
  // grands traits (on ne compte pas les traits).
  function regleOutil(zone) {
    const s = svg("svg", {viewBox: "0 0 300 74", class: "dessin regle-outil", role: "img", "aria-label": "Une règle de 0 à 4 cm : 1 cm est l'espace entre deux grands traits"});
    const x = cm => 30 + cm * 60;
    s.appendChild(svg("rect", trait({x: 12, y: 34, width: 276, height: 36, rx: 3, fill: "#fff3c4", "stroke-width": "1.8"})));
    s.appendChild(svg("rect", {x: x(1), y: 35, width: 60, height: 16, fill: "#d8f3f1"}));
    for (let mm = 0; mm <= 40; mm += 1) {
      const h = mm % 10 === 0 ? 13 : mm % 5 === 0 ? 9 : 5;
      const xx = (30 + mm * 6).toFixed(1);
      s.appendChild(svg("line", {x1: xx, y1: 34, x2: xx, y2: 34 + h, stroke: N, "stroke-width": mm % 10 === 0 ? 1.6 : 0.9}));
    }
    for (let c = 0; c <= 4; c += 1) s.appendChild(svg("text", {x: x(c), y: 63, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: N}, String(c)));
    s.appendChild(svg("path", {d: `M${x(1)} 28v-6h60v6M${x(1) + 30} 22v-5`, fill: "none", stroke: TU, "stroke-width": 2.6, "stroke-linejoin": "round"}));
    s.appendChild(svg("text", {x: x(1) + 30, y: 13, "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: N}, `1${NB}cm`));
    zone.appendChild(s);
    zone.appendChild(el("div", "note", carte().typo("Je compte les espaces de 1 cm, pas les traits.")));
  }

  // ------------------------------------------- des barres qui s'ouvrent (mètre)
  // n barres de « 1 m » ; on touche chacune, elle s'ouvre en `facteur`
  // petits traits (« 100 cm »). `regrouper` : l'inverse, les paquets de
  // 100 cm se referment en 1 m.
  // `reste` (lot B2-1, C3 : « 3,5 m : trois mètres et un demi-mètre ») :
  // un morceau de plus, plus court, qui s'ouvre lui aussi (« 50 cm »).
  function barres(zone, aide, fini) {
    const r = aide.reste ? Number(String(aide.reste).replace(",", ".")) : 0;
    const n = aide.n + (r ? 1 : 0);
    const W = 340;
    const x0 = 10;
    const y0 = 36;
    const h = 40;
    // (Lot B2-1b : un petit morceau, « 0,15 m », garde au moins 48 de large
    // pour qu'on lise « 0,15 m » et qu'on le touche ; les mètres se
    // partagent le reste. Celui de C3, « 0,5 m », n'est pas changé.)
    const wr = r ? Math.max((W / (aide.n + r)) * r, 48) : 0;
    const pas = (W - wr) / aide.n;
    const largeur = i => (r && i === n - 1 ? wr : pas);
    const etat = Array(n).fill(Boolean(aide.regrouper));
    const boite = el("div", "barres");
    const dessin = svg("svg", {viewBox: "0 0 360 106", class: "metre", role: "img"});
    const somme = el("div", "somme");
    boite.appendChild(dessin);
    boite.appendChild(somme);
    zone.appendChild(boite);
    const G = gen();
    const reste = r ? G.milli(String(aide.reste)) : 0n;
    const grandeT = i => (r && i === n - 1 ? `${G.ecrire(reste)}${NB}${aide.grande}` : `1${NB}${aide.grande}`);
    const petiteT = i => `${G.ecrire((r && i === n - 1 ? reste : 1000n) * BigInt(aide.facteur))}${NB}${aide.petite}`;
    const total = r ? `${G.ecrire(BigInt(aide.n) * 1000n + reste)}${NB}${aide.grande}` : `${n}${NB}${aide.grande}`;
    function dessiner() {
      dessin.textContent = "";
      dessin.appendChild(svg("path", {d: `M${x0} 22 v-8 h${W} v8`, fill: "none", stroke: "#143451", "stroke-width": 2}));
      dessin.appendChild(svg("text", {x: x0 + W / 2, y: 10, "text-anchor": "middle", "font-size": 15, fill: "#143451"},
        aide.regrouper ? `${G.ecrire(BigInt(n * aide.facteur) * 1000n)}${NB}${aide.petite}` : total));
      for (let i = 0; i < n; i += 1) {
        const x = x0 + i * pas;
        const w = largeur(i);
        const g = svg("g", {class: "barre", tabindex: 0, role: "button", "data-i": i});
        // Lot 3b-3 bis : la zone à toucher (invisible) descend sous le paquet,
        // jusqu'à « touche-moi » : au téléphone, le paquet seul ne faisait
        // que 35 à 39 px de haut.
        g.appendChild(svg("rect", {x: x.toFixed(1), y: y0 - 8, width: w.toFixed(1), height: h + 30, fill: "transparent"}));
        if (etat[i]) {
          g.appendChild(svg("rect", {x: x.toFixed(1), y: y0, width: w.toFixed(1), height: h, fill: "#eef5fd", stroke: "#0755b8", "stroke-width": 2.5}));
          const traits = Math.round(Math.min(aide.facteur, 100) * (r && i === n - 1 ? r : 1));
          for (let k = 1; k < traits; k += 1) {
            const xx = x + (w * k) / traits;
            const lg = k % 10 === 0 ? 16 : k % 5 === 0 ? 11 : 7;
            g.appendChild(svg("line", {x1: xx.toFixed(2), y1: y0 + h, x2: xx.toFixed(2), y2: y0 + h - lg, stroke: "#0755b8", "stroke-width": k % 10 === 0 ? 1.4 : 0.7}));
          }
          g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + 17, "text-anchor": "middle", "font-size": aide.n > 3 ? 11 : w < 56 && grandeT(i).length > 5 ? 11.5 : 13, fill: "#143451"}, grandeT(i)));
          g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + h + 22, "text-anchor": "middle", "font-size": aide.n > 3 ? 11 : 15, fill: "#0755b8"}, petiteT(i)));
        } else {
          g.appendChild(svg("rect", {x: x.toFixed(1), y: y0, width: w.toFixed(1), height: h, fill: "#fff", stroke: "#143451", "stroke-width": 2.5}));
          g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + 26, "text-anchor": "middle", "font-size": w < 56 && grandeT(i).length > 5 ? 11.5 : w < 70 ? 13 : aide.n > 3 ? 13 : 16, fill: "#143451"}, grandeT(i)));
          // (Lot B2-1 : sous le petit morceau, « touche » seulement : « touche-moi »
          // chevauchait celui d'à côté.)
          if (!aide.regrouper) g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + h + 22, "text-anchor": "middle", "font-size": 12, fill: "#8ea1af"}, w < 70 ? "touche" : "touche-moi"));
        }
        dessin.appendChild(g);
      }
      const faits = aide.regrouper ? etat.filter(x => !x).length : etat.filter(Boolean).length;
      somme.textContent = "";
      if (faits) {
        const texte = aide.regrouper ? `${faits} × ${petiteT(0)} = ${faits}${NB}${aide.grande}`
          : etat.map((x, i) => (x ? petiteT(i) : null)).filter(Boolean).join(" + ");
        somme.appendChild(el("span", "", texte));
      }
    }
    function toucher(i) {
      if (etat[i] === !aide.regrouper) return;
      etat[i] = !aide.regrouper;
      dessiner();
      if (etat.every(x => x === !aide.regrouper)) fini();
    }
    dessin.addEventListener("click", ev => {
      const g = ev.target.closest && ev.target.closest(".barre");
      if (g) toucher(Number(g.getAttribute("data-i")));
    });
    dessin.addEventListener("keydown", ev => {
      const g = ev.target.closest && ev.target.closest(".barre");
      if (g && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); toucher(Number(g.getAttribute("data-i"))); }
    });
    dessiner();
    return enChaine(() => toucher(etat.findIndex(x => x !== !aide.regrouper)), () => etat.some(x => x !== !aide.regrouper), 380);
  }

  // --------------------------------- les fractions usuelles (lot B2-2a, C6)
  // Choix de Gwenaël du 18/11, sur maquette : l'outil de « À toi », la
  // double droite graduée ; l'image, la barre partagée ; la correction, la
  // double droite complétée.
  const BLEU = "#0755b8";
  const VERT = "#147447";
  const ROUGE = "#a93030";
  const GRIS = "#8ea1af";
  const ENCRE = "#143451";
  // Une fraction en colonne dans un dessin, centrée sur x ; y : la barre.
  // `entier` : un nombre devant (« 1 » et « 1⁄2 » pour un et demi).
  function fracDessin(g, x, y, n, d, {taille = 13, couleur = ENCRE, entier = 0} = {}) {
    const ecrit = (xx, yy, t, tl = taille) => g.appendChild(svg("text", {x: xx.toFixed(1), y: yy.toFixed(1), "text-anchor": "middle", "font-size": tl, "font-weight": 900, fill: couleur}, t));
    if (d === 1 || n === 0) { ecrit(x, y + taille * 0.38, String(n + entier * d), taille + 2); return; }
    const l = Math.max(String(n).length, String(d).length) * taille * 0.62 + 4;
    const xf = entier ? x + taille * 0.45 : x;
    if (entier) ecrit(x - l / 2 - taille * 0.2, y + taille * 0.38, String(entier), taille + 2);
    ecrit(xf, y - 3, String(n));
    g.appendChild(svg("line", {x1: (xf - l / 2).toFixed(1), y1: y, x2: (xf + l / 2).toFixed(1), y2: y, stroke: couleur, "stroke-width": 1.6}));
    ecrit(xf, y + taille - 1, String(d));
  }
  function pgcd(a, b) {
    return b ? pgcd(b, a % b) : a;
  }
  // La double droite graduée. aide : {haut (l'unité de la fraction), bas
  // (l'unité de la réponse), parts (par unité), valeur (1 haut en bas),
  // cherche (la graduation demandée), tout (le nombre d'unités), partie
  // (« 75 cL = … L » : la fraction est cherchée, la valeur donnée)}.
  // mode : "outil" (en bas : 0 et les unités entières, « ? » à la
  // graduation demandée ; en haut : les fractions, toutes s'il y en a 4 au
  // plus) ; "correction" (tout écrit, la graduation demandée en vert) ;
  // "montre" (On te montre : chaque toucher écrit une graduation de plus,
  // jusqu'à la graduation demandée).
  function doubleDroite(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const G = gen();
    const parts = Number(aide.parts);
    const tout = Number(aide.tout || 1);
    const ticks = parts * tout;
    const cherche = Number(aide.cherche);
    // `debut` (un litre et demi, quatre kilomètres et demi) : la droite
    // commence à l'unité entière d'avant (4 km = 4 000 m), pas à 0.
    const debut = Number(aide.debut || 0);
    const unite = G.milli(String(aide.valeur));
    const valeurDe = k => G.ecrire((unite * BigInt(k + debut * parts)) / BigInt(parts));
    const x0 = 22;
    const x1 = 284;
    const yH = 44;
    const yB = 82;
    const X = k => x0 + ((x1 - x0) * k) / ticks;
    const boite = el("div", "dessin-boite droite2-boite");
    const dessin = svg("svg", {viewBox: "0 0 340 116", class: `dessin droite2${mode === "montre" ? " a-toucher" : ""}`, role: "img",
      "aria-label": "La double droite graduée"});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let vus = mode === "montre" ? 0 : cherche;
    function dessiner() {
      dessin.textContent = "";
      if (mode === "montre") dessin.appendChild(svg("rect", {x: 0, y: 0, width: 340, height: 116, fill: "transparent"}));
      [yH, yB].forEach(y => {
        dessin.appendChild(svg("line", {x1: x0, y1: y, x2: x1 + 14, y2: y, stroke: ENCRE, "stroke-width": 2.4}));
        dessin.appendChild(svg("path", {d: `M${x1 + 16} ${y} l-8 -5 v10 Z`, fill: ENCRE}));
      });
      dessin.appendChild(svg("text", {x: x1 + 22, y: yH + 5, "font-size": 15, "font-weight": 900, fill: ENCRE}, aide.haut));
      dessin.appendChild(svg("text", {x: x1 + 22, y: yB + 5, "font-size": 15, "font-weight": 900, fill: ENCRE}, aide.bas));
      const fin = mode === "montre" ? vus >= cherche : mode === "correction";
      const ici = fin ? VERT : BLEU;
      for (let k = 0; k <= ticks; k += 1) {
        const x = X(k);
        const entier = k % parts === 0;
        const marque = k === cherche;
        [yH, yB].forEach(y => dessin.appendChild(svg("line", {x1: x, y1: y - (entier ? 8 : 6), x2: x, y2: y + (entier ? 8 : 6),
          stroke: marque ? ici : ENCRE, "stroke-width": entier || marque ? 2.4 : 1.6})));
        // En haut : les fractions de l'unité.
        const petite = ticks > 4 || tout > 1;
        const ecrireHaut = entier || (marque && !aide.partie) || (!aide.partie && !petite) || (mode === "correction" && !petite);
        if (marque && aide.partie && mode !== "correction") {
          dessin.appendChild(svg("text", {x, y: yH - 16, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: ROUGE}, "?"));
        } else if (ecrireHaut) {
          const e = Math.floor(k / parts) + debut;
          const r = k % parts;
          // (Deux quarts s'écrivent 1⁄2 ; les dixièmes restent des dixièmes.)
          const p = r && parts === 4 ? pgcd(r, parts) : 1;
          fracDessin(dessin, x, yH - 23, r ? r / p : 0, r ? parts / p : 1, {taille: ticks >= 10 ? 11 : 12.5, couleur: marque ? (mode === "correction" ? VERT : BLEU) : ENCRE, entier: e});
        }
        // En bas : les valeurs.
        let texte = null;
        let couleur = ENCRE;
        if (entier) texte = valeurDe(k);
        else if (marque) {
          if (aide.partie || fin) { texte = valeurDe(k); couleur = aide.partie && !fin ? BLEU : VERT; }
          else { texte = "?"; couleur = ROUGE; }
        } else if (mode === "correction" && ticks <= 4) { texte = valeurDe(k); couleur = GRIS; }
        else if (mode === "montre" && k <= vus) { texte = valeurDe(k); couleur = BLEU; }
        if (texte !== null) dessin.appendChild(svg("text", {x, y: yB + 24, "text-anchor": "middle", "font-size": marque ? 16 : ticks >= 10 ? 12 : 14, "font-weight": 900, fill: couleur}, texte));
      }
      const xc = X(cherche);
      dessin.appendChild(svg("line", {x1: xc, y1: yH + 8, x2: xc, y2: yB - 8, stroke: ici, "stroke-width": 2, "stroke-dasharray": "4 3"}));
    }
    dessiner();
    if (mode !== "montre") return null;
    const note = el("div", "note", "touche la droite");
    boite.appendChild(note);
    const toucher = () => {
      if (vus >= cherche) return;
      vus += 1;
      dessiner();
      if (vus >= cherche) { note.remove(); fini(); }
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => vus < cherche, 450);
  }
  // La barre partagée : l'unité entière (« 1 L = 100 cL »), coupée en
  // `parts`, les `colorees` premières en bleu, l'accolade et la fraction
  // dessous. `touche` (On te montre) : la barre entière d'abord ; un
  // toucher la partage, chaque part dit sa valeur (« 25 cL »).
  function barrePartagee(zone, aide, {touche = false, fini = () => {}} = {}) {
    const G = gen();
    const parts = Number(aide.parts);
    const colorees = Number(aide.colorees || 0);
    const unite = G.milli(String(aide.valeur));
    const x0 = 16;
    const x1 = 324;
    const y0 = 30;
    const h = 38;
    const boite = el("div", "dessin-boite barre2-boite");
    const dessin = svg("svg", {viewBox: `0 0 340 ${colorees ? 124 : 76}`, class: `dessin barre2${touche ? " a-toucher" : ""}`, role: "img", "aria-label": "La barre partagée"});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let coupee = !touche;
    function dessiner() {
      dessin.textContent = "";
      if (touche) dessin.appendChild(svg("rect", {x: 0, y: 0, width: 340, height: 124, fill: "transparent"}));
      dessin.appendChild(svg("path", {d: `M${x0} 22 v-7 h${x1 - x0} v7`, fill: "none", stroke: ENCRE, "stroke-width": 2}));
      dessin.appendChild(svg("text", {x: (x0 + x1) / 2, y: 11, "text-anchor": "middle", "font-size": 14.5, "font-weight": 900, fill: ENCRE},
        `1${NB}${aide.haut} = ${G.ecrire(unite)}${NB}${aide.bas}`));
      const n = coupee ? parts : 1;
      const pas = (x1 - x0) / n;
      for (let k = 0; k < n; k += 1) {
        const x = x0 + k * pas;
        const pleine = coupee && k < colorees;
        dessin.appendChild(svg("rect", {x: x.toFixed(1), y: y0, width: pas.toFixed(1), height: h, fill: pleine ? "#cfe2fb" : "#fff", stroke: BLEU, "stroke-width": 2.4}));
        if (!coupee) {
          dessin.appendChild(svg("text", {x: x + pas / 2, y: y0 + h / 2 + 6, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: ENCRE}, `1${NB}${aide.haut}`));
          dessin.appendChild(svg("text", {x: x + pas / 2, y: y0 + h + 22, "text-anchor": "middle", "font-size": 12, fill: GRIS}, "touche-moi"));
        } else if (touche) {
          dessin.appendChild(svg("text", {x: x + pas / 2, y: y0 + h / 2 + 5, "text-anchor": "middle", "font-size": parts >= 10 ? 10.5 : 14, "font-weight": 900, fill: BLEU},
            `${G.ecrire(unite / BigInt(parts))}${NB}${aide.bas}`));
        } else {
          const gr = svg("g", {});
          const dix = parts >= 10;
          fracDessin(gr, x + pas / 2 - (dix ? 0 : 7), y0 + h / 2, 1, parts, {taille: dix ? 9.5 : 11.5, couleur: BLEU});
          if (!dix) gr.appendChild(svg("text", {x: x + pas / 2 + 9, y: y0 + h / 2 + 5, "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: BLEU}, aide.haut));
          dessin.appendChild(gr);
        }
      }
      if (coupee && colorees) {
        const xb = x0 + colorees * pas;
        const y = y0 + h + 8;
        dessin.appendChild(svg("path", {d: `M${x0 + 1} ${y} v7 h${(xb - x0 - 2).toFixed(1)} v-7`, fill: "none", stroke: BLEU, "stroke-width": 2}));
        const p = parts === 4 ? pgcd(colorees, parts) : 1;
        const xm = (x0 + xb) / 2;
        fracDessin(dessin, xm - 9, y + 30, colorees / p, parts / p, {taille: 13.5, couleur: BLEU});
        dessin.appendChild(svg("text", {x: xm + 11, y: y + 35, "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: BLEU}, aide.haut));
      }
    }
    dessiner();
    if (!touche) return null;
    const toucher = () => {
      if (coupee) return;
      coupee = true;
      dessin.setAttribute("viewBox", "0 0 340 124");
      dessiner();
      fini();
    };
    dessin.setAttribute("viewBox", "0 0 340 124");
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return toucher;
  }

  // ------------------------------------------------------- le verre doseur
  // Un verre doseur de 1 L, plein. On le touche : ses traits apparaissent,
  // de 10 en 10 cL (petits traits de 5 cL), et le trait du haut dit
  // « 100 cL » — à la hauteur de l'eau, qui dit « 1 L » (audit du 12/11 :
  // le litre ne se montre pas sur une règle).
  function verre(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 300 214", class: "dessin verre", role: "img", tabindex: 0,
      "aria-label": `Un verre doseur de 1${NB}L`});
    const etat = {gradue: false};
    boite.appendChild(dessin);
    zone.appendChild(boite);
    const haut = 34;
    const bas = 196;
    const yDe = cl => bas - ((bas - haut) * cl) / aide.facteur;
    // Les bords du verre (un peu plus large en haut), x en fonction de y.
    const gauche = y => 96 - ((bas - y) * 10) / (bas - haut);
    const droite = y => 204 + ((bas - y) * 10) / (bas - haut);
    function dessiner() {
      dessin.textContent = "";
      const yEau = yDe(aide.facteur);
      dessin.appendChild(svg("path", {d: `M${gauche(yEau)} ${yEau} L${droite(yEau)} ${yEau} L${droite(bas)} ${bas} L${gauche(bas)} ${bas} Z`, fill: "#cfe2fb"}));
      // l'anse
      dessin.appendChild(svg("path", {d: `M${droite(70)} 62 C 262 62 262 150 ${droite(150)} 150`, fill: "none", stroke: "#143451", "stroke-width": 7, "stroke-linecap": "round"}));
      // le verre, ouvert en haut, avec son bec
      dessin.appendChild(svg("path", {d: `M${gauche(haut) - 10} ${haut - 14} L${gauche(haut)} ${haut - 6} L${gauche(bas)} ${bas} L${droite(bas)} ${bas} L${droite(haut)} ${haut - 6}`,
        fill: "none", stroke: "#143451", "stroke-width": 3, "stroke-linejoin": "round"}));
      if (!etat.gradue) {
        dessin.appendChild(svg("text", {x: 150, y: 128, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#0755b8"}, `1${NB}${aide.grande}`));
        dessin.appendChild(svg("text", {x: 150, y: 210, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#8ea1af"}, "touche-moi"));
        return;
      }
      for (let cl = 5; cl <= aide.facteur; cl += 5) {
        const y = yDe(cl);
        const long = cl % 10 === 0;
        const x0 = gauche(y);
        dessin.appendChild(svg("line", {x1: x0, y1: y, x2: x0 + (long ? 30 : 16), y2: y, stroke: "#143451", "stroke-width": long ? 2 : 1.2}));
        if (long) {
          const dernier = cl === aide.facteur;
          dessin.appendChild(svg("text", {x: x0 + 35, y: y + 4.5, "font-size": dernier ? 15 : 12.5, "font-weight": dernier ? 900 : 700,
            fill: dernier ? "#0755b8" : "#143451"}, dernier ? `${cl}${NB}${aide.petite}` : String(cl)));
        }
      }
      dessin.appendChild(svg("text", {x: droite(yDe(aide.facteur)) - 8, y: yDe(aide.facteur) + 22, "text-anchor": "end", "font-size": 17, "font-weight": 900, fill: "#0755b8"}, `1${NB}${aide.grande}`));
    }
    const toucher = () => {
      if (etat.gradue) return;
      etat.gradue = true;
      dessiner();
      fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    dessiner();
    return toucher;
  }

  // ------------------------------------------------------------- la balance
  // Une balance à deux plateaux : à gauche un paquet de riz de 1 kg ; on
  // touche le plateau de droite, une tablette de chocolat de 100 g s'y pose
  // à chaque fois. À la 10e, la balance est d'aplomb : 1 kg = 1 000 g.
  function balance(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 330 206", class: "dessin balance", role: "img", tabindex: 0,
      "aria-label": "Une balance à deux plateaux"});
    const somme = el("div", "somme");
    boite.appendChild(dessin);
    boite.appendChild(somme);
    zone.appendChild(boite);
    const total = aide.nombre || 10;
    let poses = 0;
    function dessiner() {
      dessin.textContent = "";
      const cx = 165;
      const py = 58;
      const demi = 112;
      // L'angle : penché du côté du riz, d'aplomb quand c'est égal.
      const angle = (14 * (total - poses)) / total * Math.PI / 180;
      const xg = cx - demi * Math.cos(angle);
      const yg = py + demi * Math.sin(angle);
      const xd = cx + demi * Math.cos(angle);
      const yd = py - demi * Math.sin(angle);
      // le pied
      dessin.appendChild(svg("path", {d: `M${cx} ${py} L${cx} 186 M${cx - 46} 192 L${cx + 46} 192`, stroke: "#143451", "stroke-width": 6, "stroke-linecap": "round"}));
      dessin.appendChild(svg("line", {x1: xg, y1: yg, x2: xd, y2: yd, stroke: "#143451", "stroke-width": 6, "stroke-linecap": "round"}));
      dessin.appendChild(svg("circle", {cx, cy: py, r: 6, fill: "#f2c94c", stroke: "#143451", "stroke-width": 2}));
      const plateau = (x, y, cote) => {
        const yp = y + 62;
        dessin.appendChild(svg("path", {d: `M${x} ${y} L${x - 38} ${yp} M${x} ${y} L${x + 38} ${yp}`, stroke: "#8ea1af", "stroke-width": 1.5}));
        dessin.appendChild(svg("path", {d: `M${x - 52} ${yp} L${x + 52} ${yp} L${x + 40} ${yp + 9} L${x - 40} ${yp + 9} Z`,
          fill: "#e9eef3", stroke: "#143451", "stroke-width": 2.5, "stroke-linejoin": "round", class: cote === "d" ? "plateau-d" : ""}));
        return yp;
      };
      const ypg = plateau(xg, yg, "g");
      const ypd = plateau(xd, yd, "d");
      // le paquet de riz
      dessin.appendChild(svg("rect", {x: xg - 30, y: ypg - 50, width: 60, height: 50, rx: 4, fill: "#fff", stroke: "#143451", "stroke-width": 2.5}));
      dessin.appendChild(svg("text", {x: xg, y: ypg - 30, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "#143451"}, "riz"));
      dessin.appendChild(svg("text", {x: xg, y: ypg - 11, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: "#0755b8"}, `1${NB}kg`));
      // les tablettes, en deux piles de 5
      for (let k = 0; k < poses; k += 1) {
        const col = k % 2;
        const rang = Math.floor(k / 2);
        dessin.appendChild(svg("rect", {x: xd - 40 + col * 41, y: ypd - 10 - rang * 10, width: 38, height: 9, rx: 1.5,
          fill: "#a93030", stroke: "#143451", "stroke-width": 1}));
      }
      // (Lot B1-2 : `hg`, la tablette de 100 g est aussi 1 hg : 1 kg = 10 hg.)
      dessin.appendChild(svg("text", {x: 250, y: 16, "text-anchor": "middle", "font-size": 12.5, "font-weight": 800, fill: "#143451"},
        aide.hg ? `1 tablette = 1${NB}hg = 100${NB}g` : `1 tablette = 100${NB}g`));
      if (!poses) dessin.appendChild(svg("text", {x: xd, y: ypd + 26, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#8ea1af"}, "touche-moi"));
      somme.textContent = "";
      if (poses && aide.hg) somme.appendChild(el("span", "", carte().typo(poses === 1 ? "1 tablette : 1 hg" : `${poses} tablettes : ${poses} hg`)));
      else if (poses) somme.appendChild(el("span", "", poses === 1 ? `1 tablette : 100${NB}g` : carte().typo(`${poses} tablettes : ${poses * 100} g`)));
    }
    const toucher = () => {
      if (poses >= total) return;
      poses += 1;
      dessiner();
      if (poses === total) fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    dessiner();
    return enChaine(toucher, () => poses < total, 260);
  }

  // -------------------------------------------------------------- l'horloge
  // Une horloge à aiguilles qui part de 8 h. À chaque toucher, la grande
  // aiguille avance de `pas` minutes ; le chemin parcouru se colorie. Elle
  // s'arrête à `fin` minutes (60 : un tour complet, la petite aiguille est
  // passée de 8 à 9).
  function horloge(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 300 224", class: "dessin horloge", role: "img", tabindex: 0,
      "aria-label": "Une horloge à aiguilles"});
    const somme = el("div", "somme");
    boite.appendChild(dessin);
    boite.appendChild(somme);
    zone.appendChild(boite);
    const pas = aide.pas || 15;
    const fin = aide.fin || 60;
    const cx = 150;
    const cy = 112;
    const R = 76;
    let minutes = 0;
    const point = (angle, r) => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
    function dessiner() {
      dessin.textContent = "";
      dessin.appendChild(svg("circle", {cx, cy, r: R, fill: "#fff", stroke: "#143451", "stroke-width": 4}));
      if (minutes) {
        const a = (2 * Math.PI * minutes) / 60;
        if (minutes >= 60) dessin.appendChild(svg("circle", {cx, cy, r: R - 4, fill: "#cfe2fb"}));
        else {
          const [x, y] = point(a, R - 4);
          dessin.appendChild(svg("path", {d: `M${cx} ${cy} L${cx} ${cy - R + 4} A${R - 4} ${R - 4} 0 ${minutes > 30 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`, fill: "#cfe2fb"}));
        }
      }
      for (let m = 0; m < 60; m += 1) {
        const a = (2 * Math.PI * m) / 60;
        const [x1, y1] = point(a, R - 3);
        const [x2, y2] = point(a, m % 5 === 0 ? R - 13 : R - 8);
        dessin.appendChild(svg("line", {x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), stroke: "#143451", "stroke-width": m % 5 === 0 ? 2.4 : 1}));
      }
      for (let h = 1; h <= 12; h += 1) {
        const [x, y] = point((2 * Math.PI * h) / 12, R - 25);
        dessin.appendChild(svg("text", {x: x.toFixed(1), y: (y + 6).toFixed(1), "text-anchor": "middle", "font-size": 17, "font-weight": 800, fill: "#143451"}, String(h)));
      }
      // les minutes parcourues, de quart d'heure en quart d'heure (lot
      // 3b-3 : plus grandes, elles faisaient 7 px au téléphone)
      for (let m = 15; m <= minutes; m += 15) {
        const [x, y] = point((2 * Math.PI * m) / 60, m % 30 === 0 ? R + 26 : R + 32);
        dessin.appendChild(svg("text", {x: x.toFixed(1), y: (y + 6.5).toFixed(1), "text-anchor": "middle", "font-size": 18, "font-weight": 900, fill: "#0755b8"}, `${m}${NB}min`));
      }
      // la petite aiguille (8 h, puis elle avance) et la grande
      const [hx, hy] = point((2 * Math.PI * (8 + minutes / 60)) / 12, R - 40);
      dessin.appendChild(svg("line", {x1: cx, y1: cy, x2: hx.toFixed(2), y2: hy.toFixed(2), stroke: "#143451", "stroke-width": 7, "stroke-linecap": "round"}));
      const [mx, my] = point((2 * Math.PI * minutes) / 60, R - 14);
      dessin.appendChild(svg("line", {x1: cx, y1: cy, x2: mx.toFixed(2), y2: my.toFixed(2), stroke: "#0755b8", "stroke-width": 4.5, "stroke-linecap": "round"}));
      dessin.appendChild(svg("circle", {cx, cy, r: 6, fill: "#143451"}));
      if (!minutes) dessin.appendChild(svg("text", {x: cx, y: 220, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#8ea1af"}, "touche-moi"));
      somme.textContent = "";
      if (minutes) {
        const morceaux = Array(minutes / pas).fill(`${pas}${NB}min`);
        somme.appendChild(el("span", "", morceaux.length > 1 ? morceaux.join(" + ") : `La grande aiguille a avancé de ${pas}${NB}min.`));
      }
    }
    const toucher = () => {
      if (minutes >= fin) return;
      minutes += pas;
      dessiner();
      if (minutes >= fin) fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    dessiner();
    return enChaine(toucher, () => minutes < fin, 520);
  }

  // ------------------------------------------------- les paquets (l'image)
  // L'image de « À toi » pour une conversion simple : n paquets dessinés,
  // chacun avec ce qu'il vaut dans les deux unités (« 1 m » dedans,
  // « 100 cm » dessous). On les compte d'un coup d'œil (9 au plus).
  function paquets(zone, {n, dans, sous}) {
    const W = 330;
    const ecart = 4;
    const w = Math.min(64, (W - ecart * (n - 1)) / n);
    const x0 = (W - (w * n + ecart * (n - 1))) / 2;
    const petit = w < 40;
    const dessin = svg("svg", {viewBox: `0 0 ${W} 62`, class: "dessin paquets", role: "img", "aria-label": `${n} paquets`});
    for (let i = 0; i < n; i += 1) {
      const x = x0 + i * (w + ecart);
      dessin.appendChild(svg("rect", {x: x.toFixed(1), y: 4, width: w.toFixed(1), height: 30, rx: 3, fill: "#eef5fd", stroke: "#0755b8", "stroke-width": 2}));
      dessin.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: 24, "text-anchor": "middle", "font-size": petit ? 11 : 13, "font-weight": 900, fill: "#143451"}, dans));
      dessin.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: 52, "text-anchor": "middle", "font-size": petit ? 10 : 12.5, "font-weight": 900, fill: "#0755b8"}, sous));
    }
    zone.appendChild(dessin);
  }

  // ----------------------------------------------------------- la barre de l'heure
  // `heures` barres d'une heure ; la première coupée en `parts` (4 quarts de
  // 15 min, 2 moitiés) ; `verte` : une seule part verte ; `compte` : une
  // accolade qui compte des parts (« 3 parts : 3 × 15 min = 45 min ») ;
  // `plus` : des minutes après les heures. Interactif si `touche`.
  // `total` : la ligne « 80 min en tout » (jamais dans l'outil de « À toi » :
  // ce serait la réponse).
  function barreHeure(zone, {heures = 1, parts = 4, verte = false, compte = 0, plus = 0, touche = false, total: avecTotal = true}, fini) {
    const boite = el("div", "heure");
    zone.appendChild(boite);
    let coupee = !touche;
    let jouer = null;
    function dessiner() {
      boite.textContent = "";
      const total = heures * 60 + plus;
      const ligne = el("div", "heure-ligne");
      for (let i = 0; i < heures; i += 1) {
        const b = el("div", "heure-bloc");
        b.style.flex = "60";
        b.appendChild(el("div", "heure-tout", `1${NB}h = 60${NB}min`));
        const bas = el("div", "heure-parts");
        if (i === 0 && coupee && parts > 1) {
          for (let k = 0; k < parts; k += 1) bas.appendChild(el("div", `heure-part${verte && k === 0 ? " verte" : ""}`, `${60 / parts}${NB}min`));
        } else bas.appendChild(el("div", "heure-part", `60${NB}min`));
        b.appendChild(bas);
        ligne.appendChild(b);
      }
      if (plus) {
        const b = el("div", "heure-bloc plus");
        b.style.flex = String(Math.max(plus, 22));
        b.appendChild(el("div", "heure-tout vide", ""));
        const bas = el("div", "heure-parts");
        bas.appendChild(el("div", "heure-part", `${plus}${NB}min`));
        b.appendChild(bas);
        ligne.appendChild(b);
      }
      boite.appendChild(ligne);
      if (compte && coupee) {
        const acc = el("div", "accolade");
        acc.style.width = `${(100 * compte) / parts / (heures + plus / 60)}%`;
        boite.appendChild(acc);
        // Le nom des parts seulement : le calcul est écrit dessous.
        boite.appendChild(el("div", "accolade-texte", parts === 4 ? `${compte} quarts d'heure` : `${compte} parts`));
      } else if (avecTotal && (heures > 1 || plus)) {
        boite.appendChild(el("div", "heure-total", `${total}${NB}min en tout`));
      }
      if (touche && !coupee) {
        const b = boite.querySelector(".heure-bloc");
        b.classList.add("a-toucher");
        b.setAttribute("role", "button");
        b.tabIndex = 0;
        boite.appendChild(el("div", "note", "touche la barre"));
        const couper = () => { if (coupee) return; coupee = true; dessiner(); fini(); };
        jouer = couper;
        b.addEventListener("click", couper);
        b.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); couper(); } });
      }
    }
    dessiner();
    return () => { if (jouer) jouer(); };
  }

  // ----------------------------------------------------------- le schéma en barres
  // tout : le texte du haut ; parts : les textes du bas ; poids : leurs
  // largeurs ; cherchee : la part qui porte « ? » (-1 : c'est le tout).
  // (Lot B2-3b-1, Q2 : `verteTout`, la réponse en vert dans le tout.)
  function schema(zone, {tout, parts, poids, verte = -1, verteTout = false}) {
    const boite = el("div", "schema");
    boite.appendChild(el("div", `schema-tout${verteTout ? " verte" : ""}`, tout));
    const bas = el("div", "schema-parts");
    const somme = poids.reduce((a, b) => a + b, 0);
    parts.forEach((texte, i) => {
      const p = el("div", `schema-part${i === verte ? " verte" : ""}`, texte);
      p.style.flex = String(Math.max(poids[i] / somme, 0.24));
      bas.appendChild(p);
    });
    boite.appendChild(bas);
    zone.appendChild(boite);
    return boite;
  }

  // Lot B2-3b-1 (Q2, choix de Gwenaël du 20/11 : « deux barres collées ») :
  // comparer. Une barre par nom, l'une sur l'autre ; l'écart en pointillé
  // au bout de la plus courte (comme le schéma de S002, Léo et Lucie).
  // `total` : une ligne sous les barres (« Ensemble : ? km ») ; `verte` :
  // 0 (haut), 1 (bas), « ecart » ou « total », la réponse en vert.
  function deuxBarres(zone, {haut, bas, ecart, total = "", verte = null}) {
    const g = el("div", "schema2");
    const ligne = (nom, texte, avecEcart, k) => {
      g.appendChild(el("div", "nom", nom));
      const b = el("div", "barre");
      const x = el("div", `b${verte === k ? " verte" : ""}`, texte);
      x.style.flex = avecEcart ? "0.7" : "1";
      b.appendChild(x);
      if (avecEcart) {
        const e = el("div", `b ecart${verte === "ecart" ? " verte" : ""}`, ecart);
        e.style.flex = "0.3";
        b.appendChild(e);
      }
      g.appendChild(b);
    };
    ligne(haut[0], haut[1], false, 0);
    ligne(bas[0], bas[1], true, 1);
    if (total) g.appendChild(el("div", `total${verte === "total" ? " verte" : ""}`, total));
    zone.appendChild(g);
    return g;
  }

  // Lot B2-3b-1 (Q2, choix de Gwenaël du 20/11) : le dessin dans la
  // question. La balance en équilibre (n boîtes « ? » et un poids d'un
  // côté, un poids de l'autre) ; le rectangle (la longueur dessous, la
  // largeur à droite, un angle droit marqué).
  function figurePb(fig) {
    if (fig.type === "graphe") return grapheQ9(fig);
    if (fig.type === "rectangle") {
      const s = svg("svg", {viewBox: "0 0 212 92", class: "dessin pb-rect", role: "img",
        "aria-label": `Un rectangle de ${fig.longueur} sur ${fig.largeur}`});
      s.appendChild(svg("rect", {x: 6, y: 6, width: 140, height: 56, fill: "#eaf2fd", stroke: N, "stroke-width": 2.5}));
      s.appendChild(svg("path", {d: "M6 18 L18 18 L18 6", fill: "none", stroke: N, "stroke-width": 1.5}));
      s.appendChild(svg("text", {x: 76, y: 84, "text-anchor": "middle", "font-size": 17, "font-weight": 900, fill: N}, fig.longueur));
      s.appendChild(svg("text", {x: 154, y: 40, "text-anchor": "start", "font-size": 17, "font-weight": 900, fill: N}, fig.largeur));
      return s;
    }
    // Une balance de Roberval (les plateaux sur le fléau, sans fils) : les
    // boîtes et le poids côte à côte sur un plateau, un poids sur l'autre.
    // Large et basse (la question est basse) ; les textes à 19 : environ
    // 15 px au petit téléphone.
    const n = fig.n;
    const s = svg("svg", {viewBox: "0 0 256 100", class: "dessin pb-balance", role: "img",
      "aria-label": `Une balance en équilibre : ${n} boîtes de conserve${fig.poids ? ` et ${fig.poids}` : ""} d'un côté, ${fig.total} de l'autre`});
    const cx = 128;
    const demi = 66;
    const yp = 66;
    s.appendChild(svg("path", {d: `M${cx} 80 L${cx} 95 M${cx - 30} 97 L${cx + 30} 97`, stroke: N, "stroke-width": 4.5, "stroke-linecap": "round"}));
    s.appendChild(svg("line", {x1: cx - demi, y1: 80, x2: cx + demi, y2: 80, stroke: N, "stroke-width": 4.5, "stroke-linecap": "round"}));
    s.appendChild(svg("circle", {cx, cy: 80, r: 4.5, fill: "#f2c94c", stroke: N, "stroke-width": 2}));
    [cx - demi, cx + demi].forEach(x => {
      s.appendChild(svg("line", {x1: x, y1: 80, x2: x, y2: yp + 4, stroke: N, "stroke-width": 3.5}));
      s.appendChild(svg("path", {d: `M${x - 60} ${yp} L${x + 60} ${yp} L${x + 52} ${yp + 6} L${x - 52} ${yp + 6} Z`, fill: "#e9eef3", stroke: N,
        "stroke-width": 2.5, "stroke-linejoin": "round"}));
    });
    // (La largeur d'un poids suit son texte : « 500 g », « 1,5 kg ».)
    // (Gwenaël, 20/11 : « le 500 g touche les bords du poids » : 6 px de
    // marge de chaque côté du texte, en haut du poids.)
    const large = t => Math.max(50, 10 * t.length + 14);
    const poids = (x, t) => {
      const l = large(t) / 2;
      s.appendChild(svg("path", {d: `M${x - l} ${yp} L${x + l} ${yp} L${x + l - 5} ${yp - 28} L${x - l + 5} ${yp - 28} Z`, fill: "#cfd8e0", stroke: N,
        "stroke-width": 2, "stroke-linejoin": "round"}));
      s.appendChild(svg("text", {x, y: yp - 8.5, "text-anchor": "middle", "font-size": 16.5, "font-weight": 900, fill: N}, t));
    };
    const w = 18;
    const boites = n * (w + 2) - 2;
    const largeur = boites + (fig.poids ? 4 + large(fig.poids) : 0);
    const x0 = cx - demi - largeur / 2;
    // Des boîtes de conserve (Gwenaël, 20/11 : « un truc concret ») : un
    // cylindre, son couvercle, une étiquette « ? ».
    for (let k = 0; k < n; k += 1) {
      const x = x0 + k * (w + 2);
      const ry = 3.5;
      s.appendChild(svg("path", {d: `M${x} ${yp - 31} L${x} ${yp - ry} A${w / 2} ${ry} 0 0 0 ${x + w} ${yp - ry} L${x + w} ${yp - 31}`,
        fill: "#fff", stroke: N, "stroke-width": 2, "stroke-linejoin": "round"}));
      s.appendChild(svg("rect", {x: x + 1, y: yp - 25, width: w - 2, height: 16, fill: "#eaf2fd"}));
      s.appendChild(svg("ellipse", {cx: x + w / 2, cy: yp - 31, rx: w / 2, ry, fill: "#cfd8e0", stroke: N, "stroke-width": 2}));
      s.appendChild(svg("text", {x: x + w / 2, y: yp - 10.5, "text-anchor": "middle", "font-size": 17, "font-weight": 900, fill: "#0755b8"}, "?"));
    }
    if (fig.poids) poids(x0 + boites + 4 + large(fig.poids) / 2, fig.poids);
    poids(cx + demi, fig.total);
    return s;
  }

  function poidsProbleme(question) {
    const d = question.donnees;
    const G = gen();
    const A = G.convertir(G.milli(d.a), d.ua, d.vers);
    const B = G.milli(d.b);
    const n = x => Number(x / 1000n);
    return d.op === "-" ? [n(B), Math.max(n(A - B), 1)] : [n(A), n(B)];
  }

  // ----------------------------------------------------------- le glisse-nombre
  // Le nombre en haut (bande grise) ; on touche « × 1 000 » : les chiffres
  // glissent de 3 colonnes vers la gauche, les zéros arrivent en gris.
  const NOMS_RANGS = ["Unités", "Dizaines", "Centaines", "Milliers", "Dizaines de milliers", "Centaines de milliers"];
  function glisseNombre(zone, {nombre, rangs, sens}, fini) {
    if (String(nombre).includes(",")) return glisseNombreDecimal(zone, {nombre, rangs, sens}, fini);
    const chiffres = String(nombre).split("");
    const largeur = Math.max(chiffres.length + (sens === "×" ? rangs : 0), 4);
    const boite = el("div", "gn-boite");
    const bouton = el("button", "ope", `${sens} ${gen().ecrire(10n ** BigInt(rangs) * 1000n)}`);
    bouton.type = "button";
    const table = el("table", "gn");
    const tete = el("tr");
    for (let c = largeur - 1; c >= 0; c -= 1) tete.appendChild(el("th", "", NOMS_RANGS[c] || ""));
    const haut = el("tr", "bande");
    const bas = el("tr");
    // Une rangée : les chiffres de `liste`, le dernier au rang `decal` ;
    // `zeros` : les zéros ajoutés derrière (en gris) ; `bleus` : les
    // chiffres qui ont glissé.
    const place = (ligne, liste, decal, zeros, bleus) => {
      ligne.textContent = "";
      const cases = Array(largeur).fill("");
      const classes = Array(largeur).fill("");
      liste.forEach((ch, i) => {
        const rang = liste.length - 1 - i + decal;
        if (rang >= 0 && rang < largeur) { cases[rang] = ch; classes[rang] = bleus ? "u" : ""; }
      });
      for (let r = 0; r < zeros; r += 1) { cases[r] = "0"; classes[r] = "z"; }
      for (let c = largeur - 1; c >= 0; c -= 1) ligne.appendChild(el("td", classes[c], cases[c]));
    };
    place(haut, chiffres, 0, 0, false);
    place(bas, [], 0, 0, false);
    table.appendChild(tete);
    table.appendChild(haut);
    table.appendChild(bas);
    boite.appendChild(bouton);
    boite.appendChild(table);
    zone.appendChild(boite);
    const jouer = () => {
      if (bouton.disabled) return;
      bouton.disabled = true;
      if (sens === "×") place(bas, chiffres, rangs, rangs, true);
      else place(bas, chiffres.slice(0, Math.max(1, chiffres.length - rangs)), 0, 0, true);
      bas.classList.add("glisse");
      fini();
    };
    bouton.addEventListener("click", jouer);
    return jouer;
  }

  // Lot B2-1 (C3 ; S002 p. 9, S003 p. 8-9) : le glisse-nombre officiel avec
  // un nombre décimal. La colonne des unités est grisée, la virgule reste
  // collée à elle ; on touche « × 10 » : les chiffres glissent d'une
  // colonne, un dixième devient une unité. Les colonnes : de la plus
  // grande utile aux centièmes.
  const RANGS_DEC = [["c", "Centièmes"], ["d", "Dixièmes"], ["u", "Unités"], ["D", "Dizaines"], ["C", "Centaines"], ["M", "Milliers"]];
  function glisseNombreDecimal(zone, {nombre, rangs, sens}, fini) {
    const [ent, dec = ""] = String(nombre).split(",");
    // Les chiffres avec leur rang : 0 = unités, -1 = dixièmes, 1 = dizaines.
    const depart = [];
    ent.split("").forEach((c, k) => depart.push([c, ent.length - 1 - k]));
    dec.split("").forEach((c, k) => depart.push([c, -1 - k]));
    const decal = sens === "×" ? rangs : -rangs;
    const arrivee = depart.map(([c, r]) => [c, r + decal]);
    const rangsUtiles = depart.concat(arrivee).map(([, r]) => r);
    const haut = Math.max(0, ...rangsUtiles);
    const bas = Math.min(-1, ...rangsUtiles);
    const cols = [];
    for (let r = haut; r >= bas; r -= 1) cols.push(r);
    const boite = el("div", "gn-boite");
    const bouton = el("button", "ope", `${sens} ${gen().ecrire(10n ** BigInt(rangs) * 1000n)}`);
    bouton.type = "button";
    const table = el("table", "gn dec");
    const tete = el("tr");
    cols.forEach(r => tete.appendChild(el("th", r === 0 ? "u-col" : "", RANGS_DEC[r + 2][1])));
    const ligneH = el("tr", "bande");
    const ligneB = el("tr");
    // Une rangée : les chiffres à leur rang ; la virgule collée aux unités
    // quand il y a des chiffres après elle ; `zeros` en gris.
    const place = (ligne, liste, bleus) => {
      ligne.textContent = "";
      const apres = liste.some(([, r]) => r < 0);
      // (Un zéro devant la virgule quand le nombre est plus petit que 1.)
      const avecZero = liste.length && !liste.some(([, r]) => r >= 0) ? liste.concat([["0", 0, true]]) : liste;
      cols.forEach(r => {
        const x = avecZero.find(([, rr]) => rr === r);
        const td = el("td", `${r === 0 ? "u-col" : ""}${x && bleus ? " u" : ""}${x && x[2] ? " z" : ""}`, x ? x[0] : "");
        if (r === 0 && apres && liste.length) td.appendChild(el("span", "virg", ","));
        ligne.appendChild(td);
      });
    };
    place(ligneH, depart, false);
    place(ligneB, [], false);
    table.append(tete, ligneH, ligneB);
    boite.append(bouton, table);
    zone.appendChild(boite);
    const jouer = () => {
      if (bouton.disabled) return;
      bouton.disabled = true;
      place(ligneB, arrivee, true);
      ligneB.classList.add("glisse");
      fini();
    };
    bouton.addEventListener("click", jouer);
    return jouer;
  }

  // ----------------------------------------------------------- le glisse-unité
  // Celui de Gwenaël (conversions_materiel_virtuel.html), refait fidèlement
  // au lot A2 (12/11/2026) : les unités en titre de colonne, les chiffres
  // dessous, qui NE BOUGENT PAS ; deux poignées qui glissent ENSEMBLE,
  // « L'unité de mesure » en haut et « Le chiffre des unités » en bas, avec
  // la virgule ; ses couleurs par grandeur. Ce qu'il gagne : il se glisse au
  // doigt (ou on touche une unité, ou les flèches du clavier), l'unité de
  // départ est marquée d'une punaise (son « Figer le départ »), les colonnes
  // hors programme du palier sont en pâle. Les zéros remplissent les colonnes
  // entre les chiffres et la poignée, comme chez lui. Il n'écrit jamais la
  // mesure trouvée : c'est l'élève qui lit les chiffres.
  const THEMES_GLISSE = {longueur: ["#1283ff", "#0b67c6"], masse: ["#16a34a", "#0e7a36"], contenance: ["#06b6d4", "#0a8aa3"]};
  // `colonnes` (lot B1-2) : les colonnes du palier 2 (les masses du
  // kilogramme au milligramme, la tonne devant quand elle est en jeu).
  function glisseUnite(zone, {grandeur, valeur, de, vers, pale = true, fige = false, colonnes: lesColonnes = null}, arrivee = () => {}) {
    const G = gen();
    const [entier, decimales = ""] = String(valeur).replace(/\s/g, "").replace(".", ",").split(",");
    const avant = entier.replace(/\D/g, "").replace(/^0+(?=\d)/, "").split("");
    const apres = decimales.replace(/\D/g, "").split("").filter(Boolean);
    let colonnes = (lesColonnes || G.COLONNES[grandeur]).slice();
    // Des colonnes sans nom à gauche (ou à droite) si le nombre en a besoin.
    const iDe0 = colonnes.indexOf(de);
    const manqueG = Math.max(0, avant.length - 1 - iDe0);
    const manqueD = Math.max(0, apres.length - (colonnes.length - 1 - iDe0));
    colonnes = Array(manqueG).fill("").concat(colonnes, Array(manqueD).fill(""));
    const n = colonnes.length;
    const iDe = colonnes.indexOf(de);
    const iVers = colonnes.indexOf(vers);
    // Les chiffres posés une fois pour toutes : le chiffre des unités sous
    // l'unité de départ.
    const poses = Array(n).fill("");
    avant.forEach((c, k) => { poses[iDe - (avant.length - 1 - k)] = c; });
    apres.forEach((c, k) => { poses[iDe + 1 + k] = c; });
    const premier = poses.findIndex(c => c !== "");
    const dernier = n - 1 - poses.slice().reverse().findIndex(c => c !== "");
    let cible = iDe;
    let fini = false;
    const [acc, accF] = THEMES_GLISSE[grandeur] || THEMES_GLISSE.longueur;

    const boite = el("div", `gu2${fige ? " fige" : ""}`);
    boite.style.setProperty("--acc", acc);
    boite.style.setProperty("--acc-f", accF);
    boite.style.setProperty("--n", String(n));
    const piste = el("div", "gu2-piste");
    const curseur = el("div", "gu2-curseur");
    curseur.setAttribute("aria-hidden", "true");
    const virgule = el("span", "gu2-virgule", ",");
    curseur.appendChild(virgule);
    const poignee = (classe, texte) => {
      const p = el("div", `gu2-poignee ${classe}`);
      p.setAttribute("role", "slider");
      p.tabIndex = classe === "dessus" ? 0 : -1;
      p.setAttribute("aria-label", texte);
      p.appendChild(el("span", "gu2-mots", texte));
      return p;
    };
    const haut = poignee("dessus", "L'unité de mesure");
    const bas = poignee("dessous", "Le chiffre des unités");
    const flecheH = el("span", "gu2-pointe dessus");
    const flecheB = el("span", "gu2-pointe dessous");
    const tete = el("div", "gu2-tete");
    const ligne = el("div", "gu2-chiffres");
    const boutons = colonnes.map((u, i) => {
      const b = el("button", u ? "" : "sans-nom");
      b.type = "button";
      b.appendChild(el("span", "", u || NB));
      if (!u) { b.disabled = true; b.setAttribute("aria-hidden", "true"); b.tabIndex = -1; }
      else {
        b.setAttribute("aria-label", `Mettre l'unité sur ${u}`);
        b.tabIndex = -1;
        if (pale && G.HORS_CYCLE_2.includes(u)) b.classList.add("pale");
      }
      if (i === iDe) {
        b.classList.add("depart");
        // (Lot 3b-2 : la punaise dessinée, plus l'émoticône.)
        b.appendChild(icone("punaise", "gu2-pin"));
        b.title = "L'unité de départ";
      }
      b.addEventListener("click", () => { if (!fige) aller(i); });
      tete.appendChild(b);
      return b;
    });
    const cases = colonnes.map(() => { const c = el("span", ""); ligne.appendChild(c); return c; });
    piste.append(curseur, haut, flecheH, tete, ligne, bas, flecheB);
    boite.appendChild(piste);
    zone.appendChild(boite);

    // La place des poignées : centrées sur la colonne (ou sur le doigt
    // pendant le glissé), sans sortir de la piste ; leur pointe, elle, reste
    // pile sur la colonne.
    function placer(centre) {
      const W = piste.clientWidth || 1;
      const x = Math.max(0, Math.min(1, centre)) * W;
      const largeurCol = W / n;
      curseur.style.left = `${((x - largeurCol / 2) / W) * 100}%`;
      curseur.style.width = `${100 / n}%`;
      // Lot 3a (« pas parfait », Gwenaël, le 14/11) : comme dans son
      // matériel virtuel (setTarget), le cadre va du HAUT de l'unité au BAS
      // du chiffre, mesurés à l'écran : il entoure les deux, sans couper le
      // chiffre, à toutes les tailles (la zone peut être réduite : on divise
      // par son échelle).
      const rp = piste.getBoundingClientRect();
      const k = rp.width && piste.offsetWidth ? rp.width / piste.offsetWidth : 1;
      const rUnite = boutons[cible] && boutons[cible].getBoundingClientRect();
      const rChiffre = cases[cible] && cases[cible].getBoundingClientRect();
      if (rUnite && rChiffre && rp.height && rChiffre.bottom > rUnite.top) {
        curseur.style.top = `${(rUnite.top - rp.top) / k}px`;
        curseur.style.height = `${(rChiffre.bottom - rUnite.top) / k}px`;
        curseur.style.bottom = "auto";
      }
      [flecheH, flecheB].forEach(f => { f.style.left = `${(x / W) * 100}%`; });
      [haut, bas].forEach(p => {
        const demi = p.offsetWidth / 2;
        const c = Math.max(demi, Math.min(W - demi, x));
        p.style.left = `${(c / W) * 100}%`;
      });
    }
    function dessiner() {
      const debut = Math.min(premier, cible);
      const fin = Math.max(dernier, cible);
      cases.forEach((c, i) => {
        let t = poses[i];
        let cl = "";
        if (!t && i >= debut && i <= fin) { t = "0"; cl = "zero"; }
        c.textContent = t;
        c.className = `${cl}${i === cible ? " unite" : ""}`;
      });
      boutons.forEach((b, i) => b.classList.toggle("on", i === cible));
      [haut, bas].forEach(p => p.setAttribute("aria-valuetext", colonnes[cible]));
      placer((cible + 0.5) / n);
    }
    function aller(i) {
      if (i < 0 || i >= n || !colonnes[i]) return;
      cible = i;
      dessiner();
      if (i === iVers && !fini) { fini = true; arrivee(); }
    }
    // La colonne nommée la plus proche d'une position (0 à 1).
    function plusProche(pos) {
      let meilleur = cible;
      let ecart = Infinity;
      colonnes.forEach((u, i) => {
        if (!u) return;
        const d = Math.abs((i + 0.5) / n - pos);
        if (d < ecart) { ecart = d; meilleur = i; }
      });
      return meilleur;
    }
    // Glisser : la poignée suit le doigt, et la colonne sous le doigt
    // devient l'unité (les zéros suivent) ; au lâcher, elle se pose pile
    // sur sa colonne.
    // Lot A2 ter (l'essai de Gwenaël sur son iPhone, le 13/11 : « le truc ne
    // glisse pas ») : on glisse PARTOUT sur la piste, pas seulement par la
    // poignée — le doigt d'un élève se pose sur le cadre de couleur, sur les
    // chiffres ou sur les unités. Toute la piste a touch-action: none (le
    // navigateur ne fait rien défiler dessous), et le toucher sans glisser
    // pose l'unité sous le doigt.
    // Parti de la poignée, le glissé part de la colonne où elle est (une
    // poignée du bord, décalée pour rester dans la piste, ne saute pas sous
    // le doigt) ; parti d'ailleurs, il suit la colonne sous le doigt.
    let glisse = null;
    let depart = {x: 0, pos: 0, relatif: false, bouge: false};
    const largeurPiste = () => piste.getBoundingClientRect().width || 1;
    const position = ev => (depart.relatif ? depart.pos + (ev.clientX - depart.x) / largeurPiste()
      : (ev.clientX - piste.getBoundingClientRect().left) / largeurPiste());
    piste.addEventListener("pointerdown", ev => {
      if (fige || (ev.pointerType === "mouse" && ev.button !== 0)) return;
      ev.preventDefault();
      glisse = ev.pointerId;
      const parPoignee = Boolean(ev.target.closest && ev.target.closest(".gu2-poignee"));
      depart = {x: ev.clientX, pos: (cible + 0.5) / n, relatif: parPoignee, bouge: false};
      try { piste.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
      boite.classList.add("glisse");
      haut.focus({preventScroll: true});
    });
    piste.addEventListener("pointermove", ev => {
      if (glisse !== ev.pointerId) return;
      if (!depart.bouge && Math.abs(ev.clientX - depart.x) < 6) return;
      depart.bouge = true;
      const pos = position(ev);
      const i = plusProche(pos);
      if (i !== cible) aller(i);
      placer(pos);
    });
    const lacher = ev => {
      if (glisse !== ev.pointerId) return;
      glisse = null;
      boite.classList.remove("glisse");
      // Un toucher sans glisser : l'unité sous le doigt (rien si c'était la poignée).
      if (depart.bouge || !depart.relatif) aller(plusProche(position(ev)));
      dessiner();
    };
    piste.addEventListener("pointerup", lacher);
    piste.addEventListener("pointercancel", lacher);
    // Safari (iPhone) : sans cela, un glissé un peu vertical fait défiler
    // la page au lieu de la poignée.
    piste.addEventListener("touchmove", ev => { if (glisse !== null && ev.cancelable) ev.preventDefault(); }, {passive: false});
    haut.addEventListener("keydown", ev => {
      const pas = ev.key === "ArrowLeft" ? -1 : ev.key === "ArrowRight" ? 1 : 0;
      if (!pas || fige) return;
      ev.preventDefault();
      for (let i = cible + pas; i >= 0 && i < n; i += pas) if (colonnes[i]) { aller(i); break; }
    });
    // Le glisse-unité qui se glisse tout seul, colonne par colonne, jusqu'à
    // l'unité `vers` (la correction de « À toi », comme le glisse-unité animé
    // de l'exerciseur ; « Suivant » sans le geste dans On te montre).
    // `ensuite()` quand il est arrivé.
    // Lot 3b-3 bis (rapport de Codex, F01) : les colonnes sans nom (entre t
    // et kg) se sautent ; avant, `aller` les refusait et le glisse-unité
    // restait sur t, la réponse cachée (« 1 t, c'est combien de fois 1 kg ? »).
    boite.animer = (versU, {pas = 420, ensuite = () => {}} = {}) => {
      const j = colonnes.indexOf(versU);
      if (j < 0) { ensuite(); return; }
      const avance = () => {
        if (!boite.isConnected) return;
        if (cible === j) { ensuite(); return; }
        const sens = j > cible ? 1 : -1;
        let k = cible + sens;
        while (k !== j && !colonnes[k]) k += sens;
        aller(k);
        root.setTimeout(avance, pas);
      };
      root.setTimeout(avance, pas);
    };
    // À l'arrivée de l'écran, les poignées sont posées d'un coup (sans
    // glisser depuis le milieu) ; les glissés suivants sont animés.
    boite.classList.add("pose");
    dessiner();
    const poser = () => { placer((cible + 0.5) / n); root.setTimeout(() => boite.classList.remove("pose"), 30); };
    // La largeur n'est connue qu'une fois la piste à l'écran.
    if (root.requestAnimationFrame) root.requestAnimationFrame(poser); else poser();
    if (root.ResizeObserver) new root.ResizeObserver(() => { if (glisse === null) placer((cible + 0.5) / n); }).observe(piste);
    return boite;
  }

  // --------------------------------------------- les repères des unités en jeu
  // Lot A2 ter (Gwenaël, le 13/11 : « Je ne sais pas pourquoi on me parle de
  // la poignée de porte (1 m), je ne l'ai jamais vue ») : chaque repère cité
  // ici est un repère que l'élève a déjà vu au palier 1 — ses 10 premiers
  // repères (R1, la règle comprise), la récréation de « Quelle unité
  // choisir ? », « un grand pas » de « On te montre » — ou se déduit d'eux
  // (4 récréations, trois canettes, le dixième d'une brique de lait). Plus de
  // petit cube, de tour de piste, de cuillère à café ni de dessin animé :
  // l'élève ne les rencontre qu'au palier 2.
  // Lot R1-refonte : les dix repères de « Mes premiers repères », un par
  // unité (le grand pas, la feuille A4, Saint-Pierre → Saint-Denis et la
  // pièce de 1 € sont passés au CM1).
  const REFERENCES = {
    mm: ["l1", "1 mm : la plus petite graduation de la règle"],
    cm: ["l10", "1 cm : la largeur de mon petit doigt"],
    dm: ["l15", "1 dm : la largeur de ma main"],
    m: ["l13", "1 m : la hauteur de la poignée de porte"],
    km: ["l14", "1 km : 10 terrains de foot bout à bout"],
    g: ["m7", "1 g : un trombone"],
    kg: ["m4", "1 kg : un paquet de riz"],
    t: ["m6", "1 t : une petite voiture"],
    cL: ["c2", "une canette : 33 cL"],
    dL: ["c3", "1 dL : le dixième d'une brique de lait"],
    L: ["c3", "1 L : une brique de lait"],
    // Les durées (lot A2 bis ; lot A2 ter : la récréation de « On te montre »)
    min: ["!cloche", "la récréation : 15 min"],
    h: ["!cloche", "1 h : 4 récréations de 15 min"],
    jours: ["!soleil", "1 jour : 24 h, du matin au matin suivant"]
  };
  // Quand l'objet de la question EST la référence d'une unité, une autre
  // référence (sinon l'aide donnerait la réponse). Lot 3b-3 : toujours une
  // illustration, comme les autres lignes de la liste (une série d'images
  // homogène : plus de petit dessin plat au milieu des illustrations). Le
  // texte ne change pas : une image sans sa mesure ne cite pas un repère
  // d'un autre palier (règle du lot A2 ter).
  // Lot R1-refonte : un repère par unité, l'autre référence se déduit des
  // repères voisins (« 1 m : environ 10 largeurs de main ») ; plus de
  // « 1 t = 1 000 paquets de riz » (Gwenaël, 18/11 : ça ne parle pas à un
  // élève).
  const AUTRES = {
    l1: {mm: ["l10", "mm : dix fois plus petit que le cm"]},
    l10: {cm: ["l1", "1 cm : de 0 à 1 sur la règle"]},
    l15: {dm: ["l1", "1 dm : de 0 à 10 sur la règle"]},
    l13: {m: ["l15", "1 m : environ 10 largeurs de main"]},
    l14: {km: ["l13", "km : pour les longs trajets"]},
    m7: {g: ["m4", "g : pour les objets légers"]},
    m4: {kg: ["m7", "1 kg : environ 1 000 trombones"]},
    m6: {t: ["m4", "t : pour les objets très lourds"]},
    c2: {cL: ["c3", "cL : pour les petites quantités de liquide"]},
    c3: {L: ["c2", "1 L : trois canettes, un peu plus"]}
  };
  // Lot B1-1 : au palier 2, les repères du CM1 rejoignent ceux des bases ;
  // chaque unité a plusieurs références, dans l'ordre, et l'aide prend la
  // première qui ne donne pas la réponse : jamais le repère de la question,
  // jamais un repère qui a la même mesure que la réponse (« 1 kg : 1 L
  // d'eau » quand on demande le paquet de riz de 1 kg). Toujours une
  // illustration (une seule famille de dessins dans la liste).
  const REFERENCES_2 = {
    mm: [["l1", "1 mm : la plus petite graduation de la règle"], ["m1", "mm : pour les toutes petites longueurs"]],
    cm: [["l10", "1 cm : la largeur de mon petit doigt"], ["l3", "une feuille A4 : 21 cm de large"]],
    // (Lot R1-refonte : les repères de « Mes premiers repères » d'abord.)
    dm: [["l15", "1 dm : la largeur de ma main"], ["l1", "1 dm : de 0 à 10 sur la règle"]],
    m: [["l13", "1 m : la hauteur de la poignée de porte"], ["l11", "1 m : un très grand pas"], ["l4", "une voiture : environ 4 m de long"]],
    km: [["l14", "1 km : 10 terrains de foot bout à bout"], ["l5", "1 km : deux tours et demi de piste"], ["l7", "de Saint‑Pierre à Saint‑Denis : environ 80 km"]],
    mg: [["m1", "un grain de riz : environ 25 mg"], ["m7", "mg : pour les masses toutes petites"]],
    g: [["m7", "1 g : un trombone"], ["m3", "une pièce de 1 € : 7,5 g"]],
    kg: [["m8", "1 kg : un litre d'eau"], ["m4", "un paquet de riz : 1 kg"], ["m5", "un pack de 6 bouteilles d'eau : environ 9 kg"]],
    t: [["m6", "une petite voiture : environ 1 t"], ["m5", "1 t : plus de 100 packs d'eau"]],
    mL: [["c1", "une cuillère à café : 5 mL"], ["c5", "mL : pour les toutes petites quantités"]],
    cL: [["c5", "un verre : environ 20 cL"], ["c2", "une canette : 33 cL"]],
    dL: [["c3", "1 dL : le dixième d'une brique de lait"]],
    L: [["c3", "une brique de lait : 1 L"], ["c7", "une bouteille d'eau : 1,5 L"], ["c6", "un grand arrosoir : 10 L"], ["c4", "un chauffe-eau solaire : environ 200 L"]],
    // Lot B3-1 (R8) : les repères d'aire du CM2.
    "cm²": [["a6", "1 cm² : l'ongle de mon pouce"], ["a1", "1 cm² : un carreau de 1 cm de côté"]],
    "dm²": [["a7", "1 dm² : la paume de ma main"], ["a2", "une feuille A4 : environ 6 dm²"]],
    "m²": [["a3", "1 m² : une affiche A0"], ["a4", "un terrain de foot : environ 7 000 m²"]]
  };
  const ORDRE_2 = {longueur: ["mm", "cm", "dm", "m", "km"], masse: ["mg", "g", "kg", "t"], contenance: ["mL", "cL", "dL", "L"], aire: ["cm²", "dm²", "m²"]};
  // Les lignes de la liste des unités au palier 2 : [{unite, repere, texte}].
  function referencesUnites2(question) {
    const C = carte();
    const G = gen();
    const grandeur = question.grandeur || G.grandeurDe(question.unite);
    const unites = question.morceaux.sorte === "unite" && question.choix ? question.choix.slice()
      : question.unites ? question.unites.slice() : (ORDRE_2[grandeur] || []);
    // La mesure qu'il ne faut pas donner : celle du repère demandé, ou la
    // vraie mesure d'une question « Est-ce vraisemblable ? ».
    // (Relier : aucun des trois objets à relier, ni leurs mesures.)
    const interdits = [question.repere].concat(question.forme === "associer" ? question.reperes || [] : []).filter(Boolean);
    const cachees = interdits.map(c => `${C.repere(c).nombre}${C.repere(c).unite}`).concat(question.cache ? [question.cache] : []);
    // (Lot R1-refonte, correctif : sans unités proposées, le décimètre n'a
    // sa ligne que quand la question porte sur lui, comme au palier 1 ; cinq
    // lignes ne tenaient pas au petit iPhone dans « Lequel mesure le moins ? ».)
    const parDefaut = !(question.morceaux.sorte === "unite" && question.choix) && !question.unites;
    const avecDm = !parDefaut || question.unite === "dm" || (question.reperes || []).some(c => C.repere(c).unite === "dm");
    return (ORDRE_2[grandeur] || []).filter(u => unites.includes(u) && (u !== "dm" || avecDm)).map(u => {
      const ref = (REFERENCES_2[u] || []).find(([code]) => {
        const x = C.repere(code);
        return !interdits.includes(code) && !cachees.includes(`${x.nombre}${x.unite}`);
      });
      return ref ? {unite: u, repere: ref[0], texte: C.typo(ref[1])} : null;
    }).filter(Boolean);
  }
  function reperesUnites(zone, question) {
    const G = gen();
    if ((carte().etape(question.code) || {}).palier >= 2) {
      const liste2 = el("div", "refs");
      referencesUnites2(question).forEach(({repere, texte}) => {
        const ligne = el("div", "ref");
        ligne.appendChild(visuel(repere));
        ligne.appendChild(el("span", "", texte));
        liste2.appendChild(ligne);
      });
      zone.appendChild(liste2);
      return;
    }
    // (Lot 3b : « Quelle unité pour… ? », sans nombre : les repères de toutes
    // les unités de la grandeur de la bonne réponse.)
    const unites = question.morceaux.sorte === "sansNombre" ? ({longueur: ["mm", "cm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"]})[question.grandeur] || []
      : question.choix && question.morceaux.sorte === "unite" ? question.choix.slice()
      : question.unites ? question.unites.slice() : (question.repere ? [question.unite] : []);
    const grandeur = question.grandeur || G.grandeurDe(question.unite);
    // Associer (lot A2 bis) : les unités des trois mesures, de la plus
    // petite à la plus grande, toutes grandeurs mêlées.
    // (Lot R1-refonte : le décimètre, la main, a sa ligne quand la question
    // porte sur lui.)
    const ordre = question.forme === "associer" ? ["mm", "cm", "dm", "m", "km", "g", "kg", "t", "cL", "dL", "L"].filter(u => unites.includes(u))
      : {longueur: ["mm", "cm", "m", "km"].concat(unites.includes("dm") ? ["dm"] : []).sort((a, b) => G.exposant(a) - G.exposant(b)),
        masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"], duree: ["min", "h", "jours"]}[grandeur] || unites;
    const liste = el("div", "refs");
    ordre.filter(u => unites.includes(u) || question.morceaux.sorte === "valeur" || question.morceaux.sorte === "saisie").forEach(u => {
      const autre = question.repere && AUTRES[question.repere] && AUTRES[question.repere][u];
      const [vu, texte] = autre || REFERENCES[u];
      const ligne = el("div", "ref");
      ligne.appendChild(visuel(vu));
      ligne.appendChild(el("span", "", carte().typo(texte)));
      liste.appendChild(ligne);
    });
    zone.appendChild(liste);
  }

  // ======================================================= lot A2 bis
  // La monnaie (E1), les deux heures (D7), « qu'est-ce qu'on mesure ? » (R2),
  // le tableau heures / minutes (D1), ranger (C2).

  // --------------------------------------------------- pièces et billets
  // Une pièce ou un billet, en centimes. Les couleurs des vraies pièces :
  // cuivre (1, 2, 5 c), or (10, 20, 50 c), or et argent (1 €, 2 €) ; les
  // billets de 5, 10 et 20 €. Rend la largeur prise.
  const RAYONS = {1: 13, 2: 14.5, 5: 16, 10: 15, 20: 17, 50: 18.5, 100: 18, 200: 20};
  function nomPiece(v) {
    return v >= 100 ? `${v / 100}${NB}€` : `${v}${NB}c`;
  }
  function piece(g, x, cy, v) {
    if (v >= 500) {
      const w = 64;
      const couleurs = {500: ["#d3dcd8", "#5f6f69"], 1000: ["#f3c3b4", "#9a4b3a"], 2000: ["#c4d8f2", "#3d64a0"]}[v];
      g.appendChild(svg("rect", {x: x.toFixed(1), y: cy - 18, width: w, height: 36, rx: 4, fill: couleurs[0], stroke: couleurs[1], "stroke-width": 2}));
      g.appendChild(svg("rect", {x: (x + 5).toFixed(1), y: cy - 13, width: w - 10, height: 26, rx: 2, fill: "none", stroke: couleurs[1], "stroke-width": 0.8, opacity: 0.6}));
      g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: cy + 6, "text-anchor": "middle", "font-size": 17, "font-weight": 900, fill: "#143451"}, nomPiece(v)));
      return w;
    }
    const r = RAYONS[v];
    const cx = x + r;
    if (v >= 100) {
      const [dehors, dedans] = v === 100 ? ["#f2cf63", "#d5dbe0"] : ["#d5dbe0", "#f2cf63"];
      g.appendChild(svg("circle", {cx: cx.toFixed(1), cy, r, fill: dehors, stroke: "#7a6a3a", "stroke-width": 1.5}));
      g.appendChild(svg("circle", {cx: cx.toFixed(1), cy, r: r * 0.7, fill: dedans, stroke: "#8a8f94", "stroke-width": 0.8}));
    } else {
      const [fond, bord] = v >= 10 ? ["#f2cf63", "#a57d12"] : ["#dd9761", "#8a4a1f"];
      g.appendChild(svg("circle", {cx: cx.toFixed(1), cy, r, fill: fond, stroke: bord, "stroke-width": 1.5}));
    }
    g.appendChild(svg("text", {x: cx.toFixed(1), y: cy + 4.5, "text-anchor": "middle", "font-size": r > 15 ? 12.5 : 10.5, "font-weight": 900, fill: "#143451"}, nomPiece(v)));
    return 2 * r;
  }
  // Une rangée de pièces (la question « Combien d'argent ? », l'outil).
  // `sous` : un texte sous certaines pièces ; `aToucher` : leurs places.
  function rangeePieces(valeurs, {sous = [], aToucher = [], classe = "dessin pieces"} = {}) {
    const ecart = 7;
    const largeurs = valeurs.map(v => (v >= 500 ? 64 : 2 * RAYONS[v]));
    const W = largeurs.reduce((a, b) => a + b, 0) + ecart * (valeurs.length - 1) + 8;
    const avecSous = sous.some(Boolean) || aToucher.length;
    const H = avecSous ? 66 : 44;
    const dessin = svg("svg", {viewBox: `0 0 ${W.toFixed(1)} ${H}`, class: classe, role: "img",
      "aria-label": valeurs.map(nomPiece).join(", ")});
    let x = 4;
    valeurs.forEach((v, i) => {
      const g = svg("g", {"data-i": i, class: aToucher.includes(i) ? "a-toucher" : ""});
      const w = piece(g, x, 22, v);
      if (sous[i]) g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: 60, "text-anchor": "middle", "font-size": 12.5, "font-weight": 900, fill: "#0755b8"}, sous[i]));
      else if (aToucher.includes(i)) g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: 60, "text-anchor": "middle", "font-size": 10.5, "font-weight": 700, fill: "#8ea1af"}, "touche"));
      dessin.appendChild(g);
      x += w + ecart;
    });
    return dessin;
  }
  // On te montre : les pièces d'une somme ; on touche chaque pièce de 1 €,
  // elle dit « 100 c » dessous.
  function piecesMontre(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const somme = el("div", "somme");
    zone.appendChild(boite);
    const vues = new Set();
    const euros = aide.pieces.map((v, i) => (v >= 100 ? i : -1)).filter(i => i >= 0);
    function dessiner() {
      boite.textContent = "";
      const sous = aide.pieces.map((v, i) => (v < 100 ? nomPiece(v) : vues.has(i) ? `${v}${NB}c` : ""));
      const d = rangeePieces(aide.pieces, {sous, aToucher: euros.filter(i => !vues.has(i)), classe: "dessin pieces grande"});
      d.setAttribute("tabindex", "0");
      boite.append(d, somme);
      somme.textContent = vues.size ? [...vues].sort().map(i => `${aide.pieces[i]}${NB}c`).join(" + ") : "";
      toucherP = i => {
        if (i === undefined) i = euros.find(k => !vues.has(k));
        if (i === undefined || vues.has(i) || !euros.includes(i)) return;
        vues.add(i);
        dessiner();
        if (vues.size === euros.length) fini();
      };
      d.addEventListener("click", ev => {
        const g = ev.target.closest && ev.target.closest("g[data-i]");
        toucherP(g ? Number(g.getAttribute("data-i")) : undefined);
      });
      d.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucherP(); } });
    }
    let toucherP = () => {};
    dessiner();
    return enChaine(() => toucherP(), () => vues.size < euros.length, 480);
  }
  // On te montre : la pièce de 1 € qu'on échange contre 100 pièces de 1 c
  // (10 rangées de 10).
  function echange(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 330 178", class: "dessin echange", role: "img", tabindex: 0, "aria-label": "Une pièce de 1 € et 100 pièces de 1 centime"});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let ouvert = false;
    function dessiner() {
      dessin.textContent = "";
      const g = svg("g", {class: ouvert ? "" : "a-toucher"});
      g.appendChild(svg("circle", {cx: 58, cy: 84, r: 44, fill: "#f2cf63", stroke: "#7a6a3a", "stroke-width": 2.5}));
      g.appendChild(svg("circle", {cx: 58, cy: 84, r: 31, fill: "#d5dbe0", stroke: "#8a8f94", "stroke-width": 1.2}));
      g.appendChild(svg("text", {x: 58, y: 95, "text-anchor": "middle", "font-size": 30, "font-weight": 900, fill: "#143451"}, `1${NB}€`));
      dessin.appendChild(g);
      dessin.appendChild(svg("text", {x: 122, y: 96, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#143451"}, "="));
      for (let r = 0; r < 10; r += 1) {
        for (let c = 0; c < 10; c += 1) {
          dessin.appendChild(svg("circle", {cx: 152 + c * 17, cy: 8 + r * 15.4, r: 6.6, fill: ouvert ? "#dd9761" : "#f3f6f8", stroke: ouvert ? "#8a4a1f" : "#d3dde5", "stroke-width": 1}));
        }
      }
      if (ouvert) dessin.appendChild(svg("text", {x: 228, y: 172, "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: "#8a4a1f"}, `100 pièces de 1${NB}c`));
      else dessin.appendChild(svg("text", {x: 58, y: 150, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#8ea1af"}, "touche-moi"));
    }
    const toucher = () => { if (ouvert) return; ouvert = true; dessiner(); fini(); };
    dessin.addEventListener("click", toucher);
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    dessiner();
    return toucher;
  }
  // L'étiquette d'un prix : « 2,50 € ». Touchée, elle dit ce que valent les
  // chiffres avant et après la virgule. `muette` : sans les valeurs (l'image
  // de « À toi » : « euros » et « centimes » seulement).
  function etiquette(zone, {euros, centimes, muette = false, touche = true}, fini = () => {}) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 300 132", class: "dessin etiquette", role: "img", tabindex: touche ? 0 : -1, "aria-label": "Une étiquette de prix"});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let ouverte = !touche;
    const e = String(euros);
    const c = String(centimes).padStart(2, "0");
    function dessiner() {
      dessin.textContent = "";
      const g = svg("g", {class: ouverte ? "" : "a-toucher"});
      g.appendChild(svg("path", {d: "M58 10 H262 a8 8 0 0 1 8 8 V70 a8 8 0 0 1 -8 8 H58 L32 44 Z", fill: "#fff8e6", stroke: "#a57d12", "stroke-width": 2.5, "stroke-linejoin": "round"}));
      g.appendChild(svg("circle", {cx: 52, cy: 44, r: 5, fill: "#fff", stroke: "#a57d12", "stroke-width": 2}));
      // Les chiffres, placés à la main : les euros, la virgule, les centimes, €.
      const xVirgule = 150;
      g.appendChild(svg("text", {x: xVirgule - 6, y: 60, "text-anchor": "end", "font-size": 42, "font-weight": 900, fill: ouverte ? "#0755b8" : "#143451"}, e));
      g.appendChild(svg("text", {x: xVirgule, y: 60, "text-anchor": "middle", "font-size": 42, "font-weight": 900, fill: "#143451"}, ","));
      g.appendChild(svg("text", {x: xVirgule + 6, y: 60, "font-size": 42, "font-weight": 900, fill: ouverte ? "#147447" : "#143451"}, c));
      g.appendChild(svg("text", {x: xVirgule + 70, y: 60, "font-size": 34, "font-weight": 900, fill: "#143451"}, "€"));
      dessin.appendChild(g);
      if (!ouverte) {
        dessin.appendChild(svg("text", {x: 160, y: 104, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#8ea1af"}, "touche-moi"));
        return;
      }
      const lE = 26 * e.length;
      dessin.appendChild(svg("path", {d: `M${xVirgule - 8 - lE} 84 v6 h${lE} v-6`, fill: "none", stroke: "#0755b8", "stroke-width": 2.5}));
      dessin.appendChild(svg("text", {x: xVirgule - 8 - lE / 2, y: 112, "text-anchor": "middle", "font-size": 18, "font-weight": 900, fill: "#0755b8"}, muette ? "euros" : `${e}${NB}€`));
      dessin.appendChild(svg("path", {d: `M${xVirgule + 8} 84 v6 h52 v-6`, fill: "none", stroke: "#147447", "stroke-width": 2.5}));
      dessin.appendChild(svg("text", {x: xVirgule + 34, y: 112, "text-anchor": "middle", "font-size": 18, "font-weight": 900, fill: "#147447"}, muette ? "centimes" : `${Number(c)}${NB}c`));
    }
    const toucher = () => { if (ouverte) return; ouverte = true; dessiner(); fini(); };
    if (touche) {
      dessin.addEventListener("click", toucher);
      dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    }
    dessiner();
    return toucher;
  }
  // L'outil de « À toi » : 1 € = 100 c, et les 100 pièces de 1 c.
  function monnaie(zone) {
    zone.appendChild(el("div", "rel petite", `1${NB}€ = 100${NB}c`));
    const dessin = svg("svg", {viewBox: "0 0 300 74", class: "dessin monnaie", role: "img", "aria-label": "1 € = 100 pièces de 1 centime"});
    const g = svg("g", {});
    piece(g, 24, 37, 100);
    dessin.appendChild(g);
    dessin.appendChild(svg("text", {x: 84, y: 45, "text-anchor": "middle", "font-size": 24, "font-weight": 900, fill: "#143451"}, "="));
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 20; c += 1) dessin.appendChild(svg("circle", {cx: 108 + c * 9.4, cy: 8 + r * 9.6, r: 3.9, fill: "#dd9761", stroke: "#8a4a1f", "stroke-width": 0.6}));
    }
    dessin.appendChild(svg("text", {x: 197, y: 70, "text-anchor": "middle", "font-size": 11.5, "font-weight": 900, fill: "#8a4a1f"}, `100 pièces de 1${NB}c`));
    zone.appendChild(dessin);
  }
  // L'image de « À toi » : les paquets de la somme (1 € dedans, 100 c
  // dessous), et le reste en centimes.
  function paquetsArgent(zone, {euros, centimes}) {
    if (euros) zone.appendChild(rangeePieces(Array(euros).fill(100), {sous: Array(euros).fill(`100${NB}c`)}));
    if (centimes) zone.appendChild(el("div", "note reste", carte().typo(euros ? `et encore ${centimes} c` : `${centimes} c`)));
  }

  // --------------------------------------------------------- les horloges
  // Un cadran à aiguilles, à l'heure `t` (minutes depuis minuit) ; `inconnue` :
  // pas d'aiguilles, un « ? ».
  function cadran(parent, cx, cy, R, t, {inconnue = false, titre = "", sous = ""} = {}) {
    const point = (angle, r) => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
    parent.appendChild(svg("circle", {cx, cy, r: R, fill: "#fff", stroke: "#143451", "stroke-width": 3}));
    for (let m = 0; m < 60; m += 5) {
      const a = (2 * Math.PI * m) / 60;
      const [x1, y1] = point(a, R - 2);
      const [x2, y2] = point(a, R - 7);
      parent.appendChild(svg("line", {x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), stroke: "#143451", "stroke-width": 1.8}));
    }
    for (let h = 1; h <= 12; h += 1) {
      const [x, y] = point((2 * Math.PI * h) / 12, R - 15);
      parent.appendChild(svg("text", {x: x.toFixed(1), y: (y + 4).toFixed(1), "text-anchor": "middle", "font-size": R > 40 ? 11 : 9.5, "font-weight": 800, fill: "#143451"}, String(h)));
    }
    if (inconnue) {
      parent.appendChild(svg("text", {x: cx, y: cy + 11, "text-anchor": "middle", "font-size": 32, "font-weight": 900, fill: "#a93030"}, "?"));
    } else {
      const h = Math.floor(t / 60) % 12;
      const m = t % 60;
      const [hx, hy] = point((2 * Math.PI * (h + m / 60)) / 12, R * 0.5);
      parent.appendChild(svg("line", {x1: cx, y1: cy, x2: hx.toFixed(1), y2: hy.toFixed(1), stroke: "#143451", "stroke-width": 5.5, "stroke-linecap": "round"}));
      const [mx, my] = point((2 * Math.PI * m) / 60, R * 0.78);
      parent.appendChild(svg("line", {x1: cx, y1: cy, x2: mx.toFixed(1), y2: my.toFixed(1), stroke: "#0755b8", "stroke-width": 3.5, "stroke-linecap": "round"}));
      parent.appendChild(svg("circle", {cx, cy, r: 4, fill: "#143451"}));
    }
    if (titre) parent.appendChild(svg("text", {x: cx, y: cy - R - 8, "text-anchor": "middle", "font-size": 12.5, "font-weight": 900, fill: "#506b7d"}, titre));
    if (sous) parent.appendChild(svg("text", {x: cx, y: cy + R + 19, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: inconnue ? "#a93030" : "#143451"}, sous));
  }
  function heureT(t) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    return m ? `${h}${NB}h${NB}${String(m).padStart(2, "0")}` : `${h}${NB}h`;
  }
  // On te montre : départ et arrivée ; on touche l'horloge de départ, sa
  // petite aiguille avance d'une heure, jusqu'à l'heure d'arrivée.
  function horloges(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 300 168", class: "dessin horloges", role: "img", tabindex: 0, "aria-label": "Deux horloges : le départ et l'arrivée"});
    const somme = el("div", "somme");
    boite.append(dessin, somme);
    zone.appendChild(boite);
    let t = aide.depart;
    function dessiner() {
      dessin.textContent = "";
      const g = svg("g", {class: t < aide.arrivee ? "a-toucher" : ""});
      cadran(g, 78, 80, 54, t, {titre: "DÉPART", sous: heureT(t)});
      dessin.appendChild(g);
      cadran(dessin, 222, 80, 54, aide.arrivee, {titre: "ARRIVÉE", sous: heureT(aide.arrivee)});
      const n = (t - aide.depart) / 60;
      somme.textContent = n ? Array(n).fill(`1${NB}h`).join(" + ") : "";
      if (!n) somme.appendChild(el("span", "touche", "touche l'horloge de départ"));
    }
    const toucher = () => {
      if (t >= aide.arrivee) return;
      t += 60;
      dessiner();
      if (t >= aide.arrivee) fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    dessiner();
    return enChaine(toucher, () => t < aide.arrivee, 600);
  }
  // L'image de « À toi » : les deux horloges de la question ; celle qu'on
  // cherche a un « ? ».
  function horlogesImage(zone, {depart, arrivee, cherche}) {
    const dessin = svg("svg", {viewBox: "0 0 300 150", class: "dessin horloges petite", role: "img", "aria-label": "Deux horloges"});
    cadran(dessin, 82, 72, 50, depart, {titre: "DÉPART", sous: cherche === "depart" ? "?" : heureT(depart), inconnue: cherche === "depart"});
    cadran(dessin, 218, 72, 50, arrivee, {titre: "ARRIVÉE", sous: cherche === "arrivee" ? "?" : heureT(arrivee), inconnue: cherche === "arrivee"});
    zone.appendChild(dessin);
  }

  // ------------------------------------------------------- l'axe du temps
  // Les instants sur une ligne, de gauche à droite. Les heures pile sont
  // marquées. Les bonds sont des arcs au-dessus (heures en bleu, minutes en
  // vert). Dans On te montre, on touche l'axe : un bond de plus.
  function axeDessin(dessin, {debut, fin, marques, bonds = [], fleche = null, heures = true, points = null, titres = true}) {
    const W = 330;
    const x0 = 34;
    const x1 = W - 34;
    const yA = 92;
    // L'échelle : proportionnelle au temps ; avec `points` (les bonds de On
    // te montre), chaque bond a au moins le tiers de la place, pour qu'un
    // bond de 20 min se voie à côté d'un bond de 2 h.
    let X = t => x0 + ((t - debut) / Math.max(1, fin - debut)) * (x1 - x0);
    if (points && points.length > 2) {
      const total = points[points.length - 1] - points[0];
      const poids = points.slice(1).map((p, k) => Math.max(p - points[k], total * 0.4));
      const somme = poids.reduce((a, b) => a + b, 0);
      const xs = [x0];
      poids.forEach(w => xs.push(xs[xs.length - 1] + (w / somme) * (x1 - x0)));
      X = t => {
        for (let k = 1; k < points.length; k += 1) {
          if (t <= points[k]) return xs[k - 1] + ((t - points[k - 1]) / Math.max(1, points[k] - points[k - 1])) * (xs[k] - xs[k - 1]);
        }
        return x1;
      };
    }
    dessin.appendChild(svg("line", {x1: x0 - 16, y1: yA, x2: x1 + 14, y2: yA, stroke: "#143451", "stroke-width": 2.5}));
    dessin.appendChild(svg("path", {d: `M${x1 + 14} ${yA} l-8 -5 v10 Z`, fill: "#143451"}));
    // Les étiquettes sous l'axe : sur une 2e ligne si elles se touchent.
    const etiquettes = [];
    if (heures) {
      for (let h = Math.ceil(debut / 60) * 60; h <= fin; h += 60) {
        if (marques.some(m => m.t === h)) continue;
        dessin.appendChild(svg("line", {x1: X(h), y1: yA - 6, x2: X(h), y2: yA + 6, stroke: "#8ea1af", "stroke-width": 2}));
        etiquettes.push({x: X(h), texte: heureT(h), taille: 13, couleur: "#506b7d", poids: 800});
      }
    }
    marques.forEach(m => {
      dessin.appendChild(svg("circle", {cx: X(m.t), cy: yA, r: 5.5, fill: m.inconnue ? "#fff" : "#143451", stroke: m.inconnue ? "#a93030" : "#143451", "stroke-width": 2.5}));
      etiquettes.push({x: X(m.t), texte: m.inconnue ? "?" : heureT(m.t), taille: 15, couleur: m.inconnue ? "#a93030" : "#143451", poids: 900, titre: m.titre});
    });
    etiquettes.sort((a, b) => a.x - b.x);
    const finLigne = [-Infinity, -Infinity];
    etiquettes.forEach(e => {
      const l = e.texte.length * e.taille * 0.52;
      const ligne = e.x - l / 2 > finLigne[0] + 4 ? 0 : 1;
      finLigne[ligne] = e.x + l / 2;
      const y = yA + 25 + ligne * 17;
      dessin.appendChild(svg("text", {x: e.x.toFixed(1), y, "text-anchor": "middle", "font-size": e.taille, "font-weight": e.poids, fill: e.couleur}, e.texte));
      if (titres && e.titre && ligne === 0) dessin.appendChild(svg("text", {x: e.x.toFixed(1), y: yA - 11, "text-anchor": "middle", "font-size": 10, "font-weight": 900, fill: "#8ea1af"}, e.titre));
    });
    bonds.forEach(([a, b]) => {
      const xa = X(a);
      const xb = X(b);
      const haut = Math.min(26, 10 + Math.abs(xb - xa) * 0.18);
      const d = b - a;
      const enHeures = d % 60 === 0;
      const couleur = enHeures ? "#0755b8" : "#147447";
      dessin.appendChild(svg("path", {d: `M${xa.toFixed(1)} ${yA - 5} Q${((xa + xb) / 2).toFixed(1)} ${(yA - 5 - haut * 2).toFixed(1)} ${xb.toFixed(1)} ${yA - 5}`, fill: "none", stroke: couleur, "stroke-width": 2.8}));
      dessin.appendChild(svg("path", {d: `M${xb.toFixed(1)} ${yA - 5} l-3 -10 l-6 5 Z`, fill: couleur}));
      dessin.appendChild(svg("text", {x: ((xa + xb) / 2).toFixed(1), y: (yA - 11 - haut).toFixed(1), "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: couleur},
        enHeures ? `${d / 60}${NB}h` : `${d}${NB}min`));
    });
    if (fleche) {
      const xa = X(fleche.de);
      const xb = X(fleche.a);
      const y = yA - 30;
      dessin.appendChild(svg("path", {d: `M${xa.toFixed(1)} ${y} H${xb.toFixed(1)}`, fill: "none", stroke: "#147447", "stroke-width": 2.6, "stroke-dasharray": "6 4"}));
      dessin.appendChild(svg("path", {d: `M${xb.toFixed(1)} ${y} l${xb > xa ? -9 : 9} -5 v10 Z`, fill: "#147447"}));
      dessin.appendChild(svg("text", {x: ((xa + xb) / 2).toFixed(1), y: y - 9, "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: "#147447"}, fleche.texte));
    }
  }
  function axe(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    const dessin = svg("svg", {viewBox: "0 0 330 140", class: "dessin axe", role: "img", tabindex: 0, "aria-label": "L'axe du temps"});
    const somme = el("div", "somme");
    boite.append(dessin, somme);
    zone.appendChild(boite);
    const fin = aide.bonds.reduce((t, b) => t + b, aide.depart);
    let faits = 0;
    function dessiner() {
      dessin.textContent = "";
      const g = svg("g", {class: faits < aide.bonds.length ? "a-toucher" : ""});
      g.appendChild(svg("rect", {x: 0, y: 0, width: 330, height: 140, fill: "transparent"}));
      dessin.appendChild(g);
      const etapes = [];
      let t = aide.depart;
      for (let k = 0; k < faits; k += 1) { etapes.push([t, t + aide.bonds[k]]); t += aide.bonds[k]; }
      const marques = [{t: aide.depart, titre: "DÉPART"}];
      etapes.forEach(([, b]) => { if (b !== fin) marques.push({t: b}); });
      marques.push({t: fin, titre: "ARRIVÉE", inconnue: aide.cherche === "arrivee" && faits < aide.bonds.length});
      const points = [aide.depart];
      aide.bonds.forEach(b => points.push(points[points.length - 1] + b));
      axeDessin(dessin, {debut: aide.depart, fin, marques, bonds: etapes, heures: false, points, titres: false});
      const textes = etapes.map(([a, b]) => ((b - a) % 60 === 0 ? `${(b - a) / 60}${NB}h` : `${b - a}${NB}min`));
      somme.textContent = textes.join(" + ");
      if (!faits) somme.appendChild(el("span", "touche", "touche l'axe du temps"));
    }
    const toucher = () => {
      if (faits >= aide.bonds.length) return;
      faits += 1;
      dessiner();
      if (faits === aide.bonds.length) fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    dessiner();
    return enChaine(toucher, () => faits < aide.bonds.length, 750);
  }
  // L'outil de « À toi » : l'axe, les heures pile marquées, sans les bonds
  // (c'est à l'élève de les faire). Pour une heure cherchée : la flèche de la
  // durée, et un « ? » au bout.
  function axeTemps(zone, {depart, arrivee, cherche}) {
    const dessin = svg("svg", {viewBox: cherche === "duree" ? "0 64 330 76" : "0 32 330 108", class: "dessin axe", role: "img", "aria-label": "L'axe du temps"});
    const debut = Math.floor(depart / 60) * 60 - (depart % 60 ? 0 : 15);
    const fin = Math.ceil(arrivee / 60) * 60 + (arrivee % 60 ? 0 : 15);
    const duree = arrivee - depart;
    const texte = `${cherche === "depart" ? "−" : "+"}${NB}${duree % 60 && duree > 60 ? `${Math.floor(duree / 60)}${NB}h${NB}${duree % 60}${NB}min` : duree % 60 ? `${duree}${NB}min` : `${duree / 60}${NB}h`}`;
    axeDessin(dessin, {debut, fin, marques: [
      {t: depart, titre: "DÉPART", inconnue: cherche === "depart"},
      {t: arrivee, titre: "ARRIVÉE", inconnue: cherche === "arrivee"}],
    fleche: cherche === "duree" ? null : (cherche === "arrivee" ? {de: depart, a: arrivee, texte} : {de: arrivee, a: depart, texte})});
    zone.appendChild(dessin);
    zone.appendChild(el("div", "note", cherche === "duree" ? "Je fais des bonds : jusqu'à l'heure pile, puis les heures, puis les minutes." : "Je fais un bond jusqu'à l'heure pile, puis le reste."));
  }

  // ------------------------------------- l'axe du temps à arcs (lot B2-3b-2)
  // Q10 « Durées et horaires » (S002 p. 18, choix de Gwenaël du 21/11) :
  // l'axe orienté, les instants marqués, les durées en arcs au-dessus
  // (« ? » en rouge pour ce qu'on cherche) ; l'heure pile en gris quand
  // elle a la place (`piles`). La correction : les bonds par l'heure pile
  // en vert, la réponse en vert sur l'axe.
  //   instants : [{t, cache, vide, vert, sous}] ; arcs : [{de, a, texte, vert}]
  function axeArcs(zone, {instants, arcs, piles = false}) {
    const W = 330;
    const x0 = 32;
    const x1 = W - 32;
    const yA = 50;
    const avecSous = instants.some(i => i.sous);
    const H = avecSous ? 96 : 80;
    const ts = instants.map(i => i.t);
    const pts = [...new Set(ts)].sort((a, b) => a - b);
    const debut = pts[0];
    const total = Math.max(1, pts[pts.length - 1] - debut);
    // (Chaque intervalle a une place assez grande : un bond de 7 min se
    // voit à côté d'un bond de 6 h, et « 16 h 26 » ne touche pas « 16 h 36 ».)
    const poids = pts.slice(1).map((p, k) => Math.max(p - pts[k], total * 0.36));
    const somme = poids.reduce((a, b) => a + b, 0) || 1;
    const xs = [x0];
    poids.forEach(w => xs.push(xs[xs.length - 1] + (w / somme) * (x1 - x0)));
    const X = t => {
      for (let k = 1; k < pts.length; k += 1) if (t <= pts[k]) return xs[k - 1] + ((t - pts[k - 1]) / Math.max(1, pts[k] - pts[k - 1])) * (xs[k] - xs[k - 1]);
      return x1;
    };
    const s = svg("svg", {viewBox: `0 0 ${W} ${H}`, class: "dessin axe-arcs", role: "img", "aria-label": "L'axe du temps"});
    s.appendChild(svg("line", {x1: x0 - 20, y1: yA, x2: x1 + 20, y2: yA, stroke: N, "stroke-width": 2.5}));
    s.appendChild(svg("path", {d: `M${x1 + 20} ${yA} l-8 -5 v10 Z`, fill: N}));
    const VERT = "#147447";
    if (piles) {
      // (La première et la dernière heure pile, si elles ont la place.)
      const hs = [];
      for (let h = Math.ceil(debut / 60) * 60; h < pts[pts.length - 1]; h += 60) hs.push(h);
      [...new Set([hs[0], hs[hs.length - 1]])].filter(h => h !== undefined && instants.every(i => Math.abs(X(i.t) - X(h)) > 40)).forEach(h => {
        s.appendChild(svg("line", {x1: X(h), y1: yA - 6, x2: X(h), y2: yA + 6, stroke: "#8ea1af", "stroke-width": 2.2}));
        s.appendChild(svg("text", {x: X(h), y: yA + 24, "text-anchor": "middle", "font-size": 15, "font-weight": 800, fill: "#6c8494"}, heureT(h)));
      });
    }
    arcs.forEach(({de, a, texte, vert}) => {
      const xa = X(instants[de].t);
      const xb = X(instants[a].t);
      const haut = Math.min(22, 10 + Math.abs(xb - xa) * 0.14);
      const c = vert ? VERT : "#0755b8";
      s.appendChild(svg("path", {d: `M${xa.toFixed(1)} ${yA - 4} Q${((xa + xb) / 2).toFixed(1)} ${(yA - 4 - haut * 2).toFixed(1)} ${xb.toFixed(1)} ${yA - 4}`,
        fill: "none", stroke: c, "stroke-width": 2.6}));
      s.appendChild(svg("path", {d: `M${xb.toFixed(1)} ${yA - 4} l-3 -10 l-6 5 Z`, fill: c}));
      s.appendChild(svg("text", {x: ((xa + xb) / 2).toFixed(1), y: (yA - 10 - haut).toFixed(1), "text-anchor": "middle", "font-size": 16, "font-weight": 900,
        fill: texte === "?" ? "#a93030" : c}, texte));
    });
    instants.forEach(({t, cache, vide, vert, sous}) => {
      const x = X(t);
      s.appendChild(svg("line", {x1: x, y1: yA - 8, x2: x, y2: yA + 8, stroke: N, "stroke-width": 2.5}));
      if (!vide) s.appendChild(svg("text", {x, y: yA + 25, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: cache ? "#a93030" : vert ? VERT : N}, cache ? "?" : heureT(t)));
      if (sous) s.appendChild(svg("text", {x, y: yA + 42, "text-anchor": "middle", "font-size": 14.5, "font-weight": 800, fill: "#506b7d"}, carte().typo(sous)));
    });
    zone.appendChild(s);
    return s;
  }
  // On te montre : l'axe de la question ; on le touche, les bonds par
  // l'heure pile (ou les instants trouvés) apparaissent en vert.
  function arcsMontre(zone, aide, fini) {
    const boite = el("div", "dessin-boite");
    zone.appendChild(boite);
    let fait = false;
    function dessiner() {
      boite.textContent = "";
      const s = axeArcs(boite, fait ? aide.apres : aide.avant);
      s.setAttribute("tabindex", "0");
      const somme = el("div", "somme");
      if (!fait) {
        s.classList.add("a-toucher");
        somme.appendChild(el("span", "touche", "touche l'axe du temps"));
      }
      boite.appendChild(somme);
      s.addEventListener("click", toucher);
      s.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    }
    function toucher() {
      if (fait) return;
      fait = true;
      dessiner();
      fini();
    }
    dessiner();
    return enChaine(toucher, () => !fait, 750);
  }
  // ======================================================= lot B6-1 (palier 6)
  // D6 « Toutes les heures décimales » (choix de Gwenaël du 21/11) : la
  // double droite des heures, en haut les heures (0 à 1 h en dixièmes), en
  // bas les minutes (0,1 h = 6 min). aide : {c (la graduation cherchée en
  // centièmes, un tiers d'heure compris), sens (h>min, min>h), haut, bas}.
  // mode : "outil" (0, 0,1 ↔ 6, 0,5 ↔ 30, 1 ↔ 60, et le « ? » à sa place),
  // "correction" (les dixièmes jusqu'à la graduation, elle en vert),
  // "montre" (chaque toucher écrit un dixième de plus, jusqu'à elle).
  function droiteHeures(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const c = Number(aide.c);
    const haut = aide.haut || "h";
    const bas = aide.bas || "min";
    const x0 = 24;
    const x1 = 280;
    const yH = 46;
    const yB = 84;
    const X = k => x0 + ((x1 - x0) * k) / 10;
    const xc = x0 + ((x1 - x0) * c) / 100;
    const dec = k => (k === 10 ? "1" : k === 0 ? "0" : `0,${k}`);
    const boite = el("div", "dessin-boite droite2-boite");
    const dessin = svg("svg", {viewBox: "0 0 340 118", class: `dessin droite2 droite-h${mode === "montre" ? " a-toucher" : ""}`, role: "img",
      "aria-label": "La double droite des heures"});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    const fin = Math.floor(c / 10);
    let vus = mode === "montre" ? 0 : fin;
    function dessiner() {
      dessin.textContent = "";
      if (mode === "montre") dessin.appendChild(svg("rect", {x: 0, y: 0, width: 340, height: 118, fill: "transparent"}));
      [yH, yB].forEach(y => {
        dessin.appendChild(svg("line", {x1: x0, y1: y, x2: x1 + 14, y2: y, stroke: ENCRE, "stroke-width": 2.4}));
        dessin.appendChild(svg("path", {d: `M${x1 + 16} ${y} l-8 -5 v10 Z`, fill: ENCRE}));
      });
      dessin.appendChild(svg("text", {x: x1 + 22, y: yH + 5, "font-size": 15, "font-weight": 900, fill: ENCRE}, haut));
      dessin.appendChild(svg("text", {x: x1 + 22, y: yB + 5, "font-size": 15, "font-weight": 900, fill: ENCRE}, bas));
      const trouve = mode === "correction" || (mode === "montre" && vus >= fin);
      const ici = trouve ? VERT : BLEU;
      for (let k = 0; k <= 10; k += 1) {
        const x = X(k);
        const gros = k % 5 === 0;
        [yH, yB].forEach(y => dessin.appendChild(svg("line", {x1: x, y1: y - (gros ? 8 : 6), x2: x, y2: y + (gros ? 8 : 6), stroke: ENCRE, "stroke-width": gros ? 2.4 : 1.6})));
        // Les nombres écrits : 0, 0,1 (6), 0,5 (30), 1 (60) ; en correction
        // et dans On te montre, les dixièmes jusqu'à la graduation.
        const ecrit = mode === "outil" ? [0, 1, 5, 10].includes(k) : (k <= vus || k === 10 || (mode === "correction" && k === 5));
        if (!ecrit || k * 10 === c || Math.abs(x - xc) < 19) continue;
        const pale = mode !== "outil" && ![0, 1, 10].includes(k);
        const couleur = mode === "montre" && k && k <= vus && k !== 10 ? BLEU : pale ? "#6c8494" : ENCRE;
        // (Les dixièmes du milieu un peu plus petits : « 0,1 » et « 0,2 » ne
        // se touchent pas à côté de la graduation cherchée.)
        const taille = [0, 10].includes(k) ? 13 : 11.5;
        dessin.appendChild(svg("text", {x, y: yH - 16, "text-anchor": "middle", "font-size": taille, "font-weight": 900, fill: couleur}, dec(k)));
        dessin.appendChild(svg("text", {x, y: yB + 24, "text-anchor": "middle", "font-size": taille, "font-weight": 900, fill: couleur}, String(k * 6)));
      }
      // La graduation cherchée (un demi-dixième, un tiers : un trait de plus).
      if (mode === "montre" && !trouve) return;
      [yH, yB].forEach(y => dessin.appendChild(svg("line", {x1: xc, y1: y - 9, x2: xc, y2: y + 9, stroke: ici, "stroke-width": 2.6})));
      const minutes = Math.round((c * 60) / 100);
      const hautT = aide.hautTexte || (Number.isInteger(c) ? gen().ecrire(BigInt(c) * 10n) : "?");
      const cache = (sens, cote) => !trouve && aide.sens === sens && cote;
      const tHaut = cache("min>h", true) || !Number.isInteger(c) ? ["?", trouve && !Number.isInteger(c) ? ici : ROUGE] : [hautT, ici];
      const tBas = cache("h>min", true) ? ["?", ROUGE] : [String(minutes), ici];
      if (!Number.isInteger(c) && trouve) tHaut[0] = aide.hautTexte || "";
      dessin.appendChild(svg("text", {x: xc, y: yH - 16, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: tHaut[1]}, tHaut[0]));
      dessin.appendChild(svg("text", {x: xc, y: yB + 25, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: tBas[1]}, tBas[0]));
      dessin.appendChild(svg("line", {x1: xc, y1: yH + 9, x2: xc, y2: yB - 9, stroke: ici, "stroke-width": 2, "stroke-dasharray": "4 3"}));
    }
    dessiner();
    if (mode !== "montre") return null;
    const note = el("div", "note", "touche la droite");
    boite.appendChild(note);
    const toucher = () => {
      if (vus >= fin) return;
      vus += 1;
      dessiner();
      if (vus >= fin) { note.remove(); dessin.classList.remove("a-toucher"); fini(); }
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => vus < fin, 300);
  }

  // G1 « km/h et m/s » (choix de Gwenaël du 21/11) : les trois étapes, « En
  // 1 h », « En 1 min », « En 1 s », les mètres parcourus dans chaque case,
  // reliées par ÷ 60 (vers la seconde) ou × 60 (vers l'heure). aide : {s2
  // (le double de la vitesse en m/s), depuis, vers (les cases : 0, 1, 2)}.
  // mode : "outil" (la case connue, les « ? » du chemin), "correction" (le
  // chemin en vert), "montre" (chaque toucher remplit la case suivante).
  function etapesVitesse(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const s2 = BigInt(aide.s2);
    const metres = [s2 * 1800000n, s2 * 30000n, s2 * 500n];
    const depuis = Number(aide.depuis);
    const vers = Number(aide.vers);
    const pas = vers > depuis ? 1 : -1;
    const chemin = [];
    for (let k = depuis; k !== vers + pas; k += pas) chemin.push(k);
    const titres = ["En 1 h", "En 1 min", "En 1 s"].map(t => t.replace(" ", NB).replace(/1 (?=h|min|s)/, `1${NB}`));
    const W = 340;
    const l = 98;
    const ecart = (W - 8 - 3 * l) / 2;
    const xCase = k => 4 + k * (l + ecart);
    const boite = el("div", "dessin-boite etapes-boite");
    const dessin = svg("svg", {viewBox: `0 0 ${W} 120`, class: `dessin etapes-v${mode === "montre" ? " a-toucher" : ""}`, role: "img",
      "aria-label": "La même vitesse en 1 h, en 1 min, en 1 s"});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let vus = mode === "montre" ? 0 : chemin.length - 1;
    function dessiner() {
      dessin.textContent = "";
      if (mode === "montre") dessin.appendChild(svg("rect", {x: 0, y: 0, width: W, height: 120, fill: "transparent"}));
      const fin = mode === "correction" || (mode === "montre" && vus >= chemin.length - 1);
      [0, 1, 2].forEach(k => {
        const x = xCase(k);
        const n = chemin.indexOf(k);
        const horsChemin = n < 0;
        const connue = k === depuis;
        const montree = n > 0 && (mode === "correction" || (mode === "montre" && n <= vus));
        dessin.appendChild(svg("text", {x: x + l / 2, y: 18, "text-anchor": "middle", "font-size": 13.5, "font-weight": 900, fill: horsChemin ? "#b3c2cd" : "#6c8494"}, titres[k]));
        dessin.appendChild(svg("rect", {x, y: 26, width: l, height: 42, rx: 9, fill: connue ? "#eef3f7" : montree && fin ? "#e7f6ee" : "#fff",
          stroke: horsChemin ? "#c9d6df" : connue ? ENCRE : montree && fin ? VERT : BLEU, "stroke-width": 2, "stroke-dasharray": horsChemin ? "5 4" : "none"}));
        if (horsChemin) return;
        const t = connue || montree ? `${gen().ecrire(metres[k])}${NB}m` : "?";
        const taille = Math.min(17, (l - 10) / (t.length * 0.56));
        const couleur = t === "?" ? ROUGE : connue ? ENCRE : fin ? VERT : BLEU;
        // (Vers les km/h, la case de l'heure trouvée dit aussi les
        // kilomètres : « 45 000 m », « = 45 km ».)
        if (aide.km && k === 0 && !connue && montree && fin) {
          dessin.appendChild(svg("text", {x: x + l / 2, y: 44, "text-anchor": "middle", "font-size": Math.min(taille, 14).toFixed(1), "font-weight": 900, fill: couleur}, t));
          dessin.appendChild(svg("text", {x: x + l / 2, y: 61, "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: couleur},
            `=${NB}${gen().ecrire(metres[0] / 1000n)}${NB}km`));
          return;
        }
        dessin.appendChild(svg("text", {x: x + l / 2, y: 47 + taille * 0.36, "text-anchor": "middle", "font-size": taille.toFixed(1), "font-weight": 900, fill: couleur}, t));
      });
      chemin.slice(1).forEach((k, n) => {
        const a = chemin[n];
        const xa = xCase(a) + l / 2 + 12 * pas;
        const xb = xCase(k) + l / 2 - 12 * pas;
        const couleur = BLEU;
        dessin.appendChild(svg("path", {d: `M${xa} 74 Q${(xa + xb) / 2} 102 ${xb} 74`, fill: "none", stroke: couleur, "stroke-width": 2.4}));
        dessin.appendChild(svg("path", {d: `M${xb} 74 l${-9 * pas} 3 l${5 * pas} 6 Z`, fill: couleur}));
        dessin.appendChild(svg("text", {x: (xa + xb) / 2, y: 115, "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: couleur}, `${pas > 0 ? "÷" : "×"}${NB}60`));
      });
    }
    dessiner();
    if (mode !== "montre") return null;
    const note = el("div", "note", "touche les cases");
    boite.appendChild(note);
    const toucher = () => {
      if (vus >= chemin.length - 1) return;
      vus += 1;
      dessiner();
      if (vus >= chemin.length - 1) { note.remove(); dessin.classList.remove("a-toucher"); fini(); }
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => vus < chemin.length - 1, 600);
  }
  // Lot B6-3 (Q9, choix de Gwenaël du 21/11) : le tableau de
  // proportionnalité (S097 p. 40) — deux lignes, une par grandeur, l'unité
  // écrite dans chaque case, la case cherchée « ? » en rouge, « × 60 » sur
  // un arc fléché au-dessus et au-dessous ; trois colonnes pour le retour à
  // l'unité (« ÷ 4 » puis « × 7 »). aide : {noms, lignes (la case cherchée :
  // null ; la case du milieu de la 2e ligne : donnée, montrée seulement par
  // la correction et On te montre), fleches, rep}.
  // mode : "outil" (avec les arcs), "image" (sans les arcs : l'élève
  // trouve le rapport), "correction" (la case trouvée en vert), "montre"
  // (chaque toucher fait une étape : l'arc, puis la case).
  function tableauProp(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const n = aide.lignes[0].length;
    const g = el("div", `tab-prop${n > 2 ? " trois" : ""}`);
    g.setAttribute("role", "table");
    g.setAttribute("aria-label", "Le tableau de proportionnalité");
    zone.appendChild(g);
    const fleches = aide.fleches || [];
    const etapes = fleches.length * 2;
    let vus = mode === "montre" ? 0 : etapes;
    const avecArcs = mode !== "image" && mode !== "correction" && fleches.length;
    let cellules = [];
    function dessiner() {
      g.textContent = "";
      cellules = [[], []];
      const place = (e, ligne, col, fin) => { e.style.gridRow = String(ligne); e.style.gridColumn = fin ? `${col} / ${fin}` : String(col); g.appendChild(e); return e; };
      const L0 = avecArcs ? 2 : 1;
      aide.noms.forEach((nom, i) => place(el("span", "tp-nom", carte().typo(nom)), L0 + i, 1));
      aide.lignes.forEach((ligne, i) => ligne.forEach((v, j) => {
        const cherchee = i === 1 && j === n - 1;
        const milieu = i === 1 && j > 0 && j < n - 1;
        // (L'étape k du geste remplit la colonne k + 1.)
        const montree = mode === "correction" || (mode === "montre" && vus >= 2 * j);
        let classe = "tp-c";
        let texte = v;
        if (cherchee) {
          if (mode === "correction" && aide.rep) { classe += " vert"; texte = aide.rep; }
          else if (mode === "montre" && montree && aide.rep) { classe += vus >= etapes ? " vert" : " bleu"; texte = aide.rep; }
          else { classe += " trou"; texte = "?"; }
        } else if (milieu) {
          if (montree && (mode === "correction" || mode === "montre")) classe += mode === "correction" ? " vert" : " bleu";
          else { classe += " vide"; texte = ""; }
        }
        const c = place(el("span", classe, carte().typo(texte)), L0 + i, j + 2);
        cellules[i][j] = c;
        if (mode === "montre" && !montree && (cherchee || milieu) && vus === 2 * j - 1) c.classList.add("a-toucher");
      }));
      if (!avecArcs) return;
      fleches.forEach((f, k) => {
        const visible = mode !== "montre" || vus >= 2 * k + 1;
        [true, false].forEach(dessus => {
          const a = place(el("div", `tp-arc ${dessus ? "dessus" : "dessous"}${visible ? "" : " cache"}`), dessus ? 1 : L0 + 2, k + 2, k + 4);
          a.dataset.k = String(k);
          a.dataset.texte = carte().typo(f);
          a.setAttribute("aria-label", carte().typo(f));
          if (mode === "montre" && !visible && vus === 2 * k) a.classList.add("a-toucher");
        });
      });
      tracerArcs();
    }
    // (Lot B6-3c, Gwenaël : « les nombres sont écrits à travers les flèches,
    // les pointes ne sont pas bonnes ». Chaque arc se dessine d'après la
    // vraie place des deux cases : du milieu de l'une au milieu de l'autre,
    // la pointe au bout de la courbe et dans son axe, vers la case ;
    // « × 60 » au-dessus de l'arc du haut, au-dessous de l'arc du bas,
    // jamais sur le trait. Redessiné quand le tableau change de taille.)
    function tracerArcs() {
      if (!g.isConnected) return;
      const taille = parseFloat(getComputedStyle(g).fontSize) || 16;
      // (15 px au moins : WebKit réduit l'outil de 3 points de plus que
      // Chromium au petit iPhone (90 %) ; à 14 px, « × 144 » tombait à
      // 12,6 px, sous les 13 px.)
      const tl = Math.max(15, taille * 0.82);
      g.querySelectorAll(".tp-arc").forEach(a => {
        const k = Number(a.dataset.k);
        const dessus = a.classList.contains("dessus");
        const ligne = cellules[dessus ? 0 : 1];
        const A = ligne[k];
        const B = ligne[k + 1];
        if (!A || !B) return;
        const W = a.clientWidth;
        const H = a.clientHeight;
        if (!W || !H) return;
        // (Trois colonnes : deux arcs se suivent au milieu de la case du
        // milieu ; un petit écart entre la pointe de l'un et le départ de
        // l'autre.)
        const ecart = n > 2 ? 4 : 0;
        const x1 = A.offsetLeft + A.offsetWidth / 2 - a.offsetLeft + (k > 0 ? ecart : 0);
        const x2 = B.offsetLeft + B.offsetWidth / 2 - a.offsetLeft - (k < n - 2 ? ecart : 0);
        const ap = 5;
        const al = 4;
        // (y : 0 contre la case, vers le texte en s'éloignant.)
        const pointe = 1;
        const depart = 2;
        // (Le chiffre occupe environ 0,72 de sa taille au-dessus de sa ligne
        // de base : le haut de l'arc s'arrête juste sous lui ; l'arc garde
        // ainsi 10 px de creux, sinon il ressemble à un crochet.)
        const sommet = H - 0.88 * tl - 1.5;
        const ctrl = (sommet - 0.25 * depart) / 0.75;
        const Y = y => (dessus ? H - y : y);
        const tx = (x1 + x2) / 2;
        const ty = dessus ? tl * 0.8 : H - tl * 0.12;
        const svgA = svg("svg", {class: "tp-trace", viewBox: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`, width: W.toFixed(1), height: H.toFixed(1), "aria-hidden": "true"});
        // Une arche : les points de contrôle rentrés vers le milieu ; la
        // pointe suit la direction de la courbe à son bout (pas toujours
        // verticale), la courbe s'arrête à la base de la pointe.
        const r = (x2 - x1) * 0.2;
        const tipX = x2;
        const tipY = Y(pointe);
        const dx = r;
        const dy = tipY - Y(ctrl);
        const lg = Math.hypot(dx, dy) || 1;
        const ux = dx / lg;
        const uy = dy / lg;
        const bx = tipX - ux * ap;
        const by = tipY - uy * ap;
        const f = v => v.toFixed(1);
        svgA.appendChild(svg("path", {class: "tp-courbe", fill: "none", "stroke-width": "2.4", "stroke-linecap": "round",
          d: `M ${f(x1)} ${f(Y(depart))} C ${f(x1 + r)} ${f(Y(ctrl))} ${f(x2 - r)} ${f(Y(ctrl))} ${f(bx + ux * 0.8)} ${f(by + uy * 0.8)}`}));
        svgA.appendChild(svg("path", {class: "tp-pointe", d: `M ${f(tipX)} ${f(tipY)} L ${f(bx - uy * al)} ${f(by + ux * al)} L ${f(bx + uy * al)} ${f(by - ux * al)} Z`}));
        const t = svg("text", {class: "tp-fois", x: tx.toFixed(1), y: ty.toFixed(1), "text-anchor": "middle", "font-size": tl.toFixed(1)});
        t.textContent = a.dataset.texte;
        svgA.appendChild(t);
        a.querySelectorAll(".tp-trace").forEach(x => x.remove());
        a.appendChild(svgA);
      });
    }
    if (avecArcs && window.ResizeObserver) new ResizeObserver(() => tracerArcs()).observe(g);
    dessiner();
    // (Lot B6-3c : plus large que sa zone (une police large, trois
    // colonnes), le tableau rapetisse ses textes, jusqu'à 84 % (13 px). La zone
    // n'est pas toujours dans la page à ce moment : la correction s'y
    // pose après.)
    const ajuster = () => {
      const z = g.closest(".zone");
      if (!z || !g.isConnected) return;
      const s = getComputedStyle(z);
      const placeL = z.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      const taille = parseFloat(getComputedStyle(g).fontSize) || 16;
      const largeur = () => getComputedStyle(g).gridTemplateColumns.split(" ").reduce((a, v) => a + (parseFloat(v) || 0), 0);
      for (let k = 1; k <= 4 && largeur() > placeL + 0.5; k += 1) g.style.fontSize = `${Math.max(13, taille * (1 - 0.04 * k)).toFixed(2)}px`;
      tracerArcs();
    };
    if (g.isConnected) ajuster(); else requestAnimationFrame(ajuster);
    if (mode !== "montre") return null;
    const note = el("div", "note", "touche le tableau");
    zone.appendChild(note);
    const toucher = () => {
      if (vus >= etapes) return;
      vus += 1;
      dessiner();
      if (vus >= etapes) { note.remove(); fini(); }
    };
    g.addEventListener("click", toucher);
    g.setAttribute("tabindex", "0");
    g.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => vus < etapes, 600);
  }
  // Le graphique du bus de Clotilde (S097 p. 41) : la distance (km) selon la
  // durée (min), une droite qui part de 0, les points marqués par des
  // croix, la lecture en pointillés. Les textes à 13 px au moins au
  // téléphone (Gwenaël, 21/11 : 11,5 px, c'était trop petit).
  function grapheQ9(fig) {
    // (Large et bas : la question ne doit pas passer 144 px au petit
    // iPhone, sinon l'outil rapetisse ; dessiné à sa taille, ses textes à
    // 15 font environ 14 px ; lot B6-3c : 13 px au moins à 360 px de large
    // avec une police large.)
    const W = 178;
    const gx = 22;
    const gy = 76;
    const lx = 118;
    const ly = 62;
    const X = v => gx + (lx * v) / fig.xMax;
    const Y = v => gy - (ly * v) / fig.yMax;
    const s = svg("svg", {viewBox: `0 0 ${W} 94`, class: "dessin graphe-q", role: "img",
      "aria-label": `Un graphique : la distance en km selon la durée en min ; la droite passe par ${fig.point[1]} km en ${fig.point[0]} min`});
    // (Une graduation sur deux quand elles seraient trop serrées pour leur
    // texte ; le quadrillage garde tous les kilomètres.)
    const pasY = fig.yMax > 4 ? 2 : 1;
    for (let v = 5; v <= fig.xMax; v += 5) s.appendChild(svg("line", {x1: X(v), y1: gy, x2: X(v), y2: Y(fig.yMax), stroke: "#d4e3ed", "stroke-width": 1}));
    for (let v = 1; v <= fig.yMax; v += 1) s.appendChild(svg("line", {x1: gx, y1: Y(v), x2: X(fig.xMax), y2: Y(v), stroke: "#d4e3ed", "stroke-width": 1}));
    s.appendChild(svg("line", {x1: gx, y1: gy, x2: X(fig.xMax) + 7, y2: gy, stroke: ENCRE, "stroke-width": 2}));
    s.appendChild(svg("path", {d: `M${X(fig.xMax) + 11} ${gy} l-7 -3.5 v7 Z`, fill: ENCRE}));
    s.appendChild(svg("line", {x1: gx, y1: gy, x2: gx, y2: Y(fig.yMax) - 7, stroke: ENCRE, "stroke-width": 2}));
    s.appendChild(svg("path", {d: `M${gx} ${Y(fig.yMax) - 11} l-3.5 7 h7 Z`, fill: ENCRE}));
    for (let v = 0; v <= fig.xMax; v += 10) s.appendChild(svg("text", {x: X(v), y: gy + 15, "text-anchor": "middle", "font-size": 15, "font-weight": 800, fill: ENCRE}, String(v)));
    for (let v = pasY; v <= fig.yMax; v += pasY) s.appendChild(svg("text", {x: gx - 5, y: Y(v) + 5, "text-anchor": "end", "font-size": 15, "font-weight": 800, fill: ENCRE}, String(v)));
    s.appendChild(svg("text", {x: W - 1, y: gy - 5, "text-anchor": "end", "font-size": 15, "font-weight": 900, fill: GRIS_Q9}, "min"));
    s.appendChild(svg("text", {x: gx + 7, y: 11, "font-size": 15, "font-weight": 900, fill: GRIS_Q9}, "km"));
    const [px, py] = fig.point;
    const pente = py / px;
    const xFin = Math.min(fig.xMax, fig.yMax / pente);
    s.appendChild(svg("line", {x1: X(0), y1: Y(0), x2: X(xFin), y2: Y(pente * xFin), stroke: BLEU, "stroke-width": 2.4}));
    s.appendChild(svg("line", {x1: X(px), y1: gy, x2: X(px), y2: Y(py), stroke: BLEU, "stroke-width": 1.5, "stroke-dasharray": "4 3"}));
    s.appendChild(svg("line", {x1: gx, y1: Y(py), x2: X(px), y2: Y(py), stroke: BLEU, "stroke-width": 1.5, "stroke-dasharray": "4 3"}));
    fig.croix.forEach(([a, b]) => {
      const x = X(a);
      const y = Y(b);
      const d = 3.6;
      s.appendChild(svg("path", {d: `M${x - d} ${y - d} L${x + d} ${y + d} M${x - d} ${y + d} L${x + d} ${y - d}`, stroke: ENCRE, "stroke-width": 2.1}));
    });
    return s;
  }
  const GRIS_Q9 = "#5d7486";

  // L'horaire du Car Jaune, les marées de Saint-Gilles (choix de Gwenaël du
  // 21/11) : un tableau de deux lignes, comme une vraie fiche à lire.
  function supportQ10(sup) {
    const t = el("table", `horaire${sup.type === "maree" ? " maree" : ""}`);
    const l1 = el("tr");
    const l2 = el("tr");
    // (Les marées : le titre dans une case haute de deux lignes, à gauche ;
    // l'énoncé tient sur une ligne. Le Car Jaune : quatre arrêts prennent
    // toute la largeur, l'énoncé dit « En Car Jaune ».)
    if (sup.type === "maree") {
      const titre = el("th", "tete", carte().typo("Marées à St‑Gilles"));
      titre.setAttribute("rowspan", "2");
      l1.appendChild(titre);
    }
    (sup.type === "car" ? sup.arrets : sup.liste).forEach(([nom, h]) => {
      l1.appendChild(el("th", "", carte().typo(nom)));
      l2.appendChild(el("td", "", heureT(h)));
    });
    const corps = el("tbody");
    corps.append(l1, l2);
    t.appendChild(corps);
    t.setAttribute("aria-label", sup.type === "car" ? "L'horaire du Car Jaune" : "Les marées à Saint‑Gilles");
    return t;
  }

  // --------------------------------------------- le tableau heures / minutes
  // 1 h → 60 min, 2 h → 120 min, 3 h → 180 min (l'Angleterre, NCETM) ; la
  // case qui serait la réponse a un trou.
  function tableauHeures(zone, {cacheMin = null, cacheH = null} = {}) {
    const table = el("table", "tab-hm");
    const l1 = el("tr");
    const l2 = el("tr");
    l1.appendChild(el("th", "", "h"));
    l2.appendChild(el("th", "", "min"));
    [1, 2, 3].forEach(h => {
      l1.appendChild(el("td", h === cacheH ? "trou" : "", h === cacheH ? "…" : String(h)));
      l2.appendChild(el("td", h === cacheMin ? "trou" : "", h === cacheMin ? "…" : String(h * 60)));
    });
    table.append(l1, l2);
    zone.appendChild(table);
    zone.appendChild(el("div", "note", "× 60 pour passer des heures aux minutes"));
  }

  // ------------------------------------------- ce qu'on mesure (R2)
  const GRANDEURS = [
    // (Lot B3-1c : avec l'aire, cinq lignes ; chacune sur une ligne au petit
    // Android avec une police large — le texte court, le dernier.)
    ["longueur", "!regle", "une longueur : la règle, le mètre", "une longueur : la règle"],
    ["masse", "!balance", "une masse : la balance"],
    ["contenance", "!verreDoseur", "une contenance : le verre doseur"],
    ["duree", "!chrono", "une durée : l'horloge, le chronomètre", "une durée : le chronomètre"],
    // (Lot B3-1 : au CM2, R9.)
    ["aire", "!aire", "une aire : les carreaux"]
  ];
  function grandeurs(zone, {bonne = null, aire = false} = {}) {
    const liste = el("div", "refs");
    GRANDEURS.filter(([cle]) => aire || cle !== "aire").forEach(([cle, vu, long, court]) => {
      const texte = aire ? court || long : long;
      const ligne = el("div", `ref${cle === bonne ? " bonne" : ""}`);
      ligne.appendChild(visuel(vu));
      ligne.appendChild(el("span", "", carte().typo(texte)));
      liste.appendChild(ligne);
    });
    zone.appendChild(liste);
  }

  // ---------------------------------------- l'échelle des unités (lot B1-2)
  // L'image des préfixes et des relations : les unités du CM1 de la
  // grandeur, de la plus grande à la plus petite (pas de tableau de
  // conversion au cours moyen : une rangée, sans nombres), les unités de la
  // question en couleur pleine, et la règle. L'élève compte les pas : la
  // réponse n'est jamais écrite.
  // `unites` (lot B2-2b-1, C7) : seulement ces colonnes (de la plus grande
  // unité de la question à la plus petite).
  function echelle(zone, {grandeur = null, grandeurs = null, marque = [], note = null, unites: seules = null}) {
    const G = gen();
    (grandeurs || [grandeur]).forEach(gr => {
      const [acc, accF] = THEMES_GLISSE[gr] || THEMES_GLISSE.longueur;
      const ligne = el("div", "echelle");
      ligne.style.setProperty("--acc", acc);
      ligne.style.setProperty("--acc-f", accF);
      const unites = seules || G.COLONNES_CM1[gr];
      ligne.style.setProperty("--n", String(unites.length));
      unites.forEach(u => ligne.appendChild(el("span", marque.includes(u) ? "on" : "", u)));
      zone.appendChild(ligne);
    });
    zone.appendChild(el("div", "note", carte().typo(note || "Chaque unité vaut 10 fois celle de droite.")));
  }

  // ------------------------------- les préfixes et la numération (lot B1-2)
  // « On te montre » de « Ce que veulent dire les préfixes » (S002 p. 15-17 :
  // les préfixes « en faisant le lien avec les unités de numération »).
  // Deux colonnes côte à côte : les nombres (« 1 millier = 1 000 unités »)
  // et les mesures (« 1 kilomètre = 1 000 mètres »). On touche chaque
  // ligne : la mesure apparaît en face, le préfixe en gras.
  const NUMERATION = {
    plus: [["kilo", "1 millier", "1 000 unités", "k"], ["hecto", "1 centaine", "100 unités", "h"], ["déca", "1 dizaine", "10 unités", "da"]],
    moins: [["déci", "1 unité", "10 dixièmes", "d"], ["centi", "1 unité", "100 centièmes", "c"], ["milli", "1 unité", "1 000 millièmes", "m"]]
  };
  const NOMS_BASE = {m: ["mètre", "mètres"], g: ["gramme", "grammes"], L: ["litre", "litres"]};
  function numeration(zone, aide, fini) {
    // Lot B6-2 (P5) : des lignes données par la carte, [préfixe, nombre,
    // = nombre, mesure, = mesure] (le millier, le million, le milliard).
    if (aide.lignes) return numerationLignes(zone, aide, fini);
    const [un, plusieurs] = NOMS_BASE[aide.base];
    const lignesN = NUMERATION[aide.sens];
    const vues = lignesN.map(() => false);
    const boite = el("div", "numeration");
    const tete = el("div", "num-tete");
    tete.append(el("span", "", "Les nombres"), el("span", "", aide.titre || "Les mesures"));
    boite.appendChild(tete);
    // Une case : deux lignes (« 1 millier », « = 1 000 unités »).
    const ligneT = (...morceaux) => {
      const l = el("span", "l");
      morceaux.forEach(m => l.appendChild(typeof m === "string" ? root.document.createTextNode(carte().typo(m)) : m));
      return l;
    };
    const boutons = lignesN.map(([pref, n1, n2]) => {
      const b = el("button", "num-ligne");
      b.type = "button";
      const gauche = el("span", "num-n");
      gauche.append(ligneT(n1), ligneT(`= ${n2}`));
      const droite = el("span", "num-m");
      droite.appendChild(el("span", "touche", "touche-moi"));
      b.append(gauche, droite);
      b.setAttribute("aria-label", `${pref} : touche pour voir la mesure`);
      boite.appendChild(b);
      return {b, droite, pref, nombre: n2.replace(/ [^ ]+$/, "")};
    });
    function voir(i) {
      if (vues[i]) return;
      vues[i] = true;
      const {b, droite, pref, nombre} = boutons[i];
      droite.textContent = "";
      // Le préfixe en gras : « 1 kilomètre = 1 000 mètres » ;
      // « 1 gramme = 10 décigrammes ».
      if (aide.sens === "plus") droite.append(ligneT(`1${NB}`, el("b", "", pref), un), ligneT(`= ${nombre}${NB}${plusieurs}`));
      else droite.append(ligneT(`1${NB}${un}`), ligneT(`= ${nombre}${NB}`, el("b", "", pref), plusieurs));
      b.classList.add("vue");
      if (vues.every(Boolean)) fini();
    }
    boutons.forEach(({b}, i) => b.addEventListener("click", () => voir(i)));
    zone.appendChild(boite);
    return enChaine(() => voir(vues.indexOf(false)), () => vues.includes(false), 420);
  }

  function numerationLignes(zone, aide, fini) {
    const typo = t => carte().typo(t);
    const vues = aide.lignes.map(() => false);
    const boite = el("div", "numeration");
    const tete = el("div", "num-tete");
    tete.append(el("span", "", "Les nombres"), el("span", "", aide.titre || "Les mesures"));
    boite.appendChild(tete);
    const ligneT = (...morceaux) => {
      const l = el("span", "l");
      morceaux.forEach(m => l.appendChild(typeof m === "string" ? root.document.createTextNode(typo(m)) : m));
      return l;
    };
    const boutons = aide.lignes.map(([pref, n1, n2]) => {
      const b = el("button", "num-ligne");
      b.type = "button";
      const gauche = el("span", "num-n");
      gauche.append(ligneT(n1), ligneT(n2));
      const droite = el("span", "num-m");
      droite.appendChild(el("span", "touche", "touche-moi"));
      b.append(gauche, droite);
      b.setAttribute("aria-label", `${pref} : touche pour voir la mesure`);
      boite.appendChild(b);
      return {b, droite};
    });
    function voir(i) {
      if (vues[i]) return;
      vues[i] = true;
      const {b, droite} = boutons[i];
      const [, , , m1, m2] = aide.lignes[i];
      droite.textContent = "";
      droite.append(ligneT(el("b", "", typo(m1))), ligneT(m2));
      b.classList.add("vue");
      if (vues.every(Boolean)) fini();
    }
    boutons.forEach(({b}, i) => b.addEventListener("click", () => voir(i)));
    zone.appendChild(boite);
    return enChaine(() => voir(vues.indexOf(false)), () => vues.includes(false), 420);
  }

  // ===================================== lot B6-2 : les puissances de 10 (P6)
  // La bande des 7 préfixes par 1 000 (choix de Gwenaël du 21/11, maquette
  // sur la vraie page) : le nom, le symbole, la puissance de 10. `base` :
  // l'unité (m, g, L, o, W) ; `marque` : les symboles en jeu (bleu plein ;
  // vert plein dans la correction). Modes : outil (toutes les puissances),
  // image (sans les puissances, sauf 10⁰ : on compte les cases), correction,
  // montre (les cases de `montre` à toucher : leur puissance apparaît).
  const BANDE_P = [["giga", "G", "10⁹"], ["méga", "M", "10⁶"], ["kilo", "k", "10³"], ["unité", "1", "10⁰"],
    ["milli", "m", "10⁻³"], ["micro", "µ", "10⁻⁶"], ["nano", "n", "10⁻⁹"]];
  function bandePuissances(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    // (Les cases à toucher portent « a-toucher » tant qu'elles ne sont pas
    // touchées ; la bande elle-même, jamais.)
    const boite = el("div", `bande-p${mode === "correction" ? " corr" : ""}`);
    boite.setAttribute("role", "img");
    boite.setAttribute("aria-label", "Les préfixes et leurs puissances de 10");
    const rang = el("div", "bp-rang");
    const marque = aide.marque || [];
    const aToucher = mode === "montre" ? (aide.montre || []) : [];
    const vues = {};
    const cases = BANDE_P.map(([nom, sym, pu]) => {
      const unite = sym === "1";
      const c = el(aToucher.includes(sym) ? "button" : "span", `bp${unite ? " base" : ""}${marque.includes(sym) ? " on" : ""}`);
      if (aToucher.includes(sym)) { c.type = "button"; c.classList.add("a-toucher"); c.setAttribute("aria-label", `${nom} : touche pour voir sa puissance de 10`); }
      const cache = (mode === "image" && !unite) || aToucher.includes(sym);
      c.append(el("i", "nom", nom), el("b", "sym", unite ? (aide.base || "1") : sym), el("span", `pu${cache ? " cache" : ""}`, cache ? (mode === "montre" ? "?" : "") : pu));
      rang.appendChild(c);
      return {c, sym, pu};
    });
    boite.appendChild(rang);
    zone.appendChild(boite);
    if (mode !== "montre") return null;
    const voir = sym => {
      if (vues[sym]) return;
      vues[sym] = true;
      const x = cases.find(y => y.sym === sym);
      const p = x.c.querySelector(".pu");
      p.textContent = x.pu;
      p.classList.remove("cache");
      x.c.classList.remove("a-toucher");
      x.c.classList.add("on");
      if (aToucher.every(t => vues[t])) fini();
    };
    cases.forEach(x => { if (aToucher.includes(x.sym)) x.c.addEventListener("click", () => voir(x.sym)); });
    return enChaine(() => voir(aToucher.find(t => !vues[t])), () => aToucher.some(t => !vues[t]), 420);
  }

  // ================================================ lot B2-3a : l'aire (A5)
  // La figure sur son quadrillage (choix de Gwenaël du 20/11, maquette sur
  // la vraie page) : le carreau touché prend son numéro ; le demi touché
  // glisse compléter un autre demi et devient un carreau (« découper-
  // recoller », S002) ; pour comparer, B se pose sur A et on regarde ce qui
  // dépasse. Le contour épais et les numéros se lisent imprimés en noir et
  // blanc ; les couleurs sont celles de maths&go (turquoise pâle, vert des
  // réponses, orange).
  const A5C = {grille: "#c4d6e2", fond: "#d8f3f1", vert: "#147447", vertPale: "#bfe9cf", or: "#FA7D05", orPale: "#ffe0bf", orTexte: "#a14f00",
    tealTexte: "#087a71", melange: "#e3ecf2"};
  function sommetsA5(ch, x, y) {
    if (ch === "#") return [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
    if (ch === "a") return [[x, y], [x + 1, y], [x, y + 1]];
    if (ch === "b") return [[x, y], [x + 1, y], [x + 1, y + 1]];
    if (ch === "c") return [[x + 1, y], [x + 1, y + 1], [x, y + 1]];
    if (ch === "d") return [[x, y], [x + 1, y + 1], [x, y + 1]];
    return null;
  }
  // Le triangle libre d'un demi-carreau (là où l'autre demi vient se coller).
  const LIBRE_A5 = {a: "c", b: "d", c: "a", d: "b"};
  const centreA5 = p => [p.reduce((t, q) => t + q[0], 0) / p.length, p.reduce((t, q) => t + q[1], 0) / p.length];
  function piecesFigA5(fig, dx = 0, dy = 0) {
    const ps = [];
    fig.forEach((l, y) => [...l].forEach((ch, x) => { const p = sommetsA5(ch, x + dx, y + dy); if (p) ps.push({ch, x: x + dx, y: y + dy, p, demi: ch !== "#"}); }));
    return ps;
  }
  // Le contour : les côtés qui ne sont pas partagés par deux morceaux.
  function contourA5(ps) {
    const vus = new Map();
    ps.forEach(m => m.p.forEach((a, i) => {
      const b = m.p[(i + 1) % m.p.length];
      const k = [a, b].map(q => q.join(",")).sort().join("|");
      vus.set(k, (vus.get(k) || 0) + 1);
    }));
    return [...vus].filter(([, n]) => n === 1).map(([k]) => k.split("|").map(t => t.split(",").map(Number)));
  }
  const tailleFigA5 = fig => [Math.max(...fig.map(l => l.length)), fig.length];
  // Le quadrillage d'une boîte [x0, y0, x1, y1] (en carreaux) : la marge
  // aussi (on voit l'unité tout autour).
  function grilleA5(s, X, Y, [x0, y0, x1, y1], marge) {
    const g = svg("g", {stroke: A5C.grille, "stroke-width": 1.2});
    for (let i = Math.ceil(x0 - marge); i <= Math.floor(x1 + marge); i += 1) g.appendChild(svg("line", {x1: X(i), y1: Y(y0 - marge), x2: X(i), y2: Y(y1 + marge)}));
    for (let i = Math.ceil(y0 - marge); i <= Math.floor(y1 + marge); i += 1) g.appendChild(svg("line", {x1: X(x0 - marge), y1: Y(i), x2: X(x1 + marge), y2: Y(i)}));
    s.appendChild(g);
  }
  const ptsA5 = (p, X, Y) => p.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
  function traitA5(s, segs, X, Y, c, couleur = N, tirets = false) {
    segs.forEach(([a, b]) => s.appendChild(svg("line", Object.assign({x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: couleur,
      "stroke-width": Math.max(2.2, c / 11), "stroke-linecap": "round"}, tirets ? {"stroke-dasharray": `${c / 5} ${c / 7}`} : {}))));
  }
  // La figure. `etat` : {numeros: Map(index → texte), recolles: [[i, j]]
  // (le demi i collé dans la place libre du demi j), rangees (le nombre de
  // carreaux entiers au bout de chaque rangée), demisOr (les demis en
  // orange)}. Rend {s, ps, X, Y, c}.
  function figureA5(fig, {c = 30, marge = 0.5, classe = "dessin aire", lettre = "", etat = {}, titre = "Une figure sur un quadrillage"} = {}) {
    const [W, H] = tailleFigA5(fig);
    const plus = etat.rangees ? 1.2 : 0;
    const X = v => (v + marge) * c;
    const Y = X;
    const s = svg("svg", {viewBox: `0 0 ${((W + 2 * marge + plus) * c).toFixed(1)} ${((H + 2 * marge) * c).toFixed(1)}`, class: classe, role: "img", "aria-label": titre});
    grilleA5(s, X, Y, [0, 0, W, H], marge);
    const ps = piecesFigA5(fig);
    const numeros = etat.numeros || new Map();
    const recolles = etat.recolles || [];
    const partis = new Set(recolles.map(r => r[0]));
    const recus = new Map(recolles.map(r => [r[1], r[0]]));
    ps.forEach((m, i) => {
      if (partis.has(i)) {
        s.appendChild(svg("polygon", {points: ptsA5(m.p, X, Y), fill: "#ffffff", stroke: A5C.or, "stroke-width": 1.6, "stroke-dasharray": "4 3"}));
        return;
      }
      const touche = numeros.has(i) || recus.has(i);
      const fond = touche ? (m.demi ? A5C.orPale : A5C.vertPale) : m.demi && etat.demisOr ? A5C.orPale : A5C.fond;
      s.appendChild(svg("polygon", {points: ptsA5(m.p, X, Y), fill: fond, stroke: A5C.grille, "stroke-width": 1}));
      if (recus.has(i)) {
        const vient = svg("polygon", {points: ptsA5(sommetsA5(LIBRE_A5[m.ch], m.x, m.y), X, Y), fill: A5C.orPale, stroke: A5C.or, "stroke-width": 1.6, class: "recolle"});
        vient.dataset.de = String(recus.get(i));
        s.appendChild(vient);
      }
    });
    traitA5(s, contourA5(ps), X, Y, c);
    // Les numéros : au centre du carreau (entier, ou complété).
    ps.forEach((m, i) => {
      const t = numeros.get(i);
      if (t === undefined || partis.has(i)) return;
      const [cx, cy] = recus.has(i) ? [m.x + 0.5, m.y + 0.5] : centreA5(m.p);
      const petit = t === "½";
      s.appendChild(svg("text", {x: X(cx), y: Y(cy) + c * (petit ? 0.14 : 0.17), "text-anchor": "middle", "font-size": (c * (petit ? 0.4 : t.length > 1 ? 0.44 : 0.5)).toFixed(1),
        "font-weight": 900, fill: m.demi && !recus.has(i) ? A5C.orTexte : A5C.vert}, t));
    });
    if (etat.rangees) {
      fig.forEach((l, y) => {
        const n = [...l].filter(ch => ch === "#").length;
        s.appendChild(svg("text", {x: X(W + 0.15), y: Y(y + 0.5) + c * 0.16, "font-size": (c * 0.44).toFixed(1), "font-weight": 900, fill: N}, String(n)));
      });
    }
    if (lettre) s.appendChild(svg("text", {x: X(-marge + 0.08), y: Y(-marge + 0.42), "font-size": (c * 0.46).toFixed(1), "font-weight": 900, fill: N}, lettre));
    return {s, ps, X, Y, c};
  }

  // L'outil (et On te montre) : on touche chaque morceau. Un carreau
  // entier prend le numéro suivant ; un demi glisse compléter le demi le plus
  // proche (pas encore touché), et le carreau complété prend le numéro
  // suivant. Le compteur dit combien de carreaux. Rend `jouer` (tout
  // toucher, un morceau à la fois).
  function aireCompter(zone, fig, {fini = () => {}, classe = "dessin aire aire-z", compteur = null} = {}) {
    const numeros = new Map();
    const recolles = [];
    let n = 0;
    let dernier = null;
    const boite = el("div", "aire-boite");
    zone.appendChild(boite);
    const total = piecesFigA5(fig).length;
    const faits = () => numeros.size + recolles.length;
    const dire = () => { if (compteur) compteur.textContent = n ? carte().typo(`${n} carreau${n > 1 ? "x" : ""}`) : ""; };
    function dessiner() {
      boite.textContent = "";
      const f = figureA5(fig, {classe, etat: {numeros, recolles}});
      // Le doigt touche un carreau entier : la case de la grille où il est.
      const pris = new Set([...numeros.keys(), ...recolles.flat()]);
      f.ps.forEach((m, i) => {
        const r = svg("rect", {x: f.X(m.x), y: f.Y(m.y), width: f.c, height: f.c, fill: "transparent", class: `zone-a5${pris.has(i) ? "" : " a-toucher"}`});
        r.addEventListener("click", ev => { ev.stopPropagation(); toucher(i); });
        f.s.appendChild(r);
      });
      boite.appendChild(f.s);
      // Le demi qui vient d'être recollé glisse depuis sa place.
      if (dernier !== null) {
        const v = f.s.querySelector(`polygon.recolle[data-de="${dernier[0]}"]`);
        if (v && v.animate) {
          const a = centreA5(f.ps[dernier[0]].p); const b = [f.ps[dernier[1]].x + 0.5, f.ps[dernier[1]].y + 0.5];
          v.animate([{transform: `translate(${((a[0] - b[0]) * f.c).toFixed(1)}px, ${((a[1] - b[1]) * f.c).toFixed(1)}px)`}, {transform: "translate(0px, 0px)"}],
            {duration: 420, easing: "ease-out"});
        }
        dernier = null;
      }
    }
    function toucher(i) {
      const ps = piecesFigA5(fig);
      const m = ps[i];
      const pris = new Set([...numeros.keys(), ...recolles.flat()]);
      if (pris.has(i)) return;
      if (!m.demi) { n += 1; numeros.set(i, String(n)); }
      else {
        // Le demi libre le plus proche.
        const [cx, cy] = centreA5(m.p);
        const autres = ps.map((p, j) => [p, j]).filter(([p, j]) => p.demi && j !== i && !pris.has(j))
          .sort((u, v) => Math.hypot(centreA5(u[0].p)[0] - cx, centreA5(u[0].p)[1] - cy) - Math.hypot(centreA5(v[0].p)[0] - cx, centreA5(v[0].p)[1] - cy));
        if (!autres.length) { numeros.set(i, "½"); }
        else {
          const j = autres[0][1];
          n += 1;
          recolles.push([i, j]);
          numeros.set(j, String(n));
          dernier = [i, j];
        }
      }
      dire();
      dessiner();
      if (ps.every((p, k) => numeros.has(k) || recolles.some(r => r.includes(k)))) fini();
    }
    dire();
    dessiner();
    // Pour le robot et « Suivant » sans le geste : le prochain morceau.
    const prochain = () => {
      const pris = new Set([...numeros.keys(), ...recolles.flat()]);
      const ps = piecesFigA5(fig);
      // Les carreaux entiers d'abord, puis les demis.
      const k = ps.findIndex((p, j) => !p.demi && !pris.has(j));
      return k >= 0 ? k : ps.findIndex((p, j) => !pris.has(j));
    };
    return enChaine(() => toucher(prochain()), () => faits() < total && prochain() >= 0, 260);
  }

  // Superposer : A, et B à côté ; B touché vient se poser sur A, décalée de
  // (dx, dy) (le décalage qui recouvre le plus, calculé par le générateur).
  // Ce qui ne dépasse pas se mêle ; ce qui dépasse garde sa couleur et sa
  // lettre. `pose` : déjà posée (l'image, la correction).
  function bitsA5(k) { return (k & 1) + ((k >> 1) & 1) + ((k >> 2) & 1) + ((k >> 3) & 1); }
  const QUART_A5 = {"#": 15, a: 9, b: 3, c: 6, d: 12};
  function quartPolyA5(x, y, k) {
    const c = [x + 0.5, y + 0.5];
    return [[[x, y], [x + 1, y], c], [[x + 1, y], [x + 1, y + 1], c], [[x + 1, y + 1], [x, y + 1], c], [[x, y + 1], [x, y], c]][k];
  }
  function aireSuperposer(zone, A, B, {dx = 0, dy = 0, pose = false, fini = () => {}, classe = "dessin aire aire-z", note = null} = {}) {
    const [wa, ha] = tailleFigA5(A);
    const [wb, hb] = tailleFigA5(B);
    const cote = [wa + 1, 0];
    // (Déjà posée : la boîte des deux figures posées, pas la place de B à
    // côté — le dessin reste grand dans la correction.)
    const x0 = Math.min(0, dx); const y0 = Math.min(0, dy);
    const x1 = pose ? Math.max(wa, dx + wb) : Math.max(wa, wa + 1 + wb, dx + wb);
    const y1 = pose ? Math.max(ha, dy + hb) : Math.max(ha, hb, dy + hb);
    const c = 30; const marge = 0.5;
    const X = v => (v - x0 + marge) * c;
    const Y = v => (v - y0 + marge) * c;
    const boite = el("div", "aire-boite");
    zone.appendChild(boite);
    let posee = pose;
    function dessiner(animer) {
      boite.textContent = "";
      const s = svg("svg", {viewBox: `0 0 ${((x1 - x0 + 2 * marge) * c).toFixed(1)} ${((y1 - y0 + 2 * marge) * c).toFixed(1)}`,
        class: `${classe}${posee ? "" : " a-toucher"}`, role: "img", "aria-label": posee ? "La figure B posée sur la figure A" : "La figure A, et la figure B à côté"});
      grilleA5(s, X, Y, [x0, y0, x1, y1], marge);
      const pa = piecesFigA5(A);
      const [bx, by] = posee ? [dx, dy] : cote;
      const pb = piecesFigA5(B, bx, by);
      const qa = new Map(pa.map(p => [`${p.x},${p.y}`, QUART_A5[p.ch]]));
      const qb = new Map(pb.map(p => [`${p.x},${p.y}`, QUART_A5[p.ch]]));
      // A : turquoise pâle ; là où B la recouvre, gris-bleu.
      pa.forEach(p => s.appendChild(svg("polygon", {points: ptsA5(p.p, X, Y), fill: A5C.fond, stroke: A5C.grille, "stroke-width": 1})));
      const gb = svg("g", {class: "fig-b"});
      if (posee) {
        qb.forEach((k, cle) => {
          const [x, y] = cle.split(",").map(Number);
          const ka = qa.get(cle) || 0;
          [0, 1, 2, 3].forEach(q => {
            if (!(k & (1 << q))) return;
            gb.appendChild(svg("polygon", {points: ptsA5(quartPolyA5(x, y, q), X, Y), fill: ka & (1 << q) ? A5C.melange : A5C.orPale}));
          });
        });
      } else pb.forEach(p => gb.appendChild(svg("polygon", {points: ptsA5(p.p, X, Y), fill: A5C.orPale, stroke: A5C.grille, "stroke-width": 1})));
      s.appendChild(gb);
      // Les quarts de A qui dépassent : turquoise plus fort.
      if (posee) {
        qa.forEach((k, cle) => {
          const [x, y] = cle.split(",").map(Number);
          const kb = qb.get(cle) || 0;
          [0, 1, 2, 3].forEach(q => { if ((k & (1 << q)) && !(kb & (1 << q))) s.appendChild(svg("polygon", {points: ptsA5(quartPolyA5(x, y, q), X, Y), fill: "#9fe0dc"})); });
        });
      }
      traitA5(s, contourA5(pa), X, Y, c);
      const cb = svg("g", {});
      traitA5(cb, contourA5(pb), X, Y, c, A5C.or, true);
      s.appendChild(cb);
      // Les lettres : A et B dans leur coin ; posée, sur ce qui dépasse.
      const lettre = (t, x, y, coul) => s.appendChild(svg("text", {x: X(x), y: Y(y) + c * 0.17, "text-anchor": "middle", "font-size": (c * 0.46).toFixed(1), "font-weight": 900, fill: coul}, t));
      if (!posee) {
        lettre("A", -0.25, -0.28, N);
        lettre("B", bx - 0.25, by - 0.28, A5C.orTexte);
      } else {
        const marquer = (qx, qy, t, coul) => qx.forEach((k, cle) => {
          const [x, y] = cle.split(",").map(Number);
          const seul = k & ~(qy.get(cle) || 0);
          if (bitsA5(seul) < 2) return;
          const pts = [0, 1, 2, 3].filter(q => seul & (1 << q)).flatMap(q => quartPolyA5(x, y, q));
          const [cx, cy] = centreA5(pts);
          lettre(t, cx, cy, coul);
        });
        marquer(qa, qb, "A", A5C.tealTexte);
        marquer(qb, qa, "B", A5C.orTexte);
      }
      if (!posee) s.addEventListener("click", poser);
      boite.appendChild(s);
      if (animer && gb.animate) {
        const t = `translate(${((cote[0] - dx) * c).toFixed(1)}px, ${((cote[1] - dy) * c).toFixed(1)}px)`;
        [gb, cb].forEach(g => g.animate([{transform: t, opacity: 0.6}, {transform: "translate(0px, 0px)", opacity: 1}], {duration: 520, easing: "ease-out"}));
      }
    }
    function poser() {
      if (posee) return;
      posee = true;
      dessiner(true);
      if (note) zone.appendChild(el("div", "note", note));
      fini();
    }
    dessiner(false);
    if (pose) { if (note) zone.appendChild(el("div", "note", note)); return null; }
    return poser;
  }

  // La tache à encadrer : l'ellipse sur son quadrillage. `cases` : 2 dedans
  // (vert), 1 touchée (orange), 0 rien. À toucher (l'outil) : chaque
  // carreau passe de rien à « dedans », puis à « touché », puis à rien.
  function aireTache(zone, t, {montrer = false, toucher = false, compteur = null, classe = "dessin aire aire-z", marge = 0.5} = {}) {
    const c = 30;
    const X = v => (v + marge) * c;
    const etats = montrer ? t.cases.slice() : t.cases.map(() => 0);
    const boite = el("div", "aire-boite");
    zone.appendChild(boite);
    const dire = () => {
      if (!compteur) return;
      const dedans = etats.filter(k => k === 2).length;
      compteur.textContent = carte().typo(`Dedans : ${dedans} · En tout : ${etats.filter(k => k > 0).length}`);
    };
    function dessiner() {
      boite.textContent = "";
      const s = svg("svg", {viewBox: `0 0 ${((t.W + 2 * marge) * c).toFixed(1)} ${((t.H + 2 * marge) * c).toFixed(1)}`, class: `${classe}${toucher ? " a-toucher" : ""}`,
        role: "img", "aria-label": "Une tache sur un quadrillage"});
      etats.forEach((k, i) => {
        if (!k) return;
        s.appendChild(svg("rect", {x: X(i % t.W), y: X(Math.floor(i / t.W)), width: c, height: c, fill: k === 2 ? A5C.vertPale : A5C.orPale}));
      });
      grilleA5(s, X, X, [0, 0, t.W, t.H], marge);
      s.appendChild(svg("ellipse", {cx: X(t.cx), cy: X(t.cy), rx: t.rx * c, ry: t.ry * c, fill: etats.some(Boolean) ? "rgba(0,175,170,.16)" : A5C.fond,
        stroke: N, "stroke-width": 3, "pointer-events": "none"}));
      if (toucher) {
        etats.forEach((k, i) => {
          const r = svg("rect", {x: X(i % t.W), y: X(Math.floor(i / t.W)), width: c, height: c, fill: "transparent", class: "zone-a5"});
          r.addEventListener("click", () => { etats[i] = [2, 0, 1][k]; dire(); dessiner(); });
          s.appendChild(r);
        });
      }
      boite.appendChild(s);
    }
    dire();
    dessiner();
  }

  // Les entrées de A5 : l'outil, l'image, la correction.
  function compteurA5(zone) {
    const p = el("span", "compteur-a5", "");
    zone.appendChild(p);
    return p;
  }
  function outilAire(zone, question) {
    const a = question.aire;
    if (a.sorte === "compter") {
      const p = compteurA5(zone);
      aireCompter(zone, a.fig, {compteur: p});
      const demis = piecesFigA5(a.fig).some(m => m.demi);
      zone.appendChild(el("div", "note", carte().typo(demis ? "Un demi touché complète l'autre." : a.unite === "cm2" ? "1 carreau = 1 cm²" : "Touche chaque carreau.")));
      return;
    }
    if (a.sorte === "encadrer") {
      const p = compteurA5(zone);
      aireTache(zone, a.tache, {toucher: true, compteur: p});
      zone.appendChild(el("div", "note", "Touche : vert dedans, orange à moitié."));
      return;
    }
    aireSuperposer(zone, a.a, a.b, {dx: a.dx, dy: a.dy, note: "Je compare ce qui dépasse."});
    zone.appendChild(el("div", "note consigne-b", "Touche B pour la poser sur A."));
  }
  function imageAire(zone, question) {
    const a = question.aire;
    if (a.sorte === "compter") {
      const demis = piecesFigA5(a.fig).some(m => m.demi);
      const f = figureA5(a.fig, {classe: "dessin aire aire-z", etat: {rangees: true, demisOr: demis}});
      const b = el("div", "aire-boite"); b.appendChild(f.s); zone.appendChild(b);
      zone.appendChild(el("div", "note", carte().typo(question.image[0])));
      return;
    }
    if (a.sorte === "encadrer") {
      aireTache(zone, a.tache, {});
      zone.appendChild(lignes("rel petite libre", question.image.join("\n")));
      return;
    }
    aireSuperposer(zone, a.a, a.b, {dx: a.dx, dy: a.dy, pose: true, note: "Je compare ce qui dépasse."});
  }
  // La correction : le dessin complété à gauche, les lignes à droite (la
  // dernière en vert, si elle commence par « = »).
  function correctionAire(zone, question) {
    const a = question.aire;
    // (Comparer, encadrer : le dessin est large, les lignes dessous. Sans
    // aide — Je valide, Je me souviens —, les figures de la question sont
    // grandes et la place manque : les lignes seules.)
    const ligne = el("div", `aire-corr${a.sorte === "compter" ? "" : ` col ${a.sorte}`}`);
    const sansOutil = root.document && root.document.getElementById("cadre") && root.document.getElementById("cadre").classList.contains("sans-outil");
    if (a.sorte !== "compter" && sansOutil) {
      const droite = el("div", "aire-lignes grandes");
      question.correction.flatMap(t => t.split(" · ")).forEach(t => droite.appendChild(el("div", /^=/.test(t) ? "v" : "", carte().typo(t))));
      ligne.appendChild(droite);
      zone.appendChild(ligne);
      return;
    }
    const gauche = el("div", "aire-boite");
    if (a.sorte === "compter") {
      const ps = piecesFigA5(a.fig);
      const numeros = new Map();
      const recolles = [];
      let n = 0;
      ps.forEach((m, i) => { if (!m.demi) numeros.set(i, String(++n)); });
      const demis = ps.map((m, i) => (m.demi ? i : -1)).filter(i => i >= 0);
      // (Les demis recollés deux à deux, le plus proche d'abord.)
      const libres = demis.slice();
      while (libres.length > 1) {
        const i = libres.shift();
        const [cx, cy] = centreA5(ps[i].p);
        libres.sort((u, v) => Math.hypot(centreA5(ps[u].p)[0] - cx, centreA5(ps[u].p)[1] - cy) - Math.hypot(centreA5(ps[v].p)[0] - cx, centreA5(ps[v].p)[1] - cy));
        const j = libres.shift();
        recolles.push([i, j]);
        numeros.set(j, String(++n));
      }
      gauche.appendChild(figureA5(a.fig, {classe: "dessin aire aire-c", etat: {numeros, recolles}}).s);
    } else if (a.sorte === "encadrer") {
      aireTache(gauche, a.tache, {montrer: true, classe: "dessin aire aire-c"});
    } else {
      aireSuperposer(gauche, a.a, a.b, {dx: a.dx, dy: a.dy, pose: true, classe: "dessin aire aire-c"});
    }
    const droite = el("div", "aire-lignes");
    question.correction.forEach(t => {
      const d = el("div", /^=/.test(t) ? "v" : "", carte().typo(t));
      droite.appendChild(d);
    });
    ligne.append(gauche, droite);
    zone.appendChild(ligne);
  }
  // On te montre.
  function montrerAire(zone, aide, fini) {
    // (Sans compteur : l'étiquette « On te montre · Je représente » prend
    // la largeur ; le compte s'écrit dessous quand le geste est fait.)
    if (aide.type === "aire-compter") return aireCompter(zone, aide.fig, {fini});
    const poser = aireSuperposer(zone, aide.a, aide.b, {fini});
    return poser;
  }

  // ======================================================= lot B3-1 (R7, R9)
  // Le repère reporté (choix de Gwenaël du 21/11, R7) : le repère dessiné
  // n fois bout à bout, une cote « ≈ 4 m » au-dessus du premier, un trait
  // entre deux repères qui descend jusqu'à l'objet, l'objet dessous (sa
  // longueur en quarts de repère). Tout est placé d'après la place des
  // repères (en unités du dessin), jamais en pourcentages. Le nom de
  // l'objet et la note sont en HTML sous le dessin (une police large ne
  // les fait pas sortir). `mode` : "outil" (« Le bassin : ? »),
  // "correction" (les traits et la mesure en vert), "montre" (un repère
  // de plus à chaque toucher, puis la mesure en vert).
  function reporte(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const n = Number(aide.n);
    const quarts = Number(aide.quarts);
    const W = 340;
    const x0 = 16;
    const pas = Math.min(50, (W - 2 * x0) / Math.max(n, quarts / 4));
    const yV = 24;
    const hV = 38;
    const yB = 78;
    const hB = 22;
    const H = yB + hB + 4;
    const boite = el("div", "dessin-boite reporte-boite");
    const dessin = svg("svg", {viewBox: `0 0 ${W} ${H}`, class: `dessin reporte${mode === "montre" ? " a-toucher" : ""}`, role: "img",
      "aria-label": `${n} ${aide.plusieurs || "repères"} bout à bout le long de l'objet`});
    const legende = el("div", "rep-nom");
    boite.append(dessin, legende);
    zone.appendChild(boite);
    let vus = mode === "montre" ? 1 : n;
    const image = `./conversions-reperes/${(carte().repere(aide.repere) || {}).image || `${aide.repere}.webp`}`;
    function dessiner() {
      dessin.textContent = "";
      const fin = mode === "correction" || (mode === "montre" && vus >= n);
      const couleur = fin ? VERT : ENCRE;
      if (mode === "montre") dessin.appendChild(svg("rect", {x: 0, y: 0, width: W, height: H, fill: "transparent"}));
      // la cote du repère, au-dessus du premier (lot B3-1c : à 19, 14 px au
      // moins au petit Android ; à 17, 13,5 px)
      dessin.appendChild(svg("path", {d: `M${x0} 9v9M${x0 + pas} 9v9M${x0} 13.5H${x0 + pas}`, fill: "none", stroke: ENCRE, "stroke-width": 1.8, "stroke-linecap": "round"}));
      dessin.appendChild(svg("text", {x: x0 + pas + 5, y: 19, "font-size": 19, "font-weight": 900, fill: ENCRE}, `≈${NB}${aide.mesure}`));
      for (let k = 0; k < vus; k += 1) {
        const x = x0 + k * pas;
        dessin.appendChild(svg("image", {href: image, x: x + 1, y: yV, width: pas - 2, height: hV, preserveAspectRatio: "xMidYMax meet"}));
      }
      for (let k = 0; k <= vus; k += 1) {
        const x = x0 + k * pas;
        dessin.appendChild(svg("line", {x1: x, y1: yV + hV + 3, x2: x, y2: yB, stroke: couleur, "stroke-width": 1.8, "stroke-linecap": "round"}));
      }
      // l'objet
      const L = (quarts / 4) * pas;
      dessin.appendChild(svg("rect", {x: x0, y: yB, width: L, height: hB, rx: 3, fill: aide.eau ? "#d8f3f2" : "#f3ede0", stroke: ENCRE, "stroke-width": 2.2}));
      if (aide.eau) {
        dessin.appendChild(svg("path", {d: `M${x0 + 10} ${yB + 8}q6 -4 12 0t12 0M${x0 + L / 2 - 12} ${yB + 14}q6 -4 12 0t12 0M${x0 + L - 40} ${yB + 8}q6 -4 12 0t12 0`,
          fill: "none", stroke: "#00AFAA", "stroke-width": 1.8, "stroke-linecap": "round"}));
      }
      legende.textContent = "";
      legende.append(texteNoeudA(`${aide.nom}${NB}: `), el("span", fin ? "rep-v" : "rep-q", fin ? aide.total : "?"));
    }
    dessiner();
    if (aide.note) boite.appendChild(el("div", "note", carte().typo(aide.note)));
    if (mode !== "montre") return null;
    const toucher = () => {
      if (vus >= n) return;
      vus += 1;
      dessiner();
      if (vus >= n) fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => vus < n, 320);
  }
  function texteNoeudA(t) {
    return root.document.createTextNode(t);
  }

  // Estimer un calcul (R7, choix de Gwenaël du 21/11) : chaque nombre et
  // son arrondi, un par ligne (« 212 m → 200 m »), jamais le résultat.
  // "montre" : l'arrondi s'écrit quand on touche la ligne.
  function arrondis(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const bloc = el("div", `arrondis${mode === "correction" ? " ar-corr" : ""}${mode === "montre" ? " ar-montre" : ""}`);
    const lignesA = [];
    let vus = mode === "montre" ? 0 : aide.paires.length;
    aide.paires.forEach(([a, r], k) => {
      const l = el("div", `ar${mode === "montre" ? " a-toucher" : ""}`);
      const droite = el("span", "r", mode === "montre" ? "" : carte().typo(r));
      // (Lot B3-1c : le « ? » garde la place de l'arrondi, caché dessous ;
      // rien ne s'élargit quand l'arrondi s'écrit.)
      if (mode === "montre") { droite.classList.add("ar-q"); droite.append(el("span", "ar-v", carte().typo(r)), el("span", "ar-qm", "?")); }
      l.append(el("span", "a", carte().typo(a)), el("span", "f", "→"), droite);
      bloc.appendChild(l);
      lignesA.push([l, droite, r]);
      if (mode === "montre") {
        l.addEventListener("click", () => {
          if (!l.classList.contains("a-toucher")) return;
          l.classList.remove("a-toucher");
          droite.classList.remove("ar-q");
          droite.textContent = carte().typo(r);
          vus += 1;
          if (vus >= aide.paires.length) fini();
        });
      }
    });
    zone.appendChild(bloc);
    if (aide.note) zone.appendChild(el("div", "note", aide.note));
    if (mode !== "montre") return null;
    const suivant = () => { const x = lignesA.find(([l]) => l.classList.contains("a-toucher")); if (x) x[0].click(); };
    return enChaine(suivant, () => vus < aide.paires.length, 420);
  }

  // Le périmètre et l'aire (R9, choix de Gwenaël du 21/11) : deux jardins
  // côte à côte, le tour en bleu avec la flèche qui en fait le tour, la
  // surface en carreaux ; sous chacun, le mot en gras et son sens en gris
  // (en HTML). `bonne` : "perimetre" ou "aire" (la correction la marque ;
  // On te montre : on touche le bon dessin).
  function perimAire(zone, {bonne = null, mode = "outil", fini = () => {}} = {}) {
    const boite = el("div", `perim-aire${mode === "correction" ? " pa-corr" : ""}`);
    const figure = (cle, dessin, mot, sens) => {
      const f = el("div", `pa-fig${mode === "montre" ? " a-toucher" : ""}${mode === "correction" && cle === bonne ? " bonne" : ""}${mode === "correction" && cle !== bonne ? " autre" : ""}`);
      f.dataset.cle = cle;
      const t = el("div", "pa-t");
      t.append(el("b", "", mot), el("span", "", sens));
      f.append(dessin, t);
      return f;
    };
    const a = svg("svg", {viewBox: "0 0 140 92", class: "dessin pa", role: "img", "aria-label": "Le tour de la figure"});
    a.appendChild(svg("rect", {x: 10, y: 24, width: 120, height: 60, rx: 1, fill: "#f4f8fb"}));
    a.appendChild(svg("rect", {x: 10, y: 24, width: 120, height: 60, rx: 1, fill: "none", stroke: BLEU, "stroke-width": 5}));
    a.appendChild(svg("path", {d: "M44 10H88", stroke: BLEU, "stroke-width": 2.6, fill: "none", "stroke-linecap": "round"}));
    a.appendChild(svg("path", {d: "M97 10l-10 -5.5v11z", fill: BLEU}));
    const b = svg("svg", {viewBox: "0 0 140 92", class: "dessin pa", role: "img", "aria-label": "La surface de la figure, en carreaux"});
    const gx = 8;
    const gy = 22;
    const c = 15.5;
    for (let i = 0; i < 8; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        b.appendChild(svg("rect", {x: gx + i * c, y: gy + j * c, width: c, height: c, fill: (i + j) % 2 ? "#b9ebe8" : "#d8f3f2", stroke: ENCRE, "stroke-width": 0.9}));
      }
    }
    b.appendChild(svg("rect", {x: gx, y: gy, width: 8 * c, height: 4 * c, fill: "none", stroke: ENCRE, "stroke-width": 2.2}));
    const fa = figure("perimetre", a, "le périmètre", "le tour");
    const fb = figure("aire", b, "l'aire", "la surface");
    boite.append(fa, fb);
    zone.appendChild(boite);
    if (mode !== "montre") return null;
    let fait = false;
    const choisirFig = f => {
      if (fait) return;
      if (f.dataset.cle !== bonne) { f.classList.remove("non"); void f.offsetWidth; f.classList.add("non"); return; }
      fait = true;
      [fa, fb].forEach(x => { x.classList.remove("a-toucher", "non"); x.classList.add(x === f ? "bonne" : "autre"); });
      fini();
    };
    [fa, fb].forEach(f => f.addEventListener("click", () => choisirFig(f)));
    return () => choisirFig(bonne === "aire" ? fb : fa);
  }

  // ======================================================= lot B3-2 (A1, A2, C9)
  // Choix de Gwenaël du 21/11 (lot B3-2a, sur la maquette) : A1, le carré
  // quadrillé qu'on touche, une rangée de plus à chaque fois ; A2, le
  // découpage en carrés de 1 dm² au degré 1, le calcul ensuite ; C9, la
  // droite graduée de 3 m à 4 m pour l'arrondi. Aucun ne donne la réponse :
  // le compteur s'arrête quand l'élève s'arrête, la ligne du calcul ne dit
  // jamais le résultat, la droite n'écrit rien en vert avant la correction.
  const B32C = {grille: "#c4d6e2", fond: "#d8f3f1", touche: "#8fdcd6", fondV: "#e5f7eb", toucheV: "#9fd9b4", milieu: "#b45d00"};
  // Une cote : un trait, deux petits traits au bout, le texte au milieu.
  function coteB32(s, x1, y1, x2, y2, t) {
    if (y1 === y2) {
      s.appendChild(svg("path", {d: `M${x1} ${y1 - 4}v8M${x2} ${y1 - 4}v8M${x1} ${y1}H${x2}`, stroke: N, "stroke-width": 1.6, fill: "none"}));
      s.appendChild(svg("text", {x: (x1 + x2) / 2, y: y1 - 8, "text-anchor": "middle", "font-size": 24, "font-weight": 900, fill: N}, t));
    } else {
      s.appendChild(svg("path", {d: `M${x1 - 4} ${y1}h8M${x1 - 4} ${y2}h8M${x1} ${y1}V${y2}`, stroke: N, "stroke-width": 1.6, fill: "none"}));
      s.appendChild(svg("text", {x: x1 - 7, y: (y1 + y2) / 2 + 8, "text-anchor": "end", "font-size": 24, "font-weight": 900, fill: N}, t));
    }
  }

  // A1 · le carré de 1 dm² (ou de 1 m²) quadrillé 10 × 10, cotes « 10 cm »
  // en haut et à gauche. `mode` : "outil" et "montre" (on touche le carré
  // ENTIER, une rangée de plus : au petit iPhone une rangée fait 9 px, ce
  // n'est jamais une zone à toucher seule ; le compteur à droite dit « 30
  // carreaux »), "image" (le quadrillage seul), "correction" (en vert).
  // `n` : les rangées déjà coloriées (la correction des rangées).
  function carreA1(zone, aide, {mode = "outil", fini = () => {}, n: n0 = 0} = {}) {
    const touche = mode === "outil" || mode === "montre";
    const vert = mode === "correction";
    // (Lot B3-2c : les cotes à 24, 14 px au moins dans la correction au
    // petit iPhone, et « 10 cm » à gauche reste dans le dessin avec une
    // police large : vu en gros plan, « 1 » coupé à x0 = 92.)
    const c = 12;
    const x0 = 106;
    const y0 = 41;
    const L = 10 * c;
    const W = x0 + L + 14;
    const H = y0 + L + 8;
    const ligne = el("div", "a1-ligne");
    const dessin = svg("svg", {viewBox: `0 0 ${W} ${H}`, class: `dessin a1-carre${touche ? " a-toucher" : ""}`, role: "img",
      "aria-label": carte().typo(`Un carré de 1 ${aide.grande || "dm²"} quadrillé en carreaux de 1 ${aide.petite}`)});
    const compteur = touche ? el("span", "compteur-a1", "") : null;
    if (compteur) compteur.setAttribute("aria-live", "polite");
    ligne.appendChild(dessin);
    if (compteur) ligne.appendChild(compteur);
    zone.appendChild(ligne);
    // (Lot B3-2c, relecture : la correction de « je colorie 3 rangées »
    // montrait le carré entier en vert ; seulement les n rangées.)
    let n = vert ? (n0 || 10) : n0;
    function dessiner() {
      dessin.textContent = "";
      coteB32(dessin, x0, y0 - 10, x0 + L, y0 - 10, carte().typo(aide.cote));
      coteB32(dessin, x0 - 10, y0, x0 - 10, y0 + L, carte().typo(aide.cote));
      for (let j = 0; j < 10; j += 1) {
        for (let i = 0; i < 10; i += 1) {
          const plein = j < n;
          dessin.appendChild(svg("rect", {x: x0 + i * c, y: y0 + j * c, width: c, height: c,
            fill: plein ? (vert ? B32C.toucheV : B32C.touche) : (vert ? B32C.fondV : B32C.fond), stroke: B32C.grille, "stroke-width": 1.1}));
        }
      }
      dessin.appendChild(svg("rect", {x: x0, y: y0, width: L, height: L, fill: "none", stroke: vert ? VERT : N, "stroke-width": 2.6}));
      // la dernière rangée venue, soulignée en orange
      if (!vert && n > 0 && n < 10) dessin.appendChild(svg("path", {d: `M${x0} ${y0 + n * c}H${x0 + L}`, stroke: OR2, "stroke-width": 2.6}));
      if (compteur) compteur.textContent = n ? carte().typo(`${n * 10} carreaux`) : "";
    }
    dessiner();
    if (!touche) return null;
    const toucher = () => {
      if (n >= 10) return;
      n += 1;
      dessiner();
      if (n >= 10) { dessin.classList.remove("a-toucher"); fini(); }
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => n < 10, 260);
  }

  // A2 · le découpage : n carrés de 1 dm² entiers (« 100 cm² » sous
  // chacun) et d rangées d'un carré de plus (en pointillé). Quatre carrés
  // dessinés au plus. "montre" : chaque toucher ouvre le carré suivant.
  // (Lot B3-2c : le nom du dessin accordé, sans « et 0 rangées ».)
  function decoupeTexteA2(n, d, aide) {
    const carres = n ? `${n} carré${n > 1 ? "s" : ""} de 1 ${aide.grande}` : "";
    const rangees = d ? `${d} rangée${d > 1 ? "s" : ""} de 10 ${aide.petite}` : "";
    return [carres, rangees].filter(Boolean).join(" et ");
  }
  function decoupeA2(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const n = Number(aide.n);
    const d = Number(aide.d);
    const vert = mode === "correction";
    const c = 6.2;
    const L = 10 * c;
    // (Lot B3-2c : « 100 cm² » à 15,5, 14 px au moins dans la correction ;
    // 16 entre deux carrés, les deux étiquettes ne se touchent pas.)
    const gap = 16;
    const x0 = 6;
    const y0 = 6;
    const nb = n + (d ? 1 : 0);
    const W = x0 * 2 + nb * L + (nb - 1) * gap;
    const H = y0 + L + 27;
    const boite = el("div", "dessin-boite a2-boite");
    const dessin = svg("svg", {viewBox: `0 0 ${W} ${H}`, class: `dessin a2-decoupe${mode === "montre" ? " a-toucher" : ""}`, role: "img",
      "aria-label": carte().typo(decoupeTexteA2(n, d, aide))});
    dessin.style.setProperty("--a2-n", String(nb));
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let vus = mode === "montre" ? 0 : nb;
    function unCarre(k, rangees, ouvert) {
      const x = x0 + k * (L + gap);
      const plein = ouvert ? rangees : 0;
      for (let j = 0; j < 10; j += 1) {
        dessin.appendChild(svg("rect", {x, y: y0 + j * c, width: L, height: c, fill: j < plein ? (vert ? B32C.toucheV : B32C.touche) : "#ffffff", stroke: "none"}));
      }
      if (ouvert) {
        const g = svg("g", {stroke: B32C.grille, "stroke-width": 0.7});
        for (let i = 1; i < 10; i += 1) {
          g.appendChild(svg("line", {x1: x + i * c, y1: y0, x2: x + i * c, y2: y0 + L}));
          g.appendChild(svg("line", {x1: x, y1: y0 + i * c, x2: x + L, y2: y0 + i * c}));
        }
        dessin.appendChild(g);
      }
      dessin.appendChild(svg("rect", {x, y: y0, width: L, height: L, fill: "none", stroke: vert ? VERT : N, "stroke-width": 2.2, "stroke-dasharray": rangees < 10 ? "4 3" : "none"}));
      if (ouvert && rangees < 10) dessin.appendChild(svg("path", {d: `M${x} ${y0 + rangees * c}H${x + L}`, stroke: vert ? VERT : N, "stroke-width": 2.2}));
      if (ouvert && rangees === 10) dessin.appendChild(svg("text", {x: x + L / 2, y: y0 + L + 19, "text-anchor": "middle", "font-size": 15.5, "font-weight": 900, fill: vert ? VERT : N}, carte().typo(`100 ${aide.petite}`)));
    }
    function dessiner() {
      dessin.textContent = "";
      if (mode === "montre") dessin.appendChild(svg("rect", {x: 0, y: 0, width: W, height: H, fill: "transparent"}));
      for (let k = 0; k < n; k += 1) unCarre(k, 10, k < vus);
      if (d) unCarre(n, d, n < vus);
    }
    dessiner();
    if (mode !== "montre") return null;
    const toucher = () => {
      if (vus >= nb) return;
      vus += 1;
      dessiner();
      if (vus >= nb) { dessin.classList.remove("a-toucher"); fini(); }
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return enChaine(toucher, () => vus < nb, 380);
  }

  // A2 · le calcul (degrés 2 et 3) : « 3,7 dm² = 3,7 × 100 cm² », le
  // « 100 cm² » en bleu ; jamais le résultat. "montre" : on touche la ligne.
  function calculA2(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    // (Lot B3-2c : deux morceaux qui ne se coupent jamais ; si la ligne ne
    // tient pas, elle passe à la ligne après « = » : « 27,07 dm² = » puis
    // « 27,07 × 100 cm² ».)
    const l = el("div", `calcul-a2${mode === "montre" ? " a-toucher" : ""}`);
    const droite = el("span", "c-b");
    droite.append(texteNoeudA(carte().typo(`${aide.nombre} × `)), el("span", "g", carte().typo(`${aide.facteur} ${aide.petite}`)));
    l.append(el("span", "c-a", carte().typo(`${aide.nombre} ${aide.grande} =`)), texteNoeudA(" "), droite);
    zone.appendChild(l);
    if (mode !== "montre") return null;
    let fait = false;
    // (Lot B3-2c : au clavier aussi, comme les autres dessins à toucher ;
    // touché, il n'est plus un bouton.)
    const toucher = () => {
      if (fait) return;
      fait = true;
      l.classList.remove("a-toucher");
      l.removeAttribute("role");
      l.removeAttribute("tabindex");
      fini();
    };
    l.addEventListener("click", toucher);
    l.setAttribute("tabindex", "0");
    l.setAttribute("role", "button");
    l.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return toucher;
  }

  // C9 · la droite graduée de a à a + 1 en dixièmes : les deux bouts en
  // grand, le milieu en orange (pas pour la partie entière), la croix rouge
  // sur la mesure, son nombre au-dessus. "correction" : tout en vert, une
  // flèche de la croix vers l'entier le plus proche (la partie entière :
  // le bout de gauche en vert, sans flèche) ; "montre" : on touche la
  // droite, la flèche vient.
  function droiteC9(zone, aide, {mode = "outil", fini = () => {}} = {}) {
    const a = Number(aide.a);
    const x = Number(String(aide.x).replace(/[\s ]/g, "").replace(",", "."));
    const entiere = Boolean(aide.entiere);
    const rep = entiere ? a : (x - a >= 0.5 - 1e-9 ? a + 1 : a);
    // (Lot B3-2c, vu en gros plan : « 43 km », « 311 kg » touchaient le bord
    // du dessin → les bouts à 42 et 278 ; les nombres sous la droite plus
    // bas, la flèche passe au-dessus du milieu.)
    const W = 320;
    const x0 = 42;
    const x1 = 278;
    const y = 52;
    const X = v => x0 + (x1 - x0) * (v - a);
    const boite = el("div", "dessin-boite c9-boite");
    const dessin = svg("svg", {viewBox: `0 0 ${W} 96`, class: `dessin c9-droite${mode === "montre" ? " a-toucher" : ""}`, role: "img",
      "aria-label": carte().typo(`Une droite graduée de ${a} ${aide.u} à ${a + 1} ${aide.u}`)});
    boite.appendChild(dessin);
    zone.appendChild(boite);
    let corrige = mode === "correction";
    const nombre = v => `${String(v).replace(".", ",")}${NB}${aide.u}`;
    function dessiner() {
      dessin.textContent = "";
      if (mode === "montre") dessin.appendChild(svg("rect", {x: 0, y: 0, width: W, height: 96, fill: "transparent"}));
      dessin.appendChild(svg("line", {x1: x0 - 14, y1: y, x2: x1 + 16, y2: y, stroke: N, "stroke-width": 2.4, "stroke-linecap": "round"}));
      for (let k = 0; k <= 10; k += 1) {
        const gros = k === 0 || k === 10;
        const mil = k === 5 && aide.milieu !== false;
        dessin.appendChild(svg("line", {x1: X(a + k / 10), y1: y - (gros ? 10 : mil ? 9 : 5), x2: X(a + k / 10), y2: y + (gros ? 10 : mil ? 9 : 5),
          stroke: mil ? OR2 : N, "stroke-width": gros || mil ? 2.6 : 1.6}));
      }
      const borne = v => (corrige && v === rep ? VERT : N);
      dessin.appendChild(svg("text", {x: X(a), y: y + 36, "text-anchor": "middle", "font-size": 20, "font-weight": 900, fill: borne(a)}, carte().typo(nombre(a))));
      dessin.appendChild(svg("text", {x: X(a + 1), y: y + 36, "text-anchor": "middle", "font-size": 20, "font-weight": 900, fill: borne(a + 1)}, carte().typo(nombre(a + 1))));
      if (aide.milieu !== false) {
        dessin.appendChild(svg("text", {x: X(a + 0.5), y: y + 36, "text-anchor": "middle", "font-size": 16.5, "font-weight": 900, fill: B32C.milieu}, carte().typo(nombre(a + 0.5))));
      }
      const cx = X(x);
      const col = corrige ? VERT : ROUGE;
      dessin.appendChild(svg("path", {d: `M${cx - 6} ${y - 6}l12 12M${cx + 6} ${y - 6}l-12 12`, stroke: col, "stroke-width": 3, "stroke-linecap": "round"}));
      // (Le nombre de la croix reste dans le dessin, même près d'un bout.)
      const tx = Math.min(W - 58, Math.max(58, cx));
      dessin.appendChild(svg("text", {x: tx, y: y - 16, "text-anchor": "middle", "font-size": 17, "font-weight": 900, fill: col}, carte().typo(`${aide.x} ${aide.u}`)));
      // (Tout près du bout, pas de flèche : sa pointe tombait sur « 3 km ».)
      if (corrige && !entiere && Math.abs(X(rep) - cx) > 40) {
        const vers = X(rep) + (rep > x ? -8 : 8);
        const dep = cx + (rep > x ? 10 : -10);
        // (La flèche reste au-dessus du nombre du bout : creux à 15 sous la droite.)
        dessin.appendChild(svg("path", {d: `M${dep} ${y + 9}Q${(dep + vers) / 2} ${y + 22} ${vers} ${y + 9}`, stroke: VERT, "stroke-width": 2.2, fill: "none"}));
        dessin.appendChild(svg("path", {d: rep > x ? `M${vers} ${y + 9}l-7.5 -0.5l2.6 6.2z` : `M${vers} ${y + 9}l7.5 -0.5l-2.6 6.2z`, fill: VERT}));
      }
    }
    dessiner();
    if (mode !== "montre") return null;
    const toucher = () => {
      if (corrige) return;
      corrige = true;
      dessin.classList.remove("a-toucher");
      dessiner();
      fini();
    };
    dessin.addEventListener("click", toucher);
    dessin.setAttribute("tabindex", "0");
    dessin.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    return toucher;
  }
  // C9 · la partie entière : l'outil est un exemple sur un autre nombre,
  // dans une autre unité (« Dans 5,75 L : 5 L entiers. »), le nombre
  // entier en bleu. (Lot B3-2c, relecture : la droite commençait par la
  // réponse, « 3 m » ; un outil ne donne jamais la réponse.)
  function exempleC9(zone, e) {
    const l = el("div", "exemple-c9");
    const a = el("span", "e-a");
    a.append(texteNoeudA("Dans "), el("span", "g", e.entier), texteNoeudA(carte().typo(`${e.nombre.slice(e.entier.length)} ${e.u} :`)));
    const b = el("span", "e-b");
    b.append(el("span", "g", carte().typo(`${e.entier} ${e.u}`)), texteNoeudA(" entiers."));
    l.append(a, texteNoeudA(" "), b);
    zone.appendChild(l);
  }
  // L'outil de A1, A2, C9 (la relation à côté de l'étiquette, le dessin,
  // la phrase dessous).
  function outilB32(zone, question) {
    if (question.outil === "carre-a1") {
      zone.appendChild(el("div", "rel petite", carte().typo(question.carreA1.rel)));
      carreA1(zone, question.carreA1);
    } else if (question.outil === "decoupe-a2") {
      zone.appendChild(el("div", "rel petite", carte().typo(question.relation)));
      decoupeA2(zone, question.decoupeA2);
    } else if (question.outil === "calcul-a2") {
      zone.appendChild(el("div", "rel petite", carte().typo(question.relation)));
      calculA2(zone, question.calculA2);
    } else if (question.exempleC9) exempleC9(zone, question.exempleC9);
    else droiteC9(zone, question.droiteC9);
    zone.appendChild(el("div", "note", carte().typo(question.noteOutil)));
  }

  // ============================================================ les entrées

  // Renvoie `jouer` : le geste joué à la place de l'élève (ou rien, quand il
  // n'y a pas de geste à faire).
  function montrer(zone, aide, {fini = () => {}} = {}) {
    const f = () => fini();
    if (aide.type === "repere") { zone.appendChild(carteRepere(aide.repere, {grande: true})); f(); return null; }
    if (aide.type === "unites") {
      const liste = el("div", "refs");
      aide.unites.forEach(u => {
        const [vu, texte] = REFERENCES[u];
        const ligne = el("div", `ref${u === aide.bonne ? " bonne" : ""}`);
        ligne.appendChild(visuel(vu));
        ligne.appendChild(el("span", "", carte().typo(texte)));
        liste.appendChild(ligne);
      });
      zone.appendChild(liste);
      f();
      return null;
    }
    if (aide.type === "barres") return barres(zone, aide, f);
    // Lot B2-3a : l'aire en carreaux.
    if (aide.type === "aire-compter" || aide.type === "aire-superposer") return montrerAire(zone, aide, f);
    // Lot B2-2a : les fractions usuelles.
    if (aide.type === "barre2") return barrePartagee(zone, aide, {touche: true, fini: f});
    if (aide.type === "droite2") return doubleDroite(zone, aide, {mode: "montre", fini: f});
    if (aide.type === "verre") return verre(zone, aide, f);
    if (aide.type === "balance") return balance(zone, aide, f);
    if (aide.type === "horloge") return horloge(zone, aide, f);
    if (aide.type === "glisse-nombre") return glisseNombre(zone, aide, f);
    if (aide.type === "glisse-unite") {
      const g = glisseUnite(zone, {grandeur: aide.grandeur, valeur: aide.nombre, de: aide.de, vers: aide.vers, pale: aide.pale !== false,
        colonnes: aide.colonnes || null}, f);
      return () => g.animer(aide.vers);
    }
    // Lot B1-2
    if (aide.type === "numeration") return numeration(zone, aide, f);
    if (aide.type === "heure") {
      const touche = aide.parts > 1 && !aide.compte;
      const jouer = barreHeure(zone, {heures: aide.heures, parts: aide.parts, verte: aide.verte, compte: aide.compte || 0, plus: aide.plus || 0, touche}, f);
      if (!touche) { f(); return null; }
      return jouer;
    }
    if (aide.type === "schema") {
      schema(zone, {tout: aide.tout, parts: aide.parts, poids: aide.proportions || aide.parts.map(() => 1)});
      f();
      return null;
    }
    // Lot B2-3b-1 (Q2) : comparer avec deux barres.
    if (aide.type === "deux-barres") { deuxBarres(zone, aide); f(); return null; }
    if (aide.type === "phrase") { zone.appendChild(lignes("rel", aide.lignes.join("\n"))); f(); return null; }
    // Lot A2 bis
    if (aide.type === "echange") return echange(zone, aide, f);
    if (aide.type === "pieces") return piecesMontre(zone, aide, f);
    if (aide.type === "etiquette") return etiquette(zone, aide, f);
    if (aide.type === "horloges") return horloges(zone, aide, f);
    if (aide.type === "axe") return axe(zone, aide, f);
    // Lot B2-3b-2 (Q10) : l'axe à arcs, puis les bonds par l'heure pile.
    if (aide.type === "arcs") return arcsMontre(zone, aide, f);
    // Lot B6-1 : la double droite des heures (D6), les trois étapes (G1).
    if (aide.type === "droite-h") return droiteHeures(zone, aide, {mode: "montre", fini: f});
    if (aide.type === "etapes-v") return etapesVitesse(zone, aide, {mode: "montre", fini: f});
    // Lot B6-2 (P6) : la bande des préfixes, les cases à toucher.
    if (aide.type === "bande-p") return bandePuissances(zone, aide, {mode: "montre", fini: f});
    // Lot B6-3 (Q9) : le tableau de proportionnalité, l'arc puis la case.
    if (aide.type === "tableau-p") return tableauProp(zone, aide, {mode: "montre", fini: f});
    // Lot B3-1 (R7, R9) : le repère reporté, les arrondis, le périmètre et l'aire.
    if (aide.type === "reporte") return reporte(zone, Object.assign({eau: aide.nom === "Le bassin"}, aide), {mode: "montre", fini: f});
    if (aide.type === "arrondis") return arrondis(zone, aide, {mode: "montre", fini: f});
    if (aide.type === "perim-aire") return perimAire(zone, {bonne: aide.bonne, mode: "montre", fini: f});
    // Lot B3-2 (A1, A2, C9) : le carré à toucher, le découpage, le calcul, la droite.
    if (aide.type === "carre-a1") return carreA1(zone, aide, {mode: "montre", fini: f});
    if (aide.type === "decoupe-a2") return decoupeA2(zone, aide, {mode: "montre", fini: f});
    if (aide.type === "calcul-a2") return calculA2(zone, aide, {mode: "montre", fini: f});
    if (aide.type === "droite-c9") return droiteC9(zone, Object.assign({milieu: true}, aide), {mode: "montre", fini: f});
    if (aide.type === "grandeurs") { grandeurs(zone, {bonne: aide.bonne, aire: aide.aire}); f(); }
    return null;
  }
  // La correction après une erreur (lot A2 ter, comme le glisse-unité animé
  // de l'exerciseur) : le glisse-unité de la question, qu'on ne touche pas,
  // glisse tout seul de l'unité de départ à l'unité de la réponse ; les
  // chiffres et les zéros se placent. `ensuite()` quand il est arrivé (la
  // réponse s'écrit alors). Rend false si la question n'a pas de glisse-unité.
  function correctionGlisse(zone, question, {ensuite = () => {}, phrase = false} = {}) {
    const g = question.glisse;
    if (!g) return false;
    const gu = glisseUnite(zone, {grandeur: g.grandeur, valeur: g.valeur, de: g.de, vers: g.vers, fige: true, pale: g.pale !== false, colonnes: g.colonnes || null});
    // Lot 3b-2 : la phrase que le glisse-unité accompagne.
    if (phrase && g.phrase) {
      const n = el("div", "note phrase-glisse", carte().typo(g.phrase));
      zone.appendChild(n);
      // (Lot B1-2 : au palier 2, les noms sont longs, « Chaque hectogramme
      // devient 1 000 décigrammes. » ; sur deux lignes, l'aide passait à
      // 79 % au petit iPhone. La phrase se fait un peu plus petite pour
      // tenir sur une ligne, jusqu'à 80 % de sa taille.)
      if (g.pale === false) surUneLigne(n);
      // (Lot B2-1 : les décimaux, des noms plus longs encore, « Chaque
      // centième de gramme devient 10 milligrammes. » : si la phrase ne tient
      // toujours pas sur une ligne, les unités s'écrivent en symboles.)
      if (g.phraseCourte && !surUneLigne(n)) {
        n.style.fontSize = "";
        n.textContent = carte().typo(g.phraseCourte);
        surUneLigne(n);
      }
    }
    gu.animer(g.vers, {pas: 380, ensuite});
    return true;
  }
  // Rend vrai si la phrase tient sur une ligne.
  function surUneLigne(n) {
    const taille = parseFloat(root.getComputedStyle(n).fontSize) || 13;
    const ligne = () => n.getBoundingClientRect().height <= taille * 1.6;
    for (let k = 1; k <= 4 && !ligne(); k += 1) n.style.fontSize = `${(taille * (1 - 0.05 * k)).toFixed(2)}px`;
    return ligne();
  }
  // (Lot 3a : la ligne « l'unité de départ » sous le glisse-unité est
  // retirée, à la demande de Gwenaël le 14/11 : pas de légende pour la
  // punaise ; la punaise reste.)

  // ======================================================= lot R1-refonte
  // « Mes premiers repères » : l'outil de À toi est la carte du repère (son
  // dessin et sa mesure), l'image son dessin seul. Relier, l'objet à
  // trouver : les cartes des trois repères ; l'image, l'unité de la réponse
  // dite autrement (AUTRES) ou les unités rangées de chaque grandeur.
  const UNITES_R1 = {longueur: "mm, cm, dm, m, km", masse: "g, kg, t", contenance: "cL, dL, L"};
  function lignesRepere(zone, codes) {
    const liste = el("div", "refs");
    codes.forEach(c => {
      const r = carte().repere(c);
      const ligne = el("div", "ref");
      ligne.appendChild(imageRepere(c));
      ligne.appendChild(el("span", "", carte().typo(`${r.objet} : ${r.valeur}`)));
      liste.appendChild(ligne);
    });
    zone.appendChild(liste);
  }
  function outilCarteRepere(zone, question) {
    if (question.forme === "associer") { lignesRepere(zone, question.reperes); return; }
    if (question.morceaux.sorte === "objets") { lignesRepere(zone, question.morceaux.reperes); return; }
    zone.appendChild(carteRepere(question.repere));
  }
  // Lot R1-noms (choix de Gwenaël du 21/11) : l'outil de « 1 cm, c'est… »
  // et de « Un kilogramme s'écrit 1… » : les lettres d'un symbole, celle du
  // début (la taille) et celle de la fin (ce qu'on mesure). L'élève
  // reconstruit le nom (c + m : centi + mètre), l'outil ne l'écrit pas. Le
  // m du début et le m de la fin ne disent pas la même chose (mm). L'image,
  // ensuite : le dessin du repère de l'unité.
  function outilNomUnite(zone, question) {
    const t = el("div", "lettres");
    const rang = (titre, paires) => {
      const r = el("div", "rang");
      r.appendChild(el("span", "titre", titre));
      paires.forEach(([l, m]) => { const p = el("span", "paire"); p.append(el("b", "", l), el("span", "", m)); r.appendChild(p); });
      t.appendChild(r);
    };
    rang("Au début", [["k", "kilo"], ["d", "déci"], ["c", "centi"], ["m", "milli"]]);
    rang("À la fin", [["m", "mètre"], ["g", "gramme"], ["L", "litre"]]);
    zone.appendChild(t);
    zone.appendChild(el("div", "note", "t : la tonne ; min : la minute."));
  }
  function imageDessinRepere(zone, question) {
    if (question.forme === "associer") {
      // Les unités de chaque grandeur, de la plus petite à la plus grande :
      // trois grandeurs (degrés 1 et 2) ou une seule (degré 3).
      const gs = [...new Set(question.reperes.map(c => carte().repere(c).grandeur))];
      zone.appendChild(lignes("rel petite libre", gs.map(g => `${({longueur: "Longueurs", masse: "Masses", contenance: "Contenances"})[g]} : ${UNITES_R1[g]}`).join("\n")));
      zone.appendChild(el("div", "note", gs.length > 1 ? "Je regarde d'abord ce que je mesure." : "Du plus petit au plus grand."));
      return;
    }
    if (question.morceaux.sorte === "objets") { reperesUnites(zone, question); return; }
    const r = carte().repere(question.repere);
    const bloc = el("div", "carte-rep seul-dessin");
    bloc.appendChild(imageRepere(question.repere));
    bloc.appendChild(el("div", "t", carte().typo(r.objet)));
    zone.appendChild(bloc);
  }

  // Travail 1 de « Quelle unité choisir ? » : les unités de chaque grandeur.
  function familles(zone) {
    const liste = el("div", "refs");
    GRANDEURS.filter(([cle]) => UNITES_R1[cle]).forEach(([cle, vu, texte]) => {
      const ligne = el("div", "ref");
      ligne.appendChild(visuel(vu));
      ligne.appendChild(el("span", "", carte().typo(`${texte.split(" :")[0]} : ${UNITES_R1[cle]}`)));
      liste.appendChild(ligne);
    });
    zone.appendChild(liste);
  }

  function outil(zone, question, {fini = () => {}} = {}) {
    // Lot B2-3a (A5) : la figure à toucher, la tache, B à poser sur A.
    if (question.outil === "aire" && question.aire) { outilAire(zone, question); return; }
    // (Lot B2-1b : « Trouve l'intrus », « Coche tout ce qui est égal à… » :
    // un glisse-unité pour l'outil seulement, `glisseOutil` ; la correction
    // dit les écritures égales, sans glisse-unité qui glisse.)
    if (question.outil === "glisse-unite" && (question.glisse || question.glisseOutil)) {
      if (question.relation && !question.outilSansRelation) zone.appendChild(el("div", "rel petite", question.relation));
      const g = question.glisse || question.glisseOutil;
      glisseUnite(zone, {grandeur: g.grandeur, valeur: g.valeur, de: g.de, vers: g.vers, pale: g.pale !== false, colonnes: g.colonnes || null}, fini);
      if (question.plus) zone.appendChild(el("div", "note", carte().typo(`Puis j'ajoute ${question.plus}.`)));
      // (Lot B2-2b-2, C8 : la mesure qui ne se convertit pas, « Puis
      // j'enlève 25 cL. », « Puis je l'enlève de 3 kg. ».)
      if (question.puis) zone.appendChild(el("div", "note", carte().typo(question.puis)));
      return;
    }
    // Lot B2-2a (C6) : la double droite graduée, la relation à côté de
    // l'étiquette ; les bandes à comparer : deux lignes.
    if (question.outil === "droite2" && question.droite) {
      zone.appendChild(el("div", "rel petite", question.relation));
      doubleDroite(zone, question.droite);
      return;
    }
    if (question.outil === "lignes" && question.outilLignes) {
      zone.appendChild(lignes(question.outilPetit ? "rel petite libre" : "rel", question.outilLignes.join("\n")));
      // (Lot B6-2 : la phrase sous les lignes, « Je compte les rangs de la
      // virgule. ».)
      if (question.noteOutil) zone.appendChild(el("div", "note", carte().typo(question.noteOutil)));
      return;
    }
    // Lot B6-2 (P6, choix de Gwenaël du 21/11) : la bande des 7 préfixes et
    // leurs puissances de 10, les préfixes de la question marqués.
    if (question.outil === "bande-p" && question.bandeP) {
      bandePuissances(zone, question.bandeP);
      zone.appendChild(el("div", "note", carte().typo("D'une case à l'autre : × 1 000 = × 10³.")));
      return;
    }
    if (question.outil === "barre-heure" && question.heure) {
      const h = question.heure;
      if (h.quarts !== undefined || h.demis !== undefined) {
        barreHeure(zone, {heures: 1, parts: 4, verte: true});
        zone.appendChild(el("div", "note", carte().typo("une demi-heure = 2 quarts d'heure")));
      } else if (h.versHeures) {
        // Des minutes vers les heures : la barre d'une heure, pour compter
        // les paquets de 60 min (pas la réponse toute faite).
        barreHeure(zone, {heures: 1, parts: 1, total: false});
        zone.appendChild(el("div", "note", carte().typo("Je compte les paquets de 60 min.")));
      } else barreHeure(zone, {heures: Math.max(1, h.h), parts: 1, plus: h.m, total: false});
      return;
    }
    if (question.outil === "schema" && question.schema) {
      const s = question.schema;
      // (Lot B2-3b-1, Q2 : deux barres pour comparer ; les largeurs données
      // par la question ; la phrase de la question.)
      if (s.deux) deuxBarres(zone, s.deux);
      else schema(zone, {tout: s.tout, parts: s.parts, poids: s.poids || poidsProbleme(question)});
      zone.appendChild(el("div", "note", carte().typo(question.noteOutil || "Je mets tout dans la même unité.")));
      return;
    }
    // Lot B3-2 (A1, A2, C9).
    if (["carre-a1", "decoupe-a2", "calcul-a2", "droite-c9"].includes(question.outil)) { outilB32(zone, question); return; }
    // Lot B3-1 (R7) : le repère reporté ; le repère compté ; les arrondis.
    if (question.outil === "reporte" && question.reporte) {
      reporte(zone, Object.assign({note: question.noteOutil, eau: question.reporte.nom === "Le bassin"}, question.reporte));
      return;
    }
    if (question.outil === "fois-r7") {
      if (question.repereCarte) zone.appendChild(carteRepere(question.repereCarte));
      else zone.appendChild(el("div", "rel", carte().typo("Un étage : environ 3 m.")));
      zone.appendChild(el("div", "note", question.noteOutil));
      return;
    }
    if (question.outil === "arrondis" && question.arrondis) { arrondis(zone, {paires: question.arrondis, note: question.noteOutil}); return; }
    if (question.outil === "perim-aire") { perimAire(zone); return; }
    if (question.outil === "reperes-unites") {
      reperesUnites(zone, question);
      // (Lot B3-1, R9 : « Plus gros ne veut pas dire plus lourd. »)
      if (question.noteOutil) zone.appendChild(el("div", "note", question.noteOutil));
      return;
    }
    // Lot R1-refonte
    if (question.outil === "carte-repere") { outilCarteRepere(zone, question); return; }
    if (question.outil === "nom-unite") { outilNomUnite(zone, question); return; }
    if (question.outil === "familles") { familles(zone); return; }
    if (question.outil === "regle") { regleOutil(zone); return; }
    if (question.outil === "horloge-quarts") { horlogeQuarts(zone); return; }
    // Lot A2 bis
    if (question.outil === "monnaie") {
      monnaie(zone);
      if (question.morceaux.etiquette) zone.appendChild(el("div", "note", "Sur une étiquette, la virgule sépare les euros et les centimes."));
      return;
    }
    if (question.outil === "axe-temps" && question.axe) { axeTemps(zone, question.axe); return; }
    // Lot B2-3b-2 (Q10) : l'axe à arcs du document officiel.
    if (question.outil === "axe-arcs" && question.arcs) {
      axeArcs(zone, question.arcs);
      zone.appendChild(el("div", "note", carte().typo(question.noteOutil)));
      return;
    }
    // Lot B6-1 (choix de Gwenaël du 21/11) : la double droite des heures
    // (D6) et les trois étapes de km/h à m/s (G1), la relation au-dessus,
    // la phrase dessous.
    if (question.outil === "droite-h" && question.droiteH) {
      zone.appendChild(el("div", "rel petite", carte().typo(question.relation)));
      droiteHeures(zone, question.droiteH);
      zone.appendChild(el("div", "note", carte().typo(question.noteOutil)));
      return;
    }
    if (question.outil === "etapes-v" && question.etapesV) {
      zone.appendChild(el("div", "rel petite", carte().typo(question.relation)));
      etapesVitesse(zone, question.etapesV);
      zone.appendChild(el("div", "note", carte().typo(question.noteOutil)));
      return;
    }
    // Lot B6-3 (Q9, choix de Gwenaël du 21/11) : le tableau de
    // proportionnalité, la conversion dans l'étiquette.
    if (question.outil === "tableau-p" && question.tableauP) {
      const rel = question.relationOutil || question.relation;
      if (rel) zone.appendChild(el("div", "rel petite", carte().typo(rel)));
      tableauProp(zone, question.tableauP);
      return;
    }
    if (question.outil === "grandeurs") { grandeurs(zone, {aire: question.avecAire}); return; }
    if (question.outil === "ranger") {
      // (Lot B2-2b-1, C7 : l'échelle des unités de la question, et l'unité
      // où tout s'écrit.)
      if (question.echelleOutil) { echelle(zone, question.echelleOutil); return; }
      zone.appendChild(lignes("rel petite", question.relations.join("\n")));
      zone.appendChild(el("div", "note", "J'écris d'abord toutes les mesures dans la même unité."));
      return;
    }
    image(zone, question);
  }

  function image(zone, question) {
    if (question.aire) { imageAire(zone, question); return; }
    // Lot B2-2a (C6) : la barre partagée, et le calcul posé dessous.
    if (question.barre) {
      barrePartagee(zone, question.barre);
      if (question.image && question.image.length) zone.appendChild(lignes("rel petite libre", question.image.join("\n")));
      return;
    }
    // Lot B1-2 : les préfixes et les relations — l'échelle des unités.
    if (question.echelle) { echelle(zone, question.echelle); return; }
    // Lot B6-3 (Q9) : le tableau sans « × k » (l'élève trouve le rapport).
    if (question.tableauP) {
      const rel = question.relationOutil || question.relation;
      if (rel) zone.appendChild(el("div", "rel petite", carte().typo(rel)));
      tableauProp(zone, question.tableauP, {mode: "image"});
      return;
    }
    // Lot B6-2 (P6) : la bande sans les puissances (on compte les cases).
    if (question.bandeP) {
      bandePuissances(zone, question.bandeP, {mode: "image"});
      zone.appendChild(el("div", "note", carte().typo(question.image[0])));
      return;
    }
    // Lot B1-1 : « Est-ce vraisemblable ? » — l'image est le repère le plus
    // proche de la vraie mesure, et la phrase qui invite à comparer.
    if (question.repereProche) {
      zone.appendChild(carteRepere(question.repereProche));
      zone.appendChild(el("div", "note", "Je compare avec mon repère."));
      return;
    }
    // Lot B3-1 (R7) : le repère reporté, sa carte ; (R9) le piège, sa phrase.
    if (question.outil === "reporte" && question.repereImage) {
      zone.appendChild(carteRepere(question.repereImage));
      zone.appendChild(el("div", "note", "Je compte combien de fois mon repère."));
      return;
    }
    if (question.donnees && question.donnees.type === "piege") { zone.appendChild(lignes("rel", question.image.join("\n"))); return; }
    // Lot B3-2 (A1) : le carré quadrillé, fixe, et « Un carreau : 1 cm². »
    if (question.outil === "carre-a1" && question.carreA1 && question.image.length === 1) {
      zone.appendChild(el("div", "rel petite", carte().typo(question.carreA1.rel)));
      carreA1(zone, question.carreA1, {mode: "image"});
      zone.appendChild(el("div", "note", carte().typo(question.image[0])));
      return;
    }
    if (question.outil === "reperes-unites") { reperesUnites(zone, question); return; }
    // Lot R1-refonte
    if (question.outil === "carte-repere" || question.outil === "nom-unite") { imageDessinRepere(zone, question); return; }
    // Lot A2 bis
    if (question.outil === "grandeurs" || question.outil === "familles") { grandeurs(zone, {aire: question.avecAire}); zone.appendChild(el("div", "note", "Avec quoi je le mesure ?")); return; }
    if (question.tableau) {
      tableauHeures(zone, question.tableau);
      if (question.image && question.image[1]) zone.appendChild(lignes("rel petite", question.image[1]));
      return;
    }
    if (question.horloges) {
      // Les deux horloges, et le premier bond à côté (pas dessous : au petit
      // téléphone, les horloges garderaient trop peu de place).
      const ligne = el("div", "horl-ligne");
      horlogesImage(ligne, question.horloges);
      ligne.appendChild(lignes("rel petite libre", question.image[0]));
      zone.appendChild(ligne);
      return;
    }
    if (question.outil === "monnaie") {
      const m = question.morceaux;
      if (m.etiquette) {
        const d = question.donnees;
        etiquette(zone, {euros: Math.floor(d.total / 100), centimes: d.total % 100, muette: true, touche: false});
      } else if (question.paquetsArgent && question.donnees.sorte !== "pieces") {
        zone.appendChild(lignes("rel petite", question.image[0]));
        paquetsArgent(zone, question.paquetsArgent);
      } else zone.appendChild(lignes("rel", [`1${NB}€ = 100${NB}c`].concat(question.image).join("\n")));
      return;
    }
    if (question.paquets) {
      zone.appendChild(lignes("rel petite", question.relation));
      paquets(zone, question.paquets);
      return;
    }
    if (question.image && question.image.length) zone.appendChild(lignes("rel", question.image.join("\n")));
    else if (question.relation) zone.appendChild(el("div", "rel", question.relation));
  }

  // ------------------------------------ l'heure en mots (lot 3b-2, D2)
  // L'outil : l'horloge et les trois mots de la grande aiguille (« et
  // quart » sur le 3, « et demie » sur le 6, « moins le quart » sur le 9),
  // le premier quart d'heure en turquoise. Aucune heure n'y est donnée.
  function horlogeQuarts(zone) {
    // (Lot 3b-3 : la boîte s'élargit de chaque côté : « moins le quart »
    // sortait à gauche, coupé, au petit Android.)
    const s = svg("svg", {viewBox: "-36 0 372 168", class: "dessin horloge-quarts", role: "img",
      "aria-label": "Une horloge : la grande aiguille sur le 3, et quart ; sur le 6, et demie ; sur le 9, moins le quart"});
    const cx = 150;
    const cy = 80;
    const R = 62;
    s.appendChild(svg("path", {d: `M${cx} ${cy}V${cy - R + 1.5}A${R - 1.5} ${R - 1.5} 0 0 1 ${cx + R - 1.5} ${cy}z`, fill: "#bfeceb"}));
    const g = svg("g", {});
    cadran(g, cx, cy, R, 0, {inconnue: true});
    // (Le « ? » du cadran n'a rien à faire ici : on ne garde que le cadran.)
    g.querySelectorAll("text").forEach(t => { if (t.textContent === "?") t.remove(); });
    // le premier quart en turquoise par-dessus le fond blanc du cadran
    const fond = g.querySelector("circle");
    fond.setAttribute("fill", "none");
    s.insertBefore(svg("circle", {cx, cy, r: R, fill: "#fff"}), s.firstChild);
    s.appendChild(g);
    [[3, "et quart", "start", cx + R + 8, cy + 5], [6, "et demie", "middle", cx, cy + R + 19], [9, "moins le quart", "end", cx - R - 8, cy + 5]].forEach(([, t, ancre, x, y]) => {
      s.appendChild(svg("text", {x, y, "text-anchor": ancre, "font-size": 13, "font-weight": 900, fill: N}, t));
    });
    s.appendChild(svg("circle", {cx, cy, r: 4, fill: N}));
    zone.appendChild(s);
    zone.appendChild(el("div", "note", carte().typo("un quart d'heure = 15 min")));
  }
  // La correction : l'horloge à l'heure de la réponse.
  // (Lot 3b-3 : aussi dans la question « Quelle heure est-il ? », sans
  // l'heure dans son nom : `titre`.)
  function horlogeHeure(h, m, titre = null) {
    const s = svg("svg", {viewBox: "0 0 120 120", class: "dessin horloge-heure", role: "img", "aria-label": titre || heureT(h * 60 + m)});
    cadran(s, 60, 60, 54, h * 60 + m);
    return s;
  }

  // ------------------------------------------------------------ la ceinture
  // Lot 3a (14/11/2026, choix de Gwenaël) : une ceinture nouée par palier,
  // dessinée à plat (la même forme que les ceintures de Défi calcul : le
  // tour de taille, le nœud, les deux pans). `etat` : « gagnee » (à sa
  // couleur, trait d'encre), « vide » (pas encore : blanche, pointillés
  // gris). `doree` : toutes les étoiles du palier, un liseré doré autour
  // (épais : il se voit aussi imprimé en noir et blanc, et le mot « dorée »
  // est écrit à côté par la page). `taille` : la largeur en px (hauteur
  // 5/8). Aucun texte dedans.
  const OR = "#d39b00";
  function ceinture(n, {etat = "gagnee", doree = false, taille = 64, titre = ""} = {}) {
    const p = carte().palier(n);
    const largeur = Math.max(8, Math.min(400, Math.round(Number(taille) || 64)));
    const s = svg("svg", {"class": `ceinture${doree ? " doree" : ""}`, viewBox: "-3 1 70 41", width: String(largeur), height: String(Math.round((largeur * 41) / 70)),
      focusable: "false"});
    if (titre) { s.setAttribute("role", "img"); s.setAttribute("aria-label", titre); } else s.setAttribute("aria-hidden", "true");
    const formes = [["path", {d: "M27 17L33 18.5L23.5 37.5L16.5 35.5Z"}], ["path", {d: "M31 18.5L37 17L47.5 35.5L40.5 37.5Z"}],
      ["rect", {x: "2", y: "9", width: "60", height: "9", rx: "2.2"}], ["rect", {x: "24.5", y: "5.5", width: "15", height: "15.5", rx: "3"}]];
    const groupe = (attributs) => {
      const g = svg("g", attributs);
      formes.forEach(([tag, a]) => g.appendChild(svg(tag, a)));
      s.appendChild(g);
    };
    // Le liseré doré : la même forme, un trait d'or épais dessous.
    if (doree && etat === "gagnee") groupe({fill: OR, stroke: OR, "stroke-width": "6", "stroke-linejoin": "round"});
    const vide = etat !== "gagnee";
    groupe({fill: vide ? "#ffffff" : (p ? p.couleur : "#ffffff"), stroke: vide ? "#a9bccb" : "#143451", "stroke-width": "1.7", "stroke-linejoin": "round",
      "stroke-dasharray": vide ? "3 2.4" : "none"});
    return s;
  }

  return Object.freeze({tableauProp, bandePuissances, droiteHeures, etapesVitesse, axeArcs, supportQ10, deuxBarres, figurePb, figureA5, aireTache, correctionAire, doubleDroite, barrePartagee, texteFractions, echelle, numeration, montrer, outil, image, correctionGlisse, carteRepere, referencesUnites2, icone, imageRepere, regle, horlogeHeure, schema, glisseUnite, glisseNombre, barreHeure, verre, balance, horloge, paquets, lignes, REFERENCES,
    rangeePieces, etiquette, monnaie, horloges, horlogesImage, axe, axeTemps, tableauHeures, grandeurs, ceinture, reporte, arrondis, perimAire, carreA1, decoupeA2, calculA2, droiteC9, exempleC9});
});
