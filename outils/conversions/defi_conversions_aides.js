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
//
// Le glisse-unité est celui du matériel virtuel de Gwenaël
// (conversions_materiel_virtuel.html) : le nombre ne bouge pas, la fenêtre
// de l'unité glisse. Le glisse-nombre est celui de Défi calcul, simplifié :
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
    if (texte !== undefined && texte !== null) e.textContent = texte;
    return e;
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
      bloc.appendChild(root.document.createTextNode(ligne));
    });
    return bloc;
  }

  // ------------------------------------------------------ la carte d'un repère
  function carteRepere(code, {grande = false} = {}) {
    const r = carte().repere(code);
    const bloc = el("div", `carte-rep${grande ? " grande" : ""}`);
    bloc.appendChild(el("span", "emoji", r.emoji));
    const t = el("div", "t");
    t.appendChild(el("small", "", r.objet));
    t.appendChild(root.document.createTextNode(r.valeur));
    bloc.appendChild(t);
    return bloc;
  }

  // ------------------------------------------- des barres qui s'ouvrent (mètre)
  // n barres de « 1 m » ; on touche chacune, elle s'ouvre en `facteur`
  // petits traits (« 100 cm »). `regrouper` : l'inverse, les paquets de
  // 100 cm se referment en 1 m.
  function barres(zone, aide, fini) {
    const n = aide.n;
    const W = 340;
    const x0 = 10;
    const y0 = 36;
    const h = 40;
    const w = W / n;
    const etat = Array(n).fill(Boolean(aide.regrouper));
    const boite = el("div", "barres");
    const dessin = svg("svg", {viewBox: "0 0 360 106", class: "metre", role: "img"});
    const somme = el("div", "somme");
    boite.appendChild(dessin);
    boite.appendChild(somme);
    zone.appendChild(boite);
    const grandeT = `1${NB}${aide.grande}`;
    const petiteT = `${gen().ecrire(BigInt(aide.facteur) * 1000n)}${NB}${aide.petite}`;
    function dessiner() {
      dessin.textContent = "";
      dessin.appendChild(svg("path", {d: `M${x0} 22 v-8 h${W} v8`, fill: "none", stroke: "#143451", "stroke-width": 2}));
      dessin.appendChild(svg("text", {x: x0 + W / 2, y: 10, "text-anchor": "middle", "font-size": 15, fill: "#143451"},
        aide.regrouper ? `${gen().ecrire(BigInt(n * aide.facteur) * 1000n)}${NB}${aide.petite}` : `${n}${NB}${aide.grande}`));
      for (let i = 0; i < n; i += 1) {
        const x = x0 + i * w;
        const g = svg("g", {class: "barre", tabindex: 0, role: "button", "data-i": i});
        if (etat[i]) {
          g.appendChild(svg("rect", {x: x.toFixed(1), y: y0, width: w.toFixed(1), height: h, fill: "#eef5fd", stroke: "#0755b8", "stroke-width": 2.5}));
          const traits = Math.min(aide.facteur, 100);
          for (let k = 1; k < traits; k += 1) {
            const xx = x + (w * k) / traits;
            const lg = k % 10 === 0 ? 16 : k % 5 === 0 ? 11 : 7;
            g.appendChild(svg("line", {x1: xx.toFixed(2), y1: y0 + h, x2: xx.toFixed(2), y2: y0 + h - lg, stroke: "#0755b8", "stroke-width": k % 10 === 0 ? 1.4 : 0.7}));
          }
          g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + 17, "text-anchor": "middle", "font-size": n > 3 ? 11 : 13, fill: "#143451"}, grandeT));
          g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + h + 22, "text-anchor": "middle", "font-size": n > 3 ? 11 : 15, fill: "#0755b8"}, petiteT));
        } else {
          g.appendChild(svg("rect", {x: x.toFixed(1), y: y0, width: w.toFixed(1), height: h, fill: "#fff", stroke: "#143451", "stroke-width": 2.5}));
          g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + 26, "text-anchor": "middle", "font-size": n > 3 ? 13 : 16, fill: "#143451"}, grandeT));
          if (!aide.regrouper) g.appendChild(svg("text", {x: (x + w / 2).toFixed(1), y: y0 + h + 22, "text-anchor": "middle", "font-size": 12, fill: "#8ea1af"}, "touche-moi"));
        }
        dessin.appendChild(g);
      }
      const faits = aide.regrouper ? etat.filter(x => !x).length : etat.filter(Boolean).length;
      somme.textContent = "";
      if (faits) {
        const texte = aide.regrouper ? `${faits} × ${petiteT} = ${faits}${NB}${aide.grande}` : Array(faits).fill(petiteT).join(" + ");
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
      dessin.appendChild(svg("text", {x: 250, y: 16, "text-anchor": "middle", "font-size": 12.5, "font-weight": 800, fill: "#143451"}, `1 tablette = 100${NB}g`));
      if (!poses) dessin.appendChild(svg("text", {x: xd, y: ypd + 26, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#8ea1af"}, "touche-moi"));
      somme.textContent = "";
      if (poses) somme.appendChild(el("span", "", poses === 1 ? `1 tablette : 100${NB}g` : carte().typo(`${poses} tablettes : ${poses * 100} g`)));
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
        dessin.appendChild(svg("text", {x: x.toFixed(1), y: (y + 5.5).toFixed(1), "text-anchor": "middle", "font-size": 15, "font-weight": 800, fill: "#143451"}, String(h)));
      }
      // les minutes parcourues, de quart d'heure en quart d'heure
      for (let m = 15; m <= minutes; m += 15) {
        const [x, y] = point((2 * Math.PI * m) / 60, R + 28);
        dessin.appendChild(svg("text", {x: x.toFixed(1), y: (y + 5).toFixed(1), "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: "#0755b8"}, `${m}${NB}min`));
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
        const couper = () => { coupee = true; dessiner(); fini(); };
        b.addEventListener("click", couper);
        b.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); couper(); } });
      }
    }
    dessiner();
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
    bouton.addEventListener("click", () => {
      if (bouton.disabled) return;
      bouton.disabled = true;
      if (sens === "×") place(bas, chiffres, rangs, rangs, true);
      else place(bas, chiffres.slice(0, Math.max(1, chiffres.length - rangs)), 0, 0, true);
      bas.classList.add("glisse");
      fini();
    });
  }

  // ----------------------------------------------------------- le glisse-unité
  // Les unités en titre de colonne ; le chiffre des unités du nombre sous
  // l'unité de départ. La fenêtre (l'unité choisie) glisse : on touche une
  // unité, ou on fait glisser le doigt sur la rangée. Arrivée à l'unité
  // voulue, les zéros remplissent les colonnes entre les deux.
  function glisseUnite(zone, {grandeur, valeur, de, vers, pale = true}, arrivee) {
    const G = gen();
    let colonnes = G.COLONNES[grandeur].slice();
    const chiffres = String(valeur).replace(/\D/g, "").split("");
    const iDe0 = colonnes.indexOf(de);
    // Des colonnes sans nom à gauche si le nombre en a besoin.
    const manque = Math.max(0, chiffres.length - 1 - iDe0);
    colonnes = Array(manque).fill("").concat(colonnes);
    const iDe = colonnes.indexOf(de);
    const iVers = colonnes.indexOf(vers);
    let fenetre = iDe;
    let fini = false;
    const boite = el("div", "gu");
    const rangU = el("div", "u");
    const rangD = el("div", "d");
    const modele = `repeat(${colonnes.length}, 1fr)`;
    rangU.style.gridTemplateColumns = modele;
    rangD.style.gridTemplateColumns = modele;
    const boutons = colonnes.map((u, i) => {
      const b = el("button", "", u || NB);
      b.type = "button";
      b.disabled = !u;
      if (u && pale && G.HORS_CYCLE_2.includes(u)) b.classList.add("pale");
      if (!u) b.classList.add("sans-nom");
      b.setAttribute("aria-label", u ? `Mettre l'unité sur ${u}` : "colonne sans nom");
      b.addEventListener("click", () => aller(i));
      rangU.appendChild(b);
      return b;
    });
    const cases = colonnes.map(() => { const c = el("span", ""); rangD.appendChild(c); return c; });
    boite.appendChild(rangU);
    boite.appendChild(rangD);
    zone.appendChild(boite);

    function dessiner() {
      boutons.forEach((b, i) => {
        b.classList.toggle("on", i === fenetre);
        b.classList.toggle("dep", i === iDe && i !== fenetre);
      });
      cases.forEach((c, i) => {
        const rang = iDe - i;
        let t = "";
        let cl = "";
        if (rang >= 0 && rang < chiffres.length) t = chiffres[chiffres.length - 1 - rang];
        else if (i > iDe && i <= fenetre) { t = "0"; cl = "z"; }
        if (i > fenetre && t) cl = "apres";
        c.textContent = t;
        c.className = `${cl}${i === fenetre ? " on" : ""}`;
      });
    }
    function aller(i) {
      if (!colonnes[i] || i === fenetre) return;
      fenetre = i;
      dessiner();
      if (i === iVers && !fini) { fini = true; arrivee(); }
    }
    // Toucher une unité, ou glisser le doigt sur la rangée : la colonne
    // sous le doigt devient la fenêtre. (Pas de capture du pointeur : elle
    // détournait le « click » des boutons.) Le clavier passe par « click ».
    const colonneSous = ev => {
      const r = rangU.getBoundingClientRect();
      return Math.floor(((ev.clientX - r.left) / r.width) * colonnes.length);
    };
    rangU.addEventListener("pointerdown", ev => { const i = colonneSous(ev); if (i >= 0 && i < colonnes.length) aller(i); });
    rangU.addEventListener("pointermove", ev => {
      if (!ev.buttons) return;
      const i = colonneSous(ev);
      if (i >= 0 && i < colonnes.length) aller(i);
    });
    dessiner();
    return boite;
  }

  // --------------------------------------------- les repères des unités en jeu
  const REFERENCES = {
    mm: ["📏", "1 mm : la plus petite graduation de la règle"],
    cm: ["🧊", "1 cm : le côté du petit cube de la classe"],
    m: ["🚶", "1 m : un grand pas"],
    km: ["🏃", "1 km : deux tours et demi de piste"],
    g: ["📄", "1 g : bien moins qu'une feuille A4 (5 g)"],
    kg: ["🍙", "1 kg : un paquet de riz"],
    t: ["🚗", "1 t : une voiture"],
    cL: ["🥄", "1 cL : deux cuillères à café"],
    dL: ["🥛", "1 dL : le dixième d'une brique de lait"],
    L: ["🥛", "1 L : une brique de lait"]
  };
  // Quand l'objet de la question EST la référence d'une unité, une autre
  // référence (sinon l'aide donnerait la réponse).
  const AUTRES = {
    "c3": {L: ["🥤", "1 L : trois canettes, un peu plus"]},
    "m4": {kg: ["💧", "1 kg : un litre d'eau"]},
    "m6": {t: ["🍙", "1 t : 1 000 paquets de riz"]}
  };
  function reperesUnites(zone, question) {
    const G = gen();
    const unites = question.choix && question.morceaux.sorte === "unite" ? question.choix.slice()
      : (question.repere ? [question.unite] : []);
    const grandeur = question.grandeur || G.grandeurDe(question.unite);
    const ordre = {longueur: ["mm", "cm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"]}[grandeur] || unites;
    const liste = el("div", "refs");
    ordre.filter(u => unites.includes(u) || question.morceaux.sorte === "valeur").forEach(u => {
      const autre = question.repere && AUTRES[question.repere] && AUTRES[question.repere][u];
      const [emoji, texte] = autre || REFERENCES[u];
      const ligne = el("div", "ref");
      ligne.appendChild(el("span", "emoji", emoji));
      ligne.appendChild(el("span", "", carte().typo(texte)));
      liste.appendChild(ligne);
    });
    zone.appendChild(liste);
  }

  // ============================================================ les entrées

  function montrer(zone, aide, {fini = () => {}} = {}) {
    const f = () => fini();
    if (aide.type === "repere") { zone.appendChild(carteRepere(aide.repere, {grande: true})); f(); return; }
    if (aide.type === "unites") {
      const liste = el("div", "refs");
      aide.unites.forEach(u => {
        const [emoji, texte] = REFERENCES[u];
        const ligne = el("div", `ref${u === aide.bonne ? " bonne" : ""}`);
        ligne.appendChild(el("span", "emoji", emoji));
        ligne.appendChild(el("span", "", carte().typo(texte)));
        liste.appendChild(ligne);
      });
      zone.appendChild(liste);
      f();
      return;
    }
    if (aide.type === "barres") { barres(zone, aide, f); return; }
    if (aide.type === "verre") { verre(zone, aide, f); return; }
    if (aide.type === "balance") { balance(zone, aide, f); return; }
    if (aide.type === "horloge") { horloge(zone, aide, f); return; }
    if (aide.type === "glisse-nombre") { glisseNombre(zone, aide, f); return; }
    if (aide.type === "glisse-unite") {
      glisseUnite(zone, {grandeur: aide.grandeur, valeur: aide.nombre, de: aide.de, vers: aide.vers}, f);
      zone.appendChild(el("div", "note", "Glisse l'unité avec ton doigt."));
      return;
    }
    if (aide.type === "heure") {
      barreHeure(zone, {heures: aide.heures, parts: aide.parts, verte: aide.verte, compte: aide.compte || 0, plus: aide.plus || 0,
        touche: aide.parts > 1 && !aide.compte}, f);
      if (!(aide.parts > 1 && !aide.compte)) f();
      return;
    }
    if (aide.type === "schema") {
      schema(zone, {tout: aide.tout, parts: aide.parts, poids: aide.proportions || aide.parts.map(() => 1)});
      f();
      return;
    }
    if (aide.type === "phrase") { zone.appendChild(lignes("rel", aide.lignes.join("\n"))); f(); }
  }

  function outil(zone, question, {fini = () => {}} = {}) {
    if (question.outil === "glisse-unite" && question.glisse) {
      if (question.relation && !question.outilSansRelation) zone.appendChild(el("div", "rel petite", question.relation));
      const g = question.glisse;
      glisseUnite(zone, {grandeur: g.grandeur, valeur: g.valeur.replace(",", ""), de: g.de, vers: g.vers}, fini);
      zone.appendChild(el("div", "note", question.plus ? carte().typo(`Glisse l'unité avec ton doigt, puis ajoute ${question.plus}.`) : "Glisse l'unité avec ton doigt."));
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
    image(zone, question);
  }

  function image(zone, question) {
    if (question.outil === "reperes-unites") { reperesUnites(zone, question); return; }
    if (question.paquets) {
      zone.appendChild(lignes("rel petite", question.relation));
      paquets(zone, question.paquets);
      return;
    }
    if (question.image && question.image.length) zone.appendChild(lignes("rel", question.image.join("\n")));
    else if (question.relation) zone.appendChild(el("div", "rel", question.relation));
  }

  return Object.freeze({montrer, outil, image, carteRepere, schema, glisseUnite, glisseNombre, barreHeure, verre, balance, horloge, paquets, lignes, REFERENCES});
});
