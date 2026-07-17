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
  function hundredGridPart(x0,y0,size,filled,den){
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
    if(selectedParts>=den)output+=`<text x="${x0+size/2}" y="${y0+size/2+12}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="850" fill="#b33838">1</text>`;
    return output;
  }
  function boardPart(x0,y0,size,filled,den,neutral=false,emphasisDen=null,orderingDen=null){
    const sourceDen=neutral?100:Math.max(1,den);
    if(!neutral&&(sourceDen===5||sourceDen===20))return hundredGridPart(x0,y0,size,filled,sourceDen);
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
    if(selected>=sourceDen)output+=`<text x="${x0+size/2}" y="${y0+size/2+12}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="850" fill="#b33838">1</text>`;
    return output;
  }
  function gridVisual(num,den,neutral=false,emphasisDen=null,orderingDen=null){
    const total=neutral?Math.round((num/den)*100):num,per=neutral?100:Math.max(1,den);
    const boards=Math.max(1,Math.ceil(total/per)),cols=boards<=3?boards:Math.min(4,boards),rows=Math.ceil(boards/cols);
    const size=boards===1?205:(boards<=3?176:(boards<=4?142:104)),gap=boards<=4?18:13,pad=6;
    const width=pad*2+cols*size+(cols-1)*gap,height=pad*2+rows*size+(rows-1)*gap;
    let remaining=total,shapes='';
    for(let index=0;index<boards;index++){
      const col=index%cols,row=Math.floor(index/cols),x=pad+col*(size+gap),y=pad+row*(size+gap),filled=Math.min(per,remaining);
      remaining-=filled;
      shapes+=boardPart(x,y,size,filled,per,false,emphasisDen,orderingDen);
    }
    return `<div class="module01-visual"><svg viewBox="0 0 ${width} ${height}" style="max-width:${width}px" role="img" aria-label="${boards===1?'Une unité partagée en '+per+' parts égales':boards+' unités, chacune partagée en '+per+' parts égales'}">${shapes}</svg></div>`;
  }
  function decimalComplementVisual(data,correction=false){
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
  function render(data,correction=false){
    if(data&&data.kind==='decimal-complement') return decimalComplementVisual(data,correction);
    const common=gcd(data.num,data.den),simplified=correction&&common>1&&data.reduced&&data.reduced.den<data.den;
    return gridVisual(data.num,data.den,data.visualKind==='neutral',simplified?data.reduced.den:null,data.reduced?data.reduced.den:null);
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
    preset('complement-dixièmes','Compléter une unité en dixièmes',{kind:'decimal-complement',filledA:7,filledB:3,showSecond:true})
  ]);

  if(!global.MATHSGO_VISUALS)throw new Error('Le registre MATHSGO_VISUALS doit être chargé avant fraction-decimal-grid.js.');
  global.MATHSGO_VISUALS.register('arithmetic.fraction-decimal-grid',{
    version:'1.2.0',
    label:'Plateau fraction–décimal',
    family:'Arithmétique',
    description:'Construit les unités partagées, grilles de cent cases, unités complètes et regroupements utilisés pour passer d’une fraction à un décimal.',
    presets,
    render
  });
  global.fractionDecimalGrid=render;
})(globalThis);
