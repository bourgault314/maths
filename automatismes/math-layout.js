import { mathHtml as mathText, mathSegments } from "./math-format.js";
export function questionPrompt(q) {
  const instruction =
    /^(Calcule|Factorise|Développe|Réduis|Écris|Complète|Résous|Simplifie|Détermine)/.test(
      q.prompt,
    );
  const parts = mathSegments(q.prompt);
  for (let i = 0; i < parts.length - 1; i++) {
    if (!parts[i].math && / pour\s*$/.test(parts[i].value) && parts[i + 1].math) {
      parts[i].value = parts[i].value.replace(/ pour\s*$/, " ");
      parts[i + 1].prefix = "pour ";
    }
  }
  return parts
    .map((part, i) => {
      if (i === parts.length - 1 && part.value === "." && parts[i - 1]?.math && instruction)
        return "";
      const html = mathText(part.value);
      const formula =
        part.math && (/[+×÷=²³^/()]/.test(part.value) || /\S\s*[−-]\s*\S/.test(part.value));
      return instruction && formula && (!/^Écris/.test(q.prompt) || q.prompt.includes(":"))
        ? `<span class="question-expression">${part.prefix || ""}${html}</span>`
        : html;
    })
    .join("");
}
// Garde chaque expression entière ; recalcule sa taille après chargement des polices.
export function fitMathExpressions(root = document) {
  const items = [...root.querySelectorAll(".math-expression")];
  for (const el of items) el.style.fontSize = "";
  for (const el of items) {
    if (!el.getClientRects().length) continue;
    const box =
      el.closest("h1,h2,h3,p,summary,button,label,.solutionlarge,.math,.unit") || el.parentElement;
    if (!box) continue;
    const cs = getComputedStyle(box),
      available =
        box.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    const width = Math.max(el.scrollWidth, el.getBoundingClientRect().width),
      size = parseFloat(getComputedStyle(el).fontSize);
    if (available > 0 && width > available)
      el.style.fontSize = `${Math.min(size, (size * (available - 2)) / width)}px`;
  }
}
