<?php
// Billets d'entrée : le code de l'élève ne voyage plus dans une adresse.
//
// Lot 3 (03/09/2026, constat C-1 de l'audit) : le lien « Défi tables » de
// l'espace élève portait le code (#code=XXXXXX). Une adresse s'inscrit dans
// l'historique du navigateur — sur un poste partagé, trente codes finissaient
// dans l'historique de Chrome, et l'historique ne s'efface pas à distance.
//
// Désormais le lien porte un BILLET : 32 caractères tirés au hasard, délivrés
// par le serveur, valables deux minutes, à usage unique. L'appli l'échange
// contre le code (api/eleve.php {billet}), range le code dans son onglet comme
// avant, et nettoie l'adresse. L'historique ne garde qu'un billet mort.
//
// Deux sortes : « entree » (l'espace élève → l'appli, rend le code) et
// « fiche » (« Voir sa fiche » dans Ma classe → la fiche en lecture seule, ne
// rend JAMAIS le code : un billet de fiche ne permet pas d'écrire).
//
// La table ne garde que l'EMPREINTE du billet (SHA-256) : une copie de la base
// ne contient aucun billet utilisable. Les billets périmés sont effacés à
// chaque appel, comme les compteurs.

declare(strict_types=1);

const DUREE_BILLET = 120; // secondes
const TYPES_BILLET = ['entree', 'fiche'];

function billet_valide(string $billet): bool
{
    return (bool)preg_match('/^[0-9a-f]{32}$/', $billet);
}

function empreinte_billet(string $billet): string
{
    return hash('sha256', $billet);
}

function purger_billets(PDO $pdo): void
{
    $pdo->prepare('DELETE FROM billets WHERE expire_le < ?')->execute([time()]);
}

// Tire un billet pour cet élève et le range (haché). Renvoie le billet en
// clair : il part une seule fois, dans la réponse à qui a montré le code (ou
// une session prof), puis dans une adresse qui ne vaut plus rien deux minutes
// plus tard.
function emettre_billet(PDO $pdo, int $eleveId, string $type): string
{
    if (!in_array($type, TYPES_BILLET, true)) {
        throw new InvalidArgumentException("Type de billet inconnu.");
    }
    purger_billets($pdo);
    $billet = bin2hex(random_bytes(16));
    $pdo->prepare('INSERT INTO billets (hash, eleve_id, type, expire_le) VALUES (?, ?, ?, ?)')
        ->execute([empreinte_billet($billet), $eleveId, $type, time() + DUREE_BILLET]);
    return $billet;
}

// Échange un billet : renvoie ['eleve_id', 'type'] et l'EFFACE, ou null s'il
// est inconnu, périmé ou déjà utilisé. L'usage unique tient à la suppression :
// deux échanges simultanés du même billet lisent la même ligne, mais un seul
// DELETE la trouve encore (rowCount = 1) ; l'autre repart avec null.
function echanger_billet(PDO $pdo, string $billet): ?array
{
    if (!billet_valide($billet)) return null;
    purger_billets($pdo);
    $hash = empreinte_billet($billet);
    $requete = $pdo->prepare('SELECT eleve_id, type, expire_le FROM billets WHERE hash = ?');
    $requete->execute([$hash]);
    $ligne = $requete->fetch();
    $requete->closeCursor();
    if ($ligne === false) return null;
    $suppression = $pdo->prepare('DELETE FROM billets WHERE hash = ?');
    $suppression->execute([$hash]);
    if ($suppression->rowCount() !== 1) return null;
    if ((int)$ligne['expire_le'] < time()) return null;
    return ['eleve_id' => (int)$ligne['eleve_id'], 'type' => (string)$ligne['type']];
}

// Un code régénéré ou un élève supprimé emporte ses billets en cours : un
// billet d'entrée émis avant la régénération rendrait sinon le NOUVEAU code.
function oublier_billets_de_l_eleve(PDO $pdo, int $eleveId): void
{
    $pdo->prepare('DELETE FROM billets WHERE eleve_id = ?')->execute([$eleveId]);
}
