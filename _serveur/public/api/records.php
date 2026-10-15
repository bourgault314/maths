<?php
// API élève des records de Défi tables (lot « 🏆 Les records », 09/10/2026).
// Toujours en POST, le code dans le corps — jamais dans l'adresse.
//
//  - {code, lire: true}        → la ligue de SON professeur (deux top 10),
//                                sa place, son record, son choix de nom ;
//  - {code, temps, justes, jour} → une course finie : « temps » en dixièmes
//                                de seconde, « justes » les bonnes réponses
//                                sur 25 ; « jour » (facultatif, D8) le jour
//                                de la course « AAAA-MM-JJ », pour sa
//                                semaine ; le serveur juge (lib/records.php) ;
//  - {code, nom: true|false}   → prénom ou Mystère (changeable à volonté).
//
// Réponses hors 200 que l'appli distingue :
//  400  refusé pour de bon (temps impossible, pas 25 sur 25) : pas de relance ;
//  403  les records ne sont pas ouverts à sa classe ;
//  404  code inconnu (comme partout) ;
//  409  « pas encore Légende » : la couronne n'est pas (encore) dans la
//       progression enregistrée ici — l'appli l'enverra après son prochain
//       enregistrement de parcours (la course de la couronne arrive souvent
//       avant la progression qui la porte) ;
//  503  la table n'existe pas encore : migrer.php n'a pas été ouvert.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/applis.php';
require __DIR__ . '/../lib/records.php';

cors();

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(4000);

    $code = normaliser_code(is_string($corps['code'] ?? null) ? $corps['code'] : '');
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }
    // Comme eleve.php : les échecs par adresse, et une limite large par code
    // (une ouverture d'accueil = une lecture ; une course = un envoi).
    $adresse = adresse_limitee();
    freiner_adresse($adresse);
    limiter('records:' . $code, 120, 300);

    $pdo = bd();
    $requete = $pdo->prepare('SELECT id FROM eleves WHERE code = ?');
    $requete->execute([$code]);
    $trouve = $requete->fetch();
    $requete->closeCursor();
    if ($trouve === false) {
        compter_echec_adresse($adresse);
        erreur("Code inconnu.", 404);
    }
    $eleveId = (int)$trouve['id'];
    if (!records_disponibles($pdo)) {
        erreur("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", 503);
    }
    $contexte = eleve_et_classe($pdo, $eleveId);
    if ($contexte === null) {
        compter_echec_adresse($adresse);
        erreur("Code inconnu.", 404);
    }
    $ouverts = records_ouverts_a_la_classe($contexte['classe']);

    // Ce que rend chaque entrée : la ligue, sa place, son record.
    $reponse = function (array $enPlus = []) use ($pdo, $contexte, $eleveId, $ouverts): never {
        if (!$ouverts) {
            repondre(['ok' => true, 'ouvert' => false] + $enPlus);
        }
        repondre(['ok' => true, 'ouvert' => true, 'legende' => est_legende($pdo, $eleveId),
            'record' => record_affichable(record_de($pdo, $eleveId))] + ligue($pdo, $contexte['prof_id'], $eleveId) + $enPlus);
    };

    if (!empty($corps['lire'])) {
        $reponse();
    }

    if (!$ouverts) {
        erreur("Les records ne sont pas ouverts à ta classe.", 403);
    }

    // ---------------------------------------------------------- le choix du nom
    if (array_key_exists('nom', $corps)) {
        if (!is_bool($corps['nom'])) {
            erreur("Choix illisible.", 400);
        }
        choisir_nom($pdo, $eleveId, $corps['nom']);
        $reponse();
    }

    // -------------------------------------------------------------- une course
    if (!array_key_exists('temps', $corps)) {
        erreur("Demande illisible.", 400);
    }
    $temps = $corps['temps'];
    $justes = $corps['justes'] ?? null;
    if (!is_int($temps) || !is_int($justes)) {
        erreur("Temps illisible.", 400);
    }
    if ($justes !== COURSE_TOTAL) {
        // L'appli n'envoie que des courses à 25 sur 25 ; un client bricolé
        // qui envoie autre chose est refusé net, sans relance.
        erreur("Le temps ne compte pas : il faut tout juste.", 400);
    }
    if ($temps < SEUIL_COURSE_DIXIEMES || $temps > COURSE_MAX_DIXIEMES) {
        erreur("Le temps ne compte pas.", 400);
    }
    if (!est_legende($pdo, $eleveId)) {
        // Pas (encore) Légende ici : l'appli réessaiera après avoir enregistré
        // sa progression. Rien n'est écrit.
        repondre(['ok' => false, 'legende' => false, 'erreur' => "Pas encore Légende des tables."], 409);
    }
    // D8 : le jour de la course, s'il est plausible ; sinon aujourd'hui.
    $resultat = enregistrer_course($pdo, $eleveId, $temps, jour_de_course($corps['jour'] ?? null));
    $reponse(['nouveau' => $resultat['nouveau'], 'avant' => $resultat['avant']]);
} catch (Throwable $e) {
    error_log('records: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
