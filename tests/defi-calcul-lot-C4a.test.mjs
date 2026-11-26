// Lot C4a (22/11/2026, planches 0 à 13 validées par Gwenaël) : « compter en
// dizaines, additionner deux nombres ».
//  - A3 : la méthode dépend du calcul — le chiffre qui change, casser une
//    centaine, compter en dizaines —, dans un même tableau des rangs ;
//  - les doubles des nombres ronds, ÷ un chiffre, les compléments à un seul
//    écart : le tableau ;
//  - A4, A7 : deux sauts, la dizaine passée en repère ;
//  - le dessin à étapes accepte le résultat tapé à la première case.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const espaces = t => String(t).replace(/[  ]/g, " ");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// L'oracle des sortes, écrit à part du moteur (le tableau de la décision).
const rang = d => (Math.abs(d) < 100 ? 10 : Math.abs(d) < 1000 ? 100 : 1000);
const chiffre = (n, u) => Math.floor(n / u) % 10;
function sorte(n, d) {
  const u = rang(d);
  const r = chiffre(n, u) + Math.sign(d) * Math.abs(d) / u;
  if (r >= 0 && r <= 9) return "chiffre";
  if (d < 0 && chiffre(n, u) === 0 && chiffre(n, 10 * u) > 0) return "casser";
  return "compter";
}
const cellules = image => [...image.lignes, image.res].flatMap(l => l.cells.filter(Boolean));
const cherchees = image => cellules(image).filter(cel => cel.e === "cherche");
const trouvees = image => cellules(image).filter(cel => cel.e === "trouve");
// Le nombre que le tableau corrigé écrit (24 | 0 → 240 ; « + 3 », 10 | 0 → 30).
const lu = image => {
  const ligne = [...image.lignes, image.res].find(l => l.cells.some(cel => cel && cel.e === "trouve"));
  const cases = ligne === image.res ? image.res.cells : [ligne.cells.find(cel => cel && cel.e === "trouve"), ...image.res.cells.slice(1)];
  return Number(cases.filter(Boolean).map(cel => cel.t).join("").replace(/\s/g, ""));
};
const tirage = (cle, graines = 30) => {
  const vus = new Map();
  for (let g = 1; g <= graines; g += 1) {
    const s = CORE.genererSerie(cle, {graine: g, genre: "entraine", total: 25});
    [...s, ...(s.reserve || [])].forEach(c => vus.set(c.cle, c));
  }
  return [...vus.values()];
};

test("A3 : la sorte de chaque calcul tiré, son tableau, sa première ligne, sa correction", () => {
  const vues = {chiffre: 0, casser: 0, compter: 0};
  ["A3-1", "A3-2", "A3-3", "A3-4"].forEach(cle => tirage(cle).forEach(c => {
    const {n, d, m} = c.donnees;
    const s = sorte(n, d);
    vues[s] += 1;
    const u = rang(d);
    const k = Math.abs(d) / u;
    const aide = CORE.aideDe(c);
    assert.equal(aide.outil, "tableau-rang", c.texte);
    assert.ok(aide.masque, c.texte);
    // Une seule case cherchée, en bleu ; jamais la réponse dans une case.
    assert.deepEqual(cherchees(aide).map(cel => cel.t), ["?"], c.texte);
    const large = aide.cols.findIndex(col => col.large);
    assert.equal(aide.cols[large].nom, {10: "dizaines", 100: "centaines", 1000: "milliers"}[u], `${c.texte} : la colonne du rang`);
    if (m >= 10) assert.ok(!cellules(aide).some(cel => Number(cel.t.replace(/\s/g, "")) === m), `${c.texte} : la réponse dans le tableau`);
    // Les rangs qui ne bougent pas, en gris, dans le résultat.
    aide.res.cells.forEach((cel, i) => { if (i !== large && cel) assert.equal(cel.e, "garde", `${c.texte} : colonne ${i} grise`); });
    // La première ligne du dessin à étapes.
    const etapes = CORE.dessinAEtapesDe(c);
    if (s === "chiffre") {
      if (n < u) { assert.equal(etapes, null, `${c.texte} : pas de chiffre à ce rang`); return; }
      assert.equal(etapes.etapes[0].texte, `${chiffre(n, u)} ${d > 0 ? "+" : "−"} ${k} = □`, c.texte);
      assert.equal(aide.cols.length, String(Math.max(n, m)).length, `${c.texte} : toutes les colonnes`);
    } else if (s === "casser") {
      if (n === 10 * u) { assert.equal(etapes, null, `${c.texte} : la première ligne serait le calcul`); return; }
      assert.equal(espaces(etapes.etapes[0].texte), `${espaces(CORE.formaterNombre(10 * u))} − ${espaces(CORE.formaterNombre(-d))} = □`, c.texte);
      assert.equal(etapes.etapes[0].reponse, 10 * u + d);
      assert.equal(aide.lignes.length, 3, `${c.texte} : la ligne du nombre cassé`);
      assert.equal(aide.lignes[1].cells[large].t, "10", `${c.texte} : 10 dans le rang`);
    } else {
      const c0 = Math.floor(n / u);
      assert.equal(espaces(etapes.etapes[0].texte), `${espaces(CORE.formaterNombre(c0))} ${d > 0 ? "+" : "−"} ${k} = □`, c.texte);
      assert.equal(etapes.etapes[0].reponse, c0 + Math.sign(d) * k);
      assert.equal(aide.cols.length, 1 + String(u).length - 1, `${c.texte} : le rang, puis les rangs du dessous`);
    }
    assert.equal(etapes.etapes[1].texte, c.texte);
    assert.equal(etapes.etapes[1].reponse, m);
    assert.notEqual(etapes.etapes[0].reponse, m, `${c.texte} : la première case n'est pas la réponse`);
    // La correction se lit, la case trouvée en vert.
    assert.equal(lu(CORE.imageDe(c)), m, `${c.texte} : la correction`);
    // Le dessin garde sa taille d'une étape à l'autre.
    const tailles = etapes.dessins.map(dessin => /viewBox="([^"]+)"/.exec(AIDES.dessinerImage(dessin))[1]);
    assert.equal(new Set(tailles).size, 1, c.texte);
    assert.equal(trouvees(etapes.revele).length, 0, `${c.texte} : révélé, sans le vert`);
    assert.equal(trouvees(etapes.dessins[1]).length, 1, `${c.texte} : la case trouvée, en vert`);
  }));
  assert.ok(vues.chiffre > 100 && vues.casser > 20 && vues.compter > 100, JSON.stringify(vues));
});

test("A3 : les sortes déclarées, les annonces, les phrases de méthode, l'exemple de la même méthode", () => {
  // « Partir d'une centaine ronde » est une sorte d'A3-2, ajoutée à la fin.
  assert.deepEqual(CORE.sortesDe("A3-2").map(s => s.nom), ["+ dizaines", "− dizaines", "centaine ronde"]);
  const a32 = tirage("A3-2");
  a32.forEach(c => {
    const attendue = c.forme === "somme" ? 0 : sorte(c.donnees.n, c.donnees.d) === "casser" ? 2 : 1;
    assert.equal(CORE.sorteDe(c), attendue, c.texte);
  });
  const annonce = (cle, c) => espaces((CORE.nouveauteDe(c, cle) || {}).texte || "");
  assert.equal(annonce("A3-2", a32.find(c => c.forme === "difference" && sorte(c.donnees.n, c.donnees.d) === "compter")), "Nouveau : on retire des dizaines : je compte en dizaines.");
  assert.equal(annonce("A3-2", a32.find(c => sorte(c.donnees.n, c.donnees.d) === "casser")), "Nouveau : on part d’une centaine ronde : je casse une centaine.");
  const casse3 = tirage("A3-3", 120).find(c => sorte(c.donnees.n, c.donnees.d) === "casser");
  assert.ok(casse3, "A3-3 tire un nombre rond");
  assert.equal(annonce("A3-3", casse3), "Nouveau : on part d’un nombre rond : je casse un millier.");
  assert.equal(annonce("A3-4", tirage("A3-4").find(c => CORE.sorteDe(c) === 3)), "Nouveau : on passe la dizaine de mille : je compte en milliers.");
  // Les phrases de méthode (lot C3), sur les calculs de la décision.
  const phrase = (cle, texte) => {
    const c = a32.concat(tirage(cle)).find(x => espaces(x.texte) === texte);
    assert.ok(c, texte);
    return espaces(CORE.methodeExemple(c));
  };
  assert.equal(phrase("A3-2", "300 − 80 = □"), "Je casse une centaine : 300 = 200 + 100. 100 − 80 = 20, donc 300 − 80 = 220.");
  assert.match(phrase("A3-2", "532 − 60 = □"), /^532, c’est 53 dizaines et 2 unités\. 53 dizaines − 6 dizaines = 47 dizaines : 532 − 60 = 472\.$/);
  // L'exemple résolu a la méthode de « À toi » (300 − 80 avant 400 − 20).
  a32.filter(c => c.forme === "difference").slice(0, 40).forEach(c => {
    const exemple = CORE.exempleAvant(c, {graine: 3});
    if (!exemple) return;
    assert.equal(sorte(exemple.donnees.n, exemple.donnees.d), sorte(c.donnees.n, c.donnees.d), `${exemple.texte} avant ${c.texte}`);
  });
});

test("A3 : les leçons — On te montre, J'écris, À retenir — et J'écris tiré", () => {
  const a = cle => CORE.niveauDe(cle).niveau.apprends;
  assert.equal(espaces(a("A3-2").represente.consigne), "Je compte en dizaines : 746, c’est 74 dizaines et 6 unités.");
  assert.deepEqual(a("A3-2").represente.etapes.map(e => [espaces(e.texte), e.reponse]), [["74 + 8 = □", 82], ["746 + 80 = □", 826]]);
  assert.equal(espaces(a("A3-2").ecris.consigne), "768, c’est 76 dizaines et 8 unités.");
  assert.deepEqual(a("A3-2").ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["76 + 5 = □", 81], ["768 + 50 = □", 818]]);
  assert.equal(espaces(a("A3-2").bilan), "Je compte en dizaines, les unités ne bougent pas : 74 + 8 = 82. 746 + 80 = 826.");
  assert.equal(espaces(a("A3-3").represente.consigne), "Je compte en dizaines : 950, c’est 95 dizaines.");
  assert.deepEqual(a("A3-3").ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["98 + 6 = □", 104], ["980 + 60 = □", 1040]]);
  assert.equal(espaces(a("A3-3").bilan), "Je compte en dizaines, les unités ne bougent pas : 95 + 7 = 102. 950 + 70 = 1 020.");
  assert.equal(espaces(a("A3-4").autre.phrase), "Avec une retenue, je compte en milliers :");
  assert.equal(espaces(a("A3-4").autre.calcul), "47 + 6 = 53 ; 47 530 + 6 000 = 53 530");
  // A3-1 : aucun texte ne change ; À retenir dessine 46 + 30 (le chiffre qui change).
  // (Lot K1b : au CP, J'écris sur 34 + 60 ; « Dans 234… » est dans sa moitié du CE1, A3-5,
  // qui commence au tableau — pas de perles au-delà de 100.)
  assert.equal(espaces(a("A3-1").ecris.consigne), "Dans 34, le chiffre des dizaines est 3.");
  assert.equal(espaces(a("A3-5").ecris.consigne), "Dans 234, le chiffre des dizaines est 3.");
  assert.equal(espaces(a("A3-5").represente.consigne), "Seul le chiffre des dizaines change : 2 + 4.");
  assert.equal(a("A3-5").manipule, null);
  assert.equal(a("A3-5").image.outil, "tableau-rang");
  assert.equal(lu(a("A3-5").image), 365);
  assert.equal(a("A3-1").image.outil, "tableau-rang");
  assert.equal(lu(a("A3-1").image), 76);
  assert.equal(a("A3-1").manipule.outil, "perles", "les perles de « On te montre » restent");
  // J'écris tiré : deux étapes, la méthode de la sorte, jamais la droite.
  ["A3-1", "A3-2", "A3-3", "A3-4", "A3-5"].forEach(cle => {
    for (let graine = 1; graine <= 30; graine += 1) {
      const t = CORE.ecrisTire(cle, {graine});
      if (!t) continue;
      const ecris = t.ecris || t;
      assert.equal(ecris.etapes.length, 2, `${cle} graine ${graine}`);
      assert.ok(ecris.dessins.every(d => d.outil === "tableau-rang"), cle);
    }
  });
});

test("les doubles des nombres ronds, ÷ un chiffre, les compléments à un seul écart : le tableau", () => {
  // Doubles des nombres usuels : seuls les nombres ronds (60 à 900).
  tirage("M1-5").forEach(c => {
    const rond = /^[1-9]0+$/.test(String(c.donnees.n)) && c.donnees.n >= 60;
    assert.equal(CORE.aideDe(c).outil, rond ? "tableau-rang" : "barres", c.texte);
    if (!rond) return;
    const u = c.donnees.n >= 100 ? 100 : 10;
    const e = CORE.dessinAEtapesDe(c).etapes;
    assert.equal(e[0].texte, c.forme === "double-fois" ? `2 × ${c.donnees.n / u} = □` : `${c.donnees.n / u} + ${c.donnees.n / u} = □`, c.texte);
    assert.equal(lu(CORE.imageDe(c)), c.reponse);
  });
  // Les moitiés des nombres usuels gardent leurs barres (choix de Gwenaël).
  tirage("M1-6").forEach(c => assert.equal(CORE.aideDe(c).outil, "barres", c.texte));
  assert.equal(espaces(CORE.niveauDe("M1-5").niveau.apprends.autre.calcul), "8 + 8 = 16 ; double de 800 = 1 600");
  // ÷ un chiffre.
  tirage("M12-1").forEach(c => {
    const aide = CORE.aideDe(c);
    assert.equal(aide.outil, "tableau-rang", c.texte);
    const e = CORE.dessinAEtapesDe(c).etapes;
    const t = c.donnees.t;
    assert.equal(espaces(e[0].texte), c.forme === "trou-facteur" ? `${c.donnees.d} × □ = ${espaces(CORE.formaterNombre(t))}` : `${espaces(CORE.formaterNombre(t))} ÷ ${c.donnees.d} = □`, c.texte);
    assert.equal(e[0].reponse, t / c.donnees.d);
    assert.equal(lu(CORE.imageDe(c)), c.reponse, c.texte);
  });
  tirage("M12-2").forEach(c => assert.equal(CORE.aideDe(c).outil, "partage", c.texte));
  const m12 = CORE.niveauDe("M12-1").niveau.apprends;
  assert.equal(espaces(m12.ecris.consigne), "350, c’est 35 dizaines.");
  assert.equal(espaces(m12.bilan), "240, c’est 24 dizaines : 24 ÷ 6 = 4. 240 ÷ 6 = 40.");
  // Compléments à 100 : dizaines — les dizaines seules, trois écritures.
  const a22 = tirage("A2-2");
  assert.ok(a22.every(c => c.donnees.a % 10 === 0), "les dizaines seules");
  assert.deepEqual([...new Set(a22.map(c => c.forme))].sort(), ["complement", "complement-gauche", "difference"]);
  a22.forEach(c => {
    const e = CORE.dessinAEtapesDe(c).etapes;
    const ca = c.donnees.a / 10;
    const attendu = {complement: `${ca} + □ = 10`, "complement-gauche": `□ + ${ca} = 10`, difference: `10 − ${ca} = □`}[c.forme];
    assert.equal(e[0].texte, attendu, c.texte);
    assert.equal(lu(CORE.imageDe(c)), c.reponse, c.texte);
  });
  const a2 = CORE.niveauDe("A2-2").niveau;
  assert.equal(espaces(a2.titre), "à 100 : dizaines");
  assert.equal(espaces(a2.apprends.ecris.consigne), "20, c’est 2 dizaines ; 100, c’est 10 dizaines.");
  assert.deepEqual(a2.apprends.ecris.etapes.map(e => [espaces(e.texte), e.reponse]), [["2 + □ = 10", 8], ["20 + □ = 100", 80]]);
  assert.deepEqual(a2.imposes.map(c => espaces(c.texte)), ["30 + □ = 100", "100 − 60 = □"]);
  assert.equal(a2.apprends.represente.texte.replace(/\s/g, " "), "70 + □ = 100");
  // Compléments à 100 : les nombres en 5 arrivent (environ 1 sur 5), par la dizaine.
  const a23 = tirage("A2-3");
  const en5 = a23.filter(c => c.donnees.a % 10 === 5);
  assert.ok(en5.length / a23.length > 0.1 && en5.length / a23.length < 0.3, `${en5.length} sur ${a23.length}`);
  assert.ok(!en5.some(c => c.donnees.a === 95), "pas 95 : un seul saut");
  en5.forEach(c => assert.equal(CORE.aideDe(c).outil, "droite-sauts", c.texte));
  // Compléments à 1 000 : un seul écart, le tableau ; deux écarts, la droite.
  tirage("A2-4").forEach(c => {
    const un = CORE.a2Sauts(c).sauts.length === 1;
    assert.equal(CORE.aideDe(c).outil, un ? "tableau-rang" : "droite-sauts", c.texte);
    if (un) assert.equal(lu(CORE.imageDe(c)), c.reponse, c.texte);
  });
});

test("A4, A7 : deux sauts, la dizaine passée en repère qui garde sa place ; les perles ne changent pas", () => {
  ["A4-1", "A4-2", "A4-3", "A4-4", "A7-1", "A7-2", "A7-3"].forEach(cle => tirage(cle).forEach(c => {
    const {n, d, m} = c.donnees;
    const aide = CORE.aideDe(c);
    assert.equal(aide.sauts.length, 2, c.texte);
    const dz = d - Math.sign(d) * (Math.abs(d) % 10);
    assert.deepEqual(aide.sauts.map(s => s.val), [dz, d - dz], c.texte);
    const x = n + dz;
    const passe = [...Array(Math.abs(d - dz) + 1).keys()].slice(1).map(i => x + Math.sign(d) * i).find(v => v % 10 === 0 && v !== m);
    const attendu = passe !== undefined && passe !== x ? passe : undefined;
    assert.equal(aide.repere, attendu, `${c.texte} : le repère`);
    if (aide.repere !== undefined) {
      const plan = AIDES.planDroite(aide);
      const ordre = [plan.x[0], plan.x[1], plan.xRepere, plan.x[2]].sort((p, q) => p - q);
      ordre.slice(1).forEach((v, i) => assert.ok(v - ordre[i] >= AIDES.DROITE.sautMin - 1, `${c.texte} : le repère garde sa place`));
      const svg = AIDES.dessinerImage(aide);
      assert.match(svg, new RegExp(`fill="#5b7286">${aide.repere}</text>`), `${c.texte} : le nombre gris`);
    }
    // Le dessin à étapes : les dizaines, puis le résultat.
    const e = CORE.dessinAEtapesDe(c).etapes;
    assert.equal(e[0].reponse, x, c.texte);
  }));
  // Les perles : les gestes du chemin par la dizaine (finir la rangée, puis le reste).
  const perles = CORE.niveauDe("A4-2").niveau.apprends.manipule;
  assert.deepEqual([...perles.gestes], [10, 10, 3, 5]);
  assert.deepEqual(CORE.niveauDe("A7-2").niveau.apprends.manipule.gestes.slice(), [-10, -10, -3, -4]);
  // Les bilans de la leçon.
  assert.equal(espaces(CORE.niveauDe("A4-2").niveau.apprends.bilan), "J’ajoute les dizaines, puis les unités : 47 + 28 = 47 + 20 + 8 = 75.");
  assert.equal(espaces(CORE.niveauDe("A7-2").niveau.apprends.bilan), "Je retire les dizaines, puis les unités : 63 − 27 = 63 − 20 − 7 = 36.");
  // Les erreurs : « la dizaine pas changée » cite la dizaine passée, son saut en gras.
  const c = CORE.niveauDe("A7-2").niveau.apprends.calculs.montre;
  assert.equal(espaces(c.texte), "63 − 27 = □");
  assert.equal(CORE.diagnostiquer(c, 44).image.sauts.length, 2);
  const dizaine = CORE.diagnostiquer(c, 46);
  assert.equal(espaces(dizaine.texte), "46 : la dizaine n’a pas changé. En retirant 7 de 43, on passe sous 40.");
  assert.equal(dizaine.image.gras, 2);
  assert.equal(dizaine.image.repere, 40);
});

test("le dessin à étapes : le résultat tapé à la première case est juste (la page)", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /if \(!juste && question\.etape === 0 && etapes\.length === 2 && CORE\.estJuste\(question\.calcul, valeur, state\.answer\)\) \{\s*question\.directe = true;\s*question\.premierDonne = true;\s*question\.etape = 1;/);
  assert.match(page, /majDessinQuestion\(question\.dessinEtapes\.revele\);\s*return false;/);
  assert.match(page, /question\.directe \? question\.dessinEtapes\.revele : question\.dessinEtapes\.dessins\[question\.dessinEtapes\.etapes\.length\]/);
});

test("les données ne changent pas : progression, compétences, clés des calculs", async () => {
  const parcours = await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  // (Lot K1 « la carte chez l'élève » : la progression passe en version 12 ; lot K1b : 13.)
  assert.match(parcours, /VERSION\s*=\s*13\b/, "ce lot n'a pas changé la version (11 alors, 12 depuis le lot K1, 13 depuis le lot K1b)");
  // Les clés des calculs (les boîtes de Mes calculs du jour) : inchangées.
  assert.equal(CORE.niveauDe("A3-2").niveau.imposes[1].cle, "A3-2-534-70-x");
  assert.equal(CORE.genererSerie("A2-2", {graine: 1, genre: "valide"}).find(c => c.forme === "difference").cle.split("-").slice(0, 3).join("-"), "A2-2-100");
  // La copie du moteur pour la page prof, octet pour octet.
  assert.ok(await lire("../_serveur/public/prof/defi_calcul_core.js") === await lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie pour la page prof, octet pour octet");
  const html = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(html, /defi_calcul_core\.js\?v=20261126-2/);
  assert.match(html, /defi_calcul_aides\.js\?v=20261125-2/);
});
