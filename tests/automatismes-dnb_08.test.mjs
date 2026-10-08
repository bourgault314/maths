// dnb_08 — Critères de divisibilité : chaque type tiré 250 fois. La réponse
// attendue est recalculée à part, à partir de ce que l'élève lit (nombre,
// liste, énoncé) ; la coque construit la bonne réponse (choix cochés ou case à
// remplir), accepte toutes les réponses justes et refuse les erreurs typiques.
// Avant la refonte : « Une seule réponse » affiché quand une seule case était
// juste (et impossible d'en cocher deux), gabarits 8, 9 et 10 toujours la même
// réponse, 15 ou 75, 30 ou 60 au premier tirage.
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
vm.runInContext(read('auto/scripts/modules/numbers/dnb_08.js')+'\nglobalThis.__module=MODULE_DNB_08;',context);
['generate','selection','render'].forEach(name=>vm.runInContext(read(`auto/scripts/modules/numbers/dnb_08/${name}.js`),context));
const engine=context.__engine,mod=context.__module;

// Un « document » minimal pour la coque : il lit les choix (.opt) et leur bloc (.options).
function probe(){
  return {
    html:'',
    set innerHTML(value){this.html=String(value);},
    querySelectorAll(selector){
      if(selector!=='.opt') return [];
      return [...this.html.matchAll(/<div class="(opt(?: [^"]*)?)"([^>]*)>([\s\S]*?)<\/div>/g)]
        .map(match=>({
          classList:{contains:name=>match[1].split(/\s+/).includes(name)},
          dataset:{errorCode:(match[2].match(/data-error-code="([^"]*)"/)||[])[1],exclusive:(match[2].match(/data-exclusive="([^"]*)"/)||[])[1]},
          textContent:match[3].replace(/<[^>]+>/g,'')
        }));
    },
    querySelector(selector){
      if(selector!=='.options') return null;
      const match=this.html.match(/<div class="options[^"]*"([^>]*)>/);
      return match?{getAttribute:name=>(match[1].match(new RegExp(name+'="([^"]*)"'))||[])[1]||null}:null;
    }
  };
}
const slideshowContext=vm.createContext({setupPlaceValueTools:()=>{},placeValueToolHtml:()=>'',equationBuildResolution:()=>({}),equationDetailHtml:()=>'',equationSplatSvg:()=>'',document:{createElement:()=>probe()}});
vm.runInContext(`${read('auto/scripts/shared/interactions/pointer-drag.js')}\n${read('auto/scripts/03-slideshow.js')}\nglobalThis.__make=makeDiapoWindowHtml;globalThis.__spec=interactiveSpecForInstance;globalThis.__expected=lotTExpectedHtml;`,slideshowContext);
const page=slideshowContext.__make([],'interactive');
const validation=page.slice(page.indexOf('function normalizeInteractiveAnswer'),page.indexOf('function rawInteractiveResponse'));
const checkContext=vm.createContext({});
vm.runInContext(`let interactiveValues=[];let selectedOptions=new Set();\n${validation}\nglobalThis.__check=(spec,values,chosen)=>{interactiveValues=values.map(String);selectedOptions=new Set(chosen||[]);return interactiveAnswerIsCorrect(spec);};`,checkContext);
const typedOk=(spec,typed)=>checkContext.__check(spec,[String(typed)]);
const tickedOk=(spec,indices)=>checkContext.__check(spec,[],indices);

const plain=html=>String(html).replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/[  ]/g,' ').replace(/\s+/g,' ').trim();
const number=text=>Number(String(text).replace(/[\s  ]/g,''));
const NUM='(\\d{1,3}(?:[\\u202f ]\\d{3})*|\\d+)';
const digitSum=value=>String(value).split('').reduce((sum,digit)=>sum+Number(digit),0);
const properDivisors=value=>{const out=[];for(let d=2;d<value;d++) if(value%d===0) out.push(d);return out;};

function rendered(instance){
  const question=engine.renderQuestion(instance,false,'with');
  const correction=engine.renderQuestion(instance,true,'with');
  const spec=slideshowContext.__spec(instance,correction);
  return {question,correction,spec,text:plain(question)};
}
function optionLabels(html){
  return [...html.matchAll(/<div class="opt(?: [^"]*)?"[^>]*>([\s\S]*?)<\/div>/g)].map(match=>plain(match[1]));
}
function checkContract(instance,where){
  assert.ok(instance.correctionSteps.length>=1&&instance.correctionSteps.length<=3,'correction : 1 à 3 lignes — '+where);
  assert.ok(instance.aideSteps.length>=1&&instance.aideSteps.length<=2,'aide : 1 ou 2 indices — '+where);
  const texts=[instance.rawStatement,instance.rawFooter,...instance.correctionSteps,instance.correctionNote||'',...instance.aideSteps,...Object.values(instance.distractorFeedback||{}),instance.aideHtml||''].join(' ');
  assert.doesNotMatch(plain(texts),/undefined|NaN|\[object|null/,where);
  // Espace insécable avant « ? », « : », « ; » et « ! » (jamais un signe seul en début de ligne).
  assert.doesNotMatch(texts.replace(/<[^>]+>/g,''),/ [?:!;]/,'espace simple avant un signe — '+where);
  assert.doesNotMatch(plain(texts),/dernier chiffre/i,'« chiffre des unités », jamais « dernier chiffre » — '+where);
}
// L'aide ne donne jamais la réponse : ni la somme calculée, ni ✓/✗, ni « Réponse ».
function checkAide(instance,where,forbidden=[]){
  const aide=plain(instance.aideSteps.join(' ')+' '+(instance.aideHtml||''));
  assert.doesNotMatch(aide,/[✓✗]|Réponse|divisible par \d+ seulement/,'l’aide donne la réponse — '+where);
  forbidden.forEach(text=>assert.ok(!new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![0-9]| \\+)').test(aide),`l’aide contient « ${text} » — `+where));
}

const typesByKind=kind=>mod.questions.filter(question=>question.options.divisibility_kind===kind);
const DRAWS=250;
function draws(question,run){
  for(let draw=1;draw<=DRAWS;draw++){
    engine.setSeed((draw*7919+question.n*104729)%233280);
    run(engine.makeInstance(mod,question),`type ${question.n}, tirage ${draw}`);
  }
}

for(const question of typesByKind('select-divisors')){
  test(`dnb_08 type ${question.n} (${question.options.divisibility_profile}) : 250 tirages justes, cases toujours multiples`,()=>{
    const values=new Set(),lengths=new Set();
    draws(question,(instance,where)=>{
      checkContract(instance,where);
      const {question:html,spec,text}=rendered(instance);
      const match=text.match(new RegExp('^Par quels nombres '+NUM+' est-il divisible \\?'));
      assert.ok(match,'énoncé — '+where);
      const value=number(match[1]);
      values.add(value);lengths.add(String(value).length);
      assert.equal(instance.q.options.divisibility_profile,registry.get('dnb_08').generator.profileFor(value),'profil — '+where);
      const labels=optionLabels(html);
      assert.deepEqual(labels,['2','5','10','3','9','Aucun'],'ordre des choix 2 · 5 · 10 / 3 · 9 / Aucun — '+where);
      const expected=labels.map((label,index)=>label!=='Aucun'&&value%Number(label)===0?index:null).filter(index=>index!==null);
      const right=expected.length?expected:[5];
      assert.equal(spec.kind,'qcm',where);
      assert.deepEqual([...spec.correctIndices],right,'bonne réponse — '+where);
      assert.equal(spec.multiple,true,'on peut toujours cocher plusieurs cases (la consigne ne dit pas combien) — '+where);
      assert.equal(spec.answerLabels,true,where);
      assert.deepEqual([...spec.exclusiveIndices],[5],'« Aucun » efface les autres cases — '+where);
      assert.doesNotMatch(plain(slideshowContext.__expected(instance,spec)),/^[A-F](,| et|$)/,'bonne réponse dite en lettres — '+where);
      // Validation : la bonne réponse, et les erreurs typiques refusées.
      assert.ok(tickedOk(spec,right),'bonne réponse refusée — '+where);
      if(value%9===0) assert.ok(!tickedOk(spec,right.filter(index=>labels[index]!=='3')),'9 sans 3 accepté — '+where);
      if(value%10===0) assert.ok(!tickedOk(spec,right.filter(index=>labels[index]!=='10')),'10 oublié accepté — '+where);
      if(value%3===0&&value%9!==0) assert.ok(!tickedOk(spec,[...right,4]),'3 et 9 accepté — '+where);
      if(!expected.length) assert.ok(!tickedOk(spec,[]),'rien coché accepté — '+where);
      else assert.ok(!tickedOk(spec,[...right,5]),'« Aucun » en plus accepté — '+where);
      const last=String(value).slice(-1);
      if(['3','9'].includes(last)&&value%Number(last)!==0) assert.ok(!tickedOk(spec,[...right.filter(index=>index!==5),labels.indexOf(last)]),'piège du chiffre des unités accepté — '+where);
      // Correction : chiffre des unités, somme des chiffres, conclusion avec les nombres.
      const steps=instance.correctionSteps.map(plain);
      assert.match(steps[0],new RegExp('^Chiffre des unités : '+last+' '),where);
      assert.ok(steps[1].includes(`= ${digitSum(value)} →`),'somme des chiffres — '+where);
      const divisors=[2,3,5,9,10].filter(d=>value%d===0);
      if(divisors.length) divisors.forEach(d=>assert.match(steps[2],new RegExp(`\\b${d}\\b`),where));
      else assert.match(steps[2],/n’est divisible par aucun/,where);
      checkAide(instance,where,[`= ${digitSum(value)}`]);
      Object.entries(instance.distractorFeedback).forEach(([key])=>assert.ok(Number(key)>=1&&Number(key)<=6,where));
    });
    assert.ok(values.size>=140,'nombres trop peu variés : '+values.size);
    assert.deepEqual([...lengths].sort(),[3,4,5],'longueurs 3, 4 et 5 chiffres');
  });
}

test('dnb_08 type 23 : cocher les nombres divisibles par 2, 3, 5, 9 ou 10 (0 à 4 bonnes réponses, avec pièges)',()=>{
  const [question]=typesByKind('select-numbers');
  const counts=new Set(),divisors=new Set(),seen=new Set();let traps=0;
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {question:html,spec,text}=rendered(instance);
    const divisor=Number(text.match(/^Coche tous les nombres divisibles par (\d+) ?\./)[1]);
    divisors.add(divisor);
    const labels=optionLabels(html);
    assert.equal(labels.length,5,where);assert.equal(labels[4],'Aucun',where);
    const values=labels.slice(0,4).map(number);
    assert.equal(new Set(values).size,4,'nombres en double — '+where);
    values.forEach(value=>seen.add(value));
    const expected=values.map((value,index)=>value%divisor===0?index:null).filter(index=>index!==null);
    counts.add(expected.length);
    const right=expected.length?expected:[4];
    assert.deepEqual([...spec.correctIndices],right,where);
    assert.equal(spec.multiple,true,where);
    assert.ok(tickedOk(spec,right),where);
    if(expected.length>1) assert.ok(!tickedOk(spec,right.slice(1)),'une bonne réponse oubliée acceptée — '+where);
    const wrong=values.findIndex(value=>value%divisor!==0);
    if(wrong>=0) assert.ok(!tickedOk(spec,[...right.filter(index=>index!==4),wrong]),'intrus accepté — '+where);
    if(instance.correctionNote) traps++;
    checkAide(instance,where,values.filter(v=>![2,5,10].includes(divisor)).map(v=>`= ${digitSum(v)}`));
  });
  assert.deepEqual([...counts].sort(),[0,1,2,3,4]);
  assert.deepEqual([...divisors].sort((a,b)=>a-b),[2,3,5,9,10]);
  assert.ok(traps>200,'pièges trop rares : '+traps);
  assert.ok(seen.size>600,'nombres trop peu variés : '+seen.size);
});

test('dnb_08 type 24 : partage sans reste, oui une fois sur deux environ',()=>{
  const [question]=typesByKind('sharing');
  let yes=0;const values=new Set();
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {spec,text}=rendered(instance);
    const match=text.match(new RegExp(' a '+NUM+' \\w+\\. .*? (?:en|remplir|faire) (\\d+) '));
    assert.ok(match,'énoncé — '+where);
    const N=number(match[1]),d=Number(match[2]);
    values.add(N);
    const ok=N%d===0;if(ok) yes++;
    assert.deepEqual([...spec.correctIndices],[ok?0:1],where);
    assert.equal(spec.multiple,false,where);
    assert.equal(plain(slideshowContext.__expected(instance,spec)),ok?'Oui':'Non','bonne réponse dite « Oui » ou « Non » — '+where);
    assert.ok(tickedOk(spec,[ok?0:1])&&!tickedOk(spec,[ok?1:0]),where);
    assert.match(plain(instance.correctionSteps[2]),ok?/^Oui/:new RegExp(`^Non .* \\+ ${N%d}, il reste ${N%d} `),where);
    checkAide(instance,where,[`= ${digitSum(N)}`]);
  });
  assert.ok(yes>90&&yes<160,'oui : '+yes);
  assert.ok(values.size>200,'nombres trop peu variés : '+values.size);
});

test('dnb_08 type 25 : donner un diviseur autre que 1 et N (toute réponse juste acceptée)',()=>{
  const [question]=typesByKind('give-divisor');
  const values=new Set();
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {spec,text}=rendered(instance);
    const match=text.match(new RegExp('^Donne un diviseur de '+NUM+' autre que 1 et '+NUM+'\\.'));
    assert.ok(match,'énoncé — '+where);
    const N=number(match[1]);values.add(N);
    assert.equal(number(match[2]),N,where);
    assert.ok(N>=100&&N<=999,where);
    const divisors=properDivisors(N);
    assert.ok(divisors.length>=2,where);
    assert.ok(divisors.includes(3)||divisors.includes(5),'un critère donne une réponse — '+where);
    assert.equal(spec.kind,'slots',where);
    divisors.forEach(d=>assert.ok(typedOk(spec,d),`${d} refusé — `+where));
    [1,N,2,10,4,6].filter(w=>!divisors.includes(w)).forEach(w=>assert.ok(!typedOk(spec,w),`${w} accepté — `+where));
    if(N%9!==0) assert.ok(!typedOk(spec,9),'9 accepté — '+where);
    assert.ok(plain(instance.correctionSteps[2]).includes(divisors.join(', ').replace(/, (\d+)$/,' ou $1')),'toutes les réponses justes sont données — '+where);
    checkAide(instance,where,[`= ${digitSum(N)}`]);
  });
  assert.ok(values.size>=80,'nombres trop peu variés : '+values.size);
});

test('dnb_08 type 26 : fabriquer un nombre (chiffre des unités imposé ou deux critères)',()=>{
  const [question]=typesByKind('build-number');
  let pairForm=0;const forms=new Set();
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {spec,text}=rendered(instance);
    let match=text.match(/^Donne un nombre entier à (\d) chiffres, divisible par (\d+), dont le chiffre des unités est (\d)\./);
    let ok;
    if(match){
      const [length,divisor,unit]=match.slice(1).map(Number);
      ok=value=>String(value).length===length&&value%10===unit&&value%divisor===0;
      forms.add(`${length}-${divisor}`);
      // Erreurs typiques : la bonne fin mais une somme hors de la table ; un chiffre de trop ou de moins.
      const start=10**(length-1)+unit;
      const badSum=[...Array(60)].map((_,i)=>start+10*i).find(value=>value%divisor!==0);
      assert.ok(!typedOk(spec,badSum),`${badSum} accepté — `+where);
      const good=[...Array(200)].map((_,i)=>start+10*i).filter(value=>value%divisor===0);
      good.slice(0,3).forEach(value=>assert.ok(typedOk(spec,value),`${value} refusé — `+where));
      assert.ok(!typedOk(spec,Number(String(good[0]).slice(1))),'un chiffre de moins accepté — '+where);
      assert.ok(!typedOk(spec,good[0]-unit+(unit===9?8:unit+1)),'mauvais chiffre des unités accepté — '+where);
    }else{
      match=text.match(/^Donne un nombre entier à (\d) chiffres, divisible par (\d+) et par (\d+)\./);
      assert.ok(match,'énoncé — '+where);
      pairForm++;
      const [length,a,b]=match.slice(1).map(Number);
      forms.add(`${length}-${a}-${b}`);
      ok=value=>String(value).length===length&&value%a===0&&value%b===0;
      const goods=[];for(let v=10**(length-1);v<10**length&&goods.length<4;v++) if(ok(v)) goods.push(v);
      goods.forEach(value=>assert.ok(typedOk(spec,value),`${value} refusé — `+where));
      const onlyA=[...Array(200)].map((_,i)=>10**(length-1)+i).find(v=>v%a===0&&v%b!==0);
      const onlyB=[...Array(200)].map((_,i)=>10**(length-1)+i).find(v=>v%b===0&&v%a!==0);
      assert.ok(!typedOk(spec,onlyA)&&!typedOk(spec,onlyB),'un seul critère respecté accepté — '+where);
    }
    // Les réponses acceptées sont exactement les nombres qui respectent les conditions.
    const accepted=spec.acceptedCombinations.map(combination=>Number(combination[0]));
    accepted.forEach(value=>assert.ok(ok(value),`${value} accepté à tort — `+where));
    let total=0;const length=Number(match[1]);
    for(let v=10**(length-1);v<10**length;v++) if(ok(v)) total++;
    assert.equal(accepted.length,total,'toutes les réponses justes sont acceptées — '+where);
    assert.ok(accepted.length<=1000,where);
  });
  assert.ok(pairForm>50&&pairForm<120,'deux critères : '+pairForm);
  assert.ok(forms.size>=6,'formes : '+[...forms]);
});

test('dnb_08 type 27 : N et P, quatre réponses à parts à peu près égales (DNB 2026 Asie)',()=>{
  const [question]=typesByKind('two-numbers');
  const answers=[0,0,0,0];
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {spec,text}=rendered(instance);
    const match=text.match(new RegExp('divisibilité par (\\d) des nombres : N = '+NUM+' P = '+NUM+' '));
    assert.ok(match,'énoncé — '+where);
    const d=Number(match[1]),n=number(match[2]),p=number(match[3]);
    assert.ok(p>n&&p-n<=9&&n>=1000&&p<=9999,where);
    const index=n%d===0&&p%d===0?0:n%d===0?1:p%d===0?2:3;
    answers[index]++;
    assert.deepEqual([...spec.correctIndices],[index],where);
    assert.equal(spec.multiple,false,where);
    [0,1,2,3].filter(i=>i!==index).forEach(i=>assert.ok(instance.distractorFeedback[String(i+1)],'piège sans phrase — '+where));
    checkAide(instance,where,[`= ${digitSum(n)}`,`= ${digitSum(p)}`]);
  });
  answers.forEach(count=>assert.ok(count>35,'réponses mal réparties : '+answers));
});

test('dnb_08 type 28 : chiffre manquant (toutes les solutions acceptées, les autres refusées)',()=>{
  const [question]=typesByKind('missing-digit');
  let several=0,pair=0;const shapes=new Set();
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {spec,text}=rendered(instance);
    const match=text.match(/place du □ pour que (\d*) ?□ ?(\d*) soit divisible (par \d+(?: et par \d+)?)/);
    assert.ok(match,'énoncé — '+where);
    const divisors=[...match[3].matchAll(/\d+/g)].map(m=>Number(m[0]));
    if(divisors.length>1){pair++;assert.equal(match[2],'','deux critères : le chiffre caché est celui des unités — '+where);}
    assert.ok(match[1].length>=1,'jamais de □ en premier chiffre — '+where);
    shapes.add(match[1]+'□'+match[2]);
    const solutions=[];
    for(let digit=0;digit<=9;digit++){const value=Number(match[1]+digit+match[2]);if(divisors.every(d=>value%d===0)) solutions.push(digit);}
    assert.ok(solutions.length>=1,where);
    if(solutions.length>1){several++;assert.match(text,/^Donne un chiffre/,where);}
    else assert.match(text,/^Quel chiffre/,where);
    for(let digit=0;digit<=9;digit++) assert.equal(typedOk(spec,digit),solutions.includes(digit),`□ = ${digit} — `+where);
    assert.ok(!typedOk(spec,10),where);
    solutions.forEach(digit=>assert.ok(plain(instance.correctionSteps[2]).includes(String(digit)),where));
    checkAide(instance,where,solutions.map(digit=>`□ = ${digit}`));
  });
  assert.ok(several>40,'plusieurs solutions : '+several);
  assert.ok(pair>50&&pair<120,'deux critères : '+pair);
  assert.ok(shapes.size>200,'nombres trop peu variés : '+shapes.size);
});

test('dnb_08 type 29 : les nombres de la liste qui divisent un petit nombre (DNB 2026 série pro)',()=>{
  const [question]=typesByKind('list-divisors');
  const Ns=new Set();let multiples=0;
  draws(question,(instance,where)=>{
    checkContract(instance,where);
    const {question:html,spec,text}=rendered(instance);
    const N=Number(text.match(/qui divisent (\d+) ?\./)[1]);Ns.add(N);
    const values=optionLabels(html).map(Number);
    assert.equal(values.length,9,where);
    assert.deepEqual(values,[...values].sort((a,b)=>a-b),'liste rangée — '+where);
    assert.equal(new Set(values).size,9,where);
    assert.ok(values.includes(1)&&values.includes(N),'1 et N dans la liste — '+where);
    if(values.includes(2*N)) multiples++;
    const expected=values.map((value,index)=>N%value===0?index:null).filter(index=>index!==null);
    assert.ok(expected.length>=4&&expected.length<=6,where);
    assert.ok(values.length-expected.length>=3,where);
    assert.deepEqual([...spec.correctIndices],expected,where);
    assert.equal(spec.multiple,true,where);
    assert.ok(tickedOk(spec,expected),where);
    assert.ok(!tickedOk(spec,expected.filter(index=>values[index]!==1)),'1 oublié accepté — '+where);
    const wrong=values.findIndex(value=>N%value!==0);
    assert.ok(!tickedOk(spec,[...expected,wrong]),where);
    checkAide(instance,where,[`Dans la liste`]);
  });
  assert.ok(Ns.size>=15,'petits nombres : '+Ns.size);
  assert.ok(multiples>60,'piège « multiple » : '+multiples);
});

test('dnb_08 : série de 10 = 2 + 2 + 1 × 6 familles, jamais deux fois la même famille de suite, profils qui tournent',()=>{
  const selection=registry.get('dnb_08').selection;
  const decks=new Map();
  const drawOrder=(key,keys)=>{let deck=decks.get(key);if(!deck||!deck.length){deck=engine.shuffle(keys);decks.set(key,deck);}return deck.shift();};
  const profiles=new Set();
  for(let seed=1;seed<=40;seed++){
    engine.setSeed(seed*977);
    const picked=selection.selectQuestions({module:mod,questions:mod.questions,count:10,shuffle:engine.shuffle,drawOrder,draw:(key,pool,count,build)=>build().slice(0,count)});
    assert.equal(picked.length,10);
    const kinds=picked.map(q=>q.options.divisibility_kind);
    const tally=kinds.reduce((map,kind)=>({...map,[kind]:(map[kind]||0)+1}),{});
    assert.deepEqual(tally,{'select-divisors':2,'give-divisor':2,'select-numbers':1,'sharing':1,'build-number':1,'two-numbers':1,'missing-digit':1,'list-divisors':1});
    kinds.forEach((kind,index)=>{if(index) assert.notEqual(kind,kinds[index-1],'deux fois la même famille de suite');});
    picked.filter(q=>q.options.divisibility_kind==='select-divisors').forEach(q=>profiles.add(q.options.divisibility_profile));
  }
  assert.equal(profiles.size,12,'les 12 profils sortent');
});

test('dnb_08 : tous les types ouverts de la 5e au brevet, pavé sans rangée de contexte (nombres entiers)',()=>{
  ['5e','4e','3e','DNB'].forEach(level=>assert.equal(mod.questions.filter(q=>engine.eligible(mod,q,level)).length,mod.questions.length,level));
  assert.deepEqual([...mod.keypad.context],[]);
  assert.deepEqual([...mod.questions.map(q=>q.n)],[11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29]);
});
