let mathsgoPreparedShare=null;
let mathsgoPreparedQr=null;

function mathsgoSetSeriesMessage(message,kind='',target='main'){
  const ids={main:'seriesMessage',share:'shareSeriesMessage',open:'openSeriesMessage'};
  const box=document.getElementById(ids[target]||ids.main);if(!box)return;
  box.textContent=message||'';box.className='series-message'+(kind?' '+kind:'');box.hidden=!message;
}

function mathsgoSetSharePanel(open){
  const overlay=document.getElementById('shareOverlay');if(overlay)overlay.hidden=!open;
  const button=document.getElementById('shareButton');if(button)button.setAttribute('aria-expanded',open?'true':'false');
  mathsgoSyncModalBody();
  if(open) requestAnimationFrame(()=>document.querySelector('#sharePanel .share-close')?.focus());
  else button?.focus();
}

function mathsgoSyncModalBody(){
  const open=[...document.querySelectorAll('.modal-overlay')].some(overlay=>!overlay.hidden);
  document.body.classList.toggle('modal-open',open);
}

function setOpenSeriesPanel(open){
  const overlay=document.getElementById('openSeriesOverlay');if(overlay)overlay.hidden=!open;
  const button=document.getElementById('openSeriesButton');if(button)button.setAttribute('aria-expanded',open?'true':'false');
  if(open) mathsgoSetSeriesMessage('','','open');
  mathsgoSyncModalBody();
  if(open) requestAnimationFrame(()=>document.getElementById('seriesCodeInput')?.focus());
  else button?.focus();
}

function prepareSeriesShare(){
  try{
    const definition=readSeriesDefinitionFromUi();
    const code=encodeSeriesDefinition(definition);
    const link=linkForSeriesDefinition(definition);
    mathsgoPreparedShare={definition,code,link};mathsgoPreparedQr=null;
    document.getElementById('shareCode').value=code;
    document.getElementById('shareLink').value=link;
    const qrBox=document.getElementById('qrBox');if(qrBox)qrBox.replaceChildren();
    mathsgoSetQrVisibility(false);
    mathsgoSetSharePanel(true);mathsgoSetSeriesMessage('Lien prêt. Cette série ne contient aucune donnée personnelle.','good','share');
  }catch(error){mathsgoSetSeriesMessage(error&&error.message?error.message:'Impossible de préparer le partage.','bad','share');}
}

function closeSeriesShare(){mathsgoSetSharePanel(false);}

async function mathsgoCopyText(value,label){
  let helper=null;
  try{
    if(navigator.clipboard&&window.isSecureContext) await navigator.clipboard.writeText(value);
    else{
      helper=document.createElement('textarea');helper.value=value;helper.setAttribute('readonly','');helper.style.position='fixed';helper.style.opacity='0';document.body.append(helper);helper.select();
      if(!document.execCommand('copy')) throw new Error('copy');
    }
    mathsgoSetSeriesMessage(label+' copié.','good','share');
  }catch(error){mathsgoSetSeriesMessage('La copie automatique a échoué. Sélectionne le texte puis copie-le.','bad','share');}
  finally{helper?.remove();}
}

function copySeriesCode(){if(mathsgoPreparedShare)mathsgoCopyText(mathsgoPreparedShare.code,'Code');}
function copySeriesLink(){if(mathsgoPreparedShare)mathsgoCopyText(mathsgoPreparedShare.link,'Lien');}

function mathsgoBuildQr(value){
  if(typeof qrcode!=='function') throw new Error('Le générateur de QR code n’est pas disponible.');
  const qr=qrcode(0,'M');qr.addData(value,'Byte');qr.make();return qr;
}

function mathsgoSetQrVisibility(visible){
  const box=document.getElementById('qrBox');if(box)box.hidden=!visible;
  const button=document.getElementById('toggleQrButton');if(button){button.textContent=visible?'Masquer le QR code':'Afficher le QR code';button.setAttribute('aria-expanded',visible?'true':'false');}
}

function showSeriesQr(){
  try{
    const box=document.getElementById('qrBox');
    if(box&&!box.hidden){mathsgoSetQrVisibility(false);return;}
    if(!mathsgoPreparedShare) prepareSeriesShare();
    if(!mathsgoPreparedShare) return;
    if(!mathsgoPreparedQr) mathsgoPreparedQr=mathsgoBuildQr(mathsgoPreparedShare.link);
    if(box&&!box.querySelector('svg')) box.innerHTML=mathsgoPreparedQr.createSvgTag({cellSize:6,margin:4,scalable:true});
    const svg=box?.querySelector('svg');svg?.setAttribute('role','img');svg?.setAttribute('aria-label','QR code de la série');
    mathsgoSetQrVisibility(true);
  }catch(error){mathsgoSetSeriesMessage(error&&error.message?error.message:'Impossible de créer le QR code.','bad','share');}
}

function downloadSeriesQr(){
  try{
    if(!mathsgoPreparedShare) prepareSeriesShare();
    if(!mathsgoPreparedShare) return;
    if(!mathsgoPreparedQr) mathsgoPreparedQr=mathsgoBuildQr(mathsgoPreparedShare.link);
    const margin=4,cell=9,count=mathsgoPreparedQr.getModuleCount(),size=(count+margin*2)*cell;
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,size,size);context.fillStyle='#000';
    for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(mathsgoPreparedQr.isDark(row,col))context.fillRect((col+margin)*cell,(row+margin)*cell,cell,cell);
    const link=document.createElement('a');link.download='serie-mathsgo-'+seriesIdForDefinition(mathsgoPreparedShare.definition)+'.png';link.href=canvas.toDataURL('image/png');link.click();
  }catch(error){mathsgoSetSeriesMessage(error&&error.message?error.message:'Impossible d’enregistrer le QR code.','bad','share');}
}

function openSeriesFromEntry(){
  const input=document.getElementById('seriesCodeInput');
  try{
    const definition=decodeSeriesDefinition(input.value);
    applySeriesDefinitionToUi(definition);
    generateFromDefinition(definition,{sameTab:true});
  }catch(error){mathsgoSetSeriesMessage(error&&error.message?error.message:'Impossible d’ouvrir cette série.','bad','open');}
}

function openSharedSeriesFromLocation(){
  const params=new URLSearchParams(location.hash.replace(/^#/,''));
  if(!params.has('s')) return false;
  try{
    const definition=decodeSeriesDefinition(location.href);
    applySeriesDefinitionToUi(definition);
    setTimeout(()=>generateFromDefinition(definition,{sameTab:true}),0);
    return true;
  }catch(error){
    mathsgoSetSeriesMessage(error&&error.message?error.message:'Le lien de série est invalide.','bad');
    return false;
  }
}

document.getElementById('seriesCodeInput')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();openSeriesFromEntry();}});
document.addEventListener('keydown',event=>{
  const overlay=[...document.querySelectorAll('.modal-overlay')].find(item=>!item.hidden);
  if(event.key==='Tab'&&overlay){
    const focusable=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(item=>!item.hidden&&item.getClientRects().length);
    if(!focusable.length){event.preventDefault();return;}
    const first=focusable[0],last=focusable[focusable.length-1],active=document.activeElement;
    if(!overlay.contains(active)){event.preventDefault();(event.shiftKey?last:first).focus();}
    else if(event.shiftKey&&active===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&active===last){event.preventDefault();first.focus();}
    return;
  }
  if(event.key==='Escape'){
    if(!document.getElementById('shareOverlay')?.hidden) closeSeriesShare();
    else if(!document.getElementById('openSeriesOverlay')?.hidden) setOpenSeriesPanel(false);
  }
});
openSharedSeriesFromLocation();
