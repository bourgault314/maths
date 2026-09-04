import {
  getOperationDisplayState,
  makeDisplayMetrics,
  makeDivision,
  makeSteps,
  multiplicationBracket,
  placeValueMarker
} from "./division-engine.mjs?v=10";
import {
  createRankMarker,
  createPotence,
  createQuotientSlot,
  createRelationSign,
  createRoleCard,
  renderMultiplicationTable,
  scheduleLoweringArrow
} from "./division-view.mjs?v=3";

const $ = (selector) => document.querySelector(selector);
const dividendInput = $("#dividend");
const divisorInput = $("#divisor");
const decimalField = $("#decimal-field");
const decimalPlaces = $("#decimal-places");
const errorBox = $("#form-error");
const rankGuides = $("#rank-guides");
const rankGuidesStorageKey = "mathsgo-division-rank-guides";
let selectedMode = "integer";
let problem = { dividend: 584, divisor: 7, mode: "integer", decimals: 2 };
let division = makeDivision(584, 7, "integer", 2);
let steps = makeSteps(division);
let stepIndex = 0;
let projectionEditing = false;
let showRankGuides = false;
let tableVisible = true;

try {
  showRankGuides = window.localStorage.getItem(rankGuidesStorageKey) === "true";
} catch {
  showRankGuides = false;
}
rankGuides.checked = showRankGuides;

function setMode(mode) {
  selectedMode = mode;
  $("#division-form").classList.toggle("is-decimal", mode === "decimal");
  document.querySelectorAll("[data-mode]").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  decimalField.hidden = mode !== "decimal";
  decimalPlaces.disabled = mode !== "decimal";
  $("#page-title").textContent = mode === "integer" ? "Division euclidienne" : "Division posée décimale";
  const pdf = $("#pdf-link");
  pdf.href = mode === "integer" ? "gabarit-division-euclidienne.pdf" : "gabarit-division-decimale.pdf";
  pdf.textContent = mode === "integer" ? "Gabarit euclidien" : "Gabarit décimal";
}

function visibleQuotient(step) {
  if (["anticipation-question", "anticipation-answer", "anticipation-result", "estimate"].includes(step.kind)) return "";
  let result = "";
  let comma = false;
  division.operations.forEach((operation, index) => {
    if (!getOperationDisplayState(division, index, step).quotient) return;
    if (operation.isDecimalDigit && !comma) { result += ","; comma = true; }
    result += operation.quotientDigit;
  });
  const currentOperation = step.opIndex === undefined ? null : division.operations[step.opIndex];
  const decimalStarted = step.kind === "decimal"
    || currentOperation?.isDecimalDigit;
  if (decimalStarted && !result.includes(",")) result += ",";
  return result;
}

function activePlaceColumn(step) {
  if (step.anticipationEndColumn !== undefined) return step.anticipationEndColumn;
  if (step.opIndex === undefined) return null;
  const operation = division.operations[step.opIndex];
  if (["bring", "decimal"].includes(step.kind) && operation.nextEndColumn !== undefined) {
    return operation.nextEndColumn;
  }
  return operation.endColumn;
}

function rankMarker(endColumn, activeColumn) {
  return createRankMarker(placeValueMarker(division, endColumn), endColumn === activeColumn);
}

function quotientSlot(value, endColumn, activeColumn) {
  return createQuotientSlot({
    classNames: [value ? "is-filled" : "is-empty"],
    content: value,
    rankLabel: showRankGuides && endColumn !== undefined ? placeValueMarker(division, endColumn) : "",
    rankActive: endColumn === activeColumn,
    ariaHidden: !value
  });
}

function quotientWriting(step) {
  const writing = document.createElement("span");
  writing.className = "quotient-writing";
  const visible = visibleQuotient(step);
  const [visibleInteger, visibleDecimal = ""] = visible.split(",");
  const integerOperations = division.operations.filter(({ isDecimalDigit }) => !isDecimalDigit);
  const decimalOperations = division.operations.filter(({ isDecimalDigit }) => isDecimalDigit);
  const activeColumn = activePlaceColumn(step);
  const showIntegerSlots = !["anticipation-question", "anticipation-answer"].includes(step.kind);

  integerOperations.forEach((operation, index) => {
    if (!showIntegerSlots) return;
    writing.append(quotientSlot(visibleInteger[index] || "", operation.endColumn, activeColumn));
  });

  const commaVisible = visible.includes(",");
  if (commaVisible) {
    const comma = document.createElement("span");
    comma.className = "quotient-comma";
    comma.textContent = ",";
    writing.append(comma);

    visibleDecimal.split("").forEach((character, index) => {
      writing.append(quotientSlot(character, decimalOperations[index]?.endColumn, activeColumn));
    });

    const currentOperation = step.opIndex === undefined ? null : division.operations[step.opIndex];
    const currentState = currentOperation
      ? getOperationDisplayState(division, step.opIndex, step)
      : null;
    const needsCurrentDecimalSlot = currentOperation?.isDecimalDigit && !currentState?.quotient;
    const needsNextDecimalSlot = step.kind === "decimal"
      || (step.kind === "bring"
        && currentOperation?.isDecimalDigit
        && currentOperation.nextEndColumn >= division.integerLength);
    if (needsCurrentDecimalSlot || needsNextDecimalSlot) {
      const nextOperation = needsCurrentDecimalSlot
        ? currentOperation
        : division.operations[step.opIndex + 1];
      writing.append(quotientSlot("", nextOperation?.endColumn, activeColumn));
    }
  }

  const integerSlotCount = integerOperations.length;
  writing.setAttribute("aria-label", visible || `${integerSlotCount} emplacement${integerSlotCount > 1 ? "s" : ""} pour le quotient`);
  return writing;
}

function digitRow(value, endColumn, className, options = {}) {
  const row = document.createElement("div");
  row.className = `digit-row ${className}`;
  row.classList.toggle("is-placeholder", !options.visible);
  if (!options.visible) row.setAttribute("aria-hidden", "true");
  row.style.setProperty("--columns", division.digits.length);
  const chars = String(value).split("");
  const start = endColumn - chars.length + 1;
  chars.forEach((char, offset) => {
    const cell = document.createElement("span");
    cell.className = `digit ${options.active ? "active" : ""} ${options.brought && offset === chars.length - 1 ? "brought-digit" : ""}`;
    cell.style.gridColumn = String(start + offset + 1);
    cell.textContent = char;
    row.append(cell);
  });
  if (options.subtraction) {
    const rule = document.createElement("span");
    rule.className = "subtraction-rule";
    rule.setAttribute("aria-hidden", "true");
    rule.style.gridColumn = `${start + 1} / ${endColumn + 2}`;
    row.append(rule);
  }
  return row;
}

function dividendRow(step) {
  const row = document.createElement("div");
  row.className = "digit-row dividend-row";
  row.style.setProperty("--columns", division.digits.length);
  const revealsNextDigit = ["bring", "decimal"].includes(step.kind);
  const operationEnd = step.kind === "finish"
    ? division.digits.length - 1
    : step.opIndex === undefined
      ? division.integerLength - 1
      : division.operations[step.opIndex].endColumn + (revealsNextDigit ? 1 : 0);
  const visibleEnd = operationEnd;
  const activeColumn = activePlaceColumn(step);
  const anticipationEnd = step.anticipationEndColumn;
  division.digits.forEach((digit, index) => {
    const cell = document.createElement("span");
    const isLowered = step.kind === "bring"
      && division.operations[step.opIndex]?.nextEndColumn === index
      && index < division.integerLength;
    const isAnticipationActive = anticipationEnd !== undefined && index <= anticipationEnd;
    const isAnticipationPending = anticipationEnd !== undefined && index > anticipationEnd;
    cell.className = `digit ${index > visibleEnd || isAnticipationPending ? "pending" : ""} ${isAnticipationActive ? "active" : ""} ${isLowered ? "falling-source" : ""}`;
    if (index === division.integerLength - 1 && division.mode === "decimal" && visibleEnd >= division.integerLength) cell.classList.add("comma-after");
    cell.style.gridColumn = String(index + 1);
    const isUnrevealedDecimal = index >= division.integerLength && index > visibleEnd;
    cell.textContent = isUnrevealedDecimal ? "" : digit;
    if (isUnrevealedDecimal) cell.setAttribute("aria-hidden", "true");
    if (showRankGuides && index <= visibleEnd) cell.append(rankMarker(index, activeColumn));
    row.append(cell);
  });
  return row;
}

function renderDivision(step) {
  const root = $("#long-division");
  root.replaceChildren();
  root.classList.toggle("has-rank-guides", showRankGuides);
  const stage = root.closest(".division-stage");
  const projectionMode = document.body.classList.contains("is-projection");
  const wideMode = projectionMode || window.innerWidth >= 1280;
  const metricOptions = wideMode ? {
    rowBudget: Math.max(320, Math.min(projectionMode ? 590 : 500, stage.clientHeight - $("#role-strip").offsetHeight - 28)),
    columnBudget: Math.max(460, Math.min(projectionMode ? 820 : 740, Math.floor(root.clientWidth * .76))),
    quotientBudget: Math.max(240, Math.min(projectionMode ? 390 : 350, Math.floor(root.clientWidth * .32))),
    maxRowHeight: projectionMode ? 76 : 68,
    maxColumnWidth: projectionMode ? 70 : 64,
    maxDigitSize: projectionMode ? 56 : 50,
    maxQuotientSize: projectionMode ? 55 : 49
  } : undefined;
  const metrics = makeDisplayMetrics(division, metricOptions);
  root.style.setProperty("--row-height", `${metrics.rowHeight}px`);
  root.style.setProperty("--digit-size", `${metrics.digitSize}px`);
  root.style.setProperty("--column-width", `${metrics.columnWidth}px`);
  root.style.setProperty("--quotient-size", `${metrics.quotientSize}px`);
  const work = document.createElement("div");
  work.className = "work-column";
  work.append(dividendRow(step));

  division.operations.forEach((operation, index) => {
    const visible = getOperationDisplayState(division, index, step);
    work.append(digitRow(operation.product, operation.endColumn, "product-row", {
      visible: visible.product,
      subtraction: visible.subtraction,
      active: step.kind === "multiply" && step.opIndex === index
    }));

    const showsNext = visible.result === "next" && operation.nextPartial !== undefined;
    const resultValue = showsNext ? operation.nextPartial : operation.remainder;
    const resultEndColumn = showsNext ? operation.nextEndColumn : operation.endColumn;
    work.append(digitRow(resultValue, resultEndColumn, showsNext ? "partial-row" : "remainder-row", {
      visible: Boolean(visible.result),
      active: (["subtract", "bring", "decimal"].includes(step.kind) && step.opIndex === index)
        || (["ask", "choose"].includes(step.kind) && step.opIndex === index + 1),
      brought: step.kind === "bring" && step.opIndex === index
    }));
  });

  const potence = createPotence(division.divisor, quotientWriting(step));
  root.append(work, potence);

  const showValues = step.kind === "finish";
  $("#role-strip").replaceChildren(
    createRoleCard("dividend", "dividende", showValues ? division.dividend : "…"),
    createRelationSign("="),
    createRoleCard("quotient", "quotient", showValues ? division.quotient : "…"),
    createRelationSign("×"),
    createRoleCard("divisor", "diviseur", showValues ? division.divisor : "…"),
    createRelationSign("+"),
    createRoleCard("remainder", "reste", showValues ? division.scaledRemainder : "…")
  );
  scheduleLoweringArrow(root);
}

function renderTable(step) {
  const active = step.opIndex !== undefined && ["choose", "multiply", "subtract-ask", "subtract"].includes(step.kind)
    ? division.operations[step.opIndex]?.quotientDigit
    : null;
  const bracket = step.kind === "choose" && step.opIndex !== undefined
    ? multiplicationBracket(division, step.opIndex)
    : null;
  renderMultiplicationTable({
    division,
    title: $("#table-title"),
    bracketLine: $("#table-bracket"),
    multiples: $("#multiples"),
    card: $("#table-card"),
    toggle: $("#table-toggle"),
    visible: tableVisible,
    compactToggle: true,
    activeMultiplier: active,
    bracket
  });
}

function render() {
  const step = steps[stepIndex];
  $("#step-title").textContent = step.title;
  $("#step-sentence").textContent = step.sentence;
  $("#step-detail").textContent = step.detail || "";
  $("#step-detail").hidden = !step.detail;
  $("#step-count").textContent = `${stepIndex + 1} / ${steps.length}`;
  $("#progress-bar").style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
  $("#previous").disabled = stepIndex === 0;
  $("#next").disabled = stepIndex === steps.length - 1;
  $("#show-all").hidden = stepIndex === steps.length - 1;
  $("#projection-problem").textContent = `${problem.dividend} ÷ ${problem.divisor} · ${problem.mode === "integer" ? "Entier" : `${problem.decimals} décimale${problem.decimals > 1 ? "s" : ""}`}`;
  renderDivision(step);
  renderTable(step);
}

function submit(event) {
  event.preventDefault();
  const dividend = Number(dividendInput.value);
  const divisor = Number(divisorInput.value);
  if (!Number.isInteger(dividend) || dividend < 0 || dividend > 99999999) {
    errorBox.textContent = "Le dividende doit être un entier entre 0 et 99 999 999.";
    errorBox.hidden = false;
    return;
  }
  if (!Number.isInteger(divisor) || divisor < 1 || divisor > 9999) {
    errorBox.textContent = "Le diviseur doit être un entier entre 1 et 9 999.";
    errorBox.hidden = false;
    return;
  }
  errorBox.hidden = true;
  problem = { dividend, divisor, mode: selectedMode, decimals: Number(decimalPlaces.value) };
  division = makeDivision(problem.dividend, problem.divisor, problem.mode, problem.decimals);
  steps = makeSteps(division);
  stepIndex = 0;
  if (document.fullscreenElement) {
    projectionEditing = false;
    syncProjectionMode(false);
  }
  render();
}

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
$("#division-form").addEventListener("submit", submit);
rankGuides.addEventListener("change", () => {
  showRankGuides = rankGuides.checked;
  try {
    window.localStorage.setItem(rankGuidesStorageKey, String(showRankGuides));
  } catch {
    // Le repère reste utilisable même si le stockage local est bloqué.
  }
  render();
});
$("#previous").addEventListener("click", () => { stepIndex = Math.max(0, stepIndex - 1); render(); });
$("#next").addEventListener("click", () => { stepIndex = Math.min(steps.length - 1, stepIndex + 1); render(); });
$("#show-all").addEventListener("click", () => { stepIndex = steps.length - 1; render(); });
$("#table-toggle").addEventListener("click", () => {
  tableVisible = !tableVisible;
  renderTable(steps[stepIndex]);
});
function updateFullscreenButton() {
  const button = $("#fullscreen");
  const isFullscreen = Boolean(document.fullscreenElement);
  button.textContent = "⛶";
  button.setAttribute("aria-label", isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran");
  button.title = isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran";
}

function syncProjectionMode(shouldRender = true) {
  const active = Boolean(document.fullscreenElement);
  if (!active) projectionEditing = false;
  document.body.classList.toggle("is-projection", active);
  document.body.classList.toggle("is-projection-editing", active && projectionEditing);
  $(".controls-card").hidden = active && !projectionEditing;
  $("#projection-recap").hidden = !active || projectionEditing;
  updateFullscreenButton();
  if (shouldRender) window.requestAnimationFrame(render);
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen?.();
  else await document.documentElement.requestFullscreen?.();
}

$("#fullscreen").addEventListener("click", toggleFullscreen);
$("#edit-problem").addEventListener("click", () => {
  projectionEditing = true;
  syncProjectionMode();
  window.requestAnimationFrame(() => dividendInput.focus());
});
document.addEventListener("fullscreenchange", () => {
  projectionEditing = false;
  syncProjectionMode();
});
document.addEventListener("keydown", (event) => {
  if (["INPUT", "SELECT"].includes(event.target.tagName)) return;
  if (event.key === "ArrowRight") { stepIndex = Math.min(steps.length - 1, stepIndex + 1); render(); }
  if (event.key === "ArrowLeft") { stepIndex = Math.max(0, stepIndex - 1); render(); }
});

let resizeFrame = 0;
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(render);
});

setMode("integer");
syncProjectionMode(false);
render();
