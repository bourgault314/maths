import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const helperSource=fs.readFileSync('auto/scripts/shared/interactions/pointer-drag.js','utf8');
const placeValueSource=fs.readFileSync('auto/scripts/shared/visuals/numbers/place-value-table.js','utf8');
const slideshowSource=fs.readFileSync('auto/scripts/03-slideshow.js','utf8');

function pointerEvent(type,pointerId,clientX=0,clientY=0){
  const event=new Event(type,{cancelable:true});
  Object.defineProperties(event,{
    pointerId:{value:pointerId},
    clientX:{value:clientX},
    clientY:{value:clientY}
  });
  return event;
}

function loadPointerHelper(){
  const context=vm.createContext({});
  vm.runInContext(helperSource,context);
  return context.beginTrackedPointerDrag;
}

test('le suivi du glisser continue même si la capture du pointeur échoue',()=>{
  const beginTrackedPointerDrag=loadPointerHelper();
  const view=new EventTarget();
  const released=[];
  const owner={
    ownerDocument:{defaultView:view},
    setPointerCapture(){throw new Error('capture indisponible');},
    releasePointerCapture(pointerId){released.push(pointerId);}
  };
  const moves=[],ends=[];
  assert.equal(beginTrackedPointerDrag(owner,{pointerId:7,button:0},{
    move:event=>moves.push(event.clientX),
    end:event=>ends.push(event.clientX)
  }),true);

  view.dispatchEvent(pointerEvent('pointermove',8,30));
  view.dispatchEvent(pointerEvent('pointermove',7,120));
  view.dispatchEvent(pointerEvent('pointerup',7,180));
  view.dispatchEvent(pointerEvent('pointermove',7,240));

  assert.deepEqual(moves,[120]);
  assert.deepEqual(ends,[180]);
  assert.deepEqual(released,[7]);
});

test('une annulation nettoie le suivi sans déclencher la fin normale',()=>{
  const beginTrackedPointerDrag=loadPointerHelper();
  const view=new EventTarget();
  const owner={ownerDocument:{defaultView:view},setPointerCapture(){},releasePointerCapture(){}};
  let ended=0,cancelled=0,moved=0;
  beginTrackedPointerDrag(owner,{pointerId:3,button:0},{
    move:()=>moved++,
    end:()=>ended++,
    cancel:()=>cancelled++
  });
  view.dispatchEvent(pointerEvent('pointermove',3,40));
  view.dispatchEvent(pointerEvent('pointercancel',3,40));
  view.dispatchEvent(pointerEvent('pointermove',3,80));
  assert.equal(moved,1);
  assert.equal(ended,0);
  assert.equal(cancelled,1);
});

test('les sept familles de glissés utilisent le suivi commun sans garde de capture',()=>{
  assert.equal((slideshowSource.match(/beginTrackedPointerDrag\(/g)||[]).length,6);
  assert.equal((placeValueSource.match(/beginTrackedPointerDrag\(/g)||[]).length,1);
  assert.doesNotMatch(slideshowSource,/hasPointerCapture/);
  assert.doesNotMatch(placeValueSource,/hasPointerCapture/);
  assert.doesNotMatch(slideshowSource,/\.addEventListener\('pointermove'/);
  assert.doesNotMatch(placeValueSource,/\.addEventListener\('pointermove'/);
});

test('le questionnaire embarque le moteur commun avec les interactions',()=>{
  const context=vm.createContext({
    setupPlaceValueTools:()=>{},
    placeValueToolHtml:()=>'',
    equationBuildResolution:()=>({}),
    equationDetailHtml:()=>'',
    equationSplatSvg:()=>''
  });
  vm.runInContext(`${helperSource}\n${slideshowSource}\nglobalThis.__makeDiapoWindowHtml=makeDiapoWindowHtml;`,context);
  const html=context.__makeDiapoWindowHtml([],'interactive');
  assert.match(html,/function beginTrackedPointerDrag/);
  assert.match(html,/beginTrackedPointerDrag\(cursor,event/);
  assert.match(html,/beginTrackedPointerDrag\(axis,event/);
});
