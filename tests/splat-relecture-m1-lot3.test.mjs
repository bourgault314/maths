import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/* Relecture du monde 1 par Gwenaël, lot 3 « les pages-fiches du livret » (26/09/2026).
   Décisions prises par questions à choix, pour le seul livret Petit SPLAT! (les quatre autres
   familles recevront les mêmes changements dans le lot livret de leur monde) :
   A. plus aucun logo sur les six pages-fiches, retirés AU RENDU (l'outil garde les siens) ;
      le QR reste dans le cadre de consigne, à sa place et à sa taille (réponse A) ;
   C. IREMI et maths&go une seule fois, en bas du dos, à droite du crédit (réponse C2) ; en
      dessous, l'Unité apprenante Michel Debré, demandée par Claire (réponse U2) ;
   D. « page N » au coin extérieur du bas des pages 2 à 7 (réponse D3).
   Le texte réellement imprimé dans les PDF est vérifié dans livret-splat-classique.test.mjs. */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const render = lire("_sources/livret-petit-splat/render.py");
const dos = lire("_sources/livret-petit-splat/dos.html");

test("A. render.py retire les logos de chaque page-fiche, au rendu", () => {
  assert.match(render, /JS_SANS_LOGO = """\(\) => \{\s*const l = document\.querySelectorAll\('\.activity-logos'\);/);
  assert.match(render, /l\[0\]\.remove\(\);/);
  // appelé pour les six fiches (élève et corrigé), après le QR et le pied — pour le livret à plier ;
  // le PDF page par page garde l'IREMI seul (04/10/2026, tests/splat-logos-iremi-page-par-page.test.mjs)
  assert.match(render, /r = await pg\.evaluate\(JS_PIED[\s\S]{0,200}r = await pg\.evaluate\(JS_IREMI_SEUL if iremi else JS_SANS_LOGO\)/);
  // l'outil, lui, garde ses deux logos : une fiche imprimée depuis le générateur est signée
  const outil = lire("outils/splat_tache_barre.html");
  assert.match(outil, /<div class="activity-logos">\s*<img class="activity-logo-irem" src="\$\{PRINT_IREM_LOGO_SRC\}"/);
  assert.match(outil, /<img class="activity-logo-maths" src="\$\{PRINT_MATHS_GO_LOGO_SRC\}"/);
});

test("A. le QR ne bouge pas : toujours dans le cadre de consigne, 20 mm, le bandeau garde 16 mm", () => {
  assert.match(render, /const ins=document\.querySelector\('\.activity-instruction'\);/);
  assert.match(render, /\.qr-livret img\{width:20mm;height:20mm;display:block\}/);
  assert.doesNotMatch(render, /\.activity-header\{[^}]*flex-basis/, "le bandeau n'est pas agrandi");
  assert.match(lire("outils/splat_tache_barre.html"), /\.activity-header \{\s*flex: 0 0 16mm;/);
});

test("C. au dos, IREMI puis maths&go une seule fois, à droite du crédit, l'Unité apprenante dessous ; le haut du dos sans logo", () => {
  assert.equal((dos.match(/logos\/irem\/logo-print\.png/g) || []).length, 1, "un seul logo IREMI");
  assert.equal((dos.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, 1, "un seul logo maths&go");
  const credits = dos.slice(dos.indexOf('<div class="credits">'), dos.indexOf('<footer class="pied">'));
  assert.match(credits, /<div class="txt">[\s\S]*Steve Wyborney[\s\S]*avec l'IREMI de La Réunion\.[\s\S]*<\/div>\s*<div class="droite">\s*<div class="logos-bas">\s*<img class="irem" src="\/assets\/img\/logos\/irem\/logo-print\.png" alt="IREMI La Réunion">\s*<img class="mg" src="\/assets\/img\/logos\/mathsgo\/logo-print\.png" alt="maths&amp;go">\s*<\/div>/,
    "le texte du crédit, puis IREMI, puis maths&go en dernier");
  // le texte du crédit (26/09/2026) : le livret et l'outil sont de maths&go ; le merci à Claire sur sa
  // propre ligne, une seule fois ; l'Unité apprenante n'a que son logo
  assert.match(credits, /Livret et outil <b>Petit SPLAT!<\/b> de maths&amp;go, avec l'IREMI de La Réunion\.<br>\s*Merci à Claire pour la progression «&nbsp;SPLAT! cycle 3&nbsp;», ses idées et sa relecture\.<br>/);
  const lu = dos.replace(/<style>[\s\S]*?<\/style>/, "");
  assert.equal((lu.match(/Claire/g) || []).length, 1, "Claire citée une seule fois dans ce qu'on lit");
  assert.doesNotMatch(credits.replace(/<div class="ua">[\s\S]*$/, ""), /Unité apprenante/, "pas de texte sur l'Unité apprenante dans le crédit");
  // sous les deux logos, l'Unité apprenante Michel Debré (Claire, 26/09/2026, réponse U2) :
  // le nom en entier, sans l'adresse aca.re
  assert.match(credits, /<\/div>\s*<div class="ua"><img src="\/assets\/img\/logos\/ua-debre\/icone\.svg" alt=""><span>Unité apprenante<br>Michel Debré<\/span><\/div>\s*<\/div>/);
  assert.equal((dos.match(/ua-debre\/icone\.svg/g) || []).length, 1, "une seule fois");
  assert.doesNotMatch(dos, /aca\.re/, "pas l'adresse de l'Unité apprenante");
  const ua = lire("assets/img/logos/ua-debre/icone.svg");
  assert.match(ua, /<title>Unité apprenante Michel Debré<\/title>/);
  assert.match(ua, /stroke="#0d7477"/);
  assert.doesNotMatch(ua, /<image|data:/, "vectoriel pur");
  const avantCredits = dos.slice(0, dos.indexOf('<div class="credits">'));
  assert.doesNotMatch(avantCredits.replace(/<style>[\s\S]*?<\/style>/, ""), /logo/, "rien au-dessus du crédit");
  // chaque ligne du crédit tient sur une ligne, à côté des logos
  assert.match(dos, /\.credits \.txt\{flex:1;font-size:10px;white-space:nowrap\}/);
  assert.match(dos, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/);
});

test("D. plus de « page N » : retiré le 26/09/2026 au soir (doublon du numéro de fiche du bandeau)", () => {
  /* Le lot 3 avait posé « page N » au coin extérieur des pages 2 à 7 (réponse D3). À la relecture
     du monde 2, Gwenaël l'a fait retirer : le numéro de fiche du bandeau suffit, et au monde 1,
     où une fiche tient sur une page, « page 3 » tombait sur la fiche 2. */
  assert.doesNotMatch(render, /num-page|JS_NUMERO|CSS_NUMERO|numero=/);
  assert.match(render, /await pdf\(url, tmp \/ f"p\{f\['n'\]\+1\}\.pdf", injecter=f"\{qrweb\}\/fiche\{f\['n'\]\}\.png"\)/);
  const r2 = readFileSync(new URL("../_sources/livret-splat-classique/render.py", import.meta.url), "utf8");
  assert.doesNotMatch(r2, /num-page|JS_NUMERO|CSS_NUMERO/);
});
