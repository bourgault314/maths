// dnb_28 — Probabilités : chaque type tiré 200 fois. La réponse attendue est
// recalculée à part, les QCM n'ont qu'une bonne proposition (le type 4 déclarait
// 1/2 et 5/6 justes), une fraction égale non simplifiée est acceptée (4/20) et
// les pièges du brevet sont refusés.
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
globalThis.__engine={makeInstance,renderQuestion,setSeed:seed=>{rngSeed=seed;}};`,context);
vm.runInContext(read('auto/scripts/modules/data/dnb_28.js')+'\nglobalThis.__module=MODULE_DNB_28;',context);
['generate','selection','render'].forEach(name=>vm.runInContext(read(`auto/scripts/modules/data/dnb_28/${name}.js`),context));
const engine=context.__engine,mod=context.__module;

// Validation de la coque (même extraction que automatismes-critical-answers).
const slideshowContext=vm.createContext({setupPlaceValueTools:()=>{},placeValueToolHtml:()=>'',equationBuildResolution:()=>({}),equationDetailHtml:()=>'',equationSplatSvg:()=>''});
vm.runInContext(`${read('auto/scripts/shared/interactions/pointer-drag.js')}\n${read('auto/scripts/03-slideshow.js')}\nglobalThis.__make=makeDiapoWindowHtml;`,slideshowContext);
const page=slideshowContext.__make([],'interactive');
const validation=page.slice(page.indexOf('function normalizeInteractiveAnswer'),page.indexOf('function rawInteractiveResponse'));
const checkContext=vm.createContext({});
vm.runInContext(`let interactiveValues=[];let selectedOptions=new Set();\n${validation}\nglobalThis.__check=(spec,values)=>{interactiveValues=values.map(String);return interactiveAnswerIsCorrect(spec);};`,checkContext);
const fraction=(n,d)=>({kind:'slots',layout:'fraction',acceptedCombinations:[[String(n),String(d)]],fractionPolicy:'equivalent'});

const COLOR={rouge:'rouge',rouges:'rouge',bleu:'bleu',bleue:'bleu',bleus:'bleu',bleues:'bleu',vert:'vert',verte:'vert',verts:'vert',vertes:'vert',jaune:'jaune',jaunes:'jaune',noir:'noir',noire:'noir',noirs:'noir',noires:'noir',blanc:'blanc',blanche:'blanc',blancs:'blanc',blanches:'blanc'};
const plain=html=>String(html).replace(/<[^>]+>/g,' ').replace(/[  ]/g,' ').replace(/\s+/g,' ').trim();
function groups(text){
  const found=[];const pattern=/(\d+) (?:boules?|billes?|jetons?|beignets?) (à l’abricot|à la pomme|à la framboise|au chocolat|à la noix de coco|[a-z]+)/g;let match;
  while((match=pattern.exec(text))) found.push({count:Number(match[1]),what:COLOR[match[2]]||match[2]});
  return found;
}
function favourable(text,faces){
  const all=Array.from({length:faces},(_,index)=>index+1);let match;
  if(/nombre pair/.test(text)) return all.filter(v=>v%2===0);
  if(/nombre impair/.test(text)) return all.filter(v=>v%2===1);
  if((match=text.match(/multiple de (\d+)/))) return all.filter(v=>v%Number(match[1])===0);
  if((match=text.match(/inférieur ou égal à (\d+)/))) return all.filter(v=>v<=Number(match[1]));
  if((match=text.match(/supérieur ou égal à (\d+)/))) return all.filter(v=>v>=Number(match[1]));
  if((match=text.match(/supérieur à (\d+)/))) return all.filter(v=>v>Number(match[1]));
  if((match=text.match(/le nombre (\d+)/))) return [Number(match[1])];
  throw new Error('événement inconnu : '+text);
}
// La probabilité recalculée à partir de ce que l'élève lit (énoncé et dessin).
function expected(instance){
  const kind=instance.probability.kind,text=plain(instance.rawStatement),ask=text.split('Quelle est la probabilité')[1]||'';
  const content=groups(text.split(/On tire|On prend/)[0]),total=content.reduce((s,g)=>s+g.count,0);
  const count=what=>content.filter(g=>what.includes(g.what)).reduce((s,g)=>s+g.count,0);
  let match;
  if(kind==='contraire'){match=ask.match(/ne pas tirer (?:un|une) \S+ ([a-z]+)/);return [total-count([COLOR[match[1]]]),total];}
  if(kind==='impossible-certain'){
    if((match=ask.match(/n’est pas ([a-z]+)/))) return [total-count([COLOR[match[1]]]),total];
    if((match=ask.match(/boule ([a-z]+) ou ([a-z]+)/))) return [count([COLOR[match[1]],COLOR[match[2]]]),total];
  }
  if(['urne','sac-qcm','impossible-certain'].includes(kind)){
    match=ask.match(/(?:un|une) (?:boule|jeton|bille|beignet) (à l’abricot|à la pomme|à la framboise|au chocolat|à la noix de coco|[a-z]+)/);
    return [count([COLOR[match[1]]||match[1]]),total];
  }
  if(kind==='de'||kind==='de-qcm'){const faces=Number(text.match(/dé équilibré à (\d+) faces/)[1]);return [favourable(ask,faces).length,faces];}
  if(kind==='roue'){
    const figure=instance.probability.figure,n=figure.sectors.length;
    if(figure.numbers) return [favourable(ask,n).length,n];
    match=ask.match(/gagner un ([a-z]+)/)||ask.match(/secteur ([a-z]+)/);
    return [figure.sectors.filter(sector=>sector.label===match[1]).length,n];
  }
  if(kind==='cartes'){const n=Number(text.match(/parmi (\d+) cartes/)[1]),d=Number(ask.match(/multiple de (\d+)/)[1]);return [Math.floor(n/d),n];}
  if(kind==='mot'){const letters=instance.probability.figure.letters,letter=ask.match(/la lettre ([A-Z])/)[1];return [letters.filter(value=>value===letter).length,letters.length];}
  if(kind==='piece-de') return [favourable(ask.replace(/«[^»]*»/,''),6).length,12];
  if(kind==='club'){const figure=instance.probability.figure,level=ask.match(/élève de (\Sᵉ)/)[1];return [figure.counts[figure.columns.indexOf(level)],figure.counts.reduce((a,b)=>a+b,0)];}
  throw new Error('type inconnu '+kind);
}
const optionValue=html=>{const match=String(html).match(/\\dfrac\{(\d+)\}\{(\d+)\}/);if(match) return Number(match[1])/Number(match[2]);const whole=String(html).match(/^\$\$(\d+)\$\$$/);return whole?Number(whole[1]):NaN;};

for(const question of mod.questions){
  test(`dnb_28 type ${question.n} (${question.options.probability_kind}) : 200 tirages justes`,()=>{
    const answers=new Set();
    for(let draw=1;draw<=200;draw++){
      engine.setSeed(draw*7919%233280);
      const instance=engine.makeInstance(mod,question);
      const [n,d]=expected(instance),value=n/d,where=`type ${question.n}, tirage ${draw} : ${plain(instance.rawStatement)}`;
      assert.ok(value>=0&&value<=1,where);
      assert.ok(instance.correctionSteps.length>=1&&instance.correctionSteps.length<=3,where);
      assert.ok(instance.aideSteps.length>=1&&instance.aideSteps.length<=2,where);
      const aide=instance.aideSteps.join(' ')+instance.aideHtml;
      assert.ok(!aide.includes(`\\dfrac{${n}}{${d}}`),'l’aide donne la réponse — '+where);
      assert.doesNotMatch(plain([instance.rawStatement,...instance.correctionSteps,...Object.values(instance.distractorFeedback||{})].join(' ')),/undefined|NaN|\b1 (?:boules|jetons|billes|beignets|cartes|faces|secteurs)\b/,where);
      if(Array.isArray(instance.probability.options)){
        const values=instance.probability.options.map(option=>optionValue(option.html));
        const right=values.map((v,index)=>Math.abs(v-value)<1e-9?index+1:0).filter(Boolean);
        assert.deepEqual([...right],[instance.probability.correctIndex],'une seule bonne proposition — '+where);
        assert.equal(String(instance.answers[0]),String(instance.probability.correctIndex),where);
        const html=engine.renderQuestion(instance,true,'with');
        const marks=[...html.matchAll(/<div class="opt( correct)?"/g)].map(match=>!!match[1]);
        assert.deepEqual(marks,[1,2,3,4].map(index=>index===instance.probability.correctIndex),where);
        for(let index=1;index<=4;index++) if(index!==instance.probability.correctIndex) assert.ok(instance.distractorFeedback[String(index)],'piège sans phrase — '+where);
        answers.add(instance.probability.options[instance.probability.correctIndex-1].html);
      }else if(instance.answers.length===2){
        assert.deepEqual([...instance.answers].map(Number),[n,d],where);
        const spec=fraction(n,d);
        assert.ok(checkContext.__check(spec,[n,d]),where);
        assert.ok(checkContext.__check(spec,[2*n,2*d]),'fraction égale non simplifiée refusée — '+where);
        [[d,n],[n,d-n],[d-n,d],[n+1,d]].forEach(([a,b])=>{
          if(b>0&&Math.abs(a/b-value)>1e-9) assert.ok(!checkContext.__check(spec,[a,b]),`${a}/${b} accepté — `+where);
        });
        answers.add(n+'/'+d);
      }else{
        assert.equal(Number(instance.answers[0]),value,where);
        answers.add(String(value));
      }
    }
    assert.ok(answers.size>=4,'réponses trop peu variées : '+answers.size);
  });
}

test('dnb_28 type 4 : le dé « nombre pair » n’accepte plus 5/6',()=>{
  const question=mod.questions.find(item=>item.n===4);
  let seen=0;
  for(let draw=1;draw<=400&&seen<5;draw++){
    engine.setSeed(draw);
    const instance=engine.makeInstance(mod,question);
    if(!/nombre pair/.test(instance.rawStatement)) continue;
    seen++;
    const values=instance.probability.options.map(option=>optionValue(option.html));
    assert.equal(values[instance.probability.correctIndex-1],1/2);
    assert.equal(values.filter(value=>value===1/2).length,1);
  }
  assert.ok(seen>0);
});

test('dnb_28 type 11 : 4/20, la bonne réponse du sujet 2026, est acceptée non simplifiée',()=>{
  assert.ok(checkContext.__check(fraction(4,20),[4,20]));
  assert.ok(checkContext.__check(fraction(4,20),[1,5]));
  assert.ok(!checkContext.__check(fraction(4,20),[4,16]));
  assert.ok(!checkContext.__check(fraction(4,20),[1,3]));
});
