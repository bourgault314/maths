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
// Lot 5b (26/11/2026) : la dernière étiquette (« mm³ ») centrée comme les autres, une marge égale des deux côtés au téléphone,
// et la même étiquette sur tablette (jusqu'à 1 121 px de large) ; au-dessus, le tableau de l'ordinateur, inchangé.
// Lot 5c (26/11/2026) : jusqu'à 1 121 px, les petits noms (kL… mL ; ha, a) passent sous les cases ; la case et le nom restent dessinés
// dans la fenêtre ; le litre demandé est plus vif et plus grand ; hL, daL, dL, cL : la fenêtre encadre la case seule ; le cadre du nom en fondu.
// Lot 6 (28/11/2026) : les niveaux 2 et 3 refaits (la virgule au niveau 2, les zéros et les grands écarts au niveau 3) ; dam³, hm³, km³
// et le quintal retirés ; jamais moins de 1 dans la petite unité. Correctif : niveaux purs (on coche plusieurs niveaux pour mélanger),
// et chaque série suit une recette (mêmes sortes de questions, autant vers la petite unité que vers la grande, une conversion 2 fois au plus).
// Lot 7b (28/11/2026) : les ordres de grandeur en niveaux purs (objets familiers, moins familiers, dits dans une autre unité),
// 102 objets, « Quel objet ? » remis au menu, et une recette par série (un objet une fois, vrai/faux 5 contre 5, A, B, C équilibrés).
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
  vm.runInContext(`${script}\n;globalThis.__x = { SCHEMAS, EST_DB, ACTIONS_DB, PONTS_DB, TRI_DB, PROBLEMES, FRISE_EMOJIS, setSeed, decaler, ecrire, typo, valeurDe, buildQuestionLogic, buildProblemLogic, buildEstimationLogic, tirerSerie, chiffresDuTableau, vueColonnesUtiles, lireLien, ecrireLien, CASES_LIEN, normaliser, lireSaisie, dansLaFourchette, moitie, double, estJuste, bonneReponse, genreDe, etatFinal, typesEntrainement, resumeDe, MAX_SAISIE, MODES, AIDES, seriePlusCourte, BASES, USUELLES, pairesDuTableau, posUnite };`, ctx);
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

test("la frise : un émoji seulement s'il est à la bonne échelle (dg, m³ corrigés) ; plus de kL, dam³, hm³, km³ (lot 7b)", () => {
  const e = (dim, u) => P.FRISE_EMOJIS[dim].find((x) => x.u === u).e;
  assert.notEqual(e("mass", "dg"), "✉️");
  assert.notEqual(e("vol", "m³"), "🗑️");
  const unites = Object.values(P.FRISE_EMOJIS).flat().map((x) => x.u);
  for (const u of ["kL", "dam³", "hm³", "km³"]) assert.ok(!unites.includes(u), u);
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
    const cases = toutes.filter((c, i) => (i * 5 + k) % 4 === 0 || c === "est_action");   // « Action en classe » toujours cochée
    const s = P.tirerSerie(P.typesEntrainement(cases), [1, 2, 3].slice(k % 3), [5, 10, 15, 20][k % 4], `A${k}`);
    assert.ok(s.length > 0 && s.every((q) => q.caseCochee !== "est_action" && q.qType !== 5));
  }
  // le tirage du mode : le même que celui du diaporama, cases filtrées avant
  const g = corps("getQuizData");
  assert.ok(g.indexOf("typesEntrainement(rawTypes)") > 0 && g.indexOf("typesEntrainement(rawTypes)") < g.indexOf("tirerSerie("));
  assert.match(corps("commencerEntrainement"), /getQuizData\(true\)/);
  assert.doesNotMatch(corps("generateQuiz"), /getQuizData\(true\)/);
});

test("mêmes séries : pour un code, le diaporama redonne toujours la même série (empreintes du lot 7b)", () => {
  // Lot 6 (28/11/2026) : les niveaux 2 et 3 des conversions tirent autrement, et chaque série suit sa recette (sens équilibrés,
  // une conversion 2 fois au plus) : les 12 séries changent, celles du niveau 1 seul aussi (c'est voulu). Empreintes du lot 5 (main cfddd12) :
  // b1bf5c6cea92df25 abfd8cc5cf7adc44 8ce458a12d6b1106 b1d19b6f4ff14216 041ef6dfb61a4dff 73e4d6de2a9c3668
  // 9eb3c6b3676e7bcf 2221fcf22fbf455f fb41aa61468a7ad2 65070687aa4fbda6 51979d9c08eda848 5d9c80bfd2fbb109
  // Empreintes recalculées au lot 5 (25/11/2026) : les niveaux 1 et 2 des conversions tirent autrement (c'est voulu), et les 12 séries
  // en contiennent : les 12 changent. Sur les 400 séries de series-lot5.mjs (toutes ont une case de conversion) : 90 identiques ;
  // 257 changent par les niveaux 1 ou 2 ; 53 séries du niveau 3 seul changent parce qu'un monstre en est retiré (les 80 autres
  // sont identiques). 3 218 questions sur 5 000 gardent leur énoncé. Avant (main ea60818, lot 4) :
  // 7ea23a256e4ce84a 3ff1044104a1459c 3dba203c922ab7d9 396ca0475cb90a45 1882a290f925b597 1093cdf615757fb3
  // aebbf08878649521 edf17416f518c1e2 9f8433c35ad69b43 561637ada18f0264 bf8489d85a652448 ded48cda8fe4b5a3
  // Lot 7b (28/11/2026) : les ordres de grandeur tirent autrement (niveaux purs, objets neufs, recette par série) ; les 12 séries
  // en contiennent : les 12 changent (c'est voulu). Empreintes du lot 6 (main 19a2821) :
  // fe836e77fa942f5c 89166615b8e04dc0 f914e554e5065207 abe27b29958c9ba4 3e39c7fcbf32731d 2baf4ce7a6ff8746
  // 2cb165181e7ec682 2b7c873073daf350 3dfe115b871f509c 3784d241b9efd6d6 121d61a755dd9749 f249bc241f70243d
  const MAIN = ["0ce84bde809ef740", "01646b7bb5a674fe", "7783ded91845738a", "197570c9b5581750", "44f4d045ad157d66", "29b0446c1550bd19", "2077a48149706d80", "faa655745aab4736", "094c1e8993494f0e", "c6bd821628aad86c", "a1f1bbc2a6526d6e", "4588ac5be28337ba"];
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
  assert.match(readFileSync(new URL("../outils/index.html", import.meta.url), "utf8"), /catalogue-refonte-data\.js\?v=volumes-20261126-1/);
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
  assert.ok(!P.PONTS_DB.some((p) => /kilolitre|kL|dam³|km³/.test(p.q + p.c + p.w1 + p.w2)), "lot 7b : plus de kL, dam³ ni km³ dans les ponts");
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
  // lot 7b : l'objet dit dans son autre unité est écrit dans la banque (« autre ») ; jamais « 10 000 cm » ni « 5 000 cL »
  for (const it of Object.values(P.EST_DB).flat()) if (it.autre) assert.doesNotMatch(`${it.autre.val} ${it.autre.unit}`, /^\d{4,} (cm|cL)$/, it.items[0].n);
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
  assert.equal(p.length, 12, "lot 7b : 12 ponts au niveau 1");
  assert.equal(new Set(p.map((q) => q.textId)).size, 12);
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

// ---- lot 6 (28/11/2026) : les niveaux 2 et 3 refaits — chaque question tirée dans une « sorte » précise, puis vérifiée ----
// Ce qui tombait avant (main cfddd12, 2 000 questions par case) : au niveau 2, une question sur deux d'entier à entier et 29 % de réponses
// avec une virgule ; au niveau 3, 41 % de zéros à placer, 12 à 25 % d'entiers ordinaires et des « 17 000 km = 1 700 000 dam ».
const valeurNb = (s) => Number(s.replace(",", "."));
const petiteDe = (q) => (q.targetPos >= q.sourcePos ? q.calcValStr : q.valStr);
const SANS_SENS = /^((da|h|k)m³|q)$/;
// toujours, aux niveaux 2 et 3 : au moins 1 dans la petite unité, 3 décimales au plus (et 3 seulement à × 1 000), ni dam³, ni hm³, ni km³, ni quintal
function communes(q, t) {
  const quoi = `${q.valStr} ${q.sourceUnit} = ${q.calcValStr} ${q.targetUnit}`;
  assert.ok(valeurNb(petiteDe(q)) >= 1, `${quoi} : moins de 1 dans la petite unité`);
  assert.ok(!SANS_SENS.test(q.sourceUnit) && !SANS_SENS.test(q.targetUnit), `${quoi} : unité sans usage`);
  const ecart = Math.abs(q.targetPos - q.sourcePos);
  for (const s of [q.valStr, q.calcValStr]) {
    assert.ok(decimales(s) <= 3, `${quoi} : plus de 3 décimales`);
    if (decimales(s) === 3) assert.ok(ecart === 3 || ecart === 6, `${quoi} : des millièmes seulement à × 1 000`);
    assert.doesNotMatch(s, /,\d*0$/, `${quoi} : zéro inutile`);
  }
  if (["length", "mass", "massT", "volL"].includes(t)) assert.ok(ecart <= 3, `${quoi} : plus de × 1 000`);
  return quoi;
}

test("lot 6, niveau 2 « Tout le tableau » : la virgule avec les unités usuelles et les autres unités, jusqu'à × 1 000, sans zéro juste après la virgule", () => {
  assert.deepEqual([...P.USUELLES].sort(), ["L", "cL", "cm", "cm²", "cm³", "dm", "dm²", "dm³", "g", "kg", "km", "km²", "m", "mL", "mg", "mm", "m²", "m³", "t"].sort());
  for (const t of TYPES) {
    P.setSeed(`L6N2${t}`);
    const N = 4000, schema = P.SCHEMAS[t];
    let entEnt = 0, repDec = 0, autre = 0, haut = 0, meme = 0, bouge = 0;
    for (let i = 0; i < N; i++) {
      const q = P.buildQuestionLogic(t, 2), quoi = communes(q, t), ecart = Math.abs(q.targetPos - q.sourcePos);
      assert.ok(ecart <= 3, `${quoi} : plus de × 1 000`);
      if (t !== "cross") assert.ok(ecart >= schema.slots, quoi);
      for (const s of [q.valStr, q.calcValStr]) {
        assert.doesNotMatch(s, /,0/, `${quoi} : un zéro juste après la virgule, c'est le niveau 3`);
        assert.ok(ecrits(s.replace(/^0,/, "")) <= 5, `${quoi} : 5 chiffres au plus`);
      }
      if (!/,/.test(q.valStr + q.calcValStr)) entEnt++;
      if (/,/.test(q.calcValStr)) repDec++;
      if (/,/.test(q.valStr) && /,/.test(q.calcValStr)) bouge++;
      if (!(P.USUELLES.has(q.sourceUnit) && P.USUELLES.has(q.targetUnit))) autre++;
      if (q.targetPos < q.sourcePos) haut++;
      if (q.targetPos === q.sourcePos) meme++;
    }
    // niveaux purs (correctif du lot 6) : plus de rappel du niveau 1, seulement « 7 hm = 700 m » d'entier à entier ; la virgule dans la réponse une fois sur deux
    assert.ok(part(entEnt, N) > 5 && part(entEnt, N) < 15, `${t} : ${part(entEnt, N)} % d'entier à entier (1 sur 10 : 7 hm = 700 m)`);
    assert.ok(part(repDec, N) > 35 && part(repDec, N) < 58, `${t} : ${part(repDec, N)} % de réponses avec une virgule (près de la moitié ; 4 sur 10 pour les aires et les volumes, où « elle bouge » n'existe pas)`);
    assert.ok(part(autre, N) > 23 && part(autre, N) < 37, `${t} : ${part(autre, N)} % avec une autre unité du tableau (3 sur 10)`);
    const sens = part(haut, N - meme);
    assert.ok(sens > 42 && sens < 58, `${t} : ${sens} % vers la plus grande unité`);
    // « la virgule bouge » (2,75 m = 27,5 dm) : possible là où il y a des × 10 entre unités voisines
    if (["length", "volL", "cross", "mass"].includes(t)) assert.ok(part(bouge, N) > 2, `${t} : ${part(bouge, N)} % où la virgule bouge`);
  }
});

test("lot 6, niveau 3 « Les pièges » : les zéros à placer sous leurs quatre formes, les grands écarts des aires et des volumes", () => {
  for (const t of TYPES) {
    P.setSeed(`L6N3${t}`);
    const N = 4000, unD = ["length", "mass", "massT", "volL"].includes(t);
    let zero = 0, grand = 0, entEnt = 0, repDec = 0;
    const formes = [0, 0, 0, 0];
    for (let i = 0; i < N; i++) {
      const q = P.buildQuestionLogic(t, 3), quoi = communes(q, t), a = q.valStr, c = q.calcValStr;
      const loin = Math.abs(q.targetPos - q.sourcePos) > 3;
      for (const s of [a, c]) assert.ok(ecrits(s.replace(/^0,0*/, "")) <= (loin ? 7 : 6), `${quoi} : trop de chiffres`);
      if (loin) {
        grand++;
        assert.ok([q.sourceUnit, q.targetUnit].every((u) => /^(m|dm|cm|mm)[²³]$|^(L|cL|mL)$/.test(u)), `${quoi} : un grand écart entre unités usuelles`);
      }
      if (/,0/.test(a) || /,0/.test(c)) {
        zero++;
        if (/,0/.test(a) && valeurNb(a) >= 1 && !/,/.test(c)) formes[0]++;        // 3,05 m = 305 cm
        else if (/^0,0/.test(c)) formes[1]++;                                       // 3 cm = 0,03 m
        else if (/,0/.test(c)) formes[2]++;                                         // 305 cm = 3,05 m
        else if (/^0,0/.test(a)) formes[3]++;                                       // 0,05 hm = 50 dm
      }
      if (!/,/.test(a + c)) entEnt++;
      if (/,/.test(c)) repDec++;
    }
    if (unD) {
      assert.equal(grand, 0, `${t} : jamais plus de × 1 000`);
      assert.ok(part(zero, N) > 72, `${t} : ${part(zero, N)} % de zéros à placer (8 sur 10)`);
      assert.ok(part(entEnt, N) < 3, `${t} : ${part(entEnt, N)} % d'entier à entier (plus de rappel du niveau 1)`);
    } else {
      assert.ok(part(grand, N) > 30 && part(grand, N) < 48, `${t} : ${part(grand, N)} % de grands écarts (4 sur 10)`);
      assert.ok(part(zero, N) > 38, `${t} : ${part(zero, N)} % de zéros à placer`);
    }
    for (let f = 0; f < 4; f++) assert.ok(formes[f] / zero > 0.12, `${t} : la forme ${f + 1} du piège ne sort que ${Math.round((100 * formes[f]) / zero)} %`);
    assert.ok(part(repDec, N) > 38 && part(repDec, N) < 56, `${t} : ${part(repDec, N)} % de réponses avec une virgule`);
  }
});

// ---- correctif du lot 6 : la recette de chaque série, vérifiée série par série ----
function sorteDe(q) {
  const a = q.valStr, c = q.calcValStr, d = (s) => s.includes(","), usu = P.USUELLES.has(q.sourceUnit) && P.USUELLES.has(q.targetUnit);
  if (Math.abs(q.targetPos - q.sourcePos) > 3) return "G";
  if (/,0/.test(a) && valeurNb(a) >= 1 && !d(c)) return "P1";
  if (/^0,0/.test(c)) return "P2";
  if (/,0/.test(c)) return "P3";
  if (/^0,0/.test(a)) return "P4";
  if (!d(a) && !d(c)) return usu ? "B" : "AE";
  if (!usu) return "AV";
  return d(a) && d(c) ? "V3" : d(a) ? "V1" : "V2";
}
const UN_D = ["length", "mass", "massT", "volL"];

test("lot 6, correctif : chaque série de 10 suit sa recette (150 séries par case et par niveau)", () => {
  for (const t of TYPES) for (const lvl of [1, 2, 3]) for (let k = 0; k < 150; k++) {
    const serie = P.tirerSerie([t], [lvl], 10, `RC${k}`), so = serie.map(sorteDe), n = {};
    so.forEach((x) => (n[x] = (n[x] || 0) + 1));
    const quoi = `${t} niveau ${lvl} série RC${k} : ${so.join(" ")}`;
    assert.equal(serie.length, 10, quoi);
    // autant vers la petite unité que vers la grande (« 5 L = 5 dm³ » ne compte pas)
    const petite = serie.filter((q) => q.targetPos > q.sourcePos).length, grande = serie.filter((q) => q.targetPos < q.sourcePos).length;
    // (L ↔ m³ au niveau 1 : « 5 L = 5 dm³ » prend sa place dans la recette sans aller nulle part, d'où un écart de 3 au plus)
    assert.ok(Math.abs(petite - grande) <= (t === "cross" && lvl === 1 ? 3 : 2), `${quoi} : ${petite} vers la petite unité, ${grande} vers la grande`);
    // une même conversion 2 fois au plus : partout au niveau 3, et pour les longueurs au niveau 2 ; au niveau 2, la virgule se travaille
    // avec les unités usuelles, et certaines cases n'en ont que 2 ou 3 paires (kg ↔ g, g ↔ mg ; m² ↔ dm², dm² ↔ cm² ; L ↔ cL, L ↔ mL,
    // cL ↔ mL) : elles reviennent alors 3 ou 4 fois
    if (lvl > 1) {
      const paires = {};
      for (const q of serie) { const p = [q.sourceUnit, q.targetUnit].sort().join(); paires[p] = (paires[p] || 0) + 1; }
      const max = lvl === 3 || t === "length" ? 2 : t === "cross" || t === "volL" ? 3 : 4;
      assert.ok(Math.max(...Object.values(paires)) <= max, `${quoi} : une conversion revient plus de ${max} fois`);
    }
    const rep = serie.filter((q) => q.calcValStr.includes(",")).length;
    if (lvl === 1) assert.deepEqual(Object.keys(n), ["B"], quoi);
    if (lvl === 2) {
      // 3 « s'en va », 3 « arrive », 1 « bouge » (ou l'une des deux autres là où elle n'existe pas), 3 avec une autre unité
      assert.equal((n.AE || 0) + (n.AV || 0), 3, quoi);
      assert.ok((n.V1 || 0) >= 3 && (n.V2 || 0) >= 3 && (n.V1 || 0) + (n.V2 || 0) + (n.V3 || 0) === 7, quoi);
      if (["length", "volL"].includes(t)) assert.ok(n.V3 >= 1, `${quoi} : la virgule ne bouge jamais`);
      assert.ok(!n.B && !n.G && !Object.keys(n).some((x) => x[0] === "P"), quoi);
      assert.ok(rep >= 3 && rep <= 7, `${quoi} : ${rep} réponses avec une virgule`);
    }
    if (lvl === 3) {
      if (UN_D.includes(t)) {
        assert.deepEqual([n.P1, n.P2, n.P3, n.P4], [3, 3, 2, 2], `${quoi} : les quatre formes du piège`);
      } else {
        assert.equal(n.G, 4, `${quoi} : 4 grands écarts`);
        assert.equal((n.P1 || 0) + (n.P2 || 0) + (n.P3 || 0) + (n.P4 || 0), 6, quoi);
        assert.ok(["P1", "P2", "P3", "P4"].every((f) => n[f]), `${quoi} : il manque une forme du piège`);
      }
    }
  }
});

test("lot 6, correctif : une série de 5 reste équilibrée, et cocher deux niveaux partage la série", () => {
  for (const t of TYPES) for (let k = 0; k < 100; k++) {
    const cinq = P.tirerSerie([t], [2], 5, `C5${k}`).map(sorteDe);
    assert.ok(cinq.includes("V1") && cinq.includes("V2"), `${t} : ${cinq.join(" ")}`);
    const trois = P.tirerSerie([t], [3], 5, `C3${k}`).map(sorteDe);
    assert.ok(new Set(trois).size >= 3, `${t} niveau 3 en 5 questions : ${trois.join(" ")}`);
    // niveaux 1 et 2 cochés : 5 questions de chaque (plus de doublon de rappel)
    const deux = P.tirerSerie([t], [1, 2], 10, `C12${k}`).map(sorteDe);
    assert.equal(deux.filter((x) => x === "B").length, 5, `${t} niveaux 1 + 2 : ${deux.join(" ")}`);
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

// ---- lot 5b (26/11/2026) : « mm³ » centré au téléphone, et l'étiquette sur tablette ----
// Deux blocs de mise en page du tableau : l'étiquette (jusqu'à 1 121 px de large) et le téléphone (jusqu'à 700 px, le premier
// bloc « max-width: 700px » de la page). La case de réponse fixe a son propre bloc, limité à 700 px.
const blocs5b = (largeur) => [...css5.matchAll(new RegExp(`@media screen and \\(max-width: ${largeur}px\\) \\{((?:[^{}]*\\{[^}]*\\})*)\\s*\\}`, "g"))].map((m) => m[1]);
const etiquette5b = () => { const b = blocs5b(1121); assert.equal(b.length, 1, "un seul bloc pour l'étiquette"); return b[0]; };
const telephone5b = () => blocs5b(700).join("\n");
const regles5b = (bloc) => [...bloc.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => [m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim(), m[2].trim()]);

test("lot 5 et 5b : dans le tableau des aires et des volumes, le nom de l'unité est une étiquette au-dessus de la colonne de ses unités", () => {
  const eti = etiquette5b();
  // les colonnes gardent leur largeur (un nom trop large ne les pousse plus) …
  assert.match(eti, /\.board\.multi \.board-columns \{ grid-template-columns: repeat\(var\(--cols, 7\), minmax\(0, 1fr\)\); \}/);
  assert.match(eti, /\.board\.multi \.head-group, \.board\.multi \.subhead-group, \.board\.multi \.slots \{ grid-template-columns: none !important; grid-auto-flow: column; grid-auto-columns: minmax\(0, 1fr\); \}/);
  // … le nom est une étiquette centrée sur SA colonne (celle des unités), qui peut la dépasser ; les cases vides ne sont plus dessinées
  assert.match(eti, /\.head-group\.multi > \.unitBtn\.empty-unit \{ visibility: hidden; \}/);
  assert.match(eti, /\.head-group\.multi > \.unitBtn:not\(\.empty-unit\) \{ justify-self: center; width: max-content; min-width: 100%; box-sizing: border-box; padding: 0 3px; \}/);
  assert.match(eti, /\.head-group\.multi > \.unitBtn span \{ font-size: inherit !important; letter-spacing: normal !important; \}/);
  // jamais une unité étalée sur ses 2 ou 3 colonnes (« dm³ » n'est pas le nom des trois colonnes), et aucune case retirée de la grille
  assert.doesNotMatch(css5, /head-group\.multi[^{]*\{[^}]*(grid-column|display: none)/);
  assert.doesNotMatch(css5, /\.multi[^{]*\{[^}]*grid-column/);
  // au téléphone, tous les tableaux gardent des colonnes égales (lot 5)
  const tel = telephone5b();
  assert.match(tel, /\n      \.board-columns \{ grid-template-columns: repeat\(var\(--cols, 7\), minmax\(0, 1fr\)\); \}/);
  assert.match(tel, /\n      \.head-group, \.subhead-group, \.slots \{ grid-template-columns: none !important; grid-auto-flow: column; grid-auto-columns: minmax\(0, 1fr\); \}/);
  // la classe « multi » : seulement pour les tableaux à 2 ou 3 cases par unité ; une case sans nom porte « empty-unit »
  assert.match(script, /<div class="head-group\$\{schema\.slots > 1 \? ' multi' : ''\}" style="grid-template-columns: repeat\(\$\{schema\.slots\}, 1fr\)">/);
  assert.match(script, /let classes = `unitBtn \$\{!isLast \|\| !u \? 'empty-unit' : ''\}`;/);
  // … et le tableau lui-même la porte (lot 5b), posée avant que les colonnes soient écrites
  assert.match(corps("buildDiapoTableDOM"), /document\.getElementById\('mainBoard'\)\.classList\.toggle\('multi', schema\.slots > 1\);\n\s*columnsContainer\.innerHTML = buildHTMLColumns\(schema, false, null, 'diapo'\);/);
  assert.match(html, /<div class="board" id="mainBoard">/);
  for (const [id, sc] of Object.entries(P.SCHEMAS)) assert.equal(sc.slots > 1, ["area", "volM3", "cross"].includes(id), id);
});

test("lot 5b : la dernière étiquette (« mm³ », « dam³ »…) est centrée comme les autres", () => {
  // plus aucune étiquette calée au bord du tableau : la règle du lot 5 pour la dernière colonne est retirée
  assert.doesNotMatch(css5, /justify-self: (?!center)/);
  assert.equal((css5.match(/justify-self:/g) || []).length, 1, "une seule règle place l'étiquette : au milieu de sa colonne");
  assert.doesNotMatch(css5, /(last-child|last-of-type|nth-last)[^{]*(head-group|unitBtn)/);
  assert.doesNotMatch(css5, /(head-group|unitBtn)[^{]*(last-child|last-of-type|nth-last)/);
  // l'étiquette n'est jamais décalée à la main
  for (const [sel, decl] of [...regles5b(etiquette5b()), ...regles5b(telephone5b())]) {
    if (/unitBtn/.test(sel)) assert.doesNotMatch(decl, /margin|transform|translate|left:|right:|text-align/, sel);
  }
});

test("lot 5b, téléphone : le tableau des aires et des volumes laisse la même marge à gauche et à droite, assez pour l'étiquette", () => {
  const tel = telephone5b();
  // 12 px de chaque côté : le tableau est plus étroit de 24 px, et il reste au milieu (margin: 0 auto dans un cadre à marges égales)
  assert.match(tel, /\n      \.board\.multi \{ width: calc\(100% - 24px\); \}/);
  assert.match(css5, /\n    \.board \{ background: transparent; border: none; padding: 0; width: 100%; max-width: 1000px; margin: 0 auto; container-type: inline-size;\}/);
  assert.match(tel, /\n      \.table-box \{ padding: 10px 6px; \}/);
  assert.match(css5, /\n    \.table-box \{ padding: 10px 40px; display: none; justify-content: center;/);
  // rien d'autre ne déplace ce tableau, ni d'un côté ni de l'autre
  for (const [sel, decl] of regles5b(css5.replace(/\/\*[\s\S]*?\*\//g, ""))) {
    if (/\.board\.multi\s*$|\.board\.multi\s*,/.test(sel)) assert.equal(decl, "width: calc(100% - 24px);", sel);
    if (/(^|[\s,>])\.board(\.multi)?\s*(,|$)/.test(sel)) assert.doesNotMatch(decl, /margin-(left|right)|padding-(left|right)|transform|translate|justify-self|align-self/, sel);
  }
  // la marge est HORS du tableau : la taille des chiffres (95cqw du tableau) rétrécit avec lui, ils restent entiers dans leurs cases
  assert.match(css5, /@supports \(width: 1cqw\) \{ \.digit \{ font-size: min\(2\.8rem, calc\(95cqw \/ var\(--n, 7\)\)\); \} \}/);
  // la place qu'il faut : l'étiquette la plus large (« dam³ », 50,3 px mesurés à 16,8 px de police) au-dessus de la dernière de 12 cases,
  // sur un téléphone de 360 px : cadre blanc 342 px (page 8 + 8, bordure 1 + 1), cases espacées de 4 px
  const marge = Number(tel.match(/\.board\.multi \{ width: calc\(100% - (\d+)px\); \}/)[1]) / 2, bord = 6;
  const cas = (360 - 16 - 2 - 2 * bord - 2 * marge - 11 * 4) / 12;
  const depasse = (50.3 - cas) / 2;
  assert.ok(depasse <= bord + marge - 3, `l'étiquette reste à 3 px au moins du bord du cadre (${(bord + marge - depasse).toFixed(1)} px)`);
  assert.ok(23.83 - cas <= 2.05, "les cases de chiffres perdent 2 px au plus");
  // les cases plus étroites de 2 px : les petits noms de la 2e ligne (kL hL daL L dL cL mL, ha, a) rapetissent d'autant.
  // « hL » et « daL », voisins, font 47,5 px à eux deux à 16 px de police : leur écart (4,1 px sur le site à 360 px) est gardé
  assert.match(tel, /\n      \.board\.multi \.sub-lab \{ font-size: min\(0\.9rem, 4vw\); \}/);
  assert.equal((css5.match(/\.sub-lab \{/g) || []).length, 2, "la taille des petits noms n'est changée qu'au téléphone, dans ces tableaux");
  assert.match(css5, /\n    \.sub-lab \{ white-space: nowrap; font-weight: 900; color: color-mix\(in srgb, var\(--accent-dark\) 90%, black\); line-height: 1; \}/);
  const ecart = (largeur, police) => (largeur - 16 - 2 - 2 * bord - 2 * marge - 11 * 4) / 12 + 4 - (47.5 * police) / 16 / 2;
  assert.ok(ecart(360, 14.4) >= 4.1 && ecart(390, 14.4) >= 4.1, `« hL » et « daL » à ${ecart(360, 14.4).toFixed(1)} px l'un de l'autre à 360 px`);
  assert.ok(ecart(320, 0.04 * 320) >= 3, "et à 3 px au moins sur un téléphone de 320 px");
});

test("lot 5b, téléphone : les noms des aires et des volumes ont la même taille dans « Je projette » et dans « Je m'entraîne »", () => {
  const tel = telephone5b();
  // « Je m'entraîne » : 1,05rem (lot 3) ; « Je projette » : 1,25rem pour les autres tableaux, mais 1,05rem ici (à 20 px, deux noms voisins se touchaient)
  assert.match(tel, /\n      \.entr \.unitBtn \{ min-height: 34px; font-size: 1\.05rem; \}/);
  assert.match(tel, /\n      \.head-group\.multi > \.unitBtn:not\(\.empty-unit\) \{ font-size: min\(1\.05rem, 4\.7vw\); \}/);
  // 4,7vw ne joue que sous 358 px de large (petits téléphones de 320 px) : à 360 px et plus, c'est 1,05rem = 16,8 px
  assert.ok(4.7 * 3.6 >= 16.8 && 4.7 * 3.2 < 16.8);
  // la taille n'est fixée que là : sur tablette, les noms gardent les 1,25rem de la page (lot 5c : seul le petit nom demandé grossit)
  assert.doesNotMatch(etiquette5b(), /font-size: (?!inherit|1\.15em)/);
  assert.equal((etiquette5b().match(/font-size: 1\.15em/g) || []).length, 1);
  assert.match(css5, /\n    \.unitBtn \{ background: color-mix\(in srgb, var\(--accent\) 12%, #fff\); border: 2px solid var\(--accent\); border-radius: 8px; font-size: 1\.25rem;/);
});

test("lot 5b : l'étiquette aussi sur tablette, tant que le tableau est plus étroit que celui de l'ordinateur (jusqu'à 1 121 px de large)", () => {
  etiquette5b();
  // d'où vient 1 121 : le tableau fait 1 000 px au plus ; il les atteint quand le cadre blanc (page moins 20 + 20, bordure 1 + 1)
  // moins les marges du tableau (40 + 40) fait 1 000 px, donc à 1 122 px de large. En dessous, il est plus étroit.
  const px = (re) => Number(css5.match(re)[1]);
  const maxi = px(/\n    \.board \{[^}]*max-width: (\d+)px;/), page = px(/\n    body \{[^}]*padding: (\d+)px; \}/);
  const cadre = px(/\n    \.diapo-container \{[^}]*max-width: (\d+)px;/), bordure = px(/\n    \.diapo-container \{[^}]*border: (\d+)px solid/);
  const cote = px(/\n    \.table-box \{ padding: 10px (\d+)px;/);
  const tableau = (w) => Math.min(maxi, Math.min(cadre, w - 2 * page) - 2 * bordure - 2 * cote);
  assert.equal(tableau(1122), 1000);
  assert.equal(tableau(1121), 999);
  assert.equal(tableau(1920), 1000);
  const limite = Number(css5.match(/@media screen and \(max-width: (\d+)px\) \{\s*\.board\.multi \.board-columns/)[1]);
  assert.equal(limite, 1121);
  assert.equal(tableau(limite) < maxi && tableau(limite + 1) === maxi, true);
  // aucune taille d'ordinateur vérifiée n'est touchée : 1180, 1366, 1440 et 1920 de large
  for (const w of [1180, 1366, 1440, 1920]) assert.ok(w > limite, String(w));
  // les marges du tableau qui servent à ce calcul ne changent avec la hauteur de la fenêtre que de haut en bas
  assert.match(css5, /@media screen and \(min-width: 701px\) and \(max-height: 800px\) \{[\s\S]*?\n      \.table-box \{ padding: 4px 40px; \}/);
});

test("lot 5b : rien au-dessus de 1 121 px, et de 701 à 1 121 px seuls les tableaux à 2 ou 3 cases par unité changent", () => {
  // dans le bloc de l'étiquette, chaque règle ne vise que le tableau « multi »
  for (const [sel] of regles5b(etiquette5b())) for (const un of sel.split(",")) assert.match(un, /\.multi\b/, `« ${un.trim()} » toucherait tous les tableaux sur tablette`);
  // hors de ces deux blocs : rien de l'étiquette, et les grilles d'avant le lot 5 (1fr)
  const hors = css5.replace(/@media screen and \(max-width: (?:700|1121)px\) \{(?:[^{}]*\{[^}]*\})*\s*\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(hors, /\.multi\b|minmax\(0, 1fr\)|grid-auto-columns|empty-unit \{ visibility/);
  assert.match(hors, /\.board-columns \{ display: grid; grid-template-columns: repeat\(var\(--cols, 7\), 1fr\);/);
  assert.match(hors, /\n    \.head-group \{ display: grid; gap: 4px; \}/);
  assert.match(hors, /\n    \.unitBtn\.empty-unit \{ background: transparent; border-color: color-mix\(in srgb, var\(--accent\) 30%, transparent\); \}/);
  assert.equal((script.match(/grid-template-columns: repeat\(\$\{schema\.slots\}, 1fr\)/g) || []).length, 3);
  assert.doesNotMatch(script, /minmax\(0, 1fr\)/);
  // « dam³ » un peu plus petit sur ordinateur : la page le fait toujours (l'étiquette, elle, met tous les noms à la même taille)
  assert.match(script, /if \(isLast && u\.length >= 4 && schema\.slots === 3\) styleText = 'font-size: 0\.82em; letter-spacing: -0\.5px;';/);
  // aucune autre requête d'écran ne parle de 1 121 px, et l'étiquette n'a pas de plancher (elle vaut aussi au téléphone)
  assert.equal((css5.match(/1121px/g) || []).length, 1);
  assert.doesNotMatch(css5, /@media[^{]*min-width[^{]*\{\s*[^{}]*multi/);
  // la fiche imprimée : les deux blocs sont réservés à l'écran
  assert.equal((css5.match(/@media (?!screen|print|\(prefers-reduced-motion)[^{]*\{/g) || []).length, 0);
});

test("lot 5b : la case de réponse fixe, les colonnes utiles et le pavé restent au téléphone (700 px), pas sur tablette", () => {
  // le bloc de la case de réponse est à part, et toujours limité à 700 px
  const blocs = blocs5b(700);
  const laCase = blocs.filter((b) => /\.entr \.champ \{ width: 7\.2em;/.test(b));
  assert.equal(laCase.length, 1);
  assert.doesNotMatch(laCase[0], /board|head-group|unitBtn|multi/, "le bloc de la case de réponse ne contient rien du tableau");
  assert.match(laCase[0], /\.entr \.question-text \.conv-consigne \{ display: block;/);
  assert.equal((css5.match(/width: 7\.2em/g) || []).length, 1);
  // le bloc de l'étiquette ne contient rien d'autre que le tableau
  assert.doesNotMatch(etiquette5b(), /champ|\.entr|conv-consigne|question|pave|diapo-container|table-box|\.inner|handle|digit/);
  // les colonnes utiles : toujours à 700 px (au-dessus, le tableau entier)
  assert.match(script, /function petitEcran\(\) \{ return typeof window !== 'undefined' && window\.matchMedia && window\.matchMedia\('\(max-width: 700px\)'\)\.matches; \}/);
  assert.equal((script.match(/max-width: \d+px/g) || []).length, 1);
  // la marge et la taille des noms du lot 5b : dans le bloc du téléphone, pas dans celui de l'étiquette
  assert.doesNotMatch(etiquette5b(), /calc\(100% - |vw\)/);
});

test("lot 5b : la fenêtre de l'unité fait le tour du nom (étiquette), puis descend sur la colonne, son trait sur leur contour ; ailleurs, le rectangle d'avant", () => {
  const p = corps("positionDiapoCursor");
  // l'étiquette se reconnaît à sa mise en page (centrée sur sa colonne), pas à une largeur d'écran recopiée dans le script
  assert.match(p, /const etiquette = !headBtn\.classList\.contains\('empty-unit'\) && getComputedStyle\(headBtn\)\.justifySelf === 'center';/);
  assert.match(p, /cursor\.classList\.toggle\('nom', etiquette\);/);
  // avec l'étiquette, le trait passe exactement sur le contour (0 px autour) ; sans elle, 2 px autour comme avant (w + gap, x - gap/2)
  assert.match(p, /let gap = 4;/);
  assert.match(p, /const autour = \(etiquette \|\| caseSeule\) \? 0 : gap\/2;/);
  assert.match(p, /cursor\.style\.width = `\$\{w \+ 2 \* autour\}px`;\n\s*cursor\.style\.transform = `translateX\(\$\{x - autour\}px\)`;/);
  // le cadre du nom : exactement le nom (jamais plus étroit que la colonne) ; la colonne part du bas du nom et s'arrête au bas de la case
  assert.match(p, /const basNom = headRect\.bottom - innerRect\.top;/);
  assert.match(p, /cursor\.style\.setProperty\('--nom-l', `\$\{Math\.max\(headRect\.width, w\)\}px`\);/);
  assert.match(p, /cursor\.style\.setProperty\('--nom-h', `\$\{headRect\.height\}px`\);/);
  assert.match(p, /cursor\.style\.setProperty\('--col-l', `\$\{w\}px`\);/);
  assert.match(p, /cursor\.style\.top = `\$\{basNom - 3\}px`;\n\s*cursor\.style\.height = `\$\{bottomPx - \(basNom - 3\)\}px`;/);
  // sans étiquette (ordinateur, autres tableaux, petit nom « hL ») : exactement le rectangle d'avant, du haut du nom au bas de la case
  assert.match(p, /\} else \{\n\s*cursor\.style\.top = `\$\{topPx - gap\/2\}px`;\n\s*cursor\.style\.height = `\$\{\(bottomPx - topPx\) \+ gap\}px`;\n\s*\}/);
  // lot 5c : le contour du nom choisi et celui de la case ne s'effacent plus sous la fenêtre (voir les tests du lot 5c)
  assert.match(p, /forEach\(b => b\.classList\.remove\('unit-highlight-text'\)\);\n\s*texteUnite\.classList\.add\('unit-highlight-text'\);/);
  assert.match(html, /<div class="cursor" id="diapoCursor"><\/div>\s*<div class="handle handle-top"[\s\S]*?<div class="board-columns" id="diapoBoardColumns"><\/div>/);
  // la mise en page : la colonne perd son bord du haut, le cadre du nom est posé dessus, centré, ouvert en bas sur la largeur de la colonne
  assert.match(css5, /\n    \.cursor\.nom \{ border-color: var\(--accent-dark\); border-top-width: 0; border-radius: 0 0 8px 8px; \}/);
  const avant = css5.match(/\n    \.cursor::before \{([^}]*)\}/)[1];
  assert.match(avant, /left: 50%; bottom: calc\(100% - 3px\); width: var\(--nom-l\); height: var\(--nom-h\); transform: translateX\(-50%\);/);
  assert.match(avant, /background: inherit; border: 3px solid var\(--accent-dark\);/);
  assert.match(avant, /--epaule: calc\(\(var\(--nom-l\) - var\(--col-l\)\) \/ 2\); border-radius: 8px 8px min\(8px, var\(--epaule\)\) min\(8px, var\(--epaule\)\);/);
  assert.equal((avant.match(/mask: linear-gradient\(#000, #000\) top \/ 100% calc\(100% - 3px\) no-repeat, linear-gradient\(#000, #000\) left bottom \/ var\(--epaule\) 3px no-repeat, linear-gradient\(#000, #000\) right bottom \/ var\(--epaule\) 3px no-repeat;/g) || []).length, 2, "avec et sans préfixe -webkit-");
  // mêmes arrondis que le nom et que la case (8 px), pour que le trait suive leur contour
  assert.match(css5, /\n    \.unitBtn \{[^}]*border: 2px solid var\(--accent\); border-radius: 8px;/);
  assert.match(css5, /\n    \.digit \{[^}]*border: 2px solid var\(--accent\); border-radius: 8px;/);
  // il suit la fenêtre quand elle glisse d'une unité à l'autre, et ne reçoit pas les touchers
  assert.match(avant, /pointer-events: none; transition: inherit;/);
  // la virgule reste à sa place : la fenêtre est plus étroite de 2 px à droite et en bas (11 + 2, 32 - 2)
  assert.match(css5, /\n    \.cursor::after \{ content: ","; position: absolute; bottom: 32px; right: -11px;/);
  assert.match(css5, /\n    \.cursor\.nom::after, \.cursor\.case-seule::after \{ right: -13px; bottom: 30px; \}/);
  // la fenêtre d'avant n'est pas touchée
  assert.match(css5, /\n    \.cursor \{ position: absolute; left: 0; box-sizing: border-box; background: color-mix\(in srgb, var\(--accent\) 15%, transparent\); border: 3px solid color-mix\(in srgb, var\(--accent-dark\) 60%, transparent\); border-radius: 8px;/);
  assert.equal((css5.match(/\.cursor\.nom/g) || []).length, 3);
});

// ---- lot 5c (26/11/2026) : les petits noms sous les cases, jusqu'à 1 121 px ----
test("lot 5c : jusqu'à 1 121 px, la ligne des petits noms passe sous les cases, noms alignés en haut ; l'ordinateur ne change pas", () => {
  const eti = etiquette5b();
  assert.match(eti, /\n      \.board\.multi \.family-col > \.cell \{ order: 2; \}/);
  assert.match(eti, /\n      \.board\.multi \.family-col > \.subhead-group \{ order: 3; \}/);
  assert.match(eti, /\n      \.board\.multi \.sub-lab-wrapper \{ align-items: flex-start; \}/);
  // hors du bloc de l'étiquette : l'ordre de la page (nom, petits noms, case) et les petits noms alignés en bas, comme avant
  const hors = css5.replace(/@media screen and \(max-width: (?:700|1121)px\) \{(?:[^{}]*\{[^}]*\})*\s*\}/g, "");
  assert.doesNotMatch(hors, /[\s;{]order:/);
  assert.match(hors, /\n    \.sub-lab-wrapper \{ display: flex; justify-content: center; align-items: flex-end; \}/);
  assert.match(script, /html \+= `<div class="family-col">`;[\s\S]*?head-group[\s\S]*?subhead-group[\s\S]*?<div class="cell">/);
  // la flèche « Le chiffre des unités » descend sous la ligne des petits noms (sa hauteur + 6 px d'écart) quand ils sont sous les cases
  const p = corps("positionDiapoCursor");
  assert.match(p, /const sousNoms = colDiv\.querySelector\('\.subhead-group'\);\n\s*const nomsDessous = !!sousNoms && sousNoms\.getBoundingClientRect\(\)\.top >= cellRect\.bottom;/);
  assert.match(p, /const basFleche = nomsDessous \? sousNoms\.getBoundingClientRect\(\)\.bottom - innerRect\.top : bottomPx;\n\s*handles\[1\]\.style\.top = `\$\{basFleche \+ 14\}px`;/);
  assert.match(css5, /\n    \.family-col \{ display: flex; flex-direction: column; gap: 6px; \}/);
  assert.match(css5, /\n    \.subhead-group \{ display: grid; gap: 4px; height: 22px;/);
  // la flèche du haut ne bouge pas : au-dessus de la ligne des étiquettes (elle ne cache jamais « dm³ » ni « cm³ »)
  assert.match(p, /handles\[0\]\.style\.top = `\$\{topPx - \(handles\[0\]\.offsetHeight \|\| 75\) - 14\}px`;/);
  assert.match(p, /let topPx = headRect\.top - innerRect\.top;/);
});

test("lot 5c : la case et le nom restent dessinés dans la fenêtre (leur contour rose), pour toutes les fenêtres", () => {
  assert.doesNotMatch(css5, /nom-choisi|border-color: transparent; \}\n/);
  assert.doesNotMatch(html, /nom-choisi/);
  assert.doesNotMatch(css5, /unit-highlight[^{]*\{[^}]*border/);
  assert.match(css5, /\n    \.digit \{[^}]*border: 2px solid var\(--accent\);/);
  assert.match(css5, /\n    \.unitBtn \{[^}]*border: 2px solid var\(--accent\);/);
});

test("lot 5c : le litre demandé (L, mL ; hL, daL, dL, cL) est plus vif et plus grand, jusqu'à 1 121 px", () => {
  assert.match(etiquette5b(), /\n      \.board\.multi \.sub-lab\.unit-highlight-text \{ color: var\(--accent\) !important; font-size: 1\.15em; \}/);
  // au téléphone, les petits noms ont leur propre taille (min(0.9rem, 4vw)) : le nom demandé en vaut 1,15 fois, pas 1,15 fois le texte
  // de la page (18,4 px au lieu de 14,7 px à 320 px de large : « hL » touchait « daL »)
  assert.match(telephone5b(), /\n      \.board\.multi \.sub-lab \{ font-size: min\(0\.9rem, 4vw\); \}\n[^\n]*\n      \.board\.multi \.sub-lab\.unit-highlight-text \{ font-size: calc\(1\.15 \* min\(0\.9rem, 4vw\)\); \}/);
  assert.ok(1.15 * Math.min(0.9 * 16, 0.04 * 320) - 0.04 * 320 < 2.1, "à 320 px, le nom demandé grandit de moins de 2,1 px");
  // c'est bien le petit nom qui porte la marque quand il est l'unité demandée
  const p = corps("positionDiapoCursor");
  assert.match(p, /const texteUnite = \(labEl && labEl\.textContent === unite\) \? labEl : headBtn;/);
  assert.match(p, /texteUnite\.classList\.add\('unit-highlight-text'\);/);
  // seuls les litres sont des petits noms demandés : kL, ha et a ne sont jamais l'unité de départ ni d'arrivée
  const demandes = (cas, niv) => { const d = new Set(); P.setSeed(`5c${cas}${niv}`);
    for (let i = 0; i < 2000; i++) { const q = P.buildQuestionLogic(cas, niv); d.add(q.sourceUnit); d.add(q.targetUnit); } return d; };
  for (const cas of ["cross", "area"]) for (const niv of [1, 2, 3]) for (const u of ["kL", "ha", "a"]) assert.ok(!demandes(cas, niv).has(u), `${u} demandé`);
  for (const u of ["L", "mL"]) assert.ok(demandes("cross", 1).has(u), `${u} jamais demandé au niveau 1`);
  for (const niv of [2, 3]) for (const u of ["hL", "dL", "cL"]) assert.ok(demandes("cross", niv).has(u), `${u} jamais demandé au niveau ${niv}`);
});

test("lot 5c : hL, daL, dL, cL — la fenêtre encadre la case seule, le même trait foncé de 3 px, exactement sur son contour", () => {
  const p = corps("positionDiapoCursor");
  assert.match(p, /const caseSeule = !etiquette && nomsDessous && texteUnite === labEl;/);
  assert.match(p, /const autour = \(etiquette \|\| caseSeule\) \? 0 : gap\/2;/);
  assert.match(p, /cursor\.classList\.toggle\('case-seule', caseSeule\);/);
  assert.match(p, /\} else if \(caseSeule\) \{\n\s*cursor\.style\.top = `\$\{cellRect\.top - innerRect\.top\}px`;\n\s*cursor\.style\.height = `\$\{cellRect\.height\}px`;\n\s*\} else \{/);
  assert.match(css5, /\n    \.cursor\.case-seule \{ border-color: var\(--accent-dark\); \}/);
  assert.match(css5, /\n    \.cursor \{[^}]*border: 3px solid/);
  // la page ne recopie aucune largeur d'écran dans le script : tout se lit sur la mise en page
  assert.equal((script.match(/max-width: \d+px/g) || []).length, 1);
});

test("lot 5c : le cadre du nom apparaît et disparaît en fondu pendant le glissement (1 s), il ne surgit pas avant le départ", () => {
  const avant = css5.match(/\n    \.cursor::before \{([^}]*)\}/)[1];
  assert.match(avant, /content: ""; position: absolute;/);
  assert.match(avant, /transition: inherit; opacity: 0;/);
  assert.match(css5, /\n    \.cursor\.nom::before \{ opacity: 1; \}/);
  assert.doesNotMatch(css5, /\.cursor\.nom::before \{ content/);
  const p = corps("positionDiapoCursor");
  assert.match(p, /const trans = animate \? 'transform 1s ease-in-out, width 1s ease-in-out, top 1s ease-in-out, height 1s ease-in-out, opacity 1s ease-in-out, border-top-width 1s ease-in-out, border-radius 1s ease-in-out' : 'none';/);
  assert.match(p, /cursor\.style\.transition = trans;/);
});

// ---- Lot 7b (28/11/2026) : les ordres de grandeur, niveaux purs et recette par série ----
// 1 : objets familiers, fausses à × 100 ou × 1 000 · 2 : objets moins familiers, fausses à × 10 ·
// 3 : l'objet dit dans une autre unité, fausses à × 10, jamais « 0,0… ». Dans une série : un objet une seule fois,
// vrai/faux 5 contre 5, la bonne réponse autant en A, B et C, jamais deux fois la même liste à classer.
const EST7 = ["est_grandeur", "est_unit", "est_obj", "est_val", "est_tf", "est_trou", "est_assoc", "est_tri", "est_pont"];
const OBJ7 = () => Object.entries(P.EST_DB).flatMap(([d, l]) => l.map((it) => ({ d, it, n: it.items[0].n, c: it.items[0].c })));
const vrai7 = (val, unit) => Number(P.valeurDe(String(val).replace(".", ",").replace(/[\s  ]/g, ""), unit).replace(",", "."));
const lu7 = (m) => { const x = sansBalises(m).replace(/[\s  ]/g, " ").trim().match(/^([\d ,]+) (\S+)$/); return x && { val: x[1].replace(/ /g, ""), unit: x[2], v: vrai7(x[1], x[2]) }; };
// les objets que pose une question (« Quel objet ? » : la bonne réponse ; « Quelle grandeur ? » : la phrase « Pour savoir »)
function objets7(q) {
  const o = OBJ7();
  if (q.objets) return q.objets.map((n) => o.find((x) => x.n === n));
  if (q.qType === 3) return [o.find((x) => P.typo(x.c.charAt(0).toUpperCase() + x.c.slice(1)) === P.typo(q.choices[q.correctIndex]))];
  if (q.qType === 6) { const p = sansBalises(q.problemText).replace(/^Pour savoir (.*), quelle.*$/, "$1"); return [o.find((x) => x.it.items[0].pour === p)]; }
  return q.sujet ? [o.find((x) => x.n === q.sujet)] : [];
}

test("lot 7b : la banque des objets (assez à chaque niveau, un nom court, l'autre unité au niveau 3, jamais « 0,0… »)", () => {
  const o = OBJ7();
  for (const lvl of [1, 2, 3]) assert.ok(o.filter((x) => x.it.lvl === lvl).length >= 30, `niveau ${lvl}`);
  assert.equal(new Set(o.map((x) => x.n)).size, o.length, "deux objets du même nom");
  assert.equal(new Set(o.map((x) => x.c)).size, o.length, "deux noms courts identiques");
  for (const { d, it, n, c } of o) {
    assert.ok(c && it.items[0].pour && it.repere, n);
    if (it.lvl === 3) {
      assert.ok(it.autre, `${n} : pas d'autre unité au niveau 3`);
      assert.notEqual(it.autre.unit, it.unit, n);
      assert.equal(vrai7(it.autre.val, it.autre.unit), vrai7(it.val, it.unit), `${n} : l'autre unité ne dit pas la même mesure`);
      assert.doesNotMatch(String(it.autre.val), /^0[,.]0/, n);
    } else assert.ok(!it.autre, n);
    // « Quel objet ? » : chaque objet a au moins deux voisins de sa grandeur et de son niveau, 3 fois plus grands ou plus petits
    const m = (x) => (it.lvl === 3 ? vrai7(x.autre.val, x.autre.unit) : vrai7(x.val, x.unit));
    const voisins = P.EST_DB[d].filter((x) => x !== it && x.lvl === it.lvl && Math.max(m(x), m(it)) / Math.min(m(x), m(it)) >= 3);
    assert.ok(voisins.length >= 2, `${n} : moins de deux voisins à × 3`);
  }
  // les ponts : 10 au moins par niveau, plus de kL, dam³, km³
  for (const lvl of [1, 2, 3]) assert.ok(P.PONTS_DB.filter((p) => p.lvl === lvl).length >= 10, `ponts niveau ${lvl}`);
  // les listes à classer : 13 au moins par niveau, bien rangées, sans « 0,0… » ni dam³, kL ; hL, daL, dag seulement au niveau 2
  for (const lvl of [1, 2, 3]) assert.ok(P.TRI_DB.filter((t) => t.lvl === lvl).length >= 13, `classer niveau ${lvl}`);
  for (const t of P.TRI_DB) {
    const v = t.arr.map((m) => { const x = lu7(m); return vrai7(x.val, ({ "dm³": "L", "cm³": "mL" })[x.unit] && t.dim === "Capacité" ? ({ "dm³": "L", "cm³": "mL" })[x.unit] : x.unit); });
    for (let k = 1; k < 4; k++) assert.ok(v[k] > v[k - 1], t.arr.join(" < "));
    assert.ok(!t.arr.some((m) => /^0,0|dam³|kL|km³/.test(m)), t.arr.join(" "));
    if (t.lvl !== 2) assert.ok(!t.arr.some((m) => / (hL|daL|dag|hg)$/.test(m)), t.arr.join(" "));
  }
  // la frise de « Quelle unité ? » et le menu : « Quel objet ? » après « Quelle unité ? », « objet » dans le lien
  assert.match(html, /value="est_unit"> <div><strong>Quelle unité \?<\/strong><\/div><\/label>\n\s*<label class="cb-row"><input type="checkbox" value="est_obj"> <div><strong>Quel objet \?<\/strong><\/div><\/label>/);
  assert.equal(P.CASES_LIEN.est_obj, "objet");
});

test("lot 7b : chaque série de 10 suit sa recette (150 séries par case et par niveau)", () => {
  for (const t of EST7) for (const lvl of [1, 2, 3]) for (let k = 0; k < 150; k++) {
    const serie = P.tirerSerie([t], [lvl], 10, `R7${k}`);
    const quoi = `${t} niveau ${lvl} série R7${k}`;
    assert.equal(serie.length, 10, quoi);
    const vus = {}, lettres = [0, 0, 0], listes = new Set();
    let vrais = 0;
    for (const q of serie) {
      const txt = [q.problemText, q.correctionText, ...(q.choices || [])].map(sansBalises).join(" | ");
      assert.doesNotMatch(txt.replace(/[  ]/g, " "), /(^|[^\d,])0,0\d/, `${quoi} : « 0,0… » dans ${txt}`);
      if (q.choices && q.choices.length === 3) lettres[q.correctIndex]++;
      if (t === "est_pont") assert.equal(P.PONTS_DB.find((p) => p.q === q.problemText).lvl, lvl, quoi);
      if (t === "est_tri") {
        assert.equal(P.TRI_DB.find((x) => x.arr.join("|") === q.ordre.join("|")).lvl, lvl, quoi);
        assert.ok(!listes.has(q.ordre.join("|")), `${quoi} : la même liste deux fois`); listes.add(q.ordre.join("|"));
      }
      const objs = objets7(q);
      for (const x of objs) { assert.ok(x, `${quoi} : objet introuvable`); assert.equal(x.it.lvl, lvl, `${quoi} : ${x.n} est du niveau ${x.it.lvl}`); vus[x.n] = (vus[x.n] || 0) + 1; }
      if (t === "est_assoc") assert.equal(new Set(objs.map((x) => x.d)).size, 1, `${quoi} : trois grandeurs différentes`);
      // la mesure juste : au niveau 3, dans l'autre unité ; les fausses : × 100 ou × 1 000 au niveau 1, × 10 ensuite
      const x = objs[0];
      let juste = null, fausses = [];
      if (t === "est_val") { juste = lu7(q.choices[q.correctIndex]); fausses = q.choices.filter((_, i) => i !== q.correctIndex).map(lu7); }
      if (t === "est_trou") juste = { val: q.reponse, unit: q.uniteReponse, v: vrai7(q.reponse, q.uniteReponse) };
      if (t === "est_obj") juste = lu7(sansBalises(q.problemText).match(/environ (.*) \?$/)[1]);
      if (t === "est_tf") {
        const m = lu7(sansBalises(q.problemText).match(/environ (.*)\.$/)[1]);
        if (q.correctIndex === 0) { juste = m; vrais++; } else { juste = { unit: m.unit, v: vrai7(x.it.val, x.it.unit) }; fausses = [m]; }
      }
      if (juste) {
        assert.equal(juste.unit, lvl === 3 ? x.it.autre.unit : x.it.unit, `${quoi} : ${x.n} en ${juste.unit}`);
        assert.equal(juste.v, vrai7(x.it.val, x.it.unit), `${quoi} : ${x.n}`);
        for (const f of fausses) {
          const e = Math.abs(Math.round(Math.log10(f.v / juste.v)));
          assert.equal(f.unit, juste.unit, quoi);
          if (lvl === 1) assert.ok(e === 2 || e === 3, `${quoi} : ${x.n} faux à × 10^${e}`);
          else if (t === "est_tf" || lvl === 2) assert.equal(e, 1, `${quoi} : ${x.n} faux à × 10^${e}`);
          else assert.ok(e === 1 || e === 2, `${quoi} : ${x.n} faux à × 10^${e}`);
        }
      }
      if (t === "est_obj") {
        const autres = q.choices.filter((_, i) => i !== q.correctIndex).map((c) => OBJ7().find((o) => P.typo(o.c.charAt(0).toUpperCase() + o.c.slice(1)) === P.typo(c)));
        for (const o of autres) {
          assert.ok(o && o.d === x.d && o.it.lvl === lvl, `${quoi} : un autre choix hors de la grandeur ou du niveau`);
          const m = (y) => vrai7(y.it.val, y.it.unit);
          assert.ok(Math.max(m(o), m(x)) / Math.min(m(o), m(x)) >= 3, `${quoi} : ${o.n} trop proche de ${x.n}`);
        }
      }
    }
    // un objet une seule fois (« Associer » au niveau 3 : 30 places pour 32 objets, deux fois au plus)
    const max = Math.max(0, ...Object.values(vus));
    assert.ok(max <= (t === "est_assoc" ? 2 : 1), `${quoi} : un objet ${max} fois`);
    if (t === "est_tf") assert.equal(vrais, 5, `${quoi} : ${vrais} vrais`);
    if (lettres.some((n) => n)) assert.ok(Math.max(...lettres) <= 4, `${quoi} : A ${lettres[0]}, B ${lettres[1]}, C ${lettres[2]}`);
  }
});

test("lot 7b : séries de 5, plusieurs niveaux cochés, toutes les cases ensemble", () => {
  for (let k = 0; k < 100; k++) {
    const tf = P.tirerSerie(["est_tf"], [1, 2, 3], 10, `T7${k}`);
    assert.equal(tf.filter((q) => q.correctIndex === 0).length, 5, "trois niveaux cochés : 5 vrais sur 10");
    const cinq = P.tirerSerie(["est_tf"], [2], 5, `F7${k}`).filter((q) => q.correctIndex === 0).length;
    assert.ok(cinq === 2 || cinq === 3, `série de 5 : ${cinq} vrais`);
    for (const [niv, n] of [[[1, 2, 3], 10], [[2], 10], [[1, 2, 3], 5]]) {
      const s = P.tirerSerie(EST7, niv, n, `M7${k}`);
      assert.equal(s.length, n);
      const vus = {};
      for (const q of s) for (const x of objets7(q)) { vus[x.n] = (vus[x.n] || 0) + 1; assert.ok(niv.includes(x.it.lvl)); }
      assert.ok(Math.max(0, ...Object.values(vus)) === 1, `toutes les cases, niveaux ${niv} : un objet revient`);
    }
  }
  // chaque case seule a assez de questions pour une série de 10 à chaque niveau (« Action en classe » : 9 au niveau 3, le menu le dit)
  for (const t of [...EST7, "est_action"]) for (const lvl of [1, 2, 3]) {
    const s = P.tirerSerie([t], [lvl], 10, `N7${t}${lvl}`);
    assert.equal(s.length, t === "est_action" && lvl === 3 ? 9 : 10, `${t} niveau ${lvl}`);
    if (t === "est_action") assert.ok(s.every((q) => P.ACTIONS_DB.find((a) => a.q === q.problemText).lvl === lvl));
  }
});
