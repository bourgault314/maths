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
//  11. (lot 3b, carte v4) les nouvelles façons de demander : le repère au
//      pavé, l'unité sans nombre, « combien de fois ? », relier les
//      relations, les réponses au choix tirées des vraies erreurs (C1, C2,
//      D1, D2, D7), l'heure en mots, les quarts d'heure, 0,85 €, 4,05 €,
//      « 1 € et 120 c » ; les objets bornés ; aucune question deux fois.
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
// Lot 3a : « retour » (Je me souviens, Avant de partir : 2 questions de degré 2).
const USAGES = [["valide", null], ["entraine", null], ["test", null], ["echauffement", null], ["aide", null], ["retour", null], ["exerciseur", 30]];
const NB = " ";
const FINE = " ";

// ------------------------------------------------- le recalcul, à part
// (Lot B1-2 : toutes les unités du CM1, hm, dam, hg, dag, dg, cg, mg, hL, daL, mL.)
const EXPOSANTS = {km: 3, hm: 2, dam: 1, m: 0, dm: -1, cm: -2, mm: -3, t: 6, kg: 3, hg: 2, dag: 1, g: 0, dg: -1, cg: -2, mg: -3,
  hL: 2, daL: 1, L: 0, dL: -1, cL: -2, mL: -3, "€": 2, c: 0};
const FAMILLE = {km: "l", hm: "l", dam: "l", m: "l", dm: "l", cm: "l", mm: "l", t: "m", kg: "m", hg: "m", dag: "m", g: "m", dg: "m", cg: "m", mg: "m",
  hL: "c", daL: "c", L: "c", dL: "c", cL: "c", mL: "c", "€": "a", c: "a"};
// Lot B1-2 : le sens des préfixes, recopié à part.
const SENS_PREFIXES = {kilo: ["k", "mille"], hecto: ["h", "cent"], "déca": ["da", "dix"], "déci": ["d", "un dixième"], centi: ["c", "un centième"], milli: ["m", "un millième"]};
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
// Lot B1-1 : les unités du CM1 (mg, mL) et la taille d'un repère dans la
// plus petite unité de sa grandeur, pour comparer deux repères.
const EXP2 = {km: 3, m: 0, dm: -1, cm: -2, mm: -3, t: 6, kg: 3, g: 0, mg: -3, L: 0, dL: -1, cL: -2, mL: -3};
const FAMILLE_G = {km: "longueur", m: "longueur", dm: "longueur", cm: "longueur", mm: "longueur", t: "masse", kg: "masse", g: "masse", mg: "masse",
  L: "contenance", dL: "contenance", cL: "contenance", mL: "contenance"};
function taille(r) {
  return lire(r.nombre.replace(".", ",")) * 10n ** BigInt(EXP2[r.unite] + 3);
}
// Lot B2-1b : la valeur d'une carte (« 2 m 15 cm ») dans la plus petite
// unité de sa grandeur, et les mesures qu'on écrit vraiment.
const BASE = {l: "mm", m: "mg", c: "mL"};
function valeurCarte(parts) {
  return parts.reduce((t, [n, u]) => t + versUnite(lire(n), u, BASE[FAMILLE[u]]), 0n);
}
function mesureVraieC5(n, u, ou) {
  const m = lire(n);
  assert.ok(m > 0n && m <= 100000000n, `${ou} : ${n} ${u}`);
  assert.ok(!(["mm", "mg", "mL", "cg", "cL"].includes(u) && m % 1000n), `${ou} : ${n} ${u} (pas de virgule)`);
  assert.ok(!(["mm", "cm", "dm", "mg", "cg", "dg", "mL", "cL", "dL", "dam", "hm", "dag", "hg", "daL"].includes(u) && m < 1000n), `${ou} : ${n} ${u} (moins de 1)`);
  assert.ok(m % 10n === 0n, `${ou} : ${n} ${u} (des millièmes au CM1)`);
}
function mesureTexte([n, u]) {
  return `${n} ${u}`;
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
    // Lot 3b
    case "heure-mots": return [BigInt(d.h) * 1000n, BigInt(d.m) * 1000n];
    // Lot 3b-2 : la règle à lire (de 2 à 5 cm jusqu'à 10 cm au plus).
    case "regle": {
      assert.ok(d.debut >= 2 && d.debut <= 5 && d.fin <= 10 && d.fin > d.debut, "l'objet est sur la règle, sans partir de 0 ni de 1");
      return [BigInt(d.fin - d.debut) * 1000n];
    }
    // Lot B2-1b : décomposer, « 215 cm = 2 m + … dm + 5 cm » — les trois
    // morceaux font la mesure ; la réponse est le morceau caché.
    case "decomp": {
      const total = d.parts.reduce((t, [n, u]) => t + versUnite(lire(n), u, d.de), 0n);
      assert.equal(total, lire(d.valeur), "les morceaux ne font pas la mesure");
      d.parts.forEach(([n]) => assert.match(n, /^[1-9]$/, "un chiffre par morceau"));
      return [lire(d.parts[d.cache][0])];
    }
    // Lot B2-2a : C6, n⁄d de l'unité (et `a` unités entières), recalculé.
    case "frac": {
      const [num, den, ent] = [BigInt(d.n), BigInt(d.d), BigInt(d.a)];
      const unite = versUnite(1000n, d.de, d.vers);
      assert.equal((unite * num) % (den * 1000n), 0n, "la fraction ne tombe pas juste");
      return [ent * unite + (unite * num) / den];
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
// (Lot 3b-3 : « Quelle heure est-il ? », « Il est huit heures » : l'heure,
// pas une personne.)
const IMPERSONNEL = /(il en faut|il reste|reste-t-il|il faut|il y a|y a-t-il|faut-il|heure est-il|il est (?:midi|[a-zé]+ heures?))/gi;
function ecriture(texte, ou) {
  INTERDITS.forEach(re => assert.doesNotMatch(texte, re, `${ou} : ${re} dans « ${texte} »`));
  assert.doesNotMatch(texte, /\d (?:km|hm|dam|m|dm|cm|mm|t|kg|hg|dag|g|dg|cg|mg|hL|daL|L|dL|cL|mL|min|h)(?![\wÀ-ÿ])/, `${ou} : espace normale avant l'unité dans « ${texte} »`);
  // (Lot B1-2 : un nombre et l'unité écrite en mots, « 1 hectomètre ».)
  assert.doesNotMatch(texte, /\d (?:kilo|hecto|déca|déci|centi|milli)?(?:mètres?|grammes?|litres?)\b/, `${ou} : espace normale avant l'unité en mots dans « ${texte} »`);
  assert.doesNotMatch(texte, /\d[  ]\d{3}(?!\d)/, `${ou} : milliers sans espace fine dans « ${texte} »`);
  const sansImpersonnel = texte.replace(IMPERSONNEL, "");
  assert.doesNotMatch(sansImpersonnel, PERSONNE, `${ou} : « il » ou « elle » pour une personne dans « ${texte} »`);
  // (Un nom propre, « le sentier du Trou de Fer mesure », n'en est pas une ;
  // lot B1-1 : ni « la Diagonale des Fous », ni « un Car Jaune ».)
  assert.doesNotMatch(texte, /(?<=[a-zà-ÿ,;])(?<!\b(?:de|du|des|au|en))(?<!\b[A-ZÀ-Ý][a-zà-ÿ]*) [A-ZÀ-Ý][a-zà-ÿ]+ (?:mesure|pèse|contient)/, `${ou} : majuscule au milieu d'une phrase`);
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
  const textes = [q.texte, q.reponseTexte, q.resume, ...(q.correction || []), ...(q.image || []), ...(q.choix || []), ...(q.cartes || []),
    ...Object.values(q.pourquoi || {})].filter(t => typeof t === "string");
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
      // Lot 3b : une conversion ou une durée au choix — le bon choix dit la
      // réponse recalculée, et lui seul.
      if (q.forme === "qcm") {
        assert.ok(G.verifier(q, q.bon).juste, `${ou} : le bon choix est refusé`);
        const bonTexte = q.choix[q.bon].replace(/[\u00a0\u202f]/g, " ");
        const d = q.donnees;
        let attenduTexte;
        if (d.type === "conv") attenduTexte = G.ecrire(rec[0]).replace(/\u202f/g, " ");
        else if (d.type === "duree-deux") attenduTexte = `${rec[0] / 1000n} h ${rec[1] / 1000n} min`;
        else if (d.type === "entre") attenduTexte = q.reponseTexte.replace(/\u00a0/g, " ");
        else if (d.type === "frac") attenduTexte = G.ecrire(rec[0]).replace(/\u202f/g, " ");
        else attenduTexte = String(rec[0] / 1000n);
        assert.equal(bonTexte, attenduTexte, `${ou} : le bon choix « ${bonTexte} » ≠ ${attenduTexte}`);
      } else assert.ok(G.verifier(q, Array.isArray(q.reponse) ? q.reponse : q.reponse).juste, `${ou} : la bonne réponse est refusée`);
    }
  }
  // Lot 3b : les questions sans recalcul numérique.
  if (q.donnees.type === "fois") {
    const f = versUnite(1000n, q.donnees.grande, q.donnees.petite) / 1000n;
    assert.equal(q.choix[q.bon].replace(/\u202f/g, ""), `${f} fois`, `${ou} : combien de fois`);
    // (Lot B1-2 : au palier 2, quatre réponses, comme l'évaluation de 6e.)
    assert.deepEqual(q.choix.map(c => c.replace(/\u202f/g, "")), CARTE.etape(q.code).palier >= 2 ? ["10 fois", "100 fois", "1000 fois", "10000 fois"] : ["10 fois", "100 fois", "1000 fois"]);
  }
  // Lot B1-2 : le sens d'un préfixe (« Dans hectolitre, que veut dire
  // hecto ? »), le préfixe d'un sens (« Quel préfixe veut dire cent ? ») ;
  // relier trois préfixes ; comparer deux mesures d'unités différentes.
  if (q.donnees.type === "prefixe-sens") {
    const [sym, sens] = SENS_PREFIXES[q.donnees.prefixe];
    assert.ok(q.donnees.unite.startsWith(sym) && FAMILLE[q.donnees.unite], `${ou} : ${q.donnees.unite}`);
    assert.equal(q.choix[q.bon], sens, `${ou} : le sens`);
    assert.equal(q.choix.length, 3);
    q.choix.forEach(c => assert.ok(Object.values(SENS_PREFIXES).some(x => x[1] === c), `${ou} : ${c}`));
  }
  if (q.donnees.type === "prefixe-nom") {
    assert.equal(q.choix[q.bon], q.donnees.prefixe);
    assert.ok(q.texte.includes(SENS_PREFIXES[q.donnees.prefixe][1]), `${ou} : ${q.texte}`);
    assert.equal(q.choix.length, 3);
    q.choix.forEach(c => assert.ok(SENS_PREFIXES[c], `${ou} : ${c}`));
  }
  if (q.donnees.type === "associer-pref") {
    assert.equal(new Set(q.objets.map(o => o.texte)).size, 3); assert.equal(new Set(q.mesures).size, 3);
    q.donnees.prefixes.forEach((p, i) => assert.equal(q.mesures[q.bonnes[i]], SENS_PREFIXES[p][1].replace(/^un /, ""), `${ou} : ${p} mal relié`));
    assert.ok(!q.bonnes.every((b, i) => b === i), `${ou} : en face`);
    assert.ok(G.verifier(q, q.bonnes).juste);
  }
  if (q.donnees.type === "comparer-mes") {
    const d = q.donnees;
    const a = versUnite(lire(d.a), d.ua, d.ub);
    const b = lire(d.b);
    assert.notEqual(a, b, `${ou} : deux mesures égales`);
    const grande = a > b ? `${d.a} ${d.ua}` : `${d.b} ${d.ub}`;
    assert.equal(q.choix[q.bon].replace(/[\u00a0\u202f]/g, " ").replace(/(\d) (?=\d{3})/g, "$1"), grande, `${ou} : la plus grande`);
    assert.ok(lire(d.b) > lire(d.a), `${ou} : le piège (le plus grand nombre) manque`);
    const ecart = Number(a > b ? a - b : b - a) / Number(a > b ? b : a);
    assert.ok(ecart >= 0.15, `${ou} : mesures trop proches`);
    assert.equal(q.choix.length, 2);
  }
  // Lot B1-2 : au palier 2, l'aide (l'outil, l'image) n'écrit jamais la
  // réponse ; un mauvais choix a toujours son pourquoi (P2, P3, P4).
  // (Lot B2-1 : C3 et C4 aussi.)
  if (["P2", "P3", "P4", "C3", "C4", "C5", "C6"].includes(q.code)) {
    const rep = q.reponseTexte.replace(/[\u00a0\u202f]/g, " ");
    const aide = [...(q.image || []), q.outil === "glisse-unite" && !q.outilSansRelation ? q.relation : ""].join(" | ").replace(/[\u00a0\u202f]/g, " ");
    // (Les bandes de C6 : la réponse est le nom d'une bande, l'image la récrit.)
    if (q.donnees.type !== "comparer-mes" && q.donnees.type !== "bandes") assert.ok(!aide.includes(rep), `${ou} : l'aide « ${aide} » donne « ${rep} »`);
    assert.ok(!aide.includes(q.resume.replace(/[\u00a0\u202f]/g, " ")), `${ou} : l'aide donne le résumé`);
    if (q.choix && q.forme === "qcm") q.choix.forEach((c, k) => { if (k !== q.bon) assert.ok(q.pourquoi && q.pourquoi[k], `${ou} : pas de pourquoi pour « ${c} »`); });
    if (q.glisse) {
      assert.equal(q.glisse.pale, false, `${ou} : le glisse-unité du palier 2 a toutes ses colonnes`);
      // (Les deux unités de la question sont des colonnes du glisse-unité :
      // sinon la correction animée ne peut pas y arriver.)
      const cols = q.glisse.colonnes || G.COLONNES[q.glisse.grandeur];
      assert.ok(cols.includes(q.glisse.de) && cols.includes(q.glisse.vers), `${ou} : ${q.glisse.de} ou ${q.glisse.vers} absent de ${cols}`);
    }
  }
  // Lot B2-1b : « Trouve l'intrus », « Coche tout ce qui est égal à… » —
  // chaque carte recalculée à part, dans la plus petite unité de sa
  // grandeur ; des mesures qu'on écrit vraiment.
  if (q.donnees.type === "intrus" || q.donnees.type === "plusieurs") {
    const cartes = q.donnees.cartes.map(valeurCarte);
    const textes = q.forme === "plusieurs" ? q.cartes : q.choix;
    assert.equal(textes.length, 4); assert.equal(new Set(textes).size, 4, `${ou} : deux cartes pareilles`);
    q.donnees.cartes.forEach((c, k) => {
      assert.equal(textes[k].replace(/[\u00a0\u202f]/g, " "), c.map(([n, u]) => `${G.ecrire(lire(n)).replace(/\u202f/g, " ")} ${u}`).join(" "), `${ou} : texte de la carte ${k}`);
      c.forEach(([n, u]) => mesureVraieC5(n, u, ou));
    });
    if (q.donnees.type === "intrus") {
      const autres = cartes.filter((v, k) => k !== q.bon);
      assert.ok(autres.every(v => v === autres[0]), `${ou} : les trois autres ne sont pas égales`);
      assert.notEqual(cartes[q.bon], autres[0], `${ou} : l'intrus est égal aux autres`);
      assert.ok(new Set(q.donnees.cartes.filter((c, k) => k !== q.bon).map(c => c.map(x => x[1]).join("+"))).size >= 2, `${ou} : trois fois la même unité`);
    } else {
      const cible = valeurCarte(q.donnees.cible);
      const bons = cartes.map((v, k) => (v === cible ? k : -1)).filter(k => k >= 0);
      assert.deepEqual(bons, q.bons, `${ou} : les bonnes cartes`);
      assert.ok(bons.length === 2 || bons.length === 3, `${ou} : ${bons.length} bonnes cartes`);
      assert.ok(G.verifier(q, q.bons).juste, `${ou} : les bonnes cartes refusées`);
      assert.ok(!G.verifier(q, q.bons.slice(1)).juste, `${ou} : une carte oubliée acceptée`);
      // Le pourquoi d'une carte fausse : « 2 150 cm, c'est 21,5 m. » — la
      // même mesure, recalculée.
      cartes.forEach((v, k) => {
        if (bons.includes(k)) return;
        const m = q.pourquoi[k].replace(/[\u00a0\u202f]/g, " ").match(/^(.+), c'est ([\d ,]+) ([a-zA-Z]+)\.$/);
        assert.ok(m, `${ou} : pourquoi « ${q.pourquoi[k]} »`);
        assert.equal(valeurCarte([[m[2].replace(/ /g, ""), m[3]]]), v, `${ou} : « ${q.pourquoi[k]} » est faux`);
        const r = G.verifier(q, q.bons.concat([k]));
        assert.ok(!r.juste && r.retour, `${ou} : une carte fausse cochée acceptée`);
      });
    }
  }
  // Lot B2-2a : C6 — « 75 cL = … L » (¼, ½ ou ¾ au choix) et les bandes
  // de S002 (37⁄10 cm ou 4 + 3⁄10 cm), recalculés à part ; la fraction
  // s'écrit avec la barre U+2044 ; la double droite cherche la bonne
  // graduation ; une situation dit sa mesure.
  if (q.donnees.type === "frac-part") {
    const d = q.donnees;
    const unite = versUnite(1000n, d.vers, d.de);
    const [n, den] = q.choix[q.bon].split("\u2044").map(BigInt);
    assert.equal(unite * n / den, lire(d.valeur), `${ou} : ${q.choix[q.bon]} ≠ ${d.valeur} ${d.de}`);
    assert.deepEqual(q.choix, ["1\u20444", "1\u20442", "3\u20444"]);
    assert.equal(q.droite.cherche, Number(n * 4n / den));
    q.choix.forEach((c, k) => { if (k !== q.bon) assert.ok(q.pourquoi[k], `${ou} : pas de pourquoi`); });
  }
  if (q.donnees.type === "bandes") {
    const d = q.donnees;
    const A = Number(d.a);
    const B = Number(d.b) * 10 + Number(d.c);
    assert.equal(q.bon, A === B ? 2 : A > B ? 0 : 1, `${ou} : la plus longue`);
    assert.ok(A % 10 !== 0 && Number(d.c) >= 1 && Number(d.c) <= 9, `${ou} : ${A}, ${d.c}`);
    q.choix.forEach((c, k) => { if (k !== q.bon) assert.ok(q.pourquoi[k], `${ou} : pas de pourquoi`); });
  }
  if (q.code === "C6") {
    const tout = [q.texte, ...(q.choix || []), ...(q.correction || []), ...(q.image || [])].join(" ");
    assert.doesNotMatch(tout, /\d\/\d|[½¼¾]/, `${ou} : une fraction sans la barre U+2044 dans « ${tout} »`);
    if (q.droite) assert.ok(q.droite.cherche > 0 && q.droite.cherche < q.droite.parts * q.droite.tout, `${ou} : graduation ${q.droite.cherche}`);
    if (q.donnees.type === "frac" && q.morceaux.situation) {
      assert.match(q.texte, /\. Combien de [a-zéè]+\u00a0\?$/, `${ou} : « ${q.texte} »`);
      assert.ok(Number(q.donnees.a) ? /et demi/.test(q.texte) : q.texte.includes(`${q.donnees.n}\u2044${q.donnees.d}\u00a0${q.donnees.de}`), `${ou} : la mesure n'est pas dans « ${q.texte} »`);
    }
  }
  if (q.donnees.type === "associer-rel") {
    assert.equal(new Set(q.objets.map(o => o.texte)).size, 3); assert.equal(new Set(q.mesures).size, 3);
    q.donnees.paires.forEach(([g, p], i) => {
      const v = versUnite(1000n, g, p);
      assert.equal(q.mesures[q.bonnes[i]].replace(/[\u00a0\u202f]/g, " "), `${G.ecrire(v).replace(/\u202f/g, " ")} ${p}`, `${ou} : 1 ${g} mal relié`);
    });
    assert.ok(!q.bonnes.every((b, i) => b === i), `${ou} : en face`);
    assert.ok(G.verifier(q, q.bonnes).juste);
  }
  if (q.donnees.type === "unite-sans") {
    assert.equal(q.choix[q.bon], q.donnees.unite);
    assert.equal(q.choix.length, 3);
    // (Lot R1-refonte : travail 1, une seule unité de la bonne grandeur.)
    const g = FAMILLE[q.donnees.unite];
    const memes = q.choix.filter(u => FAMILLE[u] === g);
    assert.ok(memes.length <= 2, `${ou} : ${q.choix}`);
    if (memes.length === 2) assert.ok(Math.abs(EXPOSANTS[memes[0]] - EXPOSANTS[memes[1]]) >= 3, `${ou} : ${memes} trop proches`);
  }
  if (q.donnees.type === "quarts") {
    assert.equal(q.choix[q.bon], String(q.donnees.n));
    assert.ok(q.correction.join(" ").includes(`${q.donnees.n} quarts d'heure`), `${ou} : ${q.correction}`);
  }
  // Les repères et « quelle unité » : la bonne réponse vient de la carte.
  if (q.donnees.type === "repere") {
    const r = CARTE.repere(q.donnees.repere);
    if (q.donnees.sorte === "saisie") {
      assert.equal(q.forme, "phrase"); assert.equal(q.reponse, r.nombre.replace(".", ","), `${ou} : ${q.reponse}`);
      assert.ok(G.verifier(q, q.reponse).juste);
    } else {
      const bonne = q.donnees.sorte === "unite" ? r.unite : G.ecrire(G.milli(r.nombre));
      assert.equal(q.choix[q.bon], bonne, `${ou} : mauvais bon choix`);
    }
  }
  if (q.donnees.type === "unite") {
    const o = G.OBJETS_UNITE[q.donnees.objet];
    assert.equal(q.choix[q.bon], o[2]);
    assert.ok(o[3] > 0, `${ou} : un exemple de J'apprends tiré`);
    // Lot R1-refonte (travail 2) : les unités de la même grandeur, et elles
    // seules (4 pour une longueur, 3 sinon).
    assert.equal(q.choix.length, FAMILLE[o[2]] === FAMILLE.m ? 4 : 3);
    assert.ok(q.choix.every(u => FAMILLE[u] === FAMILLE[o[2]]), `${ou} : ${q.choix}`);
  }
  // Lot R1-refonte : travail 1 (une unité de chaque grandeur) et travail 3
  // (le nombre, même unité).
  if (q.donnees.type === "unite-grandeur") {
    const o = G.OBJETS_UNITE[q.donnees.objet];
    assert.equal(q.choix[q.bon], o[2]);
    assert.equal(new Set(q.choix.map(u => FAMILLE[u])).size, 3, `${ou} : ${q.choix}`);
  }
  if (q.donnees.type === "nombre") {
    const o = G.OBJETS_UNITE[q.donnees.objet];
    assert.equal(q.choix[q.bon], G.ecrire(G.milli(o[1])));
    assert.equal(new Set(q.choix).size, 3);
    assert.equal(q.morceaux.apres, o[2]);
  }
  // Lot B1-1 : « Qu'est-ce qui mesure 400 m ? » — la bonne réponse est le
  // repère de la phrase ; les trois repères ont la même grandeur et des
  // mesures loin l'une de l'autre (au moins 3 fois).
  if (q.donnees.type === "repere-quoi") {
    const r = CARTE.repere(q.donnees.repere);
    assert.equal(q.donnees.reperes[q.bon], r.code, `${ou} : mauvais bon choix`);
    assert.ok(q.texte.replace(/[\u00a0\u202f]/g, " ").includes(`${r.nombre.replace(".", ",")} ${r.unite}`.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")), `${ou} : la mesure n'est pas dans « ${q.texte} »`);
    const reps = q.donnees.reperes.map(c => CARTE.repere(c));
    assert.equal(new Set(reps.map(x => x.grandeur)).size, 1, `${ou} : grandeurs mêlées`);
    assert.equal(new Set(reps.map(x => x.objet)).size, 3, `${ou} : deux fois le même objet`);
    const t = reps.map(taille);
    t.forEach((a, i) => t.slice(i + 1).forEach(b => assert.ok(a >= 3n * b || b >= 3n * a, `${ou} : deux réponses qui pourraient convenir`)));
    assert.equal(q.morceaux.reperes.length, 3);
  }
  // Lot B1-1 : « Qu'est-ce qui pèse le plus ? » — deux repères de même
  // grandeur, de mesures différentes ; la bonne réponse est le plus grand
  // (ou le plus petit).
  if (q.donnees.type === "repere-comparer") {
    const [a, b] = q.donnees.reperes.map(c => CARTE.repere(c));
    assert.equal(a.grandeur, b.grandeur, `${ou} : grandeurs`);
    assert.notEqual(taille(a), taille(b), `${ou} : mesures égales`);
    const grand = taille(a) > taille(b) ? 0 : 1;
    assert.equal(q.bon, q.donnees.plus ? grand : 1 - grand, `${ou} : mauvais bon choix`);
    assert.equal(q.choix.length, 2);
  }
  // Lot B1-1 : « Est-ce vraisemblable ? » (R6) — Oui : la vraie mesure ;
  // Non et les mauvais choix : une mesure au moins 10 fois trop grande ou
  // trop petite, de la même grandeur.
  if (q.donnees.type === "vraisemblance") {
    const sit = G.VRAISEMBLANCE[q.donnees.situation];
    assert.ok(sit[4] >= 1, `${ou} : un exemple de On te montre tiré`);
    const vraie = mesureTexte(sit[1]);
    if (q.donnees.sorte === "choix") {
      assert.equal(q.choix[q.bon].replace(/[\u00a0\u202f]/g, " "), vraie, `${ou} : le bon choix`);
      q.choix.forEach((c, k) => { if (k !== q.bon) assert.ok(sit[2].map(mesureTexte).includes(c.replace(/[\u00a0\u202f]/g, " ")), `${ou} : ${c}`); });
    } else {
      assert.equal(q.bon === 0, q.donnees.sorte === "oui", `${ou} : verdict`);
      assert.equal(q.donnees.montre === vraie, q.donnees.sorte === "oui", `${ou} : ${q.donnees.montre}`);
      assert.ok(q.texte.replace(/[\u00a0\u202f]/g, " ").includes(q.donnees.montre), `${ou} : la mesure jugée n'est pas dans la phrase`);
    }
    assert.ok(q.repereProche && CARTE.repere(q.repereProche).grandeur === FAMILLE_G[sit[1][1]], `${ou} : repère proche`);
  }
  // Lot A2 bis : associer, ranger, qu'est-ce qu'on mesure, h/min/jours.
  if (q.donnees.type === "associer") {
    assert.equal(q.objets.length, 3); assert.equal(new Set(q.objets.map(o => o.texte)).size, 3, `${ou} : deux fois le même objet`);
    assert.equal(new Set(q.mesures).size, 3, `${ou} : deux fois la même mesure`);
    assert.deepEqual([...q.bonnes].sort(), [0, 1, 2]);
    q.donnees.reperes.forEach((code, i) => {
      const r = CARTE.repere(code);
      assert.equal(q.mesures[q.bonnes[i]].replace(/\u00a0/g, " "), `${r.nombre.replace(".", ",")} ${r.unite}`, `${ou} : ${code} mal relié`);
      // (Lot B1-1 : au palier 2, le nom court du repère.)
      if (CARTE.etape(q.code).palier >= 2) assert.ok(q.objets[i].texte.length <= 27 && q.correction[i].startsWith(r.objet), `${ou} : ${q.objets[i].texte}`);
      // (Lot R1-refonte : « La plus petite graduation », « 10 terrains de foot ».)
      else assert.ok(r.objet.startsWith(q.objets[i].texte), `${ou} : ${q.objets[i].texte}`);
    });
    const g = new Set(q.donnees.reperes.map(c => CARTE.repere(c).grandeur));
    // (Lot B1-1 : au palier 2, une étape de repères n'a qu'une grandeur ;
    // les trois mesures y sont au moins 3 fois plus grandes l'une que l'autre.)
    if (CARTE.etape(q.code).palier >= 2) {
      assert.equal(g.size, 1, `${ou} : grandeurs ${[...g]}`);
      const t = q.donnees.reperes.map(c => taille(CARTE.repere(c)));
      t.forEach((a, i) => t.slice(i + 1).forEach(b => assert.ok(a >= 3n * b || b >= 3n * a, `${ou} : deux mesures trop proches à relier`)));
      assert.ok(q.donnees.reperes.some(c => CARTE.etape(q.code).reperes.includes(c)), `${ou} : aucun repère de l'étape à relier`);
    } else assert.equal(g.size, q.degre === 3 ? 1 : 3, `${ou} : grandeurs ${[...g]}`);
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
    // Lot 3b : 0,85 € s'écrit avec ses deux chiffres de centimes.
    if (d.sorte === "versEdec") assert.match(q.reponseTexte, /^\d+,\d\d\u00a0€$/, `${ou} : ${q.reponseTexte}`);
    if (d.sorte === "plus") assert.ok(q.morceaux.plus[1] > 100 && q.morceaux.plus[1] < 200, `${ou} : ${q.texte}`);
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
  // Lot B1-1 : les nombres du CM1 (au centième, jusqu'à 100 000).
  if (CARTE.etape(q.code).palier === 2) {
    const t = [q.texte, q.reponseTexte, ...(q.choix || []), ...(q.mesures || [])].join(" ").replace(new RegExp(FINE, "g"), "");
    (t.match(/\d+(?:,\d+)?/g) || []).forEach(n => {
      assert.ok(Number(n.replace(",", ".")) <= 100000, `${ou} : ${n} dépasse 100 000 dans « ${q.texte} »`);
      assert.ok(!/,\d{3}/.test(n), `${ou} : ${n} a plus de deux chiffres après la virgule`);
    });
  }
  // Lot A2 ter : l'image de « Entre deux heures » n'écrit jamais la réponse
  // (le premier bond était toute la réponse quand il n'y avait que des heures).
  if (q.code === "D7" && q.image) {
    const rep = q.reponseTexte.replace(/\u00a0/g, " ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q.image.forEach(l => assert.doesNotMatch(l.replace(/\u00a0/g, " "), new RegExp(`[=:] ${rep}\\.?$`), `${ou} : l'image « ${l} » donne la réponse ${q.reponseTexte}`));
  }
  // L'outil des relations ne recopie pas la relation (c'est la réponse).
  if (["P1", "P2", "P3"].includes(q.code) || (q.code === "P4" && q.donnees.type !== "comparer-mes")) assert.equal(q.outilSansRelation, true, `${ou} : l'outil montrerait la relation`);
  // L'image dessinée : n paquets, n = le nombre d'unités de la grande unité.
  if (q.paquets) {
    const d = q.donnees;
    const n = q.code === "C1" ? G.milli(d.valeur) : G.milli(q.reponse);
    assert.equal(BigInt(q.paquets.n) * 1000n, n, `${ou} : ${q.paquets.n} paquets`);
    assert.ok(q.paquets.n >= 1 && q.paquets.n <= 9, `${ou} : trop de paquets`);
  }
  // Lot 3b : un objet n'apparaît que dans ses bornes, dans une unité où on
  // le mesure vraiment (jamais « un ruban de 9 000 cm », jamais en dL).
  if (q.morceaux.objet && q.code !== "E1") {
    // (Lot B2-1 : des mesures à virgule, « Une planche de 2,4 m ».)
    const [, nom, n, u] = q.texte.match(/^((?:Un|Une) [^.]+) de ([\d\u202f,]+)\u00a0([a-zA-Z]+)\./) || [];
    assert.ok(nom, `${ou} : « ${q.texte} »`);
    const virgule = n.includes(",");
    const o = (virgule ? G.OBJETS_DECIMAUX : G.OBJETS_MESURE).find(x => x[0] === nom && x[1] === u);
    assert.ok(o, `${ou} : objet inconnu ${nom} en ${u}`);
    const nb = lire(n.replace(/\u202f/g, ""));
    assert.ok(nb >= lire(String(o[2])) && nb <= lire(String(o[3])), `${ou} : ${nom} de ${n} ${u} hors de ses bornes`);
    assert.ok(!["dL", "dm", "hm", "dam", "hg", "dag", "dg", "cg", "mg", "daL", "hL"].includes(q.donnees.vers), `${ou} : un objet en ${q.donnees.vers}`);
    assert.notEqual(q.donnees.vers, "dL", `${ou} : un objet en dL`);
  }
  // Un objet : la phrase dit l'objet, la mesure et la question.
  if (q.morceaux.objet && q.code === "E1") assert.match(q.texte, /^(Un|Une) [^.]+ coûte [\d\u202f]+\u00a0(€|c)( \d+\u00a0c)?\. Combien de centimes\u00a0\?$/, `${ou} : « ${q.texte} »`);
  else if (q.morceaux.objet) assert.match(q.texte, /^(Un|Une) [^.]+ de [\d\u202f,]+\u00a0[a-zA-Z]+\. Combien (de |d')[a-zéè]+\u00a0\?$/, `${ou} : « ${q.texte} »`);
  // 5. les choix
  if (q.choix) {
    assert.equal(new Set(q.choix).size, q.choix.length, `${ou} : deux choix identiques ${JSON.stringify(q.choix)}`);
    assert.ok(q.bon >= 0 && q.bon < q.choix.length, `${ou} : bonne réponse absente`);
    if (q.forme === "qcm") assert.ok((q.choix.length >= 3 && q.choix.length <= 4) || q.donnees.type === "repere-comparer" || q.donnees.type === "comparer-mes");
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
  // Lot A2 ter (Gwenaël, le 13/11 : « Une voiture pèse environ … », puis
  // « Une voiture pèse environ … t ») : dans Je valide, le test, On revoit,
  // jamais deux fois le même repère (la question à relier en reprend trois,
  // il n'y en a que 9) ; dans À toi, pas deux fois à moins de 5 questions.
  if (code === "R1") {
    // (Lot R1-refonte : la règle ne demande pas de repère.)
    const reps = q => (q.forme === "associer" ? q.reperes : q.repere ? [q.repere] : []);
    if (usage === "entraine" || usage === "exerciseur") {
      s.forEach((q, i) => s.slice(Math.max(0, i - 4), i).forEach(y => {
        const communs = reps(y).filter(r => reps(q).includes(r));
        assert.equal(communs.length, 0, `${ou} : le repère ${communs} revient à la question ${i + 1}, moins de 5 questions après`);
      }));
    } else {
      // (Lot R1-refonte : la règle à lire ne demande pas de repère.)
      const choix = s.filter(q => q.forme !== "associer" && q.repere).map(q => q.repere);
      assert.equal(new Set(choix).size, choix.length, `${ou} : un repère deux fois ${JSON.stringify(choix)}`);
    }
  }
  // Lot B1-1 : les repères du CM1. Je valide : l'objet à trouver en 3e et
  // 8e, la valeur au pavé en 6e, relier en dernier ; chaque repère de
  // l'étape demandé ; un repère une fois (deux au plus s'il y en a moins de
  // 9), jamais deux fois à moins de 3 questions.
  if (["R3", "R4", "R5"].includes(code) && usage === "valide") {
    assert.deepEqual([2, 4, 5, 7, 9].map(i => s[i].morceaux.sorte || s[i].forme), ["objets", "objets", "saisie", "objets", "associer"], `${ou} : places`);
    assert.ok(s[4].morceaux.compare && !s[2].morceaux.compare && !s[7].morceaux.compare, `${ou} : comparer en 5e`);
    const demandes = s.filter(q => !q.reperes).map(q => q.repere);
    // (Lot R1-refonte : 10 repères de longueur au CM1, 8 places : 8 au moins.)
    const nouveaux = CARTE.etape(code).reperes;
    assert.ok(nouveaux.filter(c => demandes.includes(c)).length >= Math.min(8, nouveaux.length), `${ou} : des repères ne sont pas demandés`);
    const tous = CARTE.etape(code).reperes.length + CARTE.etape("R1").reperes.filter(c => CARTE.repere(c).grandeur === CARTE.repere(CARTE.etape(code).reperes[0]).grandeur).length;
    const max = tous >= 9 ? 1 : 2;
    const simples = s.map(q => (q.reperes ? null : q.repere));
    simples.forEach((c, i) => {
      if (!c) return;
      assert.ok(demandes.filter(x => x === c).length <= max, `${ou} : ${c} trop de fois`);
      assert.ok(!simples.slice(Math.max(0, i - (tous >= 8 ? 4 : 1)), i).includes(c), `${ou} : ${c} deux fois de près`);
    });
  }
  if (code === "R6" && usage === "valide") {
    assert.deepEqual([s[3].forme, s[7].forme], ["qcm", "qcm"], `${ou} : Quelle mesure ? en 4e et 8e`);
    const v = s.filter(q => q.forme === "vrai-faux");
    assert.equal(v.filter(q => q.reponse === "Oui").length, 4, `${ou} : 4 Oui`);
    assert.equal(v.filter(q => q.reponse === "Non").length, 4, `${ou} : 4 Non`);
    ["longueur", "masse", "contenance"].forEach(g => assert.ok(s.filter(q => q.grandeur === g).length >= 2, `${ou} : ${g}`));
    assert.equal(new Set(s.map(q => q.cleBase)).size, 10, `${ou} : une situation deux fois`);
  }
  // Relier : jamais les trois mesures en face de leur objet (Gwenaël, le 13/11).
  s.filter(q => q.forme === "associer").forEach(q => assert.ok(!q.bonnes.every((b, i) => b === i), `${ou} : les trois mesures en face de leur objet`));
  // Lot A2 bis : la place des nouvelles questions dans Je valide.
  // Lot R1-refonte : relier en premier (le plus facile), puis l'objet à
  // trouver, l'unité, la valeur, la règle, le pavé.
  if (code === "R1" && usage === "valide") {
    assert.deepEqual(s.map(q => q.forme === "associer" ? "associer" : q.donnees.type === "regle" ? "regle" : q.morceaux.sorte),
      ["associer", "objets", "unite", "unite", "valeur", "objets", "regle", "saisie", "valeur", "saisie"], `${ou} : places`);
  }
  // Lot R1-refonte (Gwenaël, 18/11) : les trois travaux de « Quelle unité
  // choisir ? », dans l'ordre.
  if (code === "R2" && usage === "valide") {
    assert.deepEqual(s.map(q => q.travail || (q.donnees.type === "grandeur" ? 1 : 2)), [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], `${ou} : les travaux`);
    assert.equal(s[3].donnees.type, "unite-duree");
  }
  // Travail 1 : une seule unité de la bonne grandeur ; travail 2 : toutes
  // de la même grandeur ; travail 3 : la même unité, des nombres 10 ou 100
  // fois plus grands ou plus petits.
  if (code === "R2") {
    s.forEach(q => {
      if (q.donnees.type === "unite-grandeur" || q.donnees.type === "unite-sans") {
        assert.equal(q.choix.filter(u => G.grandeurDe(u) === q.grandeur).length, 1, `${ou} : ${q.texte}`);
      }
      if (q.donnees.type === "unite") assert.ok(q.choix.every(u => G.grandeurDe(u) === q.grandeur), `${ou} : ${q.texte}`);
      if (q.donnees.type === "nombre") {
        const v = G.milli(q.reponse);
        q.choix.forEach(c => { const x = G.milli(c); assert.ok(x === v || [10n, 100n].some(k => x === v * k || x * k === v), `${ou} : ${q.texte} ${c}`); });
      }
    });
  }
  if (code === "C2" && usage === "valide") { assert.equal(s[4].forme, "ranger"); assert.equal(s[5].forme, "qcm"); }
  if (code === "C1" && usage === "valide") assert.equal(s[4].forme, "qcm");
  if (code === "E1" && usage === "valide") {
    assert.deepEqual([...new Set(s.map(q => q.donnees.sorte))].sort(), ["deux", "objet", "pieces", "prix", "versC", "versE", "versEdec"], `${ou} : les sept façons`);
  }
  // Lot 3b : les étapes par cœur varient la forme.
  if (code === "R1" && usage === "valide") assert.deepEqual([7, 9].map(i => s[i].morceaux.sorte), ["saisie", "saisie"]);
  if (code === "P1" && usage === "valide") {
    assert.deepEqual([s[4], s[8]].map(q => q.donnees.type), ["fois", "fois"]); assert.equal(s[9].forme, "associer");
    // Plus jamais trois réponses « 1 » à la fin.
    assert.ok(!s.slice(7, 9).every(q => q.reponse === "1"), `${ou} : les réponses « 1 » à la fin`);
  }
  // Lot B1-2 : les places de Je valide, les trois grandeurs, jamais deux
  // fois la même relation.
  if (["P2", "P3", "P4"].includes(code) && usage === "valide") {
    const rels = s.map(q => q.relationCle).filter(r => r && r !== "relier");
    assert.equal(new Set(rels).size, rels.length, `${ou} : une relation deux fois ${rels}`);
    ["longueur", "masse", "contenance"].forEach(g => assert.ok(s.some(q => q.grandeur === g), `${ou} : ${g}`));
  }
  if (code === "P2" && usage === "valide") {
    assert.deepEqual([0, 3, 4, 6, 7].map(i => s[i].donnees.type), ["prefixe-sens", "prefixe-nom", "fois", "prefixe-sens", "fois"], `${ou} : places`);
    assert.equal(s[9].forme, "associer"); assert.equal(s[2].forme, "phrase");
  }
  if (code === "P3" && usage === "valide") {
    assert.equal(s[4].forme, "qcm"); assert.equal(s[2].forme, "phrase"); assert.equal(s[6].forme, "phrase");
    assert.ok(s.filter(q => FAMILLE[q.donnees.vers] && EXPOSANTS[q.donnees.vers] > EXPOSANTS[q.donnees.de]).length >= 3, `${ou} : vers la grande unité`);
  }
  if (code === "P4" && usage === "valide") {
    assert.deepEqual([3, 4, 7].map(i => s[i].donnees.type), ["conv", "fois", "comparer-mes"], `${ou} : places`);
    assert.equal(s[3].forme, "qcm"); assert.equal(s[9].forme, "associer");
  }
  if (code === "D1" && usage === "valide") assert.deepEqual([s[4].forme, s[8].forme], ["qcm", "qcm"]);
  if (code === "D2" && usage === "valide") {
    assert.equal(s[2].forme, "qcm"); assert.equal(s[4].donnees.type, "quarts");
    assert.deepEqual([s[6].donnees.type, s[8].donnees.type], ["heure-mots", "heure-mots"]);
  }
  if (code === "D7" && usage === "valide") assert.deepEqual([s[4].forme, s[7].forme], ["qcm", "qcm"]);
  if (code === "D7" && usage === "valide") {
    assert.deepEqual([...new Set(s.map(q => q.donnees.cherche))].sort(), ["arrivee", "depart", "duree"], `${ou} : les trois questions`);
  }
  // Lot B2-1 : C3, C4 — une phrase en 3e, au choix en 5e, un objet en
  // 7e ; les trois grandeurs ; les deux sens trois fois au moins ; C4 :
  // quatre questions au moins sur les unités nouvelles du CM1.
  if ((code === "C3" || code === "C4") && usage === "valide") {
    const n = g => s.filter(q => q.grandeur === g).length;
    assert.ok(n("masse") >= 2 && n("contenance") >= 2 && n("longueur") >= 1, `${ou} : les trois grandeurs`);
    assert.equal(s[2].forme, "phrase"); assert.ok(!s[2].morceaux.objet, `${ou} : une phrase en 3e`);
    assert.equal(s[4].forme, "qcm");
    assert.ok(s[6].morceaux.objet, `${ou} : un objet en 7e`);
    const bas = s.filter(q => EXPOSANTS[q.donnees.de] > EXPOSANTS[q.donnees.vers]).length;
    assert.ok(bas >= 3 && 10 - bas >= 3, `${ou} : les deux sens (${bas} vers la petite unité)`);
    if (code === "C4") {
      const neuves = ["hm", "dam", "hg", "dag", "dg", "cg", "mg", "hL", "daL", "mL"];
      assert.ok(s.filter(q => neuves.includes(q.donnees.de) || neuves.includes(q.donnees.vers)).length >= 4, `${ou} : les unités du CM1`);
    }
  }
  // Lot B2-1b : C5 — l'intrus en 4e, « Coche » en dernier ; les trois
  // grandeurs ; décomposer une fois au plus ; « Coche » deux fois et l'intrus
  // deux fois dans À toi.
  if (code === "C5" && usage === "valide") {
    const n = g => s.filter(q => q.grandeur === g).length;
    assert.ok(n("masse") >= 2 && n("contenance") >= 2 && n("longueur") >= 1, `${ou} : les trois grandeurs`);
    assert.equal(s[3].donnees.type, "intrus"); assert.equal(s[9].forme, "plusieurs");
    assert.ok(s.filter(q => q.donnees.type === "decomp").length <= 1, `${ou} : décomposer deux fois`);
  }
  if (code === "C5" && usage === "entraine") {
    assert.deepEqual([8, 12, 19, 22].map(i => s[i].donnees.type), ["intrus", "plusieurs", "intrus", "plusieurs"], `${ou} : places`);
    assert.equal(s.filter(q => q.forme === "plusieurs").length, 2, `${ou} : « Coche » deux fois`);
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
    const prevues = {R1: ["qcm", "associer", "phrase"], R2: ["qcm"], P1: ["nombre", "phrase", "qcm", "associer"], C1: ["nombre", "phrase", "qcm"],
      C2: ["nombre", "phrase", "deux-cases", "ranger", "qcm"], D1: ["nombre", "deux-cases", "qcm"], D2: ["nombre", "deux-cases", "qcm"],
      Q1: ["nombre", "vrai-faux"], E1: ["nombre", "deux-cases"], D7: ["nombre", "deux-cases", "qcm"],
      R3: ["qcm", "associer", "phrase"], R4: ["qcm", "associer", "phrase"], R5: ["qcm", "associer", "phrase"], R6: ["qcm", "vrai-faux"],
      P2: ["qcm", "associer", "nombre", "phrase"], P3: ["qcm", "nombre", "phrase"], P4: ["qcm", "associer", "nombre", "phrase"],
      C3: ["nombre", "phrase", "qcm"], C4: ["nombre", "phrase", "qcm"], C5: ["nombre", "phrase", "deux-cases", "qcm", "plusieurs"],
      C6: ["nombre", "phrase", "qcm"]}[code];
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
    for (const u of ["valide", "entraine", "test", "echauffement", "retour"]) {
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
    "R2 grandeur": 4, "R2 unite-duree": 3, "R2 unite": 4, "R2 unite-sans": 3, "C2 ranger la plus petite": 4, "C2 ranger la plus grande": 4};
  Object.keys(attendu).forEach(k => assert.equal(places[k] ? places[k].size : 0, attendu[k], `${k} : la bonne réponse aux places ${places[k] ? [...places[k]] : []}`));
  // Les exemples de « On te montre » ne reviennent jamais (E1, D7, R2).
  for (const code of ["E1", "D7", "R2"]) {
    const ex = new Set(G.clesExemples(code));
    assert.ok(ex.size === 3, code);
    for (let g = 1; g <= 2000; g += 1) {
      for (const u of ["valide", "entraine", "test", "echauffement", "aide", "retour"]) {
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
  for (const code of ["P1", "C1", "C2", "D1", "D2", "Q1", "E1", "D7", "P2", "P3", "P4", "C3", "C4"]) {
    for (let g = 1; g <= 300; g += 1) {
      G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
        const d = q.donnees;
        // (Lot B1-2 : un mauvais choix, son pourquoi.)
        if (q.pourquoi && q.choix) q.choix.forEach((c, k) => {
          if (k === q.bon) return;
          const v = G.verifier(q, k);
          assert.ok(v.retour, `${code} : « ${c} » sans pourquoi`);
          ecriture(v.retour, `${code} pourquoi`); milliers(v.retour, code);
          assert.ok(v.retour.length <= 60, `${code} : pourquoi trop long « ${v.retour} »`);
        });
        const essais = [];
        if (d.type === "conv") {
          const v = G.milli(d.valeur);
          const f = G.facteur(G.exposant(d.de) > G.exposant(d.vers) ? d.de : d.vers, G.exposant(d.de) > G.exposant(d.vers) ? d.vers : d.de);
          essais.push(v, v * f, v * f * 10n, v * f / 10n, v * 1000n, v % f === 0n ? v / f : 1n, G.milli(q.reponse) * 10n, G.milli(q.reponse) / 10n);
          // (Lot B2-1 : la virgule effacée, le zéro mal placé.)
          if (v % 1000n) {
            const [e, dec] = G.brut(v).split(",");
            essais.push(BigInt(e + dec) * 1000n, BigInt(e) * 1000n * f + BigInt(dec) * 1000n);
          }
        } else if (d.type === "somme") essais.push(G.milli(d.a) + G.milli(d.b), G.lireMilli(`${d.a}${d.b}`), G.convertir(G.milli(d.a), d.ua, d.vers) + G.milli(d.b) * 10n);
        else if (d.type === "deux") {
          const f = G.facteur(d.grande, d.petite); const t = G.milli(d.valeur) / 1000n; const a = t / f; const b = t % f;
          [[a, b / 10n], [a * 10n, b]].forEach(x => noter(code, G.verifier(q, x.map(String))));
        } else if (d.type === "heure-mots") noter(code, G.verifier(q, [String(d.h + 1), "45"]));
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
            [[e, c * 10], [e, c / 10], [Math.floor(d.total / 10), d.total % 10], d.sorte === "plus" ? q.morceaux.plus : [-1]].forEach(x => { if (x.every(y => Number.isInteger(y) && y >= 0)) noter(code, G.verifier(q, x.map(String))); });
          } else if (q.unite === "€") essais.push(G.milli(d.total * 100), ...(d.total % 10 ? [] : [G.milli(d.total / 10)]), G.milli(d.total), G.milli(d.total) / 10n);
          else essais.push(G.milli(e * 10 + c), G.milli(e * 100), G.milli(e || 1), G.milli(e * 100 + c * 10));
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
  const attendues = {C3: [1, 2, 3, 4, 5, 6], C4: [1, 2, 3, 4, 5, 6], P2: [1, 2, 4], P3: [1, 2, 3, 4], P4: [1, 2, 3, 4], P1: [1, 3], C1: [1, 2, 3, 4, 5, 6, 7], C2: [1, 2, 3, 4, 5], D1: [1, 2], D2: [1, 2, 3, 4], Q1: [1, 2, 3], E1: [1, 2, 3, 4, 5, 6, 7], D7: [1, 2, 3]};
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

// ------------------------------------------------- lot 3b-2 : les dessins
test("lot 3b-2 : la règle à lire — la bonne longueur, les deux vraies erreurs, à sa place", () => {
  let vues = 0;
  for (let g = 1; g <= 400; g += 1) {
    const valide = G.serie("R1", {usage: "valide", graine: g});
    // (Lot R1-refonte : la règle en 7e de Je valide, 4 fois dans À toi.)
    assert.equal(valide[6].donnees.type, "regle", `graine ${g} : la règle en 7e de Je valide`);
    const entraine = G.serie("R1", {usage: "entraine", graine: g});
    assert.deepEqual([6, 13, 20].map(i => entraine[i].donnees.type), ["regle", "regle", "regle"], `graine ${g} : trois fois dans À toi`);
    const longueurs = entraine.filter(q => q.donnees.type === "regle").map(q => q.donnees.fin - q.donnees.debut);
    longueurs.forEach((l, k) => assert.ok(k === 0 || l !== longueurs[k - 1], `graine ${g} : la même longueur deux fois de suite`));
    [valide[6], entraine[6], entraine[13], entraine[20]].forEach(q => {
      const {debut, fin, objet} = q.donnees;
      const L = fin - debut;
      assert.ok(debut >= 2 && debut <= 5 && fin <= 10 && L >= 2, `${objet} de ${debut} à ${fin}`);
      // la bonne, « lu au bout » (fin), « les traits comptés » (L + 1)
      assert.deepEqual(q.choix.map(Number).sort((a, b) => a - b), [L, L + 1, fin].sort((a, b) => a - b));
      assert.equal(Number(q.choix[q.bon]), L);
      assert.equal(q.morceaux.apres, "cm");
      assert.deepEqual(q.morceaux.regle, {objet, debut, fin});
      vues += 1;
    });
  }
  assert.ok(vues > 1000);
});

test("lot 3b-2 : « Je prévois » — seulement les erreurs de sens, et le sens attendu", () => {
  const compte = {};
  for (let g = 1; g <= 300; g += 1) {
    for (const code of ["C1", "C2", "P1", "E1", "D1", "D2", "R1", "Q1", "C3", "C4"]) {
      G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
        const f = G.fauxDeSens(q);
        if (!["C1", "C2", "P1", "E1", "C3", "C4"].includes(code)) { assert.equal(f, null, `${code} : pas de « Je prévois »`); return; }
        // La bonne réponse n'est jamais une erreur de sens.
        assert.equal(G.erreurDeSens(q, q.choix ? q.choix[q.bon] : (Array.isArray(q.reponse) ? q.reponse[0] : q.reponse)), false);
        if (!f) return;
        compte[code] = (compte[code] || 0) + 1;
        const tape = f.choix !== undefined ? q.choix[f.choix] : f.texte;
        assert.ok(G.erreurDeSens(q, tape), `${code} ${q.texte} : ${tape}`);
        const lu = G.lireMilli(tape);
        const bon = G.lireMilli(q.choix ? q.choix[q.bon] : q.reponse);
        const s = G.sensDe(q);
        // L'erreur de sens va dans l'autre sens que la bonne réponse, ou garde le nombre.
        const d = q.donnees;
        const depart = d.type === "conv" ? G.milli(d.valeur) : G.milli(d.total);
        assert.equal(bon > depart, s.grandit, `${code} ${q.texte} : le sens`);
        assert.ok(s.grandit ? lu <= depart : lu >= depart, `${code} ${q.texte} : ${tape} n'est pas une erreur de sens`);
        assert.match(s.question, /grandir ou rapetisser/);
      });
    }
  }
  ["C1", "C2", "P1", "E1", "C3", "C4"].forEach(c => assert.ok(compte[c] > 50, `${c} : des erreurs de sens possibles`));
  // Une autre erreur (un zéro de trop) n'est pas une erreur de sens.
  const q = G.serie("C1", {usage: "valide", graine: 3}).find(x => x.donnees.type === "conv" && x.forme !== "qcm");
  assert.equal(G.erreurDeSens(q, G.brut(G.milli(q.reponse) * 10n)), false);
});

test("lot 3b-2 : la phrase sous le glisse-unité", () => {
  const phrases = new Set();
  for (let g = 1; g <= 200; g += 1) {
    ["C1", "C2", "P1"].forEach(code => G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
      if (!q.glisse) return;
      const {de, vers, phrase} = q.glisse;
      assert.ok(phrase, `${code} ${q.texte} : une phrase`);
      phrases.add(phrase);
      if (G.exposant(de) > G.exposant(vers)) assert.match(phrase, /^Chaque [a-zéè]+ devient \d[\d ]* [a-zéè]+s\.$/);
      else assert.match(phrase, /^\d[\d ]* [a-zéè]+s font 1 [a-zéè]+\.$/);
    }));
  }
  assert.ok(phrases.has("Chaque mètre devient 100 centimètres.") || phrases.has("Chaque mètre devient 100 centimètres."));
});

test("lot 3b-2 : chaque repère a son illustration (webp, 600 px au plus, 64 ko au plus) ; plus d'émoticône", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const dossier = path.join(path.dirname(require.resolve("../outils/conversions/conversions_carte.js")), "conversions-reperes");
  const utilisees = new Set();
  CARTE.REPERES.forEach(r => {
    assert.match(r.image, /^[a-z]\d{1,2}\.webp$/, r.code);
    utilisees.add(r.image);
    const f = path.join(dossier, r.image);
    assert.ok(fs.existsSync(f), `${r.code} : ${r.image} manque`);
    const b = fs.readFileSync(f);
    assert.ok(b.length <= 64 * 1024, `${r.image} : ${b.length} octets`);
    assert.equal(b.toString("latin1", 0, 4), "RIFF"); assert.equal(b.toString("latin1", 8, 12), "WEBP");
    // VP8X : largeur et hauteur - 1 sur 24 bits.
    if (b.toString("latin1", 12, 16) === "VP8X") {
      const w = b.readUIntLE(24, 3) + 1;
      const h = b.readUIntLE(27, 3) + 1;
      assert.ok(w <= 600 && h <= 600, `${r.image} : ${w} × ${h}`);
    }
    assert.equal("emoji" in r, false, `${r.code} : plus d'émoticône`);
  });
  assert.equal(utilisees.size, 40, "33 illustrations, trois reprises (voiture, feuille A4, brique de lait), les 4 de la planche 7 (lot B1-1) et les 3 du lot R1-refonte");
  assert.deepEqual(fs.readdirSync(dossier).filter(n => n.endsWith(".webp")).sort(), [...utilisees].sort(), "aucune image en trop");
  assert.match(CARTE.repere("l8").credit, /Nicolas PAYET.*CC BY-SA 3\.0/);
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  ["defi_conversions.html", "defi_conversions_aides.js", "conversions_carte.js", "conversions_generateurs.js"].forEach(n => {
    const texte = fs.readFileSync(path.join(path.dirname(dossier), n), "utf8").replace(/[★✓✗]/g, "");
    assert.doesNotMatch(texte, EMOJI, `${n} : une émoticône`);
  });
});

test("lot 3b-3 bis : la réponse est écrite dans le résumé (la correction et le bilan la mettent en vert là où elle est)", () => {
  // « Une voiture : environ 4 m de long » ne finit pas par « 4 m » : la page
  // ne coupe plus le résumé à la longueur de la réponse (rapport de Codex,
  // F06), elle cherche la réponse dedans. Il faut donc qu'elle y soit.
  const SANS = new Set(["vrai-faux", "associer", "ranger", "plusieurs"]);
  let n = 0;
  PRETES.forEach(code => {
    for (let g = 1; g <= 200; g += 1) {
      ["valide", "entraine", "retour"].forEach(usage => G.serie(code, {usage, graine: g}).forEach(q => {
        if (SANS.has(q.forme) || (q.forme === "qcm" && !q.glisse)) return;
        n += 1;
        assert.ok(q.resume.includes(q.reponseTexte), `${code} ${q.forme} : « ${q.resume} » sans « ${q.reponseTexte} »`);
      }));
    }
  });
  assert.ok(n > 1000);
});

test("lot B1-1 : au palier 2, la liste des unités ne donne jamais la réponse", () => {
  // Jamais le repère demandé, jamais un repère de même mesure (le litre
  // d'eau pour le paquet de riz de 1 kg), jamais un objet à relier ; à
  // « Est-ce vraisemblable ? », jamais un repère qui a la vraie mesure.
  globalThis.MATHSGO_CONVERSIONS_CARTE = CARTE;
  globalThis.MATHSGO_CONVERSIONS = G;
  const A = require("../outils/conversions/defi_conversions_aides.js");
  let n = 0;
  for (const code of ["R3", "R4", "R5", "R6"]) {
    for (let g = 1; g <= 300; g += 1) {
      for (const usage of ["entraine", "valide", "retour"]) {
        G.serie(code, {usage, graine: g}).forEach(q => {
          const lignes = A.referencesUnites2(q);
          const interdits = [q.repere].concat(q.forme === "associer" ? q.reperes : []).filter(Boolean);
          const mesures = interdits.map(c => `${CARTE.repere(c).nombre}${CARTE.repere(c).unite}`).concat(q.cache ? [q.cache] : []);
          lignes.forEach(l => {
            n += 1;
            assert.ok(!interdits.includes(l.repere), `${code} : « ${l.texte} » pour « ${q.texte} »`);
            const r = CARTE.repere(l.repere);
            assert.ok(!mesures.includes(`${r.nombre}${r.unite}`), `${code} : « ${l.texte} » a la mesure de la réponse (« ${q.texte} »)`);
          });
          assert.ok(lignes.length >= 1 || q.forme === "associer", `${code} : aucune ligne pour « ${q.texte} »`);
          if (q.repereProche) assert.notEqual(`${CARTE.repere(q.repereProche).nombre}${CARTE.repere(q.repereProche).unite}`, q.cache, `${code} : le repère proche a la vraie mesure`);
        });
      }
    }
  }
  assert.ok(n > 5000);
});

test("lot B2-1 : C3 et C4 — la phrase des décimaux, les erreurs des décimaux, les unités voisines, des mesures vraies", () => {
  // La phrase sous le glisse-unité (S002 p. 9) : le dernier rang écrit vers
  // la petite unité, l'unité de départ vers la grande ; d'hectomètre.
  const question = (code, valeur, de, vers) => {
    for (let g = 1; g <= 4000; g += 1) {
      for (const u of ["entraine", "valide"]) {
        const q = G.serie(code, {usage: u, graine: g}).find(x => x.donnees.type === "conv" && x.donnees.valeur === valeur && x.donnees.de === de && x.donnees.vers === vers);
        if (q) return q;
      }
    }
    return null;
  };
  const phrases = new Set();
  for (let g = 1; g <= 300; g += 1) {
    ["C3", "C4"].forEach(code => G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
      const {de, vers, phrase} = q.glisse;
      phrases.add(phrase);
      if (EXPOSANTS[de] > EXPOSANTS[vers]) assert.match(phrase, /^Chaque (?:(?:dixième|centième) (?:de |d'))?[a-zéè]+ devient \d[\d ]* [a-zéè]+\.$/, phrase);
      else assert.match(phrase, /^Chaque [a-zéè]+ devient un (?:dixième|centième|millième) (?:de |d')[a-zéè]+\.$/, phrase);
      assert.ok(phrase.length <= 52, `phrase trop longue : ${phrase}`);
      // (La phrase courte : les unités en symboles, 40 caractères au plus.)
      assert.ok(q.glisse.phraseCourte.length <= 40 && q.glisse.phraseCourte.endsWith(`${vers}.`), `phrase courte : ${q.glisse.phraseCourte}`);
    }));
  }
  ["Chaque dixième de mètre devient 10 centimètres.", "Chaque centimètre devient un centième de mètre."].forEach(p => assert.ok(phrases.has(p), p));
  assert.ok([...phrases].some(p => /d'hecto/.test(p)), "d'hectomètre, d'hectolitre");
  // Les erreurs des décimaux, au pavé.
  const q = question("C3", "3,5", "m", "cm") || question("C3", "4,5", "m", "cm");
  assert.ok(q, "une question 3,5 m ou 4,5 m → cm");
  const [e, d] = q.donnees.valeur.split(",");
  assert.equal(G.verifier(q, e + d).retour, "Effacer la virgule ne suffit pas.");
  assert.equal(G.verifier(q, `${e}0${d}`).retour, "0,5 m, ce n'est pas 5 cm.");
  assert.equal(G.verifier(q, `${e}${d}00`).retour, "0,5 m, c'est 50 cm.");
  assert.equal(G.verifier(q, `${e},${d}00`).retour, "Des zéros après la virgule ne changent rien.");
  assert.equal(G.verifier(q, `0,0${e}${d}`).erreur, 1);
  assert.ok(G.erreurDeSens(q, `0,0${e}${d}`));
  // Au choix (C3) : les vraies erreurs ; (C4) : la même mesure dans une
  // autre unité de l'échelle, recalculée à part.
  let n3 = 0;
  let n4 = 0;
  for (let g = 1; g <= 600; g += 1) {
    G.serie("C3", {usage: "entraine", graine: g}).filter(x => x.forme === "qcm").forEach(x => {
      n3 += 1;
      x.choix.forEach((c, k) => { if (k !== x.bon) assert.ok(G.verifier(x, k).retour, `C3 : « ${c} » sans pourquoi`); });
    });
    G.serie("C4", {usage: "entraine", graine: g}).filter(x => x.forme === "qcm").forEach(x => {
      n4 += 1;
      const v = lire(x.donnees.valeur);
      x.choix.forEach((c, k) => {
        if (k === x.bon) return;
        const y = lire(c.replace(/ /g, ""));
        const unites = Object.keys(EXPOSANTS).filter(u => FAMILLE[u] === FAMILLE[x.donnees.vers] && u !== x.donnees.vers && u !== "t");
        const u = unites.find(w => { try { return versUnite(v, x.donnees.de, w) === y; } catch (err) { return false; } });
        assert.ok(u, `C4 : « ${c} » n'est pas ${x.donnees.valeur} ${x.donnees.de} dans une autre unité`);
        assert.equal(G.verifier(x, k).retour, `${c}, ce serait des ${u}.`);
      });
    });
  }
  assert.ok(n3 > 1000 && n4 > 1000, `${n3} ${n4}`);
  // Des mesures qu'on écrit vraiment : pas de virgule en mm, mg, mL, cg,
  // cL ; jamais moins de 1 dans une petite unité ; 999 au plus dans une
  // unité rare ; 50 000 au plus (C3), 10 000 (C4).
  for (let g = 1; g <= 600; g += 1) {
    ["C3", "C4"].forEach(code => ["entraine", "valide"].forEach(u => G.serie(code, {usage: u, graine: g}).forEach(x => {
      [[x.donnees.valeur, x.donnees.de], [x.reponse, x.donnees.vers]].forEach(([n, unite]) => {
        const m = lire(n);
        assert.ok(!(["mm", "mg", "mL", "cg", "cL"].includes(unite) && m % 1000n), `${code} : ${n} ${unite}`);
        assert.ok(!(["mm", "cm", "dm", "mg", "cg", "dg", "mL", "cL", "dL", "dam", "hm", "dag", "hg", "daL"].includes(unite) && m < 1000n), `${code} : ${n} ${unite}`);
        assert.ok(!(["hm", "dam", "hg", "dag", "dg", "daL", "hL"].includes(unite) && m >= 1000000n), `${code} : ${n} ${unite}`);
        assert.ok(m <= (code === "C3" ? 50000000n : 10000000n), `${code} : ${n} ${unite}`);
      });
    })));
  }
});

test("lot B2-1b : C5 — les sortes, les séries à zéro, les erreurs, « Coche tout ce qui est égal à… »", () => {
  const toutes = [];
  for (let g = 1; g <= 800; g += 1) ["entraine", "valide"].forEach(u => toutes.push(...G.serie("C5", {usage: u, graine: g})));
  const sortes = new Set(toutes.map(q => q.sorteC5));
  ["deux-unites-bas", "deux-unites-haut", "plus-bas", "plus-haut", "deux-cases", "decomposer", "officielle", "intrus", "plusieurs"]
    .forEach(x => assert.ok(sortes.has(x), `la sorte ${x} ne tombe jamais`));
  const trouve = f => toutes.find(f);
  const texte = q => q.texte.replace(/[\u00a0\u202f]/g, " ");
  // Les séries à zéro (Singapour) : 3 km 450 m, 3 km 45 m, 3 km 5 m.
  [/\d km \d{3} m = … m/, /\d km \d\d m = … m/, /\d km \d m = … m/].forEach(re => assert.ok(trouve(q => re.test(texte(q))), `${re}`));
  // Le piège 2,5 : « 2 m 5 cm = … m ».
  const piege = trouve(q => q.sorteC5 === "deux-unites-haut" && /^\d m \d cm/.test(texte(q)));
  assert.ok(piege);
  const [a, b] = [piege.donnees.a, piege.donnees.b];
  assert.equal(G.verifier(piege, `${a},${b}`).retour, CARTE.typo(`${b} cm, c'est 0,0${b} m.`));
  assert.equal(G.verifier(piege, `${a}0${b}`).erreur, 7);
  assert.equal(G.verifier(piege, String(Number(a) + Number(b))).erreur, 5);
  // Vers la petite unité : les chiffres collés (3 km 45 m → 345 m), le zéro
  // de trop (3 450 m).
  const km = trouve(q => q.sorteC5 === "deux-unites-bas" && /^\d km \d\d m/.test(texte(q)));
  assert.equal(G.verifier(km, `${km.donnees.a}${km.donnees.b}`).erreur, 6);
  assert.equal(G.verifier(km, `${km.donnees.a}${km.donnees.b}0`).erreur, 7);
  // Deux cases : « 2,05 m = 2 m 50 cm ».
  const dc = trouve(q => q.forme === "deux-cases" && q.donnees.grande === "m" && /^\d$/.test(q.reponse[1]));
  assert.equal(G.verifier(dc, [dc.reponse[0], `${dc.reponse[1]}0`]).erreur, 6);
  // Décomposer : un seul chiffre par colonne.
  const dec = trouve(q => q.donnees.type === "decomp");
  assert.equal(G.verifier(dec, "15").erreur, 8);
  // Les conversions officielles : un nombre entier vers la grande unité ;
  // une erreur de sens y lance « Je prévois ».
  const off = toutes.filter(q => q.sorteC5 === "officielle");
  assert.ok(off.length > 100 && off.every(q => !q.donnees.valeur.includes(",") && EXPOSANTS[q.donnees.de] < EXPOSANTS[q.donnees.vers]));
  const o = off[0];
  const f = versUnite(1000n, o.donnees.vers, o.donnees.de) / 1000n;
  assert.ok(G.erreurDeSens(o, String(lire(o.donnees.valeur) * f / 1000n)));
  // Pas de « Je prévois » ailleurs dans C5 (somme, deux cases, décomposer).
  toutes.filter(q => q.forme !== "qcm" && q.forme !== "plusieurs" && q.sorteC5 !== "officielle").forEach(q => {
    const r = Array.isArray(q.reponse) ? q.reponse[0] : q.reponse;
    ["1", "5", "10", "100", `${r}0`].forEach(t => assert.ok(!G.erreurDeSens(q, t), `${q.texte} : ${t}`));
  });
  // Des mesures qu'on écrit vraiment, au centième au plus, partout.
  toutes.forEach(q => {
    const d = q.donnees;
    if (d.type === "somme") { mesureVraieC5(d.a, d.ua, q.texte); mesureVraieC5(d.b, d.ub, q.texte); }
    if (d.type === "conv" || d.type === "deux") mesureVraieC5(d.valeur, d.de, q.texte);
    if (!Array.isArray(q.reponse) && q.forme !== "qcm" && q.forme !== "plusieurs") mesureVraieC5(q.reponse, q.unite, q.texte);
  });
  // « Coche » : un mauvais choix dit pourquoi ; un oubli aussi.
  const p = trouve(q => q.forme === "plusieurs" && q.bons.length === 3);
  assert.match(G.verifier(p, p.bons.slice(0, 2)).retour, /^Tu as oublié \d/);
  assert.equal(G.verifier(p, p.bons.slice(0, 1)).retour, "Tu en as oublié deux.");
});

test("lot B2-2a : C6 — les fractions usuelles, les places, les erreurs, la double droite", () => {
  const toutes = [];
  for (let g = 1; g <= 800; g += 1) ["entraine", "valide"].forEach(u => toutes.push(...G.serie("C6", {usage: u, graine: g})));
  const sortes = new Set(toutes.map(q => q.sorteC6));
  ["1/2", "1/4", "3/4", "dixiemes", "demi-plus", "pont", "part", "bandes"].forEach(s => assert.ok(sortes.has(s), `la sorte ${s} ne tombe pas`));
  // Les exemples officiels de S002 tombent (½ km, ¼ kg, ½ t ; ¾ m est un exemple de On te montre).
  ["C6:1/4kg>g", "C6:1/2t>kg", "C6:1/2L>cL", "C6:1/4L>cL", "C6:3/4kg>g", "C6:1/10L>cL"].forEach(c => assert.ok(toutes.some(q => (q.cleBase || q.cle) === c), `${c} ne tombe pas`));
  // Des situations de La Réunion.
  assert.ok(toutes.some(q => /rougail|letchis|goyavier|cannes à sucre|piments/.test(q.texte)), "pas de situation de La Réunion");
  // Les places : Je valide — une phrase en 3e, un pont en 5e, une situation en 7e, « … = … L » en 9e ; À toi.
  for (let g = 1; g <= 300; g += 1) {
    const v = G.serie("C6", {usage: "valide", graine: g});
    assert.equal(v[2].forme, "phrase"); assert.ok(!v[2].morceaux.situation);
    assert.equal(v[4].sorteC6, "pont"); assert.ok(v[6].morceaux.situation, `valide ${g} : une situation en 7e`);
    assert.equal(v[8].sorteC6, "part");
    const e = G.serie("C6", {usage: "entraine", graine: g});
    assert.deepEqual([4, 11, 22].map(i => e[i].sorteC6), ["pont", "pont", "pont"]);
    assert.deepEqual([8, 17, 20].map(i => e[i].sorteC6), ["part", "part", "bandes"]);
  }
  // Les erreurs : chacune déclenchée, une ligne courte.
  const vues = new Set();
  toutes.filter(q => q.donnees.type === "frac").forEach(q => {
    const d = q.donnees;
    const f = Number(G.facteur(d.de, d.vers));
    [f / Number(d.d), Number(q.reponse) * 10, f * 3, `${d.n}${d.d}`, `${d.a},5`].forEach(x => {
      const r = G.verifier(q, String(x));
      if (!r.juste && r.retour) { vues.add(r.erreur); assert.ok(r.retour.length <= 32, `pourquoi trop long : « ${r.retour} »`); }
    });
  });
  [1, 2, 3, 4].forEach(e => assert.ok(vues.has(e), `l'erreur ${e} n'est jamais dite`));
  // Pas de « Je prévois » en C6 ; la double droite et la barre vont ensemble.
  toutes.forEach(q => {
    assert.equal(G.fauxDeSens(q), null);
    if (q.droite && q.barre) assert.equal(q.droite.parts % q.barre.parts, 0);
    if (q.donnees.type === "frac") assert.equal(q.droite.cherche, Number(q.donnees.n));
  });
});

// ------------------------------------------------- lot R1-refonte (18/11)
test("lot R1-refonte : les corrections qui citent les repères, les dix repères demandés", () => {
  for (let g = 1; g <= 400; g += 1) {
    for (const u of ["entraine", "valide"]) {
      assert.ok(!G.serie("R1", {usage: u, graine: g}).some(q => q.donnees.type === "traits"), "plus de « Quel segment… ? » (Gwenaël, 19/11)");
      // R2, travaux 2 et 3 : la correction place la mesure entre les repères
      // de « Mes premiers repères » (une longueur, une masse, une contenance).
      G.serie("R2", {usage: u, graine: g}).filter(q => q.donnees.type === "unite" || q.donnees.type === "nombre").forEach(q => {
        assert.equal(q.correction.length, 2, q.texte);
        assert.match(q.correction[1], /^(Plus|Moins|À peu près comme)/, q.correction[1]);
      });
    }
  }
  // Les dix repères, un par unité, et le pourquoi de relier en peu de mots.
  const objets = new Set();
  for (let g = 1; g <= 200; g += 1) G.serie("R1", {usage: "entraine", graine: g}).forEach(q => (q.reperes || [q.repere]).forEach(c => c && objets.add(c)));
  assert.deepEqual([...objets].sort(), CARTE.etape("R1").reperes.slice().sort(), "les dix repères sont tous demandés");
  assert.ok(!G.OBJETS_UNITE.some(o => /carte bancaire|vélo/.test(o[0])), "pas de carte bancaire, pas de vélo");
});

test("lot R1-refonte : au palier 2, le décimètre n'a sa ligne que si la question porte sur lui", () => {
  // Sans unités proposées (« Lequel mesure le moins ? »), la liste des
  // longueurs garde quatre lignes : cinq ne tenaient pas au petit iPhone.
  globalThis.MATHSGO_CONVERSIONS_CARTE = CARTE;
  globalThis.MATHSGO_CONVERSIONS = G;
  const A = require("../outils/conversions/defi_conversions_aides.js");
  let n = 0;
  for (const code of ["R3", "R5", "R6"]) {
    for (let g = 1; g <= 300; g += 1) {
      for (const usage of ["entraine", "valide", "retour"]) {
        G.serie(code, {usage, graine: g}).forEach(q => {
          if (q.outil !== "reperes-unites") return;
          const lignes = A.referencesUnites2(q);
          const parDefaut = !(q.morceaux.sorte === "unite" && q.choix) && !q.unites;
          const surDm = q.unite === "dm" || (q.reperes || []).some(c => CARTE.repere(c).unite === "dm");
          if (!parDefaut || surDm) return;
          n += 1;
          assert.ok(!lignes.some(l => l.unite === "dm"), `${code} : ligne du décimètre pour « ${q.texte} »`);
          assert.ok(lignes.length <= 4, `${code} : ${lignes.length} lignes pour « ${q.texte} »`);
        });
      }
    }
  }
  assert.ok(n > 100, `seulement ${n} questions vues`);
});
