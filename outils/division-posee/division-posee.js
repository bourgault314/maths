import { makeDivision, makeSteps } from "./division-engine.mjs";

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
  $("#page-title").textContent = mode === "integer" ? "Division euclidienne" : "Division posée décimale";
  const pdf = $("#pdf-link");
  pdf.href = mode === "integer" ? "gabarit-division-euclidienne.pdf" : "gabarit-division-decimale.pdf";
  pdf.textContent = mode === "integer" ? "Gabarit euclidien" : "Gabarit décimal";
}

function visibility(index, step) {
  if (step.kind === "finish") return { quotient: true, product: true, remainder: true, next: true };
  if (step.opIndex === undefined || index > step.opIndex) return { quotient: false, product: false, remainder: false, next: false };
  if (index < step.opIndex) return { quotient: true, product: true, remainder: true, next: true };
  return {
    quotient: true,
    product: ["subtract", "bring"].includes(step.kind),
    remainder: ["subtract", "bring"].includes(step.kind),
    next: step.kind === "bring"
  };
}

function visibleQuotient(step) {
  if (step.kind === "predict") return "";
  let result = "";
  let comma = false;
  division.operations.forEach((operation, index) => {
    if (!visibility(index, step).quotient) return;
    if (operation.isDecimalDigit && !comma) { result += ","; comma = true; }
    result += operation.quotientDigit;
  });
  return result;
}

function digitRow(value, endColumn, className, options = {}) {
  const row = document.createElement("div");
  row.className = `digit-row ${className}`;
  row.style.setProperty("--columns", division.digits.length);
  const chars = String(value).split("");
  const start = endColumn - chars.length + 1;
  chars.forEach((char, offset) => {
    const cell = document.createElement("span");
    cell.className = `digit ${options.active ? "active" : ""} ${options.falling && offset === chars.length - 1 ? "falling-digit" : ""}`;
    cell.style.gridColumn = String(start + offset + 1);
    cell.textContent = char;
    row.append(cell);
  });
  return row;
}

function dividendRow(step) {
  const row = document.createElement("div");
  row.className = "digit-row dividend-row";
  row.style.setProperty("--columns", division.digits.length);
  const visibleEnd = step.kind === "finish"
    ? division.digits.length - 1
    : step.opIndex === undefined
      ? division.integerLength - 1
      : division.operations[step.opIndex].endColumn + (step.kind === "bring" ? 1 : 0);
  division.digits.forEach((digit, index) => {
    const cell = document.createElement("span");
    const descending = step.kind === "bring" && division.operations[step.opIndex]?.nextEndColumn === index;
    cell.className = `digit ${index > visibleEnd ? "pending" : ""} ${descending ? "falling-digit" : ""}`;
    if (index === division.integerLength - 1 && division.mode === "decimal" && visibleEnd >= division.integerLength) cell.classList.add("comma-after");
    cell.style.gridColumn = String(index + 1);
    cell.textContent = digit;
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
  const work = document.createElement("div");
  work.className = "work-column";
  work.append(dividendRow(step));

  division.operations.forEach((operation, index) => {
    const visible = visibility(index, step);
    if (visible.product) {
      work.append(digitRow(operation.product, operation.endColumn, "subtraction-row", {
        active: step.kind === "subtract" && step.opIndex === index
      }));
    }
    const finalOperation = index === division.operations.length - 1;
    if (operation.nextPartial !== undefined && visible.next) {
      work.append(digitRow(operation.nextPartial, operation.nextEndColumn, "partial-row", {
        active: true
      }));
    } else if (finalOperation && visible.remainder) {
      work.append(digitRow(operation.remainder, operation.endColumn, "partial-row", {
        active: step.kind === "subtract" && step.opIndex === index
      }));
    }
  });

  const potence = document.createElement("div");
  potence.className = "potence";
  potence.innerHTML = `<div class="potence-box">${division.divisor}<span class="role-label">diviseur</span></div><div class="potence-box">${visibleQuotient(step) || "—"}<span class="role-label">quotient</span></div>`;
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
  const active = step.opIndex !== undefined && step.kind !== "bring"
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
$("#fullscreen").addEventListener("click", () => document.documentElement.requestFullscreen?.());
document.addEventListener("keydown", (event) => {
  if (["INPUT", "SELECT"].includes(event.target.tagName)) return;
  if (event.key === "ArrowRight") { stepIndex = Math.min(steps.length - 1, stepIndex + 1); render(); }
  if (event.key === "ArrowLeft") { stepIndex = Math.max(0, stepIndex - 1); render(); }
});

setMode("integer");
render();
