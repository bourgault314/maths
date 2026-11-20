// Défi calcul, lot 7b « Les décimaux (2) » (15/11/2026) : D8 « Doubles et
// moitiés de décimaux », D9 « Décimal × 5, × 50 », M13 « ÷ 4, ÷ 8 : la
// moitié de la moitié » — 8 compétences du CM2. Choix de Gwenaël du 15/11
// (questions à choix, planches du lot) : deux morceaux (la partie entière,
// la partie décimale) pour le double comme pour la moitié ; 8,10 écrit avec
// son zéro ; la barre coupée en deux, puis encore en deux ; la dernière
// moitié d'un impair au-delà de 15, découpée dans J'écris.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFile} from "node:fs/promises";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

const espaces = t => String(t).replace(/[  ]/g, " ");
const NIVEAUX = ["D8-1", "D8-2", "D8-3", "D9-1", "D9-2", "M13-1", "M13-2", "M13-3"];
// Tous les calculs d'un niveau, lus sur de grands tirages.
function tous(cle) {
  const vus = new Map();
  for (let graine = 1; graine <= 60; graine += 1) CORE.genererSerie(cle, {graine, total: 60, ordonne: false}).forEach(c => vus.set(c.cle, c));
  return [...vus.values()];
}
const textesSvg = svg => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => espaces(m[1]));

test("lot 7b : 8 compétences construites, au palier 3 ; le palier 3 en a 33, la carte 111 (lot 7c : 37 et 117)", () => {
  NIVEAUX.forEach(cle => {
    const t = CORE.niveauDe(cle);
    assert.ok(t && t.module.construit, cle);
    assert.equal(t.niveau.palier, 3, cle);
    assert.ok(t.niveau.apprends, `${cle} : sa leçon`);
  });
  const carte = CORE.carte();
  const construits = P.parcoursConstruit(carte);
  assert.equal(construits.length, 127); // (lot 6 « programmes 2 » : F9-1, F6-2 ; lot 7c : F4, F9, F11 ; lot 7d : M11, A9, C4, M9)
  assert.equal(construits.filter(c => P.palierDe(carte, c.module, c.niveau) === 3).length, 40); // (lot 7c : F4-1, F4-2, F9-2, F11-1 ; F9-1 au CM1, F11-2 en 6e ; lot 7d : A9-1, C4-1, C4-2 ; M11 au CM1)
  assert.equal(CORE.moduleDe("D8").niveaux[0].type, "F", "la moitié des impairs jusqu'à 15 : un fait à savoir");
});

test("lot 7b : les bornes du rapport de Codex", () => {
  const chiffres = x => CORE.formaterNombre(x).replace(/\D/g, "");
  // D8-1 : la moitié des impairs de 1 à 15.
  tous("D8-1").forEach(c => assert.ok(c.donnees.n % 2 === 1 && c.donnees.n <= 15, c.texte));
  assert.equal(new Set(tous("D8-1").map(c => c.donnees.n)).size, 8);
  // D8-2 : un chiffre après la virgule ; la moitié reste aux dixièmes (jamais 8,1 ÷ 2).
  tous("D8-2").forEach(c => {
    assert.equal(CORE.decimalesDe(c.donnees.n), 1, c.texte);
    if (["moitie", "division"].includes(c.forme)) assert.equal(CORE.decimalesDe(c.reponse), 1, `${c.texte} : la moitié reste aux dixièmes`);
  });
  assert.ok(!tous("D8-2").some(c => espaces(c.texte) === "8,1 ÷ 2 = □" || espaces(c.texte) === "moitié de 8,1 = □"));
  // D8-3 : les centièmes ; 8,10 écrit avec son zéro, sa moitié 4,05.
  tous("D8-3").forEach(c => {
    const ecrit = espaces(c.texte).match(/\d+,\d+/)[0];
    assert.equal(ecrit.split(",")[1].length, 2, `${c.texte} : deux chiffres après la virgule`);
    assert.ok(CORE.decimalesDe(c.reponse) <= 2, c.texte);
  });
  const huitDix = tous("D8-3").find(c => espaces(c.texte) === "moitié de 8,10 = □");
  assert.ok(huitDix, "moitié de 8,10 (évaluation de 6e, Q13)");
  assert.equal(huitDix.reponse, 4.05);
  // D9-1 : × 5, au plus trois chiffres, jamais un entier. (Lot 6
  // « programmes 2 » : sans condition sur le chiffre de droite, 1,47 × 5 ;
  // et entre 0 et 1, 0,7 × 5.)
  tous("D9-1").forEach(c => {
    const n = c.donnees.n;
    assert.ok(!Number.isInteger(n) && chiffres(n).length <= 3 && c.donnees.fois === 5, c.texte);
  });
  assert.ok(tous("D9-1").some(c => CORE.decimalesDe(c.donnees.n) === 2 && Number(chiffres(c.donnees.n).slice(-1)) % 2), "1,47 × 5");
  assert.ok(tous("D9-1").some(c => c.donnees.n < 1) && tous("D9-2").some(c => c.donnees.n < 1), "0,7 × 5 ; 0,48 × 50");
  // D9-2 : × 50, moins de 20, au plus trois chiffres, le chiffre le plus à droite pair.
  tous("D9-2").forEach(c => {
    const n = c.donnees.n;
    assert.ok(!Number.isInteger(n) && n < 20 && chiffres(n).length <= 3 && Number(chiffres(n).slice(-1)) % 2 === 0 && c.donnees.fois === 50, c.texte);
  });
  // M13-3 : un quotient décimal, un chiffre après la virgule.
  tous("M13-3").forEach(c => assert.ok(!Number.isInteger(c.reponse) && CORE.decimalesDe(c.reponse) === 1, c.texte));
  assert.ok(tous("M13-3").some(c => c.donnees.d === 4) && tous("M13-3").some(c => c.donnees.d === 8));
});

test("lot 7b : une échelle par module — aucun calcul commun entre deux niveaux, ni avec un voisin", () => {
  const ecrit = c => espaces(c.texte);
  const voisins = ["M1-1", "M1-2", "M1-3", "M6-1", "M6-2", "M7-1", "M7-2", "M7-3", "M12-1", "M12-2", "M12-3", "D2-1", "D2-2", "D2-3", "D2-4", "D3-1", "D3-2", "D3-3",
    "D5-1", "D5-2", "D6-1", "D6-2", "D6-3", "D7-1", "D7-2", "D7-3"];
  const textes = new Map();
  [...NIVEAUX, ...voisins].forEach(cle => tous(cle).forEach(c => {
    const deja = textes.get(ecrit(c));
    assert.ok(!deja || deja === cle, `${ecrit(c)} : dans ${deja} et ${cle}`);
    textes.set(ecrit(c), cle);
  }));
  // Ni les calculs des leçons dans un autre niveau.
  NIVEAUX.forEach(cle => {
    const lecon = CORE.niveauDe(cle).niveau.apprends;
    [lecon.calculs.montre, lecon.calculs.ecris].forEach(c => {
      const ailleurs = textes.get(ecrit(c));
      assert.ok(!ailleurs || ailleurs === cle, `${cle} : la leçon ${ecrit(c)} est un calcul de ${ailleurs}`);
    });
  });
});

test("lot 7b (règle revue au lot 6 « programmes ») : la règle commune de M12 et M13 — ÷ 4, ÷ 8 au quotient entier qui ne finit pas par 0 : la moitié de la moitié", () => {
  // (Lot 6 « programmes », 18/11 : plus de condition « le nombre finit par
  // 0 » — toutes les réponses de M13-1 et M13-2 finissaient par 5.)
  // (Lot 6 « programmes 2 » : et les quotients ronds qui ne sont pas
  // « table × 10 » ni « table × 100 » — 440 ÷ 4 = 110, 880 ÷ 8.)
  const table = q => [10, 100].some(u => q % u === 0 && q / u >= 2 && q / u <= 9);
  const prend = (n, d) => (d === 4 || d === 8) && n % d === 0 && n / d > 10 && !table(n / d);
  ["M12-1", "M12-2", "M12-3"].forEach(cle => tous(cle).forEach(c => assert.ok(!prend(c.donnees.n, c.donnees.d), `${cle} : ${espaces(c.texte)} est à M13`)));
  ["M13-1", "M13-2"].forEach(cle => tous(cle).forEach(c => assert.ok(prend(c.donnees.n, c.donnees.d), `${cle} : ${espaces(c.texte)}`)));
  // Les exemples de M12 y restent ; l'exemple officiel 140 ÷ 4 est la leçon de M13.
  const m12 = new Set(["M12-2"].flatMap(cle => tous(cle).map(c => espaces(c.texte))));
  ["91 ÷ 7 = □", "84 ÷ 6 = □"].forEach(t => assert.ok(m12.has(t) || espaces(CORE.niveauDe("M12-2").niveau.apprends.calculs.montre.texte) === t || CORE.niveauDe("M12-2").niveau.imposes.some(c => espaces(c.texte) === t), t));
  assert.equal(espaces(CORE.niveauDe("M13-1").niveau.apprends.calculs.montre.texte), "140 ÷ 4 = □");
  assert.ok(!m12.has("140 ÷ 4 = □"));
  // Les réponses de ÷ 4 et ÷ 8 ne finissent plus toutes par 5 ; 96 ÷ 8 et
  // 92 ÷ 4 sont à M13.
  ["M13-1", "M13-2"].forEach(cle => assert.ok(tous(cle).some(c => c.reponse % 10 !== 5), cle));
  const m13 = new Set(["M13-1", "M13-2"].flatMap(cle => tous(cle).map(c => espaces(c.texte))));
  ["96 ÷ 8 = □", "92 ÷ 4 = □", "232 ÷ 8 = □", "440 ÷ 4 = □", "880 ÷ 8 = □", "992 ÷ 4 = □", "996 ÷ 4 = □", "4 × □ = 992", "4 × □ = 996"].forEach(t => assert.ok(m13.has(t), t));
  ["M12-2", "M12-3"].forEach(cle => tous(cle).forEach(c => assert.ok(![4, 8].includes(c.donnees.d) || c.reponse % 10 === 0 || c.reponse <= 10, `${cle} : ${espaces(c.texte)}`)));
  assert.equal(espaces(CORE.niveauDe("M13-3").niveau.apprends.calculs.montre.texte), "260 ÷ 8 = □");
});

test("lot 7b : D8, le double et la moitié suivent le même chemin — deux morceaux, la partie entière et la partie décimale", () => {
  const moitie = CORE.genererSerie("D8-2", {graine: 3, total: 40}).find(c => c.forme === "moitie");
  const ecris = CORE.ecrisDuCalcul("D8-2", moitie);
  const {e, dec} = moitie.donnees;
  assert.equal(espaces(ecris.consigne), espaces(`moitié de ${CORE.formaterNombre(moitie.donnees.n)} = ${e} ÷ 2 + ${CORE.formaterNombre(dec)} ÷ 2`));
  assert.deepEqual(ecris.etapes.map(x => x.reponse), [e / 2, CORE.exact(dec / 2), moitie.reponse]);
  const double = CORE.niveauDe("D8-2").niveau.apprends.ecris;
  assert.equal(espaces(double.consigne), "double de 7,8 = 2 × 7 + 2 × 0,8");
  // 8,10 : la partie décimale s'écrit aussi avec son zéro, partout.
  const huit = tous("D8-3").find(c => espaces(c.texte) === "moitié de 8,10 = □");
  const e810 = CORE.ecrisDuCalcul("D8-3", huit);
  assert.equal(espaces(e810.consigne), "moitié de 8,10 = 8 ÷ 2 + 0,10 ÷ 2");
  assert.deepEqual(textesSvg(AIDES.dessinerImage(CORE.aideDe(huit))).filter(t => t.includes(",")), ["8,10", "0,10"]);
  // La moitié est annoncée, avec son dessin : chaque morceau déjà coupé en deux.
  const annonce = CORE.nouveauteDe(moitie);
  assert.equal(espaces(annonce.texte), "Nouveau : la moitié, je coupe aussi les deux morceaux.");
  const dessin = CORE.aideDe(moitie, {nouveau: true});
  assert.deepEqual([...dessin.trouves], [0, 1]);
  assert.equal(dessin.fini, false);
  assert.ok(!textesSvg(AIDES.dessinerImage(dessin)).includes(espaces(CORE.formaterNombre(moitie.reponse))), "le dessin d'annonce ne dit pas la réponse");
  assert.match(espaces(CORE.nouveauteDe(huit).texte), /^Nouveau : 0,10, c’est 10 centièmes : leur moitié, c’est 5 centièmes\.$/);
  // La carte du niveau 1 : sous chaque nombre, sa moitié.
  const carte = CORE.carteParCoeur("D8-1");
  assert.deepEqual(carte.blocs.flatMap(b => b.table[0]), [1, 3, 5, 7, 9, 11, 13, 15]);
  carte.blocs.forEach(b => assert.deepEqual(b.table[1], b.table[0].map(n => n / 2)));
});

test("lot 7b : D9, × 50 c'est × 100 puis la moitié (la v2 disait × 10) ; J'écris, la moitié sur le résultat d'avant", () => {
  tous("D9-2").forEach(c => {
    assert.equal(CORE.imageDe(c).p, 100, c.texte);
    assert.equal(CORE.manipulationDe(c).decalage, 2, c.texte);
  });
  tous("D9-1").forEach(c => assert.equal(CORE.imageDe(c).p, 10, c.texte));
  const e = CORE.niveauDe("D9-2").niveau.apprends.ecris;
  assert.equal(espaces(e.consigne), "50 × 3,8 = 3,8 × 100 ÷ 2");
  assert.deepEqual(e.etapes.map(x => [espaces(x.texte), x.reponse]), [["3,8 × 100 = □", 380], ["380 ÷ 2 = □", 190]]);
  const e1 = CORE.niveauDe("D9-1").niveau.apprends.ecris;
  assert.deepEqual(e1.etapes.map(x => [espaces(x.texte), x.reponse]), [["2,48 × 10 = □", 24.8], ["24,8 ÷ 2 = □", 12.4]]);
  assert.match(espaces(CORE.niveauDe("D9-2").niveau.apprends.bilan), /^× 50, c’est × 100 puis la moitié/);
});

test("lot 7b : M13, chaque moitié sur le résultat d'avant ; la moitié d'un impair au-delà de 15 se découpe", () => {
  const e = CORE.niveauDe("M13-1").niveau.apprends.ecris;
  assert.equal(espaces(e.consigne), "260 ÷ 4 = 260 ÷ 2 ÷ 2");
  assert.deepEqual(e.etapes.map(x => [espaces(x.texte), x.reponse]), [["260 ÷ 2 = □", 130], ["130 ÷ 2 = □", 65]]);
  const e3 = CORE.niveauDe("M13-3").niveau.apprends.ecris;
  assert.deepEqual(e3.etapes.map(x => [espaces(x.texte), x.reponse]), [["140 ÷ 2 = □", 70], ["70 ÷ 2 = □", 35], ["35 ÷ 2 = 30 ÷ 2 + 5 ÷ 2 = □", 17.5]]);
  tous("M13-3").forEach(c => {
    const etapes = CORE.ecrisDuCalcul("M13-3", c).etapes;
    const derniere = espaces(etapes[etapes.length - 1].texte);
    const h = c.donnees.moities[c.donnees.moities.length - 2];
    assert.equal(/\+/.test(derniere), h > 15, `${espaces(c.texte)} : ${derniere}`);
  });
  // Le dessin : la barre, puis ses moitiés ; l'aide ne dit pas la réponse, J'écris remplit une rangée par étape.
  const c = CORE.niveauDe("M13-2").niveau.apprends.calculs.ecris;
  const dessins = CORE.niveauDe("M13-2").niveau.apprends.ecris.dessins.map(d => textesSvg(AIDES.dessinerImage(d)));
  assert.deepEqual(dessins.map(t => t.filter(x => x !== "?").length), [1, 3, 7, 16]);
  assert.ok(!dessins[2].includes("35") && dessins[3].includes("35"), `${espaces(c.texte)} : la dernière rangée vient avec la dernière étape`);
  assert.match(AIDES.dessinerImage(CORE.aideDe(c)), /aria-label="Schéma : la barre de 280, coupée en deux, puis encore deux fois : 2 barres à trouver, puis 4 barres à trouver\. Une des 8 barres : un nombre à trouver\."/);
});

test("lot 7b : les erreurs connues, chacune la sienne", () => {
  const cas = [
    ["D8-2", "moitie", 13.6, 6.3, 2], ["D8-2", "double", 13.6, 26.12, 3], ["D8-2", "moitie", 13.6, 27.2, 1], ["D8-2", "moitie", 13.6, 6.5, 5],
    ["D8-1", "moitie", 9, 4, 2]
  ];
  cas.forEach(([cle, forme, n, reponse, cause]) => {
    const c = tous(cle).find(x => x.forme === forme && CORE.memeNombre(x.donnees.n, n));
    assert.equal(CORE.diagnostiquer(c, reponse).c, cause, `${espaces(c.texte)} → ${reponse}`);
  });
  const huit = tous("D8-3").find(c => espaces(c.texte) === "moitié de 8,10 = □");
  assert.equal(CORE.diagnostiquer(huit, 4.5).c, 4, "4,5 : chaque chiffre coupé en deux (évaluation de 6e)");
  const m13 = [[tous("M13-1").find(c => c.forme === "division" && c.donnees.n === 180), 90, 1], [tous("M13-3").find(c => c.donnees.n === 260 && c.donnees.d === 8), 32, 3],
    [tous("M13-2").find(c => c.forme === "division" && c.donnees.n === 360), 22.5, 2]];
  m13.forEach(([c, reponse, cause]) => assert.equal(CORE.diagnostiquer(c, reponse).c, cause, `${espaces(c.texte)} → ${reponse}`));
  const d9 = tous("D9-1").find(c => c.forme === "produit" && CORE.memeNombre(c.donnees.n, 1.46));
  assert.equal(CORE.diagnostiquer(d9, 14.6).c, 1, "× 10 sans la moitié");
});

test("lot 7b : les aides écrivent un décimal avec sa virgule ; À retenir coupe ses égalités « double de », « moitié de »", async () => {
  const svg = AIDES.dessinerImage({outil: "barres", sorte: "moitie", n: 13.6, morceaux: [13, 0.6], masque: true});
  assert.deepEqual(textesSvg(svg).filter(t => t !== "?"), ["13,6", "13", "0,6"]);
  assert.match(AIDES.dessinerImage({outil: "barres", sorte: "moitie", n: 13.6, morceaux: [13, 0.6]}).replace(/ masque/, ""), /aria-label="Schéma : la barre de 13,6 : 13 et 0,6/);
  assert.deepEqual(AIDES.bilanEnDeux("double de 13,6 = 26 + 1,2 = 27,2."), {phrase: "", calcul: "double de 13,6 = 26 + 1,2 = 27,2"});
  const page = await readFile(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8");
  assert.ok(page.includes("split(/(?<=\\.)\\s+(?=[A-ZÀ-ÖØ-Þ\\d(]|(?:double|moitié) de )/)")); // (lot 7d : aussi une ligne qui commence par « ( »)
});
