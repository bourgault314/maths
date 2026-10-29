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
  const { anchor = "middle", weight = 400, font = null, italic = false } = options;
  const police = font ? ` font-family="${font}"` : "";
  const penche = italic ? ` font-style="italic"` : "";
  return (
    `<text x="${n2(x)}" y="${n2(y)}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ` +
    `font-weight="${weight}"${police}${penche} dominant-baseline="central">${esc(s)}</text>`
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
   texte, couleur, niveau] (niveau > 0 au-dessus, < 0 au-dessous) ; petits : graduations fines ;
   points : [valeur, texte au-dessus, couleur, étage] (une petite croix ; étage 1 : le texte un cran
   plus haut, quand deux points sont trop proches) ; milieu : une valeur dessinée en tirets orange,
   son texte dessous (lot NC-2, arrondis). */
export function droite(vmin, vmax, ticks, labels, options = {}) {
  const {
    sauts = [],
    petits = [],
    W = 340,
    points = [],
    milieu = null,
    milieuTxt = "milieu",
  } = options;
  const m = 26;
  const X = (v) => m + ((v - vmin) / (vmax - vmin)) * (W - 2 * m);
  const nsauts = Math.max(0, ...sauts.map((s) => s[4]));
  const etages = Math.max(0, ...points.map((p) => p[3] || 0));
  const yl = 30 + 34 * nsauts + (points.length ? 18 + 18 * etages : 0);
  let body = line(m - 14, yl, W - m + 14, yl, INK, 1.8);
  body += `<path d="M${W - m + 8},${yl - 5} L${W - m + 16},${yl} L${W - m + 8},${yl + 5}" fill="none" stroke="${INK}" stroke-width="1.8"/>`;
  for (const v of petits) body += line(X(v), yl - 4, X(v), yl + 4, FILET, 1.2);
  for (const v of ticks) body += line(X(v), yl - 8, X(v), yl + 8, INK, 1.8);
  const bas = Math.max(0, ...sauts.filter((s) => s[4] < 0).map((s) => -s[4]));
  for (const [v, s] of Object.entries(labels))
    body += t(X(Number(v)), yl + 22 + 26 * bas, s, 14, INK, { weight: 600, font: MATH });
  if (milieu !== null) {
    body += line(X(milieu), yl - 16, X(milieu), yl + 16, ORANGE, 2, "4 3");
    body += t(X(milieu), yl + 40, milieuTxt, 12.5, BRUN, {
      weight: 700,
      font: milieuTxt !== "milieu" ? MATH : null,
    });
  }
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
  for (const [v, s, col = BLEU, etage = 0] of points) {
    body += croix(X(v), yl, col);
    if (s)
      body += t(X(v), sauts.length ? yl + 24 : yl - 20 - 18 * etage, s, 14, col, {
        weight: 800,
        font: MATH,
      });
  }
  return svg(W, yl + (milieu !== null ? 52 : 34) + 26 * bas, body, "droite graduée");
}

/* ===================================================================== lot NC-2 (NC01, NC02, NC03)
   Repris de aides.py (version 3 du cahier) : le tableau de numération, les nombres alignés sur la
   virgule, l'unité en 100 centièmes, les arrondis d'un produit, l'estimation d'une somme. */

// Les couleurs des rangs (celles du plateau de Gwenaël) : fond, texte de l'en-tête, bord.
export const RANGS = {
  milliers: ["#f5f9fc", INK, FILET],
  centaines: ["#f5f9fc", INK, FILET],
  dizaines: ["#f5f9fc", INK, FILET],
  unités: ["#fee2e2", "#c81e1e", "#ef4444"],
  dixièmes: ["#dcfce7", "#166534", "#22c55e"],
  centièmes: ["#fef9c3", "#6f5b00", "#facc15"],
  millièmes: ["#ede9fe", "#6d28d9", "#7c3aed"],
};

/* Une vraie virgule (le caractère), grande, posée DEVANT le trait de colonne ; y = ligne de base des
   chiffres. Le contour blanc la détache du trait. */
export function virgule(x, y, k = 1, col = "#c81e1e") {
  return (
    `<text x="${n2(x)}" y="${n2(y)}" font-size="${n2(40 * k)}" font-family="${MATH}" font-weight="700" fill="${col}" ` +
    `stroke="#fff" stroke-width="${n2(3.5 * k)}" paint-order="stroke" text-anchor="middle">,</text>`
  );
}

/* Le tableau de numération. cols : les rangs ; chiffres : {rang: chiffre} (données seulement ; « ? »
   en bleu) ; surligne : le rang entouré d'orange ; entetesFraction : 1/10, 1/100… en en-tête ;
   etiquettes : {rang: petit texte sous la colonne, avec sa flèche} (« 7/10 »). */
export function tableauRangs(cols, chiffres = null, options = {}) {
  const {
    surligne = null,
    entetesFraction = false,
    etiquettes = null,
    lignes = 1,
    virguleApres = "unités",
  } = options;
  const cw = 64;
  const hh = 30;
  const rh = 40;
  const W = cols.length * cw + 20;
  const x0 = 10;
  const frac = { dixièmes: "1/10", centièmes: "1/100", millièmes: "1/1000" };
  let body = "";
  cols.forEach((col, i) => {
    const [fond, texte, bord] = RANGS[col];
    const x = x0 + i * cw;
    body += rect(x, 4, cw, hh, fond, bord, 1.2);
    const lab = entetesFraction && frac[col] ? frac[col] : col;
    body += t(x + cw / 2, 4 + hh / 2, lab, entetesFraction ? 13 : 11.5, texte, { weight: 700 });
    for (let r = 0; r < lignes; r++) {
      const y = 4 + hh + r * rh;
      body += rect(x, y, cw, rh, "#fff", FILET, 1.2);
      if (r === 0 && chiffres && col in chiffres) {
        const v = chiffres[col];
        body += t(x + cw / 2, y + rh / 2 + 1, v, 22, v === "?" ? INC_TEXTE : INK, {
          weight: 700,
          font: MATH,
        });
      }
    }
  });
  if (cols.includes(virguleApres)) {
    const xv = x0 + (cols.indexOf(virguleApres) + 1) * cw;
    for (let r = 0; r < lignes; r++) body += virgule(xv, 4 + hh + r * rh + rh / 2 + 10, 1.5);
  }
  const H = 4 + hh + lignes * rh;
  if (surligne) {
    const i = cols.indexOf(surligne);
    body += rect(x0 + i * cw - 2, 2, cw + 4, H, "none", ORANGE, 3.2, 4);
  }
  let y = H + 8;
  if (etiquettes) {
    cols.forEach((col, i) => {
      if (!(col in etiquettes)) return;
      const x = x0 + i * cw + cw / 2;
      body += line(x, H + 18, x, H + 6, ORANGE, 1.8);
      body += `<path d="M${n2(x - 4)},${H + 11} L${n2(x)},${H + 5} L${n2(x + 4)},${H + 11}" fill="none" stroke="${ORANGE}" stroke-width="1.8"/>`;
      body += t(x, H + 30, etiquettes[col], 15, INK, { weight: 700, font: MATH });
    });
    y = H + 44;
  }
  return svg(W, y, body, "tableau de numération");
}

/* Les nombres l'un sous l'autre, virgules alignées, dans les colonnes du tableau ; zeros :
   {rang du nombre: zéros ajoutés} (en gris, en italique). Une lettre A, B, C devant chaque ligne. */
export function alignes(nombres, cols, zeros = {}, legende = null) {
  const cw = 46;
  const hh = 26;
  const rh = 34;
  const W = cols.length * cw + 60;
  const x0 = 50;
  const ENTETE = {
    unités: "U",
    dizaines: "D",
    centaines: "C",
    dixièmes: "1/10",
    centièmes: "1/100",
    millièmes: "1/1000",
  };
  let body = "";
  cols.forEach((col, i) => {
    const [fond, texte, bord] = RANGS[col];
    body += rect(x0 + i * cw, 4, cw, hh, fond, bord, 1.1);
    body += t(x0 + i * cw + cw / 2, 4 + hh / 2, ENTETE[col], 12, texte, { weight: 800 });
  });
  const iu = cols.indexOf("unités");
  nombres.forEach((nb, r) => {
    const y = 4 + hh + r * rh;
    const neg = nb.startsWith("−");
    const [ent, dec0 = ""] = nb.replace(/^−/, "").split(",");
    const nz = zeros[r] || 0;
    const dec = dec0 + "0".repeat(nz);
    for (let i = 0; i < cols.length; i++)
      body += rect(x0 + i * cw, y, cw, rh, "#fff", "#d6dde7", 1);
    [...ent].reverse().forEach((ch, k) => {
      body += t(x0 + (iu - k) * cw + cw / 2, y + rh / 2 + 1, ch, 20, INK, {
        weight: 700,
        font: MATH,
      });
    });
    [...dec].forEach((ch, k) => {
      const ajout = k >= dec.length - nz;
      body += t(x0 + (iu + 1 + k) * cw + cw / 2, y + rh / 2 + 1, ch, 20, ajout ? FILET : INK, {
        weight: 700,
        font: MATH,
        italic: ajout,
      });
    });
    if (neg)
      body += t(x0 + (iu - ent.length) * cw + cw - 8, y + rh / 2 + 1, "−", 20, INK, {
        weight: 700,
        font: MATH,
      });
    body += virgule(x0 + (iu + 1) * cw, y + rh / 2 + 8, 0.9, INK);
    body += t(18, y + rh / 2, String.fromCharCode(65 + r), 13, GRIS, { weight: 800 });
  });
  let H = 4 + hh + nombres.length * rh + 6;
  if (legende) {
    body += t(W / 2, H + 8, legende, 12, GRIS);
    H += 22;
  }
  return svg(W, H, body, "nombres alignés");
}

/* Ordre de grandeur : a × b, et sous chaque facteur une flèche « ≈ » vers une case vide (aide) ou
   le nombre proche (indice, explication). */
export function arrondisProduit(a, ar, b, br) {
  let body =
    t(80, 22, a, 22, INK, { weight: 700, font: MATH }) +
    t(150, 22, "×", 22, INK, { font: MATH }) +
    t(220, 22, b, 22, INK, { weight: 700, font: MATH });
  for (const [x, v] of [
    [80, ar],
    [220, br],
  ]) {
    body += line(x, 38, x, 58, ORANGE, 2);
    body += `<path d="M${x - 5},52 L${x},60 L${x + 5},52" fill="none" stroke="${ORANGE}" stroke-width="2"/>`;
    body += t(x + 18, 48, "≈", 14, BRUN, { weight: 700 });
    body += v === "□" ? carreVide(x, 76, 26) : t(x, 76, v, 22, INK, { weight: 700, font: MATH });
  }
  body += t(150, 76, "×", 22, INK, { font: MATH });
  body += t(150, 98, "un nombre proche, facile à calculer", 12, GRIS);
  return svg(300, 108, body, "ordre de grandeur");
}

/* Une unité en 100 centièmes : une colonne entourée = 1 dixième = 10 centièmes ; un petit carré plus
   foncé = 1 centième. On peut compter. */
export function grille100(legende = null, dixieme = true) {
  const c = 11;
  const x0 = 30;
  const y0 = 10;
  let body = "";
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++)
      body += rect(x0 + j * c, y0 + i * c, c, c, "#fef9c3", "#b59a00", 0.6);
  body += rect(x0, y0, 10 * c, 10 * c, "none", "#ef4444", 3);
  if (dixieme) {
    body += rect(x0 + 8 * c, y0, c, 10 * c, "#dcfce7", "#166534", 2.2);
    for (let i = 0; i < 10; i++) body += rect(x0 + 8 * c, y0 + i * c, c, c, "none", "#166534", 0.6);
  }
  body += rect(x0 + 9 * c, y0 + 9 * c, c, c, "#facc15", "#111", 1.6);
  body += t(x0 + 5 * c, y0 + 10 * c + 16, "1 unité = 100 centièmes", 13, "#c81e1e", {
    weight: 800,
  });
  const xr = x0 + 10 * c + 60;
  if (dixieme) {
    body += line(x0 + 8.5 * c, y0 + 2 * c, xr - 6, y0 + 14, "#166534", 1.6);
    body += t(xr + 56, y0 + 8, "1 dixième", 13, "#166534", { weight: 800 });
    body += t(xr + 56, y0 + 24, "= 10 centièmes", 13, "#166534", { weight: 800 });
  }
  body += line(x0 + 9.5 * c + 6, y0 + 9.5 * c, xr - 6, y0 + 9.5 * c - 22, ORANGE, 1.6);
  body += t(xr + 56, y0 + 9.5 * c - 26, "1 centième", 13, "#6f5b00", { weight: 800 });
  let H = y0 + 10 * c + 28;
  if (legende) {
    body += t(170, H + 4, legende, 12, GRIS);
    H += 20;
  }
  return svg(340, H, body, "une unité en centièmes");
}

/* a + b ≈ □ + □ : j'estime avant de juger le résultat annoncé. */
export function estimerSomme(a, b, annonce) {
  const W = 320;
  let body =
    t(80, 22, a, 22, INK, { weight: 700, font: MATH }) +
    t(140, 22, "+", 22, INK, { font: MATH }) +
    t(200, 22, b, 22, INK, { weight: 700, font: MATH });
  body += t(262, 22, `= ${annonce} ?`, 18, INC_TEXTE, { weight: 800, font: MATH });
  for (const x of [80, 200]) {
    body += line(x, 38, x, 56, ORANGE, 2);
    body += `<path d="M${x - 5},50 L${x},58 L${x + 5},50" fill="none" stroke="${ORANGE}" stroke-width="2"/>`;
    body += t(x + 16, 46, "≈", 14, BRUN, { weight: 700 });
    body += carreVide(x, 74, 26);
  }
  body +=
    t(140, 74, "+", 22, INK, { font: MATH }) +
    t(240, 74, "≈", 20, INK, { font: MATH }) +
    carreVide(280, 74, 30);
  body += t(W / 2, 104, "environ combien ? le résultat annoncé est-il proche ?", 12, GRIS);
  return svg(W, 112, body, "estimer la somme");
}

/* ===================================================================== lot NC-3 (NC04)
   Repris de aides.py (version 3 du cahier) : les cases des tables, la soustraction posée, le
   rectangle qui compense, le glisse-nombre (dessiné ; la bande manipulable viendra dans son propre
   lot, choix de Gwenaël du 29/10), le rectangle de la décomposition, les bandes de dixièmes, la
   division écrite en fraction, le produit de deux décimaux (aire, puis × 10, × 10 et le retour). */
export const DIX_ORANGE = "#fab464";

/* Une pointe de flèche pleine, dans l'axe (ux, uy) de son trait, la pointe en (x, y). Remarque de
   Gwenaël du 30/10 : une pointe « > » posée de travers sur une courbe qui descend ne va pas. */
function pointe(x, y, ux, uy, couleur = ORANGE, longueur = 9, demi = 5) {
  const n = Math.hypot(ux, uy) || 1;
  const [dx, dy] = [ux / n, uy / n];
  const [bx, by] = [x - longueur * dx, y - longueur * dy];
  return `<path d="M${n2(x)},${n2(y)} L${n2(bx - demi * dy)},${n2(by + demi * dx)} L${n2(bx + demi * dy)},${n2(by - demi * dx)} Z" fill="${couleur}"/>`;
}

// Une flèche courte vers le bas (les « × 10 » de la division et du produit).
const flecheBas = (x, couleur = ORANGE) =>
  line(x, 38, x, 62, couleur, 2.2) +
  `<path d="M${n2(x - 5)},56 L${n2(x)},64 L${n2(x + 5)},56" fill="none" stroke="${couleur}" stroke-width="2.2"/>`;

/* NC04-a : les cases à compter, le total écrit au-dessus (« 42 cases ») et « 6 par ligne » à gauche
   (des données de la question, jamais la réponse). totalTexte : ce qu'on écrit au-dessus quand le
   total est ce qu'on cherche (« ? cases », pour un produit). */
export function casesTables(total, parLigne, options = {}) {
  const { totalTexte = `${total} cases` } = options;
  const c = 14;
  const g = 3;
  const rangs = Math.ceil(total / parLigne);
  const wgrid = parLigne * (c + g);
  const W = Math.max(wgrid + 150, 300);
  const x0 = (W - wgrid) / 2 + 30;
  let body = t(x0 + wgrid / 2, 12, totalTexte, 14, INK, { weight: 800 });
  let k = 0;
  for (let r = 0; r < rangs; r++)
    for (let j = 0; j < parLigne; j++, k++) {
      const y = 26 + r * (c + g + 2);
      body +=
        k < total
          ? rect(x0 + j * (c + g), y, c, c, "#e0f2f1", TURQ, 1, 2)
          : rect(x0 + j * (c + g), y, c, c, "none", FILET, 1, 2, "2 2");
    }
  const hg = rangs * (c + g + 2);
  body += t(x0 - 12, 26 + hg / 2, `${parLigne} par ligne`, 13, BRUN, {
    anchor: "end",
    weight: 800,
  });
  body += line(x0 - 8, 26, x0 - 8, 26 + hg - 4, BRUN, 1.4);
  return svg(W, 26 + hg + 6, body, "cases à compter");
}

/* NC04-b : a − b posée en colonnes, virgules alignées (0 ajoutés), la ligne du résultat en cases
   vides. signe « + » : l'addition posée, de la même façon (les tirages « 3,4 + 9,1 »). */
export function operationPosee(a, b, signe = "−") {
  const [ea, da0 = ""] = a.split(",");
  const [eb, db0 = ""] = b.split(",");
  const nd = Math.max(da0.length, db0.length);
  const ne = Math.max(ea.length, eb.length);
  const [da, db] = [da0.padEnd(nd, "0"), db0.padEnd(nd, "0")];
  const cw = 26;
  const W = 220;
  const x0 = W / 2 - ((ne + nd) * cw) / 2 + 10;
  const gras = { weight: 700, font: MATH };
  let body = "";
  [
    [ea, da],
    [eb, db],
  ].forEach(([e, d], r) => {
    const y = 26 + r * 32;
    [...e.padStart(ne)].forEach((ch, k) => {
      if (ch !== " ") body += t(x0 + k * cw + cw / 2, y, ch, 22, INK, gras);
    });
    [...d].forEach((ch, k) => (body += t(x0 + (ne + k) * cw + cw / 2 + 6, y, ch, 22, INK, gras)));
    body += t(x0 + ne * cw + 3, y + 2, ",", 24, INK, gras);
  });
  body += t(x0 - 14, 58, signe, 22, INK, { font: MATH });
  const yl = 76;
  body += line(x0 - 22, yl, x0 + (ne + nd) * cw + 14, yl, INK, 2);
  for (let k = 0; k < ne + nd; k++)
    body += rect(
      x0 + k * cw + (k >= ne ? 6 : 0) + 3,
      yl + 8,
      cw - 6,
      26,
      "#fff",
      FILET,
      1.2,
      3,
      "3 2",
    );
  body += t(x0 + ne * cw + 3, yl + 26, ",", 24, INK, gras);
  return svg(W, yl + 42, body, signe === "+" ? "addition posée" : "soustraction posée");
}

/* NC04-c : le rectangle a × (dizaine ronde), la dernière colonne hachurée d'orange : elle est de
   trop (a × 29 = a × 30 − a). Les tirages « 6 × 31 » : la colonne est EN PLUS, à droite, en orange
   plein (a × 31 = a × 30 + a). Une colonne garde au moins 8 px (pour 99 : 2,5 px dans le cahier). */
export function aireCompensation(a, proche, b, legende = null) {
  const W = 330;
  const H = 150;
  const [x0, y0, w, h] = [40, 34, 250, 80];
  const chiffre = { weight: 700, font: MATH };
  let body = "";
  if (b < proche) {
    body += rect(x0, y0, w, h, "#e0f2f1", TURQ, 1.6, 2);
    const xc = x0 + w - Math.max((w / proche) * (proche - b), 8);
    body +=
      `<defs><pattern id="hach" width="6" height="6" patternUnits="userSpaceOnUse" ` +
      `patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${ORANGE}" stroke-width="2.2"/></pattern></defs>`;
    body += rect(xc, y0, x0 + w - xc, h, "url(#hach)", ORANGE, 2);
    body += t(x0 + w / 2, y0 - 14, String(proche), 15, INK, chiffre);
    body += line(x0, y0 - 4, x0 + w, y0 - 4, INK, 1.2);
    body += t(x0 - 16, y0 + h / 2, String(a), 15, INK, chiffre);
    body += t(x0 + (xc - x0) / 2, y0 + h + 16, String(b), 15, INK, chiffre);
    body += line(x0, y0 + h + 5, xc, y0 + h + 5, INK, 1.2);
    body += t((xc + x0 + w) / 2, y0 + h + 16, String(proche - b), 15, BRUN, chiffre);
  } else {
    const xc = x0 + w - Math.max((w / b) * (b - proche), 8);
    body += rect(x0, y0, xc - x0, h, "#e0f2f1", TURQ, 1.6, 2);
    body += rect(xc, y0, x0 + w - xc, h, "#fde5c4", ORANGE, 2, 2);
    body += t(x0 + (xc - x0) / 2, y0 - 14, String(proche), 15, INK, chiffre);
    body += line(x0, y0 - 4, xc, y0 - 4, INK, 1.2);
    body += t((xc + x0 + w) / 2, y0 - 14, String(b - proche), 15, BRUN, chiffre);
    body += t(x0 - 16, y0 + h / 2, String(a), 15, INK, chiffre);
    body += t(x0 + w / 2, y0 + h + 16, String(b), 15, INK, chiffre);
    body += line(x0, y0 + h + 5, x0 + w, y0 + h + 5, INK, 1.2);
  }
  if (legende) body += t(W / 2, H - 2, legende, 12, GRIS);
  return svg(W, H + 6, body, "rectangle de cases");
}

/* Le glisse-nombre de la V1 (dnb_02b) : en-têtes, la BANDE grise (le nombre de départ) et la ligne
   d'arrivée ; colonne des unités en bleu ; virgule orange posée DEVANT, après les unités. haut, bas :
   {rang: chiffre}. decalage : n rangs (> 0 vers la gauche, < 0 vers la droite) → une flèche par
   chiffre, du haut vers sa place en bas (explication) ; fleches : les rangs qui en ont une (sans les 0
   de tête de 0,45, qui n'arrivent sur aucun chiffre). Sept colonnes, de milliers à millièmes ; quand
   un tirage va plus loin (65 520, 583 000), les sept colonnes glissent vers la gauche, et les rangs
   « de mille » s'écrivent sur deux lignes. */
export const RANGS_GLISSE = [
  "centaines de mille",
  "dizaines de mille",
  "milliers",
  "centaines",
  "dizaines",
  "unités",
  "dixièmes",
  "centièmes",
  "millièmes",
];
export const GN_COLS = RANGS_GLISSE.slice(2);

// Les sept colonnes qui montrent tous les rangs utilisés (milliers à millièmes si possible).
export function colonnesGlisse(...rangsUtilises) {
  const indices = rangsUtilises.flat().map((rang) => RANGS_GLISSE.indexOf(rang));
  const debut = Math.min(2, ...indices);
  return RANGS_GLISSE.slice(debut, debut + 7);
}

export function glisseNombre(haut, bas = null, options = {}) {
  const { cols = GN_COLS, decalage = null, legende = null, fleches = null } = options;
  // ecart : l'espace entre la bande et la ligne d'arrivée (6 px dans le cahier ; 24 px depuis le 30/10,
  // pour que les flèches droites aient la place de rester séparées).
  const [cw, hh, rh, ecart] = [46, 26, 40, 24];
  const W = cols.length * cw + 14;
  const x0 = 7;
  const iu = cols.indexOf("unités");
  // Le cadre entoure aussi la ligne d'arrivée (dans le cahier, elle dépassait de 2 px en bas).
  let body = rect(
    x0 - 2,
    2,
    cols.length * cw + 4,
    hh + 2 * rh + ecart + 4,
    "#fff",
    "#1f2f45",
    2,
    10,
  );
  cols.forEach((col, i) => {
    const x = x0 + i * cw;
    const unites = col === "unités";
    body += rect(x, 4, cw, hh, unites ? "#e8f1fd" : "#f5f9fc", "#c9d3df", 0.8);
    // Les en-têtes longs (« centièmes », « millièmes ») un peu plus petits : à 9,5 px, ils se touchaient.
    const taille = col.split(" de ")[0].length > 8 ? 8.6 : 9.5;
    const style = [taille, unites ? "#1d4ed8" : INK, { weight: unites ? 800 : 600 }];
    const [mot, mille] = col.split(" de ");
    if (mille) {
      body += t(x + cw / 2, 4 + hh / 2 - 5.5, mot, ...style);
      body += t(x + cw / 2, 4 + hh / 2 + 5.5, `de ${mille}`, ...style);
    } else body += t(x + cw / 2, 4 + hh / 2, col, ...style);
    body += rect(x, 4 + hh, cw, rh, "#e2e6ec", "#c9d3df", 0.8);
    body += rect(x, 4 + hh + rh + ecart, cw, rh, "#fff", "#c9d3df", 0.8);
  });
  const ys = [4 + hh + rh / 2 + 1, 4 + hh + rh + ecart + rh / 2 + 1];
  [haut, bas].forEach((source, rang) => {
    if (!source) return;
    for (const [col, d] of Object.entries(source)) {
      const x = x0 + cols.indexOf(col) * cw + cw / 2;
      const bleu = col === "unités" && rang === 1;
      body += t(x, ys[rang], d, 24, bleu ? "#1d4ed8" : INK, { weight: 700, font: MATH });
    }
  });
  if (decalage)
    for (const col of fleches ?? Object.keys(haut)) {
      const i = cols.indexOf(col);
      const j = i - decalage;
      if (j < 0 || j >= cols.length) continue;
      const [xa, xb] = [x0 + i * cw + cw / 2, x0 + j * cw + cw / 2];
      // Remarques de Gwenaël du 29 et du 30/10 (« la pointe est mal faite », « tes flèches se
      // touchent ») : une flèche DROITE par chiffre, toutes parallèles (même décalage), la pointe
      // pleine dans l'axe du trait, juste au-dessus du chiffre d'arrivée.
      const [ya, yb] = [ys[0] + 13, ys[1] - 15];
      const n = Math.hypot(xb - xa, yb - ya);
      const [ux, uy] = [(xb - xa) / n, (yb - ya) / n];
      body += line(xa, ya, xb - 8 * ux, yb - 8 * uy, ORANGE, 2.2);
      body += pointe(xb, yb, ux, uy);
    }
  const xv = x0 + (iu + 1) * cw;
  for (const y of ys) body += virgule(xv, y + 9, 1.2, ORANGE);
  let H = hh + 2 * rh + ecart + 8;
  if (legende) {
    body += t(W / 2, H + 10, legende, 12, BRUN, { weight: 800 });
    H += 22;
  }
  return svg(W, H, body, "glisse-nombre");
}

/* NC04-e : le rectangle de la décomposition, (ent + 0,dec) en haut, k sur le côté ; deux morceaux, deux
   produits (pas à l'échelle pour la partie décimale). montre : les produits écrits (explication).
   Les nombres sont donnés écrits (« 9 », « 0,3 », « 36 », « 1,2 », « 37,2 »). */
export function aireDecompo(ent, dec, k, produits = null) {
  const W = 330;
  const [x0, y0, h] = [46, 30, 84];
  const [w1, w2] = [190, 70];
  const gras = (poids) => ({ weight: poids, font: MATH });
  let body =
    rect(x0, y0, w1, h, "#e0f2f1", TURQ, 1.8, 2) +
    rect(x0 + w1, y0, w2, h, "#fde5c4", "#b45309", 1.8, 2);
  body += t(x0 + w1 / 2, y0 - 12, ent, 17, INK, gras(800));
  body += t(x0 + w1 + w2 / 2, y0 - 12, dec, 17, INK, gras(800));
  body += t(x0 - 16, y0 + h / 2, k, 17, INK, gras(800));
  body += t(x0 + w1 / 2, y0 + h / 2 - 12, `${ent} × ${k}`, 16, INK, { font: MATH });
  body += t(x0 + w1 + w2 / 2, y0 + h / 2 - 12, `${dec} × ${k}`, 14, INK, { font: MATH });
  if (!produits) {
    body +=
      carreVide(x0 + w1 / 2, y0 + h / 2 + 16, 24) +
      carreVide(x0 + w1 + w2 / 2, y0 + h / 2 + 16, 22);
    return svg(W, y0 + h + 8, body, "rectangle de la décomposition");
  }
  const [p1, p2, total] = produits;
  body += t(x0 + w1 / 2, y0 + h / 2 + 16, `= ${p1}`, 18, INK, gras(800));
  body += t(x0 + w1 + w2 / 2, y0 + h / 2 + 16, `= ${p2}`, 16, INK, gras(800));
  body += t(W / 2, y0 + h + 22, `${p1} + ${p2} = ${total}`, 18, INK, gras(800));
  return svg(W, y0 + h + 34, body, "rectangle de la décomposition");
}

/* NC04-e, un nombre plus petit que 1 (0,7 × 7) : n bandes-unités de 10 cases, k dixièmes coloriés en
   orange dans chacune ; on compte. */
export function bandesDixiemes(nBandes, k, legende = null) {
  const c = 22;
  const W = 10 * c + 70;
  const x0 = 50;
  let body = "";
  for (let b = 0; b < nBandes; b++) {
    const y = 8 + b * (c + 8);
    body += t(x0 - 26, y + c / 2, String(b + 1), 12, GRIS);
    for (let j = 0; j < 10; j++)
      body += rect(
        x0 + j * c,
        y,
        c,
        c,
        j < k ? DIX_ORANGE : "#ffffff",
        j < k ? "#111111" : FILET,
        1.1,
      );
    body += rect(x0, y, 10 * c, c, "none", "#111111", 2);
  }
  let H = 8 + nBandes * (c + 8);
  if (legende) {
    body += t(W / 2, H + 8, legende, 12, GRIS);
    H += 22;
  }
  return svg(W, H, body, "bandes de dixièmes");
}

/* Une fraction dessinée comme dans l'appli : le MÊME espace au-dessus et au-dessous de la barre. */
function fractionSVG(cx, y, num, den, size = 22, col = INK) {
  const w = Math.max(num.length, den.length) * size * 0.55 + 12;
  const gap = 4 + size * 0.36;
  const style = { weight: 700, font: MATH };
  return [
    t(cx, y - gap, num, size, col, style) +
      `<rect x="${n2(cx - w / 2)}" y="${n2(y - 1.25)}" width="${n2(w)}" height="2.5" rx="1" fill="${col}"/>` +
      t(cx, y + gap, den, size, col, style),
    w,
  ];
}

/* NC04-f d'après Gwenaël (24/10) : la division écrite en FRACTION, numérateur et dénominateur × 10 →
   48/6 ; le quotient ne change pas. q, verif : l'explication (le quotient, la vérification). */
export function divisionFraction(a, b, a10, b10, q = null, verif = null) {
  const W = 330;
  const y = 76;
  const [f1, w1] = fractionSVG(70, y, a, b);
  const [f2, w2] = fractionSVG(200, y, a10, b10);
  let body = f1 + f2;
  body += t(135, y, "=", 24, INK, { font: MATH });
  const [g1, g2] = [70 + w1 / 2 - 4, 200 - w2 / 2 + 4];
  for (const s of [-1, 1]) {
    body += `<path d="M${n2(g1)},${y + 34 * s} C110,${y + 60 * s} 160,${y + 60 * s} ${n2(g2)},${y + 34 * s}" fill="none" stroke="${ORANGE}" stroke-width="2.2"/>`;
    // La pointe pleine dans l'axe de la courbe qui arrive (remarque de Gwenaël du 30/10).
    body += pointe(g2, y + 34 * s, g2 - 160, 26 * s);
    body += t(135, s < 0 ? y - 58 : y + 62, "× 10", 14, BRUN, { weight: 800 });
  }
  body += t(250, y, "=", 24, INK, { font: MATH });
  body += q ? t(285, y, q, 24, INK, { weight: 800, font: MATH }) : carreVide(285, y, 28);
  let H = y + 84;
  body += t(W / 2, H, "× 10 en haut et en bas : le quotient ne change pas", 12, BRUN, {
    weight: 800,
  });
  H += 14;
  if (verif) {
    body +=
      rect(W / 2 - 110, H, 220, 26, "#e5f7eb", VERT, 1.4, 8) +
      t(W / 2, H + 13, `je vérifie : ${verif}`, 14, "#147447", { weight: 800 });
    H += 32;
  }
  return svg(W, H + 4, body, "division écrite en fraction");
}

/* Le cours de NC04-i : comment on montre 0,1 × 0,1 = 0,01 (question de Gwenaël du 30/10). Multiplier
   par 0,1, c'est prendre le dixième (document d'accompagnement de 6e) : l'unité en 100 petits carrés,
   une colonne = 0,1 (un dixième), et le dixième de cette colonne = UN petit carré = 0,01. */
export function dixiemeDeDixieme() {
  const c = 13;
  const [x0, y0] = [20, 10];
  const vertFonce = "#166534";
  let body = "";
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 10; j++) body += rect(x0 + j * c, y0 + i * c, c, c, "#fff", "#d6dde7", 0.6);
  body += rect(x0, y0, c, 10 * c, "#dcfce7", vertFonce, 2);
  for (let i = 0; i < 9; i++) body += rect(x0, y0 + i * c, c, c, "none", vertFonce, 0.6);
  body += rect(x0, y0 + 9 * c, c, c, DIX_ORANGE, "#111", 1.6);
  body += rect(x0, y0, 10 * c, 10 * c, "none", "#ef4444", 2);
  body += t(x0 + 5 * c, y0 + 10 * c + 16, "1 unité = 100 petits carrés", 12, "#c81e1e", {
    weight: 800,
  });
  const xt = 172;
  body += line(x0 + c, y0 + 2.5 * c, xt - 6, 30, vertFonce, 1.6);
  body += t(xt, 26, "une colonne : 0,1", 13, vertFonce, { weight: 800, anchor: "start" });
  body += t(xt, 43, "(le dixième de l'unité)", 12, vertFonce, { anchor: "start" });
  body += line(x0 + c, y0 + 9.5 * c, xt - 6, 112, ORANGE, 1.6);
  body += t(xt, 96, "son dixième :", 13, BRUN, { weight: 800, anchor: "start" });
  body += t(xt, 116, "0,1 × 0,1 = 0,01", 16, INK, { weight: 800, font: MATH, anchor: "start" });
  body += t(xt, 134, "1 petit carré, un centième", 12, BRUN, { anchor: "start" });
  return svg(340, y0 + 10 * c + 26, body, "0,1 × 0,1 = 0,01");
}

/* NC04-i, l'aide et l'explication (choix de Gwenaël du 30/10, d'après le document d'accompagnement
   de 6e : « 0,4 × 0,3 = (0,1 × 4) × (0,1 × 3) = (0,1 × 0,1) × (3 × 4) = 0,01 × 12 ») : chaque nombre
   écrit avec 0,1, puis regroupé ; le fait à connaître « 0,1 × 0,1 = 0,01 » dans son cadre (l'aide
   seulement : l'explication de NC04-i écrit les mêmes calculs, sans dessin). */
export function decompositionDixiemes(a, b, a1, b1) {
  const W = 320;
  const [xa, xb] = [80, 240];
  const gras = { weight: 700, font: MATH };
  const vert = "#147447";
  let body =
    t(xa, 22, a, 24, INK, gras) +
    t(160, 22, "×", 24, INK, { font: MATH }) +
    t(xb, 22, b, 24, INK, gras);
  body += flecheBas(xa) + flecheBas(xb);
  body += t(xa, 86, `${a1} × 0,1`, 20, INK, { font: MATH });
  body += t(160, 86, "×", 20, INK, { font: MATH });
  body += t(xb, 86, `${b1} × 0,1`, 20, INK, { font: MATH });
  body += t(W / 2, 122, `= (${a1} × ${b1}) × (0,1 × 0,1)`, 19, INK, { font: MATH });
  const y = 146;
  body +=
    rect(W / 2 - 100, y, 200, 26, "#e5f7eb", VERT, 1.4, 8) +
    t(W / 2, y + 13, "0,1 × 0,1 = 0,01", 15, vert, { weight: 800 });
  return svg(W, y + 32, body, "les deux nombres écrits avec 0,1");
}

/* Le point de cours (petite croix) gardé pour les lots suivants. */
export { croix };
