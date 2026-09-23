// Inconnues en barres — affichage. Un seul moteur de dessin : drawSchema().
// Règle d'or : sur un écran, TOUS les schémas partagent la même largeur de part (u),
// calculée pour que la rangée la plus large tienne dans la largeur disponible.
import * as M from "./moteur.mjs";

const $ = (id) => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const COLORS = {
  A: "#ffe2c4", B: "#d8eaff", D: "#fff1b3", T: "#dcf4e2", V: "#eefaf0", E: "#ffffff",
};
const TEXT = { A: "#8a3a0a", B: "#1c4f93", D: "#5c4a00", T: "#1c6337", V: "#1c6337", E: "#14283b" };

const state = {
  settings: { family: "fois", k: "2", variety: "guided", context: "fruits" },
  sens: "AtoB", ecritures: "aucune",
  problem: null, steps: null, step: 0, t: 0, aides: new Set(), scale: 1,
};

// ------------------------------------------------------------ taches SPLAT!
// Même forme que blobPath() de splat.html : cinq lobes arrondis.
function blobPath(cx, cy, r) {
  const n = 40, lobes = 5, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const k = 0.90 + 0.16 * Math.sin(lobes * a) + 0.04 * Math.sin(2 * lobes * a);
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  const f = (v) => v.toFixed(2);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + " Z";
}
const isTache = (ch) => !!(ch && M.tacheOf(ch));
function drawTache(parent, ch, cx, cy, r, cls = "contenu") {
  const t = M.tacheOf(ch);
  return el("path", { d: blobPath(cx, cy, r), fill: t.fill, stroke: "rgba(0,0,0,.25)", "stroke-width": Math.max(1, r * 0.06).toFixed(2), class: cls, "data-tache": t.key }, parent);
}
// Petite tache dans une ligne de texte (1 em de haut).
function tacheInline(ch) {
  const svg = el("svg", { viewBox: "-12 -12 24 24", class: "tache-texte", role: "img", "aria-label": "tache " + M.tacheOf(ch).mot });
  drawTache(svg, ch, 0, 0, 10.5, "");
  return svg;
}
// Écrit un texte en remplaçant chaque caractère de tache par son dessin.
function rich(node, str) {
  const parts = String(str).split(/([\ue100-\ue105])/);
  for (const part of parts) {
    if (!part) continue;
    if (isTache(part)) node.append(tacheInline(part)); else node.append(document.createTextNode(part));
  }
  return node;
}
function hr(tag, cls, str) { return rich(h(tag, cls), str); }

// ------------------------------------------------------------ mesure du texte
const ctx2d = document.createElement("canvas").getContext("2d");
const unitCache = new Map();
function unitWidth(str, emoji = false) {
  str = String(str).replace(M.TACHE_RE, "W"); // une petite tache ≈ la largeur d'un W
  const key = (emoji ? "e|" : "t|") + str;
  if (!unitCache.has(key)) {
    ctx2d.font = (emoji ? "400 100px " + EMOJI : "800 100px " + FONT);
    unitCache.set(key, ctx2d.measureText(str).width / 100);
  }
  return unitCache.get(key);
}
// Cherche la plus grande taille qui tient dans la case : 1 ligne, puis 2 (nombre / unité),
// et en dernier recours dans une case minuscule (téléphone) le nombre seul — l'unité
// reste écrite dans le total et dans l'énoncé.
const READABLE = 12;
function fitText(str, maxW, maxH, fMax) {
  const one = Math.min(fMax, maxW / unitWidth(str), maxH / 1.2);
  const cut = str.lastIndexOf("\u00a0");
  if (cut < 0 || one >= READABLE) return { lines: [str], f: one };
  const a = str.slice(0, cut), b = str.slice(cut + 1);
  const two = Math.min(fMax, maxW / Math.max(unitWidth(a), unitWidth(b)), maxH / 2.3);
  if (two >= READABLE) return { lines: [a, b], f: two };
  const bare = Math.min(fMax, maxW / unitWidth(a), maxH / 1.2);
  const best = Math.max(one, two, bare);
  if (best === one) return { lines: [str], f: one };
  if (best === two) return { lines: [a, b], f: two };
  return { lines: [a], f: bare };
}

// ------------------------------------------------------------ dessin d'un schéma
function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}
function drawSchema(s, u, h) {
  const px = (x) => Math.round(x * u);
  const cells = s.cells;
  const minX = Math.min(...cells.map((c) => c.x)), maxX = Math.max(...cells.map((c) => c.x + c.w));
  const W = px(s.cols);
  const bh = s.brackets && s.brackets.length ? Math.round(h * 0.72) : 0;
  const H = s.rows * h + bh;
  const m = 4;
  const svg = el("svg", { width: W + 2 * m, height: H + 2 * m, viewBox: `${-m} ${-m} ${W + 2 * m} ${H + 2 * m}`, role: "img", "aria-label": s.label });
  svg.dataset.u = String(u);
  const eB = Math.min(0.56 * h, 0.62 * u);
  for (const c of cells) {
    const x = px(c.x), w = px(c.x + c.w) - px(c.x), y = c.row * h;
    const g = el("g", { class: "case", "data-kind": c.kind, "data-w": String(c.w) }, svg);
    const tache = isTache(c.emoji);
    // Avec les taches, la couleur de la tache suffit : cases claires et neutres, comme dans SPLAT!
    const fond = tache && (c.kind === "A" || c.kind === "B") ? "#f8fafc" : COLORS[c.kind];
    el("rect", { x, y, width: w, height: h, fill: fond, stroke: "#334155", "stroke-width": 1.5 }, g);
    const cx = x + w / 2;
    const hasEmoji = !!c.emoji, hasText = c.text != null && c.text !== "";
    if (hasEmoji && !hasText) {
      if (tache) {
        // Le nom de la couleur sous la tache quand la case le permet (lecture en noir et blanc).
        const mot = M.tacheOf(c.emoji).mot;
        const fMot = Math.min(0.2 * h, (w - 8) / unitWidth(mot));
        if (fMot >= 11) {
          drawTache(g, c.emoji, cx, y + h * 0.37, Math.min(0.22 * h, 0.3 * u));
          const t = el("text", { x: cx, y: y + h * 0.8, "text-anchor": "middle", "dominant-baseline": "central", "font-family": FONT, "font-weight": 800, "font-size": fMot.toFixed(1), fill: "#334155", class: "contenu nom-case" }, g);
          t.textContent = mot;
        } else drawTache(g, c.emoji, cx, y + h / 2, Math.min(0.3 * h, 0.34 * u));
      }
      else el("text", { x: cx, y: y + h / 2, "text-anchor": "middle", "dominant-baseline": "central", "font-family": EMOJI, "font-size": eB.toFixed(1), class: "contenu" }, g).textContent = c.emoji;
    } else if (hasEmoji && hasText) {
      const e = Math.min(0.36 * h, 0.5 * u);
      if (tache) drawTache(g, c.emoji, cx, y + h * 0.3, Math.min(0.16 * h, 0.26 * u));
      else el("text", { x: cx, y: y + h * 0.3, "text-anchor": "middle", "dominant-baseline": "central", "font-family": EMOJI, "font-size": e.toFixed(1), class: "contenu" }, g).textContent = c.emoji;
      const fit = fitText(c.text, w - 8, h * 0.46, 0.32 * h);
      addLines(g, fit, cx, y + h * 0.53, h * 0.46, TEXT[c.kind]);
    } else if (hasText) {
      const fMax = c.kind === "T" ? 0.42 * h : c.kind === "D" ? 0.34 * h : 0.38 * h;
      const fit = fitText(c.text, w - 8, h - 8, fMax);
      addLines(g, fit, cx, y + 4, h - 8, TEXT[c.kind]);
    }
  }
  // contour épais de l'ensemble
  el("rect", { x: px(minX), y: 0, width: px(maxX) - px(minX), height: s.rows * h, fill: "none", stroke: "#14283b", "stroke-width": 2.6 }, svg);
  // mises en évidence (ce qu'on va remplacer ou retirer)
  for (const c of cells.filter((c) => c.hl)) {
    const x = px(c.x), w = px(c.x + c.w) - px(c.x), y = c.row * h;
    el("rect", { x: x + 2.5, y: y + 2.5, width: w - 5, height: h - 5, rx: 4, fill: "none", stroke: "#d9480f", "stroke-width": 4, class: "surligne" }, svg);
  }
  for (const gr of s.hlGroups || []) {
    const x = px(gr.x), w = px(gr.x + gr.w) - px(gr.x);
    el("rect", { x: x + 2.5, y: h + 2.5, width: w - 5, height: h - 5, rx: 4, fill: "none", stroke: "#d9480f", "stroke-width": 4, class: "surligne" }, svg);
  }
  // crochets : d'où viennent les parts après un remplacement
  for (const b of s.brackets || []) {
    const x0 = px(b.x) + 5, x1 = px(b.x + b.w) - 5, y0 = s.rows * h + 4, a = Math.round(h * 0.18);
    el("path", { d: `M${x0} ${y0} v${a} H${x1} v${-a}`, fill: "none", stroke: "#8a3a0a", "stroke-width": 2.2, "stroke-linejoin": "round" }, svg);
    if (isTache(b.text)) drawTache(svg, b.text, (x0 + x1) / 2, y0 + a + h * 0.25, Math.min(h * 0.17, u * 0.22), "contenu crochet");
    else el("text", { x: (x0 + x1) / 2, y: y0 + a + h * 0.25, "text-anchor": "middle", "dominant-baseline": "central", "font-family": EMOJI, "font-size": Math.min(h * 0.4, u * 0.5).toFixed(1), class: "contenu crochet" }, svg).textContent = b.text;
  }
  return svg;
}
function addLines(g, fit, cx, yTop, boxH, color) {
  const lh = fit.f * 1.12, total = lh * fit.lines.length;
  fit.lines.forEach((line, i) => {
    el("text", { x: cx, y: yTop + (boxH - total) / 2 + lh * (i + 0.5), "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": FONT, "font-weight": 800, "font-size": fit.f.toFixed(1), fill: color, class: "contenu" }, g).textContent = line;
  });
}

// ------------------------------------------------------------ mise en page d'un écran
function h(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

function shows() {
  return { pic: state.ecritures === "objets" || state.ecritures === "tout", let: state.ecritures === "lettres" || state.ecritures === "tout" };
}
// Lignes alignées sur « = » ; si la place manque (téléphone), chaque ligne passe en texte centré.
function egalites(lines, innerW) {
  const f = parseFloat(getComputedStyle($("tableau")).getPropertyValue("--f-ligne")) || 24;
  const natural = (Math.max(...lines.map(([l]) => unitWidth(l))) + unitWidth(" = ") + Math.max(...lines.map(([, r]) => unitWidth(r)))) * f;
  if (natural > innerW) {
    const box = h("div", "egalites flux");
    for (const [l, r] of lines) { const d = h("div", "ligne"); rich(d, l + " "); d.append(h("span", "s", "=")); rich(d, " " + r); box.append(d); }
    return box;
  }
  const grid = h("div", "egalites");
  for (const [l, r] of lines) { grid.append(hr("span", "g", l), h("span", "s", "="), hr("span", "d", r)); }
  return grid;
}
// Largeur naturelle des écritures d'un bloc (lignes alignées sur « = »).
function linesNaturalWidth(b, f) {
  const sh = shows(); let best = 0;
  for (const lines of [sh.pic && b.pic, sh.let && b.let]) if (lines) {
    const w = Math.max(...lines.map(([l]) => unitWidth(l))) + unitWidth(" = ") + Math.max(...lines.map(([, r]) => unitWidth(r)));
    best = Math.max(best, w);
  }
  return best ? best * f + 24 : 0;
}
function schemaBlockNode(b, u, hh, width, withLines, sideW = 0) {
  const node = h("div", "bloc" + (sideW ? " cote" : ""));
  node.style.width = width + sideW + "px";
  const main = sideW ? h("div", "cote-schema") : node;
  main.append(h("div", "titre", b.schema.label));
  main.append(drawSchema(b.schema, u, hh));
  if (b.calc) main.append(h("div", "calcul", b.calc));
  const sh = withLines ? shows() : { pic: false, let: false };
  const wr = h("div", "ecritures");
  const inner = sideW ? sideW - 10 : width - 40;
  if (sh.pic && b.pic) { const d = h("div", "ecriture"); d.append(h("div", "tag", "Objets"), egalites(b.pic, inner)); wr.append(d); }
  if (sh.let && b.let) { const d = h("div", "ecriture"); d.append(h("div", "tag", "Lettres"), egalites(b.let, inner)); wr.append(d); }
  if (sideW) { node.append(main); if (wr.childNodes.length) node.append(wr); }
  else if (wr.childNodes.length) node.append(wr);
  return node;
}
function hasLines(b) { const sh = b.lines === false ? {} : shows(); return !!(b.calc || (sh.pic && b.pic) || (sh.let && b.let)); }

// Largeur de part commune à tout l'écran.
function solveLayout(rows, W, isPhone, baseH) {
  const PAD = isPhone ? 14 : 22, GAP = isPhone ? 8 : 14, SEP = isPhone ? 26 : 40;
  const minLinesW = isPhone ? 150 : 230;
  const uMax = Math.max(30, Math.min(140, W / 7, 2.1 * baseH));
  const uSide = isPhone ? 999 : 44; // en dessous, on empile au lieu de mettre côte à côte
  const need = (row, u) => row.reduce((acc, b, i) => acc + (i ? GAP : 0) + (b.type === "schema" ? Math.max(b.schema.cols * u, hasLines(b) ? minLinesW : 0, 120) + PAD : SEP), 0);
  const best = (row) => { let u = Math.floor(uMax); while (u > 8 && need(row, u) > W) u--; return u; };
  const out = [];
  for (const row of rows) {
    const schemas = row.filter((b) => b.type === "schema");
    if (!schemas.length) { out.push(row); continue; }
    if (schemas.length > 1 && best(row) < uSide) {
      row.forEach((b) => { if (b.type === "schema") out.push([b]); else out.push([{ type: b.type === "and" ? "etSeul" : "flecheSeule" }]); });
    } else out.push(row);
  }
  let u = Infinity;
  for (const row of out) if (row.some((b) => b.type === "schema")) u = Math.min(u, best(row));
  if (!isFinite(u)) u = uMax;
  return { rows: out, u: Math.floor(u), minLinesW, PAD };
}

function renderScene(tps) {
  const board = $("tableau");
  const isPhone = window.innerWidth < 620;
  const W = board.clientWidth - 6;
  const vh = window.innerHeight;
  const baseH = Math.max(44, Math.min(90, vh * 0.085)) * state.scale;
  // Les écritures (objets, lettres) accompagnent seulement la dernière rangée de schémas :
  // les rangées du dessus rappellent d'où l'on vient, sans répéter leurs égalités.
  const lastSchemaRow = tps.rows.reduce((acc, row, i) => (row.some((b) => b.type === "schema") ? i : acc), -1);
  const rows = tps.rows.map((row, i) => row.map((b) => (b.type === "schema" ? { ...b, lines: i === lastSchemaRow } : b)));
  const lay = solveLayout(rows, W, isPhone, baseH);
  const u = lay.u;
  const hh = Math.round(Math.max(38, Math.min(baseH, u * 1.35)));
  const fLine = Math.max(14, Math.min(30, hh * 0.4, (isPhone ? 20 : 30) * state.scale));
  board.style.setProperty("--f-ligne", fLine.toFixed(1) + "px");
  board.style.setProperty("--f-titre", Math.max(12, Math.min(16, hh * 0.24)).toFixed(1) + "px");
  board.style.setProperty("--gap-rangee", Math.round(Math.max(6, hh * 0.2)) + "px");
  board.dataset.u = String(u);
  board.replaceChildren();
  for (const row of lay.rows) {
    const r = h("div", "rangee" + (row.some((b) => ["aides", "answer", "checks"].includes(b.type)) ? " large" : ""));
    for (const b of row) {
      if (b.type === "schema") {
        const schemaW = Math.round(b.schema.cols * u) + 8;
        const calcW = b.calc ? unitWidth(b.calc) * fLine * 1.06 + 16 : 0;
        const withLines = b.lines !== false;
        // Seul sur sa rangée et avec de la place à côté : les écritures passent à droite du schéma
        // (on gagne la hauteur que prendraient 4 à 6 lignes d'égalités).
        const natural = withLines ? linesNaturalWidth(b, fLine) : 0;
        const nLines = withLines ? ((shows().pic && b.pic ? b.pic.length : 0) + (shows().let && b.let ? b.let.length : 0)) : 0;
        if (!isPhone && row.length === 1 && nLines >= 2 && Math.max(schemaW, calcW) + natural + lay.PAD + 30 <= W) {
          r.append(schemaBlockNode(b, u, hh, Math.max(schemaW, calcW, 120) + lay.PAD - 2, true, Math.ceil(natural) + 16));
        } else {
          const width = Math.min(W - lay.PAD, Math.max(schemaW, hasLines(b) ? lay.minLinesW : 0, calcW, 120));
          r.append(schemaBlockNode(b, u, hh, width + lay.PAD - 2, withLines));
        }
      } else if (b.type === "and" || b.type === "etSeul") r.append(h("div", "et", "et"));
      else if (b.type === "arrow" || b.type === "flecheSeule") r.append(h("div", "fleche", isPhone ? "↓" : "→"));
      else if (b.type === "aides") r.append(aidesNode(b));
      else if (b.type === "answer") r.append(answerNode(b));
      else if (b.type === "checks") r.append(checksNode(b));
    }
    board.append(r);
  }
}

function aidesNode(b) {
  const box = h("div", "aides");
  b.cards.forEach((c, i) => {
    const open = state.aides.has(i);
    const card = h("button", "aide" + (open ? " ouverte" : ""));
    card.type = "button";
    card.setAttribute("aria-expanded", String(open));
    card.append(h("div", "qq", c.q));
    const rr = hr("div", "rr", c.a);
    if (!open) rr.style.visibility = "hidden";
    card.append(rr);
    card.addEventListener("click", () => { open ? state.aides.delete(i) : state.aides.add(i); render(); });
    box.append(card);
  });
  return box;
}
function answerNode(b) {
  const box = h("div", "reponses");
  for (const l of b.lines) { const c = h("div", "reponse"); c.append(hr("span", "emo", l.emoji), hr("span", "", l.text)); box.append(c); }
  return box;
}
function checksNode(b) {
  const box = h("div", "verifs");
  for (const l of b.lines) {
    const v = h("div", "verif");
    const c = h("div", "calc"); c.append(document.createTextNode(l.c + " "), h("span", "ok", "✓"));
    v.append(hr("div", "phrase", l.s), c);
    box.append(v);
  }
  return box;
}

// Carte SPLAT! : case TOTAL, plateau de taches (nom écrit sur chaque tache), phrase d'indice.
function renderSplatCard(en, p, k = 1) {
  const card = M.splatCard(p);
  const W = en.clientWidth || window.innerWidth;
  const phone = window.innerWidth < 620;
  const rangee = h("div", "splat-plateaux");
  const nPlateaux = card.plateaux.length;
  const H0 = Math.max(36, Math.min(104, window.innerHeight * 0.1) * k);
  for (const pl of card.plateaux) {
    const bloc = h("div", "splat-carte");
    const tot = h("div", "splat-total"); tot.append(h("span", "mot", "TOTAL"), h("span", "nb", M.fmt(pl.total)));
    const n = pl.taches.length;
    const dispo = (phone ? W - 40 : (W - 40) / nPlateaux - 40);
    const r = Math.max(14, Math.min(H0 * 0.4, dispo / (n * 2.25)));
    const pas = r * 2.25, marge = r * 0.35;
    const w = n * pas + 2 * marge, hh = r * 2.3;
    const svg = el("svg", { width: Math.round(w), height: Math.round(hh), viewBox: `0 0 ${w.toFixed(1)} ${hh.toFixed(1)}`, class: "splat-plateau", role: "img", "aria-label": n + " taches" });
    pl.taches.forEach((ch, i) => {
      const cx = marge + pas * (i + 0.5), cy = hh / 2;
      drawTache(svg, ch, cx, cy, r, "");
      const mot = M.tacheOf(ch).mot;
      const f = Math.min(r * 0.46, (r * 1.45) / unitWidth(mot));
      if (f >= 10) {
        const t = el("text", { x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "central", "font-family": FONT, "font-weight": 800, "font-size": f.toFixed(1), fill: "#fff", stroke: "#111", "stroke-width": (f * 0.16).toFixed(2), "paint-order": "stroke", class: "nom-tache" }, svg);
        t.textContent = mot;
      }
    });
    const plateau = h("div", "splat-cadre"); plateau.append(svg);
    bloc.append(tot, plateau); // le total au-dessus de SON plateau, comme dans SPLAT! et comme dans les schémas
    rangee.append(bloc);
  }
  en.append(rangee);
  for (const ind of card.indices) en.append(hr("div", "splat-indice", ind));
  const qq = h("div", "splat-question"); const mk = document.createElement("mark"); mk.className = "m-Q"; mk.textContent = card.question; qq.append(mk); en.append(qq);
}

// ------------------------------------------------------------ rendu complet
function effectiveSens() { return state.sens === "BtoA" && state.problem.canInverse ? "BtoA" : "AtoB"; }

function render() {
  const p = state.problem;
  // énoncé coloré
  const en = $("enonce"); en.replaceChildren();
  en.classList.toggle("splat", p.splat);
  if (p.splat) renderSplatCard(en, p);
  else for (const part of M.statementParts(p)) {
    if (part.c) { const mk = document.createElement("mark"); mk.className = "m-" + part.c; mk.textContent = part.t; en.append(mk); }
    else en.append(document.createTextNode(part.t));
  }
  // onglets
  const ol = $("onglets"); ol.replaceChildren();
  state.steps.forEach((tps, i) => {
    const li = document.createElement("li");
    const b = h("button", "onglet" + (i === state.step ? " actif" : i < state.step ? " fait" : ""));
    b.type = "button";
    b.setAttribute("aria-current", i === state.step ? "step" : "false");
    const nom = h("span", "nom"); nom.append(h("span", "num", (i + 1) + ". "), h("span", "lib", M.STEP_NAMES[i])); b.append(nom);
    const pts = h("span", "points");
    if (i === state.step && tps.length > 1) tps.forEach((_, j) => pts.append(h("i", j <= state.t ? "on" : "")));
    b.append(pts);
    b.addEventListener("click", () => go(i, 0));
    li.append(b); ol.append(li);
  });
  const tps = state.steps[state.step][state.t];
  $("consigne").replaceChildren(); rich($("consigne"), tps.instruction || "");
  $("btnPrec").disabled = state.step === 0 && state.t === 0;
  $("btnSuiv").disabled = state.step === state.steps.length - 1 && state.t === state.steps[state.step].length - 1;
  const sh = shows();
  const leg = $("legende");
  const withSchemas = tps.rows.some((r) => r.some((b) => b.type === "schema" && b.let));
  leg.hidden = !(sh.let && withSchemas);
  leg.textContent = M.letterLegend(p);
  // volet prof
  const rp = $("reperes"); rp.replaceChildren();
  for (const l of M.teacherLines(p, effectiveSens())) rp.append(h("li", "", l));
  // scène, avec réduction si elle dépasse en hauteur
  // On garde la plus grande échelle qui tient dans la hauteur (recherche par dichotomie).
  const board = $("tableau");
  const fits = (sc) => { state.scale = sc; renderScene(tps); return board.scrollHeight <= board.clientHeight + 1; };
  const fitScene = () => {
    if (fits(1)) return true;
    let lo = 0.45, hi = 1;
    if (!fits(lo)) return false;
    for (let i = 0; i < 5; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    fits(lo);
    return true;
  };
  // Avec les taches, si les schémas ne tiennent toujours pas, le plateau de l'énoncé se fait plus petit.
  if (!fitScene() && p.splat) {
    for (const k of [0.75, 0.55]) { en.replaceChildren(); renderSplatCard(en, p, k); if (fitScene()) break; }
  }
}

function go(step, t) {
  state.step = Math.max(0, Math.min(state.steps.length - 1, step));
  state.t = Math.max(0, Math.min(state.steps[state.step].length - 1, t));
  if (state.step === 0) state.aides = new Set(Array.from({ length: state.t }, (_, i) => i));
  render();
}
function next() {
  if (state.t < state.steps[state.step].length - 1) go(state.step, state.t + 1);
  else if (state.step < state.steps.length - 1) go(state.step + 1, 0);
}
function prev() {
  if (state.t > 0) go(state.step, state.t - 1);
  else if (state.step > 0) go(state.step - 1, state.steps[state.step - 1].length - 1);
}

function rebuildPlan() { state.steps = M.plan(state.problem, { sens: effectiveSens() }); }
function newProblem(seed) {
  state.problem = M.generate(state.settings, seed ?? Math.floor(Math.random() * 2147483647));
  rebuildPlan();
  syncMenu();
  go(0, 0);
}

// ------------------------------------------------------------ réglages
const VARIETY_HELP = {
  fois: { guided: "Un grand objet et ses équivalents.", simple: "Un grand objet et quelques petits.", rich: "Un ou deux grands objets et quelques petits (12 parts au plus)." },
  ecart: { guided: "Un objet de chaque sorte.", simple: "Un grand objet et 2 à 4 petits.", rich: "2 ou 3 grands objets et 1 à 4 petits." },
};
function syncMenu() {
  const s = state.settings, p = state.problem;
  $("famille").value = s.family; $("k").value = s.k; $("variete").value = s.variety; $("contexte").value = s.context;
  $("ecritures").value = state.ecritures; $("sens").value = state.sens;
  $("champK").hidden = s.family !== "fois";
  $("champSens").hidden = s.family !== "fois";
  $("champVariete").hidden = s.family === "partielle";
  $("aideVariete").textContent = (VARIETY_HELP[s.family] || {})[s.variety] || "";
  const opt = $("sens").querySelector('option[value="BtoA"]');
  if (p.family === "fois") {
    opt.disabled = !p.canInverse;
    $("aideSens").textContent = p.canInverse ? "" : "Impossible avec ce problème : " + p.n + " n’est pas un multiple de " + p.k + ".";
  }
}
function openMenu(open) {
  $("reglages").hidden = !open; $("voile").hidden = !open;
  $("btnReglages").setAttribute("aria-expanded", String(open));
  if (open) $("famille").focus(); else $("btnReglages").focus();
}

function init() {
  for (const [key, c] of Object.entries(M.CONTEXTS)) { const o = document.createElement("option"); o.value = key; o.textContent = c.label; $("contexte").append(o); }
  // réglages de départ lisibles dans l'adresse (utile pour préparer une séance et pour les essais)
  const qs = new URLSearchParams(location.search);
  if (qs.get("famille")) state.settings.family = qs.get("famille");
  if (qs.get("k")) state.settings.k = qs.get("k");
  if (qs.get("variete")) state.settings.variety = qs.get("variete");
  if (qs.get("contexte")) state.settings.context = qs.get("contexte");
  if (qs.get("sens")) state.sens = qs.get("sens");
  if (qs.get("ecritures")) state.ecritures = qs.get("ecritures");
  const seed = qs.get("graine") ? Number(qs.get("graine")) : undefined;

  const onSetting = (key, id) => $(id).addEventListener("change", () => { state.settings[key] = $(id).value; newProblem(); });
  onSetting("family", "famille"); onSetting("k", "k"); onSetting("variety", "variete"); onSetting("context", "contexte");
  $("sens").addEventListener("change", () => { state.sens = $("sens").value; rebuildPlan(); go(Math.min(state.step, 2), 0); });
  $("ecritures").addEventListener("change", () => { state.ecritures = $("ecritures").value; render(); });
  $("btnRecommencer").addEventListener("click", () => { openMenu(false); go(0, 0); });
  $("btnNouveau").addEventListener("click", () => newProblem());
  $("btnSuiv").addEventListener("click", next);
  $("btnPrec").addEventListener("click", prev);
  $("btnReglages").addEventListener("click", () => openMenu($("reglages").hidden));
  $("btnFermer").addEventListener("click", () => openMenu(false));
  $("voile").addEventListener("click", () => openMenu(false));
  $("btnPleinEcran").addEventListener("click", toggleFullscreen);
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!$("reglages").hidden) { if (e.key === "Escape") openMenu(false); return; }
    const tag = (e.target && e.target.tagName) || "";
    if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
  });
  let raf = 0;
  const relayout = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
  window.addEventListener("resize", relayout);
  document.addEventListener("fullscreenchange", relayout);
  newProblem(seed);
  if (qs.get("etape")) go(Number(qs.get("etape")) - 1, Number(qs.get("temps") || 1) - 1);
}

async function toggleFullscreen() {
  const app = $("app");
  if (document.fullscreenElement) { await document.exitFullscreen(); return; }
  if (document.body.classList.contains("projection")) { document.body.classList.remove("projection"); render(); return; }
  try { await app.requestFullscreen(); }
  catch { document.body.classList.add("projection"); render(); }
}

init();
