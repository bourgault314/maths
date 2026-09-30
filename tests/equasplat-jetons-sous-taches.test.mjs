import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 30/09/2026 (choix de Gwenaël le 29/09) :
   - quand il y a beaucoup de taches, les jetons rapetissent : un jeton ne dépasse jamais
     0,8 fois le rayon des taches du moment ; avec peu de taches rien ne change ;
   - aucun jeton n'est caché : ni sous une tache, ni sous un autre jeton.
   Carte d'origine du défaut : 5𝑛 + 49 + 5 = −6𝑛 + 55 + 57 + 41, puis « +6𝑛 ».
   Les tests de placement EXÉCUTENT les vraies fonctions de la page. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function source(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

const TRAY = {x:840, y:24, w:720, h:512};
function moteur(rayonJeton){
  return Function(`
    const tokenRadius = () => ${rayonJeton};
    ${["tokenAreaForTray", "tokenSplatBite", "tokenClearOfTokens", "unhideTokens"].map(source).join("\n")}
    return { unhideTokens, tokenSplatBite };
  `)();
}

// Grille de taches comme celle de l'écran : 3 colonnes × 2 rangées, rayon 72.
function grille(cols, rangees, r){
  const out = [];
  for(let j = 0; j < rangees; j++){
    for(let i = 0; i < cols; i++) out.push({cx:910 + 580 * (i + .5) / cols, cy:104 + 290 * (j + .5) / rangees, r});
  }
  return out;
}

function aucunJetonCache(tokens, splats, r){
  for(const [i, a] of tokens.entries()){
    for(const b of tokens.slice(i + 1)){
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 2 * r, `jetons ${a.value} et ${b.value} l'un sur l'autre`);
    }
    for(const s of splats){
      assert.ok(Math.hypot(a.x - s.cx, a.y - s.cy) > s.r, `le centre du jeton ${a.value} est sous une tache`);
    }
  }
}

test("deux jetons empilés au même endroit sont séparés (55 caché sous 57)", () => {
  const m = moteur(54);
  const splats = grille(3, 2, 72);
  const tokens = [
    {id:"a", value:55, x:1294.577, y:440},
    {id:"b", value:57, x:1294.584, y:440},
    {id:"c", value:41, x:1101.25, y:440},
  ];
  m.unhideTokens(TRAY, tokens, splats);
  aucunJetonCache(tokens, splats, 54);
});

test("un jeton posé sous une tache en sort ; un jeton bien posé ne bouge pas", () => {
  const m = moteur(38);
  const splats = grille(4, 3, 48);
  const libre = {id:"l", value:5, x:1000, y:480};
  const dessous = {id:"d", value:49, x:splats[5].cx, y:splats[5].cy};
  m.unhideTokens(TRAY, [libre, dessous], splats);
  assert.deepEqual([libre.x, libre.y], [1000, 480], "le jeton libre reste à sa place");
  assert.ok(m.tokenSplatBite(dessous.x, dessous.y, 38, splats, 0) <= 0, "le jeton caché a trouvé une place libre");
});

test("plateau plein : jamais un jeton sur un jeton, et le moins possible sur une tache", () => {
  const m = moteur(54);
  const splats = grille(4, 3, 60);
  const tokens = [55, 57, 41, 12, 30].map((value, k) => ({id:String(k), value, x:1200, y:440}));
  m.unhideTokens(TRAY, tokens, splats);
  aucunJetonCache(tokens, splats, 54);
});

test("la règle de taille : un jeton ne dépasse jamais 0,8 fois le rayon des taches", () => {
  assert.match(html, /const JETON_SOUS_TACHE = 0\.8;/);
  const regle = source("tokenRadius");
  assert.match(regle, /Math\.min\(base, Math\.round\(JETON_SOUS_TACHE \* tacheR\)\)/);
  assert.match(regle, /commonSplatLayoutRadius\(splatAreaFor\(getTrayForSide\("left"\)\)\)/,
    "taille commune aux deux membres, comme les taches");
  assert.match(regle, /piece\.unit/, "les billes unitaires de la réception gardent leur taille");
  // Peu de taches : l'ordinateur (84 → 67) et le téléphone réception (108 → 86) ne touchent pas aux jetons.
  assert.ok(Math.round(0.8 * 84) >= 54 && Math.round(0.8 * 108) >= Math.round(54 * 1.36));
});

test("le chiffre suit son jeton, et les jetons se dessinent par-dessus les taches", () => {
  assert.match(html, /font-size:calc\(50px \* var\(--jetonEchelle, 1\)\);/);
  assert.match(html, /font-size:calc\(60px \* var\(--jetonEchelle, 1\)\);/);
  assert.match(source("drawItem"), /--jetonEchelle/);
  const rendu = source("renderSvg");
  assert.match(rendu, /splatsFirst\(leftItems\)\.forEach/);
  assert.match(rendu, /splatsFirst\(rightItems\)\.forEach/);
  assert.match(source("layoutItems"), /unhideTokens\(tray, tokens,/);
});
