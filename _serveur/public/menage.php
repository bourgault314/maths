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
// Le mode ligne de commande ne dépend d'aucune variable d'Apache : PHP_SAPI,
// puis lib/bd.php (config.php) et la base. Le <Files> du .htaccess ne le gêne
// donc pas — il ne s'applique qu'aux requêtes HTTP.
//
// Refusé net par HTTP : rien à ouvrir dans un navigateur, donc rien à
// attaquer. Deux verrous, indépendants l'un de l'autre :
//  - le .htaccess refuse le fichier (403 d'Apache, PHP n'est même pas appelé) ;
//  - et si le .htaccess venait à ne pas être lu, ces trois lignes-ci coupent.
// Voir _serveur/EXPLOITATION.md.

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    // Lot serveur B (constat 5 / M-04) : ce 404 était la SEULE réponse du
    // serveur qui annonçait encore « X-Powered-By: PHP/8.2.31 ». Le reste du
    // suivi passe par lib/entetes.php, qui le retire ; celle-ci sortait avant
    // tout require. Un attaquant n'avait qu'à demander menage.php pour
    // connaître la version exacte de PHP, et donc savoir si les défauts
    // publiés du mois la concernent.
    header_remove('X-Powered-By');
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
    // Une séance en direct oubliée ouverte est déjà effacée par le premier
    // appel venu ; la tâche planifiée repasse derrière, pour le principe.
    $directs = table_existe($pdo, 'directs') ? purger_directs($pdo) : 0;
    // Lot « correctifs de l'audit Codex » (29/10/2026) :
    //  - l'historique des sept jours est purgé pour TOUS les élèves, pas
    //    seulement ceux qui viennent d'écrire (défaut 5) — la même purge que
    //    api/parcours.php fait à chaque enregistrement, pour le principe ;
    //  - les records sans élève (défaut 4), restes de l'ancienne suppression
    //    de compte, partent aussi.
    $versions = table_existe($pdo, 'versions') ? purger_versions_anciennes($pdo) : 0;
    $orphelins = purger_records_orphelins($pdo);
    // Lot « cours-ouvertures » (10/11/2026) : pareil pour le jour
    // d'ouverture des fiches de « Mes cours » — rien ne devrait en laisser.
    $coursOrphelins = purger_cours_orphelins($pdo);
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
    if ($directs > 0) {
        echo "  séances en direct : $directs séance(s) oubliée(s) effacée(s).\n";
    }
    echo $versions > 0
        ? "  historique : $versions version(s) de plus de sept jours effacée(s).\n"
        : "  historique : rien à effacer (sept jours de conservation).\n";
    if ($orphelins > 0) {
        echo "  records : $orphelins record(s) sans élève effacé(s).\n";
    }
    if ($coursOrphelins > 0) {
        echo "  cours : $coursOrphelins ouverture(s) de fiche sans élève effacée(s).\n";
    }
    exit(0);
} catch (Throwable $e) {
    error_log('menage: ' . $e->getMessage());
    fwrite(STDERR, "Le ménage n'a pas pu se faire (détail dans le journal d'erreurs).\n");
    exit(1);
}
