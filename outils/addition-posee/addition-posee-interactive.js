import {
  AdditionInputError,
  makeAddition,
  makeDisplayMetrics,
  placeValueMarker
} from "./addition-engine.mjs?v=1";
import {
  firstTrainingError,
  hintForTask,
  makeTrainingTasks
} from "./addition-entrainement-engine.mjs?v=1";

const $ = (selector) => document.querySelector(selector);
const firstInput = $("#first-term");
const secondInput = $("#second-term");
const errorBox = $("#form-error");
const rankGuides = $("#rank-guides");
const rankGuidesStorageKey = "mathsgo-addition-rank-guides";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let addition = makeAddition(["584", "279"]);
let tasks = makeTrainingTasks(addition);
let taskIndex = 0;
let drafts = new Map();
let completed = new Map();
let wrongField = null;
let hintLevels = new Map();
let feedback = "";
let feedbackKind = "";
let transitioningTaskId = null;
let transitionToken = 0;
let projectionEditing = false;
let showRankGuides = false;
let resizeFrame = 0;

try {
  showRankGuides = window.localStorage.getItem(rankGuidesStorageKey) === "true";
} catch {
  showRankGuides = false;
}
rankGuides.checked = showRankGuides;

function currentTask() {
  return tasks[taskIndex];
}

function rawDraftForCurrentTask() {
  return { ...(drafts.get(currentTask().id) || {}) };
}

function normalizedValue(value) {
  if (!Array.isArray(value)) return value ?? "";
  if (value.length === 0 || value.some((digit) => String(digit ?? "") === "")) return "";
  return value.join("");
}

function draftForCurrentTask() {
  return Object.fromEntries(
    Object.entries(rawDraftForCurrentTask()).map(([field, value]) => [field, normalizedValue(value)])
  );
}

function fieldLabel(field) {
  return {
    total: "total de la colonne",
    result: "chiffre de la somme",
    carry: "retenue",
    sum: "somme"
  }[field] || field;
}

function clearFormError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  firstInput.removeAttribute("aria-invalid");
  secondInput.removeAttribute("aria-invalid");
}

function displayFormError(error) {
  const labels = ["Premier terme", "Second terme"];
  const input = error.inputIndex === 1 ? secondInput : firstInput;
  errorBox.textContent = `${labels[error.inputIndex] || "Nombre"} : ${error.message}`;
  errorBox.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function digitGridColumn(layoutIndex) {
  const decimalOffset = addition.decimalPlaces > 0 && layoutIndex >= addition.layoutIntegerPlaces ? 1 : 0;
  return 2 + layoutIndex + decimalOffset;
}

function addComma(grid, row, className) {
  if (addition.decimalPlaces === 0) return;
  const comma = createElement("span", `comma-cell ${className}`, ",");
  comma.style.gridColumn = String(2 + addition.layoutIntegerPlaces);
  comma.style.gridRow = String(row);
  comma.setAttribute("aria-hidden", "true");
  grid.append(comma);
}

function currentOperation() {
  const task = currentTask();
  return task.kind === "column" ? addition.operations[task.opIndex] : null;
}

function addTermRow(grid, cells, row, className) {
  const operation = currentOperation();
  cells.forEach((value, layoutIndex) => {
    const cell = createElement("span", `digit-cell ${className}`, value ?? "");
    cell.style.gridColumn = String(digitGridColumn(layoutIndex));
    cell.style.gridRow = String(row);
    cell.classList.toggle("is-current-term", value !== null && operation?.layoutIndex === layoutIndex);
    cell.setAttribute("aria-hidden", "true");
    if (showRankGuides && row === 2) {
      const marker = createElement("span", "rank-marker", placeValueMarker(addition.places[layoutIndex].exponent));
      marker.setAttribute("aria-hidden", "true");
      cell.append(marker);
    }
    grid.append(cell);
  });
  addComma(grid, row, className);
}

function createAnswerInput(field, options = {}) {
  const input = document.createElement("input");
  const rawValue = rawDraftForCurrentTask()[field];
  const isDigitCell = Number.isInteger(options.digitIndex);
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.pattern = "[0-9]*";
  input.maxLength = isDigitCell ? 1 : options.maxLength || 2;
  input.className = options.className || "answer-input";
  input.dataset.answer = field;
  if (options.autoAdvance) input.dataset.autoAdvance = "true";
  if (isDigitCell) {
    input.dataset.digitIndex = String(options.digitIndex);
    input.dataset.digitCount = String(options.digitCount);
    input.dataset.digitGroup = options.digitGroup || `${currentTask().id}-${field}`;
  }
  input.setAttribute("aria-label", options.label || fieldLabel(field));
  input.value = isDigitCell
    ? String((Array.isArray(rawValue) ? rawValue[options.digitIndex] : "") ?? "")
    : String(rawValue ?? "");
  input.disabled = Boolean(transitioningTaskId);
  const wrongDigit = !isDigitCell || input.value !== String(options.expectedDigit);
  if (wrongField === field && wrongDigit) {
    input.classList.add("is-wrong");
    input.setAttribute("aria-invalid", "true");
  }
  return input;
}

function completedResultDigits() {
  const visible = new Map();
  addition.operations.forEach((operation, opIndex) => {
    const answer = completed.get(`column-${opIndex}`);
    if (answer) visible.set(operation.layoutIndex, String(answer.result));
  });
  const finalAnswer = completed.get("final-carry");
  if (finalAnswer) {
    const digits = String(finalAnswer.result).split("");
    addition.finalCarryDigits.forEach((_, index) => visible.set(index, digits[index]));
  }
  return visible;
}

function addCarries(grid) {
  const task = currentTask();
  const operation = currentOperation();
  addition.operations.forEach((sourceOperation, opIndex) => {
    if (sourceOperation.carryOut === 0 || sourceOperation.targetCarryLayoutIndex === null) return;
    const stored = completed.get(`column-${opIndex}`);
    const isCurrentCarry = task.kind === "column" && task.opIndex === opIndex;
    if (!stored && !isCurrentCarry) return;

    const holder = createElement("span", "practice-input-holder practice-carry-holder");
    holder.style.gridColumn = String(digitGridColumn(sourceOperation.targetCarryLayoutIndex));
    holder.style.gridRow = "1";
    if (isCurrentCarry) {
      holder.append(createAnswerInput("carry", {
        className: "answer-input",
        label: `Retenue à écrire au rang ${placeValueMarker(addition.places[sourceOperation.targetCarryLayoutIndex].exponent)}`,
        maxLength: 1
      }));
      grid.append(holder);
      return;
    }

    const active = operation?.layoutIndex === sourceOperation.targetCarryLayoutIndex
      || (task.kind === "final-carry" && sourceOperation.targetCarryLayoutIndex === 0);
    const carry = createElement("span", `carry-cell is-${active ? "active" : "used"}`, stored.carry);
    carry.style.gridColumn = String(digitGridColumn(sourceOperation.targetCarryLayoutIndex));
    carry.style.gridRow = "1";
    carry.setAttribute("aria-hidden", "true");
    grid.append(carry);
  });
}

function addResultRow(grid) {
  const task = currentTask();
  const operation = currentOperation();
  const completedDigits = completedResultDigits();
  addition.resultCells.forEach((expectedDigit, layoutIndex) => {
    const isCurrentColumn = operation?.layoutIndex === layoutIndex;
    const isFinalCarry = task.kind === "final-carry" && task.resultLayoutIndices.includes(layoutIndex);
    if (isCurrentColumn || isFinalCarry) {
      const holder = createElement("span", "practice-input-holder practice-result-holder");
      holder.style.gridColumn = String(digitGridColumn(layoutIndex));
      holder.style.gridRow = "5";
      holder.append(createAnswerInput("result", {
        className: "answer-input",
        label: `Chiffre de la somme au rang ${placeValueMarker(addition.places[layoutIndex].exponent)}`,
        maxLength: 1,
        autoAdvance: true
      }));
      grid.append(holder);
      return;
    }

    const visible = completedDigits.has(layoutIndex) || task.kind === "finish";
    const value = visible ? expectedDigit : "";
    const cell = createElement("span", `digit-cell result-cell ${visible ? "is-complete" : "is-future"}`, value);
    cell.style.gridColumn = String(digitGridColumn(layoutIndex));
    cell.style.gridRow = "5";
    cell.setAttribute("aria-hidden", "true");
    grid.append(cell);
  });
  addComma(grid, 5, "result-comma");
}

function metricOptions() {
  const scroll = $("#addition-scroll");
  const stage = scroll.closest(".addition-stage");
  const verification = $("#verification-relation");
  const projection = document.body.classList.contains("is-projection");
  const wide = projection || window.innerWidth >= 1280;
  const availableWidth = Math.max(220, scroll.clientWidth || 720);
  const horizontalReserve = addition.decimalPlaces > 0 ? 82 : 70;
  const verificationHeight = verification.hidden ? 0 : verification.offsetHeight;
  const availableHeight = Math.max(230, (stage.clientHeight || 390) - verificationHeight - 18);
  return {
    columnBudget: Math.max(190, availableWidth - horizontalReserve),
    rowBudget: availableHeight,
    minColumnWidth: 48,
    minRowHeight: 62,
    maxColumnWidth: projection ? 122 : wide ? 108 : 94,
    maxRowHeight: projection ? 132 : wide ? 112 : 98,
    maxDigitSize: projection ? 92 : wide ? 80 : 70
  };
}

function buildAdditionAriaLabel(task) {
  const operation = addition.displayTerms.join(" plus ");
  if (task.kind === "finish") return `${operation} égale ${addition.resultDisplay}. Addition réussie.`;
  return `Addition posée de ${operation}. ${task.sentence}`;
}

function renderAddition(task) {
  const root = $("#posed-addition");
  const metrics = makeDisplayMetrics(addition, metricOptions());
  const grid = createElement(
    "div",
    `posed-addition practice-addition ${addition.decimalPlaces > 0 ? "has-decimals" : "has-integers-only"}`
  );
  grid.classList.toggle("has-rank-guides", showRankGuides);
  grid.style.setProperty("--integer-columns", addition.layoutIntegerPlaces);
  grid.style.setProperty("--decimal-columns", addition.decimalPlaces);
  grid.style.setProperty("--column-width", `${metrics.columnWidth}px`);
  grid.style.setProperty("--row-height", `${metrics.rowHeight}px`);
  grid.style.setProperty("--digit-size", `${metrics.digitSize}px`);
  grid.style.setProperty("--sign-width", `${metrics.signWidth}px`);
  grid.style.setProperty("--separator-width", `${metrics.separatorWidth}px`);
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", buildAdditionAriaLabel(task));

  addTermRow(grid, addition.termCells[0], 2, "term-one-cell");
  addTermRow(grid, addition.termCells[1], 3, "term-two-cell");

  const sign = createElement("span", "addition-sign", "+");
  sign.style.gridColumn = "1";
  sign.style.gridRow = "3";
  sign.setAttribute("aria-hidden", "true");
  grid.append(sign);

  const rule = createElement("span", "addition-rule");
  rule.style.gridColumn = "2 / -1";
  rule.style.gridRow = "4";
  rule.setAttribute("aria-hidden", "true");
  grid.append(rule);

  addResultRow(grid);
  addCarries(grid);
  root.replaceChildren(grid);
}

function makeRelationRole(className, label, content) {
  const role = createElement("span", `verification-role ${className}`);
  const value = createElement("span", "verification-value");
  if (content instanceof Node) value.append(content);
  else value.textContent = content;
  role.append(value, createElement("small", "", label));
  return role;
}

function makeRelationDigitGroup() {
  const task = currentTask();
  const group = createElement("span", "relation-digit-group");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Somme de vérification");
  let digitIndex = 0;
  addition.resultDisplay.split("").forEach((character) => {
    if (character === ",") {
      group.append(createElement("span", "relation-comma", ","));
      return;
    }
    group.append(createAnswerInput("sum", {
      className: "answer-input relation-digit-answer",
      label: `Somme, chiffre ${digitIndex + 1} sur ${addition.resultCells.length}`,
      digitIndex,
      digitCount: addition.resultCells.length,
      digitGroup: `relation-${task.id}-sum`,
      expectedDigit: addition.resultCells[digitIndex]
    }));
    digitIndex += 1;
  });
  return group;
}

function renderRelation(task) {
  const relation = $("#verification-relation");
  const visible = task.kind === "verify" || task.kind === "finish";
  relation.hidden = !visible;
  relation.replaceChildren();
  if (!visible) return;
  const sumContent = task.kind === "verify" && !completed.has("verify")
    ? makeRelationDigitGroup()
    : addition.resultDisplay;
  relation.append(
    makeRelationRole("first", "premier terme", addition.displayTerms[0]),
    createElement("span", "verification-sign", "+"),
    makeRelationRole("second", "second terme", addition.displayTerms[1]),
    createElement("span", "verification-sign", "="),
    makeRelationRole("sum", "somme", sumContent)
  );
  relation.classList.toggle("is-complete", task.kind === "finish" || completed.has("verify"));
}

function renderInstruction(task) {
  $("#step-title").textContent = task.title;
  $("#step-sentence").textContent = task.sentence;
  $("#step-detail").textContent = task.detail || "";
  $("#step-detail").hidden = !task.detail;
  $("#exchange-memo").textContent = task.memo || "";
  $("#exchange-memo").hidden = !task.memo;

  const prompt = $("#calculation-prompt");
  prompt.replaceChildren();
  if (task.kind === "column") {
    const operation = addition.operations[task.opIndex];
    operation.addendDigits.forEach((digit, index) => {
      if (index > 0) prompt.append(createElement("span", "prompt-sign", "+"));
      prompt.append(createElement("span", "", digit));
    });
    if (operation.carryIn > 0) {
      prompt.append(createElement("span", "prompt-sign", "+"), createElement("span", "", operation.carryIn));
    }
    prompt.append(
      createElement("span", "prompt-sign", "="),
      createAnswerInput("total", {
        className: "answer-input total-answer",
        label: "Total de la colonne",
        maxLength: 2
      })
    );
  }

  const totalChecks = tasks.length - 1;
  $("#step-count").textContent = task.kind === "finish" ? "Terminé" : `${taskIndex + 1} / ${totalChecks}`;
  const progress = $(".practice-progress");
  const progressValue = Math.min(taskIndex, totalChecks);
  progress.setAttribute("aria-valuemax", String(totalChecks));
  progress.setAttribute("aria-valuenow", String(progressValue));
  progress.setAttribute("aria-valuetext", task.kind === "finish"
    ? "Addition terminée"
    : `Étape ${taskIndex + 1} sur ${totalChecks}`);
  $("#progress-bar").style.width = `${(progressValue / totalChecks) * 100}%`;
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
    validate.textContent = "Nouvelle addition";
    validate.disabled = false;
    return;
  }
  const field = firstTrainingError(task, draftForCurrentTask());
  const level = field ? hintLevels.get(`${task.id}:${field}`) || 0 : 0;
  help.textContent = level > 0 ? "Un autre indice" : "Un indice";
  help.disabled = Boolean(transitioningTaskId);
  validate.textContent = "Vérifier l’étape";
  validate.disabled = Boolean(transitioningTaskId);
}

function keepActiveColumnVisible() {
  const scroll = $("#addition-scroll");
  if (scroll.scrollWidth <= scroll.clientWidth) return;
  const active = scroll.querySelector(".practice-input-holder") || scroll.querySelector(".carry-cell.is-active");
  if (!active) {
    scroll.scrollLeft = scroll.scrollWidth - scroll.clientWidth;
    return;
  }
  const scrollBox = scroll.getBoundingClientRect();
  const activeBox = active.getBoundingClientRect();
  const safeMargin = 24;
  if (activeBox.left < scrollBox.left + safeMargin) {
    scroll.scrollLeft -= scrollBox.left + safeMargin - activeBox.left;
  } else if (activeBox.right > scrollBox.right - safeMargin) {
    scroll.scrollLeft += activeBox.right - scrollBox.right + safeMargin;
  }
}

function focusFirstAnswer() {
  if (transitioningTaskId) return;
  window.requestAnimationFrame(() => {
    const wrongAnswers = wrongField
      ? [...document.querySelectorAll(`[data-answer="${wrongField}"]:not(:disabled)`)]
      : [];
    const target = wrongAnswers.find((input) => input.classList.contains("is-wrong") && !input.value)
      || wrongAnswers.find((input) => input.classList.contains("is-wrong"))
      || document.querySelector("[data-answer]:not(:disabled)");
    target?.focus({ preventScroll: true });
    target?.select();
  });
}

function render({ focus = false } = {}) {
  const task = currentTask();
  document.body.dataset.task = task.kind;
  $("#projection-problem").textContent = addition.displayTerms.join(" + ");
  renderInstruction(task);
  renderRelation(task);
  renderAddition(task);
  renderActions(task);
  window.requestAnimationFrame(keepActiveColumnVisible);
  if (focus) focusFirstAnswer();
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
  feedback = task.kind === "verify" ? "Bravo, l’addition est juste." : "Étape juste.";
  feedbackKind = "success";
  render();
  const duration = reducedMotion.matches ? 70 : task.kind === "verify" ? 650 : 420;
  window.setTimeout(() => {
    if (token !== transitionToken) return;
    transitioningTaskId = null;
    taskIndex = Math.min(tasks.length - 1, taskIndex + 1);
    feedback = "";
    feedbackKind = "";
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
    feedback = `${errorMessage(field, answer[field])} ${hintForTask(addition, task, field, 0)}`;
    feedbackKind = "error";
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
  feedback = hintForTask(addition, task, field, nextLevel - 1);
  feedbackKind = "hint";
  render({ focus: true });
}

function resetTraining(nextAddition, { focus = true } = {}) {
  transitionToken += 1;
  transitioningTaskId = null;
  addition = nextAddition;
  tasks = makeTrainingTasks(addition);
  taskIndex = 0;
  drafts = new Map();
  completed = new Map();
  wrongField = null;
  hintLevels = new Map();
  feedback = "";
  feedbackKind = "";
  clearFormError();
  render({ focus });
}

function submitProblem(event) {
  event?.preventDefault();
  clearFormError();
  let nextAddition;
  try {
    nextAddition = makeAddition([firstInput.value, secondInput.value]);
  } catch (error) {
    if (error instanceof AdditionInputError) {
      displayFormError(error);
      return;
    }
    throw error;
  }
  if (document.fullscreenElement) {
    projectionEditing = false;
    syncProjectionMode(false);
  }
  resetTraining(nextAddition);
}

function randomTerm(decimalPlaces) {
  const integer = Math.floor(Math.random() * 1000);
  if (decimalPlaces === 0) return String(integer);
  const fractionLimit = 10 ** decimalPlaces;
  const fraction = String(Math.floor(Math.random() * fractionLimit)).padStart(decimalPlaces, "0");
  return `${integer},${fraction}`;
}

function randomProblem() {
  const decimalPlaces = Math.random() < .45 ? 1 + Math.floor(Math.random() * 3) : 0;
  firstInput.value = randomTerm(decimalPlaces);
  secondInput.value = randomTerm(decimalPlaces === 0 ? 0 : Math.floor(Math.random() * (decimalPlaces + 1)));
  submitProblem();
}

function restartSameProblem() {
  firstInput.value = addition.displayTerms[0];
  secondInput.value = addition.displayTerms[1];
  resetTraining(makeAddition(addition.displayTerms));
}

function updateFullscreenButton() {
  const button = $("#fullscreen");
  const isFullscreen = Boolean(document.fullscreenElement);
  button.querySelector(".fullscreen-expand").hidden = isFullscreen;
  button.querySelector(".fullscreen-collapse").hidden = !isFullscreen;
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
  if (shouldRender) window.requestAnimationFrame(() => render());
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch {
    errorBox.textContent = "Le plein écran n’est pas disponible dans ce navigateur.";
    errorBox.hidden = false;
  }
}

function clearFieldFeedback(field) {
  if (wrongField !== field) return;
  wrongField = null;
  document.querySelectorAll(`[data-answer="${field}"]`).forEach((input) => {
    input.classList.remove("is-wrong");
    input.removeAttribute("aria-invalid");
  });
  feedback = "";
  feedbackKind = "";
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
}

function activeAnswerInputs() {
  return [...document.querySelectorAll("[data-answer]:not(:disabled)")];
}

function focusAfter(target) {
  const inputs = activeAnswerInputs();
  const next = inputs[inputs.indexOf(target) + 1];
  next?.focus({ preventScroll: true });
  next?.select();
}

function setDigitDraft(target, value) {
  const field = target.dataset.answer;
  const index = Number(target.dataset.digitIndex);
  const count = Number(target.dataset.digitCount);
  const answer = rawDraftForCurrentTask();
  const digits = Array.isArray(answer[field])
    ? [...answer[field]].slice(0, count)
    : Array(count).fill("");
  while (digits.length < count) digits.push("");
  digits[index] = value;
  answer[field] = digits;
  drafts.set(currentTask().id, answer);
}

$("#addition-form").addEventListener("submit", submitProblem);
$("#random-problem").addEventListener("click", randomProblem);
$("#validate").addEventListener("click", validateCurrentTask);
$("#help").addEventListener("click", showHint);
$("#fullscreen").addEventListener("click", toggleFullscreen);
$("#edit-problem").addEventListener("click", () => {
  projectionEditing = true;
  syncProjectionMode();
  window.requestAnimationFrame(() => firstInput.focus());
});
[firstInput, secondInput].forEach((input) => input.addEventListener("input", clearFormError));
rankGuides.addEventListener("change", () => {
  showRankGuides = rankGuides.checked;
  try {
    window.localStorage.setItem(rankGuidesStorageKey, String(showRankGuides));
  } catch {
    // Les repères restent utilisables même si le stockage local est bloqué.
  }
  render();
});

document.addEventListener("input", (event) => {
  const field = event.target.dataset.answer;
  if (!field) return;
  const isDigitCell = event.target.dataset.digitIndex !== undefined;
  const cleaned = event.target.value
    .replace(/\D/g, "")
    .slice(0, isDigitCell ? 1 : Number(event.target.maxLength) || 2);
  if (event.target.value !== cleaned) event.target.value = cleaned;
  if (isDigitCell) setDigitDraft(event.target, cleaned);
  else drafts.set(currentTask().id, { ...rawDraftForCurrentTask(), [field]: cleaned });
  clearFieldFeedback(field);
  if ((isDigitCell || event.target.dataset.autoAdvance === "true") && cleaned) focusAfter(event.target);
});

document.addEventListener("paste", (event) => {
  const target = event.target;
  if (!target.matches("[data-answer][data-digit-index]")) return;
  const pastedDigits = event.clipboardData?.getData("text").replace(/\D/g, "") || "";
  if (pastedDigits.length < 2) return;
  event.preventDefault();
  const cells = [...document.querySelectorAll(`[data-digit-group="${target.dataset.digitGroup}"]`)]
    .sort((left, right) => Number(left.dataset.digitIndex) - Number(right.dataset.digitIndex));
  const start = Number(target.dataset.digitIndex);
  let lastFilled = target;
  pastedDigits.split("").forEach((digit, offset) => {
    const cell = cells[start + offset];
    if (!cell) return;
    cell.value = digit;
    setDigitDraft(cell, digit);
    lastFilled = cell;
  });
  clearFieldFeedback(target.dataset.answer);
  focusAfter(lastFilled);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("[data-answer]")) {
    event.preventDefault();
    validateCurrentTask();
    return;
  }
  if (!event.target.matches("[data-answer][data-digit-index]")) return;
  const inputs = activeAnswerInputs();
  const position = inputs.indexOf(event.target);
  if (event.key === "ArrowLeft" && position > 0) {
    event.preventDefault();
    inputs[position - 1].focus({ preventScroll: true });
    inputs[position - 1].select();
  } else if (event.key === "ArrowRight" && position < inputs.length - 1) {
    event.preventDefault();
    inputs[position + 1].focus({ preventScroll: true });
    inputs[position + 1].select();
  } else if (event.key === "Backspace" && !event.target.value && position > 0) {
    const previous = inputs[position - 1];
    if (previous.dataset.digitIndex === undefined) return;
    event.preventDefault();
    previous.value = "";
    setDigitDraft(previous, "");
    clearFieldFeedback(previous.dataset.answer);
    previous.focus({ preventScroll: true });
  }
});

document.addEventListener("fullscreenchange", () => {
  projectionEditing = false;
  syncProjectionMode();
});
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => render());
});

syncProjectionMode(false);
render();
