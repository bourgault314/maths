// Défi calcul, correctif du lot 6 « programmes 2 » (20/11/2026) : la
// relecture des deux niveaux neufs par Codex
// (defi-calcul-CODEX-RAPPORT-niveaux-neufs.md), corrigée d'un coup avec les
// choix de Gwenaël — J'écris ne montre plus, dans une ligne qui attend son
// tour, un nombre que l'élève doit encore trouver (toute l'appli) ; le CE2
// va jusqu'à 1 inclus, avec les demis et les quarts ; le CM1 pose ?/8 = 7/2
// et commence à diviser et à chercher le dénominateur ; quatre textes ; le
// fil « Avec le dessin » ne recouvre plus « Calcul 3 » sur ordinateur.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const espaces = t => String(t).replace(/[  ]/g, " ");
const tous = (cle, n = 120) => {
  const vus = new Map();
  for (let g = 1; g <= n; g += 1) ["valide", "entraine"].forEach(genre => CORE.genererSerie(cle, {graine: g * 37 + 11, genre, ...(genre === "entraine" ? {total: 60} : {})}).forEach(c => vus.set(c.cle, c)));
  return [...vus.values()];
};
const textes = cle => new Set(tous(cle).map(c => espaces(c.texte)));
const lecon = cle => CORE.niveauDe(cle).niveau.apprends;
// Une ligne de J'écris telle qu'elle attend son tour : les nombres cachés en ▒.
const enAttente = (etapes, texte) => {
  const caches = CORE.cachesEcris(etapes, texte);
  return etapes.map((etape, j) => etape.texte.split(" ").map((m, i) => (caches[j].some(c => c[0] === i) ? m.replace(/\d+(?:[  ]\d{3})*(?:,\d+)?/, "▒") : m)).join(" ")).map(espaces);
};
const NIVEAUX = CORE.carte().modules.flatMap(m => (CORE.moduleDe(m.id).niveaux || []).map((n, i) => `${m.id}-${i + 1}`));

test("J'écris : une ligne qui attend son tour cache le nombre que l'élève doit encore trouver plus haut", () => {
  const vu = cle => enAttente(lecon(cle).ecris.etapes, lecon(cle).calculs.ecris.texte);
  assert.deepEqual(vu("A1-2"), ["7 + 3 = □", "▒ + 2 = □", "7 + 5 = □"]);
  assert.deepEqual(vu("A11-1"), ["6 − 3 = □", "486 − 3 = □"], "le 3 de 486 − 3 est donné");
  assert.deepEqual(vu("F8-2"), ["1 = □/12", "▒/12 − 5/12 = □/12"], "le numérateur seul");
  assert.deepEqual(vu("F9-1"), ["1/4 = □/12", "▒/12 + 5/12 = □/12"]);
  assert.deepEqual(vu("C1-2"), ["5 + 3 = □", "10 − 4 = □", "▒ × ▒ = □"]);
  assert.deepEqual(vu("M13-2"), ["280 ÷ 2 = □", "▒ ÷ 2 = □", "▒ ÷ 2 = □"]);
  assert.deepEqual(vu("F6-2"), ["5 × □ = 15", "3 × ▒ = □", "3/5 = □/15"], "le 3 du numérateur est donné, le facteur non");
  assert.deepEqual(vu("F2-1"), ["1/2 = □/4", "▒/4 + 2/4 = □/4", "1/2 + 2/4 = □"]);
  assert.deepEqual(vu("D8-1"), lecon("D8-1").ecris.etapes.map(e => espaces(e.texte)), "les morceaux se calculent chacun de leur côté");
  // Partout (leçons et J'écris tirés) : un nombre caché vaut toujours la
  // réponse de la ligne d'où il vient, qui est plus haut.
  let caches = 0;
  NIVEAUX.forEach(cle => {
    const a = lecon(cle);
    if (!a || !a.ecris || !a.ecris.etapes) return;
    const cas = [[a.calculs.ecris.texte, a.ecris]];
    for (let g = 1; g <= 8; g += 1) { const t = CORE.ecrisTire(cle, {graine: g * 131 + 3}); if (t) cas.push([t.calcul.texte, t.ecris]); }
    cas.forEach(([texte, ecris]) => CORE.cachesEcris(ecris.etapes, texte).forEach((ligne, j) => ligne.forEach(([i, , k]) => {
      caches += 1;
      const morceaux = ecris.etapes[j].texte.split(" ");
      assert.ok(k < j, `${cle} : ${texte}`);
      // (Un diviseur ne se devine jamais ; une recette peut le cacher
      // elle-même : « 10 ÷ 5 » sous « 25 ÷ □ = 5 ».)
      if (!ecris.etapes[j].caches) assert.notEqual(morceaux[i - 1], "÷", `${cle} : ${texte}`);
      const nombre = espaces(morceaux[i]).match(/\d+(?: \d{3})*(?:,\d+)?/)[0];
      assert.equal(nombre, espaces(CORE.reponseEcrite(ecris.etapes[k])), `${cle} : ${texte} (ligne ${j + 1})`);
    })));
  });
  assert.ok(caches > 300, `${caches} nombres cachés`);
});

test("J'écris des fractions égales : la consigne écrit « × ? » tant que le facteur n'est pas trouvé", () => {
  ["F6-1", "F6-2", "F6-3", "F6-4"].forEach(cle => {
    const e = lecon(cle).ecris;
    assert.match(espaces(e.consignes[0]), /\(\d+ [×÷] \?\)\/\(\d+ [×÷] \?\)$/, cle);
    assert.equal(espaces(e.consignes[1]), espaces(e.consigne), cle);
  });
  assert.equal(espaces(lecon("F6-2").ecris.consignes[0]), "3/5 = (3 × ?)/(5 × ?)");
  const t = CORE.ecrisTire("F6-3", {graine: 7});
  assert.match(espaces(t.ecris.consignes[0]), /÷ \?\)$/);
  assert.equal(espaces(lecon("F2-1").ecris.consignes[0]), "1/2 + 2/4 = ?/4 + 2/4");
  // La page : la consigne change avec les lignes faites, les nombres cachés
  // deviennent des cases grises.
  const page = lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /const caches = revelees \? \[\] : CORE\.cachesEcris\(etapes, texteCalcul\);/);
  assert.match(page, /return morceau\.replace\(\/\\d\+\(\?:\[\\u00a0\\u202f\]\\d\{3\}\)\*\(\?:,\\d\+\)\?\/, CORE\.CASE\);/);
  assert.match(page, /if \(consigne && state\.serie\.apprends\.ecris\.consignes\) AIDES\.ecrireTexte\(consigne, consigneEcris\(faites\)\);/);
  assert.match(page, /state\.serie\.ecrisTexte = tire \? tire\.calcul\.texte : "";/);
});

test("Dénominateurs multiples, CE2 : jusqu'à 1 inclus, et les demis et les quarts", () => {
  const t = textes("F9-1", 300);
  ["1/3 + 4/6 = □/6", "4/6 + 1/3 = □/6", "6/6 − 1/3 = □/6", "12/12 − 1/6 = □/12", "1/2 + 1/4 = □/4", "1/4 + 1/2 = □/4", "1/2 − 1/4 = □/4", "3/4 − 1/2 = □/4"].forEach(x => assert.ok(t.has(x), x));
  const un = tous("F9-1", 300).find(c => espaces(c.texte) === "1/3 + 4/6 = □/6");
  assert.equal(un.reponse, 6);
  assert.equal(CORE.aideDe(un).outil, "barre-droite");
  // La correction compare d'abord les parts, en mots.
  const i = lecon("F9-1");
  const impose = CORE.niveauDe("F9-1").niveau.imposes.find(c => espaces(c.texte) === "2/5 + 3/10 = □/10");
  assert.equal(espaces(CORE.diagnostiquer(impose, 5).texte), "5 : un cinquième vaut deux dixièmes. Donc deux cinquièmes valent quatre dixièmes.");
  assert.equal(espaces(CORE.diagnostiquer(un, 5).texte), "5 : un tiers vaut deux sixièmes.");
  // Au CM1, la phrase d'avant.
  const cm1 = tous("F9-2").find(c => c.donnees.bruts > 0 && CORE.diagnostiquer(c, c.donnees.bruts));
  assert.match(espaces(CORE.diagnostiquer(cm1, cm1.donnees.bruts).texte), /ne sont pas des parts de même taille/);
  // À retenir : la phrase sous les calculs.
  assert.equal(espaces(i.bilan), "1/3 = 2/6. 1/3 + 1/6 = 2/6 + 1/6 = 3/6. Quand les parts ont la même taille, je peux les ajouter ou les enlever.");
  assert.match(lire("../outils/calcul_mental/defi_calcul_modules.html"), /\.map\(\(texte, i, toutes\) => AIDES\.bilanEnDeux\(texte\) \|\| \(i > 0 && i === toutes\.length - 1 && !texte\.includes\("="\) \? \{phrase: texte, calcul: ""\} : null\)\);/);
});

test("Fractions égales, CM1 : ?/8 = 7/2 (Éduscol), la case de chaque côté, 14/8 = ?/4, et diviser dès 6/8 = ?/4", () => {
  const t = textes("F6-2", 300);
  ["□/8 = 7/2", "14/8 = □/4", "6/8 = □/4", "3/4 = 6/□", "6/8 = 3/□", "12/18 = □/3"].forEach(x => assert.ok(t.has(x), x));
  const n = CORE.niveauDe("F6-2").niveau;
  assert.deepEqual(n.imposes.map(c => espaces(c.texte)), ["7/4 = □/8", "6/8 = □/4", "□/8 = 7/2"]);
  assert.equal(espaces(n.titre), "dénominateurs jusqu’à 20");
  assert.equal(espaces(n.apprends.bilan), "4/3 = 8/6 (× 2 en haut et en bas). Pour revenir de 8/6 à 4/3, je divise 8 et 6 par 2.");
  // ?/8 = 7/2 : le schéma garde la grande fraction à gauche, la flèche va
  // de 7/2 vers ?/8.
  const sept = n.imposes[2];
  assert.equal(sept.reponse, 28);
  const s = CORE.aideDe(sept);
  assert.deepEqual([s.gauche, s.droite, s.op, s.cache, s.envers], [[28, 8], [7, 2], "×", "gn", true]);
  const svg = espaces(AIDES.foisFraction(Object.assign({}, s, {haut: true})));
  assert.match(svg, /<path d="M 214 /, "la flèche part de la droite");
  assert.doesNotMatch(svg, />28</, "la réponse n'est pas écrite");
  assert.match(espaces(AIDES.foisFraction({op: "×", k: 4, gauche: [3, 5], droite: [12, 20], cache: "dn", montre: false, haut: true, bas: true})), /<path d="M 86 /);
  // Le CM2 : au-delà de 20 parts, sans annonce (tout y est au-delà).
  ["F6-3", "F6-4"].forEach(cle => tous(cle).forEach(c => {
    assert.ok(c.donnees.k * c.donnees.d > 20, `${cle} : ${espaces(c.texte)}`);
    assert.equal(CORE.nouveauteDe(c, cle), null, `${cle} : ${espaces(c.texte)}`);
  }));
  assert.deepEqual(CORE.niveauDe("F6-3").niveau.imposes.map(c => espaces(c.texte)), ["16/24 = □/3", "20/25 = 4/□"]);
  assert.deepEqual(CORE.niveauDe("F6-4").niveau.imposes.map(c => espaces(c.texte)), ["2/3 = 16/□", "3/□ = 9/24"]);
  assert.equal(espaces(lecon("F6-3").bilan), "18/24 = 3/4 (÷ 6 en haut et en bas).");
  assert.equal(espaces(lecon("F6-4").bilan), "2/3 = 14/21 (× 7 en haut et en bas).");
});

test("ordinateur : « Avec le dessin » prend sa place dans la ligne, après « Calcul 3 »", () => {
  const css = lire("../outils/calcul_mental/defi_calcul.css");
  assert.match(css, /#play \.status \.seance-fil \{ position: static; min-height: 0; margin: 0; \}/);
  assert.doesNotMatch(css, /#play \.status \.seance-fil \{ position: absolute; top: 0; left: 150px;/);
  const page = lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul\.css\?v=20261121-1/);
  assert.match(page, /defi_calcul_aides\.js\?v=20261120-1/);
  assert.match(page, /defi_calcul_core\.js\?v=20261121-1/);
  assert.ok(lire("../_serveur/public/prof/defi_calcul_core.js") === lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie du noyau, octet pour octet");
});
