import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

/* ÉquaSplat, 18/10/2026 (essai de Gwenaël sur sa Surface tactile, choix par questions) :
   - le bouton d'action du pavé (« Décomposer » perdait son « r ») est seul sur sa ligne, sous
     Effacer et ⌫ ;
   - Décomposer et Partager montrent le jeton dessiné, avec sa couleur du plateau, à la place de
     la phrase grise ; une erreur de Décomposer s'écrit sous le jeton ;
   - la case de Décomposer écrit la somme comme sur papier : « −2 + (−1) » (pavé et clavier) ;
     un seul nombre au pavé prend le vrai signe moins (« −7 ») ;
   - « Ajouter des deux côtés » sans les taches : le pavé à droite sur écran tactile large ;
   - le film « jetons numérotés » redessine les fenêtres comme l'outil. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");
const intro = await readFile(new URL("../outils/splat_intro.html", import.meta.url), "utf8");

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

function contexte(extra = ""){
  const ctx = vm.createContext({});
  vm.runInContext(`
    ${source("formatSignedNumber")}
    ${source("positiveTokenColorForValue")}
    ${source("parseSum")}
    ${source("sommeBrute")}
    ${source("sommeCommeSurPapier")}
    ${source("jetonDialogueHtml")}
    ${source("setTouchInputValue")}
    ${source("insertTouchKey")}
    class Event { constructor(type){ this.type = type; } }
    let relatif = false;
    function isRelativeUniverse(){ return relatif; }
    let touchKeypadOptions = null;
    const touchKeypad = { classList: { remove(){} } };
    const touchKeypadInput = { value: "", dispatchEvent(){}, setSelectionRange(){} };
    ${extra}
    globalThis.api = {
      parseSum, sommeBrute, sommeCommeSurPapier, jetonDialogueHtml, insertTouchKey,
      relatif: v => { relatif = v; },
      options: o => { touchKeypadOptions = o; },
      champ: touchKeypadInput
    };`, ctx);
  return ctx.api;
}

const api = contexte();
const lire = v => JSON.parse(JSON.stringify(v));

test("la somme s'écrit comme sur papier : signe moins, espaces, parenthèses qui se ferment seules", () => {
  const cas = {
    "-2+-1": "−2 + (−1)",
    "-2+-": "−2 + (−",
    "-1-1": "−1 − 1",
    "9+7": "9 + 7",
    "21+14": "21 + 14",
    "-2+-1+5": "−2 + (−1) + 5",
    "-3--6": "−3 − (−6)",
    "12-3+-4": "12 − 3 + (−4)",
    "-": "−",
    "": ""
  };
  for(const [brut, attendu] of Object.entries(cas)) assert.equal(api.sommeCommeSurPapier(brut), attendu, brut);
});

test("la mise en forme ne change jamais la somme lue (2 000 écritures tirées au hasard)", () => {
  let graine = 18102026;
  const hasard = n => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine % n; };
  const signes = "0123456789+-";
  for(let k = 0; k < 2000; k++){
    let brut = "";
    for(let i = 0, n = 1 + hasard(9); i < n; i++) brut += signes[hasard(signes.length)];
    const ecrit = api.sommeCommeSurPapier(brut);
    assert.equal(api.sommeBrute(ecrit), brut, `retour à l'écriture tapée : ${brut}`);
    assert.deepEqual(lire(api.parseSum(ecrit)), lire(api.parseSum(brut)), `même somme lue : ${brut} / ${ecrit}`);
  }
});

test("au pavé, Décomposer tape au bout et ⌫ retire ce qui a été tapé, pas une parenthèse", () => {
  const a = contexte();
  a.options({ expression: true, allowMinus: true });
  const touches = ["−", "2", "+", "−", "1"];
  touches.forEach(t => a.insertTouchKey(t));
  assert.equal(a.champ.value, "−2 + (−1)");
  a.insertTouchKey("backspace");
  assert.equal(a.champ.value, "−2 + (−");
  a.insertTouchKey("backspace");
  assert.equal(a.champ.value, "−2 + ");
  a.insertTouchKey("backspace");
  assert.equal(a.champ.value, "−2");
  a.insertTouchKey("clear");
  assert.equal(a.champ.value, "");
});

test("au pavé, un seul nombre prend le vrai signe moins, et Ajouter le lit", () => {
  const a = contexte();
  a.options({ allowMinus: true });
  a.insertTouchKey("7");
  a.insertTouchKey("−");
  assert.equal(a.champ.value, "−7");
  a.insertTouchKey("−");
  assert.equal(a.champ.value, "7");
  a.champ.value = "-7";
  a.insertTouchKey("−");
  assert.equal(a.champ.value, "7", "un ancien trait d'union s'enlève aussi");
  assert.match(source("applyAddBoth"), /Number\(String\(addBothInput\.value \|\| ""\)\.trim\(\)\.replace\(\/−\/g, "-"\)\)/);
  for(const lecteur of ["applyGroup", "applyShareInput", "applyFusion"]){
    assert.match(source(lecteur), /replace\(\/−\/g, "-"\)/, `${lecteur} lit « −7 »`);
  }
});

test("au clavier de l'ordinateur, la case de Décomposer s'écrit pareil, sans toucher au pavé", () => {
  assert.match(html, /decomposeInput\.addEventListener\("beforeinput", event => \{\s*if\(usesTouchKeypad\(\) \|\| event\.inputType !== "deleteContentBackward" \|\| !decomposeAuBout\(\)\) return;/);
  assert.match(html, /decomposeInput\.addEventListener\("input", \(\) => \{\s*if\(usesTouchKeypad\(\) \|\| !decomposeAuBout\(\)\) return;/);
  assert.match(html, /if\(!\/\^\[0-9\+-\]\*\$\/\.test\(brut\)\) return;/, "une écriture avec une lettre reste telle quelle");
});

test("le jeton dessiné : la couleur du plateau, le nombre, rien d'autre", () => {
  const a = contexte();
  const pos = a.jetonDialogueHtml({ value: 16 });
  assert.match(pos, /<svg class="dialogJeton"[^>]*aria-label="le jeton 16"/);
  assert.match(pos, /class="tokenCircle positive" style="fill:hsla\(232, 78%, 54%, \.20\);stroke:hsla\(232, 78%, 45%, \.62\)"/);
  assert.match(pos, /font-size="30">16<\/text>/);
  a.relatif(true);
  assert.match(a.jetonDialogueHtml({ value: -3 }), /class="tokenCircle negative"[^>]*>.*>−3<\/text>/);
  assert.match(a.jetonDialogueHtml({ value: 4 }), /class="tokenCircle positive relativePositive"/);
  assert.match(a.jetonDialogueHtml({ value: -99 }), /font-size="25">−99</);
  /* Et un pirate ? La valeur passe par Number : rien de ce qu'un lien glisse ne s'écrit en HTML. */
  const piege = a.jetonDialogueHtml({ value: "<img src=x onerror=alert(1)>" });
  assert.doesNotMatch(piege, /<img/);
  assert.match(piege, />0<\/text>/);
});

test("Décomposer et Partager montrent le jeton ; une erreur s'écrit dessous, le jeton reste", () => {
  assert.match(source("openDecomposeDialog"), /dialogText\.innerHTML = jetonDialogueHtml\(piece\);/);
  const appliquer = source("applyDecomposeInput");
  assert.doesNotMatch(appliquer, /dialogText\.innerHTML/, "plus de message qui efface le jeton");
  assert.equal((appliquer.match(/decomposeMessage\(piece, /g) || []).length, 4);
  assert.match(source("decomposeMessage"), /jetonDialogueHtml\(piece\) \+ `<span class="dialogMessage">\$\{html\}<\/span>`/);
  assert.match(source("openShareDialog"), /shareDialogText\.innerHTML = jetonDialogueHtml\(piece\);/);
  // le jeton reste dessiné quand on choisit le nombre de parts ; avec les petits jetons du monde 5, c'est le groupe (23/10/2026)
  assert.match(source("chooseShareCount"), /shareDialogText\.innerHTML = pendingShare\.unit \? groupeJetonsDialogueHtml\(pendingShare\.value\) : jetonDialogueHtml\(pendingShare\.piece\);/);
  assert.doesNotMatch(html, /Décomposer le jeton <strong>|Partager le jeton <strong>/, "plus de phrase grise");
});

test("le pavé : six colonnes, le bouton d'action seul sur sa ligne", () => {
  assert.match(html, /\.touchKeypad\{\s*display:none;\s*width:min\(330px,100%\);\s*margin:12px auto 4px;\s*grid-template-columns:repeat\(6,minmax\(0,1fr\)\);/);
  assert.match(html, /\.touchKeypad > \.touchKeypadKey,\s*\.touchKeypad > \.touchKeypadSpacer\{\s*grid-column:span 2;\s*\}/);
  assert.match(html, /\.touchKeypad > \.touchKeypadKey\.action\{\s*grid-column:span 3;\s*\}/);
  assert.match(html, /\.touchKeypad > \.touchKeypadKey\.validate\{\s*grid-column:1 \/ -1;\s*font-size:18px;\s*\}/);
  assert.match(source("renderTouchKeypad"), /\[options\.submitLabel \|\| "Valider","submit","action validate"\]\s*\];/, "le bouton d'action reste la dernière touche");
  assert.match(html, /@media \(max-width:700px\) and \(max-height:720px\)\{\s*\.touchKeypad\{\s*gap:5px;\s*\}\s*\.touchKeypadKey,\s*\.touchKeypadSpacer\{\s*min-height:38px;/);
});

test("Ajouter sans les taches : le pavé à droite sur écran tactile large", () => {
  const bloc = html.slice(html.indexOf("#addBothDialog.touchKeypadActive:not(.deuxParties){"));
  assert.match(bloc, /^#addBothDialog\.touchKeypadActive:not\(\.deuxParties\)\{\s*width:min\(840px, calc\(100vw - 40px\)\);/);
  assert.match(bloc, /#addBothDialog\.touchKeypadActive:not\(\.deuxParties\) \.dialogInner\{\s*position:relative;\s*padding:34px calc\(300px \+ 70px\) 32px 38px;/);
  assert.match(bloc, /#addBothDialog\.touchKeypadActive:not\(\.deuxParties\) \.touchKeypad\.open\{\s*position:absolute;\s*right:38px;/);
  const media = html.lastIndexOf("@media", html.indexOf("#addBothDialog.touchKeypadActive:not(.deuxParties){"));
  assert.match(html.slice(media, media + 40), /^@media screen and \(min-width:860px\)\{/);
});

test("le film « jetons numérotés » dessine les fenêtres comme l'outil", () => {
  const debut = intro.indexOf("const DLG={"), fin = intro.indexOf("\n};", debut);
  const DLG = vm.runInNewContext(`(${intro.slice(debut + "const DLG=".length, fin + 2)})`, { C: { encre: "#0f172a" } });
  for(const mode of ["paysage", "portrait"]){
    for(const nom of ["D", "P1", "P2"]){
      const el = DLG[mode][nom].el;
      assert.ok(!el.some(e => e[0] === "texteB"), `${mode} ${nom} : plus de phrase grise`);
      const jeton = el.find(e => e[0] === "jeton");
      assert.ok(jeton, `${mode} ${nom} : le jeton dessiné`);
      assert.equal(jeton[1], nom === "D" ? 35 : 21);
    }
    for(const [nom, f] of Object.entries(DLG[mode])){
      const pave = f.el.find(e => e[0] === "pave");
      if(!pave) continue;
      const [, x, y, w, h, px, py] = pave;
      const annuler = f.el.find(e => e[0] === "btn" && e[1] === "Annuler");
      assert.ok(annuler[3] >= y + 5 * py + h, `${mode} ${nom} : Annuler sous le bouton d'action`);
      assert.ok(f.h >= annuler[3] + annuler[5], `${mode} ${nom} : la fenêtre contient Annuler`);
    }
  }
  assert.match(intro, /const ok=btn\(lab,x,y\+5\*py,W,h,18,'bleuClair'\);res\.ok=ok\.c;res\.okR=ok\.R;/, "le bouton d'action du pavé, seul sur sa ligne");
});

/* 23/10/2026 : le film des billes (petits jetons bleus du monde 5) ouvre lui aussi la fenêtre Partager équitablement de
   l'outil (plus de « Faire des paquets ») ; fenetre() est passée dans l'écran commun (Q.fenetre). */
test("le film des billes dessine la fenêtre Partager comme l'outil : le groupe de 9 jetons, 3 parts, 9 parts", () => {
  const debut = intro.indexOf("const DLG_PARTAGE={"), fin = intro.indexOf("\n};", debut);
  assert.ok(debut > 0 && debut < intro.indexOf("FILMS['equasplat-jetons']="), "dans le bloc du film des billes");
  const DLG = vm.runInNewContext(`(${intro.slice(debut + "const DLG_PARTAGE=".length, fin + 2)})`, {});
  for(const mode of ["paysage", "portrait"]){
    for(const nom of ["P1", "P2"]){
      const f = DLG[mode][nom], el = f.el;
      assert.equal(JSON.stringify(el.find(e => e[0] === "groupe").slice(0, 2)), '["groupe",9]', `${mode} ${nom} : les 9 jetons dessinés`);
      assert.ok(!el.some(e => e[0] === "jeton"), `${mode} ${nom} : pas de jeton numéroté`);
      assert.equal(JSON.stringify(el.filter(e => e[0] === "puce").map(e => e[1])), '["3 parts","9 parts"]', `${mode} ${nom} : toutes les parts entières`);
      const annuler = el.find(e => e[0] === "btn" && e[1] === "Annuler");
      assert.ok(f.h >= annuler[3] + annuler[5], `${mode} ${nom} : la fenêtre contient Annuler`);
      const pave = el.find(e => e[0] === "pave");
      if(pave){const [, , y, , h, , py] = pave; assert.ok(annuler[3] >= y + 5 * py + h, `${mode} ${nom} : Annuler sous le bouton d'action`);}
    }
  }
  // l'outil dessine le même groupe : un pas de 34, des ronds de 13, cinq par rangée pour 9
  assert.match(html, /const cols = n <= 6 \? n : Math\.ceil\(Math\.sqrt\(n \* 2\)\);/);
  assert.match(html, /const pas = 34, r = 13, marge = 3;/);
  assert.match(intro, /const n=el\[1\],cols=n<=6\?n:Math\.ceil\(Math\.sqrt\(n\*2\)\),rows=Math\.ceil\(n\/cols\),pas=34;/);
  assert.match(intro, /const fenetre=Q\.fenetre;/);
});
