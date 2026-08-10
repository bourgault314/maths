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

test("Coffres à deux montre la somme et le produit réellement joués", () => {
  const html = pages["outils/club_maths/coffres_magiques.html"];
  assert.match(html, /Trois points et deux points sont réunis[^<]+cinq points en tout/);
  assert.match(html, /3 \+ 2 = 5/);
  assert.match(html, /Trois rangées de quatre points font douze points/);
  assert.match(html, /3 × 4 = 12/);
  assert.match(html, /runes voisines/);
});

test("Coffres solo illustre précisément les quatre opérations", () => {
  const html = pages["outils/calcul_mental/coffres_magiques_solo.html"];
  assert.match(html, /3 \+ 2 = 5/);
  assert.match(html, /Cinq points sont alignés avec deux points[^<]+trois points restent sans paire/);
  assert.match(html, /5 − 2 = 3/);
  assert.match(html, /Trois rangées de quatre points font douze points/);
  assert.match(html, /Quatre rangées de trois points font douze points/);
  assert.match(html, /3 × 4 = 12 ; 4 × 3 = 12 aussi/);
  assert.match(html, /Huit points forment quatre groupes de deux points/);
  assert.match(html, /Huit points sont partagés en deux groupes de quatre points/);
  assert.match(html, /8 ÷ 2 : combien de groupes de 2 dans 8 \? 4/);
  assert.match(html, /8 ÷ 2 : partager 8 en 2 groupes : 4 dans chaque groupe/);
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
