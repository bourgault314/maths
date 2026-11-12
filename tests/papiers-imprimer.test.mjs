import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const base = new URL('outils/papiers-imprimer/', root);
const html = readFileSync(new URL('index.html', base), 'utf8');
const script = readFileSync(new URL('papiers.js', base), 'utf8');
const entities = s => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
const attrs = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,k,v]) => [k, entities(v)]));
const cards = [...html.matchAll(/<article\b[^>]*data-paper-card[^>]*>([\s\S]*?)<\/article>/g)].map(([,s]) => s);

test('les quinze modèles sont disponibles en PDF et les aperçus correspondent aux choix', () => {
  const pdfs = new Set([...cards.join('').matchAll(/(?:href|value)="(pdf\/[^"#]+\.pdf)"/g)].map(([,p]) => p));
  assert.equal(pdfs.size, 15);
  for (const path of pdfs) {
    const bytes = readFileSync(new URL(path, base));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', path);
    assert.ok(bytes.length > 1000, path);
  }
  for (const [,path] of html.matchAll(/(?:src|data-preview)="(apercus\/[^"#]+)"/g)) {
    assert.ok(existsSync(new URL(path, base)), path);
  }
  assert.match(html, /href="pdf\/banque-papiers-college\.pdf"/);
  assert.match(html, /href="pdf\/papiers-college-pdf-separes\.zip"/);
  assert.equal(readFileSync(new URL('pdf/papiers-college-pdf-separes.zip',base)).subarray(0,2).toString(), 'PK');
});

test('chaque variante synchronise les deux liens, le nom accessible et son aperçu, y compris après Retour', () => {
  const states = cards.map(source => {
    const options = [...source.matchAll(/<option\b([^>]*)>/g)].map(([,s]) => {
      const a = attrs(s);
      return {value:a.value, dataset:{preview:a['data-preview'],label:a['data-label'],description:a['data-description']}};
    });
    const events = {};
    const select = options.length ? {options,selectedIndex:0,addEventListener:(name,fn) => events[name]=fn} : null;
    const preview = {}, description = {}, settings = {hidden:true};
    const links = ['Télécharger','Ouvrir'].map(label => ({dataset:{paperLink:label},setAttribute(name,value){this[name]=value;}}));
    return {options,events,select,preview,description,settings,links,
      querySelector(selector){return {'select[data-paper-select]':select,'[data-paper-preview]':preview,'[data-paper-description]':description,'[data-paper-options]':settings}[selector];},
      querySelectorAll(){return links;}
    };
  });
  const onReturn=[];
  vm.runInNewContext(script,{document:{querySelectorAll:() => states},window:{addEventListener:(_,fn) => onReturn.push(fn)}});
  let checked=0;
  for (const state of states.filter(s => s.select)) {
    assert.equal(state.settings.hidden,false);
    for (const option of state.options) {
      state.select.selectedIndex=state.options.indexOf(option); state.events.change();
      assert.equal(state.preview.src,option.dataset.preview);
      assert.equal(state.preview.alt,option.dataset.label);
      assert.equal(state.description.textContent,option.dataset.description);
      for(const link of state.links){assert.equal(link.href,option.value);assert.ok(link['aria-label'].includes(option.dataset.label));}
      checked++;
    }
    state.select.selectedIndex=0;
  }
  onReturn.forEach(fn => fn());
  for(const state of states.filter(s => s.select)) assert.equal(state.links[0].href,state.options[0].value);
  assert.equal(checked,8);
});

test('sans JavaScript, tous les modèles ont un lien HTML ouvrable', () => {
  const allLinks=new Set([...html.matchAll(/href="(pdf\/[^"#]+\.pdf)"/g)].map(([,p]) => p));
  for(const [,path] of html.matchAll(/<option value="([^"]+)"/g)) assert.ok(allLinks.has(path),path);
});
