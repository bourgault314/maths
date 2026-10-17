// dnb_26 — Cosinus d’un angle aigu (sans calculatrice) : chaque type tiré 250
// fois. La réponse attendue est recalculée à part à partir de la figure (lettres,
// angle droit, longueurs, angle donné) ; la coque (spécification de saisie et
// validation réelles) accepte les écritures justes (BA pour AB, 6/10 pour 3/5,
// cos60×5 pour 5×cos60) et refuse les erreurs typiques (côté opposé, rapport à
// l’envers, sinus, tangente, × au lieu de ÷). Le sinus et la tangente ne sont
// jamais la bonne réponse. La figure est aux vraies proportions, l’angle droit
// change de sommet, l’aide ne donne jamais la réponse.
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
vm.runInContext(read('auto/scripts/modules/geometry/dnb_26.js')+'\nglobalThis.__module=MODULE_DNB_26;',context);
['generate','selection','render'].forEach(name=>vm.runInContext(read(`auto/scripts/modules/geometry/dnb_26/${name}.js`),context));
const engine=context.__engine,mod=context.__module;

// La coque : spécification de saisie (interactiveSpecForInstance) et validation
// (interactiveAnswerIsCorrect), extraites telles quelles.
const fakeDocument={createElement:()=>({set innerHTML(value){},querySelectorAll:()=>[],querySelector:()=>null})};
const slideshowContext=vm.createContext({document:fakeDocument,setupPlaceValueTools:()=>{},placeValueToolHtml:()=>'',equationBuildResolution:()=>({}),equationDetailHtml:()=>'',equationSplatSvg:()=>''});
vm.runInContext(`${read('auto/scripts/shared/interactions/pointer-drag.js')}\n${read('auto/scripts/03-slideshow.js')}\nglobalThis.__make=makeDiapoWindowHtml;globalThis.__spec=interactiveSpecForInstance;globalThis.__keys=keypadContextFor;`,slideshowContext);
const page=slideshowContext.__make([],'interactive');
const validation=page.slice(page.indexOf('function normalizeInteractiveAnswer'),page.indexOf('function rawInteractiveResponse'));
const checkContext=vm.createContext({});
vm.runInContext(`let interactiveValues=[];let selectedOptions=new Set();\n${validation}\nglobalThis.__check=(spec,values)=>{interactiveValues=values.map(String);return interactiveAnswerIsCorrect(spec);};`,checkContext);
const specOf=instance=>slideshowContext.__spec(instance,'');
const accepts=(spec,values)=>checkContext.__check(spec,values);

const plain=html=>String(html).replace(/<[^>]+>/g,' ').replace(/[  ]/g,' ').replace(/\s+/g,' ').trim();
const flat=html=>String(html).replace(/<[^>]+>/g,'').replace(/[  ]/g,' ').replace(/\s+/g,' ').trim();
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const cmValue=text=>Number(String(text).replace(/\s*cm$/,'').replace(',','.'));
const same=(a,b)=>a.length===b.length&&[...a].sort().join('')===[...b].sort().join('');
const fracHtml=(top,bottom)=>'<span class="frac"><span class="frac-num">'+top+'</span><span class="frac-den">'+bottom+'</span></span>';

// Ce que dit la figure : lettres, côtés écrits, proportions réelles.
function figureFacts(instance){
  const figure=instance.trigData.figure,{R,P,Q}=figure.letters,local=figure.local;
  const dist=(a,b)=>Math.hypot(local[a].x-local[b].x,local[a].y-local[b].y);
  return {R,P,Q,figure,PR:dist('P','R'),QR:dist('Q','R'),PQ:dist('P','Q'),sides:figure.sides||{},angleText:figure.angleText,right:figure.rightMark!==false};
}
// La figure dessinée : contenu dans le cadre, triangle de même forme que les données.
function checkSvg(instance,where){
  const svg=registry.get('dnb_26').generator.figureSvg(instance.trigData.figure,{});
  assert.match(svg,/viewBox="0 0 360 250"/,where);
  const points=svg.match(/<polygon points="([^"]+)"/)[1].split(' ').map(pair=>pair.split(',').map(Number));
  points.flat().forEach(value=>assert.ok(Number.isFinite(value),'point non fini — '+where));
  for(const match of svg.matchAll(/<text x="([-0-9.]+)" y="([-0-9.]+)"[^>]*font-size="([0-9.]+)"[^>]*>([^<]*)<\/text>/g)){
    const width=[...String(match[4])].reduce((sum,c)=>sum+(/[0-9]/.test(c)?.556:c==='m'?.889:/[A-Z]/.test(c)?.722:/[\s\u00a0,.]/.test(c)?.278:c==='°'?.4:.556),0);
    const x=Number(match[1]),y=Number(match[2]),size=Number(match[3]),half=width*size/2;
    assert.ok(x-half>=0&&x+half<=360&&y-size/2>=0&&y+size/2<=250,`étiquette « ${match[4]} » hors du cadre — `+where);
  }
  const [r,p,qq]=points,side=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const facts=figureFacts(instance);
  // Même rapport que les données (rotation et symétrie conservent les longueurs).
  assert.ok(Math.abs(side(p,r)/side(p,qq)-facts.PR/facts.PQ)<.01,'figure aux mauvaises proportions — '+where);
  if(facts.right){
    const v1=[p[0]-r[0],p[1]-r[1]],v2=[qq[0]-r[0],qq[1]-r[1]];
    assert.ok(Math.abs(v1[0]*v2[0]+v1[1]*v2[1])/(side(p,r)*side(qq,r))<.01,'angle droit mal dessiné — '+where);
    assert.ok(side(p,qq)>side(p,r)&&side(p,qq)>side(qq,r),'l’hypoténuse n’est pas le plus long côté — '+where);
  }
  const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]);
  const aspect=(Math.max(...xs)-Math.min(...xs))/(Math.max(...ys)-Math.min(...ys));
  assert.ok(aspect>=.79&&aspect<=2.51,'figure écrasée ('+aspect.toFixed(2)+') — '+where);
  return svg;
}

const kinds={};
for(const question of mod.questions) kinds[question.options.trig_kind]=question;

for(const question of mod.questions){
  const kind=question.options.trig_kind;
  test(`dnb_26 type ${question.n} (${kind}) : 250 tirages justes`,()=>{
    const answers=new Set(),rights=new Set(),letters=new Set(),correctPlaces=new Set();
    for(let draw=1;draw<=250;draw++){
      engine.setSeed(draw*7919%233280);
      const instance=engine.makeInstance(mod,question);
      const data=instance.trigData,facts=figureFacts(instance),{R,P,Q}=facts;
      const where=`type ${question.n}, tirage ${draw} : ${plain(instance.rawStatement)}`;
      rights.add(R+'/'+P);letters.add([R,P,Q].sort().join(''));
      checkSvg(instance,where);
      // Champs du contrat : correction 1 à 3 lignes, aide 1 ou 2 indices.
      assert.ok(instance.correctionSteps.length>=1&&instance.correctionSteps.length<=3,where);
      assert.ok(instance.aideSteps.length>=1&&instance.aideSteps.length<=2,where);
      const texts=[instance.rawStatement,...instance.correctionSteps,instance.correctionNote,...instance.aideSteps,...Object.values(instance.distractorFeedback||{}),...(data.qcm?data.qcm.options.map(option=>option.html):[])].join(' ');
      assert.doesNotMatch(plain(texts),/undefined|NaN|\[object|Infinity/,where);
      assert.doesNotMatch(texts.replace(/<[^>]+>/g,''),/ [?:!;]/,'espace simple avant un signe — '+where);
      assert.doesNotMatch(plain(texts),/\b(sin|tan)\s*=/,where);
      // L’angle est nommé par trois lettres, son sommet au milieu.
      if(data.triangle&&data.triangle.angle) assert.equal(data.triangle.angle[1],P,where);
      const aide=instance.aideSteps.join(' ')+' '+(instance.aideHtml||'');
      if(data.qcm){
        const qcm=data.qcm;
        assert.equal(String(instance.answers[0]),String(qcm.correctIndex),where);
        assert.equal(qcm.options.filter(option=>option.correct).length,1,'une seule bonne proposition — '+where);
        assert.equal(new Set(qcm.options.map(option=>flat(option.html))).size,qcm.options.length,'propositions en double — '+where);
        for(let i=1;i<=qcm.options.length;i++) if(i!==qcm.correctIndex) assert.ok(instance.distractorFeedback[String(i)],'piège sans phrase — '+where);
        const html=engine.renderQuestion(instance,true,'with');
        const marks=[...html.matchAll(/<div class="opt( correct)?"/g)].map(match=>!!match[1]);
        assert.deepEqual(marks,[...qcm.options].map((_,index)=>index+1===qcm.correctIndex),where);
        const last=plain(instance.correctionSteps[instance.correctionSteps.length-1]);
        assert.match(last,new RegExp('[Rr]éponse '+String.fromCharCode(64+qcm.correctIndex)+'\\.$'),'la correction ne conclut pas — '+where);
        correctPlaces.add(qcm.correctIndex);
        const right=qcm.options.find(option=>option.correct).html;
        if(kind==='choose-ratio'){
          assert.equal(right,fracHtml(P+R,P+Q),where);
          answers.add(flat(right));
        }else if(kind==='cosine-value-choice'){
          const a=cmValue(facts.sides.PR),h=cmValue(facts.sides.PQ),o=Math.round(Math.sqrt(h*h-a*a));
          const g=gcd(a,h);
          assert.equal(right,fracHtml(a/g,h/g),where);
          const values=qcm.options.map(option=>{const m=option.html.match(/frac-num">(\d+)<.*frac-den">(\d+)</);return Number(m[1])/Number(m[2]);});
          assert.equal(new Set(values.map(v=>v.toFixed(6))).size,4,'valeurs en double — '+where);
          [o/h,h/a,o/a].forEach(trap=>assert.ok(values.some(v=>Math.abs(v-trap)<1e-9),'piège absent — '+where));
          assert.doesNotMatch(aide,new RegExp(a/g+'\\s*/\\s*'+h/g),'l’aide donne la réponse — '+where);
          answers.add(a/g+'/'+h/g);
        }else if(kind==='length-calculation-choice'){
          const multiply=facts.sides.PR==='?';
          const length=cmValue(multiply?facts.sides.PQ:facts.sides.PR),degrees=Number(facts.angleText.replace('°',''));
          assert.equal(flat(right),length+' '+(multiply?'×':'÷')+' cos('+degrees+'°)',where);
          assert.ok(Math.abs(Math.atan(facts.QR/facts.PR)*180/Math.PI-degrees)<1e-6,'angle mal dessiné — '+where);
          answers.add(flat(right));
        }else if(kind==='choose-tool'){
          const known=Object.values(facts.sides).filter(text=>text&&text!=='?').length;
          const expected=!facts.right?'aucun des trois':(facts.angleText&&facts.figure.arc?'le cosinus':(known===2?'le théorème de Pythagore':'le cosinus'));
          assert.equal(flat(right),expected,where);
          answers.add(expected);
        }else if(kind==='critical'){
          assert.match(flat(right),/^Non : /,where);
          answers.add(data.situation);
        }
        continue;
      }
      // Réponse courte : spécification et validation de la coque.
      const spec=specOf(instance);
      assert.equal(spec.kind,'slots',where);
      if(kind==='name-side'){
        const askHyp=/hypoténuse/.test(instance.rawStatement);
        const expected=askHyp?P+Q:P+R;
        assert.ok(same(instance.answers[0],expected),where);
        assert.equal(spec.slots.length,1,where);
        [expected,expected[1]+expected[0]].forEach(typed=>assert.ok(accepts(spec,[typed]),`${typed} refusé — `+where));
        [P+Q,P+R,Q+R].filter(side=>!same(side,expected)).forEach(typed=>assert.ok(!accepts(spec,[typed]),`${typed} accepté — `+where));
        assert.deepEqual([...slideshowContext.__keys(instance)],[R,P,Q].sort(),where);
        assert.doesNotMatch(aide,new RegExp('\\['+expected+'\\]|\\['+expected[1]+expected[0]+'\\]'),'l’aide donne la réponse — '+where);
        answers.add(expected);
      }else if(kind==='write-cosine'){
        assert.equal(spec.slots.length,2,where);
        for(const top of [P+R,R+P]) for(const bottom of [P+Q,Q+P]) assert.ok(accepts(spec,[top,bottom]),`${top}/${bottom} refusé — `+where);
        [[P+Q,P+R],[Q+R,P+Q],[Q+R,P+R],[P+R,Q+R],[P+Q,Q+R]].forEach(([top,bottom])=>assert.ok(!accepts(spec,[top,bottom]),`${top}/${bottom} accepté — `+where));
        assert.deepEqual([...slideshowContext.__keys(instance)],[R,P,Q].sort(),where);
        assert.doesNotMatch(aide,new RegExp('frac-num">(<[^>]+>)?('+P+R+'|'+R+P+')'),'l’aide donne la réponse — '+where);
        answers.add(P+R+'/'+P+Q);
      }else if(kind==='cosine-value'){
        const a=cmValue(facts.sides.PR),h=cmValue(facts.sides.PQ),o=Math.round(Math.sqrt(h*h-a*a)),g=gcd(a,h);
        assert.equal(spec.layout,'fraction',where);
        assert.equal(instance.answers[0],(a/g)+'/'+(h/g),where);
        [[a/g,h/g],[a,h],[2*a,2*h],[10*a/g,10*h/g]].forEach(([top,bottom])=>assert.ok(accepts(spec,[String(top),String(bottom)]),`${top}/${bottom} refusé — `+where));
        const decimal=a/h;
        if(Math.round(decimal*100)===decimal*100) assert.ok(accepts(spec,[String(decimal).replace('.',','),'1']),'valeur décimale refusée — '+where);
        [[o,h],[h,a],[o,a],[a,o],[h-a,h]].filter(([top,bottom])=>Math.abs(top/bottom-a/h)>1e-9).forEach(([top,bottom])=>assert.ok(!accepts(spec,[String(top),String(bottom)]),`${top}/${bottom} accepté — `+where));
        assert.doesNotMatch(aide,new RegExp('frac-num">'+(a/g)+'<'),'l’aide donne la réponse — '+where);
        assert.ok(Math.abs(facts.PR/facts.PQ-a/h)<1e-9,'figure fausse — '+where);
        answers.add(a/g+'/'+h/g);
      }else if(kind==='length-calculation'){
        const multiply=facts.sides.PR==='?';
        const length=cmValue(multiply?facts.sides.PQ:facts.sides.PR),degrees=Number(facts.angleText.replace('°',''));
        assert.equal(instance.answers[0],length+' '+(multiply?'×':'÷')+' cos('+degrees+'°)',where);
        assert.equal(spec.slots.length,1,where);
        assert.ok(Math.abs(Math.atan(facts.QR/facts.PR)*180/Math.PI-degrees)<1e-6,'angle mal dessiné — '+where);
        const good=multiply?[length+'×cos'+degrees,'cos'+degrees+'×'+length,length+'cos'+degrees,length+' × cos '+degrees]:[length+'÷cos'+degrees,length+'/cos'+degrees];
        const bad=multiply?[length+'÷cos'+degrees,'cos'+degrees+'÷'+length,length+'×'+degrees,length+'×sin'+degrees]:[length+'×cos'+degrees,'cos'+degrees+'÷'+length,'cos'+degrees+'×'+length,length+'÷sin'+degrees,length+'÷'+degrees];
        good.forEach(typed=>assert.ok(accepts(spec,[typed]),`${typed} refusé — `+where));
        bad.forEach(typed=>assert.ok(!accepts(spec,[typed]),`${typed} accepté — `+where));
        assert.deepEqual([...slideshowContext.__keys(instance)],['×','÷','cos'],where);
        assert.doesNotMatch(plain(aide),new RegExp(length+' [×÷] cos'),'l’aide donne la réponse — '+where);
        answers.add(instance.answers[0]);
      }
      // La dernière ligne de correction conclut sur la réponse.
      const last=plain(instance.correctionSteps[instance.correctionSteps.length-1]);
      if(kind==='length-calculation') assert.ok(last.endsWith(plain(instance.answers[0])),'la correction ne conclut pas — '+where);
    }
    const minimum={'name-side':12,'write-cosine':25,'choose-ratio':25,'cosine-value':6,'cosine-value-choice':6,'length-calculation':80,'length-calculation-choice':80,'choose-tool':3,'critical':4}[kind];
    assert.ok(answers.size>=minimum,`réponses trop peu variées : ${answers.size}`);
    assert.ok(letters.size>=8,'jeux de lettres trop peu variés : '+letters.size);
    if(!['choose-tool','critical'].includes(kind)) assert.ok(rights.size>=20,'angle droit et angle étudié trop peu variés : '+rights.size);
    if(kinds[kind]&&['choose-ratio','cosine-value-choice','length-calculation-choice','choose-tool'].includes(kind)) assert.deepEqual([...correctPlaces].sort(),[1,2,3,4],'la bonne réponse ne change pas de place');
  });
}

test('dnb_26 : le sinus et la tangente ne sont jamais la bonne réponse',()=>{
  for(const question of mod.questions){
    for(let draw=1;draw<=120;draw++){
      engine.setSeed(draw*104729%233280);
      const instance=engine.makeInstance(mod,question);
      const right=instance.trigData.qcm?instance.trigData.qcm.options.find(option=>option.correct).html:instance.answers.join(' ');
      assert.doesNotMatch(plain(right),/\b(sin|tan)\(|tangente|(^|\s)le sinus/,`type ${question.n}`);
    }
  }
});

test('dnb_26 : valeur du cosinus à simplifier (6/10 → 3/5) et triangle 3-4-5 le plus fréquent',()=>{
  const question=kinds['cosine-value'];
  let simplifiable=0,small=0,third=0;
  for(let draw=1;draw<=300;draw++){
    engine.setSeed(draw*104729%233280);
    const instance=engine.makeInstance(mod,question),sides=instance.trigData.figure.sides;
    const a=cmValue(sides.PR),h=cmValue(sides.PQ);
    if(gcd(a,h)>1) simplifiable++;
    if(h%5===0) small++;
    if(sides.QR) third++;
  }
  assert.ok(simplifiable>90,'fractions à simplifier : '+simplifiable);
  assert.ok(small>150,'triangles 3-4-5 : '+small);
  assert.ok(third>100&&third<200,'troisième longueur écrite : '+third);
});

test('dnb_26 : calcul d’une longueur, on multiplie environ deux fois sur trois, on divise sinon',()=>{
  const question=kinds['length-calculation'];
  let multiply=0;
  for(let draw=1;draw<=300;draw++){
    engine.setSeed(draw*104729%233280);
    if(engine.makeInstance(mod,question).answers[0].includes('×')) multiply++;
  }
  assert.ok(multiply>160&&multiply<240,'multiplications : '+multiply);
});

test('dnb_26 : niveaux (4e, 3e, brevet), tirage pondéré et pavé',()=>{
  const allowed=level=>[...mod.questions].filter(q=>engine.eligible(mod,q,level)).map(q=>q.n);
  const all=[...mod.questions].map(q=>q.n);
  assert.deepEqual(allowed('4e'),all);
  assert.deepEqual(allowed('DNB'),all);
  assert.deepEqual([...mod.level_tags],['4e','3e','DNB']);
  const selection=registry.get('dnb_26').selection;
  engine.setSeed(42);
  const picked=selection.selectQuestions({module:mod,questions:mod.questions,count:13,shuffle:engine.shuffle,draw:(key,pool,count,build)=>build().slice(0,count)});
  assert.equal(picked.length,13);
  assert.equal(picked.filter(q=>q.n===13).length,3);
  picked.forEach((q,i)=>{if(i) assert.notEqual(q.n,picked[i-1].n,'deux fois le même type de suite');});
  // Sur 300 cycles, jamais deux fois le même type de suite (même en fin de cycle).
  for(let seed=1;seed<=300;seed++){
    engine.setSeed(seed*7919%233280);
    const cycle=selection.selectQuestions({module:mod,questions:mod.questions,count:13,shuffle:engine.shuffle,draw:(key,pool,count,build)=>build().slice(0,count)});
    assert.equal(cycle.length,13);
    cycle.forEach((q,i)=>{if(i) assert.notEqual(q.n,cycle[i-1].n,'cycle '+seed+' : deux fois le type '+q.n+' de suite');});
  }
  assert.deepEqual([...mod.keypad.context],['×','÷','cos']);
});

test('dnb_26b sort des séries : absent du catalogue, fichiers gardés',()=>{
  const manifest=read('auto/scripts/00-module-manifest.js');
  assert.doesNotMatch(manifest,/id:'dnb_26b'/);
  assert.ok(fs.existsSync('auto/scripts/modules/geometry/dnb_26b.js'));
  assert.ok(fs.existsSync('auto/scripts/shared/pedagogy/geometry/dnb_26b.js'));
});
