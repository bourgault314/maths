<?php
// Régénère sql/schema-mysql.sql à partir de la définition unique du schéma.
// Usage : php outils/generer-sql.php [--verifier]

declare(strict_types=1);
require __DIR__ . '/../public/lib/bd.php';

$sql = "-- Schéma du serveur de suivi maths&go — fichier GÉNÉRÉ.\n"
     . "-- Ne pas modifier à la main : éditer schema() dans public/lib/bd.php\n"
     . "-- puis relancer : php outils/generer-sql.php\n\n"
     . implode(";\n\n", schema('mysql')) . ";\n";

$chemin = dirname(__DIR__) . '/sql/schema-mysql.sql';
if (in_array('--verifier', $argv, true)) {
    $actuel = is_file($chemin) ? file_get_contents($chemin) : '';
    if ($actuel !== $sql) {
        fwrite(STDERR, "sql/schema-mysql.sql est désynchronisé : relance php outils/generer-sql.php\n");
        exit(1);
    }
    echo "Schéma SQL à jour.\n";
    exit(0);
}
file_put_contents($chemin, $sql);
echo "sql/schema-mysql.sql régénéré.\n";
