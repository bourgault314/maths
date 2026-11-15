// Lot NC-3 (29/10/2026) : NC04 écrite d'après le cahier « Nombres et calculs », partie 1.
// Les contrôles communs à toutes les formes des cahiers (bonne réponse acceptée, erreurs connues
// refusées, dessins de 340 px au plus, morceau de cours, vocabulaire, ponctuation) sont dans
// automatismes-cahier-nc-1.test.mjs, qui parcourt formesCahier. Ici : ce que le cahier fixe pour ces
// neuf formes — les bornes des tirages, les réponses calculées à part, les fréquences, la saisie, les
// exemples mêmes du cahier, et aucune lettre en italique de formule dans les phrases.
import test from "node:test";
import assert from "node:assert/strict";
import { genererQuestion, formesCahier, formesDisponibles } from "../automatismes/moteur.js";
import { checkAnswer, ecritureDecimale } from "../automatismes/core.js";
import { modeleQuestion } from "../automatismes/champs.js";
import { mathHtml } from "../automatismes/math-format.js";
import { questionPrompt } from "../automatismes/math-layout.js";
import { typo } from "../automatismes/generateurs/cahier.js";

const GRAINES = 400;
const tirages = (forme, n = GRAINES) =>
  Array.from({ length: n }, (_, i) => genererQuestion("NC04", forme, i * 7919 + 1));
const textes = (svg) => [...String(svg).matchAll(/>([^<]*)<\/text>/g)].map((m) => m[1]);
// « 5 240 » → 5240 ; « 52,4 » → 52.4.
const valeur = (ecrit) => Number(String(ecrit).replace(/\s/g, "").replace(",", "."));
// Un nombre écrit, en millièmes (entier) : les calculs des tests ne passent pas par la virgule flottante.
const milliemes = (ecrit) => {
  const [ent, dec = ""] = String(ecrit).replace(/\s/g, "").split(",");
  return Number(ent) * 1000 + Number(dec.padEnd(3, "0"));
};
const nombres = (gabarit) => gabarit.replace(/\[\d\]/g, "□").match(/\d[\d\u202f]*(?:,\d+)?/g);
const EXEMPLES = { a: 26, b: 681, c: 16, d: 19709, e: 115, f: 25, g: 50536, h: 6106, i: 261 };
const exemple = (forme) => genererQuestion("NC04", forme, EXEMPLES[forme]);

test("NC-3 : neuf formes du cahier, NC04 de a à i", () => {
  assert.deepEqual(formesDisponibles("NC04"), [..."abcdefghi"]);
  for (const forme of "abcdefghi") assert.ok(formesCahier.has(`NC04-${forme}`));
  assert.equal(formesCahier.size, 34);
});

test("les exemples du cahier sortent avec leur graine", () => {
  const attendus = {
    a: ["42 ÷ 6 = [0]", "7"],
    b: ["2,3 + [0] = 5,5", "3,2"],
    c: ["7 × 29 = [0]", "203"],
    d: ["52,4 × 100 = [0]", "5240"],
    e: ["9,3 × 4 = [0]", "37,2"],
    f: ["4,8 ÷ 0,6 = [0]", "8"],
    g: ["3,7 × [0] = 370", "100"],
    h: ["[0] × 100 = 45", "0,45"],
    i: ["0,3 × 0,2 = [0]", "0,06"],
  };
  for (const [forme, [gabarit, reponse]] of Object.entries(attendus)) {
    const q = exemple(forme);
    assert.equal(q.gabarit, gabarit, forme);
    assert.equal(q.fields[0].answer, reponse, forme);
    assert.equal(modeleQuestion(q).cas, "gabarit", forme);
  }
});

test("NC04-a : facteurs de 2 à 9, produit ou division exacte une fois sur deux, jamais 69", () => {
  let divisions = 0;
  for (const q of tirages("a", 1200)) {
    const division = q.gabarit.includes("÷");
    const [x, y] = nombres(q.gabarit).map(Number);
    if (division) {
      divisions++;
      assert.ok(y >= 2 && y <= 9 && x % y === 0 && x / y >= 2 && x / y <= 9, q.id);
      assert.equal(Number(q.fields[0].answer), x / y, q.id);
      // L'aide écrit le total et « par ligne », jamais le nombre de lignes.
      assert.ok(textes(q.hints[0].svg).includes(`${x} cases`), q.id);
    } else {
      assert.ok(x >= 2 && x <= 9 && y >= 2 && y <= 9, q.id);
      assert.equal(Number(q.fields[0].answer), x * y, q.id);
      assert.ok(!textes(q.hints[0].svg).some((t) => t.includes(String(x * y))), q.id);
    }
    const ecrit = [q.gabarit, q.fields[0].answer, q.hints[0].text, q.hints[1].text, q.bonne];
    for (const t of [...ecrit, ...q.erreurs.flatMap((e) => [e.reponse, e.phrase])])
      assert.doesNotMatch(t, /69/, q.id);
    assert.ok(!textes(q.hints[0].svg).some((t) => /69/.test(t)), q.id);
  }
  assert.ok(divisions > 480 && divisions < 720, `divisions : ${divisions} sur 1200`);
  const q = exemple("a");
  assert.equal(q.hints[0].text, typo("42 cases, 6 par ligne : je compte les lignes."));
  assert.equal(q.hints[1].text, typo("6 × ? = 42"));
  assert.equal(
    q.erreurs.find((e) => e.reponse === "36").phrase,
    typo("6 × 6 = 36 ; cherche 6 × ? = 42."),
  );
  assert.deepEqual(q.explication.etapes, ["6 × 7 = 42.", "Donc 42 ÷ 6 = 7."]);
  // La saisie : le nombre seul ; « 42 ÷ 6 » écrit dans la case est refusé.
  assert.equal(checkAnswer(q, ["42/6"]).ok, false);
  assert.equal(checkAnswer(q, ["7"]).ok, true);
});

test("NC04-b : addition, différence ou terme manquant ; un nombre au centième une fois sur quatre", () => {
  const modes = { "+": 0, "−": 0, trou: 0 };
  let centiemes = 0;
  for (const q of tirages("b", 1200)) {
    const [x, y, z] = nombres(q.gabarit).map(milliemes);
    let attendu;
    if (q.gabarit.includes("[0] =")) {
      modes.trou++;
      attendu = y - x;
      assert.ok(attendu > 0, q.id);
    } else if (q.gabarit.includes("+")) {
      modes["+"]++;
      attendu = x + y;
    } else {
      modes["−"]++;
      attendu = x - y;
      assert.ok(attendu > 0, q.id);
    }
    assert.equal(milliemes(q.fields[0].answer), attendu, `${q.id} : ${q.gabarit}`);
    if (nombres(q.gabarit).some((n) => /,\d\d$/.test(n) || !n.includes(","))) centiemes++;
    assert.equal(z, undefined);
    // L'indice : l'opération posée, sans le résultat.
    assert.match(q.hints[1].svg, /(soustraction|addition) posée/, q.id);
  }
  for (const n of Object.values(modes)) assert.ok(n > 320 && n < 480, JSON.stringify(modes));
  assert.ok(centiemes > 220 && centiemes < 380, `centièmes : ${centiemes} sur 1200`);
  const q = exemple("b");
  assert.equal(q.prompt, "Complète.");
  assert.equal(q.hints[0].text, typo("Le tout 5,5 ; une part 2,3 ; l'autre part ?"));
  assert.equal(q.erreurs[0].reponse, "7,8");
  assert.equal(q.erreurs[0].phrase, "On cherche la part qui manque : 5,5 − 2,3.");
  assert.equal(checkAnswer(q, ["3,20"]).ok, true);
  // « 4,13 − 2,2 » calculé avec les virgules mal alignées (2,11) a sa phrase.
  const mal = tirages("b", 3000).find((t) =>
    t.erreurs.some((e) => e.phrase.startsWith("Aligne les virgules")),
  );
  assert.ok(mal);
});

test("NC04-c : 19, 29, 39, 49, 99 (on enlève) ou 21, 31, 41 (on ajoute)", () => {
  const vus = new Set();
  for (const q of tirages("c")) {
    const [k, n] = nombres(q.gabarit).map(Number);
    assert.ok(k >= 2 && k <= 9 && [19, 29, 39, 49, 99, 21, 31, 41].includes(n), q.id);
    vus.add(n);
    assert.equal(Number(q.fields[0].answer), k * n, q.id);
    assert.equal(q.erreurs[0].reponse, String(k * (n % 10 === 9 ? n + 1 : n - 1)), q.id);
  }
  assert.equal(vus.size, 8);
  const q = exemple("c");
  assert.equal(q.hints[0].text, "7 × 30, avec une colonne de trop.");
  assert.equal(q.erreurs[0].phrase, "7 × 30 compte une colonne de trop : enlève 7.");
  assert.deepEqual(q.explication.calc, [
    ["7 × 29", "= 7 × 30 − 7"],
    ["", "= 210 − 7"],
    ["", "= 203"],
  ]);
});

// Les chiffres écrits dans un glisse-nombre : chaque chiffre de chaque nombre a sa colonne.
const chiffresDessin = (svg) => textes(svg).filter((t) => /^\d$/.test(t)).length;
const nbChiffres = (ecrit) => String(ecrit).replace(/[\s,]/g, "").length;

test("NC04-d : × ou ÷ par 10, 100, 1 000 ; au plus 3 chiffres après la virgule, au plus 100 000", () => {
  let mult = 0;
  for (const q of tirages("d", 1200)) {
    const [x, p] = nombres(q.gabarit);
    const fois = q.gabarit.includes("×");
    if (fois) mult++;
    const k = Math.round(Math.log10(valeur(p)));
    const vx = milliemes(x);
    const attendu = fois ? vx * 10 ** k : vx / 10 ** k;
    assert.ok(Number.isInteger(attendu) && attendu <= 100000000, q.id);
    assert.equal(milliemes(q.fields[0].answer), attendu, `${q.id} : ${q.gabarit}`);
    // L'aide : le nombre sur la bande, la ligne d'arrivée vide ; l'explication : les deux nombres.
    assert.equal(chiffresDessin(q.hints[0].svg), nbChiffres(x), q.id);
    assert.equal(
      chiffresDessin(q.explication.svg),
      nbChiffres(x) + nbChiffres(q.fields[0].answer),
      q.id,
    );
  }
  assert.ok(mult > 480 && mult < 720, `× : ${mult} sur 1200`);
  const q = exemple("d");
  assert.equal(q.hints[0].text, "× 100 : chaque chiffre glisse de 2 rangs vers la gauche.");
  assert.equal(q.bonne, "52,4 × 100 = 5 240");
  assert.equal(
    q.erreurs.find((e) => e.reponse === "52,400").phrase,
    "Ajouter des 0 après la virgule ne change rien : les chiffres doivent glisser.",
  );
  assert.deepEqual(q.explication.etapes, [
    "Le 5 passe des dizaines aux milliers.",
    "Le 2 aux centaines, le 4 aux dizaines.",
    "Un 0 garde la place des unités.",
  ]);
  assert.equal(checkAnswer(q, ["5 240"]).ok, true);
  assert.equal(checkAnswer(q, ["52,4*100"]).ok, false);
});

test("Écriture décimale : l'espace seulement entre des groupes de trois chiffres (correctif NC-3)", () => {
  const acceptes = ["5 240", "5240", "1 000,5", "12 345 678", "12\u00a0345\u00a0678", "12\u202f345,25"];
  for (const ecrit of acceptes) assert.equal(ecritureDecimale(ecrit), true, ecrit);
  for (const ecrit of ["52 40", "5 2 4 0", "0, 5", "5 24", "5 240 , 1"])
    assert.equal(ecritureDecimale(ecrit), false, ecrit);
  const q = exemple("d");
  assert.equal(checkAnswer(q, ["5 240"]).ok, true);
  assert.equal(checkAnswer(q, ["5240"]).ok, true);
  for (const ecrit of ["52 40", "5 2 4 0", "5 24 0", "524 0"])
    assert.equal(checkAnswer(q, [ecrit]).ok, false, ecrit);
});

test("Écriture décimale : sans espace, le même résultat qu'avant le lot (200 tirages de NC01-c et NC04-d)", () => {
  // Le contrôle de main, recopié tel qu'il était avant le lot NC-3.
  const formeMain = (s) => /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(String(s).trim());
  const egal = (s, v) => Number(String(s).replace(",", ".")) === Number(String(v).replace(",", "."));
  for (const [notion, forme] of [
    ["NC01", "c"],
    ["NC04", "d"],
  ])
    for (let i = 0; i < 200; i++) {
      const q = genererQuestion(notion, forme, i * 7919 + 1);
      const v = String(q.check.values[0]);
      const variantes = [v, v.replace(",", "."), `+${v}`, `${v},`, `${v}0`, `−${v}`, `${v}/1`, `,${v}`, `${v}e0`];
      for (const s of variantes) {
        assert.equal(ecritureDecimale(s), formeMain(s), `${q.id} « ${s} »`);
        if (egal(s, v)) assert.equal(checkAnswer(q, [s]).ok, formeMain(s), `${q.id} « ${s} »`);
      }
    }
});

test("NC04-e : un décimal × un entier ; plus petit que 1 une fois sur deux", () => {
  let petits = 0;
  for (const q of tirages("e", 1200)) {
    const [a, k] = nombres(q.gabarit);
    assert.ok(/,\d$/.test(a), `${q.id} : jamais entier`);
    assert.ok(Number(k) >= 2 && Number(k) <= 9, q.id);
    assert.equal(milliemes(q.fields[0].answer), milliemes(a) * Number(k), q.id);
    if (valeur(a) < 1) {
      petits++;
      assert.match(q.hints[0].svg, /bandes de dixièmes/, q.id);
    } else assert.match(q.hints[0].svg, /rectangle de la décomposition/, q.id);
  }
  assert.ok(petits > 480 && petits < 720, `plus petits que 1 : ${petits} sur 1200`);
  const q = exemple("e");
  assert.equal(q.hints[1].text, "0,3 × 4 = 3 dixièmes × 4 = ? dixièmes");
  assert.equal(
    q.erreurs.find((e) => e.reponse === "36,12").phrase,
    "0,3 × 4 = 12 dixièmes = 1,2 : 36 + 1,2 = 37,2.",
  );
  assert.deepEqual(q.explication.calc, [
    ["9,3 × 4", "= 9 × 4 + 0,3 × 4"],
    ["", "= 36 + 1,2"],
    ["", "= 37,2"],
  ]);
});

test("NC04-f : diviseur de 0,2 à 0,9, quotient entier de 2 à 9, écrit en fraction", () => {
  for (const q of tirages("f")) {
    const [a, d] = nombres(q.gabarit);
    assert.ok(/^0,[2-9]$/.test(d), q.id);
    const quotient = milliemes(a) / milliemes(d);
    assert.ok(Number.isInteger(quotient) && quotient >= 2 && quotient <= 9, q.id);
    assert.equal(Number(q.fields[0].answer), quotient, q.id);
  }
  const q = exemple("f");
  assert.equal(q.hints[1].text, "48/6 : c'est la table de 6.");
  assert.equal(q.erreurs[0].reponse, "0,8");
  assert.deepEqual(q.explication.calc, [
    ["4,8 ÷ 0,6", "= 4,8/0,6"],
    ["", "= 48/6"],
    ["", "= 8"],
  ]);
  assert.match(mathHtml(q.explication.calc[0][1]), /<mfrac>/);
});

test("NC04-g : □ vaut 10, 100 ou 1 000 ; l'égalité à l'envers une fois sur quatre des ×", () => {
  let envers = 0;
  let mult = 0;
  for (const q of tirages("g", 1600)) {
    const p = Number(q.fields[0].answer);
    assert.ok([10, 100, 1000].includes(p), q.id);
    const egalite = q.gabarit.replace("[0]", String(p));
    const [gauche, droite] = egalite.split(" = ");
    const calcule = (expr) => {
      const [a, op, b] = expr.split(" ");
      return op === "×" ? milliemes(a) * Number(b) : milliemes(a) / Number(b);
    };
    // À l'envers : « 1 200 = 1,2 × [0] », la case au bout.
    if (q.gabarit.endsWith("[0]")) {
      envers++;
      assert.equal(milliemes(gauche), calcule(droite), q.id);
    } else assert.equal(calcule(gauche), milliemes(droite), `${q.id} : ${q.gabarit}`);
    if (q.gabarit.includes("×")) mult++;
  }
  assert.ok(envers / mult > 0.15 && envers / mult < 0.35, `${envers} à l'envers sur ${mult}`);
  const q = exemple("g");
  assert.equal(q.hints[1].text, "Le 3 est passé des unités aux centaines : combien de rangs ?");
  assert.equal(
    q.erreurs.find((e) => e.reponse === "0,01").phrase,
    "Les chiffres ont glissé vers la gauche : on a multiplié par 100.",
  );
  assert.equal(checkAnswer(q, ["100"]).ok, true);
});

test("NC04-h : le nombre de départ, au plus 3 chiffres après la virgule", () => {
  for (const q of tirages("h", 1200)) {
    const [p, y] = nombres(q.gabarit);
    const x = milliemes(q.fields[0].answer);
    const k = Number(p.replace(/\s/g, ""));
    assert.equal(q.gabarit.includes("×") ? x * k : x / k, milliemes(y), `${q.id} : ${q.gabarit}`);
    // L'aide : 45 en bas, la bande vide.
    assert.equal(chiffresDessin(q.hints[0].svg), nbChiffres(y), q.id);
  }
  const q = exemple("h");
  assert.equal(q.hints[1].text, "Pour revenir en arrière, divise par 100.");
  assert.equal(q.bonne, "0,45 × 100 = 45");
  assert.equal(
    q.erreurs.find((e) => e.reponse === "4 500").phrase,
    "4 500 × 100 ne fait pas 45 : fais glisser dans l'autre sens.",
  );
  assert.equal(checkAnswer(q, ["4500"]).ok, false);
  assert.deepEqual(q.explication.etapes, ["45 ÷ 100 = 0,45.", "Vérification : 0,45 × 100 = 45."]);
});

test("NC04-i : deux décimaux au dixième ; le produit a un 0 final au moins une fois sur trois", () => {
  let zeroFinal = 0;
  for (const q of tirages("i", 1200)) {
    const [a, b] = nombres(q.gabarit);
    const produit = (milliemes(a) * milliemes(b)) / 1000;
    assert.equal(milliemes(q.fields[0].answer), produit, q.id);
    assert.ok(valeur(a) < 1 || valeur(b) < 1, q.id);
    if (produit % 100 === 0) zeroFinal++;
  }
  assert.ok(zeroFinal > 400, `0 final : ${zeroFinal} sur 1200`);
  // L'aide : la décomposition du document d'accompagnement de 6e (choix de Gwenaël du 30/10).
  const q = exemple("i");
  assert.equal(q.hints[0].text, typo("0,3, c'est 3 fois 0,1 ; 0,2, c'est 2 fois 0,1."));
  assert.match(q.hints[0].svg, /3 × 0,1/);
  assert.ok(
    !textes(q.hints[0].svg).some((t) => t.includes("0,06")),
    "la réponse n'est pas sur l'aide",
  );
  assert.deepEqual(q.explication.calc, [
    ["0,3 × 0,2", "= (3 × 0,1) × (2 × 0,1)"],
    ["", "= (3 × 2) × (0,1 × 0,1)"],
    ["", "= 6 × 0,01"],
    ["", "= 0,06"],
  ]);
  assert.deepEqual(q.explication.etapes, [
    typo("0,1 × 0,1, c'est le dixième de 0,1 : 0,01."),
    typo("Contrôle : 0,2 est plus petit que 1, donc 0,3 × 0,2 est plus petit que 0,3."),
  ]);
  const deux = tirages("i", 1200).find((t) => /^0,5 × 0,4 /.test(t.gabarit));
  assert.equal(checkAnswer(deux, ["0,20"]).ok, true);
  assert.equal(checkAnswer(deux, ["0,2"]).ok, true);
});

// Leçon du lot NC-2 : une lettre seule d'une phrase (« a », « c' ») ne doit jamais devenir une
// variable en italique. Toutes les phrases de tous les tirages passent au crible.
test("aucune lettre en italique de formule dans les phrases de NC04", () => {
  for (const forme of "abcdefghi")
    for (const q of tirages(forme, 200)) {
      assert.doesNotMatch(questionPrompt(q), /math-variable/, q.id);
      const phrases = [
        q.gabarit,
        q.hints[0].text,
        q.hints[1].text,
        q.bonne,
        ...q.erreurs.map((e) => e.phrase),
        ...q.explication.etapes,
        ...q.explication.calc.flat(),
        ...q.course.morceaux.flatMap((m) => [m.texte, m.exemple]),
      ];
      for (const phrase of phrases)
        assert.doesNotMatch(mathHtml(phrase), /math-variable/, `${q.id} : ${phrase}`);
    }
});
