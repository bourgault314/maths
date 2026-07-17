(function(root,factory){
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  root.MathsGoPythagoreSnapEngine=api;
})(typeof globalThis!=="undefined" ? globalThis : this,function(){
  "use strict";

  const EPS=1e-8;
  const DEFAULTS={
    maxTranslationPx:42,
    maxRotationDeg:18,
    exactTranslationPx:30,
    exactRotationDeg:12,
    containmentTolerancePx:5,
    contactTolerancePx:1.5,
    minEdgeOverlapPx:12
  };

  const rad=degrees=>degrees*Math.PI/180;
  const deg=radians=>radians*180/Math.PI;
  function normAngleDeg(value){
    let angle=value%360;
    if(angle>180) angle-=360;
    if(angle<=-180) angle+=360;
    return angle;
  }
  const angleDistance=(a,b)=>Math.abs(normAngleDeg(a-b));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  function transformVertices(piece,pose=piece){
    const angle=rad(pose.rot||0), c=Math.cos(angle), s=Math.sin(angle);
    const sx=pose.flipX ? -1 : 1;
    return piece.verticesLocal.map(vertex=>{
      const x=sx*vertex.x, y=vertex.y;
      return {
        x:pose.pos.x+x*c-y*s,
        y:pose.pos.y+x*s+y*c
      };
    });
  }

  function segments(vertices){
    return vertices.map((a,index)=>({a,b:vertices[(index+1)%vertices.length],index}));
  }

  function closestPointOnSegment(point,a,b){
    const dx=b.x-a.x, dy=b.y-a.y;
    const length2=dx*dx+dy*dy;
    if(length2<EPS) return {...a};
    const ratio=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length2));
    return {x:a.x+ratio*dx,y:a.y+ratio*dy};
  }

  function distanceToSegment(point,a,b){
    return distance(point,closestPointOnSegment(point,a,b));
  }

  function pointOnBoundary(point,polygon,tolerance){
    return segments(polygon).some(edge=>distanceToSegment(point,edge.a,edge.b)<=tolerance);
  }

  function pointInPolygon(point,polygon,tolerance=0){
    if(pointOnBoundary(point,polygon,tolerance)) return true;
    let inside=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i], b=polygon[j];
      const crosses=(a.y>point.y)!==(b.y>point.y);
      if(crosses && point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
    }
    return inside;
  }

  function polygonInsideTarget(polygon,target,tolerance){
    return polygon.every(point=>pointInPolygon(point,target,tolerance));
  }

  function orientation(a,b,c){
    return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  }

  function properSegmentIntersection(a,b,c,d,tolerance){
    const ab=Math.max(distance(a,b),EPS), cd=Math.max(distance(c,d),EPS);
    const o1=orientation(a,b,c), o2=orientation(a,b,d);
    const o3=orientation(c,d,a), o4=orientation(c,d,b);
    const e1=tolerance*ab, e2=tolerance*cd;
    return ((o1>e1 && o2<-e1)||(o1<-e1 && o2>e1)) &&
      ((o3>e2 && o4<-e2)||(o3<-e2 && o4>e2));
  }

  function strictlyInside(point,polygon,tolerance){
    return pointInPolygon(point,polygon,0) && !pointOnBoundary(point,polygon,tolerance);
  }

  function polygonCentroid(polygon){
    let area2=0,cx=0,cy=0;
    for(let i=0;i<polygon.length;i++){
      const p=polygon[i],q=polygon[(i+1)%polygon.length];
      const cross=p.x*q.y-q.x*p.y;
      area2+=cross;
      cx+=(p.x+q.x)*cross;
      cy+=(p.y+q.y)*cross;
    }
    if(Math.abs(area2)<EPS){
      return polygon.reduce((sum,p)=>({x:sum.x+p.x/polygon.length,y:sum.y+p.y/polygon.length}),{x:0,y:0});
    }
    return {x:cx/(3*area2),y:cy/(3*area2)};
  }

  function polygonsOverlapInterior(first,second,tolerance){
    for(const a of segments(first)){
      for(const b of segments(second)){
        if(properSegmentIntersection(a.a,a.b,b.a,b.b,tolerance)) return true;
      }
    }
    return first.some(point=>strictlyInside(point,second,tolerance)) ||
      second.some(point=>strictlyInside(point,first,tolerance)) ||
      strictlyInside(polygonCentroid(first),second,tolerance) ||
      strictlyInside(polygonCentroid(second),first,tolerance);
  }

  function edgeOverlapLength(first,second){
    const dx=second.b.x-second.a.x, dy=second.b.y-second.a.y;
    const length=Math.hypot(dx,dy);
    if(length<EPS) return 0;
    const ux=dx/length, uy=dy/length;
    const p0=(first.a.x-second.a.x)*ux+(first.a.y-second.a.y)*uy;
    const p1=(first.b.x-second.a.x)*ux+(first.b.y-second.a.y)*uy;
    return Math.max(0,Math.min(Math.max(p0,p1),length)-Math.max(Math.min(p0,p1),0));
  }

  function poseWithDelta(piece,rotDelta,translation){
    return {
      pos:{x:piece.pos.x+translation.x,y:piece.pos.y+translation.y},
      rot:normAngleDeg((piece.rot||0)+rotDelta),
      flipX:!!piece.flipX
    };
  }

  function makeCandidate(kind,pose,meta={}){
    return {kind,pose,meta};
  }

  function findBestSnap(options){
    const piece=options.piece;
    const targetPolygon=options.targetPolygon;
    if(!piece || !piece.verticesLocal?.length || !targetPolygon?.length) return null;

    const scale=Math.max(Number(options.scale)||1,EPS);
    const thresholds={...DEFAULTS,...(options.thresholds||{})};
    const placed=(options.placedPolygons||[]).filter(item=>item?.vertices?.length);
    const tolerance=thresholds.contactTolerancePx/scale;
    const containmentTolerance=thresholds.containmentTolerancePx/scale;
    const candidates=[];
    const currentVertices=transformVertices(piece);
    const sourceEdges=segments(currentVertices);
    const targetEdges=[
      ...segments(targetPolygon).map(edge=>({...edge,owner:"boundary"})),
      ...placed.flatMap(item=>segments(item.vertices).map(edge=>({...edge,owner:item.id||"piece"})))
    ];
    const targetVertices=[
      ...targetPolygon.map(point=>({point,owner:"boundary"})),
      ...placed.flatMap(item=>item.vertices.map(point=>({point,owner:item.id||"piece"})))
    ];

    if(options.exactPose && options.exactPose.flipX===piece.flipX){
      const exact=options.exactPose;
      const translationPx=distance(piece.pos,exact.pos)*scale;
      const rotationDeg=angleDistance(piece.rot||0,exact.rot||0);
      if(translationPx<=thresholds.exactTranslationPx && rotationDeg<=thresholds.exactRotationDeg){
        candidates.push(makeCandidate("exact",{
          pos:{...exact.pos},rot:normAngleDeg(exact.rot||0),flipX:!!exact.flipX
        }));
      }
    }

    // Un coin posé sur un coin reste possible sans imposer de rotation.
    for(const vertex of currentVertices){
      for(const target of targetVertices){
        candidates.push(makeCandidate("vertex",poseWithDelta(piece,0,{
          x:target.point.x-vertex.x,
          y:target.point.y-vertex.y
        }),{owner:target.owner}));
      }
    }

    // Le cœur du moteur : rotation et translation sont calculées ensemble afin
    // de rendre deux arêtes exactement colinéaires, même lorsqu'elles sont en biais.
    for(const source of sourceEdges){
      const sourceAngle=deg(Math.atan2(source.b.y-source.a.y,source.b.x-source.a.x));
      for(const target of targetEdges){
        const targetAngle=deg(Math.atan2(target.b.y-target.a.y,target.b.x-target.a.x));
        const corrections=[
          normAngleDeg(targetAngle-sourceAngle),
          normAngleDeg(targetAngle+180-sourceAngle)
        ];
        for(const correction of corrections){
          if(Math.abs(correction)>thresholds.maxRotationDeg) continue;
          const rotatedPose=poseWithDelta(piece,correction,{x:0,y:0});
          const rotated=transformVertices(piece,rotatedPose);
          const rotatedEdge=segments(rotated)[source.index];
          const tx=target.b.x-target.a.x, ty=target.b.y-target.a.y;
          const targetLength=Math.hypot(tx,ty);
          if(targetLength<EPS) continue;
          const ux=tx/targetLength, uy=ty/targetLength, nx=-uy, ny=ux;
          const da=(rotatedEdge.a.x-target.a.x)*nx+(rotatedEdge.a.y-target.a.y)*ny;
          const db=(rotatedEdge.b.x-target.a.x)*nx+(rotatedEdge.b.y-target.a.y)*ny;
          const perpendicular=(da+db)/2;
          const linePose={
            ...rotatedPose,
            pos:{x:rotatedPose.pos.x-perpendicular*nx,y:rotatedPose.pos.y-perpendicular*ny}
          };
          const lineVertices=transformVertices(piece,linePose);
          const lineEdge=segments(lineVertices)[source.index];
          const overlap=edgeOverlapLength(lineEdge,target);
          if(overlap*scale>=thresholds.minEdgeOverlapPx){
            candidates.push(makeCandidate("edge",linePose,{owner:target.owner,overlapPx:overlap*scale}));
          }

          // Aligner également un bout d'arête sur un coin donne un snap stable
          // dans les coins du carré et aux jonctions entre plusieurs pièces.
          for(const sourcePoint of [rotatedEdge.a,rotatedEdge.b]){
            for(const targetPoint of [target.a,target.b]){
              candidates.push(makeCandidate("edge-endpoint",{
                ...rotatedPose,
                pos:{
                  x:rotatedPose.pos.x+targetPoint.x-sourcePoint.x,
                  y:rotatedPose.pos.y+targetPoint.y-sourcePoint.y
                }
              },{owner:target.owner}));
            }
          }
        }
      }
    }

    const kindBias={exact:-26,"edge-endpoint":-24,vertex:-13,edge:-9};
    let best=null;
    for(const candidate of candidates){
      const translationPx=distance(piece.pos,candidate.pose.pos)*scale;
      const rotationDeg=angleDistance(piece.rot||0,candidate.pose.rot||0);
      if(translationPx>thresholds.maxTranslationPx || rotationDeg>thresholds.maxRotationDeg) continue;

      const vertices=transformVertices(piece,candidate.pose);
      if(!polygonInsideTarget(vertices,targetPolygon,containmentTolerance)) continue;
      if(placed.some(item=>polygonsOverlapInterior(vertices,item.vertices,tolerance))) continue;

      const overlapReward=Math.min(candidate.meta.overlapPx||0,60)*0.08;
      const score=translationPx+rotationDeg*1.25+(kindBias[candidate.kind]||0)-overlapReward;
      if(!best || score<best.score){
        best={...candidate,vertices,score,translationPx,rotationDeg};
      }
    }
    return best;
  }

  function pieceInsideTarget(piece,targetPolygon,scale=1,tolerancePx=4){
    return polygonInsideTarget(transformVertices(piece),targetPolygon,tolerancePx/Math.max(scale,EPS));
  }

  return {
    DEFAULTS,
    angleDistance,
    closestPointOnSegment,
    findBestSnap,
    normAngleDeg,
    pieceInsideTarget,
    pointInPolygon,
    polygonsOverlapInterior,
    segments,
    transformVertices
  };
});
