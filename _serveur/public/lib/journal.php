<?php
// Journal des actions du professeur — lot serveur A (06/09/2026).
//
// Pourquoi. L'audit de ChatGPT (constat I-04, 05/09/2026) a relevé qu'aucune
// trace ne restait de ce qui est fait dans « Ma classe » : un code régénéré, un
// élève supprimé, un partage retiré ne laissaient rien derrière eux. Pour un
// registre de traitement, c'est le point qui manque — « qui a fait quoi, et
// quand » est la première question posée le jour d'un incident.
//
// Ce qu'il contient, et RIEN d'autre :
//  - l'instant, en temps universel ;
//  - le NUMÉRO du compte professeur (jamais son identifiant) ;
//  - le nom de l'action, pris dans une liste fermée écrite ci-dessous ;
//  - le type et le NUMÉRO de la ligne visée ;
//  - le résultat : « ok », « refus » (droit insuffisant) ou « erreur ».
//
// Aucun prénom, aucun code élève, aucune adresse, aucun texte libre : un test
// de la batterie crée un élève « Léa » au code connu, joue toutes les actions,
// puis relit la table entière et vérifie qu'aucune colonne ne les contient.
// C'est aussi pourquoi rien ici n'est écrit par concaténation : les valeurs ne
// peuvent pas déborder de leur colonne.
//
// Conservation : douze mois, purgés par menage.php (tâche planifiée OVH).
// Lecture : verifier.php, APRÈS le mot de passe d'installation — pas dans
// « Ma classe », qui n'a pas à devenir un outil de surveillance de collègue.

declare(strict_types=1);

require_once __DIR__ . '/bd.php';

// Douze mois, comme annoncé dans le registre.
const JOURS_CONSERVATION_JOURNAL = 365;

// La liste fermée. Une action qui n'y figure pas n'est pas écrite : le journal
// ne peut pas devenir, par accident, l'endroit où l'on range du texte libre.
const ACTIONS_JOURNAL = [
    'connexion', 'deconnexion', 'motdepasse',
    'classes.creer', 'classes.modifier', 'classes.supprimer', 'classes.supprimer_echues',
    'classes.menage',
    'eleves.ajouter', 'eleves.nommer', 'eleves.regenerer', 'eleves.restaurer', 'eleves.supprimer',
    // Lot « Qui voit quoi » (22/10/2026) : qui a ouvert quoi en plus à quel
    // élève — la cible est l'élève, par son identifiant ; ce qui a été ouvert
    // est dans sa ligne (eleves.ajouts), pas dans le journal.
    'eleves.acces',
    // Lot 1 « la séance » de Défi calcul (12/11/2026) : qui a réglé quoi pour
    // quel élève — la cible est l'élève ; le réglage est dans sa ligne.
    'eleves.reglages',
    'partages.ajouter', 'partages.supprimer',
    // Lot « après l'audit GPT » (D4, 14/10/2026) : un temps retiré des records.
    'records.retirer',
    'profs.ajouter', 'profs.supprimer', 'profs.reinitialiser', 'profs.desactiver', 'profs.reactiver',
    // Séance en direct (07/10/2026) : qui a ouvert une séance, qui a pris le
    // fichier des réponses, qui l'a terminée. Pas une ligne par question.
    'direct.ouvrir', 'direct.fichier', 'direct.terminer',
    // Lot E1 « les évaluations en classe » (15/10/2026) : qui a ouvert une
    // évaluation, qui l'a fermée, qui a pris le fichier, qui l'a terminée.
    'evaluation.ouvrir', 'evaluation.fermer', 'evaluation.fichier', 'evaluation.terminer',
    // Lot E2 (15/10/2026) : qui a fait repasser quel élève (la cible est
    // l'élève, par son identifiant — jamais un prénom dans le journal).
    'evaluation.repasser',
];

const CIBLES_JOURNAL = ['classe', 'eleve', 'partage', 'compte', 'session'];
const RESULTATS_JOURNAL = ['ok', 'refus', 'erreur'];

// Écrit une ligne. Ne lève JAMAIS : un journal qui tombe ne doit pas empêcher
// un élève d'enregistrer son travail ni un professeur de saisir un prénom.
// L'ennui part dans le journal d'erreurs de l'hébergeur, où il se voit.
function journaliser(PDO $pdo, int $profId, string $action, string $cibleType, int $cibleId, string $resultat = 'ok'): void
{
    try {
        if (!in_array($action, ACTIONS_JOURNAL, true)) return;
        if (!in_array($cibleType, CIBLES_JOURNAL, true)) return;
        if (!in_array($resultat, RESULTATS_JOURNAL, true)) $resultat = 'erreur';
        $pdo->prepare('INSERT INTO journal (quand, prof_id, action, cible_type, cible_id, resultat) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([maintenant(), $profId, $action, $cibleType, $cibleId, $resultat]);
    } catch (Throwable $e) {
        error_log('journal: ' . $e->getMessage());
    }
}

// Purge des lignes de plus de douze mois. Appelée par menage.php ; renvoie le
// nombre de lignes parties, pour le résumé que l'hébergeur envoie par courriel.
function purger_journal(PDO $pdo): int
{
    if (!table_existe($pdo, 'journal')) return 0;
    $limite = gmdate('Y-m-d\TH:i:s\Z', time() - JOURS_CONSERVATION_JOURNAL * 86400);
    $requete = $pdo->prepare('DELETE FROM journal WHERE quand < ?');
    $requete->execute([$limite]);
    return $requete->rowCount();
}

// Les dernières lignes, l'identifiant du professeur résolu AU MOMENT DE
// L'AFFICHAGE (il n'est pas rangé dans la table). Un compte supprimé depuis
// laisse « compte n° 4 » : c'est exact, et cela ne ressuscite rien.
function dernieres_lignes_du_journal(PDO $pdo, int $combien = 200): array
{
    if (!table_existe($pdo, 'journal')) return [];
    $combien = max(1, min(500, $combien));
    $lignes = $pdo->query(
        'SELECT j.quand, j.prof_id, j.action, j.cible_type, j.cible_id, j.resultat,
                (SELECT p.identifiant FROM profs p WHERE p.id = j.prof_id) AS identifiant
         FROM journal j ORDER BY j.id DESC LIMIT ' . $combien
    )->fetchAll();
    $sortie = [];
    foreach ($lignes as $ligne) {
        $profId = (int)$ligne['prof_id'];
        $sortie[] = [
            'quand' => instant_local_lisible((string)$ligne['quand']),
            'qui' => $profId === 0
                ? 'ménage automatique'
                : ((string)($ligne['identifiant'] ?? '') !== '' ? (string)$ligne['identifiant'] : 'compte n° ' . $profId),
            'action' => (string)$ligne['action'],
            'cible' => (string)$ligne['cible_type'] . ' n° ' . (int)$ligne['cible_id'],
            'resultat' => (string)$ligne['resultat'],
        ];
    }
    return $sortie;
}
