<?php
// Séance en direct — lot 1 « question éclair » (07/10/2026), lot 2
// « questionnaire au tableau » (15/10/2026).
//
// Ce que c'est. Le professeur ouvre une séance pour UNE classe, pose une
// question (à l'oral, au tableau, comme il veut), les élèves répondent sur
// leur écran, et le tableau montre combien ont répondu puis, quand il dévoile,
// la répartition des réponses — sans aucun nom.
//
// Ce que le serveur garde, et combien de temps. Trois tables, toutes
// TEMPORAIRES :
//  - directs            : une ligne par séance ouverte (une par classe au plus) ;
//  - directs_questions  : une ligne par question posée (son type, son réglage,
//                         la bonne réponse si le professeur l'a désignée) ;
//  - directs_reponses   : une ligne par élève et par question — et, au numéro
//                         0, une ligne par élève qui a REJOINT la séance (lot 2 :
//                         le tableau compte « 18 / 24 » sur les élèves présents,
//                         pas sur la classe entière avec ses absents).
// Tout part quand le professeur termine la séance, et de toute façon
// VEILLE_DIRECT secondes après que l'écran du tableau a cessé d'appeler le
// serveur, PLAFOND_DIRECT secondes après l'ouverture au plus tard
// (purger_directs(), jouée par chaque appel du professeur, chaque
// interrogation d'un élève et le ménage).
// Rien n'entre dans la sauvegarde (structure seule, comme les billets) : une
// réponse d'élève ne doit pas survivre dans un fichier chiffré de l'an passé.
//
// Ce que le serveur NE garde PAS : aucun énoncé, aucun texte libre, aucune
// note. Une réponse est une valeur courte dont la FORME est vérifiée par son
// type (une lettre pour un choix). Le fichier de fin de séance est fabriqué
// dans le navigateur du professeur ; le serveur ne le range nulle part.
//
// Lot 2 (15/10/2026) : le QUESTIONNAIRE préparé à l'avance (un fichier JSON
// chez le professeur, prof/questionnaire.js) ne vient JAMAIS ici. Le tableau
// pose chaque question comme une question éclair (type et réglage), avec en
// plus, si le fichier le dit, une DURÉE : c'est le serveur qui tient la fin du
// chrono (réglage « fin »), pas la page — une réponse arrivée après est
// refusée même si l'écran du tableau a été réduit. La bonne réponse, connue du
// fichier, n'arrive qu'avec « Dévoiler » : tant que la question est ouverte,
// le serveur ne la connaît pas.
//
// POUR FAIRE ÉVOLUER (décision du 07/10/2026 : « il ne faut pas faire un truc
// bloqué que je dois tout changer après ») :
//  - un nouveau TYPE de réponse (entier pour les tables, fraction en deux
//    cases, vrai/faux…) = une entrée de plus dans TYPES_DIRECT ci-dessous, avec
//    ses deux contrôles (réglage, réponse), et son dessin dans les deux pages
//    (direct.php pour l'élève, prof/direct.php pour le tableau, table RENDUS).
//    Ni le schéma ni l'API ne changent : « reponse » est déjà un texte court,
//    « reglage » un petit JSON ;
//  - un nouveau MODE de séance (évaluation où chacun avance à son rythme, QCM
//    préparé à l'avance) = une valeur de plus dans MODES_DIRECT ; la colonne
//    « mode » existe déjà pour ne pas avoir à modifier la table.

declare(strict_types=1);

require_once __DIR__ . '/bd.php';

// Serveur pro, lot 5e (25/10/2026, décision de Gwenaël) : la séance en direct
// est réservée au compte ADMINISTRATEUR pour l'instant — il la teste avant que
// les collègues s'en servent. Les ÉVALUATIONS, elles, restent ouvertes à tous
// (elles ne passent pas par les actions direct.*). Pour la rouvrir aux
// collègues : mettre false ici, et c'est tout — api/prof.php refuse d'après
// cette constante, et la page du professeur la lit dans « moi ».
const DIRECT_RESERVE_A_L_ADMINISTRATEUR = true;

// Ce compte peut-il mener une séance en direct ? (Le droit sur la classe —
// écriture au moins — se vérifie ensuite, comme avant.)
function direct_ouvert_au_compte(bool $admin): bool
{
    return $admin || !DIRECT_RESERVE_A_L_ADMINISTRATEUR;
}

// La VEILLE (17/10/2026, demande de Gwenaël : « c'est généralement un prof qui
// oublie »). Jusque-là, une séance vivait une heure et demie après le dernier
// geste du professeur, même tableau fermé. Désormais elle vit tant que
// l'écran du TABLEAU est là : chaque appel du tableau — son interrogation
// (toutes les secondes et demie, toutes les minutes quand l'onglet est
// caché), et chaque geste — repousse la fin à VEILLE_DIRECT secondes. Tableau
// quitté, onglet fermé, ordinateur en veille ou page déconnectée par le verrou
// des 30 minutes : la séance s'arrête seule vingt minutes plus tard, et tout
// s'efface. Les interrogations des ÉLÈVES ne prolongent rien.
// PLAFOND_DIRECT borne le tout, quoi que fasse le tableau : trois heures
// après l'ouverture, une séance s'arrête.
const VEILLE_DIRECT = 1200;
const PLAFOND_DIRECT = 10800;
// Le tableau interroge toutes les secondes et demie : sa présence ne s'écrit
// qu'une fois toutes les PAS_VEILLE_DIRECT secondes, pas à chaque appel.
const PAS_VEILLE_DIRECT = 30;
// Garde-fou, très au-dessus d'une heure de cours : une touche restée enfoncée
// ne remplit pas la base.
const MAX_QUESTIONS_DIRECT = 80;
// Ce que les pages attendent entre deux interrogations du serveur, en
// millisecondes. Le serveur le DIT dans chaque réponse : le rythme se règle
// ici, sans redéposer les pages ni attendre que les caches se vident.
const RYTHME_DIRECT_ELEVE = 2500;
const RYTHME_DIRECT_ELEVE_SANS_SEANCE = 6000;
const RYTHME_DIRECT_TABLEAU = 1500;

// Chrono d'une question (lot 2), en secondes : assez pour lire, pas plus
// qu'une activité entière.
const DUREE_DIRECT_MIN = 5;
const DUREE_DIRECT_MAX = 600;
// Le numéro 0 de directs_reponses : « cet élève a rejoint la séance ». Une
// question porte toujours un numéro à partir de 1.
const NUMERO_PRESENCE_DIRECT = 0;

// Lot E1 « les évaluations en classe » (15/10/2026) : le mode « evaluation »
// — chacun à son rythme, depuis Défi tables, une seule fois ; lib/evaluation.php.
const MODES_DIRECT = ['eclair', 'evaluation'];
const ETATS_DIRECT = ['attente', 'question', 'devoile'];
// Les états d'une évaluation (lib/evaluation.php).
const ETATS_EVALUATION = ['ouverte', 'fermee'];
const LETTRES_DIRECT = ['A', 'B', 'C', 'D', 'E', 'F'];

// ------------------------------------------------------------------ les types
//
// Un type de réponse dit deux choses, et le serveur ne sait rien d'autre de
// lui : quel RÉGLAGE est acceptable (remis au propre, ou null), et quelle
// RÉPONSE est acceptable pour ce réglage (remise au propre, ou null). La
// réponse rangée fait 40 caractères au plus et n'est JAMAIS un texte libre.
// « entier » (lot E1, 15/10/2026) : un nombre tapé sur le pavé — la valeur
// d'une évaluation des tables, et demain les réponses tapées au tableau.
const TYPES_DIRECT = ['choix', 'entier'];
// Un entier tapé : de 1 à 6 chiffres au plus (3 par défaut : les tables).
const CHIFFRES_DIRECT_MAX = 6;

// Le réglage d'une question, remis au propre ; null s'il ne convient pas.
function reglage_direct(string $type, mixed $brut): ?array
{
    $brut = is_array($brut) ? $brut : [];
    switch ($type) {
        case 'choix':
            // De deux à six réponses possibles, nommées A, B, C… ; quatre par
            // défaut. Rien d'autre : pas d'énoncé, pas de libellé.
            $choix = $brut['choix'] ?? 4;
            if (!is_int($choix) || $choix < 2 || $choix > count(LETTRES_DIRECT)) return null;
            $reglage = ['choix' => $choix];
            // Lot 2 : un chrono facultatif, en secondes entières. Absent ou
            // null : pas de chrono (c'est le réglage par défaut).
            $duree = $brut['duree'] ?? null;
            if ($duree !== null) {
                if (!is_int($duree) || $duree < DUREE_DIRECT_MIN || $duree > DUREE_DIRECT_MAX) return null;
                $reglage['duree'] = $duree;
            }
            return rang_direct($brut, $reglage);
        case 'entier':
            // Combien de chiffres au plus ; et le même chrono facultatif.
            $chiffres = $brut['chiffres'] ?? 3;
            if (!is_int($chiffres) || $chiffres < 1 || $chiffres > CHIFFRES_DIRECT_MAX) return null;
            $reglage = ['chiffres' => $chiffres];
            $duree = $brut['duree'] ?? null;
            if ($duree !== null) {
                if (!is_int($duree) || $duree < DUREE_DIRECT_MIN || $duree > DUREE_DIRECT_MAX) return null;
                $reglage['duree'] = $duree;
            }
            return rang_direct($brut, $reglage);
        default:
            return null;
    }
}

// Le RANG (17/10/2026) : le numéro que le TABLEAU affiche (« Question 1 / 8 »
// d'un questionnaire), pour que le téléphone dise le même. Sans lui, l'élève
// voyait le numéro du serveur (« Question 2 » si une question éclair avait
// précédé). Un entier de 1 au plafond de questions, rien d'autre ; absent pour
// une question éclair (l'élève voit alors le numéro de la séance, comme le
// tableau). Rien du questionnaire : un nombre.
function rang_direct(array $brut, array $reglage): ?array
{
    $rang = $brut['rang'] ?? null;
    if ($rang === null) return $reglage;
    if (!is_int($rang) || $rang < 1 || $rang > MAX_QUESTIONS_DIRECT) return null;
    $reglage['rang'] = $rang;
    return $reglage;
}

// Une réponse d'élève, remise au propre ; null si elle n'a pas la forme que
// son type et son réglage autorisent.
function reponse_direct(string $type, array $reglage, mixed $brute): ?string
{
    if (!is_string($brute)) return null;
    switch ($type) {
        case 'choix':
            $lettre = strtoupper(trim($brute));
            $permises = array_slice(LETTRES_DIRECT, 0, (int)($reglage['choix'] ?? 0));
            return in_array($lettre, $permises, true) ? $lettre : null;
        case 'entier':
            // Des chiffres, rien d'autre : ni signe, ni espace, ni virgule.
            $texte = trim($brute);
            $chiffres = (int)($reglage['chiffres'] ?? 3);
            if ($chiffres < 1 || $chiffres > CHIFFRES_DIRECT_MAX) $chiffres = 3;
            return preg_match('/^\d{1,' . $chiffres . '}$/', $texte) === 1 ? (string)(int)$texte : null;
        default:
            return null;
    }
}

// Le réglage tel qu'il est rangé (JSON court), relu sans jamais lever.
function lire_reglage_direct(?string $json): array
{
    $reglage = is_string($json) ? json_decode($json, true) : null;
    return is_array($reglage) ? $reglage : [];
}

// Le chrono de la question est-il écoulé ? La fin (« fin », instant epoch) est
// posée par le SERVEUR au moment où la question est posée ; sans chrono, il ne
// s'écoule jamais.
function chrono_ecoule_direct(array $reglage, ?int $maintenant = null): bool
{
    return isset($reglage['fin']) && is_int($reglage['fin']) && ($maintenant ?? time()) > $reglage['fin'];
}

// Les secondes qui restent au chrono (0 s'il est écoulé), ou null sans chrono.
function chrono_reste_direct(array $reglage, ?int $maintenant = null): ?int
{
    if (!isset($reglage['fin']) || !is_int($reglage['fin'])) return null;
    return max(0, $reglage['fin'] - ($maintenant ?? time()));
}

// Le réglage que l'ÉLÈVE reçoit : ce qu'il faut pour dessiner ses boutons, et
// rien du chrono (il n'a que les boutons A-D, décision du 15/10/2026).
function reglage_pour_l_eleve_direct(array $reglage): array
{
    unset($reglage['duree'], $reglage['fin']);
    return $reglage;
}

// -------------------------------------------------------------------- la purge
//
// La fin d'une séance éclair, vue d'un appel du tableau fait MAINTENANT :
// vingt minutes plus tard, jamais au-delà du plafond compté depuis l'ouverture.
function echeance_direct(int $ouvertLe, ?int $maintenant = null): int
{
    $maintenant ??= time();
    return min($maintenant + VEILLE_DIRECT, $ouvertLe + PLAFOND_DIRECT);
}

// Le tableau est là (direct.etat) : la fin recule. Une écriture au plus toutes
// les PAS_VEILLE_DIRECT secondes ; ni l'état ni la révision ne bougent, les
// élèves n'en voient rien. Jamais une évaluation (elle a sa propre fin).
function garder_direct_en_vie(PDO $pdo, array $direct): void
{
    if (($direct['mode'] ?? 'eclair') !== 'eclair') return;
    $echeance = echeance_direct((int)$direct['ouvert_le']);
    if ($echeance - (int)$direct['expire_le'] < PAS_VEILLE_DIRECT) return;
    $pdo->prepare("UPDATE directs SET expire_le = ? WHERE id = ? AND mode = 'eclair' AND expire_le < ?")
        ->execute([$echeance, (int)$direct['id'], $echeance]);
}

// Une séance dont le tableau ne s'est plus manifesté depuis VEILLE_DIRECT (ou
// ouverte depuis PLAFOND_DIRECT) disparaît, questions et réponses comprises.
// La table « directs » ne porte que quelques lignes (une par classe en
// séance) : la chercher à chaque appel ne coûte rien, et c'est ce qui tient la
// promesse « rien n'est conservé » même quand personne ne clique sur « Terminer ».
function purger_directs(PDO $pdo, ?int $maintenant = null): int
{
    $requete = $pdo->prepare('SELECT id FROM directs WHERE expire_le < ?');
    $requete->execute([$maintenant ?? time()]);
    $perimes = array_map('intval', array_column($requete->fetchAll(), 'id'));
    $requete->closeCursor();
    foreach ($perimes as $directId) {
        effacer_direct($pdo, $directId);
    }
    return count($perimes);
}

// Efface UNE séance et tout ce qui lui appartient. Un seul chemin pour
// « Terminer », la purge, et la suppression d'une classe.
function effacer_direct(PDO $pdo, int $directId): void
{
    $pdo->prepare('DELETE FROM directs_reponses WHERE direct_id = ?')->execute([$directId]);
    $pdo->prepare('DELETE FROM directs_questions WHERE direct_id = ?')->execute([$directId]);
    $pdo->prepare('DELETE FROM directs WHERE id = ?')->execute([$directId]);
}

// La classe disparaît (bouton, fin d'année, compte supprimé) : sa séance aussi.
function oublier_direct_de_la_classe(PDO $pdo, int $classeId): void
{
    $requete = $pdo->prepare('SELECT id FROM directs WHERE classe_id = ?');
    $requete->execute([$classeId]);
    $ids = array_map('intval', array_column($requete->fetchAll(), 'id'));
    $requete->closeCursor();
    foreach ($ids as $directId) {
        effacer_direct($pdo, $directId);
    }
}

// L'élève disparaît : ses réponses de la séance en cours aussi.
function oublier_reponses_direct_de_l_eleve(PDO $pdo, int $eleveId): void
{
    $pdo->prepare('DELETE FROM directs_reponses WHERE eleve_id = ?')->execute([$eleveId]);
}

// ------------------------------------------------------------------- lectures

// La séance ouverte pour cette classe, ou null. Une séance périmée que la
// purge n'a pas encore emportée est déjà « aucune séance ».
function direct_de_la_classe(PDO $pdo, int $classeId): ?array
{
    $requete = $pdo->prepare('SELECT * FROM directs WHERE classe_id = ? AND expire_le >= ?');
    $requete->execute([$classeId, time()]);
    $direct = $requete->fetch();
    $requete->closeCursor();
    return $direct === false ? null : $direct;
}

// Les séances ouvertes de ces classes : [classe_id => mode] (« eclair » ou
// « evaluation »). Pour la pastille de « Mes classes » (17/10/2026) : rien
// d'autre ne sort, ni question, ni réponse, ni nombre.
function modes_des_directs_ouverts(PDO $pdo, array $classeIds): array
{
    $ids = array_values(array_unique(array_map('intval', $classeIds)));
    if ($ids === []) return [];
    $marques = implode(',', array_fill(0, count($ids), '?'));
    $requete = $pdo->prepare("SELECT classe_id, mode FROM directs WHERE expire_le >= ? AND classe_id IN ($marques)");
    $requete->execute(array_merge([time()], $ids));
    $modes = [];
    foreach ($requete->fetchAll() as $ligne) {
        $mode = (string)$ligne['mode'];
        if (in_array($mode, MODES_DIRECT, true)) $modes[(int)$ligne['classe_id']] = $mode;
    }
    $requete->closeCursor();
    return $modes;
}

// La question en cours d'une séance (type, réglage, bonne réponse), ou null
// tant qu'aucune n'a été posée.
function question_du_direct(PDO $pdo, array $direct): ?array
{
    if ((int)$direct['numero'] < 1) return null;
    $requete = $pdo->prepare('SELECT type, reglage, bonne FROM directs_questions WHERE direct_id = ? AND numero = ?');
    $requete->execute([(int)$direct['id'], (int)$direct['numero']]);
    $question = $requete->fetch();
    $requete->closeCursor();
    if ($question === false) return null;
    return [
        'type' => (string)$question['type'],
        'reglage' => lire_reglage_direct($question['reglage']),
        'bonne' => $question['bonne'] === null ? null : (string)$question['bonne'],
    ];
}

// Ce que le TABLEAU reçoit. Pendant la question : combien ont répondu, et
// rien de plus — la répartition n'est même pas envoyée, elle ne peut donc pas
// s'afficher par erreur. Après « Dévoiler » : la répartition, sans aucun nom.
function etat_du_direct_pour_le_tableau(PDO $pdo, array $direct): array
{
    $directId = (int)$direct['id'];
    $numero = (int)$direct['numero'];
    $etat = in_array($direct['etat'], ETATS_DIRECT, true) ? (string)$direct['etat'] : 'attente';
    $question = question_du_direct($pdo, $direct);

    $requete = $pdo->prepare('SELECT COUNT(*) FROM eleves WHERE classe_id = ?');
    $requete->execute([(int)$direct['classe_id']]);
    $inscrits = (int)$requete->fetchColumn();
    $requete->closeCursor();

    // Les élèves qui ont rejoint la séance (lot 2). Un élève qui répond est
    // forcément passé par là ; max() garde le compte juste quand même.
    $requete = $pdo->prepare('SELECT COUNT(*) FROM directs_reponses WHERE direct_id = ? AND numero = ?');
    $requete->execute([$directId, NUMERO_PRESENCE_DIRECT]);
    $connectes = (int)$requete->fetchColumn();
    $requete->closeCursor();

    $repondu = 0;
    $repartition = null;
    if ($question !== null) {
        $requete = $pdo->prepare('SELECT reponse, COUNT(*) AS combien FROM directs_reponses WHERE direct_id = ? AND numero = ? GROUP BY reponse');
        $requete->execute([$directId, $numero]);
        $parReponse = [];
        foreach ($requete->fetchAll() as $ligne) {
            $parReponse[(string)$ligne['reponse']] = (int)$ligne['combien'];
            $repondu += (int)$ligne['combien'];
        }
        $requete->closeCursor();
        if ($etat === 'devoile') {
            ksort($parReponse, SORT_STRING);
            $repartition = (object)$parReponse;
        }
    }

    return [
        'mode' => (string)$direct['mode'],
        'etat' => $etat,
        'numero' => $numero,
        'revision' => (int)$direct['revision'],
        'type' => $question['type'] ?? null,
        'reglage' => $question === null ? null : (object)$question['reglage'],
        // La bonne réponse n'est connue du tableau qu'une fois dévoilé.
        'bonne' => $etat === 'devoile' ? ($question['bonne'] ?? null) : null,
        'inscrits' => $inscrits,
        'connectes' => max($connectes, $repondu),
        'repondu' => $repondu,
        'repartition' => $repartition,
        // Le chrono (lot 2) : sa durée, et ce qui reste tant que la question
        // est ouverte. À zéro, le tableau dévoile ; le serveur, lui, refuse
        // déjà toute réponse (api/direct.php).
        'duree' => $question === null ? null : ($question['reglage']['duree'] ?? null),
        'reste' => ($etat === 'question' && $question !== null) ? chrono_reste_direct($question['reglage']) : null,
        'expire_dans' => max(0, (int)$direct['expire_le'] - time()),
    ];
}

// ------------------------------------------------------------- gestes du prof

// Ouvre la séance de la classe, ou rend celle qui est déjà ouverte : deux
// clics, ou deux collègues, ne font pas deux séances (clé unique sur la classe).
function ouvrir_direct(PDO $pdo, int $classeId, int $profId): array
{
    $existant = direct_de_la_classe($pdo, $classeId);
    if ($existant !== null) return $existant;
    // Une séance périmée de cette classe occuperait la clé unique.
    purger_directs($pdo);
    try {
        $maintenant = time();
        $pdo->prepare('INSERT INTO directs (classe_id, prof_id, mode, etat, numero, revision, ouvert_le, expire_le) VALUES (?, ?, ?, ?, 0, 1, ?, ?)')
            ->execute([$classeId, $profId, 'eclair', 'attente', $maintenant, echeance_direct($maintenant, $maintenant)]);
    } catch (PDOException $e) {
        if (!doublon($e)) throw $e;
    }
    $direct = direct_de_la_classe($pdo, $classeId);
    if ($direct === null) throw new RuntimeException("la séance n'a pas pu être ouverte");
    return $direct;
}

// Pose la question suivante. Renvoie false si la séance a atteint son plafond.
function poser_question_direct(PDO $pdo, array $direct, string $type, array $reglage): bool
{
    return avec_reprise($pdo, function () use ($pdo, $direct, $type, $reglage): bool {
        transaction_ouvrir($pdo);
        try {
            $requete = $pdo->prepare('SELECT numero FROM directs WHERE id = ?' . pour_mise_a_jour($pdo));
            $requete->execute([(int)$direct['id']]);
            $numero = $requete->fetchColumn();
            $requete->closeCursor();
            if ($numero === false || (int)$numero >= MAX_QUESTIONS_DIRECT) {
                transaction_annuler($pdo);
                return false;
            }
            $suivant = (int)$numero + 1;
            // Le chrono part MAINTENANT, et c'est le serveur qui en tient la
            // fin : la page du tableau n'en est que l'affichage.
            if (isset($reglage['duree'])) $reglage['fin'] = time() + (int)$reglage['duree'];
            $pdo->prepare('INSERT INTO directs_questions (direct_id, numero, type, reglage, bonne) VALUES (?, ?, ?, ?, NULL)')
                ->execute([(int)$direct['id'], $suivant, $type, json_encode($reglage)]);
            $pdo->prepare('UPDATE directs SET numero = ?, etat = ?, revision = revision + 1, expire_le = ? WHERE id = ?')
                ->execute([$suivant, 'question', echeance_direct((int)$direct['ouvert_le']), (int)$direct['id']]);
            transaction_valider($pdo);
            return true;
        } catch (Throwable $e) {
            transaction_annuler($pdo);
            throw $e;
        }
    });
}

// Dévoile la question en cours : plus aucune réponse n'entre (voir
// repondre_au_direct), et le tableau reçoit la répartition.
//
// Lot 2 : le tableau qui pose un questionnaire envoie la bonne réponse AVEC
// « Dévoiler » — c'est le premier instant où le serveur la connaît. Elle n'est
// rangée que si CE geste a dévoilé la question : un second « Dévoiler » (fin du
// chrono et dernier élève au même moment, double clic) ne défait pas une bonne
// réponse que le professeur aurait corrigée entre-temps en cliquant une barre.
function devoiler_direct(PDO $pdo, array $direct, ?string $bonne = null): bool
{
    return avec_reprise($pdo, function () use ($pdo, $direct, $bonne): bool {
        transaction_ouvrir($pdo);
        try {
            $requete = $pdo->prepare('UPDATE directs SET etat = ?, revision = revision + 1, expire_le = ? WHERE id = ? AND etat = ?');
            $requete->execute(['devoile', echeance_direct((int)$direct['ouvert_le']), (int)$direct['id'], 'question']);
            $devoile = $requete->rowCount() === 1;
            if ($devoile && $bonne !== null) {
                $pdo->prepare('UPDATE directs_questions SET bonne = ? WHERE direct_id = ? AND numero = ?')
                    ->execute([$bonne, (int)$direct['id'], (int)$direct['numero']]);
            }
            transaction_valider($pdo);
            return $devoile;
        } catch (Throwable $e) {
            transaction_annuler($pdo);
            throw $e;
        }
    });
}

// Désigne (ou retire, avec null) la bonne réponse de la question dévoilée.
// Elle ne sert qu'à deux choses : la barre mise en avant au tableau, et la
// ligne « Bonne réponse » du fichier de fin de séance.
function designer_bonne_reponse_direct(PDO $pdo, array $direct, ?string $bonne): void
{
    $pdo->prepare('UPDATE directs_questions SET bonne = ? WHERE direct_id = ? AND numero = ?')
        ->execute([$bonne, (int)$direct['id'], (int)$direct['numero']]);
    $pdo->prepare('UPDATE directs SET revision = revision + 1, expire_le = ? WHERE id = ?')
        ->execute([echeance_direct((int)$direct['ouvert_le']), (int)$direct['id']]);
}

// Tout ce que la séance contient, pour le fichier que le professeur télécharge
// AVANT de la terminer : les questions, et les réponses élève par élève. C'est
// le seul endroit du lot où un prénom voyage à côté d'une réponse — vers le
// professeur qui a la classe en écriture, et nulle part ailleurs.
function contenu_du_direct(PDO $pdo, array $direct): array
{
    $directId = (int)$direct['id'];
    $requete = $pdo->prepare('SELECT numero, type, reglage, bonne FROM directs_questions WHERE direct_id = ? ORDER BY numero');
    $requete->execute([$directId]);
    $questions = [];
    foreach ($requete->fetchAll() as $ligne) {
        $questions[] = [
            'numero' => (int)$ligne['numero'],
            'type' => (string)$ligne['type'],
            'reglage' => (object)lire_reglage_direct($ligne['reglage']),
            'bonne' => $ligne['bonne'] === null ? null : (string)$ligne['bonne'],
        ];
    }
    $requete->closeCursor();

    // Les réponses aux QUESTIONS seulement : la ligne de présence (numéro 0)
    // n'a rien à faire dans le fichier.
    $requete = $pdo->prepare('SELECT eleve_id, numero, reponse FROM directs_reponses WHERE direct_id = ? AND numero >= 1');
    $requete->execute([$directId]);
    $parEleve = [];
    foreach ($requete->fetchAll() as $ligne) {
        $parEleve[(int)$ligne['eleve_id']][(string)(int)$ligne['numero']] = (string)$ligne['reponse'];
    }
    $requete->closeCursor();

    $requete = $pdo->prepare("SELECT id, prenom, initiale FROM eleves WHERE classe_id = ? ORDER BY prenom = '', prenom, code");
    $requete->execute([(int)$direct['classe_id']]);
    $eleves = [];
    foreach ($requete->fetchAll() as $ligne) {
        $eleves[] = [
            'prenom' => (string)$ligne['prenom'],
            'initiale' => (string)$ligne['initiale'],
            'reponses' => (object)($parEleve[(int)$ligne['id']] ?? []),
        ];
    }
    $requete->closeCursor();
    return ['questions' => $questions, 'eleves' => $eleves];
}

// ------------------------------------------------------------ côté de l'élève

// La séance de la classe de CET élève, avec la question en cours, en une
// lecture. Renvoie null si le code n'existe pas ; ['eleve_id' => …, 'direct'
// => null] s'il existe sans séance. « present » dit si l'élève a déjà été
// compté parmi ceux qui ont rejoint (lot 2) : la même lecture le dit, pour
// n'écrire sa présence qu'UNE fois par séance, jamais à chaque passage.
function direct_de_l_eleve(PDO $pdo, string $code): ?array
{
    $requete = $pdo->prepare(
        'SELECT e.id AS eleve_id, e.classe_id, d.id AS direct_id, d.numero, d.etat, d.revision, d.mode, d.expire_le,
                d.ouvert_le, d.reglage AS reglage_seance, q.type, q.reglage, p.id AS presence_id
         FROM eleves e
         LEFT JOIN directs d ON d.classe_id = e.classe_id
         LEFT JOIN directs_questions q ON q.direct_id = d.id AND q.numero = d.numero
         LEFT JOIN directs_reponses p ON p.direct_id = d.id AND p.numero = ' . NUMERO_PRESENCE_DIRECT . ' AND p.eleve_id = e.id
         WHERE e.code = ?'
    );
    $requete->execute([$code]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    if ($ligne === false) return null;
    $eleveId = (int)$ligne['eleve_id'];
    if ($ligne['direct_id'] === null || (int)$ligne['expire_le'] < time()) {
        return ['eleve_id' => $eleveId, 'direct' => null];
    }
    return ['eleve_id' => $eleveId, 'direct' => [
        'id' => (int)$ligne['direct_id'],
        'classe_id' => (int)$ligne['classe_id'],
        'numero' => (int)$ligne['numero'],
        'ouvert_le' => (int)$ligne['ouvert_le'],
        'expire_le' => (int)$ligne['expire_le'],
        // Le réglage de la SÉANCE (lot E1 : le modèle figé d'une évaluation),
        // tel quel ; celui de la question en cours reste « reglage ».
        'reglage_seance' => $ligne['reglage_seance'],
        'etat' => in_array($ligne['etat'], array_merge(ETATS_DIRECT, ETATS_EVALUATION), true) ? (string)$ligne['etat'] : 'attente',
        'revision' => (int)$ligne['revision'],
        'mode' => (string)$ligne['mode'],
        'type' => $ligne['type'] === null ? null : (string)$ligne['type'],
        'reglage' => lire_reglage_direct($ligne['reglage']),
        'present' => $ligne['presence_id'] !== null,
    ]];
}

// Note que l'élève a rejoint la séance (lot 2). Une ligne au plus par élève et
// par séance (clé unique séance × numéro × élève) ; le second appel ne change
// rien. Effacée avec la séance, comme ses réponses.
function noter_presence_direct(PDO $pdo, int $directId, int $eleveId): void
{
    if (pilote($pdo) === 'mysql') {
        $sql = 'INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE reponse = reponse';
    } else {
        $sql = 'INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (?, ?, ?, ?)
                ON CONFLICT(direct_id, numero, eleve_id) DO NOTHING';
    }
    $pdo->prepare($sql)->execute([$directId, NUMERO_PRESENCE_DIRECT, $eleveId, '']);
}

// La réponse déjà donnée par l'élève à cette question, ou null.
function reponse_de_l_eleve_au_direct(PDO $pdo, int $directId, int $numero, int $eleveId): ?string
{
    $requete = $pdo->prepare('SELECT reponse FROM directs_reponses WHERE direct_id = ? AND numero = ? AND eleve_id = ?');
    $requete->execute([$directId, $numero, $eleveId]);
    $reponse = $requete->fetchColumn();
    $requete->closeCursor();
    return $reponse === false ? null : (string)$reponse;
}

// Range la réponse — SEULEMENT si la question est encore ouverte, et c'est la
// même instruction qui le vérifie et qui écrit : une réponse partie à
// l'instant où le professeur dévoile entre avant, ou n'entre pas ; elle ne
// peut pas se glisser dans une question déjà dévoilée. Changer d'avis tant que
// la question est ouverte remplace la réponse (clé unique séance × question ×
// élève).
function repondre_au_direct(PDO $pdo, int $directId, int $numero, int $eleveId, string $reponse): void
{
    $source = "SELECT d.id, d.numero, ?, ? FROM directs d WHERE d.id = ? AND d.numero = ? AND d.etat = 'question'";
    if (pilote($pdo) === 'mysql') {
        $sql = "INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) $source
                ON DUPLICATE KEY UPDATE reponse = ?";
    } else {
        $sql = "INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) $source
                ON CONFLICT(direct_id, numero, eleve_id) DO UPDATE SET reponse = ?";
    }
    // La réponse est passée une seconde fois pour le remplacement : « VALUES() »
    // est déconseillé depuis MySQL 8.0.20, et « excluded » n'existe que sur SQLite.
    $pdo->prepare($sql)->execute([$eleveId, $reponse, $directId, $numero, $reponse]);
}
