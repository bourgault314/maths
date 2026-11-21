// Défi calcul, lot 6 « programmes » (18/11/2026) : les trois écarts du
// contrôle des 125 compétences contre les programmes
// (defi-calcul-RAPPORT-programmes.md).
//  1. Les × 9 d'un nombre de 11 à 99 et les 19 × un chiffre reviennent dans
//     « Distributivité : décomposer » (programme du CE1, du CE2) ;
//     « Distributivité : retrancher » niveau 1 prend × 9 d'un nombre à trois
//     chiffres et × 19 d'un nombre à deux chiffres.
//  2. « Fraction et quotient » : « la fraction, c'est une division »
//     (12/4 = □) remplace « la fraction cherchée » (6 × □/6 = 5), dont la
//     réponse était le nombre écrit à droite.
//  3. « ÷ 4, ÷ 8 » prend tous les ÷ 4 et ÷ 8 au quotient entier hors des
//     tables (92 ÷ 4, 232 ÷ 8), plus seulement les nombres finissant par 0 :
//     ses réponses ne finissent plus toutes par 5.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");

const espaces = t => String(t).replace(/[  ]/g, " ");
const TOUS = new Map();
function tous(cle) {
  if (TOUS.has(cle)) return TOUS.get(cle);
  const vus = new Map();
  const {niveau} = CORE.niveauDe(cle);
  for (let graine = 1; graine <= 150; graine += 1) niveau.composer(CORE.mulberry32(graine * 7919 + 3), 80, []).forEach(c => vus.set(c.cle, c));
  niveau.imposes.forEach(c => vus.set(c.cle, c));
  const liste = [...vus.values()];
  TOUS.set(cle, liste);
  return liste;
}
const textes = (...cles) => new Set(cles.flatMap(cle => tous(cle).map(c => espaces(c.texte))));
const paliers = cle => CORE.niveauDe(cle).niveau.palier;

test("lot 6 « programmes » : les × 9 et les 19 × un chiffre sont dans les bases", () => {
  const bases = textes("M8-1", "M8-2");
  ["13 × 9 = □", "9 × 13 = □", "46 × 9 = □", "9 × 46 = □", "19 × 3 = □", "7 × 19 = □", "9 × 19 = □"].forEach(t => assert.ok(bases.has(t), t));
  assert.equal(paliers("M8-1"), 1);
  assert.equal(paliers("M8-2"), 1);
  // Les quatre chiffres : 3, 6, 7, 9 (× 2, × 4, × 8, × 5 : leurs modules).
  ["M8-1", "M8-2"].forEach(cle => assert.deepEqual([...new Set(tous(cle).map(c => c.donnees.a))].sort((x, y) => x - y), [3, 6, 7, 9], cle));
  // « Retrancher » niveau 1 : × 9 d'un nombre à trois chiffres, × 19 d'un nombre à deux chiffres.
  tous("M9-1").forEach(c => assert.ok(c.donnees.m === 9 ? c.donnees.n >= 101 && c.donnees.n <= 199 : c.donnees.n >= 11 && c.donnees.n <= 25, espaces(c.texte)));
  assert.ok(tous("M9-1").some(c => c.donnees.m === 9) && tous("M9-1").some(c => c.donnees.m === 19));
  // Aucun produit en commun entre les deux modules, dans un sens ou dans l'autre.
  const produit = c => { const m = espaces(c.texte).match(/^(\d+) × (\d+) = □$/); return m ? [+m[1], +m[2]].sort((x, y) => x - y).join("×") : null; };
  const decomposer = new Set(["M8-1", "M8-2", "M8-3"].flatMap(cle => tous(cle).map(produit)));
  ["M9-1", "M9-2"].forEach(cle => tous(cle).forEach(c => assert.ok(!decomposer.has(produit(c)), espaces(c.texte))));
  // La leçon : 124 × 9.
  assert.equal(espaces(CORE.niveauDe("M9-1").niveau.apprends.calculs.montre.texte), "124 × 9 = □");
});

test("lot 6 « programmes » : « Fraction et quotient » ne se réussit plus en recopiant", () => {
  const f = tous("F11-2");
  const visible = c => (espaces(c.texte).match(/\d+/g) || []).map(Number).includes(c.reponse);
  const quotients = f.filter(c => c.forme === "quotient");
  assert.ok(quotients.length >= 15);
  quotients.forEach(c => {
    assert.match(espaces(c.texte), /^\d+\/\d+ = □$/);
    assert.ok(!visible(c), `${espaces(c.texte)} : la réponse n'est pas écrite`);
    assert.ok(Number.isInteger(c.reponse) && c.reponse >= 2 && c.reponse <= 6);
    assert.ok(![2, 4, 10].includes(c.f11.d), espaces(c.texte));
  });
  // (Lot 6 « fraction à deux cases » : la fraction cherchée revient, mais à
  // deux cases — « 6 × □/□ = 5 », réponse 5/6, jamais écrite dans le calcul.)
  assert.ok(!f.some(c => /□\/\d/.test(espaces(c.texte))), "plus de « 6 × □/6 = 5 »");
  f.filter(c => c.forme.startsWith("fraction")).forEach(c => assert.ok(espaces(c.texte).includes("□/□") && !Number.isInteger(c.reponse), espaces(c.texte)));
  // Le diagnostic : le numérateur recopié.
  const c = f.find(x => espaces(x.texte) === "15/3 = □");
  assert.ok(c);
  assert.equal(CORE.diagnostiquer(c, 15).c, 2);
  // Aucun « a/b = □ » en commun avec un autre niveau.
  const ailleurs = new Set(CORE.MODULES.filter(m => m.construit).flatMap(m => m.niveaux.map(n => `${m.id}-${n.n}`)).filter(k => k !== "F11-2").flatMap(k => tous(k).map(x => espaces(x.texte))));
  quotients.forEach(x => assert.ok(!ailleurs.has(espaces(x.texte)), espaces(x.texte)));
});

test("lot 6 « programmes » : « ÷ 4, ÷ 8 » prend aussi les nombres qui ne finissent pas par 0", () => {
  const m13 = textes("M13-1", "M13-2");
  ["140 ÷ 4 = □", "92 ÷ 4 = □", "96 ÷ 8 = □", "232 ÷ 8 = □"].forEach(t => assert.ok(m13.has(t), t));
  ["M13-1", "M13-2"].forEach(cle => {
    const finis = tous(cle).filter(c => c.reponse % 10 === 5).length;
    assert.ok(finis < tous(cle).length / 4, `${cle} : ${finis} réponses sur ${tous(cle).length} finissent par 5`);
  });
  // « Diviser en décomposant » (niveaux 2 et 3) ne prend plus ÷ 4 ni ÷ 8.
  ["M12-2", "M12-3"].forEach(cle => tous(cle).forEach(c => assert.ok(![4, 8].includes(c.donnees.d), `${cle} : ${espaces(c.texte)}`)));
  assert.equal(espaces(CORE.niveauDe("M12-2").niveau.apprends.calculs.montre.texte), "91 ÷ 7 = □");
  assert.equal(espaces(CORE.niveauDe("M12-3").niveau.apprends.calculs.montre.texte), "534 ÷ 6 = □");
});

test("lot 6 « programmes » : la page — adresse de cache du moteur, copie pour la page prof, VERSION", async () => {
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.match(page, /defi_calcul_core\.js\?v=20261121-1/);
  const coeur = await readFile(new URL("../outils/calcul_mental/defi_calcul_core.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_calcul_core.js", import.meta.url));
  assert.ok(coeur.equals(copie), "la copie de la page prof est identique, octet pour octet");
  const version = await readFile(new URL("../_serveur/public/VERSION", import.meta.url), "utf8");
  assert.match(version, /^lot defi-calcul-lot-(?:6-programmes|6-fraction-deux-cases|6-programmes-2|6-programmes-2-correctif|F4-personne-bloque|F4-correctif|C1-ordre)$|^lot plus-rapide-A$|^lot mon-espace-B1(?:-liens)?$|^lot ma-liste-B2$/m); // (lots 6 « fraction à deux cases » et « programmes 2 » : le cœur change encore ; lot F4 et son correctif : le moteur ; lot C1 : le cœur)
});
