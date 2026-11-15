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
    // Lot 3b
    case "heure-mots": return [BigInt(d.h) * 1000n, BigInt(d.m) * 1000n];
    // Lot 3b-2 : la règle à lire (de 2 à 5 cm jusqu'à 10 cm au plus).
    case "regle": {
      assert.ok(d.debut >= 2 && d.debut <= 5 && d.fin <= 10 && d.fin > d.debut, "l'objet est sur la règle, sans partir de 0 ni de 1");
      return [BigInt(d.fin - d.debut) * 1000n];
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
  // (Un nom propre, « le sentier du Trou de Fer mesure », n'en est pas une.)
  assert.doesNotMatch(texte, /(?<=[a-zà-ÿ,;])(?<!\b(?:de|du|au|en)) [A-ZÀ-Ý][a-zà-ÿ]+ (?:mesure|pèse|contient)/, `${ou} : majuscule au milieu d'une phrase`);
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
        else attenduTexte = String(rec[0] / 1000n);
        assert.equal(bonTexte, attenduTexte, `${ou} : le bon choix « ${bonTexte} » ≠ ${attenduTexte}`);
      } else assert.ok(G.verifier(q, Array.isArray(q.reponse) ? q.reponse : q.reponse).juste, `${ou} : la bonne réponse est refusée`);
    }
  }
  // Lot 3b : les questions sans recalcul numérique.
  if (q.donnees.type === "fois") {
    const f = versUnite(1000n, q.donnees.grande, q.donnees.petite) / 1000n;
    assert.equal(q.choix[q.bon].replace(/\u202f/g, ""), `${f} fois`, `${ou} : combien de fois`);
    assert.deepEqual(q.choix.map(c => c.replace(/\u202f/g, "")), ["10 fois", "100 fois", "1000 fois"]);
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
    // Une seule unité de la bonne grandeur… ou deux, la fausse étant au
    // mauvais ordre de grandeur (jamais deux qui pourraient convenir).
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
    // Lot 3b : quatre unités ; au plus une d'une autre grandeur.
    assert.equal(q.choix.length, 4);
    assert.ok(q.choix.filter(u => FAMILLE[u] !== FAMILLE[o[2]]).length <= 1, `${ou} : ${q.choix}`);
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
  // Lot A2 ter : l'image de « Entre deux heures » n'écrit jamais la réponse
  // (le premier bond était toute la réponse quand il n'y avait que des heures).
  if (q.code === "D7" && q.image) {
    const rep = q.reponseTexte.replace(/\u00a0/g, " ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q.image.forEach(l => assert.doesNotMatch(l.replace(/\u00a0/g, " "), new RegExp(`[=:] ${rep}\\.?$`), `${ou} : l'image « ${l} » donne la réponse ${q.reponseTexte}`));
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
  // Lot 3b : un objet n'apparaît que dans ses bornes, dans une unité où on
  // le mesure vraiment (jamais « un ruban de 9 000 cm », jamais en dL).
  if (q.morceaux.objet && q.code !== "E1") {
    const [, nom, n, u] = q.texte.match(/^((?:Un|Une) [^.]+) de ([\d\u202f]+)\u00a0([a-zA-Z]+)\./) || [];
    assert.ok(nom, `${ou} : « ${q.texte} »`);
    const o = G.OBJETS_MESURE.find(x => x[0] === nom && x[1] === u);
    assert.ok(o, `${ou} : objet inconnu ${nom} en ${u}`);
    const nb = Number(n.replace(/\u202f/g, ""));
    assert.ok(nb >= o[2] && nb <= o[3], `${ou} : ${nom} de ${nb} ${u} hors de ses bornes`);
    assert.notEqual(q.donnees.vers, "dL", `${ou} : un objet en dL`);
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
  // Lot A2 ter (Gwenaël, le 13/11 : « Une voiture pèse environ … », puis
  // « Une voiture pèse environ … t ») : dans Je valide, le test, On revoit,
  // jamais deux fois le même repère (la question à relier en reprend trois,
  // il n'y en a que 9) ; dans À toi, pas deux fois à moins de 5 questions.
  if (code === "R1") {
    const reps = q => (q.forme === "associer" ? q.reperes : [q.repere]);
    if (usage === "entraine" || usage === "exerciseur") {
      s.forEach((q, i) => s.slice(Math.max(0, i - 4), i).forEach(y => {
        const communs = reps(y).filter(r => reps(q).includes(r));
        assert.equal(communs.length, 0, `${ou} : le repère ${communs} revient à la question ${i + 1}, moins de 5 questions après`);
      }));
    } else {
      const choix = s.filter(q => q.forme !== "associer").map(q => q.repere);
      assert.equal(new Set(choix).size, choix.length, `${ou} : un repère deux fois ${JSON.stringify(choix)}`);
    }
  }
  // Relier : jamais les trois mesures en face de leur objet (Gwenaël, le 13/11).
  s.filter(q => q.forme === "associer").forEach(q => assert.ok(!q.bonnes.every((b, i) => b === i), `${ou} : les trois mesures en face de leur objet`));
  // Lot A2 bis : la place des nouvelles questions dans Je valide.
  if (code === "R1" && usage === "valide") assert.equal(s[9].forme, "associer", `${ou} : associer en dernier`);
  if (code === "R2" && usage === "valide") {
    assert.equal(s[3].donnees.type, "grandeur"); assert.equal(s[7].donnees.type, "unite-duree");
    assert.equal(s[5].donnees.type, "unite-sans");
    assert.equal(s.filter(q => q.donnees.type === "unite").length, 7);
  }
  if (code === "C2" && usage === "valide") { assert.equal(s[4].forme, "ranger"); assert.equal(s[5].forme, "qcm"); }
  if (code === "C1" && usage === "valide") assert.equal(s[4].forme, "qcm");
  if (code === "E1" && usage === "valide") {
    assert.deepEqual([...new Set(s.map(q => q.donnees.sorte))].sort(), ["deux", "objet", "pieces", "prix", "versC", "versE", "versEdec"], `${ou} : les sept façons`);
  }
  // Lot 3b : les étapes par cœur varient la forme.
  if (code === "R1" && usage === "valide") assert.deepEqual([5, 7].map(i => s[i].morceaux.sorte), ["saisie", "saisie"]);
  if (code === "P1" && usage === "valide") {
    assert.deepEqual([s[4], s[8]].map(q => q.donnees.type), ["fois", "fois"]); assert.equal(s[9].forme, "associer");
    // Plus jamais trois réponses « 1 » à la fin.
    assert.ok(!s.slice(7, 9).every(q => q.reponse === "1"), `${ou} : les réponses « 1 » à la fin`);
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
      Q1: ["nombre", "vrai-faux"], E1: ["nombre", "deux-cases"], D7: ["nombre", "deux-cases", "qcm"]}[code];
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
  for (const code of ["P1", "C1", "C2", "D1", "D2", "Q1", "E1", "D7"]) {
    for (let g = 1; g <= 300; g += 1) {
      G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
        const d = q.donnees;
        const essais = [];
        if (d.type === "conv") {
          const v = G.milli(d.valeur);
          const f = G.facteur(G.exposant(d.de) > G.exposant(d.vers) ? d.de : d.vers, G.exposant(d.de) > G.exposant(d.vers) ? d.vers : d.de);
          essais.push(v, v * f, v * f * 10n, v * f / 10n, v * 1000n, v % f === 0n ? v / f : 1n, G.milli(q.reponse) * 10n, G.milli(q.reponse) / 10n);
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
  const attendues = {P1: [1, 3], C1: [1, 2, 3, 4, 5, 6, 7], C2: [1, 2, 3, 4, 5], D1: [1, 2], D2: [1, 2, 3, 4], Q1: [1, 2, 3], E1: [1, 2, 3, 4, 5, 6, 7], D7: [1, 2, 3]};
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
    assert.equal(valide[2].donnees.type, "regle", `graine ${g} : la règle en 3e de Je valide`);
    const entraine = G.serie("R1", {usage: "entraine", graine: g});
    assert.deepEqual([3, 11, 19].map(i => entraine[i].donnees.type), ["regle", "regle", "regle"], `graine ${g} : trois fois dans À toi`);
    [valide[2], entraine[3], entraine[11], entraine[19]].forEach(q => {
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
    for (const code of ["C1", "C2", "P1", "E1", "D1", "D2", "R1", "Q1"]) {
      G.serie(code, {usage: "entraine", graine: g}).forEach(q => {
        const f = G.fauxDeSens(q);
        if (!["C1", "C2", "P1", "E1"].includes(code)) { assert.equal(f, null, `${code} : pas de « Je prévois »`); return; }
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
  ["C1", "C2", "P1", "E1"].forEach(c => assert.ok(compte[c] > 50, `${c} : des erreurs de sens possibles`));
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
  assert.equal(utilisees.size, 33, "33 illustrations, trois reprises (voiture, feuille A4, brique de lait)");
  assert.deepEqual(fs.readdirSync(dossier).filter(n => n.endsWith(".webp")).sort(), [...utilisees].sort(), "aucune image en trop");
  assert.match(CARTE.repere("l8").credit, /Nicolas PAYET.*CC BY-SA 3\.0/);
  const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  ["defi_conversions.html", "defi_conversions_aides.js", "conversions_carte.js", "conversions_generateurs.js"].forEach(n => {
    const texte = fs.readFileSync(path.join(path.dirname(dossier), n), "utf8").replace(/[★✓✗]/g, "");
    assert.doesNotMatch(texte, EMOJI, `${n} : une émoticône`);
  });
});
