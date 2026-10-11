// Les films « Comment on joue ? » de l'univers SPLAT! (10/10/2026) : un seul lecteur, outils/splat_intro.html,
// qui joue le film d'introduction sans paramètre et les films des étapes avec ?film=… ; et leurs liens sous
// les étapes de la carte des mondes (vue élève).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
  // un nom inconnu (ou « intro », ou rien) lance l'introduction ; jamais une propriété héritée d'Object
  assert.match(page, /lancerLecteur\(Object\.prototype\.hasOwnProperty\.call\(FILMS,nom\)&&nom!=='intro'\?FILMS\[nom\]:FILMS\.intro\);/);
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
  assert.match(jetons, /\['btn','Fusionner',/);
  assert.ok(jetons.includes("{g:'3𝑝',d:'12 + 9'},{g:'3𝑝',d:'21',t:T.fusionne+.05}"));
  // le lecteur règle le rapport largeur / hauteur du portrait d'après le film (3:4 pour l'introduction)
  assert.match(page, /player\.style\.setProperty\('--k',\(dim\.w\/dim\.h\)\.toFixed\(4\)\)/);
  assert.match(page, /\.player\.portrait \.stage\{aspect-ratio:var\(--k,\.75\)\}/);
});

test("aucune équation de la série de l'étape 35 dans les films (on ne donne pas les réponses)", () => {
  const serie = ["𝑚 + 2", "7 = 𝑥 + 4", "28", "𝑏 + 6", "26 + 16", "𝑎 + 16", "2𝑏", "3𝑥", "2𝑛", "4𝑚", "14 + 11", "3𝑐"];
  const films = sansCommentaires(page.slice(page.indexOf("const ECRAN_EQ=")));
  for (const s of serie) assert.ok(!films.includes(`'${s}'`), s);
  assert.ok(films.includes("'𝑡 + 3'") && films.includes("'3𝑦'") && films.includes("'20 + 15'") && films.includes("'3𝑝'"));
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
  // le film d'une étape propose « Passer le film › », bien visible ; l'introduction garde « Passer l'intro › »
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  for (const nom of ["FILMS.equasplat=", "FILMS['equasplat-jetons']=", "FILMS.dessine="]) {
    assert.ok(blocs.find((b) => b.includes(nom)).includes("passerTexte:'Passer le film ›'"), nom);
  }
  assert.ok(!blocs.find((b) => b.includes("FILMS.intro=film;")).includes("passerTexte"));
  assert.match(page, /<a class="lien passer" id="passer" href="#" hidden>Passer l’intro ›<\/a>/);
  assert.match(page, /if\(film\.passerTexte\)\$\('passer'\)\.textContent=film\.passerTexte;/);
  assert.match(page, /\.passer\{color:var\(--accent\);background:var\(--accent-soft\);border-radius:999px;/);
});

test("le caractère ▶ est toujours suivi de U+FE0E (sinon l'iPhone le dessine en émoji)", () => {
  const texte = sansCommentaires(page);
  const mauvais = [...texte.matchAll(/▶(?!︎|&#xFE0E;)/g)].map((m) => texte.slice(m.index - 20, m.index + 5));
  assert.deepEqual(mauvais, []);
});

test("carte des mondes : les films sous les étapes 2 et 35, qui reviennent au jeu de l'étape", () => {
  assert.match(carte, /p:"m3e1",id:"e2-0",\n\s*films:\[\["equasplat","Comment on joue \?"\],\["equasplat-jetons","Avec des jetons numérotés"\]\],/);
  // le lien : le lecteur, le film, et ?suite= = la carte avec ?jouer=<parcours>, qui renvoie aussitôt au jeu de
  // l'étape (11/10/2026 : avant, ?suite= portait le lien du jeu en entier, #data= compris — une adresse de plusieurs Ko)
  assert.ok(carte.includes(`(e.films?e.films.map(f=>'<a class="filmLien" href="/outils/splat_intro.html?film='+f[0]+'&amp;suite='+encodeURIComponent(e.p?'/outils/splat_univers.html?jouer='+e.p:e.j)+'">\\ud83c\\udfac '+f[1]+'</a>').join(''):'')`));
  assert.match(carte, /const jouer=new URLSearchParams\(window\.location\.search\)\.get\("jouer"\);/);
  assert.match(carte, /window\.location\.replace\(MONDES\[mi\]\.etapes\.find\(e=>e\.p===jouer\)\.j\);/);
  // ?jouer= n'ouvre que les mondes jouables : ni un monde en préparation sans la clé, ni un monde fermé à la classe
  assert.match(carte, /const mi=MONDES\.findIndex\(m=>jouable\(m\)&&m\.etapes\.some\(e=>e\.p===jouer&&e\.j\)\);/);
  // les étapes qui ont un film : la 35 (deux films) et la 2 (« Dessine les jetons »)
  assert.match(carte, /p:"m1e2",dessin:true,\n\s*films:\[\["dessine","Comment on joue \?"\]\],/);
  assert.equal((carte.match(/\bfilms:\[\[/g) || []).length, 2);
});

/* Ouvert depuis la page Splat du catalogue (sans ?suite=), le film est présenté par le prof : il ne mène pas
   au jeu. Ni « Passer le film › » ni « Je joue » ; à la fin, « ↺ Revoir le film » et le retour à la page Splat
   (choix de Gwenaël, 11/10/2026). Le chemin de l'élève, lui, porte toujours ?suite= et ne change pas. */
test("film ouvert depuis la page Splat : « Revoir le film » et retour à la page Splat, pas de « Je joue »", () => {
  const code = sansCommentaires(page);
  assert.match(code, /const PRESENTATION=!new URLSearchParams\(location\.search\)\.has\('suite'\);/);
  assert.match(code, /const RETOUR_PAGE='\/outils\/\?domain=algebre&collection=splat';/);
  assert.match(code, /if\(film\.passer&&!PRESENTATION\)\{\$\('passer'\)\.href=film\.passer;/);
  // les trois écrans de fin (introduction, films d'ÉquaSplat, « Dessine les jetons ») passent par le même assemblage
  assert.equal((code.match(/F\.boutonsFin\(o,fi\);/g) || []).length, 3);
  // « Je joue » n'existe plus que dans F.boutonsFin, sur le chemin de l'élève
  assert.equal((code.match(/'Je joue'/g) || []).length, 1);
  assert.equal((code.match(/href:SUITE/g) || []).length, 1);
  const bf = code.slice(code.indexOf("boutonsFin(o,fi){"), code.indexOf("\n};", code.indexOf("boutonsFin(o,fi){")));
  assert.match(bf, /if\(!PRESENTATION\)\{\s*o\.jouer=F\.E\('a',\{href:SUITE,class:'film-lien'\},o\.fin\);/);
  assert.match(bf, /t\.textContent='↺ Revoir le film';/);
  assert.match(bf, /o\.revoir=F\.E\('a',\{href:RETOUR_PAGE,class:'film-lien'\},o\.fin\);/);
  assert.match(bf, /\.textContent='‹ Retour à la page Splat';/);
  // le gros bouton n'est pas un lien : le clic tombe sur le film, qui repart du début quand il est fini
  assert.match(code, /stage\.addEventListener\('click',e=>\{if\(e\.target\.closest&&e\.target\.closest\('a'\)\)return;toggle\(\);\}\);/);
  assert.match(code, /function play\(\)\{enArret=false;if\(fresh\)\{fresh=false;setT\(0\);\}else if\(t>=D-1e-3\)setT\(0\);/);
});

test("la carte des mondes envoie toujours ses films avec ?suite= : rien ne change pour l'élève", () => {
  const liens = [...carte.matchAll(/\/outils\/splat_intro\.html/g)].map((m) => carte.slice(m.index, m.index + 90));
  assert.equal(liens.length, 4, "lien du monde 1, vue prof, films sous les étapes, chemin du parcours");
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
  assert.equal((page.match(/credit:'Jeu SPLAT! créé par/g) || []).length, 4);
  assert.doesNotMatch(page, /Jeu Splat!/);
  assert.match(diapo, /Jeu SPLAT! créé par/);
});
