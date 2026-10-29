<?php
// Sauvegarde de la base — À DÉPOSER LE TEMPS DE LA FAIRE, PUIS À SUPPRIMER.
//
// Elle produit un fichier SQL complet (structure et contenu de toutes les
// tables du suivi), CHIFFRÉ avant de quitter le serveur avec une phrase que
// toi seul connais. Le format est celui d'openssl, pas un format à moi : le
// fichier se déchiffre dans dix ans avec une ligne de commande ordinaire,
// même si ce projet n'existe plus.
//
//   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -md sha256 \
//     -in suivi-AAAA-MM-JJ.sql.enc -out suivi-AAAA-MM-JJ.sql
//
// (Repli sans openssl : php _serveur/outils/dechiffrer.php <fichier>.)
//
// verifier.php devient ROUGE tant que ce fichier reste en ligne.
// Mode d'emploi complet, rythme et rangement : _serveur/EXPLOITATION.md.

declare(strict_types=1);

require __DIR__ . '/lib/bd.php';
require __DIR__ . '/lib/limite.php';
require_once __DIR__ . '/lib/entetes.php';

// Sur toutes les réponses, y compris le fichier téléchargé.
entetes_securite();

// « versions » (historique de sept jours) et « journal » (actions des
// professeurs, douze mois) sont arrivés le 06/09/2026 : une sauvegarde doit
// rendre un serveur ENTIER, pas seulement les progressions du jour.
// Lot E1 (15/10/2026) : « modeles_evaluation », les modèles d'évaluation des
// tables de chaque professeur — des réglages, pas une donnée d'élève.
const TABLES_SAUVEGARDEES = ['profs', 'classes', 'eleves', 'progressions', 'partages', 'versions', 'journal', 'records', 'modeles_evaluation'];
// sessions_prof, compteurs et billets : leur STRUCTURE part dans la
// sauvegarde, leur CONTENU non. Ils ne tiennent que des jetons à durée de vie
// courte (sessions ouvertes, compteurs de cinq minutes, liens d'entrée de deux
// minutes) : les restaurer serait remettre en service des jetons périmés.
//
// Mais les OUBLIER complètement était une erreur, trouvée le 05/09/2026 en
// faisant vraiment la restauration : sur une base neuve, les trois tables
// n'existaient pas, et la première connexion d'un professeur répondait 500
// (l'écriture de sa session n'avait nulle part où aller). Une sauvegarde doit
// rendre un serveur qui MARCHE, pas seulement des données.
// Séance en direct (07/10/2026) : ses trois tables suivent la même règle, pour
// une raison de plus — les réponses d'une séance ne doivent survivre nulle
// part, et surtout pas dans un fichier de sauvegarde gardé des mois.
const TABLES_STRUCTURE_SEULE = ['sessions_prof', 'compteurs', 'billets',
    'directs', 'directs_questions', 'directs_reponses'];
const ITERATIONS_PBKDF2 = 200000;

// Le fichier SQL, en clair, tel qu'on le rendrait à phpMyAdmin.
//
// TOUT est lu dans un même INSTANTANÉ (lib/bd.php) depuis le 06/09/2026,
// COMPTES COMPRIS — constat I-06 de l'audit de ChatGPT. Les tables étaient
// lues l'une après l'autre, hors transaction : un élève qui enregistrait
// pendant l'export (une classe de 4e à 10 h, c'est une écriture par calcul)
// pouvait laisser un fichier où sa progression existe mais pas son élève, ou
// un en-tête « eleves : 27 ligne(s) » suivi de 28 INSERT. Une sauvegarde qui
// ne se recolle pas est pire que pas de sauvegarde : on ne s'en aperçoit que
// le jour où on la restaure.
function texte_de_la_sauvegarde(PDO $pdo): string
{
    instantane_ouvrir($pdo);
    try {
        return texte_de_la_sauvegarde_dans_l_instantane($pdo);
    } finally {
        instantane_fermer($pdo);
    }
}

function texte_de_la_sauvegarde_dans_l_instantane(PDO $pdo): string
{
    $comptes = comptes_des_tables($pdo);
    $mysql = pilote($pdo) === 'mysql';
    $sql = "-- Sauvegarde du serveur de suivi maths&go (suivi.mathsgo.re)\n";
    $sql .= "-- date : " . maintenant() . "\n";
    foreach ($comptes as $table => $nombre) {
        $sql .= "-- $table : $nombre ligne(s)\n";
    }
    $sql .= "-- " . implode(', ', TABLES_STRUCTURE_SEULE) . " : structure seule (jetons de courte durée)\n";
    $sql .= "-- Restauration : voir _serveur/EXPLOITATION.md\n";
    $sql .= $mysql ? "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n" : "";
    $sql .= "\n";

    foreach (array_merge(tables_sauvegardees($pdo), TABLES_STRUCTURE_SEULE) as $table) {
        $avecContenu = in_array($table, TABLES_SAUVEGARDEES, true);
        $sql .= "-- ------------------------------------------------------------ $table\n";
        if (!$avecContenu) {
            $sql .= "-- structure seule : cette table ne contient que des jetons de courte durée\n";
        }
        $sql .= "DROP TABLE IF EXISTS `$table`;\n";
        if ($mysql) {
            $creation = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM);
            $sql .= $creation[1] . ";\n";
        } else {
            // Sur SQLite (les tests), le schéma du dépôt fait foi.
            foreach (schema('mysql') as $instruction) {
                if (str_contains($instruction, "EXISTS $table (")) $sql .= $instruction . ";\n";
            }
        }
        if (!$avecContenu) { $sql .= "\n"; continue; }
        $lignes = $pdo->query("SELECT * FROM `$table`");
        foreach ($lignes as $ligne) {
            $colonnes = array_map(fn($nom) => "`$nom`", array_keys($ligne));
            $valeurs = array_map(function ($valeur) use ($pdo) {
                if ($valeur === null) return 'NULL';
                if (is_int($valeur)) return (string)$valeur;
                return $pdo->quote((string)$valeur);
            }, array_values($ligne));
            $sql .= "INSERT INTO `$table` (" . implode(', ', $colonnes) . ") VALUES ("
                . implode(', ', $valeurs) . ");\n";
        }
        $sql .= "\n";
    }
    if ($mysql) $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    return $sql;
}

// Le format « Salted__ » d'openssl : 8 octets de marque, 8 octets de sel, puis
// AES-256-CBC. Clé et vecteur tirés de la phrase par PBKDF2-SHA256.
function chiffrer_comme_openssl(string $clair, string $phrase): string
{
    $sel = random_bytes(8);
    $matiere = hash_pbkdf2('sha256', $phrase, $sel, ITERATIONS_PBKDF2, 48, true);
    $chiffre = openssl_encrypt($clair, 'aes-256-cbc', substr($matiere, 0, 32),
        OPENSSL_RAW_DATA, substr($matiere, 32, 16));
    if ($chiffre === false) throw new RuntimeException("Le chiffrement a échoué.");
    return "Salted__" . $sel . $chiffre;
}

// Les tables à sauvegarder qui EXISTENT : « records » (lot « Les records »)
// n'arrive qu'avec migrer.php — une sauvegarde faite avant ne doit pas
// tomber en panne dessus.
function tables_sauvegardees(PDO $pdo): array
{
    return array_values(array_filter(TABLES_SAUVEGARDEES, fn(string $table): bool => table_existe($pdo, $table)));
}

function comptes_des_tables(PDO $pdo): array
{
    $comptes = [];
    foreach (tables_sauvegardees($pdo) as $table) {
        $comptes[$table] = (int)$pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
    }
    return $comptes;
}

$message = '';
$autorise = false;
$comptes = [];
$jetonSaisi = '';
$chiffrementPossible = function_exists('openssl_encrypt');

try {
    $pdo = bd();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        // Le frein partagé de lib/limite.php (verdict_jeton_installation),
        // le même que secours.php, migrer.php, installer.php et verifier.php
        // depuis le lot « correctifs de l'audit Codex » (29/10/2026) : dix
        // échecs par bloc d'adresse et par dix minutes, toutes pages
        // confondues ; les réussites ne comptent pas. On compte soi-même :
        // limiter() répondrait en JSON sur une page HTML.
        $verdict = verdict_jeton_installation((string)($_POST['jeton'] ?? ''));
        if ($verdict !== 'ok') {
            $message = message_jeton_installation($verdict);
        } else {
            $autorise = true;
            $jetonSaisi = (string)($_POST['jeton'] ?? '');
            $comptes = comptes_des_tables($pdo);
            $phrase = (string)($_POST['phrase'] ?? '');
            $repete = (string)($_POST['repete'] ?? '');
            if (($_POST['etape'] ?? '') === 'telecharger') {
                if ($phrase !== $repete) {
                    $message = "Les deux phrases saisies ne sont pas les mêmes.";
                } elseif (strlen($phrase) < 12 && $chiffrementPossible) {
                    $message = "La phrase de chiffrement doit faire au moins 12 caractères : c'est elle qui protège tout le fichier.";
                } else {
                    $clair = texte_de_la_sauvegarde($pdo);
                    $jour = gmdate('Y-m-d');
                    if ($chiffrementPossible) {
                        $corps = chiffrer_comme_openssl($clair, $phrase);
                        $nom = "suivi-$jour.sql.enc";
                    } else {
                        // Sans openssl chez l'hébergeur, on rend le fichier EN
                        // CLAIR plutôt que rien — et on le dit dans son nom.
                        $corps = $clair;
                        $nom = "suivi-$jour-EN-CLAIR-A-CHIFFRER.sql";
                    }
                    header('Content-Type: application/octet-stream');
                    header('Content-Disposition: attachment; filename="' . $nom . '"');
                    header('Content-Length: ' . strlen($corps));
                    header('Cache-Control: no-store');
                    echo $corps;
                    exit;
                }
            }
        }
    }
} catch (Throwable $e) {
    error_log('sauvegarde: ' . $e->getMessage());
    $message = "La sauvegarde n'a pas pu se faire (détail dans le journal d'erreurs du serveur).";
    $autorise = false;
}

header('Content-Type: text/html; charset=utf-8');
entetes_page();
header('X-Robots-Tag: noindex, nofollow');
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Sauvegarde — serveur de suivi maths&go</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f5f7fa; color: #1c2b3a; }
  main { max-width: 34rem; margin: 3rem auto; background: #fff; padding: 1.5rem; border-radius: 12px;
         box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 1.3rem; margin-top: 0; }
  p.intro { color: #4a5b6e; }
  label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
  input { width: 100%; box-sizing: border-box; padding: .7rem; font-size: 1rem;
          border: 1px solid #b9c6d4; border-radius: 8px; }
  button { margin-top: 1.4rem; min-height: 44px; padding: 0 1.2rem; font-size: 1rem; font-weight: 600;
           color: #fff; background: #1d6fb8; border: 0; border-radius: 8px; cursor: pointer; }
  .message { margin-top: 1rem; padding: .8rem 1rem; border-radius: 8px; background: #fdf3d8; }
  .apres { margin-top: 1.2rem; padding: .8rem 1rem; border-radius: 8px; background: #fdecec;
           font-weight: 600; color: #b42318; }
  ul { margin: .6rem 0 0; padding-left: 1.2rem; color: #4a5b6e; }
</style>
</head>
<body>
<main>
  <h1>Sauvegarde de la base du suivi</h1>
  <p class="intro">Le fichier produit contient toutes les classes, tous les élèves
  et toutes les progressions. Il est chiffré avant de quitter le serveur : sans
  la phrase, il est illisible. Note bien cette phrase — sans elle, la sauvegarde
  ne sert à rien.</p>
  <?php if (!$chiffrementPossible): ?>
    <p class="apres">L'extension openssl manque sur cet hébergement : le fichier sortira EN CLAIR.
    Chiffre-le toi-même dès qu'il est sur ton ordinateur (archive 7-Zip avec mot de passe, AES-256).</p>
  <?php endif; ?>
  <?php if ($message !== ''): ?>
    <p class="message"><?= htmlspecialchars($message, ENT_QUOTES) ?></p>
  <?php endif; ?>
  <form method="post" autocomplete="off">
    <input type="hidden" name="etape" value="<?= $autorise ? 'telecharger' : 'compter' ?>">
    <?php if ($autorise): ?>
      <!-- Le mot de passe d'installation est gardé ici pour ne pas te le faire
           retaper à la seconde étape : c'est celui que tu viens de saisir, sur
           une page que le navigateur n'a pas le droit de mettre en cache. -->
      <input type="hidden" name="jeton" value="<?= htmlspecialchars($jetonSaisi, ENT_QUOTES) ?>">
    <?php else: ?>
      <label for="jeton">Mot de passe d'installation (celui de config.php)</label>
      <input id="jeton" name="jeton" type="password" required autofocus>
    <?php endif; ?>
    <?php if ($autorise): ?>
      <p class="intro">Ce que contient la base en ce moment :</p>
      <ul>
        <?php foreach ($comptes as $table => $nombre): ?>
          <li><?= htmlspecialchars($table, ENT_QUOTES) ?> : <?= (int)$nombre ?> ligne(s)</li>
        <?php endforeach; ?>
      </ul>
      <p class="intro">Recopie ces nombres dans le journal des sauvegardes
      (<code>_serveur/EXPLOITATION.md</code>) : c'est ce qu'on recompte après une restauration.</p>
      <label for="phrase">Phrase de chiffrement (12 caractères au moins)</label>
      <input id="phrase" name="phrase" type="password" required autofocus>
      <label for="repete">La même, pour être sûr</label>
      <input id="repete" name="repete" type="password" required>
      <button type="submit">Télécharger la sauvegarde chiffrée</button>
    <?php else: ?>
      <button type="submit">Continuer</button>
    <?php endif; ?>
  </form>
  <p class="apres">SUPPRIME le fichier sauvegarde.php du serveur dès que le
  téléchargement est fini.</p>
</main>
</body>
</html>
