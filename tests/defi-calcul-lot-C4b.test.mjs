// Lot C4b (25/11/2026, choix de Gwenaël par questions, planches 1 à 6) :
// « les petits calculs des bases ».
//  - les calculs d'un seul saut prennent le tableau des rangs : sans passage
//    (32 + 4 : le chiffre des unités change ; 36 + 4 : la case des unités
//    dit 10), depuis une dizaine entière (50 − 6, 730 − 4, 600 − 4 : je
//    casse une dizaine, compté en dizaines), le complément à la dizaine
//    (74 + □ = 80 : 4 + □ = 10) ;
//  - les sommes de « Sommes jusqu'à 10 » et les petites différences de
//    « Différences et trous jusqu'à 20 » : les deux barres ; les trous qui
//    passent 10 gardent la droite à 2 sauts ;
//  - les fractions : le Je représente de la leçon est une addition.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const AIDES = require("../outils/calcul_mental/defi_calcul_aides.js");
const espaces = t => String(t).replace(/[\u00a0\u202f]/g, " ");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const nb = x => espaces(CORE.formaterNombre(x));

const NIVEAUX = ["A1-1", "A1-3", "A10-1", "A11-1", "A2-1", "A10-2", "A11-2", "A11-3", "A10-3"].filter(cle => CORE.niveauDe(cle));
const cellules = image => [...image.lignes, image.res].flatMap(l => l.cells.filter(Boolean));
const cherchees = image => cellules(image).filter(cel => cel.e === "cherche");
// Tous les calculs tirés (entraînement, validation, réserve, test, calculs du jour).
function tirage(cle, graines = 40) {
  const vus = new Map();
  const [mod, nv] = cle.split("-");
  for (let g = 1; g <= graines; g += 1) {
    ["entraine", "valide"].forEach(genre => {
      const s = CORE.genererSerie(cle, {graine: g * 101 + 7, genre, total: 25});
      [...s, ...(s.reserve || [])].forEach(c => vus.set(c.cle, c));
    });
    const t = CORE.genererTest(mod, {graine: g * 104729}).find(x => x.niveau === Number(nv));
    if (t) t.calculs.forEach(c => vus.set(c.cle, c));
    for (let tour = 0; tour < 6; tour += 1) { const c = CORE.genererUn(cle, g * 977 + tour, {tour}); if (c) vus.set(c.cle, c); }
  }
  return [...vus.values()];
}
// L'oracle, écrit à part du moteur : la sorte d'un calcul de A10/A11.
function sorteA(c) {
  const {n, d} = c.donnees;
  const u = n % 10;
  if (u + d >= 0 && u + d <= 10) return "unites";
  if (d < 0 && u === 0) return "casser";
  return "deux-sauts";
}
const TIRAGES = Object.fromEntries(NIVEAUX.map(cle => [cle, tirage(cle)]));

test("aucune droite à un seul saut dans les 9 niveaux, ni à l'aide ni à la correction", () => {
  NIVEAUX.forEach(cle => TIRAGES[cle].forEach(c => {
    [CORE.aideDe(c), CORE.imageDe(c)].forEach(image => {
      if (image && image.outil === "droite-sauts") assert.ok(image.sauts.length >= 2, `${cle} : ${c.texte} — un seul saut`);
    });
  }));
});

test("A10, A11 : le tableau d'un seul saut — une case « ? », jamais la réponse, la première ligne", () => {
  const vus = {unites: 0, pile: 0, casser: 0, "deux-sauts": 0};
  ["A10-1", "A11-1", "A10-2", "A11-2", "A11-3", "A10-3"].filter(cle => TIRAGES[cle]).forEach(cle => TIRAGES[cle].forEach(c => {
    const {n, d, m} = c.donnees;
    const s = sorteA(c);
    const aide = CORE.aideDe(c);
    const k = Math.abs(d);
    if (s === "deux-sauts") {
      vus[s] += 1;
      assert.equal(aide.outil, "droite-sauts", c.texte);
      assert.equal(aide.sauts.length, 2, `${c.texte} : la droite à 2 sauts`);
      return;
    }
    assert.equal(aide.outil, "tableau-rang", c.texte);
    assert.ok(aide.masque, c.texte);
    assert.deepEqual(cherchees(aide).map(cel => cel.t), ["?"], `${c.texte} : une seule case cherchée`);
    assert.ok(!cellules(aide).some(cel => Number(String(cel.t).replace(/\s/g, "")) === m), `${c.texte} : la réponse dans le tableau`);
    assert.ok(AIDES.dessinerImage(aide).includes(">?<"), `${c.texte} : la case dessinée`);
    const etapes = CORE.dessinAEtapesDe(c).etapes;
    assert.equal(etapes.length, 2, c.texte);
    assert.equal(espaces(etapes[1].texte), espaces(c.texte), `${c.texte} : puis le calcul`);
    assert.equal(etapes[1].reponse, m);
    const correction = CORE.imageDe(c);
    assert.equal(correction.outil, "tableau-rang", c.texte);
    if (s === "unites") {
      const u = n % 10;
      const pile = u + d === 10;
      vus[pile ? "pile" : "unites"] += 1;
      assert.equal(espaces(etapes[0].texte), `${u} ${d > 0 ? "+" : "−"} ${k} = □`, c.texte);
      assert.equal(etapes[0].reponse, u + d);
      assert.equal(aide.cols[aide.cols.length - 1].nom, "unités");
      assert.ok(aide.cols[aide.cols.length - 1].large, `${c.texte} : la colonne des unités`);
      assert.equal(aide.cols.length, String(n).length, `${c.texte} : toutes les colonnes`);
      // Les autres rangs ne bougent pas : gris, recopiés.
      aide.res.cells.slice(0, -1).forEach((cel, i) => assert.equal(cel.e, "garde", `${c.texte} : colonne ${i} grise`));
      const resultat = correction.res.cells[correction.res.cells.length - 1].t;
      // Pile sur la dizaine : la case des unités dit 10 (3 dizaines et 10 unités).
      assert.equal(resultat, String(u + d), `${c.texte} : ${pile ? "10 aux unités" : "le chiffre des unités"}`);
    } else {
      vus.casser += 1;
      const c0 = n / 10;
      assert.equal(espaces(etapes[0].texte), `10 − ${k} = □`, c.texte);
      assert.equal(etapes[0].reponse, 10 - k);
      // En dizaines : 600, c'est 60 dizaines → 59 dizaines et 10 unités.
      assert.deepEqual(aide.cols.map(col => col.nom), ["dizaines", "unités"], c.texte);
      assert.deepEqual(aide.lignes[0].cells.map(cel => espaces(cel.t)), [nb(c0), "0"], c.texte);
      assert.equal(aide.lignes.length, 3, `${c.texte} : la ligne de la dizaine cassée`);
      assert.deepEqual(aide.lignes[1].cells.map(cel => espaces(cel.t)), [nb(c0 - 1), "10"], c.texte);
      assert.deepEqual(correction.res.cells.map(cel => espaces(cel.t)), [nb(c0 - 1), String(10 - k)], c.texte);
      assert.equal((c0 - 1) * 10 + 10 - k, m, `${c.texte} : le tableau se lit`);
    }
  }));
  Object.entries(vus).forEach(([s, v]) => assert.ok(v > 0, `la sorte « ${s} » est tirée`));
});

test("« Compléments à la dizaine » : le tableau en unités, 4 + □ = 10 puis 74 + □ = 80", () => {
  TIRAGES["A2-1"].forEach(c => {
    const {a, cible} = c.donnees;
    const u = a % 10;
    const aide = CORE.aideDe(c);
    assert.equal(aide.outil, "tableau-rang", c.texte);
    assert.deepEqual(cherchees(aide).map(cel => cel.t), ["?"], c.texte);
    assert.equal(aide.cols[aide.cols.length - 1].nom, "unités");
    assert.equal(espaces(aide.res.label), nb(cible), `${c.texte} : l'arrivée`);
    const etapes = CORE.dessinAEtapesDe(c).etapes;
    assert.equal(espaces(etapes[0].texte), `${u} + □ = 10`, c.texte);
    assert.equal(etapes[0].reponse, 10 - u);
    assert.equal(c.reponse, 10 - u, `${c.texte} : complément = 10 − ${u}`);
  });
  // (Lot K1b : au CP, à 2 chiffres ; 433 + □ = 440 est dans sa moitié du CE1, A2-6.)
  const ecris = CORE.niveauDe("A2-1").niveau.apprends.ecris;
  assert.equal(espaces(ecris.consigne), "Dans 34, le chiffre des unités est 4.");
  assert.deepEqual(ecris.etapes.map(e => espaces(e.texte)), ["4 + □ = 10", "34 + □ = 40"]);
  assert.equal(CORE.niveauDe("A2-1").niveau.apprends.represente.outil, "tableau-rang");
  const ce1 = CORE.niveauDe("A2-6").niveau.apprends;
  assert.equal(espaces(ce1.ecris.consigne), "Dans 433, le chiffre des unités est 3.");
  assert.deepEqual(ce1.ecris.etapes.map(e => espaces(e.texte)), ["3 + □ = 10", "433 + □ = 440"]);
  assert.equal(ce1.represente.outil, "tableau-rang");
  assert.equal(ce1.manipule, null, "pas de perles au-delà de 100");
});

test("les sommes et les petites différences en deux barres ; les trous qui passent 10 gardent la droite", () => {
  let sommes = 0, differences = 0, trous = 0;
  TIRAGES["A1-1"].forEach(c => {
    const aide = CORE.aideDe(c);
    assert.equal(aide.outil, "deux-barres", c.texte);
    if (c.forme !== "somme") return;
    sommes += 1;
    const {n, d, m} = c.donnees;
    assert.deepEqual([...aide.haut], [m]);
    assert.deepEqual(aide.cherche, ["haut", 0], `${c.texte} : le haut cherché`);
    assert.deepEqual([...aide.bas], n === 0 ? [d] : d === 0 ? [n] : [n, d], `${c.texte} : 0 n'a pas de barre`);
    assert.ok(aide.masque);
    assert.deepEqual(AIDES.dessinerImage(aide).match(/>([^<]+)<\/text>/g).map(t => t.slice(1, -7))[0], "?");
  });
  TIRAGES["A1-3"].forEach(c => {
    const aide = CORE.aideDe(c);
    const {n, d} = c.donnees;
    if (c.forme === "difference" && n <= 10) {
      differences += 1;
      assert.equal(aide.outil, "deux-barres", c.texte);
      assert.deepEqual([...aide.haut], [n]);
      assert.deepEqual([...aide.bas], [-d, c.reponse]);
      assert.deepEqual(aide.cherche, ["bas", 1], `${c.texte} : ce qui reste est cherché`);
      return;
    }
    if (c.forme !== "difference") trous += 1;
    assert.equal(aide.outil, "droite-sauts", c.texte);
    assert.equal(aide.sauts.length, 2, `${c.texte} : la droite à 2 sauts`);
  });
  assert.ok(sommes > 0 && differences > 0 && trous > 0);
});

test("les phrases d'erreur : le tableau, les barres, la dizaine cassée", () => {
  const premier = (cle, f) => TIRAGES[cle].find(f);
  const c50 = premier("A11-2", c => c.donnees.n % 10 === 0);
  const {n} = c50.donnees;
  assert.equal(espaces(CORE.diagnostiquer(c50, c50.reponse + 10).texte), `${nb(c50.reponse + 10)} : la dizaine n’a pas changé. Je casse une dizaine : ${nb(n)} = ${nb(n - 10)} + 10.`);
  assert.equal(espaces(CORE.diagnostiquer(c50, c50.reponse + 1).texte), `C’est à 1 près. Je casse une dizaine : ${nb(n)} = ${nb(n - 10)} + 10, puis 10 − ${-c50.donnees.d}.`);
  const c32 = premier("A10-1", c => c.donnees.n % 10 + c.donnees.d < 10);
  assert.equal(espaces(CORE.diagnostiquer(c32, c32.reponse + 1).texte), `C’est à 1 près. Dans ${nb(c32.donnees.n)}, le chiffre des unités est ${c32.donnees.n % 10} : ${c32.donnees.n % 10} + ${c32.donnees.d}.`);
  const somme = premier("A1-1", c => c.forme === "somme" && c.donnees.n > 0 && c.donnees.d > 0);
  assert.equal(espaces(CORE.diagnostiquer(somme, somme.reponse + 1).texte), `C’est à 1 près. En bas, ${somme.donnees.n} et ${somme.donnees.d} : ensemble, ils font la barre du haut.`);
  const diff = premier("A1-3", c => c.forme === "difference" && c.donnees.n <= 10 && c.donnees.d < -1);
  assert.equal(espaces(CORE.diagnostiquer(diff, diff.reponse + 1).texte), `C’est à 1 près. En bas, ${-diff.donnees.d} et ce qui reste font ${diff.donnees.n}.`);
  assert.equal(espaces(CORE.diagnostiquer(diff, diff.donnees.n - diff.donnees.d).texte), `${diff.donnees.n - diff.donnees.d}, c’est ${diff.donnees.n} + ${-diff.donnees.d}. Ici, on retire : ${diff.donnees.n}, c’est ${-diff.donnees.d} et ce qui reste.`);
  // Toutes les phrases restent sans « NaN », sans « undefined », sans saut de 0.
  NIVEAUX.forEach(cle => TIRAGES[cle].forEach(c => [c.reponse + 1, c.reponse - 1, c.reponse + 10].forEach(r => {
    const dg = CORE.diagnostiquer(c, r);
    if (dg) assert.doesNotMatch(dg.texte, /NaN|undefined|[+−] 0\b/, `${c.texte} → ${r}`);
  })));
});

test("les annonces « Nouveau » : pile sur la dizaine, depuis une dizaine entière, une centaine ronde", () => {
  const annonce = (cle, f) => { const c = TIRAGES[cle].find(f); return c && CORE.nouveauteDe(c, cle); };
  assert.equal(annonce("A10-1", c => c.donnees.n % 10 + c.donnees.d === 10).texte, "Nouveau\u00a0: j’arrive pile sur la dizaine\u00a0: 10\u00a0unités font 1\u00a0dizaine.");
  // (Lot K1b : « depuis une dizaine entière » est toute la leçon d'A11-2, au CP — plus d'annonce
  // là ; elle est dans sa moitié du CE1, A11-4.)
  const a114 = Array.from({length: 12}, (_, g) => CORE.niveauDe("A11-4").niveau.composer(CORE.mulberry32((g + 1) * 7919), 40, [])).flat();
  assert.equal(CORE.nouveauteDe(a114.find(c => c.donnees.n % 10 === 0), "A11-4").texte, "Nouveau\u00a0: on part d’une dizaine entière\u00a0: je casse une dizaine.");
  assert.equal(CORE.nouveauteDe(a114.find(c => c.donnees.n % 10 !== 0), "A11-4"), null);
  assert.ok(TIRAGES["A11-2"].every(c => c.donnees.n % 10 === 0 && CORE.nouveauteDe(c, "A11-2") === null), "au CP : toujours depuis une dizaine entière, sans annonce");
  assert.equal(annonce("A11-3", c => c.donnees.n % 100 === 0).texte, "Nouveau\u00a0: on part d’une centaine ronde\u00a0: je casse une dizaine.");
  // Le calcul ordinaire du niveau n'a pas d'annonce.
  assert.equal(annonce("A11-2", c => c.donnees.n % 10 !== 0), undefined, "au CP, aucun calcul ne part d'ailleurs que d'une dizaine");
});

test("les phrases des leçons : insécables (règle du 13/11), « Seul le chiffre des … change : x + y »", () => {
  const consigne = cle => CORE.niveauDe(cle).niveau.apprends.represente.consigne;
  assert.equal(consigne("A10-1"), "Seul le chiffre des unités change\u00a0: 3\u00a0+\u00a05.");
  assert.equal(consigne("A11-1"), "Seul le chiffre des unités change\u00a0: 9\u00a0−\u00a06.");
  // (Lot K1b : A3-1, au CP, n'a que des dizaines — 23 + 50 ; A3-5, au CE1, 325 + 40.)
  assert.equal(consigne("A3-1"), "Seul le chiffre des dizaines change\u00a0: 2\u00a0+\u00a05.");
  assert.equal(consigne("A3-5"), "Seul le chiffre des dizaines change\u00a0: 2\u00a0+\u00a04.");
  assert.equal(consigne("A3-4"), "Seul le chiffre des milliers change\u00a0: 7\u00a0+\u00a02.");
  // La phrase de la correction au tableau : « 10 unités », « 1 dizaine » ne se coupent pas.
  const pile = TIRAGES["A10-1"].find(c => c.donnees.n % 10 + c.donnees.d === 10);
  const ecris = CORE.niveauDe("A10-1").niveau.apprends;
  assert.match(ecris.represente.solution.phrase, /^Dans 53, le chiffre des unités est 3\. 3 \+ 5 = 8\u00a0: 53 \+ 5 = 58\.$/);
  assert.ok(pile, "un calcul pile sur la dizaine");
  // Les trois temps de la leçon passent par le tableau.
  ["A10-1", "A11-1"].forEach(cle => {
    const a = CORE.niveauDe(cle).niveau.apprends;
    assert.equal(a.represente.outil, "tableau-rang", cle);
    assert.equal(a.image.outil, "tableau-rang", `${cle} : À retenir`);
    assert.equal(a.ecris.solution.image.outil, "tableau-rang", `${cle} : J'écris`);
    assert.ok(a.ecris.dessins.every(d => d.outil === "tableau-rang"), `${cle} : les dessins de J'écris`);
  });
});

test("les fractions : le Je représente de la leçon est une addition (F8-1, F9-1)", () => {
  const f8 = CORE.niveauDe("F8-1").niveau.apprends;
  assert.equal(espaces(f8.represente.texte), "5/8 + 2/8 = □/8");
  assert.equal(f8.represente.consigne, "On ajoute 2 huitièmes.");
  assert.equal(f8.represente.reponse, 7);
  const f9 = CORE.niveauDe("F9-1").niveau.apprends;
  assert.equal(espaces(f9.represente.texte), "3/4 + 1/8 = □/8");
  assert.equal(f9.represente.consigne, "Chaque quart, c’est 2 huitièmes.");
  assert.equal(f9.represente.reponse, 7);
  // Ni imposé, ni dans un autre temps de la leçon.
  ["F8-1", "F9-1"].forEach(cle => {
    const {niveau} = CORE.niveauDe(cle);
    const textes = niveau.apprends.textes.map(espaces);
    assert.equal(new Set(textes).size, textes.length, `${cle} : trois calculs différents`);
    niveau.imposes.forEach(c => assert.ok(!textes.includes(espaces(c.texte)), `${cle} : ${c.texte} imposé`));
  });
});

test("les données ne changent pas : progression en version 11, clés des calculs, copie serveur, cache", async () => {
  const parcours = await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js");
  // (Lot K1 « la carte chez l'élève » : la progression passe en version 12 ; lot K1b : 13.)
  assert.match(parcours, /VERSION\s*=\s*14\b/, "ce lot n'a pas changé la version (11 alors, 12 depuis le lot K1, 13 depuis le lot K1b, 14 depuis le lot P1)");
  // Les clés des calculs (les boîtes de Mes calculs du jour) : inchangées.
  // (Relevées sur le main ea9ab921 : les séries tirées, 40 graines, sont
  // aussi les mêmes, calcul pour calcul.)
  const CLES = {"A1-1": ["A1-1-3-x-10", "A1-1-10-7-x"], "A1-3": ["A1-3-14-6", "A1-3-7-x-12"], "A11-1": ["A11-1-157-5"], "A11-3": ["A11-3-601-4", "A11-3-3005-8"],
    // Lot K1b : cinq de ces niveaux sont coupés en deux. La moitié du bas (CP) garde son numéro
    // et prend des calculs à 2 chiffres ; les calculs d'avant passent à la moitié du haut (CE1),
    // sous son numéro neuf — 153 + 5 est « A10-4-153-5 ». Aucune clé de calcul n'est gardée
    // dans une progression (version 12 comme 13) : rien à reprendre. F8-1 : plus de septièmes.
    "A10-1": ["A10-1-43-5"], "A10-4": ["A10-4-153-5"], "A2-1": ["A2-1-26-x-30"], "A2-6": ["A2-6-567-x-570"],
    "A10-2": ["A10-2-58-6", "A10-2-25-9"], "A10-5": ["A10-5-358-6", "A10-5-425-9"],
    "A11-2": ["A11-2-30-8"], "A11-4": ["A11-4-470-4", "A11-4-734-8"],
    "F8-1": ["F8-1-1-2-5-1-2-5-1-q-x-5-1", "F8-1-2-9-10-1-4-10-2-q-x-10-1"], "F9-1": ["F9-1-1-2-5-1-3-10-1-q-x-10-1", "F9-1-2-5-6-1-1-12-2-q-x-12-1"]};
  Object.entries(CLES).forEach(([cle, cles]) => assert.deepEqual(CORE.niveauDe(cle).niveau.imposes.map(x => x.cle), cles, cle));
  assert.ok(await lire("../_serveur/public/prof/defi_calcul_core.js") === await lire("../outils/calcul_mental/defi_calcul_core.js"), "la copie pour la page prof, octet pour octet");
  const html = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(html, /defi_calcul_core\.js\?v=20261127-1/);
  assert.match(html, /defi_calcul_aides\.js\?v=20261125-2/, "le fichier des dessins (lot C4c : les blocs, le tableau des rangs lu)");
  assert.match(await lire("../_serveur/public/VERSION"), /^lot \S+$/m);
});

test("l'option B (toutes les colonnes) n'est pas dans le moteur", async () => {
  const coeur = await lire("../outils/calcul_mental/defi_calcul_core.js");
  assert.doesNotMatch(coeur, /tableauCasserTout|__C4B_CASSER__/);
});

test("Mon module : « J'apprends » dit avec quoi on apprend (les perles, puis le tableau)", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const objet = nom => Function(`return ${page.match(new RegExp(`const ${nom} = Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);`))[1]};`)();
  const detail = objet("DETAIL_APPRENDS");
  const image = objet("OUTILS_IMAGE");
  const outil = a => (a.manipule && a.manipule.outil === "perles" && a.represente.outil === "tableau-rang" ? "perles-tableau" : a.manipule ? a.manipule.outil : image[a.represente.outil] || "aucun");
  const dit = cle => detail[outil(CORE.niveauDe(cle).niveau.apprends)];
  ["A10-1", "A11-1", "A2-1"].forEach(cle => assert.equal(dit(cle), "avec les perles et le tableau de numération", cle));
  // (Les leçons à deux sauts gardent la droite ; A11-3 n'a pas de perles.)
  // (Lot K1b : A11-2, au CP, casse une dizaine sur le tableau ; sa moitié du CE1, A11-4, garde la droite.)
  ["A11-4", "A1-3"].forEach(cle => assert.equal(dit(cle), "avec les perles et la droite", cle));
  assert.equal(dit("A11-2"), "avec les perles et le tableau de numération");
  assert.equal(dit("A11-3"), "avec la droite");
  assert.equal(dit("F8-1"), "avec les bandes de fractions");
});
