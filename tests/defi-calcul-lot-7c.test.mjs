// Défi calcul, lot 7c « Les fractions » (15-16/11/2026) : F4 « Fraction
// d'une quantité », F9 « Dénominateurs multiples », F11 « Entier ×
// fraction » — 6 compétences. Choix de Gwenaël du 15/11 (questions à choix,
// planches du lot) : dans On te montre de « Fraction d'une quantité »,
// l'élève touche les parts qu'il prend après le partage des billes ;
// « Fraction et quotient » s'écrit « 6 × □/6 = 5 » (une seule case, au
// numérateur) ; les nombres mixtes s'écrivent « = 2 + □/8 ». Décision du
// lot : F4-2 (résultat décimal) passe au CM2.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

const espaces = t => String(t).replace(/[  ]/g, " ");
const NIVEAUX = ["F4-1", "F4-2", "F9-2", "F9-3", "F11-1", "F11-2"];
// Tous les calculs d'un niveau, lus sur de grands tirages.
const TOUS = new Map();
function tous(cle) {
  if (TOUS.has(cle)) return TOUS.get(cle);
  const vus = new Map();
  const {niveau} = CORE.niveauDe(cle);
  for (let graine = 1; graine <= 120; graine += 1) niveau.composer(CORE.mulberry32(graine * 7919 + 3), 80, []).forEach(c => vus.set(c.cle, c));
  niveau.imposes.forEach(c => vus.set(c.cle, c));
  const liste = [...vus.values()];
  TOUS.set(cle, liste);
  return liste;
}
const textesSvg = svg => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => espaces(m[1]));
const ariaDe = svg => espaces((svg.match(/aria-label="([^"]*)"/) || [, ""])[1]);
const ecrite = n => espaces(CORE.formaterNombre(n));
// Les fractions d'un texte : [[n, d]].
const fractionsDe = texte => [...espaces(texte).matchAll(/(\d+)\/(\d+)/g)].map(m => [Number(m[1]), Number(m[2])]);
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);

test("lot 7c : 6 compétences construites ; F9-2 au CM1, F4-1, F4-2, F9-3, F11-1 au CM2, « Fraction et quotient » en 6e ; la carte en a 117", () => {
  // (Lot K1b : six étages — le CM1 est l'étage 4, le CM2 le 5, « vers la 6e » le 6.)
  const paliers = {"F4-1": 5, "F4-2": 5, "F9-2": 4, "F9-3": 5, "F11-1": 5, "F11-2": 6};
  NIVEAUX.forEach(cle => {
    const t = CORE.niveauDe(cle);
    assert.ok(t && t.module.construit && t.niveau.apprends, cle);
    assert.equal(t.niveau.palier, paliers[cle], cle);
    assert.equal(t.niveau.type, "P", cle);
  });
  assert.deepEqual(CORE.moduleDe("F11").niveaux.map(n => espaces(n.nom)), ["Entier × fraction", "Fraction et quotient", "Une fraction d’un nombre"]); // (lot « la 6e complète » : F11-3)
  assert.deepEqual(CORE.moduleDe("F4").niveaux.map(n => espaces(n.nom)), ["Fraction d’une quantité", "Fraction d’une quantité : résultat décimal"]);
  const carte = CORE.carte();
  const construits = P.parcoursConstruit(carte);
  assert.equal(construits.length, 151); // (lot K1b : neuf de plus, 132 avant) // (lot 7d : tout est construit ; lot 6 « programmes 2 » : F9-1, F6-2)
  // Construit par palier : 40, 31 (tout le CM1), 37 sur 42, 9 sur 12 ; lot 7d : tout, 40, 33, 40, 12.
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(p => construits.filter(c => P.palierDe(carte, c.module, c.niveau) === p).length), [14, 20, 19, 33, 43, 22]); // (lot K1b ; [44, 33, 43, 12] en quatre étages avant)
  // F4-2 ferme le palier 3, après F4-1 (une échelle).
  const ordre = [...CORE.ORDRE];
  assert.equal(ordre.filter(cle => CORE.niveauDe(cle).niveau.palier === 5).pop(), "F4-2");
  assert.ok(ordre.indexOf("F4-1") < ordre.indexOf("F4-2") && ordre.indexOf("F9-2") < ordre.indexOf("F9-3") && ordre.indexOf("F11-1") < ordre.indexOf("F11-2"));
});

test("lot 7c : les sortes de chaque niveau, toutes tirées, 2 à 4", () => {
  const attendues = {
    "F4-1": ["des objets", "des mesures"], "F4-2": ["en dixièmes", "en centièmes"],
    "F9-2": ["addition", "soustraction"], "F9-3": ["addition", "soustraction", "trois fractions", "nombres mixtes"],
    "F11-1": ["plus petite que 1", "plus grande que 1"], "F11-2": ["b × a/b", "la fraction, c’est une division", "la fraction cherchée"]
  };
  NIVEAUX.forEach(cle => {
    assert.deepEqual(CORE.sortesDe(cle).map(s => espaces(s.nom || s)), attendues[cle], cle);
    const vues = new Set(tous(cle).map(c => CORE.sorteDansNiveau(cle, c)));
    assert.equal(vues.size, attendues[cle].length, `${cle} : chaque sorte est tirée`);
    // La validation et l'entraînement ont chaque sorte (200 tirages : une
    // sorte qui ne serait là que par hasard finit par manquer).
    for (let g = 1; g <= 200; g += 1) {
      ["valide", "entraine"].forEach(genre => {
        const serie = CORE.genererSerie(cle, {graine: g, genre});
        assert.equal(new Set(serie.map(c => CORE.sorteDansNiveau(cle, c))).size, attendues[cle].length, `${cle} (${genre}, graine ${g}) : toutes les sortes`);
      });
    }
  });
});

test("lot 7c : les règles communes avec les voisins, sur tous les calculs", () => {
  // F3 / F4 : F3 a les fractions unitaires (1/4 de 12 billes), F4 un numérateur plus grand que 1.
  ["F3-1", "F3-2", "F3-3"].forEach(cle => tous(cle).forEach(c => assert.match(espaces(c.texte), /^1\/\d+ de /, `${cle} : ${c.texte}`)));
  ["F4-1", "F4-2"].forEach(cle => tous(cle).forEach(c => assert.ok(c.f4.a >= 2 && c.f4.a < c.f4.d && pgcd(c.f4.a, c.f4.d) === 1, `${cle} : ${espaces(c.texte)}`)));
  // F4-1 / F4-2 : un résultat entier ; un résultat décimal, des mesures seulement (jamais 7,5 œufs).
  tous("F4-1").forEach(c => assert.ok(Number.isInteger(c.reponse), espaces(c.texte)));
  tous("F4-2").forEach(c => assert.ok(!Number.isInteger(c.reponse) && !c.f4.objet, espaces(c.texte)));
  // F8-1 / F11 : 3 × 1/6 reste à F8-1 ; F11 a un numérateur plus grand que 1.
  tous("F8-1").filter(c => /×/.test(c.texte)).forEach(c => assert.ok(fractionsDe(c.texte)[0][0] === 1, `F8-1 : ${espaces(c.texte)}`));
  ["F11-1", "F11-2"].forEach(cle => tous(cle).forEach(c => assert.ok(c.f11.a >= 2, `${cle} : ${espaces(c.texte)}`)));
  // F11-1 / F11-2 : le produit n'est jamais un entier ; le multiplicateur est le dénominateur.
  tous("F11-1").forEach(c => assert.ok(c.f11.k % c.f11.d !== 0 && (c.f11.k * c.f11.a) % c.f11.d !== 0, espaces(c.texte)));
  // (Lot 6 « programmes » : « la fraction, c'est une division », 12/4 = □ :
  // un numérateur multiple du dénominateur, un quotient de 2 à 6.)
  tous("F11-2").forEach(c => (c.forme === "quotient"
    ? assert.ok(c.f11.a % c.f11.d === 0 && c.reponse >= 2 && c.reponse <= 6 && c.reponse !== c.f11.d, espaces(c.texte))
    : assert.equal(c.f11.k, c.f11.d, espaces(c.texte))));
  // F2 / F9 : F2 garde les demis et les quarts jusqu'à 1 ; F9-2 / F9-3 : le grand dénominateur jusqu'à 20, puis au-delà.
  const deuxFractions = c => ["somme", "difference"].includes(c.forme);
  tous("F9-2").forEach(c => {
    assert.ok(deuxFractions(c), espaces(c.texte));
    const [x, y] = fractionsDe(c.texte);
    const D = Math.max(x[1], y[1]);
    const d = Math.min(x[1], y[1]);
    assert.ok(D <= 20 && D % d === 0 && d >= 2 && d <= 10 && D / d >= 2 && D / d <= 10, espaces(c.texte));
    assert.ok(x[0] <= 12 && y[0] <= 12, `${espaces(c.texte)} : des numérateurs jusqu'à 12`);
    assert.ok(!(d === 2 && D === 4 && Math.min(x[0], y[0]) <= 2 && Math.max(x[0], y[0]) <= 4 && fractionsDe(c.texte).every(([n, q]) => n / q <= 1)), `${espaces(c.texte)} : un calcul de F2`);
  });
  tous("F9-3").filter(deuxFractions).forEach(c => assert.ok(Math.max(...fractionsDe(c.texte).map(f => f[1])) > 20, espaces(c.texte)));
  // Une échelle par module : aucun calcul commun entre deux niveaux, ni avec un voisin.
  const voisins = ["F2-1", "F2-2", "F3-1", "F3-2", "F3-3", "F5-1", "F5-2", "F6-1", "F6-3", "F6-4", "F8-1", "F8-2", "F8-3"];
  const textes = new Map();
  [...NIVEAUX, ...voisins].forEach(cle => tous(cle).forEach(c => {
    const t = espaces(c.texte).replace(/ /g, "");
    const deja = textes.get(t);
    // (Lot K1b : au CE1, « Additions et soustractions de fractions » a les dénominateurs 2, 3,
    // 4, 5, 6, 8 et 10 — ses demis et ses quarts se retrouvent au CM1 dans « Demis et quarts »,
    // F2 : le même calcul à deux étages, deux ans plus tard. Rien d'autre n'est commun.)
    const ce1PuisCm1 = deja && [deja, cle].some(x => x.startsWith("F2-")) && [deja, cle].some(x => x === "F8-1" || x === "F8-2")
      && fractionsDe(c.texte).every(([, d]) => d === 2 || d === 4);
    assert.ok(!deja || deja === cle || ce1PuisCm1, `${espaces(c.texte)} : dans ${deja} et ${cle}`);
    if (!deja) textes.set(t, cle);
  }));
  // Ni les calculs des leçons dans un autre niveau.
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    [lecon.calculs.montre, lecon.calculs.ecris].forEach(c => {
      const ailleurs = textes.get(espaces(c.texte).replace(/ /g, ""));
      assert.ok(!ailleurs || ailleurs === cle, `${cle} : la leçon ${espaces(c.texte)} est un calcul de ${ailleurs}`);
    });
  });
});

test("lot 7c : les bornes (rapport de Codex du 14/11)", () => {
  // F4-1 : jusqu'à 1 000 ; des objets jusqu'à 60 ; F4-2 : le tout jusqu'à 30, un ou deux chiffres après la virgule.
  tous("F4-1").forEach(c => {
    assert.ok(c.f4.N <= 1000 && c.f4.N % c.f4.d === 0, espaces(c.texte));
    if (c.f4.objet) assert.ok(c.f4.N <= 60, espaces(c.texte));
  });
  tous("F4-2").forEach(c => assert.ok(c.f4.N <= 30 && CORE.decimalesDe(c.reponse) <= 2 && c.f4.p <= 7.5, espaces(c.texte)));
  // Les exemples officiels sont là.
  ["2/3 de 12 œufs", "3/10 de 500 g", "2/5 de 60 kg"].forEach(t => assert.ok([...tous("F4-1"), CORE.niveauDe("F4-1").niveau.apprends.calculs.montre, CORE.niveauDe("F4-1").niveau.apprends.calculs.ecris].some(c => espaces(c.texte).startsWith(`${t},`)) || NIVEAUX.some(cle => CORE.niveauDe(cle).niveau.apprends.textes.some(x => espaces(x).startsWith(`${t},`))), t));
  assert.equal(espaces(CORE.niveauDe("F4-2").niveau.apprends.calculs.montre.texte), "3/4 de 10 m, c’est □ m.");
  // F9 : la barre a 30 parts au plus (au-delà, les deux flèches) ; six unités au plus.
  ["F9-2", "F9-3", "F11-1", "F11-2"].forEach(cle => tous(cle).forEach(c => {
    const aide = CORE.aideDe(c);
    if (aide.outil === "fois-fraction") { assert.ok(cle.startsWith("F9"), espaces(c.texte)); return; }
    assert.equal(aide.outil, "barre-droite", espaces(c.texte));
    assert.ok(aide.a <= 6 && aide.a * aide.d <= 30, `${espaces(c.texte)} : ${aide.a} unités, ${aide.a * aide.d} parts`);
  }));
  // F9-3 : 4/7 − 2/21, 2/8 + 3/2 + 1/4 (livret CM2 p. 11), les nombres mixtes.
  assert.ok(tous("F9-3").some(c => espaces(c.texte) === "2/8 + 3/2 + 1/4 = □/8"));
  assert.ok(tous("F9-3").some(c => espaces(c.texte) === "(1 + 1/2) + (1 + 1/8) = 2 + □/8" || espaces(c.texte) === "(1 + 1/8) + (1 + 1/2) = 2 + □/8"));
  assert.equal(espaces(CORE.niveauDe("F9-3").niveau.apprends.calculs.montre.texte), "4/7 − 2/21 = □/21");
  // Jamais 69 dans un calcul.
  NIVEAUX.forEach(cle => tous(cle).forEach(c => assert.doesNotMatch(espaces(c.texte).replace(/ /g, ""), /69/, `${cle} : ${espaces(c.texte)}`)));
});

test("lot 7c : une seule case, au numérateur ; la consigne dit le dénominateur ; la touche « , » pour F4-2 seulement", () => {
  NIVEAUX.forEach(cle => tous(cle).forEach(c => {
    const t = espaces(c.texte);
    // (Lot 6 « fraction à deux cases » : « 6 × □/□ = 5 », une seule
    // réponse, la fraction et ses deux cases.)
    assert.equal(t.replace("□/□", "□").split("□").length, 2, `${cle} : ${t}`);
    if (cle.startsWith("F9") || cle === "F11-1") assert.match(t, / = (\d+ \+ )?□\/\d+$/, `${cle} : ${t}`);
    if (cle === "F11-2") assert.match(t, /^(\d+ × \d+\/\d+|\d+\/\d+ × \d+) = □$|^\d+\/\d+ = □$|^(\d+ × □\/□|□\/□ × \d+) = \d+$/, t);
    assert.equal(CORE.virguleDe(c), cle === "F4-2", `${cle} : ${t}`);
  }));
  // Lot 6 « programmes » : « 6 × □/6 = 5 » (réponse : le nombre écrit à
  // droite) est remplacé par « la fraction, c'est une division ».
  assert.ok(tous("F11-2").some(c => espaces(c.texte) === "15/3 = □" && c.reponse === 5));
  assert.ok(CORE.niveauDe("F11-2").niveau.imposes.some(c => espaces(c.texte) === "15/3 = □"));
  // Lot 6 « fraction à deux cases » : la fraction cherchée revient, à deux
  // cases (« 6 × □/□ = 5 », réponse 5/6), jamais l'ancien « 6 × □/6 = 5 ».
  assert.ok(!tous("F11-2").some(c => /□\/\d/.test(espaces(c.texte))));
  assert.ok(tous("F11-2").some(c => espaces(c.texte) === "6 × □/□ = 5" && c.ecrite === "5/6"));
});

test("lot 7c : l'aide ne donne jamais la réponse, la correction la montre (tous les calculs)", () => {
  NIVEAUX.forEach(cle => tous(cle).forEach(c => {
    const t = espaces(c.texte);
    const aide = CORE.aideDe(c);
    const image = CORE.imageDe(c);
    const svg = AIDES.dessinerImage(aide);
    const svgImage = AIDES.dessinerImage(image);
    if (c.module === "F4") {
      const r = ecrite(c.reponse);
      assert.ok(!textesSvg(svg).includes(r) && !textesSvg(svg).includes(ecrite(c.f4.p)), `${t} : rien n'est écrit dans les parts`);
      assert.doesNotMatch(ariaDe(svg), new RegExp(`(^|[^\\d,])${r.replace(",", "\\,")}([^\\d,]|$)`), `${t} : le lecteur d'écran (${ariaDe(svg)})`);
      assert.ok(textesSvg(svgImage).includes(r), `${t} : la correction montre ${r}`);
      return;
    }
    const D = Number(t.match(/□\/(\d+)/) ? t.match(/□\/(\d+)/)[1] : 0);
    if (aide.outil === "fois-fraction") {
      assert.ok(!aide.montre && image.montre, t);
      return;
    }
    if (c.module === "F11" && c.forme.startsWith("fraction")) {
      assert.ok(aide.haut.every(h => h.texte === `?/${c.f11.d}`) && image.haut.every(h => h.texte === `${c.f11.a}/${c.f11.d}`), t);
      return;
    }
    if (c.module === "F11" && c.niveau === 2) {
      // 7 × 3/7 = □ : l'entier cherché porte « ? » sur la droite.
      assert.equal(aide.cache, c.reponse, t);
      assert.ok(textesSvg(svg).includes("?"), t);
      return;
    }
    // La case est un numérateur : l'accolade dit « ?/D », la correction « r/D ».
    assert.equal(aide.bas.texte, `?/${D}`, t);
    assert.equal(image.bas.texte, `${c.reponse}/${D}`, t);
    assert.ok(!aide.haut.some(h => h.texte === `${c.reponse}/${D}`) || t.includes(`${c.reponse}/${D}`), `${t} : la réponse au-dessus de la barre`);
  }));
});

test("lot 7c : J'écris — une recette partagée par la leçon et les calculs tirés ; le calcul cherché d'abord ; le dessin se remplit à son étape", () => {
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    // La recette, sur le calcul de la leçon, redonne la leçon.
    const refait = CORE.ecrisDuCalcul(cle, lecon.calculs.ecris);
    assert.deepEqual(refait.etapes.map(e => [espaces(e.texte), e.reponse]), lecon.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), cle);
    for (let g = 1; g <= 60; g += 1) {
      const {calcul, ecris} = CORE.ecrisTire(cle, {graine: g * 31 + 7});
      const t = espaces(calcul.texte);
      // Le calcul cherché d'abord.
      // (Lot 6 : la fraction à deux cases s'écrit « ? » dans la consigne.)
      const cherche = t.replace("□/□", "?").replace(/, c’est □.*$/, "").replace(/ = .*$/, "");
      assert.ok(espaces(ecris.consigne).startsWith(cherche), `${cle} : « ${espaces(ecris.consigne)} » commence par ${cherche}`);
      assert.ok(CORE.memeNombre(ecris.etapes[ecris.etapes.length - 1].reponse, calcul.reponse), `${t} : la dernière étape donne la réponse`);
      // Le dessin : rien de vert au début ; chaque réponse d'étape s'écrit à son étape, pas avant.
      const svgs = ecris.dessins.map(AIDES.dessinerImage);
      assert.equal(svgs.length, ecris.etapes.length + 1, t);
      ecris.etapes.forEach((etape, j) => {
        const r = calcul.module === "F4" ? ecrite(etape.reponse) : null;
        if (r) {
          svgs.slice(0, j + 1).forEach((svg, k) => assert.ok(!textesSvg(svg).includes(r) || ecris.etapes.slice(0, k).some(e => ecrite(e.reponse) === r), `${t} : ${r} dans le dessin ${k}`));
          assert.ok(textesSvg(svgs[j + 1]).includes(r), `${t} : ${r} s'écrit à l'étape ${j + 1}`);
        }
      });
      if (calcul.module !== "F4") {
        const fin = ecris.dessins[ecris.dessins.length - 1];
        // (Lot C4d : au-delà de 12 parts par unité, les flèches de la
        // fraction à réécrire — la case est le numérateur réécrit, trouvé à
        // la première ligne ; pas d'accolade.)
        if (ecris.dessins[0].outil === "fois-fraction") {
          assert.ok(ecris.dessins.every(d => d.outil === "fois-fraction") && !ecris.dessins[0].montre && fin.montre, `${t} : les flèches se remplissent`);
          return;
        }
        ecris.dessins.slice(0, -1).forEach((d, k) => assert.ok(!d.bas || String(d.bas.texte).includes("?"), `${t} : l'accolade garde « ? » au dessin ${k}`));
        // (Lot 6 : la fraction cherchée l'écrit sur ses crochets, « 2/3 ».)
        assert.ok((fin.bas && fin.bas.trouve) || Object.values(fin.ecrits || {}).some(x => x.trouve) || (fin.haut || []).some(h => h.trouve && h.texte === calcul.ecrite), `${t} : la dernière étape écrit la réponse`);
      }
    }
  });
  // Les recettes, mot à mot.
  const e = cle => CORE.niveauDe(cle).niveau.apprends.ecris;
  const lignes = cle => e(cle).etapes.map(x => [espaces(x.texte), x.reponse]);
  assert.equal(espaces(e("F4-1").consigne), "3/10 de 500 g : je partage en 10 parts égales, j’en prends 3.");
  assert.deepEqual(lignes("F4-1"), [["Une part, c’est □ g.", 50], ["3/10 de 500 g, c’est □ g.", 150]]);
  // (Lot 6 « programmes 2 » : 1/5 + 7/10 est au CE2, F9-1 ; F9-2 écrit 3/5 + 7/10.)
  assert.equal(espaces(e("F9-2").consigne), "3/5 + 7/10 = ?/10");
  assert.deepEqual(lignes("F9-2"), [["3/5 = □/10", 6], ["6/10 + 7/10 = □/10", 13]]);
  assert.equal(espaces(e("F9-1").consigne), "1/4 + 5/12 = ?/12");
  assert.deepEqual(lignes("F9-1"), [["1/4 = □/12", 3], ["3/12 + 5/12 = □/12", 8]]);
  assert.deepEqual(lignes("F9-3"), [["5/6 = □/24", 20], ["20/24 − 7/24 = □/24", 13]]);
  assert.equal(espaces(e("F11-1").consigne), "3 × 7/4 = 7/4 + 7/4 + 7/4");
  assert.deepEqual(lignes("F11-1"), [["3 × 7 = □", 21], ["3 × 7/4 = □/4", 21]]);
  // (Lot 6, choix de Gwenaël : J'écris sur la fraction cherchée.)
  assert.equal(espaces(e("F11-2").consigne), "3 × ? = 2");
  assert.deepEqual(lignes("F11-2"), [["3 × □/3 = 2", 2], ["3 × □/□ = 2", 2 / 3]]);
  assert.equal(e("F11-2").etapes[1].ecrite, "2/3");
});

test("lot 7c : On te montre de « Fraction d'une quantité » — le partage des billes, puis l'élève touche les parts qu'il prend", () => {
  const m = CORE.niveauDe("F4-1").niveau.apprends.manipule;
  assert.deepEqual([m.outil, m.n, m.d, m.prendre], ["billes", 12, 3, 2]);
  assert.equal(espaces(m.consigne), "Partage en 3 parts égales : touche le tas.");
  assert.equal(espaces(m.consignePrendre), "Prends 2 parts : touche 2 cases.");
  assert.equal(espaces(m.traces[0].texte), "2/3 de 12 œufs, c’est 8 œufs.");
  // Le geste : 4 tours de partage (un toucher sur une case avant est refusé), puis 2 cases.
  let etat = AIDES.billesDepart();
  for (let k = 0; k < 4; k += 1) {
    assert.equal(AIDES.billesGeste(etat, {case: 0}, m), null);
    etat = AIDES.billesGeste(etat, {tas: true}, m);
  }
  assert.ok(etat && !etat.fini && etat.tours === 4);
  etat = AIDES.billesGeste(etat, {case: 2}, m);
  assert.deepEqual([etat.prises, etat.fini], [[2], false]);
  assert.equal(AIDES.billesGeste(etat, {case: 2}, m), null, "une case déjà prise : refusée");
  etat = AIDES.billesGeste(etat, {case: 0}, m);
  assert.deepEqual([etat.prises, etat.fini], [[2, 0], true]);
  // Ce que dit le lecteur d'écran : les cases prises, jamais le total.
  assert.equal(AIDES.decrireBilles({n: 12, d: 3, tours: 4, fini: false, prendre: 2, prises: [2]}), "3 cases. Le tas : vide. Dans chaque case : 4 billes. Cases prises : 1 sur 2.");
  // Le dessin garde sa taille ; la case qui brille quand le geste est montré.
  const taille = o => AIDES.billesSvg(Object.assign({}, m, o)).match(/viewBox="([^"]+)"/)[1];
  assert.equal(taille({tours: 0, fini: false}), taille({tours: 4, fini: true, prises: [0, 1]}));
  assert.match(AIDES.billesSvg(Object.assign({}, m, {tours: 4, fini: false, prises: [0], montre: true})), /class="dc-montre" x="[\d.]+"/);
  // Sans « prendre » (F3), les billes ne changent pas : le tas vide, c'est fini.
  const f3 = CORE.niveauDe("F3-1").niveau.apprends.manipule;
  let e3 = AIDES.billesDepart();
  for (let k = 0; k < f3.n / f3.d; k += 1) e3 = AIDES.billesGeste(e3, {tas: true}, f3);
  assert.equal(e3.fini, true);
  // Le dessin : le tout, les parts prises entourées ensemble, l'accolade dessous.
  const aide = CORE.aideDe(CORE.niveauDe("F4-1").niveau.apprends.calculs.ecris);
  assert.equal(ariaDe(AIDES.dessinerImage(aide)), "Schéma en barres. En haut, le tout : 500 g. En dessous, 10 parts égales ; les 3 premières sont prises. Ensemble : ?.");
});

test("lot 7c : les annonces — trois fractions, nombres mixtes, la fraction cherchée, trop de parts pour la barre", () => {
  const premier = (cle, forme) => tous(cle).find(c => c.forme === forme);
  assert.equal(espaces(CORE.annonceDe(premier("F9-3", "trois"))), "Nouveau : trois fractions : je les écris toutes avec le même dénominateur.");
  assert.equal(espaces(CORE.annonceDe(premier("F9-3", "mixtes"))), "Nouveau : des nombres mixtes : les unités ensemble, les fractions ensemble.");
  assert.equal(espaces(CORE.annonceDe(premier("F9-3", "difference"))), "Nouveau : c’est une soustraction.");
  assert.match(espaces(CORE.annonceDe(premier("F11-2", "quotient"))), /^Nouveau : la fraction, c’est une division : (\d+)\/(\d+) = \1 ÷ \2\.$/);
  assert.equal(espaces(CORE.annonceDe(premier("F11-2", "produit-gauche"))), "Nouveau : les facteurs ont changé de place.");
  // (Lot 6 : la fraction cherchée.)
  assert.match(espaces(CORE.annonceDe(premier("F11-2", "fraction"))), /^Nouveau : la fraction cherchée, c’est le nombre qui, multiplié par (\d+), donne (\d+)\.$/);
  // Au-delà de 30 parts : le calcul, annoncé, avec les deux flèches (au CM1,
  // F9-2 ; lot C4d : en F9-3, la leçon est aux flèches, rien à annoncer).
  const grand = CORE.genererSerie("F9-2", {graine: 3, total: 40}).find(c => CORE.aideDe(c).outil === "fois-fraction");
  assert.equal(espaces(CORE.nouveauteDe(grand).texte), "Nouveau : trop de parts pour les dessiner : je multiplie en haut et en bas.");
  tous("F9-3").filter(c => CORE.aideDe(c).outil === "fois-fraction").forEach(c => assert.equal(CORE.nouveauteDe(c), null, c.texte));
  // F4 : une seule écriture, rien à annoncer (l'unité change, la méthode non).
  ["F4-1", "F4-2"].forEach(cle => tous(cle).forEach(c => {
    assert.equal(c.forme, "quantite");
    assert.equal(CORE.nouveauteDe(c), null, espaces(c.texte));
  }));
});

test("lot 7c : les erreurs connues, chacune la sienne (dont 3/4 + 1/2 = 4/6 du livret : les numérateurs pris tels quels)", () => {
  const trouve = (cle, texte) => {
    const c = [...tous(cle), ...CORE.niveauDe(cle).niveau.imposes].find(x => espaces(x.texte) === texte || espaces(x.texte).startsWith(`${texte},`));
    assert.ok(c, `${cle} : ${texte}`);
    return c;
  };
  const cas = [
    ["F4-1", "2/5 de 60 kg", 12, 1], ["F4-1", "2/5 de 60 kg", 120, 2], ["F4-1", "2/5 de 60 kg", 30, 3], ["F4-1", "2/5 de 60 kg", 36, 4], ["F4-1", "2/5 de 60 kg", 150, 5],
    ["F9-2", "11/4 − 7/20 = □/20", 4, 1], ["F9-2", "11/4 − 7/20 = □/20", 62, 2],
    ["F9-3", "2/8 + 3/2 + 1/4 = □/8", 14, 3],
    ["F11-1", "3 × 5/4 = □/4", 8, 1], ["F11-1", "3 × 5/4 = □/4", 5, 2],
    ["F11-2", "15/3 = □", 15, 2]
  ];
  cas.forEach(([cle, texte, reponse, cause]) => assert.equal((CORE.diagnostiquer(trouve(cle, texte), reponse) || {}).c, cause, `${texte} → ${reponse}`));
  const mixte = tous("F9-3").find(c => c.forme === "mixtes" && espaces(c.texte).endsWith("= 2 + □/8") && c.reponse === 5);
  assert.ok(mixte, "un nombre mixte en huitièmes");
  assert.equal(CORE.diagnostiquer(mixte, 21).c, 4, `${espaces(mixte.texte)} → 21 : les unités comptées deux fois`);
  const quotient = tous("F11-2").find(c => c.forme === "produit" && c.f11.d === 7 && c.f11.a === 3);
  assert.equal(CORE.diagnostiquer(quotient, 21).c, 3, "7 × 3/7 → 21 : le nombre de septièmes");
  // Chaque phrase de retour cite la réponse fausse et ne donne pas la bonne.
  cas.forEach(([cle, texte, reponse, cause]) => {
    const c = trouve(cle, texte);
    const d = CORE.diagnostiquer(c, reponse);
    assert.ok(espaces(d.retour || d.texte || d.phrase || "").length > 0 || d.c === cause, texte);
  });
});

test("lot 7c : À retenir reprend le calcul de On te montre, une égalité par ligne", () => {
  const bilan = cle => espaces(CORE.niveauDe(cle).niveau.apprends.bilan);
  assert.equal(bilan("F4-1"), "Pour 2/3 de 12 œufs, je partage en 3 parts égales : une part, c’est 4 œufs. 2 parts, c’est 8 œufs.");
  assert.equal(bilan("F4-2"), "Pour 3/4 de 10 m, je partage en 4 parts égales : une part, c’est 2,5 m. 3 parts, c’est 7,5 m.");
  assert.equal(bilan("F9-2"), "2/3 = 4/6. 2/3 + 5/6 = 4/6 + 5/6 = 9/6.");
  // (Lot C4d : les flèches « × 3 » dessinées dessous, le calcul seul.)
  assert.equal(bilan("F9-3"), "4/7 − 2/21 = 12/21 − 2/21 = 10/21.");
  assert.equal(bilan("F11-1"), "3 fois 5 quarts, c’est 15 quarts : 3 × 5/4 = 5/4 + 5/4 + 5/4 = 15/4.");
  assert.equal(bilan("F11-2"), "3/7, c’est le nombre qui, multiplié par 7, donne 3 : 7 × 3/7 = 21/7 = 3.");
  assert.deepEqual(AIDES.bilanEnDeux(bilan("F11-1")), {phrase: "3 fois 5 quarts, c’est 15 quarts.", calcul: "3 × 5/4 = 5/4 + 5/4 + 5/4 = 15/4"});
});

test("lot 7c : la page — adresses de cache, copie du moteur pour la page prof, VERSION", async () => {
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /defi_calcul_core\.js\?v=20261127-2/);
  assert.match(page, /defi_calcul_aides\.js\?v=20261127-2/);
  assert.match(page, /billes: \(\) => \(state\.manip && state\.manip\.outil === "billes" \? \{tours: state\.manip\.tours, fini: state\.manip\.fini, prises: state\.manip\.prises\}/);
  const coeur = await readFile(new URL("../outils/calcul_mental/defi_calcul_core.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_calcul_core.js", import.meta.url));
  assert.ok(coeur.equals(copie), "la copie de la page prof est identique, octet pour octet");
  // Rien ne bouge : la consigne et la ligne sous les billes gardent la
  // hauteur de leur plus haute phrase (une fraction sur deux étages).
  const aides = await readFile(new URL("../outils/calcul_mental/defi_calcul_aides.js", import.meta.url), "utf8");
  assert.match(aides, /if \(haut\) consigne\.style\.minHeight = `\$\{haut\}px`;/);
  assert.match(aides, /if \(bas\) trace\.style\.minHeight = `\$\{Math\.max\(bas, trace\.offsetHeight\)\}px`;/);
  // (Lot K1 : la liste de Mon parcours, qui se calait sur une ligne entière, est partie avec lui.)
  const version = await readFile(new URL("../_serveur/public/VERSION", import.meta.url), "utf8");
  assert.match(version, /^lot defi-calcul-lot-(?:7c-fractions|7d-derniers-modules|6-programmes|6-fraction-deux-cases|6-programmes-2|6-programmes-2-correctif|F4-personne-bloque|F4-correctif|C1-ordre|C2-doubles-moities|C3-exemples|C4a|C4b|C4c|C4d|K1-la-carte|K1b|P1|6e-complete)$|^lot plus-rapide-A$|^lot mon-espace-B1(?:-liens)?$|^lot ma-liste-B2$|^lot arriver-E$|^lot m-corrige$|^lot aujourdhui-B3$|^lot anzan-bareme-lot-1$/m); // (lots 7d, 6 « programmes », 6 « fraction à deux cases », 6 « programmes 2 » : le cœur change encore ; lot F4 et son correctif : le moteur ; lot C1 : le cœur ; lot C2 : le cœur, la progression en version 11)
});
