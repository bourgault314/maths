import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(repoRoot, 'outils/angles/bandes_magnetiques.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('les scripts intégrés restent syntaxiquement valides', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  assert.ok(scripts.length > 0);
  scripts.forEach((source, index) => new vm.Script(source, {filename:`bandes-magnetiques-inline-${index}.js`}));
});

test('la barre ne contient plus les commandes de zoom en double', () => {
  assert.equal((html.match(/startZoom\(-0\.04\)/g) || []).length, 2, 'souris et toucher doivent partager l’unique bouton −');
  assert.equal((html.match(/startZoom\(0\.04\)/g) || []).length, 2, 'souris et toucher doivent partager l’unique bouton +');
  assert.doesNotMatch(html, /title="Zoom Arrière"|title="Zoom Avant"|class="header-title/);
  assert.match(html, /class="sidebar-logo"/);
  assert.doesNotMatch(html, /class="brand-logo"/);
});

test('les outils fréquents et les commandes de fin restent dans le bon ordre', () => {
  const ids = [
    'tool-hand',
    'btn-create-angle',
    'btn-create-segment',
    'btn-trace-point',
    'btn-fix-strip',
    'btn-global-lock',
    'btn-delete-object',
    'btn-setsquare',
    'btn-protractor',
    'btn-help',
    'btn-fullscreen',
  ];
  const positions = ids.map(id => html.indexOf(`id="${id}"`));
  positions.forEach((position, index) => assert.ok(position >= 0, `${ids[index]} doit exister`));
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok(positions[index - 1] < positions[index], `${ids[index - 1]} doit précéder ${ids[index]}`);
  }
});

test('Fixer conserve son effet sans marque permanente', () => {
  assert.match(html, /fixedFlashStripId:\s*null/);
  assert.match(html, /if \(state\.fixedFlashStripId === strip\.id\) \{\s*ctxStrips\.save\(\)/);
  assert.doesNotMatch(html, /if \(strip\.fixed\) \{\s*ctxStrips\.save\(\)/);
  assert.match(html, /setTimeout\(\(\) => \{\s*if \(state\.fixedFlashStripId === strip\.id\)/);
});

test('plusieurs points peuvent laisser une trace simultanément', () => {
  assert.match(html, /tracedPointIds:\s*new Set\(\)/);
  assert.match(html, /activePointTraceStrokes:\s*new Map\(\)/);
  assert.match(html, /for \(const pointId of state\.tracedPointIds\)/);
  assert.match(html, /for \(const \[pointId, stroke\] of state\.activePointTraceStrokes\)/);
  assert.match(html, /state\.tracedPointIds\.has\(p\.id\)/);
  assert.match(html, /Trace : cliquez sur un point pour l’activer ou le désactiver/);
});

test('un point tracé devient vert sans grand halo', () => {
  assert.match(html, /const pointIsTraced = state\.tracedPointIds\.has\(p\.id\)/);
  assert.match(html, /fillStyle = pointIsTraced \? '#0d9488'/);
  assert.match(html, /strokeStyle = pointIsTraced \? '#0f766e'/);
  assert.doesNotMatch(html, /const traceRing =|arc\(p\.x, p\.y, traceRing/);
});

test('deux segments de même longueur gardent la même couleur', () => {
  assert.match(html, /customStripTypeByLength:\s*new Map\(\)/);
  assert.match(html, /function getCustomStripTypeForLength\(length\)/);
  assert.match(html, /state\.customStripTypeByLength\.get\(lengthKey\)/);
  assert.match(html, /state\.customStripTypeByLength\.set\(lengthKey, type\)/);
  assert.match(html, /const type = getCustomStripTypeForLength\(lengthCm\)/);
  assert.match(html, /state\.customStripTypeByLength\.clear\(\)/);
  assert.doesNotMatch(html, /nextCustomStripColor/);
});

test('le stylo d’annotation est légèrement affiné sans toucher à la trace automatique', () => {
  assert.match(html, /const stroke = \{ color: strokeStyle, width: 2\.5/);
  assert.equal((html.match(/ctxDraw\.lineWidth = 2\.5/g) || []).length, 2);
  assert.match(html, /automaticTrace: true[\s\S]*width: 2\.5|width: 2\.5[\s\S]*automaticTrace: true/);
});

test('la suppression fonctionne par bouton ou par glisser vers le haut', () => {
  assert.match(html, /id="btn-delete-object"[^>]+onclick="toggleDeleteSelectionMode\(\)"/);
  assert.match(html, /if \(state\.deleteSelectionMode\) \{[\s\S]*removeConnectedGroup\(stripToDelete\)/);
  assert.match(html, /clientPos\.y <= headerRect\.bottom/);
  assert.match(html, /Relâcher pour jeter/);
  assert.match(html, /e\.key === 'Escape'[\s\S]*state\.deleteSelectionMode = false/);
});

test('les instruments et les créations utilisent la zone visible après zoom', () => {
  assert.match(html, /function centerGeoToolInViewport\(key\)/);
  assert.match(html, /function ensureGeoToolVisible\(key, forceCenter = false\)/);
  assert.match(html, /tool\.x \+= dx \/ state\.zoom/);
  assert.match(html, /const cx = \(rect\.width \/ 2 - state\.pan\.x\) \/ state\.zoom/);
  assert.match(html, /const cy = \(rect\.height \/ 2 - state\.pan\.y\) \/ state\.zoom/);
  assert.match(html, /tool\.scale = key === 'protractor' \? 1\.5 : 1/);
});

test('le zoom supplémentaire et la barre unique restent bornés', () => {
  assert.match(html, /VIEW_MARGIN_PX = \{ x: 1500, y: 1100 \}/);
  assert.match(html, /Math\.max\(0\.5, Math\.min\(3\.5, z\)\)/);
  assert.match(html, /\.header-main \{[\s\S]*overflow-x: auto/);
  assert.match(html, /#main-header \.header-tools \{\s*flex-wrap: nowrap/);
  assert.doesNotMatch(html, /\.header-main \{[^}]*grid-column/);
  assert.doesNotMatch(html, /#main-header \.header-tools \{[^}]*display: grid/);
  assert.match(html, /@media \(max-width: 560px\)[\s\S]*aside \{ width: 3\.9rem/);
});

test('les panneaux de création restent près de leur bouton et détachés du plateau', () => {
  assert.match(html, /function positionCreatorPanel\(panel, button\)/);
  assert.match(html, /buttonRect\.left \+ \(buttonRect\.width - panelRect\.width\) \/ 2/);
  assert.match(html, /panel\.style\.top = `\$\{headerRect\.bottom \+ 10\}px`/);
  assert.match(html, /#angle-panel \{ width: min\(18rem, calc\(100vw - 16px\)\); \}/);
  assert.match(html, /#segment-panel \{ width: min\(18rem, calc\(100vw - 16px\)\); \}/);
  assert.match(html, /\.creator-panel \{[\s\S]*padding: \.75rem/);
  assert.match(html, /#segment-length \{[\s\S]*min-height: 3rem;[\s\S]*font-size: 1\.3rem/);
  assert.match(html, /#segment-panel \.segment-submit \{[\s\S]*min-height: 3rem/);
  assert.doesNotMatch(html, /#angle-panel,[\s\S]{0,100}right: 6px !important/);
});

test('les longueurs sont affichées sans unité physique trompeuse', () => {
  assert.match(html, />Longueur du segment</);
  assert.doesNotMatch(html, /Longueur du segment \(cm\)|1 à 20 cm|\$\{formatLengthCm\(strip\.lengthCm\)\} cm/);
});

test('l’outil est silencieux et n’affiche aucune aide automatique après une création', () => {
  assert.doesNotMatch(html, /AudioContext|webkitAudioContext/);
  assert.match(html, /function playSound\(\) \{\}/);
  assert.doesNotMatch(html, /deletionHintShown/);
  assert.doesNotMatch(html, /Pour supprimer : bouton Supprimer/);
});

test('les identifiants HTML restent uniques', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);
});

function loadClosestCircleIntersection() {
  const match = html.match(
    /(function closestCircleIntersection[\s\S]*?\n\s*})\n\s*function getFixedNeighborConstraints/
  );
  assert.ok(match, 'le calcul robuste des intersections de cercles doit exister');
  const context = { input: null, result: null };
  vm.createContext(context);
  vm.runInContext(`${match[1]}; result = (...args) => closestCircleIntersection(...args);`, context);
  return (...args) => context.result(...args);
}

function loadGeometryHelpers(state) {
  const helperNames = [
    'getTriangleLengthMode',
    'getMergeTriangleMode',
    'canSnapPointPair',
    'normalizeStripToTargetLength',
    'closestCircleIntersection',
    'getFixedNeighborConstraints',
    'constrainPointToFixedNeighbors',
    'stabilizeClosedTriangleAtPoint',
  ];
  const sources = helperNames.map(name => {
    const start = html.indexOf(`function ${name}(`);
    assert.ok(start >= 0, `${name} doit exister`);
    const openBrace = html.indexOf('{', start);
    let depth = 0;
    for (let index = openBrace; index < html.length; index += 1) {
      if (html[index] === '{') depth += 1;
      if (html[index] === '}') depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
    assert.fail(`la fin de ${name} est introuvable`);
  });

  const context = {
    state,
    CONFIG: {snapDistance: 45, flatTriangleSnapDistance: 10},
    result: null,
    getStripLength: strip => strip.lengthPx,
    isPointPinned: point => Boolean(point && (point.pinned || point.fixed)),
    protractorAnchorShouldPin: () => false,
  };
  vm.createContext(context);
  vm.runInContext(
    `${sources.join('\n')}\nresult = { getMergeTriangleMode, canSnapPointPair, constrainPointToFixedNeighbors, stabilizeClosedTriangleAtPoint };`,
    context
  );
  return context.result;
}

test('le triangle plat 2,2 + 2,9 = 5,1 possède un sommet fini et exactement colinéaire', () => {
  const intersect = loadClosestCircleIntersection();
  const pixelsPerUnit = 50;
  const left = {x: 0, y: 0};
  const right = {x: 5.1 * pixelsPerUnit, y: 0};
  const result = intersect(
    left,
    2.2 * pixelsPerUnit,
    right,
    2.9 * pixelsPerUnit,
    120,
    30
  );

  assert.ok(result);
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
  assert.ok(Math.abs(result.y) < 1e-9, `le sommet devrait être sur la base, y=${result.y}`);
  assert.ok(Math.abs(Math.hypot(result.x - left.x, result.y - left.y) - 2.2 * pixelsPerUnit) < 1e-8);
  assert.ok(Math.abs(Math.hypot(result.x - right.x, result.y - right.y) - 2.9 * pixelsPerUnit) < 1e-8);
});

test('le triangle plat 3 + 2 = 5 ne s’aimante que lorsque ses deux rivets coïncident presque', () => {
  const state = {
    zoom: 1,
    points: [
      {id: 1, x: 0, y: 0},
      {id: 2, x: 250, y: 0},
      {id: 3, x: 145, y: 20},
      {id: 4, x: 160, y: 20},
    ],
    strips: [
      {id: 5, p1: 1, p2: 2, lengthPx: 250},
      {id: 6, p1: 1, p2: 3, lengthPx: 150},
      {id: 7, p1: 2, p2: 4, lengthPx: 100},
    ],
  };
  const helpers = loadGeometryHelpers(state);

  assert.equal(helpers.getMergeTriangleMode(3, 4), 'flat');
  assert.equal(helpers.canSnapPointPair(state.points[2], state.points[3]), false, '15 px est encore trop tôt');
  state.points[2].x = 155;
  assert.equal(helpers.canSnapPointPair(state.points[2], state.points[3]), true, '5 px autorise la fermeture exacte');
});

test('le seuil spécial ne modifie pas l’aimantation d’un triangle 3-3-5 ordinaire', () => {
  const state = {
    zoom: 1,
    points: [
      {id: 1, x: 0, y: 0},
      {id: 2, x: 250, y: 0},
      {id: 3, x: 120, y: -170},
      {id: 4, x: 150, y: -170},
    ],
    strips: [
      {id: 5, p1: 1, p2: 2, lengthPx: 250},
      {id: 6, p1: 1, p2: 3, lengthPx: 150},
      {id: 7, p1: 2, p2: 4, lengthPx: 150},
    ],
  };
  const helpers = loadGeometryHelpers(state);

  assert.equal(helpers.getMergeTriangleMode(3, 4), 'normal');
  assert.equal(helpers.canSnapPointPair(state.points[2], state.points[3]), true, 'le seuil normal de 45 px reste actif');
});

test('une combinaison impossible ne peut pas créer une boucle instable', () => {
  const state = {
    zoom: 1,
    points: [
      {id: 1, x: 0, y: 0},
      {id: 2, x: 300, y: 0},
      {id: 3, x: 149, y: 0},
      {id: 4, x: 150, y: 0},
    ],
    strips: [
      {id: 5, p1: 1, p2: 2, lengthPx: 300},
      {id: 6, p1: 1, p2: 3, lengthPx: 150},
      {id: 7, p1: 2, p2: 4, lengthPx: 100},
    ],
  };
  const helpers = loadGeometryHelpers(state);

  assert.equal(helpers.getMergeTriangleMode(3, 4), 'impossible');
  assert.equal(helpers.canSnapPointPair(state.points[2], state.points[3]), false);
});

test('le sommet 3-3-5 reste à l’intersection exacte des deux côtés fixés pendant le glisser', () => {
  const intersect = loadClosestCircleIntersection();
  const left = {x: 0, y: 0};
  const right = {x: 500, y: 0};
  const result = intersect(left, 300, right, 300, 250, -400);

  assert.ok(result);
  assert.ok(result.y < 0, 'le sommet doit rester du côté indiqué par le pointeur');
  assert.ok(Math.abs(Math.hypot(result.x - left.x, result.y - left.y) - 300) < 1e-8);
  assert.ok(Math.abs(Math.hypot(result.x - right.x, result.y - right.y) - 300) < 1e-8);
});

test('la contrainte de glisser 3-3-5 ne modifie jamais les deux points de la base fixée', () => {
  const state = {
    points: [
      {id: 1, x: 0, y: 0, fixed: true},
      {id: 2, x: 500, y: 0, fixed: true},
      {id: 3, x: 250, y: -Math.sqrt(300 ** 2 - 250 ** 2), pinned: true},
    ],
    strips: [
      {id: 4, p1: 1, p2: 2, lengthPx: 500, fixed: true},
      {id: 5, p1: 1, p2: 3, lengthPx: 300},
      {id: 6, p1: 2, p2: 3, lengthPx: 300},
    ],
  };
  const helpers = loadGeometryHelpers(state);
  const leftBefore = {...state.points[0]};
  const rightBefore = {...state.points[1]};
  const result = helpers.constrainPointToFixedNeighbors(state.points[2], 900, 600);

  assert.ok(result);
  assert.deepEqual(state.points[0], leftBefore);
  assert.deepEqual(state.points[1], rightBefore);
  assert.ok(Math.abs(Math.hypot(result.x, result.y) - 300) < 1e-8);
  assert.ok(Math.abs(Math.hypot(result.x - 500, result.y) - 300) < 1e-8);
});

test('la fermeture du triangle plat recale immédiatement le sommet sur la plus longue bande', () => {
  const state = {
    points: [
      {id: 1, x: 0, y: 0},
      {id: 2, x: 255, y: 0},
      {id: 3, x: 112, y: 14},
    ],
    strips: [
      {id: 4, p1: 1, p2: 2, lengthPx: 255},
      {id: 5, p1: 1, p2: 3, lengthPx: 110},
      {id: 6, p1: 2, p2: 3, lengthPx: 145},
    ],
  };
  const helpers = loadGeometryHelpers(state);

  assert.equal(helpers.stabilizeClosedTriangleAtPoint(3, 112, 14), true);
  assert.ok(Math.abs(state.points[2].x - 110) < 1e-8);
  assert.ok(Math.abs(state.points[2].y) < 1e-8);
});

test('la fermeture 3-2-5 corrige aussi la légère compression de la grande bande', () => {
  const state = {
    points: [
      {id: 1, x: 0, y: 0},
      {id: 2, x: 248, y: 0},
      {id: 3, x: 149, y: 12},
    ],
    strips: [
      {id: 4, p1: 1, p2: 2, lengthPx: 250},
      {id: 5, p1: 1, p2: 3, lengthPx: 150},
      {id: 6, p1: 2, p2: 3, lengthPx: 100},
    ],
  };
  const helpers = loadGeometryHelpers(state);

  assert.equal(helpers.stabilizeClosedTriangleAtPoint(3, 149, 12), true);
  const [left, right, middle] = state.points;
  assert.ok(Math.abs(Math.hypot(right.x - left.x, right.y - left.y) - 250) < 1e-8);
  assert.ok(Math.abs(Math.hypot(middle.x - left.x, middle.y - left.y) - 150) < 1e-8);
  assert.ok(Math.abs(Math.hypot(middle.x - right.x, middle.y - right.y) - 100) < 1e-8);
  assert.ok(Math.abs((right.x - left.x) * (middle.y - left.y) - (right.y - left.y) * (middle.x - left.x)) < 1e-8);
});

test('toutes les fusions de rivets utilisent la garde des triangles plats', () => {
  assert.ok((html.match(/canSnapPointPair\(/g) || []).length >= 7);
  assert.match(html, /flatTriangleSnapDistance:\s*10/);
});

test('une fixation reste une ancre absolue pendant les déplacements et les aimantations', () => {
  assert.match(html, /fixedNeighborConstraints\.length >= 2[\s\S]{0,250}constrainPointToFixedNeighbors/);
  assert.match(html, /groupContainsFixedPoint[\s\S]{0,120}!groupContainsFixedPoint/);
  assert.match(html, /if \(!p \|\| p\.toBeRemoved \|\| p\.fixed\) return;/);
  assert.match(html, /if \(snapped\) stabilizeClosedTriangleAtPoint\(target\.id, target\.x, target\.y\)/);
});

// Exécute les vrais gestionnaires prendre/déplacer/lâcher avec seulement les
// effets DOM/rendu remplacés. Les contraintes et les fusions ne sont pas simulées.
function loadInteraction(state) {
  const names = ['getStripLength','isPointPinned','getTriangleLengthMode','getMergeTriangleMode',
    'canSnapPointPair','getGeometryEdges','geometryIsValid','projectGeometry','beginAnchoredDrag',
    'moveAnchoredDrag','tryAnchoredSnap','normalizeStripToTargetLength','closestCircleIntersection',
    'getFixedNeighborConstraints','constrainPointToFixedNeighbors','stabilizeClosedTriangleAtPoint',
    'updateFixedPointFlags','getAllConnectedPoints','getPointAt','getStripAt','findAngleGroupByPointId',
    'isGlobalLockActive','replaceAnglePointId','cleanupAngleGroups','solveConstraints',
    'handleStart','handleMove','handleEnd'];
  const source = name => {
    const start=html.indexOf(`function ${name}(`);
    assert.ok(start>=0,name);
    let depth=0;
    for(let i=html.indexOf('{',start);i<html.length;i++) {
      if(html[i]==='{')depth++;
      if(html[i]==='}' && --depth===0)return html.slice(start,i+1);
    }
    assert.fail(name);
  };
  const noop=()=>{};
  Object.assign(state,{zoom:state.zoom||1,tool:'hand',tracedPointIds:new Set(),activePointTraceStrokes:new Map(),tools:{protractor:{visible:false}},angleGroups:state.angleGroups||[]});
  const context={state,CONFIG:{snapDistance:45,flatTriangleSnapDistance:10,currentStripWidth:.7},
    container:{style:{},getBoundingClientRect:()=>({left:0,top:0})},
    header:{getBoundingClientRect:()=>({bottom:0}),classList:{add:noop,remove:noop}},
    geoDragState:{active:false},getPos:e=>({x:e.clientX,y:e.clientY}),getClientPos:e=>({x:e.clientX,y:e.clientY}),
    protractorAnchorShouldPin:()=>false,beginPointTraceCapture:noop,endPointTraceCapture:noop,
    recordTracedPoints:noop,queueRenderOnly:noop,render:noop,clearTrashPreview:noop,
    updateConstructionToolsUI:noop,showSelectionHint:noop,setTimeout:noop,playSound:noop};
  vm.createContext(context);
  vm.runInContext(names.map(source).join('\n'),context);
  let detach;
  context.container.addEventListener=(name,handler)=>{if(name==='dblclick')detach=handler;};
  vm.runInContext(html.slice(html.indexOf("container.addEventListener('dblclick'"),html.indexOf('/* --- RENDU --- */')),context);
  context.queueSolveRender=n=>context.solveConstraints(n);
  const event=(x,y)=>({clientX:x,clientY:y,button:0,target:{closest:()=>null},preventDefault:noop});
  return {start:(x,y)=>context.handleStart(event(x,y)),move:(x,y)=>context.handleMove(event(x,y)),
    end:()=>context.handleEnd(event(600,600)),doubleClick:(x,y)=>detach(event(x,y)),canSnap:context.canSnapPointPair};
}

function anchoredChain(a=150,b=100) {
  return {points:[{id:1,x:0,y:100,fixed:true},{id:2,x:a+b,y:100,fixed:true},
    {id:3,x:a/2,y:100+a*Math.sqrt(3)/2},{id:4,x:(a+b)/2,y:100+(a+b)*Math.sqrt(3)/2}],
    strips:[{id:5,p1:1,p2:2,lengthPx:a+b,fixed:true},{id:6,p1:1,p2:3,lengthPx:a},{id:7,p1:3,p2:4,lengthPx:b}]};
}

function assertLengths(state) {
  for(const strip of state.strips){
    const a=state.points.find(p=>p.id===strip.p1),b=state.points.find(p=>p.id===strip.p2);
    assert.ok(a&&b);
    const actual=Math.hypot(b.x-a.x,b.y-a.y);
    assert.ok(Math.abs(actual-strip.lengthPx)<=1e-4,`bande ${strip.id}: ${actual} au lieu de ${strip.lengthPx}`);
  }
  assert.equal(state.points.find(p=>p.id===1).x,0);
  assert.equal(state.points.find(p=>p.id===1).y,100);
  assert.equal(state.points.find(p=>p.id===2).y,100);
}

test('prendre le corps du 2 attaché ne rallonge jamais le 3, même pendant le geste',()=>{
  const state=anchoredChain(),ui=loadInteraction(state);
  const endBefore={...state.points[3]};
  ui.start(100,100+100*Math.sqrt(3));
  assert.ok(state.draggingConstrained);
  for(const [x,y] of [[200,300],[500,100],[100,500],[25,110]]){ui.move(x,y);assertLengths(state);}
  assert.notEqual(state.points[3].x,endBefore.x,'la chaîne reste manipulable');
  ui.end();assertLengths(state);
});

test('la chaîne 3–2 suit le pointeur jusqu’à sa portée maximale et minimale sans étirement',()=>{
  for(const [a,b] of [[150,100],[110,145],[150,150]]){
    const state=anchoredChain(a,b),ui=loadInteraction(state);
    ui.start(state.points[3].x,state.points[3].y);
    ui.move(1000,100);
    assertLengths(state);
    assert.ok(Math.abs(state.points[3].x-(a+b))<1e-7);
    ui.move(1,100);
    assertLengths(state);
    assert.ok(Math.abs(Math.hypot(state.points[3].x,state.points[3].y-100)-Math.max(1,Math.abs(a-b)))<1e-6);
    ui.end();assertLengths(state);
  }
});

test('le triangle plat se ferme exactement sur la base fixée et reste plat pendant le glisser',()=>{
  const state=anchoredChain(),ui=loadInteraction(state);
  ui.start(state.points[3].x,state.points[3].y);ui.move(250,100);ui.end();
  assert.equal(state.points.length,3,'les deux aimants ont fusionné');
  assertLengths(state);
  ui.start(150,100);ui.move(900,900);assertLengths(state);ui.end();
  assert.equal(state.points.find(p=>p.id===3).y,100);
});

test('deux longueurs différentes ne fusionnent pas sur les mêmes extrémités, quel que soit leur ordre',()=>{
  for(const reverse of [false,true]){
    const state=anchoredChain();if(reverse)state.strips.reverse();
    const ui=loadInteraction(state);
    const source=state.points[3],target=state.points[0];
    assert.equal(ui.canSnap(source,target,target.x,target.y),false);
    ui.start(source.x,source.y);ui.move(1,100);ui.end();
    assert.equal(state.points.length,4);assertLengths(state);
  }
});

test('la jonction 3–2 peut tourner autour de la base et conserve les deux longueurs',()=>{
  const state=anchoredChain(),ui=loadInteraction(state);
  ui.start(state.points[2].x,state.points[2].y);
  ui.move(0,300);assertLengths(state);
  assert.ok(Math.abs(state.points[2].x)<1e-6);
  assert.ok(Math.abs(state.points[2].y-250)<1e-6);
  ui.end();assertLengths(state);
});

test('un groupe rigide fixé en deux points reste immobile',()=>{
  const state=anchoredChain();state.globalLock=true;
  const ui=loadInteraction(state),before=state.points.map(p=>({x:p.x,y:p.y}));
  ui.start(state.points[3].x,state.points[3].y);ui.move(600,600);ui.end();
  assert.deepEqual(state.points.map(p=>({x:p.x,y:p.y})),before);
});

test('un angle créé relié à une base fixe conserve ses longueurs et son angle',()=>{
  const state=anchoredChain();
  state.angleGroups=[{id:8,vertexId:3,aId:1,bId:4,strip1Id:6,strip2Id:7,leg1Len:150,leg2Len:100,degrees:180}];
  const ui=loadInteraction(state);
  ui.start(state.points[3].x,state.points[3].y);ui.move(800,300);assertLengths(state);ui.end();assertLengths(state);
  assert.ok(state.points[3].x>200,'l’angle fixé reste orientable autour de son ancre');
  const [a,,m,b]=state.points;
  assert.ok(Math.abs((m.x-a.x)*(b.y-a.y)-(m.y-a.y)*(b.x-a.x))<.1);
});

test('le déplacement libre d’une construction sans fixation reste une translation',()=>{
  const state=anchoredChain();state.points.forEach(p=>p.fixed=false);state.strips[0].fixed=false;
  const ui=loadInteraction(state),before=state.points.map(p=>({x:p.x,y:p.y}));
  ui.start(100,100+100*Math.sqrt(3));assert.ok(state.draggingStrip);
  ui.move(200,100+100*Math.sqrt(3));
  state.points.forEach((p,i)=>{assert.equal(p.x,before[i].x+100);assert.equal(p.y,before[i].y);});
  ui.end();
});

test('le triangle ordinaire 3–3–5 fixé reste indéformable sur toute la séquence',()=>{
  const state=anchoredChain(150,150);
  state.points.pop();state.points[1].x=250;state.points[2].x=125;state.points[2].y=100+Math.sqrt(150**2-125**2);
  state.strips[0].lengthPx=250;state.strips[2].p2=2;
  const ui=loadInteraction(state),before=state.points.map(p=>({...p}));
  ui.start(state.points[2].x,state.points[2].y);
  for(const [x,y] of [[800,800],[-400,100],[125,-600]]){ui.move(x,y);assertLengths(state);}
  ui.end();assertLengths(state);
  state.points.forEach((p,i)=>{assert.ok(Math.hypot(p.x-before[i].x,p.y-before[i].y)<1e-7);});
});

test('détacher près d’un segment fixé préserve ses deux ancres quel que soit l’ordre des bandes',()=>{
  for(const reverse of [false,true]){
    const state=anchoredChain();state.nextId=20;if(reverse)state.strips.reverse();
    const base=state.strips.find(s=>s.fixed),before={...base};
    const ui=loadInteraction(state);ui.doubleClick(0,100);
    assert.deepEqual(base,before);assertLengths(state);
    const detached=state.points.find(p=>p.id===20);
    assert.ok(detached && !detached.fixed);
    assert.equal(state.points[0].fixed,true);
  }
});

test('une chaîne plus longue attachée conserve toutes ses longueurs pendant les gestes successifs',()=>{
  const state=anchoredChain();state.points.push({id:8,x:225,y:100+125*Math.sqrt(3)});
  state.strips.push({id:9,p1:4,p2:8,lengthPx:100});
  const ui=loadInteraction(state),start={...state.points[4]};
  ui.start(start.x,start.y);
  for(let i=1;i<=20;i++){ui.move(start.x+i*3,start.y+i*2);assertLengths(state);}
  assert.ok(Math.hypot(state.points[4].x-start.x,state.points[4].y-start.y)>5);
  ui.end();assertLengths(state);
});
