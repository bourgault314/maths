import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const index=fs.readFileSync('auto/index.html','utf8');
const manifest=fs.readFileSync('auto/scripts/00-module-manifest.js','utf8');
const modules=fs.readFileSync('auto/scripts/01-modules.js','utf8');
const slideshow=fs.readFileSync('auto/scripts/03-slideshow.js','utf8');

const scriptSources=[...index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match=>match[1]);
const requiredOrder=[
  'scripts/00-module-manifest.js',
  'scripts/01-modules.js',
  'scripts/02-question-engine.js',
  'scripts/core/01-series-contracts.js',
  'scripts/03-slideshow.js',
  'scripts/04-app.js'
];
const sourcePath=source=>source.split('?')[0];
const positions=requiredOrder.map(required=>scriptSources.findIndex(source=>sourcePath(source)===required));

assert.doesNotMatch(index,/noindex|BÊTA ·/,'La version publique ne doit conserver ni noindex ni le marquage bêta.');
assert.doesNotMatch(index,/revision-badge|V1\.25|BÊTA/,'La version publique ne doit afficher aucun badge de version bêta.');
assert.match(index,/data-mathsgo-confidentialite/,'La mention « Sans cookie ni traceur » doit rester directement accessible dans le menu public.');
assert.match(index,/class="segment-btn segment-btn-dnb"/,'Le menu public doit reprendre le bouton DNB de la bêta validée.');
assert.doesNotMatch(index,/scripts\/90-objets-officiels\.js/,'Le transfert public ne doit pas réactiver un ancien moteur absent de la bêta validée.');
assert.ok(positions.every(position=>position>=0),'Un script essentiel des Automatismes manque dans auto/index.html.');
assert.deepEqual(positions,[...positions].sort((left,right)=>left-right),'L’ordre de chargement des scripts essentiels est incorrect.');

const moduleLoader=scriptSources.find(source=>sourcePath(source)==='scripts/01-modules.js');
assert.match(moduleLoader,/\?v=\d{8}-\d+$/,'01-modules.js doit avoir une version de cache dans auto/index.html.');

const context=vm.createContext({});
vm.runInContext(manifest,context,{filename:'auto/scripts/00-module-manifest.js'});
vm.runInContext(modules,context,{filename:'auto/scripts/01-modules.js'});
const domains=vm.runInContext('[...new Set(RAW_MODULES.map(module=>module.domain))].sort()',context);
assert.deepEqual([...domains],['algorithm','data','geometry','numbers'],'Les quatre domaines d’automatismes ne sont pas tous disponibles au démarrage.');
assert.equal(vm.runInContext('RAW_MODULES.length',context),43,'Le catalogue public doit contenir 43 automatismes.');
assert.match(slideshow,/divisibility_rules:\{title:'Critères de divisibilité'/,'Le catalogue des cours doit raccorder les critères de divisibilité.');
for(const binding of ['integer_squares:courseCatalog.squares','solid_recognition:courseCatalog.solids','area:courseCatalog.area_formulas','volume:courseCatalog.volume_formulas']){
  assert.ok(slideshow.includes(binding),`Le cours ${binding.split(':')[0]} n’est pas raccordé au catalogue.`);
}
assert.ok(slideshow.includes("'trigonometry_reasoning'].includes"),'La trigonométrie sans calculatrice n’est pas raccordée au moteur des cours.');
assert.ok(slideshow.includes("'trigonometry_calculation'].includes"),'La trigonométrie avec calculatrice n’est pas raccordée au moteur des cours.');

console.log('Automatismes publics : ordre, cache et catalogue de démarrage validés.');
