(function registerScientificGenerator(global){
  // Générateur de dnb_06 « Notation scientifique » (refonte du 08/10/2026).
  // Les nombres sont fabriqués chiffre par chiffre (jamais de calcul en virgule
  // flottante) : une suite de chiffres significatifs D et un exposant e donnent
  // la notation scientifique (D[0],D[1…] × 10^e) et l'écriture décimale.
  // Formes du brevet 2026 (6 questions sur 80) : grands nombres (45 310,
  // 1 200 000, 311 200 000) et petits nombres (0,00458 ; 0,000457 ; 0,00647),
  // en réponse courte ou en QCM dont les pièges sont une mantisse hors de
  // [1 ; 10[ et un exposant de signe inversé. Sujets de référence 2027 : calculs
  // avec des puissances de 10 (100³ × 10⁻² ; 3,1 × 10² − 5 × 10 + 2,1 × 10⁻¹).
  // Chaque instance porte sa correction (1 à 3 lignes), son aide (2 indices,
  // jamais la réponse, et un dessin), une phrase par piège des QCM.
  const NB=' ';       // espace insécable (avant ? : ;)
  const FINE=' ';     // espace fine insécable (milliers)
  const MINUS='−';

  // ── Écriture des nombres ────────────────────────────────────────────────
  function group(integer){
    return integer.length>=4?integer.replace(/\B(?=(\d{3})+(?!\d))/g,FINE):integer;
  }
  // Chiffres D, p chiffres avant la virgule : dec('452',-2) = « 0,00452 »,
  // dec('896',5) = « 89 600 », dec('4531',2) = « 45,31 ».
  function dec(D,p){
    let integer,decimals;
    if(p<=0){integer='0';decimals='0'.repeat(-p)+D;}
    else if(p>=D.length){integer=D+'0'.repeat(p-D.length);decimals='';}
    else{integer=D.slice(0,p);decimals=D.slice(p);}
    return group(integer)+(decimals?','+decimals:'');
  }
  function mant(D){return dec(D,1);}
  // Valeur de D × 10^e écrite en décimal (D lu comme D[0],D[1…]).
  function value(D,e){return dec(D,e+1);}
  function sgn(n){return (n<0?MINUS:'')+Math.abs(n);}
  function pw(n){return '10<sup>'+sgn(n)+'</sup>';}
  function sci(D,e){return mant(D)+' × '+pw(e);}
  // 10^e en écriture décimale : 10 000 ; 0,001.
  function unit(e){return e>=0?group('1'+'0'.repeat(e)):'0,'+'0'.repeat(-e-1)+'1';}
  function strong(text){return '<strong>'+text+'</strong>';}
  // Écriture « LaTeX » d'un nombre pour le pied (renderPlaceholders).
  function tex(text){return text.replace(/,/g,'{,}').replace(new RegExp(FINE,'g'),'\\,');}
  function texPow(n){return '10^{'+sgn(n)+'}';}
  const PLACES={9:'milliards',8:'centaines de millions',7:'dizaines de millions',6:'millions',
    5:'centaines de mille',4:'dizaines de mille',3:'unités de mille',2:'centaines',1:'dizaines',0:'unités',
    '-1':'dixièmes','-2':'centièmes','-3':'millièmes','-4':'dix-millièmes','-5':'cent-millièmes',
    '-6':'millionièmes','-7':'dix-millionièmes'};
  function letter(index){return String.fromCharCode(65+index);}

  // ── Tirages ─────────────────────────────────────────────────────────────
  function choose(list,randomInt){return list[randomInt(0,list.length-1)];}
  function weighted(pairs,randomInt){
    const total=pairs.reduce((sum,pair)=>sum+pair[1],0);
    let draw=randomInt(1,total);
    for(const [item,weight] of pairs){draw-=weight;if(draw<=0) return item;}
    return pairs[0][0];
  }
  // s chiffres significatifs : le premier et le dernier ne sont jamais 0.
  function digits(s,randomInt){
    if(s<=1) return String(randomInt(1,9));
    let D=String(randomInt(1,9));
    for(let i=1;i<s-1;i++) D+=String(randomInt(0,9));
    return D+String(randomInt(1,9));
  }
  // Grand nombre (e ≥ 2) : un entier, comme au brevet (45 310 ; 1 200 000).
  function bigDigits(e,randomInt){
    const s=Math.min(e+1,weighted([[1,1],[2,4],[3,4],[4,3]],randomInt));
    return digits(s,randomInt);
  }
  function smallDigits(randomInt){return digits(weighted([[1,1],[2,4],[3,5]],randomInt),randomInt);}

  // ── Aide : le nombre avec son premier chiffre non nul encadré ───────────
  // (HTML avec styles en ligne : le dessin est montré dans le panneau Aide.)
  function firstDigitDrawing(D,e){
    const text=value(D,e);
    let html='',done=false;
    for(const ch of text){
      if(!done&&/[1-9]/.test(ch)){
        done=true;
        html+='<span style="position:relative;display:inline-block;padding:0 .08em;outline:3px dashed #c2410c;outline-offset:.04em;border-radius:.08em">'+ch
          +'<span style="position:absolute;left:50%;top:calc(100% + .32em);transform:translateX(-50%);white-space:nowrap;font:700 .36em/1.1 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#9a3412">↑ premier chiffre non nul</span></span>';
      }else html+=ch===FINE?'<span style="display:inline-block;width:.22em"></span>':ch;
    }
    return '<div style="display:flex;justify-content:center;padding:.15em .6em 1.15em;font:800 clamp(1.9rem,8vw,2.6rem)/1.1 Cambria Math,STIX Two Math,Times New Roman,serif;color:#17384d">'
      +'<span role="img" aria-label="'+text.replace(new RegExp(FINE,'g'),' ')+' : le premier chiffre non nul est encadré">'+html+'</span></div>';
  }
  // Tableau de glissement (sens inverse) : ligne du haut, les chiffres de a ;
  // ligne du bas vide (c'est l'élève qui fait glisser les chiffres).
  // Seules les colonnes utiles sont dessinées : le tableau reste lisible au
  // téléphone (en-têtes à 15 px au moins pour 390 px de large).
  function glideDrawing(D,e){
    const lowPower=Math.min(-(D.length-1),e-(D.length-1),e<0?e:0);
    const highPower=Math.max(0,e);
    const powers=[];
    for(let p=highPower;p>=lowPower;p--) powers.push(p);
    const cellW=46,x0=6,headH=34,rowH=50,y0=6;
    const W=x0*2+cellW*powers.length,H=y0+headH+rowH*2+6;
    const colX=p=>x0+(powers.indexOf(p)+.5)*cellW;
    let body='';
    powers.forEach((p,i)=>{
      const x=x0+i*cellW;
      body+='<rect x="'+x+'" y="'+y0+'" width="'+cellW+'" height="'+headH+'" fill="#f3f7fd" stroke="#9fb3cf" stroke-width="1.3"/>';
      const label=p===0?'1':(p===1?'10':'10<tspan dy="-8" font-size="14">'+sgn(p)+'</tspan>');
      body+='<text x="'+(x+cellW/2)+'" y="'+(y0+24)+'" font-family="Arial, sans-serif" font-size="19" font-weight="700" text-anchor="middle" fill="#3b4b63">'+label+'</text>';
      body+='<rect x="'+x+'" y="'+(y0+headH)+'" width="'+cellW+'" height="'+rowH+'" fill="#eaf3ff" stroke="#1f5f99" stroke-width="1.5"/>';
      body+='<rect x="'+x+'" y="'+(y0+headH+rowH)+'" width="'+cellW+'" height="'+rowH+'" fill="#fbfdff" stroke="#9fb3cf" stroke-width="1.5" stroke-dasharray="5 4"/>';
    });
    // La virgule, entre la colonne des unités et celle des dixièmes, sur les deux lignes.
    const commaX=x0+(powers.indexOf(0)+1)*cellW;
    [y0+headH,y0+headH+rowH].forEach(rowY=>{
      body+='<circle cx="'+commaX+'" cy="'+(rowY+33)+'" r="4" fill="#c2410c"/><path d="M '+(commaX+1)+' '+(rowY+36)+' Q '+commaX+' '+(rowY+44)+' '+(commaX-6)+' '+(rowY+47)+'" fill="none" stroke="#c2410c" stroke-width="3.2" stroke-linecap="round"/>';
    });
    [...D].forEach((digit,i)=>{
      body+='<text x="'+colX(-i)+'" y="'+(y0+headH+35)+'" font-family="Cambria Math, STIX Two Math, Times New Roman, serif" font-size="30" font-weight="800" text-anchor="middle" fill="#17384d">'+digit+'</text>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" style="display:block;width:100%;max-width:'+Math.round(W*1.25)+'px;height:auto;margin:0 auto" role="img" aria-label="Tableau : les chiffres de '+mant(D)+' sur la ligne du haut, la ligne du bas est à remplir">'+body+'</svg>';
  }

  // ── Instance commune ────────────────────────────────────────────────────
  // fields : prompt (HTML de la consigne), footer (LaTeX avec [[dots]]),
  // answers (une valeur par case), template (écriture de la réponse de l'élève),
  // expected (bonne réponse écrite comme en maths), options (QCM), steps, note,
  // aide, aideHtml.
  function base(module,question,kind,fields){
    const answers=(fields.answers||[]).map(String);
    const instance={
      module,q:question,scope:{kind},
      answers:fields.options?[String(fields.correctIndex)]:answers,
      answerChoices:fields.options?[[String(fields.correctIndex)]]:answers.map(item=>[item]),
      rawStatement:fields.statement||'',rawFooter:fields.footer||'',hasSvg:false,
      scientific:{kind,prompt:fields.prompt,footer:fields.footer||'',options:fields.options||null,
        correctIndex:fields.correctIndex||null,slotLabels:fields.slotLabels||null,
        answerTemplate:fields.template||'',expectedDisplay:fields.expected||''},
      correctionSteps:fields.steps,
      correctionNote:fields.note||'',
      distractorFeedback:null,
      aideSteps:fields.aide||[],
      aideHtml:fields.aideHtml||''
    };
    if(fields.options){
      const feedback={};
      fields.options.forEach((option,index)=>{if(option.feedback) feedback[String(index+1)]=option.feedback;});
      instance.distractorFeedback=Object.keys(feedback).length?feedback:null;
    }
    return instance;
  }
  // Texte brut de l'énoncé (liste « À revoir », suivi).
  function plain(html){return String(html).replace(/<sup>([^<]*)<\/sup>/g,'^$1').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}

  // ── Écriture décimale → notation scientifique (types 1 à 7, 12) ─────────
  function toScientificFields(D,e,prompt){
    const N=value(D,e),M=mant(D);
    const big=e>0;
    return {
      prompt,
      statement:plain(prompt),
      footer:'$$'+tex(N)+'\\,=\\,[[dots]]\\,\\times\\,10^{[[dots]]}$$',
      answers:[M,sgn(e)],
      slotLabels:['Nombre devant × 10','Exposant'],
      template:'{0} × 10<sup>{1}</sup>',
      expected:sci(D,e),
      steps:[
        'Un seul chiffre non nul avant la virgule'+NB+': '+M,
        N+' = '+M+' × '+unit(e),
        N+' = '+strong(sci(D,e))
      ],
      note:big?N+' est plus grand que 10'+NB+': l’exposant est positif.':N+' est entre 0 et 1'+NB+': l’exposant est négatif.',
      aide:[
        'Place la virgule juste après le premier chiffre non nul'+NB+': le nombre devant × 10 doit être entre 1 et 10.',
        'Le '+D[0]+' est le chiffre des '+PLACES[String(e)]+NB+': '+value(D[0],e)+' = '+D[0]+' × '+unit(e)+'.'
      ],
      aideHtml:firstDigitDrawing(D,e)
    };
  }
  function toScientific(module,question,randomInt){
    const range=question.options.exponents||[2,3];
    const e=randomInt(range[0],range[1]);
    const D=e>0?bigDigits(e,randomInt):smallDigits(randomInt);
    const N=value(D,e);
    return base(module,question,'to_scientific',toScientificFields(D,e,'Donne la notation scientifique de '+N+'.'));
  }

  // ── Contexte (type 12) : distances, tailles, populations ────────────────
  // Valeurs vérifiées (ordres de grandeur courants des manuels).
  const CONTEXTS=Object.freeze([
    {D:'3112',e:8,text:'La distance entre la Terre et Mars est environ égale à @ km.'},
    {D:'3844',e:5,text:'La Lune est à environ @ km de la Terre.'},
    {D:'15',e:8,text:'Le Soleil est à environ @ km de la Terre.'},
    {D:'139',e:6,text:'Le diamètre du Soleil est d’environ @ km.'},
    {D:'81',e:9,text:'La Terre compte environ @ habitants.'},
    {D:'3',e:5,text:'La lumière parcourt environ @ km en une seconde.'},
    {D:'7056',e:7,text:'L’océan Indien a une superficie d’environ @ km².'},
    {D:'94',e:3,text:'Saint-Denis de La Réunion est à environ @ km de Paris.'},
    {D:'307',e:3,text:'Le piton des Neiges culmine à environ @ m.'},
    {D:'1',e:5,text:'Un cœur humain bat environ @ fois par jour.'},
    {D:'1',e:-4,text:'Une feuille de papier a une épaisseur d’environ @ m.'},
    {D:'7',e:-5,text:'Un cheveu a un diamètre d’environ @ m.'},
    {D:'2',e:-4,text:'Un grain de sable fin mesure environ @ m.'},
    {D:'5',e:-5,text:'Une goutte d’eau a une masse d’environ @ kg.'},
    {D:'2',e:-6,text:'Une bactérie mesure environ @ m.'},
    {D:'1',e:-7,text:'Un virus de la grippe mesure environ @ m.'}
  ]);
  function context(module,question,randomInt){
    const item=choose(CONTEXTS,randomInt);
    const N=value(item.D,item.e);
    const sentence=item.text.replace('@',N);
    const prompt=sentence+'<br>Donne la notation scientifique de '+N+'.';
    return base(module,question,'context',toScientificFields(item.D,item.e,prompt));
  }

  // ── Notation scientifique → écriture décimale (types 8 et 11) ───────────
  function fromScientific(module,question,randomInt){
    const range=question.options.exponents||[2,6];
    const e=randomInt(range[0],range[1]);
    const D=digits(weighted([[1,1],[2,5],[3,3]],randomInt),randomInt);
    const M=mant(D),N=value(D,e),left=e>0;
    const n=Math.abs(e),rangs=n+' rang'+(n>1?'s':'');
    const S=M+' × '+pw(e);
    return base(module,question,'from_scientific',{
      prompt:'Donne l’écriture décimale de '+S+'.',
      statement:plain('Donne l’écriture décimale de '+S+'.'),
      footer:'$$'+tex(M)+'\\,\\times\\,'+texPow(e)+'\\,=\\,[[dots]]$$',
      answers:[N],
      slotLabels:['Écriture décimale'],
      expected:N,
      steps:[
        '× '+pw(e)+NB+': les chiffres glissent de '+rangs+' vers la '+(left?'gauche.':'droite.'),
        S+' = '+M+' × '+unit(e)+' = '+strong(N)
      ],
      aide:[
        'Avec × 10<sup>n</sup>, les chiffres glissent de n rangs'+NB+': vers la gauche si n est positif, vers la droite si n est négatif.',
        'Ici, × '+pw(e)+NB+': '+rangs+' vers la '+(left?'gauche.':'droite.')
      ],
      aideHtml:glideDrawing(D,e)
    });
  }

  // ── QCM : choisir la notation scientifique (type 9) ─────────────────────
  // Pièges du brevet : même valeur mais nombre hors de [1 ; 10[ (45,31 × 10³,
  // 4531 × 10¹, 458 × 10⁻⁵, 0,647 × 10⁻²), signe de l'exposant inversé
  // (4,58 × 10³), exposant décalé d'un rang (6,47 × 10⁻²), 458 × 10⁻³.
  function chooseQcm(module,question,randomInt,shuffle){
    const small=randomInt(0,1)===1;
    const e=small?randomInt(-5,-2):randomInt(3,8);
    const D=digits(small?randomInt(2,3):randomInt(3,Math.min(4,e+1)),randomInt);
    const N=value(D,e),M=mant(D),len=D.length;
    const option=(text,feedback,kind)=>({text,feedback,kind});
    const sameValue=[
      option(dec(D,2)+' × '+pw(e-1),dec(D,2)+' × '+pw(e-1)+' vaut bien '+N+', mais '+dec(D,2)+' n’est pas entre 1 et 10.','plus-de-10'),
      option(dec(D,0)+' × '+pw(e+1),dec(D,0)+' × '+pw(e+1)+' vaut bien '+N+', mais '+dec(D,0)+' est plus petit que 1.','moins-de-1'),
      option(D+' × '+pw(e-len+1),D+' × '+pw(e-len+1)+' vaut bien '+N+', mais '+D+' n’est pas entre 1 et 10.','entier')
    ];
    const signFeedback=small
      ?M+' × '+pw(-e)+' = '+value(D,-e)+'. '+N+' est entre 0 et 1'+NB+': l’exposant est négatif.'
      :M+' × '+pw(-e)+' = '+value(D,-e)+'. '+N+' est plus grand que 10'+NB+': l’exposant est positif.';
    const others=[
      option(M+' × '+pw(-e),signFeedback,'signe'),
      option(M+' × '+pw(e+1),M+' × '+pw(e+1)+' = '+value(D,e+1)+', pas '+N+'.','rang'),
      option(M+' × '+pw(e-1),M+' × '+pw(e-1)+' = '+value(D,e-1)+', pas '+N+'.','rang'),
      option(D+' × '+pw(e),D+' n’est pas entre 1 et 10 (et '+D+' × '+pw(e)+' n’est pas '+N+').','entier-faux')
    ];
    // Toujours au moins un piège « même valeur » ; le signe inversé 4 fois sur 5.
    let traps=[];
    const sv=shuffle(sameValue.filter(item=>item.text!==M+' × '+pw(e)));
    traps.push(sv[0]);
    if(randomInt(1,5)<=4) traps.push(others[0]);
    const pool=shuffle([...sv.slice(1),...others.slice(1)]);
    for(const item of pool){
      if(traps.length>=3) break;
      if(traps.some(t=>t.text===item.text)||item.text===M+' × '+pw(e)) continue;
      if(item.kind==='rang'&&traps.some(t=>t.kind==='rang')) continue;
      traps.push(item);
    }
    const correct=option(sci(D,e),null,'juste');
    const order=shuffle([correct,...traps]);
    const correctIndex=order.indexOf(correct)+1;
    const prompt='Quelle est la notation scientifique de '+N+NB+'?';
    return base(module,question,'choose_qcm',{
      prompt,statement:plain(prompt),
      options:order.map(item=>({html:item.text,feedback:item.feedback,errorCode:item.kind})),
      correctIndex,
      steps:[
        M+' est entre 1 et 10'+NB+': '+N+' = '+M+' × '+unit(e),
        N+' = '+strong(sci(D,e))+NB+': réponse '+strong(letter(correctIndex-1))
      ],
      aide:[
        'Élimine les écritures dont le nombre devant × 10 n’est pas entre 1 et 10.',
        small?N+' est entre 0 et 1'+NB+': l’exposant est négatif.':N+' est plus grand que 10'+NB+': l’exposant est positif.'
      ],
      aideHtml:firstDigitDrawing(D,e)
    });
  }

  // ── QCM : laquelle est une notation scientifique ? (type 10) ────────────
  function recognizeQcm(module,question,randomInt,shuffle){
    const exponent=()=>{const n=randomInt(2,7);return randomInt(0,1)?n:-n;};
    // Le nombre devant × 10 de la bonne réponse : 1 à 3 chiffres, 1 ≤ a < 10.
    const good=digits(randomInt(1,3),randomInt);
    const correct={text:mant(good)+' × '+pw(exponent()),feedback:null,kind:'juste'};
    const big=digits(randomInt(2,3),randomInt),tiny=digits(randomInt(1,2),randomInt),whole=digits(randomInt(2,3),randomInt);
    const kinds=[
      {text:dec(big,2)+' × '+pw(exponent()),feedback:dec(big,2)+' n’est pas entre 1 et 10.',hint:dec(big,2)+' est plus grand que 10.',kind:'plus-de-10'},
      {text:dec(tiny,0)+' × '+pw(exponent()),feedback:dec(tiny,0)+' est plus petit que 1'+NB+': il faut un chiffre non nul avant la virgule.',hint:dec(tiny,0)+' est plus petit que 1.',kind:'moins-de-1'},
      {text:whole+' × '+pw(exponent()),feedback:whole+' n’est pas entre 1 et 10.',hint:whole+' est plus grand que 10.',kind:'entier'},
      {text:'10 × '+pw(exponent()),feedback:'10 ne convient pas'+NB+': le nombre devant × 10 doit être plus petit que 10.',hint:'10 n’est pas plus petit que 10.',kind:'dix'}
    ];
    // Les deux pièges les plus fréquents (plus de 10, moins de 1) sont toujours là.
    const third=choose(kinds.slice(2),randomInt);
    const traps=[kinds[0],kinds[1],third];
    const order=shuffle([correct,...traps]);
    const correctIndex=order.indexOf(correct)+1;
    const a=mant(good);
    const firstTrap=order.find(item=>item!==correct);
    const prompt='Laquelle de ces écritures est une notation scientifique'+NB+'?';
    return base(module,question,'recognize_qcm',{
      prompt,statement:plain(prompt),
      options:order.map(item=>({html:item.text,feedback:item.feedback,errorCode:item.kind})),
      correctIndex,
      steps:[
        'Le nombre devant × 10 doit être entre 1 et 10 (1 ≤ a &lt; 10).',
        'Seul '+a+' convient'+NB+': réponse '+strong(letter(correctIndex-1))+'.'
      ],
      note:'L’exposant peut être positif ou négatif.',
      aide:[
        'Regarde seulement le nombre devant × 10'+NB+': il doit être entre 1 et 10 (10 exclu).',
        firstTrap.text+' ne convient pas'+NB+': '+firstTrap.hint
      ]
    });
  }

  // ── Compléter la puissance de 10 (type 13, « 1 200 = 1,2 × … ») ─────────
  function completePower(module,question,randomInt){
    const e=weighted([[-4,1],[-3,2],[-2,2],[-1,1],[1,1],[2,2],[3,3],[4,2],[5,2],[6,1]],randomInt);
    const D=digits(weighted([[2,3],[3,2]],randomInt),randomInt);
    const M=mant(D),N=value(D,e);
    const prompt='Complète pour écrire '+N+' en notation scientifique.';
    return base(module,question,'complete_power',{
      prompt,statement:plain(prompt),
      footer:'$$'+tex(N)+'\\,=\\,'+tex(M)+'\\,\\times\\,10^{[[dots]]}$$',
      answers:[sgn(e)],
      slotLabels:['Exposant'],
      template:M+' × 10<sup>{0}</sup>',
      expected:sci(D,e),
      steps:[N+' = '+M+' × '+unit(e),unit(e)+' = '+pw(e),N+' = '+M+' × '+strong(pw(e))],
      aide:[
        'Cherche par quel nombre il faut multiplier '+M+' pour obtenir '+N+'.',
        '10 = 10<sup>1</sup>'+NB+'; 100 = 10<sup>2</sup>'+NB+'; 0,1 = 10<sup>'+MINUS+'1</sup>'+NB+'; 0,01 = 10<sup>'+MINUS+'2</sup>'
      ]
    });
  }

  // ── Puissance de 10 (type 14, sujet de référence R2 2) ──────────────────
  // Calcul par la définition (le programme n'attend pas les formules) :
  // chaque puissance est écrite en décimal, puis on multiplie.
  function powerOfTen(module,question,randomInt){
    let form,a,b,k,result,tries=0;
    do{
      form=weighted([['produit',4],['nombre',3],['cent',3]],randomInt);
      b=randomInt(0,2)?-randomInt(1,5):randomInt(1,3);
      if(form==='produit'){a=randomInt(2,6);result=a+b;}
      else if(form==='nombre'){a=randomInt(2,4);result=a+b;}
      else{k=randomInt(2,3);a=2*k;result=a+b;}
      tries++;
    }while((result===0||result===1||result>7||result<-4||(form==='cent'&&b>0))&&tries<100);
    let expression,steps,aide2;
    if(form==='produit'){
      expression=pw(a)+' × '+pw(b);
      steps=['B = '+unit(a)+' × '+unit(b),'B = '+unit(result),'B = '+strong(pw(result))];
      aide2='Ici, '+pw(a)+' = '+unit(a)+'.';
    }else if(form==='nombre'){
      expression=unit(a)+' × '+pw(b);
      steps=['B = '+unit(a)+' × '+unit(b),'B = '+unit(result),'B = '+strong(pw(result))];
      aide2='Ici, '+pw(b)+' = '+unit(b)+'.';
    }else{
      expression='100<sup>'+k+'</sup> × '+pw(b);
      steps=['100<sup>'+k+'</sup> = '+Array(k).fill('100').join(' × ')+' = '+unit(a),'B = '+unit(a)+' × '+unit(b)+' = '+unit(result),'B = '+strong(pw(result))];
      aide2='Ici, 100<sup>'+k+'</sup> = '+Array(k).fill('100').join(' × ')+'.';
    }
    const prompt='Écris B sous la forme d’une puissance de 10'+NB+':<br>B = '+expression;
    return base(module,question,'power_of_ten',{
      prompt,statement:plain(prompt),
      footer:'$$B\\,=\\,10^{[[dots]]}$$',
      answers:[sgn(result)],
      slotLabels:['Exposant'],
      template:'10<sup>{0}</sup>',
      expected:pw(result),
      steps,
      note:form==='produit'&&b>0?'Attention'+NB+': '+pw(a)+' × '+pw(b)+' n’est pas 10<sup>'+(a*b)+'</sup>.':'',
      aide:['Écris chaque puissance de 10 en écriture décimale, puis multiplie.',aide2]
    });
  }

  // ── Calcul avec des puissances de 10 (type 15, sujet de référence R1 2) ─
  // Les nombres sont comptés en millièmes (entiers) : aucun arrondi.
  function powerCalc(module,question,randomInt){
    const tenth=()=>{let v;do{v=randomInt(11,99);}while(v%10===0);return v;};
    const thousandths=(numberTimesTen,e)=>numberTimesTen*Math.pow(10,e+2); // (v/10) × 10^e en millièmes
    const show=t=>{
      const integer=Math.floor(t/1000),rest=String(t%1000).padStart(3,'0').replace(/0+$/,'');
      return group(String(integer))+(rest?','+rest:'');
    };
    const form=weighted([['R1',3],['deux',1],['moins',1]],randomInt);
    let terms;
    if(form==='R1'){
      const a=tenth(),b=randomInt(2,9),c=tenth(),minus=randomInt(0,2)>0;
      terms=[{text:dec(String(a),1)+' × '+pw(2),value:thousandths(a,2),sign:1},
        {text:b+' × 10',value:b*10000,sign:minus?-1:1},
        {text:dec(String(c),1)+' × '+pw(-1),value:thousandths(c,-1),sign:1}];
    }else if(form==='deux'){
      const a=tenth(),c=randomInt(2,9);
      terms=[{text:dec(String(a),1)+' × '+pw(3),value:thousandths(a,3),sign:1},
        {text:c+' × '+pw(-2),value:c*10,sign:1}];
    }else{
      const a=tenth(),c=randomInt(2,9);
      terms=[{text:dec(String(a),1)+' × '+pw(2),value:thousandths(a,2),sign:1},
        {text:c+' × '+pw(-1),value:c*100,sign:-1}];
    }
    const total=terms.reduce((sum,term)=>sum+term.sign*term.value,0);
    const join=list=>list.map((item,index)=>(index?(terms[index].sign<0?' − ':' + '):'')+item).join('');
    const expression=join(terms.map(term=>term.text));
    const answer=show(total);
    const prompt='Calcule'+NB+':<br>B = '+expression;
    return base(module,question,'power_calc',{
      prompt,statement:plain(prompt),
      footer:'$$B\\,=\\,[[dots]]$$',
      answers:[answer],
      slotLabels:['Valeur de B'],
      expected:answer,
      steps:[
        terms.map(term=>term.text+' = '+show(term.value)).join(NB+'; '),
        'B = '+join(terms.map(term=>show(term.value))),
        'B = '+strong(answer)
      ],
      aide:[
        'Calcule d’abord chaque produit'+NB+': × 10<sup>n</sup> fait glisser les chiffres de n rangs (vers la gauche si n est positif, vers la droite si n est négatif).',
        'Ici, '+terms[0].text+' = '+show(terms[0].value)+'.'
      ]
    });
  }

  const BUILDERS=Object.freeze({
    to_scientific:args=>toScientific(args.module,args.question,args.randomInt),
    context:args=>context(args.module,args.question,args.randomInt),
    from_scientific:args=>fromScientific(args.module,args.question,args.randomInt),
    choose_qcm:args=>chooseQcm(args.module,args.question,args.randomInt,args.shuffle),
    recognize_qcm:args=>recognizeQcm(args.module,args.question,args.randomInt,args.shuffle),
    complete_power:args=>completePower(args.module,args.question,args.randomInt),
    power_of_ten:args=>powerOfTen(args.module,args.question,args.randomInt),
    power_calc:args=>powerCalc(args.module,args.question,args.randomInt)
  });

  function supports({question}){return !!(question&&question.options&&BUILDERS[question.options.scientific_kind]);}
  function createInstance(args){
    const kind=args.question.options.scientific_kind;
    if(!BUILDERS[kind]) throw new Error('Type de notation scientifique inconnu : '+kind);
    return BUILDERS[kind](args);
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le générateur dnb_06.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_06',{
    generator:{version:'2.0.0',supports,createInstance,kinds:Object.keys(BUILDERS)}
  });
})(globalThis);
