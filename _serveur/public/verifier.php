<?php
// Page de diagnostic : dit en français ce qui marche et ce qui ne marche pas.
//
// Elle ne montre rien sans le mot de passe d'installation (jeton_installation
// de config.php) : version de PHP, nombre de comptes ou état de la base sont
// des renseignements utiles à un attaquant, pas au public. Seule exception :
// tant que config.php n'existe pas, elle le dit — il n'y a rien d'autre à
// protéger à ce stade.

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

$configOk = is_file(__DIR__ . '/config.php');
$autorise = false;
$message = '';
$lignes = [];

function verif(array &$lignes, string $titre, callable $test): void
{
    try {
        $lignes[] = ['ok' => true, 'titre' => $titre, 'detail' => (string)$test()];
    } catch (Throwable $e) {
        // Les exceptions techniques (PDO…) peuvent citer l'hôte ou l'utilisateur
        // de la base : on ne relaie que les messages écrits par nous.
        $detail = ($e instanceof RuntimeException && !($e instanceof PDOException))
            ? $e->getMessage() : "échec (détail dans le journal d'erreurs du serveur).";
        error_log('verifier: ' . $e->getMessage());
        $lignes[] = ['ok' => false, 'titre' => $titre, 'detail' => $detail];
    }
}

if (!$configOk) {
    $lignes[] = ['ok' => false, 'titre' => "Le fichier config.php est en place",
        'detail' => "Fichier config.php absent : recopie config.exemple.php."];
} else {
    require __DIR__ . '/lib/bd.php';
    require __DIR__ . '/lib/reponse.php';
    require __DIR__ . '/lib/limite.php';
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        try {
            $attendu = (string)(config()['jeton_installation'] ?? '');
            if ($attendu === '' || $attendu === 'à-remplacer') {
                $message = "Renseigne d'abord « jeton_installation » dans config.php.";
            } elseif (!hash_equals($attendu, (string)($_POST['jeton'] ?? ''))) {
                $message = "Mot de passe d'installation incorrect.";
            } else {
                $autorise = true;
            }
        } catch (Throwable $e) {
            error_log('verifier: ' . $e->getMessage());
            $message = "Le fichier config.php ne se lit pas : vérifie sa syntaxe.";
        }
    }
}

if ($autorise) {
    verif($lignes, "PHP fonctionne", fn() => "version " . PHP_VERSION);
    verif($lignes, "Connexion à la base de données", function () {
        try {
            $pdo = bd();
            $pdo->query('SELECT 1');
            // La version compte : le limiteur emploie une instruction propre à
            // chaque moteur (MySQL/MariaDB ou SQLite), jouée à la ligne suivante.
            $version = pilote($pdo) === 'sqlite'
                ? 'SQLite ' . (string)$pdo->query('SELECT sqlite_version()')->fetchColumn()
                : (string)$pdo->query('SELECT VERSION()')->fetchColumn();
        } catch (PDOException $e) {
            error_log('verifier: ' . $e->getMessage());
            throw new RuntimeException("la base ne répond pas : vérifie hôte, base, utilisateur et mot de passe dans config.php.");
        }
        return "réussie — " . $version;
    });
    verif($lignes, "Tables du suivi", function () {
        $pdo = bd();
        $manquantes = [];
        foreach (['classes', 'eleves', 'progressions', 'profs', 'partages', 'sessions_prof', 'compteurs'] as $table) {
            try { $pdo->query("SELECT 1 FROM $table LIMIT 1"); }
            catch (Throwable $e) { $manquantes[] = $table; }
        }
        if ($manquantes !== []) {
            throw new RuntimeException("manquantes : " . implode(', ', $manquantes) . " — ouvre installer.php (première installation) ou migrer.php (mise à niveau).");
        }
        return "toutes présentes";
    });
    // Ce que la mise à niveau du 30/08/2026 devait ajouter. Une table présente
    // ne suffit pas : il faut aussi les colonnes, sinon l'API tombe en panne.
    verif($lignes, "Cloisonnement des classes", function () {
        $pdo = bd();
        $manquants = [];
        if (!table_existe($pdo, 'partages')) $manquants[] = "la table « partages »";
        if (!colonne_existe($pdo, 'classes', 'prof_id')) $manquants[] = "la colonne « classes.prof_id »";
        if (!colonne_existe($pdo, 'profs', 'admin')) $manquants[] = "la colonne « profs.admin »";
        if ($manquants !== []) {
            throw new RuntimeException(
                "manque " . implode(', ', $manquants) . " — relance migrer.php avec ton mot de passe d'installation.");
        }
        $administrateurs = (int)$pdo->query('SELECT COUNT(*) FROM profs WHERE admin = 1')->fetchColumn();
        if ($administrateurs === 0) {
            throw new RuntimeException("aucun compte administrateur — relance migrer.php.");
        }
        return "propriétaire, partages et administrateur en place";
    });
    // Mise à niveau du lot A2 (30/08/2026) : révision et version précédente des
    // progressions, et les colonnes réservées au lot S2.
    verif($lignes, "Synchronisation (révisions)", function () {
        $pdo = bd();
        $manquants = [];
        foreach ([['progressions', 'revision'], ['progressions', 'donnees_avant'], ['profs', 'actif'], ['profs', 'mdp_temporaire']] as [$table, $colonne]) {
            if (!colonne_existe($pdo, $table, $colonne)) $manquants[] = "$table.$colonne";
        }
        if ($manquants !== []) {
            throw new RuntimeException("manque " . implode(', ', $manquants) . " — relance migrer.php avec ton mot de passe d'installation.");
        }
        return "révision et version précédente en place";
    });
    // Le limiteur d'essais s'écrit avec une instruction propre à chaque moteur
    // (MySQL chez OVH, SQLite dans les tests) : on la joue ici, sur la vraie
    // base, pour voir qu'elle passe. Deux passages doivent compter 2.
    verif($lignes, "Limiteur d'essais", function () {
        $pdo = bd();
        $cle = 'verification:' . bin2hex(random_bytes(4));
        limiter($cle, 1000, 60);
        limiter($cle, 1000, 60);
        $requete = $pdo->prepare('SELECT nombre FROM compteurs WHERE cle = ?');
        $requete->execute([cle_compteur($cle, 60)]);
        $nombre = (int)$requete->fetchColumn();
        $pdo->prepare('DELETE FROM compteurs WHERE cle = ?')->execute([cle_compteur($cle, 60)]);
        if ($nombre !== 2) {
            throw new RuntimeException("le compteur vaut $nombre au lieu de 2 : l'instruction UPSERT ne passe pas sur cette base.");
        }
        $lignesCompteurs = (int)$pdo->query('SELECT COUNT(*) FROM compteurs')->fetchColumn();
        return "en place ($lignesCompteurs compteur(s) en cours, purgés à chaque appel)";
    });
    verif($lignes, "Compte prof", function () {
        $nombre = (int)bd()->query('SELECT COUNT(*) FROM profs')->fetchColumn();
        if ($nombre === 0) throw new RuntimeException("aucun compte : ouvre installer.php.");
        return "$nombre compte(s)";
    });
    verif($lignes, "Fichiers d'installation supprimés", function () {
        $restants = [];
        foreach (['installer.php', 'migrer.php'] as $fichier) {
            if (is_file(__DIR__ . '/' . $fichier)) $restants[] = $fichier;
        }
        if ($restants !== []) {
            throw new RuntimeException(implode(' et ', $restants) . " encore là : à supprimer une fois l'opération faite.");
        }
        return "oui";
    });
}

$tout = $lignes !== [] && array_reduce($lignes, fn($acc, $l) => $acc && $l['ok'], true);
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Vérification du serveur de suivi</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f5f7fa; color: #1c2b3a; }
  main { max-width: 36rem; margin: 3rem auto; background: #fff; padding: 1.5rem; border-radius: 12px;
         box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 1.3rem; margin-top: 0; }
  ul { list-style: none; padding: 0; }
  li { padding: .6rem 0; border-top: 1px solid #e6ecf2; }
  .etat { font-weight: 700; }
  .oui { color: #1a7f37; } .non { color: #b42318; }
  .detail { color: #5b6b7c; }
  label { display: block; margin: 1rem 0 .3rem; font-weight: 600; }
  input { width: 100%; box-sizing: border-box; padding: .7rem; font-size: 1rem;
          border: 1px solid #b9c6d4; border-radius: 8px; }
  button { margin-top: 1.4rem; min-height: 44px; padding: 0 1.2rem; font-size: 1rem; font-weight: 600;
           color: #fff; background: #1d6fb8; border: 0; border-radius: 8px; cursor: pointer; }
  .message { margin-top: 1rem; padding: .8rem 1rem; border-radius: 8px; background: #fdf3d8; }
</style>
</head>
<body>
<main>
  <?php if ($autorise || !$configOk): ?>
    <h1><?= $tout ? 'Tout est en ordre' : 'Il reste quelque chose à régler' ?></h1>
    <ul>
      <?php foreach ($lignes as $l): ?>
        <li>
          <span class="etat <?= $l['ok'] ? 'oui' : 'non' ?>"><?= $l['ok'] ? '✓' : '✗' ?></span>
          <?= htmlspecialchars($l['titre'], ENT_QUOTES) ?>
          <div class="detail"><?= htmlspecialchars($l['detail'], ENT_QUOTES) ?></div>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php else: ?>
    <h1>Vérification du serveur de suivi</h1>
    <form method="post" autocomplete="off">
      <label for="jeton">Mot de passe d'installation</label>
      <input id="jeton" name="jeton" type="password" required autofocus>
      <button type="submit">Vérifier</button>
    </form>
    <?php if ($message !== ''): ?>
      <div class="message"><?= htmlspecialchars($message, ENT_QUOTES) ?></div>
    <?php endif; ?>
  <?php endif; ?>
</main>
</body>
</html>
