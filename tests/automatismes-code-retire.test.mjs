// Un ancien lien MG1 qui contient un module retiré des séries (dnb_26b,
// code 28, retiré le 08/10/2026) doit encore s'ouvrir : le module est remplacé
// par dnb_26, et compté une seule fois s'il était déjà dans la série.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const racine = new URL('../', import.meta.url);
const lire = chemin => fs.readFileSync(new URL(chemin, racine), 'utf8');
const bac = vm.createContext({ console, TextEncoder, TextDecoder, atob, btoa, Buffer });
vm.runInContext(lire('auto/scripts/00-module-manifest.js'), bac);
vm.runInContext('var RAW_MODULES=MATHSGO_MODULE_MANIFEST.map(module=>({...module}));var LEVEL_5E_QUESTIONS={};var INTERACTIVE_SERIES_COUNT=10;', bac);
vm.runInContext(lire('auto/scripts/core/01-series-contracts.js'), bac);

function ancienCode(modules) {
  return vm.runInContext(`(()=>{const compact={v:1,g:MATHSGO_GENERATOR_VERSION,l:'3e',q:10,m:${JSON.stringify(modules)},s:1234,a:'with',x:'presentation',b:1};
    const payload=mathsgoBase64UrlEncode(JSON.stringify(compact));return MATHSGO_SERIES_PREFIX+payload+'.'+mathsgoCrc32(payload);})()`, bac);
}

test('un ancien code avec dnb_26b (28) ouvre dnb_26', () => {
  const definition = bac.decodeSeriesDefinition(ancienCode([25, 28]));
  assert.deepEqual([...definition.moduleIds], ['pythagore', 'trigonometrie-sans-calculatrice']);
});

test('dnb_26 et dnb_26b dans le même ancien code : dnb_26 une seule fois', () => {
  const definition = bac.decodeSeriesDefinition(ancienCode([27, 28]));
  assert.deepEqual([...definition.moduleIds], ['trigonometrie-sans-calculatrice']);
});

test('le code 28 n’est réutilisé par aucun module', () => {
  assert.equal(vm.runInContext('MATHSGO_MODULE_BY_CODE.has(28)', bac), false);
});
