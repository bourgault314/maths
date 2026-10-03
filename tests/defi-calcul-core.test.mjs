// Défi calcul, lot 1a : les fiches des modules, les générateurs, les erreurs
// connues, les aides (fiche technique § 9, points 1 à 3).

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

const nombre = texte => Number(String(texte).replace(/[   ]/g, "").replace(",", "."));

// La réponse d'un calcul, recalculée à partir de son TEXTE seulement.
function resoudre(texte) {
  const m = texte.replace(/ /g, "");
  let r;
  if ((r = /^(\d+) \+ □ = (\d+)$/.exec(m))) return Number(r[2]) - Number(r[1]);
  if ((r = /^□ \+ (\d+) = (\d+)$/.exec(m))) return Number(r[2]) - Number(r[1]);
  if ((r = /^(\d+) − (\d+) = □$/.exec(m))) return Number(r[1]) - Number(r[2]);
  if ((r = /^(\d+) \+ (\d+) = □$/.exec(m))) return Number(r[1]) + Number(r[2]);
  throw new Error(`forme inconnue : ${texte}`);
}

function series(cle, genre) {
  return Array.from({length: SERIES}, (_, graine) => CORE.genererSerie(cle, {graine: graine * 7919 + 13, genre}));
}

const compter = (liste, critere) => liste.filter(critere).length;

test("les 71 modules : identifiants, paliers, ordre conseillé, niveaux", () => {
  assert.equal(CORE.MODULES.length, 71);
  const ids = CORE.MODULES.map(fiche => fiche.id);
  assert.equal(new Set(ids).size, 71, "aucun identifiant en double");
  ids.forEach(id => assert.match(id, /^[AMDFPRXC]\d{1,2}$/));
  const parPalier = n => CORE.MODULES.filter(fiche => fiche.palier === n).map(fiche => fiche.id);
  assert.deepEqual(parPalier(1), ["A1", "A2", "M1", "A3", "M2", "A4", "M4", "A5", "A6", "M3"]);
  assert.deepEqual(parPalier(2), ["M6", "A7", "M7", "A8", "M5", "C1", "C4", "M8", "A9", "M10", "C3", "M11", "M12", "M9"]);
  assert.deepEqual(parPalier(3), ["D1", "D2", "D3", "F2", "D4", "F3", "D5", "D6", "F1", "D7", "D8", "F4", "D9"]);
  assert.deepEqual(parPalier(4), ["F5", "F6", "F8", "F9", "F11"]);
  assert.equal(parPalier(0).length, 29, "29 identifiants réservés, jamais affichés");
  assert.deepEqual(CORE.PALIERS.map(palier => palier.nom), ["Le socle", "Les entiers", "Les décimaux", "Les fractions du CM"]);
  // La table du moteur de progression dit la même chose que les fiches.
  assert.deepEqual(ids, [...PARCOURS.CODES], "même ordre dans les deux fichiers");
  CORE.MODULES.forEach(fiche => {
    assert.equal(fiche.niveaux.length, PARCOURS.NIVEAUX[fiche.id], `niveaux de ${fiche.id}`);
    fiche.niveaux.forEach((niveau, index) => assert.equal(niveau.n, index + 1, `${fiche.id} : niveaux numérotés à la suite`));
  });
  // Aucun module des 42 n'est placé avant un de ses « avant ».
  const construits = CORE.MODULES.filter(fiche => fiche.palier > 0).map(fiche => fiche.id);
  construits.forEach((id, rang) => {
    CORE.moduleDe(id).avant.forEach(avant => {
      assert.ok(construits.indexOf(avant) >= 0 && construits.indexOf(avant) < rang, `${avant} doit précéder ${id}`);
    });
  });
});

test("le lot 1a construit A2 et A5 ; M2 et D2 sont réservés avec leurs niveaux", () => {
  assert.deepEqual(CORE.MODULES.filter(fiche => fiche.construit).map(fiche => fiche.id), ["A2", "A5"]);
  assert.deepEqual(CORE.moduleDe("A2").niveaux.map(n => n.type), ["F", "F", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("A5").niveaux.map(n => n.type), ["P", "P", "P", "P"]);
  assert.deepEqual(CORE.moduleDe("M2").niveaux.map(n => n.titre), ["produits", "nombres en 0, trous, divisions"]);
  assert.equal(CORE.moduleDe("D2").niveaux.length, 4);
  assert.equal(CORE.moduleDe("D2").niveaux[2].titre, "des zéros à écrire");
  assert.deepEqual([...CORE.PILOTES], ["A2", "A5", "M2", "D2"]);
  assert.equal(CORE.ESSAI_PILOTES, true);
  const carte = CORE.carte();
  assert.equal(carte.length, 71);
  assert.deepEqual(carte.filter(f => f.pilote).map(f => f.id), ["A2", "M2", "A5", "D2"]);
  assert.deepEqual(CORE.genererSerie("M2-1", {graine: 1}), [], "un niveau pas encore construit ne génère rien");
});

test("générateurs : nombre de calculs, réponse recalculée, clés, déterminisme", () => {
  NIVEAUX_CONSTRUITS.forEach(({niveau, cle}) => {
    const textes = new Map();
    ["valide", "entraine"].forEach(genre => {
      const attendu = genre === "valide" ? (niveau.type === "F" ? 12 : 10) : 10;
      series(cle, genre).forEach((serie, index) => {
        assert.equal(serie.length, attendu, `${cle} ${genre} : ${attendu} calculs`);
        assert.equal(new Set(serie.map(c => c.cle)).size, serie.length, `${cle} : aucune répétition dans une série`);
        serie.forEach(calcul => {
          assert.equal(calcul.reponse, resoudre(calcul.texte), `${cle} : ${calcul.texte}`);
          assert.ok(Number.isInteger(calcul.reponse) && calcul.reponse > 0, `${cle} : réponse entière positive (${calcul.texte})`);
          assert.match(calcul.cle, new RegExp(`^${cle}-[0-9x]+(-[0-9x]+)*$`), "clé stable, sans texte libre");
          assert.equal((calcul.texte.match(/□/g) || []).length, 1, "une seule case par calcul");
          if (textes.has(calcul.cle)) assert.equal(textes.get(calcul.cle), calcul.texte, "une clé = un seul calcul");
          textes.set(calcul.cle, calcul.texte);
        });
        if (index < 5) {
          const graine = index * 7919 + 13;
          assert.deepEqual(CORE.genererSerie(cle, {graine, genre}), serie, "même graine, même série");
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
  const textes = cle => CORE.niveauDe(cle).niveau.imposes.map(c => c.texte.replace(/ /g, " "));
  assert.deepEqual(textes("A2-1"), ["433 + □ = 440"]);
  assert.deepEqual(textes("A2-2"), ["75 + □ = 100", "100 − 35 = □"]);
  assert.deepEqual(textes("A2-3"), ["61 + □ = 100", "29 + □ = 100", "13 + □ = 100"]);
  assert.deepEqual(textes("A2-4"), ["650 + □ = 1 000", "230 + □ = 300"]);
  assert.deepEqual(textes("A5-1"), ["31 + 9 = □", "94 + 9 = □"]);
  assert.deepEqual(textes("A5-2"), ["31 + 19 = □", "285 + 19 = □"]);
  assert.deepEqual(textes("A5-3"), ["53 + 38 = □", "147 + 18 = □"]);
  assert.deepEqual(textes("A5-4"), ["152 + 98 = □", "126 + 99 = □"]);
});

test("A2 : les nombres et les formes de chaque niveau", () => {
  const formes = serie => ({
    c: compter(serie, c => c.forme === "complement"),
    g: compter(serie, c => c.forme === "complement-gauche"),
    d: compter(serie, c => c.forme === "difference")
  });
  // Niveau 1 : 4 compléments à 10, 8 à la dizaine suivante (4 à deux chiffres, 4 à trois).
  series("A2-1", "valide").forEach(serie => {
    assert.equal(compter(serie, c => c.donnees.cible === 10), 4);
    const suivantes = serie.filter(c => c.donnees.cible !== 10);
    assert.equal(compter(suivantes, c => c.donnees.a < 100), 4);
    assert.equal(compter(suivantes, c => c.donnees.a > 100), 4);
    serie.forEach(c => {
      const {a, cible} = c.donnees;
      assert.equal(c.forme, "complement");
      if (cible === 10) assert.ok(a >= 1 && a <= 9);
      else {
        assert.ok(a >= 11 && a <= 999 && a % 10 !== 0, `${a} : chiffre des unités non nul`);
        assert.equal(cible, Math.floor(a / 10) * 10 + 10, "la cible est la dizaine suivante");
      }
    });
  });
  series("A2-1", "entraine").forEach(serie => {
    assert.ok(Math.abs(compter(serie, c => c.donnees.cible === 10) - 3) <= 1);
  });
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
const impose = (cle, texte) => CORE.niveauDe(cle).niveau.imposes.find(c => c.texte.replace(/ /g, " ") === texte);
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
  assert.deepEqual([...coincidences], ["A2:4+2"], "la seule coïncidence connue : de 81 à 89");
});

function textesDeLaFiche(fiche) {
  const textes = [fiche.nom, fiche.exemple];
  fiche.niveaux.forEach(niveau => {
    textes.push(niveau.titre || "");
    (niveau.imposes || []).forEach(c => textes.push(c.texte));
    const a = niveau.apprends;
    if (!a) return;
    textes.push(a.exemple.texte, a.represente.consigne, a.represente.texte, a.bilan, ...a.ecris.lignes);
    if (a.manipule) textes.push(a.manipule.consigne, ...a.manipule.traces.flatMap(t => [t.attente, t.texte]));
  });
  return textes;
}

test("aucun nombre à sous-entendu dans un exemple mis en avant, aucune formule interdite", async () => {
  CORE.MODULES.forEach(fiche => textesDeLaFiche(fiche).forEach(texte => {
    assert.doesNotMatch(texte, /69/, `${fiche.id} : « ${texte} »`);
    assert.doesNotMatch(texte, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, `${fiche.id} : « ${texte} »`);
  }));
  // Les tirages au hasard, eux, ne sont pas filtrés : + 69 fait partie du niveau 4 d'A5.
  assert.ok(series("A5-4", "entraine").some(serie => serie.some(c => c.donnees.a === 69)));
  for (const fichier of ["defi_calcul_modules.html", "defi_calcul_core.js", "defi_calcul_aides.js"]) {
    const source = await readFile(new URL(`../outils/calcul_mental/${fichier}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(r?ajout|mets?|mettre|place)\w* (un|deux|trois|des|\d) zéros?|(déplac|décal|boug)\w* (la|de) virgule/i, fichier);
  }
});

test("les consignes : l'impératif devant « en », pas de signe seul en début de ligne", () => {
  CORE.MODULES.filter(fiche => fiche.construit).forEach(fiche => fiche.niveaux.forEach(niveau => {
    const a = niveau.apprends;
    const textes = [niveau.titre || "", a.bilan, a.represente.consigne, ...(a.manipule ? [a.manipule.consigne] : [])];
    textes.forEach(texte => {
      assert.doesNotMatch(texte, /[^s]-en\b/, `${fiche.id} : « ${texte} » (retires-en, pousses-en)`);
      assert.doesNotMatch(texte, / [:?!]/, `${fiche.id} : « ${texte} » (espace insécable devant : ? !)`);
    });
  }));
  assert.match(CORE.niveauDe("A5-1").niveau.apprends.manipule.consigne, /puis retires-en 1\.$/);
});

test("J'apprends : trois temps cohérents pour chaque niveau construit", () => {
  NIVEAUX_CONSTRUITS.forEach(({fiche, niveau, cle}) => {
    const a = niveau.apprends;
    assert.ok(a && a.bilan && a.bilan.endsWith("."), `${cle} : une phrase-bilan`);
    assert.equal(a.represente.outil, "droite-sauts");
    assert.equal((a.represente.texte.match(/□/g) || []).length, 1);
    assert.equal(a.ecris.reponse, a.represente.reponse, `${cle} : les trois temps sur le même exemple`);
    assert.ok(a.ecris.lignes[a.ecris.lignes.length - 1].includes("□"), `${cle} : la case est sur la dernière ligne`);
    // La droite arrive bien où l'exemple le dit.
    const plan = AIDES.planDroite(a.represente.image);
    const arrivee = plan.valeurs[plan.valeurs.length - 1];
    if (fiche.id === "A5") {
      assert.equal(arrivee, a.exemple.reponse);
      assert.equal(a.represente.reponse, a.exemple.reponse);
      assert.equal(a.represente.image.direct, a.exemple.reponse - a.represente.image.depart, "le saut direct sous le détour");
    } else {
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
    assert.equal(total, fiche.id === "A5" ? a.exemple.reponse : a.manipule.depart + a.represente.reponse);
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
  assert.deepEqual({...AIDES.MESSAGES_REFUS}, {rangee: "Finis la rangée d’abord !", trop: "Trop de perles !", peu: "Pas assez de perles !"});
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
