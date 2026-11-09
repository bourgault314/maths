// Lot 6b-6c « aides et carte » (08/11/2026) — fiches 38 (« Les jetons rouges arrivent ») et 40 (« La tache opposée ») du
// monde 6. Choix de Gwenaël (questions à choix du 08/11, 18 h 45 et 20 h 30) :
// - un tutoriel « À toi de faire » (sans film) pour chaque fiche, sur la carte et derrière « ? Comment faire » dans ÉquaSplat ;
// - fiche 38 : 𝑥 + 3 = −5 (« Ajouter des deux côtés » −3, la paire nulle 3 et −3, puis −5 et −3 → 𝑥 = −8) ;
// - fiche 40 : −𝑘 − 4 = 2 (« Ajouter des deux côtés » 4, la paire nulle, 2 + 4 → −𝑘 = 6, puis « Prendre l’opposé » → 𝑘 = −6) ;
// - L'ÉLÈVE TAPE TOUT : le jeton à ajouter et chaque somme ; une mauvaise touche n'écrit rien, l'aide arrive après l'erreur ;
//   jamais bloqué.
// Ces tests EXÉCUTENT le déroulé des deux tutoriels (CFG et deroule), extrait tel quel de la page. Ils ont été joués en
// entier au navigateur, clics et touches réels, à 1440 × 900 et 390 × 844 (voir la notice du lot).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const outil = lire("outils/equasplat.html");
const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
const bloc = blocs.find((b) => b.includes("FILMS['equasplat-oppose']="));
const debut = bloc.indexOf("/* ---- les deux tutoriels"), fin = bloc.indexOf("/* ---- fin du déroulé ---- */");
assert.ok(debut > 0 && fin > debut, "le déroulé est introuvable");
const { CFG, deroule } = new Function(`${bloc.slice(debut, fin)}; return {CFG, deroule};`)();
const D = { rouges: deroule(CFG.rouges), oppose: deroule(CFG.oppose) };
const ajout = new Function("cfg", `${bloc.match(/(function ajout\(cfg\)\{[\s\S]*?\n\})/)[1]}; return ajout(cfg);`);
const signe = (v) => (v < 0 ? "−" : "") + Math.abs(v);
const expr = (cfg, ids) => ids.map((id, i) => { const v = cfg.p[id][0]; return i && v < 0 ? "(−" + (-v) + ")" : signe(v); }).join(" + ");
const valeur = (s) => Number(s.replace(/−/g, "-"));
const serie = (p) => { const i = carte.indexOf(`p:"${p}"`), j = carte.indexOf("eqs:", i); return JSON.parse(carte.slice(j + 4, carte.indexOf("]", j) + 1)); };

test("fiches 38 et 40 : un tutoriel seul chacune, sur la carte et derrière « ? »", () => {
  assert.match(bloc, /FILMS\['equasplat-rouges'\]=tutoriel\(CFG\.rouges\);\nFILMS\['equasplat-oppose'\]=tutoriel\(CFG\.oppose\);/);
  assert.match(bloc, /attentes:ATT\.map\(t=>\(\{t\}\)\)/);
  assert.match(bloc, /passerTexte:'Passer ›'/);
  assert.equal(CFG.rouges.titre, "À toi de faire — Les jetons rouges — ÉquaSplat — maths&go");
  assert.equal(CFG.oppose.titre, "À toi de faire — La tache opposée — ÉquaSplat — maths&go");
  assert.match(carte, /p:"m4e1",id:"e3-0",\n\s*films:\[\["equasplat-rouges","À toi de faire","toi"\]\],/);
  assert.match(carte, /p:"m4e3",id:"e3-2",\n\s*films:\[\["equasplat-oppose","À toi de faire","toi"\]\],/);
  const etapes = lire("assets/js/splat-etapes.js");
  assert.match(etapes, /m4e1: "equasplat-rouges", m4e3: "equasplat-oppose" \};/);
});

test("les exemples : hors de la série de leur fiche, justes, et les jetons dessinés sont ceux de l'équation", () => {
  assert.ok(!serie("m4e1").includes("𝑥 + 3 = −5"));
  assert.ok(!serie("m4e3").includes("−𝑘 − 4 = 2"));
  // 𝑥 = −8 : −8 + 3 = −5 ; 𝑘 = −6 : −(−6) − 4 = 2
  assert.equal(-8 + 3, -5); assert.equal(-(-6) - 4, 2);
  for (const [nom, cfg, x] of [["rouges", CFG.rouges, -8], ["oppose", CFG.oppose, -6]]) {
    const v = (id) => cfg.p[id][0], s = cfg.opp ? -1 : 1;
    // au départ : la tache et L1 à gauche, R1 à droite ; l'équation est juste pour la solution
    assert.equal(s * x + v("L1"), v("R1"), nom);
    // le jeton ajouté des deux côtés annule L1, et c'est celui que l'élève tape
    assert.equal(v("L2"), -v("L1"), nom); assert.equal(v("R2"), v("L2"), nom);
    assert.equal(valeur(cfg.ecrire.ajout[0]), v("L2"), nom);
    // la paire nulle, puis la somme de droite
    assert.equal(valeur(cfg.ecrire.g0[0]), 0, nom);
    assert.equal(valeur(cfg.ecrire.g1[0]), v("R1") + v("R2"), nom);
    assert.equal(cfg.solution, `${cfg.lettre} = ${signe(x)}`, nom);
    // les lignes écrites : l'équation, l'ajout, la paire disparue, la somme ; à la fiche 40, ×(−1)
    const L = cfg.lignes;
    assert.deepEqual(L[0], [(cfg.opp ? "−" : "") + cfg.lettre + (v("L1") < 0 ? " − " : " + ") + Math.abs(v("L1")), signe(v("R1"))], nom);
    assert.equal(L[1][2], (v("L2") < 0 ? "−" : "+") + Math.abs(v("L2")), nom);
    assert.deepEqual(L[3], [(cfg.opp ? "−" : "") + cfg.lettre, signe(v("R1") + v("R2"))], nom);
    if (cfg.opp) assert.deepEqual(L[4], [cfg.lettre, signe(x), "×(−1)"]);
    else assert.equal(L.length, 4);
  }
  // deux pièces ne se chevauchent pas, et restent sur leur moitié du plateau
  for (const cfg of [CFG.rouges, CFG.oppose]) for (const port of [false, true]) {
    const mi = port ? 195 : 720, R = port ? 17.1 : 42.9, rt = port ? 22 * 1.1 : 61.5 * 1.1, tc = port ? [80, 300] : [330, 408];
    const ps = [["t", tc, rt], ...Object.entries(cfg.p).map(([id, p]) => [id, p[port ? 2 : 1], R])];
    for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++)
      assert.ok(Math.hypot(ps[a][1][0] - ps[b][1][0], ps[a][1][1] - ps[b][1][1]) > ps[a][2] + ps[b][2] + 8, `${port} : ${ps[a][0]} / ${ps[b][0]}`);
    for (const [id, c, r] of ps) assert.ok(id[0] === "R" ? c[0] - r > mi : c[0] + r < mi, `${port} : ${id} du bon côté`);
  }
});

test("14 gestes à la fiche 38, 15 à la fiche 40 : une consigne par geste, affichée avant ses attentes", () => {
  assert.equal(D.rouges.ATT.length, 14); assert.equal(D.oppose.ATT.length, 15);
  for (const [nom, d] of Object.entries(D)) {
    const { ATT, T, GROUPES, SEL, OK, ECRIRE, GUIDE_T } = d;
    for (let i = 1; i < ATT.length; i++) assert.ok(ATT[i] > ATT[i - 1] + .5, `${nom} : attentes ${i - 1} et ${i} trop proches`);
    assert.ok(ATT[ATT.length - 1] < T.fin);
    for (const gk in GROUPES) assert.equal(Object.values(SEL).filter((x) => x === gk).length, GROUPES[gk].ids.length, gk);
    const faites = ATT.filter((a, k) => !SEL[k] || SEL[k + 1] !== SEL[k]);
    for (const a of faites) assert.equal(GUIDE_T.filter((g) => g[2] === a).length, 1, `${nom} : consigne de l'attente ${a}`);
    for (const [k, a] of ATT.entries()) assert.ok(GUIDE_T.find((x) => x[2] != null && x[2] >= a && x[0] < a), `${nom} : consigne affichée à l'attente ${k}`);
    for (const k of Object.keys(ECRIRE).map(Number)) assert.equal(OK[k + 1], ECRIRE[k].d, `${nom} : validation après l'écriture ${k}`);
    // une phrase qui n'attend aucun geste (« Une ligne s’écrit… », « La ligne devient… ») reste au moins une seconde
    for (let i = 1; i < GUIDE_T.length; i++) if (GUIDE_T[i - 1][2] == null) assert.ok(GUIDE_T[i][0] - GUIDE_T[i - 1][0] >= 1, `${nom} : « ${GUIDE_T[i - 1][1]} » trop courte`);
  }
  // à la fiche 40, « −𝑘 = 6 » reste 3 s avant « Prendre l’opposé », et le tutoriel finit sur lui
  const T = D.oppose.T;
  assert.equal(T.opp, D.oppose.ATT[14]); assert.equal(T.dernier, T.opp);
  const i = D.oppose.GUIDE_T.findIndex((g) => g[1] === CFG.oppose.textes.apresG1);
  assert.ok(D.oppose.GUIDE_T[i + 1][0] - D.oppose.GUIDE_T[i][0] >= 2.9);
  assert.equal(D.rouges.T.opp, null);
});

test("l'élève tape lui-même le jeton et les sommes ; les consignes ne donnent pas la réponse ; l'aide donne le calcul", () => {
  for (const [nom, cfg] of Object.entries(CFG)) {
    const { ECRIRE, GROUPES, GUIDE_T } = D[nom];
    assert.deepEqual(Object.keys(ECRIRE).map(Number), [1, 7, 12]);
    for (const gk in GROUPES) {
      const g = GROUPES[gk], k = Object.keys(ECRIRE).map(Number).find((n) => ECRIRE[n].d === g.dlg);
      const s = g.ids.reduce((a, id) => a + cfg.p[id][0], 0);
      assert.deepEqual(ECRIRE[k].ok, [signe(s)], `${nom} ${gk}`);
      const ctx = { expr: () => expr(cfg, g.ids) };
      for (const c of GUIDE_T.find((x) => x[3] === k)[1].call(ctx)) {
        assert.ok(c.startsWith("Combien font " + expr(cfg, g.ids) + " ?"), c);
        assert.ok(!/ \? .*\d/.test(c), `« ${c} » donne la réponse`);
      }
    }
    // « Quel jeton annule le 3 ? » ne dit pas −3 ; « … le −4 ? » ne dit pas 4 (seul)
    const rep = ECRIRE[1].ok[0], re = rep.startsWith("−") ? new RegExp(rep) : new RegExp("(^|[^−\\d])" + rep + "(?!\\d)");
    for (const txt of GUIDE_T.find((x) => x[3] === 1)[1]) assert.doesNotMatch(txt, re, `« ${txt} » donne la réponse`);
    for (const k in ECRIRE) {
      assert.equal(ECRIRE[k].aide.length, 2);
      for (const a of ECRIRE[k].aide) assert.ok(a.includes("tape " + ECRIRE[k].ok[0]), a);
      assert.match(ECRIRE[k].aide[0], /ou touche la case/);
    }
    // la consigne des jetons de droite ne dit pas combien ils font
    assert.doesNotMatch(GUIDE_T.find((x) => x[4] === "G1")[1], /\d/);
    assert.ok(GROUPES.G0.aide.endsWith("sont à gauche : touche-les."));
  }
  // une mauvaise touche n'écrit rien ; le signe « - » du clavier vaut « − » ; la case : l'aide d'abord ; Entrée valide
  assert.match(bloc, /saisir\(k,c\)\{if\(c==='-'\)c='−';/);
  assert.match(bloc, /if\(!ok\.some\(x=>x\.startsWith\(s\)\)\)\{this\.aide\[k\]=true;this\.montrer\(k\);return false;\}/);
  assert.match(bloc, /if\(bon\)\{if\(!this\.aide\[k\]\)\{this\.aide\[k\]=true;this\.indice=null;return false;\}/);
  assert.match(bloc, /if\(cle==='Enter'&&OK\[k\]\)/);
  // au téléphone, les trois pavés ont la touche « − »
  assert.equal((bloc.match(/\['pave',[^\]]*'moins'\]/g) || []).length, 3);
});

test("la ligne se réécrit à chaque regroupement, comme l'outil ; les phrases sous l'équation sont celles de l'outil", () => {
  for (const [nom, cfg] of Object.entries(CFG)) {
    const { LIGNE2, T } = D[nom];
    assert.deepEqual(LIGNE2.map((l) => l[0]), [T.ajoOk, T.ok0, T.ok1]);
    assert.deepEqual(LIGNE2.map((l) => l.slice(1, 3)), cfg.lignes.slice(1, 4).map((l) => l.slice(0, 2)));
    assert.equal(LIGNE2[2][3], !cfg.opp, `${nom} : la deuxième ligne est la solution seulement sans « Prendre l’opposé »`);
  }
  for (const p of ["Touche les jetons à regrouper, du même côté.", "Touche un autre jeton du même côté.",
    " jetons sélectionnés. Calcule leur somme pour les regrouper.", "Paire nulle : 0 apparaît, puis disparaît.",
    "La paire nulle vaut 0 : elle disparaît du plateau.", "'Jetons regroupés : '"]) assert.ok(bloc.includes(p), p);
  // relevées dans l'outil
  assert.ok(outil.includes("Touche les jetons à regrouper, ou une tache ${unknownHtml()} et une tache −${unknownHtml()}, du même côté."));
  assert.equal(CFG.oppose.regrouperVide, "Touche les jetons à regrouper, ou une tache 𝑘 et une tache −𝑘, du même côté.");
  assert.ok(outil.includes("Jetons regroupés : <strong>${formatSignedNumber(info.sum)}</strong>."));
  assert.ok(outil.includes('recordEquationStep(makeBothSidesOperation("×(−1)"));'));
});

test("fiche 40 : « Prendre l’opposé » à sa place, une rangée de plus au téléphone, la fenêtre « Ajouter » avec les taches", () => {
  const A = ajout(CFG.oppose), B = ajout(CFG.rouges);
  // ordinateur : Enlever · Ajouter · Prendre l’opposé · Annuler · Recommencer (relevé à 1440)
  assert.deepEqual(A.paysage.rangs.map((r) => r.id), ["enl", "ajo", "opp", "ann", "rec"]);
  for (let i = 1; i < 5; i++) assert.ok(A.paysage.rangs[i].x > A.paysage.rangs[i - 1].x + A.paysage.rangs[i - 1].w, "rangée à l'ordinateur");
  // téléphone : trois rangées (Enlever · Ajouter / Prendre l’opposé · Annuler / Recommencer) ; l'écran grandit de 47
  assert.deepEqual(A.portrait.rangs.map((r) => [r.id, r.x, Math.round(r.y)]), [["enl", 17, 500], ["ajo", 197.5, 500], ["opp", 17, 547], ["ann", 197.5, 547], ["rec", 17, 595]]);
  assert.equal(A.portrait.h - 660, 47); assert.equal(A.portrait.grille.h - B.portrait.grille.h, 47); assert.equal(A.portrait.act.y - B.portrait.act.y, 47);
  // la fiche 38 garde l'écran de l'étape É1
  assert.deepEqual(B.paysage.rangs.map((r) => r.id), ["enl", "ajo", "ann", "rec"]);
  assert.equal(B.portrait.h, undefined);
  // les couleurs du bouton, celles de l'outil (.oppositeBothToolBtn)
  assert.match(bloc, /opp:\{fond:'#faf7ff',bord:'rgba\(109,40,217,\.18\)',encre:'#4c1d95'\}/);
  assert.match(outil, /id="toolOppositeBoth" type="button" title="Prendre l’opposé de chaque côté">Prendre l’opposé</);
  // la fenêtre : « Un jeton » / « Des taches » au téléphone ; jeton à gauche, taches à droite à l'ordinateur
  assert.match(bloc, /o\.dAj=Q\.fenetre\(Y,o\.ecran,cfg\.opp\?fAjTaches\(port\):fAj\(port\),port\);/);
  for (const t of ["'texte','Un jeton'", "'texte','Des taches'", "'label','Ou des taches'", "'btn','Ajouter 1 tache'", "'tache',626.5,243.7,27,'𝑘',false", "'tache',732.5,243.7,27,'𝑘',true"]) assert.ok(bloc.includes(t), t);
  // l'écran commun sait dessiner ces cadres, ce trait et ces taches
  const eq = page.slice(page.indexOf("const ECRAN_EQ="), page.indexOf("FILMS.equasplat=(function(){"));
  for (const k of ["forme", "ligne", "tache"]) assert.ok(eq.includes(`else if(k==='${k}')`), k);
  // la tache et le jeton se retournent (0,3 s) ; à l'arrivée, la tache 𝑘 noire et le jeton −6
  assert.match(bloc, /const rv=cfg\.opp&&apres\(T\.opp\)\?P\(t,T\.opp\+\.001,\.3,F\.lin\):0/);
  assert.match(bloc, /Q\.tache\(Y,o\.tache2,tc,Y\.tRB,cfg\.lettre,false\)/);
  assert.match(bloc, /const n=o\.nes\.G1,pc=Q\.piece\(Y,G,-n\.v,Y\.jR,true,true\)/);
});

test("phrases pour l'élève : guillemets avec espaces insécables, aucun mot genré", () => {
  const textes = [];
  const fouiller = (x) => { if (typeof x === "string") textes.push(x); else if (Array.isArray(x)) x.forEach(fouiller); else if (x && typeof x === "object") Object.values(x).forEach(fouiller); };
  fouiller(CFG);
  for (const d of Object.values(D)) for (const g of d.GUIDE_T) if (typeof g[1] !== "function") fouiller(g[1]);
  for (const t of textes) {
    assert.doesNotMatch(t, /« |«$| »/, `« ${t} » : espace ordinaire dans les guillemets`);
    assert.doesNotMatch(t, /\b(il|elle|lui|seul|seule|prêt|prête|venu|venue)\b/i, `« ${t} » : mot genré`);
  }
  assert.ok(textes.some((t) => t.includes("« Prendre l’opposé »")));
});
