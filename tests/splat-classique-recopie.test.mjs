/* SPLAT! monde 2 (Splat classique) — la recopie des cases de taches (18/10/2026, décidée le 14/10 par
   Gwenaël : « c'était long de réécrire », jusqu'à six fois le même nombre).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du fichier) :
   - une case par tache, toujours, de la largeur de ce qu'elle cache ;
   - l'élève tape dans la PREMIÈRE case de tache ; les autres sont des copies, sans champ (ni le pavé
     ni la validation ne les voient), qui pointent cette première case — comme l'Enquête et le
     Système depuis le 03/10 ;
   - les jetons visibles gardent leur case à remplir, devant ;
   - une seule tache : pas de copie ;
   - le monde 1 (Petit SPLAT!, une autre page) ne change pas. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
const mini = html.split("\n").find((l) => l.startsWith("const ELEVE_TACHE_MINI = "));
const casesClassique = new Function(`${mini}\n${fn("eleveCaseHtml")}\n${fn("eleveCaseCopieHtml")}\n${fn("eleveCasesClassiqueHtml")}\nreturn eleveCasesClassiqueHtml;`)();

const casesDe = (h) => [...h.matchAll(/<div class="eleveCase ([^"]+)" style="flex:([^ ]+) 1 0"( data-attendu="(\d+)")?( data-copie="(\d+)")?>([\s\S]*?)<\/div>/g)]
  .map((m) => ({ classes: m[1], flex: Number(m[2]), attendu: m[4], copie: m[6], champ: /<input/.test(m[7]), tache: /eleveMiniTache/.test(m[7]) }));

test("monde 2 : l'élève tape dans la première case de tache, les autres la recopient (avec des jetons visibles)", () => {
  const c = casesDe(casesClassique({ total: 43 }, { tasks: 5, H: 3, visibleSum: 28 }));
  assert.equal(c.length, 6, "les visibles, puis une case par tache");
  assert.deepEqual([c[0].classes, c[0].champ, c[0].attendu], ["blanche", true, "28"], "les jetons visibles se remplissent toujours");
  assert.deepEqual([c[1].classes, c[1].champ, c[1].attendu, c[1].tache], ["grise", true, "3", true], "la première tache : le champ");
  for(const k of [2, 3, 4, 5]){
    assert.equal(c[k].classes, "grise copie", `tache ${k} : une copie`);
    assert.equal(c[k].champ, false, "une copie n'a pas de champ : ni le pavé ni la validation ne la voient");
    assert.equal(c[k].copie, "1", "elle recopie la case de rang 1 (après les visibles)");
    assert.equal(c[k].attendu, "3");
    assert.ok(c[k].tache, "la mini-tache, comme la première case");
    assert.equal(c[k].flex, c[1].flex, "même largeur que la première case de tache");
  }
});

test("monde 2 : sans jeton visible, les copies pointent la case 0 ; une seule tache, pas de copie", () => {
  const c = casesDe(casesClassique({ total: 20 }, { tasks: 4, H: 5, visibleSum: 0 }));
  assert.equal(c.length, 4);
  assert.equal(c[0].champ, true);
  assert.ok(c.slice(1).every((x) => x.copie === "0" && !x.champ));
  const seule = casesDe(casesClassique({ total: 13 }, { tasks: 1, H: 6, visibleSum: 7 }));
  assert.equal(seule.length, 2);
  assert.ok(seule.every((x) => x.champ && x.copie === undefined));
});

test("monde 2 : les largeurs du schéma ne changent pas (petites taches gardées lisibles)", () => {
  const c = casesDe(casesClassique({ total: 100 }, { tasks: 3, H: 2, visibleSum: 94 }));
  assert.equal(c[0].flex, 94);
  assert.ok(c.slice(1).every((x) => x.flex === 5), "une tache garde 5 % du total au moins");
});

test("l'Enquête et le Système gardent leurs cases égales ; le rendu passe par la fonction du monde 2", () => {
  assert.match(fn("eleveCaseCopieHtml"), /function eleveCaseCopieHtml\(attendu, tacheHtml, rangSource, largeur = 1\)\{/);
  assert.match(fn("eleveCasesEnqueteHtml"), /eleveCaseCopieHtml\(enquete\.valeurs\[i\], tache, source\.get\(info\.key\)\)/, "sans largeur : flex 1");
  assert.match(fn("renderEleveSplat"), /bas = eleveCasesClassiqueHtml\(card, infos\);/);
  assert.match(fn("renderEleveSplat"), /eleveCopiesSynchroniser\(\); \/\* taches répétées/, "chaque saisie recopie");
});

test("le monde 1 (Petit SPLAT!) n'a pas de recopie", () => {
  assert.doesNotMatch(petit, /data-copie|eleveCopiesSynchroniser/);
});
