import {
  mathHtml as mathText,
  mathSegments,
  collerPonctuation,
  collerDans,
} from "./math-format.js";
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
  // « Calcule 3 + 4. » : le point final après le calcul ne s'écrit pas.
  const dernier = parts.length - 1;
  if (parts[dernier]?.value === "." && parts[dernier - 1]?.math && instruction) parts.pop();
  // La ponctuation qui suit un calcul lui reste collée (« … divisible par 9 ? » sans « ? » seul à la ligne).
  const morceaux = collerPonctuation(parts);
  return morceaux
    .map((part, rang) => {
      // Une élision coupée de son apostrophe (le « c » de « 52,73, c'est ») et le verbe « a » (« Lina a
      // écrit ») restent des lettres droites quand la phrase entière ne les lit pas comme une formule
      // (lot NC-2) ; seuls, ils passeraient pour des variables.
      const elision =
        !part.math &&
        (part.value === "a" ||
          (/^\p{L}$/u.test(part.value) && /^['’]/.test(morceaux[rang + 1]?.value || "")));
      const html = part.math
        ? collerDans(mathText(part.value), part.colle)
        : elision
          ? part.value
          : mathText(part.value);
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
