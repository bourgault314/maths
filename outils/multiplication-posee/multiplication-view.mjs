import { placeValueMarker } from "./multiplication-engine.mjs";
import { getMultiplicationDisplayState } from "./multiplication-steps.mjs";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function gridColumn(layoutIndex) {
  return String(layoutIndex + 2);
}

function addFactorRow(grid, multiplication, state, factorIndex, row, showRankGuides) {
  const cells = factorIndex === 0
    ? multiplication.firstFactorCells
    : multiplication.secondFactorCells;
  const factorDigits = multiplication.integerFactors[factorIndex];
  const factorStart = multiplication.layoutColumnCount - factorDigits.length;

  cells.forEach((value, layoutIndex) => {
    const cell = element(
      "span",
      `digit-cell factor-cell factor-${factorIndex + 1}-cell`,
      (factorIndex === 0 ? state.showFirstFactor : state.showSecondFactor) ? (value ?? "") : ""
    );
    cell.style.gridColumn = gridColumn(layoutIndex);
    cell.style.gridRow = String(row);
    const digitIndex = layoutIndex - factorStart;
    const active = factorIndex === 0
      ? state.activeMultiplicandDigitIndex === digitIndex
      : state.activeMultiplierDigitIndex === digitIndex;
    cell.classList.toggle("is-active", active && value !== null);
    cell.classList.toggle("is-aligned", state.alignmentActive && value !== null);
    cell.setAttribute("aria-hidden", "true");

    if (showRankGuides && factorIndex === 0 && value !== null) {
      const exponent = multiplication.layoutColumnCount - layoutIndex - 1;
      const marker = element("span", "rank-marker", placeValueMarker(exponent));
      marker.setAttribute("aria-hidden", "true");
      cell.append(marker);
    }
    grid.append(cell);
  });
}

function addCarry(cell, value, status, className) {
  const carry = element("span", `carry-chip ${className} is-${status}`, value);
  carry.setAttribute("aria-hidden", "true");
  cell.append(carry);
}

function addPartialRows(grid, multiplication, state) {
  multiplication.partials.forEach((partial, partialIndex) => {
    const row = 4 + partialIndex;
    const visible = state.partialVisible[partialIndex];
    const rowStarted = state.activePartialIndex === partialIndex || visible.some(Boolean);
    if (!rowStarted) return;

    const rank = element("span", "partial-label", `× ${partial.multiplierDigit}`);
    rank.style.gridColumn = "1";
    rank.style.gridRow = String(row);
    rank.classList.toggle("is-active", state.activePartialIndex === partialIndex);
    rank.setAttribute("aria-hidden", "true");
    grid.append(rank);

    const carries = state.multiplicationCarries.filter((carry) => (
      carry.partialIndex === partialIndex && carry.visible
    ));

    partial.cells.forEach((value, layoutIndex) => {
      const isVisible = visible[layoutIndex] && value !== null;
      const cell = element("span", "digit-cell partial-cell", isVisible ? value : "");
      cell.style.gridColumn = gridColumn(layoutIndex);
      cell.style.gridRow = String(row);
      cell.classList.toggle("is-visible", isVisible);
      cell.classList.toggle(
        "is-shift-zero",
        isVisible && partial.shiftLayoutIndices.includes(layoutIndex)
      );
      cell.classList.toggle(
        "is-target",
        state.activePartialIndex === partialIndex
          && state.activePartialTarget === layoutIndex
          && !isVisible
      );
      const carry = carries.find((candidate) => candidate.targetLayoutIndex === layoutIndex);
      if (carry) addCarry(cell, carry.value, carry.status, "multiplication-carry");
      cell.setAttribute("aria-hidden", "true");
      grid.append(cell);
    });
  });
}

function addResultRow(grid, multiplication, state) {
  const row = 5 + multiplication.partials.length;
  if (state.resultText) {
    const result = element("span", "result-number-text", state.resultText);
    result.style.gridColumn = "2 / -1";
    result.style.gridRow = String(row);
    result.setAttribute("aria-hidden", "true");
    grid.append(result);
    return;
  }

  const carries = state.additionCarries.filter(({ visible }) => visible);
  multiplication.productCells.forEach((value, layoutIndex) => {
    const isVisible = state.resultVisible[layoutIndex] && value !== null;
    const cell = element("span", "digit-cell result-cell", isVisible ? value : "");
    cell.style.gridColumn = gridColumn(layoutIndex);
    cell.style.gridRow = String(row);
    cell.classList.toggle("is-visible", isVisible);
    cell.classList.toggle(
      "is-target",
      state.activeAdditionTarget === layoutIndex && !isVisible
    );
    const carry = carries.find((candidate) => candidate.targetLayoutIndex === layoutIndex);
    if (carry) addCarry(cell, carry.value, carry.status, "addition-carry");
    cell.setAttribute("aria-hidden", "true");
    grid.append(cell);
  });
}

export function buildMultiplicationAriaLabel(multiplication, step) {
  const operation = `${multiplication.displayFactors[0]} fois ${multiplication.displayFactors[1]}`;
  if (step.kind === "decimal-observe") {
    return `Multiplication posée de ${operation}. La place de la virgule est encore à préparer.`;
  }
  if (step.kind === "vocabulary") {
    return `${operation} égale ${multiplication.resultDisplay}. Multiplication entièrement complétée.`;
  }
  return `Multiplication posée de ${operation}. ${step.sentence}`;
}

export function renderDecimalPreparation(container, multiplication, state) {
  container.hidden = !state.showDecimalPreparation;
  if (!state.showDecimalPreparation) {
    container.replaceChildren();
    return;
  }

  container.classList.toggle("is-compact", state.compactDecimalPreparation);
  const heading = element("p", "decimal-preparation-title", "Je prépare la virgule");
  const expression = element(
    "strong",
    "decimal-original-expression",
    `${multiplication.displayFactors[0]} × ${multiplication.displayFactors[1]}`
  );
  expression.hidden = !state.showOriginalExpression;

  const labels = ["1er facteur", "2e facteur", "Total"];
  const values = [
    multiplication.decimalPlacesByFactor[0],
    multiplication.decimalPlacesByFactor[1],
    multiplication.totalDecimalPlaces
  ];
  const counts = element("div", "decimal-counts");
  labels.forEach((label, index) => {
    const card = element("span", `decimal-count decimal-count-${index + 1}`);
    const value = element(
      "strong",
      state.decimalCountsVisible[index] ? "is-visible" : "",
      state.decimalCountsVisible[index] ? values[index] : "?"
    );
    card.append(element("small", "", label), value);
    counts.append(card);
  });

  container.replaceChildren(heading, expression, counts);
}

export function renderMultiplication({
  root,
  multiplication,
  steps,
  stepIndex,
  showRankGuides = false,
  metrics
}) {
  const state = getMultiplicationDisplayState(multiplication, steps, stepIndex);
  root.hidden = !state.showGrid;
  if (!state.showGrid) {
    root.replaceChildren();
    return state;
  }

  const grid = element("div", "posed-multiplication");
  grid.classList.toggle("has-rank-guides", showRankGuides);
  grid.style.setProperty("--column-count", multiplication.layoutColumnCount);
  grid.style.setProperty("--partial-count", multiplication.partials.length);
  grid.style.setProperty("--column-width", `${metrics.columnWidth}px`);
  grid.style.setProperty("--row-height", `${metrics.rowHeight}px`);
  grid.style.setProperty("--digit-size", `${metrics.digitSize}px`);
  grid.style.setProperty("--sign-width", `${metrics.signWidth}px`);
  grid.setAttribute("role", "img");
  grid.setAttribute("aria-label", buildMultiplicationAriaLabel(multiplication, state.step));

  addFactorRow(grid, multiplication, state, 0, 1, showRankGuides);
  addFactorRow(grid, multiplication, state, 1, 2, false);

  if (state.showSign) {
    const sign = element("span", "multiplication-sign", "×");
    sign.style.gridColumn = "1";
    sign.style.gridRow = "2";
    sign.setAttribute("aria-hidden", "true");
    grid.append(sign);
  }

  if (state.showFirstRule) {
    const firstRule = element("span", "operation-rule first-rule");
    firstRule.style.gridColumn = "2 / -1";
    firstRule.style.gridRow = "3";
    firstRule.setAttribute("aria-hidden", "true");
    grid.append(firstRule);
  }

  addPartialRows(grid, multiplication, state);

  if (state.showPlusSign) {
    const plus = element("span", "addition-sign", "+");
    plus.style.gridColumn = "1";
    plus.style.gridRow = String(3 + multiplication.partials.length);
    plus.setAttribute("aria-hidden", "true");
    grid.append(plus);
  }

  if (state.showSecondRule) {
    const secondRule = element("span", "operation-rule second-rule");
    secondRule.style.gridColumn = "2 / -1";
    secondRule.style.gridRow = String(4 + multiplication.partials.length);
    secondRule.setAttribute("aria-hidden", "true");
    grid.append(secondRule);
  }

  addResultRow(grid, multiplication, state);
  root.replaceChildren(grid);
  return state;
}

export function renderVocabulary(container, multiplication, visible) {
  container.hidden = !visible;
  if (!visible) return;
  container.querySelector(".first-factor-value").textContent = multiplication.displayFactors[0];
  container.querySelector(".second-factor-value").textContent = multiplication.displayFactors[1];
  container.querySelector(".product-value").textContent = multiplication.resultDisplay;
}
