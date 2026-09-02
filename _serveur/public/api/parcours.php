<?php
// API élève : lire et enregistrer une progression, à partir du seul code élève.
//
// Le serveur ne comprend PAS le contenu de la progression : il range un texte
// JSON tel qu'il lui arrive. C'est l'appli qui sait le lire, et c'est ce qui
// permettra de réutiliser ce serveur pour Automatismes sans y toucher.

declare(strict_types=1);

require __DIR__ . '/../lib/bd.php';
require __DIR__ . '/../lib/reponse.php';
require __DIR__ . '/../lib/codes.php';
require __DIR__ . '/../lib/limite.php';
require __DIR__ . '/../lib/applis.php';
require __DIR__ . '/../lib/progression.php';

const TAILLE_MAX_PROGRESSION = 40000; // octets
const APPLIS_CONNUES = ['defi-tables', 'automatismes'];

function lire_progression(PDO $pdo, int $eleveId, string $appli): ?array
{
    $requete = $pdo->prepare('SELECT donnees, maj_le, revision FROM progressions WHERE eleve_id = ? AND appli = ?');
    $requete->execute([$eleveId, $appli]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    if ($ligne === false) return null;
    return [
        // Décodé en objets, pas en tableaux associatifs : « {} » doit ressortir
        // « {} », pas « [] » — l'appli relit exactement ce qu'elle a envoyé.
        'parcours' => json_decode($ligne['donnees'], false),
        'maj_le' => $ligne['maj_le'],
        'revision' => (int)$ligne['revision'],
    ];
}

// Écriture avec numéro de révision.
//  1. Création optimiste, hors transaction : si la ligne n'existe pas, elle est
//     créée en révision 1. Deux premiers envois simultanés se heurtent à la clé
//     unique ; le second continue comme une mise à jour. (Prendre d'abord un
//     verrou sur une ligne absente ferait s'interbloquer InnoDB : constaté avec
//     vingt créations simultanées.)
//  2. Mise à jour dans une transaction qui verrouille LA ligne (SELECT … FOR
//     UPDATE sur MySQL, BEGIN IMMEDIATE sur SQLite) : $base différente de la
//     révision en base → conflit, avec l'état actuel pour que l'appli
//     fusionne ; sinon la version précédente est gardée dans
//     donnees_avant (« Restaurer la version précédente » dans Ma classe), et la
//     révision monte d'un cran.
//  3. Un interblocage ou un verrou refusé se réessaie deux fois.
function ecrire_progression(PDO $pdo, int $eleveId, string $appli, string $donnees, int $base): array
{
    for ($tentative = 1; ; $tentative++) {
        try {
            return ecrire_progression_une_fois($pdo, $eleveId, $appli, $donnees, $base);
        } catch (PDOException $e) {
            transaction_annuler($pdo);
            if ($tentative >= 3 || !verrou_refuse($e)) throw $e;
            usleep(random_int(20000, 80000));
        }
    }
}

function doublon(PDOException $e): bool
{
    return (string)$e->getCode() === '23000';
}

function verrou_refuse(PDOException $e): bool
{
    $message = $e->getMessage();
    return (string)$e->getCode() === '40001' || str_contains($message, '1213') || str_contains($message, 'database is locked');
}

// La transaction, selon le moteur. Sur MySQL, celle de PDO. Sur SQLite,
// BEGIN IMMEDIATE prend le verrou d'écriture tout de suite (une transaction
// ordinaire qui passe de lecture à écriture se fait refuser net au lieu
// d'attendre son tour). Mais PDO ne voit pas ce BEGIN écrit en SQL avant
// PHP 8.4 : ses commit() et rollBack() répondent « There is no active
// transaction » — trouvé par la CI, sur PHP 8.2, dès son premier passage.
// On termine donc la transaction SQLite comme on l'a ouverte : en SQL.
function transaction_ouvrir(PDO $pdo): void
{
    if (pilote($pdo) === 'mysql') $pdo->beginTransaction(); else $pdo->exec('BEGIN IMMEDIATE');
}

function transaction_valider(PDO $pdo): void
{
    if (pilote($pdo) === 'mysql') $pdo->commit(); else $pdo->exec('COMMIT');
}

function transaction_annuler(PDO $pdo): void
{
    if (pilote($pdo) === 'mysql') {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return;
    }
    try {
        $pdo->exec('ROLLBACK');
    } catch (PDOException) {
        // Aucune transaction ouverte : rien à annuler.
    }
}

function ecrire_progression_une_fois(PDO $pdo, int $eleveId, string $appli, string $donnees, int $base): array
{
    $maj = aujourdhui();
    $mysql = pilote($pdo) === 'mysql';

    try {
        $pdo->prepare('INSERT INTO progressions (eleve_id, appli, donnees, maj_le, revision, donnees_avant) VALUES (?, ?, ?, ?, 1, NULL)')
            ->execute([$eleveId, $appli, $donnees, $maj]);
        return ['revision' => 1, 'maj_le' => $maj];
    } catch (PDOException $e) {
        if (!doublon($e)) throw $e;
        // La ligne existe (peut-être depuis une milliseconde) : mise à jour.
    }

    transaction_ouvrir($pdo);
    $requete = $pdo->prepare('SELECT id, revision, donnees, maj_le FROM progressions WHERE eleve_id = ? AND appli = ?'
        . ($mysql ? ' FOR UPDATE' : ''));
    $requete->execute([$eleveId, $appli]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    if ($ligne === false) {
        // Supprimée entre-temps : on laisse la boucle réessayer la création.
        transaction_annuler($pdo);
        throw new PDOException('database is locked (ligne disparue)', 0);
    }
    $revision = (int)$ligne['revision'];
    if ($base !== $revision) {
        transaction_annuler($pdo);
        return ['conflit' => true, 'actuel' => [
            'parcours' => json_decode($ligne['donnees'], false),
            'maj_le' => $ligne['maj_le'],
            'revision' => $revision,
        ]];
    }
    $requete = $pdo->prepare('UPDATE progressions SET donnees_avant = ?, donnees = ?, revision = ?, maj_le = ? WHERE id = ? AND revision = ?');
    $requete->execute([$ligne['donnees'], $donnees, $revision + 1, $maj, (int)$ligne['id'], $revision]);
    if ($requete->rowCount() !== 1) {
        transaction_annuler($pdo);
        $actuel = lire_progression($pdo, $eleveId, $appli);
        return ['conflit' => true, 'actuel' => $actuel ?? ['parcours' => null, 'maj_le' => null, 'revision' => 0]];
    }
    transaction_valider($pdo);
    return ['revision' => $revision + 1, 'maj_le' => $maj];
}

cors();

try {
    // Le code n'arrive QUE dans le corps d'un POST : une adresse s'inscrit en
    // clair dans les journaux de l'hébergeur, un corps non. L'ancien
    // « GET ?code=… » de dépannage a disparu pour cette raison.
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(TAILLE_MAX_PROGRESSION + 4000);

    $code = normaliser_code(is_string($corps['code'] ?? null) ? $corps['code'] : '');
    if (!code_valide($code)) {
        erreur("Code élève invalide.", 400);
    }
    $appli = (string)($corps['appli'] ?? 'defi-tables');
    if (!in_array($appli, APPLIS_CONNUES, true)) {
        erreur("Application inconnue.", 400);
    }

    // Par adresse, seuls les échecs comptent (voir eleve.php) ; par code, la
    // limite est large parce que l'appli envoie après chaque réponse.
    $adresse = adresse_appelante();
    limiter_deja_atteint('echec-ip:' . $adresse, 60, 300);
    limiter('code:' . $code, 300, 300);

    $pdo = bd();
    $requete = $pdo->prepare('SELECT id FROM eleves WHERE code = ?');
    $requete->execute([$code]);
    $eleve = $requete->fetch();
    // Le curseur est refermé tout de suite : sur SQLite, un SELECT laissé ouvert
    // garde un verrou de lecture, et la transaction d'écriture qui suit peut
    // alors se voir refuser d'un coup (« database is locked ») dès qu'un autre
    // envoi attend pour écrire — constaté avec vingt envois simultanés.
    $requete->closeCursor();
    if ($eleve === false) {
        // On ne dit pas si le code a existé : réponse identique dans tous les cas.
        limiter('echec-ip:' . $adresse, 60, 300);
        erreur("Code inconnu.", 404);
    }
    $eleveId = (int)$eleve['id'];

    // Lecture : POST {"code":…,"lire":true}. Renvoie aussi la révision : l'appli
    // la rendra avec son prochain envoi, et le serveur saura si elle écrit
    // par-dessus un état qu'elle n'a pas vu.
    if (!empty($corps['lire'])) {
        $ligne = lire_progression($pdo, $eleveId, $appli);
        if ($ligne === null) {
            repondre(['ok' => true, 'existe' => false, 'parcours' => null, 'maj_le' => null, 'revision' => 0]);
        }
        repondre(['ok' => true, 'existe' => true] + $ligne);
    }

    // Écriture. Les données sont relues SANS le mode associatif pour que « {} »
    // reste « {} » (voir lib/progression.php), puis filtrées : le serveur ne
    // garde que ce que l'appli déclare, jamais un prénom ni un texte libre.
    $objets = json_decode((string)file_get_contents('php://input'), false);
    $parcoursBrut = is_object($objets) ? ($objets->parcours ?? null) : null;
    if (!is_object($parcoursBrut)) {
        erreur("Progression absente.", 400);
    }
    $donnees = json_encode(filtrer_progression($appli, $parcoursBrut), JSON_UNESCAPED_UNICODE);
    if ($donnees === false) {
        erreur("Progression illisible.", 400);
    }
    if (strlen($donnees) > TAILLE_MAX_PROGRESSION) {
        erreur("Progression trop volumineuse.", 413);
    }
    // base_revision : la révision que l'appli avait lue, OBLIGATOIRE depuis le
    // lot S2 (l'appli du lot A2 l'envoie toujours). Sans elle, un client
    // écrirait par-dessus sans savoir ce qu'il écrase : refusé.
    if (!array_key_exists('base_revision', $corps) || $corps['base_revision'] === null) {
        erreur("Révision manquante.", 400);
    }
    if (!is_int($corps['base_revision']) || $corps['base_revision'] < 0) {
        erreur("Révision invalide.", 400);
    }
    $base = $corps['base_revision'];

    $resultat = ecrire_progression($pdo, $eleveId, $appli, $donnees, $base);
    if (isset($resultat['conflit'])) {
        // L'appli fusionne avec cet état, puis renvoie avec la bonne révision.
        repondre(['ok' => false, 'conflit' => true, 'erreur' => "La progression a changé entre-temps."] + $resultat['actuel'], 409);
    }
    repondre(['ok' => true, 'maj_le' => $resultat['maj_le'], 'revision' => $resultat['revision']]);
} catch (Throwable $e) {
    error_log('parcours: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
