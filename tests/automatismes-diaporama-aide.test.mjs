// Diaporama « Avec aide » (décision de Gwenaël, 17/10/2026) : il n'y a pas de
// bouton Aide au diaporama, donc le dessin d'aide est projeté sous la
// question, comme dans la version d'origine. À l'étape 1, les dessins avaient
// quitté l'énoncé pour le panneau Aide de la série et disparu du diaporama.
// Ce test garde les deux bouts du branchement : la fenêtre du diaporama
// transmet son mode, et la préparation des diapositives s'en sert.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync('auto/scripts/03-slideshow.js','utf8');

test('la fenêtre transmet le mode diaporama à la préparation des diapositives',()=>{
  assert.match(source,/slidesDataForQuiz\(seriesQuiz,mode,\{[^}]*experienceMode\}\)/);
});

test('au diaporama « Avec aide », le dessin d’aide est sous la question',()=>{
  assert.match(source,/context\.experienceMode==='presentation'&&mode==='with'/);
  assert.match(source,/else if\(visualPolicy==='optional'\|\|visualPolicy==='aid-only'\) renderMode='with';/);
  assert.match(source,/const questionHtml=lotTTypo\(buildCleanSlideHtml\(inst,false,renderMode\)\)\+dessinDiapo;/);
  assert.match(source,/const correctionHtml=lotTTypo\(buildCleanSlideHtml\(inst,true,renderMode\)\)\+dessinDiapo;/);
});

test('dnb_15, 26 et 28 n’avaient pas de dessin d’aide au diaporama',()=>{
  assert.match(source,/DIAPO_SANS_DESSIN_AIDE=new Set\(\['dnb_15','dnb_26','dnb_28'\]\)/);
});
