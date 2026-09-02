<?php
// Comptes prof : mot de passe haché, session par jeton à durée limitée.

declare(strict_types=1);

// Pour oublier_compteurs_du_code() à la suppression d'un compte.
require_once __DIR__ . '/limite.php';

const DUREE_SESSION_HEURES = 12;
// Les comptes sont hachés en bcrypt à coût fixe : le coût par défaut de PHP
// change d'une version à l'autre (10 en 8.2, 12 en 8.4) et le hachage de
// remplacement ci-dessous doit coûter exactement le même temps qu'un compte.
const COUT_BCRYPT = 10;
// password_hash() d'une valeur aléatoire jetée, coût 10 : aucun mot de passe
// ne lui correspond, mais password_verify() met le même temps à le dire.
const HASH_DE_REMPLACEMENT = '$2y$10$W34TaICveBz/iuy8Y4cjmui7TjnGnYY.R5iJ2W4MVC58NYV..KEEO';

// Ce qu'on demande à un mot de passe : la LONGUEUR (12 caractères au moins),
// pas des majuscules ou des symboles imposés — c'est la recommandation actuelle
// (ANSSI, NIST) : une phrase longue vaut mieux qu'un « P@ssw0rd! » ; et le
// serveur freine à 12 essais par 10 minutes, ce qui rend la devinette en ligne
// impossible. Deux refus de bon sens seulement : rien que des chiffres (une
// date, un téléphone) et l'identifiant dedans. Renvoie le reproche, ou null.
function motdepasse_refuse(string $motdepasse, string $identifiant): ?string
{
    if (strlen($motdepasse) < 12) {
        return "Le mot de passe doit faire au moins 12 caractères.";
    }
    if (ctype_digit($motdepasse)) {
        return "Un mot de passe fait seulement de chiffres (date, téléphone…) est trop facile à deviner.";
    }
    $identifiant = trim($identifiant);
    if ($identifiant !== '' && mb_strlen($identifiant) >= 3 && mb_stripos($motdepasse, $identifiant) !== false) {
        return "Le mot de passe ne doit pas contenir l'identifiant.";
    }
    return null;
}

function creer_prof(PDO $pdo, string $identifiant, string $motdepasse, bool $admin = false, bool $temporaire = false): int
{
    $identifiant = trim($identifiant);
    if ($identifiant === '' || mb_strlen($identifiant) > 40) {
        throw new InvalidArgumentException("Identifiant invalide.");
    }
    if (($reproche = motdepasse_refuse($motdepasse, $identifiant)) !== null) {
        throw new InvalidArgumentException($reproche);
    }
    $existe = $pdo->prepare('SELECT id FROM profs WHERE identifiant = ?');
    $existe->execute([$identifiant]);
    if ($existe->fetchColumn() !== false) {
        throw new InvalidArgumentException("Cet identifiant est déjà pris.");
    }
    $pdo->prepare('INSERT INTO profs (identifiant, mdp_hash, admin, mdp_temporaire, cree_le) VALUES (?, ?, ?, ?, ?)')
        ->execute([$identifiant, hacher_motdepasse($motdepasse), $admin ? 1 : 0, $temporaire ? 1 : 0, maintenant()]);
    return (int)$pdo->lastInsertId();
}

// Un compte pour un collègue : l'administrateur ne choisit pas son mot de
// passe — le serveur en tire un temporaire, rendu une seule fois, que le
// collègue remplace à sa première connexion. L'administrateur ne connaît donc
// jamais le vrai mot de passe de personne.
function creer_prof_temporaire(PDO $pdo, string $identifiant): array
{
    // Retiré si, par hasard, il contenait l'identifiant.
    do {
        $temporaire = motdepasse_temporaire();
    } while (motdepasse_refuse($temporaire, $identifiant) !== null);
    $id = creer_prof($pdo, $identifiant, $temporaire, false, true);
    return ['id' => $id, 'motdepasse' => $temporaire];
}

function hacher_motdepasse(string $motdepasse): string
{
    return password_hash($motdepasse, PASSWORD_BCRYPT, ['cost' => COUT_BCRYPT]);
}

// Un mot de passe temporaire lisible à voix haute : douze caractères en trois
// groupes, sans les lettres qu'on confond avec des chiffres (l, o, i, 0, 1).
// Trente et un signes possibles à chaque place : plus de 2^59 combinaisons.
function motdepasse_temporaire(): string
{
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    $groupes = [];
    for ($g = 0; $g < 3; $g++) {
        $groupe = '';
        for ($i = 0; $i < 4; $i++) $groupe .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        $groupes[] = $groupe;
    }
    return implode('-', $groupes);
}

function ouvrir_session(PDO $pdo, string $identifiant, string $motdepasse): ?array
{
    $requete = $pdo->prepare('SELECT id, mdp_hash, actif, mdp_temporaire FROM profs WHERE identifiant = ?');
    $requete->execute([trim($identifiant)]);
    $prof = $requete->fetch();
    // Vérification à temps constant même si l'identifiant n'existe pas : le
    // hachage de remplacement est un VRAI bcrypt (même algorithme, même coût
    // que les comptes), pour que password_verify() prenne le même temps.
    // L'ancien faux hachage était mal formé : refusé sans calcul, il révélait
    // en 60 ms qu'un identifiant n'existait pas, contre 227 ms sinon.
    $hash = $prof['mdp_hash'] ?? HASH_DE_REMPLACEMENT;
    $bon = password_verify($motdepasse, $hash);
    // Un compte désactivé est refusé APRÈS le hachage, avec le même « non »
    // qu'un mauvais mot de passe : rien ne dit de dehors qu'il existe encore.
    if (!$bon || $prof === false || (int)$prof['actif'] !== 1) {
        return null;
    }
    $jeton = bin2hex(random_bytes(32));
    $expire = gmdate('Y-m-d\TH:i:s\Z', time() + DUREE_SESSION_HEURES * 3600);
    $pdo->prepare('INSERT INTO sessions_prof (jeton_hash, prof_id, expire_le) VALUES (?, ?, ?)')
        ->execute([hash('sha256', $jeton), (int)$prof['id'], $expire]);
    $pdo->prepare('DELETE FROM sessions_prof WHERE expire_le < ?')->execute([maintenant()]);
    return ['jeton' => $jeton, 'expire_le' => $expire, 'mdp_temporaire' => (int)$prof['mdp_temporaire'] === 1];
}

// Le professeur change son propre mot de passe : l'ancien doit être le bon, le
// nouveau fait au moins 12 caractères et n'est pas l'ancien. Les AUTRES
// sessions du compte sont fermées (un jeton volé ne survit pas au changement) ;
// celle qui fait le changement reste ouverte. Un mot de passe temporaire cesse
// de l'être.
function changer_motdepasse(PDO $pdo, int $profId, string $jetonCourant, string $ancien, string $nouveau): void
{
    $requete = $pdo->prepare('SELECT mdp_hash, identifiant FROM profs WHERE id = ?');
    $requete->execute([$profId]);
    $prof = $requete->fetch();
    if ($prof === false || !password_verify($ancien, (string)$prof['mdp_hash'])) {
        throw new InvalidArgumentException("L'ancien mot de passe est incorrect.");
    }
    if (($reproche = motdepasse_refuse($nouveau, (string)$prof['identifiant'])) !== null) {
        throw new InvalidArgumentException($reproche);
    }
    if ($nouveau === $ancien) {
        throw new InvalidArgumentException("Le nouveau mot de passe doit être différent de l'ancien.");
    }
    $pdo->prepare('UPDATE profs SET mdp_hash = ?, mdp_temporaire = 0 WHERE id = ?')
        ->execute([hacher_motdepasse($nouveau), $profId]);
    $pdo->prepare('DELETE FROM sessions_prof WHERE prof_id = ? AND jeton_hash <> ?')
        ->execute([$profId, hash('sha256', $jetonCourant)]);
}

// L'administrateur donne un mot de passe temporaire à un collègue qui a perdu
// le sien : toutes ses sessions sont fermées, et il devra en choisir un
// nouveau avant de faire quoi que ce soit d'autre (mdp_temporaire = 1, tenu
// par api/prof.php). Renvoie le mot de passe en clair, une seule fois.
function reinitialiser_motdepasse(PDO $pdo, int $profId): string
{
    $temporaire = motdepasse_temporaire();
    $pdo->prepare('UPDATE profs SET mdp_hash = ?, mdp_temporaire = 1 WHERE id = ?')
        ->execute([hacher_motdepasse($temporaire), $profId]);
    fermer_sessions_du_prof($pdo, $profId);
    return $temporaire;
}

function fermer_sessions_du_prof(PDO $pdo, int $profId): void
{
    $pdo->prepare('DELETE FROM sessions_prof WHERE prof_id = ?')->execute([$profId]);
}

// Ce qu'un compte possède : ses classes et les élèves qu'elles contiennent.
function possessions_du_prof(PDO $pdo, int $profId): array
{
    $classes = $pdo->prepare('SELECT COUNT(*) FROM classes WHERE prof_id = ?');
    $classes->execute([$profId]);
    $eleves = $pdo->prepare('SELECT COUNT(*) FROM eleves WHERE classe_id IN (SELECT id FROM classes WHERE prof_id = ?)');
    $eleves->execute([$profId]);
    return ['classes' => (int)$classes->fetchColumn(), 'eleves' => (int)$eleves->fetchColumn()];
}

// Supprimer un compte, tout ou rien : ses sessions, les partages qu'il a reçus,
// et — s'il en possède — ses classes avec leurs élèves, leurs progressions,
// leurs partages et leurs compteurs. Rien d'orphelin ne reste.
function supprimer_prof(PDO $pdo, int $profId): void
{
    $pdo->beginTransaction();
    try {
        $requete = $pdo->prepare('SELECT id FROM classes WHERE prof_id = ?');
        $requete->execute([$profId]);
        foreach ($requete->fetchAll() as $classe) {
            $classeId = (int)$classe['id'];
            $elevesDeLaClasse = $pdo->prepare('SELECT id, code FROM eleves WHERE classe_id = ?');
            $elevesDeLaClasse->execute([$classeId]);
            foreach ($elevesDeLaClasse->fetchAll() as $eleve) {
                $pdo->prepare('DELETE FROM progressions WHERE eleve_id = ?')->execute([(int)$eleve['id']]);
                oublier_compteurs_du_code($pdo, (string)$eleve['code']);
            }
            $pdo->prepare('DELETE FROM eleves WHERE classe_id = ?')->execute([$classeId]);
            $pdo->prepare('DELETE FROM partages WHERE classe_id = ?')->execute([$classeId]);
            $pdo->prepare('DELETE FROM classes WHERE id = ?')->execute([$classeId]);
        }
        $pdo->prepare('DELETE FROM partages WHERE prof_id = ?')->execute([$profId]);
        $pdo->prepare('DELETE FROM sessions_prof WHERE prof_id = ?')->execute([$profId]);
        $pdo->prepare('DELETE FROM profs WHERE id = ?')->execute([$profId]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
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
