import { getOperationDisplayState, makeDisplayMetrics, makeDivision, makeSteps } from "./division-engine.mjs?v=5";

const $ = (selector) => document.querySelector(selector);
const dividendInput = $("#dividend");
const divisorInput = $("#divisor");
const decimalField = $("#decimal-field");
const decimalPlaces = $("#decimal-places");
const errorBox = $("#form-error");
let selectedMode = "integer";
let problem = { dividend: 584, divisor: 7, mode: "integer", decimals: 2 };
let division = makeDivision(584, 7, "integer", 2);
let steps = makeSteps(division);
let stepIndex = 0;

function setMode(mode) {
  selectedMode = mode;
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
  if (["bound", "estimate"].includes(step.kind)) return "";
  let result = "";
  let comma = false;
  division.operations.forEach((operation, index) => {
    if (!getOperationDisplayState(division, index, step).quotient) return;
    if (operation.isDecimalDigit && !comma) { result += ","; comma = true; }
    result += operation.quotientDigit;
  });
  const currentOperation = step.opIndex === undefined ? null : division.operations[step.opIndex];
  const decimalStarted = step.kind === "decimal"
    || currentOperation?.isDecimalDigit
    || (step.kind === "bring" && currentOperation?.nextEndColumn >= division.integerLength);
  if (decimalStarted && !result.includes(",")) result += ",";
  return result;
}

function quotientWriting(step) {
  const writing = document.createElement("span");
  writing.className = "quotient-writing";
  const visible = visibleQuotient(step);
  const integerSlotCount = steps[0]?.quotientDigitCount
    ?? division.operations.filter(({ isDecimalDigit }) => !isDecimalDigit).length;
  const visibleIntegerCount = visible.split(",")[0].length;

  for (const character of visible) {
    const slot = document.createElement("span");
    slot.className = character === "," ? "quotient-comma" : "quotient-slot is-filled";
    slot.textContent = character;
    writing.append(slot);
  }
  for (let index = visibleIntegerCount; index < integerSlotCount; index += 1) {
    const slot = document.createElement("span");
    slot.className = "quotient-slot is-empty";
    slot.setAttribute("aria-hidden", "true");
    writing.append(slot);
  }
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
  const operationEnd = step.kind === "finish"
    ? division.digits.length - 1
    : step.opIndex === undefined
      ? division.integerLength - 1
      : division.operations[step.opIndex].endColumn + (step.kind === "bring" ? 1 : 0);
  const visibleEnd = operationEnd;
  division.digits.forEach((digit, index) => {
    const cell = document.createElement("span");
    const isLowered = step.kind === "bring"
      && division.operations[step.opIndex]?.nextEndColumn === index
      && index < division.integerLength;
    cell.className = `digit ${index > visibleEnd ? "pending" : ""} ${isLowered ? "falling-source" : ""}`;
    if (index === division.integerLength - 1 && division.mode === "decimal" && visibleEnd >= division.integerLength) cell.classList.add("comma-after");
    cell.style.gridColumn = String(index + 1);
    const isUnrevealedDecimal = index >= division.integerLength && index > visibleEnd;
    cell.textContent = isUnrevealedDecimal ? "" : digit;
    if (isUnrevealedDecimal) cell.setAttribute("aria-hidden", "true");
    if (isLowered) {
      const arrow = document.createElement("span");
      arrow.className = "lower-arrow";
      arrow.setAttribute("aria-hidden", "true");
      cell.append(arrow);
    }
    row.append(cell);
  });
  return row;
}

function roleCard(kind, label, value) {
  return `<div class="role-card ${kind}"><strong>${value}</strong><small>${label}</small></div>`;
}

function renderDivision(step) {
  const root = $("#long-division");
  root.replaceChildren();
  const metrics = makeDisplayMetrics(division);
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
      active: (["subtract", "bring"].includes(step.kind) && step.opIndex === index)
        || (["ask", "choose"].includes(step.kind) && step.opIndex === index + 1),
      brought: step.kind === "bring" && step.opIndex === index
    }));
  });

  const potence = document.createElement("div");
  potence.className = "potence";
  const divisorBox = document.createElement("div");
  divisorBox.className = "potence-box";
  divisorBox.append(String(division.divisor));
  const divisorLabel = document.createElement("span");
  divisorLabel.className = "role-label";
  divisorLabel.textContent = "diviseur";
  divisorBox.append(divisorLabel);
  const quotientBox = document.createElement("div");
  quotientBox.className = "potence-box";
  quotientBox.append(quotientWriting(step));
  const quotientLabel = document.createElement("span");
  quotientLabel.className = "role-label";
  quotientLabel.textContent = "quotient";
  quotientBox.append(quotientLabel);
  potence.append(divisorBox, quotientBox);
  root.append(work, potence);

  const showValues = step.kind === "finish";
  $("#role-strip").innerHTML = [
    roleCard("dividend", "dividende", showValues ? division.dividend : "…"),
    '<span class="relation-sign">=</span>',
    roleCard("quotient", "quotient", showValues ? division.quotient : "…"),
    '<span class="relation-sign">×</span>',
    roleCard("divisor", "diviseur", showValues ? division.divisor : "…"),
    '<span class="relation-sign">+</span>',
    roleCard("remainder", "reste", showValues ? division.scaledRemainder : "…")
  ].join("");
}

function renderTable(step) {
  const active = step.opIndex !== undefined && ["choose", "multiply", "subtract"].includes(step.kind)
    ? division.operations[step.opIndex]?.quotientDigit
    : null;
  $("#table-title").textContent = `Table de ${division.divisor}`;
  $("#multiples").innerHTML = Array.from({ length: 11 }, (_, multiplier) =>
    `<div class="multiple ${multiplier === active ? "is-active" : ""}"><span>${multiplier} × ${division.divisor}</span><b>=</b><strong>${multiplier * division.divisor}</strong></div>`
  ).join("");
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
  render();
}

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
$("#division-form").addEventListener("submit", submit);
$("#previous").addEventListener("click", () => { stepIndex = Math.max(0, stepIndex - 1); render(); });
$("#next").addEventListener("click", () => { stepIndex = Math.min(steps.length - 1, stepIndex + 1); render(); });
$("#show-all").addEventListener("click", () => { stepIndex = steps.length - 1; render(); });
function updateFullscreenButton() {
  const button = $("#fullscreen");
  const isFullscreen = Boolean(document.fullscreenElement);
  button.textContent = isFullscreen ? "×" : "⛶";
  button.setAttribute("aria-label", isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran");
  button.title = isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran";
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen?.();
  else await document.documentElement.requestFullscreen?.();
}

$("#fullscreen").addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("keydown", (event) => {
  if (["INPUT", "SELECT"].includes(event.target.tagName)) return;
  if (event.key === "ArrowRight") { stepIndex = Math.min(steps.length - 1, stepIndex + 1); render(); }
  if (event.key === "ArrowLeft") { stepIndex = Math.max(0, stepIndex - 1); render(); }
});

setMode("integer");
updateFullscreenButton();
render();
