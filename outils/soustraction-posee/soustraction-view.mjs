import { placeValueMarker } from "./soustraction-engine.mjs";
import { getSubtractionDisplayState } from "./soustraction-steps.mjs";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function digitGridColumn(subtraction, layoutIndex) {
  const decimalOffset = subtraction.decimalPlaces > 0
    && layoutIndex >= subtraction.layoutIntegerPlaces ? 1 : 0;
  return 2 + layoutIndex + decimalOffset;
}

function addDecimalBand(grid, subtraction) {
  if (subtraction.decimalPlaces === 0) return;
  const band = element("span", "decimal-separator-band");
  band.style.gridColumn = String(2 + subtraction.layoutIntegerPlaces);
  band.style.gridRow = "1 / 6";
  band.setAttribute("aria-hidden", "true");
  grid.append(band);
}

function addComma(grid, subtraction, row, className, visible = true) {
  if (subtraction.decimalPlaces === 0 || !visible) return;
  const comma = element("span", `comma-cell ${className}`, ",");
  comma.style.gridColumn = String(2 + subtraction.layoutIntegerPlaces);
  comma.style.gridRow = String(row);
  comma.setAttribute("aria-hidden", "true");
  grid.append(comma);
}

function addExchangeRow(grid, subtraction, state) {
  state.transformedIndices.forEach((layoutIndex) => {
    const value = state.minuendDigits[layoutIndex];
    const fresh = state.activeArea === "exchange"
      && state.activeLayoutIndices.includes(layoutIndex);
    const cell = element("span", `exchange-cell ${fresh ? "is-fresh" : "is-settled"}`, value);
    cell.style.gridColumn = String(digitGridColumn(subtraction, layoutIndex));
    cell.style.gridRow = "1";
    cell.setAttribute("aria-hidden", "true");
    grid.append(cell);
  });
}

function addTermRow(grid, subtraction, cells, row, className, state, showRankGuides) {
  cells.forEach((value, layoutIndex) => {
    const cell = element("span", `digit-cell ${className}`, value ?? "");
    cell.style.gridColumn = String(digitGridColumn(subtraction, layoutIndex));
    cell.style.gridRow = String(row);
    const active = state.activeArea === "terms"
      && state.activeLayoutIndices.includes(layoutIndex);
    cell.classList.toggle("is-active", active);
    if (row === 2) {
      cell.classList.toggle("is-exchanged", state.transformedIndices.includes(layoutIndex));
    }
    cell.setAttribute("aria-hidden", "true");
    if (showRankGuides && row === 2) {
      const marker = element(
        "span",
        "rank-marker",
        placeValueMarker(subtraction.places[layoutIndex].exponent)
      );
      marker.setAttribute("aria-hidden", "true");
      cell.append(marker);
    }
    grid.append(cell);
  });
  addComma(grid, subtraction, row, className);
}

function addResultRow(grid, subtraction, state) {
  subtraction.resultCells.forEach((value, layoutIndex) => {
    const visible = state.resultVisible[layoutIndex];
    const cell = element("span", "digit-cell result-cell", visible ? (value ?? "") : "");
    cell.style.gridColumn = String(digitGridColumn(subtraction, layoutIndex));
    cell.style.gridRow = "5";
    cell.classList.toggle("is-visible", visible && value !== null);
    cell.classList.toggle(
      "is-active",
      visible
        && state.activeArea === "result"
        && state.activeLayoutIndices.includes(layoutIndex)
    );
    cell.setAttribute("aria-hidden", "true");
    grid.append(cell);
  });
  addComma(grid, subtraction, 5, "result-comma", state.resultCommaVisible);
}

export function buildSubtractionAriaLabel(subtraction, step) {
  const operation = `${subtraction.displayTerms[0]} moins ${subtraction.displayTerms[1]}`;
  if (step.kind === "pose") {
    return `Soustraction posée de ${operation}. La différence et les échanges sont encore vides.`;
  }
  if (step.kind === "verify") {
    return `${operation} égale ${subtraction.resultDisplay}. Soustraction entièrement complétée.`;
  }
  return `Soustraction posée de ${operation}. ${step.sentence}`;
}

export function renderSubtraction({
  root,
  subtraction,
  steps,
  stepIndex,
  showRankGuides = false,
  metrics
}) {
  const state = getSubtractionDisplayState(subtraction, steps, stepIndex);
  const grid = element(
    "div",
    `posed-subtraction ${subtraction.decimalPlaces > 0 ? "has-decimals" : "has-integers-only"}`
  );
  grid.classList.toggle("has-rank-guides", showRankGuides);
  grid.style.setProperty("--integer-columns", subtraction.layoutIntegerPlaces);
  grid.style.setProperty("--decimal-columns", subtraction.decimalPlaces);
  grid.style.setProperty("--column-width", `${metrics.columnWidth}px`);
  grid.style.setProperty("--row-height", `${metrics.rowHeight}px`);
  grid.style.setProperty("--digit-size", `${metrics.digitSize}px`);
  grid.style.setProperty("--sign-width", `${metrics.signWidth}px`);
  grid.style.setProperty("--separator-width", `${metrics.separatorWidth}px`);
  grid.setAttribute("role", "img");
  grid.setAttribute("aria-label", buildSubtractionAriaLabel(subtraction, state.step));

  addDecimalBand(grid, subtraction);
  addExchangeRow(grid, subtraction, state);
  addTermRow(grid, subtraction, subtraction.termCells[0], 2, "term-one-cell", state, showRankGuides);
  addTermRow(grid, subtraction, subtraction.termCells[1], 3, "term-two-cell", state, false);

  const sign = element("span", "subtraction-sign", "−");
  sign.style.gridColumn = "1";
  sign.style.gridRow = "3";
  sign.setAttribute("aria-hidden", "true");
  grid.append(sign);

  const rule = element("span", "subtraction-rule");
  rule.style.gridColumn = "2 / -1";
  rule.style.gridRow = "4";
  rule.setAttribute("aria-hidden", "true");
  grid.append(rule);

  addResultRow(grid, subtraction, state);
  root.replaceChildren(grid);
  return state;
}

export function renderVocabulary(container, visible) {
  container.hidden = !visible;
}
