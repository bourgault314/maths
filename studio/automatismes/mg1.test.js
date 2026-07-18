/*
 * Tests de la passerelle MG1 du nouveau menu (bêta).
 *
 * Principe : l'application actuelle (auto/) est l'oracle. On charge son
 * véritable encodeur dans un bac à sable, on charge le nouvel encodeur dans
 * un autre, et on vérifie :
 *   1. que les deux produisent des codes MG1 identiques octet par octet ;
 *   2. que l'application actuelle sait décoder (en mode strict) les codes
 *      fabriqués par le nouveau menu ;
 *   3. que le catalogue de la bêta est la copie conforme des données de
 *      l'application (registre MG1, manifeste, groupes du menu, filtre 5e).
 * Si l'application actuelle évolue, ces tests échouent : c'est le signal
 * qu'il faut mettre à jour la bêta.
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RACINE = path.join(__dirname, '..', '..');
const lire = fichier => fs.readFileSync(path.join(RACINE, fichier), 'utf8');

const SOURCE_CONTRATS = lire('auto/scripts/core/01-series-contracts.js');
const SOURCE_MANIFESTE = lire('auto/scripts/00-module-manifest.js');
const SOURCE_MOTEUR = lire('auto/scripts/02-question-engine.js');
const SOURCE_DIAPORAMA = lire('auto/scripts/03-slideshow.js');

function extraire(source, motif, etiquette) {
  const resultat = source.match(motif);
  assert.ok(resultat, 'Bloc introuvable dans la source : ' + etiquette);
  return resultat[0];
}

const BLOC_5E = extraire(SOURCE_MOTEUR, /const LEVEL_5E_QUESTIONS=\{[\s\S]*?\n\};/, 'LEVEL_5E_QUESTIONS');
const BLOC_DOMAINES = extraire(SOURCE_MOTEUR, /const MODULE_DOMAINS=\[[\s\S]*?\];/, 'MODULE_DOMAINS');
const BLOC_GROUPES = extraire(SOURCE_MOTEUR, /const MODULE_MENU_GROUPS=\{[\s\S]*?\n\};/, 'MODULE_MENU_GROUPS');
const SERIES_INTERACTIVES = Number(
  extraire(SOURCE_DIAPORAMA, /const INTERACTIVE_SERIES_COUNT=\d+;/, 'INTERACTIVE_SERIES_COUNT').match(/\d+/)[0]
);

const LEVEL_5E_QUESTIONS = vm.runInNewContext(BLOC_5E + ';LEVEL_5E_QUESTIONS');
const MODULE_DOMAINS = vm.runInNewContext(BLOC_DOMAINES + ';MODULE_DOMAINS');
const MODULE_MENU_GROUPS = vm.runInNewContext(BLOC_GROUPES + ';MODULE_MENU_GROUPS');

function globalsCommuns() {
  return {
    TextEncoder, TextDecoder,
    btoa: valeur => Buffer.from(valeur, 'binary').toString('base64'),
    atob: valeur => Buffer.from(valeur, 'base64').toString('binary'),
    crypto: require('node:crypto').webcrypto
  };
}

// — Bac à sable de l'application actuelle (l'oracle) —
const bacOracle = vm.createContext(globalsCommuns());
vm.runInContext(SOURCE_MANIFESTE, bacOracle);
vm.runInContext(BLOC_5E, bacOracle);
vm.runInContext('const INTERACTIVE_SERIES_COUNT=' + SERIES_INTERACTIVES + ';', bacOracle);
vm.runInContext('var RAW_MODULES=MATHSGO_MODULE_MANIFEST.map(module=>({...module}));', bacOracle);
vm.runInContext(SOURCE_CONTRATS, bacOracle);
const REGISTRE_ORACLE = vm.runInContext('MATHSGO_MODULE_REGISTRY', bacOracle);
const VERSION_GENERATEUR_ORACLE = vm.runInContext('MATHSGO_GENERATOR_VERSION', bacOracle);
const VERSION_SCHEMA_ORACLE = vm.runInContext('MATHSGO_SCHEMA_VERSION', bacOracle);

function encoderAvecOracle(definition) {
  return vm.runInContext('encodeSeriesDefinition(' + JSON.stringify(definition) + ')', bacOracle);
}
function decoderAvecOracle(code) {
  return vm.runInContext('decodeSeriesDefinition(' + JSON.stringify(code) + ')', bacOracle);
}

// — Bac à sable du nouveau menu —
const bacBeta = vm.createContext(globalsCommuns());
vm.runInContext(fs.readFileSync(path.join(__dirname, 'catalogue.js'), 'utf8'), bacBeta);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'mg1.js'), 'utf8'), bacBeta);
const CATALOGUE = vm.runInContext('MATHSGO_CATALOGUE_AUTOMATISMES', bacBeta);
const MG1 = vm.runInContext('MATHSGO_MG1', bacBeta);

function encoderAvecBeta(serie) {
  return vm.runInContext(
    'MATHSGO_MG1.encoderSerie(' + JSON.stringify(serie) +
    ', new Map(MATHSGO_CATALOGUE_AUTOMATISMES.MODULES.map(m=>[m.id,m.code])))',
    bacBeta
  );
}

const TOUS_LES_IDS = REGISTRE_ORACLE.map(entree => entree.id);

const CAS_DE_TEST = [
  {
    nom: 'une équation en 3e interactif',
    niveau: '3e', questions: 5, aide: 'with', mode: 'interactive', seed: 0,
    ids: ['resoudre-equations']
  },
  {
    nom: 'révision DNB en diaporama sans aide',
    niveau: 'DNB', questions: 20, aide: 'without', mode: 'presentation', seed: 233279,
    ids: ['pythagore', 'thales', 'moyennes', 'notation-scientifique', 'developper-factoriser']
  },
  {
    nom: 'série de 5e avec modules autorisés',
    niveau: '5e', questions: 10, aide: 'with', mode: 'interactive', seed: 4242,
    ids: ['nombres-decimaux-comparer-calculer', 'relatifs-addition-entiers-jetons', 'moyennes']
  },
  {
    nom: 'module tactile réservé au mode interactif',
    niveau: '3e', questions: 15, aide: 'without', mode: 'interactive', seed: 777,
    ids: ['pythagore-tactile', 'pythagore']
  },
  {
    nom: 'tous les automatismes en 3e interactif',
    niveau: '3e', questions: 20, aide: 'with', mode: 'interactive', seed: 1,
    ids: TOUS_LES_IDS
  }
];

for (const cas of CAS_DE_TEST) {
  test('codes identiques à l’application actuelle — ' + cas.nom, () => {
    const codeOracle = encoderAvecOracle({
      schemaVersion: VERSION_SCHEMA_ORACLE,
      generatorVersion: VERSION_GENERATEUR_ORACLE,
      level: cas.niveau,
      questionCount: cas.questions,
      moduleIds: cas.ids,
      seed: cas.seed,
      visualMode: cas.aide,
      experienceMode: cas.mode
    });
    const codeBeta = encoderAvecBeta({
      niveau: cas.niveau,
      nombreDeQuestions: cas.questions,
      idsCanoniques: cas.ids,
      seed: cas.seed,
      aide: cas.aide,
      mode: cas.mode
    });
    assert.equal(codeBeta, codeOracle);
  });

  test('l’application actuelle décode le code de la bêta — ' + cas.nom, () => {
    const decode = decoderAvecOracle(encoderAvecBeta({
      niveau: cas.niveau,
      nombreDeQuestions: cas.questions,
      idsCanoniques: cas.ids,
      seed: cas.seed,
      aide: cas.aide,
      mode: cas.mode
    }));
    assert.equal(decode.level, cas.niveau);
    assert.equal(decode.questionCount, cas.questions);
    assert.equal(decode.seed, cas.seed);
    assert.equal(decode.visualMode, cas.aide);
    assert.equal(decode.experienceMode, cas.mode);
    assert.equal(decode.seriesCount, cas.mode === 'interactive' ? SERIES_INTERACTIVES : 1);
    assert.deepEqual([...decode.moduleIds], [...new Set(cas.ids)].sort());
  });
}

test('le catalogue reprend le registre MG1 à l’identique', () => {
  assert.equal(CATALOGUE.MODULES.length, REGISTRE_ORACLE.length);
  const parId = new Map(CATALOGUE.MODULES.map(module => [module.id, module]));
  for (const entree of REGISTRE_ORACLE) {
    const module = parId.get(entree.id);
    assert.ok(module, 'Module absent du catalogue : ' + entree.id);
    assert.equal(module.idHistorique, entree.legacyId, entree.id);
    assert.equal(module.code, entree.code, entree.id);
  }
});

test('le catalogue reprend le manifeste à l’identique', () => {
  const manifeste = vm.runInContext('MATHSGO_MODULE_MANIFEST', bacOracle);
  assert.equal(CATALOGUE.MODULES.length, manifeste.length);
  const parIdHistorique = new Map(CATALOGUE.MODULES.map(module => [module.idHistorique, module]));
  for (const entree of manifeste) {
    const module = parIdHistorique.get(entree.id);
    assert.ok(module, 'Module absent du catalogue : ' + entree.id);
    assert.equal(module.titre, entree.title, entree.id);
    assert.deepEqual([...module.niveaux], [...entree.level_tags], entree.id);
    assert.equal(module.domaine, entree.domain, entree.id);
    assert.equal(module.interactifSeulement, Boolean(entree.interactive_only), entree.id);
  }
});

// Les objets venant des bacs à sable ont d'autres prototypes que ceux du
// test : on les aplatit en JSON avant toute comparaison profonde.
const plat = valeur => JSON.parse(JSON.stringify(valeur));

test('le catalogue reprend les domaines et groupes du menu à l’identique', () => {
  assert.deepEqual(
    plat(CATALOGUE.DOMAINES.map(domaine => ({ id: domaine.id, title: domaine.titre }))),
    plat(MODULE_DOMAINS.map(domaine => ({ id: domaine.id, title: domaine.title })))
  );
  assert.deepEqual(Object.keys(CATALOGUE.SOUS_GROUPES), Object.keys(MODULE_MENU_GROUPS));
  for (const domaine of Object.keys(MODULE_MENU_GROUPS)) {
    assert.deepEqual(
      plat(CATALOGUE.SOUS_GROUPES[domaine].map(groupe => ({ id: groupe.id, title: groupe.titre, moduleIds: [...groupe.modules] }))),
      plat(MODULE_MENU_GROUPS[domaine].map(groupe => ({ id: groupe.id, title: groupe.title, moduleIds: [...groupe.moduleIds] }))),
      domaine
    );
  }
  const groupes = Object.values(CATALOGUE.SOUS_GROUPES).flat().flatMap(groupe => [...groupe.modules]);
  assert.deepEqual(
    plat(groupes).sort(),
    plat(CATALOGUE.MODULES.map(module => module.idHistorique)).sort(),
    'Chaque module doit appartenir à exactement un sous-groupe du menu.'
  );
});

test('le filtre de 5e reprend LEVEL_5E_QUESTIONS à l’identique', () => {
  assert.deepEqual([...CATALOGUE.MODULES_5E].sort(), Object.keys(LEVEL_5E_QUESTIONS).sort());
});

test('les constantes de version sont alignées sur l’application actuelle', () => {
  assert.equal(MG1.VERSION_SCHEMA, VERSION_SCHEMA_ORACLE);
  assert.equal(MG1.VERSION_GENERATEUR, VERSION_GENERATEUR_ORACLE);
  assert.equal(MG1.SERIES_INTERACTIVES, SERIES_INTERACTIVES);
});
