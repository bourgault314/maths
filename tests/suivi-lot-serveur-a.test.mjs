import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");

// Lot serveur A du suivi (06/09/2026) — historique, journal, instantané.
//
// Ce fichier éprouve ce qui se lit dans le CODE : les promesses écrites
// ailleurs (fiche de registre, notice) doivent se retrouver ici, sinon elles
// se démodent en silence. Ce qui s'exécute vraiment — les sept journées, la
// purge, la restauration d'un jour, les lignes de journal — est éprouvé par
// _serveur/tests/lancer.php, qui fait tourner un vrai serveur et une vraie base.
//
// Sabotages attendus (chacun rend un test rouge) :
//  a) faire porter au journal un prénom, un code ou une adresse
//  b) renvoyer les données des versions dans le tableau
//  c) écrire le menu « Revenir à… » par innerHTML
//  d) garder plus de sept journées
//  e) compter les journées en temps universel au lieu de l'heure de La Réunion

const versions = lire("_serveur/public/lib/versions.php");
const journal = lire("_serveur/public/lib/journal.php");
const bd = lire("_serveur/public/lib/bd.php");
const api = lire("_serveur/public/api/prof.php");
const parcours = lire("_serveur/public/api/parcours.php");
const sauvegarde = lire("_serveur/public/sauvegarde.php");
const page = lire("_serveur/public/prof/index.php");
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

test("sept journées, pas plus : le nombre est écrit une seule fois, dans le code", () => {
  assert.match(versions, /const JOURS_HISTORIQUE = 7;/,
    "c'est ce qui a été annoncé à la déléguée à la protection des données");
  assert.match(versions, /DELETE FROM versions WHERE eleve_id = \? AND appli = \? AND jour < \?/,
    "la purge part du même nombre, à chaque enregistrement");
  assert.match(versions, /premier_jour_garde\(\$jour\)/, "et de la même fonction");
});

test("les journées sont découpées à l'heure de La Réunion, nulle part ailleurs", () => {
  assert.match(bd, /const FUSEAU = 'Indian\/Reunion';/, "le fuseau est nommé une fois");
  assert.match(bd, /function jour_local\(/, "et une seule fonction le sert");
  assert.match(versions, /\$jour = jour_local\(\);/, "l'historique s'en sert");
  // La page affiche ces journées : elle doit suivre le même fuseau, sinon un
  // travail du 8 au soir s'annonce « mercredi 9 » sur un ordinateur réglé sur Paris.
  assert.match(fonction("jourLisible"), /timeZone: "Indian\/Reunion"/,
    "l'affichage suit le même fuseau que le découpage");
  assert.match(fonction("jourLisible"), /weekday: "long"/, "« mardi 8 septembre », pas « 08/09/26 »");
});

test("le tableau reçoit les journées et un nombre, jamais les progressions gardées", () => {
  const versionsEleves = versions.slice(versions.indexOf("function versions_des_eleves"));
  const corps = versionsEleves.slice(0, versionsEleves.indexOf("function version_du_jour"));
  assert.match(corps, /SELECT eleve_id, jour, calculs, revision FROM versions/,
    "la requête du tableau ne lit pas la colonne « donnees »");
  assert.ok(!/'donnees'/.test(corps), "et ne la renvoie pas");
  // Le nombre est rangé À L'ÉCRITURE : relire sept progressions par élève à
  // chaque ouverture de la classe, ce sont des mégaoctets pour un menu.
  assert.match(versions, /\$calculs = compter_elements_declares\(\$appli, \$donnees\);/,
    "le nombre est compté une fois, au moment de l'enregistrement");
});

test("le serveur ne compte que ce que l'appli DÉCLARE comme comptable", () => {
  const applis = lire("_serveur/public/lib/applis.php");
  assert.match(applis, /'compteur' => 'calculs',/, "Défi tables déclare « calculs »");
  assert.match(applis, /'compteur' => null,/, "une appli qui ne déclare rien n'est pas comptée");
  const progression = lire("_serveur/public/lib/progression.php");
  const compte = progression.slice(progression.indexOf("function compter_elements_declares"));
  assert.match(compte, /CATALOGUE_APPLIS\[\$appli\]\['compteur'\] \?\? null/,
    "la clé comptée vient du catalogue, jamais d'un nom écrit en dur dans le compteur");
});

test("le journal ne peut pas recevoir de texte libre : trois listes fermées", () => {
  assert.match(journal, /const ACTIONS_JOURNAL = \[/, "les actions");
  assert.match(journal, /const CIBLES_JOURNAL = \[/, "les types de cible");
  assert.match(journal, /const RESULTATS_JOURNAL = \[/, "les résultats");
  assert.match(journal, /if \(!in_array\(\$action, ACTIONS_JOURNAL, true\)\) return;/,
    "une action hors liste n'est pas écrite");
  assert.match(journal, /if \(!in_array\(\$cibleType, CIBLES_JOURNAL, true\)\) return;/,
    "un type de cible hors liste non plus");
  // Les colonnes elles-mêmes ne peuvent porter que des nombres et des mots.
  const schema = bd.slice(bd.indexOf('CREATE TABLE IF NOT EXISTS journal'));
  const table = schema.slice(0, schema.indexOf(')$fin"'));
  for (const interdit of ["prenom", "code", "adresse", "texte", "detail", "commentaire"]) {
    assert.ok(!table.includes(interdit), `la table journal n'a pas de colonne « ${interdit} »`);
  }
  assert.match(journal, /const JOURS_CONSERVATION_JOURNAL = 365;/, "douze mois, comme au registre");
  assert.match(lire("_serveur/public/menage.php"), /purger_journal\(\$pdo\)/,
    "et c'est la tâche planifiée qui les efface");
});

test("un journal en panne n'empêche jamais d'enregistrer ni de saisir", () => {
  const ecrire = journal.slice(journal.indexOf("function journaliser"));
  const corps = ecrire.slice(0, ecrire.indexOf("function purger_journal"));
  assert.match(corps, /catch \(Throwable \$e\) \{\s*\n\s*error_log/,
    "journaliser() avale son erreur : un registre en panne ne ferme pas la classe");
});

test("le journal se lit dans verifier.php, jamais dans « Ma classe »", () => {
  const verifier = lire("_serveur/public/verifier.php");
  assert.match(verifier, /dernieres_lignes_du_journal\(bd\(\), 200\)/, "les 200 dernières lignes");
  assert.match(verifier, /if \(\$autorise\) \{\s*\n\s*try \{\s*\n\s*\$journal = dernieres_lignes_du_journal/,
    "et seulement après le mot de passe d'installation");
  assert.ok(!/journal/i.test(script),
    "« Ma classe » n'est pas un outil de surveillance de collègue : le journal n'y est pas");
});

test("« Revenir à… » écrit ses textes par textContent, et confirme avant d'écraser", () => {
  const proposees = fonction("versionsProposees");
  assert.match(proposees, /eleve\.restaurable/, "la version d'avant le dernier enregistrement");
  assert.match(proposees, /eleve\.journees/, "et les journées gardées");
  assert.match(proposees, /jourLisible\(journee\.jour\)/, "nommées par leur date");
  assert.match(proposees, /journee\.calculs/, "avec leur nombre de calculs");
  const revenir = fonction("revenirA");
  assert.ok(revenir.indexOf("await demander(") < revenir.indexOf('api("eleves.restaurer"'),
    "on choisit et on confirme AVANT d'appeler le serveur");
  assert.equal((revenir.match(/await demander\(/g) || []).length, 2,
    "deux boîtes : choisir la version, puis confirmer en nommant la date");
  assert.ok(!/innerHTML/.test(revenir) && !/innerHTML/.test(proposees),
    "aucun innerHTML : les dates et les nombres viennent du serveur");
  assert.match(revenir, /corps\.jour = choix\.version;/, "le jour choisi part au serveur");
});

test("la restauration d'un jour repasse par le verrou, et ne touche pas l'historique", () => {
  const restaurer = api.slice(api.indexOf("function restaurer_progression"));
  const corps = restaurer.slice(0, restaurer.indexOf("\ntry {"));
  assert.match(corps, /avec_reprise\(\$pdo, function \(\)/, "le même verrou que l'écriture de l'élève");
  assert.match(corps, /pour_mise_a_jour\(\$pdo\)/, "la ligne est verrouillée le temps de l'échange");
  assert.match(corps, /version_du_jour\(\$pdo, \$eleveId, \$appli, \$jour\)/, "la version demandée est relue en base");
  assert.ok(!/enregistrer_version\(/.test(corps),
    "restaurer n'écrit RIEN dans l'historique : sinon on ne pourrait pas revenir deux fois");
  assert.match(api, /if \(!date_reelle\(\$jour\)\) erreur\("Jour à restaurer invalide\.", 400\);/,
    "le jour reçu doit être une vraie date");
});

test("la version du jour s'écrit dans le même verrou que la progression", () => {
  const majour = parcours.slice(parcours.indexOf("$requete = $pdo->prepare('UPDATE progressions SET donnees_avant"));
  const bloc = majour.slice(0, majour.indexOf("transaction_valider($pdo);"));
  assert.match(bloc, /enregistrer_version\(\$pdo, \$eleveId, \$appli, \$donnees, \$revision \+ 1\);/,
    "la version porte l'état APRÈS écriture, et part avec elle ou pas du tout");
});

test("la sauvegarde lit tout dans un instantané, et emporte les deux tables neuves", () => {
  assert.match(sauvegarde, /instantane_ouvrir\(\$pdo\);/, "l'instantané s'ouvre");
  assert.match(sauvegarde, /\} finally \{\s*\n\s*instantane_fermer\(\$pdo\);/, "et se ferme quoi qu'il arrive");
  assert.match(sauvegarde, /\$comptes = comptes_des_tables\(\$pdo\);/, "les comptes sont pris DEDANS");
  const dedans = sauvegarde.slice(sauvegarde.indexOf("function texte_de_la_sauvegarde_dans_l_instantane"));
  assert.ok(dedans.indexOf("$comptes = comptes_des_tables($pdo);") >= 0,
    "sinon l'en-tête annonce un nombre que le corps ne contient pas");
  assert.match(sauvegarde, /'partages', 'versions', 'journal', 'records', 'modeles_evaluation', 'cours_ouvertures'\]/, "les deux tables neuves sont sauvegardées (et « records », lot « Les records » ; « modeles_evaluation », lot E1 ; « cours_ouvertures », lot « cours-ouvertures »)");
});

test("« nouveau code » est une seule transaction", () => {
  const cas = api.slice(api.indexOf("case 'eleves.regenerer':"), api.indexOf("case 'eleves.fiche':"));
  assert.match(cas, /avec_reprise\(\$pdo, function \(\)/, "une transaction avec reprise");
  assert.match(cas, /transaction_ouvrir\(\$pdo\);/, "ouverte");
  assert.match(cas, /transaction_valider\(\$pdo\);/, "et validée");
  assert.match(cas, /transaction_annuler\(\$pdo\);/, "ou annulée en entier");
  assert.ok(cas.indexOf("oublier_billets_de_l_eleve") < cas.indexOf("transaction_valider"),
    "les billets sont révoqués DANS la transaction, avec le changement de code");
});

test("un élève, une classe ou un compte supprimé emporte son historique", () => {
  const archives = lire("_serveur/public/lib/archives.php");
  const auth = lire("_serveur/public/lib/auth.php");
  for (const [nom, source] of [["supprimer_classe", archives], ["supprimer_prof", auth], ["eleves.supprimer", api]]) {
    assert.ok(source.includes("oublier_versions_de_l_eleve"),
      `${nom} doit effacer l'historique des sept jours avec le reste`);
  }
});
