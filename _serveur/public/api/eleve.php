<?php
// API élève : « à qui appartient ce code, et quelles applis lui sont proposées ? »
// Sert uniquement à la page d'accueil des élèves.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/applis.php';

cors();

try {
    $code = normaliser_code((string)($_GET['code'] ?? ''));
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }

    // Deux garde-fous : par code (usage normal) et par adresse (essais en série).
    limiter('eleve:' . $code, 60, 300);
    limiter('eleve-ip:' . adresse_appelante(), 60, 300);

    $requete = bd()->prepare(
        'SELECT e.prenom, c.libelle, c.applis
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.code = ?'
    );
    $requete->execute([$code]);
    $eleve = $requete->fetch();
    if ($eleve === false) {
        erreur("Code inconnu.", 404);
    }

    repondre([
        'ok' => true,
        'prenom' => $eleve['prenom'],
        'classe' => $eleve['libelle'],
        'applis' => applis_de_classe($eleve['applis']),
    ]);
} catch (Throwable $e) {
    error_log('eleve: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
