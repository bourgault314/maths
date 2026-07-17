/**
 * maths&go Studio — composant réutilisable « barres de fractions et de pourcentages ».
 *
 * Contrat: studio/components/percentage-table/contract.v1.draft.json
 * Principe: cette fonction ne connaît ni les exercices, ni les diapositives,
 * ni le téléphone. Elle reçoit des données et retourne un SVG déterministe.
 */

const PALETTE = Object.freeze({
  50: Object.freeze({ fill: '#fff4c9', strong: '#ffe36d', stroke: '#8a7420' }),
  25: Object.freeze({ fill: '#e5f5e4', strong: '#91d88e', stroke: '#477a45' }),
  20: Object.freeze({ fill: '#e4f0f9', strong: '#8fc8ed', stroke: '#35658c' }),
  10: Object.freeze({ fill: '#fff0df', strong: '#f6b36a', stroke: '#a55f1a' }),
  1: Object.freeze({ fill: '#f1e7fb', strong: '#c3a1e5', stroke: '#72509a' }),
  default: Object.freeze({ fill: '#eef1f7', strong: '#b9cce8', stroke: '#4f6078' })
});

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function formatNumber(value) {
  if (typeof value === 'number') {
    if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
    return String(Number(value.toFixed(6))).replace('.', ',');
  }
  return String(value).replace('.', ',');
}

function numberBetween(value, minimum, maximum, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error(`percentage-table: ${field} doit être compris entre ${minimum} et ${maximum}`);
  }
  return number;
}

function normalizeData(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('percentage-table: les données sont obligatoires');
  }

  const kind = input.kind === 'fraction' ? 'fraction' : 'percent';
  const denominator = numberBetween(
    input.denominator ?? (kind === 'percent' ? 100 / Number(input.percent) : undefined),
    1,
    100,
    'denominator'
  );

  if (!Number.isInteger(denominator)) {
    throw new Error('percentage-table: denominator doit être un entier');
  }

  const numerator = kind === 'fraction'
    ? numberBetween(input.numerator, 0, denominator, 'numerator')
    : 1;

  if (!Number.isInteger(numerator)) {
    throw new Error('percentage-table: numerator doit être un entier');
  }

  const percent = kind === 'fraction'
    ? (100 * numerator) / denominator
    : numberBetween(input.percent, 0, 100, 'percent');

  return Object.freeze({
    kind,
    denominator,
    numerator,
    percent,
    total: input.total ?? null,
    part: input.part ?? null
  });
}

function paletteFor(data) {
  if (data.kind === 'fraction') {
    if (data.denominator === 2) return PALETTE[50];
    if ([4, 8].includes(data.denominator)) return PALETTE[25];
    if (data.denominator === 5) return PALETTE[20];
    return PALETTE.default;
  }
  return PALETTE[data.percent] ?? PALETTE.default;
}

function text(x, y, value, size = 23, weight = 800, fill = '#17283f') {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`;
}

function fractionLabel(x, y, numerator, denominator, total, fill) {
  const middle = y + 8;
  return [
    `<text x="${x - 24}" y="${middle - 10}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="23" font-weight="750" fill="${fill}">${escapeXml(numerator)}</text>`,
    `<line x1="${x - 38}" y1="${middle}" x2="${x - 10}" y2="${middle}" stroke="${fill}" stroke-width="2"/>`,
    `<text x="${x - 24}" y="${middle + 20}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="23" font-weight="750" fill="${fill}">${escapeXml(denominator)}</text>`,
    `<text x="${x + 30}" y="${middle + 5}" text-anchor="start" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="750" fill="${fill}">de ${escapeXml(formatNumber(total))}</text>`
  ].join('');
}

/**
 * Rend un schéma en barres de pourcentage ou de fraction.
 *
 * @param {object} input - données conformes au contrat v1.
 * @param {object} options
 * @param {'question'|'correction'|'help'} options.mode
 * @returns {string} SVG autonome, sans dépendance au DOM.
 */
export function renderPercentageTableSvg(input, options = {}) {
  const data = normalizeData(input);
  const mode = options.mode ?? 'help';
  const correction = mode === 'correction';
  const W = 760;
  const x = 30;
  const width = 700;
  const topY = 18;
  const topH = 96;
  const bottomY = 114;
  const bottomH = 96;
  const cellW = width / data.denominator;
  const H = data.denominator === 100 ? 266 : (data.kind === 'fraction' ? 316 : 230);
  const palette = paletteFor(data);
  let fills = `<rect x="${x}" y="${topY}" width="${width}" height="${topH}" fill="${palette.fill}"/>`;
  let labels = '';

  if (data.kind === 'fraction') {
    labels += text(x + width / 2, topY + topH / 2, formatNumber(data.total), 29, 850);
    for (let index = 0; index < data.denominator; index += 1) {
      const selected = index < data.numerator;
      fills += `<rect x="${x + index * cellW}" y="${bottomY}" width="${cellW}" height="${bottomH}" fill="${selected ? palette.strong : '#fff'}"/>`;
      if (correction && data.part !== null) {
        labels += text(x + (index + 0.5) * cellW, bottomY + bottomH / 2, formatNumber(data.part), Math.max(15, Math.min(23, cellW * 0.24)), 800);
      }
    }
    const x1 = x;
    const x2 = x + cellW * data.numerator;
    const middle = (x1 + x2) / 2;
    const braceY = bottomY + bottomH + 7;
    labels += `<path d="M ${x1} ${braceY} Q ${x1} ${braceY + 13} ${x1 + 15} ${braceY + 13} L ${middle - 11} ${braceY + 13} Q ${middle - 4} ${braceY + 13} ${middle} ${braceY + 22} Q ${middle + 4} ${braceY + 13} ${middle + 11} ${braceY + 13} L ${x2 - 15} ${braceY + 13} Q ${x2} ${braceY + 13} ${x2} ${braceY}" fill="none" stroke="${palette.stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    labels += fractionLabel(middle, braceY + 20, data.numerator, data.denominator, data.total, palette.stroke);
  } else {
    labels += text(x + width / 2, topY + topH / 2, correction ? formatNumber(data.total) : '100 %', 29, 850);
    for (let index = 0; index < data.denominator; index += 1) {
      fills += `<rect x="${x + index * cellW}" y="${bottomY}" width="${cellW}" height="${bottomH}" fill="${index === 0 ? palette.strong : palette.fill}"/>`;
      if (data.denominator <= 10) {
        const label = correction && data.part !== null ? formatNumber(data.part) : `${formatNumber(data.percent)} %`;
        labels += text(x + (index + 0.5) * cellW, bottomY + bottomH / 2, label, data.denominator === 10 ? 16 : Math.max(16, Math.min(23, cellW * 0.21)), 780);
      }
    }
    if (data.denominator === 100) {
      const firstX = x + cellW / 2;
      const guideY = bottomY + bottomH + 25;
      labels += `<path d="M ${firstX} ${bottomY + bottomH} L ${firstX + 25} ${guideY} L ${firstX + 92} ${guideY}" fill="none" stroke="${palette.stroke}" stroke-width="1.8"/>`;
      labels += text(firstX + 180, guideY, correction && data.part !== null ? formatNumber(data.part) : '1 case = 1 %', correction ? 18 : 16, 780, palette.stroke);
    }
  }

  let grid = `<rect x="${x}" y="${topY}" width="${width}" height="${topH + bottomH}" fill="none" stroke="${palette.stroke}" stroke-width="2.2"/><line x1="${x}" y1="${bottomY}" x2="${x + width}" y2="${bottomY}" stroke="${palette.stroke}" stroke-width="2.2"/>`;
  for (let index = 1; index < data.denominator; index += 1) {
    const major = data.denominator === 100 && index % 10 === 0;
    grid += `<line x1="${x + index * cellW}" y1="${bottomY}" x2="${x + index * cellW}" y2="${bottomY + bottomH}" stroke="${palette.stroke}" stroke-width="${data.denominator === 100 ? (major ? 1.8 : 0.65) : 1.35}"/>`;
  }

  const aria = data.kind === 'fraction'
    ? `${data.numerator}/${data.denominator} de ${formatNumber(data.total)}`
    : `${formatNumber(data.percent)} pour cent`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(aria)}">${fills}${grid}${labels}</svg>`;
}

export const percentageTablePresets = Object.freeze([
  Object.freeze({ id: 'demi', label: 'La moitié', data: Object.freeze({ kind: 'fraction', numerator: 1, denominator: 2, total: 24, part: 12 }) }),
  Object.freeze({ id: 'trois-quarts', label: 'Trois quarts', data: Object.freeze({ kind: 'fraction', numerator: 3, denominator: 4, total: 28, part: 7 }) }),
  Object.freeze({ id: 'cinquante', label: '50 %', data: Object.freeze({ kind: 'percent', percent: 50, denominator: 2, total: 80, part: 40 }) }),
  Object.freeze({ id: 'vingt-cinq', label: '25 %', data: Object.freeze({ kind: 'percent', percent: 25, denominator: 4, total: 60, part: 15 }) }),
  Object.freeze({ id: 'dix', label: '10 %', data: Object.freeze({ kind: 'percent', percent: 10, denominator: 10, total: 230, part: 23 }) }),
  Object.freeze({ id: 'un', label: '1 %', data: Object.freeze({ kind: 'percent', percent: 1, denominator: 100, total: 300, part: 3 }) })
]);
