<?php
// API élève de la séance en direct — lot 1 « question éclair » (07/10/2026),
// lot 2 « questionnaire au tableau » (15/10/2026).
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
//
// Lot 2 : la PRÉSENCE. La première fois qu'un élève interroge une séance
// ouverte, une ligne le note (une seule écriture par élève et par séance, pas
// une par passage) : le tableau compte « 18 / 24 » sur ceux qui ont rejoint.
// Et le CHRONO : une question dont la fin est passée est fermée pour l'élève
// (il voit « Regarde le tableau »), même si le tableau n'a pas encore dévoilé.
//
// Lot E1 « les évaluations en classe » (15/10/2026, lib/evaluation.php) : la
// séance de la classe peut être une ÉVALUATION. Elle arrive sous la clé
// « evaluation » (et « direct » vaut null : pour la page de la question
// éclair, il n'y a pas de séance). Quatre gestes, le code toujours dans le
// corps :
//  - {code}                                      → l'état : ouverte / fermée,
//                                                  le modèle, et s'il a commencé
//                                                  SES graines et SES réponses ;
//  - {code, commencer: true}                     → « Je commence » : le serveur
//                                                  tire sa graine et pose son
//                                                  début — une fois ;
//  - {code, numero, reponse, dixiemes}           → sa réponse à la question
//                                                  n° numero (la suivante, une
//                                                  seule fois ; « reponse » vide
//                                                  = pas de réponse) ;
//  - {code, finir: true}                         → « J'ai fini ».
// Ici non plus la présence n'est pas notée au passage : c'est « Je commence »
// qui la note, et un élève qui n'a fait qu'ouvrir l'appli n'a pas commencé.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require_once __DIR__ . '/../lib/direct.php';
require_once __DIR__ . '/../lib/evaluation.php';

cors();

// Ce que l'élève reçoit d'une séance. $eleveId sert à relire SA réponse.
function etat_du_direct_pour_l_eleve(PDO $pdo, array $direct, int $eleveId): array
{
    $enQuestion = $direct['numero'] >= 1 && $direct['type'] !== null;
    $etat = $enQuestion ? $direct['etat'] : 'attente';
    // Chrono écoulé : pour l'élève, la question est close (il ne reçoit ni la
    // durée ni la fin : il n'a que ses boutons).
    if ($etat === 'question' && chrono_ecoule_direct($direct['reglage'])) $etat = 'devoile';
    return [
        'mode' => $direct['mode'],
        'etat' => $etat,
        'numero' => $direct['numero'],
        'revision' => $direct['revision'],
        'type' => $enQuestion ? $direct['type'] : null,
        'reglage' => $enQuestion ? (object)reglage_pour_l_eleve_direct($direct['reglage']) : null,
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
        repondre(['ok' => true, 'direct' => null, 'evaluation' => null, 'rythme' => RYTHME_DIRECT_ELEVE_SANS_SEANCE]);
    }

    // Lot E1 : une évaluation. Rien de la question éclair ne s'applique.
    if ($direct['mode'] === 'evaluation') {
        $evaluation = lire_evaluation([
            'id' => $direct['id'], 'classe_id' => $direct['classe_id'], 'mode' => 'evaluation', 'etat' => $direct['etat'],
            'revision' => $direct['revision'], 'ouvert_le' => $direct['ouvert_le'], 'expire_le' => $direct['expire_le'],
            'reglage' => $direct['reglage_seance'],
        ]);
        $geste = array_key_exists('reponse', $corps) ? 'reponse'
            : (($corps['commencer'] ?? false) === true ? 'commencer' : (($corps['finir'] ?? false) === true ? 'finir' : null));
        $enregistree = null;
        if ($geste !== null) {
            // Les gestes sont comptés comme les réponses de la question éclair.
            limiter('direct:' . $code, 120, 300);
            if ($geste === 'commencer') {
                if (commencer_evaluation($pdo, $evaluation, $eleveId) === null) {
                    erreur("L'évaluation est fermée.", 409);
                }
            } else {
                $presence = presence_evaluation($pdo, $evaluation['id'], $eleveId);
                if ($presence === null) erreur("Commence d'abord l'évaluation.", 409);
                if ($geste === 'finir') {
                    finir_evaluation($pdo, $evaluation, $eleveId, $presence);
                } else {
                    $numero = is_int($corps['numero'] ?? null) ? $corps['numero'] : 0;
                    $dixiemes = is_int($corps['dixiemes'] ?? null) ? $corps['dixiemes'] : 0;
                    // La valeur passe par le type « entier » de la séance en
                    // direct ; vide, c'est « pas de réponse », rangé tel quel.
                    $valeur = is_string($corps['reponse']) && trim($corps['reponse']) === '' ? ''
                        : reponse_direct('entier', ['chiffres' => 3], $corps['reponse']);
                    if ($valeur === null) erreur("Cette réponse n'existe pas pour cette question.", 400);
                    // Rien n'entre une fois l'évaluation fermée, la fenêtre de
                    // l'élève passée, ou son évaluation finie.
                    $ouverte = !$presence['fini'] && !evaluation_fermee($evaluation) && !fenetre_evaluation_close($evaluation, $presence);
                    $enregistree = $ouverte && repondre_evaluation($pdo, $evaluation, $eleveId, $numero, $valeur, $dixiemes);
                    if ($enregistree && count(reponses_evaluation_de_l_eleve($pdo, $evaluation['id'], $eleveId)) >= (int)$evaluation['reglage']['n']) {
                        finir_evaluation($pdo, $evaluation, $eleveId, $presence);
                    }
                }
            }
        }
        $reponse = ['ok' => true, 'direct' => null, 'evaluation' => etat_evaluation_pour_l_eleve($pdo, $evaluation, $eleveId),
            'rythme' => RYTHME_DIRECT_ELEVE_SANS_SEANCE];
        if ($enregistree !== null) $reponse['enregistree'] = $enregistree;
        repondre($reponse);
    }

    // L'élève a rejoint la séance : noté une fois, la première fois.
    if (!$direct['present']) noter_presence_direct($pdo, $direct['id'], $eleveId);

    if (array_key_exists('reponse', $corps)) {
        limiter('direct:' . $code, 120, 300);
        $numero = is_int($corps['numero'] ?? null) ? $corps['numero'] : 0;
        $ouverte = $direct['etat'] === 'question' && $direct['type'] !== null && $numero === $direct['numero']
            && !chrono_ecoule_direct($direct['reglage']);
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
                repondre(['ok' => true, 'direct' => null, 'evaluation' => null, 'rythme' => RYTHME_DIRECT_ELEVE_SANS_SEANCE]);
            }
        }
        // Question déjà dévoilée, chrono écoulé, ou numéro d'une question
        // passée : rien n'est écrit, et l'état rendu le dit (« enregistree:
        // false »).
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
