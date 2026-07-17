(function registerReadDataRenderer(global){
  const SVG_NS='http://www.w3.org/2000/svg';
  const AID_SPECS=Object.freeze({
    1:Object.freeze({family:'table-total',caption:'Repère toutes les valeurs de la ligne « livres », puis additionne-les.',touch:{axis:'row',required:[1],candidates:[0,1],instruction:'Touche la ligne qui contient les nombres à additionner.'}}),
    2:Object.freeze({family:'table-compare',caption:'Compare les trois effectifs de la même ligne, dans la même unité.',touch:{axis:'row',required:[1],candidates:[0,1],instruction:'Touche la ligne qui contient les effectifs à comparer.'}}),
    3:Object.freeze({family:'bar-read',caption:'Pars de « théâtre », remonte au sommet du bâton, puis suis le trait vers l’axe gradué.'}),
    4:Object.freeze({family:'line-difference',caption:'Lis les températures de lundi et de vendredi, puis calcule : vendredi − lundi.'}),
    5:Object.freeze({family:'pie-part',caption:'Compte les secteurs égaux associés à A, puis compare ce nombre au nombre total de secteurs.'}),
    6:Object.freeze({family:'table-column-total',caption:'Suis la colonne « basket », puis additionne les effectifs des filles et des garçons.',touch:{axis:'column',required:[2],candidates:[1,2,3],instruction:'Touche la colonne correspondant au sport demandé.'}}),
    7:Object.freeze({family:'bar-compare',caption:'Compare les hauteurs des trois bâtons en utilisant la même échelle.'}),
    8:Object.freeze({family:'line-compare',caption:'Compare la hauteur de tous les points en utilisant la même échelle.'}),
    9:Object.freeze({family:'pictogram',caption:'Chaque étoile vaut 5 élèves. Lis les trois « 5 », puis multiplie le nombre d’étoiles par 5.',touch:{axis:'row',required:[1],candidates:[0,1,2],instruction:'Touche la ligne correspondant à la langue demandée.'}}),
    10:Object.freeze({family:'table-difference',caption:'Lis les ventes de vendredi et de samedi, puis calcule : samedi − vendredi.',touch:{axis:'column',required:[1,2],candidates:[1,2,3],instruction:'Touche les deux colonnes nécessaires pour comparer les ventes.'}})
  });

  function aidSpecForQuestion(questionNumber){
    return AID_SPECS[Number(questionNumber)]||null;
  }

  function mark(elements,className){
    elements.filter(Boolean).forEach(element=>element.classList.add(className));
  }

  function tableCells(table,rowIndex){
    const row=table&&table.rows&&table.rows[rowIndex];
    return row?Array.from(row.cells):[];
  }

  function highlightTableCells(table,number){
    const highlight=(elements,kind)=>elements.filter(Boolean).forEach(element=>element.setAttribute('data-read-data-highlight',kind));
    if(number===1){
      highlight([tableCells(table,1)[0]],'label');
      highlight(tableCells(table,1).slice(1),'focus');
    }else if(number===2){
      highlight([tableCells(table,1)[0]],'label');
      highlight(tableCells(table,1).slice(1),'compare');
    }else if(number===6){
      highlight([tableCells(table,0)[2]],'label');
      highlight([tableCells(table,1)[2],tableCells(table,2)[2]],'focus');
    }else if(number===9){
      highlight(tableCells(table,1),'focus');
    }else if(number===10){
      highlight([tableCells(table,0)[1],tableCells(table,0)[2]],'label');
      highlight([tableCells(table,1)[1],tableCells(table,1)[2]],'focus');
    }
  }

  function preparePictogram(question,table){
    const wrap=question.querySelector('.legacy-table-dnb_32-9-wrap');
    if(wrap){
      while(question.firstChild&&question.firstChild!==wrap) question.removeChild(question.firstChild);
      question.insertBefore(global.document.createTextNode('Le pictogramme indique les langues choisies par les élèves.'),wrap);
    }
    question.classList.add('read-data-pictogram-question');
    const symbols=tableCells(table,1)[1];
    if(!symbols||symbols.querySelector('.read-data-star-group')) return;
    const count=(String(symbols.textContent||'').match(/★/g)||[]).length;
    const group=global.document.createElement('span');
    group.className='read-data-star-group';
    group.setAttribute('role','img');
    group.setAttribute('aria-label',count+' étoiles');
    for(let index=0;index<count;index++){
      const item=global.document.createElement('span');
      item.className='read-data-star-item';
      item.innerHTML='<span class="read-data-star" aria-hidden="true">★</span><span class="read-data-star-value" aria-hidden="true">5</span>';
      group.appendChild(item);
    }
    symbols.replaceChildren(group);
  }

  function prepareTouchTable(question,number,spec,correction){
    const table=question.querySelector('table');
    if(!table||!spec.touch) return false;
    const touch=spec.touch,prefix=touch.axis==='row'?'row:':'column:';
    question.classList.add('read-data-touch-root');
    question.setAttribute('data-read-data-touch','1');
    question.setAttribute('data-read-data-question',String(number));
    question.setAttribute('data-read-data-required',touch.required.map(index=>prefix+index).join('|'));
    question.setAttribute('data-read-data-instruction',touch.instruction);
    if(correction) question.classList.add('is-complete');
    touch.candidates.forEach(index=>{
      const choice=prefix+index;
      if(touch.axis==='row'){
        const row=table.rows&&table.rows[index];
        if(!row) return;
        row.setAttribute('data-read-data-choice',choice);
        row.setAttribute('role','button');
        row.setAttribute('tabindex',correction?'-1':'0');
        row.setAttribute('aria-pressed',String(correction&&touch.required.includes(index)));
      }else{
        Array.from(table.rows||[]).forEach((row,rowIndex)=>{
          const cell=row.cells&&row.cells[index];
          if(!cell) return;
          cell.setAttribute('data-read-data-choice',choice);
          cell.setAttribute('role','button');
          cell.setAttribute('tabindex',!correction&&rowIndex===0?'0':'-1');
          cell.setAttribute('aria-pressed',String(correction&&touch.required.includes(index)));
        });
      }
    });
    highlightTableCells(table,number);
    if(number===9) preparePictogram(question,table);
    return true;
  }

  function numberAttribute(element,name){
    return Number(element&&element.getAttribute(name));
  }

  function polygonTop(polygon){
    const coordinates=String(polygon&&polygon.getAttribute('points')||'')
      .trim().split(/\s+/).map(pair=>pair.split(',').map(Number)).filter(pair=>pair.length===2&&pair.every(Number.isFinite));
    return coordinates.length?Math.min(...coordinates.map(pair=>pair[1])):NaN;
  }

  function polygonLeft(polygon){
    const coordinates=String(polygon&&polygon.getAttribute('points')||'')
      .trim().split(/\s+/).map(pair=>pair.split(',').map(Number)).filter(pair=>pair.length===2&&pair.every(Number.isFinite));
    return coordinates.length?Math.min(...coordinates.map(pair=>pair[0])):NaN;
  }

  function guideLine(svg,x1,x2,y,className='read-data-guide-line'){
    if(![x1,x2,y].every(Number.isFinite)) return;
    const line=global.document.createElementNS(SVG_NS,'line');
    line.setAttribute('x1',String(x1));
    line.setAttribute('x2',String(x2));
    line.setAttribute('y1',String(y));
    line.setAttribute('y2',String(y));
    line.setAttribute('class',className);
    line.setAttribute('aria-hidden','true');
    svg.appendChild(line);
  }

  function labels(svg,names){
    const wanted=new Set(names);
    return Array.from(svg.querySelectorAll('text')).filter(text=>wanted.has(String(text.textContent||'').trim()));
  }

  function shadePie(svg){
    const sectors=[
      'M 130 105 L 60 105 A 70 70 0 0 1 130 35 Z',
      'M 130 105 L 130 175 A 70 70 0 0 1 60 105 Z'
    ];
    sectors.forEach(pathData=>{
      const path=global.document.createElementNS(SVG_NS,'path');
      path.setAttribute('d',pathData);
      path.setAttribute('class','read-data-pie-sector');
      path.setAttribute('aria-hidden','true');
      svg.insertBefore(path,svg.firstChild);
    });
  }

  function completeTemperatureScale(question,number){
    if(number!==4) return;
    const svg=question.querySelector('svg');
    if(!svg||svg.querySelector('[data-read-data-scale-extension]')) return;
    const extension=global.document.createElementNS(SVG_NS,'line');
    extension.setAttribute('x1','50');
    extension.setAttribute('x2','50');
    extension.setAttribute('y1','25');
    extension.setAttribute('y2','50');
    extension.setAttribute('class','read-data-scale-axis');
    extension.setAttribute('data-read-data-scale-extension','1');
    extension.setAttribute('aria-hidden','true');
    svg.appendChild(extension);
    [30,35,40].forEach(value=>{
      const y=225-value*5;
      const hasGrid=Array.from(svg.querySelectorAll('line')).some(line=>numberAttribute(line,'y1')===y&&numberAttribute(line,'y2')===y);
      if(!hasGrid){
        const grid=global.document.createElementNS(SVG_NS,'line');
        grid.setAttribute('x1','45');
        grid.setAttribute('x2','340');
        grid.setAttribute('y1',String(y));
        grid.setAttribute('y2',String(y));
        grid.setAttribute('class','read-data-scale-grid');
        grid.setAttribute('aria-hidden','true');
        svg.appendChild(grid);
      }
      const label=global.document.createElementNS(SVG_NS,'text');
      label.setAttribute('x','40');
      label.setAttribute('y',String(y+4));
      label.setAttribute('font-family','sans-serif');
      label.setAttribute('font-size','13');
      label.setAttribute('text-anchor','end');
      label.setAttribute('class','read-data-scale-label');
      label.textContent=String(value);
      svg.appendChild(label);
    });
  }

  function guideSvg(question,number){
    const svg=question.querySelector('svg');
    if(!svg) return;
    const polygons=Array.from(svg.querySelectorAll('polygon'));
    const circles=Array.from(svg.querySelectorAll('circle'));
    if(number===3){
      const theatre=polygons[1],top=polygonTop(theatre);
      mark([theatre],'read-data-focus-mark');
      mark(labels(svg,['théâtre']),'read-data-focus-label');
      guideLine(svg,50,polygonLeft(theatre),top);
    }else if(number===4){
      const points=[circles[0],circles[4]];
      mark(points,'read-data-focus-point');
      mark(labels(svg,['lun.','ven.']),'read-data-focus-label');
      points.forEach(point=>guideLine(svg,50,numberAttribute(point,'cx'),numberAttribute(point,'cy')));
    }else if(number===5){
      shadePie(svg);
      mark(labels(svg,['A']),'read-data-focus-label');
    }else if(number===7){
      mark(polygons,'read-data-compare-mark');
      mark(labels(svg,['club A','club B','club C']),'read-data-compare-label');
      polygons.forEach(polygon=>guideLine(svg,50,polygonLeft(polygon),polygonTop(polygon),'read-data-guide-line read-data-guide-line-soft'));
    }else if(number===8){
      mark(circles,'read-data-compare-point');
      mark(labels(svg,['lun.','mar.','mer.','jeu.']),'read-data-compare-label');
      circles.forEach(point=>guideLine(svg,30,numberAttribute(point,'cx'),numberAttribute(point,'cy'),'read-data-guide-line read-data-guide-line-soft'));
    }
  }

  function appendAid(question,spec){
    const caption=global.document.createElement('div');
    caption.className='read-data-aid-caption';
    caption.setAttribute('role','note');
    caption.innerHTML='<strong>Chemin de lecture&nbsp;:</strong> '+spec.caption;
    question.appendChild(caption);
  }

  function appendTouchAid(question,spec,correction){
    const panel=global.document.createElement('div');
    panel.className='read-data-touch-panel';
    panel.setAttribute('aria-live','polite');
    const instruction=global.document.createElement('div');
    instruction.className='read-data-touch-instruction';
    instruction.textContent=spec.touch.instruction;
    const caption=global.document.createElement('div');
    caption.className='read-data-aid-caption read-data-touch-caption';
    caption.setAttribute('role','note');
    caption.innerHTML='<strong>Chemin de lecture&nbsp;:</strong> '+spec.caption;
    panel.append(instruction,caption);
    question.appendChild(panel);
    if(correction) question.classList.add('is-complete');
  }

  function appendAidPlaceholder(question){
    const placeholder=global.document.createElement('div');
    placeholder.className='visual-placeholder read-data-aid-placeholder';
    question.appendChild(placeholder);
  }

  function renderQuestion({instance,correction,mode,renderGenericQuestion}){
    const number=Number(instance&&instance.q&&instance.q.n),spec=aidSpecForQuestion(number);
    const html=renderGenericQuestion(instance,correction,'with');
    if(!spec||!global.document) return html;
    const shell=global.document.createElement('div');
    shell.innerHTML=html;
    const question=shell.querySelector('.question');
    if(!question) return html;
    question.classList.add('read-data-guided-question');
    completeTemperatureScale(question,number);
    if(mode==='without-essential'){
      appendAidPlaceholder(question);
      return shell.innerHTML;
    }
    const tactile=prepareTouchTable(question,number,spec,correction);
    guideSvg(question,number);
    if(tactile) appendTouchAid(question,spec,correction);
    else appendAid(question,spec);
    return shell.innerHTML;
  }

  if(!global.MATHSGO_MODULE_RUNTIME) throw new Error('Le registre fonctionnel doit être chargé avant le rendu dnb_32.');
  global.MATHSGO_MODULE_RUNTIME.register('dnb_32',{
    renderer:{version:'1.1.0',renderQuestion,aidSpecForQuestion}
  });
})(globalThis);
