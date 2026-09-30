import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 30/09/2026 (questions à choix de Gwenaël) :
   - au téléphone, la ligne d'opération garde « −54 » mais « ↓ » devient une petite flèche courbe
     (même forme que les flèches de l'ordinateur et des corrigés) ; la vue Rédaction garde « ↓ » ;
   - au téléphone, la ligne d'avant ne se coupe plus net : le haut du cadre s'estompe quand il a défilé ;
   - un seul mot à l'écran, « côtés », à l'ordinateur comme au téléphone (comme Splat Équations). */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function source(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

test("la ligne d'opération porte « ↓ » ET la petite courbe, le style choisit", () => {
  const rendre = Function(`
    const escapeHtml = v => String(v);
    ${source("operationCurveSvg")}
    ${source("renderOperationRow")}
    return renderOperationRow;
  `)();
  const ligne = rendre({type:"bothSides", label:"−54"});
  assert.equal((ligne.match(/class="operationArrow"/g) || []).length, 2);
  assert.equal((ligne.match(/class="operationCurve"/g) || []).length, 2);
  assert.match(ligne, /M 13 2 Q 1 15 13 28/, "à gauche, la courbe bombe vers la gauche");
  assert.match(ligne, /M 3 2 Q 15 15 3 28/, "à droite, la courbe bombe vers la droite");
  assert.match(ligne, /aria-label="Même opération des deux côtés : −54"/);
});

test("au téléphone la courbe remplace « ↓ » ; ailleurs « ↓ » reste (vue Rédaction)", () => {
  assert.match(html, /\.operationCurve\{\s*display:none;\s*\}/);
  const tel = html.slice(html.indexOf(".operationCurve{"), html.indexOf(".operationCurve{") + 900);
  assert.match(tel, /@media \(max-width:760px\)\{\s*\.equationOpRow \.operationArrow\{\s*display:none;/);
  assert.match(tel, /\.equationOpRow \.operationCurve\{\s*display:block;/);
});

test("la ligne d'avant s'estompe seulement quand le cadre a défilé", () => {
  assert.match(html, /\.equationHistory\.defile\{\s*-webkit-mask-image:linear-gradient\(to bottom, transparent 0, #000 34px\);/);
  const marque = source("markEquationHistoryScrolled");
  assert.match(marque, /classList\.toggle\("defile", equationHistory\.scrollTop > 2\)/);
  assert.match(source("renderEquationHistory"), /markEquationHistoryScrolled\(\);/);
  assert.match(html, /equationHistory\.addEventListener\("scroll", markEquationHistoryScrolled/);
});

test("« côtés » partout à l'écran : plus aucun « membre » dans ce que lit l'élève", () => {
  assert.match(html, /<span class="desktopLabel">Enlever des deux côtés<\/span><span class="mobileLabel">Enlever des deux côtés<\/span>/);
  assert.match(html, /<span class="desktopLabel">Ajouter des deux côtés<\/span><span class="mobileLabel">Ajouter des deux côtés<\/span>/);
  assert.match(html, /<h2 class="dialogTitle">Ajouter des deux côtés<\/h2>/);
  // Textes affichés : chaînes entre guillemets, gabarits et contenu des balises (commentaires exclus).
  const sansCommentaires = html
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/<meta name="description"[^>]*>/, "");
  const affiches = sansCommentaires.match(/"[^"\n]*membre[^"\n]*"|`[^`\n]*membre[^`\n]*`|>[^<\n]*membre[^<\n]*</g) || [];
  assert.deepEqual(affiches, []);
});

test("ÉquaBarre, l'outil jumeau, reçoit les mêmes changements (choix de Gwenaël)", async () => {
  const barre = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");
  assert.match(barre, /function operationCurveSvg\(dir\)/);
  assert.match(barre, /\.equationHistory\.defile\{/);
  assert.match(barre, /markEquationHistoryScrolled\(\);\s*syncEquationToggleButton\(\);/);
  assert.match(barre, /<span class="desktopLabel">Enlever des deux côtés<\/span>/);
  const affiches = barre
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .match(/"[^"\n]*membre[^"\n]*"|`[^`\n]*membre[^`\n]*`|>[^<\n]*membre[^<\n]*</g) || [];
  assert.deepEqual(affiches, []);
});

/* Retours de Gwenaël du 30/09 au soir (sur son téléphone) :
   - la petite courbe de droite touchait le dernier nombre de la ligne du dessus (« 41 » après +6𝑛) :
     elle ne monte plus du tout dans cette ligne (aucune marge négative en haut), dans les deux outils ;
   - ÉquaBarre : « Enlever des deux côtés » choisi prenait le fond pêche du survol (collé après le
     toucher) avec l'écriture blanche de l'outil choisi, illisible. Mesuré au navigateur avant/après
     (Chromium 390 et 1440) ; ce test garde l'ordre des règles, que le navigateur applique. */
function regleCourbe(page){
  const i = page.indexOf(".equationOpRow .operationCurve{");
  assert.notEqual(i, -1);
  return page.slice(i, page.indexOf("}", i));
}

test("la petite courbe ne monte plus dans la ligne du dessus (ÉquaSplat et ÉquaBarre)", async () => {
  const barre = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");
  for(const page of [html, barre]){
    const regle = regleCourbe(page);
    const marge = regle.match(/margin:(-?\d+)(?:px)? /);
    assert.ok(marge, "la courbe garde une marge écrite");
    assert.ok(Number(marge[1]) >= 0, "pas de marge négative en haut");
    assert.match(regle, /height:26px;/);
  }
});

test("ÉquaBarre : « Enlever des deux côtés » choisi reste bleu sous le doigt", async () => {
  const barre = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");
  const survol = barre.indexOf(".globalToolBtn:hover{");
  const choisi = barre.indexOf(".globalToolBtn.active,\n  .globalToolBtn.active:hover{");
  assert.notEqual(survol, -1);
  assert.ok(choisi > survol, "la règle de l'outil choisi vient après le survol pêche");
  const regle = barre.slice(choisi, barre.indexOf("}", choisi));
  assert.match(regle, /background:linear-gradient\(180deg,#60a5fa,#3b82f6\);/);
  assert.match(regle, /color:#fff;/);
});
