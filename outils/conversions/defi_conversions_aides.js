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
  function glisseUnite(zone, {grandeur, valeur, de, vers, pale = true}, arrivee = () => {}) {
    const G = gen();
    const [entier, decimales = ""] = String(valeur).replace(/\s/g, "").replace(".", ",").split(",");
    const avant = entier.replace(/\D/g, "").replace(/^0+(?=\d)/, "").split("");
    const apres = decimales.replace(/\D/g, "").split("").filter(Boolean);
    let colonnes = G.COLONNES[grandeur].slice();
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

    const boite = el("div", "gu2");
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
        const pin = el("span", "gu2-pin", "📌");
        pin.setAttribute("aria-hidden", "true");
        b.appendChild(pin);
        b.title = "L'unité de départ";
      }
      b.addEventListener("click", () => aller(i));
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
    // Glisser une poignée : elle suit le doigt, l'autre aussi ; la colonne
    // sous le doigt devient l'unité (les zéros suivent) ; au lâcher, elle se
    // pose pile sur sa colonne.
    // Le glissé part de la colonne où est la poignée (une poignée du bord,
    // décalée pour rester dans la piste, ne saute pas sous le doigt).
    let glisse = null;
    let depart = {x: 0, pos: 0};
    const position = ev => depart.pos + (ev.clientX - depart.x) / (piste.getBoundingClientRect().width || 1);
    [haut, bas].forEach(p => {
      p.addEventListener("pointerdown", ev => {
        ev.preventDefault();
        glisse = ev.pointerId;
        depart = {x: ev.clientX, pos: (cible + 0.5) / n};
        try { p.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
        boite.classList.add("glisse");
        haut.focus({preventScroll: true});
      });
      p.addEventListener("pointermove", ev => {
        if (glisse !== ev.pointerId) return;
        const pos = position(ev);
        const i = plusProche(pos);
        if (i !== cible) aller(i);
        placer(pos);
      });
      const lacher = ev => {
        if (glisse !== ev.pointerId) return;
        glisse = null;
        boite.classList.remove("glisse");
        aller(plusProche(position(ev)));
        dessiner();
      };
      p.addEventListener("pointerup", lacher);
      p.addEventListener("pointercancel", lacher);
      p.addEventListener("keydown", ev => {
        const pas = ev.key === "ArrowLeft" ? -1 : ev.key === "ArrowRight" ? 1 : 0;
        if (!pas) return;
        ev.preventDefault();
        for (let i = cible + pas; i >= 0 && i < n; i += pas) if (colonnes[i]) { aller(i); break; }
      });
    });
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
    L: ["🥛", "1 L : une brique de lait"],
    // Les durées (lot A2 bis)
    min: ["🧼", "1 min : le temps de bien se laver les mains"],
    h: ["📺", "1 h : un long dessin animé"],
    jours: ["🌞", "1 jour : du matin au matin suivant, 24 h"]
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
      : question.unites ? question.unites.slice() : (question.repere ? [question.unite] : []);
    const grandeur = question.grandeur || G.grandeurDe(question.unite);
    // Associer (lot A2 bis) : les unités des trois mesures, de la plus
    // petite à la plus grande, toutes grandeurs mêlées.
    const ordre = question.forme === "associer" ? ["mm", "cm", "m", "km", "g", "kg", "t", "cL", "dL", "L"].filter(u => unites.includes(u))
      : {longueur: ["mm", "cm", "m", "km"], masse: ["g", "kg", "t"], contenance: ["cL", "dL", "L"], duree: ["min", "h", "jours"]}[grandeur] || unites;
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
      const toucher = i => {
        if (i === undefined) i = euros.find(k => !vues.has(k));
        if (i === undefined || vues.has(i) || !euros.includes(i)) return;
        vues.add(i);
        dessiner();
        if (vues.size === euros.length) fini();
      };
      d.addEventListener("click", ev => {
        const g = ev.target.closest && ev.target.closest("g[data-i]");
        toucher(g ? Number(g.getAttribute("data-i")) : undefined);
      });
      d.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toucher(); } });
    }
    dessiner();
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
    ["longueur", "📏", "une longueur : la règle, le mètre"],
    ["masse", "⚖️", "une masse : la balance"],
    ["contenance", "🥛", "une contenance : le verre doseur"],
    ["duree", "⏱️", "une durée : l'horloge, le chronomètre"]
  ];
  function grandeurs(zone, {bonne = null} = {}) {
    const liste = el("div", "refs");
    GRANDEURS.forEach(([cle, emoji, texte]) => {
      const ligne = el("div", `ref${cle === bonne ? " bonne" : ""}`);
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
      zone.appendChild(el("div", "note", "Fais glisser une poignée, ou touche une unité."));
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
    // Lot A2 bis
    if (aide.type === "echange") { echange(zone, aide, f); return; }
    if (aide.type === "pieces") { piecesMontre(zone, aide, f); return; }
    if (aide.type === "etiquette") { etiquette(zone, aide, f); return; }
    if (aide.type === "horloges") { horloges(zone, aide, f); return; }
    if (aide.type === "axe") { axe(zone, aide, f); return; }
    if (aide.type === "grandeurs") { grandeurs(zone, {bonne: aide.bonne}); f(); }
  }

  function outil(zone, question, {fini = () => {}} = {}) {
    if (question.outil === "glisse-unite" && question.glisse) {
      if (question.relation && !question.outilSansRelation) zone.appendChild(el("div", "rel petite", question.relation));
      const g = question.glisse;
      glisseUnite(zone, {grandeur: g.grandeur, valeur: g.valeur, de: g.de, vers: g.vers}, fini);
      if (question.plus) zone.appendChild(el("div", "note", carte().typo(`Puis j'ajoute ${question.plus}.`)));
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
    // Lot A2 bis
    if (question.outil === "monnaie") {
      monnaie(zone);
      if (question.morceaux.etiquette) zone.appendChild(el("div", "note", "Sur une étiquette, la virgule sépare les euros et les centimes."));
      return;
    }
    if (question.outil === "axe-temps" && question.axe) { axeTemps(zone, question.axe); return; }
    if (question.outil === "grandeurs") { grandeurs(zone); return; }
    if (question.outil === "ranger") {
      zone.appendChild(lignes("rel petite", question.relations.join("\n")));
      zone.appendChild(el("div", "note", "J'écris d'abord toutes les mesures dans la même unité."));
      return;
    }
    image(zone, question);
  }

  function image(zone, question) {
    if (question.outil === "reperes-unites") { reperesUnites(zone, question); return; }
    // Lot A2 bis
    if (question.outil === "grandeurs") { grandeurs(zone); zone.appendChild(el("div", "note", "Avec quoi je le mesure ?")); return; }
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

  return Object.freeze({montrer, outil, image, carteRepere, schema, glisseUnite, glisseNombre, barreHeure, verre, balance, horloge, paquets, lignes, REFERENCES,
    rangeePieces, etiquette, monnaie, horloges, horlogesImage, axe, axeTemps, tableauHeures, grandeurs});
});
