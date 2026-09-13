import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createGift,connectFrame} from '../jeux-cadeaux/galets-riviere/site.mjs';
const module={exports:{}};
vm.runInNewContext(fs.readFileSync(new URL('../jeux-cadeaux/core.js',import.meta.url),'utf8'),{module,URL,URLSearchParams});
const core=module.exports;

test('Coffre : chaque défi commencé compte ; la recharge conserve le quota commun',()=>{
 const saved=new Map(),storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
 const location={origin:'https://mathsgo.re',search:'?mode=cadeau&parties=2&ticket=galets&retour=%2Foutils%2F'};
 let gift=createGift(core,location,storage);assert.equal(gift.begin(),true);assert.equal(gift.remaining,1);
 gift=createGift(core,location,storage);assert.equal(gift.begin(),true);assert.equal(gift.begin(),false);assert.equal(gift.remaining,0);
 assert.equal(gift.back,'/outils/');assert.equal(saved.get('mathsgo:jeux-cadeaux:v2:galets'),'2');
 const free=createGift(core,{...location,search:''},storage);
 for(let i=0;i<20;i++)assert.equal(free.begin(),true);
});
test('Les anciens liens de galets rejoignent la rivière, sans perdre le coffre ni le mode intégré',()=>{
 const script=fs.readFileSync(new URL('../jeux-cadeaux/app.js',import.meta.url),'utf8');
 for(const query of['?jeu=galets&integre=1','?jeu=galets&mode=cadeau&parties=2&ticket=ancien&retour=%2Foutils%2F']){
  let destination='';
  const location={search:query,origin:'https://mathsgo.re',replace:url=>destination=url};
  vm.runInNewContext(script,{window:{ShortGames:core,parent:{}},document:{getElementById:()=>null},location,URL,URLSearchParams});
  const url=new URL(destination);assert.equal(url.pathname,'/jeux-cadeaux/galets-riviere/index.html');
  for(const [key,value] of new URLSearchParams(query))if(key!=='jeu')assert.equal(url.searchParams.get(key),value);
 }
});
test('Le cadre transmet sa hauteur au site et libère ses observateurs',()=>{
 const messages=[],listeners=new Map();let height=700,observed=0,disconnected=0;
 const win={parent:{postMessage:(data,origin)=>messages.push({data,origin})},location:{origin:'https://mathsgo.re'},
  addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const root={getBoundingClientRect:()=>({height})};
 class Observer{constructor(fn){this.fn=fn;}observe(node){assert.equal(node,root);observed++;}disconnect(){disconnected++;}}
 const cleanup=connectFrame(win,root,Observer);assert.equal(messages[0].data.height,705);assert.equal(messages[0].origin,win.location.origin);
 height=800;listeners.get('message')({source:{},origin:win.location.origin,data:{type:'mathsgo-short-game:fenetre'}});assert.equal(messages.length,1);
 listeners.get('resize')();assert.equal(messages[1].data.height,805);listeners.get('resize')();assert.equal(messages.length,2);
 cleanup();assert.equal(disconnected,1);assert.equal(observed,1);assert.equal(listeners.has('message'),false);
});
