<?php
// Les évaluations en classe — lot E1 (15/10/2026), décisions de Gwenaël.
//
// Ce que c'est. Le professeur prépare des MODÈLES (tables, types de question,
// nombre, chrono, calculs exclus ou imposés, tirage) dans Ma classe ; le jour
// venu il en OUVRE un pour une classe, pendant 30 min, 1 h ou 2 h ; chaque
// élève la fait depuis Défi tables, quand il veut, à son rythme, UNE SEULE
// FOIS ; à la fermeture le professeur télécharge un fichier (une note par
// élève, le détail des ratés), et tout est effacé.
//
// Ce que le serveur sait, et ne sait pas. Il ne connaît NI les questions NI la
// correction : il distribue des GRAINES — une par évaluation, une par élève —,
// l'appli tire la série avec le moteur de Défi tables (defi_tables_core.js,
// genererEvaluationDeClasse) et Ma classe refait exactement le même tirage
// pour corriger dans le navigateur du professeur. Une réponse rangée ici est
// « 56|43 » : ce que l'élève a tapé (vide : rien) et les dixièmes de seconde
// écoulés. Aucune note n'entre jamais en base (RGPD : Pronote est l'outil des
// notes), et tout part au plus tard vingt heures après la fermeture.
//
// La plomberie est celle de la séance en direct (lib/direct.php) : une
// évaluation ouverte est une ligne de « directs » au mode « evaluation » (une
// séance par classe : pas de question éclair pendant une évaluation), son
// réglage figé dans directs.reglage (le modèle, la graine, la durée, la fin),
// la présence d'un élève au numéro 0 de directs_reponses (sa graine, son
// instant de début, s'il a fini), ses réponses une ligne par question.
//
// Les MODÈLES, eux, sont durables : table modeles_evaluation, attachés au
// compte du professeur (il ouvre depuis le collège, pas depuis le navigateur
// de la maison). Dix réglages, aucune donnée d'élève.

declare(strict_types=1);

require_once __DIR__ . '/bd.php';
require_once __DIR__ . '/direct.php';

// Les bornes du réglage. Les mêmes que BORNES_EVALUATION du moteur
// (defi_tables_core.js) : un test du dépôt les compare.
const EVALUATION_QUESTIONS_MIN = 5;
const EVALUATION_QUESTIONS_MAX = 50;
const EVALUATION_SECONDES_QUESTION = [3, 60];
const EVALUATION_SECONDES_GLOBAL = [30, 1800];
const EVALUATION_NOM_MAX = 40;
const TYPES_EVALUATION = ['direct', 'missing', 'division'];
const TIRAGES_EVALUATION = ['memes', 'identique', 'differents'];
const CHRONOS_EVALUATION = ['question', 'global', 'sans'];
// Combien de temps l'évaluation reste ouverte : 30 min, 1 h (défaut), 2 h ;
// fermeture automatique à l'échéance, les réponses ne prolongent rien.
const DUREES_OUVERTURE_EVALUATION = [1800, 3600, 7200];
// Après la fermeture, les réponses attendent le fichier jusqu'au lendemain
// matin (vingt heures), puis la purge de la séance en direct les emporte.
const GARDE_APRES_FERMETURE_EVALUATION = 72000;
// La fenêtre d'un élève, tenue par le serveur : son début + N × le temps par
// question (ou le temps global) + cette marge. Au-delà, plus rien n'entre.
const MARGE_FENETRE_EVALUATION = 10;
const MAX_MODELES_PAR_PROF = 30;
// Ce que Ma classe attend entre deux lectures du compteur, en millisecondes.
const RYTHME_EVALUATION_CLASSE = 3000;

// ----------------------------------------------------------------- le réglage

// Un calcul s'écrit « a-b » (a ≤ b, de 1 à 10) : 7 × 8 et 8 × 7 sont le même.
function cle_calcul_evaluation(mixed $texte): ?string
{
    if (!is_string($texte) || !preg_match('/^(\d{1,2})-(\d{1,2})$/', $texte, $m)) return null;
    $a = (int)$m[1];
    $b = (int)$m[2];
    if ($a < 1 || $a > 10 || $b < 1 || $b > 10) return null;
    return min($a, $b) . '-' . max($a, $b);
}

// Tous les calculs que des tables peuvent poser, chacun une fois.
function calculs_disponibles_evaluation(array $tables): array
{
    $liste = [];
    foreach ($tables as $table) {
        for ($m = 1; $m <= 10; $m++) {
            $cle = min($table, $m) . '-' . max($table, $m);
            if (!in_array($cle, $liste, true)) $liste[] = $cle;
        }
    }
    return $liste;
}

// Le réglage d'un modèle, remis au propre ; null s'il ne convient pas. Même
// forme et mêmes règles que verifierReglageEvaluation() du moteur — la page
// vérifie d'abord avec le moteur (pour dire ce qui ne va pas), le serveur
// revérifie ici et ne range jamais autre chose que cette forme.
function reglage_evaluation(mixed $brut): ?array
{
    if (!is_array($brut)) return null;
    $tables = [];
    foreach (is_array($brut['tables'] ?? null) ? $brut['tables'] : [] as $table) {
        if (!is_int($table) || $table < 1 || $table > 10) return null;
        if (!in_array($table, $tables, true)) $tables[] = $table;
    }
    sort($tables);
    if ($tables === []) return null;
    $types = [];
    foreach (TYPES_EVALUATION as $type) {
        if (is_array($brut['types'] ?? null) && in_array($type, $brut['types'], true)) $types[] = $type;
    }
    if ($types === []) return null;
    $n = $brut['n'] ?? null;
    if (!is_int($n) || $n < EVALUATION_QUESTIONS_MIN || $n > EVALUATION_QUESTIONS_MAX) return null;
    $chrono = $brut['chrono'] ?? null;
    if (!in_array($chrono, CHRONOS_EVALUATION, true)) return null;
    $secondes = null;
    if ($chrono !== 'sans') {
        [$min, $max] = $chrono === 'question' ? EVALUATION_SECONDES_QUESTION : EVALUATION_SECONDES_GLOBAL;
        $secondes = $brut['secondes'] ?? null;
        if (!is_int($secondes) || $secondes < $min || $secondes > $max) return null;
    }
    $tirage = in_array($brut['tirage'] ?? null, TIRAGES_EVALUATION, true) ? (string)$brut['tirage'] : 'memes';
    $disponibles = calculs_disponibles_evaluation($tables);
    $lire = function (mixed $liste) use ($disponibles): ?array {
        $cles = [];
        foreach (is_array($liste) ? $liste : [] as $texte) {
            $cle = cle_calcul_evaluation($texte);
            if ($cle === null || !in_array($cle, $disponibles, true)) return null;
            if (!in_array($cle, $cles, true)) $cles[] = $cle;
        }
        return $cles;
    };
    $exclus = $lire($brut['exclus'] ?? []);
    $imposes = $lire($brut['imposes'] ?? []);
    if ($exclus === null || $imposes === null) return null;
    if (array_intersect($exclus, $imposes) !== []) return null;
    if (count($imposes) > $n) return null;
    if (count($disponibles) - count($exclus) < 1) return null;
    return ['tables' => $tables, 'types' => $types, 'n' => $n, 'chrono' => $chrono, 'secondes' => $secondes,
        'tirage' => $tirage, 'exclus' => $exclus, 'imposes' => $imposes];
}

// Le nom d'un modèle : un texte court, sans caractère de commande.
function nom_modele_evaluation(mixed $brut): string
{
    $nom = is_string($brut) ? $brut : '';
    $nom = preg_replace('/[\x00-\x1F\x7F\x{200B}-\x{200F}\x{2060}-\x{206F}]/u', '', $nom) ?? '';
    $nom = trim(preg_replace('/\s+/u', ' ', $nom) ?? '');
    return mb_substr($nom, 0, EVALUATION_NOM_MAX);
}

// ----------------------------------------------------------------- les modèles

function lire_modele_evaluation(array $ligne): array
{
    $reglage = json_decode((string)$ligne['reglage'], true);
    return [
        'id' => (int)$ligne['id'],
        'nom' => (string)$ligne['nom'],
        'reglage' => is_array($reglage) ? $reglage : [],
        'modifie_le' => (int)$ligne['modifie_le'],
    ];
}

// Les modèles d'UN professeur, les plus récents d'abord. Jamais ceux d'un autre.
function modeles_du_prof(PDO $pdo, int $profId): array
{
    $requete = $pdo->prepare('SELECT id, nom, reglage, modifie_le FROM modeles_evaluation WHERE prof_id = ? ORDER BY modifie_le DESC, id DESC');
    $requete->execute([$profId]);
    $modeles = array_map('lire_modele_evaluation', $requete->fetchAll());
    $requete->closeCursor();
    return $modeles;
}

function modele_du_prof(PDO $pdo, int $profId, int $id): ?array
{
    $requete = $pdo->prepare('SELECT id, nom, reglage, modifie_le FROM modeles_evaluation WHERE id = ? AND prof_id = ?');
    $requete->execute([$id, $profId]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    return $ligne === false ? null : lire_modele_evaluation($ligne);
}

// Crée (id null) ou remplace (id du professeur) un modèle. Renvoie son id, ou
// null si le modèle à remplacer n'est pas le sien ou si le quota est atteint.
function enregistrer_modele_evaluation(PDO $pdo, int $profId, ?int $id, string $nom, array $reglage): ?int
{
    $json = json_encode($reglage);
    if ($id !== null) {
        $requete = $pdo->prepare('UPDATE modeles_evaluation SET nom = ?, reglage = ?, modifie_le = ? WHERE id = ? AND prof_id = ?');
        $requete->execute([$nom, $json, time(), $id, $profId]);
        return $requete->rowCount() === 1 || modele_du_prof($pdo, $profId, $id) !== null ? $id : null;
    }
    $requete = $pdo->prepare('SELECT COUNT(*) FROM modeles_evaluation WHERE prof_id = ?');
    $requete->execute([$profId]);
    $combien = (int)$requete->fetchColumn();
    $requete->closeCursor();
    if ($combien >= MAX_MODELES_PAR_PROF) return null;
    $pdo->prepare('INSERT INTO modeles_evaluation (prof_id, nom, reglage, cree_le, modifie_le) VALUES (?, ?, ?, ?, ?)')
        ->execute([$profId, $nom, $json, time(), time()]);
    return (int)$pdo->lastInsertId();
}

function supprimer_modele_evaluation(PDO $pdo, int $profId, int $id): bool
{
    $requete = $pdo->prepare('DELETE FROM modeles_evaluation WHERE id = ? AND prof_id = ?');
    $requete->execute([$id, $profId]);
    return $requete->rowCount() === 1;
}

// Le compte supprimé emporte ses modèles.
function oublier_modeles_du_prof(PDO $pdo, int $profId): void
{
    if (table_existe($pdo, 'modeles_evaluation')) {
        $pdo->prepare('DELETE FROM modeles_evaluation WHERE prof_id = ?')->execute([$profId]);
    }
}

// ------------------------------------------------------------ la séance ouverte

// La ligne « directs » d'une évaluation, avec son réglage relu : le modèle
// figé (tables, types, n, chrono, secondes, tirage, exclus, imposes), le nom,
// la graine de l'évaluation, la durée d'ouverture, la fin.
function lire_evaluation(array $direct): array
{
    $direct['reglage'] = lire_reglage_direct($direct['reglage'] ?? null);
    return $direct;
}

// L'évaluation de cette classe (ouverte, ou fermée et pas encore purgée), ou null.
function evaluation_de_la_classe(PDO $pdo, int $classeId): ?array
{
    $direct = direct_de_la_classe($pdo, $classeId);
    if ($direct === null || ($direct['mode'] ?? '') !== 'evaluation') return null;
    return lire_evaluation($direct);
}

// La séance ÉCLAIR de la classe : une évaluation n'en est pas une.
function direct_eclair_de_la_classe(PDO $pdo, int $classeId): ?array
{
    $direct = direct_de_la_classe($pdo, $classeId);
    return $direct === null || ($direct['mode'] ?? 'eclair') !== 'eclair' ? null : $direct;
}

function evaluation_fermee(array $evaluation, ?int $maintenant = null): bool
{
    $fin = (int)($evaluation['reglage']['fin'] ?? 0);
    return $evaluation['etat'] === 'fermee' || ($maintenant ?? time()) > $fin;
}

// Ouvre une évaluation pour la classe. Renvoie la ligne ; ou 'eclair' si une
// question éclair occupe la classe (une séance par classe) ; ou la ligne déjà
// ouverte (deux clics, deux collègues : une seule évaluation).
function ouvrir_evaluation(PDO $pdo, int $classeId, int $profId, array $modele, int $duree): array|string
{
    $existant = direct_de_la_classe($pdo, $classeId);
    if ($existant !== null) {
        return ($existant['mode'] ?? 'eclair') === 'evaluation' ? lire_evaluation($existant) : 'eclair';
    }
    purger_directs($pdo);
    $reglage = $modele['reglage'] + [
        'nom' => (string)$modele['nom'],
        // La graine de l'évaluation : tirée ICI, jamais par une page.
        'graine' => random_int(0, 4294967295),
        'duree' => $duree,
        'fin' => time() + $duree,
    ];
    try {
        $pdo->prepare('INSERT INTO directs (classe_id, prof_id, mode, etat, numero, revision, ouvert_le, expire_le, reglage) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)')
            ->execute([$classeId, $profId, 'evaluation', 'ouverte', (int)$modele['reglage']['n'], time(),
                $reglage['fin'] + GARDE_APRES_FERMETURE_EVALUATION, json_encode($reglage)]);
    } catch (PDOException $e) {
        if (!doublon($e)) throw $e;
    }
    $direct = direct_de_la_classe($pdo, $classeId);
    if ($direct === null) throw new RuntimeException("l'évaluation n'a pas pu être ouverte");
    return ($direct['mode'] ?? '') === 'evaluation' ? lire_evaluation($direct) : 'eclair';
}

// Ferme l'évaluation maintenant : plus rien n'entre, les réponses attendent
// le fichier jusqu'au lendemain matin. Fermer deux fois ne change rien.
function fermer_evaluation(PDO $pdo, array $evaluation): void
{
    if ($evaluation['etat'] === 'fermee') return;
    $reglage = $evaluation['reglage'];
    $reglage['fin'] = min((int)($reglage['fin'] ?? time()), time());
    $pdo->prepare('UPDATE directs SET etat = ?, revision = revision + 1, expire_le = ?, reglage = ? WHERE id = ? AND etat = ?')
        ->execute(['fermee', $reglage['fin'] + GARDE_APRES_FERMETURE_EVALUATION, json_encode($reglage), (int)$evaluation['id'], 'ouverte']);
}

// ------------------------------------------------------------- les présences

// La ligne de présence d'un élève (numéro 0) : « graine|début|fini ».
function lire_presence_evaluation(?string $reponse): ?array
{
    if (!is_string($reponse) || !preg_match('/^(\d{1,10})\|(\d{1,10})(\|1)?$/', $reponse, $m)) return null;
    return ['graine' => (int)$m[1], 'debut' => (int)$m[2], 'fini' => isset($m[3])];
}

function presence_evaluation(PDO $pdo, int $directId, int $eleveId): ?array
{
    return lire_presence_evaluation(reponse_de_l_eleve_au_direct($pdo, $directId, NUMERO_PRESENCE_DIRECT, $eleveId));
}

// « Je commence » : la graine de l'élève est tirée par le SERVEUR et son début
// posé — une fois ; un second appel (double clic, autre appareil) rend la
// même ligne, jamais une autre graine. Refusé après la fermeture.
function commencer_evaluation(PDO $pdo, array $evaluation, int $eleveId): ?array
{
    $deja = presence_evaluation($pdo, (int)$evaluation['id'], $eleveId);
    if ($deja !== null) return $deja;
    if (evaluation_fermee($evaluation)) return null;
    $ligne = random_int(0, 4294967295) . '|' . time();
    if (pilote($pdo) === 'mysql') {
        $sql = 'INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE reponse = reponse';
    } else {
        $sql = 'INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (?, ?, ?, ?)
                ON CONFLICT(direct_id, numero, eleve_id) DO NOTHING';
    }
    $pdo->prepare($sql)->execute([(int)$evaluation['id'], NUMERO_PRESENCE_DIRECT, $eleveId, $ligne]);
    return presence_evaluation($pdo, (int)$evaluation['id'], $eleveId);
}

// Le nombre de réponses déjà rangées (numéro 1 et plus) et le prochain numéro.
function reponses_evaluation_de_l_eleve(PDO $pdo, int $directId, int $eleveId): array
{
    $requete = $pdo->prepare('SELECT numero, reponse FROM directs_reponses WHERE direct_id = ? AND eleve_id = ? AND numero >= 1 ORDER BY numero');
    $requete->execute([$directId, $eleveId]);
    $reponses = [];
    foreach ($requete->fetchAll() as $ligne) $reponses[(string)(int)$ligne['numero']] = (string)$ligne['reponse'];
    $requete->closeCursor();
    return $reponses;
}

// La fenêtre de l'élève est-elle close ? Début + N × secondes (par question)
// ou + secondes (en tout), plus la marge ; sans chrono, seule la fermeture
// de l'évaluation compte.
function fenetre_evaluation_close(array $evaluation, array $presence, ?int $maintenant = null): bool
{
    $reglage = $evaluation['reglage'];
    $chrono = (string)($reglage['chrono'] ?? 'sans');
    if ($chrono === 'sans') return false;
    $secondes = (int)($reglage['secondes'] ?? 0);
    $duree = $chrono === 'question' ? (int)($reglage['n'] ?? 0) * $secondes : $secondes;
    return ($maintenant ?? time()) > $presence['debut'] + $duree + MARGE_FENETRE_EVALUATION;
}

// Range la réponse à la question n° numero — SEULEMENT la suivante, une seule
// fois (clé unique séance × numéro × élève : la première arrivée reste, un
// double envoi ne change rien). La valeur est vérifiée par le type « entier »
// de la séance en direct (vide : pas de réponse) ; les dixièmes sont bornés.
function repondre_evaluation(PDO $pdo, array $evaluation, int $eleveId, int $numero, string $valeur, int $dixiemes): bool
{
    $n = (int)($evaluation['reglage']['n'] ?? 0);
    if ($numero < 1 || $numero > $n) return false;
    $deja = reponses_evaluation_de_l_eleve($pdo, (int)$evaluation['id'], $eleveId);
    if (count($deja) + 1 !== $numero) return false;
    $reponse = $valeur . '|' . max(0, min(999999, $dixiemes));
    if (pilote($pdo) === 'mysql') {
        $sql = 'INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE reponse = reponse';
    } else {
        $sql = 'INSERT INTO directs_reponses (direct_id, numero, eleve_id, reponse) VALUES (?, ?, ?, ?)
                ON CONFLICT(direct_id, numero, eleve_id) DO NOTHING';
    }
    $requete = $pdo->prepare($sql);
    $requete->execute([(int)$evaluation['id'], $numero, $eleveId, $reponse]);
    return true;
}

// « J'ai fini » : le drapeau sur la ligne de présence. Posé aussi par le
// serveur quand la dernière réponse arrive.
function finir_evaluation(PDO $pdo, array $evaluation, int $eleveId, array $presence): void
{
    if ($presence['fini']) return;
    $pdo->prepare('UPDATE directs_reponses SET reponse = ? WHERE direct_id = ? AND numero = ? AND eleve_id = ?')
        ->execute([$presence['graine'] . '|' . $presence['debut'] . '|1', (int)$evaluation['id'], NUMERO_PRESENCE_DIRECT, $eleveId]);
}

// Le modèle tel que l'appli et Ma classe le reçoivent (sans la fin ni la
// durée : ce sont des affaires de serveur).
function modele_de_l_evaluation(array $evaluation): array
{
    $reglage = $evaluation['reglage'];
    $modele = [];
    foreach (['tables', 'types', 'n', 'chrono', 'secondes', 'tirage', 'exclus', 'imposes'] as $cle) {
        $modele[$cle] = $reglage[$cle] ?? null;
    }
    return $modele;
}

// Ce que l'ÉLÈVE reçoit : l'état, le modèle, et — s'il a commencé — SES deux
// graines, ses propres réponses, le temps écoulé. Jamais un compteur, jamais
// une autre copie, jamais une correction (le serveur n'en a pas).
function etat_evaluation_pour_l_eleve(PDO $pdo, array $evaluation, int $eleveId): array
{
    $presence = presence_evaluation($pdo, (int)$evaluation['id'], $eleveId);
    $reponses = $presence === null ? [] : reponses_evaluation_de_l_eleve($pdo, (int)$evaluation['id'], $eleveId);
    $n = (int)($evaluation['reglage']['n'] ?? 0);
    $fini = $presence !== null && ($presence['fini'] || count($reponses) >= $n);
    $fermee = evaluation_fermee($evaluation);
    $close = $presence !== null && !$fini && ($fermee || fenetre_evaluation_close($evaluation, $presence));
    return [
        'etat' => $fermee ? 'fermee' : 'ouverte',
        'nom' => (string)($evaluation['reglage']['nom'] ?? ''),
        'modele' => modele_de_l_evaluation($evaluation),
        'commence' => $presence !== null,
        'fini' => $fini,
        // La fenêtre de l'élève est passée (chrono) ou l'évaluation fermée
        // avant sa dernière réponse : pour lui c'est terminé, en l'état.
        'close' => $close,
        'suivant' => $presence === null ? null : min($n, count($reponses) + 1),
        'graines' => $presence === null ? null : ['seance' => (int)$evaluation['reglage']['graine'], 'eleve' => $presence['graine']],
        'reponses' => (object)$reponses,
        'ecoule' => $presence === null ? null : max(0, time() - $presence['debut']),
    ];
}

// Ce que MA CLASSE reçoit en boucle : les compteurs, sans aucun nom.
function etat_evaluation_pour_la_classe(PDO $pdo, array $evaluation): array
{
    $directId = (int)$evaluation['id'];
    $n = (int)($evaluation['reglage']['n'] ?? 0);
    $requete = $pdo->prepare('SELECT COUNT(*) FROM eleves WHERE classe_id = ?');
    $requete->execute([(int)$evaluation['classe_id']]);
    $inscrits = (int)$requete->fetchColumn();
    $requete->closeCursor();
    $requete = $pdo->prepare('SELECT eleve_id, reponse FROM directs_reponses WHERE direct_id = ? AND numero = ?');
    $requete->execute([$directId, NUMERO_PRESENCE_DIRECT]);
    $presences = [];
    foreach ($requete->fetchAll() as $ligne) $presences[(int)$ligne['eleve_id']] = lire_presence_evaluation((string)$ligne['reponse']);
    $requete->closeCursor();
    $requete = $pdo->prepare('SELECT eleve_id, COUNT(*) AS combien FROM directs_reponses WHERE direct_id = ? AND numero >= 1 GROUP BY eleve_id');
    $requete->execute([$directId]);
    $finis = 0;
    $parEleve = [];
    foreach ($requete->fetchAll() as $ligne) $parEleve[(int)$ligne['eleve_id']] = (int)$ligne['combien'];
    $requete->closeCursor();
    foreach ($presences as $eleveId => $presence) {
        if (($presence['fini'] ?? false) || ($parEleve[$eleveId] ?? 0) >= $n) $finis += 1;
    }
    $fin = (int)($evaluation['reglage']['fin'] ?? 0);
    return [
        'etat' => evaluation_fermee($evaluation) ? 'fermee' : 'ouverte',
        'nom' => (string)($evaluation['reglage']['nom'] ?? ''),
        'modele' => modele_de_l_evaluation($evaluation),
        'revision' => (int)$evaluation['revision'],
        'ouvert_le' => (int)$evaluation['ouvert_le'],
        'fin' => $fin,
        'expire_le' => (int)$evaluation['expire_le'],
        'inscrits' => $inscrits,
        'commences' => count($presences),
        'finis' => $finis,
    ];
}

// Tout ce qu'il faut à Ma classe pour corriger et fabriquer le fichier : la
// graine de l'évaluation, le modèle, et par élève sa graine, son début, ses
// réponses. C'est le seul endroit du lot où un prénom voyage à côté de
// réponses — vers le professeur qui a la classe en écriture.
function contenu_evaluation(PDO $pdo, array $evaluation): array
{
    $directId = (int)$evaluation['id'];
    $requete = $pdo->prepare('SELECT eleve_id, numero, reponse FROM directs_reponses WHERE direct_id = ?');
    $requete->execute([$directId]);
    $presences = [];
    $reponses = [];
    foreach ($requete->fetchAll() as $ligne) {
        $eleveId = (int)$ligne['eleve_id'];
        if ((int)$ligne['numero'] === NUMERO_PRESENCE_DIRECT) $presences[$eleveId] = lire_presence_evaluation((string)$ligne['reponse']);
        else $reponses[$eleveId][(string)(int)$ligne['numero']] = (string)$ligne['reponse'];
    }
    $requete->closeCursor();
    $requete = $pdo->prepare("SELECT id, prenom, initiale FROM eleves WHERE classe_id = ? ORDER BY prenom = '', prenom, code");
    $requete->execute([(int)$evaluation['classe_id']]);
    $eleves = [];
    foreach ($requete->fetchAll() as $ligne) {
        $presence = $presences[(int)$ligne['id']] ?? null;
        $eleves[] = [
            'prenom' => (string)$ligne['prenom'],
            'initiale' => (string)$ligne['initiale'],
            'graine' => $presence['graine'] ?? null,
            'debut' => $presence['debut'] ?? null,
            'fini' => $presence['fini'] ?? false,
            'reponses' => (object)($reponses[(int)$ligne['id']] ?? []),
        ];
    }
    $requete->closeCursor();
    return [
        'nom' => (string)($evaluation['reglage']['nom'] ?? ''),
        'modele' => modele_de_l_evaluation($evaluation),
        'graine' => (int)$evaluation['reglage']['graine'],
        'ouvert_le' => (int)$evaluation['ouvert_le'],
        'fin' => (int)($evaluation['reglage']['fin'] ?? 0),
        'eleves' => $eleves,
    ];
}
