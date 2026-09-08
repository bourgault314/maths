import {FAMILLES,CONTEXTES,generer,depuisIdentifiant,methodes,parcours,enonce,objet,mesure,nombre,verifierEssai} from './moteur.mjs?v=20260908-3';
import {echapper,renduEnonce,renduFrame,renduImpression,equationHTML,definitions} from './affichage.mjs?v=20260908-3';

const $=id=>document.getElementById(id);
const PHASES=['Comprendre','Représenter','Transformer','Calculer','Vérifier'];
const state={p:null,methode:'substitution',frames:[],index:0,style:'barres',hints:new Set(),essais:[],history:[],presentation:false};
const option=(value,text)=>`<option value="${echapper(value)}">${echapper(text)}</option>`;
$('family').innerHTML=Object.entries(FAMILLES).map(([id,v])=>option(id,v.titre)).join('');
$('context').innerHTML=Object.entries(CONTEXTES).map(([id,v])=>option(id,v.titre)).join('');
$('steps').innerHTML=PHASES.map((s,i)=>`<button type="button" data-phase="${i}" aria-label="${i+1}. ${s}"><span class="step-number">${i+1}</span><span>${s}</span></button>`).join('');
let noticeTimer;
function message(text){$('status').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('status').textContent='',5000);}
function seed(){return crypto.getRandomValues(new Uint32Array(1))[0];}
function saveHistory(){try{sessionStorage.setItem('mathsgo-inconnues-history',JSON.stringify(state.history));}catch{/* Le navigateur peut refuser le stockage local. */}}
function historyMenu(){ $('historySelect').innerHTML=option('','Choisir…')+state.history.map(id=>option(id,id)).join(''); }
function actualiserURL(){const url=new URL(location.href);url.searchParams.set('ex',state.p.id);url.searchParams.set('vue',state.style);url.searchParams.set('methode',state.methode);history.replaceState(null,'',url);}
function loadProblem(p){
  state.p=p;state.methode=methodes(p)[0].id;state.index=0;state.hints.clear();state.essais=[];
  state.frames=parcours(p,state.methode);state.history=[p.id,...state.history.filter(id=>id!==p.id)].slice(0,20);saveHistory();historyMenu();
  $('family').value=p.famille;$('level').value=p.niveau;$('context').value=p.contexte;$('exerciseId').value=p.id;
  $('method').innerHTML=methodes(p).map(v=>option(v.id,v.titre)).join('');
  $('methodGroup').hidden=methodes(p).length===1;
  $('methodHelp').textContent=p.famille==='multiple'?'Le regroupement inverse est proposé quand les petites quantités forment des groupes entiers.':'';
  $('levelHelp').textContent=FAMILLES[p.famille].niveaux[p.niveau];
  $('teacherInfo').innerHTML=`<p>${p.inconnues.length} inconnue${p.inconnues.length>1?'s':''} · ${['Découvrir','S’entraîner','Approfondir'][p.niveau]}</p><code>${echapper(FAMILLES[p.famille].forme)}</code>${definitions(p)}<p>${p.donnees.map(e=>equationHTML(e,p,true)).join('<br>')}</p>`;
  $('teacher').open=false;
  $('familyLabel').textContent=FAMILLES[p.famille].titre;
  $('reference').textContent=`${['Découvrir','S’entraîner','Approfondir'][p.niveau]} · ${p.id}`;
  $('statement').innerHTML=renduEnonce(p);actualiserURL();render();preparePrint();
}
function nouveau(){loadProblem(generer({famille:$('family').value,niveau:Number($('level').value),contexte:$('context').value,seed:seed()}));message('Nouveau problème prêt.');}
function aides(){
  const p=state.p,e=enonce(p),texts=[e.question,e.lignes.join(' '),p.famille==='combinaison'?'Cherche une partie commune aux deux lots. Peut-on préparer des lots comparables ?':p.famille==='lot'?'Commence par ce que tu peux trouver dans le premier lot.':p.famille==='equilibre'?'Que peut-on retirer à la fois des deux côtés sans changer l’égalité ?':'Essaie de n’avoir plus qu’une sorte de part inconnue. Que peux-tu remplacer ou retirer ?'];
  return `<div class="aides">${['Que cherche-t-on ?','Que sait-on déjà ?','Quelle idée essayer ?'].map((title,i)=>`<section class="aide"><h3>${title}</h3><button data-hint="${i}" aria-expanded="${state.hints.has(i)}" aria-controls="hint-${i}">${state.hints.has(i)?'Masquer':'Afficher une aide'}</button><p id="hint-${i}" ${state.hints.has(i)?'':'hidden'}>${echapper(texts[i])}</p></section>`).join('')}</div><details class="essais" id="trialDetails"><summary>Chercher par essais</summary><p>Propose des valeurs. Un essai doit convenir à toutes les données.</p><form id="trialForm">${p.inconnues.map(s=>`<label for="trial-${s}">${objet(p,s).picto} ${echapper(objet(p,s).nom)} (${CONTEXTES[p.contexte].unite})<input id="trial-${s}" name="${s}" type="text" inputmode="decimal" required maxlength="8" autocomplete="off"></label>`).join('')}<button type="submit">Tester ces valeurs</button></form><div id="trialFeedback" class="essais-feedback" role="status"></div><div id="trialHistory" class="essais-scroll"></div></details>`;
}
function render(){
  const f=state.frames[state.index], phaseFrames=state.frames.filter(x=>x.phase===f.phase),phaseIndex=phaseFrames.indexOf(f);
  $('phaseLabel').textContent=`${f.phase+1} · ${PHASES[f.phase]}`;$('progressText').textContent=phaseFrames.length>1?`Action ${phaseIndex+1} sur ${phaseFrames.length}`:'';
  $('frameTitle').textContent=f.titre;$('frameText').textContent=f.texte;
  $('board').innerHTML=f.phase===0?aides():renduFrame(f,state.p,{style:state.style});
  $('prevBtn').disabled=state.index===0;$('nextBtn').disabled=state.index===state.frames.length-1;
  $('nextBtn').textContent=state.index===state.frames.length-1?'Terminé ✓':state.frames[state.index+1].vide?'Construire →':f.vide?'Révéler le schéma →':'Suivant →';
  $('nextHint').textContent=state.index===state.frames.length-1?'Toutes les données sont vérifiées.':state.frames[state.index+1].titre;
  document.querySelectorAll('[data-phase]').forEach(b=>{const i=+b.dataset.phase;if(i===f.phase)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.classList.toggle('passee',i<f.phase);});
  if(f.phase===0){document.querySelectorAll('[data-hint]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.hint;state.hints.has(i)?state.hints.delete(i):state.hints.add(i);b.setAttribute('aria-expanded',String(state.hints.has(i)));b.textContent=state.hints.has(i)?'Masquer':'Afficher une aide';$('hint-'+i).hidden=!state.hints.has(i);}));$('trialForm').addEventListener('submit',trial);renderTrials();}
}
function aller(i){state.index=Math.max(0,Math.min(i,state.frames.length-1));render();if(matchMedia('(max-width:700px)').matches)$('frameTitle').scrollIntoView({block:'start',behavior:'instant'});}
function trial(e){
  e.preventDefault();const values={};for(const s of state.p.inconnues){const raw=$('trial-'+s).value.trim().replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||+raw<=0){message('Entre des quantités positives, avec au plus deux chiffres après la virgule.');return;}values[s]=+raw;}
  const checks=verifierEssai(state.p,values);state.essais.push({values,checks});state.essais=state.essais.slice(-8);renderTrials();
  $('trialFeedback').innerHTML=`<p><strong>${checks.every(c=>c.ok)?'Ces valeurs conviennent à toutes les données.':'Vérifie les données une à une.'}</strong></p>`+checks.map((c,i)=>`<p>Donnée ${i+1} : ${echapper(mesure(state.p,c.gauche))} ${c.ok?'=':'≠'} ${echapper(mesure(state.p,c.droite))} — ${c.ok?'vérifiée':'à ajuster'}.</p>`).join('');
}
function renderTrials(){if(!$('trialHistory')||!state.essais.length)return;$('trialHistory').innerHTML=`<table><caption>${state.essais.length===1?'Le dernier essai':`Les ${state.essais.length} derniers essais`}</caption><thead><tr>${state.p.inconnues.map(s=>`<th>${echapper(objet(state.p,s).nom)}</th>`).join('')}<th>Données vérifiées</th></tr></thead><tbody>${state.essais.map(e=>`<tr>${state.p.inconnues.map(s=>`<td>${echapper(mesure(state.p,e.values[s]))}</td>`).join('')}<td>${e.checks.filter(c=>c.ok).length} / ${e.checks.length}</td></tr>`).join('')}</tbody></table>`;}
function regler(open){$('reglages').hidden=!open;$('settingsBtn').setAttribute('aria-expanded',String(open));if(open)$('closeSettings').focus();else $('settingsBtn').focus();}
function changerMethode(value){const phase=state.frames[state.index].phase;state.methode=value;$('method').value=value;state.frames=parcours(state.p,value);state.index=Math.max(0,state.frames.findIndex(f=>f.phase===phase));actualiserURL();render();preparePrint();}
function preparePrint(){if(!state.p)return;$('printRoot').innerHTML=renduImpression(state.p,state.methode,$('printType').value,state.style);}
async function imprimer(){preparePrint();const img=$('printRoot').querySelector('img');if(img)try{await img.decode();}catch{/* Le texte de marque demeure disponible. */}if($('printDialog').open)$('printDialog').close();if($('previewDialog').open)$('previewDialog').close();window.print();}
async function pleinEcran(){
  if(document.fullscreenElement){await document.exitFullscreen();return;}
  if(state.presentation){state.presentation=false;$('application').classList.remove('projection');$('projection').checked=false;$('fullscreenBtn').textContent='Plein écran';return;}
  regler(false);$('projection').checked=true;$('application').classList.add('projection');
  if($('application').requestFullscreen)try{await $('application').requestFullscreen();return;}catch{/* La projection agrandie reste utilisable. */}
  state.presentation=true;$('fullscreenBtn').textContent='Quitter la projection';message('Affichage agrandi activé.');
}
$('newBtn').addEventListener('click',nouveau);
['family','level','context'].forEach(id=>$(id).addEventListener('change',nouveau));
$('method').addEventListener('change',e=>changerMethode(e.target.value));
$('style').addEventListener('change',e=>{state.style=e.target.value;actualiserURL();render();preparePrint();});
$('settingsBtn').addEventListener('click',()=>regler($('reglages').hidden));$('closeSettings').addEventListener('click',()=>regler(false));
$('restartBtn').addEventListener('click',()=>{state.hints.clear();aller(0);message('Même problème, repris au début.');});
$('prevBtn').addEventListener('click',()=>aller(state.index-1));$('nextBtn').addEventListener('click',()=>aller(state.index+1));
$('steps').addEventListener('click',e=>{const b=e.target.closest('[data-phase]');if(b)aller(state.frames.findIndex(f=>f.phase===+b.dataset.phase));});
$('projection').addEventListener('change',e=>$('application').classList.toggle('projection',e.target.checked));
$('fullscreenBtn').addEventListener('click',pleinEcran);
document.addEventListener('fullscreenchange',()=>{$('fullscreenBtn').textContent=document.fullscreenElement?'Quitter le plein écran':'Plein écran';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('reglages').hidden){regler(false);return;}if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.target.closest('input,textarea,select,button,summary,[contenteditable],dialog')||document.querySelector('dialog[open]'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();aller(state.index+(e.key==='ArrowRight'?1:-1));}});
$('restoreForm').addEventListener('submit',e=>{e.preventDefault();try{loadProblem(depuisIdentifiant($('exerciseId').value));regler(false);message('Exercice retrouvé.');}catch(err){message(err.message);}});
$('historySelect').addEventListener('change',e=>{if(e.target.value){loadProblem(depuisIdentifiant(e.target.value));regler(false);}});
$('shareBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);message('Lien copié : il ouvre le même exercice, au début.');}catch{regler(true);$('exerciseId').select();message('Copie l’identifiant affiché dans les réglages.');}});
$('printBtn').addEventListener('click',()=>{$('printDialog').showModal();});$('printType').addEventListener('change',preparePrint);
$('doPrint').addEventListener('click',imprimer);$('printPreview').addEventListener('click',imprimer);
$('previewPrint').addEventListener('click',()=>{preparePrint();$('printPreviewContent').innerHTML=$('printRoot').innerHTML;$('printDialog').close();$('previewDialog').showModal();});
$('closePreview').addEventListener('click',()=>$('previewDialog').close());window.addEventListener('beforeprint',preparePrint);
try{const saved=JSON.parse(sessionStorage.getItem('mathsgo-inconnues-history')||'[]');state.history=Array.isArray(saved)?saved.filter(id=>{try{return !!depuisIdentifiant(id);}catch{return false;}}).slice(0,20):[];}catch{/* Séance sans historique. */}
const params=new URLSearchParams(location.search);if(['barres','pictos','lettres','tout'].includes(params.get('vue')))state.style=params.get('vue');$('style').value=state.style;
let initial;try{initial=params.has('ex')?depuisIdentifiant(params.get('ex')):generer({seed:seed()});}catch{initial=generer({seed:seed()});message('Lien d’exercice invalide : un nouveau problème a été préparé.');}
loadProblem(initial);if(methodes(initial).some(m=>m.id===params.get('methode')))changerMethode(params.get('methode'));
