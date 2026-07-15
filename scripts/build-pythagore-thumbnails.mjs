import {writeFile} from "node:fs/promises";
import {
  PYTHAGORE_COLORS as C,
  windmillSvg,
  squareRootSvg,
  pythagoreanBarsSvg
} from "../studio/components/pythagore/visuals.js";

const root = new URL("../", import.meta.url);

const moulin = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" role="img" aria-label="Moulin de Pythagore : les trois carrés remplis avec les pièces de Périgal">
  <rect width="720" height="320" fill="#fff"/>
  <g transform="translate(10 5)">
    ${windmillSvg({x:102,y:108,small:52,medium:104,fillAll:true,labels:false,strokeWidth:2.2})}
  </g>
  <g font-family="Segoe UI,Arial,sans-serif" text-anchor="middle">
    <text x="525" y="105" fill="#063f86" font-size="25" font-weight="800">Moulin de Pythagore</text>
    <text x="525" y="185" fill="#111827" font-size="48" font-weight="850">a² + b² = c²</text>
    <text x="525" y="232" fill="#64748b" font-size="20" font-weight="700">Périgal · 5 pièces</text>
  </g>
</svg>`;

const colored = (text,color) => `<tspan fill="${color}">${text}</tspan>`;
const pythabarre = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" role="img" aria-label="PythaBarre : triangle, rédaction colorée, moulin et schéma en barres">
  <rect width="720" height="320" fill="#fff"/>

  <g transform="translate(-13 2)" font-family="Segoe UI,Arial,sans-serif">
    <path d="M322 74V14L422 74Z" fill="#f8fbff" stroke="#2563eb" stroke-width="3" stroke-linejoin="round"/>
    <path d="M322 58h16v16h-16" fill="none" stroke="#ef4444" stroke-width="2.5"/>
    <g fill="#063f86" font-size="17" font-weight="850"><text x="302" y="82">A</text><text x="302" y="18">B</text><text x="429" y="82">C</text></g>
    <g fill="#334155" font-size="13" font-weight="800"><text x="278" y="48">3 cm</text><text x="360" y="92">4 cm</text><text x="381" y="36" fill="#f58220">?</text></g>
  </g>

  <text x="360" y="116" text-anchor="middle" fill="#063f86" font-family="Segoe UI,Arial,sans-serif" font-size="25" font-weight="900">PythaBarre</text>

  <g font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="760">
    <text x="24" y="112" fill="#063f86" font-size="16" font-weight="850">Résolution</text>
    <text x="28" y="134">${colored("BC²",C.hypText)}</text><text x="68" y="134" fill="#334155">=</text><text x="86" y="134">${colored("AB²",C.leg1Text)}<tspan fill="#334155"> + </tspan>${colored("AC²",C.leg2Text)}</text>
    <text x="28" y="155">${colored("BC²",C.hypText)}</text><text x="68" y="155" fill="#334155">=</text><text x="86" y="155">${colored("3²",C.leg1Text)}<tspan fill="#334155"> + </tspan>${colored("4²",C.leg2Text)}</text>
    <text x="28" y="176">${colored("BC²",C.hypText)}</text><text x="68" y="176" fill="#334155">=</text><text x="86" y="176">${colored("9",C.leg1Text)}<tspan fill="#334155"> + </tspan>${colored("16",C.leg2Text)}</text>
    <text x="28" y="197" fill="#111827">BC²</text><text x="68" y="197" fill="#111827">=</text><text x="86" y="197" fill="#111827">25</text>
    <text x="28" y="218" fill="#111827">BC</text><text x="68" y="218" fill="#111827">=</text>
    ${squareRootSvg({x:86,baseline:218,radicand:"25",fontSize:18,color:"#111827",fontWeight:760})}
    <text x="129" y="218" fill="#111827">=</text><text x="147" y="218" fill="#111827">5 cm</text>
  </g>

  <g transform="translate(435 60)">
    ${windmillSvg({x:58,y:88,small:45,medium:60,fillAll:false,fillAreas:true,labels:false,strokeWidth:2.2})}
    <g font-family="Segoe UI,Arial,sans-serif" font-size="16" font-weight="850" text-anchor="middle" dominant-baseline="middle">
      <text x="35.5" y="110.5">9</text><text x="88" y="58">16</text><text x="110.5" y="140.5">25</text>
    </g>
  </g>

  <g transform="translate(235 248)">
    ${pythagoreanBarsSvg({x:0,y:0,width:250,height:29,strokeWidth:2,labelFontSize:16})}
  </g>
</svg>`;

await writeFile(new URL("assets/img/thumbnails/moulin-pythagore-capture.svg",root),moulin+"\n");
await writeFile(new URL("assets/img/thumbnails/pythabarre-capture.svg",root),pythabarre+"\n");
