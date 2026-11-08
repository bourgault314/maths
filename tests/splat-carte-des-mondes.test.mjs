import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot 2 du chantier « aides et carte » (08/11/2026, proposition B choisie par Gwenaël sur les
   planches 1 et 2) : la carte des mondes devient une CARTE — six taches reliées par un chemin en
   pointillés, au-dessus du monde choisi. Une tache est un bouton qui met son monde à l'écran ; un seul
   monde est affiché, avec sa grande bande de couleur (gardée, choix du 08/11), sans la petite flèche.
   On EXÉCUTE le dessin de la carte (carteHtml) et sa mise à jour (majCarte) ; les clics, la boucle du
   téléphone et le chemin ont été joués au navigateur (verif-clics-lot-2.py). */

const univers = readFileSync(new URL("../outils/splat_univers.html", import.meta.url), "utf8");
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("const VERROU_SVG=", "const PREPA_BANDEAU=") +
  bloc("const NOMS_COURTS=", "/* le chemin passe par le centre") +
  bloc("function majCarte(){", "/* ============ un monde à la fois") +
  ";globalThis.X={MONDES,NOMS_COURTS,carteHtml,majCarte};", ctx);
const { MONDES, NOMS_COURTS, carteHtml, majCarte } = ctx.X;
const pur = (x) => JSON.parse(JSON.stringify(x)); // les tableaux nés dans la page (vm) → tableaux d'ici

test("la carte : six taches dans l'ordre de l'univers, numérotées 1 à 6, chacune un bouton vers son monde", () => {
  const h = carteHtml();
  assert.ok(h.startsWith('<svg class="chemin" aria-hidden="true"><path/></svg>'), "le chemin d'abord, sous les taches");
  const t = [...h.matchAll(/<button type="button" class="tm (\w+)" data-mi="(\d)" aria-pressed="false" aria-controls="monde-(\d)">/g)];
  assert.deepEqual(t.map((x) => [x[1], +x[2], +x[3]]), pur(MONDES.map((m, mi) => [m.cls, mi, mi + 1])));
  assert.deepEqual([...h.matchAll(/<span class="n" aria-hidden="true">(\d)<\/span>/g)].map((x) => +x[1]), [1, 2, 3, 4, 5, 6]);
  // le nom entier sur ordinateur, le nom court au téléphone (planche 2)
  assert.deepEqual([...h.matchAll(/<span class="long">([^<]+)<\/span><span class="court" aria-hidden="true">([^<]+)<\/span>/g)].map((x) => [x[1], x[2]]),
    pur(MONDES.map((m, mi) => [m.nom, NOMS_COURTS[mi]])));
  assert.deepEqual(pur(NOMS_COURTS), ["Petit SPLAT!", "Classique", "Enquête", "Système", "Équations", "Relatifs"]);
  // aucun lien : la carte ne mène nulle part, elle choisit le monde affiché dessous
  assert.doesNotMatch(h, /<a |href="(?!#)/);
  // vue élève seulement, posée juste avant les mondes
  assert.match(univers, /if\(!PROF\)\{\s*const nav=document\.createElement\("nav"\);\s*nav\.className="carteMondes"; nav\.id="carteMondes";[^\n]*\n\s*nav\.innerHTML=carteHtml\(\);\s*main\.before\(nav\);/);
});

test("la carte suit les étoiles : sous chaque tache celles de la bande ; fini → pleine couleur et étoile d'or ; fermé → cadenas ; en préparation → 🚧", () => {
  const els = {};
  const elt = (id) => (els[id] ||= { id, textContent: "", classes: new Set(), attrs: {},
    classList: { toggle(c, v) { v ? els[id].classes.add(c) : els[id].classes.delete(c); } },
    setAttribute(k, v) { els[id].attrs[k] = v; } });
  const faits = [6, 1, 0, 0, 3, 0];
  ctx.document = {
    getElementById(id) {
      if (id === "carteMondes") return { querySelector: (q) => elt("tm" + q.match(/data-mi="(\d)"/)[1]) };
      if (/^monde-\d$/.test(id)) { const mi = +id.slice(6) - 1; return { querySelectorAll: () => ({ length: faits[mi] }) }; }
      return elt(id);
    }
  };
  MONDES.forEach((m, mi) => { elt("stars" + mi).textContent = "⭐ " + faits[mi] + " / " + m.etapes.length; m.cache = false; m.verrouille = false; });
  MONDES[3].verrouille = true;          // le Système fermé à la classe, rien de gagné
  MONDES[2].cache = true;               // l'Enquête en préparation
  vm.runInContext("majCarte()", ctx);
  const tm = (mi) => els["tm" + mi];
  assert.ok(tm(0).classes.has("fini"), "monde 1 : 6/6, fini");
  assert.ok(!tm(1).classes.has("fini"), "monde 2 : 1/3, pas fini");
  assert.ok(tm(4).classes.has("fini"), "monde 5 : 3/3");
  assert.equal(els.carteEt0.textContent, "⭐ 6 / 6");
  assert.equal(els.carteEt1.textContent, "⭐ 1 / 3");
  assert.ok(tm(3).classes.has("ferme") && !tm(3).classes.has("fini"));
  assert.equal(els.carteEt3.textContent, "", "fermé et rien de gagné : pas « ⭐ 0 / 4 » (comme la bande)");
  assert.ok(tm(2).classes.has("prepa"));
  assert.equal(els.carteEt2.textContent, "🚧");
  assert.equal(tm(3).attrs["aria-label"], "Monde 4, SPLAT! Système, pas encore ouvert");
  assert.equal(tm(1).attrs["aria-label"], "Monde 2, SPLAT! Classique, 1 étoiles sur 3");
  MONDES[3].verrouille = false; MONDES[2].cache = false;
  // appelée par majAffichage, avant le total : au retour d'une partie, la carte se rallume aussi
  assert.match(bloc("function majAffichage(){", "return prochaine;"), /majCarte\(\);\s*document\.getElementById\("totalTxt"\)/);
});

test("mise en page : une ligne en zigzag sur ordinateur, la boucle 1 2 3 / 6 5 4 au téléphone ; le chemin suit les taches", () => {
  assert.match(univers, /\.carteMondes\{position:relative;max-width:980px;margin:22px auto 0;padding:0 10px;\s*display:grid;grid-template-columns:repeat\(6,1fr\);/);
  const tel = bloc("@media(max-width:599px){\n  .carteMondes", "\n}\n");
  assert.match(tel, /\.carteMondes\{grid-template-columns:repeat\(3,1fr\);/);
  // le <svg> du chemin est le 1er enfant : la tache du monde N est le (N+1)e
  const place = [...tel.matchAll(/\.tm:nth-child\((\d)\)\{grid-row:(\d);grid-column:(\d)/g)].map((x) => [+x[1] - 1, +x[2], +x[3]]);
  assert.deepEqual(place, [[1, 1, 1], [2, 1, 2], [3, 1, 3], [4, 2, 3], [5, 2, 2], [6, 2, 1]]);
  assert.match(univers, /\.tm\.choisi \.anneau\{display:block\}/, "le monde choisi est cerclé de pointillés");
  assert.match(univers, /\.tm\.fini \.tache use\.fond,\.tm\.choisi \.tache use\.fond\{fill:var\(--c-monde\)\}/);
  // le chemin : refait au chargement, quand les polices arrivent, et à chaque changement de largeur
  assert.match(univers, /window\.addEventListener\("resize",placerChemin\);/);
  assert.match(univers, /if\(!PROF\) ouvrirParties\(\);\nplacerChemin\(\);/);
  // pendant l'échange du billet, la carte attend avec les mondes (ses étoiles ne sont pas encore connues)
  assert.match(univers, /html\.suivi-attente main#univers,html\.suivi-attente #carteMondes\{visibility:hidden\}/);
});
