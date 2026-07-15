const modulesInDomain=(modules,domain)=>modules.map(module=>({...module,domain}));
const RAW_MODULES = [
  ...modulesInDomain(RAW_NUMBER_MODULES,'numbers'),
  ...modulesInDomain(RAW_GEOMETRY_MODULES,'geometry'),
  ...modulesInDomain(RAW_DATA_MODULES,'data'),
  ...modulesInDomain(RAW_ALGORITHM_MODULES,'algorithm')
];
const PROFESSIONAL_MODULE_TITLES={
  dnb_01:'Écriture décimale des fractions simples',
  dnb_02:'Comparer et calculer avec des nombres décimaux',
  dnb_02b:'Multiplier et diviser par 10, 100 et 1 000',
  dnb_04:'Fractions d’une quantité et pourcentages repères',
  dnb_05:'Un même nombre sous plusieurs formes',
  dnb_09:'Double, triple, moitié, prédécesseur, successeur et carré',
  dnb_14:'Lire une abscisse sur une droite graduée',
  dnb_15:'Lire des coordonnées dans un repère',
  dnb_17:'Angles : reconnaître, nommer et mesurer',
  dnb_20:'Reconnaître des solides',
  dnb_21:'Périmètres de polygones et de disques',
  dnb_22:'Aires : rectangle, carré, triangle et disque',
  dnb_23:'Volumes : cube, pavé droit, prisme et cylindre',
  dnb_24:'Théorème de Pythagore : égalité et situations',
  dnb_25:'Théorème de Thalès : triangles emboîtés',
  dnb_26:'Cosinus dans un triangle rectangle',
  dnb_32:'Lire des tableaux, diagrammes et graphiques',
  dnb_33:'Reconnaître une situation de proportionnalité',
  dnb_34:'Résoudre un problème de proportionnalité',
  dnb_36:'Lire un graphique de dépendance'
};
RAW_MODULES.forEach(module=>{if(PROFESSIONAL_MODULE_TITLES[module.id])module.title=PROFESSIONAL_MODULE_TITLES[module.id];});
function configureDecimalComparisonModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_02');
  if(!mod) return;
  [1,2].forEach(n=>{
    const q=mod.questions.find(item=>item.n===n);
    if(q) q.statement=q.statement.replace('Dire quel est le plus grand nombre parmi les trois nombres suivants :','Parmi ces nombres, lequel est le plus grand ?');
  });
}
configureDecimalComparisonModule();

function addPlaceValueShiftModule(){
  if(RAW_MODULES.some(module=>module.id==='dnb_02b')) return;
  const kinds=[
    'multiply10','multiply100','multiply1000',
    'divide10','divide100','divide1000',
    'mixed','mixed','qcm_result','qcm_result','missing_factor','missing_number'
  ];
  const module={
    id:'dnb_02b',num:2.5,domain:'numbers',
    title:'Multiplier et diviser par 10, 100 et 1 000',
    level_tags:['5e','4e','3e','DNB'],source:'mathsgo',has_svg:true,
    questions:kinds.map((kind,index)=>({
      n:index+1,statement:'',answer:'[]',footer:'',options:{place_value_kind:kind}
    }))
  };
  const index=RAW_MODULES.findIndex(item=>item.id==='dnb_02');
  RAW_MODULES.splice(index+1,0,module);
}
addPlaceValueShiftModule();

function configureSquaresModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_07');
  if(!mod) return;
  const q=n=>mod.questions.find(item=>item.n===n);

  [1,2].forEach(n=>{
    q(n).statement=q(n).statement.replace('Donne le carré de ce nombre :','Donne le carré de ${n} :');
    q(n).footer='$$${n}^2=[[dots]]$$';
  });

  [3,4].forEach(n=>{
    q(n).footer='$$[[dots]]^2=${c}$$';
  });

  q(5).statement=q(5).statement.replace("Complète l'égalité :","Complète l'égalité avec deux nombres entiers :");
  q(5).footer='$$${c}=[[dots]]\\times[[dots]]$$';

  q(9).footer='$$${expr}=[[dots]]$$';

  q(8).options.formula_code='setNB(1)\nn=RD(5,12)\nc=n*n\nlow=floor(c/10)*10\nhigh=low+10\nlow2=low-10\nwrong=2*n\nnlow=floor(wrong/10)*10\nnhigh=nlow+10';
}
configureSquaresModule();

function configureRelationsModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_09');
  if(!mod) return;
  const q=n=>mod.questions.find(item=>item.n===n);

  // Le carré isolé est déjà travaillé dans le module 07. Il reste présent
  // dans la question récapitulative n°1, conformément à la liste DNB.
  mod.questions=mod.questions.filter(item=>item.n!==7);

  q(1).options={...q(1).options,relation_kind:'summary'};
  q(2).options={...q(2).options,relation_kind:'multiple_direct',factor:2};
  q(3).options={...q(3).options,relation_kind:'multiple_direct',factor:3};
  q(4).options={...q(4).options,relation_kind:'fraction_direct',divisor:2};
  q(5).options={...q(5).options,relation_kind:'predecessor'};
  q(6).options={...q(6).options,relation_kind:'successor'};

  // Les relations littérales sont séparées pour être toutes proposées avec
  // la même fréquence dans le tirage du module.
  q(8).statement='Quelle expression correspond à la relation demandée ?';
  q(8).answer='[]';
  q(8).footer='';
  q(8).options={relation_kind:'expression_qcm',expression_target:'double'};

  q(9).options={...q(9).options,relation_kind:'multiple_inverse',factor:2};
  // Le petit problème reste inchangé dans son énoncé ; il reçoit seulement
  // le même schéma du triple que le calcul direct.
  q(10).options={...q(10).options,relation_kind:'multiple_direct',factor:3};

  mod.questions.push({
    n:11,
    statement:'Calcule le quadruple de ce nombre :',
    answer:'["4*n"]',
    options:{formula_code:'setNB(1)\nn=RD(5,30)',relation_kind:'multiple_direct',factor:4},
    footer:'$$\\text{quadruple de }${n}=[[formula]]$$'
  });
  mod.questions.push({
    n:12,
    statement:'Calcule la moitié de ce nombre impair :',
    answer:'["n/2"]',
    options:{formula_code:'setNB(1)\nn=2*RD(2,24)+1',relation_kind:'fraction_direct',divisor:2},
    footer:'$$\\text{moitié de }${n}=[[formula]]$$'
  });
  mod.questions.push({
    n:13,
    statement:'Calcule le quart de ce nombre :',
    answer:'["n/4"]',
    options:{formula_code:'setNB(1)\nn=4*RD(2,25)',relation_kind:'fraction_direct',divisor:4},
    footer:'$$\\text{quart de }${n}=[[formula]]$$'
  });

  [
    [14,'triple'],[15,'quadruple'],[16,'half'],[17,'quarter'],
    [18,'predecessor'],[19,'successor']
  ].forEach(([n,target])=>mod.questions.push({
    n,
    statement:'Quelle expression correspond à la relation demandée ?',
    answer:'[]',
    options:{relation_kind:'expression_qcm',expression_target:target},
    footer:''
  }));
}
configureRelationsModule();

function configureFractionPercentModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_04');
  if(!mod) return;
  const q=n=>mod.questions.find(item=>item.n===n);

  [1,2,3].forEach(n=>{
    q(n).statement='Calcule :';
    q(n).options={...q(n).options,fraction_percent_category:'fraction'};
  });
  [[4,100],[5,50],[6,25],[7,10],[8,1]].forEach(([n,percent])=>{
    q(n).options={...q(n).options,fraction_percent_category:'percent',percent_value:percent};
  });

  q(9).options={
    ...q(9).options,
    fraction_percent_category:'percent',
    percent_dynamic:true,
    formula_code:'setNB(1)\nidx=RD(5)\na=[100,50,25,20,10,1][idx]\nmul=[1,2,4,5,10,100][idx]\nc=RD(2,30)*mul'
  };
  q(10).options={
    ...q(10).options,
    fraction_percent_category:'percent',
    percent_dynamic:true,
    percent_contextual:true,
    formula_code:'setNB(1)\nidx=RD(5)\na=[100,50,25,20,10,1][idx]\nmul=[1,2,4,5,10,100][idx]\nc=RD(2,12)*mul\ncontextIndex=RD(4)'
  };

  if(!q(11)) mod.questions.push({
    n:11,
    statement:'Calcule :',
    answer:'["c/5"]',
    options:{
      formula_code:'setNB(1)\nc=RD(2,50)*5',
      fraction_percent_category:'percent',
      percent_value:20
    },
    footer:'$$20\\%\\text{ de }${c}=[[formula]]$$'
  });

  mod.questions=mod.questions.filter(item=>item.n!==12);
  const displayOrder=[1,2,3,4,5,6,11,7,8,9,10];
  mod.questions.sort((a,b)=>displayOrder.indexOf(a.n)-displayOrder.indexOf(b.n));
}
configureFractionPercentModule();

function configureMultipleFormsModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_05');
  if(!mod) return;
  const q=n=>mod.questions.find(item=>item.n===n);

  q(1).answer='["num","10"]';
  q(1).options={
    formula_code:'setNB(1)\nwhole=RD(0,2)\ntenths=RD(1,9)\nnum=whole*10+tenths\ndec=CUT(num/10,2)',
    multiple_forms_kind:'decimal_to_tenths'
  };

  q(2).answer='["p","den"]';
  q(2).options={
    formula_code:'setNB(1)\nvalues=[20,25,30,37,40,43,50,60,70,75,80,90,125,150,175]\nc=values[RD(values.length-1)]\ng=GCD(c,100)\np=c/g\nden=100/g\ndec=CUT(c/100,2)',
    multiple_forms_kind:'decimal_to_irreducible'
  };

  q(3).answer='["c"]';
  q(3).options={
    formula_code:'setNB(1)\nvalues=[5,10,20,25,37,40,50,65,75,80,95,105,120,125,150,175,195]\nc=values[RD(values.length-1)]\ndec=CUT(c/100,2)',
    multiple_forms_kind:'decimal_to_percent'
  };

  q(4).answer='["p/100"]';
  q(4).options={
    formula_code:'setNB(1)\nvalues=[5,10,20,25,37,40,50,65,75,80,95,105,120,125,150,175,195]\np=values[RD(values.length-1)]',
    multiple_forms_kind:'percent_to_decimal'
  };

  q(5).answer='["a/b"]';
  q(5).options={
    formula_code:'setNB(1)\nidx=RD(7)\na=[1,3,2,4,7,3,5,9][idx]\nb=[2,4,5,5,5,2,4,5][idx]',
    multiple_forms_kind:'fraction_to_decimal'
  };

  q(6).answer='["a*100/b"]';
  q(6).options={
    formula_code:'setNB(1)\nidx=RD(7)\na=[1,3,2,4,7,5,3,7][idx]\nb=[2,4,5,5,10,4,2,5][idx]',
    multiple_forms_kind:'fraction_to_percent'
  };

  q(7).answer='["p","100"]';
  q(7).options={
    formula_code:'setNB(1)\nvalues=[5,10,20,25,37,40,50,65,75,80,95,105,120,125,150,175,195]\np=values[RD(values.length-1)]',
    multiple_forms_kind:'percent_to_fraction100'
  };

  q(8).answer='["a*100/b","100"]';
  q(8).options={
    formula_code:'setNB(1)\nidx=RD(9)\na=[1,3,2,7,5,7,3,5,7,9][idx]\nb=[2,4,5,10,4,5,2,10,10,10][idx]',
    multiple_forms_kind:'equivalent_to100'
  };

  q(9).answer='["p","den"]';
  q(9).options={
    formula_code:'setNB(1)\nnums=[2,3,4,5,6,7,8,9,12,15,20,25,30,40,50,60,75,80,90,125,150,175]\ndens=[10,10,10,10,10,10,10,10,10,10,100,100,100,100,100,100,100,100,100,100,100,100]\nidx=RD(nums.length-1)\nnum=nums[idx]\nbaseDen=dens[idx]\ng=GCD(num,baseDen)\np=num/g\nden=baseDen/g',
    multiple_forms_kind:'simplify_decimal_fraction'
  };
  q(9).footer='$$\\dfrac{${num}}{${baseDen}}=\\dfrac{[[formula]]}{[[formula]]}$$';

  q(10).statement='Parmi ces écritures, lesquelles sont égales à $$${dec}$$ ?&&$$\\dfrac{${num}}{10}$$&&$$${num}\\%$$&&$$${num*10}\\%$$&&$$\\dfrac{${num*10}}{100}$$&&';
  q(10).answer='["1","3","4"]';
  q(10).options={
    formula_code:'setNB(1)\nwhole=RD(0,1)\ntenths=RD(1,9)\nnum=whole*10+tenths\ndec=CUT(num/10,2)',
    shuffle_answers:true,
    multiple_forms_kind:'synthesis_line'
  };
}
configureMultipleFormsModule();

function configureScientificModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_06');
  if(!mod) return;
  mod.questions
    .filter(q=>q.n<=8)
    .forEach(q=>{ q.footer=q.footer.replace(/\[\[formula\]\]/g,'[[dots]]'); });
  const decimalQuestion=mod.questions.find(q=>q.n===8);
  decimalQuestion.options.formula_code=decimalQuestion.options.formula_code.replace('pow(10,e)','10**e');
  const recognitionQuestion=mod.questions.find(q=>q.n===10);
  if(recognitionQuestion){
    recognitionQuestion.statement="Le nombre $$${m}\\times10^{${e}}$$ est-il écrit en notation scientifique ?&&Oui, c'est une écriture scientifique correcte&&Non, car la partie entière n’est pas comprise entre 1 et 10&&Non, car l'exposant doit être positif&&";
  }

  if(!mod.questions.some(q=>q.n===11)){
    mod.questions.push({
      n:11,
      statement:'Cette notation scientifique correspond à quel nombre décimal ?',
      answer:'["n"]',
      options:{
        formula_code:'setNB(1)\nd=RD(11,99)\nm=d/10\ne=0-RD(2,4)\nn=CUT(m*10**e,8)',
        scientific_kind:'from_scientific'
      },
      footer:'$$${m}\\times10^{${e}}=[[dots]]$$'
    });
  }

  mod.questions.forEach(q=>{
    q.options=q.options||{};
    if(q.n<=7) q.options.scientific_kind='to_scientific';
    if(q.n===8) q.options.scientific_kind='from_scientific';
    if(q.n===9) q.options.scientific_kind='to_scientific_qcm';
    if(q.n===10) q.options.scientific_kind='recognition';
  });
}
configureScientificModule();

function configureAngleSumModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_18');
  if(!mod) return;
  const kinds={
    1:'sum_course',2:'general',3:'general',4:'right',5:'isosceles_vertex',
    6:'isosceles_base',7:'equilateral',8:'validity_three',9:'figure',10:'invalid_two'
  };
  mod.questions.forEach(q=>{
    q.options=q.options||{};
    q.options.angle_sum_kind=kinds[q.n];
  });
}
configureAngleSumModule();

function configureEvolutionModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_35');
  if(!mod) return;
  const kinds={
    1:'increase_total',2:'decrease_total',3:'increase_total',4:'decrease_total',
    5:'increase_coefficient',6:'decrease_coefficient',7:'increase_qcm',
    8:'decrease_qcm',9:'decrease_total',10:'increase_amount'
  };
  mod.questions.forEach(q=>{
    q.options=q.options||{};
    q.options.evolution_kind=kinds[q.n];
    if(Number(q.n)===3) q.footer='$$[[formula]]\\text{ habitants}$$';
    if(Number(q.n)===4) q.footer='$$[[formula]]\\text{ élèves}$$';
    if([7,8].includes(Number(q.n))&&q.options.formula_code){
      q.options.formula_code=q.options.formula_code.replace('prix=RD(4,20)*10','prix=RD(2,20,[5])*20');
    }
  });
}
configureEvolutionModule();

function configureMedianModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_31');
  if(!mod) return;
  mod.title='Médiane et étendue';
  const q=n=>mod.questions.find(item=>item.n===n);
  const series=names=>'<div class="median-list">'+names.map(name=>'<span class="median-value">$$${'+name+'}$$</span>').join('<span class="median-separator">;</span>')+'</div>';
  const makeTableResponsive=question=>{
    if(!question||!question.statement) return;
    question.statement=question.statement
      .replace('<table style="border-collapse:collapse;margin:auto;text-align:center;font-size:18px">','<div class="median-table-wrap"><table class="median-table">')
      .replace(/<td style="border:1px solid #555;padding:8px (?:14|18)px">/g,'<td>')
      .replace('</table>','</table></div>');
  };

  q(1).statement='Détermine la médiane de la série suivante :'+series(['c','a','b']);
  q(2).statement='Détermine la médiane de la série suivante :'+series(['e','a','d','b','c']);
  q(3).statement='Détermine la médiane de la série suivante :'+series(['d','a','c','b']);
  q(4).statement='La série suivante est déjà rangée dans l’ordre croissant :'+series(['a','b','c','d','e','f'])+'Détermine sa médiane.';
  q(9).statement='Détermine la médiane de la série suivante, qui contient des valeurs répétées :'+series(['a','m','b','m','c']);
  q(10).statement='La série suivante est déjà rangée dans l’ordre croissant :'+series(['a','b','c','d'])+'Quelle est sa médiane ?';
  makeTableResponsive(q(6));
  makeTableResponsive(q(7));

  if(!q(11)){
    mod.questions.push({
      n:11,
      statement:'Calcule l’étendue de la série suivante :'+series(['e','b','a','f','c','d']),
      answer:'["etendue"]',
      options:{formula_code:'setNB(1)\na=RD(1,6)\nb=a+RD(1,4)\nc=b+RD(1,4)\nd=c+RD(1,4)\ne=d+RD(1,4)\nf=e+RD(1,4)\netendue=f-a'},
      footer:'$$\\text{étendue}=[[formula]]$$'
    });
  }
  if(!q(12)){
    mod.questions.push({
      n:12,
      statement:'Voici cinq distances relevées :<div class="median-table-wrap"><table class="median-table"><tr><td>mesure</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td></tr><tr><td>distance (m)</td><td>$$${c}$$</td><td>$$${a}$$</td><td>$$${e}$$</td><td>$$${b}$$</td><td>$$${d}$$</td></tr></table></div>Calcule l’étendue de ces distances.',
      answer:'["etendue"]',
      options:{formula_code:'setNB(1)\na=RD(5,10)\nb=a+RD(1,3)\nc=b+RD(1,3)\nd=c+RD(1,3)\ne=d+RD(1,3)\netendue=e-a'},
      footer:'$$\\text{étendue}=[[formula]]\\,\\text{m}$$'
    });
  }
}
configureMedianModule();

function configureProportionModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_34');
  if(!mod) return;
  const q=n=>mod.questions.find(item=>item.n===n);
  const makeTableResponsive=question=>{
    if(!question||!question.statement) return;
    question.statement=question.statement
      .replace('<table style="border-collapse:collapse;margin:auto;text-align:center;font-size:18px">','<div class="proportion-table-wrap"><table class="proportion-table">')
      .replace(/<td style="border:1px solid #555;padding:8px 18px">/g,'<td>')
      .replace('</table>','</table></div>');
  };
  makeTableResponsive(q(2));
  makeTableResponsive(q(5));
  if(q(5)&&q(5).options&&!q(5).options.formula_code.includes('unknownTop=')){
    q(5).statement=q(5).statement
      // Une fonction de remplacement préserve les deux signes "$" : dans une
      // chaîne de remplacement directe, String.replace interprète "$$".
      .replace('$$${q2}$$',()=> '$$${q2Cell}$$')
      .replace('>?</td>',()=> '>$$${p2Cell}$$</td>');
    q(5).answer='["target"]';
    q(5).options.formula_code+='\nunknownTop=RD(1)\nq2Cell=unknownTop?"?":q2\np2Cell=unknownTop?p2:"?"\ntarget=unknownTop?q2:p2';
  }
  if(q(9)&&q(9).options){
    q(9).options.formula_code=q(9).options.formula_code.replace('q2=RD(2,5)','q2=RD(2,5,[q1])');
  }
  if(!q(11)){
    mod.questions.push({
      n:11,
      statement:'Ce tableau est un tableau de proportionnalité. Calcule le nombre manquant.<div class="proportion-table-wrap proportion-bare-table-wrap"><table class="proportion-table proportion-bare-table"><tr><td>$$${x1}$$</td><td>$$${x2Cell}$$</td></tr><tr><td>$$${y1}$$</td><td>$$${y2Cell}$$</td></tr></table></div>',
      answer:'["target"]',
      options:{formula_code:'setNB(1)\nx1=RD(2,6)\nm=RD(2,4)\nk=RD(2,8)\nx2=x1*m\ny1=x1*k\ny2=x2*k\nunknownTop=RD(1)\nx2Cell=unknownTop?"?":x2\ny2Cell=unknownTop?y2:"?"\ntarget=unknownTop?x2:y2'},
      footer:'$$[[formula]]$$'
    });
  }
}
configureProportionModule();

function configureLegacyStatementTables(){
  const legacyTable=/(?:<br>|\n\n)?\s*(<table style="border-collapse:collapse;margin:auto;text-align:(?:center|left);font-size:(?:18|20)px">[\s\S]*?<\/table>)(?:<br>)?/g;
  RAW_MODULES.forEach(module=>{
    module.questions.forEach(question=>{
      if(!question.statement||!question.statement.includes('<table style=')) return;
      const tableClass='legacy-table-'+module.id+'-'+question.n;
      question.statement=question.statement.replace(legacyTable,(_,table)=>{
        const classified=table.replace('<table ','<table class="legacy-statement-table '+tableClass+'" ');
        return '<div class="legacy-statement-table-wrap '+tableClass+'-wrap">'+classified+'</div>';
      });
    });
  });
}
configureLegacyStatementTables();

function configureAlreadyReducedQuestion(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_10');
  if(!mod || mod.questions.some(q=>q.options&&q.options.reduction_kind==='already_reduced')) return;
  mod.questions.push({
    n:6,
    statement:'Réduis l’expression :',
    answer:'[]',
    options:{reduction_kind:'already_reduced'},
    footer:''
  });
}
configureAlreadyReducedQuestion();

function numberLineQcmSvg(){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="auto" viewBox="0 0 680 120" style="max-width:700px">
<line x1="40" y1="60" x2="640" y2="60" stroke="#222" stroke-width="1.5"/>
<polygon points="640,60 630,55 630,65" fill="#222"/>
<line x1="60" y1="52" x2="60" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="118" y1="52" x2="118" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="176" y1="52" x2="176" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="234" y1="52" x2="234" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="292" y1="52" x2="292" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="350" y1="52" x2="350" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="408" y1="52" x2="408" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="466" y1="52" x2="466" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="524" y1="52" x2="524" y2="68" stroke="#222" stroke-width="1.5"/>
<line x1="582" y1="52" x2="582" y2="68" stroke="#222" stroke-width="1.5"/>
<text x="\${zeroX}" y="92" font-family="sans-serif" font-size="22" text-anchor="middle">0</text>
<text x="\${oneX}" y="92" font-family="sans-serif" font-size="22" text-anchor="middle">1</text>
<line x1="\${cx}" y1="47" x2="\${cx}" y2="73" stroke="#2563a6" stroke-width="5" stroke-linecap="round"/>
<text x="\${cx}" y="36" font-family="serif" font-style="italic" font-size="24" text-anchor="middle" fill="#2563a6">C</text>
</svg>`;
}

function flexibleNumberLineSvg(pointName='A'){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="auto" viewBox="0 0 680 120" style="max-width:700px">
<line x1="40" y1="60" x2="640" y2="60" stroke="#222" stroke-width="1.5"/>
<polygon points="640,60 630,55 630,65" fill="#222"/>
${Array.from({length:10},(_,i)=>`<line x1="${60+i*58}" y1="52" x2="${60+i*58}" y2="68" stroke="#222" stroke-width="1.5"/>`).join('\n')}
<text x="\${refX1}" y="92" font-family="sans-serif" font-size="22" text-anchor="middle">\${refV1}</text>
<text x="\${refX2}" y="92" font-family="sans-serif" font-size="22" text-anchor="middle">\${refV2}</text>
<line x1="\${cx}" y1="47" x2="\${cx}" y2="73" stroke="#2563a6" stroke-width="5" stroke-linecap="round"/>
<text x="\${cx}" y="36" font-family="serif" font-style="italic" font-size="24" text-anchor="middle" fill="#2563a6">${pointName}</text>
</svg>`;
}

function numberLineTickMarkers(svg){
  return String(svg||'').replace(
    /<circle cx="([^"]+)" cy="60" r="6" fill="([^"]+)"\/>/g,
    '<line x1="$1" y1="47" x2="$1" y2="73" stroke="$2" stroke-width="5" stroke-linecap="round"/>'
  );
}

function configureNumberLineModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_14');
  if(!mod) return;
  const q=n=>mod.questions.find(item=>item.n===n);

  mod.questions.forEach(item=>{
    item.statement=item.statement.replace(/max-width:500px/g,'max-width:700px');
    item.statement=item.statement
      .replace(/#c0392b/g,'#2563a6')
      .replace(/#2471a3/g,'#7c3aed');
    item.statement=numberLineTickMarkers(item.statement);
    item.footer=item.footer
      .replace(/x_A/g,'𝑥_A')
      .replace(/x_B/g,'𝑥_B')
      .replace(/=/g,'\\,=\\,');
  });

  q(4).options.formula_code=q(4).options.formula_code.replace('RD(0,9,[5])','RD(0,9,[0,5])');
  q(6).options.formula_code=q(6).options.formula_code.replace('RD(0,9,[5])','RD(0,9,[1,5])');
  q(7).options.formula_code=q(7).options.formula_code.replace('RD(0,9,[5])','RD(0,9,[0,5])');
  q(8).options.formula_code=q(8).options.formula_code.replace('ib=RD(5,9)','ib=RD(5,9,[5])');

  const svg=numberLineQcmSvg();
  mod.questions.push({
    n:11,
    statement:`Quelle est l'abscisse du point C ?\n${svg}&&$$\${val}$$&&$$\${raw}$$&&$$\${inverse}$$&&$$\${opposite}$$&&`,
    answer:'["1"]',
    options:{
      formula_code:'setNB(1)\nz=RD(2,5)\ni=RD(0,9,[z,z+2])\nk=i-z\nval=CUT(k*0.5,1)\nraw=k\ninverse=k*2\nopposite=0-val\nzeroX=60+z*58\noneX=60+(z+2)*58\ncx=60+i*58',
      shuffle_answers:true
    },
    footer:'[[formula_qcm1]]'
  });
  mod.questions.push({
    n:12,
    statement:`Quelle est l'abscisse du point C ?\n${svg}&&$$\${val}$$&&$$\${raw}$$&&$$\${inverse}$$&&$$\${opposite}$$&&`,
    answer:'["1"]',
    options:{
      formula_code:'setNB(1)\nz=RD(1,5)\ni=RD(0,9,[z,z+4])\nk=i-z\nval=CUT(k*0.25,2)\nraw=k\ninverse=k*4\nopposite=0-val\nzeroX=60+z*58\noneX=60+(z+4)*58\ncx=60+i*58',
      shuffle_answers:true
    },
    footer:'[[formula_qcm1]]'
  });

  const flexibleA=flexibleNumberLineSvg('A');
  const flexibleC=flexibleNumberLineSvg('C');
  const directQuestion=(n,code,family)=>({
    n,
    statement:`Lis l'abscisse du point A :\n${flexibleA}`,
    answer:'["val"]',
    options:{formula_code:code,numberline_family:family},
    footer:'$$𝑥_A\\,=\\,[[formula]]$$'
  });

  mod.questions.push(directQuestion(13,
    'setNB(1)\nstep=RD(1,2)\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\ndir=RD(0,1)===0?-1:1\nzeroI=dir===1?refI1:refI2\nrefV1=(refI1-zeroI)*step\nrefV2=(refI2-zeroI)*step\ni=RD(0,9,[refI1,refI2])\nval=(i-zeroI)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58',
    'scaled'
  ));
  mod.questions.push(directQuestion(14,
    'setNB(1)\nstep=5\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=RD(-4,2)*step\nrefV2=refV1+gap*step\ni=RD(0,9,[refI1,refI2])\nval=refV1+(i-refI1)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58',
    'scaled'
  ));
  mod.questions.push(directQuestion(15,
    'setNB(1)\nsteps=[10,20,25,50]\nstep=steps[RD(0,3)]\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=RD(-3,1)*step\nrefV2=refV1+gap*step\ni=RD(0,9,[refI1,refI2])\nval=refV1+(i-refI1)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58',
    'scaled'
  ));
  mod.questions.push(directQuestion(16,
    'setNB(1)\nsteps=[0.1,0.2]\nstep=steps[RD(0,1)]\ngap=RD(2,5)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=CUT(RD(-4,1)*step,2)\nrefV2=CUT(refV1+gap*step,2)\ni=RD(0,9,[refI1,refI2])\nval=CUT(refV1+(i-refI1)*step,2)\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58',
    'fractional'
  ));
  mod.questions.push(directQuestion(17,
    'setNB(1)\nsteps=[1,2,5,10]\nstep=steps[RD(0,3)]\ngap=RD(2,4)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\ndo{refV1=RD(-5,3)*step\nrefV2=refV1+gap*step}while(refV1===0||refV2===0)\ni=RD(0,9,[refI1,refI2])\nval=refV1+(i-refI1)*step\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58',
    'scaled'
  ));
  mod.questions.push({
    n:18,
    statement:`Quelle est l'abscisse du point C ?\n${flexibleC}&&$$\${val}$$&&$$\${raw}$$&&$$\${offByOne}$$&&$$\${opposite}$$&&`,
    answer:'["1"]',
    options:{
      formula_code:'setNB(1)\nsteps=[0.1,0.2,0.5,2,5,10,20,25]\ndo{step=steps[RD(0,7)]\ngap=RD(2,5)\nrefI1=RD(1,8-gap)\nrefI2=refI1+gap\nrefV1=CUT(RD(-4,2)*step,2)\nrefV2=CUT(refV1+gap*step,2)\ni=RD(0,9,[refI1,refI2])\nval=CUT(refV1+(i-refI1)*step,2)\nraw=CUT(refV1+(i-refI1),2)\noffByOne=CUT(refV1+((i-refI1)+(i>refI1?1:-1))*step,2)\nopposite=0-val}while(val===0||raw===val||offByOne===val||opposite===val||raw===offByOne||raw===opposite||offByOne===opposite)\nrefX1=60+refI1*58\nrefX2=60+refI2*58\ncx=60+i*58',
      shuffle_answers:true,
      numberline_family:'scaled'
    },
    footer:'[[formula_qcm1]]'
  });

  const families={
    1:'standard',2:'standard',3:'standard',4:'signed',5:'fractional',6:'fractional',
    7:'signed',8:'standard',9:'signed',10:'standard',11:'fractional',12:'fractional'
  };
  mod.questions.forEach(item=>{
    item.options=item.options||{};
    if(!item.options.numberline_family) item.options.numberline_family=families[item.n]||'scaled';
  });
}
configureNumberLineModule();

function configureCoordinatePointMarkers(){
  const pointCircle=/<circle cx="([^"]+)" cy="([^"]+)" r="5" fill="([^"]+)"\/>/g;
  ['dnb_15','dnb_27'].forEach(id=>{
    const mod=RAW_MODULES.find(module=>module.id===id);
    if(!mod) return;
    mod.questions.forEach(question=>{
      if(!question.statement) return;
      question.statement=question.statement.replace(pointCircle,(_,cx,cy,color)=>
        '<g class="coordinate-point-marker" transform="translate('+cx+' '+cy+')" stroke="'+color+'" stroke-width="3.2" stroke-linecap="round">'
        +'<line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g>'
      );
    });
  });
}
configureCoordinatePointMarkers();

function transformationFigureSvg(kind){
  const grid=[];
  for(let x=50;x<=450;x+=50) grid.push('<line x1="'+x+'" y1="25" x2="'+x+'" y2="325"/>');
  for(let y=25;y<=325;y+=50) grid.push('<line x1="50" y1="'+y+'" x2="450" y2="'+y+'"/>');
  const defs='<defs><marker id="transformArrow'+kind+'" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#e86100"/></marker></defs>';
  const base='<path d="M100 225L100 125L150 125L150 175L200 175L200 225Z" fill="#cfe5ff" stroke="#1f5f8b" stroke-width="4" stroke-linejoin="round"/><text x="118" y="153" fill="#17384d" font-size="26" font-weight="850">F</text>';
  let image='';
  if(kind==='translation') image='<path d="M300 125L300 25L350 25L350 75L400 75L400 125Z" fill="#d8f2e7" stroke="#087a55" stroke-width="4" stroke-linejoin="round"/><path d="M205 164L286 123" stroke="#e86100" stroke-width="4" marker-end="url(#transformArrowtranslation)"/><text x="318" y="53" fill="#087a55" font-size="26" font-weight="850">F′</text>';
  if(kind==='axial') image='<line x1="250" y1="25" x2="250" y2="325" stroke="#e86100" stroke-width="4" stroke-dasharray="10 7"/><text x="261" y="48" fill="#9a4100" font-size="23" font-style="italic">d</text><path d="M400 225L400 125L350 125L350 175L300 175L300 225Z" fill="#d8f2e7" stroke="#087a55" stroke-width="4" stroke-linejoin="round"/><text x="365" y="153" fill="#087a55" font-size="26" font-weight="850">F′</text>';
  if(kind==='central') image='<circle cx="250" cy="175" r="7" fill="#e86100"/><text x="261" y="169" fill="#9a4100" font-size="22" font-weight="850">O</text><path d="M400 125L400 225L350 225L350 175L300 175L300 125Z" fill="#d8f2e7" stroke="#087a55" stroke-width="4" stroke-linejoin="round"/><path d="M205 225L295 125" stroke="#8d99aa" stroke-width="2.5" stroke-dasharray="7 6"/><text x="365" y="211" fill="#087a55" font-size="26" font-weight="850">F′</text>';
  return '<svg class="transformation-figure-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" role="img" aria-label="Figure F et son image F prime sur un quadrillage">'+defs+'<g stroke="#cfd8e4" stroke-width="1.5">'+grid.join('')+'</g>'+base+image+'</svg>';
}
function transformationPlacementSvg(kind){
  const lines=[];
  for(let value=-3;value<=3;value++){
    const px=200+value*46,py=200-value*46;
    lines.push('<line x1="'+px+'" y1="62" x2="'+px+'" y2="338"/><line x1="62" y1="'+py+'" x2="338" y2="'+py+'"/>');
  }
  const hits=[];
  for(let y=-3;y<=3;y++) for(let x=-3;x<=3;x++) hits.push('<circle class="transformation-grid-hit" data-grid-x="'+x+'" data-grid-y="'+y+'" cx="'+(200+x*46)+'" cy="'+(200-y*46)+'" r="16" fill="transparent"/>');
  let guides='';
  if(kind==='translation') guides='<defs><marker id="placementVector" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#e86100"/></marker></defs><line x1="${vx1}" y1="${vy1}" x2="${vx2}" y2="${vy2}" stroke="#e86100" stroke-width="4" marker-end="url(#placementVector)"/><text x="${vtx}" y="${vty}" fill="#9a4100" font-size="18" font-weight="850">vecteur (${u} ; ${v})</text>';
  if(kind==='central') guides='<circle cx="${ssx}" cy="${ssy}" r="7" fill="#e86100"/><text x="${stx}" y="${sty}" fill="#9a4100" font-size="21" font-weight="850">S</text><line x1="${asx}" y1="${asy}" x2="${psx}" y2="${psy}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 5"/>';
  if(kind==='axial') guides='<line x1="${axisx}" y1="62" x2="${axisx}" y2="338" stroke="#e86100" stroke-width="4" stroke-dasharray="9 6"/><text x="${axislabel}" y="83" fill="#9a4100" font-size="21" font-style="italic">d</text>';
  return '<svg class="transformation-placement-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Quadrillage interactif : placer le point image"><g stroke="#cfd8e4" stroke-width="1.4">'+lines.join('')+'</g><line x1="56" y1="200" x2="346" y2="200" stroke="#17384d" stroke-width="2.2"/><line x1="200" y1="344" x2="200" y2="54" stroke="#17384d" stroke-width="2.2"/>'+guides+'<g transform="translate(${asx} ${asy})" stroke="#1f5f8b" stroke-width="4" stroke-linecap="round"><line x1="-8" y1="0" x2="8" y2="0"/><line x1="0" y1="-8" x2="0" y2="8"/></g><text x="${atx}" y="${aty}" fill="#1f5f8b" font-size="21" font-weight="850">A</text><g class="transformation-grid-hits">'+hits.join('')+'</g></svg>';
}
function configureTransformationModule(){
  const mod=RAW_MODULES.find(module=>module.id==='dnb_27');
  if(!mod) return;
  const coordinateTranslation=mod.questions.find(question=>Number(question.n)===6);
  if(coordinateTranslation) coordinateTranslation.options.formula_code='setNB(1)\ndir=RD(0,7)\nux=[1,-1,0,0,1,1,-1,-1][dir]\nvy=[0,0,1,-1,1,-1,1,-1][dir]\nmag=RD(1,2)\nu=ux*mag\nv=vy*mag\nxaMin=u<0?-3-u:-3\nxaMax=u>0?3-u:3\nyaMin=v<0?-3-v:-3\nyaMax=v>0?3-v:3\nxa=RD(xaMin,xaMax)\nya=RD(yaMin,yaMax)\nxb=xa+u\nyb=ya+v\nxc=RD(xaMin,xaMax)\nyc=RD(yaMin,yaMax)\nxd=xc+u\nyd=yc+v\nsxa=200+xa*40\nsya=200-ya*40\nsxb=200+xb*40\nsyb=200-yb*40\nsxc=200+xc*40\nsyc=200-yc*40\ntxa=sxa+10\ntya=sya-8\ntxb=sxb+10\ntyb=syb-8\ntxc=sxc+10\ntyc=syc-8';
  const options='&&une translation&&une symétrie axiale&&une symétrie centrale&&une homothétie&&';
  const makeQuestion=(n,kind,answer,prompt)=>({
    n,
    statement:'<div class="transformation-prompt">'+prompt+'</div>'+transformationFigureSvg(kind)+options,
    answer:'["'+answer+'"]',
    options:{shuffle_answers:true,transformation_figure_kind:kind},
    footer:'[[qcm1]]'
  });
  const replacements={
    8:makeQuestion(8,'central',3,'Quelle transformation envoie la figure F sur la figure F′ ?'),
    9:makeQuestion(9,'translation',1,'Quelle transformation envoie la figure F sur la figure F′ ?')
  };
  mod.questions=mod.questions.map(question=>replacements[question.n]||question);
  mod.questions.push(makeQuestion(10,'axial',2,'Quelle transformation d’axe d envoie la figure F sur la figure F′ ?'));
  mod.questions.push({
    n:11,
    statement:'<div class="transformation-prompt">Clique sur le point A′, image de A par la translation indiquée.</div>'+transformationPlacementSvg('translation'),
    answer:'["xp","yp"]',
    options:{transformation_place_kind:'translation',formula_code:'setNB(1)\nu=RD(-2,2,[0])\nv=RD(-2,2,[0])\nxa=RD(-1,1)\nya=RD(-1,1)\nxp=xa+u\nyp=ya+v\nasx=200+xa*46\nasy=200-ya*46\natx=asx+12\naty=asy-10\nvx1=85\nvy1=335\nvx2=vx1+u*46\nvy2=vy1-v*46\nvtx=(vx1+vx2)/2\nvty=(vy1+vy2)/2-10'},
    footer:'A′([[formula]] ; [[formula]])'
  });
  mod.questions.push({
    n:12,
    statement:'<div class="transformation-prompt">Clique sur le point A′, symétrique de A par rapport au point S.</div>'+transformationPlacementSvg('central'),
    answer:'["xp","yp"]',
    options:{transformation_place_kind:'central',formula_code:'setNB(1)\nxs=RD(-1,1)\nys=RD(-1,1)\ndx=RD(-2,2,[0])\ndy=RD(-2,2)\nxa=xs-dx\nya=ys-dy\nxp=xs+dx\nyp=ys+dy\nasx=200+xa*46\nasy=200-ya*46\npsx=200+xp*46\npsy=200-yp*46\nssx=200+xs*46\nssy=200-ys*46\nstx=ssx+11\nsty=ssy-10\natx=asx+12\naty=asy-10'},
    footer:'A′([[formula]] ; [[formula]])'
  });
  mod.questions.push({
    n:13,
    statement:'<div class="transformation-prompt">Clique sur le point A′, symétrique de A par rapport à la droite d.</div>'+transformationPlacementSvg('axial'),
    answer:'["xp","y"]',
    options:{transformation_place_kind:'axial',formula_code:'setNB(1)\nk=RD(-1,1)\nd=RD(1,2)\nside=RD(0,1)===0?-1:1\nx=k+side*d\ny=RD(-2,2)\nxp=2*k-x\nasx=200+x*46\nasy=200-y*46\natx=asx+12\naty=asy-10\naxisx=200+k*46\naxislabel=axisx+9'},
    footer:'A′([[formula]] ; [[formula]])'
  });
}
configureTransformationModule();

const SOLID_NAMES=['un cube','un pavé droit','un prisme droit','un cylindre','une pyramide','un cône','une sphère','une boule'];
function solidSvg(viewBox,body){
  return '<svg class="solid-svg" xmlns="http://www.w3.org/2000/svg" viewBox="'+viewBox+'" role="img" aria-label="Solide à reconnaître">'+body+'</svg>';
}
function solidQuestion(n,answerIndex,svg,prompt,category){
  return {
    n,
    statement:'<div class="solid-prompt">'+(prompt||'Quel est le nom le plus précis de ce solide ?')+'</div><div class="solid-visual">'+svg+'</div>',
    answer:'[]',
    options:{solid_kind:'name',solid_category:category||'drawing',solid_answer:SOLID_NAMES[answerIndex-1]},
    footer:''
  };
}
function solidCountQuestion(n,svg,vertices,edges,faces){
  return {
    n,
    statement:'<div class="solid-visual">'+svg+'</div>',
    answer:'[]',
    options:{solid_kind:'count',solid_category:'count',solid_counts:[vertices,edges,faces]},
    footer:''
  };
}
function configureSolidsModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_20');
  if(!mod) return;
  const edge='#1f4e79', dash=' stroke-dasharray="6 5"';
  const questions=[];

  questions.push(solidQuestion(1,1,solidSvg('0 0 260 200',
    '<polygon points="75,75 155,75 155,155 75,155" fill="#e8f2ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<polygon points="75,75 115,35 195,35 155,75" fill="#f4f9ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<polygon points="155,75 195,35 195,115 155,155" fill="#d7e8ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<line x1="75" y1="155" x2="115" y2="115" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'+
    '<line x1="115" y1="35" x2="115" y2="115" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'+
    '<line x1="115" y1="115" x2="195" y2="115" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'
  )));

  questions.push(solidQuestion(2,1,solidSvg('0 0 260 200',
    '<g transform="translate(260 0) scale(-1 1)">'+
    '<polygon points="70,70 150,70 150,150 70,150" fill="#e8f2ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<polygon points="70,70 108,32 188,32 150,70" fill="#f4f9ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<polygon points="150,70 188,32 188,112 150,150" fill="#d7e8ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<line x1="70" y1="150" x2="108" y2="112" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'+
    '<line x1="108" y1="32" x2="108" y2="112" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'+
    '<line x1="108" y1="112" x2="188" y2="112" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'+
    '</g>'
  )));

  questions.push(solidQuestion(3,2,solidSvg('0 0 300 200',
    '<polygon points="45,82 190,82 190,150 45,150" fill="#fff4dd" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<polygon points="45,82 94,42 239,42 190,82" fill="#fff9eb" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<polygon points="190,82 239,42 239,110 190,150" fill="#ffe5ad" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<line x1="45" y1="150" x2="94" y2="110" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'+
    '<line x1="94" y1="42" x2="94" y2="110" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'+
    '<line x1="94" y1="110" x2="239" y2="110" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'
  )));

  questions.push(solidQuestion(4,2,solidSvg('0 0 260 210',
    '<polygon points="67,60 145,60 145,162 67,162" fill="#fff4dd" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<polygon points="67,60 108,27 186,27 145,60" fill="#fff9eb" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<polygon points="145,60 186,27 186,129 145,162" fill="#ffe5ad" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<line x1="67" y1="162" x2="108" y2="129" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'+
    '<line x1="108" y1="27" x2="108" y2="129" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'+
    '<line x1="108" y1="129" x2="186" y2="129" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'
  )));

  questions.push(solidQuestion(5,3,solidSvg('0 0 310 200',
    '<polygon points="90,55 200,30 250,125 140,150" fill="#eef8ee"/>'+
    '<polygon points="45,150 140,150 250,125 155,125" fill="#d9f5d9"/>'+
    '<polygon points="90,55 45,150 140,150" fill="#f5fff5"/>'+
    '<polyline points="90,55 45,150 140,150 90,55" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<line x1="90" y1="55" x2="200" y2="30" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="140" y1="150" x2="250" y2="125" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="200" y1="30" x2="250" y2="125" stroke="#246b24" stroke-width="2.4"/>'+
    '<path d="M45 150 L155 125 M155 125 L200 30 M155 125 L250 125" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>'
  )));

  questions.push(solidQuestion(6,3,solidSvg('0 0 310 205',
    '<g transform="translate(310 0) scale(-1 1)">'+
    '<polygon points="90,55 200,30 250,125 140,150" fill="#eef8ee"/>'+
    '<polygon points="45,150 140,150 250,125 155,125" fill="#d9f5d9"/>'+
    '<polygon points="90,55 45,150 140,150" fill="#f5fff5"/>'+
    '<polyline points="90,55 45,150 140,150 90,55" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<line x1="90" y1="55" x2="200" y2="30" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="140" y1="150" x2="250" y2="125" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="200" y1="30" x2="250" y2="125" stroke="#246b24" stroke-width="2.4"/>'+
    '<path d="M45 150 L155 125 M155 125 L200 30 M155 125 L250 125" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>'+
    '</g>'
  )));

  questions.push(solidQuestion(7,4,solidSvg('0 0 250 210',
    '<path d="M55 55 L55 155 A70 25 0 0 0 195 155 L195 55 Z" fill="#e8f8ff"/>'+
    '<ellipse cx="125" cy="55" rx="70" ry="25" fill="#f0fbff" stroke="#006b8f" stroke-width="2.4"/>'+
    '<line x1="55" y1="55" x2="55" y2="155" stroke="#006b8f" stroke-width="2.4"/>'+
    '<line x1="195" y1="55" x2="195" y2="155" stroke="#006b8f" stroke-width="2.4"/>'+
    '<path d="M55 155 A70 25 0 0 0 195 155" fill="none" stroke="#006b8f" stroke-width="2.4"/>'+
    '<path d="M55 155 A70 25 0 0 1 195 155" fill="none" stroke="#006b8f" stroke-width="2.4"'+dash+'/>'
  )));

  questions.push(solidQuestion(8,4,solidSvg('0 0 250 250',
    '<g transform="rotate(90 125 125)">'+
    '<path d="M55 55 L55 155 A70 25 0 0 0 195 155 L195 55 Z" fill="#e8f8ff"/>'+
    '<ellipse cx="125" cy="55" rx="70" ry="25" fill="#f0fbff" stroke="#006b8f" stroke-width="2.4"/>'+
    '<line x1="55" y1="55" x2="55" y2="155" stroke="#006b8f" stroke-width="2.4"/>'+
    '<line x1="195" y1="55" x2="195" y2="155" stroke="#006b8f" stroke-width="2.4"/>'+
    '<path d="M55 155 A70 25 0 0 0 195 155" fill="none" stroke="#006b8f" stroke-width="2.4"/>'+
    '<path d="M55 155 A70 25 0 0 1 195 155" fill="none" stroke="#006b8f" stroke-width="2.4"'+dash+'/>'+
    '</g>'
  )));

  questions.push(solidQuestion(9,5,solidSvg('0 0 280 210',
    '<polygon points="68,148 138,174 231,150 151,123" fill="#fff0f0"/>'+
    '<polygon points="145,34 68,148 138,174" fill="#ffe1e1"/>'+
    '<polygon points="145,34 138,174 231,150" fill="#ffd0d0"/>'+
    '<line x1="145" y1="34" x2="68" y2="148" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="145" y1="34" x2="138" y2="174" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="145" y1="34" x2="231" y2="150" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="68" y1="148" x2="138" y2="174" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="138" y1="174" x2="231" y2="150" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="68" y1="148" x2="151" y2="123" stroke="#9c2f2f" stroke-width="2.4"'+dash+'/>'+
    '<line x1="151" y1="123" x2="231" y2="150" stroke="#9c2f2f" stroke-width="2.4"'+dash+'/>'+
    '<line x1="145" y1="34" x2="151" y2="123" stroke="#9c2f2f" stroke-width="2.4"'+dash+'/>'
  )));

  questions.push(solidQuestion(10,5,solidSvg('0 0 275 210',
    '<polygon points="48,154 224,154 132,181" fill="#fff0f0"/>'+
    '<polygon points="142,33 48,154 132,181" fill="#ffe1e1"/>'+
    '<polygon points="142,33 132,181 224,154" fill="#ffd0d0"/>'+
    '<line x1="142" y1="33" x2="48" y2="154" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="142" y1="33" x2="132" y2="181" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="142" y1="33" x2="224" y2="154" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="48" y1="154" x2="132" y2="181" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="132" y1="181" x2="224" y2="154" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<line x1="48" y1="154" x2="224" y2="154" stroke="#9c2f2f" stroke-width="2.4"'+dash+'/>'
  )));

  questions.push(solidQuestion(11,6,solidSvg('0 0 250 210',
    '<path d="M125 30 L65 158 A60 18 0 0 0 185 158 Z" fill="#f2e8ff"/>'+
    '<path d="M125 30 L65 158 M125 30 L185 158" fill="none" stroke="#7a3db8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="M65 158 A60 18 0 0 0 185 158" fill="none" stroke="#7a3db8" stroke-width="2.4" stroke-linecap="round"/>'+
    '<path d="M65 158 A60 18 0 0 1 185 158" fill="none" stroke="#7a3db8" stroke-width="2.4" stroke-linecap="round"'+dash+'/>'
  )));

  questions.push(solidQuestion(12,6,solidSvg('0 0 270 210',
    '<path d="M124 28 L52 160 A72 19 0 0 0 196 160 Z" fill="#f2e8ff"/>'+
    '<path d="M124 28 L52 160 M124 28 L196 160" fill="none" stroke="#7a3db8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="M52 160 A72 19 0 0 0 196 160" fill="none" stroke="#7a3db8" stroke-width="2.4" stroke-linecap="round"/>'+
    '<path d="M52 160 A72 19 0 0 1 196 160" fill="none" stroke="#7a3db8" stroke-width="2.4" stroke-linecap="round"'+dash+'/>'
  )));

  questions.push(solidQuestion(13,7,solidSvg('0 0 240 210',
    '<defs><radialGradient id="ballGlowA" cx="34%" cy="28%"><stop offset="0" stop-color="#fffde9"/><stop offset=".58" stop-color="#ffe889"/><stop offset="1" stop-color="#efb93f"/></radialGradient></defs>'+
    '<circle cx="120" cy="105" r="72" fill="url(#ballGlowA)" stroke="#9a6900" stroke-width="2.4"/>'+
    '<path d="M48 105 A72 24 0 0 0 192 105" fill="none" stroke="#9a6900" stroke-width="2"/>'+
    '<path d="M48 105 A72 24 0 0 1 192 105" fill="none" stroke="#9a6900" stroke-width="2"'+dash+'/>'+
    '<path d="M120 33 C86 55 86 155 120 177" fill="none" stroke="#b37c0b" stroke-width="1.8"/>'+
    '<path d="M120 33 C154 55 154 155 120 177" fill="none" stroke="#b37c0b" stroke-width="1.8"'+dash+'/>'
  ),'Quel est le nom le plus précis de cette figure de l’espace ?'));

  questions.push(solidQuestion(14,7,solidSvg('0 0 250 210',
    '<defs><radialGradient id="ballGlowB" cx="36%" cy="26%"><stop offset="0" stop-color="#f8ffff"/><stop offset=".6" stop-color="#b9ece8"/><stop offset="1" stop-color="#4fb5ad"/></radialGradient></defs>'+
    '<circle cx="125" cy="105" r="74" fill="url(#ballGlowB)" stroke="#116c67" stroke-width="2.4"/>'+
    '<path d="M51 105 A74 27 0 0 0 199 105" fill="none" stroke="#116c67" stroke-width="2"/>'+
    '<path d="M51 105 A74 27 0 0 1 199 105" fill="none" stroke="#116c67" stroke-width="2"'+dash+'/>'+
    '<path d="M125 31 C92 55 92 155 125 179" fill="none" stroke="#20857f" stroke-width="1.8"/>'+
    '<path d="M125 31 C158 55 158 155 125 179" fill="none" stroke="#20857f" stroke-width="1.8"'+dash+'/>'
  ),'Quel est le nom le plus précis de cette figure de l’espace ?'));

  const objectPrompt='Quel est le modèle géométrique le plus précis de cet objet ?';

  questions.push(solidQuestion(15,1,solidSvg('0 0 260 210',
    '<polygon points="65,70 150,70 150,155 65,155" fill="#fff" stroke="#294b70" stroke-width="2.4"/>'+
    '<polygon points="65,70 105,35 190,35 150,70" fill="#f4f7fb" stroke="#294b70" stroke-width="2.4"/>'+
    '<polygon points="150,70 190,35 190,120 150,155" fill="#dfe8f3" stroke="#294b70" stroke-width="2.4"/>'+
    '<circle cx="88" cy="92" r="5" fill="#17324f"/><circle cx="127" cy="132" r="5" fill="#17324f"/>'+
    '<circle cx="88" cy="132" r="5" fill="#17324f"/><circle cx="127" cy="92" r="5" fill="#17324f"/>'+
    '<circle cx="118" cy="50" r="4.5" fill="#17324f"/><circle cx="157" cy="50" r="4.5" fill="#17324f"/>'+
    '<circle cx="170" cy="77" r="4.5" fill="#17324f"/><circle cx="170" cy="112" r="4.5" fill="#17324f"/>'
  ),objectPrompt,'object'));

  questions.push(solidQuestion(16,2,solidSvg('0 0 270 215',
    '<polygon points="55,58 165,58 165,175 55,175" fill="#d9a86c" stroke="#6f451f" stroke-width="2.4"/>'+
    '<polygon points="55,58 95,30 205,30 165,58" fill="#eccb9e" stroke="#6f451f" stroke-width="2.4"/>'+
    '<polygon points="165,58 205,30 205,147 165,175" fill="#c98c4d" stroke="#6f451f" stroke-width="2.4"/>'+
    '<polygon points="100,30 123,30 83,58 61,58" fill="#f2dd9b" opacity=".9"/>'+
    '<rect x="75" y="91" width="70" height="43" rx="4" fill="#fff8e8" stroke="#8b6b42" stroke-width="1.5"/>'+
    '<path d="M84 104 H136 M84 114 H126 M84 124 H132" stroke="#b59a74" stroke-width="2"/>'
  ),objectPrompt,'object'));

  questions.push(solidQuestion(17,3,solidSvg('0 0 320 215',
    '<polygon points="38,170 172,170 277,150 143,150" fill="#f7c98f"/>'+
    '<polygon points="105,55 210,35 277,150 172,170" fill="#ef8f3c"/>'+
    '<polygon points="38,170 105,55 172,170" fill="#f7b267"/>'+
    '<polyline points="38,170 105,55 172,170 38,170" fill="none" stroke="#7a3c12" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<line x1="105" y1="55" x2="210" y2="35" stroke="#7a3c12" stroke-width="2.4"/>'+
    '<line x1="172" y1="170" x2="277" y2="150" stroke="#7a3c12" stroke-width="2.4"/>'+
    '<polyline points="210,35 277,150 172,170" fill="none" stroke="#7a3c12" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<path d="M38 170 L143 150 M143 150 L210 35 M143 150 L277 150" fill="none" stroke="#7a3c12" stroke-width="2.2" stroke-dasharray="6 5" stroke-linecap="round"/>'+
    '<path d="M105 55 L105 170 M72 170 L105 112 L138 170" fill="none" stroke="#8d4a19" stroke-width="2"/>'+
    '<path d="M25 180 H300" stroke="#5f7a38" stroke-width="3" stroke-linecap="round"/>'
  ),objectPrompt,'object'));

  questions.push(solidQuestion(18,4,solidSvg('0 0 250 215',
    '<path d="M62 55 L62 163 A63 20 0 0 0 188 163 L188 55 Z" fill="#d9ecf2" stroke="#35687a" stroke-width="2.4"/>'+
    '<ellipse cx="125" cy="55" rx="63" ry="20" fill="#eef8fb" stroke="#35687a" stroke-width="2.4"/>'+
    '<ellipse cx="125" cy="55" rx="49" ry="13" fill="none" stroke="#91afba" stroke-width="1.5"/>'+
    '<path d="M62 88 C96 94 154 94 188 88 L188 139 C154 145 96 145 62 139 Z" fill="#f6d9a4" stroke="#a35d2f" stroke-width="1.6"/>'+
    '<circle cx="88" cy="116" r="14" fill="#df4738" stroke="#a52f26" stroke-width="1.4"/>'+
    '<path d="M88 101 L91 108 L99 106 L94 112 L99 117 L91 115 L88 123 L85 115 L77 117 L82 112 L77 106 L85 108 Z" fill="#3d8a42"/>'+
    '<rect x="109" y="101" width="67" height="31" rx="6" fill="#c94335"/>'+
    '<text x="142.5" y="121" text-anchor="middle" font-family="Arial, sans-serif" font-size="12.5" font-weight="700" letter-spacing=".5" fill="white">TOMATES</text>'+
    '<path d="M62 163 A63 20 0 0 0 188 163" fill="#c9dfe7" stroke="#35687a" stroke-width="2.4"/>'
  ),objectPrompt,'object'));

  questions.push(solidQuestion(19,5,solidSvg('0 0 280 215',
    '<path d="M32 181 H250" stroke="#d9b46d" stroke-width="5" stroke-linecap="round"/>'+
    '<polygon points="140,27 42,176 238,176" fill="#e6c47a" stroke="#7e5a22" stroke-width="2.4"/>'+
    '<polygon points="140,27 238,176 164,161" fill="#c99c4b" opacity=".72"/>'+
    '<path d="M71 132 H214 M88 106 H197 M105 80 H180 M122 54 H163" stroke="#b1843f" stroke-width="1.7"/>'+
    '<path d="M140 27 L164 161 L238 176" fill="none" stroke="#7e5a22" stroke-width="2.2"/>'
  ),objectPrompt,'object'));

  questions.push(solidQuestion(20,6,solidSvg('0 0 250 215',
    '<circle cx="125" cy="28" r="11" fill="#ffcf4a" stroke="#8a5a00" stroke-width="2"/>'+
    '<path d="M125 38 L62 165 A63 18 0 0 0 188 165 Z" fill="#9b72cf" stroke="#56308c" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<path d="M62 165 A63 18 0 0 0 188 165" fill="#7f55b8" stroke="#56308c" stroke-width="2.4"/>'+
    '<circle cx="103" cy="92" r="6" fill="#ffd95f"/><circle cx="145" cy="112" r="6" fill="#66d2ca"/>'+
    '<circle cx="95" cy="139" r="5" fill="#ff7d71"/><circle cx="150" cy="71" r="5" fill="#ff7d71"/>'
  ),objectPrompt,'object'));

  questions.push(solidQuestion(21,7,
    '<div class="solid-emoji" role="img" aria-label="Ballon de football">⚽</div>',
    'Par quelle surface géométrique peut-on modéliser l’enveloppe de ce ballon ?','object'
  ));

  questions.push(solidCountQuestion(22,solidSvg('0 0 260 200',
    '<polygon points="75,75 155,75 155,155 75,155" fill="#e8f2ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<polygon points="75,75 115,35 195,35 155,75" fill="#f4f9ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<polygon points="155,75 195,35 195,115 155,155" fill="#d7e8ff" stroke="'+edge+'" stroke-width="2.4"/>'+
    '<path d="M75 155 L115 115 L115 35 M115 115 L195 115" fill="none" stroke="'+edge+'" stroke-width="2.4"'+dash+'/>'
  ),8,12,6));

  questions.push(solidCountQuestion(23,solidSvg('0 0 300 200',
    '<polygon points="45,82 190,82 190,150 45,150" fill="#fff4dd" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<polygon points="45,82 94,42 239,42 190,82" fill="#fff9eb" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<polygon points="190,82 239,42 239,110 190,150" fill="#ffe5ad" stroke="#8a5a00" stroke-width="2.4"/>'+
    '<path d="M45 150 L94 110 L94 42 M94 110 L239 110" fill="none" stroke="#8a5a00" stroke-width="2.4"'+dash+'/>'
  ),8,12,6));

  questions.push(solidCountQuestion(24,solidSvg('0 0 310 200',
    '<polygon points="90,55 200,30 250,125 140,150" fill="#eef8ee"/>'+
    '<polygon points="45,150 140,150 250,125 155,125" fill="#d9f5d9"/>'+
    '<polygon points="90,55 45,150 140,150" fill="#f5fff5"/>'+
    '<polyline points="90,55 45,150 140,150 90,55" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<line x1="90" y1="55" x2="200" y2="30" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="140" y1="150" x2="250" y2="125" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="200" y1="30" x2="250" y2="125" stroke="#246b24" stroke-width="2.4"/>'+
    '<path d="M45 150 L155 125 M155 125 L200 30 M155 125 L250 125" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>'
  ),6,9,5));

  questions.push(solidCountQuestion(25,solidSvg('0 0 280 210',
    '<polygon points="68,148 138,174 231,150 151,123" fill="#fff0f0"/>'+
    '<polygon points="145,34 68,148 138,174" fill="#ffe1e1"/>'+
    '<polygon points="145,34 138,174 231,150" fill="#ffd0d0"/>'+
    '<path d="M145 34 L68 148 L138 174 L231 150 L145 34 M145 34 L138 174" fill="none" stroke="#9c2f2f" stroke-width="2.4"/>'+
    '<path d="M68 148 L151 123 L231 150 M145 34 L151 123" fill="none" stroke="#9c2f2f" stroke-width="2.4"'+dash+'/>'
  ),5,8,5));

  questions.push(solidQuestion(26,5,solidSvg('0 0 290 220',
    '<polygon points="52,151 132,185 232,156 174,128 103,126" fill="#fff0f0"/>'+
    '<polygon points="145,31 52,151 132,185" fill="#ffe1e1"/>'+
    '<polygon points="145,31 132,185 232,156" fill="#ffd0d0"/>'+
    '<polygon points="145,31 232,156 174,128" fill="#ffc4c4"/>'+
    '<path d="M145 31 L52 151 L132 185 L232 156 L145 31 M145 31 L132 185" fill="none" stroke="#9c2f2f" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<line x1="232" y1="156" x2="174" y2="128" stroke="#9c2f2f" stroke-width="2.4"'+dash+'/>'+
    '<path d="M52 151 L103 126 L174 128 M145 31 L103 126 M145 31 L174 128" fill="none" stroke="#9c2f2f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>'
  )));

  questions.push(solidQuestion(27,3,solidSvg('0 0 310 205',
    '<polygon points="62,78 96,42 140,60 132,113 82,128" fill="#f5fff5"/>'+
    '<polygon points="96,42 210,27 254,45 140,60" fill="#eef8ee"/>'+
    '<polygon points="140,60 254,45 246,98 132,113" fill="#e1f5e1"/>'+
    '<polygon points="132,113 246,98 196,113 82,128" fill="#d9f5d9"/>'+
    '<polygon points="62,78 96,42 140,60 132,113 82,128" fill="none" stroke="#246b24" stroke-width="2.8" stroke-linejoin="round"/>'+
    '<line x1="96" y1="42" x2="210" y2="27" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="140" y1="60" x2="254" y2="45" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="132" y1="113" x2="246" y2="98" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="246" y1="98" x2="196" y2="113" stroke="#246b24" stroke-width="2.4"/>'+
    '<line x1="82" y1="128" x2="196" y2="113" stroke="#246b24" stroke-width="2.4"/>'+
    '<polyline points="210,27 254,45 246,98" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<path d="M62 78 L176 63 M176 63 L210 27 M176 63 L196 113" fill="none" stroke="#246b24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>'
  )));

  const visualFromQuestion=n=>{
    const source=questions.find(q=>q.n===n);
    const match=source&&source.statement.match(/<svg[\s\S]*?<\/svg>/i);
    return match?match[0]:'';
  };

  questions.push(solidCountQuestion(28,visualFromQuestion(27),10,15,7));
  questions.push(solidCountQuestion(29,visualFromQuestion(10),4,6,4));
  questions.push(solidCountQuestion(30,visualFromQuestion(26),6,10,6));

  questions.push(solidQuestion(31,1,visualFromQuestion(15),
    'Quel est le modèle géométrique le plus précis de ce dé ?','object'
  ));
  questions.push(solidQuestion(32,2,
    '<div class="solid-emoji" role="img" aria-label="Livre fermé">📕</div>',
    objectPrompt,'object'
  ));
  questions.push(solidQuestion(33,4,
    '<div class="solid-emoji" role="img" aria-label="Tambour">🥁</div>',
    objectPrompt,'object'
  ));
  questions.push(solidQuestion(34,6,
    '<div class="solid-emoji" role="img" aria-label="Cornet de glace">🍦</div>',
    'Par quel solide géométrique peut-on modéliser le cornet ?','object'
  ));

  questions.push(solidQuestion(35,8,
    '<div class="solid-emoji" role="img" aria-label="Orange entière">🍊</div>',
    'Par quel solide géométrique peut-on modéliser cette orange entière ?','object'
  ));

  mod.questions=questions;
}
configureSolidsModule();

function configureAreaModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_22');
  if(!mod) return;
  mod.title='Aires : rectangle, carré, triangle et disque';
  const template=(n,kind,category,visual=true)=>({
    n,
    statement:'',
    answer:'[]',
    options:{
      area_kind:kind,
      area_category:category,
      area_visual:visual,
      area_format:'direct'
    },
    footer:''
  });
  mod.questions=[
    template(1,'rectangle_visual','rectangle',true),
    template(2,'rectangle_text','rectangle',false),
    template(3,'square_visual','square',true),
    template(4,'square_text','square',false),
    template(5,'triangle_general_visual','triangle',true),
    template(6,'triangle_general_text','triangle',false),
    template(7,'triangle_right_visual','triangle',true),
    template(8,'triangle_right_text','triangle',false),
    template(9,'disk_radius_approx_visual','disk',true),
    template(10,'disk_diameter_approx_visual','disk',true),
    template(11,'disk_exact_visual','disk',true),
    template(12,'composite_facade_visual','composite',true),
    template(13,'composite_two_rectangles_visual','composite',true),
    template(14,'composite_rectangle_square_visual','composite',true),
    template(15,'composite_square_roof_visual','composite',true),
    template(16,'rectangle_diagonal_visual','rectangle',true),
    template(17,'triangle_sides_height_visual','triangle',true),
    template(18,'formula_recognition','formula',true)
  ];
}
configureAreaModule();

function configureEquationModule(){
  const mod=RAW_MODULES.find(m=>m.id==='dnb_13');
  if(!mod) return;
  mod.title='Résoudre des équations';
  const template=(n,kind)=>({
    n,
    statement:'',
    answer:'[]',
    options:{equation_kind:kind},
    footer:''
  });
  mod.questions=[
    template(1,'mul_positive'),
    template(2,'add_positive'),
    template(3,'sub_positive'),
    template(4,'affine_positive'),
    template(5,'mul_signed'),
    template(6,'affine_signed'),
    template(7,'two_sided'),
    template(8,'opposite_one_side'),
    template(9,'qcm_solution'),
    template(10,'qcm_operation'),
    template(11,'taxi_problem'),
    template(12,'think_number')
  ];
}
configureEquationModule();
