// Défi calcul, lots 1a et 1b : les fiches des modules, les générateurs, les
// erreurs connues, les aides (fiche technique § 9, points 1 à 3) ; lot 3 :
// la carte v2, le test en escalier, J'apprends sur trois calculs, les séries
// rangées du simple au difficile, l'outil de l'entraînement.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const PARCOURS = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");

const NIVEAUX_CONSTRUITS = CORE.MODULES.filter(fiche => fiche.construit)
  .flatMap(fiche => fiche.niveaux.map(niveau => ({fiche, niveau, cle: `${fiche.id}-${niveau.n}`})));
const SERIES = 220; // 220 séries de 10 ou 12 calculs : plus de 2 000 tirages par niveau et par genre.

const nombre = texte => Number(String(texte).replace(/[\u202f\u00a0 ]/g, "").replace(",", "."));

// Un nombre écrit (« 4107,5 ») en entier de millionièmes : les calculs de
// contrôle se font sans virgule flottante.
function millioniemes(texte) {
  const [entiere, decimales = ""] = String(texte).replace(/[\u202f\u00a0 ]/g, "").split(",");
  return BigInt(entiere + decimales.padEnd(6, "0"));
}
const versNombre = grand => Number(grand) / 1e6;
const MILLION = 1000000n;

// La réponse d'un calcul, recalculée à partir de son TEXTE seulement.
function resoudre(texte) {
  const m = texte.replace(/\u202f/g, "");
  const nb = "([\\d,]+)";
  const motif = forme => new RegExp(`^${forme.replace(/[+]/g, "\\+").replace(/N/g, nb)}$`);
  let r;
  if ((r = motif("N × N = □").exec(m))) return versNombre(millioniemes(r[1]) * millioniemes(r[2]) / MILLION);
  if ((r = motif("N ÷ N = □").exec(m))) return versNombre(millioniemes(r[1]) * MILLION / millioniemes(r[2]));
  if ((r = motif("N × □ = N").exec(m)) || (r = motif("□ × N = N").exec(m))) return versNombre(millioniemes(r[2]) * MILLION / millioniemes(r[1]));
  if ((r = motif("N = N × □").exec(m))) return versNombre(millioniemes(r[1]) * MILLION / millioniemes(r[2]));
  if ((r = /^(\d+) \+ □ = (\d+)$/.exec(m))) return Number(r[2]) - Number(r[1]);
  if ((r = /^□ \+ (\d+) = (\d+)$/.exec(m))) return Number(r[2]) - Number(r[1]);
  if ((r = /^(\d+) − (\d+) = □$/.exec(m))) return Number(r[1]) - Number(r[2]);
  if ((r = /^(\d+) \+ (\d+) = □$/.exec(m))) return Number(r[1]) + Number(r[2]);
  throw new Error(`forme inconnue : ${texte}`);
}

// Les séries de contrôle : la validation (12 ou 10 calculs, imposés dedans)
// et l'entraînement tel que le composent les fiches, 10 calculs mélangés —
// l'ordre du simple au difficile et les 20 calculs ont leur propre test.
function series(cle, genre) {
  return Array.from({length: SERIES}, (_, graine) => CORE.genererSerie(cle, {graine: graine * 7919 + 13, genre, ...(genre === "entraine" ? {total: 10, ordonne: false} : {})}));
}

const compter = (liste, critere) => liste.filter(critere).length;

test("les 74 modules de la carte v2 : identifiants, paliers par niveau, ordre du parcours", () => {
  assert.equal(CORE.MODULES.length, 74);
  const ids = CORE.MODULES.map(fiche => fiche.id);
  assert.equal(new Set(ids).size, 74, "aucun identifiant en double");
  ids.forEach(id => assert.match(id, /^[AMDFPRXC]\d{1,2}$/));
  // 45 modules dans la carte (129 compétences), 29 identifiants réservés
  // (palier 0, jamais affichés). Le palier est celui du NIVEAU.
  const dansLaCarte = CORE.MODULES.filter(fiche => fiche.niveaux.some(niveau => niveau.palier > 0));
  assert.equal(dansLaCarte.length, 45);
  assert.equal(CORE.MODULES.length - dansLaCarte.length, 29);
  const competences = dansLaCarte.flatMap(fiche => fiche.niveaux.map(niveau => ({cle: `${fiche.id}-${niveau.n}`, palier: niveau.palier, type: niveau.type})));
  assert.equal(competences.length, 129);
  assert.deepEqual([1, 2, 3, 4].map(p => competences.filter(c => c.palier === p).length), [37, 32, 45, 15]);
  competences.forEach(c => assert.ok([1, 2, 3, 4].includes(c.palier) && ["F", "P"].includes(c.type), c.cle));
  assert.deepEqual(CORE.moduleDe("A5").niveaux.map(n => n.palier), [1, 1, 1, 3], "A5 : « + 9 » aux bases, « + 98 » au CM2");
  assert.deepEqual(CORE.moduleDe("D2").niveaux.map(n => n.palier), [2, 3, 3, 4]);
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.palier), [1, 1, 1, 2]);
  assert.deepEqual(CORE.PALIERS.map(palier => palier.nom), ["Les bases", "Le CM1", "Le CM2", "Vers la 6e"]);
  // L'ordre du parcours : les 129 compétences, une fois chacune, le palier croissant.
  assert.equal(CORE.ORDRE.length, 129);
  assert.equal(new Set(CORE.ORDRE).size, 129);
  const paliersDeLOrdre = CORE.ORDRE.map(cle => CORE.niveauDe(cle).niveau.palier);
  assert.deepEqual(paliersDeLOrdre, [...paliersDeLOrdre].sort(), "palier 1, puis 2, 3, 4");
  assert.deepEqual(CORE.ORDRE.slice(0, 6), ["A1-1", "A1-2", "A1-3", "A10-1", "A11-1", "M1-1"]);
  assert.deepEqual(CORE.ORDRE.slice(-3), ["F11-2", "A9-4", "M9-3"]);
  // Les niveaux d'un module se suivent dans l'ordre (un module est une échelle).
  dansLaCarte.forEach(fiche => {
    const rangs = fiche.niveaux.map(niveau => CORE.ORDRE.indexOf(`${fiche.id}-${niveau.n}`));
    assert.ok(rangs.every(r => r >= 0), `${fiche.id} : tous ses niveaux sont dans l'ordre`);
    assert.deepEqual(rangs, [...rangs].sort((a, b) => a - b), `${fiche.id} : le niveau 2 après le niveau 1`);
  });
  // Les trois modules nouveaux de la carte v2.
  ["A10", "A11", "M13"].forEach(id => assert.ok(CORE.moduleDe(id), id));
  assert.equal(CORE.moduleDe("M5").niveaux.length, 1);
  // La table du moteur de progression dit la même chose que les fiches.
  assert.deepEqual(ids, [...PARCOURS.CODES], "même ordre dans les deux fichiers");
  CORE.MODULES.forEach(fiche => {
    assert.equal(fiche.niveaux.length, PARCOURS.NIVEAUX[fiche.id], `niveaux de ${fiche.id}`);
    fiche.niveaux.forEach((niveau, index) => assert.equal(niveau.n, index + 1, `${fiche.id} : niveaux numérotés à la suite`));
  });
  assert.equal("avant" in CORE.moduleDe("A2"), false, "plus de verrous « avant » : l'ordre de la carte fait foi");
});

test("les lots 1a et 1b construisent les quatre pilotes : A2, M2, A5, D2", () => {
  assert.deepEqual(CORE.MODULES.filter(fiche => fiche.construit).map(fiche => fiche.id), ["A2", "A5", "M2", "D2"]);
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.type), ["F", "F", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("A5").niveaux.map(n => n.type), ["P", "P", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("M2").niveaux.map(n => n.type), ["P", "P"]);
  assert.deepEqual(CORE.moduleDe("D2").niveaux.map(n => n.type), ["P", "P", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("M2").niveaux.map(n => n.titre), ["produits", "nombres en 0, trous, divisions"]);
  assert.deepEqual(CORE.moduleDe("D2").niveaux.map(n => n.titre.replace(/\u202f/g, " ")), ["× 10", "× 100, × 1 000 sans zéro à écrire", "des zéros à écrire", "trous"]);
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.titre.replace(/[\u202f\u00a0]/g, " ")), ["à la dizaine suivante", "à 100 : dizaines et nombres en 5", "à 100 : tous les nombres", "à 1 000 et à la centaine suivante"]);
  // La touche « , » : les modules à décimales seulement.
  assert.equal(CORE.moduleDe("D2").virgule, true);
  ["A2", "A5", "M2"].forEach(id => assert.ok(!CORE.moduleDe(id).virgule, `${id} : pas de virgule`));
  // Lot 2a : plus de « pilotes ouverts pendant l'essai » — la séance parcourt
  // les modules construits, dans l'ordre de la carte.
  assert.equal("PILOTES" in CORE, false);
  assert.equal("ESSAI_PILOTES" in CORE, false);
  const carte = CORE.carte();
  assert.equal(carte.modules.length, 74);
  assert.deepEqual(Object.keys(carte.modules[0]), ["id", "niveaux", "paliers", "types", "construit"]);
  assert.deepEqual(carte.modules.filter(f => f.construit).map(f => f.id), ["A2", "A5", "M2", "D2"]);
  assert.deepEqual(carte.ordre, [...CORE.ORDRE]);
  assert.deepEqual(carte.modules.find(f => f.id === "A2"), {id: "A2", niveaux: 4, paliers: [1, 1, 1, 2], types: ["F", "F", "P", "P"], construit: true});
  assert.deepEqual(CORE.genererSerie("M3-1", {graine: 1}), [], "un niveau pas encore construit ne génère rien");
});

test("générateurs : nombre de calculs, réponse recalculée, clés, déterminisme", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const textes = new Map();
    ["valide", "entraine"].forEach(genre => {
      const attendu = genre === "valide" ? (niveau.type === "F" ? 12 : 10) : 10;
      series(cle, genre).forEach((serie, index) => {
        assert.equal(serie.length, attendu, `${cle} ${genre} : ${attendu} calculs`);
        assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle} : aucune répétition dans une série`);
        serie.forEach(calcul => {
          assert.equal(calcul.reponse, resoudre(calcul.texte), `${cle} : ${calcul.texte}`);
          assert.ok(calcul.reponse > 0, `${cle} : réponse positive (${calcul.texte})`);
          // Entière partout, sauf dans D2 ; jamais plus de 3 décimales.
          if (fiche.id !== "D2") assert.ok(Number.isInteger(calcul.reponse), `${cle} : réponse entière (${calcul.texte})`);
          assert.ok(CORE.decimalesDe(calcul.reponse) <= 3, `${cle} : au plus 3 décimales (${calcul.texte})`);
          assert.match(calcul.cle, new RegExp(`^${cle}(-(\\d+(d\\d)?|x|q))+$`), "clé stable, sans texte libre");
          assert.equal((calcul.texte.match(/□/g) || []).length, 1, "une seule case par calcul");
          if (textes.has(calcul.cle)) assert.equal(textes.get(calcul.cle), calcul.texte, "une clé = un seul calcul");
          textes.set(calcul.cle, calcul.texte);
        });
        if (index < 5) {
          const graine = index * 7919 + 13;
          assert.deepEqual(CORE.genererSerie(cle, {graine, genre, ...(genre === "entraine" ? {total: 10, ordonne: false} : {})}), serie, "même graine, même série");
        }
      });
    });
    assert.ok(textes.size > 30 || cle === "A2-2", `${cle} : des tirages variés`);
  });
  assert.notDeepEqual(CORE.genererSerie("A5-2", {graine: 1}), CORE.genererSerie("A5-2", {graine: 2}));
  assert.equal(CORE.genererUn("A5-3", 4).module, "A5");
});

test("les imposés sont dans chaque validation, à une place qui change", () => {
  NIVEAUX_CONSTRUITS.forEach(({niveau, cle}) => {
    assert.ok(niveau.imposes.length >= 1, `${cle} a des imposés`);
    const places = new Set();
    series(cle, "valide").forEach(serie => {
      niveau.imposes.forEach(impose => {
        const place = serie.findIndex(c => c.cle === impose.cle);
        assert.ok(place >= 0, `${cle} : ${impose.texte} présent à chaque validation`);
        places.add(place);
      });
    });
    assert.ok(places.size >= 6, `${cle} : les imposés sont placés au hasard`);
  });
  const textes = cle => CORE.niveauDe(cle).niveau.imposes.map(c => c.texte.replace(/\u202f/g, " "));
  assert.deepEqual(textes("A2-1"), ["433 + □ = 440"]);
  assert.deepEqual(textes("A2-2"), ["75 + □ = 100", "100 − 35 = □"]);
  assert.deepEqual(textes("A2-3"), ["61 + □ = 100", "29 + □ = 100", "13 + □ = 100"]);
  assert.deepEqual(textes("A2-4"), ["650 + □ = 1 000", "230 + □ = 300"]);
  assert.deepEqual(textes("A5-1"), ["31 + 9 = □", "94 + 9 = □"]);
  assert.deepEqual(textes("A5-2"), ["31 + 19 = □", "285 + 19 = □"]);
  assert.deepEqual(textes("A5-3"), ["53 + 38 = □", "147 + 18 = □"]);
  assert.deepEqual(textes("A5-4"), ["152 + 98 = □", "126 + 99 = □"]);
  assert.deepEqual(textes("M2-1"), ["38 × 10 = □", "100 × 9 = □"]);
  assert.deepEqual(textes("M2-2"), ["30 × 100 = □", "35 × □ = 3 500", "480 ÷ 10 = □"]);
  assert.deepEqual(textes("D2-1"), ["0,6 × 10 = □", "2,5 × 10 = □"]);
  assert.deepEqual(textes("D2-2"), ["7,54 × 100 = □", "4,107 × 1 000 = □"]);
  assert.deepEqual(textes("D2-3"), ["3,6 × 100 = □", "72,4 × 100 = □", "0,2 × 100 = □"]);
  assert.deepEqual(textes("D2-4"), ["3,6 × □ = 360", "□ × 100 = 45", "1 200 = 1,2 × □"]);
});

// ± 2 sur la proportion annoncée, comme le dit la fiche (§ 9).
const environ = (obtenu, annonce, ou) => assert.ok(Math.abs(obtenu - annonce) <= 2, `${ou} : ${obtenu} au lieu de ${annonce}`);
const chiffresEntiers = n => String(Math.trunc(n)).length;

test("M2 : produits, nombres en 0, trous, divisions", () => {
  ["valide", "entraine"].forEach(genre => series("M2-1", genre).forEach(serie => {
    // 3 nombres à un chiffre, 4 à deux, 3 à trois ; 7 « n × p », 3 « p × n ».
    assert.deepEqual([1, 2, 3].map(k => compter(serie, c => chiffresEntiers(c.donnees.n) === k)), [3, 4, 3]);
    assert.equal(compter(serie, c => c.forme === "produit-gauche"), 3);
    assert.equal(compter(serie, c => c.forme === "produit"), 7);
    serie.forEach(c => {
      const {n, p} = c.donnees;
      assert.ok([10, 100, 1000].includes(p));
      assert.ok(n >= 2 && n <= 999 && n % 10 !== 0, `${n} : de 2 à 999, chiffre des unités non nul`);
      assert.ok(c.reponse < 1000000, "résultat sous 1 000 000");
    });
  }));
  // Les trois puissances sont tirées, à peu près autant chacune.
  const puissances = series("M2-1", "entraine").flat().map(c => c.donnees.p);
  [10, 100, 1000].forEach(p => assert.ok(compter(puissances, q => q === p) > puissances.length / 4, `× ${p}`));
  ["valide", "entraine"].forEach(genre => series("M2-2", genre).forEach(serie => {
    const formes = forme => compter(serie, c => c.forme === forme);
    assert.deepEqual([formes("produit"), formes("trou-facteur"), formes("trou-nombre"), formes("division")], [3, 2, 2, 3]);
    serie.forEach(c => {
      const {n, p, m} = c.donnees;
      assert.ok([10, 100, 1000].includes(p));
      assert.equal(m, n * p);
      if (c.forme === "produit") assert.ok(n % 10 === 0 && n >= 10 && n <= 990, `${n} : un nombre en 0`);
      else assert.ok(n >= 2 && n <= 999 && n % 10 !== 0, `${n} : de 2 à 999`);
      if (c.forme === "trou-facteur") assert.equal(c.reponse, p, "n × □ = m : la réponse est 10, 100 ou 1 000");
      if (c.forme === "trou-nombre" || c.forme === "division") assert.equal(c.reponse, n);
      assert.ok(m < 1000000);
    });
  }));
});

test("D2 : décimales, nombres sous 1, puissances, résultats exacts sous 10 000", () => {
  const decimales = c => CORE.decimalesDe(c.donnees.n);
  const tous = cle => ["valide", "entraine"].flatMap(genre => series(cle, genre));
  tous("D2-1").forEach(serie => {
    assert.deepEqual([1, 2, 3].map(d => compter(serie, c => decimales(c) === d)), [4, 3, 3], "4 à 1 décimale, 3 à 2, 3 à 3");
    assert.equal(compter(serie, c => c.donnees.n < 1), 2, "2 nombres sous 1 (0,6)");
    assert.equal(compter(serie, c => c.forme === "produit-gauche"), 2, "« 10 × n » sur 2 calculs");
    serie.forEach(c => assert.ok(c.donnees.p === 10 && c.donnees.n < 1000));
  });
  tous("D2-2").forEach(serie => {
    environ(compter(serie, c => c.donnees.p === 1000), 4, "D2-2 : × 1 000");
    serie.forEach(c => {
      const {n, p} = c.donnees;
      assert.equal(c.forme, "produit");
      if (p === 100) assert.ok(n < 100 && [2, 3].includes(decimales(c)), `${n} × 100 : 2 ou 3 décimales, sous 100`);
      else assert.ok(p === 1000 && n < 10 && decimales(c) === 3, `${n} × 1 000 : 3 décimales, sous 10`);
      assert.ok(Math.log10(p) <= decimales(c), "sans zéro à écrire");
    });
  });
  tous("D2-3").forEach(serie => {
    assert.equal(compter(serie, c => c.donnees.n < 1), 2, "2 nombres sous 1 (0,2 × 100)");
    serie.forEach(c => {
      const {n, p} = c.donnees;
      if (p === 100) assert.ok(n < 100 && decimales(c) === 1, `${n} × 100 : 1 décimale`);
      else assert.ok(p === 1000 && n < 10 && [1, 2].includes(decimales(c)), `${n} × 1 000 : 1 ou 2 décimales`);
      assert.ok(Math.log10(p) > decimales(c), "des zéros à écrire");
    });
  });
  tous("D2-4").forEach(serie => {
    const sur = formes => compter(serie, c => formes.includes(c.forme));
    assert.equal(sur(["trou-facteur", "trou-egal"]), 4, "4 trous sur la puissance");
    assert.equal(sur(["trou-nombre", "trou-nombre-gauche"]), 6, "6 trous sur le nombre");
    serie.forEach(c => {
      if (c.forme === "trou-facteur" || c.forme === "trou-egal") assert.ok([10, 100, 1000].includes(c.reponse));
      else assert.equal(c.reponse, c.donnees.n, "la réponse est le nombre décimal");
    });
  });
  ["D2-1", "D2-2", "D2-3", "D2-4"].forEach(cle => tous(cle).flat().forEach(c => {
    const {n, p, m} = c.donnees;
    assert.ok(m < 10000, `${c.texte} : résultat sous 10 000`);
    assert.ok([1, 2, 3].includes(CORE.decimalesDe(n)), `${c.texte} : 1, 2 ou 3 décimales`);
    assert.equal(m, versNombre(millioniemes(CORE.formaterNombre(n)) * BigInt(p)), `${c.texte} : résultat exact`);
  }));
});

test("A2 : les nombres et les formes de chaque niveau", () => {
  const formes = serie => ({
    c: compter(serie, c => c.forme === "complement"),
    g: compter(serie, c => c.forme === "complement-gauche"),
    d: compter(serie, c => c.forme === "difference")
  });
  // Niveau 1 (carte v2) : plus de compléments à 10 (ils sont dans A1) ; la
  // dizaine suivante, moitié à deux chiffres, moitié à trois.
  ["valide", "entraine"].forEach(genre => series("A2-1", genre).forEach(serie => {
    assert.equal(compter(serie, c => c.donnees.cible === 10), 0, "aucun complément à 10");
    assert.equal(compter(serie, c => c.donnees.a < 100), serie.length / 2);
    assert.equal(compter(serie, c => c.donnees.a > 100), serie.length / 2);
    serie.forEach(c => {
      const {a, cible} = c.donnees;
      assert.equal(c.forme, "complement");
      assert.ok(a >= 11 && a <= 999 && a % 10 !== 0, `${a} : chiffre des unités non nul`);
      assert.equal(cible, Math.floor(a / 10) * 10 + 10, "la cible est la dizaine suivante");
    });
  }));
  // Niveau 2 : les 9 dizaines entières et les 10 nombres en 5 ; 8 compléments, 4 différences.
  const permis2 = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);
  series("A2-2", "valide").forEach(serie => {
    assert.deepEqual(formes(serie), {c: 8, g: 0, d: 4});
    assert.equal(new Set(serie.map(c => c.donnees.a)).size, 12, "aucun nombre deux fois");
    serie.forEach(c => assert.ok(permis2.has(c.donnees.a) && c.donnees.cible === 100));
  });
  series("A2-2", "entraine").forEach(serie => assert.deepEqual(formes(serie), {c: 7, g: 0, d: 3}));
  // Niveau 3 : ni dizaine entière ni multiple de 5 ; 5, 2, 3.
  ["valide", "entraine"].forEach(genre => series("A2-3", genre).forEach(serie => {
    assert.deepEqual(formes(serie), {c: 5, g: 2, d: 3});
    assert.equal(new Set(serie.map(c => c.donnees.a)).size, 10);
    serie.forEach(c => assert.ok(c.donnees.a >= 1 && c.donnees.a <= 99 && c.donnees.a % 5 !== 0 && c.donnees.cible === 100));
  }));
  // Niveau 4 : 7 vers 1 000 (2 centaines, 2 cinquantaines, 3 dizaines ; 4, 1, 2), 3 vers la centaine suivante.
  ["valide", "entraine"].forEach(genre => series("A2-4", genre).forEach(serie => {
    const mille = serie.filter(c => c.donnees.cible === 1000 && !c.donnees.suivante);
    const suivantes = serie.filter(c => c.donnees.suivante);
    assert.equal(mille.length, 7);
    assert.equal(suivantes.length, 3);
    assert.deepEqual(formes(mille), {c: 4, g: 1, d: 2});
    assert.equal(compter(mille, c => c.donnees.a % 100 === 0), 2, "2 centaines");
    assert.equal(compter(mille, c => c.donnees.a % 100 === 50), 2, "2 cinquantaines");
    assert.equal(compter(mille, c => c.donnees.a % 50 !== 0), 3, "3 dizaines");
    mille.forEach(c => assert.ok(c.donnees.a >= 10 && c.donnees.a <= 990 && c.donnees.a % 10 === 0));
    suivantes.forEach(c => {
      const {a, cible} = c.donnees;
      assert.equal(c.forme, "complement");
      assert.ok(a >= 110 && a <= 990 && a % 10 === 0 && a % 100 !== 0, `${a} : dizaine entière, pas une centaine`);
      assert.equal(cible, Math.floor(a / 100) * 100 + 100);
    });
  }));
});

test("A5 : bornes, terme ajouté, passages de centaine", () => {
  const ajouts = {1: [9], 2: [19, 29, 39], 3: [8, 18, 28, 38], 4: [48, 49, 58, 59, 68, 69, 78, 79, 88, 89, 98, 99]};
  [1, 2, 3, 4].forEach(n => {
    const vus = new Set();
    ["valide", "entraine"].forEach(genre => series(`A5-${n}`, genre).forEach(serie => {
      serie.forEach(c => {
        const {n: depart, a} = c.donnees;
        assert.equal(c.forme, "somme", "le terme ajouté toujours à droite");
        assert.ok(ajouts[n].includes(a), `A5-${n} : + ${a}`);
        assert.ok(depart >= 11 && depart <= 899 && depart % 10 !== 0, `${depart} : de 11 à 899, chiffre des unités non nul`);
        assert.ok(c.reponse <= 998, "résultat au plus 998");
        vus.add(a);
      });
      if (n === 1) {
        const passages = compter(serie, c => Math.floor(c.donnees.n / 10) % 10 === 9);
        assert.ok(passages >= 2, "au moins 2 passages de centaine sur 10");
      }
    }));
    assert.equal(vus.size, ajouts[n].length, `A5-${n} : tous les termes sont tirés`);
  });
});

function calculDe(cle, critere) {
  for (let graine = 1; graine < 400; graine += 1) {
    const trouve = [...CORE.genererSerie(cle, {graine, genre: "valide"}), ...CORE.genererSerie(cle, {graine})].find(critere);
    if (trouve) return trouve;
  }
  throw new Error(`aucun calcul ${cle} ne convient`);
}
const impose = (cle, texte) => CORE.niveauDe(cle).niveau.imposes.find(c => c.texte.replace(/\u202f/g, " ") === texte);
const somme = (n, a) => ({module: "A5", niveau: 0, texte: `${n} + ${a} = □`, reponse: n + a, forme: "somme", donnees: {n, a}});
const complement = (a, cible, suivante = false) => ({module: "A2", niveau: 0, texte: `${a} + □ = ${cible}`, reponse: cible - a, forme: "complement", donnees: suivante ? {a, cible, suivante} : {a, cible}});

test("A5 : les erreurs connues de la fiche sont reconnues, avec leur phrase", () => {
  const cas = [
    [somme(47, 19), 67, 1, "67, c’est 47 + 20. Il reste à enlever 1."],
    [somme(47, 19), 68, 2, "68, c’est 47 + 20 + 1. Après + 20, il faut enlever 1, pas l’ajouter."],
    [somme(47, 19), 56, 3, "56, c’est 47 + 9. + 19, c’est + 20 puis − 1."],
    [somme(53, 38), 92, 4, "92, c’est 53 + 40 − 1. Pour + 38, c’est + 40 puis − 2."],
    [somme(53, 38), 93, 1, "93, c’est 53 + 40. Il reste à enlever 2."],
    [somme(126, 99), 227, 2, "227, c’est 126 + 100 + 1. Après + 100, il faut enlever 1, pas l’ajouter."],
    [impose("A5-4", "152 + 98 = □"), 252, 1, "252, c’est 152 + 100. Il reste à enlever 2."]
  ];
  cas.forEach(([calcul, reponse, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse);
    assert.ok(diagnostic, `${calcul.texte} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.texte} → ${reponse} : cause ${cause}`);
    assert.equal(diagnostic.texte, phrase);
    assert.equal(diagnostic.image.outil, "droite-sauts");
  });
  // + 9 seul : « dizaines oubliées » n'a pas de sens (il n'y a pas de dizaine).
  assert.equal(CORE.diagnostiquer(somme(47, 9), 56), null);
  assert.equal(CORE.diagnostiquer(somme(47, 19), 66), null, "la bonne réponse n'est pas une erreur");
  assert.equal(CORE.diagnostiquer(somme(47, 19), 70), null, "une erreur inconnue reçoit le retour ordinaire");
  // Le pas oublié est en gras : le retour (2e saut), ou le grand saut pour « dizaines oubliées ».
  assert.equal(CORE.diagnostiquer(somme(47, 19), 67).image.gras, 2);
  assert.equal(CORE.diagnostiquer(somme(47, 19), 56).image.gras, 1);
});

test("A2 : les erreurs connues de la fiche sont reconnues, dans l'ordre 3, 1, 4, 2", () => {
  const cas = [
    [complement(37, 100), 73, 1, "37 + 73 = 110, c’est trop. Va d’abord à 40, puis à 100."],
    [complement(37, 100), 53, 2, "37 + 53 = 90. Il manque 10 : de 40 à 100, c’est + 60."],
    [complement(433, 440, true), 440, 3, "Tu as écrit l’arrivée. Combien faut-il ajouter à 433 pour arriver à 440 ?"],
    [complement(37, 100), 3, 4, "37 + 3 = 40, tu n’es pas encore à 100. Continue : de 40 à 100."],
    [complement(650, 1000), 450, 1, "650 + 450 = 1 100, c’est trop. Va d’abord à 700, puis à 1 000."],
    [complement(650, 1000), 50, 4, "650 + 50 = 700, tu n’es pas encore à 1 000. Continue : de 700 à 1 000."],
    [complement(650, 1000), 250, 2, "650 + 250 = 900. Il manque 100 : de 700 à 1 000, c’est + 300."],
    [complement(37, 100), 100, 3, "Tu as écrit l’arrivée. Combien faut-il ajouter à 37 pour arriver à 100 ?"]
  ];
  cas.forEach(([calcul, reponse, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse);
    assert.ok(diagnostic, `${calcul.texte} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.texte} → ${reponse} : cause ${cause}`);
    assert.equal(diagnostic.texte, phrase);
  });
  // De 81 à 89, « arrêt au premier saut » et « une dizaine perdue » donnent
  // la même réponse : c'est la cause 4 qui parle.
  for (let a = 81; a <= 89; a += 1) assert.equal(CORE.diagnostiquer(complement(a, 100), 90 - a).c, 4, `${a} + ? = 100 → ${90 - a}`);
  // De 91 à 99 la dizaine suivante EST la cible : pas d'« arrêt au premier saut ».
  assert.equal(CORE.diagnostiquer(complement(93, 100), 7), null);
  // Vers 10 ou vers la dizaine suivante, seule « l'arrivée donnée » existe.
  assert.equal(CORE.diagnostiquer(complement(7, 10), 10).c, 3);
  assert.equal(CORE.diagnostiquer(complement(7, 10), 13), null);
  assert.equal(CORE.diagnostiquer(complement(433, 440, true), 17), null);
});

test("aucune cause ne tombe sur la bonne réponse, et l'ordre de la fiche tranche les coïncidences", () => {
  const coincidences = new Set();
  const examiner = calcul => {
    const fiche = CORE.moduleDe(calcul.module);
    assert.equal(CORE.diagnostiquer(calcul, calcul.reponse), null, `${calcul.texte} : la bonne réponse`);
    fiche.erreurs.forEach(erreur => assert.equal(erreur.test(calcul, calcul.reponse), false, `${calcul.texte} : cause ${erreur.c}`));
    for (let reponse = 0; reponse <= calcul.reponse + 260; reponse += 1) {
      const causes = fiche.erreurs.filter(erreur => erreur.test(calcul, reponse)).map(erreur => erreur.c);
      if (causes.length > 1) {
        coincidences.add(`${calcul.module}:${causes.join("+")}`);
        assert.equal(CORE.diagnostiquer(calcul, reponse).c, causes[0], "la première cause de la fiche parle");
      }
    }
  };
  for (let a = 1; a <= 99; a += 1) examiner(complement(a, 100));
  for (let a = 10; a <= 990; a += 10) examiner(complement(a, 1000));
  for (let a = 1; a <= 9; a += 1) examiner(complement(a, 10));
  NIVEAUX_CONSTRUITS.filter(({fiche}) => fiche.id === "A5").forEach(({cle}) => {
    for (let graine = 1; graine <= 40; graine += 1) CORE.genererSerie(cle, {graine}).forEach(examiner);
  });
  // M2 et D2 : les réponses fausses vraisemblables (un rang de plus ou de
  // moins, le nombre recopié, la division au lieu du produit…).
  const vraisemblables = calcul => {
    const {n, p, m} = calcul.donnees;
    const liste = new Set();
    for (let rang = -4; rang <= 4; rang += 1) [calcul.reponse, n, m].forEach(x => liste.add(CORE.exact(x * 10 ** rang)));
    [n / p, m * p, Math.trunc(n) * p + (n - Math.trunc(n)), p, m, n].forEach(x => liste.add(CORE.exact(x)));
    return [...liste];
  };
  NIVEAUX_CONSTRUITS.filter(({fiche}) => fiche.id === "M2" || fiche.id === "D2").forEach(({cle}) => {
    for (let graine = 1; graine <= 120; graine += 1) ["valide", "entraine"].forEach(genre => CORE.genererSerie(cle, {graine, genre}).forEach(calcul => {
      const fiche = CORE.moduleDe(calcul.module);
      fiche.erreurs.forEach(erreur => assert.equal(erreur.test(calcul, calcul.reponse), false, `${calcul.texte} : cause ${erreur.c} sur la bonne réponse`));
      vraisemblables(calcul).forEach(reponse => {
        const causes = fiche.erreurs.filter(erreur => erreur.test(calcul, reponse)).map(erreur => erreur.c);
        if (causes.length < 2) return;
        coincidences.add(`${calcul.module}:${causes.join("+")}`);
        assert.equal(CORE.diagnostiquer(calcul, reponse).c, causes[0], "la première cause de la fiche parle");
      });
    }));
  });
  // De 81 à 89 (A2) ; × 10 dans D2 : « le nombre n'a pas changé » est aussi
  // « un rang de moins » — c'est la cause 1, la première de la fiche, qui parle.
  assert.deepEqual([...coincidences].sort(), ["A2:4+2", "D2:1+2"], "les deux seules coïncidences connues");
});

const produit = (module, n, p, gauche = false) => ({module, niveau: 0, forme: gauche ? "produit-gauche" : "produit", texte: "", reponse: CORE.exact(n * p), donnees: {n, p, m: CORE.exact(n * p)}});
const trou = (module, forme, n, p) => ({module, niveau: 0, forme, texte: "", reponse: forme === "trou-facteur" || forme === "trou-egal" ? p : n, donnees: {n, p, m: CORE.exact(n * p)}});
const avecEspaces = texte => texte.replace(/[\u202f\u00a0]/g, " ");

test("M2 : les erreurs connues de la fiche sont reconnues, avec leur phrase", () => {
  const cas = [
    [produit("M2", 38, 10), 3800, 1, "3 800, c’est 38 × 100. Pour × 10, chaque chiffre vaut 10 fois plus : 38 → 380."],
    // × 10 rendu tel quel : « tu n'as pas multiplié » (plus de « 38, c'est 38 × 1 »).
    [produit("M2", 38, 10), 38, 2, "38 = 38 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 38 → 380."],
    [produit("M2", 405, 10, true), 405, 2, "405 = 405 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 405 → 4 050."],
    [produit("M2", 27, 100), 270, 2, "270, c’est 27 × 10. Pour × 100, chaque chiffre vaut 100 fois plus : 27 → 2 700."],
    [produit("M2", 30, 100), 300, 2, "300, c’est 30 × 10. Pour × 100, chaque chiffre vaut 100 fois plus : 30 → 3 000."],
    [produit("M2", 9, 100, true), 9000, 1, "9 000, c’est 9 × 1 000. Pour × 100, chaque chiffre vaut 100 fois plus : 9 → 900."],
    [trou("M2", "trou-facteur", 35, 100), 3500, 3, "3 500, c’est l’arrivée. Par combien faut-il multiplier 35 pour obtenir 3 500 ?"],
    [trou("M2", "division", 48, 10), 4800, 4, "4 800, c’est 480 × 10. Ici on cherche un nombre 10 fois plus petit que 480."],
    [trou("M2", "trou-nombre", 27, 100), 270000, 4, "270 000, c’est 2 700 × 100. Ici on cherche un nombre 100 fois plus petit que 2 700."]
  ];
  cas.forEach(([calcul, reponse, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse);
    assert.ok(diagnostic, `${calcul.forme} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.forme} → ${reponse} : cause ${cause}`);
    assert.equal(avecEspaces(diagnostic.texte), phrase);
    assert.equal(diagnostic.image.outil, "tableau-fleches");
  });
  // Ce qui n'est pas dans la fiche reçoit le retour ordinaire.
  assert.equal(CORE.diagnostiquer(trou("M2", "division", 48, 10), 480), null, "480 ÷ 10 → 480");
  assert.equal(CORE.diagnostiquer(trou("M2", "trou-facteur", 35, 100), 10), null, "35 × □ = 3 500 → 10");
  assert.equal(CORE.diagnostiquer(produit("M2", 27, 100), 2700), null, "la bonne réponse");
  // L'image : la division va vers la droite, la réponse est en bas.
  assert.deepEqual(CORE.diagnostiquer(trou("M2", "division", 48, 10), 4800).image, {outil: "tableau-fleches", depart: 480, arrivee: 48, p: 10, operation: "÷", virgule: false});
});

test("D2 : les erreurs connues de la fiche, dans l'ordre 1, 3, 2, 4, 5", () => {
  const cas = [
    [produit("D2", 2.5, 10), 2.5, "2,50", 1, "2,50 = 2,5 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 2,5 → 25."],
    [produit("D2", 3.6, 100), 3.6, "3,600", 1, "3,600 = 3,6 : tu n’as pas multiplié. Chaque chiffre doit valoir 100 fois plus : 3,6 → 360."],
    [produit("D2", 0.6, 10), 0.6, "0.60", 1, "0,60 = 0,6 : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : 0,6 → 6."],
    [produit("D2", 3.6, 100), 36, "", 2, "36, c’est 3,6 × 10. Pour × 100, chaque chiffre glisse de 2 colonnes : 3,6 → 360."],
    [produit("D2", 2.5, 10), 20.5, "", 3, "Dans 20,5, le 0,5 n’a pas bougé. Lui aussi vaut 10 fois plus."],
    [produit("D2", 3.6, 100), 0.036, "", 4, "0,036, c’est 100 fois plus petit. Ici il faut 100 fois plus grand."],
    [trou("D2", "trou-nombre", 0.45, 100), 4500, "", 4, "4 500, c’est 45 × 100. Ici on cherche un nombre 100 fois plus petit que 45."],
    [produit("D2", 2.5, 10), 250, "", 5, "250, c’est 2,5 × 100. Pour × 10, c’est 1 colonne, pas 2."],
    [produit("D2", 7.54, 100), 7540, "", 5, "7 540, c’est 7,54 × 1 000. Pour × 100, c’est 2 colonnes, pas 3."]
  ];
  cas.forEach(([calcul, reponse, ecrit, cause, phrase]) => {
    const diagnostic = CORE.diagnostiquer(calcul, reponse, ecrit);
    assert.ok(diagnostic, `${calcul.donnees.n} → ${reponse}`);
    assert.equal(diagnostic.c, cause, `${calcul.donnees.n} × ${calcul.donnees.p} → ${reponse} : cause ${cause}`);
    assert.equal(avecEspaces(diagnostic.texte), phrase);
    assert.equal(diagnostic.image.outil, "tableau-fleches");
    assert.equal(diagnostic.image.virgule, true, "la virgule est dans le tableau");
  });
  // Sur un trou de la puissance, aucune cause : le retour ordinaire.
  assert.equal(CORE.diagnostiquer(trou("D2", "trou-facteur", 3.6, 100), 10), null);
  assert.equal(CORE.diagnostiquer(trou("D2", "trou-egal", 1.2, 1000), 100), null);
  // « Seule la partie entière » n'existe pas sous 1 (0,6 × 10 → 0,6 est la cause 1).
  assert.equal(CORE.diagnostiquer(produit("D2", 0.6, 10), 0.6).c, 1);
});

test("lire une réponse décimale, écrire un décimal, ses clés", () => {
  assert.equal(CORE.lireReponse("0,5"), 0.5);
  assert.equal(CORE.lireReponse(",5"), 0.5, "« ,5 » se lit 0,5");
  assert.equal(CORE.lireReponse("2,50"), 2.5, "les zéros inutiles ne changent rien");
  assert.equal(CORE.lireReponse("360,0"), 360);
  assert.equal(CORE.lireReponse("0,036"), 0.036);
  assert.equal(CORE.lireReponse("1,2,3"), null, "deux virgules");
  assert.equal(CORE.lireReponse(",,"), null);
  assert.equal(CORE.memeNombre(CORE.lireReponse("108,2"), CORE.exact(1.082 * 100)), true);
  assert.equal(CORE.formaterNombre(1.082 * 100), "108,2", "pas de 108,20000000000002");
  assert.equal(CORE.formaterNombre(0.004107), "0,004107", "jusqu'aux millionièmes");
  assert.equal(avecEspaces(CORE.formaterNombre(4107)), "4 107");
  assert.equal(avecEspaces(CORE.formaterNombre(4078.74)), "4 078,74");
  assert.equal(CORE.decimalesDe(4.107), 3);
  assert.equal(CORE.decimalesDe(360), 0);
  assert.equal(CORE.cleNombre(0.45), "45d2");
  assert.equal(CORE.cleNombre(4.107), "4107d3");
  const cleDe = (cle, texte) => CORE.niveauDe(cle).niveau.imposes.find(c => avecEspaces(c.texte) === texte).cle;
  assert.equal(cleDe("D2-3", "3,6 × 100 = □"), "D2-3-36d1-100", "la clé de la fiche");
  assert.equal(cleDe("D2-4", "□ × 100 = 45"), "D2-4-x-100-45");
  assert.equal(cleDe("D2-4", "1 200 = 1,2 × □"), "D2-4-1200-12d1");
  assert.equal(cleDe("M2-2", "480 ÷ 10 = □"), "M2-2-480-q-10", "« q » : le signe ÷, sans lequel 30 × 10 et 30 ÷ 10 se confondraient");
  assert.equal(cleDe("M2-2", "35 × □ = 3 500"), "M2-2-35-x-3500");
  assert.equal(cleDe("M2-1", "100 × 9 = □"), "M2-1-100-9");
});

function textesDeLaFiche(fiche) {
  const textes = [fiche.nom, fiche.exemple];
  fiche.niveaux.forEach(niveau => {
    textes.push(niveau.titre || "");
    (niveau.imposes || []).forEach(c => textes.push(c.texte));
    const a = niveau.apprends;
    if (!a) return;
    textes.push(a.exemple.texte, a.represente.consigne, a.represente.texte, a.bilan, ...a.ecris.etapes.map(e => e.texte),
      a.represente.solution.phrase, a.ecris.solution.phrase);
    if (a.manipule) textes.push(a.manipule.consigne, ...a.manipule.traces.flatMap(t => [t.attente, t.texte]));
  });
  return textes;
}

test("aucun nombre à sous-entendu dans un exemple mis en avant, aucune formule interdite", async () => {
  CORE.MODULES.forEach(fiche => textesDeLaFiche(fiche).forEach(texte => {
    assert.doesNotMatch(texte, /69/, `${fiche.id} : « ${texte} »`);
    assert.doesNotMatch(texte, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, `${fiche.id} : « ${texte} »`);
  }));
  // Les phrases de l'entraînement (l'outil à manipuler, l'annonce d'une
  // écriture nouvelle) : des calculs tirés, donc sans le filtre du 69.
  NIVEAUX_CONSTRUITS.forEach(({cle}) => CORE.genererSerie(cle, {graine: 5}).forEach(c => {
    const m = CORE.manipulationDe(c);
    [...(m ? [m.consigne, m.refus || "", ...m.traces.flatMap(t => [t.attente, t.texte])] : []), CORE.annonceDe(c)].forEach(texte =>
      assert.doesNotMatch(texte, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, `${cle} : « ${texte} »`));
  }));
  // Les tirages au hasard, eux, ne sont pas filtrés : + 69 fait partie du niveau 4 d'A5.
  assert.ok(series("A5-4", "entraine").some(serie => serie.some(c => c.donnees.a === 69)));
  for (const fichier of ["defi_calcul_modules.html", "defi_calcul_core.js", "defi_calcul_aides.js"]) {
    const source = await readFile(new URL(`../outils/calcul_mental/${fichier}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, fichier);
  }
});

test("les consignes : l'impératif devant « en », pas de signe seul en début de ligne", async () => {
  const verifier = (texte, ou) => {
    assert.doesNotMatch(texte, /[^s]-en\b/, `${ou} : « ${texte} » (retires-en, pousses-en)`);
    assert.doesNotMatch(texte, / [:?!]/, `${ou} : « ${texte} » (espace insécable devant : ? !)`);
  };
  CORE.MODULES.filter(fiche => fiche.construit).forEach(fiche => fiche.niveaux.forEach(niveau => {
    const a = niveau.apprends;
    const textes = [niveau.titre || "", niveau.nom || "", a.bilan, a.represente.consigne, ...(a.manipule ? [a.manipule.consigne, a.manipule.refus || ""] : [])];
    textes.forEach(texte => verifier(texte, fiche.id));
  }));
  // Les noms des 71 modules (les réservés aussi : « Distributivité : … »),
  // les refus du rekenrek, et les phrases des erreurs connues.
  CORE.MODULES.forEach(fiche => verifier(fiche.nom, fiche.id));
  Object.values(AIDES.MESSAGES_REFUS).forEach(texte => verifier(texte, "rekenrek"));
  NIVEAUX_CONSTRUITS.forEach(({cle}) => CORE.genererSerie(cle, {graine: 3}).forEach(calcul => {
    CORE.moduleDe(calcul.module).erreurs.forEach(erreur => {
      if (calcul.donnees.n !== undefined || calcul.donnees.a !== undefined) {
        try { verifier(erreur.retour(calcul, calcul.reponse + 1, ""), `${cle} cause ${erreur.c}`); } catch (e) { if (e.code === "ERR_ASSERTION") throw e; }
      }
    });
  }));
  // Les textes de la page qui se lisent : « C'est toujours toi ? ».
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /C’est toujours toi&nbsp;\?/);
  assert.match(page, /`C’est toujours toi, \$\{qui\}\\u00a0\?` : "C’est toujours toi\\u00a0\?"/, "la garde, avec ou sans prénom");
  const visibles = page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "\n");
  visibles.split("\n").filter(ligne => ligne.trim()).forEach(ligne => verifier(ligne, "la page"));
  assert.match(CORE.niveauDe("A5-1").niveau.apprends.manipule.consigne, /puis retires-en 1\.$/);
});

test("le nom court d'une compétence se lit seul ; le test en escalier tire 3 calculs par marche", () => {
  const noms = id => CORE.moduleDe(id).niveaux.map(n => avecEspaces(CORE.nomCompetence(id, n.n)));
  assert.deepEqual(noms("A2"), ["Compléments à la dizaine", "Compléments à 100 : dizaines", "Compléments à 100", "Compléments à 1 000"]);
  assert.deepEqual(noms("A5"), ["+ 9", "+ 19, 29, 39", "+ 8, 18, 28, 38", "+ 48, 49… 98, 99"], "sans nom court, le titre du niveau");
  assert.deepEqual(noms("M2"), ["× 10, × 100, × 1 000", "× 10, × 100 : trous, divisions"]);
  assert.deepEqual(noms("D2"), ["Décimal × 10", "Décimal × 100, × 1 000", "Décimal : zéros à écrire", "Décimal : trous"]);
  assert.equal(CORE.nomCompetence("A2", 9), "");
  // Chaque compétence construite a un nom différent : le bilan les nomme sans le module.
  const tous = NIVEAUX_CONSTRUITS.map(({fiche, niveau}) => CORE.nomCompetence(fiche.id, niveau.n));
  assert.equal(new Set(tous).size, tous.length);
  // Le test en escalier : une marche par niveau, dans l'ordre ; 3 calculs
  // par marche — le plus simple, le plus dur, celui du milieu — déterministe,
  // sans doublon, sans imposé.
  ["A2", "A5", "M2", "D2"].forEach(id => {
    const k = CORE.moduleDe(id).niveaux.length;
    for (let graine = 1; graine <= 40; graine += 1) {
      const marches = CORE.genererTest(id, {graine});
      assert.deepEqual(marches.map(m => m.niveau), Array.from({length: k}, (_, i) => i + 1), `${id} : une marche par niveau`);
      marches.forEach(marche => {
        assert.equal(marche.calculs.length, 3, `${id} marche ${marche.niveau} : 3 calculs`);
        assert.ok(marche.calculs.every(c => c.module === id && c.niveau === marche.niveau));
        const [simple, dur, milieu] = marche.calculs.map(CORE.difficulte);
        assert.ok(simple <= milieu && milieu <= dur, `${id}-${marche.niveau} graine ${graine} : simple ${simple}, milieu ${milieu}, dur ${dur}`);
      });
      const cles = marches.flatMap(m => m.calculs.map(c => c.cle));
      assert.equal(new Set(cles).size, cles.length, `${id} graine ${graine} : pas de doublon`);
      assert.deepEqual(CORE.genererTest(id, {graine}).flatMap(m => m.calculs.map(c => c.cle)), cles);
    }
  });
  assert.deepEqual(CORE.genererTest("A1", {graine: 1}), [], "un module pas construit n'a pas de test");
});

test("l'entraînement : 20 calculs du simple au difficile, les écritures nouvelles après les 6 premiers, jamais ceux de J'apprends", () => {
  NIVEAUX_CONSTRUITS.forEach(({niveau, cle}) => {
    for (let graine = 1; graine <= 30; graine += 1) {
      const serie = CORE.genererSerie(cle, {graine, exclure: niveau.apprends.textes});
      assert.ok(serie.length >= 16 && serie.length <= 20, `${cle} : ${serie.length} calculs`);
      assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle} : sans doublon`);
      serie.forEach(c => assert.ok(!niveau.apprends.textes.includes(c.texte), `${cle} : ${c.texte} est un calcul de J'apprends`));
      const formes = [...new Set(serie.map(c => c.forme))];
      const premiere = serie.slice(0, Math.min(6, serie.filter(c => c.forme === formes[0]).length));
      assert.ok(premiere.every(c => c.forme === formes[0]), `${cle} : la première écriture d'abord`);
      // Dans la première écriture, du plus simple au plus dur.
      const difficultes = premiere.map(CORE.difficulte);
      assert.deepEqual(difficultes, [...difficultes].sort((a, b) => a - b), `${cle} graine ${graine} : ${difficultes}`);
      // Chaque autre écriture arrive 2 fois juste après, puis le reste.
      let rang = premiere.length;
      formes.slice(1).forEach(forme => {
        const n = Math.min(2, serie.filter(c => c.forme === forme).length);
        assert.ok(serie.slice(rang, rang + n).every(c => c.forme === forme), `${cle} graine ${graine} : ${forme} attendue au rang ${rang}`);
        rang += n;
      });
      // Et chaque écriture du niveau a été vue dans les 12 premiers calculs.
      formes.forEach(forme => assert.ok(serie.slice(0, 12).some(c => c.forme === forme), `${cle} : ${forme} dans les 12 premiers`));
    }
  });
  // A2-3 : « a + ? », puis « ? + a » (la case est devant), puis « 100 − a ».
  const a23 = CORE.genererSerie("A2-3", {graine: 3}).map(c => c.forme);
  assert.deepEqual(a23.slice(0, 10), ["complement", "complement", "complement", "complement", "complement", "complement", "complement-gauche", "complement-gauche", "difference", "difference"]);
  assert.equal(CORE.annonceDe(CORE.genererSerie("A2-3", {graine: 3})[6]).replace(/\u00a0/g, " "), "Nouveau : la case est devant.");
  assert.equal(CORE.annonceDe(CORE.genererSerie("M2-2", {graine: 3}).find(c => c.forme === "division")).replace(/\u00a0/g, " "), "Nouveau : c’est une division.");
  // Mes calculs du jour tirent au hasard, pas le plus simple.
  const uns = Array.from({length: 40}, (_, g) => CORE.difficulte(CORE.genererUn("A2-3", g + 1)));
  assert.ok(new Set(uns).size > 5, "des difficultés variées");
  // Sans ordre : la série mélangée de la fiche.
  assert.notDeepEqual(CORE.genererSerie("A2-3", {graine: 3, ordonne: false}).map(c => c.cle), CORE.genererSerie("A2-3", {graine: 3}).map(c => c.cle));
});

test("l'outil de l'entraînement : l'image avec ses « ? », l'outil à manipuler, la correction qui montre la réponse", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, cle}) => {
    CORE.genererSerie(cle, {graine: 11}).forEach(c => {
      const aide = CORE.aideDe(c);
      assert.ok(aide, `${cle} : une aide pour ${c.texte}`);
      const reponse = CORE.formaterNombre(c.reponse);
      if (aide.outil === "droite-sauts") {
        // La droite dessinée : la réponse n'est écrite nulle part sur l'image.
        const svg = AIDES.droiteSauts(aide);
        const etiquettes = [...svg.matchAll(/>([^<]+)<\/text>/g)].map(m => m[1]);
        // A2 : les sauts disent « + ? » (les points, eux, sont donnés : 62, 70, 100) ;
        // A5 : les sauts sont donnés (+ 10, − 1), les arrivées sont « ? ».
        if (fiche.id === "A2") assert.ok(etiquettes.filter(e => e.startsWith("+")).every(e => e === "+ ?"), `${cle} : ${c.texte} — ${etiquettes.join(" ")}`);
        else assert.ok(!etiquettes.includes(reponse) && etiquettes.filter(e => e === "?").length === 2, `${cle} : ${c.texte} — ${etiquettes.join(" ")}`);
      } else {
        assert.equal(aide.outil, "tableau-fleches");
        const texte = AIDES.decrireTableau(aide);
        if (!aide.masque) assert.ok(!texte.includes(`, ${reponse}.`), `${cle} : le lecteur d'écran ne dit pas la réponse`);
      }
      // L'image de la correction, elle, montre la réponse.
      const image = CORE.imageDe(c);
      if (fiche.id === "A5" || fiche.id === "A2") {
        const valeurs = AIDES.planDroite(image).valeurs;
        assert.equal(valeurs[valeurs.length - 1], fiche.id === "A5" ? c.reponse : c.donnees.cible, `${cle} : ${c.texte} — la correction arrive au bout`);
        assert.ok(!image.inconnue && !image.inconnues, `${cle} : la correction ne cache rien`);
      } else assert.ok(!image.inconnue && !image.masque, `${cle} : la correction montre l'arrivée`);
      // L'outil à manipuler : les perles jusqu'à 100, le glisse-nombres toujours.
      const m = CORE.manipulationDe(c);
      if (fiche.id === "M2" || fiche.id === "D2") {
        assert.equal(m.outil, "glisse");
        const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(m.depart, m.colonnes), m.decalage, m.colonnes.indexOf(0));
        const arrivee = c.forme === "division" || c.forme === "trou-nombre" || c.forme === "trou-nombre-gauche" ? c.donnees.n : c.donnees.m;
        const attendu = AIDES.chiffresDansColonnes(arrivee, m.colonnes);
        // (un 0 du nombre de départ peut suivre la virgule : 490 ÷ 100 se lit 4,90.)
        apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i] || (chiffre === "0" && i > m.colonnes.indexOf(0)), `${cle} : ${c.texte} — la bande lit l'arrivée`));
      } else if (fiche.id === "A5" ? c.donnees.n + c.donnees.a <= 100 : c.donnees.cible <= 100) {
        assert.equal(m.outil, "perles", `${cle} : ${c.texte}`);
        const etats = AIDES.etatsDe(m.depart);
        m.gestes.forEach(geste => {
          const attendu = AIDES.gesteAttendu(etats, geste);
          assert.ok(attendu.rangees.length >= 1, `${cle} : ${c.texte} — le geste ${geste} a une rangée`);
          etats[attendu.rangees[0]] += attendu.ecart;
        });
        assert.equal(etats.reduce((s, v) => s + v, 0), fiche.id === "A5" ? c.reponse : c.donnees.cible, `${cle} : ${c.texte} — les perles arrivent au bon total`);
      } else {
        assert.equal(m, null, `${cle} : ${c.texte} — pas de perles au-delà de 100`);
      }
    });
  });
});

test("J'apprends : trois temps cohérents pour chaque niveau construit", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const a = niveau.apprends;
    assert.ok(a && a.bilan && a.bilan.endsWith("."), `${cle} : une phrase-bilan`);
    assert.equal((a.represente.texte.match(/□/g) || []).length, 1);
    // Scénario du 30/10 : trois calculs DIFFÉRENTS, et le dernier de « J'écris » donne la réponse.
    assert.equal(new Set(a.textes).size, a.manipule ? 3 : 2, `${cle} : trois calculs différents`);
    assert.notEqual(a.represente.texte, a.ecris.etapes[a.ecris.etapes.length - 1].texte, `${cle} : j'écris sur un autre calcul`);
    assert.equal(a.ecris.etapes[a.ecris.etapes.length - 1].reponse, a.ecris.reponse);
    a.ecris.etapes.forEach(etape => assert.ok(etape.texte.includes("□") && Number.isFinite(etape.reponse), `${cle} : chaque étape a sa case et sa réponse`));
    assert.ok(a.ecris.solution.phrase.endsWith(".") && a.represente.solution.phrase.endsWith("."), `${cle} : la phrase du 2e essai faux`);
    assert.ok(a.ecris.solution.image && a.represente.solution.image, `${cle} : la réponse sur l'outil au 2e essai faux`);
    if (fiche.id === "M2" || fiche.id === "D2") {
      // Le tableau à flèches : il arrive où l'exemple le dit, et cache ce
      // qu'on cherche.
      assert.equal(a.represente.outil, "tableau-fleches");
      const image = a.represente.image;
      const plan = AIDES.planTableau(image);
      assert.equal(a.represente.reponse, image.masque ? image.p : image.arrivee, `${cle} : la réponse est dans le tableau`);
      const svg = AIDES.tableauFleches(image);
      if (image.masque) assert.match(svg, />× \?</, `${cle} : « × ? »`);
      else assert.equal((svg.match(/>\?</g) || []).length, plan.zeros.length + plan.fleches.length, `${cle} : un « ? » par case d'arrivée, chiffres et zéros`);
      const reponseEcrite = CORE.formaterNombre(a.represente.reponse);
      assert.ok(!AIDES.decrireTableau(image).includes(image.masque ? `par ${reponseEcrite}` : `, ${reponseEcrite}.`), `${cle} : le lecteur d'écran ne dit pas la réponse`);
      assert.ok(AIDES.decrireTableau({...image, inconnue: false, masque: false}).includes(reponseEcrite), `${cle} : la réponse montrée, il la dit`);
      // Le glisse-nombres : le bon glissement montre l'arrivée, chiffre par
      // chiffre, et une case vide là où il y a un zéro à écrire.
      // Le glisse-nombres joue SON calcul (pas celui du tableau) : l'arrivée
      // est celle de sa trace, les zéros à écrire restent des cases vides.
      const g = a.manipule;
      assert.equal(g.outil, "glisse");
      assert.ok([1, 2, 3].includes(Math.abs(g.decalage)));
      const arriveeTrace = nombre(g.traces[0].texte.split("=").pop());
      const plusGrand = Math.max(g.depart, arriveeTrace);
      assert.equal(Math.round(Math.log10(plusGrand / Math.min(g.depart, arriveeTrace))), Math.abs(g.decalage), `${cle} : le glissement est celui de la trace`);
      assert.equal(Math.sign(arriveeTrace - g.depart), Math.sign(g.decalage), `${cle} : le sens du glissement`);
      const apres = AIDES.bandeApres(AIDES.chiffresDansColonnes(g.depart, g.colonnes), g.decalage, g.colonnes.indexOf(0));
      const attendu = AIDES.chiffresDansColonnes(arriveeTrace, g.colonnes);
      apres.forEach((chiffre, i) => assert.ok(chiffre === "" || chiffre === attendu[i], `${cle} : la bande lit l'arrivée (${apres.join("")} / ${attendu.join("")})`));
      assert.equal(AIDES.zerosDePosition(apres, g.colonnes.indexOf(0)).length, attendu.filter((chiffre, i) => chiffre === "0" && apres[i] === "").length, `${cle} : les zéros de position sont ceux qui manquent`);
      assert.equal(g.traces.length, 1);
      assert.ok(g.traces[0].attente.includes("…") && !g.traces[0].texte.includes("…"));
      assert.deepEqual([...g.colonnes], fiche.id === "M2" ? [5, 4, 3, 2, 1, 0] : [3, 2, 1, 0, -1, -2, -3], `${cle} : les colonnes de la fiche`);
      return;
    }
    assert.equal(a.represente.outil, "droite-sauts");
    // La droite arrive bien où l'exemple le dit.
    const plan = AIDES.planDroite(a.represente.image);
    const arrivee = plan.valeurs[plan.valeurs.length - 1];
    if (fiche.id === "A5") {
      assert.equal(arrivee, a.represente.reponse);
      assert.equal(a.represente.image.direct, a.represente.reponse - a.represente.image.depart, "le saut direct sous le détour");
      assert.deepEqual(a.represente.image.inconnues, [1, 2], "les deux arrivées sont à trouver");
    } else {
      assert.ok(a.represente.image.sauts.every(saut => saut.masque), `${cle} : les sauts disent « + ? »`);
      assert.equal(arrivee - a.represente.image.depart, a.represente.reponse, `${cle} : la somme des sauts est la réponse`);
    }
    if (!a.manipule) return;
    // Le rekenrek : les gestes sont faisables, un par un, et mènent au bon total.
    const etats = AIDES.etatsDe(a.manipule.depart);
    a.manipule.gestes.forEach(geste => {
      const attendu = AIDES.gesteAttendu(etats, geste);
      assert.ok(attendu.rangees.length >= 1, `${cle} : le geste ${geste} a une rangée`);
      assert.equal(AIDES.verifierGeste(etats, geste, attendu.rangees[0], attendu.ecart), null);
      etats[attendu.rangees[0]] += attendu.ecart;
      assert.ok(etats[attendu.rangees[0]] >= 0 && etats[attendu.rangees[0]] <= 10);
    });
    const total = etats.reduce((s, v) => s + v, 0);
    assert.ok(total <= 100, `${cle} : l'exemple tient sur le rekenrek de 100`);
    assert.equal(total, a.exemple.reponse + (fiche.id === "A5" ? 0 : a.manipule.depart));
    const traces = a.manipule.traces;
    assert.equal(traces[traces.length - 1].apres, a.manipule.gestes.length, `${cle} : la dernière trace s'écrit au dernier geste`);
    traces.forEach(trace => assert.ok(trace.attente.includes("…") && !trace.texte.includes("…")));
  });
  // A2 niveau 4 (compléments à 1 000) : pas de manipulation, on commence à « je représente ».
  assert.equal(CORE.niveauDe("A2-4").niveau.apprends.manipule, null);
  assert.deepEqual(CORE.niveauDe("A5-1").niveau.apprends.manipule.gestes, [10, -1]);
  assert.deepEqual(CORE.niveauDe("A5-3").niveau.apprends.manipule.gestes, [10, 10, 10, 10, -2]);
  assert.deepEqual(CORE.niveauDe("A2-3").niveau.apprends.manipule.gestes, [3, 10, 10, 10, 10, 10, 10]);
  assert.equal(CORE.niveauDe("A5-1").niveau.apprends.bilan, "+ 9, c’est + 10 puis − 1.");
  assert.equal(CORE.niveauDe("A5-2").niveau.apprends.bilan, "Pour ajouter 19, j’ajoute 20, puis je retranche 1.");
  // Sur le rekenrek d'A2, la consigne ne donne jamais le nombre cherché.
  [1, 2, 3].forEach(n => assert.doesNotMatch(CORE.niveauDe(`A2-${n}`).niveau.apprends.manipule.consigne, /\d+ perles?\b(?! d’un coup)/));
});

test("le rekenrek : le geste est forcé, une perle à la fois est refusée", () => {
  // 47 perles : 4 rangées pleines, 7 sur la cinquième.
  const etats = AIDES.etatsDe(47);
  assert.deepEqual(etats, [10, 10, 10, 10, 7, 0, 0, 0, 0, 0]);
  // « + 10 » : une rangée entière d'un coup, sur la première rangée vide.
  assert.deepEqual(AIDES.gesteAttendu(etats, 10), {rangees: [5], ecart: 10});
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 6, 10), {motif: "ailleurs"}, "pas une rangée plus bas");
  assert.equal(AIDES.verifierGeste(etats, 10, 5, 10), null, "la rangée entière d'un coup est acceptée");
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 5, 1), {motif: "peu"}, "une perle seule est refusée");
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 5, 9), {motif: "peu"});
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 4, 3), {motif: "ailleurs"}, "finir la rangée entamée n'est pas pousser 10 perles : refusé sans phrase");
  assert.deepEqual(AIDES.verifierGeste(etats, 10, 4, -1), {motif: "ailleurs"});
  // « − 1 » : sur la rangée entamée, exactement une perle.
  const apres = [10, 10, 10, 10, 7, 10, 0, 0, 0, 0];
  assert.deepEqual(AIDES.gesteAttendu(apres, -1), {rangees: [4], ecart: -1});
  assert.equal(AIDES.verifierGeste(apres, -1, 4, -1), null);
  assert.deepEqual(AIDES.verifierGeste(apres, -1, 4, -2), {motif: "trop"});
  assert.deepEqual(AIDES.verifierGeste(apres, -1, 5, -1), {motif: "ailleurs"}, "pas sur une rangée pleine");
  assert.deepEqual(AIDES.verifierGeste(apres, -1, 6, 10), {motif: "trop"});
  assert.deepEqual(AIDES.verifierGeste([10, 10, 10, 10, 10, 3, 10, 10, 10, 10], -2, 5, -1), {motif: "peu"});
  // « + 3 » : finir la rangée, d'un coup, sur la rangée entamée.
  const a37 = AIDES.etatsDe(37);
  assert.deepEqual(AIDES.gesteAttendu(a37, 3), {rangees: [3], ecart: 3});
  assert.equal(AIDES.verifierGeste(a37, 3, 3, 3), null);
  assert.deepEqual(AIDES.verifierGeste(a37, 3, 3, 1), {motif: "peu"});
  assert.deepEqual(AIDES.verifierGeste(a37, 3, 4, 10), {motif: "rangee"});
  assert.equal(AIDES.verifierGeste(a37, 3, 3, 0), null, "un geste sans effet n'est ni accepté ni refusé");
  assert.deepEqual({...AIDES.MESSAGES_REFUS}, {rangee: "Finis la rangée d’abord\u00a0!", trop: "Trop de perles\u00a0!", peu: "Pas assez de perles\u00a0!"});
  assert.equal(AIDES.PERLES.rangees * AIDES.PERLES.parRangee, 100);
});

test("la droite à sauts : un petit saut garde une largeur lisible, le saut direct est dessous", () => {
  const detour = {depart: 47, sauts: [{val: 20}, {val: -1}], direct: 19, inconnue: 2, acquis: [1]};
  const plan = AIDES.planDroite(detour);
  assert.deepEqual(plan.valeurs, [47, 67, 66]);
  assert.equal(plan.x[0], AIDES.DROITE.gauche);
  assert.equal(plan.x[1], AIDES.DROITE.droiteRetour);
  assert.equal(plan.x[1] - plan.x[2], AIDES.DROITE.sautMin, "le retour de 1 garde la largeur minimale");
  const svg = AIDES.droiteSauts(detour);
  assert.match(svg, /^<svg viewBox="0 0 560 196"/);
  ["+ 20", "− 1", "+ 19", ">47<", ">67<", ">\\?<"].forEach(motif => assert.match(svg, new RegExp(motif.replace(/[+]/g, "\\+"))));
  assert.doesNotMatch(svg, />66</, "le nombre à trouver n'est pas écrit");
  // Deux sauts en avant : 37 → 40 → 100.
  const deux = AIDES.planDroite({depart: 37, sauts: [{val: 3}, {val: 60}]});
  assert.deepEqual(deux.valeurs, [37, 40, 100]);
  assert.equal(deux.x[1] - deux.x[0], AIDES.DROITE.sautMin);
  assert.equal(deux.x[2], AIDES.DROITE.droite);
  assert.match(AIDES.droiteSauts({depart: 37, sauts: [{val: 3}, {val: 60}]}), /^<svg viewBox="0 0 560 158"/);
  // Le saut en gras, l'étiquette masquée, les milliers.
  assert.equal((AIDES.droiteSauts(Object.assign({}, detour, {gras: 2})).match(/stroke-width="5.5"/g) || []).length, 1);
  assert.match(AIDES.droiteSauts({depart: 67, sauts: [{val: 3, masque: true}]}), /\+ \?/);
  assert.match(AIDES.droiteSauts({depart: 650, sauts: [{val: 50}, {val: 300}]}), />1 000</);
  // Deux droites dans la même page n'ont pas les mêmes identifiants de flèche.
  const ids = texte => texte.match(/id="[^"]+"/g);
  assert.notDeepEqual(ids(AIDES.droiteSauts(detour)), ids(AIDES.droiteSauts(detour)));
});

test("l'image d'une erreur montre la réponse, le pas oublié en gras", () => {
  const diagnostic = CORE.diagnostiquer(somme(47, 19), 67);
  assert.deepEqual(diagnostic.image, {outil: "droite-sauts", depart: 47, sauts: [{val: 20}, {val: -1}], direct: 19, acquis: [2], gras: 2});
  const svg = AIDES.droiteSauts(diagnostic.image);
  assert.match(svg, />66</);
  assert.match(svg, />67</);
  const a2 = CORE.diagnostiquer(complement(37, 100), 3);
  assert.deepEqual(a2.image, {outil: "droite-sauts", depart: 37, sauts: [{val: 3}, {val: 60}], gras: 2});
  // Un complément à un seul saut n'a rien à mettre en gras.
  assert.equal(CORE.diagnostiquer(complement(433, 440, true), 440).image.gras, 0);
});

test("lire une réponse, écrire un nombre, la clé d'un calcul", () => {
  assert.equal(CORE.lireReponse("360"), 360);
  assert.equal(CORE.lireReponse("360,0"), 360);
  assert.equal(CORE.lireReponse("3.6"), 3.6);
  assert.equal(CORE.lireReponse("1 000"), 1000);
  assert.equal(CORE.lireReponse("0,60"), 0.6);
  assert.equal(CORE.lireReponse(""), null, "une case vide ne se valide pas");
  assert.equal(CORE.lireReponse(","), null);
  assert.equal(CORE.lireReponse("12a"), null);
  assert.equal(CORE.memeNombre(CORE.lireReponse("360,0"), 360), true);
  assert.equal(CORE.formaterNombre(2700), "2 700");
  assert.equal(CORE.formaterNombre(999), "999");
  assert.equal(CORE.formaterNombre(3.6), "3,6");
  assert.equal(CORE.formaterNombre(1082.5), "1 082,5");
  assert.equal(CORE.formaterNombre(0.25), "0,25");
  assert.equal(CORE.cleNombre(3.6), "36d1");
  assert.equal(CORE.cleNombre(47), "47");
  assert.equal(impose("A5-2", "31 + 19 = □").cle, "A5-2-31-19");
  assert.equal(impose("A2-3", "61 + □ = 100").cle, "A2-3-61-x-100");
  assert.equal(impose("A2-2", "100 − 35 = □").cle, "A2-2-100-35");
  assert.equal(calculDe("A2-3", c => c.forme === "complement-gauche").cle.split("-")[2], "x");
  assert.equal(CORE.graineDe("2026-10-03:7K3M9P"), CORE.graineDe("2026-10-03:7K3M9P"));
  assert.notEqual(CORE.graineDe("2026-10-03:7K3M9P"), CORE.graineDe("2026-10-04:7K3M9P"));
});

test("le glisse-nombres : la bande ne pose aucun zéro, la virgule ne bouge pas", () => {
  const D2 = [3, 2, 1, 0, -1, -2, -3];
  const M2 = [5, 4, 3, 2, 1, 0];
  assert.deepEqual(AIDES.chiffresDansColonnes(3.6, D2), ["", "", "", "3", "6", "", ""]);
  assert.deepEqual(AIDES.chiffresDansColonnes(27, M2), ["", "", "", "", "2", "7"]);
  // 3,6 × 100 : la case des unités reste vide — c'est le zéro à écrire.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(3.6, D2), 2, 3), ["", "3", "6", "", "", "", ""]);
  // 27 × 100 : les dizaines et les unités restent vides.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(27, M2), 2, 5), ["", "", "2", "7", "", ""]);
  // 0,6 × 10 : le zéro de tête tombe, on lit 6 (pas 06).
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(0.6, D2), 1, 3), ["", "", "", "6", "", "", ""]);
  // 0,05 × 10 = 0,5 : le zéro des unités reste.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(0.05, D2), 1, 3), ["", "", "", "0", "5", "", ""]);
  // 480 ÷ 10 : le zéro des unités sort du tableau des entiers.
  assert.deepEqual(AIDES.bandeApres(AIDES.chiffresDansColonnes(480, M2), -1, 5), ["", "", "", "", "4", "8"]);
  assert.equal(AIDES.RANGS[5], "Centaines de mille");
  assert.equal(AIDES.RANGS[-3], "Millièmes");
});

test("le tableau à flèches : une flèche par chiffre, un « ? » par zéro à écrire", () => {
  const plan = AIDES.planTableau({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true});
  assert.deepEqual(plan.colonnes, [2, 1, 0, -1]);
  assert.deepEqual(plan.fleches.map(f => [f.chiffre, f.de, f.vers]), [["3", 0, 2], ["6", -1, 1]]);
  assert.deepEqual(plan.zeros, [0], "la case des unités : le zéro à écrire");
  // L'aide : la rangée du bas est à trouver, chiffres et zéro (relecture
  // Codex, 31/10 : le tableau écrivait 36 puis « ? », donc la réponse).
  const cherche = AIDES.tableauFleches({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true, inconnue: true});
  assert.equal((cherche.match(/>\?</g) || []).length, 3, "un « ? » par case d'arrivée");
  assert.equal((cherche.match(/font-size="27"[^>]*>[0-9]</g) || []).length, 2, "les chiffres écrits en grand : ceux du départ seulement (3 et 6)");
  assert.match(cherche, />× 100</);
  assert.equal((cherche.match(/marker-end/g) || []).length, 2, "deux flèches");
  assert.equal((cherche.match(/fill="#c62828"/g) || []).length, 2, "la virgule, au même endroit dans les deux rangées");
  assert.doesNotMatch(cherche, />0</, "le zéro cherché n'est pas écrit");
  const montre = AIDES.tableauFleches({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true});
  assert.match(montre, />0</, "la réponse montrée : le zéro est écrit");
  // 27 × 100 : sans virgule, les milliers et les centaines.
  const m2 = AIDES.planTableau({depart: 27, arrivee: 2700, p: 100, operation: "×"});
  assert.deepEqual(m2.colonnes, [3, 2, 1, 0]);
  assert.deepEqual(m2.zeros, [1, 0]);
  assert.doesNotMatch(AIDES.tableauFleches({depart: 27, arrivee: 2700, p: 100, operation: "×"}), /#c62828/, "pas de virgule chez les entiers");
  // 480 ÷ 10 : vers la droite, le zéro des unités sort.
  const division = AIDES.planTableau({depart: 480, arrivee: 48, p: 10, operation: "÷"});
  assert.equal(division.k, -1);
  assert.deepEqual(division.fleches.map(f => f.chiffre), ["4", "8"]);
  assert.match(AIDES.tableauFleches({depart: 480, arrivee: 48, p: 10, operation: "÷"}), />÷ 10</);
  // 0,25 × 1 000 : le zéro de tête ne descend pas.
  assert.deepEqual(AIDES.planTableau({depart: 0.25, arrivee: 250, p: 1000, operation: "×", virgule: true}).fleches.map(f => f.chiffre), ["2", "5"]);
  // La puissance cherchée : « × ? ».
  const masque = AIDES.tableauFleches({depart: 1.2, arrivee: 1200, p: 1000, operation: "×", virgule: true, masque: true});
  assert.match(masque, />× \?</);
  assert.doesNotMatch(masque, /1 000/);
  // Une seule fonction dessine toutes les images.
  assert.match(AIDES.dessinerImage({outil: "tableau-fleches", depart: 27, arrivee: 2700, p: 100, operation: "×"}), /class="dc-tableau"/);
  assert.match(AIDES.dessinerImage({outil: "droite-sauts", depart: 37, sauts: [{val: 3}, {val: 60}]}), /viewBox="0 0 560 158"/);
  // Deux tableaux dans la même page n'ont pas les mêmes identifiants de flèche.
  const ids = texte => texte.match(/id="[^"]+"/g);
  assert.notDeepEqual(ids(montre), ids(AIDES.tableauFleches({depart: 3.6, arrivee: 360, p: 100, operation: "×", virgule: true})));
});

// Relecture Codex (31/10) : une série d'entraînement fait toujours ses 20
// calculs et montre chaque écriture du niveau, même quand le vivier est
// petit (A2-2 : 19 nombres) ou que l'exclusion de « J'apprends » a vidé une
// écriture (A2-4, graine 107).
test("les séries : toujours complètes, toutes les écritures, malgré les exclusions", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const exclure = niveau.apprends ? niveau.apprends.textes : [];
    const formes = new Set(CORE.genererSerie(cle, {graine: 5, total: 40}).map(c => c.forme));
    for (let graine = 1; graine <= 120; graine += 1) {
      const serie = CORE.genererSerie(cle, {graine, exclure});
      assert.equal(serie.length, CORE.TOTAUX.entraine, `${cle}, graine ${graine} : ${serie.length} calculs`);
      assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle}, graine ${graine} : pas de doublon`);
      serie.forEach(c => assert.ok(!exclure.includes(c.texte), `${cle} : les calculs de J'apprends restent exclus`));
      formes.forEach(forme => assert.ok(serie.some(c => c.forme === forme), `${cle}, graine ${graine} : l'écriture ${forme} manque`));
    }
  });
  assert.equal(CORE.genererSerie("A2-2", {graine: 1, exclure: CORE.moduleDe("A2").niveaux[1].apprends.textes}).length, 20);
  assert.ok(CORE.genererSerie("A2-4", {graine: 107, exclure: CORE.moduleDe("A2").niveaux[3].apprends.textes}).some(c => c.forme === "complement-gauche"));
});
