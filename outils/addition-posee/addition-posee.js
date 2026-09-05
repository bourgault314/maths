import {
  AdditionInputError,
  makeAddition,
  makeDisplayMetrics
} from "./addition-engine.mjs?v=1";
import { makeSteps } from "./addition-steps.mjs?v=1";
import { renderAddition, renderVocabulary } from "./addition-view.mjs?v=1";

const $ = (selector) => document.querySelector(selector);
const firstInput = $("#first-term");
const secondInput = $("#second-term");
const errorBox = $("#form-error");
const rankGuides = $("#rank-guides");
const rankGuidesStorageKey = "mathsgo-addition-rank-guides";

let addition = makeAddition(["584", "279"]);
let steps = makeSteps(addition);
let stepIndex = 0;
let projectionEditing = false;
let showRankGuides = false;

try {
  showRankGuides = window.localStorage.getItem(rankGuidesStorageKey) === "true";
} catch {
  showRankGuides = false;
}
rankGuides.checked = showRankGuides;

function syncGabaritLink() {
  const isDecimal = [firstInput.value, secondInput.value].some((value) => /[.,]/.test(value));
  const pdf = $("#pdf-link");
  pdf.href = isDecimal ? "gabarit-addition-decimale.pdf" : "gabarit-addition-entiere.pdf";
  pdf.textContent = isDecimal ? "Gabarit décimal" : "Gabarit entier";
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  firstInput.removeAttribute("aria-invalid");
  secondInput.removeAttribute("aria-invalid");
}

function displayError(error) {
  const labels = ["Premier terme", "Second terme"];
  const label = labels[error.inputIndex] || "Nombre";
  errorBox.textContent = `${label} : ${error.message}`;
  errorBox.hidden = false;
  const input = error.inputIndex === 1 ? secondInput : firstInput;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function metricOptions() {
  const scroll = $("#addition-scroll");
  const stage = scroll.closest(".addition-stage");
  const vocabulary = $("#vocabulary-strip");
  const projection = document.body.classList.contains("is-projection");
  const wide = projection || window.innerWidth >= 1280;
  const availableWidth = Math.max(220, scroll.clientWidth || 720);
  const horizontalReserve = addition.decimalPlaces > 0 ? 82 : 70;
  const vocabularyHeight = vocabulary.hidden ? 0 : vocabulary.offsetHeight;
  const availableHeight = Math.max(220, (stage.clientHeight || 390) - vocabularyHeight - 22);

  return {
    columnBudget: Math.max(180, availableWidth - horizontalReserve),
    rowBudget: availableHeight,
    maxColumnWidth: projection ? 122 : wide ? 108 : 94,
    maxRowHeight: projection ? 132 : wide ? 112 : 98,
    maxDigitSize: projection ? 92 : wide ? 80 : 70
  };
}

function keepActiveColumnVisible() {
  const scroll = $("#addition-scroll");
  if (scroll.scrollWidth <= scroll.clientWidth) return;
  const active = $("#posed-addition .is-active") || $("#posed-addition .carry-cell.is-fresh");
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
  $("#exchange-memo").textContent = step.memo || "";
  $("#exchange-memo").hidden = !step.memo;
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
  $("#projection-problem").textContent = addition.displayTerms.join(" + ");

  renderVocabulary($("#vocabulary-strip"), step.kind === "verify");
  renderAddition({
    root: $("#posed-addition"),
    addition,
    steps,
    stepIndex,
    showRankGuides,
    metrics: makeDisplayMetrics(addition, metricOptions())
  });
  window.requestAnimationFrame(keepActiveColumnVisible);
}

function submit(event) {
  event.preventDefault();
  clearError();
  try {
    addition = makeAddition([firstInput.value, secondInput.value]);
  } catch (error) {
    if (error instanceof AdditionInputError) {
      displayError(error);
      return;
    }
    throw error;
  }

  steps = makeSteps(addition);
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

$("#addition-form").addEventListener("submit", submit);
[firstInput, secondInput].forEach((input) => input.addEventListener("input", () => {
  clearError();
  syncGabaritLink();
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

syncGabaritLink();
syncProjectionMode(false);
render();
