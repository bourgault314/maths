/* « Regarde sous les taches… » (09/11/2026, Gwenaël) : après une bonne réponse, Petit SPLAT!
   disait « Regarde sous la tache… » même avec deux taches et plus (étapes 4, 5 et 6), et le
   film « Deux taches » le recopiait. Le message suit maintenant le nombre de taches de la carte.
   (Le grand SPLAT! — monde 2 et Enquête — est vérifié dans splat-enquete-mode-eleve.test.mjs.) */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");
const intro = await readFile(new URL("../outils/splat_intro.html", import.meta.url), "utf8");

function fn(html, name) {
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}

test("Petit SPLAT! : « la tache » avec une tache, « les taches » dès deux", () => {
  const message = new Function(`${fn(petit, "eleveMessageJuste")} return eleveMessageJuste;`)();
  assert.equal(message(false, 1), "Bravo, du premier coup ! Regarde sous la tache…");
  assert.equal(message(true, 1), "Juste ! Regarde sous la tache…");
  for (const nb of [2, 3, 4, 5, 6]) {
    assert.equal(message(false, nb), "Bravo, du premier coup ! Regarde sous les taches…");
    assert.equal(message(true, nb), "Juste ! Regarde sous les taches…");
  }
});

test("Petit SPLAT! : le nombre de taches vient de la carte jouée, plus aucune phrase écrite en dur", () => {
  assert.match(petit, /msg\.textContent = eleveMessageJuste\(eleveCarteFautee, eleveItemCourant && Array\.isArray\(eleveItemCourant\.splats\) \? eleveItemCourant\.splats\.length : 1\);/);
  // la phrase affichée s'écrit « …tache\u2026 » dans le code : une seule fois, dans eleveMessageJuste
  assert.equal(petit.split("Regarde sous la tache\\u2026").length - 1, 1, "une seule phrase au singulier, dans eleveMessageJuste");
});

test("le film « Deux taches » écrit « Regarde sous les taches… », à l'ordinateur et au téléphone", () => {
  const debut = intro.indexOf("FILMS['deux-taches']=(function(){");
  assert.notEqual(debut, -1);
  const ajout = intro.slice(intro.indexOf("const AJOUT={", debut), intro.indexOf("}}};", intro.indexOf("const AJOUT={", debut)) + 4);
  assert.match(ajout, /paysage:[\s\S]*msg:\{x:720,ys:\[763\],fs:16,lignes:\['Bravo, du premier coup ! Regarde sous les taches…'\]\}/);
  assert.match(ajout, /portrait:[\s\S]*msg:\{x:195,ys:\[557,577\],fs:16,lignes:\['Bravo, du premier coup !','Regarde sous les taches…'\]\}/);
  assert.doesNotMatch(ajout, /sous la tache/);
});
