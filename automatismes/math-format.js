// Le texte courant et les unités composées restent intacts.
export const escapeMathText = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const mathFontCSS =
  "" +
  "@font-face{font-family:'MG Math';src:url('" +
  new URL("./fonts/mg-math.woff", import.meta.url).href +
  "') format('woff');font-weight:100 900;font-style:normal;font-display:swap}.math-varia" +
  "ble{font-family:'MG Math',serif!important;font-style:normal!important;font-weight:400" +
  ";font-synthesis:none}.math-expression{display:inline-block;white-space:nowrap;max-wid" +
  "th:100%;vertical-align:baseline}";
if (typeof document !== "undefined" && !document.getElementById("mg-math-font")) {
  const style = document.createElement("style");
  style.id = "mg-math-font";
  style.textContent = mathFontCSS;
  document.head.append(style);
}
const variableStyle =
  "font-family:'MG Math',serif;font-style:normal;font-weight:400;font-synthesis:none";
const wordsNotMath = new Set([
  "a",
  "y",
  "et",
  "ou",
  "de",
  "du",
  "le",
  "la",
  "les",
  "un",
  "une",
  "en",
  "au",
  "aux",
  "par",
  "sur",
  "car",
  "cas",
  "pas",
  "cm",
  "mm",
  "dm",
  "km",
  "kg",
  "mg",
  "ml",
  "cl",
  "min",
  "max",
  "sin",
  "cos",
  "tan",
  "si",
  "ni",
  "or",
]);
function lexMath(value) {
  const s = String(value),
    tokens = [];
  const unitRanges = [
    ...s.matchAll(/\b(?:km|cm|mm|dm|m|g|kg)\s*\/\s*(?:h|min|s|cm³|m³)(?![\p{L}\p{N}])/gu),
  ].map((m) => [m.index, m.index + m[0].length]);
  const proseParentheses = [...s.matchAll(/\(en [^)]*\)/g)].map((m) => [
    m.index,
    m.index + m[0].length,
  ]);
  const fractions = [...s.matchAll(fractionRE)]
    .filter((m) => !/[\p{L}\p{N}/]/u.test(s[m.index - 1] || ""))
    .map((m) => [m.index, m.index + m[0].length]);
  for (const m of s.matchAll(/\[(?:angle|vector):[^\]]+\]|[\p{L}]+|\d+(?:[.,]\d+)?|\s+|./gu)) {
    const t = m[0],
      i = m.index,
      before = s.slice(0, i),
      after = s.slice(i + t.length);
    let variable = false,
      math = false;
    if (
      (/^[a-z]$/.test(t) || /^(?:ab|ac|ax|bx|cx|xy|xyz|mn|ka|kb)$/.test(t)) &&
      !wordsNotMath.has(t) &&
      /^[abcfghkmnpqrtuvxyz]+$/.test(t)
    )
      variable = true;
    if (t === "a")
      variable =
        !/(?:\bil y |\bn['’]y |\by en |\ben |\bon |\bn’|\bn')$/i.test(before) &&
        // Le verbe « avoir » (« un nombre premier a exactement… », « il y en a beaucoup ») reste droit.
        !/^\s+(?:pour|une?|été|besoin|des|le|la|les|exactement|beaucoup|toujours|aussi|plus|moins|deux|trois|quatre|autant|déjà|écrit|aligné|placé|additionné|raison)\b/.test(
          after,
        ) &&
        // « 0,04 a 0 dixième » (lot NC-2) : le verbe, suivi d'un nombre de dixièmes, d'unités…
        !/^\s+\d+\s+(?:millièmes?|centièmes?|dixièmes?|unités?|dizaines?|centaines?)\b/.test(after);
    if (t === "y") variable = !/(?:\bil\s+|\bn['’])$/i.test(before);
    // Les unités restent droites après un nombre.
    if (/^[hmsgLl]$/.test(t) && /\d\s*$/.test(before) && !/^\s*[=+−×÷*/^]/.test(after))
      variable = false;
    // Une lettre suivie d'une apostrophe est une élision (c’est, n’est, l’autre), pas une variable.
    if (variable && /^[a-z]$/.test(t) && /^['’]/.test(after)) variable = false;
    if (t === "ℓ") variable = true;
    if (t === "L" && /\(/.test(before) && /[+−×÷]/.test(after)) variable = true;
    if (/^[A-Z]$/.test(t))
      variable =
        variable || /^\s*\([a-z]\)/.test(after) || (/^[A-Z]$/.test(t) && /^\s*=/.test(after));
    if (
      fractions.some(([a, b]) => i >= a && i < b) ||
      variable ||
      /^(?:cos|sin|tan)$/.test(t) ||
      /^\d/.test(t) ||
      /^\[(angle|vector):/.test(t) ||
      /^[+−×÷*/^=<>≤≥≠()²³⁰¹⁴⁵⁶⁷⁸⁹ⁿ⁻√π□°;-]$/.test(t)
    )
      math = true;
    if ([...unitRanges, ...proseParentheses].some(([a, b]) => i >= a && i < b)) {
      variable = false;
      math = false;
    }
    tokens.push({ value: t, index: i, variable, math, space: /^\s+$/.test(t) });
  }
  return tokens;
}
export function mathSegments(value) {
  const ts = lexMath(value),
    segments = [];
  let run = "";
  const flush = () => {
    if (run) {
      const lead = run.match(/^\s*/)[0],
        tail = run.match(/\s*$/)[0],
        body = run.slice(lead.length, run.length - tail.length || undefined);
      if (lead) segments.push({ math: false, value: lead });
      if (body) segments.push({ math: true, value: body });
      if (tail) segments.push({ math: false, value: tail });
      run = "";
    }
  };
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    if (t.math || (t.space && run && ts.slice(i + 1).find((x) => !x.space)?.math)) {
      run += t.value;
    } else {
      flush();
      segments.push({ math: false, value: t.value });
    }
  }
  flush();
  return segments;
}
function variableText(value, mode = "html") {
  return lexMath(value)
    .map((t) =>
      t.variable
        ? mode === "svg"
          ? `<tspan class="math-variable" style="${variableStyle}">${escapeMathText(t.value)}</tspan>`
          : mode === "mathml"
            ? Array.from(t.value)
                .map(
                  (c) =>
                    `<mi mathvariant="normal" class="math-variable" style="${variableStyle}">${c}</mi>`,
                )
                .join("")
            : `<span class="math-variable" style="${variableStyle}">${escapeMathText(t.value)}</span>`
        : mode === "mathml"
          ? `<mtext>${escapeMathText(t.value)}</mtext>`
          : escapeMathText(t.value),
    )
    .join("");
}
const simple =
  "(?:[−-]?(?:√\\d+|\\d+(?:[.,]\\d+)?[abcfghkmnprtuvxyz]?|[A-Z]{2,3}|[abcfghkmnprtuvxyz]|□)" +
  "[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻°]*|adjacent|hypoténuse|opposé|premier triangle|second triangle)";
const atom = `(?:\\([\\d\\s.,+−×*÷^²³⁰¹⁴⁵⁶⁷⁸⁹ⁿ⁻abcfghkmnprtuvxyz□√-]+\\)|${simple})`;
const fractionRE = new RegExp(`(${atom})\\s*\\/\\s*(${atom})(?:(?=π)|(?![\\p{L}\\p{N}³²/]))`, "gu");
export function mathTokens(value) {
  const s = String(value ?? "")
      .replace(/(^|[\s=(;,:+×÷])-(?=[\d√])/g, "$1−")
      .replace(/(\d)\s*-\s*(?=\d)/g, "$1 − "),
    out = [];
  let end = 0;
  for (const m of s.matchAll(fractionRE)) {
    const before = s[m.index - 1] || "";
    if (/[\p{L}\p{N}/]/u.test(before)) continue;
    if (m.index > end) out.push({ type: "text", value: s.slice(end, m.index) });
    out.push({ type: "fraction", numerator: m[1], denominator: m[2], value: m[0] });
    end = m.index + m[0].length;
  }
  if (end < s.length) out.push({ type: "text", value: s.slice(end) });
  // Les parenthèses encadrant une fraction font partie du rendu MathML.
  for (let i = 1; i < out.length - 1; i++)
    if (
      out[i].type === "fraction" &&
      out[i - 1].type === "text" &&
      out[i + 1].type === "text" &&
      /\(\s*$/.test(out[i - 1].value) &&
      /^\s*\)/.test(out[i + 1].value)
    ) {
      out[i - 1].value = out[i - 1].value.replace(/\(\s*$/, "");
      out[i + 1].value = out[i + 1].value.replace(/^\s*\)/, "");
      out[i].enclosed = true;
    }
  return out.flatMap((t) => {
    if (t.type !== "text") return [t];
    const parts = [];
    let end = 0;
    for (const m of t.value.matchAll(
      /\[(angle|vector):((?:[A-Z]′?){1,3}|0)\]|√(\d+(?:[.,]\d+)?)/g,
    )) {
      if (m.index > end) parts.push({ type: "text", value: t.value.slice(end, m.index) });
      parts.push(m[1] ? { type: m[1], value: m[2] } : { type: "radical", value: m[3] });
      end = m.index + m[0].length;
    }
    if (end < t.value.length) parts.push({ type: "text", value: t.value.slice(end) });
    return parts;
  });
}
function powers(s) {
  return variableText(s).replace(/\^([−-]?\d+|□)/g, "<sup>$1</sup>");
}
const mathWrap = (body, label) =>
  "" +
  '<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline" displaystyle="true" ' +
  'style="font-size:1em" aria-label="' +
  escapeMathText(label) +
  '">' +
  body +
  "</math>";
const mathAtom = (s) =>
  String(s)
    .split(/(√\d+(?:[.,]\d+)?)/g)
    .filter(Boolean)
    .map((p) => {
      if (p.startsWith("√")) return `<msqrt><mn>${escapeMathText(p.slice(1))}</mn></msqrt>`;
      if (/^[−-]?\d+(?:[.,]\d+)?$/.test(p))
        return `${/^[−-]/.test(p) ? "<mo>−</mo>" : ""}<mn>${p.replace(/^[−-]/, "")}</mn>`;
      const power = p.match(/^([abcfghkmnprtuvxyz]|\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻]+)$/);
      if (power) {
        const e = power[2].replace(
          /[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻]/g,
          (c) =>
            ({
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
              ⁿ: "n",
              "⁻": "−",
            })[c],
        );
        return (
          "" +
          "<msup>" +
          (/\d/.test(power[1])
            ? `<mn>${power[1]}</mn>`
            : `<mi mathvariant="normal" class="math-variable" style="${variableStyle}">${power[1]}</mi>`) +
          "<mrow>" +
          (e.includes("−") ? "<mo>−</mo>" : "") +
          (e.includes("n")
            ? `<mi mathvariant="normal" class="math-variable" style="${variableStyle}">n</mi>`
            : `<mn>${e.replace("−", "")}</mn>`) +
          "</mrow></msup>"
        );
      }
      if (/^[abcfghkmnprtuvxyz]$/.test(p))
        return `<mi mathvariant="normal" class="math-variable" style="${variableStyle}">${p}</mi>`;
      if (/^(?:[A-Z]′?){2,3}$/.test(p)) return `<mi mathvariant="normal">${p}</mi>`;
      return variableText(p, "mathml");
    })
    .join("");
function inlineHtml(value) {
  return mathTokens(value)
    .map((t) => {
      if (t.type === "fraction")
        return mathWrap(
          "" +
            "<mrow>" +
            (t.enclosed ? '<mo stretchy="true">(</mo>' : "") +
            "<mfrac><mrow>" +
            mathAtom(t.numerator) +
            "</mrow><mrow>" +
            mathAtom(t.denominator) +
            "</mrow></mfrac>" +
            (t.enclosed ? '<mo stretchy="true">)</mo>' : "") +
            "</mrow>",
          `${t.numerator} sur ${t.denominator}`,
        );
      if (t.type === "vector")
        return mathWrap(
          `<mover accent="true"><mi mathvariant="normal">${t.value}</mi><mo stretchy="true">→</mo></mover>`,
          `vecteur ${t.value}`,
        );
      if (t.type === "angle")
        return (
          "" +
          '<span role="math" aria-label="angle ' +
          t.value +
          '" style="position:relative;display:inline-block;white-space:nowrap;padding-top:.24em;' +
          'line-height:1.1;vertical-align:baseline"><svg xmlns="http://www.w3.org/2000/svg" ' +
          'aria-hidden="true" viewBox="0 0 100 20" preserveAspectRatio="none" ' +
          'style="position:absolute;left:0;top:0;width:100%;height:.24em;overflow:visible"><path ' +
          'd="M 0 18 L 50 2 L 100 18" fill="none" stroke="currentColor" stroke-width="1.2" ' +
          'vector-effect="non-scaling-stroke"/></svg><span>' +
          t.value +
          "</span></span>"
        );
      if (t.type === "radical")
        return mathWrap(`<msqrt><mn>${t.value}</mn></msqrt>`, `racine carrée de ${t.value}`);
      return powers(t.value);
    })
    .join("");
}
/* La ponctuation qui suit un calcul (« 9 ? », « 4. », « 5, », « 516 : ») reste collée à lui : sinon
   elle peut partir seule au début de la ligne suivante (le calcul est insécable, pas ce qui le suit).
   Rend la liste des morceaux, chaque calcul avec sa ponctuation collée (colle). */
export function collerPonctuation(parts) {
  const sortie = [];
  for (let i = 0; i < parts.length; i++) {
    const part = { ...parts[i], colle: "" };
    const suivant = parts[i + 1];
    const apres = parts[i + 2];
    if (part.math && suivant && !suivant.math) {
      if (
        /^[\u00a0\u202f]+$/.test(suivant.value) &&
        apres &&
        !apres.math &&
        /^[?!:;»]$/.test(apres.value)
      ) {
        part.colle = suivant.value + apres.value;
        i += 2;
      } else if (/^[.,;:?!…»]$/.test(suivant.value)) {
        part.colle = suivant.value;
        i += 1;
      }
    }
    sortie.push(part);
  }
  return sortie;
}
// Un calcul en HTML, sa ponctuation collée glissée dans le dernier bloc insécable.
export function collerDans(html, colle) {
  return colle ? html.replace(/<\/span>$/, `${escapeMathText(colle)}</span>`) : html;
}
export function mathHtml(value) {
  return collerPonctuation(mathSegments(value))
    .map((part) => {
      if (!part.math) return escapeMathText(part.value);
      // Les membres restent entiers ; les égalités peuvent se séparer entre étapes.
      const members = part.value.split(/\s*=\s*/);
      if (members.length > 2 || (members.length === 2 && part.value.length > 30))
        return collerDans(
          members
            .map(
              (m, i) =>
                `<span class="math-expression" style="white-space:nowrap">${i ? "= " : ""}${inlineHtml(m)}</span>`,
            )
            .join(" "),
          part.colle,
        );
      return collerDans(
        `<span class="math-expression" style="white-space:nowrap">${inlineHtml(part.value.replace(/\s*=\s*/g, " = "))}</span>`,
        part.colle,
      );
    })
    .join("");
}
// Les fractions des dessins ont un trait horizontal ; les autres libellés restent alignés.
export function mathSvgText(x, y, value, size = 18, color = "#173e3a", anchor = "start") {
  const ts = mathTokens(value);
  if (ts.every((t) => t.type === "text"))
    return (
      "" +
      '<text x="' +
      x +
      '" y="' +
      y +
      '" text-anchor="' +
      anchor +
      '" font-size="' +
      size +
      '" fill="' +
      color +
      '">' +
      variableText(ts.map((t) => t.value).join(""), "svg").replace(
        /\^([−-]?\d+|□)/g,
        '<tspan baseline-shift="super" font-size=".72em">$1</tspan>',
      ) +
      "</text>"
    );
  const width = (s) =>
    Array.from(s).reduce(
      (n, c) => n + (/[il1., :;]/.test(c) ? 0.3 : /[MW]/.test(c) ? 0.85 : 0.57),
      0,
    ) * size;
  let offset = 0;
  const parts = ts
    .map((t) => {
      if (t.type === "text") {
        const p =
          "" +
          '<text x="' +
          offset +
          '" y="0" font-size="' +
          size +
          '" fill="' +
          color +
          '" textLength="' +
          width(t.value) +
          '" lengthAdjust="spacingAndGlyphs" xml:space="preserve">' +
          variableText(t.value, "svg").replace(
            /\^([−-]?\d+|□)/g,
            '<tspan baseline-shift="super" font-size=".72em">$1</tspan>',
          ) +
          "</text>";
        offset += width(t.value);
        return p;
      }
      if (t.type === "vector") {
        const w = width(t.value),
          top = -size * 0.91,
          p =
            "" +
            '<text x="' +
            offset +
            '" y="0" font-size="' +
            size +
            '" fill="' +
            color +
            '" textLength="' +
            w +
            '" lengthAdjust="spacingAndGlyphs">' +
            t.value +
            '</text><path d="M ' +
            offset +
            " " +
            top +
            " H " +
            (offset + w) +
            " M " +
            (offset + w - size * 0.2) +
            " " +
            (top - size * 0.12) +
            " L " +
            (offset + w) +
            " " +
            top +
            " L " +
            (offset + w - size * 0.2) +
            " " +
            (top + size * 0.12) +
            '" fill="none" stroke="' +
            color +
            '" stroke-width="' +
            Math.max(1, size * 0.055) +
            '"/>';
        offset += w + size * 0.08;
        return p;
      }
      if (t.type === "angle") {
        const w = width(t.value),
          p =
            "" +
            '<text x="' +
            offset +
            '" y="0" font-size="' +
            size +
            '" fill="' +
            color +
            '" textLength="' +
            w +
            '" lengthAdjust="spacingAndGlyphs">' +
            t.value +
            '</text><path d="M ' +
            offset +
            " " +
            -size * 0.87 +
            " L " +
            (offset + w / 2) +
            " " +
            -size * 1.08 +
            " L " +
            (offset + w) +
            " " +
            -size * 0.87 +
            '" fill="none" stroke="' +
            color +
            '" stroke-width="' +
            Math.max(1, size * 0.055) +
            '"/>';
        offset += w + size * 0.08;
        return p;
      }
      if (t.type === "radical") {
        const w = width(t.value),
          p =
            "" +
            '<text x="' +
            offset +
            '" y="0" font-size="' +
            size +
            '" fill="' +
            color +
            '">√</text><text x="' +
            (offset + size * 0.6) +
            '" y="0" font-size="' +
            size +
            '" fill="' +
            color +
            '" textLength="' +
            w +
            '" lengthAdjust="spacingAndGlyphs">' +
            t.value +
            '</text><path d="M ' +
            (offset + size * 0.55) +
            " " +
            -size * 0.84 +
            " H " +
            (offset + size * 0.6 + w) +
            '" fill="none" stroke="' +
            color +
            '" stroke-width="' +
            Math.max(1, size * 0.055) +
            '"/>';
        offset += size * 0.6 + w + size * 0.08;
        return p;
      }
      const bracket = t.enclosed ? size * 0.28 : 0;
      offset += bracket;
      const w = Math.max(width(t.numerator), width(t.denominator)) * 0.78 + size * 0.38,
        c = offset + w / 2;
      const p =
        "" +
        mathSvgText(c, -size * 0.52, t.numerator, size * 0.78, color, "middle") +
        '<line x1="' +
        (offset + size * 0.08) +
        '" y1="' +
        -size * 0.3 +
        '" x2="' +
        (offset + w - size * 0.08) +
        '" y2="' +
        -size * 0.3 +
        '" stroke="' +
        color +
        '" stroke-width="' +
        Math.max(1, size * 0.06) +
        '"/>' +
        mathSvgText(c, size * 0.48, t.denominator, size * 0.78, color, "middle");
      const outer = t.enclosed
        ? "" +
          '<path d="M ' +
          (offset - size * 0.04) +
          " " +
          -size * 1.15 +
          " Q " +
          (offset - size * 0.4) +
          " " +
          -size * 0.3 +
          " " +
          (offset - size * 0.04) +
          " " +
          size * 0.6 +
          " M " +
          (offset + w + size * 0.04) +
          " " +
          -size * 1.15 +
          " Q " +
          (offset + w + size * 0.4) +
          " " +
          -size * 0.3 +
          " " +
          (offset + w + size * 0.04) +
          " " +
          size * 0.6 +
          '" fill="none" stroke="' +
          color +
          '" stroke-width="' +
          Math.max(1, size * 0.06) +
          '"/>'
        : "";
      offset += w + size * 0.14 + bracket;
      return outer + p;
    })
    .join("");
  return (
    "" +
    '<g transform="translate(' +
    (x - (anchor === "middle" ? offset / 2 : anchor === "end" ? offset : 0)) +
    " " +
    y +
    ')" role="img" aria-label="' +
    escapeMathText(
      String(value)
        .replace(/\[angle:([^\]]+)\]/g, "angle $1")
        .replace(/\[vector:([^\]]+)\]/g, "vecteur $1"),
    ) +
    '">' +
    parts +
    "</g>"
  );
}
