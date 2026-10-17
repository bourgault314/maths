(function registerFractionDecimalGrid(global){
  function gcd(a,b){a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b){const t=b;b=a%b;a=t;}return a||1;}
  function palette(den){
    const palettes={
      1:['#ef5757','#fee3e3','#8d2424'],2:['#b98ae8','#f0e5fb','#654187'],3:['#6eafea','#e5f2fd','#285f8f'],
      4:['#b98ae8','#f0e5fb','#654187'],5:['#e67dab','#fbe6ef','#8a335b'],6:['#6eafea','#e5f2fd','#285f8f'],
      8:['#b98ae8','#f0e5fb','#654187'],10:['#78c989','#e5f5e8','#276b42'],12:['#6eafea','#e5f2fd','#285f8f'],
      15:['#e67dab','#fbe6ef','#8a335b'],16:['#b98ae8','#f0e5fb','#654187'],20:['#62c5c0','#e1f6f4','#276d69'],
      25:['#ef9b55','#fcebdc','#8a4b18'],50:['#759ccf','#e7eff9','#355c8a'],100:['#f2ca3f','#fff5bf','#4a3b00']
    };
    return palettes[den]||['#60bfa8','#e3f5f0','#296a5b'];
  }
  function layout(den){
    if(den===4)return {cols:2,rows:2};
    if(den===6)return {cols:3,rows:2};
    if(den===8)return {cols:4,rows:2};
    if(den===12)return {cols:3,rows:4};
    if(den===15)return {cols:5,rows:3};
    if(den===16)return {cols:4,rows:4};
    if(den===20)return {cols:5,rows:4};
    if(den===25)return {cols:5,rows:5};
    if(den===50)return {cols:10,rows:5};
    if(den===100)return {cols:10,rows:10};
    return {cols:Math.max(1,den),rows:1};
  }
  function order(den,cols,rows,orderingDen=null){
    const rowMajor=Array.from({length:den},(_,index)=>index);
    if(den===16){
      const result=[];
      [[0,0],[2,0],[0,2],[2,2]].forEach(([x0,y0])=>{
        [[0,0],[0,1],[1,0],[1,1]].forEach(([dx,dy])=>result.push((y0+dy)*cols+x0+dx));
      });
      return result;
    }
    if(den===100&&orderingDen===100){
      // Quarts : carré en haut à gauche, en haut à droite, en bas à gauche, en bas à droite.
      const result=[];
      [[0,0],[5,0],[0,5],[5,5]].forEach(([x0,y0])=>{
        for(let row=0;row<5;row++)for(let col=0;col<5;col++)result.push((y0+row)*cols+x0+col);
      });
      return result;
    }
    if(den===15||den===25||den===50||(den===20&&orderingDen===5)){
      const result=[];
      for(let col=0;col<cols;col++)for(let row=0;row<rows;row++)result.push(row*cols+col);
      return result;
    }
    return rowMajor;
  }
  function hierarchyGuides(x0,y0,size,den,stroke,orderingDen=null){
    let output='';
    const vertical=(ratio,width)=>{const x=x0+ratio*size;output+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0+size}" stroke="${stroke}" stroke-width="${width}"/>`;};
    const horizontal=(ratio,width)=>{const y=y0+ratio*size;output+=`<line x1="${x0}" y1="${y}" x2="${x0+size}" y2="${y}" stroke="${stroke}" stroke-width="${width}"/>`;};
    if([4,8,16].includes(den)){vertical(.5,3.2);horizontal(.5,3.2);}
    if(den===16){vertical(.25,2);vertical(.75,2);}
    if([3,6,12].includes(den)){vertical(1/3,2.8);vertical(2/3,2.8);}
    if(den===6)horizontal(.5,2.15);
    if(den===12){horizontal(.25,2);horizontal(.5,2);horizontal(.75,2);}
    if([5,15,25].includes(den))for(let index=1;index<5;index++)vertical(index/5,2.35);
    if(den===20){
      if(orderingDen===4){horizontal(.25,2.35);horizontal(.5,2.35);horizontal(.75,2.35);}
      else for(let index=1;index<5;index++)vertical(index/5,2.35);
    }
    if(den===50)for(let index=1;index<10;index++)vertical(index/10,index===5?2.5:1.75);
    if(den===100){vertical(.5,1.9);horizontal(.5,1.9);}
    return output;
  }
  // Pastille « 1 » d'une unité complète (correction seulement) : texte sombre sur blanc,
// lisible sur toutes les couleurs et en noir et blanc.
  function unitBadge(x0,y0,size){
    const r=Math.max(14,Math.min(24,size*.12)),cx=x0+size/2,cy=y0+size/2;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#18324f" stroke-width="2.4"/><text x="${cx}" y="${cy+r*.36}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(r*1.05)}" font-weight="900" fill="#18324f">1</text>`;
  }
  function hundredGridPart(x0,y0,size,filled,den,showUnits=false){
    const [dark,light,stroke]=palette(den),cell=size/10,selectedParts=Math.max(0,Math.min(den,filled));
    let output='';
    for(let row=0;row<10;row++)for(let col=0;col<10;col++){
      const partIndex=den===5?Math.floor(col/2):(row*2+(col>=5?1:0)),selected=partIndex<selectedParts;
      output+=`<rect class="module01-hundred-cell" x="${x0+col*cell}" y="${y0+row*cell}" width="${cell}" height="${cell}" fill="${selected?dark:light}" stroke="${stroke}" stroke-width=".48" stroke-opacity=".48"/>`;
    }
    if(den===5){
      for(let index=1;index<5;index++){
        const x=x0+index*2*cell;
        output+=`<line class="module01-fraction-guide" x1="${x}" y1="${y0}" x2="${x}" y2="${y0+size}" stroke="${stroke}" stroke-width="3"/>`;
      }
    }else{
      output+=`<line class="module01-twentieth-guide" x1="${x0+size/2}" y1="${y0}" x2="${x0+size/2}" y2="${y0+size}" stroke="${stroke}" stroke-width="1.8"/>`;
      for(let row=1;row<10;row++){
        const y=y0+row*cell,fifthBoundary=row%2===0;
        output+=`<line class="${fifthBoundary?'module01-fraction-guide':'module01-twentieth-guide'}" x1="${x0}" y1="${y}" x2="${x0+size}" y2="${y}" stroke="${stroke}" stroke-width="${fifthBoundary?3:1.8}"/>`;
      }
    }
    output+=`<rect x="${x0}" y="${y0}" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="3.2"/>`;
    if(showUnits&&selectedParts>=den)output+=unitBadge(x0,y0,size);
    return output;
  }
  function boardPart(x0,y0,size,filled,den,neutral=false,emphasisDen=null,orderingDen=null,showUnits=false){
    const sourceDen=neutral?100:Math.max(1,den);
    if(!neutral&&(sourceDen===5||sourceDen===20))return hundredGridPart(x0,y0,size,filled,sourceDen,showUnits);
    const {cols,rows}=layout(sourceDen),[dark,light,stroke]=palette(sourceDen);
    const cellW=size/cols,cellH=size/rows,selected=Math.max(0,Math.min(sourceDen,filled));
    const selectedCells=new Set(order(sourceDen,cols,rows,orderingDen).slice(0,selected));
    let output='';
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const index=row*cols+col;
      output+=`<rect x="${x0+col*cellW}" y="${y0+row*cellH}" width="${cellW}" height="${cellH}" fill="${selectedCells.has(index)?dark:light}" stroke="${stroke}" stroke-width="${sourceDen>=50?.72:1.15}"/>`;
    }
    output+=hierarchyGuides(x0,y0,size,sourceDen,stroke,orderingDen);
    if(rows===1&&emphasisDen&&sourceDen%emphasisDen===0&&emphasisDen<sourceDen){
      const group=sourceDen/emphasisDen;
      for(let index=group;index<sourceDen;index+=group){
        const x=x0+index*cellW;
        output+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0+size}" stroke="${stroke}" stroke-width="3.2"/>`;
      }
    }
    output+=`<rect x="${x0}" y="${y0}" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="3.2"/>`;
    if(showUnits&&selected>=sourceDen)output+=unitBadge(x0,y0,size);
    return output;
  }
  function gridVisual(num,den,neutral=false,emphasisDen=null,orderingDen=null,showUnits=false,vide=false){
    const total=neutral?Math.round((num/den)*100):num,per=neutral?100:Math.max(1,den);
    if(neutral&&total%25===0&&total%100!==0)orderingDen=100;
    const boards=Math.max(1,Math.ceil(total/per)),cols=boards<=3?boards:Math.min(4,boards),rows=Math.ceil(boards/cols);
    const size=boards===1?205:(boards<=3?176:(boards<=4?142:104)),gap=boards<=4?18:13,pad=6;
    const width=pad*2+cols*size+(cols-1)*gap,height=pad*2+rows*size+(rows-1)*gap;
    let remaining=total,shapes='';
    for(let index=0;index<boards;index++){
      const col=index%cols,row=Math.floor(index/cols),x=pad+col*(size+gap),y=pad+row*(size+gap),filled=Math.min(per,remaining);
      remaining-=filled;
      shapes+=boardPart(x,y,size,vide?0:filled,per,false,emphasisDen,orderingDen,showUnits);
    }
    return `<div class="module01-visual"><svg viewBox="0 0 ${width} ${height}" style="max-width:${Math.round(width*1.5)}px;max-height:30vh" role="img" aria-label="${boards===1?'Une unité partagée en '+per+' parts égales':boards+' unités, chacune partagée en '+per+' parts égales'}">${shapes}</svg></div>`;
  }
  // A0 (15/10/2026) : aide de « … + … = 1 » sans cases blanches à compter. La
  // part connue (0,83 = 8,3 dixièmes) est coloriée et découpée en dixièmes ; ce
  // qui manque reste un seul bloc blanc, sans traits.
  function decimalComplementBlock(data){
    const filled=Math.max(0,Math.min(10,Number(data.filledA)||0)),full=Math.floor(filled+1e-9);
    const cellW=56,x0=22,y=35,height=58,stroke='#18324f';
    let cells=`<rect x="${x0}" y="${y}" width="${10*cellW}" height="${height}" fill="#f8fafc"/>`;
    cells+=`<rect class="decimal-complement-cell decimal-complement-first" x="${x0}" y="${y}" width="${filled*cellW}" height="${height}" fill="#39b8aa"/>`;
    for(let index=1;index<=full&&index<10;index++) cells+=`<line x1="${x0+index*cellW}" y1="${y}" x2="${x0+index*cellW}" y2="${y+height}" stroke="${stroke}" stroke-width="1.7"/>`;
    if(filled>full+1e-9) cells+=`<line x1="${x0+filled*cellW}" y1="${y}" x2="${x0+filled*cellW}" y2="${y+height}" stroke="${stroke}" stroke-width="1.7"/>`;
    cells+=`<rect x="${x0}" y="${y}" width="${10*cellW}" height="${height}" fill="none" stroke="${stroke}" stroke-width="1.7"/>`;
    const unitLabel=`<text x="${x0+5*cellW}" y="21" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="900" fill="#111111">1</text>`;
    return `<div class="decimal-complement-visual"><svg viewBox="0 0 604 102" role="img" aria-label="La partie blanche est à compléter.">${unitLabel}${cells}</svg></div>`;
  }
  function decimalComplementVisual(data,correction=false){
    if(data.resteBloc&&!correction) return decimalComplementBlock(data);
    const first=Math.max(0,Math.min(10,Math.round(Number(data.filledA)||0)));
    const second=Math.max(0,Math.min(10-first,Math.round(Number(data.filledB)||0)));
    const showSecond=!!data.showSecond||correction;
    const cellW=56,x0=22,y=35,height=58;
    let cells='';
    for(let index=0;index<10;index++){
      const firstPart=index<first,secondPart=showSecond&&index>=first&&index<first+second;
      const fill=firstPart?'#39b8aa':(secondPart?'#f4a340':'#f8fafc');
      const cellClass=firstPart?' decimal-complement-first':(secondPart?' decimal-complement-second':' decimal-complement-empty');
      cells+=`<rect class="decimal-complement-cell${cellClass}" x="${x0+index*cellW}" y="${y}" width="${cellW}" height="${height}" fill="${fill}" stroke="#18324f" stroke-width="1.7"/>`;
    }
    const outline=correction?`<rect x="${x0-4}" y="${y-4}" width="${10*cellW+8}" height="${height+8}" rx="8" fill="none" stroke="#0b7c67" stroke-width="4"/><text x="${x0+5*cellW}" y="121" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="900" fill="#0b6f5d">1 unité</text>`:'';
    const unitLabel=`<text x="${x0+5*cellW}" y="21" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="900" fill="#111111">1</text>`;
    const label=showSecond?'Les deux couleurs complètent la bande.':'La partie blanche est à compléter.';
    return `<div class="decimal-complement-visual"><svg viewBox="0 0 604 132" role="img" aria-label="${label}">${unitLabel}${cells}${outline}</svg></div>`;
  }
  // Tableau de numération figé : unités | dixièmes | centièmes. Sans valeur, seules les
  // colonnes sont dessinées (aide « dans quel rang écris-tu le chiffre ? »).
  function placeValueVisual(value){
    const labels=['unités','dixièmes','centièmes'],colW=112,headH=40,cellH=66,x0=8,y0=8;
    const digits=['','',''];
    if(value!==null&&value!==undefined&&value!==''){
      const [intPart,decPart='']=String(value).split(',');
      digits[0]=intPart; digits[1]=decPart[0]||''; digits[2]=decPart[1]||'';
    }
    const width=x0*2+colW*3,height=y0*2+headH+cellH;
    let out='';
    labels.forEach((label,index)=>{
      const x=x0+index*colW;
      out+=`<rect x="${x}" y="${y0}" width="${colW}" height="${headH}" fill="${index===0?'#e8eef5':'#f4f7fb'}" stroke="#18324f" stroke-width="2"/>`;
      out+=`<text x="${x+colW/2}" y="${y0+headH/2+7}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="19" font-weight="800" fill="#18324f">${label}</text>`;
      out+=`<rect x="${x}" y="${y0+headH}" width="${colW}" height="${cellH}" fill="#ffffff" stroke="#18324f" stroke-width="2"/>`;
      if(digits[index]!=='')out+=`<text x="${x+colW/2}" y="${y0+headH+cellH/2+15}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="42" font-weight="900" fill="#111111">${digits[index]}</text>`;
    });
    // La virgule, à droite du chiffre des unités.
    out+=`<text x="${x0+colW-4}" y="${y0+headH+cellH-8}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="48" font-weight="900" fill="#c2410c">,</text>`;
    out+=`<rect x="${x0}" y="${y0}" width="${colW*3}" height="${headH+cellH}" fill="none" stroke="#18324f" stroke-width="3"/>`;
    const label=digits.some(Boolean)?'Tableau de numération : '+String(value):'Tableau de numération vide : unités, dixièmes, centièmes';
    return `<div class="module01-visual module01-place-value"><svg viewBox="0 0 ${width} ${height}" style="max-width:${Math.round(width*1.35)}px;max-height:24vh" role="img" aria-label="${label}">${out}</svg></div>`;
  }
  // Droite graduée de bandes (reprise de la V2 de Gwenaël, 17/10/2026) : des bandes
  // de 1/2, 1/4, 1/3 ou 1 posées bout à bout sur une droite graduée. Règle de l'aide :
  // on peut compter, mais la réponse n'est jamais écrite. Les graduations franchies
  // sont nommées, l'arrivée reste « ? » ; en correction, l'arrivée porte la réponse.
  function railLabel(k,den){
    const value=k/den;
    if(Math.abs(value-Math.round(value))<1e-9) return String(Math.round(value));
    if(den===3) return '';
    // Quarts : toujours deux chiffres après la virgule (0,25 ; 0,50 ; 0,75), on lit des centièmes.
    if(den===4) return value.toFixed(2).replace('.',',');
    return value.toFixed(2).replace(/0+$/,'').replace(/\.$/,'').replace('.',',');
  }
  const BANDES_FRACTIONS={1:'#fff7e6',2:'#facc15',3:'#e9d5ff',4:'#84cc16',5:'#0ea5e9',6:'#f97316',8:'#f472b6',10:'#fab464',12:'#7dd3fc'};
  function railVisual(data,correction=false){
    const num=Math.max(1,Math.round(Number(data.num)||1)),den=Math.max(1,Math.round(Number(data.den)||1));
    const maxRail=Math.max(1,Math.ceil(num/den)),parts=maxRail*den;
    const W=360,left=22,right=34,unitW=(W-left-right)/maxRail,partW=unitW/den;
    const yBand=12,hBand=46,yAxis=104,yLabel=131,H=142;
    // Couleurs de l'univers de Gwenaël (décision du 17/10/2026) : demi jaune, tiers lavande,
    // quart vert, contour noir, comme ses bandes de fractions (outils/fractions/bandes_fractions.html) ;
    // dixième orange, le 10 % de sa palette officielle des pourcentages (packages/charte :
    // COULEURS_POURCENTAGES.c10), qui a aussi le demi jaune (50 %) et le quart vert (25 %).
    const dark=BANDES_FRACTIONS[den]||palette(den)[0],stroke='#000000',ink='#111827',font='Arial,Helvetica,sans-serif';
    const target=left+num*partW,answer=String(data.dec||railLabel(num,den));
    // Une seule bande donnée (0,5 ; 0,25 ; 0,1) : son étiquette « 1/4 » serait la réponse.
    // Décision de Gwenaël (17/10/2026) : l'unité entière en trait plein et épais, partagée
    // en cases, une seule case coloriée et sans étiquette : le tout, c'est 1.
    const seule=!!data.donne&&num===1&&den>1;
    let out='';
    if(seule) for(let index=1;index<den;index++){
      const x=left+index*partW;
      out+=`<rect x="${x.toFixed(2)}" y="${yBand}" width="${partW.toFixed(2)}" height="${hBand}" fill="#ffffff" stroke="${stroke}" stroke-width="1.2"/>`;
    }
    for(let index=0;index<num;index++){
      const x=left+index*partW;
      out+=`<rect x="${x.toFixed(2)}" y="${yBand}" width="${partW.toFixed(2)}" height="${hBand}" fill="${dark}" stroke="${stroke}" stroke-width="1.2"/>`;
      const cx=x+partW/2;
      if(seule){ /* pas d'étiquette : ce serait la réponse */ }
      else if(den===1) out+=`<text x="${cx.toFixed(2)}" y="${yBand+hBand/2+6}" text-anchor="middle" font-family="${font}" font-size="17" font-weight="800" fill="${ink}">1</text>`;
      else if(partW>=20){
        const fs=partW>=34?14:12,half=Math.min(9,partW*.28);
        out+=`<text x="${cx.toFixed(2)}" y="${yBand+hBand/2-4}" text-anchor="middle" font-family="${font}" font-size="${fs}" font-weight="800" fill="${ink}">1</text>`;
        out+=`<line x1="${(cx-half).toFixed(2)}" y1="${yBand+hBand/2}" x2="${(cx+half).toFixed(2)}" y2="${yBand+hBand/2}" stroke="${ink}" stroke-width="1.4"/>`;
        out+=`<text x="${cx.toFixed(2)}" y="${yBand+hBand/2+fs+1}" text-anchor="middle" font-family="${font}" font-size="${fs}" font-weight="800" fill="${ink}">${den}</text>`;
      }
    }
    if(seule) out+=`<rect x="${left}" y="${yBand}" width="${(den*partW).toFixed(2)}" height="${hBand}" fill="none" stroke="${ink}" stroke-width="3.2"/>`;
    // Repères pointillés du départ et de l'arrivée.
    [left,target].forEach(x=>{out+=`<line x1="${x.toFixed(2)}" y1="${yBand+hBand+3}" x2="${x.toFixed(2)}" y2="${yAxis-2}" stroke="#1e3a8a" stroke-width="1.6" stroke-dasharray="3 3"/>`;});
    // L'axe et sa flèche.
    const end=W-right+20;
    out+=`<line x1="${left-6}" y1="${yAxis}" x2="${end}" y2="${yAxis}" stroke="#18324f" stroke-width="2"/>`;
    out+=`<path d="M${end-9} ${yAxis-6} L${end} ${yAxis} L${end-9} ${yAxis+6}" fill="none" stroke="#18324f" stroke-width="2"/>`;
    for(let k=0;k<=parts;k++){
      const x=left+k*partW,major=k%den===0,h=major?8:5;
      out+=`<line x1="${x.toFixed(2)}" y1="${yAxis-h}" x2="${x.toFixed(2)}" y2="${yAxis+h}" stroke="#18324f" stroke-width="${major?2:1.4}"/>`;
      let label='',color=ink,weight=700,size=15;
      // donne : sens décimal → fraction, le nombre donné est au bout (on compte les bandes).
      if(k===num){ label=(correction||data.donne)?answer:'?'; color=data.donne?ink:(correction?'#0b7c67':'#1d4ed8'); weight=900; size=(correction||data.donne)?17:20; }
      // Graduations écrites : 0, les entiers, et seulement la première (la valeur d'une bande) :
      // écrire toutes celles qu'on franchit ferait deviner la réponse (0,1 ; 0,2 … 0,6 ; ? → 0,7).
      else if(major||(k<num&&k<=(data.reperes||1))) label=railLabel(k,den);
      if(label) out+=`<text x="${x.toFixed(2)}" y="${yLabel}" text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${label}</text>`;
    }
    // Texte lu par les lecteurs d'écran : « 7 bandes d'un dixième posées… », « 3 unités posées… ».
    const word={2:'demi',3:'tiers',4:'quart',10:'dixième'}[den];
    const objet=den===1?(num>1?'unités':'unité'):(num>1?'bandes':'bande')+(seule?'':(word?' d’un '+word:''));
    const aria=num+' '+objet+' posée'+(num>1?'s':'')+' bout à bout sur une droite graduée'+(seule?', l’unité est partagée en bandes égales':'')+(correction||data.donne?' : '+(num>1?'elles arrivent':'elle arrive')+' à '+answer+'.':' ; l’arrivée est à trouver.');
    return `<div class="module01-visual module01-rail"><svg viewBox="0 0 ${W} ${H}" style="max-width:${Math.round(W*1.5)}px;max-height:30vh" role="img" aria-label="${aria}">${out}</svg></div>`;
  }
  function render(data,correction=false){
    if(data&&data.kind==='rail') return railVisual(data,correction);
    if(data&&data.kind==='decimal-complement') return decimalComplementVisual(data,correction);
    if(data&&data.kind==='place-value') return placeValueVisual(data.value);
    if(data&&data.visualKind==='place-empty') return placeValueVisual(null);
    if(data&&data.visualKind==='none') return '';
    const common=gcd(data.num,data.den),simplified=correction&&common>1&&data.reduced&&data.reduced.den<data.den;
    const showUnits=data.showUnits!==undefined?!!data.showUnits:!!correction;
    // vide : les unités partagées, sans rien colorier (aide d'un « décimal → fraction » :
    // colorier le nombre donnerait la réponse ; A0, 15/10/2026).
    return gridVisual(data.num,data.den,data.visualKind==='neutral',simplified?data.reduced.den:null,data.reduced?data.reduced.den:null,showUnits,data.vide===true&&!correction);
  }

  const supports=Object.freeze(['phone','computer','projection','print']);
  const preset=(id,label,data)=>Object.freeze({id,label,supports,data:Object.freeze(data)});
  const presets=Object.freeze([
    preset('demi','Un demi',{num:1,den:2,reduced:{num:1,den:2}}),
    preset('trois-quarts','Trois quarts',{num:3,den:4,reduced:{num:3,den:4}}),
    preset('deux-cinquiemes','Deux cinquièmes sur cent cases',{num:2,den:5,reduced:{num:2,den:5}}),
    preset('seize-vingtiemes','Seize vingtièmes sur cent cases',{num:16,den:20,reduced:{num:4,den:5}}),
    preset('dix-neuf-vingtiemes','Dix-neuf vingtièmes',{num:19,den:20,reduced:{num:19,den:20}}),
    preset('sept-cinquiemes','Sept cinquièmes et unités complètes',{num:7,den:5,reduced:{num:7,den:5}}),
    preset('ecriture-decimale','Écriture décimale sur cent cases',{num:3,den:4,visualKind:'neutral',reduced:{num:3,den:4}}),
    preset('simplification','Simplifier six huitièmes en trois quarts',{num:6,den:8,reduced:{num:3,den:4}}),
    preset('complement-dixièmes','Compléter une unité en dixièmes',{kind:'decimal-complement',filledA:7,filledB:3,showSecond:true}),
    preset('tableau-numeration','Tableau de numération : 0,09',{kind:'place-value',value:'0,09'})
  ]);

  if(!global.MATHSGO_VISUALS)throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant fraction-decimal-grid.js.');
  global.MATHSGO_VISUALS.register('arithmetic.fraction-decimal-grid',{
    version:'1.5.0',
    label:'Plateau fraction–décimal',
    family:'Arithmétique',
    description:'Construit les unités partagées, grilles de cent cases (remplies par quarts), unités complètes repérées en correction et tableau de numération figé, pour passer d’une fraction à un décimal.',
    presets,
    render
  });
  global.fractionDecimalGrid=render;
})(globalThis);
