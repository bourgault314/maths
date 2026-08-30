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

const TAILLE_MAX_PROGRESSION = 40000; // octets
const APPLIS_CONNUES = ['defi-tables', 'automatismes'];

cors();

try {
    // Le code n'arrive QUE dans le corps d'un POST : une adresse s'inscrit en
    // clair dans les journaux de l'hébergeur, un corps non. L'ancien
    // « GET ?code=… » de dépannage a disparu pour cette raison.
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        erreur("Méthode non autorisée.", 405);
    }
    $corps = corps_json(TAILLE_MAX_PROGRESSION + 4000);

    $code = normaliser_code((string)($corps['code'] ?? ''));
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
    if ($eleve === false) {
        // On ne dit pas si le code a existé : réponse identique dans tous les cas.
        limiter('echec-ip:' . $adresse, 60, 300);
        erreur("Code inconnu.", 404);
    }
    $eleveId = (int)$eleve['id'];

    // Lecture : POST {"code":…,"lire":true}.
    if (!empty($corps['lire'])) {
        $requete = $pdo->prepare('SELECT donnees, maj_le FROM progressions WHERE eleve_id = ? AND appli = ?');
        $requete->execute([$eleveId, $appli]);
        $ligne = $requete->fetch();
        if ($ligne === false) {
            repondre(['ok' => true, 'existe' => false, 'parcours' => null, 'maj_le' => null]);
        }
        repondre([
            'ok' => true,
            'existe' => true,
            'parcours' => json_decode($ligne['donnees'], true),
            'maj_le' => $ligne['maj_le'],
        ]);
    }

    if (!array_key_exists('parcours', $corps) || !is_array($corps['parcours'])) {
        erreur("Progression absente.", 400);
    }
    $donnees = json_encode($corps['parcours'], JSON_UNESCAPED_UNICODE);
    if ($donnees === false) {
        erreur("Progression illisible.", 400);
    }
    if (strlen($donnees) > TAILLE_MAX_PROGRESSION) {
        erreur("Progression trop volumineuse.", 413);
    }

    $maj = aujourdhui();
    $requete = $pdo->prepare('SELECT id FROM progressions WHERE eleve_id = ? AND appli = ?');
    $requete->execute([$eleveId, $appli]);
    $existante = $requete->fetch();
    if ($existante === false) {
        $pdo->prepare('INSERT INTO progressions (eleve_id, appli, donnees, maj_le) VALUES (?, ?, ?, ?)')
            ->execute([$eleveId, $appli, $donnees, $maj]);
    } else {
        $pdo->prepare('UPDATE progressions SET donnees = ?, maj_le = ? WHERE id = ?')
            ->execute([$donnees, $maj, (int)$existante['id']]);
    }
    repondre(['ok' => true, 'maj_le' => $maj]);
} catch (Throwable $e) {
    error_log('parcours: ' . $e->getMessage());
    erreur("Le serveur n'a pas pu répondre.", 500);
}
