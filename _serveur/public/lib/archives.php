<?php
// Fin d'année scolaire : durée de conservation, suppression des classes de
// l'année écoulée.
//
// La règle, décidée le 05/09/2026 (lot 12) : les prénoms, les codes et les
// progressions d'une année scolaire sont supprimés au plus tard le 1er août
// qui suit — après la fin des cours (début juillet à La Réunion) et AVANT la
// rentrée suivante (mi-août). C'est ce qui est écrit à la fiche de registre.
//
// Il ne reste RIEN d'une classe passée : pas de ligne de bilan, pas de
// compteur, pas de nom. « À la fin de l'année, tout est effacé » se défend en
// une phrase ; « il ne reste que trois nombres » ouvre une discussion pour un
// gain nul. Ce qui rend cette suppression sereine, c'est la sauvegarde
// mensuelle chiffrée (voir EXPLOITATION.md) : une classe effacée par erreur se
// récupère.

declare(strict_types=1);

require_once __DIR__ . '/bd.php';
require_once __DIR__ . '/limite.php';
require_once __DIR__ . '/billets.php';

// Une classe encore utilisée n'est JAMAIS effacée par surprise : la
// suppression automatique attend trois semaines sans un seul enregistrement.
// Entre la fin des cours (début juillet) et le 1er août il y en a quatre : la
// règle ne retarde rien, elle empêche seulement un accident — et c'est le
// garde-fou qui compte le plus, puisque rien n'est réversible.
const JOURS_SANS_ACTIVITE_AVANT_SUPPRESSION = 21;

// L'année scolaire d'une date, sous la forme « 2026-2027 ».
//
// À La Réunion, la rentrée est mi-août et les cours finissent début juillet
// (rentrée 2026 : le 18 août ; fin de l'année 2026-2027 : le 3 juillet 2027).
// Le pivot est donc le 1er août : ce qui est créé à partir du 1er août
// appartient à l'année qui commence. Tout est calculé en temps universel,
// comme le reste du serveur ; La Réunion est à UTC+4, l'écart ne joue que
// pendant les quatre heures du 31 juillet au soir.
function annee_scolaire(string $date): string
{
    $an = (int)substr($date, 0, 4);
    $mois = (int)substr($date, 5, 2);
    $debut = $mois >= 8 ? $an : $an - 1;
    return $debut . '-' . ($debut + 1);
}

function annee_scolaire_courante(): string
{
    return annee_scolaire(gmdate('Y-m-d'));
}

// Le jour où les prénoms, les codes et les progressions de cette année-là
// disparaissent.
function purge_de_l_annee(string $annee): string
{
    return ((int)substr($annee, 5, 4)) . '-08-01';
}

// Le jour à partir duquel on prévient : les cours sont finis, la suppression
// approche. Un mois de préavis, affiché dans « Ma classe ».
function fin_des_cours_de_l_annee(string $annee): string
{
    return ((int)substr($annee, 5, 4)) . '-07-01';
}

// Vrai si l'année scolaire en cours est dans son dernier mois (juillet) : les
// classes de l'année vont être supprimées le 1er août.
function preavis_de_fin_d_annee(): bool
{
    return gmdate('Y-m-d') >= fin_des_cours_de_l_annee(annee_scolaire_courante());
}

// Le jour de la dernière activité d'une classe : la plus récente des dates
// d'enregistrement de ses élèves, sinon le jour de sa création.
function derniere_activite_de_la_classe(PDO $pdo, int $classeId, string $creeLe): string
{
    $requete = $pdo->prepare(
        'SELECT MAX(p.maj_le) FROM progressions p
         WHERE p.eleve_id IN (SELECT e.id FROM eleves e WHERE e.classe_id = ?)'
    );
    $requete->execute([$classeId]);
    $maj = $requete->fetchColumn();
    $jourCreation = substr($creeLe, 0, 10);
    if ($maj === false || $maj === null || $maj === '') return $jourCreation;
    $maj = substr((string)$maj, 0, 10);
    return $maj > $jourCreation ? $maj : $jourCreation;
}

// Les classes dont l'année scolaire est passée. NE MODIFIE RIEN : c'est ce que
// verifier.php affiche, pour qu'on voie AVANT tout dépôt ce qui serait effacé,
// jamais après.
//
// $profId = null : toutes les classes (verifier.php, menage.php).
// Chaque ligne porte « mure » : vrai si la suppression automatique la prendra
// (assez de jours sans activité), faux si elle attend encore.
function classes_echues(PDO $pdo, ?int $profId = null): array
{
    if (!table_existe($pdo, 'classes')) return [];
    $courante = annee_scolaire_courante();
    $sql = 'SELECT id, libelle, cree_le, prof_id FROM classes';
    $parametres = [];
    if ($profId !== null) {
        $sql .= ' WHERE prof_id = ?';
        $parametres[] = $profId;
    }
    $sql .= ' ORDER BY libelle';
    $requete = $pdo->prepare($sql);
    $requete->execute($parametres);

    $limite = gmdate('Y-m-d', time() - JOURS_SANS_ACTIVITE_AVANT_SUPPRESSION * 86400);
    $echues = [];
    foreach ($requete->fetchAll() as $ligne) {
        $annee = annee_scolaire((string)$ligne['cree_le']);
        if ($annee >= $courante) continue;
        $activite = derniere_activite_de_la_classe($pdo, (int)$ligne['id'], (string)$ligne['cree_le']);
        $echues[] = [
            'id' => (int)$ligne['id'],
            'libelle' => (string)$ligne['libelle'],
            'prof_id' => (int)$ligne['prof_id'],
            'annee' => $annee,
            'derniere_activite' => $activite,
            'mure' => $activite < $limite,
        ];
    }
    return $echues;
}

// Supprime une classe : ses élèves, leurs codes, leurs progressions, leurs
// billets, leurs compteurs, ses partages, et la classe elle-même. Tout ou
// rien : une panne au milieu ne laisse ni élève sans classe ni progression
// orpheline.
//
// UN SEUL chemin de suppression pour tout le serveur : le bouton « Supprimer
// la classe » de « Ma classe » et la suppression automatique du 1er août
// passent par ici. Deux codes qui effacent les mêmes tables, c'est deux
// occasions d'en oublier une.
function supprimer_classe(PDO $pdo, int $classeId): void
{
    avec_reprise($pdo, function () use ($pdo, $classeId): void {
        transaction_ouvrir($pdo);
        try {
            $requete = $pdo->prepare('SELECT id, code FROM eleves WHERE classe_id = ?');
            $requete->execute([$classeId]);
            foreach ($requete->fetchAll() as $eleve) {
                $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
                oublier_compteurs_du_code($pdo, (string)$eleve['code']);
                oublier_billets_de_l_eleve($pdo, (int)$eleve['id']);
            }
            $pdo->prepare('DELETE FROM eleves WHERE classe_id = ?')->execute([$classeId]);
            $pdo->prepare('DELETE FROM partages WHERE classe_id = ?')->execute([$classeId]);
            $pdo->prepare('DELETE FROM classes WHERE id = ?')->execute([$classeId]);
            transaction_valider($pdo);
        } catch (Throwable $e) {
            transaction_annuler($pdo);
            throw $e;
        }
    });
}

// La suppression automatique de fin d'année. Jouée à chaque ouverture de la
// liste des classes (api/prof.php) et par menage.php : le 1er août, ce qui
// reste de l'année écoulée part tout seul. Renvoie les noms des classes
// supprimées, pour que la page le dise au professeur.
function supprimer_classes_echues(PDO $pdo, ?int $profId = null): array
{
    $supprimees = [];
    foreach (classes_echues($pdo, $profId) as $classe) {
        if (!$classe['mure']) continue;
        supprimer_classe($pdo, $classe['id']);
        $supprimees[] = $classe['libelle'];
    }
    return $supprimees;
}
