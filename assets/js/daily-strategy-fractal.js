(function (global) {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const LEVELS = Object.freeze([0, 1, 2, 3, 2, 1]);
  const PALETTE = Object.freeze(["#f97316", "#06b6d4", "#6366f1", "#facc15"]);
  const LEVEL_TWO_COLOURS = Object.freeze([0, 1, 2, 2, 3, 1, 3, 0, 2]);
  const STROKE_WIDTHS = Object.freeze([1.1, 0.95, 0.75, 0.45]);
  const OUTER_TRIANGLE = Object.freeze([
    Object.freeze({ x: 24, y: 2 }),
    Object.freeze({ x: 4, y: 34 }),
    Object.freeze({ x: 44, y: 34 })
  ]);

  function localDayNumber(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date quotidienne invalide");
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function selectionForDate(value) {
    const day = localDayNumber(value);
    const index = ((day % LEVELS.length) + LEVELS.length) % LEVELS.length;
    return Object.freeze({ index: index, level: LEVELS[index] });
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function trianglesForLevel(level) {
    if (!Number.isInteger(level) || level < 0 || level > 3) {
      throw new RangeError("Génération de fractale invalide");
    }
    let triangles = [{ points: OUTER_TRIANGLE, address: "" }];
    for (let depth = 0; depth < level; depth += 1) {
      triangles = triangles.flatMap(function (triangle) {
        const top = triangle.points[0];
        const left = triangle.points[1];
        const right = triangle.points[2];
        const topLeft = midpoint(top, left);
        const topRight = midpoint(top, right);
        const bottom = midpoint(left, right);
        return [
          { points: [top, topLeft, topRight], address: triangle.address + "0" },
          { points: [topLeft, left, bottom], address: triangle.address + "1" },
          { points: [topRight, bottom, right], address: triangle.address + "2" }
        ];
      });
    }
    return triangles;
  }

  function colourIndex(triangle, level, index) {
    if (level === 0) return 0;
    if (level === 1) return index;
    if (level === 2) return LEVEL_TWO_COLOURS[index];
    const parentIndex = Number.parseInt(triangle.address.slice(0, 2), 3);
    const childIndex = Number(triangle.address[2]);
    return (LEVEL_TWO_COLOURS[parentIndex] + childIndex) % PALETTE.length;
  }

  function number(value) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
  }

  function pathForTriangle(triangle) {
    return triangle.points.map(function (point, index) {
      return `${index ? "L" : "M"}${number(point.x)} ${number(point.y)}`;
    }).join(" ") + "Z";
  }

  function groupForLevel(level, index) {
    const paths = trianglesForLevel(level).map(function (triangle, triangleIndex) {
      const fill = PALETTE[colourIndex(triangle, level, triangleIndex)];
      return `<path d="${pathForTriangle(triangle)}" fill="${fill}"/>`;
    }).join("");
    return `<g stroke="#312e81" stroke-width="${STROKE_WIDTHS[level]}" stroke-linejoin="round" data-mathsgo-strategy-fractal="${index}" data-mathsgo-strategy-fractal-level="${level}">${paths}</g>`;
  }

  function render(markup, value) {
    if (typeof markup !== "string") return markup;
    const selection = selectionForDate(value);
    return markup.replace(
      /<g stroke="#312e81" stroke-width="[^"]+" stroke-linejoin="round" data-mathsgo-strategy-fractal="">.*?<\/g>/,
      groupForLevel(selection.level, selection.index)
    );
  }

  const api = Object.freeze({
    levels: LEVELS,
    localDayNumber: localDayNumber,
    selectionForDate: selectionForDate,
    trianglesForLevel: trianglesForLevel,
    groupForLevel: groupForLevel,
    render: render
  });

  global.MATHSGO_DAILY_STRATEGY_FRACTAL = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
