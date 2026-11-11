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
  // Des lignes de texte (« \n » coupe la ligne), sans HTML.
  function lignes(classe, texte) {
    const bloc = el("div", classe);
    String(texte).split("\n").forEach((ligne, i) => {
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

  // ----------------------------------------------------------- la barre de l'heure
  // `heures` barres d'une heure ; la première coupée en `parts` (4 quarts de
  // 15 min, 2 moitiés) ; `verte` : une seule part verte ; `compte` : une
  // accolade qui compte des parts (« 3 parts : 3 × 15 min = 45 min ») ;
  // `plus` : des minutes après les heures. Interactif si `touche`.
  function barreHeure(zone, {heures = 1, parts = 4, verte = false, compte = 0, plus = 0, touche = false}, fini) {
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
        boite.appendChild(el("div", "accolade-texte", `${compte} parts : ${compte} × ${60 / parts}${NB}min = ${compte * 60 / parts}${NB}min`));
      } else if (heures > 1 || plus) {
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
      if (question.relation) zone.appendChild(el("div", "rel petite", question.relation));
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
      } else barreHeure(zone, {heures: Math.max(1, h.h), parts: 1, plus: h.m});
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
    if (question.image && question.image.length) zone.appendChild(lignes("rel", question.image.join("\n")));
    else if (question.relation) zone.appendChild(el("div", "rel", question.relation));
  }

  return Object.freeze({montrer, outil, image, carteRepere, schema, glisseUnite, glisseNombre, barreHeure, lignes, REFERENCES});
});
