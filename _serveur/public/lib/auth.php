<?php
// Comptes prof : mot de passe haché, session par jeton à durée limitée.

declare(strict_types=1);

const DUREE_SESSION_HEURES = 12;
// Les comptes sont hachés en bcrypt à coût fixe : le coût par défaut de PHP
// change d'une version à l'autre (10 en 8.2, 12 en 8.4) et le hachage de
// remplacement ci-dessous doit coûter exactement le même temps qu'un compte.
const COUT_BCRYPT = 10;
// password_hash() d'une valeur aléatoire jetée, coût 10 : aucun mot de passe
// ne lui correspond, mais password_verify() met le même temps à le dire.
const HASH_DE_REMPLACEMENT = '$2y$10$W34TaICveBz/iuy8Y4cjmui7TjnGnYY.R5iJ2W4MVC58NYV..KEEO';

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
        ->execute([$identifiant, password_hash($motdepasse, PASSWORD_BCRYPT, ['cost' => COUT_BCRYPT]), $admin ? 1 : 0, maintenant()]);
    return (int)$pdo->lastInsertId();
}

function ouvrir_session(PDO $pdo, string $identifiant, string $motdepasse): ?array
{
    $requete = $pdo->prepare('SELECT id, mdp_hash FROM profs WHERE identifiant = ?');
    $requete->execute([trim($identifiant)]);
    $prof = $requete->fetch();
    // Vérification à temps constant même si l'identifiant n'existe pas : le
    // hachage de remplacement est un VRAI bcrypt (même algorithme, même coût
    // que les comptes), pour que password_verify() prenne le même temps.
    // L'ancien faux hachage était mal formé : refusé sans calcul, il révélait
    // en 60 ms qu'un identifiant n'existait pas, contre 227 ms sinon.
    $hash = $prof['mdp_hash'] ?? HASH_DE_REMPLACEMENT;
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

// Le jeton voyage dans l'en-tête Authorization ou dans le corps, jamais dans
// l'adresse : une adresse s'inscrit dans les journaux de l'hébergeur.
function jeton_recu(array $corps): string
{
    $entete = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($entete, 'Bearer ')) return substr($entete, 7);
    return (string)($corps['jeton'] ?? '');
}
