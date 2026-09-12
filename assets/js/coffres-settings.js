/* Réglages communs aux deux jeux de coffres. Pas de stockage ni de dépendance. */
(function (root) {
  "use strict";
  const OPERATIONS = ["sum", "difference", "product", "quotient"];
  const DEFAULT_SERIES = ["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"];

  function normalizeOperations(value) {
    const requested = Array.isArray(value) ? value : String(value || "").split(",");
    const selected = OPERATIONS.filter(operation => requested.includes(operation));
    return selected.length ? selected : OPERATIONS.slice();
  }

  function readOperations(search) {
    return normalizeOperations(new URLSearchParams(search).get("operations"));
  }

  function writeOperations(params, operations) {
    const selected = normalizeOperations(operations);
    if (selected.length === OPERATIONS.length) params.delete("operations");
    else params.set("operations", selected.join(","));
  }

  function soloSeries(operations) {
    const selected = normalizeOperations(operations);
    if (selected.length === OPERATIONS.length) return DEFAULT_SERIES.slice();
    return Array.from({ length: 10 }, (_, index) => selected[index % selected.length]);
  }

  function sameOperations(first, second) {
    return normalizeOperations(first).join(",") === normalizeOperations(second).join(",");
  }

  // Les choix restent provisoires jusqu'à Continuer ; Échap peut les abandonner.
  function createChoices(dialog, currentMode, onConfirm) {
    const modeButtons = [...dialog.querySelectorAll("[data-game-mode]")];
    const levelButtons = [...dialog.querySelectorAll("[data-level]")];
    const checkboxes = [...dialog.querySelectorAll("[name=operation]")];
    const levelRow = dialog.querySelector(".level-row");
    const continueButton = dialog.querySelector("#continue-current-mode");
    const hint = dialog.querySelector("#operations-hint");
    let selectedMode = currentMode;
    let selectedLevel = 1;
    let initialLevel = 1;
    let initialOperations = OPERATIONS.slice();
    let started = false;

    const read = () => ({
      mode: selectedMode,
      level: selectedLevel,
      operations: normalizeOperations(checkboxes.filter(input => input.checked).map(input => input.value))
    });

    function sync() {
      modeButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.gameMode === selectedMode)));
      levelButtons.forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.level) === selectedLevel)));
      levelRow.hidden = selectedMode !== "solo";
      const changed = !sameOperations(read().operations, initialOperations) || (selectedMode === "solo" && selectedLevel !== initialLevel);
      continueButton.textContent = started && selectedMode === currentMode && changed ? "Nouvelle partie" : "Continuer";
    }

    modeButtons.forEach(button => button.addEventListener("click", () => {
      selectedMode = button.dataset.gameMode;
      sync();
    }));
    levelButtons.forEach(button => button.addEventListener("click", () => {
      selectedLevel = Number(button.dataset.level) === 2 ? 2 : 1;
      sync();
    }));
    checkboxes.forEach(input => input.addEventListener("change", () => {
      if (!checkboxes.some(checkbox => checkbox.checked)) {
        input.checked = true;
        hint.textContent = "Garde au moins une opération.";
      } else hint.textContent = "";
      sync();
    }));
    continueButton.addEventListener("click", () => onConfirm(read()));

    return {
      read,
      reset(operations, level, gameStarted = false) {
        selectedMode = currentMode;
        selectedLevel = initialLevel = level;
        initialOperations = normalizeOperations(operations);
        started = gameStarted;
        checkboxes.forEach(input => { input.checked = initialOperations.includes(input.value); });
        hint.textContent = "";
        dialog.querySelector("#mode-title").textContent = started ? "Réglages" : "Choisis ton mode";
        sync();
      }
    };
  }

  const api = { OPERATIONS, normalizeOperations, readOperations, writeOperations, soloSeries, sameOperations, createChoices };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MATHSGO_COFFRES_SETTINGS = api;
})(typeof window === "object" ? window : this);
