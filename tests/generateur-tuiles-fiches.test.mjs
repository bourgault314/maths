import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Générateur des fiches avec les tuiles — outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html
// Lot 1 (21/11/2026) : le moteur (dessin des tuiles, tirage, vérification). Lot 2 (21/11/2026) : le menu suit les
// MARCHES du cours de 3e (0 à 15) ; chaque marche fait tourner toutes ses variantes (ses cas), négatifs compris.
// Lot 3 (21/11/2026) : le support — les tuiles, le tableau du cours, ou sans aide (nombres variés hors tuiles) ;
// les marches 11, 12 et 14 s'ouvrent hors tuiles ; ★ « pour aller plus loin » (𝑥² + 5𝑥 + 6 en rangeant les tuiles).
// Le moteur vit dans <script id="moteur-tuiles"> : on le fait tourner ici sans navigateur.
// Chaque réponse est recalculée INDÉPENDAMMENT du moteur : on remplace 𝑥 par plusieurs valeurs dans le texte affiché.
const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const page = lire("outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html");
const source = page.match(/<script id="moteur-tuiles">([\s\S]*?)<\/script>/)[1];
const M = vm.runInNewContext(`${source}\n;MoteurTuiles`, {});
const AVEC_TUILES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 15, 16];
const SANS_TUILES = [11, 12, 14];
const SEUL_TUILES = [0, 16];
const HORS_TUILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const GRAINES = [1, 77, 2026];

// ---- calcul indépendant : la valeur d'un texte affiché (« (𝑥 − 3) × 2 », « −2𝑥(𝑥 + 1) », « (𝑥 + 2)² », « 2𝑥 × (−4) »…) pour 𝑥 = v
function valeur(texte, v) {
  let s = texte.replace(/−/g, "-").replace(/×/g, "*").replace(/ /g, "").replace(/\[/g, "(").replace(/\]/g, ")");
  s = s.replace(/\(([^()]*)\)²/g, "(($1)*($1))").replace(/x²/g, "(x*x)");
  s = s.replace(/(\d|x|\))(?=\(|x)/g, "$1*");
  assert.doesNotMatch(s, /[^0-9x()+\-*]/, `caractère inattendu dans « ${texte} »`);
  return Function("x", `return ${s};`)(v) + 0;   // + 0 : pas de « −0 »
}
const VALEURS = [-3, -1, 0, 2, 5, 7];
const memeValeur = (a, b, msg) => { for (const v of VALEURS) assert.equal(valeur(a, v), valeur(b, v), `${msg} (𝑥 = ${v}) : ${a} ≠ ${b}`); };
const valeurTas = (groupes, v) => groupes.reduce((t, [k, n]) => t + n * (k === "x2" ? v * v : k === "x" ? v : 1), 0) + 0;
const valeurBord = (l, v) => l.reduce((t, k) => t + (k.startsWith("-") ? -1 : 1) * (k.endsWith("x") ? v : 1), 0);
const valeurRect = (g, h, v) => { let t = 0; for (const a of g) for (const b of h) { const s = a.startsWith("-") !== b.startsWith("-") ? -1 : 1; t += s * (a.endsWith("x") ? v : 1) * (b.endsWith("x") ? v : 1); } return t; };
const reduite = (t) => { const k = t.replace(/^−/, "").split(/ [+−] /).map((m) => (/x²$/.test(m) ? 2 : /x$/.test(m) ? 1 : 0)); return k.every((d, i) => i === 0 || d < k[i - 1]); };
const longueur = (l) => l.reduce((t, k) => t + (k.endsWith("x") ? 3.4 : 1), 0);
const tous = (n, nb = 60, support = "tuiles") => GRAINES.flatMap((g) => Array.from(M.reserve(n, g, nb, support)));
const pgcd = (x, y) => (y ? pgcd(y, x % y) : x);

test("les seize marches du cours et ★ ; 11, 12, 14 sans les tuiles ; 0 et ★ seulement avec les tuiles", () => {
  assert.deepEqual(Array.from(M.MARCHES, (m) => m.n), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  assert.deepEqual(Array.from(M.MARCHES.filter((m) => m.partie === 1), (m) => m.n), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(Array.from(M.MARCHES.filter((m) => m.sansTuiles), (m) => m.n), SANS_TUILES);
  assert.deepEqual(Array.from(M.MARCHES.filter((m) => m.seulTuiles), (m) => m.n), SEUL_TUILES);
  assert.ok(M.marche(16).etoile && M.marche(16).partie === 2);
  assert.deepEqual(Array.from(M.SUPPORTS), ["tuiles", "tableau", "sans"]);
  for (const n of SANS_TUILES) assert.equal(M.reserve(n, 5, 20).length, 0, `marche ${n}`);
  for (const n of SEUL_TUILES) for (const sup of ["tableau", "sans"]) assert.equal(M.reserve(n, 5, 20, sup).length, 0, `marche ${n}, ${sup}`);
  for (const n of HORS_TUILES) assert.ok(M.reserve(n, 5, 20, "tableau").length === 20, `marche ${n} avec le tableau`);
  for (const n of AVEC_TUILES) { const m = M.marche(n); assert.ok(m.variantes.length >= 3 && m.titre && m.gen, `marche ${n}`); }
});

test("toutes les marches : chaque réponse est juste (recalculée sans le moteur)", () => {
  let n = 0;
  for (const marche of AVEC_TUILES) {
    const liste = tous(marche);
    // un exercice faux est écarté par le moteur : une réserve vide ou presque trahirait un tirage faux
    assert.ok(liste.length >= (marche === 16 ? 50 : 90), `marche ${marche} : ${liste.length} exercices seulement`);
    for (const it of liste) {
      n++;
      assert.equal(it.marche, marche);
      switch (it.forme) {
        case "ecrire":
          for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.reponse, v), it.reponse);
          assert.ok(reduite(it.reponse), it.reponse);
          break;
        case "reduire":
          memeValeur(it.enonce, it.reponse, "réduction");
          for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.enonce, v));
          for (const v of VALEURS) assert.equal(valeurTas(it.reste, v), valeur(it.reponse, v), "le corrigé en tuiles");
          assert.ok(reduite(it.reponse), it.reponse);
          if (/n$/.test(it.sous)) assert.ok(it.paires.length > 0, `pas de paire nulle : ${it.enonce}`);
          else assert.doesNotMatch(it.enonce, /−/, "cas sans négatifs");
          break;
        case "oppose":
          for (const v of VALEURS) assert.equal(valeur(it.enonce, v) + valeur(it.reponse, v), 0, it.enonce);
          for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.enonce, v));
          // la seconde écriture : −( … ) = l'opposé
          if (it.sous.startsWith("-")) { assert.equal(it.ecrit, `−(${it.enonce})`); memeValeur(it.ecrit, it.reponse, "opposé"); }
          else assert.equal(it.ecrit, null);
          break;
        case "produit":
          for (const l of it.lignes) memeValeur(it.enonce, l, "développement");
          for (const v of VALEURS) {
            assert.equal(valeurRect(it.gauche, it.haut, v) + 0, valeur(it.enonce, v), `rectangle de ${it.enonce}`);
            assert.equal(valeurBord(it.gauche, v) * valeurBord(it.haut, v) + 0, valeur(it.enonce, v), `bords de ${it.enonce}`);
          }
          assert.ok(it.lignes.length === 1 || (it.lignes.length === 2 && reduite(it.lignes[1])), it.lignes.join(" = "));
          // la place : un rectangle tient sur une demi-page (les tuiles ne rapetissent jamais)
          assert.ok(longueur(it.haut) <= 16 && longueur(it.gauche) <= (new Set(it.gauche).size > 1 ? 9.8 : 11.2) + 1e-9, `${it.enonce} trop grand`);
          break;
        case "factoriser":
          memeValeur(it.enonce, it.reponse, "factorisation");
          if (it.ranger) {        // ★ : 𝑥² + 5𝑥 + 6 = (𝑥 + 2)(𝑥 + 3), les tuiles en tas dans le sujet
            assert.match(it.reponse, /^\(\d?x \+ \d\)(\(x \+ \d\)|²)$/, it.reponse);
            for (const v of VALEURS) assert.equal(valeurTas(it.tas, v), valeur(it.enonce, v), "le tas");
            for (const v of VALEURS) assert.equal(valeurRect(it.gauche, it.haut, v) + 0, valeur(it.enonce, v));
            break;
          }
          assert.match(it.reponse, /\)$/, "la réponse est un produit");
          assert.doesNotMatch(it.reponse, /^−/, "le facteur trouvé est positif");
          { // factorisé jusqu'au bout : la parenthèse n'a plus de facteur commun (pas de 2(2𝑥 + 4))
            const [, c, d] = it.reponse.match(/\((\d*)x [+−] (\d+)\)$/);
            assert.equal(pgcd(Number(c || 1), Number(d)), 1, it.reponse);
          }
          assert.ok(reduite(it.enonce), it.enonce);
          for (const v of VALEURS) assert.equal(valeurRect(it.gauche, it.haut, v) + 0, valeur(it.enonce, v));
          break;
        case "ensemble": {
          assert.equal(it.lignes.length, 2, "une ligne pour développer, une ligne pour réduire");
          for (const l of it.lignes) memeValeur(it.enonce, l, "tout ensemble");
          assert.ok(reduite(it.lignes[1]), it.lignes[1]);
          assert.notEqual(it.lignes[0], it.lignes[1], "il reste quelque chose à réduire");
          for (const v of VALEURS) {
            const t = it.morceaux.reduce((s, m) => s + (m.tas ? valeurTas(m.tas, v) : valeurRect(m.gauche, m.haut, v)), 0);
            assert.equal(t + 0, valeur(it.enonce, v), `les tuiles de ${it.enonce}`);
          }
          // un signe − va toujours avec un facteur simple : jamais devant ( )( ) ni ( )² (c'est la marche 11, sans tuiles)
          assert.doesNotMatch(it.enonce, /− \([^()]*\)[(²]/, it.enonce);
          break;
        }
        default: assert.fail(`forme inconnue : ${it.forme}`);
      }
    }
  }
  assert.ok(n > 1800, `${n} exercices seulement`);
});

// ---- lot 3 : le tableau et « sans aide »
/** Une case du tableau = bord de gauche × bord du haut ; les cases ensemble = le produit. Calculé ici, sans le moteur. */
function verifierTableau(t, produit, msg) {
  assert.equal(t.c.length, t.g.length, msg);
  for (const v of VALEURS) {
    let somme = 0;
    t.g.forEach((g, i) => { assert.equal(t.c[i].length, t.h.length, msg); t.h.forEach((h, j) => {
      assert.equal(valeur(t.c[i][j], v), valeur(g, v) * valeur(h, v) + 0, `${msg} : case ${g} × ${h} = ${t.c[i][j]}`);
      somme += valeur(t.c[i][j], v);
    }); });
    if (produit) assert.equal(somme + 0, valeur(produit, v), `${msg} : la somme des cases`);
  }
  // les termes signés du cours : « +6 » quand deux négatifs se multiplient, jamais « +» ailleurs
  t.g.forEach((g, i) => t.h.forEach((h, j) => assert.equal(t.c[i][j].startsWith("+"), g.startsWith("−") && h.startsWith("−") && !/[()]/.test(g + h), `${msg} : ${g} × ${h} → ${t.c[i][j]}`)));
}

test("avec le tableau et sans aide : chaque réponse et chaque case sont justes (recalculées sans le moteur)", () => {
  let n = 0;
  for (const marche of HORS_TUILES) {
    const liste = tous(marche, 50, "tableau");
    assert.ok(liste.length >= 140, `marche ${marche} : ${liste.length} exercices seulement`);
    for (const it of liste) {
      n++;
      assert.equal(it.support, "tableau");
      const msg = `marche ${marche} « ${it.enonce || it.reponse} »`;
      switch (it.forme) {
        case "reduire": memeValeur(it.enonce, it.reponse, msg); assert.ok(reduite(it.reponse), msg); break;
        case "oppose": for (const v of VALEURS) assert.equal(valeur(it.enonce, v) + valeur(it.reponse, v), 0, msg); break;
        case "produit":
          for (const l of it.lignes) memeValeur(it.enonce, l, msg);
          if (it.tabs) { assert.equal(it.tabs.length, 1); verifierTableau(it.tabs[0], it.enonce, msg); }
          else assert.equal(marche, 3, `${msg} : un produit sans tableau`);
          break;
        case "factoriser":
          memeValeur(it.enonce, it.reponse, msg); assert.ok(reduite(it.enonce), msg);
          verifierTableau(it.tabs[0], it.enonce, msg);
          break;
        case "ensemble": {
          assert.equal(it.lignes.length, 2, msg);
          for (const l of it.lignes) memeValeur(it.enonce, l, msg);
          assert.ok(reduite(it.lignes[1]), msg);
          const prods = it.morceaux.filter((m) => !m.tas);
          assert.equal(it.tabs.length, prods.length, `${msg} : un tableau par produit`);
          it.tabs.forEach((t, i) => verifierTableau(t, null, msg));
          // le − devant un produit : la 1re ligne garde la parenthèse
          const moins = it.morceaux.filter((m) => m.moins).length;
          assert.equal((it.lignes[0].match(/− \(/g) || []).length, moins, `${msg} : ${it.lignes[0]}`);
          break;
        }
        case "commun": {        // marche 12
          for (const l of it.lignes) memeValeur(it.enonce, l, msg);
          assert.ok(it.lignes[0].startsWith(it.commun + "["), msg);
          const fin = it.lignes[1].match(/^(\([^()]*\))\((\d*)x [+−] (\d+)\)$/);
          assert.ok(fin && fin[1] === it.commun, `${msg} : ${it.lignes[1]}`);
          assert.equal(pgcd(Number(fin[2] || 1), Number(fin[3])), 1, `${msg} : la parenthèse se factorise encore`);
          verifierTableau(it.tabs[0], it.enonce, msg);
          break;
        }
        case "carres": {        // marche 14
          memeValeur(it.enonce, it.reponse, msg);
          for (const v of VALEURS) assert.equal(valeur(it.a, v) ** 2 - valeur(it.b, v) ** 2, valeur(it.enonce, v), msg);
          assert.equal(it.reponse, `(${it.a} − ${it.b})(${it.a} + ${it.b})`);
          break;
        }
        default: assert.fail(`forme inconnue : ${it.forme}`);
      }
    }
  }
  assert.ok(n > 2000, `${n} exercices seulement`);
});

test("le tableau et « sans aide » donnent les MÊMES exercices (on enlève l'aide, pas les nombres) ; les tuiles, d'autres", () => {
  for (const marche of HORS_TUILES) for (const g of GRAINES) {
    const t = M.reserve(marche, g, 25, "tableau").map((i) => i.cle);
    assert.deepEqual(M.reserve(marche, g, 25, "sans").map((i) => i.cle), t, `marche ${marche}`);
  }
  assert.notDeepEqual(M.reserve(9, 1, 10, "tableau").map((i) => i.cle), M.reserve(9, 1, 10).map((i) => i.cle));
});

test("hors tuiles, chaque marche fait aussi TOUS ses cas, et les nombres sont variés", () => {
  for (const marche of HORS_TUILES) {
    const m = M.marche(marche), V = Array.from(m.variantesG || m.variantes), k = V.length;
    for (const g of GRAINES) {
      const l = Array.from(M.reserve(marche, g, 2 * k, "tableau"), (i) => i.sous);
      assert.deepEqual(l.slice(0, k).sort(), V.slice().sort(), `marche ${marche}, graine ${g}`);
    }
  }
  const enonces = (n) => tous(n, 60, "tableau").map((i) => i.enonce);
  const trouve = (n, motif, quoi) => assert.ok(enonces(n).some((e) => motif.test(e)), `marche ${n} : ${quoi}`);
  // les exemples de Gwenaël : −4𝑥(2𝑥 − 9), (5𝑥 − 7)(3𝑥 + 2), (3𝑥 − 4)², 9𝑥² − 16
  trouve(6, /^−[2-9]x\([2-9]x [+−] [5-9]\)$/, "−4𝑥(2𝑥 − 9)");
  trouve(10, /^\([4-7]x − \d\)\([2-7]x \+ \d\)$/, "(5𝑥 − 7)(3𝑥 + 2)");
  trouve(13, /^\([3-5]x − \d\)²$/, "(3𝑥 − 4)²");
  trouve(14, /^(9|16|25|36)x² − \d+$/, "9𝑥² − 16"); trouve(14, /^\d+ − \d*x²$/, "25 − 𝑥²");
  trouve(4, /^[5-9]\(/, "un facteur jusqu'à 9"); trouve(9, /[5-9]x/, "des coefficients jusqu'à 7");
  // marche 11 : un − devant un produit ; 12 : le facteur commun est une parenthèse, parfois seul ; 15 : le − devant ( )( ) hors tuiles
  trouve(11, /^\d − \(.*\)\(.*\)$/, "5 − (𝑥 + 1)(𝑥 − 2)"); trouve(11, /^\d?x² − \(/, "𝑥² − ( )( )"); trouve(11, /\)\(.*\) − \(.*\)\(/, "( )( ) − ( )( )"); trouve(11, /\) − \d?x\(/, "( )( ) − 2𝑥( )");
  trouve(12, /^(\(.*?\))\(.*\) \+ \1\(.*\)$/, "A·B + A·C"); trouve(12, /^(\(.*?\))\(.*\) − \1$/, "A·B − A"); trouve(12, /^\(.*?\)(\(.*?\)) \+ \1\(/, "B·A + A·C");
  trouve(15, /\)² − \(.*\)\(/, "(𝑥 + 3)² − (𝑥 + 1)(𝑥 − 2)"); trouve(15, /^−\d\(.*\) \+ \(/, "−3(𝑥 − 2) + (𝑥 + 4)(𝑥 − 1)");
  // jamais une parenthèse qui se factorise encore, comme (3𝑥 − 3)² (marches 8 et 15 comprises)
  for (const n of [8, 9, 10, 11, 13, 15]) for (const e of enonces(n)) for (const z of e.match(/\((\d*)x [+−] (\d+)\)/g) || []) {
    const [, a, b] = z.match(/\((\d*)x [+−] (\d+)\)/); assert.equal(pgcd(Number(a || 1), Number(b)), 1, `marche ${n} : ${e}`);
  }
  for (const z of tous(8).map((i) => i.enonce)) for (const p of z.match(/\((\d*)x [+−] (\d+)\)/g) || []) {
    const [, a, b] = p.match(/\((\d*)x [+−] (\d+)\)/); assert.equal(pgcd(Number(a || 1), Number(b)), 1, `marche 8 en tuiles : ${z}`);
  }
  // marche 13 (remarque 8 retenue) : (𝑎 + 𝑏)(𝑎 − 𝑏) d'abord
  assert.equal(M.marche(13).variantes[0], "(x+b)(x-b)");
});

test("chaque marche fait TOUS ses cas : un tour de réserve montre chaque variante une fois", () => {
  for (const marche of AVEC_TUILES) {
    const m = M.marche(marche), k = m.variantes.length;
    for (const g of GRAINES) {
      const l = Array.from(M.reserve(marche, g, 3 * k), (i) => i.sous);
      for (let tour = 0; tour < 2; tour++) {
        assert.deepEqual(l.slice(tour * k, (tour + 1) * k).sort(), Array.from(m.variantes).sort(), `marche ${marche}, graine ${g}, tour ${tour + 1}`);
      }
    }
    // le rang range les exercices d'une fiche du cas le plus simple au plus difficile
    for (const it of M.reserve(marche, 3, 2 * k)) assert.equal(it.rang, m.variantes.indexOf(it.sous));
  }
  // deux tirages ne commencent pas tous par le même cas
  const premiers = new Set(Array.from({ length: 12 }, (_, g) => M.reserve(5, g + 1, 1)[0].sous));
  assert.ok(premiers.size >= 3, `marche 5 : ${[...premiers]}`);
});

test("les cas qui manquaient au lot 1 sont là : (2𝑥 + 1)(𝑥 + 3), (2𝑥 + 1)(2𝑥 − 3), 2𝑥(3𝑥 − 5)…", () => {
  const enonces = (n) => tous(n, 80).map((i) => i.enonce);
  const trouve = (n, motif, quoi) => assert.ok(enonces(n).some((e) => motif.test(e)), `marche ${n} : ${quoi}`);
  trouve(3, /^\d × \d?x$/, "3 × 2𝑥"); trouve(3, /^x × x$/, "𝑥 × 𝑥"); trouve(3, /^\dx × \dx$/, "3𝑥 × 2𝑥"); trouve(3, /\(−/, "un facteur négatif");
  trouve(4, /^\d\(x \+ \d\)$/, "3(𝑥 + 2)"); trouve(4, /^\d\(\dx − \d\)$/, "2(3𝑥 − 1)"); trouve(4, /^\(.*\) × \d$/, "(2𝑥 + 1) × 3"); trouve(4, /^\d\(\d − \d?x\)$/, "2(3 − 𝑥)");
  trouve(5, /^x\(x [+−] \d\)$/, "𝑥(𝑥 + 3)"); trouve(5, /^[23]x\([23]x − \d\)$/, "2𝑥(3𝑥 − 5)"); trouve(5, /^[23]x\([23]x \+ \d\)$/, "3𝑥(2𝑥 + 1)");
  trouve(5, /^\(.*\) × \d?x$/, "(𝑥 − 6) × 𝑥"); trouve(5, /^\d?x\(\d − \d?x\)$/, "𝑥(3 − 𝑥)");
  trouve(6, /^−\d\(x − \d\)$/, "−3(𝑥 − 2)"); trouve(6, /^−\(/, "−(𝑥 − 7)"); trouve(6, /^−x\(/, "−𝑥(𝑥 − 6)"); trouve(6, /^−2x\(\dx/, "−2𝑥(3𝑥 + 5)"); trouve(6, /× \(−\d\)$/, "(𝑥 + 2) × (−3)");
  trouve(9, /^\(x \+ \d\)\(x \+ \d\)$/, "(𝑥 + 2)(𝑥 + 3)"); trouve(9, /^\(2x \+ \d\)\(x \+ \d\)$/, "(2𝑥 + 1)(𝑥 + 3)"); trouve(9, /^\([23]x \+ \d\)\([23]x \+ \d\)$/, "(2𝑥 + 1)(3𝑥 + 2)");
  assert.ok(enonces(9).every((e) => !/−/.test(e)), "marche 9 : pas de signe −");
  assert.ok(enonces(10).every((e) => /−/.test(e)), "marche 10 : toujours un signe −");
  trouve(10, /^\(2x \+ \d\)\(2x − \d\)$/, "(2𝑥 + 1)(2𝑥 − 3)"); trouve(10, /^\([23]x − \d\)\([23]x − \d\)$/, "(2𝑥 − 1)(3𝑥 − 2)"); trouve(10, /\(\d − \d?x\)/, "(3 − 𝑥)(𝑥 + 2)");
  trouve(13, /^\(x \+ \d\)²$/, "(𝑥 + 3)²"); trouve(13, /^\(x − \d\)²$/, "(𝑥 − 3)²"); trouve(13, /^\([23]x [+−] \d\)²$/, "(2𝑥 + 3)²");
  trouve(13, /^\((\d?x) \+ (\d)\)\(\1 − \2\)$|^\((\d?x) − (\d)\)\(\3 \+ \4\)$/, "(𝑥 + 3)(𝑥 − 3)");
  // une identité n'est jamais tirée dans la double distributivité (elle a sa marche)
  for (const e of [...enonces(9), ...enonces(10)]) { const m = e.match(/^\((.*)\)\((.*)\)$/); assert.notEqual(m[1], m[2], e); assert.notEqual(m[1].replace("+", "−"), m[2].replace("+", "−"), e); }
  trouve(8, /^\d\(.*\) − \d\(/, "3(𝑥 + 2) − 2(𝑥 − 1)"); trouve(8, /^\d − \d\(/, "4 − 3(2 − 𝑥)"); trouve(8, /− \(/, "5(2𝑥 − 1) − (3𝑥 + 4)"); trouve(8, /x\(.*− x\(/, "2𝑥(𝑥 − 1) − 𝑥(𝑥 + 5)");
  trouve(15, /²/, "un carré"); trouve(15, /\)\(.*− \d\(/, "( )( ) − 2( )");
  trouve(7, /^\d?x² [+−] \d?x$/, "𝑥² + 5𝑥"); trouve(7, /^\d+x [+−] \d+$/, "4𝑥 + 12");
});

test("l'opposé a ses deux écritures, « ( … ) + …… = 0 » et « −( … ) = …… », qui alternent", () => {
  for (const g of GRAINES) {
    const l = Array.from(M.reserve(2, g, 16), (i) => i.sous.startsWith("-"));
    assert.deepEqual(l, Array.from({ length: 16 }, (_, i) => i % 2 === 1), `graine ${g}`);
  }
  assert.match(page, /it\.ecrit \? calc\(\[\[L \+ h\(it\.ecrit\)/);
});

test("le moteur vérifie lui-même chaque exercice avant de le garder", () => {
  const faux = { forme: "produit", enonce: "2(x − 3)", lignes: ["2x − 5"], gauche: ["1", "1"], haut: ["x", "-1", "-1", "-1"] };
  assert.match(M.verifierItem(faux), /ligne fausse/);
  const signe = { forme: "produit", enonce: "2(x − 3)", lignes: ["2x − 6"], gauche: ["1", "1"], haut: ["x", "1", "1", "1"] };
  assert.match(M.verifierItem(signe), /rectangle ≠ produit/);
  assert.equal(M.verifierItem({ ...faux, lignes: ["2x − 6"] }), null);
  const ens = { forme: "ensemble", enonce: "3(x + 2) − 2(x − 1)", lignes: ["3x + 6 − 2x + 2", "x + 8"],
    morceaux: [{ gauche: ["1", "1", "1"], haut: ["x", "1", "1"] }, { gauche: ["-1", "-1"], haut: ["x", "-1"] }] };
  assert.equal(M.verifierItem(ens), null);
  assert.match(M.verifierItem({ ...ens, lignes: ["3x + 6 − 2x − 2", "x + 8"] }), /ligne fausse/);
  assert.match(M.verifierItem({ ...ens, morceaux: [ens.morceaux[0], { gauche: ["1", "1"], haut: ["x", "-1"] }] }), /tuiles ≠ énoncé/);
  const opp = { forme: "oppose", enonce: "2x − 3", ecrit: "−(2x − 3)", reponse: "−2x + 3", tas: [["x", 2], ["1", -3]], paires: [["x", false], ["x", false], ["1", true], ["1", true], ["1", true]] };
  assert.equal(M.verifierItem(opp), null);
  assert.match(M.verifierItem({ ...opp, reponse: "−2x − 3" }), /la somme ne fait pas 0/);
  // lot 3 : le tableau, le facteur commun, les deux carrés
  const tab = { forme: "produit", enonce: "(x − 3)(x + 4)", lignes: ["x² + 4x − 3x − 12", "x² + x − 12"], gauche: ["x", "-1", "-1", "-1"], haut: ["x", "1", "1", "1", "1"],
    tabs: [{ g: ["x", "−3"], h: ["x", "4"], c: [["x²", "4x"], ["−3x", "−12"]] }] };
  assert.equal(M.verifierItem(tab), null);
  assert.match(M.verifierItem({ ...tab, tabs: [{ g: ["x", "−3"], h: ["x", "4"], c: [["x²", "4x"], ["−3x", "+12"]] }] }), /case fausse/);
  const com = { forme: "commun", commun: "(x + 2)", enonce: "(x + 2)(x + 3) + (x + 2)(2x − 1)", lignes: ["(x + 2)[(x + 3) + (2x − 1)]", "(x + 2)(3x + 2)"] };
  assert.equal(M.verifierItem(com), null);
  assert.match(M.verifierItem({ ...com, lignes: ["(x + 2)[(x + 3) + (2x − 1)]", "(x + 2)(3x + 4)"] }), /ligne fausse/);
  const car = { forme: "carres", enonce: "9x² − 16", a: "3x", b: "4", reponse: "(3x − 4)(3x + 4)" };
  assert.equal(M.verifierItem(car), null);
  assert.match(M.verifierItem({ ...car, b: "8" }), /𝑎² − 𝑏²/);
});

test("même graine, mêmes exercices ; autre graine, autres exercices ; jamais deux fois le même", () => {
  for (const [sup, liste] of [["tuiles", AVEC_TUILES], ["tableau", HORS_TUILES]]) for (const marche of liste) {
    const a = M.reserve(marche, 5, 30, sup).map((i) => i.cle);
    assert.deepEqual(M.reserve(marche, 5, 30, sup).map((i) => i.cle), a, `marche ${marche}`);
    assert.notDeepEqual(M.reserve(marche, 6, 30, sup).map((i) => i.cle), a, `marche ${marche}`);
    assert.equal(new Set(a).size, a.length, `marche ${marche} : doublon`);
  }
});

test("un facteur négatif devant, aussi en tuiles (règle des signes)", () => {
  const devant = tous(6).filter((i) => i.enonce.startsWith("−"));
  assert.ok(devant.length >= 50, "des facteurs négatifs devant la parenthèse");
  for (const it of devant) assert.ok(it.gauche.every((k) => k.startsWith("-")), `le facteur de ${it.enonce} est en tuiles rouges`);
  for (const it of tous(4)) assert.ok(it.enonce.includes("×") ? it.haut.every((k) => k === "1") : it.gauche.every((k) => k === "1"), `marche 4, facteur positif : ${it.enonce}`);
  // rouge × rouge = vert : la tuile du produit est positive
  const svg = M.rectangle(["-1"], ["-1"]).html;
  assert.equal((svg.match(/class="tn"/g) || []).length, 2, "les deux bords rouges");
  assert.equal((svg.match(/class="tp"/g) || []).length, 1, "le produit vert");
});

test("dessin : la tuile 1 fait 4,4 mm partout (bords compris), 𝑥 = 3,4 unités, coins droits", () => {
  const r = M.rectangle(["x", "1"], ["x", "-1", "-1"]).html;
  const rects = [...r.matchAll(/<rect class="t[pn]" x="[^"]+" y="[^"]+" width="([^"]+)" height="([^"]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(rects.length, 2 * 3 + 2 + 3, "6 tuiles dans le rectangle + 5 sur les bords");
  for (const [w, h] of rects) for (const c of [w, h]) assert.ok([4.4, 14.96].includes(c), `côté ${c} mm`);
  assert.doesNotMatch(r + M.tas([["x2", 1], ["x", 2], ["1", -3]]).html, /<rect class="t[pn]"[^>]*\brx=/);
  assert.match(M.rectangle(["1"], ["x"], { vide: "interieur" }).html, /stroke-dasharray/);
  // lot 3 : les bords à trouver sont deux bandes vides en pointillés où l'élève dessine (plus de « ? »)
  const bords = M.rectangle(["1"], ["x"], { vide: "bords" }).html;
  assert.equal((bords.match(/<rect class="bord-vide"[^>]*stroke-dasharray/g) || []).length, 2);
  assert.doesNotMatch(bords, />\?</);
  // les paires nulles sont entourées d'orange
  assert.match(M.paire("x", false).html, /stroke="#B45309"/);
});

test("la page : menu par marches en deux parties, marches grisées selon le support, un seul réglage de support", () => {
  for (const nom of ["Écrire l’expression", "Réduire", "L’opposé", "Multiplier", "Développer", "Factoriser", "Tout ensemble", "Double distributivité", "Avec des signes −", "Identités remarquables"]) assert.ok(page.includes(`nom: '${nom}'`), nom);
  assert.match(page, /<div class="marches" id="marches"><\/div>/);
  assert.match(page, /\[1, 2\]\.map\(\(p\) => \{\n\s+const lignes = M\.MARCHES\.filter\(\(m\) => m\.partie === p\)/);
  // une marche qui ne se fait pas avec le support choisi est grisée (bouton désactivé), jamais retirée : rien ne bouge
  assert.match(page, /const disponible = \(m\) => M\.possible\(m, etat\.support\);/);
  assert.match(source, /const possible = \(m, support\) => \(support === 'tuiles' \? !m\.sansTuiles : !m\.seulTuiles\);/);
  assert.match(page, /<b>\$\{m\.etoile \? '★' : m\.n\}<\/b>/);
  assert.match(page, /b\.disabled = !libre;/);
  assert.match(page, /\.marche:disabled\{ opacity:\.38; cursor:default; \}/);
  assert.match(page, /data-reglage="support"[^>]*><button type="button" data-v="tuiles">les tuiles<\/button><button type="button" data-v="tableau">le tableau<\/button><button type="button" data-v="sans">sans aide<\/button>/);
  // le tableau du cours : × dans le coin, bord de gauche coloré ; dans le sujet, ce qu'on cherche est caché (même taille de case)
  assert.match(page, /<table class="tp"><tr><th class="coin">×<\/th>/);
  assert.match(page, /\.tp \.cache\{ visibility:hidden; \}/);
  assert.match(page, /\.note-gris\{[^}]*min-height:2\.6em;/);
  assert.match(page, /M\.reserve\(m\.n, graine, \(sansFigure\(m\) \? 64 : 26\) \* P \+ 8, etat\.support\)/);
  assert.match(page, /const MAX_LETTRES = 26;/);          // un cadre va de a à z ; au-delà, un second cadre
  // « Rectangle » ne sert qu'avec les tuiles
  assert.match(page, /const AVEC_RECTANGLE = \(m\) => etat\.support === 'tuiles' && /);
  assert.match(page, /data-reglage="rectangle"[^>]*><button type="button" data-v="lire">je le lis<\/button><button type="button" data-v="construire">je le construis<\/button><button type="button" data-v="deux">les deux<\/button>/);
  // les réglages abstraits du lot 1 ont disparu
  for (const vieux of ['data-reglage="facteurs"', 'data-reglage="negR"', 'data-reglage="negT"', 'data-reglage="tuiles"']) assert.ok(!page.includes(vieux), vieux);
  assert.match(page, /marches: \[0, 1, 2, 4\],/);
  assert.match(page, /if \(libres\(etat\.marches\)\.length === 1\) return;/);    // il reste toujours une marche cochée que le support sait faire
  assert.match(page, /if \(cle === 'support' && !libres\(etat\.marches\)\.length\)/);
  assert.match(page, /g\.classList\.toggle\('grise', !actif\)/);
});

test("la page : vert / rouge par défaut, 𝑥 rond, impression après les polices, pied des feuilles", () => {
  assert.match(page, /--pos:#72c475; --neg:#ef3f35;/);
  assert.match(page, /body\.couleurs-bg\{ --pos:#FFFFFF; --neg:#A3ADB4; \}/);
  assert.match(page, /couleurs: 'vr'/);
  assert.match(page, /@font-face\{font-family:SplatLettres;src:url\('\/assets\/fonts\/SplatLettres-BoldItalic\.woff2'\)[^}]*unicode-range:U\+1D434-1D467,U\+210E\}/);
  assert.match(page, /document\.fonts\.ready\.then\(\(\) => setTimeout\(\(\) => window\.print\(\), 80\)\)/);
  // pied des feuilles : le petit M du site et la licence, pas de Nom / Date, pas de pied de page d'appli
  assert.match(page, /<img src="\/favicon\.svg" alt="" width="17" height="17"><span>mathsgo\.re · CC BY-NC-SA 4\.0<\/span>/);
  assert.doesNotMatch(page, /Nom :|Date :|<footer\b/);
  assert.match(page, /<body\b[^>]*data-mathsgo-parent-place="#retourSlot"/);
});

test("l'ancienne version est gardée à part, hors catalogue et non indexée", () => {
  const ancien = lire("outils/tuiles_algebriques/generateur_exercices_calcul_litteral-ancien.html");
  assert.match(ancien, /<meta name="robots" content="noindex, follow">/);
  assert.doesNotMatch(ancien, /rel="canonical"/);
  assert.doesNotMatch(lire("assets/js/catalogue-refonte-data.js"), /generateur_exercices_calcul_litteral-ancien/);
});
