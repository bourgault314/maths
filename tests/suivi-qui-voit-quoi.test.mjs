import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Lot « Qui voit quoi », lot 2 « le serveur » (22/10/2026). Ce qu'un élève
// voit = ce que voit sa classe + ce qu'on lui a donné en plus (eleves.ajouts,
// JSON) ; le serveur calcule et rend « applis » / « reglages » à l'élève, et
// « ajouts » / « acces » au professeur. Les vrais tests sont dans
// _serveur/tests/lancer.php (283 tests, serveur joué) ; ceux-ci épinglent, sans
// serveur, ce qui doit rester vrai dans les fichiers.

const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const bd = lire("_serveur/public/lib/bd.php");
const applis = lire("_serveur/public/lib/applis.php");
const prof = lire("_serveur/public/api/prof.php");
const eleve = lire("_serveur/public/api/eleve.php");
const journal = lire("_serveur/public/lib/journal.php");

test("la colonne eleves.ajouts est dans le schéma des bases neuves, dans la mise à niveau, et dans le SQL généré", () => {
  assert.match(bd, /initiale VARCHAR\(4\) NOT NULL DEFAULT '',\n  cree_le VARCHAR\(25\) NOT NULL,\n  ajouts TEXT NULL"/, "schema() : la colonne des élèves");
  assert.match(bd, /if \(table_existe\(\$pdo, 'eleves'\) && !colonne_existe\(\$pdo, 'eleves', 'ajouts'\)\) \{\n\s+\$pdo->exec\('ALTER TABLE eleves ADD COLUMN ajouts TEXT NULL'\);/, "migrer_schema() l'ajoute");
  assert.match(lire("_serveur/sql/schema-mysql.sql"), /cree_le VARCHAR\(25\) NOT NULL,\n  ajouts TEXT NULL,\n  UNIQUE KEY eleves_code/, "sql/schema-mysql.sql régénéré (php _serveur/outils/generer-sql.php)");
});

test("la règle « classe + ajouts » est à un seul endroit, et les deux API y passent", () => {
  assert.match(applis, /function acces_de_l_eleve\(array \$classe, \?string \$ajoutsJson\): array/, "lib/applis.php la définit");
  assert.equal((applis.match(/function acces_de_l_eleve\(/g) || []).length, 1);
  for (const fn of ["ajouts_disponibles", "ajouts_lus", "ajouts_recus", "ajouts_json", "ajouts_pour_la_base", "acces_json"]) {
    assert.match(applis, new RegExp(`function ${fn}\\(`), `${fn}() dans lib/applis.php`);
  }
  // api/eleve.php : par le code et à l'échange du billet, jamais la classe seule.
  assert.equal((eleve.match(/acces_affichable\(\$eleve\)/g) || []).length, 2, "deux fois : par le code, par le billet");
  assert.match(eleve, /acces_de_l_eleve\(\$eleve, isset\(\$eleve\['ajouts'\]\) \? \(string\)\$eleve\['ajouts'\] : null\)/);
  assert.match(eleve, /\(ajouts_disponibles\(\$pdo\) \? ', e\.ajouts' : ''\)/, "la colonne n'est demandée que si elle existe (avant migrer.php, rien ne casse)");
  assert.doesNotMatch(eleve, /applis_de_classe\(|reglages_de_classe\(/, "plus de calcul « classe seule » dans l'API élève");
  // api/prof.php : eleves.acces et le tableau.
  assert.match(prof, /case 'eleves\.acces':/);
  assert.match(prof, /\$eleve = eleve_pour_action\(\$pdo, \$profId, \$corps\['eleve_id'\] \?\? 0, \$action\);\n\s+if \(!ajouts_disponibles\(\$pdo\)\) \{/, "l'élève est remonté à SA classe, puis la colonne est exigée (503 sinon)");
  assert.match(prof, /\$ajouts = ajouts_recus\(\$corps\['ajouts'\] \?\? null\);/, "lecture stricte");
  assert.match(prof, /UPDATE eleves SET ajouts = \? WHERE id = \?/, "remplace la colonne entière");
  assert.match(prof, /journaliser\(\$pdo, \$profId, 'eleves\.acces', 'eleve', \(int\)\$eleve\['id'\]\);/, "journalisée sur l'élève");
  assert.match(prof, /'ajouts' => ajouts_json\(ajouts_lus\(\$avecAjouts \? \$ligne\['ajouts'\] : null\)\),\n\s+'acces' => acces_json\(acces_de_l_eleve\(\$classe, \$avecAjouts \? \$ligne\['ajouts'\] : null\)\),/, "tableau : le rangé et le calculé par élève");
  assert.match(prof, /\$eleve\['classe'\] = acces_classe\(\$pdo, \$profId, \(int\)\$eleve\['classe_id'\], droit_requis\(\$action\), \$action\);/, "eleve_pour_action rend la classe vérifiée");
});

test("les droits, le journal, le catalogue et parcours.php", () => {
  assert.match(prof, /'eleves\.acces' => 'proprietaire',/, "propriétaire seulement (Q2)");
  assert.match(journal, /'eleves\.acces',/, "dans la liste fermée du journal");
  assert.match(prof, /const APPLIS_PROPOSABLES = \['defi-tables', 'coffres', 'automatismes', 'splat'\];/,
    "pas de « flash-anzan » tant que le lot 4 n'a pas mis l'appli au catalogue du serveur");
  assert.doesNotMatch(applis, /'flash-anzan'/, "l'appli n'est pas encore au catalogue");
  assert.doesNotMatch(lire("_serveur/public/api/parcours.php"), /ajouts|acces_de_l_eleve/, "api/parcours.php : inchangé (Q1 = non — ouvrir guide, ça ne verrouille pas)");
  assert.match(lire("_serveur/public/verifier.php"), /verif\(\$lignes, "Ajouts par élève", function \(\) \{/, "verifier.php a sa ligne");
});

test("l'écriture est stricte : appli ouverte du catalogue, réglages « liste » déclarés, numéros dans les bornes, pas de liste vide ; la lecture est indulgente", () => {
  const recus = applis.slice(applis.indexOf("function ajouts_recus("), applis.indexOf("function ajouts_json("));
  assert.match(recus, /throw new InvalidArgumentException\("Ajouts illisibles\."\)/);
  assert.match(recus, /if \(!is_string\(\$cle\) \|\| !appli_ouverte\(\$cle\)\) throw new InvalidArgumentException\("Application inconnue\."\)/);
  assert.match(recus, /throw new InvalidArgumentException\("Ajout illisible\."\)/);
  assert.match(recus, /if \(!array_key_exists\(\$nom, \$declares\)\) throw new InvalidArgumentException\("Réglage inconnu\."\)/);
  assert.match(recus, /throw new InvalidArgumentException\(libelle_liste\(\$nom, 'illisible'\)\)/);
  assert.match(recus, /throw new InvalidArgumentException\(libelle_liste\(\$nom, 'inconnu'\)\)/);
  assert.match(recus, /if \(\$numeros === \[\]\) throw new InvalidArgumentException\("Une liste vide n'ajoute rien : retire plutôt l'activité\."\)/);
  assert.match(applis, /function listes_declarees\(string \$cle\): array[\s\S]*?if \(is_int\(\$defaut\)\) \$listes\[\$nom\] = \$defaut;/,
    "seuls les réglages « liste de numéros » se donnent par élève — jamais un booléen (records)");
  const lus = applis.slice(applis.indexOf("function ajouts_lus("), applis.indexOf("function ajouts_recus("));
  assert.doesNotMatch(lus, /throw /, "la lecture de la base ne lève jamais");
  assert.match(lus, /if \(!is_string\(\$cle\) \|\| !appli_ouverte\(\$cle\) \|\| !is_array\(\$ajoutBrut\)\) continue;/);
});
