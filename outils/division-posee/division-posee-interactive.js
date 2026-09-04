import { makeDivision } from "./division-engine.mjs?v=6";
import {
  firstTrainingError,
  hintForTask,
  makeTrainingTasks,
  taskRevealsTable
} from "./division-entrainement-engine.mjs?v=1";

const $ = (selector) => document.querySelector(selector);
const dividendInput = $("#dividend");
const divisorInput = $("#divisor");
const errorBox = $("#form-error");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let division = makeDivision(584, 7, "integer", 2);
let tasks = makeTrainingTasks(division);
let taskIndex = 0;
let drafts = new Map();
let completed = new Map();
let wrongField = null;
let hintLevels = new Map();
let feedback = "";
let feedbackKind = "";
let tableVisible = false;
let highlightedMultiplier = null;
let transitioningTaskId = null;
let transitionToken = 0;
let resizeTimer = null;

function currentTask() {
  return tasks[taskIndex];
}

function fieldLabel(field) {
  return {
    lower: "borne de gauche",
    upper: "borne de droite",
    digitCount: "nombre de chiffres du quotient",
    quotient: "quotient",
    product: "produit",
    remainder: "reste"
  }[field] || field;
}

function createAnswerInput(field, options = {}) {
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.pattern = "[0-9]*";
  input.maxLength = options.maxLength || 8;
  input.className = options.className || "answer-input";
  input.dataset.answer = field;
  input.setAttribute("aria-label", options.label || fieldLabel(field));
  input.value = String(drafts.get(currentTask().id)?.[field] ?? "");
  input.disabled = Boolean(options.disabled || transitioningTaskId);
  if (wrongField === field) {
    input.classList.add("is-wrong");
    input.setAttribute("aria-invalid", "true");
  }
  return input;
}

function makeAnticipationPrompt(task) {
  const container = document.createElement("div");
  container.className = "anticipation-prompt";
  const accepted = completed.get(task.id);
  const inequality = document.createElement("div");
  inequality.className = "prompt-equation";

  if (accepted) {
    inequality.innerHTML = `<strong class="accepted-answer">${accepted.lower}</strong><span>≤</span><strong>${division.dividend}</strong><span>&lt;</span><strong class="accepted-answer">${accepted.upper}</strong>`;
  } else {
    inequality.append(
      createAnswerInput("lower", { className: "answer-input inline-answer", label: "Borne inférieure" }),
      document.createTextNode(" ≤ "),
      Object.assign(document.createElement("strong"), { textContent: String(division.dividend) }),
      document.createTextNode(" < "),
      createAnswerInput("upper", { className: "answer-input inline-answer", label: "Borne supérieure" })
    );
  }

  const conclusion = document.createElement("div");
  conclusion.className = "prompt-conclusion";
  conclusion.append("Le quotient aura ");
  if (accepted) {
    const value = document.createElement("strong");
    value.className = "accepted-answer compact";
    value.textContent = accepted.digitCount;
    conclusion.append(value);
  } else {
    conclusion.append(createAnswerInput("digitCount", {
      className: "answer-input digit-count-answer",
      label: "Nombre de chiffres du quotient",
      maxLength: 1
    }));
  }
  conclusion.append(` ${accepted?.digitCount === 1 ? "chiffre" : "chiffres"}.`);
  container.append(inequality, conclusion);
  return container;
}

function answerSpan(value, className = "") {
  const span = document.createElement("span");
  span.className = `written-answer ${className}`.trim();
  span.textContent = String(value);
  return span;
}

function digitRow(className, options = {}) {
  const row = document.createElement("div");
  row.className = `digit-row ${className}`;
  row.style.setProperty("--columns", division.digits.length);
  if (options.ghost) {
    row.classList.add("is-ghost");
    row.setAttribute("aria-hidden", "true");
  }
  return row;
}

function appendNumber(row, value, endColumn, className = "", options = {}) {
  const characters = String(value).split("");
  const start = endColumn - characters.length + 1;
  characters.forEach((character, offset) => {
    const digit = document.createElement("span");
    digit.className = `digit ${className}`.trim();
    digit.style.gridColumn = String(start + offset + 1);
    digit.textContent = character;
    if (options.brought && offset === characters.length - 1) digit.classList.add("brought-digit");
    row.append(digit);
  });
  return { start, end: endColumn };
}

function appendGridInput(row, field, endColumn, expected, className) {
  const width = Math.max(1, String(expected).length);
  const start = Math.max(0, endColumn - width + 1);
  const holder = document.createElement("span");
  holder.className = `grid-answer ${className}`;
  holder.style.gridColumn = `${start + 1} / ${endColumn + 2}`;
  holder.append(createAnswerInput(field, {
    className: "answer-input operation-answer",
    label: fieldLabel(field),
    maxLength: Math.max(2, width + 1)
  }));
  row.append(holder);
  return { start, end: endColumn };
}

function appendPlaceholder(row, endColumn, expected, className) {
  const width = Math.max(1, String(expected).length);
  const start = Math.max(0, endColumn - width + 1);
  const placeholder = document.createElement("span");
  placeholder.className = `grid-placeholder ${className}`;
  placeholder.style.gridColumn = `${start + 1} / ${endColumn + 2}`;
  row.append(placeholder);
  return { start, end: endColumn };
}

function appendSubtractionRule(row, range) {
  const rule = document.createElement("span");
  rule.className = "subtraction-rule";
  rule.setAttribute("aria-hidden", "true");
  rule.style.gridColumn = `${range.start + 1} / ${range.end + 2}`;
  row.append(rule);
}

function makeDividendRow(task) {
  const row = digitRow("dividend-row");
  const activeIndex = task.kind === "stage" ? task.opIndex : -1;
  const activeEnd = activeIndex >= 0 ? division.operations[activeIndex].endColumn : -1;
  const activeStart = activeIndex === 0
    ? activeEnd - String(division.operations[activeIndex].partial).length + 1
    : -1;

  division.digits.slice(0, division.integerLength).forEach((value, index) => {
    const digit = document.createElement("span");
    digit.className = "digit";
    digit.style.gridColumn = String(index + 1);
    digit.textContent = value;
    if (task.kind === "anticipation") digit.classList.add("muted-division-digit");
    if (activeIndex === 0 && index >= activeStart && index <= activeEnd) digit.classList.add("active");
    if (activeIndex > 0 && index < activeEnd) digit.classList.add("used-division-digit");
    if (activeIndex > 0 && index === activeEnd) digit.classList.add("lowered-source");
    if (activeIndex >= 0 && index > activeEnd) digit.classList.add("pending");
    row.append(digit);
  });
  return row;
}

function stageStatus(index, task) {
  if (completed.has(`stage-${index}`)) return "completed";
  if (task.kind === "stage" && task.opIndex === index) return "active";
  return "future";
}

function makeOperationRows(index, task) {
  const operation = division.operations[index];
  const status = stageStatus(index, task);
  const productRow = digitRow("product-row", { ghost: status === "future" });
  const resultRow = digitRow("remainder-row", { ghost: status === "future" });
  let productRange;

  if (status === "active") {
    productRange = appendGridInput(productRow, "product", operation.endColumn, operation.product, "product-answer");
    appendGridInput(resultRow, "remainder", operation.endColumn, operation.remainder, "remainder-answer");
  } else if (status === "completed") {
    productRange = appendNumber(productRow, operation.product, operation.endColumn, "completed-digit");
    const showNextPartial = operation.nextPartial !== undefined;
    appendNumber(
      resultRow,
      showNextPartial ? operation.nextPartial : operation.remainder,
      showNextPartial ? operation.nextEndColumn : operation.endColumn,
      showNextPartial ? "completed-digit partial-digit" : "completed-digit final-remainder",
      { brought: transitioningTaskId === `stage-${index}` && showNextPartial }
    );
  } else {
    productRange = appendPlaceholder(productRow, operation.endColumn, operation.product, "product-placeholder");
    appendPlaceholder(resultRow, operation.endColumn, operation.remainder, "remainder-placeholder");
  }
  appendSubtractionRule(productRow, productRange);
  return [productRow, resultRow];
}

function makeLowerArrow(index) {
  const operation = division.operations[index];
  if (operation.nextDigit === undefined) return null;
  const arrow = document.createElement("span");
  arrow.className = "practice-lower-arrow";
  arrow.setAttribute("aria-hidden", "true");
  const root = $("#long-division");
  const rowHeight = Number.parseFloat(root.style.getPropertyValue("--row-height")) || 48;
  const columnWidth = Number.parseFloat(root.style.getPropertyValue("--column-width")) || 48;
  const rightPadding = window.innerWidth <= 520 ? 7 : 12;
  const right = rightPadding + ((division.digits.length - operation.nextEndColumn - .5) * columnWidth);
  arrow.style.right = `${right}px`;
  arrow.style.height = `${rowHeight * (1.28 + (2 * index))}px`;
  return arrow;
}

function quotientWriting(task) {
  const writing = document.createElement("span");
  writing.className = "quotient-writing practice-quotient";
  const anticipationDone = completed.has("anticipation") || task.kind !== "anticipation";
  if (!anticipationDone) {
    const waiting = document.createElement("span");
    waiting.className = "quotient-waiting";
    waiting.textContent = "?";
    waiting.setAttribute("aria-label", "Nombre de chiffres à déterminer");
    writing.append(waiting);
    return writing;
  }

  division.operations.forEach((operation, index) => {
    const slot = document.createElement("span");
    slot.className = "quotient-slot";
    const stored = completed.get(`stage-${index}`);
    if (stored) {
      slot.classList.add("is-filled");
      slot.append(answerSpan(stored.quotient));
    } else if (task.kind === "stage" && task.opIndex === index) {
      slot.classList.add("is-active-slot");
      slot.append(createAnswerInput("quotient", {
        className: "answer-input quotient-answer",
        label: `Chiffre ${index + 1} du quotient`,
        maxLength: 1
      }));
    } else {
      slot.classList.add("is-empty", "is-locked-slot");
      slot.setAttribute("aria-hidden", "true");
    }
    writing.append(slot);
  });
  return writing;
}

function roleCard(kind, label, content) {
  const card = document.createElement("div");
  card.className = `role-card ${kind}`;
  const value = document.createElement("strong");
  if (content instanceof Node) value.append(content);
  else value.textContent = String(content);
  const caption = document.createElement("small");
  caption.textContent = label;
  card.append(value, caption);
  return card;
}

function relationSign(value) {
  const sign = document.createElement("span");
  sign.className = "relation-sign";
  sign.textContent = value;
  return sign;
}

function makeRelation(task) {
  const relation = $("#role-strip");
  relation.replaceChildren();
  const verifying = task.kind === "verify";
  const finished = task.kind === "finish";
  const accepted = completed.get("verify");

  let quotientContent = "…";
  let remainderContent = "…";
  if (verifying && !accepted) {
    quotientContent = createAnswerInput("quotient", {
      className: "answer-input relation-answer",
      label: "Quotient de vérification",
      maxLength: Math.max(2, division.quotient.length + 1)
    });
    remainderContent = createAnswerInput("remainder", {
      className: "answer-input relation-answer",
      label: "Reste de vérification",
      maxLength: Math.max(2, String(division.remainder).length + 1)
    });
  } else if (finished || accepted) {
    quotientContent = division.quotient;
    remainderContent = division.remainder;
  }

  relation.append(
    roleCard("dividend", "dividende", division.dividend),
    relationSign("="),
    roleCard("quotient", "quotient", quotientContent),
    relationSign("×"),
    roleCard("divisor", "diviseur", division.divisor),
    relationSign("+"),
    roleCard("remainder", "reste", remainderContent)
  );
  relation.classList.toggle("is-active", verifying);
  relation.classList.toggle("is-complete", finished || Boolean(accepted));
}

function setDivisionMetrics(root) {
  const mobile = window.innerWidth <= 780;
  const compact = window.innerWidth <= 480;
  const rowCount = 1 + (division.operations.length * 2);
  const availableHeight = mobile
    ? Math.min(390, Math.max(245, window.innerHeight * .43))
    : Math.min(430, Math.max(275, window.innerHeight * .45));
  const rowHeight = Math.min(compact ? 42 : 48, Math.max(23, Math.floor(availableHeight / rowCount)));
  const potenceWidth = compact ? 92 : mobile ? 108 : 142;
  const rootWidth = root.clientWidth || Math.max(300, window.innerWidth - 90);
  const workWidth = Math.max(150, rootWidth - potenceWidth - 14);
  const columnWidth = Math.min(48, Math.max(compact ? 19 : 22, Math.floor(workWidth / division.digits.length)));
  const digitSize = Math.min(compact ? 28 : 34, Math.max(16, Math.floor(Math.min(rowHeight * .68, columnWidth * .72))));
  const quotientSize = Math.min(compact ? 27 : 33, Math.max(17, Math.floor(potenceWidth / Math.max(4, division.operations.length + 1))));
  root.style.setProperty("--row-height", `${rowHeight}px`);
  root.style.setProperty("--digit-size", `${digitSize}px`);
  root.style.setProperty("--column-width", `${columnWidth}px`);
  root.style.setProperty("--quotient-size", `${quotientSize}px`);
  root.style.setProperty("--potence-width", `${potenceWidth}px`);
}

function renderDivision(task) {
  const root = $("#long-division");
  root.replaceChildren();
  setDivisionMetrics(root);
  const work = document.createElement("div");
  work.className = "work-column practice-work-column";
  work.append(makeDividendRow(task));
  division.operations.forEach((operation, index) => {
    work.append(...makeOperationRows(index, task));
  });
  if (transitioningTaskId?.startsWith("stage-")) {
    const arrow = makeLowerArrow(Number(transitioningTaskId.split("-")[1]));
    if (arrow) work.append(arrow);
  }

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
  quotientBox.append(quotientWriting(task));
  const quotientLabel = document.createElement("span");
  quotientLabel.className = "role-label";
  quotientLabel.textContent = "quotient";
  quotientBox.append(quotientLabel);
  potence.append(divisorBox, quotientBox);
  root.append(potence, work);
  makeRelation(task);
}

function renderTable(task) {
  if (task.kind !== "stage") highlightedMultiplier = null;
  $("#table-title").textContent = `Table de ${division.divisor}`;
  const multiples = $("#multiples");
  multiples.replaceChildren();
  Array.from({ length: 10 }, (_, multiplier) => {
    const row = document.createElement("div");
    row.className = "multiple";
    if (multiplier === highlightedMultiplier) row.classList.add("is-active");
    row.innerHTML = `<span>${multiplier} × ${division.divisor}</span><b>=</b><strong>${tableVisible ? multiplier * division.divisor : "?"}</strong>`;
    multiples.append(row);
  });
  const card = $("#table-card");
  card.classList.toggle("is-open", tableVisible);
  card.classList.toggle("is-revealed", tableVisible);
  const toggle = $("#table-toggle");
  toggle.textContent = tableVisible ? "Masquer la table" : "Voir la table";
  toggle.setAttribute("aria-expanded", String(tableVisible));
}

function renderInstruction(task) {
  $("#step-title").textContent = task.title;
  $("#step-sentence").textContent = task.sentence;
  $("#step-detail").textContent = task.detail || "";
  $("#step-detail").hidden = !task.detail;
  const prompt = $("#prompt-answer");
  prompt.replaceChildren();
  prompt.hidden = task.kind !== "anticipation";
  if (task.kind === "anticipation") prompt.append(makeAnticipationPrompt(task));

  const totalChecks = tasks.length - 1;
  $("#step-count").textContent = task.kind === "finish" ? "Terminé" : `${taskIndex + 1} / ${totalChecks}`;
  $("#progress-bar").style.width = `${(Math.min(taskIndex, totalChecks) / totalChecks) * 100}%`;
}

function renderActions(task) {
  const help = $("#help");
  const validate = $("#validate");
  const status = $("#feedback");
  status.textContent = feedback;
  status.className = `feedback ${feedbackKind ? `is-${feedbackKind}` : ""}`;

  if (task.kind === "finish") {
    help.textContent = "Recommencer";
    help.disabled = false;
    validate.textContent = "Nouvelle division";
    validate.disabled = false;
  } else {
    const draft = drafts.get(task.id) || {};
    const field = firstTrainingError(task, draft);
    const level = field ? hintLevels.get(`${task.id}:${field}`) || 0 : 0;
    help.textContent = level > 0 ? "Un autre indice" : "Un indice";
    help.disabled = Boolean(transitioningTaskId);
    validate.textContent = "Vérifier l’étape";
    validate.disabled = Boolean(transitioningTaskId);
  }
}

function focusFirstAnswer() {
  if (transitioningTaskId) return;
  window.requestAnimationFrame(() => {
    const target = wrongField
      ? document.querySelector(`[data-answer="${wrongField}"]`)
      : document.querySelector("[data-answer]:not(:disabled)");
    target?.focus({ preventScroll: true });
  });
}

function render({ focus = false } = {}) {
  const task = currentTask();
  document.body.dataset.task = task.kind;
  renderInstruction(task);
  renderDivision(task);
  renderTable(task);
  renderActions(task);
  if (focus) focusFirstAnswer();
}

function draftForCurrentTask() {
  return { ...(drafts.get(currentTask().id) || {}) };
}

function errorMessage(field, value) {
  const empty = String(value ?? "").trim() === "";
  if (empty) return `Complète d’abord le ${fieldLabel(field)}.`;
  return `Le ${fieldLabel(field)} est à revoir.`;
}

function advanceAfterSuccess(task) {
  const token = ++transitionToken;
  transitioningTaskId = task.id;
  wrongField = null;
  feedback = task.kind === "stage" && division.operations[task.opIndex].nextDigit !== undefined
    ? "Juste. Le chiffre suivant s’abaisse."
    : "Étape juste.";
  feedbackKind = "success";
  render();
  const duration = reducedMotion.matches ? 80 : task.kind === "stage" ? 820 : 480;
  window.setTimeout(() => {
    if (token !== transitionToken) return;
    transitioningTaskId = null;
    taskIndex = Math.min(tasks.length - 1, taskIndex + 1);
    feedback = "";
    feedbackKind = "";
    highlightedMultiplier = null;
    render({ focus: true });
  }, duration);
}

function validateCurrentTask() {
  const task = currentTask();
  if (transitioningTaskId) return;
  if (task.kind === "finish") {
    randomProblem();
    return;
  }
  const answer = draftForCurrentTask();
  const field = firstTrainingError(task, answer);
  if (field) {
    wrongField = field;
    const key = `${task.id}:${field}`;
    hintLevels.set(key, Math.max(1, hintLevels.get(key) || 0));
    feedback = `${errorMessage(field, answer[field])} ${hintForTask(division, task, field, 0)}`;
    feedbackKind = "error";
    highlightedMultiplier = null;
    if (taskRevealsTable(task, field)) tableVisible = true;
    render({ focus: true });
    return;
  }
  completed.set(task.id, answer);
  advanceAfterSuccess(task);
}

function showHint() {
  const task = currentTask();
  if (task.kind === "finish") {
    restartSameProblem();
    return;
  }
  const answer = draftForCurrentTask();
  const field = firstTrainingError(task, answer);
  if (!field) {
    wrongField = null;
    feedback = "Tout semble prêt : vérifie l’étape.";
    feedbackKind = "hint";
    render();
    return;
  }
  const key = `${task.id}:${field}`;
  const nextLevel = Math.min(2, (hintLevels.get(key) || 0) + 1);
  hintLevels.set(key, nextLevel);
  wrongField = field;
  feedback = hintForTask(division, task, field, nextLevel - 1);
  feedbackKind = "hint";
  if (taskRevealsTable(task, field)) {
    tableVisible = true;
    highlightedMultiplier = nextLevel > 1 ? division.operations[task.opIndex].quotientDigit : null;
  }
  render({ focus: true });
}

function readProblem() {
  const dividend = Number(dividendInput.value);
  const divisor = Number(divisorInput.value);
  if (!Number.isInteger(dividend) || dividend < 0 || dividend > 99999999) {
    return { error: "Le dividende doit être un entier entre 0 et 99 999 999." };
  }
  if (!Number.isInteger(divisor) || divisor < 1 || divisor > 9999) {
    return { error: "Le diviseur doit être un entier entre 1 et 9 999." };
  }
  return { dividend, divisor };
}

function startProblem(problem, { focus = true } = {}) {
  transitionToken += 1;
  transitioningTaskId = null;
  division = makeDivision(problem.dividend, problem.divisor, "integer", 2);
  tasks = makeTrainingTasks(division);
  taskIndex = 0;
  drafts = new Map();
  completed = new Map();
  wrongField = null;
  hintLevels = new Map();
  feedback = "";
  feedbackKind = "";
  tableVisible = false;
  highlightedMultiplier = null;
  errorBox.hidden = true;
  render({ focus });
}

function submitProblem(event) {
  event?.preventDefault();
  const problem = readProblem();
  if (problem.error) {
    errorBox.textContent = problem.error;
    errorBox.hidden = false;
    return;
  }
  startProblem(problem);
}

function randomProblem() {
  const divisor = 2 + Math.floor(Math.random() * 11);
  const quotient = 12 + Math.floor(Math.random() * 988);
  const remainder = Math.floor(Math.random() * divisor);
  const dividend = (quotient * divisor) + remainder;
  dividendInput.value = dividend;
  divisorInput.value = divisor;
  startProblem({ dividend, divisor });
}

function restartSameProblem() {
  startProblem({ dividend: division.dividend, divisor: division.divisor });
}

function updateFullscreenButton() {
  const button = $("#fullscreen");
  const isFullscreen = Boolean(document.fullscreenElement);
  button.textContent = "⛶";
  button.setAttribute("aria-label", isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran");
  button.title = isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran";
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen?.();
  else await document.documentElement.requestFullscreen?.();
}

$("#division-form").addEventListener("submit", submitProblem);
$("#random-problem").addEventListener("click", randomProblem);
$("#validate").addEventListener("click", validateCurrentTask);
$("#help").addEventListener("click", showHint);
$("#table-toggle").addEventListener("click", () => {
  tableVisible = !tableVisible;
  highlightedMultiplier = null;
  renderTable(currentTask());
});
$("#fullscreen").addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("input", (event) => {
  const field = event.target.dataset.answer;
  if (!field) return;
  const cleaned = event.target.value.replace(/\D/g, "").slice(0, Number(event.target.maxLength) || 8);
  if (event.target.value !== cleaned) event.target.value = cleaned;
  const task = currentTask();
  const answer = { ...(drafts.get(task.id) || {}), [field]: cleaned };
  drafts.set(task.id, answer);
  if (wrongField === field) {
    wrongField = null;
    event.target.classList.remove("is-wrong");
    event.target.removeAttribute("aria-invalid");
    feedback = "";
    feedbackKind = "";
    $("#feedback").textContent = "";
    $("#feedback").className = "feedback";
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("[data-answer]")) {
    event.preventDefault();
    validateCurrentTask();
  }
});
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => render(), 120);
});

updateFullscreenButton();
render({ focus: false });
