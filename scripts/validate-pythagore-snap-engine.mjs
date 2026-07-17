import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const engine=require('../assets/js/pythagore-snap-engine.js');
const fail=message=>{throw new Error(message);};
const near=(a,b,tolerance=1e-5)=>Math.abs(a-b)<=tolerance;

function centroid(points){
  let area2=0,cx=0,cy=0;
  for(let i=0;i<points.length;i++){
    const p=points[i],q=points[(i+1)%points.length];
    const cross=p.x*q.y-q.x*p.y;
    area2+=cross;
    cx+=(p.x+q.x)*cross;
    cy+=(p.y+q.y)*cross;
  }
  if(Math.abs(area2)<1e-9) return points.reduce((sum,p)=>({x:sum.x+p.x/points.length,y:sum.y+p.y/points.length}),{x:0,y:0});
  return {x:cx/(3*area2),y:cy/(3*area2)};
}

function pieceFromDesired(points,dx=0,dy=0,rot=0){
  const center=centroid(points);
  return {
    verticesLocal:points.map(point=>({x:point.x-center.x,y:point.y-center.y})),
    pos:{x:center.x+dx,y:center.y+dy},
    rot,
    flipX:false
  };
}

function closestVertexDistance(vertices,target){
  return Math.min(...vertices.map(point=>Math.hypot(point.x-target.x,point.y-target.y)));
}

const square=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
const mobileThresholds={maxTranslationPx:48,maxRotationDeg:20,exactTranslationPx:34,exactRotationDeg:14,containmentTolerancePx:6,contactTolerancePx:1.5,minEdgeOverlapPx:10};

// Coin : la rotation et la translation doivent être corrigées en une seule pose.
{
  const desired=[{x:0,y:0},{x:30,y:0},{x:0,y:20}];
  const piece=pieceFromDesired(desired,4,5,12);
  const result=engine.findBestSnap({piece,targetPolygon:square,placedPolygons:[],scale:4,thresholds:mobileThresholds});
  if(!result) fail('Aucun snap trouvé pour une pièce proche d’un coin.');
  if(closestVertexDistance(result.vertices,{x:0,y:0})>0.05) fail('Le coin de la pièce ne rejoint pas précisément le coin de c².');
  if(!engine.pieceInsideTarget({...piece,...result.pose},square,4,1)) fail('La pièce corrigée dans un coin dépasse de c².');
}

// Bord : une pièce peut se coller au milieu d'une bordure, sans être attirée par un coin.
{
  const desired=[{x:40,y:80},{x:70,y:80},{x:70,y:100},{x:40,y:100}];
  const piece=pieceFromDesired(desired,1,-2,9);
  const result=engine.findBestSnap({piece,targetPolygon:square,placedPolygons:[],scale:4,thresholds:mobileThresholds});
  if(!result) fail('Aucun snap trouvé au milieu d’une bordure.');
  const onBottom=result.vertices.filter(point=>Math.abs(point.y-100)<0.05);
  if(onBottom.length<2) fail('L’arête déposée près du bord inférieur n’est pas devenue colinéaire.');
}

// Biais : deux hypoténuses doivent se superposer sans chevaucher les pièces.
{
  const placed=[{x:0,y:0},{x:50,y:0},{x:0,y:50}];
  const desired=[{x:50,y:0},{x:50,y:50},{x:0,y:50}];
  const piece=pieceFromDesired(desired,3,2,11);
  const result=engine.findBestSnap({
    piece,targetPolygon:square,placedPolygons:[{id:'placed',vertices:placed}],scale:4,thresholds:mobileThresholds
  });
  if(!result) fail('Aucun snap trouvé entre deux arêtes obliques.');
  if(engine.polygonsOverlapInterior(result.vertices,placed,0.02)) fail('Le snap oblique fait chevaucher les deux pièces.');
  if(closestVertexDistance(result.vertices,{x:50,y:0})>0.05 || closestVertexDistance(result.vertices,{x:0,y:50})>0.05){
    fail('Les extrémités des arêtes obliques ne coïncident pas précisément.');
  }
}

// Une pièce éloignée conserve sa pose libre.
{
  const piece=pieceFromDesired([{x:0,y:0},{x:20,y:0},{x:0,y:20}],150,150,7);
  const result=engine.findBestSnap({piece,targetPolygon:square,placedPolygons:[],scale:4,thresholds:mobileThresholds});
  if(result) fail('Une pièce éloignée de c² ne doit pas être aimantée.');
}

// Deux pièces identiques exactement superposées constituent bien un chevauchement.
{
  const triangle=[{x:10,y:10},{x:40,y:10},{x:10,y:40}];
  if(!engine.polygonsOverlapInterior(triangle,triangle.map(point=>({...point})),0.02)){
    fail('Deux pièces identiques superposées ne sont pas détectées comme chevauchantes.');
  }
}

// Au centre du pavage, une pose exacte proche reste disponible comme finition.
{
  const desired=[{x:40,y:40},{x:60,y:40},{x:60,y:60},{x:40,y:60}];
  const center=centroid(desired);
  const piece=pieceFromDesired(desired,5,-4,10);
  const result=engine.findBestSnap({
    piece,targetPolygon:square,placedPolygons:[],exactPose:{pos:center,rot:0,flipX:false},scale:4,thresholds:mobileThresholds
  });
  if(!result || result.kind!=='exact') fail('La correction exacte de finition au centre du pavage est absente.');
}

// Toutes les pièces des dix pavages sont testées autour de leur pose finale :
// décalage tactile + erreur angulaire, avec toutes les voisines déjà en place.
const html=fs.readFileSync(new URL('../outils/plateaux_manipulation/moulin_pythagore.html',import.meta.url),'utf8');
const match=html.match(/const EXACT_SOLUTION_UV = (\{[\s\S]*?\n  \});/);
if(!match) fail('Les pavages exacts sont introuvables.');
const layouts=vm.runInNewContext(`(${match[1]})`,Object.create(null));
const side=Math.sqrt(5);
const sideByPuzzle={sixEquilibre:Math.sqrt(2),tangram:Math.sqrt(2),moulinIsocele:Math.sqrt(2),mosaiqueSept:5/3};
const bhaskaraCorners=[[side,0],[0,0],[0,side],[side,side]];
const bhaskaraThird=bhaskaraCorners.map((point,index)=>{
  const next=bhaskaraCorners[(index+1)%bhaskaraCorners.length];
  const ex=(next[0]-point[0])/side,ey=(next[1]-point[1])/side;
  return [point[0]+(4/side)*ex+(2/side)*ey,point[1]+(4/side)*ey-(2/side)*ex];
});
layouts.bhaskara={
  t1:[bhaskaraCorners[0],bhaskaraCorners[1],bhaskaraThird[0]],
  t2:[bhaskaraCorners[1],bhaskaraCorners[2],bhaskaraThird[1]],
  t3:[bhaskaraCorners[2],bhaskaraCorners[3],bhaskaraThird[2]],
  t4:[bhaskaraCorners[3],bhaskaraCorners[0],bhaskaraThird[3]],
  sq:bhaskaraThird
};
let tested=0;
for(const [puzzle,layout] of Object.entries(layouts)){
  const puzzleSide=sideByPuzzle[puzzle]||side;
  const unitSquare=[{x:0,y:0},{x:puzzleSide,y:0},{x:puzzleSide,y:puzzleSide},{x:0,y:puzzleSide}];
  const entries=Object.entries(layout).map(([key,points])=>[key,points.map(([x,y])=>({x,y}))]);
  for(const [key,desired] of entries){
    const center=centroid(desired);
    const piece=pieceFromDesired(desired,0.08,-0.06,9);
    const placedPolygons=entries.filter(([other])=>other!==key).map(([id,vertices])=>({id,vertices}));
    const result=engine.findBestSnap({
      piece,
      targetPolygon:unitSquare,
      placedPolygons,
      exactPose:null,
      scale:100,
      thresholds:mobileThresholds
    });
    if(!result) fail(`Le moteur ne recale pas ${puzzle}/${key}.`);
    if(!near(result.pose.pos.x,center.x,1e-5) || !near(result.pose.pos.y,center.y,1e-5) || !near(result.pose.rot,0,1e-5)){
      fail(`La pose obtenue pour ${puzzle}/${key} n’est pas la pose exacte attendue.`);
    }
    tested++;
  }
}

console.log(`OK — moteur géométrique : coins, bordures, biais et ${tested} poses de pavage contrôlés.`);
