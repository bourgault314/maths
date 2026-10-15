<?php
// API élève de la séance en direct — lot 1 « question éclair » (07/10/2026).
//
// Deux entrées, toujours en POST, le code dans le CORPS (jamais dans
// l'adresse, comme le reste du serveur) :
//  - {code}                    → la séance en cours de SA classe, ou « aucune » :
//                                l'état, la question (son type et son réglage,
//                                jamais la bonne réponse), sa propre réponse ;
//  - {code, numero, reponse}   → range sa réponse à la question n° numero, tant
//                                qu'elle est ouverte ; rend le même état.
//
// L'élève ne reçoit JAMAIS la répartition des réponses ni la bonne réponse :
// elles se découvrent au tableau, c'est le professeur qui mène.
//
// La page de l'élève interroge cette adresse en boucle (« rythme », en
// millisecondes, dit par le serveur). Une interrogation ne fait que LIRE : pas
// de compteur incrémenté à chaque passage — trente élèves toutes les deux
// secondes et demie, ce serait douze écritures par seconde pour rien. Seules
// les RÉPONSES sont comptées (120 par code et par cinq minutes), et un code
// inconnu compte comme un échec pour l'adresse, comme partout ailleurs.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require_once __DIR__ . '/../lib/direct.php';

cors();

// Ce que l'élève reçoit d'une séance. $eleveId sert à relire SA réponse.
function etat_du_direct_pour_l_eleve(PDO $pdo, array $direct, int $eleveId): array
{
    $enQuestion = $direct['numero'] >= 1 && $direct['type'] !== null;
    return [
        'mode' => $direct['mode'],
        'etat' => $enQuestion ? $direct['etat'] : 'attente',
        'numero' => $direct['numero'],
        'revision' => $direct['revision'],
        'type' => $enQuestion ? $direct['type'] : null,
        'reglage' => $enQuestion ? (object)$direct['reglage'] : null,
        'reponse' => $enQuestion
            ? reponse_de_l_eleve_au_direct($pdo, $direct['id'], $direct['numero'], $eleveId)
            : null,
    ];
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(2000);

    // Comme api/eleve.php : par adresse, seuls les échecs comptent.
    $adresse = adresse_limitee();
    freiner_adresse($adresse);

    $code = normaliser_code(is_string($corps['code'] ?? null) ? $corps['code'] : '');
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }

    $pdo = bd();
    // Une séance oubliée ouverte disparaît au premier passage de n'importe qui.
    purger_directs($pdo);

    $trouve = direct_de_l_eleve($pdo, $code);
    if ($trouve === null) {
        compter_echec_adresse($adresse);
        erreur("Code inconnu.", 404);
    }
    $eleveId = $trouve['eleve_id'];
    $direct = $trouve['direct'];

    if ($direct === null) {
        // Répondre à une séance qui n'existe plus : la page l'apprend et
        // revient à « aucune séance », ce n'est pas une panne.
        repondre(['ok' => true, 'direct' => null, 'rythme' => RYTHME_DIRECT_ELEVE_SANS_SEANCE]);
    }

    if (array_key_exists('reponse', $corps)) {
        limiter('direct:' . $code, 120, 300);
        $numero = is_int($corps['numero'] ?? null) ? $corps['numero'] : 0;
        $ouverte = $direct['etat'] === 'question' && $direct['type'] !== null && $numero === $direct['numero'];
        if ($ouverte) {
            $reponse = reponse_direct($direct['type'], $direct['reglage'], $corps['reponse']);
            if ($reponse === null) {
                erreur("Cette réponse n'existe pas pour cette question.", 400);
            }
            repondre_au_direct($pdo, $direct['id'], $direct['numero'], $eleveId, $reponse);
            // Relu APRÈS l'écriture : si le professeur a dévoilé entre-temps,
            // l'élève voit l'état vrai et la réponse réellement gardée.
            $direct = direct_de_l_eleve($pdo, $code)['direct'] ?? null;
            if ($direct === null) {
                repondre(['ok' => true, 'direct' => null, 'rythme' => RYTHME_DIRECT_ELEVE_SANS_SEANCE]);
            }
        }
        // Question déjà dévoilée, ou numéro d'une question passée : rien n'est
        // écrit, et l'état rendu le dit (« enregistree: false »).
        repondre([
            'ok' => true,
            'enregistree' => $ouverte,
            'direct' => etat_du_direct_pour_l_eleve($pdo, $direct, $eleveId),
            'rythme' => RYTHME_DIRECT_ELEVE,
        ]);
    }

    repondre([
        'ok' => true,
        'direct' => etat_du_direct_pour_l_eleve($pdo, $direct, $eleveId),
        'rythme' => RYTHME_DIRECT_ELEVE,
    ]);
} catch (Throwable $e) {
    error_log('direct: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
