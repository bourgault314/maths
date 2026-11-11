// Le film « Deux taches » de Petit SPLAT!, étape 4 (lot 7 « aides et carte », 08/11/2026) : l'exemple 2𝑥 + 3 = 13 choisi
// par Gwenaël, hors de la série de l'étape ; un arrêt sur la question SANS montrer comment partager (choix du 09/10),
// puis la vérification : 5 et 5, les deux taches s'éclaircissent, on compte 5 jetons sous chacune. Un film, pas un
// tutoriel. Sur la carte (« Le film », 65 s) et derrière « ? Comment faire » dans Petit SPLAT! à l'étape 4.
// Lot 9 (09/11/2026, croquis validé par Gwenaël ; remplace la correction du lot 7b, qui ne coupait jamais le 13) : APRÈS
// l'arrêt, une scène « en barres » à part, comme le film des paquets — 13 se décompose en 3 et 10, les deux 3 hachurés
// puis retirés, 10 partagé en deux parts égales (5 et 5), les « ? » restent des « ? » et « ? = 5 » s'écrit à part ; puis
// retour au jeu : le doigt écrit 5 et 5, Valider, on compte 5 sous chaque tache.
// Lot 10 (choix de Gwenaël du 10/11, redit le 11/11 ; il remplace le « aucun crochet » du 09/11) : le 13 monte au-dessus
// de 3 et 10, dans une accolade, exactement comme le 60 du film des paquets, et part avec le retrait des deux 3.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
const bloc = blocs.find((b) => b.includes("FILMS['deux-taches']=(function(){"));
const ecranPS = blocs.find((b) => b.includes("const ECRAN_PS=(function(){"));

const paquets = blocs.find((b) => b.includes("FILMS.paquets=(function(){"));

/* les données du film (CARTE, T, DUR, SOUS_TITRES), lues telles quelles dans son bloc */
function donnees() {
  const src = ["CARTE", "T", "DUR", "SOUS_TITRES", "SCENE", "CB"].map((n) => {
    const a = bloc.indexOf(`const ${n}=`);
    const b = bloc.indexOf(";\n", a);
    return bloc.slice(a, b + 1);
  }).join("\n");
  return new Function(`${src}; return {CARTE,T,DUR,SOUS_TITRES,SCENE,CB};`)();
}
const { CARTE, T, DUR, SOUS_TITRES, SCENE, CB } = donnees();
const sansCommentaires = (b) => b.replace(/\/\*[\s\S]*?\*\//g, "");

test("le film s'inscrit dans le lecteur, sur la carte sous l'étape 4, et derrière « ? Comment faire »", () => {
  assert.ok(bloc, "FILMS['deux-taches'] dans outils/splat_intro.html");
  assert.match(carte, /p:"m1e4",\n\s*films:\[\["deux-taches","Le film",65\]\],/);
  const E = (() => {
    const ctx = { window: {}, localStorage: { getItem: () => null, setItem() {} }, location: { search: "" } };
    vm.runInNewContext(lire("assets/js/splat-etapes.js"), ctx);
    return ctx.window.MathsGoSplatEtapes;
  })();
  assert.equal(E.AIDES.m1e4, "deux-taches");
  const j = "/outils/splat_tache_barre.html?support=eleve&parcours=m1e4";
  assert.equal(E.aide("m1e4", j), "/outils/splat_intro.html?film=deux-taches&suite=" + encodeURIComponent(j) + "&depuis=jeu");
  // un film, pas un tutoriel : ni attentes ni « À toi de faire » ; « Passer le film › » ; le crédit
  assert.doesNotMatch(bloc, /attentes:|aToi|taper\(|toucher\(/);
  assert.ok(bloc.includes("passerTexte:'Passer le film ›'"));
  assert.ok(bloc.includes("credit:'Jeu SPLAT! créé par <a href=\"https://stevewyborney.com\" target=\"_blank\" rel=\"noopener\">Steve Wyborney</a>'"));
  assert.match(bloc, /modes:\{paysage:\{w:1600,h:900\},portrait:\{w:900,h:1600\}\}/);
  // la durée de la carte est celle du film
  const duree = Number(bloc.match(/duration:([\d.]+)/)[1]);
  assert.equal(duree, 65);
  assert.equal(T.fin + 3.4, duree);
  assert.equal(Number(carte.match(/films:\[\["deux-taches","Le film",(\d+)\]\]/)[1]), Math.round(duree), "la durée de la carte = la durée du film");
});

test("l'exemple de Gwenaël : 2𝑥 + 3 = 13, 5 jetons sous chaque tache, hors de la série de l'étape 4", () => {
  assert.equal(CARTE.total, 13);
  assert.equal(CARTE.visible, 3);
  assert.equal(CARTE.n, 2);
  assert.equal(CARTE.cache, 10);
  assert.equal(CARTE.visibles.length, 3);
  assert.equal(CARTE.caches.length, 10, "5 sous chaque tache");
  assert.equal(CARTE.trouve, true, "exercise=find_hidden : le total est dans la petite case");
  const serie = JSON.parse(carte.match(/p:"m1e4",\n\s*films:[^\n]*\n\s*eqs:(\[[^\]]*\])/)[1]);
  assert.equal(serie.length, 12);
  assert.ok(!serie.includes("2𝑥 + 3 = 13"), "l'exemple est hors de la série");
  // les jetons ne se chevauchent pas, et restent dans la carte 300 × 200
  const tous = [...CARTE.visibles, ...CARTE.caches];
  for (const [x, y] of tous) assert.ok(x >= 8 && x <= 292 && y >= 8 && y <= 192, `${x},${y}`);
  for (let i = 0; i < tous.length; i++) for (let j = i + 1; j < tous.length; j++)
    assert.ok(Math.hypot(tous[i][0] - tous[j][0], tous[i][1] - tous[j][1]) >= 16.5, `${tous[i]} / ${tous[j]}`);
  // les 5 premiers sous la tache de gauche, les 5 suivants sous celle de droite
  for (const [x] of CARTE.caches.slice(0, 5)) assert.ok(x < 130);
  for (const [x] of CARTE.caches.slice(5)) assert.ok(x > 130);
});

test("un seul arrêt, sur la question ; AVANT l'arrêt, le film ne montre jamais comment partager", () => {
  const stops = [...bloc.matchAll(/stops:\[([^\]]*)\]/g)].map((m) => m[1]);
  assert.deepEqual(stops, ["{t:T.stop}"]);
  assert.ok(T.question < T.stop && T.stop < T.rep, "la question, l'arrêt, puis la correction");
  // la question reste à l'écran pendant l'arrêt
  const avant = SOUS_TITRES.filter((s) => s[0] <= T.stop).at(-1);
  assert.equal(avant[1], "Combien de jetons sous chaque tache ?");
  // avant l'arrêt : pas de partage — ni 10 (13 − 3), ni division, ni moitié, ni soustraction écrite (choix du 09/10)
  for (const [t, s] of SOUS_TITRES) if (t <= T.stop)
    assert.doesNotMatch(s, /\b10\b|÷|:\s*2|moitié|partag|divis|−|\bmoins\b|retir/, s);
  assert.doesNotMatch(sansCommentaires(bloc), /10 ÷ 2|÷/);
  // tout ce que la correction montre commence après l'arrêt (et après la reprise)
  for (const n of ["rep", "barres", "dec", "decoupe", "hachTxt", "hachure", "retTxt", "retire", "part", "coupe", "split", "cache", "egal",
    "retour", "caseG1", "tapeG1", "caseG2", "tapeG2"])
    assert.ok(T[n] > T.stop, `T.${n} après l'arrêt`);
  // chaque phrase, puis son geste ; chaque geste fini avant la phrase suivante
  const suite = [["rep", "barres", "morph"], ["dec", "decoupe", "split"], ["hachTxt", "hachure", "hachure"], ["retTxt", "retire", "retire"],
    ["part", "coupe", "coupe"], ["cache", "egal", "egal"]];
  for (let i = 0; i < suite.length; i++) {
    const [ph, ge, d] = suite[i];
    assert.ok(T[ph] < T[ge], `${ph} avant ${ge}`);
    const finGeste = ge === "coupe" ? T.split + DUR.parts : T[ge] + DUR[d];
    const prochaine = i + 1 < suite.length ? T[suite[i + 1][0]] : T.retour;
    assert.ok(finGeste + .4 <= prochaine + 1e-9, `une pause après « ${ph} »`);
  }
  assert.ok(T.coupe + DUR.coupe <= T.split, "le trait, puis 5 et 5");
  // retour au jeu avant que le doigt arrive (il entre 0,6 s avant de toucher la première case grise)
  assert.ok(T.retour + .5 + DUR.pIn <= T.caseG1 - .6 + 1e-9);
  // les 5 n'arrivent dans les cases grises du jeu que quand le doigt les écrit (après la scène)
  assert.match(bloc, /ecrit\(cs,t>=tt\?'5':\(t>=T\.q\?'\?':''\),t>=tt\?tt:T\.q\+i\*\.2\);/);
  // rien de la scène avant l'arrêt : elle n'est visible qu'à partir de T.barres
  assert.match(bloc, /const vuScene=t>=T\.barres&&sOut<1;\s*op\(o\.barres,vuScene\?1-sOut:0\);/);
});

test("après l'arrêt, la correction en barres du croquis : décomposer 13, hachurer et retirer les 3, partager 10, « ? = 5 »", () => {
  const apres = SOUS_TITRES.filter((s) => s[0] > T.stop).slice(0, 6);
  assert.deepEqual(apres, [[T.rep, "La même situation, en barres."], [T.dec, "On décompose 13 en 3 et 10."],
    [T.hachTxt, "On hachure les deux morceaux de 3."], [T.retTxt, "On retire les deux morceaux de 3 : 13 − 3 = 10."],
    [T.part, "On partage 10 en deux parts égales : 5 et 5."], [T.cache, "Chaque tache cache 5."]]);
  // les nombres des phrases sont ceux de la carte
  const [, d13, d3, d10] = apres[1][1].match(/décompose (\d+) en (\d+) et (\d+)/).map(Number);
  assert.deepEqual([d13, d3, d10], [CARTE.total, CARTE.visible, CARTE.cache]);
  const [, tot, vis, reste] = apres[3][1].match(/(\d+) − (\d+) = (\d+)/).map(Number);
  assert.deepEqual([tot, vis, reste], [CARTE.total, CARTE.visible, CARTE.cache]);
  const [, dix, a, b] = apres[4][1].match(/partage (\d+) en deux parts égales : (\d+) et (\d+)/).map(Number);
  assert.deepEqual([dix, a, b], [CARTE.cache, CARTE.cache / CARTE.n, CARTE.cache / CARTE.n]);
  assert.equal(CARTE.n, 2, "« deux parts » : deux taches");
  // une scène à part (o.barres, dans le cadre), pas dans le schéma du jeu ; l'écran du jeu s'efface puis revient
  assert.match(bloc, /o\.barres=E\('g',\{\},svg\);/);
  assert.match(bloc, /if\(t>=T\.barres\)op\(o\.ecran,t<T\.retour\?1-mo:pIn\);/);
  // le schéma : 13 en haut ; 3 (bleu), ?, ? en bas ; les largeurs disent les quantités
  assert.match(bloc, /o\.sHaut=cse\(o\.R\.haut,'#ffffff',String\(CARTE\.total\),CB\.encre\);/);
  assert.match(bloc, /o\.sB3=cse\(o\.R\.b3,'#ffffff',String\(V\),CB\.bleuTxt\);/);
  assert.match(bloc, /o\.sQ=\[o\.R\.q1,o\.R\.q2\]\.map\(Rc=>\{const c=cse\(Rc,CB\.gris,'\?',CB\.encre\);/);
  // 13 se décompose en 3 et 10, le 3 du haut juste au-dessus du 3 du bas
  assert.match(bloc, /o\.sH3=cse\(o\.R\.h3,'#ffffff',String\(V\),CB\.encre\);o\.sH10=cse\(o\.R\.h10,'#ffffff',String\(CARTE\.cache\),CB\.encre\);/);
  assert.match(bloc, /h3:R\(B\.x0,B\.y1,V\*u\),h10:R\(B\.x0\+V\*u,B\.y1,CARTE\.cache\*u\)/);
  assert.match(bloc, /b3:R\(B\.x0,B\.ym,V\*u\)/);
  // les DEUX morceaux de 3 sont hachurés, puis retirés
  assert.match(bloc, /o\.hach=\[o\.R\.h3,o\.R\.b3\]\.map\(/);
  assert.match(bloc, /op\(o\.sH3\.g,dIn\*\(1-hc\)\*vu3\);op\(o\.sB3\.g,\(1-hc\)\*vu3\);/);
  // 10 se partage en deux parts égales, côte à côte, chacune au-dessus de sa case grise
  assert.match(bloc, /h5a:R\(B\.x0\+V\*u,B\.y1,M\*u\),h5b:R\(B\.x0\+\(V\+M\)\*u,B\.y1,M\*u\)/);
  assert.match(bloc, /q1:R\(B\.x0\+V\*u,B\.ym,M\*u\),q2:R\(B\.x0\+\(V\+M\)\*u,B\.ym,M\*u\)/);
  assert.match(bloc, /o\.sH5=\[o\.R\.h5a,o\.R\.h5b\]\.map\(Rc=>cse\(Rc,'#ffffff',String\(M\),CB\.encre\)\);/);
  // les « ? » du bas restent des « ? » : rien n'écrit dans les cases grises de la scène ; « ? = 5 » à part, en vert
  const sQ = bloc.slice(bloc.indexOf("o.sQ=[o.R.q1,o.R.q2]"), bloc.indexOf("return c;});", bloc.indexOf("o.sQ=[o.R.q1,o.R.q2]")));
  assert.doesNotMatch(sQ, /textContent/, "les cases grises de la scène gardent leur « ? »");
  assert.doesNotMatch(bloc.slice(bloc.indexOf("render(t){")), /o\.sQ[\s\S]{0,80}textContent|\.t\.textContent=/, "rien ne réécrit les « ? » pendant le film");
  assert.match(bloc, /o\.egal\.textContent='\? = '\+M;/);
  assert.equal(CB.vertTxt, "#15803d");
});

test("l'accolade du 13 : comme le 60 du film des paquets (même trait, même taille, même rythme), partie avec les deux 3", () => {
  const code = sansCommentaires(bloc), codeP = sansCommentaires(paquets);
  // le même trait : trois segments au-dessus de toute la barre, gris ardoise, épaisseur 3
  assert.ok(code.includes("E('path',{d:`M${B.x0},${B.y1-12}V${B.y1-24}H${B.x1}V${B.y1-12}`,fill:'none',stroke:'#475569','stroke-width':3},o.acc);"));
  assert.ok(codeP.includes("E('path',{d:`M${S.x0},${S.y1-12}V${S.y1-24}H${S.x1}V${S.y1-12}`,fill:'none',stroke:'#475569','stroke-width':3},o.acc);"));
  // son nombre : le total, à la même hauteur et à la même taille que le 60
  assert.match(code, /o\.accC=\[\(B\.x0\+B\.x1\)\/2,B\.y1-24-B\.acc\*\.62\];/);
  assert.match(codeP, /y:S\.y1-24-S\.acc\*\.62,/);
  assert.match(code, /Z\.chiffre\(o\.acc,o\.accC\[0\],o\.accC\[1\],B\.acc,CB\.encre\)\.textContent=String\(CARTE\.total\);/);
  const LAY = new Function(`${paquets.match(/const LAY=\{[\s\S]*?\n\};/)[0]} return LAY;`)();
  for (const m of ["paysage", "portrait"]) assert.equal(SCENE[m].acc, LAY[m].S.acc, m);
  // le même rythme : le 13 monte pendant la découpe (DUR.split, comme le 60) et grandit/rapetisse jusqu'à la taille de
  // l'accolade ; l'accolade prend le relais à la fin du geste
  assert.equal(DUR.split, 2.0);
  assert.match(code, /o\.sHaut\.t\.setAttribute\('y',L\(c\.y\+c\.h\/2\+B\.val\*\.355,o\.accC\[1\]\+B\.acc\*\.355,dp\)/);
  assert.match(code, /o\.sHaut\.t\.setAttribute\('font-size',L\(B\.val,B\.acc,dp\)/);
  assert.match(codeP, /o\.sHaut\.t\.setAttribute\('font-size',L\(S\.val,S\.acc,sp\)\);op\(o\.sHaut\.t,sp>=1\?0:1\);/);
  assert.match(code, /op\(o\.sHaut\.t,dp>=1\?0:1\);op\(o\.acc,dp>=1\?1-rm:0\);/);
  // 3 et 10 n'arrivent qu'une fois le 13 sorti de la barre (à mi-chemin, on lisait « 13 10 » : le 10 naît juste à côté)
  assert.match(code, /const dIn=clamp\(\(dp-\.45\)\/\.55\);/);
  assert.match(code, /op\(o\.sH10\.g,dIn\*\(1-pa\)\);/);
  // elle part avec le retrait des deux 3 (comme celle du 60 avec le retrait des deux 38), et pas après
  assert.match(codeP, /op\(o\.acc,sp>=1\?1-rm:0\);/);
  // la découpe se fait pendant « On décompose 13 en 3 et 10. » ; le retrait, pendant « On retire… »
  assert.ok(T.dec < T.decoupe && T.decoupe + DUR.split <= T.hachTxt && T.retTxt < T.retire);
});

test("la scène en barres copie le film des paquets : mise en page, couleurs, hachures, rythme du retrait", () => {
  // la mise en page du schéma (ordinateur et téléphone) = celle du film des paquets
  const LAY = new Function(`${paquets.match(/const LAY=\{[\s\S]*?\n\};/)[0]} return LAY;`)();
  for (const m of ["paysage", "portrait"]) {
    const { x0, x1, y1, ym, y2, val, acc } = LAY[m].S;
    assert.deepEqual({ x0, x1, y1, ym, y2, val, acc }, (({ x0, x1, y1, ym, y2, val, acc }) => ({ x0, x1, y1, ym, y2, val, acc }))(SCENE[m]), m);
    assert.ok(SCENE[m].egal > SCENE[m].y2, "« ? = 5 » sous le schéma");
  }
  // les couleurs = celles du film des paquets
  const Cp = new Function(`${paquets.match(/const C=\{[^;]*\};/)[0]} return C;`)();
  for (const c of ["encre", "bleuTxt", "gris", "vertTxt"]) assert.equal(CB[c], Cp[c], c);
  // les hachures
  const motif = (b, id) => {
    const m = b.match(new RegExp(`pat=E\\('pattern',\\{id:'${id}',([^}]*)\\},defs\\);\\s*(E\\('rect'[^\\n]*)`));
    assert.ok(m, id);
    return [m[1], m[2].replaceAll(id, "ID")];
  };
  assert.deepEqual(motif(bloc, "dtHachures"), motif(paquets, "paqHachures"));
  assert.match(bloc, /fill:'url\(#dtHachures\)',stroke:'#111827','stroke-width':3\.5/);
  assert.match(bloc, /o\.hach\.forEach\(g=>\{op\(g,\.4\*hc\*vu3\);/, "estompé à 40 % comme dans le jeu, puis retiré");
  assert.match(bloc, /const dx=-1\.2\*R\.b3\.w\*rm/, "retiré vers la gauche, comme le film des paquets");
  // le rythme : morph, découpe, hachure, retrait, retour
  const DURp = new Function(`${paquets.match(/const DUR=\{[^}]*\};/)[0]} return DUR;`)();
  for (const d of ["morph", "split", "hachure", "retire"]) assert.equal(DUR[d], DURp[d], d);
  assert.match(paquets, /sOut=P\(t,T\.retour,\.7,F\.lin\),pIn=P\(t,T\.retour\+\.5,1\.0,F\.io\)/);
  assert.equal(DUR.sOut, .7);
  assert.equal(DUR.pIn, 1.0);
  // la colonne qui reste vient au milieu, comme la colonne du 22
  assert.match(bloc, /o\.dc=\(B\.x0\+B\.x1\)\/2-\(o\.R\.h10\.x\+o\.R\.h10\.w\/2\);/);
});

test("on vérifie : on valide, les deux taches s'éclaircissent, on compte 5 jetons sous chacune", () => {
  assert.ok(T.valide > T.tapeG2);
  assert.match(bloc, /tc\.setAttribute\('opacity',ok\?L\(1,\.15,P\(t,T\.valide,\.7,F\.io\)\)\.toFixed\(3\):1\)/);
  assert.match(bloc, /o\.c1=CARTE\.caches\.slice\(0,5\)\.map\(\(q,j\)=>anneau\(q,T\.c1\+j\*T\.pasC,T\.cpt1Out\)\);/);
  assert.match(bloc, /o\.c2=CARTE\.caches\.slice\(5\)\.map\(\(q,j\)=>anneau\(q,T\.c2\+j\*T\.pasC,T\.cpt2Out\)\);/);
  assert.ok(T.c1 > T.valide + .7, "on compte quand la tache s'est éclaircie");
  assert.ok(T.c1 + 4 * T.pasC < T.cpt1Out && T.cpt1Out < T.cpt2 && T.c2 + 4 * T.pasC < T.cpt2Out);
  assert.equal(SOUS_TITRES.find((s) => s[0] === T.bravo)[1], "Il y a bien 5 jetons sous chaque tache !");
});

test("les règles des films du monde 1 : pas de chiffre sur un jeton, « cachés », 3 s par phrase, une pause après chaque geste", () => {
  // compter = un anneau doré qui s'allume, et le compteur ; aucun texte posé sur un jeton
  assert.match(bloc, /stroke:Z\.C\.or,'stroke-width':3\}/);
  assert.doesNotMatch(bloc, /E\('text'/);   // les nombres du schéma passent par Z.chiffre
  assert.doesNotMatch(bloc, /invisible/i);
  // chaque phrase reste au moins 3 s
  for (let i = 0; i < SOUS_TITRES.length - 1; i++)
    assert.ok(SOUS_TITRES[i + 1][0] - SOUS_TITRES[i][0] >= 3 - 1e-9, `« ${SOUS_TITRES[i][1]} »`);
  assert.equal(SOUS_TITRES.at(-1)[0], T.fin);
  // chaque geste du doigt est suivi d'une pause (au moins 0,4 s avant le suivant)
  const gestes = [T.caseT, T.t1, T.t3, T.caseV, T.tapeV, T.caseG1, T.tapeG1, T.caseG2, T.tapeG2, T.valide].sort((a, b) => a - b);
  for (let i = 1; i < gestes.length; i++) assert.ok(gestes[i] - gestes[i - 1] >= .4 - 1e-9, `${gestes[i - 1]} → ${gestes[i]}`);
  // aucun mot genré dans ce que l'élève lit
  const lu = SOUS_TITRES.map((s) => s[1]).join(" ") + " " + (bloc.match(/Z\.cartons\(o,Y,svg,([^\n]*)\);/) || [""])[0];
  assert.doesNotMatch(lu, /\b(il|elle) (a|est|doit)\b|\b(prêt|prête|seul|seule|venu|venue|lui)\b/i);
});

test("l'écran commun sait l'étape 4 : le total dans la petite case, la case du haut vide (c.trouve) ; l'étape 2 ne change pas", () => {
  assert.ok(ecranPS.includes("texte:c.trouve?String(c.total):null"));
  assert.ok(ecranPS.includes("texte:c.trouve?null:String(c.total)"));
  // relevé dans l'outil (08/11) : la petite case de l'étape 4 n'est pas celle de l'étape 2
  assert.ok(bloc.includes("paysage:{badge:{x:985,y:111,w:72,h:72,fs:36,ring:3}"));
  assert.ok(bloc.includes("portrait:{badge:{x:322,y:98,w:38,h:38,fs:18,ring:3}"));
  assert.ok(bloc.includes("places:[{x:75,y:115,s:.6},{x:185,y:115,s:.6}]"));
  // « Dessine les jetons » n'a pas de c.trouve : son écran reste le même
  const dessine = blocs.find((b) => b.includes("FILMS.dessine=(function(){"));
  assert.doesNotMatch(dessine, /trouve/);
});

test("au téléphone, la bulle de l'arrêt se pose dans le blanc entre les taches et le schéma, pas sur le pavé", () => {
  assert.match(bloc, /bulleHaut:53\.2,/);
  assert.ok(page.includes(".player.portrait .pill.placee{top:var(--bulle-haut);bottom:auto;transform:translate(-50%,-50%)}"));
  assert.ok(page.includes("pill.classList.toggle('placee',m==='portrait'&&film.bulleHaut!=null);if(film.bulleHaut!=null)pill.style.setProperty('--bulle-haut',film.bulleHaut+'%');"));
  // les autres films ne bougent pas : aucun autre n'a bulleHaut
  assert.equal((page.match(/bulleHaut:/g) || []).length, 1);
});
