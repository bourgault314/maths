let rngSeed=1, quiz=[],lastPythagorasVertexSetIndex=-1;
function setSeed(s){
  const value=Number.isFinite(Number(s))?Math.trunc(Number(s)):1;
  rngSeed=((value%233280)+233280)%233280;
  lastPythagorasVertexSetIndex=-1;
  return rngSeed;
}
function rnd(){ rngSeed=(rngSeed*9301+49297)%233280; return rngSeed/233280; }
function RD(a,b,excluded){ let min,max; if(b===undefined){min=0;max=a;} else {min=a;max=b;} let v, tries=0; do{v=Math.floor(rnd()*(max-min+1))+min; tries++;}while(Array.isArray(excluded)&&excluded.includes(v)&&tries<200); return v; }
function pick(arr){ return arr[Math.floor(rnd()*arr.length)]; }
function setNB(n){ return n; }
function GCD(a,b){ a=Math.abs(Math.trunc(a)); b=Math.abs(Math.trunc(b)); while(b){ const t=b; b=a%b; a=t; } return a||1; }
function CUT(x,d){ return Number(Number(x).toFixed(d===undefined?2:d)); }
const MATHS = {floor:Math.floor, ceil:Math.ceil, round:Math.round, sin:Math.sin, cos:Math.cos, tan:Math.tan, atan2:Math.atan2, sqrt:Math.sqrt, abs:Math.abs, pi:Math.PI, PI:Math.PI};
function cleanEvalExpr(expr){ return String(expr).replace(/(\d),(\d)/g,'$1.$2').replace(/\^/g,'**'); }
function evalInScope(expr, scope){
  expr=cleanEvalExpr(expr);
  const target=Object.assign({}, MATHS, {RD,setNB,GCD,CUT}, scope||{});
  const proxy=new Proxy(target,{has:()=>true, get:(t,k)=> k in t ? t[k] : undefined, set:(t,k,v)=>(t[k]=v,true)});
  try{ return Function('scope','with(scope){ return ('+expr+'); }')(proxy); }catch(e){ return expr; }
}
function runCode(code){
  const target=Object.assign({}, MATHS, {RD,setNB,GCD,CUT});
  const proxy=new Proxy(target,{has:()=>true, get:(t,k)=> k in t ? t[k] : undefined, set:(t,k,v)=>(t[k]=v,true)});
  try{ Function('scope','with(scope){ '+code+' }')(proxy); }catch(e){ target.__error=e.message; }
  return target;
}
function fmt(x){ if(typeof x==='number'){ if(Math.abs(x-Math.round(x))<1e-9) return String(Math.round(x)).replace('.',','); return String(Number(x.toFixed(6))).replace('.',','); } return String(x).replace('.',','); }
function resolveAnswerExpression(expression,scope){
  const value=evalInScope(expression,scope);
  return fmt(expandGeneratedValue(value,scope));
}
function parseAnswerChoices(q,scope){
  let arr=[];try{arr=JSON.parse(q.answer||'[]');}catch(e){arr=[];}
  return arr.map(answer=>String(answer).split(';').map(choice=>resolveAnswerExpression(choice.trim(),scope)));
}
function parseAnswer(q,scope){
  return parseAnswerChoices(q,scope).map(choices=>choices[0]||'');
}
function expandGeneratedValue(value, scope){
  if(typeof value!=='string') return fmt(value);
  return value.replace(/\{([A-Za-z_]\w*)\}/g,(m,name)=>
    Object.prototype.hasOwnProperty.call(scope||{},name) ? fmt(scope[name]) : m
  );
}
function subVars(str, scope){
  return String(str||'')
    .replace(/\$\{([^}]+)\}/g,(m,e)=>expandGeneratedValue(evalInScope(e,scope),scope))
    .replace(/\{\{([^{}]+)\}\}/g,(m,e)=>fmt(evalInScope(e,scope)));
}
function isWithoutVisuals(mode){ return mode==='without'||mode==='without-reveal'; }
function visualPlaceholder(mode){ return mode==='without-reveal'?'<div class="visual-placeholder"></div>':''; }
function stripVisuals(html,keepPlaceholder=false){
  const replacement=keepPlaceholder?'<div class="visual-placeholder"></div>':'';
  return String(html||'')
    .replace(/<svg[\s\S]*?<\/svg>/gi,replacement)
    .replace(/<div(?![^>]*visual-placeholder)[^>]*>\s*<\/div>/gi,'');
}

function splitQCM(statement){
  let source=String(statement||'').trim();
  let wrapperStart='',wrapperEnd='';
  const wrapper=source.match(/^<div([^>]*)>([\s\S]*)<\/div>$/i);
  if(wrapper&&wrapper[2].includes('&&')){
    wrapperStart='<div'+wrapper[1]+'>';
    wrapperEnd='</div>';
    source=wrapper[2];
  }
  const parts=source.split('&&');
  if(parts.length<=1) return null;
  const prompt=wrapperStart+parts[0]+wrapperEnd;
  const opts=parts.slice(1).map(s=>s.trim()).filter(Boolean);
  return {prompt,opts};
}
function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

/* --- Typographie commune (lot T) : début ---
   Une seule passe, appliquée au TEXTE affiché, jamais aux balises :
   - vrai signe moins (U+2212) pour le signe d'un nombre et la soustraction
     entre nombres ou lettres (graduations et coordonnées comprises) ;
   - espace fine insécable avant % (17 %) ;
   - jamais de « ^ » brut : x^2 devient x², 90^° devient 90° ;
   - apostrophe typographique dans les mots (d’un), sans toucher aux primes
     des figures (A'B') ;
   - espace insécable avant ? ! ; : pour qu'ils ne partent pas seuls à la ligne.
   Les attributs, les classes, les identifiants, les URL, le contenu des
   <script> et <style> ne sont jamais modifiés. Aucune expression rationnelle
   avec « lookbehind » : elle casserait le moteur sur les vieux iPhone. */
const TYPO_EXPOSANTS={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','−':'⁻'};
const TYPO_ESPACE='(?:[ \\t\\n\\r\\u00a0\\u202f]|&nbsp;|&#160;)';
const TYPO_MOINS_SIGNE=new RegExp('(^|[ \\t\\n\\r(\\[{;=<>≤≥×÷+−:|/\\u00a0\\u202f]|&nbsp;|&#160;|&lt;|&gt;)-(?=[0-9]|[𝑥𝑦]|[a-zA-Z](?![a-zA-ZÀ-ÖØ-öø-ÿ]))','gu');
const TYPO_MOINS_ENTRE_NOMBRES=new RegExp('([0-9)\\]²³°%𝑥𝑦])('+TYPO_ESPACE+'+)-(?='+TYPO_ESPACE+'+(?:[0-9(𝑥𝑦]|[a-zA-Z](?![a-zA-ZÀ-ÖØ-öø-ÿ])))','gu');
const TYPO_MOINS_APRES_LETTRE=new RegExp('(^|[^A-Za-zÀ-ÖØ-öø-ÿ])([a-zA-Z])('+TYPO_ESPACE+'+)-(?='+TYPO_ESPACE+'+(?:[0-9(𝑥𝑦]|[a-zA-Z](?![a-zA-ZÀ-ÖØ-öø-ÿ])))','gu');
function typographieTexte(text){
  let s=String(text ?? '');
  if(!s) return s;
  // 1. Exposants écrits à la main.
  s=s.replace(/\^\{?\s*(?:°|\\circ)\s*\}?/g,'°')
     .replace(/\^\{([−-]?[0-9]+)\}|\^([−-]?[0-9]+)/g,(m,a,b)=>Array.from(a||b).map(c=>TYPO_EXPOSANTS[c]||c).join(''));
  // 2. Signe moins : signe d'un nombre, puis soustraction (avec ou sans espaces).
  s=s.replace(TYPO_MOINS_SIGNE,'$1−')
     .replace(TYPO_MOINS_ENTRE_NOMBRES,'$1$2−')
     .replace(TYPO_MOINS_APRES_LETTRE,'$1$2$3−')
     .replace(/([0-9)\]²³𝑥𝑦])-(?=[0-9(𝑥𝑦]|[a-z](?![a-zA-ZÀ-ÖØ-öø-ÿ]))/gu,'$1−')
     .replace(/(^|[^A-Za-zÀ-ÖØ-öø-ÿ])([a-z])-(?=[0-9(])/g,'$1$2−');
  // 3. Pourcentage : 17 %, jamais 17%.
  s=s.replace(new RegExp('([0-9])'+TYPO_ESPACE+'*%','g'),'$1 %');
  // 4. Apostrophe dans les mots (d’un, l’aire, qu’il), pas les primes (A'B').
  s=s.replace(/([A-Za-zÀ-ÖØ-öø-ÿ])(?:'|&#39;|&#x27;)(?=[a-zà-öø-ÿ])/g,'$1’');
  // 5. Ponctuation haute : pas de « ? » seul en début de ligne.
  s=s.replace(new RegExp('([^ \\t\\n\\r])'+TYPO_ESPACE+'+([?!;])','g'),'$1 $2')
     .replace(new RegExp('([^ \\t\\n\\r])'+TYPO_ESPACE+'+(:)(?=[ \\t\\n\\r]|$|&nbsp;|<)','g'),'$1 $2');
  return s;
}
function typographieHtml(html){
  const source=String(html ?? '');
  if(!source) return source;
  // Découpe en balises et en texte ; seul le texte est retouché.
  const parts=source.split(/(<!-[-][\s\S]*?-->|<[^>]*>)/);
  let skip=null;
  for(let index=0;index<parts.length;index++){
    const part=parts[index];
    if(!part) continue;
    if(part.charAt(0)==='<'){
      const tag=part.match(/^<\/?\s*([a-zA-Z][\w-]*)/);
      const name=tag?tag[1].toLowerCase():'';
      if(skip){ if(/^<\//.test(part)&&name===skip) skip=null; continue; }
      if(!/^<\//.test(part)&&['script','style','textarea','code','pre'].includes(name)&&!/\/>$/.test(part)) skip=name;
      continue;
    }
    if(skip) continue;
    parts[index]=typographieTexte(part);
  }
  return parts.join('');
}
/* --- Typographie commune (lot T) : fin --- */

function latexCore(s){
  s=String(s ?? '');

  // Environnements alignés utilisés dans les résolutions d'équations.
  s=s.replace(/\\begin\{aligned\}/g,'<span class="aligned-math">')
     .replace(/\\end\{aligned\}/g,'</span>')
     .replace(/\\\\/g,'<br>')
     .replace(/&/g,'');

  // Fractions. Les jetons @@PH...@@ permettent d'y conserver les trous de réponse.
  for(let pass=0; pass<6; pass++){
    s=s.replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g,'<span class="frac"><span class="frac-num">$1</span><span class="frac-den">$2</span></span>');
    s=s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'<span class="frac"><span class="frac-num">$1</span><span class="frac-den">$2</span></span>');
  }

  // Commandes avec un argument.
  s=s.replace(/\\text\{([^{}]*)\}/g,'<span class="math-text">$1</span>')
     .replace(/\\mathcal\{([^{}]+)\}/g,'<span class="mathcal">$1</span>')
     .replace(/\\widehat\{([^{}]+)\}/g,'<span class="widehat">$1</span>');

  // Degrés écrits en exposant : 90^\circ, 90^{\circ} et 90^° deviennent 90°
  // (sinon il restait « 90^° » à l'écran, dnb_37).
  s=s.replace(/\^\{?\s*(?:\\circ|°)\s*\}?/g,'°');

  // Fonctions, symboles et espacements présents dans les 37 modules.
  s=s.replace(/\\cos/g,'cos')
     .replace(/\\sin/g,'sin')
     .replace(/\\tan/g,'tan')
     .replace(/\\times/g,'×')
     .replace(/\\div/g,'÷')
     .replace(/\\cdot/g,'·')
     .replace(/\\leq/g,'≤')
     .replace(/\\geq/g,'≥')
     .replace(/\\neq/g,'≠')
     .replace(/\\approx/g,'≈')
     .replace(/\\sqrt/g,'√')
     .replace(/\\pi/g,'π')
     .replace(/\\ell/g,'ℓ')
     .replace(/\\circ/g,'°')
     .replace(/\\in/g,'∈')
     .replace(/\\%/g,'%')
     .replace(/\\qquad/g,'<span class="qquad"></span>')
     .replace(/\\quad/g,'<span class="quad"></span>')
     .replace(/\\,/g,' ')
     .replace(/\\;/g,' ');

  // Exposants et indices simples.
  s=s.replace(/\^\{([^{}]+)\}/g,'<sup>$1</sup>')
     .replace(/\^(-?\d+|[A-Za-z])/g,'<sup>$1</sup>')
     .replace(/_\{([^{}]+)\}/g,'<sub>$1</sub>')
     .replace(/_([A-Za-z0-9])/g,'<sub>$1</sub>');

  return s;
}

const LATEX_SANS_DELIMITEUR=/\\(?:d?frac|text|mathcal|widehat|cos|sin|tan|times|div|quad|qquad|sqrt|pi|in|circ)|\\%|\^[{A-Za-z0-9°\\-]|_[{A-Za-z0-9]/;
// LaTeX sans délimiteur dans un texte qui contient aussi des balises (une
// figure <svg>) : seuls les morceaux de TEXTE hors des <svg> sont traduits ; les
// entités HTML (&nbsp;…) sont protégées, latexCore effaçant les « & ».
function latexHorsFigures(html){
  return String(html).split(/(<svg[\s\S]*?<\/svg>)/i).map(block=>{
    if(/^<svg/i.test(block)||!LATEX_SANS_DELIMITEUR.test(block)) return block;
    return block.split(/(<[^>]*>)/).map(part=>{
      if(!part||part.charAt(0)==='<'||!LATEX_SANS_DELIMITEUR.test(part)) return part;
      const entities=[];
      const protectedText=part.replace(/&(#?[A-Za-z0-9]+);/g,entity=>'@@ENT'+(entities.push(entity)-1)+'@@');
      return latexCore(protectedText).replace(/@@ENT(\d+)@@/g,(m,index)=>entities[Number(index)]);
    }).join('');
  }).join('');
}
function renderMathSegments(html){
  html=String(html ?? '');

  // Les blocs mathématiques explicites.
  html=html.replace(/\$\$([\s\S]*?)\$\$/g,(m,expr)=>'<span class="math-display">'+latexCore(expr)+'</span>');

  // Certains choix QCM contiennent du LaTeX sans délimiteur. Avec une figure
  // <svg>, on traduit le texte autour de la figure sans toucher à la figure
  // (avant le lot T, rien n'était traduit dès qu'une figure était présente).
  if(LATEX_SANS_DELIMITEUR.test(html)){
    if(/<svg[\s>]/i.test(html)) html=latexHorsFigures(html);
    else html='<span class="math-inline">'+latexCore(html)+'</span>';
  }
  return html;
}

function renderPlaceholders(str,answers,mode){
  let answerIndex=0;
  let tokenIndex=0;
  const replacements=new Map();

  function tokenFor(content){
    const token='@@PH'+(tokenIndex++)+'@@';
    replacements.set(token,content);
    return token;
  }

  function nextAnswer(){
    const value=answers[answerIndex]!==undefined ? answers[answerIndex] : (answers[0]||'');
    answerIndex++;
    return String(value);
  }

  function answerSlot(value,small=false){
    const length=Math.max(1,Array.from(String(value)).length);
    const minimum=small?.9:1.05;
    const maximum=small?5:10;
    const width=Math.max(minimum,Math.min(maximum,length*.58+.35));
    const classes='answer-slot'+(small?' answer-slot-small':'')+(mode==='correction'?' answer-slot-filled':'');
    const content=mode==='question'
      ? '<span class="answer-dots">…</span>'
      : '<strong>'+escapeHtml(value)+'</strong>';
    return '<span class="'+classes+'" style="--answer-width:'+width.toFixed(2)+'em">'+content+'</span>';
  }

  let out=String(str||'').replace(/\[\[([^\]]+)\]\]/g,(m,name)=>{
    if(name.includes('qcm')) return '';

    if(name==='dots'){
      return tokenFor(answerSlot(nextAnswer()));
    }

    // Ces deux widgets représentent une fraction complète avec un seul placeholder.
    if(name==='formula_frac' || name==='frac-simp'){
      const num=nextAnswer();
      const den=nextAnswer();
      const n=tokenFor(answerSlot(num,true));
      const d=tokenFor(answerSlot(den,true));
      return '\\dfrac{'+n+'}{'+d+'}';
    }

    return tokenFor(answerSlot(nextAnswer()));
  });

  out=renderMathSegments(out);
  for(const [token,replacement] of replacements){
    out=out.split(token).join(replacement);
  }
  return out;
}
function shuffledQcm(statement, answers){
  const parsed=splitQCM(statement);
  if(!parsed) return {statement,answers};
  const prompt=parsed.prompt;
  const opts=parsed.opts;
  const permutation=opts.map((_,i)=>i);
  for(let i=permutation.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [permutation[i],permutation[j]]=[permutation[j],permutation[i]];
  }
  const shuffled=permutation.map(i=>opts[i]);
  const remapped=answers.map(a=>{
    const oldIndex=Number(a)-1;
    const newIndex=permutation.indexOf(oldIndex);
    return newIndex>=0 ? String(newIndex+1) : String(a);
  });
  // permutation[nouvelle place] = ancienne place : sert à retrouver la phrase
  // « distractor_feedback » écrite pour l'ordre du gabarit (lot T).
  return {statement:prompt+'&&'+shuffled.join('&&')+'&&',answers:remapped,permutation};
}

function shuffleLocal(arr){
  const out=[...arr];
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}
function nzRand(min,max){
  let v=0;
  while(v===0) v=RD(min,max);
  return v;
}
function typeLimit(type){ return type==='x2'?4:5; }
function totalLimit(type){ return type==='x2'?6:(type==='x'?8:10); }
function termLatex(coeff,type,leading=false){
  const sign=coeff<0?'-':(leading?'':'+');
  const a=Math.abs(coeff);
  if(type==='u') return sign+String(a);
  const body=type==='x2'?'𝑥^2':'𝑥';
  return sign+(a===1?'':String(a))+body;
}
function termLabel(coeff,type,leading=false){
  const sign=coeff<0?'−':(leading?'':'+');
  const a=Math.abs(coeff);
  if(type==='u') return sign+String(a);
  const body=type==='x2'?'𝑥²':'𝑥';
  return sign+(a===1?'':String(a))+body;
}
function coeffSums(groups){
  const sums={x2:0,x:0,u:0};
  groups.forEach(g=>{sums[g.type]+=g.coeff;});
  return sums;
}
function expressionLatex(groups){
  return groups.map((g,i)=>termLatex(g.coeff,g.type,i===0)).join('');
}
function reducedLatex(sums){
  const parts=[];
  ['x2','x','u'].forEach(type=>{
    const c=sums[type]||0;
    if(c!==0) parts.push(termLatex(c,type,parts.length===0));
  });
  return parts.length?parts.join(''):'0';
}
function countSigns(groups,type){
  let pos=0,neg=0;
  groups.filter(g=>g.type===type).forEach(g=>{
    if(g.coeff>0) pos+=g.coeff; else neg+=-g.coeff;
  });
  return {pos,neg};
}
function validTileLoad(groups){
  return ['x2','x','u'].every(type=>{
    const c=countSigns(groups,type);
    return c.pos<=totalLimit(type) && c.neg<=totalLimit(type);
  });
}
function distributeGroups(types,count){
  const chosen=[...types];
  while(chosen.length<count) chosen.push(pick(types));
  return shuffleLocal(chosen);
}
function hasCancellation(groups){
  return ['x2','x','u'].some(type=>{
    const c=countSigns(groups,type);
    return c.pos>0 && c.neg>0;
  });
}
function hasRepeatedNature(groups){
  return ['x2','x','u'].some(type=>groups.filter(g=>g.type===type).length>=2);
}

/*
Module dnb_10 — Simplifier des expressions littérales (refonte d’octobre 2026).
Types (numéros stables, le 5 « lire des tuiles » est retiré) :
1. une seule famille de termes en lettre, même signe (saisie ou QCM) ;
2. une seule famille de termes en lettre, signes mélangés (saisie ou QCM) ;
3. plusieurs familles, chaque famille garde un seul signe (saisie) ;
4. plusieurs familles avec changements de signe, 5 termes au plus (saisie) ;
6. expression déjà réduite à reconnaître (QCM seulement) ;
7. k(mx + n) dans une somme, forme du sujet de référence 2027 (saisie) ;
8. opposé d’une parenthèse : 7x − (3x − 5) (saisie) ;
9. produit de deux facteurs : 3a × 2a, 4 × 5y (QCM) ;
10. somme ou produit : 3x + 2x ou 3x × 2x (QCM) ;
11. k(ma + n) dans une somme, en QCM avec une autre lettre (QCM).

Bornes : coefficient d’un terme x² <= 4, x <= 5, nombre <= 5 ;
charge totale par signe : x² <= 6, x <= 8, nombre <= 10.
*/

function makeOneNoCancel(){
  const type=pick(['x2','x']);
  for(let tries=0;tries<500;tries++){
    const sign=pick([-1,1,1]);
    const count=RD(2,3);
    const groups=[];
    for(let i=0;i<count;i++){
      groups.push({type,coeff:sign*RD(1,typeLimit(type))});
    }
    if(validTileLoad(groups)) return groups;
  }
  return [{type,coeff:1},{type,coeff:1}];
}

function makeOneCancel(){
  const type=pick(['x2','x']);
  for(let tries=0;tries<700;tries++){
    const count=RD(3,4);
    const groups=[];
    for(let i=0;i<count;i++){
      groups.push({type,coeff:nzRand(-typeLimit(type),typeLimit(type))});
    }
    if(hasCancellation(groups) && validTileLoad(groups)) return shuffleLocal(groups);
  }
  return [{type,coeff:2},{type,coeff:-1},{type,coeff:1}];
}

function makeMultiNoCancel(){
  for(let tries=0;tries<700;tries++){
    const typeCount=pick([2,3]);
    const types=shuffleLocal(['x2','x','u']).slice(0,typeCount);
    const groupCount=RD(typeCount+1,Math.min(5,typeCount+2));
    const sequence=distributeGroups(types,groupCount);
    const signs={};
    types.forEach(type=>{signs[type]=pick([-1,1]);});
    const groups=sequence.map(type=>({
      type,
      coeff:signs[type]*RD(1,typeLimit(type))
    }));
    if(hasRepeatedNature(groups) && validTileLoad(groups)) return shuffleLocal(groups);
  }
  return [
    {type:'x2',coeff:1},
    {type:'u',coeff:-2},
    {type:'x2',coeff:2}
  ];
}

function makeMultiCancel(){
  for(let tries=0;tries<1000;tries++){
    const typeCount=pick([2,3]);
    const types=shuffleLocal(['x2','x','u']).slice(0,typeCount);
    const groupCount=RD(Math.max(4,typeCount+1),5);
    const sequence=distributeGroups(types,groupCount);
    const groups=sequence.map(type=>({
      type,
      coeff:nzRand(-typeLimit(type),typeLimit(type))
    }));
    const sums=coeffSums(groups);
    const allZero=!sums.x2&&!sums.x&&!sums.u;
    if(!allZero && hasCancellation(groups) && hasRepeatedNature(groups) && validTileLoad(groups)){
      return shuffleLocal(groups);
    }
  }
  return [
    {type:'x2',coeff:2},
    {type:'x',coeff:-3},
    {type:'x2',coeff:-1},
    {type:'x',coeff:1}
  ];
}

function makeAlreadyReducedQcmGroups(){
  for(let tries=0;tries<200;tries++){
    const types=shuffleLocal(['x2','x','u']).slice(0,2);
    const groups=types.map((type,index)=>({type,coeff:index===1&&rnd()<.3?-RD(1,typeLimit(type)):RD(1,typeLimit(type))}));
    const a=groups[0].coeff,b=groups[1].coeff;
    if(a+b!==0 && Math.abs(a+b)!==1 && a*b!==a+b) return groups;
  }
  return [{type:'x2',coeff:3},{type:'x',coeff:1}];
}

/* ---------- Écriture des expressions (vrai signe −, lettre italique) ---------- */
const REDUCTION_LETTERS={x:'𝑥',a:'𝑎',y:'𝑦',t:'𝑡'};
const REDUCTION_POWERS={0:'',1:'',2:'²',3:'³',4:'⁴'};
function redLetter(L){ return REDUCTION_LETTERS[L]||L; }
function redFamilyBody(type,L){ return type==='x2'?redLetter(L)+'²':(type==='x'?redLetter(L):''); }
function redPowerBody(power,L){ return power===0?'':redLetter(L)+REDUCTION_POWERS[power]; }
// Monôme sans son signe : 3𝑥, 𝑥², 5.
function redMonoAbs(coeff,body){
  const a=Math.abs(coeff);
  if(!body) return String(a);
  return (a===1?'':String(a))+body;
}
// Un terme = {sign:'+'|'−', body:'3𝑥'}.
function redPiece(coeff,body){ return {sign:coeff<0?'−':'+',body:redMonoAbs(coeff,body)}; }
function redPiecesText(pieces){
  return pieces.map((p,i)=>i===0?(p.sign==='−'?'−':'')+p.body:' '+p.sign+' '+p.body).join('');
}
function redPiecesHtml(pieces){
  return pieces.map((p,i)=>'<span class="reduction-term">'+(i===0?(p.sign==='−'?'−':''):' '+p.sign+' ')+p.body+'</span>').join('');
}
function redGroupsPieces(groups,L){ return groups.map(g=>redPiece(g.coeff,redFamilyBody(g.type,L))); }
function redSumsGroups(sums){
  const out=[];
  ['x2','x','u'].forEach(type=>{ const c=sums[type]||0; if(c!==0) out.push({type,coeff:c}); });
  return out;
}
function redReducedText(sums,L){
  const groups=redSumsGroups(sums);
  return groups.length?redPiecesText(redGroupsPieces(groups,L)):'0';
}
function redMonomialText(coeff,power,L){
  if(coeff===0) return '0';
  return (coeff<0?'−':'')+redMonoAbs(coeff,redPowerBody(power,L));
}
// Liste de coefficients écrite comme une somme : 1 − 3 + 4.
function redCoeffSum(coeffs){
  return coeffs.map((c,i)=>i===0?(c<0?'−':'')+Math.abs(c):(c<0?' − ':' + ')+Math.abs(c)).join('');
}
// Facteur écrit dans un produit : un négatif placé après un × prend des parenthèses.
function redFactor(coeff,body,afterTimes){
  const text=(coeff<0?'−':'')+redMonoAbs(coeff,body);
  return coeff<0&&afterTimes?'('+text+')':text;
}
function redNumberFactor(n,afterTimes){ return n<0?(afterTimes?'(−'+Math.abs(n)+')':'−'+Math.abs(n)):String(n); }
const REDUCTION_FAMILY_NAMES={x2:'les 𝑥²',x:'les 𝑥',u:'les nombres'};
function redFamilyName(type,L){ return type==='u'?'les nombres':'les '+redFamilyBody(type,L); }

/* ---------- Aide : expression soulignée par famille + tuiles ---------- */
const REDUCTION_UNDERLINES={
  x2:'text-decoration:underline solid #17384d 3px;text-underline-offset:.2em',
  x:'text-decoration:underline dashed #17384d 3px;text-underline-offset:.2em',
  u:'text-decoration:underline wavy #17384d 2px;text-underline-offset:.24em'
};
function redFamiliesAideHtml(groups,L,withTiles){
  const terms=groups.map((g,i)=>{
    const p=redPiece(g.coeff,redFamilyBody(g.type,L));
    const text=i===0?(p.sign==='−'?'−':'')+p.body:p.sign+' '+p.body;
    return '<span style="'+REDUCTION_UNDERLINES[g.type]+'">'+text+'</span>';
  }).join(' ');
  const present=['x2','x','u'].filter(type=>groups.some(g=>g.type===type));
  const legendNames={x2:'trait plein : '+redFamilyName('x2',L),x:'tirets : '+redFamilyName('x',L),u:'vagues : les nombres'};
  let html='<div class="reduction-aide">'
    +'<div class="reduction-aide-expression" style="font-family:\'Cambria Math\',\'STIX Two Math\',\'Times New Roman\',serif;font-weight:700;font-size:1.55em;line-height:2;text-align:center">'+terms+'</div>'
    +'<div class="reduction-aide-legend" style="text-align:center;font-size:.9em;color:#33475b">'+present.map(type=>legendNames[type]).join(' · ')+'</div>';
  if(withTiles && L==='x' && typeof globalThis.algebraTiles==='function'){
    const tileTerms=groups.map(g=>({kind:g.type,count:Math.abs(g.coeff),sign:g.coeff<0?-1:1}));
    html+='<div class="reduction-aide-tiles" style="max-width:560px;margin:6px auto 0">'+globalThis.algebraTiles({title:'Chaque terme en tuiles',terms:tileTerms})+'</div>';
  }
  return html+'</div>';
}

/* ---------- QCM : options + phrase de diagnostic par distracteur ---------- */
function redFinishQcm(correct,candidates,fallback){
  const options=[{text:correct,feedback:null}];
  candidates.forEach(c=>{ if(c && c.text!==correct && !options.some(o=>o.text===c.text) && options.length<4) options.push(c); });
  let bump=1;
  while(options.length<4 && bump<40){
    const f=fallback(bump++);
    if(f && !options.some(o=>o.text===f.text)) options.push(f);
  }
  const shuffled=shuffleLocal(options);
  const correctIndex=shuffled.findIndex(o=>o.feedback===null)+1;
  const distractorFeedback={};
  shuffled.forEach((o,i)=>{ if(o.feedback) distractorFeedback[String(i+1)]=o.feedback; });
  return {options:shuffled.map(o=>o.text),correctIndex:String(correctIndex),distractorFeedback};
}

function simpleQcmGroups(kind){
  const type=pick(['x','x2']);
  const lim=typeLimit(type);
  if(kind==='one_no_cancel'){
    for(let tries=0;tries<300;tries++){
      const a=RD(1,lim),b=RD(1,lim);
      if(a*b===a+b) continue;
      const groups=[{type,coeff:a},{type,coeff:b}];
      if(validTileLoad(groups)) return groups;
    }
    return [{type,coeff:2},{type,coeff:3}];
  }
  for(let tries=0;tries<300;tries++){
    const b=RD(1,Math.max(1,lim-1));
    const a=RD(b+1,lim);
    const groups=[{type,coeff:a},{type,coeff:-b}];
    if(validTileLoad(groups)) return groups;
  }
  return [{type,coeff:4},{type,coeff:-2}];
}

function makeOneFamilyQcm(groups,L){
  const type=groups[0].type,power=type==='x2'?2:1;
  const a=groups[0].coeff,b=groups[1].coeff,sum=a+b;
  const fam=redFamilyBody(type,L);
  const correct=redMonomialText(sum,power,L);
  const candidates=[];
  if(b<0){
    candidates.push({text:redMonomialText(Math.abs(a)+Math.abs(b),power,L),feedback:'Tu as additionné '+Math.abs(a)+' et '+Math.abs(b)+' : le signe − fait partie du terme −'+redMonoAbs(b,fam)+'.'});
  }
  candidates.push({text:redMonomialText(sum,power*2,L),feedback:'On additionne des '+fam+' : le résultat reste en '+fam+', l’exposant ne change pas.'});
  candidates.push({text:redMonomialText(a*b,power*2,L),feedback:'Tu as multiplié les deux termes. Ici, c’est une '+(b<0?'soustraction':'addition')+'.'});
  if(b>0) candidates.push({text:redMonomialText(a*b,power,L),feedback:'Tu as multiplié '+a+' et '+b+' : il faut les additionner.'});
  return redFinishQcm(correct,candidates,bump=>({text:redMonomialText(sum+bump,power,L),feedback:'Recompte les coefficients : '+redCoeffSum([a,b])+' = '+sum+'.'}));
}

function makeAlreadyReducedQcm(groups,L){
  const powers={u:0,x:1,x2:2};
  const reordered=[groups[1],groups[0]];
  const correct=redPiecesText(redGroupsPieces(reordered,L));
  const a=groups[0].coeff,b=groups[1].coeff,sum=a+b;
  const ordered=[...groups].sort((g1,g2)=>powers[g2.type]-powers[g1.type]);
  const high=ordered[0].type,low=ordered[1].type;
  const highBody=redFamilyBody(high,L),lowBody=redFamilyBody(low,L);
  const diff='Tu as additionné des termes de familles différentes : '+(low==='u'?'un nombre':'des '+lowBody)+' et des '+highBody+' ne se regroupent pas.';
  const candidates=[
    {text:redMonomialText(sum,powers[high],L),feedback:diff},
    {text:redMonomialText(sum,powers[low],L),feedback:diff},
    {text:redMonomialText(a*b,powers[high]+powers[low],L),feedback:'Tu as multiplié les deux termes, mais c’est une '+(b<0?'soustraction':'addition')+'.'}
  ];
  return redFinishQcm(correct,candidates,bump=>({text:redMonomialText(sum+bump,powers[high],L),feedback:diff}));
}

/* ---------- Corrections rédigées ---------- */
function redFinalStrong(text){ return '<strong>'+text+'</strong>'; }
function redOneFamilyCorrection(groups,L){
  const type=groups[0].type,body=redFamilyBody(type,L);
  const sum=groups.reduce((s,g)=>s+g.coeff,0);
  const expr=redPiecesText(redGroupsPieces(groups,L));
  const result=redMonomialText(sum,type==='x2'?2:1,L);
  let line=expr+' = ('+redCoeffSum(groups.map(g=>g.coeff))+')'+body;
  if(sum===0) line+=' = 0'+body+' = '+redFinalStrong('0');
  else if(Math.abs(sum)===1) line+=' = '+(sum<0?'−':'')+'1'+body+' = '+redFinalStrong(result);
  else line+=' = '+redFinalStrong(result);
  return {
    steps:['Tous les termes sont des '+body+' : on additionne leurs coefficients, avec leur signe.',line],
    note:sum===0?'Les termes s’annulent : il reste 0.':(Math.abs(sum)===1?'On écrit '+(sum<0?'−':'')+redLetter(L)+(type==='x2'?'²':'')+' et non '+(sum<0?'−':'')+'1'+body+'.':null)
  };
}
function redMultiCorrection(groups,L){
  const sums=coeffSums(groups);
  const expr=redPiecesText(redGroupsPieces(groups,L));
  const ordered=[];
  ['x2','x','u'].forEach(type=>groups.filter(g=>g.type===type).forEach(g=>ordered.push(g)));
  const regrouped=redPiecesText(redGroupsPieces(ordered,L));
  const familyParts=[];
  const vanished=[];
  ['x2','x','u'].forEach(type=>{
    const members=groups.filter(g=>g.type===type);
    if(!members.length) return;
    if(members.length===1){ familyParts.push(redPiece(members[0].coeff,redFamilyBody(type,L))); return; }
    if(sums[type]===0) vanished.push(type);
    familyParts.push({sign:'+',body:'('+redCoeffSum(members.map(g=>g.coeff))+')'+redFamilyBody(type,L),plainFirst:true});
  });
  const familyText=familyParts.map((p,i)=>i===0?(p.plainFirst?'':(p.sign==='−'?'−':''))+p.body:' '+p.sign+' '+p.body).join('');
  const result=redReducedText(sums,L);
  const present=['x2','x','u'].filter(type=>groups.some(g=>g.type===type)).map(type=>redFamilyName(type,L));
  const steps=regrouped===expr
    ?['On regroupe chaque famille ('+present.join(', ')+') ; chaque terme garde son signe.',expr+' = '+familyText+' = '+redFinalStrong(result)]
    :['On range par famille ('+present.join(', ')+') ; chaque terme garde son signe.',expr+' = '+regrouped,'= '+familyText+' = '+redFinalStrong(result)];
  return {
    steps,
    note:vanished.length?vanished.map(type=>'('+redCoeffSum(groups.filter(g=>g.type===type).map(g=>g.coeff))+')'+redFamilyBody(type,L)+' = 0 : '+redFamilyName(type,L)+' disparaissent.').join(' '):null
  };
}

/* ---------- Types 7 et 11 : k(mL + n) dans une somme ---------- */
function makeParenFactorData(L){
  for(let tries=0;tries<500;tries++){
    const p=rnd()<.75?RD(1,6):-RD(1,6);
    const q=nzRand(-9,9);
    const k=rnd()<.65?-RD(2,5):RD(2,5);
    const m=RD(1,5);
    const n=rnd()<.65?RD(1,6):-RD(1,6);
    const cx=p+k*m,cu=q+k*n;
    if(cx===0||cu===0) continue;
    if(Math.abs(k)===Math.abs(n)) continue;
    if(Math.abs(cx)>30||Math.abs(cu)>40) continue;
    const parenFirst=rnd()<.25;
    return {p,q,k,m,n,cx,cu,parenFirst};
  }
  return {p:3,q:-1,k:-4,m:2,n:3,cx:-5,cu:-13,parenFirst:false};
}
function parenFactorPieces(d,L){
  const inner=redPiecesText([redPiece(d.m,redLetter(L)),redPiece(d.n,'')]);
  const parenPiece={sign:d.k<0?'−':'+',body:Math.abs(d.k)+'('+inner+')'};
  const outside=[redPiece(d.p,redLetter(L)),redPiece(d.q,'')];
  return d.parenFirst?[parenPiece,...outside]:[...outside,parenPiece];
}
function parenFactorWork(d,L){
  const pieces=parenFactorPieces(d,L);
  const expr=redPiecesText(pieces);
  const inner=redPiecesText([redPiece(d.m,redLetter(L)),redPiece(d.n,'')]);
  const kText=(d.k<0?'−':'')+Math.abs(d.k);
  const developed=redPiecesText([redPiece(d.k*d.m,redLetter(L)),redPiece(d.k*d.n,'')]);
  const devPieces=[redPiece(d.k*d.m,redLetter(L)),redPiece(d.k*d.n,'')];
  const outside=[redPiece(d.p,redLetter(L)),redPiece(d.q,'')];
  const after=redPiecesText(d.parenFirst?[...devPieces,...outside]:[...outside,...devPieces]);
  const xs=d.parenFirst?[d.k*d.m,d.p]:[d.p,d.k*d.m];
  const us=d.parenFirst?[d.k*d.n,d.q]:[d.q,d.k*d.n];
  const result=redReducedText({x2:0,x:d.cx,u:d.cu},L);
  const steps=[
    'On développe : '+kText+'('+inner+') = '+developed+'. Le '+kText+' multiplie les deux termes.',
    expr+' = '+after,
    '= ('+redCoeffSum(xs)+')'+redLetter(L)+' + ('+redCoeffSum(us)+') = '+redFinalStrong(result)
  ];
  let note=null;
  if(d.k<0) note='Attention : '+kText+' × '+redNumberFactor(d.n,true)+' = '+(d.k*d.n<0?'−':'')+Math.abs(d.k*d.n)+'. Le signe − devant le '+Math.abs(d.k)+' change le signe des deux produits.';
  else note='Attention : le '+d.k+' multiplie aussi le '+redNumberFactor(d.n,false)+' : '+d.k+' × '+redNumberFactor(d.n,true)+' = '+(d.k*d.n<0?'−':'')+Math.abs(d.k*d.n)+'.';
  const aide=[
    'Commence par développer : le nombre devant la parenthèse multiplie chacun des deux termes. Ensuite, regroupe les '+redLetter(L)+' et les nombres.',
    'Ici, calcule '+redNumberFactor(d.k,false)+' × '+redMonoAbs(d.m,redLetter(L))+' puis '+redNumberFactor(d.k,false)+' × '+redNumberFactor(d.n,true)+'.'
  ];
  return {pieces,expr,result,steps,note,aide};
}
function makeParenFactorQcm(d,L){
  const correct=redReducedText({x2:0,x:d.cx,u:d.cu},L);
  const kText=(d.k<0?'−':'')+Math.abs(d.k);
  const candidates=[
    {text:redReducedText({x2:0,x:d.cx,u:d.q+d.n},L),feedback:'Tu n’as multiplié que le premier terme : le '+kText+' multiplie aussi le '+redNumberFactor(d.n,false)+'.'},
    {text:redReducedText({x2:0,x:d.cx,u:d.q-d.k*d.n},L),feedback:'Erreur de signe : '+kText+' × '+redNumberFactor(d.n,true)+' = '+(d.k*d.n<0?'−':'')+Math.abs(d.k*d.n)+'.'},
    {text:redReducedText({x2:0,x:d.p-d.k*d.m,u:d.cu},L),feedback:'Erreur de signe sur les '+redLetter(L)+' : '+kText+' × '+redMonoAbs(d.m,redLetter(L))+' = '+redMonomialText(d.k*d.m,1,L)+'.'}
  ];
  return redFinishQcm(correct,candidates,bump=>({text:redReducedText({x2:0,x:d.cx+bump,u:d.cu},L),feedback:'Recompte les '+redLetter(L)+' : ('+redCoeffSum([d.p,d.k*d.m])+')'+redLetter(L)+' = '+redMonomialText(d.cx,1,L)+'.'}));
}

/* ---------- Type 8 : opposé d’une parenthèse ---------- */
function makeOppositeData(){
  for(let tries=0;tries<500;tries++){
    const a=RD(2,9);
    const withD=rnd()<.4;
    const d=withD?nzRand(-9,9):0;
    const b=RD(1,9);
    const c=RD(1,9);
    const innerSign=pick([-1,1]);
    const xFirst=rnd()<.7;
    const inner=xFirst?[{type:'x',coeff:b},{type:'u',coeff:innerSign*c}]:[{type:'u',coeff:c},{type:'x',coeff:innerSign*b}];
    const innerX=inner.find(g=>g.type==='x').coeff,innerU=inner.find(g=>g.type==='u').coeff;
    const cx=a-innerX,cu=d-innerU;
    if(cx===0||cu===0) continue;
    if(a===b) continue;
    const dFirst=withD&&rnd()<.4;
    return {a,d,inner,cx,cu,withD,dFirst};
  }
  return {a:7,d:0,inner:[{type:'x',coeff:3},{type:'u',coeff:-5}],cx:4,cu:5,withD:false,dFirst:false};
}
function oppositeWork(o){
  const L='x';
  const innerText=redPiecesText(redGroupsPieces(o.inner,L));
  const outside=o.withD?(o.dFirst?[{type:'u',coeff:o.d},{type:'x',coeff:o.a}]:[{type:'x',coeff:o.a},{type:'u',coeff:o.d}]):[{type:'x',coeff:o.a}];
  const pieces=[...redGroupsPieces(outside,L),{sign:'−',body:'('+innerText+')'}];
  const expr=redPiecesText(pieces);
  const opposite=o.inner.map(g=>({type:g.type,coeff:-g.coeff}));
  const oppositeText=redPiecesText(redGroupsPieces(opposite,L));
  const after=redPiecesText(redGroupsPieces([...outside,...opposite],L));
  const all=[...outside,...opposite];
  const xs=all.filter(g=>g.type==='x').map(g=>g.coeff),us=all.filter(g=>g.type==='u').map(g=>g.coeff);
  const result=redReducedText({x2:0,x:o.cx,u:o.cu},L);
  const xPart='('+redCoeffSum(xs)+')𝑥';
  const uPart=us.length>1?' + ('+redCoeffSum(us)+')':' '+(us[0]<0?'−':'+')+' '+Math.abs(us[0]);
  const innerU=o.inner.find(g=>g.type==='u').coeff;
  return {
    pieces,expr,result,
    steps:[
      'On enlève la parenthèse précédée de − en changeant le signe de chaque terme : −('+innerText+') = '+oppositeText+'.',
      expr+' = '+after,
      '= '+xPart+uPart+' = '+redFinalStrong(result)
    ],
    note:innerU<0?'Attention : −(−'+Math.abs(innerU)+') = +'+Math.abs(innerU)+'. Le second terme change de signe lui aussi.':'Attention : on change le signe de tous les termes de la parenthèse, pas seulement du premier.',
    aide:[
      'Une parenthèse précédée de − s’enlève en changeant le signe de chaque terme qu’elle contient.',
      'Ici, écris d’abord l’opposé de '+innerText+', puis regroupe les 𝑥 et les nombres.'
    ]
  };
}

/* ---------- Types 9 et 10 : produits et « somme ou produit » ---------- */
function makeProductData(){
  const form=pick(['mono','mono','numFirst','numLast']);
  for(let tries=0;tries<300;tries++){
    let a,b;
    if(form==='mono'){ a=RD(1,6); b=RD(1,6); }
    else { a=RD(2,6); b=RD(2,6); }
    if(rnd()<.4){ if(rnd()<.5) a=-a; else b=-b; }
    if(form==='mono' && Math.abs(a)===1 && Math.abs(b)===1) continue;
    if(Math.abs(a)+Math.abs(b)===Math.abs(a*b)) continue;
    return {form,a,b,letter:pick(['x','x','a','y','t'])};
  }
  return {form:'mono',a:3,b:2,letter:'x'};
}
function productWork(d){
  const L=d.letter,Ll=redLetter(L);
  const firstBody=d.form==='numFirst'?'':Ll,secondBody=d.form==='numLast'?'':Ll;
  const expr=redFactor(d.a,firstBody,false)+' × '+redFactor(d.b,secondBody,true);
  const power=d.form==='mono'?2:1;
  const prod=d.a*d.b;
  const result=redMonomialText(prod,power,L);
  const numbers=[d.a,d.b].filter(c=>c!==1);
  const detail=(numbers.length?numbers.map((c,i)=>redNumberFactor(c,i>0)).join(' × ')+' × ':'')+(power===2?Ll+' × '+Ll:Ll);
  return {
    expr,result,power,
    steps:[
      'On multiplie les nombres entre eux et les lettres entre elles.',
      expr+' = '+detail+' = '+redFinalStrong(result)
    ],
    note:power===2?'Attention : '+Ll+' × '+Ll+' = '+Ll+'², mais '+Ll+' + '+Ll+' = 2'+Ll+'.':'Il n’y a qu’un seul '+Ll+' dans ce produit : pas de carré.',
    aide:['Dans un produit, multiplie les nombres entre eux, puis les lettres entre elles.','Écris le produit en détail : '+detail+'.']
  };
}
function makeProductQcm(d){
  const L=d.letter,Ll=redLetter(L);
  const power=d.form==='mono'?2:1,prod=d.a*d.b,sum=d.a+d.b;
  const correct=redMonomialText(prod,power,L);
  const candidates=[];
  if(prod<0) candidates.push({text:redMonomialText(-prod,power,L),feedback:'Erreur de signe : un des facteurs est négatif, donc le produit est négatif.'});
  candidates.push({text:redMonomialText(sum,1,L),feedback:'Tu as additionné les coefficients : ici, c’est une multiplication.'});
  if(power===2){
    candidates.push({text:redMonomialText(prod,1,L),feedback:Ll+' × '+Ll+' = '+Ll+'² : il manque le carré.'});
    candidates.push({text:redMonomialText(sum,2,L),feedback:'Les nombres se multiplient'+(Math.abs(d.a)===1||Math.abs(d.b)===1?' ('+Ll+' compte pour 1'+Ll+')':'')+' : '+redNumberFactor(d.a,false)+' × '+redNumberFactor(d.b,true)+' = '+String(prod).replace('-','−')+', on ne les additionne pas.'});
  } else {
    candidates.push({text:redMonomialText(prod,2,L),feedback:'Il n’y a qu’un seul '+Ll+' : le résultat reste en '+Ll+', sans carré.'});
    candidates.push({text:String(prod).replace('-','−'),feedback:'Tu as oublié la lettre '+Ll+'.'});
  }
  return redFinishQcm(correct,candidates,bump=>({text:redMonomialText(prod+bump,power,L),feedback:'Recalcule '+redNumberFactor(d.a,false)+' × '+redNumberFactor(d.b,true)+'.'}));
}
function makeSumOrProductData(){
  for(let tries=0;tries<200;tries++){
    const a=pick([1,1,2,3,4]),b=pick([1,1,2,3,4,5]);
    if(a===2&&b===2) continue;
    if(a*b===a+b) continue;
    return {a,b,op:pick(['+','×'])};
  }
  return {a:3,b:2,op:'+'};
}
function sumOrProductWork(d){
  const L='x',Ll='𝑥';
  const ta=redMonoAbs(d.a,Ll),tb=redMonoAbs(d.b,Ll);
  const expr=ta+' '+d.op+' '+tb;
  if(d.op==='+'){
    const result=redMonomialText(d.a+d.b,1,L);
    const first=(d.a===1&&d.b===1)?Ll+' + '+Ll+', c’est deux fois '+Ll+'.':ta+' + '+tb+', c’est '+d.a+' fois '+Ll+' plus '+d.b+' fois '+Ll+'.';
    return {expr,result,steps:[first,expr+' = ('+d.a+' + '+d.b+')'+Ll+' = '+redFinalStrong(result)],note:'Attention : '+Ll+' + '+Ll+' = 2'+Ll+', mais '+Ll+' × '+Ll+' = '+Ll+'².',aide:['Regarde l’opération : + ou × ? Elles ne donnent pas le même résultat.','Ici, c’est une addition de termes en '+Ll+'.']};
  }
  const result=redMonomialText(d.a*d.b,2,L);
  const nums=[d.a,d.b].filter(c=>c!==1);
  const detail=(nums.length?nums.join(' × ')+' × ':'')+Ll+' × '+Ll;
  return {expr,result,steps:['On multiplie les nombres entre eux et les lettres entre elles.',expr+' = '+detail+' = '+redFinalStrong(result)],note:'Attention : '+Ll+' × '+Ll+' = '+Ll+'², mais '+Ll+' + '+Ll+' = 2'+Ll+'.',aide:['Regarde l’opération : + ou × ? Elles ne donnent pas le même résultat.','Ici, c’est un produit : écris-le en détail, '+detail+'.']};
}
function makeSumOrProductQcm(d){
  const L='x',Ll='𝑥',sum=d.a+d.b,prod=d.a*d.b;
  if(d.op==='+'){
    return redFinishQcm(redMonomialText(sum,1,L),[
      {text:redMonomialText(prod,2,L),feedback:'Tu as calculé un produit. Ici, c’est une addition.'},
      {text:redMonomialText(sum,2,L),feedback:'Quand on additionne des '+Ll+', le résultat reste en '+Ll+' : pas de carré.'},
      {text:redMonomialText(prod,1,L),feedback:'Tu as multiplié '+d.a+' et '+d.b+' : il faut les additionner.'}
    ],bump=>({text:redMonomialText(sum+bump,1,L),feedback:'Recompte : '+d.a+' + '+d.b+' = '+sum+'.'}));
  }
  return redFinishQcm(redMonomialText(prod,2,L),[
    {text:redMonomialText(sum,1,L),feedback:'Tu as additionné. Ici, c’est une multiplication.'},
    {text:redMonomialText(prod,1,L),feedback:Ll+' × '+Ll+' = '+Ll+'² : il manque le carré.'},
    {text:redMonomialText(sum,2,L),feedback:'Les nombres se multiplient'+(d.a===1||d.b===1?' ('+Ll+' compte pour 1'+Ll+')':'')+' : '+d.a+' × '+d.b+' = '+prod+'.'}
  ],bump=>({text:redMonomialText(prod+bump,2,L),feedback:'Recalcule '+d.a+' × '+d.b+'.'}));
}


// dnb_01 — Écriture décimale des fractions simples (refonte du 7-8 octobre 2026).
// Cible DNB (liste officielle NC1) : 1/2 ; 1/4 ; 3/4 ; 3/2 ; 4/2 ; 5/2 ; 1/10 ;
// 100/100 ; 7/1, et la question réelle du DNB 2026 « Donner une écriture du
// nombre 0,75 sous la forme d'une fraction » (toute fraction égale est juste).
// Les numéros des types retirés (7, 8, 12, 14, 18, 20) ne sont pas réutilisés.
const MODULE01_OFFICIAL_F2D=[
  {num:1,den:2},{num:1,den:4},{num:3,den:4},{num:3,den:2},{num:4,den:2},{num:5,den:2},
  {num:1,den:10},{num:1,den:100},{num:100,den:100},{num:7,den:1}
];
// Sens décimal → fraction : jamais un entier caché (plus de « 1 = 1/1 »).
const MODULE01_OFFICIAL_D2F=[
  {num:1,den:2},{num:1,den:4},{num:3,den:4},{num:3,den:2},{num:5,den:2},
  {num:1,den:10},{num:1,den:100},{num:5,den:4},{num:7,den:4}
];
const MODULE01_QCM_D2F=[
  {num:1,den:2},{num:1,den:4},{num:3,den:4},{num:3,den:2},{num:5,den:2},
  {num:5,den:4},{num:7,den:4},{num:1,den:5},{num:2,den:5}
];
const MODULE01_TEMPLATES=[
  {n:1,options:{module01_kind:'fixed_f2d',module01_format:'open'}},
  {n:2,options:{module01_kind:'fixed_f2d',module01_format:'qcm'}},
  {n:3,options:{module01_kind:'fixed_d2f',module01_format:'open'}},
  {n:4,options:{module01_kind:'benchmark_d2f',module01_format:'qcm'}},
  {n:5,options:{module01_kind:'tenths_f2d',module01_format:'open'}},
  {n:6,options:{module01_kind:'hundredths_f2d',module01_format:'open'}},
  {n:9,options:{module01_kind:'benchmark_improper_f2d',module01_format:'qcm'}},
  {n:10,options:{module01_kind:'improper_f2d',module01_format:'open'}},
  {n:11,options:{module01_kind:'benchmark_improper_f2d',module01_format:'truefalse'}},
  {n:13,options:{module01_kind:'reducible_f2d',module01_format:'open'}},
  {n:15,options:{module01_kind:'tenths_d2f',module01_format:'open'}},
  {n:16,options:{module01_kind:'place_d2f',module01_format:'qcm'}},
  {n:17,options:{module01_kind:'hundredths_d2f',module01_format:'open'}},
  {n:19,options:{module01_kind:'improper_d2f',module01_format:'open'}},
  {n:21,options:{module01_kind:'compare',module01_format:'compare'}},
  {n:22,options:{module01_kind:'sum_f2d',module01_format:'open'}},
  {n:23,options:{module01_kind:'extreme',module01_format:'qcm'}}
].map(q=>({...q,statement:'',answer:'[]',footer:''}));
// Composition d'une série : un tour de toutes les familles avant de répéter
// (une question par famille, dans un ordre tiré au hasard), et une question de
// repère (1/2, 7/10…) en tête plutôt qu'une question difficile.
function module01Family(q){
  const n=Number(q&&q.n);
  if([1,2].includes(n)) return 'reperes';
  if([5,6].includes(n)) return 'dixiemes-centiemes';
  if([9,10,11].includes(n)) return 'plus-grand-que-1';
  if(n===13) return 'simplifier';
  // Les QCM décimal → fraction (4, 16) tournent avec les réponses à écrire : brevet 2027 sans QCM.
  if([21,23].includes(n)) return 'comparer';
  if(n===22) return 'somme';
  return 'vers-fraction';
}
function module01CoverageCycle(questions){
  const pools=new Map();
  questions.forEach(q=>{const f=module01Family(q);if(!pools.has(f))pools.set(f,[]);pools.get(f).push(q);});
  pools.forEach((items,key)=>pools.set(key,shuffledCopy(items)));
  const cycle=[];
  while([...pools.values()].some(items=>items.length)){
    shuffledCopy([...pools.keys()].filter(key=>pools.get(key).length)).forEach(key=>cycle.push(pools.get(key).shift()));
  }
  const first=cycle.findIndex(q=>['reperes','dixiemes-centiemes'].includes(module01Family(q)));
  if(first>0) cycle.unshift(cycle.splice(first,1)[0]);
  return cycle;
}
let module01State={};
function resetModule01State(){ module01State={}; }
function module01DistinctFrom(key,list){
  if(!Array.isArray(module01State[key])) module01State[key]=[];
  let available=list.map((_,i)=>i).filter(i=>!module01State[key].includes(i));
  if(!available.length){ module01State[key]=[]; available=list.map((_,i)=>i); }
  const index=pick(available); module01State[key].push(index); return {...list[index]};
}
function module01Decimal(num,den){
  const value=num/den;
  if(Math.abs(value-Math.round(value))<1e-10) return String(Math.round(value));
  return value.toFixed(3).replace(/0+$/,'').replace(/\.$/,'').replace('.',',');
}
function module01Reduced(num,den){
  const g=GCD(num,den); return {num:num/g,den:den/g};
}
function module01FracLatex(num,den){ return '\\dfrac{'+num+'}{'+den+'}'; }
// Espaces autour de =, + , × et ÷ dans les formules (« 2,5 = » et non « 2,5= »).
function module01TidyLatex(latex){
  return String(latex)
    .replace(/\s*=\s*/g,' = ')
    .replace(/\s*\+\s*/g,' + ')
    .replace(/\s*\\times\s*/g,' \\times ')
    .replace(/\s*\\div\s*/g,' \\div ');
}
function module01Tidy(text){
  // Formules : espaces autour des signes. Texte : espace insécable avant « : », « ? », « ! » et « ; ».
  return String(text||'').split(/(\$\$[\s\S]*?\$\$)/).map(part=>/^\$\$[\s\S]*\$\$$/.test(part)
    ?'$$'+module01TidyLatex(part.slice(2,-2))+'$$'
    :part.replace(/ ([:?!;])(?=\s|$|<)/g,' $1')).join('');
}
// Vrai si num/den a une écriture décimale finie (dénominateur réduit fait de 2 et de 5).
function module01Terminating(num,den){
  let d=module01Reduced(num,den).den;
  while(d%2===0) d/=2;
  while(d%5===0) d/=5;
  return d===1;
}
function module01Frac(num,den){ return '$$'+module01FracLatex(num,den)+'$$'; }
function module01Num(value){ return '$$'+value+'$$'; }
// Nombre décimal (chaîne « 1,25 ») → nombre de dixièmes ou de centièmes.
function module01DecimalParts(dec){
  const [intPart,decPart='']=String(dec).split(',');
  const places=decPart.length, den=Math.pow(10,places);
  const num=Number(intPart)*den+Number(decPart||0);
  return {intPart:Number(intPart),decPart,places,num,den};
}
function module01PlaceName(places,count=2){
  return places===1?(count>1?'dixièmes':'dixième'):(count>1?'centièmes':'centième');
}
// Compare deux décimaux rang par rang et dit pourquoi : « 5 dixièmes > 4 dixièmes ».
function module01RankReason(a,b){
  const split=t=>{const [i,d='']=String(t).split(',');return [Number(i),Number(d[0]||0),Number(d[1]||0)];};
  const A=split(a),B=split(b),names=[['unité','unités'],['dixième','dixièmes'],['centième','centièmes']];
  for(let k=0;k<3;k++) if(A[k]!==B[k]){
    const w=n=>n+' '+(n>1?names[k][1]:names[k][0]);
    return w(A[k])+(A[k]<B[k]?' &lt; ':' &gt; ')+w(B[k]);
  }
  return '';
}
function module01QcmFrom(correct,distractors){
  // distractors : [{value,code,feedback}] déjà distincts entre eux et de la bonne réponse.
  const items=shuffleLocal([{value:correct,code:null,feedback:''},...distractors.slice(0,3)]);
  const correctIndex=String(items.findIndex(item=>item.value===correct)+1);
  const feedback={};
  items.forEach((item,index)=>{ if(item.feedback) feedback[String(index+1)]=item.feedback; });
  return {options:items.map(item=>item.value),codes:items.map(item=>item.code),correctIndex,feedback};
}
function module01PickDistinct(candidates,isCorrect,count=3){
  const out=[], seen=new Set();
  candidates.forEach(candidate=>{
    if(!candidate||out.length>=count) return;
    const key=String(candidate.key??candidate.value);
    if(seen.has(key)||isCorrect(candidate)) return;
    seen.add(key); out.push(candidate);
  });
  return out;
}
// Distracteurs « fraction → décimal » : chacun correspond à une erreur nommée.
function module01OfficialDecimalDistractors(num,den,dec){
  const F=module01Frac(num,den);
  const comma=num+','+den, dual='0,'+num+den;
  const list={
    '1/2':[[comma,'E1','La barre de fraction n’est pas une virgule : '+F+' n’est pas '+comma+'.'],['0,2','E-den','0,2 vaut '+module01Frac(1,5)+' : le dénominateur 2 n’est pas le chiffre des dixièmes.'],['2','E6','2 vaut '+module01Frac(2,1)+' : tu as inversé numérateur et dénominateur.']],
    '1/4':[[comma,'E1','La barre de fraction n’est pas une virgule : '+F+' n’est pas '+comma+'.'],['0,4','E-den','0,4 vaut 4 dixièmes : le dénominateur 4 n’est pas le chiffre des dixièmes.'],['4','E6','4 vaut '+module01Frac(4,1)+' : tu as inversé numérateur et dénominateur.']],
    '3/4':[[comma,'E1','La barre de fraction n’est pas une virgule : '+F+' n’est pas '+comma+'.'],[dual,'E3',''+F+' n’est pas 0,34 : on ne recopie pas les deux nombres après la virgule.'],['0,25','E-comp','0,25 vaut un seul quart, '+module01Frac(1,4)+'. Ici, il y a 3 quarts.']],
    '3/2':[[comma,'E1','La barre de fraction n’est pas une virgule : '+F+' n’est pas '+comma+'.'],['0,5','E2','0,5 vaut un seul demi. '+F+' est plus grand que 1 : tu as oublié l’unité.'],[dual,'E3',''+F+' est plus grand que 1 : sa valeur ne commence pas par 0,…']],
    '4/2':[[comma,'E1','La barre de fraction n’est pas une virgule : '+F+' n’est pas '+comma+'.'],['8','E-mult','8 = 4 × 2 : 4 demis ne font pas 8 unités.'],['0,5','E2','0,5 vaut un seul demi. 4 demis font plus que 1.']],
    '5/2':[[comma,'E1','La barre de fraction n’est pas une virgule : '+F+' n’est pas '+comma+'.'],['0,5','E2','0,5 vaut un seul demi. '+F+' est plus grand que 1 : tu as oublié les unités.'],[dual,'E3','5 demis font plus que 1 : la valeur ne commence pas par 0,…']],
    '1/10':[['10','E6','10 vaut '+module01Frac(10,1)+' : tu as inversé numérateur et dénominateur.'],['0,01','E4','0,01 vaut un centième, '+module01Frac(1,100)+'.'],['1,1','E1','La barre de fraction n’est pas une virgule.']],
    '1/100':[['0,1','E4','0,1 vaut un dixième, '+module01Frac(1,10)+'. Un centième s’écrit avec un zéro de plus.'],['100','E6','100 vaut '+module01Frac(100,1)+' : tu as inversé numérateur et dénominateur.'],['0,001','E4b','0,001 vaut un millième, pas un centième.']],
    '100/100':[['100','E-num','100 centièmes ne font pas 100 unités.'],['0,01','E4','0,01 vaut un seul centième. Ici, il y a 100 centièmes.'],['10','E-num','100 centièmes ne font pas 10 unités.']]
  };
  let rows=list[num+'/'+den];
  if(den===1) rows=[[num+',1','E1','La barre de fraction n’est pas une virgule.'],['0,'+num,'E-den1','Le dénominateur 1 ne partage pas l’unité : '+F+' n’est pas plus petit que 1.'],['1','E-un',''+F+' compte '+num+' unités, pas une seule.']];
  return (rows||[]).map(([value,code,feedback])=>({value,code,feedback}));
}
function module01ImproperDecimalDistractors(num,den,dec){
  const whole=Math.floor(num/den), rest=num-whole*den, F=module01Frac(num,den);
  const candidates=[
    {value:num+','+den,code:'E1',feedback:'La barre de fraction n’est pas une virgule : '+F+' n’est pas '+num+','+den+'.'},
    {value:module01Decimal(rest,den),code:'E2',feedback:module01Decimal(rest,den)+' vaut seulement '+module01Frac(rest,den)+' : tu as oublié '+(whole>1?'les '+whole+' unités':'l’unité')+'.'},
    {value:whole+','+rest,code:'E5',feedback:module01Frac(rest,den)+' ne vaut pas 0,'+rest+' : '+module01Frac(rest,den)+' = '+module01Decimal(rest,den)+'.'},
    {value:den+','+num,code:'E1b',feedback:'La barre de fraction n’est pas une virgule.'}
  ];
  return module01PickDistinct(candidates,item=>item.value===dec);
}
// Distracteurs « décimal → fraction » (QCM de type 4).
function module01FractionDistractors(num,den){
  const dec=module01Decimal(num,den), parts=module01DecimalParts(dec), D='$$'+dec+'$$';
  const digits=String(parts.num), equal=(n,d)=>d>0&&n*den===num*d;
  const frac=(n,d)=>'\\dfrac{'+n+'}{'+d+'}';
  const candidates=[];
  // Lecture des chiffres : la virgule prise pour une barre de fraction.
  if(digits.length>=2){
    const n=Number(digits.slice(0,-1)), d=Number(digits.slice(-1));
    if(n>0&&d>0) candidates.push({value:frac(n,d),key:n+'/'+d,code:'E-virgule',feedback:'Une virgule n’est pas une barre de fraction : '+module01Frac(n,d)+' = '+module01Decimal(n,d)+'.'});
  } else if(Number(digits)>1){
    const d=Number(digits);
    candidates.push({value:frac(1,d),key:'1/'+d,code:'E-confusion',feedback:module01Frac(1,d)+' = '+module01Decimal(1,d)+' : ne confonds pas 0,'+d+' et '+module01Frac(1,d)+'.'});
  }
  // Mauvais rang : dixièmes et centièmes échangés.
  const wrongDen=parts.places===2?10:100;
  candidates.push({value:frac(parts.num,wrongDen),key:parts.num+'/'+wrongDen,code:'E3',feedback:module01Frac(parts.num,wrongDen)+' = '+module01Decimal(parts.num,wrongDen)+' : '+dec+' se lit en '+module01PlaceName(parts.places)+'.'});
  // Inversion.
  candidates.push({value:frac(den,num),key:den+'/'+num,code:'E6',feedback:'Tu as inversé les deux nombres : '+module01Frac(den,num)+(module01Terminating(den,num)?' = '+module01Decimal(den,num)+'.':(num<den?' est plus grand que 1.':' est plus petit que 1.'))});
  // Oubli des unités.
  if(parts.intPart>=1){
    const r=module01Reduced(num-parts.intPart*den,den);
    candidates.push({value:frac(r.num,r.den),key:r.num+'/'+r.den,code:'E2',feedback:module01Frac(r.num,r.den)+' = '+module01Decimal(r.num,r.den)+' : tu as oublié '+(parts.intPart>1?'les '+parts.intPart+' unités':'l’unité')+'.'});
  }
  candidates.push({value:frac(parts.num,1000),key:parts.num+'/1000',code:'E4',feedback:module01Frac(parts.num,1000)+' = '+module01Decimal(parts.num,1000)+'.'});
  return module01PickDistinct(candidates,item=>{const [n,d]=item.key.split('/').map(Number);return equal(n,d);});
}
// QCM de type 16 : 0,n ; 0,0n ; 0,ab → quelle fraction ?
function module01PlaceFractionDistractors(parts){
  const frac=(n,d)=>'\\dfrac{'+n+'}{'+d+'}', N=parts.num, dec=module01Decimal(parts.num,parts.den);
  const candidates=[];
  if(parts.places===1){
    candidates.push({value:frac(N,100),key:N+'/100',code:'E3',feedback:module01Frac(N,100)+' = '+module01Decimal(N,100)+' : '+dec+' se lit en dixièmes.'});
    if(N>1) candidates.push({value:frac(1,N),key:'1/'+N,code:'E-confusion',feedback:'Ne confonds pas '+dec+' et '+module01Frac(1,N)+' : '+dec+' vaut '+N+' dixièmes.'});
    candidates.push({value:frac(10,N),key:'10/'+N,code:'E6',feedback:'Tu as inversé les deux nombres : '+module01Frac(10,N)+' est plus grand que 1.'});
    candidates.push({value:frac(N,1000),key:N+'/1000',code:'E4',feedback:module01Frac(N,1000)+' = '+module01Decimal(N,1000)+'.'});
  } else if(N<10){
    candidates.push({value:frac(N,10),key:N+'/10',code:'E4',feedback:module01Frac(N,10)+' = 0,'+N+' : le zéro de '+dec+' compte, '+N+' est au rang des centièmes.'});
    candidates.push({value:frac(N,1000),key:N+'/1000',code:'E4b',feedback:module01Frac(N,1000)+' = '+module01Decimal(N,1000)+' : c’est un millième, pas un centième.'});
    candidates.push({value:frac(100,N),key:'100/'+N,code:'E6',feedback:'Tu as inversé les deux nombres : '+module01Frac(100,N)+' est plus grand que 1.'});
  } else {
    candidates.push({value:frac(N,10),key:N+'/10',code:'E3',feedback:module01Frac(N,10)+' = '+module01Decimal(N,10)+' : '+dec+' se lit en centièmes.'});
    const a=Math.floor(N/10), b=N%10;
    if(a>0&&b>0) candidates.push({value:frac(a,b),key:a+'/'+b,code:'E-virgule',feedback:'Une virgule n’est pas une barre de fraction : '+module01Frac(a,b)+' n’est pas '+dec+'.'});
    candidates.push({value:frac(N,1000),key:N+'/1000',code:'E4b',feedback:module01Frac(N,1000)+' = '+module01Decimal(N,1000)+' : c’est des millièmes.'});
  }
  return module01PickDistinct(candidates,item=>{const [n,d]=item.key.split('/').map(Number);return n*parts.den===parts.num*d;});
}

// ----- Corrections, indices et dessins d'aide (contrat de la refonte, §1) -----
function module01F2DSteps(num,den,dec){
  const F=module01Frac(num,den), D='$$'+dec+'$$';
  // Lignes courtes : la carte « Comment on trouve » du téléphone tient en 170 px environ.
  if(den===1) return ['Le dénominateur 1 ne partage pas l’unité : $$'+module01FracLatex(num,den)+'='+dec+'$$'];
  if(num===den) return [num+' '+module01PlaceWord(den,num)+' font une unité : $$'+module01FracLatex(num,den)+'=1$$'];
  // Dixièmes et centièmes, comme dans le cours : « 9/100 = 9 centièmes = 0,09 ».
  if((den===10||den===100)&&num<den) return [F+' = '+num+' '+module01PlaceName(den===10?1:2,num)+' = '+D];
  if(num>den){
    const whole=Math.floor(num/den), rest=num-whole*den;
    if(rest===0){
      const groups=Array.from({length:whole},()=>module01FracLatex(den,den)).join('+');
      return [den+' '+module01PlaceWord(den,den)+' font 1 unité.','$$'+module01FracLatex(num,den)+'='+groups+'='+Array.from({length:whole},()=>'1').join('+')+'='+whole+'$$'];
    }
    return [
      den+' '+module01PlaceWord(den,den)+' font 1 unité : $$'+module01FracLatex(num,den)+'='+module01FracLatex(whole*den,den)+'+'+module01FracLatex(rest,den)+'$$',
      '$$'+module01FracLatex(num,den)+'='+whole+'+'+module01Decimal(rest,den)+'='+dec+'$$'
    ];
  }
  // Fraction plus petite que 1 : une fraction égale de dénominateur 10 ou 100.
  const target=100%den===0&&(den===2||den===5)?10:100, k=target/den;
  return [
    'On écrit une fraction égale de dénominateur '+target+'.',
    '$$'+module01FracLatex(num,den)+'='+module01FracLatex(num+'\\times'+k,den+'\\times'+k)+'='+module01FracLatex(num*k,target)+'='+dec+'$$'
  ];
}
function module01PlaceWord(den,count=2){
  const plural=count>1;
  const words={1:['unité','unités'],2:['demi','demis'],4:['quart','quarts'],5:['cinquième','cinquièmes'],10:['dixième','dixièmes'],100:['centième','centièmes']};
  const word=words[den]||[den+'e',den+'es'];
  return plural?word[1]:word[0];
}
// Fraction affichée en correction : la lecture en dixièmes ou centièmes (8/100),
// simplifiée seulement quand on retrouve un repère (dénominateur 2, 4 ou 5 : 3/4, 5/2, 2/5).
function module01D2FShown(dec,reduced){
  const parts=module01DecimalParts(dec);
  return reduced.den<=5&&reduced.den<parts.den?{num:reduced.num,den:reduced.den,simplified:true}:{num:parts.num,den:parts.den,simplified:false};
}
function module01D2FSteps(dec,reduced){
  const parts=module01DecimalParts(dec), D='$$'+dec+'$$', place=module01PlaceName(parts.places,parts.num);
  // Comme dans le cours : « 0,75 = 75 centièmes = 75/100 », puis la simplification si elle mène à un repère.
  const lines=[D+' = '+parts.num+' '+place+' = $$'+module01FracLatex(parts.num,parts.den)+'$$'];
  const shown=module01D2FShown(dec,reduced);
  if(shown.simplified) lines.push('On simplifie par '+(parts.den/shown.den)+' : $$'+module01FracLatex(parts.num,parts.den)+'='+module01FracLatex(shown.num,shown.den)+'$$');
  return lines;
}
function module01D2FAide(dec){
  const parts=module01DecimalParts(dec);
  const where=parts.places===1?'Le chiffre après la virgule est au rang des dixièmes.':'Le deuxième chiffre après la virgule est au rang des centièmes.';
  return [where, '$$'+dec+'$$ se lit en '+module01PlaceName(parts.places)+'. Un '+module01PlaceName(parts.places,1)+' s’écrit $$'+module01FracLatex(1,parts.den)+'$$.'];
}
function module01F2DAide(num,den){
  const F=module01Frac(num,den);
  if(den===1) return [F+' : l’unité n’est pas partagée, chaque part est une unité entière.','Combien d’unités entières y a-t-il ?'];
  if(num===den) return ['Regarde le dénominateur : en combien de parts l’unité est-elle partagée ?','Combien de parts faut-il pour faire une unité entière ?'];
  if(den===10||den===100){
    const places=den===10?1:2;
    return ['Le dénominateur '+den+' indique des '+module01PlaceName(places)+' : '+F+' = '+num+' '+module01PlaceName(places,num)+'.', places===1?'Les dixièmes s’écrivent au 1<sup>er</sup> rang après la virgule.':'Les centièmes s’écrivent au 2<sup>e</sup> rang après la virgule.'];
  }
  if(num>den) return ['Combien de '+module01PlaceWord(den)+' font une unité ?','Écris '+F+' comme une somme : des unités entières + ce qui reste.'];
  return ['Cherche une fraction égale avec 10 ou 100 au dénominateur.','Par combien multiplier '+den+' pour obtenir '+(den===2||den===5?'10':'100')+' ?'];
}
function module01AideVisual(data){
  // Dessin du panneau d'aide : jamais la réponse (aucun « 1 » écrit sur les unités).
  const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('arithmetic.fraction-decimal-grid');
  if(!component||!data||(!data.kind&&(!data.visualKind||data.visualKind==='none'))) return '';
  // Au plus 180 px de haut dans le panneau (22 % de la hauteur sur un petit écran) : le dessin
  // et les indices tiennent ensemble à l'écran.
  const html=component.render(data,false), box=html.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const ratio=box?Number(box[1])/Number(box[2]):2;
  const maxWidth='min('+Math.round(180*ratio)+'px,'+(22*ratio).toFixed(1)+'vh)';
  return html.replace(/^<div class="module01-visual([^"]*)"/,'<div class="module01-visual$1" style="max-width:'+maxWidth+';width:100%;margin:0 auto"');
}

function makeModule01Instance(mod,q){
  const kind=q.options.module01_kind, format=q.options.module01_format;
  let num=1,den=2,direction='f2d',visualKind='grouped';
  let qcm=null, prompt='', display='', answers=[], equality='', extra={};
  let steps=[], note='', aide=[], feedback=null, fractionPolicy='exact';

  if(kind==='fixed_f2d'){
    const e=module01DistinctFrom('fixedF2D',MODULE01_OFFICIAL_F2D);
    num=e.num; den=e.den;
    if(den===1) num=pick([2,3,5,6,7,8,9]);
    // Pas de dessin quand la fraction vaut un entier (n/1, 4/2, 100/100) : compter les unités donnerait la réponse.
    visualKind=num%den===0?'none':((den===10||den===100)?'place-empty':'grouped');
  } else if(kind==='fixed_d2f'){
    const e=module01DistinctFrom('fixedD2F',MODULE01_OFFICIAL_D2F); num=e.num; den=e.den; direction='d2f';
  } else if(kind==='benchmark_d2f'){
    const e=module01DistinctFrom('qcmD2F',MODULE01_QCM_D2F); num=e.num; den=e.den; direction='d2f';
  } else if(kind==='tenths_f2d'){
    num=RD(1,9); den=10; visualKind='place-empty';
  } else if(kind==='hundredths_f2d'){
    // Un tirage sur trois travaille le zéro de position (9/100 = 0,09).
    if(rnd()<1/3) num=RD(1,9); else do{num=RD(11,99);}while(num%10===0);
    den=100; visualKind='place-empty';
  } else if(kind==='benchmark_improper_f2d'){
    const e=pick([{n:3,d:2},{n:5,d:2},{n:7,d:2},{n:5,d:4},{n:7,d:4},{n:9,d:4}]);
    num=e.n; den=e.d; visualKind='bar';
  } else if(kind==='improper_f2d'){
    den=pick([2,4,4,10]);
    do{num=RD(den+1,3*den-1);}while(num%den===0||(den===4&&num%2===0));
    visualKind='bar';
  } else if(kind==='reducible_f2d'){
    // Il faut simplifier pour retrouver un repère (1/2, 1/4, 3/4, 3/2, 5/2) ; 50/100 ou 75/100 se lisent
    // directement en centièmes (type 6), ils ne sont plus ici.
    const e=pick([{n:2,d:4},{n:3,d:6},{n:4,d:8},{n:2,d:8},{n:3,d:12},{n:5,d:20},{n:6,d:8},{n:9,d:12},{n:15,d:20},{n:6,d:4},{n:10,d:4}]);
    num=e.n; den=e.d; visualKind=den===20?'neutral':'bar';
  } else if(kind==='tenths_d2f'){
    num=RD(1,9); den=10; direction='d2f';
  } else if(kind==='place_d2f'){
    const r=rnd(); direction='d2f';
    if(r<1/3){ num=RD(1,9); den=10; }
    else if(r<2/3){ num=RD(1,9); den=100; }
    else { do{num=RD(11,99);}while(num%10===0); den=100; }
  } else if(kind==='hundredths_d2f'){
    if(rnd()<0.3) num=RD(1,9); else do{num=RD(11,99);}while(num%10===0);
    den=100; direction='d2f';
  } else if(kind==='improper_d2f'){
    const whole=RD(1,3), part=pick([{n:1,d:2},{n:1,d:4},{n:3,d:4},{n:RD(1,9,[5]),d:10}]);
    num=whole*part.d+part.n; den=part.d; direction='d2f';
  }

  const reduced=module01Reduced(num,den);
  let dec=module01Decimal(num,den);
  const F=module01Frac(num,den);
  let visualData=null, correctionVisualData=null;

  const special=['compare','sum_f2d','extreme'].includes(kind);
  if(!special&&direction==='f2d'){
    steps=module01F2DSteps(num,den,dec);
    aide=module01F2DAide(num,den);
    // Notes en texte seul (sans fraction empilée) : elles tiennent sur une ligne dans la carte.
    if(num>den&&den>1&&den<10) note='Attention : la barre de fraction n’est pas une virgule, ce n’est pas '+num+','+den+'.';
    else if(den===100&&num<10) note='Attention : le '+num+' s’écrit au rang des centièmes. 0,'+num+' vaut '+num+' '+module01PlaceName(1,num)+'.';
    // QCM : la phrase du piège choisi suffit.
    if(format==='qcm') note='';
    else if(kind==='reducible_f2d') note='';
    if(kind==='reducible_f2d'){
      const g=GCD(num,den);
      steps=['On simplifie par '+g+' : $$'+module01FracLatex(num,den)+'='+module01FracLatex(reduced.num,reduced.den)+'$$'].concat(module01F2DSteps(reduced.num,reduced.den,dec).slice(-1));
      aide=['Simplifie d’abord la fraction : divise le numérateur et le dénominateur par un même nombre.','Tu dois retrouver une fraction à connaître : '+module01Frac(1,2)+', '+module01Frac(1,4)+', '+module01Frac(3,4)+', '+module01Frac(3,2)+' ou '+module01Frac(5,2)+'.'];
    }
    if(format==='open'){
      prompt='Donne l’écriture décimale de '+F+'.';
      display='$$'+module01FracLatex(num,den)+' = [[dec]]$$'; answers=[dec];
    } else if(format==='qcm'){
      prompt='Quelle est l’écriture décimale de '+F+'&nbsp;?';
      display='';
      const distractors=kind==='fixed_f2d'?module01OfficialDecimalDistractors(num,den,dec):module01ImproperDecimalDistractors(num,den,dec);
      qcm=module01QcmFrom(dec,distractors); answers=[qcm.correctIndex]; feedback=qcm.feedback;
    } else {
      const wrong=module01ImproperDecimalDistractors(num,den,dec);
      const truth=rnd()<0.5, shownItem=truth?null:pick(wrong.slice(0,3));
      const shown=truth?dec:shownItem.value;
      equality='$$'+module01FracLatex(num,den)+' = '+shown+'$$'; display=equality;
      prompt='Cette égalité est-elle vraie&nbsp;?';
      qcm={options:['Vrai','Faux'],codes:[null,truth?null:shownItem.code],correctIndex:truth?'1':'2'}; answers=[qcm.correctIndex];
      // Le verdict tient sur la dernière ligne du calcul.
      steps=steps.slice(0,-1).concat([steps[steps.length-1]+(truth?' : l’égalité est vraie.':', et non '+shown+' : l’égalité est fausse.')]);
      // Le verdict et la phrase du piège disent déjà « ce n’est pas 3,2 » : pas de note en plus.
      note='';
      feedback=truth?{'2':'Si : '+F+' vaut bien '+dec+'.'}:{'1':shownItem.feedback};
      extra.truth=truth; extra.shown=shown;
    }
    visualData={num,den,reduced,visualKind,dec};
    correctionVisualData=visualKind==='place-empty'?{kind:'place-value',value:dec}:(visualKind==='none'?null:{num,den,reduced,visualKind,showUnits:true});
  } else if(!special&&direction==='d2f'){
    fractionPolicy='equivalent';
    steps=module01D2FSteps(dec,reduced);
    aide=module01D2FAide(dec);
    const D='$$'+dec+'$$';
    if(format==='open'){
      prompt='Écris '+D+' sous forme de fraction.';
      const parts=module01DecimalParts(dec), shown=module01D2FShown(dec,reduced);
      display='$$'+dec+' = [[frac-simp]]$$'; answers=[String(shown.num),String(shown.den)];
      note=shown.simplified?'Les deux fractions sont justes.':'';
    } else {
      prompt='Quelle fraction est égale à '+D+'&nbsp;?';
      display='';
      const parts=module01DecimalParts(dec);
      const correct=kind==='place_d2f'?module01FracLatex(parts.num,parts.den):module01FracLatex(reduced.num,reduced.den);
      const distractors=kind==='place_d2f'?module01PlaceFractionDistractors(parts):module01FractionDistractors(num,den);
      qcm=module01QcmFrom(correct,distractors); answers=[qcm.correctIndex]; feedback=qcm.feedback;
      if(kind==='place_d2f') steps=steps.slice(0,1);
    }
    // Question : tableau vide (dans quel rang est chaque chiffre ?) ; correction : tableau rempli.
    visualData={kind:'place-value',value:null};
    correctionVisualData={kind:'place-value',value:dec};
  } else if(kind==='compare'){
    // « Complète par <, = ou > » (sujet de référence n° 1, Q4 : comparer 7/4 et des décimaux).
    const e=pick([{n:1,d:2},{n:1,d:4},{n:3,d:4},{n:3,d:2},{n:5,d:2},{n:5,d:4},{n:7,d:4},{n:1,d:10}]);
    num=e.n; den=e.d; dec=module01Decimal(num,den);
    const F=module01Frac(num,den);
    const value=num/den, r=rnd();
    let other;
    if(r<0.25) other=value;
    else if(r<0.45&&den<10){
      // Piège : un décimal qui recopie les chiffres de la fraction (3/4 et 0,34 ; 5/2 et 5,2).
      other=num<den?Number('0.'+num+den):Number(num+'.'+den);
    }
    else {
      const deltas=value<0.5?[0.05,0.1,0.15]:[0.05,0.1,0.2,0.25];
      let tries=0;
      do{ other=Math.round((value+(rnd()<0.5?-1:1)*pick(deltas))*100)/100; tries++; }while((other<=0||Math.abs(other-value)<1e-9)&&tries<20);
      if(other<=0) other=Math.round((value+0.1)*100)/100;
    }
    // Piège visé : un décimal qui reprend les chiffres de la fraction (3/4 et 0,34 ; 5/2 et 2,5…).
    const otherText=String(Number(other.toFixed(2))).replace('.',',');
    const fractionLeft=rnd()<0.5;
    const sign=Math.abs(other-value)<1e-9?'=':(value<other?'<':'>');
    const shownSign=fractionLeft?sign:(sign==='<'?'>':(sign==='>'?'<':'='));
    const leftLatex=fractionLeft?module01FracLatex(num,den):otherText, rightLatex=fractionLeft?otherText:module01FracLatex(num,den);
    prompt='Complète par <span style="white-space:nowrap">&lt;, = ou &gt;</span>.';
    display='$$'+leftLatex+'$$[[compare]]$$'+rightLatex+'$$';
    const signs=['<','=','>'];
    qcm={options:signs,codes:[null,null,null],correctIndex:String(signs.indexOf(shownSign)+1),kind:'signs'};
    answers=[qcm.correctIndex];
    const sym=s=>s==='<'?'&lt;':(s==='>'?'&gt;':'=');
    const leftText=fractionLeft?F:'$$'+otherText+'$$', rightText=fractionLeft?'$$'+otherText+'$$':F;
    steps=[
      'En écriture décimale : '+F+' = $$'+dec+'$$.',
      (sign==='='?'$$'+dec+'$$ et $$'+otherText+'$$ sont égaux':'$$'+(fractionLeft?dec:otherText)+'$$ '+(shownSign==='<'?'&lt;':'&gt;')+' $$'+(fractionLeft?otherText:dec)+'$$ car '+module01RankReason(fractionLeft?dec:otherText,fractionLeft?otherText:dec))+', donc '+leftText+' '+sym(shownSign)+' '+rightText+'.'
    ];
    aide=['Écris d’abord '+F+' en écriture décimale.','Compare ensuite les deux décimaux : les unités, puis les dixièmes, puis les centièmes.'];
    feedback={};
    // Une phrase par piège : « = » (la fraction lue comme un décimal : 3/4 et 0,34) ; signe inversé
    // (le nombre le plus long n'est pas le plus grand : on écrit les deux avec deux décimales).
    const trap=('0,'+num+den)===otherText||(num+','+den)===otherText;
    const pad2=t=>{const [i,d='']=String(t).split(',');return i+','+(d+'00').slice(0,2);};
    signs.forEach((s,i)=>{
      if(s===shownSign) return;
      let text;
      if(sign==='=') text=F+' = '+dec+'&nbsp;: les deux nombres sont égaux.';
      else if(s==='=') text=trap?'La barre de fraction n’est pas une virgule : '+F+' n’est pas '+otherText+'.':F+' = '+dec+', ce n’est pas '+otherText+'.';
      else text='Avec deux chiffres après la virgule, compare '+pad2(fractionLeft?dec:otherText)+' et '+pad2(fractionLeft?otherText:dec)+'.';
      feedback[String(i+1)]=text;
    });
    if(trap) note='Attention : la barre de fraction n’est pas une virgule, ce n’est pas '+otherText+'.';
    extra={other,otherText,sign:shownSign,fractionLeft};
    visualData=null; correctionVisualData=null; visualKind='none';
    direction='compare';
  } else if(kind==='sum_f2d'){
    // « 1 + 3/100 » : sujet de référence n° 1, Q4.
    // Une fois sur quatre, trois termes : 2 + 6/10 + 3/100 (item voisin de l'évaluation DEPP de 4e).
    const whole=RD(1,3), r=rnd(), threeTerms=r<0.25, useHundredths=!threeTerms&&r<0.7, k=RD(1,9);
    den=useHundredths?100:10; num=k;
    if(threeTerms){
      const h=RD(1,9), total=whole+k/10+h/100;
      dec=String(Number(total.toFixed(2))).replace('.',',');
      const expr=whole+'+'+module01FracLatex(k,10)+'+'+module01FracLatex(h,100);
      // L'expression est longue : elle n'est écrite qu'une fois, sur la ligne de réponse.
      prompt='Donne l’écriture décimale de ce nombre.';
      display='$$'+expr+' = [[dec]]$$'; answers=[dec];
      steps=[
        module01Frac(k,10)+' = $$'+module01Decimal(k,10)+'$$ et '+module01Frac(h,100)+' = $$'+module01Decimal(h,100)+'$$',
        '$$'+expr+'='+whole+'+'+module01Decimal(k,10)+'+'+module01Decimal(h,100)+'='+dec+'$$'
      ];
      aide=['Écris chaque fraction en écriture décimale.','Les dixièmes vont au 1<sup>er</sup> rang après la virgule, les centièmes au 2<sup>e</sup>.'];
      extra={threeTerms:true,whole,tenths:k,hundredths:h};
    } else {
      const total=whole+k/den;
      dec=String(Number(total.toFixed(2))).replace('.',',');
      const expr=whole+'+'+module01FracLatex(k,den);
      prompt='Donne l’écriture décimale de $$'+expr+'$$.';
      display='$$'+expr+' = [[dec]]$$'; answers=[dec];
      const part=module01Decimal(k,den);
      steps=[
        module01Frac(k,den)+' = '+k+' '+module01PlaceName(useHundredths?2:1,k)+' = $$'+part+'$$',
        '$$'+expr+'='+whole+'+'+part+'='+dec+'$$'
      ];
      aide=['Écris d’abord '+module01Frac(k,den)+' en écriture décimale.',whole>1?'Ajoute ensuite les '+whole+' unités.':'Ajoute ensuite 1 unité.'];
      if(useHundredths) note='Attention : ce n’est pas '+whole+','+k+' ('+whole+','+k+' = '+whole+' unité'+(whole>1?'s':'')+' et '+k+' '+module01PlaceName(1,k)+').';
    }
    visualData={kind:'place-value',value:null}; correctionVisualData={kind:'place-value',value:dec};
    visualKind='place-empty'; direction='sum';
  } else if(kind==='extreme'){
    // « Quel est le plus grand (petit) nombre ? » : fractions et décimaux mélangés.
    const base=pick([{n:5,d:4},{n:3,d:2},{n:7,d:4},{n:5,d:2},{n:9,d:4}]);
    num=base.n; den=base.d;
    const whole=Math.floor(num/den), value=num/den;
    const askMax=rnd()<0.5;
    let items, tries=0;
    do{
      const k=RD(1,9), tenth=RD(1,9), hundredth=RD(11,99), sumDen=rnd()<0.6?100:10;
      items=[
        {label:module01FracLatex(num,den),value,display:module01Frac(num,den),decimal:module01Decimal(num,den)},
        {label:whole+'+'+module01FracLatex(k,sumDen),value:whole+k/sumDen,display:'$$'+whole+'+'+module01FracLatex(k,sumDen)+'$$',decimal:String(Number((whole+k/sumDen).toFixed(2))).replace('.',',')},
        {label:whole+','+tenth,value:whole+tenth/10,display:'$$'+whole+','+tenth+'$$',decimal:whole+','+tenth},
        {label:(hundredth%10===0?null:whole+','+String(hundredth)),value:whole+hundredth/100,display:'$$'+whole+','+hundredth+'$$',decimal:whole+','+hundredth}
      ];
      tries++;
    }while(tries<60&&(items.some(item=>!item.label)||new Set(items.map(item=>Math.round(item.value*100))).size<4||(()=>{const sorted=items.map(item=>item.value).sort((a,b)=>a-b);return sorted.some((v,i)=>i>0&&v-sorted[i-1]<0.04);})()));
    const best=items.reduce((acc,item)=>askMax?(item.value>acc.value?item:acc):(item.value<acc.value?item:acc),items[0]);
    const order=shuffleLocal(items.map((_,i)=>i));
    const shuffled=order.map(i=>items[i]);
    qcm={options:shuffled.map(item=>item.label),codes:shuffled.map(item=>item===best?null:'E-compare'),correctIndex:String(shuffled.indexOf(best)+1)};
    answers=[qcm.correctIndex];
    prompt=askMax?'Quel est le plus grand de ces nombres&nbsp;?':'Quel est le plus petit de ces nombres&nbsp;?';
    display='';
    const asDec=items.map(item=>item.display+' = $$'+item.decimal+'$$');
    steps=[
      'En écriture décimale : '+asDec.slice(0,2).join(' ; ')+'.',
      items.slice().sort((a,b)=>a.value-b.value).map(item=>'$$'+item.decimal+'$$').join(' &lt; ')+' : le plus '+(askMax?'grand':'petit')+' est '+best.decimal+'.'
    ];
    aide=['Écris chaque nombre en écriture décimale.','Compare d’abord les unités, puis les dixièmes, puis les centièmes.'];
    feedback={};
    // Les écritures décimales sont dans la correction : la phrase compare seulement les décimaux.
    shuffled.forEach((item,i)=>{ if(item!==best) feedback[String(i+1)]=item.decimal+' est '+(askMax?'plus petit':'plus grand')+' que '+best.decimal+'.'; });
    extra={items:items.map(item=>({label:item.label,value:item.value,decimal:item.decimal})),askMax};
    visualData=null; correctionVisualData=null; visualKind='none'; direction='extreme';
  }

  // Le dessin du sens décimal → fraction est un tableau de numération rempli (lecture des rangs).
  const aideHtml=visualData?module01AideVisual(visualData.kind?visualData:{...visualData}):'';
  const hasVisual=!!aideHtml;
  prompt=module01Tidy(prompt); display=module01Tidy(display); equality=module01Tidy(equality);
  if(qcm&&qcm.kind!=='signs') qcm.options=qcm.options.map(option=>['Vrai','Faux'].includes(option)?option:module01TidyLatex(option));
  if(feedback) Object.keys(feedback).forEach(key=>{feedback[key]=module01Tidy(feedback[key]);});
  return {
    module:mod,q,scope:{},answers,rawStatement:prompt,rawFooter:display,hasSvg:hasVisual,
    correctionSteps:steps.filter(Boolean).slice(0,3).map(module01Tidy),
    correctionNote:module01Tidy(note),
    distractorFeedback:feedback||null,
    aideSteps:aide.slice(0,2).map(module01Tidy),
    aideHtml,
    module01:{kind,format,direction,num,den,dec,reduced,visualKind,visualData,correctionVisualData,qcm,prompt,display,equality,fractionPolicy,extra}
  };
}


function fractionOpsReduce(num,den){
  const divisor=GCD(Math.abs(num),Math.abs(den));
  return {num:num/divisor,den:den/divisor};
}
function fractionOpsLatex(num,den){ return '\\dfrac{'+num+'}{'+den+'}'; }
function fractionOpsResultLatex(result){ return result.den===1?String(result.num):fractionOpsLatex(result.num,result.den); }
function fractionOpsQcm(options,correct){
  const shuffled=shuffleLocal(options);
  return {options:shuffled,correctIndex:String(shuffled.indexOf(correct)+1)};
}
function makeFractionOpsInstance(mod,q){
  const kind=q.options.fraction_ops_kind;
  const data={kind};
  let answers=[];

  if(kind==='simplify_simple'||kind==='simplify_harder'){
    const bases=kind==='simplify_simple'
      ? [{n:1,d:2},{n:2,d:3},{n:3,d:4},{n:3,d:5},{n:4,d:5},{n:5,d:6}]
      : [{n:2,d:5},{n:3,d:7},{n:4,d:9},{n:5,d:8},{n:5,d:9},{n:7,d:10}];
    const base=pick(bases);
    const possible=[2,3,4].filter(value=>base.d*value<=24);
    const factor=pick(possible.length?possible:[2]);
    data.num=base.n*factor;data.den=base.d*factor;
    data.result={num:base.n,den:base.d};
    answers=[String(base.n),String(base.d)];
  }

  if(kind==='compare_same_den'){
    const scenario=RD(0,2);
    let n1,d1,n2,d2,correct;
    if(scenario===0){
      d1=pick([2,3,4,5,6]);n1=RD(1,d1-1);
      const factors=[2,3].filter(factor=>d1*factor<=12),factor=pick(factors);
      n2=n1*factor;d2=d1*factor;correct='Elles sont égales';
    }else{
      d1=d2=pick([3,4,5,6,8,10,12]);
      if(scenario===1){ n1=RD(2,d1-1);n2=RD(1,n1-1); }
      else{ n1=RD(1,d1-2);n2=RD(n1+1,d1-1); }
    }
    const first=fractionOpsLatex(n1,d1),second=fractionOpsLatex(n2,d2);
    if(!correct) correct=n1/d1>n2/d2?first:second;
    Object.assign(data,{n1,d1,n2,d2,qcm:fractionOpsQcm([first,second,'Elles sont égales'],correct)});
    answers=[data.qcm.correctIndex];
  }

  if(kind==='compare_same_num'){
    const scenario=RD(0,2);
    let n1,d1,n2,d2,correct;
    if(scenario===0){
      d1=pick([2,3,4,5,6]);n1=RD(1,d1-1);
      const factors=[2,3].filter(factor=>d1*factor<=12),factor=pick(factors);
      n2=n1*factor;d2=d1*factor;correct='Elles sont égales';
    }else{
      d1=pick([3,4,5,6,8,10,12]);
      do{d2=pick([3,4,5,6,8,10,12]);}while(d2===d1);
      n1=n2=RD(1,Math.min(d1,d2)-1);
    }
    const first=fractionOpsLatex(n1,d1),second=fractionOpsLatex(n2,d2);
    if(!correct) correct=d1<d2?first:second;
    Object.assign(data,{n1,d1,n2,d2,qcm:fractionOpsQcm([first,second,'Elles sont égales'],correct)});
    answers=[data.qcm.correctIndex];
  }

  if(kind==='add_same_den'){
    const den=pick([3,4,5,6,8,10,12]);
    const a=RD(1,den-1),b=RD(1,den-a);
    const result=fractionOpsReduce(a+b,den);
    Object.assign(data,{a,b,den,result});answers=[String(result.num),String(result.den)];
  }

  if(kind==='subtract_same_den'){
    const den=pick([4,5,6,8,10,12]);
    const a=RD(2,den-1),b=RD(1,a-1);
    const result=fractionOpsReduce(a-b,den);
    Object.assign(data,{a,b,den,result});answers=[String(result.num),String(result.den)];
  }

  if(kind==='add_multiple_den'){
    const den1=pick([2,3,4,5,6]);
    const factor=pick([2,3]);
    const den2=den1*factor;
    const a=RD(1,den1-1),b=RD(1,den2-1);
    const converted=a*factor;
    const result=fractionOpsReduce(converted+b,den2);
    Object.assign(data,{a,b,den1,den2,factor,converted,result});answers=[String(result.num),String(result.den)];
  }

  if(kind==='multiply'){
    const den1=pick([2,3,4,5]),den2=pick([2,3,4,5]);
    const a=RD(1,den1-1),b=RD(1,den2-1);
    const result=fractionOpsReduce(a*b,den1*den2);
    Object.assign(data,{a,b,den1,den2,result});answers=[String(result.num),String(result.den)];
  }

  if(kind==='multiply_cancel'){
    const example=pick([
      {a:2,den1:3,b:9,den2:10},
      {a:3,den1:4,b:8,den2:5},
      {a:5,den1:6,b:9,den2:10},
      {a:4,den1:7,b:14,den2:9},
      {a:6,den1:5,b:15,den2:8}
    ]);
    const result=fractionOpsReduce(example.a*example.b,example.den1*example.den2);
    const crossA=GCD(example.a,example.den2);
    const crossB=GCD(example.b,example.den1);
    Object.assign(data,example,{
      result,crossA,crossB,
      reducedA:example.a/crossA,
      reducedDen2:example.den2/crossA,
      reducedB:example.b/crossB,
      reducedDen1:example.den1/crossB
    });
    answers=[String(result.num),String(result.den)];
  }

  if(kind==='divide_integer_unit'){
    const whole=RD(1,3),unitDen=pick([2,3,4,5,6,8,10]);
    const result=whole*unitDen;
    Object.assign(data,{whole,unitDen,result});answers=[String(result)];
  }

  if(kind==='divide_fraction'){
    const den1=pick([2,3,4,5,6]),den2=pick([2,3,4,5,6]);
    const a=RD(1,den1-1),b=RD(1,den2-1);
    const result=fractionOpsReduce(a*den2,den1*b);
    Object.assign(data,{a,b,den1,den2,result});answers=[String(result.num),String(result.den)];
  }

  if(kind==='divide_mixed'){
    if(rnd()<.5){
      const den=pick([2,3,4,5,6,8,10]),a=RD(1,den-1),k=pick([2,3,4,5]);
      const result=fractionOpsReduce(a,den*k);
      Object.assign(data,{orientation:'fraction_by_integer',a,den,k,result});
      answers=[String(result.num),String(result.den)];
    }else{
      const whole=RD(1,4),den=pick([2,3,4,5,6]),b=RD(1,den-1);
      const result=fractionOpsReduce(whole*den,b);
      Object.assign(data,{orientation:'integer_by_fraction',whole,b,den,result});
      answers=[String(result.num),String(result.den)];
    }
  }

  return {module:mod,q,scope:{},answers,rawStatement:q.statement||'',rawFooter:'',hasSvg:true,fractionOps:data};
}

function substitutionSignedValue(positiveOnly=false){
  if(positiveOnly||rnd()<.52) return RD(1,8);
  return RD(-8,-1);
}
function substitutionVariableLatex(variable){ return variable==='y'?'𝑦':'𝑥'; }
function substitutionIntegerLatex(value){ return String(value).replace('-', '−'); }
function substitutionNumberLatex(value){ return Number(value)<0?'('+substitutionIntegerLatex(value)+')':substitutionIntegerLatex(value); }
function substitutionSignedPart(value){ return Number(value)<0?'\\,−\\,'+Math.abs(value):'\\,+\\,'+value; }
function substitutionTerm(coefficient,variable,first=false){
  if(coefficient===0) return '';
  const sign=coefficient<0?'−':(first?'':'+');
  const magnitude=Math.abs(coefficient);
  return (first?'':'\\,'+sign+'\\,')+(magnitude===1?'':magnitude)+substitutionVariableLatex(variable);
}
function substitutionNumericTerm(coefficient,value){
  const sign=coefficient<0?'−':'+';
  return '\\,'+sign+'\\,'+Math.abs(coefficient)+'\\,\\times\\,'+substitutionNumberLatex(value);
}
function makeSubstitutionInstance(mod,q){
  const number=Number(q.n);
  const positiveOnly=document.getElementById('level').value==='5e';
  const data={kind:number};
  let expression='',substitution='',answer=0,prompt='Calcule la valeur de cette expression :';
  let x=substitutionSignedValue(positiveOnly),y=substitutionSignedValue(positiveOnly);

  if(number===1){
    const a=RD(2,6),b=RD(-9,9,[0]);answer=a*x+b;
    expression=a+substitutionVariableLatex('x')+substitutionSignedPart(b);
    substitution=a+'\\,\\times\\,'+substitutionNumberLatex(x)+substitutionSignedPart(b);
  }else if(number===2){
    const a=RD(2,5),b=RD(1,9);answer=a*x*x+b;
    expression=a+substitutionVariableLatex('x')+'^2'+substitutionSignedPart(b);
    substitution=a+'\\,\\times\\,'+substitutionNumberLatex(x)+'^2'+substitutionSignedPart(b);
  }else if(number===3){
    const b=RD(-5,5,[0]),c=RD(-9,9,[0]);answer=x*x+b*x+c;
    expression=substitutionVariableLatex('x')+'^2'+substitutionTerm(b,'x')+substitutionSignedPart(c);
    substitution=substitutionNumberLatex(x)+'^2'+substitutionNumericTerm(b,x)+substitutionSignedPart(c);
  }else if(number===4){
    const a=RD(10,30),b=RD(2,5);answer=a-b*x;
    expression=a+'\\,−\\,'+b+substitutionVariableLatex('x');
    substitution=a+'\\,−\\,'+b+'\\,\\times\\,'+substitutionNumberLatex(x);
  }else if(number===5){
    const a=RD(2,4);answer=a*x*x*x;
    expression=a+substitutionVariableLatex('x')+'^3';substitution=a+'\\,\\times\\,'+substitutionNumberLatex(x)+'^3';
  }else if(number===6){
    const a=RD(2,6),b=RD(2,6);answer=a*x+b*y;
    expression=a+substitutionVariableLatex('x')+'\\,+\\,'+b+substitutionVariableLatex('y');
    substitution=a+'\\,\\times\\,'+substitutionNumberLatex(x)+'\\,+\\,'+b+'\\,\\times\\,'+substitutionNumberLatex(y);
  }else if(number===7){
    x=pick([2,3,5]);const power=pick([3,4,5]);answer=Math.pow(x,power);
    expression=x+'^'+power;substitution=expression;Object.assign(data,{power});
  }else if(number===8){
    const a=RD(1,5);answer=Math.pow(x+a,2);
    expression='('+substitutionVariableLatex('x')+'\\,+\\,'+a+')^2';substitution='('+substitutionNumberLatex(x)+'\\,+\\,'+a+')^2';
  }else if(number===9){
    x=positiveOnly?RD(2,6):(rnd()<.52?RD(2,6):RD(-6,-2));answer=2*x*x;
    expression='2'+substitutionVariableLatex('x')+'^2';substitution='2\\,\\times\\,'+substitutionNumberLatex(x)+'^2';
    const options=shuffleLocal([answer,4*x*x,2*x]).map(String);
    data.qcm={options,correctIndex:String(options.indexOf(String(answer))+1)};
  }else if(number===10){
    x=RD(3,15);answer=x*x;prompt='Calcule l’aire d’un carré de côté '+x+' cm.';
    expression=x+'^2';substitution=expression;
  }else{
    const a=RD(2,6),b=RD(1,8);answer=a*(x+b);
    expression=a+'('+substitutionVariableLatex('x')+'\\,+\\,'+b+')';substitution=a+'\\,\\times\\,('+substitutionNumberLatex(x)+'\\,+\\,'+b+')';
  }

  Object.assign(data,{expression,substitution,answer,x,y,prompt});
  const answers=data.qcm?[data.qcm.correctIndex]:[String(answer)];
  return {module:mod,q,scope:{},answers,rawStatement:prompt,rawFooter:'',hasSvg:false,substitution:data};
}

function equationSignedInteger(value){ return String(value).replace('-', '−'); }
function equationVariable(){ return '𝑥'; }
function equationLinearTerm(coefficient){
  if(coefficient===0) return '';
  if(coefficient===1) return equationVariable();
  if(coefficient===-1) return '−'+equationVariable();
  return equationSignedInteger(coefficient)+equationVariable();
}
function equationExpression(coefficient,constant){
  let expression=equationLinearTerm(coefficient);
  if(constant!==0){
    if(!expression) expression=equationSignedInteger(constant);
    else expression+=(constant>0?' + ':' − ')+Math.abs(constant);
  }
  return expression||'0';
}
function equationEquality(leftCoefficient,leftConstant,rightCoefficient,rightConstant){
  return equationExpression(leftCoefficient,leftConstant)+' = '+equationExpression(rightCoefficient,rightConstant);
}
const EQUASPLAT_IMPORT_URL='https://mathsgo.re/outils/equasplat.html';
const EQUABARRE_IMPORT_URL='https://mathsgo.re/outils/equabarre.html';
function equabarreImportUrl(payload){
  return EQUABARRE_IMPORT_URL+'#data='+encodeURIComponent(JSON.stringify(payload));
}
function angleSumEquabarPayload(data){
  const values=Array.isArray(data&&data.values)?data.values.map(Number):[];
  const unknownIndexes=Array.isArray(data&&data.unknown)?data.unknown.map(Number):[];
  if(!values.length||!unknownIndexes.length||data.comparison) return null;
  const unknownValues=unknownIndexes.map(index=>values[index]);
  const x=unknownValues[0];
  if(!Number.isFinite(x)||x<=0||unknownValues.some(value=>Math.abs(value-x)>.0001)) return null;
  const unknown=new Set(unknownIndexes);
  return {
    source:'automatismes_triangle_angles',
    target:'equabarre_import',
    variable:'𝑥',
    unknownDisplay:'letter',
    fullscreenSize:'compact',
    lhsSide:'bottom',
    x,
    total:180,
    top:[{type:'number',value:180}],
    bottom:values.map((value,index)=>unknown.has(index)?{type:'x'}:{type:'number',value})
  };
}
function angleSumEquabarButtonHtml(data){
  const payload=angleSumEquabarPayload(data);
  if(!payload) return '';
  return '<div class="angle-bar-action-row"><a class="angle-bar-resolve-btn" href="'+escapeHtml(equabarreImportUrl(payload))+'" target="_blank" rel="noopener noreferrer" aria-label="Résoudre ce schéma dans ÉquaBarre import">Résoudre dans ÉquaBarre</a></div>';
}
function equationImportSide(coefficient,constant){
  const pieces=[];
  const sign=coefficient<0?-1:1;
  for(let i=0;i<Math.abs(coefficient);i++) pieces.push({type:'x',sign});
  if(constant!==0) pieces.push({type:'number',value:constant});
  // L'import ÉquaSplat exige au moins une pièce de chaque côté.
  // Une paire de jetons opposés représente proprement un membre égal à zéro.
  if(!pieces.length){
    pieces.push({type:'number',value:1},{type:'number',value:-1});
  }
  return pieces;
}
function equationImportUrl(data){
  const payload={
    source:'splat_equations',
    variable:equationVariable(),
    unknownDisplay:'letter',
    universe:'relative',
    numberMode:'grouped',
    signedWritingMode:'simplified',
    x:data.solution,
    left:equationImportSide(data.a,data.b),
    right:equationImportSide(data.c,data.d)
  };
  return EQUASPLAT_IMPORT_URL+'?data='+encodeURIComponent(JSON.stringify(payload));
}
function equationResolveButtonHtml(data){
  return '<a class="equation-resolve-btn" href="'+escapeHtml(equationImportUrl(data))+'" target="_blank" rel="noopener noreferrer" aria-label="Résoudre cette équation dans ÉquaSplat">Résoudre</a>';
}
function equationWithResolveHtml(data,className=''){
  return '<div class="equation-resolve-stack">'
    +'<div class="equation-resolve-button-row">'+equationResolveButtonHtml(data)+'</div>'
    +equationAlignedRowHtml(data.equation,className)
    +'</div>';
}
function equationChooseSigned(min=-12,max=12,excludeZero=false){
  const excluded=excludeZero?[0]:[];
  return RD(min,max,excluded);
}
function equationOppositeTermOperation(coefficient){
  if(coefficient>0) return '− '+equationLinearTerm(coefficient);
  return '+ '+equationLinearTerm(Math.abs(coefficient));
}
function equationOppositeConstantOperation(constant){
  return constant>0?'− '+constant:'+ '+Math.abs(constant);
}
function equationBuildResolution(a,b,c,d,solution){
  const steps=[equationEquality(a,b,c,d)];
  const operations=[];
  const variableOnLeft=a>c;
  const reducedCoefficient=Math.abs(a-c);
  let reducedConstant;
  const pushStep=(step,operation)=>{
    if(steps[steps.length-1]===step) return;
    operations.push(operation);
    steps.push(step);
  };

  if(variableOnLeft){
    if(c!==0) pushStep(equationEquality(reducedCoefficient,b,0,d),equationOppositeTermOperation(c));
    reducedConstant=d-b;
    if(b!==0) pushStep(equationEquality(reducedCoefficient,0,0,reducedConstant),equationOppositeConstantOperation(b));
  }else{
    if(a!==0) pushStep(equationEquality(0,b,reducedCoefficient,d),equationOppositeTermOperation(a));
    reducedConstant=b-d;
    if(d!==0) pushStep(equationEquality(0,reducedConstant,reducedCoefficient,0),equationOppositeConstantOperation(d));
  }

  const finalStep=variableOnLeft
    ?equationVariable()+' = '+equationSignedInteger(solution)
    :equationSignedInteger(solution)+' = '+equationVariable();
  pushStep(finalStep,reducedCoefficient===1?'':('÷ '+reducedCoefficient));
  return {steps,operations};
}
function equationUniqueOptions(correct,candidates,count=4){
  const values=[];
  [correct].concat(candidates).forEach(value=>{
    const key=String(value);
    if(!values.some(item=>String(item)===key)) values.push(value);
  });
  let offset=1;
  while(values.length<count){
    const value=Number(correct)+(offset%2?offset:-offset);
    if(!values.some(item=>String(item)===String(value))) values.push(value);
    offset++;
  }
  const options=shuffleLocal(values.slice(0,count));
  return {options,correctIndex:String(options.findIndex(value=>String(value)===String(correct))+1)};
}
function equationSafeAffine(signed=false){
  for(let tries=0;tries<80;tries++){
    const a=RD(2,5);
    const solution=signed?equationChooseSigned(-12,12,true):RD(1,10);
    const b=signed?equationChooseSigned(-12,12,true):RD(1,12);
    const d=a*solution+b;
    if(Math.abs(d)<=50) return {a,b,c:0,d,solution};
  }
  return {a:2,b:3,c:0,d:11,solution:4};
}
function makeEquationInstance(mod,q){
  const kind=q.options&&q.options.equation_kind||'mul_positive';
  const level=document.getElementById('level').value;
  const positiveOnly=level==='5e';
  let a=1,b=0,c=0,d=0,solution=1;
  let prompt='Résous cette équation.';
  let contextual=false,answerSuffix='',qcm=null;

  if(kind==='mul_positive'){
    a=RD(2,5);solution=RD(2,12);d=a*solution;
  }else if(kind==='add_positive'){
    solution=RD(2,15);b=RD(2,12);d=solution+b;
  }else if(kind==='sub_positive'){
    d=RD(1,15);b=-RD(2,12);solution=d-b;
  }else if(kind==='affine_positive'){
    ({a,b,c,d,solution}=equationSafeAffine(false));
  }else if(kind==='mul_signed'){
    a=RD(2,5);solution=equationChooseSigned(-12,12,true);d=a*solution;
  }else if(kind==='affine_signed'){
    ({a,b,c,d,solution}=equationSafeAffine(true));
  }else if(kind==='two_sided'){
    let valid=false;
    for(let tries=0;tries<100;tries++){
      a=RD(1,5);c=RD(1,5,[a]);solution=equationChooseSigned(-12,12,true);
      b=equationChooseSigned(-15,15);d=(a-c)*solution+b;
      if(Math.abs(d)<=50){valid=true;break;}
    }
    if(!valid){a=3;b=-4;c=1;d=8;solution=6;}
  }else if(kind==='opposite_one_side'){
    let valid=false;
    for(let tries=0;tries<100;tries++){
      a=-RD(1,5);c=RD(1,5);solution=equationChooseSigned(-10,10,true);
      b=equationChooseSigned(-15,15);d=(a-c)*solution+b;
      if(Math.abs(d)<=50){valid=true;break;}
    }
    if(!valid){a=-2;b=5;c=1;d=-7;solution=4;}
  }else if(kind==='qcm_solution'){
    const generated=positiveOnly?equationSafeAffine(false):equationSafeAffine(true);
    ({a,b,c,d,solution}=generated);
    const candidates=[-solution,d-b,d/a,solution+1,solution-1].map(value=>Number.isInteger(value)?value:Math.round(value));
    const choices=equationUniqueOptions(solution,candidates,4);
    qcm={kind:'solution',options:choices.options.map(value=>equationVariable()+' = '+equationSignedInteger(value)),correctIndex:choices.correctIndex};
    prompt='Quelle est la solution de cette équation ?';
  }else if(kind==='qcm_operation'){
    const operationKind=pick(['add','subtract','divide']);
    solution=RD(2,10);
    if(operationKind==='add'){
      a=RD(2,5);b=RD(2,10);d=a*solution+b;
    }else if(operationKind==='subtract'){
      a=RD(2,5);b=-RD(1,Math.min(10,a*solution-1));d=a*solution+b;
    }else{
      a=RD(2,5);b=0;d=a*solution;
    }
    const amount=Math.abs(b);
    const options=operationKind==='divide'
      ?['Diviser les deux membres par '+a,'Soustraire '+a+' aux deux membres','Multiplier les deux membres par '+a]
      :['Soustraire '+amount+' aux deux membres','Ajouter '+amount+' aux deux membres','Diviser les deux membres par '+a];
    const correct=operationKind==='add'?options[0]:operationKind==='subtract'?options[1]:options[0];
    const shuffled=shuffleLocal(options);
    qcm={kind:'operation',options:shuffled,correctIndex:String(shuffled.indexOf(correct)+1)};
    prompt='Quelle opération faut-il effectuer en premier ?';
  }else if(kind==='taxi_problem'){
    a=RD(2,5);b=RD(3,10);solution=RD(4,12);d=a*solution+b;
    prompt='Un taxi facture '+b+' € de prise en charge puis '+a+' € par kilomètre. La course coûte '+d+' €. Quelle distance a été parcourue ?';
    contextual=true;answerSuffix=' km';
  }else if(kind==='think_number'){
    a=RD(2,5);b=RD(2,12);solution=RD(1,12);d=a*solution+b;
    prompt='Je pense à un nombre. Je le multiplie par '+a+', puis j’ajoute '+b+'. J’obtiens '+d+'. Quel est ce nombre ?';
    contextual=true;
  }

  const equation=equationEquality(a,b,c,d);
  const resolution=equationBuildResolution(a,b,c,d,solution);
  const data={kind,a,b,c,d,solution,prompt,contextual,answerSuffix,qcm,equation,variableOnLeft:a>c,steps:resolution.steps,operations:resolution.operations};
  const answers=qcm?[qcm.correctIndex]:[String(solution)];
  return {module:mod,q,scope:{},answers,rawStatement:prompt,rawFooter:'',hasSvg:true,equationData:data};
}

const REDUCTION_ALWAYS_QCM=['already_reduced','product','sum_or_product','paren_factor_qcm'];
const REDUCTION_HALF_QCM=['one_no_cancel','one_cancel'];
function redSecondHint(groups,L){
  const types=['x2','x','u'];
  const repeated=types.find(type=>groups.filter(g=>g.type===type).length>=2);
  const families=new Set(groups.map(g=>g.type));
  if(families.size>1 && repeated){
    const members=groups.filter(g=>g.type===repeated).map((g,i)=>{const p=redPiece(g.coeff,redFamilyBody(g.type,L));return (p.sign==='−'?'−':(groups.indexOf(g)===0?'':'+'))+p.body;});
    return 'Ici, '+redFamilyName(repeated,L)+' sont '+members.slice(0,-1).join(', ')+' et '+members[members.length-1]+'.';
  }
  const negative=groups.find((g,i)=>g.coeff<0);
  if(negative){
    const body=redFamilyBody(negative.type,L);
    return 'Le signe fait partie du terme : −'+redMonoAbs(negative.coeff,body)+' a pour coefficient −'+Math.abs(negative.coeff)+'.';
  }
  const one=groups.find(g=>Math.abs(g.coeff)===1&&g.type!=='u');
  if(one) return redFamilyBody(one.type,L)+' seul compte pour 1'+redFamilyBody(one.type,L)+'.';
  return 'Commence par '+redPiecesText(redGroupsPieces(groups.slice(0,2),L))+'.';
}
function makeReductionInstance(mod,q){
  const kind=q.options.reduction_kind;
  const requested=q.options.reduction_format||'direct';
  const format=REDUCTION_ALWAYS_QCM.includes(kind)?'qcm':((requested==='qcm'&&REDUCTION_HALF_QCM.includes(kind))?'qcm':'direct');
  const qcmPrompt='Quelle est la forme réduite de cette expression ?';
  let L='x',pieces=[],groups=[],sums={x2:0,x:0,u:0},slotTypes=['x','u'],answer='',qcm=null,work=null,aideHtml=null,aide=[];
  let prompt=format==='qcm'?qcmPrompt:'Réduis l’expression :';

  if(['one_no_cancel','one_cancel','multi_no_cancel','multi_cancel','already_reduced'].includes(kind)){
    if(format==='qcm'){
      L=pick(['x','x','a','y','t']);
      groups=kind==='already_reduced'?makeAlreadyReducedQcmGroups():simpleQcmGroups(kind);
    } else {
      if(kind==='one_no_cancel') groups=makeOneNoCancel();
      if(kind==='one_cancel') groups=makeOneCancel();
      if(kind==='multi_no_cancel') groups=makeMultiNoCancel();
      if(kind==='multi_cancel') groups=makeMultiCancel();
    }
    sums=coeffSums(groups);
    pieces=redGroupsPieces(groups,L);
    slotTypes=['x2','x','u'].filter(type=>groups.some(g=>g.type===type));
    answer=redReducedText(sums,L);
    aideHtml=redFamiliesAideHtml(groups,L,true);
    if(kind==='already_reduced'){
      qcm=makeAlreadyReducedQcm(groups,L);
      answer=qcm.options[Number(qcm.correctIndex)-1];
      const t1=redMonomialText(groups[0].coeff,groups[0].type==='x2'?2:(groups[0].type==='x'?1:0),L);
      const t2=redMonomialText(groups[1].coeff,groups[1].type==='x2'?2:(groups[1].type==='x'?1:0),L);
      work={
        steps:[t1+' et '+t2+' ne sont pas de la même famille : on ne peut pas les regrouper.',redPiecesText(pieces)+' est déjà réduite. Écrite dans l’autre ordre : '+redFinalStrong(answer)+'.'],
        note:groups.some(g=>g.type==='u')
          ?'Attention : un nombre seul ne se regroupe pas avec des '+redFamilyBody(groups.find(g=>g.type!=='u').type,L)+'.'
          :'Attention : '+redLetter(L)+'² = '+redLetter(L)+' × '+redLetter(L)+' : ce n’est pas la même famille que '+redLetter(L)+'.'
      };
      aide=['On ne regroupe que des termes de la même famille : les '+redLetter(L)+'², les '+redLetter(L)+', les nombres.','Ici, '+t1+' et '+t2+' sont-ils de la même famille ?'];
    } else if(kind==='one_no_cancel'||kind==='one_cancel'){
      work=redOneFamilyCorrection(groups,L);
      if(format==='qcm') qcm=makeOneFamilyQcm(groups,L);
      aide=['Tous les termes sont des '+redFamilyBody(groups[0].type,L)+' : additionne leurs coefficients, avec leur signe.',redSecondHint(groups,L)];
    } else {
      work=redMultiCorrection(groups,L);
      aide=['Regroupe les termes de la même famille : les '+redLetter(L)+'² ensemble, les '+redLetter(L)+' ensemble, les nombres ensemble.',redSecondHint(groups,L)];
    }
  } else if(kind==='paren_factor'||kind==='paren_factor_qcm'){
    L=kind==='paren_factor_qcm'?pick(['a','a','y','t']):'x';
    const d=makeParenFactorData(L);
    work=parenFactorWork(d,L);
    pieces=work.pieces;
    sums={x2:0,x:d.cx,u:d.cu};
    answer=work.result;
    aide=work.aide;
    if(kind==='paren_factor_qcm') qcm=makeParenFactorQcm(d,L);
  } else if(kind==='opposite_paren'){
    const o=makeOppositeData();
    work=oppositeWork(o);
    pieces=work.pieces;
    sums={x2:0,x:o.cx,u:o.cu};
    answer=work.result;
    aide=work.aide;
  } else if(kind==='product'){
    const d=makeProductData();
    L=d.letter;
    work=productWork(d);
    pieces=[{sign:'+',body:work.expr}];
    answer=work.result;
    aide=work.aide;
    qcm=makeProductQcm(d);
    prompt='Quelle est la forme réduite de ce produit ?';
  } else if(kind==='sum_or_product'){
    const d=makeSumOrProductData();
    work=sumOrProductWork(d);
    pieces=[{sign:'+',body:work.expr}];
    answer=work.result;
    aide=work.aide;
    qcm=makeSumOrProductQcm(d);
  }
  if(qcm) prompt=kind==='product'?prompt:qcmPrompt;

  const inst={
    module:mod,
    q,
    scope:{},
    answers:qcm?[qcm.correctIndex]:[answer],
    rawStatement:prompt,
    rawFooter:'',
    hasSvg:false,
    correctionSteps:work.steps,
    aideSteps:aide,
    reduction:{
      kind,
      format:qcm?'qcm':'direct',
      letter:L,
      prompt,
      groups,
      sums,
      slotTypes,
      answer,
      exprText:redPiecesText(pieces),
      exprHtml:redPiecesHtml(pieces),
      qcmOptions:qcm?qcm.options:null,
      qcmCorrectIndex:qcm?qcm.correctIndex:null
    }
  };
  if(work.note) inst.correctionNote=work.note;
  if(qcm) inst.distractorFeedback=qcm.distractorFeedback;
  if(aideHtml) inst.aideHtml=aideHtml;
  return inst;
}
const SOLID_NAMES=['un cube','un pavé droit','un prisme droit','un cylindre','une pyramide','un cône','une sphère','une boule'];
function solidVisualForQuestion(q){
  const meta=q.options||{};
  if(!['drawing','count'].includes(meta.solid_category)) return null;
  const variants={
    1:{kind:'cube'},2:{kind:'cube',mirror:true},
    3:{kind:'cuboid'},4:{kind:'cuboid',variant:'tall'},
    5:{kind:'prism'},6:{kind:'prism',mirror:true},
    7:{kind:'cylinder'},8:{kind:'cylinder',rotation:90},
    9:{kind:'pyramid'},10:{kind:'pyramid',variant:'triangular'},
    11:{kind:'cone'},12:{kind:'cone',mirror:true},
    13:{kind:'sphere'},14:{kind:'sphere',mirror:true},
    22:{kind:'cube'},23:{kind:'cuboid'},24:{kind:'prism'},
    25:{kind:'pyramid'},26:{kind:'pyramid',variant:'pentagonal'},
    27:{kind:'prism',variant:'pentagonal'},28:{kind:'prism',variant:'pentagonal'},
    29:{kind:'pyramid',variant:'triangular'},30:{kind:'pyramid',variant:'pentagonal'}
  };
  return variants[Number(q.n)]||null;
}
function makeSolidsInstance(mod,q){
  const meta=q.options||{};
  let prompt=q.statement||'';
  let visualPrompt='Quel est le nom le plus précis de ce solide ?';
  let correct='';
  let distractors=[];

  if(meta.solid_kind==='count'){
    const elementIndex=Number.isInteger(meta.solid_element_index)
      ? meta.solid_element_index
      : RD(0,2);
    const elementQuestions=[
      'Combien de sommets possède ce solide ?',
      'Combien d’arêtes possède ce solide ?',
      'Combien de faces possède ce solide ?'
    ];
    correct=Number(meta.solid_counts[elementIndex]);
    visualPrompt=elementQuestions[elementIndex];
    prompt='<div class="solid-prompt">'+elementQuestions[elementIndex]+'</div>'+prompt;

    const closeValues=shuffleLocal([correct-1,correct+1,correct-2,correct+2]);
    const widerValues=shuffleLocal([4,5,6,7,8,9,10,11,12]);
    const seen=new Set([correct]);
    [...closeValues,...widerValues].forEach(value=>{
      if(value>0&&!seen.has(value)&&distractors.length<3){
        seen.add(value);
        distractors.push(value);
      }
    });
  }else{
    correct=meta.solid_answer;
    distractors=shuffleLocal(SOLID_NAMES.filter(name=>name!==correct)).slice(0,3);
  }

  const qcmOptions=shuffleLocal([correct,...distractors]);
  const correctIndex=String(qcmOptions.indexOf(correct)+1);
  return {
    module:mod,
    q,
    scope:{},
    answers:[correctIndex],
    rawStatement:prompt+'&&'+qcmOptions.join('&&')+'&&',
    rawFooter:'',
    hasSvg:true,
    solids:{prompt:visualPrompt,visual:solidVisualForQuestion(q)}
  };
}

function areaSvg(width,height,body,label){
  return '<svg class="area-svg" xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+escapeHtml(label)+'">'+body+'</svg>';
}
function areaUnit(){ return pick(['mm','cm','dm','m']); }
function areaSquaredUnit(unit){ return unit+'²'; }
function areaValue(value){ return fmt(CUT(value,2)); }
function areaRectangleDimensions(){
  const small=RD(3,9);
  const minimum=Math.ceil(small*1.2);
  const maximum=Math.max(minimum,Math.floor(small*2.4));
  return {L:RD(minimum,maximum,[small]),l:small};
}
function areaRectangleSvg(L,l,unit,isSquare=false){
  const maxW=250,maxH=135,scale=Math.min(maxW/L,maxH/l);
  const w=L*scale,h=l*scale,x=(360-w)/2,y=30+(maxH-h)/2;
  const fill=isSquare?'#fff3e6':'#eaf3ff';
  const stroke=isSquare?'#b85c00':'#1f5f99';
  let body='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2.4"/>';
  body+='<text x="180" y="'+(y+h+28)+'" font-family="Georgia, serif" font-size="18" text-anchor="middle" fill="#17384d">'+L+' '+unit+'</text>';
  if(!isSquare) body+='<text x="'+(x-12)+'" y="'+(y+h/2+6)+'" font-family="Georgia, serif" font-size="18" text-anchor="end" fill="#17384d">'+l+' '+unit+'</text>';
  return areaSvg(360,220,body,isSquare?'Carré avec son côté':'Rectangle avec ses dimensions');
}
function areaRectangleDiagonalSvg(L,l,d,unit){
  const maxW=250,maxH=135,scale=Math.min(maxW/L,maxH/l);
  const w=L*scale,h=l*scale,x=(360-w)/2,y=30+(maxH-h)/2;
  let body='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="2.4"/>';
  body+='<line x1="'+x+'" y1="'+(y+h)+'" x2="'+(x+w)+'" y2="'+y+'" stroke="#6040a0" stroke-width="2.2"/>';
  body+='<text x="180" y="'+(y+h+28)+'" font-family="Georgia, serif" font-size="17" text-anchor="middle" fill="#17384d">L = '+L+' '+unit+'</text>';
  body+='<text x="'+(x-10)+'" y="'+(y+h/2+6)+'" font-family="Georgia, serif" font-size="17" text-anchor="end" fill="#17384d">l = '+l+' '+unit+'</text>';
  body+='<rect x="'+(x+w/2-42)+'" y="'+(y+h/2-25)+'" width="84" height="24" rx="5" fill="white" fill-opacity=".92"/>';
  body+='<text x="'+(x+w/2)+'" y="'+(y+h/2-8)+'" font-family="Georgia, serif" font-size="17" text-anchor="middle" fill="#6040a0">d = '+d+' '+unit+'</text>';
  return areaSvg(360,220,body,'Rectangle avec sa longueur, sa largeur et sa diagonale');
}
function areaGeneralTriangleSvg(b,h,unit){
  const maxW=250,maxH=145,scale=Math.min(maxW/b,maxH/h);
  const w=b*scale,hp=h*scale,x=(360-w)/2,baseY=175;
  const footRatio=.25+rnd()*.5,footX=x+w*footRatio,apexY=baseY-hp;
  let body='<polygon points="'+x+','+baseY+' '+(x+w)+','+baseY+' '+footX+','+apexY+'" fill="#fff4e6" stroke="#b35c00" stroke-width="2.4" stroke-linejoin="round"/>';
  body+='<line x1="'+footX+'" y1="'+apexY+'" x2="'+footX+'" y2="'+baseY+'" stroke="#b35c00" stroke-width="2.2" stroke-dasharray="6 5"/>';
  body+='<polyline points="'+footX+','+(baseY-13)+' '+(footX+13)+','+(baseY-13)+' '+(footX+13)+','+baseY+'" fill="none" stroke="#b35c00" stroke-width="2"/>';
  body+='<text x="180" y="207" font-family="Georgia, serif" font-size="17" text-anchor="middle" fill="#17384d">base '+b+' '+unit+'</text>';
  body+='<rect x="'+(footX+11)+'" y="'+(apexY+hp/2-17)+'" width="88" height="24" rx="5" fill="white" fill-opacity=".9"/>';
  body+='<text x="'+(footX+17)+'" y="'+(apexY+hp/2)+'" font-family="Georgia, serif" font-size="17" fill="#17384d">h = '+h+' '+unit+'</text>';
  return areaSvg(360,220,body,'Triangle avec sa base et sa hauteur');
}
function areaTriangleSidesHeightSvg(data,unit){
  const b=data.b,h=data.h,foot=data.foot;
  const maxW=250,maxH=140,scale=Math.min(maxW/b,maxH/h);
  const w=b*scale,hp=h*scale,x=(360-w)/2,baseY=174,footX=x+foot*scale,apexY=baseY-hp;
  let body='<polygon points="'+x+','+baseY+' '+(x+w)+','+baseY+' '+footX+','+apexY+'" fill="#fff4e6" stroke="#b35c00" stroke-width="2.4" stroke-linejoin="round"/>';
  body+='<line x1="'+footX+'" y1="'+apexY+'" x2="'+footX+'" y2="'+baseY+'" stroke="#b35c00" stroke-width="2.1" stroke-dasharray="6 5"/>';
  body+='<polyline points="'+footX+','+(baseY-13)+' '+(footX+13)+','+(baseY-13)+' '+(footX+13)+','+baseY+'" fill="none" stroke="#b35c00" stroke-width="2"/>';
  body+='<text x="180" y="207" font-family="Georgia, serif" font-size="16" text-anchor="middle" fill="#17384d">b = '+b+' '+unit+'</text>';
  body+='<text x="'+((x+footX)/2-8)+'" y="'+((baseY+apexY)/2-8)+'" font-family="Georgia, serif" font-size="16" text-anchor="end" fill="#17384d">a = '+data.left+' '+unit+'</text>';
  body+='<text x="'+((x+w+footX)/2+8)+'" y="'+((baseY+apexY)/2-8)+'" font-family="Georgia, serif" font-size="16" fill="#17384d">c = '+data.right+' '+unit+'</text>';
  body+='<rect x="'+(footX+8)+'" y="'+(apexY+hp/2-17)+'" width="82" height="24" rx="5" fill="white" fill-opacity=".92"/>';
  body+='<text x="'+(footX+12)+'" y="'+(apexY+hp/2)+'" font-family="Georgia, serif" font-size="16" fill="#17384d">h = '+h+' '+unit+'</text>';
  return areaSvg(360,220,body,'Triangle avec ses trois côtés et la hauteur correspondant à la base b');
}
function areaRightTriangleSvg(a,b,unit){
  const maxW=240,maxH=140,scale=Math.min(maxW/b,maxH/a);
  const w=b*scale,h=a*scale,baseY=175,flip=rnd()<.5;
  const rightX=flip?305:55,otherX=flip?rightX-w:rightX+w,topY=baseY-h;
  let body='<polygon points="'+rightX+','+baseY+' '+rightX+','+topY+' '+otherX+','+baseY+'" fill="#f0fff0" stroke="#247524" stroke-width="2.4" stroke-linejoin="round"/>';
  const sign=flip?-1:1;
  body+='<polyline points="'+rightX+','+(baseY-15)+' '+(rightX+15*sign)+','+(baseY-15)+' '+(rightX+15*sign)+','+baseY+'" fill="none" stroke="#247524" stroke-width="2"/>';
  body+='<text x="'+(flip?rightX+12:rightX-12)+'" y="'+(topY+h/2+5)+'" font-family="Georgia, serif" font-size="17" text-anchor="'+(flip?'start':'end')+'" fill="#17384d">'+a+' '+unit+'</text>';
  body+='<text x="'+((rightX+otherX)/2)+'" y="207" font-family="Georgia, serif" font-size="17" text-anchor="middle" fill="#17384d">'+b+' '+unit+'</text>';
  return areaSvg(360,220,body,'Triangle rectangle coté');
}
function areaDiskSvg(value,unit,isDiameter){
  const cx=180,cy=103,r=70,stroke=isDiameter?'#a13030':'#6040a0',fill=isDiameter?'#fff0f0':'#f2edff';
  let body='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2.4"/>';
  if(isDiameter){
    body+='<line x1="'+(cx-r)+'" y1="'+cy+'" x2="'+(cx+r)+'" y2="'+cy+'" stroke="'+stroke+'" stroke-width="2.4"/>';
    body+='<text x="'+cx+'" y="'+(cy-10)+'" font-family="Georgia, serif" font-size="18" text-anchor="middle" fill="#17384d">d = '+value+' '+unit+'</text>';
  }else{
    body+='<circle cx="'+cx+'" cy="'+cy+'" r="3.5" fill="'+stroke+'"/><line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+r)+'" y2="'+cy+'" stroke="'+stroke+'" stroke-width="2.4"/>';
    body+='<text x="'+(cx+r/2)+'" y="'+(cy-10)+'" font-family="Georgia, serif" font-size="18" text-anchor="middle" fill="#17384d">r = '+value+' '+unit+'</text>';
  }
  return areaSvg(360,220,body,isDiameter?'Disque avec son diamètre':'Disque avec son rayon');
}
function areaFacadeSvg(L,H,h,unit){
  const maxW=230,maxRectH=105,maxRoofH=75,scale=Math.min(maxW/L,maxRectH/H,maxRoofH/h);
  const w=L*scale,rh=H*scale,roof=h*scale,x=(360-w)/2,baseY=188,topY=baseY-rh,apexX=180,apexY=topY-roof;
  let body='<rect x="'+x+'" y="'+topY+'" width="'+w+'" height="'+rh+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="2.4"/>';
  body+='<polygon points="'+x+','+topY+' '+apexX+','+apexY+' '+(x+w)+','+topY+'" fill="#fff4e6" stroke="#b35c00" stroke-width="2.4" stroke-linejoin="round"/>';
  body+='<line x1="'+apexX+'" y1="'+apexY+'" x2="'+apexX+'" y2="'+topY+'" stroke="#b35c00" stroke-width="2" stroke-dasharray="6 5"/>';
  body+='<text x="180" y="214" font-family="Georgia, serif" font-size="16" text-anchor="middle" fill="#17384d">L = '+L+' '+unit+'</text>';
  body+='<text x="'+(x+8)+'" y="'+(topY+rh/2)+'" font-family="Georgia, serif" font-size="16" fill="#17384d">H = '+H+' '+unit+'</text>';
  body+='<rect x="'+(apexX+8)+'" y="'+(apexY+roof/2-17)+'" width="82" height="24" rx="5" fill="white" fill-opacity=".9"/>';
  body+='<text x="'+(apexX+12)+'" y="'+(apexY+roof/2)+'" font-family="Georgia, serif" font-size="16" fill="#17384d">h = '+h+' '+unit+'</text>';
  return areaSvg(360,230,body,'Façade composée d’un rectangle et d’un triangle');
}
function areaTwoRectanglesSvg(w1,h1,w2,h2,unit){
  const total=w1+w2,maxH=Math.max(h1,h2),scale=Math.min(235/total,130/maxH);
  const rw1=w1*scale,rw2=w2*scale,rh1=h1*scale,rh2=h2*scale;
  const x=(360-rw1-rw2)/2,baseY=183,x2=x+rw1;
  let body='<rect x="'+x+'" y="'+(baseY-rh1)+'" width="'+rw1+'" height="'+rh1+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="2.4"/>';
  body+='<rect x="'+x2+'" y="'+(baseY-rh2)+'" width="'+rw2+'" height="'+rh2+'" fill="#fff3e6" stroke="#b85c00" stroke-width="2.4"/>';
  body+='<text x="'+(x+rw1/2)+'" y="211" font-family="Georgia, serif" font-size="15" text-anchor="middle" fill="#17384d">L₁ = '+w1+' '+unit+'</text>';
  body+='<text x="'+(x2+rw2/2)+'" y="211" font-family="Georgia, serif" font-size="15" text-anchor="middle" fill="#17384d">L₂ = '+w2+' '+unit+'</text>';
  body+='<text x="'+(x+8)+'" y="'+(baseY-rh1/2+5)+'" font-family="Georgia, serif" font-size="15" fill="#17384d">l₁ = '+h1+' '+unit+'</text>';
  body+='<text x="'+(x2+rw2-8)+'" y="'+(baseY-rh2/2+5)+'" font-family="Georgia, serif" font-size="15" text-anchor="end" fill="#17384d">l₂ = '+h2+' '+unit+'</text>';
  return areaSvg(360,230,body,'Deux rectangles accolés formant une figure en escalier');
}
function areaRectangleSquareSvg(L,H,c,unit){
  const total=L+c,maxH=Math.max(H,c),scale=Math.min(235/total,130/maxH);
  const rw=L*scale,rh=H*scale,s=c*scale,x=(360-rw-s)/2,baseY=183,x2=x+rw;
  let body='<rect x="'+x+'" y="'+(baseY-rh)+'" width="'+rw+'" height="'+rh+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="2.4"/>';
  body+='<rect x="'+x2+'" y="'+(baseY-s)+'" width="'+s+'" height="'+s+'" fill="#fff3e6" stroke="#b85c00" stroke-width="2.4"/>';
  body+='<text x="'+(x+rw/2)+'" y="211" font-family="Georgia, serif" font-size="15" text-anchor="middle" fill="#17384d">L = '+L+' '+unit+'</text>';
  body+='<text x="'+(x2+s/2)+'" y="211" font-family="Georgia, serif" font-size="15" text-anchor="middle" fill="#17384d">c = '+c+' '+unit+'</text>';
  body+='<text x="'+(x+8)+'" y="'+(baseY-rh/2+5)+'" font-family="Georgia, serif" font-size="15" fill="#17384d">H = '+H+' '+unit+'</text>';
  return areaSvg(360,230,body,'Un rectangle et un carré accolés');
}
function areaSquareRoofSvg(c,h,unit){
  const maxW=190,maxSquareH=112,maxRoofH=70,scale=Math.min(maxW/c,maxSquareH/c,maxRoofH/h);
  const s=c*scale,roof=h*scale,x=(360-s)/2,baseY=188,topY=baseY-s,apexX=180,apexY=topY-roof;
  let body='<rect x="'+x+'" y="'+topY+'" width="'+s+'" height="'+s+'" fill="#fff3e6" stroke="#b85c00" stroke-width="2.4"/>';
  body+='<polygon points="'+x+','+topY+' '+apexX+','+apexY+' '+(x+s)+','+topY+'" fill="#f2edff" stroke="#6040a0" stroke-width="2.4" stroke-linejoin="round"/>';
  body+='<line x1="'+apexX+'" y1="'+apexY+'" x2="'+apexX+'" y2="'+topY+'" stroke="#6040a0" stroke-width="2" stroke-dasharray="6 5"/>';
  body+='<text x="180" y="214" font-family="Georgia, serif" font-size="16" text-anchor="middle" fill="#17384d">c = '+c+' '+unit+'</text>';
  body+='<text x="'+(x-10)+'" y="'+(topY+s/2+5)+'" font-family="Georgia, serif" font-size="16" text-anchor="end" fill="#17384d">c = '+c+' '+unit+'</text>';
  body+='<rect x="'+(apexX+8)+'" y="'+(apexY+roof/2-17)+'" width="82" height="24" rx="5" fill="white" fill-opacity=".9"/>';
  body+='<text x="'+(apexX+12)+'" y="'+(apexY+roof/2)+'" font-family="Georgia, serif" font-size="16" fill="#17384d">h = '+h+' '+unit+'</text>';
  return areaSvg(360,230,body,'Un carré surmonté d’un triangle');
}
function areaQcm(correct,distractors,unitSquared){
  const unique=[];
  [correct,...distractors].forEach(option=>{if(!unique.includes(String(option))) unique.push(String(option));});
  while(unique.length<4){
    const fallback=RD(2,150)+' '+unitSquared;
    if(!unique.includes(fallback)) unique.push(fallback);
  }
  const options=shuffleLocal(unique.slice(0,4));
  return {options,correctIndex:String(options.indexOf(String(correct))+1)};
}
function makeAreaInstance(mod,q){
  const kind=q.options.area_kind;
  const format=q.options.area_format||'direct';
  const unit=areaUnit();
  const unit2=areaSquaredUnit(unit);
  let prompt='',visualHtml='',dataHtml='',formula='',calculation='',result='',qcm=null,courseShape='';
  let correctValue='',distractors=[];

  if(kind==='rectangle_visual'||kind==='rectangle_text'){
    const d=areaRectangleDimensions(),A=d.L*d.l,P=2*(d.L+d.l);
    prompt='Calcule l’aire de ce rectangle.';
    visualHtml=kind==='rectangle_visual'?areaRectangleSvg(d.L,d.l,unit,false):'';
    dataHtml=kind==='rectangle_text'?'<div class="area-data">Un rectangle mesure <strong>'+d.L+' '+unit+'</strong> de longueur et <strong>'+d.l+' '+unit+'</strong> de largeur.</div>':'';
    formula='$$A=L\\times\\ell$$';
    calculation='$$A='+d.L+'\\times'+d.l+'='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(A)+' '+unit,areaValue(P)+' '+unit,areaValue(P)+' '+unit2];
  }
  if(kind==='rectangle_diagonal_visual'){
    const triple=pick([
      {l:3,L:4,d:5},{l:6,L:8,d:10},{l:5,L:12,d:13},
      {l:8,L:15,d:17},{l:9,L:12,d:15},{l:12,L:16,d:20}
    ]),A=triple.L*triple.l,P=2*(triple.L+triple.l);
    prompt='Calcule l’aire de ce rectangle. Toutes les longueurs utiles ou non sont indiquées.';
    visualHtml=areaRectangleDiagonalSvg(triple.L,triple.l,triple.d,unit);
    formula='$$A=L\\times\\ell$$';
    calculation='$$A='+triple.L+'\\times'+triple.l+'='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(triple.L*triple.d)+' '+unit2,areaValue(P)+' '+unit,areaValue(A)+' '+unit];
  }
  if(kind==='square_visual'||kind==='square_text'){
    let c=RD(3,15,[4]),A=c*c,P=4*c;
    prompt='Calcule l’aire de ce carré.';
    visualHtml=kind==='square_visual'?areaRectangleSvg(c,c,unit,true):'';
    dataHtml=kind==='square_text'?'<div class="area-data">Un carré a un côté de <strong>'+c+' '+unit+'</strong>.</div>':'';
    formula='$$A=c^2$$';
    calculation='$$A='+c+'^2='+A+'$$';
    result=A+' '+unit2;correctValue=result;
    distractors=[A+' '+unit,P+' '+unit,P+' '+unit2];
  }
  if(kind==='triangle_general_visual'||kind==='triangle_general_text'){
    const b=RD(8,18),minH=Math.max(4,Math.ceil(b*.45)),maxH=Math.max(minH,Math.floor(b*1.05)),h=RD(minH,maxH),A=b*h/2;
    prompt='Calcule l’aire de ce triangle.';
    visualHtml=kind==='triangle_general_visual'?areaGeneralTriangleSvg(b,h,unit):'';
    dataHtml=kind==='triangle_general_text'?'<div class="area-data">La base d’un triangle mesure <strong>'+b+' '+unit+'</strong> et la hauteur correspondante <strong>'+h+' '+unit+'</strong>.</div>':'';
    formula='$$A=\\dfrac{b\\times h}{2}$$';
    calculation='$$A=\\dfrac{'+b+'\\times'+h+'}{2}='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(b*h)+' '+unit2,areaValue(b+h)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='triangle_right_visual'||kind==='triangle_right_text'){
    const a=RD(4,13),b=RD(5,16),A=a*b/2;
    prompt='Ce triangle est rectangle. Calcule son aire.';
    visualHtml=kind==='triangle_right_visual'?areaRightTriangleSvg(a,b,unit):'';
    dataHtml=kind==='triangle_right_text'?'<div class="area-data">Les deux côtés perpendiculaires d’un triangle rectangle mesurent <strong>'+a+' '+unit+'</strong> et <strong>'+b+' '+unit+'</strong>.</div>':'';
    formula='$$A=\\dfrac{b\\times h}{2}$$';
    calculation='$$A=\\dfrac{'+a+'\\times'+b+'}{2}='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(a*b)+' '+unit2,areaValue(a+b)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='triangle_sides_height_visual'){
    const data=pick([
      {b:14,h:12,foot:5,left:13,right:15},
      {b:25,h:12,foot:9,left:15,right:20},
      {b:28,h:15,foot:8,left:17,right:25},
      {b:17,h:24,foot:7,left:25,right:26}
    ]),A=data.b*data.h/2;
    prompt='Calcule l’aire de ce triangle. Toutes les longueurs utiles ou non sont indiquées.';
    visualHtml=areaTriangleSidesHeightSvg(data,unit);
    formula='$$A=\\dfrac{b\\times h}{2}$$';
    calculation='$$A=\\dfrac{'+data.b+'\\times'+data.h+'}{2}='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(data.b*data.h)+' '+unit2,areaValue((data.left+data.right+data.b))+' '+unit,areaValue(A)+' '+unit];
  }
  if(kind==='disk_radius_approx_visual'){
    const r=RD(2,10),A=CUT(3.14*r*r,2),P=CUT(2*3.14*r,2),wrong=CUT(3.14*(r/2)*(r/2),2);
    prompt='Calcule une valeur approchée de l’aire de ce disque avec π ≈ 3,14.';
    visualHtml=areaDiskSvg(r,unit,false);
    formula='$$A=\\pi r^2$$';
    calculation='$$A\\approx3,14\\times'+r+'^2='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(P)+' '+unit,areaValue(wrong)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='disk_diameter_approx_visual'){
    const d=RD(2,12)*2,r=d/2,A=CUT(3.14*r*r,2),P=CUT(3.14*d,2),wrong=CUT(3.14*d*d,2);
    prompt='Calcule une valeur approchée de l’aire de ce disque avec π ≈ 3,14.';
    visualHtml=areaDiskSvg(d,unit,true);
    formula='$$r=d\\div2\\quad;\\quad A=\\pi r^2$$';
    calculation='$$A\\approx3,14\\times('+d+'\\div2)^2='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(P)+' '+unit,areaValue(wrong)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='disk_exact_visual'){
    const diameter=rnd()<.5,r=RD(2,10),shown=diameter?2*r:r,coefficient=r*r;
    prompt='Donne la valeur exacte de l’aire de ce disque.';
    visualHtml=areaDiskSvg(shown,unit,diameter);
    formula=diameter?'$$r=d\\div2\\quad;\\quad A=\\pi r^2$$':'$$A=\\pi r^2$$';
    calculation=diameter?'$$A=\\pi\\times('+shown+'\\div2)^2='+coefficient+'\\pi$$':'$$A=\\pi\\times'+r+'^2='+coefficient+'\\pi$$';
    result=coefficient+'π '+unit2;correctValue=result;
    const circumferenceCoeff=2*r,wrongCoeff=diameter?shown*shown:Math.max(1,r);
    distractors=[circumferenceCoeff+'π '+unit,wrongCoeff+'π '+unit2,coefficient+'π '+unit];
  }
  if(kind==='composite_facade_visual'){
    const L=RD(7,14),H=RD(3,8),h=RD(2,6),rect=L*H,roof=L*h/2,A=rect+roof;
    prompt='Cette façade est formée d’un rectangle et d’un triangle. Calcule son aire totale.';
    visualHtml=areaFacadeSvg(L,H,h,unit);
    formula='$$A=L\\times H+\\dfrac{L\\times h}{2}$$';
    calculation='$$A='+L+'\\times'+H+'+\\dfrac{'+L+'\\times'+h+'}{2}='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(rect)+' '+unit2,areaValue(rect+L*h)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='composite_two_rectangles_visual'){
    const w1=RD(4,8),w2=RD(3,7,[w1]),h1=RD(4,9),h2=RD(3,8,[h1]);
    const A1=w1*h1,A2=w2*h2,A=A1+A2,bounding=(w1+w2)*Math.max(h1,h2);
    prompt='Cette figure est formée de deux rectangles accolés. Calcule son aire totale.';
    visualHtml=areaTwoRectanglesSvg(w1,h1,w2,h2,unit);
    formula='$$A=L_1\\times\\ell_1+L_2\\times\\ell_2$$';
    calculation='$$A='+w1+'\\times'+h1+'+'+w2+'\\times'+h2+'='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(A1)+' '+unit2,areaValue(bounding)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='composite_rectangle_square_visual'){
    const L=RD(5,10),H=RD(3,7),c=RD(3,7,[H]),rect=L*H,square=c*c,A=rect+square;
    prompt='Cette figure est formée d’un rectangle et d’un carré accolés. Calcule son aire totale.';
    visualHtml=areaRectangleSquareSvg(L,H,c,unit);
    formula='$$A=L\\times H+c^2$$';
    calculation='$$A='+L+'\\times'+H+'+'+c+'^2='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(rect)+' '+unit2,areaValue(rect+4*c)+' '+unit2,areaValue(A)+' '+unit];
  }
  if(kind==='composite_square_roof_visual'){
    const c=RD(5,10),h=RD(2,6),square=c*c,roof=c*h/2,A=square+roof;
    prompt='Cette figure est formée d’un carré surmonté d’un triangle. Calcule son aire totale.';
    visualHtml=areaSquareRoofSvg(c,h,unit);
    formula='$$A=c^2+\\dfrac{c\\times h}{2}$$';
    calculation='$$A='+c+'^2+('+c+'\\times'+h+')\\div2='+areaValue(A)+'$$';
    result=areaValue(A)+' '+unit2;correctValue=result;
    distractors=[areaValue(square)+' '+unit2,areaValue(square+c*h)+' '+unit2,areaValue(A)+' '+unit];
  }

  if(kind==='formula_recognition'){
    const shape=pick(['rectangle','square','triangle','disk']);
    courseShape=shape;
    let formulaOptions=[];
    prompt='Quelle formule permet de calculer l’aire de cette figure ?';
    if(shape==='rectangle'){
      const d=areaRectangleDimensions();
      visualHtml=areaRectangleSvg(d.L,d.l,unit,false);
      formulaOptions=['L\\times\\ell','\\dfrac{b\\times h}{2}','\\pi r^2','2(L+\\ell)'];
      correctValue='L\\times\\ell';
    }
    if(shape==='square'){
      const c=RD(3,15);
      visualHtml=areaRectangleSvg(c,c,unit,true);
      formulaOptions=['c^2','4c','\\dfrac{b\\times h}{2}','\\pi r^2'];
      correctValue='c^2';
    }
    if(shape==='triangle'){
      const b=RD(8,18),h=RD(4,12);
      visualHtml=areaGeneralTriangleSvg(b,h,unit);
      formulaOptions=['\\dfrac{b\\times h}{2}','b\\times h','L\\times\\ell','\\pi r^2'];
      correctValue='\\dfrac{b\\times h}{2}';
    }
    if(shape==='disk'){
      const r=RD(2,10);
      visualHtml=areaDiskSvg(r,unit,false);
      formulaOptions=['\\pi r^2','\\pi r','\\pi d','\\pi d^2'];
      correctValue='\\pi r^2';
    }
    const options=shuffleLocal(formulaOptions);
    qcm={options:options.map(option=>'$$'+option+'$$'),correctIndex:String(options.indexOf(correctValue)+1)};
    formula='';calculation='';result='';
  }

  if(format==='qcm'&&kind!=='formula_recognition') qcm=areaQcm(correctValue,distractors,unit2);
  return {
    module:mod,q,scope:{},answers:qcm?[qcm.correctIndex]:[correctValue],
    rawStatement:prompt,rawFooter:'',hasSvg:!!visualHtml,
    area:{kind,format,prompt,visualHtml,dataHtml,formula,calculation,result,unit,unit2,qcm,courseShape}
  };
}
function scientificFormattedNumber(value){
  const raw=fmt(value);
  const sign=raw.startsWith('-')?'-':'';
  const unsigned=sign?raw.slice(1):raw;
  const parts=unsigned.split(',');
  const grouped=(parts[0]||'0').replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');
  return sign+grouped+(parts.length>1?','+parts.slice(1).join(','):'');
}
function scientificFirstNonZeroData(value){
  const number=Number(value);
  const absolute=Math.abs(number);
  if(!Number.isFinite(absolute)||absolute===0){
    const formatted=scientificFormattedNumber(value);
    return {digit:0,exponent:0,placeValue:0,formatted,highlighted:escapeHtml(formatted)};
  }
  const exponent=Math.floor(Math.log10(absolute)+1e-12);
  const digit=Math.floor(absolute/(10**exponent)+1e-10);
  const placeValue=CUT(digit*(10**exponent),Math.max(0,-exponent));
  const formatted=scientificFormattedNumber(value);
  let highlighted='',done=false;
  for(const char of formatted){
    if(!done&&/[1-9]/.test(char)){
      highlighted+='<span class="scientific-digit-marker">'+escapeHtml(char)+'</span>';
      done=true;
    }else highlighted+=escapeHtml(char);
  }
  return {digit,exponent,placeValue,formatted,highlighted};
}
function scientificPlaceHelp(value,correction=false){
  const data=scientificFirstNonZeroData(value);
  const placeData=scientificFirstNonZeroData(data.placeValue);
  const shownExponent=correction?String(data.exponent):'...';
  return '<div class="scientific-help scientific-place-help" role="img" aria-label="Valeur de position du premier chiffre non nul">'
    +'<div class="scientific-place-equation">'+placeData.highlighted
    +' = '+data.digit+' × 10<sup>'+shownExponent+'</sup></div>'
    +'</div>';
}
function scientificPowerLabel(exponent){
  if(exponent===0) return '1';
  return '10<tspan baseline-shift="super" font-size="10">'+exponent+'</tspan>';
}
function scientificGlideSvg(coefficient,exponent,correction=false){
  const positive=Number(exponent)>0;
  const exponents=positive?[4,3,2,1,0,-1]:[0,-1,-2,-3,-4,-5];
  const x=40,width=600,cellW=width/exponents.length,headY=50,headH=34,rowH=52;
  const startY=headY+headH,targetY=startY+rowH;
  const coefficientText=fmt(coefficient);
  const parts=coefficientText.replace('-','').split(',');
  const digitEntries=[];
  [...(parts[0]||'')].forEach((digit,index)=>digitEntries.push({digit,exponent:index===0?0:-index}));
  [...(parts[1]||'')].forEach((digit,index)=>digitEntries.push({digit,exponent:-1-index}));
  const positionFor=power=>x+(exponents.indexOf(power)+.5)*cellW;
  const direction=positive?'gauche':'droite';
  const arrowStart=positionFor(0),arrowEnd=positionFor(Number(exponent));
  let body='<defs><marker id="scientific-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#111827"/></marker></defs>';
  body+='<text x="340" y="17" font-family="Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="#17384d">'+Math.abs(Number(exponent))+' rangs vers la '+direction+'</text>';
  body+='<line x1="'+arrowStart+'" y1="38" x2="'+arrowEnd+'" y2="38" stroke="#111827" stroke-width="4" stroke-linecap="round" marker-end="url(#scientific-arrow)"/>';
  exponents.forEach((power,index)=>{
    const cellX=x+index*cellW;
    body+='<rect x="'+cellX+'" y="'+headY+'" width="'+cellW+'" height="'+headH+'" fill="#f3f7fd" stroke="#9fb3cf" stroke-width="1.3"/>';
    body+='<text x="'+(cellX+cellW/2)+'" y="'+(headY+23)+'" font-family="Arial, sans-serif" font-size="15" font-weight="750" text-anchor="middle" fill="#60708c">'+scientificPowerLabel(power)+'</text>';
    body+='<rect x="'+cellX+'" y="'+startY+'" width="'+cellW+'" height="'+rowH+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="1.5"/>';
    body+='<rect x="'+cellX+'" y="'+targetY+'" width="'+cellW+'" height="'+rowH+'" fill="'+(correction?'#ecfdf5':'#fbfdff')+'" stroke="'+(correction?'#10b981':'#9fb3cf')+'" stroke-width="1.5"'+(correction?'':' stroke-dasharray="5 4"')+'/>';
  });
  const commaX=x+(exponents.indexOf(0)+1)*cellW;
  const commaMark=rowY=>'<circle cx="'+commaX+'" cy="'+(rowY+28)+'" r="3.7" fill="#e86100"/><path d="M '+(commaX+1)+' '+(rowY+31)+' Q '+commaX+' '+(rowY+39)+' '+(commaX-6)+' '+(rowY+42)+'" fill="none" stroke="#e86100" stroke-width="3.2" stroke-linecap="round"/>';
  body+=commaMark(startY)+commaMark(targetY);
  digitEntries.forEach(entry=>{
    body+='<text x="'+positionFor(entry.exponent)+'" y="'+(startY+35)+'" font-family="Cambria Math, STIX Two Math, Times New Roman, serif" font-size="28" font-weight="800" text-anchor="middle" fill="#17384d">'+escapeHtml(entry.digit)+'</text>';
  });
  if(correction){
    const targetDigits=new Map();
    digitEntries.forEach(entry=>targetDigits.set(entry.exponent+Number(exponent),entry.digit));
    const targetPowers=[...targetDigits.keys()];
    const highest=Math.max(...targetPowers),lowest=Math.min(...targetPowers);
    if(highest<0){
      for(let power=0;power>highest;power--) targetDigits.set(power,'0');
    }else if(lowest>0){
      for(let power=lowest-1;power>=0;power--) targetDigits.set(power,'0');
    }
    exponents.forEach(power=>{
      if(!targetDigits.has(power)) return;
      body+='<text x="'+positionFor(power)+'" y="'+(targetY+35)+'" font-family="Cambria Math, STIX Two Math, Times New Roman, serif" font-size="28" font-weight="850" text-anchor="middle" fill="#087a55">'+escapeHtml(targetDigits.get(power))+'</text>';
    });
  }
  return '<div class="scientific-help scientific-glide-help"><svg class="scientific-glide" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 200" role="img" aria-label="Glisse-nombre pour une multiplication par une puissance de dix">'+body+'</svg></div>';
}
function scientificRecognitionHelp(coefficient,correction=false){
  const value=Number(coefficient),valid=value>=1&&value<10;
  return '<div class="scientific-help scientific-condition-help">'
    +'<div class="scientific-condition">1 ≤ <span class="scientific-coefficient '+(correction?(valid?'is-valid':'is-invalid'):'')+'">partie entière</span> &lt; 10</div>'
    +'</div>';
}
function scientificVisualHtml(inst,correction=false){
  const kind=inst.q.options&&inst.q.options.scientific_kind;
  if(kind==='to_scientific'||kind==='to_scientific_qcm') return scientificPlaceHelp(inst.scope.n,correction);
  if(kind==='from_scientific') return scientificGlideSvg(inst.scope.m,inst.scope.e,correction);
  if(kind==='recognition') return scientificRecognitionHelp(inst.scope.m,correction);
  return '';
}
function renderScientificModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const qcm=splitQCM(inst.rawStatement);
  const kind=inst.q.options&&inst.q.options.scientific_kind;
  let prompt=qcm?qcm.prompt:inst.rawStatement;
  if(kind==='to_scientific_qcm'){
    const data=scientificFirstNonZeroData(inst.scope.n);
    prompt='Quelle est l’écriture scientifique de <span class="math-display scientific-inline-number">'+data.highlighted+'</span> ?';
  }
  let html='<div class="scientific-question"><div class="scientific-prompt">'+renderMathSegments(prompt)+'</div></div>';
  if(!qcm&&inst.rawFooter){
    let footerHtml;
    if(kind==='to_scientific'){
      const data=scientificFirstNonZeroData(inst.scope.n);
      footerHtml=renderPlaceholders('$$@@SCISOURCE@@\\,=\\,[[dots]]\\,\\times\\,10^{[[dots]]}$$',inst.answers,correction?'correction':'question')
        .replace('@@SCISOURCE@@','<span class="scientific-inline-number">'+data.highlighted+'</span>');
    }else if(kind==='from_scientific'){
      footerHtml=renderPlaceholders('$$'+scientificFormattedNumber(inst.scope.m)+'\\,\\times\\,10^{'+inst.scope.e+'}\\,=\\,[[dots]]$$',inst.answers,correction?'correction':'question');
    }else footerHtml=renderPlaceholders(inst.rawFooter,inst.answers,correction?'correction':'question');
    footerHtml=footerHtml.replace(/<span class="answer-dots">…<\/span>/g,'<span class="answer-dots">...</span>');
    html+='<div class="footer scientific-footer">'+footerHtml+'</div>';
  }
  if(!isWithoutVisuals(mode)) html+=scientificVisualHtml(inst,correction);
  else html+=visualPlaceholder(mode);
  if(qcm){
    const corrects=new Set(inst.answers.map(value=>String(value)));
    html+='<div class="options scientific-options options-'+qcm.opts.length+'">';
    qcm.opts.forEach((option,index)=>{
      const isCorrect=correction&&corrects.has(String(index+1));
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
    });
    html+='</div>';
  }
  return html;
}
function averageSvg(body,height,label){
  return '<svg class="average-svg" xmlns="http://www.w3.org/2000/svg" width="760" height="'+height+'" viewBox="0 0 760 '+height+'" role="img" aria-label="'+escapeHtml(label)+'">'+body+'</svg>';
}
function averageBarSegments(items,x,y,width,height,fill,stroke,unknownIndex=-1,correction=false){
  const weights=items.map(item=>Math.max(2,Number(item.value)||0)+2);
  const total=weights.reduce((sum,value)=>sum+value,0)||1;
  let cursor=x,body='';
  items.forEach((item,index)=>{
    const w=index===items.length-1?x+width-cursor:width*weights[index]/total;
    const resolved=correction&&index===unknownIndex;
    body+='<rect x="'+cursor+'" y="'+y+'" width="'+w+'" height="'+height+'" fill="'+(resolved?'#ecfdf5':fill)+'" stroke="'+(resolved?'#10b981':stroke)+'" stroke-width="2"/>';
    const shownLabel=item.label==='x'?'𝑥':item.label;
    body+='<text x="'+(cursor+w/2)+'" y="'+(y+height/2+7)+'" font-family="Cambria Math, STIX Two Math, Times New Roman, serif" font-size="22" font-weight="700" text-anchor="middle" fill="'+(resolved?'#087a55':'#17384d')+'">'+escapeHtml(shownLabel)+'</text>';
    cursor+=w;
  });
  return body;
}
function averageEqualSegments(labels,x,y,width,height,known,correction=false){
  const w=width/labels.length;
  let body='';
  labels.forEach((label,index)=>{
    const resolved=correction&&!known;
    body+='<rect x="'+(x+index*w)+'" y="'+y+'" width="'+w+'" height="'+height+'" fill="'+(resolved?'#ecfdf5':'#eaf3ff')+'" stroke="'+(resolved?'#10b981':'#1f5f99')+'" stroke-width="2"/>';
    const shownLabel=label==='x'?'𝑥':label;
    body+='<text x="'+(x+(index+.5)*w)+'" y="'+(y+height/2+8)+'" font-family="Cambria Math, STIX Two Math, Times New Roman, serif" font-size="24" font-weight="700" text-anchor="middle" fill="'+(resolved?'#087a55':'#17384d')+'">'+escapeHtml(shownLabel)+'</text>';
  });
  return body;
}
function averageComparisonSvg(data,correction=false){
  const x=70,width=620,rowH=54,topY=16,totalY=topY+rowH,bottomY=totalY+rowH;
  const topLabels=Array.from({length:data.count},()=>correction?data.averageLabel:(data.averageKnown?data.averageLabel:'x'));
  const bottomItems=data.items.filter(item=>Number(item.value)!==0).map((item,index)=>({
    value:item.value,
    label:correction&&item.unknown?item.correctLabel:item.label,
    unknown:item.unknown,
    sourceIndex:index
  }));
  const unknownIndex=bottomItems.findIndex(item=>item.unknown);
  let body=averageEqualSegments(topLabels,x,topY,width,rowH,data.averageKnown,correction);
  body+='<rect x="'+x+'" y="'+totalY+'" width="'+width+'" height="'+rowH+'" fill="#f8fbff" stroke="#60708c" stroke-width="2"/>';
  body+='<text x="380" y="'+(totalY+34)+'" font-family="Arial, sans-serif" font-size="18" font-weight="850" text-anchor="middle" fill="#60708c">TOTAL</text>';
  body+=averageBarSegments(bottomItems,x,bottomY,width,rowH,'#fff3e6','#b85c00',unknownIndex,correction);
  return averageSvg(body,194,'Schéma en barres comparant les valeurs à des parts toutes égales à la moyenne');
}
function averageTotalPartsSvg(data,correction=false){
  const x=70,width=620,h=60,topY=20,bottomY=topY+h;
  const totalText=correction?data.totalLabel:(data.totalKnown?data.totalLabel:'x');
  const partText=correction?data.partLabel:(data.partKnown?data.partLabel:'x');
  const totalResolved=correction&&!data.totalKnown,partsResolved=correction&&!data.partKnown;
  let body=averageEqualSegments(Array.from({length:data.count},()=>partText),x,topY,width,h,data.partKnown,correction);
  body+='<rect x="'+x+'" y="'+bottomY+'" width="'+width+'" height="'+h+'" fill="'+(totalResolved?'#ecfdf5':'#fff3e6')+'" stroke="'+(totalResolved?'#10b981':'#b85c00')+'" stroke-width="2.2"/>';
  body+='<text x="380" y="'+(bottomY+38)+'" font-family="Arial, sans-serif" font-size="20" font-weight="850" text-anchor="middle" fill="#17384d">TOTAL</text>';
  return averageSvg(body,160,'Schéma en barres reliant un total à des parts égales');
}
function averageWeightedSvg(data){
  const x=70,width=620,topY=34,rowH=56,totalY=topY+rowH,bottomY=totalY+rowH;
  let body='<text x="380" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="800" text-anchor="middle" fill="#60708c">'+data.count+' parts égales</text>';
  const shown=['x','x','…','x','x'],cellW=width/shown.length;
  shown.forEach((label,index)=>{
    body+='<rect x="'+(x+index*cellW)+'" y="'+topY+'" width="'+cellW+'" height="'+rowH+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="2"/>';
    const shownLabel=label==='x'?'𝑥':label;
    body+='<text x="'+(x+(index+.5)*cellW)+'" y="'+(topY+35)+'" font-family="Cambria Math, STIX Two Math, Times New Roman, serif" font-size="25" font-weight="700" text-anchor="middle" fill="#17384d">'+shownLabel+'</text>';
  });
  body+='<rect x="'+x+'" y="'+totalY+'" width="'+width+'" height="'+rowH+'" fill="#f8fbff" stroke="#60708c" stroke-width="1.8"/>';
  body+='<text x="380" y="'+(totalY+35)+'" font-family="Arial, sans-serif" font-size="18" font-weight="850" text-anchor="middle" fill="#60708c">TOTAL</text>';
  const positives=data.groups.filter(group=>group.value>0);
  const contributionSum=positives.reduce((sum,group)=>sum+group.value*group.effect,0)||1;
  const minWidth=82,remaining=Math.max(0,width-minWidth*positives.length);
  let cursor=x;
  positives.forEach((group,index)=>{
    const contribution=group.value*group.effect;
    const w=index===positives.length-1?x+width-cursor:minWidth+remaining*contribution/contributionSum;
    body+='<rect x="'+cursor+'" y="'+bottomY+'" width="'+w+'" height="'+rowH+'" fill="#fff3e6" stroke="#b85c00" stroke-width="2"/>';
    if(group.effect===1){
      body+='<text x="'+(cursor+w/2)+'" y="'+(bottomY+37)+'" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="middle" fill="#17384d">'+group.value+'</text>';
    }else if(group.effect===2){
      body+='<line x1="'+(cursor+w/2)+'" y1="'+bottomY+'" x2="'+(cursor+w/2)+'" y2="'+(bottomY+rowH)+'" stroke="#b85c00" stroke-width="2"/>';
      body+='<text x="'+(cursor+w/4)+'" y="'+(bottomY+37)+'" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="middle" fill="#17384d">'+group.value+'</text>';
      body+='<text x="'+(cursor+3*w/4)+'" y="'+(bottomY+37)+'" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="middle" fill="#17384d">'+group.value+'</text>';
    }else{
      const edge=Math.min(48,w*.27);
      body+='<line x1="'+(cursor+edge)+'" y1="'+bottomY+'" x2="'+(cursor+edge)+'" y2="'+(bottomY+rowH)+'" stroke="#b85c00" stroke-width="2"/>';
      body+='<line x1="'+(cursor+w-edge)+'" y1="'+bottomY+'" x2="'+(cursor+w-edge)+'" y2="'+(bottomY+rowH)+'" stroke="#b85c00" stroke-width="2"/>';
      body+='<text x="'+(cursor+edge/2)+'" y="'+(bottomY+37)+'" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="middle" fill="#17384d">'+group.value+'</text>';
      body+='<text x="'+(cursor+w/2)+'" y="'+(bottomY+35)+'" font-family="Arial, sans-serif" font-size="22" font-weight="850" text-anchor="middle" fill="#17384d">…</text>';
      body+='<text x="'+(cursor+w-edge/2)+'" y="'+(bottomY+37)+'" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="middle" fill="#17384d">'+group.value+'</text>';
    }
    const braceY=bottomY+rowH+4,labelY=braceY+34;
    body+='<path d="M '+(cursor+5)+' '+braceY+' Q '+(cursor+5)+' '+(braceY+9)+' '+(cursor+15)+' '+(braceY+9)+' L '+(cursor+w/2-8)+' '+(braceY+9)+' Q '+(cursor+w/2)+' '+(braceY+9)+' '+(cursor+w/2)+' '+(braceY+17)+' Q '+(cursor+w/2)+' '+(braceY+9)+' '+(cursor+w/2+8)+' '+(braceY+9)+' L '+(cursor+w-15)+' '+(braceY+9)+' Q '+(cursor+w-5)+' '+(braceY+9)+' '+(cursor+w-5)+' '+braceY+'" fill="none" stroke="#60708c" stroke-width="1.6"/>';
    body+='<text x="'+(cursor+w/2)+'" y="'+labelY+'" font-family="Arial, sans-serif" font-size="14" font-weight="800" text-anchor="middle" fill="#60708c">'+group.effect+' fois</text>';
    cursor+=w;
  });
  const zeroGroup=data.groups.find(group=>group.value===0);
  let height=252;
  if(zeroGroup){
    height=296;
    const zeroY=254,zeroX=32;
    body+='<line x1="'+x+'" y1="'+(bottomY-4)+'" x2="'+x+'" y2="'+(bottomY+rowH+4)+'" stroke="#b85c00" stroke-width="3"/>';
    body+='<rect x="'+zeroX+'" y="'+zeroY+'" width="190" height="29" rx="6" fill="#fff" stroke="#b85c00" stroke-width="1.8"/>';
    body+='<text x="'+(zeroX+95)+'" y="'+(zeroY+20)+'" font-family="Arial, sans-serif" font-size="14" font-weight="850" text-anchor="middle" fill="#17384d">0 | … | 0  ('+zeroGroup.effect+' fois)</text>';
    body+='<text x="'+(zeroX+207)+'" y="'+(zeroY+20)+'" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#60708c">longueur nulle</text>';
  }
  return averageSvg(body,height,'Schéma en barres d’une moyenne pondérée avec les valeurs répétées selon leurs effectifs');
}
function averageRangeSvg(data,correction=false){
  const minX=120,maxX=610,lineY=105;
  const span=data.max-data.min||1;
  const scale=span>0?(maxX-minX)/span:1;
  const candidateX=data.value<data.min?70:(data.value>data.max?680:minX+(data.value-data.min)*scale);
  const possible=data.value>=data.min&&data.value<=data.max;
  const color=correction?(possible?'#10b981':'#d43b3b'):'#6040a0';
  let body='<line x1="'+minX+'" y1="'+lineY+'" x2="'+maxX+'" y2="'+lineY+'" stroke="#1f5f99" stroke-width="6" stroke-linecap="butt"/>';
  body+='<line x1="'+minX+'" y1="85" x2="'+minX+'" y2="125" stroke="#1f5f99" stroke-width="3"/><line x1="'+maxX+'" y1="85" x2="'+maxX+'" y2="125" stroke="#1f5f99" stroke-width="3"/>';
  body+='<text x="'+minX+'" y="152" font-family="Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="#17384d">minimum : '+data.min+'</text>';
  body+='<text x="'+maxX+'" y="152" font-family="Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="#17384d">maximum : '+data.max+'</text>';
  body+='<circle cx="'+candidateX+'" cy="55" r="10" fill="'+color+'"/><line x1="'+candidateX+'" y1="65" x2="'+candidateX+'" y2="'+lineY+'" stroke="'+color+'" stroke-width="3"/>';
  const candidateAnchor=data.value<data.min?'start':(data.value>data.max?'end':'middle');
  body+='<text x="'+candidateX+'" y="30" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="'+candidateAnchor+'" fill="'+color+'">moyenne proposée : '+data.value+'</text>';
  if(correction) body+='<text x="380" y="194" font-family="Arial, sans-serif" font-size="19" font-weight="850" text-anchor="middle" fill="'+color+'">'+(possible?'Cette moyenne est possible.':'Cette moyenne est impossible.')+'</text>';
  return averageSvg(body,215,'Position de la moyenne proposée par rapport au minimum et au maximum');
}
function averageTable(headers,values,firstHeader,secondHeader){
  let html='<table class="average-table"><tr><th>'+escapeHtml(firstHeader)+'</th>';
  headers.forEach(value=>html+='<td>'+escapeHtml(value)+'</td>');
  html+='</tr><tr><th>'+escapeHtml(secondHeader)+'</th>';
  values.forEach(value=>html+='<td>'+escapeHtml(value)+'</td>');
  return html+'</tr></table>';
}
function averageQcm(options,correct){
  const shuffled=shuffledCopy(options);
  return {options:shuffled,correctIndex:String(shuffled.indexOf(correct)+1)};
}
function makeAverageInstance(mod,q){
  const n=Number(q.n);
  let d={kind:'',prompt:'',instruction:'',tableHtml:'',result:'',answerPrefix:'',visual:null,qcm:null,calculation:'',explanation:''};
  if(n===1){
    let a,b,c,sum;
    do{ a=RD(2,18);b=RD(2,18);c=RD(2,18);sum=a+b+c; }while(sum%3===0);
    const g=GCD(sum,3),num=sum/g,den=3/g;
    d={...d,kind:'values',prompt:'On considère les trois valeurs suivantes :',instruction:'Exprime leur moyenne sous forme de fraction.',dataLine:[a,b,c].join(' ; '),result:den===1?String(num):num+'/'+den,displayResult:den===1?String(num):'\\dfrac{'+num+'}{'+den+'}',answerPrefix:'moyenne = ',calculation:'$$\\text{moyenne}=\\dfrac{'+a+'+'+b+'+'+c+'}{3}=\\dfrac{'+sum+'}{3}='+(den===1?num:'\\dfrac{'+num+'}{'+den+'}')+'$$',visual:{type:'comparison',count:3,items:[a,b,c].map(value=>({value,label:String(value)})),averageKnown:false,averageLabel:fmt(sum/3),totalLabel:String(sum)}};
  }
  if(n===2){
    const m=RD(6,18),d1=RD(1,4),d2=RD(1,4),values=[m-d1,m+d1,m-d2,m+d2];
    d={...d,kind:'values',prompt:'Calcule la moyenne des quatre valeurs suivantes :',dataLine:values.join(' ; '),result:String(m),displayResult:String(m),answerPrefix:'moyenne = ',calculation:'$$\\text{moyenne}=\\dfrac{'+values.join('+')+'}{4}=\\dfrac{'+(4*m)+'}{4}='+m+'$$',visual:{type:'comparison',count:4,items:values.map(value=>({value,label:String(value)})),averageKnown:false,averageLabel:String(m),totalLabel:String(4*m)}};
  }
  if(n===3){
    const e1=RD(2,8),e2=RD(2,8),e3=RD(2,8),count=e1+e2+e3,total=8*e1+12*e2+16*e3,mean=CUT(total/count,1);
    d={...d,kind:'weighted',prompt:'Voici les notes obtenues à une évaluation :',instruction:'Calcule la moyenne des notes. Arrondis au dixième si nécessaire.',tableHtml:averageTable(['8','12','16'],[e1,e2,e3],'note','effectif'),result:fmt(mean),displayResult:fmt(mean),answerPrefix:'moyenne = ',calculation:'$$\\text{moyenne}=\\dfrac{8\\times'+e1+'+12\\times'+e2+'+16\\times'+e3+'}{'+e1+'+'+e2+'+'+e3+'}=\\dfrac{'+total+'}{'+count+'}\\approx'+fmt(mean)+'$$',visual:{type:'weighted',count,groups:[{value:8,effect:e1},{value:12,effect:e2},{value:16,effect:e3}]}};
  }
  if(n===4){
    const correct='$$\\text{moyenne}=\\dfrac{\\text{somme des valeurs}}{\\text{nombre de valeurs}}$$';
    const options=[correct,'$$\\text{moyenne}=\\dfrac{\\text{nombre de valeurs}}{\\text{somme des valeurs}}$$','$$\\text{moyenne}=\\text{maximum}-\\text{minimum}$$','$$\\text{moyenne}=\\text{somme des valeurs}+\\text{effectif}$$'];
    d={...d,kind:'formula',prompt:'Quelle formule permet de calculer la moyenne d’une série de valeurs ?',qcm:averageQcm(options,correct)};
  }
  if(n===5){
    const m=RD(8,18),d1=RD(1,4),d2=RD(1,4),a=m+d1,b=m-d1,c=m+d2,x=m-d2,total=4*m;
    const items=[{value:a,label:String(a)},{value:b,label:String(b)},{value:c,label:String(c)},{value:x,label:'x',unknown:true,correctLabel:String(x)}];
    d={...d,kind:'missing',prompt:'La moyenne de ces quatre nombres est '+m+' :',dataLine:[a,b,c,'x'].join(' ; '),instruction:'Calcule la valeur de x.',result:String(x),displayResult:String(x),answerPrefix:'x = ',calculation:'$$\\text{total}=4\\times'+m+'='+total+'$$<br>$$x='+total+'-('+a+'+'+b+'+'+c+')='+x+'$$',visual:{type:'comparison',count:4,items,averageKnown:true,averageLabel:String(m),totalLabel:String(total)}};
  }
  if(n===6){
    const count=RD(3,9),mean=RD(4,20),sum=count*mean;
    d={...d,kind:'sum_to_mean',prompt:'Une série de '+count+' valeurs a pour somme '+sum+'.',instruction:'Calcule sa moyenne.',result:String(mean),displayResult:String(mean),answerPrefix:'moyenne = ',calculation:'$$\\text{moyenne}='+sum+'\\div'+count+'='+mean+'$$',visual:{type:'totalParts',count,totalKnown:true,totalLabel:String(sum),partKnown:false,partLabel:String(mean)}};
  }
  if(n===7){
    const count=RD(3,10),mean=RD(5,18),sum=count*mean;
    d={...d,kind:'mean_to_sum',prompt:'La moyenne de '+count+' valeurs est '+mean+'.',instruction:'Quelle est la somme de ces '+count+' valeurs ?',result:String(sum),displayResult:String(sum),answerPrefix:'somme = ',calculation:'$$\\text{somme}='+count+'\\times'+mean+'='+sum+'$$',visual:{type:'totalParts',count,totalKnown:false,totalLabel:String(sum),partKnown:true,partLabel:String(mean)}};
  }
  if(n===8){
    const min=RD(2,8),max=min+RD(4,8),caseKind=pick(['below','inside','above']);
    const value=caseKind==='below'?min-RD(1,4):(caseKind==='above'?max+RD(1,4):RD(min,max));
    const correct=value>=min&&value<=max?'Oui':'Non';
    d={...d,kind:'range',prompt:'Toutes les valeurs d’une série sont comprises entre '+min+' et '+max+', bornes incluses.',instruction:'La moyenne de cette série peut-elle être égale à '+value+' ?',qcm:averageQcm(['Oui','Non','On ne peut pas savoir'],correct),explanation:'Une moyenne est comprise entre la plus petite et la plus grande valeur, bornes incluses.',visual:{type:'range',min,max,value}};
  }
  if(n===9){
    const e0=RD(1,8),e1=RD(1,8),e2=RD(1,8),e3=RD(1,8),count=e0+e1+e2+e3,total=e1+2*e2+3*e3,exact=total/count,low=Math.floor(exact*100)/100,high=Math.ceil(exact*100)/100;
    const result=Math.abs(low-high)<1e-9?fmt(low):fmt(low)+' (par défaut) ou '+fmt(high)+' (par excès)';
    d={...d,kind:'weighted_zero',prompt:'On a demandé à des familles combien d’enfants elles ont.',instruction:'Calcule le nombre moyen d’enfants par famille. Donne une valeur approchée à 0,01 près par défaut ou par excès.',tableHtml:averageTable(['0','1','2','3'],[e0,e1,e2,e3],'nombre d’enfants','effectif'),result,acceptedResults:Math.abs(low-high)<1e-9?[fmt(low)]:[fmt(low),fmt(high)],displayResult:result,answerPrefix:'moyenne = ',calculation:'$$\\text{moyenne}=\\dfrac{0\\times'+e0+'+1\\times'+e1+'+2\\times'+e2+'+3\\times'+e3+'}{'+e0+'+'+e1+'+'+e2+'+'+e3+'}=\\dfrac{'+total+'}{'+count+'}$$<br>$$'+fmt(low)+'\\leq\\text{moyenne}\\leq'+fmt(high)+'$$',visual:{type:'weighted',count,groups:[{value:0,effect:e0},{value:1,effect:e1},{value:2,effect:e2},{value:3,effect:e3}]}};
  }
  if(n===10){
    const x=RD(20,80)/10,y=RD(20,80)/10,mean=CUT((x+y)/2,2),values=[x,y];
    d={...d,kind:'values_decimal',prompt:'Deux longueurs mesurent '+fmt(x)+' cm et '+fmt(y)+' cm.',instruction:'Calcule leur moyenne. Arrondis au centième si nécessaire.',result:fmt(mean),displayResult:fmt(mean)+' cm',answerPrefix:'moyenne = ',calculation:'$$\\text{moyenne}=\\dfrac{'+fmt(x)+'+'+fmt(y)+'}{2}='+fmt(mean)+'\\text{ cm}$$',visual:{type:'comparison',count:2,items:values.map(value=>({value,label:fmt(value)+' cm'})),averageKnown:false,averageLabel:fmt(mean)+' cm',totalLabel:fmt(x+y)+' cm'}};
  }
  const answers=d.qcm?[d.qcm.correctIndex]:[d.result];
  return {module:mod,q,scope:{},answers,answerChoices:[d.acceptedResults||[d.result]],rawStatement:d.prompt,rawFooter:'',hasSvg:!!d.visual,average:d};
}

function relationExpressionChoices(target=null){
  const terms=(...items)=>({kind:'terms',items});
  const nTerms=count=>terms({type:'n',count,sign:1});
  const nAndUnits=(count,sign=1)=>terms({type:'n',count:1,sign:1},{type:'u',count:Math.abs(count),sign});
  const square=()=>terms({type:'n2',count:1,sign:1});
  const fraction=divisor=>({kind:'fraction',divisor});
  const singleN=()=>terms({type:'n',count:1,sign:1});
  const configs=[
    {id:'double',prompt:'Quelle expression représente le double du nombre $$n$$ ?',correct:'2n',options:[
      {latex:'2n',visual:nTerms(2)},{latex:'n+2',visual:nAndUnits(2)},{latex:'n^2',visual:square()},{latex:'\\dfrac{n}{2}',visual:fraction(2)}]},
    {id:'triple',prompt:'Quelle expression représente le triple du nombre $$n$$ ?',correct:'3n',options:[
      {latex:'3n',visual:nTerms(3)},{latex:'n+3',visual:nAndUnits(3)},{latex:'n^2',visual:square()},{latex:'\\dfrac{n}{2}',visual:fraction(2)}]},
    {id:'quadruple',prompt:'Quelle expression représente le quadruple du nombre $$n$$ ?',correct:'4n',options:[
      {latex:'4n',visual:nTerms(4)},{latex:'n+4',visual:nAndUnits(4)},{latex:'n^2',visual:square()},{latex:'\\dfrac{n}{4}',visual:fraction(4)}]},
    {id:'half',prompt:'Quelle expression représente la moitié du nombre $$n$$ ?',correct:'\\dfrac{n}{2}',options:[
      {latex:'\\dfrac{n}{2}',visual:fraction(2)},{latex:'2n',visual:nTerms(2)},{latex:'n-2',visual:nAndUnits(2,-1)},{latex:'n^2',visual:square()}]},
    {id:'quarter',prompt:'Quelle expression représente le quart du nombre $$n$$ ?',correct:'\\dfrac{n}{4}',options:[
      {latex:'\\dfrac{n}{4}',visual:fraction(4)},{latex:'4n',visual:nTerms(4)},{latex:'n-4',visual:nAndUnits(4,-1)},{latex:'n^2',visual:square()}]},
    {id:'predecessor',prompt:'Quelle expression représente le prédécesseur du nombre entier $$n$$ ?',correct:'n-1',options:[
      {latex:'n-1',visual:nAndUnits(1,-1)},{latex:'n+1',visual:nAndUnits(1)},{latex:'1-n',visual:terms({type:'u',count:1,sign:1},{type:'n',count:1,sign:-1})},{latex:'n',visual:singleN()}]},
    {id:'successor',prompt:'Quelle expression représente le successeur du nombre entier $$n$$ ?',correct:'n+1',options:[
      {latex:'n+1',visual:nAndUnits(1)},{latex:'n-1',visual:nAndUnits(1,-1)},{latex:'2n',visual:nTerms(2)},{latex:'n',visual:singleN()}]}
  ];
  const config=configs.find(item=>item.id===target)||pick(configs);
  const options=shuffledCopy(config.options);
  return {
    prompt:config.prompt,
    options,
    correctIndex:options.findIndex(option=>option.latex===config.correct)+1
  };
}

function makeFractionPercentInstance(mod,q){
  const scope=q.options&&q.options.formula_code?runCode(q.options.formula_code):{};
  const answers=parseAnswer(q,scope);
  let rawStatement=subVars(q.statement||'',scope);
  let rawFooter=subVars(q.footer||'',scope);
  const category=q.options&&q.options.fraction_percent_category;
  let fractionPercent=null;

  if(category==='fraction'){
    const numerator=Number(scope.p===undefined?1:scope.p);
    const denominator=Number(scope.q);
    const level=(typeof document!=='undefined'&&document.getElementById('level'))?document.getElementById('level').value:'4e';
    fractionPercent={
      kind:'fraction',
      numerator,
      denominator,
      total:Number(scope.n),
      part:Number(scope.n)/denominator,
      result:numerator*Number(scope.n)/denominator,
      label:String(scope.mot||'la fraction'),
      wordLabels:level==='5e'
    };
  }

  if(category==='percent'){
    const percent=Number(q.options.percent_dynamic?scope.a:q.options.percent_value);
    fractionPercent={
      kind:'percent',
      percent,
      denominator:100/percent,
      total:Number(scope.c),
      part:Number(scope.c)*percent/100,
      result:Number(scope.c)*percent/100,
      contextual:!!q.options.percent_contextual
    };
  }

  if(q.options&&q.options.percent_contextual){
    const percent=fmt(scope.a);
    const contexts=[
      {prompt:`Dans un collège de $$${scope.c}$$ élèves, $$${percent}\\%$$ sont externes. Combien d’élèves sont externes ?`,unit:'élèves'},
      {prompt:`Une bibliothèque possède $$${scope.c}$$ livres. $$${percent}\\%$$ sont des bandes dessinées. Combien de bandes dessinées possède-t-elle ?`,unit:'bandes dessinées'},
      {prompt:`Un club sportif compte $$${scope.c}$$ adhérents. $$${percent}\\%$$ pratiquent la natation. Combien d’adhérents pratiquent la natation ?`,unit:'adhérents'},
      {prompt:`Un verger compte $$${scope.c}$$ arbres. $$${percent}\\%$$ sont des pommiers. Combien de pommiers y a-t-il ?`,unit:'pommiers'},
      {prompt:`Une collection contient $$${scope.c}$$ cartes. $$${percent}\\%$$ sont rares. Combien de cartes rares contient-elle ?`,unit:'cartes rares'}
    ];
    const context=contexts[Number(scope.contextIndex)||0];
    rawStatement='<div style="text-align:justify">'+context.prompt+'</div>';
    rawFooter='$$[[formula]]\\text{ '+context.unit+'}$$';
  }

  return {module:mod,q,scope,answers,rawStatement,rawFooter,hasSvg:false,fractionPercent};
}

function makeMultipleFormsInstance(mod,q){
  const scope=q.options&&q.options.formula_code?runCode(q.options.formula_code):{};
  let answers=parseAnswer(q,scope);
  let rawStatement=subVars(q.statement||'',scope);
  const rawFooter=subVars(q.footer||'',scope);
  if(q.options&&q.options.shuffle_answers){
    const shuffled=shuffledQcm(rawStatement,answers);
    rawStatement=shuffled.statement;
    answers=shuffled.answers;
  }
  const kind=q.options&&q.options.multiple_forms_kind;
  let multipleForms={kind};
  if(kind==='decimal_to_tenths'){
    multipleForms={kind,value:Number(scope.dec),tenths:Number(scope.num)};
  }else if(kind==='decimal_to_irreducible'){
    multipleForms={kind,value:Number(scope.dec),hundredths:Number(scope.c),numerator:Number(scope.p),denominator:Number(scope.den)};
  }else if(kind==='decimal_to_percent'){
    multipleForms={kind,value:Number(scope.dec),hundredths:Number(scope.c)};
  }else if(kind==='percent_to_decimal'||kind==='percent_to_fraction100'){
    multipleForms={kind,value:Number(scope.p)/100,hundredths:Number(scope.p)};
  }else if(kind==='fraction_to_decimal'||kind==='fraction_to_percent'||kind==='equivalent_to100'){
    multipleForms={kind,value:Number(scope.a)/Number(scope.b),hundredths:Number(scope.a)*100/Number(scope.b),numerator:Number(scope.a),denominator:Number(scope.b)};
  }else if(kind==='simplify_decimal_fraction'){
    multipleForms={kind,value:Number(scope.num)/Number(scope.baseDen),hundredths:Number(scope.num)*100/Number(scope.baseDen),sourceNumerator:Number(scope.num),sourceDenominator:Number(scope.baseDen),numerator:Number(scope.p),denominator:Number(scope.den)};
  }else if(kind==='synthesis_line'){
    multipleForms={kind,value:Number(scope.dec),tenths:Number(scope.num)};
  }
  return {module:mod,q,scope,answers,rawStatement,rawFooter,hasSvg:false,multipleForms};
}

function makeAngleSumInstance(mod,q){
  const scope=q.options&&q.options.formula_code?runCode(q.options.formula_code):{};
  let answers=parseAnswer(q,scope);
  let rawStatement=subVars(q.statement||'',scope);
  const rawFooter=subVars(q.footer||'',scope);
  if(q.options&&q.options.shuffle_answers){
    const shuffled=shuffledQcm(rawStatement,answers);
    rawStatement=shuffled.statement;
    answers=shuffled.answers;
  }
  const kind=q.options&&q.options.angle_sum_kind;
  let bar=null;
  if(kind==='general'){
    const third=180-Number(scope.a)-Number(scope.b);
    bar={view:'bar',values:[Number(scope.a),Number(scope.b),third],unknown:[2]};
  }
  if(kind==='right'){
    bar={view:'bar',values:[90,Number(scope.a),90-Number(scope.a)],unknown:[2]};
  }
  if(kind==='isosceles_vertex'){
    const base=(180-Number(scope.a))/2;
    bar={view:'bar',values:[Number(scope.a),base,base],unknown:[1,2]};
  }
  if(kind==='isosceles_base'){
    bar={view:'bar',values:[Number(scope.a),Number(scope.a),180-2*Number(scope.a)],unknown:[2]};
  }
  if(kind==='equilateral'){
    bar={view:'bar',values:[60,60,60],unknown:[0,1,2]};
  }
  if(kind==='validity_three'||kind==='figure'){
    bar={view:kind==='figure'?'combined':'bar',values:[Number(scope.a),Number(scope.b),Number(scope.c)],unknown:kind==='figure'?[2]:[]};
  }
  if(kind==='invalid_two'){
    bar={view:'bar',values:[Number(scope.a),Number(scope.b)],unknown:[],comparison:true};
  }
  return {module:mod,q,scope,answers,rawStatement,rawFooter,hasSvg:/<svg/i.test(rawStatement+rawFooter),angleSum:{kind,bar}};
}

// dnb_35 — hausse et baisse en pourcentage (refonte V1, octobre 2026).
// Le générateur tire tout ici : énoncé, réponse, correction en 1 à 3 lignes,
// indices de l’aide (jamais la réponse), une phrase par piège des QCM et le
// dessin d’aide (la barre de 100 %, sans total ni accolade).
const EVO_FINE='\u202f',EVO_INSEC='\u00a0';
const EVO_PRICES=[12,15,18,20,24,25,30,35,40,45,48,50,60,64,70,75,80,90,120,150,160,180,200,240,250,300,350,400,450,500,600,800];
// Objets et fourchettes de prix crédibles (un livre ne coûte pas 450 €).
const EVO_ITEMS=[['Un article',0,1e9],['Un livre',12,30],['Un jeu',15,70],['Un sac',20,90],['Une veste',30,150],['Un casque',24,150],['Une montre',40,250],['Un vélo',150,800],['Un téléphone',150,800]];
function evoItem(price){return pick(EVO_ITEMS.filter(([,min,max])=>price>=min&&price<=max))[0];}
// Effectifs : nom au pluriel, phrase de départ, sujet de l’évolution, question.
const EVO_GROUPS=[
  {unit:'habitants',values:Array.from({length:22},(_,i)=>300+100*i),
   start:n=>'Un village compte '+n+'.<br>',subject:'Sa population',
   ask:(up)=>'Combien d’habitants compte-t-il après cette '+(up?'augmentation':'baisse')+EVO_INSEC+'?',
   howMuch:(up)=>'De combien d’habitants la population '+(up?'augmente':'baisse')+'-t-elle'+EVO_INSEC+'?'},
  {unit:'adhérents',values:Array.from({length:19},(_,i)=>40+20*i),
   start:n=>'Un club de sport compte '+n+'.<br>',subject:'L’année suivante, ce nombre',
   ask:()=>'Combien d’adhérents compte alors le club'+EVO_INSEC+'?',
   howMuch:(up)=>'De combien d’adhérents ce nombre '+(up?'augmente':'baisse')+'-t-il'+EVO_INSEC+'?'},
  {unit:'élèves',values:Array.from({length:31},(_,i)=>300+20*i),
   start:n=>'Un collège compte '+n+'.<br>',subject:'L’année suivante, l’effectif',
   ask:()=>'Combien d’élèves compte alors le collège'+EVO_INSEC+'?',
   howMuch:(up)=>'De combien d’élèves l’effectif '+(up?'augmente':'baisse')+'-t-il'+EVO_INSEC+'?'}
];
function evoNum(value){
  const v=Math.round(Number(value)*1000)/1000;
  const [whole,decimals]=String(Math.abs(v)).split('.');
  const grouped=whole.length>3?whole.replace(/\B(?=(\d{3})+(?!\d))/g,EVO_FINE):whole;
  return (v<0?'−':'')+grouped+(decimals?','+decimals:'');
}
// Prix : 40,5 s’écrit 40,50.
function evoEuroNum(value){
  const cents=Math.round(Number(value)*100);
  return cents%100===0?evoNum(cents/100):evoNum(Math.floor(cents/100))+','+String(cents%100).padStart(2,'0');
}
function evoPct(p){return p+EVO_FINE+'%';}
function evoNumFor(value,unit){return unit==='€'?evoEuroNum(value):evoNum(value);}
function evoQty(value,unit){return evoNumFor(value,unit)+(unit?EVO_INSEC+unit:'');}
function evoFrac(a,b){return '$$\\frac{'+a+'}{'+b+'}$$';}
// p % de x, calculé de tête (ligne de correction).
function evoPartLine(x,p,unit){
  const money=unit==='€',X=evoNumFor(x,unit),A=evoNumFor(x*p/100,unit)+(money?EVO_INSEC+'€':'');
  const of=evoPct(p)+' de '+(money?evoQty(x,unit):X)+' = ';
  const tenth=evoPct(10)+' de '+(money?evoQty(x,unit):X)+' = '+evoNumFor(x/10,unit)+(money?EVO_INSEC+'€':'');
  if(p===10) return of+X+' ÷ 10 = '+A;
  if(p===50) return of+X+' ÷ 2 = '+A;
  if(p===25) return of+X+' ÷ 4 = '+A;
  if(p===5) return tenth+' ; '+evoPct(5)+' = '+evoNumFor(x/10,unit)+' ÷ 2 = '+A;
  if(p%10===0) return tenth+' ; '+evoPct(p)+' = '+(p/10)+' × '+evoNumFor(x/10,unit)+' = '+A;
  return of+evoFrac(p,100)+' × '+X+' = '+A;
}
// La même chose, sans le résultat (indice de l’aide).
function evoPartHint(x,p,unit){
  const X=evoNumFor(x,unit);
  if(p===10) return 'Ici, '+evoPct(10)+' de '+X+', c’est '+X+' ÷ 10.';
  if(p===50) return 'Ici, '+evoPct(50)+' de '+X+', c’est la moitié : '+X+' ÷ 2.';
  if(p===25) return 'Ici, '+evoPct(25)+' de '+X+', c’est le quart : '+X+' ÷ 4.';
  if(p===5) return 'Ici, prends '+evoPct(10)+' de '+X+' ('+X+' ÷ 10), puis la moitié.';
  if(p%10===0) return 'Ici, prends '+evoPct(10)+' de '+X+' ('+X+' ÷ 10), puis multiplie par '+(p/10)+'.';
  return 'Ici, '+evoPct(p)+' de '+X+', c’est '+evoFrac(p,100)+' × '+X+'.';
}
function evoAmountIsSimple(x,p){
  const a=x*p/100;
  if(Math.abs(a*10-Math.round(a*10))>1e-9) return false;
  return p!==25||x%4===0;
}
function evoPickPrice(p,integerOnly=false){
  const ok=EVO_PRICES.filter(x=>evoAmountIsSimple(x,p)&&(!integerOnly||Number.isInteger(x*p/100))&&x!==100);
  return pick(ok);
}
function evoPickGroup(p){
  const group=pick(EVO_GROUPS);
  const values=group.values.filter(n=>Number.isInteger(n*p/100)&&n!==100);
  return {group,n:pick(values)};
}
function evoBar(initial,p,up,normalized){
  const unit=GCD(100,p),baseCells=100/unit,deltaCells=p/unit;
  return {kind:'',direction:up?'increase':'decrease',percent:p,initial,amount:initial*p/100,
    newTotal:up?initial*(1+p/100):initial*(1-p/100),normalized,baseCells,deltaCells,cellValue:initial/baseCells,
    braceMode:normalized?'coefficient':(up?'newTotal':'remainder')};
}
function evoQcm(prompt,correct,traps){
  // traps : [{text, feedback}] ; les quatre choix sont mélangés.
  const options=[{text:correct,feedback:null},...traps];
  const order=shuffleLocal(options.map((_,i)=>i));
  const shown=order.map(i=>options[i]);
  const feedback={};
  shown.forEach((option,index)=>{if(option.feedback) feedback[String(index+1)]=option.feedback;});
  return {rawStatement:prompt+'&&'+shown.map(option=>option.text).join('&&')+'&&',answers:[String(order.indexOf(0)+1)],feedback};
}

// « de 10 % » : l’espace insécable garde « de » avec le pourcentage (pas de
// « 10 %. » seul en bout de ligne).
function evoDe(p){return 'de'+EVO_INSEC+evoPct(p);}
function evoLower(item){return item.replace(/^Une? /,m=>m==='Une '?'une ':'un ');}

function makeEvolutionInstance(mod,q){
  // La carte « Comment on trouve » tient 3 lignes à l’ordinateur 1366 × 625 :
  // étapes + note (ou phrase du piège) ne dépassent jamais 3 lignes.
  const kind=String(q.options&&q.options.evolution_kind||'');
  const up=/increase/.test(kind)||(kind==='change_amount'||kind==='trap_qcm'?rnd()<.5:false);
  const sign=up?'+':'−',verb=up?'Augmenter':'Baisser',addOrRemove=up?'ajouter':'enlever';
  const ask='Quel est son nouveau prix'+EVO_INSEC+'?';
  let rawStatement='',rawFooter='',answers=[],steps=[],aide=[],note='',feedback=null,bar=null,p=10,initial=0,unit='€';

  if(kind==='price_increase'||kind==='price_decrease'){
    // Formes des sujets : AN 2, AA 7, PO 5 (baisse de 10 %), R1 9 (15 €, + 20 %).
    p=up?pick([10,10,20,20,25,40,50,5,30]):(rnd()<.5?10:pick([20,25,50,5,30,40]));
    initial=evoPickPrice(p);
    const item=evoItem(initial),X=evoQty(initial,'€'),P=evoPct(p),form=rnd();
    if(up) rawStatement=form<.4
      ?item+' coûte '+X+'.<br>Son prix augmente '+evoDe(p)+'.<br>'+ask
      :(form<.7
        ?item+' coûte '+X+'.<br>Quel sera son prix après une augmentation '+evoDe(p)+EVO_INSEC+'?'
        :'Le prix d’'+evoLower(item)+' de '+X+' augmente '+evoDe(p)+'.<br>'+ask);
    else rawStatement=form<.3
      ?item+' coûte '+X+'.<br>Son prix baisse '+evoDe(p)+'.<br>'+ask
      :(form<.55
        ?item+' coûte '+X+'.<br>Quel sera son prix après une réduction '+evoDe(p)+EVO_INSEC+'?'
        :(form<.8
          ?item+' coûte '+X+'.<br>Calcule son nouveau prix après une baisse '+evoDe(p)+'.'
          :'Pendant les soldes, le prix d’'+evoLower(item)+' à '+X+' baisse '+evoDe(p)+'.<br>'+ask));
    const result=up?initial*(1+p/100):initial*(1-p/100);
    answers=[evoEuroNum(result)];
    rawFooter='[[formula]]'+EVO_INSEC+'€';
    steps=[(up?'On ajoute ':'On enlève ')+P+' du prix.',evoPartLine(initial,p,'€'),
      evoEuroNum(initial)+' '+sign+' '+evoEuroNum(initial*p/100)+' = <strong>'+evoQty(result,'€')+'</strong>'];
    aide=['Calcule d’abord '+P+' du prix : c’est '+(up?'l’augmentation':'la baisse')+'. '+(up?'Ajoute-la ensuite au prix.':'Enlève-la ensuite du prix.'),evoPartHint(initial,p,'€')];
    bar=evoBar(initial,p,up,false);
  }else if(kind==='count_increase'||kind==='count_decrease'){
    p=pick([5,10,10,20,25]);
    const drawn=evoPickGroup(p),group=drawn.group;
    initial=drawn.n;unit=group.unit;
    const P=evoPct(p),result=up?initial*(1+p/100):initial*(1-p/100);
    rawStatement=group.start(evoQty(initial,unit))+group.subject+' '+(up?'augmente':'baisse')+' '+evoDe(p)+'.<br>'+group.ask(up);
    answers=[evoNum(result)];
    rawFooter='[[formula]]'+EVO_INSEC+unit;
    steps=[(up?'On ajoute ':'On enlève ')+P+' des '+unit+'.',evoPartLine(initial,p,''),
      evoNum(initial)+' '+sign+' '+evoNum(initial*p/100)+' = <strong>'+evoQty(result,unit)+'</strong>'];
    aide=['Calcule d’abord '+P+' de '+evoNum(initial)+', puis '+(up?'ajoute-le à ':'enlève-le de ')+evoNum(initial)+'.',evoPartHint(initial,p,'')];
    bar=evoBar(initial,p,up,false);
  }else if(kind==='increase_coefficient'||kind==='decrease_coefficient'){
    // p de 2 à 60 % ; une fois sur deux en contexte « 20 × … » (AG-pro 9).
    // Les petits pourcentages entraînent le piège de la DEPP (+ 3 % : × 1,3).
    p=pick([2,3,4,5,6,8,10,12,15,20,25,30,40,50,60]);
    const P=evoPct(p),total=up?100+p:100-p,coefficient=total/100,C=evoNum(coefficient);
    const context=rnd()<.5;
    const verbC=context?verb:(up?'Augmenter':'Diminuer');
    answers=[C];
    if(!context){
      rawStatement=verbC+' une quantité '+evoDe(p)+' revient à la multiplier par quel nombre'+EVO_INSEC+'?';
      rawFooter='× [[formula]]';
    }else{
      initial=evoPickPrice(10,true);
      rawStatement=evoItem(initial)+' coûte '+evoQty(initial,'€')+'.<br>Son prix '+(up?'augmente':'baisse')+' '+evoDe(p)+'.<br>Complète le calcul qui donne le nouveau prix.';
      rawFooter=evoEuroNum(initial)+' × [[formula]]';
    }
    // Lignes courtes : la carte tient aussi au téléphone de 320 px.
    steps=['100'+EVO_FINE+'% '+sign+' '+P+' = '+evoPct(total),
      evoPct(total)+' = '+evoFrac(total,100)+' = <strong>'+C+'</strong>'];
    aide=[(up?'Après la hausse':'Après la baisse')+', on a 100'+EVO_FINE+'% '+sign+' '+P+' '+(context?'du prix de départ.':'de la quantité de départ.'),
      'Écris ce pourcentage sous forme de fraction sur 100, puis en nombre décimal.'];
    note=p<10
      ?'Attention : × '+evoNum(up?1+p/10:1-p/10)+', ce serait '+sign+' '+evoPct(p*10)+'.'
      :'Attention : × '+evoNum(p/100)+' calcule '+(up?'la hausse.':'la baisse.');
    bar=evoBar(1,p,up,true);
    initial=initial||1;
  }else if(kind==='increase_qcm'||kind==='decrease_qcm'){
    // « Quel calcul donne le nouveau prix ? » : G1 8 (80 − 10/100 × 80, et ses
    // trois pièges) et AG-pro 9 (20 + 20 × 40/100 ou 20 × 1,4). Chaque choix
    // porte sa valeur : on refait le tirage si deux choix sont égaux.
    const brevet=rnd()<.6,firstThird=rnd(),order=rnd();
    let options,tries=0;
    do{
      p=pick([10,10,20,25,30,40,50]);
      initial=evoPickPrice(p,true);
      const x=evoNum(initial),P=evoPct(p),frac='\\frac{'+p+'}{100}',op=up?'+':'−',s=up?1:-1,d=evoNum(p/100),money=v=>evoQty(v,'€');
      const did=up?'Tu as ajouté ':'Tu as enlevé ',amount=initial*p/100;
      const added={text:'$$'+x+' '+op+' '+p+'$$',value:initial+s*p,feedback:did+p+EVO_INSEC+'€, pas '+P+' du prix.'};
      const tiny={text:'$$'+x+' '+op+' '+(brevet?frac:d)+'$$',value:initial+s*p/100,feedback:did+d+EVO_INSEC+'€, pas '+P+' du prix.'};
      const onlyPart=text=>({text,value:amount,feedback:'C’est seulement '+(up?'l’augmentation':'la baisse')+' ('+money(amount)+').'});
      let correct,thirds;
      if(brevet){
        const part=order<.5?frac+' \\times '+x:x+' \\times '+frac;
        correct={text:'$$'+x+' '+op+' '+part+'$$'};
        thirds=[{text:'$$('+x+' '+op+' '+frac+') \\times '+x+'$$',value:(initial+s*p/100)*initial,
          feedback:'Ce calcul vaut '+evoNum(initial+s*p/100)+' × '+x+'.'},onlyPart('$$'+part+'$$')];
      }else{
        const wrong=evoNum(1-s*p/100);
        correct={text:'$$'+x+' \\times '+evoNum(1+s*p/100)+'$$'};
        thirds=[{text:'$$'+x+' \\times '+wrong+'$$',value:initial*(1-s*p/100),feedback:'× '+wrong+' fait '+(up?'baisser':'augmenter')+' le prix.'},onlyPart('$$'+x+' \\times '+d+'$$')];
      }
      correct.value=initial*(1+s*p/100);
      if(firstThird>=(brevet?.6:.5)) thirds.reverse();
      const third=thirds.find(t=>![correct,added,tiny].some(o=>Math.abs(o.value-t.value)<1e-9));
      options=third?[correct,added,tiny,third]:null;
      if(options&&new Set(options.map(o=>Math.round(o.value*1000))).size<4) options=null;
      tries++;
    }while(!options&&tries<50);
    const x=evoNum(initial),P=evoPct(p),total=up?100+p:100-p,c=evoNum(total/100),money=v=>evoQty(v,'€');
    const result=up?initial*(1+p/100):initial*(1-p/100),amount=initial*p/100;
    const prompt=up
      ?'Le prix d’un article coûtant '+money(initial)+' augmente '+evoDe(p)+'.<br>Quel calcul donne le nouveau prix'+EVO_INSEC+'?'
      :'Un article coûte '+money(initial)+'.<br>Son prix baisse '+evoDe(p)+'.<br>Quel calcul donne le prix final'+EVO_INSEC+'?';
    const qcm=evoQcm(prompt,options[0].text,options.slice(1));
    rawStatement=qcm.rawStatement;answers=qcm.answers;feedback=qcm.feedback;
    if(brevet){
      // Au téléphone, la carte d’un QCM n’a que 3 lignes : étapes courtes.
      steps=[P+' de '+money(initial)+' = '+money(amount),
        x+' '+sign+' '+evoNum(amount)+' = <strong>'+money(result)+'</strong>'];
      aide=[verb+' '+evoDe(p)+', c’est '+addOrRemove+' '+P+' du prix.','Calcule de tête '+P+' de '+money(initial)+', puis cherche le calcul qui '+(up?'l’ajoute à ':'l’enlève à ')+x+'.'];
    }else{
      steps=['100'+EVO_FINE+'% '+sign+' '+P+' = '+evoPct(total)+' = '+c,
        x+' × '+c+' = <strong>'+money(result)+'</strong>'];
      aide=[verb+' '+evoDe(p)+', c’est multiplier par un seul nombre.','Calcule 100'+EVO_FINE+'% '+sign+' '+P+', puis écris ce pourcentage en nombre décimal.'];
    }
    bar=evoBar(initial,p,up,false);
  }else if(kind==='change_amount'){
    // « De combien le prix baisse-t-il ? » : la part seule (PO-pro 7 en
    // contexte), à ne pas confondre avec le nouveau prix.
    p=pick([5,10,10,20,25,30,40,50]);
    const P=evoPct(p);
    if(rnd()<.6){
      initial=evoPickPrice(p);unit='€';
      rawStatement=evoItem(initial)+' coûte '+evoQty(initial,'€')+'.<br>Son prix '+(up?'augmente':'baisse')+' '+evoDe(p)+'.<br>De combien d’euros le prix '+(up?'augmente':'baisse')+'-t-il'+EVO_INSEC+'?';
      rawFooter='[[formula]]'+EVO_INSEC+'€';
      answers=[evoEuroNum(initial*p/100)];
      steps=[(up?'L’augmentation':'La baisse')+' vaut '+P+' du prix.',evoPartLine(initial,p,'€').replace(/= ([^=]+)$/,'= <strong>$1</strong>')];
      note=(up?'L’augmentation':'La baisse')+' ('+evoQty(initial*p/100,'€')+') n’est pas le nouveau prix ('+evoQty(up?initial*(1+p/100):initial*(1-p/100),'€')+').';
    }else{
      const drawn=evoPickGroup(p),group=drawn.group;
      initial=drawn.n;unit=group.unit;
      rawStatement=group.start(evoQty(initial,unit))+group.subject+' '+(up?'augmente':'baisse')+' '+evoDe(p)+'.<br>'+group.howMuch(up);
      rawFooter='[[formula]]'+EVO_INSEC+unit;
      answers=[evoNum(initial*p/100)];
      steps=[(up?'L’augmentation':'La baisse')+' vaut '+P+' de '+evoNum(initial)+'.',(evoPartLine(initial,p,'')+EVO_INSEC+unit).replace(/= ([^=]+)$/,'= <strong>$1</strong>')];
      note=(up?'L’augmentation':'La baisse')+' ('+evoQty(initial*p/100,unit)+') n’est pas le nouvel effectif ('+evoQty(up?initial*(1+p/100):initial*(1-p/100),unit)+').';
    }
    aide=[(up?'L’augmentation':'La baisse')+', c’est '+P+' de '+evoNumFor(initial,unit)+'. On ne demande pas le nouveau '+(unit==='€'?'prix':'nombre')+'.',evoPartHint(initial,p,unit)];
    bar=evoBar(initial,p,up,false);
  }else if(kind==='trap_qcm'){
    // ZPA 8 (village de 800 habitants, + 10 %) : le bon résultat parmi
    // « ajoute 10 », « baisse au lieu de hausse » et « la part seule ».
    // 50 % est exclu : la part et le résultat d’une baisse seraient égaux.
    let values;
    let tries=0;
    do{
      p=pick([10,10,20,25,40]);
      if(rnd()<.5){unit='€';initial=evoPickPrice(p,true);}
      else{const drawn=evoPickGroup(p);unit='habitants';initial=drawn.n;}
      const a=initial*p/100;
      values={good:up?initial+a:initial-a,add:up?initial+p:initial-p,opposite:up?initial-a:initial+a,amount:a};
      tries++;
    }while(new Set(Object.values(values).map(v=>Math.round(v*100))).size<4&&tries<50);
    const P=evoPct(p),a=initial*p/100;
    const prompt=unit==='€'
      ?evoItem(initial)+' coûte '+evoQty(initial,'€')+'.<br>Son prix '+(up?'augmente':'baisse')+' '+evoDe(p)+'.<br>'+ask
      :'Un village de '+evoQty(initial,'habitants')+' a connu une '+(up?'augmentation':'baisse')+' '+evoDe(p)+' de sa population.<br>Combien y a-t-il d’habitants après cette '+(up?'augmentation':'baisse')+EVO_INSEC+'?';
    const qcm=evoQcm(prompt,evoQty(values.good,unit),[
      {text:evoQty(values.add,unit),feedback:(up?'Tu as ajouté ':'Tu as enlevé ')+evoQty(p,unit)+', pas '+P+(unit==='€'?' du prix':'')+'.'},
      {text:evoQty(values.opposite,unit),feedback:'C’est le résultat d’'+(up?'une baisse.':'une hausse.')},
      {text:evoQty(values.amount,unit),feedback:'C’est seulement '+(up?'l’augmentation.':'la baisse.')}]);
    rawStatement=qcm.rawStatement;answers=qcm.answers;feedback=qcm.feedback;
    steps=[P+' de '+evoNumFor(initial,unit)+' = '+evoNumFor(a,unit),evoNumFor(initial,unit)+' '+sign+' '+evoNumFor(a,unit)+' = <strong>'+evoQty(values.good,unit)+'</strong>'];
    aide=['Calcule d’abord '+P+' de '+evoNumFor(initial,unit)+', puis '+(up?'ajoute-le.':'enlève-le.'),evoPartHint(initial,p,unit==='€'?'€':'')];
    bar=evoBar(initial,p,up,false);
  }

  bar.kind=kind;
  const evolution=bar;
  const cells=evolution.baseCells+(up?evolution.deltaCells:0);
  const aideHtml=cells<=24?evolutionBarSvg(evolution,false):'';
  const inst={module:mod,q,scope:{p,initial},answers,rawStatement,rawFooter,hasSvg:false,evolution,
    correctionSteps:steps,aideSteps:aide,aideHtml};
  if(note) inst.correctionNote=note;
  if(feedback) inst.distractorFeedback=feedback;
  return inst;
}

function makeRelationInstance(mod,q){
  if(q.options&&q.options.relation_kind==='expression_qcm'){
    const qcm=relationExpressionChoices(q.options.expression_target);
    return {
      module:mod,q,scope:{},answers:[String(qcm.correctIndex)],
      rawStatement:qcm.prompt,rawFooter:'',hasSvg:false,
      relation:{kind:'expression_qcm',qcm}
    };
  }
  let scope={};
  if(q.options&&q.options.formula_code) scope=runCode(q.options.formula_code);
  let answers=parseAnswer(q,scope);
  let rawStatement=subVars(q.statement||'',scope);
  const rawFooter=subVars(q.footer||'',scope);
  if(q.options&&q.options.shuffle_answers){
    const shuffled=shuffledQcm(rawStatement,answers);
    rawStatement=shuffled.statement;
    answers=shuffled.answers;
  }
  const relationKind=q.options&&q.options.relation_kind;
  let relation=null;
  if(relationKind==='summary') relation={kind:relationKind,value:Number(scope.n)};
  if(relationKind==='multiple_direct') relation={kind:relationKind,factor:Number(q.options.factor),value:Number(scope.n),result:Number(scope.n)*Number(q.options.factor)};
  if(relationKind==='multiple_inverse') relation={kind:relationKind,factor:Number(q.options.factor),value:Number(scope.n),result:Number(scope.c)};
  if(relationKind==='fraction_direct') relation={kind:relationKind,divisor:Number(q.options.divisor),value:Number(scope.n),result:Number(scope.n)/Number(q.options.divisor)};
  if(relationKind==='predecessor') relation={kind:relationKind,value:Number(scope.n),result:Number(scope.n)-1};
  if(relationKind==='successor') relation={kind:relationKind,value:Number(scope.n),result:Number(scope.n)+1};
  if(relation) relation.prominent=true;
  return {module:mod,q,scope,answers,rawStatement,rawFooter,hasSvg:false,relation};
}

function conversionDataForQuestion(number,scope,answers){
  const metricUnits={length:['km','hm','dam','m','dm','cm','mm'],mass:['kg','hg','dag','g','dg','cg','mg'],capacity:['kL','hL','daL','L','dL','cL','mL']};
  const areaUnits=['km²','hm²','dam²','m²','dm²','cm²','mm²'];
  const volumeUnits=['km³','hm³','dam³','m³','dm³','cm³','mm³'];
  const configurations={
    1:{family:'length',units:metricUnits.length,source:'cm',target:'m',slots:1,value:scope.n},
    2:{family:'length',units:metricUnits.length,source:'km',target:'m',slots:1,value:Number(scope.n+'.'+scope.d)},
    3:{family:'area',units:areaUnits,source:'cm²',target:'m²',slots:2,value:scope.c},
    4:{family:'area',units:areaUnits,source:'m²',target:'cm²',slots:2,value:scope.n},
    5:{family:'volume',units:volumeUnits,source:'cm³',target:'dm³',slots:3,value:scope.c,crossLabels:true},
    6:{family:'mass',units:metricUnits.mass,source:'kg',target:'g',slots:1,value:Number(scope.n+'.'+scope.d)},
    7:{family:'capacity',units:metricUnits.capacity,source:'cL',target:'L',slots:1,value:scope.n},
    8:{family:'duration',hours:scope.h,minutes:scope.m,target:'s'},
    9:{family:'volume',units:volumeUnits,source:'m³',target:'dm³',slots:3,value:1,crossLabels:true},
    10:{family:'length',units:metricUnits.length,source:'km',target:'cm',slots:1,value:scope.n}
  };
  return {...configurations[number],answers};
}
function makeConversionInstance(mod,q){
  const scope=q.options&&q.options.formula_code?runCode(q.options.formula_code):{};
  const answerChoices=parseAnswerChoices(q,scope);
  const answers=answerChoices.map(choices=>choices[0]||'');
  return {
    module:mod,q,scope,answers,answerChoices,
    rawStatement:subVars(q.statement||'',scope),rawFooter:subVars(q.footer||'',scope),hasSvg:true,
    conversion:conversionDataForQuestion(Number(q.n),scope,answers)
  };
}

function trigTriangleData(){
  const sets=[['A','B','C'],['M','N','P'],['R','S','T'],['E','F','G']];
  const letters=sets[RD(0,sets.length-1)];
  return {angle:letters[0],right:letters[1],other:letters[2],orientation:RD(0,7),shape:RD(0,4),adjacent:letters[0]+letters[1],opposite:letters[1]+letters[2],hypotenuse:letters[0]+letters[2]};
}
function trigSvgPoint(point){ return point.x.toFixed(1)+' '+point.y.toFixed(1); }
function trigUnitVector(from,to){
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
  return {x:dx/length,y:dy/length};
}
function trigOffset(point,vector,distance){ return {x:point.x+vector.x*distance,y:point.y+vector.y*distance}; }
function trigReadableAngle(from,to){
  let angle=Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI;
  if(angle>90) angle-=180;
  if(angle<-90) angle+=180;
  return angle;
}
function trigLabelPosition(from,to,centroid,distance=19){
  const midpoint={x:(from.x+to.x)/2,y:(from.y+to.y)/2},direction=trigUnitVector(from,to);
  const normal={x:-direction.y,y:direction.x};
  const first=trigOffset(midpoint,normal,distance),second=trigOffset(midpoint,normal,-distance);
  const firstDistance=Math.hypot(first.x-centroid.x,first.y-centroid.y);
  const secondDistance=Math.hypot(second.x-centroid.x,second.y-centroid.y);
  return firstDistance>=secondDistance?first:second;
}
function trigTransformPoint(point,index){
  const orientation=Math.abs(Number(index)||0)%8,x=point.x,y=point.y;
  return [
    {x,y},{x:-x,y},{x,y:-y},{x:-x,y:-y},
    {x:y,y:x},{x:-y,y:x},{x:y,y:-x},{x:-y,y:-x}
  ][orientation];
}
function trigFitLayout(points,{left=48,right=332,top=38,bottom=200}={}){
  const minX=Math.min(...points.map(point=>point.x)),maxX=Math.max(...points.map(point=>point.x));
  const minY=Math.min(...points.map(point=>point.y)),maxY=Math.max(...points.map(point=>point.y));
  const sourceWidth=Math.max(1,maxX-minX),sourceHeight=Math.max(1,maxY-minY);
  const scale=Math.min((right-left)/sourceWidth,(bottom-top)/sourceHeight);
  const width=sourceWidth*scale,height=sourceHeight*scale;
  const offsetX=left+(right-left-width)/2-minX*scale;
  const offsetY=top+(bottom-top-height)/2-minY*scale;
  return points.map(point=>({x:point.x*scale+offsetX,y:point.y*scale+offsetY}));
}
function trigTriangleLayout(index,shape=0,shapeRatio=null){
  const ratios=[0.48,0.68,0.92,1.28,1.72];
  const requested=Number(shapeRatio);
  const ratio=Number.isFinite(requested)&&requested>0?Math.max(.26,Math.min(2.25,requested)):ratios[Math.abs(Number(shape)||0)%ratios.length];
  const base=[{x:0,y:0},{x:1,y:0},{x:1,y:-ratio}];
  return trigFitLayout(base.map(point=>trigTransformPoint(point,index)));
}
function trigTriangleSvg(triangle,sideLabels={}){
  const label=(key,fallback)=>escapeHtml(String(sideLabels[key]??fallback));
  const [anglePoint,rightPoint,otherPoint]=trigTriangleLayout(triangle.orientation,triangle.shape,triangle.shapeRatio);
  const centroid={x:(anglePoint.x+rightPoint.x+otherPoint.x)/3,y:(anglePoint.y+rightPoint.y+otherPoint.y)/3};
  const rightToAngle=trigUnitVector(rightPoint,anglePoint),rightToOther=trigUnitVector(rightPoint,otherPoint),rightSize=18;
  const rightOne=trigOffset(rightPoint,rightToAngle,rightSize);
  const rightTwo=trigOffset(rightOne,rightToOther,rightSize);
  const rightThree=trigOffset(rightPoint,rightToOther,rightSize);
  const angleToRight=trigUnitVector(anglePoint,rightPoint),angleToOther=trigUnitVector(anglePoint,otherPoint),angleRadius=34;
  const angleStart=trigOffset(anglePoint,angleToRight,angleRadius),angleEnd=trigOffset(anglePoint,angleToOther,angleRadius);
  const angleSweep=angleToRight.x*angleToOther.y-angleToRight.y*angleToOther.x>0?1:0;
  const angleBisector=trigUnitVector({x:0,y:0},{x:angleToRight.x+angleToOther.x,y:angleToRight.y+angleToOther.y});
  const angleMark=trigOffset(anglePoint,angleBisector,48);
  const vertexLabel=(point,name)=>{
    const outward=trigUnitVector(centroid,point),position=trigOffset(point,outward,20);
    return '<text x="'+position.x.toFixed(1)+'" y="'+position.y.toFixed(1)+'" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-style="italic" font-size="23" fill="#17384d">'+name+'</text>';
  };
  const sideLabel=(from,to,text,color)=>{
    const position=trigLabelPosition(from,to,centroid),rotation=trigReadableAngle(from,to);
    return '<text x="'+position.x.toFixed(1)+'" y="'+position.y.toFixed(1)+'" dominant-baseline="middle" text-anchor="middle" font-size="18" font-weight="850" fill="'+color+'" transform="rotate('+rotation.toFixed(1)+' '+position.x.toFixed(1)+' '+position.y.toFixed(1)+')">'+text+'</text>';
  };
  return '<svg class="trig-question-svg" viewBox="0 0 380 235" role="img" aria-label="Triangle '+triangle.angle+triangle.right+triangle.other+' rectangle en '+triangle.right+'">'
    +'<polygon points="'+trigSvgPoint(anglePoint)+' '+trigSvgPoint(rightPoint)+' '+trigSvgPoint(otherPoint)+'" fill="#eef6ff" stroke="#17384d" stroke-width="3" stroke-linejoin="round"/>'
    +'<path d="M'+trigSvgPoint(rightOne)+' L'+trigSvgPoint(rightTwo)+' L'+trigSvgPoint(rightThree)+'" fill="none" stroke="#e86100" stroke-width="4"/>'
    +'<path d="M'+trigSvgPoint(angleStart)+' A'+angleRadius+' '+angleRadius+' 0 0 '+angleSweep+' '+trigSvgPoint(angleEnd)+'" fill="none" stroke="#e86100" stroke-width="4"/>'
    +vertexLabel(anglePoint,triangle.angle)+vertexLabel(rightPoint,triangle.right)+vertexLabel(otherPoint,triangle.other)
    +sideLabel(anglePoint,rightPoint,label('adjacent',triangle.adjacent),'#0879d0')
    +sideLabel(rightPoint,otherPoint,label('opposite',triangle.opposite),'#b23a48')
    +sideLabel(anglePoint,otherPoint,label('hypotenuse',triangle.hypotenuse),'#7651b5')
    +'<text x="'+angleMark.x.toFixed(1)+'" y="'+angleMark.y.toFixed(1)+'" dominant-baseline="middle" text-anchor="middle" font-size="16" font-weight="900" fill="#e86100">'+triangle.angle+'̂</text></svg>';
}
function trigPythagoreanData(){
  const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29]];
  const [opposite,adjacent,hypotenuse]=triples[RD(0,triples.length-1)];
  return {opposite,adjacent,hypotenuse};
}
function trigFractionLatex(numerator,denominator){ return '$$\\dfrac{'+numerator+'}{'+denominator+'}$$'; }
function trigGeneralTriangleSvg(triangle,sideLabels={}){
  const shapes=[
    [{x:0,y:1},{x:.45,y:0},{x:1.2,y:.92}],
    [{x:0,y:.85},{x:.78,y:0},{x:1.25,y:1}],
    [{x:0,y:1},{x:.28,y:.08},{x:1.35,y:.78}],
    [{x:0,y:.72},{x:.9,y:0},{x:1.25,y:1.02}],
    [{x:0,y:.95},{x:.62,y:0},{x:1.4,y:.66}]
  ];
  const base=shapes[Math.abs(Number(triangle.shape)||0)%shapes.length];
  const points=trigFitLayout(base.map(point=>trigTransformPoint(point,triangle.orientation)),{left:55,right:325,top:35,bottom:198});
  const centroid={x:points.reduce((sum,point)=>sum+point.x,0)/3,y:points.reduce((sum,point)=>sum+point.y,0)/3};
  const names=[triangle.angle,triangle.right,triangle.other];
  const edges=[
    [points[0],points[1],sideLabels.left??triangle.adjacent,'#0879d0'],
    [points[1],points[2],sideLabels.right??triangle.opposite,'#b23a48'],
    [points[0],points[2],sideLabels.base??triangle.hypotenuse,'#7651b5']
  ];
  const vertexLabels=points.map((point,index)=>{
    const outward=trigUnitVector(centroid,point),position=trigOffset(point,outward,20);
    return '<text x="'+position.x.toFixed(1)+'" y="'+position.y.toFixed(1)+'" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-style="italic" font-size="23" fill="#17384d">'+names[index]+'</text>';
  }).join('');
  const edgeLabels=edges.map(([from,to,value,color])=>{
    const position=trigLabelPosition(from,to,centroid),rotation=trigReadableAngle(from,to);
    return '<text x="'+position.x.toFixed(1)+'" y="'+position.y.toFixed(1)+'" dominant-baseline="middle" text-anchor="middle" font-size="18" font-weight="850" fill="'+color+'" transform="rotate('+rotation.toFixed(1)+' '+position.x.toFixed(1)+' '+position.y.toFixed(1)+')">'+escapeHtml(String(value))+'</text>';
  }).join('');
  return '<svg class="trig-question-svg" viewBox="0 0 380 235" role="img" aria-label="Triangle '+triangle.angle+triangle.right+triangle.other+' sans angle droit indiqué">'
    +'<polygon points="'+points.map(trigSvgPoint).join(' ')+'" fill="#fff8e8" stroke="#17384d" stroke-width="3" stroke-linejoin="round"/>'
    +vertexLabels+edgeLabels+'</svg>';
}
function trigSimilaritySvg(scale=2){
  const first={x:25,y:185},firstRight={x:145,y:185},firstTop={x:145,y:95};
  const second={x:260,y:185},secondRight={x:490,y:185},secondTop={x:490,y:25};
  const triangle=(a,b,c,adj,opp,hyp)=>'<polygon points="'+[a,b,c].map(trigSvgPoint).join(' ')+'" fill="#eef6ff" stroke="#17384d" stroke-width="3"/>'
    +'<path d="M'+(b.x-16)+' '+b.y+' L'+(b.x-16)+' '+(b.y-16)+' L'+b.x+' '+(b.y-16)+'" fill="none" stroke="#e86100" stroke-width="4"/>'
    +'<text x="'+((a.x+b.x)/2)+'" y="210" text-anchor="middle" font-size="17" font-weight="850" fill="#0879d0">'+adj+'</text>'
    +'<text x="'+(b.x+18)+'" y="'+((b.y+c.y)/2)+'" text-anchor="middle" font-size="17" font-weight="850" fill="#b23a48">'+opp+'</text>'
    +'<text x="'+((a.x+c.x)/2-8)+'" y="'+((a.y+c.y)/2-8)+'" text-anchor="middle" font-size="17" font-weight="850" fill="#7651b5">'+hyp+'</text>'
    +'<text x="'+(a.x+30)+'" y="'+(a.y-10)+'" font-size="17" font-weight="900" fill="#e86100">α</text>';
  return '<svg class="trig-question-svg" viewBox="0 0 520 225" role="img" aria-label="Deux triangles rectangles semblables ayant le même angle alpha">'
    +triangle(first,firstRight,firstTop,4,3,5)
    +triangle(second,secondRight,secondTop,4*scale,3*scale,5*scale)
    +'</svg>';
}
function trigRatioFormulas(triangle){
  return {
    cos:'$$\\cos(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.adjacent+'}{'+triangle.hypotenuse+'}$$',
    sin:'$$\\sin(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.opposite+'}{'+triangle.hypotenuse+'}$$',
    tan:'$$\\tan(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.opposite+'}{'+triangle.adjacent+'}$$'
  };
}
function trigFormulaDistractors(triangle,ratio){
  const formulas=trigRatioFormulas(triangle),names=['cos','sin','tan'],others=names.filter(name=>name!==ratio);
  const parts={cos:[triangle.adjacent,triangle.hypotenuse],sin:[triangle.opposite,triangle.hypotenuse],tan:[triangle.opposite,triangle.adjacent]};
  const [numerator,denominator]=parts[ratio];
  return [
    formulas[ratio],
    formulas[others[0]],
    '$$\\'+ratio+'(\\widehat{'+triangle.angle+'})=\\dfrac{'+denominator+'}{'+numerator+'}$$',
    '$$\\'+others[1]+'(\\widehat{'+triangle.angle+'})=\\dfrac{'+numerator+'}{'+denominator+'}$$'
  ];
}
function trigQcmInstance(mod,q,prompt,options,correctAnswers,triangle,extra={}){
  const statement=prompt+'&&'+options.join('&&')+'&&';
  const shuffled=shuffledQcm(statement,correctAnswers.map(String));
  const answers=shuffled.answers;
  return {module:mod,q,scope:{},answers,answerChoices:answers.map(answer=>[answer]),rawStatement:shuffled.statement,rawFooter:'[['+(answers.length>1?'qcm':'qcm1')+']]',hasSvg:/<svg/i.test(prompt),trig:{triangle,...extra}};
}
function trigDirectInstance(mod,q,prompt,footer,result,triangle,extra={}){
  const answer=fmt(result);
  return {module:mod,q,scope:{},answers:[answer],answerChoices:[[answer]],rawStatement:prompt,rawFooter:footer,hasSvg:true,trig:{triangle,...extra}};
}
function makeTrigInstance(mod,q){
  const kind=q.options.trig_kind,triangle=trigTriangleData(),svg=trigTriangleSvg(triangle),formulas=trigRatioFormulas(triangle);
  const triangleForRatio=ratio=>({...triangle,shapeRatio:ratio});
  const methodOptions=['La trigonométrie','Le théorème de Pythagore','La réciproque du théorème de Pythagore','Aucune de ces méthodes'];
  const methodQuestion=(prompt,answer,visual=svg,extra={})=>trigQcmInstance(mod,q,prompt+visual,methodOptions,[String(methodOptions.indexOf(answer)+1)],triangle,{kind,...extra});
  if(kind==='condition') return trigQcmInstance(mod,q,'Dans quelle situation peut-on utiliser directement sinus, cosinus ou tangente au collège ?',['Dans un triangle rectangle','Dans n’importe quel triangle','Seulement dans un triangle isocèle','Seulement si toutes les longueurs sont entières'],['1'],triangle,{kind});
  if(kind==='locate_side'){
    const role=['hypotenuse','adjacent','opposite'][RD(0,2)];
    const data={
      hypotenuse:{prompt:'Le triangle est rectangle en '+triangle.right+'. Quel côté est l’hypoténuse ?',correct:triangle.hypotenuse,wrong:[triangle.adjacent,triangle.opposite,'On ne peut pas savoir']},
      adjacent:{prompt:'Par rapport à l’angle $$\\widehat{'+triangle.angle+'}$$, quel côté est adjacent ?',correct:triangle.adjacent,wrong:[triangle.opposite,triangle.hypotenuse,'Les trois côtés']},
      opposite:{prompt:'Par rapport à l’angle $$\\widehat{'+triangle.angle+'}$$, quel côté est opposé ?',correct:triangle.opposite,wrong:[triangle.adjacent,triangle.hypotenuse,'Aucun côté']}
    }[role];
    return trigQcmInstance(mod,q,data.prompt+svg,['$$'+data.correct+'$$',...data.wrong.map(value=>String(value).length<=2?'$$'+value+'$$':value)],['1'],triangle,{kind,role});
  }
  if(kind==='ratio_definition'){
    const ratio=['cos','sin','tan'][RD(0,2)];
    return trigQcmInstance(mod,q,'Choisis l’écriture correcte pour le '+({cos:'cosinus',sin:'sinus',tan:'tangente'})[ratio]+' de l’angle $$\\widehat{'+triangle.angle+'}$$.'+svg,trigFormulaDistractors(triangle,ratio),['1'],triangle,{kind,ratio});
  }
  if(kind==='choose_ratio'){
    const choices=[{ratio:'cosinus',known:'le côté adjacent et l’hypoténuse'},{ratio:'sinus',known:'le côté opposé et l’hypoténuse'},{ratio:'tangente',known:'le côté opposé et le côté adjacent'}],choice=choices[RD(0,2)];
    return trigQcmInstance(mod,q,'Dans ce triangle rectangle, on utilise '+choice.known+' par rapport à l’angle $$\\widehat{'+triangle.angle+'}$$. Quel rapport relie exactement ces deux côtés ?'+svg,['Le '+choice.ratio,'Le '+(choice.ratio==='cosinus'?'sinus':'cosinus'),'Le '+(choice.ratio==='tangente'?'sinus':'tangente'),'Le théorème de Pythagore'],['1'],triangle,{kind,ratio:choice.ratio});
  }
  if(kind==='choose_method'){
    const triple=trigPythagoreanData(),methodCase=['find-side-two-lengths','find-side-angle-length','find-angle'][RD(0,2)];
    if(methodCase==='find-side-two-lengths'){
      const visual=trigTriangleSvg(triangleForRatio(triple.opposite/triple.adjacent),{adjacent:triple.adjacent+' cm',opposite:triple.opposite+' cm',hypotenuse:'?'});
      return methodQuestion('Le triangle est rectangle. Deux longueurs sont connues et on cherche la troisième. Quelle méthode est la plus directe ?', 'Le théorème de Pythagore',visual,{case:'find-side-two-lengths'});
    }
    if(methodCase==='find-side-angle-length'){
      const degrees=[30,35,40,45,50][RD(0,4)],visual=trigTriangleSvg(triangleForRatio(Math.tan(degrees*Math.PI/180)),{adjacent:triple.adjacent+' cm',opposite:'?',hypotenuse:''});
      return methodQuestion('Le triangle est rectangle. On connaît $$\\widehat{'+triangle.angle+'}='+degrees+'°$$ et $$'+triangle.adjacent+'='+triple.adjacent+'\\text{ cm}$$. On cherche $$'+triangle.opposite+'$$. Quelle méthode est adaptée ?', 'La trigonométrie',visual,{case:'find-side-angle-length'});
    }
    const visual=trigTriangleSvg(triangleForRatio(triple.opposite/triple.adjacent),{adjacent:triple.adjacent+' cm',opposite:triple.opposite+' cm',hypotenuse:''});
    return methodQuestion('Le triangle est rectangle. Deux côtés sont connus et on cherche l’angle $$\\widehat{'+triangle.angle+'}$$. Quelle méthode est adaptée ?', 'La trigonométrie',visual,{case:'find-angle'});
  }
  if(kind==='formula_analysis'){
    const analysisCase=['one-correct','one-false','multiple-correct','complementary'][RD(0,3)];
    if(analysisCase==='one-correct'){
      const ratio=['cos','sin','tan'][RD(0,2)];
      return trigQcmInstance(mod,q,'Une seule formule est correcte pour le '+({cos:'cosinus',sin:'sinus',tan:'tangente'})[ratio]+' de l’angle $$\\widehat{'+triangle.angle+'}$$.'+svg,trigFormulaDistractors(triangle,ratio),['1'],triangle,{kind,case:analysisCase,ratio});
    }
    if(analysisCase==='one-false'){
      const triple=trigPythagoreanData(),lengthSvg=trigTriangleSvg(triangleForRatio(triple.opposite/triple.adjacent),{adjacent:triple.adjacent,opposite:triple.opposite,hypotenuse:triple.hypotenuse});
      const falseOptions=[
        '$$\\cos(\\widehat{'+triangle.angle+'})=\\dfrac{'+triple.opposite+'}{'+triple.hypotenuse+'}$$',
        '$$\\sin(\\widehat{'+triangle.angle+'})=\\dfrac{'+triple.adjacent+'}{'+triple.hypotenuse+'}$$',
        '$$\\tan(\\widehat{'+triangle.angle+'})=\\dfrac{'+triple.adjacent+'}{'+triple.opposite+'}$$',
        '$$\\cos(\\widehat{'+triangle.other+'})=\\dfrac{'+triple.adjacent+'}{'+triple.hypotenuse+'}$$'
      ];
      const falseFormula=falseOptions[RD(0,falseOptions.length-1)];
      return trigQcmInstance(mod,q,'À partir des longueurs indiquées, quelle égalité est fausse ?'+lengthSvg,[formulas.cos.replace(triangle.adjacent,triple.adjacent).replace(triangle.hypotenuse,triple.hypotenuse),formulas.sin.replace(triangle.opposite,triple.opposite).replace(triangle.hypotenuse,triple.hypotenuse),formulas.tan.replace(triangle.opposite,triple.opposite).replace(triangle.adjacent,triple.adjacent),falseFormula],['4'],triangle,{kind,case:analysisCase,triple});
    }
    if(analysisCase==='multiple-correct') return trigQcmInstance(mod,q,'Quelles égalités sont correctes ?'+svg,['$$\\cos(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.adjacent+'}{'+triangle.hypotenuse+'}$$','$$\\sin(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.opposite+'}{'+triangle.hypotenuse+'}$$','$$\\tan(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.adjacent+'}{'+triangle.opposite+'}$$','$$\\cos(\\widehat{'+triangle.angle+'})=\\dfrac{'+triangle.hypotenuse+'}{'+triangle.adjacent+'}$$'],['1','2'],triangle,{kind,case:analysisCase});
    return trigQcmInstance(mod,q,'Dans le triangle '+triangle.angle+triangle.right+triangle.other+' rectangle en '+triangle.right+', les angles $$\\widehat{'+triangle.angle+'}$$ et $$\\widehat{'+triangle.other+'}$$ sont complémentaires. Quelle égalité est vraie ?'+svg,['$$\\sin(\\widehat{'+triangle.angle+'})=\\cos(\\widehat{'+triangle.other+'})$$','$$\\sin(\\widehat{'+triangle.angle+'})=\\sin(\\widehat{'+triangle.other+'})$$','$$\\tan(\\widehat{'+triangle.angle+'})=1$$','$$\\cos(\\widehat{'+triangle.angle+'})=0$$'],['1'],triangle,{kind,case:analysisCase});
  }
  if(kind==='coherence') return trigQcmInstance(mod,q,'Dans un triangle rectangle, l’hypoténuse mesure 10 cm. Un calcul donne 12 cm pour un autre côté. Que conclure ?',['Le résultat est impossible : l’hypoténuse doit être le plus long côté','Le résultat est forcément exact','Il suffit de changer l’unité','Le triangle est équilatéral'],['1'],triangle,{kind});

  if(kind==='ratio_from_lengths'){
    const triple=trigPythagoreanData(),ratio=['cos','sin','tan'][RD(0,2)],pairs={cos:[triple.adjacent,triple.hypotenuse],sin:[triple.opposite,triple.hypotenuse],tan:[triple.opposite,triple.adjacent]},[numerator,denominator]=pairs[ratio];
    const otherPairs=Object.entries(pairs).filter(([name])=>name!==ratio).map(([,pair])=>trigFractionLatex(pair[0],pair[1]));
    const visual=trigTriangleSvg(triangleForRatio(triple.opposite/triple.adjacent),{adjacent:triple.adjacent,opposite:triple.opposite,hypotenuse:triple.hypotenuse});
    return trigQcmInstance(mod,q,'Sans calculatrice, détermine la valeur exacte de $$\\'+ratio+'(\\widehat{'+triangle.angle+'})$$.'+visual,[trigFractionLatex(numerator,denominator),trigFractionLatex(denominator,numerator),...otherPairs],['1'],triangle,{kind,ratio,triple});
  }
  if(kind==='useful_formula'){
    const cases=[
      {ratio:'cos',known:'hypotenuse',target:'adjacent'},
      {ratio:'cos',known:'adjacent',target:'hypotenuse'},
      {ratio:'sin',known:'hypotenuse',target:'opposite'},
      {ratio:'sin',known:'opposite',target:'hypotenuse'},
      {ratio:'tan',known:'adjacent',target:'opposite'},
      {ratio:'tan',known:'opposite',target:'adjacent'}
    ],chosen=cases[RD(0,cases.length-1)],degrees=[30,35,40,45,50][RD(0,4)],knownValue=RD(6,14);
    const labels={adjacent:'',opposite:'',hypotenuse:''};labels[chosen.known]=knownValue+' cm';labels[chosen.target]='?';
    const visual=trigTriangleSvg(triangleForRatio(Math.tan(degrees*Math.PI/180)),labels),knownSide=triangle[chosen.known],targetSide=triangle[chosen.target];
    return trigQcmInstance(mod,q,'On connaît $$\\widehat{'+triangle.angle+'}='+degrees+'°$$ et $$'+knownSide+'='+knownValue+'\\text{ cm}$$. On cherche $$'+targetSide+'$$. Quelle égalité permet de commencer ?'+visual,trigFormulaDistractors(triangle,chosen.ratio),['1'],triangle,{kind,...chosen,degrees,knownValue});
  }
  if(kind==='ratio_invariance'){
    const scale=RD(2,4),visual=trigSimilaritySvg(scale);
    return trigQcmInstance(mod,q,'Ces deux triangles rectangles ont le même angle α. Quelle égalité montre que leur cosinus est identique ?'+visual,[trigFractionLatex(4,5)+' = '+trigFractionLatex(4*scale,5*scale),trigFractionLatex(3,5)+' = '+trigFractionLatex(4*scale,5*scale),trigFractionLatex(4,3)+' = '+trigFractionLatex(4*scale,5*scale),trigFractionLatex(4,5)+' = '+trigFractionLatex(3*scale,5*scale)],['1'],triangle,{kind,scale});
  }
  if(kind==='method_diagnostic'){
    const diagnosticCase=['verify-right','neither','both'][RD(0,2)];
    if(diagnosticCase==='verify-right'){
      const triple=trigPythagoreanData(),visual=trigGeneralTriangleSvg(triangle,{left:triple.adjacent+' cm',right:triple.opposite+' cm',base:triple.hypotenuse+' cm'});
      return methodQuestion('Aucun angle droit n’est indiqué. On connaît les trois longueurs et on veut déterminer si le triangle est rectangle. Quelle méthode est adaptée ?', 'La réciproque du théorème de Pythagore',visual,{case:diagnosticCase});
    }
    if(diagnosticCase==='neither'){
      const visual=trigGeneralTriangleSvg(triangle,{left:'7 cm',right:'?',base:'10 cm'});
      return methodQuestion('Le triangle n’est pas annoncé rectangle. On connaît seulement deux longueurs et on cherche la troisième. Laquelle de ces méthodes peut-on appliquer directement ?', 'Aucune de ces méthodes',visual,{case:diagnosticCase});
    }
    const visual=trigTriangleSvg(triangleForRatio(3/4),{adjacent:'4 cm',opposite:'?',hypotenuse:'5 cm'}),options=['Seulement Pythagore','Seulement la trigonométrie','Les deux méthodes conviennent','Aucune des deux'];
    return trigQcmInstance(mod,q,'Le triangle est rectangle. On connaît aussi $$\\widehat{'+triangle.angle+'}\\approx36,9°$$. On cherche le troisième côté. Quelle affirmation est juste ?'+visual,options,['3'],triangle,{kind,case:diagnosticCase});
  }
  if(kind==='method_first_step'){
    const degrees=[30,35,40,45,50][RD(0,4)],base=RD(6,12),visual=trigTriangleSvg(triangleForRatio(Math.tan(degrees*Math.PI/180)),{adjacent:base+' cm',opposite:'?',hypotenuse:''});
    return trigQcmInstance(mod,q,'On veut calculer l’aire de ce triangle rectangle. Quelle est la première étape utile ? On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$.'+visual,['Calculer la hauteur : $$'+triangle.opposite+'='+base+'\\times\\tan('+degrees+'°)$$','Calculer directement $$'+base+'^2\\div2$$','Appliquer la réciproque de Pythagore','Additionner toutes les longueurs connues'],['1'],triangle,{kind,degrees,base});
  }

  const degrees=[25,30,35,40,45,50,55,60][RD(0,7)],radians=degrees*Math.PI/180;
  if(kind==='ratio_decimal'){
    const triple=trigPythagoreanData(),ratio=['cos','sin','tan'][RD(0,2)],pairs={cos:[triple.adjacent,triple.hypotenuse],sin:[triple.opposite,triple.hypotenuse],tan:[triple.opposite,triple.adjacent]},[numerator,denominator]=pairs[ratio],result=CUT(numerator/denominator,2);
    const visual=trigTriangleSvg(triangleForRatio(triple.opposite/triple.adjacent),{adjacent:triple.adjacent+' cm',opposite:triple.opposite+' cm',hypotenuse:triple.hypotenuse+' cm'});
    return trigDirectInstance(mod,q,'Calcule $$\\'+ratio+'(\\widehat{'+triangle.angle+'})$$. Arrondis au centième.'+visual,'$$\\'+ratio+'(\\widehat{'+triangle.angle+'})=[[dec]]$$',result,triangle,{kind,ratio,triple});
  }
  if(kind==='missing_adjacent_cos'){
    const hyp=RD(8,18),result=CUT(hyp*Math.cos(radians),1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:'?',hypotenuse:hyp+' cm',opposite:''});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$. Calcule le côté adjacent. Arrondis au dixième.'+visual,'$$'+triangle.adjacent+'=[[dec]]\\text{ cm}$$',result,triangle,{kind});
  }
  if(kind==='missing_hypotenuse_cos'){
    const adj=RD(4,13),result=CUT(adj/Math.cos(radians),1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:adj+' cm',hypotenuse:'?',opposite:''});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$. Calcule l’hypoténuse. Arrondis au dixième.'+visual,'$$'+triangle.hypotenuse+'=[[dec]]\\text{ cm}$$',result,triangle,{kind});
  }
  if(kind==='missing_opposite_sin'){
    const hyp=RD(8,18),result=CUT(hyp*Math.sin(radians),1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:'',hypotenuse:hyp+' cm',opposite:'?'});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$. Calcule le côté opposé avec le sinus. Arrondis au dixième.'+visual,'$$'+triangle.opposite+'=[[dec]]\\text{ cm}$$',result,triangle,{kind});
  }
  if(kind==='missing_opposite_tan'){
    const adj=RD(4,13),result=CUT(adj*Math.tan(radians),1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:adj+' cm',hypotenuse:'',opposite:'?'});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$. Calcule le côté opposé avec la tangente. Arrondis au dixième.'+visual,'$$'+triangle.opposite+'=[[dec]]\\text{ cm}$$',result,triangle,{kind});
  }
  if(kind==='missing_hypotenuse_sin'){
    const opp=RD(4,13),result=CUT(opp/Math.sin(radians),1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:'',hypotenuse:'?',opposite:opp+' cm'});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$. Calcule l’hypoténuse avec le sinus. Arrondis au dixième.'+visual,'$$'+triangle.hypotenuse+'=[[dec]]\\text{ cm}$$',result,triangle,{kind});
  }
  if(kind==='missing_adjacent_tan'){
    const opp=RD(4,13),result=CUT(opp/Math.tan(radians),1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:'?',hypotenuse:'',opposite:opp+' cm'});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$. Calcule le côté adjacent avec la tangente. Arrondis au dixième.'+visual,'$$'+triangle.adjacent+'=[[dec]]\\text{ cm}$$',result,triangle,{kind});
  }
  const hyp=RD(8,18),leg=RD(Math.ceil(hyp*.45),Math.floor(hyp*.88));
  if(kind==='missing_angle_cos'){
    const result=Math.round(Math.acos(leg/hyp)*180/Math.PI),ratio=Math.sqrt(hyp*hyp-leg*leg)/leg,visual=trigTriangleSvg(triangleForRatio(ratio),{adjacent:leg+' cm',hypotenuse:hyp+' cm',opposite:''});
    return trigDirectInstance(mod,q,'Calcule l’angle $$\\widehat{'+triangle.angle+'}$$. Arrondis au degré.'+visual,'$$\\widehat{'+triangle.angle+'}=[[dec]]°$$',result,triangle,{kind});
  }
  if(kind==='missing_angle_sin'){
    const result=Math.round(Math.asin(leg/hyp)*180/Math.PI),ratio=leg/Math.sqrt(hyp*hyp-leg*leg),visual=trigTriangleSvg(triangleForRatio(ratio),{adjacent:'',hypotenuse:hyp+' cm',opposite:leg+' cm'});
    return trigDirectInstance(mod,q,'Calcule l’angle $$\\widehat{'+triangle.angle+'}$$ avec le sinus. Arrondis au degré.'+visual,'$$\\widehat{'+triangle.angle+'}=[[dec]]°$$',result,triangle,{kind});
  }
  if(kind==='missing_angle_tan'){
    const adjacentLeg=RD(5,13),oppositeLeg=RD(Math.ceil(adjacentLeg*.45),Math.floor(adjacentLeg*1.7));
    const result=Math.round(Math.atan(oppositeLeg/adjacentLeg)*180/Math.PI),visual=trigTriangleSvg(triangleForRatio(oppositeLeg/adjacentLeg),{adjacent:adjacentLeg+' cm',hypotenuse:'',opposite:oppositeLeg+' cm'});
    return trigDirectInstance(mod,q,'Calcule l’angle $$\\widehat{'+triangle.angle+'}$$ avec la tangente. Arrondis au degré.'+visual,'$$\\widehat{'+triangle.angle+'}=[[dec]]°$$',result,triangle,{kind});
  }
  if(kind==='area_application'){
    const base=RD(5,12),height=base*Math.tan(radians),result=CUT(base*height/2,1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:base+' cm',hypotenuse:'',opposite:'?'});
    return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$ et $$'+triangle.adjacent+'='+base+'\\text{ cm}$$. Calcule l’aire du triangle. Arrondis au dixième.'+visual,'$$A=[[dec]]\\text{ cm}^2$$',result,triangle,{kind,degrees,base});
  }
  const adjacent=RD(5,12),opposite=adjacent*Math.tan(radians),hypotenuse=adjacent/Math.cos(radians),result=CUT(adjacent+opposite+hypotenuse,1),visual=trigTriangleSvg(triangleForRatio(Math.tan(radians)),{adjacent:adjacent+' cm',hypotenuse:'?',opposite:'?'});
  return trigDirectInstance(mod,q,'On donne $$\\widehat{'+triangle.angle+'}='+degrees+'°$$ et $$'+triangle.adjacent+'='+adjacent+'\\text{ cm}$$. Calcule le périmètre du triangle. Arrondis au dixième.'+visual,'$$P=[[dec]]\\text{ cm}$$',result,triangle,{kind,degrees,adjacent});
}

function relativeDisplayNumber(value){
  const text=String(value);
  return text.startsWith('-')?'−'+text.slice(1):text;
}
function relativeExpression(a,b){
  return relativeDisplayNumber(a)+' + '+(b<0?'('+relativeDisplayNumber(b)+')':relativeDisplayNumber(b));
}
function relativeTokenList(value,zone,prefix){
  const sign=value<0?-1:1;
  return Array.from({length:Math.abs(value)},(_,index)=>({id:prefix+String(index+1),sign,zone,origin:zone}));
}
function relativePairIndexes(tokens,zone){
  const positive=[],negative=[];
  tokens.forEach((token,index)=>{
    if(token.zone!==zone)return;
    (token.sign>0?positive:negative).push(index);
  });
  const paired=new Set();
  for(let index=0;index<Math.min(positive.length,negative.length);index++){
    paired.add(positive[index]);paired.add(negative[index]);
  }
  return paired;
}
function relativeStaticToken(token,paired=false){
  return '<span class="relative-token '+(token.sign>0?'relative-token-positive':'relative-token-negative')+(paired?' is-null-pair':'')+'" aria-label="Jeton '+(token.sign>0?'+1':'−1')+'">'+(token.sign>0?'+1':'−1')+'</span>';
}
function relativeStaticZoneMarkup(label,zone,tokens){
  const paired=relativePairIndexes(tokens,zone);
  const visible=tokens.filter(token=>token.zone===zone);
  const tokenHtml=visible.map(token=>relativeStaticToken(token,paired.has(tokens.indexOf(token)))).join('');
  return '<section class="relative-token-zone relative-token-zone-'+zone+'"><h3>'+label+'</h3><div class="relative-token-list">'+(tokenHtml||'<span class="relative-token-empty">—</span>')+'</div></section>';
}
function relativeStaticBoardMarkup(data){
  return '<div class="relative-token-static-board">'+relativeStaticZoneMarkup('Premier nombre','a',data.initialTokens)+relativeStaticZoneMarkup('Deuxième nombre','b',data.initialTokens)+'</div>';
}
function makeRelativeAdditionInstance(mod,q){
  const options=q.options||{};
  const a=Number(options.relative_a),b=Number(options.relative_b),result=a+b;
  const initialTokens=[...relativeTokenList(a,'a','a'),...relativeTokenList(b,'b','b')];
  const questionKind=String(options.relative_addition_kind||'manipulate');
  const relativeTokens={kind:'addition',questionKind,a,b,result,initialTokens,interactive:questionKind==='manipulate',instanceKey:'addition-'+q.n+'-'+a+'-'+b};
  if(questionKind==='manipulate'){
    return {module:mod,q,scope:{},answers:[String(result)],rawStatement:'',rawFooter:'',hasSvg:true,relativeTokens};
  }
  const choices=Array.isArray(options.choices)?options.choices:[];
  const correctChoice=questionKind==='qcm-result'
    ?relativeDisplayNumber(result)
    :(questionKind==='qcm-zero-pair'?'Elle vaut 0.':'On rassemble les jetons puis on repère les paires nulles.');
  const correctIndex=String(Math.max(0,choices.indexOf(correctChoice)+1));
  const prompt=questionKind==='qcm-result'
    ?'Calcule '+relativeExpression(a,b)+' en observant les jetons.'
    :questionKind==='qcm-zero-pair'
      ?'Que remarques-tu dans '+relativeExpression(a,b)+' ?'
      :'Quelle méthode décrit correctement '+relativeExpression(a,b)+' ?';
  return {module:mod,q,scope:{},answers:[correctIndex],rawStatement:prompt+relativeStaticBoardMarkup(relativeTokens)+'&&'+choices.join('&&')+'&&',rawFooter:'',hasSvg:true,relativeTokens};
}
const PYTHAGORAS_VERTEX_SETS=Object.freeze(['ABC','DEF','GHI','JKL','MNP','RST','UVW','XYZ']);
function makePythagorasTactileInstance(mod,q){
  const options=q.options||{};
  const vertexSetIndex=RD(0,PYTHAGORAS_VERTEX_SETS.length-1,lastPythagorasVertexSetIndex<0?undefined:[lastPythagorasVertexSetIndex]);
  lastPythagorasVertexSetIndex=vertexSetIndex;
  const vertices=PYTHAGORAS_VERTEX_SETS[vertexSetIndex].split('');
  const rightAnglePosition=['A','B','C'].includes(String(options.right_angle))?String(options.right_angle):'A';
  const rightAngle=vertices[['A','B','C'].indexOf(rightAnglePosition)];
  let prompt=String(options.prompt||'Complète la relation de Pythagore.')
    .replaceAll('{triangle}',vertices.join(''))
    .replaceAll('{rightAngle}',rightAngle);
  const namedAnglePattern=new RegExp('rectangle en '+rightAnglePosition+'\\b');
  prompt=prompt.replace(namedAnglePattern,'rectangle en '+rightAngle);
  if(/^Le triangle est rectangle/.test(prompt)) prompt=prompt.replace(/^Le triangle /,'Le triangle '+vertices.join('')+' ');
  const data={
    task:String(options.pythagoras_tactile_kind||'complete'),
    vertices,
    rightAngle,
    rightAnglePosition,
    lengths:{legA:Number(options.leg_a),legB:Number(options.leg_b),hypotenuse:Number(options.hypotenuse)},
    prompt
  };
  const model=globalThis.pythagorasBuilderModel(data);
  return {module:mod,q,scope:{},answers:model.expected,answerChoices:model.expected.map(value=>[value]),rawStatement:'',rawFooter:'',hasSvg:true,pythagorasTactile:{...data,...model}};
}
function makeGenericInstance(mod,q,generatedScope=null){
  let scope=generatedScope;
  if(scope===null&&q.options&&q.options.formula_code) scope=runCode(q.options.formula_code);
  if(scope===null) scope={};
  let answerChoices=parseAnswerChoices(q,scope);
  let answers=answerChoices.map(choices=>choices[0]||'');
  let rawStatement=subVars(q.statement||'', scope);
  const rawFooter=subVars(q.footer||'', scope);
  let qcmPermutation=null;
  if(q.options&&q.options.shuffle_answers){
    const shuffled=shuffledQcm(rawStatement,answers);
    rawStatement=shuffled.statement;
    answers=shuffled.answers;
    answerChoices=answers.map(answer=>[answer]);
    qcmPermutation=shuffled.permutation||null;
  }
  const hasSvg=/<svg/i.test(rawStatement+rawFooter);
  return {module:mod, q, scope, answers, answerChoices, rawStatement, rawFooter, hasSvg, qcmPermutation};
}
function makeInstance(mod,q){
  const runtime=globalThis.MATHSGO_MODULE_RUNTIME&&globalThis.MATHSGO_MODULE_RUNTIME.get(mod&&mod.id);
  if(runtime&&runtime.generator&&typeof runtime.generator.createInstance==='function'
    &&(!runtime.generator.supports||runtime.generator.supports({module:mod,question:q}))){
    const instance=runtime.generator.createInstance({
      module:mod,question:q,randomInt:RD,pick,cut:CUT,format:fmt,shuffle:shuffledCopy
    });
    if(!instance||typeof instance!=='object') throw new Error(`Le générateur ${mod.id} doit retourner une instance de question.`);
    return instance;
  }
  if(runtime&&runtime.generator&&typeof runtime.generator.createScope==='function'){
    const generatedScope=runtime.generator.createScope({module:mod,question:q,randomInt:RD});
    if(!generatedScope||typeof generatedScope!=='object') throw new Error(`Le générateur ${mod.id} doit retourner un objet de paramètres.`);
    return makeGenericInstance(mod,q,generatedScope);
  }
  if(mod&&mod.id==='dnb_01') return makeModule01Instance(mod,q);
  if(mod&&['dnb_03','dnb_03b'].includes(mod.id)) return makeFractionOpsInstance(mod,q);
  if(mod&&mod.id==='dnb_04') return makeFractionPercentInstance(mod,q);
  if(mod&&mod.id==='dnb_05') return makeMultipleFormsInstance(mod,q);
  if(mod&&mod.id==='dnb_09') return makeRelationInstance(mod,q);
  if(mod&&mod.id==='dnb_18') return makeAngleSumInstance(mod,q);
  if(mod&&mod.id==='dnb_19') return makeConversionInstance(mod,q);
  if(mod&&['dnb_26','dnb_26b'].includes(mod.id)) return makeTrigInstance(mod,q);
  if(mod&&mod.id==='dnb_10') return makeReductionInstance(mod,q);
  if(mod&&mod.id==='dnb_11') return makeSubstitutionInstance(mod,q);
  if(mod&&mod.id==='dnb_13') return makeEquationInstance(mod,q);
  if(mod&&mod.id==='dnb_20') return makeSolidsInstance(mod,q);
  if(mod&&mod.id==='dnb_22') return makeAreaInstance(mod,q);
  if(mod&&mod.id==='dnb_30') return makeAverageInstance(mod,q);
  if(mod&&mod.id==='dnb_35') return makeEvolutionInstance(mod,q);
  if(mod&&mod.id==='dnb_38') return makeRelativeAdditionInstance(mod,q);
  if(mod&&mod.id==='dnb_24b') return makePythagorasTactileInstance(mod,q);
  return makeGenericInstance(mod,q);
}
function compactQcmClass(options){
  if(!Array.isArray(options) || options.length!==4) return '';
  const allShort=options.every(option=>{
    const visible=String(option)
      .replace(/<[^>]*>/g,' ')
      .replace(/\$\$/g,'')
      .replace(/\\[a-zA-Z]+/g,'x')
      .replace(/[{}]/g,'')
      .replace(/\s+/g,' ')
      .trim();
    return visible.length<=12;
  });
  return allShort?' options-compact':'';
}
function renderGenericQuestion(inst, correction=false, mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  let statement=inst.rawStatement;
  let footer=inst.rawFooter;
  if(inst.module&&inst.module.id==='dnb_14') statement=statement.replace(/([A-Z])\s+:/g,'$1&nbsp;:').replace(/\sheight="auto"/g,'');
  if(isWithoutVisuals(mode)){
    const keepPlaceholder=mode==='without-reveal';
    statement=stripVisuals(statement,keepPlaceholder);
    footer=stripVisuals(footer,keepPlaceholder);
  }
  const qcm=splitQCM(statement);
  const questionClass=statement.includes('legacy-statement-table-wrap')?'question legacy-statement-question':'question';
  let html='';
  if(qcm){
    html += '<div class="'+questionClass+'">'+renderMathSegments(qcm.prompt)+'</div>';
    const corrects=new Set(inst.answers.map(x=>String(x)));
    html += '<div class="options options-'+qcm.opts.length+compactQcmClass(qcm.opts)+'">';
    qcm.opts.forEach((o,i)=>{ const isC=correction && corrects.has(String(i+1)); html+='<div class="opt '+(isC?'correct':'')+'"><strong>'+String.fromCharCode(65+i)+'.</strong> '+renderMathSegments(o)+'</div>'; });
    html += '</div>';
  } else {
    html += '<div class="'+questionClass+'">'+renderMathSegments(statement)+'</div>';
  }
  if(footer) html += '<div class="footer">'+renderPlaceholders(footer, inst.answers, correction?'correction':'question')+'</div>';
  return html;
}

function pythagorasAidVisual(inst,correction=false){
  const number=Number(inst.q.n),scope=inst.scope||{};
  const bar=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('geometry.pythagoras-bar');
  const reasoning=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('geometry.pythagoras-reasoning');
  const mill=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('geometry.pythagoras-mill');
  let visual='';
  if(number===3&&bar){
    visual=bar.render({phase:'relation',vertices:['B','A','C'],sideNames:{legA:'AB',legB:'BC',hypotenuse:'AC'}},correction);
  }else if(number===4&&mill){
    visual=mill.render({mode:'relation',vertices:['T','R','S'],sideNames:{legA:'RT',legB:'ST',hypotenuse:'RS'}},correction);
  }else if([5,6,7].includes(number)){
    const a=Number(scope.a),b=Number(scope.b),hypotenuse=Number.isFinite(Number(scope.c))?Number(scope.c):Math.sqrt(a*a+b*b);
    const target=number===7?'legB':'hypotenuse';
    const values={legA:a,legB:b,hypotenuse};
    const sideNames={legA:'a',legB:'b',hypotenuse:number===5||number===6?'h':'c'};
    if(correction&&reasoning){
      const step=number===5?'isolate':'root';
      visual=reasoning.render({step,target,values,sideNames,unit:'cm'},true);
    }else if(bar){
      visual=bar.render({phase:number===5?'squares':'lengths',target,values,sideNames,proportional:true},false);
    }
  }
  return visual?'<div class="pythagoras-aid-visual">'+visual+'</div>':'';
}

function renderPythagorasModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const number=Number(inst.q.n),usesAid=[3,4,5,6,7].includes(number);
  let statement=inst.rawStatement,footer=inst.rawFooter;
  if(isWithoutVisuals(mode)){
    const keepPlaceholder=mode==='without-reveal';
    statement=stripVisuals(statement,keepPlaceholder);
    footer=stripVisuals(footer,keepPlaceholder);
  }
  const visual=usesAid?(mode==='with'?pythagorasAidVisual(inst,correction):(mode==='without-reveal'?visualPlaceholder(mode):'')):'';
  const qcm=splitQCM(statement);
  const promptClass='question pythagoras-prompt '+(/<svg\b/i.test(qcm?qcm.prompt:statement)?'has-statement-figure':(visual?'has-aid':'is-text-only'));
  let html='';
  if(qcm){
    html+='<div class="'+promptClass+'">'+renderMathSegments(qcm.prompt)+'</div>'+visual;
    const corrects=new Set(inst.answers.map(value=>String(value)));
    html+='<div class="options pythagoras-options options-'+qcm.opts.length+compactQcmClass(qcm.opts)+'">';
    qcm.opts.forEach((option,index)=>{const isCorrect=correction&&corrects.has(String(index+1));html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';});
    html+='</div>';
  }else{
    html+='<div class="'+promptClass+'">'+renderMathSegments(statement)+'</div>'+visual;
  }
  if(footer) html+='<div class="footer pythagoras-answer">'+renderPlaceholders(footer,inst.answers,correction?'correction':'question')+'</div>';
  return html;
}

function thalesLengthLabels(inst){
  const scope=inst.scope||{},number=Number(inst.q.n),value=name=>scope[name]===undefined?'':fmt(scope[name])+' cm';
  if(number===3) return {AM:value('AD'),AB:value('AB'),AC:value('AC')};
  if(number===4) return {AM:value('AD'),AN:value('AE'),AC:value('AC')};
  if(number===5) return {AM:value('AD'),AB:value('AB'),BC:value('BC')};
  if(number===6) return {AM:value('AD'),AB:value('AB'),AN:value('AE'),AC:value('AC')};
  if(number===8) return {AM:value('AD'),AB:value('AB'),AC:value('AC')};
  if(number===10) return {AM:value('AD'),AB:value('AB'),MN:value('DE')};
  return {};
}

function thalesQuestionFigure(inst,correction=false,{aid=false}={}){
  const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('geometry.thales-configuration');
  if(!component) return '';
  return '<div class="thales-question-figure">'+component.render({
    configuration:'nested',
    style:correction||aid?'course':'exercise',
    parallel:Number(inst.q.n)!==7,
    showLineNames:false,
    labels:{A:'A',M:'D',N:'E',B:'B',C:'C'},
    lengths:thalesLengthLabels(inst)
  })+'</div>';
}

function thalesFact(label,value){
  return '<span class="thales-fact"><b>'+label+'</b><strong>'+renderMathSegments('$$'+value+'$$')+'</strong></span>';
}

function thalesStructuredPrompt(inst,prompt,figure=''){
  const scope=inst.scope||{},number=Number(inst.q.n),measure=name=>fmt(scope[name])+'\\text{ cm}';
  if(number===6){
    return renderMathSegments('<div class="thales-task-card"><span class="thales-task-kicker">Tester le parallélisme</span>'
      +'<div class="thales-task-condition">$$D\\in[AB]$$ et $$E\\in[AC]$$</div>'+figure
      +'<div class="thales-facts">'+thalesFact('AD',measure('AD'))+thalesFact('AB',measure('AB'))+thalesFact('AE',measure('AE'))+thalesFact('AC',measure('AC'))+'</div>'
      +'<div class="thales-task-question">Les rapports $$\\dfrac{AD}{AB}$$ et $$\\dfrac{AE}{AC}$$ sont-ils égaux&nbsp;?</div></div>');
  }
  if(number===8){
    return renderMathSegments('<div class="thales-task-card"><span class="thales-task-kicker">Choisir l’égalité adaptée</span>'
      +'<div class="thales-task-condition">$$D\\in[AB]$$, $$E\\in[AC]$$ et $$(DE)\\parallel(BC)$$</div>'+figure
      +'<div class="thales-task-target">On cherche <strong>$$x=AE$$</strong></div>'
      +'<div class="thales-facts">'+thalesFact('AD',measure('AD'))+thalesFact('AB',measure('AB'))+thalesFact('AC',measure('AC'))+'</div>'
      +'<div class="thales-task-question">Quelle égalité permet de calculer $$x$$&nbsp;?</div></div>');
  }
  if(number===9){
    return renderMathSegments('<div class="thales-task-card thales-coherence-card"><span class="thales-task-kicker">Contrôler un résultat</span>'
      +'<div class="thales-task-condition">$$D\\in[AB]$$</div>'
      +'<div class="thales-result-comparison">'+thalesFact('AD',measure('x'))+'<span>alors que</span>'+thalesFact('AB',measure('AB'))+'</div>'
      +'<div class="thales-task-question">Que faut-il penser de ce résultat&nbsp;?</div></div>');
  }
  return renderMathSegments(prompt);
}

function renderThalesModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  let statement=inst.rawStatement,footer=inst.rawFooter;
  const figure=thalesQuestionFigure(inst,correction);
  if(figure){
    statement=statement.replace(/<div style="text-align:center"><svg[\s\S]*?<\/svg><\/div>/i,figure);
  }
  if(isWithoutVisuals(mode)){
    const keepPlaceholder=mode==='without-reveal';
    statement=stripVisuals(statement,keepPlaceholder);
    footer=stripVisuals(footer,keepPlaceholder);
  }
  const qcm=splitQCM(statement);
  let html='';
  if(qcm){
    const number=Number(inst.q.n),aidFigure=mode==='with'&&[6,8].includes(number)?thalesQuestionFigure(inst,correction,{aid:true}):'';
    html+='<div class="question thales-prompt">'+thalesStructuredPrompt(inst,qcm.prompt,aidFigure)+'</div>';
    const corrects=new Set(inst.answers.map(value=>String(value)));
    html+='<div class="options thales-options options-'+qcm.opts.length+compactQcmClass(qcm.opts)+'">';
    qcm.opts.forEach((option,index)=>{const isCorrect=correction&&corrects.has(String(index+1));html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';});
    html+='</div>';
  }else{
    html+='<div class="question thales-prompt">'+renderMathSegments(statement)+'</div>';
  }
  if(footer) html+='<div class="footer thales-answer">'+renderPlaceholders(footer,inst.answers,correction?'correction':'question')+'</div>';
  return html;
}

function durationValueDisc(value,kind='hour'){
  const className=kind==='second'?'duration-disc-second':(kind==='minute'?'duration-disc-minute':'duration-disc-hour');
  return '<span class="duration-disc '+className+'">'+value+'</span>';
}
function durationEquivalencePair(first,second,firstKind='hour',secondKind='minute'){
  return '<span class="duration-equivalence-pair">'+durationValueDisc(first,firstKind)+'<b>=</b>'+durationValueDisc(second,secondKind)+'</span>';
}
function durationDiscGroup(count,value,kind){
  return '<span class="duration-disc-group">'+Array.from({length:count},()=>durationValueDisc(value,kind)).join('')+'</span>';
}
function conversionDurationHtml(data,correction=false){
  const hours=Number(data.hours),minutes=Number(data.minutes),totalMinutes=hours*60+minutes,totalSeconds=totalMinutes*60;
  return '<div class="duration-conversion-tool">'
    +'<div class="duration-instance">'
      +'<div class="duration-instance-row">'+durationDiscGroup(hours,'1 h','hour')+'<span class="duration-plus">+</span>'+durationValueDisc(minutes+' min','minute')+'</div>'
      +'<span class="duration-down" aria-hidden="true">↓</span>'
      +'<div class="duration-instance-row">'+durationDiscGroup(hours,'60 min','minute')+'<span class="duration-plus">+</span>'+durationValueDisc(minutes+' min','minute')+'</div>'
    +'</div>'
    +'<div class="duration-second-step">'+durationEquivalencePair('1 min','60 s','minute','second')+'</div>'
    +(correction?'<div class="duration-correction-line"><strong>('+hours+' × 60) + '+minutes+' = '+totalMinutes+' min</strong><span>puis</span><strong>'+totalMinutes+' × 60</strong><span>=</span><b>'+totalSeconds+' s</b></div>':'')
    +'</div>';
}
function conversionUnitMarkup(unit){
  return escapeHtml(String(unit||'')).replace(/²/g,'<sup>2</sup>').replace(/³/g,'<sup>3</sup>');
}
function conversionValueMarkup(value){
  const text=fmt(value),characters=Array.from(text);
  let searchFrom=characters.indexOf(',');
  if(searchFrom<0) searchFrom=characters.length;
  let unitsIndex=-1;
  for(let index=searchFrom-1;index>=0;index--){
    if(/[0-9]/.test(characters[index])){unitsIndex=index;break;}
  }
  return characters.map((character,index)=>index===unitsIndex
    ? '<span class="conversion-source-units-digit">'+escapeHtml(character)+'</span>'
    : escapeHtml(character)).join('');
}
function conversionEquationHtml(inst,correction=false){
  const data=inst.conversion,number=Number(inst.q&&inst.q.n),state=correction?'correction':'question';
  if(number===9) return '<span class="conversion-equation-stack">'+renderPlaceholders(inst.rawFooter,inst.answers,state)+'</span>';
  const answer=renderPlaceholders('[[formula]]',inst.answers,state);
  if(data.family==='duration'){
    return '<span class="conversion-source-expression"><span class="conversion-source-value">'+data.hours+'</span> <span class="conversion-source-unit">h</span>&nbsp; <span class="conversion-source-value">'+data.minutes+'</span> <span class="conversion-source-unit">min</span></span><span class="conversion-equals">=</span>'+answer+'<span class="conversion-target-unit">s</span>';
  }
  const displayedTarget=number===5?'L':data.target;
  return '<span class="conversion-source-expression"><span class="conversion-source-value">'+conversionValueMarkup(data.value)+'</span> <span class="conversion-source-unit">'+conversionUnitMarkup(data.source)+'</span></span><span class="conversion-equals">=</span>'+answer+'<span class="conversion-target-unit">'+conversionUnitMarkup(displayedTarget)+'</span>';
}
function renderConversionModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.conversion;
  const theme=conversionTheme(data);
  let html='<div class="conversion-content" style="--conversion-color:'+theme[0]+';--conversion-pale:'+theme[1]+'">';
  if(Number(inst.q&&inst.q.n)===5) html+='<div class="conversion-context">Sachant que '+renderMathSegments('$$1\\,\\text{dm}^3=1\\,\\text{L}$$')+'</div>';
  html+='<div class="question conversion-prompt"><span class="conversion-verb">Convertis :</span>'+conversionEquationHtml(inst,correction)+'</div>';
  if(!isWithoutVisuals(mode)) html+=data.family==='duration'?conversionDurationHtml(data,correction):conversionTableHtml(data,correction);
  else html+=visualPlaceholder(mode);
  return html+'</div>';
}

function renderModule04(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.fractionPercent;
  if(!data) return renderGenericQuestion(inst,correction,mode);
  let html='<div class="question fraction-percent-prompt">'+renderMathSegments(inst.rawStatement)+'</div>';
  html+=isWithoutVisuals(mode)?visualPlaceholder(mode):fractionPercentBarSvg(data,correction);
  let footer=inst.rawFooter;
  if(data.kind==='fraction') footer='$$\\dfrac{'+data.numerator+'}{'+data.denominator+'}\\text{ de }'+fmt(data.total)+'=[[formula]]$$';
  if(data.kind==='percent'&&!data.contextual) footer='$$'+fmt(data.percent)+'\\%\\text{ de }'+fmt(data.total)+'=[[formula]]$$';
  if(footer) html+='<div class="footer fraction-percent-answer">'+renderPlaceholders(footer,inst.answers,correction?'correction':'question')+'</div>';
  return html;
}

function multipleFormsFractionMask(row,col,numerator,denominator,unitIndex){
  const parts=Math.max(0,Math.min(denominator,numerator-unitIndex*denominator));
  if(denominator===2) return col<parts*5;
  if(denominator===4){
    const quadrant=(row>=5?2:0)+(col>=5?1:0);
    return quadrant<parts;
  }
  if(denominator===5) return col<parts*2;
  if(denominator===10) return col<parts;
  return row*10+col<parts*(100/denominator);
}

function multipleFormsHundredUnit(x,y,size,selectedHundredths,unitIndex,options={}){
  const dark='#f2ca3f',light='#fff5bf',stroke='#4a3b00';
  const fine=options.fine!==false;
  const fraction=options.fraction||null;
  const fractionGuides=options.fractionGuides!==false;
  const cell=size/10;
  const remaining=Math.max(0,Math.min(100,selectedHundredths-unitIndex*100));
  let svg='';
  if(fraction&&!fine){
    const den=fraction.denominator;
    const layouts={2:[2,1],4:[2,2],5:[5,1],10:[10,1],20:[5,4],25:[5,5]};
    const [cols,rows]=layouts[den]||[10,10];
    const parts=Math.max(0,Math.min(den,fraction.numerator-unitIndex*den));
    const cw=size/cols,ch=size/rows;
    for(let row=0;row<rows;row++){
      for(let col=0;col<cols;col++){
        const selected=row*cols+col<parts;
        svg+=`<rect x="${x+col*cw}" y="${y+row*ch}" width="${cw}" height="${ch}" fill="${selected?dark:light}" stroke="${stroke}" stroke-width="1.15"/>`;
      }
    }
  }else{
    for(let row=0;row<10;row++){
      for(let col=0;col<10;col++){
        const selected=fraction
          ? multipleFormsFractionMask(row,col,fraction.numerator,fraction.denominator,unitIndex)
          : row*10+col<remaining;
        svg+=`<rect x="${x+col*cell}" y="${y+row*cell}" width="${cell}" height="${cell}" fill="${selected?dark:light}"/>`;
      }
    }
  }
  if(fine){
    const keepMiddleAxes=!(fraction&&[5,10].includes(fraction.denominator));
    for(let i=1;i<10;i++){
      const major=i===5&&keepMiddleAxes;
      svg+=`<line x1="${x+i*cell}" y1="${y}" x2="${x+i*cell}" y2="${y+size}" stroke="${stroke}" stroke-width="${major?1.9:.65}"/>`;
      svg+=`<line x1="${x}" y1="${y+i*cell}" x2="${x+size}" y2="${y+i*cell}" stroke="${stroke}" stroke-width="${major?1.9:.65}"/>`;
    }
  }
  if(fraction&&fine&&fractionGuides&&[2,4,5,10].includes(fraction.denominator)){
    const den=fraction.denominator;
    if(den===2) svg+=`<line x1="${x+size/2}" y1="${y}" x2="${x+size/2}" y2="${y+size}" stroke="${stroke}" stroke-width="3"/>`;
    if(den===4){
      svg+=`<line x1="${x+size/2}" y1="${y}" x2="${x+size/2}" y2="${y+size}" stroke="${stroke}" stroke-width="3"/>`;
      svg+=`<line x1="${x}" y1="${y+size/2}" x2="${x+size}" y2="${y+size/2}" stroke="${stroke}" stroke-width="3"/>`;
    }
    if(den===5||den===10){
      for(let i=1;i<den;i++) svg+=`<line x1="${x+i*size/den}" y1="${y}" x2="${x+i*size/den}" y2="${y+size}" stroke="${stroke}" stroke-width="${fine?2.4:1.8}"/>`;
    }
  }
  svg+=`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="3"/>`;
  return svg;
}

function multipleFormsGridGroup(startX,y,size,count,selectedHundredths,options={}){
  const gap=18;
  let svg='';
  for(let unit=0;unit<count;unit++){
    svg+=multipleFormsHundredUnit(startX+unit*(size+gap),y,size,selectedHundredths,unit,options);
    if(options.wholeLabels&&selectedHundredths-unit*100>=100){
      svg+=`<text x="${startX+unit*(size+gap)+size/2}" y="${y+size/2+12}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="850" fill="#b33838">1</text>`;
    }
  }
  return svg;
}

function multipleFormsGreenUnit(x,y,size,selectedTenths,showWholeLabel=false){
  const dark='#78c989',light='#e5f5e8',stroke='#276b42',cell=size/10;
  let svg='';
  for(let i=0;i<10;i++) svg+=`<rect x="${x+i*cell}" y="${y}" width="${cell}" height="${size}" fill="${i<selectedTenths?dark:light}"/>`;
  for(let i=1;i<10;i++){
    svg+=`<line x1="${x+i*cell}" y1="${y}" x2="${x+i*cell}" y2="${y+size}" stroke="${stroke}" stroke-width="1.05"/>`;
    svg+=`<line x1="${x}" y1="${y+i*cell}" x2="${x+size}" y2="${y+i*cell}" stroke="${stroke}" stroke-width=".48" opacity=".30"/>`;
  }
  svg+=`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="3"/>`;
  if(showWholeLabel) svg+=`<text x="${x+size/2}" y="${y+size/2+12}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="850" fill="#b33838">1</text>`;
  return svg;
}

function multipleFormsTenthsSvg(data,correction=false){
  const count=Math.max(1,Math.ceil(data.tenths/10));
  const size=count===1?270:(count===2?220:178),gap=18,margin=10,y=10;
  const totalW=count*size+(count-1)*gap,W=totalW+margin*2,H=size+32,start=margin;
  let svg='';
  for(let unit=0;unit<count;unit++){
    const x=start+unit*(size+gap),selected=Math.max(0,Math.min(10,data.tenths-unit*10));
    svg+=multipleFormsGreenUnit(x,y,size,selected,selected===10);
  }
  return `<div class="multiple-forms-help multiple-forms-tenths"><svg class="multiple-forms-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Représentation en dixièmes">${svg}</svg></div>`;
}

function multipleFormsGridSvg(data,correction=false){
  const kind=data.kind;
  const fractionKinds=['fraction_to_decimal','fraction_to_percent','equivalent_to100'];
  const expandToHundredths=kind==='equivalent_to100';
  const simplifyFromHundredths=(kind==='decimal_to_irreducible'&&data.denominator!==100)||kind==='simplify_decimal_fraction';
  const sideBySide=expandToHundredths||simplifyFromHundredths;
  const fraction=kind==='simplify_decimal_fraction'
    ? {numerator:data.numerator,denominator:data.denominator}
    : (fractionKinds.includes(kind)||kind==='decimal_to_irreducible'&&data.denominator!==100
      ? {numerator:data.numerator,denominator:data.denominator}:null);
  const selected=Math.round(data.hundredths);
  const count=Math.max(1,Math.ceil(selected/100));
  const margin=10,y=10;
  let W,H;
  let svg='';
  if(sideBySide){
    const size=count===1?240:(count===2?170:140),gap=12,groupW=count*size+(count-1)*gap;
    const signW=28,signGap=8,contentW=groupW*2+signW+signGap*2;
    W=contentW+margin*2;H=size+32;
    const left=margin,equalX=left+groupW+signGap+signW/2,right=equalX+signW/2+signGap;
    if(expandToHundredths&&fraction&&fraction.denominator===10&&count===1){
      svg+=multipleFormsGreenUnit(left,y,size,Math.round(data.value*10),false);
    }else{
      svg+=multipleFormsGridGroup(left,y,size,count,selected,{fine:!expandToHundredths,fraction,fractionGuides:true,wholeLabels:count>1});
    }
    svg+=`<text x="${equalX}" y="${y+size/2+8}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="850" fill="#17283f">=</text>`;
    svg+=multipleFormsGridGroup(right,y,size,count,selected,{fine:expandToHundredths,fraction,fractionGuides:false,wholeLabels:count>1});
  }else{
    const size=count===1?270:(count===2?215:178),gap=18,groupW=count*size+(count-1)*gap;
    W=groupW+margin*2;H=size+32;
    const start=margin;
    svg+=multipleFormsGridGroup(start,y,size,count,selected,{fine:true,fraction,wholeLabels:count>1});
  }
  return `<div class="multiple-forms-help multiple-forms-grid"><svg class="multiple-forms-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Représentation en centièmes">${svg}</svg></div>`;
}

function multipleFormsLineSvg(data){
  const W=920,H=350,x1=160,x2=870,step=(x2-x1)/20,lineColor='#17283f';
  const rows=[
    {key:'decimal',label:'décimal',y:55,color:'#6b3fa9'},
    {key:'tenths',label:'dixièmes',y:130,color:'#2761a4'},
    {key:'hundredths',label:'centièmes',y:205,color:'#b45b12'},
    {key:'percent',label:'pourcentages',y:280,color:'#087a55'}
  ];
  const tenths=Math.round(data.value*10),hundredths=Math.round(data.value*100);
  const markerX=x1+data.value*(x2-x1)/2;
  const fractionPill=(y,numerator,denominator,color)=>
    `<g><rect x="${markerX-27}" y="${y-48}" width="54" height="43" rx="9" fill="#ffffff" stroke="${color}" stroke-width="1.4" opacity=".98"/>`
    +`<text x="${markerX}" y="${y-31}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="16" font-weight="850" fill="${color}">${numerator}</text>`
    +`<line x1="${markerX-12}" y1="${y-25}" x2="${markerX+12}" y2="${y-25}" stroke="${color}" stroke-width="1.8"/>`
    +`<text x="${markerX}" y="${y-9}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="16" font-weight="850" fill="${color}">${denominator}</text></g>`;
  let svg='';
  rows.forEach(row=>{
    svg+=`<text x="142" y="${row.y+6}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="${row.key==='percent'?17:19}" font-weight="850" fill="${lineColor}">${row.label}</text>`;
    svg+=`<line x1="${x1}" y1="${row.y}" x2="${x2}" y2="${row.y}" stroke="${lineColor}" stroke-width="3"/>`;
    for(let i=0;i<=20;i++){
      const x=x1+i*step,major=i%10===0;
      svg+=`<line x1="${x}" y1="${row.y-(major?12:7)}" x2="${x}" y2="${row.y+(major?12:7)}" stroke="${lineColor}" stroke-width="${major?2.5:1.3}"/>`;
      if(major&&(row.key==='decimal'||row.key==='percent')){
        const label=row.key==='decimal'?String(i/10):(i*10)+' %';
        svg+=`<text x="${x}" y="${row.y+31}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="850" fill="${lineColor}">${label}</text>`;
      }
    }
    svg+=`<line x1="${markerX}" y1="${row.y-12}" x2="${markerX}" y2="${row.y+12}" stroke="${row.color}" stroke-width="4" stroke-linecap="round"/>`;
  });
  svg=`<line x1="${markerX}" y1="69" x2="${markerX}" y2="266" stroke="#8c73b8" stroke-width="2" stroke-dasharray="5 5"/>`+svg;
  svg+=`<rect x="${markerX-35}" y="18" width="70" height="29" rx="8" fill="#ffffff" stroke="#6b3fa9" stroke-width="1.4"/><text x="${markerX}" y="40" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="22" font-weight="850" fill="#6b3fa9">${escapeHtml(fmt(data.value))}</text>`;
  svg+=fractionPill(rows[1].y,tenths,10,rows[1].color);
  svg+=fractionPill(rows[2].y,hundredths,100,rows[2].color);
  svg+=`<rect x="${markerX-38}" y="294" width="76" height="31" rx="8" fill="#ffffff" stroke="#087a55" stroke-width="1.4"/><text x="${markerX}" y="317" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="850" fill="#087a55">${escapeHtml(fmt(data.value*100))} %</text>`;
  return `<div class="multiple-forms-help multiple-forms-line"><svg class="multiple-forms-svg multiple-forms-line-desktop" viewBox="0 0 ${W} ${H}" role="img" aria-label="Quatre droites graduées alignant l’écriture décimale, les dixièmes, les centièmes et le pourcentage">${svg}</svg>${multipleFormsLineMobileSvg(data)}</div>`;
}

function multipleFormsLineMobileSvg(data){
  const W=390,H=330,x1=88,x2=380,step=(x2-x1)/20,lineColor='#17283f';
  const rows=[
    {key:'decimal',label:'décimal',y:48,color:'#6b3fa9'},
    {key:'tenths',label:'dixièmes',y:118,color:'#2761a4'},
    {key:'hundredths',label:'centièmes',y:188,color:'#b45b12'},
    {key:'percent',label:'pourcentages',y:258,color:'#087a55'}
  ];
  const markerX=x1+data.value*(x2-x1)/2,tenths=Math.round(data.value*10),hundredths=Math.round(data.value*100);
  const fractionPill=(y,numerator,denominator,color)=>
    `<g><rect x="${markerX-21}" y="${y-42}" width="42" height="37" rx="7" fill="#ffffff" stroke="${color}" stroke-width="1.3"/>`
    +`<text x="${markerX}" y="${y-28}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="13" font-weight="850" fill="${color}">${numerator}</text>`
    +`<line x1="${markerX-10}" y1="${y-23}" x2="${markerX+10}" y2="${y-23}" stroke="${color}" stroke-width="1.6"/>`
    +`<text x="${markerX}" y="${y-9}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="13" font-weight="850" fill="${color}">${denominator}</text></g>`;
  let svg='';
  rows.forEach(row=>{
    svg+=`<text x="80" y="${row.y+4}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="${row.key==='percent'?10:11}" font-weight="850" fill="${lineColor}">${row.label}</text>`;
    svg+=`<line x1="${x1}" y1="${row.y}" x2="${x2}" y2="${row.y}" stroke="${lineColor}" stroke-width="2.2"/>`;
    for(let i=0;i<=20;i++){
      const x=x1+i*step,major=i%10===0;
      svg+=`<line x1="${x}" y1="${row.y-(major?9:5)}" x2="${x}" y2="${row.y+(major?9:5)}" stroke="${lineColor}" stroke-width="${major?2:1}"/>`;
      if(major&&(row.key==='decimal'||row.key==='percent')){
        const label=row.key==='decimal'?String(i/10):(i*10)+' %';
        svg+=`<text x="${x}" y="${row.y+24}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="850" fill="${lineColor}">${label}</text>`;
      }
    }
    svg+=`<line x1="${markerX}" y1="${row.y-10}" x2="${markerX}" y2="${row.y+10}" stroke="${row.color}" stroke-width="3.2" stroke-linecap="round"/>`;
  });
  svg=`<line x1="${markerX}" y1="60" x2="${markerX}" y2="246" stroke="#8c73b8" stroke-width="1.7" stroke-dasharray="4 4"/>`+svg;
  svg+=`<rect x="${markerX-29}" y="13" width="58" height="27" rx="7" fill="#ffffff" stroke="#6b3fa9" stroke-width="1.3"/><text x="${markerX}" y="33" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="18" font-weight="850" fill="#6b3fa9">${escapeHtml(fmt(data.value))}</text>`;
  svg+=fractionPill(rows[1].y,tenths,10,rows[1].color)+fractionPill(rows[2].y,hundredths,100,rows[2].color);
  svg+=`<rect x="${markerX-32}" y="271" width="64" height="28" rx="7" fill="#ffffff" stroke="#087a55" stroke-width="1.3"/><text x="${markerX}" y="292" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="850" fill="#087a55">${escapeHtml(fmt(data.value*100))} %</text>`;
  return `<svg class="multiple-forms-svg multiple-forms-line-mobile" viewBox="0 0 ${W} ${H}" role="img" aria-label="Quatre droites graduées adaptées au téléphone">${svg}</svg>`;
}

function multipleFormsCorrectionCaption(data){
  const h=Math.round(data.hundredths);
  if(data.kind==='decimal_to_tenths') return '';
  if(data.kind==='decimal_to_irreducible') return `$$${h}\\text{ centièmes}=\\dfrac{${data.numerator}}{${data.denominator}}$$`;
  if(data.kind==='decimal_to_percent') return `$$${h}\\text{ centièmes}=${h}\\%$$`;
  if(data.kind==='percent_to_decimal') return `$$${h}\\%=${h}\\text{ centièmes}=${fmt(data.value)}$$`;
  if(data.kind==='fraction_to_decimal') return `$$\\dfrac{${data.numerator}}{${data.denominator}}=\\dfrac{${h}}{100}=${fmt(data.value)}$$`;
  if(data.kind==='fraction_to_percent') return `$$\\dfrac{${data.numerator}}{${data.denominator}}=\\dfrac{${h}}{100}=${h}\\%$$`;
  if(data.kind==='percent_to_fraction100') return `$$${h}\\%=\\dfrac{${h}}{100}$$`;
  if(data.kind==='equivalent_to100') return `$$\\dfrac{${data.numerator}}{${data.denominator}}=\\dfrac{${h}}{100}$$`;
  if(data.kind==='simplify_decimal_fraction') return `$$\\dfrac{${data.sourceNumerator}}{${data.sourceDenominator}}=\\dfrac{${data.numerator}}{${data.denominator}}$$`;
  return '';
}

function renderMultipleFormsModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.multipleForms;
  if(!data) return renderGenericQuestion(inst,correction,mode);
  const qcm=splitQCM(inst.rawStatement);
  const prompt=qcm?qcm.prompt:inst.rawStatement;
  let html='<div class="question multiple-forms-prompt">'+renderMathSegments(prompt)+'</div>';
  if(isWithoutVisuals(mode)) html+=visualPlaceholder(mode);
  else if(data.kind==='decimal_to_tenths') html+=multipleFormsTenthsSvg(data,correction);
  else if(data.kind==='synthesis_line') html+=multipleFormsLineSvg(data);
  else html+=multipleFormsGridSvg(data,correction);
  if(qcm){
    const corrects=new Set(inst.answers.map(value=>String(value)));
    html+='<div class="options multiple-forms-options options-'+qcm.opts.length+compactQcmClass(qcm.opts)+'">';
    qcm.opts.forEach((option,index)=>{
      const isCorrect=correction&&corrects.has(String(index+1));
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
    });
    html+='</div>';
  }else if(inst.rawFooter){
    html+='<div class="footer multiple-forms-answer">'+renderPlaceholders(inst.rawFooter,inst.answers,correction?'correction':'question')+'</div>';
  }
  return html;
}

function renderAngleSumModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const qcm=splitQCM(inst.rawStatement);
  const prompt=qcm?qcm.prompt:inst.rawStatement;
  const bar=inst.angleSum&&inst.angleSum.bar;
  let html='<div class="question angle-sum-prompt">'+renderMathSegments(prompt)+'</div>';
  if(bar){
    if(isWithoutVisuals(mode)) html+=visualPlaceholder(mode);
    else{
      const action=angleSumEquabarButtonHtml(bar);
      if(bar.view==='combined') html+='<div class="triangle-angle-sum-visual">'+triangleAngleSumVisual({...bar,view:'triangle'},correction)+action+triangleAngleSumVisual({...bar,view:'bar'},correction)+'</div>';
      else html+=action+triangleAngleSumVisual(bar,correction);
    }
  }
  if(qcm){
    const corrects=new Set(inst.answers.map(value=>String(value)));
    html+='<div class="options angle-sum-options options-'+qcm.opts.length+'">';
    qcm.opts.forEach((option,index)=>{
      const isCorrect=correction&&corrects.has(String(index+1));
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
    });
    html+='</div>';
  }
  if(inst.rawFooter) html+='<div class="footer angle-sum-answer">'+renderPlaceholders(inst.rawFooter,inst.answers,correction?'correction':'question')+'</div>';
  return html;
}

function evolutionBraceSvg(x1,x2,y,color,label,W){
  const span=Math.max(1,x2-x1),mid=(x1+x2)/2;
  const inset=Math.min(15,span*.22),gap=Math.min(11,span*.18);
  const labelX=Math.max(125,Math.min(W-125,mid));
  return `<path d="M ${x1} ${y} Q ${x1} ${y+13} ${x1+inset} ${y+13} L ${mid-gap} ${y+13} Q ${mid-4} ${y+13} ${mid} ${y+22} Q ${mid+4} ${y+13} ${mid+gap} ${y+13} L ${x2-inset} ${y+13} Q ${x2} ${y+13} ${x2} ${y}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><text x="${labelX}" y="${y+49}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="850" fill="${color}">${escapeHtml(label)}</text>`;
}

function evolutionBarSvg(data,correction=false){
  const increase=data.direction==='increase';
  const totalCells=increase?data.baseCells+data.deltaCells:data.baseCells;
  const compactCells=totalCells>13;
  // La barre utile occupe la même proportion du cadre que le composant
  // arithmetic.fraction-percent-bar : elle reste donc large et lisible, sans
  // réserve vide artificielle sur la droite du SVG.
  const W=compactCells?660:980,x=compactCells?30:40,available=compactCells?600:900;
  // Les deux rangées gardent la même hauteur visuelle que le gabarit dnb_04
  // lorsque les barres sont ramenées à une largeur utile commune.
  // Le SVG compact est moins large : sa hauteur interne est réduite dans la
  // même proportion pour conserver exactement la même épaisseur à l'écran.
  const barH=compactCells?84:124;
  const topY=18,topH=barH,bottomY=topY+topH,bottomH=barH;
  const baseW=increase?available*data.baseCells/totalCells:available;
  const bottomW=increase?available:baseW;
  const cellW=baseW/data.baseCells;
  const border='#18223d';
  // La couleur décrit la valeur d'une case, et non le sens de l'évolution :
  // deux découpages identiques gardent ainsi la même couleur pédagogique.
  const cellPercent=100/data.baseCells;
  const mainFill=cellPercent===50?'#ffe36d':(cellPercent===25?'#91d88e':(cellPercent===10?'#f6b36a':'#9ed6f4'));
  const neutralFill=cellPercent===10?'#fff0df':'#fffdf3';
  const familyTopFill=cellPercent===50?'#fff9dc':(cellPercent===25?'#eef9ec':(cellPercent===10?'#fff0df':'#eef8fe'));
  const braceY=bottomY+bottomH+8;
  // La hauteur est réservée dès l'énoncé : le tableau ne change ainsi jamais
  // d'échelle lorsque l'accolade et la correction apparaissent.
  // Refonte dnb_35 : la barre n’est plus que le dessin du panneau Aide (sans
  // accolade) ; on ne réserve la place de l’accolade qu’en correction.
  const H=correction?braceY+74:bottomY+bottomH+6;
  const text=(cx,cy,value,size=28,weight=800,fill=border)=>`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeHtml(value)}</text>`;
  let body='<defs><pattern id="evolution-hatch" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><rect width="18" height="18" fill="#fff8fa"/><line x1="0" y1="0" x2="0" y2="18" stroke="#ffb8c6" stroke-width="4"/></pattern></defs>';
  body+=`<rect x="${x}" y="${topY}" width="${baseW}" height="${topH}" fill="${familyTopFill}"/>`;

  const removedStart=data.baseCells-data.deltaCells;
  for(let i=0;i<totalCells;i++){
    const changed=increase?i>=data.baseCells:i>=removedStart;
    let fill=mainFill;
    if(changed&&!correction) fill=neutralFill;
    // Dans une diminution, la partie retirée doit être visible dès la question.
    if(changed&&!increase) fill='url(#evolution-hatch)';
    body+=`<rect x="${x+i*cellW}" y="${bottomY}" width="${cellW}" height="${bottomH}" fill="${fill}"/>`;
  }

  body+=`<path d="M ${x} ${bottomY} V ${topY} H ${x+baseW} V ${bottomY}" fill="none" stroke="${border}" stroke-width="2.6"/><rect x="${x}" y="${bottomY}" width="${bottomW}" height="${bottomH}" fill="none" stroke="${border}" stroke-width="2.6"/>`;
  for(let i=1;i<totalCells;i++) body+=`<line x1="${x+i*cellW}" y1="${bottomY}" x2="${x+i*cellW}" y2="${bottomY+bottomH}" stroke="${border}" stroke-width="2.1"/>`;

  const topLabel=data.normalized?evoPct(100):evoNum(data.initial);
  body+=text(x+baseW/2,topY+topH/2,topLabel,data.normalized?37:36,850);
  const cellFont=Math.max(14,Math.min(30,cellW*.44));
  for(let i=0;i<totalCells;i++){
    // Pour 5 %, vingt subdivisions doivent rester visibles ensemble sur un
    // téléphone. Une seule valeur de part suffit alors dans la correction.
    const cellLabel=compactCells
      ?(correction&&i===0?fmt(data.normalized?100/data.baseCells:data.cellValue):'')
      :(data.normalized?(fmt(100/data.baseCells)+' %'):(correction?fmt(data.cellValue):'...'));
    body+=text(x+(i+.5)*cellW,bottomY+bottomH/2,cellLabel,data.normalized?Math.max(17,cellFont):(correction?cellFont:Math.max(17,cellFont)),800);
  }

  // Refonte : l’accolade et son total n’apparaissent qu’en correction ; le
  // dessin d’aide (question) ne doit jamais écrire « 110 % » ni le total.
  if(correction){
    let x1=x,x2=x+bottomW,color='#4778ff',label='';
    if(data.braceMode==='remainder'){
      x2=x+cellW*(data.baseCells-data.deltaCells);
      color='#12b878';
      label='Reste = '+fmt(data.newTotal);
    }else if(data.braceMode==='newTotal'){
      label='Nouveau total = '+fmt(data.newTotal);
    }else if(data.braceMode==='amount'){
      x1=x+baseW;
      label='Augmentation = '+fmt(data.amount);
    }else if(data.braceMode==='coefficient'){
      if(!increase) x2=x+cellW*(data.baseCells-data.deltaCells);
      color=increase?'#4778ff':'#12b878';
      const resultingPercent=increase?100+data.percent:100-data.percent;
      label=fmt(resultingPercent)+' %';
    }
    const coefficientCalculation=data.braceMode==='coefficient'&&correction;
    body+=evolutionBraceSvg(x1,x2,braceY,color,coefficientCalculation?'':label,W);
    if(coefficientCalculation){
      const resultingPercent=increase?100+data.percent:100-data.percent;
      const center=Math.max(125,Math.min(W-125,(x1+x2)/2));
      const fractionCenter=center+15,numberY=braceY+35,lineY=braceY+41,calculationY=braceY+50,denominatorY=braceY+64;
      body+=`<text x="${center-92}" y="${calculationY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="850" fill="${color}">${escapeHtml(fmt(resultingPercent))} %</text>`;
      body+=`<text x="${fractionCenter}" y="${numberY}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="27" font-weight="750" fill="${color}">${escapeHtml(fmt(resultingPercent))}</text>`;
      body+=`<line x1="${fractionCenter-27}" y1="${lineY}" x2="${fractionCenter+27}" y2="${lineY}" stroke="${color}" stroke-width="2.2"/>`;
      body+=`<text x="${fractionCenter}" y="${denominatorY}" text-anchor="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="27" font-weight="750" fill="${color}">100</text>`;
      body+=`<text x="${center+55}" y="${calculationY}" text-anchor="start" dominant-baseline="middle" font-family="Cambria Math,STIX Two Math,Times New Roman,serif" font-size="29" font-weight="750" fill="${color}">= ${escapeHtml(fmt(data.newTotal))}</text>`;
    }
  }
  return `<div class="evolution-help${compactCells?' evolution-help-compact':''}"><svg class="evolution-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schéma en barres d’une évolution en pourcentage">${body}</svg></div>`;
}

function renderEvolutionModule(inst,correction=false,mode=null){
  // Refonte dnb_35 : la barre n’est plus dans la question ; c’est le dessin
  // du panneau Aide (inst.aideHtml). Choix et pied comme les autres modules.
  const qcm=splitQCM(inst.rawStatement);
  let html='<div class="question">'+renderMathSegments(qcm?qcm.prompt:inst.rawStatement)+'</div>';
  if(qcm){
    const corrects=new Set(inst.answers.map(value=>String(value)));
    html+='<div class="options options-'+qcm.opts.length+compactQcmClass(qcm.opts)+'">';
    qcm.opts.forEach((option,index)=>{
      const isCorrect=correction&&corrects.has(String(index+1));
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
    });
    html+='</div>';
  }else if(inst.rawFooter){
    html+='<div class="footer">'+renderPlaceholders(inst.rawFooter,inst.answers,correction?'correction':'question')+'</div>';
  }
  return html;
}

function relationSummaryItems(value){
  const terms=(...items)=>({kind:'terms',items});
  return [
    {label:'Double',result:2*value,visual:terms({type:'n',count:2,sign:1})},
    {label:'Triple',result:3*value,visual:terms({type:'n',count:3,sign:1})},
    {label:'Moitié',result:value/2,visual:{kind:'fraction',divisor:2}},
    {label:'Prédécesseur',result:value-1,visual:terms({type:'n',count:1,sign:1},{type:'u',count:1,sign:-1})},
    {label:'Successeur',result:value+1,visual:terms({type:'n',count:1,sign:1},{type:'u',count:1,sign:1})},
    {label:'Carré',result:value*value,visual:terms({type:'n2',count:1,sign:1})}
  ];
}

function renderModule09(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.relation;
  if(!data) return renderGenericQuestion(inst,correction,mode);
  const withHelp=!isWithoutVisuals(mode);

  if(data.kind==='summary'){
    let html='<div class="question relation-prompt">'+renderMathSegments(inst.rawStatement)+'</div>';
    html+='<div class="relation-summary-grid">';
    relationSummaryItems(data.value).forEach(item=>{
      html+='<div class="relation-summary-card"><div class="relation-summary-line"><span>'+item.label+'</span><strong>'+(correction?escapeHtml(fmt(item.result)):'…')+'</strong></div>'+(withHelp?relationTilesHtml(item.visual):'')+'</div>';
    });
    html+='</div>';
    if(!withHelp) html+=visualPlaceholder(mode);
    return html;
  }

  if(data.kind==='expression_qcm'){
    let html='<div class="question relation-prompt">'+renderMathSegments(data.qcm.prompt)+'</div>';
    html+='<div class="options options-4 options-compact relation-options">';
    data.qcm.options.forEach((option,index)=>{
      const isCorrect=correction&&String(index+1)===String(data.qcm.correctIndex);
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><div class="relation-option-label"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments('$$'+option.latex+'$$')+'</div>'+(withHelp?relationTilesHtml(option.visual):'')+'</div>';
    });
    html+='</div>';
    if(!withHelp) html+=visualPlaceholder(mode);
    return html;
  }

  let html='<div class="question relation-prompt">'+renderMathSegments(inst.rawStatement)+'</div>';
  html+=withHelp?relationBarSvg(data,correction):visualPlaceholder(mode);
  if(inst.rawFooter) html+='<div class="footer relation-answer">'+renderPlaceholders(inst.rawFooter,inst.answers,correction?'correction':'question')+'</div>';
  return html;
}

function renderSolidsModule(inst,correction=false){
  const qcm=splitQCM(inst.rawStatement);
  if(!qcm) return renderGenericQuestion(inst,correction,'with');
  const corrects=new Set(inst.answers.map(x=>String(x)));
  const sharedVisual=inst.solids&&inst.solids.visual&&typeof globalThis.solidSvg==='function';
  let html=sharedVisual
    ?'<div class="solid-question"><div class="solid-prompt">'+escapeHtml(inst.solids.prompt)+'</div><div class="solid-visual">'+globalThis.solidSvg(inst.solids.visual)+'</div></div>'
    :'<div class="solid-question">'+renderMathSegments(qcm.prompt)+'</div>';
  html+='<div class="options solid-options">';
  qcm.opts.forEach((option,index)=>{
    const isCorrect=correction&&corrects.has(String(index+1));
    html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
  });
  html+='</div>';
  return html;
}
function renderAreaModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const d=inst.area;
  let html='<div class="area-question">';
  html+='<div class="area-prompt">'+renderMathSegments(d.prompt)+'</div>';
  html+='<div class="area-main">'+(d.visualHtml?'<div class="area-visual">'+d.visualHtml+'</div>':d.dataHtml)+'</div>';
  html+='</div>';

  if(d.qcm){
    html+='<div class="options area-options">';
    d.qcm.options.forEach((option,index)=>{
      const isCorrect=correction&&String(index+1)===String(d.qcm.correctIndex);
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
    });
    html+='</div>';
    if(correction&&d.formula){
      html+='<div class="area-correction-flow"><div class="area-help">'+renderMathSegments(d.formula)+'</div>';
      if(d.calculation) html+='<div class="area-correction">'+renderMathSegments(d.calculation)+'</div>';
      html+='</div>';
    }
  }else{
    if(correction){
      html+='<div class="area-correction-flow"><div class="area-help">'+renderMathSegments(d.formula)+'</div>';
      if(d.calculation) html+='<div class="area-correction">'+renderMathSegments(d.calculation)+'</div>';
      html+='<div class="area-answer-line">Aire = <strong class="area-answer-value">'+escapeHtml(d.result)+'</strong></div></div>';
    }else{
      html+='<div class="area-answer-line">Aire = <span class="answer-dots">…</span> '+d.unit2+'</div>';
    }
  }
  return html;
}
function perimeterCorrectionForQuestion(inst){
  const n=Number(inst.q.n),s=inst.scope||{},answer=String(inst.answers&&inst.answers[0]!==undefined?inst.answers[0]:'');
  const v=name=>fmt(Number(s[name]));
  if(n===11){
    return s.isRadius
      ?{formula:'P=2\\times\\pi\\times r',calculation:'P=2\\times\\pi\\times'+v('measure')+'='+answer+'\\text{ cm}'}
      :{formula:'P=\\pi\\times d',calculation:'P=\\pi\\times'+v('measure')+'='+answer+'\\text{ cm}'};
  }
  const cases={
    1:{formula:'P=2\\times(\\text{longueur}+\\text{largeur})',calculation:'P=2\\times('+v('L')+'+'+v('l')+')='+answer+'\\text{ cm}'},
    2:{formula:'P=4\\times\\text{côté}',calculation:'P=4\\times'+v('c')+'='+answer+'\\text{ cm}'},
    3:{formula:'P=a+b+c',calculation:'P='+v('a')+'+'+v('b')+'+'+v('c')+'='+answer+'\\text{ cm}'},
    4:{formula:'P=5\\times\\text{côté}',calculation:'P=5\\times'+v('c')+'='+answer+'\\text{ cm}'},
    5:{formula:'P=2\\times(\\text{longueur}+\\text{largeur})',calculation:'P=2\\times('+v('L')+'+'+v('l')+')='+answer+'\\text{ cm}'},
    6:{formula:'P=2\\times(\\text{largeur totale}+\\text{hauteur totale})',calculation:'P=2\\times('+v('W')+'+'+v('H')+')='+answer+'\\text{ cm}'},
    7:{formula:'P=2\\times\\pi\\times r',calculation:'P\\approx2\\times3,1\\times'+v('r')+'='+answer+'\\text{ cm}'},
    8:{formula:'P=\\pi\\times d',calculation:'P\\approx3,1\\times'+v('d')+'='+answer+'\\text{ cm}'},
    9:{formula:'P=a+b+c+d',calculation:'P='+v('a')+'+'+v('b')+'+'+v('c')+'+'+v('d')+'='+answer+'\\text{ cm}'},
    10:{formula:'P=6\\times\\text{côté}',calculation:'P=6\\times'+v('c')+'='+answer+'\\text{ cm}'}
  };
  return cases[n]||{formula:'P=\\text{somme des longueurs des côtés}',calculation:'P='+answer+'\\text{ cm}'};
}
function renderPerimeterModule(inst,correction=false,mode=null){
  if(Number(inst.q.n)===12) return renderGenericQuestion(inst,correction,mode);
  let correctionFlow='';
  if(correction){
    const detail=perimeterCorrectionForQuestion(inst);
    correctionFlow='<div class="perimeter-correction-flow"><div class="perimeter-formula">'+renderMathSegments('$$'+detail.formula+'$$')+'</div><div class="perimeter-calculation">'+renderMathSegments('$$'+detail.calculation+'$$')+'</div></div>';
  }
  let html='<div class="perimeter-question">'+correctionFlow+'<div class="perimeter-prompt">'+renderMathSegments(inst.rawStatement)+'</div></div>';
  const relation=[7,8].includes(Number(inst.q.n))?'\\approx':'=';
  if(inst.rawFooter) html+='<div class="footer perimeter-answer">'+renderPlaceholders('$$P'+relation+'[[formula]]\\text{ cm}$$',inst.answers,correction?'correction':'question')+'</div>';
  return html;
}
function volumeFormulaForQuestion(number){
  const formulas={
    1:'V=\\text{côté}\\times\\text{côté}\\times\\text{côté}',
    2:'V=\\text{longueur}\\times\\text{largeur}\\times\\text{hauteur}',
    3:'V=\\text{aire de la base}\\times\\text{hauteur du prisme}',
    4:'V=\\pi\\times r\\times r\\times h',
    5:'V=\\text{côté}\\times\\text{côté}\\times\\text{côté}',
    6:'V=\\text{longueur}\\times\\text{largeur}\\times\\text{hauteur}',
    7:'V=A_{base}\\times h',
    8:'V=A_{base}\\times h',
    9:'r=d\\div2\\quad;\\quad V=\\pi\\times r\\times r\\times h',
    10:'V_{total}=2\\times\\text{côté}\\times\\text{côté}\\times\\text{côté}'
  };
  return formulas[Number(number)]||'V=A_{base}\\times h';
}
function volumeCalculationForQuestion(inst){
  const n=Number(inst.q.n),s=inst.scope||{},answer=String(inst.answers&&inst.answers[0]!==undefined?inst.answers[0]:'');
  const v=name=>fmt(Number(s[name]));
  const cases={
    1:'V='+v('c')+'\\times'+v('c')+'\\times'+v('c')+'='+answer+'\\text{ cm}^3',
    2:'V='+v('L')+'\\times'+v('l')+'\\times'+v('h')+'='+answer+'\\text{ cm}^3',
    3:'V=('+v('b')+'\\times'+v('ht')+'\\div2)\\times'+v('p')+'='+answer+'\\text{ cm}^3',
    4:'V\\approx3,14\\times'+v('r')+'\\times'+v('r')+'\\times'+v('h')+'='+answer+'\\text{ cm}^3',
    5:'V='+v('a')+'\\times'+v('a')+'\\times'+v('a')+'='+answer+'\\text{ mm}^3',
    6:'V='+v('L')+'\\times'+v('l')+'\\times'+v('h')+'='+answer+'\\text{ cm}^3',
    7:'V='+v('a')+'\\times'+v('h')+'='+answer+'\\text{ cm}^3',
    8:'V='+v('a')+'\\times'+v('h')+'='+answer+'\\text{ cm}^3',
    9:'r='+v('d')+'\\div2='+fmt(Number(s.d)/2)+'\\text{ cm}\\quad;\\quad V\\approx3,14\\times'+fmt(Number(s.d)/2)+'\\times'+fmt(Number(s.d)/2)+'\\times'+v('h')+'='+answer+'\\text{ cm}^3',
    10:'V_{total}=2\\times'+v('a')+'\\times'+v('a')+'\\times'+v('a')+'='+answer+'\\text{ cm}^3'
  };
  return cases[n]||'V='+answer;
}
function renderVolumeCalculation(inst){
  const calculation=volumeCalculationForQuestion(inst);
  const answer=String(inst.answers&&inst.answers[0]!==undefined?inst.answers[0]:'');
  const answerIndex=calculation.lastIndexOf(answer);
  if(!answer||answerIndex<0) return renderMathSegments('$$'+calculation+'$$');
  const prefix=calculation.slice(0,answerIndex);
  const result=calculation.slice(answerIndex);
  return renderMathSegments('$$'+prefix+'$$')
    +'<strong class="volume-result">'+renderMathSegments('$$'+result+'$$')+'</strong>';
}
function volumeVisualForQuestion(inst){
  if(typeof globalThis.solidSvg!=='function') return '';
  const n=Number(inst.q.n),s=inst.scope||{},v=name=>fmt(Number(s[name]));
  const data={
    1:{kind:'cube',labels:{edge:v('c')+' cm'}},
    2:{kind:'cuboid',labels:{length:v('L')+' cm',width:v('l')+' cm',height:v('h')+' cm'}},
    3:{kind:'prism',labels:{base:v('b')+' cm',baseHeight:v('ht')+' cm',length:v('p')+' cm'}},
    4:{kind:'cylinder',labels:{radius:'r = '+v('r')+' cm',height:v('h')+' cm'}},
    8:{kind:'prism',labels:{baseArea:'Aire de la base = '+v('a')+' cm²',height:'h = '+v('h')+' cm'}},
    9:{kind:'cylinder',labels:{diameter:'d = '+v('d')+' cm',height:v('h')+' cm'}}
  }[n];
  return data?globalThis.solidSvg(data):'';
}
function volumePromptForQuestion(inst){
  const n=Number(inst.q.n);
  const prompts={
    1:'Calcule le volume de ce cube.',
    2:'Calcule le volume de ce pavé droit.',
    3:'Calcule le volume de ce prisme droit à base triangulaire.',
    4:'Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.',
    8:'Calcule le volume de ce prisme droit.',
    9:'Calcule le volume de ce cylindre. On prendra $$\\pi\\approx 3,14$$.'
  };
  return {prompt:prompts[n]||inst.rawStatement,detail:''};
}
function renderVolumeModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const visual=volumeVisualForQuestion(inst);
  const content=visual?volumePromptForQuestion(inst):{prompt:inst.rawStatement,detail:''};
  let html='<div class="volume-question">';
  html+='<div class="volume-prompt">'+renderMathSegments(content.prompt)+'</div>';
  if(visual) html+='<div class="volume-visual">'+visual+'</div>';
  if(content.detail) html+='<div class="volume-data">'+escapeHtml(content.detail)+'</div>';
  html+='</div>';
  html+='<div class="volume-response-zone">';
  if(correction){
    html+='<div class="volume-correction-flow"><div class="volume-formula">'+renderMathSegments('$$'+volumeFormulaForQuestion(inst.q.n)+'$$')+'</div><div class="volume-calculation">'+renderVolumeCalculation(inst)+'</div></div>';
  }else if(inst.rawFooter){
    html+='<div class="footer volume-answer">'+renderPlaceholders(inst.rawFooter,inst.answers,'question')+'</div>';
  }
  html+='</div>';
  return html;
}
function averageVisualHtml(d){
  if(!d.visual) return '';
  if(d.visual.type==='comparison') return averageComparisonSvg(d.visual,false);
  if(d.visual.type==='totalParts') return averageTotalPartsSvg(d.visual,false);
  if(d.visual.type==='weighted') return averageWeightedSvg(d.visual);
  if(d.visual.type==='range') return averageRangeSvg(d.visual,false);
  return '';
}
function renderAverageModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const d=inst.average;
  let html='<div class="average-question">';
  html+='<div class="average-prompt">'+renderMathSegments(d.prompt)+'</div>';
  if(d.dataLine) html+='<div class="average-data-line">'+renderMathSegments('$$'+d.dataLine+'$$')+'</div>';
  if(d.tableHtml) html+='<div class="average-table-wrap">'+d.tableHtml+'</div>';
  if(d.instruction) html+='<div class="average-instruction">'+renderMathSegments(d.instruction)+'</div>';
  html+='</div>';

  if(!correction&&d.visual){
    if(!isWithoutVisuals(mode)) html+='<div class="average-help-visual">'+averageVisualHtml(d)+'</div>';
    else html+=visualPlaceholder(mode);
  }

  if(d.qcm){
    const formulaClass=d.kind==='formula'?' average-formula-options':'';
    html+='<div class="options average-options'+formulaClass+' options-'+d.qcm.options.length+'">';
    d.qcm.options.forEach((option,index)=>{
      const isCorrect=correction&&String(index+1)===String(d.qcm.correctIndex);
      html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';
    });
    html+='</div>';
  }else{
    html+='<div class="average-answer-line">'+escapeHtml(d.answerPrefix);
    if(correction){
      const result=d.kind==='weighted_zero'?escapeHtml(d.displayResult):renderMathSegments('$$'+d.displayResult+'$$');
      html+='<strong class="average-answer-value">'+result+'</strong>';
    }else html+='<span class="answer-dots">…</span>';
    html+='</div>';
  }

  if(correction&&(d.calculation||d.explanation)){
    html+='<div class="average-correction">';
    if(d.calculation) html+='<div><span class="average-step">Calcul</span><div>'+renderMathSegments(d.calculation)+'</div></div>';
    if(d.explanation) html+='<div><span class="average-step">Propriété</span><div>'+escapeHtml(d.explanation)+'</div></div>';
    html+='</div>';
  }
  return html;
}

function module01VisualHtml(data,correction=false){
  const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('arithmetic.fraction-decimal-grid');
  if(!component) throw new Error('Le composant arithmetic.fraction-decimal-grid doit être chargé avant dnb_01.');
  if(!data) return '';
  return component.render(data,correction);
}
function renderModule01(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const d=inst.module01;
  let html='<div class="question module01-prompt">'+renderMathSegments(d.prompt)+'</div>';
  // Le dessin n'est jamais la réponse : dans la question, c'est l'aide (sans « 1 » sur les unités) ;
  // dans la correction, les unités complètes sont repérées et le tableau de numération est rempli.
  const visualData=correction?(d.correctionVisualData||null):(d.visualData||null);
  if(d.qcm&&d.display) html+='<div class="module01-source">'+renderMathSegments(d.display.replace('[[compare]]',module01CompareSlot(d,correction)))+'</div>';
  if(visualData){
    if(!isWithoutVisuals(mode)) html+=module01VisualHtml(visualData,correction);
    else html+=visualPlaceholder(mode);
  }
  if(d.qcm){
    const signs=d.qcm.kind==='signs';
    // Les trois signes : trois gros boutons côte à côte, signe centré.
    const signGrid=signs?' style="grid-template-columns:repeat(3,minmax(0,1fr));max-width:620px;margin-left:auto;margin-right:auto"':'';
    html+='<div class="options module01-options'+(signs?' module01-sign-options':'')+' options-'+d.qcm.options.length+'"'+signGrid+'>';
    d.qcm.options.forEach((option,i)=>{
      const isCorrect=correction&&String(i+1)===String(d.qcm.correctIndex);
      const code=d.qcm.codes&&d.qcm.codes[i]?' data-error-code="'+escapeHtml(d.qcm.codes[i])+'"':'';
      const label=signs?'<span class="module01-sign" style="font-size:1.7em;font-weight:800;line-height:1">'+escapeHtml(option)+'</span>':(['Vrai','Faux'].includes(option)?option:renderMathSegments('$$'+option+'$$'));
      const optStyle=signs?' style="display:flex;align-items:center;justify-content:center;gap:.45em;text-align:center"':'';
      html+='<div class="opt '+(isCorrect?'correct':'')+'"'+code+optStyle+'><strong>'+String.fromCharCode(65+i)+'.</strong> '+label+'</div>';
    });
    html+='</div>';
  } else {
    const answerLine=renderMathSegments(renderPlaceholders(d.display,inst.answers,correction?'correction':'question'));
    // Lignes larges (2 + 1/10 + 1/100 = … ; 2,75 = 11/4 avec la réponse barrée) : plus petites
    // sur un petit téléphone pour tenir dans la largeur ; inchangées à l'ordinateur.
    const shrink=d.extra&&d.extra.threeTerms?'8.6vw':(['sum','d2f'].includes(d.direction)?'12vw':'');
    html+='<div class="footer module01-answer">'+(shrink?'<span style="font-size:min(100%,'+shrink+')">'+answerLine+'</span>':answerLine)+'</div>';
  }
  return html;
}
function module01CompareSlot(d,correction){
  const sign=d.extra&&d.extra.sign;
  const shown=correction&&sign?escapeHtml(sign):'…';
  return '<span class="module01-compare-slot" style="display:inline-block;min-width:1.5em;margin:0 .3em;padding:0 .12em;border-bottom:.08em solid currentColor;text-align:center;line-height:1.1'+(correction?';color:#0b7c67':'')+'">'+shown+'</span>';
}

function fractionOpsVisualHtml(data,correction=false){
  const component=globalThis.MATHSGO_VISUALS&&globalThis.MATHSGO_VISUALS.get('arithmetic.fraction-operations');
  if(!component) throw new Error('Le composant arithmetic.fraction-operations doit être chargé avant les modules de fractions.');
  return component.render(data,correction);
}
function fractionOpsEquation(data,correction=false){
  if(data.kind==='simplify_simple'||data.kind==='simplify_harder') return {left:fractionOpsLatex(data.num,data.den),right:fractionOpsResultLatex(data.result)};
  if(data.kind==='add_same_den'||data.kind==='subtract_same_den'){
    const rawNumerator=data.kind==='add_same_den'?data.a+data.b:data.a-data.b;
    const raw={num:rawNumerator,den:data.den};
    const reduced=raw.num!==data.result.num||raw.den!==data.result.den;
    return {
      left:fractionOpsLatex(data.a,data.den)+(data.kind==='add_same_den'?'+':'-')+fractionOpsLatex(data.b,data.den),
      right:fractionOpsLatex(raw.num,raw.den),
      simplification:correction&&reduced?{raw,result:data.result,divisor:GCD(Math.abs(raw.num),Math.abs(raw.den))}:null
    };
  }
  if(data.kind==='add_multiple_den'){
    const intermediate=fractionOpsLatex(data.converted,data.den2)+'+'+fractionOpsLatex(data.b,data.den2);
    const right=correction?intermediate+'='+fractionOpsResultLatex(data.result):fractionOpsResultLatex(data.result);
    return {left:fractionOpsLatex(data.a,data.den1)+'+'+fractionOpsLatex(data.b,data.den2),right};
  }
  if(data.kind==='multiply') return {left:fractionOpsLatex(data.a,data.den1)+'\\times '+fractionOpsLatex(data.b,data.den2),right:fractionOpsResultLatex(data.result)};
  if(data.kind==='multiply_cancel') return {left:fractionOpsLatex(data.a,data.den1)+'\\times '+fractionOpsLatex(data.b,data.den2),right:fractionOpsResultLatex(data.result)};
  if(data.kind==='divide_integer_unit') return {left:String(data.whole)+'\\div '+fractionOpsLatex(1,data.unitDen),right:String(data.result)};
  if(data.kind==='divide_fraction') return {left:fractionOpsLatex(data.a,data.den1)+'\\div '+fractionOpsLatex(data.b,data.den2),right:fractionOpsResultLatex(data.result)};
  if(data.kind==='divide_mixed'){
    const left=data.orientation==='fraction_by_integer'
      ? fractionOpsLatex(data.a,data.den)+'\\div '+data.k
      : data.whole+'\\div '+fractionOpsLatex(data.b,data.den);
    return {left,right:fractionOpsResultLatex(data.result)};
  }
  return null;
}
function renderFractionOpsModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.fractionOps;
  const prompts={
    simplify_simple:'Simplifie cette fraction.',simplify_harder:'Simplifie cette fraction.',
    compare_same_den:'Quelle est la plus grande de ces deux fractions ?',compare_same_num:'Quelle est la plus grande de ces deux fractions ?',
    add_same_den:'Calcule cette somme.',subtract_same_den:'Calcule cette différence.',
    add_multiple_den:'Réduis au même dénominateur, puis calcule.',multiply:'Calcule ce produit.',
    multiply_cancel:'Calcule ce produit et donne le résultat simplifié.',
    divide_integer_unit:'Combien de fractions-unités contient ce nombre ?',
    divide_mixed:'Calcule ce quotient et donne le résultat simplifié.',
    divide_fraction:'Calcule ce quotient et donne le résultat simplifié.'
  };
  let html='<div class="question fraction-ops-prompt">'+prompts[data.kind]+'</div>';

  if(data.qcm){
    if(!isWithoutVisuals(mode)) html+='<div class="fraction-ops-help">'+fractionOpsVisualHtml(data,correction)+'</div>';
    else html+=visualPlaceholder(mode);
    html+='<div class="options fraction-ops-options options-'+data.qcm.options.length+'">';
    data.qcm.options.forEach((option,index)=>{
      const correct=correction&&String(index+1)===String(data.qcm.correctIndex);
      const rendered=option.charAt(0)==='\\'?renderMathSegments('$$'+option+'$$'):escapeHtml(option);
      html+='<div class="opt '+(correct?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+rendered+'</div>';
    });
    html+='</div>';
  }else{
    const equation=fractionOpsEquation(data,correction);
    html+='<div class="footer fraction-ops-answer fraction-ops-answer-top"><span>'+renderMathSegments('$$'+equation.left+'=$$')+'</span>'
      +(correction?'<strong>'+renderMathSegments('$$'+equation.right+'$$')+'</strong>':'<span class="answer-dots">...</span>')+'</div>';
    if(correction&&equation.simplification){
      const step=equation.simplification;
      html+='<div class="fraction-ops-simplification"><span>Forme simplifiée :</span>'
        +renderMathSegments('$$'+fractionOpsLatex(step.raw.num,step.raw.den)+'='
          +fractionOpsLatex(step.raw.num+'\\div'+step.divisor,step.raw.den+'\\div'+step.divisor)
          +'='+fractionOpsResultLatex(step.result)+'$$')+'</div>';
    }
    if(!isWithoutVisuals(mode)) html+='<div class="fraction-ops-help">'+fractionOpsVisualHtml(data,correction)+'</div>';
    else html+=visualPlaceholder(mode);
  }
  return html;
}

function renderSubstitutionModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.substitution,number=Number(inst.q.n);
  let prompt=data.prompt;
  if(![7,10].includes(number)){
    prompt=number===6
      ? 'Calcule pour '+renderMathSegments('$$'+substitutionVariableLatex('x')+'\\,=\\,'+substitutionIntegerLatex(data.x)+'$$')+' et '+renderMathSegments('$$'+substitutionVariableLatex('y')+'\\,=\\,'+substitutionIntegerLatex(data.y)+'$$')+'.'
      : 'Calcule pour '+renderMathSegments('$$'+substitutionVariableLatex('x')+'\\,=\\,'+substitutionIntegerLatex(data.x)+'$$')+'.';
  }
  if(number===9) prompt='Pour '+renderMathSegments('$$'+substitutionVariableLatex('x')+'\\,=\\,'+substitutionIntegerLatex(data.x)+'$$')+', que vaut '+renderMathSegments('$$2'+substitutionVariableLatex('x')+'^2$$')+' ?';
  let html='<div class="question substitution-prompt">'+prompt+'</div>';
  if(number!==10) html+='<div class="substitution-expression">'+renderMathSegments('$$'+data.expression+'$$')+'</div>';
  if(!isWithoutVisuals(mode)&&number!==7){
    html+='<div class="substitution-help">'+renderMathSegments('$$'+data.substitution+'$$')+'</div>';
  }else if(number!==7) html+=visualPlaceholder(mode);

  if(data.qcm){
    html+='<div class="options substitution-options options-'+data.qcm.options.length+'">';
    data.qcm.options.forEach((option,index)=>{
      const correct=correction&&String(index+1)===String(data.qcm.correctIndex);
      html+='<div class="opt '+(correct?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments('$$'+option+'$$')+'</div>';
    });
    html+='</div>';
  }else{
    const suffix=number===10?'\\text{ cm}^2':'';
    html+='<div class="footer substitution-answer"><span class="substitution-equals">=</span>'
      +(correction?'<strong>'+renderMathSegments('$$'+data.answer+suffix+'$$')+'</strong>':'<span class="answer-dots">…</span>')+'</div>';
  }
  return html;
}

function equationAlignedRowHtml(equation,className=''){
  const parts=String(equation).split(' = ');
  const left=parts.shift()||'';
  const right=parts.join(' = ');
  return '<div class="equation-aligned-row '+className+'">'
    +'<span class="equation-aligned-left">'+renderMathSegments('$$'+left+'$$')+'</span>'
    +'<span class="equation-aligned-equals">=</span>'
    +'<span class="equation-aligned-right">'+renderMathSegments('$$'+right+'$$')+'</span>'
    +'</div>';
}
function equationDetailEquationRowHtml(equation,isFinal=false){
  const parts=String(equation).split(' = ');
  const left=parts.shift()||'';
  const right=parts.join(' = ');
  return '<div class="equation-detail-line equation-detail-equation '+(isFinal?'equation-detail-final':'')+'">'
    +'<span class="equation-detail-left">'+renderMathSegments('$$'+left+'$$')+'</span>'
    +'<span class="equation-detail-equals">=</span>'
    +'<span class="equation-detail-right">'+renderMathSegments('$$'+right+'$$')+'</span>'
    +'</div>';
}
function equationDetailOperationRowHtml(operation){
  const rendered=renderMathSegments('$$'+operation+'$$');
  return '<div class="equation-detail-line equation-detail-operation">'
    +'<span class="equation-detail-operation-left"><span>'+rendered+'</span><span class="equation-detail-arrow">↓</span></span>'
    +'<span class="equation-detail-operation-right"><span class="equation-detail-arrow">↓</span><span>'+rendered+'</span></span>'
    +'</div>';
}
function equationDetailHtml(data){
  let html='<div class="equation-detail-resolution">';
  data.steps.forEach((step,index)=>{
    html+=equationDetailEquationRowHtml(step,index===data.steps.length-1);
    if(index<data.operations.length) html+=equationDetailOperationRowHtml(data.operations[index]);
  });
  return html+'</div>';
}
function renderEquationModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const data=inst.equationData;
  let html='<div class="equation-resolve-button-row equation-mobile-resolve-button-row">'+equationResolveButtonHtml(data)+'</div>'
    +'<div class="question equation-prompt">'+escapeHtml(data.prompt)+'</div>';
  if(!data.contextual) html+=equationWithResolveHtml(data,'equation-main');

  if(!isWithoutVisuals(mode)){
    html+='<div class="equation-help">'
      +(data.contextual?equationWithResolveHtml(data,'equation-help-equation'):'')
      +equationSplatSvg(data,correction)+'</div>';
  }else html+=visualPlaceholder(mode);

  if(data.qcm){
    html+='<div class="options equation-options options-'+data.qcm.options.length+'">';
    data.qcm.options.forEach((option,index)=>{
      const correct=correction&&String(index+1)===String(data.qcm.correctIndex);
      const rendered=data.qcm.kind==='solution'?renderMathSegments('$$'+option+'$$'):escapeHtml(option);
      html+='<div class="opt '+(correct?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+rendered+'</div>';
    });
    html+='</div>';
  }else{
    const answerLabel=data.answerSuffix
      ?(correction?'<strong>'+escapeHtml(equationSignedInteger(data.solution)+data.answerSuffix)+'</strong>':'<span class="answer-dots">…</span>')
      :(data.variableOnLeft
        ?renderMathSegments('$$'+equationVariable()+' = $$')+(correction?'<strong>'+renderMathSegments('$$'+equationSignedInteger(data.solution)+'$$')+'</strong>':'<span class="answer-dots">…</span>')
        :(correction?'<strong>'+renderMathSegments('$$'+equationSignedInteger(data.solution)+'$$')+'</strong>':'<span class="answer-dots">…</span>')+renderMathSegments('$$ = '+equationVariable()+'$$'));
    html+='<div class="equation-answer-shell">'
      +'<span class="equation-answer-balance" aria-hidden="true"></span>'
      +'<div class="footer equation-answer">'+answerLabel+'</div>'
      +(correction?'<button class="equation-detail-btn" type="button" onclick="openEquationDetail()">Détail</button>':'<span class="equation-answer-balance" aria-hidden="true"></span>')
      +'</div>';
  }
  return html;
}

function stripSvgOnly(s){
  return String(s||'').replace(/<svg[\s\S]*?<\/svg>/ig,'').replace(/<div[^>]*>\s*<\/div>/ig,'').replace(/\n{2,}/g,'\n').trim();
}

function squareCardSvg(leftLabel,bottomLabel,centerLabel){
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="310" height="235" viewBox="0 0 310 235" style="display:block;max-width:310px;margin:6px auto 0">
    <rect x="86" y="18" width="150" height="150" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2.6"/>
    <text x="161" y="104" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#17384d">${centerLabel}</text>
    <text x="161" y="218" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" text-anchor="middle" fill="#17384d">${bottomLabel}</text>
    <text x="55" y="108" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" text-anchor="middle" fill="#17384d">${leftLabel}</text>
  </svg>`;
}

function doubleSquareCalcSvg(n, centerText){
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="520" height="235" viewBox="0 0 520 235" style="display:block;max-width:520px;margin:6px auto 0">
    <rect x="42" y="22" width="140" height="140" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2.6"/>
    <text x="112" y="101" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" text-anchor="middle" fill="#17384d">${centerText}</text>
    <text x="112" y="215" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#17384d">${n}</text>
    <text x="25" y="105" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#17384d">${n}</text>
    <text x="255" y="105" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" text-anchor="middle" fill="#17384d">+</text>
    <rect x="330" y="22" width="140" height="140" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2.6"/>
    <text x="400" y="101" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" text-anchor="middle" fill="#17384d">${centerText}</text>
    <text x="400" y="215" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#17384d">${n}</text>
    <text x="313" y="105" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#17384d">${n}</text>
  </svg>`;
}

function renderModule07(inst, correction=false, mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  if(isWithoutVisuals(mode)) return renderGenericQuestion(inst, correction, mode);

  const qn = Number(inst.q.n);
  const s = inst.scope || {};
  const c = (s.n!==undefined) ? String(s.n*s.n) : (s.c!==undefined ? String(s.c) : '');
  const qcm = splitQCM(inst.rawStatement);
  const promptBase = stripSvgOnly(qcm ? qcm.prompt : inst.rawStatement);
  let prompt = promptBase;
  let visual = '';
  let footer = inst.rawFooter;
  let html = '';

  if(qn===1 || qn===2){
    visual = squareCardSvg(String(s.n), String(s.n), correction ? c : '?');
  } else if(qn===3 || qn===4){
    visual = squareCardSvg(correction ? String(s.n) : '?', correction ? String(s.n) : '?', String(s.c));
  } else if(qn===5){
    visual = squareCardSvg(correction ? String(s.n) : '?', correction ? String(s.n) : '?', String(s.c));
  } else if(qn===6){
    visual = squareCardSvg(String(s.n), String(s.n), correction ? c : '?');
  } else if(qn===8){
    visual = squareCardSvg(String(s.n), String(s.n), correction ? c : String(s.n)+'²');
  } else if(qn===9){
    if(Number(s.mode)===2){
      visual = doubleSquareCalcSvg(String(s.n), correction ? c : String(s.n)+'²');
    } else {
      const opTxt = String(s.op||'');
      const kTxt = String(s.k||'');
      visual = `
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="230" viewBox="0 0 500 230" style="display:block;max-width:500px;margin:6px auto 0">
        <rect x="54" y="22" width="140" height="140" rx="2" fill="#eef6fb" stroke="#315b72" stroke-width="2.6"/>
        <text x="124" y="101" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" text-anchor="middle" fill="#17384d">${correction ? c : String(s.n)+'²'}</text>
        <text x="124" y="215" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#17384d">${s.n}</text>
        <text x="35" y="105" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#17384d">${s.n}</text>
        <text x="315" y="105" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" text-anchor="middle" fill="#17384d">${opTxt}${kTxt}</text>
      </svg>`;
    }
  } else if(qn===10){
    visual = squareCardSvg(String(s.n), String(s.n), correction ? c : String(s.n)+'²');
  }

  if(qcm){
    prompt = prompt + (visual ? '\n'+visual : '');
    html += '<div class="question">'+renderMathSegments(prompt)+'</div>';
    const corrects=new Set(inst.answers.map(x=>String(x)));
    html += '<div class="options options-'+qcm.opts.length+compactQcmClass(qcm.opts)+'">';
    qcm.opts.forEach((o,i)=>{ const isC=correction && corrects.has(String(i+1)); html+='<div class="opt '+(isC?'correct':'')+'"><strong>'+String.fromCharCode(65+i)+'.</strong> '+renderMathSegments(o)+'</div>'; });
    html += '</div>';
  } else {
    const whole = prompt + (visual ? '\n'+visual : '');
    html += '<div class="question">'+renderMathSegments(whole)+'</div>';
  }
  if(footer) html += '<div class="footer">'+renderPlaceholders(footer, inst.answers, correction?'correction':'question')+'</div>';
  return html;
}


function renderModule10(inst,correction=false,mode=null){
  // Les tuiles ne sont plus dessinées dans la question : elles vont dans le
  // panneau Aide (inst.aideHtml). La correction rédigée est dans
  // inst.correctionSteps, affichée par la coque commune.
  const d=inst.reduction;
  const isQcm=d.format==='qcm';
  let html='<div class="question reduction-prompt">'+d.prompt+'</div>';
  html+='<div class="reduction-expression">'+d.exprHtml+'</div>';
  if(isQcm){
    html+='<div class="options reduction-options options-'+d.qcmOptions.length+'">';
    d.qcmOptions.forEach((o,i)=>{
      const isC=correction&&String(i+1)===String(d.qcmCorrectIndex);
      html+='<div class="opt '+(isC?'correct':'')+'"><strong>'+String.fromCharCode(65+i)+'.</strong> <span class="reduction-option">'+o+'</span></div>';
    });
    html+='</div>';
  } else if(correction){
    html+='<div class="footer reduction-answer">= '+d.answer+'</div>';
  }
  return html;
}

function proportionVisualData(inst){
  if(!inst||!inst.q||!inst.scope) return null;
  const n=Number(inst.q.n),s=inst.scope;
  if(n===1) return {topLabel:'Nombre de cahiers',topShort:'Cahiers',topUnit:'cahier',bottomLabel:'Prix',bottomShort:'Prix',bottomUnit:'€',pairs:[{x:s.q1,y:s.p1},{x:s.q2,y:s.p2,unknownBottom:true}],method:{type:'horizontal',fromX:s.q1,toX:s.q2,top:'× '+s.m,bottom:'× '+s.m}};
  if(n===2) return {topLabel:'Masse',topShort:'Masse',topUnit:'kg',bottomLabel:'Prix',bottomShort:'Prix',bottomUnit:'€',pairs:[{x:3,y:s.p3},{x:5,y:s.p5},{x:8,y:s.p8,unknownBottom:true}],method:{type:'horizontal',fromX:3,toX:8,top:'+ 5',bottom:'+ '+s.p5}};
  if(n===3) return {topLabel:'Nombre de billets',topShort:'Billets',topUnit:'billet',bottomLabel:'Prix',bottomShort:'Prix',bottomUnit:'€',pairs:[{x:s.n,y:s.p},{x:1,y:s.u,unknownBottom:true}],method:{type:'vertical',label:'× '+s.u}};
  if(n===4) return {topLabel:'Masse de pommes',topShort:'Masse',topUnit:'kg',bottomLabel:'Prix',bottomShort:'Prix',bottomUnit:'€',pairs:[{x:s.q1,y:s.p1},{x:s.q2,y:s.p2,unknownBottom:true}],method:{type:'vertical',label:'× '+s.u}};
  if(n===5) return {topLabel:'Nombre d’objets',topShort:'Objets',topUnit:'objet',bottomLabel:'Prix',bottomShort:'Prix',bottomUnit:'€',pairs:[{x:s.q1,y:s.p1},{x:s.q2,y:s.p2,unknownTop:!!s.unknownTop,unknownBottom:!s.unknownTop}],method:{type:'vertical',label:'× '+s.u}};
  if(n===6) return {topLabel:'Longueur sur la carte',topShort:'Carte',topUnit:'cm',bottomLabel:'Distance réelle',bottomShort:'Réalité',bottomUnit:'km',pairs:[{x:s.c,y:s.d},{x:1,y:s.u,unknownBottom:true}],method:{type:'vertical',label:'× '+s.u}};
  if(n===7) return {topLabel:'Distance parcourue',topShort:'Distance',topUnit:'km',bottomLabel:'Carburant consommé',bottomShort:'Carburant',bottomUnit:'L',pairs:[{x:100,y:s.c},{x:s.d,y:s.r,unknownBottom:true}],method:{type:'horizontal',fromX:100,toX:s.d,top:'× '+s.m,bottom:'× '+s.m}};
  if(n===8) return {topLabel:'Nombre de personnes',topShort:'Personnes',topUnit:'personne',bottomLabel:'Quantité de sucre',bottomShort:'Sucre',bottomUnit:'g',pairs:[{x:4,y:s.q4},{x:s.n,y:s.qn,unknownBottom:true}],method:{type:'vertical',label:'× '+s.u}};
  if(n===9) return {topLabel:'Nombre d’articles',topShort:'Articles',topUnit:'article',bottomLabel:'Prix',bottomShort:'Prix',bottomUnit:'€',pairs:[{x:s.q1,y:s.p1},{x:s.q2,y:s.p2},{x:s.q3,y:s.p3,unknownBottom:true}],method:{type:'horizontal',fromX:s.q1,toX:s.q3,top:'+ '+s.q2,bottom:'+ '+s.p2}};
  if(n===11) return {topLabel:'Ligne du haut',topShort:'Ligne 1',topUnit:'',bottomLabel:'Ligne du bas',bottomShort:'Ligne 2',bottomUnit:'',pairs:[{x:s.x1,y:s.y1},{x:s.x2,y:s.y2,unknownTop:!!s.unknownTop,unknownBottom:!s.unknownTop}],method:{type:'vertical',label:'× '+s.k}};
  return null;
}
function proportionGcd(values){
  const ints=values.map(Number).filter(Number.isFinite).map(v=>Math.abs(Math.round(v)));
  if(!ints.length) return 1;
  const gcd2=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a||1;};
  return ints.reduce(gcd2)||1;
}
function proportionDoubleLineSvg(data,correction=false,compact=false){
  const W=compact?360:940,H=compact?240:250;
  const labelRight=compact?84:228,lineStart=compact?96:254,lineEnd=compact?346:918;
  const topY=compact?70:76,bottomY=compact?168:176;
  const labelFont=compact?11:16,unitFont=compact?10:14,valueFont=compact?14:21;
  const pairs=data.pairs.map(pair=>({...pair,x:Number(pair.x),y:Number(pair.y)})).filter(pair=>Number.isFinite(pair.x)&&Number.isFinite(pair.y));
  const maxX=Math.max(...pairs.map(pair=>pair.x),1);
  const pos=value=>lineStart+(lineEnd-lineStart)*(value/maxX);
  let step=proportionGcd(pairs.map(pair=>pair.x));
  if(maxX/step>10) step=maxX/10;
  const tickValues=[0];
  for(let value=step;value<maxX-1e-9;value+=step) tickValues.push(value);
  tickValues.push(maxX,...pairs.map(pair=>pair.x));
  const ticks=[...new Set(tickValues.map(value=>Number(value.toFixed(6))))].sort((a,b)=>a-b);
  const topColor='#e68c1e',bottomColor='#2861aa',topFill='#ffeedc',bottomFill='#e4eefb';
  const fullTop=compact?data.topShort:data.topLabel,fullBottom=compact?data.bottomShort:data.bottomLabel;
  const labelBox=(y,fill,stroke,label,unit)=>{const hasUnit=String(unit||'').length>0;return `<rect x="4" y="${y-37}" width="${labelRight-10}" height="74" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.7"/><text x="${(labelRight-6)/2}" y="${hasUnit?y-7:y+5}" font-family="Arial,Helvetica,sans-serif" font-size="${labelFont}" font-weight="800" text-anchor="middle" fill="${stroke}">${escapeHtml(label)}</text>${hasUnit?`<text x="${(labelRight-6)/2}" y="${y+17}" font-family="Arial,Helvetica,sans-serif" font-size="${unitFont}" font-weight="700" text-anchor="middle" fill="#4d5c72">${compact?'('+escapeHtml(unit)+')':'Unité : '+escapeHtml(unit)}</text>`:''}`;};
  const bands=`<rect x="${lineStart-10}" y="${topY-34}" width="${lineEnd-lineStart+16}" height="68" rx="10" fill="${topFill}"/><rect x="${lineStart-10}" y="${bottomY-34}" width="${lineEnd-lineStart+16}" height="68" rx="10" fill="${bottomFill}"/>`;
  const axes=`<line x1="${lineStart}" y1="${topY}" x2="${lineEnd}" y2="${topY}" stroke="${topColor}" stroke-width="3"/><polygon points="${lineEnd},${topY} ${lineEnd-10},${topY-6} ${lineEnd-10},${topY+6}" fill="${topColor}"/><line x1="${lineStart}" y1="${bottomY}" x2="${lineEnd}" y2="${bottomY}" stroke="${bottomColor}" stroke-width="3"/><polygon points="${lineEnd},${bottomY} ${lineEnd-10},${bottomY-6} ${lineEnd-10},${bottomY+6}" fill="${bottomColor}"/>`;
  const tickHtml=ticks.map(value=>{const x=pos(value);return `<line x1="${x}" y1="${topY-7}" x2="${x}" y2="${topY+7}" stroke="${topColor}" stroke-width="2"/><line x1="${x}" y1="${bottomY-7}" x2="${x}" y2="${bottomY+7}" stroke="${bottomColor}" stroke-width="2"/>`;}).join('');
  const zero=`<text x="${lineStart}" y="${topY-15}" font-family="Arial,Helvetica,sans-serif" font-size="${valueFont}" font-weight="800" text-anchor="middle" fill="#17283f">0</text><text x="${lineStart}" y="${bottomY+27}" font-family="Arial,Helvetica,sans-serif" font-size="${valueFont}" font-weight="800" text-anchor="middle" fill="#17283f">0</text>`;
  const pairHtml=pairs.map(pair=>{const x=pos(pair.x),unknownTop=pair.unknownTop&&!correction,unknownBottom=pair.unknownBottom&&!correction,unknown=unknownTop||unknownBottom;return `<line x1="${x}" y1="${topY+9}" x2="${x}" y2="${bottomY-9}" stroke="#34465d" stroke-width="${compact?1.7:2.2}" ${unknown?'stroke-dasharray="7 6"':''}/><text x="${x}" y="${topY-15}" font-family="Arial,Helvetica,sans-serif" font-size="${valueFont}" font-weight="850" text-anchor="middle" fill="${unknownTop?'#b45309':'#17283f'}">${unknownTop?'?':escapeHtml(fmt(pair.x))}</text><text x="${x}" y="${bottomY+27}" font-family="Arial,Helvetica,sans-serif" font-size="${valueFont}" font-weight="850" text-anchor="middle" fill="${unknownBottom?'#b45309':'#17283f'}">${unknownBottom?'?':escapeHtml(fmt(pair.y))}</text>`;}).join('');
  let methodHtml='';
  if(correction&&data.method){
    const methodFont=compact?12:17;
    const methods=[data.method];
    if(!methods.some(method=>method.type==='vertical')){
      const reference=pairs.find(pair=>pair.x!==0);
      if(reference) methods.push({type:'vertical',label:'× '+fmt(reference.y/reference.x)});
    }
    if(!methods.some(method=>method.type==='horizontal')){
      const target=pairs.find(pair=>pair.unknownTop||pair.unknownBottom)||pairs[pairs.length-1];
      const reference=pairs.find(pair=>pair!==target&&pair.x!==0);
      if(reference&&target){
        const factor=target.x/reference.x;
        const label=Math.abs(factor-Math.round(factor))<1e-9?'× '+fmt(factor):'× '+fmt(factor);
        methods.push({type:'horizontal',fromX:reference.x,toX:target.x,top:label,bottom:label});
      }
    }
    methods.forEach(method=>{
    if(method.type==='vertical'){
      const x=(labelRight-6)/2,y1=topY+39,y2=bottomY-39;
      methodHtml+=`<line x1="${x-22}" y1="${y1}" x2="${x-22}" y2="${y2-5}" stroke="#17283f" stroke-width="2"/><polygon points="${x-22},${y2} ${x-27},${y2-8} ${x-17},${y2-8}" fill="#17283f"/><text x="${x+14}" y="${(y1+y2)/2+5}" font-family="Arial,Helvetica,sans-serif" font-size="${methodFont}" font-weight="850" text-anchor="middle" fill="#17283f">${escapeHtml(method.label)}</text>`;
    }else if(method.type==='horizontal'){
      const xa=pos(method.fromX),xb=pos(method.toX),direction=xb>=xa?1:-1,start=xa+8*direction,end=xb-10*direction,mid=(xa+xb)/2;
      const arrow=(y,label)=>`<line x1="${start}" y1="${y}" x2="${end}" y2="${y}" stroke="#17283f" stroke-width="2"/><polygon points="${xb-3*direction},${y} ${xb-12*direction},${y-5} ${xb-12*direction},${y+5}" fill="#17283f"/><text x="${mid}" y="${y-10}" font-family="Arial,Helvetica,sans-serif" font-size="${methodFont}" font-weight="850" text-anchor="middle" fill="#17283f">${escapeHtml(label)}</text>`;
      methodHtml+=arrow(topY+33,method.top)+arrow(bottomY-25,method.bottom);
    }
    });
  }
  const klass=compact?'proportion-line-mobile':'proportion-line-desktop';
  return `<svg class="proportion-line ${klass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Double ligne graduée de proportionnalité">${bands}${labelBox(topY,topFill,topColor,fullTop,data.topUnit)}${labelBox(bottomY,bottomFill,bottomColor,fullBottom,data.bottomUnit)}${axes}${tickHtml}${zero}${pairHtml}${methodHtml}</svg>`;
}
function proportionTableMethods(inst){
  const n=Number(inst.q.n),s=inst.scope||{};
  if(n===2) return {vertical:'× '+fmt(s.u),horizontalTop:'+ 5',horizontalBottom:'+ '+fmt(s.p5)};
  if(n===5) return {vertical:'× '+fmt(s.u),horizontalTop:'× '+fmt(s.m),horizontalBottom:'× '+fmt(s.m)};
  if(n===11) return {vertical:'× '+fmt(s.k),horizontalTop:'× '+fmt(s.m),horizontalBottom:'× '+fmt(s.m)};
  return null;
}
function renderProportionModule(inst,correction=false,mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const qcm=splitQCM(inst.rawStatement),visual=proportionVisualData(inst);
  const visualHtml=visual&&!isWithoutVisuals(mode)?'<div class="proportion-help">'+proportionDoubleLineSvg(visual,correction,false)+proportionDoubleLineSvg(visual,correction,true)+'</div>':(visual?visualPlaceholder(mode):'');
  let html='',statement=inst.rawStatement;
  const tableMethods=proportionTableMethods(inst);
  if(correction&&tableMethods){
    statement=statement.replace('?', '<span class="proportion-table-answer">'+escapeHtml(inst.answers[0])+'</span>');
    statement=statement.replace('</table></div>','</table><div class="proportion-table-methods"><div class="proportion-table-method"><span class="proportion-table-down">↓</span><strong>'+escapeHtml(tableMethods.vertical)+'</strong></div><div class="proportion-table-method proportion-table-horizontal"><span>→ '+escapeHtml(tableMethods.horizontalTop)+'</span><span>→ '+escapeHtml(tableMethods.horizontalBottom)+'</span></div></div></div>');
  }
  const renderedQcm=splitQCM(statement);
  if(renderedQcm){
    html+='<div class="question proportion-prompt">'+renderMathSegments(renderedQcm.prompt)+'</div>'+visualHtml;
    const corrects=new Set(inst.answers.map(x=>String(x)));
    html+='<div class="options proportion-options options-'+renderedQcm.opts.length+compactQcmClass(renderedQcm.opts)+'">';
    renderedQcm.opts.forEach((option,index)=>{const isCorrect=correction&&corrects.has(String(index+1));html+='<div class="opt '+(isCorrect?'correct':'')+'"><strong>'+String.fromCharCode(65+index)+'.</strong> '+renderMathSegments(option)+'</div>';});
    html+='</div>';
  }else{
    html+='<div class="question proportion-prompt">'+renderMathSegments(statement)+'</div>'+visualHtml;
  }
  if(inst.rawFooter) html+='<div class="footer proportion-answer">'+renderPlaceholders(inst.rawFooter,inst.answers,correction?'correction':'question')+'</div>';
  return html;
}
function relativeInitialState(data){return {tokens:data.initialTokens.map(token=>({...token})),nextPair:1};}
function relativeSolutionState(data){
  const state=relativeInitialState(data);
  state.tokens.forEach(token=>{token.zone='result';});
  return state;
}
function relativeTokensBoardMarkup(data,state,correction=false){
  const visible=correction?relativeSolutionState(data):state;
  const instruction=correction?'Les jetons sont rassemblés. Les paires +1/−1 s’annulent.':'Rassemble les deux groupes dans la zone résultat. Les paires +1/−1 valent zéro.';
  const controls=correction?'':'<p class="relative-token-instruction">'+instruction+'</p><div class="relative-token-actions"><button type="button" class="relative-token-action" data-relative-action="reset">Recommencer</button></div>';
  return '<div class="relative-token-board" data-relative-board>'+relativeZoneMarkup('Premier nombre','a',visible.tokens)+relativeZoneMarkup('Deuxième nombre','b',visible.tokens)+relativeZoneMarkup('Résultat','result',visible.tokens)+controls+(correction?'<p class="relative-token-result">'+relativeExpression(data.a,data.b)+' = <strong>'+relativeDisplayNumber(data.result)+'</strong></p>':'')+'</div>';
}
function relativeZoneMarkup(label,zone,tokens){
  const paired=relativePairIndexes(tokens,zone),visible=tokens.filter(token=>token.zone===zone);
  const tokenHtml=visible.map(token=>relativeStaticToken(token,paired.has(tokens.indexOf(token)))).join('');
  return '<section class="relative-token-zone relative-token-zone-'+zone+'" data-relative-zone="'+zone+'"><h3>'+label+'</h3><div class="relative-token-list">'+(tokenHtml||'<span class="relative-token-empty">—</span>')+'</div></section>';
}
function renderRelativeTokensModule(inst,correction=false,mode=null){
  if(mode===null)mode=document.getElementById('visualMode').value;
  const data=inst.relativeTokens;
  const prompt='<div class="question relative-token-prompt">Calcule <strong>'+relativeExpression(data.a,data.b)+'</strong> en manipulant les jetons.</div>';
  if(mode==='without-reveal'&&!correction)return prompt+'<div class="visual-placeholder relative-token-placeholder"><button class="btn" onclick="revealVisual()">Afficher l’aide</button></div>';
  return prompt+relativeTokensBoardMarkup(data,relativeInitialState(data),correction);
}
function renderQuestion(inst, correction=false, mode=null){
  if(mode===null) mode=document.getElementById('visualMode').value;
  const runtime=globalThis.MATHSGO_MODULE_RUNTIME&&globalThis.MATHSGO_MODULE_RUNTIME.get(inst&&inst.module&&inst.module.id);
  if(runtime&&runtime.renderer&&typeof runtime.renderer.renderQuestion==='function'
    &&(!runtime.renderer.supports||runtime.renderer.supports({instance:inst,correction,mode}))){
    return runtime.renderer.renderQuestion({
      instance:inst,correction,mode,renderGenericQuestion,format:fmt,escapeHtml,
      renderPlaceholders,renderMathSegments,compactQcmClass,isWithoutVisuals,
      visualPlaceholder,placeValueToolHtml
    });
  }
  if(inst && inst.module && inst.module.id==='dnb_01') return renderModule01(inst, correction, mode);
  if(inst && inst.module && ['dnb_03','dnb_03b'].includes(inst.module.id)) return renderFractionOpsModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_04') return renderModule04(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_05') return renderMultipleFormsModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_06') return renderScientificModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_09') return renderModule09(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_10') return renderModule10(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_11') return renderSubstitutionModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_13') return renderEquationModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_18') return renderAngleSumModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_19') return renderConversionModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_20') return renderSolidsModule(inst, correction);
  if(inst && inst.module && inst.module.id==='dnb_21') return renderPerimeterModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_22') return renderAreaModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_23') return renderVolumeModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_24') return renderPythagorasModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_24b') return globalThis.pythagorasBuilder(inst.pythagorasTactile,correction);
  if(inst && inst.module && inst.module.id==='dnb_25') return renderThalesModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_30') return renderAverageModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_34') return renderProportionModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_35') return renderEvolutionModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_38'&&inst.relativeTokens&&inst.relativeTokens.interactive) return renderRelativeTokensModule(inst, correction, mode);
  if(inst && inst.module && inst.module.id==='dnb_07'){
    return renderModule07(inst, correction, mode);
  }
  return renderGenericQuestion(inst, correction, mode);
}
// La progression de 5e est volontairement définie question par question :
// certains modules contiennent aussi des notions qui n'arrivent qu'en 4e.
// La 4e consolide jusqu'aux factorisations simples ; la 3e ouvre toute la
// banque, tandis que le filtre DNB reste volontairement plus classique.
const LEVEL_5E_QUESTIONS={
  dnb_01:'all',
  // dnb_02 : en 5e, comparer, ranger, encadrer et calculer sans problème rédigé.
  dnb_02:[1,3,4,7,8,9,10,11,13,15],
  dnb_02b:'all',
  dnb_03:[1,3,5,6,7],
  dnb_04:'all',
  dnb_05:'all',
  dnb_07:'all',
  dnb_08:'all',
  dnb_09:[2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19],
  dnb_10:[1,2,6,10],
  dnb_11:[1,4,6,11],
  dnb_12:[1,2,3,4,5,6,7,9,10,11,12,13,14],
  dnb_13:[1,2,3],
  dnb_14:'all',
  dnb_15:'all',
  dnb_16:'all',
  dnb_17:'all',
  dnb_18:'all',
  dnb_19:[1,2,6,7,8,10],
  dnb_20:'all',
  dnb_21:'all',
  dnb_22:'all',
  dnb_23:'all',
  dnb_27:[1,2,3,4,5,7,8,11,12,13],
  // dnb_28 : la pièce et le dé (type 7, deux épreuves) est un attendu de 3e.
  dnb_28:[1,2,3,4,5,6,8,9,10,11],
  dnb_29:'all',
  dnb_30:'all',
  dnb_32:'all',
  dnb_33:[1,2,3,4,8,9,10],
  dnb_34:'all',
  dnb_37:'all',
  dnb_38:'all',
  dnb_39:'all'
};

const LEVEL_4E_QUESTIONS={
  dnb_02:[1,3,4,7,8,9,10,11,13,15,16,17,18],
  // dnb_06 : les calculs avec des puissances de 10 (types 14 et 15, sujets de
  // référence 2027) restent en 3e.
  dnb_06:[1,2,3,4,5,6,7,8,9,10,11,12,13],
  // dnb_10 : l’opposé d’une parenthèse (type 8) est un automatisme de 3e.
  dnb_10:[1,2,3,4,6,7,9,10,11],
  dnb_12:Array.from({length:18},(_,index)=>index+1),
  dnb_28:[1,2,3,4,5,6,8,9,10,11],
  // dnb_31 : l’étendue (type 11) et la médiane lue sur un diagramme (type 14) sont des attendus de 3e.
  dnb_31:[2,3,4,6,8,13],
  // dnb_35 : le coefficient multiplicateur (types 5 à 8) est une notion de 3e.
  dnb_35:[1,2,3,4,10,11]
};

// Le filtre DNB reste volontairement classique : calculs directs et QCM
// courts sur la distributivité simple, sans manipulation ni identité remarquable.
const LEVEL_DNB_QUESTIONS={
  // dnb_01 : le vrai/faux (type 11) n'est pas une forme du DNB général.
  dnb_01:[1,2,3,4,5,6,9,10,13,15,16,17,19,21,22,23],
  // dnb_02 : l'encadrement entre deux entiers (type 4) reste en 5e-4e.
  dnb_02:[1,3,7,8,9,10,11,13,14,15,16,17,18],
  // dnb_03 : les types 3, 5 et 6 (même dénominateur ou même numérateur)
  // restent un échauffement de 5e-4e ; le niveau DNB garde les formes du brevet.
  dnb_03:[1,2,4,7,8,9,10,11,12],
  dnb_10:[1,2,3,4,6,7,8,9,10,11],
  dnb_12:[1,2,3,4,5,6,7,8,9,15,16,17],
  // dnb_28 : deux épreuves (type 7) jamais posées dans les automatismes 2026.
  dnb_28:[1,2,3,4,5,6,8,9,10,11],
  // dnb_31 : jamais de nombre pair de valeurs au brevet 2026 (type 3 : programme de 4e).
  dnb_31:[2,4,6,8,11,13,14]
};

// Pendant la transition des programmes, ces contenus sont déjà travaillés
// avant la 3e. Le filtre de 5e ci-dessus reste plus précis, question par question.
['dnb_27','dnb_36'].forEach(id=>{
  const module=RAW_MODULES.find(item=>item.id===id);
  if(module&&!module.level_tags.includes('4e')) module.level_tags.unshift('4e');
});
function questionEligibleForLevel(m,q,level){
  const catalogue=level==='5e'?LEVEL_5E_QUESTIONS:(level==='4e'?LEVEL_4E_QUESTIONS:(level==='DNB'?LEVEL_DNB_QUESTIONS:null));
  if(!catalogue||!Object.prototype.hasOwnProperty.call(catalogue,m.id)) return true;
  const allowed=catalogue[m.id];
  return allowed==='all' || (Array.isArray(allowed) && allowed.includes(Number(q.n)));
}
function visibleModules(){
  const level=document.getElementById('level').value;
  const interactive=document.getElementById('experienceMode').value==='interactive';
  const supportFilter=module=>!module.interactive_only||interactive;
  if(level==='5e') return RAW_MODULES.filter(m=>supportFilter(m)&&Object.prototype.hasOwnProperty.call(LEVEL_5E_QUESTIONS,m.id));
  return RAW_MODULES.filter(m=>supportFilter(m)&&(level==='all' || m.level_tags.includes(level) || (level==='3e' && m.level_tags.includes('DNB'))) );
}
const MODULE_DOMAINS=[
  {id:'numbers',title:'Nombres et calculs'},
  {id:'geometry',title:'Espace et géométrie'},
  {id:'data',title:'Données, statistiques et probabilités'},
  {id:'algorithm',title:'Pensée informatique'}
];
const MODULE_MENU_GROUPS={
  numbers:[
    {id:'numeration',title:'Numération',moduleIds:['dnb_02','dnb_02b','dnb_14']},
    {id:'entiers-divisibilite',title:'Nombres entiers et divisibilité',moduleIds:['dnb_08','dnb_09']},
    {id:'fractions',title:'Fractions et nombres rationnels',moduleIds:['dnb_01','dnb_03','dnb_03b','dnb_04','dnb_05']},
    {id:'relatifs',title:'Nombres relatifs',moduleIds:['dnb_38','dnb_39']},
    {id:'puissances',title:'Puissances',moduleIds:['dnb_07','dnb_06']},
    {id:'algebre',title:'Calcul littéral et algèbre',moduleIds:['dnb_10','dnb_11','dnb_12','dnb_13']}
  ],
  geometry:[
    {id:'reperage',title:'Repérage',moduleIds:['dnb_15']},
    {id:'transformations',title:'Transformations',moduleIds:['dnb_27']},
    {id:'angles-triangles',title:'Angles et triangles',moduleIds:['dnb_16','dnb_17','dnb_18']},
    {id:'theoremes-trigonometrie',title:'Pythagore, Thalès et trigonométrie',moduleIds:['dnb_24','dnb_25','dnb_26','dnb_26b']},
    {id:'manipuler-telephone',title:'Manipuler sur téléphone',moduleIds:['dnb_24b']},
    {id:'mesures',title:'Conversions, aires et périmètres',moduleIds:['dnb_19','dnb_21','dnb_22']},
    {id:'espace',title:'Espace, solides et patrons',moduleIds:['dnb_20','dnb_23']}
  ],
  data:[
    {id:'statistiques',title:'Statistiques et moyennes',moduleIds:['dnb_32','dnb_29','dnb_30','dnb_31']},
    {id:'probabilites',title:'Probabilités',moduleIds:['dnb_28']},
    {id:'proportionnalite',title:'Proportionnalité, ratios et pourcentages',moduleIds:['dnb_33','dnb_34','dnb_35']},
    {id:'fonctions',title:'Fonctions',moduleIds:['dnb_36']}
  ],
  algorithm:[
    {id:'pensee-informatique',title:'Pensée informatique',moduleIds:['dnb_37']}
  ]
};
const MODULE_SELECTION_MEMORY=new Set();
let skipSelectionCaptureOnce=false;
function rememberCurrentModuleSelections(){
  document.querySelectorAll('.modcb').forEach(input=>{
    if(input.checked) MODULE_SELECTION_MEMORY.add(input.value);
    else MODULE_SELECTION_MEMORY.delete(input.value);
  });
}
function replaceRememberedModuleSelections(ids){
  MODULE_SELECTION_MEMORY.clear();
  ids.forEach(id=>MODULE_SELECTION_MEMORY.add(id));
  skipSelectionCaptureOnce=true;
}
function menuGroupsForTheme(themeId,members){
  const memberById=new Map(members.map(module=>[module.id,module]));
  const used=new Set();
  const groups=(MODULE_MENU_GROUPS[themeId]||[]).map(group=>{
    const groupMembers=group.moduleIds.map(id=>memberById.get(id)).filter(Boolean);
    groupMembers.forEach(module=>used.add(module.id));
    return {...group,members:groupMembers};
  }).filter(group=>group.members.length);
  const ungrouped=members.filter(module=>!used.has(module.id));
  if(ungrouped.length) groups.push({id:'autres',title:'Autres automatismes',members:ungrouped});
  return groups;
}
function updateThemeCounts(){
  document.querySelectorAll('.theme-group').forEach(group=>{
    const boxes=[...group.querySelectorAll('.modcb')];
    const checked=boxes.filter(cb=>cb.checked).length;
    const badge=group.querySelector('.theme-count');
    const master=group.querySelector('.theme-select-cb');
    if(master){
      master.checked=boxes.length>0&&checked===boxes.length;
      master.indeterminate=checked>0&&checked<boxes.length;
    }
    group.classList.toggle('has-selection',checked>0);
    group.classList.toggle('is-complete',boxes.length>0&&checked===boxes.length);
    if(badge){
      badge.innerHTML='<span class="theme-count-value">'+checked+' / '+boxes.length+'</span><span class="theme-count-label"> sélectionné'+(checked===1?'':'s')+'</span>';
      badge.setAttribute('aria-label',checked+' module'+(checked===1?'':'s')+' sélectionné'+(checked===1?'':'s')+' sur '+boxes.length);
    }
  });
  if(typeof updateSetupActions==='function') updateSetupActions();
}
function renderModuleList(){
  const box=document.getElementById('modules');
  const openTheme=box.querySelector('.theme-group[open]')?.dataset.theme||null;
  if(skipSelectionCaptureOnce) skipSelectionCaptureOnce=false;
  else rememberCurrentModuleSelections();
  // Les catégories sont reconstruites à chaque changement de réglage. L'icône
  // doit donc faire partie de ce rendu, et non être ajoutée après coup.
  const getThemeIconMarkup=globalThis.MATHSGO_SETUP_ICONS?.markup;
  box.innerHTML='';
  const modules=visibleModules();
  MODULE_DOMAINS.forEach(theme=>{
    const members=modules.filter(module=>module.domain===theme.id);
    if(!members.length) return;
    const group=document.createElement('details');
    group.className='theme-group';
    group.dataset.theme=theme.id;
    group.open=theme.id===openTheme;
    const summary=document.createElement('summary');
    summary.className='theme-summary';
    const iconMarkup=typeof getThemeIconMarkup==='function'?getThemeIconMarkup(theme.id):'';
    summary.innerHTML='<span class="theme-icon" aria-hidden="true">'+iconMarkup+'</span><span class="theme-name">'+theme.title+'</span><span class="theme-count"></span><span class="theme-chevron" aria-hidden="true"></span>';
    const items=document.createElement('div');
    items.className='theme-items';
    const itemsToolbar=document.createElement('div');
    itemsToolbar.className='theme-items-toolbar';
    itemsToolbar.innerHTML='<label class="theme-select-all"><input class="theme-select-cb" type="checkbox" aria-label="Tout sélectionner dans '+theme.title+'"><span>Tout sélectionner dans ce domaine</span></label>';
    items.appendChild(itemsToolbar);
    menuGroupsForTheme(theme.id,members).forEach(menuGroup=>{
      const subgroup=document.createElement('section');
      subgroup.className='module-subgroup';
      subgroup.dataset.subgroup=menuGroup.id;
      const heading=document.createElement('h3');
      heading.className='module-subgroup-title';
      heading.textContent=menuGroup.title;
      const subgroupItems=document.createElement('div');
      subgroupItems.className='module-subgroup-items';
      menuGroup.members.forEach(m=>{
        const row=document.createElement('label'); row.className='modrow';
        row.innerHTML='<input type="checkbox" class="modcb" value="'+m.id+'"> <span><strong>'+m.title+'</strong></span>';
        const input=row.querySelector('input');
        input.checked=MODULE_SELECTION_MEMORY.has(m.id);
        input.addEventListener('change',()=>{
          if(input.checked) MODULE_SELECTION_MEMORY.add(input.value);
          else MODULE_SELECTION_MEMORY.delete(input.value);
          updateThemeCounts();
        });
        subgroupItems.appendChild(row);
      });
      subgroup.append(heading,subgroupItems);
      items.appendChild(subgroup);
    });
    group.append(summary,items);
    const themeCheckbox=itemsToolbar.querySelector('.theme-select-cb');
    themeCheckbox.addEventListener('change',()=>{
      group.querySelectorAll('.modcb').forEach(cb=>{
        cb.checked=themeCheckbox.checked;
        if(cb.checked) MODULE_SELECTION_MEMORY.add(cb.value);
        else MODULE_SELECTION_MEMORY.delete(cb.value);
      });
      updateThemeCounts();
    });
    group.addEventListener('toggle',()=>{
      if(group.open) box.querySelectorAll('.theme-group[open]').forEach(other=>{if(other!==group) other.open=false;});
    });
    box.appendChild(group);
  });
  updateThemeCounts();
}
function selectVisible(on){
  document.querySelectorAll('.modcb').forEach(cb=>{
    cb.checked=on;
    if(on) MODULE_SELECTION_MEMORY.add(cb.value);
    else MODULE_SELECTION_MEMORY.delete(cb.value);
  });
  updateThemeCounts();
}

function buildCleanSlideHtml(inst, correction=false, mode=null){
  return renderQuestion(inst, correction, mode);
}
