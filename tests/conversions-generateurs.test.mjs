// Défi conversions — le banc d'essai des générateurs (fiche technique § 2.6).
//
// Pour CHAQUE étape construite, 2 000 graines et tous les usages
// (validation, entraînement, test, échauffement, aide, exerciseur à 30) :
//   1. la réponse, RECALCULÉE à part depuis `donnees` (sa propre table des
//      unités et des BigInt, sans passer par le générateur) ;
//   2. l'écriture (ni point décimal, ni « e+ », ni NaN… ; U+00A0 avant
//      l'unité, U+202F dans les milliers) ;
//   3. les bornes des objets, résultat compris ; restes positifs ;
//   4. la série (pas deux fois la même question, aucun exemple de
//      J'apprends, degrés dans l'ordre, formes prévues, un Oui et un Non) ;
//   5. les choix (tous différents, la bonne réponse une fois) ;
//   6. le français (ni « il » ni « elle » pour une personne…) ;
//   7. le déterminisme ;
//   8. les erreurs connues (chacune déclenchée, retour bien écrit) ;
//   9. (audit du 12/11) le programme de CE2 au palier 1 : des nombres
//      jusqu'à 10 000, pas de nombre à virgule (sauf le repère 7,5 g) ;
//      les aides qui ne donnent pas la réponse ; l'image dessinée ; Oui et
//      Non à parts égales.
//  10. (lot A2 bis) les euros et les centimes, la durée entre deux heures,
//      « associer », « ranger », « qu'est-ce qu'on mesure ? », « h, min ou
//      jours » : réponses recalculées à part ; la bonne réponse à TOUTES
//      les places (choix, objets reliés, mesures rangées) ; des durées et
//      des prix vraisemblables.
// BANC_GRAINES=200 node --test tests/conversions-generateurs.test.mjs : plus court.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CARTE = require("../outils/conversions/conversions_carte.js");
const G = require("../outils/conversions/conversions_generateurs.js");

const GRAINES = Number(process.env.BANC_GRAINES || 2000);
const PRETES = CARTE.ORDRE.filter(c => CARTE.etape(c).pret);
const USAGES = [["valide", null], ["entraine", null], ["test", null], ["echauffement", null], ["aide", null], ["exerciseur", 30]];
const NB = " ";
const FINE = " ";

// ------------------------------------------------- le recalcul, à part
const EXPOSANTS = {km: 3, m: 0, dm: -1, cm: -2, mm: -3, t: 6, kg: 3, g: 0, L: 0, dL: -1, cL: -2, "€": 2, c: 0};
const FAMILLE = {km: "l", m: "l", dm: "l", cm: "l", mm: "l", t: "m", kg: "m", g: "m", L: "c", dL: "c", cL: "c", "€": "a", c: "a"};
// Un texte « 12,5 » en millièmes, sans l'outil du générateur.
function lire(texte) {
  const [e, d = ""] = String(texte).split(",");
  if (!/^\d+$/.test(e) || !/^\d{0,3}$/.test(d)) throw new Error(`nombre illisible : ${texte}`);
  return BigInt(e) * 1000n + BigInt(d.padEnd(3, "0"));
}
function versUnite(m, de, vers) {
  assert.equal(FAMILLE[de], FAMILLE[vers], `${de} et ${vers} ne sont pas de la même grandeur`);
  const d = EXPOSANTS[de] - EXPOSANTS[vers];
  if (d >= 0) return m * 10n ** BigInt(d);
  const p = 10n ** BigInt(-d);
  assert.equal(m % p, 0n, "conversion hors des millièmes");
  return m / p;
}
function attendue(q) {
  const d = q.donnees;
  switch (d.type) {
    case "conv": return [versUnite(lire(d.valeur), d.de, d.vers)];
    case "somme": return [versUnite(lire(d.a), d.ua, d.vers) + versUnite(lire(d.b), d.ub, d.vers)];
    case "deux": {
      const total = versUnite(lire(d.valeur), d.de, d.petite);
      const f = versUnite(1000n, d.grande, d.petite);
      return [(total / f) * 1000n, total % f];
    }
    case "duree": return d.vers === "min" ? [BigInt(d.h * 60 + d.m) * 1000n] : [BigInt(d.m / 60) * 1000n];
    case "duree-deux": return [BigInt(Math.floor(d.m / 60)) * 1000n, BigInt(d.m % 60) * 1000n];
    case "duree-mots": {
      const total = d.h * 60 + d.demis * 30 + d.quarts * 15;
      return d.deux ? [BigInt(Math.floor(total / 60)) * 1000n, BigInt(total % 60) * 1000n] : [BigInt(total) * 1000n];
    }
    // Lot A2 bis
    case "argent": {
      const total = BigInt(d.sorte === "pieces" ? d.pieces.reduce((a, b) => a + b, 0) : d.total) * 1000n;
      if (Array.isArray(q.reponse)) return [(total / 100000n) * 1000n, total % 100000n];
      return [q.unite === "€" ? total / 100n : total];
    }
    case "entre": {
      const duree = d.arrivee - d.depart;
      assert.ok(duree > 0 && d.depart >= 7 * 60 && d.arrivee <= 20 * 60, "le même jour, en journée");
      assert.equal(d.depart % 5, 0); assert.equal(d.arrivee % 5, 0);
      const t = d.cherche === "duree" ? duree : d.cherche === "arrivee" ? d.arrivee : d.depart;
      if (Array.isArray(q.reponse)) return [BigInt(Math.floor(t / 60)) * 1000n, BigInt(t % 60) * 1000n];
      return [BigInt(d.cherche === "duree" && t < 60 ? t : t / 60) * 1000n];
    }
    case "pb": case "vrai": {
      const a = versUnite(lire(d.a), d.ua, d.vers);
      const b = versUnite(lire(d.b), d.ub, d.vers);
      return [d.op === "+" ? a + b : a - b];
    }
    default: return null;
  }
}

// ------------------------------------------------- les contrôles d'écriture
const INTERDITS = [/\d\.\d/, /e[+-]\d/, /000000/, /NaN|undefined|null|\[object/, /(^|[\s(=])[-−]\d/, /Dans d'/, /un demi de/, /pour \d+ identiques/, /La masse .* pèse/];
const PERSONNE = /\b(il|elle|ils|elles)\b/gi;
const IMPERSONNEL = /(il en faut|il reste|reste-t-il|il faut|il y a|y a-t-il|faut-il)/gi;
function ecriture(texte, ou) {
  INTERDITS.forEach(re => assert.doesNotMatch(texte, re, `${ou} : ${re} dans « ${texte} »`));
  assert.doesNotMatch(texte, /\d (?:km|m|dm|cm|mm|t|kg|g|L|dL|cL|min|h)(?![\wÀ-ÿ])/, `${ou} : espace normale avant l'unité dans « ${texte} »`);
  assert.doesNotMatch(texte, /\d[  ]\d{3}(?!\d)/, `${ou} : milliers sans espace fine dans « ${texte} »`);
  const sansImpersonnel = texte.replace(IMPERSONNEL, "");
  assert.doesNotMatch(sansImpersonnel, PERSONNE, `${ou} : « il » ou « elle » pour une personne dans « ${texte} »`);
  assert.doesNotMatch(texte, /[a-zà-ÿ,;] [A-ZÀ-Ý][a-zà-ÿ]+ (?:mesure|pèse|contient)/, `${ou} : majuscule au milieu d'une phrase`);
}
// Un nombre de 4 chiffres ou plus doit avoir son espace fine (2 600, 1 500).
function milliers(texte, ou) {
  const sans = texte.replace(/n°\s?\S+/g, "");
  assert.doesNotMatch(sans, /(?<![\d,])\d{4,}(?!\d)/, `${ou} : « ${texte} » a un nombre sans espace fine des milliers`);
}

// Une même question (mêmes textes, mêmes choix) n'est contrôlée qu'une fois :
// sur 2 000 graines, les étapes de faits reviennent sans cesse.
const dejaVues = new Set();
function controlerQuestion(q, ou) {
  const empreinte = JSON.stringify([q.texte, q.choix, q.bon, q.correction, q.image, q.donnees]);
  if (dejaVues.has(empreinte)) return;
  dejaVues.add(empreinte);
  const textes = [q.texte, q.reponseTexte, q.resume, ...(q.correction || []), ...(q.image || []), ...(q.choix || [])].filter(t => typeof t === "string");
  textes.forEach(t => { ecriture(t, ou); milliers(t, ou); });
  assert.match(q.cle, /^[^\s]+$/, `${ou} : clé avec espace`);
  // 1. la réponse recalculée
  const rec = attendue(q);
  if (rec) {
    if (q.forme === "vrai-faux") {
      const propose = lire(q.donnees.propose);
      assert.equal(q.bon === 0, propose === rec[0], `${ou} : verdict de vraisemblance faux`);
      assert.equal(q.donnees.vrai, propose === rec[0]);
    } else {
      const donnee = (Array.isArray(q.reponse) ? q.reponse : [q.reponse]).map(lire);
      assert.deepEqual(donnee, rec, `${ou} : réponse ${q.reponse} ≠ ${rec}`);
      rec.forEach(r => assert.ok(r > 0n || (q.forme === "deux-cases"), `${ou} : réponse nulle ou négative`));
      assert.ok(G.verifier(q, Array.isArray(q.reponse) ? q.reponse : q.reponse).juste, `${ou} : la bonne réponse est refusée`);
    }
  }
  // Les repères et « quelle unité » : la bonne réponse vient de la carte.
  if (q.donnees.type === "repere") {
    const r = CARTE.repere(q.donnees.repere);
    const bonne = q.donnees.sorte === "unite" ? r.unite : G.ecrire(G.milli(r.nombre));
    assert.equal(q.choix[q.bon], bonne, `${ou} : mauvais bon choix`);
  }
  if (q.donnees.type === "unite") {
    const o = G.OBJETS_UNITE[q.donnees.objet];
    assert.equal(q.choix[q.bon], o[2]);
    assert.ok(o[3] > 0, `${ou} : un exemple de J'apprends tiré`);
  }
  // Lot A2 bis : associer, ranger, qu'est-ce qu'on mesure, h/min/jours.
  if (q.donnees.type === "associer") {
    assert.equal(q.objets.length, 3); assert.equal(new Set(q.objets.map(o => o.texte)).size, 3, `${ou} : deux fois le même objet`);
    assert.equal(new Set(q.mesures).size, 3, `${ou} : deux fois la même mesure`);
    assert.deepEqual([...q.bonnes].sort(), [0, 1, 2]);
    q.donnees.reperes.forEach((code, i) => {
      const r = CARTE.repere(code);
      assert.equal(q.mesures[q.bonnes[i]].replace(/\u00a0/g, " "), `${r.nombre.replace(".", ",")} ${r.unite}`, `${ou} : ${code} mal relié`);
      assert.equal(q.objets[i].texte, r.objet);
    });
    const g = new Set(q.donnees.reperes.map(c => CARTE.repere(c).grandeur));
    assert.equal(g.size, q.degre === 3 ? 1 : 3, `${ou} : grandeurs ${[...g]}`);
    assert.ok(G.verifier(q, q.bonnes).juste);
  }
  if (q.donnees.type === "ranger") {
    const mesures = q.donnees.mesures;
    const petite = mesures.map(m => m[1]).reduce((a, u) => (EXPOSANTS[u] < EXPOSANTS[a] ? u : a));
    const v = mesures.map(([x, u]) => versUnite(lire(x), u, petite));
    assert.equal(new Set(v.map(String)).size, 4, `${ou} : deux mesures égales`);
    const ordre = [0, 1, 2, 3].sort((a, b) => (v[a] < v[b] ? -1 : 1));
    assert.deepEqual(q.ordre, ordre, `${ou} : mauvais ordre`);
    assert.ok(!ordre.every((x, k) => x === k), `${ou} : déjà rangées`);
    assert.ok(G.verifier(q, ordre).juste);
    mesures.forEach(([x]) => assert.ok(lire(x) <= 10000000n && lire(x) % 1000n === 0n, `${ou} : ${x}`));
  }
  if (q.donnees.type === "grandeur") assert.equal(["longueur", "masse", "contenance", "duree"][q.bon], q.donnees.grandeur);
  if (q.donnees.type === "unite-duree") assert.equal(q.choix[q.bon], q.donnees.unite);
  // Les prix vraisemblables, les pièces qui existent.
  if (q.donnees.type === "argent") {
    const d = q.donnees;
    if (d.pieces) d.pieces.forEach(p => assert.ok([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].includes(p), `${ou} : pièce de ${p}`));
    if (d.pieces) assert.ok(d.pieces.length <= 6, `${ou} : trop de pièces à compter`);
    assert.ok(d.total > 0 && d.total < 10000, `${ou} : ${d.total} c`);
    if (Array.isArray(q.reponse)) assert.notEqual(q.reponse[1], "0", `${ou} : « 0 c » dans la réponse`);
    if (d.sorte === "objet") assert.ok(d.total > 100, `${ou} : un prix déjà en centimes`);
  }
  // 3. les bornes des objets
  if (q.donnees.type === "pb" || q.donnees.type === "vrai") {
    const d = q.donnees;
    assert.ok(G.dansBornes(d.objet, lire(d.a)), `${ou} : ${d.a} ${d.ua} hors des bornes de ${d.objet}`);
    assert.ok(G.dansBornes(d.part, lire(d.b)), `${ou} : ${d.b} ${d.ub} hors des bornes de ${d.part}`);
    assert.ok(rec[0] > 0n, `${ou} : reste négatif ou nul`);
    if (d.op === "-") assert.ok(rec[0] < versUnite(lire(d.a), d.ua, d.vers), `${ou} : il reste plus que le tout`);
  }
  // 9. le programme de CE2 (palier 1)
  if (CARTE.etape(q.code).palier === 1) {
    // La virgule seulement pour les euros, sur une étiquette (« 2,50 € »).
    const t = [q.texte, q.reponseTexte, ...(q.choix || []), ...(q.mesures || [])].join(" ").replace(new RegExp(FINE, "g"), "")
      .replace(/\d+,\d\d\u00a0€/g, p => (q.code === "E1" ? "" : p));
    (t.match(/\d+(?:,\d+)?/g) || []).forEach(n => {
      assert.ok(Number(n.replace(",", ".")) <= 10000, `${ou} : ${n} dépasse 10 000 dans « ${q.texte} »`);
      assert.ok(!n.includes(",") || n === "7,5", `${ou} : nombre à virgule ${n} au palier 1`);
    });
  }
  // L'outil des relations ne recopie pas la relation (c'est la réponse).
  if (q.code === "P1") assert.equal(q.outilSansRelation, true, `${ou} : l'outil montrerait la relation`);
  // L'image dessinée : n paquets, n = le nombre d'unités de la grande unité.
  if (q.paquets) {
    const d = q.donnees;
    const n = q.code === "C1" ? G.milli(d.valeur) : G.milli(q.reponse);
    assert.equal(BigInt(q.paquets.n) * 1000n, n, `${ou} : ${q.paquets.n} paquets`);
    assert.ok(q.paquets.n >= 1 && q.paquets.n <= 9, `${ou} : trop de paquets`);
  }
  // Un objet : la phrase dit l'objet, la mesure et la question.
  if (q.morceaux.objet && q.code === "E1") assert.match(q.texte, /^(Un|Une) [^.]+ coûte [\d\u202f]+\u00a0(€|c)( \d+\u00a0c)?\. Combien de centimes\u00a0\?$/, `${ou} : « ${q.texte} »`);
  else if (q.morceaux.objet) assert.match(q.texte, /^(Un|Une) [^.]+ de [\d\u202f]+\u00a0[a-zA-Z]+\. Combien de [a-zéè]+\u00a0\?$/, `${ou} : « ${q.texte} »`);
  // 5. les choix
  if (q.choix) {
    assert.equal(new Set(q.choix).size, q.choix.length, `${ou} : deux choix identiques ${JSON.stringify(q.choix)}`);
    assert.ok(q.bon >= 0 && q.bon < q.choix.length, `${ou} : bonne réponse absente`);
    if (q.forme === "qcm") assert.ok(q.choix.length >= 3 && q.choix.length <= 4);
  }
}

function controlerSerie(code, usage, nombre, s, ou) {
  const plan = nombre ? Array.from({length: nombre}, (_, i) => 1 + Math.min(2, Math.floor((3 * i) / nombre))) : G.PLANS[usage];
  assert.equal(s.length, plan.length, `${ou} : longueur`);
  assert.deepEqual(s.map(q => q.degre), plan, `${ou} : degrés`);
  const exemples = new Set(G.clesExemples(code));
  s.forEach(q => assert.ok(!exemples.has(q.cle) && !exemples.has(q.cleBase), `${ou} : exemple de J'apprends repris (${q.cle})`));
  const cles = s.map(q => q.cle);
  if (usage !== "entraine" && usage !== "exerciseur") assert.equal(new Set(cles).size, cles.length, `${ou} : deux fois la même question`);
  else cles.forEach((c, i) => assert.ok(i === 0 || c !== cles[i - 1], `${ou} : la même question deux fois de suite`));
  if (code === "Q1" && usage === "valide") {
    const v = s.filter(q => q.forme === "vrai-faux");
    assert.equal(v.length, 2, `${ou} : deux « vraisemblable ? »`);
    assert.deepEqual(v.map(q => q.place), [4, 8]);
    assert.deepEqual(v.map(q => q.reponse).sort(), ["Non", "Oui"], `${ou} : un Oui et un Non`);
  }
  if (code === "R1" && (usage === "valide" || usage === "test")) {
    const reps = s.map(q => q.repere);
    const doubles = reps.filter((r, i) => reps.indexOf(r) !== i);
    assert.ok(usage === "test" ? doubles.length === 0 : doubles.length <= 1, `${ou} : repères répétés ${JSON.stringify(doubles)}`);
  }
  // Lot A2 bis : la place des nouvelles questions dans Je valide.
  if (code === "R1" && usage === "valide") assert.equal(s[9].forme, "associer", `${ou} : associer en dernier`);
  if (code === "R2" && usage === "valide") {
    assert.equal(s[3].donnees.type, "grandeur"); assert.equal(s[7].donnees.type, "unite-duree");
    assert.equal(s.filter(q => q.donnees.type === "unite").length, 8);
  }
  if (code === "C2" && usage === "valide") assert.equal(s[4].forme, "ranger");
  if (code === "E1" && usage === "valide") {
    assert.deepEqual([...new Set(s.map(q => q.donnees.sorte))].sort(), ["deux", "objet", "pieces", "prix", "versC", "versE"], `${ou} : les six façons`);
  }
  if (code === "D7" && usage === "valide") {
    assert.deepEqual([...new Set(s.map(q => q.donnees.cherche))].sort(), ["arrivee", "depart", "duree"], `${ou} : les trois questions`);
  }
  if ((code === "C1" || code === "C2") && usage === "valide") {
    const n = g => s.filter(q => q.grandeur === g).length;
    assert.ok(n("masse") >= 2 && n("contenance") >= 2 && n("longueur") >= 1, `${ou} : les trois grandeurs`);
    assert.equal(s[2].forme, "phrase");
    assert.ok(!s[2].morceaux.objet, `${ou} : une phrase en 3e`);
    assert.equal(s[6].forme, "phrase");
    assert.ok(s[6].morceaux.objet || s[6].somme || s[6].deux, `${ou} : un objet en 7e`);
    assert.ok(s[9].somme || s[9].deux, `${ou} : une mesure à deux unités en dernier`);
  }
}

for (const code of PRETES) {
  test(`banc d'essai : ${code} · ${CARTE.etape(code).nom} (${GRAINES} graines × ${USAGES.length} usages)`, () => {
    const formes = new Set();
    for (let g = 1; g <= GRAINES; g += 1) {
      for (const [usage, nombre] of USAGES) {
        const ou = `${code} ${usage} graine ${g}`;
        const s = G.serie(code, {usage, graine: g, nombre});
        controlerSerie(code, usage, nombre, s, ou);
        s.forEach(q => { controlerQuestion(q, ou); formes.add(q.forme); });
      }
    }
    const prevues = {R1: ["qcm", "associer"], R2: ["qcm"], P1: ["nombre", "phrase"], C1: ["nombre", "phrase"], C2: ["nombre", "phrase", "deux-cases", "ranger"],
      D1: ["nombre", "deux-cases"], D2: ["nombre", "deux-cases"], Q1: ["nombre", "vrai-faux"], E1: ["nombre", "deux-cases"], D7: ["nombre", "deux-cases"]}[code];
    assert.deepEqual([...formes].sort(), prevues.sort(), `${code} : formes`);
  });
}

test("banc d'essai : audit du 12/11 — variété, Oui et Non, exemples", () => {
  // Les trois façons de demander une conversion dans À toi (C1, C2).
  for (const code of ["C1", "C2"]) {
    let objet = 0; let phrase = 0; let total = 0;
    for (let g = 1; g <= 400; g += 1) {
      G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
        if (q.donnees.type !== "conv") return;
        total += 1;
        if (q.morceaux.objet) objet += 1;
        else if (q.forme === "phrase") phrase += 1;
      });
    }
    assert.ok(objet / total > 0.18 && objet / total < 0.32, `${code} : ${objet}/${total} avec un objet`);
    assert.ok(phrase / total > 0.18 && phrase / total < 0.32, `${code} : ${phrase}/${total} en phrase`);
  }
  // « Est-ce vraisemblable ? » : Oui et Non à parts presque égales.
  let oui = 0; let n = 0;
  for (let g = 1; g <= 1000; g += 1) {
    G.serie("Q1", {usage: "entraine", graine: g}).filter(q => q.forme === "vrai-faux").forEach(q => { n += 1; if (q.bon === 0) oui += 1; });
  }
  assert.ok(oui / n > 0.45 && oui / n < 0.55, `Oui ${oui}/${n}`);
  // Un exemple de J'apprends ne revient sous aucune forme.
  const ex = new Set(G.clesExemples("Q1"));
  for (let g = 1; g <= 2000; g += 1) {
    for (const u of ["valide", "entraine", "test", "echauffement"]) {
      G.serie("Q1", {usage: u, graine: g}).forEach(q => assert.ok(!ex.has(q.cleBase || q.cle), `Q1 ${u} ${g} : ${q.cle}`));
    }
  }
});

test("banc d'essai : lot A2 bis — la bonne réponse à toutes les places, aucun exemple repris", () => {
  const places = {};
  const noter = (cle, k) => { (places[cle] = places[cle] || new Set()).add(k); };
  for (let g = 1; g <= 600; g += 1) {
    for (const u of ["valide", "entraine"]) {
      G.serie("R1", {usage: u, graine: g}).forEach(q => {
        if (q.forme === "associer") q.bonnes.forEach((b, i) => noter(`R1 associer objet ${i}`, b));
        else noter(`R1 qcm ${q.morceaux.sorte}`, q.bon);
      });
      G.serie("R2", {usage: u, graine: g}).forEach(q => noter(`R2 ${q.donnees.type}`, q.bon));
      G.serie("C2", {usage: u, graine: g}).filter(q => q.forme === "ranger").forEach(q => { noter("C2 ranger la plus petite", q.ordre[0]); noter("C2 ranger la plus grande", q.ordre[3]); });
    }
  }
  const attendu = {"R1 associer objet 0": 3, "R1 associer objet 1": 3, "R1 associer objet 2": 3, "R1 qcm unite": 3, "R1 qcm valeur": 3,
    "R2 grandeur": 4, "R2 unite-duree": 3, "R2 unite": 4, "C2 ranger la plus petite": 4, "C2 ranger la plus grande": 4};
  Object.keys(attendu).forEach(k => assert.equal(places[k] ? places[k].size : 0, attendu[k], `${k} : la bonne réponse aux places ${places[k] ? [...places[k]] : []}`));
  // Les exemples de « On te montre » ne reviennent jamais (E1, D7, R2).
  for (const code of ["E1", "D7", "R2"]) {
    const ex = new Set(G.clesExemples(code));
    assert.ok(ex.size === 3, code);
    for (let g = 1; g <= 2000; g += 1) {
      for (const u of ["valide", "entraine", "test", "echauffement", "aide"]) {
        G.serie(code, {usage: u, graine: g}).forEach(q => assert.ok(!ex.has(q.cle), `${code} ${u} ${g} : exemple repris ${q.cle}`));
      }
    }
  }
  // Les trois façons de demander (calcul, phrase, objet) et les pièces dans E1.
  const sortes = {};
  for (let g = 1; g <= 400; g += 1) G.serie("E1", {usage: "entraine", graine: g}).forEach(q => { sortes[q.donnees.sorte] = (sortes[q.donnees.sorte] || 0) + 1; });
  ["versC", "versE", "deux", "prix", "objet", "pieces"].forEach(k => assert.ok(sortes[k] > 400, `E1 : ${k} ${sortes[k]}`));
  // D7 : les trois questions dans À toi.
  const cherches = {};
  for (let g = 1; g <= 400; g += 1) G.serie("D7", {usage: "entraine", graine: g}).forEach(q => { cherches[q.donnees.cherche] = (cherches[q.donnees.cherche] || 0) + 1; });
  ["duree", "arrivee", "depart"].forEach(k => assert.ok(cherches[k] > 1500, `D7 : ${k} ${cherches[k]}`));
});

test("banc d'essai : le déterminisme (même graine, même série)", () => {
  for (const code of PRETES) {
    for (const [usage, nombre] of USAGES) {
      const a = JSON.stringify(G.serie(code, {usage, graine: 4242, nombre}));
      assert.equal(JSON.stringify(G.serie(code, {usage, graine: 4242, nombre})), a, `${code} ${usage}`);
    }
  }
  assert.equal(G.graineDe("6e B"), G.graineDe("6e B"));
});

test("banc d'essai : les erreurs connues sont déclenchées, leur retour est bien écrit", () => {
  const vues = {};
  const noter = (code, v) => { if (v.erreur) { (vues[code] = vues[code] || new Set()).add(v.erreur); ecriture(v.retour, `${code} c${v.erreur}`); milliers(v.retour, code); } };
  for (const code of ["P1", "C1", "C2", "D1", "D2", "Q1", "E1", "D7"]) {
    for (let g = 1; g <= 300; g += 1) {
      G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
        const d = q.donnees;
        const essais = [];
        if (d.type === "conv") {
          const v = G.milli(d.valeur);
          const f = G.facteur(G.exposant(d.de) > G.exposant(d.vers) ? d.de : d.vers, G.exposant(d.de) > G.exposant(d.vers) ? d.vers : d.de);
          essais.push(v, v * f, v * f * 10n, v * f / 10n, v * 1000n, v % f === 0n ? v / f : 1n, G.milli(q.reponse) * 10n, G.milli(q.reponse) / 10n);
        } else if (d.type === "somme") essais.push(G.milli(d.a) + G.milli(d.b), G.lireMilli(`${d.a}${d.b}`));
        else if (d.type === "duree") essais.push(G.milli(d.h * 100 + d.m));
        else if (d.type === "duree-mots" && !d.deux) {
          essais.push(G.milli(d.h * 60 + d.demis * 30 + d.quarts * 25), G.milli(d.h * 60 + d.demis * 50 + d.quarts * 15), G.milli(d.h * 100 + d.demis * 30 + d.quarts * 15));
        } else if (d.type === "pb") {
          const A = G.milli(d.a); const B = G.milli(d.b); const Ac = G.convertir(A, d.ua, d.vers); const f = G.facteur(d.ua, d.vers);
          essais.push(A + B, A > B ? A - B : 1n, Ac * 10n + (d.op === "+" ? B : -B), d.op === "+" ? Ac - B : Ac + B);
        }
        if (d.type === "argent") {
          const e = Math.floor(d.total / 100); const c = d.total % 100;
          if (Array.isArray(q.reponse)) {
            [[e, c * 10], [e, c / 10], [Math.floor(d.total / 10), d.total % 10]].forEach(x => { if (x.every(Number.isInteger)) noter(code, G.verifier(q, x.map(String))); });
          } else if (q.unite === "€") essais.push(G.milli(d.total * 100), G.milli(d.total / 10));
          else essais.push(G.milli(e * 10 + c), G.milli(e * 100), G.milli(e || 1));
        }
        if (d.type === "entre") {
          const cent = t => Math.floor(t / 60) * 100 + (t % 60);
          const duree = d.arrivee - d.depart;
          const diff = cent(d.arrivee) - cent(d.depart);
          const essaisCases = [[Math.floor(diff / 100), diff % 100],
            [Math.floor(d.depart / 60) + Math.floor(duree / 60), (d.depart % 60) + (duree % 60)]];
          const f = cent(d.arrivee) - (Math.floor(duree / 60) * 100 + (duree % 60));
          essaisCases.push([Math.floor(f / 100), f % 100]);
          if (Array.isArray(q.reponse)) essaisCases.forEach(x => { if (x.every(y => y >= 0)) noter(code, G.verifier(q, x.map(String))); });
          else if (diff > 0) essais.push(G.milli(diff));
        }
        essais.filter(x => typeof x === "bigint" && x > 0n).forEach(x => noter(code, G.verifier(q, G.brut(x))));
        if (d.type === "duree-deux") {
          const h = Math.floor(d.m / 100);
          noter(code, G.verifier(q, [String(h), String(d.m % 100)]));
        }
      });
    }
  }
  const attendues = {P1: [1, 3], C1: [1, 2, 3, 4, 5, 6], C2: [1, 2, 3], D1: [1, 2], D2: [1, 2, 3], Q1: [1, 2, 3], E1: [1, 2, 3, 4, 5], D7: [1, 2, 3]};
  Object.keys(attendues).forEach(code => {
    attendues[code].forEach(c => assert.ok(vues[code] && vues[code].has(c), `${code} : l'erreur c${c} n'est jamais déclenchée`));
  });
});

test("les nombres exacts : lecture, écriture, conversions", () => {
  assert.equal(G.lireMilli("3,5"), 3500n);
  assert.equal(G.lireMilli(",5"), 500n);
  assert.equal(G.lireMilli("2 500"), 2500000n);
  assert.equal(G.lireMilli("1 000"), 1000000n);
  assert.equal(G.lireMilli("0,0005"), "hors");
  assert.equal(G.lireMilli("3,500"), 3500n);
  assert.equal(G.lireMilli("1,2,3"), null);
  assert.equal(G.ecrire(1234500n), `1${FINE}234,5`);
  assert.equal(G.mes(2500n, "m"), `2,5${NB}m`);
  assert.equal(G.convertir(1000n, "mm", "m"), 1n, "1 mm = 0,001 m : un millième");
  assert.equal(G.convertir(1n, "mm", "km"), null);
  assert.equal(G.convertir(3500n, "m", "cm"), 350000n);
  assert.ok(G.verifier(G.serie("C1", {usage: "valide", graine: 1})[0], "  " + G.serie("C1", {usage: "valide", graine: 1})[0].reponse + " ").juste, "espaces ignorées");
});
