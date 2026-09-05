<?php
// Ménage de fin d'année — À LANCER PAR UNE TÂCHE PLANIFIÉE, jamais par le web.
//
// Il supprime les classes dont l'année scolaire est passée : prénoms, codes et
// progressions, il n'en reste rien. C'est la même opération que « Ma classe »
// fait à sa première ouverture après le 1er août ; ce fichier existe pour que
// la promesse tienne même si personne n'ouvre l'espace professeur de tout
// l'été.
//
// Chez OVH (Hébergement → Tâches planifiées), une fois par mois :
//     php /home/<login>/www/menage.php
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

try {
    $pdo = bd();
    $attente = classes_echues($pdo);
    $supprimees = supprimer_classes_echues($pdo);
    $restantes = count($attente) - count($supprimees);
    echo gmdate('Y-m-d\TH:i:s\Z') . " — ménage de fin d'année\n";
    echo "  année scolaire en cours : " . annee_scolaire_courante() . "\n";
    echo $supprimees === []
        ? "  aucune classe à supprimer.\n"
        : "  " . count($supprimees) . " classe(s) supprimée(s) : " . implode(', ', $supprimees) . "\n";
    if ($restantes > 0) {
        echo "  $restantes classe(s) d'une année passée encore utilisée(s) récemment : pas touchées.\n";
    }
    exit(0);
} catch (Throwable $e) {
    error_log('menage: ' . $e->getMessage());
    fwrite(STDERR, "Le ménage n'a pas pu se faire (détail dans le journal d'erreurs).\n");
    exit(1);
}
