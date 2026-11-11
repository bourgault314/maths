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
//   8. les erreurs connues (chacune déclenchée, retour bien écrit).
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
const EXPOSANTS = {km: 3, m: 0, dm: -1, cm: -2, mm: -3, t: 6, kg: 3, g: 0, L: 0, dL: -1, cL: -2};
const FAMILLE = {km: "l", m: "l", dm: "l", cm: "l", mm: "l", t: "m", kg: "m", g: "m", L: "c", dL: "c", cL: "c"};
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
  // 3. les bornes des objets
  if (q.donnees.type === "pb" || q.donnees.type === "vrai") {
    const d = q.donnees;
    assert.ok(G.dansBornes(d.objet, lire(d.a)), `${ou} : ${d.a} ${d.ua} hors des bornes de ${d.objet}`);
    assert.ok(G.dansBornes(d.part, lire(d.b)), `${ou} : ${d.b} ${d.ub} hors des bornes de ${d.part}`);
    assert.ok(rec[0] > 0n, `${ou} : reste négatif ou nul`);
    if (d.op === "-") assert.ok(rec[0] < versUnite(lire(d.a), d.ua, d.vers), `${ou} : il reste plus que le tout`);
  }
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
  s.forEach(q => assert.ok(!exemples.has(q.cle), `${ou} : exemple de J'apprends repris (${q.cle})`));
  const cles = s.map(q => q.cle);
  if (usage !== "entraine" && usage !== "exerciseur") assert.equal(new Set(cles).size, cles.length, `${ou} : deux fois la même question`);
  else cles.forEach((c, i) => assert.ok(i === 0 || c !== cles[i - 1], `${ou} : la même question deux fois de suite`));
  if (code === "Q1" && usage === "valide") {
    const v = s.filter(q => q.forme === "vrai-faux");
    assert.equal(v.length, 2, `${ou} : deux « vraisemblable ? »`);
    assert.deepEqual(v.map(q => q.place), [4, 8]);
    assert.deepEqual(v.map(q => q.reponse).sort(), ["Non", "Oui"], `${ou} : un Oui et un Non`);
  }
  if ((code === "C1" || code === "C2") && usage === "valide") {
    const n = g => s.filter(q => q.grandeur === g).length;
    assert.ok(n("masse") >= 2 && n("contenance") >= 2 && n("longueur") >= 1, `${ou} : les trois grandeurs`);
    assert.equal(s[2].forme, "phrase");
    assert.equal(s[6].forme, "phrase");
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
    const prevues = {R1: ["qcm"], R2: ["qcm"], P1: ["nombre", "phrase"], C1: ["nombre", "phrase"], C2: ["nombre", "phrase", "deux-cases"],
      D1: ["nombre", "deux-cases"], D2: ["nombre", "deux-cases"], Q1: ["nombre", "vrai-faux"]}[code];
    assert.deepEqual([...formes].sort(), prevues.sort(), `${code} : formes`);
  });
}

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
  for (const code of ["P1", "C1", "C2", "D1", "D2", "Q1"]) {
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
        essais.filter(x => typeof x === "bigint" && x > 0n).forEach(x => noter(code, G.verifier(q, G.brut(x))));
        if (d.type === "duree-deux") {
          const h = Math.floor(d.m / 100);
          noter(code, G.verifier(q, [String(h), String(d.m % 100)]));
        }
      });
    }
  }
  const attendues = {P1: [1, 3], C1: [1, 2, 3, 4, 5, 6], C2: [1, 2, 3], D1: [1, 2], D2: [1, 2, 3], Q1: [1, 2, 3]};
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
