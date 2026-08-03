(function registerPointerDrag(global){
  function beginTrackedPointerDrag(owner,startEvent,handlers={}){
    if(!owner||!startEvent)return false;
    if(Number.isFinite(startEvent.button)&&startEvent.button!==0)return false;
    const view=owner.ownerDocument&&owner.ownerDocument.defaultView?owner.ownerDocument.defaultView:global;
    if(!view||typeof view.addEventListener!=='function')return false;
    const pointerId=startEvent.pointerId;
    let active=true;
    const matches=event=>active&&(pointerId===undefined||event.pointerId===pointerId);
    const onMove=event=>{if(matches(event)&&typeof handlers.move==='function')handlers.move(event);};
    const cleanup=()=>{
      view.removeEventListener('pointermove',onMove);
      view.removeEventListener('pointerup',onEnd);
      view.removeEventListener('pointercancel',onCancel);
    };
    const finish=(event,cancelled)=>{
      if(!matches(event))return;
      active=false;cleanup();
      try{owner.releasePointerCapture?.(pointerId);}catch(_){ }
      const callback=cancelled?handlers.cancel:handlers.end;
      if(typeof callback==='function')callback(event);
    };
    const onEnd=event=>finish(event,false);
    const onCancel=event=>finish(event,true);
    try{owner.setPointerCapture?.(pointerId);}catch(_){ }
    view.addEventListener('pointermove',onMove,{passive:false});
    view.addEventListener('pointerup',onEnd);
    view.addEventListener('pointercancel',onCancel);
    return true;
  }

  global.beginTrackedPointerDrag=beginTrackedPointerDrag;
})(globalThis);
