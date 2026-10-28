import { svg, text as rawText, line, rect as svgRect, circle } from "./draw.js";
// Les parts d’un même tout sont jointives.
const display = (value) => String(value).replace(/-(?=\d)/g, "−");
const text = (x, y, value, ...args) => rawText(x, y, display(value), ...args);
const rect = (...args) => svgRect(...args).replace('rx="2"', 'rx="0"');

// Les calculs rationnels conservent les valeurs exactes.
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const rat = (a, b = 1) => {
  if (!b) throw Error("zero denominator");
  let g = gcd(a, b);
  if (b < 0) g = -g;
  return [a / g, b / g];
};
const frac = (a, b = 1) => {
  let [n, d] = rat(a, b);
  return d === 1 ? String(n) : `${n}/${d}`;
};
const F = (n) =>
  String(Number(Number(n).toFixed(10)))
    .replace(".", ",")
    .replace("-", "−");
const sup = (n) =>
  String(n)
    .split("")
    .map(
      (c) =>
        ({
          "-": "⁻",
          0: "⁰",
          1: "¹",
          2: "²",
          3: "³",
          4: "⁴",
          5: "⁵",
          6: "⁶",
          7: "⁷",
          8: "⁸",
          9: "⁹",
        })[c],
    )
    .join("");
const pwr = (a, n) => `${a}${sup(n)}`;
const sign = (n) => (n < 0 ? "Négatif" : n > 0 ? "Positif" : "Nul");
const cmp = (a, b) => (a < b ? "<" : a > b ? ">" : "=");
const nonzero = (r, lo = 1, hi = 9) => r.int(lo, hi) * (r.bool() ? 1 : -1);
const field = (answer, label = "Réponse", kind = "number", unit = "") => ({
  label,
  answer:
    typeof answer === "number" && Number.isFinite(answer)
      ? String(Number(answer.toFixed(10)))
      : String(answer),
  kind,
  unit,
  placeholder: "",
});
const boxes = (labels, values) => labels.map((l, i) => field(values[i], l));
const hint = (t, s = "") => ({ text: display(t), svg: s });
const diagramLines = (rows) => {
  let lines = rows.flatMap((row) => {
    let out = [],
      current = "";
    for (let word of String(row).split(" ")) {
      if (current.length + word.length > 48) {
        out.push(current);
        current = word;
      } else current += (current ? " " : "") + word;
    }
    if (current) out.push(current);
    return out;
  });
  let step = lines.some((s) => s.includes("/")) ? 46 : 32;
  return svg(
    lines.map((v, i) => text(24, 34 + i * step, v, 20)).join(""),
    600,
    lines.length * step + 22,
  );
};
function band(n, d, label = "", w = 420) {
  let units = Math.max(1, Math.ceil(n / d));
  let h = units * 45 + 54,
    body = text(18, 24, label, 18);
  for (let u = 0; u < units; u++)
    for (let i = 0; i < d; i++)
      body += rect(18 + (i * w) / d, 42 + u * 45, w / d, 32, u * d + i < n ? "#55aa95" : "#f4f6f0");
  return svg(body, 460, h);
}
function bars(items, half = false) {
  let body = "";
  items.forEach(([n, d, label], j) => {
    body += text(18, 24 + j * 90, label, 20);
    for (let i = 0; i < d; i++)
      body += rect(18 + (i * 420) / d, 46 + j * 90, 420 / d, 32, i < n ? "#55aa95" : "#f4f6f0");
    if (half)
      body +=
        line(228, 43 + j * 90, 228, 82 + j * 90, "#c36035", 3) +
        text(215, 24 + j * 90, "1/2", 17, "#a44520");
  });
  return svg(body, 460, items.length * 90 + 8);
}
function areaProduct(a, b, c, d) {
  let body = text(18, 24, `${a}/${b} de ${c}/${d} de l’unité`, 20);
  for (let y = 0; y < b; y++)
    for (let x = 0; x < d; x++)
      body += rect(
        30 + (x * 340) / d,
        42 + (y * 150) / b,
        340 / d,
        150 / b,
        y < a && x < c ? "#176d5b" : x < c ? "#b4ddd0" : y < a ? "#f1d9b3" : "#f4f6f0",
      );
  body += text(30, 220, `${b} lignes × ${d} colonnes ; intersection foncée`, 16);
  return svg(body, 420, 240);
}
function numberLine(min, max, points = []) {
  if (min === max) max = min + 1;
  let x = (v) => 50 + ((v - min) / (max - min)) * 460,
    body = line(50, 92, 510, 92);
  for (let i = 0; i <= 5; i++) {
    let v = min + ((max - min) * i) / 5;
    body += line(x(v), 86, x(v), 98) + text(x(v) - 15, 125, F(v), 16);
  }
  for (let i = 0; i < points.length; i++) {
    let [v, label] = points[i];
    body +=
      circle(x(v), 92, 5, "#d46a37") +
      line(x(v), 87, x(v), 54 - (i % 2) * 22, "#d46a37") +
      text(x(v) - 16, 45 - (i % 2) * 22, label || F(v), 18);
  }
  return svg(body, 560, 150);
}
function oppositeLine(a, other = "?") {
  let magnitude = Math.abs(a),
    left = a < 0 ? F(a) : other,
    right = a > 0 ? F(a) : other;
  return svg(
    line(50, 92, 510, 92) +
      line(280, 84, 280, 100) +
      text(275, 125, "0", 18) +
      circle(50, 92, 5, "#d46a37") +
      circle(510, 92, 5, "#d46a37") +
      line(50, 86, 50, 57, "#d46a37") +
      line(510, 86, 510, 57, "#d46a37") +
      text(35, 43, left, 19) +
      text(other.length > 2 && a < 0 ? 450 : 495, 43, right, 19) +
      line(50, 151, 280, 151, "#91aaa1", 2) +
      line(280, 151, 510, 151, "#91aaa1", 2) +
      text(135, 179, F(magnitude), 18) +
      text(365, 179, F(magnitude), 18),
    560,
    205,
  );
}
function place(value) {
  let s = Number(value).toFixed(3),
    [u, d] = s.split(".");
  return svg(
    ["partie entière", "dixièmes", "centièmes", "millièmes"]
      .map(
        (l, i) =>
          rect(10 + i * 132, 20, 128, 83, "#f4f6f0") +
          text(20 + i * 132, 46, l, 16) +
          text(64 + i * 132, 83, i === 0 ? u : d[i - 1], 25),
      )
      .join(""),
    550,
    120,
  );
}
function groups(total, parts, selected, label = "") {
  let body = text(20, 24, label, 20);
  for (let i = 0; i < parts; i++)
    body +=
      rect(20 + (i * 500) / parts, 42, 500 / parts, 54, i < selected ? "#b4ddd0" : "#f4f6f0") +
      text(20 + ((i + 0.5) * 500) / parts - 8, 76, "?", 22);
  body +=
    line(20, 115, 520, 115) + text(225, 140, typeof total === "number" ? F(total) : total, 21);
  return svg(body, 550, 158);
}
function q(id, v, grade, prompt, answer, hints, rule, opts = {}) {
  prompt = display(prompt);
  rule = display(rule);
  let fs = opts.fields || [field(answer, "Réponse", opts.kind || "number", opts.unit || "")];
  let solution = display(
    opts.solution ||
      "" +
        prompt.replace(/^(Calcule|Complète|Écris)\s*/, "") +
        " → " +
        (Array.isArray(answer) ? answer.join(" ; ") : FString(answer)) +
        ".",
  );
  hints = hints.map((h) => (typeof h === "string" ? hint(h) : h));
  const firstVisual = firstHintVisual(id, v, prompt, fs, hints);
  if (firstVisual) hints[0] = { ...hints[0], svg: firstVisual };
  return {
    family: id,
    variant: `${id}-${String.fromCharCode(65 + v)}`,
    grade,
    dnb: opts.dnb ?? true,
    prompt,
    math: opts.math || "",
    fields: fs,
    check: opts.check || {
      type: fs.length > 1 ? "fields" : opts.kind === "text" ? "text" : "numeric",
      values: fs.map((f) => f.answer),
      ...(opts.form ? { form: opts.form } : {}),
    },
    hints: hints.map((h) => (typeof h === "string" ? hint(h) : h)),
    solution,
    visual: opts.visual || "",
    course: {
      rule,
      example: opts.example || solution,
      svg:
        opts.courseSvg ||
        hints.find((h) => typeof h === "object" && h.svg)?.svg ||
        diagramLines([opts.example || solution]),
    },
    tags: opts.tags || [],
    ...opts.extra,
  };
}
const FString = (x) => String(x).replaceAll(".", ",").replaceAll("-", "−");
function choice(id, v, grade, prompt, answer, options, hints, rule, opts = {}) {
  return q(id, v, grade, prompt, answer, hints, rule, {
    ...opts,
    kind: "text",
    fields: [{ ...field(answer, "Choisis une réponse", "text"), options }],
  });
}
export const counts = {
  NC04: 6,
  NC05: 6,
  NC06: 4,
  NC07: 5,
  NC08: 7,
  NC09: 5,
  NC10: 6,
  NC11: 7,
  NC12: 7,
  NC13: 6,
  NC14: 7,
  NC15: 7,
  NC16: 5,
};
export const generators = {
  NC04(r, v = 0) {
    const rule =
      "Choisis une décomposition simple. Déplacer tous les chiffres d’un rang vers la gauche " +
      "multiplie le nombre par 10 ; vers la droite, il le divise par 10.";
    let a = r.int(2, 9),
      b = r.int(2, 9);
    if (v === 0) {
      let divide = r.bool(),
        expr = divide ? `${a * b} ÷ ${a}` : `${a} × ${b}`,
        ans = divide ? b : a * b;
      return q(
        "NC04",
        v,
        6,
        `Calcule ${expr}.`,
        ans,
        [
          hint(divide ? `Dans la table de ${a}, cherche ${a * b}.` : `Décompose ${b} si besoin.`),
          hint(
            divide ? `${a} × ? = ${a * b}` : `${a} × ${b - 1} + ${a}`,
            diagramLines([divide ? `${a} × ? = ${a * b}` : `${a} × ${b - 1} + ${a}`]),
          ),
        ],
        rule,
        { solution: `${expr} = ${ans}.` },
      );
    }
    if (v === 1) {
      let x = r.int(1, 59) / 10,
        y = r.int(1, 39) / 10,
        sum = (Math.round(x * 10) + Math.round(y * 10)) / 10,
        mode = r.int(0, 2),
        prompt =
          mode === 0
            ? `Complète : ${F(x)} + □ = ${F(sum)}.`
            : mode === 1
              ? `Calcule ${F(x)} + ${F(y)}.`
              : `Calcule ${F(sum)} − ${F(x)}.`,
        ans = mode === 1 ? sum : y;
      return q(
        "NC04",
        v,
        6,
        prompt,
        ans,
        [
          hint("Raisonne en dixièmes."),
          hint(
            mode === 1
              ? `${Math.round(x * 10)} + ${Math.round(y * 10)} dixièmes.`
              : `${F(sum)} − ${F(x)} = ?`,
            place(sum),
          ),
        ],
        rule,
        { solution: `${F(x)} + ${F(y)} = ${F(sum)}.` },
      );
    }
    if (v === 2) {
      let k = r.pick([19, 29, 39, 49, 99]);
      return q(
        "NC04",
        v,
        6,
        `Calcule ${a} × ${k}.`,
        a * k,
        [
          hint(`${k} est proche de ${k + 1}.`),
          hint(
            `Calcule ${a} × ${k + 1}, puis enlève ${a}.`,
            diagramLines([`${a} × (${k + 1} − 1)`]),
          ),
        ],
        rule,
        { solution: `${a} × ${k} = ${a * (k + 1)} − ${a} = ${a * k}.` },
      );
    }
    if (v === 3) {
      let x = r.int(1, 999) / 10,
        p = r.int(1, 3),
        divide = r.bool(),
        ans = divide ? x / 10 ** p : x * 10 ** p;
      return q(
        "NC04",
        v,
        6,
        `Calcule ${F(x)} ${divide ? "÷" : "×"} ${10 ** p}.`,
        ans,
        [
          hint(
            `La valeur de chaque chiffre devient ${10 ** p} fois ${divide ? "plus petite" : "plus grande"}.`,
          ),
          hint(
            `Déplace les chiffres de ${p} rang${p > 1 ? "s" : ""} vers la ${divide ? "droite" : "gauche"} dans le tableau.`,
            place(x),
          ),
        ],
        rule,
        { solution: `${F(x)} ${divide ? "÷" : "×"} ${10 ** p} = ${F(ans)}.` },
      );
    }
    if (v === 4) {
      let x = a / 10;
      return q(
        "NC04",
        v,
        6,
        `Calcule ${F(x)} × ${b}.`,
        (a * b) / 10,
        [
          hint(`${F(x)} représente ${a} dixièmes.`),
          hint(`Calcule ${a} × ${b} dixièmes.`, diagramLines([`${a} dixièmes × ${b}`])),
        ],
        rule,
        { solution: `${F(x)} × ${b} = ${a * b} dixièmes = ${F((a * b) / 10)}.` },
      );
    }
    let d = a / 10,
      n = (a * b) / 10;
    return q(
      "NC04",
      v,
      5,
      `Calcule ${F(n)} ÷ ${F(d)}.`,
      b,
      [
        hint("Multiplie les deux nombres par 10 : le quotient ne change pas."),
        hint(
          `${F(n)} ÷ ${F(d)} = ${a * b} ÷ ${a}.`,
          diagramLines([
            `${F(n)} / ${F(d)}`,
            `↓ × 10 au numérateur et au dénominateur`,
            `${a * b} / ${a}`,
          ]),
        ),
      ],
      rule,
      { solution: `${F(n)} ÷ ${F(d)} = ${a * b} ÷ ${a} = ${b}.` },
    );
  },
  NC05(r, v = 0) {
    const rule =
      "Deux opposés ont pour somme 0. Soustraire un nombre revient à ajouter son opposé.";
    let a = nonzero(r),
      b = nonzero(r),
      ans,
      expr,
      hs;
    if (v === 0) {
      a = nonzero(r, 1, 99) / 10;
      return q(
        "NC05",
        v,
        5,
        `Quel est l’opposé de ${F(a)} ?`,
        -a,
        [
          hint("L’opposé est à la même distance de 0, de l’autre côté."),
          hint(`${F(a)} + ? = 0.`, oppositeLine(a)),
        ],
        rule,
        { solution: `L’opposé de ${F(a)} est ${F(-a)}.` },
      );
    }
    if (v === 1) {
      a = -r.int(1, 12);
      b = -r.int(1, 12);
      ans = a + b;
      expr = `${a} + (${b})`;
      hs = [
        hint("Deux déplacements vers la gauche se cumulent."),
        hint(
          `Additionne les distances ${-a} et ${-b}, puis garde le signe −.`,
          numberLine(ans - 1, 0, [[a], [ans, "?"]]),
        ),
      ];
    } else if (v === 2) {
      a = -r.int(11, 90) / 10;
      b = r.int(11, 90) / 10;
      ans = (Math.round(a * 10) + Math.round(b * 10)) / 10;
      expr = `${F(a)} + ${F(b)}`;
      hs = [
        hint("Les deux déplacements sont de sens contraires."),
        hint(
          `Compare ${F(-a)} et ${F(b)} ; retire la plus petite distance de la plus grande.`,
          numberLine(Math.min(a, ans) - 1, Math.max(0, ans) + 1, [[a], [ans, "?"]]),
        ),
      ];
    } else if (v === 3) {
      a = r.int(-9, 9);
      b = -r.int(1, 9);
      ans = a - b;
      expr = `${a} − (${b})`;
      hs = [
        hint("Soustraire un négatif revient à ajouter son opposé."),
        hint(`${a} − (${b}) = ${a} + ${-b}.`, diagramLines([`${a} − (${b})`, `${a} + ${-b}`])),
      ];
    } else if (v === 4) {
      a = -r.int(1, 12);
      b = r.int(-5, 10);
      ans = b - a;
      expr = `${a} + □ = ${b}`;
      hs = [
        hint("Cherche le déplacement du premier nombre au résultat."),
        hint(
          `Le nombre manquant vaut ${b} − (${a}).`,
          numberLine(a - 1, Math.max(a, b) + 1, [[a], [b]]),
        ),
      ];
    } else {
      a = r.int(2, 12);
      b = r.int(1, 9);
      let c = r.int(1, 9);
      ans = b - c;
      expr = `−${a} + ${b} + ${a} − ${c}`;
      hs = [
        hint("Regroupe d’abord les deux nombres opposés."),
        hint(
          `−${a} + ${a} = 0 ; il reste ${b} − ${c}.`,
          diagramLines([`−${a} + ${a} → 0`, `${b} − ${c} → ?`]),
        ),
      ];
    }
    return q("NC05", v, 5, `${v === 4 ? "Complète" : "Calcule"} ${expr}.`, ans, hs, rule, {
      solution: v === 4 ? `${a} + ${F(ans)} = ${b}.` : `${expr} = ${F(ans)}.`,
    });
  },
  NC06(r, v = 0) {
    const rule =
      "Pour deux nombres non nuls : même signe, produit ou quotient positif ; signes " +
      "différents, négatif. On ne divise pas par 0.";
    let a = nonzero(r),
      b = nonzero(r);
    if (v === 2) {
      let xs = Array.from({ length: r.int(3, 5) }, () => nonzero(r)),
        neg = xs.filter((x) => x < 0).length,
        ans = neg % 2 ? "Négatif" : "Positif";
      return choice(
        "NC06",
        v,
        4,
        `Sans calculer, donne le signe de ${xs.map((x) => `(${x})`).join(" × ")}.`,
        ans,
        ["Positif", "Négatif"],
        [
          hint("Compte les facteurs négatifs."),
          hint(
            `${neg} facteur${neg > 1 ? "s" : ""} négatif${neg > 1 ? "s" : ""} : un nombre ${neg % 2 ? "impair" : "pair"}.`,
            diagramLines(xs.map((x) => (x < 0 ? "−" : "+"))),
          ),
        ],
        rule,
        { solution: `${neg} facteurs négatifs : le produit est ${ans.toLowerCase()}.` },
      );
    }
    let expr =
        v === 0 ? `(${a}) × (${b})` : v === 1 ? `(${a * b}) ÷ (${a})` : `(${a}) × □ = ${a * b}`,
      ans = v === 0 ? a * b : b;
    return q(
      "NC06",
      v,
      4,
      `${v === 3 ? "Complète" : "Calcule"} ${expr}.`,
      ans,
      [
        hint("Détermine le signe avant la valeur."),
        hint(
          v === 0
            ? `Calcule ${Math.abs(a)} × ${Math.abs(b)}.`
            : `Utilise ${Math.abs(a * b)} ÷ ${Math.abs(a)}.`,
          diagramLines([
            v === 0 ? `${Math.abs(a)} × ${Math.abs(b)}` : `${Math.abs(a * b)} ÷ ${Math.abs(a)}`,
          ]),
        ),
      ],
      rule,
      { solution: v === 3 ? `(${a}) × (${b}) = ${a * b}.` : `${expr} = ${ans}.` },
    );
  },
  NC07(r, v = 0) {
    const rule =
      "Parenthèses, puissances, produits et quotients, puis sommes et différences. À priorité égale : de gauche à droite.";
    let a = r.int(2, 9),
      b = r.int(2, 9),
      c = r.int(2, 9),
      expr,
      ans,
      step,
      grade = 5;
    if (v === 0) {
      let x = r.int(11, 49) / 10,
        y = r.int(11, 49) / 10;
      expr = `${F(x)} − ${F(y)} + ${b} × ${c}`;
      ans = (Math.round(x * 10) - Math.round(y * 10) + 10 * b * c) / 10;
      step = `D’abord ${b} × ${c} = ${b * c}.`;
    } else if (v === 1) {
      expr = `(${a + b} − ${a}) × ${c}`;
      ans = b * c;
      step = `D’abord ${a + b} − ${a} = ${b}.`;
    } else if (v === 2) {
      expr = `${a * b} ÷ ${a} × ${c}`;
      ans = b * c;
      step = `À gauche : ${a * b} ÷ ${a} = ${b}.`;
    } else if (v === 3) {
      expr = `${a} + ${b} × ${c}²`;
      ans = a + b * c * c;
      step = `D’abord ${c}² = ${c * c}, puis ${b} × ${c * c}.`;
    } else {
      expr = `(${a * b + c} − ${c}) / ${a}`;
      ans = b;
      step = `Toute la différence est au numérateur : ${a * b + c} − ${c} = ${a * b}.`;
      grade = 5;
    }
    return q(
      "NC07",
      v,
      grade,
      `Calcule ${expr}.`,
      ans,
      [
        hint(
          v === 1 || v === 4
            ? "Commence par le groupe entre parenthèses."
            : v === 3
              ? "La puissance est prioritaire."
              : v === 2
                ? "Division et multiplication ont la même priorité."
                : "Le produit est prioritaire.",
        ),
        hint(
          step,
          diagramLines([expr, step.length < 62 ? step : "Calcule d’abord le numérateur."]),
        ),
      ],
      rule,
      { solution: `${expr} = ${F(ans)}.` },
    );
  },
  NC08(r, v = 0) {
    const rule =
      "Pour b non nul, a/b est le quotient a ÷ b. Une même quantité peut avoir plusieurs écritures.";
    let d = r.pick([2, 4, 5, 10]),
      a = r.int(1, d - 1);
    if (v === 6) {
      d = r.pick([2, 4, 5, 10, 20]);
      a = r.int(1, d);
      return q(
        "NC08",
        v,
        6,
        `Écris ${a}/${d} sous forme de pourcentage.`,
        (a * 100) / d,
        [
          hint(
            "Un pourcentage s’écrit avec 100 au dénominateur.",
            band(a, d, `${a}/${d} de l’unité`),
          ),
          hint(
            `Multiplie le numérateur et le dénominateur par ${100 / d}.`,
            diagramLines([`${a}/${d} = (${a} × ${100 / d}) / 100`]),
          ),
        ],
        rule,
        { unit: "%", solution: `${a}/${d} = ${(a * 100) / d}/100 = ${(a * 100) / d} %.` },
      );
    }
    if (v === 0)
      return q(
        "NC08",
        v,
        6,
        `Écris ${a}/${d} sous forme décimale.`,
        a / d,
        [
          hint(`Partage 1 en ${d} parts égales.`, band(a, d, `${a}/${d} de l’unité`)),
          hint(`Calcule ${a} ÷ ${d}.`),
        ],
        rule,
        { solution: `${a}/${d} = ${F(a / d)}.` },
      );
    if (v === 1) {
      let n = r.int(1, 99);
      return q(
        "NC08",
        v,
        6,
        `Écris ${F(n / 100)} sous forme d’une fraction.`,
        frac(n, 100),
        [
          hint("Lis le nombre de centièmes.", place(n / 100)),
          hint(`${n} centièmes s’écrivent avec 100 au dénominateur.`),
        ],
        rule,
        { kind: "fraction", solution: `${F(n / 100)} = ${n}/100 = ${frac(n, 100)}.` },
      );
    }
    if (v === 2) {
      let whole = r.int(1, 3),
        n = whole * d + a;
      return q(
        "NC08",
        v,
        6,
        `Complète : ${n}/${d} = □ + □/${d}, avec la dernière fraction inférieure à 1.`,
        [whole, a],
        [
          hint(`Une unité contient ${d}/${d}.`, band(n, d, `${n} parts de taille 1/${d}`)),
          hint(`Groupe les parts par ${d} ; compte les unités puis le reste.`),
        ],
        rule,
        {
          fields: boxes(["Partie entière", `Numérateur sur ${d}`], [whole, a]),
          solution: `${n}/${d} = ${whole} + ${a}/${d}.`,
        },
      );
    }
    if (v === 3) {
      let n = r.int(1, 99);
      return q(
        "NC08",
        v,
        6,
        `Écris ${n} % sous forme d’une fraction.`,
        frac(n, 100),
        [
          hint("Pour cent signifie sur 100."),
          hint(`${n} % représente ${n} parts sur 100.`, diagramLines([`${n} %`, `${n} / 100`])),
        ],
        rule,
        { kind: "fraction", solution: `${n} % = ${n}/100 = ${frac(n, 100)}.` },
      );
    }
    if (v === 4) {
      let length = r.int(1, 9),
        people = r.pick([2, 4, 5, 8]);
      return q(
        "NC08",
        v,
        6,
        `On partage équitablement ${length} m de ruban entre ${people} personnes. Quelle longueur reçoit chacune ?`,
        frac(length, people),
        [
          hint(
            `Partage les ${length} mètres en ${people} parts égales.`,
            groups(length, people, 1, "Chaque part a la même longueur."),
          ),
          hint(`Une personne reçoit (${length} ÷ ${people}) m.`),
        ],
        rule,
        {
          kind: "fraction",
          unit: "m",
          solution: `Chaque personne reçoit ${length}/${people} m = ${F(length / people)} m.`,
        },
      );
    }
    let x = r.int(2, 8),
      val = x / 5,
      opts = [`${2 * x}/10`, `${x}/5`, `${x}%`],
      answers = ["Oui", "Oui", "Non"];
    return q(
      "NC08",
      v,
      6,
      `Pour chaque écriture, indique si elle est égale à ${F(val)}.`,
      answers,
      [
        hint("Transforme les fractions en dixièmes."),
        hint(`${x} % = ${x}/100, tandis que ${x}/5 = ${2 * x}/10.`, band(x, 5, `${x}/5`)),
      ],
      rule,
      {
        fields: opts.map((o, i) => ({ ...field(answers[i], o, "text"), options: ["Oui", "Non"] })),
        check: { type: "fields", values: answers },
        solution: `${2 * x}/10 et ${x}/5 valent ${F(val)} ; ${x} % vaut ${F(x / 100)}.`,
      },
    );
  },
  NC09(r, v = 0) {
    const rule = "Multiplie ou divise le numérateur ET le dénominateur par le même nombre non nul.";
    let d = r.int(2, 9),
      a = r.int(1, d + 3);
    while (gcd(a, d) !== 1) a++;
    let k = r.int(2, 6);
    if (v === 0)
      return q(
        "NC09",
        v,
        6,
        `Complète : ${a}/${d} = □/${d * k}.`,
        a * k,
        [
          hint(`Le dénominateur est multiplié par ${k}.`, diagramLines([`${d} × ${k} = ${d * k}`])),
          hint(`Fais aussi ${a} × ${k} au numérateur.`),
        ],
        rule,
        { solution: `${a}/${d} = ${a * k}/${d * k}.` },
      );
    if (v === 1)
      return q(
        "NC09",
        v,
        6,
        `Complète : ${a}/${d} = ${a * k}/□.`,
        d * k,
        [
          hint(`Le numérateur est multiplié par ${k}.`),
          hint(
            `Multiplie aussi ${d} par ${k}.`,
            diagramLines([`${a} × ${k} = ${a * k}`, `${d} × ${k} = ?`]),
          ),
        ],
        rule,
        { solution: `${a}/${d} = ${a * k}/${d * k}.` },
      );
    if (v === 2)
      return q(
        "NC09",
        v,
        6,
        `Divise le numérateur et le dénominateur de ${a * k}/${d * k} par ${k}. Complète la nouvelle fraction.`,
        [a, d],
        [
          hint(`Les parts sont regroupées par ${k}.`),
          hint(
            `Calcule ${a * k} ÷ ${k} et ${d * k} ÷ ${k}.`,
            diagramLines([`(${a * k} ÷ ${k}) / (${d * k} ÷ ${k})`]),
          ),
        ],
        rule,
        {
          fields: boxes(["Numérateur", "Dénominateur"], [a, d]),
          solution: `${a * k}/${d * k} = ${a}/${d}.`,
        },
      );
    if (v === 3)
      return q(
        "NC09",
        v,
        3,
        `Écris ${a * k}/${d * k} sous forme irréductible.`,
        frac(a, d),
        [
          hint("Cherche un diviseur commun."),
          hint(
            `${a * k} = ${k} × ${a} et ${d * k} = ${k} × ${d}.`,
            diagramLines([`(${k} × ${a}) / (${k} × ${d})`]),
          ),
        ],
        rule,
        {
          kind: "fraction",
          form: "irreducible",
          solution: `${a * k}/${d * k} = ${a}/${d} ; ${a} et ${d} sont premiers entre eux.`,
        },
      );
    return q(
      "NC09",
      v,
      4,
      `Simplifie (−${a * k})/${d * k}.`,
      -a + "/" + d,
      [
        hint("Le signe − reste celui de la fraction."),
        hint(
          `Divise ${a * k} et ${d * k} par ${k}.`,
          diagramLines([`− (${a * k} ÷ ${k}) / (${d * k} ÷ ${k})`]),
        ),
      ],
      rule,
      { kind: "fraction", solution: `(−${a * k})/${d * k} = −${a}/${d}.` },
    );
  },
  NC10(r, v = 0) {
    const rule = "Compare des parts de même taille, ou utilise les repères 1 et 1/2.";
    let a, b, c, d, hs;
    if (v === 4) {
      let base = r.int(0, 3),
        ds = [base + 0.25, base + 0.03, base + 0.75],
        sorted = [...ds].sort((x, y) => x - y);
      return q(
        "NC10",
        v,
        6,
        `Range par ordre croissant : ${F(ds[0])} ; ${base} + 3/100 ; ${4 * base + 3}/4.`,
        sorted,
        [
          hint("Choisis une même écriture pour comparer."),
          hint("Écris les trois nombres sous forme décimale.", diagramLines(ds.map(F))),
        ],
        rule,
        {
          fields: boxes(["Le plus petit", "Au milieu", "Le plus grand"], sorted),
          solution: sorted.map(F).join(" < "),
        },
      );
    }
    if (v === 0) {
      b = d = r.int(4, 12);
      a = r.int(1, b - 2);
      c = a + r.int(1, 2);
      hs = [
        hint(
          "Les parts ont la même taille.",
          bars([
            [a, b, `${a}/${b}`],
            [c, d, `${c}/${d}`],
          ]),
        ),
        hint(`Compare les numérateurs ${a} et ${c}.`),
      ];
    } else if (v === 1) {
      a = c = r.int(1, 4);
      b = r.int(a + 1, a + 4);
      d = b + r.int(1, 4);
      hs = [
        hint(
          "Même numérateur : compare la taille des parts.",
          bars([
            [a, b, `${a}/${b}`],
            [c, d, `${c}/${d}`],
          ]),
        ),
        hint("Plus le partage est fin, plus chaque part est petite."),
      ];
    } else if (v === 2) {
      b = r.int(3, 9);
      a = b - 1;
      d = r.int(3, 9);
      c = d + 1;
      hs = [
        hint("Utilise le repère 1."),
        hint(
          `${a}/${b} < 1 et ${c}/${d} > 1.`,
          diagramLines([`${a}/${b}   <   1   <   ${c}/${d}`]),
        ),
      ];
    } else if (v === 3) {
      b = 2 * r.int(2, 6);
      d = 2 * r.int(2, 6);
      a = b / 2 - 1;
      c = d / 2 + 1;
      hs = [
        hint(
          "Utilise le repère 1/2.",
          bars(
            [
              [a, b, `${a}/${b}`],
              [c, d, `${c}/${d}`],
            ],
            true,
          ),
        ),
        hint(`${a}/${b} < 1/2 et ${c}/${d} > 1/2.`),
      ];
    } else {
      b = r.pick([3, 4, 6, 8]);
      d = r.pick([3, 4, 6, 8]);
      a = -r.int(1, b);
      c = -r.int(1, d);
      hs = [
        hint("Compare les distances à 0, puis inverse l’ordre."),
        hint(
          `Compare ${-a * d}/${b * d} et ${-c * b}/${b * d} avant de remettre les signes −.`,
          diagramLines([`${a * d}/${b * d}`, `${c * b}/${b * d}`]),
        ),
      ];
    }
    if (v < 4 && r.bool()) {
      [a, c] = [c, a];
      [b, d] = [d, b];
    }
    let answer = cmp(a * d, c * b);
    return choice(
      "NC10",
      v,
      v === 5 ? 4 : 6,
      `Complète : ${a}/${b} □ ${c}/${d}.`,
      answer,
      ["<", "=", ">"],
      hs,
      rule,
      { solution: `${a}/${b} ${answer} ${c}/${d}.` },
    );
  },
  NC11(r, v = 0) {
    const rule = "Même dénominateur : calcule les numérateurs et garde la taille des parts.";
    let a,
      b,
      c,
      d,
      op = "+",
      grade = 6,
      extra = {};
    if (v === 0) {
      b = d = r.int(3, 12);
      a = r.int(1, b);
      c = r.int(1, b);
    } else if (v === 1) {
      a = 1;
      b = 1;
      d = r.int(3, 12);
      c = r.int(1, d - 1);
      op = "−";
    } else if (v === 2) {
      b = r.int(2, 6);
      d = b * r.int(2, 3);
      a = 1;
      c = r.int(1, d - 1);
    } else if (v === 3) {
      b = r.pick([3, 4, 5]);
      d = r.pick([7, 8]);
      a = b - 1;
      c = 1;
      op = "−";
      grade = 3;
      extra.form = "irreducible";
    } else if (v === 4) {
      b = r.pick([3, 4, 6]);
      d = b * 2;
      a = -r.int(1, b - 1);
      c = 1;
      grade = 4;
    } else if (v === 6) {
      [b, d] = r.pick([
        [3, 4],
        [4, 3],
        [3, 5],
        [5, 3],
        [4, 5],
        [5, 4],
        [3, 8],
        [8, 3],
        [5, 8],
        [8, 5],
        [3, 7],
        [7, 3],
      ]);
      a = r.int(1, 2 * b - 1);
      c = r.int(1, 2 * d - 1);
      grade = 6;
    } else {
      b = r.pick([2, 3, 4]);
      d = r.pick([5, 6]);
      a = r.int(1, b - 1);
      c = r.int(1, d - 1);
      let target = rat(a * d + c * b, b * d),
        expr = `□ + ${a}/${b} = ${target.join("/")}`;
      return q(
        "NC11",
        v,
        5,
        `Complète : ${expr}.`,
        frac(c, d),
        [
          hint("Enlève la fraction connue au résultat."),
          hint(
            `Calcule ${target.join("/")} − ${a}/${b}.`,
            diagramLines([`${target.join("/")} − ${a}/${b}`]),
          ),
        ],
        rule,
        { kind: "fraction", solution: `${frac(c, d)} + ${a}/${b} = ${target.join("/")}.` },
      );
    }
    let l = (b * d) / gcd(b, d),
      aa = (a * l) / b,
      cc = (c * l) / d,
      n = op === "+" ? aa + cc : aa - cc,
      expr = `${a}/${b} ${op} ${c}/${d}`;
    let vis =
      a >= 0 && c >= 0 && a <= b && c <= d
        ? bars([
            [a, b, `${a}/${b}`],
            [c, d, `${c}/${d}`],
          ])
        : diagramLines([`${aa}/${l} ${op} ${cc}/${l}`]);
    return q(
      "NC11",
      v,
      grade,
      `Calcule ${expr}.${v === 3 ? " Donne une fraction irréductible." : ""}`,
      frac(n, l),
      [
        hint("Les parts doivent avoir la même taille.", vis),
        hint(
          b === d
            ? `Le dénominateur reste ${b}. Calcule ${aa} ${op} ${cc}.`
            : `${a}/${b} = ${aa}/${l} ; ${c}/${d} = ${cc}/${l}. Calcule ${aa} ${op} ${cc}.`,
        ),
      ],
      rule,
      {
        kind: "fraction",
        ...extra,
        solution:
          b === d
            ? `${expr} = ${frac(n, l)}.`
            : `${expr} = ${aa}/${l} ${op} ${cc}/${l} = ${frac(n, l)}.`,
      },
    );
  },
  NC12(r, v = 0) {
    const rule =
      "Multiplie les numérateurs et les dénominateurs. Diviser par une fraction non nulle " +
      "revient à multiplier par son inverse.";
    let a = r.int(1, 5),
      b = r.int(2, 7),
      c = r.int(1, 5),
      d = r.int(2, 7),
      expr,
      ans,
      hs,
      grade = 4;
    if (v === 0) {
      a = r.int(2, 5);
      b = r.int(2, 9);
      c = r.int(1, b - 1);
      expr = `${a} × ${c}/${b}`;
      ans = frac(a * c, b);
      grade = 6;
      hs = [
        hint(
          `Prends ${a} fois ${c}/${b}.`,
          bars(Array.from({ length: a }, () => [c, b, `${c}/${b}`])),
        ),
        hint(`Multiplie le numérateur ${c} par ${a} ; garde ${b}.`),
      ];
    } else if (v === 1) {
      expr = `${a}/${b} × ${c}/${d}`;
      ans = frac(a * c, b * d);
      hs = [
        hint("Les numérateurs se multiplient entre eux ; les dénominateurs aussi."),
        hint(
          `Calcule (${a} × ${c}) / (${b} × ${d}).`,
          diagramLines([`(${a} × ${c}) / (${b} × ${d})`]),
        ),
      ];
    } else if (v === 2) {
      a = r.int(2, 5);
      d = a * r.int(2, 4);
      c = r.int(2, 5);
      b = c * r.int(2, 4);
      expr = `${a}/${b} × ${c}/${d}`;
      ans = frac(a * c, b * d);
      hs = [
        hint("Cherche des facteurs communs avant de multiplier."),
        hint(
          `Dans (${a} × ${c}) / (${b} × ${d}), simplifie les facteurs.`,
          diagramLines([`(${a} × ${c}) / (${c} × ${b / c} × ${a} × ${d / a})`]),
        ),
      ];
    } else if (v === 3) {
      a = nonzero(r, 1, 9);
      b = r.int(2, 9);
      expr = `l’inverse de ${a}/${b}`;
      ans = frac(b, a);
      hs = [
        hint("Un nombre non nul multiplié par son inverse donne 1."),
        hint(
          "Échange numérateur et dénominateur, en gardant le signe.",
          diagramLines([`${a}/${b} × ? = 1`]),
        ),
      ];
    } else if (v === 4) {
      expr = `(${a}/${b}) ÷ (${c}/${d})`;
      ans = frac(a * d, b * c);
      hs = [
        hint("Inverse seulement la fraction par laquelle tu divises."),
        hint(
          `(${a}/${b}) ÷ (${c}/${d}) = ${a}/${b} × ${d}/${c}.`,
          diagramLines([`${a}/${b} × ${d}/${c}`]),
        ),
      ];
    } else if (v === 5) {
      b = r.int(2, 5);
      a = r.int(1, b - 1);
      d = r.int(2, 5);
      c = r.int(1, d - 1);
      expr = `${a}/${b} de ${c}/${d} de l’unité`;
      ans = frac(a * c, b * d);
      hs = [
        hint("La partie commune reçoit les deux partages.", areaProduct(a, b, c, d)),
        hint(
          `Compte ${a * c} cases communes parmi ${b * d} cases : le produit vaut (${a} × ${c}) / (${b} × ${d}).`,
        ),
      ];
    } else {
      b = r.int(2, 6);
      d = r.int(2, 6);
      a = 1;
      c = b;
      expr = `1/${d} + ${a}/${b} × ${c}/${d}`;
      ans = frac(2, d);
      hs = [
        hint("Le produit est prioritaire sur la somme."),
        hint(
          `${a}/${b} × ${c}/${d} = 1/${d} ; il reste 1/${d} + 1/${d}.`,
          diagramLines([`1/${d} + (1/${b} × ${b}/${d})`, `1/${d} + 1/${d}`]),
        ),
      ];
    }
    return q(
      "NC12",
      v,
      grade,
      v === 3
        ? `Quel est ${expr} ?`
        : v === 5
          ? `Quelle fraction représente ${expr} ?`
          : `Calcule ${expr}.`,
      ans,
      hs,
      rule,
      {
        kind: "fraction",
        solution:
          v === 3
            ? `L’inverse de ${a}/${b} est ${ans}.`
            : v === 5
              ? `${a}/${b} × ${c}/${d} = ${ans}.`
              : `${expr} = ${ans}.`,
      },
    );
  },
  NC13(r, v = 0) {
    const rule =
      "Une part vaut le tout divisé par b. Pour obtenir a/b du tout, multiplie cette valeur par a.";
    let b = r.int(2, 6),
      a = r.int(1, b - 1),
      part = r.int(2, 9),
      total = b * part,
      ans,
      prompt,
      hs;
    if (v === 0) {
      a = 1;
      ans = part;
      prompt = `Calcule 1/${b} de ${total}.`;
      hs = [
        hint(`Partage ${total} en ${b} parts égales.`, groups(total, b, 1)),
        hint(`Calcule ${total} ÷ ${b}.`),
      ];
    } else if (v === 1) {
      ans = a * part;
      prompt = `Calcule ${a}/${b} de ${total}.`;
      hs = [
        hint(`Partage en ${b} parts, puis prends-en ${a}.`, groups(total, b, a)),
        hint(`Une part vaut ${total} ÷ ${b} = ${part}. Calcule ${part} × ${a}.`),
      ];
    } else if (v === 2) {
      ans = (b - a) * part;
      prompt = `Une boîte contient ${total} jetons. On en retire ${a}/${b}. Combien en reste-t-il ?`;
      hs = [
        hint(
          `Il reste ${b - a} parts sur ${b}.`,
          groups(total, b, b - a, "Les parts colorées restent dans la boîte."),
        ),
        hint(`Calcule ${total} ÷ ${b} × ${b - a}.`),
      ];
    } else if (v === 3) {
      ans = total;
      prompt = `Un nombre multiplié par ${a}/${b} donne ${a * part}. Quel est ce nombre ?`;
      hs = [
        hint(`${a} part${a > 1 ? "s valent" : " vaut"} ${a * part}. Cherche une part.`),
        hint(
          `Une part vaut ${a * part} ÷ ${a} = ${part}. Le tout contient ${b} parts.`,
          groups("?", b, a, `${a} part${a > 1 ? "s valent" : " vaut"} ${a * part}`),
        ),
      ];
    } else if (v === 4) {
      b = 4;
      a = 3;
      total = 2 * r.int(1, 8) + 1;
      ans = frac(a * total, b);
      prompt = `Calcule ${a}/${b} de ${total}.`;
      hs = [
        hint("Une part peut avoir une valeur décimale.", groups(total, b, a)),
        hint(`Calcule (${total} × ${a}) ÷ ${b}.`),
      ];
    } else {
      a = b + r.int(1, 2);
      ans = a * part;
      prompt = `Calcule ${a}/${b} de ${total}.`;
      hs = [
        hint(`La fraction dépasse 1 : le résultat dépassera ${total}.`),
        hint(
          `Une part vaut ${total} ÷ ${b} = ${part}. Prends-en ${a}.`,
          band(a, b, `${a}/${b} fois le tout`),
        ),
      ];
    }
    return q("NC13", v, v === 3 || v === 5 ? 5 : 6, prompt, ans, hs, rule, {
      solution:
        v === 3
          ? `${a * part} ÷ ${a} × ${b} = ${total}.`
          : v === 2
            ? `Il reste ${b - a}/${b} des jetons : ${b - a}/${b} × ${total} = ${F(ans)} jetons.`
            : `${a}/${b} × ${total} = ${typeof ans === "number" ? F(ans) : ans}.`,
      unit: v === 2 ? "jetons" : "",
    });
  },
  NC14(r, v = 0) {
    const rule =
      "a² = a × a ; a³ = a × a × a. Pour A ≥ 0, √A est le nombre positif ou nul dont le carré vaut A.";
    let a = r.int(0, 12);
    if (v === 0)
      return q(
        "NC14",
        v,
        5,
        `Calcule ${a}².`,
        a * a,
        [
          hint("Au carré : un produit de deux facteurs identiques."),
          hint(
            `${a}² = ${a} × ${a}.`,
            a
              ? svg(
                  rect(40, 35, 130, 130) +
                    text(75, 25, String(a), 22) +
                    text(180, 105, String(a), 22),
                  250,
                  185,
                )
              : svg(circle(125, 75, 4, "#176d5b") + text(85, 125, "0 × 0", 22), 250, 160),
          ),
        ],
        rule,
        { solution: `${a}² = ${a} × ${a} = ${a * a}.` },
      );
    if (v === 1) {
      a = r.int(0, 5);
      return q(
        "NC14",
        v,
        5,
        `Calcule ${a}³.`,
        a ** 3,
        [
          hint("Au cube : un produit de trois facteurs identiques."),
          hint(
            `${a}³ = ${a} × ${a} × ${a}.`,
            diagramLines([`${a} × ${a} × ${a}`, `${a * a} × ${a}`]),
          ),
        ],
        rule,
        { solution: `${a}³ = ${a} × ${a} × ${a} = ${a ** 3}.` },
      );
    }
    if (v === 2) {
      a = r.int(1, 12);
      return q(
        "NC14",
        v,
        4,
        `Un carré a une aire de ${a * a} cm². Quelle est la longueur de son côté ?`,
        a,
        [
          hint(
            "La longueur du côté au carré donne l’aire.",
            svg(
              rect(40, 35, 160, 160) + text(66, 120, `${a * a} cm²`, 24) + text(105, 25, "?", 24),
              250,
              220,
            ),
          ),
          hint(`Cherche ? × ? = ${a * a}, avec deux facteurs égaux.`),
        ],
        rule,
        { unit: "cm", solution: `${a} × ${a} = ${a * a} : le côté mesure ${a} cm.` },
      );
    }
    if (v === 3)
      return q(
        "NC14",
        v,
        4,
        `Calcule √${a * a}.`,
        a,
        [
          hint("La racine carrée est positive ou nulle."),
          hint(`Quel nombre a pour carré ${a * a} ?`, diagramLines([`? × ? = ${a * a}`])),
        ],
        rule,
        { solution: `√${a * a} = ${a}, car ${a}² = ${a * a}.` },
      );
    if (v === 4) {
      a = r.int(1, 11);
      let n = r.int(a * a + 1, (a + 1) ** 2 - 1);
      return q(
        "NC14",
        v,
        4,
        `Complète avec deux entiers consécutifs : □ < √${n} < □.`,
        [a, a + 1],
        [
          hint("Encadre le nombre sous la racine par deux carrés."),
          hint(
            `${a}² = ${a * a} < ${n} < ${(a + 1) ** 2} = ${a + 1}².`,
            numberLine(a * a, (a + 1) ** 2, [[n]]),
          ),
        ],
        rule,
        {
          fields: boxes(["Borne inférieure", "Borne supérieure"], [a, a + 1]),
          solution: `${a * a} < ${n} < ${(a + 1) ** 2}, donc ${a} < √${n} < ${a + 1}.`,
        },
      );
    }
    if (v === 5) {
      a = r.int(1, 12);
      let paren = r.bool(),
        ans = paren ? a * a : -a * a,
        expr = paren ? `(−${a})²` : `−${a}²`;
      return q(
        "NC14",
        v,
        4,
        `Calcule ${expr}.`,
        ans,
        [
          hint(
            paren
              ? "Les parenthèses incluent le signe − dans le carré."
              : "Sans parenthèses, seul le nombre est élevé au carré.",
          ),
          hint(
            paren ? `(−${a}) × (−${a}).` : `−(${a} × ${a}).`,
            diagramLines([paren ? `(−${a}) × (−${a})` : `− (${a} × ${a})`]),
          ),
        ],
        rule,
        { solution: `${expr} = ${ans}.` },
      );
    }
    a = r.int(1, 5);
    return q(
      "NC14",
      v,
      5,
      "" +
        "Un cube est formé de " +
        a ** 3 +
        " petit" +
        (a > 1 ? "s cubes" : " cube") +
        " d’arête 1 cm. Quelle est la longueur de l’arête de ce cube ?",
      a,
      [
        hint("Il y a le même nombre de petits cubes dans les trois directions."),
        hint(
          `Cherche ? × ? × ? = ${a ** 3}.`,
          diagramLines([`? couches × ? rangées × ? cubes = ${a ** 3}`]),
        ),
      ],
      rule,
      { unit: "cm", solution: `${a} × ${a} × ${a} = ${a ** 3} : l’arête mesure ${a} cm.` },
    );
  },
  NC15(r, v = 0) {
    const rule =
      "Même base : additionne les exposants pour un produit, soustrais-les pour un quotient. a⁻ⁿ = 1/aⁿ pour a non nul.";
    let a = r.int(2, 7),
      n = r.int(2, 5),
      m = r.int(2, 5);
    if (v === 0)
      return q(
        "NC15",
        v,
        4,
        `Écris ${Array(n).fill(a).join(" × ")} sous la forme aⁿ.`,
        [a, n],
        [
          hint("La base est le facteur répété."),
          hint(
            `Compte les ${n} facteurs, pas les signes ×.`,
            diagramLines([Array(n).fill(a).join(" × ")]),
          ),
        ],
        rule,
        {
          fields: boxes(["Base a", "Exposant n"], [a, n]),
          solution: `${Array(n).fill(a).join(" × ")} = ${pwr(a, n)}.`,
        },
      );
    if (v === 1)
      return q(
        "NC15",
        v,
        4,
        `Complète : ${pwr(a, n)} × ${pwr(a, m)} = ${a}ⁿ.`,
        n + m,
        [
          hint("Les deux puissances ont la même base."),
          hint(`Il y a ${n} facteurs, puis ${m} autres.`, diagramLines([`${n} + ${m} = ?`])),
        ],
        rule,
        {
          fields: [field(n + m, "Exposant n")],
          solution: `${pwr(a, n)} × ${pwr(a, m)} = ${pwr(a, n + m)}.`,
        },
      );
    if (v === 2) {
      let b = r.int(2, 6);
      return q(
        "NC15",
        v,
        4,
        `Écris ${pwr(a, n)} × ${pwr(b, n)} sous la forme d’une seule puissance aⁿ.`,
        [a * b, n],
        [
          hint("Les deux exposants sont identiques."),
          hint(
            `Regroupe les facteurs ${a} × ${b}, répétés ${n} fois.`,
            diagramLines([`(${a} × ${b})${sup(n)}`]),
          ),
        ],
        rule,
        {
          fields: boxes(["Base a", "Exposant n"], [a * b, n]),
          solution: `${pwr(a, n)} × ${pwr(b, n)} = ${pwr(a * b, n)}.`,
        },
      );
    }
    if (v === 3) {
      n = -r.int(0, 5);
      return q(
        "NC15",
        v,
        3,
        `Écris ${pwr(10, n)} sous forme décimale.`,
        10 ** n,
        [
          hint(
            n === 0
              ? "Toute base non nulle à la puissance 0 vaut 1."
              : `Un exposant négatif indique l’inverse de ${pwr(10, -n)}.`,
          ),
          hint(
            n === 0 ? "10¹ ÷ 10 = 10⁰." : `${pwr(10, n)} = 1/${10 ** -n}.`,
            diagramLines([n === 0 ? "10 ÷ 10" : `1 / ${10 ** -n}`]),
          ),
        ],
        rule,
        { solution: `${pwr(10, n)} = ${F(10 ** n)}.` },
      );
    }
    if (v === 4) {
      n = r.int(-3, 5);
      m = r.int(-3, 5);
      return q(
        "NC15",
        v,
        3,
        `Complète : ${pwr(10, n)} ÷ ${pwr(10, m)} = 10ⁿ.`,
        n - m,
        [
          hint("Pour un quotient de même base, soustrais les exposants."),
          hint(`Calcule ${n} − (${m}).`, diagramLines([`${n} − (${m})`])),
        ],
        rule,
        {
          fields: [field(n - m, "Exposant n")],
          solution: `${pwr(10, n)} ÷ ${pwr(10, m)} = ${pwr(10, n - m)}.`,
        },
      );
    }
    if (v === 5) {
      let k = r.int(2, 3),
        j = r.int(2, 4),
        neg = r.int(1, 5),
        exp = k * j - neg;
      return q(
        "NC15",
        v,
        3,
        `Complète : ${pwr(10 ** k, j)} × ${pwr(10, -neg)} = 10ⁿ.`,
        exp,
        [
          hint(`${10 ** k} = ${pwr(10, k)}.`),
          hint(
            `Il y a ${k} × ${j} facteurs 10, puis un exposant −${neg}.`,
            diagramLines([`${k} × ${j} − ${neg}`]),
          ),
        ],
        rule,
        {
          fields: [field(exp, "Exposant n")],
          solution: `${pwr(10 ** k, j)} × ${pwr(10, -neg)} = ${pwr(10, exp)}.`,
        },
      );
    }
    let x = r.int(11, 49),
      y = r.int(2, 9),
      z = r.int(11, 49),
      ans = (x * 1000 - y * 1000 + z) / 100;
    return q(
      "NC15",
      v,
      3,
      `Calcule ${F(x / 10)} × 10² − ${y} × 10 + ${F(z / 10)} × 10⁻¹.`,
      ans,
      [
        hint("Calcule séparément chaque produit par une puissance de 10."),
        hint(
          `${x * 10} − ${y * 10} + ${F(z / 100)}.`,
          diagramLines([`${x * 10} − ${y * 10} + ${F(z / 100)}`]),
        ),
      ],
      rule,
      { solution: `${x * 10} − ${y * 10} + ${F(z / 100)} = ${F(ans)}.` },
    );
  },
  NC16(r, v = 0) {
    const rule =
      "Un nombre strictement positif s’écrit en notation scientifique a × 10ⁿ, avec 1 ≤ a < 10 et n entier.";
    let a = r.int(101, 999) / 100,
      n = r.int(2, 6),
      prompt,
      hs;
    if (v === 4) {
      let b = r.int(10, 99) / 10,
        m = n + r.int(-1, 1),
        ans = cmp(a * 10 ** n, b * 10 ** m);
      return choice(
        "NC16",
        v,
        3,
        `Complète : ${F(a)} × ${pwr(10, n)} □ ${F(b)} × ${pwr(10, m)}.`,
        ans,
        ["<", "=", ">"],
        [
          hint("Compare les exposants ; à exposants égaux, compare les mantisses."),
          hint(
            `${F(a * 10 ** n)} et ${F(b * 10 ** m)}.`,
            diagramLines([F(a * 10 ** n), F(b * 10 ** m)]),
          ),
        ],
        rule,
        { solution: `${F(a * 10 ** n)} ${ans} ${F(b * 10 ** m)}.` },
      );
    }
    if (v === 1) n = -r.int(1, 5);
    if (v === 2) {
      n = r.int(-5, 5);
      return q(
        "NC16",
        v,
        3,
        `Écris ${F(a)} × ${pwr(10, n)} sous forme décimale.`,
        a * 10 ** n,
        [
          hint(n < 0 ? `Multiplie par 1/${10 ** -n}.` : `Multiplie par ${10 ** n}.`),
          hint(
            `${
              n === 0
                ? "Multiplier par 1 ne change pas le nombre."
                : "" +
                  "Chaque chiffre change de " +
                  Math.abs(n) +
                  " rang" +
                  (Math.abs(n) > 1 ? "s" : "") +
                  " vers la " +
                  (n < 0 ? "droite" : "gauche") +
                  " du tableau."
            }`,
            place(a),
          ),
        ],
        rule,
        { solution: `${F(a)} × ${pwr(10, n)} = ${F(a * 10 ** n)}.` },
      );
    }
    if (v === 3) {
      let shift = r.pick([-1, 1, 2]),
        original = a * 10 ** shift,
        exp = n - shift;
      prompt = `Mets ${F(original)} × ${pwr(10, exp)} en notation scientifique.`;
      hs = [
        hint("La mantisse doit être comprise entre 1 inclus et 10 exclu."),
        hint(
          `${F(original)} = ${F(a)} × ${pwr(10, shift)}. Regroupe les puissances.`,
          diagramLines([`${F(a)} × ${pwr(10, shift)} × ${pwr(10, exp)}`]),
        ),
      ];
    } else {
      prompt = `Écris ${F(a * 10 ** n)} en notation scientifique.`;
      hs = [
        hint("Place un seul chiffre non nul avant la virgule."),
        hint(`La mantisse est ${F(a)} ; cherche la puissance de 10.`, place(a)),
      ];
    }
    return q("NC16", v, 3, prompt, [a, n], hs, rule, {
      fields: boxes(["Mantisse a", "Exposant n"], [a, n]),
      solution: `${F(a * 10 ** n)} = ${F(a)} × ${pwr(10, n)}.`,
    });
  },
};

// Le premier dessin utilise les données de la question, sans lire le champ réponse.
function hintNumbers(s) {
  return (s.match(/[−-]?\d+(?:,\d+)?/g) || []).map((n) =>
    Number(n.replace("−", "-").replace(",", ".")),
  );
}
function chartGrid(
  rows,
  cols,
  { top = String(cols), side = String(rows), inside = "", title = "", square = false } = {},
) {
  let body = text(22, 26, title, 19),
    x = square ? 175 : 70,
    y = 58,
    w = square ? 190 : 390,
    h = square ? 190 : 150;
  if (rows && cols) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        body += rect(x + (c * w) / cols, y + (r * h) / rows, w / cols, h / rows, "#cce7dc");
  } else body += circle(x + w / 2, y + h, 4, "#176d5b");
  body +=
    text(x + w / 2 - String(top).length * 5.5, y - 12, top, 22) + text(22, y + h / 2, side, 22);
  if (inside) body += text(x + 15, y + h + 30, inside, 20);
  return svg(body, square ? 560 : 510, square ? 290 : 250);
}
function placeBoard(
  values,
  {
    labels = [],
    heading = "Les mêmes rangs sont alignés.",
    scientificRanks = false,
    minDecimals = 1,
  } = {},
) {
  const strings = values.map((v) => Number(v).toFixed(8).replace(/0+$/, "").replace(/\.$/, ""));
  const left = Math.max(...strings.map((s) => s.split(".")[0].replace("-", "").length));
  const right = Math.max(minDecimals, ...strings.map((s) => (s.split(".")[1] || "").length));
  const columns = left + right,
    cw = Math.min(72, 500 / columns),
    x = (560 - columns * cw) / 2;
  let body = text(24, 24, heading, 19);
  for (let j = 0; j < columns; j++) {
    let rank = left - j - 1;
    body += text(
      x + j * cw + cw / 2 - 9,
      59,
      rank === 0
        ? "1"
        : scientificRanks
          ? pwr(10, rank)
          : rank > 0
            ? String(10 ** rank)
            : `1/${10 ** -rank}`,
      15,
    );
  }
  strings.forEach((s, i) => {
    let neg = s.startsWith("-");
    s = s.replace("-", "");
    let [u, d = ""] = s.split("."),
      digits = u.padStart(left, " ") + d.padEnd(right, "0"),
      y = (labels.length ? 98 : 76) + i * (labels.length ? 100 : 91);
    if (labels[i]) body += text(x, y - 17, labels[i], 17);
    for (let j = 0; j < columns; j++)
      body +=
        rect(x + j * cw, y, cw, 42, "#f4f7f2") +
        text(x + j * cw + cw / 2 - 6, y + 29, digits[j], 22);
    body +=
      line(x + left * cw, y - 4, x + left * cw, y + 46, "#c36035", 3) +
      text(x + left * cw - 5, y + 62, ",", 24, "#a44520");
    if (neg) body += text(x - 20, y + 29, "−", 23);
  });
  return svg(body, 560, values.length * (labels.length ? 100 : 91) + (labels.length ? 108 : 86));
}
function segmentModel(parts, labels, totalLabel = "?", title = "") {
  let sum = parts.reduce((a, b) => a + b, 0),
    w = 490,
    x = 26,
    y = 60,
    body = text(x, 25, title, 19),
    colors = ["#b4ddd0", "#f0d9b4", "#dce8f4"];
  parts.forEach((v, i) => {
    let width = sum ? (v / sum) * w : 0;
    body += rect(x, y, width, 64, colors[i % colors.length]);
    if (width > 28) body += text(x + width / 2 - 12, y + 40, labels[i] ?? "?", 22);
    x += width;
  });
  body +=
    line(26, 144, 516, 144) +
    line(26, 136, 26, 150) +
    line(516, 136, 516, 150) +
    text(224, 178, totalLabel, 22);
  return svg(body, 550, 198);
}
function fractionCompare(parts, title = "Même unité pour les deux lignes.") {
  let units = Math.max(1, ...parts.map(([a, b]) => Math.ceil(a / b))),
    w = 490,
    unitW = w / units,
    body = text(24, 25, title, 19);
  parts.forEach(([a, b, label], j) => {
    let y = 72 + j * 98;
    body += text(24, y - 19, label || `${a}/${b}`, 20);
    for (let i = 0; i < units * b; i++)
      body += rect(24 + (i * unitW) / b, y, unitW / b, 38, i < a ? "#68b29e" : "#f4f7f2");
    for (let u = 1; u < units; u++)
      body += line(24 + u * unitW, y - 4, 24 + u * unitW, y + 42, "#254d42", 3);
    body += text(24 + unitW - 5, y + 61, "1", 16);
  });
  return svg(body, 550, parts.length * 98 + 50);
}
function fractionRefinement(d, k) {
  let x = 26,
    w = 490,
    body = text(x, 25, `Chaque ancienne part est partagée en ${k}.`, 19);
  for (let i = 0; i < d; i++)
    body += rect(x + (i * w) / d, 55, w / d, 38, i === 0 ? "#68b29e" : "#f4f7f2");
  body += line(x, 96, x, 143, "#c36035") + line(x + w / d, 96, x + w, 143, "#c36035");
  for (let i = 0; i < k; i++) body += rect(x + (i * w) / k, 148, w / k, 45, "#68b29e");
  body += text(50, 127, "Zoom : une seule part", 16);
  body += text(x, 224, `En haut : ${d} parts dans une unité.`, 18);
  return svg(body, 550, 250);
}
function fractionGrouping(a, b, k) {
  let units = Math.max(1, Math.ceil(a / b)),
    body = text(24, 25, `Regroupe les petites parts par ${k}.`, 19),
    w = 490;
  for (let u = 0; u < units; u++) {
    let y = 60 + u * 65;
    for (let i = 0; i < b; i++)
      body += rect(24 + (i * w) / b, y, w / b, 36, u * b + i < a ? "#68b29e" : "#f4f7f2");
    for (let i = k; i < b; i += k)
      body += line(24 + (i * w) / b, y - 5, 24 + (i * w) / b, y + 41, "#254d42", 3);
  }
  return svg(body, 550, units * 65 + 62);
}
function arrowLine(x1, y1, x2, y2, color = "#c36035") {
  let angle = Math.atan2(y2 - y1, x2 - x1),
    s = 8;
  return (
    line(x1, y1, x2, y2, color, 3) +
    ("" +
      '<path d="M ' +
      x2 +
      " " +
      y2 +
      " L " +
      (x2 - s * Math.cos(angle - 0.45)) +
      " " +
      (y2 - s * Math.sin(angle - 0.45)) +
      " L " +
      (x2 - s * Math.cos(angle + 0.45)) +
      " " +
      (y2 - s * Math.sin(angle + 0.45)) +
      ' Z" fill="' +
      color +
      '"/>')
  );
}
function displacement(start, delta, startLabel = F(start), deltaLabel = F(delta), endLabel = "?") {
  let end = start + delta,
    lo = Math.min(0, start, end),
    hi = Math.max(0, start, end),
    pad = Math.max(0.02, Math.min(1, (hi - lo) * 0.12)),
    min = lo - pad,
    max = hi + pad,
    x = (v) => 42 + ((v - min) / (max - min)) * 465,
    y = 150,
    body = line(42, y, 507, y);
  body += line(x(0), y - 7, x(0), y + 7) + text(x(0) - 5, y + 30, "0", 18);
  body +=
    circle(x(start), y, 5, "#176d5b") +
    text(x(start) - 15, y + 57, startLabel, 19) +
    line(x(start), y - 9, x(start), 91, "#79958a", 1);
  body +=
    circle(x(end), y, 5, "#c36035") +
    text(x(end) - 10, y - 21, endLabel, 22) +
    line(x(end), y - 9, x(end), 91, "#79958a", 1);
  body +=
    arrowLine(x(start), 83, x(end), 83) + text((x(start) + x(end)) / 2 - 17, 55, deltaLabel, 22);
  return svg(body, 550, 230);
}
function zeroPairs(n) {
  let w = 490 / n,
    body = text(22, 25, "Chaque paire contient deux opposés.", 19);
  for (let i = 0; i < n; i++) {
    let x = 22 + (i + 0.5) * w;
    body +=
      rect(22 + i * w, 47, w, 118, "#f4f7f2") +
      circle(x, 78, Math.min(14, w * 0.28), "#b4ddd0") +
      text(x - 5, 84, "+", 18) +
      circle(x, 137, Math.min(14, w * 0.28), "#f0d9b4") +
      text(x - 5, 143, "−", 18) +
      line(x, 95, x, 117, "#79958a");
  }
  body += text(22, 199, `${n} nombres +1 et ${n} nombres −1`, 19);
  return svg(body, 550, 224);
}
function signBoard(a, b, op = "×") {
  let signA = a < 0 ? "−" : "+",
    signB = b < 0 ? "−" : "+",
    x = 110,
    y = 65,
    cell = 100,
    body = text(24, 27, "Repère les deux signes avant de calculer.", 19);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      let active =
          (row === 0 && col === (signB === "+" ? 1 : 2)) ||
          (col === 0 && row === (signA === "+" ? 1 : 2)),
        v =
          row === 0
            ? col === 0
              ? op.includes("?")
                ? "×"
                : op
              : col === 1
                ? "+"
                : "−"
            : col === 0
              ? row === 1
                ? "+"
                : "−"
              : row === (signA === "+" ? 1 : 2) && col === (signB === "+" ? 1 : 2)
                ? "?"
                : row === col
                  ? "+"
                  : "−";
      body +=
        rect(x + col * cell, y + row * 62, cell, 62, active ? "#b4ddd0" : "#f4f7f2") +
        text(x + col * cell + 43, y + row * 62 + 40, v, 27);
    }
  body += text(
    24,
    48,
    `${a < 0 ? "(" + F(a) + ")" : F(a)} ${op} ${b < 0 ? "(" + F(b) + ")" : F(b)}`,
    20,
  );
  return svg(body, 460, 275);
}
function negativePairs(values) {
  let neg = values.filter((n) => n < 0),
    pos = values.filter((n) => n > 0),
    ordered = [...neg, ...pos],
    w = Math.min(96, 480 / ordered.length),
    body = text(22, 25, "Regroupe les facteurs négatifs par paires.", 19);
  for (let i = 0; i < neg.length - 1; i += 2)
    body += rect(22 + i * w - 4, 50, 2 * w + 4, 104, "#dcece4");
  ordered.forEach((n, i) => {
    let x = 22 + i * w;
    body += rect(x, 66, w - 7, 63, n < 0 ? "#f0d9b4" : "#f4f7f2") + text(x + 20, 105, F(n), 25);
  });
  return svg(body, 540, 180);
}
function opTree(tree) {
  const leaves = (t) => (t.children ? t.children.reduce((s, c) => s + leaves(c), 0) : 1),
    depth = (t) => (t.children ? 1 + Math.max(...t.children.map(depth)) : 0);
  let edges = "",
    nodes = "",
    count = leaves(tree),
    w = 550,
    height = (depth(tree) + 1) * 78 + 35;
  function walk(t, left, right, level) {
    let x = (left + right) / 2,
      y = 34 + level * 78;
    if (t.children) {
      let cursor = left;
      for (let c of t.children) {
        let span = ((right - left) * leaves(c)) / leaves(t),
          cx = cursor + span / 2;
        edges += line(x, y + 17, cx, y + 60, "#91aaa1", 2);
        walk(c, cursor, cursor + span, level + 1);
        cursor += span;
      }
      nodes += circle(x, y, 24, t.first ? "#f0d9b4" : "#dcece4") + text(x - 9, y + 7, t.op, 24);
    } else {
      let label = String(t.value),
        size = label.length > 8 ? 15 : 21;
      nodes +=
        rect(x - 45, y - 24, 90, 53, "#f4f7f2") +
        text(x - Math.min(35, label.length * size * 0.25), y + 9, label, size);
    }
  }
  walk(tree, 25, w - 25, 0);
  return svg(edges + nodes, w, height);
}
function cubeModel(n, { edge = String(n), volume = "" } = {}) {
  let x = 90,
    y = 105,
    s = 140,
    dx = 74,
    dy = -48,
    body = text(
      22,
      28,
      volume
        ? `${volume} petit${Number(volume) > 1 ? "s cubes" : " cube"} au total`
        : "Même nombre dans les trois directions.",
      19,
    );
  if (!n)
    return svg(body + circle(160, 145, 4, "#176d5b") + text(175, 152, "0 couche", 22), 420, 220);
  body +=
    "" +
    '<path d="M ' +
    x +
    " " +
    y +
    " l " +
    dx +
    " " +
    dy +
    " h " +
    s +
    " l " +
    -dx +
    " " +
    -dy +
    ' Z" fill="#e3eee6" stroke="#173e3a"/><path d="M ' +
    (x + s) +
    " " +
    y +
    " l " +
    dx +
    " " +
    dy +
    " v " +
    s +
    " l " +
    -dx +
    " " +
    -dy +
    ' Z" fill="#a9d5c5" stroke="#173e3a"/>' +
    rect(x, y, s, s, "#cbe6da");
  for (let i = 1; i < n; i++) {
    let t = i / n;
    body +=
      line(x + s * t, y, x + s * t, y + s) +
      line(x, y + s * t, x + s, y + s * t) +
      line(x + s * t, y, x + s * t + dx, y + dy) +
      line(x + dx * t, y + dy * t, x + s + dx * t, y + dy * t) +
      line(x + s, y + s * t, x + s + dx, y + s * t + dy) +
      line(x + s + dx * t, y + dy * t, x + s + dx * t, y + s + dy * t);
  }
  body +=
    text(x + s / 2 - 8, y + s + 30, edge, 23) +
    text(x - 38, y + s / 2, edge, 23) +
    text(x + s + dx / 2 + 7, y + dy / 2, edge, 23);
  return svg(body, 390, 290);
}
function productRectangle(a, b, c, d) {
  let ux = Math.max(1, Math.ceil(c / d)),
    uy = Math.max(1, Math.ceil(a / b)),
    cols = ux * d,
    rows = uy * b,
    x = 34,
    y = 55,
    w = 450,
    h = 190,
    body = text(x, 25, `${a}/${b} × ${c}/${d} : deux partages`, 19);
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      body += rect(
        x + (col * w) / cols,
        y + (row * h) / rows,
        w / cols,
        h / rows,
        row < a && col < c ? "#176d5b" : col < c ? "#b4ddd0" : row < a ? "#f0d9b4" : "#f4f7f2",
      );
  for (let u = 1; u < ux; u++)
    body += line(x + (u * w) / ux, y, x + (u * w) / ux, y + h, "#173e3a", 3);
  for (let u = 1; u < uy; u++)
    body += line(x, y + (u * h) / uy, x + w, y + (u * h) / uy, "#173e3a", 3);
  body +=
    line(x, y, x + w, y, "#173e3a", 3) +
    line(x + w, y, x + w, y + h, "#173e3a", 3) +
    line(x + w, y + h, x, y + h, "#173e3a", 3) +
    line(x, y + h, x, y, "#173e3a", 3);
  body += text(x, 277, "Contours épais : unités ; zone commune foncée.", 17);
  return svg(body, 530, 300);
}
function factorFraction(top, bottom) {
  let width = 490,
    x = 30,
    body = text(x, 25, "Repère les mêmes facteurs en haut et en bas.", 19),
    colors = ["#b4ddd0", "#f0d9b4", "#dce8f4"],
    seen = [...new Set([...top, ...bottom])];
  for (let [row, values] of [
    [0, top],
    [1, bottom],
  ]) {
    let cw = width / values.length,
      y = row ? 153 : 77;
    values.forEach((n, i) => {
      let cx = x + (i + 0.5) * cw;
      body += circle(cx, y, 24, colors[seen.indexOf(n) % 3]) + text(cx - 8, y + 8, String(n), 23);
      if (i < values.length - 1) body += text(x + (i + 1) * cw - 7, y + 7, "×", 22);
    });
  }
  body += line(x, 114, x + width, 114, "#173e3a", 3);
  return svg(body, 550, 202);
}
function powerTiles(groups) {
  let cols = groups.length,
    w = 500 / cols,
    body = "";
  groups.forEach((values, i) => {
    let x = 22 + i * w;
    body += rect(x, 40, w - 8, 105, "#e4eee7");
    let cw = (w - 18) / values.length;
    values.forEach((n, j) => {
      body +=
        rect(x + 5 + j * cw, 67, cw - 3, 51, j % 2 ? "#f0d9b4" : "#b4ddd0") +
        text(x + 8 + j * cw, 100, String(n), 21);
    });
    if (i < cols - 1) body += text(x + w - 8, 163, "×", 20);
  });
  return svg(body, 550, 190);
}
function exponentLadder(target) {
  let exps = [];
  for (let k = 1; k >= Math.min(target, 0); k--) exps.push(k);
  let cw = 500 / exps.length,
    body = text(22, 25, "Un rang vers la droite : on divise par 10.", 18);
  exps.forEach((e, i) => {
    let x = 22 + i * cw;
    body +=
      text(x + 10, 64, pwr(10, e), 22) +
      rect(x, 83, cw - 10, 58, "#e4eee7") +
      text(x + 16, 121, i === 0 ? "10" : "?", 24);
    if (i < exps.length - 1) body += arrowLine(x + cw - 10, 158, x + cw + 4, 158);
  });
  return svg(body, 550, 185);
}
function fractionalSquare(area, label = "?") {
  if (area === 0)
    return svg(
      circle(170, 105, 4, "#176d5b") + text(130, 155, "aire 0", 22) + text(164, 75, label, 25),
      360,
      200,
    );
  let body =
    rect(92, 62, 160, 160, "#cbe6da") +
    text(137, 145, `aire ${area}`, 22) +
    text(158, 43, label, 25);
  return svg(body, 360, 248);
}
function firstHintVisual(id, v, prompt, fields, hints) {
  let n = hintNumbers(prompt),
    existing = hints[0]?.svg || "",
    h2 = hints[1]?.svg || "",
    leaf = (value) => ({ value }),
    op = (sign, children, first = false) => ({ op: sign, children, first });
  if (id === "NC04") {
    if (v === 0) {
      let division = prompt.includes("÷"),
        rows = division ? n[1] : n[0],
        cols = division ? n[0] / n[1] : n[1];
      return chartGrid(rows, cols, {
        top: division ? "?" : String(cols),
        side: String(rows),
        title: division
          ? `${n[0]} cases réparties en lignes égales`
          : "Un produit forme un rectangle de cases.",
      });
    }
    if (v === 1) {
      let plus = prompt.includes("+"),
        blank = prompt.includes("□");
      return plus && !blank
        ? segmentModel([n[0], n[1]], [F(n[0]), F(n[1])])
        : segmentModel(
            [blank ? n[0] : n[1], blank ? n[1] - n[0] : n[0] - n[1]],
            [F(blank ? n[0] : n[1]), "?"],
            F(blank ? n[1] : n[0]),
          );
    }
    if (v === 2) {
      let a = n[0],
        k = n[1],
        w = 490,
        body = text(24, 24, `Pars d’un rectangle de ${k + 1} colonnes.`, 19);
      for (let row = 0; row < a; row++)
        body +=
          rect(24, 55 + row * 19, (w * k) / (k + 1), 19, "#b4ddd0") +
          rect(24 + (w * k) / (k + 1), 55 + row * 19, w / (k + 1), 19, "#f0d9b4");
      body +=
        line(24 + (w * k) / (k + 1), 50, 24 + w, 55 + a * 19, "#b65028", 3) +
        text(24, 85 + a * 19, "La colonne orange est à enlever.", 19);
      return svg(body, 550, 115 + a * 19);
    }
    if (v === 3)
      return placeBoard([n[0]], {
        heading: `${F(n[0])} ${prompt.includes("÷") ? "÷" : "×"} ${n[1]} : observe les rangs.`,
      });
    if (v === 4) {
      let a = Math.round(n[0] * 10),
        b = n[1],
        body = text(24, 25, `${b} fois la même partie d’une unité`, 19);
      for (let row = 0; row < b; row++)
        for (let col = 0; col < 10; col++)
          body += rect(24 + col * 49, 55 + row * 27, 49, 22, col < a ? "#68b29e" : "#f4f7f2");
      return svg(body, 550, b * 27 + 65);
    }
    let count = Math.round(n[0] / n[1]),
      body = text(24, 25, `Combien de parts de ${F(n[1])} dans ${F(n[0])} ?`, 19);
    for (let i = 0; i < count; i++)
      body +=
        rect(24 + (i * 490) / count, 65, 490 / count, 62, "#b4ddd0") +
        text(24 + ((i + 0.5) * 490) / count - 13, 104, F(n[1]), 18);
    return svg(body, 550, 160);
  }
  if (id === "NC05") {
    if (v === 0) return h2;
    if (v === 1 || v === 2) return displacement(n[0], n[1], F(n[0]), F(n[1]));
    if (v === 3) return oppositeLine(n[1], "opposé");
    if (v === 4) return displacement(n[0], n[1] - n[0], F(n[0]), "?", F(n[1]));
    return zeroPairs(Math.abs(n[0]));
  }
  if (id === "NC06") {
    if (v === 2) return negativePairs(n);
    return signBoard(n[0], n[1], v === 1 ? "÷" : v === 3 ? "× ? =" : "×");
  }
  if (id === "NC07") {
    if (v === 0)
      return opTree(
        op("+", [op("−", [leaf(F(n[0])), leaf(F(n[1]))]), op("×", [leaf(n[2]), leaf(n[3])], true)]),
      );
    if (v === 1) return opTree(op("×", [op("−", [leaf(n[0]), leaf(n[1])], true), leaf(n[2])]));
    if (v === 2) return opTree(op("×", [op("÷", [leaf(n[0]), leaf(n[1])], true), leaf(n[2])]));
    if (v === 3)
      return opTree(op("+", [leaf(n[0]), op("×", [leaf(n[1]), op("²", [leaf(n[2])], true)])]));
    return opTree(op("÷", [op("−", [leaf(n[0]), leaf(n[1])], true), leaf(n[2])]));
  }
  if (id === "NC08") {
    if (v === 1) return placeBoard([n[0]], { minDecimals: 2 });
    if (v === 3)
      return chartGrid(10, 10, {
        top: "100 parts égales",
        side: "",
        title: `${n[0]} % d’une unité`,
      })
        .replaceAll("#cce7dc", "#f4f7f2")
        .replace(
          "</svg>",
          Array.from({ length: n[0] }, (_, i) =>
            rect(70 + (i % 10) * 39, 58 + Math.floor(i / 10) * 15, 39, 15, "#68b29e"),
          ).join("") + "</svg>",
        );
    if (v === 5) {
      let target = n[0],
        den = 5,
        num = Math.round(target * 5);
      return band(num, den, `${F(target)} unité${target > 1 ? "s" : ""}`);
    }
    return existing;
  }
  if (id === "NC09") {
    if (v === 0) return fractionRefinement(n[1], n[2] / n[1]);
    if (v === 1) return fractionRefinement(n[1], n[2] / n[0]);
    if (v === 2) return fractionGrouping(n[0], n[1], n[2]);
    if (v === 3) return fractionGrouping(n[0], n[1], gcd(n[0], n[1]));
    return numberLine(Math.floor(n[0] / n[1]) - 1, 0, [[n[0] / n[1], `${n[0]}/${n[1]}`]]);
  }
  if (id === "NC10") {
    if (v === 2)
      return fractionCompare(
        [
          [n[0], n[1]],
          [n[2], n[3]],
        ],
        "Repère l’unité dans chaque ligne.",
      );
    if (v === 4) return placeBoard([n[0], n[1] + n[2] / n[3], n[4] / n[5]]);
    if (v === 5)
      return numberLine(-2, 0, [
        [n[0] / n[1], `${n[0]}/${n[1]}`],
        [n[2] / n[3], `${n[2]}/${n[3]}`],
      ]);
    return existing;
  }
  if (id === "NC11") {
    if (v === 5) {
      let known = n[0] / n[1],
        total = n[2] / n[3];
      return segmentModel([total - known, known], ["?", `${n[0]}/${n[1]}`], `${n[2]}/${n[3]}`);
    }
    if (v === 4)
      return displacement(n[0] / n[1], n[2] / n[3], `${n[0]}/${n[1]}`, `${n[2]}/${n[3]}`);
    return fractionCompare([
      [n[0], n[1]],
      [n[2], n[3]],
    ]);
  }
  if (id === "NC12") {
    if (v === 0 || v === 5) return existing;
    if (v === 1) return productRectangle(n[0], n[1], n[2], n[3]);
    if (v === 2) return factorFraction([n[0], n[2]], [n[2], n[1] / n[2], n[0], n[3] / n[0]]);
    if (v === 3) {
      let body =
        text(24, 25, "Valeurs sans signe : obtenir une aire de 1.", 19) +
        rect(120, 80, 260, 130, "#cbe6da") +
        text(210, 151, "aire 1", 26) +
        text(62, 151, `${Math.abs(n[0])}/${n[1]}`, 21) +
        text(238, 58, "?", 26);
      return svg(body, 470, 245);
    }
    if (v === 4)
      return fractionCompare(
        [
          [n[0], n[1]],
          [n[2], n[3]],
        ],
        "Combien de fois la deuxième quantité dans la première ?",
      );
    let fractions = prompt.match(/[−\d]+\/\d+/g);
    return opTree(
      op("+", [leaf(fractions[0]), op("×", [leaf(fractions[1]), leaf(fractions[2])], true)]),
    );
  }
  if (id === "NC13") {
    if (v === 3 || v === 5) return h2;
    return existing;
  }
  if (id === "NC14") {
    if (v === 0)
      return chartGrid(n[0], n[0], {
        title: "Un carré : autant de lignes que de colonnes.",
        square: true,
      });
    if (v === 1) return cubeModel(n[0]);
    if (v === 2) return existing;
    if (v === 3) return fractionalSquare(n[0]);
    if (v === 4) {
      let k = Math.floor(Math.sqrt(n[0])),
        areas = [k * k, n[0], (k + 1) ** 2],
        body = text(22, 25, "Compare les aires des trois carrés.", 19);
      areas.forEach((a, i) => {
        let side = (Math.sqrt(a) * 115) / (k + 1),
          x = 30 + i * 175;
        body +=
          rect(x, 175 - side, side, side, i === 1 ? "#f0d9b4" : "#cbe6da") +
          text(x + 15, 207, `aire ${a}`, 21);
      });
      return svg(body, 560, 235);
    }
    if (v === 5) {
      let a = Math.abs(n[0]),
        negativeBase = prompt.includes("("),
        body = text(24, 25, "Le cadre montre ce qui est élevé au carré.", 19);
      for (let i = 0; i < 2; i++)
        body +=
          rect(85 + i * 230, 67, 136, 65, "#cbe6da") +
          text(122 + i * 230, 109, negativeBase ? `−${a}` : String(a), 29);
      body += text(263, 110, "×", 28);
      if (!negativeBase) body += text(42, 110, "−", 29);
      return svg(body, 550, 170);
    }
    return cubeModel(Math.round(Math.cbrt(n[0])), { edge: "?", volume: String(n[0]) });
  }
  if (id === "NC15") {
    let decode = (s) =>
        Number(
          [...s]
            .map(
              (c) =>
                ({
                  "⁻": "-",
                  "⁰": "0",
                  "¹": "1",
                  "²": "2",
                  "³": "3",
                  "⁴": "4",
                  "⁵": "5",
                  "⁶": "6",
                  "⁷": "7",
                  "⁸": "8",
                  "⁹": "9",
                })[c],
            )
            .join(""),
        ),
      powers = [...prompt.matchAll(/(\d+)([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)].map((m) => [
        Number(m[1]),
        decode(m[2]),
      ]);
    if (v === 0) return powerTiles(n.map((x) => [x]));
    if (v === 1) return powerTiles(powers.map(([base, e]) => Array(e).fill(base)));
    if (v === 2)
      return powerTiles(Array.from({ length: powers[0][1] }, () => [powers[0][0], powers[1][0]]));
    if (v === 3) return exponentLadder(powers[0][1]);
    if (v === 4) {
      let a = powers[0][1],
        b = powers[1][1];
      return displacement(b, a - b, String(b), "déplacement ?", String(a));
    }
    if (v === 5) {
      let base = powers[0][0],
        e = powers[0][1],
        k = Math.round(Math.log10(base));
      return powerTiles(Array.from({ length: e }, () => Array(k).fill(10)));
    }
    return placeBoard([n[0], n[2], n[4]], {
      scientificRanks: true,
      labels: ["× 10²", "× 10", "× 10⁻¹"],
      heading: "Observe la position des chiffres de chaque coefficient.",
    });
  }
  if (id === "NC16") {
    if (v === 0 || v === 1)
      return placeBoard([n[0]], {
        scientificRanks: true,
        heading: "Repère le premier chiffre non nul.",
      });
    if (v === 2)
      return placeBoard([n[0]], {
        scientificRanks: true,
        heading: "Les chiffres gardent leur ordre en changeant de rang.",
      });
    if (v === 3)
      return placeBoard([n[0]], {
        scientificRanks: true,
        heading: "La mantisse garde un seul chiffre avant la virgule.",
      });
    let powers = [...prompt.matchAll(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)].map((m) =>
      Number(
        [...m[1]]
          .map(
            (c) =>
              ({
                "⁻": "-",
                "⁰": "0",
                "¹": "1",
                "²": "2",
                "³": "3",
                "⁴": "4",
                "⁵": "5",
                "⁶": "6",
                "⁷": "7",
                "⁸": "8",
                "⁹": "9",
              })[c],
          )
          .join(""),
      ),
    );
    return placeBoard([n[0] * 10 ** powers[0], n[2] * 10 ** powers[1]], {
      scientificRanks: true,
      heading: "Compare les rangs des premiers chiffres.",
    });
  }
  return existing;
}
