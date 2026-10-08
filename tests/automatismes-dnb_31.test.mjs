// dnb_31 — Médiane et étendue : chaque type tiré 250 fois. La réponse attendue
// est recalculée à part à partir de ce que l'élève lit (série, tableau,
// diagramme) ; la médiane n'est jamais la valeur écrite au milieu (avant la
// refonte : toujours la dernière valeur écrite, ou le lundi) ; la coque accepte
// la bonne réponse (aussi 1,90 pour 1,9, 17,0 pour 17) et refuse les erreurs
// typiques (valeur écrite au milieu, moyenne, milieu des extrêmes, nombre de
// valeurs au lieu de l'étendue).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=path=>fs.readFileSync(path,'utf8');
const registry=new Map();
const context={console,RAW_MODULES:[],placeValueToolHtml:()=>'',document:{getElementById:()=>({value:'with'}),createElement:()=>({})},
  MATHSGO_MODULE_RUNTIME:{register(id,parts){registry.set(id,{...(registry.get(id)||{}),...parts});},get(id){return registry.get(id);}}};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(read('auto/scripts/02-question-engine.js')+`
function shuffledCopy(arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
globalThis.__engine={makeInstance,renderQuestion,setSeed:seed=>{rngSeed=seed;},eligible:questionEligibleForLevel,shuffle:shuffledCopy};`,context);
vm.runInContext(read('auto/scripts/modules/data/dnb_31.js')+'\nglobalThis.__module=MODULE_DNB_31;',context);
['generate','selection','render'].forEach(name=>vm.runInContext(read(`auto/scripts/modules/data/dnb_31/${name}.js`),context));
const engine=context.__engine,mod=context.__module;

// Validation de la coque (même extraction que automatismes-critical-answers).
const slideshowContext=vm.createContext({setupPlaceValueTools:()=>{},placeValueToolHtml:()=>'',equationBuildResolution:()=>({}),equationDetailHtml:()=>'',equationSplatSvg:()=>''});
vm.runInContext(`${read('auto/scripts/shared/interactions/pointer-drag.js')}\n${read('auto/scripts/03-slideshow.js')}\nglobalThis.__make=makeDiapoWindowHtml;`,slideshowContext);
const page=slideshowContext.__make([],'interactive');
const validation=page.slice(page.indexOf('function normalizeInteractiveAnswer'),page.indexOf('function rawInteractiveResponse'));
const checkContext=vm.createContext({});
vm.runInContext(`let interactiveValues=[];let selectedOptions=new Set();\n${validation}\nglobalThis.__check=(spec,values)=>{interactiveValues=values.map(String);return interactiveAnswerIsCorrect(spec);};`,checkContext);
const accepts=(answer,typed)=>checkContext.__check({kind:'slots',layout:'entry',acceptedCombinations:[[String(answer)]]},[typed]);

const plain=html=>String(html).replace(/<[^>]+>/g,' ').replace(/[  ]/g,' ').replace(/\s+/g,' ').trim();
const value=text=>Number(String(text).replace(/\s*°C$/,'').replace('−','-').replace(',','.'));
const fr=x=>{const r=Math.round(x*100)/100;return (r<0?'−':'')+String(Math.abs(r)).replace('.',',');};
const sortedOf=list=>list.slice().sort((a,b)=>a-b);
const middleOf=list=>{const up=sortedOf(list),n=up.length;return n%2?up[(n-1)/2]:(up[n/2-1]+up[n/2])/2;};

// Les valeurs telles que l'élève les lit, dans l'ordre d'écriture.
function written(instance){
  const data=instance.median;
  if(data.table) return data.table.cells.map(value);
  if(data.kind==='effectifs') return data.notes.flatMap((note,i)=>Array(data.counts[i]).fill(note));
  return data.texts.map(value);
}
function expected(instance){
  const values=written(instance);
  if(instance.median.kind==='etendue') return Math.round((Math.max(...values)-Math.min(...values))*100)/100;
  return middleOf(values);
}

for(const question of mod.questions){
  const kind=question.options.median_kind;
  test(`dnb_31 type ${question.n} (${kind}) : 250 tirages justes`,()=>{
    const answers=new Set(),positions=new Set(),sizes=new Set();
    for(let draw=1;draw<=250;draw++){
      engine.setSeed(draw*7919%233280);
      const instance=engine.makeInstance(mod,question);
      const data=instance.median,values=written(instance),answer=expected(instance);
      const where=`type ${question.n}, tirage ${draw} : ${plain(instance.rawStatement)}`;
      sizes.add(values.length);
      // Champs du contrat : correction 1 à 3 lignes, aide 1 ou 2 indices sans la réponse.
      assert.ok(instance.correctionSteps.length>=1&&instance.correctionSteps.length<=3,where);
      assert.ok(instance.aideSteps.length>=1&&instance.aideSteps.length<=2,where);
      const aide=instance.aideSteps.join(' ');
      assert.doesNotMatch(aide,/Médiane =|Étendue = \d|<strong>/,'l’aide donne la réponse — '+where);
      const texts=[instance.rawStatement,data.lead,data.ask,...instance.correctionSteps,...instance.aideSteps,...Object.values(instance.distractorFeedback||{})].join(' ');
      assert.doesNotMatch(plain(texts),/undefined|NaN|\[object/,where);
      // Espace insécable avant « ? », « : » et « ; » (jamais un signe seul en début de ligne).
      assert.doesNotMatch(texts.replace(/<[^>]+>/g,''),/ [?:!;]/,'espace simple avant un signe — '+where);
      // La dernière ligne de correction aboutit à la réponse.
      assert.ok(plain(instance.correctionSteps[instance.correctionSteps.length-1]).includes(fr(answer)),'la correction ne conclut pas — '+where);
      if(data.kind==='effectifs'){
        const total=data.counts.reduce((a,b)=>a+b,0);
        assert.ok(total%2===1&&total>=11&&total<=27,where);
      }else if(kind!=='etendue'){
        if(kind==='paire') assert.ok(values.length===4||values.length===6,where);
        else assert.ok(values.length%2===1&&values.length>=5&&values.length<=11,'jamais un nombre pair de valeurs au brevet — '+where);
      }
      if(['serie','relatifs','tableau','qcm'].includes(kind)){
        const mid=values[(values.length-1)/2];
        assert.notEqual(mid,answer,'la médiane est écrite au milieu — '+where);
        const up=sortedOf(values);
        assert.ok(values.some((v,i)=>v!==up[i]),'série déjà rangée — '+where);
        values.forEach((v,i)=>{if(v===answer) positions.add(i);});
      }
      if(kind==='relatifs') assert.ok(values.filter(v=>v<0).length>=2,where);
      if(kind==='rangee'){
        assert.deepEqual(values,sortedOf(values),'série « déjà rangée » pas rangée — '+where);
        assert.ok(values.length===9||values.length===11,where);
      }
      if(Array.isArray(data.options)){
        const options=data.options.map(option=>value(option.html));
        assert.equal(new Set(options).size,4,'propositions en double — '+where);
        const right=[...options].map((v,i)=>Math.abs(v-answer)<1e-9?i+1:0).filter(Boolean);
        assert.deepEqual(right,[data.correctIndex],'une seule bonne proposition — '+where);
        assert.equal(String(instance.answers[0]),String(data.correctIndex),where);
        const html=engine.renderQuestion(instance,true,'with');
        const marks=[...html.matchAll(/<div class="opt( correct)?"/g)].map(match=>!!match[1]);
        assert.deepEqual(marks,[1,2,3,4].map(i=>i===data.correctIndex),where);
        for(let i=1;i<=4;i++) if(i!==data.correctIndex) assert.ok(instance.distractorFeedback[String(i)],'piège sans phrase — '+where);
        const mean=values.reduce((a,b)=>a+b,0)/values.length,up=sortedOf(values);
        assert.ok(options.some(v=>Math.abs(v-mean)<1e-9),'piège « moyenne » absent — '+where);
        assert.ok(options.some(v=>Math.abs(v-(up[0]+up[4])/2)<1e-9),'piège « milieu des extrêmes » absent — '+where);
        assert.ok(options.includes(values[2]),'piège « écrite au milieu » absent — '+where);
        answers.add(answer);
        continue;
      }
      // Réponse courte : la coque accepte la réponse et ses écritures justes…
      assert.equal(value(instance.answers[0]),answer,'réponse attendue fausse — '+where);
      const typed=fr(answer);
      assert.ok(accepts(instance.answers[0],typed),`${typed} refusé — `+where);
      assert.ok(accepts(instance.answers[0],Number.isInteger(answer)?typed+',0':typed+'0'),'zéro final refusé — '+where);
      assert.ok(accepts(instance.answers[0],typed.replace('−','-').replace(',','.')),'point ou tiret refusé — '+where);
      // … et refuse les erreurs typiques.
      const wrong=[];
      if(['serie','relatifs','tableau'].includes(kind)) wrong.push(values[(values.length-1)/2],values[values.length-1]);
      if(kind==='paire'){const n=values.length;wrong.push((values[n/2-1]+values[n/2])/2,sortedOf(values)[n/2-1]);}
      if(kind==='rangee') wrong.push(values[(values.length-1)/2-1],values[(values.length+1)/2]);
      if(kind==='etendue') wrong.push(values.length,Math.max(...values)+Math.min(...values));
      if(kind==='effectifs'){
        const mode=data.notes[data.counts.indexOf(Math.max(...data.counts))];
        wrong.push(mode,data.notes[Math.floor((data.notes.length-1)/2)],data.counts.reduce((a,b)=>a+b,0));
      }
      if(kind==='relatifs') wrong.push(-answer);
      wrong.filter(w=>Math.abs(w-answer)>1e-9).forEach(w=>assert.ok(!accepts(instance.answers[0],fr(w)),`${fr(w)} accepté — `+where));
      answers.add(answer);
    }
    const minimum={serie:25,paire:20,rangee:25,tableau:30,qcm:20,etendue:40,relatifs:12,effectifs:10}[kind];
    assert.ok(answers.size>=minimum,`réponses trop peu variées : ${answers.size}`);
    if(['serie','relatifs','tableau','qcm'].includes(kind)) assert.ok(positions.size>=4,'la médiane revient toujours à la même place : '+[...positions]);
  });
}

test('dnb_31 type 2 : séries de 5, 7 et 9 valeurs, avec et sans répétition, parfois sans « ; »',()=>{
  const question=mod.questions.find(q=>q.n===2);
  const sizes=new Set();let repeated=0,spaces=0;
  for(let draw=1;draw<=300;draw++){
    engine.setSeed(draw*104729%233280);
    const data=engine.makeInstance(mod,question).median;
    sizes.add(data.texts.length);
    if(new Set(data.texts).size<data.texts.length) repeated++;
    if(!data.separated) spaces++;
  }
  assert.deepEqual([...sizes].sort(),[5,7,9]);
  assert.ok(repeated>60&&repeated<260,'répétitions : '+repeated);
  assert.ok(spaces>10&&spaces<90,'séries sans « ; » : '+spaces);
});

test('dnb_31 type 13 : médiane nulle ou négative environ une fois sur trois',()=>{
  const question=mod.questions.find(q=>q.n===13);
  let nonPositive=0;
  for(let draw=1;draw<=300;draw++){
    engine.setSeed(draw*104729%233280);
    const instance=engine.makeInstance(mod,question);
    if(value(instance.answers[0])<=0) nonPositive++;
  }
  assert.ok(nonPositive>60&&nonPositive<160,'médianes ≤ 0 : '+nonPositive);
});

test('dnb_31 : filtres de niveau (4e sans étendue ni diagramme, brevet sans nombre pair) et tirage pondéré',()=>{
  const allowed=level=>[...mod.questions].filter(q=>engine.eligible(mod,q,level)).map(q=>q.n);
  assert.deepEqual(allowed('4e'),[2,3,4,6,8,13]);
  assert.deepEqual(allowed('DNB'),[2,4,6,8,11,13,14]);
  assert.deepEqual(allowed('3e'),[2,3,4,6,8,11,13,14]);
  const selection=registry.get('dnb_31').selection;
  engine.setSeed(42);
  const picked=selection.selectQuestions({module:mod,questions:mod.questions,count:10,shuffle:engine.shuffle,draw:(key,pool,count,build)=>build().slice(0,count)});
  assert.equal(picked.length,10);
  assert.equal(picked.filter(q=>q.n===2).length,3);
  picked.forEach((q,i)=>{if(i) assert.notEqual(q.n,picked[i-1].n,'deux fois le même type de suite');});
});

test('dnb_31 : la virgule et le signe moins sont toujours sur le pavé (rangée constante)',()=>{
  assert.deepEqual([...mod.keypad.context],[',','−']);
});
