/* Les dessins d'aide, d'explication et de cours des cahiers de domaine (lot NC-1, 24/10/2026).
   Repris fidèlement de la source du cahier « Nombres et calculs », partie 1 (aides.py, version 3
   vérifiée par Gwenaël le 24/10). Règles : couleurs de la charte maths&go seulement ; on peut
   compter sur le dessin, la réponse n'y est jamais écrite (sauf dans l'explication, où le dessin
   est complété) ; lisible imprimé en noir et blanc (chaque couleur doublée d'un trait ou d'un mot) ;
   au plus 340 px de large. */

export const INK = "#10294a";
export const FILET = "#8a94a6";
export const ORANGE = "#f58220";
export const BLEU = "#063f86";
export const TURQ = "#08b9b2";
export const INC_FOND = "#dbeafe";
export const INC_TEXTE = "#1d4ed8";
export const VERT = "#18a85b";
export const GRIS = "#637287";
export const BRUN = "#9a3412";
const FONT = "Nunito, 'Segoe UI', Arial, sans-serif";
const MATH = "'Times New Roman', 'Liberation Serif', serif";

const esc = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const n2 = (v) => Number(Number(v).toFixed(2));

export function svg(w, h, body, label = "") {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n2(w)} ${n2(h)}" ` +
    `width="${n2(w)}" height="${n2(h)}" role="img" aria-label="${esc(label)}" ` +
    `font-family="${FONT}">${body}</svg>`
  );
}

export function t(x, y, s, size = 14, fill = INK, options = {}) {
  const { anchor = "middle", weight = 400, font = null } = options;
  const police = font ? ` font-family="${font}"` : "";
  return (
    `<text x="${n2(x)}" y="${n2(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${police} dominant-baseline="central">${esc(s)}</text>`
  );
}

export function rect(x, y, w, h, fill = "#fff", stroke = FILET, sw = 1.2, rx = 0, dash = null) {
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return (
    `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${rx}" fill="${fill}" ` +
    `stroke="${stroke}" stroke-width="${sw}"${d}/>`
  );
}

export function line(x1, y1, x2, y2, stroke = INK, sw = 1.5, dash = null) {
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return (
    `<line x1="${n2(x1)}" y1="${n2(y1)}" x2="${n2(x2)}" y2="${n2(y2)}" stroke="${stroke}" ` +
    `stroke-width="${sw}" stroke-linecap="round"${d}/>`
  );
}

function carreVide(x, y, s = 18, stroke = INK) {
  return rect(x - s / 2, y - s / 2, s, s, "#fff", stroke, 1.4, 2);
}

// Petite croix sur une droite graduée (à la place des ronds).
function croix(x, y, col = BLEU, s = 6) {
  return (
    line(x - s, y - s, x + s, y + s, "#fff", 5.5) +
    line(x - s, y + s, x + s, y - s, "#fff", 5.5) +
    line(x - s, y - s, x + s, y + s, col, 2.6) +
    line(x - s, y + s, x + s, y - s, col, 2.6)
  );
}

// Un nombre écrit à la française : espace fine entre les milliers (7 414, 12 345).
export function nombre(n) {
  const s = String(n);
  if (s.length < 4) return s;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/* ------------------------------------------------------------------ chiffres
   Les chiffres du nombre dans des cases. unites : case des unités entourée d'orange.
   somme : ligne « a + b + … = □ » dessous ; total : le nombre écrit dans □ (explication).
   « ? » dans le nombre : case de l'inconnue. remplie : rang d'une case remplie dans l'explication
   (contour bleu). */
export function chiffres(valeur, options = {}) {
  const { unites = false, somme = false, legende = null, total = null, remplie = null } = options;
  const ds = [...String(valeur)];
  const c = 34;
  const g = 6;
  const w = ds.length * c + (ds.length - 1) * g;
  const W = Math.max(w + 40, 300);
  const x0 = (W - w) / 2;
  let body = "";
  ds.forEach((d, i) => {
    const x = x0 + i * (c + g);
    const dernier = i === ds.length - 1;
    if (d === "?") {
      body += rect(x, 10, c, 40, INC_FOND, INC_TEXTE, 1.6, 6, "4 3");
      body += t(x + c / 2, 30, "?", 20, INC_TEXTE, { weight: 700 });
    } else {
      const [st, sw] =
        unites && dernier ? [ORANGE, 3] : remplie === i ? [INC_TEXTE, 2.6] : [FILET, 1.4];
      body += rect(x, 10, c, 40, remplie === i ? INC_FOND : "#fff", st, sw, 6);
      body += t(x + c / 2, 31, d, 22, INK, { weight: 700, font: MATH });
    }
  });
  let y = 66;
  if (unites) {
    const xu = x0 + (ds.length - 1) * (c + g) + c / 2;
    body += line(xu, 54, xu, 66, ORANGE, 2);
    body += t(xu, 80, "chiffre des unités", 13, BRUN, { weight: 700 });
    y = 96;
  }
  if (somme) {
    const parts = ds.map((d) => (d === "?" ? "□" : d));
    const expr = `${parts.join(" + ")} = `;
    body += t(W / 2 - 12, y + 8, expr, 18, INK, { font: MATH });
    const tw = expr.length * 7.4;
    const xb = W / 2 - 12 + tw / 2 + 14;
    if (total === null) body += carreVide(xb, y + 8, 20);
    else body += t(xb, y + 8, String(total), 18, INK, { weight: 800, font: MATH });
    body += t(W / 2, y + 34, legende || "somme des chiffres", 12, GRIS);
    y += 50;
  } else if (legende) {
    body += t(W / 2, y + 6, legende, 12, GRIS);
    y += 20;
  }
  return svg(W, y + 4, body, "chiffres du nombre");
}

// Les SVG emboîtés : le corps d'un dessin, sans sa balise, avec sa largeur et sa hauteur.
function interieur(dessin) {
  const w = Number(dessin.match(/width="([\d.]+)"/)[1]);
  const h = Number(dessin.match(/height="([\d.]+)"/)[1]);
  return { w, h, corps: dessin.replace(/^<svg[^>]*>|<\/svg>$/g, "") };
}

/* NC17-a : le chiffre des unités entouré, puis les trois règles sur trois lignes séparées
   (« sur une ligne, on ne comprend rien », Gwenaël, 24/10). */
export function reglesUnites(valeur) {
  const haut = interieur(chiffres(valeur, { unites: true }));
  const W = Math.max(haut.w, 320);
  let body = `<g transform="translate(${n2((W - haut.w) / 2)},0)">${haut.corps}</g>`;
  let y = haut.h + 4;
  body += t(W / 2, y, "Divisible si le chiffre des unités est :", 13, INK, { weight: 700 });
  y += 24;
  [
    ["par 2", "0, 2, 4, 6 ou 8"],
    ["par 5", "0 ou 5"],
    ["par 10", "0"],
  ].forEach(([a, b], k) => {
    const yy = y + k * 26;
    body += rect(W / 2 - 110, yy - 11, 220, 22, "#f5f9fc", "#c9d3df", 1, 6);
    body += t(W / 2 - 98, yy, a, 14, BLEU, { weight: 800, anchor: "start" });
    body += t(W / 2 - 40, yy, "→", 14, INK, { anchor: "start" });
    body += t(W / 2 - 14, yy, b, 15, INK, { weight: 800, anchor: "start", font: MATH });
  });
  return svg(W, y + 3 * 26 - 8, body, "le chiffre des unités et les trois règles");
}

// Les deux critères côte à côte : le chiffre des unités (2, 5, 10), tous les chiffres (3, 9).
export function criteres(valeur) {
  const ds = [...String(valeur)];
  const W = 340;
  const H = 120;
  let body = "";
  [
    ["par 2, 5, 10", "u"],
    ["par 3, 9", "s"],
  ].forEach(([titre, mode], k) => {
    const x0 = 10 + k * 170;
    body += rect(x0, 4, 160, H - 8, "#f5f9fc", "#c9d3df", 1.2, 10);
    body += t(x0 + 80, 20, titre, 13, BLEU, { weight: 800 });
    const c = 26;
    const w = ds.length * (c + 4) - 4;
    const xs = x0 + (160 - w) / 2;
    ds.forEach((d, i) => {
      const dernier = i === ds.length - 1;
      const [st, sw] = mode === "s" || dernier ? [ORANGE, 2.6] : [FILET, 1.2];
      body += rect(xs + i * (c + 4), 34, c, 32, "#fff", st, sw, 5);
      body += t(xs + i * (c + 4) + c / 2, 51, d, 18, INK, { weight: 700, font: MATH });
    });
    body += t(
      x0 + 80,
      88,
      mode === "u" ? "le chiffre des unités" : "tous les chiffres :",
      12,
      BRUN,
      {
        weight: 700,
      },
    );
    if (mode === "s") body += t(x0 + 80, 103, "leur somme", 12, BRUN, { weight: 700 });
  });
  return svg(W, H, body, "les deux critères");
}

/* Schéma en barres. lignes : liste de lignes ; une ligne = [proportion, texte, genre] ; genre
   « nb » (blanc), « inc » (bleu pâle), « tot » (total, fond doux). */
export function barres(lignes, options = {}) {
  const { W = 320, legende = null } = options;
  const m = 10;
  const h = 36;
  const gap = 8;
  const total = Math.max(...lignes.map((l) => l.reduce((s, [p]) => s + p, 0)));
  let body = "";
  let y = 6;
  for (const l of lignes) {
    let x = m;
    for (const [p, s, genre] of l) {
      const w = (p / total) * (W - 2 * m);
      const fond = { nb: "#ffffff", inc: INC_FOND, tot: "#f5f9fc" }[genre];
      body += rect(x, y, w, h, fond, genre === "inc" ? INC_TEXTE : "#5d6778", 1.4, 3);
      body += t(x + w / 2, y + h / 2 + 1, s, 16, genre === "inc" ? INC_TEXTE : INK, {
        weight: 700,
        font: MATH,
      });
      x += w;
    }
    y += h + gap;
  }
  if (legende) {
    body += t(W / 2, y + 8, legende, 12, GRIS);
    y += 22;
  }
  return svg(W, y, body, "schéma en barres");
}

/* Paires de facteurs 1 × n, 2 × □, 3 × □… ; lignes = [d, partenaire ou null, barrée]. */
export function pairesBarre(
  n,
  lignes,
  legende = "si la division ne tombe pas juste, je barre la ligne",
) {
  const W = 300;
  const rh = 26;
  let body = "";
  lignes.forEach(([d, q, barree], i) => {
    const y = 6 + i * rh;
    body += t(80, y + rh / 2, String(d), 17, INK, { weight: 700, font: MATH });
    body += t(108, y + rh / 2, "×", 17, INK, { font: MATH });
    if (q === null) body += carreVide(140, y + rh / 2, 20);
    else body += t(140, y + rh / 2, String(q), 17, INK, { weight: 700, font: MATH });
    body += t(172, y + rh / 2, `= ${n}`, 17, INK, { font: MATH, anchor: "start" });
    if (barree) body += line(64, y + rh / 2, 226, y + rh / 2, "#a93030", 2.4);
  });
  const H = 6 + lignes.length * rh;
  body += t(110, H + 4, "⋮", 16, FILET);
  body += t(W / 2, H + 22, legende, 12, BRUN, { weight: 700 });
  return svg(W, H + 32, body, "paires de facteurs");
}

/* Arbre de facteurs : n → □ × □ (aide), ou n → a × b avec a entouré (indice : la première
   branche) ; deux pointillés « ? » sous b : je continue. */
export function arbre(n, a = null, b = null, legende = null) {
  const W = 260;
  let H = 130;
  let body = t(W / 2, 20, String(n), 22, INK, { weight: 700, font: MATH });
  body +=
    line(W / 2 - 8, 32, W / 2 - 48, 66, INK, 1.6) + line(W / 2 + 8, 32, W / 2 + 48, 66, INK, 1.6);
  if (a === null) {
    body += carreVide(W / 2 - 56, 82, 26) + carreVide(W / 2 + 56, 82, 26);
    body += t(W / 2, 83, "×", 18, INK, { font: MATH });
  } else {
    body += `<circle cx="${W / 2 - 56}" cy="82" r="17" fill="#fff" stroke="${ORANGE}" stroke-width="2.4"/>`;
    body += t(W / 2 - 56, 83, String(a), 18, INK, { weight: 700, font: MATH });
    body += t(W / 2 + 56, 83, String(b), 18, INK, { weight: 700, font: MATH });
  }
  body +=
    line(W / 2 + 48, 98, W / 2 + 30, 116, FILET, 1.4, "3 3") +
    line(W / 2 + 64, 98, W / 2 + 82, 116, FILET, 1.4, "3 3");
  body +=
    t(W / 2 + 26, 124, "?", 14, INC_TEXTE, { weight: 700 }) +
    t(W / 2 + 86, 124, "?", 14, INC_TEXTE, { weight: 700 });
  if (legende) {
    body += t(W / 2, H + 8, legende, 12, GRIS);
    H += 20;
  }
  return svg(W, H + 4, body, "arbre de facteurs");
}

/* total cases rangées par lignes de parLigne (la dernière peut être incomplète, ses places vides en
   pointillés). On peut compter, rien n'est écrit. */
export function cases(total, parLigne, options = {}) {
  const { legende = null, c = 14 } = options;
  const g = 3;
  const rangs = Math.ceil(total / parLigne);
  const W = Math.max(parLigne * (c + g) + 30, legende ? 330 : 200);
  const x0 = (W - parLigne * (c + g)) / 2;
  let body = "";
  let k = 0;
  for (let r = 0; r < rangs; r++)
    for (let j = 0; j < parLigne; j++, k++) {
      const x = x0 + j * (c + g);
      const y = 8 + r * (c + g + 2);
      body +=
        k >= total
          ? rect(x, y, c, c, "none", FILET, 1, 2, "2 2")
          : rect(x, y, c, c, "#e0f2f1", TURQ, 1, 2);
    }
  let H = 8 + rangs * (c + g + 2) + 4;
  if (legende) {
    body += t(W / 2, H + 10, legende, 12, GRIS);
    H += 24;
  }
  return svg(W, H, body, "cases à compter");
}

/* NC18-e : la grille vide « par 2 ? par 3 ? … » et, dessous, pourquoi on s'arrête à 7. */
export function premiersGrille(nombres, diviseurs) {
  const cw = 52;
  const rh = 30;
  const W = Math.max(70 + diviseurs.length * cw + 10, 320);
  let body = "";
  diviseurs.forEach((d, j) => {
    body += rect(70 + j * cw, 4, cw, rh, "#f5f9fc", FILET, 1.1);
    body += t(70 + j * cw + cw / 2, 4 + rh / 2, `par ${d} ?`, 12, BLEU, { weight: 800 });
  });
  nombres.forEach((nb, i) => {
    const y = 4 + rh + i * rh;
    body += t(40, y + rh / 2, String(nb), 18, INK, { weight: 700, font: MATH });
    diviseurs.forEach((_, j) => (body += rect(70 + j * cw, y, cw, rh, "#fff", FILET, 1.1)));
  });
  const H = 4 + rh * (nombres.length + 1) + 6;
  body += t(W / 2, H + 8, "Je m'arrête à 7 :", 12, BRUN, { weight: 800 });
  body += t(W / 2, H + 24, "11 × 11 = 121 : plus grand que tous ces nombres", 12, BRUN, {
    weight: 700,
  });
  return svg(W, H + 32, body, "grille des diviseurs");
}

/* Deux OVALES « facteurs de a » / « facteurs de b » (demande du 24/10 : les facteurs s'écrivent en
   ligne). Sans commun : les décompositions au-dessus, ovales vides. commun = [gauche, milieu, droite].
   Une décomposition longue (96 = 2 × 2 × 2 × 2 × 2 × 3) : les deux lignes l'une sous l'autre. */
export function venn(a, b, fa, fb, commun = null) {
  const W = 340;
  const ea = `${a} = ${fa.join(" × ")}`;
  const eb = `${b} = ${fb.join(" × ")}`;
  const largeur = (s) => s.length * 7.6;
  const empile = largeur(ea) > 150 || largeur(eb) > 150;
  const dy = empile ? 22 : 0;
  let body = "";
  if (empile) {
    body += t(W / 2, 14, ea, 16, INK, { weight: 700, font: MATH });
    body += t(W / 2, 36, eb, 16, INK, { weight: 700, font: MATH });
  } else {
    body += t(90, 14, ea, 16, INK, { weight: 700, font: MATH });
    body += t(250, 14, eb, 16, INK, { weight: 700, font: MATH });
  }
  body += `<ellipse cx="118" cy="${108 + dy}" rx="104" ry="56" fill="#dcfce7" fill-opacity=".5" stroke="${VERT}" stroke-width="2"/>`;
  body += `<ellipse cx="222" cy="${108 + dy}" rx="104" ry="56" fill="${INC_FOND}" fill-opacity=".5" stroke="${INC_TEXTE}" stroke-width="2"/>`;
  body += t(70, 40 + dy, `facteurs de ${a}`, 12, "#166534", { weight: 800 });
  body += t(270, 40 + dy, `facteurs de ${b}`, 12, INC_TEXTE, { weight: 800 });
  if (commun) {
    const [ga, cm, gb] = commun;
    body += t(66, 110 + dy, ga.join(" × "), 17, INK, { weight: 700, font: MATH });
    body += t(170, 110 + dy, cm.join(" × "), 17, BRUN, { weight: 800, font: MATH });
    body += t(274, 110 + dy, gb.join(" × "), 17, INK, { weight: 700, font: MATH });
  }
  return svg(W, 176 + dy, body, "diagramme des facteurs");
}

/* Droite graduée (version des cahiers). labels : {valeur: texte} sous la droite ; sauts : [de, à,
   texte, couleur, niveau] (niveau > 0 au-dessus, < 0 au-dessous) ; petits : graduations fines. */
export function droite(vmin, vmax, ticks, labels, options = {}) {
  const { sauts = [], petits = [], W = 340 } = options;
  const m = 26;
  const X = (v) => m + ((v - vmin) / (vmax - vmin)) * (W - 2 * m);
  const nsauts = Math.max(0, ...sauts.map((s) => s[4]));
  const yl = 30 + 34 * nsauts;
  let body = line(m - 14, yl, W - m + 14, yl, INK, 1.8);
  body += `<path d="M${W - m + 8},${yl - 5} L${W - m + 16},${yl} L${W - m + 8},${yl + 5}" fill="none" stroke="${INK}" stroke-width="1.8"/>`;
  for (const v of petits) body += line(X(v), yl - 4, X(v), yl + 4, FILET, 1.2);
  for (const v of ticks) body += line(X(v), yl - 8, X(v), yl + 8, INK, 1.8);
  const bas = Math.max(0, ...sauts.filter((s) => s[4] < 0).map((s) => -s[4]));
  for (const [v, s] of Object.entries(labels))
    body += t(X(Number(v)), yl + 22 + 26 * bas, s, 14, INK, { weight: 600, font: MATH });
  for (const [a, b, s, col, niv] of sauts) {
    const xa = X(a);
    const xb = X(b);
    if (niv < 0) {
      const fond = yl + 16 + 26 * -niv;
      body += `<path d="M${n2(xa)},${yl + 4} C${n2(xa)},${fond} ${n2(xb)},${fond} ${n2(xb)},${yl + 4}" fill="none" stroke="${col}" stroke-width="2.4"/>`;
      body += `<path d="M${n2(xb - 6)},${yl + 14} L${n2(xb)},${yl + 4} L${n2(xb + 2)},${yl + 16}" fill="none" stroke="${col}" stroke-width="2.4"/>`;
      continue;
    }
    const haut = yl - 16 - 30 * niv;
    body += `<path d="M${n2(xa)},${yl - 4} C${n2(xa)},${haut} ${n2(xb)},${haut} ${n2(xb)},${yl - 4}" fill="none" stroke="${col}" stroke-width="2.4"/>`;
    const sens = xb > xa ? 1 : -1;
    body += `<path d="M${n2(xb - 7 * sens)},${yl - 13} L${n2(xb)},${yl - 4} L${n2(xb + sens)},${yl - 15}" fill="none" stroke="${col}" stroke-width="2.4"/>`;
    if (s) body += t((xa + xb) / 2, haut - 4, s, 15, col, { weight: 800, font: MATH });
  }
  return svg(W, yl + 34 + 26 * bas, body, "droite graduée");
}

/* Le point de cours (petite croix) gardé pour les lots suivants. */
export { croix };
