(function (global) {
  "use strict";

  const POINTS = Object.freeze([
    [12, 35], [17.33, 35], [20, 39.62], [22.67, 35], [28, 35],
    [30.67, 39.62], [28, 44.24], [33.33, 44.24], [36, 48.86],
    [38.67, 44.24], [44, 44.24], [41.33, 39.62], [44, 35],
    [49.33, 35], [52, 39.62], [54.67, 35], [60, 35], [57.33, 31.22],
    [59.27, 27.02], [54.67, 27.44], [52, 23.67], [53.94, 19.47],
    [58.54, 19.05], [55.88, 15.27], [57.81, 11.07], [53.21, 11.49],
    [50.54, 7.71], [48.6, 11.91], [44, 12.33], [41.33, 8.56],
    [43.27, 4.36], [38.67, 4.78], [36, 1], [33.33, 4.78],
    [28.73, 4.36], [30.67, 8.56], [28, 12.33], [23.4, 11.91],
    [21.46, 7.71], [18.79, 11.49], [14.19, 11.07], [16.12, 15.27],
    [13.46, 19.05], [18.06, 19.47], [20, 23.67], [17.33, 27.44],
    [12.73, 27.02], [14.67, 31.22], [12, 35]
  ].map(function (point) { return Object.freeze(point); }));

  const SEGMENTS = [];
  let totalLength = 0;
  for (let index = 1; index < POINTS.length; index += 1) {
    const start = POINTS[index - 1];
    const end = POINTS[index];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    SEGMENTS.push(Object.freeze({ start: start, end: end, length: length }));
    totalLength += length;
  }
  Object.freeze(SEGMENTS);

  function weekdayStage(value) {
    const date = value === undefined ? new Date() : new Date(value);
    if (!Number.isFinite(date.getTime())) throw new TypeError("Date du flocon invalide");
    const day = date.getDay();
    return day === 0 ? 7 : day;
  }

  function number(value) {
    return Number(value.toFixed(2)).toString();
  }

  function stateForStage(value) {
    const stage = Math.max(1, Math.min(7, Math.trunc(Number(value)) || 1));
    const target = totalLength * stage / 7;
    const path = [POINTS[0]];
    let travelled = 0;
    let position = POINTS[0];
    let angle = 0;

    for (let index = 0; index < SEGMENTS.length; index += 1) {
      const segment = SEGMENTS[index];
      const nextTravelled = travelled + segment.length;
      if (target >= nextTravelled - 1e-9) {
        path.push(segment.end);
        travelled = nextTravelled;
        position = segment.end;
        angle = Math.atan2(segment.end[1] - segment.start[1], segment.end[0] - segment.start[0]);
        continue;
      }

      const ratio = (target - travelled) / segment.length;
      position = Object.freeze([
        segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
        segment.start[1] + (segment.end[1] - segment.start[1]) * ratio
      ]);
      path.push(position);
      angle = Math.atan2(segment.end[1] - segment.start[1], segment.end[0] - segment.start[0]);
      break;
    }

    if (stage === 7) {
      position = POINTS[POINTS.length - 1];
      const first = SEGMENTS[0];
      angle = Math.atan2(first.end[1] - first.start[1], first.end[0] - first.start[0]);
    }

    return Object.freeze({
      stage: stage,
      progress: stage / 7,
      path: Object.freeze(path.slice()),
      position: position,
      angle: angle * 180 / Math.PI
    });
  }

  function stateForDate(value) {
    return stateForStage(weekdayStage(value));
  }

  function render(markup, value) {
    if (typeof markup !== "string") return markup;
    const state = stateForDate(value);
    const points = state.path.map(function (point) {
      return number(point[0]) + "," + number(point[1]);
    }).join(" ");
    const transform = "translate(" + number(state.position[0]) + " "
      + number(state.position[1]) + ") rotate(" + number(state.angle) + ")";

    const progress = `<polyline points="${points}" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" data-mathsgo-koch-day="${state.stage}"/>`;
    const insect = `<g transform="${transform}" stroke="#166534" stroke-width=".9" stroke-linecap="round" data-mathsgo-koch-insect="${state.stage}"><ellipse cx="0" cy="0" rx="4.8" ry="3.2" fill="#22c55e"/><path d="M-2-2.6-4.5-5M-2 2.6-4.5 5M2-2.6 3.5-5M2 2.6 3.5 5" fill="none"/><circle cx="5" cy="0" r="2.1" fill="#facc15"/><circle cx="5.6" cy="-.6" r=".45" fill="#312e81" stroke="none"/></g>`;

    return markup
      .replace(/<polyline points="[^"]*" fill="none" stroke="#f97316" stroke-width="2\.2" stroke-linecap="round" stroke-linejoin="round"(?: data-mathsgo-koch-day="\d")?\s*\/>/, progress)
      .replace(/<g transform="[^"]+" stroke="#166534" stroke-width="\.9" stroke-linecap="round"(?: data-mathsgo-koch-insect="\d")?>.*?<\/g>/, insect);
  }

  const api = Object.freeze({
    points: POINTS,
    weekdayStage: weekdayStage,
    stateForStage: stateForStage,
    stateForDate: stateForDate,
    render: render
  });

  global.MATHSGO_DAILY_KOCH = api;
  if (typeof module === "object" && module.exports) module.exports = api;
}(typeof window === "object" ? window : globalThis));
