<?php
// Limitation du nombre de requêtes, par code élève ou par adresse IP.
//
// Trois règles, apprises par l'audit du 30/08/2026 :
//  - la table « compteurs » ne contient jamais une adresse IP ni un code en
//    clair : la clé est un HMAC avec un secret du serveur ;
//  - l'incrément tient en une seule instruction SQL (UPSERT) : deux requêtes
//    simultanées ne peuvent plus ni franchir le contrôle ensemble, ni entrer
//    en collision sur un INSERT ;
//  - chaque ligne porte l'instant où sa fenêtre se ferme, et les lignes
//    fermées sont effacées à chaque appel : la table ne grossit pas sans fin
//    et une adresse IP n'y survit pas plus longtemps que sa fenêtre.

declare(strict_types=1);

// Secret servant à hacher les clés. « secret » dans config.php si présent,
// sinon le jeton d'installation, qui y est déjà : rien à ajouter chez OVH.
function secret_compteurs(): string
{
    $c = config();
    $secret = (string)($c['secret'] ?? '');
    if ($secret === '') $secret = (string)($c['jeton_installation'] ?? '');
    return $secret;
}

function cle_compteur(string $cle, int $secondes): string
{
    return 'l:' . substr(hash_hmac('sha256', $cle, secret_compteurs()), 0, 40) . ':' . $secondes;
}

// Instant (epoch) où la fenêtre courante se ferme.
function fin_de_fenetre(int $secondes): int
{
    return (intdiv(time(), $secondes) + 1) * $secondes;
}

function purger_compteurs(PDO $pdo): void
{
    $pdo->prepare('DELETE FROM compteurs WHERE fenetre < ?')->execute([time()]);
}

// Compte cet appel, et refuse (429) si la fenêtre est dépassée.
function limiter(string $cle, int $maximum, int $secondes): void
{
    $pdo = bd();
    $fin = fin_de_fenetre($secondes);
    $cle = cle_compteur($cle, $secondes);
    purger_compteurs($pdo);

    if (pilote($pdo) === 'mysql') {
        // L'ordre des deux affectations compte : « nombre » lit encore
        // l'ancienne fenêtre, puis « fenetre » est remplacée.
        $pdo->prepare(
            'INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE nombre = IF(fenetre = ?, nombre + 1, 1), fenetre = ?'
        )->execute([$cle, $fin, $fin, $fin]);
    } else {
        $pdo->prepare(
            'INSERT INTO compteurs (cle, fenetre, nombre) VALUES (?, ?, 1)
             ON CONFLICT(cle) DO UPDATE SET
               nombre = CASE WHEN fenetre = excluded.fenetre THEN nombre + 1 ELSE 1 END,
               fenetre = excluded.fenetre'
        )->execute([$cle, $fin]);
    }

    $requete = $pdo->prepare('SELECT nombre FROM compteurs WHERE cle = ?');
    $requete->execute([$cle]);
    if ((int)$requete->fetchColumn() > $maximum) {
        erreur("Trop de demandes, réessaie dans un instant.", 429);
    }
}

// Refuse (429) si la fenêtre est déjà dépassée, sans compter cet appel.
// Sert à couper court AVANT de toucher à quoi que ce soit d'autre.
function limiter_deja_atteint(string $cle, int $maximum, int $secondes): void
{
    $pdo = bd();
    $requete = $pdo->prepare('SELECT nombre FROM compteurs WHERE cle = ? AND fenetre = ?');
    $requete->execute([cle_compteur($cle, $secondes), fin_de_fenetre($secondes)]);
    $nombre = $requete->fetchColumn();
    if ($nombre !== false && (int)$nombre > $maximum) {
        erreur("Trop de demandes, réessaie dans un instant.", 429);
    }
}

// Efface les compteurs liés à un code (élève supprimé, code régénéré).
function oublier_compteurs_du_code(PDO $pdo, string $code): void
{
    foreach ([['eleve:' . $code, 300], ['code:' . $code, 300]] as [$cle, $secondes]) {
        $pdo->prepare('DELETE FROM compteurs WHERE cle = ?')->execute([cle_compteur($cle, $secondes)]);
    }
}

function adresse_appelante(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? 'inconnue');
}
