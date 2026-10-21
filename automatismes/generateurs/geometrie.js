import { svg, text, line, rect, circle, esc } from "./draw.js";
export const counts = { EG01: 4, EG02: 4, EG03: 4, EG04: 4 };
export const generators = {};
const C = "#17675b",
  A = "#ac6921",
  G = "#78918a";
const fmt = (x) => String(Math.round(x * 1e9) / 1e9).replace(".", ",");
const H = (text, svg = "") => ({ text, svg });
const lines = (ss) =>
  svg(ss.map((s, i) => text(22, 35 + 36 * i, s, 22)).join(""), 520, ss.length * 36 + 25);
const F = (label, answer, kind = "number", unit = "", options) => ({
  label,
  answer: String(answer),
  kind,
  unit,
  ...(options ? { options } : {}),
});
const rules = {
  EG01: "Lis le pas de la graduation. Compte les intervalles, pas les traits.",
  EG02: "Dans (x ; y), lis x sur l’axe horizontal, puis y sur l’axe vertical.",
  EG03: "Dans un pavé : x, y, z. Sur une carte : latitude depuis l’équateur, longitude depuis Greenwich.",
  EG04: "Les données et les codages permettent de conclure. L’apparence seule ne suffit pas.",
  EG05:
    "Chaque droite remarquable se reconnaît par des propriétés précises : milieu, sommet, " +
    "perpendicularité ou égalité de mesures d’angles.",
  EG06: "Un angle plat mesure 180°. Utilise les codages et les propriétés de la configuration.",
  EG07: "La somme des mesures des angles d’un triangle est 180°. Les angles à la base d’un triangle isocèle ont la même mesure.",
  EG10: "Si ABC est rectangle en A, alors BC² = AB² + AC².",
  EG11: "Avec les alignements et le parallélisme requis, les côtés correspondants des deux triangles sont proportionnels.",
  EG12:
    "Dans un triangle rectangle, le cosinus, le sinus et la tangente d’un angle aigu sont " +
    "des rapports de longueurs de côtés.",
  EG13: "Choisis le rapport utile, remplace par les données, puis calcule la longueur ou utilise la mesure d’angle fournie.",
  EG14: "Symétrie axiale : l’axe est la médiatrice du segment point–image. Demi-tour : le centre est le milieu de ce segment.",
  EG15: "Une translation déplace chaque point avec la même direction, le même sens et la même distance.",
  EG16:
    "Rotation : centre, mesure d’angle et sens. Homothétie de rapport k : longueurs " +
    "multipliées par |k|. Si k<0, un point distinct du centre change de côté par rapport " +
    "au centre.",
  EG17: "Des vecteurs égaux décrivent le même déplacement. [vector:AB] + [vector:BC] = [vector:AC].",
  EG18:
    "Dans un triangle, le segment joignant les milieux de deux côtés est parallèle au " +
    "troisième et sa longueur en est la moitié. Dans un triangle rectangle, l’hypoténuse " +
    "est un diamètre du cercle circonscrit.",
};
function q(f, v, grade, dnb, prompt, fields, hints, solution, opt = {}) {
  return {
    family: f,
    variant: `${f}-V${v + 1}`,
    grade,
    dnb,
    prompt,
    math: opt.math || "",
    fields,
    check: opt.check || {
      type: fields.length > 1 ? "fields" : fields[0].kind === "text" ? "text" : "numeric",
      values: fields.map((f) => f.answer),
    },
    hints,
    solution,
    visual: opt.visual || "",
    course: courseCard(f, v),
    tags: opt.tags || [],
    audit: opt.audit || {},
  };
}
const n = (label, a, unit = "") => [F(label, a, "number", unit)];
const choice = (a, options, label = "Réponse") => [F(label, a, "text", "", options)];
const xy = (x, y) => [F("Abscisse x", x), F("Ordonnée y", y)];
const L = (a, b, c = C, w = 2) => line(a[0], a[1], b[0], b[1], c, w);
const arrow = (a, b, c = C) => {
  let t = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return (
    L(a, b, c, 2.4) +
    ("" +
      '<path d="M ' +
      (b[0] - 9 * Math.cos(t - 0.45)) +
      " " +
      (b[1] - 9 * Math.sin(t - 0.45)) +
      " L " +
      b[0] +
      " " +
      b[1] +
      " L " +
      (b[0] - 9 * Math.cos(t + 0.45)) +
      " " +
      (b[1] - 9 * Math.sin(t + 0.45)) +
      '" fill="none" stroke="' +
      c +
      '" stroke-width="2.4"/>')
  );
};
const polygon = (ps, fill = "#ecf5f0", stroke = C) =>
  `<polygon points="${ps.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="2.2"/>`;
function plane(points = {}, opts = {}) {
  const extent = Math.max(5, ...Object.values(points).flat().map(Math.abs)),
    step = Math.min(27, 140 / extent),
    ox = 210,
    oy = 175;
  const p = ([x, y]) => [ox + x * step, oy - y * step];
  let b = "";
  for (let i = -Math.ceil(extent); i <= Math.ceil(extent); i++) {
    b +=
      line(ox + i * step, 20, ox + i * step, 330, "#dde7e2", 1) +
      line(35, oy - i * step, 385, oy - i * step, "#dde7e2", 1);
    if (opts.axes !== false && i) {
      if ((opts.sx || 1) === 1 || i % 2 === 0)
        b += text(ox + i * step - 7, oy + 22, fmt(i * (opts.sx || 1)), 18, G);
      b += text(ox + 8, oy - i * step + 6, fmt(i * (opts.sy || 1)), 18, G);
    }
  }
  if (opts.axes !== false)
    b +=
      arrow([35, oy], [390, oy], G) +
      arrow([ox, 330], [ox, 14], G) +
      text(393, oy + 5, "x", 17) +
      text(ox + 8, 15, "y", 17) +
      text(ox - 17, oy - 8, "0", 18);
  if (opts.axis) b += L(p(opts.axis[0]), p(opts.axis[1]), A, 3);
  if (opts.edges) for (const [a, z] of opts.edges) b += L(p(points[a]), p(points[z]));
  if (opts.arrows) for (const [a, z] of opts.arrows) b += arrow(p(points[a]), p(points[z]));
  if (opts.proj)
    for (const k of opts.proj) {
      const z = p(points[k]);
      b += `<path d="M ${z[0]} ${oy} V ${z[1]} H ${ox}" fill="none" stroke="${A}" stroke-dasharray="5 4"/>`;
    }
  for (const [k, z] of Object.entries(points)) {
    const t = p(z);
    b +=
      circle(t[0], t[1], 4, C, C) +
      text(
        t[0] + (opts.axes !== false && z[0] === 0 ? 32 : 7),
        t[1] + (opts.axes !== false && z[0] === 0 ? 6 : -9),
        k,
        23,
      );
  }
  return svg(b, 420, 355);
}
function numberline(start, step, count, index, opts = {}) {
  const p = (i) => 40 + (440 * i) / count,
    y = 65;
  let b = arrow([30, y], [500, y]);
  for (let i = 0; i <= count; i++) {
    b += line(p(i), y - 6, p(i), y + 6);
    if (opts.labels?.includes(i) || !opts.labels)
      b += text(p(i) - 9, y + 34, fmt(start + i * step), 18);
  }
  if (index != null)
    b += circle(p(index), y, 5, C, C) + text(p(index) - 8, y - 17, opts.name || "A", 21);
  if (opts.help) b += text(40, 130, opts.help, 20, A);
  return svg(b, 530, 155);
}
function fig(points, edges, opts = {}) {
  const vs = Object.values(points),
    xs = vs.map((p) => p[0]),
    ys = vs.map((p) => p[1]),
    loX = Math.min(...xs),
    hiX = Math.max(...xs),
    loY = Math.min(...ys),
    hiY = Math.max(...ys),
    s = Math.min(330 / Math.max(hiX - loX, 1), 205 / Math.max(hiY - loY, 1)),
    ox = 250 - ((loX + hiX) * s) / 2,
    oy = 145 + ((loY + hiY) * s) / 2;
  const p = (z) => [ox + z[0] * s, oy - z[1] * s];
  const ctr = [
    vs.reduce((n, p) => n + p[0], 0) / vs.length,
    vs.reduce((n, p) => n + p[1], 0) / vs.length,
  ];
  let b = "";
  if (opts.circ) {
    const z = p(opts.circ.center);
    b += circle(z[0], z[1], opts.circ.r * s, "none", "#b3ccc1");
  }
  for (const e of edges) {
    let [a, z, label] = e;
    b += L(p(points[a]), p(points[z]));
    if (label) {
      if (a === "O" || z === "O") {
        b += text(25, opts.note ? 274 : 300, `${a}${z} = ${label}`, 23, A);
        continue;
      }
      let va = points[a],
        vb = points[z],
        delta = [vb[0] - va[0], vb[1] - va[1]],
        len = Math.hypot(...delta),
        t = 0.5,
        m = [(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2];
      if (vs.some((z) => Math.hypot(z[0] - m[0], z[1] - m[1]) < len * 0.08)) {
        t = 0.3;
        m = [va[0] + t * delta[0], va[1] + t * delta[1]];
      }
      let d = [delta[1] / len, -delta[0] / len];
      if (d[0] * (m[0] - ctr[0]) + d[1] * (m[1] - ctr[1]) < 0) d = d.map((x) => -x);
      let px = p(m);
      b +=
        "" +
        '<text x="' +
        (px[0] + d[0] * 35) +
        '" y="' +
        (px[1] - d[1] * 35 + 7) +
        '" font-size="23" text-anchor="middle" fill="' +
        A +
        '">' +
        esc(a === "O" || z === "O" ? `${a}${z} = ${label}` : label) +
        "</text>";
    }
  }
  if (opts.right) {
    let [a, o, z] = opts.right,
      P = p(points[o]),
      u = p(points[a]).map((x, i) => x - P[i]),
      v = p(points[z]).map((x, i) => x - P[i]),
      un = Math.hypot(...u),
      vn = Math.hypot(...v);
    u = u.map((x) => (12 * x) / un);
    v = v.map((x) => (12 * x) / vn);
    b +=
      "" +
      '<path d="M ' +
      (P[0] + u[0]) +
      " " +
      (P[1] + u[1]) +
      " l " +
      v[0] +
      " " +
      v[1] +
      " l " +
      -u[0] +
      " " +
      -u[1] +
      '" fill="none" stroke="' +
      C +
      '" stroke-width="1.7"/>';
  }
  for (const [name, label] of Object.entries(opts.angles || {})) {
    if (!label) continue;
    const ns = [
      ...new Set(
        edges
          .filter((e) => e[0] === name || e[1] === name)
          .map((e) => (e[0] === name ? e[1] : e[0])),
      ),
    ];
    if (ns.length < 2) continue;
    const o = p(points[name]),
      u = p(points[ns[0]]).map((x, i) => x - o[i]),
      v = p(points[ns[1]]).map((x, i) => x - o[i]),
      nu = Math.hypot(...u),
      nv = Math.hypot(...v),
      uu = u.map((x) => x / nu),
      vv = v.map((x) => x / nv),
      bis = [uu[0] + vv[0], uu[1] + vv[1]],
      nb = Math.hypot(...bis),
      theta = Math.acos(Math.max(-1, Math.min(1, uu[0] * vv[0] + uu[1] * vv[1]))),
      dist = theta < 0.6 ? 65 : 42;
    const tx = o[0] + (bis[0] / nb) * dist,
      ty = o[1] + (bis[1] / nb) * dist;
    b +=
      "" +
      '<path d="M ' +
      (o[0] + uu[0] * 22) +
      " " +
      (o[1] + uu[1] * 22) +
      " A 22 22 0 0 " +
      (uu[0] * vv[1] - uu[1] * vv[0] > 0 ? 1 : 0) +
      " " +
      (o[0] + vv[0] * 22) +
      " " +
      (o[1] + vv[1] * 22) +
      '" fill="none" stroke="' +
      A +
      '" stroke-width="1.8"/><text x="' +
      tx +
      '" y="' +
      (ty + 7) +
      '" text-anchor="middle" fill="' +
      A +
      '" stroke="white" stroke-width="4" paint-order="stroke" font-size="22">' +
      esc(label) +
      "</text>";
  }
  for (const e of opts.ticks || []) {
    const [a, z, num = 1] = e,
      u = p(points[a]),
      v = p(points[z]),
      dx = v[0] - u[0],
      dy = v[1] - u[1],
      len = Math.hypot(dx, dy);
    for (let k = 0; k < num; k++) {
      const off = (k - (num - 1) / 2) * 5,
        m = [(u[0] + v[0]) / 2 + (off * dx) / len, (u[1] + v[1]) / 2 + (off * dy) / len];
      b += L(
        [m[0] - (5 * dy) / len, m[1] + (5 * dx) / len],
        [m[0] + (5 * dy) / len, m[1] - (5 * dx) / len],
        A,
        2,
      );
    }
  }
  for (const [name, z] of Object.entries(points)) {
    const t = p(z),
      dx = z[0] - ctr[0],
      dy = z[1] - ctr[1],
      norm = Math.hypot(dx, dy);
    b +=
      circle(t[0], t[1], 2.8, C, C) +
      text(
        norm > 1e-9 ? t[0] + (dx / norm) * 21 - 7 : t[0] + 10,
        norm > 1e-9 ? t[1] - (dy / norm) * 21 + 7 : t[1] + 23,
        name,
        24,
      );
  }
  if (opts.note) b += text(25, 300, opts.note, 17, G);
  return svg(b, 500, 320);
}
function bar(parts, total = 180, unit = total === 180 ? "°" : "") {
  let x = 25,
    b = text(25, 24, `Total : ${fmt(total)}${unit}`, 21);
  for (const [size, label] of parts) {
    let w = (450 * size) / total;
    b += rect(x, 43, w, 48, "#e0efe8") + text(x + w / 2 - 12, 74, label, 20);
    x += w;
  }
  return svg(b, 500, 115);
}
function triangleAngles(a, b, labels = {}, settings = {}) {
  let aa = (a * Math.PI) / 180,
    bb = (b * Math.PI) / 180,
    h = (Math.sin(bb) * Math.sin(aa)) / Math.sin(aa + bb),
    x = (Math.sin(bb) * Math.cos(aa)) / Math.sin(aa + bb);
  return fig(
    { A: [0, 0], B: [1, 0], C: [x, h] },
    [
      ["A", "B"],
      ["B", "C"],
      ["C", "A"],
    ],
    {
      angles: { A: labels.A ?? a + "°", B: labels.B ?? b + "°", C: labels.C ?? "?" },
      right: a === 90 ? ["B", "A", "C"] : undefined,
      ticks: settings.isosc
        ? [
            ["A", "B"],
            ["A", "C"],
          ]
        : [],
    },
  );
}
function pave(x, y, z, point = "G") {
  const P = {
    O: [80, 205],
    A: [290, 205],
    B: [380, 130],
    C: [170, 130],
    E: [80, 65],
    F: [290, 65],
    G: [380, -10 + 65],
    H: [170, -10 + 65],
  };
  P.G = [380, -10];
  P.H = [170, -10];
  for (const k in P) P[k][1] += 45;
  let b = "";
  for (const [a, c] of [
    ["O", "A"],
    ["A", "B"],
    ["B", "C"],
    ["C", "O"],
    ["E", "F"],
    ["F", "G"],
    ["G", "H"],
    ["H", "E"],
    ["O", "E"],
    ["A", "F"],
    ["B", "G"],
    ["C", "H"],
  ])
    b += L(P[a], P[c], G);
  for (const k in P) b += circle(...P[k], 3, C, C) + text(P[k][0] + 7, P[k][1] - 7, k, 19);
  b +=
    arrow(P.O, P.A) +
    arrow(P.O, P.C) +
    arrow(P.O, P.E) +
    text(175, 275, `x : ${x}`, 20) +
    text(95, 212, `y : ${y}`, 20) +
    text(25, 170, `z : ${z}`, 20);
  if (point === "P") {
    const p = [(P.O[0] + P.B[0]) / 2, (P.O[1] + P.B[1]) / 2];
    b += circle(...p, 5, A, A) + text(p[0] + 7, p[1] - 8, "P", 21);
  }
  return svg(b, 470, 300);
}
function mapGrid(lat, lon, name = "Q", others = {}) {
  let b = rect(60, 30, 360, 200, "#f0f7f3"),
    px = (x) => 240 + x * 2,
    py = (y) => 130 - y * 2;
  for (let x = -80; x <= 80; x += 20) {
    b += line(px(x), 30, px(x), 230, "#d4e1da", 1);
    if (x % 40 === 0)
      b += text(px(x) - 20, 255, x === 0 ? "0°" : Math.abs(x) + "°" + (x < 0 ? "O" : "E"), 18);
  }
  for (let y = -40; y <= 40; y += 20)
    b +=
      line(60, py(y), 420, py(y), "#d4e1da", 1) +
      text(5, py(y) + 5, y === 0 ? "0°" : Math.abs(y) + "°" + (y < 0 ? "S" : "N"), 18);
  b +=
    line(60, 130, 420, 130, A, 2) +
    line(240, 30, 240, 230, A, 2) +
    text(275, 124, "Équateur", 18, A) +
    text(245, 20, "Greenwich", 18, A);
  for (const [k, p] of Object.entries({ [name]: [lon, lat], ...others }))
    b += circle(px(p[0]), py(p[1]), 5, C, C) + text(px(p[0]) + 8, py(p[1]) - 7, k, 20);
  return svg(b, 480, 275);
}
Object.assign(generators, {
  EG01(r, v = 0) {
    v %= 4;
    let start,
      step,
      count,
      index,
      labels,
      ans,
      grade = 6,
      prompt;
    if (v === 0) {
      start = r.int(0, 5);
      count = r.pick([2, 4, 5, 10]);
      step = 1 / count;
      index = r.int(1, count - 1);
      labels = [0, count];
      ans = start + index * step;
      prompt = "Lis l’abscisse de A.";
    } else if (v === 1) {
      let d = r.pick([2, 3, 4, 5]),
        num = r.int(d + 1, 2 * d - 1);
      start = 0;
      step = 1 / d;
      count = 2 * d;
      index = null;
      labels = [0, d, 2 * d];
      ans = num / d;
      prompt = `Le point A doit avoir pour abscisse ${num}/${d}. Combien de graduations après 0 faut-il le placer ?`;
      ans = num;
    } else if (v === 2) {
      grade = 5;
      step = r.pick([0.5, 1, 2]);
      count = 8;
      start = -4 * step;
      index = r.int(0, 3);
      labels = [0, 4, 8];
      ans = start + index * step;
      prompt = "Lis l’abscisse de A.";
    } else {
      grade = 5;
      start = -r.int(1, 4) * 2;
      step = r.pick([1, 2, 3]);
      count = r.int(3, 5);
      index = r.int(1, count - 1);
      labels = [0, count];
      ans = start + index * step;
      prompt = "Lis l’abscisse de A en utilisant les deux repères.";
    }
    const visual = numberline(start, step, count, index, { labels }),
      help = `Un intervalle vaut ${fmt(step)}.`;
    return q(
      "EG01",
      v,
      grade,
      true,
      prompt,
      n(v === 1 ? "Nombre de graduations" : "Abscisse", ans),
      [
        H("Compte les intervalles entre les nombres repères.", visual),
        H(
          v === 1 ? `Le dénominateur indique combien de parts font une unité.` : help,
          numberline(start, step, count, index, {
            labels,
            help:
              v === 1
                ? "Une fraction compte des parts de l’unité."
                : `${fmt(start)} + ${index} × ${fmt(step)}`,
          }),
        ),
      ],
      v === 1
        ? `Il faut compter ${ans} graduations à partir de 0.`
        : `${fmt(start)} + ${index} × ${fmt(step)} = ${fmt(ans)}.`,
      { visual, audit: { start, step, count, index, ans, numerator: v === 1 ? ans : null } },
    );
  },
  EG02(r, v = 0) {
    v %= 4;
    let x = r.int(-4, 4),
      y = r.int(-4, 4),
      sx = 1,
      sy = 1;
    if (v === 1) {
      if (r.bool()) x = 0;
      else y = 0;
      if (x === 0 && y === 0) y = 3;
    }
    if (v === 2) {
      sx = r.pick([2, 3]);
      sy = r.pick([0.5, 1]);
      x = r.pick([-2, -1, 1, 2]);
      y = r.pick([-3, -2, 1, 2]);
    }
    if (v === 3) {
      x = r.pick([-3, -2, 1, 2, 3]);
      y = r.pick([-3, -1, 1, 3]);
      const points = { A: [x, y], B: [-x, y], C: [-x, -y] },
        key = r.pick(["A", "B", "C"]),
        p = points[key],
        visual = plane(points);
      return q(
        "EG02",
        v,
        5,
        true,
        `Quel point a pour coordonnées (${p[0]} ; ${p[1]}) ?`,
        choice(key, ["A", "B", "C"]),
        [
          H("Lis d’abord x sur l’axe horizontal.", visual),
          H("Puis lis y sur l’axe vertical.", plane(points, { proj: [key] })),
        ],
        `Le point ${key} a pour coordonnées (${p[0]} ; ${p[1]}).`,
        { visual, audit: { points, key } },
      );
    }
    const visual = plane({ A: [x, y] }, { sx, sy });
    return q(
      "EG02",
      v,
      5,
      true,
      "Lis les coordonnées de A.",
      xy(x * sx, y * sy),
      [
        H(
          "Projette A sur l’axe horizontal : tu lis x.",
          plane({ A: [x, y] }, { sx, sy, proj: ["A"] }),
        ),
        H("Lis ensuite y sur l’axe vertical. Regarde les unités de chaque axe.", visual),
      ],
      `A(${fmt(x * sx)} ; ${fmt(y * sy)}).`,
      { visual, audit: { x, y, sx, sy } },
    );
  },
  EG03(r, v = 0) {
    v %= 4;
    if (v < 2) {
      let x = 2 * r.int(1, 3),
        y = 2 * r.int(1, 3),
        z = r.int(1, 5),
        point = v ? "P" : "G",
        vals = v ? [x / 2, y / 2, 0] : [x, y, z],
        visual = pave(x, y, z, point);
      return q(
        "EG03",
        v,
        v ? 4 : 4,
        true,
        v
          ? "P est le centre de la face OABC. Donne ses coordonnées (x ; y ; z)."
          : "G est le sommet opposé à O. Donne ses coordonnées (x ; y ; z).",
        [F("x", vals[0]), F("y", vals[1]), F("z", vals[2])],
        [
          H("Lis les axes dans l’ordre x, y, z.", visual),
          H(
            v
              ? "Sur la face du bas, z=0. P est à mi-distance selon x et selon y."
              : "Pour atteindre G, on parcourt toute la dimension selon chacun des trois axes.",
            visual,
          ),
        ],
        `${point}(${vals.join(" ; ")}).`,
        { visual, audit: { x, y, z, point } },
      );
    }
    let lat = r.pick([-40, -20, 20, 40]),
      lon = r.pick([-60, -40, -20, 20, 40, 60]);
    if (v === 2) {
      let visual = mapGrid(lat, lon);
      return q(
        "EG03",
        v,
        3,
        true,
        "Lis la latitude puis la longitude de Q sur cette carte graduée.",
        [
          F("Latitude", Math.abs(lat), "number", "°"),
          F("Nord ou sud", lat > 0 ? "N" : "S", "text", "", ["N", "S"]),
          F("Longitude", Math.abs(lon), "number", "°"),
          F("Est ou ouest", lon > 0 ? "E" : "O", "text", "", ["E", "O"]),
        ],
        [
          H("Latitude : à partir de l’équateur, vers le nord ou le sud.", visual),
          H("Longitude : à partir de Greenwich, vers l’est ou l’ouest.", visual),
        ],
        `${Math.abs(lat)}° ${lat > 0 ? "N" : "S"} ; ${Math.abs(lon)}° ${lon > 0 ? "E" : "O"}.`,
        { visual, audit: { lat, lon } },
      );
    }
    let points = { A: [lon, lat], B: [-lon, lat], C: [lon, -lat] },
      key = r.pick(["A", "B", "C"]),
      p = points[key],
      visual = mapGrid(lat, lon, "A", { B: points.B, C: points.C });
    return q(
      "EG03",
      v,
      3,
      true,
      "" +
        "Quel point a pour latitude " +
        Math.abs(p[1]) +
        "° " +
        (p[1] > 0 ? "N" : "S") +
        " et pour longitude " +
        Math.abs(p[0]) +
        "° " +
        (p[0] > 0 ? "E" : "O") +
        " ?",
      choice(key, ["A", "B", "C"]),
      [
        H("Repère le parallèle, depuis l’équateur.", visual),
        H("Puis repère le méridien, depuis Greenwich.", visual),
      ],
      `C’est le point ${key}.`,
      { visual, audit: { points, key } },
    );
  },
  EG04(r, v = 0) {
    v %= 4;
    if (v === 0) {
      const top = r.pick(["A", "B", "C"]),
        ns = ["A", "B", "C"].filter((k) => k !== top),
        pts = { [top]: [0, r.int(3, 5)], [ns[0]]: [-2, 0], [ns[1]]: [2, 0] },
        visual = fig(
          pts,
          [
            [top, ns[0]],
            [top, ns[1]],
            [ns[0], ns[1]],
          ],
          {
            ticks: [
              [top, ns[0]],
              [top, ns[1]],
            ],
          },
        );
      return q(
        "EG04",
        v,
        6,
        true,
        "Quel est le sommet principal du triangle isocèle codé ?",
        choice(top, ["A", "B", "C"]),
        [
          H("Repère les deux côtés de même longueur.", visual),
          H("Le sommet principal est leur sommet commun.", visual),
        ],
        `Les côtés égaux se rejoignent en ${top}.`,
        { visual, audit: { top, pts } },
      );
    }
    if (v === 1) {
      const kind = r.pick(["carré", "rectangle", "losange"]),
        claim = r.pick(["rectangle", "losange", "parallélogramme"]),
        ans =
          kind === "carré" || claim === kind || claim === "parallélogramme"
            ? "Oui"
            : "Pas toujours";
      return q(
        "EG04",
        v,
        5,
        true,
        `Tout ${kind} est-il un ${claim} ?`,
        choice(ans, ["Oui", "Pas toujours"]),
        [
          H(
            "Utilise les propriétés, pas seulement le nom.",
            lines(["Rectangle : 4 angles droits.", "Losange : 4 côtés de même longueur."]),
          ),
          H(
            "Un carré possède les deux propriétés. Un rectangle ou un losange est un parallélogramme.",
            lines(["Carré → rectangle et losange", "Rectangle ou losange → parallélogramme"]),
          ),
        ],
        ans === "Oui"
          ? `Oui : c’est une propriété de tout ${kind}.`
          : `Pas toujours : un ${kind} n’est pas nécessairement un ${claim}.`,
        { audit: { kind, claim } },
      );
    }
    if (v === 2) {
      const w = r.int(3, 5),
        h = r.int(1, 2),
        pts = { A: [-w, 0], B: [0, h], C: [w, 0], D: [0, -h], O: [0, 0] },
        visual = fig(
          pts,
          [
            ["A", "B"],
            ["B", "C"],
            ["C", "D"],
            ["D", "A"],
            ["A", "C"],
            ["B", "D"],
          ],
          {
            right: ["A", "O", "B"],
            ticks: [
              ["A", "O"],
              ["O", "C"],
              ["B", "O", 2],
              ["O", "D", 2],
            ],
          },
        );
      return q(
        "EG04",
        v,
        5,
        true,
        "Les diagonales se coupent en leur milieu et sont perpendiculaires. Quelle nature la " +
          "plus précise est garantie parmi ces choix ?",
        choice("Losange", ["Parallélogramme", "Rectangle", "Losange"]),
        [
          H("Un milieu commun des diagonales donne un parallélogramme.", visual),
          H(
            "Des diagonales perpendiculaires dans un parallélogramme caractérisent un losange.",
            visual,
          ),
        ],
        "C’est un losange.",
        { visual, audit: { w, h } },
      );
    }
    const name = r.pick(["A", "B", "C"]),
      visual = fig(
        { A: [0, 0], B: [4, 0], C: [4.1, 3] },
        [
          ["A", "B"],
          ["B", "C"],
          ["C", "A"],
        ],
        { note: "Figure non à l’échelle · aucun angle donné" },
      );
    return q(
      "EG04",
      v,
      6,
      true,
      `Sans mesure, codage ni autre donnée, le dessin permet-il d’affirmer que l’angle en ${name} est droit ?`,
      choice("Non", ["Oui", "Non"]),
      [
        H("Une apparence n’est pas une donnée.", visual),
        H(
          "Il faut un codage, une mesure ou une propriété qui prouve 90°.",
          lines(["Angle droit : codage ou preuve nécessaire."]),
        ),
      ],
      "Non : le dessin seul ne prouve pas un angle droit.",
      { visual, audit: { name } },
    );
  },
});
// Formes des sujets : diagonales, angle droit et longueur du grand triangle.
const installExtras = () => {
  const old1 = generators.EG01;
  counts.EG01 = 5;
  generators.EG01 = (r, v = 0) => {
    v %= 5;
    if (v < 4) return old1(r, v);
    const d = r.pick([3, 4, 5, 6]),
      num = r.int(1, 2 * d - 1),
      visual = numberline(0, 1 / d, 2 * d, num, { labels: [0, d, 2 * d] });
    return q(
      "EG01",
      v,
      6,
      true,
      "Lis l’abscisse de A. Écris-la sous forme de fraction.",
      [F("Abscisse", `${num}/${d}`, "fraction")],
      [
        H("Compte combien de parts forment une unité.", visual),
        H(`Une unité contient ${d} intervalles égaux. Compte ceux qui vont de 0 à A.`, visual),
      ],
      `A a pour abscisse ${num}/${d}.`,
      { visual, audit: { num, d } },
    );
  };
  const old4 = generators.EG04;
  counts.EG04 = 6;
  generators.EG04 = (r, v = 0) => {
    v %= 6;
    if (v < 4) return old4(r, v);
    const w = r.int(3, 5),
      h = r.int(1, 2),
      slant = v === 5 ? r.int(1, 2) : 0,
      pts = {
        A: [-w + slant, h],
        B: [w + slant, h],
        C: [w - slant, -h],
        D: [-w - slant, -h],
        O: [0, 0],
      },
      visual = fig(
        pts,
        [
          ["A", "B"],
          ["B", "C"],
          ["C", "D"],
          ["D", "A"],
          ["A", "C"],
          ["B", "D"],
        ],
        {
          ticks:
            v === 4
              ? [
                  ["A", "O"],
                  ["O", "C"],
                  ["B", "O"],
                  ["O", "D"],
                ]
              : [
                  ["A", "O"],
                  ["O", "C"],
                  ["B", "O", 2],
                  ["O", "D", 2],
                ],
        },
      ),
      ans = v === 4 ? "Rectangle" : "Parallélogramme";
    return q(
      "EG04",
      v,
      5,
      true,
      v === 4
        ? "Les diagonales ont le même milieu et la même longueur. Quelle nature est garantie ?"
        : "Les diagonales se coupent en leur milieu. Quelle nature est garantie, sans autre donnée ?",
      choice(ans, ["Parallélogramme", "Rectangle", "Losange"]),
      [
        H("Le milieu commun des diagonales garantit un parallélogramme.", visual),
        H(
          v === 4
            ? "Des diagonales de même longueur garantissent alors un rectangle."
            : "Sans autre propriété, on ne peut pas préciser davantage.",
          visual,
        ),
      ],
      v === 4
        ? "Le quadrilatère est un rectangle, éventuellement un carré."
        : "Le quadrilatère est un parallélogramme.",
      { visual, audit: { w, h, slant } },
    );
  };
  const old6 = generators.EG06;
  counts.EG06 = 7;
  generators.EG06 = (r, v = 0) => {
    v %= 7;
    if (v < 6) return old6(r, v);
    const name = r.pick(["A", "B", "C"]),
      names = ["A", "B", "C"].filter((x) => x !== name),
      pts = { [name]: [0, 0], [names[0]]: [r.int(2, 5), 0], [names[1]]: [0, r.int(2, 5)] },
      visual = fig(
        pts,
        [
          [name, names[0]],
          [name, names[1]],
        ],
        { right: [names[0], name, names[1]] },
      );
    return q(
      "EG06",
      v,
      6,
      true,
      `Quelle est la mesure de l’angle codé au sommet ${name} ?`,
      n("Mesure", 90, "°"),
      [
        H("Le petit carré code un angle droit.", visual),
        H("Un angle droit est un quart de tour.", lines(["360° ÷ 4"])),
      ],
      "Un angle droit mesure 90°.",
      { visual, audit: { name, pts } },
    );
  };
  const old11 = generators.EG11;
  counts.EG11 = 6;
  generators.EG11 = (r, v = 0) => {
    v %= 6;
    if (v < 5) return old11(r, v);
    const factor = r.int(2, 4),
      am = r.int(1, 4),
      an = r.int(2, 5),
      ab = factor * am,
      ac = factor * an,
      visual = thalesVisual(1 / factor, { labels: { AC: "?" } });
    return q(
      "EG11",
      v,
      3,
      true,
      `M∈[AB], N∈[AC] et (MN) ∥ (BC). AM=${am} cm, AB=${ab} cm et AN=${an} cm. Calcule AC.`,
      n("AC", ac, "cm"),
      [
        H("Le grand triangle est un agrandissement du petit.", visual),
        H(
          `De AM à AB, on multiplie par ${factor}. Fais de même de AN à AC.`,
          lines([`AC = ${factor} × ${an} cm`]),
        ),
      ],
      `AC = ${factor} × ${an} cm = ${ac} cm.`,
      { visual, audit: { factor, am, ab, an, ac } },
    );
  };
  const old12 = generators.EG12;
  counts.EG12 = 5;
  generators.EG12 = (r, v = 0) => {
    v %= 5;
    if (v < 4) return old12(r, v);
    const [a, b, c] = r.pick([
        [3, 4, 5],
        [5, 12, 13],
        [8, 15, 17],
      ]),
      angle = r.bool() ? "B" : "C",
      adj = angle === "B" ? a : b,
      visual = trigVisual(a, b, { labA: a + " cm", labB: b + " cm", labH: c + " cm", angle });
    return q(
      "EG12",
      v,
      3,
      true,
      `ABC est rectangle en A. Calcule cos([angle:${angle}]) sous forme de fraction.`,
      [F(`cos([angle:${angle}])`, `${adj}/${c}`, "fraction")],
      [
        H("Cosinus : divise la longueur du côté adjacent par celle de l’hypoténuse.", visual),
        H(
          `Le côté adjacent à l’angle [angle:${angle}] mesure ${adj} cm ; l’hypoténuse mesure ${c} cm.`,
          visual,
        ),
      ],
      `cos([angle:${angle}])=${adj}/${c}.`,
      { visual, audit: { a, b, c, angle } },
    );
  };
  const old13 = generators.EG13;
  counts.EG13 = 5;
  generators.EG13 = (r, v = 0) => {
    v %= 5;
    if (v < 4) return old13(r, v);
    const angle = r.int(3, 6) * 10 + 5,
      len = r.int(3, 12),
      hyp = r.bool(),
      s = (angle * Math.PI) / 180,
      a = hyp ? len * Math.cos(s) : len,
      b = hyp ? len * Math.sin(s) : len * Math.tan(s),
      c = hyp ? len : len / Math.cos(s),
      good = hyp ? `${len} × cos(${angle}°)` : `${len} ÷ cos(${angle}°)`,
      other = hyp ? `${len} ÷ cos(${angle}°)` : `${len} × cos(${angle}°)`,
      visual = trigVisual(a, b, { labA: hyp ? "?" : len + " cm", labH: hyp ? len + " cm" : "?" });
    return q(
      "EG13",
      v,
      3,
      true,
      "" +
        "ABC est rectangle en A, [angle:B] = " +
        angle +
        "°. " +
        (hyp ? "BC" : "AB") +
        "=" +
        len +
        " cm. Quel calcul donne " +
        (hyp ? "AB" : "BC") +
        " ?",
      choice(good, [good, other, `${len} × sin(${angle}°)`]),
      [
        H("cos([angle:B]) = AB/BC.", visual),
        H(
          hyp
            ? "Pour trouver le numérateur, multiplie la longueur de l’hypoténuse par le cosinus."
            : "Pour trouver le dénominateur, divise la longueur du côté adjacent par le cosinus.",
          lines([`cos(${angle}°) = AB/BC`]),
        ),
      ],
      `${hyp ? "AB" : "BC"} = (${good}) cm. Aucun calcul de cosinus n’est demandé.`,
      { visual, audit: { angle, len, hyp, a, b, c } },
    );
  };
};
const permutations = (s) =>
  s.length === 3
    ? [
        s,
        s[0] + s[2] + s[1],
        s[1] + s[0] + s[2],
        s[1] + s[2] + s[0],
        s[2] + s[0] + s[1],
        s[2] + s[1] + s[0],
      ]
    : [s];
function rosace(n = 8) {
  let b = "",
    o = [225, 150],
    pts = [];
  for (let i = 0; i < n; i++) {
    let a = (2 * Math.PI * i) / n,
      p = [o[0] + 105 * Math.cos(a), o[1] - 105 * Math.sin(a)];
    pts.push(p);
  }
  for (let i = 0; i < n; i++)
    b +=
      polygon([o, pts[i], pts[(i + 1) % n]], i % 2 ? "#f2e9d6" : "#dfeee7") +
      text(
        o[0] + 130 * Math.cos((2 * Math.PI * i) / n) - 7,
        o[1] - 130 * Math.sin((2 * Math.PI * i) / n) + 7,
        String.fromCharCode(65 + i),
        24,
      );
  b +=
    circle(...o, 3, C, C) +
    text(o[0] + 7, o[1] + 23, "O", 24) +
    text(20, 310, `${n} secteurs égaux · centre O`, 23);
  return svg(b, 450, 330);
}
function tiling() {
  let pts = {},
    edges = [];
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 4; x++) {
      let id = String.fromCharCode(65 + y * 4 + x);
      pts[id] = [2 * x - 3, 2 * y - 2];
      if (x) edges.push([String.fromCharCode(64 + y * 4 + x), id]);
      if (y) edges.push([String.fromCharCode(65 + (y - 1) * 4 + x), id]);
      if (x && y) edges.push([String.fromCharCode(64 + (y - 1) * 4 + x), id]);
    }
  return plane(pts, { axes: false, edges });
}
Object.assign(counts, { EG15: 5, EG16: 6, EG17: 4, EG18: 5 });
Object.assign(generators, {
  EG15(r, v = 0) {
    v %= 5;
    let dx = r.int(1, 3),
      dy = r.pick([-2, -1, 1, 2]);
    if (v === 0) {
      let x = r.int(-3, 0),
        y = r.int(-2, 2);
      if (x === -4 + dx && y === -4 + dy) y += 1;
      let pts = { A: [-4, -4], B: [-4 + dx, -4 + dy], C: [x, y] },
        visual = plane(pts, { arrows: [["A", "B"]] });
      return q(
        "EG15",
        v,
        4,
        true,
        `La translation transforme A en B. Donne les coordonnées de l’image D de C.`,
        xy(x + dx, y + dy),
        [
          H("Lis le déplacement de A vers B.", visual),
          H(
            `Reproduis depuis C : ${dx} à droite et ${Math.abs(dy)} vers ${dy > 0 ? "le haut" : "le bas"}.`,
            lines([
              `Abscisse : ${x} + ${dx}`,
              `Ordonnée : ${y} ${dy > 0 ? "+" : "−"} ${Math.abs(dy)}`,
            ]),
          ),
        ],
        `D(${x + dx} ; ${y + dy}).`,
        { visual, audit: { x, y, dx, dy } },
      );
    }
    if (v === 1) {
      let shift = r.int(2, 4),
        pts = {
          A: [-5, -3],
          B: [-3, -3],
          C: [-5, -1],
          P: [-5 + shift, 1],
          Q: [-3 + shift, 1],
          R: [-5 + shift, 3],
          S: [2, -3],
          T: [4, -3],
          U: [4, -1],
        },
        visual = plane(pts, {
          axes: false,
          edges: [
            ["A", "B"],
            ["B", "C"],
            ["C", "A"],
            ["P", "Q"],
            ["Q", "R"],
            ["R", "P"],
            ["S", "T"],
            ["T", "U"],
            ["U", "S"],
          ],
        });
      return q(
        "EG15",
        v,
        4,
        true,
        "Quel triangle s’obtient par translation du triangle ABC ?",
        choice("PQR", ["PQR", "STU"]),
        [
          H("La figure doit glisser sans tourner ni se retourner.", visual),
          H("Compare l’orientation de l’angle droit et les côtés correspondants.", visual),
        ],
        "PQR a la même orientation que ABC ; les trois sommets subissent le même déplacement.",
        { visual, audit: { shift } },
      );
    }
    if (v === 2) {
      let visual = plane({ A: [0, 0], B: [dx, dy] }, { arrows: [["A", "B"]] });
      return q(
        "EG15",
        v,
        4,
        true,
        "" +
          "De A vers B : " +
          dx +
          " carreaux à droite et " +
          Math.abs(dy) +
          " " +
          (dy > 0 ? "en haut" : "en bas") +
          ". Complète le déplacement de B vers A.",
        [
          F("Carreaux à gauche", dx),
          F(dy > 0 ? "Carreaux en bas" : "Carreaux en haut", Math.abs(dy)),
        ],
        [
          H("Le retour inverse le sens.", visual),
          H(
            "Le nombre de carreaux dans chaque direction reste le même.",
            lines([
              `${dx} vers la gauche`,
              `${Math.abs(dy)} vers ${dy > 0 ? "le bas" : "le haut"}`,
            ]),
          ),
        ],
        `Retour : ${dx} à gauche et ${Math.abs(dy)} ${dy > 0 ? "en bas" : "en haut"}.`,
        { visual, audit: { dx, dy } },
      );
    }
    if (v === 3) {
      let deg = r.int(3, 7) * 10 + 2,
        visual = triangleAngles(50, deg, { A: "", B: `${deg}°`, C: "" });
      return q(
        "EG15",
        v,
        4,
        true,
        `Une translation envoie A,B,C sur A′,B′,C′. L’angle [angle:ABC] mesure ${deg}°. Calcule la mesure de [angle:A′B′C′].`,
        n("[angle:A′B′C′]", deg, "°"),
        [
          H("La translation conserve les mesures des angles.", visual),
          H(
            "B devient B′ : les angles correspondants ont la même mesure.",
            lines(["[angle:ABC] = [angle:A′B′C′]"]),
          ),
        ],
        `[angle:A′B′C′] = ${deg}°.`,
        { visual, audit: { deg } },
      );
    }
    let moves = r.pick([
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 0],
      ]),
      target = String.fromCharCode(65 + moves[0] + 4 * moves[1]),
      names = [0, 1, 5].map((i) => String.fromCharCode(65 + i + moves[0] + 4 * moves[1])).join(""),
      visual = tiling();
    return q(
      "EG15",
      v,
      4,
      true,
      `Dans ce pavage, la translation transforme A en ${target}. Quel est le triangle image de ABF ?`,
      [F("Trois sommets", names, "text")],
      [
        H(`Repère le déplacement de A vers ${target}.`, visual),
        H("Reproduis ce même déplacement depuis B puis depuis F.", visual),
      ],
      `ABF a pour image ${names}.`,
      {
        visual,
        check: { type: "text", values: [names], accepted: permutations(names) },
        audit: { moves, target, names },
      },
    );
  },
  EG16(r, v = 0) {
    v %= 6;
    if (v === 0) {
      let radius = r.int(1, 4),
        cw = r.bool(),
        ans = [0, cw ? -radius : radius],
        visual = plane({ O: [0, 0], A: [radius, 0] }, { axes: true });
      return q(
        "EG16",
        v,
        3,
        true,
        "" +
          "Rotation de centre O, de 90°, dans le sens " +
          (cw ? "des aiguilles" : "inverse des aiguilles") +
          " d’une montre. Donne les coordonnées de l’image de A.",
        xy(...ans),
        [
          H("La distance à O reste la même.", visual),
          H(
            `Un quart de tour ${cw ? "horaire arrive sous" : "antihoraire arrive au-dessus de"} O.`,
            lines([`Rayon : ${radius}`, `Angle : 90°`]),
          ),
        ],
        `A′(0 ; ${ans[1]}).`,
        { visual, audit: { radius, cw } },
      );
    }
    if (v === 1) {
      let sectors = r.pick([6, 8]),
        step = r.int(1, sectors - 1),
        letter = String.fromCharCode(65 + step),
        angle = (step * 360) / sectors,
        visual = rosace(sectors);
      return q(
        "EG16",
        v,
        3,
        true,
        "" +
          "Les secteurs ont le même angle au centre. Quelle rotation de centre O, dans le sens " +
          "inverse des aiguilles d’une montre et de mesure d’angle strictement comprise entre 0° " +
          "et 360°, envoie A sur " +
          letter +
          " ?",
        n("Mesure de l’angle", angle, "°"),
        [
          H(`L’angle au centre d’un secteur mesure 360°÷${sectors}.`, visual),
          H(
            `Compte ${step} secteur${step > 1 ? "s" : ""} dans le sens demandé.`,
            lines([`${step} × (360 ÷ ${sectors})`]),
          ),
        ],
        `La mesure est ${step} × ${360 / sectors}° = ${angle}°.`,
        { visual, audit: { sectors, step } },
      );
    }
    if (v === 2) {
      let k = r.pick([0.5, 2, 3]),
        len = 2 * r.int(1, 5),
        visual = numberline(0, 1, Math.max(len, len * k), null, {
          labels: [0, len],
          help: `O à 0 · A à ${len} · rapport ${fmt(k)}`,
        });
      return q(
        "EG16",
        v,
        3,
        true,
        `Une homothétie de centre O et de rapport ${fmt(k)} transforme A en A′. OA=${len} cm. Calcule OA′.`,
        n("OA′", len * k, "cm"),
        [
          H("Le rapport multiplie les distances au centre.", visual),
          H(`OA′=${fmt(k)}×OA.`, lines([`${fmt(k)} × ${len}`])),
        ],
        `OA′=${fmt(k * len)} cm.`,
        { visual, audit: { k, len } },
      );
    }
    if (v === 3) {
      let len = r.int(1, 4),
        factor = r.int(1, 3),
        visual = plane({ O: [0, 0], A: [len, 0] });
      return q(
        "EG16",
        v,
        3,
        true,
        "" +
          "A est à " +
          len +
          " cm à droite de O. Homothétie de centre O, rapport −" +
          factor +
          ". Donne la distance OA′ et le côté où se trouve A′.",
        [
          F("OA′", len * factor, "number", "cm"),
          F("Côté", "À gauche", "text", "", ["À gauche", "À droite"]),
        ],
        [
          H("Le signe moins place l’image de l’autre côté du centre.", visual),
          H(`La distance est multipliée par ${factor}.`, lines([`OA′ = ${factor} × ${len} cm`])),
        ],
        `OA′=${len * factor} cm ; A′ est à gauche de O.`,
        { visual, audit: { len, factor } },
      );
    }
    if (v === 4) {
      let len = 2 * r.int(2, 8),
        k = r.pick([-0.5, -2]),
        ans = Math.abs(k) * len;
      return q(
        "EG16",
        v,
        3,
        true,
        `Une homothétie de rapport ${fmt(k)} transforme un segment de ${len} cm. Quelle est la longueur de son image ?`,
        n("Longueur", ans, "cm"),
        [
          H(
            "Une longueur reste positive.",
            lines([`Facteur de longueur : |${fmt(k)}| = ${fmt(Math.abs(k))}`]),
          ),
          H("Multiplie la longueur par ce facteur.", bar([[len, "segment initial"]], len, " cm")),
        ],
        `${fmt(Math.abs(k))} × ${len} cm = ${fmt(ans)} cm.`,
        { audit: { len, k } },
      );
    }
    let sectors = r.pick([6, 8]),
      step = r.int(1, sectors - 1),
      letter = String.fromCharCode(65 + step),
      a = (step * 360) / sectors,
      b = 360 - a,
      visual = rosace(sectors);
    return q(
      "EG16",
      v,
      3,
      true,
      "" +
        "La rosace possède " +
        sectors +
        " secteurs de même angle au centre. Décris les deux rotations de centre commun, l’une " +
        "antihoraire et l’autre horaire, qui envoient A sur " +
        letter +
        " (mesures strictement comprises entre 0° et 360°).",
      [
        F("Centre", "O", "text", "", ["O", "A", letter]),
        F("Mesure antihoraire", a, "number", "°"),
        F("Mesure horaire", b, "number", "°"),
      ],
      [
        H(`L’angle au centre d’un secteur mesure ${360 / sectors}°. Le centre reste fixe.`, visual),
        H(
          "Les deux trajets complètent un tour de 360°.",
          lines([
            `${step} secteurs dans le sens antihoraire`,
            `Mesure horaire = 360° − mesure antihoraire`,
          ]),
        ),
      ],
      `Centre O : ${a}° antihoraire ou ${b}° horaire.`,
      { visual, audit: { sectors, step } },
    );
  },
  EG17(r, v = 0) {
    v %= 4;
    let w = r.int(2, 4),
      h = r.int(1, 3),
      visual = plane(
        { A: [-2, -1], B: [-2 + w, -1], C: [-1 + w, -1 + h], D: [-1, -1 + h] },
        {
          axes: false,
          edges: [
            ["A", "B"],
            ["B", "C"],
            ["C", "D"],
            ["D", "A"],
          ],
          arrows: [
            ["A", "B"],
            ["D", "C"],
          ],
        },
      );
    if (v === 0)
      return q(
        "EG17",
        v,
        3,
        false,
        "ABCD est un parallélogramme. Complète [vector:AB]=… .",
        choice("[vector:DC]", ["[vector:DC]", "[vector:CD]", "[vector:AD]", "[vector:BC]"]),
        [
          H("Compare direction, sens et longueur.", visual),
          H("Sur le côté opposé, la flèche de même sens part de D.", visual),
        ],
        "[vector:AB]=[vector:DC].",
        { visual, audit: { w, h } },
      );
    if (v === 1) {
      let a = r.pick(["A", "P", "M"]),
        b = r.pick(["B", "Q", "N"]);
      return q(
        "EG17",
        v,
        3,
        false,
        `Complète [vector:${a}${b}]+[vector:${b}${a}]=… .`,
        choice("[vector:0]", ["[vector:0]", `[vector:${a}${b}]`, `2[vector:${a}${b}]`]),
        [
          H("Un aller suivi du retour ramène au point de départ.", lines([`${a} → ${b} → ${a}`])),
          H(
            "Départ et arrivée identiques : déplacement nul.",
            lines([`[vector:${a}${a}] = [vector:0]`]),
          ),
        ],
        `[vector:${a}${b}]+[vector:${b}${a}]=[vector:0].`,
        { audit: { a, b } },
      );
    }
    if (v === 2) {
      let ns = r.pick(["ABC", "PQR", "MNS"]),
        a = ns[0],
        b = ns[1],
        c = ns[2],
        vv = plane(
          { [a]: [-2, -1], [b]: [w - 2, -1], [c]: [w - 2, h] },
          {
            axes: false,
            arrows: [
              [a, b],
              [b, c],
            ],
          },
        );
      return q(
        "EG17",
        v,
        3,
        false,
        `Complète [vector:${a}${b}]+[vector:${b}${c}]=… .`,
        choice(`[vector:${a}${c}]`, [
          `[vector:${a}${c}]`,
          `[vector:${c}${a}]`,
          `[vector:${a}${b}]`,
        ]),
        [
          H("Enchaîne les deux déplacements.", vv),
          H(`Le départ est ${a} et l’arrivée est ${c}.`, vv),
        ],
        `[vector:${a}${b}]+[vector:${b}${c}]=[vector:${a}${c}].`,
        { visual: vv, audit: { ns, w, h } },
      );
    }
    let dx = r.int(1, 3),
      dy = r.int(1, 3),
      vx = r.int(1, 2),
      visual2 = plane(
        { A: [-4, -2], B: [-4 + dx, -2], E: [0, -1], F: [vx, -1 + dy] },
        {
          axes: false,
          arrows: [
            ["A", "B"],
            ["E", "F"],
          ],
        },
      );
    return q(
      "EG17",
      v,
      3,
      false,
      `[vector:AB] : ${dx} carreaux à droite. [vector:EF] : ${vx} à droite et ${dy} en haut. Décris [vector:AB]+[vector:EF].`,
      [F("Carreaux à droite", dx + vx), F("Carreaux en haut", dy)],
      [
        H("Place une copie du second déplacement après le premier.", visual2),
        H(
          "Additionne séparément horizontal et vertical.",
          lines([`Droite : ${dx}+${vx}`, `Haut : 0+${dy}`]),
        ),
      ],
      `${dx + vx} à droite et ${dy} en haut.`,
      { visual: visual2, audit: { dx, dy, vx } },
    );
  },
  EG18(r, v = 0) {
    v %= 5;
    if (v < 3) {
      let base = r.int(4, 14),
        len = base / 2,
        visual = fig(
          {
            A: [0, 5],
            B: [-base / 2, 0],
            C: [base / 2, 0],
            M: [-base / 4, 2.5],
            N: [base / 4, 2.5],
          },
          [
            ["A", "B"],
            ["A", "C"],
            ["B", "C", v === 0 ? base + " cm" : ""],
            ["M", "N", v === 2 ? fmt(len) + " cm" : ""],
          ],
          {
            ticks:
              v === 1
                ? [
                    ["A", "M"],
                    ["M", "B"],
                  ]
                : [
                    ["A", "M"],
                    ["M", "B"],
                    ["A", "N", 2],
                    ["N", "C", 2],
                  ],
            note: v === 1 ? "(MN) ∥ (BC)" : "M et N sont des milieux",
          },
        );
      if (v === 1) {
        let ac = 2 * r.int(3, 8);
        return q(
          "EG18",
          v,
          4,
          false,
          `M est le milieu de [AB] et (MN) ∥ (BC). N appartient à [AC]. AC=${ac} cm. Calcule AN.`,
          n("AN", ac / 2, "cm"),
          [
            H(
              "Dans ce triangle, (MN) passe par le milieu de [AB] et est parallèle à (BC).",
              visual,
            ),
            H(
              "Le théorème des milieux donne : N est le milieu de [AC], donc AN=AC/2.",
              lines(["AN = NC = AC/2"]),
            ),
          ],
          `AN = AC/2 = ${ac / 2} cm.`,
          { visual, audit: { base, ac } },
        );
      }
      let ans = v === 0 ? len : base;
      return q(
        "EG18",
        v,
        4,
        false,
        v === 0
          ? `M et N sont les milieux de [AB] et [AC]. BC=${base} cm. Calcule MN.`
          : `M et N sont les milieux de [AB] et [AC]. MN=${fmt(len)} cm. Calcule BC.`,
        n(v === 0 ? "MN" : "BC", ans, "cm"),
        [
          H("La longueur du segment des milieux est la moitié de celle du troisième côté.", visual),
          H(
            v === 0 ? "Pour la moitié, divise par 2." : "Pour retrouver le tout, multiplie par 2.",
            bar(
              [
                [len, "MN"],
                [len, "MN"],
              ],
              base,
              " cm",
            ),
          ),
        ],
        v === 0 ? `MN = BC/2 = ${fmt(len)} cm.` : `BC = 2 × ${fmt(len)} cm = ${base} cm.`,
        { visual, audit: { base, len } },
      );
    }
    let k = r.int(1, 4),
      [u, w, h] = r.pick([
        [6, 8, 10],
        [8, 6, 10],
        [5, 12, 13],
        [12, 5, 13],
      ]),
      points = { A: [0, 0], B: [u, 0], C: [0, w], O: [u / 2, w / 2] },
      visual = fig(
        points,
        [
          ["A", "B"],
          ["A", "C"],
          ["B", "C", v === 3 ? h * k + " cm" : ""],
          ["O", "A", v === 3 ? "?" : ""],
        ],
        {
          circ: { center: [u / 2, w / 2], r: h / 2 },
          right: v === 3 ? ["B", "A", "C"] : undefined,
        },
      );
    if (v === 3)
      return q(
        "EG18",
        v,
        4,
        false,
        `ABC est rectangle en A. BC=${h * k} cm. O est le centre du cercle circonscrit. Calcule OA.`,
        n("OA", (h * k) / 2, "cm"),
        [
          H("L’hypoténuse est un diamètre du cercle.", visual),
          H("[OA] est un rayon : sa longueur OA est la moitié de BC.", lines([`OA = BC/2`])),
        ],
        `OA = ${fmt((h * k) / 2)} cm.`,
        { visual, audit: { k, u, w, h } },
      );
    return q(
      "EG18",
      v,
      4,
      false,
      "[BC] est un diamètre du cercle. A est sur le cercle, distinct de B et de C. Calcule la mesure de [angle:BAC].",
      n("[angle:BAC]", 90, "°"),
      [
        H("Vérifie les deux conditions : diamètre et point sur le cercle.", visual),
        H("L’angle opposé au diamètre est droit.", visual),
      ],
      "[angle:BAC] = 90°.",
      { visual, audit: { k, u, w, h } },
    );
  },
});
function thalesVisual(k = 0.5, { cross = false, labels = {} } = {}) {
  let pts = cross
    ? { O: [0, 0], A: [-2, 0], B: [2 / k, 0], C: [0, -3], D: [0, 3 / k] }
    : { A: [0, 0], B: [6, 0], C: [1, 6], M: [6 * k, 0], N: [k, 6 * k] };
  const edges = cross
    ? [
        ["A", "B"],
        ["C", "D"],
        ["A", "C"],
        ["B", "D"],
      ]
    : [
        ["A", "B", labels.AB],
        ["A", "C", labels.AC],
        ["B", "C", labels.BC],
        ["M", "N", labels.MN],
      ];
  return fig(pts, edges, {
    note: cross
      ? "A, O, B alignés · C, O, D alignés · (AC) ∥ (BD)"
      : "M ∈ [AB] · N ∈ [AC] · (MN) ∥ (BC)",
  });
}
const trigVisual = (a, b, { labA, labB, labH, angle = "B" } = {}) =>
  fig(
    { A: [0, 0], B: [a, 0], C: [0, b] },
    [
      ["A", "B", labA],
      ["A", "C", labB],
      ["B", "C", labH],
    ],
    { right: ["B", "A", "C"], note: `Angle étudié : [angle:${angle}]` },
  );
Object.assign(counts, { EG11: 5, EG12: 4, EG13: 4, EG14: 4 });
Object.assign(generators, {
  EG11(r, v = 0) {
    v %= 5;
    let k = r.pick([0.5, 1 / 3, 2 / 3]);
    if (v === 0) {
      let cross = r.bool(),
        visual = thalesVisual(k, { cross }),
        answer = cross ? "OB ; BD" : "AC ; BC",
        fields = cross
          ? [
              F("OA/OB = OC/□", "OD", "text", "", ["OA", "OB", "OD"]),
              F("AC/□", "BD", "text", "", ["BD", "CD", "AB"]),
            ]
          : [
              F("AM/AB = AN/□", "AC", "text", "", ["AC", "NC", "BC"]),
              F("MN/□", "BC", "text", "", ["AB", "AC", "BC"]),
            ];
      return q(
        "EG11",
        v,
        3,
        true,
        "Complète les dénominateurs des rapports, dans le même ordre des triangles.",
        fields,
        [
          H("Associe les côtés des deux triangles qui se correspondent.", visual),
          H(
            "Garde le même ordre : premier triangle / second triangle.",
            lines(cross ? ["OA ↔ OB", "OC ↔ OD", "AC ↔ BD"] : ["AM ↔ AB", "AN ↔ AC", "MN ↔ BC"]),
          ),
        ],
        cross ? "OA/OB=OC/OD=AC/BD." : "AM/AB=AN/AC=MN/BC.",
        { visual, audit: { cross, k } },
      );
    }
    if (v === 1) {
      let am = r.int(2, 5),
        mb = am,
        nc = r.int(2, 7),
        ac = 2 * nc,
        visual = thalesVisual(0.5, { labels: { AC: ac + " cm" } });
      return q(
        "EG11",
        v,
        3,
        true,
        `AM=${am} cm, MB=${mb} cm et AC=${ac} cm. (MN) ∥ (BC). Calcule AN.`,
        n("AN", nc, "cm"),
        [
          H("Le grand côté AB est la somme AM+MB.", visual),
          H(`AB = ${am + mb} cm. Donc AM/AB = 1/2.`, lines([`AN/AC = ${am}/${am + mb}`])),
        ],
        `AN = AC/2 = ${nc} cm.`,
        { visual, audit: { am, mb, ac } },
      );
    }
    if (v === 2) {
      let factor = r.int(2, 4),
        oa = r.int(1, 3),
        oc = r.int(2, 4),
        ob = oa * factor,
        od = oc * factor,
        visual = thalesVisual(1 / factor, { cross: true });
      return q(
        "EG11",
        v,
        3,
        true,
        `(AC) ∥ (BD). OA=${oa} cm, OB=${ob} cm et OC=${oc} cm. Calcule OD.`,
        n("OD", od, "cm"),
        [
          H("Les triangles correspondants sont OAC et OBD.", visual),
          H(`De OA à OB, on multiplie par ${factor}.`, lines([`OD = OC × ${factor}`])),
        ],
        `OD = ${oc} cm × ${factor} = ${od} cm.`,
        { visual, audit: { oa, ob, oc } },
      );
    }
    let am = r.int(1, 4),
      ab = 3 * am,
      an = r.int(2, 4),
      ac = v === 3 ? 3 * an : 3 * an + 1,
      visual = fig(
        { A: [0, 0], B: [ab, 0], C: [0, ac], M: [am, 0], N: [0, an] },
        [
          ["A", "B"],
          ["A", "C"],
          ["B", "C"],
          ["M", "N"],
        ],
        { note: "M ∈ [AB] · N ∈ [AC]" },
      ),
      ans = v === 3 ? "Oui" : "Non";
    return q(
      "EG11",
      v,
      3,
      true,
      `AM=${am}, AB=${ab}, AN=${an}, AC=${ac} (en cm). (MN) est-elle parallèle à (BC) ?`,
      choice(ans, ["Oui", "Non"]),
      [
        H("Les alignements sont donnés. Compare AM/AB et AN/AC.", visual),
        H(
          "Compare les produits en croix.",
          lines([`${am} × ${ac} = ${am * ac}`, `${an} × ${ab} = ${an * ab}`]),
        ),
      ],
      `${am}/${ab} ${v === 3 ? "=" : "≠"} ${an}/${ac} : ${ans === "Oui" ? "(MN) ∥ (BC)" : "(MN) n’est pas parallèle à (BC)"}.`,
      { visual, audit: { am, ab, an, ac } },
    );
  },
  EG12(r, v = 0) {
    v %= 4;
    let [a, b] = r.pick([
        [3, 4],
        [4, 3],
        [5, 12],
        [8, 6],
      ]),
      angle = r.bool() ? "B" : "C",
      adj = angle === "B" ? "AB" : "AC",
      opp = angle === "B" ? "AC" : "AB",
      visual = trigVisual(a, b, { angle });
    if (v === 0)
      return q(
        "EG12",
        v,
        3,
        true,
        `Pour l’angle [angle:${angle}], quel côté est adjacent et n’est pas l’hypoténuse ?`,
        choice(`[${adj}]`, ["[AB]", "[AC]", "[BC]"]),
        [
          H("Écarte [BC], l’hypoténuse.", visual),
          H(`Cherche le côté de l’angle droit dont ${angle} est une extrémité.`, visual),
        ],
        `Le côté adjacent à l’angle [angle:${angle}] est [${adj}], de longueur ${adj}.`,
        { visual, audit: { a, b, angle } },
      );
    let fun = ["", "cos", "sin", "tan"][v],
      num = v === 1 ? adj : opp,
      den = v === 3 ? adj : "BC",
      values = [num, den];
    return q(
      "EG12",
      v,
      3,
      true,
      `ABC est rectangle en A. Complète ${fun}([angle:${angle}]).`,
      [
        F("Numérateur", num, "text", "", ["AB", "AC", "BC"]),
        F("Dénominateur", den, "text", "", ["AB", "AC", "BC"]),
      ],
      [
        H(
          v === 1
            ? "Cosinus : divise la longueur du côté adjacent par celle de l’hypoténuse."
            : v === 2
              ? "Sinus : divise la longueur du côté opposé par celle de l’hypoténuse."
              : "Tangente : divise la longueur du côté opposé par celle du côté adjacent.",
          visual,
        ),
        H(
          `Pour [angle:${angle}] : côté adjacent [${adj}], côté opposé [${opp}], hypoténuse [BC]. Utilise leurs longueurs.`,
          lines([`Angle choisi : [angle:${angle}]`, `Longueurs : adjacent ${adj} · opposé ${opp}`]),
        ),
      ],
      `${fun}([angle:${angle}])=${num}/${den}.`,
      { visual, audit: { a, b, angle, num, den } },
    );
  },
  EG13(r, v = 0) {
    v %= 4;
    let k = r.int(1, 4),
      a,
      b,
      c,
      prompt,
      ans,
      calc;
    if (v === 0) {
      a = 5 * k;
      c = 10 * k;
      b = Math.sqrt(c * c - a * a);
      prompt = `ABC est rectangle en A. BC=${c} cm et cos([angle:B])=1/2. Calcule AB.`;
      ans = a;
      calc = `AB/BC = 1/2, donc AB = BC/2 = ${a}`;
    } else if (v === 1) {
      a = 4 * k;
      b = 3 * k;
      c = 5 * k;
      prompt = `ABC est rectangle en A. AC=${b} cm et sin([angle:B])=3/5. Calcule BC.`;
      ans = c;
      calc = `AC/BC = 3/5, donc BC = 5 × AC/3 = ${c}`;
    } else if (v === 2) {
      a = 4 * k;
      b = 3 * k;
      c = 5 * k;
      prompt = `ABC est rectangle en A. AB=${a} cm et tan([angle:B])=3/4. Calcule AC.`;
      ans = b;
      calc = `AC/AB = 3/4, donc AC = 3 × AB/4 = ${b}`;
    } else {
      a = 2 * k;
      c = 4 * k;
      b = Math.sqrt(c * c - a * a);
      prompt = `ABC est rectangle en A, AB=${a} cm et BC=${c} cm. On donne cos(60°)=1/2. Calcule la mesure de [angle:B].`;
      ans = 60;
      calc = `cos([angle:B])=${a}/${c}=1/2 ; la donnée donne [angle:B] = 60°`;
    }
    let visual = trigVisual(a, b, {
        labA: v === 0 ? "?" : v === 1 ? undefined : a + " cm",
        labB: v === 1 ? b + " cm" : v === 2 ? "?" : undefined,
        labH: v === 0 || v === 3 ? c + " cm" : v === 1 ? "?" : undefined,
      }),
      ratio =
        v === 1
          ? "sin([angle:B]) = AC/BC"
          : v === 2
            ? "tan([angle:B]) = AC/AB"
            : "cos([angle:B]) = AB/BC";
    return q(
      "EG13",
      v,
      3,
      true,
      prompt,
      n(v === 3 ? "[angle:B]" : v === 0 ? "AB" : v === 1 ? "BC" : "AC", ans, v === 3 ? "°" : "cm"),
      [
        H("Repère les deux côtés utiles pour le rapport donné.", visual),
        H(
          ratio,
          lines([
            ratio,
            v === 3
              ? `Compare ${a}/${c} à la valeur donnée.`
              : v === 0
                ? `AB = BC/2`
                : v === 1
                  ? `BC = 5 × AC/3`
                  : `AC = 3 × AB/4`,
          ]),
        ),
      ],
      calc + (v === 3 ? "." : " cm."),
      { visual, audit: { a, b, c, k } },
    );
  },
  EG14(r, v = 0) {
    v %= 4;
    let x = r.int(1, 4),
      y = r.int(1, 3);
    if (v === 0) {
      let A0 = [-x, y],
        pts = { A: A0, P: [x, y], Q: [x, -y], R: [-x, -y] },
        key = "P",
        visual = plane(pts, {
          axes: false,
          axis: [
            [0, -5],
            [0, 5],
          ],
        });
      return q(
        "EG14",
        v,
        6,
        true,
        "Quel point est l’image de A par symétrie d’axe vertical (d) ?",
        choice(key, ["P", "Q", "R"]),
        [
          H("Le segment point–image est perpendiculaire à l’axe.", visual),
          H("Reporte la même distance de l’autre côté, à la même hauteur.", visual),
        ],
        "P est à la même distance de l’autre côté de l’axe.",
        { visual, audit: { x, y, key, mode: "axial" } },
      );
    }
    if (v === 1) {
      if (x === y) x = x === 4 ? 3 : x + 1;
      let pts = { A: [x, y], P: [y, x], Q: [-x, -y], R: [x, -y] },
        visual = plane(pts, {
          axes: false,
          axis: [
            [-5, -5],
            [5, 5],
          ],
        });
      return q(
        "EG14",
        v,
        6,
        true,
        "Quel point est l’image de A par symétrie d’axe diagonal (d) ?",
        choice("P", ["P", "Q", "R"]),
        [
          H("L’axe coupe le segment point–image en son milieu.", visual),
          H("Ce segment est aussi perpendiculaire à l’axe.", visual),
        ],
        "P vérifie les deux conditions de la symétrie axiale.",
        { visual, audit: { x, y, mode: "diagonal" } },
      );
    }
    if (v === 2) {
      let pts = { O: [0, 0], A: [x, y], P: [-x, y], Q: [-x, -y], R: [x, -y] },
        visual = plane(pts, { axes: false });
      return q(
        "EG14",
        v,
        5,
        true,
        "Quel point est l’image de A par le demi-tour de centre O ?",
        choice("Q", ["P", "Q", "R"]),
        [
          H("Le centre O doit être le milieu du segment point–image.", visual),
          H("Continue sur (AO), de l’autre côté de O, sur la même distance.", visual),
        ],
        "Q est l’image de A : O est le milieu de [AQ].",
        { visual, audit: { x, y, mode: "central" } },
      );
    }
    let len = r.int(2, 12),
      visual = plane(
        { A: [-4, 1], B: [-2, 3], "A′": [4, 1], "B′": [2, 3] },
        {
          axes: false,
          axis: [
            [0, -5],
            [0, 5],
          ],
          edges: [
            ["A", "B"],
            ["A′", "B′"],
          ],
        },
      );
    return q(
      "EG14",
      v,
      5,
      true,
      `[A′B′] est l’image de [AB] par symétrie. AB=${len} cm. Calcule A′B′.`,
      n("A′B′", len, "cm"),
      [
        H("Une symétrie conserve les longueurs.", visual),
        H(
          "Le segment image a la même longueur que le segment de départ.",
          lines([`A′B′ = AB`, `AB = ${len} cm`]),
        ),
      ],
      `A′B′=${len} cm.`,
      { visual, audit: { len } },
    );
  },
});
const angleSvg = (
  deg,
  { flat = false, opposite = false, bisector = false, name = "AOB", unknown = "" } = {},
) => {
  const o = [230, 170],
    rad = (deg * Math.PI) / 180,
    p = [o[0] + 145, o[1]],
    z = [o[0] + 145 * Math.cos(rad), o[1] - 145 * Math.sin(rad)];
  let b =
    L(o, p) +
    L(o, z) +
    circle(...o, 3, C, C) +
    text(o[0] - 18, o[1] + 26, "O", 23) +
    text(p[0] + 8, p[1] + 5, "A", 23) +
    text(z[0] - 5, Math.max(18, z[1] - 12), "B", 23);
  if (flat) b += L(o, [70, 170]) + text(47, 177, "C", 23);
  if (opposite) {
    const c = [o[0] - 145, o[1]],
      d = [o[0] - 145 * Math.cos(rad), o[1] + 145 * Math.sin(rad)];
    b +=
      L(o, c) + L(o, d) + text(c[0] - 20, c[1] + 7, "C", 23) + text(d[0] - 8, d[1] + 26, "D", 23);
  }
  b +=
    "" +
    '<path d="M ' +
    (o[0] + 35) +
    " " +
    o[1] +
    " A 35 35 0 0 0 " +
    (o[0] + 35 * Math.cos(rad)) +
    " " +
    (o[1] - 35 * Math.sin(rad)) +
    '" fill="none" stroke="' +
    A +
    '" stroke-width="3"/>' +
    text(280, 140, `${deg}°`, 25, A);
  if (bisector) {
    const d = [o[0] + 145 * Math.cos(rad / 2), o[1] - 145 * Math.sin(rad / 2)];
    b += L(o, d, A) + text(d[0] + 8, d[1] - 8, "D", 23, A);
  }
  if (unknown) b += text(20, 300, unknown, 20);
  return svg(b, 460, opposite ? 370 : 330);
};
function parallels(deg = 55, mode = "alternate", other = deg) {
  const d = (deg * Math.PI) / 180,
    delta = ((other - deg) * Math.PI) / 180,
    dx = 65 / Math.tan(d),
    p = [230 + dx, 80],
    z = [230 - dx, 210];
  let b =
    line(40, 80, 420, 80) +
    line(40, 210 + (40 - z[0]) * Math.tan(delta), 420, 210 + (420 - z[0]) * Math.tan(delta)) +
    line(p[0] + dx * 0.55, 80 - 65 * 0.55, z[0] - dx * 0.55, 210 + 65 * 0.55) +
    text(42, 66, "(d)", 22) +
    text(42, 210 + (42 - z[0]) * Math.tan(delta) - 14, "(e)", 22) +
    text(355, 150, "(d) ∥ (e)", 20, A);
  const arc = (o, from, to, c) => {
    const radius = 24;
    return (
      "" +
      '<path d="M ' +
      (o[0] + radius * Math.cos(from)) +
      " " +
      (o[1] + radius * Math.sin(from)) +
      " A " +
      radius +
      " " +
      radius +
      " 0 0 1 " +
      (o[0] + radius * Math.cos(to)) +
      " " +
      (o[1] + radius * Math.sin(to)) +
      '" fill="none" stroke="' +
      c +
      '" stroke-width="2"/>'
    );
  };
  const alpha = Math.PI - d / 2,
    beta = (mode === "alternate" ? 0 : Math.PI) - d + (other * Math.PI) / 360;
  b +=
    arc(p, Math.PI - d, Math.PI, A) +
    arc(
      z,
      (mode === "alternate" ? 0 : Math.PI) - d,
      (mode === "alternate" ? 0 : Math.PI) + delta,
      C,
    ) +
    text(
      p[0] + 90 * Math.cos(alpha),
      p[1] + 90 * Math.sin(alpha) + 7,
      `α=${deg}°`,
      21,
      A,
      "middle",
    ) +
    text(z[0] + 90 * Math.cos(beta), z[1] + 90 * Math.sin(beta) + 7, "β=?", 21, C, "middle");
  return svg(b, 460, 310);
}

Object.assign(counts, { EG05: 6, EG06: 6, EG07: 4, EG10: 6 });
Object.assign(generators, {
  EG05(r, v = 0) {
    v %= 6;
    let k = r.int(1, 3);
    if (v === 0) {
      let visual = fig(
        { A: [-3, 0], B: [3, 0], M: [0, 0], D: [0, r.int(2, 4)] },
        [
          ["A", "B"],
          ["M", "D"],
        ],
        {
          right: ["A", "M", "D"],
          ticks: [
            ["A", "M"],
            ["M", "B"],
          ],
        },
      );
      return q(
        "EG05",
        v,
        6,
        true,
        "M est le milieu de [AB] et (MD) est perpendiculaire à (AB). Comment nomme-t-on (MD) pour [AB] ?",
        choice("Médiatrice", ["Médiatrice", "Médiane", "Bissectrice"]),
        [
          H("Repère le milieu et l’angle droit.", visual),
          H("La droite est perpendiculaire au segment en son milieu.", visual),
        ],
        "(MD) est la médiatrice de [AB].",
        { visual, audit: { k } },
      );
    }
    if (v === 1) {
      let visual = fig(
        { A: [-3, 0], B: [3, 0], M: [0, 0], P: [0, 4] },
        [
          ["A", "B"],
          ["M", "P"],
          ["A", "P", `${5 * k} cm`],
          ["B", "P", "?"],
        ],
        {
          right: ["A", "M", "P"],
          ticks: [
            ["A", "M"],
            ["M", "B"],
          ],
        },
      );
      return q(
        "EG05",
        v,
        6,
        true,
        `P appartient à la médiatrice de [AB]. PA=${5 * k} cm. Calcule PB.`,
        n("PB", 5 * k, "cm"),
        [
          H("P est à la même distance de A et de B.", visual),
          H("PA=PB. Utilise la longueur donnée.", lines([`PA = PB`, `PA = ${5 * k} cm`])),
        ],
        `PB=PA=${5 * k} cm.`,
        { visual, audit: { k } },
      );
    }
    if (v === 2) {
      let h = r.int(2, 5),
        visual = fig(
          { A: [-2, h], B: [0, 0], C: [4, 0], H: [-2, 0] },
          [
            ["A", "B"],
            ["B", "C"],
            ["C", "A"],
            ["A", "H"],
            ["H", "B"],
          ],
          { right: ["A", "H", "B"] },
        );
      return q(
        "EG05",
        v,
        5,
        true,
        "H appartient à (BC) et (AH) est perpendiculaire à (BC). Comment nomme-t-on (AH) dans ABC ?",
        choice("Hauteur issue de A", [
          "Hauteur issue de A",
          "Médiane issue de A",
          "Médiatrice de [BC]",
        ]),
        [
          H("La droite passe par le sommet A.", visual),
          H(
            "Elle est perpendiculaire à la droite du côté opposé, même si H est extérieur.",
            visual,
          ),
        ],
        "(AH) est la hauteur issue de A.",
        { visual, audit: { h } },
      );
    }
    if (v === 3) {
      let a = r.int(1, 2),
        visual = fig(
          { A: [a, 4], B: [0, 0], C: [6, 0], M: [3, 0] },
          [
            ["A", "B"],
            ["B", "C"],
            ["C", "A"],
            ["A", "M"],
          ],
          {
            ticks: [
              ["B", "M"],
              ["M", "C"],
            ],
          },
        );
      return q(
        "EG05",
        v,
        5,
        false,
        "M est le milieu de [BC]. Comment nomme-t-on (AM) dans ABC ?",
        choice("Médiane issue de A", [
          "Médiane issue de A",
          "Hauteur issue de A",
          "Médiatrice de [BC]",
        ]),
        [
          H("M est le milieu du côté opposé à A.", visual),
          H("Une médiane passe par un sommet et le milieu du côté opposé.", visual),
        ],
        "(AM) est la médiane issue de A.",
        { visual, audit: { a } },
      );
    }
    if (v === 4) {
      let deg = 2 * r.int(15, 70),
        half = deg / 2,
        visual = angleSvg(deg, { bisector: true, unknown: "[OD) est la bissectrice." });
      return q(
        "EG05",
        v,
        6,
        false,
        `L’angle [angle:AOB] mesure ${deg}°. [OD) est sa bissectrice. Calcule la mesure de [angle:AOD].`,
        n("[angle:AOD]", half, "°"),
        [
          H(
            "Une bissectrice partage l’angle en deux angles de même mesure.",
            bar(
              [
                [half, "?"],
                [half, "?"],
              ],
              deg,
              "°",
            ),
          ),
          H(`La somme des deux mesures est ${deg}°. Divise par 2.`, lines([`${deg}° ÷ 2`])),
        ],
        `[angle:AOD] = ${deg}° ÷ 2 = ${half}°.`,
        { visual, audit: { deg } },
      );
    }
    const radius = r.int(2, 7),
      visual = fig(
        { O: [0, 0], A: [4, 0], B: [0, 4], C: [-2.4, -3.2] },
        [
          ["O", "A", `${radius} cm`],
          ["A", "B"],
          ["B", "C"],
          ["C", "A"],
        ],
        { circ: { center: [0, 0], r: 4 } },
      );
    return q(
      "EG05",
      v,
      5,
      true,
      "" +
        "O est l’intersection des médiatrices de [AB] et [AC]. OA=" +
        radius +
        " cm. Quel est le rayon du cercle passant par A, B et C ?",
      n("Rayon", radius, "cm"),
      [
        H("La première médiatrice donne OA=OB.", visual),
        H(
          "La seconde donne OA=OC. Les rayons [OA], [OB] et [OC] ont la même longueur.",
          lines(["OA = OB = OC"]),
        ),
      ],
      `Le rayon vaut OA=${radius} cm.`,
      { visual, audit: { radius } },
    );
  },
  EG06(r, v = 0) {
    v %= 6;
    if (v === 0) {
      let vertex = r.pick(["O", "I", "S"]),
        letters = r.pick([
          ["A", "B"],
          ["C", "D"],
          ["M", "N"],
        ]),
        ans = letters[0] + vertex + letters[1],
        visual = fig({ [vertex]: [0, 0], [letters[0]]: [4, 0], [letters[1]]: [1, 3] }, [
          [vertex, letters[0]],
          [vertex, letters[1]],
        ]);
      return q(
        "EG06",
        v,
        6,
        true,
        `Nomme l’angle de sommet ${vertex}, délimité par les deux demi-droites dessinées.`,
        [F("Trois lettres", ans, "text")],
        [
          H("La lettre du sommet va au milieu.", lines([`… ${vertex} …`])),
          H("Chaque autre lettre nomme un point sur un des côtés de l’angle.", visual),
        ],
        `On peut écrire [angle:${ans}] ou [angle:${letters[1] + vertex + letters[0]}].`,
        {
          visual,
          check: { type: "text", values: [ans], accepted: [letters[1] + vertex + letters[0]] },
          audit: { vertex, letters },
        },
      );
    }
    if (v === 1) {
      let deg = r.pick([30, 45, 60, 75, 90, 105, 120, 135, 150, 180]),
        ans = deg < 90 ? "Aigu" : deg === 90 ? "Droit" : deg < 180 ? "Obtus" : "Plat",
        visual = angleSvg(deg);
      return q(
        "EG06",
        v,
        6,
        true,
        `Comment qualifie-t-on un angle de ${deg}° ?`,
        choice(ans, ["Aigu", "Droit", "Obtus", "Plat"]),
        [
          H("Compare à 90° et à 180°.", lines(["90° : angle droit", "180° : angle plat"])),
          H(
            "Aigu : mesure strictement entre 0° et 90°. Obtus : mesure strictement entre 90° et 180°.",
            visual,
          ),
        ],
        `${deg}° : angle ${ans.toLowerCase()}.`,
        { visual, audit: { deg } },
      );
    }
    if (v === 2) {
      let deg = r.int(3, 15) * 10 + 5,
        ans = 180 - deg,
        visual = angleSvg(deg, { flat: true });
      return q(
        "EG06",
        v,
        5,
        true,
        "A, O, C sont alignés dans cet ordre. Calcule la mesure de [angle:BOC].",
        n("[angle:BOC]", ans, "°"),
        [
          H(
            "Les deux angles adjacents forment un angle plat, de mesure 180°.",
            bar([
              [deg, `${deg}°`],
              [ans, "?"],
            ]),
          ),
          H(`Retire ${deg}° de 180°.`, lines([`180° − ${deg}°`])),
        ],
        `[angle:BOC] = 180° − ${deg}° = ${ans}°.`,
        { visual, audit: { deg } },
      );
    }
    if (v === 3) {
      let deg = r.int(3, 7) * 10 + 2,
        visual = angleSvg(deg, { opposite: true });
      return q(
        "EG06",
        v,
        5,
        true,
        "Les droites (AC) et (BD) se coupent en O. Calcule la mesure de [angle:COD].",
        n("[angle:COD]", deg, "°"),
        [
          H("Les deux angles sont opposés par le sommet.", visual),
          H("Des angles opposés par le sommet ont la même mesure.", visual),
        ],
        `[angle:COD] = [angle:AOB] = ${deg}°.`,
        { visual, audit: { deg } },
      );
    }
    if (v === 4) {
      let deg = r.int(4, 7) * 10 + 5,
        mode = r.bool() ? "alternate" : "corresponding",
        visual = parallels(deg, mode);
      return q(
        "EG06",
        v,
        5,
        true,
        "" +
          "(d) et (e) sont parallèles. Les angles α et β sont " +
          (mode === "alternate" ? "alternes-internes" : "correspondants") +
          ". Calcule la mesure β.",
        n("β", deg, "°"),
        [
          H("Le parallélisme est une donnée indispensable.", visual),
          H("Dans cette configuration de parallèles, les deux angles ont la même mesure.", visual),
        ],
        `β=α=${deg}°.`,
        { visual, audit: { deg, mode } },
      );
    }
    let deg = r.int(4, 7) * 10,
      other = r.bool() ? deg : deg + 5,
      ans = other === deg ? "Oui" : "Non",
      visual = parallels(deg, "alternate", other)
        .replace("(d) ∥ (e)", "?")
        .replace("β=?", `β=${other}°`);
    return q(
      "EG06",
      v,
      5,
      true,
      "α et β sont alternes-internes. Les droites (d) et (e) sont-elles parallèles ?",
      choice(ans, ["Oui", "Non"]),
      [
        H("Compare les mesures des deux angles alternes-internes.", visual),
        H(
          "Elles sont égales si et seulement si les deux droites sont parallèles.",
          lines([`${deg}° ${deg === other ? "=" : "≠"} ${other}°`]),
        ),
      ],
      "" +
        deg +
        "° " +
        (deg === other ? "=" : "≠") +
        " " +
        other +
        "° : " +
        (ans === "Oui" ? "les droites sont parallèles" : "les droites ne sont pas parallèles") +
        ".",
      { visual, audit: { deg, other } },
    );
  },
  EG07(r, v = 0) {
    v %= 4;
    let a,
      b,
      c,
      ans,
      name,
      grade = 6;
    if (v === 0) {
      a = r.int(3, 7) * 10;
      b = r.int(3, 6) * 10;
      c = 180 - a - b;
      ans = c;
      name = "C";
    } else if (v === 1) {
      a = 90;
      b = r.int(2, 7) * 10 + 2;
      c = 90 - b;
      ans = c;
      name = "C";
    } else if (v === 2) {
      a = r.int(2, 6) * 10;
      b = c = (180 - a) / 2;
      ans = b;
      name = "B";
    } else {
      b = c = r.int(3, 7) * 10 + 5;
      a = 180 - 2 * b;
      ans = a;
      name = "A";
    }
    let labels =
        v === 2
          ? { A: a + "°", B: "?", C: "?" }
          : v === 3
            ? { A: "?", B: b + "°", C: "?" }
            : { A: a + "°", B: b + "°", C: "?" },
      visual = triangleAngles(a, b, labels, { isosc: v > 1 }),
      prompt =
        v < 2
          ? `${v === 1 ? "ABC est rectangle en A. " : ""}[angle:A] = ${a}°, [angle:B] = ${b}°. Calcule la mesure de [angle:C].`
          : v === 2
            ? `ABC est isocèle en A. [angle:A] = ${a}°. Calcule la mesure de [angle:B].`
            : `ABC est isocèle en A. [angle:B] = ${b}°. Calcule la mesure de [angle:A].`,
      help = v < 2 ? `180° − ${a}° − ${b}°` : v === 2 ? `(180° − ${a}°) ÷ 2` : `180° − 2 × ${b}°`,
      parts =
        v === 2
          ? [
              [a, a + "°"],
              [b, "?"],
              [c, "?"],
            ]
          : v === 3
            ? [
                [a, "?"],
                [b, b + "°"],
                [c, b + "°"],
              ]
            : [
                [a, a + "°"],
                [b, b + "°"],
                [c, "?"],
              ];
    return q(
      "EG07",
      v,
      grade,
      true,
      prompt,
      n(`[angle:${name}]`, ans, "°"),
      [
        H(
          v > 1
            ? "Les deux angles à la base ont la même mesure."
            : "La somme des trois mesures est 180°.",
          bar(parts),
        ),
        H("Relie chaque partie du schéma au calcul.", lines([help])),
      ],
      `[angle:${name}] = ${help} = ${ans}°.`,
      { visual, courseSvg: bar(parts), audit: { a, b, c, asked: name } },
    );
  },
  EG10(r, v = 0) {
    v %= 6;
    let [a, b, c] = r.pick([
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13],
      [8, 15, 17],
    ]);
    let pts = { A: [0, 0], B: [a, 0], C: [0, b] },
      edges = [
        ["A", "B"],
        ["A", "C"],
        ["B", "C"],
      ],
      visual;
    if (v === 0) {
      let right = r.pick(["A", "B", "C"]),
        names = ["A", "B", "C"].filter((x) => x !== right),
        hyp = names.join(""),
        one = right + names[0],
        two = right + names[1],
        pp = { [right]: [0, 0], [names[0]]: [a, 0], [names[1]]: [0, b] },
        eq = `${hyp}² = ${one}² + ${two}²`;
      visual = fig(
        pp,
        [
          [right, names[0]],
          [right, names[1]],
          [names[0], names[1]],
        ],
        { right: [names[0], right, names[1]] },
      );
      return q(
        "EG10",
        v,
        4,
        true,
        `Le triangle est rectangle en ${right}. Quelle longueur a son carré seul dans l’égalité de Pythagore ?`,
        choice(hyp, ["AB", "AC", "BC"]),
        [
          H("Cherche le côté opposé à l’angle droit.", visual),
          H("Le carré de la longueur de l’hypoténuse est isolé.", lines([`${hyp}² = …² + …²`])),
        ],
        eq,
        { visual, audit: { right, hyp } },
      );
    }
    if (v === 1 || v === 2) {
      let ans = v === 1 ? c : b;
      visual = fig(
        pts,
        [
          ["A", "B", `${a} cm`],
          ["A", "C", v === 1 ? `${b} cm` : "?"],
          ["B", "C", v === 1 ? "?" : `${c} cm`],
        ],
        { right: ["B", "A", "C"] },
      );
      let calc = v === 1 ? `${a}² + ${b}²` : `${c}² − ${a}²`,
        area = v === 1 ? a * a + b * b : c * c - a * a;
      return q(
        "EG10",
        v,
        4,
        true,
        `ABC est rectangle en A. Calcule ${v === 1 ? "BC" : "AC"}.`,
        n(v === 1 ? "BC" : "AC", ans, "cm"),
        [
          H("Repère l’hypoténuse, en face de A.", visual),
          H(
            "Calcule le carré de la longueur cherchée, puis sa racine carrée positive.",
            lines([`${calc} = ${area}`, `${v === 1 ? "BC" : "AC"}² = ${area} cm²`]),
          ),
        ],
        `${v === 1 ? "BC" : "AC"}² = ${area} cm², donc ${v === 1 ? "BC" : "AC"} = ${ans} cm.`,
        {
          visual,
          courseSvg: bar(
            [
              [a * a, `${a}²`],
              [b * b, `${b}²`],
            ],
            c * c,
          ).replace("Total :", "Aires (cm²) :"),
          audit: { a, b, c },
        },
      );
    }
    if (v === 3 || v === 4) {
      if (v === 4) {
        [a, b, c] = r.pick([
          [4, 5, 6],
          [3, 4, 6],
          [5, 6, 8],
          [6, 7, 9],
        ]);
      }
      let x = (a * a + c * c - b * b) / (2 * c),
        height = Math.sqrt(a * a - x * x),
        visual = fig({ A: [0, 0], B: [c, 0], C: [x, height] }, [
          ["A", "B", `${c} cm`],
          ["A", "C", `${a} cm`],
          ["B", "C", `${b} cm`],
        ]),
        ans = a * a + b * b === c * c ? "Oui" : "Non";
      return q(
        "EG10",
        v,
        4,
        true,
        `Les côtés mesurent ${a}, ${b} et ${c} cm. Le triangle est-il rectangle ?`,
        choice(ans, ["Oui", "Non"]),
        [
          H(
            "Repère la plus grande longueur : son carré est à comparer aux deux autres carrés additionnés.",
            visual,
          ),
          H(
            `Compare ${c}² et ${a}²+${b}².`,
            lines([`${c}² = ${c * c}`, `${a}² + ${b}² = ${a * a + b * b}`]),
          ),
        ],
        "" +
          c * c +
          " " +
          (ans === "Oui" ? "=" : "≠") +
          " " +
          (a * a + b * b) +
          " : " +
          (ans === "Oui" ? "le triangle est rectangle" : "il n’est pas rectangle") +
          ".",
        { visual, audit: { a, b, c } },
      );
    }
    a = r.pick([1, 2, 4]);
    b = a + 1;
    const d = a * a + b * b;
    visual = fig(
      { A: [0, 0], B: [a, 0], C: [0, b] },
      [
        ["A", "B", `${a} cm`],
        ["A", "C", `${b} cm`],
        ["B", "C", "?"],
      ],
      { right: ["B", "A", "C"] },
    );
    return q(
      "EG10",
      v,
      4,
      true,
      "ABC est rectangle en A. Donne la longueur exacte BC avec une racine carrée.",
      [F("BC", `√${d}`, "number", "cm")],
      [
        H("Tu peux garder une racine carrée pour une valeur exacte.", visual),
        H(`BC² = ${d} cm².`, lines([`${a}² + ${b}² = ${d}`, `BC = √${d} cm`])),
      ],
      `BC=√${d} cm.`,
      {
        visual,
        check: { type: "numeric", values: [`√${d}`], exactRadicals: true },
        audit: { a, b, d },
      },
    );
  },
});

const courseCache = {};
function courseCard(f, v) {
  const key =
    f +
    ":" +
    (f === "EG03" ||
    f === "EG04" ||
    f === "EG05" ||
    f === "EG06" ||
    f === "EG07" ||
    f === "EG14" ||
    f === "EG16" ||
    f === "EG18"
      ? v
      : 0);
  if (courseCache[key]) return courseCache[key];
  let example = "",
    drawing = "",
    rule = rules[f];
  if (f === "EG01") {
    example = "De 2 à 3 : quatre intervalles. Le pas vaut 1/4. Au troisième trait : 2+3/4=2,75.";
    drawing = numberline(2, 0.25, 4, 3, { labels: [0, 4], help: "1 unité = 4 intervalles de 1/4" });
  }
  if (f === "EG02") {
    example = "A a pour abscisse −3 et pour ordonnée 2 : A(−3 ; 2).";
    drawing = plane({ A: [-3, 2] }, { proj: ["A"] });
  }
  if (f === "EG03") {
    if (v < 2) {
      example = "Le sommet opposé à O utilise les trois dimensions du pavé : G(4 ; 3 ; 2).";
      drawing = pave(4, 3, 2);
      rule = "Dans un pavé, lis les coordonnées dans l’ordre des axes x, y, z.";
    } else {
      example =
        "Q est sur le parallèle 20° N et le méridien 40° E : latitude 20° N, longitude 40° E.";
      drawing = mapGrid(20, 40);
      rule =
        "La latitude se lit au nord ou au sud de l’équateur ; la longitude à l’est ou à l’ouest du méridien de Greenwich.";
    }
  }

  if (f === "EG04") {
    if (v === 0 || v === 3) {
      example =
        "AB=AC : ABC est isocèle en A. Les codages donnent une propriété ; l’apparence seule ne suffit pas.";
      drawing = fig(
        { A: [0, 3], B: [-2, 0], C: [2, 0] },
        [
          ["A", "B"],
          ["A", "C"],
          ["B", "C"],
        ],
        {
          ticks: [
            ["A", "B"],
            ["A", "C"],
          ],
        },
      );
    } else if (v === 1) {
      example =
        "Un carré a quatre angles droits et quatre côtés de même longueur. C’est donc un " +
        "rectangle et un losange. Tout rectangle et tout losange sont des parallélogrammes.";
      drawing = fig(
        { A: [0, 0], B: [3, 0], C: [3, 3], D: [0, 3] },
        [
          ["A", "B"],
          ["B", "C"],
          ["C", "D"],
          ["D", "A"],
        ],
        {
          right: ["B", "A", "D"],
          ticks: [
            ["A", "B"],
            ["B", "C"],
            ["C", "D"],
            ["D", "A"],
          ],
          note: "ABCD est un carré",
        },
      );
    } else {
      const pts =
        v === 2
          ? { A: [-3, 0], B: [0, 2], C: [3, 0], D: [0, -2], O: [0, 0] }
          : v === 4
            ? { A: [-3, 2], B: [3, 2], C: [3, -2], D: [-3, -2], O: [0, 0] }
            : { A: [-2, 2], B: [4, 2], C: [2, -2], D: [-4, -2], O: [0, 0] };
      drawing = fig(
        pts,
        [
          ["A", "B"],
          ["B", "C"],
          ["C", "D"],
          ["D", "A"],
          ["A", "C"],
          ["B", "D"],
        ],
        {
          right: v === 2 ? ["A", "O", "B"] : undefined,
          ticks:
            v === 4
              ? [
                  ["A", "O"],
                  ["O", "C"],
                  ["B", "O"],
                  ["O", "D"],
                ]
              : [
                  ["A", "O"],
                  ["O", "C"],
                  ["B", "O", 2],
                  ["O", "D", 2],
                ],
        },
      );
      example =
        v === 2
          ? "Les diagonales ont le même milieu et sont perpendiculaires : le quadrilatère est un losange."
          : v === 4
            ? "Les diagonales ont le même milieu et la même longueur : le quadrilatère est un rectangle."
            : "Les diagonales ont le même milieu : le quadrilatère est un parallélogramme.";
    }
  }

  if (f === "EG05") {
    if (v < 2) {
      example =
        "M milieu de [AB] et (PM) perpendiculaire à (AB) : (PM) est la médiatrice. P est alors " +
        "à égale distance de A et B : PA=PB.";
      drawing = fig(
        { A: [-3, 0], B: [3, 0], M: [0, 0], P: [0, 4] },
        [
          ["A", "B"],
          ["P", "M"],
          ["P", "A"],
          ["P", "B"],
        ],
        {
          right: ["A", "M", "P"],
          ticks: [
            ["A", "M"],
            ["M", "B"],
          ],
        },
      );
    } else if (v === 2) {
      example =
        "La hauteur issue de A passe par A et est perpendiculaire à (BC). Son pied peut être à l’extérieur de [BC].";
      drawing = fig(
        { A: [-2, 3], B: [0, 0], C: [4, 0], H: [-2, 0] },
        [
          ["A", "B"],
          ["B", "C"],
          ["C", "A"],
          ["A", "H"],
          ["H", "B"],
        ],
        { right: ["A", "H", "B"] },
      );
    } else if (v === 3) {
      example =
        "M est le milieu de [BC] : la droite (AM) est la médiane issue de A. Elle n’est pas " +
        "nécessairement perpendiculaire à (BC).";
      drawing = fig(
        { A: [1, 4], B: [0, 0], C: [6, 0], M: [3, 0] },
        [
          ["A", "B"],
          ["B", "C"],
          ["C", "A"],
          ["A", "M"],
        ],
        {
          ticks: [
            ["B", "M"],
            ["M", "C"],
          ],
        },
      );
    } else if (v === 4) {
      example =
        "La bissectrice partage un angle en deux angles de même mesure. Si cet angle mesure " +
        "70°, chacun des deux angles mesure 35°.";
      drawing = angleSvg(70, { bisector: true, unknown: "70° ÷ 2 = 35°" });
    } else {
      example =
        "O appartient aux médiatrices de [AB] et [AC] : OA=OB=OC. Les segments [OA], [OB] et " +
        "[OC] sont des rayons du cercle passant par A, B et C.";
      drawing = fig(
        { O: [0, 0], A: [4, 0], B: [0, 4], C: [-2.4, -3.2] },
        [
          ["O", "A"],
          ["O", "B"],
          ["O", "C"],
        ],
        { circ: { center: [0, 0], r: 4 } },
      );
    }
  }
  if (f === "EG06") {
    if (v === 2) {
      example =
        "Deux angles forment un angle plat. Si l’un mesure 65°, l’autre mesure 180°−65°=115°.";
      drawing = bar([
        [65, "65°"],
        [115, "115°"],
      ]);
    } else if (v === 3) {
      example = "Les angles opposés par le sommet ont la même mesure : [angle:AOB] = [angle:COD].";
      drawing = angleSvg(48, { opposite: true });
    } else if (v === 4 || v === 5) {
      example =
        "Pour deux parallèles coupées par une sécante, les angles alternes-internes ont la " +
        "même mesure. Réciproquement, l’égalité de ces mesures garantit le parallélisme.";
      drawing = parallels(55);
    } else {
      example =
        "Dans [angle:AOB], O est le sommet. Un angle droit mesure 90°, un angle plat mesure 180°.";
      drawing = angleSvg(90);
    }
  }
  if (f === "EG07") {
    if (v < 2) {
      example =
        "47°+61°+72°=180°. Si deux angles mesurent 47° et 61°, le troisième mesure 180°−47°−61°=72°.";
      drawing = bar([
        [47, "47°"],
        [61, "61°"],
        [72, "72°"],
      ]);
    } else {
      example =
        v === 2
          ? "Dans un triangle isocèle, si l’angle au sommet principal mesure 46°, chaque angle à la base mesure (180°−46°)÷2=67°."
          : "Dans un triangle isocèle, si chaque angle à la base mesure 67°, l’angle au sommet principal mesure 180°−2×67°=46°.";
      drawing = bar([
        [46, "46°"],
        [67, "67°"],
        [67, "67°"],
      ]);
    }
  }
  if (f === "EG10") {
    example =
      "ABC est rectangle en A, AB = 3 cm et AC = 4 cm : BC² = (3² + 4²) cm² = 25 cm². Donc " +
      "BC = 5 cm. Les barres représentent les aires des carrés.";
    const strip = (s) => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    drawing = svg(
      strip(
        fig(
          { A: [0, 0], B: [3, 0], C: [0, 4] },
          [
            ["A", "B", "3 cm"],
            ["A", "C", "4 cm"],
            ["B", "C", "5 cm"],
          ],
          { right: ["B", "A", "C"] },
        ),
      ) +
        `<g transform="translate(0 285)">${strip(
          bar(
            [
              [9, "3² = 9"],
              [16, "4² = 16"],
            ],
            25,
          ).replace("Total :", "Aires (cm²) :"),
        )}</g>`,
      500,
      400,
    );
  }
  if (f === "EG11") {
    example =
      "M ∈ [AB], N ∈ [AC] et (MN) ∥ (BC) : AM/AB=AN/AC. Si AM/AB=1/2 et AC=8 cm, alors AN=4 cm.";
    drawing = thalesVisual(0.5, { labels: { AC: "8 cm" } });
  }
  if (f === "EG12") {
    example =
      "ABC rectangle en A : pour l’angle [angle:B], cos([angle:B])=AB/BC, " +
      "sin([angle:B])=AC/BC, tan([angle:B])=AC/AB. Pour l’angle [angle:C], les rôles des " +
      "côtés [AB] et [AC] s’échangent.";
    drawing = trigVisual(3, 4, { angle: "B" });
  }
  if (f === "EG13") {
    example =
      "Si cos([angle:B])=1/2 et BC=10 cm : AB/BC=1/2, donc AB=5 cm. Si AB était connu, on aurait BC=AB÷cos([angle:B]).";
    drawing = trigVisual(5, Math.sqrt(75), { labA: "5 cm", labH: "10 cm", angle: "B" });
  }
  if (f === "EG14") {
    if (v === 2) {
      rule =
        "Pour une symétrie centrale de centre O, O est le milieu du segment joignant un point à son image.";
      example = "O est le milieu de [AA′] : A′ est l’image de A par le demi-tour de centre O.";
      drawing = plane(
        { O: [0, 0], A: [3, 2], "A′": [-3, -2] },
        { axes: false, edges: [["A", "A′"]] },
      );
    } else if (v === 3) {
      rule = "Une symétrie axiale ou centrale conserve les longueurs.";
      example = "[A′B′] est l’image de [AB] par symétrie. Si AB=4 cm, alors A′B′=4 cm.";
      drawing = plane(
        { A: [-4, 1], B: [-2, 3], "A′": [4, 1], "B′": [2, 3] },
        {
          axes: false,
          axis: [
            [0, -5],
            [0, 5],
          ],
          edges: [
            ["A", "B"],
            ["A′", "B′"],
          ],
        },
      );
    } else {
      rule =
        "Pour un point hors de l’axe, l’axe de symétrie est la médiatrice du segment joignant ce point à son image.";
      example =
        "A et A′ sont de part et d’autre de l’axe, à la même distance. L’axe coupe [AA′] en " +
        "son milieu et est perpendiculaire à (AA′).";
      drawing =
        v === 1
          ? plane(
              { A: [3, 1], "A′": [1, 3] },
              {
                axes: false,
                axis: [
                  [-5, -5],
                  [5, 5],
                ],
                edges: [["A", "A′"]],
              },
            )
          : plane(
              { A: [-3, 2], "A′": [3, 2] },
              {
                axes: false,
                axis: [
                  [0, -5],
                  [0, 5],
                ],
                edges: [["A", "A′"]],
              },
            );
    }
  }

  if (f === "EG15") {
    example =
      "Le déplacement de A vers B est de 3 carreaux à droite et 1 en haut. Le même déplacement transforme C en D.";
    drawing = plane(
      { A: [-3, -2], B: [0, -1], C: [-1, 1], D: [2, 2] },
      {
        axes: false,
        arrows: [
          ["A", "B"],
          ["C", "D"],
        ],
      },
    );
  }
  if (f === "EG16") {
    if (v >= 2 && v <= 4) {
      example =
        "Homothétie de rapport −2 : une longueur de 3 cm devient 6 cm. L’image du point est de " +
        "l’autre côté du centre ; la longueur reste positive.";
      drawing = numberline(-6, 1, 9, 9, { labels: [0, 6, 9], help: "A′ à −6 · O à 0 · A à 3" });
    } else {
      example =
        "Dans une rosace à 8 secteurs, l’angle au centre d’un secteur mesure 45°. Pour envoyer " +
        "A sur B : centre O, 45° antihoraire ou 315° horaire.";
      drawing = rosace(8);
    }
  }
  if (f === "EG17") {
    example =
      "Dans un parallélogramme ABCD, [vector:AB]=[vector:DC]. Enchaîner A→B puis B→C donne " +
      "A→C : [vector:AB]+[vector:BC]=[vector:AC].";
    drawing = plane(
      { A: [-2, -1], B: [1, -1], C: [2, 1], D: [-1, 1] },
      {
        axes: false,
        edges: [
          ["A", "B"],
          ["B", "C"],
          ["C", "D"],
          ["D", "A"],
        ],
        arrows: [
          ["A", "B"],
          ["D", "C"],
        ],
      },
    );
  }
  if (f === "EG18") {
    if (v < 3) {
      example = "M et N milieux de [AB] et [AC] : (MN) ∥ (BC) et MN=BC/2. Si BC=10 cm, MN=5 cm.";
      drawing = fig(
        { A: [0, 4], B: [-5, 0], C: [5, 0], M: [-2.5, 2], N: [2.5, 2] },
        [
          ["A", "B"],
          ["A", "C"],
          ["B", "C", "10 cm"],
          ["M", "N", "5 cm"],
        ],
        {
          ticks: [
            ["A", "M"],
            ["M", "B"],
            ["A", "N", 2],
            ["N", "C", 2],
          ],
        },
      );
    } else {
      example =
        "ABC rectangle en A : son hypoténuse [BC] est un diamètre du cercle circonscrit. Si " +
        "BC=10 cm, le rayon [OA] a pour longueur OA = 5 cm.";
      drawing = fig(
        { A: [0, 0], B: [6, 0], C: [0, 8], O: [3, 4] },
        [
          ["A", "B"],
          ["A", "C"],
          ["B", "C", "10 cm"],
          ["O", "A", "5 cm"],
        ],
        { right: ["B", "A", "C"], circ: { center: [3, 4], r: 5 } },
      );
    }
  }
  return (courseCache[key] = { rule, example, svg: drawing, independentExample: true });
}
installExtras();
