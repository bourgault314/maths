import { mathHtml } from "../math-format.js";
import { svg, text as rawText, line, rect, circle } from "./draw.js";
import { genererBanque } from "./banque-lit.js";
// Affichage seulement : conserve les valeurs et utilise le vrai signe moins.
const display = (value) => String(value).replace(/(^|[\s(=≥≤<>:;,])-(?=\d|√|[a-z])/g, "$1−");
const text = (x, y, value, ...rest) => rawText(x, y, display(value), ...rest);
export const counts = {
  NC19: 8,
  NC20: 8,
  NC21: 7,
  NC22: 5,
  NC23: 5,
  NC24: 5,
  NC25: 5,
  NC26: 4,
  NC27: 5,
  NC28: 4,
  NC29: 6,
  NC30: 4,
  NC31: 5,
};
const X = "x",
  nz = (r) => r.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
const sub = (a, b) => `${a}${b < 0 ? " + " : " − "}${Math.abs(b)}`;
const add = (a, b) => `${a}${b < 0 ? " − " : " + "}${Math.abs(b)}`;
const frac = (a, b) => {
  if (b < 0) {
    a = -a;
    b = -b;
  }
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));
  const g = gcd(a, b);
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`;
};
const poly = (cs, letter = "x") => {
  let out = "";
  cs.map((c, i) => [c, i])
    .reverse()
    .forEach(([c, i]) => {
      if (!c) return;
      const val = Math.abs(c),
        t = i
          ? (val === 1 ? "" : val) + letter + (i === 1 ? "" : i === 2 ? "²" : `^${i}`)
          : String(val);
      out += (out ? (c < 0 ? " − " : " + ") : c < 0 ? "−" : "") + t;
    });
  return out || "0";
};
const lin = (a, b, l = "x") =>
  a === 0 ? String(b) : poly([0, a], l) + (b === 0 ? "" : b < 0 ? ` − ${-b}` : ` + ${b}`);
const bp = (a, b, l = "x") => `(${lin(a, b, l)})`;
const mono = (a, p = 1, l = "x") => poly(Array(p).fill(0).concat(a), l);
const mathLines = (ls) =>
  `<div class="math-steps">${ls.map((s) => `<p>${mathHtml(display(s))}</p>`).join("")}</div>`;
const chain = (ls) => {
  const n = ls.length,
    w = (560 - (n - 1) * 20) / n;
  return svg(
    ls
      .map(
        (s, i) =>
          rect(20 + i * (w + 20), 25, w, 65) +
          text(30 + i * (w + 20), 64, s, 20) +
          (i < n - 1 ? text(23 + (i + 1) * w + i * 20, 64, "→", 19) : ""),
      )
      .join(""),
    600,
    115,
  );
};
const grid = (rows, cols, cells = Array(rows.length * cols.length).fill("?")) =>
  svg(
    rows.map((s, i) => text(25, 105 + i * 70, s, 24)).join("") +
      cols.map((s, i) => text(190 + i * 180, 38, s, 24)).join("") +
      cells
        .map(
          (s, i) =>
            rect(135 + (i % 2) * 180, 60 + Math.floor(i / 2) * 70, 180, 70) +
            text(153 + (i % 2) * 180, 103 + Math.floor(i / 2) * 70, s, 22),
        )
        .join(""),
    600,
    85 + rows.length * 70,
  );
const parts = (n, total, extra = 0, label = "x") => {
  let body = text(20, 28, `Total : ${total}`, 21);
  const isNumeric = Number.isFinite(Number(total)) && Number(total) > 0;
  const w = isNumeric
    ? (510 * (Number(total) - extra)) / Number(total) / n
    : 510 / (n + (extra ? 1 : 0));
  const ew = isNumeric ? (510 * extra) / Number(total) : w;
  for (let i = 0; i < n; i++) body += rect(25 + i * w, 48, w, 56) + text(35 + i * w, 83, label, 22);
  if (extra) body += rect(25 + n * w, 48, ew, 56, "#f7e5bf") + text(35 + n * w, 83, extra, 22);
  return svg(body, 600, 135);
};
const numberLine = (bound, side = "left", reveal = false) => {
  const lo = bound - 4,
    hi = bound + 4,
    px = (x) => 45 + (x - lo) * 60;
  let b = line(45, 75, 540, 75) + text(548, 81, "→", 20);
  for (let x = lo; x <= hi; x++) b += line(px(x), 68, px(x), 82) + text(px(x) - 8, 108, x, 17);
  if (reveal)
    b +=
      line(
        side === "left" ? 45 : px(bound),
        75,
        side === "left" ? px(bound) : 525,
        75,
        "#b67b22",
        7,
      ) + circle(px(bound), 75, 6, "#b67b22");
  return svg(b, 600, 135);
};
const matches = (n) => {
  const side = Math.min(48, 510 / n),
    x0 = 28,
    y = 42;
  let b = "";
  for (let i = 0; i <= n; i++) b += line(x0 + i * side, y, x0 + i * side, y + side, "#986932", 4);
  for (let i = 0; i < n; i++)
    b +=
      line(x0 + i * side, y, x0 + (i + 1) * side, y, "#986932", 4) +
      line(x0 + i * side, y + side, x0 + (i + 1) * side, y + side, "#986932", 4);
  return svg(
    b + text(x0, y + side + 34, `${n} carrés alignés · côtés communs`, 19),
    600,
    side + 115,
  );
};
const dots = (n) =>
  svg(
    Array.from({ length: n * n }, (_, i) =>
      circle(85 + (i % n) * 36, 32 + Math.floor(i / n) * 32, 6),
    ).join("") + text(85, 45 + n * 32, `${n} lignes de ${n} jetons`, 20),
    600,
    n * 32 + 75,
  );
// Schémas de calcul : les expressions peuvent comporter des termes négatifs.
const arrow = (x1, y1, x2, y2, color = "#173e3a") => {
  const t = Math.atan2(y2 - y1, x2 - x1),
    d = 8;
  return (
    line(x1, y1, x2, y2, color) +
    line(x2, y2, x2 - d * Math.cos(t - 0.55), y2 - d * Math.sin(t - 0.55), color) +
    line(x2, y2, x2 - d * Math.cos(t + 0.55), y2 - d * Math.sin(t + 0.55), color)
  );
};
const machineRows = (rows) =>
  svg(
    rows
      .map(({ label, steps }, j) => {
        const y = 22 + j * 95,
          n = steps.length,
          w = (460 - (n - 1) * 26) / n;
        return (
          text(24, y + 36, label, 20) +
          steps
            .map((value, i) => {
              const x = 120 + i * (w + 26);
              return (
                rect(x, y, w, 58) +
                text(
                  x + w / 2,
                  y + 36,
                  value,
                  String(value).length > 13 ? 19 : 22,
                  "#173e3a",
                  "middle",
                ) +
                (i < n - 1 ? arrow(x + w + 3, y + 29, x + w + 23, y + 29) : "")
              );
            })
            .join("")
        );
      })
      .join(""),
    600,
    rows.length * 95 + 10,
  );
const termGroups = (groups) =>
  svg(
    groups
      .map(([label, value], i) => {
        const y = 16 + i * 65;
        return (
          text(24, y + 35, label, 22) +
          rect(170, y, 405, 54, i % 2 ? "#f7e5bf" : "#ddede6") +
          text(190, y + 35, value, 24)
        );
      })
      .join(""),
    600,
    groups.length * 65 + 20,
  );
const perimeterRect = (L, w, units = "") =>
  svg(
    line(150, 55, 450, 55, "#267c72", 5) +
      line(450, 55, 450, 165, "#b5791c", 5) +
      line(150, 165, 450, 165, "#267c72", 5) +
      line(150, 55, 150, 165, "#b5791c", 5) +
      text(300, 35, `${L}${units}`, 23, "#173e3a", "middle") +
      text(300, 202, `${L}${units}`, 23, "#173e3a", "middle") +
      text(128, 118, `${w}${units}`, 23, "#173e3a", "end") +
      text(472, 118, `${w}${units}`, 23) +
      text(300, 244, "Schéma non à l’échelle", 18, "#173e3a", "middle"),
    600,
    265,
  );
const equalityStep = (
  left,
  right,
  operation,
  nextLeft,
  nextRight,
  relation = "=",
  nextRelation = relation,
) =>
  svg(
    rect(25, 15, 250, 52) +
      rect(325, 15, 250, 52) +
      text(150, 49, left, 24, "#173e3a", "middle") +
      text(450, 49, right, 24, "#173e3a", "middle") +
      text(300, 49, relation, 25, "#173e3a", "middle") +
      arrow(150, 73, 150, 133) +
      arrow(450, 73, 450, 133) +
      text(171, 110, operation, 22) +
      text(471, 110, operation, 22) +
      rect(25, 145, 250, 52) +
      rect(325, 145, 250, 52) +
      text(150, 179, nextLeft, 24, "#173e3a", "middle") +
      text(450, 179, nextRight, 24, "#173e3a", "middle") +
      text(300, 179, nextRelation, 25, "#173e3a", "middle"),
    600,
    220,
  );
const zeroBranches = (input, left, right) =>
  svg(
    rect(60, 15, 480, 54) +
      text(300, 49, input, 23, "#173e3a", "middle") +
      arrow(255, 76, 155, 121) +
      arrow(345, 76, 445, 121) +
      rect(25, 132, 250, 56) +
      rect(325, 132, 250, 56) +
      text(150, 168, left, 23, "#173e3a", "middle") +
      text(450, 168, right, 23, "#173e3a", "middle") +
      text(300, 168, "ou", 20, "#173e3a", "middle"),
    600,
    210,
  );
const squarePaths = (positive = "u", negative = "−u", result = "u²") =>
  svg(
    rect(25, 20, 145, 54) +
      rect(25, 125, 145, 54) +
      text(97, 55, positive, 24, "#173e3a", "middle") +
      text(97, 160, negative, 24, "#173e3a", "middle") +
      arrow(180, 47, 380, 92) +
      arrow(180, 152, 380, 107) +
      text(268, 55, "carré", 20, "#173e3a", "middle") +
      text(268, 164, "carré", 20, "#173e3a", "middle") +
      rect(390, 73, 180, 56) +
      text(480, 108, result, 24, "#173e3a", "middle"),
    600,
    200,
  );
const symmetricNumbers = (a, b) =>
  svg(
    line(75, 85, 525, 85) +
      line(120, 75, 120, 95) +
      line(300, 75, 300, 95) +
      line(480, 75, 480, 95) +
      text(120, 126, a - b, 24, "#173e3a", "middle") +
      text(300, 126, a, 24, "#173e3a", "middle") +
      text(480, 126, a + b, 24, "#173e3a", "middle") +
      arrow(290, 52, 132, 52) +
      arrow(310, 52, 468, 52) +
      text(210, 36, `− ${b}`, 22, "#173e3a", "middle") +
      text(390, 36, `+ ${b}`, 22, "#173e3a", "middle"),
    600,
    150,
  );
const squareRange = () =>
  svg(
    text(25, 28, "Valeurs possibles de x²", 22) +
      line(65, 90, 540, 90) +
      arrow(300, 90, 540, 90, "#b5791c") +
      line(300, 90, 532, 90, "#b5791c", 6) +
      circle(300, 90, 6, "#b5791c") +
      text(300, 126, "0", 23, "#173e3a", "middle") +
      text(150, 67, "négatif : impossible", 19, "#173e3a", "middle") +
      text(425, 67, "positif ou nul", 19, "#173e3a", "middle"),
    600,
    150,
  );
const repeatedDots = (a, b, l) => {
  let body = "";
  for (const x of [25, 155, 310]) {
    body += rect(x, 28, 105, 56);
    for (let j = 0; j < a; j++) body += circle(x + 18 + j * 17, 56, 5);
  }
  body +=
    text(282, 62, "…", 28, "#173e3a", "middle") +
    line(25, 104, 415, 104) +
    line(25, 96, 25, 104) +
    line(415, 96, 415, 104) +
    text(220, 138, `${l} groupes de ${a}`, 23, "#173e3a", "middle") +
    text(446, 62, "+", 28, "#173e3a", "middle");
  for (let j = 0; j < b; j++) body += circle(475 + j * 23, 56, 6, "#f7e5bf");
  return svg(body + text(520, 138, `${b} fixes`, 22, "#173e3a", "middle"), 600, 165);
};
const H = (text, svg = "") => ({ text: display(text), svg });
const rules = {
  NC19: "Une lettre représente un nombre. Respecte l’ordre des opérations donné par la phrase.",
  NC20: "Regroupe seulement les termes de même nature. Garde le signe de chaque terme.",
  NC21: "Remplace chaque lettre par la valeur qui lui est donnée. Mets une valeur négative entre parenthèses.",
  NC22: "Multiplie le facteur extérieur par chacun des termes du groupe.",
  NC23: "Deux termes dans chaque groupe donnent quatre produits, puis une réduction.",
  NC24: "Factoriser transforme une somme en produit : ka + kb = k(a + b).",
  NC25: "a² − b² = (a − b)(a + b). Il faut une différence de deux carrés.",
  NC26: "(a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b².",
  NC27: "Une solution rend l’égalité vraie. Effectue la même opération des deux côtés.",
  NC28: "Réunis les termes en x d’un côté, puis isole x. Vérifie dans l’égalité de départ.",
  NC29: "Un produit nul a au moins un facteur nul. Pour x² = a : deux solutions si a > 0, une si a = 0, aucune réelle si a < 0.",
  NC30: "Diviser une inégalité par un nombre négatif inverse son sens. Par un positif, son sens ne change pas.",
  NC31: "Repère ce qui reste fixe et ce qui se répète. La règle du motif doit être précisée.",
};
function q(f, v, grade, dnb, prompt, answer, hints, solution, opts = {}) {
  const kind = opts.kind || "number";
  let fields = opts.fields || [
    {
      label: "Réponse",
      answer: String(answer),
      kind,
      unit: opts.unit || "",
      placeholder: kind === "expression" ? "Expression" : kind === "fraction" ? "" : "Ta réponse",
    },
  ];
  fields = fields.map((f) => ({
    ...f,
    label: display(f.label),
    unit: display(f.unit || ""),
    placeholder: display(f.placeholder || ""),
    ...(f.options ? { options: f.options.map(display) } : {}),
  }));
  return {
    family: f,
    variant: `${f}-V${v + 1}`,
    grade,
    dnb,
    prompt: display(prompt),
    math: display(opts.math || ""),
    fields,
    check: opts.check || {
      type: kind === "expression" ? "expression" : kind === "text" ? "text" : "numeric",
      values: [String(answer)],
      ...(opts.form ? { form: opts.form } : {}),
    },
    hints,
    solution: display(solution),
    visual: opts.visual || "",
    course: {
      rule: rules[f],
      example: display(opts.courseExample || solution),
      svg: opts.courseSvg || hints[0]?.svg || "",
    },
    tags: opts.tags || [],
    audit: opts.audit || {},
  };
}
const exprOpts = (form, audit) => ({ kind: "expression", form, audit });
export const generators = {
  NC19(r, v = 0) {
    // Les formes ajoutées par la banque (passe 1, lot B1) : banque-lit.js ; les autres, inchangées.
    if (v >= 5) return genererBanque(`NC19-${String.fromCharCode(97 + v)}`, r);
    v %= 5;
    let a = r.int(2, 5),
      b = r.int(1, 8),
      l = r.pick(["x", "n", "t"]);
    if (v === 0)
      return q(
        "NC19",
        v,
        5,
        true,
        `Écris en fonction de ${l} : le nombre ${l} multiplié par ${a}, puis augmenté de ${b}.`,
        lin(a, b, l),
        [
          H(`Prends ${a} fois le nombre.`, chain([l, `× ${a}`, `+ ${b}`])),
          H("La multiplication se fait avant l’ajout.", mathLines([`${a} × ${l} + ${b}`])),
        ],
        `${a} × ${l} + ${b} = ${lin(a, b, l)}.`,
        exprOpts(null, { a, b, l }),
      );
    if (v === 1) {
      a = r.pick([2, 3, 4]);
      return q(
        "NC19",
        v,
        5,
        true,
        `Écris ${a === 2 ? "la moitié" : a === 3 ? "le tiers" : "le quart"} de ${l}.`,
        `${l}/${a}`,
        [
          H(`Partage le nombre en ${a} parts égales.`, parts(a, l, 0, "?")),
          H("Un partage égal correspond à une division.", mathLines([`${l} ÷ ${a}`])),
        ],
        `La part s’écrit ${l}/${a}.`,
        exprOpts(null, { a, l }),
      );
    }
    if (v === 2)
      return q(
        "NC19",
        v,
        5,
        true,
        `Écris le carré de la somme de ${l} et ${b}.`,
        `${bp(1, b, l)}²`,
        [
          H("La somme entière forme un seul bloc.", chain([`${l} + ${b}`, "au carré"])),
          H("Le bloc est multiplié par lui-même.", mathLines([`${bp(1, b, l)} × ${bp(1, b, l)}`])),
        ],
        `Le carré de la somme est ${bp(1, b, l)}².`,
        exprOpts(null, { b, l }),
      );
    if (v === 3)
      return q(
        "NC19",
        v,
        5,
        true,
        `Un rectangle mesure ${l} cm sur ${b} cm. Exprime son périmètre en cm.`,
        lin(2, 2 * b, l),
        [
          H(
            "Additionne les quatre côtés ; les côtés opposés ont la même longueur.",
            perimeterRect(l, b, " cm"),
          ),
          H("Il y a deux côtés de chaque longueur.", mathLines([`2 × ${l} + 2 × ${b}`])),
        ],
        `P (en cm) = 2 × ${l} + 2 × ${b} = ${lin(2, 2 * b, l)}.`,
        {
          ...exprOpts(null, { b, l }),
          visual: svg(
            rect(100, 35, 320, 110, "#f8faf8") +
              text(235, 25, l + " cm", 22) +
              text(435, 94, b + " cm", 22) +
              text(128, 183, "Schéma non à l’échelle · x > 0".replace("x", l), 18),
            600,
            215,
          ),
        },
      );
    const next = r.bool();
    return q(
      "NC19",
      v,
      4,
      true,
      `${l} est un entier. Écris le nombre impair ${next ? "qui suit" : "qui précède"} immédiatement 2${l}.`,
      lin(2, next ? 1 : -1, l),
      [
        H(
          `Pour le nombre ${next ? "suivant" : "précédent"}, ${next ? "ajoute" : "retire"} 1.`,
          chain([`2${l}`, next ? "+ 1" : "− 1"]),
        ),
        H(`Garde le même entier ${l}.`, mathLines([`2 × ${l} ${next ? "+" : "−"} 1`])),
      ],
      `Le nombre est ${lin(2, next ? 1 : -1, l)}.`,
      exprOpts(null, { next, l }),
    );
  },
  NC20(r, v = 0) {
    // Les formes ajoutées par la banque (passe 1, lot B1) : banque-lit.js ; les autres, inchangées.
    if (v >= 6) return genererBanque(`NC20-${String.fromCharCode(97 + v)}`, r);
    v %= 6;
    let a = r.int(2, 7),
      b = r.int(1, 7),
      c = r.int(1, 7);
    if (v === 0)
      return q(
        "NC20",
        v,
        5,
        true,
        `Réduis : ${a}x + x + ${b}.`,
        lin(a + 1, b),
        [
          H(
            "x signifie 1 × x. Regroupe les termes en x.",
            termGroups([
              ["En x", `${a}x + x`],
              ["Nombre", String(b)],
            ]),
          ),
          H("Additionne les coefficients devant x.", mathLines([`(${a} + 1)x + ${b}`])),
        ],
        `${a}x + x + ${b} = ${lin(a + 1, b)}.`,
        exprOpts("reduced", { a, b }),
      );
    if (v === 1) {
      let d = r.int(1, 7);
      return q(
        "NC20",
        v,
        4,
        true,
        `Réduis : ${a}x² − ${mono(b)} + x² + ${mono(c)} − ${d}.`,
        poly([-d, c - b, a + 1]),
        [
          H(
            "Regroupe les termes en x², puis ceux en x.",
            termGroups([
              ["En x²", `${a}x² + x²`],
              ["En x", `${mono(-b)} + ${mono(c)}`],
              ["Nombre", `−${d}`],
            ]),
          ),
          H(
            "Garde le signe de chaque coefficient.",
            mathLines([`(${a} + 1)x² + (${c} − ${b})x − ${d}`]),
          ),
        ],
        `L’expression réduite est ${poly([-d, c - b, a + 1])}.`,
        exprOpts("reduced", { a, b, c, d }),
      );
    }
    if (v === 2)
      return q(
        "NC20",
        v,
        4,
        true,
        `Réduis : ${a}x − (${mono(b)} − ${c}).`,
        lin(a - b, c),
        [
          H(
            "Le moins devant le groupe multiplie chacun de ses termes par −1.",
            grid(["−1"], [mono(b), `−${c}`]),
          ),
          H(
            "Change les deux signes du groupe soustrait.",
            mathLines([`${a}x − ${mono(b)} + ${c}`]),
          ),
        ],
        `${a}x − (${mono(b)} − ${c}) = ${lin(a - b, c)}.`,
        exprOpts("reduced", { a, b, c }),
      );
    if (v === 3) {
      a = -a;
      return q(
        "NC20",
        v,
        4,
        true,
        `Simplifie : (${mono(a)}) × (${mono(b)}).`,
        mono(a * b, 2),
        [
          H(
            "Sépare les nombres et les lettres, puis multiplie ces deux produits.",
            termGroups([
              ["Nombres", `(${a}) × ${b}`],
              ["Lettres", "x × x"],
            ]),
          ),
          H("x × x est x². Calcule le coefficient.", mathLines([`(${a} × ${b}) × x²`])),
        ],
        `(${mono(a)}) × (${mono(b)}) = ${mono(a * b, 2)}.`,
        exprOpts("reduced", { a, b }),
      );
    }
    if (v === 5) {
      const k = r.int(2, 6),
        d = r.int(1, 5),
        l = r.pick(["x", "a", "t"]);
      b = -b;
      const out = lin(a - k * c, b - k * d, l);
      return q(
        "NC20",
        v,
        4,
        true,
        `Réduis : ${lin(a, b, l)} − ${k}${bp(c, d, l)}.`,
        out,
        [
          H(
            `Le facteur −${k} multiplie les deux termes du groupe. Garde ${lin(a, b, l)} à côté.`,
            grid([`−${k}`], [mono(c, 1, l), String(d)]),
          ),
          H(
            "Regroupe ensuite les termes en lettre et les nombres.",
            mathLines([`(${a} − ${k * c})${l} + (${b} − ${k * d})`]),
          ),
        ],
        `Après développement et réduction : ${out}.`,
        exprOpts("reduced", { a, b, c, d, k, l }),
      );
    }
    return q(
      "NC20",
      v,
      3,
      false,
      `Pour x ≠ 0, simplifie (${mono(a * b, 2)})/(${mono(b)}).`,
      mono(a),
      [
        H("Décompose x² en x × x.", mathLines([`(${a * b} × x × x) / (${b} × x)`, `x ≠ 0`])),
        H(
          `Le facteur ${mono(b)} est commun au numérateur et au dénominateur.`,
          mathLines([`(${a} × ${b} × x × x) / (${b} × x)`]),
        ),
      ],
      `Pour x ≠ 0, le quotient vaut ${mono(a)}.`,
      exprOpts("reduced", { a, b }),
    );
  },
  NC21(r, v = 0) {
    // Les formes ajoutées par la banque (passe 1, lot B1) : banque-lit.js ; les autres, inchangées.
    if (v >= 6) return genererBanque(`NC21-${String.fromCharCode(97 + v)}`, r);
    v %= 6;
    let a = r.int(2, 6),
      b = r.int(1, 9),
      x = r.int(0, 6);
    if (v === 0)
      return q(
        "NC21",
        v,
        5,
        true,
        `Calcule ${lin(a, b)} pour x = ${x}.`,
        a * x + b,
        [
          H(
            `Fais entrer ${x} dans la machine, puis suis les opérations.`,
            chain([String(x), `× ${a}`, `+ ${b}`]),
          ),
          H("Calcule la multiplication en premier.", mathLines([`${a} × ${x} + ${b}`])),
        ],
        `${a} × ${x} + ${b} = ${a * x + b}.`,
        { audit: { a, b, x } },
      );
    if (v === 1) {
      x = -r.int(1, 5);
      return q(
        "NC21",
        v,
        4,
        true,
        `Calcule ${b} − ${a}x pour x = ${x}.`,
        b - a * x,
        [
          H(
            "Multiplie, prends l’opposé du produit, puis ajoute le nombre.",
            machineRows([{ label: "x", steps: [String(x), `× ${a}`, "opposé", `+ ${b}`] }]),
          ),
          H("Calcule le produit, puis la soustraction.", mathLines([`${b} − (${a * x})`])),
        ],
        `${b} − ${a} × (${x}) = ${b} − (${a * x}) = ${b - a * x}.`,
        { audit: { a, b, x } },
      );
    }
    if (v === 2) {
      x = -r.int(1, 6);
      return q(
        "NC21",
        v,
        4,
        true,
        `Pour x = ${x}, calcule A = −x² et B = (−x)².`,
        0,
        [
          H(
            "Dans A : carré puis opposé. Dans B : opposé puis carré.",
            machineRows([
              { label: "A", steps: [String(x), "carré", "opposé"] },
              { label: "B", steps: [String(x), "opposé", "carré"] },
            ]),
          ),
          H(
            "Un carré est positif ou nul ; un moins extérieur reste à appliquer.",
            mathLines([`A = −${x * x}`, `B = ${-x}²`]),
          ),
        ],
        `A = −${x * x} ; B = ${x * x}.`,
        {
          fields: [
            { label: "A", kind: "number", answer: String(-x * x) },
            { label: "B", kind: "number", answer: String(x * x) },
          ],
          check: { type: "fields", values: [String(-x * x), String(x * x)] },
          audit: { x },
        },
      );
    }
    if (v === 3) {
      const c = r.int(1, 4),
        truth = r.bool(),
        d = (a - c) * x + b + (truth ? 0 : r.pick([-2, -1, 1, 2]));
      return q(
        "NC21",
        v,
        5,
        true,
        `Pour x = ${x}, l’égalité ${lin(a, b)} = ${lin(c, d)} est-elle vraie ?`,
        truth ? "Vraie" : "Fausse",
        [
          H(
            "La même valeur entre dans les deux machines. Compare leurs sorties.",
            machineRows([
              { label: "Gauche", steps: [String(x), `× ${a}`, `+ ${b}`] },
              {
                label: "Droite",
                steps: [String(x), `× ${c}`, `${d < 0 ? "−" : "+"} ${Math.abs(d)}`],
              },
            ]),
          ),
          H(
            "Compare les deux valeurs obtenues.",
            mathLines([`Gauche : ${a * x + b}`, `Droite : ${c * x + d}`]),
          ),
        ],
        `Les membres valent ${a * x + b} et ${c * x + d} : l’égalité est ${truth ? "vraie" : "fausse"} pour x = ${x}.`,
        {
          kind: "text",
          fields: [
            {
              label: "L’égalité est…",
              kind: "text",
              answer: truth ? "Vraie" : "Fausse",
              options: ["Vraie", "Fausse"],
            },
          ],
          audit: { a, b, c, d, x },
        },
      );
    }
    if (v === 5) {
      const c = r.int(1, 8);
      return q(
        "NC21",
        v,
        5,
        true,
        `Calcule A(x) = ${a}(x + ${b}) − ${c} pour x = ${x}.`,
        a * (x + b) - c,
        [
          H(
            "Commence par la somme, puis suis la machine.",
            chain([`${x} + ${b}`, `× ${a}`, `− ${c}`]),
          ),
          H(
            "Après les parenthèses, effectue le produit puis la soustraction.",
            mathLines([`A(${x}) = ${a} × (${x} + ${b}) − ${c}`]),
          ),
        ],
        `A(${x}) = ${a} × ${x + b} − ${c} = ${a * (x + b) - c}.`,
        { audit: { a, b, c, x } },
      );
    }
    const L = r.int(3, 9),
      w = r.int(1, L);
    return q(
      "NC21",
      v,
      5,
      true,
      `P = 2(L + ℓ). Calcule P pour L = ${L} cm et ℓ = ${w} cm.`,
      2 * (L + w),
      [
        H("Deux côtés mesurent L ; les deux autres mesurent ℓ.", perimeterRect(L, w, " cm")),
        H("Commence par la somme entre parenthèses.", chain([`${L} + ${w}`, "× 2"])),
      ],
      `P = 2 × (${L} + ${w}) = ${2 * (L + w)} cm.`,
      { unit: "cm", audit: { L, w } },
    );
  },
  NC22(r, v = 0) {
    v %= 5;
    let a = r.int(2, 7),
      b = r.int(1, 6),
      c = r.int(1, 5),
      factor,
      group,
      out,
      grade;
    if (v === 0) {
      factor = a;
      group = bp(1, b);
      out = lin(a, a * b);
      grade = 5;
    }
    if (v === 1) {
      factor = a;
      group = bp(1, -b);
      out = lin(a, -a * b);
      grade = 5;
    }
    if (v === 2) {
      a = -a;
      factor = a;
      group = bp(c, -b);
      out = lin(a * c, -a * b);
      grade = 4;
    }
    if (v === 3) {
      factor = a;
      group = bp(1, b);
      out = lin(a, a * b);
      grade = 5;
    }
    if (v === 4) {
      b *= r.bool() ? 1 : -1;
      factor = mono(a);
      group = bp(c, b);
      out = poly([0, a * b, a * c]);
      grade = 4;
    }
    const expression = v === 3 ? `${group} × ${factor}` : `${factor}${group}`,
      inner =
        v === 2
          ? [mono(c), String(-b)]
          : v === 4
            ? [mono(c), String(b)]
            : ["x", String(v === 1 ? -b : b)];
    return q(
      "NC22",
      v,
      grade,
      true,
      `Développe et réduis : ${expression}.`,
      out,
      [
        H(
          "Le facteur extérieur multiplie chacun des deux termes.",
          grid([String(factor)], inner, [`${factor} × ${inner[0]}`, `${factor} × (${inner[1]})`]),
        ),
        H(
          "Garde le signe de chaque terme.",
          mathLines([`${factor} × ${inner[0]} + (${factor}) × (${inner[1]})`]),
        ),
      ],
      `${expression} = ${out}.`,
      exprOpts("expanded", { a, b, c }),
    );
  },
  NC23(r, v = 0) {
    // Les formes ajoutées par la banque (passe 1, lot B1) : banque-lit.js ; les autres, inchangées.
    if (v >= 4) return genererBanque(`NC23-${String.fromCharCode(97 + v)}`, r);
    v %= 4;
    let a = 1,
      b = r.int(1, 6),
      c = 1,
      d = r.int(1, 6);
    if (v === 1) b = -b;
    if (v === 2) {
      a = r.int(2, 4);
      c = r.int(2, 4);
      d = -r.int(1, 4);
    }
    if (v === 3) {
      b = -r.int(1, 9);
      d = -b;
    }
    const input = bp(a, b) + bp(c, d),
      out = poly([b * d, a * d + b * c, a * c]);
    return q(
      "NC23",
      v,
      3,
      true,
      `Développe et réduis : ${input}.`,
      out,
      [
        H("Prépare les quatre produits.", grid([mono(a), String(b)], [mono(c), String(d)])),
        H(
          "Réunis ensuite les deux termes en x.",
          grid(
            [mono(a), String(b)],
            [mono(c), String(d)],
            [mono(a * c, 2), mono(a * d), mono(b * c), String(b * d)],
          ),
        ),
      ],
      `${input} = ${out}.`,
      exprOpts("expanded", { a, b, c, d }),
    );
  },
  NC24(r, v = 0) {
    v %= 5;
    let a = r.int(2, 6),
      b = r.int(1, 7),
      c = r.int(1, 6),
      input,
      out,
      grade,
      hs;
    if (v === 0) {
      input = lin(a * b, a * c);
      out = `${a}${bp(b, c)}`;
      grade = 5;
      hs = [
        H(
          `Cherche le facteur ${a} dans les deux termes.`,
          grid([String(a)], ["?", "?"], [`${a * b}x`, String(a * c)]),
        ),
        H("Garde dans la parenthèse ce qui reste.", mathLines([`${a} × ${mono(b)} + ${a} × ${c}`])),
      ];
    }
    if (v === 1) {
      input = poly([0, b, a]);
      out = `x${bp(a, b)}`;
      grade = 4;
      hs = [
        H(
          "Le facteur x apparaît dans les deux termes.",
          grid(["x"], ["?", "?"], [`${a}x²`, mono(b)]),
        ),
        H(
          "Les facteurs restants deviennent la somme entre parenthèses.",
          mathLines([`x × (${a}x + ${b})`]),
        ),
      ];
    }
    if (v === 2) {
      input = "x² − x";
      a = r.int(1, 5);
      input = poly([0, -a, a]);
      out = `${mono(a)}(x − 1)`;
      grade = 4;
      hs = [
        H(
          `Le second terme est ${mono(a)} multiplié par −1.`,
          grid([mono(a)], ["?", "?"], [mono(a, 2), mono(-a)]),
        ),
        H(`Mets ${mono(a)} en facteur.`, mathLines([`${mono(a)} × (x − 1)`])),
      ];
    }
    if (v === 3) {
      input = lin(-a * b, a * c);
      out = `−${a}${bp(b, -c)}`;
      grade = 4;
      hs = [
        H(
          `Cherche le facteur −${a} dans chaque terme.`,
          grid([`−${a}`], ["?", "?"], [mono(-a * b), String(a * c)]),
        ),
        H(
          "Le second facteur doit être négatif pour donner un produit positif.",
          mathLines([`(−${a}) × ${mono(b)} + (−${a}) × (−${c})`]),
        ),
      ];
    }
    if (v === 4) {
      input = `${bp(1, a)}${bp(1, b)} + ${c}${bp(1, a)}`;
      out = bp(1, a) + bp(1, b + c);
      grade = 3;
      hs = [
        H(`Le groupe ${bp(1, a)} est commun.`, grid([bp(1, a)], [bp(1, b), String(c)])),
        H("Additionne les facteurs qui restent.", mathLines([`${bp(1, a)} × (x + ${b} + ${c})`])),
      ];
    }
    return q(
      "NC24",
      v,
      grade,
      true,
      `Factorise : ${input}.`,
      out,
      hs,
      `${input} = ${out}.`,
      exprOpts("factorized", { a, b, c }),
    );
  },
  NC25(r, v = 0) {
    v %= 5;
    let a = v === 0 ? 1 : r.int(2, 5),
      b = r.int(1, 9),
      input,
      out;
    if (v < 2) {
      input = poly([-b * b, 0, a * a]);
      out = bp(a, -b) + bp(a, b);
      return q(
        "NC25",
        v,
        3,
        true,
        `Factorise : ${input}.`,
        out,
        [
          H(
            "Repère les bases des deux carrés.",
            machineRows([
              { label: "Base 1", steps: [mono(a), "carré", mono(a * a, 2)] },
              { label: "Base 2", steps: [String(b), "carré", String(b * b)] },
            ]),
          ),
          H(
            "Utilise une différence et une somme avec les mêmes bases.",
            mathLines(["a² − b² = (a − b)(a + b)", `a = ${mono(a)} ; b = ${b}`]),
          ),
        ],
        `${input} = ${out}.`,
        exprOpts("factorized", { a, b }),
      );
    }
    if (v === 2) {
      input = bp(a, -b) + bp(a, b);
      out = poly([-b * b, 0, a * a]);
      return q(
        "NC25",
        v,
        3,
        true,
        `Développe et réduis : ${input}.`,
        out,
        [
          H(
            "Les deux produits croisés sont opposés : ils s’annulent.",
            grid(
              [mono(a), `−${b}`],
              [mono(a), String(b)],
              [mono(a * a, 2), mono(a * b), mono(-a * b), String(-b * b)],
            ),
          ),
          H("Mets chacune des deux bases au carré.", mathLines([`(${mono(a)})² − ${b}²`])),
        ],
        `${input} = ${out}.`,
        exprOpts("expanded", { a, b }),
      );
    }
    if (v === 4) {
      const m = r.int(2, 8),
        k = r.int(1, 3),
        d = r.pick([2, 3, 5, 6, 7]),
        root = `${k === 1 ? "" : k}√${d}`,
        input = `(${m} + ${root})(${m} − ${root})`,
        answer = m * m - k * k * d;
      return q(
        "NC25",
        v,
        3,
        true,
        `Calcule exactement : ${input}.`,
        answer,
        [
          H(
            "Les deux produits croisés sont opposés : ils s’annulent.",
            grid(
              [String(m), root],
              [String(m), `−${root}`],
              [`${m}²`, `−${m} × ${root}`, `${m} × ${root}`, `−(${root})²`],
            ),
          ),
          H(
            "Le carré porte aussi sur le coefficient devant la racine.",
            mathLines([`(${root})² = ${k}² × ${d}`, `${m}² − ${k * k} × ${d}`]),
          ),
        ],
        `${input} = ${m * m} − ${k * k * d} = ${answer}.`,
        { audit: { m, k, d } },
      );
    }
    a = r.pick([10, 20, 30]);
    b = r.int(1, 3);
    return q(
      "NC25",
      v,
      3,
      true,
      `Calcule : ${a - b} × ${a + b}.`,
      a * a - b * b,
      [
        H(`Les deux facteurs entourent ${a} à la même distance.`, symmetricNumbers(a, b)),
        H("Utilise la différence de deux carrés.", mathLines([`${a}² − ${b}²`])),
      ],
      `${a - b} × ${a + b} = ${a}² − ${b}² = ${a * a - b * b}.`,
      { audit: { a, b } },
    );
  },
  NC26(r, v = 0) {
    v %= 4;
    let a = v === 3 ? r.int(2, 4) : 1,
      b = r.int(1, 7),
      sign = v === 1 || v === 3 ? -1 : 1;
    let out = poly([b * b, 2 * a * b * sign, a * a]),
      input = `${bp(a, sign * b)}²`;
    if (v === 2) {
      [input, out] = [out, input];
    }
    return q(
      "NC26",
      v,
      3,
      false,
      `${v === 2 ? "Factorise" : "Développe et réduis"} à l’aide d’une identité remarquable : ${input}.`,
      out,
      [
        H(
          "Le carré d’un groupe est son produit par lui-même. Les deux produits croisés sont égaux.",
          grid(
            [mono(a), String(sign * b)],
            [mono(a), String(sign * b)],
            [mono(a * a, 2), mono(a * b * sign), mono(a * b * sign), String(b * b)],
          ),
        ),
        H(
          v === 2
            ? "Vérifie que le terme du milieu est le double produit."
            : "Le dernier carré est positif ; le signe du milieu dépend du binôme.",
          mathLines([`Double produit : 2 × ${mono(a)} × ${b}`]),
        ),
      ],
      `${input} = ${out}.`,
      exprOpts(v === 2 ? "factorized" : "expanded", { a, b, sign }),
    );
  },
  NC27(r, v = 0) {
    v %= 5;
    let a = r.int(2, 7),
      b = r.int(1, 8),
      x = r.int(1, 8),
      c;
    if (v === 0) {
      c = x + b;
      return q(
        "NC27",
        v,
        5,
        true,
        `Résous : x + ${b} = ${c}.`,
        x,
        [
          H(`Retire ${b} des deux membres.`, parts(1, c, b)),
          H("Calcule la différence restante.", mathLines([`x = ${c} − ${b}`])),
        ],
        `x = ${c} − ${b} = ${x}.`,
        { audit: { b, c } },
      );
    }
    if (v === 1) {
      c = r.int(1, 9);
      return q(
        "NC27",
        v,
        5,
        true,
        `Résous : ${a}x = ${c}.`,
        frac(c, a),
        [
          H(`Il y a ${a} parts égales dans le total ${c}.`, parts(a, c)),
          H(`Divise le total par ${a}.`, mathLines([`x = ${c} ÷ ${a}`])),
        ],
        `x = ${c}/${a} = ${frac(c, a)}.`,
        { kind: "fraction", audit: { a, c } },
      );
    }
    if (v === 2) {
      const div = r.bool();
      return q(
        "NC27",
        v,
        5,
        true,
        `Résous : ${div ? "x/" + a : mono(a)} = 0.`,
        0,
        [
          H(
            `Quelle valeur de x peut donner 0 ${div ? "après division" : "après multiplication"} par ${a} ?`,
            chain(["x", `${div ? "÷" : "×"} ${a}`, "0"]),
          ),
          H("Utilise l’opération inverse.", mathLines([div ? `x = 0 × ${a}` : `x = 0 ÷ ${a}`])),
        ],
        `x = 0.`,
        { audit: { a, div } },
      );
    }
    if (v === 3) {
      a = r.bool() ? -a : a;
      b = r.bool() ? -b : b;
      x = r.int(-6, 6);
      c = a * x + b;
      return q(
        "NC27",
        v,
        4,
        true,
        `Résous : ${lin(a, b)} = ${c}.`,
        x,
        [
          H(
            `${b >= 0 ? "Retire " + b : "Ajoute " + -b} des deux côtés.`,
            equalityStep(
              lin(a, b),
              String(c),
              `${b >= 0 ? "−" : "+"} ${Math.abs(b)}`,
              mono(a),
              String(c - b),
            ),
          ),
          H(
            `Divise ensuite par ${a}.`,
            mathLines([`${mono(a)} = ${c - b}`, `x = (${c - b}) ÷ (${a})`]),
          ),
        ],
        `${mono(a)} = ${c - b}, donc x = ${x}.`,
        { audit: { a, b, c } },
      );
    }
    c = a * x + b;
    return q(
      "NC27",
      v,
      4,
      true,
      `${a} cahiers au même prix et un stylo à ${b} € coûtent ${c} €. Quel est le prix d’un cahier ?`,
      x,
      [
        H("Retire le prix du stylo du total.", parts(a, c, b, "?")),
        H(`Il reste ${c - b} € pour ${a} cahiers.`, mathLines([`(${c} − ${b}) ÷ ${a}`])),
      ],
      `(${c} − ${b}) ÷ ${a} = ${x} € par cahier.`,
      { unit: "€", audit: { a, b, c } },
    );
  },
  NC28(r, v = 0) {
    v %= 4;
    let a, c, b, d, x;
    if (v === 0) {
      c = r.int(1, 4);
      a = c + r.int(1, 4);
      x = r.int(0, 6);
      b = r.int(1, 7);
      d = (a - c) * x + b;
    }
    if (v === 1) {
      a = r.int(1, 4);
      c = a + r.int(1, 4);
      x = r.int(-5, 5);
      b = r.int(1, 9);
      d = (a - c) * x + b;
    }
    if (v === 2) {
      c = r.int(1, 3);
      a = c + r.int(2, 6);
      b = -r.int(1, 5);
      d = r.int(1, 5);
    }
    if (v === 3) {
      a = r.int(1, 4);
      c = a + r.int(1, 4);
      x = r.int(1, 8);
      b = (c - a) * x;
      d = 0;
    }
    const answer = frac(d - b, a - c),
      input = `${lin(a, b)} = ${lin(c, d)}`,
      prompt =
        v === 3
          ? "" +
            "Tarif A : " +
            a +
            " € par séance plus " +
            b +
            " € d’inscription. Tarif B : " +
            c +
            " € par séance sans inscription. Pour combien de séances les prix sont-ils égaux ?"
          : `Résous : ${input}.`;
    return q(
      "NC28",
      v,
      4,
      true,
      prompt,
      answer,
      [
        H(
          v === 3
            ? `Note x le nombre de séances. Les prix sont ${lin(a, b)} et ${mono(c)}.`
            : `Retire ${mono(c)} des deux membres.`,
          v === 3
            ? machineRows([
                { label: "Tarif A", steps: ["x", `× ${a}`, `+ ${b}`] },
                { label: "Tarif B", steps: ["x", `× ${c}`] },
              ])
            : equalityStep(lin(a, b), lin(c, d), `− ${mono(c)}`, lin(a - c, b), String(d)),
        ),
        H(
          "Regroupe les constantes, puis divise par le coefficient de x.",
          mathLines([`${mono(a - c)} = ${d} − (${b})`, `x = (${d - b}) ÷ (${a - c})`]),
        ),
      ],
      `${input} donne ${mono(a - c)} = ${d - b}, donc x = ${answer}${v === 3 ? " séances" : ""}.`,
      {
        kind: v === 2 ? "fraction" : "number",
        unit: v === 3 ? "séances" : "",
        audit: { a, b, c, d },
      },
    );
  },
  NC29(r, v = 0) {
    v %= 6;
    let a, b, input, values, hs, solution, check;
    if (v === 0) {
      a = r.int(-7, 7);
      b = r.int(-7, 7);
      if (a === b) b = a + 1;
      input = `${bp(1, -a)}${bp(1, -b)} = 0`;
      values = [String(a), String(b)];
      hs = [
        H(
          "Un seul facteur nul suffit à rendre le produit nul.",
          zeroBranches(input, `${lin(1, -a)} = 0`, `${lin(1, -b)} = 0`),
        ),
        H(
          "Résous les deux petites équations séparément.",
          mathLines([`x − (${a}) = 0`, `x − (${b}) = 0`]),
        ),
      ];
      solution = `Les solutions sont ${a} et ${b}.`;
    }
    if (v === 1) {
      a = r.int(2, 5);
      b = r.pick([1, 3, 5, 7]);
      let c = r.int(1, 6);
      input = `${bp(a, -b)}${bp(1, c)} = 0`;
      values = [frac(b, a), String(-c)];
      hs = [
        H(
          "Annule chaque facteur à son tour.",
          zeroBranches(input, `${lin(a, -b)} = 0`, `${lin(1, c)} = 0`),
        ),
        H(
          "Les deux branches se résolvent indépendamment.",
          mathLines([`${a}x = ${b}`, `x = −${c}`]),
        ),
      ];
      solution = `Les solutions sont ${frac(b, a)} et ${-c}.`;
      check = { type: "set", values };
      return q("NC29", v, 3, true, `Résous : ${input}.`, values.join(" ; "), hs, solution, {
        kind: "text",
        fields: [
          {
            label: "Toutes les solutions",
            kind: "text",
            answer: values.join(" ; "),
            placeholder: "Sépare par ;",
          },
        ],
        check,
        audit: { a, b, c },
      });
    }
    if (v === 2) {
      a = r.int(-7, 7);
      input = `${bp(1, -a)}² = 0`;
      values = [String(a)];
      hs = [
        H(
          "Le même facteur est multiplié par lui-même.",
          zeroBranches(input, `${lin(1, -a)} = 0`, `${lin(1, -a)} = 0`),
        ),
        H("Les deux branches donnent la même équation.", mathLines([`${lin(1, -a)} = 0`])),
      ];
      solution = `La seule solution distincte est ${a}.`;
    }
    if (v === 3) {
      a = r.int(1, 12);
      input = `x² = ${a * a}`;
      values = [String(-a), String(a)];
      hs = [
        H("Un nombre et son opposé ont le même carré.", squarePaths()),
        H(
          `${a}² = ${a * a}. Pense aussi à l’opposé.`,
          mathLines([`${a} × ${a} = ${a * a}`, `(−${a}) × (−${a}) = ?`]),
        ),
      ];
      solution = `Les solutions sont −${a} et ${a}.`;
    }
    if (v === 4) {
      a = r.pick([0, -1, -2, -4, -7, -9]);
      input = `x² = ${a}`;
      values = a === 0 ? ["0"] : ["Aucune solution"];
      hs = [
        H("Un carré est toujours positif ou nul.", squareRange()),
        H(
          a === 0 ? "Quel nombre a pour carré zéro ?" : "Le second membre est strictement négatif.",
          mathLines([`x² = ${a}`]),
        ),
      ];
      solution =
        a === 0
          ? "La seule solution est 0."
          : "Aucune solution réelle : un carré ne peut pas être négatif.";
      check =
        a === 0
          ? { type: "set", values }
          : { type: "text", values, accepted: ["aucune", "aucune solution réelle", "∅"] };
    }
    if (v === 5) {
      a = r.pick([2, 3, 5, 6, 7, 10]);
      input = `x² = ${a}`;
      values = [`−√${a}`, `√${a}`];
      hs = [
        H("Garde une écriture exacte avec une racine.", chain([`√${a}`, "au carré", String(a)])),
        H("Ajoute aussi l’opposé de la racine positive.", chain([`√${a}`, "son opposé"])),
      ];
      solution = `Les solutions sont −√${a} et √${a}.`;
      check = { type: "set", values, exactRadicals: true };
    }
    return q(
      "NC29",
      v,
      3,
      true,
      `Résous dans les nombres réels : ${input}.`,
      values.join(" ; "),
      hs,
      solution,
      {
        kind: "text",
        fields: [
          {
            label: "Toutes les solutions",
            kind: "text",
            answer: values.join(" ; "),
            placeholder: "Sépare par ; ou écris « aucune solution »",
          },
        ],
        check: check || { type: "set", values },
        audit: { a, b },
      },
    );
  },
  NC30(r, v = 0) {
    v %= 4;
    let a, b, k, x, ans, opts, hs;
    if (v === 0) {
      a = nz(r);
      b = r.int(-12, 12);
      x = r.int(-5, 5);
      ans = a * x >= b ? "Oui" : "Non";
      opts = ["Oui", "Non"];
      hs = [
        H(
          `Remplace x par ${x}.`,
          machineRows([{ label: "Calcul", steps: [String(x), `× (${a})`, `≥ ${b} ?`] }]),
        ),
        H("Compare les deux valeurs ; l’égalité est autorisée.", mathLines([`${a * x} ≥ ${b} ?`])),
      ];
      return q(
        "NC30",
        v,
        3,
        false,
        `${x} est-il solution de ${mono(a)} ≥ ${b} ?`,
        ans,
        hs,
        `${a} × (${x}) = ${a * x} : la réponse est ${ans.toLowerCase()}.`,
        {
          kind: "text",
          fields: [{ label: "Réponse", kind: "text", answer: ans, options: opts }],
          audit: { a, b, x },
        },
      );
    }
    if (v === 1 || v === 2) {
      a = v === 1 ? r.int(1, 6) : -r.int(1, 6);
      k = r.int(-6, 6);
      b = a * k;
      const sym = a > 0 ? "≥" : "≤";
      ans = `x ${sym} ${k}`;
      opts = [`x ≥ ${k}`, `x ≤ ${k}`, `x > ${k}`, `x < ${k}`];
      hs = [
        H(
          `Divise les deux membres par ${a}.`,
          equalityStep(mono(a), String(b), `÷ (${a})`, "x", `${b}/(${a})`, "≥", "?"),
        ),
        H(
          a < 0
            ? "Le diviseur est négatif : inverse le sens."
            : "Le diviseur est positif : garde le sens.",
          mathLines([`x ${sym} ${b} ÷ (${a})`]),
        ),
      ];
      return q(
        "NC30",
        v,
        3,
        false,
        `Résous : ${mono(a)} ≥ ${b}.`,
        ans,
        hs,
        `${ans}. La borne ${k} est incluse.`,
        {
          kind: "text",
          fields: [{ label: "Ensemble des solutions", kind: "text", answer: ans, options: opts }],
          visual: "",
          audit: { a, b, k },
          courseSvg: numberLine(k, a > 0 ? "right" : "left", true),
        },
      );
    }
    k = r.int(-5, 5);
    const left = r.bool(),
      s = left ? "≤" : "≥";
    ans = `Vers la ${left ? "gauche" : "droite"}, borne incluse`;
    opts = [
      "Vers la gauche, borne incluse",
      "Vers la droite, borne incluse",
      "Vers la gauche, borne exclue",
      "Vers la droite, borne exclue",
    ];
    return q(
      "NC30",
      v,
      3,
      false,
      `Comment représenter les solutions de x ${s} ${k} sur cette droite ?`,
      ans,
      [
        H(
          `Les nombres ${left ? "plus petits" : "plus grands"} sont à ${left ? "gauche" : "droite"}.`,
          numberLine(k),
        ),
        H("Le signe contient une égalité : la borne est incluse.", mathLines([`x ${s} ${k}`])),
      ],
      `On inclut ${k} et tous les nombres à sa ${left ? "gauche" : "droite"}.`,
      {
        kind: "text",
        fields: [{ label: "Représentation", kind: "text", answer: ans, options: opts }],
        visual: numberLine(k),
        courseSvg: numberLine(k, left ? "left" : "right", true),
        audit: { k, left },
      },
    );
  },
  NC31(r, v = 0) {
    v %= 5;
    let n = r.int(2, 7);
    if (v < 2) {
      if (v === 1) n = r.int(8, 20);
      return q(
        "NC31",
        v,
        6,
        true,
        `On aligne ${n} carrés en allumettes. Deux carrés voisins partagent un côté. Combien d’allumettes faut-il ?`,
        3 * n + 1,
        [
          H("Un nouveau carré réutilise un côté et ajoute trois allumettes.", matches(3)),
          H("Compte un bord fixe, puis trois allumettes par carré.", mathLines([`1 + 3 × ${n}`])),
        ],
        `1 + 3 × ${n} = ${3 * n + 1} allumettes.`,
        {
          visual:
            v === 0
              ? matches(n)
              : matches(3).replace(
                  "3 carrés alignés · côtés communs",
                  "Exemple : 3 carrés · côtés communs",
                ),
          audit: { n },
          tags: ["Préalgèbre", "Motif défini"],
        },
      );
    }
    if (v === 2) {
      const a = r.int(2, 5),
        b = r.int(1, 4),
        l = r.pick(["n", "k", "t"]);
      return q(
        "NC31",
        v,
        5,
        true,
        "" +
          "Un motif comporte " +
          l +
          " groupes de " +
          a +
          " jetons et " +
          b +
          " jeton" +
          (b > 1 ? "s" : "") +
          " fixe" +
          (b > 1 ? "s" : "") +
          ". Exprime le nombre total de jetons en fonction de " +
          l +
          ".",
        lin(a, b, l),
        [
          H("Sépare la partie fixe et les groupes répétés.", repeatedDots(a, b, l)),
          H(
            "Multiplie la taille d’un groupe par leur nombre, puis ajoute la partie fixe.",
            mathLines([`${a} × nombre de groupes + ${b}`]),
          ),
        ],
        `Le nombre de jetons est ${lin(a, b, l)}.`,
        { kind: "expression", audit: { a, b, l } },
      );
    }
    if (v === 3) {
      n = r.int(3, 8);
      return q(
        "NC31",
        v,
        6,
        true,
        `Au rang n, le motif contient n lignes de n jetons. Combien y a-t-il de jetons au rang ${n} ?`,
        n * n,
        [
          H(`Il y a ${n} lignes, chacune contenant ${n} jetons.`, dots(n)),
          H(
            "Multiplie le nombre de lignes par le nombre de jetons par ligne.",
            mathLines([`${n} × ${n}`]),
          ),
        ],
        `${n} × ${n} = ${n * n} jetons.`,
        { visual: dots(n), audit: { n } },
      );
    }
    const a = r.int(2, 5),
      x = r.int(1, 9),
      b = r.int(1, 5),
      total = a * x + b;
    return q(
      "NC31",
      v,
      6,
      true,
      "" +
        a +
        " sachets identiques et " +
        b +
        " billes isolées contiennent " +
        total +
        " billes en tout. Combien de billes y a-t-il dans un sachet ?",
      x,
      [
        H("Retire d’abord les billes isolées.", parts(a, total, b, "?")),
        H(
          `Il reste ${total - b} billes à partager entre ${a} sachets.`,
          mathLines([`(${total} − ${b}) ÷ ${a}`]),
        ),
      ],
      `(${total} − ${b}) ÷ ${a} = ${x} billes par sachet.`,
      { unit: "billes", audit: { a, b, total } },
    );
  },
};
