<?php
// Page de diagnostic : dit en français ce qui marche et ce qui ne marche pas.

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
$lignes = [];

function verif(array &$lignes, string $titre, callable $test): void
{
    try {
        $lignes[] = ['ok' => true, 'titre' => $titre, 'detail' => (string)$test()];
    } catch (Throwable $e) {
        $lignes[] = ['ok' => false, 'titre' => $titre, 'detail' => $e->getMessage()];
    }
}

verif($lignes, "PHP fonctionne", fn() => "version " . PHP_VERSION);

$configOk = is_file(__DIR__ . '/config.php');
verif($lignes, "Le fichier config.php est en place", function () use ($configOk) {
    if (!$configOk) throw new RuntimeException("Fichier config.php absent : recopie config.exemple.php.");
    return "trouvé";
});

if ($configOk) {
    require __DIR__ . '/lib/bd.php';
    verif($lignes, "Connexion à la base de données", function () {
        bd()->query('SELECT 1');
        return "réussie";
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
    verif($lignes, "Compte prof", function () {
        $nombre = (int)bd()->query('SELECT COUNT(*) FROM profs')->fetchColumn();
        if ($nombre === 0) throw new RuntimeException("aucun compte : ouvre installer.php.");
        return "$nombre compte(s)";
    });
    verif($lignes, "Fichier d'installation supprimé", function () {
        if (is_file(__DIR__ . '/installer.php')) {
            throw new RuntimeException("installer.php est encore là : supprime-le une fois l'installation faite.");
        }
        return "oui";
    });
}

$tout = array_reduce($lignes, fn($acc, $l) => $acc && $l['ok'], true);
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
</style>
</head>
<body>
<main>
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
</main>
</body>
</html>
