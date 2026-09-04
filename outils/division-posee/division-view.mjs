function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

export function createRankMarker(label, active = false) {
  const marker = element("span", "rank-marker", label);
  marker.classList.toggle("is-active", active);
  marker.setAttribute("aria-hidden", "true");
  return marker;
}

export function createQuotientSlot({
  classNames = [],
  content = null,
  rankLabel = "",
  rankActive = false,
  ariaHidden = false
} = {}) {
  const slot = element("span", ["quotient-slot", ...classNames].filter(Boolean).join(" "));
  if (rankLabel) slot.append(createRankMarker(rankLabel, rankActive));

  const value = element("span", "quotient-slot-value");
  if (content instanceof Node) value.append(content);
  else if (content !== null && content !== undefined) value.textContent = String(content);
  slot.append(value);

  if (ariaHidden) slot.setAttribute("aria-hidden", "true");
  return slot;
}

export function createPotence(divisor, quotientWriting) {
  const potence = element("div", "potence");
  const divisorBox = element("div", "potence-box");
  divisorBox.append(String(divisor), element("span", "role-label", "diviseur"));

  const quotientBox = element("div", "potence-box");
  quotientBox.append(quotientWriting, element("span", "role-label", "quotient"));
  potence.append(divisorBox, quotientBox);
  return potence;
}

export function createRoleCard(kind, label, content) {
  const card = element("div", `role-card ${kind}`);
  const value = element("strong");
  if (content instanceof Node) value.append(content);
  else value.textContent = String(content);
  card.append(value, element("small", "", label));
  return card;
}

export function createRelationSign(value) {
  return element("span", "relation-sign", value);
}

export function renderMultiplicationTable({
  division,
  title,
  bracketLine,
  multiples,
  card,
  toggle,
  visible,
  activeMultiplier = null,
  bracket = null
}) {
  const revealedBracket = visible ? bracket : null;
  const revealedMultiplier = visible ? activeMultiplier : null;
  title.textContent = `Table de ${division.divisor}`;
  bracketLine.hidden = !revealedBracket;
  bracketLine.textContent = revealedBracket
    ? `${revealedBracket.lowerProduct} ≤ ${revealedBracket.target} < ${revealedBracket.upperProduct}`
    : "";

  multiples.replaceChildren();
  multiples.classList.toggle("has-target-marker", Boolean(revealedBracket));
  const targetRow = revealedBracket
    ? Math.min(9, revealedBracket.upperMultiplier)
    : null;
  Array.from({ length: 10 }, (_, multiplier) => {
    const row = element("div", "multiple");
    if (multiplier === revealedMultiplier) row.classList.add("is-active");
    if (revealedBracket && multiplier === revealedBracket.upperMultiplier) {
      row.classList.add("is-upper-bound");
    }
    if (revealedBracket && multiplier === targetRow) {
      row.classList.add("has-target-badge");
      if (revealedBracket.upperMultiplier > 9) row.classList.add("is-target-after");
    }

    const equation = element("span", "multiple-equation");
    equation.append(
      element("span", "", `${multiplier} × ${division.divisor}`),
      element("span", "", "="),
      element("strong", "", visible ? multiplier * division.divisor : "?")
    );
    row.append(equation);

    if (revealedBracket && multiplier === targetRow) {
      const badge = element("span", "table-target-badge", revealedBracket.target);
      badge.setAttribute(
        "aria-label",
        `${revealedBracket.target} se place entre ${revealedBracket.lowerProduct} et ${revealedBracket.upperProduct}`
      );
      row.append(badge);
    }
    multiples.append(row);
  });

  card.classList.toggle("is-open", visible);
  card.classList.toggle("is-revealed", visible);
  toggle.textContent = visible ? "Masquer la table" : "Voir la table";
  toggle.setAttribute("aria-expanded", String(visible));
}

export function loweringArrowGeometry(sourceBox, targetBox, workBox) {
  const top = sourceBox.bottom - workBox.top + 5;
  const end = targetBox.top - workBox.top - 7;
  if (end <= top) return null;
  return {
    left: sourceBox.left + (sourceBox.width / 2) - workBox.left,
    top,
    height: end - top
  };
}

export function scheduleLoweringArrow(root) {
  window.requestAnimationFrame(() => {
    if (!root.isConnected) return;
    const work = root.querySelector(".work-column");
    const source = work?.querySelector(".falling-source");
    const target = work?.querySelector(".brought-digit");
    work?.querySelector(".lower-arrow")?.remove();
    if (!work || !source || !target) return;

    const workBox = work.getBoundingClientRect();
    const sourceBox = source.getBoundingClientRect();
    const targetBox = target.getBoundingClientRect();
    const geometry = loweringArrowGeometry(sourceBox, targetBox, workBox);
    if (!geometry) return;

    const arrow = element("span", "lower-arrow");
    arrow.setAttribute("aria-hidden", "true");
    arrow.style.left = `${geometry.left}px`;
    arrow.style.top = `${geometry.top}px`;
    arrow.style.height = `${geometry.height}px`;
    work.append(arrow);
  });
}
