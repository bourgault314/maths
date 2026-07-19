(function (global) {
  "use strict";

  const LETTERS = Object.freeze(["x", "a", "b", "n", "y", "t", "k"]);

  function weekdayIndex(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date du Splat invalide");
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  function letterForDate(value) {
    return LETTERS[weekdayIndex(value)];
  }

  function render(markup, value) {
    if (typeof markup !== "string") return markup;
    const letter = letterForDate(value);
    const label = `<text x="12.4" y="14.2" text-anchor="middle" fill="#fff" font-family="Times New Roman, Times, serif" font-size="10" font-weight="700" font-style="italic" data-mathsgo-splat-letter="${letter}">${letter}</text>`;
    return markup.replace(
      /<text x="12\.4" y="14\.2" text-anchor="middle" fill="#fff" font-family="Times New Roman, Times, serif" font-size="10" font-weight="700" font-style="italic"(?: data-mathsgo-splat-letter="[a-z]")?>.*?<\/text>/,
      label
    );
  }

  function applyToLibrary(value) {
    const library = global.MATHSGO_ICON_LIBRARY;
    if (!library || typeof library.splat !== "string") return false;
    library.splat = render(library.splat, value);
    return true;
  }

  const api = Object.freeze({
    letters: LETTERS,
    weekdayIndex: weekdayIndex,
    letterForDate: letterForDate,
    render: render,
    applyToLibrary: applyToLibrary
  });

  global.MATHSGO_DAILY_SPLAT_LETTER = api;
  if (typeof window === "object") applyToLibrary();
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
