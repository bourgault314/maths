(function (global) {
  "use strict";

  const DAY_MS = 24 * 60 * 60 * 1000;
  const CENTER = 29;
  const OUTER_RADIUS = 27;
  const PETAL_CENTER_RADIUS = 13.1;
  const PETAL_RADIUS = 13.1;
  const SECOND_CENTER_RADIUS = 20.1;
  const SECOND_CIRCLE_RADIUS = 8.5;

  const PATTERNS = Object.freeze([
    Object.freeze({ order: 3, id: "triquetra", name: "Triquetra", step: 1, inner: 9.6 }),
    Object.freeze({ order: 4, id: "quadrilobe", name: "Quadrilobe", step: 1, inner: 10.8, rotatedSquare: true }),
    Object.freeze({ order: 5, id: "pentafleur", name: "Pentafleur", step: 2, inner: 10.4, outline: true }),
    Object.freeze({ order: 6, id: "hexafleur", name: "Hexafleur", step: 2, inner: 11.2 }),
    Object.freeze({ order: 7, id: "heptafleur", name: "Heptafleur", step: 3, inner: 11.6, outline: true }),
    Object.freeze({ order: 8, id: "octafleur", name: "Octafleur", step: 3, inner: 12, outline: true }),
    Object.freeze({ order: 9, id: "nonafleur", name: "Nonafleur", step: 4, inner: 12.4, secondStep: 2 })
  ]);

  const PATTERN_BY_ID = new Map(PATTERNS.map(function (pattern) {
    return [pattern.id, pattern];
  }));

  function patternFrom(value) {
    if (typeof value === "number") return PATTERNS[value];
    if (typeof value === "string") return PATTERN_BY_ID.get(value);
    if (value && Number.isInteger(value.order)) return value;
    return undefined;
  }

  function localDayNumber(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date quotidienne invalide");
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function selectionForDate(value) {
    const day = localDayNumber(value);
    const index = ((day % PATTERNS.length) + PATTERNS.length) % PATTERNS.length;
    return Object.freeze({ index: index, pattern: PATTERNS[index] });
  }

  function number(value) {
    return Number(Number(value).toFixed(3)).toString();
  }

  function point(radius, angle) {
    return Object.freeze({
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle)
    });
  }

  function pointsFor(count, radius, rotation) {
    return Array.from({ length: count }, function (_item, index) {
      return point(radius, rotation + 2 * Math.PI * index / count);
    });
  }

  function pathFromPoints(points, closed) {
    if (!points.length) return "";
    const commands = points.map(function (item, index) {
      return (index ? "L" : "M") + number(item.x) + " " + number(item.y);
    });
    if (closed) commands.push("Z");
    return commands.join(" ");
  }

  function starPaths(vertices, step) {
    const paths = [];
    const visited = new Set();
    for (let start = 0; start < vertices.length; start += 1) {
      if (visited.has(start)) continue;
      const cycle = [];
      let index = start;
      do {
        visited.add(index);
        cycle.push(vertices[index]);
        index = (index + step) % vertices.length;
      } while (index !== start);
      if (cycle.length > 2) paths.push(pathFromPoints(cycle, true));
    }
    return paths;
  }

  function renderPattern(patternValue) {
    const pattern = patternFrom(patternValue);
    if (!pattern) throw new RangeError("Rosace inconnue");
    const rotation = -Math.PI / 2;
    const centers = pointsFor(pattern.order, PETAL_CENTER_RADIUS, rotation);
    const secondCenters = pointsFor(pattern.order, SECOND_CENTER_RADIUS, rotation);
    const starVertices = pointsFor(pattern.order, 13.9, rotation);
    const clipId = "mathsgo-rosette-clip-" + pattern.order;

    const petals = centers.map(function (center) {
      return `<circle cx="${number(center.x)}" cy="${number(center.y)}" r="${PETAL_RADIUS}" fill="#0b67b2" fill-opacity=".045" stroke="#08aaa5" stroke-width=".95" data-mathsgo-rosette-petal="primary"/>`;
    }).join("");
    const secondPetals = secondCenters.map(function (center) {
      return `<circle cx="${number(center.x)}" cy="${number(center.y)}" r="${SECOND_CIRCLE_RADIUS}" fill="none" stroke="#0b67b2" stroke-width=".7" opacity=".76" data-mathsgo-rosette-petal="secondary"/>`;
    }).join("");
    const stars = starPaths(starVertices, pattern.step).map(function (path) {
      return `<path d="${path}" fill="none" stroke="#f58220" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join("");
    const outline = pattern.outline
      ? `<path d="${pathFromPoints(starVertices, true)}" fill="none" stroke="#0b67b2" stroke-width=".7" opacity=".72"/>`
      : "";
    const rotatedSquare = pattern.rotatedSquare
      ? `<path d="${pathFromPoints(pointsFor(4, 11.2, rotation + Math.PI / 4), true)}" fill="none" stroke="#0b67b2" stroke-width=".7" opacity=".72"/>`
      : "";
    const secondStar = pattern.secondStep
      ? starPaths(pointsFor(pattern.order, 9.6, rotation), pattern.secondStep).map(function (path) {
        return `<path d="${path}" fill="none" stroke="#0b67b2" stroke-width=".7" opacity=".72"/>`;
      }).join("")
      : "";
    const constructionPoints = centers.map(function (center) {
      return `<circle cx="${number(center.x)}" cy="${number(center.y)}" r=".85" fill="#f58220" stroke="#fff" stroke-width=".35" data-mathsgo-rosette-point=""/>`;
    }).join("");

    return `<svg viewBox="0 0 58 58" aria-hidden="true" data-mathsgo-rosette-order="${pattern.order}" data-mathsgo-rosette-id="${pattern.id}">`
      + `<defs><clipPath id="${clipId}"><circle cx="${CENTER}" cy="${CENTER}" r="${OUTER_RADIUS}"/></clipPath></defs>`
      + `<circle cx="${CENTER}" cy="${CENTER}" r="${OUTER_RADIUS}" fill="none" stroke="#0b67b2" stroke-width="1.35"/>`
      + `<circle cx="${CENTER}" cy="${CENTER}" r="${PETAL_CENTER_RADIUS}" fill="none" stroke="#cbd5e1" stroke-width=".55"/>`
      + `<circle cx="${CENTER}" cy="${CENTER}" r="${pattern.inner}" fill="none" stroke="#cbd5e1" stroke-width=".55"/>`
      + `<g clip-path="url(#${clipId})">${petals}${secondPetals}</g>`
      + stars + outline + rotatedSquare + secondStar + constructionPoints
      + `<circle cx="${CENTER}" cy="${CENTER}" r="1" fill="#08aaa5"/>`
      + "</svg>";
  }

  function render(_markup, value) {
    return renderPattern(selectionForDate(value).pattern);
  }

  const api = Object.freeze({
    patterns: PATTERNS,
    localDayNumber: localDayNumber,
    selectionForDate: selectionForDate,
    renderPattern: renderPattern,
    render: render
  });

  global.MATHSGO_DAILY_ROSETTES = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
