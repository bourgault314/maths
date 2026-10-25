// Serveur pro, lot 5e (25/10/2026) : la séance en direct réservée au compte
// administrateur, pour l'instant. Décision de Gwenaël : il la teste avant que
// les collègues s'en servent ; les évaluations restent ouvertes à tous.
//
// Ce que ce fichier épingle (le comportement est éprouvé pour de bon dans
// _serveur/tests/lancer.php, bloc « lot 5e ») :
//  - UN seul endroit à changer pour la rouvrir : la constante de lib/direct.php ;
//  - le serveur refuse avant tout cas, pour TOUTES les actions direct.* ;
//  - les évaluations ne passent pas par cette garde ;
//  - la page suit le serveur (« moi »), le tableau dit la phrase.
//
// Rougit si l'on :
//  a) remet la décision dans la page seulement (garde retirée du serveur) ;
//  b) écrit la règle ailleurs qu'à la constante (un « admin » en dur) ;
//  c) nomme une action d'évaluation « direct.… » ;
//  d) laisse le tableau repartir sans un mot sur ce refus.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const lire = chemin => readFileSync(new URL(`../_serveur/public/${chemin}`, import.meta.url), "utf8");
const libDirect = lire("lib/direct.php");
const apiProf = lire("api/prof.php");
const maClasse = lire("prof/index.php");
const tableau = lire("prof/direct.php");

test("lot 5e — une seule constante décide, et elle dit « réservée » aujourd'hui", () => {
  assert.match(libDirect, /^const DIRECT_RESERVE_A_L_ADMINISTRATEUR = true;$/m, "la constante, à true");
  assert.match(libDirect, /function direct_ouvert_au_compte\(bool \$admin\): bool\s*\{\s*return \$admin \|\| !DIRECT_RESERVE_A_L_ADMINISTRATEUR;\s*\}/,
    "la règle lue à un seul endroit");
  const code = apiProf.split("\n").filter(ligne => !/^\s*\/\//.test(ligne)).join("\n");
  const usages = [...code.matchAll(/DIRECT_RESERVE_A_L_ADMINISTRATEUR/g)];
  assert.equal(usages.length, 0, "api/prof.php ne relit pas la constante : il passe par direct_ouvert_au_compte()");
});

test("lot 5e — le serveur garde toutes les actions direct.*, avant leur cas", () => {
  const garde = apiProf.slice(apiProf.indexOf("function garder_direct_reserve("), apiProf.indexOf("function mode_direct_visible("));
  assert.match(garde, /if \(!str_starts_with\(\$action, 'direct\.'\)\) return;/, "toutes les actions direct.*, par leur préfixe");
  assert.match(garde, /if \(direct_ouvert_au_compte\(\$prof\['admin'\]\)\) return;/, "l'administrateur passe");
  assert.match(garde, /journaliser\(\$pdo, \$prof\['id'\], \$action, 'compte', 0, 'refus'\);/, "refus journalisé");
  assert.match(garde, /'raison' => 'direct_reserve'\], 403\);/, "403 avec sa raison");
  assert.match(apiProf, /garder_actions_admin\(\$pdo, \$prof, \$action\);\s*garder_direct_reserve\(\$pdo, \$prof, \$action\);\s*switch \(\$action\) \{/,
    "appelée juste avant l'aiguillage, après la garde des comptes");
  const casDirect = [...apiProf.matchAll(/case '(direct\.[a-z_]+)':/g)].map(m => m[1]);
  assert.deepEqual(casDirect.sort(), ["direct.bonne", "direct.devoiler", "direct.etat", "direct.fichier", "direct.ouvrir", "direct.question", "direct.terminer"],
    "les sept actions de la séance, toutes sous le préfixe gardé");
  assert.ok(![...apiProf.matchAll(/case '(evaluation\.[a-z_]+)':/g)].some(m => m[1].startsWith("direct.")),
    "aucune action d'évaluation sous le préfixe");
});

test("lot 5e — la pastille d'une question éclair ne sort pas pour qui ne peut pas la mener ; celle d'une évaluation, si", () => {
  assert.match(apiProf, /if \(\$mode === 'eclair' && !direct_ouvert_au_compte\(\$prof\['admin'\]\)\) return null;/);
  assert.match(apiProf, /'direct' => \$droit === 'lecture' \? null : mode_direct_visible\(/, "menu « 405 ▾ » (classes.liste)");
  assert.match(apiProf, /\? mode_direct_visible\(modes_des_directs_ouverts\(\$pdo, \[\(int\)\$classe\['id'\]\]\)/, "« Reprendre » (tableau)");
  assert.match(apiProf, /'direct' => direct_ouvert_au_compte\(\$prof\['admin'\]\)\]\);/, "« moi » le dit à la page");
});

test("lot 5e — Ma classe cache « Séance en direct » d'après « moi », et l'oublie à la déconnexion", () => {
  assert.match(maClasse, /let directPermis = false;/);
  assert.match(maClasse, /directPermis = donnees\.direct === true;/, "lu dans « moi », vrai seulement si le serveur le dit");
  assert.match(maClasse, /estAdmin = false;\s*directPermis = false;/, "remis à faux à la déconnexion");
  assert.match(maClasse, /\$\("seance-direct"\)\.hidden = !ecriture \|\| !directPermis;/);
  // La carte Évaluations ne demande pas au collègue de terminer une séance qu'il ne peut pas mener.
  assert.match(maClasse, /: "Une séance en direct est en cours pour cette classe : l’évaluation pourra s’ouvrir quand elle sera terminée\."\)\);/);
  assert.match(apiProf, /: "Une séance en direct est en cours pour cette classe : l'évaluation pourra s'ouvrir quand elle sera terminée\.", 409\);/);
});

test("lot 5e — le tableau ouvert par son adresse dit la phrase, n'interroge plus, et « Ma classe » ramène dans la classe", () => {
  assert.match(tableau, /erreur\.raison = \(donnees && donnees\.raison\) \|\| "";/);
  assert.match(tableau, /if \(erreur\.raison === "direct_reserve"\) \{\s*reserve = erreur\.message;\s*window\.clearTimeout\(minuteur\);/);
  assert.match(tableau, /if \(enAction \|\| reserve\) return;/, "plus d'interrogation");
  assert.match(tableau, /window\.clearTimeout\(minuteur\);\s*if \(reserve\) return;/, "plus rien de planifié");
  assert.match(tableau, /if \(reserve\) \{\s*scene\.append\(titre\("Séance en direct"\), ligne\("sous", reserve\)\);\s*return;\s*\}/, "la phrase, dans la page");
  assert.ok(!/innerHTML/.test(tableau.slice(tableau.indexOf("let reserve"), tableau.indexOf("function retenir("))), "rien par innerHTML");
});
