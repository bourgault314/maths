<?php
// Connexion à la base et création des tables.
// Fonctionne avec MySQL (OVH) et SQLite (tests) : même code, même schéma logique.

declare(strict_types=1);

function config(): array
{
    static $config = null;
    if ($config !== null) return $config;
    $chemin = dirname(__DIR__) . '/config.php';
    if (!is_file($chemin)) {
        throw new RuntimeException("Le fichier config.php est absent du serveur.");
    }
    $config = require $chemin;
    return $config;
}

function bd(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $c = config()['bd'];
    if (isset($c['dsn'])) {
        $dsn = $c['dsn'];
        $utilisateur = $c['utilisateur'] ?? null;
        $motdepasse = $c['motdepasse'] ?? null;
    } else {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $c['hote'], $c['base']);
        $utilisateur = $c['utilisateur'];
        $motdepasse = $c['motdepasse'];
    }

    $pdo = new PDO($dsn, $utilisateur, $motdepasse, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $pdo->exec('PRAGMA foreign_keys = ON');
    }
    return $pdo;
}

function pilote(?PDO $pdo = null): string
{
    return ($pdo ?? bd())->getAttribute(PDO::ATTR_DRIVER_NAME);
}

// Le schéma, en un seul endroit, décliné pour les deux moteurs.
// Attention : MySQL n'accepte pas « CREATE INDEX IF NOT EXISTS », les index y
// sont donc déclarés dans le CREATE TABLE ; SQLite les crée à part.
function schema(string $pilote): array
{
    $mysql = $pilote === 'mysql';
    $id = $mysql ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $fin = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
    $texte = $mysql ? 'MEDIUMTEXT' : 'TEXT';

    $tables = [
        "CREATE TABLE IF NOT EXISTS classes (
  id $id,
  libelle VARCHAR(40) NOT NULL,
  applis VARCHAR(255) NOT NULL DEFAULT 'defi-tables',
  cree_le VARCHAR(25) NOT NULL
)$fin",

        "CREATE TABLE IF NOT EXISTS eleves (
  id $id,
  classe_id INTEGER NOT NULL,
  code VARCHAR(8) NOT NULL,
  prenom VARCHAR(40) NOT NULL DEFAULT '',
  initiale VARCHAR(4) NOT NULL DEFAULT '',
  cree_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY eleves_code (code),\n  KEY eleves_classe (classe_id)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS progressions (
  id $id,
  eleve_id INTEGER NOT NULL,
  appli VARCHAR(30) NOT NULL,
  donnees $texte NOT NULL,
  maj_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY progressions_eleve_appli (eleve_id, appli)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS profs (
  id $id,
  identifiant VARCHAR(40) NOT NULL,
  mdp_hash VARCHAR(255) NOT NULL,
  cree_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY profs_identifiant (identifiant)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS sessions_prof (
  jeton_hash VARCHAR(64) NOT NULL PRIMARY KEY,
  prof_id INTEGER NOT NULL,
  expire_le VARCHAR(25) NOT NULL
)$fin",

        "CREATE TABLE IF NOT EXISTS compteurs (
  cle VARCHAR(80) NOT NULL PRIMARY KEY,
  fenetre INTEGER NOT NULL,
  nombre INTEGER NOT NULL
)$fin",
    ];

    if ($mysql) return $tables;

    return array_merge($tables, [
        'CREATE UNIQUE INDEX IF NOT EXISTS eleves_code ON eleves (code)',
        'CREATE INDEX IF NOT EXISTS eleves_classe ON eleves (classe_id)',
        'CREATE UNIQUE INDEX IF NOT EXISTS progressions_eleve_appli ON progressions (eleve_id, appli)',
        'CREATE UNIQUE INDEX IF NOT EXISTS profs_identifiant ON profs (identifiant)',
    ]);
}

function installer_tables(?PDO $pdo = null): void
{
    $pdo = $pdo ?? bd();
    foreach (schema(pilote($pdo)) as $sql) {
        $pdo->exec($sql);
    }
}

function maintenant(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}
