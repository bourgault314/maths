<?php
// Comptes prof : mot de passe haché, session par jeton à durée limitée.

declare(strict_types=1);

const DUREE_SESSION_HEURES = 12;

function creer_prof(PDO $pdo, string $identifiant, string $motdepasse, bool $admin = false): int
{
    $identifiant = trim($identifiant);
    if ($identifiant === '' || mb_strlen($identifiant) > 40) {
        throw new InvalidArgumentException("Identifiant invalide.");
    }
    if (strlen($motdepasse) < 12) {
        throw new InvalidArgumentException("Le mot de passe doit faire au moins 12 caractères.");
    }
    $existe = $pdo->prepare('SELECT id FROM profs WHERE identifiant = ?');
    $existe->execute([$identifiant]);
    if ($existe->fetchColumn() !== false) {
        throw new InvalidArgumentException("Cet identifiant est déjà pris.");
    }
    $pdo->prepare('INSERT INTO profs (identifiant, mdp_hash, admin, cree_le) VALUES (?, ?, ?, ?)')
        ->execute([$identifiant, password_hash($motdepasse, PASSWORD_DEFAULT), $admin ? 1 : 0, maintenant()]);
    return (int)$pdo->lastInsertId();
}

function ouvrir_session(PDO $pdo, string $identifiant, string $motdepasse): ?array
{
    $requete = $pdo->prepare('SELECT id, mdp_hash FROM profs WHERE identifiant = ?');
    $requete->execute([trim($identifiant)]);
    $prof = $requete->fetch();
    // Vérification à temps constant même si l'identifiant n'existe pas.
    $hash = $prof['mdp_hash'] ?? '$2y$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    if (!password_verify($motdepasse, $hash) || $prof === false) {
        return null;
    }
    $jeton = bin2hex(random_bytes(32));
    $expire = gmdate('Y-m-d\TH:i:s\Z', time() + DUREE_SESSION_HEURES * 3600);
    $pdo->prepare('INSERT INTO sessions_prof (jeton_hash, prof_id, expire_le) VALUES (?, ?, ?)')
        ->execute([hash('sha256', $jeton), (int)$prof['id'], $expire]);
    $pdo->prepare('DELETE FROM sessions_prof WHERE expire_le < ?')->execute([maintenant()]);
    return ['jeton' => $jeton, 'expire_le' => $expire];
}

function prof_de_session(PDO $pdo, string $jeton): ?int
{
    if ($jeton === '') return null;
    $requete = $pdo->prepare('SELECT prof_id, expire_le FROM sessions_prof WHERE jeton_hash = ?');
    $requete->execute([hash('sha256', $jeton)]);
    $session = $requete->fetch();
    if ($session === false) return null;
    if ($session['expire_le'] < maintenant()) {
        $pdo->prepare('DELETE FROM sessions_prof WHERE jeton_hash = ?')->execute([hash('sha256', $jeton)]);
        return null;
    }
    return (int)$session['prof_id'];
}

function fermer_session(PDO $pdo, string $jeton): void
{
    $pdo->prepare('DELETE FROM sessions_prof WHERE jeton_hash = ?')->execute([hash('sha256', $jeton)]);
}

function jeton_recu(array $corps): string
{
    $entete = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($entete, 'Bearer ')) return substr($entete, 7);
    return (string)($corps['jeton'] ?? $_GET['jeton'] ?? '');
}
