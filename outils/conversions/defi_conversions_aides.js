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
  function schema(zone, {tout, parts, poids, verte = -1}) {
    const boite = el("div", "schema");
    boite.appendChild(el("div", "schema-tout", tout));
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
    km: [["l14", "1 km : 10 terrains de foot bout à bout"], ["l5", "1 km : deux tours et demi de piste"], ["l7", "de Saint-Pierre à Saint-Denis : environ 80 km"]],
    mg: [["m1", "un grain de riz : environ 25 mg"], ["m7", "mg : pour les masses toutes petites"]],
    g: [["m7", "1 g : un trombone"], ["m3", "une pièce de 1 € : 7,5 g"]],
    kg: [["m8", "1 kg : un litre d'eau"], ["m4", "un paquet de riz : 1 kg"], ["m5", "un pack de 6 bouteilles d'eau : environ 9 kg"]],
    t: [["m6", "une petite voiture : environ 1 t"], ["m5", "1 t : plus de 100 packs d'eau"]],
    mL: [["c1", "une cuillère à café : 5 mL"], ["c5", "mL : pour les toutes petites quantités"]],
    cL: [["c5", "un verre : environ 20 cL"], ["c2", "une canette : 33 cL"]],
    dL: [["c3", "1 dL : le dixième d'une brique de lait"]],
    L: [["c3", "une brique de lait : 1 L"], ["c7", "une bouteille d'eau : 1,5 L"], ["c6", "un grand arrosoir : 10 L"], ["c4", "un chauffe-eau solaire : environ 200 L"]]
  };
  const ORDRE_2 = {longueur: ["mm", "cm", "dm", "m", "km"], masse: ["mg", "g", "kg", "t"], contenance: ["mL", "cL", "dL", "L"]};
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
    const texte = `${cherche === "depart" ? "−" : "+"}${NB}${duree % 60 && duree > 60 ? `${Math.floor(duree / 60)}${NB}h ${duree % 60}${NB}min` : duree % 60 ? `${duree}${NB}min` : `${duree / 60}${NB}h`}`;
    axeDessin(dessin, {debut, fin, marques: [
      {t: depart, titre: "DÉPART", inconnue: cherche === "depart"},
      {t: arrivee, titre: "ARRIVÉE", inconnue: cherche === "arrivee"}],
    fleche: cherche === "duree" ? null : (cherche === "arrivee" ? {de: depart, a: arrivee, texte} : {de: arrivee, a: depart, texte})});
    zone.appendChild(dessin);
    zone.appendChild(el("div", "note", cherche === "duree" ? "Je fais des bonds : jusqu'à l'heure pile, puis les heures, puis les minutes." : "Je fais un bond jusqu'à l'heure pile, puis le reste."));
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
    ["longueur", "!regle", "une longueur : la règle, le mètre"],
    ["masse", "!balance", "une masse : la balance"],
    ["contenance", "!verreDoseur", "une contenance : le verre doseur"],
    ["duree", "!chrono", "une durée : l'horloge, le chronomètre"]
  ];
  function grandeurs(zone, {bonne = null} = {}) {
    const liste = el("div", "refs");
    GRANDEURS.forEach(([cle, vu, texte]) => {
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
    if (aide.type === "phrase") { zone.appendChild(lignes("rel", aide.lignes.join("\n"))); f(); return null; }
    // Lot A2 bis
    if (aide.type === "echange") return echange(zone, aide, f);
    if (aide.type === "pieces") return piecesMontre(zone, aide, f);
    if (aide.type === "etiquette") return etiquette(zone, aide, f);
    if (aide.type === "horloges") return horloges(zone, aide, f);
    if (aide.type === "axe") return axe(zone, aide, f);
    if (aide.type === "grandeurs") { grandeurs(zone, {bonne: aide.bonne}); f(); }
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
    // (Lot B2-1b : « Trouve l'intrus », « Coche tout ce qui est égal à… » :
    // un glisse-unité pour l'outil seulement, `glisseOutil` ; la correction
    // dit les écritures égales, sans glisse-unité qui glisse.)
    if (question.outil === "glisse-unite" && (question.glisse || question.glisseOutil)) {
      if (question.relation && !question.outilSansRelation) zone.appendChild(el("div", "rel petite", question.relation));
      const g = question.glisse || question.glisseOutil;
      glisseUnite(zone, {grandeur: g.grandeur, valeur: g.valeur, de: g.de, vers: g.vers, pale: g.pale !== false, colonnes: g.colonnes || null}, fini);
      if (question.plus) zone.appendChild(el("div", "note", carte().typo(`Puis j'ajoute ${question.plus}.`)));
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
      zone.appendChild(lignes("rel", question.outilLignes.join("\n")));
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
      schema(zone, {tout: s.tout, parts: s.parts, poids: poidsProbleme(question)});
      zone.appendChild(el("div", "note", "Je mets tout dans la même unité."));
      return;
    }
    if (question.outil === "reperes-unites") { reperesUnites(zone, question); return; }
    // Lot R1-refonte
    if (question.outil === "carte-repere") { outilCarteRepere(zone, question); return; }
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
    if (question.outil === "grandeurs") { grandeurs(zone); return; }
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
    // Lot B2-2a (C6) : la barre partagée, et le calcul posé dessous.
    if (question.barre) {
      barrePartagee(zone, question.barre);
      if (question.image && question.image.length) zone.appendChild(lignes("rel petite libre", question.image.join("\n")));
      return;
    }
    // Lot B1-2 : les préfixes et les relations — l'échelle des unités.
    if (question.echelle) { echelle(zone, question.echelle); return; }
    // Lot B1-1 : « Est-ce vraisemblable ? » — l'image est le repère le plus
    // proche de la vraie mesure, et la phrase qui invite à comparer.
    if (question.repereProche) {
      zone.appendChild(carteRepere(question.repereProche));
      zone.appendChild(el("div", "note", "Je compare avec mon repère."));
      return;
    }
    if (question.outil === "reperes-unites") { reperesUnites(zone, question); return; }
    // Lot R1-refonte
    if (question.outil === "carte-repere") { imageDessinRepere(zone, question); return; }
    // Lot A2 bis
    if (question.outil === "grandeurs" || question.outil === "familles") { grandeurs(zone); zone.appendChild(el("div", "note", "Avec quoi je le mesure ?")); return; }
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

  return Object.freeze({doubleDroite, barrePartagee, texteFractions, echelle, numeration, montrer, outil, image, correctionGlisse, carteRepere, referencesUnites2, icone, imageRepere, regle, horlogeHeure, schema, glisseUnite, glisseNombre, barreHeure, verre, balance, horloge, paquets, lignes, REFERENCES,
    rangeePieces, etiquette, monnaie, horloges, horlogesImage, axe, axeTemps, tableauHeures, grandeurs, ceinture});
});
