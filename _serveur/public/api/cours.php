<?php
// API élève de l'appli Cours (lot « cours-ouvertures », 10/11/2026) : noter
// qu'une fiche de « Mes cours » a été ouverte. Toujours en POST, le code dans
// le corps — jamais dans l'adresse.
//
//  - {code, page}  → « page » est le chemin de la fiche touchée dans « Mes
//                    cours » (« /cours/3e/3e-PYT-02.html », sans domaine ni
//                    ancre). Le serveur retrouve la fiche parmi celles que
//                    CET élève voit, et range le JOUR (de La Réunion, le sien,
//                    jamais celui de l'appareil) à la place du précédent.
//
// Ce que Gwenaël a décidé : « ouverte le … » ou rien, pour le professeur
// seulement — ni nombre de fois, ni durée, ni heure, jamais « lue ». Rien
// pour un visiteur sans code : les pages des fiches, sur mathsgo.re, ne
// savent rien de l'élève ; c'est l'espace élève qui envoie cette demande, au
// moment où l'élève touche la fiche (navigator.sendBeacon : la page part
// vers la fiche, la réponse n'est attendue par personne).
//
// Réponses hors 200 :
//  400  demande illisible, ou fiche que cet élève ne voit pas (fermée,
//       inconnue, version imprimable) : rien n'est noté ;
//  403  l'appli Cours n'est pas ouverte à sa classe ;
//  404  code inconnu (comme partout, compté comme un échec de l'adresse) ;
//  503  la table n'existe pas encore : migrer.php n'a pas été ouvert.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/applis.php';
require_once __DIR__ . '/../lib/cours.php';

cors();

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(1000);

    $code = normaliser_code(is_string($corps['code'] ?? null) ? $corps['code'] : '');
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }
    // Comme eleve.php et records.php : les échecs par adresse (un collège
    // sort par une seule adresse), et une limite large par code — un élève
    // qui feuillette ses fiches n'en ouvre pas cent vingt en cinq minutes.
    $adresse = adresse_limitee();
    freiner_adresse($adresse);
    limiter('cours:' . $code, 120, 300);

    $page = $corps['page'] ?? null;
    if (!is_string($page) || strlen($page) > 120) {
        erreur("Fiche inconnue.", 400);
    }

    $pdo = bd();
    $avecReglages = reglages_disponibles($pdo);
    $avecAjouts = ajouts_disponibles($pdo);
    $requete = $pdo->prepare(
        'SELECT e.id, c.applis' . ($avecReglages ? ', c.reglages' : '') . ($avecAjouts ? ', e.ajouts' : '') . '
         FROM eleves e JOIN classes c ON c.id = e.classe_id
         WHERE e.code = ?'
    );
    $requete->execute([$code]);
    $eleve = $requete->fetch();
    $requete->closeCursor();
    if ($eleve === false) {
        compter_echec_adresse($adresse);
        erreur("Code inconnu.", 404);
    }
    if (!cours_ouvertures_disponibles($pdo)) {
        erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
    }

    // Ce que CET élève voit (la même règle que api/eleve.php).
    $acces = acces_de_l_eleve($eleve, isset($eleve['ajouts']) ? (string)$eleve['ajouts'] : null);
    if (!in_array('cours', $acces['applis'], true)) {
        erreur("Les cours ne sont pas ouverts à ta classe.", 403);
    }
    $fiche = cours_page_vers_fiche($acces['reglages']['cours'] ?? [], $page);
    if ($fiche === null) {
        erreur("Fiche inconnue.", 400);
    }

    noter_ouverture_cours($pdo, (int)$eleve['id'], $fiche, jour_local());
    repondre(['ok' => true]);
} catch (Throwable $e) {
    error_log('cours: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
