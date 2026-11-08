// Lot « films : liens et boutons » (08/11/2026, choix de Gwenaël sur les planches 3, 4, 6 et 6b) :
// - ouvert depuis le bouton d'une étape sur la carte (&depuis=carte&etape=<id>), le film a « ‹ Carte des mondes »
//   à gauche de la ligne du bas et pas de « Passer le film › » ; la pastille ramène à la carte, sur cette étape ;
// - ouvert par « Continuer » / « Étape suivante », « ‹ Carte » s'ajoute à « Passer le film › », sur une seule ligne
//   au téléphone ; au téléphone, plus de « Plein écran » ;
// - le mode présentation (sans ?suite=) ne change pas ;
// - sur la carte : boutons blancs au contour de la couleur du monde (rond ▶ + « Le film » + durée, ✋ pour
//   « À toi de faire ») ; le film d'introduction est le bouton de l'étape 1, et « Continuer » passe par lui.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const page = lire("outils/splat_intro.html");
const carte = lire("outils/splat_univers.html");

/* les deux constantes du lecteur, évaluées pour une adresse donnée */
function retour(search, suite) {
  const dep = page.match(/const DEPUIS_CARTE=[^\n]*\n/)[0];
  const car = page.match(/const CARTE=\(\(\)=>\{[\s\S]*?\}\)\(\);\n/)[0];
  return new Function("location", "SUITE", `${dep}${car}return {DEPUIS_CARTE,CARTE};`)({ search }, suite);
}

test("lecteur : la pastille « ‹ Carte des mondes » ouvre la ligne des boutons (en haut du cadre depuis le lot 3b), cachée par défaut", () => {
  assert.match(page, /<div class="barre" id="barre">\n\s*<a class="lien carte" id="carte" href="\/outils\/splat_univers\.html" hidden><span>‹ Carte<span class="long">&nbsp;des mondes<\/span><\/span><\/a>\n\s*<button class="lien" id="fs"/);
  assert.match(page, /\.carte\{color:var\(--accent\);background:var\(--accent-soft\);border-radius:999px;padding:9px 18px;font-size:16px;font-weight:800\}/);
});

test("lecteur : depuis la carte, pas de « Passer » ; sur le chemin de l'élève, toujours la carte ; en présentation, rien", () => {
  assert.match(page, /if\(film\.passer&&!PRESENTATION&&!DEPUIS_CARTE\)\{\$\('passer'\)\.href=film\.passer;\$\('passer'\)\.hidden=false;/);
  assert.match(page, /if\(!PRESENTATION\)\{\$\('carte'\)\.href=CARTE;\$\('carte'\)\.hidden=false;\}/);
  assert.match(page, /\$\('barre'\)\.classList\.toggle\('avecPasser',!\$\('passer'\)\.hidden\);/);
});

test("lecteur : la carte rouverte sur l'étape (ancre), la vue prof sur la vue prof, rien d'autre dans l'adresse", () => {
  const j = "/outils/splat_univers.html?jouer=m1e2";
  assert.deepEqual(retour("?film=dessine&suite=x&depuis=carte&etape=e0-1", j), { DEPUIS_CARTE: true, CARTE: "/outils/splat_univers.html#e0-1" });
  assert.deepEqual(retour("?film=dessine&suite=x", j), { DEPUIS_CARTE: false, CARTE: "/outils/splat_univers.html" });
  assert.deepEqual(retour("?suite=x&depuis=carte", "/outils/splat_univers.html?prof=1"), { DEPUIS_CARTE: true, CARTE: "/outils/splat_univers.html?prof=1" });
  // une ancre fabriquée n'entre pas dans le lien
  for (const e of ["\"><script>", "a b", "x".repeat(41), "javascript:alert(1)"])
    assert.equal(retour("?suite=x&depuis=carte&etape=" + encodeURIComponent(e), j).CARTE, "/outils/splat_univers.html", e);
  // « depuis » ne vaut que « carte »
  assert.equal(retour("?suite=x&depuis=autre", j).DEPUIS_CARTE, false);
});

test("lecteur au téléphone : une seule ligne, plus de « Plein écran », « Carte » tout court à côté de « Passer »", () => {
  const m = page.match(/@media \(max-width:640px\)\{([\s\S]*?)\n\}/)[1];
  assert.match(m, /#fs\{display:none\}/);
  // le crédit n'est plus sous le film : il est sur le carton de titre (lot 3b, 08/11/2026)
  assert.doesNotMatch(m, /credit/);
  assert.match(m, /\.barre\.avecPasser #carte \.long\{display:none\}/);
  // en dehors du téléphone, « Plein écran » reste dans la ligne
  assert.doesNotMatch(page.replace(m, ""), /#fs\{display:none\}/);
});

test("carte : les boutons des films, au contour de la couleur du monde, avec leur durée", () => {
  assert.match(carte, /\.actions a\.filmLien\{color:var\(--c-monde,var\(--teal\)\);background:#fff;border:2px solid var\(--c-monde,var\(--teal\)\);/);
  for (const [c, v] of [["m1", "orange"], ["m2", "blue"], ["m3", "teal"]]) assert.match(carte, new RegExp(`\\.${c}\\{--c-monde:var\\(--${v}\\)\\}`));
  assert.ok(carte.includes(`(f[2]==='toi'?'<span class="main" aria-hidden="true">\\u270b</span>'+f[1]:'<span class="rond" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M4 2.6v6.8L9.4 6z"/></svg></span>'+f[1]+(f[2]?'<span class="duree">'+f[2]+' s</span>':''))`));
  // plus aucun « Comment on joue ? » affiché (il reste dans un commentaire d'histoire du code)
  assert.doesNotMatch(carte.replace(/\/\*[\s\S]*?\*\//g, ""), /Comment on joue \?/);
  assert.doesNotMatch(carte, /introLien/);
});

test("carte : la durée écrite sur chaque bouton est celle du film (arrondie)", () => {
  const blocs = page.split("<script>").slice(1).map((b) => b.split("</script>")[0]);
  const duree = (marque) => Number(blocs.find((b) => b.includes(marque)).match(/duration:([\d.]+)/)[1]);
  const vrai = { intro: duree("FILMS.intro=film;"), dessine: duree("FILMS.dessine="), paquets: duree("FILMS.paquets="), "equasplat-jetons": duree("FILMS['equasplat-jetons']=") };
  const ecrits = [...carte.matchAll(/\["([a-z-]+)","[^"]+",(\d+)\]/g)];
  // trois films ont leur durée sur la carte ; les deux boutons de l'étape 35 sont des tutoriels (lot 4, 08/11/2026)
  assert.equal(ecrits.length, 3);
  for (const [, f, s] of ecrits) assert.equal(Number(s), Math.round(vrai[f]), f);
});

test("carte : le film d'introduction est le bouton de l'étape 1, et le parcours passe par lui", () => {
  assert.match(carte, /p:"m1e1",\n\s*films:\[\["intro","Le film",43\]\],/);
  const def = carte.match(/function versEtape\(e\)\{return [^\n]*\}/);
  const versEtape = new Function(`${def[0]}; return versEtape;`)();
  assert.equal(versEtape({ p: "m1e1", j: "/x", films: [["intro", "Le film", 43]] }),
    "/outils/splat_intro.html?film=intro&suite=" + encodeURIComponent("/outils/splat_univers.html?jouer=m1e1"));
  // le lecteur joue bien l'introduction pour ?film=intro
  assert.match(page, /const film=Object\.prototype\.hasOwnProperty\.call\(FILMS,nom\)&&nom!=='intro'\?FILMS\[nom\]:FILMS\.intro;/);
});

test("vue prof : « Présenter le principe » revient à la vue prof par la pastille, sans « Passer » en double", () => {
  assert.ok(carte.includes(`li.push('<li><a href="/outils/splat_intro.html?suite='+encodeURIComponent('/outils/splat_univers.html?prof=1')+'&depuis=carte">'+IC.diapo+`));
});
