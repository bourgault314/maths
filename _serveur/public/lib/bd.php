<?php
// Connexion à la base et création des tables.
// Fonctionne avec MySQL (OVH) et SQLite (tests) : même code, même schéma logique.

declare(strict_types=1);

// Jamais de message technique dans une réponse, quelle que soit la
// configuration de l'hébergeur : tout part dans le journal d'erreurs. Ce
// fichier étant chargé par tous les points d'entrée, la règle vaut partout.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

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
  prof_id INTEGER NOT NULL DEFAULT 0,
  libelle VARCHAR(40) NOT NULL,
  applis VARCHAR(255) NOT NULL DEFAULT 'defi-tables',
  cree_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  KEY classes_prof (prof_id)" : "")
        . "\n)$fin",

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
  maj_le VARCHAR(25) NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  donnees_avant $texte NULL"
        . ($mysql ? ",\n  UNIQUE KEY progressions_eleve_appli (eleve_id, appli)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS profs (
  id $id,
  identifiant VARCHAR(40) NOT NULL,
  mdp_hash VARCHAR(255) NOT NULL,
  admin INTEGER NOT NULL DEFAULT 0,
  actif INTEGER NOT NULL DEFAULT 1,
  mdp_temporaire INTEGER NOT NULL DEFAULT 0,
  cree_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY profs_identifiant (identifiant)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS partages (
  id $id,
  classe_id INTEGER NOT NULL,
  prof_id INTEGER NOT NULL,
  droit VARCHAR(10) NOT NULL DEFAULT 'lecture',
  cree_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY partages_classe_prof (classe_id, prof_id),\n  KEY partages_prof (prof_id)" : "")
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
        'CREATE INDEX IF NOT EXISTS classes_prof ON classes (prof_id)',
        'CREATE UNIQUE INDEX IF NOT EXISTS partages_classe_prof ON partages (classe_id, prof_id)',
        'CREATE INDEX IF NOT EXISTS partages_prof ON partages (prof_id)',
    ]);
}

function installer_tables(?PDO $pdo = null): void
{
    $pdo = $pdo ?? bd();
    foreach (schema(pilote($pdo)) as $sql) {
        $pdo->exec($sql);
    }
}

// Vrai si la table existe déjà : on l'interroge, ce qui marche à l'identique
// sur MySQL et sur SQLite.
function table_existe(PDO $pdo, string $table): bool
{
    try {
        $pdo->query("SELECT 1 FROM $table LIMIT 1")->closeCursor();
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

// Vrai si la colonne existe déjà, même principe.
function colonne_existe(PDO $pdo, string $table, string $colonne): bool
{
    try {
        $pdo->query("SELECT $colonne FROM $table LIMIT 1")->closeCursor();
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

// Mise à niveau d'une base déjà installée : ajoute ce qui manque, sans jamais
// toucher aux données existantes. Peut être relancée sans risque.
// Renvoie la liste de ce qui a été fait, en français.
function migrer_schema(?PDO $pdo = null): array
{
    $pdo = $pdo ?? bd();
    $faits = [];

    // Les colonnes manquantes D'ABORD : le schéma déclare un index sur
    // classes.prof_id, et un index ne peut pas se créer avant sa colonne.
    if (table_existe($pdo, 'classes') && !colonne_existe($pdo, 'classes', 'prof_id')) {
        $pdo->exec('ALTER TABLE classes ADD COLUMN prof_id INTEGER NOT NULL DEFAULT 0');
        $faits[] = "Colonne « propriétaire » ajoutée aux classes.";
    }
    if (table_existe($pdo, 'profs') && !colonne_existe($pdo, 'profs', 'admin')) {
        $pdo->exec('ALTER TABLE profs ADD COLUMN admin INTEGER NOT NULL DEFAULT 0');
        $faits[] = "Colonne « administrateur » ajoutée aux comptes professeurs.";
    }

    // Lot A2 (30/08/2026) : numéro de révision et version précédente de chaque
    // progression ; et, d'avance, les colonnes du lot S2 (compte désactivé, mot
    // de passe temporaire) pour ne faire qu'une seule mise à niveau.
    $texte = pilote($pdo) === 'mysql' ? 'MEDIUMTEXT' : 'TEXT';
    if (table_existe($pdo, 'progressions') && !colonne_existe($pdo, 'progressions', 'revision')) {
        $pdo->exec('ALTER TABLE progressions ADD COLUMN revision INTEGER NOT NULL DEFAULT 0');
        $faits[] = "Colonne « révision » ajoutée aux progressions.";
    }
    if (table_existe($pdo, 'progressions') && !colonne_existe($pdo, 'progressions', 'donnees_avant')) {
        $pdo->exec("ALTER TABLE progressions ADD COLUMN donnees_avant $texte NULL");
        $faits[] = "Colonne « version précédente » ajoutée aux progressions.";
    }
    if (table_existe($pdo, 'profs') && !colonne_existe($pdo, 'profs', 'actif')) {
        $pdo->exec('ALTER TABLE profs ADD COLUMN actif INTEGER NOT NULL DEFAULT 1');
        $faits[] = "Colonne « actif » ajoutée aux comptes professeurs.";
    }
    if (table_existe($pdo, 'profs') && !colonne_existe($pdo, 'profs', 'mdp_temporaire')) {
        $pdo->exec('ALTER TABLE profs ADD COLUMN mdp_temporaire INTEGER NOT NULL DEFAULT 0');
        $faits[] = "Colonne « mot de passe temporaire » ajoutée aux comptes professeurs.";
    }

    // Puis les tables et index absents (dont « partages »), sans toucher au reste.
    installer_tables($pdo);

    // Le premier compte créé devient administrateur et récupère les classes
    // qui n'ont pas encore de propriétaire : impossible de perdre la main.
    $premier = $pdo->query('SELECT MIN(id) FROM profs')->fetchColumn();
    if ($premier !== null && $premier !== false) {
        $premier = (int)$premier;
        $administrateurs = (int)$pdo->query('SELECT COUNT(*) FROM profs WHERE admin = 1')->fetchColumn();
        if ($administrateurs === 0) {
            $pdo->prepare('UPDATE profs SET admin = 1 WHERE id = ?')->execute([$premier]);
            $faits[] = "Le premier compte professeur est devenu administrateur.";
        }
        $requete = $pdo->prepare(
            'UPDATE classes SET prof_id = ? WHERE prof_id = 0 OR prof_id NOT IN (SELECT id FROM profs)'
        );
        $requete->execute([$premier]);
        $reprises = $requete->rowCount();
        if ($reprises > 0) {
            $faits[] = "$reprises classe(s) sans propriétaire attribuée(s) à ce compte.";
        }
    }

    return $faits;
}

function maintenant(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

// La date de dernière activité d'un élève : le JOUR seulement.
// Décidé le 30/08/2026 — savoir qu'un élève a travaillé le 12 septembre suffit
// à un professeur ; savoir qu'il a travaillé à 23 h 40 ne le regarde pas.
function aujourdhui(): string
{
    return gmdate('Y-m-d');
}
