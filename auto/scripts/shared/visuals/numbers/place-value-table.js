(function registerPlaceValueTable(global){
  function placeValueFormat(value){
    if(typeof value==='number'){
      if(Math.abs(value-Math.round(value))<1e-9) return String(Math.round(value)).replace('.',',');
      return String(Number(value.toFixed(6))).replace('.',',');
    }
    return String(value).replace('.',',');
  }
  function placeValueEscape(value){
    return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function placeValueDigits(value,columnCount=7,unitsIndex=3){
    const cells=Array(columnCount).fill('');
    const normalized=placeValueFormat(Math.abs(Number(value))).replace(/\s/g,'').replace(',','.');
    const parts=normalized.split('.'),integer=(parts[0]||'0').replace(/^\+/,''),decimals=parts[1]||'';
    [...integer].reverse().forEach((digit,offset)=>{const index=unitsIndex-offset;if(index>=0&&index<columnCount)cells[index]=digit;});
    [...decimals].forEach((digit,offset)=>{const index=unitsIndex+1+offset;if(index>=0&&index<columnCount)cells[index]=digit;});
    return cells;
  }
  function placeValueTableHtml(data,correction=false){
    const labels=['milliers','centaines','dizaines','unités','dixièmes','centièmes','millièmes'];
    const digits=placeValueDigits(data.value);
    const shift=0;
    const headers=labels.map((label,index)=>'<div class="place-value-head" data-place-value-target="'+index+'" aria-label="Colonne '+label+'">'+label+'</div>').join('');
    const windows=labels.map(()=>'<div class="place-value-window"></div>').join('');
    const fixed=digits.map((digit,index)=>'<span class="place-value-fixed-digit'+(index===3?' is-units-digit':'')+'"'+(index===3&&!correction?' data-place-value-source role="button" tabindex="0" aria-pressed="false" aria-label="Sélectionner le chiffre des unités"':'')+'>'+digit+'</span>').join('');
    const strip=Array(13).fill(0).map(()=>'<span class="place-value-strip-digit"></span>').join('');
    const instruction=correction
      ? '<strong>'+placeValueFormat(data.value)+' '+data.symbol+' '+data.factor+' = '+placeValueFormat(data.result)+'</strong>'
      : 'Glisse la bande ou touche le chiffre bleu, puis sa colonne d’arrivée.';
    return '<div class="place-value-tool" data-base-digits="'+placeValueEscape(digits.join('|'))+'" data-target-shift="'+data.shift+'" data-initial-shift="'+shift+'" data-auto-shift="'+(correction?'1':'0')+'">'
      +'<div class="place-value-grid">'
        +'<div class="place-value-head-row">'+headers+'</div>'
        +'<div class="place-value-preview-row"><div class="place-value-strip-viewport"><div class="place-value-strip">'+strip+'</div></div><div class="place-value-window-row">'+windows+'</div><span class="place-value-comma place-value-preview-comma" aria-hidden="true">,</span><div class="place-value-drag-bar" tabindex="0" role="slider" aria-label="Faire glisser la bandelette" aria-valuemin="-3" aria-valuemax="3" aria-valuenow="'+shift+'"><span></span></div></div>'
        +'<div class="place-value-fixed-row">'+fixed+'<span class="place-value-comma place-value-fixed-comma" aria-hidden="true">,</span></div>'
      +'</div><div class="place-value-row-labels"><span>Résultat obtenu</span><span>Nombre de départ</span></div>'
      +'<div class="place-value-tool-note'+(correction?'':' place-value-tool-instruction')+'">'+instruction+'</div></div>';
  }

  function setupPlaceValueTools(root=globalThis.document){
    if(!root||typeof root.querySelectorAll!=='function')return;
    root.querySelectorAll('.place-value-tool').forEach(tool=>{
      const grid=tool.querySelector('.place-value-grid'),bar=tool.querySelector('.place-value-drag-bar'),strip=tool.querySelector('.place-value-strip');
      if(!grid||!bar||!strip||bar.dataset.ready==='1')return;
      bar.dataset.ready='1';
      const base=String(tool.dataset.baseDigits||'').split('|'),stripDigits=[...strip.querySelectorAll('.place-value-strip-digit')],pad=3,columnCount=7;
      const source=tool.querySelector('[data-place-value-source]'),targets=[...tool.querySelectorAll('[data-place-value-target]')];
      const autoShift=tool.dataset.autoShift==='1',targetShift=Number(tool.dataset.targetShift)||0;
      let shift=Number(tool.dataset.initialShift)||0,step=1,startX=0,startPx=0,currentPx=0;
      const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
      const displayForShift=value=>{
        const mapped=Array(columnCount).fill('');
        for(let windowIndex=0;windowIndex<columnCount;windowIndex++){
          const source=windowIndex+value;
          mapped[windowIndex]=source>=0&&source<columnCount?(base[source]||''):'';
        }
        const nonEmpty=[];mapped.forEach((digit,index)=>{if(digit!=='')nonEmpty.push(index);});
        const display=Array(columnCount).fill(''),ghost=Array(columnCount).fill(false);
        if(nonEmpty.length){
          let left=nonEmpty[0],right=nonEmpty[nonEmpty.length-1];
          while(left<3&&mapped[left]==='0'&&nonEmpty.some(index=>index>left))left++;
          const leftLimit=left<=3?left:3,rightLimit=right>3?right:3;
          for(let index=leftLimit;index<=rightLimit;index++){
            if(mapped[index]===''){display[index]='0';ghost[index]=true;}else display[index]=mapped[index];
          }
        }
        return {display,ghost};
      };
      const renderDigits=value=>{
        const result=displayForShift(value);
        stripDigits.forEach(node=>{node.textContent='';node.classList.remove('ghost-zero','is-units-digit');});
        result.display.forEach((digit,windowIndex)=>{
          const stripIndex=pad+windowIndex+value,node=stripDigits[stripIndex];if(!node)return;
          node.textContent=digit;node.classList.toggle('ghost-zero',result.ghost[windowIndex]);node.classList.toggle('is-units-digit',windowIndex===3);
        });
      };
      const setTransforms=(px,snap=false)=>{
        bar.style.transition=snap?'transform .34s cubic-bezier(.2,.75,.25,1)':'none';strip.style.transition=snap?'transform .34s cubic-bezier(.2,.75,.25,1)':'none';
        bar.style.transform='translateX('+px+'px)';strip.style.transform='translateX('+(-pad*step+px)+'px)';currentPx=px;
      };
      const apply=(value,snap=true)=>{
        shift=clamp(Math.round(value),-3,3);renderDigits(shift);setTransforms(-shift*step,snap);bar.setAttribute('aria-valuenow',String(shift));
      };
      const clearTapSelection=()=>{
        tool.classList.remove('tap-selecting');
        if(source) source.setAttribute('aria-pressed','false');
        targets.forEach(target=>target.removeAttribute('tabindex'));
      };
      const toggleTapSelection=()=>{
        if(!source)return;
        const active=!tool.classList.contains('tap-selecting');
        clearTapSelection();
        if(active){
          tool.classList.add('tap-selecting');source.setAttribute('aria-pressed','true');
          targets.forEach(target=>target.setAttribute('tabindex','0'));
        }
      };
      const refresh=()=>{step=grid.clientWidth/columnCount;apply(shift,false);};
      const requestFrame=typeof globalThis.requestAnimationFrame==='function'?globalThis.requestAnimationFrame.bind(globalThis):(callback=>callback());
      requestFrame(()=>{refresh();if(autoShift)requestFrame(()=>apply(targetShift,true));});
      bar.addEventListener('pointerdown',event=>{event.preventDefault();clearTapSelection();refresh();startX=event.clientX;startPx=currentPx;bar.setPointerCapture(event.pointerId);});
      bar.addEventListener('pointermove',event=>{if(!bar.hasPointerCapture(event.pointerId))return;const px=clamp(startPx+(event.clientX-startX),-3*step,3*step),next=clamp(Math.round(-px/step),-3,3);if(next!==shift){shift=next;renderDigits(shift);bar.setAttribute('aria-valuenow',String(shift));}setTransforms(px,false);});
      const end=event=>{if(!bar.hasPointerCapture(event.pointerId))return;bar.releasePointerCapture(event.pointerId);apply(shift,true);};
      bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
      bar.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();refresh();apply(shift+(event.key==='ArrowLeft'?1:-1),true);});
      if(source){
        source.addEventListener('click',toggleTapSelection);
        source.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();toggleTapSelection();});
        targets.forEach(target=>{
          const chooseTarget=()=>{
            if(!tool.classList.contains('tap-selecting'))return;
            refresh();apply(3-Number(target.dataset.placeValueTarget),true);clearTapSelection();bar.focus();
          };
          target.addEventListener('click',chooseTarget);
          target.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();chooseTarget();});
        });
      }
    });
  }

  const presets=Object.freeze([
    {id:'fois-dix',label:'Multiplier par 10',data:{value:3.07,factor:10,shift:1,result:30.7,symbol:'×'}},
    {id:'fois-mille',label:'Multiplier par 1 000',data:{value:0.84,factor:1000,shift:3,result:840,symbol:'×'}},
    {id:'divise-dix',label:'Diviser par 10',data:{value:72,factor:10,shift:-1,result:7.2,symbol:'÷'}},
    {id:'divise-cent',label:'Diviser par 100',data:{value:45.8,factor:100,shift:-2,result:0.458,symbol:'÷'}},
    {id:'divise-mille',label:'Diviser par 1 000',data:{value:125,factor:1000,shift:-3,result:0.125,symbol:'÷'}}
  ].map(item=>Object.freeze({id:item.id,label:item.label,data:Object.freeze(item.data)})));

  global.MATHSGO_VISUALS.register('numbers.glisse-nombre',{
    version:'1.2.0',
    label:'Glisse-nombre',
    family:'Nombres',
    supports:Object.freeze(['phone','computer','projection','print']),
    description:'Outil interactif complet : la bande grise et les chiffres glissent devant une virgule fixe pour multiplier ou diviser par 10, 100 ou 1 000.',
    presets,
    render:placeValueTableHtml,
    setup:setupPlaceValueTools
  });
  global.placeValueToolHtml=placeValueTableHtml;
  global.setupPlaceValueTools=setupPlaceValueTools;
})(globalThis);
