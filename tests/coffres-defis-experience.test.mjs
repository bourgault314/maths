import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = [
  "outils/club_maths/coffres_magiques.html",
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/calcul_mental/defi_tables.html",
  "outils/calcul_mental/defi_calcul.html"
];

const pages = Object.fromEntries(await Promise.all(paths.map(async path => [
  path,
  await readFile(new URL(`../${path}`, import.meta.url), "utf8")
])));

test("les quatre jeux proposent un plein écran accessible avec repli iPhone quittable", () => {
  for (const [path, html] of Object.entries(pages)) {
    assert.match(html, /<button[^>]*data-fullscreen-toggle[^>]*aria-pressed="false"[^>]*aria-label="Passer en plein écran"/, path);
    assert.match(html, /requestFullscreen \|\| root\.webkitRequestFullscreen/, path);
    assert.match(html, /document\.exitFullscreen \|\| document\.webkitExitFullscreen/, path);
    assert.match(html, /root\.classList\.add\("fullscreen-fallback"\)/, path);
    assert.match(html, /height:\s*100dvh/, path);
    assert.match(html, /Quitter le plein écran/, path);
    assert.match(html, /class="fullscreen-expand"/, path);
    assert.match(html, /class="fullscreen-collapse"/, path);
    assert.doesNotMatch(html, />⛶</, path);
    assert.match(html, /event\.key[^\n]+"Escape"[\s\S]*fullscreen-fallback/, path);
    assert.match(html, /body\.fullscreen-active \.site-footer[\s\S]{0,80}display:\s*none;?/, path);
  }
});

test("Coffres à deux explique visuellement les quatre opérations réellement jouées", () => {
  const html = pages["outils/club_maths/coffres_magiques.html"];
  assert.match(html, /sum-bar-model[^>]+Cinq points dans la barre du haut[^>]+trois points et deux points dans deux rectangles jointifs/i);
  assert.match(html, /class="measure-marker sum-marker">somme = 5[\s\S]*class="bar-segment units-5 whole-part"/);
  assert.match(html, /class="bar-segment units-5 whole-part">[\s\S]*?--points:5[\s\S]*?class="bar-segment units-3 blue-part">[\s\S]*?--points:3[\s\S]*?class="bar-segment units-2 coral-part">[\s\S]*?--points:2/);
  assert.match(html, /Somme : réunir deux quantités[\s\S]*La somme de 3 et de 2 est 5\.[\s\S]*3 \+ 2 = 5[\s\S]*La somme est le résultat d’une addition\./);
  assert.match(html, /3 \+ 2 = 5/);
  assert.match(html, /difference-bar-model[^>]+Cinq points sont alignés au-dessus de deux points[^>]+trois autres, surlignés[^>]+Sous ces trois derniers points[^>]+crochet tourné vers eux/i);
  assert.match(html, /bar-dot unmatched[\s\S]*class="difference-known"[\s\S]*class="difference-marker">différence = 3/);
  assert.match(html, /\.difference-marker::before\s*\{[^}]*top:\s*0[^}]*border-bottom:\s*2px solid #bd7900/);
  assert.match(html, /bar-dot matched[\s\S]*bar-dot matched[\s\S]*bar-dot unmatched[\s\S]*bar-dot unmatched[\s\S]*bar-dot unmatched/);
  assert.match(html, /class="difference-known">[\s\S]*?--points:2/);
  assert.match(html, /Différence : l’écart entre deux quantités[\s\S]*La différence entre 5 et 2 est 3\.[\s\S]*5 − 2 = 3[\s\S]*La différence est le résultat d’une soustraction\./);
  assert.match(html, /5 − 2 = 3/);
  assert.match(html, /\.bar-diagram\s*\{[^}]*gap:\s*0/);
  assert.match(html, /\.bar-row\s*\{[^}]*border:\s*2px solid #54758a[^}]*border-radius:\s*0/);
  assert.match(html, /\.bar-row \+ \.bar-row\s*\{\s*border-top:\s*0/);
  assert.match(html, /\.bar-segment:not\(:last-child\)\s*\{\s*border-right:\s*2px solid #54758a/);
  assert.match(html, /\.difference-known\s*\{[^}]*border:\s*2px solid #54758a[^}]*border-top:\s*0/);
  assert.doesNotMatch(html, /box-shadow:\s*inset 2px 0 0 #7898ac/);
  assert.doesNotMatch(html, /dots-equation|difference-lines|dot-set|missing-part/);
  assert.match(html, /array-dimension array-dimension-top">4[\s\S]*array-dimension array-dimension-side">3[\s\S]*--dot-columns:4/);
  assert.match(html, /array-dimension array-dimension-top">3[\s\S]*array-dimension array-dimension-side">4[\s\S]*--dot-columns:3/);
  assert.match(html, /<span>3 rangées de 4<\/span>[\s\S]*?<span>4 rangées de 3<\/span>/);
  assert.match(html, /\.dot-array\s*\{[\s\S]*?border-radius:\s*0/);
  assert.match(html, /3 × 4 = 12 ; 4 × 3 = 12 aussi/);
  assert.match(html, /Produit : former des rangées égales[\s\S]*Le produit de 3 par 4 est 12\.[\s\S]*Le produit est le résultat d’une multiplication/);
  assert.match(html, /Grouper : <strong>4 paquets de 2<\/strong>/);
  assert.match(html, /Partager : <strong>2 paquets de 4<\/strong>/);
  const quotientMemo = html.match(/<article class="operation-visual-card">\s*<h3>Quotient[\s\S]*?<\/article>/)?.[0] || "";
  assert.equal([...quotientMemo.matchAll(/--package-size:2/g)].length, 4);
  assert.equal([...quotientMemo.matchAll(/--package-size:4/g)].length, 2);
  assert.match(quotientMemo, /quotient-bar groups-of-two[\s\S]*quotient-bar groups-of-four/);
  assert.match(html, /\.quotient-bar\s*\{[\s\S]*?border-radius:\s*0/);
  assert.doesNotMatch(html, /quotient-pair|quotient-groups/);
  assert.match(html, /8 ÷ 2 = 4/);
  assert.match(html, /Le quotient de 8 par 2 est 4\.[\s\S]*8 ÷ 2 = 4[\s\S]*Le quotient est le résultat d’une division\./);
  assert.match(html, /aria-label="Ordre des nombres dans le jeu"[\s\S]*Tu peux choisir les deux cases dans n’importe quel ordre\.[\s\S]*Différence :<\/strong> le jeu calcule le plus grand nombre − le plus petit\.[\s\S]*Quotient :<\/strong> le jeu calcule le plus grand nombre ÷ le plus petit, seulement si la division tombe juste\./);
  assert.match(html, /runes voisines/);
});

test("Coffres solo illustre précisément les quatre opérations", () => {
  const html = pages["outils/calcul_mental/coffres_magiques_solo.html"];
  assert.match(html, /Le rectangle du haut contient 5 points[^<]+deux rectangles jointifs contiennent 3 points puis 2 points[^<]+3 plus 2 égale 5/);
  assert.match(html, /sum-marker"><span>somme = 5<\/span>/);
  assert.match(html, /quantity-row quantity-total[\s\S]*?--dot-count:5[\s\S]*?quantity-first" style="--quantity-value:3"[\s\S]*?--dot-count:3[\s\S]*?quantity-second" style="--quantity-value:2"[\s\S]*?--dot-count:2/);
  assert.match(html, /3 \+ 2 = 5/);
  assert.match(html, /Le rectangle du haut contient 5 points alignés[^<]+Les 3 points restants du haut sont mis en évidence[^<]+5 moins 2 égale 3/);
  assert.match(html, /comparison-unit unmatched[\s\S]*?comparison-unit unmatched[\s\S]*?comparison-unit unmatched/);
  assert.match(html, /comparison-upper[\s\S]*?comparison-lower" style="--difference-center:70%">[\s\S]*?difference-marker" style="grid-column:3 \/ -1"><\/span>[\s\S]*?difference-marker-label near">différence = 3<\/span>/);
  assert.match(html, /5 − 2 = 3/);
  assert.doesNotMatch(html, /bar-model-label|bar-missing|>\s*(?:Tout|Parties?)\s*</);
  assert.match(html, /Un réseau de 3 rangées et 4 colonnes contient 12 points/);
  assert.match(html, /dimension-columns"><span>4<\/span>[\s\S]*?dimension-rows"><span>3<\/span>[\s\S]*?--dot-columns:4/);
  assert.match(html, /Un réseau de 4 rangées et 3 colonnes contient 12 points/);
  assert.match(html, /dimension-columns"><span>3<\/span>[\s\S]*?dimension-rows"><span>4<\/span>[\s\S]*?--dot-columns:3/);
  assert.match(html, /<span>3 rangées de 4<\/span>[\s\S]*?<span>4 rangées de 3<\/span>/);
  assert.match(html, /3 × 4 = 12 ; 4 × 3 = 12 aussi/);
  assert.match(html, /Grouper : 4 paquets de 2/);
  assert.match(html, /Partager : 2 paquets de 4/);
  assert.match(html, /data-group-count="4" data-group-size="2" data-total-units="8"/);
  assert.match(html, /data-group-count="2" data-group-size="4" data-total-units="8"/);
  assert.match(html, /\.quotient-bar\s*\{[\s\S]*?border-radius:\s*0/);
  assert.doesNotMatch(html, /quotient-pair|quotient-groups|demo-group/);
  assert.match(html, /Le quotient de 8 par 2 est 4\.[\s\S]*8 ÷ 2 = 4/);
  assert.match(html, /aria-label="Ordre des nombres dans le jeu"[\s\S]*Tu peux choisir les deux cases dans n’importe quel ordre\.[\s\S]*Différence :<\/strong> le jeu calcule le plus grand nombre − le plus petit\.[\s\S]*Quotient :<\/strong> le jeu calcule le plus grand nombre ÷ le plus petit, seulement si la division tombe juste\./);
});

test("les repères du produit restent droits et épousent le réseau", () => {
  const duel = pages["outils/club_maths/coffres_magiques.html"];
  const solo = pages["outils/calcul_mental/coffres_magiques_solo.html"];

  assert.match(solo, /\.dimension-rows\s*\{[^}]*align-self:\s*stretch[^}]*justify-self:\s*stretch[^}]*display:\s*grid[^}]*writing-mode:\s*horizontal-tb/);
  assert.match(solo, /\.dimension-rows span\s*\{[^}]*transform:\s*none[^}]*writing-mode:\s*horizontal-tb/);
  assert.match(solo, /\.dimension-rows::before\s*\{[^}]*inset:\s*0 0 0 auto[^}]*border-top:\s*2px solid #6d3ac7[^}]*border-bottom:\s*2px solid #6d3ac7[^}]*border-left:\s*2px solid #6d3ac7/);
  assert.doesNotMatch(solo, /\.dimension-rows(?:\s+span)?\s*\{[^}]*(?:writing-mode:\s*vertical|rotate\()/);

  assert.match(duel, /\.array-dimension-top\s*\{[^}]*justify-self:\s*stretch[^}]*border-bottom:\s*2px solid #6d3ac7[^}]*writing-mode:\s*horizontal-tb[^}]*transform:\s*none/);
  assert.match(duel, /\.array-dimension-top::before,\s*\.array-dimension-top::after\s*\{[^}]*bottom:\s*-6px[^}]*width:\s*2px[^}]*height:\s*6px[^}]*background:\s*#6d3ac7/);
  assert.match(duel, /\.array-dimension-side\s*\{[^}]*align-self:\s*stretch[^}]*justify-self:\s*stretch[^}]*display:\s*grid[^}]*writing-mode:\s*horizontal-tb[^}]*transform:\s*none/);
  assert.match(duel, /\.array-dimension-side::before\s*\{[^}]*inset:\s*0 0 0 auto[^}]*border-top:\s*2px solid #6d3ac7[^}]*border-bottom:\s*2px solid #6d3ac7[^}]*border-left:\s*2px solid #6d3ac7/);
  assert.doesNotMatch(duel, /\.array-dimension-side\s*\{[^}]*(?:writing-mode:\s*vertical|rotate\()/);
});

test("les dialogues Coffres prennent, piègent et restaurent le focus", () => {
  const duel = pages["outils/club_maths/coffres_magiques.html"];
  const solo = pages["outils/calcul_mental/coffres_magiques_solo.html"];

  for (const html of [duel, solo]) {
    assert.match(html, /function createModalController\(\)/);
    assert.match(html, /event\.key === "Escape"[\s\S]*event\.stopImmediatePropagation\(\)/);
    assert.match(html, /event\.key !== "Tab"[\s\S]*event\.shiftKey/);
    assert.match(html, /activeTrigger[\s\S]*focus\(\{ preventScroll \}\)/);
    assert.match(html, /dialogs\.open\(result, \{ initialFocus: "#play-again" \}\)/);
  }

  assert.match(duel, /id="rules-title" tabindex="-1"/);
  assert.match(duel, /dialogs\.open\(rules,[\s\S]*initialFocus: mandatory \? "\.close-rules" : "#rules-title"[\s\S]*onEscape: \(\) => \{[\s\S]*if \(!rulesMandatory\) closeRules\(\)/);
  assert.match(solo, /id="lesson-title" tabindex="-1"/);
  assert.match(solo, /function openLesson\(\) \{[\s\S]*trigger: null,[\s\S]*initialFocus: "#start-game"/);
  const lessonActions = solo.match(/<div class="lesson-actions">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.equal((lessonActions.match(/<button/g) || []).length, 1);
  assert.doesNotMatch(solo, /id="close-lesson"|id="show-lesson"|Voir le plateau|>Mémo<\/button>/);
  assert.match(solo, /const resetScroll = dialog => \{[\s\S]*node\.scrollTop = 0[\s\S]*node\.scrollLeft = 0/);
});

test("le pied public disparaît pendant chaque défi chronométré", () => {
  for (const path of [
    "outils/calcul_mental/defi_tables.html",
    "outils/calcul_mental/defi_calcul.html"
  ]) {
    const html = pages[path];
    assert.match(html, /document\.body\.classList\.toggle\("challenge-playing", name === "play"\)/, path);
    assert.match(html, /body\.challenge-playing \.site-footer[\s\S]*display:\s*none/, path);
  }
});
