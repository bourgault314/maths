/* Splat classique (monde 2), mode élève ?eleve=1 : le « ? » ne reste que là
   où il y a une tache (décision de Gwenaël, 19/09/2026). La case du total et
   celle des jetons visibles sont VIDES, comme sur les fiches imprimées ; la
   case d'une tache garde son « ? » gris : c'est l'inconnue, ce que cache la
   tache. Il s'efface dès que l'élève tape un chiffre, au clavier comme au pavé.

   Deuxième point du même lot : la mini-tache dessinée dans une case tache
   mordait sur le nombre quand la case était étroite (mesuré au navigateur, en
   Arial comme sur iPhone : 6 à 22 cases au contact entre 320 et 820 px de
   large, sur les 76 cases tache des étapes 7, 8 et 9). Elle se serre
   maintenant dans le coin haut-gauche, en 14 × 10 comme au monde 1 ; les
   chiffres restent centrés exactement comme avant. L'écran d'ordinateur
   (1000 × 700 et plus, cases de 66 px) n'avait pas ce défaut : il garde sa
   mini-tache de 22 × 16.

   La validation et le pavé ne changent pas : ils ne lisaient jamais le
   placeholder. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../outils/splat.html", import.meta.url), "utf8");

// La fabrique de case, exécutée telle quelle avec une mini-tache factice.
function fabrique() {
  const debut = page.indexOf("\nfunction eleveCaseHtml(");
  const fin = page.indexOf("\n}\n", debut) + 3;
  assert.ok(debut > 0 && fin > debut, "eleveCaseHtml introuvable");
  const code = page.slice(debut + 1, fin);
  return new Function("ELEVE_TACHE_MINI", `${code}\nreturn eleveCaseHtml;`)("<svg class=\"eleveMiniTache\"></svg>");
}

// Les règles d'une feuille (sélecteur → déclarations), commentaires ôtés.
function regles(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), decl: m[2].trim() }));
}
const feuille = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));

test("le total et les jetons visibles : case vide, sans « ? »", () => {
  const eleveCaseHtml = fabrique();
  for (const html of [
    eleveCaseHtml("haut blanche", 13, 1, false), // le total
    eleveCaseHtml("blanche", 7, 7, false),       // les jetons visibles
  ]) {
    assert.doesNotMatch(html, /placeholder/);
    assert.match(html, /<input class="eleveChamp" type="text" inputmode="numeric" maxlength="3" autocomplete="off"><\/div>$/, "la case reste une case à remplir, au clavier comme au pavé");
    assert.doesNotMatch(html, /eleveMiniTache/);
  }
});

test("la case d'une tache garde son « ? » (et sa mini-tache)", () => {
  const html = fabrique()("grise", 6, 6, true);
  assert.match(html, /<input class="eleveChamp" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="\?"><\/div>$/);
  assert.match(html, /eleveMiniTache/);
  // le « ? » garde son gris d'avant, celui que les élèves connaissent
  assert.deepEqual(regles(feuille).filter((r) => /::placeholder/.test(r.sel)).map((r) => `${r.sel}{${r.decl}}`),
    ["input.eleveChamp::placeholder{color:#94a3b8;font-weight:700}"]);
});

test("dans la carte, seules les cases des taches reçoivent le « ? »", () => {
  /* 18/10/2026 (recopie au monde 2) : la ligne des cases est fabriquée par eleveCasesClassiqueHtml,
     appelée par renderEleveSplat ; les cases de taches recopiées montrent le même « ? » gris
     (.eleveCopieVal.vide), sans champ. */
  const morceau = (nom) => { const d = page.indexOf(`\nfunction ${nom}(`); return page.slice(d, page.indexOf("\n}\n", d)); };
  assert.match(morceau("renderEleveSplat"), /bas = eleveCasesClassiqueHtml\(card, infos\);/);
  const rendu = morceau("eleveCasesClassiqueHtml") + morceau("renderEleveSplat");
  assert.deepEqual(regles(feuille).filter((r) => r.sel === ".eleveCopieVal.vide").map((r) => r.decl), ["color:#94a3b8;font-weight:700"],
    "le « ? » d'une case recopiée a le gris du « ? » des cases de taches");
  const appels = [...rendu.matchAll(/eleveCaseHtml\(("[^"]+"), [^,]+, [^,]+, (true|false)\)/g)].map((m) => `${m[1]} ${m[2]}`);
  assert.deepEqual(appels, ['"blanche" false', '"grise" true', '"haut blanche" false'], "jetons visibles, taches, total");
  // deux « ? » dans la page élève, tous deux sur la case de la tache : celle d'eleveCaseHtml, et la case décimale
  // de A — Jetons et parts (ufCaseHtml, lot F2) ; les autres placeholders sont ceux de l'usage libre
  assert.equal(page.match(/placeholder="\?"/g).length, 2);
  const uf = page.slice(page.indexOf("\nfunction ufCaseHtml("), page.indexOf("\n}\n", page.indexOf("\nfunction ufCaseHtml(")));
  assert.match(uf, /ph \? ' placeholder="\?"' : ""/);
  assert.match(uf, /boite\("ufDec", 6, "decimal", "valeur décimale", true, avecTache\)/);
  assert.deepEqual([...page.matchAll(/placeholder="([^"]*)"/g)].map((m) => m[1]).filter((v) => v !== "au hasard" && v !== "?"),
    ["Titre imprimé (ex. Atelier de recherche)"]);
});

test("la mini-tache se serre dans le coin haut-gauche, au-dessus de la ligne des chiffres", () => {
  const base = regles(feuille).filter((r) => r.sel === ".eleveMiniTache");
  assert.deepEqual(base.map((r) => r.decl), ["position:absolute;left:2px;top:2px;width:14px;height:10px;opacity:.8;pointer-events:none"]);
  // l'écran d'ordinateur garde la sienne : ses cases de 66 px n'avaient pas le défaut
  const media = "@media (min-width:1000px) and (min-height:700px){";
  const i = feuille.indexOf(media);
  assert.ok(i > 0, "bloc « écran d'ordinateur » introuvable");
  const bloc = feuille.slice(i + media.length, feuille.indexOf("\n  }", i));
  assert.deepEqual(regles(bloc).filter((r) => /eleveMiniTache/.test(r.sel)).map((r) => `${r.sel}{${r.decl}}`),
    ["body.eleve-mode .eleveMiniTache{left:6px;top:5px;width:22px;height:16px}"]);
  assert.equal(regles(feuille).filter((r) => /eleveMiniTache/.test(r.sel)).length, 2, "aucune autre règle ne la déplace");
});

test("les chiffres ne bougent pas : case centrée, champ plein cadre, aucun retrait", () => {
  const r = regles(feuille);
  const decl = (sel) => (r.find((x) => x.sel === sel) || {}).decl || "";
  assert.match(decl(".eleveCase"), /display:flex;align-items:center;justify-content:center;min-height:52px;font-size:22px/);
  assert.equal(decl("input.eleveChamp"), "width:100%;height:100%;padding:0;border:none;border-radius:0;outline:none;text-align:center;font:inherit;color:#111;background:transparent;min-width:0");
  assert.deepEqual(r.filter((x) => /eleveCase|eleveChamp/.test(x.sel) && /padding-(top|left)|text-indent/.test(x.decl)).map((x) => x.sel), [],
    "pas de bande qui décalerait les chiffres");
});
