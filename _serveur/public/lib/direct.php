<?php
// Séance en direct — lot 1 « question éclair » (07/10/2026).
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
//  - directs_reponses   : une ligne par élève et par question.
// Tout part quand le professeur termine la séance, et de toute façon
// DUREE_DIRECT secondes après son dernier geste (purger_directs(), jouée par
// chaque appel du professeur, chaque interrogation d'un élève et le ménage).
// Rien n'entre dans la sauvegarde (structure seule, comme les billets) : une
// réponse d'élève ne doit pas survivre dans un fichier chiffré de l'an passé.
//
// Ce que le serveur NE garde PAS : aucun énoncé, aucun texte libre, aucune
// note. Une réponse est une valeur courte dont la FORME est vérifiée par son
// type (une lettre pour un choix). Le fichier de fin de séance est fabriqué
// dans le navigateur du professeur ; le serveur ne le range nulle part.
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

// Une heure et demie après le DERNIER geste du professeur (ouvrir, poser une
// question, dévoiler) : une heure de cours et sa marge. Les interrogations des
// élèves ne prolongent rien.
const DUREE_DIRECT = 5400;
// Garde-fou, très au-dessus d'une heure de cours : une touche restée enfoncée
// ne remplit pas la base.
const MAX_QUESTIONS_DIRECT = 80;
// Ce que les pages attendent entre deux interrogations du serveur, en
// millisecondes. Le serveur le DIT dans chaque réponse : le rythme se règle
// ici, sans redéposer les pages ni attendre que les caches se vident.
const RYTHME_DIRECT_ELEVE = 2500;
const RYTHME_DIRECT_ELEVE_SANS_SEANCE = 6000;
const RYTHME_DIRECT_TABLEAU = 1500;

const MODES_DIRECT = ['eclair'];
const ETATS_DIRECT = ['attente', 'question', 'devoile'];
const LETTRES_DIRECT = ['A', 'B', 'C', 'D', 'E', 'F'];

// ------------------------------------------------------------------ les types
//
// Un type de réponse dit deux choses, et le serveur ne sait rien d'autre de
// lui : quel RÉGLAGE est acceptable (remis au propre, ou null), et quelle
// RÉPONSE est acceptable pour ce réglage (remise au propre, ou null). La
// réponse rangée fait 40 caractères au plus et n'est JAMAIS un texte libre.
const TYPES_DIRECT = ['choix'];

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
            return ['choix' => $choix];
        default:
            return null;
    }
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

// -------------------------------------------------------------------- la purge
//
// Une séance dont le professeur ne s'est plus occupé depuis DUREE_DIRECT
// disparaît, questions et réponses comprises. La table « directs » ne porte
// que quelques lignes (une par classe en séance) : la chercher à chaque appel
// ne coûte rien, et c'est ce qui tient la promesse « rien n'est conservé »
// même quand personne ne clique sur « Terminer ».
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
        'repondu' => $repondu,
        'repartition' => $repartition,
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
        $pdo->prepare('INSERT INTO directs (classe_id, prof_id, mode, etat, numero, revision, ouvert_le, expire_le) VALUES (?, ?, ?, ?, 0, 1, ?, ?)')
            ->execute([$classeId, $profId, 'eclair', 'attente', time(), time() + DUREE_DIRECT]);
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
            $pdo->prepare('INSERT INTO directs_questions (direct_id, numero, type, reglage, bonne) VALUES (?, ?, ?, ?, NULL)')
                ->execute([(int)$direct['id'], $suivant, $type, json_encode($reglage)]);
            $pdo->prepare('UPDATE directs SET numero = ?, etat = ?, revision = revision + 1, expire_le = ? WHERE id = ?')
                ->execute([$suivant, 'question', time() + DUREE_DIRECT, (int)$direct['id']]);
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
function devoiler_direct(PDO $pdo, array $direct): bool
{
    $requete = $pdo->prepare('UPDATE directs SET etat = ?, revision = revision + 1, expire_le = ? WHERE id = ? AND etat = ?');
    $requete->execute(['devoile', time() + DUREE_DIRECT, (int)$direct['id'], 'question']);
    return $requete->rowCount() === 1;
}

// Désigne (ou retire, avec null) la bonne réponse de la question dévoilée.
// Elle ne sert qu'à deux choses : la barre mise en avant au tableau, et la
// ligne « Bonne réponse » du fichier de fin de séance.
function designer_bonne_reponse_direct(PDO $pdo, array $direct, ?string $bonne): void
{
    $pdo->prepare('UPDATE directs_questions SET bonne = ? WHERE direct_id = ? AND numero = ?')
        ->execute([$bonne, (int)$direct['id'], (int)$direct['numero']]);
    $pdo->prepare('UPDATE directs SET revision = revision + 1, expire_le = ? WHERE id = ?')
        ->execute([time() + DUREE_DIRECT, (int)$direct['id']]);
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

    $requete = $pdo->prepare('SELECT eleve_id, numero, reponse FROM directs_reponses WHERE direct_id = ?');
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
// => null] s'il existe sans séance.
function direct_de_l_eleve(PDO $pdo, string $code): ?array
{
    $requete = $pdo->prepare(
        'SELECT e.id AS eleve_id, d.id AS direct_id, d.numero, d.etat, d.revision, d.mode, d.expire_le,
                q.type, q.reglage
         FROM eleves e
         LEFT JOIN directs d ON d.classe_id = e.classe_id
         LEFT JOIN directs_questions q ON q.direct_id = d.id AND q.numero = d.numero
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
        'numero' => (int)$ligne['numero'],
        'etat' => in_array($ligne['etat'], ETATS_DIRECT, true) ? (string)$ligne['etat'] : 'attente',
        'revision' => (int)$ligne['revision'],
        'mode' => (string)$ligne['mode'],
        'type' => $ligne['type'] === null ? null : (string)$ligne['type'],
        'reglage' => lire_reglage_direct($ligne['reglage']),
    ]];
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
