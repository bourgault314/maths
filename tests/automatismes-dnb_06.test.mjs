// dnb_06 — Notation scientifique : chaque type tiré 250 fois. La réponse
// attendue est recalculée à part, à partir de ce que l'élève lit (le nombre de
// la consigne, l'écriture a × 10ⁿ, les propositions, le calcul), en entiers
// exacts (BigInt) ; la coque accepte la bonne réponse et ses écritures justes
// (4,150 ; 4.15 ; -3 tapé avec un tiret) et refuse les erreurs typiques du
// brevet (même valeur mais nombre hors de [1 ; 10[, exposant de signe inversé,
// exposant décalé d'un rang). Avant la refonte : QCM toujours A (type 9) ou B
// (type 10), exposant toujours le même pour chaque type, pavé qui donnait le
// signe de l'exposant.
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
vm.runInContext(read('auto/scripts/modules/numbers/dnb_06.js')+'\nglobalThis.__module=MODULE_DNB_06;',context);
['generate','selection','render'].forEach(name=>vm.runInContext(read(`auto/scripts/modules/numbers/dnb_06/${name}.js`),context));
const engine=context.__engine,mod=context.__module;

// Validation de la coque (même extraction que automatismes-critical-answers).
const slideshowContext=vm.createContext({setupPlaceValueTools:()=>{},placeValueToolHtml:()=>'',equationBuildResolution:()=>({}),equationDetailHtml:()=>'',equationSplatSvg:()=>''});
vm.runInContext(`${read('auto/scripts/shared/interactions/pointer-drag.js')}\n${read('auto/scripts/03-slideshow.js')}\nglobalThis.__make=makeDiapoWindowHtml;globalThis.__keys=keypadContextFor;`,slideshowContext);
const page=slideshowContext.__make([],'interactive');
const validation=page.slice(page.indexOf('function normalizeInteractiveAnswer'),page.indexOf('function rawInteractiveResponse'));
const checkContext=vm.createContext({});
vm.runInContext(`let interactiveValues=[];let selectedOptions=new Set();\n${validation}\nglobalThis.__check=(spec,values)=>{interactiveValues=values.map(String);return interactiveAnswerIsCorrect(spec);};`,checkContext);
const accepts=(instance,typed)=>checkContext.__check({kind:'slots',layout:typed.length>1?'inline':'entry',acceptedCombinations:instance.answerChoices.length?[instance.answerChoices.map(choice=>String(choice[0]))]:[instance.answers]},typed);

// ── Nombres exacts : valeur = m × 10^p (m entier BigInt sans zéro final) ──
const clean=text=>String(text).replace(/<[^>]+>/g,'').replace(/[\s  ]/g,'').replace('−','-').replace(',','.');
function exact(text){
  const s=clean(text);
  const negative=s.startsWith('-');
  const [i,f='']=s.replace('-','').split('.');
  let m=BigInt((i+f).replace(/^0+(?=\d)/,'')||'0'),p=-f.length;
  if(m===0n) return {m:0n,p:0};
  while(m%10n===0n){m/=10n;p++;}
  return {m:negative?-m:m,p};
}
const times10=(x,n)=>({m:x.m,p:x.p+n});
const same=(x,y)=>x.m===y.m&&x.p===y.p;
function sum(list){
  const p=Math.min(...list.map(x=>x.p));
  let m=list.reduce((total,x)=>total+x.m*10n**BigInt(x.p-p),0n);
  if(m===0n) return {m:0n,p:0};
  let q=p;while(m%10n===0n){m/=10n;q++;}
  return {m,q,p:q};
}
const digitsOf=x=>(x.m<0n?-x.m:x.m).toString();
// Exposant de la notation scientifique : 10^n ≤ |x| < 10^(n+1).
const orderOf=x=>digitsOf(x).length-1+x.p;
// Écriture française d'un nombre exact (sans espaces).
function fr(x){
  const d=digitsOf(x),p=x.p;
  if(p>=0) return d+'0'.repeat(p);
  const k=d.length+p;
  return k>0?d.slice(0,k)+','+d.slice(k):'0,'+'0'.repeat(-k)+d;
}
const mantissaOf=x=>{const d=digitsOf(x);return d[0]+(d.length>1?','+d.slice(1):'');};
function readScientific(html){
  const match=String(html).replace(/<\/?strong>/g,'').match(/([0-9][0-9  ,]*) × 10<sup>([−-]?\d+)<\/sup>/);
  assert.ok(match,'écriture a × 10ⁿ illisible : '+html);
  return {a:exact(match[1]),n:Number(match[2].replace('−','-')),text:match[1]};
}
const isScientific=({a})=>{const v=Number(fr(a).replace(',','.'));return v>=1&&v<10;};
const plain=html=>String(html).replace(/<[^>]+>/g,' ').replace(/[  ]/g,' ').replace(/\s+/g,' ').trim();
// Texte lu, exposants collés : « 4,5 × 10−3 ».
const flat=html=>String(html).replace(/<[^>]+>/g,'').replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ').trim();

function contract(instance,where){
  assert.ok(instance.correctionSteps.length>=1&&instance.correctionSteps.length<=3,'correction de 1 à 3 lignes — '+where);
  assert.ok(instance.aideSteps.length>=1&&instance.aideSteps.length<=2,'aide de 1 ou 2 indices — '+where);
  const texts=[instance.scientific.prompt,...instance.correctionSteps,instance.correctionNote,...instance.aideSteps,...Object.values(instance.distractorFeedback||{}),...(instance.scientific.options||[]).map(o=>o.html)].join(' ');
  assert.doesNotMatch(texts,/undefined|NaN|\[object|\{,\}/,where);
  assert.doesNotMatch(texts.replace(/<[^>]+>/g,''),/ [?:!;]/,'espace simple avant un signe — '+where);
  assert.doesNotMatch(texts.replace(/<[^>]+>/g,''),/(^|[\s(=])-\d|\^/,'trait d’union au lieu du signe moins, ou ^ brut — '+where);
  assert.doesNotMatch(texts,/dernier chiffre|grand nombre|petit nombre/,where);
  assert.doesNotMatch(instance.aideSteps.join(' '),/<strong>/,'l’aide donne la réponse — '+where);
}

const kinds=new Map(mod.questions.map(q=>[q.n,q.options.scientific_kind]));
for(const question of mod.questions){
  const kind=question.options.scientific_kind;
  test(`dnb_06 type ${question.n} (${kind}) : 250 tirages justes`,()=>{
    const answers=new Set(),exponents=new Set(),positions=[0,0,0,0];
    let signTraps=0;
    for(let draw=1;draw<=250;draw++){
      engine.setSeed(draw*7919%233280);
      const instance=engine.makeInstance(mod,question);
      const data=instance.scientific;
      const where=`type ${question.n}, tirage ${draw} : ${plain(data.prompt)}`;
      contract(instance,where);
      const lastStep=flat(instance.correctionSteps[instance.correctionSteps.length-1]);
      const aide=flat(instance.aideSteps.join(' '));

      if(kind==='to_scientific'||kind==='context'){
        const N=exact(data.prompt.match(/notation scientifique de ([0-9  ,]+)\./)[1]);
        const e=orderOf(N),M=mantissaOf(N);
        const range=question.options.exponents;
        if(range) assert.ok(e>=range[0]&&e<=range[1],'exposant hors du palier — '+where);
        assert.deepEqual(Array.from(instance.answers,String),[M,(e<0?'−':'')+Math.abs(e)],where);
        if(e>0) assert.equal(N.p>=0,true,'un grand nombre est entier — '+where);
        assert.ok(lastStep.includes(M+' × 10'+(e<0?'−':'')+Math.abs(e)),'la correction ne conclut pas — '+where);
        assert.ok(!aide.includes(M+' × 10'+(e<0?'−':'')+Math.abs(e)),'l’aide donne la réponse — '+where);
        // Saisies acceptées.
        assert.ok(accepts(instance,[M,String(e)]),'bonne réponse refusée — '+where);
        assert.ok(accepts(instance,[M.includes(',')?M+'0':M+',0',(e<0?'−':'')+Math.abs(e)]),'zéro final refusé — '+where);
        assert.ok(accepts(instance,[M.replace(',','.'),String(e)]),'point refusé — '+where);
        // Erreurs typiques refusées : même valeur, nombre hors de [1 ; 10[ ;
        // signe inversé ; exposant décalé d'un rang.
        const d=digitsOf(N);
        const wrong=[[d.length>1?d[0]+d[1]+(d.length>2?','+d.slice(2):''):d+'0',String(e-1)],['0,'+d,String(e+1)],[M,String(-e)],[M,String(e+1)],[M,String(e-1)]];
        wrong.forEach(w=>assert.ok(!accepts(instance,w),`${w.join(' ; ')} accepté — `+where));
        answers.add(M+'|'+e);exponents.add(e);
        if(kind==='context') assert.match(data.prompt,/<br>Donne la notation scientifique de /,where);
      }else if(kind==='from_scientific'){
        const {a,n,text}=readScientific(data.prompt);
        assert.ok(isScientific({a}),where);
        const N=times10(a,n);
        const range=question.options.exponents;
        assert.ok(n>=range[0]&&n<=range[1]&&n!==0,where);
        assert.equal(fr(exact(instance.answers[0])),fr(N),'réponse attendue fausse — '+where);
        assert.ok(lastStep.includes(flat(instance.answers[0])),'la correction ne conclut pas — '+where);
        assert.ok(!(' '+aide+' ').includes(' '+flat(instance.answers[0])+' '),'l’aide donne la réponse — '+where);
        assert.ok(accepts(instance,[fr(N)]),'bonne réponse sans espace refusée — '+where);
        if(N.p<0) assert.ok(accepts(instance,[fr(N)+'0']),'zéro final refusé — '+where);
        [times10(N,1),times10(N,-1),times10(a,-n)].forEach(w=>assert.ok(!accepts(instance,[fr(w)]),`${fr(w)} accepté — `+where));
        assert.ok(instance.aideHtml.includes('<svg'),'tableau de glissement absent de l’aide — '+where);
        answers.add(fr(N));exponents.add(n);void text;
      }else if(kind==='choose_qcm'){
        const N=exact(data.prompt.match(/notation scientifique de ([0-9  ,]+)/)[1]);
        const options=Array.from(data.options,option=>readScientific(option.html));
        assert.equal(new Set(data.options.map(o=>o.html)).size,4,'propositions en double — '+where);
        const right=options.map((o,i)=>isScientific(o)&&same(times10(o.a,o.n),N)?i+1:0).filter(Boolean);
        assert.deepEqual(right,[data.correctIndex],'une seule bonne proposition — '+where);
        assert.ok(options.some(o=>!isScientific(o)&&same(times10(o.a,o.n),N)),'piège « même valeur, hors de [1 ; 10[ » absent — '+where);
        if(options.some(o=>isScientific(o)&&o.n===-orderOf(N)&&o.n!==orderOf(N))) signTraps++;
        positions[data.correctIndex-1]++;
        for(let i=1;i<=4;i++) if(i!==data.correctIndex) assert.ok(instance.distractorFeedback[String(i)],'piège sans phrase — '+where);
        const html=engine.renderQuestion(instance,true,'with');
        const marks=[...html.matchAll(/<div class="opt( correct)?"/g)].map(match=>!!match[1]);
        assert.deepEqual(marks,[1,2,3,4].map(i=>i===data.correctIndex),where);
        assert.ok(lastStep.includes('réponse '+String.fromCharCode(64+data.correctIndex)),where);
        answers.add(fr(N));exponents.add(orderOf(N));
      }else if(kind==='recognize_qcm'){
        const options=Array.from(data.options,option=>readScientific(option.html));
        const right=options.map((o,i)=>isScientific(o)?i+1:0).filter(Boolean);
        assert.deepEqual(right,[data.correctIndex],'une seule notation scientifique — '+where);
        positions[data.correctIndex-1]++;
        for(let i=1;i<=4;i++) if(i!==data.correctIndex) assert.ok(instance.distractorFeedback[String(i)],'piège sans phrase — '+where);
        assert.ok(lastStep.includes('réponse '+String.fromCharCode(64+data.correctIndex)),where);
        exponents.add(options[data.correctIndex-1].n);
        answers.add(data.options[data.correctIndex-1].html);
      }else if(kind==='complete_power'){
        const parts=data.footer.match(/^\$\$(.+?)\\,=\\,(.+?)\\,\\times/);
        const N=exact(parts[1].replace(/\\,/g,'')),M=exact(parts[2]);
        const e=orderOf(N);
        assert.ok(same(times10(M,e),N),where);
        assert.ok(e!==0&&e>=-4&&e<=6,where);
        assert.deepEqual(Array.from(instance.answers,String),[(e<0?'−':'')+Math.abs(e)],where);
        assert.ok(accepts(instance,[String(e)]),where);
        [-e,e+1,e-1].forEach(w=>assert.ok(!accepts(instance,[String(w)]),`${w} accepté — `+where));
        assert.ok(!aide.includes('10'+(e<0?'−':'')+Math.abs(e)),'l’aide donne la réponse — '+where);
        answers.add(fr(N));exponents.add(e);
      }else if(kind==='power_of_ten'){
        const expression=data.prompt.split('B = ')[1];
        let e=0;
        expression.split(' × ').forEach(factor=>{
          const power=factor.match(/^(10|100)<sup>([−-]?\d+)<\/sup>$/);
          if(power) e+=(power[1]==='100'?2:1)*Number(power[2].replace('−','-'));
          else{const x=exact(factor);assert.equal(digitsOf(x),'1',where);e+=x.p;}
        });
        assert.ok(e!==0&&e!==1,where);
        assert.deepEqual(Array.from(instance.answers,String),[(e<0?'−':'')+Math.abs(e)],where);
        assert.ok(accepts(instance,[String(e)]),where);
        [-e,e+1,e-1].forEach(w=>assert.ok(!accepts(instance,[String(w)]),`${w} accepté — `+where));
        const product=expression.match(/^10<sup>(\d+)<\/sup> × 10<sup>(\d+)<\/sup>$/);
        if(product) assert.ok(!accepts(instance,[String(Number(product[1])*Number(product[2]))]),'10ᵃ × 10ᵇ = 10^(a×b) accepté — '+where);
        assert.ok(lastStep.includes('B = 10'+(e<0?'−':'')+Math.abs(e)),where);
        answers.add(expression);exponents.add(e);
      }else if(kind==='power_calc'){
        const expression=data.prompt.replace(/<\/?span[^>]*>/g,'').replace(/\u00a0/g,' ').split('B = ')[1];
        const terms=expression.replace(/ ([+−]) /g,'|$1').split('|');
        const values=terms.map((term,index)=>{
          const sign=index&&term[0]==='−'?-1n:1n;
          const body=index?term.slice(1):term;
          const [left,right]=body.split(' × ');
          const n=right==='10'?1:Number(right.match(/<sup>([−-]?\d+)<\/sup>/)[1].replace('−','-'));
          const x=times10(exact(left),n);
          return {m:sign*x.m,p:x.p};
        });
        const B=sum(values);
        assert.ok(B.m>0n,where);
        assert.equal(fr(exact(instance.answers[0])),fr(B),'réponse attendue fausse — '+where);
        assert.ok(accepts(instance,[fr(B)]),where);
        assert.ok(accepts(instance,[fr(B)+(B.p<0?'0':',0')]),'zéro final refusé — '+where);
        [times10(B,1),times10(B,-1)].forEach(w=>assert.ok(!accepts(instance,[fr(w)]),where));
        assert.ok(lastStep.includes(flat(instance.answers[0])),where);
        answers.add(fr(B));
      }
    }
    const minimum={to_scientific:150,context:14,from_scientific:150,choose_qcm:150,recognize_qcm:150,complete_power:150,power_of_ten:20,power_calc:150}[kind];
    assert.ok(answers.size>=minimum,`réponses trop peu variées : ${answers.size}`);
    if(question.options.exponents){
      const [lo,hi]=question.options.exponents;
      assert.equal(exponents.size,hi-lo+1-(lo<=0&&hi>=0?1:0),'tous les exposants du palier sortent');
    }
    if(kind==='choose_qcm'||kind==='recognize_qcm') positions.forEach((count,i)=>assert.ok(count>=40,`bonne réponse en ${String.fromCharCode(65+i)} : ${count} fois sur 250`));
    if(kind==='choose_qcm') assert.ok(signTraps>=150&&signTraps<=240,'piège « signe inversé » : '+signTraps);
    if(kind==='recognize_qcm') assert.ok([...exponents].some(e=>e<0)&&[...exponents].some(e=>e>0),'la bonne réponse a un exposant positif ou négatif');
  });
}

test('dnb_06 : filtres de niveau (puissances de 10 en 3e) et tirage par familles',()=>{
  const allowed=level=>[...mod.questions].filter(q=>engine.eligible(mod,q,level)).map(q=>q.n);
  assert.deepEqual(allowed('4e'),[1,2,3,4,5,6,7,8,9,10,11,12,13]);
  assert.deepEqual(allowed('DNB'),Array.from(mod.questions,q=>q.n));
  assert.deepEqual(allowed('3e'),Array.from(mod.questions,q=>q.n));
  const selection=registry.get('dnb_06').selection;
  const family=q=>selection.familyForQuestion(q);
  for(const [level,count] of [['DNB',11],['4e',9]]){
    const questions=mod.questions.filter(q=>engine.eligible(mod,q,level));
    const seen={grand:new Set(),petit:new Set(),inverse:new Set()};
    for(let round=0;round<4;round++){
      engine.setSeed(42+round);
      const cycle=selection.selectQuestions({module:mod,questions,count,shuffle:engine.shuffle,draw:(key,pool,n,build)=>build().slice(0,n)});
      assert.equal(cycle.length,count);
      const tally=family=>cycle.filter(q=>selection.familyForQuestion(q)===family).length;
      assert.equal(tally('grand'),2);assert.equal(tally('petit'),2);assert.equal(tally('inverse'),1);
      cycle.forEach((q,i)=>{if(i) assert.notEqual(family(q),family(cycle[i-1]),'deux questions de suite de la même famille');});
      cycle.forEach(q=>{const f=family(q);if(seen[f]) seen[f].add(q.n);});
    }
    assert.equal(seen.grand.size,4,'les 4 paliers de grands nombres tournent');
    assert.equal(seen.petit.size,3,'les 3 paliers de petits nombres tournent');
    assert.equal(seen.inverse.size,2,'les deux sens de l’exposant reviennent à tour de rôle');
  }
});

test('dnb_06 : le pavé montre toujours « , » et « − » (rangée constante), saisie de −3 au tiret',()=>{
  assert.deepEqual([...mod.keypad.context],[',','−']);
  assert.deepEqual([...slideshowContext.__keys({module:mod})],[',','−']);
  // L'exposant négatif tapé au tiret du clavier ou au signe moins du pavé.
  const instance=(()=>{engine.setSeed(5);return engine.makeInstance(mod,mod.questions.find(q=>q.n===3));})();
  const [M,e]=instance.answers;
  assert.ok(accepts(instance,[M,e]));
  assert.ok(accepts(instance,[M,e.replace('−','-')]));
  assert.ok(accepts(instance,[M,e.replace('−','–')]));
  assert.ok(!accepts(instance,[M,e.replace('−','')]));
});
void kinds;
