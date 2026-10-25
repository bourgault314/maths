import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "_serveur/public/prof/index.php";
const API = "_serveur/public/api/prof.php";
const ARCHIVES = "_serveur/public/lib/archives.php";

// Lot 12 du suivi (05/09/2026) — la fin d'année scolaire.
//
// La règle : les prénoms, les codes et les progressions d'une année scolaire
// sont supprimés au plus tard le 1er août qui suit. Il n'en reste RIEN — pas
// de ligne de bilan, pas de compteur, pas de nom de classe.
//
// Ce qui se vérifie ici, c'est la LOGIQUE de la page : ce que la confirmation
// annonce avant d'effacer, ce que les bandeaux disent, et le calendrier écrit
// dans le code. Le reste (les tables réellement vidées, le 1er août, le
// garde-fou des 21 jours, le cloisonnement entre professeurs) est éprouvé côté
// serveur par _serveur/tests/lancer.php, qui exécute vraiment les suppressions.
//
// MIS À JOUR LE 06/09/2026 (lot serveur A) : le pivot de l'année scolaire est
// passé au 1er JUILLET, et ouvrir « Ma classe » ne supprime PLUS rien — le
// professeur est interrogé, la suppression automatique reste chez menage.php.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) faire commencer l'année scolaire au 1er août ou au 1er septembre
//  b) retirer le garde-fou des 21 jours sans activité
//  c) retirer de la confirmation ce qui va être supprimé, ou le bilan
//  d) laisser deux chemins de suppression différents dans le serveur
//  e) remettre supprimer_classes_echues() dans classes.liste
//  f) supprimer les classes échues sans passer par une confirmation

const page = readFileSync(join(racine, PAGE), "utf8");
const api = readFileSync(join(racine, API), "utf8");
const archives = readFileSync(join(racine, ARCHIVES), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne de la page prof doit être trouvé");
  return page.slice(debut, fin);
})();

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(position, i + 1);
    }
  }
  throw new Error("bloc non fermé");
}

function fonction(nom) {
  const position = script.indexOf(`function ${nom}(`);
  assert.ok(position > 0, `la page doit définir ${nom}()`);
  return blocDepuis(script, position);
}

const gestionnaireSuppression = (() => {
  const position = script.indexOf('$("supprimer-classe").addEventListener');
  assert.ok(position > 0, "la page doit brancher « Supprimer la classe »");
  return blocDepuis(script, position);
})();

test("le calendrier de La Réunion est écrit dans le code, pas seulement dans une notice", () => {
  // Rentrée mi-août, fin des cours début juillet. Le pivot est le 1er JUILLET
  // depuis le 06/09/2026 : une classe préparée pendant les vacances appartient
  // à l'année qui vient. Avec le 1er août, elle naissait « échue » et
  // disparaissait à la rentrée — c'est arrivé, en vrai (constat 2 de l'audit).
  assert.match(archives, /\$debut = \$mois >= 7 \? \$an : \$an - 1;/,
    "pivot au 1er juillet — au 1er août, la classe préparée le 25 juillet est rangée dans l'année "
    + "écoulée et supprimée à la rentrée réunionnaise");
  assert.match(archives, /'-08-01'/, "la suppression tombe le 1er août");
  assert.match(archives, /'-06-01'/, "le préavis commence le 1er juin");
});

test("l'activité d'une classe, ce n'est pas seulement ce que les élèves enregistrent", () => {
  // Préparer une classe et saisir vingt-cinq prénoms est de l'activité. Sans
  // cela, une classe entière préparée en août partait trois semaines plus tard.
  const activite = archives.slice(archives.indexOf("function derniere_activite_de_la_classe"));
  const corps = activite.slice(0, activite.indexOf("function classes_echues"));
  assert.match(corps, /MAX\(p\.maj_le\)/, "les enregistrements des élèves comptent");
  assert.match(corps, /MAX\(e\.cree_le\)/, "la création des élèves aussi");
  assert.match(corps, /\$jour = substr\(\$creeLe, 0, 10\);/, "et la création de la classe reste le plancher");
});

test("une classe encore utilisée n'est jamais supprimée par surprise", () => {
  assert.match(archives, /JOURS_SANS_ACTIVITE_AVANT_SUPPRESSION = 21/,
    "trois semaines sans un enregistrement avant toute suppression automatique");
  assert.match(archives, /if \(!\$classe\['mure'\]\) continue;/,
    "la suppression automatique respecte ce garde-fou");
  // classes_echues ne modifie rien : c'est ce que verifier.php affiche avant.
  const echues = archives.slice(archives.indexOf("function classes_echues"));
  assert.ok(!/DELETE|UPDATE|INSERT/.test(echues.slice(0, echues.indexOf("function supprimer_classe"))),
    "classes_echues() doit rester en lecture seule : elle sert à voir AVANT d'effacer");
});

test("il n'y a qu'un seul chemin de suppression dans le serveur", () => {
  // Le bouton « Supprimer la classe » et la fin d'année passent par la même
  // fonction : deux codes qui effacent les mêmes tables, c'est deux occasions
  // d'en oublier une.
  assert.match(api, /supprimer_classe\(\$pdo, \(int\)\$classe\['id'\]\);/,
    "classes.supprimer doit appeler la fonction partagée");
  assert.ok(!/DELETE FROM eleves WHERE classe_id/.test(api),
    "aucune suppression de classe écrite à la main dans l'API");
  for (const table of ["progressions", "eleves", "partages", "classes"]) {
    assert.ok(archives.includes(`DELETE FROM ${table}`), `supprimer_classe doit vider ${table}`);
  }
  assert.match(archives, /oublier_compteurs_du_code/, "et les compteurs des codes");
  assert.match(archives, /oublier_billets_de_l_eleve/, "et les billets d'entrée");
  assert.match(archives, /supprimer_classes_echues[\s\S]*supprimer_classe\(\$pdo, \$classe\['id'\]\)/,
    "la fin d'année passe par la même fonction");
});

test("la confirmation montre le bilan de l'année, puis dit qu'il ne restera rien", () => {
  for (const mot of ["Bilan de l’année", "Note ces chiffres maintenant",
                     "prénom", "code", "progressions", "définitive", "sauvegarde"]) {
    assert.ok(gestionnaireSuppression.includes(mot), `la confirmation doit parler de « ${mot} »`);
  }
  assert.match(gestionnaireSuppression, /await demander\(/, "rien ne s'efface sans un oui explicite");
  assert.ok(gestionnaireSuppression.indexOf("await demander(") < gestionnaireSuppression.indexOf('api("classes.supprimer"'),
    "on demande AVANT d'appeler le serveur");
  assert.match(gestionnaireSuppression, /bouton\.disabled = true;/, "deux clics ne font pas deux suppressions");
});

test("le bilan est calculé avec le moteur, montré, et jamais envoyé au serveur", () => {
  const compte = fonction("combienAuBoutDesTables");
  assert.match(compte, /if \(!PARCOURS \|\| !PARCOURS\.TABLES\) return null;/,
    "sans le moteur, on n'invente pas de nombre");
  assert.match(compte, /acquises\.length === PARCOURS\.TABLES\.length/,
    "« au bout » = toutes les tables acquises");
  const bilan = fonction("texteBilanDeLaClasse");
  assert.ok(!/prenom|initiale|nomAffiche|\.code\b/.test(bilan),
    "le bilan ne nomme personne : que des nombres");
  // Rien de ce bilan ne part au serveur : le corps de l'appel ne porte que l'id.
  assert.match(gestionnaireSuppression, /api\("classes\.supprimer", \{classe_id: classe\.id\}\)/,
    "on n'envoie que l'identifiant de la classe — aucun chiffre n'est enregistré");
});

test("ouvrir « Mes classes » ne supprime plus rien : le serveur PROPOSE, le professeur décide", () => {
  // Le changement du 06/09/2026. Avant, classes.liste appelait la suppression
  // automatique : ouvrir la liste effaçait, sans un mot et sans retour.
  const liste = api.slice(api.indexOf("case 'classes.liste':"), api.indexOf("case 'classes.creer':"));
  assert.ok(!/supprimer_classes_echues/.test(liste),
    "classes.liste ne doit plus appeler la suppression automatique");
  assert.match(liste, /classes_a_proposer\(\$pdo, \$profId\)/, "elle renvoie ce qui pourrait être supprimé");
  assert.match(liste, /'echues' => \$echues/, "sous la clé « echues »");
  // La suppression automatique existe toujours — mais chez menage.php seul.
  const menage = readFileSync(join(racine, "_serveur/public/menage.php"), "utf8");
  assert.match(menage, /supprimer_classes_echues\(\$pdo\)/,
    "la tâche planifiée reste ce qui tient la promesse du 1er août");
});

// Les longues phrases de la page sont écrites en morceaux (`…` + `…`) pour
// tenir dans la largeur : on les recolle avant de chercher un mot, sinon
// « il n'en restera rien » coupé en deux passerait pour absent.
function recolle(source) {
  return source.replace(/`\s*\+\s*`/g, "");
}

test("la page annonce la fin d'année : ce qu'elle propose de supprimer, ou le préavis", () => {
  const annonce = recolle(fonction("annoncerFinAnnee"));
  assert.match(annonce, /donnees\.echues/, "les classes que le serveur propose de supprimer");
  assert.match(annonce, /donnees\.preavis_fin_annee/, "et le préavis de fin d'année");
  assert.ok(annonce.includes("1er août"), "la date est dite en toutes lettres");
  assert.ok(annonce.includes("il n’en reste rien") || annonce.includes("il n’en restera rien"),
    "et le fait qu'il ne reste rien");
  // Lot « textes justes » (24/10/2026) : « Fais ta sauvegarde avant » était
  // faux — le professeur n'a aucun bouton de sauvegarde (elle est réservée à
  // l'exploitation). Ce qu'il peut faire, c'est imprimer.
  assert.ok(!annonce.includes("sauvegarde"), "plus de sauvegarde que le professeur n'a pas");
  assert.ok(annonce.includes("Imprime avant ce que tu veux garder"), "ce qu'il peut faire, lui : imprimer");
  // Le préavis ne s'affiche pas s'il n'y a aucune classe en cours à prévenir.
  assert.match(annonce, /donnees\.preavis_fin_annee && combienEnCours/);
  // Le bandeau nomme les classes, dit ce qui disparaît, et que le ménage de
  // l'été n'attend pas « Me le rappeler plus tard » (menage.php).
  const texte = recolle(fonction("texteDesEchues"));
  assert.ok(!texte.includes("sauvegarde"), "pas de sauvegarde que le professeur n'a pas");
  for (const mot of ["libelle", "Prénoms", "codes", "progressions", "le ménage automatique de l’été peut"]) {
    assert.ok(texte.includes(mot), `le bandeau doit parler de « ${mot} »`);
  }
});

test("le bandeau ne supprime rien sans un oui explicite, et « Plus tard » n'écrit rien", () => {
  const position = script.indexOf('$("supprimer-echues").addEventListener');
  assert.ok(position > 0, "la page doit brancher le bouton de suppression");
  const gestionnaire = blocDepuis(script, position);
  assert.match(gestionnaire, /await demander\(/, "rien ne s'efface sans un oui explicite");
  assert.ok(gestionnaire.indexOf("await demander(") < gestionnaire.indexOf('api("classes.supprimer_echues"'),
    "on demande AVANT d'appeler le serveur");
  assert.match(gestionnaire, /définitive/, "la confirmation dit que c'est définitif");
  assert.match(gestionnaire, /bouton\.disabled = true;/, "deux clics ne font pas deux suppressions");
  // « Plus tard » ne fait que masquer : le bandeau revient à la prochaine ouverture.
  const tard = blocDepuis(script, script.indexOf('$("echues-plus-tard").addEventListener'));
  assert.ok(!/api\(/.test(tard), "« Plus tard » n'appelle pas le serveur");
  assert.ok(!/localStorage|sessionStorage/.test(tard), "et n'enregistre rien nulle part");
});

test("aucune trace d'une classe passée ne survit dans la page", () => {
  // Pas de section « archives », pas de ligne de bilan gardée : le choix du
  // 05/09/2026 est « on supprime tout et on repart ».
  assert.ok(!/archiv/i.test(script), "plus aucune notion d'archive dans la page");
  assert.ok(!/archiv/i.test(page.slice(0, page.indexOf(BALISE))), "ni dans son HTML");
  assert.ok(!/archivee_le|arch_eleves|arch_actifs|arch_reussite/.test(api),
    "ni aucune colonne d'archive côté serveur");
});
