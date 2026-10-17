import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

/* ÉquaSplat, la saisie « Créer une équation » (lot C du plan de l'audit SPLAT! du 17/10/2026).
   Rejoué dans le navigateur sur le main b0f455e :
   - « 1 × 2x = 12 » devenait 12x = 12, « 0 × 2x = 2 » 2x = 2, « x2 = 12 » 2x = 12 (chiffres recollés) ;
   - « 2 × 3x », « 2x × 3 », « 2x3 » étaient lus 23x : refusés avec « trop de taches », message faux ;
   - « 2,5x » était refusé avec « sommes simples » ;
   - en Splat positif, seuls les TOTAUX étaient contrôlés : « x − 2 + 3 = 5 » posait un jeton −2 et
     « 3x − x = 8 » une tache −x violette, le menu restant sur « Splat positif » ; en Splat relatif sans
     taches opposées, « 3x − x = 8 » posait aussi une tache −x.
   Choix de Gwenaël (questions à choix du 17/10) : les produits sont refusés (« Simplifie ton écriture :
   un seul nombre devant la lettre. ») ; les nombres à virgule aussi (« On n’accepte que les entiers. ») ;
   une équation du monde relatif tapée en Splat positif fait passer ÉquaSplat en Splat relatif tout
   seul (et allume les taches opposées pour −x), comme un lien #data=, sans phrase en plus.
   Ces tests EXÉCUTENT les vraies fonctions de la page. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

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

function constante(nom){
  const m = html.match(new RegExp(`  const ${nom} = ("[^"\\n]*");`));
  assert.ok(m, `la constante ${nom} doit exister`);
  return `const ${nom} = ${m[1]};`;
}

const UN_NOMBRE = "Simplifie ton écriture : un seul nombre devant la\u00a0lettre.";
const ENTIERS = "On n’accepte que les entiers.";

/* La saisie, sans aucun menu : isRelativeUniverse et oppositeXEnabled n'existent pas dans ce
   contexte — l'appel planterait si la fonction lisait encore les menus. */
const CODE = [constante("SAISIE_UN_NOMBRE"), constante("SAISIE_ENTIERS"),
  ...["normalizeMathLetters", "toMathItalicLetter", "parseEquationSideForSplat",
      "inferModeFromParsedEquation", "parseEquationInputToModel"].map(source)].join("\n");

function saisir(equation){
  const ctx = vm.createContext({});
  vm.runInContext(`${CODE}
    try{ globalThis.r = {ok:true, m:parseEquationInputToModel(${JSON.stringify(equation)})}; }
    catch(e){ globalThis.r = {ok:false, message:e.message}; }`, ctx);
  return JSON.parse(JSON.stringify(ctx.r));
}
const pieces = cote => cote.pieces.map(p => p.type === "x" ? `${p.coef}x` : String(p.value));

test("les mots de Gwenaël sont ceux de la page", () => {
  assert.match(html, /const SAISIE_UN_NOMBRE = "Simplifie ton écriture : un seul nombre devant la\\u00a0lettre\.";/);
  assert.match(html, /const SAISIE_ENTIERS = "On n’accepte que les entiers\.";/);
});

test("ce qui marchait marche toujours, à l'identique", () => {
  const cas = {
    "2x+4=18": [["2x", "4"], ["18"], 7, false],
    "3x=x+20": [["3x"], ["1x", "20"], 10, false],
    "3 + 2x + 4 = 18 + x": [["3", "2x", "4"], ["18", "1x"], 11, false],
    "2𝑥 + 4 = 18": [["2x", "4"], ["18"], 7, false],
    "2 × x = 12": [["2x"], ["12"], 6, false],
    "2·x = 12": [["2x"], ["12"], 6, false],
    "x × 2 = 12": [["2x"], ["12"], 6, false],
    "7 + x = 20": [["7", "1x"], ["20"], 13, false],
    "5n = 45": [["5x"], ["45"], 9, false]
  };
  for(const [eq, [g, d, x, relatif]] of Object.entries(cas)){
    const r = saisir(eq);
    assert.ok(r.ok, `${eq} : ${r.message}`);
    assert.deepEqual([pieces(r.m.left), pieces(r.m.right), r.m.x, r.m.besoin.relatif], [g, d, x, relatif], eq);
  }
  assert.equal(saisir("5n = 45").m.variable, "𝑛");
});

test("plus de chiffres recollés : un produit devant la lettre est refusé, avec le message de Gwenaël", () => {
  for(const eq of ["1×2x=12", "0×2x=2", "2×3x=12", "2x×3=12", "2 · 3x = 12", "1*2x = 12", "2×x×3=12",
                   "x2=12", "2x3=12", "x + 4 = 3x2", "×x = 4"]){
    const r = saisir(eq);
    assert.equal(r.ok, false, `${eq} ne doit pas être construit (${r.ok ? JSON.stringify(r.m.left) : ""})`);
    assert.equal(r.message, UN_NOMBRE, eq);
  }
  // un produit de nombres seuls garde sa phrase d'aujourd'hui
  assert.equal(saisir("3×4+x=20").message, "Produit numérique inutile du côté de gauche. Écris directement le résultat.");
  // 23x écrit d'un bloc : c'est bien 23 taches, refusé pour la lisibilité
  assert.equal(saisir("23x=46").message, "Cette équation crée trop de taches pour rester lisible.");
});

test("un nombre à virgule (ou à point) est refusé avec « On n’accepte que les entiers. »", () => {
  for(const eq of ["2,5x=10", "2.5x=10", "x+2,5=10", "x = 0,5 + 3", "x + 4 = 9.0", ",5x = 2"]){
    assert.equal(saisir(eq).message, ENTIERS, eq);
  }
  // les autres écritures interdites gardent leur phrase
  for(const eq of ["2(x+1)=8", "x/2=4", "x;2 = 4"]){
    assert.equal(saisir(eq).message, "Utilise seulement des sommes simples : par exemple 2x + 4 = 18.", eq);
  }
});

test("l'équation dit son monde : un jeton négatif, une tache −x ou une solution négative demandent Splat relatif", () => {
  const cas = {
    "x−2+3=5": {relatif:true, opposees:false, g:["1x", "-2", "3"], d:["5"]},
    "x + 5 = 9 − 2": {relatif:true, opposees:false, g:["1x", "5"], d:["9", "-2"]},
    "−2 + x + 5 = 7": {relatif:true, opposees:false, g:["-2", "1x", "5"], d:["7"]},
    "x + 9 = 5": {relatif:true, opposees:false, g:["1x", "9"], d:["5"]},
    "3x−x=8": {relatif:true, opposees:true, g:["3x", "-1x"], d:["8"]},
    "−x + 6 = −3": {relatif:true, opposees:true, g:["-1x", "6"], d:["-3"]},
    "2x − 7 = −x + 8": {relatif:true, opposees:true, g:["2x", "-7"], d:["-1x", "8"]},
    "x − 0 = 5": {relatif:false, opposees:false, g:["1x"], d:["5"]},
    "4x = 13 − 13": {relatif:true, opposees:false, g:["4x"], d:["13", "-13"]}
  };
  for(const [eq, c] of Object.entries(cas)){
    const r = saisir(eq);
    assert.ok(r.ok, `${eq} : ${r.message}`);
    // l'équation est construite comme elle est écrite : rien n'est simplifié à sa place
    assert.deepEqual({relatif:r.m.besoin.relatif, opposees:r.m.besoin.opposees, g:pieces(r.m.left), d:pieces(r.m.right)}, c, eq);
  }
  // en Splat positif, plus aucune pièce négative ne peut passer sans demander Splat relatif
  for(const eq of Object.keys(cas)){
    const r = saisir(eq);
    const negatif = r.m.left.pieces.concat(r.m.right.pieces).some(p => (p.type === "x" ? p.coef : p.value) < 0);
    if(negatif) assert.equal(r.m.besoin.relatif, true, eq);
  }
});

test("les taches se comptent une par une : « 10x − 9x » en pose 19", () => {
  assert.equal(saisir("10x − 9x = 5").message, "Cette équation crée trop de taches pour rester lisible.");
  assert.ok(saisir("9x − x = 16").ok, "10 taches : ça passe");
});

test("la saisie ne lit plus les menus ; buildFromEquationInput change de monde AVANT de construire le plateau", () => {
  const lire = source("parseEquationInputToModel");
  assert.doesNotMatch(lire, /isRelativeUniverse\(|oppositeXEnabled\(|workUniverseEl|oppositeXModeEl/);
  const construire = source("buildFromEquationInput");
  const appel = construire.indexOf("passerAuMondeDeLEquation(model.besoin);");
  assert.ok(appel > 0 && appel < construire.indexOf("state = {"), "le monde change avant la construction du plateau");
  assert.ok(appel > construire.indexOf("parseEquationInputToModel("), "et seulement une fois l'équation acceptée");
});

test("passer au monde de l'équation : exécuté avec de faux menus", () => {
  function jouer(univers, opposees, besoin){
    const ctx = vm.createContext({});
    vm.runInContext(`
      const workUniverseEl = {value:${JSON.stringify(univers)}}, oppositeXModeEl = {value:${JSON.stringify(opposees)}};
      const appels = [];
      const syncUniverseUI = o => appels.push("sync:" + JSON.stringify(o));
      const renderEquationExamples = () => appels.push("exemples");
      ${source("passerAuMondeDeLEquation")}
      const change = passerAuMondeDeLEquation(${JSON.stringify(besoin)});
      globalThis.r = {univers:workUniverseEl.value, opposees:oppositeXModeEl.value, change, appels};`, ctx);
    return JSON.parse(JSON.stringify(ctx.r));
  }
  const synchro = ['sync:{"validate":false}', "exemples"];
  assert.deepEqual(jouer("positive", "off", {relatif:true, opposees:false}), {univers:"relative", opposees:"off", change:true, appels:synchro});
  assert.deepEqual(jouer("positive", "off", {relatif:true, opposees:true}), {univers:"relative", opposees:"on", change:true, appels:synchro});
  assert.deepEqual(jouer("relative", "off", {relatif:true, opposees:true}), {univers:"relative", opposees:"on", change:true, appels:synchro});
  // déjà dans le bon monde, ou équation positive : on ne touche à rien (on ne repasse jamais en positif)
  assert.deepEqual(jouer("relative", "on", {relatif:true, opposees:true}), {univers:"relative", opposees:"on", change:false, appels:[]});
  assert.deepEqual(jouer("positive", "off", {relatif:false, opposees:false}), {univers:"positive", opposees:"off", change:false, appels:[]});
  assert.deepEqual(jouer("relative", "off", {relatif:false, opposees:false}), {univers:"relative", opposees:"off", change:false, appels:[]});
});

test("Et un pirate ? Ce qu'on tape ne s'écrit jamais en HTML", () => {
  const pieges = ['<img src=x onerror=alert(1)>', '2x + 4 = <img src=x onerror=alert(1)>', '<b>x</b> = 2',
    'x = "><svg onload=alert(1)>', '2x+4=18<script>alert(1)</script>', 'x + &lt;4 = 9', "x = 2' onmouseover='alert(1)",
    'x + <b>4 = 9', '<svg>x + 4 = 9', 'x + 4 = 9<i>', "x + 4 = 9'\"><"];
  // au moins un piège va jusqu'au contrôle des caractères (les autres s'arrêtent avant)
  assert.equal(saisir('x + <b>4 = 9').message, "Caractère non reconnu. Utilise des entiers, une lettre, +, − et ×.");
  const permis = new Set([UN_NOMBRE, ENTIERS, "Il faut exactement un signe égal.",
    "Utilise seulement des sommes simples : par exemple 2x + 4 = 18.",
    "Caractère non reconnu. Utilise des entiers, une lettre, +, − et ×.",
    "Un terme ne doit contenir qu’une seule inconnue.", "Il faut une inconnue : par exemple x, n ou a."]);
  for(const eq of pieges){
    const r = saisir(eq);
    assert.equal(r.ok, false, eq);
    assert.ok(permis.has(r.message), `${eq} → une phrase fixe, pas un morceau de la saisie (${r.message})`);
    assert.doesNotMatch(r.message, /[<>"&]/, eq);
  }
  // la boîte de refus passe la phrase par escapeHtml (défense en profondeur)
  assert.match(source("buildFromEquationInput"),
    /setTeacherInfo\(false, escapeHtml\(err && err\.message \? err\.message : "Équation impossible à construire\."\)\);/);
  // et escapeHtml fait bien son travail
  const ctx = vm.createContext({});
  vm.runInContext(`${source("escapeHtml")}\nglobalThis.r = escapeHtml('<img src=x onerror="a()">&');`, ctx);
  assert.equal(ctx.r, "&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;");
});

test("Et un pirate ? Par un lien #data=, une pièce n'est jamais qu'un nombre ou une tache", () => {
  const ctx = vm.createContext({});
  vm.runInContext(`
    let n = 0; const uid = () => "id" + (n++);
    function makeX(sign=1){ return {id:uid(), type:"x", sign: sign < 0 ? -1 : 1}; }
    function makeToken(value, opts = {}){ return {id:uid(), type:"token", value:Number(value), unit:opts.unit === true}; }
    ${source("normalizeImportedPiece")}
    globalThis.r = ['<img src=x onerror=alert(1)>', {type:"number", value:"<b>4</b>"}, {type:"<svg onload=a()>"},
      "4", -3, {type:"x", sign:-1}, "−x", {type:"token", value:"1e3"}].map(normalizeImportedPiece);`, ctx);
  const r = JSON.parse(JSON.stringify(ctx.r)).map(p => p && (p.type === "x" ? `${p.sign}x` : p.value));
  assert.deepEqual(r, [null, null, null, 4, -3, "-1x", "-1x", 1000]);
  // la lettre d'un lien : une seule lettre, sinon 𝑥 (lot « liens piégés »)
  assert.match(html, /const wantedVar = \/\^\\p\{L\}\$\/u\.test\(rawVar\) \? rawVar : "𝑥";/);
});
