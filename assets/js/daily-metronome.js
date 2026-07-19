(function (global) {
  "use strict";

  const ANGLES = Object.freeze([-18, -12, -6, 0, 6, 12, 18]);

  function weekdayIndex(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date du métronome invalide");
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  function angleForDate(value) {
    return ANGLES[weekdayIndex(value)];
  }

  function render(markup, value) {
    if (typeof markup !== "string") throw new TypeError("SVG du métronome invalide");
    const angle = angleForDate(value);
    return markup.replace(
      /<g data-mathsgo-metronome-needle="[^"]*" transform="rotate\([^"]+\)">/,
      `<g data-mathsgo-metronome-needle="${angle}" transform="rotate(${angle} 32 14.75)">`
    );
  }

  function applyToLibrary(value) {
    const library = global.MATHSGO_ICON_LIBRARY;
    if (!library || typeof library.automatismes !== "string") return false;
    library.automatismes = render(library.automatismes, value);
    return true;
  }

  function mount(root, value) {
    const scope = root || global.document;
    const library = global.MATHSGO_ICON_LIBRARY;
    if (!scope || typeof scope.querySelectorAll !== "function" || !library) return 0;
    const markup = render(library.automatismes, value);
    const slots = scope.querySelectorAll("[data-mathsgo-daily-metronome]");
    slots.forEach((slot) => { slot.innerHTML = markup; });
    return slots.length;
  }

  const api = Object.freeze({ ANGLES, weekdayIndex, angleForDate, render, applyToLibrary, mount });
  global.MATHSGO_DAILY_METRONOME = api;

  if (typeof window === "object") {
    applyToLibrary();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => mount(), { once: true });
    } else {
      mount();
    }
  }
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
