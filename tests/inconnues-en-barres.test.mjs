import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {FAMILLES,CONTEXTES,generer,depuisIdentifiant,methodes,parcours,evaluer,verifierEssai,enonce} from '../outils/inconnues-en-barres/moteur.mjs';
import {renduFrame,renduImpression,equationTexte} from '../outils/inconnues-en-barres/affichage.mjs';

test('Toutes les générations et transformations conservent les égalités, des solutions positives et le déterminisme',()=>{
  for(const famille of Object.keys(FAMILLES))for(const contexte of Object.keys(CONTEXTES))for(let niveau=0;niveau<3;niveau++)for(let seed=0;seed<350;seed++){
    const p=generer({famille,contexte,niveau,seed});assert.deepEqual(depuisIdentifiant(p.id),p);
    assert.ok(p.inconnues.every(s=>Number.isInteger(p.valeurs[s])&&p.valeurs[s]>0));
    assert.ok(verifierEssai(p,p.valeurs).every(c=>c.ok));
    if(p.inconnues.length===2){
      // Independence is checked on the original constraints, not on the solver's values.
      const coefficient=(e,s)=>e.gauche.filter(t=>t.symbol===s).reduce((v,t)=>v+t.n,0)-e.droite.filter(t=>t.symbol===s).reduce((v,t)=>v+t.n,0);
      const [e,f]=p.donnees;assert.notEqual(coefficient(e,'A')*coefficient(f,'B')-coefficient(e,'B')*coefficient(f,'A'),0);
    }
    for(const methode of methodes(p)){
      const frames=parcours(p,methode.id);assert.deepEqual([...new Set(frames.map(f=>f.phase))],[0,1,2,3,4]);
      assert.equal(frames[0].reponses.length,0);assert.ok(frames.at(-1).verification);
      for(const f of frames)for(const row of f.rows){assert.equal(evaluer(row.gauche,p),evaluer(row.droite,p),`${p.id} ${methode.id} ${f.titre}`);for(const t of [...row.gauche,...row.droite])assert.ok(t.symbol?Number.isInteger(t.n)&&t.n>0:Number.isFinite(t.value)&&t.value>0);}
    }
  }
});
test('La correction inverse utilise le nombre exact de grandes parts et revient à A ÷ k',()=>{
  let trois=false,quatre=false;
  for(let seed=0;seed<500;seed++){
    const p=generer({famille:'multiple',niveau:2,seed});if(!methodes(p).some(m=>m.id==='inverse'))continue;
    const frames=parcours(p,'inverse'),remplacement=frames.find(f=>f.titre==='Regrouper vers la grande quantité');
    assert.equal(remplacement.rows[0].gauche[0].n,p.m+p.n/p.k);
    assert.equal(frames.find(f=>f.titre==='Revenir à la petite quantité').calculs[0],`${p.valeurs.A} ÷ ${p.k} = ${p.valeurs.B}`);
    assert.equal(frames.find(f=>f.titre==='Repérer les groupes à remplacer').rows[1].gauche[1].etat,'remplacer');
    trois ||= p.m+p.n/p.k===3;quatre ||= p.m+p.n/p.k===4;
  }
  assert.ok(trois&&quatre);
});
test('Les cas de comparaison ne sont ni dégénérés ni des copies des niveaux voisins',()=>{
  for(let seed=0;seed<100;seed++){
    const a=generer({famille:'combinaison',niveau:0,seed}),b=generer({famille:'combinaison',niveau:1,seed}),c=generer({famille:'combinaison',niveau:2,seed});
    assert.equal(a.m,a.r);assert.equal(b.m,2*b.r);assert.notEqual(c.m%c.r,0);assert.notEqual(c.r%c.m,0);
    assert.equal(methodes(c).length,1);
  }
});
test('Tous les styles et les trois sorties papier sont des rendus du même exercice',()=>{
  for(const famille of Object.keys(FAMILLES))for(let niveau=0;niveau<3;niveau++)for(const contexte of Object.keys(CONTEXTES)){
    const p=generer({famille,niveau,contexte,seed:41});
    for(const methode of methodes(p))for(const style of ['barres','pictos','lettres','tout']){
      for(const f of parcours(p,methode.id)){
        const html=renduFrame(f,p,{style});assert.doesNotMatch(html,/NaN|undefined|Infinity|unused\.mjs/);
        if(f.verification){assert.equal((html.match(/class="valide"/g)||[]).length,p.donnees.length);if(style==='lettres'||style==='tout')assert.match(html,/class="definitions"/);}
      }
      for(const type of ['enonce','guidee','corrige']){
        const html=renduImpression(p,methode.id,type,style);assert.ok(html.includes(p.id));assert.doesNotMatch(html,/NaN|undefined|Infinity/);
        if(type!=='corrige'){assert.doesNotMatch(html,/class="resultats"|class="verifications"/);assert.match(html,/espace-recherche/);}
        if(type==='guidee')assert.match(html,/Schéma à compléter/);
      }
    }
    assert.doesNotMatch(enonce(p).lignes.join(' '),/ciseauxs|cube oranges/);
  }
});
test('Les entrées invalides sont rejetées, un essai doit satisfaire toutes les données',()=>{
  for(const id of ['','IB1-999-1','IB1-000-ZZZZZZZ','<img>','IB2-000-1'])assert.throws(()=>depuisIdentifiant(id));
  assert.throws(()=>generer({niveau:4}));assert.throws(()=>generer({seed:-1}));
  const p=generer({famille:'combinaison',seed:1});assert.equal(verifierEssai(p,{A:-1,B:2}),null);
  assert.ok(verifierEssai(p,{A:p.valeurs.A+1,B:p.valeurs.B}).some(c=>!c.ok));
  assert.throws(()=>parcours(p,'inverse'));
});
test('Les égalités affichées dans les calculs sont vraies, y compris en substitution de deux lots',()=>{
  for(const famille of Object.keys(FAMILLES))for(let niveau=0;niveau<3;niveau++)for(let seed=0;seed<80;seed++){
    const p=generer({famille,niveau,seed});
    for(const methode of methodes(p))for(const f of parcours(p,methode.id))for(const c of f.calculs){
      const [g,d]=c.replace(/\s/g,'').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/(\d)([ABC])/g,'$1*$2').split('=');
      assert.equal(vm.runInNewContext(g,p.valeurs),vm.runInNewContext(d,p.valeurs),`${p.id} : ${c}`);
    }
  }
});
test('La carte est réellement visible dans Schémas en barres, comme application autonome',()=>{
  const window={};vm.runInNewContext(readFileSync(new URL('../assets/js/catalogue-refonte-data.js',import.meta.url),'utf8'),{window});
  const catalogue=window.MATHSGO_CATALOGUE,source=readFileSync(new URL('../assets/js/catalogue-refonte.js',import.meta.url),'utf8');
  const noms=['resourceClassification','resourceBelongsToNotion','resourceCollections','resourceBelongsToCollapsedCollection','matchingResources'];
  const code=noms.map(n=>{const f=source.match(new RegExp('  function '+n+'\\([^]*?\\n  \\}'));assert.ok(f,n);return f[0];}).join('\n');
  const ctx={catalogue,resourceClassifications:catalogue.resourceClassifications,collectionMap:new Map(catalogue.collections.map(c=>[c.id,c])),published:catalogue.resources.filter(r=>r.status==='published'),state:{domain:'algebre',notion:'schemas-barres',collection:'',query:''}};
  vm.runInNewContext(code+'\nresultat=matchingResources();',ctx);
  assert.ok(ctx.resultat.some(r=>r.path==='outils/inconnues-en-barres/index.html'));
  assert.doesNotMatch(readFileSync(new URL('../outils/splat/index.html',import.meta.url),'utf8'),/href="\.\.\/inconnues-en-barres\/index\.html"/);
  assert.doesNotMatch(readFileSync(new URL('../outils/inconnues-en-barres/index.html',import.meta.url),'utf8'),/Poursuivre avec Splat/);
});
