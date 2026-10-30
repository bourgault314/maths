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

require_once __DIR__ . '/records.php';

require_once __DIR__ . '/bd.php';
require_once __DIR__ . '/limite.php';
require_once __DIR__ . '/billets.php';
require_once __DIR__ . '/versions.php';
require_once __DIR__ . '/direct.php';

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
//
// LE PIVOT EST LE 1er JUILLET (changé le 06/09/2026, constat 2 de l'audit).
// Il était au 1er août, et c'était un piège : une classe préparée pendant les
// vacances — le 25 juillet, ce que fait tout professeur qui s'avance — était
// rangée dans l'année ÉCOULÉE, donc « échue » dès sa création, donc supprimée
// à la première ouverture de « Ma classe » de la rentrée. Reproduit
// localement : classe du 25 juillet, vingt-cinq élèves nommés le 20 août,
// effacée sans un mot le 5 septembre.
//
// Avec le 1er juillet, ce qui est créé pendant les vacances appartient à
// l'année qui vient — c'est bien pour elle qu'on le prépare. La suppression,
// elle, ne bouge pas : les données d'une année partent au plus tard le 1er
// août qui suit (purge_de_l_annee), comme le dit la fiche de registre.
//
// Tout est calculé en temps universel, comme le reste du serveur ; La Réunion
// est à UTC+4, l'écart ne joue que pendant les quatre heures du 30 juin au soir.
function annee_scolaire(string $date): string
{
    $an = (int)substr($date, 0, 4);
    $mois = (int)substr($date, 5, 2);
    $debut = $mois >= 7 ? $an : $an - 1;
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

// Le jour à partir duquel on prévient : la fin de l'année approche, la
// suppression aussi. Deux mois de préavis, affichés dans « Ma classe ».
//
// Le 1er JUIN depuis le 06/09/2026 : avec le pivot du 1er juillet, l'année
// scolaire en cours change de nom ce jour-là. Un préavis calé sur le 1er
// juillet ne se serait donc plus jamais affiché — il aurait parlé de l'année
// SUIVANTE. Juin est de toute façon le bon moment pour dire « fais ta
// sauvegarde » : les cours durent encore, le professeur est là.
function fin_des_cours_de_l_annee(string $annee): string
{
    return ((int)substr($annee, 5, 4)) . '-06-01';
}

// Vrai si l'année scolaire en cours touche à sa fin : les classes de cette
// année partiront à partir du 1er août.
function preavis_de_fin_d_annee(): bool
{
    return gmdate('Y-m-d') >= fin_des_cours_de_l_annee(annee_scolaire_courante());
}

// Le jour de la dernière activité d'une classe.
//
// TROIS dates depuis le 06/09/2026, la plus récente gagne (constat 2 de
// l'audit) : le dernier enregistrement d'un élève, la dernière création
// d'élève, et la création de la classe. Avant, seuls les enregistrements
// comptaient — préparer une classe entière, saisir vingt-cinq prénoms et la
// laisser trois semaines sans qu'un élève s'y connecte, ce n'était pas de
// l'activité. Or c'est exactement ce que fait un professeur en août.
function derniere_activite_de_la_classe(PDO $pdo, int $classeId, string $creeLe): string
{
    $requete = $pdo->prepare(
        'SELECT MAX(p.maj_le) FROM progressions p
         WHERE p.eleve_id IN (SELECT e.id FROM eleves e WHERE e.classe_id = ?)'
    );
    $requete->execute([$classeId]);
    $maj = $requete->fetchColumn();
    $requete->closeCursor();

    $requete = $pdo->prepare('SELECT MAX(e.cree_le) FROM eleves e WHERE e.classe_id = ?');
    $requete->execute([$classeId]);
    $dernierEleve = $requete->fetchColumn();
    $requete->closeCursor();

    $jour = substr($creeLe, 0, 10);
    foreach ([$maj, $dernierEleve] as $candidat) {
        if ($candidat === false || $candidat === null || $candidat === '') continue;
        $candidat = substr((string)$candidat, 0, 10);
        if ($candidat > $jour) $jour = $candidat;
    }
    return $jour;
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
        $combien = $pdo->prepare('SELECT COUNT(*) FROM eleves WHERE classe_id = ?');
        $combien->execute([(int)$ligne['id']]);
        $eleves = (int)$combien->fetchColumn();
        $combien->closeCursor();
        $echues[] = [
            'id' => (int)$ligne['id'],
            'libelle' => (string)$ligne['libelle'],
            'prof_id' => (int)$ligne['prof_id'],
            'annee' => $annee,
            'derniere_activite' => $activite,
            'eleves' => $eleves,
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
// la classe » de « Ma classe », la suppression automatique du 1er août ET la
// suppression d'un compte professeur avec ses classes (lib/auth.php,
// supprimer_prof) passent par ici. Deux codes qui effacent les mêmes tables,
// c'est deux occasions d'en oublier une — et c'est arrivé : jusqu'au
// 29/10/2026, supprimer_prof() avait sa propre boucle, qui oubliait les
// records (audit Codex du 22/10, défaut 4) ; ses records restaient en base,
// orphelins, et partaient dans les sauvegardes.
function supprimer_classe(PDO $pdo, int $classeId): void
{
    avec_reprise($pdo, function () use ($pdo, $classeId): void {
        transaction_ouvrir($pdo);
        try {
            effacer_classe_dans_la_transaction($pdo, $classeId);
            transaction_valider($pdo);
        } catch (Throwable $e) {
            transaction_annuler($pdo);
            throw $e;
        }
    });
}

// Le corps de la suppression d'une classe, SANS transaction : l'appelant en
// ouvre une (supprimer_classe pour une classe seule, supprimer_prof pour
// toutes les classes d'un compte, dans une seule transaction avec le compte).
// Toute table qui garde une ligne d'élève ou de classe s'efface ICI et
// nulle part ailleurs.
function effacer_classe_dans_la_transaction(PDO $pdo, int $classeId): void
{
    $requete = $pdo->prepare('SELECT id, code FROM eleves WHERE classe_id = ?');
    $requete->execute([$classeId]);
    foreach ($requete->fetchAll() as $eleve) {
        $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
        // L'historique des sept jours part avec le reste : une classe
        // supprimée ne doit rien laisser derrière elle (06/09/2026).
        oublier_versions_de_l_eleve($pdo, (int)$eleve['id']);
        oublier_record_de_l_eleve($pdo, (int)$eleve['id']);
        oublier_compteurs_du_code($pdo, (string)$eleve['code']);
        oublier_billets_de_l_eleve($pdo, (int)$eleve['id']);
    }
    // La séance en direct de la classe, s'il y en a une d'ouverte :
    // questions et réponses partent avec elle (07/10/2026).
    oublier_direct_de_la_classe($pdo, $classeId);
    $pdo->prepare('DELETE FROM eleves WHERE classe_id = ?')->execute([$classeId]);
    $pdo->prepare('DELETE FROM partages WHERE classe_id = ?')->execute([$classeId]);
    $pdo->prepare('DELETE FROM classes WHERE id = ?')->execute([$classeId]);
}

// Les lignes de « records » dont l'élève n'existe plus : celles laissées par
// l'ancienne suppression de compte (voir supprimer_classe). Rend le nombre
// effacé. Appelé par migrer.php (une fois, pour le passé) et par menage.php
// (pour le principe : plus rien ne devrait en laisser).
function purger_records_orphelins(PDO $pdo): int
{
    if (!table_existe($pdo, 'records')) return 0;
    $requete = $pdo->prepare('DELETE FROM records WHERE eleve_id NOT IN (SELECT id FROM eleves)');
    $requete->execute();
    return $requete->rowCount();
}

// La suppression automatique de fin d'année.
//
// CHANGÉ LE 06/09/2026 : elle n'est plus jouée à l'ouverture de « Ma classe ».
// Elle ne l'est plus que par menage.php, la tâche planifiée d'OVH (2 août et
// 2 septembre à 3 h 08) — c'est LUI qui tient la promesse « supprimées à
// partir du 1er août » du registre. Dans « Ma classe », le professeur est
// désormais INTERROGÉ : la liste des classes échues lui est montrée, il
// décide. Une suppression définitive ne doit jamais être le prix d'un clic sur
// « Mes classes ».
//
// Renvoie [['id' => …, 'libelle' => …], …] : menage.php en tire son résumé et
// une ligne de journal par classe.
function supprimer_classes_echues(PDO $pdo, ?int $profId = null): array
{
    $supprimees = [];
    foreach (classes_echues($pdo, $profId) as $classe) {
        if (!$classe['mure']) continue;
        supprimer_classe($pdo, $classe['id']);
        $supprimees[] = ['id' => $classe['id'], 'libelle' => $classe['libelle']];
    }
    return $supprimees;
}

// Les classes échues D'UN professeur, mûres seulement : celles que « Ma
// classe » lui propose de supprimer. Une classe échue mais utilisée il y a
// moins de trois semaines n'y figure pas — on ne dérange pas pour rien.
function classes_a_proposer(PDO $pdo, int $profId): array
{
    $sortie = [];
    foreach (classes_echues($pdo, $profId) as $classe) {
        if (!$classe['mure']) continue;
        $sortie[] = [
            'id' => $classe['id'],
            'libelle' => $classe['libelle'],
            'annee' => $classe['annee'],
            'derniere_activite' => $classe['derniere_activite'],
            'eleves' => $classe['eleves'],
        ];
    }
    return $sortie;
}

// Vrai si CETTE classe est échue ET mûre pour ce professeur : le contrôle que
// « classes.supprimer_echues » refait côté serveur sur chaque identifiant
// reçu. Le navigateur peut envoyer ce qu'il veut, il ne fera jamais supprimer
// une classe de l'année en cours.
function classe_echue_et_mure(PDO $pdo, int $profId, int $classeId): bool
{
    foreach (classes_echues($pdo, $profId) as $classe) {
        if ($classe['id'] === $classeId) return (bool)$classe['mure'];
    }
    return false;
}
