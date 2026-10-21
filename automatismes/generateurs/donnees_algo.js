import { svg, text as rawText, line, rect, circle, esc } from "./draw.js";
// Typographie d’affichage ; les formules de tableur conservent leur syntaxe.
function notation(value) {
  let s = String(value ?? ""),
    formulas = [];
  s = s.replace(/=[A-Z0-9…+*:().-]+/g, (m) =>
    /[A-Z](?:\d+|…)|(?:SOMME|MOYENNE)\(/.test(m) || /^=…\d/.test(m)
      ? "§FORMULE" + (formulas.push(m) - 1) + "§"
      : m,
  );
  s = s
    .replace(/P\(A et B\)/g, "P(A ∩ B)")
    .replace(/P\(A ou B\)/g, "P(A ∪ B)")
    .replace(/\bQ1\b/g, "Q₁")
    .replace(/\bQ3\b/g, "Q₃")
    .replace(/(\d+)er\b/g, "$1ᵉʳ")
    .replace(/(\d+)e\b/g, "$1ᵉ")
    .replace(/-(?=\d)/g, "−")
    .replace(/\*/g, "×")
    .replace(/\s*([=≠≤≥<>×÷+])\s*/g, " $1 ")
    .replace(/([\d)°xuvabcnN])\s*−\s*(?=[\d(xuvabcnN])/g, "$1 − ")
    .replace(/(\d)\.(\d)/g, "$1,$2")
    .replace(/(\d)\s*%/g, "$1\u00a0%")
    .replace(/(\d)\s*°C/g, "$1\u00a0°C")
    .replace(/(\d)\s*°(?!C)/g, "$1°")
    .replace(/(\d)\s*h\b/g, "$1\u00a0h")
    .replace(/«\s*/g, "« ")
    .replace(/\s*»/g, " »")
    .trim();
  return s.replace(/§FORMULE(\d+)§/g, (_, i) => formulas[Number(i)]);
}
const text = (x, y, t, size = 18, color = "#173e3a") => rawText(x, y, notation(t), size, color);
function polish(question) {
  return {
    ...question,
    prompt: notation(question.prompt),
    math: notation(question.math),
    solution: notation(question.solution),
    hints: question.hints.map((h) => ({ ...h, text: notation(h.text) })),
    course: {
      ...question.course,
      independentExample: true,
      rule: notation(question.course.rule),
      example: notation(question.course.example),
    },
    fields: question.fields.map((f) => ({
      ...f,
      label: notation(f.label),
      answer: notation(f.answer),
      ...(f.options ? { options: f.options.map(notation) } : {}),
    })),
  };
}
const C = { ink: "#173e3a", blue: "#287bb3", pale: "#dcecf5", green: "#d7ece2", orange: "#b96724" };
const sum = (a) => a.reduce((s, x) => s + x, 0),
  range = (n) => Array.from({ length: n }, (_, i) => i),
  frac = (a, b) => a + "/" + b,
  f = (n) => String(Number(Number(n).toFixed(8))).replace(".", ",");
const shuffle = (r, a) => {
  a = a.slice();
  for (let j = a.length - 1; j > 0; j--) {
    let k = r.int(0, j);
    [a[j], a[k]] = [a[k], a[j]];
  }
  return a;
};
function table(headers, rows, hot = []) {
  const columns = headers.length,
    w = columns >= 5 ? 400 : 440,
    widths =
      columns >= 5
        ? [100, ...Array(columns - 1).fill(300 / (columns - 1))]
        : Array(columns).fill(w / columns),
    rh = columns >= 7 ? 34 : 56;
  let b = "";
  [headers, ...rows].forEach((row, i) =>
    row.forEach((v, j) => {
      const cw = widths[j],
        x = 8 + sum(widths.slice(0, j)),
        y = 8 + i * rh,
        fill = i === 0 ? C.ink : hot.includes(i - 1) ? C.pale : "#fff";
      b += rect(x, y, cw, rh, fill);
      let s = String(v),
        size = Math.min(24, Math.max(16, ((cw - 16) / Math.max(1, s.length)) * 1.85));
      if (s.includes(" ") && s.length * size * 0.55 > cw - 18) {
        let words = s.split(" "),
          mid = Math.ceil(words.length / 2),
          parts = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")],
          fs = Math.min(
            21,
            Math.max(16, ((cw - 18) / Math.max(...parts.map((t) => t.length))) * 1.8),
          );
        b +=
          text(x + 8, y + 23, parts[0], fs, i === 0 ? "#fff" : C.ink) +
          text(x + 8, y + 46, parts[1], fs, i === 0 ? "#fff" : C.ink);
      } else b += text(x + 8, y + (rh === 34 ? 25 : 36), s, size, i === 0 ? "#fff" : C.ink);
    }),
  );
  return svg(b, w + 16, 16 + (rows.length + 1) * rh);
}
function cards(a, mark = [], ranks = true) {
  const cw = Math.min(68, 520 / a.length),
    w = Math.max(280, cw * a.length + 16);
  return svg(
    a
      .map(
        (v, i) =>
          rect(8 + i * cw, 14, cw - 4, 52, mark.includes(i) ? C.pale : "#fff") +
          text(8 + i * cw + (cw - 4) / 2 - String(v).length * 5.5, 47, v, 21) +
          (ranks ? text(8 + i * cw + (cw - 4) / 2 - 5, 92, i + 1, 15) : ""),
      )
      .join("") + (ranks ? text(8, 121, "Rang dans la liste", 17) : ""),
    w,
    ranks ? 135 : 80,
  );
}
function strip(total, part, label = "partie") {
  const width = 450;
  let b = rect(30, 40, width, 48, "#fff") + rect(30, 40, (width * part) / total, 48, C.pale);
  if (total <= 20)
    for (let i = 1; i < total; i++)
      b += line(30 + (width * i) / total, 40, 30 + (width * i) / total, 88, C.ink, 1);
  b += text(30, 25, label + " : " + part, 20) + text(30, 120, "Total : " + total, 20);
  return svg(b, 520, 145);
}
function bars(labels, values, step = 1, base = 0) {
  const high = Math.ceil(Math.max(...values) / step) * step + step,
    scale = 175 / (high - base),
    X = (i) => 75 + i * (430 / values.length),
    Y = (v) => 210 - (v - base) * scale;
  let b = text(55, 22, "Effectif", 22);
  for (let v = base; v <= high; v += step) {
    b += line(55, Y(v), 525, Y(v), "#d6e3dc", 1);
    if ((high - base) / step <= 8 || ((v - base) / step) % 2 === 0) b += text(9, Y(v) + 6, v, 22);
  }
  b += line(55, 35, 55, 210) + line(55, 210, 525, 210);
  values.forEach((v, i) => {
    const bw = Math.min(72, 280 / values.length);
    b +=
      rect(X(i), Y(v), bw, Math.max(0, (v - base) * scale), C.pale) +
      text(X(i), 238, labels[i], 22);
  });
  return svg(b, 555, 260);
}
function flow(vals, ops) {
  let w = 560,
    cw = w / vals.length,
    b = "";
  vals.forEach((v, j) => {
    const x = 5 + j * cw;
    b += rect(x, 64, cw - 45, 54, C.pale) + text(x + 10, 99, v, 23);
    if (j < vals.length - 1)
      b += line(x + cw - 43, 89, x + cw - 4, 89) + text(x + cw - 48, 43, ops[j] || "", 19);
  });
  return svg(b, w, 140);
}
function piles(vals) {
  let max = Math.max(...vals),
    mean = sum(vals) / vals.length,
    scale = 150 / max,
    w = 500,
    cw = 400 / vals.length,
    b = "";
  vals.forEach((v, i) => {
    let x = 45 + i * cw;
    b += rect(x, 190 - v * scale, 50, v * scale, C.pale) + text(x, 215, v, 20);
    for (let k = 1; k < v; k++) b += line(x, 190 - k * scale, x + 50, 190 - k * scale, "#fff", 1);
  });
  b +=
    line(25, 190 - mean * scale, 450, 190 - mean * scale, C.orange, 2) +
    text(25, 27, "Même total, parts égales", 21) +
    text(25, 252, "Ligne orange : moyenne", 21, C.orange);
  return svg(b, w, 270);
}
function balls(groups) {
  let a = [];
  groups.forEach(([label, n], j) => {
    for (let k = 0; k < n; k++) a.push([label, j]);
  });
  let colors = { B: C.pale, R: "#f5dec9", V: C.green };
  return svg(
    a
      .map(([v, j], i) => {
        let x = 32 + (i % 10) * 45,
          y = 32 + Math.floor(i / 10) * 50;
        return circle(x, y, 20, colors[v] || C.green) + text(x - 7, y + 8, v, 24);
      })
      .join(""),
    485,
    Math.ceil(a.length / 10) * 50 + 16,
  );
}
function boxes(a, domain) {
  const lo = domain?.[0] ?? Math.floor(a[0]) - 1,
    hi = domain?.[1] ?? Math.ceil(a[4]) + 1,
    X = (v) => 50 + ((v - lo) * 440) / (hi - lo);
  let b =
    line(X(a[0]), 100, X(a[4]), 100) +
    line(X(a[0]), 75, X(a[0]), 125) +
    line(X(a[4]), 75, X(a[4]), 125) +
    rect(X(a[1]), 65, X(a[3]) - X(a[1]), 70, C.pale) +
    line(X(a[2]), 65, X(a[2]), 135, C.orange, 4);
  for (let v = lo; v <= hi; v++) b += line(X(v), 170, X(v), 180) + text(X(v) - 7, 203, v, 22);
  b += line(50, 175, 490, 175);
  return svg(b, 540, 220);
}
function code(lines) {
  let b = "";
  lines.forEach((s, i) => {
    b +=
      rect(15, 12 + i * 48, 520, 42, i % 2 ? C.pale : C.green, "#80a89e") +
      text(29, 40 + i * 48, s, 25);
  });
  return svg(b, 550, 24 + lines.length * 48);
}
function wheel(n, k) {
  const cx = 140,
    cy = 140,
    R = 112;
  let b = "";
  for (let i = 0; i < n; i++) {
    let a = -Math.PI / 2 + (i * 2 * Math.PI) / n,
      z = a + (2 * Math.PI) / n;
    let p = [cx + R * Math.cos(a), cy + R * Math.sin(a)],
      t = [cx + R * Math.cos(z), cy + R * Math.sin(z)];
    b +=
      '<path d="M' +
      cx +
      " " +
      cy +
      " L" +
      p.join(" ") +
      " A" +
      R +
      " " +
      R +
      " 0 " +
      (z - a > Math.PI ? 1 : 0) +
      " 1 " +
      t.join(" ") +
      ' Z" fill="' +
      (i < k ? C.pale : "#fff") +
      '" stroke="' +
      C.ink +
      '"/>';
    let m = (a + z) / 2;
    b += text(
      cx + R * 0.71 * Math.cos(m) - 6,
      cy + R * 0.71 * Math.sin(m) + 7,
      i < k ? "B" : "R",
      24,
    );
  }
  b +=
    text(285, 100, "B : bleu", 23) +
    text(285, 145, "R : rouge", 23) +
    text(285, 195, n + " secteurs égaux", 21);
  return svg(b, 510, 280);
}

function compareBoxes(a, b) {
  const X = (v) => 70 + v * 40;
  let z = "";
  for (let v = 0; v <= 10; v++)
    z +=
      line(X(v), 35, X(v), 210, "#e1e9e5", 1) +
      line(X(v), 215, X(v), 225) +
      text(X(v) - 7, 250, v, 22);
  [a, b].forEach((d, i) => {
    let y = 70 + i * 100;
    z +=
      text(15, y + 8, i ? "B" : "A", 25) +
      line(X(d[0]), y, X(d[4]), y) +
      line(X(d[0]), y - 20, X(d[0]), y + 20) +
      line(X(d[4]), y - 20, X(d[4]), y + 20) +
      rect(X(d[1]), y - 28, X(d[3]) - X(d[1]), 56, C.pale) +
      line(X(d[2]), y - 28, X(d[2]), y + 28, C.orange, 4);
  });
  return svg(z + line(70, 220, 470, 220), 525, 275);
}
function extent(lo, hi) {
  const X = (v) => 50 + ((v - lo) * 430) / (hi - lo);
  let z = line(50, 90, 480, 90);
  for (let v = lo; v <= hi; v++)
    z += line(X(v), 83, X(v), 97) + ([lo, 0, hi].includes(v) ? text(X(v) - 8, 125, v, 23) : "");
  z +=
    circle(X(lo), 90, 5, C.blue) +
    circle(X(hi), 90, 5, C.blue) +
    line(50, 50, 480, 50, C.orange, 3) +
    line(50, 40, 50, 60, C.orange, 2) +
    line(480, 40, 480, 60, C.orange, 2) +
    text(150, 28, "Écart entre les extrêmes", 21);
  return svg(z, 535, 150);
}
const courseData = {
  DP01: {
    rule: "Repère la catégorie, l’unité et la valeur d’une graduation.",
    example: "La barre de mardi atteint 12 : 12 livres.",
    svg: bars(["Lun.", "Mar.", "Mer."], [8, 12, 6], 2),
  },
  DP02: {
    rule: "Fréquence = effectif de la catégorie ÷ effectif total.",
    example: "3 élèves sur 12 : 3/12 = 1/4 = 25 %.",
    svg: strip(12, 3, "Catégorie"),
  },
  DP03: {
    rule: "La moyenne est la valeur d’un partage égal : total ÷ nombre de valeurs.",
    example: "8 + 10 + 12 = 30 ; 30 ÷ 3 = 10.",
    svg: piles([8, 10, 12]),
  },
  DP04: {
    rule:
      "Range la série. Une médiane m vérifie : au moins la moitié des valeurs ≤ m et au " +
      "moins la moitié ≥ m. Étendue = maximum − minimum.",
    example: "1 ; 3 ; 5 ; 7 : toute valeur entre 3 et 5 est une médiane. La demi-somme vaut 4.",
    svg: cards([1, 3, 5, 7], [1, 2]),
  },
  DP05: {
    rule: "Range les N valeurs. Q1 est au rang N÷4 ; Q3 au rang 3N÷4. Si le rang n’est pas entier, prends l’entier suivant.",
    example: "Pour 8 valeurs : Q1 au rang 2 et Q3 au rang 6.",
    svg: cards([1, 2, 2, 3, 4, 5, 7, 9], [1, 5]),
  },
  DP06: {
    rule: "Issues équiprobables : P(événement) = nombre d’issues favorables ÷ nombre total d’issues.",
    example: "Chaque boule a la même chance d’être tirée. 3 bleues parmi 8 : P(bleu) = 3/8.",
    svg: balls([
      ["B", 3],
      ["R", 5],
    ]),
  },
  DP07: {
    rule: "La probabilité de l’événement contraire à A vaut 1 − P(A). « Et » demande les deux conditions ; « ou » au moins une.",
    example: "Dé équilibré : pair ou supérieur à 4 → 2, 4, 5, 6 ; probabilité 4/6.",
    svg: cards([1, 2, 3, 4, 5, 6], [1, 3, 4, 5], false),
  },
  DP08: {
    rule: "Pour une expérience à deux étapes, une issue décrit les deux résultats dans l’ordre.",
    example:
      "Deux lancers indépendants d’une pièce équilibrée : PP, PF, FP, FF sont équiprobables. P(FF) = 1/4.",
    svg: table(
      ["1er lancer", "2e : P", "2e : F"],
      [
        ["P", "PP", "PF"],
        ["F", "FP", "FF"],
      ],
    ),
  },
  PI01: {
    rule: "Exécute les opérations dans l’ordre. Les parenthèses gardent une somme groupée.",
    example: "Choisir 3, ajouter 2, multiplier par 4 : (3 + 2) × 4 = 20.",
    svg: flow([3, 5, 20], ["+2", "×4"]),
  },
  PI02: {
    rule: "Une affectation remplace la valeur mémorisée dans une variable. Le résultat d’un test détermine la branche exécutée.",
    example: "x = 3 ; x ← x + 2 : la nouvelle valeur de x est 5.",
    svg: flow([3, 5], ["+2"]),
  },
  PI03: {
    rule: "Une boucle répète des instructions. Une boucle « répéter jusqu’à » s’arrête lorsque sa condition devient vraie.",
    example: "Répéter 4 fois « avancer 5 » donne 4 × 5 = 20 pas.",
    svg: flow([0, 5, 10, 15, 20], ["+5", "+5", "+5", "+5"]),
  },
  PI04: {
    rule:
      "Une référence désigne une cellule. Une recopie relative déplace les références du " +
      "même nombre de lignes ou de colonnes.",
    example: "Recopier =A2+B2 une ligne plus bas donne =A3+B3.",
    svg: table(
      ["Ligne", "A", "B", "C"],
      [
        ["2", 3, 4, "=A2+B2"],
        ["3", 5, 6, "=A3+B3"],
      ],
    ),
  },
};
function q(id, i, grade, prompt, answer, o = {}) {
  let a = Array.isArray(answer) ? answer : [answer],
    kind = o.kind || "number",
    fields =
      o.fields ||
      a.map((v, j) => ({
        label: o.labels?.[j] || "Réponse",
        answer: String(v),
        kind,
        unit: o.unit || "",
        placeholder: "",
        ...(o.options ? { options: o.options } : {}),
      }));
  return polish({
    family: id,
    variant: id + "-V" + (i + 1),
    grade,
    dnb: o.dnb !== false,
    prompt,
    math: o.math || "",
    fields,
    check: o.check || {
      type:
        a.length > 1
          ? "fields"
          : kind === "text"
            ? "text"
            : kind === "expression"
              ? "expression"
              : "numeric",
      values: a.map(String),
    },
    hints: [
      { text: o.h1 || "Repère les données utiles.", svg: o.s1 || o.visual || "" },
      { text: o.h2 || "Écris le calcul correspondant.", svg: o.s2 || o.s1 || o.visual || "" },
    ],
    solution: o.solution || String(answer),
    visual: o.visual || "",
    course: o.course || courseData[id],
    tags: o.tags || [],
    meta: o.meta || {},
  });
}
export const counts = {
  DP01: 5,
  DP02: 5,
  DP03: 5,
  DP04: 5,
  DP05: 4,
  DP06: 6,
  DP07: 5,
  DP08: 5,
  PI01: 4,
  PI02: 5,
  PI03: 9,
  PI04: 5,
};
export const generators = {
  DP01(r, i = 0) {
    i %= 5;
    let a = r.int(2, 10),
      b = r.int(2, 10),
      c = r.int(2, 10),
      d = r.int(2, 10);
    if (i === 0)
      return q("DP01", i, 6, "Combien d’élèves de 6B sont inscrits au basket ?", c, {
        visual: table(
          ["Classe", "Basket", "Danse"],
          [
            ["6A", a, b],
            ["6B", c, d],
          ],
        ),
        h1: "Croise la ligne 6B et la colonne Basket.",
        h2: "Lis la case à leur intersection.",
        s1: table(
          ["Classe", "Basket", "Danse"],
          [
            ["6A", a, b],
            ["6B", c, d],
          ],
          [1],
        ),
        solution: c + " élèves.",
        meta: { a, b, c, d },
      });
    if (i === 1) {
      let step = r.pick([2, 5]),
        values = [a * step, b * step, c * step],
        j = r.int(0, 2),
        labels = ["Pomme", "Poire", "Orange"];
      return q(
        "DP01",
        i,
        6,
        "Le diagramme donne le nombre de fruits. Combien y a-t-il de " +
          labels[j].toLowerCase() +
          "s ?",
        values[j],
        {
          visual: bars(labels, values, step),
          h1: "Deux lignes horizontales successives sont espacées de " + step + ".",
          h2: "Pars du sommet de la barre " + labels[j] + " et lis sa hauteur sur l’axe.",
          solution: values[j] + " fruits.",
          meta: { values, j, step },
        },
      );
    }
    if (i === 2) {
      let answer = r.pick([25, 50]),
        label = answer === 25 ? "Vélo" : "Marche",
        ang = (2 * Math.PI * answer) / 100,
        cx = 140,
        cy = 130,
        R = 105;
      let visual = svg(
        '<circle cx="140" cy="130" r="105" fill="#fff" stroke="' +
          C.ink +
          '"/><path d="M140 130 L140 25 A105 105 0 0 1 ' +
          (cx + R * Math.sin(ang)) +
          " " +
          (cy - R * Math.cos(ang)) +
          ' Z" fill="' +
          C.pale +
          '" stroke="' +
          C.ink +
          '"/>' +
          text(275, 100, label + " : zone bleue", 22) +
          text(275, 150, "Autres : zone blanche", 20),
        540,
        260,
      );
      return q(
        "DP01",
        i,
        6,
        "Quelle part des déplacements représente « " + label + " » ? Donne le pourcentage.",
        answer,
        {
          unit: "%",
          visual,
          h1:
            answer === 25
              ? "La zone bleue est un quart du disque."
              : "La zone bleue est une moitié du disque.",
          h2: "Le disque entier représente 100 %. Calcule 100 ÷ " + 100 / answer + ".",
          solution: "100÷" + 100 / answer + "=" + answer + " %.",
          meta: { answer },
        },
      );
    }
    if (i === 3) {
      let hrs = [8, 10, 12, 14, 16],
        vals = hrs.map(() => r.int(5, 14) * 2),
        j = r.int(0, 4),
        X = (k) => 65 + k * 100,
        Y = (v) => 210 - v * 5,
        z = "";
      for (let v = 0; v <= 32; v += 4)
        z += line(55, Y(v), 505, Y(v), "#d6e3dc", 1) + text(10, Y(v) + 5, v, 16);
      for (let k = 0; k < 4; k++) z += line(X(k), Y(vals[k]), X(k + 1), Y(vals[k + 1]), C.blue, 3);
      vals.forEach((v, k) => {
        z += circle(X(k), Y(v), 5, C.blue) + text(X(k) - 10, 238, hrs[k] + " h", 18);
      });
      z += text(10, 25, "°C", 19);
      return q("DP01", i, 6, "Quelle température mesure-t-on à " + hrs[j] + " h ?", vals[j], {
        unit: "°C",
        visual: svg(z, 540, 260),
        h1: "Repère " + hrs[j] + " h sur l’axe horizontal.",
        h2: "Monte jusqu’au point puis lis la température à gauche.",
        solution: vals[j] + " °C.",
        meta: { vals, j },
      });
    }
    let x = r.int(3, 8) * 10,
      y = r.bool() ? 2 * x : x + 10;
    return q(
      "DP01",
      i,
      5,
      "Les barres donnent deux effectifs. « B vaut le double de A. » Vrai ou faux ?",
      y === 2 * x ? "Vrai" : "Faux",
      {
        kind: "text",
        options: ["Vrai", "Faux"],
        visual: bars(["A", "B"], [x, y], 10, x - 10),
        h1: "Attention : l’axe ne commence pas à zéro.",
        h2: "Lis les valeurs puis calcule 2×" + x + ".",
        solution: "A=" + x + ", B=" + y + " ; 2×" + x + "=" + 2 * x + ".",
        meta: { x, y },
      },
    );
  },
  DP02(r, i = 0) {
    i %= 5;
    if (i === 0) {
      let a = r.int(3, 12),
        b = r.int(3, 12),
        c = r.int(0, 12),
        N = a + b + c;
      return q(
        "DP02",
        i,
        6,
        "Parmi " +
          N +
          " élèves, " +
          a +
          " viennent à pied, " +
          b +
          " à vélo et les autres en bus. Combien viennent en bus ?",
        c,
        {
          visual: table(["À pied", "À vélo", "Bus", "Total"], [[a, b, "?", N]]),
          h1: "Les trois effectifs réunis donnent le total.",
          h2: "Retire du total les élèves à pied et à vélo.",
          s1: strip(N, a + b, "À pied ou à vélo"),
          solution: N + "−" + a + "−" + b + "=" + c + ".",
          meta: { a, b, c, N },
        },
      );
    }
    if (i === 1) {
      let N = r.pick([10, 12, 20, 24]),
        k = r.int(0, N);
      return q(
        "DP02",
        i,
        5,
        k +
          " élèves sur " +
          N +
          " pratiquent le basket. Quelle est leur fréquence ? Donne une fraction.",
        frac(k, N),
        {
          kind: "fraction",
          h1: "Au numérateur : l’effectif concerné.",
          h2: "Au dénominateur : l’effectif total.",
          s1: strip(N, k, "Basket"),
          solution: "Fréquence = " + k + "/" + N + ".",
          meta: { N, k },
        },
      );
    }
    if (i === 2) {
      let quarter = r.int(2, 10),
        N = 4 * quarter,
        t = r.pick([25, 50, 75]);
      return q(
        "DP02",
        i,
        5,
        t +
          " % des " +
          N +
          " élèves choisissent le théâtre. Combien d’élèves cela représente-t-il ?",
        (quarter * t) / 25,
        {
          h1: t + " % correspond à " + t / 25 + " quart" + (t === 25 ? "" : "s") + " du groupe.",
          h2: "Un quart du groupe : " + N + "÷4=" + quarter + ".",
          s1: strip(4, t / 25, "Quarts sélectionnés"),
          solution: N + "×" + t + "/100=" + (quarter * t) / 25 + ".",
          meta: { N, t },
        },
      );
    }
    if (i === 4) {
      let quarter = r.int(3, 12),
        N = 4 * quarter,
        k = r.int(1, 3);
      return q(
        "DP02",
        i,
        5,
        "Ce diagramme représente " +
          N +
          " élèves. B désigne les élèves du club de basket, R les autres. Combien d’élèves sont au club de basket ?",
        quarter * k,
        {
          visual: wheel(4, k).replace("B : bleu", "B : basket").replace("R : rouge", "R : autres"),
          h1: "Le diagramme est partagé en quatre quarts égaux.",
          h2: "Un quart représente " + N + "÷4=" + quarter + " élèves. Compte les quarts B.",
          s1: strip(4, k, "Quarts B"),
          solution: N + "×" + k + "/4=" + quarter * k + " élèves.",
          meta: { N, k },
        },
      );
    }
    let vals = [0, 1, 2, 3],
      eff = vals.map(() => r.int(1, 6)),
      j = r.int(0, 2);
    return q(
      "DP02",
      i,
      3,
      "Le tableau indique les livres lus. Combien d’élèves ont lu au plus " +
        j +
        " livre" +
        (j > 1 ? "s" : "") +
        " ?",
      sum(eff.slice(0, j + 1)),
      {
        dnb: false,
        visual: table(["Livres lus", ...vals], [["Effectif", ...eff]]),
        h1: "« Au plus " + j + " » comprend " + j + " et toutes les valeurs inférieures.",
        h2: "Additionne les effectifs des colonnes " + vals.slice(0, j + 1).join(", ") + ".",
        solution: eff.slice(0, j + 1).join("+") + "=" + sum(eff.slice(0, j + 1)) + ".",
        meta: { vals, eff, j },
      },
    );
  },
  DP03(r, i = 0) {
    i %= 5;
    if (i === 0) {
      let M = r.int(5, 12),
        d = r.int(1, 4),
        a = shuffle(r, r.bool() ? [M - d, M, M + d] : [M - d, M - 1, M + 1, M + d]);
      return q("DP03", i, 5, "Quelle est la moyenne des valeurs " + a.join(" ; ") + " ?", M, {
        visual: cards(a),
        s1: piles(a),
        h1: "Additionne les valeurs : tu obtiens le total à partager.",
        h2: "Partage ce total en " + a.length + " parts égales.",
        solution: a.join("+") + "=" + sum(a) + " ; " + sum(a) + "÷" + a.length + "=" + M + ".",
        meta: { a },
      });
    }
    if (i === 1) {
      let vals = [0, 1, 2],
        eff = vals.map(() => r.int(1, 4)),
        N = sum(eff),
        total = sum(vals.map((v, j) => v * eff[j]));
      return q(
        "DP03",
        i,
        4,
        "Le tableau donne le nombre de livres lus par élève. Quel est le nombre moyen de " +
          "livres lus ? Une fraction est acceptée.",
        frac(total, N),
        {
          visual: table(["Livres", ...vals], [["Effectif", ...eff]]),
          h1: "Chaque valeur compte autant de fois que son effectif.",
          h2:
            "Total de livres : " +
            vals.map((v, j) => v + "×" + eff[j]).join(" + ") +
            ". Puis divise par " +
            N +
            ".",
          solution: "Moyenne = " + total + "/" + N + ".",
          meta: { vals, eff },
        },
      );
    }
    if (i === 2) {
      let M = r.int(6, 14),
        a = M - r.int(0, 3),
        b = M + r.int(0, 3),
        c = M - r.int(0, 3),
        missing = 4 * M - a - b - c;
      return q(
        "DP03",
        i,
        4,
        "Les quatre valeurs " +
          a +
          " ; " +
          b +
          " ; " +
          c +
          " ; ? ont pour moyenne " +
          M +
          ". Quelle valeur manque ?",
        missing,
        {
          h1: "La moyenne multipliée par 4 donne le total attendu.",
          h2: "Total attendu : 4×" + M + "=" + 4 * M + ". Enlève les trois valeurs connues.",
          s1: table(["Valeurs connues", "Total attendu"], [[a + " + " + b + " + " + c, 4 * M]]),
          solution: "4×" + M + "−(" + a + "+" + b + "+" + c + ")=" + missing + ".",
          meta: { M, a, b, c },
        },
      );
    }
    if (i === 4) {
      let a = range(r.int(3, 5)).map(() => r.int(1, 15)),
        correct = "(" + a.join("+") + ")/" + a.length,
        opts = [
          correct,
          "(" + a.join("+") + ")/" + (a.length - 1),
          a.join("+"),
          "(" + a.join("+") + ")/" + (a.length + 1),
        ];
      return q(
        "DP03",
        i,
        5,
        "Quel calcul permet de déterminer la moyenne de cette série ?",
        correct,
        {
          kind: "text",
          options: shuffle(r, opts),
          visual: cards(a),
          h1: "La moyenne partage le total en parts égales.",
          h2: "Additionne toutes les valeurs, puis divise par le nombre de valeurs.",
          solution: "Moyenne = " + correct + ".",
          meta: { a },
        },
      );
    }
    let n1 = r.int(1, 3),
      n2 = r.int(4, 6),
      m1 = r.int(5, 10),
      m2 = r.int(11, 16),
      total = n1 * m1 + n2 * m2,
      N = n1 + n2;
    return q(
      "DP03",
      i,
      4,
      "Quelle est la moyenne de l’ensemble des deux groupes ? Une fraction est acceptée.",
      frac(total, N),
      {
        visual: table(
          ["Groupe", "Effectif", "Moyenne"],
          [
            ["A", n1, m1],
            ["B", n2, m2],
          ],
        ),
        h1: "Les groupes n’ont pas le même effectif : reconstitue leurs totaux.",
        h2:
          "Total A : " +
          n1 +
          "×" +
          m1 +
          ". Total B : " +
          n2 +
          "×" +
          m2 +
          ". Additionne ces totaux, puis divise par " +
          N +
          ".",
        solution:
          "(" +
          n1 +
          "×" +
          m1 +
          "+" +
          n2 +
          "×" +
          m2 +
          ")/(" +
          n1 +
          "+" +
          n2 +
          ")=" +
          total +
          "/" +
          N +
          ".",
        meta: { n1, n2, m1, m2 },
      },
    );
  },
  DP04(r, i = 0) {
    i %= 5;
    if (i === 0) {
      let n = r.pick([5, 7]),
        a = range(n).map(() => r.int(-10, 15)),
        s = a.slice().sort((x, y) => x - y),
        mid = (n - 1) / 2;
      return q("DP04", i, 4, "Donne la médiane de cette série : " + a.join(" ; ") + ".", s[mid], {
        h1: "Range les valeurs dans l’ordre croissant.",
        h2: "Avec " + n + " valeurs, la valeur centrale est au rang " + (mid + 1) + ".",
        s1: cards(s, [mid]),
        solution: "Série rangée : " + s.join(" ; ") + ". Médiane : " + s[mid] + ".",
        meta: { a },
      });
    }
    if (i === 1) {
      let a = r.int(0, 4),
        b = a + r.int(1, 4),
        c = b + r.int(1, 5),
        d = c + r.int(1, 4),
        values = [a, b, c, d];
      return q(
        "DP04",
        i,
        4,
        "Donne une médiane de la série " +
          values.join(" ; ") +
          ". Plusieurs réponses sont possibles.",
        (b + c) / 2,
        {
          check: { type: "property", rule: "range", min: b, max: c },
          h1: "La série est déjà rangée. Repère les deux valeurs centrales.",
          h2: "Une valeur entre " + b + " et " + c + ", bornes comprises, convient.",
          s1: cards(values, [1, 2]),
          solution:
            "Toute valeur de " +
            b +
            " à " +
            c +
            " convient. La demi-somme est " +
            f((b + c) / 2) +
            ".",
          meta: { a: values },
        },
      );
    }
    if (i === 2) {
      let vals = [0, 1, 2, 3],
        eff = vals.map(() => r.int(1, 4)),
        a = vals.flatMap((v, j) => Array(eff[j]).fill(v)),
        lo = a[Math.floor((a.length - 1) / 2)],
        hi = a[Math.floor(a.length / 2)];
      return q(
        "DP04",
        i,
        4,
        "Donne une médiane du nombre de livres lus. Plusieurs réponses sont parfois possibles.",
        (lo + hi) / 2,
        {
          visual: table(["Livres", ...vals], [["Effectif", ...eff]]),
          check: { type: "property", rule: "range", min: lo, max: hi },
          h1: "Il y a " + a.length + " valeurs, en comptant les répétitions.",
          h2:
            "Repère les rangs " +
            Math.floor((a.length + 1) / 2) +
            " et " +
            (Math.floor(a.length / 2) + 1) +
            ".",
          s1: cards(a, [Math.floor((a.length - 1) / 2), Math.floor(a.length / 2)]),
          solution:
            lo === hi
              ? "Médiane : " + lo + "."
              : "Toute valeur de " + lo + " à " + hi + " convient.",
          meta: { vals, eff },
        },
      );
    }
    if (i === 3) {
      let a = [-r.int(1, 6), r.int(0, 4), r.int(5, 12), r.int(0, 5)],
        lo = Math.min(...a),
        hi = Math.max(...a);
      return q(
        "DP04",
        i,
        4,
        "Températures en °C : " + a.join(" ; ") + ". Quelle est l’étendue ?",
        hi - lo,
        {
          unit: "°C",
          h1: "Repère le minimum et le maximum.",
          h2: "Calcule maximum − minimum, même si le minimum est négatif.",
          s1: extent(lo, hi),
          course: {
            rule: "L’étendue est la différence entre la valeur maximale et la valeur minimale.",
            example: "Maximum 7 ; minimum −2 : étendue = 7 − (−2) = 9.",
            svg: extent(-2, 7),
          },
          solution: hi + "−(" + lo + ")=" + f(hi - lo) + " °C.",
          meta: { a },
        },
      );
    }
    let vals = [0, 1, 2, 3, 4],
      eff = vals.map(() => r.int(1, 5));
    if (sum(eff) % 2 === 0) eff[4]++;
    let a = vals.flatMap((v, j) => Array(eff[j]).fill(v)),
      rank = (a.length + 1) / 2,
      answer = a[rank - 1];
    return q(
      "DP04",
      i,
      4,
      "Le diagramme donne le nombre de livres lus. Donne l’effectif total, puis la médiane de cette série.",
      [sum(eff), answer],
      {
        labels: ["Effectif total", "Médiane"],
        visual: bars(vals, eff, 1),
        h1: "L’axe vertical donne les effectifs : " + sum(eff) + " élèves au total.",
        h2: "Repère la valeur de la " + rank + "e observation dans la série rangée.",
        s1: table(["Livres", ...vals], [["Effectif", ...eff]]),
        s2: table(
          ["Livres", ...vals],
          [["Effectif cumulé", ...eff.map((_, j) => sum(eff.slice(0, j + 1)))]],
        ),
        solution: "Effectif " + sum(eff) + " ; rang central " + rank + " ; médiane " + answer + ".",
        meta: { vals, eff },
      },
    );
  },
  DP05(r, i = 0) {
    i %= 4;
    if (i === 0) {
      let a = range(r.int(6, 12))
          .map(() => r.int(0, 15))
          .sort((a, b) => a - b),
        j = Math.ceil(a.length / 4) - 1,
        k = Math.ceil((3 * a.length) / 4) - 1;
      return q(
        "DP05",
        i,
        3,
        "La série est rangée. Donne le premier quartile Q1 et le troisième quartile Q3.",
        [a[j], a[k]],
        {
          dnb: false,
          labels: ["Q1", "Q3"],
          visual: cards(a),
          h1: "Q1 et Q3 sont des valeurs de la série, pas des rangs.",
          h2: "Avec " + a.length + " valeurs, prends les rangs " + (j + 1) + " et " + (k + 1) + ".",
          s1: cards(a, [j, k]),
          solution: "Q1=" + a[j] + " ; Q3=" + a[k] + ".",
          meta: { a },
        },
      );
    }
    if (i === 1) {
      let vals = [1, 2, 3, 4],
        eff = vals.map(() => r.int(1, 4)),
        a = vals.flatMap((v, j) => Array(eff[j]).fill(v)),
        j = Math.ceil(a.length / 4) - 1,
        k = Math.ceil((3 * a.length) / 4) - 1;
      return q("DP05", i, 3, "Donne Q1 et Q3 pour la série du tableau.", [a[j], a[k]], {
        dnb: false,
        labels: ["Q1", "Q3"],
        visual: table(["Valeur", ...vals], [["Effectif", ...eff]]),
        h1: "L’effectif total est " + a.length + ". Chaque valeur se répète selon son effectif.",
        h2: "Repère les observations de rangs " + (j + 1) + " et " + (k + 1) + ".",
        s1: table(
          ["Valeur", ...vals],
          [["Effectif cumulé", ...eff.map((_, i) => sum(eff.slice(0, i + 1)))]],
        ),
        solution: "Q1=" + a[j] + " ; Q3=" + a[k] + ".",
        meta: { vals, eff },
      });
    }
    if (i === 2) {
      let a = [r.int(0, 2)];
      for (let k = 1; k < 5; k++) a.push(a[k - 1] + r.int(1, 3));
      let j = r.int(0, 4),
        names = [
          "le minimum",
          "le premier quartile Q1",
          "la médiane",
          "le troisième quartile Q3",
          "le maximum",
        ];
      return q("DP05", i, 3, "Lis " + names[j] + " sur le diagramme en boîte.", a[j], {
        dnb: false,
        visual: boxes(a),
        h1: "De gauche à droite : minimum, Q1, médiane, Q3, maximum.",
        h2: "Repère " + names[j] + " puis lis sa valeur sur l’axe.",
        solution: names[j] + " : " + a[j] + ".",
        meta: { a, j },
      });
    }
    let w1 = r.int(2, 6),
      w2 = r.int(1, 5);
    if (w1 === w2) w2 = w1 === 5 ? 4 : 5;
    let a = [0, 2, 2 + w1 / 2, 2 + w1, 10],
      b = [1, 3, 3 + w2 / 2, 3 + w2, 10];
    let visual = compareBoxes(a, b);
    return q(
      "DP05",
      i,
      3,
      "Quelle série a le plus petit écart interquartile Q3 − Q1 ?",
      w1 < w2 ? "A" : "B",
      {
        dnb: false,
        kind: "text",
        options: ["A", "B"],
        visual,
        h1: "Compare les largeurs des boîtes à l’aide des graduations.",
        h2: "Pour A : " + a[3] + "−" + a[1] + ". Pour B : " + b[3] + "−" + b[1] + ".",
        solution:
          "A : " +
          w1 +
          " ; B : " +
          w2 +
          ". La série " +
          (w1 < w2 ? "A" : "B") +
          " est moins dispersée entre Q1 et Q3.",
        meta: { a, b },
      },
    );
  },
  DP06(r, i = 0) {
    i %= 6;
    if (i === 0) {
      let N = r.pick([4, 5, 8, 10, 12]),
        k = r.int(0, N);
      return q(
        "DP06",
        i,
        6,
        "On tire au hasard une boule parmi ces boules indiscernables au toucher. B signifie " +
          "bleue, R rouge. Quelle est la probabilité de tirer une boule bleue ?",
        frac(k, N),
        {
          kind: "fraction",
          visual: balls([
            ["B", k],
            ["R", N - k],
          ]),
          h1: "Chaque boule a la même chance d’être tirée.",
          h2: "Compte les boules bleues puis le nombre total de boules.",
          solution: "Issues favorables : " + k + " sur " + N + " ; " + k + "/" + N + ".",
          meta: { N, k },
        },
      );
    }
    if (i === 1) {
      let evt = r.pick(["pair", "impair", "multiple de 3", "supérieur à 4"]),
        fav = [1, 2, 3, 4, 5, 6].filter((n) =>
          evt === "pair"
            ? n % 2 === 0
            : evt === "impair"
              ? n % 2 === 1
              : evt === "multiple de 3"
                ? n % 3 === 0
                : n > 4,
        );
      return q(
        "DP06",
        i,
        6,
        "On lance un dé équilibré à 6 faces numérotées de 1 à 6. Quelle est la probabilité d’obtenir un nombre " +
          evt +
          " ?",
        frac(fav.length, 6),
        {
          kind: "fraction",
          h1: "Les six faces ont la même chance de sortir.",
          h2: "Repère les issues qui conviennent parmi 1, 2, 3, 4, 5, 6. Divise leur nombre par 6.",
          s1: cards(
            [1, 2, 3, 4, 5, 6],
            fav.map((x) => x - 1),
            false,
          ),
          solution: "Cas favorables : " + fav.join(", ") + ". Probabilité " + fav.length + "/6.",
          meta: { evt, fav },
        },
      );
    }
    if (i === 2) {
      let den = r.pick([2, 4, 5, 10]),
        k = r.int(1, den - 1);
      return q(
        "DP06",
        i,
        6,
        "Une roue a " +
          den +
          " secteurs égaux, dont " +
          k +
          " bleu" +
          (k === 1 ? "" : "s") +
          ". Chaque secteur a la même chance d’être obtenu. Écris la probabilité d’obtenir bleu sous forme décimale.",
        f(k / den),
        {
          check: { type: "numeric", values: [String(k / den)], form: "decimal" },
          visual: wheel(den, k),
          h1: "La probabilité vaut " + k + "/" + den + ".",
          h2: "Divise " + k + " par " + den + " pour obtenir l’écriture décimale.",
          solution: k + "/" + den + "=" + f(k / den) + ".",
          meta: { den, k },
        },
      );
    }
    if (i === 3) {
      let impossible = r.bool(),
        target = r.int(7, 12);
      return q(
        "DP06",
        i,
        6,
        "On lance un dé à 6 faces numérotées de 1 à 6. Quelle est la probabilité d’obtenir " +
          (impossible ? "le nombre " + target : "un nombre inférieur à " + target) +
          " ?",
        impossible ? 0 : 1,
        {
          h1: "Un événement impossible a une probabilité de 0 ; un événement certain de 1.",
          h2: impossible
            ? "Aucune face ne porte ce nombre."
            : "Les six nombres du dé satisfont cette condition.",
          s1: cards([1, 2, 3, 4, 5, 6], [], false),
          solution: impossible ? "Événement impossible : 0." : "Événement certain : 1.",
          meta: { impossible, target },
        },
      );
    }
    if (i === 4) {
      let a = r.int(1, 5),
        b = r.bool() ? a : r.int(1, 5);
      return q(
        "DP06",
        i,
        6,
        "On tire au hasard une boule, toutes indiscernables au toucher. « La probabilité de " +
          "tirer une boule bleue vaut 1/2. » Vrai ou faux ?",
        a === b ? "Vrai" : "Faux",
        {
          kind: "text",
          options: ["Vrai", "Faux"],
          visual: balls([
            ["B", a],
            ["R", b],
          ]),
          h1: "Ce sont les boules qui sont équiprobables, pas nécessairement les couleurs.",
          h2: "Il y a " + a + " boules bleues sur " + (a + b) + ".",
          solution: "P(bleu)=" + a + "/" + (a + b) + (a === b ? "=1/2." : " ≠ 1/2."),
          meta: { a, b },
        },
      );
    }
    let n = r.pick([4, 6, 8, 10, 12]),
      k = r.int(1, n - 1);
    return q(
      "DP06",
      i,
      6,
      "Les secteurs de la roue sont égaux et chacun a la même chance d’être obtenu. Quelle " +
        "est la probabilité d’obtenir bleu ?",
      frac(k, n),
      {
        kind: "fraction",
        visual: wheel(n, k),
        h1: "Chaque secteur constitue ici une issue équiprobable.",
        h2: "Au numérateur : le nombre de secteurs B. Au dénominateur : le nombre total de secteurs.",
        solution: "P(bleu)=" + k + "/" + n + ".",
        meta: { n, k },
      },
    );
  },
  DP07(r, i = 0) {
    i %= 5;
    if (i === 0) {
      let k = r.int(0, 10);
      return q(
        "DP07",
        i,
        4,
        "La probabilité de gagner est " +
          f(k / 10) +
          ". Quelle est la probabilité de ne pas gagner ?",
        f((10 - k) / 10),
        {
          h1: "Gagner et ne pas gagner sont deux événements contraires.",
          h2: "Les deux probabilités ont pour somme 1.",
          s1: strip(10, k, "Dixièmes : gagner"),
          solution: "1−" + f(k / 10) + "=" + f((10 - k) / 10) + ".",
          meta: { k },
        },
      );
    }
    if (i === 1) {
      let a = r.int(1, 5),
        b = r.int(1, 5),
        c = r.int(1, 5),
        N = a + b + c;
      return q(
        "DP07",
        i,
        5,
        "On tire au hasard une boule, toutes indiscernables au toucher. Quelle est la " +
          "probabilité de tirer une boule rouge ou bleue ?",
        frac(a + b, N),
        {
          kind: "fraction",
          visual: balls([
            ["R", a],
            ["B", b],
            ["V", c],
          ]),
          h1: "Les boules rouges et bleues conviennent toutes.",
          h2: "Additionne leurs effectifs puis divise par " + N + ".",
          solution: "(" + a + "+" + b + ")/" + N + "=" + (a + b) + "/" + N + ".",
          meta: { a, b, c },
        },
      );
    }
    if (i === 2 || i === 4) {
      let limit = r.pick([2, 3, 4]),
        intersection = i === 4,
        fav = [1, 2, 3, 4, 5, 6].filter((n) =>
          intersection ? n % 2 === 0 && n > limit : n % 2 === 0 || n > limit,
        );
      return q(
        "DP07",
        i,
        4,
        "On lance un dé équilibré numéroté de 1 à 6. Probabilité d’obtenir un nombre pair " +
          (intersection ? "et" : "ou") +
          " supérieur à " +
          limit +
          " ?",
        frac(fav.length, 6),
        {
          kind: "fraction",
          h1: intersection
            ? "« Et » demande les deux propriétés à la fois."
            : "« Ou » demande au moins une des propriétés.",
          h2: "Teste chaque face. Une face qui convient ne se compte qu’une fois.",
          s1: cards(
            [1, 2, 3, 4, 5, 6],
            fav.map((n) => n - 1),
            false,
          ),
          solution: "Cas favorables : " + fav.join(", ") + ". Probabilité " + fav.length + "/6.",
          meta: { limit, intersection, fav },
        },
      );
    }
    let a = r.int(1, 3),
      b = r.int(0, 3),
      c = r.int(1, 3),
      pa = (a + b) / 10,
      pb = (b + c) / 10,
      pc = b / 10;
    return q(
      "DP07",
      i,
      3,
      "P(A)=" + f(pa) + " ; P(B)=" + f(pb) + " ; P(A et B)=" + f(pc) + ". Calcule P(A ou B).",
      f((a + b + c) / 10),
      {
        dnb: false,
        h1: "En additionnant P(A) et P(B), la partie commune est comptée deux fois.",
        h2: "Additionne P(A) et P(B), puis retire une fois P(A et B).",
        s1: table(["A seulement", "A et B", "B seulement"], [[f(a / 10), f(b / 10), f(c / 10)]]),
        solution: f(pa) + "+" + f(pb) + "−" + f(pc) + "=" + f((a + b + c) / 10) + ".",
        meta: { a, b, c },
      },
    );
  },
  DP08(r, i = 0) {
    i %= 5;
    if (i === 0) {
      let evt = r.pick([
          "deux résultats différents",
          "deux résultats identiques",
          "deux piles",
          "au moins un pile",
        ]),
        outcomes = ["PP", "PF", "FP", "FF"],
        fav = outcomes.filter((x) =>
          evt === "deux résultats différents"
            ? x[0] !== x[1]
            : evt === "deux résultats identiques"
              ? x[0] === x[1]
              : evt === "deux piles"
                ? x === "PP"
                : x.includes("P"),
        );
      return q(
        "DP08",
        i,
        6,
        "On lance deux fois une pièce équilibrée, de façon indépendante. Quelle est la probabilité d’obtenir " +
          evt +
          " ?",
        frac(fav.length, 4),
        {
          kind: "fraction",
          h1: "Distingue le premier lancer du deuxième.",
          h2: "Les quatre issues équiprobables sont PP, PF, FP, FF.",
          s1: table(
            ["1er lancer", "2e : P", "2e : F"],
            [
              ["P", "PP", "PF"],
              ["F", "FP", "FF"],
            ],
          ),
          solution: "Cas favorables : " + fav.join(", ") + ". Probabilité " + fav.length + "/4.",
          meta: { evt, fav },
        },
      );
    }
    if (i === 1) {
      let target = r.int(2, 12),
        fav = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === target) fav++;
      return q(
        "DP08",
        i,
        4,
        "On lance deux dés équilibrés indépendants, numérotés de 1 à 6. Quelle est la probabilité que leur somme soit " +
          target +
          " ?",
        frac(fav, 36),
        {
          kind: "fraction",
          h1: "Chaque dé a 6 issues : 6×6 couples équiprobables.",
          h2:
            "Compte les cases dont la somme vaut " +
            target +
            ". Les sommes ne sont pas toutes équiprobables.",
          s1: table(
            ["Dés", 1, 2, 3, 4, 5, 6],
            range(6).map((a) => [a + 1, ...range(6).map((b) => a + b + 2)]),
          ),
          solution: fav + " couples favorables sur 36 : " + fav + "/36.",
          meta: { target },
        },
      );
    }
    if (i === 2) {
      let red = r.pick([2, 3]),
        N = red + 1;
      return q(
        "DP08",
        i,
        3,
        "Une urne contient " +
          red +
          (" boules rouges et 1 bleue, indiscernables au toucher. On tire deux boules au hasard " +
            "sans remise. Quelle est la probabilité de tirer deux rouges ?"),
        frac(red * (red - 1), N * (N - 1)),
        {
          kind: "fraction",
          visual: balls([
            ["R", red],
            ["B", 1],
          ]),
          h1: "Sans remise, la première boule tirée ne retourne pas dans l’urne.",
          h2:
            "P(rouge au premier tirage)=" +
            red +
            "/" +
            N +
            ". Si la première boule est rouge, il reste " +
            (red - 1) +
            " rouges sur " +
            (N - 1) +
            ". Multiplie les deux probabilités.",
          s1: table(
            ["Tirage", "Rouges", "Total"],
            [
              ["Premier", red, N],
              ["Second si rouge", red - 1, N - 1],
            ],
          ),
          solution:
            red +
            "/" +
            N +
            "×" +
            (red - 1) +
            "/" +
            (N - 1) +
            "=" +
            red * (red - 1) +
            "/" +
            N * (N - 1) +
            ".",
          meta: { red, N },
        },
      );
    }
    if (i === 3) {
      let N = r.pick([20, 40, 100, 200]),
        pct = r.int(2, 18) * 5,
        k = (N * pct) / 100;
      return q(
        "DP08",
        i,
        5,
        "Sur " +
          N +
          " lancers, on observe " +
          k +
          " fois pile. Quelle est la fréquence de pile en pourcentage ?",
        pct,
        {
          unit: "%",
          course: {
            rule: "Fréquence observée = effectif observé ÷ nombre d’essais. Elle peut varier entre les séries.",
            example:
              "12 piles observés en 20 lancers : fréquence = 12/20 = 60 %. La probabilité de pile d’une pièce équilibrée reste 1/2.",
            svg: strip(20, 12, "Pile observé"),
          },
          h1: "Une fréquence se calcule à partir des observations.",
          h2: "Calcule " + k + "/" + N + ", puis multiplie par 100.",
          s1: strip(N, k, "Pile observé"),
          solution: k + "/" + N + "=" + pct + "/100=" + pct + " %.",
          meta: { N, k },
        },
      );
    }
    let N = r.pick([20, 50, 100]),
      heads = N / 2 + r.pick([-2, -1, 1, 2]);
    return q(
      "DP08",
      i,
      4,
      "Une pièce équilibrée a donné " +
        heads +
        " piles en " +
        N +
        " lancers. Lors d’une autre série de lancers indépendants, obtiendra-t-on forcément exactement " +
        N / 2 +
        " piles en " +
        N +
        " lancers ?",
      "Non",
      {
        kind: "text",
        options: ["Oui", "Non"],
        course: {
          rule: "Fréquence observée = effectif observé ÷ nombre d’essais. Elle peut varier entre les séries.",
          example:
            "12 piles observés en 20 lancers : fréquence = 12/20 = 60 %. La probabilité de pile d’une pièce équilibrée reste 1/2.",
          svg: strip(20, 12, "Pile observé"),
        },
        h1: "La probabilité de pile vaut 1/2 à chaque lancer.",
        h2: "Les fréquences observées peuvent varier d’une série de lancers à l’autre.",
        s1: strip(N, heads, "Pile observé"),
        solution:
          "Non. 1/2 est la probabilité ; elle n’impose pas un effectif exact dans une série finie.",
        meta: { N, heads },
      },
    );
  },
  PI01(r, i = 0) {
    i %= 4;
    let x = r.int(1, 9),
      a = r.int(1, 6),
      b = r.int(2, 4),
      out = (x + a) * b;
    if (i === 0)
      return q(
        "PI01",
        i,
        6,
        "Choisir " +
          x +
          ", ajouter " +
          a +
          ", puis multiplier le résultat par " +
          b +
          ". Quel nombre obtient-on ?",
        out,
        {
          visual: codeBlocks(["Choisir " + x, "Ajouter " + a, "Multiplier par " + b]),
          h1: "Commence par ajouter " + a + ".",
          h2: "Le résultat intermédiaire est " + (x + a) + ". Multiplie-le par " + b + ".",
          s1: flow([x, "?", "?"], ["+" + a, "×" + b]),
          solution: "(" + x + "+" + a + ")×" + b + "=" + out + ".",
          meta: { x, a, b },
        },
      );
    if (i === 1)
      return q(
        "PI01",
        i,
        4,
        "On ajoute " +
          a +
          " au nombre de départ, puis on multiplie par " +
          b +
          ". Le résultat est " +
          out +
          ". Quel était le nombre de départ ?",
        x,
        {
          h1: "Remonte le programme depuis le résultat.",
          h2: "Annule d’abord la multiplication : " + out + "÷" + b + "=" + (x + a) + ".",
          s1: flow(["?", "?", out], ["+" + a, "×" + b]),
          solution: out + "÷" + b + "−" + a + "=" + x + ".",
          meta: { x, a, b },
        },
      );
    if (i === 2)
      return q(
        "PI01",
        i,
        5,
        "On choisit x, on ajoute " +
          a +
          ", puis on multiplie par " +
          b +
          ". Écris l’expression obtenue.",
        b + "*(x+" + a + ")",
        {
          kind: "expression",
          h1: "Après la première étape, tu as x+" + a + ".",
          h2: "Multiplie toute cette somme par " + b + " : les parenthèses regroupent la somme.",
          s1: flow(["x", "x+" + a, "?"], ["+" + a, "×" + b]),
          solution: b + "(x+" + a + ")=" + b + "x+" + a * b + ".",
          meta: { a, b },
        },
      );
    let target = r.bool() ? "A" : "B",
      val = target === "A" ? out : x * b + a;
    return q("PI01", i, 5, "Avec " + x + " au départ, quel programme donne " + val + " ?", target, {
      kind: "text",
      options: ["A", "B"],
      visual: table(
        ["Programme", "Étape 1", "Étape 2"],
        [
          ["A", "Ajouter " + a, "Multiplier par " + b],
          ["B", "Multiplier par " + b, "Ajouter " + a],
        ],
      ),
      h1: "Les opérations sont les mêmes, mais pas leur ordre.",
      h2: "A commence par " + x + "+" + a + " ; B par " + x + "×" + b + ".",
      solution: "A donne " + out + " ; B donne " + (x * b + a) + ".",
      meta: { x, a, b, target },
    });
  },
  PI02(r, i = 0) {
    i %= 5;
    let x = r.int(1, 9),
      a = r.int(1, 5),
      b = r.int(2, 4);
    if (i === 0)
      return q("PI02", i, 4, "Quelle valeur de x est affichée ?", (x + a) * b, {
        visual: codeBlocks([
          "Mettre x à " + x,
          "Mettre x à x + " + a,
          "Mettre x à " + b + " × x",
          "Afficher x",
        ]),
        h1: "Chaque affectation « mettre x à… » remplace la valeur mémorisée dans x.",
        h2:
          "Après l’addition, x vaut " + (x + a) + ". Utilise cette valeur pour la multiplication.",
        s1: table(
          ["Étape", "x"],
          [
            ["Départ", x],
            ["Après addition", x + a],
            ["Après multiplication", "?"],
          ],
        ),
        solution: "x : " + x + " → " + (x + a) + " → " + (x + a) * b + ".",
        meta: { x, a, b },
      });
    if (i === 1) {
      let t = r.int(5, 15),
        n = t + r.pick([-1, 0, 1]),
        yes = r.int(1, 4),
        no = r.int(5, 9);
      return q("PI02", i, 4, "Quelle valeur s’affiche ?", n > t ? yes : no, {
        visual: codeBlocks([
          "n vaut " + n,
          "Si n > " + t,
          "  afficher " + yes,
          "Sinon afficher " + no,
        ]),
        h1: "Le signe > signifie strictement supérieur.",
        h2: "Le test " + n + " > " + t + " est " + (n > t ? "vrai" : "faux") + ".",
        solution: "La branche " + (n > t ? "si" : "sinon") + " affiche " + (n > t ? yes : no) + ".",
        meta: { n, t, yes, no },
      });
    }
    if (i === 2) {
      let lo = r.int(1, 4),
        hi = lo + r.int(2, 5),
        n = r.pick([lo - 1, lo, lo + 1, hi - 1, hi, hi + 1]),
        and = r.bool(),
        first = and ? n > lo : n < lo,
        second = and ? n < hi : n > hi,
        ok = and ? first && second : first || second;
      return q("PI02", i, 3, "Quelle valeur s’affiche ?", ok ? 1 : 0, {
        visual: codeBlocks([
          "n vaut " + n,
          "Si (n " +
            (and ? ">" : "<") +
            " " +
            lo +
            ") " +
            (and ? "et" : "ou") +
            " (n " +
            (and ? "<" : ">") +
            " " +
            hi +
            ")",
          "  afficher 1",
          "Sinon afficher 0",
        ]),
        h1: and ? "« Et » exige deux tests vrais." : "« Ou » exige au moins un test vrai.",
        h2:
          "Premier test : " +
          (first ? "vrai" : "faux") +
          ". Second : " +
          (second ? "vrai" : "faux") +
          ".",
        solution: "Condition " + (ok ? "vraie" : "fausse") + " : affichage " + (ok ? 1 : 0) + ".",
        meta: { lo, hi, n, and },
      });
    }
    if (i === 4) {
      let u = x + a,
        v = x - b;
      return q("PI02", i, 3, "Quelle valeur est affichée à la fin du programme ?", u * v, {
        visual: codeBlocks([
          "Mettre x à " + x,
          "Mettre u à x + " + a,
          "Mettre v à x − " + b,
          "Afficher u × v",
        ]),
        h1: "u et v sont calculés à partir de la même valeur de x.",
        h2:
          "u=" +
          x +
          "+" +
          a +
          "=" +
          u +
          " ; v=" +
          x +
          "−" +
          b +
          "=" +
          v +
          ". Multiplie ensuite u par v.",
        s1: svg(
          rect(215, 15, 110, 45, C.pale) +
            text(235, 45, "x = " + x, 23) +
            line(230, 60, 115, 105) +
            line(310, 60, 425, 105) +
            text(115, 82, "+" + a, 20) +
            text(395, 82, "−" + b, 20) +
            rect(55, 105, 150, 48, C.green) +
            text(74, 138, "u = ?", 24) +
            rect(335, 105, 150, 48, C.green) +
            text(354, 138, "v = ?", 24) +
            line(130, 153, 245, 200) +
            line(410, 153, 295, 200) +
            text(218, 232, "u × v", 25),
          540,
          255,
        ),
        solution: "u=" + u + ", v=" + v + " ; u×v=" + u * v + ".",
        meta: { x, a, b },
      });
    }
    let next = x + r.int(1, 8);
    return q("PI02", i, 3, "Quelle valeur de y est affichée ?", x + a, {
      visual: codeBlocks([
        "Mettre x à " + x,
        "Mettre y à x + " + a,
        "Mettre x à " + next,
        "Afficher y",
      ]),
      h1: "y reçoit une valeur au moment de son affectation.",
      h2: "À ce moment, x vaut " + x + ". La ligne suivante ne change que x.",
      s1: table(
        ["Étape", "x", "y"],
        [
          ["Départ", x, "—"],
          ["Affectation de y", x, x + a],
          ["Nouvelle valeur de x", next, "?"],
        ],
      ),
      solution: "y reste égal à " + x + "+" + a + "=" + (x + a) + ".",
      meta: { x, a, next },
    });
  },
  PI03(r, i = 0) {
    i %= 9;
    if (i === 0) {
      let x = r.int(1, 3),
        y = r.int(2, 4),
        a = r.int(1, 4),
        b = r.int(1, 2),
        left = r.bool(),
        Y = y + (left ? b : -b);
      return q(
        "PI03",
        i,
        6,
        "Départ (" +
          x +
          " ; " +
          y +
          "), vers la droite. Avancer de " +
          a +
          " case" +
          (a === 1 ? "" : "s") +
          ", tourner à " +
          (left ? "gauche" : "droite") +
          " d’un quart de tour, avancer de " +
          b +
          " case" +
          (b === 1 ? "" : "s") +
          ". Coordonnées d’arrivée ?",
        [x + a, Y],
        {
          labels: ["Abscisse x", "Ordonnée y"],
          visual: coordGrid(x, y),
          h1: "Le premier déplacement est horizontal vers la droite.",
          h2:
            "Après ce déplacement : (" +
            (x + a) +
            " ; " +
            y +
            "). Le lutin regarde maintenant vers " +
            (left ? "le haut" : "le bas") +
            ".",
          s1: coordGrid(x + a, y, left ? "haut" : "bas", "Après le premier déplacement"),
          solution: "Arrivée : (" + (x + a) + " ; " + Y + ").",
          meta: { x, y, a, b, left },
        },
      );
    }
    if (i === 1) {
      let step = r.int(2, 6),
        n = r.int(2, 7),
        total = step * n;
      return q(
        "PI03",
        i,
        5,
        "Le lutin avance de " +
          step +
          " pas par répétition, toujours tout droit. Combien de répétitions pour avancer de " +
          total +
          " pas ?",
        n,
        {
          h1: "Chaque répétition ajoute le même déplacement.",
          h2: "Cherche combien de fois " + step + " dans " + total + ".",
          s1: flow(["0", "?", "" + total], ["+" + step, "…"]),
          solution: total + "÷" + step + "=" + n + " répétitions.",
          meta: { step, n, total },
        },
      );
    }
    if (i === 2) {
      let n = r.pick([3, 4, 6]),
        side = r.int(10, 30),
        names = { 3: "triangle équilatéral", 4: "carré", 6: "hexagone régulier" };
      return q(
        "PI03",
        i,
        5,
        "Pour tracer un " +
          names[n] +
          ", on répète " +
          n +
          " fois : avancer de " +
          side +
          " ; tourner à gauche de …°. Un tour complet vaut 360°. Quelle est la mesure de l’angle de rotation ?",
        360 / n,
        {
          unit: "°",
          visual: polygon(n),
          h1: "Les " + n + " rotations égales forment un tour complet.",
          h2: "Partage 360° entre " + n + " rotations.",
          solution: "360÷" + n + "=" + 360 / n + "°.",
          meta: { n, side },
        },
      );
    }
    if (i === 3) {
      let start = r.int(0, 4),
        step = r.int(1, 4),
        t = r.int(7, 16),
        out = start,
        trace = [out];
      while (out <= t) {
        out += step;
        trace.push(out);
      }
      return q("PI03", i, 3, "Quelle valeur s’affiche ?", out, {
        visual: codeBlocks([
          "Mettre x à " + start,
          "Répéter jusqu’à ce que x > " + t,
          "  Ajouter " + step + " à x",
          "Afficher x",
        ]),
        h1: "La boucle s’arrête dès que le test x > " + t + " est vrai.",
        h2:
          "Les valeurs commencent par " +
          trace.slice(0, Math.min(4, trace.length - 1)).join(", ") +
          ". Continue si le test reste faux.",
        s1: flow(trace.slice(0, Math.min(4, trace.length)).map(String), Array(3).fill("+" + step)),
        solution: trace.join(" → ") + ". Affichage " + out + ".",
        meta: { start, step, t },
      });
    }
    if (i === 8) {
      let n = r.int(2, 6),
        step = 420 / (2 * n),
        path = "M40 115";
      for (let k = 0; k < n; k++) path += " h" + step + " v-50 h" + step + " v50";
      let one = "M160 270 h60 v-50 h60 v50",
        visual = svg(
          text(40, 30, "Trajet à reproduire", 23) +
            '<path d="' +
            path +
            '" fill="none" stroke="' +
            C.blue +
            '" stroke-width="4"/>' +
            text(20, 146, "Départ", 17) +
            text(442, 146, "Fin", 17) +
            text(162, 195, "Un motif", 22) +
            '<path d="' +
            one +
            '" fill="none" stroke="' +
            C.orange +
            '" stroke-width="4"/>' +
            text(40, 310, "Schémas non à l’échelle", 17),
          510,
          335,
        );
      return q(
        "PI03",
        i,
        5,
        "Le bloc « créneau » trace le motif du bas. Combien de fois faut-il le répéter pour obtenir le trajet du haut ?",
        n,
        {
          visual,
          h1: "Un motif contient une montée et une descente, puis revient à la direction initiale.",
          h2: "Compte les motifs complets du départ à l’arrivée. Chaque montée correspond à un motif.",
          s1: codeBlocks([
            "Définir créneau :",
            "Avancer 30 ; gauche 90°",
            "Avancer 10 ; droite 90°",
            "Avancer 30 ; droite 90°",
            "Avancer 10 ; gauche 90°",
          ]),
          solution: "Le trajet contient " + n + " motifs : répéter " + n + " fois.",
          meta: { n },
        },
      );
    }
    if (i === 7) {
      let angle = r.pick([30, 45, 60, 75, 90, 120, 135]),
        turn = 180 - angle,
        t = (turn * Math.PI) / 180,
        X = 300 + 180 * Math.cos(t),
        Y = 220 - 180 * Math.sin(t),
        mid = (Math.PI + t) / 2,
        ex = 300 + 45 * Math.cos(t),
        ey = 220 - 45 * Math.sin(t),
        b =
          line(70, 220, 300, 220, C.blue, 3) +
          line(300, 220, X, Y, C.blue, 3) +
          line(X, Y, 70, 220, "#90aaa3", 2) +
          text(49, 247, "A", 22) +
          text(300, 247, "B", 22) +
          text(X - 8, Y - 16, "C", 22) +
          '<path d="M255 220 A45 45 0 0 1 ' +
          ex +
          " " +
          ey +
          '" fill="none" stroke="' +
          C.orange +
          '" stroke-width="2"/>' +
          text(300 + 70 * Math.cos(mid) - 12, 220 - 70 * Math.sin(mid) + 6, angle + "°", 21) +
          line(180, 220, 193, 220, C.blue, 3) +
          '<path d="M185 214 L193 220 L185 226" fill="none" stroke="' +
          C.blue +
          '" stroke-width="3"/>';
      return q(
        "PI03",
        i,
        5,
        "Le lutin va de A vers B, puis de B vers C. L’angle [angle:ABC] mesure " +
          angle +
          "°. De combien de degrés doit-il tourner à gauche en B ?",
        turn,
        {
          unit: "°",
          visual: svg(b, 535, 275),
          h1: "La rotation part de la direction de déplacement AB, prolongée au-delà de B.",
          h2: "L’angle intérieur et l’angle de rotation sont supplémentaires : leurs mesures ont pour somme 180°.",
          course: {
            rule: "Pour passer d’un côté au suivant, l’angle de rotation et l’angle intérieur sont supplémentaires.",
            example: "Angle intérieur de 120° : angle de rotation de 180° − 120° = 60°.",
            svg: svg(
              line(60, 150, 250, 150, C.blue, 3) +
                line(250, 150, 310, 46, C.blue, 3) +
                line(250, 150, 420, 150, "#9bb0a8", 2) +
                text(175, 123, "120°", 24) +
                text(320, 123, "60°", 24) +
                text(43, 183, "Avant", 20) +
                text(310, 35, "Après", 20),
              480,
              205,
            ),
          },
          s1: svg(
            b +
              '<path d="M300 220 H465" stroke="' +
              C.ink +
              '" stroke-width="2" stroke-dasharray="6 5"/><path d="M355 220 A55 55 0 0 0 ' +
              (300 + 55 * Math.cos(t)) +
              " " +
              (220 - 55 * Math.sin(t)) +
              '" fill="none" stroke="' +
              C.blue +
              '" stroke-width="2"/>' +
              text(300 + 90 * Math.cos(t / 2) - 5, 220 - 90 * Math.sin(t / 2), "?", 26),
            535,
            275,
          ),
          solution: "Mesure de l’angle de rotation = 180° − " + angle + "° = " + turn + "°.",
          meta: { angle },
        },
      );
    }
    if (i === 6) {
      let x = r.int(2, 3),
        y = r.int(3, 4),
        step = r.int(1, 2),
        n = r.int(2, 4),
        left = r.bool(),
        dx = 1,
        dy = 0,
        X = x,
        Y = y,
        path = [[X, Y]];
      for (let k = 0; k < n; k++) {
        X += step * dx;
        Y += step * dy;
        path.push([X, Y]);
        [dx, dy] = left ? [-dy, dx] : [dy, -dx];
      }
      let route = path
        .slice(1)
        .map(
          (p, j) =>
            line(
              50 + path[j][0] * 36,
              290 - path[j][1] * 36,
              50 + p[0] * 36,
              290 - p[1] * 36,
              C.orange,
              3,
            ) + text(50 + p[0] * 36 + 5, 290 - p[1] * 36 - 8, j + 1, 17),
        )
        .join("");
      return q(
        "PI03",
        i,
        5,
        "Départ (" +
          x +
          " ; " +
          y +
          "), vers la droite. Répéter " +
          n +
          " fois : avancer de " +
          step +
          " case" +
          (step === 1 ? "" : "s") +
          ", puis tourner à " +
          (left ? "gauche" : "droite") +
          " d’un quart de tour. Donne les coordonnées d’arrivée.",
        [X, Y],
        {
          labels: ["Abscisse x", "Ordonnée y"],
          visual: coordGrid(x, y),
          h1: "Une répétition comporte un déplacement et une rotation. La direction change pour la répétition suivante.",
          h2:
            "Suis les " +
            n +
            " déplacements numérotés, puis lis les coordonnées du point d’arrivée.",
          s1: codeBlocks([
            "Répéter " + n + " fois",
            "  Avancer de " + step + " case" + (step === 1 ? "" : "s"),
            "  Tourner à " + (left ? "gauche" : "droite") + " de 90°",
          ]),
          s2: coordGrid(x, y).replace("</svg>", route + "</svg>"),
          solution:
            "Positions successives : " +
            path.map((p) => "(" + p[0] + " ; " + p[1] + ")").join(" → ") +
            ". Arrivée (" +
            X +
            " ; " +
            Y +
            ").",
          meta: { x, y, step, n, left },
        },
      );
    }
    if (i === 5) {
      let n = r.pick([3, 4, 6]),
        side = r.int(10, 30),
        names = { 3: "triangle équilatéral", 4: "carré", 6: "hexagone régulier" };
      return q(
        "PI03",
        i,
        5,
        "Pour tracer un " +
          names[n] +
          ", le programme répète « avancer de " +
          side +
          " ; tourner à gauche ». Complète le nombre de répétitions et la mesure de l’angle de rotation.",
        [n, 360 / n],
        {
          labels: ["Répétitions", "Mesure en degrés"],
          visual: polygon(n),
          h1: "Une répétition trace un côté puis tourne.",
          h2: "Il faut " + n + " côtés. Les rotations égales totalisent 360°.",
          solution: n + " répétitions ; mesure de l’angle : 360÷" + n + "=" + 360 / n + "°.",
          meta: { n, side },
        },
      );
    }
    let per = r.int(2, 4),
      n = r.int(2, 5);
    return q(
      "PI03",
      i,
      3,
      "Le bloc «motif» contient " +
        per +
        " instructions «avancer». Le programme appelle «motif» " +
        n +
        " fois. Combien d’instructions «avancer» sont exécutées ?",
      per * n,
      {
        visual: codeBlocks([
          "Définir motif : " + per + " avances",
          "Répéter " + n + " fois",
          "  motif",
        ]),
        h1: "Chaque appel exécute tout le bloc.",
        h2: "Il y a " + n + " appels de " + per + " avances chacun.",
        solution: n + "×" + per + "=" + n * per + " instructions.",
        meta: { per, n },
      },
    );
  },
  PI04(r, i = 0) {
    i %= 5;
    if (i === 0) {
      let a = r.int(1, 12),
        b = r.int(2, 4),
        c = r.int(1, 8);
      return q("PI04", i, 5, "Quelle valeur s’affiche dans B2 ?", a * b + c, {
        visual: table(["", "A", "B"], [["2", a, "=" + b + "*A2+" + c]]),
        h1: "Remplace A2 par le nombre contenu dans A2.",
        h2: "Calcule " + b + "×" + a + "+" + c + ".",
        solution: b + "×" + a + "+" + c + "=" + (a * b + c) + ".",
        meta: { a, b, c },
      });
    }
    if (i === 1) {
      let start = r.int(2, 5),
        delta = r.int(1, 4),
        end = start + delta;
      return q(
        "PI04",
        i,
        4,
        "C" +
          start +
          " contient =A" +
          start +
          "+B" +
          start +
          ". Recopie en C" +
          end +
          ". Complète les deux numéros de ligne : =A…+B… .",
        [end, end],
        {
          labels: ["Ligne après A", "Ligne après B"],
          h1: "La formule descend de " + delta + " ligne" + (delta === 1 ? "" : "s") + ".",
          h2:
            "Les deux références descendent aussi de " +
            delta +
            " ligne" +
            (delta === 1 ? "" : "s") +
            ".",
          s1: table(
            ["Cellule", "Formule"],
            [
              ["C" + start, "=A" + start + "+B" + start],
              ["C" + end, "=A…+B…"],
            ],
          ),
          solution: "=A" + end + "+B" + end,
          meta: { start, delta },
        },
      );
    }
    if (i === 2) {
      let start = r.int(0, 2),
        delta = r.int(1, 3),
        s = String.fromCharCode(65 + start),
        e = String.fromCharCode(65 + start + delta);
      return q(
        "PI04",
        i,
        4,
        s +
          "3 contient =" +
          s +
          "1+" +
          s +
          "2. Recopie en " +
          e +
          "3. Complète les deux lettres : =…1+…2 .",
        [e, e],
        {
          kind: "text",
          labels: ["Colonne avant 1", "Colonne avant 2"],
          h1:
            "La formule se déplace de " +
            delta +
            " colonne" +
            (delta === 1 ? "" : "s") +
            " vers la droite.",
          h2: "Les références se déplacent du même nombre de colonnes.",
          s1: table(
            ["Cellule", "Formule"],
            [
              [s + "3", "=" + s + "1+" + s + "2"],
              [e + "3", "=…1+…2"],
            ],
          ),
          solution: "=" + e + "1+" + e + "2",
          meta: { start, delta },
        },
      );
    }
    let n = r.int(3, 5),
      vals = range(n).map(() => r.int(0, 12)),
      total = sum(vals);
    return q(
      "PI04",
      i,
      i === 3 ? 5 : 4,
      "B2 contient =" +
        (i === 3 ? "SOMME" : "MOYENNE") +
        "(A2:A" +
        (n + 1) +
        "). Quelle valeur s’affiche ?",
      i === 3 ? total : frac(total, n),
      {
        visual: table(
          ["Ligne", "A"],
          vals.map((v, j) => [j + 2, v]),
        ),
        h1: "La plage contient toutes les cellules de A2 à A" + (n + 1) + ", bornes comprises.",
        h2:
          i === 3
            ? "Additionne les " + n + " valeurs."
            : "Additionne les " + n + " valeurs, puis divise le total par " + n + ".",
        solution:
          i === 3
            ? vals.join("+") + "=" + total + "."
            : "Moyenne = (" + vals.join("+") + ")/" + n + " = " + total + "/" + n + ".",
        meta: { vals },
      },
    );
  },
};
function codeBlocks(lines) {
  return code(lines);
}
function coordGrid(x, y, dir = "droite", label = "Départ") {
  let b = "";
  const X = (a) => 50 + a * 36,
    Y = (a) => 290 - a * 36;
  for (let k = 0; k <= 8; k++) b += line(X(k), Y(0), X(k), Y(7), "#d6e3dc", 1);
  for (let k = 0; k <= 7; k++) b += line(X(0), Y(k), X(8), Y(k), "#d6e3dc", 1);
  b += line(X(0), Y(0), X(8), Y(0)) + line(X(0), Y(0), X(0), Y(7));
  for (let k = 0; k <= 8; k++) b += text(X(k) - 6, Y(0) + 25, k, 22);
  for (let k = 1; k <= 7; k++) b += text(X(0) - 27, Y(k) + 7, k, 22);
  let dx = dir === "droite" ? 25 : 0,
    dy = dir === "haut" ? -25 : dir === "bas" ? 25 : 0,
    ex = X(x) + dx,
    ey = Y(y) + dy;
  b += circle(X(x), Y(y), 5, C.blue) + line(X(x), Y(y), ex, ey, C.blue, 3);
  b +=
    dir === "droite"
      ? '<path d="M' +
        (ex - 6) +
        " " +
        (ey - 5) +
        " L" +
        ex +
        " " +
        ey +
        " L" +
        (ex - 6) +
        " " +
        (ey + 5) +
        '" fill="none" stroke="' +
        C.blue +
        '" stroke-width="3"/>'
      : '<path d="M' +
        (ex - 5) +
        " " +
        (ey + (dy < 0 ? 6 : -6)) +
        " L" +
        ex +
        " " +
        ey +
        " L" +
        (ex + 5) +
        " " +
        (ey + (dy < 0 ? 6 : -6)) +
        '" fill="none" stroke="' +
        C.blue +
        '" stroke-width="3"/>';
  b +=
    text(355, 90, label === "Départ" ? label : "Étape 1", 18) +
    text(355, 130, "(" + x + " ; " + y + ")", 24) +
    text(
      355,
      170,
      "vers " + (dir === "droite" ? "la droite" : dir === "haut" ? "le haut" : "le bas"),
      20,
    );
  return svg(b, 500, 330);
}
function polygon(n) {
  let pts = range(n).map((i) => {
    let t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [180 + 90 * Math.cos(t), 120 + 90 * Math.sin(t)];
  });
  return svg(
    '<polygon points="' +
      pts.map((p) => p.join(",")).join(" ") +
      '" fill="' +
      C.pale +
      '" stroke="' +
      C.ink +
      '" stroke-width="3"/>' +
      text(310, 100, n + " côtés égaux", 22) +
      text(310, 145, n + " rotations", 22) +
      text(310, 190, "Tour complet : 360°", 20),
    560,
    235,
  );
}
