// Exerciseur de conversions (outils/conversions/conversions_exerciseur.html), lot 1 « l'urgent » (21/11/2026) :
// calcul exact, tableau qui ne perd plus de chiffres, restes positifs, partages justes, « L ↔ m³ » avec des litres,
// ordres de grandeur sans doublon ni faux vrai/faux, français, valeurs vraisemblables, tirage d'une série.
// Lot 2 (21/11/2026) : le lien de partage (« ?cases=…&niveaux=…&questions=…&serie=… ») et l'écran d'ordinateur.
// Le script de la page est joué dans node:vm, sans navigateur.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../outils/conversions/conversions_exerciseur.html", import.meta.url), "utf8");
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function page() {
  const ctx = vm.createContext({ document: { addEventListener() {}, getElementById() { return null; } }, console, URLSearchParams });
  vm.runInContext(`${script}\n;globalThis.__x = { SCHEMAS, EST_DB, ACTIONS_DB, PONTS_DB, TRI_DB, PROBLEMES, FRISE_EMOJIS, setSeed, decaler, ecrire, typo, valeurDe, buildQuestionLogic, buildProblemLogic, buildEstimationLogic, tirerSerie, chiffresDuTableau, vueColonnesUtiles, lireLien, ecrireLien, CASES_LIEN };`, ctx);
  return ctx.__x;
}
const P = page();
const sansBalises = (s) => String(s).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/ /g, " ");
const TYPES = ["length", "mass", "massT", "volL", "area", "volM3", "cross"];
const FAMILLES = ["add", "sub", "mult", "div", "frac", "geom"];
const EST = ["est_grandeur", "est_unit", "est_val", "est_obj", "est_tf", "est_action", "est_pont", "est_assoc", "est_trou", "est_tri"];

// calcul de référence, indépendant de la page : BigInt
function reference(val, decalage) {
  const [e, d = ""] = val.split(",");
  let n = BigInt(e + d), exp = decalage - d.length;
  if (exp >= 0) return (n * 10n ** BigInt(exp)).toString();
  const s = n.toString().padStart(-exp + 1, "0");
  const ent = s.slice(0, s.length + exp), dec = s.slice(s.length + exp).replace(/0+$/, "");
  return dec ? `${ent},${dec}` : ent;
}

test("le calcul exact : décaler la virgule et écrire à la française", () => {
  assert.equal(P.decaler("0,007", -6), "0,000000007");
  assert.equal(P.decaler("4567", 3), "4567000");
  assert.equal(P.decaler("45,30", 1), "453");
  assert.equal(P.decaler("2,2", 2), "220");
  assert.equal(P.ecrire("3867000"), "3 867 000");
  assert.equal(P.ecrire("1000"), "1 000");
  assert.equal(P.ecrire("0,000000007"), "0,000 000 007");
  assert.equal(P.ecrire("12,5"), "12,5");
  assert.equal(P.typo("Combien en <strong>12 cm</strong> ?"), "Combien en <strong>12 cm</strong> ?");
});

test("conversions : 0 réponse fausse, 0 point, 0 « e- », et tous les chiffres dans le tableau (9 000 tirages par type)", () => {
  for (const t of TYPES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`T${t}${lvl}`);
    for (let i = 0; i < 3000; i++) {
      const q = P.buildQuestionLogic(t, lvl);
      const attendu = reference(q.valStr, q.targetPos - q.sourcePos);
      assert.equal(q.calcValStr, attendu, `${q.valStr} ${q.sourceUnit} → ${q.targetUnit}`);
      assert.doesNotMatch(q.calcValStr + q.valStr, /[.e]/);
      const total = q.schema.units.length * q.schema.slots;
      const plein = P.chiffresDuTableau(q, true);
      assert.equal(plein.length, total);
      // les chiffres lus dans le tableau, de part et d'autre de la case de l'unité visée, redonnent la réponse
      const ent = plein.slice(0, q.targetPos + 1).join("").replace(/^0+(?=\d)/, "");
      const dec = plein.slice(q.targetPos + 1).join("").replace(/0+$/, "");
      assert.equal(dec ? `${ent},${dec}` : ent, q.calcValStr, `${q.valStr} ${q.sourceUnit} → ${q.calcValStr} ${q.targetUnit}`);
      const depart = P.chiffresDuTableau(q, false).join("");
      assert.equal(depart, q.valStr.replace(",", ""), "le nombre de départ est entier dans le tableau");
      assert.equal(q.schema.units[Math.floor(q.sourcePos / q.schema.slots)] === q.sourceUnit || Object.values(q.schema.labels || {}).includes(q.sourceUnit), true);
    }
  }
});

test("« L ↔ m³ » pose toujours un litre d'un côté et un m³, dm³ ou cm³ de l'autre", () => {
  P.setSeed("LITRES");
  for (const lvl of [1, 2, 3]) for (let i = 0; i < 3000; i++) {
    const q = P.buildQuestionLogic("cross", lvl);
    const u = [q.sourceUnit, q.targetUnit];
    assert.ok(u.some((x) => /L$/.test(x)) && u.some((x) => /³$/.test(x)), u.join(" → "));
    if (lvl === 1) assert.ok(q.targetPos >= q.sourcePos, "niveau 1 : jamais vers une unité plus grande");
  }
});

test("le tableau s'élargit : 4 567 km en m et 461 hm en dam gardent tous leurs chiffres", () => {
  const cas = (val, src, tgt) => {
    const ctx = vm.createContext({ document: { addEventListener() {}, getElementById() { return null; } } });
    vm.runInContext(`${script}\n;globalThis.__q = questionDeConversion(SCHEMAS.length, "${val}", "${src}", "${tgt}", posUnite(SCHEMAS.length, "${src}"), posUnite(SCHEMAS.length, "${tgt}"));`, ctx);
    return ctx.__q;
  };
  const k = cas("4567", "km", "m");
  assert.equal(k.calcValStr, "4567000");
  assert.equal(k.schema.units.length, 10, "3 colonnes ajoutées à gauche");
  assert.equal(k.schema.units.slice(0, 4).join("|"), "|||km");
  assert.equal(P.chiffresDuTableau(k, true).join(""), "4567000");
  const h = cas("461", "hm", "dam");
  assert.equal(P.chiffresDuTableau(h, false).join(""), "461");
  assert.equal(h.schema.units.length, 8);
  const d = cas("0,005", "mm", "cm");
  assert.equal(d.calcValStr, "0,0005");
  assert.equal(P.chiffresDuTableau(d, true).join(""), "00005");
});

test("problèmes : réponses exactes, jamais de reste négatif, partages qui tombent juste, aucun point ni « e- »", () => {
  for (const f of FAMILLES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`P${f}${lvl}`);
    for (let i = 0; i < 2000; i++) {
      const q = P.buildProblemLogic(lvl, f);
      const t = sansBalises(q.problemText), c = sansBalises(q.correctionText);
      assert.doesNotMatch(t + c, /\d\.\d|e-\d|NaN|undefined/, `${t} || ${c}`);
      assert.doesNotMatch(c, /= -|−\s*\d+[^=]*= -/, c);
      assert.equal(q.calcValStr, reference(q.valStr, q.targetPos - q.sourcePos));
      const nombres = (s) => (s.match(/\d[\d ]*(,\d+)?/g) || []).map((x) => Number(x.replace(/ /g, "").replace(",", ".")));
      if (f === "add" || f === "sub") {
        const [a, b, r] = nombres(c.replace(/^Calcul : /, ""));
        assert.equal(f === "add" ? a + b : a - b, r, c);
        assert.ok(r > 0, c);
      }
      if (f === "div") {
        const [a, d, r] = nombres(c.replace(/^Calcul après conversion : /, ""));
        assert.ok(Number.isInteger(r) && r * d === a, c);
      }
    }
  }
});

test("problèmes : le français des énoncés", () => {
  const vus = new Set();
  for (const f of FAMILLES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`F${f}${lvl}`);
    for (let i = 0; i < 1500; i++) vus.add(sansBalises(P.buildProblemLogic(lvl, f).problemText));
  }
  for (const t of vus) {
    assert.doesNotMatch(t, /Dans d'|Dans de |pour \d+ identiques|un demi de|une planche[^.]*un autre|une ficelle[^.]*un autre|une corde[^.]*un autre|valise[^.]*un autre|carafe[^.]*un autre/, t);
    assert.doesNotMatch(t, /\s{2,}/, t);
  }
});

test("problèmes : des valeurs vraisemblables pour chaque objet", () => {
  P.setSeed("BORNES");
  const lus = [];
  for (const lvl of [1, 2, 3]) for (let i = 0; i < 3000; i++) lus.push(sansBalises(P.buildProblemLogic(lvl, "mult").problemText), sansBalises(P.buildProblemLogic(lvl, "div").problemText), sansBalises(P.buildProblemLogic(lvl, "geom").problemText));
  const kg = (s, nom) => { const m = s.match(new RegExp(`${nom} (?:fait|de) ([\\d ,]+) (k?g)`)); return m ? Number(m[1].replace(/ /g, "").replace(",", ".")) * (m[2] === "kg" ? 1000 : 1) : null; };
  for (const s of lus) {
    const d = kg(s, "dictionnaire"); if (d !== null) assert.ok(d >= 800 && d <= 2000, s);
    const sable = kg(s, "tas de sable"); if (sable !== null) assert.ok(sable >= 20000, s);
    assert.doesNotMatch(s, /tasse de café fait ([2-9]|\d{2,})(,\d+)? L/, s);
    assert.doesNotMatch(s, /mur/, s);
  }
});

test("ordres de grandeur : pas de choix en double, des vrai/faux justes, « volume » et « capacité » jamais ensemble", () => {
  for (const t of EST) for (const lvl of [1, 2, 3]) {
    P.setSeed(`E${t}${lvl}`);
    for (let i = 0; i < 1500; i++) {
      const q = P.buildEstimationLogic(lvl, t, ["len", "mass", "cap", "area", "vol"]);
      const txt = sansBalises(q.problemText);
      assert.doesNotMatch([txt, sansBalises(q.correctionText), ...(q.choices || []).map(sansBalises)].join(" | "), /undefined|NaN|\d\.\d|e-\d/, txt);
      if (q.choices && q.choices.length) {
        assert.equal(new Set(q.choices.map(sansBalises)).size, q.choices.length, `${txt} ${q.choices}`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.choices.length);
      }
      if (t === "est_grandeur") {
        assert.ok(!(q.choices.includes("Un volume") && q.choices.includes("Une capacité")), txt);
      }
      if (t === "est_tf") {
        // « faux » : la valeur affichée est à au moins 10 fois de la vraie
        const m = txt.match(/^(.*) est d'environ ([\d ,]+) (\S+)\.$/);
        assert.ok(m, txt);
        const obj = Object.values(P.EST_DB).flat().find((it) => it.items.some((x) => x.n.toLowerCase() === m[1].toLowerCase()));
        assert.ok(obj, m[1]);
        const vrai = Number(P.valeurDe(obj.val, obj.unit).replace(",", "."));
        const lu = Number(P.valeurDe(m[2].replace(/ /g, ""), m[3]).replace(",", "."));
        if (q.correctIndex === 0) assert.equal(lu, vrai, txt);
        else assert.ok(lu >= vrai * 10 - 1e-12 || lu <= vrai / 10 + 1e-12, txt);
      }
      if (t === "est_unit") {
        assert.ok(["mm", "cm", "m", "km", "g", "kg", "t", "mL", "cL", "L", "cm²", "m²", "km²", "cm³", "dm³", "m³"].includes(q.choices[q.correctIndex]), txt);
      }
      if (t === "est_val" || t === "est_tf" || t === "est_trou") assert.doesNotMatch(txt, /(pèse|mesure|contient|couvre|occupe) environ/, txt);
      if (t === "est_trou") assert.match(txt, /Complète la phrase : \S/, txt);
    }
  }
});

test("français : tutoiement, minuscules aux unités, pas d'alert(), un nombre et son unité insécables", () => {
  for (const a of P.ACTIONS_DB) assert.doesNotMatch(a.q + a.c, /\b(vous|votre|vos|Tracez|Montrez|Levez|Trouvez|Dessinez|Mimez|Estimez|Faites|Prenez|Citez|Regardez|Écartez)\b/, a.q);
  for (const p of PONTS_ET_ACTIONS()) assert.doesNotMatch(p, /\b(Litres?|Tonnes?|kiloLitre)\b/, p);
  assert.doesNotMatch(script, /\balert\(/);
  assert.doesNotMatch(html, /Cochez|Quel est votre choix|À vos ardoises|Préparez-vous/);
});
function PONTS_ET_ACTIONS() {
  return [...P.PONTS_DB.flatMap((p) => [p.q, p.c, p.w1, p.w2]), ...P.ACTIONS_DB.flatMap((a) => [a.q, a.c])];
}

test("la frise : un émoji seulement s'il est à la bonne échelle (dg, m³, dam³, kL corrigés)", () => {
  const e = (dim, u) => P.FRISE_EMOJIS[dim].find((x) => x.u === u).e;
  assert.notEqual(e("mass", "dg"), "✉️");
  assert.notEqual(e("vol", "m³"), "🗑️");
  assert.notEqual(e("vol", "dam³"), "🚌");
  assert.notEqual(e("cap", "kL"), "🛢️");
});

test("tirage d'une série : chaque case cochée sort, jamais deux fois le même énoncé, toujours le même pour un code", () => {
  const cases = ["length", "area", "volM3", "prob_sub", "prob_div", "est_unit", "est_tri", "est_assoc"];
  const s = P.tirerSerie(cases, [1, 2, 3], 10, "FICHE1");
  assert.equal(s.length, 10);
  assert.equal(new Set(s.map((q) => q.textId)).size, 10);
  assert.deepEqual([...new Set(s.map((q) => q.caseCochee))].sort(), [...cases].sort());
  const deux = P.tirerSerie(cases, [1, 2, 3], 10, "FICHE1");
  assert.deepEqual(deux.map((q) => q.textId), s.map((q) => q.textId));
  for (let k = 0; k < 300; k++) {
    const n = [5, 10, 15, 20][k % 4];
    const lesCases = [...TYPES, ...FAMILLES.map((f) => `prob_${f}`), ...EST].filter((x, i) => (i * 7 + k) % 5 < 2).slice(0, n);
    const serie = P.tirerSerie(lesCases, [1, 2, 3].slice(0, 1 + (k % 3)), n, `S${k}`);
    assert.equal(new Set(serie.map((q) => q.textId)).size, serie.length);
    assert.equal(serie.length, n);
    assert.deepEqual([...new Set(serie.map((q) => q.caseCochee))].sort(), [...new Set(lesCases)].sort(), "chaque case cochée sort au moins une fois");
  }
  // une série de 20 « Action en classe » au niveau 1 (10 actions) s'arrête à 10, sans doublon
  const a = P.tirerSerie(["est_action"], [1], 20, "ACT");
  assert.equal(a.length, 10);
  assert.equal(new Set(a.map((q) => q.textId)).size, 10);
});

test("au téléphone : au plus 12 cases, et aucun chiffre perdu (colonnes utiles, choix B du 21/11)", () => {
  for (const t of TYPES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`V${t}${lvl}`);
    for (let i = 0; i < 2000; i++) {
      const q = P.buildQuestionLogic(t, lvl);
      const v = P.vueColonnesUtiles(q);
      const n = v.schema.units.length * v.schema.slots;
      if (q.schema.units.length * q.schema.slots <= 12) { assert.equal(v, q, "un tableau qui tient reste entier"); continue; }
      assert.ok(n <= 12, `${n} cases pour ${q.valStr} ${q.sourceUnit} → ${q.targetUnit}`);
      assert.equal(P.chiffresDuTableau(v, true).join(""), P.chiffresDuTableau(q, true).join(""));
      assert.equal(P.chiffresDuTableau(v, false).join(""), q.valStr.replace(",", ""));
      const unites = [...v.schema.units, ...Object.values(v.schema.labels || {})];
      assert.ok(unites.includes(q.sourceUnit) && unites.includes(q.targetUnit));
    }
  }
});

test("et un pirate ? le code série recopié dans la fiche n'emporte aucun caractère de balise", () => {
  assert.match(script, /seedInputElem\.value\.trim\(\)\.toUpperCase\(\)\.replace\(\/\[<>&"'`\]\/g, ''\)/);
});

// ---- lot 2 : le lien de partage ----
const corps = (nom) => {
  const debut = script.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, nom);
  const suite = script.slice(debut + 10).search(/\n    (function |\/\/ |const |if \()/);
  return script.slice(debut, debut + 10 + suite);
};

test("le lien : lu, réécrit, et la même série que le menu (10 séries au hasard)", () => {
  const r = P.lireLien("?cases=longueurs,volumes,soustractions&niveaux=1,2&questions=10&serie=K7PM");
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { cases: ["length", "volM3", "prob_sub"], niveaux: [1, 2], questions: 10, serie: "K7PM" });
  assert.equal(P.ecrireLien(r), "?cases=longueurs,volumes,soustractions&niveaux=1,2&questions=10&serie=K7PM");
  // l'ordre des cases du lien est celui du menu (le tirage dépend de cet ordre)
  const menu = [...html.matchAll(/<input type="checkbox" value="([a-zA-Z_0-9]+)">/g)].map((m) => m[1]);
  assert.deepEqual(Object.keys(P.CASES_LIEN), menu, "une case par ligne du menu, dans le même ordre");
  assert.equal(new Set(Object.values(P.CASES_LIEN)).size, menu.length);
  for (const nom of Object.values(P.CASES_LIEN)) assert.match(nom, /^[a-z0-9-]+$/);
  const toutes = Object.keys(P.CASES_LIEN);
  let graine = 7;
  const hasard = (n) => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine % n; };
  for (let k = 0; k < 10; k++) {
    const cases = toutes.filter(() => hasard(3) === 0);
    if (!cases.length) cases.push(toutes[hasard(toutes.length)]);
    const niveaux = [1, 2, 3].filter(() => hasard(2) === 0);
    if (!niveaux.length) niveaux.push(1 + hasard(3));
    const questions = [5, 10, 15, 20][hasard(4)];
    const serie = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".split("").filter(() => hasard(8) === 0).slice(0, 4).join("") || "Z9";
    const lu = P.lireLien(P.ecrireLien({ cases, niveaux, questions, serie }));
    assert.deepEqual([...lu.cases], cases); assert.deepEqual([...lu.niveaux], niveaux);
    assert.equal(lu.questions, questions); assert.equal(lu.serie, serie);
    const a = P.tirerSerie(cases, niveaux, questions, serie), b = P.tirerSerie([...lu.cases], [...lu.niveaux], lu.questions, lu.serie);
    assert.deepEqual(b.map((q) => q.textId), a.map((q) => q.textId), `série ${serie}`);
  }
});

test("et un pirate ? l'adresse : seules les valeurs connues passent, rien n'entre en HTML", () => {
  const piegees = [
    "?cases=<img src=x onerror=alert(1)>&serie=<script>",
    "?cases=longueurs\"><script>alert(1)</script>",
    "?cases=__proto__,constructor,toString,length,prob_add",
    "?cases=&niveaux=1&questions=10",
    "?serie=ABC",
    "",
  ];
  for (const a of piegees) assert.equal(P.lireLien(a), null, a.slice(0, 60));
  // une adresse énorme : lue sur 2 000 caractères au plus, sans doublon
  const t0 = Date.now();
  assert.deepEqual([...P.lireLien("?cases=" + "longueurs,".repeat(100000) + "aires").cases], ["length"]);
  assert.ok(Date.now() - t0 < 200);
  const r = P.lireLien("?cases=longueurs,longueurs,inconnu,AIRES,aires&niveaux=0,1,4,1,-2,99999999999999999999&questions=1e9&serie=AB\"><x");
  assert.deepEqual([...r.cases], ["length", "area"]);
  assert.deepEqual([...r.niveaux], [1]);
  assert.equal(r.questions, null, "seulement 5, 10, 15 ou 20");
  assert.equal(r.serie, "", "lettres et chiffres, 6 au plus");
  assert.equal(P.lireLien("?cases=masses&serie=abcdefg").serie, "");
  assert.equal(P.lireLien("?cases=masses&serie=ab12").serie, "AB12");
  assert.equal(P.lireLien("?cases=masses&questions=07").questions, null);
  // ce qui vient de l'adresse n'est jamais écrit en HTML : cases cochées, valeurs des champs, message en texte
  for (const nom of ["lireLien", "ouvrirLien", "copierLien", "montrerMessage"]) assert.doesNotMatch(corps(nom), /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, nom);
  assert.match(corps("montrerMessage"), /textContent/);
  assert.match(corps("copierLien"), /champLien\.value = lien/);
  // le compteur de visites ne garde pas l'adresse complète (seulement le chemin)
  assert.match(readFileSync(new URL("../assets/js/compteur.js", import.meta.url), "utf8"), /cheminPropre\(window\.location\.pathname\)/);
});

test("ordinateur : après « Lancer diapo », le diaporama en haut et entier dans la fenêtre ; le menu ne s'élargit pas", () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const ordi = css.match(/@media screen and \(min-width: 701px\) \{([\s\S]*?)\n    \}/)[1];
  assert.match(ordi, /\.diapo-container \{ height: calc\(100vh - 16px\); height: calc\(100dvh - 16px\); min-height: 0; scroll-margin-top: 8px; overflow-y: auto; \}/);
  assert.match(ordi, /\.thumbnails-bar \{ flex-wrap: nowrap; overflow-x: auto;/);
  assert.match(css, /@media screen and \(min-width: 701px\) and \(max-height: 800px\)/);
  assert.match(css, /@media screen and \(min-width: 701px\) and \(max-height: 680px\)/);
  // l'étiquette du haut suit la hauteur réelle de son cadre (resserré sur un petit écran)
  assert.match(script, /handles\[0\]\.style\.top = `\$\{topPx - \(handles\[0\]\.offsetHeight \|\| 75\) - 14\}px`/);
  // « Copier le lien » dans la colonne de « Lancer diapo »
  assert.match(html, /<div class="lancer-col">\s*<button class="btn-main" onclick="generateQuiz\(\)">💻 Lancer diapo<\/button>\s*<button class="btn-lien" id="btnLien" type="button" onclick="copierLien\(\)">🔗 Copier le lien<\/button>\s*<\/div>/);
});
