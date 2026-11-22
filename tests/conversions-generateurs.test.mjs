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
import testDeNode from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CARTE = require("../outils/conversions/conversions_carte.js");
const G = require("../outils/conversions/conversions_generateurs.js");

const GRAINES = Number(process.env.BANC_GRAINES || 2000);
const PRETES = CARTE.ORDRE.filter(c => CARTE.etape(c).pret);
// Lot « vérifications plus rapides » (21/11/2026) : le banc d'essai par étape (2 000
// graines × 7 usages, les trois quarts de la durée du fichier) est joué par trois voisins,
// conversions-generateurs-banc-1.test.mjs, -banc-2 et -banc-3, chacun pour le tiers des
// étapes, dans trois processus qui tournent en même temps : mêmes graines, mêmes
// contrôles, le tiers de l'attente. Ce fichier-ci garde tous les autres tests.
// BANC_PART=1 node --test tests/conversions-generateurs.test.mjs : la part 1 seule.
const PARTS = 3;
const PART = Number(process.env.BANC_PART || 0);
const test = PART ? () => {} : testDeNode;
// Lot 3a : « retour » (Je me souviens, Avant de partir : 2 questions de degré 2).
const USAGES = [["valide", null], ["entraine", null], ["test", null], ["echauffement", null], ["aide", null], ["retour", null], ["exerciseur", 30]];
const NB = " ";
const FINE = " ";

// ------------------------------------------------- le recalcul, à part
// (Lot B1-2 : toutes les unités du CM1, hm, dam, hg, dag, dg, cg, mg, hL, daL, mL.)
// (Lot B6-2 : de nano à giga, les octets, les watts.)
const EXPOSANTS = {Mm: 6, km: 3, hm: 2, dam: 1, m: 0, dm: -1, cm: -2, mm: -3, "µm": -6, nm: -9, t: 6, kg: 3, hg: 2, dag: 1, g: 0, dg: -1, cg: -2, mg: -3,
  "µg": -6, ng: -9, hL: 2, daL: 1, L: 0, dL: -1, cL: -2, mL: -3, "µL": -6, "€": 2, c: 0, o: 0, ko: 3, Mo: 6, Go: 9, W: 0, kW: 3, MW: 6, GW: 9,
  // (Lot B3-2 : les aires du CM2, 1 m² = 100 dm² = 10 000 cm².)
  "m²": 0, "dm²": -2, "cm²": -4};
const FAMILLE = {Mm: "l", km: "l", hm: "l", dam: "l", m: "l", dm: "l", cm: "l", mm: "l", "µm": "l", nm: "l", t: "m", kg: "m", hg: "m", dag: "m", g: "m", dg: "m", cg: "m", mg: "m",
  "µg": "m", ng: "m", hL: "c", daL: "c", L: "c", dL: "c", cL: "c", mL: "c", "µL": "c", "€": "a", c: "a", o: "o", ko: "o", Mo: "o", Go: "o", W: "w", kW: "w", MW: "w", GW: "w",
  "m²": "s", "dm²": "s", "cm²": "s"};
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
// (Lot B3-1 : les aires du CM2, comptées en cm² : 1 dm² = 100 cm², 1 m² =
// 10 000 cm².)
const EXP2 = {km: 3, m: 0, dm: -1, cm: -2, mm: -3, t: 6, kg: 3, g: 0, mg: -3, L: 0, dL: -1, cL: -2, mL: -3, "cm²": 0, "dm²": 2, "m²": 4};
const FAMILLE_G = {km: "longueur", m: "longueur", dm: "longueur", cm: "longueur", mm: "longueur", t: "masse", kg: "masse", g: "masse", mg: "masse",
  L: "contenance", dL: "contenance", cL: "contenance", mL: "contenance", "cm²": "aire", "dm²": "aire", "m²": "aire"};
function taille(r) {
  return lire(r.nombre.replace(".", ",")) * 10n ** BigInt(EXP2[r.unite] + 3);
}
// Lot B2-1b : la valeur d'une carte (« 2 m 15 cm ») dans la plus petite
// unité de sa grandeur, et les mesures qu'on écrit vraiment.
const BASE = {l: "mm", m: "mg", c: "mL"};
function valeurCarte(parts) {
  return parts.reduce((t, [n, u]) => t + versUnite(lire(n), u, BASE[FAMILLE[u]]), 0n);
}
// (Lot B3-2 : `milliemes`, C9 au CM2 : trois chiffres après la virgule.)
function mesureVraieC5(n, u, ou, milliemes = false) {
  const m = lire(n);
  assert.ok(m > 0n && m <= 100000000n, `${ou} : ${n} ${u}`);
  assert.ok(!(["mm", "mg", "mL", "cg", "cL"].includes(u) && m % 1000n), `${ou} : ${n} ${u} (pas de virgule)`);
  assert.ok(!(["mm", "cm", "dm", "mg", "cg", "dg", "mL", "cL", "dL", "dam", "hm", "dag", "hg", "daL"].includes(u) && m < 1000n), `${ou} : ${n} ${u} (moins de 1)`);
  if (!milliemes) assert.ok(m % 10n === 0n, `${ou} : ${n} ${u} (des millièmes au CM1)`);
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
    // Lot B2-3b-1 : Q2, (Σ coefficient × mesure) ÷ le nombre de conserves.
    case "q2": {
      const s = d.termes.reduce((a, [m, u, k]) => a + BigInt(k) * versUnite(lire(m), u, d.vers), 0n);
      assert.equal(s % BigInt(d.n), 0n, "la balance ne tombe pas juste");
      return [s / BigInt(d.n)];
    }
    // Lot B2-3b-2 : Q10, les durées (toutes les minutes, le même jour). La
    // réponse recalculée à part : la durée, l'heure d'arrivée ou de départ.
    case "q10": {
      const [dep, arr] = [d.depart, d.arrivee];
      assert.ok(dep >= 0 && arr < 24 * 60 && arr > dep, "le même jour");
      assert.ok(dep % 60 && arr % 60 && (!d.milieu || d.milieu % 60), "jamais une heure pile");
      if (d.milieu) assert.ok(d.milieu > dep && d.milieu < arr);
      const t = d.cherche === "duree" ? arr - dep : d.cherche === "arrivee" ? arr : dep;
      if (Array.isArray(q.reponse)) return [BigInt(Math.floor(t / 60)) * 1000n, BigInt(t % 60) * 1000n];
      return [BigInt(t) * 1000n];
    }
    // Lot B6-1 : D6, les heures décimales (x en centièmes de l'unité haute :
    // 135 → 1,35 h), recalculées à part : x × 60 ÷ 100 tombe juste.
    case "d6": {
      if (q.forme === "qcm") return null;
      const x = BigInt(d.x);
      assert.equal((x * 60n) % 100n, 0n, "les minutes ne tombent pas juste");
      if (d.vers === "hmin") return [(x / 100n) * 1000n, ((x % 100n) * 60n / 100n) * 1000n];
      if (d.vers === "h") return [x * 10n];
      return [(x * 60n / 100n) * 1000n];
    }
    // Lot B6-1 : G1, km/h et m/s (s2 : le double de la vitesse en m/s),
    // recalculés à part : 1 h = 3 600 s, 1 km = 1 000 m.
    case "g1": {
      if (q.forme === "qcm") return null;
      const metresParHeure = BigInt(d.s2) * 1800n * 1000n;
      const en = {"km/h": metresParHeure / 1000n, "m/min": metresParHeure * 1000n / 60n / 1000n, "m/s": metresParHeure * 1000n / 3600n / 1000n};
      assert.equal((metresParHeure * 1000n) % 3600n, 0n);
      return [en[d.a]];
    }
    // Lot B2-2b-2 : C8, « 8,2 kg + 840 g = … kg » (comme les problèmes).
    case "pb": case "vrai": case "calc": {
      const a = versUnite(lire(d.a), d.ua, d.vers);
      const b = versUnite(lire(d.b), d.ub, d.vers);
      return [d.op === "+" ? a + b : a - b];
    }
    // Lot B3-3 : D3, la quantité relue à part (dans le texte, ou depuis les
    // instants), puis rangée dans les cases ([h, min, s], [jours, h]…).
    case "d3": {
      const T = {s: {h: 3600, min: 60, s: 1}, h: {jours: 24, h: 1}}[d.base];
      let qte;
      if (d.depart !== undefined && d.sorte !== "depart") {
        qte = d.arrivee - d.depart;
        const pas = q.degre === 1 && qte < 60 ? 60 : 3600;
        assert.ok(Math.ceil(d.depart / pas) * pas < d.arrivee, "la durée passe une pile");
        assert.ok(d.depart % 60 && d.arrivee % 60, "des secondes au départ et à l'arrivée");
      } else if (d.sorte === "depart") qte = d.arrivee - d.duree;
      else if (d.sorte === "lire") qte = d.h * 3600 + d.m * 60 + d.s;
      else if (d.sorte === "triathlon") qte = d.total - d.nage - d.velo;
      else {
        // (La durée écrite dans la situation, ou avant « = ».)
        const m = q.morceaux;
        const src = `${m.enonce || ""} ${(m.avant || m.phrase || "").split("=")[0]}`.replace(/[\u00a0\u202f]/g, " ").replace(/(\d) (?=\d{3}\b)/g, "$1");
        const lu = [...src.matchAll(/(\d+(?:,\d+)?) (h|min|s)(?![\wÀ-ÿ])/g)];
        assert.ok(lu.length, `pas de durée dans « ${src} »`);
        const unite = {h: d.base === "h" ? 1 : 3600, min: 60, s: 1};
        qte = lu.reduce((a, [, n, u]) => a + Number(lire(n)) * unite[u] / 1000, 0);
      }
      assert.equal(qte, d.q, `D3 : la quantité ${d.q} ≠ ${qte}`);
      let reste = qte;
      return d.unites.map(u => { const n = Math.floor(reste / T[u]); reste -= n * T[u]; return BigInt(n) * 1000n; });
    }
    // Lot B3-3 : Q3 (plusieurs fois, partager, combien de parts, fois plus
    // ou moins, les étagères, deux étapes), recalculé à part.
    case "q3": {
      const v = (m, u) => versUnite(lire(m), u, d.vers);
      if (d.sorte === "fois") return [BigInt(d.n) * v(d.a, d.ua)];
      if (d.sorte === "partage") { assert.equal(v(d.a, d.ua) % BigInt(d.n), 0n); return [v(d.a, d.ua) / BigInt(d.n)]; }
      if (d.sorte === "parts") { const T = versUnite(lire(d.a), d.ua, d.up); assert.equal(T % lire(d.part), 0n); return [(T / lire(d.part)) * 1000n]; }
      if (d.sorte === "fois-plus") return [d.plus ? v(d.a, d.ua) * BigInt(d.k) : v(d.a, d.ua) / BigInt(d.k)];
      if (d.sorte === "planches") {
        const L = versUnite(lire(d.L), d.uL, d.ue);
        assert.ok(L % lire(d.e) !== 0n, "les étagères : il reste un bout");
        return [BigInt(d.n) * (L / lire(d.e)) * 1000n];
      }
      if (d.sorte === "deux") { const tot = BigInt(d.n) * v(d.a, d.ua); assert.equal(tot % BigInt(d.k), 0n); return [tot / BigInt(d.k)]; }
      return null;
    }
    // Lot B3-3 : Q4, k⁄n d'une quantité (dans l'unité de la réponse).
    case "q4": {
      const Q = versUnite(lire(d.q), d.u, d.vers);
      assert.equal(Q % BigInt(d.n), 0n, "la fraction ne tombe pas juste");
      return [(Q / BigInt(d.n)) * BigInt(d.k)];
    }
    default: return null;
  }
}

// ------------------------------------------------- les contrôles d'écriture
const INTERDITS = [/\d\.\d/, /e[+-]\d/, /000000/, /NaN|undefined|null|\[object/, /(^|[\s(=])[-−]\d/, /Dans d'/, /un demi de/, /pour \d+ identiques/, /La masse .* pèse/];
const PERSONNE = /\b(il|elle|ils|elles)\b/gi;
// (Lot 3b-3 : « Quelle heure est-il ? », « Il est huit heures » : l'heure,
// pas une personne.)
const IMPERSONNEL = /(il en faut|il reste|reste-t-il|il faut|il manque|il y a|y a-t-il|faut-il|heure est-il|il est (?:midi|[a-zé]+ heures?))/gi;
// La même chose qu'assert.doesNotMatch, mais le message n'est écrit que si la règle
// casse (lot « vérifications plus rapides », 21/11/2026 : l'écrire d'avance, pour
// chaque texte de chaque graine, prenait le septième du banc d'essai). Les motifs
// passés ici n'ont pas le drapeau g : test() ne garde rien d'un appel à l'autre.
function pasDe(texte, re, message) {
  if (re.test(texte)) assert.doesNotMatch(texte, re, message());
}
function ecriture(texte, ou) {
  INTERDITS.forEach(re => pasDe(texte, re, () => `${ou} : ${re} dans « ${texte} »`));
  pasDe(texte, /\d (?:km|hm|dam|m|dm|cm|mm|t|kg|hg|dag|g|dg|cg|mg|hL|daL|L|dL|cL|mL|min|h)(?![\wÀ-ÿ])/, () => `${ou} : espace normale avant l'unité dans « ${texte} »`);
  // (Lot B1-2 : un nombre et l'unité écrite en mots, « 1 hectomètre ».)
  pasDe(texte, /\d (?:kilo|hecto|déca|déci|centi|milli)?(?:mètres?|grammes?|litres?)\b/, () => `${ou} : espace normale avant l'unité en mots dans « ${texte} »`);
  pasDe(texte, /\d[  ]\d{3}(?!\d)/, () => `${ou} : milliers sans espace fine dans « ${texte} »`);
  // (Lot B2-3b-2, Gwenaël : « 52 / min à la ligne, c'est pas joli » : une
  // heure ou une durée ne se coupe pas non plus entre « h » et les minutes.)
  pasDe(texte, /\d\u00a0h (?=\d)/, () => `${ou} : « h » et les minutes séparables dans « ${texte} »`);
  // (Lot B3-3 : à la seconde, « 12 min 15 s » et « 83 jours 8 h » non plus ;
  // « 15 s » insécable.)
  pasDe(texte, /\d\u00a0min (?=\d)|\d\u00a0jours (?=\d)|\d (?:s|jours)(?![\wÀ-ÿ'])/, () => `${ou} : une durée à la seconde séparable dans « ${texte} »`);
  const sansImpersonnel = texte.replace(IMPERSONNEL, "");
  assert.doesNotMatch(sansImpersonnel, PERSONNE, `${ou} : « il » ou « elle » pour une personne dans « ${texte} »`);
  // (Un nom propre, « le sentier du Trou de Fer mesure », n'en est pas une ;
  // lot B1-1 : ni « la Diagonale des Fous », ni « un Car Jaune » ; lot
  // B2-3b-1 : ni « Léa mesure 1,52 m et Noa mesure 139 cm », ni « Zoé
  // trouve que Noa mesure 1 480 cm ».)
  assert.doesNotMatch(texte, /(?<=[a-zà-ÿ,;])(?<!\b(?:de|du|des|au|en|et|que))(?<!\b[A-ZÀ-Ý][a-zà-ÿ]*) [A-ZÀ-Ý][a-zà-ÿ]+ (?:mesure|pèse|contient)/, `${ou} : majuscule au milieu d'une phrase`);
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
        else if (d.type === "q10") attenduTexte = `${rec[0] / 1000n} h ${String(rec[1] / 1000n).padStart(2, "0")}`;
        else if (d.type === "frac") attenduTexte = G.ecrire(rec[0]).replace(/\u202f/g, " ");
        // (Lot B3-3 : « 2 min 30 s », « 60 s » — correctif : l'unité dans le
        // choix, toujours ; « 24 kg ».)
        else if (d.type === "d3") attenduTexte = d.unites.map((u, k) => `${rec[k] / 1000n} ${u}`).join(" ");
        else if (d.type === "q4") attenduTexte = `${G.ecrire(rec[0]).replace(/\u202f/g, " ")} ${d.vers}`;
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
  if (["P2", "P3", "P4", "C3", "C4", "C5", "C6", "C7", "C8"].includes(q.code)) {
    const rep = q.reponseTexte.replace(/[\u00a0\u202f]/g, " ");
    const aide = [...(q.image || []), q.outil === "glisse-unite" && !q.outilSansRelation ? q.relation : ""].join(" | ").replace(/[\u00a0\u202f]/g, " ");
    // (Les bandes de C6 : la réponse est le nom d'une bande, l'image la récrit.)
    if (q.donnees.type !== "comparer-mes" && q.donnees.type !== "bandes" && q.donnees.type !== "comparer-c7") assert.ok(!aide.includes(rep), `${ou} : l'aide « ${aide} » donne « ${rep} »`);
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
      c.forEach(([n, u]) => mesureVraieC5(n, u, ou, q.code === "C9"));
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
  // Lot B2-2b-1 : C7 — ranger (l'unité commune et l'image recalculées),
  // « … ou … ? » (le piège du plus grand nombre, la même mesure), « Coche
  // tout ce qui est plus grand que… » (chaque carte recalculée).
  if (q.code === "C7" && q.donnees.type === "ranger") {
    const ms = q.donnees.mesures;
    const memeNombre = new Set(ms.map(([x]) => x)).size === 1;
    if (!memeNombre) {
      assert.ok(q.uniteCommune && ms.every(([, u]) => FAMILLE[u] === FAMILLE[q.uniteCommune]), `${ou} : unité commune`);
      ms.forEach(([x, u]) => {
        const y = versUnite(lire(x), u, q.uniteCommune);
        assert.ok(y % 10n === 0n && y <= 100000000n, `${ou} : ${x} ${u} ne s'écrit pas en ${q.uniteCommune}`);
        if (u !== q.uniteCommune) assert.ok(q.image.some(l => l.replace(/[\u00a0\u202f]/g, " ") === `${G.ecrire(lire(x)).replace(/\u202f/g, " ")} ${u} = ${G.ecrire(y).replace(/\u202f/g, " ")} ${q.uniteCommune}`), `${ou} : l'image n'écrit pas ${x} ${u}`);
      });
    }
    if (q.sorteC7 === "ranger" || q.sorteC7 === "situation") {
      const v = ms.map(([x, u]) => versUnite(lire(x), u, BASE[FAMILLE[u]]));
      const piege = ms.some(([a, u], i) => ms.some(([b, w], j) => u !== w && lire(a) > lire(b) && v[i] < v[j]));
      assert.ok(piege, `${ou} : aucun piège du plus grand nombre`);
    }
  }
  if (q.donnees.type === "comparer-c7") {
    const d = q.donnees;
    const a = versUnite(lire(d.a), d.ua, d.ub);
    const b = lire(d.b);
    assert.ok(lire(d.b) > lire(d.a), `${ou} : le piège (le plus grand nombre) manque`);
    const attendu = a === b ? q.choix[2] : a > b ? `${G.ecrire(lire(d.a))}\u00a0${d.ua}` : `${G.ecrire(b)}\u00a0${d.ub}`;
    assert.equal(q.choix[q.bon], attendu, `${ou} : la bonne réponse`);
    assert.match(q.choix[2], /^Même (longueur|masse|contenance)$/);
    assert.equal(q.choix.length, 3);
  }
  if (q.donnees.type === "plus-que") {
    const d = q.donnees;
    const X = valeurCarte([d.cible]);
    const v = d.cartes.map(valeurCarte);
    const bons = v.map((y, k) => ((d.sens === ">" ? y > X : y < X) ? k : -1)).filter(k => k >= 0);
    assert.deepEqual(bons, q.bons, `${ou} : les bonnes cartes`);
    assert.ok(bons.length === 2 || bons.length === 3, `${ou} : ${bons.length} bonnes cartes`);
    assert.ok(v.every(y => y !== X), `${ou} : une carte égale à la cible`);
    assert.ok(new Set(d.cartes.map(c => c[0][1])).size >= 2, `${ou} : une seule unité`);
    assert.ok(d.cartes.some(c => (lire(c[0][0]) > lire(d.cible[0])) !== (valeurCarte(c) > X)), `${ou} : aucune carte ne trompe`);
    d.cartes.forEach((c, k) => mesureVraieC5(c[0][0], c[0][1], ou));
    v.forEach((y, k) => {
      if (bons.includes(k)) return;
      const m = q.pourquoi[k].replace(/[\u00a0\u202f]/g, " ").match(/^(.+), c'est ([\d ,]+) ([a-zA-Z]+)\.$/);
      assert.ok(m && m[3] === d.cible[1], `${ou} : pourquoi « ${q.pourquoi[k]} »`);
      assert.equal(valeurCarte([[m[2].replace(/ /g, ""), m[3]]]), y, `${ou} : « ${q.pourquoi[k]} » est faux`);
      const r = G.verifier(q, q.bons.concat([k]));
      assert.ok(!r.juste && r.retour, `${ou} : une carte fausse cochée acceptée`);
    });
    assert.ok(G.verifier(q, q.bons).juste);
    assert.ok(!G.verifier(q, q.bons.slice(1)).juste);
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
      // (Lot B3-1 : « 7 000 m² », les milliers.)
      assert.equal(q.mesures[q.bonnes[i]].replace(/\u00a0/g, " ").replace(/\u202f/g, ""), `${r.nombre.replace(".", ",")} ${r.unite}`, `${ou} : ${code} mal relié`);
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
    // (Lot B2-2b-1 : C7 range des mesures à virgule, au centième, qu'on
    // écrit vraiment.)
    mesures.forEach(([x, u]) => (q.code === "C7" ? mesureVraieC5(x, u, ou) : assert.ok(lire(x) <= 10000000n && lire(x) % 1000n === 0n, `${ou} : ${x}`)));
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
    if (q.forme === "qcm") assert.ok((q.choix.length >= 3 && q.choix.length <= 4) || q.donnees.type === "repere-comparer" || q.donnees.type === "comparer-mes"
      || q.donnees.type === "comparer-p5" || q.donnees.type === "comparer-p6" || (q.code === "A5" && q.donnees.sorte === "meme")
      // (Lot B3-1, R9 : le périmètre ou l'aire ; le gros qui n'est pas le plus lourd.)
      || q.donnees.type === "perim-aire" || q.donnees.type === "piege");
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
  // trouver, l'unité, la valeur, la règle, le pavé. Lot R1-noms : le nom
  // de l'unité en 4e (« 1 cm, c'est… » ou « Un kilogramme s'écrit 1… »).
  if (code === "R1" && usage === "valide") {
    assert.deepEqual(s.map(q => q.forme === "associer" ? "associer" : q.donnees.type === "regle" ? "regle" : q.morceaux.sorte),
      ["associer", "objets", "unite", ["nom", "symbole"], "valeur", "objets", "regle", "saisie", "valeur", "saisie"].map((x, i) => Array.isArray(x) ? (x.includes(s[i].morceaux.sorte) ? s[i].morceaux.sorte : x[0]) : x), `${ou} : places`);
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
  // Lot B2-2b-1 : C7 — « … ou … ? » en 3e et en 6e, une situation en 7e,
  // « Coche » en dernier ; À toi : « … ou … ? » trois fois, « Coche » deux
  // fois ; les trois grandeurs ; le même nombre, une série de l'exerciseur,
  // la même mesure : une fois au plus dans Je valide.
  if (code === "C7" && usage === "valide") {
    const n = g => s.filter(q => q.grandeur === g).length;
    assert.ok(n("masse") >= 2 && n("contenance") >= 2 && n("longueur") >= 1, `${ou} : les trois grandeurs`);
    assert.deepEqual([2, 5].map(i => s[i].donnees.type), ["comparer-c7", "comparer-c7"], `${ou} : places`);
    assert.equal(s[6].sorteC7, "situation"); assert.equal(s[9].forme, "plusieurs");
    ["meme", "tri", "egal"].forEach(k => assert.ok(s.filter(q => q.sorteC7 === k).length <= 1, `${ou} : ${k} deux fois`));
  }
  if (code === "C7" && usage === "entraine") {
    assert.deepEqual([3, 10, 17].map(i => s[i].donnees.type), ["comparer-c7", "comparer-c7", "comparer-c7"], `${ou} : places`);
    assert.deepEqual([12, 22].map(i => s[i].forme), ["plusieurs", "plusieurs"], `${ou} : places`);
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

for (const code of PRETES.filter((_, i) => PART && i % PARTS === PART - 1)) {
  testDeNode(`banc d'essai : ${code} · ${CARTE.etape(code).nom} (${GRAINES} graines × ${USAGES.length} usages)`, () => {
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
      C6: ["nombre", "phrase", "qcm"], C7: ["ranger", "qcm", "plusieurs"], C8: ["nombre", "phrase"], A5: ["nombre", "qcm", "deux-cases"], Q2: ["nombre", "vrai-faux"],
      Q10: ["nombre", "deux-cases", "qcm"], D6: ["nombre", "deux-cases", "qcm"], G1: ["nombre", "phrase", "qcm"],
      P5: ["nombre", "phrase", "qcm", "associer"], P6: ["exposant", "qcm"], Q9: ["nombre", "qcm"],
      R7: ["qcm"], R8: ["qcm", "associer", "phrase", "ranger"], R9: ["qcm"],
      C9: ["nombre", "phrase", "qcm", "deux-cases"], A1: ["nombre", "phrase", "qcm"], A2: ["nombre", "phrase", "qcm"],
      D3: ["nombre", "phrase", "deux-cases", "qcm"], Q3: ["nombre", "vrai-faux"], Q4: ["nombre", "qcm"]}[code];
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

test("lot B2-2b-1 : C7 — les sortes, S002, l'exerciseur, le pourquoi de ranger, la même unité", () => {
  const toutes = [];
  for (let g = 1; g <= 600; g += 1) ["entraine", "valide"].forEach(u => toutes.push(...G.serie("C7", {usage: u, graine: g})));
  const sortes = new Set(toutes.map(q => q.sorteC7));
  ["meme", "tri", "ranger", "situation", "comparer", "egal", "plusieurs"].forEach(k => assert.ok(sortes.has(k), `${k} ne tombe pas`));
  // Les trois grandeurs dans chaque sorte de ranger ; « plus petit que » aussi.
  ["ranger", "situation"].forEach(k => ["longueur", "masse", "contenance"].forEach(gr => assert.ok(toutes.some(q => q.sorteC7 === k && q.grandeur === gr), `${k} ${gr}`)));
  assert.ok(toutes.some(q => q.donnees.type === "plus-que" && q.donnees.sens === "<"), "plus petit que");
  // Quatre unités différentes (S002), et La Réunion.
  assert.ok(toutes.some(q => q.forme === "ranger" && new Set(q.donnees.mesures.map(m => m[1])).size === 4 && q.sorteC7 === "ranger"), "quatre unités");
  assert.ok(toutes.some(q => /La Réunion|letchis|cannes à sucre/.test(q.texte)), "La Réunion");
  // L'exemple de S002 et ceux de On te montre ne tombent jamais.
  const ex = new Set(G.clesExemples("C7"));
  toutes.forEach(q => assert.ok(!ex.has(q.cle), `exemple repris ${q.cle}`));
  // Les séries de l'exerciseur : sans aire, sans volume, sans millièmes.
  toutes.filter(q => q.sorteC7 === "tri").forEach(q => assert.doesNotMatch(q.texte, /[²³]|,\d{3}/, q.texte));
  // Le pourquoi de ranger : les nombres rangés sans l'unité, ou à l'envers.
  let nombres = 0;
  toutes.filter(q => q.forme === "ranger").forEach(q => {
    const env = G.verifier(q, q.ordre.slice().reverse());
    const aLEnvers = q.ordreNombres && q.ordreNombres.join() === q.ordre.slice().reverse().join();
    assert.equal(env.retour, aLEnvers ? `J'écris tout en ${q.uniteCommune} d'abord.` : "Je commence par la plus petite.", q.texte);
    if (q.ordreNombres && q.ordreNombres.join() !== q.ordre.join() && q.ordreNombres.join() !== q.ordre.slice().reverse().join()) {
      nombres += 1;
      const r = G.verifier(q, q.ordreNombres);
      assert.ok(!r.juste && r.retour === `J'écris tout en ${q.uniteCommune} d'abord.`, `${q.texte} : ${r.retour}`);
      assert.ok(r.retour.length <= 31, r.retour);
    }
  });
  assert.ok(nombres > 1000, `le pourquoi des nombres : ${nombres}`);
  // Les pourquoi tiennent sur une ligne (31 caractères au plus).
  toutes.filter(q => q.pourquoi).forEach(q => Object.values(q.pourquoi).forEach(p => assert.ok(p.length <= 31, `« ${p} »`)));
  // Pas de « Je prévois » en C7.
  toutes.forEach(q => assert.equal(G.fauxDeSens(q), null));
});

test("lot B2-2b-2 : C8 — les sortes, les deux sens, S002, le marathon, les erreurs, l'unité à chaque pas", () => {
  const toutes = [];
  for (let g = 1; g <= 600; g += 1) ["entraine", "valide", "retour"].forEach(u => toutes.push(...G.serie("C8", {usage: u, graine: g})));
  const sortes = new Set(toutes.map(q => q.sorteC8.replace(/-\d+$/, "")));
  ["plus-petite", "plus-grande", "moins-petite", "moins-grande", "complement", "situation", "marathon", "officielle"].forEach(k => assert.ok(sortes.has(k), `${k} ne tombe pas`));
  ["longueur", "masse", "contenance"].forEach(gr => ["+", "-"].forEach(op => assert.ok(toutes.some(q => q.grandeur === gr && q.donnees.op === op), `${gr} ${op}`)));
  assert.ok(toutes.some(q => /Saint[-‑]Pierre|cari|rougail|Grand Raid|Diagonale des Fous|goyavier/.test(q.texte)), "La Réunion");
  assert.ok(toutes.some(q => /Grand Raid/.test(q.texte)) && toutes.some(q => /Diagonale des Fous/.test(q.texte)), "le Grand Raid et la Diagonale");
  const ex = new Set(G.clesExemples("C8"));
  assert.equal(ex.size, 3);
  toutes.forEach(q => {
    const d = q.donnees;
    const ou = `C8 ${q.texte}`;
    assert.ok(!ex.has(q.cleBase), `exemple repris ${q.cle}`);
    // Le résultat dans l'une des deux unités ; une seule mesure se convertit.
    assert.ok(d.vers === d.ua || d.vers === d.ub, ou);
    assert.notEqual(d.ua, d.ub, ou);
    const [c, uc] = d.ua === d.vers ? [d.b, d.ub] : [d.a, d.ua];
    const cv = versUnite(lire(c), uc, d.vers);
    // La correction : la mesure convertie, puis le calcul dans une seule
    // unité, écrite à chaque pas (en vert, `resumeVert`).
    const sp = t => t.replace(/[  ]/g, " ").replace(/(\d) (?=\d{3})/g, "$1");
    if (d.sorte !== "marathon") assert.equal(sp(q.correction[0]), `${sp(G.ecrire(lire(c)))} ${uc} = ${sp(G.ecrire(cv))} ${d.vers}`, ou);
    assert.equal(q.correction[1], q.resumeVert, ou);
    assert.ok(q.resumeVert.endsWith(q.reponseTexte), `${ou} : ${q.resumeVert}`);
    const unites = sp(q.resumeVert).match(/[a-zA-Z]+/g);
    assert.ok(unites.every(u => u === d.vers), `${ou} : une seule unité dans « ${q.resumeVert} »`);
    assert.ok(q.resume.endsWith(q.reponseTexte), ou);
    // L'outil : le glisse-unité de la mesure à convertir, puis la phrase.
    assert.equal(q.glisse.de, uc); assert.equal(q.glisse.vers, d.vers);
    assert.match(q.puis, /^Puis (j'ajoute|j'enlève|je l'enlève de) /, ou);
    // Des mesures qu'on écrit (sauf l'exemple officiel 0,43 dam et le marathon).
    if (d.sorte !== "officielle" && d.sorte !== "marathon") {
      [[d.a, d.ua], [d.b, d.ub], [q.reponse, d.vers]].forEach(([n, u]) => mesureVraieC5(n, u, ou));
      assert.ok(lire(d.a) >= 1000n || d.ua !== q.relationCle.split("-")[0], `${ou} : moins de 1 de la grande unité`);
    }
    // Les situations : un énoncé et la question ; des mesures vraisemblables.
    if (/^situation/.test(d.sorte)) {
      assert.match(q.texte, /\. (En tout,|Il reste|Depuis le départ,) … [a-zA-Z]+$/, ou);
      if (/Grand Raid/.test(q.texte)) assert.ok(lire(d.a) <= 60000n, ou);
    }
    if (d.sorte === "marathon") assert.match(q.texte, / d'un marathon de 42\u00a0km 195\u00a0m\. Il reste …\u00a0m$/, ou);
    // Pas de « Je prévois » en C8.
    assert.equal(G.fauxDeSens(q), null);
  });
  // Je valide : le complément en 3e, une situation en 7e ; les sommes, les
  // différences et le résultat dans la grande unité trois fois au moins.
  for (let g = 1; g <= 300; g += 1) {
    const s = G.serie("C8", {usage: "valide", graine: g});
    assert.equal(s[2].donnees.sorte, "complement", `valide ${g}`);
    assert.match(s[6].donnees.sorte, /^(situation|marathon)/, `valide ${g}`);
    assert.ok(s.filter(q => q.donnees.op === "+").length >= 3 && s.filter(q => q.donnees.op === "-").length >= 3, `valide ${g} : + et −`);
    assert.ok(s.filter(q => q.sensC8 === "grande").length >= 3, `valide ${g} : la grande unité`);
  }
  // Les erreurs : chacune déclenchée, une ligne au petit téléphone.
  const vues = new Set();
  toutes.forEach(q => {
    const d = q.donnees;
    const A = lire(d.a); const B = lire(d.b);
    const Av = versUnite(A, d.ua, d.vers); const Bv = versUnite(B, d.ub, d.vers);
    const calc = (x, y) => (d.op === "+" ? x + y : x - y);
    const rep = lire(q.reponse);
    const autre = d.vers === d.ua ? d.ub : d.ua;
    const essais = [calc(d.sorte === "marathon" ? 42195000n : A, B), d.ua === d.vers ? calc(Av, Bv * 10n) : calc(Av * 10n, Bv),
      d.op === "-" ? Av + Bv : (Av > Bv ? Av - Bv : Bv - Av), rep * 10n];
    if (EXPOSANTS[d.vers] > EXPOSANTS[autre]) essais.push(rep * 10n ** BigInt(EXPOSANTS[d.vers] - EXPOSANTS[autre]));
    essais.forEach(x => {
      if (x <= 0n || x === rep) return;
      const v = G.verifier(q, G.brut(x));
      assert.ok(!v.juste, `${q.texte} : ${G.brut(x)} accepté`);
      if (v.erreur) {
        vues.add(v.erreur);
        ecriture(v.retour, "C8 pourquoi"); milliers(v.retour, "C8");
        assert.ok(v.retour.length <= 31, `« ${v.retour} »`);
      }
    });
  });
  [5, 6, 7, 8, 9].forEach(e => assert.ok(vues.has(e), `l'erreur ${e} n'est jamais déclenchée`));
  // « 8,2 kg + 840 g » sans convertir : « J'écris d'abord tout en kg. »
  const q = toutes.find(x => x.donnees.op === "+" && x.donnees.vers === "kg" && x.donnees.ub === "g");
  assert.equal(G.verifier(q, G.brut(lire(q.donnees.a) + lire(q.donnees.b))).retour, "J'écris d'abord tout en kg.");
});

// Lot R1-noms (21/11, choix de Gwenaël) : les dix repères de « Mes premiers
// repères » disent le nom de leur unité (« un centimètre ») ; la question
// « 1 cm, c'est… » / « Un kilogramme s'écrit 1… » : une seule bonne réponse,
// les vraies confusions, un pourquoi d'une ligne, les deux sens, la bonne
// réponse à toutes les places, dans À toi (4e et 15e) et Je valide (4e).
testDeNode("lot R1-noms : le nom de l'unité des repères et la question « 1 cm, c'est… »", () => {
  const sp = t => t.replace(/[\u00a0\u202f]/g, " ");
  const attendus = {l1: "un millimètre", l10: "un centimètre", l15: "un décimètre", l13: "un mètre", l14: "un kilomètre",
    m7: "un gramme", m4: "un kilogramme", m6: "une tonne", c2: "33 centilitres", c3: "un litre"};
  assert.deepEqual(Object.fromEntries(CARTE.etape("R1").reperes.map(c => [c, sp(CARTE.repere(c).lu)])), attendus);
  // Les autres repères n'ont pas de nom écrit (l'élève du CM1 les connaît).
  CARTE.REPERES.filter(r => !CARTE.etape("R1").reperes.includes(r.code)).forEach(r => assert.equal(r.lu, undefined, r.code));
  // « 33 centilitres » ne se coupe pas.
  assert.ok(CARTE.repere("c2").lu.includes("33\u00a0centilitres"));
  const places = {nom: new Set(), symbole: new Set()};
  const unites = new Set();
  let vus = 0;
  for (let g = 1; g <= 600; g += 1) {
    for (const usage of ["entraine", "valide", "test", "retour"]) {
      const s = G.serie("R1", {usage, graine: g});
      const noms = s.map((q, i) => [q, i]).filter(([q]) => q.donnees.type === "nom");
      if (usage === "entraine") assert.deepEqual(noms.map(([, i]) => i), [3, 14], `R1 ${usage} ${g} : les places`);
      if (usage === "valide") assert.deepEqual(noms.map(([, i]) => i), [3], `R1 ${usage} ${g} : la place`);
      noms.forEach(([q, i]) => {
        vus += 1;
        const ou = `R1 ${usage} ${g} ${q.texte}`;
        const d = q.donnees;
        const lu = sp(CARTE.lu("1", d.unite));
        assert.equal(q.forme, "qcm", ou);
        assert.equal(q.choix.length, 3, ou);
        assert.equal(new Set(q.choix).size, 3, ou);
        assert.equal(CARTE.repere(q.repere).unite, d.unite, ou);
        assert.equal(q.outil, "nom-unite", ou);
        if (usage === "entraine") assert.equal(d.sens, i === 3 ? "nom" : i >= 15 ? "symbole" : d.sens, ou);
        if (d.sens === "nom") {
          assert.equal(sp(q.texte), `1 ${d.unite}, c'est …`, ou);
          assert.equal(sp(q.choix[q.bon]), lu, ou);
        } else {
          assert.equal(sp(q.texte), `${lu[0].toUpperCase()}${lu.slice(1)} s'écrit 1 …`, ou);
          assert.equal(q.choix[q.bon], d.unite, ou);
        }
        q.choix.forEach((c, k) => {
          if (k === q.bon) return;
          assert.ok(q.pourquoi[k] && sp(q.pourquoi[k]).length <= 31, `${ou} : pourquoi « ${q.pourquoi[k]} »`);
          ecriture(q.pourquoi[k], ou);
          assert.ok(!G.verifier(q, String(k)).juste, ou);
        });
        assert.ok(G.verifier(q, String(q.bon)).juste, ou);
        places[d.sens].add(q.bon);
        unites.add(d.unite);
      });
    }
  }
  assert.ok(vus > 2000, `seulement ${vus} questions`);
  ["nom", "symbole"].forEach(k => assert.deepEqual([...places[k]].sort(), [0, 1, 2], `${k} : la bonne réponse aux places ${[...places[k]]}`));
  assert.deepEqual([...unites].sort(), ["L", "cL", "cm", "dm", "g", "kg", "km", "m", "mm", "t"]);
});

// Lot B2-3a : A5 « L'aire en carreaux » — l'aire recomptée à part (les
// demis comptent pour la moitié), la figure d'un seul tenant et pas trop
// grande, la superposition qui dit la même chose que les aires, la tache
// recomptée à part (échantillons), les pourquoi d'une ligne, les places.
test("lot B2-3a : A5 — l'aire recomptée, les figures, superposer, encadrer, les pourquoi, les places", () => {
  const sortes = {};
  const erreurs = new Set();
  const quarts = {"#": 4, a: 2, b: 2, c: 2, d: 2};
  for (let g = 1; g <= 300; g += 1) {
    for (const usage of ["valide", "entraine", "retour", "test"]) {
      const s = G.serie("A5", {usage, graine: g});
      const ou = `A5 ${usage} ${g}`;
      if (usage === "valide") {
        assert.deepEqual(s.map(q => q.sorteA5), ["compter", "comparer", "compter", "compter", "meme", "compter", "comparer", "encadrer", "compter", "meme"], `${ou} : places`);
        assert.ok(s.filter(q => q.sorteA5 === "compter").every(q => q.aire.unite === (q.degre === 1 ? "carreaux" : "cm2")), `${ou} : l'unité`);
      }
      s.forEach(q => {
        sortes[q.sorteA5] = (sortes[q.sorteA5] || 0) + 1;
        const a = q.aire;
        const aire = f => f.join("").split("").reduce((t, ch) => t + (quarts[ch] || 0), 0) / 4;
        const figures = a.fig ? [a.fig] : a.a ? [a.a, a.b] : [];
        figures.forEach(f => {
          const w = Math.max(...f.map(l => l.length));
          assert.ok(w <= 7 && f.length <= 4, `${ou} : figure trop grande ${f.join("/")}`);
          assert.ok(/^[#.abcd]+$/.test(f.join("")), `${ou} : ${f.join("/")}`);
          // D'un seul tenant : deux morceaux voisins se tiennent par un côté
          // entier qu'ils ont tous les deux (un demi n'a que deux côtés).
          const COTES = {"#": "hbgd", a: "hg", b: "hd", c: "bd", d: "bg"};
          const pleins = [];
          f.forEach((l, y) => [...l].forEach((ch, x) => { if (COTES[ch]) pleins.push([x, y]); }));
          const vus = new Set([pleins[0].join()]);
          const pile = [pleins[0]];
          while (pile.length) {
            const [x, y] = pile.pop();
            const ici = COTES[f[y][x]];
            [[1, 0, "d", "g"], [-1, 0, "g", "d"], [0, 1, "b", "h"], [0, -1, "h", "b"]].forEach(([dx, dy, moi, lui]) => {
              const k = [x + dx, y + dy].join();
              const voisin = COTES[(f[y + dy] || "")[x + dx]];
              if (!vus.has(k) && voisin && ici.includes(moi) && voisin.includes(lui)) { vus.add(k); pile.push([x + dx, y + dy]); }
            });
          }
          assert.equal(vus.size, pleins.length, `${ou} : figure en morceaux ${f.join("/")}`);
          assert.equal(f.join("").replace(/[#.]/g, "").length % 2, 0, `${ou} : un nombre impair de demis ${f.join("/")}`);
        });
        if (q.sorteA5 === "compter") {
          const n = aire(a.fig);
          assert.equal(q.reponse, String(n), `${ou} : aire ${a.fig.join("/")}`);
          assert.ok(n >= 5 && n <= 30, `${ou} : ${n} carreaux`);
          assert.ok(G.verifier(q, String(n)).juste);
          if (q.degre === 1) assert.ok(!/[abcd]/.test(a.fig.join("")), `${ou} : des demis au degré 1`);
          else assert.ok(/[abcd]/.test(a.fig.join("")), `${ou} : pas de demi au degré ${q.degre}`);
          const d = q.donnees;
          [d.pleins + d.demis, d.pleins, n + 1, n - 1, d.perimetre].filter(x => x && x !== n).forEach(x => {
            const v = G.verifier(q, String(x));
            if (v.erreur) { erreurs.add(v.erreur); assert.ok(v.retour.length <= 31, `${ou} : pourquoi trop long « ${v.retour} »`); }
          });
        } else if (q.sorteA5 === "comparer" || q.sorteA5 === "meme") {
          const [x, y] = [aire(a.a), aire(a.b)];
          const attendu = q.sorteA5 === "meme" ? (x === y ? "Oui" : "Non") : x === y ? "Même aire" : x > y ? "A" : "B";
          assert.equal(q.choix[q.bon], attendu, `${ou} : ${a.a.join("/")} | ${a.b.join("/")}`);
          assert.notEqual(a.a.join("/"), a.b.join("/"), `${ou} : la même figure deux fois`);
          // Ce qui dépasse, en quarts : la différence des aires.
          assert.equal((a.depasseA - a.depasseB) / 4, x - y, `${ou} : superposer`);
          if (q.degre === 1 && x !== y) assert.ok(Math.max(x, y) >= 1.5 * Math.min(x, y), `${ou} : au degré 1, des aires bien différentes`);
          q.choix.forEach((c, k) => { if (k !== q.bon) { const r = G.verifier(q, k).retour; assert.ok(r && r.length <= 31, `${ou} : pourquoi de « ${c} » « ${r} »`); } });
        } else {
          assert.equal(q.sorteA5, "encadrer");
          assert.equal(q.degre, 3);
          const t = a.tache;
          // Recompté à part : 40 × 40 points par carreau.
          let entiers = 0; let touches = 0;
          for (let j = 0; j < t.H; j += 1) for (let i = 0; i < t.W; i += 1) {
            let dedans = 0;
            for (let u = 0; u <= 40; u += 1) for (let v = 0; v <= 40; v += 1) {
              const px = i + u / 40; const py = j + v / 40;
              if (((px - t.cx) / t.rx) ** 2 + ((py - t.cy) / t.ry) ** 2 <= 1) dedans += 1;
            }
            if (dedans === 41 * 41) entiers += 1;
            if (dedans > 0) touches += 1;
          }
          assert.deepEqual(q.reponse, [String(entiers), String(touches)], `${ou} : la tache ${q.cle}`);
          assert.ok(touches <= 30 && entiers >= 3);
          [[touches, entiers], [entiers + 1, touches], [entiers, touches - 1]].forEach(r => {
            const v = G.verifier(q, r.map(String));
            assert.ok(!v.juste && v.retour && v.retour.length <= 31, `${ou} : ${r} « ${v.retour} »`);
            erreurs.add(10 + v.erreur);
          });
        }
      });
    }
  }
  ["compter", "comparer", "meme", "encadrer"].forEach(k => assert.ok(sortes[k] > 300, `A5 : ${k} ${sortes[k]}`));
  [1, 2, 3, 4, 11, 12, 13].forEach(e => assert.ok(erreurs.has(e), `A5 : l'erreur ${e} n'est jamais déclenchée`));
});

// Lot B2-3b-1 : Q2 « Ajouter, retirer » — la réponse recalculée à part
// (Σ coefficient × mesure, ÷ le nombre de boîtes), toutes les sortes,
// l'aide qui n'écrit jamais la réponse, le schéma corrigé (la réponse à la
// place du « ? »), le dessin des questions de balance et de périmètre, les
// places de Je valide, « Est-ce vraisemblable ? », les pourquoi d'une ligne.
test("lot B2-3b-1 : Q2 — les sortes, la réponse, l'aide, la correction, les places, les pourquoi", () => {
  const sortes = {};
  const sens = {};
  const erreurs = new Set();
  const modeles = new Set();
  const echappe = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (let g = 1; g <= 300; g += 1) {
    for (const usage of ["valide", "entraine", "retour", "test", "aide"]) {
      const s = G.serie("Q2", {usage, graine: g});
      const ou = `Q2 ${usage} ${g}`;
      if (usage === "valide") {
        assert.deepEqual(s.map(q => (q.forme === "vrai-faux" ? "V" : q.sorteQ2)).map((x, i) => (i === 8 && (x === "balance" || x === "izmir") ? "balance|izmir" : x)),
          ["partie", "reunir", "partie", "V", "comparer", "perimetre", "comparer", "V", "balance|izmir", "deux"], `${ou} : places`);
        const v = s.filter(q => q.forme === "vrai-faux");
        assert.deepEqual(v.map(q => q.reponse).sort(), ["Non", "Oui"], `${ou} : un Oui et un Non`);
        // (Un même contexte une fois.)
        const ctx = s.map(q => q.modeleQ2.split("-")[0]);
        assert.equal(new Set(ctx).size, ctx.length, `${ou} : un contexte deux fois ${ctx}`);
      }
      s.forEach(q => {
        const d = q.donnees;
        sortes[d.sorte] = (sortes[d.sorte] || 0) + 1;
        if (d.sens) sens[d.sens] = (sens[d.sens] || 0) + 1;
        modeles.add(q.modeleQ2);
        // Deux unités au moins : un problème de conversions.
        assert.ok(new Set(d.termes.map(t => t[1]).concat([d.vers])).size >= 2, `${ou} : une seule unité ${q.texte}`);
        // L'unité de la réponse : la petite au degré 1, la grande au degré 3
        // (sauf l'écart, la balance, le ruban coupé deux fois).
        const unites = d.termes.map(t => t[1]);
        const petite = unites.reduce((a, u) => (versUnite(1000n, u, a) !== null && versUnite(1000n, u, a) > 1000n ? a : u));
        if (q.degre === 1 && ["reunir", "partie"].includes(d.sorte)) assert.equal(d.vers, petite, `${ou} : degré 1 dans la petite unité`);
        const r = q.repTexteQ2;
        assert.equal(r, G.mes(attendue(q)[0], d.vers), `${ou} : ${r}`);
        // L'aide n'écrit jamais la réponse (l'outil, sa phrase, l'image).
        const re = new RegExp(`(^|[^\\d, ])${echappe(r)}($|[^\\wÀ-ÿ²³])`);
        const sc = q.schema;
        const textesOutil = sc.deux ? [sc.deux.haut[1], sc.deux.bas[1], sc.deux.ecart, sc.deux.total || ""] : [sc.tout, ...sc.parts];
        [...textesOutil, q.noteOutil, ...q.image].forEach(t => assert.doesNotMatch(t, re, `${ou} : l'aide « ${t} » donne ${r}`));
        // La correction : la réponse à la place du « ? », en vert.
        const c = q.schemaCorr;
        const textesCorr = c.deux ? [c.deux.haut[1], c.deux.bas[1], c.deux.ecart, c.deux.total || ""] : [c.tout, ...c.parts];
        // (Les deux ensemble : la barre de l'autre se remplit, le total est
        // dans le calcul en vert dessous.)
        const ensemble = d.sorte === "deux" && d.termes.length === 2;
        if (!ensemble) {
          assert.ok(textesCorr.some(t => t.endsWith(r)), `${ou} : la correction n'écrit pas ${r}`);
          const verte = c.deux ? c.deux.verte : c.verte;
          assert.ok(verte !== undefined && verte !== null, `${ou} : rien en vert`);
        } else assert.ok(c.deux.haut[1] && !c.deux.total, `${ou} : la barre de l'autre`);
        assert.ok(textesCorr.every(t => !t.includes("?")), `${ou} : un « ? » dans la correction`);
        if (q.forme === "nombre") assert.ok(q.resumeVert.endsWith(r), `${ou} : le calcul ${q.resumeVert}`);
        // La balance et le rectangle : dessinés dans la question.
        if (d.sorte === "balance" || d.sorte === "perimetre") {
          assert.equal(q.morceaux.figure.type, d.sorte === "balance" ? "balance" : "rectangle", ou);
          if (d.sorte === "balance") {
            assert.ok(d.n >= 2 && d.n <= 4 && (d.n < 4 || d.termes.length === 1), `${ou} : ${d.n} boîtes`);
            const boite = lire(q.reponse);
            assert.ok(boite >= 100000n && boite <= 800000n && boite % 5000n === 0n, `${ou} : une boîte de ${q.reponse} g`);
          }
        } else assert.equal(q.morceaux.figure, undefined);
        // Le texte : deux prénoms différents ; « d'Inès », pas « de Inès ».
        assert.doesNotMatch(q.texte, /\b(de|que) [AEIOUÉ]/, `${ou} : « de » ou « que » devant une voyelle ${q.texte}`);
        // Les pourquoi : une ligne au petit téléphone.
        if (q.forme === "vrai-faux") {
          q.choix.forEach((x, k) => { if (k !== q.bon) { const v = G.verifier(q, k); assert.ok(v.retour && v.retour.length <= 31, `${ou} : ${v.retour}`); } });
          assert.ok(q.raisonQ2.includes(r), `${ou} : ${q.raisonQ2}`);
          return;
        }
        const rep = lire(q.reponse);
        const termes = d.termes.map(([m, u, k]) => [lire(m), u, k]);
        const conv = ([m, u]) => versUnite(m, u, d.vers);
        const essais = [termes.reduce((a, [m, , k]) => a + BigInt(k) * m, 0n) / BigInt(d.n), rep * 10n, rep / 10n, rep * BigInt(d.n),
          termes.reduce((a, t) => a + conv(t), 0n), termes.length >= 2 ? conv(termes[0]) - conv(termes[1]) : 0n,
          termes.length >= 2 ? conv(termes[0]) + conv(termes[1]) : 0n, conv(termes[0]) / BigInt(d.n)];
        // (Une conversion fausse d'un zéro : × 10 sur la mesure convertie.)
        termes.forEach(([, u], j) => { if (u !== d.vers) essais.push(termes.reduce((a, t, i) => a + BigInt(t[2]) * conv(t) * (i === j ? 10n : 1n), 0n) / BigInt(d.n)); });
        const autre = unites.find(u => u !== d.vers);
        if (autre) essais.push(versUnite(rep, d.vers, autre));
        essais.filter(x => typeof x === "bigint" && x > 0n && x !== rep).forEach(x => {
          const v = G.verifier(q, G.brut(x));
          if (v.erreur) { erreurs.add(`${d.sorte}:${v.erreur}`); assert.ok(v.retour.length <= 31, `${ou} : pourquoi trop long « ${v.retour} »`); ecriture(v.retour, ou); }
        });
      });
    }
  }
  ["reunir", "partie", "comparer", "perimetre", "izmir", "balance", "deux"].forEach(k => assert.ok(sortes[k] > 150, `Q2 : ${k} ${sortes[k]}`));
  ["moins", "plus", "ecart"].forEach(k => assert.ok(sens[k] > 100, `Q2 : comparer ${k} ${sens[k]}`));
  ["reunir:5", "reunir:7", "partie:7", "comparer:7", "comparer:5", "perimetre:10", "izmir:10", "balance:10", "deux:10", "partie:9"].forEach(e => assert.ok(erreurs.has(e), `Q2 : l'erreur ${e} n'est jamais déclenchée`));
  assert.ok(modeles.size >= 25, `Q2 : ${modeles.size} contextes`);
  // S002 : Izmir (3 pains de 210 g, 2 bouteilles de 1,6 kg = 3,83 kg) et
  // Alix (1,61 m, 13 cm de plus que Bruno) sont les exemples d'On te montre.
  const ex = new Set(G.clesExemples("Q2"));
  assert.equal(ex.size, 3);
  for (let g = 1; g <= 200; g += 1) G.serie("Q2", {usage: "entraine", graine: g}).forEach(q => assert.ok(!ex.has(q.cleBase), `Q2 : l'exemple ${q.cleBase} repris`));
});

// Lot B2-3b-2 : Q10 « Durées et horaires » — les sortes, les places, l'axe
// (la réponse n'y est jamais, l'heure pile), la correction par l'heure pile,
// le Car Jaune (les écarts de la ligne O2) et les marées (de 5 h 20 à 7 h),
// les pièges au choix, les pourquoi d'une ligne.
test("lot B2-3b-2 : Q10 — les sortes, les places, l'axe, la correction, le Car Jaune, les marées, les pourquoi", () => {
  const sortes = {};
  const modeles = new Set();
  const erreurs = new Set();
  const O2 = {"St‑Pierre": 0, "St‑Louis": 10, "St‑Leu": 37, "St‑Gilles": 53, "St‑Paul": 70, "Le Port": 82, "St‑Denis": 103};
  const hT = t => (t % 60 ? `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, "0")}` : `${t / 60} h`);
  for (let g = 1; g <= 300; g += 1) {
    for (const usage of ["valide", "entraine", "retour", "test", "aide", "echauffement"]) {
      const s = G.serie("Q10", {usage, graine: g});
      const ou = `Q10 ${usage} ${g}`;
      assert.ok(s.length, `${ou} : série vide`);
      if (usage === "valide") {
        assert.deepEqual(s.map(q => (q.forme === "qcm" ? "choix" : q.sorteQ10)),
          ["duree", "arrivee", "depart", "car", "depart", "maree", "duree", "deux", "choix", "arrivee"], `${ou} : places`);
        const ctx = s.map(q => q.modeleQ10);
        assert.equal(new Set(ctx).size, ctx.length, `${ou} : un contexte deux fois ${ctx}`);
      }
      s.forEach(q => {
        const d = q.donnees;
        const sorte = q.forme === "qcm" ? "choix" : d.sorte;
        sortes[sorte] = (sortes[sorte] || 0) + 1;
        modeles.add(q.modeleQ10);
        const duree = d.arrivee - d.depart;
        // On passe toujours une heure pile ; degré 1 : moins d'une heure.
        assert.ok(Math.floor(d.arrivee / 60) > Math.floor(d.depart / 60), `${ou} : pas d'heure pile entre les deux`);
        if (q.degre === 1 && !["car", "maree", "deux"].includes(d.sorte)) assert.ok(duree < 60, `${ou} : degré 1, ${duree} min`);
        // L'outil : l'axe ; la réponse n'y est jamais écrite.
        const a = q.arcs;
        const rep = q.repTexteQ10;
        assert.ok(a.piles, `${ou} : l'heure pile`);
        if (d.cherche === "duree") assert.equal(a.arcs[0].texte, "?", ou);
        else {
          const cache = d.cherche === "arrivee" ? d.arrivee : d.depart;
          assert.ok(a.instants.some(i => i.cache && i.t === cache), `${ou} : l'axe ne cache pas ${rep}`);
          assert.ok(!a.instants.some(i => !i.cache && !i.vide && hT(i.t) === rep), `${ou} : l'axe donne ${rep}`);
        }
        if (d.sorte === "deux") assert.ok(a.instants[1].vide, `${ou} : l'heure du milieu est écrite`);
        [q.noteOutil, ...q.image].forEach(t => assert.ok(!t.includes(rep), `${ou} : l'aide « ${t} » donne ${rep}`));
        // La correction : les bonds par l'heure pile (ou les deux instants
        // trouvés), en vert ; la dernière ligne finit par la réponse.
        const c = q.arcsCorr;
        if (d.sorte === "deux") assert.deepEqual(c.instants.map(i => i.t), [d.depart, d.milieu, d.arrivee], ou);
        else {
          const ts = c.instants.map(i => i.t);
          assert.equal(ts[0], d.depart); assert.equal(ts[ts.length - 1], d.arrivee);
          ts.slice(1, -1).forEach(t => assert.equal(t % 60, 0, `${ou} : un bond hors de l'heure pile`));
          assert.ok(c.arcs.every(x => x.vert), ou);
        }
        assert.ok(q.resumeVert.endsWith(rep), `${ou} : ${q.resumeVert}`);
        assert.ok(!c.instants.some(i => i.cache) && !c.arcs.some(x => x.texte === "?"), `${ou} : un « ? » dans la correction`);
        // Le Car Jaune : les écarts de la ligne O2, dans un sens ou l'autre.
        if (d.sorte === "car") {
          const ar = d.support.arrets;
          assert.equal(ar.length, 4);
          for (let k = 1; k < 4; k += 1) assert.equal(Math.abs(ar[k][1] - ar[k - 1][1]), Math.abs(O2[ar[k][0]] - O2[ar[k - 1][0]]), `${ou} : l'horaire`);
          assert.ok(ar.some(([, t]) => t === d.depart) && ar.some(([, t]) => t === d.arrivee), ou);
        }
        // Les marées : quatre, basse et haute l'une après l'autre, de 5 h 20
        // à 7 h d'écart, le même jour ; les deux de la question se suivent.
        if (d.sorte === "maree") {
          const l = d.support.liste;
          assert.equal(l.length, 4);
          for (let k = 1; k < 4; k += 1) {
            assert.notEqual(l[k][0], l[k - 1][0]);
            assert.ok(l[k][1] - l[k - 1][1] >= 320 && l[k][1] - l[k - 1][1] <= 420, `${ou} : marées ${l[k][1] - l[k - 1][1]} min`);
          }
          const k = l.findIndex(([, t]) => t === d.depart);
          assert.ok(k >= 0 && l[k + 1][1] === d.arrivee, `${ou} : deux marées qui se suivent`);
          // (Chaque marée par son rang parmi celles de sa sorte : « de la 1re
          // marée haute à la 2e basse ».)
          const rang = j => (l.slice(0, j + 1).filter(([x]) => x === l[j][0]).length === 1 ? "1re" : "2e");
          assert.ok(q.texte.includes(`De la ${rang(k)} marée ${l[k][0]} à la ${rang(k + 1)} ${l[k + 1][0]}`), `${ou} : ${q.texte}`);
        }
        if (q.forme === "qcm") {
          assert.equal(q.choix.length, 3);
          assert.equal(new Set(q.choix).size, 3, `${ou} : deux choix pareils`);
          assert.ok(q.choix.some(x => /h [6-9]\d$/.test(x)), `${ou} : le piège de la base 100 ${q.choix}`);
          q.choix.forEach((x, k) => { if (k !== q.bon) { const v = G.verifier(q, k); assert.ok(v.retour && v.retour.length <= 31, `${ou} : ${v.retour}`); } });
          return;
        }
        // Les pourquoi : les vraies erreurs (la base 100, une heure de trop,
        // l'autre sens, une seule étape), une ligne au petit téléphone.
        const cent = t => Math.floor(t / 60) * 100 + (t % 60);
        const hm = t => [String(Math.floor(t / 60)), String(t % 60)];
        const essais = [];
        if (d.cherche === "duree") {
          const c100 = cent(d.arrivee) - cent(d.depart);
          essais.push(q.forme === "nombre" ? String(c100) : [String(Math.floor(c100 / 100)), String(c100 % 100)]);
          if (q.forme !== "nombre") essais.push(hm(duree + 60), hm(duree - 60));
        } else {
          const t = d.cherche === "arrivee" ? d.arrivee : d.depart;
          essais.push(hm(t + 60), hm(t - 60));
          if (d.cherche === "arrivee") {
            const et = d.milieu ? [d.milieu - d.depart, d.arrivee - d.milieu] : [duree];
            const mm = (d.depart % 60) + et.reduce((x, e) => x + (e % 60), 0);
            const hh = Math.floor(d.depart / 60) + et.reduce((x, e) => x + Math.floor(e / 60), 0);
            essais.push([String(hh), String(mm)]);
            if (d.milieu) essais.push(hm(d.milieu)); else essais.push(hm(d.depart - duree));
          } else {
            const c = cent(d.arrivee) - (Math.floor(duree / 60) * 100 + (duree % 60));
            essais.push([String(Math.floor(c / 100)), String(c % 100)], hm(d.arrivee + duree));
          }
        }
        essais.forEach(e => {
          const v = G.verifier(q, e);
          if (v.juste) return;
          if (v.retour) { erreurs.add(v.erreur); assert.ok(v.retour.length <= 31, `${ou} : « ${v.retour} »`); }
        });
      });
    }
  }
  ["duree", "arrivee", "depart", "car", "maree", "deux", "choix"].forEach(k => assert.ok(sortes[k] > 300, `${k} : ${sortes[k]}`));
  assert.deepEqual([...erreurs].sort(), [1, 2, 3, 4, 5], "les cinq erreurs connues");
  ["vol", "piton", "cari", "car-n", "car-s", "maree", "train", "cinema", "plage", "velo"].forEach(m => assert.ok(modeles.has(m), m));
  // Les exemples de On te montre ne reviennent jamais.
  const exemples = ["Q10:ecole:duree:467--496", "Q10:velo:depart:653--730", "Q10:train:arrivee:463-557-609"];
  for (let g = 1; g <= 400; g += 1) G.serie("Q10", {usage: "entraine", graine: g}).forEach(q => assert.ok(!exemples.includes(q.cle), q.cle));
});

// ------------------------------------------------- lot B6-1 : le palier 6
test("lot B6-1 : D6 — les choix recalculés, les places, les pourquoi, les aides, les erreurs", () => {
  const sp = t => t.replace(/[  ]/g, " ");
  const places = {};
  const noter = (k, b) => { (places[k] = places[k] || new Set()).add(b); };
  const erreurs = new Set();
  const sortes = {};
  for (let g = 1; g <= 600; g += 1) {
    for (const usage of ["valide", "entraine", "test", "retour", "aide"]) {
      const s = G.serie("D6", {usage, graine: g});
      if (usage === "valide") {
        assert.deepEqual(s.slice(0, 7).map(q => q.sorteD6), ["dec", "inv", "dec", "hmin", "invhm", "choix", "comparer"], `D6 valide ${g} : places`);
        const sit = s.filter(q => q.sorteD6 === "situation" || q.sorteD6 === "secondes").map(q => q.modeleD6);
        assert.equal(new Set(sit).size, sit.length, `D6 valide ${g} : une situation deux fois`);
      }
      s.forEach(q => {
        const ou = `D6 ${usage} ${g} « ${sp(q.texte)} »`;
        const d = q.donnees;
        sortes[q.sorteD6] = (sortes[q.sorteD6] || 0) + 1;
        // L'aide (l'outil, l'image) n'écrit jamais la réponse.
        if (q.sorteD6 !== "comparer") {
          const aide = sp([...(q.image || []), q.noteOutil || "", q.relation || ""].join(" | "));
          assert.ok(!aide.includes(sp(q.reponseTexte)), `${ou} : l'aide « ${aide} » donne la réponse`);
        }
        assert.ok(q.droiteH && q.droiteH.c > 0 && q.droiteH.c < 100, `${ou} : la droite`);
        assert.ok(sp(q.ligneD6).includes(sp(q.vertD6)), `${ou} : la ligne de correction sans la réponse`);
        assert.doesNotMatch(q.texte, /\bde [AEIOUÉÈ]/, `${ou} : « de » devant une voyelle`);
        if (q.forme === "qcm") {
          assert.equal(q.choix.length, 3);
          q.choix.forEach((c, k) => { if (k !== q.bon) { assert.ok(q.pourquoi[k] && q.pourquoi[k].length <= 31, `${ou} : pourquoi « ${q.pourquoi[k]} »`); ecriture(q.pourquoi[k], ou); } });
          let bonne;
          if (q.sorteD6 === "choix") {
            const x = d.x; const md = (x % 100) * 0.6;
            bonne = `${Math.floor(x / 100)} h ${md} min`;
          } else if (q.sorteD6 === "tiers") {
            const p = (a, b) => (b ? p(b, a % b) : a); const k = p(d.m, 60);
            bonne = `${d.m / k}⁄${60 / k} h`;
          } else if (q.sorteD6 === "comparer") {
            const md = (d.x % 100) * 0.6 + Math.floor(d.x / 100) * 60;
            const [A] = [sp(G.ecrire(BigInt(d.x) * 10n)) + " h"];
            const m2 = d.m % 60; const h = Math.floor(d.m / 60);
            bonne = md === d.m ? "Même durée" : md > d.m ? A : `${h} h ${m2} min`;
          }
          assert.equal(sp(q.choix[q.bon]), bonne, `${ou} : la bonne réponse`);
          noter(q.sorteD6, q.bon);
        } else {
          // Les erreurs connues, une ligne au petit téléphone.
          const x = d.x; const h = Math.floor(x / 100); const dd = x % 100;
          const essais = [];
          if (q.forme === "deux-cases") essais.push([String(h), String(dd)], [String(h), String(dd / 10)], [String(Math.floor(x / 60)), String(x % 60)]);
          else if (d.vers === "h") essais.push(String(h + ((dd * 0.6) / 100)).replace(".", ","), String(Math.round(x * 0.6)), String(Math.round(x * 0.6) / 100).replace(".", ","));
          else essais.push(String(x), String(h * 60 + dd), String(dd / 10).replace(".", ","));
          // (Les retours de toutes les erreurs connues, milliers compris : « 10,75 h, ce n'est pas 1 075 min. »)
          essais.forEach(e => {
            const v = G.verifier(q, e);
            if (v.juste || !v.retour) return;
            assert.ok(v.retour.length <= 31, `${ou} : « ${v.retour} » trop long`);
            ecriture(v.retour, ou); milliers(v.retour, ou);
            erreurs.add(v.erreur);
          });
        }
        if (q.pourquoi) Object.values(q.pourquoi).forEach(t => milliers(t, ou));
      });
    }
  }
  ["choix", "tiers", "comparer"].forEach(k => assert.deepEqual([...places[k]].sort(), [0, 1, 2], `D6 ${k} : la bonne réponse aux places ${[...places[k]]}`));
  [1, 2, 3, 4, 5].forEach(e => assert.ok(erreurs.has(e), `D6 : l'erreur ${e} jamais déclenchée`));
  ["dec", "inv", "hmin", "total", "invhm", "invtot", "choix", "tiers", "comparer", "situation", "secondes"].forEach(k => assert.ok(sortes[k] > 300, `D6 : ${k} ${sortes[k]}`));
});

test("lot B6-1 : G1 — les vitesses recalculées, les choix, les places, les pourquoi, les aides, les erreurs", () => {
  const sp = t => t.replace(/[  ]/g, " ");
  const places = {};
  const erreurs = new Set();
  const sortes = {};
  for (let g = 1; g <= 600; g += 1) {
    for (const usage of ["valide", "entraine", "test", "retour", "aide"]) {
      const s = G.serie("G1", {usage, graine: g});
      if (usage === "valide") {
        assert.deepEqual(s.slice(0, 9).map(q => q.sorteG1), ["sens", "kmh", "ms", "kmh", "par", "etape", "comparer", "kmh", "ms"], `G1 valide ${g} : places`);
        const m = s.filter(q => q.sorteG1 === "comparer" || q.sorteG1 === "situation").map(q => q.modeleG1);
        assert.equal(new Set(m).size, m.length, `G1 valide ${g} : une situation deux fois`);
      }
      s.forEach(q => {
        const ou = `G1 ${usage} ${g} « ${sp(q.texte)} »`;
        const d = q.donnees;
        sortes[q.sorteG1] = (sortes[q.sorteG1] || 0) + 1;
        if (q.forme !== "qcm") {
          assert.doesNotMatch(q.texte, /340/, `${ou} : sans calculatrice, pas 340 m/s au pavé`);
          const aide = sp([...(q.image || []), q.noteOutil || "", q.relation || ""].join(" | "));
          assert.ok(!aide.includes(sp(q.reponseTexte)), `${ou} : l'aide « ${aide} » donne la réponse`);
          assert.ok(sp(q.ligneG1).includes(sp(q.vertG1)), `${ou} : la ligne de correction sans la réponse`);
          // Les erreurs : s'arrêter en route, multiplier au lieu de diviser.
          const s2 = BigInt(d.s2);
          [s2 * 1800000n, s2 * 30000n, s2 * 500n, s2 * 1800n, s2 * 1800n * 1000n].forEach(m => {
            const v = G.verifier(q, G.brut(m));
            if (v.juste || !v.retour) return;
            assert.ok(v.retour.length <= 31, `${ou} : « ${v.retour} » trop long`);
            ecriture(v.retour, ou);
            erreurs.add(v.erreur);
          });
          const r = G.milli(q.reponse);
          [r * 36n * 36n / 100n, r * 100n / 1296n].forEach(m => { const v = G.verifier(q, G.brut(m)); if (!v.juste && v.retour) erreurs.add(v.erreur); });
        } else {
          assert.equal(q.choix.length, 3);
          q.choix.forEach((c, k) => { if (k !== q.bon) { assert.ok(q.pourquoi[k] && q.pourquoi[k].length <= 31, `${ou} : pourquoi « ${q.pourquoi[k]} »`); ecriture(q.pourquoi[k], ou); } });
          if (q.sorteG1 === "sens") assert.equal(sp(q.choix[q.bon]), d.u === "km/h" ? `${d.v} km en 1 h` : `${d.v} m en 1 s`, ou);
          if (q.sorteG1 === "comparer") {
            const kA = BigInt(d.s2) * 1800n; const kB = G.milli(d.kmhB);
            const idx = kA === kB ? q.choix.indexOf("Même vitesse") : q.texte.indexOf(q.choix[q.bon]) >= 0 || /^(L'|Le |La )/.test(q.choix[q.bon]) ? q.bon : -1;
            assert.equal(idx, q.bon, ou);
            // Le nom du gagnant est dans l'énoncé, avec la bonne vitesse.
            if (kA !== kB) {
              const phrases = q.morceaux.enonce.split(/(?<=\.) /);
              const gagnant = q.choix[q.bon].replace(/^L'/, "").replace(/^(Le|La) /, "").toLowerCase();
              const p = phrases.find(t => t.toLowerCase().includes(gagnant));
              assert.ok(p, `${ou} : ${gagnant} absent`);
              assert.equal(/m\/s\.$/.test(sp(p)), kA > kB, `${ou} : le mauvais gagnant`);
            }
            (places.comparer = places.comparer || new Set()).add(q.bon);
          }
          if (q.sorteG1 === "sens") (places.sens = places.sens || new Set()).add(q.bon);
        }
      });
    }
  }
  ["sens", "comparer"].forEach(k => assert.deepEqual([...places[k]].sort(), [0, 1, 2], `G1 ${k} : la bonne réponse aux places ${[...places[k]]}`));
  [1, 2, 3].forEach(e => assert.ok(erreurs.has(e), `G1 : l'erreur ${e} jamais déclenchée`));
  ["sens", "kmh", "ms", "par", "etape", "situation", "comparer"].forEach(k => assert.ok(sortes[k] > 300, `G1 : ${k} ${sortes[k]}`));
});

// Lot B6-2 : P5 (de nano à giga) et P6 (en puissances de 10), recalculés à
// part ; les places de Je valide ; les pourquoi d'une ligne ; les erreurs ;
// l'aide qui ne donne pas la réponse ; le glisse-unité à 7 colonnes au plus.
test("lot B6-2 : P5 et P6 — recalculés à part, les places, les pourquoi, les aides, les erreurs", () => {
  const SUPS = {"⁻": "-", "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9"};
  const deSup = t => Number([...t].map(c => SUPS[c] ?? "").join(""));
  const SENS_GN = {giga: "un milliard", "méga": "un million", kilo: "mille", milli: "un millième", micro: "un millionième", nano: "un milliardième"};
  const PUISS = {giga: 9, "méga": 6, kilo: 3, milli: -3, micro: -6, nano: -9};
  const sansEsp = t => String(t).replace(/[   ]/g, " ");
  const vus = {P5: new Set(), P6: new Set()};
  const N = Math.min(GRAINES, 600);
  for (const code of ["P5", "P6"]) for (let g = 1; g <= N; g += 1) for (const usage of ["valide", "entraine", "test", "aide", "retour", "echauffement"]) {
    const s = G.serie(code, {usage, graine: g});
    const ou = `${code} ${usage} ${g}`;
    if (usage === "valide") {
      if (code === "P5") {
        const sortes = s.map(q => q.sorteP5);
        assert.deepEqual([sortes[0], sortes[4], sortes[6], sortes[7]], ["sens", "choix", "situation", "comparer"], `${ou} : places`);
        assert.ok(s.some(q => q.grandeur === "octet"), `${ou} : les octets`);
      } else {
        assert.deepEqual([s[2].sorteP6, s[5].sorteP6, s[6].sorteP6, s[8].sorteP6], ["prefixe", "ecriture", "grand", "comparer"], `${ou} : places`);
        const ex = s.filter(q => q.forme === "exposant").map(q => q.reponse);
        assert.ok(ex.some(r => r.startsWith("−")) && ex.some(r => !r.startsWith("−")), `${ou} : exposants des deux signes`);
      }
    }
    s.forEach(q => {
      vus[code].add(q.sorteP5 || q.sorteP6);
      const d = q.donnees;
      Object.values(q.pourquoi || {}).forEach(t => assert.ok(sansEsp(t).length <= 31, `${ou} : pourquoi trop long « ${t} »`));
      if (q.glisse) {
        const cols = q.glisse.colonnes;
        assert.ok(cols.includes(q.glisse.de) && cols.includes(q.glisse.vers) && cols.length <= 7, `${ou} : colonnes ${cols}`);
        assert.equal(q.glisse.pale, false);
      }
      if (code === "P5" && d.type === "conv" && q.forme !== "qcm") {
        const rep = sansEsp(q.reponseTexte);
        const aide = [...q.image, q.outilSansRelation ? "" : q.relation].join(" | ");
        assert.ok(!sansEsp(aide).split(/ = | \| /).includes(rep), `${ou} : l'aide « ${aide} » donne « ${rep} »`);
        assert.ok(q.reponse !== "0" && !/^0,000/.test(q.reponse), `${ou} : ${q.reponse}`);
        // Les erreurs : le sens, un zéro, deux pas.
        const v = lire(d.valeur);
        const a = lire(q.reponse);
        const bas = EXPOSANTS[d.de] > EXPOSANTS[d.vers];
        const fauxDeux = bas ? a * 1000n : (a % 1000n === 0n ? a / 1000n : null);
        if (fauxDeux) { const r = G.verifier(q, G.ecrire(fauxDeux).replace(/ /g, "")); assert.ok(!r.juste && r.retour, `${ou} : deux pas sans pourquoi`); }
        if (bas && v % 1000n === 0n && v / 1000n !== a) { const r = G.verifier(q, G.ecrire(v / 1000n).replace(/ /g, "")); assert.ok(!r.juste && r.retour, `${ou} : le sens sans pourquoi`); }
      }
      if (d.type === "pb-p5") {
        const a = lire(d.a); const b = lire(d.b);
        let rec;
        if (d.op === "div") rec = (versUnite(a, d.ua, d.ub) / b) * 1000n;
        else if (d.op === "plus") rec = versUnite(a, d.ua, d.ub) + b;
        else rec = versUnite((a / 1000n) * b, d.ub, d.uRep);
        assert.equal(lire(q.reponse), rec, `${ou} : ${q.texte}`);
        if (d.op === "div") assert.equal(versUnite(a, d.ua, d.ub) % b, 0n, `${ou} : ne tombe pas juste`);
        assert.ok(G.verifier(q, q.reponse).juste);
      }
      if (d.type === "comparer-p5") {
        const A = versUnite(lire(d.a), d.ua, d.ub); const B = lire(d.b);
        assert.notEqual(A, B);
        assert.ok(B > lire(d.a), `${ou} : le piège manque`);
        assert.ok(Number(A > B ? A - B : B - A) / Number(A > B ? B : A) >= 0.15, `${ou} : trop proches`);
        const grand = A > B ? `${G.ecrire(lire(d.a))} ${d.ua}` : `${G.ecrire(B)} ${d.ub}`;
        assert.equal(sansEsp(q.choix[q.bon]), sansEsp(grand));
      }
      if (d.type === "sens-p5") {
        if (d.par === "nom") assert.equal(q.choix[q.bon], SENS_GN[d.prefixe]); else assert.equal(q.choix[q.bon], d.prefixe);
        assert.equal(new Set(q.choix).size, 3);
      }
      if (d.type === "associer-p5") d.prefixes.forEach((p, i) => assert.equal(q.mesures[q.bonnes[i]], SENS_GN[p].replace(/^un /, ""), `${ou} : ${p}`));
      if (d.type === "exposant") {
        const e = Number(q.reponse.replace("−", "-"));
        assert.ok(G.verifier(q, q.reponse).juste && G.verifier(q, String(e)).juste, `${ou} : la bonne réponse refusée`);
        if (e) { const r = G.verifier(q, String(-e)); assert.ok(!r.juste && r.retour, `${ou} : le signe sans pourquoi`); }
        if (d.sorte === "puiss" || d.sorte === "mantisse") assert.equal(e, EXPOSANTS[d.de] - EXPOSANTS[d.vers], `${ou} : ${q.texte}`);
        if (d.sorte === "grand") {
          const [ent, dec = ""] = d.m.split(",");
          assert.equal(d.v, (ent + dec).padEnd(ent.length + e, "0"), `${ou} : ${d.v} ≠ ${d.m} × 10^${e}`);
        }
        if (d.sorte === "volume") {
          const dim = /³/.test(d.de) ? 3 : 2;
          assert.equal(e, dim * (EXPOSANTS[d.de.replace(/[²³]/, "")] - EXPOSANTS[d.vers.replace(/[²³]/, "")]), `${ou} : ${q.texte}`);
          (q.outilLignes || []).forEach(l => assert.ok(!sansEsp(l).includes(sansEsp(q.reponseTexte)), `${ou} : l'outil donne la réponse`));
        }
        assert.ok(sansEsp(q.resume).endsWith(sansEsp(q.reponseTexte)), `${ou} : le résumé`);
        assert.equal(deSup(q.vertP6.match(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/)[1]), e, `${ou} : la correction`);
      }
      if (d.type === "ecriture-p6") {
        assert.equal(d.e, EXPOSANTS[d.de] - EXPOSANTS[d.de.slice(-1) === "o" ? "o" : d.de.slice(-1) === "W" ? "W" : d.de.slice(-1)]);
        assert.equal(deSup(q.choix[q.bon].match(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/)[1]), d.e, `${ou} : le bon choix`);
        assert.equal(new Set(q.choix).size, 3);
      }
      if (d.type === "prefixe-p6") assert.equal(q.choix[q.bon], d.de);
      if (d.type === "comparer-p6" && !d.electron) {
        const va = d.na * 10 ** (EXPOSANTS[d.u] - EXPOSANTS[d.base]);
        const vb = d.nb * 10 ** d.eb;
        assert.notEqual(va, vb);
        assert.equal(q.bon, q.choix.indexOf(va > vb ? q.choix.find(c => /µ|n|m|k|M|G/.test(c[c.length - 2] || "") && !c.includes("×")) : q.choix.find(c => c.includes("×"))), `${ou} : ${q.texte}`);
        assert.ok((va > vb && d.na < d.nb) || (vb > va && d.nb < d.na), `${ou} : le piège manque`);
      }
    });
  }
  assert.deepEqual([...vus.P5].sort(), ["associer", "choix", "comparer", "conv", "pb", "rel", "sens", "situation"]);
  assert.deepEqual([...vus.P6].sort(), ["comparer", "ecriture", "grand", "mantisse", "prefixe", "puiss", "volume"]);
  // La typographie : « 3 × 10⁻⁶ L » ne se coupe pas.
  assert.equal(CARTE.typo("3 µL = 3 × 10⁻⁶ L"), "3 µL = 3 × 10⁻⁶ L");
});

// Lot B6-3 : Q9, les problèmes de vitesses, débits et masses volumiques.
// La réponse recalculée à part depuis les données (taux, quantité, unité
// cherchée) ; les fautes prévues refusées avec un pourquoi d'une ligne ; la
// ligne de correction contient la réponse ; l'aide (l'étiquette de l'outil,
// de l'image et de la correction) ne la donne pas ; toutes les sortes ; « de »
// devant une voyelle ; aucun « il » ni « elle » ; les places de Je valide.
test("lot B6-3 : Q9 — recalculé à part, les fautes, les aides, les places, l'écriture", () => {
  const sp = t => String(t).replace(/[\u00a0\u202f\u2009]/g, " ");
  const num = t => parseFloat(sp(t).replace(/ /g, "").replace(",", "."));
  const F = {s: 1, min: 60, h: 3600, mL: 1, cL: 10, L: 1000, "cm³": 1, "dm³": 1000, "m³": 1e6, g: 1, kg: 1000, t: 1e6, mm: 1, cm: 10, m: 1000, km: 1e6, pouce: 25.4, mille: 1852000, "€": 1};
  const GR = {s: "d", min: "d", h: "d", mL: "v", cL: "v", L: "v", "cm³": "v", "dm³": "v", "m³": "v", g: "m", kg: "m", t: "m", mm: "l", cm: "l", m: "l", km: "l", pouce: "l", mille: "l", "€": "p"};
  const sortes = {};
  const N = Math.min(GRAINES, 600);
  for (let g = 1; g <= N; g += 1) for (const usage of ["valide", "entraine", "test", "aide", "retour", "echauffement"]) {
    const s = G.serie("Q9", {usage, graine: g});
    const ou0 = `Q9 ${usage} ${g}`;
    assert.ok(s.length > 0, `${ou0} : série vide`);
    const modeles = s.map(q => q.modeleQ9);
    assert.equal(new Set(modeles).size, modeles.length, `${ou0} : un même modèle deux fois`);
    if (usage === "valide") assert.deepEqual(s.slice(0, 4).map(q => q.sorteQ9), ["debit", "vitesse", "mv", "duree"], `${ou0} : places`);
    s.forEach(q => {
      const ou = `${ou0} « ${sp(q.texte)} »`;
      sortes[q.sorteQ9] = (sortes[q.sorteQ9] || 0) + 1;
      const d = q.donnees;
      [q.texte, q.ligneQ9, q.relation || "", q.relationCorr || "", q.relationOutil || "", ...(q.choix || []), ...Object.values(q.pourquoi || {})].forEach(t => { ecriture(t, ou); milliers(t, ou); });
      // « Le bus d'Inès », pas « de Inès » (des prénoms tirés au hasard).
      assert.doesNotMatch(q.texte, /\b(de|que) [AEIOUYÉÈÊÂÎÔ]/, `${ou} : « de » ou « que » devant une voyelle`);
      assert.ok(q.tableauP && q.outil === "tableau-p", `${ou} : sans tableau`);
      if (d.type === "q9") {
        const [[nv, nu], [dv, du]] = d.taux;
        const [xv, xu] = d.x;
        const taux = num(nv) * F[nu] / (num(dv) * F[du]);
        const rep = GR[xu] === GR[du] ? num(xv) * F[xu] * taux / F[d.cherche] : num(xv) * F[xu] / taux / F[d.cherche];
        assert.ok(Math.abs(rep - num(q.reponse)) < 1e-9, `${ou} : ${q.reponse} au lieu de ${rep}`);
        assert.ok(G.verifier(q, q.reponse).juste, `${ou} : la bonne réponse refusée`);
        assert.ok(sp(q.ligneQ9).includes(sp(q.vertQ9)), `${ou} : la ligne sans la réponse`);
        assert.ok(sp(q.ligneQ9).endsWith(sp(q.reponseTexte)) || sp(q.ligneQ9).includes(`${sp(q.reponseTexte).replace(/ km\/h$/, " km")} en 1 h`), `${ou} : la ligne finit par « ${q.ligneQ9} »`);
        // L'aide ne donne pas la réponse.
        [q.relation, q.relationCorr, q.relationOutil].filter(Boolean).forEach(r => assert.ok(!sp(r).split(/ = | · /).includes(sp(q.reponseTexte)), `${ou} : « ${r} » donne la réponse`));
        assert.ok(!q.tableauP.lignes.flat().filter(Boolean).map(sp).includes(sp(q.reponseTexte)), `${ou} : le tableau donne la réponse`);
        // Les fautes prévues : refusées, un pourquoi d'une ligne.
        (q.fautesQ9 || []).forEach(([v, t]) => {
          const r = G.verifier(q, v);
          assert.ok(!r.juste && r.retour, `${ou} : la faute ${v} sans pourquoi`);
          assert.ok(sp(r.retour).length <= 31, `${ou} : pourquoi trop long « ${r.retour} »`);
          ecriture(r.retour, ou);
        });
        // L'étiquette de la correction et de l'outil : une seule conversion.
        [q.relationCorr, q.relationOutil].filter(Boolean).forEach(r => assert.ok(!r.includes("·") || q.relationCorr === q.relation, `${ou} : deux conversions dans « ${r} »`));
        if (q.sorteQ9 === "fois") assert.notEqual(num(q.reponse), num(sp(q.texte).match(/à (\d+) km\/h/)[1]), `${ou} : la réponse est la vitesse de l'énoncé`);
        if (q.morceaux.figure) {
          const f = q.morceaux.figure;
          assert.deepEqual(f.point, [num(dv), num(nv)], `${ou} : le point du graphique`);
          f.croix.forEach(([a, b]) => assert.ok(a <= f.xMax && b <= f.yMax, `${ou} : une croix hors du graphique`));
        }
      } else {
        assert.equal(q.forme, "qcm", ou);
        assert.equal(q.choix.length, 3, ou);
        assert.equal(new Set(q.choix).size, 3, `${ou} : deux choix pareils`);
        q.choix.forEach((c, k) => { if (k !== q.bon) assert.ok(q.pourquoi[k] && sp(q.pourquoi[k]).length <= 31, `${ou} : pourquoi « ${q.pourquoi[k]} »`); });
        if (d.type === "q9-piege") {
          assert.equal(num(q.choix[q.bon]), d.km * 60 / (d.h * 60 + d.mn), ou);
          assert.ok(q.choix.some(c => num(c) === d.km / Number(`${d.h}.${d.mn}`)), `${ou} : le piège ${d.h},${d.mn} h manque`);
          assert.ok(!sp(q.relationCorr).includes(sp(q.choix[q.bon])), ou);
        }
        if (d.type === "q9-dense" || d.type === "q9-cher") {
          const base = (m, u) => num(m) * F[u];
          const pa = base(d.a[0], d.a[1]) / base(d.a[2], d.a[3]);
          const pb = base(d.b[0], d.b[1]) / base(d.b[2], d.b[3]);
          const egal = d.type === "q9-dense" ? "Aussi dense" : "Même prix";
          const gagnant = Math.abs(pa - pb) < 1e-12 ? egal : (d.type === "q9-dense") === (pa > pb) ? 0 : 1;
          const nom = gagnant === egal ? egal : sp(q.texte).split(" : ")[gagnant === 0 ? 0 : 1].replace(/^.*\. /, "");
          assert.equal(sp(q.choix[q.bon]), nom, ou);
        }
        if (d.type === "q9-calcul") assert.ok(/[×÷]/.test(q.choix[q.bon]), ou);
      }
    });
  }
  ["debit", "duree", "cascade", "riviere", "vitesse", "vmoy", "temps", "mv", "prix", "conso", "pouce", "graphe", "piege", "fois", "dense", "cher", "calcul"]
    .forEach(k => assert.ok(sortes[k] > 100, `Q9 : ${k} ${sortes[k] || 0}`));
  // La typographie : les unités composées ne se coupent pas.
  assert.equal(CARTE.typo("8 L par minute, 50 pouces, 2 milles"), "8\u00a0L par minute, 50\u00a0pouces, 2\u00a0milles");
});

// Lot B3-1 : R7, R8, R9, les repères du CM2. Recalculé à part : la mesure
// reportée (n repères, arrondie), le calcul arrondi, l'ordre des aires en
// cm², la bonne grandeur, le périmètre ou l'aire, le plus petit objet des
// pièges ; les choix × 10 et ÷ 10 ; aucune réponse dans l'énoncé ni dans
// l'outil ; un pourquoi par mauvais choix ; les exemples de On te montre
// jamais tirés ; le résumé contient la réponse telle qu'elle est écrite.
test("lot B3-1 : R7, R8, R9 — recalculés à part, les choix, l'outil sans la réponse, les places", () => {
  const sp = t => String(t).replace(/[   ‑]/g, x => (x === "‑" ? "-" : " "));
  // Une mesure écrite (« 1 200 m », « 2,5 kg ») dans la plus petite unité de sa grandeur.
  const mes = t => {
    const m = sp(t).trim().match(/^(\d[\d ]*(?:,\d+)?) (\S+)$/);
    assert.ok(m && m[2] in EXP2, `mesure illisible : ${t}`);
    return {v: Number(m[1].replace(/ /g, "").replace(",", ".")) * 10 ** (EXP2[m[2]] + 3), g: FAMILLE_G[m[2]]};
  };
  const proche = (a, b) => Math.abs(a / b - 1) < 1e-9;
  // « 5 L » est dans « 1,5 L » sans y être écrit : la mesure entière, pas un bout.
  const contient = (t, m) => new RegExp(`(^|[^\\d, ])${sp(m).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(sp(t)) || sp(t).startsWith(sp(m))
    || new RegExp(`(^|[^\\d,]) ${sp(m).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(sp(t));
  const N = Math.min(GRAINES, 400);
  const vus = {R7: {}, R8: {}, R9: {}};
  // (La bonne réponse d'un calcul à toutes les places : elle était toujours au milieu.)
  const placesCalcul = new Set();
  const exemples = {R7: ["R7:r:0", "R7:f:0", "R7:c:212+298+496m"], R9: ["R9:pa:0", "R9:pa:1", "R9:p:0"]};
  // R9 : la grandeur et le périmètre ou l'aire, d'après les mots de la phrase.
  const grandeurDe = t => (/carreaux|surface|recouvre|place prend|couvrent|couvrir/.test(t) ? "aire" : /règle|longueur|grillage|ruban|toise|distance/.test(t) ? "longueur"
    : /pèse|balance/.test(t) ? "masse" : /verse|remplir|sirop|tient|contient/.test(t) ? "contenance" : /chronomètre|temps|dure/.test(t) ? "duree" : null);
  const NOMS_G = {longueur: "une longueur", masse: "une masse", contenance: "une contenance", duree: "une durée", aire: "une aire"};
  const perimDe = t => (/autour|le tour|entoure|bord|frise|plinthes|côtés/.test(t) ? "le périmètre" : "l'aire");
  for (let g = 1; g <= N; g += 1) for (const usage of ["valide", "entraine", "test", "aide", "retour", "echauffement"]) {
    for (const code of ["R7", "R8", "R9"]) {
      const s = G.serie(code, {usage, graine: g});
      const ou0 = `${code} ${usage} ${g}`;
      assert.ok(s.length > 0, `${ou0} : série vide`);
      (exemples[code] || []).forEach(k => assert.ok(!s.some(q => q.cle === k), `${ou0} : l'exemple ${k} tiré`));
      if (code === "R8" && usage === "valide") {
        assert.equal(s[6].forme, "ranger", `${ou0} : « Range ces aires » 7e`);
        const demandes = new Set(s.filter(q => q.repere).map(q => q.repere));
        CARTE.etape("R8").reperes.forEach(r => assert.ok(demandes.has(r), `${ou0} : le repère ${r} pas demandé`));
      }
      if (code === "R8" && usage === "entraine") assert.ok(s.filter(q => q.forme === "ranger").length >= 3, `${ou0} : ranger trois fois`);
      s.forEach(q => {
        const ou = `${ou0} « ${sp(q.texte)} »`;
        const d = q.donnees;
        vus[code][d.type + (d.sorte ? `:${d.sorte}` : "")] = (vus[code][d.type + (d.sorte ? `:${d.sorte}` : "")] || 0) + 1;
        [q.texte, q.resume, ...(q.choix || []), ...(q.correction || []), ...Object.values(q.pourquoi || {}), q.noteOutil || "", ...(q.image || [])]
          .forEach(t => { ecriture(t, ou); milliers(t, ou); });
        assert.doesNotMatch(sp(q.texte).replace(IMPERSONNEL, ""), /\b(il|elle|Il|Elle)\b/, `${ou} : « il » ou « elle »`);
        // (R8 suit le modèle des repères du CM1, R3 à R5 : sans pourquoi.)
        if (q.forme === "qcm" && code !== "R8") {
          assert.ok(sp(q.resume).includes(sp(q.reponseTexte)), `${ou} : le résumé « ${q.resume} » sans « ${q.reponseTexte} »`);
          // (Un pourquoi sur une ligne : 31 signes au plus, comme Q9.)
          q.choix.forEach((c, k) => { if (k !== q.bon) assert.ok(q.pourquoi[k] && sp(q.pourquoi[k]).length <= 31, `${ou} : le choix « ${c} », pourquoi « ${q.pourquoi[k]} »`); });
        }
        if (code === "R7") {
          assert.equal(q.forme, "qcm", ou);
          assert.equal(q.choix.length, 3, ou);
          // Les trois choix : ÷ 10, le bon, × 10.
          const t = q.choix.map(mes);
          const r = t[q.bon].v;
          assert.deepEqual(t.map(x => x.v).sort((a, b) => a - b).map(v => v / r).map(x => Math.round(x * 100) / 100), [0.1, 1, 10], `${ou} : ${q.choix}`);
          // La réponse n'est pas dans l'énoncé (ni « 25 m » ni « 25 »).
          assert.ok(!contient(q.texte, q.reponseTexte), `${ou} : la réponse dans l'énoncé`);
          // Ni dans l'outil.
          [q.noteOutil, ...(q.image || [])].forEach(x => assert.ok(!contient(x, q.reponseTexte), `${ou} : l'outil « ${x} » donne la réponse`));
          if (d.sorte === "reporte") {
            const R = q.reporte;
            const un = mes(R.mesure);
            const cr = CARTE.repere(R.repere);
            assert.ok(proche(un.v, mes(`${cr.nombre.replace(".", ",")} ${cr.unite}`).v / (R.repere === "l14" ? 10 : 1)), `${ou} : le repère ${R.mesure}`);
            const longueur = R.quarts / 4 * un.v;
            assert.ok(Math.abs(R.quarts / 4 - R.n) < 1, `${ou} : ${R.n} repères pour ${R.quarts} quarts`);
            assert.ok(r / (R.n * un.v) >= 0.8 && r / (R.n * un.v) <= 1.25 && r / longueur >= 0.8 && r / longueur <= 1.25, `${ou} : ${q.reponseTexte} pour ${R.n} × ${R.mesure}`);
            assert.notEqual(sp(R.mesure), sp(q.reponseTexte), `${ou} : le repère est la réponse`);
            assert.ok(sp(q.ligneR7).includes(`${R.n} `), `${ou} : la correction « ${q.ligneR7} »`);
          } else if (d.sorte === "fois") {
            const n = Number(sp(q.noteOutil).match(/Je compte (\d+) fois/)[1]);
            let un;
            if (q.repereCarte) { const cr = CARTE.repere(q.repereCarte); un = mes(`${cr.nombre.replace(".", ",")} ${cr.unite}`); } else un = mes("3 m");
            assert.ok(sp(q.texte).includes(`${n} `), `${ou} : ${n} fois`);
            assert.ok(r / (n * un.v) >= 0.8 && r / (n * un.v) <= 1.25, `${ou} : ${q.reponseTexte} pour ${n} fois`);
            assert.ok(sp(q.ligneR7).startsWith(`${n} × `), `${ou} : la correction « ${q.ligneR7} »`);
          } else {
            assert.equal(d.type, "estimer-calcul", ou);
            placesCalcul.add(q.bon);
            const {op, nombres, ronds, unite} = d;
            // Chaque nombre près de son arrondi (le quart du pas au plus), l'arrondi rond.
            nombres.forEach((x, k) => {
              if (op === "÷" && k === 1) return assert.equal(x, ronds[k], ou);
              const pas = op === "×" ? 10 : op === "+" && q.degre === 2 ? 1000 : 100;
              assert.equal(ronds[k] % pas, 0, `${ou} : ${ronds[k]} n'est pas rond`);
              assert.ok(Math.abs(x - ronds[k]) <= (op === "÷" ? ronds[k] / 10 : pas * 0.3), `${ou} : ${x} loin de ${ronds[k]}`);
              assert.notEqual(x % 10, 0, `${ou} : ${x} est déjà rond`);
            });
            const total = op === "+" ? ronds.reduce((a, b) => a + b, 0) : op === "−" ? ronds[0] - ronds[1] : op === "×" ? ronds[0] * ronds[1] : ronds[0] / ronds[1];
            assert.ok(Number.isInteger(total), ou);
            assert.ok(proche(r, mes(`${total} ${unite}`).v), `${ou} : ${q.reponseTexte} au lieu de ${total} ${unite}`);
            // L'arrondi ne tombe pas loin du vrai calcul (moins de la moitié).
            const vrai = op === "+" ? nombres.reduce((a, b) => a + b, 0) : op === "−" ? nombres[0] - nombres[1] : op === "×" ? nombres[0] * nombres[1] : nombres[0] / nombres[1];
            assert.ok(Math.abs(vrai / total - 1) < 0.35, `${ou} : ${vrai} et ${total}`);
            // Les arrondis ne donnent jamais le résultat.
            q.arrondis.flat().forEach(x => assert.notEqual(sp(x), sp(q.reponseTexte), `${ou} : l'arrondi « ${x} » est la réponse`));
            if (op === "÷") assert.ok(nombres[0] < 100000, `${ou} : partage à plus de 5 chiffres`);
            if (op === "×") assert.notEqual(unite, "m", `${ou} : un produit en m`);
            assert.ok(sp(q.correction.at(-1)).endsWith(sp(q.reponseTexte)), `${ou} : la correction « ${q.correction.at(-1)} »`);
          }
        }
        if (code === "R8" && q.forme === "ranger") {
          const vals = d.mesures.map(([n, u]) => mes(`${n} ${u}`).v);
          assert.equal(new Set(vals).size, 4, `${ou} : deux aires égales`);
          const ordre = [0, 1, 2, 3].sort((a, b) => vals[a] - vals[b]);
          assert.deepEqual(q.ordre, ordre, `${ou} : l'ordre`);
          assert.ok(d.mesures.some(([na, ua], i) => d.mesures.some(([nb, ub], j) => ua !== ub && Number(na) > Number(nb) && vals[i] < vals[j])), `${ou} : sans piège`);
          assert.equal(sp(q.reponseTexte), ordre.map(k => sp(q.mesures[k])).join(" < "), ou);
          assert.ok(sp(q.resume).includes(sp(q.reponseTexte)), ou);
        }
        if (code === "R9") {
          assert.equal(q.forme, "qcm", ou);
          if (d.type === "grandeur5") {
            assert.equal(q.choix.length, 4, `${ou} : 4 choix`);
            const bonne = grandeurDe(sp(q.texte));
            assert.ok(bonne, `${ou} : grandeur inconnue du test`);
            assert.equal(q.choix[q.bon], NOMS_G[bonne], ou);
            assert.ok(q.choix.includes(bonne === "aire" ? "une longueur" : "une aire"), `${ou} : sans l'aire ou la longueur`);
          } else if (d.type === "perim-aire") {
            assert.deepEqual(q.choix, ["le périmètre", "l'aire"], ou);
            assert.equal(q.choix[q.bon], perimDe(sp(q.texte)), ou);
          } else {
            assert.equal(d.type, "piege", ou);
            const m = sp(q.texte).match(/est plus (?:gros|grosse|haut|haute) qu'(?:un|une) ([^ .]+)/);
            assert.ok(m, ou);
            assert.equal(sp(q.choix[q.bon]).split(" ")[1], m[1], `${ou} : la bonne réponse n'est pas le plus petit objet`);
          }
        }
      });
    }
  }
  ["estimer:reporte", "estimer:fois", "estimer-calcul"].forEach(k => assert.ok(vus.R7[k] > 100, `R7 : ${k} ${vus.R7[k] || 0}`));
  ["ranger-aires"].forEach(k => assert.ok(vus.R8[k] > 100, `R8 : ${k} ${vus.R8[k] || 0}`));
  ["grandeur5", "perim-aire", "piege"].forEach(k => assert.ok(vus.R9[k] > 100, `R9 : ${k} ${vus.R9[k] || 0}`));
  assert.deepEqual([...placesCalcul].sort(), [0, 1, 2], "R7 : la bonne réponse d'un calcul pas à toutes les places");
  // Les cinq opérations de R7 : sommes, différences, produits, partages.
  const ops = new Set();
  for (let g = 1; g <= 300; g += 1) G.serie("R7", {usage: "valide", graine: g}).forEach(q => q.donnees.op && ops.add(q.donnees.op));
  assert.deepEqual([...ops].sort(), ["+", "×", "÷", "−"].sort());
  // Le nom de lieu ne se coupe pas : « Saint‑Paul » avec le trait d'union insécable.
  assert.ok(CARTE.etape("R7").apprends[0].question.enonce.includes("Saint‑Paul"));
});

// Lot B3-2 : C9, A1, A2. Recalculés à part : l'arrondi à l'entier (le
// milieu au-dessus), la partie entière, les rangées coloriées ; les
// millièmes seulement dans la grande unité ; A2 vers une unité plus petite,
// cm², dm², m² seulement, × 10 000 au degré 3 seulement, quatre carrés
// découpés au plus ; l'outil ne donne jamais la réponse ; un pourquoi de
// 31 signes au plus ; la bonne réponse à toutes les places ; la ligne de
// la correction en trois morceaux, la réponse au milieu.
test("lot B3-2 : C9, A1, A2 — recalculés à part, l'outil sans la réponse, les places, les pourquoi", () => {
  const sp = t => String(t).replace(/[\u00a0\u202f\u2011]/g, x => (x === "\u2011" ? "-" : " "));
  const places = {};
  const noter = (k, b) => { (places[k] = places[k] || new Set()).add(b); };
  // (Lot B3-2c : la même question, vue souvent, aussi à toutes les places —
  // « 1 m² = … cm² » au choix avait toujours sa bonne réponse en premier.)
  const parTexte = {};
  const sortes = {C9: {}, A1: {}, A2: {}};
  const reunion = new Set();
  const GRANDES = {km: "m", m: "mm", kg: "g", L: "mL", t: "kg"};
  for (let g = 1; g <= 400; g += 1) {
    for (const code of ["C9", "A1", "A2"]) {
      for (const usage of ["valide", "entraine", "test", "retour", "aide", "echauffement"]) {
        G.serie(code, {usage, graine: g}).forEach(q => {
          const ou = `${code} ${usage} ${g} « ${sp(q.texte)} »`;
          const d = q.donnees;
          const sorte = q.sorteC9 || q.sorteA1 || q.sorteA2 || d.type;
          sortes[code][sorte] = (sortes[code][sorte] || 0) + 1;
          if (/Saint|Piton|Bénare|Maïdo|letchis|cannes|case créole|varangue|giraumon|jacquier|Gillot/.test(q.texte)) reunion.add(`${code}:${q.cle}`);
          // La ligne de la correction : la réponse, en vert, au milieu.
          if (q.ligneB32) {
            assert.equal(q.ligneB32[1], q.reponseTexte, `${ou} : la réponse en vert`);
            assert.equal(q.ligneB32.join(""), q.correction[q.correction.length - 1], `${ou} : la ligne de la correction`);
          }
          // L'arrondi et la partie entière, recalculés.
          if (d.type === "arrondi" || d.type === "entiere") {
            const x = lire(d.valeur);
            const a = x / 1000n;
            const r = x % 1000n;
            assert.ok(r > 0n, `${ou} : un nombre entier`);
            const attendu = d.type === "entiere" ? a : r >= 500n ? a + 1n : a;
            assert.equal(sp(q.reponseTexte), `${attendu} ${d.unite}`, `${ou} : ${q.reponseTexte}`);
            assert.ok(sp(q.resume).endsWith(sp(q.reponseTexte)), `${ou} : le résumé`);
            assert.ok(G.verifier(q, q.forme === "qcm" ? q.bon : String(attendu)).juste, `${ou} : refusée`);
            if (d.type === "arrondi") {
              assert.equal(q.forme === "qcm", q.degre === 1, `${ou} : au choix au degré 1, tapé ensuite`);
              assert.ok(!(q.droiteC9.milieu === false), `${ou} : le milieu`);
              if (q.forme !== "qcm") {
                // Les erreurs : la troncature, le dixième, la mesure recopiée.
                const autre = attendu === a ? a + 1n : a;
                assert.ok(G.verifier(q, String(autre)).retour, `${ou} : l'autre entier sans pourquoi`);
                assert.ok(G.verifier(q, d.valeur).retour, `${ou} : la mesure recopiée sans pourquoi`);
              }
            } else {
              assert.equal(q.droiteC9.milieu, false, `${ou} : pas de milieu pour la partie entière`);
              assert.ok(G.verifier(q, String(a + 1n)).retour, `${ou} : l'arrondi sans pourquoi`);
            }
            assert.equal(q.droiteC9.a, Number(a), `${ou} : la droite`);
          }
          if (d.type === "rangees") {
            assert.equal(lire(q.reponse), BigInt(d.n * 10) * 1000n, ou);
            assert.ok(d.n >= 2 && d.n <= 9, ou);
          }
          // C9 : les millièmes dans la grande unité, un entier dans la petite.
          if (code === "C9" && (d.type === "conv" || d.type === "somme" || d.type === "deux")) {
            const [de, vers] = d.type === "conv" ? [d.de, d.vers] : d.type === "somme" ? [d.ua, d.ub] : [d.grande, d.petite];
            const grande = EXPOSANTS[de] > EXPOSANTS[vers] ? de : vers;
            const petite = grande === de ? vers : de;
            assert.equal(GRANDES[grande], petite, `${ou} : ${grande} et ${petite}`);
            if (d.type === "conv") {
              const vg = grande === de ? lire(d.valeur) : lire(q.reponse);
              const vp = grande === de ? lire(q.reponse) : lire(d.valeur);
              assert.ok(vp % 1000n === 0n && vp >= 1000n, `${ou} : la petite unité, un nombre entier`);
              assert.ok(vg > 0n && vg <= 60000n, `${ou} : trop grand`);
            }
          }
          // A1, A2 : cm², dm², m² ; A2 vers une unité plus petite ; × 10 000 au degré 3.
          if (code !== "C9" && d.type === "conv") {
            [d.de, d.vers].forEach(u => assert.ok(["cm²", "dm²", "m²"].includes(u), `${ou} : ${u}`));
            if (code === "A2") {
              assert.ok(EXPOSANTS[d.de] > EXPOSANTS[d.vers], `${ou} : vers une unité plus petite`);
              if (d.de === "m²" && d.vers === "cm²") assert.equal(q.degre, 3, `${ou} : × 10 000 au degré 3`);
              assert.notEqual(d.valeur, "1", `${ou} : une égalité de A1`);
            }
          }
          if (q.decoupeA2) {
            assert.equal(q.degre, 1, `${ou} : le découpage au degré 1`);
            const n = q.decoupeA2.n + (q.decoupeA2.d ? 1 : 0);
            assert.ok(n >= 1 && n <= 4, `${ou} : ${n} carrés`);
            assert.equal(BigInt(q.decoupeA2.n * 1000 + q.decoupeA2.d * 100), lire(d.valeur), `${ou} : le découpage`);
          }
          // L'outil et l'image ne donnent jamais la réponse.
          const rep = sp(q.reponseTexte);
          // (Lot B3-2c, relecture : la partie entière, son outil est un
          // exemple sur un autre nombre, dans une autre unité, jamais le même
          // nombre entier ; son image, la méthode seule.)
          const ex = q.exempleC9;
          if (d.type === "entiere") {
            assert.ok(ex, `${ou} : l'exemple de la partie entière`);
            assert.notEqual(ex.u, d.unite, `${ou} : l'exemple dans la même unité`);
            assert.notEqual(BigInt(ex.entier), lire(d.valeur) / 1000n, `${ou} : l'exemple a le même nombre entier`);
            assert.equal(ex.entier, ex.nombre.split(",")[0], ou);
          }
          const outilT = [q.calculA2 ? `${q.calculA2.nombre} ${q.calculA2.grande} = ${q.calculA2.nombre} × ${q.calculA2.facteur} ${q.calculA2.petite}` : "",
            ex ? `Dans ${ex.nombre} ${ex.u} : ${ex.entier} ${ex.u} entiers.` : "",
            q.carreA1 ? q.carreA1.rel : "", q.outil === "glisse-unite" && q.relation ? q.relation : "", ...(q.image || [])].map(sp).join(" | ");
          // (L'arrondi : l'outil et l'image montrent les deux entiers, c'est
          // la méthode choisie par Gwenaël, la droite de 3 m à 4 m.)
          const choixCandidats = d.type === "arrondi";
          if (!choixCandidats && d.type !== "rangees") assert.ok(!new RegExp(`(^|[^\\d,])${rep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(outilT), `${ou} : l'aide « ${outilT} » donne « ${rep} »`);
          if (q.noteOutil && !choixCandidats) assert.ok(!sp(q.noteOutil).includes(rep), `${ou} : la note donne la réponse`);
          // Au choix : tous différents, un pourquoi de 31 signes au plus.
          if (q.forme === "qcm") {
            noter(`${code} ${sorte}`, q.bon);
            const t = `${code} ${sp(q.texte)}`;
            (parTexte[t] = parTexte[t] || []).push(q.bon);
            q.choix.forEach((c, k) => {
              if (k === q.bon) return;
              const v = G.verifier(q, k);
              assert.ok(v.retour, `${ou} : « ${c} » sans pourquoi`);
              assert.ok(v.retour.length <= 31, `${ou} : pourquoi trop long « ${v.retour} »`);
            });
          }
          // Les erreurs neuves (A1, A2, l'arrondi, la partie entière) : 31 signes.
          if (q.forme !== "qcm" && (code !== "C9" || choixCandidats)) {
            const v0 = q.forme === "deux-cases" ? null : lire(q.reponse);
            [v0 * 10n, v0 / 10n, v0 * 100n, v0 + 1000n].forEach(y => {
              const r = G.verifier(q, G.ecrire(y).replace(/\u202f/g, ""));
              if (r.retour) assert.ok(r.retour.length <= 31, `${ou} : retour trop long « ${r.retour} »`);
            });
          }
          // (Lot B3-2c) La ligne de la case : plus petite dès 11 signes
          // autour de la case ; sous un énoncé, la case moins large (6 signes
          // au plus dans la réponse) et l'énoncé sur deux lignes au plus.
          const m = q.morceaux || {};
          if (m.avant !== undefined && m.avant.length + (m.apres || "").length + (m.cases || []).join("").length >= 11) assert.ok(m.long, `${ou} : ligne longue sans « long »`);
          if (m.enonce && q.forme === "nombre") {
            assert.ok(m.etroite && m.deuxLignes && m.serre, `${ou} : sous un énoncé`);
            assert.ok(sp(q.reponse).replace(/ /g, "").length <= 6, `${ou} : la réponse ne tient pas dans la case étroite`);
          }
          // (Lot B3-2c, relecture) Aucune espace normale devant « : ; ? ! »
          // dans les textes neufs affichés tels quels.
          const affiches = [q.texte, q.resume, q.noteOutil, m.phrase, m.avant, m.enonce, ...(q.correction || []), ...(q.ligneB32 || []), ...(q.image || []),
            ...Object.values(q.pourquoi || {})].filter(t => typeof t === "string");
          affiches.forEach(t => assert.doesNotMatch(t, / [:;?!]/, `${ou} : une espace normale devant la ponctuation « ${t} »`));
          // (Lot B3-2c) Au choix, avec une virgule : pas « Un zéro de trop »
          // quand c'est la virgule qui est mal placée (30,27 pour 3,027).
          if (code === "C9" && q.forme === "qcm" && d.type === "conv") {
            const bonne = lire(q.reponse);
            q.choix.forEach((c, k) => {
              if (k === q.bon) return;
              const y = lire(sp(c).replace(/ /g, ""));
              if ((y === bonne * 10n || y * 10n === bonne) && (y % 1000n || bonne % 1000n)) assert.doesNotMatch(G.verifier(q, k).retour, /zéro de/, `${ou} : « ${c} » : la virgule`);
            });
          }
          if (d.type === "arrondi" && q.forme === "qcm") assert.ok(!q.choix.map(sp).includes(sp(`${d.valeur} ${d.unite}`)), `${ou} : la mesure elle-même au choix`);
          if (q.rangeesA1) assert.equal(q.carreCorr, true, ou);
          ecriture(q.texte, ou);
        });
      }
    }
  }
  // Toutes les sortes tombent.
  ["conv", "situation", "arrondi", "entiere", "intrus", "deux-unites", "deux-cases"].forEach(k => assert.ok(sortes.C9[k] > 100, `C9 : ${k} ${sortes.C9[k] || 0}`));
  ["fait", "inverse", "rangees", "multiple", "multiple-inverse", "metre-cm"].forEach(k => assert.ok(sortes.A1[k] > 100, `A1 : ${k} ${sortes.A1[k] || 0}`));
  ["decoupe", "calcul", "situation-decoupe", "situation-calcul"].forEach(k => assert.ok(sortes.A2[k] > 100, `A2 : ${k} ${sortes.A2[k] || 0}`));
  assert.ok([...reunion].some(k => k.startsWith("C9")) && [...reunion].some(k => k.startsWith("A2")), "La Réunion");
  // La bonne réponse à toutes les places.
  Object.entries(places).filter(([, v]) => v.size).forEach(([k, v]) => assert.deepEqual([...v].sort(), k.endsWith("intrus") ? [0, 1, 2, 3] : [0, 1, 2], `${k} : la bonne réponse aux places ${[...v]}`));
  ["C9 arrondi", "C9 conv", "C9 intrus", "A1 fait", "A2 calcul"].forEach(k => assert.ok(places[k], `${k} au choix`));
  Object.entries(parTexte).filter(([, v]) => v.length >= 30).forEach(([t, v]) => assert.deepEqual([...new Set(v)].sort(), [0, 1, 2], `${t} : la bonne réponse aux places ${[...new Set(v)]}`));
  // Le milieu : au-dessus (S003 : « l'arrondi à l'entier de 3,5 est 4 »).
  const milieu = G.serie("C9", {usage: "entraine", graine: 3}).concat(...Array.from({length: 200}, (_, g) => G.serie("C9", {usage: "entraine", graine: g + 10})))
    .find(q => q.donnees.type === "arrondi" && /,5$/.test(q.donnees.valeur) && q.forme !== "qcm");
  assert.ok(milieu, "un milieu");
  assert.equal(G.verifier(milieu, String(lire(milieu.donnees.valeur) / 1000n)).retour, CARTE.typo("Au milieu : au-dessus."));
  // Les exemples de On te montre : 2,375 kg = 2 375 g ; 18 mm = 0,018 m ; 3,584 m ≈ 4 m ; 3,7 dm² = 370 cm².
  assert.deepEqual([...G.clesExemples("C9")], ["C9:2,375kg>g", "C9:18mm>m", "C9:a:3,584m"]);
  assert.deepEqual([...G.clesExemples("A2")], ["A2:3,7dm²>cm²", "A2:2,45m²>dm²", "A2:0,6dm²>cm²"]);
  assert.deepEqual(G.clesExemples("A1"), [], "A1 : les égalités sont à savoir par cœur, Je valide les demande");
  // Les noms courts (plus de 25 caractères), et pas de tableau de conversion au CM2 (S001).
  assert.equal(CARTE.etape("A1").nomCourt, "m², dm² et cm²");
  assert.equal(CARTE.etape("A2").nomCourt, "Convertir des aires");
  ["C9", "A1", "A2"].forEach(c => assert.doesNotMatch(JSON.stringify(CARTE.etape(c)), /tableau/i, `${c} : un tableau`));
});

test("lot B3-3 : D3, Q3, Q4 — recalculés à part, l'outil sans la réponse, les places, les pourquoi, l'écriture", () => {
  const sp = t => String(t).replace(/[  ‑]/g, x => (x === "‑" ? "-" : " "));
  const places = {};
  const noter = (k, b) => { (places[k] = places[k] || new Set()).add(b); };
  const parTexte = {};
  const sortes = {D3: {}, Q3: {}, Q4: {}};
  const reunion = new Set();
  for (let g = 1; g <= 400; g += 1) {
    for (const code of ["D3", "Q3", "Q4"]) {
      for (const usage of ["valide", "entraine", "test", "retour", "aide", "echauffement"]) {
        G.serie(code, {usage, graine: g}).forEach(q => {
          const ou = `${code} ${usage} ${g} « ${sp(q.texte)} »`;
          const d = q.donnees;
          const sorte = code === "D3" ? q.sorteD3 : code === "Q3" ? (q.forme === "vrai-faux" ? "vrai" : q.sorteQ3) : `${q.sorteQ4}${q.forme === "qcm" ? "-qcm" : d.k === 1 ? "-1" : d.u !== d.vers ? "-conv" : ""}`;
          sortes[code][sorte] = (sortes[code][sorte] || 0) + 1;
          if (/Saint|Piton|Maïdo|letchi|goyave|canne|varangue|pirogue|cari/.test(q.texte)) reunion.add(`${code}:${sorte}`);
          // La correction : les lignes avec les unités ; la dernière, la
          // réponse en vert au milieu (le nombre de parts : sans unité, S023).
          // (Correctif B3-3 : le triathlon complète par l'heure pile, quatre lignes courtes.)
          assert.ok(Array.isArray(q.lignesB33) && q.lignesB33.length >= 1 && q.lignesB33.length <= (q.sorteD3 === "triathlon" ? 4 : 3), `${ou} : les lignes de la correction`);
          const der = q.lignesB33[q.lignesB33.length - 1];
          assert.ok(Array.isArray(der) && der.length === 3, `${ou} : la dernière ligne en trois morceaux`);
          if (q.forme !== "vrai-faux" && q.forme !== "qcm") {
            const vert = sp(der[1]);
            const rep = sp(q.reponseTexte);
            assert.ok(vert === rep || (q.morceaux.apres && rep === `${vert} ${q.morceaux.apres}`), `${ou} : la réponse en vert « ${vert} » ≠ « ${rep} »`);
          }
          if (q.forme === "qcm") assert.ok([sp(q.choix[q.bon]), `${sp(q.choix[q.bon])} ${q.morceaux.apres || ""}`.trim()].includes(sp(der[1])), `${ou} : le vert de la correction`);
          assert.deepEqual(q.correction, q.lignesB33.map(l => (Array.isArray(l) ? l.join("") : l)), `${ou} : correction et lignes`);
          // Les unités restent écrites dans les calculs (S023 p. 5).
          q.lignesB33.slice(0, -1).forEach(l => { if (!/^Une planche/.test(l)) assert.match(sp(l), /\d (s|min|h|jours|kg|g|km|m|cm|L|cL|mL|€|t)(?![\wÀ-ÿ])/, `${ou} : une ligne sans unité « ${l} »`); });
          // L'outil, l'image et la note ne donnent jamais la réponse.
          // (L'espace fine des milliers reste : « 3 500 m » ne contient pas « 500 m ».)
          const nb = s => String(s).replace(/\u00a0/g, " ");
          const rep = nb(q.reponseTexte);
          const re = new RegExp(`(^|[^\\d,\u202f])${rep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d,])`);
          const textesOutil = [q.noteOutil, ...(q.image || []), ...(q.outilLignes || []), q.relation || "",
            ...(q.barreQ3 ? [q.barreQ3.tout, ...q.barreQ3.parts, q.barreQ3.dessous] : []), ...(q.barreQ4 ? [q.barreQ4.tout] : []),
            ...(q.axeD3 ? q.axeD3.arcs.map(a => a.texte) : []), ...(q.schemaD3 ? [q.schemaD3.tout, ...q.schemaD3.parts] : [])].filter(Boolean).map(nb).join(" | ");
          // (Les instants de l'énoncé, « 8 h 46 min 36 s », sont des données :
          // leurs secondes ne sont pas la réponse « 36 s ».)
          const sansInstants = d.type === "d3" && d.depart !== undefined && d.sorte !== "depart" ? textesOutil.replace(/\d+ h \d+ min( \d+ s)?/g, "⟂") : textesOutil;
          if (q.forme !== "vrai-faux") assert.ok(!re.test(sansInstants), `${ou} : l'aide « ${textesOutil} » donne « ${rep} »`);
          if (q.axeD3) {
            // (Ni l'heure pile grise, ni un instant de l'axe n'est la réponse.)
            q.axeD3.instants.filter(i => !i.cache).forEach(i => assert.notEqual(i.t, d.sorte === "depart" ? d.q : -1, `${ou} : l'instant cherché sur l'axe`));
            assert.ok(q.axeD3.instants.some(i => i.gris), `${ou} : la pile en gris`);
          }
          if (q.barreD3 && d.sorte === "min-s") assert.ok(q.barreD3.n <= 5, `${ou} : la barre de plus de 5 minutes`);
          // Au choix : tous différents, un pourquoi de 31 signes au plus ; la
          // bonne réponse à toutes les places.
          if (q.forme === "qcm" || q.forme === "vrai-faux") {
            noter(`${code} ${sorte}`, q.bon);
            const tx = `${code} ${sp(q.texte)}`;
            (parTexte[tx] = parTexte[tx] || []).push(q.bon);
            q.choix.forEach((c, k) => {
              if (k === q.bon) return;
              const v = G.verifier(q, k);
              assert.ok(v.retour, `${ou} : « ${c} » sans pourquoi`);
              assert.ok(v.retour.length <= 31, `${ou} : pourquoi trop long « ${v.retour} »`);
            });
          } else {
            // Les erreurs au pavé : une ligne (31 signes).
            const r = Array.isArray(q.reponse) ? q.reponse.map(x => lire(x)) : [lire(q.reponse)];
            const essais = [r.map(x => x * 10n), r.map(x => x / 10n), r.map(x => x + 1000n), r.map(x => x * 60n)];
            if (d.type === "d3" && d.unites.length > 1) essais.push(r.slice().reverse());
            essais.forEach(y => {
              const v = G.verifier(q, y.length > 1 ? y.map(x => G.ecrire(x).replace(/ /g, "")) : G.ecrire(y[0]).replace(/ /g, ""));
              if (v.retour) assert.ok(v.retour.length <= 31, `${ou} : retour trop long « ${v.retour} »`);
            });
          }
          // L'écriture : aucune espace normale devant « : ; ? ! » ; une
          // durée ne se coupe jamais ; la ligne longue plus petite ; sous un
          // énoncé, deux lignes au plus.
          const m = q.morceaux || {};
          const affiches = [q.texte, q.resume, q.noteOutil, m.phrase, m.avant, m.enonce, m.consigne, ...(q.correction || []), ...(q.image || []),
            ...(q.choix || []), ...Object.values(q.pourquoi || {}), ...q.lignesB33.flat()].filter(t => typeof t === "string");
          affiches.forEach(t => {
            assert.doesNotMatch(t, / [:;?!]/, `${ou} : une espace normale devant la ponctuation « ${t} »`);
            assert.doesNotMatch(t, /\d (h|min|s|jours)(?![\wÀ-ÿ])|\d (h|min|jours) (?=\d)/, `${ou} : une durée séparable « ${t} »`);
            assert.doesNotMatch(t, /\d\/\d|[½¼¾]/, `${ou} : une fraction sans la barre U+2044`);
            ecriture(t, ou);
          });
          if (m.avant !== undefined && m.avant.length + (m.apres || "").length + (m.cases || []).join("").length >= 11) assert.ok(m.long, `${ou} : ligne longue sans « long »`);
          if (m.enonce && (q.forme === "nombre" || q.forme === "deux-cases")) assert.ok(m.deuxLignes && m.serre, `${ou} : sous un énoncé`);
          if (m.etroite) assert.ok(String(q.reponse).length <= 6, `${ou} : la réponse ne tient pas dans la case étroite`);
          // D3 : la durée passe une pile ; lire l'heure, les aiguilles écartées.
          if (code === "D3" && d.sorte === "lire") {
            assert.ok(Math.abs(d.m - d.s) >= 4, `${ou} : la grande aiguille sur la trotteuse`);
            assert.equal(d.s % 5 === 0, q.degre === 1, `${ou} : les secondes de 5 en 5 au degré 1 seulement`);
            assert.deepEqual(q.morceaux.cases, ["h", "min", "s"]);
          }
          if (code === "D3" && d.depart !== undefined) {
            const [, mDep] = [Math.floor(d.depart / 3600), Math.floor((d.depart % 3600) / 60)];
            if (q.degre >= 2) assert.ok(mDep && Math.floor((d.arrivee % 3600) / 60), `${ou} : « 0 min » dans une heure`);
          }
          // Q3 : la valeur d'une part, 10 au plus aux degrés 1 et 2 (S003 p. 11).
          if (code === "Q3" && d.sorte === "parts") {
            const p = Number(lire(d.part) / 1000n);
            if (q.degre <= 2) assert.ok(p <= 10, `${ou} : une part de ${p}`);
            else assert.ok([20, 25, 50].includes(p), `${ou} : une part de ${p}`);
          }
          // Q4 : les dénominateurs du cours moyen ; le degré 3 convertit (ou le cocktail).
          if (code === "Q4") {
            assert.ok([2, 3, 4, 5, 6, 8, 10].includes(d.n), `${ou} : ${d.k}⁄${d.n}`);
            assert.ok(d.k >= 1 && d.k < d.n, ou);
            if (q.degre === 3 && q.forme !== "qcm" && q.sorteQ4 !== "cocktail") assert.notEqual(d.u, d.vers, `${ou} : le degré 3 sans conversion`);
            if (q.degre === 1 && q.forme !== "qcm") assert.equal(d.k, 1, `${ou} : une fraction unité au degré 1`);
            if (d.vers === "€") assert.equal(lire(q.reponse) % 1000n, 0n, `${ou} : des centimes`);
          }
        });
      }
    }
  }
  // Toutes les sortes tombent.
  ["fait", "min-s", "s-min", "situation", "jours", "lire", "duree", "depart", "triathlon", "choix"].forEach(k => assert.ok(sortes.D3[k] > 100, `D3 : ${k} ${sortes.D3[k] || 0}`));
  ["fois", "partage", "parts", "fois-plus", "planches", "deux", "vrai"].forEach(k => assert.ok(sortes.Q3[k] > 100, `Q3 : ${k} ${sortes.Q3[k] || 0}`));
  ["fraction-1", "fraction", "fraction-conv", "cocktail", "choix-qcm"].forEach(k => assert.ok(sortes.Q4[k] > 100, `Q4 : ${k} ${sortes.Q4[k] || 0}`));
  ["D3", "Q3", "Q4"].forEach(c => assert.ok([...reunion].some(k => k.startsWith(c)), `${c} : La Réunion`));
  // La bonne réponse à toutes les places (par sorte et par question vue souvent).
  Object.entries(places).forEach(([k, v]) => assert.deepEqual([...v].sort(), k.endsWith("vrai") ? [0, 1] : [0, 1, 2], `${k} : la bonne réponse aux places ${[...v]}`));
  Object.entries(parTexte).filter(([, v]) => v.length >= 30).forEach(([tx, v]) => assert.deepEqual([...new Set(v)].sort(), tx.includes("vraisemblable") ? [0, 1] : [0, 1, 2], `${tx} : la bonne réponse aux places ${[...new Set(v)]}`));
  // Les exemples de On te montre (S003) ; les noms courts ; pas de tableau de conversion.
  assert.deepEqual([...G.clesExemples("D3")], ["D3:255s>s", "D3:d:course:35920-36735"]);
  assert.deepEqual([...G.clesExemples("Q3")], ["Q3:n:ruban:1,2m/8cm", "Q3:f:goyave:6x25cL", "Q3:e:6x5m/2m"]);
  assert.deepEqual([...G.clesExemples("Q4")], ["Q4:sable:2/5:60kg>kg", "Q4:farine:3/10:500g>g", "Q4:lait:3/4:2L>cL"]);
  assert.equal(CARTE.etape("Q3").nomCourt, "Plusieurs fois, partager");
  assert.equal(CARTE.etape("Q4").nomCourt, "Une fraction d'une quantité");
  assert.equal(CARTE.etape("D3").nomCourt, "Minutes et secondes");
  ["D3", "Q3", "Q4"].forEach(c => {
    assert.doesNotMatch(JSON.stringify(CARTE.etape(c)), /tableau/i, `${c} : un tableau`);
    assert.equal(CARTE.etape(c).apprends.length, 3, `${c} : On te montre en trois temps`);
    assert.ok(CARTE.etape(c).apprends.some(a => a.aide && a.aide.touche || ["trotteuse", "axe-sec"].includes(a.aide && a.aide.type)), `${c} : un geste dans On te montre`);
  });
  // Les erreurs connues : la base 100, la trotteuse, le partage, le piège des étagères.
  const une = (code, f) => { for (let g = 1; g < 3000; g += 1) { const x = G.serie(code, {usage: "entraine", graine: g}).find(f); if (x) return x; } return null; };
  const ms = une("D3", q => q.sorteD3 === "min-s" && q.degre === 2);
  const [, m2, s2] = [0, Math.floor(ms.donnees.q / 60), ms.donnees.q % 60];
  assert.equal(G.verifier(ms, String(m2 * 100 + s2)).retour, CARTE.typo("1 min = 60 s, pas 100 s."));
  const pl = une("Q3", q => q.sorteQ3 === "planches" && q.forme === "nombre");
  const Lv = Number(lire(pl.donnees.L)) * (pl.donnees.uL === pl.donnees.ue ? 1 : 100) / 1000;
  const faux = Math.floor(pl.donnees.n * Lv / Number(lire(pl.donnees.e) / 1000n));
  assert.match(G.verifier(pl, String(faux)).retour, /^Il reste .+ par planche\.$/);
  const fr = une("Q4", q => q.forme === "nombre" && q.donnees.k > 1 && q.donnees.u === q.donnees.vers);
  const part = lire(fr.donnees.q) / BigInt(fr.donnees.n);
  assert.equal(G.verifier(fr, G.ecrire(part).replace(/ /g, "")).retour, "C'est une seule part.");
  const li = une("D3", q => q.sorteD3 === "lire");
  assert.equal(G.verifier(li, [String(li.donnees.h), String(li.donnees.s), String(li.donnees.m)]).retour, CARTE.typo("La grande : les minutes."));
});

test("lot B3-3, correctif de la relecture : les 28 défauts ne reviennent pas", () => {
  const sp = t => String(t).replace(/[\u00a0\u202f]/g, " ");
  const sec = t => { let n = 0; const re = /(\d+) (h|min|s)(?![a-zà-ÿ])/g; let m; while ((m = re.exec(sp(t)))) n += Number(m[1]) * (m[2] === "h" ? 3600 : m[2] === "min" ? 60 : 1); return n; };
  let retenues = 0;
  let departs = 0;
  for (let g = 1; g <= 400; g += 1) {
    for (const code of ["D3", "Q3", "Q4"]) {
      for (const usage of ["valide", "entraine", "test", "retour", "aide"]) {
        const serie = G.serie(code, {usage, graine: g});
        // Défaut 9 : dans Je valide, un même contexte une fois.
        if (usage === "valide") {
          const k = {D3: "modeleD3", Q3: "modeleQ3", Q4: "modeleQ4"}[code];
          const vus = serie.map(q => q[k]).filter(Boolean);
          assert.equal(new Set(vus).size, vus.length, `${code} valide ${g} : un contexte deux fois (${vus})`);
        }
        serie.forEach(q => {
          const ou = `${code} ${usage} ${g} « ${sp(q.texte)} »`;
          const d = q.donnees;
          const e = sp(q.morceaux.enonce || q.texte);
          if (code === "D3") {
            // Défaut 5 : pas de durée décimale au CM2.
            assert.doesNotMatch(sp(q.texte) + " " + (q.choix || []).map(sp).join(" "), /\d,\d+ (h|min|s)(?![a-zà-ÿ])/, `${ou} : une durée décimale`);
            // Défauts 2 et 22 : les choix ont leur unité ; un seul vaut la bonne réponse.
            if (q.forme === "qcm") {
              q.choix.forEach(c => assert.match(sp(c), /\d (h|min|s)$/, `${ou} : un choix sans unité « ${c} »`));
              q.choix.forEach((c, i) => { if (i !== q.bon) assert.notEqual(sec(c), sec(q.choix[q.bon]), `${ou} : « ${sp(c)} » vaut la bonne réponse`); });
            }
            // Défaut 21 : le marathon et le semi-marathon partent entre 7 h et 10 h.
            if (/marathon|semi/.test(q.modeleD3 || "")) assert.ok(d.depart >= 7 * 3600 && d.depart <= 10 * 3600, `${ou} : départ à ${d.depart} s`);
            // Défaut 3 : la retenue des secondes se voit dans la correction.
            if (d.cherche === "duree" && q.degre >= 2) {
              const pile = Math.ceil(d.depart / 3600) * 3600;
              const ss = ((pile - d.depart) % 60) + ((d.arrivee - pile) % 60);
              if (ss >= 60) { retenues += 1; assert.equal(sp(q.noteCorrB33), `${ss} s = 1 min ${ss - 60} s`, ou); } else assert.ok(!q.noteCorrB33, ou);
            }
            // Défaut 4 : l'heure de départ par les bonds de l'axe ; on ne retire
            // une durée que d'une durée ou d'une heure pile.
            if (d.cherche === "depart") {
              departs += 1;
              const l1 = q.lignesB33[0];
              const l2 = q.lignesB33[q.lignesB33.length - 1];
              const [a, b] = sp(l1).split(" = ")[0].split(" − ");
              assert.ok(sec(a) % 60 >= sec(b) % 60 && Math.floor(sec(a) / 60) % 60 >= Math.floor(sec(b) / 60) % 60, `${ou} : une retenue dans « ${sp(l1)} »`);
              assert.equal(sec(sp(l2[0]).split(" − ")[0]) % 3600, 0, `${ou} : « ${sp(l2[0])} » ne part pas d'une heure pile`);
            }
            if (q.sorteD3 === "triathlon") assert.ok(q.lignesB33.every(l => !/ − /.test(Array.isArray(l) ? l.join("") : l)), `${ou} : une soustraction posée`);
            // Défaut 25 : au degré 1, une minute de trop.
            if (d.cherche === "duree" && q.degre === 1) assert.match(sp(G.verifier(q, String(d.q + 60)).retour), /^Moins d'une minute : \d+ s\.$/, ou);
          }
          if (code === "Q3" || code === "Q4") {
            // Défaut 6 : un verre de jus, de 15 cL à 25 cL.
            if (/verres? de \d+ cL de jus|verres de \d+ cL\./.test(e)) { const v = Number(e.match(/verres? de (\d+) cL/)[1]); assert.ok(v >= 15 && v <= 25, `${ou} : un verre de ${v} cL`); }
            if (/Combien dans un verre/.test(e) && q.forme === "nombre") assert.ok(Number(q.reponse) >= 15 && Number(q.reponse) <= 25 && q.unite === "cL", `${ou} : un verre de ${q.reponse} ${q.unite}`);
            // Défaut 7 : une dose de sirop, quelques centilitres.
            if (/doses de (\d+) cL/.test(e)) assert.ok(Number(e.match(/doses de (\d+) cL/)[1]) <= 5, ou);
            // Défaut 8 : pas de demi-mètre, de demi-millilitre, de demi-gramme.
            const unite = q.unite;
            if (q.forme === "nombre" && ["mL", "g"].includes(unite)) assert.doesNotMatch(String(q.reponse), /,/, `${ou} : ${q.reponse} ${unite}`);
            if (q.forme === "nombre" && unite === "m" && (code === "Q4" || q.sorteQ3 === "fois-plus")) assert.doesNotMatch(String(q.reponse), /,/, `${ou} : ${q.reponse} m`);
            if (code === "Q4" && q.forme === "qcm" && ["m", "mL", "g"].includes(q.unite)) q.choix.forEach(c => assert.doesNotMatch(sp(c), /,/, `${ou} : le choix ${sp(c)}`));
            // Défaut 20 : pas de « 498 g » pour la moitié de 500 g.
            if (code === "Q4" && q.forme === "qcm") Object.values(q.pourquoi).forEach(p => assert.doesNotMatch(p, /enlève/, `${ou} : « ${p} »`));
          }
          // Défaut 11 : les retours de 31 signes au plus.
          if (code === "Q3" && q.sorteQ3 === "partage" && q.forme === "nombre") {
            const fois = G.verifier(q, G.ecrire(lire(q.reponse) * BigInt(d.n) * BigInt(d.n)).replace(/ /g, ""));
            if (fois.retour) assert.ok(fois.retour.length <= 31, `${ou} : « ${fois.retour} »`);
          }
          // Défaut 19 : l'unité dans la correction des étagères.
          if (q.sorteQ3 === "planches" && q.forme === "nombre") assert.match(sp(q.lignesB33[q.lignesB33.length - 1][2]), /^ étagères$/, ou);
        });
      }
    }
  }
  assert.ok(retenues > 200, `des retenues : ${retenues}`);
  assert.ok(departs > 200, `des heures de départ : ${departs}`);
  // Défaut 5 : « 0,5 min » n'est plus dans les exemples à connaître de D3.
  assert.doesNotMatch(JSON.stringify(CARTE.etape("D3")), /0,5/);
});
