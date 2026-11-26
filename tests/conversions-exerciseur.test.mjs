// Exerciseur de conversions (outils/conversions/conversions_exerciseur.html), lot 1 « l'urgent » (21/11/2026) :
// calcul exact, tableau qui ne perd plus de chiffres, restes positifs, partages justes, « L ↔ m³ » avec des litres,
// ordres de grandeur sans doublon ni faux vrai/faux, français, valeurs vraisemblables, tirage d'une série.
// Lot 2 (21/11/2026) : le lien de partage (« ?cases=…&niveaux=…&questions=…&serie=… ») et l'écran d'ordinateur.
// Lot 3 (25/11/2026) : le mode « Je m'entraîne » (réponse tapée ou touchée, validée par la page, score, bilan).
// Lot 3b (25/11/2026) : à 360 × 640, l'étiquette du haut ne touche plus le message, et la page reprend sa place une fois la question finie ;
// la carte du catalogue annonce les deux modes.
// Lot 4 (25/11/2026) : la relecture de toutes les questions — ce qui était faux corrigé d'un coup (zéro inutile, « Quelle grandeur ? »,
// Associer, émojis, rappels, ponts, actions, énoncés), la série complétée par les autres cases ou annoncée plus courte, la saisie « 00810 ».
// Lot 5 (25/11/2026) : trois vrais niveaux pour les conversions (1 « Les bases », 2 « Tout le tableau », 3 « Les pièges », sans les monstres),
// leur nom dans le menu ; au téléphone, la case de réponse ne bouge plus et les unités des aires et des volumes coiffent leurs cases.
// Le script de la page est joué dans node:vm, sans navigateur.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../outils/conversions/conversions_exerciseur.html", import.meta.url), "utf8");
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

function page() {
  const ctx = vm.createContext({ document: { addEventListener() {}, getElementById() { return null; } }, console, URLSearchParams });
  vm.runInContext(`${script}\n;globalThis.__x = { SCHEMAS, EST_DB, ACTIONS_DB, PONTS_DB, TRI_DB, PROBLEMES, FRISE_EMOJIS, setSeed, decaler, ecrire, typo, valeurDe, buildQuestionLogic, buildProblemLogic, buildEstimationLogic, tirerSerie, chiffresDuTableau, vueColonnesUtiles, lireLien, ecrireLien, CASES_LIEN, normaliser, lireSaisie, dansLaFourchette, moitie, double, estJuste, bonneReponse, genreDe, etatFinal, typesEntrainement, resumeDe, MAX_SAISIE, MODES, AIDES, convertTricky, seriePlusCourte, BASES, USUELLES, pairesDuTableau, posUnite };`, ctx);
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
  // lot 3 : un lien sans mode ouvre « Je m'entraîne », avec l'aide à la demande
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { cases: ["length", "volM3", "prob_sub"], niveaux: [1, 2], questions: 10, serie: "K7PM", mode: "entrainement", aide: "demande" });
  assert.equal(P.ecrireLien(r), "?cases=longueurs,volumes,soustractions&niveaux=1,2&questions=10&serie=K7PM&mode=entrainement&aide=demande");
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
  // « Copier le lien » dans la colonne de « Lancer diapo » (lot 3 : « Commencer » ou « Lancer diapo » selon le mode)
  assert.match(html, /<div class="lancer-col">\s*<button class="btn-main" id="btnLancer" onclick="lancer\(\)">✍️ Commencer<\/button>\s*<button class="btn-lien" id="btnLien" type="button" onclick="copierLien\(\)">🔗 Copier le lien<\/button>\s*<\/div>/);
  assert.match(script, /textContent = m === 'diapo' \? '💻 Lancer diapo' : '✍️ Commencer'/);
});

// ---- lot 3 : « Je m'entraîne » ----
const plat = (t) => sansBalises(t).replace(/\s+/g, " ").trim();
const versNombre = (t) => t.replace(/[\s ]/g, "");
// la valeur en gras à la fin de la correction d'un problème : « … = <strong>2 600 g</strong>. »
const resultatCorrige = (c) => { const m = [...c.matchAll(/<strong>([\d\u00a0 ,]+)[\u00a0 ](\S+?)<\/strong>/g)].pop(); return { val: versNombre(m[1]), unite: m[2] }; };

test("je m'entraîne : la bonne réponse de chaque question tapée, juste avec des espaces ou un point, fausse si la virgule bouge (milliers de tirages)", () => {
  let n = 0;
  for (const t of TYPES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`J${t}${lvl}`);
    for (let i = 0; i < 2000; i++) {
      const q = P.buildQuestionLogic(t, lvl), b = P.bonneReponse(q);
      assert.equal(P.genreDe(q), "nombre");
      assert.equal(b.val, reference(q.valStr, q.targetPos - q.sourcePos));
      assert.equal(b.unite, q.targetUnit);
      assert.ok(b.val.length <= P.MAX_SAISIE, `${b.val} : la réponse tient dans la case`);
      assert.ok(P.estJuste(q, b.val) && P.estJuste(q, P.ecrire(b.val)) && P.estJuste(q, b.val.replace(",", ".")), b.val);
      assert.ok(!P.estJuste(q, P.decaler(b.val, 1)) && !P.estJuste(q, P.decaler(b.val, -1)), `${b.val} : la virgule déplacée est fausse`);
      n++;
    }
  }
  for (const f of FAMILLES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`JP${f}${lvl}`);
    for (let i = 0; i < 2000; i++) {
      const q = P.buildProblemLogic(lvl, f), b = P.bonneReponse(q), c = resultatCorrige(q.correctionText);
      assert.equal(b.val, P.normaliser(c.val), `${plat(q.problemText)} → ${plat(q.correctionText)}`);
      assert.equal(b.unite, c.unite);
      assert.match(sansBalises(q.problemText), new RegExp(`en ${b.unite.replace(/[²³]/, ".")} \\?$`), "l'unité de la réponse est celle de la question");
      assert.match(b.val, /^\d+(,\d+)?$/);
      assert.ok(b.val.length <= P.MAX_SAISIE);
      assert.ok(P.estJuste(q, P.ecrire(b.val)) && !P.estJuste(q, P.decaler(b.val, 1)));
      n++;
    }
  }
  assert.ok(n > 70000);
});

test("je m'entraîne : texte à trous juste de la moitié au double, associer et classer en données, choix et états", () => {
  const tousLesObjets = Object.values(P.EST_DB).flat().flatMap((it) => it.items.map((x) => ({ n: x.n, v: P.valeurDe(it.val, it.unit) })));
  for (const lvl of [1, 2, 3]) {
    P.setSeed(`JT${lvl}`);
    for (let i = 0; i < 3000; i++) {
      const q = P.buildEstimationLogic(lvl, "est_trou", ["len", "mass", "cap", "area", "vol"]);
      assert.equal(P.genreDe(q), "nombre");
      assert.match(sansBalises(q.problemText), new RegExp(`\\.+ ${q.uniteReponse.replace(/[²³]/, ".")}\\.$`));
      assert.equal(sansBalises(q.correctionText).match(/: (.*)\.$/)[1].replace(/ /g, ""), q.reponse);
      // la vraie valeur, sa moitié et son double sont justes ; juste en dessous et juste au-dessus, non
      for (const v of [q.reponse, P.moitie(q.reponse), P.double(q.reponse)]) assert.ok(P.estJuste(q, v), `${v} pour ${q.reponse}`);
      const d = P.double(q.reponse), m = P.moitie(q.reponse);
      assert.ok(!P.estJuste(q, d + (d.includes(",") ? "1" : ",1")), `juste au-dessus du double de ${q.reponse}`);
      // juste en dessous de la moitié : on retire 1 au dernier chiffre d'une écriture plus fine
      const fin = (m.split(",")[1] || "").length + 1, sous = P.decaler(String(BigInt(P.decaler(m, fin)) - 1n), -fin);
      assert.ok(!P.estJuste(q, sous), `juste en dessous de la moitié de ${q.reponse} (${sous})`);
      assert.ok(Number(P.valeurDe(P.moitie(q.reponse), q.uniteReponse).replace(",", ".")) > 0);
    }
    P.setSeed(`JA${lvl}`);
    for (let i = 0; i < 2000; i++) {
      const q = P.buildEstimationLogic(lvl, "est_assoc", ["len", "mass", "cap", "area", "vol"]);
      assert.equal(P.genreDe(q), "associer");
      assert.equal(q.objets.length, 3); assert.equal(q.valeurs.length, 3);
      assert.deepEqual([...q.paires].sort(), [0, 1, 2]);
      q.objets.forEach((nom, k) => {
        const [, v, u] = q.valeurs[q.paires[k]].match(/^(.*)[\u00a0 ](\S+)$/);
        assert.ok(tousLesObjets.some((o) => o.n === nom && o.v === P.valeurDe(v.replace(/[\u00a0 ]/g, ""), u)), `${nom} ↔ ${q.valeurs[q.paires[k]]}`);
        // la combinaison du diaporama dit la même chose
        assert.match(sansBalises(q.correctionText), new RegExp(`${k + 1} → ${"ABC"[q.paires[k]]}`));
      });
    }
    P.setSeed(`JC${lvl}`);
    for (let i = 0; i < 2000; i++) {
      const q = P.buildEstimationLogic(lvl, "est_tri", []);
      assert.equal(P.genreDe(q), "classer");
      assert.deepEqual([...q.mesures].sort(), [...q.ordre].sort());
      // 1 dm³ = 1 L, 1 cm³ = 1 mL, 1 m³ = 1 kL : une série de capacités peut mêler les deux écritures
      const CAP = { "cm³": "mL", "dm³": "L", "m³": "kL" };
      const v = q.ordre.map((m) => { let [, a, u] = m.match(/^(.*)[\u00a0 ](\S+)$/); if (q.ordre.some((x) => /L$/.test(x)) && CAP[u]) u = CAP[u]; return Number(P.valeurDe(a.replace(/[\u00a0 ]/g, ""), u).replace(",", ".")); });
      for (let k = 1; k < v.length; k++) assert.ok(v[k] > v[k - 1], q.ordre.join(" < "));
    }
  }
  for (const t of ["est_grandeur", "est_unit", "est_val", "est_tf", "est_pont"]) {
    P.setSeed(`JX${t}`);
    for (let i = 0; i < 500; i++) {
      const q = P.buildEstimationLogic(1 + (i % 3), t, ["len", "mass", "cap", "area", "vol"]);
      assert.equal(P.genreDe(q), "choix");
      assert.ok(q.rappel && !/C'est (vrai|faux)/.test(q.rappel), q.rappel);
      assert.doesNotMatch(P.resumeDe({ ...q, caseCochee: t }), /undefined/);
    }
  }
  // trois états : juste (1er essai, sans aide ouverte), avec l'aide (aide ouverte ou 2e essai), à revoir
  assert.equal(P.etatFinal({ essai: 1, aideVue: false }, true), "juste");
  assert.equal(P.etatFinal({ essai: 1, aideVue: true }, true), "aide");
  assert.equal(P.etatFinal({ essai: 2, aideVue: false }, true), "aide");
  assert.equal(P.etatFinal({ essai: 2, aideVue: true }, false), "revoir");
});

test("je m'entraîne : saisies acceptées et refusées, moitié et double sans virgule flottante", () => {
  const ok = { "2 770": "2770", "2 770": "2770", "2 770": "2770", "2770,": "2770", "2770,00": "2770", "0027,50": "27,5", "27.5": "27,5", ",5": "0,5", "0": "0", " 4 ": "4", "0,000000007": "0,000000007" };
  for (const [s, v] of Object.entries(ok)) assert.equal(P.lireSaisie(s), v, JSON.stringify(s));
  for (const s of ["", " ", ",", "1,2,3", "1.2.3", "1,2.3", "-4", "+4", "1e3", "4 kg", "½", "<b>4</b>", "12345678901234567", null, undefined, "Infinity", "0x10", "٣"]) assert.equal(P.lireSaisie(s), null, JSON.stringify(s));
  assert.equal(P.lireSaisie("9".repeat(100000)), null, "une saisie énorme est refusée (lue sur 40 caractères)");
  // moitié et double : calcul exact
  assert.equal(P.moitie("4"), "2"); assert.equal(P.double("4"), "8");
  assert.equal(P.moitie("1,5"), "0,75"); assert.equal(P.double("1,5"), "3");
  assert.equal(P.moitie("0,001"), "0,0005"); assert.equal(P.double("2500"), "5000");
  assert.equal(P.moitie("0,3"), "0,15");
  // bornes comprises, juste en dehors refusé, même avec des décimales qui piègent les flottants (0,1 + 0,2…)
  const F = P.dansLaFourchette;
  assert.ok(F("2", "4") && F("8", "4") && F("4", "4") && F("1,999999", "4") === false && F("8,000001", "4") === false);
  assert.ok(F("0,15", "0,3") && F("0,6", "0,3") && !F("0,14999", "0,3") && !F("0,60001", "0,3"));
  assert.ok(F("0,0005", "0,001") && !F("0,0004", "0,001"));
  assert.ok(!F("0", "4"));
  for (const nom of ["dansLaFourchette", "estJuste", "lireSaisie", "fois"]) assert.doesNotMatch(corps(nom), /Number\(|parseFloat|parseInt|\* 0\.5|\/ 2/, nom);
});

test("je m'entraîne : « Action en classe » n'est jamais tirée, et sans elle la série est celle du diaporama", () => {
  assert.deepEqual([...P.typesEntrainement(["length", "est_action", "est_tri"])], ["length", "est_tri"]);
  const toutes = Object.keys(P.CASES_LIEN);
  for (let k = 0; k < 300; k++) {
    const cases = toutes.filter((_, i) => (i * 5 + k) % 4 === 0 || i === 17);   // 17 : « Action en classe » toujours cochée
    const s = P.tirerSerie(P.typesEntrainement(cases), [1, 2, 3].slice(k % 3), [5, 10, 15, 20][k % 4], `A${k}`);
    assert.ok(s.length > 0 && s.every((q) => q.caseCochee !== "est_action" && q.qType !== 5));
  }
  // le tirage du mode : le même que celui du diaporama, cases filtrées avant
  const g = corps("getQuizData");
  assert.ok(g.indexOf("typesEntrainement(rawTypes)") > 0 && g.indexOf("typesEntrainement(rawTypes)") < g.indexOf("tirerSerie("));
  assert.match(corps("commencerEntrainement"), /getQuizData\(true\)/);
  assert.doesNotMatch(corps("generateQuiz"), /getQuizData\(true\)/);
});

test("mêmes séries : pour un code, le diaporama redonne toujours la même série (empreintes du lot 5)", () => {
  // Empreintes recalculées au lot 5 (25/11/2026) : les niveaux 1 et 2 des conversions tirent autrement (c'est voulu), et les 12 séries
  // en contiennent : les 12 changent. Sur les 400 séries de series-lot5.mjs (toutes ont une case de conversion) : 90 identiques ;
  // 257 changent par les niveaux 1 ou 2 ; 53 séries du niveau 3 seul changent parce qu'un monstre en est retiré (les 80 autres
  // sont identiques). 3 218 questions sur 5 000 gardent leur énoncé. Avant (main ea60818, lot 4) :
  // 7ea23a256e4ce84a 3ff1044104a1459c 3dba203c922ab7d9 396ca0475cb90a45 1882a290f925b597 1093cdf615757fb3
  // aebbf08878649521 edf17416f518c1e2 9f8433c35ad69b43 561637ada18f0264 bf8489d85a652448 ded48cda8fe4b5a3
  const MAIN = ["b1bf5c6cea92df25", "abfd8cc5cf7adc44", "8ce458a12d6b1106", "b1d19b6f4ff14216", "041ef6dfb61a4dff", "73e4d6de2a9c3668", "9eb3c6b3676e7bcf", "2221fcf22fbf455f", "fb41aa61468a7ad2", "65070687aa4fbda6", "51979d9c08eda848", "5d9c80bfd2fbb109"];
  const CHAMPS = ["isProblem", "isEstimation", "qType", "valStr", "calcValStr", "sourceUnit", "targetUnit", "sourcePos", "targetPos", "choices", "correctIndex", "correctionText", "textId", "emoji", "caseCochee"];
  const toutes = ["length", "mass", "massT", "volL", "area", "volM3", "cross", "prob_add", "prob_sub", "prob_mult", "prob_div", "prob_frac", "prob_geom", "est_grandeur", "est_unit", "est_val", "est_tf", "est_action", "est_pont", "est_assoc", "est_trou", "est_tri"];
  const lot = [];
  for (let k = 0; k < 12; k++) {
    const cases = toutes.filter((_, i) => (i + k) % 3 === 0);
    const serie = P.tirerSerie(cases, [1, 2, 3].slice(0, 1 + (k % 3)), [5, 10, 15, 20][k % 4], `EMP${k}`);
    const p = serie.map((q) => CHAMPS.map((c) => (q[c] === undefined ? null : q[c])));
    lot.push(createHash("sha256").update(JSON.stringify(p)).digest("hex").slice(0, 16));
  }
  assert.deepEqual(lot, MAIN);
});

test("je m'entraîne : le lien porte le mode et l'aide (listes fermées) ; « Copier le lien » écrit toujours le mode", () => {
  const l = (a) => JSON.parse(JSON.stringify(P.lireLien(a)));
  assert.equal(l("?cases=aires&mode=diapo").mode, "diapo");
  assert.equal(l("?cases=aires&mode=diapo&aide=sans").aide, "demande", "pas d'aide dans le diaporama");
  assert.equal(l("?cases=aires&mode=entrainement&aide=sans").aide, "sans");
  assert.equal(l("?cases=aires&aide=debut").aide, "debut");
  for (const m of ["DIAPO", "diapo ", "<script>", "__proto__", "entrainement,diapo", "1"]) assert.equal(l(`?cases=aires&mode=${encodeURIComponent(m)}`).mode, "entrainement", m);
  for (const a of ["DEBUT", "toujours", "<img src=x onerror=alert(1)>", "constructor", ""]) assert.equal(l(`?cases=aires&aide=${encodeURIComponent(a)}`).aide, "demande", a);
  for (const mode of P.MODES) for (const aide of P.AIDES) {
    const r = { cases: ["area", "est_tri"], niveaux: [2], questions: 15, serie: "Z9", mode, aide };
    const lu = l(P.ecrireLien(r));
    assert.equal(lu.mode, mode); assert.equal(lu.aide, mode === "diapo" ? "demande" : aide);
  }
  assert.equal(P.ecrireLien({ cases: ["area"], niveaux: [1], questions: 5, serie: "A", mode: "diapo", aide: "sans" }), "?cases=aires&niveaux=1&questions=5&serie=A&mode=diapo");
  assert.match(corps("copierLien"), /r\.mode = modeMenu; r\.aide = aideDuMenu\(\);/);
  // le mode du lien vaut pour la visite : il n'écrase pas le mode retenu sur l'appareil
  assert.match(corps("ouvrirLien"), /choisirMode\(r\.mode, false\)/);
});

test("et un pirate ? la saisie et le mot gardé sur l'appareil n'entrent jamais en HTML", () => {
  // la saisie : écrite en texte dans la case, bornée, jamais dans innerHTML
  // (lot 5 : le texte est dans un span « champ-t », fabriqué par creer(), qui écrit en textContent)
  assert.match(corps("majChamp"), /champ\.appendChild\(creer\('span', 'champ-t', st\.saisie \? ecrire\(st\.saisie\) : ''\)\)/);
  assert.match(corps("creer"), /if \(texte !== undefined\) el\.textContent = texte;/);
  assert.doesNotMatch(corps("majChamp"), /innerHTML/);
  for (const ligne of script.split("\n")) if (/innerHTML|insertAdjacentHTML|outerHTML/.test(ligne)) assert.doesNotMatch(ligne, /saisie|\.liens|\.rangs|location|localStorage|getItem/, ligne.trim());
  assert.match(corps("taper"), /nb < MAX_SAISIE/);
  assert.equal(P.MAX_SAISIE, 14);
  // le mode gardé sur l'appareil : lu sous try/catch, revérifié dans la liste fermée ; rien d'autre n'est gardé
  assert.match(corps("lireModeRetenu"), /try \{ const m = window\.localStorage\.getItem\(CLE_MODE\); return MODES\.includes\(m\) \? m : null; \} catch/);
  assert.equal((script.match(/localStorage\.setItem/g) || []).length, 1);
  assert.equal((script.match(/sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon/g) || []).length, 0, "aucune réponse ni aucun score ne part ni n'est gardé");
  // le message : en texte, sauf les rappels des banques de la page
  assert.match(corps("message"), /if \(enHtml\) el\.innerHTML = typo\(texteOuHtml\); else el\.textContent = texteOuHtml;/);
  for (const m of script.matchAll(/message\(([^;]*), (true|false|ok), true\)/g)) assert.match(m[1], /q\.rappel/, m[0]);
  // ✕ : une boîte dans la page, pas d'alert() ni de confirm()
  assert.doesNotMatch(script, /\b(alert|confirm|prompt)\(/);
  assert.match(html, /<h4 id="arretTitre">Arrêter la série&nbsp;\?<\/h4>\s*<p>Tes réponses ne sont pas gardées\.<\/p>/);
});

test("je m'entraîne : l'écran (pavé tactile seulement, « Valider » sous le doigt, flèches inactives, textes sans mot genré)", () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /\.diapo-container:not\(\.tactile\) \.pave \{ display: none; \}/);
  assert.match(css, /\.diapo-container\.entr \.entr-pied \{[^}]*position: sticky; bottom: 0;/);
  assert.match(script, /matchMedia\('\(hover: none\) and \(pointer: coarse\)'\)/);
  // la case de réponse n'est pas un vrai champ : le clavier du téléphone ne s'ouvre pas
  assert.doesNotMatch(corps("champHTML"), /<input|contenteditable/);
  assert.match(script, /if \(enEntrainement\(\)\) \{ toucheEntrainement\(e\); return; \}/);
  assert.doesNotMatch(corps("toucheEntrainement"), /Arrow/);
  // Entrée valide, même quand le focus est resté sur un bouton caché (« Continuer » après le ✕) ou grisé
  assert.match(corps("toucheEntrainement"), /e\.key === 'Enter' && !\(cible === 'BUTTON' && e\.target\.offsetParent !== null && !e\.target\.disabled\)/);
  assert.match(corps("fermerArret"), /document\.activeElement\.blur\(\)/);
  // les textes vus par l'élève
  const textes = [...script.matchAll(/(?:message|creer)\([^)]*?[`'"]([^`'"]{6,})[`'"]/g)].map((m) => m[1]).join(" | ");
  const page = html.slice(html.indexOf("<body>"), html.indexOf("<script>"));
  assert.doesNotMatch(textes + page, /\b(vous|votre|Cochez|Validez|Tapez|seul|seule|venu|prêt|prête)\b/);
  assert.match(html, /Pas encore\. Regarde le tableau, puis réessaie\.|Pas encore\. Regarde le tableau, puis réessaie/);
  assert.match(script, /Pas cette fois/);
  assert.doesNotMatch(script, /dernier chiffre/);
  // « Action en classe » grisée dans ce mode, intacte dans le diaporama
  assert.match(corps("choisirMode"), /action\.disabled = m === 'entrainement';/);
  // le trait qui se remplit, comme Défi tables et Défi calcul : pas de barre numérotée sous le pavé
  assert.doesNotMatch(html, /entr-prog|entrProg/);
  assert.match(html, /<div class="entr-piste" aria-hidden="true"><b id="entrPiste"><\/b><\/div>/);
  assert.match(corps("majProgression"), /E\.st\.filter\(st => st\.fini\)\.length/);
  // téléphone : le tableau qui arrive après une erreur remonte au-dessus du pavé, la case de réponse restant à l'écran
  const t = corps("tableauAuDessusDuPied");
  assert.match(t, /classList\.contains\('tactile'\)/);
  assert.match(t, /window\.scrollBy\(0, Math\.min\(manque, marge\)\)/);
  assert.match(corps("montrerTableau"), /requestAnimationFrame\(tableauAuDessusDuPied\)/);
});

test("lot 3b : à 360 × 640, l'étiquette « L'unité de mesure » (avec sa pointe) tient au-dessus du tableau sans toucher le message", () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const bloc = css.split("@media screen and (max-width: 700px) and (max-height: 700px) {")[1].split("\n    }\n")[0];
  const px = (re) => Number(bloc.match(re)[1]);
  const haut = px(/\.entr \.inner \{ padding-top: (\d+)px;/);
  const etiquette = px(/\.entr \.handle \{ height: (\d+)px;/);
  // la pointe fait 14 px (handles[0].style.top = topPx - hauteur - 14 dans positionDiapoCursor)
  assert.match(script, /handles\[0\]\.style\.top = `\$\{topPx - \(handles\[0\]\.offsetHeight \|\| 75\) - 14\}px`/);
  assert.ok(etiquette + 14 <= haut, `étiquette ${etiquette} px + pointe 14 px > ${haut} px au-dessus du tableau`);
  // les deux lignes du texte tiennent dans l'étiquette : 0,72 rem × 1,05 × 2 lignes ≤ hauteur − bordures − marges
  assert.match(bloc, /\.entr \.handle \{ height: \d+px; width: 112px; padding: 2px 6px; \}/);
  assert.match(bloc, /\.entr \.h-text \{ font-size: 0\.72rem; line-height: 1\.05; \}/);
  assert.ok(0.72 * 16 * 1.05 * 2 <= etiquette - 4 - 4, "le texte de l'étiquette déborde");
});

test("lot 3b : la page remonte pour montrer le tableau, puis reprend sa place quand la question est finie", () => {
  const ctx = vm.createContext({ document: { addEventListener() {}, getElementById() { return null; } }, console, URLSearchParams });
  vm.runInContext(script, ctx);
  // un faux téléphone : le pied commence à 400 px, le bas du tableau est à 450 px, la case de réponse à 150 px
  const fenetre = { scrollY: 1200, scrollBy(x, y) { this.scrollY += y; }, scrollTo(x, y) { this.scrollY = y; } };
  const boite = (haut, bas) => ({ getBoundingClientRect: () => ({ top: haut, bottom: bas }) });
  const el = { entrPied: boite(400, 640), champ: boite(150, 185), diapoContainer: { classList: { contains: (c) => c === "tactile" } } };
  ctx.window = fenetre;
  ctx.document = { getElementById: (id) => el[id] || null, querySelectorAll: () => [boite(380, 450)], addEventListener() {} };
  vm.runInContext("E.place = null; tableauAuDessusDuPied();", ctx);
  assert.equal(fenetre.scrollY, 1254, "la page remonte de 54 px (50 manquants + 4 de marge)");
  assert.equal(vm.runInContext("E.place", ctx), 1200, "la place d'avant est gardée");
  // un 2e appel (aide puis erreur) ne remplace pas la place d'origine
  vm.runInContext("tableauAuDessusDuPied();", ctx);
  assert.equal(vm.runInContext("E.place", ctx), 1200);
  vm.runInContext("reprendreSaPlace();", ctx);
  assert.equal(fenetre.scrollY, 1200, "la page reprend sa place");
  assert.equal(vm.runInContext("E.place", ctx), null);
  // sans remontée, reprendreSaPlace ne bouge rien (ordinateur, question sans tableau)
  fenetre.scrollY = 900; vm.runInContext("reprendreSaPlace();", ctx);
  assert.equal(fenetre.scrollY, 900);
  // où c'est branché : en fin de question (juste, ou faux pour de bon), et remis à zéro à la question suivante et à chaque série
  assert.match(corps("terminer"), /afficherQuestion\(true\);\n\s*reprendreSaPlace\(\);/);
  assert.match(corps("suivante"), /\{\n\s*E\.place = null;/);
  assert.match(corps("demarrerSerie"), /E\.place = null;/);
});

test("lot 3b : la carte du catalogue annonce les deux modes, et le cache du catalogue suit", () => {
  const cat = readFileSync(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");
  const bloc = cat.split('"outils/conversions/conversions_exerciseur.html": {')[1].split("}")[0];
  assert.match(bloc, /"cardDescription": "Projeter des questions de conversion et d’ordre de grandeur, ou laisser l’élève s’entraîner en autonomie, avec un score\."/);
  assert.doesNotMatch(bloc, /\b(seul|seule)\b/);
  assert.match(readFileSync(new URL("../outils/index.html", import.meta.url), "utf8"), /catalogue-refonte-data\.js\?v=exerciseur-conversions-20261125-1/);
});

test("lot 3b : les messages de « Je m'entraîne » ne passent jamais dans le diaporama", () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /\.diapo-container:not\(\.entr\) \.entr-msg \{ display: none; \}/);
  // « Lancer diapo » (après une série, avec ou sans le ✕) passe par quitterEntrainement, qui cache les deux messages
  assert.match(corps("generateQuiz"), /quitterEntrainement\(\);/);
  assert.match(corps("arreter"), /quitterEntrainement\(\);/);
  const q = corps("quitterEntrainement");
  assert.match(q, /getElementById\('entrMsgHaut'\)\.hidden = true;/);
  assert.match(q, /getElementById\('entrMsgBas'\)\.hidden = true;/);
});

test("lot 3b : « Convertis : » sur sa ligne et la conversion en grand (diaporama et « Je m'entraîne ») ; au téléphone, seulement dans « Je m'entraîne » (lot 5)", () => {
  assert.match(script, /const CONSIGNE_CONV = `<span class="conv-consigne">Convertis\$\{NBSP\}:<\/span> `;/);
  const u = corps("updateUI");
  assert.match(u, /qText\.classList\.remove\('conv'\);/);
  assert.equal((u.match(/qText\.innerHTML = `\$\{CONSIGNE_CONV\}/g) || []).length, 3, "les trois temps du diaporama (question, aide, correction)");
  assert.equal((u.match(/qText\.classList\.add\('conv'\)/g) || []).length, 3);
  assert.doesNotMatch(u, /Convertis\$\{NBSP\}: /);
  const a = corps("afficherQuestion");
  assert.match(a, /qText\.classList\.remove\('pb', 'conv'\);/);
  assert.match(a, /qText\.innerHTML = `\$\{CONSIGNE_CONV\}<span class="nb">/);
  assert.match(a, /qText\.classList\.add\('conv'\);/);
  // la mise en page : à partir de 701 px de large (ordinateur, tablette) ; au téléphone, une seule règle, et seulement dans « Je m'entraîne » (lot 5)
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const blocs = [...css.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^}]*\})*)\s*\}/g)];
  const avecConv = blocs.filter((m) => /conv/.test(m[2]));
  assert.ok(avecConv.filter((m) => /min-width: 701px/.test(m[1])).length >= 3, "trois tailles d'écran");
  for (const m of avecConv) {
    if (/min-width: 701px/.test(m[1])) continue;
    assert.equal(m[1].trim(), "screen and (max-width: 700px)", `« ${m[1].trim()} »`);
    const regles = m[2].split("\n").filter((l) => /conv/.test(l));
    assert.equal(regles.length, 1, "une seule règle au téléphone");
    assert.match(regles[0], /^\s*\.entr \.question-text \.conv-consigne \{ display: block;/, "le diaporama du téléphone ne change pas");
  }
  assert.doesNotMatch(css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*\s*\}/g, ""), /conv-consigne|\.conv\b/, "aucune règle hors des tailles d'ordinateur");
  assert.match(css, /\.diapo-container \.question-text\.conv \{ font-size: 3rem; line-height: 1\.2; \}/);
  // diaporama : la question (problèmes compris) garde sa taille du 7 avril au 21 novembre, 2,2 rem, dans les fenêtres basses aussi
  const bas800 = css.split("@media screen and (min-width: 701px) and (max-height: 800px) {")[1].split("\n    }\n")[0];
  const bas680 = css.split("@media screen and (min-width: 701px) and (max-height: 680px) {")[1].split("\n    }\n")[0];
  assert.match(bas800, /\n      \.question-text \{ font-size: 2\.2rem; line-height: 1\.3; \}/);
  assert.match(bas680, /\n      \.question-text \{ font-size: 2\.2rem; \}/);
  // « Je m'entraîne » sur ordinateur : la question à la taille du diaporama
  assert.match(css, /\.entr \.question-text \{ font-size: 2\.2rem; line-height: 1\.3; \}/);
  // l'impression n'est pas touchée
  assert.match(script, /qTextHtml = `\$\{i\+1\}\) Convertis\$\{NBSP\}: <strong>/);
});

test("lot 3b : le plein écran ⛶ dans « Je m'entraîne », caché au téléphone", () => {
  // « 💡 Aide » puis ⛶ : le ⛶ reste au bord droit, même quand l'aide est cachée
  assert.match(html, /<div class="entr-entete">[\s\S]*?<div class="entr-droite"><button type="button" class="btn-nav" id="btnAide" onclick="ouvrirAide\(\)">💡 Aide<\/button><button type="button" class="btn-nav btn-icon entr-plein" onclick="toggleFullscreen\(\)" title="Passer en plein écran" aria-label="Plein écran">⛶<\/button><\/div>/);
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const tel = css.split("@media screen and (max-width: 700px) {").slice(1).find((b) => b.includes(".entr-x-mot"));
  assert.match(tel.split("\n    }\n")[0], /\.entr \.entr-plein \{ display: none; \}/);
});

// ---------------------------------------------------------------- lot 4 « relecture »
const NOMS_OBJETS = () => Object.values(P.EST_DB).flat().flatMap((it) => it.items);

test("lot 4 : plus de zéro inutile en fin de nombre (« 89,50 dam » → « 89,5 dam »)", () => {
  for (const t of TYPES) {
    P.setSeed(`Z${t}`);
    for (let i = 0; i < 3000; i++) {
      const q = P.buildQuestionLogic(t, 3);
      assert.doesNotMatch(q.valStr, /,\d*0$/, `${q.valStr} ${q.sourceUnit}`);
    }
  }
});

test("lot 4 : « Quelle grandeur ? » ne nomme jamais la grandeur", () => {
  for (const it of NOMS_OBJETS()) assert.ok(it.pour, `${it.n} : pas de phrase « pour »`);
  P.setSeed("GRANDEUR");
  for (let i = 0; i < 3000; i++) {
    const q = P.buildEstimationLogic(1 + (i % 3), "est_grandeur", []);
    const t = sansBalises(q.problemText);
    assert.match(t, /^Pour savoir .+, quelle grandeur mesure-t-on \?$/, t);
    assert.doesNotMatch(t.replace("quelle grandeur", ""), /\b(masse|longueur|surface|superficie|volume|capacité|aire|épaisseur|altitude)\b/i, t);
  }
});

test("lot 4 : Associer, trois mesures au moins 3 fois plus grandes l'une que l'autre", () => {
  const nb = (v) => { const [n, u] = v.replace(/[\s  ]/g, "").match(/^([\d,]+)(.*)$/).slice(1); return Number(P.valeurDe(n, u).replace(",", ".")); };
  for (const lvl of [1, 2, 3]) {
    P.setSeed(`ASSOC${lvl}`);
    for (let i = 0; i < 6000; i++) {
      const q = P.buildEstimationLogic(lvl, "est_assoc", ["len", "mass", "cap", "area", "vol"]);
      assert.equal(q.objets.length, 3); assert.equal(q.valeurs.length, 3);
      if (lvl === 1) continue;
      const v = q.valeurs.map((x) => nb(sansBalises(x))).sort((a, b) => a - b);
      assert.ok(v[1] >= 3 * v[0] - 1e-12 && v[2] >= 3 * v[1] - 1e-12, q.valeurs.join(" | "));
    }
  }
});

test("lot 4 : « Quelle unité ? » ne pose plus le lit ni le vélo (cm serait aussi juste)", () => {
  P.setSeed("UNITE");
  for (let i = 0; i < 4000; i++) {
    const q = P.buildEstimationLogic(1 + (i % 3), "est_unit", ["len"]);
    assert.ok(!/lit|vélo/.test(q.sujet), q.sujet);
  }
});

test("lot 4 : émojis, rappels, ponts et actions corrigés", () => {
  const e = (n) => NOMS_OBJETS().find((x) => x.n === n).e;
  assert.equal(e("la masse d'un tube de colle"), "");
  assert.equal(e("la quantité d'eau dans un grand arrosoir"), "");
  assert.equal(e("l'espace pris par une grosse gomme"), "");
  assert.equal(P.PONTS_DB.find((p) => /kilolitre/.test(p.q)).e, "📦");
  const tout = JSON.stringify([P.EST_DB, P.PONTS_DB, P.ACTIONS_DB]);
  assert.doesNotMatch(tout, /petit bassin|feuille de cahier|pèse exactement|épaule opposée|gourde pleine|comme une brique de lait|effaceur, un tube de colle/);
  assert.match(tout, /un bassin de piscine municipale/);
  assert.match(tout, /le même volume qu'une brique de lait de 1 L/);
});

test("lot 4 : les énoncés des problèmes (verbes, bouillon, bidon d'eau, multiplications, additions en mL)", () => {
  const vus = new Set();
  for (const f of FAMILLES) for (const lvl of [1, 2, 3]) {
    P.setSeed(`L4${f}${lvl}`);
    for (let i = 0; i < 1500; i++) vus.add({ f, lvl, t: sansBalises(P.buildProblemLogic(lvl, f).problemText) });
  }
  for (const { f, lvl, t } of vus) {
    assert.doesNotMatch(t, /je verse|je vide|soupe|lessive|Quel est le total pour/, t);
    if (f === "mult") assert.match(t, /(Quelle longueur font \d+ .+ identiques mis(es)? bout à bout|Quelle est la masse de \d+ .+ identiques|Combien contiennent \d+ .+ identiques), en (mm|cm|m|g|kg|mL|cL|L) \?$/, t);
    if (/carreaux de faïence/.test(t)) assert.match(t, / mis bout/, t);
    if (/(dalles|lattes|règles)/.test(t) && f === "mult") assert.match(t, / mises bout/, t);
    if (f === "add" && lvl === 3 && / L et un autre/.test(t)) assert.match(t, /\d mL\. Quel est le total en mL \?$/, t);
  }
});

test("lot 4 : au niveau 3, 10 m et plus restent en m, 10 L et plus restent en L", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(P.convertTricky(100, "m"))), { val: "100", unit: "m" });
  assert.deepEqual(JSON.parse(JSON.stringify(P.convertTricky(25, "m"))), { val: "25", unit: "m" });
  assert.deepEqual(JSON.parse(JSON.stringify(P.convertTricky(1.5, "m"))), { val: "150", unit: "cm" });
  assert.deepEqual(JSON.parse(JSON.stringify(P.convertTricky(50, "L"))), { val: "50", unit: "L" });
  assert.deepEqual(JSON.parse(JSON.stringify(P.convertTricky(1.5, "L"))), { val: "150", unit: "cL" });
  P.setSeed("NIV3");
  for (let i = 0; i < 3000; i++) for (const t of ["est_val", "est_trou"]) {
    const q = P.buildEstimationLogic(3, t, ["len", "cap"]);
    // la bonne réponse (les fausses peuvent être énormes : c'est leur rôle)
    const bonne = t === "est_val" ? sansBalises(q.choices[q.correctIndex]) : `${q.reponse} ${q.uniteReponse}`;
    assert.doesNotMatch(bonne, /^\d{1,3}( \d{3})+ (cm|cL)$|^\d{4,} (cm|cL)$/, bonne);
  }
});

test("lot 4 : une case épuisée laisse sa place aux autres ; sinon la série est annoncée plus courte", () => {
  for (let k = 0; k < 30; k++) {
    assert.equal(P.tirerSerie(["area", "est_unit"], [1], 10, `C${k}`).length, 10);
    assert.equal(P.tirerSerie(["volM3", "est_unit"], [1], 10, `D${k}`).length, 10);
  }
  // toutes les cases épuisées : la série reste courte, sans doublon, et le message le dit
  const p = P.tirerSerie(["est_pont"], [1], 20, "PONT");
  assert.equal(p.length, 8);
  assert.equal(new Set(p.map((q) => q.textId)).size, 8);
  assert.equal(P.seriePlusCourte(10, 10), "");
  assert.match(P.seriePlusCourte(8, 20), /que 8 questions différentes : la série n'en a que 8 \(sur 20\)\.$/);
  assert.match(corps("getQuizData"), /const court = seriePlusCourte\(quizData\.length, targetCount\);\s*if \(court\) montrerMessage\(court\);/);
  assert.match(corps("copierLien"), /seriePlusCourte\(tirerSerie\(casesDuMode/);
});

test("lot 4 : la case de réponse fait comme une calculatrice (« 00810 » ne s'écrit plus)", () => {
  assert.match(corps("taper"), /else if \(\/\^\[0-9\]\$\/\.test\(c\) && st\.saisie === '0'\) st\.saisie = c;/);
});

// ---- lot 5 : trois vrais niveaux, leur nom au menu, la case et le tableau du téléphone ----
const css5 = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const decimales = (s) => (s.split(",")[1] || "").length;
const ecrits = (s) => s.replace(",", "").length;
const part = (n, total) => Math.round((1000 * n) / total) / 10;
// le nombre écrit avec la plus grande des deux unités
const grand = (q) => (q.targetPos >= q.sourcePos ? q.valStr : q.calcValStr);
const paire = (q) => (q.targetPos >= q.sourcePos ? `${q.sourceUnit}–${q.targetUnit}` : `${q.targetUnit}–${q.sourceUnit}`);

test("lot 5, niveau 1 « Les bases » : seulement les relations connues par cœur, dans les deux sens, des entiers de 1 à 99, résultat entier", () => {
  const attendues = {
    length: ["km–m", "m–cm", "cm–mm", "m–mm", "m–dm", "dm–cm"], mass: ["kg–g", "g–mg"], massT: ["t–kg", "kg–g", "g–mg"],
    volL: ["L–cL", "L–mL", "cL–mL"], area: ["m²–dm²", "dm²–cm²"], volM3: ["m³–dm³", "dm³–cm³"], cross: ["L–dm³", "mL–cm³", "L–cm³", "m³–L"],
  };
  for (const t of TYPES) {
    assert.deepEqual([...new Set(P.BASES[t].map((p) => p.join("–")))].sort(), [...attendues[t]].sort(), `les paires de « ${t} »`);
    P.setSeed(`B${t}`);
    const N = 4000, vues = new Set(); let haut = 0, petits = 0, dm = 0, meme = 0;
    for (let i = 0; i < N; i++) {
      const q = P.buildQuestionLogic(t, 1), g = grand(q);
      // « L = dm³ » et « mL = cm³ » : les deux unités sont dans la même case, la paire se lit dans l'ordre de la liste
      const p = q.sourcePos === q.targetPos ? (/L$/.test(q.sourceUnit) ? `${q.sourceUnit}–${q.targetUnit}` : `${q.targetUnit}–${q.sourceUnit}`) : paire(q);
      assert.ok(attendues[t].includes(p), `${q.valStr} ${q.sourceUnit} → ${q.targetUnit} n'est pas une base`);
      assert.match(q.valStr + " " + q.calcValStr, /^\d+ \d+$/, "des entiers au départ comme à l'arrivée");
      assert.ok(Number(g) >= 1 && Number(g) <= 99, `${g} : de 1 à 99 avec la plus grande unité`);
      assert.ok(Math.abs(q.targetPos - q.sourcePos) <= 3, "× 1 000 au plus");
      vues.add(p);
      if (q.targetPos < q.sourcePos) haut++;
      if (Number(g) <= 9) petits++;
      if (/\bdm\b/.test(`${q.sourceUnit} ${q.targetUnit}`)) dm++;
      if (q.targetPos === q.sourcePos) meme++;
    }
    assert.equal(vues.size, attendues[t].length, "chaque relation sort");
    // « même nombre » (L = dm³) : le sens ne compte pas
    const sens = part(haut, N - meme);
    assert.ok(sens > 44 && sens < 56, `${t} : ${sens} % vers la plus grande unité (la moitié)`);
    assert.ok(part(petits, N) > 44 && part(petits, N) < 56, "de 1 à 9 une fois sur deux");
    if (t === "length") assert.ok(part(dm, N) > 17 && part(dm, N) < 27, `m ↔ dm et dm ↔ cm : ${part(dm, N)} % (2 sur 9)`);
    // « L ↔ m³ » : un tiers L ↔ cm³, un tiers m³ ↔ L, un tiers « même nombre »
    if (t === "cross") assert.ok(part(meme, N) > 28 && part(meme, N) < 39, `même nombre des deux côtés : ${part(meme, N)} % (un tiers)`);
  }
});

test("lot 5, niveau 2 « Tout le tableau » : jusqu'à × 1 000, un nombre simple avec la plus grande unité, jamais de zéro juste après la virgule", () => {
  const SIMPLE = /^(\d{1,3}|\d{1,2},\d|\d,\d{2,3}|0,\d{1,3})$/;
  for (const t of TYPES) {
    P.setSeed(`T2${t}`);
    const N = 6000, schema = P.SCHEMAS[t], colonne = schema.slots, vues = new Set();
    let haut = 0, usuelles2 = 0, rare = 0, petit1 = 0, virgule = 0, milliemes = 0, meme = 0;
    for (let i = 0; i < N; i++) {
      const q = P.buildQuestionLogic(t, 2), g = grand(q), ecart = Math.abs(q.targetPos - q.sourcePos);
      // l'écart : 1 à 3 colonnes (longueurs, masses, capacités), une seule pour les aires et les volumes, 3 cases au plus pour « L ↔ m³ »
      assert.ok(ecart <= 3, `${q.sourceUnit} → ${q.targetUnit} : plus de × 1 000`);
      if (t !== "cross") assert.ok(ecart >= colonne && ecart <= (colonne === 1 ? 3 : colonne), `${q.sourceUnit} → ${q.targetUnit}`);
      assert.match(g, SIMPLE, `${g} ${q.sourceUnit}/${q.targetUnit} n'est pas un nombre simple`);
      for (const s of [q.valStr, q.calcValStr]) {
        assert.doesNotMatch(s, /,0/, `${s} : un zéro juste après la virgule, c'est le niveau 3`);
        assert.ok(decimales(s) <= 3 && ecrits(s) <= 7, `${s} : 3 décimales et 7 chiffres au plus`);
        assert.doesNotMatch(s, /,\d*0$/, `${s} : pas de zéro inutile`);
      }
      if (decimales(g) === 3) { assert.equal(ecart, 3, `${g} : des millièmes seulement à × 1 000`); milliemes++; }
      const u = [q.sourceUnit, q.targetUnit].filter((x) => P.USUELLES.has(x)).length;
      if (u === 2) usuelles2++; else rare++;
      if (q.targetPos < q.sourcePos) haut++;
      if (q.targetPos === q.sourcePos) meme++;
      if (/^0,/.test(g)) petit1++;
      if (/,/.test(q.valStr + q.calcValStr)) virgule++;
      vues.add(paire(q));
    }
    const p = P.pairesDuTableau(t);
    assert.ok(vues.size >= p.toutes.length - (t === "cross" ? 2 : 0), `${t} : tout le tableau sort (${vues.size} paires sur ${p.toutes.length})`);
    assert.ok(p.deux.length >= 2 && p.une.length >= 2, "des paires de chaque sorte");
    const sens = part(haut, N - meme);
    assert.ok(sens > 45 && sens < 55, `${t} : ${sens} % vers la plus grande unité`);
    // 1 question sur 2 entre deux unités usuelles (plus celles du quart « tout le tableau »)
    assert.ok(part(usuelles2, N) > 50 && part(usuelles2, N) < 70, `${t} : ${part(usuelles2, N)} % entre deux unités usuelles`);
    assert.ok(part(rare, N) > 30, `${t} : ${part(rare, N)} % avec une autre unité du tableau`);
    // les nombres plus petits que 1 (0,5 L = 50 cL ; 750 g = 0,75 kg), qu'aucun niveau ne posait avant le lot 5
    assert.ok(part(petit1, N) > 10 && part(petit1, N) < 20, `${t} : ${part(petit1, N)} % de nombres plus petits que 1 (3 sur 20)`);
    assert.ok(part(virgule, N) > 40 && part(virgule, N) < 62, `${t} : ${part(virgule, N)} % de questions avec une virgule`);
    if (colonne !== 2) assert.ok(milliemes > 0, "des millièmes à × 1 000 (2,375 kg = 2 375 g)");
  }
  // les unités usuelles : celles du niveau 1 (sans dm), la tonne, et km²
  assert.deepEqual([...P.USUELLES].sort(), ["L", "cL", "cm", "cm²", "cm³", "dm²", "dm³", "g", "kg", "km", "km²", "m", "mL", "mg", "mm", "m²", "m³", "t"].sort());
});

test("lot 5, niveau 3 « Les pièges » : le tirage d'avant le lot 5, sans les monstres (4 décimales et 8 chiffres au plus)", () => {
  // Empreintes des 300 premières questions par case : calculées avec la page du main ea60818 (lot 4), en sautant les monstres
  // (n3-identique.mjs : sur 2 000 questions par case, la suite du lot est exactement celle du main, monstres en moins).
  const AVANT = { length: "bca852335407129f", mass: "77f1d83a86f6e15f", massT: "bba83573d5c2621f", volL: "269df653f757bd43", area: "051d128368dc7719", volM3: "fefc43b452e888e3", cross: "268f3ab63aa9f367" };
  for (const t of TYPES) {
    P.setSeed(`N3${t}`);
    const N = 3000, suite = []; let zero = 0, grandEcart = 0;
    for (let i = 0; i < N; i++) {
      const q = P.buildQuestionLogic(t, 3);
      if (i < 300) suite.push(`${q.valStr} ${q.sourceUnit} = ${q.calcValStr} ${q.targetUnit}`);
      for (const s of [q.valStr, q.calcValStr]) assert.ok(decimales(s) <= 4 && ecrits(s) <= 8, `${q.valStr} ${q.sourceUnit} = ${q.calcValStr} ${q.targetUnit}`);
      if (/^0,0|,0\d/.test(q.valStr) || /^0,0/.test(q.calcValStr)) zero++;
      if (Math.abs(q.targetPos - q.sourcePos) > 3) grandEcart++;
    }
    assert.equal(createHash("sha256").update(JSON.stringify(suite)).digest("hex").slice(0, 16), AVANT[t], `${t} : le tirage du niveau 3 a changé`);
    assert.ok(part(zero, N) > 30, `${t} : ${part(zero, N)} % de zéros à placer (0,05 ; 3,05 ; 0,045)`);
    // les grands écarts des aires et des volumes (1 m² = 10 000 cm², 1 m³ = 1 000 000 cm³) restent au niveau 3
    if (t === "area" || t === "volM3") assert.ok(part(grandEcart, N) > 15, `${t} : ${part(grandEcart, N)} % de grands écarts`);
  }
});

test("lot 5 : chaque niveau a assez de questions différentes pour une série de 20", () => {
  for (const t of TYPES) for (const lvl of [1, 2, 3]) for (let k = 0; k < 10; k++) {
    const s = P.tirerSerie([t], [lvl], 20, `Q${k}`);
    assert.equal(s.length, 20, `${t} niveau ${lvl}`);
    assert.equal(new Set(s.map((q) => q.textId)).size, 20);
  }
});

test("lot 5 : le nom de chaque niveau à côté de sa case ; sur ordinateur, la liste est rangée à droite et le bandeau garde sa hauteur", () => {
  const menu = html.slice(html.indexOf('<div class="config-block bloc-niveaux">'), html.indexOf('<label>Questions :</label>'));
  const noms = [...menu.matchAll(/<label><input type="checkbox" name="cbLevel" value="(\d)"( checked)?> ([^<]+)<\/label>/g)].map((m) => `${m[1]}${m[2] ? "*" : ""} ${m[3].replace(/&nbsp;/g, " ")}`);
  assert.deepEqual(noms, ["1* 1 · Les bases", "2 2 · Tout le tableau", "3 3 · Les pièges"]);
  // un nom ne se coupe jamais : espaces insécables et white-space: nowrap
  assert.doesNotMatch(menu.replace(/<[^>]+>/g, "").replace(/\s*\n\s*/g, "").trim().replace(/^Niveaux :/, ""), / /);
  assert.match(css5, /\.niveaux \{ display: flex; flex-direction: column;/);
  assert.match(css5, /\.niveaux label \{ cursor: pointer; white-space: nowrap; \}/);
  // ordinateur (900 px et plus) : la liste sort de la ligne des options, qui garde sa hauteur ; la place lui est réservée à droite
  const ordi = css5.split("@media screen and (min-width: 900px) {")[1].split("\n    }\n")[0];
  const reserve = Number(ordi.match(/\.bottom-config \{ position: relative; padding-right: (\d+)px; \}/)[1]);
  const m = ordi.match(/\.bloc-niveaux \{ position: absolute; top: 12px; right: (\d+)px; width: (\d+)px;/);
  assert.ok(Number(m[1]) + Number(m[2]) + 12 <= reserve, "la liste tient dans la place réservée");
  // le lien et les réglages ne changent pas : toujours niveaux=1,2,3
  assert.equal(P.ecrireLien({ cases: ["length"], niveaux: [1, 3], questions: 10, serie: "AB12", mode: "diapo", aide: "demande" }).includes("niveaux=1,3"), true);
  // les textes d'explication du haut de fichier et des tests disent les trois noms
  assert.match(script, /1 « Les bases »[\s\S]{0,400}2 « Tout le tableau »[\s\S]{0,400}3 « Les pièges »/);
});

test("lot 5, téléphone : la case de réponse a une largeur fixe, les chiffres rapetissent, « = » ne se sépare pas de la mesure", () => {
  const tel = [...css5.matchAll(/@media screen and \(max-width: 700px\) \{((?:[^{}]*\{[^}]*\})*)\s*\}/g)].map((m) => m[1]).join("\n");
  assert.match(tel, /\.entr \.champ \{ width: 7\.2em; min-width: 0; box-sizing: border-box; overflow: hidden; white-space: nowrap; \}/);
  assert.match(tel, /\.entr \.question-text \.conv-consigne \{ display: block;/);
  // hors du téléphone, la case garde sa règle d'avant (elle grandit avec la réponse)
  assert.match(css5, /\n    \.champ \{ display: inline-block; min-width: 3\.2em;/);
  assert.equal((css5.match(/\.champ \{[^}]*width: 7\.2em/g) || []).length, 1);
  const m = corps("majChamp");
  assert.match(m, /for \(let k = 1; k <= 8 && champ\.scrollWidth > champ\.clientWidth; k\+\+\) t\.style\.fontSize = \(100 - 8 \* k\) \+ '%';/);
  // 14 caractères (MAX_SAISIE) à 36 % au pire : la boucle s'arrête dès que le texte tient
  assert.equal(100 - 8 * 8, 36);
  // la mesure, une espace insécable et « = » dans le même bloc insécable ; la case et son unité dans un autre
  assert.match(corps("afficherQuestion"), /<span class="nb">\$\{mesure\(q\.valStr, q\.sourceUnit\)\}\$\{NBSP\}=<\/span> <span class="nb">\$\{champHTML\(\)\}\$\{NBSP\}<span id="uniteRep"><\/span><\/span>/);
  assert.match(css5, /\.nb \{ white-space: nowrap; \}/);
});

test("lot 5, téléphone : dans le tableau des aires et des volumes, le nom de l'unité reste au-dessus de la colonne de ses unités", () => {
  const tel = [...css5.matchAll(/@media screen and \(max-width: 700px\) \{((?:[^{}]*\{[^}]*\})*)\s*\}/g)].map((m) => m[1]).join("\n");
  // les colonnes gardent leur largeur (un nom trop large ne les pousse plus) …
  assert.match(tel, /\.board-columns \{ grid-template-columns: repeat\(var\(--cols, 7\), minmax\(0, 1fr\)\); \}/);
  assert.match(tel, /\.head-group, \.subhead-group, \.slots \{ grid-template-columns: none !important; grid-auto-flow: column; grid-auto-columns: minmax\(0, 1fr\); \}/);
  // … le nom est une étiquette centrée sur SA colonne (celle des unités), qui peut la dépasser ; les cases vides ne sont plus dessinées
  assert.match(tel, /\.head-group\.multi > \.unitBtn\.empty-unit \{ visibility: hidden; \}/);
  assert.match(tel, /\.head-group\.multi > \.unitBtn:not\(\.empty-unit\) \{ justify-self: center; width: max-content; min-width: 100%;/);
  assert.match(tel, /\.family-col:last-child \.head-group\.multi > \.unitBtn:not\(\.empty-unit\) \{ justify-self: end; \}/);
  assert.match(tel, /\.head-group\.multi > \.unitBtn span \{ font-size: inherit !important;/);
  // jamais une unité étalée sur ses 2 ou 3 colonnes (« dm³ » n'est pas le nom des trois colonnes), et aucune case retirée de la grille
  assert.doesNotMatch(css5, /head-group\.multi[^{]*\{[^}]*(grid-column|display: none)/);
  // ordinateur et tablette : rien de tout cela, et les grilles d'avant le lot 5 (1fr)
  const hors = css5.replace(/@media screen and \(max-width: 700px\) \{(?:[^{}]*\{[^}]*\})*\s*\}/g, "");
  assert.doesNotMatch(hors, /head-group\.multi|minmax\(0, 1fr\)|grid-auto-columns/);
  assert.match(hors, /\.board-columns \{ display: grid; grid-template-columns: repeat\(var\(--cols, 7\), 1fr\);/);
  assert.equal((script.match(/grid-template-columns: repeat\(\$\{schema\.slots\}, 1fr\)/g) || []).length, 3);
  assert.doesNotMatch(script, /minmax\(0, 1fr\)/);
  // la classe « multi » : seulement pour les tableaux à 2 ou 3 cases par unité ; une case sans nom porte « empty-unit »
  assert.match(script, /<div class="head-group\$\{schema\.slots > 1 \? ' multi' : ''\}" style="grid-template-columns: repeat\(\$\{schema\.slots\}, 1fr\)">/);
  assert.match(script, /let classes = `unitBtn \$\{!isLast \|\| !u \? 'empty-unit' : ''\}`;/);
});
