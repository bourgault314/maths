<?php
// Ménage de fin d'année — À LANCER PAR UNE TÂCHE PLANIFIÉE, jamais par le web.
//
// Il fait deux choses :
//  - il supprime les classes dont l'année scolaire est passée (prénoms, codes
//    et progressions : il n'en reste rien) ;
//  - il efface les lignes de journal de plus de douze mois (lib/journal.php).
//
// DEPUIS LE 06/09/2026, C'EST LE SEUL ENDROIT QUI SUPPRIME TOUT SEUL. Ouvrir
// « Ma classe » ne supprime plus rien : le professeur y est interrogé. C'est
// donc cette tâche qui tient la promesse du registre — « supprimées au plus
// tard le 1er août qui suit » — même si personne n'ouvre l'espace professeur
// de tout l'été.
//
// Chez OVH (Hébergement → Tâches planifiées), en place depuis le 06/09/2026,
// le 2 août et le 2 septembre à 3 h 08 :
//     php /home/<login>/www/suivi/menage.php
//
// Refusé net par HTTP : rien à ouvrir dans un navigateur, donc rien à
// attaquer. Voir _serveur/EXPLOITATION.md.

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/lib/bd.php';
require __DIR__ . '/lib/archives.php';
require __DIR__ . '/lib/journal.php';

try {
    $pdo = bd();
    $attente = classes_echues($pdo);
    $supprimees = supprimer_classes_echues($pdo);
    // Une ligne de journal par classe emportée, au nom du « ménage
    // automatique » (prof_id = 0) : c'est ce qui distingue, un an plus tard,
    // une classe partie toute seule d'une classe supprimée par quelqu'un.
    foreach ($supprimees as $classe) {
        journaliser($pdo, 0, 'classes.menage', 'classe', (int)$classe['id']);
    }
    $noms = array_map(fn(array $classe): string => (string)$classe['libelle'], $supprimees);
    $lignesJournal = purger_journal($pdo);
    $restantes = count($attente) - count($supprimees);
    echo gmdate('Y-m-d\TH:i:s\Z') . " — ménage de fin d'année\n";
    echo "  année scolaire en cours : " . annee_scolaire_courante() . "\n";
    echo $supprimees === []
        ? "  aucune classe à supprimer.\n"
        : "  " . count($supprimees) . " classe(s) supprimée(s) : " . implode(', ', $noms) . "\n";
    if ($restantes > 0) {
        echo "  $restantes classe(s) d'une année passée encore utilisée(s) récemment : pas touchées.\n";
    }
    echo $lignesJournal > 0
        ? "  journal : $lignesJournal ligne(s) de plus de douze mois effacée(s).\n"
        : "  journal : rien à effacer (douze mois de conservation).\n";
    exit(0);
} catch (Throwable $e) {
    error_log('menage: ' . $e->getMessage());
    fwrite(STDERR, "Le ménage n'a pas pu se faire (détail dans le journal d'erreurs).\n");
    exit(1);
}
