// Lot 5 « aides et carte » (08/11/2026) — étape 37, « Des taches sur les deux plateaux ». Choix de Gwenaël (questions à
// choix du 08/11) :
// - un tutoriel « À toi de faire » (sans film), sur la carte et derrière « ? Comment faire » dans ÉquaSplat ;
// - deux exemples HORS de la série : 𝑡 + 4 = 3𝑡 (petits jetons : 1 tache de chaque côté, puis partager 4 en 2), puis
//   2𝑘 + 9 = 5𝑘 (jetons numérotés : 2 taches de chaque côté, puis partager 9 en 3) ;
// - C'EST L'ÉLÈVE QUI COMPTE LES TACHES : la consigne ne dit pas combien ; une tache de trop n'est pas prise, l'aide arrive
//   après l'erreur ; au partage, il tape la valeur d'une part (2, puis 3), sans jamais être bloqué.
// Ces tests EXÉCUTENT le déroulé du tutoriel, extrait tel quel de la page. Il a été joué en entier au navigateur, clics et
// touches réels, à 1440 × 900 et 390 × 844 (voir la notice du lot).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
const bloc = blocs.find((b) => b.includes("FILMS['equasplat-taches']="));
const prendre = (re, nom) => { const m = bloc.match(re); assert.ok(m, nom + " introuvable"); return m[1]; };
const TT = new Function(`return ${prendre(/const TT=(\(\(\)=>\{[\s\S]*?\}\)\(\));/, "TT")};`)();
const ATT = new Function("TT", `return ${prendre(/const ATT=(\[[\s\S]*?\]);/, "ATT")};`)(TT);
const TACHES = new Function(`return ${prendre(/const TACHES=(\{[^\n]*?\});/, "TACHES")};`)();
const MAX = new Function(`return ${prendre(/const MAX=(\{[^\n]*?\});/, "MAX")};`)();
const AIDE_T = new Function(`return ${prendre(/const AIDE_T=(\{[^\n]*?\});/, "AIDE_T")};`)();
const ECRIRE = new Function(`return ${prendre(/const ECRIRE=(\{[\s\S]*?\}\});/, "ECRIRE")};`)();
const GUIDE_T = new Function("TT", `return ${prendre(/const GUIDE_T=(\[[\s\S]*?\]\]);/, "GUIDE_T")};`)(TT);
const consTaches = new Function(`${prendre(/(function consTaches\([\s\S]*?\n  return [^\n]*\})/, "consTaches")}; return consTaches;`)();
const exemples = new Function(`${prendre(/(function exemples\(port\)\{[\s\S]*?\n\})/, "exemples")}; return exemples;`)();

test("étape 37 : un tutoriel seul, sur la carte et derrière « ? »", () => {
  assert.match(page, /FILMS\['equasplat-taches'\]=\(function\(\)\{/);
  // pas de film : le lecteur joue le tutoriel lui-même, pour l'élève comme pour le prof
  assert.doesNotMatch(bloc, /\.aToi=/);
  assert.match(bloc, /return aToi;\n\}\)\(\);/);
  assert.match(bloc, /attentes:ATT\.map\(t=>\(\{t\}\)\)/);
  assert.match(bloc, /titre:'À toi de faire — Des taches sur les deux plateaux — ÉquaSplat — maths&go'/);
  assert.match(bloc, /passerTexte:'Passer ›'/);
  assert.match(carte, /p:"m3e4",id:"e2-3",\n\s*films:\[\["equasplat-taches","À toi de faire","toi"\]\],/);
  const etapes = lire("assets/js/splat-etapes.js");
  assert.match(etapes, /m3e4: "equasplat-taches"/);
});

test("deux exemples hors de la série de l'étape 37, justes", () => {
  const serie = JSON.parse(carte.match(/p:"m3e4",id:"e2-3",\n[^\n]*\n\s*eqs:(\[[^\]]*\])/)[1]);
  assert.equal(serie.length, 12);
  for (const e of ["𝑡 + 4 = 3𝑡", "2𝑘 + 9 = 5𝑘"]) assert.ok(!serie.includes(e), e);
  assert.ok(bloc.includes("{g:'𝑡 + 4',d:'3𝑡'},{g:'4',d:'2𝑡',op:'−𝑡',t:TM.ecritA},{g:'2',d:'𝑡',op:'÷ 2',t:TM.groupesA,sol:true}"));
  assert.ok(bloc.includes("{g:'2𝑘 + 9',d:'5𝑘'},{g:'9',d:'3𝑘',op:'−2𝑘',t:TM.ecritB},{g:'3',d:'𝑘',op:'÷ 3',t:TM.groupesB,sol:true}"));
  // 𝑡 = 2 : 2 + 4 = 3 × 2 ; 𝑘 = 3 : 2 × 3 + 9 = 5 × 3
  assert.equal(2 + 4, 3 * 2); assert.equal(2 * 3 + 9, 5 * 3);
  // les pièces dessinées sont bien celles des équations, aux deux formats
  for (const port of [false, true]) {
    const X = exemples(port);
    assert.deepEqual([X.A.g.length, X.A.d.length, X.A.b.length], [1, 3, 4]);
    assert.deepEqual([X.B.g.length, X.B.d.length], [2, 5]);
    assert.equal(X.A.cartes.ys.length, 2); assert.equal(X.B.cartes.ys.length, 3);
    // le côté qui a le moins de taches dit combien on en enlève
    assert.equal(MAX.A, Math.min(X.A.g.length, X.A.d.length));
    assert.equal(MAX.B, Math.min(X.B.g.length, X.B.d.length));
    // deux taches ne se chevauchent pas
    for (const ex of ["A", "B"]) {
      const t = [...X[ex].g, ...X[ex].d];
      for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++)
        assert.ok(Math.hypot(t[i][0] - t[j][0], t[i][1] - t[j][1]) > (port ? 50 : 125), `${ex} ${port} : ${t[i]} / ${t[j]}`);
    }
  }
});

test("22 gestes : une consigne par geste, chaque consigne affichée avant ses attentes", () => {
  assert.equal(ATT.length, 22);
  for (let i = 1; i < ATT.length; i++) assert.ok(ATT[i] > ATT[i - 1] + .5, `attentes ${i - 1} et ${i} trop proches`);
  assert.ok(ATT[ATT.length - 1] < TT.fin);
  // les taches : 2 touchers pour A (1 + 1), 4 pour B (2 + 2), une seule consigne pour tous, validée au dernier
  assert.deepEqual(Object.keys(TACHES).map(Number), [1, 2, 11, 12, 13, 14]);
  assert.equal(Object.values(TACHES).filter((x) => x === "A").length, 2 * MAX.A);
  assert.equal(Object.values(TACHES).filter((x) => x === "B").length, 2 * MAX.B);
  const faites = ATT.filter((a, k) => !TACHES[k] || TACHES[k + 1] !== TACHES[k]);
  for (const a of faites) assert.equal(GUIDE_T.filter((g) => g[2] === a).length, 1, `consigne de l'attente ${a}`);
  for (const [k, a] of ATT.entries()) {
    const g = GUIDE_T.find((x) => x[2] != null && x[2] >= a && x[0] < a);
    assert.ok(g, `consigne affichée à l'attente ${k}`);
  }
});

test("l'élève compte les taches : la consigne ne dit pas combien, l'aide le dit après une erreur", () => {
  for (const ex of ["A", "B"]) {
    const g = GUIDE_T.find((x) => x[4] === ex);
    assert.equal(g[1], "Enlève le même nombre de taches de chaque côté : touche-les.");
    assert.doesNotMatch(g[1], /\d/, "la consigne ne donne pas le nombre");
    assert.ok(AIDE_T[ex].includes(`touches-en ${MAX[ex]} de chaque côté`), AIDE_T[ex]);
  }
  // une tache de trop n'est pas prise : l'aide, et le doigt sur une tache qu'on peut prendre
  assert.match(bloc, /if\(n\[x\.cote\]>=MAX\[ex\]\)\{this\.aideT\[ex\]=true;const l=this\.libre\(ex\);/);
  // « Valider » touché trop tôt : l'aide aussi
  assert.match(bloc, /q\[1\]<=n\('y'\)\+n\('height'\)\)this\.aideT\[ex\]=true;/);
  // sous l'équation, les phrases d'ÉquaSplat selon les taches choisies (relevées dans l'outil le 08/11/2026)
  assert.equal(consTaches(0, 0, "𝑡"), "Sélectionne la même quantité des deux côtés.");
  assert.equal(consTaches(1, 0, "𝑡"), "Sélectionne maintenant l’autre côté.");
  assert.equal(consTaches(0, 2, "𝑘"), "Sélectionne maintenant l’autre côté.");
  assert.equal(consTaches(1, 1, "𝑡"), "Même quantité sélectionnée : 𝑡.");
  assert.equal(consTaches(2, 2, "𝑘"), "Même quantité sélectionnée : 2𝑘.");
  assert.equal(consTaches(1, 2, "𝑘"), "Les taches sélectionnées ne représentent pas la même quantité d’inconnues.");
});

test("au partage, l'élève tape 2 puis 3 ; l'aide donne le calcul ; jamais bloqué", () => {
  assert.deepEqual(Object.keys(ECRIRE).map(Number), [6, 19]);
  assert.deepEqual(ECRIRE[6].ok, ["2"]); assert.equal(2 * 2, 4);
  assert.deepEqual(ECRIRE[19].ok, ["3"]); assert.equal(3 * 3, 9);
  for (const k of [6, 19]) {
    const g = GUIDE_T.find((x) => x[3] === k);
    assert.ok(g && g[2] === ATT[k]);
    for (const txt of [].concat(g[1])) assert.doesNotMatch(txt, /\d/, `« ${txt} » donne la réponse`);
    assert.equal(ECRIRE[k].aide.length, 2);
    for (const a of ECRIRE[k].aide) assert.ok(a.includes("tape " + ECRIRE[k].ok[0]), a);
    assert.match(ECRIRE[k].aide[0], /ou touche la case/);
  }
  assert.match(bloc, /if\(!ok\.some\(x=>x\.startsWith\(s\)\)\)\{this\.aide\[k\]=true;this\.montrer\(k\);return false;\}/);
  assert.match(bloc, /if\(bon\)\{if\(!this\.aide\[k\]\)\{this\.aide\[k\]=true;this\.indice=null;return false;\}/);
  // Entrée valide les deux fenêtres « Partager »
  assert.match(bloc, /if\(cle==='Enter'&&\(k===7\|\|k===20\)\)/);
  // la fenêtre de 9 ne propose que « 3 parts », comme l'outil
  assert.ok(bloc.includes("['puce','3 parts',262.5,180,95,49,'p3']") && !bloc.includes("'9 parts'"));
});

test("la légende commune se mesure visible : une phrase trop longue passe sur deux lignes au téléphone", () => {
  const eq = page.slice(page.indexOf("const ECRAN_EQ="), page.indexOf("FILMS.equasplat=(function(){"));
  const leg = eq.slice(eq.indexOf("function legende(o,Y,t){"), eq.indexOf("function sousTitres("));
  assert.ok(leg.indexOf("o.st.style.display='';") > 0 && leg.indexOf("o.st.style.display='';") < leg.indexOf("getComputedTextLength"));
  const intro = page.slice(page.indexOf("legende(txt){"), page.indexOf("legende(txt){") + 800);
  assert.ok(intro.indexOf("o.st.style.display='';") > 0 && intro.indexOf("o.st.style.display='';") < intro.indexOf("getComputedTextLength"));
});
