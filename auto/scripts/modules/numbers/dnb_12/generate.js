(function registerExpandFactorGenerator(global){
  function gcd(a,b){
    a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));
    while(b){const remainder=a%b;a=b;b=remainder;}
    return a||1;
  }

  function coprimePair(randomInt,min=2,max=6){
    let left,right;
    do{left=randomInt(min,max);right=randomInt(min,max,[left]);}while(gcd(left,right)!==1);
    return [left,right];
  }

  function term(coefficient,power,{leading=false,html=false}={}){
    coefficient=Number(coefficient);power=Number(power)||0;
    if(coefficient===0)return '';
    const negative=coefficient<0,absolute=Math.abs(coefficient);
    const variable=power===2?(html?'x<sup>2</sup>':'x^2'):(power===1?'x':'');
    const magnitude=variable?(absolute===1?variable:absolute+variable):String(absolute);
    if(leading)return (negative?'−':'')+magnitude;
    return (negative?' − ':' + ')+magnitude;
  }

  function polynomial(coefficients,{html=false}={}){
    const entries=[[coefficients.x2,2],[coefficients.x,1],[coefficients.u,0]].filter(([value])=>Number(value)!==0);
    if(!entries.length)return '0';
    return entries.map(([value,power],index)=>term(value,power,{leading:index===0,html})).join('');
  }

  function compact(value){return String(value).replace(/\s+/g,'').replaceAll('−','-').replace(/<sup>2<\/sup>/g,'^2');}
  function expressionAnswer(display,alternatives=[]){
    const choices=[compact(display),...alternatives.map(compact)];
    return {answers:[choices[0]],answerChoices:[choices]};
  }
  function qcmAnswer(options,shuffle){
    const shuffled=shuffle(options),correctIndex=shuffled.findIndex(option=>option.errorCode==='correct')+1;
    return {options:shuffled,correctIndex,answers:[String(correctIndex)],answerChoices:[[String(correctIndex)]]};
  }
  function manipulationAnswer(expected){
    return {answers:expected.map(String),answerChoices:expected.map(value=>[String(value)])};
  }
  function polynomialResponse(coefficients,terms=['x2','x','u'],diagnostics=[]){
    const values={x2:coefficients.x2??0,x:coefficients.x??0,u:coefficients.u??0};
    return {
      layout:'polynomial',
      slots:terms.map((term,index)=>({term,label:term==='x2'?'Coefficient de x carré':(term==='x'?'Coefficient de x':'Constante'),diagnostic:diagnostics[index]||''})),
      acceptedCombinations:[terms.map(term=>String(values[term]))]
    };
  }
  function templateResponse(slots,segments,accepted,diagnostics=[]){
    return {
      layout:'algebra-template',segments,
      slots:slots.map((label,index)=>({label,diagnostic:diagnostics[index]||''})),
      acceptedCombinations:[accepted.map(String)]
    };
  }
  function base(module,question,data,answer){
    return {module,q:question,scope:data.scope||{},...answer,rawStatement:'',rawFooter:'',hasSvg:true,expandFactor:data};
  }
  function area(rows,columns,answer,extra={}){
    return {style:'table',compact:true,rows,columns,answer,...extra};
  }
  function constant(value){return {coefficient:value,power:0};}
  function variable(value=1){return {coefficient:value,power:1};}

  function structure(module,question,randomInt,shuffle){
    const k=randomInt(2,6),a=randomInt(2,9),isProduct=randomInt(0,1)===1;
    const expression=isProduct?`${k}(x + ${a})`:`${k}x + ${a}`;
    const correct=isProduct?'Un produit':'Une somme';
    const qcm=qcmAnswer([
      {html:correct,errorCode:'correct'},
      {html:isProduct?'Une somme':'Un produit',errorCode:'outer-operation-confusion'},
      {html:'Une différence',errorCode:'operation-by-visible-sign'},
      {html:'Un quotient',errorCode:'operation-vocabulary'}
    ],shuffle);
    return base(module,question,{
      kind:'structure',prompt:'Quelle est la nature de cette expression&nbsp;?',expression,qcm,
      explanation:`L’opération effectuée en dernier est ${isProduct?'la multiplication par '+k:'l’addition'}. L’expression est donc ${correct.toLowerCase()}.`,
      steps:[['Observer','Repérer l’opération qui organise toute l’expression.'],['Conclure',correct+'.']]
    },qcm);
  }

  function trueFalse(module,question,randomInt,shuffle){
    const k=randomInt(2,6),a=randomInt(2,9),p=k*a,isTrue=randomInt(0,2)===0;
    const right=isTrue?`${k}x + ${p}`:`${k}x + ${a}`;
    const qcm=qcmAnswer([
      {html:isTrue?'Vrai':'Faux',errorCode:'correct'},
      {html:isTrue?'Faux':'Vrai',errorCode:isTrue?'reject-correct-distribution':'forget-second-product'}
    ],shuffle);
    return base(module,question,{
      kind:'true-false',prompt:'Cette égalité est-elle vraie pour toute valeur de x&nbsp;?',expression:`${k}(x + ${a}) = ${right}`,qcm,
      explanation:`Le facteur ${k} multiplie x mais aussi ${a}&nbsp;: ${k} × ${a} = ${p}.`,
      areaModel:area([constant(k)],[variable(),constant(a)],`${k}(x + ${a}) = ${k}x + ${p}`),
      steps:[['Distribuer',`${k} × x = ${k}x et ${k} × ${a} = ${p}.`],['Comparer',`Le développement correct est ${k}x + ${p}.`]]
    },qcm);
  }

  function partialProducts(module,question,randomInt,shuffle){
    const k=randomInt(2,6),a=randomInt(2,9),p=k*a,expected=[`${k}x`,String(p)],cards=shuffle(expected);
    const answer=manipulationAnswer(expected);
    return base(module,question,{
      kind:'partial-products',prompt:'Place les deux produits partiels dans le modèle d’aire.',expression:`${k}(x + ${a})`,answerDisplay:`${k}x + ${p}`,
      areaModel:area([constant(k)],[variable(),constant(a)],`${k}(x + ${a}) = ${k}x + ${p}`,{interactive:true,cellLabels:expected}),
      manipulation:{cards,expected,slotLabels:['Produit avec x','Produit avec '+a],instruction:'Place les deux produits partiels'},
      explanation:`Les deux cases contiennent ${k} × x puis ${k} × ${a}.`,
      steps:[['Première case',`${k} × x = ${k}x.`],['Deuxième case',`${k} × ${a} = ${p}.`],['Résultat',`${k}x + ${p}.`]]
    },answer);
  }

  function chooseCommonFactor(module,question,randomInt,shuffle){
    const k=randomInt(2,6),[b,c]=coprimePair(randomInt),left=k*b,right=k*c;
    const candidates=[
      {html:String(k),errorCode:'correct'},
      {html:String(left),errorCode:'use-first-coefficient'},
      {html:String(b),errorCode:'use-first-quotient'},
      {html:'1',errorCode:'trivial-factor'}
    ];
    const unique=[];
    for(const option of candidates){if(!unique.some(existing=>existing.html===option.html))unique.push(option);}
    for(let value=2;unique.length<4;value++){if(value!==k&&!unique.some(option=>option.html===String(value)))unique.push({html:String(value),errorCode:'non-common-divisor'});}
    const qcm=qcmAnswer(unique,shuffle);
    return base(module,question,{
      kind:'choose-common-factor',prompt:'Quel est le plus grand facteur commun aux deux termes&nbsp;?',expression:`${left}x + ${right}`,qcm,
      areaModel:area([constant(k)],[variable(b),constant(c)],`${left}x + ${right} = ${k}(${b}x + ${c})`,{mode:'factorize',revealFactorInQuestion:false}),
      explanation:`${left} = ${k} × ${b} et ${right} = ${k} × ${c}. Comme ${b} et ${c} sont premiers entre eux, ${k} est le plus grand facteur commun.`,
      steps:[['Décomposer',`${left} = ${k} × ${b} et ${right} = ${k} × ${c}.`],['Facteur commun',String(k)+'.']]
    },qcm);
  }

  function negativeFactor(module,question,randomInt){
    const k=randomInt(2,5),a=randomInt(2,8),p=k*a,display=`−${k}x − ${p}`;
    const answer=expressionAnswer(display);
    return base(module,question,{
      kind:'negative-factor',prompt:'Développe puis réduis cette expression.',expression:`−${k}(x + ${a})`,answerDisplay:display,
      response:polynomialResponse({x:-k,u:-p},['x','u'],['Le coefficient de x est le produit de −'+k+' par 1.','Le terme constant est le produit de −'+k+' par '+a+'.']),
      areaModel:area([constant(-k)],[variable(),constant(a)],`−${k}(x + ${a}) = −${k}x − ${p}`),
      explanation:'Un facteur négatif donne ici deux produits négatifs.',
      steps:[['Premier produit',`−${k} × x = −${k}x.`],['Second produit',`−${k} × ${a} = −${p}.`],['Résultat',display+'.']]
    },answer);
  }

  function developReduce(module,question,randomInt){
    const k=randomInt(2,5),a=randomInt(2,8),b=randomInt(1,5),xCoefficient=k+b,p=k*a,display=`${xCoefficient}x + ${p}`;
    const answer=expressionAnswer(display,[`${p}+${xCoefficient}x`]);
    return base(module,question,{
      kind:'develop-reduce',prompt:'Développe puis réduis cette expression.',expression:`${k}(x + ${a}) + ${b}x`,answerDisplay:display,
      response:polynomialResponse({x:xCoefficient,u:p},['x','u'],['Développe d’abord, puis additionne seulement les coefficients de x.','Le terme constant vient du produit '+k+' × '+a+'.']),
      areaModel:area([constant(k)],[variable(),constant(a)],`${k}(x + ${a}) = ${k}x + ${p}`),
      explanation:`Après le développement, ${k}x et ${b}x sont des termes semblables.`,
      steps:[['Développer',`${k}(x + ${a}) = ${k}x + ${p}.`],['Regrouper',`${k}x + ${b}x = ${xCoefficient}x.`],['Résultat',display+'.']]
    },answer);
  }

  function factorDifference(module,question,randomInt){
    const k=randomInt(2,6),[b,c]=coprimePair(randomInt),left=k*b,right=k*c,display=`${k}(${b}x − ${c})`;
    const answer=expressionAnswer(display,[`${k}(−${c}+${b}x)`]);
    return base(module,question,{
      kind:'factor-difference',prompt:'Factorise au maximum cette expression.',expression:`${left}x − ${right}`,answerDisplay:display,
      response:templateResponse(['Facteur commun','Coefficient de x dans la parenthèse','Terme constant dans la parenthèse'],[{slot:0},{text:'('},{slot:1},{text:'x − '},{slot:2},{text:')'}],[k,b,c],[`Cherche le plus grand nombre qui divise ${left} et ${right}.`,`Calcule ${left} ÷ le facteur commun.`,`Calcule ${right} ÷ le facteur commun ; le signe moins est déjà écrit.`]),
      areaModel:area([constant(k)],[variable(b),constant(-c)],`${left}x − ${right} = ${k}(${b}x − ${c})`,{mode:'factorize',revealFactorInQuestion:false}),
      explanation:`${k} divise les deux coefficients et les quotients ${b} et ${c} n’ont plus de facteur commun.`,
      steps:[['Facteur commun',`Le PGCD de ${left} et ${right} est ${k}.`],['Diviser',`${left}x ÷ ${k} = ${b}x et −${right} ÷ ${k} = −${c}.`],['Résultat',display+'.']]
    },answer);
  }

  function rebuildDimensions(module,question,randomInt,shuffle){
    const k=randomInt(2,6),[b,c]=coprimePair(randomInt),left=k*b,right=k*c,expected=[`${b}x`,String(c)],cards=shuffle(expected);
    const answer=manipulationAnswer(expected);
    return base(module,question,{
      kind:'rebuild-dimensions',prompt:'Le facteur commun est déjà placé. Retrouve les deux autres dimensions.',expression:`${left}x + ${right}`,answerDisplay:`${k}(${b}x + ${c})`,
      areaModel:area([constant(k)],[variable(b),constant(c)],`${left}x + ${right} = ${k}(${b}x + ${c})`,{mode:'factorize',interactiveHeaders:true,revealFactorInQuestion:true,cellLabels:[`${left}x`,String(right)]}),
      manipulation:{cards,expected,slotLabels:['Premier quotient','Second quotient'],instruction:'Place les deux dimensions manquantes'},
      explanation:'Chaque dimension manquante s’obtient en divisant l’aire de la case par le facteur commun.',
      steps:[['Première dimension',`${left}x ÷ ${k} = ${b}x.`],['Deuxième dimension',`${right} ÷ ${k} = ${c}.`],['Résultat',`${k}(${b}x + ${c}).`]]
    },answer);
  }

  function doubleData(randomInt,kind){
    if(kind==='double-positive'){
      const a=randomInt(2,6),b=randomInt(2,6,[a]);
      return {rows:[variable(),constant(a)],columns:[variable(),constant(b)],expression:`(x + ${a})(x + ${b})`,coefficients:{x2:1,x:a+b,u:a*b}};
    }
    if(kind==='double-coefficients'){
      const a=randomInt(2,3),b=randomInt(1,5),c=randomInt(2,3),d=randomInt(1,5,[b]);
      return {rows:[variable(a),constant(b)],columns:[variable(c),constant(d)],expression:`(${a}x + ${b})(${c}x + ${d})`,coefficients:{x2:a*c,x:a*d+b*c,u:b*d}};
    }
    const a=randomInt(2,6),b=randomInt(2,6,[a]);
    return {rows:[variable(),constant(-a)],columns:[variable(),constant(b)],expression:`(x − ${a})(x + ${b})`,coefficients:{x2:1,x:b-a,u:-a*b}};
  }

  function doubleDirect(module,question,randomInt,kind){
    const data=doubleData(randomInt,kind),display=polynomial(data.coefficients),answer=expressionAnswer(display);
    const products=data.rows.flatMap(row=>data.columns.map(column=>polynomial({x2:row.coefficient*column.coefficient*((row.power+column.power)===2?1:0),x:row.coefficient*column.coefficient*((row.power+column.power)===1?1:0),u:row.coefficient*column.coefficient*((row.power+column.power)===0?1:0)}).replace('x^2','x²')));
    return base(module,question,{
      kind,prompt:'Développe puis réduis cette expression.',expression:data.expression,answerDisplay:display,
      response:polynomialResponse(data.coefficients,['x2','x','u'],['Calcule le produit des deux termes en x.','Additionne les deux produits croisés en x.','Calcule le produit des deux constantes.']),
      areaModel:area(data.rows,data.columns,`${data.expression} = ${display}`,{cellLabels:products}),
      explanation:'Les quatre produits partiels sont calculés, puis les deux termes en x sont regroupés.',
      steps:[['Quatre produits',products.join(' ; ')+'.'],['Réduire',`Les termes en x donnent ${data.coefficients.x}x.`],['Résultat',display+'.']]
    },answer);
  }

  function doubleProducts(module,question,randomInt,shuffle){
    const data=doubleData(randomInt,'double-positive'),a=data.rows[1].coefficient,b=data.columns[1].coefficient;
    const expected=['x²',`${b}x`,`${a}x`,String(a*b)],cards=shuffle(expected),display=polynomial(data.coefficients),answer=manipulationAnswer(expected);
    return base(module,question,{
      kind:'double-products',prompt:'Place les quatre produits partiels dans le modèle d’aire.',expression:data.expression,answerDisplay:display,
      areaModel:area(data.rows,data.columns,`${data.expression} = ${display}`,{interactive:true,cellLabels:expected}),
      manipulation:{cards,expected,slotLabels:['x × x','x × '+b,a+' × x',a+' × '+b],instruction:'Place les quatre produits partiels'},
      explanation:'Chaque case est le produit de son en-tête de ligne par son en-tête de colonne.',
      steps:[['Ligne x',`x × x = x² et x × ${b} = ${b}x.`],['Ligne '+a,`${a} × x = ${a}x et ${a} × ${b} = ${a*b}.`],['Réduire',display+'.']]
    },answer);
  }

  function apparentFactor(module,question,randomInt,withX=false){
    const a=randomInt(2,5),b=randomInt(1,6),c=randomInt(2,6,[a]);
    const left=withX?`${a}x(x + ${b}) + ${c}(x + ${b})`:`${a}(x + ${b}) + ${c}(x + ${b})`;
    const display=withX?`(${a}x + ${c})(x + ${b})`:`${a+c}(x + ${b})`;
    const answer=expressionAnswer(display,withX?[`(x+${b})(${a}x+${c})`]:[`(x+${b})(${a+c})`]);
    return base(module,question,{
      kind:withX?'apparent-factor-x':'apparent-factor',prompt:'Factorise en utilisant le facteur apparent.',expression:left,answerDisplay:display,
      response:withX
        ?templateResponse(['Coefficient de x dans le premier facteur','Constante dans le premier facteur'],[{text:'('},{slot:0},{text:'x + '},{slot:1},{text:`)(x + ${b})`}],[a,c],[`Après avoir sorti (x + ${b}), le premier quotient est ${a}x.`,`Après avoir sorti (x + ${b}), le second quotient est ${c}.`])
        :templateResponse(['Somme des deux coefficients'],[{slot:0},{text:`(x + ${b})`}],[a+c],[`Le facteur (x + ${b}) reste inchangé ; additionne ${a} et ${c}.`]),
      explanation:`Le facteur (x + ${b}) est écrit dans les deux termes.`,
      steps:[['Repérer',`Le facteur commun est (x + ${b}).`],['Quotients',withX?`${a}x et ${c}.`:`${a} et ${c}.`],['Résultat',display+'.']]
    },answer);
  }

  function identityRecognition(module,question,randomInt,shuffle){
    const a=randomInt(2,7),identity=randomInt(0,2);
    const expressions=[`x<sup>2</sup> + ${2*a}x + ${a*a}`,`x<sup>2</sup> − ${2*a}x + ${a*a}`,`x<sup>2</sup> − ${a*a}`];
    const correct=[`(x + ${a})<sup>2</sup>`,`(x − ${a})<sup>2</sup>`,`(x − ${a})(x + ${a})`][identity];
    const options=identity===0?[
      {html:correct,errorCode:'correct'},{html:`(x + ${a*a})<sup>2</sup>`,errorCode:'square-constant-in-parenthesis'},{html:`(x − ${a})<sup>2</sup>`,errorCode:'wrong-middle-sign'},{html:`(x − ${a})(x + ${a})`,errorCode:'confuse-square-and-conjugates'}
    ]:identity===1?[
      {html:correct,errorCode:'correct'},{html:`(x + ${a})<sup>2</sup>`,errorCode:'wrong-middle-sign'},{html:`(x − ${a*a})<sup>2</sup>`,errorCode:'square-constant-in-parenthesis'},{html:`(x − ${a})(x + ${a})`,errorCode:'confuse-square-and-conjugates'}
    ]:[
      {html:correct,errorCode:'correct'},{html:`(x − ${a})<sup>2</sup>`,errorCode:'confuse-conjugates-and-square'},{html:`(x + ${a})<sup>2</sup>`,errorCode:'confuse-conjugates-and-square'},{html:`(x − ${a*a})(x + ${a*a})`,errorCode:'square-constant-twice'}
    ];
    const qcm=qcmAnswer(options,shuffle);
    return base(module,question,{
      kind:'identity-recognition',prompt:'Quelle forme factorisée reconnais-tu&nbsp;?',expression:expressions[identity],qcm,
      explanation:'On compare le premier carré, le dernier carré et le signe du terme du milieu.',
      steps:[['Repérer',identity===2?'Une différence de deux carrés.':'Deux carrés et le double produit.'],['Identité',correct.replaceAll('<sup>2</sup>','²')+'.']]
    },qcm);
  }

  function identityExpandSquare(module,question,randomInt){
    const a=randomInt(2,7),negative=randomInt(0,1)===1,coefficients={x2:1,x:(negative?-2:2)*a,u:a*a},display=polynomial(coefficients);
    const expression=`(x ${negative?'−':'+'} ${a})<sup>2</sup>`,answer=expressionAnswer(display);
    return base(module,question,{
      kind:'identity-expand-square',prompt:'Développe cette identité remarquable.',expression,answerDisplay:display,
      response:polynomialResponse(coefficients,['x2','x','u'],['Le coefficient de x² vaut 1.','Le terme du milieu est le double produit, avec le signe de la parenthèse.','La constante est le carré de '+a+'.']),
      explanation:'Le terme du milieu est le double produit ; son signe suit celui de la parenthèse.',
      steps:[['Carrés',`x² et ${a}² = ${a*a}.`],['Double produit',`${negative?'−':'+'} 2 × x × ${a} = ${negative?'−':'+'}${2*a}x.`],['Résultat',display+'.']]
    },answer);
  }

  function identityDifference(module,question,randomInt){
    const a=randomInt(2,9),display=`(x − ${a})(x + ${a})`,answer=expressionAnswer(display,[`(x+${a})(x-${a})`]);
    return base(module,question,{
      kind:'identity-difference',prompt:'Factorise cette différence de deux carrés.',expression:`x<sup>2</sup> − ${a*a}`,answerDisplay:display,
      response:templateResponse(['Nombre dont le carré est '+a*a],[{text:'(x − '},{slot:0},{text:')(x + '},{slot:0},{text:')'}],[a],[`Cherche le nombre positif dont le carré vaut ${a*a}.`]),
      explanation:`${a*a} = ${a}². Une différence de deux carrés se factorise avec deux facteurs conjugués.`,
      steps:[['Reconnaître',`x² − ${a}².`],['Appliquer',`a² − b² = (a − b)(a + b).`],['Résultat',display+'.']]
    },answer);
  }

  function supports({question}){return !!question?.options?.expand_kind;}
  function createInstance({module,question,randomInt,shuffle}){
    const kind=question.options.expand_kind;
    if(kind==='structure')return structure(module,question,randomInt,shuffle);
    if(kind==='true-false')return trueFalse(module,question,randomInt,shuffle);
    if(kind==='partial-products')return partialProducts(module,question,randomInt,shuffle);
    if(kind==='choose-common-factor')return chooseCommonFactor(module,question,randomInt,shuffle);
    if(kind==='negative-factor')return negativeFactor(module,question,randomInt);
    if(kind==='develop-reduce')return developReduce(module,question,randomInt);
    if(kind==='factor-difference')return factorDifference(module,question,randomInt);
    if(kind==='rebuild-dimensions')return rebuildDimensions(module,question,randomInt,shuffle);
    if(['double-positive','double-coefficients','double-signs'].includes(kind))return doubleDirect(module,question,randomInt,kind);
    if(kind==='double-products')return doubleProducts(module,question,randomInt,shuffle);
    if(kind==='apparent-factor')return apparentFactor(module,question,randomInt,false);
    if(kind==='apparent-factor-x')return apparentFactor(module,question,randomInt,true);
    if(kind==='identity-recognition')return identityRecognition(module,question,randomInt,shuffle);
    if(kind==='identity-expand-square')return identityExpandSquare(module,question,randomInt);
    if(kind==='identity-difference')return identityDifference(module,question,randomInt);
    throw new Error('Famille Développer et factoriser inconnue.');
  }

  if(!global.MATHSGO_MODULE_RUNTIME)throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_12.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_12',{generator:{version:'2.0.0',supports,createInstance}});
})(globalThis);
