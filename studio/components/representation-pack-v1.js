/*
 * maths&go — pack de représentations v1
 *
 * Composants déterministes, sans dépendance externe.
 * Le contenu pédagogique fournit des paramètres validés ; ce fichier dessine
 * les représentations. Il ne contient ni banque de questions ni aléatoire.
 *
 * Expose : window.MATHSGO_REPRESENTATIONS
 */
(function (global) {
  'use strict';

  const VERSION = '1.0.0';
  const COLORS = Object.freeze({
    ink: '#202020',
    muted: '#6b7280',
    grid: '#d9dee5',
    paper: '#ffffff',
    positive: '#69a84f',
    negative: '#e56a61',
    positiveSoft: '#eaf4e6',
    negativeSoft: '#fbe9e7',
    fraction: '#f4c542',
    fractionSoft: '#fff8dc',
    percentage: '#2471a3',
    point: '#2471a3',
    correction: '#2e7d32'
  });

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function num(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function integer(value, fallback) {
    const n = Math.round(num(value, fallback));
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(value) {
    if (typeof value === 'string') return value;
    const n = num(value, 0);
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)));
  }

  function signed(value) {
    const n = integer(value, 0);
    if (n > 0) return '+' + n;
    if (n < 0) return '−' + Math.abs(n);
    return '0';
  }

  function root(width, height, content, options) {
    const opts = options || {};
    const label = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : '';
    const viewBox = opts.viewBox || ('0 0 ' + width + ' ' + height);
    return '<svg xmlns="' + SVG_NS + '" viewBox="' + viewBox + '" width="100%" height="auto"' + label + '>' + content + '</svg>';
  }

  function text(x, y, value, options) {
    const opts = options || {};
    const anchor = opts.anchor || 'middle';
    const size = opts.size || 14;
    const fill = opts.fill || COLORS.ink;
    const weight = opts.weight || 400;
    const family = opts.family || 'Arial, sans-serif';
    const baseline = opts.baseline ? ' dominant-baseline="' + esc(opts.baseline) + '"' : '';
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" font-family="' + family + '" font-size="' + size + '" font-weight="' + weight + '" fill="' + fill + '"' + baseline + '>' + esc(value) + '</text>';
  }

  function line(x1, y1, x2, y2, options) {
    const opts = options || {};
    const dash = opts.dash ? ' stroke-dasharray="' + opts.dash + '"' : '';
    const cap = opts.cap ? ' stroke-linecap="' + opts.cap + '"' : '';
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (opts.stroke || COLORS.ink) + '" stroke-width="' + (opts.width || 1.5) + '"' + dash + cap + '/>';
  }

  function rect(x, y, width, height, options) {
    const opts = options || {};
    const rx = opts.rx == null ? 0 : opts.rx;
    const dash = opts.dash ? ' stroke-dasharray="' + opts.dash + '"' : '';
    return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" rx="' + rx + '" fill="' + (opts.fill || 'none') + '" stroke="' + (opts.stroke || 'none') + '" stroke-width="' + (opts.width || 1) + '"' + dash + '/>';
  }

  function circle(cx, cy, radius, options) {
    const opts = options || {};
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="' + (opts.fill || 'none') + '" stroke="' + (opts.stroke || 'none') + '" stroke-width="' + (opts.width || 1) + '"/>';
  }

  function arrowHead(x, y, direction, color) {
    const c = color || COLORS.ink;
    if (direction === 'left') {
      return '<polygon points="' + x + ',' + y + ' ' + (x + 10) + ',' + (y - 5) + ' ' + (x + 10) + ',' + (y + 5) + '" fill="' + c + '"/>';
    }
    return '<polygon points="' + x + ',' + y + ' ' + (x - 10) + ',' + (y - 5) + ' ' + (x - 10) + ',' + (y + 5) + '" fill="' + c + '"/>';
  }

  function validateInteger(value, name, min, max) {
    if (!Number.isInteger(value)) return name + ' doit être un entier.';
    if (min != null && value < min) return name + ' doit être supérieur ou égal à ' + min + '.';
    if (max != null && value > max) return name + ' doit être inférieur ou égal à ' + max + '.';
    return null;
  }

  function validateStep(step) {
    if (!Number.isFinite(step) || step <= 0) return 'step doit être strictement positif.';
    return null;
  }

  function beadColor(value) {
    return value >= 0 ? COLORS.positive : COLORS.negative;
  }

  function beadText(value) {
    return value >= 0 ? '+1' : '−1';
  }

  function normalizeGroups(config) {
    const groups = Array.isArray(config.groups) ? config.groups : [];
    return groups.map(function (raw, index) {
      const item = typeof raw === 'number' ? { value: raw } : (raw || {});
      const value = integer(item.value, 0);
      const tokens = [];
      const zeroPairs = Math.max(0, integer(item.zeroPairs, 0));
      for (let p = 0; p < zeroPairs; p += 1) {
        tokens.push({ value: 1, pairId: index + '-z-' + p, zero: true, crossed: false });
        tokens.push({ value: -1, pairId: index + '-z-' + p, zero: true, crossed: false });
      }
      const sign = value < 0 ? -1 : 1;
      for (let i = 0; i < Math.abs(value); i += 1) {
        const crossed = Array.isArray(item.crossedIndices) && item.crossedIndices.indexOf(i) >= 0;
        tokens.push({ value: sign, crossed: Boolean(item.crossed || crossed), zero: false });
      }
      return {
        value: value,
        label: item.label == null ? signed(value) : String(item.label),
        tokens: tokens,
        showLabel: item.showLabel !== false,
        pairLabel: item.pairLabel == null ? '0' : String(item.pairLabel)
      };
    });
  }

  /**
   * Jetons de nombres relatifs.
   * Les écritures sont placées au-dessus des groupes ; les paires nulles sont
   * regroupées et marquées 0 ; les jetons barrés servent aux soustractions.
   */
  function renderBeadGroups(config) {
    const cfg = config || {};
    const groups = normalizeGroups(cfg);
    const tokenR = num(cfg.tokenRadius, 18);
    const gap = num(cfg.gap, 9);
    const groupGap = num(cfg.groupGap, 28);
    const width = num(cfg.width, 720);
    const rowGap = num(cfg.rowGap, 88);
    const rowHeight = 74;
    const maxPerRow = Math.max(1, integer(cfg.maxPerRow, 12));
    const style = cfg.style || 'vert-rouge-contour-noir';
    const rows = [];
    let current = [];
    let count = 0;
    groups.forEach(function (group) {
      const size = Math.max(1, group.tokens.length);
      if (current.length && count + size > maxPerRow) {
        rows.push(current);
        current = [];
        count = 0;
      }
      current.push(group);
      count += size;
    });
    if (current.length) rows.push(current);
    if (!rows.length) rows.push([]);

    const height = Math.max(120, rows.length * rowGap + 34);
    let body = '';
    rows.forEach(function (row, rowIndex) {
      const widths = row.map(function (group) {
        return Math.max(48, group.tokens.length * (tokenR * 2 + gap) - gap);
      });
      const total = widths.reduce(function (sum, value) { return sum + value; }, 0) + Math.max(0, row.length - 1) * groupGap;
      let x = Math.max(22, (width - total) / 2);
      const y = 46 + rowIndex * rowGap;
      row.forEach(function (group, groupIndex) {
        const groupWidth = widths[groupIndex];
        if (group.showLabel) {
          body += text(x + groupWidth / 2, y - 24, group.label, { size: 17, weight: 700 });
        }
        const tokenY = y + 10;
        const pairPositions = {};
        group.tokens.forEach(function (token, tokenIndex) {
          const cx = x + tokenR + tokenIndex * (tokenR * 2 + gap);
          if (token.pairId) {
            if (!pairPositions[token.pairId]) pairPositions[token.pairId] = [];
            pairPositions[token.pairId].push(cx);
          }
          body += circle(cx, tokenY, tokenR, { fill: style === 'contour-seul' ? COLORS.paper : beadColor(token.value), stroke: COLORS.ink, width: 1.6 });
          body += text(cx, tokenY + 5, beadText(token.value), { size: tokenR < 15 ? 9 : 11, weight: 700 });
          if (token.crossed) {
            body += line(cx - tokenR * 0.68, tokenY + tokenR * 0.68, cx + tokenR * 0.68, tokenY - tokenR * 0.68, { stroke: COLORS.ink, width: 2.3, cap: 'round' });
          }
        });
        Object.keys(pairPositions).forEach(function (pairId) {
          const positions = pairPositions[pairId];
          if (positions.length !== 2) return;
          const left = positions[0] - tokenR - 5;
          const right = positions[1] + tokenR + 5;
          body += rect(left, tokenY - tokenR - 5, right - left, tokenR * 2 + 10, { rx: 9, fill: 'none', stroke: COLORS.muted, width: 1.1, dash: '4 3' });
          body += text((left + right) / 2, tokenY + tokenR + 20, group.pairLabel, { size: 12, fill: COLORS.muted, weight: 700 });
        });
        x += groupWidth + groupGap;
      });
    });
    return root(width, height, body, { label: cfg.label || 'Représentation de jetons de nombres relatifs' });
  }

  function lineScale(min, max, x0, x1, value) {
    if (max === min) return x0;
    return x0 + ((value - min) / (max - min)) * (x1 - x0);
  }

  function buildTicks(min, max, step, maxTicks) {
    const result = [];
    const cap = maxTicks || 25;
    const count = Math.floor((max - min) / step + 0.000001);
    if (count > cap) return result;
    for (let i = 0; i <= count; i += 1) {
      const value = min + i * step;
      if (value <= max + 0.000001) result.push(Number(value.toFixed(8)));
    }
    if (!result.length || result[result.length - 1] < max - 0.000001) result.push(max);
    return result;
  }

  function renderLineLayer(cfg, y, x0, x1, width, labelsAbove, idSuffix) {
    const min = num(cfg.min, 0);
    const max = num(cfg.max, 10);
    const step = num(cfg.step, 1);
    const ticks = Array.isArray(cfg.ticks) ? cfg.ticks.map(Number) : buildTicks(min, max, step, cfg.maxTicks || 21);
    const labels = cfg.labels || {};
    let body = '';
    body += line(x0, y, x1 - 12, y, { stroke: COLORS.ink, width: 1.8 });
    body += arrowHead(x1, y, 'right', COLORS.ink);
    ticks.forEach(function (value) {
      const x = lineScale(min, max, x0, x1 - 12, value);
      body += line(x, y - 8, x, y + 8, { stroke: COLORS.ink, width: 1.35 });
      const label = Object.prototype.hasOwnProperty.call(labels, String(value)) ? labels[String(value)] : (cfg.showTickLabels === false ? '' : formatNumber(value));
      if (label !== '') body += text(x, labelsAbove ? y - 17 : y + 27, label, { size: cfg.labelSize || 13, anchor: x < x0 + 4 ? 'start' : (x > x1 - 18 ? 'end' : 'middle') });
    });
    (Array.isArray(cfg.points) ? cfg.points : []).forEach(function (point, pointIndex) {
      const value = num(point.value, min);
      if (value < min || value > max) return;
      const x = lineScale(min, max, x0, x1 - 12, value);
      const color = point.color || COLORS.point;
      body += line(x, y - 27, x, y + 17, { stroke: color, width: 2, dash: '4 3' });
      body += circle(x, y, 4.5, { fill: color, stroke: COLORS.paper, width: 1.2 });
      if (point.label != null) {
        const labelY = point.position === 'below' ? y + 48 : y - 38;
        body += text(x, labelY, point.label, { size: 13, fill: color, weight: 700, anchor: x < x0 + 15 ? 'start' : (x > x1 - 25 ? 'end' : 'middle') });
      }
    });
    return { body: body, min: min, max: max, x0: x0, x1: x1 - 12, id: idSuffix || '' };
  }

  /** Droite graduée simple : pas régulier, échelles variables, points repérés. */
  function renderNumberLine(config) {
    const cfg = config || {};
    const width = num(cfg.width, 720);
    const height = num(cfg.height, 160);
    const x0 = 34;
    const x1 = width - 24;
    const layer = renderLineLayer(cfg, 82, x0, x1, width, true, 'single');
    let body = layer.body;
    if (cfg.title) body = text(width / 2, 22, cfg.title, { size: 15, weight: 700 }) + body;
    return root(width, height, body, { label: cfg.label || 'Droite graduée' });
  }

  /** Double droite graduée, utilisée pour les correspondances et pourcentages. */
  function renderDoubleNumberLine(config) {
    const cfg = config || {};
    const width = num(cfg.width, 720);
    const height = num(cfg.height, 228);
    const x0 = 52;
    const x1 = width - 24;
    const top = Object.assign({}, cfg.top || {}, { width: width });
    const bottom = Object.assign({}, cfg.bottom || {}, { width: width });
    const topLayer = renderLineLayer(top, 82, x0, x1, width, true, 'top');
    const bottomLayer = renderLineLayer(bottom, 160, x0, x1, width, false, 'bottom');
    let body = '';
    if (cfg.topLabel) body += text(12, 68, cfg.topLabel, { size: 13, anchor: 'start', weight: 700 });
    if (cfg.bottomLabel) body += text(12, 146, cfg.bottomLabel, { size: 13, anchor: 'start', weight: 700 });
    body += topLayer.body + bottomLayer.body;
    return root(width, height, body, { label: cfg.label || 'Double droite graduée de correspondance' });
  }

  function fractionText(x, y, numerator, denominator, options) {
    const opts = options || {};
    const size = opts.size || 15;
    const fill = opts.fill || COLORS.ink;
    return text(x, y - 8, numerator, { size: size, fill: fill, weight: 700 }) +
      line(x - size * 0.55, y, x + size * 0.55, y, { stroke: fill, width: 1.2 }) +
      text(x, y + 16, denominator, { size: size, fill: fill, weight: 700 });
  }

  /** Bande fractionnée : parts égales, remplissage des premières parts. */
  function renderFractionStrip(config) {
    const cfg = config || {};
    const denominator = integer(cfg.denominator, 4);
    const numerator = integer(cfg.numerator, 1);
    const error = validateInteger(denominator, 'denominator', 1, 24) || validateInteger(numerator, 'numerator', 0, denominator);
    if (error) return errorSvg(error);
    const width = num(cfg.width, 620);
    const height = num(cfg.height, 140);
    const x = 28;
    const y = 42;
    const barW = width - 56;
    const barH = 42;
    const cellW = barW / denominator;
    let body = '';
    for (let i = 0; i < denominator; i += 1) {
      body += rect(x + i * cellW, y, cellW, barH, { fill: i < numerator ? (cfg.fill || COLORS.fraction) : COLORS.paper, stroke: COLORS.ink, width: 1.2 });
    }
    body += fractionText(width / 2, y + barH + 38, numerator, denominator, { size: 17, fill: COLORS.ink });
    if (cfg.showUnit !== false) body += text(width - 26, y + barH + 38, '1', { size: 17, weight: 700, anchor: 'end' });
    if (cfg.title) body = text(width / 2, 20, cfg.title, { size: 15, weight: 700 }) + body;
    return root(width, height, body, { label: cfg.label || 'Bande représentant ' + numerator + '/' + denominator });
  }

  /** Grille fractionnée utile pour les centièmes et les fractions équivalentes. */
  function renderFractionGrid(config) {
    const cfg = config || {};
    const columns = integer(cfg.columns, 5);
    const rows = integer(cfg.rows, 5);
    const filled = integer(cfg.filled, 0);
    const total = columns * rows;
    const error = validateInteger(columns, 'columns', 1, 20) || validateInteger(rows, 'rows', 1, 20) || validateInteger(filled, 'filled', 0, total);
    if (error) return errorSvg(error);
    const width = num(cfg.width, 360);
    const height = num(cfg.height, 300);
    const size = Math.min(width - 52, height - 76);
    const x = (width - size) / 2;
    const y = 22;
    const cellW = size / columns;
    const cellH = size / rows;
    let body = '';
    for (let index = 0; index < total; index += 1) {
      const col = index % columns;
      const row = Math.floor(index / columns);
      body += rect(x + col * cellW, y + row * cellH, cellW, cellH, { fill: index < filled ? (cfg.fill || COLORS.fraction) : COLORS.paper, stroke: COLORS.ink, width: 1 });
    }
    body += fractionText(width / 2, y + size + 32, filled, total, { size: 16 });
    return root(width, height, body, { label: cfg.label || 'Grille représentant ' + filled + '/' + total });
  }

  function renderPercentageDoubleLine(config) {
    const cfg = config || {};
    const total = cfg.total == null ? null : num(cfg.total, 100);
    const scale = cfg.scale || 'quarters';
    let step = num(cfg.step, scale === 'quarters' ? 25 : (scale === 'fifths' ? 20 : 10));
    if (scale === 'free' && cfg.step == null) step = 10;
    const maxPercent = num(cfg.maxPercent, 100);
    const topTicks = Array.isArray(cfg.percentTicks) ? cfg.percentTicks : buildTicks(0, maxPercent, step, 21);
    const topLabels = {};
    const bottomLabels = {};
    topTicks.forEach(function (p) {
      topLabels[String(p)] = formatNumber(p) + ' %';
      if (total != null) bottomLabels[String(p)] = formatNumber(total * p / 100);
    });
    const points = [];
    if (cfg.percentage != null) {
      const p = num(cfg.percentage, 0);
      points.push({ value: p, label: formatNumber(p) + ' %', color: cfg.pointColor || COLORS.point });
    }
    return renderDoubleNumberLine({
      width: cfg.width || 720,
      height: cfg.height || 250,
      topLabel: cfg.topLabel || 'Pourcentage',
      bottomLabel: cfg.bottomLabel || (cfg.valueLabel || 'Valeur'),
      label: cfg.label || 'Double droite graduée de pourcentage',
      top: { min: 0, max: maxPercent, step: step, ticks: topTicks, labels: topLabels, points: points, showTickLabels: true },
      bottom: { min: 0, max: total == null ? maxPercent : total * maxPercent / 100, step: total == null ? step : total * step / 100, ticks: topTicks.map(function (p) { return total == null ? p : total * p / 100; }), labels: bottomLabels, showTickLabels: true }
    });
  }

  function renderPercentageBar(config) {
    const cfg = config || {};
    const percentage = clamp(num(cfg.percentage, 50), 0, 100);
    const width = num(cfg.width, 620);
    const height = num(cfg.height, 132);
    const x = 28;
    const y = 34;
    const barW = width - 56;
    const barH = 34;
    let body = '';
    body += rect(x, y, barW, barH, { fill: COLORS.paper, stroke: COLORS.ink, width: 1.4, rx: 3 });
    body += rect(x, y, barW * percentage / 100, barH, { fill: cfg.fill || COLORS.percentage, stroke: 'none', width: 0, rx: 3 });
    body += text(width / 2, 22, formatNumber(percentage) + ' %', { size: 17, weight: 700, fill: COLORS.percentage });
    body += text(x, y + barH + 27, '0 %', { size: 13, anchor: 'start' });
    body += text(x + barW, y + barH + 27, '100 %', { size: 13, anchor: 'end' });
    return root(width, height, body, { label: cfg.label || 'Barre représentant ' + percentage + ' pour cent' });
  }

  function errorSvg(message) {
    return root(520, 90, rect(8, 8, 504, 74, { fill: COLORS.negativeSoft, stroke: COLORS.negative, width: 1.2, rx: 8 }) + text(260, 52, message, { size: 14, fill: COLORS.negative, weight: 700 }), { label: 'Paramètres invalides' });
  }

  function validateDefinition(definition) {
    const def = definition || {};
    if (!def.componentId) return { valid: false, errors: ['componentId est obligatoire.'] };
    if (!def.payload || typeof def.payload !== 'object') return { valid: false, errors: ['payload est obligatoire.'] };
    const errors = [];
    if (def.componentId === 'representation.bead-groups') {
      if (!Array.isArray(def.payload.groups)) errors.push('groups doit être un tableau.');
    } else if (def.componentId === 'representation.number-line') {
      const stepError = validateStep(num(def.payload.step, 1));
      if (stepError) errors.push(stepError);
      if (num(def.payload.max, 10) <= num(def.payload.min, 0)) errors.push('max doit être supérieur à min.');
    } else if (def.componentId === 'representation.double-number-line') {
      ['top', 'bottom'].forEach(function (layerName) {
        const layer = def.payload[layerName] || {};
        const stepError = validateStep(num(layer.step, 1));
        if (stepError) errors.push(layerName + ': ' + stepError);
        if (num(layer.max, 10) <= num(layer.min, 0)) errors.push(layerName + ': max doit être supérieur à min.');
      });
    } else if (def.componentId === 'representation.fraction-strip') {
      const d = integer(def.payload.denominator, 0);
      const n = integer(def.payload.numerator, 0);
      const e = validateInteger(d, 'denominator', 1, 24) || validateInteger(n, 'numerator', 0, d);
      if (e) errors.push(e);
    } else if (def.componentId === 'representation.fraction-grid') {
      const c = integer(def.payload.columns, 0);
      const r = integer(def.payload.rows, 0);
      const f = integer(def.payload.filled, 0);
      const e = validateInteger(c, 'columns', 1, 20) || validateInteger(r, 'rows', 1, 20) || validateInteger(f, 'filled', 0, c * r);
      if (e) errors.push(e);
    } else if (def.componentId === 'representation.percentage-double-line') {
      if (num(def.payload.maxPercent, 100) <= 0) errors.push('maxPercent doit être positif.');
    } else if (def.componentId === 'representation.percentage-bar') {
      const p = num(def.payload.percentage, -1);
      if (p < 0 || p > 100) errors.push('percentage doit être compris entre 0 et 100.');
    } else {
      errors.push('Composant inconnu : ' + def.componentId + '.');
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function render(definition) {
    const check = validateDefinition(definition);
    if (!check.valid) return errorSvg(check.errors.join(' '));
    const id = definition.componentId;
    const payload = definition.payload;
    if (id === 'representation.bead-groups') return renderBeadGroups(payload);
    if (id === 'representation.number-line') return renderNumberLine(payload);
    if (id === 'representation.double-number-line') return renderDoubleNumberLine(payload);
    if (id === 'representation.fraction-strip') return renderFractionStrip(payload);
    if (id === 'representation.fraction-grid') return renderFractionGrid(payload);
    if (id === 'representation.percentage-double-line') return renderPercentageDoubleLine(payload);
    if (id === 'representation.percentage-bar') return renderPercentageBar(payload);
    return errorSvg('Composant non pris en charge.');
  }

  global.MATHSGO_REPRESENTATIONS = Object.freeze({
    version: VERSION,
    colors: COLORS,
    render: render,
    validateDefinition: validateDefinition,
    renderBeadGroups: renderBeadGroups,
    renderNumberLine: renderNumberLine,
    renderDoubleNumberLine: renderDoubleNumberLine,
    renderFractionStrip: renderFractionStrip,
    renderFractionGrid: renderFractionGrid,
    renderPercentageDoubleLine: renderPercentageDoubleLine,
    renderPercentageBar: renderPercentageBar
  });
}(typeof window !== 'undefined' ? window : globalThis));
