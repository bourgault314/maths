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
    // Le code n'arrive QUE dans le corps d'un POST : une adresse s'inscrit en
    // clair dans les journaux de l'hébergeur, un corps non.
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(4000);
    $code = normaliser_code((string)($corps['code'] ?? ''));
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }

    // Par adresse, on ne compte que les ÉCHECS : un collège entier sort par
    // une seule adresse IP, et trente élèves qui entrent en même temps ne
    // doivent pas être pris pour une attaque. Un curieux qui essaie des codes
    // en série, lui, produit un échec par essai.
    $adresse = adresse_appelante();
    limiter_deja_atteint('echec-ip:' . $adresse, 60, 300);
    limiter('eleve:' . $code, 60, 300);

    $requete = bd()->prepare(
        'SELECT e.prenom, c.libelle, c.applis
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.code = ?'
    );
    $requete->execute([$code]);
    $eleve = $requete->fetch();
    if ($eleve === false) {
        limiter('echec-ip:' . $adresse, 60, 300);
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
