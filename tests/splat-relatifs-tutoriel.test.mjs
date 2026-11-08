// Lot 6a « aides et carte » (08/11/2026) — étape É1 du monde 6, « Des jetons verts et rouges ». Choix de Gwenaël
// (questions à choix du 08/11, 18 h 45) :
// - un tutoriel « À toi de faire » (sans film), sur la carte et derrière « ? Comment faire » dans ÉquaSplat ;
// - deux exemples HORS de la série : 𝑘 + 1 − 1 = 1 + 1 (une paire déjà sur le plateau : regrouper le 1 et le −1, taper 0,
//   puis regrouper la droite → 𝑘 = 2), puis 𝑘 + 1 = −1 − 1 (« Ajouter des deux côtés » −1, la paire nulle, puis les trois
//   jetons de droite → 𝑘 = −3) ;
// - L'ÉLÈVE TAPE TOUT : le jeton à ajouter (−1) et chaque somme (0, 2, 0, −3) ; une mauvaise touche n'écrit rien, l'aide
//   arrive après l'erreur ; jamais bloqué.
// Ces tests EXÉCUTENT le déroulé du tutoriel, extrait tel quel de la page. Il a été joué en entier au navigateur, clics et
// touches réels, à 1440 × 900 et 390 × 844 (voir la notice du lot).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const outil = lire("outils/equasplat.html");
const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
const bloc = blocs.find((b) => b.includes("FILMS['equasplat-relatifs']="));
const prendre = (re, nom) => { const m = bloc.match(re); assert.ok(m, nom + " introuvable"); return m[1]; };
const TT = new Function(`return ${prendre(/const TT=(\(\(\)=>\{[\s\S]*?\}\)\(\));/, "TT")};`)();
const ATT = new Function("TT", `return ${prendre(/const ATT=(\[[\s\S]*?\]);/, "ATT")};`)(TT);
const GROUPES = new Function("TT", `return ${prendre(/const GROUPES=(\{[\s\S]*?\}\});/, "GROUPES")};`)(TT);
const SEL = new Function(`return ${prendre(/const SEL=(\{[^\n]*?\});/, "SEL")};`)();
const OK = new Function(`return ${prendre(/const OK=(\{[^\n]*?\});/, "OK")};`)();
const ECRIRE = new Function(`return ${prendre(/const ECRIRE=(\{[\s\S]*?\}\});/, "ECRIRE")};`)();
const LIGNE2 = new Function("TT", `return ${prendre(/const LIGNE2=(\{[\s\S]*?\]\]\});/, "LIGNE2")};`)(TT);
const AJOUTES = new Function("TT", `return ${prendre(/const AJOUTES=(\{[^\n]*?\});/, "AJOUTES")};`)(TT);
const COMBIEN = new Function(`return ${prendre(/const COMBIEN=(gk=>function\(\)\{[^\n]*?\};)/, "COMBIEN").replace(/;$/, "")};`)();
const GUIDE_T = new Function("TT", "COMBIEN", `return ${prendre(/const GUIDE_T=(\[[\s\S]*?\]\]);/, "GUIDE_T")};`)(TT, COMBIEN);
const exemples = new Function(`${prendre(/(function exemples\(port\)\{[\s\S]*?\n\})/, "exemples")}; return exemples;`)();
// la somme écrite dans la fenêtre, telle que la page la calcule (expr), dans l'ordre du plateau
const signe = (v) => (v < 0 ? "−" : "") + Math.abs(v);
const expr = (X, ids) => ids.map((id, i) => { const v = X[id][0]; return i && v < 0 ? "(−" + (-v) + ")" : signe(v); }).join(" + ");
const valeur = (s) => Number(s.replace(/−/g, "-"));

test("étape É1 : un tutoriel seul, sur la carte et derrière « ? »", () => {
  assert.match(page, /FILMS\['equasplat-relatifs'\]=\(function\(\)\{/);
  assert.match(bloc, /return aToi;\n\}\)\(\);/);
  assert.match(bloc, /attentes:ATT\.map\(t=>\(\{t\}\)\)/);
  assert.match(bloc, /titre:'À toi de faire — Des jetons verts et rouges — ÉquaSplat — maths&go'/);
  assert.match(bloc, /passerTexte:'Passer ›'/);
  assert.match(carte, /p:"ech1",code:"É1",id:"e3-ech1",\n\s*films:\[\["equasplat-relatifs","À toi de faire","toi"\]\],/);
  assert.match(lire("assets/js/splat-etapes.js"), /ech1: "equasplat-relatifs"/);
});

test("deux exemples hors de la série de l'étape É1, justes, et les jetons dessinés sont ceux des équations", () => {
  const i = carte.indexOf('p:"ech1"');
  const serie = JSON.parse(carte.slice(carte.indexOf("eqs:", i) + 4, carte.indexOf("]", carte.indexOf("eqs:", i)) + 1));
  assert.equal(serie.length, 12);
  for (const e of ["𝑘 + 1 − 1 = 1 + 1", "𝑘 + 1 = −1 − 1"]) assert.ok(!serie.includes(e), e);
  assert.ok(bloc.includes("o.eqA=Q.equation(Y,S,[{g:'𝑘 + 1 − 1',d:'1 + 1'},"));
  assert.ok(bloc.includes("o.eqB=Q.equation(Y,S,[{g:'𝑘 + 1',d:'−1 − 1'},{g:'𝑘 + 1 − 1',d:'−1 − 1 − 1',op:'−1',"));
  // 𝑘 = 2 : 2 + 1 − 1 = 1 + 1 ; 𝑘 = −3 : −3 + 1 = −1 − 1
  assert.equal(2 + 1 - 1, 1 + 1); assert.equal(-3 + 1, -1 - 1);
  for (const port of [false, true]) {
    const X = exemples(port);
    const somme = (ex, cote, avant) => Object.entries(X[ex].p).filter(([id]) => id[0] === cote && !(avant && AJOUTES[ex] && AJOUTES[ex][id] != null)).reduce((a, [, p]) => a + p[0], 0);
    // A : à gauche la tache + 1 − 1, à droite 1 + 1 ; B : la tache + 1, puis −1 de chaque côté
    assert.deepEqual([somme("A", "L"), somme("A", "R")], [0, 2]);
    assert.deepEqual([somme("B", "L", true), somme("B", "R", true)], [1, -2]);
    assert.deepEqual([somme("B", "L"), somme("B", "R")], [0, -3]);
    assert.deepEqual(Object.keys(AJOUTES.B).map((id) => X.B.p[id][0]), [-1, -1], "le jeton ajouté est −1 des deux côtés");
    // deux pièces ne se chevauchent pas, et restent sur leur moitié du plateau
    const mi = port ? 195 : 720, R = port ? 17.1 : 42.9, rt = port ? 22 * 1.1 : 61.5 * 1.1;
    for (const ex of ["A", "B"]) {
      const ps = [["t", X[ex].t, rt], ...Object.entries(X[ex].p).map(([id, p]) => [id, p[1], R])];
      for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++)
        assert.ok(Math.hypot(ps[a][1][0] - ps[b][1][0], ps[a][1][1] - ps[b][1][1]) > ps[a][2] + ps[b][2] + 8, `${ex} ${port} : ${ps[a][0]} / ${ps[b][0]}`);
      for (const [id, c, r] of ps) assert.ok(id[0] === "R" ? c[0] - r > mi : c[0] + r < mi, `${ex} ${port} : ${id} du bon côté`);
    }
  }
});

test("27 gestes : une consigne par geste, affichée avant ses attentes", () => {
  assert.equal(ATT.length, 27);
  for (let i = 1; i < ATT.length; i++) assert.ok(ATT[i] > ATT[i - 1] + .5, `attentes ${i - 1} et ${i} trop proches`);
  assert.ok(ATT[ATT.length - 1] < TT.fin);
  // les jetons : tous ceux de chaque regroupement, une seule consigne validée au dernier
  for (const gk in GROUPES) assert.equal(Object.values(SEL).filter((x) => x === gk).length, GROUPES[gk].ids.length, gk);
  const faites = ATT.filter((a, k) => !SEL[k] || SEL[k + 1] !== SEL[k]);
  for (const a of faites) assert.equal(GUIDE_T.filter((g) => g[2] === a).length, 1, `consigne de l'attente ${a}`);
  for (const [k, a] of ATT.entries()) assert.ok(GUIDE_T.find((x) => x[2] != null && x[2] >= a && x[0] < a), `consigne affichée à l'attente ${k}`);
  // les fenêtres : chaque écriture est suivie de sa validation, dans la même fenêtre
  for (const k of Object.keys(ECRIRE).map(Number)) assert.equal(OK[k + 1], ECRIRE[k].d, `validation après l'écriture ${k}`);
});

test("l'élève tape lui-même chaque somme et le jeton à ajouter ; l'aide donne le calcul ; jamais bloqué", () => {
  assert.deepEqual(Object.keys(ECRIRE).map(Number), [4, 9, 13, 19, 25]);
  const X = exemples(false);
  // chaque somme attendue est celle des jetons du regroupement ; le jeton ajouté annule le 1
  for (const gk in GROUPES) {
    const g = GROUPES[gk], k = Object.keys(ECRIRE).map(Number).find((n) => ECRIRE[n].d === g.dlg);
    const s = g.ids.reduce((a, id) => a + X[g.ex].p[id][0], 0);
    assert.deepEqual(ECRIRE[k].ok, [signe(s)], gk);
    const ctx = { expr: () => expr(X[g.ex].p, g.ids) };
    const consigne = GUIDE_T.find((x) => x[3] === k)[1].call(ctx);
    for (const c of consigne) {
      assert.ok(c.startsWith("Combien font " + expr(X[g.ex].p, g.ids) + " ?"), c);
      assert.ok(!c.includes("= " + signe(s)) && !/ \? .*\d/.test(c), `« ${c} » donne la réponse`);
    }
  }
  assert.deepEqual(ECRIRE[13].ok, ["−1"]); assert.equal(1 + valeur(ECRIRE[13].ok[0]), 0);
  for (const txt of GUIDE_T.find((x) => x[3] === 13)[1]) assert.doesNotMatch(txt, /−1/, `« ${txt} » donne la réponse`);
  for (const k in ECRIRE) {
    assert.equal(ECRIRE[k].aide.length, 2);
    for (const a of ECRIRE[k].aide) assert.ok(a.includes("tape " + ECRIRE[k].ok[0]), a);
    assert.match(ECRIRE[k].aide[0], /ou touche la case/);
  }
  // une mauvaise touche n'écrit rien ; le signe « - » du clavier vaut « − » ; la case : l'aide d'abord
  assert.match(bloc, /saisir\(k,c\)\{if\(c==='-'\)c='−';/);
  assert.match(bloc, /if\(!ok\.some\(x=>x\.startsWith\(s\)\)\)\{this\.aide\[k\]=true;this\.montrer\(k\);return false;\}/);
  assert.match(bloc, /if\(bon\)\{if\(!this\.aide\[k\]\)\{this\.aide\[k\]=true;this\.indice=null;return false;\}/);
  assert.match(bloc, /if\(\/\^\[0-9\]\$\/\.test\(cle\)\|\|cle==='-'\|\|cle==='−'\)return this\.saisir\(k,cle\);/);
  assert.match(bloc, /if\(cle==='Enter'&&OK\[k\]\)/);
  // au téléphone, le pavé a la touche « − » (comme l'outil : 1-9, 0, −)
  assert.equal((bloc.match(/\['pave',[^\]]*'moins'\]/g) || []).length, 2);
});

test("les erreurs de jetons : un jeton de l'autre côté, ou « Regrouper » trop tôt, donnent l'aide", () => {
  assert.equal(GROUPES.A0.aide, "Le 1 et le −1 sont à gauche : touche-les.");
  assert.equal(GROUPES.B3.aide, "À droite, il y a 3 jetons : touche-les tous les trois.");
  assert.match(bloc, /if\(sur&&g\.ids\.includes\(sur\)\)return false;/);
  assert.match(bloc, /const surReg=this\.prises\(gk\)\.length>=2&&/);
  assert.match(bloc, /if\(g\.aide&&\(sur\|\|surReg\)\)this\.aideT\[gk\]=true;/);
  // la consigne des trois jetons de droite ne dit pas combien
  assert.doesNotMatch(GUIDE_T.find((x) => x[4] === "B3")[1], /\d|trois/);
});

test("la deuxième ligne se réécrit à chaque regroupement, comme l'outil, et finit sur la solution", () => {
  assert.deepEqual(LIGNE2.A.map((l) => l.slice(1)), [["𝑘", "1 + 1", false], ["𝑘", "2", true]]);
  assert.deepEqual(LIGNE2.B.map((l) => l.slice(1)), [["𝑘 + 1 − 1", "−1 − 1 − 1", false], ["𝑘", "−1 − 1 − 1", false], ["𝑘", "−3", true]]);
  assert.deepEqual(LIGNE2.A.map((l) => l[0]), [TT.aOk0, TT.aOk2]);
  assert.deepEqual(LIGNE2.B.map((l) => l[0]), [TT.bOk, TT.bOk0, TT.bOk3]);
  assert.ok(bloc.includes("o.bravoA=Q.bandeau(o,Y,S,'𝑘 = 2');o.bravoB=Q.bandeau(o,Y,S,'𝑘 = −3');"));
  // phrases de l'outil (relevées le 08/11/2026)
  for (const p of ["Touche les jetons à regrouper, du même côté.", "Touche un autre jeton du même côté.",
    " jetons sélectionnés. Calcule leur somme pour les regrouper.", "Paire nulle : 0 apparaît, puis disparaît.",
    "La paire nulle vaut 0 : elle disparaît du plateau."]) assert.ok(bloc.includes(p), p);
  assert.ok(outil.includes("Paire nulle : <strong>0</strong> apparaît, puis disparaît.") && outil.includes("La paire nulle vaut 0 : elle disparaît du plateau."));
});

test("l'écran commun dessine les jetons du monde 6 et la tache opposée aux couleurs de l'outil", () => {
  const eq = page.slice(page.indexOf("const ECRAN_EQ="), page.indexOf("FILMS.equasplat=(function(){"));
  const css = (sel) => { const m = outil.match(new RegExp("\\n  " + sel.replace(/\./g, "\\.") + "\\{([^}]*)\\}")); assert.ok(m, sel); return m[1]; };
  const prop = (txt, p) => txt.match(new RegExp(p + ":([^;]+);"))[1].trim();
  const couleur = new Function(`${eq.match(/(function couleurRelatif\(v\)\{[^\n]*\})/)[1]}; return couleurRelatif;`)();
  for (const [v, sel] of [[1, ".tokenCircle.relativePositive"], [-1, ".tokenCircle.negative"], [0, ".tokenCircle.zero"]]) {
    const c = css(sel);
    assert.deepEqual(couleur(v), { fill: prop(c, "fill"), stroke: prop(c, "stroke") }, sel);
  }
  const op = css(".splatShape.oppositeX");
  assert.ok(eq.includes(`fill:oppose?'${prop(op, "fill")}':C.tache,stroke:oppose?'${prop(op, "stroke")}'`));
  assert.match(eq, /const l=oppose\?'−'\+lettre:lettre/);
  assert.match(eq, /c=relatif\?couleurRelatif\(v\):couleurJeton\(v\)/);
  assert.match(eq, /textContent=relatif\?signe\(v\):String\(v\)/);
});
