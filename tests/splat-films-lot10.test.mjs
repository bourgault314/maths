// Lot 10 « aides et carte », réduit le 11/11/2026 (choix de Gwenaël) : deux films seulement.
// 1. Le film des paquets ralenti (« on a du mal à lire et en même temps suivre ») : chaque phrase reste au moins 3 s, une
//    courte pause après chaque geste ; les gestes eux-mêmes ne changent pas (c'est le film de Gwenaël, son animation v6) ;
//    l'arrêt reste sur « Que cache la tache ? » ; les bruitages suivent leurs gestes ; la carte dit la nouvelle durée.
// 2. Le schéma en barres remonté sous le texte (le texte ne bouge pas), à la même place dans les films des paquets et
//    « Deux taches », en laissant la place de l'accolade et de son nombre.
// (3. L'accolade du 13 dans « Deux taches » : tests/splat-film-deux-taches.test.mjs.)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
const paquets = blocs.find((b) => b.includes("FILMS.paquets=(function(){"));
const deux = blocs.find((b) => b.includes("FILMS['deux-taches']=(function(){"));
const ecranPS = blocs.find((b) => b.includes("const ECRAN_PS=(function(){"));
const sansCommentaires = (b) => b.replace(/\/\*[\s\S]*?\*\//g, "");

/* les données du film des paquets, lues telles quelles dans son bloc */
const morceau = (b, debut, fin) => { const a = b.indexOf(debut); assert.ok(a >= 0, debut); return b.slice(a, b.indexOf(fin, a) + fin.length); };
const P = new Function(`${morceau(paquets, "const T={", "};")}
  ${morceau(paquets, "const VOL=", ";")}
  ${morceau(paquets, "const DUR=", ";")}
  ${morceau(paquets, "T.hop=", ";")}
  ${morceau(paquets, "const SOUS_TITRES=", "]];")}
  ${morceau(paquets, "const LAY={", "\n};")}
  const sons=${morceau(paquets, "sons:[", "}],").slice(5, -1)};
  return {T,VOL,DUR,SOUS_TITRES,LAY,sons};`)();
const { T, VOL, DUR, SOUS_TITRES, LAY, sons } = P;
const duree = Number(paquets.match(/duration:([\d.]+)/)[1]);

test("le film des paquets : chaque phrase reste au moins 3 s, les mêmes 19 phrases, la carte dit la nouvelle durée", () => {
  // les phrases de Gwenaël, dans le même ordre, sans en ajouter ni en retirer
  assert.deepEqual(SOUS_TITRES.map((s) => s[1]), ["Le total de tous les jetons est 60.", "On range les jetons en paquets.",
    "Un paquet de 18 jetons…", "…devient un seul jeton, qui vaut 18.", "Un paquet de 20 jetons…", "…devient un seul jeton, qui vaut 20.",
    "Et le dernier paquet…", "La tache arrive !", "Que cache la tache ?", "La même situation, en barres.", "18 + 20 = 38", "60 = 38 + 22",
    "On hachure les deux morceaux de 38.", "On retire les deux morceaux de 38.", "La tache cache 22 : 60 − 38 = 22.",
    "Vérifions sur le plateau.", "Sous la tache : le jeton 22.", "18 + 20 + 22 = 60", "La tache cachait bien 22.", ""]);
  for (let i = 0; i < SOUS_TITRES.length - 1; i++)
    assert.ok(SOUS_TITRES[i + 1][0] - SOUS_TITRES[i][0] >= 3 - 1e-9, `« ${SOUS_TITRES[i][1]} » : ${(SOUS_TITRES[i + 1][0] - SOUS_TITRES[i][0]).toFixed(2)} s`);
  assert.equal(SOUS_TITRES.at(-1)[0], T.fin);
  // le carton de fin garde ses 3,5 s ; la carte dit la durée du film
  assert.equal(duree, T.fin + 3.5);
  assert.equal(duree, 65);
  assert.match(carte, /p:"m2e4",\n\s*films:\[\["paquets","Le film",65\]\],/);
  // les chapitres suivent les instants du film (plus de temps écrits en dur)
  assert.match(paquets, /chapters:\[\{t:0,name:'SPLAT!'\},\{t:T\.ecran,name:'Les paquets de jetons'\},\{t:T\.dernier,name:'La tache arrive'\},\{t:T\.barres,name:'Le schéma en barres'\},\s*\{t:T\.hachure,name:'On retire 38'\},\{t:T\.retour,name:'Vérifier sur le plateau'\},\{t:T\.fin,name:'À toi de jouer'\}\]/);
});

test("le film des paquets : les gestes de Gwenaël ne changent pas, une courte pause après chacun", () => {
  // mêmes durées pour chaque transformation
  assert.deepEqual(DUR, { morph: 2.4, fusion: 2.4, split: 2.0, hachure: .6, retire: 1.8, solve: 1.0 });
  assert.equal(VOL, 2);
  assert.equal(T.popPas, .02);
  assert.equal(T.comptePas, .075);
  // chaque phrase arrive avant (ou avec) son geste, et le geste est fini au moins 0,4 s avant la phrase suivante
  const ph = (txt) => SOUS_TITRES.find((s) => s[1] === txt)[0];
  const gestes = [
    ["Le total de tous les jetons est 60.", T.pop, T.pop + 59 * T.popPas + .3],                          // les 60 jetons arrivent
    ["On range les jetons en paquets.", T.range, T.range + .04 * 2 + .25 + .8],                         // ils se rangent
    ["Un paquet de 18 jetons…", T.comptes[0], T.comptes[0] + 17 * T.comptePas + .3],                       // on compte 18
    ["…devient un seul jeton, qui vaut 18.", T.fonds[0], T.fonds[0] + .4 + .45],                         // il devient le jeton 18
    ["Un paquet de 20 jetons…", T.comptes[1], T.comptes[1] + 19 * T.comptePas + .3],
    ["…devient un seul jeton, qui vaut 20.", T.fonds[1], T.fonds[1] + .4 + .45],
    ["La même situation, en barres.", T.barres, T.barres + DUR.morph],
    ["18 + 20 = 38", T.regroupe, T.regroupe + DUR.fusion],
    ["60 = 38 + 22", T.split, T.split + DUR.split],
    ["On hachure les deux morceaux de 38.", T.hachure, T.hachure + DUR.hachure],
    ["On retire les deux morceaux de 38.", T.retire, T.retire + DUR.retire],
    ["La tache cache 22 : 60 − 38 = 22.", T.solve, T.solve + .25 + .4],
    ["Vérifions sur le plateau.", T.retour, T.retour + .5 + 1.0],
    ["Sous la tache : le jeton 22.", T.revele, T.revele + 1.6],
    ["18 + 20 + 22 = 60", T.total, T.total + 1.1 + .4]];
  for (const [txt, debut, fin] of gestes) {
    const i = SOUS_TITRES.findIndex((s) => s[1] === txt);
    assert.ok(ph(txt) <= debut + 1e-9, `« ${txt} » avant son geste`);
    assert.ok(fin + .4 <= SOUS_TITRES[i + 1][0] + 1e-9, `une pause après le geste de « ${txt} »`);
  }
  // le comptage du paquet ne déborde pas sur sa fusion
  assert.ok(T.comptes[0] + 17 * T.comptePas + .4 <= T.fonds[0] && T.comptes[1] + 19 * T.comptePas + .4 <= T.fonds[1]);
});

test("le film des paquets : la tache arrive comme avant, l'arrêt reste sur « Que cache la tache ? »", () => {
  // tout ce qui suit la marche de la tache garde exactement son écart avec elle (le film du 15/10)
  const ecart = (x) => +(x - T.hop).toFixed(6);
  assert.equal(ecart(T.impact), VOL + 2.05);
  assert.equal(ecart(T.comptes[2]), 1.65);
  assert.equal(ecart(T.coupe), 2.85);
  assert.equal(ecart(T.fonds[2]), 3.2);
  assert.equal(ecart(T.arrive), VOL + .65, "« La tache arrive ! » quand elle saute");
  // « Et le dernier paquet… » arrive juste avant que la tache entre ; le troisième compteur n'atteint jamais 22
  assert.ok(T.dernier < T.hop && T.hop - T.dernier <= .5);
  assert.ok(Math.floor((T.coupe - T.comptes[2]) / T.comptePas) + 1 < 22);
  // le jeton 20 est fini avant que la tache entre
  assert.ok(T.fonds[1] + .85 < T.hop);
  // l'arrêt : 1,3 s après la question, comme avant ; la question reste à l'écran pendant l'arrêt ; la suite 1,7 s après
  assert.match(paquets, /stops:\[\{t:T\.stop\}\]/);
  assert.equal(+(T.stop - T.question).toFixed(6), 1.3);
  assert.equal(SOUS_TITRES.filter((s) => s[0] <= T.stop).at(-1)[1], "Que cache la tache ?");
  assert.ok(T.barres - T.question >= 3 - 1e-9 && T.barres > T.stop);
});

test("le film des paquets : chaque bruitage tombe sur son geste", () => {
  assert.equal(sons.length, 9);
  const attendu = [
    ["pop", T.fonds[0] + .4, "le jeton 18 apparaît"], ["pop", T.fonds[1] + .4, "le jeton 20 apparaît"],
    ["saut", T.hop + VOL + .65, "la tache saute"], ["splat", T.impact, "elle se pose"],
    ["pop", T.impact + .6, "le « ? » sur la tache"], ["pop", T.regroupe + DUR.fusion * .5 + .1, "38 apparaît"],
    ["pop", T.split + .55, "la barre du 60 se coupe"], ["confirmation", T.solve + .1, "22 trouvé"],
    ["confirmation", T.total + .1, "le total vérifié"]];
  attendu.forEach(([f, t, quoi], i) => {
    assert.equal(sons[i].f, f, quoi);
    assert.ok(Math.abs(sons[i].t - t) < 1e-9, `${quoi} : son à ${sons[i].t.toFixed(2)} s, geste à ${t.toFixed(2)} s`);
  });
  // les gestes du dessin sont bien à ces instants
  const code = sansCommentaires(paquets);
  assert.match(code, /op\(jj\.g,t<\(i<2\?T\.fonds\[i\]\+\.4:T\.impact\+\.05\)\?0:1\);/);
  assert.match(code, /const qa=P\(t,T\.impact\+\.6,\.65,F\.out\);/);
  assert.match(code, /op\(o\.sB38\.t,P\(t,T\.regroupe\+fd\*\.5,fd\*\.4,F\.lin\)\);/);
  assert.match(code, /else if\(d<V\+2\.05\)\{const u=clamp\(\(d-V-\.65\)\/1\.4\);/);
});

/* le texte : sa place fixe de chaque film (lot 10 : il ne bouge pas) */
const BASE = new Function(`${morceau(ecranPS, "const BASE={", "\n};")} return BASE;`)();
const SCENE = new Function(`${morceau(deux, "const SCENE={", "};")} return SCENE;`)();

test("le schéma en barres juste sous le texte, qui ne bouge pas ; même place dans les deux films", () => {
  // le texte n'a pas bougé (lot 9 : paquets 76 / 70 ; « Deux taches », l'écran de Petit SPLAT! : 68 / 62)
  assert.deepEqual([LAY.paysage.cap.y, LAY.portrait.cap.y, BASE.paysage.cap.y, BASE.portrait.cap.y], [76, 70, 68, 62]);
  // une seule place pour le texte pendant tout le film : rien ne le déplace
  for (const b of [paquets, deux]) assert.doesNotMatch(sansCommentaires(b), /o\.st\.(setAttribute|style\.transform)|cap\.y\s*=/);
  // le schéma : même place dans les deux films (y compris la taille du nombre de l'accolade)
  for (const m of ["paysage", "portrait"]) {
    const { x0, x1, y1, ym, y2, val, acc } = LAY[m].S;
    assert.deepEqual({ x0, x1, y1, ym, y2, val, acc }, (({ x0, x1, y1, ym, y2, val, acc }) => ({ x0, x1, y1, ym, y2, val, acc }))(SCENE[m]), m);
  }
  // remonté sous le texte (avant : 320 à l'ordinateur, 520 au téléphone, un tiers de l'écran vide)
  assert.equal(LAY.paysage.S.y1, 250);
  assert.equal(LAY.portrait.S.y1, 240);
  // la place de l'accolade et de son nombre : le haut du nombre (centre − 0,7 em / 2) sous la dernière ligne du texte,
  // avec de l'air (≥ 40 dans le dessin), même quand la phrase passe sur deux lignes au téléphone ; et pas trop loin (≤ 120)
  for (const [m, cap] of [["paysage", LAY.paysage.cap], ["portrait", LAY.portrait.cap], ["paysage", BASE.paysage.cap], ["portrait", BASE.portrait.cap]]) {
    const S = LAY[m].S, hautNombre = S.y1 - 24 - S.acc * .62 - S.acc * .35, bas = cap.y + (cap.gap || 0) + cap.size * .25;
    assert.ok(hautNombre - bas >= 40, `${m} : ${hautNombre - bas} entre le texte et l'accolade`);
    assert.ok(hautNombre - cap.y <= 120, `${m} : le schéma reste près du texte (${hautNombre - cap.y})`);
  }
  // les cases gardent leur taille ; « ? = 5 » reste sous le schéma, dans le cadre
  for (const m of ["paysage", "portrait"]) {
    assert.equal(SCENE[m].ym - SCENE[m].y1, 150 - (m === "portrait" ? 20 : 0));
    assert.equal(SCENE[m].y2 - SCENE[m].ym, SCENE[m].ym - SCENE[m].y1);
    assert.equal(SCENE[m].egal - SCENE[m].y2, m === "portrait" ? 90 : 100);
  }
  assert.ok(SCENE.paysage.egal + SCENE.paysage.val < 900 && SCENE.portrait.egal + SCENE.portrait.val < 1600);
});
