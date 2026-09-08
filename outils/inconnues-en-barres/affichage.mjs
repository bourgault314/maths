import {CONTEXTES, FAMILLES, objet, nombre, mesure, enonce, evaluer, parcours} from './moteur.mjs?v=20260908-3';

export const echapper = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const couleurs={A:'#ffead1',B:'#dbeafe',C:'#e8ddfa'};
const termeTexte=(t,p,litteral=false,numerique=false)=>t.symbol?(numerique?`${t.n===1?'':t.n+' × '}${nombre(p.valeurs[t.symbol])}`:`${t.n===1?'':t.n+(litteral?'':' × ')}${litteral?t.symbol:objet(p,t.symbol).picto}`):nombre(t.value);
export function equationTexte(e,p,litteral=false,numerique=false){return `${e.gauche.map(t=>termeTexte(t,p,litteral,numerique)).join(' + ')} = ${e.droite.map(t=>termeTexte(t,p,litteral,numerique)).join(' + ')}`;}
const symboleHTML=(s,p,litteral)=>litteral?`<i class="lettre lettre-${s}">${s}</i>`:`<span class="objet" role="img" aria-label="${echapper(objet(p,s).nom)}">${objet(p,s).picto}</span>`;
export function equationHTML(e,p,litteral=false,numerique=false){
  const term=t=>t.symbol?(numerique?`${t.n===1?'':`${t.n} × `}${nombre(p.valeurs[t.symbol])}`:`${t.n===1?'':`${t.n}${litteral?'':' × '}`}${symboleHTML(t.symbol,p,litteral)}`):nombre(t.value);
  return `<span class="expression">${e.gauche.map(term).join(' + ')} <b class="egal">=</b> ${e.droite.map(term).join(' + ')}</span>`;
}
function cellules(terms,compact){const regrouper=compact||terms.reduce((n,t)=>n+(t.symbol?t.n:1),0)>12;return terms.flatMap(t=>t.symbol&&!regrouper?Array.from({length:t.n},()=>({...t,n:1})):[t]);}
function schema(e,p,max,options,compact=false){
  const W=600, H=150, margin=3, rw=W-2*margin, rh=(H-8)/2;
  let out=`<svg class="schema ${compact?'schema-compact':'schema-detail'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${echapper(options.vide?'Schéma à compléter':equationTexte(e,p,true))}">`;
  [e.droite,e.gauche].forEach((terms,row)=>{
    let x=margin;
    for(const t of cellules(terms,compact&&!options.vide)){
      const value=t.symbol?t.n*p.valeurs[t.symbol]:t.value, width=rw*value/max, y=4+row*rh;
      const fill=t.symbol?couleurs[t.symbol]:'#f0fdf4';
      out+=`<rect x="${x}" y="${y}" width="${width}" height="${rh}" fill="${options.vide?'#fff':fill}" stroke="#627082" stroke-width="1.8"/>`;
      if(t.etat){out+=`<rect x="${x+2}" y="${y+2}" width="${Math.max(0,width-4)}" height="${rh-4}" fill="${t.etat==='commun'?'#f97316':'#3b82f6'}" fill-opacity=".16" stroke="${t.etat==='commun'?'#c45b17':'#2364ca'}" stroke-dasharray="7 4" stroke-width="2"/>`;}
      const label=options.vide?'…':t.symbol?`${t.n>1?t.n+' × ':''}${options.style==='lettres'?t.symbol:objet(p,t.symbol).picto}`:mesure(p,t.value);
      const maxSize=30, fontSize=Math.min(maxSize,(width-10)/Math.max(1,[...label].length)*1.6);
      // A small segment keeps its exact width; its label remains readable in the caption.
      if(fontSize>=(compact?20:22))out+=`<text x="${x+width/2}" y="${y+rh/2}" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="750" font-size="${fontSize}" fill="#14283b">${echapper(label)}</text>`;
      x+=width;
    }
  });
  return out+'</svg>';
}
export function rendusDonnees(rows,p,options={}){
  if(!rows.length)return '';
  const max=Math.max(...rows.flatMap(e=>[evaluer(e.gauche,p),evaluer(e.droite,p)]));
  return `<div class="schemas">${rows.map(e=>`<figure class="barre-figure">${e.titre?`<figcaption class="titre-donnee">${echapper(e.titre)}</figcaption>`:''}${schema(e,p,max,options)}${schema(e,p,max,options,true)}<div class="legende-schema${!options.vide&&options.style&&options.style!=='barres'?' sr-only':''}">${options.vide?'Complète le total et les objets.':equationHTML(e,p,options.style==='lettres')}${options.vide?'':` <span class="unite-schema">(${echapper(CONTEXTES[p.contexte].unite)})</span>`}</div></figure>`).join('')}</div>`;
}
export function definitions(p){return `<div class="definitions">${p.inconnues.map(s=>`<span>${symboleHTML(s,p,false)} <i>${s}</i> : ${CONTEXTES[p.contexte].grandeur==='prix'?'prix':CONTEXTES[p.contexte].grandeur} d’${objet(p,s).article} ${objet(p,s).nom}, en ${echapper(CONTEXTES[p.contexte].unite)}.</span>`).join('')}</div>`;}
export function renduEnonce(p){const e=enonce(p);return `<div class="donnees-texte">${e.lignes.map((s,i)=>`<p><span class="numero-donnee">${i+1}</span>${echapper(s)}</p>`).join('')}</div><p class="question">${echapper(e.question)}</p><p class="convention">${echapper(e.convention)}</p>`;}
export function renduFrame(f,p,options={}){
  const style=options.style||'barres';
  let html=rendusDonnees(f.rows,p,{style,vide:f.vide});
  if(!f.vide&&['pictos','tout','lettres'].includes(style)&&f.rows.length){
    html+=`<div class="ecritures">${['lettres','tout'].includes(style)?definitions(p):''}${f.rows.map(e=>`<div class="ligne-equations">${['pictos','tout'].includes(style)?`<div>${equationHTML(e,p)}</div>`:''}${['lettres','tout'].includes(style)?`<div>${equationHTML(e,p,true)}</div>`:''}</div>`).join('')}</div>`;
  }
  if(f.calculs.length)html+=`<div class="calculs">${f.calculs.map(c=>`<p>${echapper(c).replace(/([ABC])/g,(_,s)=>symboleHTML(s,p,['lettres','tout'].includes(style)))}</p>`).join('')}</div>`;
  if(f.reponses.length&&!f.verification)html+=`<div class="resultats">${f.reponses.map(s=>`<p>${symboleHTML(s,p,style==='lettres')} <span>${echapper(objet(p,s).nom)}</span><strong>${echapper(mesure(p,p.valeurs[s]))}</strong></p>`).join('')}</div>`;
  if(f.verification){
    html=`<div class="resultats">${p.inconnues.map(s=>`<p>${symboleHTML(s,p,style==='lettres')} <span>${echapper(objet(p,s).nom)}</span><strong>${echapper(mesure(p,p.valeurs[s]))}</strong></p>`).join('')}</div>`+html;
    html+=`<div class="verifications"><h3>Vérifier les données de départ</h3>${p.donnees.map((e,i)=>`<p><span class="valide" aria-label="Vérifiée">✓</span><span><b>Donnée ${i+1}</b> ${equationHTML(e,p,true,true)}<small>${echapper(mesure(p,evaluer(e.gauche,p)))} = ${echapper(mesure(p,evaluer(e.droite,p)))}</small></span></p>`).join('')}</div>`;
  }
  return html;
}
export function renduImpression(p,methode,type='guidee',style='barres'){
  const entete=`<header class="print-header"><img src="/assets/img/logos/mathsgo/logo-print.png" alt="maths&go"><div><h1>Inconnues en barres</h1><p>${echapper(FAMILLES[p.famille].titre)}</p><small>${echapper(p.id)}</small></div></header>`;
  const premiere=`<section class="print-page">${entete}<p class="identite">Prénom : _____________________ Date : ______________</p>${renduEnonce(p)}${type==='guidee'?`<h2>1. Représenter les données</h2>${rendusDonnees(p.donnees,p,{vide:true})}<h2>2. Transformer et calculer</h2>`:'<h2>Ma recherche</h2>'}<div class="espace-recherche"></div><h2>Ma réponse et ma vérification</h2><div class="espace-reponse"></div><footer class="print-footer">mathsgo.re · Gwenaël Bourgault · ${echapper(p.id)}</footer></section>`;
  if(type!=='corrige')return premiere;
  return `<section class="print-page">${entete}<h2>Corrigé</h2>${renduEnonce(p)}${definitions(p)}${parcours(p,methode).filter(f=>f.phase>=2).map(f=>`<section class="print-etape"><h2>${echapper(f.titre)}</h2><p>${echapper(f.texte)}</p>${renduFrame(f,p,{style})}</section>`).join('')}<footer class="print-footer">mathsgo.re · Gwenaël Bourgault · ${echapper(p.id)}</footer></section>`;
}
