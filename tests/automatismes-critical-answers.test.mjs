import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const engineSource=fs.readFileSync('auto/scripts/02-question-engine.js','utf8');
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

  const slideshowSource=fs.readFileSync('auto/scripts/03-slideshow.js','utf8');
  const slideshowContext=vm.createContext({
    setupPlaceValueTools:()=>{},
    placeValueToolHtml:()=>'',
    equationBuildResolution:()=>({}),
    equationDetailHtml:()=>'',
    equationSplatSvg:()=>''
  });
  vm.runInContext(`${slideshowSource}\nglobalThis.__makeDiapoWindowHtml=makeDiapoWindowHtml;`,slideshowContext);
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
