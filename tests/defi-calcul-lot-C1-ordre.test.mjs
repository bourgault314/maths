// Défi calcul, lot C1 « l'ordre des calculs » (21/11/2026, choix de
// Gwenaël du 20/11 après l'audit de cohérence) : une seule règle pour
// l'ordre des calculs dans toute l'appli.
//  - les 9 premiers calculs vont du plus facile au plus dur, écriture par
//    écriture (gardé par defi-calcul-core.test.mjs, « la règle unique ») ;
//  - ensuite, le plus dur de chaque sorte, mélangé ;
//  - après une erreur, un calcul un cran plus facile, de la même écriture ;
//  - le test « Tu connais déjà ? » du plus simple au plus dur ;
//  - J'écris jamais plus facile que l'exemple de « On te montre » ;
//  - deux classements faux corrigés (« + 10 », « 5 − 4,7 »).
// Ce qui se voit au navigateur : tests/defi-calcul-lot-C1-ecrans.cjs.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const espaces = t => String(t).replace(/[  ]/g, " ");
const vivier = (cle, n = 40) => {
  const vus = new Map();
  for (let g = 1; g <= n; g += 1) {
    const s = CORE.genererSerie(cle, {graine: g * 53 + 7, total: 25});
    [...s, ...s.reserve].forEach(c => vus.set(c.cle, c));
  }
  return [...vus.values()];
};
const mediane = l => { const s = [...l].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };

test("« Sommes jusqu'à 20 » : « + 10 » est le plus facile (avant : classé le plus dur)", () => {
  const l = vivier("A1-2");
  const dix = l.filter(c => c.donnees.n === 10 || c.donnees.d === 10);
  const autres = l.filter(c => c.donnees.n !== 10 && c.donnees.d !== 10);
  assert.ok(dix.length >= 5 && autres.length >= 20);
  assert.ok(Math.max(...dix.map(CORE.difficulte)) < Math.min(...autres.map(CORE.difficulte)), "tout « + 10 » avant tout autre calcul");
  // La série commence par « + 10 ».
  for (let g = 1; g <= 20; g += 1) {
    const s = CORE.genererSerie("A1-2", {graine: g});
    assert.ok(s[0].donnees.n === 10 || s[0].donnees.d === 10, `graine ${g} : ${espaces(s[0].texte)}`);
  }
});

test("soustraire des décimaux : « 5 − 4,7 » (d'un entier) n'est plus parmi les plus faciles", () => {
  [["D7-2", "unités et dixièmes"], ["D7-3", "unités et centièmes"]].forEach(([cle, voisine]) => {
    const sortes = CORE.sortesDe(cle);
    const n = nom => sortes.find(s => s.nom === nom).n;
    const l = vivier(cle);
    const d = nom => mediane(l.filter(c => CORE.sorteDe(c) === n(nom)).map(CORE.difficulte));
    assert.ok(d("d’un entier") > d(voisine), `${cle} : « d’un entier » après « ${voisine} »`);
    // Et dans l'écriture : jamais dans le premier quart.
    l.filter(c => CORE.sorteDe(c) === n("d’un entier")).forEach(c => assert.ok(CORE.rangDansEcriture(c) >= .25, `${cle} : ${espaces(c.texte)} (${CORE.rangDansEcriture(c).toFixed(2)})`));
  });
});

test("« ajouter 9 », « retirer 9 » : les sortes dans l'ordre de leur difficulté, chaque calcul dans la même sorte qu'avant", () => {
  [["A5-1", (n, a) => n + a], ["A6-1", (n, a) => n - a]].forEach(([cle, op]) => {
    assert.deepEqual(CORE.sortesDe(cle).map(s => s.nom), ["à 2 chiffres", "à 3 chiffres", "en passant la centaine"]);
    vivier(cle).forEach(c => {
      const {n, a} = c.donnees;
      const passe = Math.floor(n / 100) !== Math.floor(op(n, a) / 100);
      const attendue = passe ? "en passant la centaine" : n < 100 ? "à 2 chiffres" : "à 3 chiffres";
      assert.equal(CORE.sortesDe(cle)[CORE.sorteDe(c)].nom, attendue, espaces(c.texte));
    });
  });
});

test("le test « Tu connais déjà ? » va du plus simple au plus dur (« ajouter 9 » ne commence plus par 199 + 9)", () => {
  // Toutes les marches de tous les modules : la difficulté ne redescend
  // jamais (avant : rangées par sorte, 15 compétences redescendaient).
  CORE.MODULES.filter(fiche => fiche.construit).forEach(fiche => {
    for (let g = 1; g <= 6; g += 1) CORE.genererTest(fiche.id, {graine: g * 17}).forEach(marche => {
      const ds = marche.calculs.map(CORE.difficulte);
      assert.deepEqual(ds, [...ds].sort((a, b) => a - b), `${fiche.id}-${marche.niveau} : ${marche.calculs.map(c => espaces(c.texte)).join(" → ")}`);
    });
  });
  for (let g = 1; g <= 20; g += 1) {
    const marche = CORE.genererTest("A5", {graine: g}).find(m => m.niveau === 1);
    const ds = marche.calculs.map(CORE.difficulte);
    assert.deepEqual(ds, [...ds].sort((a, b) => a - b), marche.calculs.map(c => espaces(c.texte)).join(" → "));
    assert.equal(CORE.sortesDe("A5-1")[marche.calculs[marche.calculs.length - 1].sorte].nom, "en passant la centaine");
  }
});

test("après une erreur : un cran plus facile, de la même écriture (et de la même sorte quand il y en a)", () => {
  let essais = 0;
  let memeSorte = 0;
  CORE.ORDRE.forEach(cle => {
    for (let g = 1; g <= 4; g += 1) {
      const s = CORE.genererSerie(cle, {graine: g * 11, total: 25});
      s.slice(0, 12).forEach(c => {
        const f = CORE.unCranPlusFacile(c, s.reserve);
        if (!f) {
          // Rien de plus facile dans la réserve, de la même écriture.
          assert.ok(!s.reserve.some(x => x.forme === c.forme && CORE.difficulte(x) < CORE.difficulte(c)), `${cle} : ${espaces(c.texte)}`);
          return;
        }
        essais += 1;
        assert.equal(f.forme, c.forme, `${cle} : ${espaces(c.texte)} → ${espaces(f.texte)}`);
        assert.ok(CORE.difficulte(f) < CORE.difficulte(c), `${cle} : ${espaces(c.texte)} → ${espaces(f.texte)} plus facile`);
        assert.ok(s.reserve.includes(f), "pris dans la réserve");
        if (CORE.sorteDe(f) === CORE.sorteDe(c)) memeSorte += 1;
      });
    }
  });
  assert.ok(essais > 3000 && memeSorte / essais > .85, `${essais} essais, ${memeSorte} de la même sorte`);
  // « double de 417 » raté : pas « double de 4 », un double un peu plus petit.
  const s = CORE.genererSerie("M1-3", {graine: 5, total: 25});
  const dur = s.filter(c => c.forme === "double").sort((a, b) => CORE.difficulte(b) - CORE.difficulte(a))[0];
  const f = CORE.unCranPlusFacile(dur, s.reserve);
  assert.ok(f && CORE.rangDansEcriture(dur) - CORE.rangDansEcriture(f) <= .4, `${espaces(dur.texte)} → ${f && espaces(f.texte)}`);
  assert.equal(CORE.unCranPlusFacile(null, s.reserve), null);
  assert.equal(CORE.unCranPlusFacile(dur, []), null);
});

test("J'écris n'est jamais plus facile que l'exemple de « On te montre » (sauf 5 leçons dont l'exemple est le plus dur : lot C3)", () => {
  // L'exemple est le plus dur de son écriture (C4-2), ou J'écris ne sait pas
  // l'écrire (M1-3 : pas de J'écris des doubles à 3 chiffres) : le plus dur
  // qui reste. Le lot C3 prend un exemple moyen.
  const REPLI = new Set(["F6-1", "M1-3", "M8-2", "C4-2", "D1-3"]);
  CORE.ORDRE.forEach(cle => {
    const montre = CORE.niveauDe(cle).niveau.apprends.calculs.montre;
    for (let g = 1; g <= 12; g += 1) {
      const e = CORE.ecrisTire(cle, {graine: g * 977});
      if (!e) continue;
      const ok = e.calcul.forme === montre.forme ? CORE.difficulte(e.calcul) >= CORE.difficulte(montre)
        : CORE.rangDansEcriture(e.calcul, cle) >= CORE.rangDansEcriture(montre, cle) - 1e-9;
      assert.ok(ok || REPLI.has(cle), `${cle} : exemple ${espaces(montre.texte)}, J'écris ${espaces(e.calcul.texte)}`);
    }
  });
  // « Doubles et moitiés en découpant » : « double de 470 », puis J'écris
  // jamais sur « double de 24 » (avant le lot C1, 24 à 49 : il prend les
  // plus grands qu'il sait écrire, à un cran près).
  const tires = Array.from({length: 20}, (_, g) => CORE.ecrisTire("M1-3", {graine: g + 1}).calcul);
  // (Lot C2 : M1-3 n'a plus que des doubles, avec 24 nombres à 3 chiffres ;
  // le cran d'un huitième descend jusqu'à 27.)
  assert.ok(tires.every(c => c.donnees.n >= 27), tires.map(c => espaces(c.texte)).join(", "));
});

test("« ajouter 8, 18… » : pas de perles quand le geste passerait 100 (82 + 18 = 82 + 20 − 2)", () => {
  const l = vivier("A5-3", 120);
  const c = l.find(x => espaces(x.texte) === "82 + 18 = □");
  assert.ok(c, "82 + 18 est dans le vivier");
  assert.equal(CORE.manipulationDe(c), null);
  l.forEach(x => {
    const m = CORE.manipulationDe(x);
    if (!m || m.outil !== "perles") return;
    let total = m.depart;
    m.gestes.forEach(g => { total += g; assert.ok(total >= 0 && total <= 100, `${espaces(x.texte)} : ${total} perles`); });
  });
});

test("la page : la réserve suit la série, un cran plus facile après une erreur, la sorte manquante avancée sans échange, la suite sans le début", () => {
  const page = lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.equal((page.match(/reserve: \(calculs\.reserve \|\| \[\]\)\.slice\(\)/g) || []).length, 2, "J'apprends et Je m'entraîne gardent la réserve");
  const avancer = page.slice(page.indexOf("function avancerSerie()"), page.indexOf("function allongerSerie("));
  assert.ok(avancer.indexOf("placerUnCranPlusFacile(serie);") > 0 && avancer.indexOf("placerUnCranPlusFacile(serie);") < avancer.indexOf("amenerSorteManquante();"), "le cran plus facile, avant la sorte manquante");
  const cran = page.slice(page.indexOf("function placerUnCranPlusFacile("), page.indexOf("function toutesFormesVues("));
  assert.match(cran, /derniere\.juste/);
  assert.match(cran, /CORE\.unCranPlusFacile\(question\.calcul/);
  assert.match(cran, /serie\.questions\.splice\(serie\.index \+ 1, 0, \{calcul: facile/);
  const amener = page.slice(page.indexOf("function amenerSorteManquante()"), page.indexOf("function prevoirCalculDePlus("));
  assert.doesNotMatch(amener, /\[serie\.questions\[suivant\], serie\.questions\[loin\]\] =/, "plus d'échange");
  assert.match(amener, /serie\.questions\.splice\(suivant, 0, choisi\.question\)/);
  const allonger = page.slice(page.indexOf("function allongerSerie("), page.indexOf("function placerUnCranPlusFacile("));
  assert.match(allonger, /encore\.slice\(encore\.fenetre \|\| 0\)/);
  assert.match(page, /defi_calcul_core\.js\?v=20261125-3/);
  assert.ok(lire("../_serveur/public/prof/defi_calcul_core.js") === lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie pour la page prof, octet pour octet");
  assert.match(lire("../_serveur/public/VERSION"), /^lot defi-calcul-lot-(?:C1-ordre|C2-doubles-moities|C3-exemples|C4a|C4b|C4c|C4d)$|^lot arriver-E$|^lot m-corrige$|^lot aujourdhui-B3$|^lot anzan-bareme-lot-1$/m); // (lots E « Arriver » et M corrigé : le manifeste change de nom ; lot C2 : le cœur)
});

test("les données ne changent pas : progression en version 10 (11 au lot C2), mêmes compétences, mêmes sortes (en nombre)", () => {
  const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  assert.equal(P.VERSION, 11);
  assert.equal(CORE.ORDRE.length, 132);
  assert.ok(CORE.ORDRE.every(cle => CORE.sortesDe(cle).length >= 2 && CORE.sortesDe(cle).length <= 4));
});
