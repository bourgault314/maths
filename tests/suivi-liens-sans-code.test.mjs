import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// Lot 3 (03/09/2026, constat C-1 de l'audit) : le code d'un élève ne doit
// apparaître dans AUCUNE adresse. Une adresse entre dans l'historique du
// navigateur, et sur un poste partagé l'historique garderait tous les codes
// de la classe. Les deux pages du serveur qui ouvrent l'appli — l'espace
// élève et « Ma classe » — n'y mettent donc qu'un billet d'entrée (#b=…),
// délivré par le serveur, valable deux minutes, à usage unique.
//
// Ce test est volontairement bête : le mot « code= » ou « fiche= » ne doit
// pas exister dans ces deux fichiers, sous aucune forme, commentaire compris.
// Une retouche qui le ferait revenir est refusée ici avant d'être en ligne.

const PAGES = ["_serveur/public/index.php", "_serveur/public/prof/index.php"];
const INTERDITS = [/code=/, /fiche=/];

for (const chemin of PAGES) {
  const source = readFileSync(join(racine, chemin), "utf8");
  const lignes = source.split(/\r?\n/);

  test(`${chemin} ne construit aucune adresse avec le code d’un élève`, () => {
    for (const motif of INTERDITS) {
      const fautives = lignes
        .map((texte, i) => ({ n: i + 1, texte }))
        .filter(({ texte }) => motif.test(texte));
      assert.deepEqual(
        fautives,
        [],
        `${chemin} : « ${motif.source} » ne doit apparaître nulle part — le code entrerait dans l’historique du navigateur.`
      );
    }
  });

  test(`${chemin} ouvre l’appli par un billet (#b=)`, () => {
    assert.match(source, /#b=\$\{encodeURIComponent\(/, `${chemin} : l’adresse de l’appli doit porter le billet, encodé`);
  });
}

test("l’espace élève demande un billet au serveur, à l’entrée et au clic", () => {
  const source = readFileSync(join(racine, PAGES[0]), "utf8");
  const demandes = source.match(/JSON\.stringify\(\{code, billet: true\}\)/g) || [];
  assert.equal(demandes.length, 2, "une demande à l’entrée (les liens) et une au clic (un billet frais)");
  assert.match(source, /async function billetFrais\(code\)/);
  assert.match(source, /event\.preventDefault\(\);[\s\S]*?const billet = await billetFrais\(code\);/,
    "un clic ordinaire part avec un billet neuf");
});

test("« Ma classe » demande un billet de fiche au clic, pour tous, et n’a plus besoin du code", () => {
  const source = readFileSync(join(racine, PAGES[1]), "utf8");
  assert.match(source, /api\("eleves\.fiche", \{eleve_id: eleve\.id\}\)/, "le billet vient du serveur, sous la session du professeur");
  assert.match(source, /#b=\$\{encodeURIComponent\(r\.billet\)\}&vue=fiche/, "et l’adresse dit « vue=fiche », sans code");
  assert.match(source, /window\.open\("about:blank", "_blank"\)/, "l’onglet s’ouvre dans le geste du clic, avant d’attendre le serveur");
  assert.doesNotMatch(source, /if \(eleve\.code\) \{\s*\n\s*const fiche/, "le bouton n’est plus réservé à ceux qui voient le code : un collègue en lecture a droit à la fiche");
});
