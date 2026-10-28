// Lot NC-2 (28/10/2026) : NC01, NC02 et NC03 écrites d'après le cahier « Nombres et calculs », partie 1.
// Les contrôles communs à toutes les formes des cahiers (bonne réponse acceptée, erreurs connues
// refusées, dessins de 340 px au plus, morceau de cours, vocabulaire, ponctuation) sont dans
// automatismes-cahier-nc-1.test.mjs, qui parcourt formesCahier. Ici : ce que le cahier fixe pour ces
// douze formes — les bornes des tirages, les réponses calculées à part, les fréquences, la saisie.
import test from "node:test";
import assert from "node:assert/strict";
import { genererQuestion, formesCahier, formesDisponibles } from "../automatismes/moteur.js";
import { checkAnswer } from "../automatismes/core.js";
import { modeleQuestion, symbolesQuestion } from "../automatismes/champs.js";
import { aideHTML, explicationHTML, coursHTML } from "../automatismes/vues.js";

const GRAINES = 400;
const tirages = (id, n = GRAINES) => {
  const [famille, forme] = id.split("-");
  return Array.from({ length: n }, (_, i) => genererQuestion(famille, forme, i * 7919 + 1));
};
const textes = (svg) => [...String(svg).matchAll(/>([^<]*)<\/text>/g)].map((m) => m[1]);
// « 52,738 » → 52.738 ; « −5,4 » → -5.4 ; « 5 273 » → 5273.
const valeur = (ecrit) =>
  Number(String(ecrit).replace(/\s/g, "").replace("−", "-").replace(",", "."));
const proche = (a, b) => Math.abs(a - b) < 1e-9;

test("NC-2 : douze formes du cahier, NC01 à NC03 de a à d", () => {
  for (const famille of ["NC01", "NC02", "NC03"]) {
    assert.deepEqual(formesDisponibles(famille), ["a", "b", "c", "d"]);
    for (const forme of "abcd") assert.ok(formesCahier.has(`${famille}-${forme}`));
  }
  assert.equal(formesCahier.size, 25);
});

test("NC01-a : chiffres tous différents, le dernier jamais 0, les unités une fois sur quatre", () => {
  let unites = 0;
  for (const q of tirages("NC01-a", 1200)) {
    const [, rang, x] = q.prompt.match(/chiffre des (\S+) de (\d+,\d{3})/);
    const [ent, dec] = x.split(",");
    assert.ok(Number(ent) >= 1 && Number(ent) <= 99, q.id);
    assert.notEqual(dec[2], "0", q.id);
    assert.equal(new Set(ent + dec).size, (ent + dec).length, `${q.id} : ${x}`);
    const attendu = { unités: ent.at(-1), dixièmes: dec[0], centièmes: dec[1], millièmes: dec[2] }[
      rang
    ];
    assert.equal(q.fields[0].answer, attendu, q.id);
    if (rang === "unités") unites++;
    // L'aide : le tableau vide, la colonne entourée ; aucun chiffre écrit.
    assert.ok(
      textes(q.hints[0].svg).every((t) => !/^\d$/.test(t)),
      q.id,
    );
    // Chaque autre chiffre du nombre est une erreur connue, avec son rang.
    assert.equal(q.erreurs.length, ent.length + 3 - 1, q.id);
  }
  assert.ok(unites > 220 && unites < 380, `unités : ${unites} sur 1200`);
  assert.equal(checkAnswer(genererQuestion("NC01", "a", 70145), ["7"]).ok, true);
});

test("NC01-b : le nombre de centièmes (ou de dixièmes) en tout ; « 73 » a sa phrase", () => {
  let dixiemes = 0;
  for (const q of tirages("NC01-b", 1200)) {
    const [, x, unite] = q.prompt.match(/^(\d+,\d+), c'est combien de (\S+) en tout/);
    const k = unite === "dixièmes" ? 10 : 100;
    if (k === 10) dixiemes++;
    assert.equal(Number(q.fields[0].answer), Math.round(valeur(x) * k), q.id);
    assert.equal(q.gabarit, `${x} = [0] ${unite}`);
    assert.ok(q.explication.calc.length >= 2, q.id);
  }
  assert.ok(dixiemes > 220 && dixiemes < 380, `dixièmes : ${dixiemes} sur 1200`);
  const q = genererQuestion("NC01", "b", 1164);
  assert.equal(q.prompt, "52,73, c'est combien de centièmes en tout ?");
  assert.equal(checkAnswer(q, ["5273"]).ok, true);
  assert.equal(checkAnswer(q, ["5 273"]).ok, true);
  assert.equal(
    q.erreurs.find((e) => e.reponse === "73").phrase.slice(0, 26),
    "Les 52 unités comptent aus",
  );
});

test("NC01-c : la valeur des fractions décimales, le 0 qui garde la place une fois sur deux", () => {
  let zero = 0;
  for (const q of tirages("NC01-c", 1200)) {
    const [expression] = q.gabarit.split(" = ");
    const somme = expression
      .split(" + ")
      .reduce(
        (s, t) =>
          s + (t.includes("/") ? Number(t.split("/")[0]) / Number(t.split("/")[1]) : Number(t)),
        0,
      );
    assert.ok(proche(valeur(q.fields[0].answer), somme), `${q.id} : ${q.gabarit}`);
    if (/Rien ne va/.test(q.hints[1].text)) zero++;
    // L'aide écrit les fractions sous les colonnes, jamais la réponse.
    assert.ok(!textes(q.hints[0].svg).includes(q.fields[0].answer), q.id);
  }
  assert.ok(zero > 480 && zero < 720, `0 qui garde la place : ${zero} sur 1200`);
  const q = genererQuestion("NC01", "c", 19605);
  assert.equal(q.gabarit, "42 + 7/10 + 8/1000 = [0]");
  assert.equal(checkAnswer(q, ["42,708"]).ok, true);
  assert.equal(checkAnswer(q, ["42,7080"]).ok, true);
  assert.equal(
    checkAnswer(q, ["42+7/10+8/1000"]).message,
    "Donne une écriture décimale, avec une virgule si nécessaire.",
  );
  assert.deepEqual(
    q.erreurs.map((e) => e.reponse),
    ["42,78", "42,078", "42,7008"],
  );
  assert.equal(q.erreurs[0].phrase, "Il n'y a pas de centièmes : écris 0 au rang des centièmes.");
});

test("NC01-d : les cases dans les fractions, la variante « □/100 » une fois sur quatre", () => {
  let seul = 0;
  for (const q of tirages("NC01-d", 1200)) {
    const [, e, a, b] = q.gabarit.match(/^(\d+),(\d)(\d) = \1 \+/);
    assert.notEqual(b, "0");
    if (q.fields.length === 1) {
      seul++;
      assert.equal(q.gabarit, `${e},${a}${b} = ${e} + [0]/100`);
      assert.equal(q.fields[0].answer, String(10 * Number(a) + Number(b)));
    } else {
      assert.deepEqual(
        q.fields.map((c) => c.answer),
        [a, b],
      );
      const morceaux = modeleQuestion(q);
      assert.equal(morceaux.cas, "gabarit");
    }
  }
  assert.ok(seul > 220 && seul < 380, `□/100 : ${seul} sur 1200`);
  const q = genererQuestion("NC01", "d", 1441);
  assert.equal(checkAnswer(q, ["3", "7"]).ok, false);
  assert.equal(q.erreurs[0].phrase, "Le 1er chiffre après la virgule donne les dixièmes.");
});

test("NC02-a et NC02-c : la case entre les deux nombres, les trois signes en grosses touches", () => {
  let egal = 0;
  let longPetit = 0;
  for (const q of tirages("NC02-a", 1200)) {
    const [, x, y] = q.prompt.match(/: (\S+) … (\S+)\.$/);
    const [a, b] = [valeur(x), valeur(y)];
    assert.equal(q.fields[0].answer, a < b ? "<" : a > b ? ">" : "=", q.id);
    assert.ok(a >= 0.1 && a <= 9.9 && b > 0 && b < 10, q.id);
    if (a === b) egal++;
    if ((y.split(",")[1] || "").length > (x.split(",")[1] || "").length && b < a) longPetit++;
    const modele = modeleQuestion(q);
    assert.equal(modele.cas, "comparaison");
    assert.equal(modele.consigne, "Complète avec <, = ou >.");
    assert.equal(modele.modele, `${x} [0] ${y}`);
    assert.deepEqual(symbolesQuestion(q), []);
  }
  assert.ok(egal > 220 && egal < 380, `égalités : ${egal}`);
  assert.ok(longPetit > 300, `le plus long est le plus petit : ${longPetit}`);
  let egalNeg = 0;
  for (const q of tirages("NC02-c", 1200)) {
    const [, x, y] = q.prompt.match(/: (\S+) … (\S+)\.$/);
    const [a, b] = [valeur(x), valeur(y)];
    assert.ok(a < 0 && b < 0, q.id);
    assert.equal(q.fields[0].answer, a < b ? "<" : a > b ? ">" : "=", q.id);
    if (a === b) egalNeg++;
    assert.equal(modeleQuestion(q).cas, "comparaison");
    // Les deux points sur la droite, à leur place : le plus à gauche est le plus petit.
    const croix = [
      ...q.hints[0].svg.matchAll(/<line x1="([\d.]+)"[^>]*stroke="#(?:063f86|f58220)"/g),
    ];
    assert.ok(croix.length >= 2, q.id);
  }
  assert.ok(egalNeg > 90 && egalNeg < 220, `égalités : ${egalNeg}`);
});

test("NC02-b : ranger en touchant les nombres ; même partie entière ; un piège « plus long, plus petit »", () => {
  for (const q of tirages("NC02-b")) {
    const modele = modeleQuestion(q);
    assert.equal(modele.cas, "ranger");
    assert.equal(modele.consigne, "Range dans l'ordre croissant.");
    assert.equal(modele.cartes.length, 3);
    const nombres = modele.cartes.map(valeur);
    const tries = [...nombres].sort((a, b) => a - b);
    assert.deepEqual(
      q.fields.map((c) => valeur(c.answer)),
      tries,
      q.id,
    );
    assert.equal(new Set(modele.cartes.map((c) => c.split(",")[0])).size, 1, q.id);
    const decimales = (c) => (c.split(",")[1] || "").length;
    assert.ok(
      modele.cartes.some((c) =>
        modele.cartes.some((d) => decimales(c) > decimales(d) && valeur(c) < valeur(d)),
      ),
      q.id,
    );
    assert.equal(q.erreurs.length, 5);
  }
  const q = genererQuestion("NC02", "b", 2);
  const decroissant = [...q.fields.map((c) => c.answer)].reverse();
  assert.equal(checkAnswer(q, decroissant).ok, false);
});

test("NC02-d : un nombre décimal strictement entre les bornes, écrit en décimal", () => {
  let centiemes = 0;
  for (const q of tirages("NC02-d", 1200)) {
    const [, x, y] = q.prompt.match(/entre (\S+) et (\S+)\.$/);
    if ((x.split(",")[1] || "").length === 2) centiemes++;
    assert.equal(q.gabarit, `${x} < [0] < ${y}`);
    assert.equal(checkAnswer(q, [q.fields[0].answer]).ok, true);
    assert.equal(checkAnswer(q, [x]).ok, false, `${q.id} : la borne ${x}`);
    assert.equal(checkAnswer(q, [y]).ok, false, `${q.id} : la borne ${y}`);
  }
  assert.ok(centiemes > 220 && centiemes < 380, `au centième : ${centiemes}`);
  const q = genererQuestion("NC02", "d", 1);
  assert.equal(checkAnswer(q, ["0,11"]).ok, true);
  assert.equal(checkAnswer(q, ["0,19999"]).ok, true);
  assert.equal(checkAnswer(q, ["0,2"]).ok, false);
  assert.equal(
    checkAnswer(q, ["(0,1+0,2)/2"]).message,
    "Donne une écriture décimale, avec une virgule si nécessaire.",
  );
});

test("NC03-a et b : l'arrondi, jamais au milieu, la retenue une fois sur cinq, 4 et 4,0", () => {
  for (const [id, nd] of [
    ["NC03-a", 2],
    ["NC03-b", 3],
  ]) {
    let retenue = 0;
    for (const q of tirages(id, 1000)) {
      const x = q.gabarit.replace(" ≈ [0]", "");
      const dec = x.split(",")[1];
      assert.equal(dec.length, nd, q.id);
      assert.ok(!["0", "5"].includes(dec.at(-1)), q.id);
      const p = 10 ** (nd - 1);
      const attendu = Math.round(valeur(x) * p) / p;
      assert.ok(
        proche(valeur(q.fields[0].answer), attendu),
        `${q.id} : ${x} → ${q.fields[0].answer}`,
      );
      if (dec.at(-2) === "9" && Number(dec.at(-1)) > 5) retenue++;
      // L'aide écrit les deux arrondis possibles : jamais lequel est le bon.
      assert.match(q.hints[0].text, /^(Les deux arrondis|Le même dessin)/);
    }
    assert.ok(retenue > 150 && retenue < 300, `${id} : retenue ${retenue} sur 1000`);
  }
  const q = tirages("NC03-a", 1000).find((x) => /^\d+,9[6-9] ≈/.test(x.gabarit));
  const entier = q.fields[0].answer;
  assert.equal(checkAnswer(q, [entier]).ok, true);
  assert.equal(checkAnswer(q, [`${entier},0`]).ok, true);
  assert.match(q.bonne, /\(ou \d+,0\)$/);
});

test("NC03-c : quatre choix séparés par × 10, le bon est le produit des nombres proches", () => {
  for (const q of tirages("NC03-c")) {
    const [, a, b] = q.prompt.match(/de (\S+) × (\S+) \?/);
    const choix = q.fields[0].options.map(valeur);
    for (let i = 1; i < 4; i++) assert.equal(choix[i], choix[i - 1] * 10);
    assert.equal(valeur(q.fields[0].answer), Math.round(valeur(a)) * Math.round(valeur(b)), q.id);
    assert.ok(Math.round(valeur(a)) % 10 === 0 && Math.round(valeur(b)) <= 9);
    // L'aide : des cases vides ; l'indice les remplit (et prend sa place).
    assert.ok(!textes(q.hints[0].svg).includes(String(Math.round(valeur(b)))), q.id);
  }
});

test("NC03-d : un tiers juste, deux tiers une vraie erreur d'élève", () => {
  let justes = 0;
  const modes = { droite: 0, dixiemes: 0, produit: 0 };
  for (const q of tirages("NC03-d", 1200)) {
    const [, x, y, z] = q.math.match(/^(\S+) \+ (\S+) = (\S+)$/);
    const somme = valeur(x) + valeur(y);
    const juste = proche(valeur(z), somme);
    assert.equal(q.fields[0].answer, juste ? "Oui" : "Non", q.id);
    if (juste) justes++;
    else if (/aligné les chiffres à droite/.test(q.explication.etapes.join(" "))) modes.droite++;
    else if (/à part/.test(q.explication.etapes.join(" "))) modes.dixiemes++;
    else modes.produit++;
    assert.ok(valeur(x) >= 1.1 && valeur(x) <= 8.9 && valeur(y) >= 1.1 && valeur(y) <= 8.99, q.id);
  }
  assert.ok(justes > 330 && justes < 470, `justes : ${justes}`);
  for (const [mode, n] of Object.entries(modes)) assert.ok(n > 180, `${mode} : ${n}`);
  const q = genererQuestion("NC03", "d", 1);
  assert.equal(q.prompt, "Lina a écrit ce calcul. Est-il juste ?");
});

test("NC-2 dans la coque : dessin puis phrase, explication, cours avec son tableau", () => {
  const a = genererQuestion("NC01", "a", 70145);
  const aide = aideHTML(a, { aideOuverte: true });
  assert.ok(aide.indexOf('class="dessin"') < aide.indexOf("Je place"), aide);
  const explication = explicationHTML(a);
  assert.match(explication, /<ol class="etapes">/);
  assert.equal(
    a.explication.etapes[0],
    "52,738\u00a0: 5 dizaines, 2 unités, 7 dixièmes, 3 centièmes, 8 millièmes.",
  );
  const cours = coursHTML({}, a, "");
  assert.match(cours, /class="morceau actif">\s*<h3>Chaque chiffre a son rang/);
  assert.match(cours, /aria-label="tableau de numération"/);
  // NC03-c : l'indice remplit les cases et prend la place de l'aide.
  const c = genererQuestion("NC03", "c", 1);
  const indice = aideHTML(c, { aideOuverte: true, etape: true });
  assert.equal((indice.match(/class="dessin"/g) || []).length, 1);
  assert.match(indice, /a-la-place/);
});
