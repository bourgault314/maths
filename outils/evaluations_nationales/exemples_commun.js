/* maths&go — Évaluations nationales, « exemples de questions et de tâches » Eduscol (4e, 3e) : dessins communs (lot EN8a).
   Blocs de programme à la façon de Scratch (couleurs de Scratch 3) et solides de petits cubes en perspective.
   Chargé par la page et par les tests node, après en_commun.js. */
(function (racine) {
  "use strict";
  const { svg } = racine.EN;

  // ---------- Blocs de programme ----------
  // Un bloc : { cat, el: [morceaux], dedans: [blocs] (bloc « répéter ») }. Morceaux : "texte", { champ }, { nombre },
  // { variable }, { menu }, { op: [morceaux] }, { drapeau: true }, { rotation: true }.
  const CAT = {
    evenement: ["#ffbf00", "#cc9900"], capteur: ["#5cb1d6", "#2e8eb8"], variable: ["#ff8c1a", "#db6e00"],
    apparence: ["#9966ff", "#774dcb"], stylo: ["#0fbd8c", "#0b8e69"], controle: ["#ffab19", "#cf8b17"],
    mouvement: ["#4c97ff", "#3373cc"], operateur: ["#59c059", "#389438"],
  };
  const LETTRE = 7.4, H = 36, BRAS = 16, PIED = 26, CHAPEAU = 16;
  const echap = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const largeurTexte = (t) => String(t).length * LETTRE;

  // Largeur d'un morceau (pour placer le suivant).
  function largeur(m) {
    if (typeof m === "string") return largeurTexte(m);
    if (m.drapeau) return 24;
    if (m.rotation) return 18;
    if (m.op) return 16 + m.op.reduce((s, x) => s + largeur(x) + 6, -6);
    const t = m.champ ?? m.nombre ?? m.variable ?? m.menu;
    return largeurTexte(t) + (m.menu ? 30 : m.nombre !== undefined ? 18 : 18);
  }
  // Dessine un morceau à partir de x sur la ligne médiane y ; renvoie le SVG.
  function morceau(m, x, y, cat) {
    const [, bord] = CAT[cat];
    const txt = (tx, t, coul, ancre) => `<text x="${tx}" y="${y + 4.6}" font-size="13" font-weight="700" font-family="Helvetica,Arial,sans-serif" fill="${coul}"${ancre ? ` text-anchor="${ancre}"` : ""}>${echap(t)}</text>`;
    if (typeof m === "string") return txt(x, m, "#fff");
    const w = largeur(m);
    if (m.drapeau) return `<path d="M${x + 4} ${y + 9}V${y - 9}M${x + 4} ${y - 9}c5 -3 9 3 15 0v9c-6 3 -10 -3 -15 0" fill="#4cbf56" stroke="#45993d" stroke-width="1.6" stroke-linejoin="round"/>`;
    // Rotation vers la gauche (sens inverse des aiguilles d'une montre), comme « tourner ↺ » de Scratch.
    if (m.rotation) return `<path d="M${x + 14.6} ${y + 2}A6 6 0 1 0 ${x + 8} ${y - 5.9}" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M${x + 3.6} ${y - 6}l5.4 -3.6v7.2z" fill="#fff"/>`;
    if (m.champ !== undefined) return `<rect x="${x}" y="${y - 11}" width="${w}" height="22" rx="4" fill="#fff" stroke="${bord}"/>` + txt(x + w / 2, m.champ, "#575e75", "middle");
    if (m.nombre !== undefined) return `<rect x="${x}" y="${y - 11}" width="${w}" height="22" rx="11" fill="#fff" stroke="${bord}"/>` + txt(x + w / 2, m.nombre, "#575e75", "middle");
    if (m.variable !== undefined) return `<rect x="${x}" y="${y - 12}" width="${w}" height="24" rx="12" fill="${CAT.variable[0]}" stroke="${CAT.variable[1]}"/>` + txt(x + w / 2, m.variable, "#fff", "middle");
    if (m.menu !== undefined) return `<rect x="${x}" y="${y - 11}" width="${w}" height="22" rx="4" fill="${bord}" stroke="${bord}"/>` + txt(x + 8, m.menu, "#fff") + `<path d="M${x + w - 17} ${y - 2}l4.5 5 4.5 -5z" fill="#fff"/>`;
    if (m.op) {
      let s = `<rect x="${x}" y="${y - 14}" width="${w}" height="28" rx="14" fill="${CAT.operateur[0]}" stroke="${CAT.operateur[1]}"/>`, cx = x + 8;
      for (const e of m.op) { s += morceau(e, cx, y, "operateur"); cx += largeur(e) + 6; }
      return s;
    }
    return "";
  }
  const ligneLargeur = (el) => 20 + el.reduce((s, m) => s + largeur(m) + 7, -7);

  // Contour d'un bloc empilable (encoche en haut, ergot en bas), d'un chapeau, d'un bloc « répéter ».
  const encoche = (x) => `H${x + 12}l5 5h10l5 -5`;
  const ergotRetour = (x) => `H${x + 32}l-5 5h-10l-5 -5`;
  function contour(b, x, y, w, h) {
    if (b.chapeau) return `M${x} ${y + CHAPEAU}c22 -${CHAPEAU + 6} 62 -${CHAPEAU + 6} 84 0H${x + w - 4}q4 0 4 4V${y + h - 4}q0 4 -4 4${ergotRetour(x)}H${x + 4}q-4 0 -4 -4z`;
    if (b.dedans) {
      const hi = b.hauteurDedans, yb = y + H + hi;
      return `M${x} ${y + 4}q0 -4 4 -4${encoche(x)}H${x + w - 4}q4 0 4 4V${y + H - 4}q0 4 -4 4${ergotRetour(x + BRAS)}H${x + BRAS + 4}q-4 0 -4 4V${yb - 4}q0 4 4 4${encoche(x + BRAS)}H${x + w - 4}q4 0 4 4V${yb + PIED - 4}q0 4 -4 4${ergotRetour(x)}H${x + 4}q-4 0 -4 -4z`;
    }
    return `M${x} ${y + 4}q0 -4 4 -4${encoche(x)}H${x + w - 4}q4 0 4 4V${y + h - 4}q0 4 -4 4${ergotRetour(x)}H${x + 4}q-4 0 -4 -4z`;
  }
  // Hauteur d'une pile de blocs.
  function hauteur(blocs) {
    return blocs.reduce((s, b) => s + (b.chapeau ? H + CHAPEAU : b.dedans ? H + hauteur(b.dedans) + PIED : H), 0);
  }
  function largeurPile(blocs) {
    return Math.max(...blocs.map((b) => Math.max(ligneLargeur(b.el) + 10, b.chapeau ? 120 : 0, b.dedans ? BRAS + largeurPile(b.dedans) : 0)));
  }
  function pile(blocs, x, y) {
    let s = "", cy = y;
    for (const b of blocs) {
      const [fond, bord] = CAT[b.cat];
      const w = Math.max(ligneLargeur(b.el) + 10, b.chapeau ? 120 : 0, b.dedans ? BRAS + largeurPile(b.dedans) + 20 : 0);
      if (b.dedans) b.hauteurDedans = hauteur(b.dedans);
      const h = b.chapeau ? H + CHAPEAU : b.dedans ? H + b.hauteurDedans + PIED : H;
      s += `<path d="${contour(b, x, cy, w, h)}" fill="${fond}" stroke="${bord}" stroke-width="1.2"/>`;
      let cx = x + 10;
      const my = cy + (b.chapeau ? CHAPEAU : 0) + H / 2;
      for (const m of b.el) { s += morceau(m, cx, my, b.cat); cx += largeur(m) + 7; }
      if (b.dedans) {
        s += pile(b.dedans, x + BRAS, cy + H);
        // La flèche du bas du bloc « répéter ».
        const fy = cy + H + b.hauteurDedans + PIED / 2;
        s += `<path d="M${x + w - 22} ${fy - 5}v6h-8" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M${x + w - 33} ${fy + 1}l5 -4v8z" fill="#fff"/>`;
      }
      cy += h;
    }
    return s;
  }
  // Le programme entier, sur un fond gris clair comme l'éditeur.
  function programme(blocs, etiquette, largeurMax) {
    const w = largeurPile(blocs) + 30, h = hauteur(blocs) + 30;
    return svg(w, h, `<rect width="${w}" height="${h}" rx="10" fill="#f2f4f7"/>` + pile(blocs, 12, 14), etiquette, largeurMax || Math.round(w * 1.05));
  }

  // ---------- Petits cubes ----------
  // Perspective comme les solides d'Eduscol : la profondeur part en haut à gauche ; on voit le devant, le dessus et la
  // face de gauche. cellules : [[x, y, z]] (x vers la droite, y vers le fond, z vers le haut).
  function cubes(cellules, cote, profondeur) {
    const s = cote || 34, dx = -(profondeur || 0.5) * s, dy = -0.36 * s;
    const P = (x, y, z) => [x * s + y * dx, -z * s + y * dy];
    const tri = cellules.slice().sort((a, b) => b[1] - a[1] || a[2] - b[2] || b[0] - a[0]);
    const pts = cellules.flatMap(([x, y, z]) => [P(x, y, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1), P(x + 1, y, z)]);
    const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
    const minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
    const M = 3, ox = M - minX, oy = M - minY;
    const poly = (liste, fond) => `<polygon points="${liste.map(([a, b]) => `${(a + ox).toFixed(1)},${(b + oy).toFixed(1)}`).join(" ")}" fill="${fond}" stroke="#4a4a4a" stroke-width="1.1" stroke-linejoin="round"/>`;
    let corps = "";
    for (const [x, y, z] of tri) {
      corps += poly([P(x, y, z), P(x, y + 1, z), P(x, y + 1, z + 1), P(x, y, z + 1)], "#9c9c9c"); // gauche
      corps += poly([P(x, y, z + 1), P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], "#c9c9c9"); // dessus
      corps += poly([P(x, y, z), P(x + 1, y, z), P(x + 1, y, z + 1), P(x, y, z + 1)], "#b1b1b1"); // devant
    }
    return { contenu: corps, largeur: maxX - minX + 2 * M, hauteur: maxY - minY + 2 * M };
  }
  // Vues d'un solide (à partir des cellules) : face (x, z), gauche (profondeur vue de la gauche : le fond est à gauche), dessus (x, y).
  function vues(cellules) {
    const max = (i) => Math.max(...cellules.map((c) => c[i])) + 1;
    const face = new Set(cellules.map(([x, , z]) => `${x},${z}`));
    const gauche = new Set(cellules.map(([, y, z]) => `${max(1) - 1 - y},${z}`));
    const dessus = new Set(cellules.map(([x, y]) => `${x},${y}`));
    return { face, gauche, dessus, nx: max(0), ny: max(1), nz: max(2) };
  }
  // Dessin d'une vue : un ensemble de carreaux « colonne,ligne », la ligne 0 en bas (pour le dessus : le devant du solide en bas).
  function dessinVue(carreaux, x0, yBas, c) {
    let s = "";
    for (const k of carreaux) {
      const [i, j] = k.split(",").map(Number);
      s += `<rect x="${x0 + i * c}" y="${yBas - (j + 1) * c}" width="${c}" height="${c}" fill="#f1f1f1" stroke="#4a4a4a" stroke-width="1.4"/>`;
    }
    return s;
  }

  racine.ENX = { programme, cubes, vues, dessinVue, CAT };
})(typeof window !== "undefined" ? window : globalThis);
