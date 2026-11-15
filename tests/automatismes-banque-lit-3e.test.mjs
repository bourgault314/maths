// La banque du calcul littéral de 3e (passe 1, lot B1, 15/11/2026) : des questions sans aide ni cours,
// avec leurs erreurs attendues calculées, qui savent faire les deux formats (réponse tapée et QCM).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkAnswer, rng } from "../automatismes/core.js";
import { genererQuestion, formesBanque, formesDisponibles } from "../automatismes/moteur.js";
import { genererBanque, versionQcm } from "../automatismes/generateurs/banque-lit.js";
import { erreurConnue } from "../automatismes/champs.js";
import { mathHtml } from "../automatismes/math-format.js";
import { questionPrompt } from "../automatismes/math-layout.js";
import { actionsHTML, outilsHTML } from "../automatismes/vues.js";

const catalogue = JSON.parse(
  readFileSync(new URL("../automatismes/catalogue/catalogue.json", import.meta.url)),
);
const menu = JSON.parse(
  readFileSync(new URL("../automatismes/catalogue/menu.json", import.meta.url)),
);
const parId = Object.fromEntries(catalogue.map((carte) => [carte.id, carte]));
const BANQUE = [...formesBanque];
const QCM = new Set(["NC19-g", "NC20-h", "NC21-g", "NC23-e"]);

// Les tirages d'une forme : par niveau (1, 2, 3) et par la série (niveau tiré au hasard).
function* tirages(id, nombre = 60) {
  for (const niveau of [1, 2, 3])
    for (let graine = 1; graine <= nombre; graine++) {
      const q = genererBanque(id, rng(graine * 7 + niveau), niveau);
      const [famille, forme] = id.split("-");
      yield { ...q, famille, forme, id: `${id}@n${niveau}g${graine}` };
    }
}

test("les sept formes de la banque : dans le moteur, au catalogue, au menu", () => {
  assert.deepEqual(BANQUE.sort(), [
    "NC19-f",
    "NC19-g",
    "NC19-h",
    "NC20-g",
    "NC20-h",
    "NC21-g",
    "NC23-e",
  ]);
  for (const id of BANQUE) {
    const [famille, forme] = id.split("-");
    assert.ok(formesDisponibles(famille).includes(forme), id);
    const carte = parId[famille].formes.find((f) => f.id === forme);
    assert.ok(carte, `${id} au catalogue`);
    assert.equal(carte.banque, "lit-3e");
    assert.deepEqual(carte.formats, QCM.has(id) ? ["qcm"] : ["tapee", "qcm"]);
    assert.equal(carte.reponseType, QCM.has(id) ? "qcm" : "expression");
    // Une ligne du menu au moins la propose (export_menu.py relancé).
    assert.ok(
      menu.lignes.some((ligne) => ligne.questions.includes(id)),
      `${id} dans une ligne de menu.json`,
    );
  }
});

test("les lignes de la leçon 3e LIT : plus aucune ligne sans question, et les familles à créer y sont", () => {
  const lecon = menu.lecons.find((l) => l.niveau === "3e" && l.code === "LIT");
  const parLigne = Object.fromEntries(menu.lignes.map((l) => [l.id, l]));
  for (const id of lecon.lignes) assert.ok(parLigne[id].questions.length, `${id} jouable`);
  // Les cinq familles « à créer » de la leçon et leur forme dans la banque.
  for (const [ligne, forme] of [
    ["3e-11", "NC19-h"], // Les 0 et les 1
    ["3e-13", "NC19-g"], // Carré d'une somme ou somme de carrés ?
    ["3e-2026-O011", "NC23-e"], // Simple, double ou aucune ?
    ["3e-2026-O010", "NC20-h"], // Facteur commun ou terme commun ?
    ["3e-2020-O033", "NC21-g"], // Équation ou identité ?
  ])
    assert.ok(parLigne[ligne].questions.includes(forme), `${forme} sous ${ligne}`);
  for (const [ligne, forme] of [
    ["3e-16", "NC20-g"],
    ["2027-A2", "NC19-h"],
    ["DNB-11", "NC20-g"],
    ["DNB-11", "NC19-h"],
  ])
    assert.ok(parLigne[ligne].questions.includes(forme), `${forme} sous ${ligne}`);
});

test("chaque tirage : la bonne réponse acceptée, chaque erreur attendue refusée et nommée", () => {
  for (const id of BANQUE)
    for (const q of tirages(id)) {
      const famille = parId[q.famille];
      const bonne = q.fields.map((champ) => champ.answer);
      assert.equal(checkAnswer(q, bonne).ok, true, `${q.id} : ${bonne}`);
      assert.equal(erreurConnue(q, bonne, famille), null, q.id);
      assert.ok(q.erreurs.length >= 1 && q.erreurs.length <= 3, `${q.id} : ${q.erreurs.length}`);
      const vues = new Set();
      for (const erreur of q.erreurs) {
        const essai = [].concat(erreur.reponse);
        assert.equal(checkAnswer(q, essai).ok, false, `${q.id} : ${essai} refusé`);
        assert.equal(erreurConnue(q, essai, famille), erreur.phrase, `${q.id} : ${essai} nommée`);
        assert.ok(erreur.phrase.length > 10, q.id);
        assert.ok(!vues.has(erreur.reponse), `${q.id} : erreur en double`);
        vues.add(erreur.reponse);
      }
      assert.equal(q.hints.length, 0, `${q.id} : pas d'aide avant la passe 2`);
      assert.ok(q.solution && q.bonne, q.id);
      assert.equal(q.niveau, Number(q.id.match(/@n(\d)/)[1]));
    }
});

test("réponse tapée : une erreur écrite autrement est nommée, la bonne valeur mal écrite est refusée", () => {
  for (const id of ["NC19-f", "NC19-h", "NC20-g"])
    for (const q of tirages(id, 30))
      for (const erreur of q.erreurs) {
        // Sans espaces, avec * pour × : la même erreur.
        const autre = erreur.reponse.replace(/ /g, "").replace(/×/g, "*");
        assert.equal(
          erreurConnue(q, [autre], parId[q.famille]),
          erreur.phrase,
          `${q.id} : ${autre}`,
        );
      }
  // « 10a + a² » au lieu de « a² + 10a » : par sa valeur, la même erreur.
  let q;
  for (let g = 1; !q; g++) {
    const t = genererBanque("NC19-h", rng(g), 3);
    if (t.erreurs.some((e) => /² \+ \d+[a-z]$/.test(e.reponse))) q = { ...t, famille: "NC19" };
  }
  const erreur = q.erreurs.find((e) => /² \+ \d+[a-z]$/.test(e.reponse));
  const [carre, lineaire] = erreur.reponse.split(" + ");
  assert.equal(erreurConnue(q, [`${lineaire} + ${carre}`], parId.NC19), erreur.phrase);
  // La bonne valeur, pas la bonne écriture : la case reste rouge avec la phrase du moteur.
  for (const id of ["NC19-h", "NC20-g"])
    for (const q of tirages(id, 30)) {
      const enonce = q.gabarit.replace(/ = \[0\]$/, "");
      if (enonce === q.fields[0].answer) continue;
      const resultat = checkAnswer(q, [enonce]);
      assert.equal(resultat.ok, false, `${q.id} : ${enonce}`);
      assert.match(
        resultat.message,
        /La valeur est juste\. Écris-la le plus simplement possible\./,
      );
    }
  const simple = genererBanque("NC19-h", rng(3), 1);
  for (const [ecrit, ok] of [
    ["x", true],
    ["1x", false],
    ["x + 0", false],
    ["1 × x", false],
    ["0x", false],
  ]) {
    const q = {
      ...simple,
      check: { type: "expression", values: ["x"], form: "simple" },
      fields: [{ ...simple.fields[0], answer: "x" }],
    };
    assert.equal(checkAnswer(q, [ecrit]).ok, ok, ecrit);
  }
});

test("les deux formats : la version QCM propose la bonne réponse et les erreurs attendues", () => {
  for (const id of BANQUE)
    for (const q of tirages(id, 20)) {
      const qcm = versionQcm(q, rng(5));
      const options = qcm.fields[0].options;
      assert.ok(options.length >= 2 && options.length <= 4, `${q.id} : ${options.length}`);
      assert.equal(new Set(options).size, options.length, q.id);
      const bonne = qcm.fields[0].answer;
      assert.ok(options.includes(bonne), q.id);
      assert.equal(checkAnswer(qcm, [bonne]).ok, true, q.id);
      for (const erreur of q.erreurs) {
        assert.ok(options.includes(erreur.reponse), `${q.id} : ${erreur.reponse} proposé`);
        assert.equal(checkAnswer(qcm, [erreur.reponse]).ok, false, q.id);
        assert.equal(erreurConnue(qcm, [erreur.reponse], parId[q.famille]), erreur.phrase, q.id);
      }
      if (!QCM.has(id)) assert.ok(qcm.prompt !== q.prompt && !qcm.gabarit, q.id);
    }
});

test("bornes : des entiers, ni 1x ni 0x ni signes doublés, et toutes les variantes tombent", () => {
  for (const id of BANQUE) {
    const variantes = new Set();
    for (const q of tirages(id, 80)) {
      const textes = [
        q.prompt,
        q.math,
        q.gabarit || "",
        q.bonne,
        ...q.fields.flatMap((c) => [c.answer, ...(c.options || [])]),
        ...q.erreurs.flatMap((e) => [e.reponse, e.phrase]),
        q.visual.replace(/<[^>]*>/g, " "),
      ].join(" | ");
      assert.doesNotMatch(textes, /undefined|NaN|Infinity|\[object/, q.id);
      assert.doesNotMatch(textes, /\d[.,]\d/, `${q.id} : pas de décimal`);
      assert.doesNotMatch(textes, /(^|[^\d,])1[a-z](?![a-zé])/i, `${q.id} : « 1x » : ${textes}`);
      assert.doesNotMatch(textes, /(^|[ (−+])0[a-z]/, `${q.id} : « 0x »`);
      assert.doesNotMatch(textes, /[+−-] [+−-]|−−|\+\+/, `${q.id} : signes doublés`);
      assert.doesNotMatch(textes, /dernier chiffre|signes? moins/i, q.id);
      variantes.add(q.gabarit || q.math || q.prompt + q.fields[0].answer);
    }
    assert.ok(variantes.size >= 30, `${id} : ${variantes.size} énoncés différents`);
  }
  // Le niveau tiré au hasard par la série : les trois niveaux tombent.
  for (const id of BANQUE) {
    const [famille, forme] = id.split("-");
    const niveaux = new Set();
    for (let graine = 1; graine <= 60; graine++)
      niveaux.add(genererQuestion(famille, forme, graine).niveau);
    assert.deepEqual([...niveaux].sort(), [1, 2, 3], id);
  }
});

test("déterminisme : la même graine redonne la même question", () => {
  for (const id of BANQUE) {
    const [famille, forme] = id.split("-");
    for (const graine of [1, 2, 977, 2147483647])
      assert.deepEqual(
        genererQuestion(famille, forme, graine),
        genererQuestion(famille, forme, graine),
      );
  }
});

test("ponctuation et vocabulaire : espaces insécables, lettres rondes seulement dans les calculs", () => {
  for (const id of BANQUE)
    for (const q of tirages(id, 40)) {
      const textes = [
        questionPrompt(q),
        ...q.erreurs.map((e) => mathHtml(e.phrase)),
        mathHtml(q.bonne),
      ];
      for (const brut of textes) {
        // Les lettres rondes (spans internes) ne comptent pas : seul le bloc du calcul, insécable.
        const html = brut.replace(/<span class="math-variable"[^>]*>([^<]*)<\/span>/g, "$1");
        // Aucun signe ne part seul au début de la ligne suivante.
        assert.doesNotMatch(html, / [?!:;»]/, `${q.id} : ${html.slice(0, 120)}`);
        assert.doesNotMatch(
          html,
          /<\/span>(?:[  ]?[?!:;»]|[.,…])/,
          `${q.id} : ${html.slice(0, 120)}`,
        );
      }
      // Une lettre dans un mot (« faut-il », « il n'y a ») ne devient jamais une variable.
      for (const texte of [q.prompt, ...(q.fields[0].options || [])]) {
        const mots = texte.replace(/[−+×=()²³/\d]/g, " ");
        for (const m of mathHtml(texte).matchAll(/math-variable[^>]*>([^<]*)</g))
          assert.ok(
            new RegExp(`(^|[\\s:,])${m[1]}(?=[\\s.,:?]|$)`).test(mots),
            `${q.id} : « ${m[1]} » dans « ${texte} »`,
          );
      }
    }
});

test("la coque : « Aide à venir », pas de « Voir l'explication » vide, aide fermée au diaporama", () => {
  const q = genererQuestion("NC20", "g", 4);
  const seance = { mode: "train", questions: [q], index: 0, options: {} };
  assert.match(outilsHTML(seance, { terminee: false }), /Aide à venir/);
  const apres = actionsHTML(seance, { terminee: true, juste: false });
  assert.doesNotMatch(apres, /Voir l’explication/);
  assert.match(apres, /Question suivante|Voir le bilan/);
  const projetee = actionsHTML({ ...seance, mode: "project" }, { terminee: false });
  assert.match(projetee, /<button[^>]*disabled[^>]*>Aide à venir/);
  // Une question de GPT garde tout.
  const ancienne = genererQuestion("NC20", "a", 4);
  const s2 = { ...seance, questions: [ancienne] };
  assert.match(actionsHTML(s2, { terminee: true, juste: false }), /Voir l’explication/);
  assert.match(actionsHTML({ ...s2, mode: "project" }, { terminee: false }), />Aide</);
});
