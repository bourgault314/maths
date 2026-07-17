import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const index=fs.readFileSync('auto/index.html','utf8');
const manifest=fs.readFileSync('auto/scripts/00-module-manifest.js','utf8');
const modules=fs.readFileSync('auto/scripts/01-modules.js','utf8');

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

console.log('Automatismes publics : ordre, cache et catalogue de démarrage validés.');
