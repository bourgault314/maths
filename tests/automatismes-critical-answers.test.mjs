import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const engineSource=fs.readFileSync('auto/scripts/02-question-engine.js','utf8');
const slideshowSource=fs.readFileSync('auto/scripts/03-slideshow.js','utf8');
const appSource=fs.readFileSync('auto/scripts/04-app.js','utf8');
const setupSource=fs.readFileSync('auto/index.html','utf8');
const pointerDragSource=fs.readFileSync('auto/scripts/shared/interactions/pointer-drag.js','utf8');
const solidSource=fs.readFileSync('auto/scripts/shared/visuals/geometry/solid.js','utf8');
const engineCore=engineSource.slice(0,engineSource.indexOf('function subVars'));
const volumeModule=fs.readFileSync('auto/scripts/modules/geometry/dnb_23.js','utf8');
const relationsModule=fs.readFileSync('auto/scripts/modules/numbers/dnb_09.js','utf8');
const engineContext=vm.createContext({console});

vm.runInContext(`${engineCore}\n${volumeModule}\n${relationsModule}\n
globalThis.__answer=(module,number,scope)=>parseAnswer(module.questions.find(question=>question.n===number),scope);
globalThis.__volumeModule=MODULE_DNB_23;
globalThis.__relationsModule=MODULE_DNB_09;`,engineContext);

test('les puissances des volumes et le carré utilisent la puissance mathématique',()=>{
  assert.deepEqual([...engineContext.__answer(engineContext.__volumeModule,1,{c:3})],['27']);
  assert.deepEqual([...engineContext.__answer(engineContext.__volumeModule,1,{c:8})],['512']);
  assert.deepEqual([...engineContext.__answer(engineContext.__volumeModule,5,{a:8})],['512']);
  assert.deepEqual([...engineContext.__answer(engineContext.__volumeModule,10,{a:3})],['54']);
  assert.equal(engineContext.__answer(engineContext.__relationsModule,1,{n:6})[5],'36');
});

test('le prisme 71 × 14 produit et accepte 994',()=>{
  assert.deepEqual([...engineContext.__answer(engineContext.__volumeModule,7,{a:71,h:14})],['994']);

  const slideshowContext=vm.createContext({
    setupPlaceValueTools:()=>{},
    placeValueToolHtml:()=>'',
    equationBuildResolution:()=>({}),
    equationDetailHtml:()=>'',
    equationSplatSvg:()=>''
  });
  vm.runInContext(`${pointerDragSource}\n${slideshowSource}\nglobalThis.__makeDiapoWindowHtml=makeDiapoWindowHtml;`,slideshowContext);
  const html=slideshowContext.__makeDiapoWindowHtml([],'interactive');
  const validationCode=html.slice(
    html.indexOf('function normalizeInteractiveAnswer'),
    html.indexOf('function rawInteractiveResponse')
  );
  const feedbackCode=html.slice(
    html.indexOf('function incorrectInteractiveFeedbackDetail'),
    html.indexOf('function setInteractiveFeedback')
  );
  const interactionContext=vm.createContext({});
  vm.runInContext(`let interactiveValues=['994'];\n${validationCode}\n${feedbackCode}\n
globalThis.__isCorrect=interactiveAnswerIsCorrect;
globalThis.__feedback=incorrectInteractiveFeedbackDetail;`,interactionContext);

  const spec={kind:'slots',acceptedCombinations:[['994']],expectedDisplay:'réponse : 994'};
  assert.equal(interactionContext.__isCorrect(spec),true);
  assert.equal(
    interactionContext.__feedback({rawResponse:['994']},spec),
    'Ta réponse : 994 · Réponse attendue : 994'
  );
});

test('la correction des volumes conserve le même cadre que la question',()=>{
  assert.match(engineSource,/class="volume-response-zone"/);
  assert.match(engineSource,/renderVolumeCalculation\(inst\)/);
  assert.match(slideshowSource,/\.volume-response-zone\{[^}]*min-height:150px/);
  assert.doesNotMatch(slideshowSource,/correction-visible \.volume-visual/);
  assert.doesNotMatch(slideshowSource,/correction-visible \.volume-prompt/);
  assert.match(solidSource,/version:'1\.2\.2'/);
  assert.match(solidSource,/class="solid-dimension-line"/);

  const visualContext={MATHSGO_VISUALS:{register:()=>{}}};
  visualContext.globalThis=visualContext;
  vm.runInNewContext(solidSource,visualContext);
  const prism=visualContext.solidSvg({kind:'prism'});
  const hiddenEdges=prism.match(/<path class="solid-hidden-edges" d="([^"]+)"/);
  assert.ok(hiddenEdges);
  assert.equal(hiddenEdges[1],'M34 160L122 134L170 32M122 134L230 134');
  assert.match(prism,/<line x1="170" y1="32" x2="230" y2="134"/);
  assert.doesNotMatch(hiddenEdges[1],/L170 32L230 134/);
});

test('la fin interactive garde dix séries et tous les retours au menu',()=>{
  assert.match(slideshowSource,/const INTERACTIVE_SERIES_COUNT=10;/);
  assert.match(slideshowSource,/onclick="startNextSeries\(\)">Nouvelle série/);
  assert.match(slideshowSource,/onclick="restartInteractive\(\)">Recommencer/);
  assert.match(slideshowSource,/onclick="returnToMenu\(\)">Retour au menu/);
  assert.match(slideshowSource,/function returnToMenu\(\)/);
  assert.match(slideshowSource,/sessionStorage\.setItem\('mathsgo:auto:return-definition'/);
  assert.match(slideshowSource,/seriesIndex=\(seriesIndex\+1\)%seriesBank\.length/);

  const restartBlock=slideshowSource.slice(
    slideshowSource.indexOf('function restartInteractive()'),
    slideshowSource.indexOf('function startNextSeries()')
  );
  assert.doesNotMatch(restartBlock,/seriesIndex/);
});

test('le retour au menu conserve les réglages sans recycler le tirage initial',()=>{
  const definition={
    schemaVersion:1,
    generatorVersion:'1.17.0',
    level:'3e',
    questionCount:5,
    moduleIds:['criteres-divisibilite'],
    seed:160027,
    visualMode:'with',
    experienceMode:'interactive',
    seriesCount:10
  };
  const storage=new Map([['mathsgo:auto:return-definition',JSON.stringify(definition)]]);
  const seedInput={value:''};
  let restored=null;
  const restoreSource=appSource.slice(
    appSource.indexOf('function restoreSeriesDefinitionAfterReturn()'),
    appSource.indexOf('\n\nupdateGenerateButtonLabel()',appSource.indexOf('function restoreSeriesDefinitionAfterReturn()'))
  );
  const context=vm.createContext({
    sessionStorage:{
      getItem:key=>storage.get(key)||null,
      removeItem:key=>storage.delete(key)
    },
    applySeriesDefinitionToUi:value=>{restored=value;seedInput.value=String(value.seed);},
    document:{getElementById:id=>id==='seed'?seedInput:null}
  });

  vm.runInContext(`${restoreSource}\nglobalThis.__restoreSeriesDefinitionAfterReturn=restoreSeriesDefinitionAfterReturn;`,context);

  assert.equal(context.__restoreSeriesDefinitionAfterReturn(),true);
  assert.equal(JSON.stringify(restored),JSON.stringify(definition));
  assert.equal(seedInput.value,'');
  assert.equal(storage.has('mathsgo:auto:return-definition'),false);
});

test('la préparation propose sans aide par défaut',()=>{
  assert.match(setupSource,/<input type="hidden" id="visualMode" value="without">/);
  assert.match(setupSource,/data-value="without" aria-pressed="true">Sans aide<\/button>/);
  assert.match(setupSource,/id="settingsSummary">3e · 5 questions · Interactif · Sans aide<\/span>/);
});
