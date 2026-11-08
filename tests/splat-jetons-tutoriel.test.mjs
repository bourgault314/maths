// Lot 4 « aides et carte » (08/11/2026) — étape 35, les jetons numérotés. Choix de Gwenaël (questions à choix du 08/11) :
// - sur la carte, « ✋ Les jetons numérotés » ouvre un tutoriel « À toi de faire » (comme celui des petits jetons) ; le
//   film reste au prof (page Splat), qui passe de l'un à l'autre ;
// - dans le tutoriel, C'EST L'ÉLÈVE QUI CALCULE : il tape 35, 21 + 14 et 7 (clavier à l'ordinateur, pavé au téléphone),
//   il essaie d'abord, et il n'est jamais bloqué (une mauvaise touche n'écrit rien, l'aide arrive) ;
// - le film « Les jetons numérotés » est ralenti par de courtes pauses : l'image tient après chaque geste, et chaque
//   sous-titre reste au moins 3 s (mesuré avant : 1,1 à 2 s pour 7 à 9 mots).
// Ces tests EXÉCUTENT le déroulé du film et du tutoriel, extraits tels quels de la page. Le tutoriel a été joué en entier
// au navigateur, clics et touches réels (voir la notice du lot).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../outils/splat_intro.html", import.meta.url), "utf8");
const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
const bloc = blocs.find((b) => b.includes("FILMS['equasplat-jetons']="));
const prendre = (re, nom) => { const m = bloc.match(re); assert.ok(m, nom + " introuvable"); return m[1]; };
const T = new Function(`return ${prendre(/const T=(\{[\s\S]*?\});/, "T")};`)();
const PAUSES = new Function(`return ${prendre(/const PAUSES=(\[[\s\S]*?\]\]);/, "PAUSES")};`)();
const SOUS_TITRES = new Function("T", `return ${prendre(/const SOUS_TITRES=(\[[\s\S]*?\]\]);/, "SOUS_TITRES")};`)(T);
const enFilm = new Function("PAUSES", `return ${prendre(/const enFilm=(t=>\{[^\n]*\});/, "enFilm")};`)(PAUSES);
const enReel = new Function("PAUSES", `return ${prendre(/const enReel=(x=>\{[^\n]*\});/, "enReel")};`)(PAUSES);
const TT = new Function(`return ${prendre(/const TT=(\(\(\)=>\{[\s\S]*?\}\)\(\));/, "TT")};`)();
const ATT = new Function("TT", `return ${prendre(/const ATT=(\[[\s\S]*?\]);/, "ATT")};`)(TT);
const ECRIRE = new Function(`return ${prendre(/const ECRIRE=(\{[\s\S]*?\}\});/, "ECRIRE")};`)();
const GUIDE_T = new Function("TT", `return ${prendre(/const GUIDE_T=(\[[\s\S]*?\]\]);/, "GUIDE_T")};`)(TT);

test("film des jetons numérotés : chaque sous-titre reste au moins 3 s, le film tient après les gestes", () => {
  for (let i = 0; i < SOUS_TITRES.length - 1; i++) {
    const [a, txt] = SOUS_TITRES[i], b = SOUS_TITRES[i + 1][0];
    const vu = enReel(b) - enReel(a);
    assert.ok(vu >= 3 - 1e-9, `« ${txt} » : ${vu.toFixed(2)} s à l'écran`);
  }
  const total = PAUSES.reduce((n, q) => n + q[1], 0);
  assert.match(bloc, /duration:39\.7\+TOTAL_PAUSES/);
  assert.ok(total >= 15 && total <= 22, `pauses : ${total} s`);
  // le déroulé T ne change pas : les pauses s'intercalent
  assert.equal(T.fin, 36.3);
  // une pause = le même instant du déroulé ; après, le film repart
  for (const [a, p] of PAUSES) {
    assert.equal(enFilm(enReel(a) + p / 2), a);
    assert.ok(Math.abs(enFilm(enReel(a) + p + .2) - (a + .2)) < 1e-9);
    assert.ok(a > 0 && a < T.fin, "pause dans le film");
  }
  // les pauses sont rangées et ne tombent pas pendant le rond bleu d'un toucher du doigt (il resterait figé)
  for (let i = 1; i < PAUSES.length; i++) assert.ok(PAUSES[i][0] > PAUSES[i - 1][0]);
  const touches = [...bloc.matchAll(/D\.touche\((T\.[a-zA-Z]+(?:\[\d\])?)/g)].map((m) => new Function("T", `return ${m[1]}`)(T));
  for (const t of [...T.cleG, ...T.cleD, ...T.cleF, ...T.cleP]) touches.push(t);
  for (const [a] of PAUSES) for (const t of touches) assert.ok(!(a > t && a < t + .45), `pause à ${a} pendant le rond du toucher de ${t}`);
  // aller-retour des chapitres (les flèches du clavier du prof)
  assert.match(bloc, /\]\.map\(c=>\(\{t:enReel\(c\.t\),name:c\.name\}\)\),/);
  assert.match(bloc, /render\(t\)\{this\.dessin\(enFilm\(t\)\);\},/);
});

test("tutoriel des jetons numérotés : 21 gestes, une consigne par geste, le film ne repart que sur le bon", () => {
  assert.equal(ATT.length, 21);
  for (let i = 1; i < ATT.length; i++) assert.ok(ATT[i] > ATT[i - 1] + .5, `attentes ${i - 1} et ${i} trop proches`);
  assert.ok(ATT[ATT.length - 1] < TT.fin);
  // chaque attente a SA consigne, qui passe en vert avec ✓ une fois le geste fait
  for (const a of ATT) assert.equal(GUIDE_T.filter((g) => g[2] === a).length, 1, `consigne de l'attente ${a}`);
  // la consigne de chaque attente est affichée à l'instant de l'attente (elle commence avant)
  for (const a of ATT) { const g = GUIDE_T.find((x) => x[2] === a); assert.ok(g[0] < a, `consigne de ${a} pas encore là`); }
  // le tutoriel est attaché au film : sur le chemin de l'élève, le lecteur l'ouvre à la place du film
  assert.match(bloc, /film\.aToi=aToi;/);
  assert.match(bloc, /build\(svg,mode\)\{construire\(this,svg,mode,TT,true\);\}/);
  assert.match(bloc, /titre:'À toi de faire — Les jetons numérotés — ÉquaSplat — maths&go'/);
});

test("tutoriel : l'élève écrit 35, 21 + 14 (ou 14 + 21) et 7, justes ; l'aide donne le calcul", () => {
  assert.deepEqual(Object.keys(ECRIRE).map(Number), [4, 8, 18]);
  const somme = (s) => s.split("+").reduce((n, x) => n + Number(x), 0);
  assert.deepEqual(ECRIRE[4].ok, ["35"]); assert.equal(somme(ECRIRE[4].ok[0]), 20 + 15);
  for (const s of ECRIRE[8].ok) { assert.equal(somme(s), 35); assert.ok(s.split("+").includes("21"), s); }
  assert.deepEqual(ECRIRE[8].ok.slice().sort(), ["14+21", "21+14"]);
  assert.deepEqual(ECRIRE[18].ok, ["7"]); assert.equal(3 * Number(ECRIRE[18].ok[0]), 21);
  // seulement des touches qui existent : le « + » n'est que dans le pavé de Décomposer
  assert.ok(ECRIRE[4].ok.every((s) => /^\d+$/.test(s)) && ECRIRE[18].ok.every((s) => /^\d+$/.test(s)));
  // chaque écriture a sa consigne « essaie d'abord » (le calcul n'y est pas donné) et son aide (le calcul)
  for (const k of [4, 8, 18]) {
    const g = GUIDE_T.find((x) => x[3] === k);
    assert.ok(g && g[2] === ATT[k], `consigne de l'écriture ${k}`);
    for (const txt of [].concat(g[1])) assert.doesNotMatch(txt, k === 4 ? /35/ : k === 8 ? /14/ : /\b7\b/, `« ${txt} » donne la réponse`);
    assert.equal(ECRIRE[k].aide.length, 2);
    for (const a of ECRIRE[k].aide) assert.ok(a.includes(k === 8 ? "21 + 14" : ECRIRE[k].ok[0]), a);
    assert.match(ECRIRE[k].aide[0], /ou touche la case/);   // à l'ordinateur sans clavier : jamais bloqué
  }
  // une mauvaise touche n'écrit rien : seul un début d'un nombre accepté entre dans la case
  assert.match(bloc, /if\(!ok\.some\(x=>x\.startsWith\(s\)\)\)\{this\.aide\[k\]=true;this\.montrer\(k\);return false;\}/);
  // la case de l'ordinateur : le premier toucher donne le calcul, le second l'écrit
  assert.match(bloc, /if\(bon\)\{if\(!this\.aide\[k\]\)\{this\.aide\[k\]=true;this\.indice=null;return false;\}/);
  // le lecteur passe les touches du clavier au tutoriel, à une attente, sans voler Entrée à un lien
  const lecteur = blocs.find((b) => b.includes("function lancerLecteur("));
  const kd = lecteur.slice(lecteur.indexOf("document.addEventListener('keydown'"));
  const lien = kd.indexOf("if(e.target&&(e.target.tagName==='BUTTON'||e.target.tagName==='A')&&(e.key===' '||e.key==='Enter'))return;");
  assert.ok(lien >= 0 && lien < kd.indexOf("film.taper("), "un lien ou un bouton garde Espace et Entrée");
  assert.match(kd, /if\(film\.taper&&enArret&&!playing&&!e\.ctrlKey&&!e\.metaKey&&!e\.altKey\)\{const r=film\.taper\(t,e\.key\);/);
});
