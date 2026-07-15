/**
 * Rendu exécutable des composants Pythagore maths&go.
 *
 * Les fonctions de ce fichier produisent les géométries de référence utilisées
 * par les outils, les cours et les miniatures. Elles sont indépendantes du DOM
 * afin de pouvoir servir dans une page interactive comme dans un générateur SVG.
 */

export const PYTHAGORE_COLORS = Object.freeze({
  hypFill: "#e2f5e8",
  hypStroke: "#24994d",
  hypText: "#187a3c",
  leg1Fill: "#dceeff",
  leg1Stroke: "#0879d0",
  leg1Text: "#0879d0",
  leg2Fill: "#fff0d8",
  leg2Stroke: "#e89516",
  leg2Text: "#b76e00",
  outline: "#172033",
  blue: "#169de8",
  green: "#13ad13",
  gray: "#969696",
  magenta: "#d90072",
  yellow: "#ffd071"
});

const p = (x, y) => ({x, y});
const add = (a, b) => p(a.x + b.x, a.y + b.y);
const scale = (v, k) => p(v.x * k, v.y * k);
const pointsAttr = points => points.map(point => `${round(point.x)},${round(point.y)}`).join(" ");
const round = value => Math.round(value * 1000) / 1000;

function lineIntersection(p1, p2, p3, p4){
  const den = (p1.x-p2.x)*(p3.y-p4.y) - (p1.y-p2.y)*(p3.x-p4.x);
  if(Math.abs(den) < 1e-9) throw new Error("Droites parallèles");
  return p(
    ((p1.x*p2.y-p1.y*p2.x)*(p3.x-p4.x)-(p1.x-p2.x)*(p3.x*p4.y-p3.y*p4.x))/den,
    ((p1.x*p2.y-p1.y*p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x*p4.y-p3.y*p4.x))/den
  );
}

/** Moulin exact construit à partir des deux côtés de l'angle droit. */
export function pythagoreanWindmillGeometry({x=0, y=0, small=60, medium=120}={}){
  const A = p(x, y);
  const B = p(x + medium, y);
  const C = p(x, y + small);
  const c = Math.hypot(small, medium);
  const normal = p(small, medium);
  const Bw = add(B, normal);
  const Cw = add(C, normal);
  return {
    A, B, C, Bw, Cw, small, medium, hypotenuse:c,
    smallSquare:[p(x-small,y), A, C, p(x-small,y+small)],
    mediumSquare:[p(x,y-medium),p(x+medium,y-medium),B,A],
    hypSquare:[B,C,Cw,Bw],
    u:p((B.x-C.x)/c,(B.y-C.y)/c),
    v:p((Cw.x-C.x)/c,(Cw.y-C.y)/c)
  };
}

/** Les cinq pièces du Périgal dans les deux carrés de départ. */
export function perigalSourcePieces(geometry){
  const {A,B,C,small:a,medium:b} = geometry;
  const TL=p(A.x,A.y-b), TR=p(B.x,B.y-b), L=p(A.x,A.y-(b-a)), T=p(A.x+(b-a),A.y-b);
  const P=lineIntersection(L,TR,B,T);
  return [
    {key:"yellow",fill:PYTHAGORE_COLORS.yellow,points:[TL,T,P,L]},
    {key:"blue",fill:PYTHAGORE_COLORS.blue,points:[T,TR,P]},
    {key:"gray",fill:PYTHAGORE_COLORS.gray,points:[B,TR,P]},
    {key:"magenta",fill:PYTHAGORE_COLORS.magenta,points:[A,B,P,L]},
    {key:"green",fill:PYTHAGORE_COLORS.green,points:[p(A.x-a,A.y),A,C,p(C.x-a,C.y)]}
  ];
}

/**
 * Solution exacte du Périgal pour le moulin historique a:b = 1:2.
 * Les coordonnées sont exprimées dans le repère orthonormé du carré c².
 */
export function perigalSolvedPieces(geometry){
  const {C,u,v,hypotenuse:c,small,medium} = geometry;
  if(Math.abs(medium - 2*small) > 1e-7){
    throw new Error("La solution Périgal de référence attend le rapport a:b = 1:2.");
  }
  const uv = (du,dv) => add(C,add(scale(u,du*c),scale(v,dv*c)));
  return [
    {key:"gray",fill:PYTHAGORE_COLORS.gray,points:[uv(0,0),uv(.4,0),uv(0,.8)]},
    {key:"magenta",fill:PYTHAGORE_COLORS.magenta,points:[uv(.4,0),uv(1,0),uv(1,.8),uv(.2,.4)]},
    {key:"green",fill:PYTHAGORE_COLORS.green,points:[uv(.2,.4),uv(.6,.6),uv(.4,1),uv(0,.8)]},
    {key:"yellow",fill:PYTHAGORE_COLORS.yellow,points:[uv(.6,.6),uv(1,.8),uv(1,1),uv(.4,1)]},
    {key:"blue",fill:PYTHAGORE_COLORS.blue,points:[uv(0,.8),uv(.4,1),uv(0,1)]}
  ];
}

export function windmillSvg({x=0,y=0,small=60,medium=120,fillAll=true,fillAreas=false,labels=true,strokeWidth=2}={}){
  const g=pythagoreanWindmillGeometry({x,y,small,medium});
  const polygons=[];
  if(fillAll){
    polygons.push(...perigalSourcePieces(g),...perigalSolvedPieces(g));
  }
  const areaMarkup=fillAreas ? [
    {points:g.smallSquare,fill:PYTHAGORE_COLORS.leg1Fill},
    {points:g.mediumSquare,fill:PYTHAGORE_COLORS.leg2Fill},
    {points:g.hypSquare,fill:PYTHAGORE_COLORS.hypFill}
  ].map(area => `<polygon points="${pointsAttr(area.points)}" fill="${area.fill}"/>`).join("") : "";
  const pieceMarkup=polygons.map(piece => `<polygon points="${pointsAttr(piece.points)}" fill="${piece.fill}"/>`).join("");
  const outlines=[g.smallSquare,g.mediumSquare,g.hypSquare].map(points => `<polygon points="${pointsAttr(points)}" fill="none"/>`).join("");
  const triangle=`<polygon points="${pointsAttr([g.A,g.B,g.C])}" fill="#fff"/>`;
  const right=`<path d="M ${round(g.A.x)} ${round(g.A.y+small*.22)} h ${round(small*.22)} v ${round(-small*.22)}" fill="none" stroke="#ef4444"/>`;
  const labelMarkup=labels ? [
    {text:"a²",x:g.A.x-small/2,y:g.A.y+small/2},
    {text:"b²",x:g.A.x+medium/2,y:g.A.y-medium/2},
    {text:"c²",x:(g.B.x+g.Cw.x)/2,y:(g.B.y+g.Cw.y)/2}
  ].map(label => `<text x="${round(label.x)}" y="${round(label.y)}" text-anchor="middle" dominant-baseline="middle">${label.text}</text>`).join("") : "";
  return `<g stroke="${PYTHAGORE_COLORS.outline}" stroke-width="${strokeWidth}" stroke-linejoin="round">${areaMarkup}${pieceMarkup}${outlines}${triangle}${right}<g stroke="none" fill="#172033" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="850">${labelMarkup}</g></g>`;
}

/** Racine française compacte : le radicande commence juste après le crochet. */
export function squareRootSvg({x=0,baseline=20,radicand="25",fontSize=18,color="#334155",fontWeight=750}={}){
  const text=String(radicand);
  const textWidth=Math.max(fontSize*.62,text.length*fontSize*.56);
  const numberX=x+fontSize*.68;
  const barEnd=numberX+textWidth+1;
  const d=`M ${round(x)} ${round(baseline-fontSize*.36)} l ${round(fontSize*.22)} ${round(fontSize*.34)} l ${round(fontSize*.32)} ${round(-fontSize*.82)} H ${round(barEnd)}`;
  return `<g fill="${color}" stroke="${color}"><path d="${d}" fill="none" stroke-width="${round(Math.max(1.8,fontSize*.11))}" stroke-linecap="round" stroke-linejoin="round"/><text x="${round(numberX)}" y="${round(baseline)}" stroke="none" font-family="Segoe UI,Arial,sans-serif" font-size="${fontSize}" font-weight="${fontWeight}">${text}</text></g>`;
}

/** Schéma en barres de Pythagore : rectangles jointifs et seules lettres dans les cases. */
export function pythagoreanBarsSvg({x=0,y=0,width=250,height=30,strokeWidth=2}={}){
  const split=width*9/25;
  const c=PYTHAGORE_COLORS;
  return `<g font-family="Segoe UI,Arial,sans-serif" font-weight="850" text-anchor="middle" dominant-baseline="middle">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${c.hypFill}" stroke="${c.hypStroke}" stroke-width="${strokeWidth}"/>
    <rect x="${x}" y="${y+height}" width="${round(split)}" height="${height}" fill="${c.leg1Fill}" stroke="${c.leg1Stroke}" stroke-width="${strokeWidth}"/>
    <rect x="${round(x+split)}" y="${y+height}" width="${round(width-split)}" height="${height}" fill="${c.leg2Fill}" stroke="${c.leg2Stroke}" stroke-width="${strokeWidth}"/>
    <text x="${x+width/2}" y="${y+height/2}" fill="${c.hypText}">BC²</text>
    <text x="${x+split/2}" y="${y+height*1.5}" fill="${c.leg1Text}">AB²</text>
    <text x="${x+split+(width-split)/2}" y="${y+height*1.5}" fill="${c.leg2Text}">AC²</text>
  </g>`;
}
