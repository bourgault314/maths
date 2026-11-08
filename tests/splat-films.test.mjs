// Les films « Comment on joue ? » de l'univers SPLAT! (10/10/2026) : un seul lecteur, outils/splat_intro.html,
// qui joue le film d'introduction sans paramètre et les films des étapes avec ?film=… ; et leurs liens sous
// les étapes de la carte des mondes (vue élève).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");
const sansCommentaires = (t) => t.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

test("le lecteur : chaque film s'inscrit, le film d'introduction reste celui par défaut", () => {
  assert.match(page, /const FILMS=\{\};/);
  assert.match(page, /FILMS\.intro=film;/);
  assert.match(page, /FILMS\.equasplat=\(function\(\)\{/);
  assert.match(page, /FILMS\['equasplat-jetons'\]=\(function\(\)\{/);
  assert.match(page, /FILMS\.dessine=\(function\(\)\{/);
  assert.match(page, /FILMS\.paquets=\(function\(\)\{/);
  // un nom inconnu (ou « intro », ou rien) lance l'introduction ; jamais une propriété héritée d'Object
  assert.match(page, /const film=Object\.prototype\.hasOwnProperty\.call\(FILMS,nom\)&&nom!=='intro'\?FILMS\[nom\]:FILMS\.intro;/);
  assert.match(page, /lancerLecteur\(aToi\?film\.aToi:film,autre\);/);
  // il n'y a qu'un appel au lecteur : celui du dernier bloc
  assert.equal((sansCommentaires(page).match(/lancerLecteur\(/g) || []).length, 2); // la définition + l'appel
});

test("les films des étapes : pas d'arrêt, format téléphone pris par le lecteur", () => {
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  const billes = blocs.find((b) => b.includes("FILMS.equasplat=")), jetons = blocs.find((b) => b.includes("FILMS['equasplat-jetons']="));
  const dessine = blocs.find((b) => b.includes("FILMS.dessine="));
  assert.ok(billes && jetons && dessine);
  for (const b of [billes, jetons, dessine]) {
    assert.match(b, /stops:\[\]/);
    assert.match(b, /portrait:\{w:900,h:1600\}/);
  }
  // les deux façons de regrouper (10/10 au soir) : le bouton « Regrouper » au premier exemple, puis on glisse 9 sur 12
  assert.match(jetons, /\['btn','Regrouper',/);
  assert.match(jetons, /D\.glisse\(T\.lache,B\.lache\)/);
  // 15/10/2026 : glisser ouvre la même fenêtre « Regrouper » que le bouton (plus de « Fusionner »)
  assert.match(jetons, /F:\{w:600,h:426,r:24,el:\[\['titre','Regrouper',/);
  // 18/10/2026 : au téléphone, la fenêtre a une ligne de plus (le bouton d'action du pavé seul sur sa ligne)
  assert.match(jetons, /F:\{w:352,h:664,r:20,el:\[\['titre','Regrouper',/);
  assert.doesNotMatch(jetons, /Fusionner/);
  assert.ok(jetons.includes("{g:'3𝑝',d:'12 + 9'},{g:'3𝑝',d:'21',t:TM.fusionne+.05}"));
  // lot 4 : le film et le tutoriel partagent l'écran (construire) ; le film le construit avec son déroulé T
  assert.match(jetons, /build\(svg,mode\)\{construire\(this,svg,mode,T,false\);\}/);
  // le lecteur règle le rapport largeur / hauteur du portrait d'après le film (3:4 pour l'introduction)
  assert.match(page, /player\.style\.setProperty\('--k',\(dim\.w\/dim\.h\)\.toFixed\(4\)\)/);
  assert.match(page, /\.player\.portrait \.stage\{aspect-ratio:var\(--k,\.75\)\}/);
});

/* 15/10/2026, remarque de Gwenaël : « on ne voit pas que tu cliques sur Enlever des deux côtés ». Avec des billes,
   l'outil ouvre déjà dans ce mode et le doigt touchait les jetons tout de suite. Dans les deux films de l'étape 35,
   le doigt touche maintenant le bouton, une phrase le nomme, et il y reste assez longtemps pour qu'on le voie (il ne
   repart que 0,55 s avant le geste suivant). */
test("films de l'étape 35 : le doigt touche « Enlever des deux côtés », et on a le temps de le voir", () => {
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  const billes = blocs.find((b) => b.includes("FILMS.equasplat=")), jetons = blocs.find((b) => b.includes("FILMS['equasplat-jetons']="));
  const temps = (b) => new Function(`return ${b.match(/const T=(\{[\s\S]*?\});/)[1]};`)();
  for (const [nom, b, suivant] of [["billes", billes, "toucheA"], ["jetons", jetons, "e21g"]]) {
    assert.match(b, /D\.touche\(T\.modeE,o\.rangs\.enl\.c\)/, nom);
    assert.match(b, /Q\.appui\(o\.rangs\.enl,t,T\.modeE\)/, nom);
    assert.ok(b.includes("'Touche «\\u00a0Enlever des deux côtés\\u00a0».'"), nom);
    const T = temps(b);
    assert.ok(T[suivant] - .55 - T.modeE >= .7, `${nom} : le doigt reste au moins 0,7 s sur le bouton`);
  }
  // billes : le doigt range d'abord les jetons, puis touche le bouton, puis les jetons
  const ordre = ["for(const b of sA){D.va(b.tg,b.p0);D.glisse(b.tg+.45,b.p1);}", "D.touche(T.modeE,o.rangs.enl.c);", "o.selA.forEach((b,k)=>D.touche(TA[k],b.p1||b.p0));"]
    .map((s) => billes.indexOf(s));
  assert.ok(ordre.every((i) => i > 0) && ordre[0] < ordre[1] && ordre[1] < ordre[2], ordre.join(", "));
});

test("aucune équation de la série de l'étape 35 dans les films (on ne donne pas les réponses)", () => {
  const serie = ["𝑚 + 2", "7 = 𝑥 + 4", "28", "𝑏 + 6", "26 + 16", "𝑎 + 16", "2𝑏", "3𝑥", "2𝑛", "4𝑚", "14 + 11", "3𝑐"];
  const films = sansCommentaires(page.slice(page.indexOf("const ECRAN_EQ=")));
  for (const s of serie) assert.ok(!films.includes(`'${s}'`), s);
  assert.ok(films.includes("'𝑡 + 3'") && films.includes("'3𝑦'") && films.includes("'20 + 15'") && films.includes("'3𝑝'"));
  // « À toi de faire » (16/10/2026) : 𝑡 + 2 = 5, hors de la série elle aussi
  assert.ok(films.includes("{g:'𝑡 + 2',d:'5'}"));
});

test("« Dessine les jetons » : deux cartes hors des séries des étapes 1 à 3 du monde 1, une case bleue donnée puis une case grise", () => {
  const bloc = page.slice(page.indexOf("FILMS.dessine=(function(){"));
  const cartes = [...bloc.slice(0, bloc.indexOf("</script>")).matchAll(/\{total:(\d+),visible:(\d+),cache:(\d+),donne:'(visible|cache)'/g)]
    .map((m) => ({ total: +m[1], visible: +m[2], cache: +m[3], donne: m[4] }));
  assert.equal(cartes.length, 2);
  assert.deepEqual(cartes.map((c) => c.donne), ["visible", "cache"]);
  const serie = (p) => JSON.parse(carte.match(new RegExp(`p:"${p}"[^\\n]*\\n(?:\\s*films:[^\\n]*\\n)?\\s*eqs:(\\[[^\\]]*\\])`))[1]);
  const toutes = ["m1e1", "m1e2", "m1e3"].flatMap(serie).map((e) => e.replace(" ✏️", ""));
  assert.ok(toutes.length >= 36);
  for (const c of cartes) {
    assert.equal(c.visible + c.cache, c.total);
    assert.ok(!toutes.includes(`𝑥 + ${c.visible} = ${c.total}`), `${c.total} = ${c.visible} + ${c.cache}`);
  }
});

test("en suivant le parcours (« Étape suivante » par ?apres=, « Continuer »), une étape qui a un film passe d'abord par son film", () => {
  const def = carte.match(/function versEtape\(e\)\{return [^\n]*\}/);
  assert.ok(def, "versEtape doit exister sur la carte des mondes");
  const versEtape = new Function(`${def[0]}; return versEtape;`)();
  const jeu = "/outils/splat_tache_barre.html?support=eleve&parcours=m1e2";
  assert.equal(versEtape({ j: jeu, films: [["dessine", "Comment on joue ?"]] }),
    "/outils/splat_intro.html?film=dessine&suite=" + encodeURIComponent(jeu));
  // le premier film seulement (étape 35 : les billes) ; sans film, le jeu
  assert.match(versEtape({ j: "/outils/equasplat.html#data=x", films: [["equasplat", "a"], ["equasplat-jetons", "b"]] }), /\?film=equasplat&suite=%2Foutils%2Fequasplat\.html%23data%3Dx$/);
  assert.equal(versEtape({ j: jeu }), jeu);
  assert.equal(versEtape({ j: jeu, films: [] }), jeu);
  // une étape du parcours (avec son code p) : la suite du film est la carte avec ?jouer=, une adresse courte (11/10/2026)
  assert.equal(versEtape({ p: "m3e1", j: "/outils/equasplat.html?eleve=1&parcours=m3e1#data=" + "x".repeat(3000), films: [["equasplat", "a"]] }),
    "/outils/splat_intro.html?film=equasplat&suite=" + encodeURIComponent("/outils/splat_univers.html?jouer=m3e1"));
  // les deux portes du parcours s'en servent
  assert.match(carte, /APRES_REDIRIGE=true;\s*window\.location\.replace\(versEtape\(suite\[k\+1\]\)\);/);
  assert.match(carte, /a\.href=versEtape\(prochaine\.e\); a\.dataset\.monde=prochaine\.mi;/);
  // le film d'une étape propose « Passer le film › », bien visible — l'introduction aussi depuis qu'elle est « Le film »
  // de l'étape 1 (08/11/2026)
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  for (const nom of ["FILMS.intro=film;", "FILMS.equasplat=", "FILMS['equasplat-jetons']=", "FILMS.dessine=", "FILMS.paquets="]) {
    assert.ok(blocs.find((b) => b.includes(nom)).includes("passerTexte:'Passer le film ›'"), nom);
  }
  assert.match(page, /<a class="lien passer" id="passer" href="#" hidden>Passer l’intro ›<\/a>/);
  assert.match(page, /if\(film\.passerTexte\)\$\('passer'\)\.textContent=film\.passerTexte;/);
  assert.match(page, /\.passer\{color:var\(--accent\);background:var\(--accent-soft\);border-radius:999px;/);
});

test("le caractère ▶ est toujours suivi de U+FE0E (sinon l'iPhone le dessine en émoji)", () => {
  const texte = sansCommentaires(page);
  const mauvais = [...texte.matchAll(/▶(?!︎|&#xFE0E;)/g)].map((m) => texte.slice(m.index - 20, m.index + 5));
  assert.deepEqual(mauvais, []);
});

test("carte des mondes : les films sous les étapes 1, 2, « paquets » et 35, qui reviennent au jeu de l'étape", () => {
  // lot 4 (08/11/2026) : les deux boutons de l'étape 35 ouvrent un tutoriel « À toi de faire » (le film reste au prof)
  assert.match(carte, /p:"m3e1",id:"e2-0",\n\s*films:\[\["equasplat","À toi de faire","toi"\],\["equasplat-jetons","Les jetons numérotés","toi"\]\],/);
  // le lien : le lecteur, le film, et ?suite= = la carte avec ?jouer=<parcours>, qui renvoie aussitôt au jeu de
  // l'étape (11/10/2026 : avant, ?suite= portait le lien du jeu en entier, #data= compris — une adresse de plusieurs Ko)
  // (08/11/2026 : + &depuis=carte&etape=<id>, le film ramène à la carte sur cette étape)
  assert.ok(carte.includes(`(e.films?e.films.map(f=>'<a class="filmLien" href="/outils/splat_intro.html?film='+f[0]+'&amp;suite='+encodeURIComponent(e.p?'/outils/splat_univers.html?jouer='+e.p:e.j)+'&amp;depuis=carte&amp;etape='+ids[ei]+'">'+`));
  assert.match(carte, /const jouer=new URLSearchParams\(window\.location\.search\)\.get\("jouer"\);/);
  assert.match(carte, /window\.location\.replace\(MONDES\[mi\]\.etapes\.find\(e=>e\.p===jouer\)\.j\);/);
  // ?jouer= n'ouvre que les mondes jouables : ni un monde en préparation sans la clé, ni un monde fermé à la classe
  assert.match(carte, /const mi=MONDES\.findIndex\(m=>jouable\(m\)&&m\.etapes\.some\(e=>e\.p===jouer&&e\.j\)\);/);
  // les étapes qui ont un film : la 1 (l'introduction, 08/11/2026), la 35 (deux), la 2 (« Dessine les jetons ») et,
  // au monde 2, « Avec des paquets de jetons »
  assert.match(carte, /p:"m1e1",\n\s*films:\[\["intro","Le film",43\]\],/);
  assert.match(carte, /p:"m1e2",dessin:true,\n\s*films:\[\["dessine","Le film",36\]\],/);
  assert.match(carte, /p:"m2e4",\n\s*films:\[\["paquets","Le film",47\]\],/);
  assert.equal((carte.match(/\bfilms:\[\[/g) || []).length, 4);
});

/* Ouvert depuis la page Splat du catalogue (sans ?suite=), le film est présenté par le prof : il ne mène pas
   au jeu. Ni « Passer le film › » ni « Je joue » ; à la fin, « ↺ Revoir le film » et le retour à la page Splat
   (choix de Gwenaël, 11/10/2026). Le chemin de l'élève, lui, porte toujours ?suite= et ne change pas. */
test("film ouvert depuis la page Splat : « Revoir le film » et retour à la page Splat, pas de « Je joue »", () => {
  const code = sansCommentaires(page);
  assert.match(code, /const PRESENTATION=!new URLSearchParams\(location\.search\)\.has\('suite'\);/);
  assert.match(code, /const RETOUR_PAGE='\/outils\/\?domain=algebre&collection=splat';/);
  assert.match(code, /if\(film\.passer&&!PRESENTATION&&!DEPUIS_CARTE\)\{\$\('passer'\)\.href=film\.passer;/);
  // les quatre écrans de fin (introduction, films d'ÉquaSplat, « Dessine les jetons », « Avec des paquets de jetons ») passent par le même assemblage
  assert.equal((code.match(/F\.boutonsFin\(o,fi\);/g) || []).length, 4);
  // « Je joue » n'existe plus que dans F.boutonsFin, sur le chemin de l'élève
  assert.equal((code.match(/'Je joue'/g) || []).length, 1);
  assert.equal((code.match(/href:SUITE/g) || []).length, 1);
  const bf = code.slice(code.indexOf("boutonsFin(o,fi){"), code.indexOf("\n};", code.indexOf("boutonsFin(o,fi){")));
  assert.match(bf, /if\(!PRESENTATION\)\{\s*o\.jouer=F\.E\('a',\{href:SUITE,class:'film-lien'\},o\.fin\);/);
  assert.match(bf, /t\.textContent=fi\.revoir\|\|'↺ Revoir le film';/);
  assert.match(bf, /o\.revoir=F\.E\('a',\{href:RETOUR_PAGE,class:'film-lien'\},o\.fin\);/);
  assert.match(bf, /\.textContent='‹ Retour à la page Splat';/);
  // le gros bouton n'est pas un lien : le clic tombe sur le film, qui repart du début quand il est fini
  // (16/10/2026 : « À toi de faire » regarde où l'élève a touché, au lieu de mettre en pause)
  assert.match(code, /stage\.addEventListener\('click',e=>\{if\(e\.target\.closest&&e\.target\.closest\('a'\)\)return;if\(film\.attentes\)\{toucher\(e\);return;\}toggle\(\);\}\);/);
  // (15/10/2026 : play() prépare d'abord le son des films qui en ont)
  assert.match(code, /function play\(\)\{if\(film\.sons&&!SON\.coupe\)SON\.preparer\(film\.fichiersSons\);enArret=false;if\(fresh\)\{fresh=false;setT\(0\);\}else if\(t>=D-1e-3\)setT\(0\);/);
});

test("la carte des mondes envoie toujours ses films avec ?suite= : rien ne change pour l'élève", () => {
  const liens = [...carte.matchAll(/\/outils\/splat_intro\.html/g)].map((m) => carte.slice(m.index, m.index + 90));
  // 08/11/2026 : le lien « Comment on joue ? » sous le monde 1 est parti (le film d'intro est le bouton de l'étape 1)
  assert.equal(liens.length, 3, "vue prof, films sous les étapes, chemin du parcours");
  for (const l of liens) assert.match(l, /^\/outils\/splat_intro\.html\?(film='\+f\[0\]\+'&amp;|film='\+e\.films\[0\]\[0\]\+'&)?suite=/, l);
});

/* Le diaporama en ligne (11/10/2026) : l'ancien diaporama d'avant le film (PR #961), qui s'ouvre directement
   diapo par diapo. Comme le film présenté depuis la page Splat, il ne mène pas au jeu. */
test("le diaporama en ligne : diapo par diapo, « Revoir le diaporama » et retour à la page Splat", () => {
  const diapo = lire("outils/splat_diaporama.html");
  const code = sansCommentaires(diapo);
  assert.equal((diapo.match(/<section class="diapo[ "]/g) || []).length, 9);
  assert.doesNotMatch(code, /Je joue|Passer l'intro|suite/);
  assert.match(diapo, /<button class="revoir" id="revoir" type="button">↺ Revoir le diaporama<\/button><a class="retour" href="\/outils\/\?domain=algebre&amp;collection=splat">‹ Retour à la page Splat<\/a>/);
  assert.match(code, /document\.getElementById\('revoir'\)\.onclick = \(\) => montrer\(0\);/);
  // un clic sur le bouton « Revoir » ne fait pas aussi avancer d'une diapo
  assert.match(code, /addEventListener\('click', ev => \{ if \(ev\.target\.closest\('a,button'\)\) return;/);
  // en plein écran (barre cachée), toucher le quart gauche de la diapo recule ; ailleurs, on avance (11/10/2026)
  // au doigt ou au stylet seulement : à la souris, un clic avance toujours (PC de la classe)
  assert.match(code, /addEventListener\('pointerdown', ev => \{ pointeur = ev\.pointerType \|\| 'mouse'; \}\);/);
  assert.match(code, /if \(document\.fullscreenElement && pointeur !== 'mouse' && ev\.clientX < r\.left \+ r\.width \/ 4\) \{ montrer\(i - 1\); return; \}\n\s*montrer\(i \+ 1\); \}\);/);
  // les images de Steve Wyborney ne sont pas sous la licence du site, comme au pied du PDF
  assert.match(diapo, /images extraites de ses diaporamas, hors licence du site/);
  // ◀ et ▶ suivis de U+FE0E (sinon l'iPhone les dessine en émoji)
  assert.deepEqual([...code.matchAll(/[◀▶](?!︎|&#xFE0E;)/g)].map((m) => code.slice(m.index - 15, m.index + 3)), []);
  // plein écran au bouton ou à la touche F ; pas de bouton là où le navigateur ne sait pas (iPhone)
  assert.match(code, /if \(!document\.fullscreenEnabled\) document\.getElementById\('plein'\)\.hidden = true;/);
  assert.match(code, /if \(\(ev\.key === 'f' \|\| ev\.key === 'F'\) && !ev\.ctrlKey && !ev\.metaKey && !ev\.altKey\) \{ pleinEcran\(\); return; \}/);
  // F marche aussi quand le focus est resté sur « Suivant » ou ⛶ : elle passe avant le retour sur les boutons
  const touches = code.slice(code.indexOf("addEventListener('keydown'"));
  assert.ok(touches.indexOf("pleinEcran(); return;") < touches.indexOf("closest('a,button')) return;"));
});

/* « Le nombre de jetons cachés », pas « invisibles » : les jetons sont sous la tache, et c'est le mot du jeu et des
   livrets ; « Jeu SPLAT! » dans les crédits, comme le nom de l'univers (choix de Gwenaël, 11/10/2026) */
test("film et diaporama : « jetons cachés » et « Jeu SPLAT! »", () => {
  const diapo = lire("outils/splat_diaporama.html"), source = lire("_sources/splat-comment-on-joue/diaporama.html");
  for (const [nom, t] of [["film", page], ["diaporama", diapo], ["source du PDF", source]]) {
    assert.doesNotMatch(t, /jetons <b>invisibles|'invisibles'/, nom);
  }
  assert.match(page, /\['#cbd5e1',ENCRE,'cachés'\]/);
  assert.equal((diapo.match(/Le nombre de jetons <b>cachés<\/b>/g) || []).length, 4);
  assert.equal((source.match(/Le nombre de jetons <b>cachés<\/b>/g) || []).length, 4);
  assert.equal((page.match(/credit:'Jeu SPLAT! créé par/g) || []).length, 5);
  assert.doesNotMatch(page, /Jeu Splat!/);
  assert.match(diapo, /Jeu SPLAT! créé par/);
});

/* « Avec des paquets de jetons » (monde 2, 15/10/2026) : le film de Gwenaël (son animation v6 : 18 + 20 + un jeton 22
   caché = 60, la résolution en barres, la vérification sur le plateau), redessiné comme le jeu, avec son ouverture :
   des petits jetons rangés en paquets, chaque paquet devient un jeton numéroté. */
test("« Avec des paquets de jetons » : l'exemple de Gwenaël, hors des séries du monde 2, dessiné comme le jeu", () => {
  const bloc = page.slice(page.indexOf("FILMS.paquets=(function(){"));
  const code = sansCommentaires(bloc.slice(0, bloc.indexOf("</script>")));
  // l'exemple : 18, 20 et un seul jeton 22 sous la tache, total 60 — pas dans les séries des étapes du monde 2
  assert.match(code, /const JET=\[\{v:18,p:\[[\d,]+\]\},\{v:20,p:\[[\d,]+\]\},\{v:22,p:\[[\d,]+\]\}\]/);
  const serie = (p) => JSON.parse(carte.match(new RegExp(`p:"${p}"[^\\n]*\\n(?:\\s*films:[^\\n]*\\n)?\\s*eqs:(\\[[^\\]]*\\])`))[1]);
  const toutes = ["m2e1", "m2e4", "m2e5"].flatMap(serie);
  assert.ok(toutes.length >= 30);
  assert.ok(!toutes.includes("𝑥 + 38 = 60") && !toutes.some((e) => / = 60$/.test(e)));
  // le jeu : les couleurs des jetons numérotés (beadColorForValue), les petits jetons de l'étape 1, la tache de l'outil (40 points)
  assert.ok(code.includes("const couleur=v=>{const h=(v*37)%360;return {fill:`hsla(${h}, 78%, 54%, 0.18)`,stroke:`hsla(${h}, 78%, 48%, 0.55)`};};"));
  assert.match(code, /unitFond:'rgba\(27,102,255,0\.14\)',unitBord:'rgba\(27,102,255,0\.50\)'/);
  assert.match(code, /for\(let i=0;i<40;i\+\+\)\{const a=2\*Math\.PI\*i\/40/);
  // pas d'ombre sous la tache (Gwenaël ne les aime pas), et la tache reste dans le plateau
  assert.doesNotMatch(code, /drop-shadow|feDropShadow|shadow/i);
  const jet = Object.fromEntries([...code.matchAll(/\{v:(\d+),p:\[(\d+),(\d+)\]\}/g)].map((m) => [m[1], [+m[2], +m[3]]]));
  const rt = +code.match(/RT=(\d+)/)[1];
  assert.ok(jet[22][0] - rt * 1.1 >= 120 && jet[22][0] + rt * 1.1 <= 1480 && jet[22][1] - rt * 1.1 >= 210 && jet[22][1] + rt * 1.1 <= 870);
  // jamais de chiffre sur un jeton qui compte : les petits jetons sont des cercles seuls ; on compte avec un compteur
  assert.match(code, /u\.el=E\('circle',\{cx:u\.p0\[0\],cy:u\.p0\[1\],r:RU,fill:C\.unitFond,stroke:C\.unitBord,'stroke-width':3\},o\.plateau\);/);
  assert.match(code, /K\.txt\.textContent=n\?String\(n\):'';/);
  // le mot du jeu : « la tache »
  assert.doesNotMatch(code, /Splat arrive/);
  // son arrêt à la question, comme dans sa vidéo ; le format téléphone en 3:4, comme le film d'introduction
  assert.match(code, /stops:\[\{t:T\.stop\}\]/);
  assert.match(code, /\[16\.1,'Que cache la tache \?'\]/);
  assert.match(code, /question:16\.1,stop:17\.4,/);
  // on compte 18, puis 20 ; le troisième paquet, on commence à le compter, mais la tache se pose dessus au moment où il
  // deviendrait un jeton : le 22 n'est jamais visible avant la vérification, et son compteur s'arrête bien avant 22
  const T = new Function(`const T=${code.match(/const T=(\{[\s\S]*?\});/)[1]};return T;`)();
  assert.ok(T.comptes[0] < T.fonds[0] && T.fonds[0] < T.comptes[1] && T.comptes[1] < T.fonds[1] && T.fonds[1] < T.comptes[2]);
  assert.ok(Math.floor((T.coupe - T.comptes[2]) / T.comptePas) + 1 < 22, "le compteur du troisième paquet n'arrive pas à 22");
  assert.ok(T.coupe < T.fonds[2] && T.fonds[2] < T.impact && T.impact < T.stop);
  // le 22 arrive juste APRÈS l'impact : à l'impact même, la tache a encore son rayon de vol et l'anneau du jeton
  // dépassait entre ses lobes (une image, mesurée le 15/10/2026) ; il faut qu'elle ait commencé à s'étaler
  const retard = code.match(/op\(jj\.g,t<\(i<2\?T\.fonds\[i\]\+\.4:T\.impact\+(\.\d+)\)\?0:1\);/);
  assert.ok(retard, "le 22 apparaît à T.impact + un petit retard");
  assert.ok(+retard[1] >= 0.03 && T.impact + +retard[1] < T.question, `retard du 22 : ${retard[1]} s`);
  assert.match(code, /u\.compte=g<2\|\|tc<T\.coupe\?tc:null;/);
  // ses petits jetons sont encore là quand la tache se pose, et disparaissent dessous
  assert.match(code, /op\(u\.el,t<u\.pop\?0:\(u\.g<2\?1-P\(t,T\.fonds\[u\.g\]\+\.35,\.2,F\.lin\):\(t<T\.impact\?1:0\)\)\);/);
  assert.match(code, /modes:\{paysage:\{w:1600,h:900\},portrait:\{w:900,h:1200\}\}/);
});

/* Les logos du titre (15/10/2026, Gwenaël : « on uniformise ») : chaque film porte ceux des livrets de son monde. Monde 1
   (introduction, « Dessine les jetons », « Deux taches » à venir) et monde 2 (« Avec des paquets de jetons ») : IREMI et
   maths&go ; monde 5 (les deux films d'ÉquaSplat) : maths&go seul (SPLAT! Équations est son travail seul). */
test("les logos du titre : IREMI et maths&go aux mondes 1 et 2, maths&go seul pour ÉquaSplat", () => {
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  const bloc = (marque) => sansCommentaires(blocs.find((b) => b.includes(marque)));
  const irem = (b) => (b.match(/href:LOGO_IREM/g) || []).length, mg = (b) => (b.match(/href:LOGO_MG/g) || []).length;
  for (const m of ["FILMS.intro=film;", "const ECRAN_PS=(function(){", "FILMS.paquets=(function(){"]) {
    assert.equal(irem(bloc(m)), 1, m);
    assert.equal(mg(bloc(m)), 1, m);
  }
  const eq = bloc("const ECRAN_EQ=(function(){");
  assert.equal(irem(eq), 0);
  assert.equal(mg(eq), 1);
});

/* Le son (15/10/2026, choix de Gwenaël : « Oui, avec un bouton ») : seul le film « Avec des paquets de jetons » a des
   bruitages, ceux de sa vidéo v6 (fichiers dans assets/sons/splat/). Ils sonnent quand le film passe leur instant en
   lecture, jamais quand on saute d'étape ; le bouton « Son » sous le film les coupe, et n'apparaît que pour un film
   qui a des sons. */
test("le son : les bruitages du film du monde 2, un bouton pour les couper, rien sur les autres films", () => {
  const code = sansCommentaires(page);
  assert.match(page, /<button class="lien" id="son" type="button" hidden aria-pressed="true" title="Couper le son">/);
  // les sons ne partent que dans la boucle de lecture (avant chaque image, à l'arrêt et à la fin), jamais dans jump()
  assert.match(code, /function sonner\(a,b\)\{if\(film\.sons\)for\(const e of film\.sons\)if\(e\.t>a&&e\.t<=b\)SON\.jouer\(e\.f,e\.g\);\}/);
  assert.equal((code.match(/sonner\(/g) || []).length, 4); // la définition + trois appels dans loop()
  assert.doesNotMatch(code.slice(code.indexOf("function jump("), code.indexOf("function next(")), /sonner/);
  // le son ne se prépare que sur un geste (play, ou le bouton) ; le choix « coupé » est gardé sur l'appareil
  assert.match(code, /function play\(\)\{if\(film\.sons&&!SON\.coupe\)SON\.preparer\(film\.fichiersSons\);/);
  assert.match(code, /localStorage\.setItem\('mathsgo-films-son',v\?'0':'1'\)/);
  // seul le film du monde 2 a des sons ; ses fichiers existent et restent légers
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  for (const m of ["FILMS.intro=film;", "FILMS.equasplat=(function(){", "FILMS['equasplat-jetons']=(function(){", "FILMS.dessine=(function(){"]) {
    assert.doesNotMatch(sansCommentaires(blocs.find((b) => b.includes(m))), /\bsons:\[/, m);
  }
  const paquets = sansCommentaires(blocs.find((b) => b.includes("FILMS.paquets=(function(){")));
  const fichiers = [...paquets.matchAll(/'(\/assets\/sons\/splat\/[a-z]+\.mp3)'/g)].map((m) => m[1]);
  assert.equal(fichiers.length, 4);
  for (const f of fichiers) {
    const taille = statSync(new URL(`..${f}`, import.meta.url)).size;
    assert.ok(taille > 1000 && taille < 20000, `${f} : ${taille} octets`);
  }
  // les bruitages : deux pops (les jetons 18 et 20), le saut, le SPLAT, le « ? », 38, la coupe du 60, deux confirmations
  assert.equal((paquets.match(/\{t:[^}]*,f:'(pop|saut|splat|confirmation)',g:[.\d]+\}/g) || []).length, 9);
});

/* « À toi de faire » (16/10/2026, choix de Gwenaël) : le tutoriel de l'étape 35, dans le lecteur des films, sur l'écran du
   film des billes. Comme le tutoriel d'un jeu vidéo : huit consignes, une à la fois ; le bon geste est validé (✓) et le
   tutoriel continue ; un toucher ailleurs ne change rien (le doigt montre où toucher). Sur le chemin de l'élève, il s'ouvre
   à la place du film ; depuis la page Splat, c'est le film. On ne touche pas à equasplat.html. */
const blocBilles = () => {
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  return blocs.find((b) => b.includes("FILMS.equasplat="));
};
const tempsTuto = (b) => new Function(`return ${b.match(/const TT=(\(\(\)=>\{[\s\S]*?\}\)\(\));/)[1]};`)();

test("« À toi de faire » : huit consignes, une attente par toucher, chaque consigne affichée avant ses attentes", () => {
  const b = blocBilles();
  assert.match(b, /film\.aToi=aToi;/);
  const TT = tempsTuto(b);
  const ATT = new Function("TT", `return ${b.match(/const ATT=(\[[^\]]*\]);/)[1]};`)(TT);
  // Enlever, 2 jetons à gauche, 2 jetons à droite, Valider, Équation suivante, Partager équitablement, « 3 parts »,
  // écrire 3, Partager, un groupe (la fenêtre Partager de l'outil depuis le 23/10/2026, plus de « 3 paquets de 3 »)
  assert.equal(ATT.length, 12);
  for (let k = 1; k < ATT.length; k++) assert.ok(ATT[k] - ATT[k - 1] >= .5, `attentes ${k} et ${k + 1} : ${ATT[k - 1]} → ${ATT[k]}`);
  assert.ok(ATT[0] > TT.ecran && ATT[ATT.length - 1] < TT.fin);
  const GUIDE = new Function("TT", `return ${b.match(/const GUIDE=(\[[\s\S]*?\]\]);/)[1]};`)(TT);
  const consignes = GUIDE.filter((g) => g[2] != null);
  // une consigne en deux textes : [ordinateur, téléphone]
  assert.deepEqual(consignes.map((g) => g[1]), ["Touche « Enlever des deux côtés ».", "Touche les 2 jetons à gauche.", "Touche 2 jetons à droite.",
    "Touche « Valider la suppression ».", "Touche « Équation suivante ».", ["Touche « Partager équitablement ».", "Touche « Partager »."],
    "Choisis « 3 parts ».", ["Touche la case pour écrire 3.", "Touche le 3 du pavé."], "Touche « Partager ».", "Touche un des groupes."]);
  // le ✓ vient après le dernier toucher de la consigne (le 2e jeton) ; chaque attente est sous sa consigne, affichée 0,25 s avant
  assert.deepEqual(consignes.map((g) => g[2]), [TT.a1, TT.a2b, TT.a3b, TT.a4, TT.a5, TT.a6, TT.a7, TT.a7b, TT.a7c, TT.a8]);
  for (const a of ATT) {
    const g = GUIDE.filter((x) => x[0] <= a).pop();
    assert.ok(g[2] != null && g[2] >= a && a - g[0] >= .25, `attente ${a} : « ${g[1]} »`);
  }
  for (let k = 1; k < GUIDE.length; k++) assert.ok(GUIDE[k][0] > GUIDE[k - 1][0], GUIDE[k][1]);
  for (const g of consignes) {
    const suivante = GUIDE[GUIDE.indexOf(g) + 1];
    assert.ok(suivante[0] - g[2] >= .5, `${g[1]} : ✓ visible ${(suivante[0] - g[2]).toFixed(2)} s`);
  }
  assert.match(b, /Q\.legende\(o,Y,\(fait\?'✓\\u00a0':''\)\+\(Array\.isArray\(cur\[1\]\)\?cur\[1\]\[port\?1:0\]:cur\[1\]\)\);o\.st\.setAttribute\('fill',fait\?'#15803d':'#1e293b'\);/);
  // le rond bleu d'un geste (0,45 s) est fini avant l'attente suivante
  for (let k = 1; k < ATT.length; k++) assert.ok(ATT[k] - ATT[k - 1] > .45);
  // la phrase sous l'équation change juste APRÈS le geste : pendant l'attente, on lit encore celle d'avant
  const CONS = new Function("TT", "I0", "C", `return ${b.match(/const CONS_T=(\[[\s\S]*?\]\]);/)[1]};`)(TT, "I0", { orangeC: "o" });
  for (const a of ATT) assert.ok(!CONS.some((c) => c[0] === a), `une phrase change pile à l'attente ${a}`);
  // le partage en 3 parts (demande de Gwenaël, 16/10 ; la fenêtre Partager depuis le 23/10) : chaque tache va sur sa ligne, l'une sous l'autre, en face de trois
  // jetons, à la place et à la taille de son groupe ; puis deux traits coupent les deux plateaux en trois ; puis les
  // groupes prennent la place des bandes, sans bouger (taches et jetons restent pleins pendant le fondu)
  assert.ok(b.includes("o.Bt=X.B.t.map((c,k)=>{const g=E('g',{},o.B);Q.tache(Y,g,[0,0],Y.tRB,'𝑦');return {g,c,c1:[KB.tx,ligne(k)],s1:KB.tR/Y.tRB};});"));
  assert.ok(b.includes("o.Bd=X.B.d.map((q,i)=>Object.assign(Q.piece(Y,o.B,null,Y.bR),{c:q[0],c1:[KB.bx[i%3],ligne(Math.floor(i/3))],s1:KB.bR/Y.bR}));"));
  assert.ok(b.includes("o.Bt.forEach(e=>place(e,P(t,TT.range,.8,F.io)));") && b.includes("o.Bd.forEach((e,i)=>place(e,P(t,TT.range+i*.04,.8,F.io)));"));
  assert.ok(b.includes("op(o.B,t<TT.b?0:(t<TT.groupes+.3?vB:0));"));
  assert.match(b, /o\.cartes\.forEach\(\(c,k\)=>\{let v=t<TT\.groupes\?0:P\(t,TT\.groupes,\.3,F\.lin\);/);
  assert.equal((b.match(/o\.coupe=KB\.ys\.slice\(1\)/g) || []).length, 1);
  // l'ordre : tout est en place avant que les traits coupent, et les traits sont tracés avant les groupes
  const e = 1e-9;   // (des temps calculés : 16,6 + 0,65 donne 17,250000000000004)
  assert.ok(TT.range > TT.a7c && TT.coupe >= TT.range + 8 * .04 + .8 - e && TT.groupes >= TT.coupe + .1 + .35 + .2 - e && TT.a8 >= TT.groupes + .6 - e);
});

test("« À toi de faire » : les phrases sous l'équation et les boutons sont ceux d'ÉquaSplat, mot pour mot", () => {
  const b = blocBilles(), outil = lire("outils/equasplat.html");
  const texteOutil = outil.replace(/<\/?strong>/g, "").replace(/&nbsp;/g, " ");
  const CONS = [...b.slice(b.indexOf("const CONS_T=")).split("];")[0].matchAll(/,'([^']+)'/g)].map((m) => m[1]);
  assert.ok(CONS.length >= 5);
  for (const p of CONS) {
    const reste = p.replace(/\s*:\s*\d+\.$/, "").replace(/^\d+ /, "").replace(/^Il reste \d+ taches et \d+ jetons : /, "");
    assert.ok(texteOutil.includes(reste), `« ${p} » est une phrase de l'outil`);
  }
  assert.ok(texteOutil.includes("Il y a la même quantité à gauche qu’à droite."));
  // après « Valider la suppression », la tache est seule : l'outil n'écrit plus rien (relevé le 16/10/2026)
  // après 2 jetons à gauche et 1 à droite, l'outil écrit « … ne font pas la même somme. » ; après 2 et 2, « … : 2. »
  assert.match(b, /\[TT\.a3\+\.001,'Les jetons sélectionnés ne font pas la même somme\.'\],\[TT\.a3b\+\.001,'Même quantité sélectionnée : 2\.'\],\[TT\.a4\+\.001,''\]/);
  for (const nom of ["Enlever des deux côtés", "Partager équitablement", ">Partager<", "Valider la suppression", "Équation suivante", "Chaque part vaut", "${n} parts"]) {
    assert.ok(outil.includes(nom), nom);
  }
  assert.ok(!outil.includes("Faire des paquets</"), "plus de bouton « Faire des paquets » dans l'outil");
  // on ne touche pas à ÉquaSplat : le tutoriel vit dans le lecteur des films
  assert.doesNotMatch(outil, /aToi|À toi de faire/);
});

test("« À toi de faire » : un seul bon geste par attente, des zones assez grandes pour le doigt, pas de rangement", () => {
  const b = blocBilles(), code = sansCommentaires(b.slice(b.indexOf("const aToi={")));
  // zones : un rectangle d'au moins 44 px à l'écran, un rond d'au moins 22 px de rayon autour d'un jeton
  assert.match(code, /const pv=Math\.max\(4\/px,\(44\/px-h\)\/2\),ph=Math\.max\(4\/px,\(44\/px-w\)\/2\);/);
  assert.match(code, /const R=Math\.max\(Y\.bR\+Y\.anG,22\/px\);/);
  // les cibles, dans l'ordre : Enlever, les deux jetons de gauche, deux des jetons de droite (un jeton déjà touché ne compte
  // plus), Valider, Équation suivante, Partager équitablement, « 3 parts », la case (ordinateur) ou la touche 3 (téléphone),
  // Partager, un des groupes
  assert.ok(code.includes("const libres=(liste,pris,ta)=>liste.map((b,i)=>pris.some(x=>x.i===i)?null:rond(b.c,()=>{pris.push({i,t:ta});})).filter(Boolean);"));
  assert.ok(code.includes("case 0:return [bt(o.rangs.enl)];\n      case 1:case 2:return libres(o.Ag,ch.g,a);\n      case 3:case 4:return libres(o.Ad,ch.d,a);\n      case 5:return [bt(o.act.valider)];\n      case 6:return [bt(o.bravoA.btn)];\n      case 7:return [bt(o.fp)];\n      case 8:return [zr(o.dP1.pucesR.p3)];\n      case 9:return [zr(o.port?o.dP2.clesR['3']:o.dP2.champR)];\n      case 10:return [zr(o.dP2.okR)];\n      case 11:return K.ys.map("));
  // un toucher ailleurs : rien ne change, le doigt montre la cible la plus proche (il appuie sans rien faire)
  assert.match(code, /if\(bon\)\{this\.indice=null;if\(bon\.faire\)bon\.faire\(\);this\.choix\.touches\[k\]=\{t:ATT\[k\],p:q\};return true;\}/);
  assert.match(code, /if\(pres\)this\.indice=\{r0:performance\.now\(\),c:pres\.c\};\s*return false;/);
  // 𝑡 + 2 = 5 (après l'essai de Gwenaël) : deux jetons à gauche ; à droite, EN MIROIR, trois jetons à la place de la tache
  // et deux en face des deux de gauche ; les jetons ne bougent pas (pas de glisser)
  const XT = new Function(`return ${b.match(/const XT=(\{[\s\S]*?\]\]\}\});/)[1]};`)();
  for (const [m, W] of [["paysage", 1440], ["portrait", 390]]) {
    const x = XT[m];
    assert.equal(x.g.length, 2, m); assert.equal(x.d.length, 5, m);
    const sous = x.d.slice(0, 3), cx = sous.reduce((a, c) => a + c[0], 0) / 3, cy = sous.reduce((a, c) => a + c[1], 0) / 3;
    assert.ok(Math.abs(cx - (W - x.t[0])) <= 2 && Math.abs(cy - x.t[1]) <= 6, `${m} : trois jetons en face de la tache`);
    for (const [i, c] of x.g.entries()) assert.ok(x.d.slice(3).some((e) => Math.abs(e[0] - (W - c[0])) <= 1 && e[1] === c[1]), `${m} : jeton ${i + 1} en miroir`);
  }
  assert.doesNotMatch(code, /glisse|posBille|PAS_RANGE/);
  // on recommence : le choix de l'élève s'efface quand le tutoriel repart du début
  assert.match(code, /if\(t<TT\.a1-1e-6\)\{ch\.g=\[\];ch\.d=\[\];ch\.groupe=null;ch\.touches=\{\};this\.indice=null;\}/);
});

test("« À toi de faire » dans le lecteur : il attend le bon toucher, ni pause ni saut au clavier", () => {
  const code = sansCommentaires(page);
  assert.match(code, /const stops=\(film\.stops\|\|\[\]\)\.concat\(film\.attentes\|\|\[\]\)\.map\(s=>s\.t\)\.sort\(\(a,b\)=>a-b\);/);
  assert.match(code, /pill\.hidden=!enArret\|\|!!film\.attentes;/);
  assert.match(code, /function toucher\(e\)\{if\(playing\)return;if\(fresh\|\|t>=D-1e-3\)\{play\(\);return;\}if\(!enArret\)return;/);
  assert.match(code, /if\(film\.toucher\(t,\[q\.x,q\.y\]\)\)play\(\);else film\.render\(t\);/);
  assert.match(code, /if\(film\.attentes&&\(e\.key===' '\|\|e\.key==='k'\|\|e\.key==='ArrowRight'\|\|e\.key==='ArrowLeft'\)\)return;/);
  // la fin du tutoriel : « ↺ Recommencer » (pas « Revoir le film »)
  assert.match(blocBilles(), /Y\.fin=Object\.assign\(\{\},Y\.fin,\{revoir:'↺ Recommencer'\}\);/);
});

/* 16/10/2026 : le lecteur sautait un arrêt quand une image tombait à moins d'un millionième avant lui. Deux arrêts séparés
   d'un nombre rond d'images (13,8 s → 15,1 s : 78 images à 60 par seconde) le provoquent presque à coup sûr ; mesuré dans
   le tutoriel : une attente sur quatre manquée. On s'arrête maintenant au premier arrêt strictement après t. */
test("le lecteur ne saute plus un arrêt quand une image tombe juste avant lui", () => {
  assert.match(sansCommentaires(page), /const ns=stops\.find\(x=>x>t\);if\(ns!=null&&nt>=ns\)\{/);
  // une image tombe 0,5 millionième de seconde avant l'arrêt 13,8 + 1,3 (c'est ce que le navigateur a fait, image après image)
  const stops = [12.8, 13.8, 13.8 + 1.3], t = 13.8 + 1.3 - 5e-7, nt = t + 1 / 60;
  const arret = (predicat) => { const ns = stops.find((x) => predicat(x, t)); return ns != null && nt >= ns ? ns : null; };
  assert.equal(arret((x, t) => x > t), 13.8 + 1.3);
  assert.equal(arret((x, t) => x > t + 1e-6), null, "l'ancienne règle sautait cet arrêt");
  // et on repart toujours d'un arrêt sans s'y arrêter de nouveau : t vaut alors l'arrêt, exactement
  assert.equal(stops.find((x) => x > 13.8), 13.8 + 1.3);
});

test("« À toi de faire » ou le film : le chemin de l'élève ouvre le tutoriel, la page Splat le film ; pour le prof, un lien passe de l'un à l'autre", () => {
  const code = sansCommentaires(page);
  assert.match(page, /<a class="lien" id="autre" href="#" hidden><\/a>\n\s*<a class="lien passer" id="passer"/);
  assert.match(code, /const aToi=!!film\.aToi&&\(voir==='atoi'\|\|\(voir!=='film'&&!PRESENTATION\)\);/);
  assert.match(code, /if\(film\.aToi&&PRESENTATION\)\{const u=new URL\(location\.href\);u\.searchParams\.set\('voir',aToi\?'film':'atoi'\);/);
  assert.match(code, /autre=\{href:u\.pathname\+u\.search,txt:aToi\?'🎬 Voir le film':'✋ À toi de faire'\};/);
  assert.match(code, /if\(autre\)\{const a=\$\('autre'\);a\.href=autre\.href;a\.textContent=autre\.txt;a\.hidden=false;\}/);
  // les deux films de l'étape 35 ont leur tutoriel (les jetons numérotés depuis le lot 4, 08/11/2026)
  assert.equal((code.match(/film\.aToi=aToi;/g) || []).length, 2);
  assert.match(blocBilles(), /passer:SUITE, passerTexte:'Passer ›', credit:film\.credit,/);
  // le bouton sous l'étape 35 ouvre ?film=equasplat&suite=… : il s'appelle « ✋ À toi de faire » (08/11/2026)
  assert.match(carte, /films:\[\["equasplat","À toi de faire","toi"\],\["equasplat-jetons","Les jetons numérotés","toi"\]\]/);
});

test("le film des billes range toujours les jetons, mais ne le dit plus", () => {
  const b = blocBilles(), film = b.slice(0, b.indexOf("const TT="));
  assert.doesNotMatch(sansCommentaires(b), /Range les jetons/);
  assert.match(film, /\[25\.6,'Partage les 9 jetons en 3 parts égales\.'\]/);
  assert.match(film, /for\(const b of sA\)\{D\.va\(b\.tg,b\.p0\);D\.glisse\(b\.tg\+\.45,b\.p1\);\}/);
  assert.match(film, /for\(const b of sB\)\{D\.va\(b\.tg,b\.p0\);D\.glisse\(b\.tg\+\.45,b\.p1\);\}/);
});
