// Le film « Deux taches » de Petit SPLAT!, étape 4 (lot 7 « aides et carte », 08/11/2026) : l'exemple 2𝑥 + 3 = 13 choisi
// par Gwenaël, hors de la série de l'étape ; un arrêt sur la question SANS montrer comment partager (choix du 09/10),
// puis la vérification : 5 et 5, les deux taches s'éclaircissent, on compte 5 jetons sous chacune. Un film, pas un
// tutoriel. Sur la carte (« Le film », 43 s) et derrière « ? Comment faire » dans Petit SPLAT! à l'étape 4.
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

/* les données du film (CARTE, T, SOUS_TITRES), lues telles quelles dans son bloc */
function donnees() {
  const src = ["CARTE", "T", "SOUS_TITRES"].map((n) => {
    const a = bloc.indexOf(`const ${n}=`);
    const b = bloc.indexOf(";\n", a);
    return bloc.slice(a, b + 1);
  }).join("\n");
  return new Function(`${src}; return {CARTE,T,SOUS_TITRES};`)();
}
const { CARTE, T, SOUS_TITRES } = donnees();

test("le film s'inscrit dans le lecteur, sur la carte sous l'étape 4, et derrière « ? Comment faire »", () => {
  assert.ok(bloc, "FILMS['deux-taches'] dans outils/splat_intro.html");
  assert.match(carte, /p:"m1e4",\n\s*films:\[\["deux-taches","Le film",43\]\],/);
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
  assert.equal(Number(bloc.match(/duration:([\d.]+)/)[1]), 43);
  assert.equal(T.fin + 3.4, 43);
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

test("un seul arrêt, sur la question, avant toute réponse ; le film ne montre jamais comment partager", () => {
  const stops = [...bloc.matchAll(/stops:\[([^\]]*)\]/g)].map((m) => m[1]);
  assert.deepEqual(stops, ["{t:T.stop}"]);
  assert.ok(T.question < T.stop && T.stop < T.rep && T.rep < T.tapeG1, "la question, l'arrêt, puis la réponse");
  // la question reste à l'écran pendant l'arrêt
  const avant = SOUS_TITRES.filter((s) => s[0] <= T.stop).at(-1);
  assert.equal(avant[1], "Combien de jetons sous chaque tache ?");
  // pas de partage : ni 10 (13 − 3), ni division, ni moitié, ni soustraction écrite
  for (const [, s] of SOUS_TITRES) assert.doesNotMatch(s, /\b10\b|÷|:\s*2|moitié|partag|divis|−|\bmoins\b/, s);
  assert.doesNotMatch(bloc.replace(/\/\*[\s\S]*?\*\//g, ""), /'10'|13 − 3|10 ÷ 2/);
  // la réponse arrive dans les cases grises après l'arrêt seulement
  assert.match(bloc, /ecrit\(cs,t>=tt\?'5':\(t>=T\.q\?'\?':''\)/);
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
  assert.doesNotMatch(bloc, /E\('text'/);
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
