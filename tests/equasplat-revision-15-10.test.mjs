import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

/* ÉquaSplat, « tout revoir » (15/10/2026). Partie 1 : toutes les équations des liens du site
   jouées comme un élève (Playwright, 5 tailles d'écran) ; partie 2 : les points ouverts, tranchés
   par Gwenaël sur planches avant/après (questions à choix du 15/10).
   - le premier geste efface « Il y a la même quantité à gauche qu'à droite. », QUEL QU'IL SOIT :
     un jeton glissé sur un autre (12 sur 9, 13 sur −13), une tache 𝑥 glissée sur −𝑥, « Prendre
     l'opposé » ; la phrase restait, jusque sur l'équation résolue ;
   - glisser un jeton sur un autre près des taches ouvre bien Regrouper (0 fois sur 20 avant) ;
   - aucun bouton allumé au départ (ÉquaSplat par lien, billes comprises, ÉquaSplat du menu, ÉquaBarre) ;
     un simple toucher sans bouton : « Choisis d'abord un bouton. » ; au téléphone, Enlever choisi
     s'allume comme les autres ;
   - plus de petites flèches ▲▼ dans les quatre cases de l'élève (↑ ↓ et la molette n'y font rien) ;
   - des phrases d'élève de 6e pour Regrouper, Décomposer, Partager ;
   - « 0 = 4𝑥 » : « De l'autre côté, il ne reste rien. On peut conclure. » ;
   - Partager propose jusqu'au nombre de taches du plateau (les défis du monde 6 vont à 11) ;
   - le menu du professeur accepte la solution 0 (ÉquaSplat seulement, pas ÉquaBarre) ;
   - Et un pirate ? un lien fabriqué trop lourd ne fige plus la page. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");
const intro = await readFile(new URL("../outils/splat_intro.html", import.meta.url), "utf8");
const barre = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");

function source(nom){
  const debut = html.indexOf(`  function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

test("le premier geste efface la phrase de départ : tout geste qui change le plateau passe par pushHistory", () => {
  assert.match(source("pushHistory"), /history\.push\(clone\(state\)\);\s*dismissInitialEqualityInstruction\(\);/);
  // les gestes qui n'avaient pas de bouton pour effacer la phrase : le glisser (jetons, taches), l'opposé, Conclure
  for(const geste of ["applyFusion", "applySplatFusion", "takeOppositeOfBothMembers", "concludeSolution",
    "applyGroup", "applyZeroXGroup", "deleteMatching", "cancelZeroXPair", "applyTokenSplit", "applySharedTokenSplit",
    "applyAddBoth", "applyAddBothX", "applyUnitPacketChoice", "finalizePendingShare"]){
    assert.match(source(geste), /pushHistory\(\);/, `${geste} passe par pushHistory`);
  }
  // pushHistory ne sert qu'aux gestes de l'élève : jamais au chargement d'une équation
  for(const chargement of ["createImportedEquationState", "restartImportedEquation", "eleveChargerEquation"]){
    assert.doesNotMatch(source(chargement), /pushHistory\(/, chargement);
  }
  // la phrase de départ revient avec « Recommencer », et seulement là
  assert.match(source("restartImportedEquation"), /showInitialEqualityInstruction\(\);/);
});

test("la phrase de départ s'efface vraiment : exécutée avec un faux plateau", () => {
  const ctx = vm.createContext({});
  vm.runInContext(`
    let state = {left:[1]}, history = [], initialEqualityInstructionVisible = true;
    const clone = o => JSON.parse(JSON.stringify(o));
    ${source("dismissInitialEqualityInstruction")}
    ${source("pushHistory")}
    pushHistory();
    globalThis.r = {visible: initialEqualityInstructionVisible, n: history.length};`, ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.r)), {visible: false, n: 1});
});

test("aucun bouton allumé au départ, partout ; toucher une pièce sans bouton le dit", () => {
  assert.match(html, /<button class="toolBtn" id="toolDecompose" type="button">Décomposer<\/button>/);
  assert.doesNotMatch(html, /class="toolBtn active"/);
  assert.match(html, /let actionMode = null;/);
  // par lien (billes comprises), « Recommencer », et le menu du professeur
  assert.match(source("createImportedEquationState"), /setActionMode\(null\);\s*showInitialEqualityInstruction\(\);/);
  assert.match(source("restartImportedEquation"), /setActionMode\(null\);\s*showInitialEqualityInstruction\(\);/);
  assert.doesNotMatch(html, /setActionMode\("decompose"\);\n/);
  assert.equal((html.match(/setActionMode\(null\);\s*showInitialEqualityInstruction\(\);/g) || []).length, 6);
  assert.doesNotMatch(html, /setActionMode\(unitMode \? "delete"/);
  // un simple toucher sans bouton (déplacer, lui, marche toujours : c'est un glisser)
  assert.match(html, /if\(!actionMode\)\{\s*setInstruction\("Choisis d’abord un bouton\."\);\s*return;\s*\}/);
  // au téléphone, Enlever choisi s'allume comme les autres
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) #toolDelete:not\(\.active\)\{/);
  assert.doesNotMatch(html, /body\.importMode \.stage:not\(:fullscreen\) #toolDelete\{/);
  // ÉquaBarre : même règle, même phrase
  assert.match(barre, /<button class="toolBtn" id="toolDecompose" type="button">Décomposer<\/button>/);
  assert.match(barre, /let actionMode = null;/);
  assert.doesNotMatch(barre, /actionMode = "decompose";/);
  assert.match(barre, /if\(!actionMode\)\{\s*setInstruction\("Choisis d’abord un bouton\."\);\s*return;\s*\}/);
});

test("glisser un jeton sur un autre : le jeton visé se cherche là où on l'a lâché, sur sa place dessinée", () => {
  const glisser = source("endTokenDrag");
  assert.match(glisser, /const lache = clampTokenPosition\(tray, ds\.cx, ds\.cy, tokenRadius\(piece\), false\);/);
  assert.match(glisser, /fusionTarget = findFusionCandidate\(ds\.side, ds\.id, lache\.cx, lache\.cy\);/);
  const cherche = source("findFusionCandidate");
  assert.doesNotMatch(cherche, /layoutItems\(/, "plus de mise en place du plateau pendant la mesure");
  // exécutée : 12 lâché à 10 px du 21 → le 21 ; lâché loin → rien
  const ctx = vm.createContext({});
  vm.runInContext(`
    const state = {left:[{id:"a", type:"token", value:12, x:600, y:560}, {id:"b", type:"token", value:21, x:608, y:563},
                         {id:"t", type:"x", sign:1, x:560, y:520}]};
    const activePieces = side => state[side].filter(p => !p.removed);
    const tokenRadius = () => 43;
    ${source("findFusionCandidate")}
    globalThis.r = [findFusionCandidate("left", "a", 598, 568), findFusionCandidate("left", "a", 300, 300)].map(p => p && p.id);`, ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.r)), ["b", null]);
});

test("Partager : les parts vont jusqu'au nombre de taches du plateau quand il dépasse 8", () => {
  const ouvrir = source("openShareDialog");
  assert.match(ouvrir, /const maxParts = Math\.max\(8, tachesDuPlateau\);/);
  assert.match(ouvrir, /for\(let n=2;n<=maxParts;n\+\+\)\{/);
  const parts = (value, taches) => { const max = Math.max(8, taches), c = []; for(let n = 2; n <= max; n++) if(value % n === 0) c.push(n); return c; };
  assert.deepEqual(parts(99, 11), [3, 9, 11]);
  assert.deepEqual(parts(110, 10), [2, 5, 10]);
  assert.deepEqual(parts(21, 3), [3, 7], "21 en 7 parts reste possible face à 3 taches");
});

test("le menu du professeur accepte la solution 0 (ÉquaSplat) ; ÉquaBarre n'en parle pas", () => {
  assert.ok(!html.includes("la solution 0 n’est pas prise en charge"));
  assert.doesNotMatch(source("parseEquationInputToModel"), /x === 0/);
  assert.ok(!barre.includes("la solution 0 n’est pas prise en charge"), "ÉquaBarre n'avait pas ce refus, et n'en reçoit pas");
});

test("pas de petites flèches ▲▼ dans les quatre cases de l'élève, ni ↑ ↓ ni molette", () => {
  for(const id of ["groupInput", "sharePartInput", "fusionInput", "addBothInput"]){
    assert.match(html, new RegExp(`#${id}::-webkit-inner-spin-button`), id);
    assert.match(html, new RegExp(`#${id}[^{]*\\{-moz-appearance:textfield;appearance:textfield\\}|#${id}, [^{]*\\{-moz-appearance:textfield`), id);
  }
  assert.match(html, /\[groupInput, sharePartInput, fusionInput, addBothInput\]\.forEach\(bloquerFlechesNombre\);/);
  const bloquer = source("bloquerFlechesNombre");
  assert.match(bloquer, /event\.key === "ArrowUp" \|\| event\.key === "ArrowDown"\) event\.preventDefault\(\)/);
  assert.match(bloquer, /addEventListener\("wheel"[\s\S]*?\{passive:false\}\)/);
  // les cases du menu du professeur gardent leurs flèches
  assert.doesNotMatch(html, /#coefA::-webkit-inner-spin-button|#constB::-webkit-inner-spin-button/);
});

test("Regrouper : la phrase dit ce qu'il reste à toucher (exécutée)", () => {
  const ctx = vm.createContext({});
  vm.runInContext(`
    const unknownHtml = () => "𝑥";
    const xSign = p => p.sign === -1 ? -1 : 1;
    ${source("groupHint")}
    const t = (...pieces) => groupHint(pieces.map(piece => ({piece})));
    globalThis.r = [
      t({type:"token", value:12}),
      t({type:"x", sign:1}),
      t({type:"x", sign:-1}),
      t({type:"x", sign:1}, {type:"x", sign:1}),
      t({type:"x", sign:1}, {type:"x", sign:1}, {type:"x", sign:-1})
    ];`, ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.r)), [
    "Touche un autre jeton du même côté.",
    "Touche une tache −𝑥 du même côté.",
    "Touche une tache 𝑥 du même côté.",
    "Touche une tache −𝑥 du même côté.",
    "Touche une tache −𝑥 du même côté."
  ]);
  const actions = source("renderActions");
  assert.match(actions, /setInstruction\(groupHint\(selected\)\);/);
  for(const ancienne of ["éléments compatibles", "Regroupe seulement des éléments du même côté", "Ne mélange pas jetons numériques et taches",
    "doivent être activées", "Sélectionne plusieurs jetons numériques"]){
    assert.ok(!html.includes(ancienne), `plus de « ${ancienne} »`);
  }
});

test("« 0 = 4𝑥 » : la phrase dit qu'il ne reste rien en face, et le 0 qui s'efface ne l'écrase plus", () => {
  assert.match(source("renderActions"), /Number\(conclusionInfo\.value\) === 0\s*\? "De l’autre côté, il ne reste rien\. On peut conclure\."/);
  assert.match(source("removeTransientZero"), /if\(!getConclusionInfo\(\)\) setInstruction\("La paire nulle vaut 0 : elle disparaît du plateau\."\);/);
});

test("Et un pirate ? un lien trop lourd est refusé au lieu de figer la page", () => {
  assert.match(html, /const IMPORT_MAX_OBJETS = 80, IMPORT_MAX_SERIE = 100;/);
  assert.match(source("normalizeImportedSide"), /arr\.length > IMPORT_MAX_OBJETS\) return \[\];/);
  assert.match(source("createImportedEquationState"), /leftPieces\.length \+ rightPieces\.length > IMPORT_MAX_OBJETS\) return false;/);
  assert.match(source("tryImportFromUrl"), /payload\.serie\.length <= IMPORT_MAX_SERIE/);
  // exécutée : 3 000 jetons ou 300 jetons de 80 en billes ne passent pas, les liens du site si
  const ctx = vm.createContext({});
  vm.runInContext(`
    let n = 0;
    const makeToken = (v, o) => ({type:"token", value:v, unit:!!(o && o.unit), id:n++});
    const makeX = s => ({type:"x", sign:s});
    const IMPORT_MAX_OBJETS = 80;
    ${source("normalizeImportedPiece")}
    ${source("normalizeImportedSide")}
    globalThis.r = [
      normalizeImportedSide(Array(3000).fill(1)).length,
      normalizeImportedSide(Array(300).fill(80), {unitMode:true}).length,
      normalizeImportedSide([80, 80, 80, 80], {unitMode:true}).length <= 160,
      normalizeImportedSide(["x", "x", "x", 12, 9]).length,
      normalizeImportedSide([28], {unitMode:true}).length
    ];`, ctx);
  // (au-delà de 80 billes, la boucle s'arrête ; createImportedEquationState refuse le total)
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.r)), [0, 0, true, 5, 28]);
});

test("les films d'ÉquaSplat disent les phrases de l'outil, mot pour mot, et n'allument rien au départ", () => {
  const phrases = bloc => [...bloc.matchAll(/\[(?:0|T\.\w+|TA\[\d\]),'([^']+)'/g)].map(m => m[1]);
  for(const nom of ["FILMS.equasplat=", "FILMS['equasplat-jetons']="]){
    const debut = intro.indexOf(nom);
    const c = intro.indexOf("const CONSIGNES", debut);
    const liste = phrases(intro.slice(c, intro.indexOf("];", c)));
    assert.ok(liste.length >= 6, nom);
    for(const p of liste){
      // les nombres viennent de l'exemple (« Jetons regroupés : 35. », « 2 jetons sélectionnés… ») : on cherche le reste
      const reste = p.replace(/\s*:\s*\d+\.$/, "").replace(/^\d+ /, "").replace(/^Il reste \d+ taches et \d+ jetons : /, "");
      const texteOutil = html.replace(/<\/?strong>/g, "").replace(/&nbsp;/g, " ");
      assert.ok(texteOutil.includes(reste), `« ${p} » (${nom}) est une phrase de l'outil`);
    }
  }
  for(const ancienne of ["éléments compatibles", "jetons numériques d’un même côté", "Décompose un jeton numérique", "Partage un jeton en parts égales"]){
    assert.ok(!intro.includes(ancienne), `plus de « ${ancienne} » dans les films`);
  }
  // jetons numérotés : rien d'allumé au départ de chaque équation
  assert.match(intro, /const actif=t<T\.modeG\?null:t<T\.modeD\?'gro':t<T\.modeE\?'dec':t<T\.b\?'enl':t<T\.modeP\?null:'par';/);
  // jetons numérotés : « Enlever » choisi s'allume aussi au téléphone (plus de « if(!port) »)
  assert.doesNotMatch(intro, /if\(!port\)\{const b=o\.rangs\.enl/);
  // billes (le doigt touche « Enlever » depuis #998) : Enlever n'est plus bleu au repos ; il s'allume quand le doigt
  // le touche (modeE) jusqu'à l'équation suivante, et « Partager » (ex-« Faire des paquets ») le temps de la fenêtre
  const billes = intro.slice(intro.indexOf("FILMS.equasplat="), intro.indexOf("FILMS['equasplat-jetons']="));
  assert.match(billes, /D\.touche\(T\.modeE,o\.rangs\.enl\.c\);/);
  assert.match(billes, /const st=\{enl:port\?\{fond:'#fff7ed'[^}]*\}:\{fond:'#ffffff'/);
  assert.match(billes, /allume\(o\.rangs\.enl,t>=T\.modeE&&t<T\.b\);allume\(o\.fp,t>=T\.fp&&t<T\.groupes\);/);
});

test("Partager (petits jetons, ex-« Faire des paquets ») ne fait pas rétrécir le plateau, et c'est lui qui s'allume (15/10 puis 23/10)", () => {
  // une rangée de boutons ne grandit pas la zone des boutons (sa marge de .btnrow) ; depuis le 23/10/2026, il n'y a plus
  // de rangée « 2 paquets de 3 » du tout : tout se passe dans la fenêtre Partager
  assert.match(html, /\.actionZone > \.btnrow\{margin-top:0\}/);
  assert.doesNotMatch(source("renderActions"), /unitPacketChoice|paquet\$\{|\.choices/);
  // le bouton touché s'allume le temps de la fenêtre, et s'éteint si on la ferme sans partager
  assert.match(source("applyUnitShareTokens"), /setActionMode\("unitShare"\);\s*openUnitShareDialog\(situation\);/);
  assert.match(html, /shareDialog\.addEventListener\("close", \(\) => \{\s*pendingShare = null;[\s\S]{0,200}?if\(actionMode === "unitShare"\) setActionMode\(null\);/);
  assert.doesNotMatch(source("applyUnitShareTokens"), /actionMode = "unitShare"/);
  // le choix fait : retour au mode de départ, « aucun bouton » (Enlever ne s'allume plus tout seul)
  assert.match(source("applyUnitPacketChoice"), /setActionMode\(null\);/);
  assert.doesNotMatch(source("applyUnitPacketChoice"), /actionMode = "delete"|setActionMode\("delete"\)/);
  assert.match(source("setActionMode"), /if\(mode === "unitShare" && toolShareUnits\) toolShareUnits\.classList\.add\("active"\);/);
});
