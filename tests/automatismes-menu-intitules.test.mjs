// Le menu par intitulés officiels (lot du 15/11/2026) : les données (catalogue/menu.json, tirées du
// référentiel par export_menu.py), le rangement d'un domaine, les leçons et la série tirée des lignes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GROUPES } from "../automatismes/groupes-domaines.js";
import {
  ANNEES,
  anneesValides,
  creerSerieLignes,
  formesDuCatalogue,
  groupeDe,
  ligneJouable,
  lignesDeLAnnee,
  lignesDeLaLecon,
  rangerDomaine,
} from "../automatismes/menu.js";

const lire = async (chemin) =>
  JSON.parse(await readFile(new URL(`../automatismes/catalogue/${chemin}`, import.meta.url)));
const MENU = await lire("menu.json");
const CATALOGUE = await lire("catalogue.json");
const FORMES = formesDuCatalogue(CATALOGUE);
const DOMAINES = [
  "nombres-calculs",
  "proportionnalite-fonctions",
  "espace-geometrie",
  "donnees-probabilites",
  "pensee-informatique",
];

test("menu.json : chaque ligne une fois, ses champs, des questions qui existent dans l'appli", () => {
  const ids = MENU.lignes.map((ligne) => ligne.id);
  assert.equal(new Set(ids).size, ids.length, "chaque intitulé une fois");
  const classes = new Set(MENU.classes.map((classe) => classe.id));
  for (const ligne of MENU.lignes) {
    assert.ok(classes.has(ligne.classe), `${ligne.id} : classe ${ligne.classe}`);
    assert.ok(["A", "O", "CM2", "DNB", "S"].includes(ligne.rubrique), `${ligne.id} : rubrique`);
    assert.ok(DOMAINES.includes(ligne.domaine), `${ligne.id} : domaine`);
    assert.ok(ligne.nom && [...ligne.nom].length <= 97, `${ligne.id} : nom`);
    // Le texte entier n'est écrit que quand le nom est coupé (« … » à la fin).
    if (ligne.texte) assert.match(ligne.nom, / …$/, `${ligne.id} : nom coupé`);
    for (const id of ligne.questions)
      assert.ok(FORMES.has(id), `${ligne.id} : ${id} n'est pas une question de l'appli`);
    assert.equal(new Set(ligne.questions).size, ligne.questions.length, `${ligne.id} : doublon`);
  }
});

test("menu.json : un nombre ne se coupe pas, un signe ne commence pas une ligne", () => {
  for (const ligne of MENU.lignes)
    for (const texte of [ligne.nom, ligne.texte || ""]) {
      assert.doesNotMatch(texte, /\d \d{3}(?!\d)/, `${ligne.id} : « 1 000 » insécable`);
      assert.doesNotMatch(texte, /\S [=+−×÷:;?!]/, `${ligne.id} : signe seul en début de ligne`);
      assert.doesNotMatch(texte, / …/, `${ligne.id} : « … » seul en début de ligne`);
    }
});

test("années : 6e, 5e, 4e, 3e (programme de cette année), Brevet (liste DNB) ; jamais aucune", () => {
  assert.deepEqual(
    ANNEES.map((annee) => [annee.id, annee.classe]),
    [
      ["6e", "6e"],
      ["5e", "5e"],
      ["4e", "4e"],
      ["3e", "3e-2027"],
      ["brevet", "brevet"],
    ],
  );
  assert.ok(lignesDeLAnnee(MENU, "brevet").every((ligne) => ligne.rubrique === "DNB"));
  assert.ok(lignesDeLAnnee(MENU, "brevet").length > 0);
  assert.deepEqual(lignesDeLAnnee(MENU, "inconnue"), []);
  assert.deepEqual(anneesValides(["3e", "4e"]), ["4e", "3e"], "l'ordre du sélecteur");
  assert.deepEqual(anneesValides([]), ["3e"]);
  assert.deepEqual(anneesValides("<b>", ["5e"]), ["5e"]);
  assert.deepEqual(anneesValides(["brevet", "x"]), ["brevet"]);
});

test("rangement : par année, sous les sous-titres du domaine, « A » avant les objectifs", () => {
  for (const domaine of DOMAINES) {
    const blocs = rangerDomaine(MENU, ["4e", "3e"], domaine);
    assert.deepEqual(
      blocs.map((bloc) => bloc.annee),
      ["4e", "3e"],
    );
    const ordre = (GROUPES[domaine] || []).map(([titre]) => titre);
    for (const { annee, groupes } of blocs) {
      const titres = groupes.map((groupe) => groupe.titre);
      // Les sous-titres dans l'ordre des GROUPES, ceux sans groupe (« ») à la fin.
      const connus = titres.filter(Boolean);
      assert.deepEqual(
        connus,
        [...connus].sort((x, y) => ordre.indexOf(x) - ordre.indexOf(y)),
      );
      if (titres.includes("")) assert.equal(titres.at(-1), "");
      const toutes = groupes.flatMap((groupe) => groupe.lignes);
      assert.deepEqual(
        toutes.map((ligne) => ligne.id).sort(),
        lignesDeLAnnee(MENU, annee)
          .filter((ligne) => ligne.domaine === domaine)
          .map((ligne) => ligne.id)
          .sort(),
        `${domaine} ${annee} : toutes les lignes, une fois`,
      );
      for (const groupe of groupes) {
        const rangs = groupe.lignes.map((ligne) => (ligne.rubrique === "A" ? 0 : 1));
        assert.deepEqual(rangs, [...rangs].sort(), `${domaine} ${groupe.titre} : « A » d'abord`);
        for (const ligne of groupe.lignes)
          assert.equal(ordre.includes(groupeDe(ligne)) ? groupeDe(ligne) : "", groupe.titre);
      }
    }
  }
});

test("« bientôt » : une ligne sans question de l'appli ne se joue pas", () => {
  const vides = MENU.lignes.filter((ligne) => !ligneJouable(ligne, FORMES));
  assert.ok(vides.length > 0);
  assert.ok(vides.every((ligne) => ligne.questions.length === 0));
  const sansForme = {
    ...MENU.lignes.find((ligne) => ligne.questions.length),
    questions: ["ZZ99-a"],
  };
  assert.equal(ligneJouable(sansForme, FORMES), false);
});

test("leçons du livret : chapitre → lignes du menu (test de début de leçon)", () => {
  const ids = new Set(MENU.lignes.map((ligne) => ligne.id));
  assert.ok(MENU.lecons.length > 0);
  for (const lecon of MENU.lecons) {
    assert.ok(["4e", "3e"].includes(lecon.niveau), lecon.code);
    assert.ok(lecon.nom && lecon.lignes.length, lecon.code);
    assert.ok(
      lecon.lignes.every((id) => ids.has(id)),
      `${lecon.niveau}-${lecon.code}`,
    );
    assert.equal(lignesDeLaLecon(MENU, lecon.niveau, lecon.code).length, lecon.lignes.length);
  }
  assert.deepEqual(lignesDeLaLecon(MENU, "4e", "XXX"), []);
});

test("série tirée des lignes : leurs questions seulement, chaque ligne servie, même graine = même série", () => {
  const lignes = ["4e-04", "4e-01", "4e-O002"].map((id) =>
    MENU.lignes.find((ligne) => ligne.id === id),
  );
  assert.ok(lignes.every(Boolean));
  const permises = new Set(lignes.flatMap((ligne) => ligne.questions));
  const serie = creerSerieLignes(CATALOGUE, lignes, { graine: 4242, nombre: 12 });
  assert.equal(serie.length, 12);
  for (const question of serie) assert.ok(permises.has(`${question.famille}-${question.forme}`));
  assert.deepEqual(
    new Set(serie.map((question) => question.ligne)),
    new Set(lignes.map((l) => l.id)),
  );
  const encore = creerSerieLignes(CATALOGUE, lignes, { graine: 4242, nombre: 12 });
  assert.deepEqual(
    encore.map((question) => [question.famille, question.forme, question.graine]),
    serie.map((question) => [question.famille, question.forme, question.graine]),
  );
  // Une question commune à deux lignes n'est tirée que pour la première qui la porte.
  const memes = creerSerieLignes(CATALOGUE, [lignes[0], { ...lignes[0], id: "copie" }], {
    graine: 9,
    nombre: 6,
  });
  assert.ok(memes.every((question) => question.ligne === lignes[0].id));
  // Bornes du nombre, graine et lignes vides.
  assert.equal(creerSerieLignes(CATALOGUE, lignes, { graine: 1, nombre: 99 }).length, 40);
  assert.equal(creerSerieLignes(CATALOGUE, lignes, { graine: 1, nombre: -3 }).length, 1);
  assert.throws(() => creerSerieLignes(CATALOGUE, lignes, { graine: 0 }), RangeError);
  assert.throws(() => creerSerieLignes(CATALOGUE, [{ id: "x", questions: [] }], { graine: 5 }));
});

test("série : la question la moins vue d'abord, et pas deux fois le même type tant qu'il en reste", () => {
  const ligne = MENU.lignes.find((entree) => entree.id === "4e-O001");
  const vues = (famille, forme) => (forme === "a" ? 5 : 0);
  const serie = creerSerieLignes(CATALOGUE, [ligne], { graine: 77, nombre: 2 }, vues);
  assert.ok(
    serie.every((question) => question.forme !== "a"),
    "la forme déjà vue attend",
  );
  assert.notEqual(serie[0].forme, serie[1].forme);
});
