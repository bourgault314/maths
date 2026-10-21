import { mathSvgText } from "../math-format.js";
export const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const svg = (body, w = 600, h = 240) =>
  "" +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
  w +
  " " +
  h +
  '" role="img" aria-label="Schéma mathématique" ' +
  'style="max-width:100%;height:auto;font-family:Arial,sans-serif">' +
  body +
  "</svg>";
export const text = mathSvgText;
export const line = (x1, y1, x2, y2, color = "#173e3a", width = 2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
export const rect = (x, y, w, h, fill = "#ddede6", stroke = "#173e3a") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" rx="2"/>`;
export const circle = (cx, cy, r, fill = "#ddede6", stroke = "#173e3a") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
