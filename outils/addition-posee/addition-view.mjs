import { placeValueMarker } from "./addition-engine.mjs";
import { getAdditionDisplayState } from "./addition-steps.mjs";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function digitGridColumn(addition, layoutIndex) {
  const decimalOffset = addition.decimalPlaces > 0 && layoutIndex >= addition.layoutIntegerPlaces ? 1 : 0;
  return 2 + layoutIndex + decimalOffset;
}

function addComma(grid, addition, row, className, visible = true) {
  if (addition.decimalPlaces === 0 || !visible) return;
  const comma = element("span", `comma-cell ${className}`, ",");
  comma.style.gridColumn = String(2 + addition.layoutIntegerPlaces);
  comma.style.gridRow = String(row);
  comma.setAttribute("aria-hidden", "true");
  grid.append(comma);
}

function addTermRow(grid, addition, cells, row, className, state, showRankGuides) {
  cells.forEach((value, layoutIndex) => {
    const cell = element("span", `digit-cell ${className}`, value ?? "");
    cell.style.gridColumn = String(digitGridColumn(addition, layoutIndex));
    cell.style.gridRow = String(row);
    const isCurrentDigit = value !== null
      && state.activeArea === "terms"
      && state.activeLayoutIndex === layoutIndex;
    cell.classList.toggle("is-active", isCurrentDigit);
    cell.setAttribute("aria-hidden", "true");
    if (showRankGuides && row === 2) {
      const marker = element("span", "rank-marker", placeValueMarker(addition.places[layoutIndex].exponent));
      marker.setAttribute("aria-hidden", "true");
      cell.append(marker);
    }
    grid.append(cell);
  });
  addComma(grid, addition, row, className);
}

function addCarries(grid, addition, state) {
  state.carries.forEach((carry) => {
    if (!carry.visible || carry.targetLayoutIndex === null) return;
    const cell = element("span", `carry-cell is-${carry.status}`, carry.value);
    cell.style.gridColumn = String(digitGridColumn(addition, carry.targetLayoutIndex));
    cell.style.gridRow = "1";
    cell.setAttribute("aria-hidden", "true");
    grid.append(cell);
  });
}

function addResultRow(grid, addition, state) {
  addition.resultCells.forEach((value, layoutIndex) => {
    const visible = state.resultVisible[layoutIndex];
    const cell = element("span", "digit-cell result-cell", visible ? value : "");
    cell.style.gridColumn = String(digitGridColumn(addition, layoutIndex));
    cell.style.gridRow = "5";
    cell.classList.toggle("is-visible", visible);
    cell.classList.toggle(
      "is-active",
      visible && state.activeArea === "result" && state.activeLayoutIndex === layoutIndex
    );
    cell.setAttribute("aria-hidden", "true");
    grid.append(cell);
  });
  addComma(grid, addition, 5, "result-comma", state.resultCommaVisible);
}

export function buildAdditionAriaLabel(addition, step) {
  const operation = addition.displayTerms.join(" plus ");
  if (step.kind === "pose") {
    return `Addition posée de ${operation}. Le résultat et les retenues sont encore vides.`;
  }
  if (step.kind === "verify") {
    return `${operation} égale ${addition.resultDisplay}. Addition entièrement complétée.`;
  }
  return `Addition posée de ${operation}. ${step.sentence}`;
}

export function renderAddition({
  root,
  addition,
  steps,
  stepIndex,
  showRankGuides = false,
  metrics
}) {
  const state = getAdditionDisplayState(addition, steps, stepIndex);
  const grid = element(
    "div",
    `posed-addition ${addition.decimalPlaces > 0 ? "has-decimals" : "has-integers-only"}`
  );
  grid.classList.toggle("has-rank-guides", showRankGuides);
  grid.style.setProperty("--integer-columns", addition.layoutIntegerPlaces);
  grid.style.setProperty("--decimal-columns", addition.decimalPlaces);
  grid.style.setProperty("--column-width", `${metrics.columnWidth}px`);
  grid.style.setProperty("--row-height", `${metrics.rowHeight}px`);
  grid.style.setProperty("--digit-size", `${metrics.digitSize}px`);
  grid.style.setProperty("--sign-width", `${metrics.signWidth}px`);
  grid.style.setProperty("--separator-width", `${metrics.separatorWidth}px`);
  grid.setAttribute("role", "img");
  grid.setAttribute("aria-label", buildAdditionAriaLabel(addition, state.step));

  addCarries(grid, addition, state);
  addTermRow(grid, addition, addition.termCells[0], 2, "term-one-cell", state, showRankGuides);
  addTermRow(grid, addition, addition.termCells[1], 3, "term-two-cell", state, false);

  const sign = element("span", "addition-sign", "+");
  sign.style.gridColumn = "1";
  sign.style.gridRow = "3";
  sign.setAttribute("aria-hidden", "true");
  grid.append(sign);

  const rule = element("span", "addition-rule");
  rule.style.gridColumn = "2 / -1";
  rule.style.gridRow = "4";
  rule.setAttribute("aria-hidden", "true");
  grid.append(rule);

  addResultRow(grid, addition, state);
  root.replaceChildren(grid);
  return state;
}

export function renderVocabulary(container, addition, visible) {
  container.hidden = !visible;
  if (!visible) return;
  const values = [addition.displayTerms[0], addition.displayTerms[1], addition.resultDisplay];
  container.querySelectorAll("[data-vocabulary-value]").forEach((node, index) => {
    node.textContent = values[index];
  });
  container.setAttribute(
    "aria-label",
    `${addition.displayTerms[0]} plus ${addition.displayTerms[1]} égale ${addition.resultDisplay}. `
      + "Premier terme plus second terme égale somme."
  );
}
