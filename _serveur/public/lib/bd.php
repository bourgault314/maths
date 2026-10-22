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
  cree_le VARCHAR(25) NOT NULL,
  reglages TEXT NULL"
        . ($mysql ? ",\n  KEY classes_prof (prof_id)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS eleves (
  id $id,
  classe_id INTEGER NOT NULL,
  code VARCHAR(8) NOT NULL,
  prenom VARCHAR(40) NOT NULL DEFAULT '',
  initiale VARCHAR(4) NOT NULL DEFAULT '',
  cree_le VARCHAR(25) NOT NULL,
  ajouts TEXT NULL"
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

        // Lot 3 (03/09/2026) : billets d'entrée à usage unique (lib/billets.php).
        // Seule l'empreinte SHA-256 du billet est rangée ; expire_le est un
        // instant epoch, comme compteurs.fenetre, pour une purge à chaque appel.
        "CREATE TABLE IF NOT EXISTS billets (
  hash VARCHAR(64) NOT NULL PRIMARY KEY,
  eleve_id INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL,
  expire_le INTEGER NOT NULL"
        . ($mysql ? ",\n  KEY billets_eleve (eleve_id)" : "")
        . "\n)$fin",

        // Lot serveur A (06/09/2026) : l'historique des progressions.
        // UNE ligne par élève, par appli et par JOUR (jour de La Réunion) :
        // l'état à la fin de ce jour-là. Sept jours sont gardés, pas plus —
        // c'est ce qui est annoncé à la déléguée à la protection des données.
        // « calculs » est le nombre d'éléments comptés au moment de
        // l'enregistrement (lib/progression.php) : il sert à nommer les
        // versions dans « Revenir à… » sans jamais relire les données.
        "CREATE TABLE IF NOT EXISTS versions (
  id $id,
  eleve_id INTEGER NOT NULL,
  appli VARCHAR(30) NOT NULL,
  jour VARCHAR(10) NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  calculs INTEGER NOT NULL DEFAULT 0,
  donnees $texte NOT NULL,
  maj_le VARCHAR(25) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY versions_eleve_appli_jour (eleve_id, appli, jour),\n  KEY versions_eleve (eleve_id)" : "")
        . "\n)$fin",

        // Lot « Les records » (09/10/2026) : le meilleur temps de chaque
        // Légende des tables à la course des 25 questions (api/records.php,
        // lib/records.php). UNE ligne par élève, et rien d'autre que des
        // nombres et des instants : « meilleur » et « semaine » en dixièmes
        // de seconde, « meilleur_le » l'instant du record (ex æquo : le
        // premier arrivé devant — c'est le SEUL horaire que le serveur garde
        // d'un élève, et il ne concerne que ce record), « semaine_lundi » le
        // lundi (jour de La Réunion) du temps de la semaine, « nom » le choix
        // d'affichage (1 prénom, 0 Mystère, NULL pas encore choisi : affiché
        // Mystère). Pas d'historique : le temps de la semaine est remplacé à
        // la première course d'une nouvelle semaine. Effacée avec l'élève.
        "CREATE TABLE IF NOT EXISTS records (
  eleve_id INTEGER NOT NULL PRIMARY KEY,
  meilleur INTEGER NULL,
  meilleur_le VARCHAR(32) NULL,
  semaine INTEGER NULL,
  semaine_lundi VARCHAR(10) NULL,
  nom INTEGER NULL,
  maj_le VARCHAR(25) NOT NULL
)$fin",

        // Lot serveur A (06/09/2026) : le journal des actions du professeur.
        // Douze mois, purgés par menage.php. AUCUN prénom, AUCUN code, AUCUNE
        // adresse, aucun texte libre : des identifiants de lignes et des mots
        // d'une liste fermée (lib/journal.php). C'est ce qui permet de dire à
        // la DPD qui a fait quoi sans conserver quoi que ce soit de personnel.
        "CREATE TABLE IF NOT EXISTS journal (
  id $id,
  quand VARCHAR(25) NOT NULL,
  prof_id INTEGER NOT NULL DEFAULT 0,
  action VARCHAR(40) NOT NULL,
  cible_type VARCHAR(10) NOT NULL DEFAULT '',
  cible_id INTEGER NOT NULL DEFAULT 0,
  resultat VARCHAR(10) NOT NULL DEFAULT 'ok'"
        . ($mysql ? ",\n  KEY journal_quand (quand)" : "")
        . "\n)$fin",

        // Séance en direct, lot 1 (07/10/2026) — lib/direct.php. Trois tables
        // TEMPORAIRES : elles se vident quand le professeur termine la séance,
        // et au plus tard vingt minutes après que l'écran du tableau a été
        // quitté — trois heures après l'ouverture au plus (17/10/2026)
        // (expire_le, un instant epoch comme billets.expire_le). Aucun énoncé,
        // aucun texte libre, aucune note : un type et un réglage de question
        // pris dans une liste fermée, et une réponse courte dont la forme est
        // vérifiée par ce type. « mode » existe déjà pour les séances à venir
        // (évaluation au rythme de chacun) sans avoir à modifier la table.
        "CREATE TABLE IF NOT EXISTS directs (
  id $id,
  classe_id INTEGER NOT NULL,
  prof_id INTEGER NOT NULL,
  mode VARCHAR(12) NOT NULL DEFAULT 'eclair',
  etat VARCHAR(10) NOT NULL DEFAULT 'attente',
  numero INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 0,
  ouvert_le INTEGER NOT NULL,
  expire_le INTEGER NOT NULL,
  reglage TEXT NULL"
        . ($mysql ? ",\n  UNIQUE KEY directs_classe (classe_id)" : "")
        . "\n)$fin",

        // Lot E1 « les évaluations en classe » (15/10/2026) — lib/evaluation.php.
        // Les MODÈLES d'évaluation d'un professeur : dix réglages (tables,
        // types, nombre, chrono, calculs exclus ou imposés, tirage) dans un
        // petit JSON, un nom court. Durables, sauvegardés, attachés au compte.
        // Aucune donnée d'élève, aucune question, aucune note : une évaluation
        // OUVERTE vit dans « directs » (mode « evaluation », réglage figé dans
        // directs.reglage) et part avec elle.
        "CREATE TABLE IF NOT EXISTS modeles_evaluation (
  id $id,
  prof_id INTEGER NOT NULL,
  nom VARCHAR(40) NOT NULL DEFAULT '',
  reglage VARCHAR(600) NOT NULL DEFAULT '{}',
  cree_le INTEGER NOT NULL,
  modifie_le INTEGER NOT NULL"
        . ($mysql ? ",\n  KEY modeles_evaluation_prof (prof_id)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS directs_questions (
  id $id,
  direct_id INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  type VARCHAR(12) NOT NULL,
  reglage VARCHAR(255) NOT NULL DEFAULT '{}',
  bonne VARCHAR(40) NULL"
        . ($mysql ? ",\n  UNIQUE KEY directs_questions_numero (direct_id, numero)" : "")
        . "\n)$fin",

        "CREATE TABLE IF NOT EXISTS directs_reponses (
  id $id,
  direct_id INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  eleve_id INTEGER NOT NULL,
  reponse VARCHAR(40) NOT NULL"
        . ($mysql ? ",\n  UNIQUE KEY directs_reponses_eleve (direct_id, numero, eleve_id),\n  KEY directs_reponses_par_eleve (eleve_id)" : "")
        . "\n)$fin",
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
        'CREATE INDEX IF NOT EXISTS billets_eleve ON billets (eleve_id)',
        'CREATE UNIQUE INDEX IF NOT EXISTS versions_eleve_appli_jour ON versions (eleve_id, appli, jour)',
        'CREATE INDEX IF NOT EXISTS versions_eleve ON versions (eleve_id)',
        'CREATE INDEX IF NOT EXISTS journal_quand ON journal (quand)',
        'CREATE UNIQUE INDEX IF NOT EXISTS directs_classe ON directs (classe_id)',
        'CREATE UNIQUE INDEX IF NOT EXISTS directs_questions_numero ON directs_questions (direct_id, numero)',
        'CREATE UNIQUE INDEX IF NOT EXISTS directs_reponses_eleve ON directs_reponses (direct_id, numero, eleve_id)',
        'CREATE INDEX IF NOT EXISTS directs_reponses_par_eleve ON directs_reponses (eleve_id)',
        'CREATE INDEX IF NOT EXISTS modeles_evaluation_prof ON modeles_evaluation (prof_id)',
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
    // Lot « splat-suivi-5 » (08/10/2026) : les réglages d'une classe, par
    // activité — aujourd'hui les mondes de SPLAT! ouverts à la classe
    // (lib/applis.php). Vide pour toutes les classes existantes : rien ne
    // change pour elles tant que le professeur ne choisit rien.
    if (table_existe($pdo, 'classes') && !colonne_existe($pdo, 'classes', 'reglages')) {
        $pdo->exec('ALTER TABLE classes ADD COLUMN reglages TEXT NULL');
        $faits[] = "Colonne « réglages » ajoutée aux classes (les mondes de SPLAT! ouverts à chaque classe).";
    }
    // Lot E1 « les évaluations en classe » (15/10/2026) : le réglage figé
    // d'une évaluation ouverte (le modèle, la graine, la fin) sur sa ligne de
    // séance. Vide pour une question éclair.
    if (table_existe($pdo, 'directs') && !colonne_existe($pdo, 'directs', 'reglage')) {
        $pdo->exec('ALTER TABLE directs ADD COLUMN reglage TEXT NULL');
        $faits[] = "Colonne « réglage » ajoutée aux séances en direct (le modèle d'une évaluation ouverte).";
    }
    // Lot « Qui voit quoi » (22/10/2026) : ce qu'un professeur ouvre à UN
    // élève en plus de sa classe — une appli entière, ou des mondes en plus
    // (lib/applis.php, acces_de_l_eleve). Vide pour tous les élèves existants :
    // chacun voit exactement ce que voit sa classe, comme avant.
    if (table_existe($pdo, 'eleves') && !colonne_existe($pdo, 'eleves', 'ajouts')) {
        $pdo->exec('ALTER TABLE eleves ADD COLUMN ajouts TEXT NULL');
        $faits[] = "Colonne « ajouts » ajoutée aux élèves (ce qu'un professeur ouvre à un élève en plus de sa classe).";
    }

    // Puis les tables et index absents (dont « partages »), sans toucher au reste.
    // Lot 3 (03/09/2026) : la table des billets d'entrée arrive par ici ; on
    // le dit, pour que la page de mise à niveau montre qu'elle a servi.
    // Lot serveur A (06/09/2026) : « versions » (historique de sept jours) et
    // « journal » (actions du professeur, douze mois) arrivent par ici. On
    // regarde AVANT de créer, pour que la page de mise à niveau montre ce
    // qu'elle a vraiment fait — et pour qu'un second passage ne dise rien.
    $billetsAbsente = !table_existe($pdo, 'billets');
    $versionsAbsente = !table_existe($pdo, 'versions');
    $journalAbsent = !table_existe($pdo, 'journal');
    $recordsAbsente = !table_existe($pdo, 'records');
    // Séance en direct (07/10/2026) : ses trois tables arrivent par ici aussi.
    $directsAbsente = !table_existe($pdo, 'directs');
    // Lot E1 (15/10/2026) : les modèles d'évaluation.
    $modelesAbsente = !table_existe($pdo, 'modeles_evaluation');
    installer_tables($pdo);
    if ($billetsAbsente) {
        $faits[] = "Table « billets » créée (liens d'entrée à usage unique, lot 3).";
    }
    if ($versionsAbsente) {
        $faits[] = "Table « versions » créée (historique des sept derniers jours).";
    }
    if ($journalAbsent) {
        $faits[] = "Table « journal » créée (actions des professeurs, douze mois).";
    }
    if ($recordsAbsente) {
        $faits[] = "Table « records » créée (les meilleurs temps des Légendes des tables).";
    }
    if ($directsAbsente) {
        $faits[] = "Tables « directs » créées (séance en direct : rien n'y reste après la séance).";
    }
    if ($modelesAbsente) {
        $faits[] = "Table « modeles_evaluation » créée (les modèles d'évaluation des tables de chaque professeur).";
    }

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

// Le fuseau de La Réunion (UTC+4, sans heure d'été). Il ne sert QUE là où un
// jour doit être celui du professeur et de l'élève : le découpage de
// l'historique en journées (« fin de journée du mardi 8 septembre ») et
// l'affichage du journal. Tout le reste du serveur reste en temps universel.
const FUSEAU = 'Indian/Reunion';

// Le jour à La Réunion, « AAAA-MM-JJ ». Un enregistrement fait le 8 septembre
// à 23 h 30 (19 h 30 UTC) appartient au 8, pas au 9.
function jour_local(?int $instant = null): string
{
    return (new DateTimeImmutable('@' . ($instant ?? time())))
        ->setTimezone(new DateTimeZone(FUSEAU))->format('Y-m-d');
}

// Un instant UTC (« 2026-09-08T19:30:00Z ») écrit en heure de La Réunion,
// pour les yeux d'un humain : « 08/09/2026 23:30 ».
function instant_local_lisible(string $instantUtc): string
{
    try {
        return (new DateTimeImmutable($instantUtc))
            ->setTimezone(new DateTimeZone(FUSEAU))->format('d/m/Y H:i');
    } catch (Throwable) {
        return $instantUtc;
    }
}

// La date de dernière activité d'un élève : le JOUR seulement.
// Décidé le 30/08/2026 — savoir qu'un élève a travaillé le 12 septembre suffit
// à un professeur ; savoir qu'il a travaillé à 23 h 40 ne le regarde pas.
function aujourdhui(): string
{
    return gmdate('Y-m-d');
}

// ------------------------------------------------------------ transactions
//
// Une seule façon de verrouiller une ligne pour tout le serveur (lot 6) :
// l'écriture de l'élève (api/parcours.php) et la restauration du professeur
// (api/prof.php) passent par les mêmes fonctions — la seconde avait été écrite
// à part, sans verrou ni reprise, et pouvait réutiliser un numéro de révision.
//
// La transaction, selon le moteur. Sur MySQL, celle de PDO. Sur SQLite,
// BEGIN IMMEDIATE prend le verrou d'écriture tout de suite (une transaction
// ordinaire qui passe de lecture à écriture se fait refuser net au lieu
// d'attendre son tour). Mais PDO ne voit pas ce BEGIN écrit en SQL avant
// PHP 8.4 : ses commit() et rollBack() répondent « There is no active
// transaction » — trouvé par la CI, sur PHP 8.2, dès son premier passage.
// On termine donc la transaction SQLite comme on l'a ouverte : en SQL.
function transaction_ouvrir(PDO $pdo): void
{
    if (pilote($pdo) === 'mysql') $pdo->beginTransaction(); else $pdo->exec('BEGIN IMMEDIATE');
}

function transaction_valider(PDO $pdo): void
{
    if (pilote($pdo) === 'mysql') $pdo->commit(); else $pdo->exec('COMMIT');
}

function transaction_annuler(PDO $pdo): void
{
    if (pilote($pdo) === 'mysql') {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return;
    }
    try {
        $pdo->exec('ROLLBACK');
    } catch (PDOException) {
        // Aucune transaction ouverte : rien à annuler.
    }
}

// « SELECT … FOR UPDATE » n'existe que sur MySQL ; sur SQLite, c'est BEGIN
// IMMEDIATE qui tient le verrou pour toute la transaction.
function pour_mise_a_jour(PDO $pdo): string
{
    return pilote($pdo) === 'mysql' ? ' FOR UPDATE' : '';
}

// ------------------------------------------------------------- instantané
//
// Lot serveur A (06/09/2026), constat I-06 de l'audit GPT. sauvegarde.php
// lisait ses tables les unes après les autres, hors transaction : un élève qui
// enregistrait pendant l'export pouvait laisser un fichier où sa progression
// existe mais pas son élève. Sur MySQL, « WITH CONSISTENT SNAPSHOT » fige la
// base telle qu'elle est à cet instant pour toute la transaction ; sur SQLite,
// une transaction de lecture ordinaire suffit. La transaction s'ouvre et se
// ferme EN SQL des deux côtés : PDO ne voit pas un BEGIN écrit à la main
// (même raison qu'au verrou ci-dessus).
function instantane_ouvrir(PDO $pdo): void
{
    $pdo->exec(pilote($pdo) === 'mysql' ? 'START TRANSACTION WITH CONSISTENT SNAPSHOT' : 'BEGIN');
}

function instantane_fermer(PDO $pdo): void
{
    try {
        $pdo->exec('COMMIT');
    } catch (PDOException) {
        // Rien à valider : l'instantané n'a jamais été ouvert.
    }
}

function doublon(PDOException $e): bool
{
    return (string)$e->getCode() === '23000';
}

function verrou_refuse(PDOException $e): bool
{
    $message = $e->getMessage();
    return (string)$e->getCode() === '40001' || str_contains($message, '1213') || str_contains($message, 'database is locked');
}

// Rejoue $operation (qui ouvre et ferme sa propre transaction) jusqu'à trois
// fois quand un verrou est refusé ou qu'InnoDB tranche un interblocage ; toute
// autre erreur remonte telle quelle. La transaction restée ouverte par une
// tentative ratée est annulée avant de recommencer.
function avec_reprise(PDO $pdo, callable $operation): mixed
{
    for ($tentative = 1; ; $tentative++) {
        try {
            return $operation();
        } catch (PDOException $e) {
            transaction_annuler($pdo);
            if ($tentative >= 3 || !verrou_refuse($e)) throw $e;
            usleep(random_int(20000, 80000));
        }
    }
}
