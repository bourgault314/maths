// 0.2.0 (lot NC-1, 24/10/2026) : NC17 et NC18 suivent le cahier ; une même graine y donne une autre question.
export const VERSION = "0.2.0";
export function rng(seed) {
  let a = Number(seed) >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    bool: () => next() < 0.5,
    next,
  };
}
export function normalize(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\u2212|–/g, "-")
    .replace(/\s/g, "")
    .replaceAll(",", ".")
    .replace(/×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .toLowerCase();
}
const add = (a, b) =>
  Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
const mul = (a, b) => {
  if (a.length + b.length > 18) throw Error("Expression trop complexe");
  let c = Array(a.length + b.length - 1).fill(0);
  a.forEach((v, i) => b.forEach((w, j) => (c[i + j] += v * w)));
  return c;
};
function clean(a) {
  while (a.length > 1 && Math.abs(a.at(-1)) < 1e-12) a.pop();
  return a;
}
export function polynomial(input) {
  // Analyseur limité : aucune exécution de code, d’appel ou d’affectation.
  let s = String(input ?? "")
    .trim()
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");
  s = normalize(s).replace(/π/g, "pi").replace(/√/g, "sqrt");
  if (s.length > 160) throw Error("Expression trop longue");
  let tokens = s.match(/(?:\d+(?:\.\d*)?|\.\d+)|sqrt|pi|[a-z]|[()+\-*/^]/g) || [];
  if (tokens.some((t, i) => i > 0 && /^(\d|\.)/.test(t) && /^(\d|\.)/.test(tokens[i - 1])))
    throw Error("Nombre décimal mal écrit");
  if (tokens.join("") !== s || !tokens.length) throw Error("Écriture non reconnue");
  let i = 0,
    depth = 0;
  const isAtom = (t) => t && (/^(\d|\.)/.test(t) || /^(pi|sqrt|[a-z]|\()$/.test(t));
  function atom() {
    if (++depth > 30) throw Error("Expression trop profonde");
    let t = tokens[i++],
      a;
    if (t === "(") {
      a = sum();
      if (tokens[i++] !== ")") throw Error("Parenthèse manquante");
    } else if (t === "sqrt") {
      let v = atom();
      if (v.length !== 1 || v[0] < 0) throw Error("Racine non valide");
      a = [Math.sqrt(v[0])];
    } else if (t === "pi") a = [Math.PI];
    else if (/^[a-z]$/.test(t || "")) a = [0, 1];
    else if (t != null && Number.isFinite(Number(t))) a = [Number(t)];
    else throw Error("Nombre attendu");
    depth--;
    return a;
  }
  function power() {
    let a = atom();
    if (tokens[i] === "^") {
      i++;
      let b = unary();
      if (b.length !== 1 || !Number.isInteger(b[0]) || Math.abs(b[0]) > 12)
        throw Error("Exposant non pris en charge");
      let n = b[0];
      if (n === 0 && a.length === 1 && a[0] === 0) throw Error("0 puissance 0 n’est pas définie");
      if (n < 0) {
        if (a.length !== 1 || a[0] === 0) throw Error("Puissance non valide");
        return [Math.pow(a[0], n)];
      }
      let c = [1];
      for (let j = 0; j < n; j++) c = mul(c, a);
      a = c;
    }
    return a;
  }
  function unary() {
    if (tokens[i] === "+") {
      i++;
      return unary();
    }
    if (tokens[i] === "-") {
      i++;
      return unary().map((x) => -x);
    }
    return power();
  }
  function product() {
    let a = unary();
    while (tokens[i] === "*" || tokens[i] === "/" || isAtom(tokens[i])) {
      let op = tokens[i];
      if (op === "*" || op === "/") i++;
      else op = "*";
      let b = unary();
      if (op === "/") {
        b = clean(b);
        if (b.length !== 1 || b[0] === 0) throw Error("Dénominateur non valide");
        a = a.map((x) => x / b[0]);
      } else a = mul(a, b);
    }
    return clean(a);
  }
  function sum() {
    let a = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      let op = tokens[i++],
        b = product();
      a = add(a, op === "-" ? b.map((x) => -x) : b);
    }
    return clean(a);
  }
  let result = sum();
  if (i !== tokens.length || result.some((x) => !Number.isFinite(x)))
    throw Error("Écriture non valide");
  return result;
}
export const numeric = (s) => {
  if (String(s).trim().endsWith("%")) return numeric(String(s).trim().slice(0, -1)) / 100;
  if (/[a-z]/i.test(normalize(s).replace(/sqrt|pi/g, "")))
    throw Error("Un nombre sans lettre est attendu");
  const p = polynomial(s);
  if (p.length !== 1) throw Error("Un nombre est attendu");
  return p[0];
};
const near = (a, b) =>
  a === b || Math.abs(a - b) <= 1e-10 * Math.max(1e-12, Math.abs(a), Math.abs(b));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const letters = (s) =>
  [
    ...new Set(
      normalize(String(s).replace(/²/g, "^2").replace(/³/g, "^3"))
        .replace(/sqrt|pi/g, "")
        .match(/[a-z]/g) || [],
    ),
  ]
    .sort()
    .join("");
function reducedForm(input) {
  let s = normalize(String(input).replace(/²/g, "^2").replace(/³/g, "^3"));
  if (/[()]/.test(s)) return false;
  let terms = s.match(/[+-]?[^+-]+/g) || [];
  let degrees = [];
  for (let t of terms) {
    let ls = t.match(/[a-z]/g) || [];
    if (ls.length > 1) return false;
    let degree = ls.length ? Number(t.match(/\^(\d+)/)?.[1] || 1) : 0;
    if (degrees.includes(degree)) return false;
    degrees.push(degree);
    if ((t.match(/\*/g) || []).length > (ls.length ? 1 : 0) || /\d\*\d/.test(t)) return false;
  }
  return true;
}
function factorSignature(input) {
  // Vérifie les facteurs ; refuse un polynôme développé artificiellement placé dans 1(...).
  let s = normalize(String(input).replace(/²/g, "^2").replace(/³/g, "^3")),
    i = 0,
    degrees = [],
    nonUnitConstant = false,
    hasParenthesis = false;
  if (s[0] === "+" || s[0] === "-") {
    if (s[0] === "-") nonUnitConstant = true;
    i++;
  }
  while (i < s.length) {
    if (s[i] === "*") {
      i++;
      if (i === s.length) return null;
    }
    let atom,
      start = i;
    if (s[i] === "(") {
      let depth = 1;
      i++;
      while (i < s.length && depth) {
        if (s[i] === "(") depth++;
        if (s[i] === ")") depth--;
        i++;
      }
      if (depth) return null;
      atom = s.slice(start, i);
      hasParenthesis = true;
    } else {
      let m = s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+|[a-z])/);
      if (!m) return null;
      atom = m[0];
      i += atom.length;
    }
    let exponent = 1;
    if (s[i] === "^") {
      i++;
      let m = s.slice(i).match(/^\d+/);
      if (!m) return null;
      exponent = Number(m[0]);
      i += m[0].length;
      if (exponent < 1 || exponent > 12) return null;
    }
    const p = polynomial(atom),
      degree = p.length - 1;
    if (degree) {
      for (let n = 0; n < exponent; n++) degrees.push(degree);
    } else if (Math.pow(p[0], exponent) !== 1) nonUnitConstant = true;
    if (s[i] === "+" || s[i] === "-" || s[i] === "/") return null;
  }
  if (!hasParenthesis || (!nonUnitConstant && degrees.length < 2)) return null;
  return degrees.sort((a, b) => a - b).join(",");
}
function factorForm(input, expected) {
  let got = factorSignature(input);
  if (got === null) return false;
  let wanted = factorSignature(expected);
  return wanted === null || got === wanted;
}

const enListe = (liste) =>
  liste.length < 2 ? liste.join("") : `${liste.slice(0, -1).join(", ")} et ${liste.at(-1)}`;
function estPremier(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}
// « 2 × 3 × 5 × 13 », « 2² × 3 », « 2^2*3 », « 390 = 2 × 195 » : la liste des facteurs.
function lireProduit(texte, nombre) {
  // Les exposants (2², 2³…) d'abord : normalize les changerait en chiffres ordinaires (NFKC).
  const exposants = String(texte).replace(
    /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,
    (e) => `^${[...e].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("")}`,
  );
  const s = normalize(exposants).replace(new RegExp(`^${nombre}=`), "");
  const morceaux = s.split(/[*x]/);
  if (!morceaux.every((m) => /^\d{1,6}(\^\d{1,2})?$/.test(m))) throw Error("Écriture non reconnue");
  return morceaux.flatMap((m) => {
    const [base, exposant = "1"] = m.split("^");
    return Array(Math.min(Number(exposant), 12)).fill(Number(base));
  });
}

export function checkAnswer(q, answers) {
  if (answers.some((a) => String(a).trim() === "" || String(a) === "/"))
    return { ok: false, syntax: true, message: "Complète ta réponse." };
  answers = answers.map((a, i) =>
    q.fields?.[i]?.unit === "%" ? String(a).trim().replace(/%$/, "").trim() : a,
  );
  const c = q.check || { type: "fields", values: q.fields.map((f) => f.answer) };
  let vals = c.values ?? q.fields.map((f) => f.answer);
  if (!Array.isArray(vals)) vals = [vals];
  try {
    let ok = false;
    if (c.type === "expression") {
      if (letters(answers[0]) !== letters(vals[0]))
        return { ok: false, syntax: false, message: "Utilise la lettre demandée dans l’énoncé." };
      const p = polynomial(answers[0]),
        e = polynomial(vals[0]);
      ok = Array.from({ length: Math.max(p.length, e.length) }, (_, i) =>
        near(p[i] || 0, e[i] || 0),
      ).every(Boolean);
    } else if (c.type === "set") {
      const got = answers.flatMap((a) => String(a).split(/[;\n]+/)).map((x) => numeric(x));
      let unique = [...new Set(got)].sort((a, b) => a - b);
      let expected = [...new Set(vals.map(numeric))].sort((a, b) => a - b);
      ok = unique.length === expected.length && unique.every((a, i) => near(a, expected[i]));
      // Cahier NC18-a : des diviseurs justes, mais pas tous → la phrase dit lesquels manquent.
      if (!ok && c.manquants && unique.every((a) => expected.some((e) => near(a, e)))) {
        const manque = expected.filter((e) => !unique.some((a) => near(a, e)));
        const paires = c.number && manque.every((m) => unique.some((a) => near(a * m, c.number)));
        return {
          ok: false,
          syntax: false,
          message: `Il manque des diviseurs\u00a0: ${enListe(manque)}${paires ? " (l’autre nombre de chaque paire)" : ""}.`,
        };
      }
    } else if (c.type === "property") {
      const a = c.rule === "primeFactors" ? NaN : numeric(answers[0]);
      if (c.rule === "divisor") {
        const n = c.number ?? c.n;
        ok = Number.isInteger(a) && a > 0 && n % a === 0 && (!c.exclude || !c.exclude.includes(a));
        // Cahier NC18-b : « 363 ÷ 7 ne tombe pas juste. »
        if (!ok && c.reste && Number.isInteger(a) && a > 1 && a < n && n % a !== 0)
          return { ok: false, syntax: false, message: `${n} ÷ ${a} ne tombe pas juste.` };
      } else if (c.rule === "digitFill") {
        // Cahier NC17-c : un seul chiffre, qui fait tomber la somme dans la table.
        ok = /^\d$/.test(normalize(answers[0])) && (c.known + a) % c.divisor === 0;
      } else if (c.rule === "digitSum") {
        // Cahier NC17-d : le nombre de chiffres, le chiffre des unités (ou « par 2 », « par 5 »), et
        // la somme des chiffres dans la table de 3 ou de 9 ; seule la somme ratée a sa phrase.
        const texte = normalize(answers[0]);
        const chiffres = /^[1-9]\d*$/.test(texte) ? [...texte].map(Number) : null;
        const forme =
          chiffres &&
          chiffres.length === c.digits &&
          (c.lastDigit == null || chiffres.at(-1) === c.lastDigit) &&
          (c.alsoDivisor == null || Number(texte) % c.alsoDivisor === 0);
        const total = chiffres ? chiffres.reduce((s, d) => s + d, 0) : 0;
        ok = Boolean(forme) && total % c.sumDivisor === 0;
        if (forme && !ok)
          return {
            ok: false,
            syntax: false,
            message: `${chiffres.join(" + ")} = ${total}\u00a0: pas dans la table de ${c.sumDivisor}.`,
          };
      } else if (c.rule === "primeFactors") {
        // Cahier NC18-c : un produit de facteurs premiers égal au nombre, dans n'importe quel ordre,
        // puissances permises (2² × 3). Un facteur juste mais pas premier a sa phrase.
        const liste = lireProduit(answers[0], c.number);
        const produit = liste.reduce((p, f) => p * f, 1);
        const compose = liste.find((f) => f > 1 && !estPremier(f));
        ok = produit === c.number && liste.every(estPremier);
        if (!ok && produit === c.number && compose)
          return {
            ok: false,
            syntax: false,
            message: `${compose} n’est pas premier\u00a0: continue la décomposition.`,
          };
      } else if (c.rule === "multiple")
        ok =
          Number.isInteger(a) &&
          a % (c.number ?? c.n) === 0 &&
          (c.min == null || a >= c.min) &&
          (c.max == null || a <= c.max);
      else if (c.rule === "range")
        ok =
          (c.minInclusive === false ? a > c.min : a >= c.min) &&
          (c.maxInclusive === false ? a < c.max : a <= c.max);
      else if (c.rule === "prime")
        ok =
          Number.isInteger(a) &&
          a >= 2 &&
          !Array.from({ length: Math.max(0, Math.floor(Math.sqrt(a)) - 1) }, (_, i) => i + 2).some(
            (d) => a % d === 0,
          ) &&
          (c.min == null || a >= c.min) &&
          (c.max == null || a <= c.max);
      else if (c.rule === "digitMultiple")
        ok =
          Number.isInteger(a) &&
          String(a).length === c.digits &&
          a % c.divisor === 0 &&
          (c.lastDigit == null || a % 10 === c.lastDigit);
      else throw Error("Type de réponse non pris en charge");
    } else {
      ok =
        answers.length === vals.length &&
        answers.every((a, i) => {
          const f = q.fields[i] || q.fields[0] || {};
          if (c.type === "text" || f.kind === "text")
            return (
              normalize(a) === normalize(vals[i]) ||
              (c.accepted?.map(normalize).includes(normalize(a)) ?? false)
            );
          if (f.kind === "expression") {
            if (letters(a) !== letters(vals[i])) return false;
            const p = polynomial(a),
              e = polynomial(vals[i]);
            return Array.from({ length: Math.max(p.length, e.length) }, (_, j) =>
              near(p[j] || 0, e[j] || 0),
            ).every(Boolean);
          }
          return near(numeric(a), numeric(vals[i]));
        });
    }
    if (
      ok &&
      c.exactRadicals &&
      answers
        .flatMap((a) => (c.type === "set" ? String(a).split(/[;\n]+/) : [String(a)]))
        .some((a) => !/√|sqrt/.test(a)) &&
      vals.some((v) => /√|sqrt/.test(String(v)))
    )
      return {
        ok: false,
        syntax: false,
        message: "Donne les valeurs exactes avec une racine carrée.",
      };
    if (
      ok &&
      c.form === "decimal" &&
      !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(String(answers[0]).trim())
    )
      return {
        ok: false,
        syntax: false,
        message: "Donne une écriture décimale, avec une virgule si nécessaire.",
      };
    if (ok && c.form === "integer") ok = Number.isInteger(numeric(answers[0]));
    if (ok && (c.form === "irreducible" || c.form === "irreducibleFraction")) {
      let a = normalize(answers[0]),
        m = a.match(/^(-?\d+)\/(-?\d+)$/);
      ok = m ? Number(m[2]) !== 0 && gcd(Number(m[1]), Number(m[2])) === 1 : /^-?\d+$/.test(a);
      if (!ok)
        return {
          ok: false,
          syntax: false,
          message: "La valeur est juste. Écris-la sous forme irréductible.",
        };
    }
    if (ok && (c.form === "factorized" || c.form === "factorised")) {
      const a = normalize(answers[0]);
      if (!factorForm(answers[0], vals[0]))
        return {
          ok: false,
          syntax: false,
          message: "La valeur est juste. On demande une forme factorisée.",
        };
    }
    if (ok && (c.form === "expanded" || c.form === "reduced") && !reducedForm(answers[0]))
      return { ok: false, syntax: false, message: "Développe et réduis encore ton expression." };
    return {
      ok,
      syntax: false,
      message: ok ? "Bien joué !" : "Pas encore. Tu peux réessayer ou regarder un indice.",
    };
  } catch (e) {
    return { ok: false, syntax: true, message: "Vérifie l’écriture : " + e.message + "." };
  }
}
