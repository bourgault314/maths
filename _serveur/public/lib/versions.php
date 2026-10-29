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
// Audit Codex du 22/10/2026 (défaut 5), corrigé le 29/10 : la purge ne
// touchait que l'élève et l'appli qui venaient d'écrire. Un élève qui cessait
// d'écrire gardait sa vieille version pour toujours, lisible et restaurable
// depuis « Ma classe » — les sept jours promis à la DPD n'étaient tenus que
// pour les élèves actifs. Trois verrous, désormais :
//  1. purger_versions_anciennes() efface TOUT ce qui a plus de sept jours,
//     tous élèves confondus — à chaque enregistrement réussi (api/parcours.php)
//     et par menage.php ;
//  2. versions_des_eleves() ne LISTE que les sept jours ;
//  3. version_du_jour() ne REND que les sept jours : une restauration d'un
//     jour plus ancien répond « cette journée n'est plus dans l'historique »,
//     même si la ligne traînait encore entre deux purges.
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

// Efface les versions de plus de sept jours de TOUS les élèves, et rend le
// nombre effacé. Hors transaction, après l'enregistrement (api/parcours.php) :
// un ménage qui échoue ne doit pas annuler la progression qui vient d'être
// écrite — et l'ennui part au journal d'erreurs. L'index versions_jour
// (lib/bd.php) le rend bon marché, même sur une grande base.
function purger_versions_anciennes(PDO $pdo, ?string $aujourdhui = null): int
{
    $requete = $pdo->prepare('DELETE FROM versions WHERE jour < ?');
    $requete->execute([premier_jour_garde($aujourdhui)]);
    return $requete->rowCount();
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
    // Les sept jours seulement (verrou 2) : une ligne plus ancienne qui
    // attendrait encore sa purge n'est pas proposée dans « Revenir à… ».
    $requete = $pdo->prepare(
        "SELECT eleve_id, jour, calculs, revision FROM versions
         WHERE appli = ? AND jour >= ? AND eleve_id IN ($places) ORDER BY jour DESC"
    );
    $requete->execute(array_merge([$appli, premier_jour_garde()], array_map('intval', $eleveIds)));
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

// La version d'un jour donné, ou null — et null aussi pour un jour hors des
// sept gardés (verrou 3), que la ligne existe encore ou non.
function version_du_jour(PDO $pdo, int $eleveId, string $appli, string $jour): ?string
{
    if (strcmp($jour, premier_jour_garde()) < 0) return null;
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
