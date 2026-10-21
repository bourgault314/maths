import { svg, text as drawText, line, rect, circle } from "./draw.js";

// Figures déterministes : données du générateur, géométrie, puis mise à l'échelle.
const C = {
  ink: "#173e3a",
  green: "#257a60",
  mint: "#d8eee2",
  orange: "#b65a22",
  pale: "#fff0d7",
  gray: "#7b8582",
  blue: "#28618b",
};
const fr = (x) => String(Math.round(x * 1e8) / 1e8).replace(".", ",");
const poly = (p, fill = C.mint, stroke = C.ink) =>
  `<polygon points="${p.map((a) => a.join(",")).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const dash = (x, y, u, v, color = C.gray) =>
  `<line x1="${x}" y1="${y}" x2="${u}" y2="${v}" stroke="${color}" stroke-width="2" stroke-dasharray="6 5"/>`;
const ellipse = (x, y, rx, ry, fill = "none", stroke = C.ink) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const text = (x, y, s, size = 22, color = C.ink) => drawText(x, y, s, Math.max(22, size), color);
const label = (x, y, s, size = 22, color = C.ink) =>
  drawText(x, y, s, Math.max(22, size), color, "middle");
const formula = (...rows) =>
  svg(rows.map((s, i) => label(220, 40 + 38 * i, s, 22)).join(""), 440, 30 + rows.length * 38);
const right = (x, y, size = 12) =>
  line(x, y - size, x + size, y - size) + line(x + size, y - size, x + size, y);
function rectangle(L, l, { diagonal = false, labels = true, fill = C.mint, lit = false } = {}) {
  const a = lit ? 7 : L,
    s = Math.min(280 / a, 140 / l),
    w = a * s,
    h = l * s,
    x = (440 - w) / 2,
    y = (210 - h) / 2;
  return svg(
    rect(x, y, w, h, fill) +
      (diagonal ? dash(x, y, x + w, y + h) : "") +
      (labels
        ? label(220, y + h + 30, `${lit ? "x" : fr(L)} cm`) +
          text(x + w + 12, y + h / 2 + 6, `${fr(l)} cm`, 18)
        : ""),
    440,
    250,
  );
}
function disk(value, { diameter = false, caption = "", answerLabel = false, fill = C.mint } = {}) {
  const cx = 210,
    cy = 114,
    R = 78;
  return svg(
    circle(cx, cy, R, fill) +
      circle(cx, cy, 3, C.ink) +
      line(diameter ? cx - R : cx, cy, cx + R, cy, C.orange, 3) +
      label(
        diameter ? cx : cx + R / 2,
        cy - 12,
        `${diameter ? "d" : "r"} = ${answerLabel ? "?" : fr(value)} cm`,
        18,
        C.orange,
      ) +
      label(220, 225, caption, 18),
    440,
    250,
  );
}
function cornerShape(L, H, a, b, area = false) {
  const s = Math.min(270 / L, 145 / H),
    x = 65,
    y = 35,
    w = L * s,
    h = H * s;
  const points = [
    [x, y],
    [x + w - a * s, y],
    [x + w - a * s, y + b * s],
    [x + w, y + b * s],
    [x + w, y + h],
    [x, y + h],
  ];
  return svg(
    poly(points, area ? C.mint : "none") +
      dash(x + w - a * s, y, x + w, y) +
      dash(x + w, y, x + w, y + b * s) +
      label(x + w / 2, y + h + 28, `${L} cm`) +
      text(x - 54, y + h / 2, `${H} cm`, 18) +
      label(x + w - (a * s) / 2, y - 12, `${a} cm`, 18) +
      text(x + w + 9, y + (b * s) / 2 + 6, `${b} cm`, 18),
    440,
    250,
  );
}
function triangleArea(b, h, { para = false, side = null, duplicate = false } = {}) {
  const shift = para ? 3 : 2,
    s = Math.min(265 / (b + shift), 140 / h),
    A = [55, 190],
    B = [55 + b * s, 190],
    T = [55 + shift * s, 190 - h * s],
    U = [55 + (b + shift) * s, 190 - h * s];
  return svg(
    (duplicate ? poly([B, U, T], C.pale) : "") +
      poly(para ? [A, B, U, T] : [A, B, T]) +
      dash(T[0], T[1], T[0], 190, C.orange) +
      right(T[0], 190) +
      label((A[0] + B[0]) / 2, 223, `base : ${b} cm`) +
      text(T[0] + 13, 190 - (h * s) / 2, `${h} cm`, 18, C.orange) +
      (side ? text(20, (A[1] + T[1]) / 2, `${side} cm`, 18) : "") +
      label(T[0], T[1] - 13, para ? "" : "C", 18),
    440,
    250,
  );
}
function unitSquares(full, halves) {
  let s = "";
  for (let i = 0; i < full + halves; i++) {
    const x = 25 + (i % 6) * 61,
      y = 20 + Math.floor(i / 6) * 61;
    s += rect(x, y, 52, 52, i < full ? C.mint : "#fff");
    if (i >= full)
      s += poly(
        [
          [x, y + 52],
          [x + 52, y],
          [x + 52, y + 52],
        ],
        C.pale,
      );
  }
  return svg(s + label(220, 218, "Aire d’un carreau : 1 cm²", 18), 440, 240);
}
function box(L, W, H, labels = true) {
  const s = Math.min(250 / (L + 0.6 * W), 145 / (H + 0.35 * W)),
    o = [75, 205],
    p = (x, y, z) => [o[0] + s * (x + 0.6 * y), o[1] - s * (z + 0.35 * y)];
  let A = p(0, 0, 0),
    B = p(L, 0, 0),
    D = p(0, W, 0),
    E = p(0, 0, H),
    F = p(L, 0, H),
    G = p(L, W, H),
    J = p(L, W, 0),
    K = p(0, W, H);
  let b =
    poly([A, B, F, E], C.mint) +
    poly([B, J, G, F], "#b8d9cd") +
    poly([E, F, G, K], "#edf6ee") +
    dash(...A, ...D) +
    dash(...D, ...J) +
    dash(...D, ...K);
  if (labels)
    b +=
      label((A[0] + B[0]) / 2, 229, `${fr(L)} cm`) +
      text(J[0] + 10, (J[1] + G[1]) / 2, `${fr(H)} cm`, 18) +
      label((B[0] + J[0]) / 2 + 18, (B[1] + J[1]) / 2 + 24, `${fr(W)} cm`, 18);
  return svg(b, 440, 260);
}
function cylinder(radius, height, { diameter = false, section = false, labels = true } = {}) {
  const R = 78,
    top = 65,
    bot = 185;
  let b =
    rect(142, top, 156, bot - top, C.mint) +
    ellipse(220, bot, R, 25, C.mint) +
    ellipse(220, top, R, 25, "#edf6ee") +
    line(142, top, 142, bot) +
    line(298, top, 298, bot);
  if (section)
    b +=
      ellipse(220, 125, R, 25, C.pale, C.orange) +
      dash(220, top, 220, bot, C.gray) +
      label(220, 245, "Plan perpendiculaire à l’axe", 17);
  else if (labels)
    b +=
      line(diameter ? 142 : 220, top, 298, top, C.orange, 3) +
      label(
        diameter ? 220 : 263,
        top - 34,
        `${diameter ? "d" : "r"} = ${fr(diameter ? 2 * radius : radius)} cm`,
        17,
        C.orange,
      ) +
      text(320, 130, `h = ${fr(height)} cm`, 18);
  return svg(b, 440, 265);
}
function pyramid(
  side,
  height,
  { cone = false, letters = false, hideHeight = false, area = null } = {},
) {
  let b = "",
    H,
    T;
  if (cone) {
    const s = Math.min(90 / side, 155 / height),
      R = side * s;
    H = [220, 200];
    T = [220, 200 - height * s];
    b =
      ellipse(...H, R, R * 0.25, C.mint) +
      line(220 - R, 200, ...T) +
      line(220 + R, 200, ...T) +
      line(...H, 220 + R, 200, C.green, 2);
  } else {
    const c = area === null ? side : Math.sqrt(area),
      s = Math.min(230 / (1.6 * c), 155 / (height + 0.35 * c)),
      p = (x, y, z) => [90 + s * (x + 0.6 * y), 210 - s * (z + 0.35 * y)];
    let A = p(0, 0, 0),
      B = p(c, 0, 0),
      D = p(0, c, 0),
      E = p(c, c, 0);
    H = p(c / 2, c / 2, 0);
    T = p(c / 2, c / 2, height);
    b =
      poly([A, B, E, D], C.mint) +
      line(...A, ...T) +
      line(...B, ...T) +
      line(...E, ...T) +
      dash(...D, ...T) +
      line(...H, ...p(c, c / 2, 0), C.green, 2);
    if (letters)
      [
        ["A", A],
        ["B", B],
        ["C", E],
        ["D", D],
      ].forEach(
        ([n, p]) => (b += text(p[0] - (n === "D" ? 24 : 12), p[1] + (n === "D" ? -8 : 20), n, 18)),
      );
  }
  b +=
    dash(...T, ...H, C.orange) +
    right(H[0], H[1], 10) +
    text(
      310,
      (H[1] + T[1]) / 2,
      letters ? "SH" : `h = ${hideHeight ? "?" : fr(height)} cm`,
      18,
      C.orange,
    );
  if (letters) b += label(T[0], T[1] - 14, "S", 18) + text(H[0] - 31, H[1] + 10, "H", 18);
  else
    b += label(
      220,
      248,
      area === null
        ? `${cone ? "Rayon" : "Côté de la base"} : ${fr(side)} cm`
        : `Aire de base : ${fr(area)} cm²`,
      18,
    );
  return svg(b, 440, 265);
}
function sphere(R, { cut = null, r = null, filled = false } = {}) {
  let b =
    circle(160, 115, 88, filled ? C.mint : "none") + (cut === 0 ? "" : ellipse(160, 115, 88, 23));
  if (cut !== null) {
    const shift = (88 * cut) / R,
      rad = (88 * Math.sqrt(R * R - cut * cut)) / R;
    b +=
      ellipse(160, 115 - shift, rad, 18, "none", C.blue) + dash(160, 115, 160, 115 - shift, C.blue);
    if (cut > 0) {
      const s = 130 / R,
        x = 280,
        y = 200,
        hy = y - cut * s,
        ax = x + Math.sqrt(R * R - cut * cut) * s;
      b +=
        text(260, 34, "Coupe de face", 17) +
        poly(
          [
            [x, y],
            [x, hy],
            [ax, hy],
          ],
          "none",
        ) +
        line(x + 10, hy, x + 10, hy + 10) +
        line(x + 10, hy + 10, x, hy + 10) +
        text(x - 32, (hy + y) / 2, `${cut}`, 17, C.blue) +
        text((x + ax) / 2 + 5, (hy + y) / 2 + 20, `${R}`, 17, C.orange) +
        label((x + ax) / 2, hy - 13, r === null ? "r = ?" : `r = ${r}`, 18) +
        label(330, 231, "Longueurs en cm", 17);
    }
  }
  b +=
    circle(160, 115, 3, C.ink) +
    line(160, 115, 248, 115, C.orange, 2) +
    label(160, 225, `R = ${fr(R)} cm`, 22, C.orange) +
    text(142, 141, "O", 18);
  return svg(b, 440, 240);
}
function prism(labels = false) {
  const A = [95, 190],
    B = [215, 210],
    C0 = [155, 105],
    D = [225, 135],
    E = [345, 155],
    F = [285, 50];
  let b =
    poly([A, B, E, D], C.mint) +
    poly([B, C0, F, E], "#c3ddce") +
    poly([A, B, C0], "#f7e3b8") +
    line(...C0, ...F) +
    dash(...D, ...F) +
    dash(...D, ...A);
  if (labels)
    [
      ["A", A],
      ["B", B],
      ["C", C0],
      ["D", D],
      ["E", E],
      ["F", F],
    ].forEach(([n, p]) => (b += text(p[0] - 8, p[1] + (n === "C" || n === "F" ? -12 : 24), n, 18)));
  return svg(b, 440, 250);
}
function gridHeights(a) {
  let b = "";
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) {
      let k = y * 2 + x;
      b +=
        rect(124 + x * 76, 30 + y * 76, 76, 76, a[k] ? C.mint : "#fff") +
        label(162 + x * 76, 76 + y * 76, a[k], 23);
    }
  b +=
    label(162, 22, "A", 18) +
    label(238, 22, "B", 18) +
    text(100, 76, "1", 18) +
    text(100, 152, "2", 18) +
    label(220, 219, "Nombre de cubes par colonne", 17);
  return svg(b, 440, 245);
}
function net(labels = ["A", "B", "C", "D", "E", "F"], invalid = false, offset = 0, scale = 1) {
  let cells = invalid
      ? [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 1],
          [1, 1],
          [2, 1],
        ]
      : [
          [0, 1],
          [1, 1],
          [2, 1],
          [3, 1],
          [1, 0],
          [1, 2],
        ],
    b = "";
  cells.forEach((p, i) => {
    const x = offset + 24 + p[0] * 48 * scale,
      y = 24 + p[1] * 48 * scale;
    b +=
      rect(x, y, 48 * scale, 48 * scale, C.mint) +
      label(x + 24 * scale, y + 30 * scale, labels[i] || "", 18 * scale);
  });
  return b;
}
function timeline(points, durations = []) {
  const n = points.length,
    step = 340 / (n - 1);
  let b = line(50, 72, 390, 72, C.gray, 3);
  points.forEach((p, i) => {
    let x = 50 + i * step;
    b += line(x, 63, x, 81, C.ink, 2) + label(x, 110, p, 18);
    if (i < n - 1 && durations[i]) b += label(x + step / 2, 50, durations[i], 18, C.orange);
  });
  return svg(b, 440, 145);
}
function clock(h, m, showMinutes = false, blank = false) {
  const cx = 220,
    cy = 113,
    R = 89;
  let b = circle(cx, cy, R, "#fff");
  for (let i = 0; i < 60; i++) {
    let a = (i * Math.PI) / 30,
      x = cx + R * Math.sin(a),
      y = cy - R * Math.cos(a),
      t = i % 5 ? 5 : 10;
    b += line(cx + (R - t) * Math.sin(a), cy - (R - t) * Math.cos(a), x, y, C.gray, i % 5 ? 1 : 2);
  }
  for (let i = 1; i <= 12; i++) {
    let a = (i * Math.PI) / 6;
    b += label(cx + 68 * Math.sin(a), cy - 68 * Math.cos(a) + 6, i, 17);
  }
  const ma = (m * Math.PI) / 30,
    ha = (((h % 12) + m / 60) * Math.PI) / 6;
  if (!blank)
    b +=
      line(cx, cy, cx + 62 * Math.sin(ma), cy - 62 * Math.cos(ma), C.blue, 4) +
      line(cx, cy, cx + 43 * Math.sin(ha), cy - 43 * Math.cos(ha), C.orange, 7) +
      circle(cx, cy, 5, C.ink);
  b += label(220, 231, showMinutes ? "Grande : minutes · Petite : heures" : "", 17);
  return svg(b, 440, 250);
}
function coneNetFigure(R, g) {
  const h = Math.sqrt(g * g - R * R),
    s = Math.min(80 / R, 150 / h),
    cx = 215,
    by = 200,
    top = by - s * h,
    rr = R * s;
  return svg(
    ellipse(cx, by, rr, rr * 0.25, C.mint) +
      line(cx - rr, by, cx, top) +
      line(cx + rr, by, cx, top, C.orange, 3) +
      line(cx, by, cx + rr, by, C.blue, 3) +
      text(cx + rr * 0.55 + 10, (by + top) / 2, `g = ${g} cm`, 20, C.orange) +
      label(cx + rr * 0.5, 250, `r = ${R} cm`, 20, C.blue),
    440,
    275,
  );
}
function rhombus(c) {
  return svg(
    poly([
      [70, 120],
      [220, 45],
      [370, 120],
      [220, 195],
    ]) + label(220, 237, `Losange de côté ${fr(c)} cm`, 22),
    440,
    260,
  );
}
function topViewCells(n) {
  return svg(
    Array.from({ length: n }, (_, i) => rect(40 + i * 55, 60, 50, 50, C.mint)).join("") +
      label(220, 160, "Vue de dessus — hauteurs inconnues", 19),
    440,
    200,
  );
}
// Aide 1 : organiser les données dans un schéma, sans afficher le résultat.
function tiledAreaModel(area, tile) {
  let b =
    rect(100, 64, 250, 125, "#f4f8f4") +
    rect(100, 64, 45, 45, C.mint) +
    rect(145, 64, 45, 45, C.mint) +
    dash(190, 86, 325, 86) +
    label(220, 38, `Sol : ${fr(area)} m²`) +
    label(220, 223, "Combien de carreaux ?");
  b += line(122, 110, 65, 150, C.orange, 2) + label(47, 178, `${fr(tile)} m²`, 22, C.orange);
  return svg(b, 440, 245);
}
function regularPolygon(n, cx, cy, R) {
  return Array.from({ length: n }, (_, i) => [
    cx + R * Math.cos(-Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n),
    cy + R * Math.sin(-Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n),
  ]);
}
function facesModel(n, pyramidMode = false) {
  if (pyramidMode) {
    const p = regularPolygon(n, 220, 125, 65),
      A = p[0],
      B = p[1],
      mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2],
      dx = mid[0] - 220,
      dy = mid[1] - 125,
      k = 65 / Math.hypot(dx, dy),
      T = [mid[0] + dx * k, mid[1] + dy * k];
    return svg(
      poly(p) +
        poly([A, B, T], C.pale, C.orange) +
        line(...A, ...B, C.orange, 4) +
        label(220, 243, "Un côté → une face latérale"),
      440,
      265,
    );
  }
  let b =
    poly(regularPolygon(n, 100, 65, 40)) +
    poly(regularPolygon(n, 330, 65, 40)) +
    label(220, 72, "Bases");
  const w = 320 / n;
  for (let i = 0; i < n; i++) b += rect(60 + i * w, 130, w, 65, i === 0 ? C.pale : C.mint);
  b += label(220, 230, "Faces latérales");
  return svg(b, 440, 250);
}
function scaleLengthModel(a, k, negative = false) {
  if (negative) {
    const ax = 230,
      ay = 100,
      sc = 120 / Math.abs(k),
      A = [ax + sc, ay - 20],
      B = [ax + sc, ay + 20],
      AA = [ax - 120, ay + 20 * Math.abs(k)],
      BB = [ax - 120, ay - 20 * Math.abs(k)];
    return svg(
      dash(...A, ...AA) +
        dash(...B, ...BB) +
        line(...A, ...B, C.green, 4) +
        line(...AA, ...BB, C.orange, 4) +
        circle(ax, ay, 4, C.ink) +
        text(ax + 8, ay - 8, "O") +
        text(A[0] + 12, ay + 8, `${a} cm`) +
        text(AA[0] - 45, ay + 8, "?") +
        label(220, 232, `Rapport : ${k}`),
      440,
      255,
    );
  }
  const unit = 250 / k;
  return svg(
    line(70, 65, 70 + unit, 65, C.green, 5) +
      line(70, 155, 320, 155, C.orange, 5) +
      label(70 + unit / 2, 46, `${a} cm`) +
      label(195, 193, "? cm") +
      line(370, 65, 370, 155, C.ink, 2) +
      poly(
        [
          [370, 155],
          [363, 143],
          [377, 143],
        ],
        C.ink,
      ) +
      label(330, 114, `× ${k}`),
    440,
    225,
  );
}
function scaledAreaModel(k, knownArea = null) {
  const s = 31,
    big = k * s;
  let b =
    rect(45, 93, s, s, C.mint) +
    label(60, 167, knownArea === null ? "A" : `${knownArea} cm²`) +
    text(120, 118, "→", 30);
  for (let y = 0; y < k; y++)
    for (let x = 0; x < k; x++) b += rect(220 + x * s, 45 + y * s, s, s, C.mint);
  b += label(220 + big / 2, 45 + big + 32, knownArea === null ? `${k * k} × A` : "? cm²");
  return svg(b, 440, 285);
}
function reductionVolumeModel(k, V) {
  const little = (x, y, s) =>
    poly(
      [
        [x, y],
        [x + s, y],
        [x + s, y - s],
        [x, y - s],
      ],
      C.mint,
    ) +
    poly(
      [
        [x + s, y],
        [x + s + s * 0.4, y - s * 0.3],
        [x + s + s * 0.4, y - s * 1.3],
        [x + s, y - s],
      ],
      "#b8d9cd",
    ) +
    poly(
      [
        [x, y - s],
        [x + s, y - s],
        [x + s + s * 0.4, y - s * 1.3],
        [x + s * 0.4, y - s * 1.3],
      ],
      "#edf6ee",
    );
  return svg(
    little(40, 175, 90) +
      little(300, 175, 90 / k) +
      label(104, 218, `${V} cm³`) +
      label(325, 218, "? cm³") +
      text(207, 127, "→", 32) +
      label(220, 32, `Chaque longueur : ÷ ${k}`),
    440,
    245,
  );
}
function correspondingTriangles(a, b) {
  const max = Math.max(...a, ...b),
    sc = 135 / max;
  let out = "";
  for (const [i, sides] of [a, b].entries()) {
    const s = sides.slice().sort((x, y) => x - y),
      x = 78 + i * 215,
      y = 168,
      points = [
        [x, y],
        [x + s[1] * sc, y],
        [x, y - s[0] * sc],
      ];
    out +=
      poly(points) +
      label(x + (s[1] * sc) / 2, y + 30, `${fr(s[1])} cm`, 22, C.green) +
      drawText(x - 12, y - (s[0] * sc) / 2 + 6, `${fr(s[0])} cm`, 22, C.orange, "end") +
      text(x + (s[1] * sc) / 2 + 8, y - (s[0] * sc) / 2 - 10, `${fr(s[2])} cm`, 22, C.blue) +
      label(x + 50, 230, i ? "DEF" : "ABC");
  }
  return svg(out, 440, 255);
}
function angleTriangles(angles, order, target) {
  let out = "";
  for (let j = 0; j < 2; j++) {
    const vals = j ? order.map((i) => angles[i]) : angles,
      A = (vals[0] * Math.PI) / 180,
      B = (vals[1] * Math.PI) / 180,
      side = Math.sin(B) / Math.sin((vals[2] * Math.PI) / 180),
      p = [
        [0, 0],
        [1, 0],
        [side * Math.cos(A), -side * Math.sin(A)],
      ],
      minX = Math.min(...p.map((t) => t[0])),
      maxX = Math.max(...p.map((t) => t[0])),
      minY = Math.min(...p.map((t) => t[1])),
      sc = Math.min(150 / (maxX - minX), 100 / -minY);
    const points = p.map(([x, y]) => [35 + j * 220 + (x - minX) * sc, 145 + y * sc]),
      cx = points.reduce((s, p) => s + p[0], 0) / 3,
      cy = points.reduce((s, p) => s + p[1], 0) / 3;
    out += poly(points);
    points.forEach((P, i) => {
      const name = (j ? ["D", "E", "F"] : ["A", "B", "C"])[i],
        dx = cx - P[0],
        dy = cy - P[1],
        m = Math.hypot(dx, dy),
        u = dx / m,
        w = dy / m,
        col = !j && i === target ? C.orange : C.ink,
        Q = points[(i + 1) % 3],
        T = points[(i + 2) % 3],
        a = Math.atan2(Q[1] - P[1], Q[0] - P[0]),
        z = Math.atan2(T[1] - P[1], T[0] - P[0]),
        sweep = (z - a + 2 * Math.PI) % (2 * Math.PI) < Math.PI ? 1 : 0;
      out +=
        "" +
        '<path d="M ' +
        (P[0] + 17 * Math.cos(a)) +
        " " +
        (P[1] + 17 * Math.sin(a)) +
        " A 17 17 0 0 " +
        sweep +
        " " +
        (P[0] + 17 * Math.cos(z)) +
        " " +
        (P[1] + 17 * Math.sin(z)) +
        '" fill="none" stroke="' +
        col +
        '" stroke-width="2"/>' +
        label(P[0] - 18 * u, P[1] - 18 * w + 5, name, 24, col) +
        label(110 + j * 220, 195 + i * 31, `[angle:${name}] = ${vals[i]}°`, 24, col);
    });
  }
  return svg(out, 440, 280);
}
function unitStrip(large, small, k, kind = "Même grandeur") {
  let b = rect(60, 45, 320, 45, C.mint) + label(220, 31, `1 ${large}`);
  for (let i = 0; i < 10; i++) b += rect(60 + 32 * i, 118, 32, 45, i === 0 ? C.pale : C.mint);
  b +=
    dash(60, 92, 60, 112) +
    dash(380, 92, 380, 112) +
    line(60, 179, 92, 179, C.orange, 2) +
    line(60, 174, 60, 184, C.orange) +
    line(92, 174, 92, 184, C.orange) +
    text(105, 188, `${fr(k / 10)} ${small}`, 22, C.orange) +
    label(220, 229, kind);
  return svg(b, 440, 250);
}
function areaUnitModel(large = "dm²", small = "cm²") {
  let b = "";
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 10; x++)
      b += rect(135 + x * 15, 42 + y * 15, 15, 15, x === 0 && y === 0 ? C.pale : C.mint, C.green);
  b +=
    label(210, 26, `1 ${large.replace("²", "")}`) +
    text(297, 120, `10 ${small.replace("²", "")}`) +
    line(135, 49, 75, 86, C.orange) +
    label(70, 111, `1 ${small}`, 22, C.orange) +
    label(220, 227, `Aire d’une case : 1 ${small}`);
  return svg(b, 440, 250);
}
function volumeUnitModel(large = "dm³", small = "cm³", n = 10) {
  if (n === 100) {
    const x = 110,
      y = 185,
      s = 110;
    return svg(
      poly([
        [x, y],
        [x + s, y],
        [x + s, y - s],
        [x, y - s],
      ]) +
        poly(
          [
            [x + s, y],
            [x + s + 48, y - 35],
            [x + s + 48, y - s - 35],
            [x + s, y - s],
          ],
          "#b8d9cd",
        ) +
        poly(
          [
            [x, y - s],
            [x + s, y - s],
            [x + s + 48, y - s - 35],
            [x + 48, y - s - 35],
          ],
          "#edf6ee",
        ) +
        label(220, 24, `Cube de volume 1 ${large}`) +
        label(165, 220, `100 ${small.replace("³", "")}`) +
        text(281, 125, `100 ${small.replace("³", "")}`) +
        label(277, 198, `100 ${small.replace("³", "")}`),
      440,
      245,
    );
  }
  let b = "";
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 10; x++)
      b += rect(32 + x * 11, 50 + y * 11, 11, 11, x === 0 && y === 0 ? C.pale : C.mint, C.green);
  for (let i = 0; i < 10; i++)
    b += poly(
      [
        [235, 151 - i * 10],
        [330, 151 - i * 10],
        [365, 130 - i * 10],
        [270, 130 - i * 10],
      ],
      i === 9 ? C.mint : "#edf6ee",
    );
  b +=
    label(87, 33, "Une couche") +
    label(300, 33, "10 couches") +
    label(87, 192, `10 sur 10`) +
    label(220, 225, `Petit cube : 1 ${small}`) +
    label(220, 255, `Grand cube : 1 ${large}`);
  return svg(b, 440, 275);
}
function capacityModel() {
  return svg(
    poly(
      [
        [130, 190],
        [250, 190],
        [250, 70],
        [130, 70],
      ],
      C.mint,
    ) +
      poly(
        [
          [250, 190],
          [300, 155],
          [300, 35],
          [250, 70],
        ],
        "#b8d9cd",
      ) +
      poly(
        [
          [130, 70],
          [250, 70],
          [300, 35],
          [180, 35],
        ],
        "#edf6ee",
      ) +
      label(190, 140, "1 L") +
      label(190, 222, "1 dm") +
      text(312, 113, "1 dm") +
      label(299, 196, "1 dm"),
    440,
    245,
  );
}
function timeUnitsModel(from, to, k, inverse) {
  const short = { minutes: "min", heures: "h", secondes: "s", jours: "jour" },
    big = short[inverse ? to : from],
    small = short[inverse ? from : to],
    cols = k === 24 ? 8 : 10,
    w = k === 24 ? 30 : 24,
    rows = k / cols,
    left = 220 - (cols * w) / 2;
  let b = label(220, 30, `1 ${big}`);
  for (let i = 0; i < k; i++)
    b += rect(
      left + (i % cols) * w,
      55 + Math.floor(i / cols) * 25,
      w,
      25,
      i === 0 ? C.pale : C.mint,
    );
  b +=
    line(left + w / 2, 67, left - 30, 105, C.orange) +
    label(left - 43, 135, `1 ${small}`, 22, C.orange) +
    label(220, 55 + rows * 25 + 35, "Une case = une petite unité");
  return svg(b, 440, 100 + rows * 25);
}
function groupsModel(total, unit, groupSize, groupUnit) {
  const w = 320,
    part = (w * groupSize) / total;
  return svg(
    label(220, 30, `${total} ${unit}`) +
      rect(60, 55, w, 70, "#f4f8f4") +
      rect(60, 55, part, 70, C.mint) +
      label(60 + part / 2, 97, groupSize) +
      label(60 + part + (w - part) / 2, 97, "…") +
      label(220, 165, `Un groupe : ${groupSize} ${unit}`) +
      label(220, 201, `↔ 1 ${groupUnit}`),
    440,
    225,
  );
}
function hourParts(n, den, whole = 0) {
  const cx = 220,
    cy = 115,
    R = 75;
  let b = circle(cx, cy, R, "#fff");
  for (let i = 0; i < den; i++) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / den,
      z = -Math.PI / 2 + (2 * Math.PI * (i + 1)) / den,
      A = [cx + R * Math.cos(a), cy + R * Math.sin(a)],
      B = [cx + R * Math.cos(z), cy + R * Math.sin(z)];
    b +=
      "" +
      '<path d="M ' +
      cx +
      " " +
      cy +
      " L " +
      A +
      " A " +
      R +
      " " +
      R +
      " 0 " +
      (1 / den > 0.5 ? 1 : 0) +
      " 1 " +
      B +
      ' Z" fill="' +
      (i < n ? C.mint : "#fff") +
      '" stroke="' +
      C.green +
      '" stroke-width="2"/>';
  }
  b +=
    label(220, 24, "Un tour : 60 min") +
    label(220, 224, whole ? `${whole} h + partie colorée` : "Partie colorée de l’heure");
  return svg(b, 440, 250);
}
function timeRoute(points, duration, { back = false, midnight = false } = {}) {
  let b = timeline(points, []).replace(/<\/svg>$/, "");
  b +=
    label(220, 29, duration) +
    line(80, 139, 360, 139, C.orange, 3) +
    poly(
      back
        ? [
            [80, 139],
            [93, 132],
            [93, 146],
          ]
        : [
            [360, 139],
            [347, 132],
            [347, 146],
          ],
      C.orange,
    );
  if (midnight) b += label(220, 175, "Changement de jour");
  return b.replace('viewBox="0 0 440 145"', 'viewBox="0 0 440 200"') + "</svg>";
}
function calendarModel(kind) {
  let b = "";
  if (kind === "ordinary" || kind === "leap") {
    const names = [
        "Jan.",
        "Fév.",
        "Mars",
        "Avr.",
        "Mai",
        "Juin",
        "Juil.",
        "Août",
        "Sept.",
        "Oct.",
        "Nov.",
        "Déc.",
      ],
      days = [31, kind === "leap" ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    names.forEach((m, i) => {
      const x = 12 + (i % 4) * 107,
        y = 20 + Math.floor(i / 4) * 75;
      b +=
        rect(x, y, 96, 64, i === 1 ? C.pale : C.mint) +
        label(x + 48, y + 26, m) +
        label(x + 48, y + 53, days[i], 22, i === 1 ? C.orange : C.ink);
    });
    return svg(b, 440, 260);
  }
  const unit = kind === "century" ? 10 : 100;
  for (let i = 0; i < 10; i++) {
    const x = 20 + (i % 5) * 82,
      y = 35 + Math.floor(i / 5) * 85;
    b +=
      rect(x, y, 73, 65, C.mint) + label(x + 36.5, y + 28, unit) + label(x + 36.5, y + 54, "ans");
  }
  return svg(b, 440, 225);
}
// Le formatteur gère lui-même les tailles des numérateurs et des dénominateurs.
const readable = (s) => String(s || "");
const num = (answer, unit = "", labelText = "Réponse") => ({
  label: labelText,
  answer: String(answer),
  kind: "number",
  unit,
  placeholder: "",
});
const txt = (answer, options, labelText = "Réponse") => ({
  label: labelText,
  answer: String(answer),
  kind: "text",
  unit: "",
  placeholder: "",
  ...(options ? { options } : {}),
});
function Q(
  f,
  v,
  grade,
  prompt,
  fields,
  solution,
  visual,
  h1,
  h2,
  rule,
  example,
  courseSvg,
  extra = {},
) {
  const hints = [
    typeof h1 === "string" ? { text: h1, svg: visual } : h1,
    typeof h2 === "string" ? { text: h2, svg: "" } : h2,
  ].map((h) => ({ ...h, svg: readable(h.svg) }));
  return {
    family: f,
    variant: `${f}-V${v + 1}`,
    grade,
    dnb: f !== "GM04",
    prompt,
    math: "",
    fields,
    check: {
      type:
        fields.length === 1
          ? fields[0].kind === "text"
            ? "text"
            : fields[0].kind === "expression"
              ? "expression"
              : "numeric"
          : "fields",
      values: fields.map((x) => x.answer),
    },
    hints,
    solution,
    visual: readable(visual),
    course: { rule, example, svg: readable(courseSvg || visual) },
    tags: [],
    ...extra,
  };
}
export const counts = { EG08: 6, EG09: 8 };
export const generators = {};
generators.EG08 = (r, v = 0) => {
  const f = "EG08";
  v %= 6;
  let L = r.int(5, 11),
    l = r.int(2, 4),
    P = 2 * (L + l),
    rule = "Le périmètre est la longueur du contour.",
    ex = "Rectangle 7 cm sur 3 cm : 7 + 3 + 7 + 3 = 20 cm.";
  if (v === 0)
    return Q(
      f,
      v,
      6,
      `Un rectangle mesure ${L} cm sur ${l} cm. Quel est son périmètre ?`,
      [num(P, "cm")],
      `${L} + ${l} + ${L} + ${l} = ${P} cm.`,
      rectangle(L, l, { diagonal: true }),
      "Suis seulement le bord extérieur. La diagonale ne compte pas.",
      { text: "Chaque dimension apparaît deux fois.", svg: formula(`${L} + ${l} + ${L} + ${l}`) },
      rule,
      ex,
      rectangle(7, 3),
    );
  if (v === 1)
    return Q(
      f,
      v,
      6,
      `Un rectangle a un périmètre de ${P} cm et une largeur de ${l} cm. Quelle est sa longueur ?`,
      [num(L, "cm")],
      `${P} ÷ 2 − ${l} = ${L} cm.`,
      rectangle(L, l, { labels: false }),
      "La moitié du périmètre correspond à longueur + largeur.",
      {
        text: `La moitié vaut ${P / 2} cm. Retire la largeur.`,
        svg: formula(`L + ${l} = ${P / 2}`),
      },
      rule,
      ex,
      rectangle(7, 3),
    );
  if (v === 2) {
    const d = r.int(2, 12);
    return Q(
      f,
      v,
      6,
      `Un disque a un diamètre de ${d} cm. Complète son périmètre exact.`,
      [num(d, "π cm", "P =")],
      `P = π × ${d} = ${d}π cm.`,
      disk(d, { diameter: true }),
      "Le segment donné est le diamètre, pas le rayon.",
      { text: "Le périmètre du disque vaut π × diamètre.", svg: formula(`P = π × ${d}`) },
      "Disque : P = πd = 2πr.",
      "Diamètre 6 cm : P = 6π cm.",
      disk(6, { diameter: true }),
    );
  }
  if (v === 3) {
    const a = r.int(1, L - 2),
      b = r.int(1, l - 1);
    return Q(
      f,
      v,
      6,
      "" +
        "On retire un coin de " +
        a +
        " cm sur " +
        b +
        " cm d’un rectangle de " +
        L +
        " cm sur " +
        l +
        " cm. Quel est le périmètre de la forme en L ?",
      [num(P, "cm")],
      `Les côtés horizontaux totalisent ${2 * L} cm et les verticaux ${2 * l} cm : P = ${P} cm.`,
      cornerShape(L, l, a, b),
      "Les deux nouveaux bords remplacent les deux bords retirés.",
      {
        text: "Additionne séparément les longueurs horizontales et verticales.",
        svg: formula(`Horizontales : ${L} + ${L}`, `Verticales : ${l} + ${l}`),
      },
      rule,
      ex,
      rectangle(7, 3),
    );
  }
  if (v === 5) {
    const c = r.pick([2.5, 3, 4, 5, 6.5]),
      vis = rhombus(c);
    return Q(
      f,
      v,
      6,
      `Un losange a un côté de ${fr(c)} cm. Quel est son périmètre ?`,
      [num(4 * c, "cm")],
      `Les quatre côtés ont la même longueur : 4 × ${fr(c)} = ${fr(4 * c)} cm.`,
      vis,
      "Un losange a quatre côtés de même longueur.",
      { text: "Multiplie la longueur d’un côté par quatre.", svg: formula(`P = 4 × ${fr(c)}`) },
      "Losange : P = 4c, avec c la longueur d’un côté.",
      "Côté 3 cm : périmètre 12 cm.",
      rhombus(3),
    );
  }
  return Q(
    f,
    v,
    5,
    `Un rectangle a pour longueur x cm et pour largeur ${l} cm. Exprime son périmètre en fonction de x.`,
    [{ label: "P =", answer: `2*x+${2 * l}`, kind: "expression", unit: "cm", placeholder: "" }],
    `P = (x + ${l} + x + ${l}) cm = (2x + ${2 * l}) cm.`,
    rectangle(7, l, { lit: true }),
    "Il y a deux côtés de longueur x et deux autres côtés.",
    { text: "Regroupe les deux x et les deux constantes.", svg: formula(`x + ${l} + x + ${l}`) },
    "Additionne les longueurs du contour, puis regroupe les termes de même nature.",
    "Côtés x cm et 3 cm : P = (2x + 6) cm.",
    rectangle(7, 3, { lit: true }),
  );
};
generators.EG09 = (r, v = 0) => {
  const f = "EG09";
  v %= 8;
  let L = r.int(5, 10),
    l = r.int(2, 5),
    rule = "Une aire mesure une surface avec une unité carrée.";
  if (v === 0) {
    const full = r.int(3, 6),
      half = r.pick([2, 4, 6]),
      a = full + half / 2;
    return Q(
      f,
      v,
      6,
      "" +
        "La surface contient " +
        full +
        " carreaux entiers et " +
        half +
        " demi-carreaux. Un carreau entier a une aire de 1 cm². Quelle est son aire ?",
      [num(a, "cm²")],
      `${full} + ${half} ÷ 2 = ${a} cm².`,
      unitSquares(full, half),
      "Deux demi-carreaux forment un carreau entier.",
      { text: "Regroupe les demi-carreaux deux par deux.", svg: formula(`${full} + ${half} ÷ 2`) },
      rule,
      "5 carreaux + 4 demi-carreaux : 5 + 2 = 7 cm².",
      unitSquares(5, 4),
    );
  }
  if (v === 1)
    return Q(
      f,
      v,
      6,
      `Un rectangle a une aire de ${L * l} cm² et une longueur de ${L} cm. Quelle est sa largeur ?`,
      [num(l, "cm")],
      `${L * l} ÷ ${L} = ${l} cm.`,
      rectangle(L, l, { labels: false }),
      "L’aire du rectangle est longueur × largeur.",
      { text: "Cherche le nombre qui complète le produit.", svg: formula(`${L} × ? = ${L * l}`) },
      "Rectangle : aire = longueur × largeur.",
      "42 cm² ÷ 7 cm = 6 cm.",
      rectangle(7, 6),
    );
  if (v === 2) {
    const b = 2 * r.int(2, 6),
      h = r.int(2, 5);
    return Q(
      f,
      v,
      5,
      `Un triangle a une base de ${b} cm et une hauteur associée de ${h} cm. Quelle est son aire ?`,
      [num((b * h) / 2, "cm²")],
      `${b} × ${h} ÷ 2 = ${(b * h) / 2} cm².`,
      triangleArea(b, h),
      "Utilise la hauteur perpendiculaire à la base.",
      {
        text: `Deux copies forment un parallélogramme d’aire ${b} × ${h}. Prends la moitié.`,
        svg: triangleArea(b, h, { duplicate: true }),
      },
      "Triangle : aire = base × hauteur ÷ 2.",
      "Base 8 cm, hauteur 3 cm : 8 × 3 ÷ 2 = 12 cm².",
      triangleArea(8, 3, { duplicate: true }),
    );
  }
  if (v === 3) {
    const b = r.int(4, 9),
      h = 4;
    return Q(
      f,
      v,
      5,
      `Un parallélogramme a une base de ${b} cm, une hauteur de 4 cm et un côté oblique de 5 cm. Quelle est son aire ?`,
      [num(4 * b, "cm²")],
      `${b} × 4 = ${4 * b} cm².`,
      triangleArea(b, h, { para: true, side: 5 }),
      "La hauteur forme un angle droit avec la base. Le côté de 5 cm ne convient pas.",
      { text: "Le découpage conserve l’aire et donne un rectangle.", svg: rectangle(b, 4) },
      "Parallélogramme : aire = base × hauteur.",
      "Base 6 cm, hauteur 4 cm : 6 × 4 = 24 cm².",
      triangleArea(6, 4, { para: true, side: 5 }),
    );
  }
  if (v === 4) {
    const R = r.int(2, 6);
    return Q(
      f,
      v,
      5,
      `Un disque a un diamètre de ${2 * R} cm. Complète son aire exacte.`,
      [num(R * R, "π cm²", "A =")],
      `r = ${2 * R} ÷ 2 = ${R} cm ; A = π × ${R}² = ${R * R}π cm².`,
      disk(2 * R, { diameter: true }),
      "L’aire utilise le rayon : c’est la moitié du diamètre.",
      { text: `Le rayon vaut ${R} cm. Multiplie π par son carré.`, svg: formula(`A = π × ${R}²`) },
      "Disque : aire = π × rayon².",
      "Diamètre 10 cm : rayon 5 cm ; aire 25π cm².",
      disk(10, { diameter: true }),
    );
  }
  if (v === 6)
    return Q(
      f,
      v,
      6,
      `Un rectangle mesure ${L} cm sur ${l} cm. Quelle est son aire ?`,
      [num(L * l, "cm²")],
      `${L} × ${l} = ${L * l} cm².`,
      rectangle(L, l),
      "Repère les rangées de carrés de 1 cm de côté.",
      { text: `Il y a ${l} rangées de ${L} carrés de 1 cm².`, svg: formula(`A = ${L} × ${l}`) },
      "Rectangle : aire = longueur × largeur.",
      "Rectangle 7 cm sur 3 cm : 7 × 3 = 21 cm².",
      rectangle(7, 3),
    );
  if (v === 7) {
    const tile = r.pick([0.25, 0.5]),
      n = r.int(12, 36),
      area = n * tile;
    return Q(
      f,
      v,
      6,
      "" +
        "Un sol de " +
        fr(area) +
        " m² est pavé exactement, sans découpe ni joint, avec des carreaux couvrant chacun " +
        fr(tile) +
        " m². Combien de carreaux faut-il ?",
      [num(n, "carreaux")],
      `${fr(area)} ÷ ${fr(tile)} = ${n} carreaux.`,
      "",
      {
        text: "Un carreau est une unité ; la surface entière en contient plusieurs.",
        svg: tiledAreaModel(area, tile),
      },
      {
        text: "Cherche combien de fois l’aire d’un carreau entre dans l’aire du sol.",
        svg: formula(`${fr(tile)} × ? = ${fr(area)}`),
      },
      "Nombre d’unités identiques = aire totale ÷ aire d’une unité.",
      "6 m² avec des carreaux de 0,25 m² : 6 ÷ 0,25 = 24 carreaux.",
      squareUnits(),
    );
  }
  const a = r.int(1, L - 2),
    b = r.int(1, l - 1);
  return Q(
    f,
    v,
    6,
    `Un rectangle de ${L} cm sur ${l} cm perd un coin rectangulaire de ${a} cm sur ${b} cm. Quelle aire reste-t-il ?`,
    [num(L * l - a * b, "cm²")],
    `${L} × ${l} − ${a} × ${b} = ${L * l - a * b} cm².`,
    cornerShape(L, l, a, b, true),
    "Pars de l’aire du grand rectangle et retire le coin.",
    {
      text: "Calcule les deux aires avec la même unité.",
      svg: formula(`${L} × ${l} − ${a} × ${b}`),
    },
    "Pour retirer une surface, soustrais son aire.",
    "8 × 5 − 3 × 2 = 34 cm².",
    cornerShape(8, 5, 3, 2, true),
  );
};

Object.assign(counts, { EG19: 5, EG20: 4, EG21: 7 });
generators.EG19 = (r, v = 0) => {
  const f = "EG19";
  v %= 5;
  const names = ["Prisme droit", "Cylindre", "Pyramide", "Cône", "Boule", "Sphère"];
  if (v === 0) {
    const shape = r.pick(["prisme", "cylindre", "pyramide", "cone"]),
      defs = {
        prisme: [
          "deux bases triangulaires parallèles et superposables, reliées par trois faces rectangulaires",
          "Prisme droit",
          prism(),
          5,
        ],
        cylindre: [
          "deux bases circulaires parallèles et une surface latérale courbe",
          "Cylindre",
          cylinder(3, 5, { labels: false }),
          5,
        ],
        pyramide: [
          "une base polygonale et des faces latérales triangulaires ayant un sommet commun",
          "Pyramide",
          pyramid(4, 6, { letters: true }),
          4,
        ],
        cone: [
          "une base circulaire et une surface latérale qui rejoint un seul sommet",
          "Cône",
          pyramid(3, 5, { cone: true }),
          4,
        ],
      },
      [def, ans, vis, g] = defs[shape];
    return Q(
      f,
      v,
      6,
      `Le solide possède ${def}. Quel est son nom ?`,
      [txt(ans, names)],
      `Réponse : ${ans.toLowerCase()}.`,
      vis,
      "Repère les bases et la forme des faces latérales.",
      {
        text:
          shape === "prisme"
            ? "Deux triangles et trois rectangles."
            : shape === "cylindre"
              ? "Deux disques, aucun sommet."
              : shape === "pyramide"
                ? "Les faces latérales sont des triangles."
                : "Un disque et un sommet.",
        svg: vis,
      },
      "Le nom dépend des faces et des bases, pas de l’orientation.",
      "Un prisme triangulaire a 2 bases triangulaires et 3 faces rectangulaires.",
      prism(),
    );
  }
  if (v === 1) {
    const asked = r.pick(["AD", "BE", "CF"]);
    return Q(
      f,
      v,
      5,
      `Dans ce prisme droit, ABC et DEF sont les bases. Quel segment représente une hauteur ?`,
      [txt(asked, ["AB", "AC", asked])],
      `Le segment [${asked}] est perpendiculaire aux plans des bases.`,
      prism(true),
      "Un segment de hauteur relie les deux bases perpendiculairement à leurs plans.",
      {
        text: "Les arêtes [AD], [BE] et [CF] sont perpendiculaires aux plans des bases.",
        svg: prism(true),
      },
      "La longueur d’une arête latérale est la hauteur du prisme droit.",
      "Bases ABC et DEF : [AD], [BE] et [CF] ont la même longueur.",
      prism(true),
    );
  }
  if (v === 2) {
    const n = r.pick([3, 4, 5, 6]),
      base = { 3: "triangulaire", 4: "quadrilatère", 5: "pentagonale", 6: "hexagonale" }[n];
    return Q(
      f,
      v,
      5,
      `Combien de faces possède un prisme droit à base ${base} ?`,
      [num(n + 2, "faces")],
      `2 bases + ${n} faces latérales = ${n + 2} faces.`,
      "",
      { text: "Repère les deux bases et la bande des faces latérales.", svg: facesModel(n) },
      { text: `La base possède ${n} côtés.`, svg: formula(`2 + ${n}`) },
      "Prisme à base de n côtés : 2 bases + n faces latérales.",
      "Prisme triangulaire : 2 + 3 = 5 faces.",
      prism(),
    );
  }
  if (v === 3) {
    const set = r.pick([
        ["S", "H"],
        ["T", "K"],
        ["P", "O"],
      ]),
      [a, b] = set,
      vis = pyramid(4, 6, { letters: true })
        .replaceAll(">S<", `>${a}<`)
        .replaceAll(">H<", `>${b}<`)
        .replaceAll(">SH<", `>${a + b}<`);
    return Q(
      f,
      v,
      4,
      `Le segment ${a + b} est perpendiculaire au plan de la base ABCD. Quel segment représente la hauteur de la pyramide ?`,
      [txt(a + b, [a + "A", a + "B", a + b])],
      `Le segment [${a + b}] relie le sommet au plan de la base perpendiculairement.`,
      vis,
      "Pars du sommet et repère l’angle droit avec le plan de la base.",
      { text: "Une arête oblique ne représente pas forcément la hauteur.", svg: vis },
      "La hauteur est la distance du sommet au plan de la base.",
      "Si [SH] est perpendiculaire au plan de la base ABCD, alors SH est la hauteur.",
      pyramid(4, 6, { letters: true }),
    );
  }
  const R = r.int(2, 9),
    filled = r.bool(),
    ans = filled ? "Boule" : "Sphère";
  return Q(
    f,
    v,
    3,
    "" +
      "Quel solide ou quelle surface rassemble les points situés à une distance " +
      (filled ? "inférieure ou égale" : "égale") +
      " à " +
      R +
      " cm de O ?",
    [txt(ans, ["Boule", "Sphère"])],
    filled
      ? "La boule contient la surface et tout l’intérieur."
      : "La sphère contient seulement les points à la distance donnée de O.",
    "",
    {
      text: filled
        ? "Pense au volume rempli, intérieur compris."
        : "Pense à la peau extérieure, sans intérieur.",
      svg: sphere(R, { filled }),
    },
    {
      text: filled
        ? "Distance ≤ rayon : intérieur et surface."
        : "Distance = rayon : surface seulement.",
      svg: sphere(R, { filled }),
    },
    "Sphère : distance au centre égale au rayon. Boule : distance inférieure ou égale au rayon.",
    "Une balle pleine représente une boule ; sa surface représente une sphère.",
    sphere(3, { filled }),
  );
};
generators.EG20 = (r, v = 0) => {
  const f = "EG20";
  v %= 4;
  let a = Array.from({ length: 4 }, () => r.int(0, 3));
  if (a.every((x) => !x)) a[0] = 1;
  const rule = "Une vue conserve seulement les positions visibles dans une direction.";
  if (v === 0) {
    const name = r.pick(["A1", "B1", "A2", "B2"]),
      idx = ["A1", "B1", "A2", "B2"].indexOf(name),
      ans = a[idx] > 0 ? "Oui" : "Non";
    return Q(
      f,
      v,
      6,
      `Les nombres indiquent les hauteurs des colonnes pleines. La case ${name} est-elle occupée dans la vue de dessus ?`,
      [txt(ans, ["Oui", "Non"])],
      a[idx]
        ? `${name} contient ${a[idx]} cube(s) en hauteur : elle est occupée.`
        : `${name} a une hauteur nulle : elle est vide.`,
      gridHeights(a),
      "Vue de dessus : une case est occupée dès qu’elle porte un cube.",
      { text: `Lis la hauteur en ${name}. Zéro signifie vide.`, svg: gridHeights(a) },
      rule,
      "Une colonne de 3 cubes occupe une seule case dans la vue de dessus.",
      gridHeights([2, 1, 0, 3]),
    );
  }
  if (v === 1) {
    const left = Math.max(a[0], a[2]),
      rightH = Math.max(a[1], a[3]);
    return Q(
      f,
      v,
      6,
      `La ligne 1 est à l’avant et la ligne 2 à l’arrière. Depuis l’avant, quelles hauteurs voit-on à gauche et à droite ?`,
      [num(left, "cubes", "Gauche"), num(rightH, "cubes", "Droite")],
      `Gauche : max(${a[0]}, ${a[2]}) = ${left}. Droite : max(${a[1]}, ${a[3]}) = ${rightH}.`,
      gridHeights(a),
      "Pour chaque colonne de l’image, garde la pile la plus haute.",
      {
        text: "Une pile derrière une autre peut dépasser ; les hauteurs ne s’additionnent pas.",
        svg: formula(`Gauche : ${a[0]} ou ${a[2]}`, `Droite : ${a[1]} ou ${a[3]}`),
      },
      rule,
      "Hauteurs 2 et 1 alignées : la silhouette monte à 2 cubes.",
      gridHeights([2, 1, 1, 3]),
    );
  }
  if (v === 2) {
    a = a.map((x) => x + 1);
    const total = a.reduce((x, y) => x + y, 0);
    return Q(
      f,
      v,
      6,
      "Le tableau donne le nombre de cubes dans chaque colonne pleine. Combien de cubes contient l’assemblage ?",
      [num(total, "cubes")],
      `${a.join(" + ")} = ${total} cubes.`,
      gridHeights(a),
      "Additionne les cubes de toutes les colonnes, visibles ou cachés.",
      { text: "Chaque cube appartient à une seule colonne.", svg: formula(a.join(" + ")) },
      "Pour compter un assemblage, additionne les colonnes ou les couches.",
      "Colonnes 2, 1 et 3 : 2 + 1 + 3 = 6 cubes.",
      gridHeights([2, 1, 0, 3]),
    );
  }
  const cells = r.int(2, 6),
    vis = topViewCells(cells);
  return Q(
    f,
    v,
    5,
    "" +
      "Une vue de dessus montre " +
      cells +
      " cases occupées. Les hauteurs ne sont pas données. Peut-on connaître le nombre exact " +
      "de cubes ?",
    [txt("Non", ["Oui", "Non"])],
    `Non. ${cells} piles de 1 cube ou ${cells} piles de 2 cubes ont la même vue de dessus.`,
    vis,
    "La vue de dessus indique où se trouvent les colonnes, pas leur hauteur.",
    {
      text: "Imagine un cube, puis deux cubes dans chaque case : la vue de dessus reste identique.",
      svg: vis,
    },
    "Une seule vue peut laisser plusieurs assemblages possibles.",
    "Deux cases occupées ne suffisent pas pour connaître les hauteurs.",
    topViewCells(2),
  );
};
generators.EG21 = (r, v = 0) => {
  const f = "EG21";
  v %= 7;
  const rule = "Un patron recouvre chaque face une seule fois, sans chevauchement.";
  if (v === 0) {
    const swap = r.bool(),
      vis = svg(
        label(115, 22, "A", 22) +
          label(325, 22, "B", 22) +
          `<g transform="translate(0 14)">${net([], swap, 0, 0.85)}${net([], !swap, 210, 0.85)}</g>`,
        440,
        210,
      ),
      ans = swap ? "B" : "A";
    return Q(
      f,
      v,
      5,
      "Quel dessin est un patron de cube ?",
      [txt(ans, ["A", "B"])],
      `Le dessin ${ans} se replie en six faces distinctes. Le rectangle 2 × 3 crée un chevauchement.`,
      vis,
      "Imagine le repliement des carrés autour d’une face.",
      { text: "Le rectangle de 2 rangées de 3 carrés ne se ferme pas en cube.", svg: vis },
      rule,
      "Une croix de six carrés adaptée se replie en cube.",
      svg(net(), 280, 195),
    );
  }
  if (v === 1) {
    const labels = r.pick([
        ["A", "B", "C", "D", "E", "F"],
        ["P", "Q", "R", "S", "T", "U"],
        ["K", "L", "M", "N", "O", "P"],
      ]),
      idx = r.int(0, 5),
      op = [2, 3, 0, 1, 5, 4][idx],
      vis = svg(net(labels), 280, 195);
    return Q(
      f,
      v,
      5,
      `Quelle face sera opposée à ${labels[idx]} après pliage ?`,
      [
        txt(
          labels[op],
          labels.filter((_, i) => i !== idx),
        ),
      ],
      `La face ${labels[op]} est opposée à ${labels[idx]}.`,
      vis,
      "Deux faces opposées ne partagent aucune arête dans le cube.",
      { text: "Replie mentalement la rangée de quatre carrés en ceinture.", svg: vis },
      "Un cube possède trois paires de faces opposées.",
      "Sur cette croix : A et C, B et D, E et F sont opposées.",
      svg(net(), 280, 195),
    );
  }
  if (v === 2) {
    const L = r.int(5, 8),
      l = r.int(3, 4),
      h = r.int(1, 2);
    return Q(
      f,
      v,
      5,
      "" +
        "Un pavé mesure " +
        L +
        " cm de long, " +
        l +
        " cm de large et " +
        h +
        " cm de haut. Une face latérale partage un côté de " +
        L +
        " cm avec la base. Quelle est son autre dimension ?",
      [num(h, "cm")],
      `La face latérale mesure ${L} cm × ${h} cm.`,
      box(L, l, h),
      "La face latérale joint les deux bases.",
      { text: "Son autre côté correspond à la hauteur du pavé.", svg: box(L, l, h) },
      "Les dimensions d’une face sont les longueurs des deux arêtes qui la bordent.",
      "Pavé 4 × 3 × 2 : faces 4 × 3, 4 × 2 et 3 × 2.",
      box(4, 3, 2),
    );
  }
  if (v === 3) {
    const R = r.int(1, 5),
      h = r.int(3, 8);
    return Q(
      f,
      v,
      5,
      "" +
        "Un cylindre a un rayon de " +
        R +
        " cm et une hauteur de " +
        h +
        " cm. Quel côté du rectangle de son patron s’enroule autour de la base ? Complète sa " +
        "longueur exacte.",
      [num(2 * R, "π cm", "Longueur =")],
      `Ce côté mesure le périmètre du disque : 2 × π × ${R} = ${2 * R}π cm.`,
      cylinder(R, h),
      "Le bord du disque devient un côté du rectangle quand on le déroule.",
      { text: "Ce côté mesure une circonférence, pas la hauteur.", svg: formula(`2 × π × ${R}`) },
      "Patron du cylindre : un rectangle de côtés h et 2πr, avec deux disques.",
      "Rayon 3 cm, hauteur 5 cm : rectangle 5 cm × 6π cm.",
      cylinder(3, 5),
    );
  }
  if (v === 4) {
    const n = r.pick([3, 4, 5, 6]),
      base = { 3: "triangulaire", 4: "carrée", 5: "pentagonale", 6: "hexagonale" }[n];
    return Q(
      f,
      v,
      4,
      `Le patron d’une pyramide à base ${base} contient la base. Combien de triangles faut-il pour les faces latérales ?`,
      [num(n, "triangles")],
      `Il faut un triangle par côté de la base, donc ${n} triangles.`,
      "",
      {
        text: "Une face triangulaire s’accroche à chaque côté de la base.",
        svg: facesModel(n, true),
      },
      { text: `La base a ${n} côtés.`, svg: formula(`${n} côtés → ? triangles`) },
      "Une pyramide possède une face latérale triangulaire par côté de sa base.",
      "Pyramide à base carrée : 4 faces latérales triangulaires.",
      pyramid(4, 5),
    );
  }
  if (v === 5) {
    const k = r.int(1, 3),
      sides = [3 * k, 4 * k, 5 * k],
      h = r.int(3, 8),
      side = r.pick(sides);
    return Q(
      f,
      v,
      5,
      "" +
        "Un prisme droit a une base triangulaire de côtés " +
        sides.join(", ") +
        " cm et une hauteur de " +
        h +
        " cm. Donne les dimensions de la face latérale attachée au côté de " +
        side +
        " cm.",
      [num(side, "cm", "Côté partagé avec la base"), num(h, "cm", "Autre côté")],
      `Cette face est un rectangle de ${side} cm sur ${h} cm.`,
      prism(),
      "Un côté du rectangle est commun avec le triangle de base.",
      { text: "L’autre côté relie les deux bases : il mesure la hauteur du prisme.", svg: prism() },
      "Une face latérale d’un prisme droit est un rectangle : côté de base × hauteur.",
      "Base 3, 4, 5 et hauteur 6 : une face latérale mesure 5 × 6.",
      prism(),
    );
  }
  const R = r.int(1, 4),
    ratio = r.pick([2, 3, 4]),
    g = R * ratio,
    angle = 360 / ratio;
  return Q(
    f,
    v,
    4,
    "" +
      "Un cône a un rayon de base de " +
      R +
      " cm et une génératrice de " +
      g +
      " cm. Son patron latéral est un secteur de cercle de rayon " +
      g +
      " cm. Quelle est la mesure de l’angle du secteur ?",
    [num(angle, "°")],
    `L’arc mesure ${2 * R}π cm ; le cercle entier a pour périmètre ${2 * g}π cm. Mesure = 360° × ${R}/${g} = ${angle}°.`,
    coneNetFigure(R, g),
    "La longueur de l’arc doit égaler le périmètre de la base.",
    {
      text: `Le secteur occupe ${R}/${g} du cercle entier.`,
      svg: formula(`Mesure = 360° × ${R}/${g}`),
    },
    "Le rayon du secteur est la génératrice ; la longueur de son arc est le périmètre de la base.",
    "Rayon de base 3 cm, génératrice 6 cm : 360° × 3/6 = 180°.",
    formula("Longueur de l’arc = 2πr", "Mesure = (360° × r) ÷ g"),
  );
};

Object.assign(counts, { EG22: 5, EG23: 4, EG24: 5, EG25: 4, EG26: 4 });
generators.EG22 = (r, v = 0) => {
  const f = "EG22";
  v %= 5;
  const rule = "Prisme droit ou cylindre : volume = aire de base × hauteur.",
    ex = "Pavé 4 × 3 × 2 : volume 24 cm³.";
  if (v === 0) {
    const c = r.int(2, 5);
    return Q(
      f,
      v,
      5,
      `Un cube a une arête de ${c} cm. Quel est son volume ?`,
      [num(c ** 3, "cm³")],
      `${c} × ${c} × ${c} = ${c ** 3} cm³.`,
      box(c, c, c),
      "Une couche de cubes repose sur toute la base carrée.",
      {
        text: `Empile ${c} couches de ${c * c} cubes de 1 cm³.`,
        svg: formula(`V = ${c} × ${c} × ${c}`),
      },
      "Cube : V = c³, avec c la longueur d’une arête.",
      "Arête 3 cm : 3 × 3 × 3 = 27 cm³.",
      box(3, 3, 3),
    );
  }
  if (v === 1) {
    const L = r.int(3, 7),
      l = r.int(2, 4),
      h = r.int(2, 5);
    return Q(
      f,
      v,
      5,
      `Un pavé droit mesure ${L} cm de long, ${l} cm de large et ${h} cm de haut. Quel est son volume ?`,
      [num(L * l * h, "cm³")],
      `${L} × ${l} × ${h} = ${L * l * h} cm³.`,
      box(L, l, h),
      "Compte les cubes d’une couche, puis le nombre de couches.",
      {
        text: `Une couche contient ${L} × ${l} cubes. Il y a ${h} couches.`,
        svg: formula(`V = ${L} × ${l} × ${h}`),
      },
      rule,
      ex,
      box(4, 3, 2),
    );
  }
  if (v === 2) {
    const b = 2 * r.int(2, 4),
      h = r.int(2, 4),
      H = r.int(2, 5),
      A = (b * h) / 2;
    return Q(
      f,
      v,
      5,
      "" +
        "La base triangulaire d’un prisme a une base de " +
        b +
        " cm et une hauteur associée de " +
        h +
        " cm. La hauteur du prisme est " +
        H +
        " cm. Quel est son volume ?",
      [num(A * H, "cm³")],
      `Aire du triangle = ${b} × ${h} ÷ 2 = ${A} cm² ; V = ${A} × ${H} = ${A * H} cm³.`,
      prism(),
      "Il y a deux hauteurs différentes : celle du triangle et celle du prisme.",
      {
        text: "Commence par l’aire de la base triangulaire.",
        svg: formula(`A = ${b} × ${h} ÷ 2`, `V = A × ${H}`),
      },
      rule,
      "Triangle de base 4, hauteur 3 ; prisme de hauteur 5 : (4 × 3 ÷ 2) × 5 = 30 cm³.",
      prism(),
    );
  }
  if (v === 3) {
    const R = r.int(1, 4),
      h = r.int(2, 6);
    return Q(
      f,
      v,
      5,
      `Un cylindre a un diamètre de ${2 * R} cm et une hauteur de ${h} cm. Complète son volume exact.`,
      [num(R * R * h, "π cm³", "V =")],
      `r = ${R} cm ; V = π × ${R}² × ${h} = ${R * R * h}π cm³.`,
      cylinder(R, h, { diameter: true }),
      "Divise d’abord le diamètre par deux pour obtenir le rayon.",
      {
        text: `La base a pour aire π × ${R}². Multiplie par la hauteur.`,
        svg: formula(`V = π × ${R}² × ${h}`),
      },
      rule,
      "Diamètre 4, hauteur 3 : rayon 2 ; volume 12π cm³.",
      cylinder(2, 3, { diameter: true }),
    );
  }
  const A = r.pick([6, 8, 10, 12, 15, 20]),
    h = r.int(2, 8),
    V = A * h;
  return Q(
    f,
    v,
    5,
    `Un prisme droit a un volume de ${V} cm³ et une aire de base de ${A} cm². Quelle est sa hauteur ?`,
    [num(h, "cm")],
    `h = ${V} ÷ ${A} = ${h} cm.`,
    prism(),
    "Volume = aire de base × hauteur.",
    { text: "Cherche le facteur manquant.", svg: formula(`${A} × h = ${V}`) },
    rule,
    "Volume 36 cm³, base 12 cm² : hauteur 36 ÷ 12 = 3 cm.",
    prism(),
  );
};
generators.EG23 = (r, v = 0) => {
  const f = "EG23";
  v %= 4;
  const rule = "Pyramide ou cône : V = (aire de base × hauteur) ÷ 3.";
  if (v === 0) {
    const c = r.int(2, 6),
      h = 3 * r.int(1, 3),
      V = (c * c * h) / 3;
    return Q(
      f,
      v,
      4,
      "" +
        "Une pyramide a une base carrée de côté " +
        c +
        " cm et une hauteur de " +
        h +
        " cm. Avec V = (aire de base × hauteur) ÷ 3, calcule son volume.",
      [num(V, "cm³")],
      `(${c}² × ${h}) ÷ 3 = ${V} cm³.`,
      pyramid(c, h),
      "La base carrée a pour aire côté × côté.",
      {
        text: "Utilise la hauteur perpendiculaire, puis divise par trois.",
        svg: formula(`V = (${c} × ${c} × ${h}) ÷ 3`),
      },
      rule,
      "Côté de base 6 cm, hauteur 5 cm : (6² × 5) ÷ 3 = 60 cm³.",
      pyramid(6, 5),
    );
  }
  if (v === 1) {
    const R = r.int(1, 4),
      h = 3 * r.int(1, 3),
      coef = (R * R * h) / 3;
    return Q(
      f,
      v,
      4,
      `Un cône a un rayon de ${R} cm et une hauteur de ${h} cm. Avec V = (π × r² × h) ÷ 3, complète son volume exact.`,
      [num(coef, "π cm³", "V =")],
      `V = (π × ${R}² × ${h}) ÷ 3 = ${coef}π cm³.`,
      pyramid(R, h, { cone: true }),
      "Repère le rayon de la base et la hauteur perpendiculaire.",
      {
        text: "Le cône a le tiers du volume du cylindre correspondant.",
        svg: formula(`V = (π × ${R}² × ${h}) ÷ 3`),
      },
      rule,
      "Rayon 3 cm, hauteur 4 cm : (π × 3² × 4) ÷ 3 = 12π cm³.",
      pyramid(3, 4, { cone: true }),
    );
  }
  if (v === 2) {
    const R = r.pick([1, 2, 3, 6]),
      coef = 4 * R ** 3;
    return Q(
      f,
      v,
      3,
      `Une boule a un rayon de ${R} cm. Avec V = (4 × π × r³) ÷ 3, complète son volume exact. Une fraction est possible.`,
      [
        {
          ...num(coef % 3 ? `${coef}/3` : coef / 3, "π cm³", "V ="),
          kind: coef % 3 ? "fraction" : "number",
        },
      ],
      `V = (4 × π × ${R}³) ÷ 3 = ${(coef / 3) % 1 === 0 ? coef / 3 : coef + "/3"}π cm³.`,
      sphere(R, { filled: true }),
      "Le rayon intervient au cube : r × r × r.",
      {
        text: `Le cube du rayon vaut ${R ** 3}. Multiplie par 4, puis divise par 3.`,
        svg: formula(`V = ((4 × ${R ** 3}) ÷ 3) × π`),
      },
      "Boule : V = (4 × π × r³) ÷ 3.",
      "Rayon 3 cm : (4 × π × 27) ÷ 3 = 36π cm³.",
      sphere(3, { filled: true }),
    );
  }
  const A = 3 * r.int(2, 8),
    h = r.int(2, 7),
    V = (A * h) / 3;
  return Q(
    f,
    v,
    4,
    "" +
      "Une pyramide a un volume de " +
      V +
      " cm³ et une aire de base de " +
      A +
      " cm². Quelle est sa hauteur ? V = (aire de base × hauteur) ÷ 3.",
    [num(h, "cm")],
    `h = (3 × ${V}) ÷ ${A} = ${h} cm.`,
    pyramid(4, h, { hideHeight: true, area: A }),
    "Multiplie d’abord le volume par trois.",
    {
      text: "Le volume multiplié par trois vaut aire de base × hauteur.",
      svg: formula(`${A} × h = 3 × ${V}`),
    },
    rule,
    "V = 20 cm³ et aire de base = 12 cm² : h = (3 × 20) ÷ 12 = 5 cm.",
    pyramid(4, 5, { area: 12 }),
  );
};
function scaleSquares(k = 2) {
  let s = 34,
    b = rect(40, 85, s, s, C.mint) + label(57, 154, "côté 1", 19);
  for (let j = 0; j < k; j++)
    for (let i = 0; i < k; i++) b += rect(210 + i * s, 45 + j * s, s, s, C.mint);
  b += label(210 + (k * s) / 2, 45 + k * s + 35, `côté ${k}`, 19) + text(112, 100, "→", 32);
  return svg(b, 440, 230);
}
generators.EG24 = (r, v = 0) => {
  const f = "EG24";
  v %= 5;
  const rule = "Longueurs × k → aires × k² → volumes × k³.",
    ex = "Facteur 2 : longueurs × 2, aires × 4, volumes × 8.";
  if (v === 0) {
    const k = r.int(2, 5),
      a = r.int(2, 9);
    return Q(
      f,
      v,
      5,
      `Une figure est agrandie avec un facteur ${k}. Un côté mesurait ${a} cm. Quelle est sa nouvelle longueur ?`,
      [num(k * a, "cm")],
      `${a} × ${k} = ${a * k} cm.`,
      "",
      { text: "Le même facteur agit sur chaque côté.", svg: scaleLengthModel(a, k) },
      { text: "Multiplie la longueur initiale par le facteur.", svg: formula(`${a} × ${k}`) },
      rule,
      ex,
      scaleSquares(2),
    );
  }
  if (v === 1) {
    const k = r.int(2, 3),
      A = r.int(2, 9);
    return Q(
      f,
      v,
      3,
      `Toutes les longueurs d’une figure sont multipliées par ${k}. Son aire était ${A} cm². Quelle est sa nouvelle aire ?`,
      [num(A * k * k, "cm²")],
      `Aire × ${k}² : ${A} × ${k * k} = ${A * k * k} cm².`,
      "",
      { text: "Observe les rangées et les colonnes de copies.", svg: scaledAreaModel(k, A) },
      { text: `Le facteur d’aire est ${k} × ${k}.`, svg: formula(`${A} × ${k} × ${k}`) },
      rule,
      ex,
      scaleSquares(2),
    );
  }
  if (v === 2) {
    const k = r.int(2, 3),
      newV = r.int(2, 8),
      oldV = newV * k ** 3;
    return Q(
      f,
      v,
      3,
      `Un solide de volume ${oldV} cm³ est réduit en divisant toutes ses longueurs par ${k}. Quel est son nouveau volume ?`,
      [num(newV, "cm³")],
      `${oldV} ÷ ${k}³ = ${oldV} ÷ ${k ** 3} = ${newV} cm³.`,
      "",
      {
        text: "La longueur, la largeur et la hauteur sont toutes réduites.",
        svg: reductionVolumeModel(k, oldV),
      },
      {
        text: `Divise par ${k} pour chacune des trois dimensions.`,
        svg: formula(`${oldV} ÷ (${k} × ${k} × ${k})`),
      },
      rule,
      ex,
      box(2, 2, 2),
    );
  }
  if (v === 3) {
    const k = r.int(2, 5);
    return Q(
      f,
      v,
      3,
      "" +
        "Deux figures sont semblables. L’aire de la seconde est " +
        k * k +
        " fois celle de la première. Quel est le facteur d’agrandissement des longueurs ?",
      [num(k, "")],
      `Le facteur de longueur est positif et son carré vaut ${k * k} : k = ${k}.`,
      "",
      { text: "Compte les copies le long d’un seul côté du grand carré.", svg: scaledAreaModel(k) },
      { text: "Cherche le nombre positif dont le carré est donné.", svg: formula(`k² = ${k * k}`) },
      rule,
      ex,
      scaleSquares(2),
    );
  }
  const k = -r.int(2, 4),
    a = r.int(2, 9);
  return Q(
    f,
    v,
    3,
    `Une homothétie de rapport ${k} transforme un segment de ${a} cm. Quelle est la longueur de son image ?`,
    [num(-k * a, "cm")],
    `Une longueur est positive : ${a} × ${-k} = ${-k * a} cm.`,
    "",
    {
      text: "L’image se place de l’autre côté de O ; sa longueur reste positive.",
      svg: scaleLengthModel(a, k, true),
    },
    { text: `Pour une longueur, utilise la valeur positive ${-k}.`, svg: formula(`${a} × ${-k}`) },
    "Une homothétie de rapport k multiplie les longueurs par |k|.",
    "Rapport −2, longueur 3 cm : longueur image 6 cm.",
    formula("Rapport −2", "Longueur : 3 cm → 6 cm"),
  );
};
function barsTriangle(a, b, c) {
  const s = 280 / Math.max(c, a + b);
  return svg(
    rect(55, 35, a * s, 22, C.mint) +
      rect(55 + a * s, 35, b * s, 22, C.pale) +
      label(55 + (a * s) / 2, 25, a, 18) +
      label(55 + a * s + (b * s) / 2, 25, b, 18) +
      rect(55, 110, c * s, 22, "#d5e6ef") +
      label(55 + (c * s) / 2, 165, c, 20),
    440,
    205,
  );
}
generators.EG25 = (r, v = 0) => {
  const f = "EG25";
  v %= 4;
  if (v === 0) {
    const a = r.int(2, 6),
      b = r.int(a, 8),
      c = a + b + r.pick([-2, 0, 1, 3]),
      ok = c < a + b;
    return Q(
      f,
      v,
      3,
      `Peut-on construire un triangle non aplati de côtés ${a} cm, ${b} cm et ${c} cm ?`,
      [txt(ok ? "Oui" : "Non", ["Oui", "Non"])],
      "" +
        c +
        " " +
        (ok ? "<" : c === a + b ? "=" : ">") +
        " " +
        a +
        " + " +
        b +
        " : " +
        (ok ? "triangle non aplati possible" : "triangle non aplati impossible") +
        ".",
      barsTriangle(a, b, c),
      "Compare la longueur du plus grand côté à la somme des deux autres longueurs.",
      {
        text: "L’égalité donne un triangle aplati, exclu ici.",
        svg: formula(`${c} … ${a} + ${b}`),
      },
      "Triangle non aplati : la plus grande longueur doit être strictement inférieure à la somme des deux autres.",
      "Côtés 3 cm, 4 cm et 6 cm : 6 < 3 + 4, donc possible.",
      barsTriangle(3, 4, 6),
    );
  }
  if (v === 1) {
    const k = r.int(1, 3),
      same = r.bool(),
      a = [3 * k, 4 * k, 5 * k],
      b = same ? [a[2], a[0], a[1]] : a.map((x) => 2 * x);
    return Q(
      f,
      v,
      3,
      "" +
        "ABC a pour côtés " +
        a.join(", ") +
        " cm. DEF a pour côtés " +
        b.join(", ") +
        " cm. Les triangles sont-ils égaux, donc superposables ?",
      [txt(same ? "Oui" : "Non", ["Oui", "Non"])],
      same
        ? "Les trois longueurs sont identiques, même si l’ordre change."
        : "Le second triangle est agrandi : il est semblable, mais pas égal.",
      "",
      { text: "Compare les côtés de même couleur.", svg: correspondingTriangles(a, b) },
      {
        text: "Des angles de mêmes mesures ne garantissent pas des côtés de mêmes longueurs.",
        svg: formula(
          a.join(" ; "),
          b
            .slice()
            .sort((x, y) => x - y)
            .join(" ; "),
        ),
      },
      "Des triangles égaux sont superposables : mêmes longueurs de côtés et mêmes mesures d’angles.",
      "3, 4, 5 et 5, 3, 4 décrivent deux triangles égaux.",
      formula("3 ; 4 ; 5", "3 ; 4 ; 5"),
    );
  }
  if (v === 2) {
    const k = r.pick([2, 3, 0.5]),
      a = [3, 4, 5],
      b = a.map((x) => x * k);
    return Q(
      f,
      v,
      3,
      "" +
        "Les côtés de deux triangles semblables mesurent 3, 4, 5 cm puis " +
        b.map(fr).join(" ; ") +
        " cm, dans l’ordre des correspondances. Quel facteur transforme les longueurs du " +
        "premier en celles du second ?",
      [num(k, "")],
      `${fr(b[0])} ÷ 3 = ${fr(b[1])} ÷ 4 = ${fr(b[2])} ÷ 5 = ${fr(k)}.`,
      "",
      { text: "Repère les longueurs qui se correspondent.", svg: correspondingTriangles(a, b) },
      {
        text: "Vérifie que le même facteur convient aux trois côtés.",
        svg: formula(`${fr(b[0])} ÷ 3`, `4 × ? = ${fr(b[1])}`),
      },
      "Triangles semblables : les longueurs correspondantes sont proportionnelles.",
      "3, 4, 5 deviennent 6, 8, 10 : facteur 2.",
      formula("3 → 6", "4 → 8", "5 → 10"),
    );
  }
  const angles = r.pick([
      [40, 60, 80],
      [30, 50, 100],
      [35, 65, 80],
    ]),
    order = r.pick([
      [2, 0, 1],
      [1, 2, 0],
      [0, 2, 1],
    ]),
    target = r.int(0, 2),
    answer = ["D", "E", "F"][order.indexOf(target)];
  return Q(
    f,
    v,
    3,
    "" +
      "Dans ABC : [angle:A] = " +
      angles[0] +
      "°, [angle:B] = " +
      angles[1] +
      "°, [angle:C] = " +
      angles[2] +
      "°. Dans DEF : [angle:D] = " +
      angles[order[0]] +
      "°, [angle:E] = " +
      angles[order[1]] +
      "°, [angle:F] = " +
      angles[order[2]] +
      "°. Quel sommet correspond à " +
      ["A", "B", "C"][target] +
      " ?",
    [txt(answer, ["D", "E", "F"])],
    `[angle:${["A", "B", "C"][target]}] = [angle:${answer}] = ${angles[target]}° : ces sommets se correspondent.`,
    "",
    {
      text: "Les angles aux sommets correspondants ont la même mesure.",
      svg: angleTriangles(angles, order, target),
    },
    {
      text: `Cherche l’angle de ${angles[target]}° dans DEF.`,
      svg: formula(`Mesure recherchée : ${angles[target]}°`),
    },
    "Dans des triangles semblables, les sommets correspondants ont des angles de même mesure.",
    "Si [angle:B] = [angle:F] = 60°, B correspond à F.",
    formula("[angle:B] = 60°", "[angle:F] = 60°"),
  );
};
generators.EG26 = (r, v = 0) => {
  const f = "EG26";
  v %= 4;
  if (v === 0) {
    const L = r.int(5, 9),
      l = r.int(2, 4),
      h = r.int(2, 6);
    return Q(
      f,
      v,
      3,
      "" +
        "Un pavé mesure " +
        L +
        " cm de long, " +
        l +
        " cm de large et " +
        h +
        " cm de haut. Un plan intérieur est parallèle à la base " +
        L +
        " × " +
        l +
        ". Quelles sont les dimensions de la section ?",
      [num(L, "cm", "Longueur"), num(l, "cm", "Largeur")],
      `La section est un rectangle de ${L} cm sur ${l} cm.`,
      box(L, l, h),
      "Une section parallèle à une face du pavé a les mêmes dimensions que cette face.",
      { text: "La hauteur du pavé ne modifie pas ces deux dimensions.", svg: rectangle(L, l) },
      "Pavé : une section parallèle à une face est un rectangle superposable à cette face.",
      "Pavé 6 × 4 × 3, plan parallèle à 6 × 4 : section 6 × 4.",
      box(6, 4, 3),
    );
  }
  if (v === 1) {
    const R = r.int(2, 6),
      h = r.int(4, 9);
    return Q(
      f,
      v,
      3,
      "" +
        "Un cylindre plein de rayon " +
        R +
        " cm et de hauteur " +
        h +
        " cm est coupé, entre ses bases, par un plan perpendiculaire à son axe. Quelle est la " +
        "forme de la surface de coupe ?",
      [txt("Disque", ["Disque", "Cercle", "Rectangle", "Triangle"])],
      "La section du cylindre plein est un disque, intérieur compris.",
      cylinder(R, h, { section: true }),
      "Le plan est parallèle aux bases circulaires.",
      { text: "On demande toute la surface, pas seulement son contour.", svg: disk(R) },
      "Un plan perpendiculaire à l’axe coupe un cylindre plein suivant un disque.",
      "Le contour est un cercle ; la surface pleine est un disque.",
      cylinder(3, 5, { section: true }),
    );
  }
  if (v === 2) {
    const R = r.int(2, 9);
    return Q(
      f,
      v,
      3,
      "" +
        "Une sphère de rayon " +
        R +
        " cm est coupée par un plan passant par son centre. Quel est le rayon du cercle " +
        "d’intersection ?",
      [num(R, "cm")],
      `Réponse : grand cercle : son rayon est celui de la sphère, ${R} cm.`,
      sphere(R, { cut: 0 }),
      "Le centre de la sphère appartient aussi au plan de coupe.",
      {
        text: "Un rayon dans ce plan relie toujours le centre à la sphère.",
        svg: disk(R, { fill: "none" }),
      },
      "Un grand cercle est obtenu par un plan passant par le centre de la sphère.",
      "Sphère de rayon 5 cm : grand cercle de rayon 5 cm.",
      sphere(5, { cut: 0 }),
    );
  }
  const [d, a, R] = r.pick([
    [3, 4, 5],
    [4, 3, 5],
    [5, 12, 13],
    [6, 8, 10],
  ]);
  return Q(
    f,
    v,
    3,
    "" +
      "Une sphère de rayon " +
      R +
      " cm est coupée par un plan à " +
      d +
      " cm de son centre. Quel est le rayon du cercle d’intersection ?",
    [num(a, "cm")],
    `r² = ${R}² − ${d}² = ${a * a}, donc r = ${a} cm.`,
    sphere(R, { cut: d }),
    "Le rayon de la sphère est l’hypoténuse du triangle de la coupe.",
    {
      text: "Applique Pythagore puis cherche la racine positive.",
      svg: formula(`r² + ${d}² = ${R}²`, `r² = ${R * R} − ${d * d}`),
    },
    "Dans la coupe, les côtés d’un triangle rectangle mesurent la distance au plan, r et R.",
    "R = 5, distance = 3 : r² = 25 − 9 = 16 ; r = 4.",
    sphere(5, { cut: 3 }),
  );
};

function conversion(from, to, factor, inverse = false) {
  const b =
    rect(30, 52, 130, 62, C.mint) +
    rect(280, 52, 130, 62, C.pale) +
    label(95, 91, from, 24) +
    label(345, 91, to, 24) +
    line(176, 83, 264, 83, C.ink, 3) +
    poly(
      [
        [264, 83],
        [251, 76],
        [251, 90],
      ],
      C.ink,
    ) +
    label(220, 56, `${inverse ? "÷" : "×"} ${factor}`, 23, C.orange);
  return svg(b, 440, 150);
}
function squareUnits() {
  let b = "";
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 10; x++) b += rect(130 + x * 15, 40 + y * 15, 15, 15, C.mint, C.green);
  b +=
    label(205, 26, "10 cm", 22) +
    text(290, 122, "10 cm", 22) +
    label(220, 220, "1 dm² = 100 cm²", 23);
  return svg(b, 440, 245);
}
function cubeUnits() {
  let b = "";
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 10; x++) b += rect(32 + x * 11, 38 + y * 11, 11, 11, C.mint, C.green);
  b += label(87, 180, "100 cubes", 22) + label(305, 180, "10 couches", 22);
  for (let i = 0; i < 10; i++)
    b += poly(
      [
        [235, 139 - i * 10],
        [330, 139 - i * 10],
        [365, 118 - i * 10],
        [270, 118 - i * 10],
      ],
      i === 9 ? C.mint : "#edf6ee",
    );
  b += label(188, 103, "×", 28) + label(220, 225, "1 dm³ = 1 000 cm³ = 1 L", 22);
  return svg(b, 440, 250);
}
generators.GM01 = (r, v = 0) => {
  const f = "GM01";
  v %= 5;
  const rule = "Convertir change le nombre et l’unité, pas la grandeur.",
    ex = "2,4 m = 2,4 × 100 cm = 240 cm.";
  if (v === 0) {
    const [large, small, k] = r.pick([
        ["m", "cm", 100],
        ["km", "m", 1000],
        ["cm", "mm", 10],
        ["m", "dm", 10],
      ]),
      x = r.int(12, 85) / 10,
      ans = Math.round(x * k);
    return Q(
      f,
      v,
      6,
      `Convertis ${fr(x)} ${large} en ${small}.`,
      [num(ans, small)],
      `${fr(x)} × ${k} = ${ans} ${small}.`,
      "",
      {
        text: "Une même longueur s’exprime avec des unités plus petites.",
        svg: unitStrip(large, small, k, "Même longueur"),
      },
      {
        text: "Multiplie par le nombre de petites unités dans la grande.",
        svg: formula(`${fr(x)} × ${k}`),
      },
      rule,
      ex,
      conversion("m", "cm", 100),
    );
  }
  if (v === 1) {
    const [large, small, k] = r.pick([
        ["m", "cm", 100],
        ["km", "m", 1000],
        ["cm", "mm", 10],
        ["m", "dm", 10],
      ]),
      x = r.int(11, 95) * 10;
    return Q(
      f,
      v,
      6,
      `Convertis ${x} ${small} en ${large}.`,
      [num(x / k, large)],
      `${x} ÷ ${k} = ${fr(x / k)} ${large}.`,
      "",
      {
        text: "Regroupe les petites unités dans une unité plus grande.",
        svg: unitStrip(large, small, k, "Même longueur"),
      },
      { text: `Regroupe les petites unités par ${k}.`, svg: formula(`${x} ÷ ${k}`) },
      rule,
      "240 cm = 240 ÷ 100 m = 2,4 m.",
      conversion("cm", "m", 100, true),
    );
  }
  if (v === 2) {
    const g = r.int(1, 15) * 50,
      kg = r.int(1, 9) / 10,
      other = Math.round(kg * 1000),
      ans = g < other ? "<" : g > other ? ">" : "=";
    return Q(
      f,
      v,
      6,
      `Complète : ${g} g … ${fr(kg)} kg.`,
      [txt(ans, ["<", "=", ">"])],
      `${fr(kg)} kg = ${other} g ; ${g} g ${ans} ${other} g.`,
      "",
      {
        text: "Les deux masses doivent s’exprimer dans la même unité.",
        svg: unitStrip("kg", "g", 1000, "Même masse"),
      },
      {
        text: "Passe des kilogrammes aux grammes, puis compare.",
        svg: formula(`${fr(kg)} × 1 000 = ? g`, `${g} g … ? g`),
      },
      rule,
      "750 g < 0,8 kg car 0,8 kg = 800 g.",
      conversion("kg", "g", "1 000"),
    );
  }
  if (v === 3) {
    const liters = r.pick([0.15, 0.25, 0.5, 0.75, 1.2, 1.5, 2.25]),
      ans = Math.round(liters * 1000);
    return Q(
      f,
      v,
      6,
      `Convertis ${fr(liters)} L en mL.`,
      [num(ans, "mL")],
      `${fr(liters)} × 1 000 = ${ans} mL.`,
      "",
      {
        text: "La même quantité se partage en unités plus petites.",
        svg: unitStrip("L", "mL", 1000, "Même contenance"),
      },
      { text: "Chaque litre contient 1 000 millilitres.", svg: formula(`${fr(liters)} × 1 000`) },
      rule,
      "0,75 L = 750 mL.",
      conversion("L", "mL", "1 000"),
    );
  }
  const room = r.int(23, 30) * 10,
    wardrobe = r.int(15, 21) * 10,
    gap = room - wardrobe;
  return Q(
    f,
    v,
    6,
    "" +
      "Une pièce mesure " +
      fr(room / 100) +
      " m de haut. Une armoire mesure " +
      wardrobe +
      " cm de haut. Quelle distance reste jusqu’au plafond ?",
    [num(gap, "cm")],
    `${fr(room / 100)} m = ${room} cm ; ${room} − ${wardrobe} = ${gap} cm.`,
    svg(
      line(135, 35, 135, 210) +
        line(135, 35, 315, 35) +
        rect(185, 210 - (wardrobe * 175) / room, 80, (wardrobe * 175) / room, C.mint) +
        text(10, 118, `${fr(room / 100)} m`, 22) +
        text(280, 166, `${wardrobe} cm`, 22) +
        label(226, 65, "?", 25),
      440,
      240,
    ),
    "Convertis la hauteur de la pièce en centimètres avant de soustraire.",
    {
      text: "Les deux longueurs doivent être dans la même unité.",
      svg: formula(`${room} − ${wardrobe}`),
    },
    rule,
    "2,50 m − 170 cm = 250 cm − 170 cm = 80 cm.",
    conversion("m", "cm", 100),
  );
};
generators.GM02 = (r, v = 0) => {
  const f = "GM02";
  v %= 8;
  if (v === 6) {
    const [large, small] = r.pick([
        ["km²", "hm²"],
        ["hm²", "dam²"],
        ["dam²", "m²"],
        ["cm²", "mm²"],
      ]),
      inverse = r.bool(),
      x = inverse ? r.int(1, 19) * 25 : r.int(1, 19) / 10,
      from = inverse ? small : large,
      to = inverse ? large : small,
      ans = inverse ? x / 100 : x * 100;
    return Q(
      f,
      v,
      5,
      `Convertis ${fr(x)} ${from} en ${to}.`,
      [num(Math.round(ans * 1e8) / 1e8, to)],
      `${fr(x)} ${inverse ? "÷" : "×"} 100 = ${fr(ans)} ${to}.`,
      "",
      {
        text: "Compte les petites unités sur les deux dimensions.",
        svg: areaUnitModel(large, small),
      },
      {
        text: "Une grande unité d’aire contient 10 × 10 petites unités d’aire.",
        svg: formula(`${fr(x)} ${inverse ? "÷" : "×"} 100`),
      },
      "Entre deux unités d’aire voisines : facteur 100.",
      "1 m² = 100 dm².",
      areaUnitModel("m²", "dm²"),
    );
  }
  if (v === 7) {
    const [large, small, k] = r.pick([
        ["dm³", "cm³", 1000],
        ["m³", "cm³", 1000000],
      ]),
      inverse = r.bool(),
      x = inverse ? r.pick([250, 1500, 20000, 2500000]) : r.pick([0.002, 0.02, 0.5, 1.25]),
      from = inverse ? small : large,
      to = inverse ? large : small,
      ans = inverse ? x / k : x * k;
    return Q(
      f,
      v,
      5,
      `Convertis ${fr(x)} ${from} en ${to}.`,
      [num(Math.round(ans * 1e8) / 1e8, to)],
      `${fr(x)} ${inverse ? "÷" : "×"} ${k.toLocaleString("fr-FR")} = ${fr(ans)} ${to}.`,
      "",
      {
        text: "Un cube se remplit dans trois dimensions.",
        svg: volumeUnitModel(large, small, k === 1000000 ? 100 : 10),
      },
      {
        text:
          k === 1000000
            ? "De m à cm : × 100 sur chacune des trois dimensions."
            : "De dm à cm : × 10 sur chacune des trois dimensions.",
        svg: formula(
          k === 1000000 ? "100 × 100 × 100 = 1 000 000" : "10 × 10 × 10 = 1 000",
          `${inverse ? "Diviser" : "Multiplier"} par ${k.toLocaleString("fr-FR")}`,
        ),
      },
      "Un facteur de longueur s’applique trois fois pour un volume.",
      "1 m³ = 1 000 000 cm³.",
      volumeUnitModel("m³", "cm³", 100),
    );
  }
  if (v === 5) {
    const inverse = r.bool(),
      litres = r.pick([50, 125, 250, 500, 750, 1500, 2500]),
      m3 = litres / 1000;
    return Q(
      f,
      v,
      5,
      inverse ? `Convertis ${litres} L en m³.` : `Convertis ${fr(m3)} m³ en L.`,
      [num(inverse ? m3 : litres, inverse ? "m³" : "L")],
      inverse ? `${litres} ÷ 1 000 = ${fr(m3)} m³.` : `${fr(m3)} × 1 000 = ${litres} L.`,
      "",
      { text: "Un petit cube de 1 dm³ contient 1 L.", svg: volumeUnitModel("m³", "dm³") },
      {
        text: inverse
          ? "Regroupe les litres par milliers."
          : "Chaque mètre cube contient mille litres.",
        svg: formula(inverse ? `${litres} ÷ 1 000` : `${fr(m3)} × 1 000`),
      },
      "1 m³ = 1 000 L.",
      "250 L = 0,25 m³.",
      volumeUnitModel("m³", "dm³"),
    );
  }
  if (v === 0) {
    const x = r.int(1, 19) / 10;
    return Q(
      f,
      v,
      6,
      `Convertis ${fr(x)} dm² en cm².`,
      [num(Math.round(x * 100), "cm²")],
      `${fr(x)} × 100 = ${Math.round(x * 100)} cm².`,
      "",
      { text: "Compte les cases par rangée, puis le nombre de rangées.", svg: areaUnitModel() },
      { text: "1 dm² contient 10 × 10 carrés de 1 cm².", svg: formula(`${fr(x)} × 10 × 10`) },
      "1 dm² = 100 cm² ; 1 m² = 100 dm².",
      "0,4 dm² = 40 cm².",
      squareUnits(),
    );
  }
  if (v === 1) {
    const cm = r.int(1, 19) * 25;
    return Q(
      f,
      v,
      6,
      `Convertis ${cm} cm² en dm².`,
      [num(cm / 100, "dm²")],
      `${cm} ÷ 100 = ${fr(cm / 100)} dm².`,
      "",
      { text: "Regroupe les petites cases dans un carré de 1 dm de côté.", svg: areaUnitModel() },
      { text: "Regroupe les centimètres carrés par centaines.", svg: formula(`${cm} ÷ 100`) },
      "Pour passer de cm² à dm², divise par 100.",
      "250 cm² = 2,5 dm².",
      squareUnits(),
    );
  }
  if (v === 2) {
    const x = r.int(1, 19) / 10;
    return Q(
      f,
      v,
      5,
      `Convertis ${fr(x)} m³ en dm³.`,
      [num(Math.round(x * 1000), "dm³")],
      `${fr(x)} × 1 000 = ${Math.round(x * 1000)} dm³.`,
      "",
      {
        text: "Repère une couche, puis toutes les couches du grand cube.",
        svg: volumeUnitModel("m³", "dm³"),
      },
      {
        text: "1 m³ contient 10 × 10 × 10 cubes de 1 dm³.",
        svg: formula("10 × 10 × 10 = 1 000", `${fr(x)} × 1 000`),
      },
      "1 m³ = 1 000 dm³ ; 1 dm³ = 1 000 cm³.",
      "0,2 m³ = 200 dm³.",
      volumeUnitModel("m³", "dm³"),
    );
  }
  if (v === 3) {
    const x = r.int(1, 19) / 2;
    return Q(
      f,
      v,
      5,
      `Convertis ${fr(x)} L en cm³.`,
      [num(Math.round(x * 1000), "cm³")],
      `1 L = 1 dm³ = 1 000 cm³ ; ${fr(x)} L = ${Math.round(x * 1000)} cm³.`,
      "",
      { text: "Un litre remplit exactement un cube de 1 dm de côté.", svg: capacityModel() },
      {
        text: "Chaque litre donne 1 dm³, soit 1 000 petits cubes de 1 cm³.",
        svg: formula(`${fr(x)} × 1 000`),
      },
      "1 L = 1 dm³ ; 1 mL = 1 cm³.",
      "3,5 L = 3 500 cm³.",
      cubeUnits(),
    );
  }
  const c = r.int(2, 5);
  return Q(
    f,
    v,
    6,
    `Le volume d’un petit cube vaut ${c ** 3} … . Quelle unité convient ?`,
    [txt("cm³", ["cm", "cm²", "cm³"])],
    "Un volume s’exprime ici en centimètres cubes : cm³.",
    box(c, c, c, false),
    "Une longueur mesure un segment, une aire une surface, un volume un solide.",
    { text: "Pense aux petits cubes qui remplissent le solide.", svg: box(c, c, c, false) },
    "Longueur : cm. Aire : cm². Volume : cm³.",
    "Un cube de 3 cm de côté a un volume de 27 cm³.",
    box(3, 3, 3),
  );
};
const hhmm = (n) =>
  "" +
  String(Math.floor((((n % 1440) + 1440) % 1440) / 60)).padStart(2, "0") +
  " h " +
  String(((n % 60) + 60) % 60).padStart(2, "0");
const timeFields = (n) => [
  num(Math.floor((((n % 1440) + 1440) % 1440) / 60), "h", "Heures"),
  num(((n % 60) + 60) % 60, "min", "Minutes"),
];
const durationFields = (n) => [
  num(Math.floor(n / 60), "h", "Heures"),
  num(n % 60, "min", "Minutes"),
];
function timeCourse() {
  return {
    rule: "1 h = 60 min. Une durée est l’écart entre deux horaires.",
    example: "De 14 h 35 à 16 h 10 : 25 min + 60 min + 10 min = 1 h 35 min.",
    svg: timeline(["14 h 35", "15 h", "16 h", "16 h 10"], ["25 min", "60 min", "10 min"]),
  };
}
generators.GM03 = (r, v = 0) => {
  const f = "GM03";
  v %= 8;
  const c = timeCourse();
  if (v === 6) {
    const den = r.pick([2, 3, 4, 5, 6, 10, 12]),
      n = r.int(1, den - 1);
    return Q(
      f,
      v,
      6,
      `Combien de minutes représentent ${n}/${den} d’heure ?`,
      [num((60 * n) / den, "min")],
      `60 × ${n}/${den} = ${(60 * n) / den} min.`,
      "",
      {
        text: "Les parts ont la même durée. Garde celles qui sont colorées.",
        svg: hourParts(n, den),
      },
      {
        text: `Une part vaut 60 ÷ ${den} minutes. Prends ${n} part(s).`,
        svg: formula(`60 ÷ ${den} × ${n}`),
      },
      "Pour calculer une fraction d’heure, applique la fraction à 60 minutes.",
      "3/4 d’heure = 60 ÷ 4 × 3 = 45 minutes.",
      hourParts(3, 4),
    );
  }
  if (v === 7) {
    const [from, to, unit, k, inverse] = r.pick([
        ["minutes", "heures", "h", 60, true],
        ["secondes", "minutes", "min", 60, true],
        ["heures", "jours", "jours", 24, true],
        ["jours", "heures", "h", 24, false],
      ]),
      whole = r.int(2, 12),
      x = inverse ? whole * k : whole,
      ans = inverse ? whole : whole * k;
    return Q(
      f,
      v,
      6,
      `Convertis ${x} ${from} en ${to}.`,
      [num(ans, unit)],
      `${x} ${inverse ? "÷" : "×"} ${k} = ${ans} ${to}.`,
      "",
      {
        text: "Une grande unité regroupe plusieurs petites unités.",
        svg: timeUnitsModel(from, to, k, inverse),
      },
      {
        text: inverse
          ? `Regroupe les ${from} par ${k}.`
          : `Chaque ${from === "jours" ? "jour" : "unité"} contient ${k} ${to}.`,
        svg: formula(`${x} ${inverse ? "÷" : "×"} ${k}`),
      },
      "1 jour = 24 h ; 1 h = 60 min ; 1 min = 60 s.",
      "180 min = 3 h ; 2 jours = 48 h.",
      conversion("min", "h", 60, true),
    );
  }
  if (v === 0) {
    const n = r.int(1, 4) * 60 + r.pick([5, 10, 15, 20, 25, 35, 40, 45, 50]);
    return Q(
      f,
      v,
      6,
      `Exprime ${n} minutes en heures et minutes.`,
      durationFields(n),
      `${n} = ${Math.floor(n / 60)} × 60 + ${n % 60} : ${Math.floor(n / 60)} h ${n % 60} min.`,
      "",
      {
        text: "Cherche les groupes complets d’une heure, puis le reste.",
        svg: groupsModel(n, "min", 60, "h"),
      },
      {
        text: "Le reste donne les minutes après les heures complètes.",
        svg: formula(`${n} = ? × 60 + ?`),
      },
      c.rule,
      c.example,
      c.svg,
    );
  }
  if (v === 1) {
    const x = r.pick([0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5]);
    return Q(
      f,
      v,
      6,
      `Convertis ${fr(x)} h en minutes.`,
      [num(x * 60, "min")],
      `${fr(x)} × 60 = ${x * 60} min.`,
      "",
      {
        text: "Un disque entier vaut une heure. Observe la partie d’heure.",
        svg: hourParts(Math.round((x % 1) * 4), 4, Math.floor(x)),
      },
      { text: "Multiplie le nombre d’heures par 60.", svg: formula(`${fr(x)} × 60`) },
      "Heures décimales → minutes : multiplier par 60.",
      "1,25 h = 75 min.",
      hourParts(1, 4, 1),
    );
  }
  if (v === 2) {
    const start = r.int(8, 18) * 60 + r.pick([10, 20, 25, 35, 40, 50]),
      d = r.int(1, 2) * 60 + r.pick([15, 25, 35, 45]),
      end = start + d;
    return Q(
      f,
      v,
      6,
      `Un film commence à ${hhmm(start)} et dure ${Math.floor(d / 60)} h ${d % 60} min. À quelle heure finit-il ?`,
      timeFields(end),
      `${hhmm(start)} + ${Math.floor(d / 60)} h ${d % 60} min = ${hhmm(end)}.`,
      "",
      {
        text: "Avance de la durée du film à partir de l’horaire de départ.",
        svg: timeRoute([hhmm(start), "?"], `${Math.floor(d / 60)} h ${d % 60} min`),
      },
      {
        text: "Avance d’abord des heures entières, puis des minutes restantes.",
        svg: timeline(
          [hhmm(start), hhmm(start + Math.floor(d / 60) * 60), "?"],
          [`${Math.floor(d / 60)} h`, `${d % 60} min`],
        ),
      },
      c.rule,
      c.example,
      c.svg,
    );
  }
  if (v === 3) {
    const start = r.int(8, 17) * 60 + r.pick([10, 20, 35, 45, 50]),
      d = r.int(1, 2) * 60 + r.pick([10, 20, 25, 35, 45]),
      end = start + d;
    return Q(
      f,
      v,
      6,
      `Une activité commence à ${hhmm(start)} et finit à ${hhmm(end)} le même jour. Quelle est sa durée ?`,
      durationFields(d),
      `${hhmm(end)} − ${hhmm(start)} = ${Math.floor(d / 60)} h ${d % 60} min.`,
      "",
      {
        text: "La durée est l’écart entre les deux horaires.",
        svg: timeRoute([hhmm(start), hhmm(end)], "? h ? min"),
      },
      {
        text: "Compte les minutes jusqu’à l’heure suivante, puis la suite.",
        svg: timeline(
          [hhmm(start), hhmm(Math.ceil(start / 60) * 60), hhmm(end)],
          [`${60 - (start % 60)} min`, "?"],
        ),
      },
      c.rule,
      c.example,
      c.svg,
    );
  }
  if (v === 4) {
    const before = r.pick([10, 15, 20, 25, 30, 35]),
      after = r.pick([10, 15, 20, 25, 30, 40]),
      start = 1440 - before,
      d = before + after;
    return Q(
      f,
      v,
      6,
      `Un trajet commence à ${hhmm(start)} et dure ${d} min. À quelle heure arrive-t-on le lendemain ?`,
      timeFields(after),
      `${before} min jusqu’à minuit, puis ${after} min : arrivée à ${hhmm(after)} le lendemain.`,
      "",
      {
        text: "Le trajet traverse minuit et continue le lendemain.",
        svg: timeRoute([hhmm(start), "00 h 00", "?"], `${d} min`, { midnight: true }),
      },
      {
        text: `Il faut ${before} min pour atteindre 00 h 00. Retire-les de la durée.`,
        svg: timeline([hhmm(start), "00 h 00", "?"], [`${before} min`, `${d} − ${before}`]),
      },
      c.rule,
      c.example,
      c.svg,
    );
  }
  const end = r.int(9, 18) * 60 + r.pick([5, 10, 15, 20, 30]),
    d = r.pick([35, 45, 50, 55, 75]),
    start = end - d;
  return Q(
    f,
    v,
    6,
    `Un bus arrive à ${hhmm(end)} après ${d} min de trajet. À quelle heure est-il parti ?`,
    timeFields(start),
    `${hhmm(end)} − ${d} min = ${hhmm(start)}.`,
    "",
    {
      text: "Pars de l’arrivée et suis la flèche vers le départ.",
      svg: timeRoute(["?", hhmm(end)], `${d} min`, { back: true }),
    },
    {
      text: "Retire d’abord les minutes de l’horaire pour atteindre l’heure pleine. Puis retire la durée restante.",
      svg: formula(
        `${hhmm(end)} − ${end % 60} min = ${hhmm(end - (end % 60))}`,
        `Reste à retirer : ${d} − ${end % 60} min`,
      ),
    },
    c.rule,
    c.example,
    c.svg,
  );
};
generators.GM04 = (r, v = 0) => {
  const f = "GM04";
  v %= 5;
  const rule = "Grande aiguille : minutes. Petite aiguille : heures, avec une avance progressive.";
  if (v === 0) {
    const h = r.int(1, 11),
      m = 5 * r.int(1, 11),
      civil = h + 12;
    return Q(
      f,
      v,
      6,
      "Il est l’après-midi ou le soir. Quelle heure indique cette horloge ?",
      timeFields(civil * 60 + m),
      `${String(civil).padStart(2, "0")} h ${String(m).padStart(2, "0")}.`,
      clock(h, m),
      "La grande aiguille indique les minutes. Deux nombres voisins sont séparés par 5 minutes.",
      {
        text: `La petite aiguille est après ${h}. Ajoute 12 aux heures de l’après-midi.`,
        svg: clock(h, m, true),
      },
      rule,
      "Grande aiguille sur 7, petite après 2, l’après-midi : 14 h 35.",
      clock(2, 35, true),
    );
  }
  if (v === 1) {
    const h = r.int(1, 11),
      m = r.pick([10, 20, 25, 35, 40, 50]),
      next = h + 1,
      interval = `${h} et ${next}`;
    return Q(
      f,
      v,
      6,
      "" +
        "Pour représenter " +
        h +
        " h " +
        m +
        ", sur quel nombre place-t-on la grande aiguille ? Entre quels nombres place-t-on la " +
        "petite ?",
      [
        num(m / 5, "", "Grande aiguille : nombre"),
        txt(
          interval,
          [`${h - 1 || 12} et ${h}`, interval, `${next} et ${(next % 12) + 1}`],
          "Petite aiguille : entre",
        ),
      ],
      `Grande aiguille sur ${m / 5} ; petite entre ${h} et ${next}, avancée de ${m}/60 d’heure.`,
      clock(0, 0, false, true),
      "Deux nombres voisins du cadran sont séparés par 5 minutes. La petite aiguille avance aussi.",
      {
        text: `Pour les minutes : ${m} ÷ 5. Pour les heures, on a dépassé ${h} h.`,
        svg: clock(h, m, true),
      },
      rule,
      "À 3 h 20 : grande aiguille sur 4 ; petite entre 3 et 4.",
      clock(3, 20, true),
    );
  }
  if (v === 2) {
    const year = r.pick([2028, 2032, 2036]),
      start = r.pick([27, 28]),
      end = r.pick([1, 2, 3]),
      days = 29 - start + end,
      labels = [];
    for (let d = start; d <= 29; d++) labels.push(`${d} fév.`);
    for (let d = 1; d <= end; d++) labels.push(`${d} mars`);
    const n = labels.length,
      w = 420 / n,
      vis = svg(
        labels
          .map(
            (t, i) =>
              rect(10 + i * w, 40, w, 70, i < 29 - start + 1 ? C.mint : C.pale) +
              label(10 + (i + 0.5) * w, 82, t, 20),
          )
          .join("") + label(220, 155, `${year} : février a 29 jours`, 22),
        440,
        190,
      );
    return Q(
      f,
      v,
      6,
      "" +
        "Le calendrier de " +
        year +
        " indique 29 jours en février. Combien de jours s’écoulent du " +
        start +
        " février à 00 h au " +
        end +
        " mars à 00 h ?",
      [num(days, "jours")],
      `Il y a ${29 - start + 1} jour(s) jusqu’au 1er mars, puis ${end - 1} : ${days} jours.`,
      vis,
      "Compte les passages d’un minuit au suivant, pas les dates incluses.",
      { text: "Un intervalle entre deux dates voisines correspond à un jour.", svg: vis },
      "Une durée en jours compte les intervalles entre les dates.",
      "Du 28 février au 2 mars d’une année bissextile : 3 jours.",
      timeline(["28 fév.", "29 fév.", "1 mars", "2 mars"], ["1 jour", "1 jour", "1 jour"]),
    );
  }
  if (v === 3) {
    const item = r.pick([
      {
        p: "Combien de jours compte une année bissextile ?",
        a: 366,
        u: "jours",
        h: "Elle contient le 29 février en plus.",
        c: "365 + 1 = 366 jours.",
      },
      {
        p: "Combien de jours compte une année ordinaire ?",
        a: 365,
        u: "jours",
        h: "Février compte alors 28 jours.",
        c: "Une année ordinaire compte 365 jours.",
      },
      {
        p: "Combien d’années compte un siècle ?",
        a: 100,
        u: "ans",
        h: "Un siècle contient dix décennies.",
        c: "10 × 10 = 100 ans.",
      },
      {
        p: "Combien d’années compte un millénaire ?",
        a: 1000,
        u: "ans",
        h: "Un millénaire contient dix siècles.",
        c: "10 × 100 = 1 000 ans.",
      },
    ]);
    return Q(
      f,
      v,
      6,
      item.p,
      [num(item.a, item.u)],
      item.c,
      "",
      {
        text: item.h,
        svg: calendarModel(
          item.a === 366
            ? "leap"
            : item.a === 365
              ? "ordinary"
              : item.a === 100
                ? "century"
                : "millennium",
        ),
      },
      {
        text:
          item.a > 366
            ? "Additionne les dix groupes identiques."
            : "Additionne les jours des douze mois.",
        svg: formula(
          item.a === 366
            ? "7 × 31 + 4 × 30 + 29"
            : item.a === 365
              ? "7 × 31 + 4 × 30 + 28"
              : item.a === 100
                ? "10 × 10"
                : "10 × 100",
        ),
      },
      "Année ordinaire : 365 jours. Bissextile : 366 jours. Siècle : 100 ans. Millénaire : 1 000 ans.",
      "Une année bissextile a un jour de plus, le 29 février.",
      formula("365 + 1 = 366"),
    );
  }
  const days = r.int(1, 5) * 7 + r.int(1, 6);
  return Q(
    f,
    v,
    6,
    `Exprime ${days} jours en semaines et jours.`,
    [num(Math.floor(days / 7), "semaines", "Semaines"), num(days % 7, "jours", "Jours")],
    `${days} = ${Math.floor(days / 7)} × 7 + ${days % 7} : ${Math.floor(days / 7)} semaines et ${days % 7} jours.`,
    "",
    {
      text: "Cherche les groupes complets d’une semaine, puis le reste.",
      svg: groupsModel(days, "jours", 7, "semaine"),
    },
    {
      text: "Cherche les groupes complets de 7, puis le reste.",
      svg: formula(`${days} = ? × 7 + ?`),
    },
    "1 semaine = 7 jours.",
    "17 jours = 2 semaines et 3 jours.",
    formula("17 = 2 × 7 + 3"),
  );
};
Object.assign(counts, { GM01: 5, GM02: 8, GM03: 8, GM04: 5 });
