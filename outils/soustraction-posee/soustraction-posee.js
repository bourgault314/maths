import {
  SubtractionInputError,
  makeDisplayMetrics,
  makeSubtraction
} from "./soustraction-engine.mjs?v=1";
import { makeSteps } from "./soustraction-steps.mjs?v=1";
import { renderSubtraction, renderVocabulary } from "./soustraction-view.mjs?v=1";

const $ = (selector) => document.querySelector(selector);
const firstInput = $("#first-term");
const secondInput = $("#second-term");
const errorBox = $("#form-error");
const rankGuides = $("#rank-guides");
const rankGuidesStorageKey = "mathsgo-subtraction-rank-guides";

let subtraction = makeSubtraction("584", "279");
let steps = makeSteps(subtraction);
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
  pdf.href = isDecimal ? "gabarit-soustraction-decimale.pdf" : "gabarit-soustraction-entiere.pdf";
  pdf.textContent = isDecimal ? "Gabarit décimal" : "Gabarit entier";
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  firstInput.removeAttribute("aria-invalid");
  secondInput.removeAttribute("aria-invalid");
}

function displayError(error) {
  if (error.code === "negative-result") {
    errorBox.textContent = error.message;
  } else {
    const labels = ["Premier terme", "Second terme"];
    const label = labels[error.inputIndex] || "Nombre";
    errorBox.textContent = `${label} : ${error.message}`;
  }
  errorBox.hidden = false;
  const input = error.inputIndex === 1 ? secondInput : firstInput;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

function metricOptions() {
  const scroll = $("#subtraction-scroll");
  const stage = scroll.closest(".subtraction-stage");
  const vocabulary = $("#vocabulary-strip");
  const projection = document.body.classList.contains("is-projection");
  const compactProjection = projection && window.innerWidth >= 700 && window.innerHeight <= 520;
  const wide = projection || window.innerWidth >= 1280;
  const availableWidth = Math.max(220, scroll.clientWidth || 720);
  const horizontalReserve = subtraction.decimalPlaces > 0 ? 82 : 70;
  const vocabularyHeight = vocabulary.hidden ? 0 : vocabulary.offsetHeight;
  const minimumHeightBudget = compactProjection ? 180 : 220;
  const availableHeight = Math.max(
    minimumHeightBudget,
    (stage.clientHeight || 390) - vocabularyHeight - 22
  );

  return {
    columnBudget: Math.max(180, availableWidth - horizontalReserve),
    rowBudget: availableHeight,
    minRowHeight: compactProjection ? 30 : 54,
    maxColumnWidth: projection ? 122 : wide ? 108 : 94,
    maxRowHeight: compactProjection ? 58 : projection ? 132 : wide ? 112 : 98,
    maxDigitSize: compactProjection ? 40 : projection ? 92 : wide ? 80 : 70
  };
}

function keepActiveColumnVisible() {
  const scroll = $("#subtraction-scroll");
  if (scroll.scrollWidth <= scroll.clientWidth) return;
  const active = $("#posed-subtraction .is-active")
    || $("#posed-subtraction .exchange-cell.is-fresh");
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
  $("#projection-problem").textContent = subtraction.displayTerms.join(" − ");

  renderVocabulary($("#vocabulary-strip"), step.kind === "verify");
  renderSubtraction({
    root: $("#posed-subtraction"),
    subtraction,
    steps,
    stepIndex,
    showRankGuides,
    metrics: makeDisplayMetrics(subtraction, metricOptions())
  });
  window.requestAnimationFrame(keepActiveColumnVisible);
}

function submit(event) {
  event.preventDefault();
  clearError();
  try {
    subtraction = makeSubtraction(firstInput.value, secondInput.value);
  } catch (error) {
    if (error instanceof SubtractionInputError) {
      displayError(error);
      return;
    }
    throw error;
  }

  steps = makeSteps(subtraction);
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
    } else {
      throw new Error("Fullscreen API unavailable");
    }
  } catch {
    errorBox.textContent = "Le plein écran n’est pas disponible dans ce navigateur.";
    errorBox.hidden = false;
  }
}

$("#subtraction-form").addEventListener("submit", submit);
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
