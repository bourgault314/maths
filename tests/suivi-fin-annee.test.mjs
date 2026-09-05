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
// Sabotages attendus (chacun rend un test rouge) :
//  a) faire commencer l'année scolaire au 1er septembre (calendrier métropolitain)
//  b) retirer le garde-fou des 21 jours sans activité
//  c) retirer de la confirmation ce qui va être supprimé, ou le bilan
//  d) laisser deux chemins de suppression différents dans le serveur

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
  // Rentrée mi-août, fin des cours début juillet : le pivot est le 1er août.
  assert.match(archives, /\$debut = \$mois >= 8 \? \$an : \$an - 1;/,
    "pivot au 1er août — une rentrée métropolitaine (septembre) laisserait les prénoms de l'an dernier "
    + "dans la base pendant la rentrée réunionnaise");
  assert.match(archives, /'-08-01'/, "la suppression tombe le 1er août");
  assert.match(archives, /'-07-01'/, "le préavis commence le 1er juillet");
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

test("la page annonce la fin d'année : ce qui vient de partir, ou le préavis", () => {
  const annonce = fonction("annoncerFinAnnee");
  assert.match(annonce, /donnees\.supprimees_maintenant/, "ce que le serveur vient de supprimer");
  assert.match(annonce, /donnees\.preavis_fin_annee/, "et le préavis de juillet");
  assert.ok(annonce.includes("1er août"), "la date est dite en toutes lettres");
  assert.ok(annonce.includes("il n’en reste rien") || annonce.includes("il n’en restera rien"),
    "et le fait qu'il ne reste rien");
  assert.ok(annonce.includes("sauvegarde"), "avec le rappel de la sauvegarde, seul recours");
  // Le préavis ne s'affiche pas s'il n'y a aucune classe en cours à prévenir.
  assert.match(annonce, /donnees\.preavis_fin_annee && combienEnCours/);
});

test("aucune trace d'une classe passée ne survit dans la page", () => {
  // Pas de section « archives », pas de ligne de bilan gardée : le choix du
  // 05/09/2026 est « on supprime tout et on repart ».
  assert.ok(!/archiv/i.test(script), "plus aucune notion d'archive dans la page");
  assert.ok(!/archiv/i.test(page.slice(0, page.indexOf(BALISE))), "ni dans son HTML");
  assert.ok(!/archivee_le|arch_eleves|arch_actifs|arch_reussite/.test(api),
    "ni aucune colonne d'archive côté serveur");
});
