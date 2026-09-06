<?php
// Historique des progressions — lot serveur A (06/09/2026).
//
// Pourquoi. Jusqu'ici, le serveur gardait UNE version précédente par
// progression (progressions.donnees_avant), remplacée à chaque enregistrement.
// Un intrus qui connaît le code et répond faux pendant un quart d'heure fait
// donc reculer la grille de l'élève ET remplit la seule version de secours
// avec la sienne : « Version précédente » ne rend plus rien d'utile.
//
// La règle, décidée le 06/09/2026 et annoncée à la déléguée académique à la
// protection des données : UNE version par JOUR, sept jours au plus.
//  - La ligne d'un jour est l'état à la FIN de ce jour-là : chaque
//    enregistrement réussi la remplace.
//  - Le jour est celui de La Réunion (lib/bd.php, jour_local()) : ce que
//    l'élève et le professeur appellent « hier ».
//  - Au-delà de sept jours, la ligne est effacée. Rien ne s'accumule.
//  - donnees_avant reste ce qu'elle était : « avant le tout dernier
//    enregistrement », la seule chose utile dans l'heure qui suit un accident.
//
// Ce que ces lignes NE contiennent pas : ni prénom, ni code, ni adresse. Elles
// portent exactement ce que porte déjà progressions.donnees, filtré par
// lib/progression.php.

declare(strict_types=1);

require_once __DIR__ . '/bd.php';
require_once __DIR__ . '/progression.php';

// Sept jours, aujourd'hui compris : le jour même et les six précédents.
const JOURS_HISTORIQUE = 7;

// Le plus ancien jour encore gardé.
function premier_jour_garde(?string $aujourdhui = null): string
{
    $jour = $aujourdhui ?? jour_local();
    return gmdate('Y-m-d', strtotime($jour . ' 12:00:00 UTC') - (JOURS_HISTORIQUE - 1) * 86400);
}

// Range l'état d'AUJOURD'HUI et efface ce qui a plus de sept jours.
//
// Appelée à chaque enregistrement réussi, DANS la transaction qui vient
// d'écrire la progression quand il y en a une : la version et la progression
// avancent ensemble ou pas du tout.
//
// L'insertion-ou-remplacement tient en une seule instruction, comme le
// limiteur (lib/limite.php) : deux enregistrements du même élève au même
// instant ne peuvent pas se heurter sur la clé unique.
function enregistrer_version(PDO $pdo, int $eleveId, string $appli, string $donnees, int $revision): void
{
    $jour = jour_local();
    $calculs = compter_elements_declares($appli, $donnees);
    $maintenant = maintenant();
    if (pilote($pdo) === 'mysql') {
        $pdo->prepare(
            'INSERT INTO versions (eleve_id, appli, jour, revision, calculs, donnees, maj_le)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE revision = VALUES(revision), calculs = VALUES(calculs),
                                     donnees = VALUES(donnees), maj_le = VALUES(maj_le)'
        )->execute([$eleveId, $appli, $jour, $revision, $calculs, $donnees, $maintenant]);
    } else {
        $pdo->prepare(
            'INSERT INTO versions (eleve_id, appli, jour, revision, calculs, donnees, maj_le)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(eleve_id, appli, jour) DO UPDATE SET
               revision = excluded.revision, calculs = excluded.calculs,
               donnees = excluded.donnees, maj_le = excluded.maj_le'
        )->execute([$eleveId, $appli, $jour, $revision, $calculs, $donnees, $maintenant]);
    }
    $pdo->prepare('DELETE FROM versions WHERE eleve_id = ? AND appli = ? AND jour < ?')
        ->execute([$eleveId, $appli, premier_jour_garde($jour)]);
}

// Ce que « Ma classe » reçoit pour bâtir le menu « Revenir à… » : les jours
// disponibles, du plus récent au plus ancien, avec le nombre de calculs de
// chaque version — jamais les données elles-mêmes (elles pèsent jusqu'à
// quarante kilo-octets par élève, sept fois, trente fois par classe).
//
// $revisionsCourantes : pour chaque élève, la révision de sa progression du
// moment. La version qui la porte EST l'état actuel : la proposer n'aurait
// aucun sens, la page la reconnaît à « courante ».
function versions_des_eleves(PDO $pdo, array $eleveIds, string $appli, array $revisionsCourantes = []): array
{
    if ($eleveIds === []) return [];
    $places = implode(',', array_fill(0, count($eleveIds), '?'));
    $requete = $pdo->prepare(
        "SELECT eleve_id, jour, calculs, revision FROM versions
         WHERE appli = ? AND eleve_id IN ($places) ORDER BY jour DESC"
    );
    $requete->execute(array_merge([$appli], array_map('intval', $eleveIds)));
    $parEleve = [];
    foreach ($requete->fetchAll() as $ligne) {
        $eleveId = (int)$ligne['eleve_id'];
        $parEleve[$eleveId][] = [
            'jour' => (string)$ligne['jour'],
            'calculs' => (int)$ligne['calculs'],
            'courante' => isset($revisionsCourantes[$eleveId])
                && (int)$revisionsCourantes[$eleveId] === (int)$ligne['revision'],
        ];
    }
    return $parEleve;
}

// La version d'un jour donné, ou null.
function version_du_jour(PDO $pdo, int $eleveId, string $appli, string $jour): ?string
{
    $requete = $pdo->prepare('SELECT donnees FROM versions WHERE eleve_id = ? AND appli = ? AND jour = ?');
    $requete->execute([$eleveId, $appli, $jour]);
    $donnees = $requete->fetchColumn();
    $requete->closeCursor();
    return $donnees === false ? null : (string)$donnees;
}

// Un élève supprimé (ou sa classe, ou son compte) emmène son historique.
function oublier_versions_de_l_eleve(PDO $pdo, int $eleveId): void
{
    $pdo->prepare('DELETE FROM versions WHERE eleve_id = ?')->execute([$eleveId]);
}
