// Lot NC-1 (24/10/2026) : NC17 et NC18 écrites d'après le cahier « Nombres et calculs », partie 1.
// Ce que le cahier fixe et qui se vérifie sans navigateur : les bornes des tirages, la bonne réponse
// acceptée, chaque erreur connue refusée avec sa phrase, la réponse jamais écrite sur l'aide, des
// dessins de 340 px au plus, un morceau de cours par question, le vocabulaire.
import test from "node:test";
import assert from "node:assert/strict";
import { genererQuestion, formesCahier, formesDisponibles } from "../automatismes/moteur.js";
import { checkAnswer } from "../automatismes/core.js";
import { symbolesQuestion, modeleQuestion } from "../automatismes/champs.js";
import { aideHTML, explicationHTML, bonneReponseTexte, coursHTML } from "../automatismes/vues.js";

const GRAINES = 400;
const tirages = (id, n = GRAINES) => {
  const [famille, forme] = id.split("-");
  return Array.from({ length: n }, (_, i) => genererQuestion(famille, forme, i * 7919 + 1));
};
const textes = (svg) => [...String(svg).matchAll(/>([^<]*)<\/text>/g)].map((m) => m[1]);
const nombreDe = (texte) => Number(String(texte).replace(/\s/g, ""));
const somme = (n) => [...String(n)].reduce((s, c) => s + Number(c), 0);
const premier = (n) =>
  n > 1 && [...Array(Math.floor(Math.sqrt(n)) + 1).keys()].slice(2).every((d) => n % d);

test("13 formes du cahier : NC17-a à f, NC18-a à g", () => {
  assert.deepEqual(formesDisponibles("NC17"), ["a", "b", "c", "d", "e", "f"]);
  assert.deepEqual(formesDisponibles("NC18"), ["a", "b", "c", "d", "e", "f", "g"]);
  assert.equal(formesCahier.size, 13);
});

test("chaque tirage : bonne réponse acceptée, erreurs connues refusées, explication, cours", () => {
  for (const id of formesCahier) {
    for (const q of tirages(id)) {
      const contexte = `${q.id}`;
      const reponses = q.fields.map((champ) => champ.answer);
      assert.equal(checkAnswer(q, reponses).ok, true, `${contexte} : ${reponses}`);
      assert.ok(q.cahier && q.pastille, contexte);
      assert.ok(q.hints[0].svg.startsWith("<svg"), `${contexte} : un dessin d'aide`);
      assert.ok(q.hints[1].text || q.hints[1].svg, `${contexte} : « Encore un indice »`);
      assert.ok(q.explication.etapes.length || q.explication.calc.length, contexte);
      for (const erreur of q.erreurs) {
        const essai = [].concat(erreur.reponse);
        assert.equal(checkAnswer(q, essai).ok, false, `${contexte} : ${essai} refusé`);
        assert.ok(erreur.phrase.length > 10, contexte);
      }
      // Le morceau de cours de la question existe (encadré en haut de la fenêtre).
      assert.ok(
        q.course.morceaux.some((m) => m.formes.includes(q.forme)),
        contexte,
      );
      const tout = JSON.stringify(q);
      assert.doesNotMatch(tout, /dernier chiffre|signes? moins/i, contexte);
      assert.doesNotMatch(tout, /undefined|\bNaN\b/, contexte);
      // Les dessins tiennent dans 340 px.
      for (const svg of [q.hints[0].svg, q.hints[1].svg, q.explication.svg]) {
        const largeur = Number(String(svg).match(/width="([\d.]+)"/)?.[1] || 0);
        assert.ok(largeur <= 340, `${contexte} : dessin de ${largeur} px`);
      }
    }
  }
});

test("NC17-a : cases à cocher, « Aucun » environ une fois sur six, tout ou rien", () => {
  let aucun = 0;
  for (const q of tirages("NC17-a", 1200)) {
    const n = nombreDe(q.math);
    assert.ok(n >= 100 && n <= 99998, q.id);
    const champ = q.fields[0];
    assert.deepEqual(champ.options, ["2", "5", "10", "Aucun"]);
    assert.equal(champ.multiple, true);
    if (champ.answer === "Aucun") aucun++;
    // Tout ou rien : une seule bonne case de trop ou de moins est fausse.
    assert.equal(q.erreurs.length, 7, q.id);
    assert.equal(symbolesQuestion(q).length, 0, "pas de clavier");
  }
  assert.ok(aucun > 120 && aucun < 290, `« Aucun » : ${aucun} sur 1200`);
  const q = genererQuestion("NC17", "a", 3);
  assert.equal(checkAnswer(q, ["2 ; 5"]).ok, false);
});

test("NC17-b : un « Non » sur deux pour 9 est divisible par 3", () => {
  let non9 = 0;
  let piege = 0;
  for (const q of tirages("NC17-b", 1200)) {
    const n = nombreDe(q.math);
    const k = Number(q.prompt.match(/par (\d)/)[1]);
    assert.ok(n >= 100 && n <= 9999);
    assert.equal(q.fields[0].answer, somme(n) % k === 0 ? "Oui" : "Non", q.id);
    if (k === 9 && q.fields[0].answer === "Non") {
      non9++;
      if (somme(n) % 3 === 0) piege++;
    }
  }
  assert.ok(piege / non9 > 0.35 && piege / non9 < 0.65, `${piege} pièges sur ${non9}`);
});

test("NC17-c : la case dans le nombre, toutes les bonnes réponses acceptées", () => {
  for (const q of tirages("NC17-c")) {
    assert.match(q.gabarit, /^\d+\[0\]\d+$/);
    const k = Number(q.prompt.match(/par (\d)/)[1]);
    const connu = somme(q.gabarit.replace("[0]", ""));
    assert.notEqual(connu % k, 0, q.id);
    for (let c = 0; c <= 9; c++)
      assert.equal(checkAnswer(q, [String(c)]).ok, (connu + c) % k === 0, `${q.id} : ${c}`);
    assert.equal(checkAnswer(q, ["12"]).ok, false);
    assert.equal(modeleQuestion(q).cas, "gabarit");
    // L'aide laisse la somme à trouver (□), l'explication la donne.
    assert.ok(!textes(q.hints[0].svg).includes(String(connu + Number(q.fields[0].answer))), q.id);
  }
});

test("NC17-d : nombre de chiffres, chiffre des unités, somme ; la phrase quand seule la somme rate", () => {
  for (const q of tirages("NC17-d")) {
    const c = q.check;
    const ex = q.fields[0].answer;
    assert.equal(ex.length, c.digits);
    assert.equal(somme(ex) % c.sumDivisor, 0);
    assert.doesNotMatch(q.hints[0].svg, new RegExp(`>${ex}<`));
  }
  const q = tirages("NC17-d").find(
    (x) => x.check.lastDigit === 4 && x.check.digits === 4 && x.check.sumDivisor === 3,
  );
  const resultat = checkAnswer(q, ["1234"]);
  assert.equal(resultat.ok, false);
  assert.equal(resultat.message, "1 + 2 + 3 + 4 = 10 : pas dans la table de 3.");
  assert.equal(checkAnswer(q, ["1 014"]).ok, true);
  assert.equal(checkAnswer(q, ["9 984"]).ok, true);
  assert.equal(checkAnswer(q, ["0114"]).ok, false, "un nombre ne commence pas par 0");
});

test("NC17-e : une phrase juste, deux vraies erreurs d'élèves, en colonne", () => {
  for (const q of tirages("NC17-e")) {
    const champ = q.fields[0];
    assert.equal(champ.options.length, 3);
    assert.equal(champ.colonne, true);
    assert.match(champ.answer, /= \d+, et \d+ est dans la table de [39]\.$/);
    assert.equal(q.erreurs.length, 2);
  }
});

test("NC17-f : un seul multiple de 3, un piège qui finit par 3 ou 9", () => {
  for (const q of tirages("NC17-f")) {
    const nombres = q.fields[0].options.map(Number);
    assert.equal(new Set(nombres).size, 4);
    assert.equal(nombres.filter((n) => n % 3 === 0).length, 1, q.id);
    assert.ok(nombres.every((n) => n >= 100 && n <= 999));
    assert.ok(
      nombres.some((n) => n % 3 && [3, 9].includes(n % 10)),
      q.id,
    );
  }
});

test("NC18-a : la liste, la touche « ; », les diviseurs qui manquent", () => {
  for (const q of tirages("NC18-a")) {
    const n = Number(q.prompt.match(/de (\d+)/)[1]);
    assert.ok([12, 18, 20, 24, 28, 30, 36, 40, 42, 48].includes(n));
    assert.deepEqual(symbolesQuestion(q), ["−", "/", ";"]);
    // L'aide n'écrit aucun diviseur à trouver : 1 × n, puis des cases vides.
    const autorises = new Set(["1", "2", "3", "4", "5", "×", `= ${n}`, String(n), "⋮"]);
    for (const texte of textes(q.hints[0].svg))
      assert.ok(autorises.has(texte) || /^si la division/.test(texte), `${q.id} : « ${texte} »`);
  }
  const q = tirages("NC18-a").find((x) => x.prompt.includes(" 40."));
  assert.equal(checkAnswer(q, ["1;2;4;5;8;10;20;40"]).ok, true);
  assert.equal(
    checkAnswer(q, ["1 ; 2 ; 4 ; 5 ; 8"]).message,
    "Il manque des diviseurs : 10, 20 et 40 (l’autre nombre de chaque paire).",
  );
});

test("NC18-b : jamais premier, tout diviseur accepté sauf 1 et le nombre", () => {
  for (const q of tirages("NC18-b")) {
    const n = q.check.number;
    assert.ok(n >= 100 && n <= 500 && !premier(n));
    for (let d = 2; d < n; d++) if (n % d === 0) assert.equal(checkAnswer(q, [String(d)]).ok, true);
    assert.equal(checkAnswer(q, ["1"]).ok, false);
    assert.equal(checkAnswer(q, [String(n)]).ok, false);
  }
  const q = tirages("NC18-b").find((x) => x.check.number % 7);
  assert.equal(checkAnswer(q, ["7"]).message, `${q.check.number} ÷ 7 ne tombe pas juste.`);
});

test("NC18-c : produit de facteurs premiers, ordre libre, puissances permises", () => {
  for (const q of tirages("NC18-c")) {
    const n = q.check.number;
    assert.ok(n >= 12 && n <= 500);
    const fs = q.fields[0].answer.split(" × ").map(Number);
    assert.ok(
      fs.length >= 2 && fs.length <= 5 && fs.every((p) => [2, 3, 5, 7, 11, 13].includes(p)),
    );
    assert.ok(fs.some((p) => p <= 5));
    assert.equal(checkAnswer(q, [[...fs].reverse().join("×")]).ok, true);
    assert.deepEqual(symbolesQuestion(q), ["−", "/", "×", "²"]);
  }
  const q = {
    check: { type: "property", rule: "primeFactors", number: 390 },
    fields: [{ kind: "text" }],
  };
  assert.equal(checkAnswer(q, ["2 × 3 × 5 × 13"]).ok, true);
  assert.equal(checkAnswer(q, ["13 x 5 x 3 x 2"]).ok, true);
  assert.equal(checkAnswer(q, ["390 = 2 × 3 × 5 × 13"]).ok, true);
  assert.equal(
    checkAnswer(q, ["2 × 195"]).message,
    "195 n’est pas premier : continue la décomposition.",
  );
  assert.equal(checkAnswer(q, ["2 × 3 × 5 × 11"]).ok, false);
  const q60 = { ...q, check: { ...q.check, number: 60 } };
  assert.equal(checkAnswer(q60, ["2² × 3 × 5"]).ok, true);
  assert.equal(checkAnswer(q60, ["2^2*3*5"]).ok, true);
});

test("NC18-d : deux cases dans l'égalité, le reste plus petit que le diviseur", () => {
  let zeros = 0;
  for (const q of tirages("NC18-d", 1000)) {
    const [quotient, reste] = q.fields.map((c) => Number(c.answer));
    const d = Number(q.prompt.match(/par (\d+)/)[1]);
    assert.ok(d >= 2 && d <= 9 && quotient >= 2 && quotient <= 12 && reste < d);
    if (reste === 0) zeros++;
    assert.equal(textes(q.hints[0].svg).length, 0, "l'aide ne dit rien, on compte");
    const [faux] = q.erreurs;
    assert.equal(checkAnswer(q, faux.reponse).ok, false);
    assert.match(
      bonneReponseTexte(q, modeleQuestion(q)),
      new RegExp(`= ${d} × ${quotient} \\+ ${reste}$`),
    );
  }
  assert.ok(zeros > 140 && zeros < 260, `reste 0 : ${zeros} sur 1000`);
});

test("NC18-e : un premier, 1, un carré impair, un multiple de 3", () => {
  for (const q of tirages("NC18-e")) {
    const nombres = q.fields[0].options.map(Number);
    assert.equal(nombres.filter(premier).length, 1, q.id);
    assert.ok(nombres.includes(1));
  }
});

test("NC18-f et g : plus grand diviseur, plus petit multiple ; l'aide ne donne pas la réponse", () => {
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
  for (const q of tirages("NC18-f")) {
    const [a, b] = q.prompt.match(/\d+/g).map(Number);
    assert.ok(a <= 100 && b <= 100 && a % b && b % a);
    assert.equal(Number(q.fields[0].answer), pgcd(a, b));
    assert.ok(!textes(q.hints[0].svg).includes(q.fields[0].answer), q.id);
  }
  for (const q of tirages("NC18-g")) {
    const [a, b] = q.prompt.match(/\d+/g).map(Number);
    const L = (a * b) / pgcd(a, b);
    assert.ok(a <= 15 && b <= 15 && L <= 120 && a % b && b % a);
    assert.equal(Number(q.fields[0].answer), L);
    for (const erreur of q.erreurs)
      assert.ok(Number(erreur.reponse) % L === 0 && Number(erreur.reponse) > L);
  }
});

test("la coque lit le cahier : dessin puis phrase, indice dessiné, calculs alignés, cours dessiné", () => {
  const q = genererQuestion("NC18", "a", 5);
  const aide = aideHTML(q, { aideOuverte: true, etape: true });
  assert.ok(aide.indexOf('<div class="dessin">') < aide.indexOf("Continue jusqu"), aide);
  // L'indice dessiné de NC18-a est le même tableau, une ligne barrée : il remplace celui de l'aide.
  assert.equal((aide.match(/class="dessin"/g) || []).length, 1, "l'indice remplace l'aide");
  const g = genererQuestion("NC18", "g", 5);
  const aideG = aideHTML(g, { aideOuverte: true, etape: true });
  assert.equal((aideG.match(/class="dessin"/g) || []).length, 2, "la droite, puis les ovales");
  const c = genererQuestion("NC18", "c", 5);
  const explication = explicationHTML(c);
  assert.match(explication, /<table class="calculs">/);
  assert.match(explication, /<ol class="etapes">/);
  const cours = coursHTML({ cours: {} }, c, "ENTIER");
  assert.match(cours, /class="morceau actif">\s*<h3>Décomposer en facteurs premiers/);
  const a = genererQuestion("NC17", "a", 5);
  assert.match(coursHTML({}, a, ""), /<b>et<\/b>/);
  assert.equal(bonneReponseTexte(a, modeleQuestion(a)), a.bonne);
  assert.equal(bonneReponseTexte(a, modeleQuestion(a), true), a.fields[0].answer);
});
