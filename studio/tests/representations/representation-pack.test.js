/* Test contractuel exécutable avec Node :
 * node studio/tests/representations/representation-pack.test.js
 */
global.window = global;
require('../../components/representation-pack-v1.js');
require('../../adapters/automatismes/representation-pack-adapter.js');

const pack = global.MATHSGO_REPRESENTATIONS;
const validCases = [
  { componentId: 'representation.bead-groups', payload: { groups: [{ value: 3 }, { value: -2 }, { value: 0, zeroPairs: 1 }] } },
  { componentId: 'representation.number-line', payload: { min: -5, max: 5, step: 1, points: [{ value: -2 }] } },
  { componentId: 'representation.double-number-line', payload: { top: { min: 0, max: 100, step: 25 }, bottom: { min: 0, max: 240, step: 60 } } },
  { componentId: 'representation.fraction-strip', payload: { numerator: 3, denominator: 4 } },
  { componentId: 'representation.fraction-grid', payload: { filled: 16, columns: 5, rows: 4 } },
  { componentId: 'representation.percentage-double-line', payload: { total: 240, percentage: 75, scale: 'quarters' } },
  { componentId: 'representation.percentage-bar', payload: { percentage: 37.5 } }
];

for (const definition of validCases) {
  const result = pack.validateDefinition(definition);
  if (!result.valid) throw new Error(definition.componentId + ': ' + result.errors.join(' '));
  const svg = pack.render(Object.assign({ version: 1, status: 'review', renderer: 'mathsgo-representation-pack-v1' }, definition));
  if (!svg.startsWith('<svg')) throw new Error(definition.componentId + ': le rendu ne commence pas par SVG.');
}

const invalid = pack.validateDefinition({
  componentId: 'representation.fraction-strip',
  payload: { numerator: 5, denominator: 4 }
});
if (invalid.valid) throw new Error('Un numérateur supérieur au dénominateur doit être refusé.');

const adapterSvg = global.MATHSGO_AUTOMATISMES_REPRESENTATIONS.render(validCases[1]);
if (!adapterSvg.startsWith('<svg')) throw new Error('L’adaptateur Automatismes ne rend pas le composant.');

console.log('OK — ' + validCases.length + ' contrats validés, 1 cas invalide refusé, adaptateur testé.');
