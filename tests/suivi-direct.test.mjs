import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Séance en direct, lot 1 « question éclair » (07/10/2026).
//
// Ce fichier garde ce qui se vérifie EN LISANT le code, et il EXÉCUTE la
// fabrication du fichier de fin de séance telle qu'elle est écrite dans la
// page du tableau. Le comportement du serveur (qui reçoit quoi, ce qui reste
// en base) est éprouvé pour de vrai par `_serveur/tests/lancer.php`, section
// « direct — ».
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) ajouter une colonne « prenom » ou « enonce » à une table directs*
//  b) passer une table directs* dans TABLES_SAUVEGARDEES
//  c) écrire une réponse du serveur par innerHTML dans une des deux pages
//  d) mettre le code de l'élève dans une adresse
//  e) retirer la neutralisation des formules dans cellule()
//  f) afficher un prénom dans la page du tableau
//  g) retirer arreterDirect() du ménage de l'espace élève

const lib = lire("_serveur/public/lib/direct.php");
const bd = lire("_serveur/public/lib/bd.php");
const apiEleve = lire("_serveur/public/api/direct.php");
const apiProf = lire("_serveur/public/api/prof.php");
const pageEleve = lire("_serveur/public/direct.php");
const pageTableau = lire("_serveur/public/prof/direct.php");
const espace = lire("_serveur/public/index.php");

function scriptDe(page) {
  const debut = page.indexOf("<script nonce=");
  return page.slice(page.indexOf(">", debut) + 1, page.lastIndexOf("</script>"));
}

test("les trois tables ne peuvent porter ni nom, ni énoncé, ni note", () => {
  for (const table of ["directs", "directs_questions", "directs_reponses"]) {
    const debut = bd.indexOf(`CREATE TABLE IF NOT EXISTS ${table} (`);
    assert.ok(debut > 0, `la table ${table} est au schéma`);
    const corps = bd.slice(debut, bd.indexOf(')$fin"', debut));
    for (const interdit of ["prenom", "initiale", "code", "enonce", "texte", "note", "libelle", "commentaire"]) {
      assert.ok(!corps.includes(interdit), `${table} n'a pas de colonne « ${interdit} »`);
    }
  }
  assert.match(bd, /reponse VARCHAR\(40\) NOT NULL/, "une réponse est une valeur courte");
  assert.match(bd, /mode VARCHAR\(12\) NOT NULL DEFAULT 'eclair'/,
    "la colonne « mode » existe déjà : une séance d'un autre genre n'obligera pas à modifier la table");
});

test("types et modes sont des listes fermées, et une réponse passe toujours par son type", () => {
  assert.match(lib, /const TYPES_DIRECT = \['choix'\];/, "les types de réponse");
  assert.match(lib, /const MODES_DIRECT = \['eclair'\];/, "les modes de séance");
  assert.match(apiProf, /if \(!in_array\(\$type, TYPES_DIRECT, true\)\) erreur\(/, "un type hors liste est refusé");
  assert.match(apiEleve, /\$reponse = reponse_direct\(\$direct\['type'\], \$direct\['reglage'\], \$corps\['reponse'\]\);/,
    "la réponse de l'élève est remise au propre par son type avant d'être rangée");
  assert.match(lib, /AND d\.etat = 'question'/,
    "et elle n'entre que si la question est ouverte, dans la même instruction que l'écriture");
});

test("rien ne reste : durée bornée, purge à chaque passage, jamais dans la sauvegarde", () => {
  assert.match(lib, /const DUREE_DIRECT = 5400;/, "une heure et demie après le dernier geste du professeur");
  assert.match(apiEleve, /purger_directs\(\$pdo\);/, "chaque interrogation d'élève purge les séances périmées");
  assert.ok(apiProf.includes("case 'direct.etat':") && /case 'direct\.etat':[\s\S]{0,300}purger_directs\(\$pdo\);/.test(apiProf),
    "chaque interrogation du tableau aussi");
  assert.match(lire("_serveur/public/menage.php"), /purger_directs\(\$pdo\)/, "et la tâche planifiée");
  const sauvegarde = lire("_serveur/public/sauvegarde.php");
  const gardees = sauvegarde.slice(sauvegarde.indexOf("const TABLES_SAUVEGARDEES"), sauvegarde.indexOf("];", sauvegarde.indexOf("const TABLES_SAUVEGARDEES")));
  assert.ok(!gardees.includes("directs"), "le CONTENU d'une séance n'entre jamais dans une sauvegarde");
  const structure = sauvegarde.slice(sauvegarde.indexOf("const TABLES_STRUCTURE_SEULE"), sauvegarde.indexOf("];", sauvegarde.indexOf("const TABLES_STRUCTURE_SEULE")));
  for (const table of ["'directs'", "'directs_questions'", "'directs_reponses'"]) {
    assert.ok(structure.includes(table), `la structure de ${table} y est : un serveur restauré doit marcher`);
  }
});

test("une classe, un compte ou un élève supprimé emporte la séance et les réponses", () => {
  assert.ok(lire("_serveur/public/lib/archives.php").includes("oublier_direct_de_la_classe($pdo, $classeId);"), "supprimer_classe");
  assert.ok(lire("_serveur/public/lib/auth.php").includes("oublier_direct_de_la_classe($pdo, $classeId);"), "supprimer_prof");
  const cas = apiProf.slice(apiProf.indexOf("case 'eleves.supprimer':"), apiProf.indexOf("case 'tableau':"));
  assert.ok(cas.includes("oublier_reponses_direct_de_l_eleve"), "eleves.supprimer");
});

test("interroger ne compte rien : seules les réponses passent par le limiteur", () => {
  const avantReponse = apiEleve.slice(apiEleve.indexOf("try {"), apiEleve.indexOf("if (array_key_exists('reponse', $corps))"));
  assert.ok(!/\blimiter\(/.test(avantReponse), "aucun compteur incrémenté sur une simple interrogation");
  assert.match(apiEleve, /limiter\('direct:' \. \$code, 120, 300\);/, "120 réponses par code et par cinq minutes");
  assert.match(apiEleve, /compter_echec_adresse\(\$adresse\);/, "un code inconnu compte comme un échec, comme ailleurs");
});

test("l'élève ne reçoit ni la répartition ni la bonne réponse", () => {
  const fonction = apiEleve.slice(apiEleve.indexOf("function etat_du_direct_pour_l_eleve"), apiEleve.indexOf("try {"));
  for (const interdit of ["bonne", "repartition", "repondu", "inscrits"]) {
    assert.ok(!fonction.includes(`'${interdit}'`), `la réponse à l'élève n'a pas de clé « ${interdit} »`);
  }
});

// Lot 2 : la page du tableau charge en plus deux fichiers D'ICI (KaTeX, copié
// dans vendor/, et le lecteur de questionnaire), chacun avec une version qui
// suit son contenu. Aucun autre.
for (const [nom, page, externes] of [
  ["direct.php (élève)", pageEleve, []],
  ["prof/direct.php (tableau)", pageTableau, ["../vendor/katex-0.16.47/katex.min.js", "questionnaire.js"]],
]) {
  test(`${nom} : nonce, aucun script d'ailleurs, rien du serveur en HTML`, () => {
    const balises = [...page.matchAll(/<script\b((?:\?>|[^>])*?)>/g)];
    const enLigne = balises.filter((balise) => !/\bsrc=/.test(balise[1]));
    assert.equal(enLigne.length, 1, "un seul script écrit dans la page");
    assert.match(enLigne[0][1], /nonce="<\?= htmlspecialchars\(\$nonce, ENT_QUOTES\) \?>"/, "il porte le nonce");
    const sources = balises.filter((balise) => /\bsrc=/.test(balise[1])).map((balise) => /src="([^"?]+)\?v=<\?= htmlspecialchars\(\$version[A-Za-z]+, ENT_QUOTES\) \?>"/.exec(balise[1]));
    assert.ok(sources.every(Boolean), "chaque script chargé porte une version qui suit son contenu");
    assert.deepEqual(sources.map((trouve) => trouve[1]), externes, "aucun autre script que ceux d'ici");
    assert.doesNotMatch(page, /\son[a-z]+="/i, "pas d'attribut on…=");
    assert.doesNotMatch(page, /https?:\/\//, "aucune adresse d'un autre domaine");
    const script = scriptDe(page);
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(script),
      "tout ce qui vient du serveur entre par textContent ou createElement");
    assert.match(script, /const RENDUS = \{\s*\n\s*choix: \{/, "un rendu par type de réponse : c'est là qu'on en ajoute un");
  });
}

test("le code de l'élève ne voyage que dans le corps d'un POST", () => {
  const script = scriptDe(pageEleve);
  assert.match(script, /fetch\("api\/direct\.php", \{\s*\n\s*method: "POST",/, "POST");
  assert.match(script, /body: JSON\.stringify\(Object\.assign\(\{code\}, corps \|\| \{\}\)\)/, "le code est dans le corps");
  assert.ok(!/[?&]code=/.test(pageEleve) && !/location[^;\n]*code/.test(script), "jamais dans une adresse");
  assert.match(script, /if \(code\.length !== 6\) \{ window\.location\.replace\("\.\/"\); return; \}/,
    "sans code dans l'onglet, la page renvoie à l'espace sans rien montrer");
});

test("l'espace élève : la tuile n'existe que pendant une séance, et part avec le ménage", () => {
  assert.match(espace, /<a class="appli direct-lien" id="direct-lien" href="direct\.php" hidden>/, "cachée par défaut");
  assert.match(espace, /\$\("direct-lien"\)\.hidden = !donnees\.direct;/, "montrée seulement si le serveur annonce une séance");
  const menage = espace.slice(espace.indexOf("  function revenirAuCode() {"), espace.indexOf("  $(\"changer\")"));
  assert.ok(menage.includes("arreterDirect();"), "« Se déconnecter » arrête la surveillance et retire la tuile");
  const arret = espace.slice(espace.indexOf("  function arreterDirect() {"), espace.indexOf("  async function demanderDirect"));
  assert.ok(arret.includes("clearTimeout") && arret.includes('$("direct-lien").hidden = true;'), "arreterDirect fait les deux");
});

test("la page du tableau ne met aucun prénom dans le document", () => {
  const script = scriptDe(pageTableau);
  const fichier = script.slice(script.indexOf("  function fabriquerFichier("), script.indexOf("  function nomDuFichier("));
  const sansFichier = script.replace(fichier, "");
  assert.ok(!/prenom|initiale/.test(sansFichier), "les prénoms ne servent qu'à fabriquer le fichier, en mémoire");
  assert.ok(script.indexOf('await api("direct.fichier")') < script.indexOf('await api("direct.terminer")'),
    "le fichier est pris AVANT l'effacement : un téléchargement raté ne perd rien");
});

// La fabrication du fichier, exécutée telle qu'elle est écrite dans la page.
function fabrique() {
  const script = scriptDe(pageTableau);
  const debut = script.indexOf("  function cellule(valeur) {");
  const fin = script.indexOf("  function telecharger(");
  assert.ok(debut > 0 && fin > debut, "cellule(), fabriquerFichier() et nomDuFichier() sont dans la page");
  return new Function("RENDUS", script.slice(debut, fin) + "\nreturn {cellule, fabriquerFichier, nomDuFichier};")(
    {choix: {cellule: (reponse) => reponse || ""}});
}

const CONTENU = {
  classe: {libelle: "4e 5 / Dopamine"},
  jour: "2026-10-07",
  questions: [
    {numero: 1, type: "choix", reglage: {choix: 4}, bonne: "B"},
    {numero: 2, type: "choix", reglage: {choix: 2}, bonne: null},
    {numero: 3, type: "choix", reglage: {choix: 4}, bonne: "D"},
  ],
  eleves: [
    {prenom: "Léa", initiale: "B", reponses: {"1": "B", "2": "A", "3": "D"}},
    {prenom: "Noah", initiale: "", reponses: {"1": "A", "3": "D"}},
    {prenom: "", initiale: "", reponses: {}},
    {prenom: "=1+1", initiale: "X", reponses: {"1": "B"}},
    {prenom: 'Jean;"Luc"', initiale: "P", reponses: {}},
  ],
};

test("le fichier : une ligne par élève, une colonne par question, le compte des bonnes réponses", () => {
  const texte = fabrique().fabriquerFichier(CONTENU);
  assert.ok(texte.startsWith("﻿"), "marque d'ordre des octets : Excel lit les accents");
  const lignes = texte.slice(1).split("\r\n");
  assert.equal(lignes[0], "Élève;Q1;Q2;Q3;Bonnes réponses (sur 2)", "seules les questions corrigées comptent");
  assert.equal(lignes[1], "Bonne réponse;B;;D;");
  assert.equal(lignes[2], "Léa B.;B;A;D;2");
  assert.equal(lignes[3], "Noah;A;;D;1", "une question sans réponse reste vide");
  assert.equal(lignes[4], "(sans prénom);;;;0");
  assert.equal(lignes[5], "'=1+1 X.;B;;;1", "un prénom qui ressemble à une formule est neutralisé");
  assert.equal(lignes[6], '"Jean;""Luc"" P.";;;;0', "point-virgule et guillemets sont protégés");
  assert.equal(lignes[7], "", "le fichier finit par un retour à la ligne");
});

test("le fichier sans aucune bonne réponse désignée n'invente pas de note", () => {
  const texte = fabrique().fabriquerFichier({...CONTENU, questions: CONTENU.questions.map((q) => ({...q, bonne: null}))});
  const lignes = texte.slice(1).split("\r\n");
  assert.equal(lignes[0], "Élève;Q1;Q2;Q3");
  assert.equal(lignes[1], "Léa B.;B;A;D", "ni ligne « Bonne réponse », ni colonne de compte");
});

test("le nom du fichier : la classe, le jour, rien qui gêne Windows", () => {
  const {nomDuFichier} = fabrique();
  assert.equal(nomDuFichier(CONTENU), "seance-en-direct-4e-5-Dopamine-2026-10-07.csv");
  assert.equal(nomDuFichier({classe: {libelle: "../../é"}, jour: "n'importe"}), "seance-en-direct-e.csv");
  assert.equal(nomDuFichier({}), "seance-en-direct-classe.csv");
});

test("le tableau partage le verrou d'inactivité de « Ma classe »", () => {
  const script = scriptDe(pageTableau);
  const maClasse = lire("_serveur/public/prof/index.php");
  for (const cle of ['"mathsgo-suivi-jeton"', '"mathsgo-suivi-prof-dernier-geste"']) {
    assert.ok(script.includes(cle) && maClasse.includes(cle), `la clé ${cle} est la même dans les deux pages`);
  }
  assert.match(script, /const INACTIVITE_MS = 30 \* 60 \* 1000;/, "trente minutes, comme « Ma classe »");
  assert.match(script, /if \(veilleDepassee\(\)\) \{ versMaClasse\(\); return; \}/, "contrôlé avant d'afficher quoi que ce soit");
  assert.match(maClasse, /window\.location\.assign\("direct\.php#classe=" \+ encodeURIComponent\(classe\.id\)\)/,
    "« Ma classe » y mène, la classe dans l'ancre");
});
