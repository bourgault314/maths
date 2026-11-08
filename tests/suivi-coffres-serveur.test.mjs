// Lot « Coffres magiques sur le suivi » (21/10/2026) : le serveur de suivi
// apprend Coffres magiques. Ce fichier épingle le TEXTE des fichiers PHP (le
// test PHP de _serveur/tests/lancer.php, lui, fait passer les parcours et les
// réglages par le vrai serveur) : les listes d'applis, la généralisation des
// réglages « liste de numéros ouverts », verifier.php.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const catalogue = lire("_serveur/public/lib/applis.php");

test("l'API élève accepte « coffres », et le professeur peut le proposer à une classe (sinon la création la retire en silence)", () => {
  assert.match(lire("_serveur/public/api/parcours.php"), /const APPLIS_CONNUES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/);
  assert.match(lire("_serveur/public/api/prof.php"), /const APPLIS_PROPOSABLES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat', 'cours'\];/);
});

test("les réglages « liste de numéros ouverts » sont généraux : mondes de SPLAT!, niveaux et opérations de Coffres, chacun avec ses mots", () => {
  assert.match(catalogue, /const LIBELLES_LISTES = \[\s*'mondes' => \['illisible' => "Liste de mondes illisible\.", 'inconnu' => "Monde inconnu\.",\s*'dernier' => "Une classe garde au moins un monde ouvert\."\],\s*'niveaux' => \['illisible' => "Liste de niveaux illisible\.", 'inconnu' => "Niveau inconnu\.",\s*'dernier' => "Une classe garde au moins un niveau ouvert\."\],\s*'operations' => \['illisible' => "Liste d'opérations illisible\.", 'inconnu' => "Opération inconnue\.",\s*'dernier' => "Une classe garde au moins une opération ouverte\."\],\s*\];/);
  assert.match(catalogue, /function liste_lue\(mixed \$liste, int \$nombre\): \?array/);
  assert.match(catalogue, /function mondes_lus\(mixed \$liste, int \$nombre\): \?array\s*\{\s*return liste_lue\(\$liste, \$nombre\);/, "l'ancien nom reste");
  // reglages_lus et reglages_recus parcourent les réglages déclarés : un entier = une liste, « true » = un booléen.
  assert.match(catalogue, /if \(is_int\(\$defaut\)\) \{\s*\$liste = liste_lue\(\$reglageBrut\[\$nom\] \?\? null, \$defaut\);/);
  assert.match(catalogue, /if \(!is_array\(\$liste\) \|\| !array_is_list\(\$liste\)\) throw new InvalidArgumentException\(libelle_liste\(\$nom, 'illisible'\)\);/);
  assert.match(catalogue, /if \(\$numeros === \[\]\) throw new InvalidArgumentException\(libelle_liste\(\$nom, 'dernier'\)\);/);
  assert.match(catalogue, /'reglages' => \['mondes' => 6\],/, "SPLAT! garde ses six mondes");
  assert.match(catalogue, /'reglages' => \['niveaux' => 3, 'operations' => 4\],/);
});

test("verifier.php contrôle le moteur Coffres servi localement", () => {
  const verifier = lire("_serveur/public/verifier.php");
  assert.match(verifier, /verif\(\$lignes, "Moteur Coffres magiques servi localement", function \(\) \{\s*\$chemin = __DIR__ \. '\/prof\/coffres-parcours\.js';/);
  assert.match(verifier, /'MathsGoCoffresParcours'/);
});

test("la page prof et l'espace élève ne chargent le moteur Coffres que d'ici, à la demande", () => {
  const prof = lire("_serveur/public/prof/index.php");
  assert.match(prof, /\$moteurCoffres = __DIR__ \. '\/coffres-parcours\.js';/);
  assert.doesNotMatch(prof, /<script src="coffres-parcours\.js/, "pas chargé d'office");
  assert.match(prof, /script\.src = MOTEUR_COFFRES;/);
  const espace = lire("_serveur/public/index.php");
  assert.match(espace, /url: "prof\/coffres-parcours\.js\?v=<\?= htmlspecialchars\(\$versionCoffres, ENT_QUOTES\) \?>",\s*global: "MathsGoCoffresParcours",/);
});
