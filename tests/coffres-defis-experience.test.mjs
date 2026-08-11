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
  assert.match(html, /Somme : on réunit[\s\S]*On réunit les 3 points et les 2 points ; la ligne complète en contient 5/);
  assert.match(html, /3 \+ 2 = 5/);
  assert.match(html, /difference-bar-model[^>]+Cinq points sont alignés au-dessus de deux points[^>]+trois autres, surlignés[^>]+Sous ces trois derniers points[^>]+crochet tourné vers eux/i);
  assert.match(html, /bar-dot unmatched[\s\S]*class="difference-known"[\s\S]*class="difference-marker">différence = 3/);
  assert.match(html, /\.difference-marker::before\s*\{[^}]*top:\s*0[^}]*border-bottom:\s*2px solid #bd7900/);
  assert.match(html, /bar-dot matched[\s\S]*bar-dot matched[\s\S]*bar-dot unmatched[\s\S]*bar-dot unmatched[\s\S]*bar-dot unmatched/);
  assert.match(html, /class="difference-known">[\s\S]*?--points:2/);
  assert.match(html, /Différence : les points non appariés[\s\S]*On aligne 5 points au-dessus de 2 points[^<]+3 points non appariés donnent la différence/);
  assert.match(html, /5 − 2 = 3/);
  assert.match(html, /\.bar-diagram\s*\{[^}]*gap:\s*0/);
  assert.match(html, /\.bar-row\s*\{[^}]*border-radius:\s*0/);
  assert.doesNotMatch(html, /dots-equation|difference-lines|dot-set|missing-part/);
  assert.match(html, /array-dimension array-dimension-top">4[\s\S]*array-dimension array-dimension-side">3[\s\S]*--dot-columns:4/);
  assert.match(html, /array-dimension array-dimension-top">3[\s\S]*array-dimension array-dimension-side">4[\s\S]*--dot-columns:3/);
  assert.match(html, /<span>3 rangées de 4<\/span>[\s\S]*?<span>4 rangées de 3<\/span>/);
  assert.match(html, /\.dot-array\s*\{[\s\S]*?border-radius:\s*0/);
  assert.match(html, /3 × 4 = 12 ; 4 × 3 = 12 aussi/);
  assert.match(html, /combien de paquets de 2 dans 8 \? <strong>4<\/strong>/);
  assert.match(html, /partager 8 en 2 paquets : <strong>4 dans chacun<\/strong>/);
  const quotientMemo = html.match(/<article class="operation-visual-card">\s*<h3>Quotient[\s\S]*?<\/article>/)?.[0] || "";
  assert.equal([...quotientMemo.matchAll(/--package-size:2/g)].length, 4);
  assert.equal([...quotientMemo.matchAll(/--package-size:4/g)].length, 2);
  assert.match(quotientMemo, /quotient-bar groups-of-two[\s\S]*quotient-bar groups-of-four/);
  assert.match(html, /\.quotient-bar\s*\{[\s\S]*?border-radius:\s*0/);
  assert.doesNotMatch(html, /quotient-pair|quotient-groups/);
  assert.match(html, /8 ÷ 2 = 4/);
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
  assert.match(html, /comparison-upper[\s\S]*?comparison-lower" style="--difference-center:70%">[\s\S]*?difference-marker" style="grid-column:3 \/ -1"><\/span>[\s\S]*?difference-marker-label">différence = 3<\/span>/);
  assert.match(html, /5 − 2 = 3/);
  assert.doesNotMatch(html, /bar-model-label|bar-missing|>\s*(?:Tout|Parties?)\s*</);
  assert.match(html, /Un réseau de 3 rangées et 4 colonnes contient 12 points/);
  assert.match(html, /dimension-columns"><span>4<\/span>[\s\S]*?dimension-rows"><span>3<\/span>[\s\S]*?--dot-columns:4/);
  assert.match(html, /Un réseau de 4 rangées et 3 colonnes contient 12 points/);
  assert.match(html, /dimension-columns"><span>3<\/span>[\s\S]*?dimension-rows"><span>4<\/span>[\s\S]*?--dot-columns:3/);
  assert.match(html, /<span>3 rangées de 4<\/span>[\s\S]*?<span>4 rangées de 3<\/span>/);
  assert.match(html, /3 × 4 = 12 ; 4 × 3 = 12 aussi/);
  assert.match(html, /Combien de paquets de 2 dans 8 \? 4/);
  assert.match(html, /Partager 8 en 2 paquets : 4 dans chacun/);
  assert.match(html, /data-group-count="4" data-group-size="2" data-total-units="8"/);
  assert.match(html, /data-group-count="2" data-group-size="4" data-total-units="8"/);
  assert.match(html, /\.quotient-bar\s*\{[\s\S]*?border-radius:\s*0/);
  assert.doesNotMatch(html, /quotient-pair|quotient-groups|demo-group/);
  assert.match(html, /8 ÷ 2 : combien de paquets de 2 dans 8 \? 4/);
  assert.match(html, /8 ÷ 2 : partager 8 en 2 paquets : 4 dans chacun/);
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
  assert.match(solo, /initialFocus: mandatory \? "#start-game" : "#lesson-title"/);
  assert.match(solo, /onEscape: \(\) => \{[\s\S]*if \(values\.length\) dialogs\.close\(lesson\)/);
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
