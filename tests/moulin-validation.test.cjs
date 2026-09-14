const test=require('node:test');
const assert=require('node:assert/strict');
const {createAudit}=require('./helpers/moulin-harness.cjs');
const puzzles=Object.keys(createAudit().api.PUZZLES);
const near=(a,b,epsilon=1e-5)=>assert.ok(Math.abs(a-b)<epsilon,`${a} ≠ ${b}`);
function event(target,id=1,x=100,y=100,type='pointerup'){
  return {type,currentTarget:target,target,pointerId:id,pointerType:'touch',clientX:x,clientY:y,preventDefault(){},stopPropagation(){}};
}
function flushCompletion(h){
  const id=h.api.state.completionTimer;
  assert.ok(id,'Une vérification doit être programmée après relâchement.');
  const timer=h.timers.get(id);assert.equal(timer.delay,80);h.timers.delete(id);timer.fn();
}
function transformSolution(h,turns,mirror){
  const {state,polygonCentroid}=h.api, mold=state.moulins.L.mold;
  const center=polygonCentroid(mold.corners),u=mold.uvec;
  for(const p of state.pieces.values()){
    if(mirror){
      const x=p.pos.x-center.x,y=p.pos.y-center.y,dot=x*u.x+y*u.y;
      p.pos={x:center.x+2*dot*u.x-x,y:center.y+2*dot*u.y-y};
      p.rot=2*Math.atan2(u.y,u.x)*180/Math.PI+180-p.rot;p.flipX=!p.flipX;
    }
    for(let i=0;i<turns;i++){
      p.pos={x:center.x-(p.pos.y-center.y),y:center.y+(p.pos.x-center.x)};p.rot+=90;
    }
  }
}

for(const puzzle of puzzles){
  test(`${puzzle} : départ, solution, chaque pièce oubliée et huit symétries`,()=>{
    const h=createAudit();h.setup(puzzle);
    assert.equal(h.api.checkPuzzleSolution({quiet:true}),false);
    assert.equal(h.api.state.pieces.size,h.api.state.solutionPoses.size);
    for(const p of h.api.state.pieces.values()){
      h.solve();p.pos={...p.home};p.rot=0;p.flipX=false;
      assert.equal(h.api.checkPuzzleSolution({quiet:true}),false,`Pièce oubliée : ${p.id}`);
    }
    for(const mirror of [false,true])for(let turns=0;turns<4;turns++){
      h.solve();transformSolution(h,turns,mirror);
      assert.equal(h.api.checkPuzzleSolution({quiet:true}),true,`Symétrie ${turns}/${mirror}`);
      for(const p of h.api.state.pieces.values()){
        const points=h.api.pieceWorldVertices(p);
        for(const polygon of [points,[...points].reverse()]){
          const triangles=h.api.triangulateSimplePolygon(polygon);
          assert.ok(triangles,`${p.id} triangulable dans les deux sens`);
          near(triangles.reduce((s,t)=>s+h.api.polygonArea(t),0),h.api.polygonArea(points));
        }
      }
    }
    // La reconnaissance n'impose ni une pose tabulée ni le drapeau de snap.
    h.api.state.solutionPoses.clear();
    for(const p of h.api.state.pieces.values())p.placed=false;
    assert.equal(h.api.checkPuzzleSolution({quiet:true}),true);
  });

  test(`${puzzle} : relâchement de chaque pièce dans les huit symétries, deux échelles`,()=>{
    const h=createAudit();h.setup(puzzle);
    for(const scale of [.36,1])for(const mirror of [false,true])for(let turns=0;turns<4;turns++){
      for(const id of h.api.state.pieces.keys()){
        h.solve();transformSolution(h,turns,mirror);
        h.element('world').getScreenCTM=()=>({a:scale,b:0});
        for(const p of h.api.state.pieces.values()){p.hasMoved=true;p.placed=true;}
        h.api.snapPieceAfterDrop(h.api.state.pieces.get(id));
        assert.equal(h.api.checkPuzzleSolution({quiet:true}),true,`${id}, échelle ${scale}, symétrie ${turns}/${mirror}`);
      }
    }
  });
}

const counterexamples=[
  ['quadrillageCinq','L-a1',0,1,0],['quadrillageCinq','L-a2',-3,1,0],
  ['quadrillageCinq','L-b1',-2,-3,0],['quadrillageCinq','L-b2',1,-1,180],
  ['quadrillageCinq','L-b3',2,-1,0],['quadrillageQuatre','L-a1',2,1,0],
  ['quadrillageQuatre','L-b1',-2,0,0],['quadrillageQuatre','L-b2',-1,-1,90],
  ['quadrillageQuatre','L-b3',1,0,0]
];
test('Les neuf faux assemblages reproduits pendant l’audit sont refusés',()=>{
  for(const [puzzle,id,u,v,rotation]of counterexamples){
    const h=createAudit();h.setup(puzzle);h.solve();
    const mold=h.api.state.moulins.L.mold,p=h.api.state.pieces.get(id);
    p.pos.x+=105*(u*mold.uvec.x+v*mold.vvec.x);
    p.pos.y+=105*(u*mold.uvec.y+v*mold.vvec.y);p.rot+=rotation;
    assert.equal(h.api.checkPuzzleSolution({quiet:true,celebrate:true}),false,`${puzzle}/${id}`);
    assert.equal(h.api.state.reussites.size,0);
    // Le résultat ne dépend pas de l'ordre des pièces.
    h.api.state.pieces=new Map([...h.api.state.pieces].reverse());
    assert.equal(h.api.checkPuzzleSolution({quiet:true}),false);
  }
});

test('Le snap ne masque pas les deux contre-exemples principaux',()=>{
  for(const [puzzle,id,u,v]of [counterexamples[1],counterexamples[5]]){
    const h=createAudit();h.setup(puzzle);h.solve();
    h.element('world').getScreenCTM=()=>({a:.36,b:0});
    for(const p of h.api.state.pieces.values()){p.hasMoved=true;p.placed=true;}
    const mold=h.api.state.moulins.L.mold,p=h.api.state.pieces.get(id);
    p.pos.x+=105*(u*mold.uvec.x+v*mold.vvec.x);p.pos.y+=105*(u*mold.uvec.y+v*mold.vvec.y);
    h.api.snapPieceAfterDrop(p);
    assert.equal(p.placed,false);assert.equal(h.api.checkPuzzleSolution({quiet:true}),false);
  }
});

test('Intersection concave : aire exacte, dans les deux sens, trous et bords communs',()=>{
  const h=createAudit(),a=h.api;
  const L=[[0,0],[30,0],[30,10],[10,10],[10,30],[0,30]].map(([x,y])=>({x,y}));
  const rect=(x,y,w,z)=>[{x,y},{x:x+w,y},{x:x+w,y:y+z},{x,y:y+z}];
  function area(p,q){let total=0;for(const t of a.triangulateSimplePolygon(p))for(const u of a.triangulateSimplePolygon(q))total+=a.polygonArea(a.clipConvexPolygon(t,u));return total;}
  for(const mask of [L,[...L].reverse()]){
    near(area(mask,rect(0,0,30,30)),500);near(area(rect(0,0,30,30),mask),500);
    near(area(mask,mask),500);near(area(mask,rect(10,10,20,20)),0);
    near(area(mask,rect(20,0,10,10)),100);near(area(mask,rect(30,0,10,10)),0);
  }
  const extra=[...L,L[0]];extra.splice(1,0,{x:15,y:0});
  near(a.triangulateSimplePolygon(extra).reduce((s,t)=>s+a.polygonArea(t),0),500);
  assert.equal(a.triangulateSimplePolygon([{x:0,y:0},{x:1,y:1},{x:2,y:2}]),null);
  assert.equal(a.triangulateSimplePolygon([{x:NaN,y:0},{x:1,y:1},{x:2,y:0}]),null);
});

test('Saisir le carré central annule le minuteur : ni Bravo ni coche pendant le geste',()=>{
  const h=createAudit();h.setup('perigal');h.solve();const p=h.api.state.pieces.get('L-sq');
  p.pos.x+=100;h.api.queueCompletionCheck();const oldId=h.api.state.completionTimer;
  h.api.onPiecePointerDown(event(p.el));
  assert.equal(h.api.state.completionTimer,null);assert.equal(h.timers.has(oldId),false);
  h.element('stage').listeners.pointermove[0](event(p.el,1,0,100));
  assert.equal(h.api.checkPuzzleSolution({quiet:true,celebrate:true}),false);
  h.element('checkSolution').onclick();
  assert.equal(h.api.state.celebrated,false);assert.equal(h.api.state.reussites.size,0);
  h.api.queueCompletionCheck();assert.equal(h.api.state.completionTimer,null);
  h.element('stage').listeners.pointermove[0](event(p.el,1,100,100));
  h.api.finishPointerInteraction(event(p.el));flushCompletion(h);
  assert.equal(h.api.state.reussites.size,0,'Le carré est reparti : aucune réussite.');
  h.solve();h.api.onPiecePointerDown(event(p.el));h.api.finishPointerInteraction(event(p.el));flushCompletion(h);
  assert.equal(h.api.state.reussites.has('perigal'),true);
});

test('Rotation, retournement, deux doigts et annulation attendent une vraie fin de geste',()=>{
  for(const rotation of [false,true])for(const cancel of [false,true]){
    const h=createAudit();h.setup('bhaskara');h.solve();const p=h.api.state.pieces.get('L-sq');
    h.api.queueCompletionCheck();
    if(rotation){h.api.onHandlePointerDown(event(p.el));}
    else {h.api.onPiecePointerDown(event(p.el));h.api.onPiecePointerDown(event(p.el,2,200,100));}
    assert.equal(h.api.state.completionTimer,null);
    if(!rotation){h.api.finishPointerInteraction(event(p.el,1,100,100,cancel?'pointercancel':'pointerup'));assert.ok(h.api.state.dragging);assert.equal(h.api.state.completionTimer,null);}
    h.api.finishPointerInteraction(event(p.el,rotation?1:2,100,100,rotation&&cancel?'pointercancel':'pointerup'));
    assert.equal(h.api.state.dragging,null);
    if(cancel){assert.equal(h.api.state.completionTimer,null);assert.equal(h.api.state.reussites.size,0);}
    else {flushCompletion(h);assert.equal(h.api.state.reussites.has('bhaskara'),true);}
  }
  const h=createAudit();h.setup('bhaskara');h.solve();const p=h.api.state.pieces.get('L-sq');
  h.api.onPiecePointerDown(event(p.el));h.api.flipPiece(p.id);
  assert.equal(h.api.state.completionTimer,null);assert.equal(h.api.state.reussites.size,0);
});

test('Le geste annulé ne déclenche ni aimantation ni vérification',()=>{
  const h=createAudit();h.setup('perigal');h.solve();const p=h.api.state.pieces.get('L-sq');
  p.hasMoved=true;p.placed=true;p.pos.x+=2;
  const before={...p.pos};h.api.onPiecePointerDown(event(p.el));
  h.api.finishPointerInteraction(event(p.el,1,100,100,'pointercancel'));
  assert.deepEqual(p.pos,before);assert.equal(h.api.state.completionTimer,null);
  assert.equal(p.placed,false,'Une pose interrompue ne sert pas de cible d’aimantation.');
});

test('La réussite reste unique, le bouton Vérifier et Réinitialiser fonctionnent',()=>{
  const h=createAudit();h.setup('moulinIsocele');h.solve();
  h.element('checkSolution').onclick();assert.equal(h.api.state.reussites.size,1);
  h.element('checkSolution').onclick();assert.equal(h.api.state.reussites.size,1);
  h.element('reset').onclick();assert.equal(h.api.state.celebrated,false);
  assert.equal(h.api.checkPuzzleSolution({quiet:true}),false);
  assert.equal(h.api.state.reussites.size,1,'Une réussite obtenue reste mémorisée.');
});
