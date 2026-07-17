(function registerAlgebraTiles(global){
  const THEMES=Object.freeze({
    'green-red':Object.freeze({positive:'#12A886',negative:'#EF4B43'}),
    'blue-yellow':Object.freeze({positive:'#2F8FC9',negative:'#FFE64C'}),
    mathigon:Object.freeze({x2:'#2F8FC9',x:'#72C475',u:'#FFE64C',negative:'#EF3F35'}),
    'black-gray':Object.freeze({positive:'#ffffff',negative:'#DEDEDE'})
  });
  const U=28,L=110,GAP=7,GROUP_GAP=30;

  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function normalizeKind(kind){
    const value=String(kind||'x').toLowerCase().replace('²','2').replace('^','');
    if(['u','unit','1'].includes(value))return 'u';
    if(['x2','x²'].includes(value))return 'x2';
    return 'x';
  }
  function tileFill(kind,sign,themeName){
    const theme=THEMES[themeName]||THEMES['green-red'];
    if(sign<0)return theme.negative;
    if(themeName==='mathigon')return theme[kind];
    return theme.positive;
  }
  function tileLabel(kind,sign){
    const base=kind==='x2'?'x²':(kind==='x'?'x':'1');
    return sign<0?`-${base}`:base;
  }
  function tileDimensions(kind,orientation){
    if(kind==='x2')return [L,L];
    if(kind==='x')return orientation==='vertical'?[U,L]:[L,U];
    return [U,U];
  }
  function tileSvg(x,y,kind,sign,theme,orientation,scale){
    const [rawW,rawH]=tileDimensions(kind,orientation),w=rawW*scale,h=rawH*scale,fill=tileFill(kind,sign,theme),label=tileLabel(kind,sign);
    const font=kind==='x2'?19:(kind==='x'?15:12);
    return `<rect x="${x+2*scale}" y="${y+2*scale}" width="${w}" height="${h}" fill="rgba(0,0,0,.11)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#111111" stroke-width="${1.6*scale}"/><text x="${x+w/2}" y="${y+h/2}" text-anchor="middle" dominant-baseline="middle" font-family="Cambria Math,Times New Roman,serif" font-size="${font*scale}" font-style="italic" font-weight="700" fill="#111111">${escapeHtml(label)}</text>`;
  }
  function groupLayout(term){
    const kind=normalizeKind(term.kind),count=Math.max(1,Math.min(20,Math.abs(Math.round(Number(term.count)||1)))),orientation=term.orientation==='vertical'?'vertical':'horizontal';
    const [tileW,tileH]=tileDimensions(kind,orientation);
    let cols,rows;
    if(kind==='x2'){cols=Math.min(count,3);rows=Math.ceil(count/cols);}
    else if(kind==='x'&&orientation==='horizontal'){cols=count>5?2:1;rows=Math.ceil(count/cols);}
    else if(kind==='x'){cols=Math.min(count,5);rows=Math.ceil(count/cols);}
    else {cols=Math.min(count,5);rows=Math.ceil(count/cols);}
    return {kind,count,orientation,sign:Number(term.sign)<0?-1:1,cols,rows,tileW,tileH,width:cols*tileW+(cols-1)*GAP,height:rows*tileH+(rows-1)*GAP};
  }
  function expressionFor(terms){
    let expression='';
    terms.forEach((term,index)=>{
      const coefficient=term.count,variable=term.kind==='x2'?'x²':(term.kind==='x'?'x':''),absolute=Math.abs(coefficient);
      let value=variable?(absolute===1?variable:absolute+variable):String(absolute);
      if(term.sign<0)value='-'+value;
      if(index>0&&term.sign>0)value='+'+value;
      expression+=value;
    });
    return expression.replace(/\+\-/g,'-');
  }
  function algebraTiles(data,correction=false){
    const rawTerms=Array.isArray(data.terms)&&data.terms.length?data.terms:[{kind:'x2',count:1,sign:1},{kind:'x',count:1,sign:1},{kind:'u',count:1,sign:1}];
    const layouts=rawTerms.map(term=>groupLayout(term)),rawWidth=layouts.reduce((sum,item)=>sum+item.width,0)+GROUP_GAP*(layouts.length-1),rawHeight=Math.max(...layouts.map(item=>item.height));
    const scale=Math.min(1,690/Math.max(1,rawWidth),190/Math.max(1,rawHeight)),contentWidth=rawWidth*scale,startX=(760-contentWidth)/2,startY=58+(190-rawHeight*scale)/2,theme=data.theme||'green-red';
    let body='',cursorX=startX;
    layouts.forEach(item=>{
      for(let index=0;index<item.count;index++){
        const col=index%item.cols,row=Math.floor(index/item.cols),x=cursorX+col*(item.tileW+GAP)*scale,y=startY+row*(item.tileH+GAP)*scale;
        body+=tileSvg(x,y,item.kind,item.sign,theme,item.orientation,scale);
      }
      cursorX+=(item.width+GROUP_GAP)*scale;
    });
    const title=data.title||'Tuiles algébriques';
    body+=`<text x="380" y="28" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="900" fill="#17283f">${escapeHtml(title)}</text>`;
    if(correction){
      const normalized=layouts.map(item=>({kind:item.kind,count:item.count,sign:item.sign}));
      body+=`<rect x="180" y="266" width="400" height="50" rx="12" fill="#fff8f2" stroke="#f6a13a" stroke-width="2"/><text x="380" y="291" text-anchor="middle" dominant-baseline="middle" font-family="Cambria Math,Times New Roman,serif" font-size="24" font-style="italic" font-weight="700" fill="#222222">${escapeHtml(data.expression||expressionFor(normalized))}</text>`;
    }
    return `<div class="algebra-tiles-help"><svg class="algebra-tiles-svg" viewBox="0 0 760 330" role="img" aria-label="Représentation d’une expression avec des tuiles algébriques">${body}</svg></div>`;
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('legende','Les six tuiles de référence',{title:'Tuiles positives et négatives',terms:[{kind:'x2',count:1,sign:1},{kind:'x2',count:1,sign:-1},{kind:'x',count:1,sign:1},{kind:'x',count:1,sign:-1},{kind:'u',count:1,sign:1},{kind:'u',count:1,sign:-1}],expression:'x² - x² + x - x + 1 - 1'}),
    preset('expression-simple','Représenter 3x + 3',{terms:[{kind:'x',count:3,sign:1},{kind:'u',count:3,sign:1}],expression:'3x + 3'}),
    preset('expression-mixte','Représenter 3 - x²',{terms:[{kind:'u',count:3,sign:1},{kind:'x2',count:1,sign:-1}],expression:'3 - x²'}),
    preset('reduire','Préparer une réduction',{terms:[{kind:'x2',count:4,sign:1},{kind:'x',count:5,sign:1},{kind:'x',count:2,sign:-1},{kind:'u',count:4,sign:1},{kind:'u',count:1,sign:-1}],expression:'4x² + 3x + 3'}),
    preset('palette-bleu-jaune','Palette bleu / jaune',{theme:'blue-yellow',terms:[{kind:'x2',count:1,sign:1},{kind:'x',count:2,sign:1},{kind:'u',count:3,sign:-1}],expression:'x² + 2x - 3'}),
    preset('palette-mathigon','Palette Mathigon',{theme:'mathigon',terms:[{kind:'x2',count:1,sign:1},{kind:'x',count:2,sign:1},{kind:'u',count:3,sign:1},{kind:'x',count:1,sign:-1}],expression:'x² + x + 3'}),
    preset('palette-noir-gris','Palette noir / gris',{theme:'black-gray',terms:[{kind:'x2',count:1,sign:1},{kind:'x',count:2,sign:-1},{kind:'u',count:4,sign:1}],expression:'x² - 2x + 4'})
  ]);

  if(!global.MATHSGO_VISUALS)throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant algebra-tiles.js.');
  global.MATHSGO_VISUALS.register('algebra.algebra-tiles',{
    version:'1.0.0',
    label:'Tuiles algébriques',
    family:'Algèbre',
    description:'Compose les tuiles x², x et unité, positives ou négatives, selon les quatre palettes du dossier maître Calcul littéral.',
    viewBox:'0 0 760 330',
    presets,
    render:algebraTiles
  });
  global.algebraTiles=algebraTiles;
})(globalThis);
