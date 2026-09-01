import fs from 'node:fs';
import vm from 'node:vm';

// Les contrôles comparent des extraits contenant des sauts de ligne : on
// normalise en LF pour que le résultat soit identique sous Windows (CRLF)
// et sur les serveurs de vérification (LF).
const read=url=>fs.readFileSync(url,'utf8').replace(/\r\n/g,'\n');
const file='outils/plateaux_manipulation/moulin_pythagore.html';
const html=read(new URL(`../${file}`,import.meta.url));
const snapEngine=read(new URL('../assets/js/pythagore-snap-engine.js',import.meta.url));
const publicThumbnail=read(new URL('../assets/img/thumbnails/moulin-pythagore-capture.svg',import.meta.url));
const archivedSolution=read(new URL('../assets/img/thumbnails/moulin-pythagore-solution.svg',import.meta.url));
const fail=message=>{console.error(`ERREUR — ${message}`);process.exitCode=1;};
const near=(a,b,tolerance=1e-7)=>Math.abs(a-b)<=tolerance;
const area=points=>Math.abs(points.reduce((sum,p,index)=>{const q=points[(index+1)%points.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2);
const signature=points=>{
  const distances=[];
  for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) distances.push(Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1]));
  return distances.sort((a,b)=>a-b);
};
const congruent=(a,b)=>a.length===b.length&&signature(a).every((value,index)=>near(value,signature(b)[index],2e-7));
const signed=points=>points.reduce((sum,p,index)=>{const q=points[(index+1)%points.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2;
const lineIntersection=(p,q,a,b)=>{const rx=q[0]-p[0],ry=q[1]-p[1],sx=b[0]-a[0],sy=b[1]-a[1],d=rx*sy-ry*sx;if(Math.abs(d)<1e-12)return null;const t=((a[0]-p[0])*sy-(a[1]-p[1])*sx)/d;return[p[0]+t*rx,p[1]+t*ry];};
function clip(subject,mask){let output=subject.map(point=>[...point]);const orientation=Math.sign(signed(mask))||1;for(let i=0;i<mask.length;i++){const a=mask[i],b=mask[(i+1)%mask.length],inside=p=>orientation*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))>=-1e-9,input=output;output=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],pin=inside(p),qin=inside(q);if(pin&&qin)output.push(q);else if(pin&&!qin){const hit=lineIntersection(p,q,a,b);if(hit)output.push(hit);}else if(!pin&&qin){const hit=lineIntersection(p,q,a,b);if(hit)output.push(hit);output.push(q);}}}return output;}

const inlineScript=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
try{new vm.Script(inlineScript||'');}catch(error){fail(`Le JavaScript du Moulin est invalide : ${error.message}`);}
try{new vm.Script(snapEngine);}catch(error){fail(`Le moteur de snap du Moulin est invalide : ${error.message}`);}

const match=html.match(/const EXACT_SOLUTION_UV = (\{[\s\S]*?\n  \});/);
if(!match) fail('Les poses exactes des puzzles sont absentes.');
const layouts=match?vm.runInNewContext(`(${match[1]})`,Object.create(null)):{};

const sqrt5=Math.sqrt(5);
const sqrt2=Math.sqrt(2);
const P=[1.2,-1.6];
const sources={
  perigal:{y:[[0,-2],[1,-2],P,[0,-1]],b:[[1,-2],[2,-2],P],g:[[2,0],[2,-2],P],m:[[0,0],[2,0],P,[0,-1]],sq:[[-1,0],[0,0],[0,1],[-1,1]]},
  lapeyronnie:{
    t1:[[3,4],[3,2],[2,4]],t2:[[1,4],[2,4],[1,3.5]],q1:[[1,2],[3,2],[2,4],[1,3.5]],
    t3:[[1,2],[1,1],[0.5,2]],q2:[[0,2],[0,1],[1,1],[0.5,2]]
  },
  sixEquilibre:{
    bL:[[0,0],[1,0],[1,1]],bS1:[[0,0],[0.5,0.5],[0,1]],bS2:[[0.5,0.5],[1,1],[0,1]],
    aL:[[0,0],[1,0],[1,1]],aS1:[[0,0],[0.5,0.5],[0,1]],aS2:[[0.5,0.5],[1,1],[0,1]]
  },
  tangram:{
    large1:[[0,0],[1,0],[1,1]],large2:[[0,0],[1,1],[0,1]],
    medium:[[0,0],[1,0],[0.5,0.5]],square:[[0,0.5],[0.5,0.5],[0.5,1],[0,1]],
    small1:[[0,0],[0.5,0.5],[0,0.5]],small2:[[0.5,1],[1,0.5],[1,1]],
    parallel:[[0.5,0.5],[1,0],[1,0.5],[0.5,1]]
  },
  mosaiqueOblique:{
    b1:[[0,-2],[0.625,-2],[0.4,-1.55],[0,-1.75]],b2:[[0.4,-1.55],[0,-0.75],[0,-1.75]],
    b3:[[0.625,-2],[2,-2],[2,-0.75],[0.4,-1.55]],b4:[[0,-0.75],[0.4,-1.55],[2,-0.75],[2,0],[0,0]],
    a1:[[-1,1],[-1,0],[0,0],[0,0.25],[-0.375,1]],a2:[[0,0.25],[0,1],[-0.375,1]]
  },
  moulinIsocele:{
    b1:[[0,0],[1,0],[1,1]],b2:[[0,0],[1,1],[0,1]],
    a1:[[0,0],[1,0],[1,1]],a2:[[0,0],[1,1],[0,1]]
  },
  mosaiqueSept:{
    bTop:[[0,-4/3],[4/3,-4/3],[0,-1/3]],bLeft:[[4/3,-4/3],[4/3,-1/3],[0,-1/3]],
    bTrap:[[0,-1/3],[1,-1/3],[3/4,0],[0,0]],bSquare:[[1,-1/3],[4/3,-1/3],[4/3,0],[1,0]],
    bSmall:[[3/4,0],[1,-1/3],[1,0]],aTrap:[[-1,0],[0,0],[-3/4,1],[-1,1]],aTri:[[0,0],[0,1],[-3/4,1]]
  },
  liuHuiSept:{
    bLargeTop:[[0,0],[5/3,0],[0,1]],bLargeRight:[[5/3,0],[5/3,5/3],[2/3,5/3]],
    bWedgeTop:[[5/3,0],[0,1],[2/3,1]],bWedgeRight:[[5/3,0],[2/3,1],[2/3,5/3]],
    bSquare:[[0,1],[2/3,1],[2/3,5/3],[0,5/3]],
    aTriangleTop:[[0,0],[1,0],[1,1]],aTriangleBottom:[[0,0],[1,1],[0,1]]
  },
  leitzmann:{
    bTop:[[0,-2],[2,-2],[4/3,-4/3]],bLeft:[[0,-2],[0,0],[4/3,-4/3]],bBottom:[[0,0],[2,0],[4/3,-4/3]],bRight:[[2,0],[2,-2],[4/3,-4/3]],
    aTop:[[-1,0],[0,0],[-1/3,1/3]],aLeft:[[-1,0],[-1,1],[-1/3,1/3]],aBottom:[[-1,1],[0,1],[-1/3,1/3]],aRight:[[0,1],[0,0],[-1/3,1/3]]
  },
  quatreIdentiques:{
    q1:[[0,-2],[0.5,-2],[1,-1],[0,-0.5]],q2:[[2,-2],[2,-1.5],[1,-1],[0.5,-2]],q3:[[2,0],[1.5,0],[1,-1],[2,-1.5]],q4:[[0,0],[0,-0.5],[1,-1],[1.5,0]],aSq:[[-1,0],[0,0],[0,1],[-1,1]]
  },
  pavageOblique:{
    b1:[[0.2500000000,-0.3611111110],[0.0000000000,-0.6944444443],[0.0000000000,-1.3333333333],[1.3333333333,-1.3333333333],[1.3333333333,-1.1736111110]],
    b2:[[0.2500000000,-0.3611111110],[1.3333333333,-1.1736111110],[1.3333333333,-0.0000000000],[0.5208333333,-0.0000000000]],
    b3:[[0.2500000000,-0.3611111110],[0.0000000000,-0.1736111110],[0.0000000000,-0.6944444443]],
    b4:[[0.2500000000,-0.3611111110],[0.5208333333,-0.0000000000],[0.0000000000,-0.0000000000],[0.0000000000,-0.1736111110]],
    a1:[[-0.4791666667,0.0000000000],[0.0000000000,0.0000000000],[0.0000000000,0.6388888890]],
    a2:[[0.0000000000,0.6388888890],[0.0000000000,1.0000000000],[-1.0000000000,1.0000000000],[-1.0000000000,0.0000000000],[-0.4791666667,0.0000000000]]
  },
  quadrillageQuatre:{
    a1:[[-1.0000000000,1.0000000000],[0.0000000000,1.0000000000],[0.0000000000,0.0000000000],[-1.0000000000,0.0000000000]],
    b1:[[1.0000000000,-1.0000000000],[1.0000000000,-0.3333333333],[0.0000000000,-0.3333333333],[0.0000000000,0.0000000000],[1.3333333333,0.0000000000],[1.3333333333,-1.0000000000]],
    b2:[[0.0000000000,-0.6666666667],[0.3333333333,-0.6666666667],[0.3333333333,-1.0000000000],[1.3333333333,-1.0000000000],[1.3333333333,-1.3333333333],[0.0000000000,-1.3333333333]],
    b3:[[0.3333333333,-0.6666666667],[0.0000000000,-0.6666666667],[0.0000000000,-0.3333333333],[1.0000000000,-0.3333333333],[1.0000000000,-1.0000000000],[0.3333333333,-1.0000000000]]
  },
  quadrillageCinq:{
    a1:[[-1.0000000000,0.0000000000],[-1.0000000000,0.3333333333],[0.0000000000,0.3333333333],[0.0000000000,0.0000000000]],
    a2:[[-1.0000000000,1.0000000000],[0.0000000000,1.0000000000],[0.0000000000,0.3333333333],[-1.0000000000,0.3333333333]],
    b1:[[0.0000000000,-0.6666666667],[0.3333333333,-0.6666666667],[0.3333333333,-1.0000000000],[1.0000000000,-1.0000000000],[1.0000000000,-1.3333333333],[0.0000000000,-1.3333333333]],
    b2:[[1.0000000000,-1.0000000000],[0.3333333333,-1.0000000000],[0.3333333333,-0.6666666667],[0.6666666667,-0.6666666667],[0.6666666667,-0.3333333333],[1.0000000000,-0.3333333333],[1.0000000000,-0.6666666667],[1.3333333333,-0.6666666667],[1.3333333333,-1.3333333333],[1.0000000000,-1.3333333333]],
    b3:[[0.0000000000,0.0000000000],[1.3333333333,0.0000000000],[1.3333333333,-0.6666666667],[1.0000000000,-0.6666666667],[1.0000000000,-0.3333333333],[0.6666666667,-0.3333333333],[0.6666666667,-0.6666666667],[0.0000000000,-0.6666666667]]
  }
};

const expectedKeys={
  perigal:['b','g','m','sq','y'],
  lapeyronnie:['q1','q2','t1','t2','t3'],
  sixEquilibre:['aL','aS1','aS2','bL','bS1','bS2'],
  tangram:['large1','large2','medium','parallel','small1','small2','square'],
  mosaiqueOblique:['a1','a2','b1','b2','b3','b4'],
  moulinIsocele:['a1','a2','b1','b2'],
  mosaiqueSept:['aTrap','aTri','bLeft','bSmall','bSquare','bTop','bTrap'],
  liuHuiSept:['aTriangleBottom','aTriangleTop','bLargeRight','bLargeTop','bSquare','bWedgeRight','bWedgeTop'],
  pavageOblique:['a1','a2','b1','b2','b3','b4'],
  quadrillageQuatre:['a1','b1','b2','b3'],
  quadrillageCinq:['a1','a2','b1','b2','b3'],
  leitzmann:['aBottom','aLeft','aRight','aTop','bBottom','bLeft','bRight','bTop'],
  quatreIdentiques:['aSq','q1','q2','q3','q4']
};
const geometry={
  perigal:{side:sqrt5,area:5},lapeyronnie:{side:sqrt5,area:5},mosaiqueOblique:{side:sqrt5,area:5},leitzmann:{side:sqrt5,area:5},quatreIdentiques:{side:sqrt5,area:5},
  sixEquilibre:{side:sqrt2,area:2},tangram:{side:sqrt2,area:2},moulinIsocele:{side:sqrt2,area:2},mosaiqueSept:{side:5/3,area:25/9},
  liuHuiSept:{side:Math.sqrt(34)/3,area:34/9},
  pavageOblique:{side:5/3,area:25/9},
  quadrillageQuatre:{side:5/3,area:25/9},
  quadrillageCinq:{side:5/3,area:25/9}
};

for(const [puzzle,keys] of Object.entries(expectedKeys)){
  const layout=layouts[puzzle];
  if(!layout){fail(`La solution ${puzzle} est absente.`);continue;}
  const {side,targetArea}= {side:geometry[puzzle].side,targetArea:geometry[puzzle].area};
  if(JSON.stringify(Object.keys(layout).sort())!==JSON.stringify(keys)) fail(`Les pièces de la solution ${puzzle} ne correspondent pas au puzzle.`);
  const polygons=Object.entries(layout);
  const total=polygons.reduce((sum,[key,points])=>{
    if(points.some(([u,v])=>u<-1e-8||v<-1e-8||u>side+1e-8||v>side+1e-8)) fail(`La pièce ${puzzle}/${key} dépasse de c².`);
    if(!congruent(points,sources[puzzle][key])) fail(`La pièce ${puzzle}/${key} n’est pas congruente à sa découpe source.`);
    return sum+area(points);
  },0);
  if(!near(total,targetArea,2e-7)) fail(`L’aire totale de ${puzzle} vaut ${total} au lieu de ${targetArea}.`);
  for(let i=0;i<polygons.length;i++) for(let j=i+1;j<polygons.length;j++) if(area(clip(polygons[i][1],polygons[j][1]))>2e-7) fail(`Chevauchement dans ${puzzle} entre ${polygons[i][0]} et ${polygons[j][0]}.`);
}

if(!html.includes('[left].forEach(m => {')) fail('Le plateau interactif doit afficher un seul moulin sur tous les écrans.');
if(!html.includes('const interactiveTarget = left;')) fail('Le snap doit viser l’unique moulin visible.');
if(!html.includes('leftX+(b+2*a)+BASE.gap,')) fail('Les deux moulins imprimés doivent rester côte à côte, même depuis un téléphone.');
if(!html.includes('${drawMoulinStatic(L, true)}\n  ${drawMoulinStatic(R, true)}')) fail('Les deux moulins imprimés doivent être identiques et remplis.');
if(html.includes('id="showSolution"')) fail('La solution ne doit pas être accessible depuis l’interface élève.');
if(!html.includes('<option value="perigal" selected>')) fail('Périgal doit être le puzzle ouvert par défaut.');
if(!html.includes('<option value="lapeyronnie">5. Lapeyronnie (5 pièces)</option>') || html.includes('IREM — 5 pièces')) fail('Le puzzle de Lapeyronnie doit porter un nom explicite.');
if(!html.includes('<option value="sixEquilibre">') || !html.includes('<option value="tangram">') || !html.includes('<option value="mosaiqueOblique">') || !html.includes('<option value="moulinIsocele">') || !html.includes('<option value="mosaiqueSept">10. Puzzle de Brest (7 pièces)</option>') || !html.includes('<option value="liuHuiSept">11. Liu Hui — 2 + 5 (7 pièces)</option>')) fail('Les découpages ajoutés et restaurés doivent tous être proposés.');
if(!html.includes('ratio: 3/5,') || !html.includes('Le petit carré bleu a pour côté la différence <em>b − a</em>.')) fail('La construction 3:5 de Liu Hui et son repère pédagogique doivent rester explicites.');
if(!html.includes('href="../index.html?domain=geometrie&amp;notion=pythagore"') || !html.includes('Retour au menu Pythagore')) fail('La flèche du Moulin doit revenir au menu Pythagore.');
if(!html.includes('<button id="enonce">Fiche</button>') || !html.includes('class="screenActions"><button type="button" onclick="window.print()">Imprimer</button>')) fail('La fiche doit être consultable avant impression.');
// Signature maths&go de la fiche imprimée : logo, licence, et QR vers le puzzle.
if(!html.includes('assetURL("img/mathsgo-logo-print.png")') || !html.includes('class="sheetLogo"')) fail('Chaque page de la fiche doit porter le logo maths&go.');
if(!html.includes('mathsgo.re · CC BY-NC-SA 4.0')) fail('Chaque page de la fiche doit porter la signature « mathsgo.re · CC BY-NC-SA 4.0 ».');
if(!html.includes('const SITE_ORIGIN = "https://mathsgo.re";') || !html.includes('function sheetPuzzleURL()') || !html.includes('puzzle: state.puzzle, mode: "eleves"')) fail('Le QR de la fiche doit renvoyer vers le puzzle exact qui est imprimé.');
if(!fs.existsSync(new URL('../auto/scripts/vendor/qrcode-generator.js',import.meta.url))) fail('Le générateur de QR partagé du dépôt est introuvable : la fiche du Moulin s’appuie dessus.');
if(!html.includes('tag.onerror = () => resolve(false);')) fail('La fiche doit sortir même si le générateur de QR ne se charge pas.');
if(html.includes('<body onload="window.print()">')) fail('La fiche ne doit pas déclencher l’impression avant son aperçu.');
if(!html.includes('2.8+Math.random()*1.1') || !html.includes('setTimeout(()=>clearCelebration(false),4400)')) fail('Les confettis doivent tomber plus lentement.');
if(!html.includes('const r=PUZZLES[state.puzzle]?.ratio ?? BASE.ratio;')) fail('Chaque puzzle doit pouvoir choisir son propre triangle rectangle.');
if(publicThumbnail.includes('102,160 143.6,139.2 143.6,243.2')) fail('La vignette publique ne doit pas montrer le carré final résolu.');
if(!archivedSolution.includes('102,160 143.6,139.2 143.6,243.2')) fail('L’illustration historique de la solution Périgal doit être conservée.');
if(!html.includes('function activePuzzleMoulin()')) fail('La validation doit suivre le moulin actif.');
if(!html.includes('prepareSolutionPoses();')) fail('Les poses de solution doivent être préparées à chaque construction.');
if(!html.includes('function tryExactSolutionSnap(piece)')) fail('Le snap de finition exact doit être disponible pour tous les puzzles.');
if(!html.includes('pose.flipX !== piece.flipX')) fail('Le snap ne doit jamais retourner automatiquement une pièce.');
if(html.includes('bhaskaraPoseTargets')) fail('Le snap Bhaskara ne doit plus dépendre d’une table de poses vide.');
if(!html.includes('touchFriendlyDistance(SNAP.posStrong,30)')) fail('Le snap tactile doit conserver une distance physique suffisante sur téléphone.');
if(!html.includes('captureEl.setPointerCapture(evt.pointerId)')) fail('Le glissement tactile doit rester capturé jusqu’au lâcher.');
if(!html.includes('stage.addEventListener("pointercancel", finishPointerInteraction)')) fail('Une interruption tactile doit terminer proprement le déplacement.');
if(html.includes('id="rotateMobileLeft"') || html.includes('id="rotateMobileRight"')) fail('La rotation mobile ne doit pas dépendre de boutons par pas fixes.');
if(!html.includes('class:"handleHit"') || html.includes('svg#stage .handle{display:none!important;}')) fail('La poignée de rotation libre doit rester utilisable au doigt sur téléphone.');
if(!html.includes('drag.startGestureAngle') || !html.includes('drag.type="transform"')) fail('Le geste tactile à deux doigts doit déplacer et tourner librement une pièce.');
if(!html.includes('src="../../assets/js/pythagore-snap-engine.js"') || !html.includes('SnapEngine.findBestSnap({')) fail('Le Moulin doit utiliser son moteur géométrique unique sur téléphone.');
if(!snapEngine.includes('function findBestSnap(options)') || !snapEngine.includes('"edge-endpoint"')) fail('Le moteur doit calculer ensemble rotation et translation pour les coins et les arêtes.');
if(!snapEngine.includes('polygonInsideTarget(vertices,targetPolygon,containmentTolerance)')) fail('Le moteur doit refuser une pose qui dépasse de c².');
if(!snapEngine.includes('polygonsOverlapInterior(vertices,item.vertices,tolerance)')) fail('Le moteur doit refuser les chevauchements entre pièces.');
if(!html.includes('if(other.placed) placedPolygons.push')) fail('Seules les pièces déjà validées dans c² doivent servir de cibles.');
if(!html.includes('const proposed=drag.startRot+deg(angle-drag.startGestureAngle);') || !html.includes(': proposed;')) fail('La rotation tactile doit rester libre pendant le geste.');
if(!html.includes('screenPixelsToWorld(25)')) fail('La poignée mobile doit conserver une zone tactile physique suffisante.');
if(!html.includes('grid-template-columns:repeat(2,minmax(0,1fr))')) fail('Les commandes mobiles doivent rester contenues dans la largeur du téléphone.');
if(!html.includes('<option value="pavageOblique">') || !html.includes('<option value="quadrillageQuatre">') || !html.includes('<option value="quadrillageCinq">')) fail('Les trois découpages ajoutés doivent être proposés dans le menu.');
if(!html.includes('PUZZLES[state.puzzle]?.snapExtra?.(a, b, c)')) fail('Les découpages sur quadrillage doivent pouvoir ajouter leurs propres repères d’aimantation.');
if(!html.includes('function queueCompletionCheck()') || !html.includes('className="confettiPiece"') || !html.includes('className="celebrationSubtitle"')) fail('La réussite automatique et la célébration soignée doivent rester actives.');

const pythaFile='outils/pythabarre.html';
const pytha=read(new URL(`../${pythaFile}`,import.meta.url));
const pythaScript=pytha.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
try{new vm.Script(pythaScript||'');}catch(error){fail(`Le JavaScript de PythaBarre est invalide : ${error.message}`);}
if(!pytha.includes('.stage:not(:fullscreen) #btnFullscreen{display:none;}')) fail('Le plein écran de PythaBarre doit être masqué sur téléphone.');
if(!pytha.includes('.stage:not(:fullscreen) #btnToggleEq,\n    .stage:not(:fullscreen) #btnStageRandom{display:none;}')) fail('PythaBarre doit garder une barre supérieure minimale sur téléphone.');
if(!pytha.includes('.stage:not(:fullscreen) .barBoard{\n      order:4;') || !pytha.includes('.stage:not(:fullscreen) .equationHistory{\n      order:5;')) fail('L’équation mobile doit rester sous le tableau.');
if(!pytha.includes('selectedSlot = null;\n        message = "";')) fail('Chaque placement dans la relation doit désélectionner la case.');
if(!pytha.includes('window.MathsGoPythaBarre = {')) fail('Le contrat d’intégration de PythaBarre doit rester disponible.');
if(!pytha.includes('.stage:not(.notStarted):not(:fullscreen) .instructionZone:empty,') || !pytha.includes('height:72px;\n      min-height:72px;\n      max-height:72px;')) fail('La consigne ordinateur doit conserver une hauteur fixe jusqu’à la fin.');
if(!pytha.includes('class="menuPageHome" href="index.html"') || !pytha.includes('Retour au catalogue des outils')) fail('Le menu PythaBarre doit proposer un retour explicite au catalogue Outils.');
if(!pytha.includes('class="toolBtn commandToolBtn undoToolBtn"') || !pytha.includes('class="toolBtn commandToolBtn restartToolBtn"')) fail('Annuler et Recommencer doivent utiliser les commandes modernes communes.');

if(!process.exitCode) console.log('OK — 14 puzzles, 13 pavages tabulés, snaps exacts, célébration et règles mobiles contrôlés.');
