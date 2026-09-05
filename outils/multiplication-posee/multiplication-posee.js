import {
  makeDisplayMetrics,
  makeMultiplication,
  MultiplicationInputError
} from "./multiplication-engine.mjs?v=1";
import {
  getMultiplicationDisplayState,
  makeSteps
} from "./multiplication-steps.mjs?v=1";
import {
  renderDecimalPreparation,
  renderMultiplication,
  renderVocabulary
} from "./multiplication-view.mjs?v=1";

const $ = (selector) => document.querySelector(selector);
const firstInput = $("#first-factor");
const secondInput = $("#second-factor");
const errorBox = $("#form-error");
const rankGuides = $("#rank-guides");
const rankGuidesStorageKey = "mathsgo-multiplication-rank-guides";

let multiplication = makeMultiplication(["327", "46"]);
let steps = makeSteps(multiplication);
let stepIndex = 0;
let projectionEditing = false;
let showRankGuides = false;

try {
  showRankGuides = window.localStorage.getItem(rankGuidesStorageKey) === "true";
} catch {
  showRankGuides = false;
}
rankGuides.checked = showRankGuides;

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  firstInput.removeAttribute("aria-invalid");
  secondInput.removeAttribute("aria-invalid");
}

function displayError(error) {
  const labels = ["Premier facteur", "Second facteur"];
  const label = labels[error.inputIndex] || "Nombre";
  errorBox.textContent = `${label} : ${error.message}`;
  errorBox.hidden = false;
  const input = error.inputIndex === 1 ? secondInput : firstInput;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function metricOptions() {
  const scroll = $("#multiplication-scroll");
  const stage = scroll.closest(".multiplication-stage");
  const decimalPreparation = $("#decimal-preparation");
  const vocabulary = $("#vocabulary-strip");
  const projection = document.body.classList.contains("is-projection");
  const wide = projection || window.innerWidth >= 1280;
  const availableWidth = Math.max(230, scroll.clientWidth || 760);
  const preparationHeight = decimalPreparation.hidden ? 0 : decimalPreparation.offsetHeight;
  const vocabularyHeight = vocabulary.hidden ? 0 : vocabulary.offsetHeight;
  const availableHeight = Math.max(
    260,
    (stage.clientHeight || 520) - preparationHeight - vocabularyHeight - 28
  );

  return {
    columnBudget: Math.max(190, availableWidth - 76),
    rowBudget: availableHeight,
    minColumnWidth: window.innerWidth <= 520 ? 32 : 36,
    maxColumnWidth: projection ? 90 : wide ? 82 : 72,
    minRowHeight: projection ? 28 : window.innerWidth <= 520 ? 34 : 38,
    maxRowHeight: projection ? 78 : wide ? 72 : 66,
    maxDigitSize: projection ? 62 : wide ? 56 : 50
  };
}

function keepActiveColumnVisible() {
  const scroll = $("#multiplication-scroll");
  if (scroll.scrollWidth <= scroll.clientWidth) return;
  const active = $("#posed-multiplication .is-target")
    || $("#posed-multiplication .factor-cell.is-active")
    || $("#posed-multiplication .carry-chip.is-fresh");
  if (!active) {
    scroll.scrollLeft = scroll.scrollWidth - scroll.clientWidth;
    return;
  }

  const scrollBox = scroll.getBoundingClientRect();
  const activeBox = active.getBoundingClientRect();
  const safeMargin = 28;
  if (activeBox.left < scrollBox.left + safeMargin) {
    scroll.scrollLeft -= scrollBox.left + safeMargin - activeBox.left;
  } else if (activeBox.right > scrollBox.right - safeMargin) {
    scroll.scrollLeft += activeBox.right - scrollBox.right + safeMargin;
  }
}

function render() {
  const step = steps[stepIndex];
  $("#step-title").textContent = step.title;
  $("#step-sentence").textContent = step.sentence;
  $("#step-detail").textContent = step.detail || "";
  $("#step-detail").hidden = !step.detail;
  $("#step-count").textContent = `${stepIndex + 1} / ${steps.length}`;

  const progressValue = stepIndex + 1;
  const progress = $("#progress");
  progress.setAttribute("aria-valuemax", String(steps.length));
  progress.setAttribute("aria-valuenow", String(progressValue));
  progress.setAttribute("aria-valuetext", `Étape ${progressValue} sur ${steps.length}`);
  $("#progress-bar").style.width = `${(progressValue / steps.length) * 100}%`;
  $("#previous").disabled = stepIndex === 0;
  $("#next").disabled = stepIndex === steps.length - 1;
  $("#show-all").hidden = stepIndex === steps.length - 1;
  $("#projection-problem").textContent = multiplication.displayFactors.join(" × ");

  const state = getMultiplicationDisplayState(multiplication, steps, stepIndex);
  renderDecimalPreparation($("#decimal-preparation"), multiplication, state);
  renderVocabulary($("#vocabulary-strip"), multiplication, state.showVocabulary);
  renderMultiplication({
    root: $("#posed-multiplication"),
    multiplication,
    steps,
    stepIndex,
    showRankGuides,
    metrics: makeDisplayMetrics(multiplication, metricOptions())
  });
  window.requestAnimationFrame(keepActiveColumnVisible);
}

function submit(event) {
  event.preventDefault();
  clearError();
  try {
    multiplication = makeMultiplication([firstInput.value, secondInput.value]);
  } catch (error) {
    if (error instanceof MultiplicationInputError) {
      displayError(error);
      return;
    }
    throw error;
  }

  steps = makeSteps(multiplication);
  stepIndex = 0;
  if (document.fullscreenElement) {
    projectionEditing = false;
    syncProjectionMode(false);
  }
  render();
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
  if (shouldRender) window.requestAnimationFrame(render);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    errorBox.textContent = "Le plein écran n’est pas disponible dans ce navigateur.";
    errorBox.hidden = false;
  }
}

$("#multiplication-form").addEventListener("submit", submit);
[firstInput, secondInput].forEach((input) => input.addEventListener("input", () => {
  clearError();
}));
rankGuides.addEventListener("change", () => {
  showRankGuides = rankGuides.checked;
  try {
    window.localStorage.setItem(rankGuidesStorageKey, String(showRankGuides));
  } catch {
    // Le repère reste utilisable même si le stockage local est bloqué.
  }
  render();
});
$("#previous").addEventListener("click", () => {
  stepIndex = Math.max(0, stepIndex - 1);
  render();
});
$("#next").addEventListener("click", () => {
  stepIndex = Math.min(steps.length - 1, stepIndex + 1);
  render();
});
$("#show-all").addEventListener("click", () => {
  stepIndex = steps.length - 1;
  render();
});
$("#fullscreen").addEventListener("click", toggleFullscreen);
$("#edit-problem").addEventListener("click", () => {
  projectionEditing = true;
  syncProjectionMode();
  window.requestAnimationFrame(() => firstInput.focus());
});

document.addEventListener("fullscreenchange", () => {
  projectionEditing = false;
  syncProjectionMode();
});
document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(tagName) || event.target.isContentEditable) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepIndex = Math.min(steps.length - 1, stepIndex + 1);
    render();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepIndex = Math.max(0, stepIndex - 1);
    render();
  }
});

let resizeFrame = 0;
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(render);
});

syncProjectionMode(false);
render();
