// dnb_01, droite graduée de bandes (décisions de Gwenaël, 17/10/2026) :
// - les couleurs de son univers : demi jaune, tiers lavande, quart vert (ses bandes de
//   fractions), dixième orange (le 10 % de ses pourcentages), contour noir ;
// - une seule bande donnée (0,25 ; 0,5 ; 0,1) : son étiquette serait la réponse. On dessine
//   l'unité entière au trait épais, partagée en cases, une seule case coloriée, sans étiquette ;
// - 0,25 et 0,75 ne sortent plus en types 16 et 17, ni 0,5 en types 15 et 16 : ils viennent
//   avec la droite des quarts ou des demis (le même dessin pour le même nombre) ;
// - 0,01 : l'aide ne dit plus « Un centième s'écrit 1/100 » ;
// - types 9, 10, 11 : 5/2 et 7/4 sur la droite, comme au type 1 ;
// - les grilles (type 13) aux couleurs des bandes : quart vert, huitième rose, douzième bleu clair.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const g={MATHSGO_VISUALS:{register(){}}};
new Function('globalThis',fs.readFileSync('auto/scripts/shared/visuals/arithmetic/fraction-decimal-grid.js','utf8'))(g);
const droite=data=>g.fractionDecimalGrid({kind:'rail',...data});
const compte=(texte,motif)=>(texte.match(motif)||[]).length;

test('les bandes prennent les couleurs de l’univers de Gwenaël',()=>{
  assert.equal(compte(droite({num:5,den:2,dec:'2,5'}),/fill="#facc15"/g),5);
  assert.equal(compte(droite({num:6,den:3,dec:'2'}),/fill="#e9d5ff"/g),6);
  assert.equal(compte(droite({num:3,den:4,dec:'0,75'}),/fill="#84cc16"/g),3);
  assert.equal(compte(droite({num:7,den:10,dec:'0,7'}),/fill="#fab464"/g),7);
  assert.doesNotMatch(droite({num:3,den:4,dec:'0,75'}),/#b98ae8/);
});

test('les grilles (type 13 : simplifier) prennent aussi les couleurs des bandes',()=>{
  const grille=(num,den)=>g.fractionDecimalGrid({num,den,reduced:{num,den},visualKind:'bar'});
  assert.match(grille(2,4),/fill="#84cc16"/);
  assert.match(grille(4,8),/fill="#f472b6"/);
  assert.match(grille(9,12),/fill="#7dd3fc"/);
  assert.match(grille(3,6),/fill="#f97316"/);
  for(const [n,d] of [[2,4],[4,8],[9,12],[3,6]]) assert.doesNotMatch(grille(n,d),/#b98ae8|#6eafea/);
});

test('une seule bande donnée : l’unité partagée, une case coloriée, aucune étiquette',()=>{
  for(const [den,dec] of [[2,'0,5'],[4,'0,25'],[10,'0,1']]){
    const svg=droite({num:1,den,dec,donne:true});
    assert.equal(compte(svg,/fill="#ffffff"/g),den-1,dec);
    assert.match(svg,/fill="none" stroke="#111827" stroke-width="3.2"/,dec);
    assert.doesNotMatch(svg,new RegExp('>'+den+'</text>'),dec);
  }
  // Plusieurs bandes : chaque bande garde son « 1/4 », on compte les quarts.
  const svg=droite({num:3,den:4,dec:'0,75',donne:true});
  assert.equal(compte(svg,/>4<\/text>/g),3);
  assert.doesNotMatch(svg,/stroke-width="3.2"/);
});

test('le texte lu à l’écran nomme les bandes et s’accorde',()=>{
  assert.match(droite({num:7,den:10,dec:'0,7'}),/aria-label="7 bandes d’un dixième posées bout à bout/);
  assert.match(droite({num:1,den:4,dec:'0,25',donne:true}),/aria-label="1 bande posée bout à bout sur une droite graduée, l’unité est partagée en bandes égales : elle arrive à 0,25\."/);
});

test('dnb_01 : aide d’une seule bande, et plus de 0,25 ni 0,75 en types 16 et 17',()=>{
  const moteur=fs.readFileSync('auto/scripts/02-question-engine.js','utf8');
  assert.match(moteur,/if\(num===1\) return \['En combien de bandes égales l’unité est-elle partagée \?'/);
  assert.match(moteur,/aide=module01RailAideD2F\(reduced\.den,dec,reduced\.num\);/);
  assert.match(moteur,/aide=module01RailAideD2F\(10,dec,lecture\.num\);/);
  assert.equal(compte(moteur,/while\(num%10===0\|\|num===25\|\|num===75\)/g),2);
  // 0,5 vient toujours avec la droite des demis : plus de 0,5 en types 15 et 16.
  assert.match(moteur,/kind==='tenths_d2f'\)\{\n[^\n]*\n    num=RD\(1,9,\[5\]\); den=10;/);
  assert.match(moteur,/if\(r<1\/3\)\{ num=RD\(1,9,\[5\]\); den=10; \}/);
  // Types 9, 10 et 11 (5/2, 7/4…) : la même droite que 5/2 = ? au type 1 ; 2,7 garde les unités découpées.
  assert.match(moteur,/num=e\.n; den=e\.d; visualKind='rail';/);
  assert.match(moteur,/visualKind=den===10\?'bar':'rail';/);
  // 0,01 : l'aide ne donne plus « Un centième s'écrit 1/100 ».
  assert.match(moteur,/if\(parts\.num===1\) return \[where,'Combien de cases a la grille \? Combien sont coloriées \?'\];/);
});
